/* The ring: many small things fly in from beyond the frame and orbit slowly around one line of words.
 * Use it for "it's everywhere", "too many tools", "scattered across apps": the problem as clutter.
 *   const ring = M.ring(parent, [html, html, ...], { cx, cy, rx, ry, seed })
 *   ring.update(t, at, out)   tiles arrive from `at` (staggered), drift, and blow outward at `out` */
(function () {
  const M = window.M;
  M.ring = (parent, tiles, { cx = M.CARD.w / 2, cy = M.CARD.h / 2, rx = M.CARD.w * 0.37, ry = M.CARD.h * 0.34, seed = 11, spin = 0.12, stagger = 0.055 } = {}) => {
    const R = M.rand(seed), box = M.html(parent, '<div class="m-fill"></div>');
    const els = tiles.map((h, i) => { const a = (i / tiles.length) * Math.PI * 2 + (R() - 0.5) * 0.3; const el = M.html(box, `<div class="m-abs" style="left:0;top:0">${h}</div>`); el._a = a; el._r = (R() - 0.5) * 18; return el; });
    const update = (t, at, out = 1e9) => els.forEach((el, i) => {
      if (!el._w) { el._w = el.firstElementChild.offsetWidth; el._h = el.firstElementChild.offsetHeight; }
      const k = M.ease.out5(M.p(t, at + i * stagger, at + 0.8 + i * stagger)), q = M.ease.io(M.p(t, out, out + 0.5));
      const a = el._a + (t - at) * spin, rad = M.lerp(1.9, 1, k) + q * 0.8;
      const x = cx + Math.cos(a) * rx * rad, y = cy + Math.sin(a) * ry * rad;
      M.set(el, { o: M.clamp(k * 2) * (1 - q), x: x - el._w / 2, y: y - el._h / 2, s: M.lerp(0.55, 1, k) * (1 + q * 0.2), r: el._r + Math.sin(t * 0.8 + i) * 2.5, ry: -Math.cos(a) * 14, b: (1 - k) * 12 + q * 10 });
    });
    return { el: box, els, update };
  };
  /** icons that hop from a row into an arc around a line of words (the "something" moment) */
  M.hop = (els, t, at, from, to, { gap = 0.11, moveAt = at + 0.8, out = 1e9 } = {}) => els.forEach((ic, i) => {
    const k = M.p(t, at + i * gap, at + i * gap + 0.4), m = M.ease.io(M.p(t, moveAt + i * 0.06, moveAt + 0.75 + i * 0.06)), q = M.ease.io(M.p(t, out, out + 0.4));
    const x = M.lerp(from[i][0], to[i][0], m), y = M.lerp(from[i][1], to[i][1], m) - Math.sin(m * Math.PI) * 70;
    M.set(ic, { o: M.clamp(k * 3) * (1 - q), x, y: y + (1 - M.ease.back(k)) * 30, s: M.lerp(0.3, 1, M.ease.back(k)), r: (1 - k) * -40 + m * (i % 2 ? -14 : 16), b: q * 10 });
  });
  /** a number that counts up (money, users, hours saved) */
  M.count = (el, t, a, b, to, { prefix = '', suffix = '', locale = 'en-US', decimals = 0 } = {}) => {
    const v = to * M.ease.out3(M.p(t, a, b));
    M.$(el).textContent = prefix + v.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
  };
})();
