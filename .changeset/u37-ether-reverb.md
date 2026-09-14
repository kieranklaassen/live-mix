---
'@kieranklaassen/live-mix': patch
---

Ether reverb device (U37): kkfonie's Ether as a stereo WASM insert. `createEtherReverb` / `ETHER_REVERB_DEVICE` / `ETHER_REVERB_PARAMS` (dsp entry): Freeverb exactly as `juce::dsp::Reverb` runs it (eight combs and four allpasses per channel, 23-sample spread, JUCE's constants) behind Ether's `predelayMs`, its `decay`/`size` → roomSize and `damping` law, and `freeze` (lossless combs, input and dry muted); linear `mix`. `etherReverbLaw` is the knob → Freeverb mapping for UIs. Registered as `ether-reverb` (category reverb) with Ether/Room/Cathedral/Frozen presets. One intentional difference from JUCE: tails decay to exact zero instead of idling in JUCE_UNDENORMALISE's −116 dBFS limit cycle.
