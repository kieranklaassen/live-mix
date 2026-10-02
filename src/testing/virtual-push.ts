// A Push with no hardware: the device's side of the protocol, written from
// Ableton's "Push 2 MIDI and Display Interface Manual". It takes the bytes a
// host sends (LED messages, sysex, display frames over USB), keeps what a
// real device would then show, answers what a real device answers, and lets
// a test play it: hit a pad, turn an encoder, press a button. It stands in
// for `navigator.requestMIDIAccess()` and `navigator.usb`:
//
//   const push = new VirtualPush({ model: 3 })
//   const ports = findPushPorts(push.midiAccess())
//   const device = new PushDevice(ports)
//   await device.open({ colors: { root: { r: 255, g: 90, b: 0 } } })
//   device.on((event) => …)
//   push.hitPad(0, 0, 100)
//
// It also keeps a list of what a real device would not accept (`errors`): a
// sysex command the manual does not document, a frame of the wrong size, a
// display written before it was claimed. A test that ends with
// `expect(push.errors).toEqual([])` has stayed inside the documented protocol.
//
// It is a reading of the manual, not a recording of a device: it cannot show
// that the manual was read right. Push 3's additions (its product id, its
// extra buttons, MPE as a third pressure mode) come from open-source drivers.

import { type MidiMessageEventLike } from '../core/control/MidiInput'
import {
  PUSH_DISPLAY_FRAME_BYTES,
  PUSH_FRAME_HEADER,
  decodePushFrame,
  type UsbDeviceLike,
  type UsbLike,
} from '../core/control/push/display'
import {
  ABLETON_USB_VENDOR_ID,
  PUSH_COMMANDS,
  PUSH_ENCODERS,
  PUSH_FIRST_PAD_NOTE,
  PUSH_LAST_PAD_NOTE,
  PUSH_SYSEX_HEADER,
  PUSH_TOUCH_NOTES,
  PUSH_TOUCH_STRIP_LEDS,
  PUSH_USB_PRODUCT_IDS,
  isRgbPushButton,
  parsePushPaletteEntry,
  parsePushSysex,
  pushButtonAt,
  pushButtonController,
  pushEncoderValue,
  pushPadNote,
  type PushButton,
  type PushEncoder,
  type PushModel,
  type PushPaletteEntry,
  type PushRgb,
  type PushTouch,
} from '../core/control/push/protocol'

export type VirtualPushSystem = 'macos' | 'windows' | 'linux'

export interface VirtualPushOptions {
  /** 2 or 3; default 3. */
  model?: PushModel
  /** Whose port names the device shows up under; default macOS. */
  system?: VirtualPushSystem
  /** False makes the outputs throw on sysex, as Web MIDI does on a page without that permission. */
  sysex?: boolean
  /** True makes the display refuse to be claimed, as when Live is running. */
  displayBusy?: boolean
  serial?: number
}

/** What one LED shows. */
export interface VirtualPushLed {
  /** The colour index last set. */
  color: number
  /** What that index is in the palette: a colour for an RGB LED, a grey for a white one. */
  rgb: PushRgb
  /** 0 for a steady LED; else the channel of the animation running. */
  animation: number
  /** The colour index an animation moves to. */
  to: number | null
}

/** A MIDI input port as Web MIDI shows it. */
export interface VirtualPushInput {
  readonly id: string
  readonly name: string
  readonly manufacturer: string
  readonly type: 'input'
  state: 'connected' | 'disconnected'
  onmidimessage: ((event: MidiMessageEventLike) => void) | null
}

/** A MIDI output port as Web MIDI shows it. */
export interface VirtualPushOutput {
  readonly id: string
  readonly name: string
  readonly manufacturer: string
  readonly type: 'output'
  state: 'connected' | 'disconnected'
  send(data: number[] | Uint8Array, timestamp?: number): void
}

export interface VirtualMidiAccess {
  readonly inputs: Map<string, VirtualPushInput>
  readonly outputs: Map<string, VirtualPushOutput>
  readonly sysexEnabled: boolean
  onstatechange: ((event: { port: VirtualPushInput | VirtualPushOutput }) => void) | null
  addEventListener(type: 'statechange', listener: (event: unknown) => void): void
  removeEventListener(type: 'statechange', listener: (event: unknown) => void): void
}

type PortKind = 'live' | 'user'

const PORT_NAMES: Record<
  VirtualPushSystem,
  (model: PushModel, kind: PortKind) => [string, string]
