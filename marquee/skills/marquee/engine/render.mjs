#!/usr/bin/env node
/* Marquee renderer: films a film.html frame by frame in headless Chrome and hands the frames to ffmpeg.
 * No packages: Node 22+ (or Bun) and Chrome and ffmpeg.
 *
 *   node render.mjs film.html                       → picture.mp4 + cues.json beside the film
 *   node render.mjs film.html --stills 2,8.5,23     → stills/st-2.jpg ... (look before you render)
 *   node render.mjs film.html --sheet               → sheet.jpg: one frame every ~2 s, to see the whole film at once
 *   node render.mjs film.html --blur 4 --fps 30     → real motion blur: 4 moments blended per frame (180° shutter)
 *   node render.mjs film.html --audio score.wav --out film.mp4   → picture + sound in one file
 *   --from 10 --to 20   render a part · --quality 92 · --chrome /path/to/chrome
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';

const argv = process.argv.slice(2);
const film = argv.find((a) => !a.startsWith('--') && !argv[argv.indexOf(a) - 1]?.startsWith('--'));
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? d : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true; };
if (!film) { console.log('usage: node render.mjs film.html [--stills 1,2] [--sheet] [--blur 4] [--fps 30] [--audio score.wav] [--out film.mp4]'); process.exit(1); }
const filmPath = resolve(film), dir = dirname(filmPath);
const FPS = Number(opt('fps', 30)), BLUR = Math.max(1, Number(opt('blur', 1))), Q = Number(opt('quality', 92));

const CHROMES = [opt('chrome', ''), process.env.CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].filter(Boolean);
const CHROME = CHROMES.find((p) => p && existsSync(p));
if (!CHROME) { console.error('Chrome not found. Install Google Chrome or pass --chrome /path/to/chrome'); process.exit(1); }

const port = 9300 + Math.floor(Math.random() * 600), profile = mkdtempSync(join(tmpdir(), 'marquee-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--hide-scrollbars', '--force-device-scale-factor=1', '--no-first-run', '--no-default-browser-check', '--allow-file-access-from-files', '--window-size=1920,1920', 'about:blank'], { stdio: 'ignore' });
const done = (code) => new Promise(() => {
  const clean = () => { try { rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); } catch {} process.exit(code); };
  if (chrome.exitCode !== null) return clean();
  chrome.once('exit', clean); setTimeout(clean, 3000); try { chrome.kill(); } catch { clean(); }
}); // never resolves: `await done(n)` stops the script here
process.on('SIGINT', () => done(130));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ver; for (let i = 0; i < 80 && !ver; i++) { try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await sleep(150); } }
if (!ver) { console.error('Chrome did not start'); await done(1); }
const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let nid = 0; const waiting = new Map(), errors = [], events = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(typeof m.data === 'string' ? m.data : m.data.toString());
  if (msg.id && waiting.has(msg.id)) { const { r, j } = waiting.get(msg.id); waiting.delete(msg.id); msg.error ? j(new Error(msg.error.message)) : r(msg.result); return; }
  if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
  events.push(msg.method);
};
const send = (method, params = {}) => new Promise((r, j) => { const id = ++nid; waiting.set(id, { r, j }); ws.send(JSON.stringify({ id, method, params })); });
const run = async (expr) => { const res = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (res.exceptionDetails) throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text); return res.result.value; };

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1080, deviceScaleFactor: 1, mobile: false });
events.length = 0;
await send('Page.navigate', { url: 'file://' + filmPath });
for (let i = 0; i < 200 && !events.includes('Page.loadEventFired'); i++) await sleep(50);
const info = await run('document.fonts.ready.then(() => window.film ? JSON.stringify({ W: film.W || 1440, H: film.H || 1080, LEN: film.LEN }) : null)');
if (!info) { console.error('film.html does not set window.film (did you call M.film?)', errors); await done(1); }
const { W, H, LEN } = JSON.parse(info);
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await sleep(100);
const cues = await run('JSON.stringify(typeof film.cues === "function" ? film.cues() : film.cues || { LEN: film.LEN })');
writeFileSync(join(dir, 'cues.json'), cues);
await run('film.seek(0)');
if (errors.length) { console.error('the film threw:', errors.slice(0, 5)); await done(1); }

const shot = async (q = Q) => Buffer.from((await send('Page.captureScreenshot', { format: 'jpeg', quality: q })).data, 'base64');
const ff = (args, input) => new Promise((r, j) => { const p = spawn('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: [input ? 'pipe' : 'ignore', 'inherit', 'inherit'] }); p.on('error', () => j(new Error('ffmpeg not found: install it (brew install ffmpeg)'))); p.on('exit', (c) => (c === 0 ? r() : j(new Error('ffmpeg failed ' + c)))); if (input) input(p.stdin); });

if (opt('stills', false)) {
  mkdirSync(join(dir, 'stills'), { recursive: true });
  for (const s of String(opt('stills')).split(',').map(Number)) { await run(`film.seek(${s})`); writeFileSync(join(dir, 'stills', `st-${s}.jpg`), await shot(88)); }
  console.log(`stills → ${join(dir, 'stills')}`, errors.length ? errors.slice(0, 3) : '');
  await done(errors.length ? 1 : 0);
}
if (opt('sheet', false)) {
  const n = 24, cols = 4, tw = 480, th = Math.round((tw * H) / W), tmp = mkdtempSync(join(tmpdir(), 'marquee-sheet-'));
  for (let i = 0; i < n; i++) { const s = +(((i + 0.5) * LEN) / n).toFixed(2); await run(`film.seek(${s})`); writeFileSync(join(tmp, `s${String(i).padStart(2, '0')}.jpg`), await shot(80)); }
  await ff(['-i', join(tmp, 's%02d.jpg'), '-vf', `scale=${tw}:${th},tile=${cols}x${n / cols}`, '-frames:v', '1', join(dir, 'sheet.jpg')]);
  rmSync(tmp, { recursive: true, force: true });
  console.log(`sheet → ${join(dir, 'sheet.jpg')} (${n} frames, ${(LEN / n).toFixed(1)} s apart)`, errors.length ? errors.slice(0, 3) : '');
  await done(0);
}

const from = Number(opt('from', 0)), to = Number(opt('to', LEN)), frames = Math.round((to - from) * FPS);
const picture = join(dir, 'picture.mp4');
const vf = BLUR > 1 ? ['-vf', `tmix=frames=${BLUR}:weights=${Array(BLUR).fill(1).join(' ')},select='not(mod(n+1\\,${BLUR}))',setpts=N/(${FPS}*TB)`, '-r', String(FPS)] : [];
const t0 = Date.now();
await ff(['-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS * BLUR), '-i', '-', ...vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', picture], async (stdin) => {
  for (let i = 0; i < frames; i++) {
    for (let k = 0; k < BLUR; k++) {
      const t = from + i / FPS + (BLUR > 1 ? (k / BLUR) * (0.5 / FPS) : 0); // 180° shutter: half the frame interval
      await run(`film.seek(${t.toFixed(5)})`);
      const buf = await shot();
      if (!stdin.write(buf)) await new Promise((r) => stdin.once('drain', r));
    }
    if (i % (FPS * 5) === 0) process.stdout.write(`\r${i}/${frames} frames · ${((Date.now() - t0) / 1000).toFixed(0)} s   `);
  }
  stdin.end();
});
console.log(`\rpicture → ${picture} (${frames} frames${BLUR > 1 ? `, motion blur ×${BLUR}` : ''}) in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
if (errors.length) console.error('the film logged errors:', errors.slice(0, 5));
const audio = opt('audio', false);
if (audio) {
  const out = resolve(String(opt('out', join(dir, basename(dir) + '.mp4'))));
  await ff(['-i', picture, '-i', resolve(String(audio)), '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', out]);
  console.log(`film → ${out}`);
}
await done(0);
