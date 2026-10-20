---
'@kieranklaassen/live-mix': minor
---

A gate (`gate`, `WORKLET_GATE_DESCRIPTOR`, in the dynamics group and among the stock devices `registerStockWasmDevices` registers): an AudioWorklet device that turns a sound down while it is under a threshold, keyed on itself, to take the room, a fan or breaths out of the pauses between words. Threshold, Range, Attack, Hold, Release and Hysteresis; a peak detector that falls in 10 ms, no look-ahead (latency 0), a click-free bypass, and its gain and level as meters. Its defaults are a gentle gate for a speaking voice (opens at -50 dB peak, 12 dB down when closed, 2 ms attack, 150 ms hold, 200 ms release, 4 dB hysteresis), and its presets are "Voice, gentle", "Voice, firm", "Noisy room" and "Hard gate". `GateKernel` holds the DSP for offline rendering and tests; the dsp entry has `loadGateProcessor`, `createWorkletGate` and `gateProcessorUrl` (`dist/worklets/gate.js`).
