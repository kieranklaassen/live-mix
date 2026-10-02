---
'@kieranklaassen/live-mix': minor
---

Plates for the ambient effects (`./react`): twenty-two more skins in `DEVICE_SKINS`, so a chain drawn with `skin={deviceSkin}` shows each of them as its own object.

- Analog Delay, Analog Drive, Cascade, Echo Memory, Glitch, Half Speed, Low Bitrate, Micro Looper, Noise Floor, Octaves, Pad Follower, Patina, Pitch Shifter, Radio, Re-amp, Shaped Reverb, Stereo Detune, Sustain, Swarm Reverb, Vintage Digital, Vinyl and Vowel Reverb each have a plate colour of their own, a finish, a knob cap, four knobs on the face and a picture that follows the settings: Loss on Low Bitrate throws blocks away, Shape on Shaped Reverb redraws the envelope, Medium on Patina changes the glyph.
- The new pictures stand clear of the name tag along the plate's foot.
- No API change: `deviceSkin(device)` answers with the new skins, and `PLATE_PALETTES` carries their colours.
- A knob's name on a plate is no longer cut with an ellipsis: a name of two words takes two lines, and a long word is set tighter (`lm-plate__knob--tight`).
