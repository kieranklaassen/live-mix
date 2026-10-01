---
'@kieranklaassen/live-mix': minor
---

Patches and a factory bank. A `Patch` is an instrument with its effects, or an effect chain: `validatePatch`, `createPatchDevice`, `createPatchEffects`, `replaceInserts`, `capturePatch` (core entry). `renderPatch` (`./dsp`) plays a phrase through a patch, or audio through a chain, on the device modules themselves with no audio context: sample-accurate notes, the same result in Node and in a browser, optional seamless loop and peak normalising. On top of both: `FACTORY_PRESETS` (every stock instrument), `FACTORY_CHAINS` (every WASM effect), `FACTORY_SOUNDS` (recipes rendered on demand to paint with), `renderPresetPreview`, `renderChainPreview` and `renderFactorySound`. `wasmDeviceDescriptor` now returns a `WasmDeviceDescriptor` that keeps its `definition`, which is what the renderer runs.
