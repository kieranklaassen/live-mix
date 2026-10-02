---
'@kieranklaassen/live-mix': minor
---

The factory bank in any key, and new sounds from a seed (`./dsp`). `factoryTranspose(key)` is how far the bank moves to sit in a key, `transposeFactorySound` moves a sound there (notes, devices set to a pitch, and the note names in its name and description) and `renderFactorySound` takes `transpose`. `generateSound({ seed, kind, key, degree })` makes a drone, pad, texture, one-shot or short phrase in a key and on one of its chords, the same sound for the same seed, and `renderGeneratedSound` renders it. Also `keyChord`, `chordTakes`, `chordTones`, `chordName`, `transposePatch`, `transposePhrase`, `transposeWords`, `relativeMajorRoot`, `pitchClassName`, `FACTORY_MODES`.