> = {
  macos: (model, kind) => {
    const name = `Ableton Push ${model} ${kind === 'live' ? 'Live' : 'User'} Port`
    return [name, name]
  },
  windows: (model, kind) =>
    kind === 'live'
      ? [`Ableton Push ${model}`, `Ableton Push ${model}`]
      : [`MIDIIN2 (Ableton Push ${model})`, `MIDIOUT2 (Ableton Push ${model})`],
  linux: (model, kind) => {
    const name = `Ableton Push ${model} MIDI ${kind === 'live' ? 1 : 2}`
    return [name, name]
  },
}

const MODES = ['live', 'user', 'dual'] as const
const BLACK: PushRgb = { r: 0, g: 0, b: 0 }

/** A hue wheel for the palette entries the manual does not list: stand-in values, not the device's. */
function wheel(index: number): PushRgb {
  const hue = (index * 360) / 121
  const f = (n: number): number => {
    const k = (n + hue / 60) % 6
    return Math.round(255 * (1 - Math.max(0, Math.min(k, 4 - k, 1))))
  }
  return { r: f(5), g: f(3), b: f(1) }
}

function defaultPalette(): PushPaletteEntry[] {
  const palette: PushPaletteEntry[] = []
  for (let index = 0; index < 128; index += 1) {
    // The white palette's documented points are 0, 32 at 16, 84 at 48 and 128 at 127.
    const white =
      index <= 16
        ? index * 2
        : index <= 48
          ? Math.round(32 + ((index - 16) * 52) / 32)
          : Math.round(84 + ((index - 48) * 44) / 79)
    palette.push({ index, ...(index === 0 ? BLACK : wheel(index)), white })
  }
  const documented: [number, number, number, number][] = [
    [122, 204, 204, 204],
    [123, 64, 64, 64],
    [124, 20, 20, 20],
    [125, 0, 0, 255],
    [126, 0, 255, 0],
    [127, 255, 0, 0],
  ]
  for (const [index, r, g, b] of documented) palette[index] = { ...palette[index], r, g, b }
  return palette
}

/** The seven brightness steps of the touch strip's own palette. */
const STRIP_LEVELS = [0, 2, 4, 8, 16, 32, 64, 127] as const

/** A refusal as Web MIDI gives it: the name the spec names, which is what callers read. */
function midiError(name: string, message: string): Error {
  const error = new Error(`${name}: ${message}`)
  error.name = name
  return error
}

export class VirtualPush {
  readonly model: PushModel
  /** What a real device would have refused or ignored; empty while the host keeps to the manual. */
  readonly errors: string[] = []
  /** Every message the host sent, in order, as arrays of bytes. */
  readonly received: number[][] = []
  private readonly sysexAllowed: boolean
  private readonly serial: number
  private readonly inputPorts: Record<PortKind, VirtualPushInput>
  private readonly outputPorts: Record<PortKind, VirtualPushOutput>
  private readonly stateListeners = new Set<(event: unknown) => void>()
  private readonly access: VirtualMidiAccess
  private readonly ledColors = new Map<
    string,
    { color: number; animation: number; to: number | null }
  >()
  private palette = defaultPalette()
  /** Entries set but not yet applied to the LEDs ("Reapply Color Palette"). */
  private applied = defaultPalette()
  private mode: (typeof MODES)[number] = 'live'
  private aftertouch = 0
  private stripFlags = 0x68
  private stripLedLevels = new Array<number>(PUSH_TOUCH_STRIP_LEDS).fill(0)
  private stripPosition = 0.5
  private ledBrightnessValue = 127
  private displayBrightnessValue = 255
  private clockStarted = false
  private readonly heldPads = new Map<number, number>()
  private nextMpeChannel = 1
  // USB
  private readonly displayBusy: boolean
  private usbOpened = false
  private usbClaimed = false
  private usbGranted = false
  private frameBuffer: Uint8Array | null = null
  private frameFill = 0
  private lastFrame: Uint8Array | null = null
  private frameCount = 0
  private plugged = true
  readonly usbDevice: UsbDeviceLike

