---
'@kieranklaassen/live-mix': patch
---

Fifteen instruments ambient music is made with. Each is a spec device on `cpp/kit` with a native test that measures what it claims, six or more presets of its own, five factory presets, and a description of every knob. None is a sample or circuit emulation, and none has been listened to: every trait is held by a measurement.

- `dusk` (Dusk): an eighties chorus polysynth. One oscillator a key with a locked sub octave, a four-pole filter that can sing, and a two-line stereo chorus (I, II, I + II).
- `aurora` (Aurora): a dual-layer brass and string pad that starts dark, overshoots and keeps swelling while held, with a ring modulator sweep at the onset.
- `ladder-bass` (Ladder Bass): a one-voice bass of two beating oscillators and a sub through an overdriven four-pole filter, with glide.
- `chord-harp` (Chord Harp): the keys you hold are the chord, and each press sweeps it across up to four octaves of soft plucks over a held pad.
- `guitar` (Guitar): a clean electric guitar through a pickup whose colour follows the fret, an amplifier and a speaker, with strum and swell.
- `acoustic-guitar` (Acoustic Guitar): steel, nylon and twelve strings through a wooden body, plucked with a fingertip, a nail or a pick.
- `pedal-steel` (Pedal Steel): long-ringing strings where an overlapping key bends the held one, with a shared bar vibrato and a volume-pedal swell.
- `harp` (Harp): a concert harp with koto and guzheng strings, strings that ring in sympathy, pressed bends and a glissando.
- `chamber-strings` (Chamber Strings): one to six bowed players on every note, each with their own pitch, vibrato and bow, through wooden bodies.
- `tanpura` (Tanpura): a four-string drone plucked round and round, each pluck blooming into a sweep of overtones on its curved bridge.
- `flute` (Flute): concert and low flutes, shakuhachi, pan pipes and wood flute, with breath in the tone.
- `clarinet` (Clarinet): a soft reed from a clarinet's cylinder to a saxophone's cone, breathy when quiet.
- `horns` (Horns): French horn, flugelhorn, trumpet open and muted, and low brass, in sections of up to four with a parallel harmony voice.
- `mallets` (Mallets): marimba, vibraphone, xylophone, glockenspiel and celesta, with a motor and a roll.
- `handpan` (Handpan): a hand-played steel pan and tongue drum whose ringing notes answer each other.

Also:

- `kit::PluckedString` and `kit::PluckExciter` (`cpp/kit/string.h`): one tuned delay loop with decay times at the fundamental and at a high partial, stiffness, a pluck-position comb and a pickup tap. Guitar, Acoustic Guitar, Pedal Steel and Harp are built on it.
- Two more factory preset groups, `plucked` and `wind` (`FactoryPresetCategory`, `FACTORY_PRESET_CATEGORIES`), after `string` in browser order. The bank now holds 150 presets for thirty instruments.
- Fixed: `kit::Adsr` kept a fast release that was cut short by the next note, so a key struck again while every voice was busy released in the steal time whatever Release said. Organ, Choir, String Machine, Atmosphere, Drone, Wavetable, Grain, Sampler, Glass and Bow are rebuilt with the fix.
