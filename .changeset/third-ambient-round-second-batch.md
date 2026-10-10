---
'@kieranklaassen/live-mix': minor
---

The second batch of the third ambient round: ten more effects that move a sound instead of adding a tail to it. Bands that swell like water, a breath, a kind of weather, a depth of water, two gates that slide against each other, a whistle sung out of a drone, a ring modulator in key, a vibrato that waits, a flock, and the turn of a year. Each is a spec device on `cpp/kit` with a native test that measures what it claims, sixteen presets of its own, a description of every control, and a plate of its own colour with a display that shows what the device is doing and can be taken hold of. Each was built by one worker and checked by a second, who measured it again and put right what that found. None is an emulation of a product, and none has been listened to: every trait is held by a measurement, and `docs/devices.md` says for each one where a first listen should go.

Slow movement:

- `currents` (Currents): splits the sound into bands that each swell, fade and drift from side to side on a slow cycle of their own, so a still pad moves like water.
- `breath` (Breath): a slow cycle of breathing in, holding, breathing out and resting that opens and closes the level, the brightness and the width of any sound.
- `pulses` (Pulses): two soft gates pulse the sound on one pattern, the second a little faster, so the two drift apart and come back together.
- `seasons` (Seasons): one dial turns the year, from a bright quick spring through a warm wide summer and a dark crumbling autumn to a thin frozen winter, and the year can turn by itself.

Places:

- `weather` (Weather): leaves the sound out in wind, passing clouds, rain, surf or a storm, each moving its level and tone and adding a thin sound of its own.
- `underwater` (Underwater): takes the sound under water, muffled, slowly wavering and closing in from the sides, with bubbles rising off the attacks; one knob for how deep.
- `murmuration` (Murmuration): turns one voice into a flock of up to sixteen that fly around the listener, each with its own distance, delay and bend in pitch.

Pitch and tone:

- `overtone-singer` (Overtone Singer): a narrow resonance that steps through the harmonics of a root note and sings a whistled melody out of a drone or a pad.
- `ring` (Ring): a ring modulator tuned to a note of the key, with a slow drift, that turns plain tones into bells and gongs.
- `late-vibrato` (Late Vibrato): a vibrato that waits: a held note begins straight and sways more the longer it lasts, and each new note sends everything back to straight. It reports 20 ms of latency.
