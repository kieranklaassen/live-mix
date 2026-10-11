---
'@kieranklaassen/live-mix': minor
---

The fourth and last batch of the third ambient round: eight more effects, which makes forty in the round and ninety-five effects in all. A wall of fuzz between two reverbs, a reverb whose tail climbs or sinks for as long as it rings, a table of singing bowls tuned to a key, a body to play a sound inside, an amplifier's feedback that never runs away, a path round the head, width by frequency, and the quiet end of a sound brought up. Each is a spec device on `cpp/kit` with a native test that measures what it claims, sixteen presets of its own, a description of every control, and a plate of its own colour with a display that shows what the device is doing and can be taken hold of. Each was built by one worker and checked by a second, who measured it again and put right what that found. None is an emulation of a product, and none has been listened to: every trait is held by a measurement, and `docs/devices.md` says for each one where a first listen should go. Seven of the eight report no latency; Lift looks 288 samples ahead (6 ms at 48 kHz) and reports it. Haze, at 2.1 % of real time at its defaults, is the one effect of the round over the 2 % aim on its default patch; all eight are under the flag at their dearest setting.

Reverbs and what rings:

- `haze` (Haze): a short reverb into a soft fuzz into a long reverb, so notes blur, grow overtones as they are played harder and hang as one glowing wall.
- `spiral` (Spiral): a reverb whose tail is carried by gliding voices an octave apart under a bell of level, so it climbs or sinks for as long as it rings and never arrives.
- `bowls` (Bowls): a table of metal singing bowls tuned to a key; play in the key and the bowls you touch sing with you and ring on after, each with its own slow beat and its place between the sides.
- `vessel` (Vessel): plays the sound inside a body that rings: a bottle, a pipe, a shell, a drum or a soundboard, of any size and material.
- `howl` (Howl): the sound feeds back on itself like an amplifier in the room; held notes bloom into an overtone of the note Distance tunes, and it never runs away.

Space and width:

- `around` (Around): moves the sound round your head on a circle, a figure of eight, a swing or a slow wander, by what two ears go by; best on headphones.
- `spread` (Spread): width by frequency, the bass held in the middle and the top opened wide, on a curve with points to drag, and it can make width where a sound has none.

Level:

- `lift` (Lift): brings up the quiet end, so tails, breaths and the air between notes rise towards a line and what is louder than the line is left alone. It reports 6 ms of latency.
