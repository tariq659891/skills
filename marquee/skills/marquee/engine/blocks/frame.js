/* The frame: a dark-to-colour stage, the rounded card the film plays in, and the chapter bar under it.
 * M.frame({ chapters: [['Intro', 0], ['Problem', 6.2], ['Use Case', 17.5], ['Call to Action', 38.5]], palette })
 * Returns M.CARD = { el, w, h } so scenes can be placed inside. Works at 4:3, 16:9, 9:16 and 1:1.
 * frame: false gives a full-bleed film (no card, no bar): M.CARD is then the whole stage. */
(function () {
  const M = window.M;
  M.palettes = {
    tangerine: { accent: '#ff5a1c', ink: '#24150e', soft: '#8a6f62', glow: '255,90,28',
      stage: ['#050407 0%', '#0a0605 19%', '#3d1305 44%', '#ff5a1c 62%', '#ffa070 75%', '#ffd5be 88%', '#ffece2 100%'],
      mesh: ['#ffd3bf', '#ffb48f', '#ff9466', '#efdcff', '#fff3ec'], mist: ['#ffc4a6', '#ffb08c', '#f2d6ff', '#ffc9ad', '#ff9f74', '#ffe0cf'], mistfade: '255,160,115' },
    violet: { accent: '#7b3cff', ink: '#1c1233', soft: '#7a6f93', glow: '130,70,255',
      stage: ['#05040a 0%', '#0b0718 19%', '#2a0d5c 44%', '#8a3dff 62%', '#d79cff 75%', '#f3d6ff 88%', '#fbefff 100%'],
      mesh: ['#e6d6ff', '#cdb3ff', '#ffb8e6', '#c9e4ff', '#f8f3ff'], mist: ['#d9c4ff', '#c7a8ff', '#ffc9ec', '#cfe0ff', '#b892ff', '#efe3ff'], mistfade: '170,130,255' },
    ocean: { accent: '#1677ff', ink: '#0e1b2e', soft: '#62738a', glow: '30,120,255',
      stage: ['#03060b 0%', '#050c18 19%', '#0a2452 44%', '#1677ff 62%', '#7fb6ff 75%', '#cfe3ff 88%', '#eef5ff 100%'],
      mesh: ['#d3e6ff', '#a9cdff', '#7fe0e6', '#e3dcff', '#f2f7ff'], mist: ['#bcd8ff', '#9cc6ff', '#c8f0f2', '#d7d2ff', '#7fb2ff', '#e2eeff'], mistfade: '90,150,255' },
    forest: { accent: '#16a35a', ink: '#0f2219', soft: '#5f7a6c', glow: '22,163,90',
      stage: ['#030705 0%', '#06100a 19%', '#0c3a22 44%', '#16a35a 62%', '#8fdcae 75%', '#d6f3e2 88%', '#effaf4 100%'],
      mesh: ['#d4f3e0', '#ade8c4', '#f6e7a9', '#d9ecff', '#f3fbf6'], mist: ['#bfead0', '#9fdfb8', '#f2e6b0', '#cfe6f5', '#7fd3a2', '#e3f6ea'], mistfade: '90,190,130' },
    mono: { accent: '#111111', ink: '#111111', soft: '#7a7a7a', glow: '255,255,255',
      stage: ['#050505 0%', '#0a0a0a 19%', '#222 44%', '#555 62%', '#aaa 75%', '#ddd 88%', '#f2f2f2 100%'],
      mesh: ['#eeeeee', '#e2e2e2', '#d8d8d8', '#ececf2', '#f7f7f7'], mist: ['#e4e4e4', '#d9d9d9', '#ebebf2', '#e0e0e0', '#cfcfcf', '#f0f0f0'], mistfade: '170,170,170' },
  };
  /** make a palette from one brand colour (hex). Good enough to start; tune by eye. */
  M.paletteFrom = (accent, ink = '#1b1512') => {
    const h = accent.replace('#', ''), r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    const mixc = (w, a) => '#' + [r, g, b].map((c) => Math.round(c * (1 - w) + a * w).toString(16).padStart(2, '0')).join('');
    return { accent, ink, soft: '#7d7570', glow: `${r},${g},${b}`,
      stage: ['#050407 0%', '#08070a 19%', `${mixc(0.75, 0)} 44%`, `${accent} 62%`, `${mixc(0.45, 255)} 75%`, `${mixc(0.75, 255)} 88%`, `${mixc(0.9, 255)} 100%`],
      mesh: [mixc(0.78, 255), mixc(0.6, 255), mixc(0.4, 255), '#ecebff', mixc(0.93, 255)], mist: [mixc(0.65, 255), mixc(0.55, 255), '#ebe6ff', mixc(0.7, 255), mixc(0.4, 255), mixc(0.82, 255)], mistfade: `${r},${g},${b}` };
  };

  M.frame = ({ chapters = [], palette = 'tangerine', frame = true, dimAt = null } = {}) => {
    const P = (M.PAL = typeof palette === 'string' ? M.palettes[palette] : palette);
    const root = document.documentElement.style;
    root.setProperty('--accent', P.accent); root.setProperty('--ink', P.ink); root.setProperty('--soft', P.soft);
    const { W, H } = window.film;
    const stage = M.html(document.body, `<div id="m-stage"><div id="m-glow" class="m-abs"></div><div id="m-card"></div></div>`);
    const card = M.$('#m-card');
    if (!frame) { Object.assign(card.style, { left: 0, top: 0, width: W + 'px', height: H + 'px' }); stage.style.background = '#000'; M.CARD = { el: card, w: W, h: H }; M.html(stage, '<div id="m-dim"></div>'); hookDim(dimAt); return M.CARD; }
    stage.style.background = `linear-gradient(180deg,${P.stage.join(',')})`;
    // layout by shape
    const a = W / H; let L;
    if (a > 1.5) L = { cx: 200, cy: 70, cw: W - 400, ch: 760, r: 44, py: 868, ph: 78, ty: 984, fs: 26 };              // 16:9
    else if (a > 1.1) L = { cx: 100, cy: 110, cw: W - 200, ch: 700, r: 44, py: 866, ph: 82, ty: 992, fs: 27 };          // 4:3
    else if (a > 0.9) L = { cx: 60, cy: 60, cw: W - 120, ch: 760, r: 40, py: 862, ph: 74, ty: 978, fs: 22 };            // 1:1
    else L = { cx: 60, cy: 150, cw: W - 120, ch: 1440, r: 56, py: 1650, ph: 96, ty: 1800, fs: 26 };                      // 9:16
    Object.assign(card.style, { left: L.cx + 'px', top: L.cy + 'px', width: L.cw + 'px', height: L.ch + 'px', borderRadius: L.r + 'px', boxShadow: `0 30px 90px rgba(${P.glow},.28),0 30px 80px rgba(0,0,0,.35),0 0 0 1.5px rgba(255,255,255,.55)` });
    M.$('#m-glow').style.cssText = `left:0;right:0;top:${L.cy + L.ch * 0.3}px;height:${L.ch}px;background:radial-gradient(60% 55% at 50% 70%,rgba(${P.glow},.5),transparent 70%)`;
    const edge = M.html(stage, `<div id="m-edge" style="top:${L.cy - 4}px;width:${L.cw * 0.34}px"></div>`);
    const under = M.html(stage, `<div id="m-under" style="top:${L.cy + L.ch - 10}px;width:300px;background:radial-gradient(closest-side,rgba(${P.glow},.95),rgba(${P.glow},0))"></div>`);
    const n = chapters.length, gap = 20, pw = (L.cw - 20 - gap * (n - 1)) / Math.max(1, n), px0 = L.cx + 10;
    const pills = chapters.map(([name], i) => M.html(stage, `<div class="m-pill" style="left:${px0 + i * (pw + gap)}px;top:${L.py}px;width:${pw}px;height:${L.ph}px;font-size:${L.fs}px"><span>${name}</span><div class="m-ph" style="background:linear-gradient(180deg,#fff,${P.accent});box-shadow:0 0 10px 2px rgba(${P.glow},.85),0 0 30px 6px rgba(${P.glow},.45)"></div></div>`));
    const ticks = M.html(stage, `<div id="m-ticks" style="left:${px0}px;top:${L.ty}px;width:${L.cw - 20}px"></div>`);
    const NT = Math.round((L.cw - 20) / 20); for (let i = 0; i <= NT; i++) ticks.insertAdjacentHTML('beforeend', `<i style="left:${(i * (L.cw - 22)) / NT}px"></i>`);
    const tickEls = [...ticks.children];
    M.html(stage, '<div id="m-dim"></div>');
    const LEN = window.film.LEN, starts = chapters.map((c) => c[1]).concat([LEN]);
    M.every((t) => {
      let ci = 0; for (let i = 0; i < n; i++) if (t >= starts[i]) ci = i;
      pills.forEach((p, i) => {
        const act = M.vis(t, starts[i], starts[i + 1], i === 0 ? 0 : 0.25, i === n - 1 ? 0 : 0.25);
        p.style.background = `rgb(${M.lerp(255, 15, act)},${M.lerp(255, 12, act)},${M.lerp(255, 11, act)})`;
        p.style.color = act > 0.5 ? '#fff' : '#130d0a';
        const ph = p.lastElementChild; ph.style.left = M.p(t, starts[i], starts[i + 1]) * pw + 'px'; ph.style.opacity = act;
      });
      const phx = px0 + ci * (pw + gap) + M.p(t, starts[ci], starts[ci + 1]) * pw;
      under.style.left = phx - 150 + 'px';
      edge.style.left = L.cx + L.cw * 0.33 + Math.sin(t * 0.45) * L.cw * 0.31 + 'px';
      tickEls.forEach((k, i) => { const d = Math.abs(i / NT - t / LEN) * NT, h = M.clamp(1 - d / 2.5); k.style.background = h > 0.01 ? `rgba(${P.glow},${M.lerp(0.3, 1, h)})` : 'rgba(0,0,0,.28)'; k.style.height = M.lerp(18, 22, h) + 'px'; k.style.top = M.lerp(0, -2, h) + 'px'; });
    });
    hookDim(dimAt);
    return (M.CARD = { el: card, w: L.cw, h: L.ch });
  };
  function hookDim(dimAt) { if (dimAt != null) M.every((t) => (M.$('#m-dim').style.opacity = M.ease.io(M.p(t, dimAt, window.film.LEN)) * 0.92)); }

  /** add a scene element inside the card; returns it (then give it to M.scene) */
  M.sceneEl = (id, html = '') => M.html(M.CARD.el, `<div class="m-sc" id="${id}">${html}</div>`);
})();
