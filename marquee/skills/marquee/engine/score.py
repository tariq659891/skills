"""Marquee score: music and sounds made from the film's cues.json. Nothing licensed, no voice.

    python3 score.py cues.json            → score.wav (music + effects) and fx.wav (effects only) beside it
    python3 score.py cues.json --mood calm|warm|bright|dark   (default: the film's music.mood or warm)

What it reads (the film writes it at render time):
  LEN, chapters [intro, problem, use case, call to action start times],
  music { key: "D", bpm: 120, groove: <when the beat starts>, mood, end: <the logo hit> },
  cue lists: whoosh pop tap hit chime shutter success scan type thud,
  silence [[a, b]] (a hard cut of all sound), riser [[a, b]] (a build into b).

The shape: intro = warm pad and marimba, a riser into the first hit. Problem = minor, sparse, a heartbeat kick.
Use case = the groove (kick, clap, hats, bass, arpeggio) from music.groove. Call to action = the groove
drops away, a last riser, the end hit rings out. Needs numpy and soundfile (pip install numpy soundfile).
"""
import json, sys, os
import numpy as np, soundfile as sf

path = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'cues.json'
CU = json.load(open(path))
OUT = os.path.join(os.path.dirname(os.path.abspath(path)), 'score.wav')
MU = CU.get('music', {}) or {}
MOOD = sys.argv[sys.argv.index('--mood') + 1] if '--mood' in sys.argv else MU.get('mood', 'warm')
SR = 48000
LEN = float(CU['LEN']); N = int(LEN * SR); t = np.arange(N) / SR
rng = np.random.default_rng(7)
CH = CU.get('chapters') or [0, LEN * .14, LEN * .39, LEN * .86]
while len(CH) < 4: CH.append(CH[-1] + (LEN - CH[-1]) / 2)
C0, C1, C2, C3 = CH[:4]
BPM = float(MU.get('bpm', {'calm': 96, 'warm': 112, 'bright': 124, 'dark': 104}.get(MOOD, 112)))
BEAT = 60 / BPM
G0 = float(MU.get('groove', C2 + .15))
END_HIT = float(MU.get('end', (CU.get('hit') or [C3 + 2.8])[-1]))
KEYS = {'C': -2, 'C#': -1, 'Db': -1, 'D': 0, 'D#': 1, 'Eb': 1, 'E': 2, 'F': 3, 'F#': 4, 'Gb': 4, 'G': 5, 'G#': 6, 'Ab': 6, 'A': -5, 'A#': -4, 'Bb': -4, 'B': -3}
K = KEYS.get(str(MU.get('key', 'D')), 0)

def bus(): return np.zeros((2, N))
def place(b, x, at, g=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N or i + len(x) <= 0: return
    if i < 0: x = x[-i:]; i = 0
    j = min(N, i + len(x)); x = x[: j - i]
    lg, rg = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    b[0, i:j] += x * g * lg * 1.414; b[1, i:j] += x * g * rg * 1.414
def ffilt(x, lo=None, hi=None, order=2):
    n = len(x); X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR) + 1e-6; m = np.ones_like(f)
    if lo: m *= 1 / np.sqrt(1 + (lo / f) ** (2 * order))
    if hi: m *= 1 / np.sqrt(1 + (f / hi) ** (2 * order))
    return np.fft.irfft(X * m, n)
def tt(d): return np.arange(int(d * SR)) / SR
def env(d, a=.01, r=.2):
    n = int(d * SR); e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, min(n, int(r * SR)))
    e[:na] = np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, nr) ** 2; return e
def saw(f, d, det=0.0): x = tt(d); return 2 * ((f * (1 + det) * x + rng.random()) % 1) - 1
def hz(m): return 440 * 2 ** ((m + K - 69) / 12)

