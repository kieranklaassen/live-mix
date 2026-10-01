---
'@kieranklaassen/live-mix': patch
---

More ambient instruments, built as spec devices and registered by `registerStockWasmDevices()`:

- `wavetable`: a pad that travels through five additive tables (glass, vowels, reed to saw, hollow, spectral).
- `drone`: held keys of just-intoned partials that each drift in pitch, level and position, with a sub, tuned air and a latch.
- `atmosphere`: wind, rain, sea, fire, vinyl and hum, synthesised and played from the keys.
- `bowed-string`: one waveguide string, plucked, held by an ebow or bowed. It is marked `experimental`: twelve bowed notes with the detuned second string measure about 6 % of real time in WASM, over the 5 % line.
- `choir`: a wordless voice pad, two or three singers per note through one bank of five formants that morphs Ah, Eh, Ee, Oh, Oo.
- `modal-bells`: struck and rubbed metal, glass and wood (church bell, singing bowl, vibraphone, bar, kalimba, glass, gong) as banks of decaying modes.

`ember` is now marked `experimental` as well: its unison presets pass 5 % of real time in WASM with eight notes held (Super Saw measures 8.7 %). `docs/devices.md` has the measured cost of every spec device and the kit follow-ups found while building them.

`InstrumentTrack.setDevice` now leaves the outgoing device's output wired into the strip, so the release of the notes it was holding is heard instead of being cut. The strip no longer tracks that node: the caller disposes the old device, or disconnects its output, once the tail has gone.
