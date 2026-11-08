# Motion

Motion is most of what separates a launch film from a slideshow. The rules below are what the Kept and Tandem films
follow. Each says what to do, why it works, and what number to start from.

## 1. The one rule: time drives everything

Nothing moves by itself. No CSS animations, no transitions, no `requestAnimationFrame`, no `Math.random()` inside a
frame. Every element's look is calculated from `t`, the second we are at:

```js
const k = M.ease.out5(M.p(t, 2.0, 2.8));   // 0 → 1 between 2.0 s and 2.8 s, eased
M.set(phone, { y: M.lerp(560, 0, k), o: k });
```

Why: the renderer seeks to each frame and takes a picture. If anything moves on its own clock, frames come out
uneven and motion blur can't sample between them. Calculating from time makes every frame exact, every render
identical, and any moment checkable with `--stills 12.4`.

## 2. Smooth is a render setting as much as a design one

- **Motion blur** (`--blur 3` or `--blur 4`): each frame blends 3–4 moments across half a frame interval, like a film
  camera's 180° shutter. Fast moves get a natural smear instead of stepping. This does the most to make code-made
  motion look filmed. Use it for the final render; leave it off while checking.
- **60 fps** (`--fps 60`) for films with lots of fast UI or scrolling. 30 fps with blur is enough for most.
- **Move with transforms and opacity only** (`M.set` does this). Animating `top`, `left`, `width` or `font-size`
  snaps to whole pixels and shimmers. The one allowed exception is a reveal mask's width (the logo name sliding
  out), because its edge is hidden.
- **Blur is a move, not a filter.** Things come in from 14 px of blur to sharp, and leave into 12 px. That is the
  house entrance (`M.blurIn`). It reads as focus, and it hides the frame where something "appears".

## 3. Easing: which curve for which move

| Move | Curve | In the kit | Why |
|---|---|---|---|
| Something arrives (a phone rises, a card lands) | fast in, long settle | `ease.out5`, `ease.expo` | Real objects decelerate into place. The long tail is the expensive look. |
| Something pops (chip, badge, icon, logo mark) | overshoot and settle | `ease.back` (c 1.6–1.8) | A small overshoot gives it weight and life. Above 2.0 it looks cartoonish. |
| Moves from A to B on screen (camera, cursor, an item travelling) | slow, fast, slow | `ease.io` | Both ends are rests, so both ends ease. |
| Something leaves | quick, then gone, with blur | `M.leave` (io + blur) | Departures should take less time than arrivals. Nobody watches them. |
| Lands with life (a phone dropping in, a big number) | damped spring | `ease.spring(x, 9, .55)` | One soft bounce. More than one looks like a toy. |
| Continuous (idle drift, a spinner, scroll, progress) | linear or sine | `M.drift`, `lerp` | Only things with no start or end are linear. |

**Never linear for an arrival.** Linear motion is the first sign that a computer made it.

## 4. Timing: how long things take

| What | Duration | Note |
|---|---|---|
| UI element appears (chip, row, toast) | 0.3–0.5 s | `M.pop` 0.5, rows 0.45 |
| Word blurs in | 0.5–0.6 s | each word on its own, 0.12–0.16 s apart |
| Card or phone arrives | 0.6–1.0 s | `M.rise` 0.9 |
| Screen change inside a phone | 0.5–0.75 s | slide up with `out5` |
| Camera push across a scene | the whole scene | 3–6 % scale. Slow enough to feel, never to notice |
| Zoom-through transition | 0.4–0.6 s | the mark grows ×5 with blur, the next scene comes in from ×1.2 |
| Hold after words land | ≥ 0.8 s + 0.25 s per word | people must finish reading before anything leaves |
| Typing | 13–22 characters a second | slower for the call to action, faster for the problem |
| Deleting | 20–26 characters a second | always faster than typing |

## 5. Stagger and overlap

- **Stagger** related things instead of moving them together: words 0.12–0.16 s apart, list rows 0.25–0.3 s, cards
  beside a device 0.35–0.4 s. Everything at once reads as a slide changing. A cascade reads as a scene unfolding.
- **Order follows reading order**: top to bottom, left to right, cause before effect (button, then result).
- **Overlap**: start the next move when the previous is about 70 % done. Waiting for each one to finish feels slow
  and mechanical.