pad, keys, bass, drums, fx = bus(), bus(), bus(), bus(), bus()
# chords written in D, moved to the film's key by K
CHORDS = {'I': [50, 57, 62, 66, 69], 'Isus': [50, 57, 62, 64, 69], 'V': [45, 57, 61, 64, 69], 'vi': [47, 54, 59, 62, 66],
          'IV': [43, 55, 59, 62, 67], 'ii': [40, 52, 59, 62, 67], 'iii': [42, 54, 57, 61, 66], 'IVmaj7': [43, 55, 59, 62, 66]}
PLAN = [(C0, C0 + (C1 - C0) * .55, 'Isus'), (C0 + (C1 - C0) * .55, C1, 'I')]
q = (C2 - C1) / 4
PLAN += [(C1, C1 + q, 'vi'), (C1 + q, C1 + 2 * q, 'IV'), (C1 + 2 * q, C1 + 3 * q, 'ii'), (C1 + 3 * q, C2, 'iii')]
bar = BEAT * 4; c = G0; k = 0; prog = ['I', 'V', 'vi', 'IV']
if G0 > C2: PLAN.append((C2, G0, 'iii'))
while c < C3 - .05: PLAN.append((c, min(c + bar, C3), prog[k % 4])); c += bar; k += 1
PLAN += [(C3, END_HIT, 'IVmaj7'), (END_HIT, LEN, 'I')]
def chord_at(s):
    for a, b, nm in PLAN:
        if a <= s < b: return CHORDS[nm]
    return CHORDS['I']
for a, b, nm in PLAN:
    d = b - a + 1.2
    for i, m in enumerate(CHORDS[nm][1:]):
        x = sum(saw(hz(m), d, det) for det in (-.004, 0, .0045)) / 3 * env(d, a=.6, r=1.0)
        place(pad, x, a, (.16 if MOOD != 'calm' else .2) / (1 + i * .25) * (1.15 if a >= END_HIT else 1), pan=-.5 + i * .33)

def marimba(f, d=.9):
    x = tt(d); w = np.sin(2 * np.pi * f * x) * np.exp(-x / .32) + .35 * np.sin(2 * np.pi * f * 3.93 * x) * np.exp(-x / .06) + .12 * np.sin(2 * np.pi * f * 9.2 * x) * np.exp(-x / .02)
    n = int(.002 * SR); w[:n] *= np.linspace(0, 1, n); return w
def arps(a, b, step, pattern, g, oct=12, swing=0.0):
    s = a; i = 0
    while s < b - .05:
        ch = chord_at(s); tones = ch[1:] + [m + 12 for m in ch[1:]]
        m = tones[pattern[i % len(pattern)] % len(tones)] + oct
        place(keys, marimba(hz(m)), s + (swing if i % 2 else 0), g * (1.0 if i % 4 == 0 else .7), pan=np.sin(i * 1.3) * .45); s += step; i += 1
first_hit = (CU.get('hit') or [C0 + (C1 - C0) * .55])[0]
arps(C0 + .15, first_hit - .2, BEAT * .75, [0, 2, 4, 3, 1, 4], .26)
arps(first_hit + .05, C1 - .2, BEAT / 2, [0, 2, 4, 6, 4, 2], .22)
arps(C1 + .2, C2 - .2, BEAT * 1.5, [0, 3, 2, 4], .2)
if MOOD != 'calm': arps(G0, C3 - .05, BEAT / 2, [0, 2, 4, 2, 5, 4, 2, 4], .2, swing=.018)
else: arps(G0, C3 - .05, BEAT, [0, 2, 4, 2], .22)
arps(G0 + BEAT / 4, C3 - .05, BEAT * 2, [7, 6], .1, oct=24)
arps(C3 + .1, END_HIT - .2, BEAT, [4, 2, 0, 2], .16)

def bassnote(f, d):
    x = tt(d); return (np.sin(2 * np.pi * f * x) + .3 * np.sin(4 * np.pi * f * x) + .1 * np.sign(np.sin(2 * np.pi * f * x))) * env(d, a=.008, r=.08)
