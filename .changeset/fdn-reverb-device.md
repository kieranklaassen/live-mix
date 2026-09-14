---
'@kieranklaassen/live-mix': minor
---

Add the `fdn-reverb` WASM device: kkfonie's Tides 8-line Feedback Delay Network (coprime delays, Hadamard mixing, input diffusion, modulated allpass-interpolated lines, DC blocker, damping) extracted JUCE-free into `cpp/devices/fdn-reverb/fdn_reverb.h`. Params `mix`, `decay`, `damping`, `predelayMs`, `size`, `breathRate`, `breathDepth` are exported as `FDN_REVERB_PARAMS` from `@kieranklaassen/live-mix/dsp`, with `fdnReverbBreathLaw` for UI parity with the Tides breathing law.