  constructor(options: VirtualPushOptions = {}) {
    const model = options.model ?? 3
    const system = options.system ?? 'macos'
    this.model = model
    this.sysexAllowed = options.sysex ?? true
    this.displayBusy = options.displayBusy ?? false
    this.serial = options.serial ?? 17295091
    const port = (kind: PortKind): [VirtualPushInput, VirtualPushOutput] => {
      const [inputName, outputName] = PORT_NAMES[system](model, kind)
      const input: VirtualPushInput = {
        id: `virtual-push-${model}-${kind}-in`,
        name: inputName,
        manufacturer: 'Ableton AG',
        type: 'input',
        state: 'connected',
        onmidimessage: null,
      }
      const output: VirtualPushOutput = {
        id: `virtual-push-${model}-${kind}-out`,
        name: outputName,
        manufacturer: 'Ableton AG',
        type: 'output',
        state: 'connected',
        send: (data) => this.fromHost(kind, data),
      }
      return [input, output]
    }
    const [liveIn, liveOut] = port('live')
    const [userIn, userOut] = port('user')
    this.inputPorts = { live: liveIn, user: userIn }
    this.outputPorts = { live: liveOut, user: userOut }
    this.access = {
      inputs: new Map([liveIn, userIn].map((entry) => [entry.id, entry])),
      outputs: new Map([liveOut, userOut].map((entry) => [entry.id, entry])),
      sysexEnabled: this.sysexAllowed,
      onstatechange: null,
      addEventListener: (_type, listener) => void this.stateListeners.add(listener),
      removeEventListener: (_type, listener) => void this.stateListeners.delete(listener),
    }
    this.usbDevice = this.createUsbDevice()
  }

  // What a page sees ----------------------------------------------------------------

  /** What `navigator.requestMIDIAccess()` resolves to with this Push plugged in. */
  midiAccess(): VirtualMidiAccess {
    return this.access
  }

  /** What `navigator.usb` is with this Push plugged in; `requestDevice` picks it as a person would. */
  usb(): UsbLike {
    return {
      requestDevice: ({ filters }) => {
        const match = filters.some(
          (filter) =>
            filter.vendorId === this.usbDevice.vendorId &&
            filter.productId === this.usbDevice.productId,
        )
        if (!match) return Promise.reject(new Error('No device selected.'))
        this.usbGranted = true
        return Promise.resolve(this.usbDevice)
      },
      getDevices: () => Promise.resolve(this.usbGranted && this.plugged ? [this.usbDevice] : []),
    }
  }

  /** Pulls the cable: the ports report it and the display stops taking frames. */
  unplug(): void {
    for (const entry of [...this.access.inputs.values(), ...this.access.outputs.values()]) {
      entry.state = 'disconnected'
      this.access.onstatechange?.({ port: entry })
      for (const listener of this.stateListeners) listener({ port: entry })
    }
    this.plugged = false
    this.usbOpened = false
    this.usbClaimed = false
  }

  /** Puts the cable back: the same ports are there again, and the device is as it powers up. */
  plug(): void {
    this.plugged = true
    this.mode = 'live'
    this.aftertouch = 0
    this.stripFlags = 0x68
    this.ledColors.clear()
    this.palette = defaultPalette()
    this.applied = defaultPalette()
    this.heldPads.clear()
    this.stripLedLevels = new Array<number>(PUSH_TOUCH_STRIP_LEDS).fill(0)
    this.stripPosition = 0.5
    this.ledBrightnessValue = 127
    this.displayBrightnessValue = 255
    this.clockStarted = false
    // A frame half sent when the cable went is not pixels of the next one.
    this.frameBuffer = null
    this.frameFill = 0
    this.lastFrame = null
    for (const entry of [...this.access.inputs.values(), ...this.access.outputs.values()]) {
      entry.state = 'connected'
      this.access.onstatechange?.({ port: entry })
      for (const listener of this.stateListeners) listener({ port: entry })
    }
  }

  // What the device shows -----------------------------------------------------------

  /** The LED of a pad. Row 0 is the bottom row, column 0 the left one. */
  pad(row: number, column: number): VirtualPushLed {
    return this.ledAt(`n${pushPadNote(row, column)}`, true)
  }

  /** The LED of a button; a white LED's colour is a grey of its brightness. */
  button(button: PushButton): VirtualPushLed {
    const controller = pushButtonController(this.model, button)
    if (controller === null) throw new Error(`Push ${this.model} has no ${button} button`)
    return this.ledAt(`c${controller}`, isRgbPushButton(button))
  }

