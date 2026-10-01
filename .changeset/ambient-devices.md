---
'@kieranklaassen/live-mix': patch
---

Ambient devices, built as spec devices on `cpp/kit` and registered by `registerStockWasmDevices()`. Each has a native harness under `cpp/test` and presets in its `device.json`.

Ported from the kkfonie DSP (each manifest records the source commit and every deviation from it):

- Instruments: `ember` (16-voice subtractive pad synth) and `thesis` (chords of resonant noise bands, mirrored around a centre note within a scale).
- Effects: `chorus`, `flanger`, `phaser`, `saturator`, `auto-filter`, `lattice` (scale-aware four-voice harmonizer), `sympathetic` (strings tuned to a scale that ring with the input) and `bloom-reverb` (a tail read through reversed, pitch-shifted grains).

New:

- Instruments: `grain-synth` and `sampler` (both play a loaded sound, see `SAMPLE_DEVICE_IDS`), `fm-glass`, `tine-piano` and `organ`.
- Reverbs: `shimmer`, `expanse` (with a lossless freeze) and `spring-reverb`.
- Delays and loops: `tape-loop`, `reverse-delay` and `grain-delay`.
- Texture and pitch: `grain-cloud`, `spectral-blur`, `freq-shifter` and `tape`.
- Movement and dynamics: `tremolo`, `rotary` and `swell`.

A `WasmDeviceDefinition` that gives only `latencySamples` now reports `latencySec` as well, so delay compensation sees the device whichever field it reads.
