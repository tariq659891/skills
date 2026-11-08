/* Pieces: icons, cards, chips, rows, buttons. All return html strings or elements.
 *   M.icon(name, stroke)                       an inline line icon (see M.ICONS for names)
 *   M.card(parent, { x, y, icon, tone, title, sub })  a floating card beside a device: one fact each
 *   M.chip(text, tone), M.row({ icon, tone, label, value, chip, chipTone, top }), M.button(text, top)
 *   M.mark(fill, symbol)                       a simple app mark when the startup has no logo
 * tones: accent green blue grey ink */
(function () {
  const M = window.M;
  M.ICONS = {
    headphones: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4.5" height="7" rx="1.6"/><rect x="16.5" y="14" width="4.5" height="7" rx="1.6"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2"/>',
    laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
    receipt: '<path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    card: '<rect x="2.5" y="5.5" width="19" height="13" rx="2.5"/><path d="M2.5 10h19M6 15h4"/>',
    wallet: '<path d="M4 7h15a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12"/><circle cx="16.5" cy="13.5" r="1.3"/>',
    cart: '<path d="M3 4h2l2.2 11h10.5L20 7H6.2"/><circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.5A5 5 0 0 1 21 19"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 3v4M17 5h4"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    heart: '<path d="M12 20s-7.5-4.6-9.2-9.4A4.8 4.8 0 0 1 12 6.8a4.8 4.8 0 0 1 9.2 3.8C19.5 15.4 12 20 12 20z"/>',
    star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>',
    play: '<path d="M7 4.5v15l12-7.5z"/>',
    camera: '<path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
    code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
    file: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    folder: '<path d="M3 6h6l2 2h10v11H3z"/>',
    leaf: '<path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z"/><path d="M5 19c3-4 6-6.5 9-8"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',
    plane: '<path d="M2.5 12.5l19-8-6 17-3.5-7z"/><path d="M12 14.5l9.5-10"/>',
    car: '<path d="M4 16v-4l2-5h12l2 5v4z"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/>',
    food: '<path d="M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10M16 3c-2 1-3 4-3 7h3v11"/>',
    pill: '<rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-35 12 12)"/><path d="M9.5 8.5l5 7"/>',
    dumbbell: '<path d="M6 7v10M3.5 9.5v5M18 7v10M20.5 9.5v5M6 12h12"/>',
    book: '<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z"/><path d="M20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',
    graduation: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17.5v.5"/>',
    broken: '<rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M10.5 7l2 3-2.2 2 3 3.5"/>',
    kettle: '<path d="M6.5 10h10l-1 10h-8z"/><path d="M8.5 10V8.5a3.5 3.5 0 0 1 7 0V10"/><path d="M16.5 12.5l3-2v4l-3.3 2"/>',
    sneaker: '<path d="M3 16.5v-5.5l4.5-1 3 3 4-1.2 6.5 3.2v2.3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3 15.5h18"/>',
    mug: '<path d="M5 8h11v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M16 10h1.8a2.2 2.2 0 0 1 0 4.4H16"/>',
    watch: '<rect x="6.5" y="7" width="11" height="10" rx="3"/><path d="M9 7l1-4h4l1 4M9 17l1 4h4l1-4"/>',
    lamp: '<path d="M9 3h6l3.5 8h-13z"/><path d="M12 11v8"/><path d="M8 21h8"/>',
    drill: '<path d="M3 7.5h11v5H3z"/><path d="M14 9h4M18 10h3"/><path d="M7.5 12.5l-1 8.5h4l1.2-8.5"/>',
    split: '<path d="M12 3v7M12 10l-6 6v5M12 10l6 6v5"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/>',
  };
  M.icon = (name, sw = 1.7) => `<span class="m-i"><svg viewBox="0 0 24 24" style="stroke-width:${sw}">${M.ICONS[name] || M.ICONS.sparkle}</svg></span>`;
  M.chip = (text, tone = 'accent') => `<span class="m-chip m-tone-${tone}">${text}</span>`;
  M.row = ({ icon = 'check', tone = 'accent', label = '', value = '', chip = '', chipTone, top = 0, h = 62 } = {}) =>
    `<div class="m-row" style="top:${top}px;height:${h}px"><div class="m-ic m-tone-${tone}">${M.icon(icon, 1.8)}</div><div>${label ? `<div class="m-lb">${label}</div>` : ''}<div class="m-vl">${value}</div></div>${chip ? M.chip(chip, chipTone || tone) : ''}</div>`;
  M.button = (text, top) => `<div class="m-btn" style="top:${top}px"><span>${text}</span></div>`;
  M.card = (parent, { x = 0, y = 0, icon = 'check', tone = 'accent', title = '', sub = '' } = {}) =>
    M.html(parent, `<div class="m-card" style="left:${x}px;top:${y}px"><div class="m-ic m-tone-${tone}">${M.icon(icon, 1.8)}</div><div><div class="m-a">${title}</div>${sub ? `<div class="m-b">${sub}</div>` : ''}</div></div>`);
  /** a plain app mark: rounded square in the accent with a white icon. fill can be a gradient. */
  M.mark = (symbol = 'check', fill) => `<svg viewBox="0 0 64 64" style="width:100%;height:100%"><rect x="4" y="4" width="56" height="56" rx="16" fill="${fill || 'var(--accent)'}"/><g transform="translate(14 14) scale(1.5)" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${M.ICONS[symbol] || M.ICONS.check}</g></svg>`;
  /** card entrances in a row: pops cards at at, at+gap... and floats them; leave together at z */
  M.cards = (els, t, at, { gap = 0.38, z = 1e9, float = 6 } = {}) => els.forEach((el, i) => {
    const k = M.p(t, at + i * gap, at + i * gap + 0.5), q = M.ease.io(M.p(t, z, z + 0.4));
    const side = parseFloat(el.style.left) < M.CARD.w / 2 ? -1 : 1;
    M.set(el, { o: M.clamp(k * 3) * (1 - q), s: M.lerp(0.6, 1, M.ease.back(k)), x: side * ((1 - M.ease.out3(k)) * 40 + q * 40), y: (1 - M.ease.out3(k)) * 30 + M.drift(t, 1.3, i) * float - q * 20, b: q * 8 });
  });
})();
