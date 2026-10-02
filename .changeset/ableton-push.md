---
'@kieranklaassen/live-mix': patch
---

Ableton Push 2 and Push 3 as a control surface with feedback: pads, buttons, encoders, touch strip, LEDs and the display.

- `PushDevice` (over a MIDI input and output, found with `findPushPorts`): what the device sends arrives as `PushEvent`s (`pad`, `pad-pressure`, `button`, `encoder`, `touch`, `strip`, `pedal`), and its LEDs are set by name with `setPad` and `setButton`, with colour animations. It puts the app's colours into the device's palette (`open({ colors })`, `setColors`), sends an LED only when it changes, configures the touch strip and the pressure mode (channel, poly, and MPE on Push 3), and on `close` gives the device back its palette and settings. Without the sysex permission it falls back to the default colours Ableton documents.
- `PushDisplay` (over WebUSB): `PushDisplay.request()` asks for the device, `show(rgba)` sends a 960 × 160 picture. It keeps the newest frame when frames come faster than they go out and repeats the last one so the display stays lit. `encodePushFrame` and `decodePushFrame` are the pixel format on their own.
- `pushPadPitches` / `pushPadPitch`: Push's two note layouts (in key and chromatic, rows a fourth apart) for any scale, with each pad's role (`root`, `scale`, `outside`).
- The protocol as constants and pure functions: `PUSH_BUTTONS`, `PUSH_3_BUTTONS`, `PUSH_ENCODERS`, `PUSH_DEFAULT_COLORS`, `pushSysex`, `pushSetPaletteEntry`, `parsePushIdentity` and the rest, from Ableton's published Push 2 interface manual. Push 3 has no published manual; what it adds (product id, extra buttons, the jog wheel, MPE) is taken from open-source drivers and marked so in the code.
- `VirtualPush` in `./testing`: the device's side of the protocol with no hardware. It stands in for `navigator.requestMIDIAccess()` and `navigator.usb`, shows what a device would show (pad colours, the screen's pixels) and lists anything sent that is outside the documented protocol.

Nothing here has run against a physical Push; see `docs/push.md`.