s = G0
while s < C3 - .05:
    root = chord_at(s)[0]
    for off, d in ((0, .84), (1.5, .4), (2, .84), (3, .44), (3.5, .4)):
        if s + off * BEAT < C3: place(bass, bassnote(hz(root), d * BEAT), s + off * BEAT, .22)
    s += bar
place(bass, bassnote(hz(38), 3.6) * env(int(3.6 * SR) / SR, .005, 2.5), END_HIT, .3)

def kick(g=1.0):
    x = tt(.45); f = 48 + 110 * np.exp(-x / .03); w = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / .16) + .25 * np.exp(-x / .004) * rng.standard_normal(len(x)); return w * g
def clap():
    x = tt(.3); n = rng.standard_normal(len(x)); e = np.zeros(len(x))
    for o in (0, .011, .022): i = int(o * SR); e[i:] += np.exp(-(x[: len(x) - i]) / (.012 if o < .02 else .09))
    return ffilt(n * e, 900, 5000)
def hat(d=.045): x = tt(d * 3); return ffilt(rng.standard_normal(len(x)), 7000) * np.exp(-x / d)
KK, CL, HH, OH = kick(), clap(), hat(), hat(.16)
kicks = []
for s in np.arange(C1 + (C2 - C1) * .3, C2 - .3, BEAT * 2): place(drums, kick(.55), s, .7); place(drums, kick(.35), s + .22, .5); kicks.append(s)
s = G0; i = 0
while s < C3 - .05:
    place(drums, KK, s, .95 if MOOD != 'calm' else .6); kicks.append(s)
    if i % 2 == 1 and MOOD != 'calm': place(drums, CL, s, .32, .05)
    place(drums, HH, s + BEAT / 2, .2, .35); place(drums, HH, s + BEAT / 4, .07, -.3); place(drums, HH, s + BEAT * .75, .08, -.3)
    if i % 8 == 7: place(drums, OH, s + BEAT / 2, .14, .3)
    s += BEAT; i += 1
for s in np.arange(first_hit, C1 - .3, BEAT * 2): place(drums, kick(.5), s, .6); kicks.append(s)
duck = np.ones(N)
for s in kicks:
    i = int(s * SR); n = int(.32 * SR); e = 1 - .55 * np.exp(-np.arange(n) / (SR * .09)); j = min(N, i + n)
    if i < N: duck[i:j] = np.minimum(duck[i:j], e[: j - i])
pad *= duck; bass *= duck; keys *= (.4 + .6 * duck)

def whoosh(d=.7):
    x = tt(d); return ffilt(rng.standard_normal(len(x)), 500, 3500) * np.sin(np.pi * np.clip(x / d, 0, 1)) ** 2.2
def riser(d):
    x = tt(d); n = ffilt(rng.standard_normal(len(x)), 1200) * (x / d) ** 2.4; f = 200 + 900 * (x / d) ** 2
    return n * .8 + np.sin(2 * np.pi * np.cumsum(f) / SR) * (x / d) ** 3 * .25
def impact():
    x = tt(3.2); return np.sin(2 * np.pi * (42 + 40 * np.exp(-x / .08)) * x) * np.exp(-x / .7) + ffilt(rng.standard_normal(len(x)), 3000) * np.exp(-x / .9) * .35
def pop(f=700):
    x = tt(.12); fr = f * (1 + .5 * np.minimum(x / .03, 1)); return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-x / .028)
def tapsnd():
    x = tt(.08); return ffilt(rng.standard_normal(len(x)), 1500, 6000) * np.exp(-x / .006) * .8 + np.sin(2 * np.pi * 180 * x) * np.exp(-x / .02) * .6
def typesnd(): x = tt(.03); return ffilt(rng.standard_normal(len(x)), 2000, 7000) * np.exp(-x / .004)
def bell(f, d=1.4):
    x = tt(d); return (np.sin(2 * np.pi * f * x) + .4 * np.sin(2 * np.pi * f * 2.76 * x) * np.exp(-x / .2) + .2 * np.sin(2 * np.pi * f * 5.4 * x) * np.exp(-x / .08)) * np.exp(-x / .45)
