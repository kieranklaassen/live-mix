# Ableton Push 2 and Push 3

live-mix can drive an Ableton Push as Live does: read its pads, buttons,
encoders and touch strip, light its LEDs in your colours, and draw on its
display. This is the device layer. What a pad or an encoder _does_ is the
app's business (ambient-live's Push script is the worked example).

|               | Module                             | Runs over |
| ------------- | ---------------------------------- | --------- |
| `PushDevice`  | `src/core/control/push`            | Web MIDI  |
| `PushDisplay` | `src/core/control/push`            | WebUSB    |
| pad layouts   | `pushPadPitches`, `pushPadPitch`   | pure      |
| `VirtualPush` | `@kieranklaassen/live-mix/testing` | nothing   |

## Is the protocol open?

For **Push 2**, yes. Ableton publishes the
[Push 2 MIDI and Display Interface Manual](https://github.com/Ableton/push-interface)
(revision 1.1): the MIDI mapping, the LED palette and animations, the sysex
commands, the touch strip and the display's USB pixel format. Everything in
`protocol.ts` and `display.ts` that is not marked otherwise comes from it.
The manual is Ableton's and is not copied here; read it there.

For **Push 3** there is no such document. Push 3 keeps Push 2's protocol
(the same sysex header, the same pad notes and encoder controllers, the same
display format) and adds to it. What it adds is taken from open-source
drivers that work with the hardware, and is marked "Push 3" in the code:

- USB product id `0x1969` (Push 2 is `0x1967`; the vendor is `0x2982`).
- More buttons (`PUSH_3_BUTTONS`): the jog wheel's press and left and right
  clicks, the D-pad's centre, Save, Sets, Capture, Hot Swap, Add, Lock,
  Learn, the display button, and the small encoder's press.
- The jog wheel as a relative encoder (`jog`, controller 70).
- `New` moved to controller 92, and controller 111 is the volume encoder's
  mode button, not `Browse`.
- MPE as a third pressure mode (`aftertouch: 'mpe'`).

**Nothing in this module has run against a physical Push.** It is tested
against the examples the manual prints and against `VirtualPush`, which is
written from the same reading of the manual. A mistake in that reading would
pass both.

## What the browser needs

- **Web MIDI with sysex** for `PushDevice`: Chromium browsers and Firefox,
  on `https` or `localhost`, after the person allows it. Without sysex the
  driver still works with the seven default colours the manual documents.
- **WebUSB** for `PushDisplay`: Chromium browsers only, on `https` or
  `localhost`, from a click. Safari has neither.
- On Windows, WebUSB reaches a device only through the WinUSB driver.
  Whether Push's display interface gets that driver on its own has not been
  checked here.
- One program at a time can hold the display. With Live running and Push
  enabled there, `PushDisplay.open()` rejects ("Unable to claim interface").
  A standalone Push 3 has to be in control mode, connected over USB.
- Electron needs the `usb` permission and a `select-usb-device` handler.

## Quick start

```ts
import { PushDevice, PushDisplay, findPushPorts, pushPadPitches } from '@kieranklaassen/live-mix'

const access = await navigator.requestMIDIAccess({ sysex: true })
const ports = findPushPorts(access)
if (!ports) throw new Error('No Push connected')

const push = new PushDevice(ports)
await push.open({
  colors: { root: { r: 255, g: 90, b: 0 }, scale: { r: 230, g: 230, b: 230 } },
})

// C major on the pads, in key, from C3.
const pads = pushPadPitches({ layout: 'in-key', root: 0, steps: [0, 2, 4, 5, 7, 9, 11], octave: 3 })
pads.forEach((pad, i) => {
  if (pad) push.setPad(Math.floor(i / 8), i % 8, pad.role === 'root' ? 'root' : 'scale')
})

push.on((event) => {
  if (event.type === 'pad' && event.on) {
    const pad = pads[event.row * 8 + event.column]
    if (pad) play(pad.note, event.velocity)
  }
  if (event.type === 'encoder' && event.encoder === 'track1') nudge(event.steps)
})

// The display, from a click.
const display = await PushDisplay.request()
await display.open()
display.show(context.getImageData(0, 0, 960, 160).data)

// Later: the device gets its palette and settings back.
await push.close()
await display.close()
```

## `PushDevice`

`findPushPorts(access)` picks the Push among the MIDI ports: the newer model
first, and the Live port before the User port. `parsePushPortName` reads the
names macOS, Windows and Linux give the two ports.

`open(options)` asks the device who it is (`identity`), sets its MIDI mode
to the port in use, sets the pressure mode (`aftertouch`, default `poly`),
configures the touch strip, puts `colors` in the palette, starts the clock
the LED animations run on, and darkens every LED. `close()` undoes all of it.

Events (`on(listener)`):

| Event          | Fields                               |                                                |
| -------------- | ------------------------------------ | ---------------------------------------------- |
| `pad`          | `row`, `column`, `on`, `velocity`    | Row 0 is the bottom row, column 0 the left one |
| `pad-pressure` | `row`, `column`, `pressure` (0 to 1) | With `aftertouch: 'poly'`                      |
| `pressure`     | `pressure`                           | With `aftertouch: 'channel'`                   |
| `button`       | `button`, `down`                     | Names in `PUSH_BUTTONS` and `PUSH_3_BUTTONS`   |
| `encoder`      | `encoder`, `steps`                   | Relative; about 210 steps to a turn            |
| `touch`        | `control`, `touched`                 | A finger on an encoder or the strip            |
| `strip`        | `value` (0 to 1)                     | Bottom to top                                  |
| `pedal`        | `pedal` (1 or 2), `value`            |                                                |

LEDs:

- `setPad(row, column, led)` and `setButton(button, led)`. `led` is a colour
  name from `colors`, a palette index, or `{ color, to, animation }` to
  pulse or blink between two colours (`pulseQuarter`, `blink8th`, …).
- Colour buttons (Play, Record, the two rows by the display, the scene
  buttons and a few more: `isRgbPushButton`) take colours; the others have a
  white LED and show how bright the colour is.
- `clear()` darkens everything. An LED is only sent when it changes, so a
  render function can set all 64 pads every time.
- The app's colours take palette entries 64 to 121 (`PUSH_PALETTE_SIZE`,
  58 of them); the documented defaults at 0 and 122 to 127
  (`PUSH_DEFAULT_COLORS`) are left alone.

