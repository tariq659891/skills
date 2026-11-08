/* Logos: the open and the close.
 *   const L = M.logo(parent, { mark, name, line, url, color, size, top })  → { update(t, at) }
 *     mark pops (with rings), the name slides out from behind it, the line blurs in, the url pill pops.
 *   M.letters(el, t, at)   letters of a word drop in one by one (a bigger, louder open) */
(function () {
  const M = window.M;
  M.logo = (parent, { mark = M.mark(), name = 'Name', line = '', url = '', color = '#fff', lineColor, size = 150, top = M.CARD.h * 0.36 } = {}) => {
    const ms = size * 0.88;
    const el = M.html(parent, `<div class="m-fill">
      <div class="m-abs m-rings" style="left:${M.CARD.w / 2}px;top:${top + size / 2}px"></div>
      <div class="m-abs" style="left:0;right:0;top:${top}px;height:${size}px;display:flex;justify-content:center;align-items:center">
        <div class="m-lmark" style="width:${ms}px;height:${ms}px;flex:none">${mark}</div>
        <div class="m-lwrap" style="overflow:hidden;height:${size * 1.15}px;display:flex;align-items:center"><div class="m-lname" style="font-size:${size}px;font-weight:750;letter-spacing:-.055em;color:${color};line-height:1;padding-left:${size * 0.15}px;white-space:nowrap;text-shadow:0 8px 34px rgba(0,0,0,.16)">${name}</div></div>
      </div>
      ${line ? `<div class="m-line m-lline" style="top:${top + size * 1.2}px;font-size:${Math.max(24, size * 0.2)}px;color:${lineColor || color};font-weight:600;letter-spacing:-.012em;text-shadow:0 4px 20px rgba(0,0,0,.14)">${line}</div>` : ''}
      ${url ? `<div class="m-abs m-lurl" style="left:0;right:0;top:${top + size * 1.2 + Math.max(24, size * 0.2) * 2.2}px;text-align:center"><span style="display:inline-block;background:rgba(255,255,255,.92);color:var(--accent);font-size:20px;font-weight:650;padding:11px 22px;border-radius:30px;box-shadow:0 10px 30px rgba(0,0,0,.12)">${url}</span></div>` : ''}
    </div>`);
    const rings = M.$('.m-rings', el); for (let i = 0; i < 3; i++) rings.insertAdjacentHTML('beforeend', `<div class="m-abs" style="left:-100px;top:-100px;width:200px;height:200px;border-radius:50%;border:2px solid ${color === '#fff' ? 'rgba(255,255,255,.8)' : 'var(--accent)'}"></div>`);
    const mk = M.$('.m-lmark', el), wrap = M.$('.m-lwrap', el), nm = M.$('.m-lname', el), ln = M.$('.m-lline', el), ur = M.$('.m-lurl', el);
    const update = (t, at) => {
      const m = M.p(t, at, at + 0.6), slide = M.ease.io(M.p(t, at + 0.65, at + 1.3));
      M.set(mk, { o: M.clamp(m * 3), s: M.lerp(0.2, 1, M.ease.back(m)), r: M.lerp(-30, 0, M.ease.out3(m)) });
      if (!nm._w) nm._w = nm.offsetWidth;
      wrap.style.width = nm._w * slide + 'px'; M.set(nm, { x: (1 - slide) * -40, o: slide });
      [...rings.children].forEach((p, i) => { const r = M.p(t, at + 0.15 + i * 0.15, at + 1.15 + i * 0.15); M.set(p, { o: r > 0 && r < 1 ? (1 - r) * 0.8 : 0, s: 0.6 + M.ease.out3(r) * 2.6 }); });
      if (ln) M.words(ln, t, at + 1.35, { gap: 0.2 });
      if (ur) { const u = M.p(t, at + 2.0, at + 2.5); M.set(ur, { o: M.clamp(u * 3), y: (1 - M.ease.back(u)) * 20, s: M.lerp(0.9, 1, M.ease.out3(u)) }); }
    };
    return { el, update, cues: (at) => ({ hit: [at + 0.05], pop: [at + 2.0] }) };
  };
  M.letters = (el, t, at, { gap = 0.09, d = 0.65, spin = [-18, 12, -10, 16, -8, 14, -12] } = {}) => {
    el = M.$(el);
    if (!el._ls) { el._ls = [...el.textContent].map((c) => { const s = document.createElement('span'); s.className = 'm-ch'; s.textContent = c; return s; }); el.textContent = ''; el._ls.forEach((s) => el.appendChild(s)); }
    el._ls.forEach((c, i) => { const k = M.p(t, at + i * gap, at + i * gap + d); M.set(c, { o: M.clamp(k * 2.5), y: M.lerp(-150, 0, M.ease.back(k)), r: M.lerp(spin[i % spin.length], 0, M.ease.out3(k)), b: (1 - M.ease.out3(k)) * 10 }); });
  };
})();
