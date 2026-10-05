---
'@kieranklaassen/live-mix': minor
---

`ambient-limiter` gains Auto gain: it turns a quiet mix up to the ceiling by itself and holds the setting.

- `autoGain` (0 to 24 dB, 0 by default): how far the limiter may turn the mix up. It works to the line the ride works to (Ceiling − 0.5 dB, read before Gain), so with it on Gain is how far the levelled mix is pushed into the ceiling.
- It starts at the setting and gives way to what stands over the line. For the first 3 s of sound the first note sets it (50 ms); from then on a sustained over is taken out of it with a 3 s time constant while the ride holds the over down, and is handed back to the ride dB for dB, so the output does not dip. It rises 1.2 dB a minute, never on what is under −45 dBFS, and is kept through a sleep: a tail dies away as it would and nothing pumps.
- At 0 the device is what it was, sample for sample (`node scripts/same-sound.mjs ambient-limiter --shipped`: defaults, every shipped preset and every parameter it had, swept). Every shipped preset keeps Auto gain at 0.
- A third reading, `lift`: what the auto gain adds now, in dB. The plate's display counts it into the level arriving and prints it at the foot; Auto gain takes Ride's place on the face, and Ride is behind `+1`.
- Two presets: "Full level" (ceiling −0.3 dBTP, up to 12 dB) and "Full and dense" (the same, pushed 3 dB into the ceiling). They are held to their own ceiling and gain by the preset tests (`FULL_LEVEL_PRESETS`), where every other preset stays under −1 dBFS and within 6 LU of the dry phrase.
- `scripts/same-sound.mjs --shipped` plays the presets and sweeps the parameters a device had at the ref, for a device that has gained a parameter.
- `limitRendered(audio, params)` (`./dsp`): the limiter over a finished render, in place. With Auto gain on it hears the whole of it first and holds the lowest gain it came to from the first sample to the last, which is what an export wants: live the gain is found as the piece plays, and a file would start too loud and come down over its first swell.
