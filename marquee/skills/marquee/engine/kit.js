/* Marquee kit: the timing core every film stands on.
 *
 * The one rule: nothing moves by itself. No CSS animations, no transitions, no requestAnimationFrame.
 * Every frame is computed from the time t, so seek(12.4) always paints the same picture. That is what
 * makes the render smooth (no dropped frames) and what lets motion blur sample between frames.
 *
 * A film is: M.film({ W, H, LEN }) + scenes added with M.scene(id, a, b, update) + cues for the sound.
 */
(function () {
  const M = (window.M = {});

  // ---------- numbers ----------
  M.clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  /** progress of t through [a, b], clamped to 0..1 */
  M.p = (t, a, b) => (b === a ? (t >= a ? 1 : 0) : M.clamp((t - a) / (b - a)));
  M.lerp = (a, b, x) => a + (b - a) * x;
  M.ease = {
    linear: (x) => x,
    out2: (x) => 1 - (1 - x) * (1 - x),
    out3: (x) => 1 - Math.pow(1 - x, 3),
    out5: (x) => 1 - Math.pow(1 - x, 5),            // arrivals: fast in, long settle (the house ease)
    expo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    in3: (x) => x * x * x,                          // departures only
    io: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2), // moves from A to B, camera
    back: (x, c = 1.7) => 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2), // pops with a small overshoot
    /** a damped spring: k stiffness, z damping ratio; for things that land with life */
    spring: (x, k = 9, z = 0.55) => 1 - Math.exp(-z * k * x) * Math.cos(k * Math.sqrt(1 - z * z) * x),
  };
  /** seeded random, so every render is the same */
  M.rand = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  /** a slow, smooth wander for idle life (never random per frame: that flickers) */
  M.drift = (t, speed = 1, seed = 0) => Math.sin(t * 0.9 * speed + seed * 1.7) * 0.6 + Math.sin(t * 0.37 * speed + seed * 3.1) * 0.4;

  // ---------- DOM ----------
  M.$ = (s, r = document) => (typeof s === 'string' ? r.querySelector(s) : s);
  M.$$ = (s, r = document) => [...r.querySelectorAll(s)];
  M.html = (parent, h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); const el = d.firstElementChild; M.$(parent).appendChild(el); return el; };
  /** set an element's whole look for this frame. o opacity, x y px, s scale, r deg, rx ry 3D tilt, b blur px */
  M.set = (el, o = {}) => {
    el = M.$(el); if (!el) return;
    const { o: op = 1, x = 0, y = 0, s = 1, r = 0, rx = 0, ry = 0, b = 0, sx, sy } = o;
    el.style.opacity = op;
    el.style.visibility = op <= 0.002 ? 'hidden' : 'visible';
    el.style.transform = `translate(${x}px,${y}px)${rx || ry ? ` perspective(1400px) rotateX(${rx}deg) rotateY(${ry}deg)` : ''} rotate(${r}deg) scale(${sx ?? s},${sy ?? s})`;
    el.style.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : 'none';
  };
  /** combine looks: opacities multiply, the rest add */
  M.mix = (...looks) => looks.reduce((a, l) => ({ o: (a.o ?? 1) * (l.o ?? 1), x: (a.x || 0) + (l.x || 0), y: (a.y || 0) + (l.y || 0), s: (a.s ?? 1) * (l.s ?? 1), r: (a.r || 0) + (l.r || 0), rx: (a.rx || 0) + (l.rx || 0), ry: (a.ry || 0) + (l.ry || 0), b: (a.b || 0) + (l.b || 0) }), {});

  // ---------- the moves (each returns a look) ----------
  /** blur in: the house entrance for words and cards. Arrives at a over d, leaves at z over dz */
  M.blurIn = (t, a, z = 1e9, d = 0.55, dz = 0.4, dist = 22) => {
    const k = M.ease.out3(M.p(t, a, a + d)), q = M.ease.io(M.p(t, z, z + dz));
    return { o: k * (1 - q), y: (1 - k) * dist - q * dist * 0.6, b: (1 - k) * 14 + q * 12 };
  };
  /** pop: scale up with overshoot, for chips, icons, badges */
  M.pop = (t, a, d = 0.5, from = 0.4) => { const k = M.p(t, a, a + d); return { o: M.clamp(k * 3), s: M.lerp(from, 1, M.ease.back(k)) }; };
  /** rise: comes up from below and settles (phones, cards) */
  M.rise = (t, a, d = 0.9, dist = 120) => { const k = M.ease.out5(M.p(t, a, a + d)); return { o: M.clamp(k * 2.5), y: (1 - k) * dist, b: (1 - k) * 8 }; };
  /** leave: blurs and drifts away (use at a scene's end) */
  M.leave = (t, a, d = 0.4, dy = -14) => { const q = M.ease.io(M.p(t, a, a + d)); return { o: 1 - q, y: q * dy, b: q * 12 }; };
  /** float: idle breathing so nothing is ever dead still */
  M.float = (t, amp = 6, seed = 0) => ({ y: M.drift(t, 1.2, seed) * amp, r: M.drift(t, 0.7, seed + 9) * amp * 0.25 });

  // ---------- scenes ----------
  const scenes = [];
  /** a scene lives from a to b. update(t, v) runs only while it lives; v is its fade (0..1).
   *  fi/fo: fade in/out seconds; blur: blur px at the edges of the fade (a soft dissolve) */
  M.scene = (id, a, b, update, { fi = 0.3, fo = 0.3, blur = 10 } = {}) => {
    const el = M.$('#' + id); if (!el) throw new Error('no scene element #' + id);
    scenes.push({ el, a, b, update, fi, fo, blur });
  };
  M.vis = (t, a, b, fi = 0.3, fo = 0.3) => Math.min(fi ? M.p(t, a, a + fi) : t >= a ? 1 : 0, fo ? 1 - M.p(t, b - fo, b) : t < b ? 1 : 0);

  // ---------- typing ----------
  /** split an element's text into chars (keeps child spans for colour) and add a caret */
  M.typeable = (el) => {
    el = M.$(el); if (el._chs) return el;
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) { const f = document.createDocumentFragment(); [...n.textContent].forEach((c) => { const s = document.createElement('span'); s.className = 'm-ch'; s.textContent = c; f.appendChild(s); }); n.replaceWith(f); }
      else if (n.nodeType === 1) walk(n);
    });
    walk(el);
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el._caret = M.html(el, '<i class="m-caret"></i>');
    el._chs = M.$$('.m-ch', el);
    return el;
  };
  /** show the first n chars, caret after them */
  M.typeTo = (el, n, caret = true) => {
    el = M.typeable(el); const chs = el._chs; n = Math.max(0, Math.min(chs.length, Math.floor(n)));
    chs.forEach((c, i) => (c.style.visibility = i < n ? 'visible' : 'hidden'));
    const ref = n ? chs[n - 1] : chs[0];
    el._caret.style.left = (n ? ref.offsetLeft + ref.offsetWidth + 3 : ref.offsetLeft - 4) + 'px';
    el._caret.style.top = ref.offsetTop + ref.offsetHeight * 0.1 + 'px';
    el._caret.style.height = ref.offsetHeight * 0.8 + 'px';
    el._caret.style.opacity = caret ? 1 : 0;
  };
  M.blink = (t) => Math.floor(t * 2.2) % 2 === 0;
  /** type at cps from `at`; returns how many chars are shown. Records a cue per key. */
  M.type = (el, t, at, cps = 18, { holdCaret = 1.2 } = {}) => {
    el = M.typeable(el); const n = el._chs.length, shown = M.clamp((t - at) * cps, 0, n);
    M.typeTo(el, shown, t >= at - 0.2 && (shown < n ? true : M.blink(t) && t < at + n / cps + holdCaret));
    return shown;
  };
  M.typeCues = (at, el, cps = 18) => { el = M.typeable(el); return el._chs.map((_, i) => +(at + i / cps).toFixed(3)); };

  // ---------- words ----------
  /** wrap each word of an element in a span.m-w so it can move on its own */
  M.wordsOf = (el) => {
    el = M.$(el); if (el._ws) return el._ws;
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) { const f = document.createDocumentFragment(); n.textContent.split(/(\s+)/).forEach((w) => { if (!w) return; if (/^\s+$/.test(w)) f.appendChild(document.createTextNode(w)); else { const s = document.createElement('span'); s.className = 'm-w'; s.textContent = w; f.appendChild(s); } }); n.replaceWith(f); }
      else if (n.nodeType === 1 && !n.classList.contains('m-w')) walk(n);
    });
    walk(el); el._ws = M.$$('.m-w', el); return el._ws;
  };
  /** words blur in one after another from `at`, `gap` apart; all leave at z */
  M.words = (el, t, at, { gap = 0.13, z = 1e9, d = 0.55 } = {}) => M.wordsOf(el).forEach((w, i) => M.set(w, M.blurIn(t, at + i * gap, z, d)));

  // ---------- the film ----------
  M.cues = {};
  /** note a sound at time s: kinds the score knows are whoosh pop tap hit chime shutter success scan type thud */
  M.cue = (kind, ...times) => { const list = (M.cues[kind] ||= []); if (kind === 'riser' || kind === 'silence') list.push(...times); else list.push(...times.flat()); };
  // riser and silence take [start, end] pairs: cue('riser', [9.9, 10.85]); everything else takes times
  const frameHooks = [];
  /** run every frame regardless of scenes (the frame, the chapter bar, the dim) */
  M.every = (fn) => frameHooks.push(fn);
  let built = false; const builders = [];
  /** run once before the first frame, after fonts are ready (measure here, not at load) */
  M.build = (fn) => builders.push(fn);
  M.film = ({ W = 1440, H = 1080, LEN, chapters = [], music = {} }) => {
    document.documentElement.style.setProperty('--W', W + 'px'); document.documentElement.style.setProperty('--H', H + 'px');
    const seek = (t) => {
      if (!built) { built = true; builders.forEach((b) => b()); }
      frameHooks.forEach((h) => h(t));
      for (const s of scenes) {
        const live = t >= s.a && t < s.b; s.el.style.display = live ? 'block' : 'none'; if (!live) continue;
        const v = M.vis(t, s.a, s.b, s.fi, s.fo); s.el.style.opacity = v;
        s.el.style.filter = s.blur && v < 0.999 ? `blur(${((1 - v) * s.blur).toFixed(2)}px)` : 'none';
        s.update(t, v);
      }
    };
    const cues = () => { if (!built) { built = true; builders.forEach((b) => b()); } return { LEN, chapters: chapters.map((c) => c[1]), music, ...M.cues }; };
    window.film = { W, H, LEN, seek, cues };
    return window.film;
  };
})();
