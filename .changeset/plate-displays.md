---
'@kieranklaassen/live-mix': patch
---

Plates get displays, and every stock effect a plate.

- `PlateDisplay` (`display` on a `DeviceSkin`): a canvas on a plate that shows what the device is doing while it does it, drawn on frames from the parameters, the device's own readings and the sound going in and coming out. Two places: a `strip` under a row of four knobs, a `window` beside two rows. It runs only while it is in view and its device is on, on one frame loop shared by every display.
- Handles: points on a display that can be dragged (`handles`), with the wheel and a double press. A drag writes the same parameters as the knobs, as one undo step: `useDevice()` gains `touchMany`, `setMany` and `releaseMany`.
- `displayKit`: what displays share (ground, ink strengths, dB and frequency scales, traces, `spectrum`, `History`, filter responses, LFO shapes, `trackPhase`). `PLATE_FACES`: the stock displays by device id. The Ambient Compressor, the Parametric EQ and the Tremolo are the first three.
- `DEVICE_SKINS` has a skin for every stock effect: 22 more (the EQs and filters, compressors and limiters, the plain delay and reverbs, the utilities, flanger, phaser, tremolo and the rest).
- `DeviceChainView` tells each plate what feeds its device (`source` on `DevicePlate`), so a display can show the level going in.
- A meter may be for a display only: `"display": true` in `device.json`, `DeviceMeterSpec.display`. `printedMeters(device)` is what a panel or a foot prints. Tremolo reports its LFO this way; its sound is unchanged (`scripts/same-sound.mjs`).
- `playground/plates.html`, the plate bench, and `scripts/plates/shoot.mjs`, its camera.