def scan(d=1.3):
    x = tt(d); f = 900 + 700 * (x / d); return np.sin(2 * np.pi * np.cumsum(f) / SR) * (.5 + .5 * np.sin(2 * np.pi * 14 * x)) * np.sin(np.pi * x / d)
L_ = lambda k: CU.get(k) or []
for s in L_('whoosh'): place(fx, whoosh(), s - .3, .22, rng.uniform(-.4, .4))
for s in L_('pop'): place(fx, pop(rng.choice([620, 740, 830, 990])), s, .16, rng.uniform(-.5, .5))
for s in L_('tap'): place(fx, tapsnd(), s, .3)
for s in L_('type'): place(fx, typesnd(), s, rng.uniform(.12, .2), rng.uniform(-.2, .2))
for s in L_('chime'): place(fx, bell(hz(88)), s, .12, -.1); place(fx, bell(hz(95)), s + .12, .1, .1)
for s in L_('shutter'): place(fx, tapsnd(), s, .35); place(fx, tapsnd(), s + .06, .25)
for s in L_('success'):
    for j, m in enumerate((86, 90, 93, 98)): place(fx, bell(hz(m), .9), s + j * .07, .09, -.3 + j * .2)
for s in L_('scan'): place(fx, scan(), s, .05)
for s in L_('thud'): place(fx, pop(220) + kick(.3)[: int(.12 * SR)] * .5, s, .25)
for s in L_('hit'): place(fx, impact(), s, .55)
for a, b in L_('riser'): place(fx, riser(b - a), a, .22)

def reverb(b, dur=2.2, wet=.22):
    n = int(dur * SR); x = np.arange(n) / SR; out = np.zeros_like(b); L2 = 1 << int(np.ceil(np.log2(N + n)))
    for ch in range(2):
        ir = ffilt(rng.standard_normal(n) * np.exp(-x / (dur / 6)), 200, 6000); ir /= np.sqrt(np.sum(ir ** 2))
        out[ch] = np.fft.irfft(np.fft.rfft(b[ch], L2) * np.fft.rfft(ir, L2), L2)[:N]
    return b + out * wet
bright = {'calm': 1600, 'warm': 2200, 'bright': 3200, 'dark': 1300}.get(MOOD, 2200)
pad = np.stack([ffilt(pad[0], 80, bright), ffilt(pad[1], 80, bright)])
music = reverb(pad + keys * .9 + bass * .9 + drums * .85, 2.2, .22)
fxw = reverb(fx, 1.6, .3)
mix = music + fxw
gate = np.ones(N)
for a, b in L_('silence'):
    i, j = int(a * SR), int(b * SR); gate[i:j] = 0; gate[max(0, i - 480):i] = np.linspace(1, 0, min(480, i))
mix *= gate
mix *= np.clip((LEN - t) / 1.2, 0, 1); mix[:, :2400] *= np.linspace(0, 1, 2400)
mix = np.tanh(mix * 1.1) / np.tanh(1.1); mix = mix / (np.max(np.abs(mix)) + 1e-9) * .89
sf.write(OUT, mix.T, SR)
# the effects alone, for laying under your own track
fxo = fxw * gate; fxo = np.tanh(fxo * 1.1) / np.tanh(1.1); fxo = fxo / (np.max(np.abs(fxo)) + 1e-9) * .8
sf.write(OUT.replace('score.wav', 'fx.wav'), fxo.T, SR)
per = [float(np.sqrt(np.mean(mix[:, int(i * SR):int((i + 1) * SR)] ** 2))) for i in range(int(LEN))]
print(f"score → {OUT} · {LEN:.1f} s · {BPM:.0f} bpm · key {MU.get('key', 'D')} · mood {MOOD}")
print('loudness per second:', ' '.join(f'{v:.2f}' for v in per))
