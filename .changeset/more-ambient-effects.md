---
'@kieranklaassen/live-mix': minor
---

Twenty-one effects and four instruments for ambient music: the pitch, drive, lo-fi, glitch, looping and reverb devices the library lacked. Each is a spec device on `cpp/kit` with a native test that measures what it claims, six or more presets of its own, a description of every control, and a place in the factory bank. Each was built by one worker and checked by a second. None is an emulation of a product, and none has been listened to: every trait is held by a measurement.

Pitch:

- `octaves` (Octaves): the notes you play one and two octaves down and up, following chords note by note with no audible delay.
- `pitch-shifter` (Pitch Shifter): two shifted voices in four characters (Smooth, Grain, Vintage, Chords), with a delay and feedback that make the repeats climb or fall.
- `stereo-detune` (Stereo Detune): a copy a few cents sharp on the left and flat on the right, each a few milliseconds late.
- `half-speed` (Half Speed): what you are playing an octave down and twice as slow, in cycles that chop or run together.

Drive and worn media:

- `analog-drive` (Analog Drive): tape preamp, console, transformer, triode and pentode stages, with the level roughly held as Drive rises.
- `re-amp` (Re-amp): an amplifier and one of five loudspeakers in a room, with a microphone you can pull back and turn away.
- `vintage-digital` (Vintage Digital): an early sampler's converters, with true aliasing, hold images, companding and clock jitter.
- `low-bitrate` (Low Bitrate): a starving audio stream: quiet detail thrown away, with lost and stuck packets.
- `vinyl` (Vinyl): warp, crackle, pops, a scratch once a turn, hiss and rumble, a worn groove, and a platter that stops and starts.
- `radio` (Radio): a night-time radio link that fades, with static, whistles and voices pitched wrong on sideband.
- `noise-floor` (Noise Floor): tape hiss, record crackle, room rumble, mains hum, static or microphone air under whatever is playing.

Glitch, loops and sustain:

- `glitch` (Glitch): slices repeated, stuck, reversed or slowed to a stop by chance, as hard cuts or soft stumbles.
- `micro-looper` (Micro Looper): an always-listening short looper that renews its loop as you play on.
- `cascade` (Cascade): little loops of what you just played, stacked at octave and fifth speeds in a pattern.
- `echo-memory` (Echo Memory): an echo under which moments from the last minute drift back.
- `sustainer` (Sustain): catches what you play and holds it as an even pad; the next chord glides over.
- `pad-follower` (Pad Follower): a string-section pad that grows out of what you play and follows its harmony.

Delay and reverb:

- `analog-delay` (Analog Delay): bucket-brigade repeats that dull as the time gets longer, with chorus and a stepped clock.
- `shaped-reverb` (Shaped Reverb): a reverb whose level follows a drawn shape instead of dying away (Gate, Reverse, Bloom, Fall, Pulse).
- `vowel-reverb` (Vowel Reverb): a hall whose tail is shaped by the formants of a sung vowel.
- `swarm-reverb` (Swarm Reverb): a cavern of short echoes, with a Stretch control that resizes it and bends everything in it in pitch.

Instruments:

- `tape-orchestra` (Tape Orchestra): orchestral sections from a strip of worn tape under every key.
- `west-coast` (West Coast): frequency modulation and wavefolding through a low-pass gate.
- `zither` (Zither): harp, chord zither and hammered dulcimer, with twelve sympathetic strings.
- `outdoors` (Outdoors): birds, crickets, frogs, a stream, thunder and wind chimes, synthesised live.

Also:

- The noise of Vinyl, Radio and Noise Floor carries on through gaps of about fourteen seconds, so slow playing keeps its bed; after that it fades and an idle track is exactly silent.
- Every effect cleans its input on entry: one not-a-number or infinite sample no longer lodges in a filter.
- The factory bank gains chains for every new effect and five presets for each new instrument.
