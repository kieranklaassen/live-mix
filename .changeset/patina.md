---
'@kieranklaassen/live-mix': minor
---

Patina: one device that puts a mix on a medium, and fades in from clean.

- `patina` (category `texture`): six media behind one set of amounts. Medium chooses Reel, Cassette, Vinyl, Radio, Sampler or Valve; Drive is how hard the signal hits it (harmonics and squashed peaks, on Sampler a lower bit depth); Wobble is what moves (wow and flutter on the tape media and the record, fading on Radio, sag on Valve, clock jitter on Sampler); Wear narrows the band (and lowers Sampler's rate); Noise is the medium's own (hiss, crackle and rumble, static and mains hum, converter hash, a buzz); Tone, Output and Mix finish it.
- Zero is clean: with Drive, Wobble, Wear and Noise at 0 every medium passes the signal within 0.3 dB to 16 kHz, so a host can fade a character in from nothing, and a change of medium is one parameter (a 60 ms dip to the clean signal and back).
- Level is held for a steady sound at −12 dBFS whatever the Drive. Noise is only made while the device is awake: it carries on for three seconds after the input stops, fades, and an idle track is exactly silent.
- 271 samples of latency at every sample rate. 1.1% of real time at 48 kHz in WebAssembly at its defaults, 1.3% at its worst. Eight presets, and a factory chain, "Worn tape wash".