Touch strip: `setTouchStrip(configuration)` chooses pitch bend or mod wheel,
whether the device or the host lights the LEDs, bar or point, and autoreturn.
With `{ hostLeds: true }`, `setTouchStripValue(0..1)` draws a bar from the
bottom; with `ledsBySysex` too, `setTouchStripLeds(levels)` sets all 31.

## `PushDisplay`

The display is 960 × 160. A frame is 160 lines of 16-bit pixels sent over a
USB bulk endpoint, about 328 kB. `show(rgba)` takes the pixels a canvas
gives (`getImageData(0, 0, 960, 160).data`), converts them and sends them.
While one frame is on its way, the next waits and a newer one replaces it,
so calling `show` on every animation frame is fine. The device blanks its
display after two seconds without a frame; the last one is repeated once a
second. `PushDisplay.granted()` finds a device the person allowed before,
without asking again.

## Pad layouts

`pushPadPitch(options, row, column)` and `pushPadPitches(options)` give the
MIDI note and the role (`root`, `scale`, `outside`) of each pad for Push's
two layouts: `in-key` (only the scale's notes; rows three scale steps apart,
a fourth in a seven-note scale) and `chromatic` (every semitone; rows five
semitones apart). `rows` fills only the bottom rows, for a split layout.

## Testing without a Push

`VirtualPush` is the device's side of the protocol. It stands in for the
browser's MIDI access and `navigator.usb`, plays the hands, and shows what a
device would show:

```ts
import { VirtualPush } from '@kieranklaassen/live-mix/testing'

const push = new VirtualPush({ model: 3 })
const device = new PushDevice(findPushPorts(push.midiAccess())!)
await device.open({ colors })

push.hitPad(0, 0, 100) // → { type: 'pad', row: 0, column: 0, on: true, velocity: 100 }
push.turn('track1', 4)
push.tap('play')

push.pad(0, 0).rgb // the colour the pad shows
push.padColors() // all 64 as '#rrggbb', top row first
push.pixel(10, 10) // a pixel of the display
expect(push.errors).toEqual([]) // nothing outside the documented protocol was sent
```

`errors` lists what a device would not accept: a sysex command the manual
does not document, a wrong argument count, display data without its frame
header, a write before the interface was claimed. The palette entries the
manual does not list are stand-in values, not the device's.

## Limits

- The sysex commands the manual marks reserved (pad calibration and
  sensitivity, pedal configuration) are not sent; `pushSysex` throws for them.
- MPE on Push 3 is switched on by `aftertouch: 'mpe'`, and pads are read on
  every channel, but per-pad slide and bend are not turned into events yet.
- Push 1 is a different device (a text display over sysex) and is not matched.
- The device's statistics command (power source, uptime) is not exposed.
