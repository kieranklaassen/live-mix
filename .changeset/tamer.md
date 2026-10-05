---
'@kieranklaassen/live-mix': minor
---

Tamer: an effect that finds the tones that ring out above the bed of sound around them, as they happen, and turns only those down.

- `tamer` (category `eq`): six controls. Depth is how much of what stands out is taken away, Sharpness how narrow a thing has to be to count (a twelfth of an octave up to a whole one), Time how fast a cut comes in (it lets go four times slower), From (120 Hz to 2 kHz) and To (1 to 20 kHz) fence in where it works, and Listen plays only what is being taken away.
- No latency: the sound only passes peaking filters that cut, up to 48 at once, so with nothing to cut the output is the input sample for sample. Two FFTs (4096 points under 1.6 kHz, 1024 above; twice that above 72 kHz, so 88.2 and 96 kHz hear as 44.1 and 48 kHz do) listen beside the path and say where to cut.
- It needs a bed to stand out of, one that has lasted 0.2 s (0.07 s higher up) and is still there. A lone note, the partials of one note, a note with a hard start and a phrase of clean notes over other clean notes are left alone; a tone standing 15 dB out of noise is taken down by 6 dB at Depth 0.5 and 14 dB at Depth 1, with the bed an octave away moved by less than 0.2 dB. A tone 30 dB or more over what is around it is taken for the sound itself and left alone.
- What it cannot do: tell a note with noise within some 15 dB under it, or one that stands out of a dense wash, from a ringing tone; touch anything under 120 Hz, or the topmost band; handle a piercing partial of a sound that has no bed at all.
- A steady cut adds no level anywhere, and at the defaults no band comes out more than 0.05 dB louder. At Depth 1 with Time at 10 ms a fast-moving cut can add a few dB in a narrow band beside the tone it is cutting.
- Under about 400 Hz its bands are 23 Hz wide, so cuts there are broader and slower.
- Meters: `reduction` (the deepest cut in force with every cut counted together, dB) and twelve readings that carry the cut at 48 points from 40 Hz to 20 kHz for the plate's display.
- A plate with its own display: the cuts as they happen, From and To as two points to drag, Depth as a third, Sharpness on the wheel.
- Ten presets by use, and two factory chains that use it: Smooth long tail and Ringing eased.

Measured on test signals in its native harness and never listened to. Costs about 0.5 % of real time on a plain signal and about 1.7 % with some twenty cuts at work.
