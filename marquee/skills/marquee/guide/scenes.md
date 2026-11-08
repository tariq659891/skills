# Scenes and blocks

Every block lives in `engine/blocks/`. A scene is an element inside the card plus an update function that runs while
the scene lives:

```js
const el = M.sceneEl('s5');                       // a layer in the card
const bg = M.mesh(el);                            // a background block
const ph = M.phone(el, { x: (M.CARD.w - 350) / 2, y: 40 });
M.scene('s5', 13.0, 19.6, (t) => {                // lives 13.0–19.6 s, fades in and out with blur
  bg.tick(t);
  M.set(ph.el, M.rise(t, 13.0));
}, { fi: .3, fo: .3, blur: 10 });
M.cue('pop', 13.6);                               // the sound for what lands
```

Scenes overlap by 0.2–0.4 s at each cut, so one dissolves into the next. Measure sizes inside `M.build(() => …)` or
lazily in the update: fonts are ready only then.

## The frame

| Block | Use |
|---|---|
| `M.film({ W, H, LEN, chapters, music })` | first, always. Sizes: 1440×1080 (4:3), 1920×1080 (16:9), 1080×1920 (9:16), 1080×1080 (1:1) |
| `M.frame({ chapters, palette, dimAt })` | the stage, the card and the chapter bar. `frame: false` for full bleed. Gives `M.CARD = { el, w, h }` |
| `M.sceneEl(id, html)` | a scene layer inside the card |

## Backgrounds (each returns `{ el, tick(t) }`, call `tick` in the update)

| Block | Use |
|---|---|
| `M.paper(el)` | white with a soft mist of the brand colours at the bottom: every scene of words |
| `M.mesh(el, colors?, phase?)` | soft moving colour fields: devices, the turn, logos |
| `M.sky(el)` | drifting clouds deepening to the brand colour: the final logo |
| `M.studio(el, { wall, table })` | a wall and a table: a desktop "in a room" |

## Words

| Block | Use |
|---|---|
| `<div class="m-line" style="top:…;font-size:…">` | a centred line. `m-acc` for the accent word, `m-soft` for quiet words |
| `M.words(el, t, at, { gap, z })` | each word blurs in, `gap` apart; all leave at `z` |
| `M.type(el, t, at, cps)` | typed with a caret. `M.typeCues(at, el, cps)` gives the key sounds |
| `M.typeTo(el, n, caret)` | show n characters: for backspacing (see the Tandem call to action) |
| `M.letters(el, t, at)` | letters drop in one by one: a loud name reveal |
| guides (`.m-guide`) | thin accent lines that frame big type, then fade (the "Simple." moment) |

## Devices

| Block | Use |
|---|---|
| `M.phone(el, { x, y, w })` | → `{ el, scr, ox, oy }`. Move `el`; add screens to `scr`. `ox, oy` = where the screen starts, for taps |
| `M.screen(scr, html, bg)` | a full-size layer on a screen. Stack layers and slide them for screen changes |
| `M.lock({ date, time })`, `M.notif({ app, icon, title, body })`, `M.statusBar()` | lock screen and notification html |
| `M.desktop(el, { x, y, w, h })` | a monitor on a stand → `{ el, scr }` |
| `M.browser(el, { x, y, w, h, url })` | a browser window for web products → `{ el, scr }` |

Real screenshots: put them in `shots/` and use `<img src="shots/x.png" style="width:100%;display:block">` inside a
screen layer. Slide a tall screenshot upward to scroll it.

## Pieces

| Block | Use |
|---|---|
| `M.icon(name)` | line icons: see `M.ICONS` (about 60, from headphones to graduation) |
| `M.mark(symbol, fill)` | a plain app mark when there is no logo |
| `M.card(el, { x, y, icon, tone, title, sub })` + `M.cards(els, t, at)` | floating facts beside a device, popping in turn |
| `M.row({ icon, tone, label, value, chip, top })` | a row on a phone screen |
| `M.chip(text, tone)`, `M.button(text, top)` | chips and the main button. Tones: accent green blue grey ink |
| `M.count(el, t, a, b, to, { prefix, decimals })` | a number counting up |

## Motion blocks

| Block | Use |
|---|---|
| `M.ring(el, tiles, { cx, cy, rx, ry })` → `.update(t, at, out)` | the problem as clutter: tiles fly in, orbit, blow out |
| `M.hop(icons, t, at, from, to)` | icons pop in a row, then hop in arcs around a line |
| `M.finger(el)` → `.update(t, [[at, x, y], …])` | taps on a phone |
| `M.cursor(el)` → `.update(t, path, { clicks })` | a cursor that travels in eased arcs and clicks |
| `M.logo(el, { mark, name, line, url })` → `.update(t, at)` | the end: mark pops with rings, name slides out, line, url |

## The moves (each returns a look for `M.set`; combine with `M.mix`)

`M.blurIn(t, at, z)` · `M.pop(t, at)` · `M.rise(t, at)` · `M.leave(t, at)` · `M.float(t, amp, seed)`

## Patterns worth copying from the examples

| Pattern | Where | What it does |
|---|---|---|
| Scan | `examples/kept` S8 | camera view, corner brackets close in, a scan line, highlight boxes with labels, a shutter flash |
| Calendar | `examples/kept` S6 | a month grid, a band drawn across days, a "today" circle, the band greys out: "too late" |
| Notification → tap → sheet | `examples/kept` S12 | the reminder arrives, a finger taps it, the action sheet slides up, button → spinner → check |
| Add, then done | `examples/tandem` S5 | a form fills in piece by piece, one tap, a success screen with rows |
| Dashboard and settle | `examples/tandem` S6 | browser window rises, a number counts, bars grow, a cursor clicks, bars shrink, a toast |
| Type and delete | `examples/tandem` S7 | "Split it." types, deletes, "Forget it." types in the accent |
| Zoom-through | `examples/tandem` S4 | the mark grows through the frame into the next scene |
