---
'@kieranklaassen/live-mix': minor
---

Drums, glitches and loops that keep time:

- Two instruments whose keys are things, not pitches: `drum-kit` (four kits of
  twelve drums, each a model: kick, sub, snare, brush, rim, hats, shaker, clap,
  toms, tick) and `glitch-kit` (twelve faults: click, pop, pip, cut, static,
  zap, chirp, stutter, buzz, crackle, bit, double). Every C is the kick or the
  click, the octave a key is in tunes it, and a hit is a one-shot. Sixteen
  presets each, twenty bank presets each in a new preset category, `drum`,
  with its own preview phrase. `KIT_INSTRUMENTS` and `isKitInstrument` name
  them: a host that snaps played notes to a scale leaves a kit alone.
- `FactorySound.bpm`: the tempo a sound that keeps time is written at.
  `soundAtTempo(sound, bpm)` gives it as it is played at another tempo (the
  same strokes on the same beats, as many beats long; echo times and LFO rates
  in its patch follow), and `renderFactorySound(sound, { bpm })` renders it
  there. Nothing is stretched. A sound without a `bpm` is the same object at
  every tempo. `FACTORY_TEMPO_RANGE` is what a tempo is kept inside.
- 76 such loops in the bank, numbers 301 to 394, of whole bars at 120: 32 on
  the Drum Kit, 20 on the Glitch Kit, 24 pitched pulses on the stock
  instruments. The bank is 176 sounds and 740 presets.
- `FactorySound.kit`: a sound played on a kit keeps its notes when the key
  moves (`transposeFactorySound` tunes the kit instead), and a variant of it
  takes no chord, drawn or named. A variant of a sound that keeps time moves a
  stroke by 10 ms at most (`VARIATION_LIMITS.beatTimingSec`).
- `renderPatch` takes `alignLatency`: what the devices report of their own
  delay is rendered on top and left out of the start. `renderFactorySound`
  asks for it for a sound that keeps time.

Nobody has listened to any of it: levels, onsets, loop joins and kinds were
measured (docs/factory.md, docs/devices.md).