  /** The 64 pads as `#rrggbb`, top row first: the way one looks at the device. */
  padColors(): string[][] {
    const rows: string[][] = []
    for (let row = 7; row >= 0; row -= 1) {
      const line: string[] = []
      for (let column = 0; column < 8; column += 1) {
        const { r, g, b } = this.pad(row, column).rgb
        line.push(`#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`)
      }
      rows.push(line)
    }
    return rows
  }

  /** The palette as the LEDs use it now. */
  paletteEntry(index: number): PushPaletteEntry {
    return this.applied[index]
  }

  /** The touch strip's 31 LEDs, bottom first, 0 to 127. */
  stripLeds(): number[] {
    const hostLeds = (this.stripFlags & 1) !== 0
    const bySysex = (this.stripFlags & 2) !== 0
    if (hostLeds && bySysex) return this.stripLedLevels.map((level) => STRIP_LEVELS[level])
    const leds = new Array<number>(PUSH_TOUCH_STRIP_LEDS).fill(0)
    const at = Math.round(this.stripPosition * (PUSH_TOUCH_STRIP_LEDS - 1))
    if ((this.stripFlags & 8) !== 0) {
      leds[at] = 127
      return leds
    }
    const from = (this.stripFlags & 16) !== 0 ? (PUSH_TOUCH_STRIP_LEDS - 1) / 2 : 0
    for (let i = Math.min(from, at); i <= Math.max(from, at); i += 1) leds[i] = 127
    return leds
  }

  get midiMode(): 'live' | 'user' | 'dual' {
    return this.mode
  }

  get aftertouchMode(): 'channel' | 'poly' | 'mpe' {
    return (['channel', 'poly', 'mpe'] as const)[this.aftertouch]
  }

  get touchStripFlags(): number {
    return this.stripFlags
  }

  get ledBrightness(): number {
    return this.ledBrightnessValue
  }

  get displayBrightness(): number {
    return this.displayBrightnessValue
  }

  /** True once the host has sent a MIDI start, which LED animations wait for. */
  get animating(): boolean {
    return this.clockStarted
  }

  /** How many whole frames the display has been sent. */
  get frames(): number {
    return this.frameCount
  }

  /** The display as RGBA pixels, 960 × 160, or null before the first frame. */
  screen(): Uint8ClampedArray | null {
    return this.lastFrame ? decodePushFrame(this.lastFrame) : null
  }

  /** The colour of one pixel of the display, or null before the first frame. */
  pixel(x: number, y: number): PushRgb | null {
    const screen = this.screen()
    if (!screen) return null
    const at = (y * 960 + x) * 4
    return { r: screen[at], g: screen[at + 1], b: screen[at + 2] }
  }

  // The person's hands --------------------------------------------------------------

  /** Hits a pad. Velocity 1 to 127. */
  hitPad(row: number, column: number, velocity = 100): void {
    const note = pushPadNote(row, column)
    let channel = 0
    if (this.aftertouch === 2) {
      channel = this.nextMpeChannel
      this.nextMpeChannel = (this.nextMpeChannel % 15) + 1
    }
    this.heldPads.set(note, channel)
    this.toHost([0x90 | channel, note, Math.max(1, Math.min(127, velocity))])
  }

  /** Presses into a held pad, 0 to 1. */
  pressPad(row: number, column: number, pressure: number): void {
    const note = pushPadNote(row, column)
    const channel = this.heldPads.get(note)
    if (channel === undefined) return
    const value = Math.max(0, Math.min(127, Math.round(pressure * 127)))
    if (this.aftertouch === 1) this.toHost([0xa0, note, Math.max(1, value)])
    else this.toHost([0xd0 | channel, value])
  }

  releasePad(row: number, column: number): void {
    const note = pushPadNote(row, column)
    const channel = this.heldPads.get(note)
    if (channel === undefined) return
    this.heldPads.delete(note)
    this.toHost([0x80 | channel, note, 0])
  }

  /** Hits and lets go. */
  tapPad(row: number, column: number, velocity = 100): void {
    this.hitPad(row, column, velocity)
    this.releasePad(row, column)
  }

  press(button: PushButton): void {
    this.toHost([0xb0, this.controllerOf(button), 127], button === 'user')
  }

  release(button: PushButton): void {
    this.toHost([0xb0, this.controllerOf(button), 0], button === 'user')
  }

  /** Presses and lets go. */
  tap(button: PushButton): void {
    this.press(button)
    this.release(button)
  }

