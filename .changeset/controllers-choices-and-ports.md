---
'@kieranklaassen/live-mix': patch
---

The control layer: a controller on a list of choices, a target that changes hands, and ports and sockets that come and go.

- `ControlSurface`, `resolveBinding`: a controller mapped to a parameter that is a list of choices (`ParamSpec.choices`) wrote the place between two of them (`type: 1.488`) into the device and, through `arbitratedControlWriter`, into the score. It writes the whole choice the devices already round to. A relative encoder and soft takeover on such a parameter go by where the controller stands, which the new optional `ControlBinding.hold` keeps.
- `resolveBinding`: a device parameter named as every object answers (`constructor`, `toString`) was taken for one the device has and wrote `NaN`; through the arbiter the write threw. Only the device's own parameters bind.
- `ControlSurface.setTable`, `map`, `unmap`: a target mapped to another source kept the last controller's edge and pickup memory, so the first press of the new button did nothing, and a fader with pickup could jump. A target that changes source, or loses its mapping, starts afresh; one mapped again to the same source keeps what it had.
- `toggledValue`, `nudgedValue`: a stored `output` span that runs outside 0..1 let a toggle or a relative step answer a value outside it (7 for a span of -5..7), and such a toggle never came back down. Both keep to the part of the span inside 0..1, as `shapeValue` does.
- `matchOscAddress`: a negated character class, or a range that spans it, took a `/` and so matched across two parts of an address (`/a[!b]c` matched `/a/c`). A class never takes a `/`.
- `fromMidiAccess`: a port pulled out and plugged in again, which some browsers hand out as a new object under the same id, was answered with the wrapper of the old one, and `MidiInput` heard nothing from it. A wrapper is kept for the port object, not its id.
- `webSocketTransport`: `ready`, and so `OscInput.open()`, never settled when the input was closed while the socket was still connecting. It resolves when closed.
- `PushDisplay.open`: opened twice at once it started two keep-alive timers and `close` stopped one, so frames went on to a closed display. The second open finds the first done. `framesSent` starts at 0 with every open.
- `PushDevice`: closed while `open()` or `setColors()` was still asking the device, it was closed and the app's colours were written over the palette it had just been given back, with their names still answering an index. An open or a `setColors` overtaken by `close` stops there.
