---
'@kieranklaassen/live-mix': minor
---

Node devices, device registry and presets (U23).

- `NodeDevice` hosts stock Web Audio graphs behind the `Device` contract: GainNode input/output, params clamped and ramped over 5 ms (`NODE_DEVICE_RAMP_SECONDS`, the WASM bypass length) on the underlying AudioParams, click-free dry/wet bypass that keeps the chain running. `defineNodeDevice` builds new ones from a param table and a `build(context)` graph.
- Six stock node devices: `filter` (one biquad, `type` picks the response), `eq3` (low shelf / peaking / high shelf), `parametric-eq` (low cut, four peaking bands, high cut), `compressor` (DynamicsCompressor + make-up, `reductionDb` meter, 6 ms lookahead reported as latency), `delay` (damped feedback loop, linear dry/wet mix) and `utility` (gain, pan, width down to mono, polarity). Each ships `*_PARAMS`, `*_DEVICE`, `*_DESCRIPTOR`, `create*()` and factory presets.
- `DeviceRegistry` (`register`, `unregister`, `list({ kind, category })`, `describe`, `create(id, ctx, { params, preset, ...factoryOptions })`, `presets`, `capturePreset`, `onChange`) with descriptor validation; the default `devices` registry is pre-seeded with the node devices. `./dsp` adds `wasmDeviceDescriptor`, one `*_DESCRIPTOR` per stock WASM device (dattorro, fdn-reverb, stereo-widener, zita-rev1, limiter-1176), `STOCK_WASM_DEVICES` and `registerStockWasmDevices()`.
- Presets are serialisable partial param snapshots (`Preset`, `capturePreset`, `applyPreset`, `serializePreset`/`parsePreset`, `listPresets`, `defaultPreset`, `presetParams`); unknown params are dropped and values clamped on load so older presets keep working.
- `dbToGain` / `gainToDb`.
