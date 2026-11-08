---
name: marquee
description: Make a launch film or product demo video (MP4, music, no voiceover) for any startup or product, from a one-line idea, a website link, screenshots or a brief. Smooth, motion-designed scenes in a four-chapter story (intro, problem, use case, call to action), rendered from code in headless Chrome with a generated score. Use when someone asks for a product video, demo video, launch video, promo, teaser, explainer clip, app preview, or "a video like this" for a product.
---

# Marquee: hand it a product, get its launch film

You make a finished MP4: a 15–60 second film that makes a stranger feel the problem, then watch the product end it.
Everything is drawn and animated in one HTML file, filmed frame by frame in headless Chrome, and scored from the
film's own cues. No editor, no stock footage, no voice.

Read these before building. They are the craft, not reference you can skip:
- `guide/story.md`: the four chapters, timings for each length, the eight rules, writing the words, the beat sheet
- `guide/motion.md`: easing, timing, stagger, continuity, transitions, motion blur, the signs of cheap motion
- `guide/scenes.md`: every block in the engine and the patterns worth copying
- `guide/look.md` and `guide/sound.md`: colour, type, sizes; the score and using your own track

The worked examples are `examples/kept/film.html` (45 s, 4:3, one hand-written file) and
`examples/tandem/film.html` (31 s, 16:9, built only from the engine). Open the one closest to the ask and copy from it.

## Before you start

Check the tools once: `node --version` (22 or later, or `bun`), `ffmpeg -version`, Google Chrome installed, and
`python3 -c "import numpy, soundfile"`. If something is missing, say what and how to install it
(`brew install ffmpeg`, `pip3 install numpy soundfile`) and stop there.

## The loop

1. **Understand the product.** From whatever arrived, find the six things in `guide/story.md` (name and promise,
   the person and the moment it hurts, the one thing to follow, the trigger the product sends, two or three steps,
   where to get it). From a link, fetch the page and read it. From screenshots, plan to put them inside the devices.
   Invent only what's missing, and say what you invented when you hand the film over. Ask a question only when the
   product itself is unclear.

2. **Choose the shape.** Length (default 45 s), size (default 1440×1080; 1920×1080 for YouTube or a website,
   1080×1920 for Reels/TikTok), palette (from the brand colour with `M.paletteFrom('#hex')`, or a preset).

3. **Write the beat sheet** (the table in `guide/story.md`): every scene with its seconds, words on screen, blocks
   and sounds. Check it against the eight rules. Half the film must be the product working, and one thing must be
   followed the whole way.

4. **Set up the film's folder** in the person's working directory, named after the product:
   ```
   mkdir -p <product>-film && cp -r <this skill's folder>/engine <product>-film/engine
   cp <product>-film/engine/template.html <product>-film/film.html
   ```
   Put any screenshots or logo in `<product>-film/shots/`.

5. **Build `film.html`.** Replace every FILL in the template with the beat sheet, adding and removing scenes. Use
   the blocks (`guide/scenes.md`), and copy whole scenes from the examples when they fit. Keep to the motion rules:
   everything from `t`, eased arrivals, stagger, one hero move at a time, idle float, and a cue for every arrival.

6. **Look before you render.** This step matters most: the film is only as good as what you check.
   ```
   node engine/render.mjs film.html --sheet            # 24 frames across the film → sheet.jpg
   node engine/render.mjs film.html --stills 3.5,19.7  # exact moments → stills/
   ```
   Open the images and look at them. Check for words cut off or overlapping, things in the wrong place, text too
   small or low in contrast, empty frames, scenes that don't connect, and anything from "signs of cheap motion" in
   `guide/motion.md`. Look at moments mid-transition too, not only rests. Fix and look again until a frame-by-frame
   look at every scene shows nothing wrong. The renderer prints any errors the page throws; fix those first.

7. **Render and score.**
   ```
   node engine/render.mjs film.html --blur 3                 # picture.mp4 with motion blur (about 4× the frames)
   python3 engine/score.py cues.json                         # score.wav (+ fx.wav) and loudness per second
   ffmpeg -y -i picture.mp4 -i score.wav -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart <product>.mp4
   ```
   Read the loudness line: quiet in the problem, fuller in the use case, 0.00 in a silence, no second louder
   than about 0.35.

8. **Hand it over** with: where the MP4 is, its length and size, what each chapter shows (one line each), anything
   you invented about the product, and what you couldn't do (no live-action, no real 3D, generated music). Say you
   can't hear the score and that they should judge it by ear; offer to swap in their own track (`guide/sound.md`).
   Changes are cheap: edit `film.html` and render again.

## What it is not for

Live-action footage, realistic 3D, lip-synced characters, voiceover. Say so plainly and offer the nearest thing: UI
and motion graphics around real screenshots, a placeholder for a clip they will film, or their own track and voice
laid over the picture with one ffmpeg command.
