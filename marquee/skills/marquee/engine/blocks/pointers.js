/* Pointers: a finger on a phone, a cursor on a desktop. People believe a product that is being used.
 *   const f = M.finger(parent); f.update(t, [[at, x, y], [at2, x2, y2]])   taps (press, ring)
 *   const c = M.cursor(parent); c.update(t, [[t0, x0, y0], [t1, x1, y1], ...], { clicks: [t] })  a path
 * Coordinates are in the parent's space (usually the card). Add cue('tap', at) for each tap. */
(function () {
  const M = window.M;
  M.finger = (parent) => {
    const touch = M.html(parent, '<div class="m-touch"></div>'), ring = M.html(parent, '<div class="m-ring"></div>');
    const update = (t, taps) => {
      // the tap nearest in time owns the finger
      let best = null; for (const tp of taps) if (t >= tp[0] - 0.4 && t <= tp[0] + 0.6) best = tp;
      if (!best) { M.set(touch, { o: 0 }); M.set(ring, { o: 0 }); return; }
      const [at, x, y] = best, a = M.p(t, at - 0.35, at - 0.05), d = M.p(t, at + 0.05, at + 0.35);
      touch.style.left = x + 'px'; touch.style.top = y + 'px'; ring.style.left = x + 'px'; ring.style.top = y + 'px';
      M.set(touch, { o: a * (1 - d) * 0.95, s: M.lerp(1.25, 1, M.ease.out3(a)) * (t > at - 0.05 && t < at + 0.1 ? 0.86 : 1) });
      const r = M.p(t, at, at + 0.5); M.set(ring, { o: r > 0 && r < 1 ? (1 - r) * 0.9 : 0, s: 1 + r * 1.8 });
    };
    return { update };
  };
  M.cursor = (parent, { color = '#111' } = {}) => {
    const el = M.html(parent, `<svg class="m-cursor" viewBox="0 0 24 24" style="left:0;top:0"><path d="M4 2l15 9-6.5 1.5L9 19z" fill="${color}" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`);
    const ring = M.html(parent, '<div class="m-ring" style="border-color:var(--accent);width:36px;height:36px;margin:-18px 0 0 -18px"></div>');
    /** path: [[t, x, y], ...]; moves ease in-out between points (never linear: linear reads as a robot) */
    const update = (t, path, { clicks = [], show = [path[0][0] - 0.2, 1e9] } = {}) => {
      let x = path[0][1], y = path[0][2];
      for (let i = 0; i < path.length - 1; i++) { const [t0, x0, y0] = path[i], [t1, x1, y1] = path[i + 1]; if (t >= t0) { const k = M.ease.io(M.p(t, t0, t1)); x = M.lerp(x0, x1, k); y = M.lerp(y0, y1, k) - Math.sin(k * Math.PI) * Math.min(40, Math.abs(x1 - x0) * 0.08); } }
      const press = clicks.some((c) => t > c - 0.05 && t < c + 0.08);
      M.set(el, { o: M.clamp(M.p(t, show[0], show[0] + 0.2)) * (1 - M.p(t, show[1], show[1] + 0.2)), x: x - 4, y: y - 2, s: press ? 0.85 : 1 });
      const c = clicks.find((c) => t >= c && t < c + 0.5);
      ring.style.left = x + 'px'; ring.style.top = y + 'px';
      if (c != null) { const r = M.p(t, c, c + 0.5); M.set(ring, { o: (1 - r) * 0.9, s: 1 + r * 1.6 }); } else M.set(ring, { o: 0 });
      return { x, y };
    };
    return { el, update };
  };
})();