  /** Turns an encoder by a number of steps (about 210 to a turn); negative is to the left. */
  turn(encoder: PushEncoder, steps: number): void {
    let left = Math.round(steps)
    while (left !== 0) {
      // One message carries at most 63 steps one way and 64 the other.
      const part = Math.max(-64, Math.min(63, left))
      this.toHost([0xb0, PUSH_ENCODERS[encoder], pushEncoderValue(part)])
      left -= part
    }
  }

  /** Rests a finger on an encoder or the strip, or lifts it. */
  touch(control: PushTouch, touched: boolean): void {
    this.toHost([0x90, PUSH_TOUCH_NOTES[control], touched ? 127 : 0])
  }

  /** Puts a finger on the touch strip at a position, 0 (bottom) to 1 (top). */
  slide(position: number): void {
    const value = Math.max(0, Math.min(1, position))
    if ((this.stripFlags & 1) === 0) this.stripPosition = value
    if ((this.stripFlags & 4) !== 0) {
      this.toHost([0xb0, 1, Math.round(value * 127)])
    } else {
      // Eight bits of pitch bend: the low six are always zero.
      const bend = Math.round(value * 255) << 6
      this.toHost([0xe0, bend & 0x7f, (bend >> 7) & 0x7f])
    }
  }

  /** Lifts the finger off the strip: it springs back first when set to. */
  liftStrip(): void {
    if ((this.stripFlags & 32) !== 0) this.slide((this.stripFlags & 64) !== 0 ? 0.5 : 0)
    this.touch('strip', false)
  }

  // From the host -------------------------------------------------------------------

  private fromHost(kind: PortKind, data: number[] | Uint8Array): void {
    const bytes = Array.from(data)
    if (this.outputPorts[kind].state !== 'connected') {
      throw midiError('InvalidStateError', 'the port is not connected')
    }
    if (bytes[0] === 0xf0 && !this.sysexAllowed) {
      throw midiError('InvalidAccessError', 'sysex was not allowed for this page')
    }
    this.received.push(bytes)
    if (bytes[0] === 0xf0) {
      this.sysex(kind, bytes)
      return
    }
    if (bytes[0] >= 0xf8) {
      // Real-time messages count on the active port only.
      if (bytes[0] === 0xfa && this.listensTo(kind)) this.clockStarted = true
      return
    }
    if (!this.listensTo(kind)) return
    const command = bytes[0] & 0xf0
    const channel = bytes[0] & 0x0f
    if (command === 0x90) {
      if (bytes[1] >= PUSH_FIRST_PAD_NOTE && bytes[1] <= PUSH_LAST_PAD_NOTE) {
        this.setLed(`n${bytes[1]}`, channel, bytes[2])
      }
      return
    }
    if (command === 0xb0) {
      if (bytes[1] === 1 && (this.stripFlags & 7) === 5) {
        this.stripPosition = bytes[2] / 127
        return
      }
      if (pushButtonAt(this.model, bytes[1]) !== null)
        this.setLed(`c${bytes[1]}`, channel, bytes[2])
      return
    }
    if (command === 0xe0 && (this.stripFlags & 7) === 1) {
      this.stripPosition = Math.min(1, ((bytes[2] << 7) | bytes[1]) / 16320)
    }
  }

  private listensTo(kind: PortKind): boolean {
    return this.mode === 'dual' || this.mode === kind
  }

  private setLed(key: string, channel: number, color: number): void {
    if (channel === 0) {
      this.ledColors.set(key, { color, animation: 0, to: null })
      return
    }
    const current = this.ledColors.get(key) ?? { color: 0, animation: 0, to: null }
    this.ledColors.set(key, { color: current.color, animation: channel, to: color })
  }

  private ledAt(key: string, rgb: boolean): VirtualPushLed {
    const led = this.ledColors.get(key) ?? { color: 0, animation: 0, to: null }
    const entry = this.applied[led.color]
    const level = Math.min(255, entry.white * 2)
    return {
      ...led,
      rgb: rgb ? { r: entry.r, g: entry.g, b: entry.b } : { r: level, g: level, b: level },
    }
  }

