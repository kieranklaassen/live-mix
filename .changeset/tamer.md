---
'@kieranklaassen/live-mix': minor
---

Tamer: an effect that finds the tones that ring out above the bed of sound around them, as they happen, and turns only those down.

- `tamer` (category `eq`): six controls. Depth is how much of what stands out is taken away, Sharpness how narrow a thing has to be to count (a twelfth of an octave up to a whole one), Time how fast a cut comes in (it lets go four times slower), From and To fence in where it works, and Listen plays only what is being taken away.
- No latency: the sound only passes peaking filters that cut, up to 48 at once, so with nothing to cut the output is the input sample for sample and nothing ever comes out louder than it went in. Two FFTs (4096 points under 1.6 kHz, 1024 above) listen beside the path and say where to cut.
- It needs a bed to stand out of. A lone note, the partials of one note and a phrase of clean notes over other clean notes are left alone; a tone standing 15 dB out of noise is taken down by 6 dB at Depth 0.5 and 14 dB at Depth 1, with the bed an octave away moved by less than 0.2 dB. It cannot tell a note that stands out of a dense wash from a ringing tone that does.
- Under about 400 Hz its bands are 23 Hz wide, so cuts there are broader and slower, and under about 90 Hz nothing is cut.
- Meters: `reduction` (the deepest cut in force, dB) and twelve readings that carry the cut at 48 points from 40 Hz to 20 kHz for the plate's display.
- Ten presets by use, and two factory chains that use it: Smooth long tail and Ringing eased.

Measured on test signals in its native harness and never listened to. Costs about 0.5 % of real time on a plain signal and about 2 % with some twenty cuts at work (WASM, Node).
