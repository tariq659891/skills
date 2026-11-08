# Sound

No voice. The score is made from the film's own cues, so the music turns where the film turns and every action has
a sound. Nothing is licensed.

## The shape

| Chapter | Music |
|---|---|
| Intro | warm pad and marimba, a riser into the first hit (the name) |
| Problem | the chords turn minor, a sparse heartbeat kick, a riser, then one beat of silence |
| Use case | the groove from `music.groove`: kick on every beat, clap on 2 and 4, hats, bass, a marimba arpeggio |
| Call to action | the groove drops away under the typing, a last riser, the end hit rings out |

## What the film tells the score

```js
M.film({ …, music: { key: 'F', bpm: 118, groove: 11.05, end: 28.15, mood: 'bright' } });
M.cue('pop', 13.6, 13.8);          // chips, cards, badges landing
M.cue('tap', 14.5);                 // a finger or a click
M.cue('whoosh', 19.4);              // a cut between scenes
M.cue('hit', 11.05);                // the name, the turn, the end logo
M.cue('chime', 1.25);               // a notification
M.cue('success', 15.0);             // a thing done (check mark)
M.cue('shutter', 24.0); M.cue('scan', 21.6); M.cue('thud', 3.5);  // camera, scanning, letters landing
M.cue('type', M.typeCues(4.85, line, 20));   // a key per typed character
M.cue('riser', [9.9, 10.85]);       // builds into 10.85
M.cue('silence', [10.85, 11.05]);   // everything cut, then the hit at 11.05
```

`mood`: `calm` (96 bpm, no clap, softer), `warm` (112), `bright` (124, the default feel of Kept), `dark` (104,
darker pad). `key`: any note name.

## Making it

```
python3 engine/score.py cues.json          # → score.wav, fx.wav, and loudness per second
```

Check the loudness line: it should sit around 0.1 in the problem, 0.25 in the use case, peak at the hits, and read
0.00 inside a silence. If a cut sounds busy, remove cues: not everything needs a sound.

## Using your own track

```
ffmpeg -y -i picture.mp4 -i track.mp3 -c:v copy -c:a aac -shortest film.mp4
```

Line its drops up with the film's hits: trim the track's start (`-ss 2.3` before `-i track.mp3`) until its first
drop lands on the name. Keep the taps, pops and typing by laying `fx.wav` (the effects alone, written next to
`score.wav`) under it:

```
ffmpeg -y -i picture.mp4 -i track.mp3 -i fx.wav -filter_complex "[1]volume=0.8[a];[2]volume=0.6[b];[a][b]amix=inputs=2:duration=first:normalize=0" -c:v copy -c:a aac -shortest film.mp4
```

Tracks need a licence for where you post them. The generated score never does.
