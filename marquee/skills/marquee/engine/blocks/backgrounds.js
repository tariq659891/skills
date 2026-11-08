/* Backgrounds for inside the card. Each returns { el, tick(t) }; call tick from the scene's update.
 *   M.mesh(parent)   soft moving colour fields: product scenes, phones, logos
 *   M.paper(parent)  white with a warm mist at the bottom: every scene of words
 *   M.sky(parent)    drifting clouds over a colour wash: the last scene
 *   M.studio(parent) wall and table: a desktop or device "in a room" */
(function () {
  const M = window.M;
  M.mesh = (parent, colors = M.PAL.mesh, phase = 0) => {
    const [c1, c2, c3, c4, base] = colors;
    const el = M.html(parent, `<div class="m-mesh" style="background:
      radial-gradient(38% 48% at var(--x1) var(--y1),${c1} 0%,transparent 100%),
      radial-gradient(44% 52% at var(--x2) var(--y2),${c2} 0%,transparent 100%),
      radial-gradient(48% 50% at var(--x3) var(--y3),${c3} 0%,transparent 100%),
      radial-gradient(40% 42% at var(--x4) var(--y4),${c4} 0%,transparent 100%),${base}"></div>`);
    const tick = (t) => {
      const s = el.style, ph = phase;
      s.setProperty('--x1', 18 + 8 * Math.sin(t * 0.5 + ph) + '%'); s.setProperty('--y1', 28 + 6 * Math.cos(t * 0.4 + ph) + '%');
      s.setProperty('--x2', 82 + 7 * Math.sin(t * 0.37 + 1 + ph) + '%'); s.setProperty('--y2', 22 + 8 * Math.sin(t * 0.45 + ph) + '%');
      s.setProperty('--x3', 66 + 9 * Math.cos(t * 0.33 + ph) + '%'); s.setProperty('--y3', 86 + 5 * Math.sin(t * 0.5 + 2 + ph) + '%');
      s.setProperty('--x4', 14 + 6 * Math.sin(t * 0.42 + 3 + ph) + '%'); s.setProperty('--y4', 84 + 4 * Math.cos(t * 0.3 + ph) + '%');
    };
    tick(0); return { el, tick };
  };
  M.paper = (parent, colors = M.PAL.mist, fade = M.PAL.mistfade) => {
    const w = M.CARD.w;
    const el = M.html(parent, `<div class="m-paper"><div class="m-mistfade" style="background:linear-gradient(0deg,rgba(${fade},.4),rgba(${fade},.1) 55%,rgba(255,255,255,0))"></div><div class="m-mist"></div></div>`);
    const mist = el.lastElementChild, spots = [[-0.05, 0.45, 0.8], [0.27, 0.5, 1], [0.61, 0.42, 0.75], [0.81, 0.42, 0.95], [0.42, 0.37, 0.6], [0.12, 0.34, 0.7]];
    spots.forEach(([x, ww, hh], i) => mist.insertAdjacentHTML('beforeend', `<i style="left:${x * w}px;width:${ww * w}px;height:${hh * 100}%;background:radial-gradient(closest-side,${colors[i % colors.length]},transparent)"></i>`));
    const blobs = [...mist.children];
    const tick = (t) => blobs.forEach((m, i) => (m.style.transform = `translateX(${Math.sin(t * 0.35 + i * 1.7) * 40}px) scaleY(${1 + Math.sin(t * 0.5 + i) * 0.08})`));
    return { el, tick };
  };
  M.sky = (parent, wash = null, seed = 23) => {
    const P = M.PAL, R = M.rand(seed), { w, h } = M.CARD;
    const el = M.html(parent, `<div class="m-fill" style="background:${wash || `linear-gradient(180deg,${P.mesh[1]} 0%,color-mix(in srgb,${P.accent} 45%,${P.mesh[1]}) 52%,color-mix(in srgb,${P.accent} 85%,${P.mesh[2]}) 100%)`}"><div class="m-fill"></div></div>`);
    const layer = el.firstElementChild;
    for (let i = 0; i < 22; i++) { const s = 180 + R() * 380; layer.insertAdjacentHTML('beforeend', `<div class="m-abs" data-sp="${(R() - 0.5) * 30}" style="left:${R() * (w + 60) - 100}px;top:${R() * (h + 60) - 120}px;width:${s * 1.6}px;height:${s}px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,252,250,${0.55 + R() * 0.4}),rgba(255,252,250,0));filter:blur(${10 + R() * 14}px)"></div>`); }
    const clouds = [...layer.children];
    const tick = (t, t0 = 0) => { layer.style.transform = `scale(${1.08 + (t - t0) * 0.025})`; clouds.forEach((c) => (c.style.transform = `translateX(${(t - t0) * +c.dataset.sp}px)`)); };
    return { el, tick };
  };
  M.studio = (parent, { wall = '#f4efea', table = '#e3d9d0', horizon = 0.66 } = {}) => {
    const el = M.html(parent, `<div class="m-fill" style="background:linear-gradient(180deg,${wall} 0%,color-mix(in srgb,${wall} 88%,#000) ${horizon * 100}%,${table} ${horizon * 100 + 0.2}%,color-mix(in srgb,${table} 92%,#fff) 100%)"></div>`);
    return { el, tick: () => {} };
  };
})();
