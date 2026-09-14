---
'@kieranklaassen/live-mix': patch
---

Master limiter and LUFS/true-peak meters (U16). `createTruePeakLimiter` (dsp): a stereo-linked lookahead brickwall behind the device ABI whose detector is the BS.1770-4 four-phase true-peak FIR (`ceilingDb` −20..0 dBTP default −1, `releaseMs`, `inputGainDb`; 77 samples of latency at 48 kHz). `engine.master.installLimiter(factory)` places any device as an unbypassable fixed stage after the fader and inserts, ahead of the meter and terminus (`master.limiter` exposes params only). `LufsMeter` + `worklets/meter.js`: an AudioWorklet sink posting momentary/short-term/gated-integrated LUFS, sample peak and true peak at ≤ 30 Hz; `engine.master.installLufsMeter()` taps the limited output, `bus.addTap/removeTap` feeds any bus into any meter across insert changes. `LoudnessAnalyzer` is the same DSP for offline use. `engine.stats` counts render underruns via `AudioContext.renderCapacity` where available. Nothing is added to the default graph.
