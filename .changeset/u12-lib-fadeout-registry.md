---
'@kieranklaassen/live-mix': patch
---

`AudioTrack.fadeOutVoice` (unconditional fade for adapters that keep their own timeline); `ConvolverReverb` joins the device contract (clamped `wet`, `params` option, presets, `CONVOLVER_REVERB_DESCRIPTOR` in `NODE_DEVICES`); `EngineOptions.devices` and `engine.devices` (defaults to the shared registry).
