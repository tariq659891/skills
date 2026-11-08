/* Devices: where the product is seen.
 *   M.phone(parent, { x, y, w })        → { el, scr }  an iPhone-like body; put screens in scr
 *   M.desktop(parent, { x, y, w, h })   → { el, scr }  a monitor on a stand
 *   M.browser(parent, { x, y, w, h, url }) → { el, scr } a browser window, for web products
 *   M.statusBar(color, time), M.lock({ date, time, wallpaper }), M.notif({ app, icon, title, body }) → html
 *   M.screen(scr, html) adds a full-size layer to a screen and returns it (stack layers and move them)
 * Real screenshots of the product beat drawn UI: <img src="shots/home.png" style="width:100%"> inside a layer. */
(function () {
  const M = window.M;
  M.statusBar = (color = '#111', time = '9:41') => `<div class="m-status" style="color:${color}"><span>${time}</span><b><i style="width:3px;height:5px"></i><i style="width:3px;height:7px"></i><i style="width:3px;height:9px"></i><i style="width:3px;height:11px"></i><i style="width:22px;height:11px;border-radius:3px;margin-left:4px"></i></b></div>`;
  M.lock = ({ date = 'Sunday, 8 November', time = '9:41', wallpaper } = {}) => {
    const P = M.PAL, wp = wallpaper || `radial-gradient(120% 80% at 30% 18%,${P.mesh[1]} 0%,${P.accent} 34%,color-mix(in srgb,${P.accent} 45%,#000) 70%,#0b0806 100%)`;
    return `<div class="m-lock" style="background:${wp}">${M.statusBar('#fff', time)}<div class="m-date">${date}</div><div class="m-time">${time}</div></div>`;
  };
  M.notif = ({ app = 'App', icon = '', title = '', body = '', when = 'now', top = 262 } = {}) =>
    `<div class="m-notif" style="top:${top}px"><div class="m-ai">${icon}</div><div style="flex:1"><div class="m-t1">${app}<span>${when}</span></div><div class="m-t2">${title}</div><div class="m-t3">${body}</div></div></div>`;
  M.phone = (parent, { x = 0, y = 0, w = 350 } = {}) => {
    const h = w * 2.086, k = w / 350;
    // the outer box is what you move (M.set); the body inside keeps its fixed scale
    const el = M.html(parent, `<div class="m-abs" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;transform-origin:50% 40%"><div class="m-phone" style="left:0;top:0;width:350px;height:730px;transform:scale(${k});transform-origin:0 0"><div class="m-scr"></div><div class="m-island"></div></div></div>`);
    return { el, scr: M.$('.m-scr', el), w, h, k, ox: x + 11 * k, oy: y + 11 * k };
  };
  M.screen = (scr, html = '', bg = '#fff') => M.html(scr, `<div class="m-fill" style="background:${bg}">${html}</div>`);
  M.desktop = (parent, { x = 0, y = 0, w = 820, h = 500 } = {}) => {
    const el = M.html(parent, `<div class="m-abs" style="left:0;top:0;width:100%;height:100%">
      <div class="m-abs" style="left:${x + w / 2 - 240}px;top:${y + h + 84}px;width:480px;height:44px;border-radius:50%;background:radial-gradient(closest-side,rgba(40,25,10,.26),transparent)"></div>
      <div class="m-neck" style="left:${x + w / 2 - 45}px;top:${y + h}px;width:90px;height:100px"></div>
      <div class="m-foot" style="left:${x + w / 2 - 140}px;top:${y + h + 92}px;width:280px;height:16px"></div>
      <div class="m-mon" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><div class="m-ms"></div></div></div>`);
    return { el, scr: M.$('.m-ms', el), ox: x + 13, oy: y + 13, sw: w - 26, sh: h - 26 };
  };
  M.browser = (parent, { x = 0, y = 0, w = 1000, h = 620, url = 'yourproduct.com' } = {}) => {
    const el = M.html(parent, `<div class="m-win" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><div class="m-bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><div class="m-url">${url}</div></div><div class="m-ws"></div></div>`);
    return { el, scr: M.$('.m-ws', el), ox: x, oy: y + 44, sw: w, sh: h - 44 };
  };
})();