  private sysex(kind: PortKind, bytes: number[]): void {
    if (bytes[bytes.length - 1] !== 0xf7) {
      this.errors.push('a sysex message without its end byte')
      return
    }
    // The identity request is the MIDI standard's own message.
    if (bytes[1] === 0x7e && bytes[3] === 0x06 && bytes[4] === 0x01) {
      const product = PUSH_USB_PRODUCT_IDS[this.model]
      const serial = [0, 7, 14, 21, 28].map((shift) => Math.floor(this.serial / 2 ** shift) & 0x7f)
      this.reply(kind, [
        0xf0,
        0x7e,
        0x01,
        0x06,
        0x02,
        0x00,
        0x21,
        0x1d,
        product & 0x7f,
        (product >> 7) & 0x7f,
        this.model,
        0x00,
        1,
        0,
        0x2f,
        0x00,
        ...serial,
        1,
        0xf7,
      ])
      return
    }
    const parsed = parsePushSysex(bytes)
    if (!parsed) {
      this.errors.push(`a sysex message that is not for Push: ${hex(bytes)}`)
      return
    }
    const { command, args } = parsed
    const answer = (values: number[], both = false): void =>
      this.reply(kind, [...PUSH_SYSEX_HEADER, command, ...values, 0xf7], both)
    const need = (count: number): boolean => {
      if (args.length === count) return true
      this.errors.push(
        `command 0x${command.toString(16)} takes ${count} arguments, got ${args.length}`,
      )
      return false
    }
    switch (command) {
      case PUSH_COMMANDS.setPaletteEntry: {
        if (!need(9)) return
        const entry = parsePushPaletteEntry(args)
        if (entry) this.palette[entry.index] = entry
        return
      }
      case PUSH_COMMANDS.getPaletteEntry: {
        if (!need(1)) return
        const entry = this.palette[args[0]]
        const split = (value: number): number[] => [value & 0x7f, value >> 7]
        answer([
          args[0],
          ...split(entry.r),
          ...split(entry.g),
          ...split(entry.b),
          ...split(entry.white),
        ])
        return
      }
      case PUSH_COMMANDS.reapplyPalette:
        if (need(0)) this.applied = this.palette.map((entry) => ({ ...entry }))
        return
      case PUSH_COMMANDS.setLedBrightness:
        if (need(1)) this.ledBrightnessValue = args[0]
        return
      case PUSH_COMMANDS.getLedBrightness:
        if (need(0)) answer([this.ledBrightnessValue])
        return
      case PUSH_COMMANDS.setDisplayBrightness:
        if (need(2)) this.displayBrightnessValue = args[0] | (args[1] << 7)
        return
      case PUSH_COMMANDS.getDisplayBrightness:
        if (need(0)) answer([this.displayBrightnessValue & 0x7f, this.displayBrightnessValue >> 7])
        return
      case PUSH_COMMANDS.setMidiMode:
        if (!need(1)) return
        if (args[0] > 2) {
          this.errors.push(`MIDI mode ${args[0]} does not exist`)
          return
        }
        this.mode = MODES[args[0]]
        // This one reply always goes out on both ports.
        answer([args[0]], true)
        return
      case PUSH_COMMANDS.setTouchStripConfiguration:
        if (need(1)) this.stripFlags = args[0]
        return
      case PUSH_COMMANDS.getTouchStripConfiguration:
        if (need(0)) answer([this.stripFlags])
        return
      case PUSH_COMMANDS.setTouchStripLeds: {
        if (!need(16)) return
        if ((this.stripFlags & 3) !== 3) return // Ignored unless the host sends the LEDs by sysex.
        for (let i = 0; i < PUSH_TOUCH_STRIP_LEDS; i += 1) {
          this.stripLedLevels[i] = (args[i >> 1] >> ((i & 1) * 3)) & 7
        }
        return
      }
      case PUSH_COMMANDS.requestStatistics:
        if (need(1)) answer([1, args[0], 0x3f, 0x07, 0, 0, 0])
        return
      case PUSH_COMMANDS.setAftertouchMode:
        if (!need(1)) return
        if (args[0] > (this.model === 3 ? 2 : 1)) {
          this.errors.push(`Push ${this.model} has no aftertouch mode ${args[0]}`)
          return
        }
        this.aftertouch = args[0]
        return
      case PUSH_COMMANDS.getAftertouchMode:
        if (need(0)) answer([this.aftertouch])
        return
      default:
        this.errors.push(`reserved sysex command 0x${command.toString(16)}`)
    }
  }

  private reply(kind: PortKind, bytes: number[], both = false): void {
    for (const port of both ? (['live', 'user'] as const) : [kind]) this.deliver(port, bytes)
  }

  private toHost(bytes: number[], both = false): void {
    const ports: PortKind[] = both || this.mode === 'dual' ? ['live', 'user'] : [this.mode]
    for (const port of ports) this.deliver(port, bytes)
  }

