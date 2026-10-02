---
'@kieranklaassen/live-mix': minor
---

Device plates: an effect in a chain can be drawn as an object of its own instead of a grey panel.

- `DevicePlate` draws a device from a `DeviceSkin`: a plate colour and finish, a picture of what the device does that follows its settings, four knobs on the face with the skin's cap, a `+n` cell that opens the rest (the plate widens by whole 20 px cells), a name tag and a lamp that is the power switch. Presets, move and remove show while the plate is pointed at, in use or open. Every knob keeps its info text.
- `DEVICE_SKINS` skins eighteen stock effects (Tides, Expanse, Ether, Cloud, Tape Echo, Shimmer, Tape Loop, Lattice, Chorus, Auto Filter, Tape, Reverse Delay, Spectral Blur, Bloom, Sympathetic, Saturator, Spring, Rotary). `QUIET_SKIN` is the plate of everything else, in the theme's colours. `deviceSkin(device, skins?)` picks one, and gives none to a device that draws itself.
- `DeviceChainView` takes `skin`: a function from a device to its skin. Left out, every device is a panel as before.
- `Knob` takes `cap` (`arc` by default, `disc`, `dot`, `skirt`, `pointer`), drawn in `--lm-plate-ink` on `--lm-plate`.
- Finishes (`matte`, `grain`, `brushed`, `speckle`, `hammered`, `linen`, `fade`, `gloss`) are SVG noise or gradients drawn once; nothing is an image file and nothing runs per frame.
