---
'@kieranklaassen/live-mix': minor
---

Nine devices of beats, pulses, noise and breath: six instruments and three effects, each named for its technique and described by what is heard. Each is a spec device on `cpp/kit` with a native test that measures what it claims, presets of its own (twenty-three or twenty-four on an instrument; sixteen on Ear Shift, twenty-four on Band Pulse and on Winding Down), a description of every control, and a plate of its own colour with a display. The bank gains thirty presets for each instrument and ten chains for each effect, which makes 1,304 presets over sixty-one instruments and 364 chains over ninety-eight effects. Every preset takes its figure from a rate or a shape that research has used, or from a place where beating is already an instrument (paired bars, a struck bowl, a detuned rank, two strings on one note), and its description gives the figure and what is heard. Each device was built by one worker and checked by a second. None is an emulation of a product, and none has been listened to: every trait is held by a measurement, and `docs/devices.md` says for each one what is weak or unproven and where a first listen should go.

`docs/concepts/beats-and-pulses.md` is new: what each technique is, what research has found and what it has not, the table of sources the presets are drawn from, where a beat between the ears survives in a mix (it needs headphones, and a pan, speakers or a reverb's tail put it in the air), and the cautions the research gives. No device text promises a listener anything.

Binaural, Twin Bars, Ear Shift and Still Point have an Ears control, one law that splits two parts between the ears: at 1 each ear has one part, and at 0 both ears have both and the beat is in the air, for speakers. Where the two parts are a pair of tones, the left ear has the higher one on every device.

Instruments:

- `binaural` (Binaural): on headphones each key is a pair of warm tones a few hertz apart, one to an ear, heard as a beat between the ears; a bed of coloured noise can lie under it, and Beat can glide to a Target over minutes.
- `isochronic` (Isochronic): each key is a tone, or a band of noise at the key, switched on and off evenly by one pulse that all keys share, with its Duty, Edge and Depth; Offset sets the right ear's pulse behind the left's, and Rate can glide to a Target over minutes.
- `coloured-noise` (Coloured Noise): a held key opens one bed of noise, from white through pink to brown at one level, with low and high cuts; keys can tint it with a faint pitch, and a slow drift that keeps no beat moves it.
- `breath-pacer` (Breath Pacer): a swell of air and tone shaped by In, Hold, Out and Rest in seconds, with a soft mark at each turn; it starts at In with the first key and can slow down over minutes. Its description ends with a plain caution.
- `still-point` (Still Point): held keys are warm steady tones and one sine sweeps slowly back and forth through them, so the beat with each key slows to stillness as they meet and speeds away after.
- `twin-bars` (Twin Bars): on headphones each key strikes two bars of metal, wood or glass a few hertz apart, one nearer each ear, so every note beats at one rate from the lowest key to the highest.

Effects:

- `ear-shift` (Ear Shift): on headphones any sound beats between the ears; the band between Low and High is moved up by half of Beat in the left ear and down by half in the right. It has no Mix.
- `band-pulse` (Band Pulse): pulses only the band between Low and High, up to forty times a second, with a set Duty and Edge, and leaves bass and air steady.
- `winding-down` (Winding Down): layers of one pulse, each twice as fast as the next, glide together and fade in and out, so the pulse seems to slow, or quicken, without end. It only turns sound down.
