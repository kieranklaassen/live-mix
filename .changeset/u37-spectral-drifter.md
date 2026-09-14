---
'@kieranklaassen/live-mix': patch
---

SpectralDrifter device (U37): kkfonie Bloom's granular pitch drifter as a stereo WASM insert. `createSpectralDrifter` / `SPECTRAL_DRIFTER_DEVICE` / `SPECTRAL_DRIFTER_PARAMS` (dsp entry): `mix`, `bloom`, `direction` (Up/Down/Scatter), `season`, `seed`, `interval` (Fifth/Octave/Fifth+Octave/Atonal), `decay`, and Bloom's activity-based age tracker on the input (`ageMode` 0) or a host-driven `age` (`ageMode` 1); `spectralDrifterIntensity` is the drift law for UIs. Registered as `spectral-drifter` with Bloom/Shimmer/Winter drift/Scatter presets in `registerStockWasmDevices`. The C++ under `cpp/devices/spectral-drifter/` is Bloom's `SpectralDrifter.{h,cpp}` with the JUCE references replaced and denormal flushes added (source SHA in `device.json`); `docs/devices.md` starts the per-device CPU record.
