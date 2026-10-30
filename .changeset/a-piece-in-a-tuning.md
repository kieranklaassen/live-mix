---
'@kieranklaassen/live-mix': minor
---

Tunings for a piece's keys: `tuneKey(key, { tuning, root, chordRoot })` from `./dsp` turns a key into the fractional key it sounds at in Equal, By ear, Just, Pythagorean, Meantone, Slendro, Pelog, Rast or Bayati, with `KEY_TUNINGS`, `KEY_TUNING_LABELS`, `KEY_TUNING_SCALES` and `isKeyTuningId`. The root keeps its equal pitch in every tuning. `renderPatch`, `renderFactorySound` and `renderGeneratedSound` take `keyTuning`; a kit, and a sound made from another one, keep their own notes, and without one every render is as before. `GeneratedSound.steady` says a generated sound's tones loop whole. Measured offline in Node; never heard.