## 6. One hero move at a time

At any moment, one thing should own the eye: the phone rising, the number counting, the cursor travelling. Everything
else moves less (idle float, slow drift) or waits. If two big things move at once, the viewer sees neither. Stage
them: the phone lands, then the notification drops, then the cards come.

## 7. Nothing is ever dead still

Anything on screen for more than a second gets idle life: `M.float(t, 4–8)` for cards, `M.drift` on a phone's tilt
(±4°), a mesh background that wanders, a camera push. Keep amplitudes small and speeds slow (0.4–1.3 Hz). Use
smooth functions of `t`, never per-frame randomness, which flickers.

## 8. Depth and the camera

- **Parallax**: far things move less and are blurrier (receipts at 2–3 px of blur behind a sharp phone). Near
  things move more. Three layers is enough: background field, objects, the hero.
- **3D tilt** sells a device: `rx` 4–28° on arrival settling to 2–4°, `ry` drifting ±4°. Above 30° it looks fake.
- **Camera push**: scale a scene's container from 0.9 to 1.04 over its life (the desktop scene). Push in at the end
  to lead into the next scene.

## 9. Continuity: the thread that makes it a film

- **One object, the whole way**: in Kept, the same headphones appear in the notification, on the receipt, in the
  item, in the reminder and in the return. In Tandem it's the same $96 shop. The viewer follows a story, not a
  feature list.
- **Match cuts**: end a scene on a shape and start the next on the same shape. The logo mark grows through the
  frame and the phone comes out of it. A typed word is deleted and the answer is typed in its place.
- **Same direction**: if things leave upward, the next scene arrives from below.

## 10. Transitions (pick one per cut; the default is the first)

| Transition | How | Use it for |
|---|---|---|
| Blur dissolve | scene fade 0.3 s with `blur: 10` (the default of `M.scene`) | most cuts |
| Zoom-through | the outgoing hero scales ×5 with blur; the incoming starts at ×1.2 and blurred | into the product, out of a desktop |
| Type and delete | typed line backspaces, the answer types in | the call to action ("Buy it." → "Keep it.") |
| Blow-out | collage tiles fly outward with blur | leaving the problem |
| Rise | the hero rises from below the frame | the first product shot |
| Silence cut | music stops for 0.15–0.2 s, then the hit | the turn from problem to answer (one per film) |

## 11. Motion and sound are one thing

Every arrival that matters gets a cue: a pop for a chip, a tap for a press, a whoosh for a cut, a hit for a logo.
The score is built from those cues, so a move without a cue is silent and feels weightless. One beat of silence
before the turn makes the next thing feel twice as big.

## 12. Signs of cheap motion (check before rendering)

- Linear arrivals, or everything using the same curve and duration
- Everything appearing at once, or one by one with equal gaps and no overlap
- Things popping in from nothing (no blur, no scale, no travel)
- Bounces above one, overshoot above 1.8
- Text leaving before it can be read
- Dead-still screens for over a second
- Random jitter or flicker (per-frame randomness)
- Two hero moves at once
- Moves with no sound under them

## Where to study motion, and what to look for

- **Apple product films** (any recent iPhone or Mac launch film): camera moves around a device, continuity of one
  object across scenes, how long they hold a still.
- **Linear's release videos**: restraint. UI moves only as much as needed, and blur reveals.
- **Stripe** (Sessions keynotes and stripe.com): mesh gradients, type that moves word by word, calm pacing.
- **Vercel Ship** films: speed and dark type. Watch how fast cuts still stay readable.
- **The Browser Company (Arc)** launch videos: playfulness, overshoot used with taste, sound on every action.
- **Jitter** (jitter.video, templates gallery) and **Rive** (rive.app, community): hundreds of short UI and
  kinetic-type motions. Good for stealing timings.
- **easings.net** and **cubic-bezier.com**: see and compare curves.
- **The 12 principles of animation** (Thomas and Johnston, *The Illusion of Life*): anticipation, follow-through,
  slow in and slow out, staging. All of section 3–9 comes from there.

When you study one, scrub it frame by frame and write down three numbers: how long a move takes, how far apart
staggered things are, and how long text holds. Then use those numbers.