  private deliver(kind: PortKind, bytes: number[]): void {
    const port = this.inputPorts[kind]
    if (port.state !== 'connected') return
    port.onmidimessage?.({ data: new Uint8Array(bytes), timeStamp: 0 })
  }

  private controllerOf(button: PushButton): number {
    const controller = pushButtonController(this.model, button)
    if (controller === null) throw new Error(`Push ${this.model} has no ${button} button`)
    return controller
  }

  // USB -----------------------------------------------------------------------------

  private createUsbDevice(): UsbDeviceLike {
    const describe = {
      interfaces: [
        {
          interfaceNumber: 0,
          alternate: {
            interfaceClass: 0xff,
            endpoints: [{ endpointNumber: 1, direction: 'out' as const, type: 'bulk' as const }],
          },
        },
        { interfaceNumber: 1, alternate: { interfaceClass: 0x01, endpoints: [] } },
      ],
    }
    let configured = false
    const usb = {
      vendorId: ABLETON_USB_VENDOR_ID,
      productId: PUSH_USB_PRODUCT_IDS[this.model],
      productName: `Ableton Push ${this.model}`,
      serialNumber: String(this.serial),
      open: (): Promise<void> => {
        if (!this.plugged) return Promise.reject(new Error('NotFoundError: No device selected.'))
        this.usbOpened = true
        return Promise.resolve()
      },
      close: (): Promise<void> => {
        this.usbOpened = false
        this.usbClaimed = false
        return Promise.resolve()
      },
      selectConfiguration: (value: number): Promise<void> => {
        if (value !== 1) return Promise.reject(new Error('NotFoundError: no such configuration'))
        configured = true
        return Promise.resolve()
      },
      claimInterface: (interfaceNumber: number): Promise<void> => {
        if (!this.usbOpened) {
          return Promise.reject(new Error('InvalidStateError: the device is not open'))
        }
        if (interfaceNumber !== 0) {
          return Promise.reject(new Error("SecurityError: that interface is the system's"))
        }
        if (this.displayBusy) {
          return Promise.reject(new Error('NetworkError: Unable to claim interface.'))
        }
        this.usbClaimed = true
        return Promise.resolve()
      },
      releaseInterface: (): Promise<void> => {
        this.usbClaimed = false
        return Promise.resolve()
      },
      transferOut: (endpoint: number, data: Uint8Array): Promise<{ status: string }> => {
        if (!this.plugged) {
          return Promise.reject(new Error('NetworkError: The device was disconnected.'))
        }
        if (!this.usbClaimed) {
          this.errors.push('the display was written before its interface was claimed')
          return Promise.reject(new Error('InvalidStateError: the interface is not claimed'))
        }
        if (endpoint !== 1) {
          this.errors.push(`the display is endpoint 1, not ${endpoint}`)
          return Promise.reject(new Error('NotFoundError: no such endpoint'))
        }
        this.displayBytes(data)
        return Promise.resolve({ status: 'ok' })
      },
    }
    return Object.defineProperties(usb, {
      opened: { get: () => this.usbOpened, enumerable: true },
      configuration: { get: () => (configured ? describe : null), enumerable: true },
    }) as typeof usb & Pick<UsbDeviceLike, 'opened' | 'configuration'>
  }

  private displayBytes(data: Uint8Array): void {
    if (this.frameBuffer === null) {
      const header =
        data.length === PUSH_FRAME_HEADER.length &&
        PUSH_FRAME_HEADER.every((value, i) => data[i] === value)
      if (!header) {
        this.errors.push(`${data.length} bytes of display data without a frame header before them`)
        return
      }
      this.frameBuffer = new Uint8Array(PUSH_DISPLAY_FRAME_BYTES)
      this.frameFill = 0
      return
    }
    if (this.frameFill + data.length > PUSH_DISPLAY_FRAME_BYTES) {
      this.errors.push('more pixel data than one frame holds')
      this.frameBuffer = null
      return
    }
    this.frameBuffer.set(data, this.frameFill)
    this.frameFill += data.length
    if (this.frameFill === PUSH_DISPLAY_FRAME_BYTES) {
      this.lastFrame = this.frameBuffer
      this.frameBuffer = null
      this.frameCount += 1
    }
  }
}

function hex(bytes: readonly number[]): string {
  return bytes.map((value) => value.toString(16).padStart(2, '0')).join(' ')
}
