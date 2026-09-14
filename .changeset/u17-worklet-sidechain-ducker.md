---
'@kieranklaassen/live-mix': patch
---

Audio-thread sidechain ducker (U17): `WorkletDucker` runs envelope detection and the gain inside an AudioWorklet (`dist/worklets/ducker.js`, two inputs: signal and key) with the Phase 0 defaults plus attack/hold/release, depth, key scale and gain time constant as device params; no main-thread timer or `setTargetAtTime` traffic. `engine.addDucker(bus, { mode: 'worklet' })` inserts it post-fader (opt-in; the legacy poll stays the default and unchanged), both implement the new `SidechainDucker` interface. dsp entry: `loadDuckerProcessor`, `createWorkletDucker`, `duckerProcessorUrl`, `ensureProcessor`. `DuckerKernel` exposes the DSP for offline rendering and tests.
