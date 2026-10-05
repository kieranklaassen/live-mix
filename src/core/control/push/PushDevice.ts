// One Push, over its MIDI port: what it sends becomes events (a pad was hit,
// an encoder turned), and its LEDs are set by name. The driver keeps what
// each LED shows and sends only what changes, puts the app's colours into
// the device's palette, and on `close` puts the device back as it found it.
// It takes a MIDI input and output as plain objects, so it runs against Web
// MIDI, a test double or anything else that passes bytes.

import { Emitter } from '../../events'
import { type MidiMessageEventLike } from '../MidiInput'
import {
  PUSH_AFTERTOUCH_MODES,
  PUSH_COMMANDS,
  PUSH_DEFAULT_COLORS,
  PUSH_IDENTITY_REQUEST,
  PUSH_LED_ANIMATIONS,
  PUSH_MIDI_MODES,
  PUSH_PAD_COLUMNS,
  PUSH_PAD_ROWS,
  PUSH_TOUCH_STRIP_DEFAULT,
  PUSH_WHITE_LEVELS,
  isRgbPushButton,
  parsePushIdentity,
  parsePushPaletteEntry,
  parsePushPortName,
  parsePushSysex,
  pushButtonAt,
  pushButtonController,
  pushButtonLedMessage,
  pushButtons,
  pushEncoderAt,
  pushEncoderSteps,
  pushPadAt,
  pushPadLedMessage,
  pushPadNote,
  pushSetDisplayBrightness,
  pushSetLedBrightness,
  pushSetPaletteEntry,
  pushSetTouchStripLeds,
  pushSysex,
  pushTouchAt,
  pushTouchStripFlags,
  pushWhiteFor,
  type PushAftertouchMode,
  type PushButton,
  type PushEncoder,
  type PushIdentity,
  type PushLedAnimation,
  type PushModel,
  type PushPaletteEntry,
  type PushPort,
  type PushRgb,
  type PushTouch,
  type PushTouchStripConfiguration,
} from './protocol'

/** The slice of `MIDIInput` the driver listens on. */
export interface PushMidiInputLike {
  readonly id?: string
  readonly name?: string | null
  readonly state?: string
  onmidimessage: ((event: MidiMessageEventLike) => void) | null
}

/** The slice of `MIDIOutput` the driver writes to. */
export interface PushMidiOutputLike {
  readonly id?: string
  readonly name?: string | null
  readonly state?: string
  send(data: number[] | Uint8Array, timestamp?: number): void
}

/** The slice of `MIDIAccess` that `findPushPorts` reads; the browser's own object fits. */
export interface PushMidiAccessLike {
  readonly inputs: { values(): Iterable<PushMidiInputLike> }
  readonly outputs: { values(): Iterable<PushMidiOutputLike> }
}

export interface PushPorts {
  model: PushModel
  port: PushPort
  input: PushMidiInputLike
  output: PushMidiOutputLike
}

/**
 * The Push among the MIDI ports: an input and an output of the same model
 * and kind. The Live port is preferred (the device listens on it from power
 * on); the User port is taken when the Live port is not there, as when
 * another program keeps it. Null without a Push 2 or 3.
 */
export function findPushPorts(access: PushMidiAccessLike): PushPorts | null {
  const candidates: PushPorts[] = []
  for (const input of access.inputs.values()) {
    if (input.state === 'disconnected') continue
    const named = parsePushPortName(input.name)
    if (!named) continue
    for (const output of access.outputs.values()) {
      if (output.state === 'disconnected') continue
      const other = parsePushPortName(output.name)
      if (other?.model === named.model && other.port === named.port) {
        candidates.push({ ...named, input, output })
        break
      }
    }
  }
  // The newer model first, then the Live port.
  candidates.sort(
    (a, b) => b.model - a.model || (a.port === b.port ? 0 : a.port === 'live' ? -1 : 1),
  )
  return candidates[0] ?? null
}

export type PushEvent =
  /** A pad was hit or let go. Row 0 is the bottom row, column 0 the left one. */
  | { type: 'pad'; row: number; column: number; on: boolean; velocity: number }
  /** How hard a held pad is pressed, 0 to 1 (with poly aftertouch). */
  | { type: 'pad-pressure'; row: number; column: number; pressure: number }
  /** How hard the hardest-held pad is pressed, 0 to 1 (with channel aftertouch). */
  | { type: 'pressure'; pressure: number }
  | { type: 'button'; button: PushButton; down: boolean }
  /** An encoder moved by `steps` since its last event; negative is to the left. */
  | { type: 'encoder'; encoder: PushEncoder; steps: number }
  /** A finger came onto or left an encoder or the touch strip. */
  | { type: 'touch'; control: PushTouch; touched: boolean }
  /** Where the finger is on the touch strip: 0 at the bottom, 1 at the top. */
  | { type: 'strip'; value: number }
  /** A foot pedal, 1 or 2, 0 to 1. */
  | { type: 'pedal'; pedal: 1 | 2; value: number }

/** What an LED shows: a colour index, and with `to` an animation from it to another. */
export interface PushLed {
  color: number
  to?: number
  animation?: PushLedAnimation
}

/** The first palette index the driver takes for the app's colours. */
export const PUSH_PALETTE_FIRST = 64
/** How many colours the app can have; indices above stay with the documented defaults. */
export const PUSH_PALETTE_SIZE = 58

export interface PushDeviceOptions {
  input: PushMidiInputLike
  output: PushMidiOutputLike
  /** 2 or 3; read from the port's name when left out. */
  model?: PushModel
  /** Which of the two ports these are; read from the name when left out. */
  port?: PushPort
  /** How long a sysex question waits for its answer; default 250 ms. */
  replyTimeoutMs?: number
  setTimeout?: (handler: () => void, ms: number) => unknown
  clearTimeout?: (handle: unknown) => void
}

export interface PushOpenOptions {
  /** The app's colours by name; each gets an entry in the device's palette. */
  colors?: Readonly<Record<string, PushRgb>>
  /** What held pads send; default `poly`, one pressure per pad. */
  aftertouch?: PushAftertouchMode
  /** What the touch strip does; default as the device ships. */
  touchStrip?: PushTouchStripConfiguration
}

const CHANNEL_1 = 0
const MIDI_START = 0xfa
const PEDAL_CONTROLLERS: Readonly<Record<number, 1 | 2>> = { 64: 1, 69: 2 }

/** The documented default nearest to a colour, for a device that takes no sysex. */
export function nearestDefaultPushColor(color: PushRgb): number {
  const { r, g, b } = color
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max < 24) return PUSH_DEFAULT_COLORS.black
  // Close to grey: pick by brightness.
  if (max - min < 48) {
    if (max > 160) return PUSH_DEFAULT_COLORS.white
    return max > 56 ? PUSH_DEFAULT_COLORS.lightGray : PUSH_DEFAULT_COLORS.darkGray
  }
  if (r >= g && r >= b) return PUSH_DEFAULT_COLORS.red
  return g >= b ? PUSH_DEFAULT_COLORS.green : PUSH_DEFAULT_COLORS.blue
}

/** Web MIDI's answer to a sysex message from a page without that permission. */
function isSysexRefusal(error: unknown): boolean {
  return (error as { name?: unknown } | null)?.name === 'InvalidAccessError'
}

interface PendingReply {
  matches: (data: readonly number[]) => boolean
  resolve: (data: readonly number[] | null) => void
  timer: unknown
}

export class PushDevice {
  readonly model: PushModel
  readonly port: PushPort
  private readonly input: PushMidiInputLike
  private readonly output: PushMidiOutputLike
  private readonly events = new Emitter<PushEvent>()
  private readonly replyTimeoutMs: number
  private readonly setTimer: (handler: () => void, ms: number) => unknown
  private readonly clearTimer: (handle: unknown) => void
  /** What each LED was last told, by `n<note>` or `c<controller>`. */
  private readonly leds = new Map<string, PushLed>()
  private readonly colors = new Map<string, number>()
  private readonly colorValues = new Map<string, PushRgb>()
  /** Palette entries as they were before the app's colours went in. */
  private saved: PushPaletteEntry[] = []
  private pending: PendingReply | null = null
  private queue: Promise<unknown> = Promise.resolve()
  private sysexBuffer: number[] | null = null
  private runningStatus = 0
  private partial: number[] = []
  private open_ = false
  /** Counts every `open` and `close`: what was still on its way when it moves on stops there. */
  private turn = 0
  private sysex = true
  private identityValue: PushIdentity | null = null
  private stripValue: number | null = null

  constructor(options: PushDeviceOptions) {
    const named = parsePushPortName(options.input.name) ?? parsePushPortName(options.output.name)
    const model = options.model ?? named?.model
    if (!model) {
      throw new Error('live-mix: these MIDI ports are not a Push 2 or Push 3 (pass { model })')
    }
    this.model = model
    this.port = options.port ?? named?.port ?? 'live'
    this.input = options.input
    this.output = options.output
    this.replyTimeoutMs = options.replyTimeoutMs ?? 250
    this.setTimer = options.setTimeout ?? ((handler, ms) => setTimeout(handler, ms))
    this.clearTimer =
      options.clearTimeout ?? ((handle) => clearTimeout(handle as ReturnType<typeof setTimeout>))
  }

  get opened(): boolean {
    return this.open_
  }

  /** False when the port refused sysex: colours fall back to the device's defaults, and the strip and pressure stay as they are. */
  get sysexAvailable(): boolean {
    return this.sysex
  }

  /** What the device said about itself when it was opened, if it answered. */
  get identity(): PushIdentity | null {
    return this.identityValue
  }

  /** Every pad hit, button, encoder step and touch, as it arrives. */
  on(listener: (event: PushEvent) => void): () => void {
    return this.events.subscribe(listener)
  }

  /**
   * Starts listening and makes the device ready: it is asked who it is, told
   * which port to talk on, given the app's colours, and every LED goes dark.
   * The settings it had are remembered for `close`.
   */
  async open(options: PushOpenOptions = {}): Promise<void> {
    if (this.open_) return
    this.open_ = true
    const turn = (this.turn += 1)
    // A port that refused sysex last time may be a healthy one now.
    this.sysex = true
    this.input.onmidimessage = (event) => {
      if (event.data) this.receive(event.data)
    }
    const identity = await this.ask(PUSH_IDENTITY_REQUEST, (data) => data[1] === 0x7e)
    // Closed while the question was out: `close` has put the device back, and nothing more is done to it.
    if (turn !== this.turn) return
    this.identityValue = identity ? parsePushIdentity(identity) : null
    // The reply goes out on both ports, so it arrives whichever mode the device was in.
    await this.command(PUSH_COMMANDS.setMidiMode, [PUSH_MIDI_MODES[this.port]], true)
    if (turn !== this.turn) return
    this.sendSysex(
      pushSysex(PUSH_COMMANDS.setAftertouchMode, [
        PUSH_AFTERTOUCH_MODES[options.aftertouch ?? 'poly'],
      ]),
    )
    this.setTouchStrip(options.touchStrip ?? PUSH_TOUCH_STRIP_DEFAULT)
    if (options.colors) await this.setColors(options.colors)
    if (turn !== this.turn) return
    // LED animations are timed by MIDI clock and stand still until a start has been seen.
    this.send([MIDI_START])
    this.clear(true)
  }

  /**
   * Darkens the device, gives it back its palette, touch strip and pressure
   * mode, and stops listening.
   */
  async close(): Promise<void> {
    if (!this.open_) return
    this.turn += 1
    this.clear(true)
    if (this.sysex) {
      for (const entry of this.saved) {
        this.sendSysex(pushSetPaletteEntry(entry.index, entry, entry.white))
      }
      if (this.saved.length > 0) this.sendSysex(pushSysex(PUSH_COMMANDS.reapplyPalette))
      this.setTouchStrip(PUSH_TOUCH_STRIP_DEFAULT)
      this.sendSysex(pushSysex(PUSH_COMMANDS.setAftertouchMode, [PUSH_AFTERTOUCH_MODES.channel]))
      if (this.port !== 'live') {
        this.sendSysex(pushSysex(PUSH_COMMANDS.setMidiMode, [PUSH_MIDI_MODES.live]))
      }
    }
    await this.queue.catch(() => undefined)
    this.saved = []
    // The palette slots are the device's again, so the names no longer name them.
    this.colors.clear()
    this.colorValues.clear()
    this.settle(null)
    this.open_ = false
    this.input.onmidimessage = null
  }

  // Colours -----------------------------------------------------------------------

  /**
   * Puts the app's colours into the device's palette, from index 64 up, and
   * keeps what was there. A device that takes no sysex gets the documented
   * default nearest to each colour.
   */
  async setColors(colors: Readonly<Record<string, PushRgb>>): Promise<void> {
    const names = Object.keys(colors)
    if (names.length > PUSH_PALETTE_SIZE) {
      throw new RangeError(`live-mix: a Push palette holds ${PUSH_PALETTE_SIZE} app colours`)
    }
    // These are the app's colours now: a name left out has no index any more.
    this.colors.clear()
    this.colorValues.clear()
    const fresh: number[] = []
    names.forEach((name, i) => {
      const index = PUSH_PALETTE_FIRST + i
      if (!this.saved.some((entry) => entry.index === index)) fresh.push(index)
      this.colorValues.set(name, colors[name])
    })
    const turn = this.turn
    for (const index of fresh) {
      if (!this.sysex) break
      const reply = await this.command(PUSH_COMMANDS.getPaletteEntry, [index], true)
      // Closed while the question was out: the palette is the device's again, and the names name nothing.
      if (turn !== this.turn) return
      const entry = reply ? parsePushPaletteEntry(reply) : null
      if (entry) this.saved.push(entry)
    }
    names.forEach((name, i) => {
      const color = colors[name]
      if (this.sysex) {
        const index = PUSH_PALETTE_FIRST + i
        this.colors.set(name, index)
        this.sendSysex(pushSetPaletteEntry(index, color))
      } else {
        this.colors.set(name, nearestDefaultPushColor(color))
      }
    })
    this.sendSysex(pushSysex(PUSH_COMMANDS.reapplyPalette))
    // The first refused message turns sysex off: the colours set before it fall back too.
    if (!this.sysex) {
      for (const name of names) this.colors.set(name, nearestDefaultPushColor(colors[name]))
    }
  }

  /** The palette index of one of the app's colours; black for a name never given. */
  color(name: string): number {
    return this.colors.get(name) ?? PUSH_DEFAULT_COLORS.black
  }

  // LEDs --------------------------------------------------------------------------

  /** Lights a pad: a colour by name or index, or a full `PushLed`. Row 0 is the bottom row. */
  setPad(row: number, column: number, led: PushLed | number | string): void {
    if (row < 0 || row >= PUSH_PAD_ROWS || column < 0 || column >= PUSH_PAD_COLUMNS) return
    const note = pushPadNote(row, column)
    this.setLed(`n${note}`, this.led(led, true), (color, animation) =>
      pushPadLedMessage(note, color, animation),
    )
  }

  /**
   * Lights a button. A colour button takes a colour like a pad; a white one
   * shows how bright the colour is. A button this model lacks is ignored.
   */
  setButton(button: PushButton, led: PushLed | number | string): void {
    const controller = pushButtonController(this.model, button)
    if (controller === null) return
    this.setLed(`c${controller}`, this.led(led, isRgbPushButton(button)), (color, animation) =>
      pushButtonLedMessage(controller, color, animation),
    )
  }

  /** Every pad and button dark. `force` sends it even for LEDs believed dark already. */
  clear(force = false): void {
    // Forgetting what the LEDs show makes every one of them a change.
    if (force) this.leds.clear()
    for (let row = 0; row < PUSH_PAD_ROWS; row += 1) {
      for (let column = 0; column < PUSH_PAD_COLUMNS; column += 1) this.setPad(row, column, 0)
    }
    for (const [button] of pushButtons(this.model)) this.setButton(button, 0)
  }

  private led(led: PushLed | number | string, rgb: boolean): PushLed {
    if (typeof led === 'object') return led
    if (typeof led === 'number') return { color: led }
    if (rgb) return { color: this.color(led) }
    // A white LED has four documented steps; a named colour lands on the nearest.
    const value = this.colorValues.get(led)
    const white = value ? pushWhiteFor(value) : 0
    const { off, dim, half, full } = PUSH_WHITE_LEVELS
    return { color: white < 8 ? off : white < 40 ? dim : white < 96 ? half : full }
  }

  private setLed(
    key: string,
    next: PushLed,
    message: (color: number, animation: number) => number[],
  ): void {
    const current = this.leds.get(key)
    const animation = next.to === undefined ? 'none' : (next.animation ?? 'pulseQuarter')
    if (
      current?.color === next.color &&
      current.to === next.to &&
      current.animation === animation
    ) {
      return
    }
    this.leds.set(key, { color: next.color, to: next.to, animation })
    // Channel 0 sets the colour and ends an animation; another channel starts one from it.
    this.send(message(next.color, PUSH_LED_ANIMATIONS.none))
    if (next.to !== undefined) this.send(message(next.to, PUSH_LED_ANIMATIONS[animation]))
  }

  // Touch strip, brightness ---------------------------------------------------------

  setTouchStrip(configuration: PushTouchStripConfiguration): void {
    this.stripValue = null
    this.sendSysex(
      pushSysex(PUSH_COMMANDS.setTouchStripConfiguration, [pushTouchStripFlags(configuration)]),
    )
  }

  /**
   * Where the strip's LEDs stand, 0 to 1, when the configuration has
   * `hostLeds` without `ledsBySysex`: the device draws its bar or point there.
   */
  setTouchStripValue(value: number, modWheel = false): void {
    const clamped = Math.max(0, Math.min(1, value))
    if (this.stripValue !== null && Math.abs(this.stripValue - clamped) < 1 / 512) return
    this.stripValue = clamped
    if (modWheel) {
      this.send([0xb0, 1, Math.round(clamped * 127)])
      return
    }
    // Pitch bend, of which the strip uses the top eight bits.
    const bend = Math.round(clamped * 255) << 6
    this.send([0xe0, bend & 0x7f, (bend >> 7) & 0x7f])
  }

  /** The strip's 31 LEDs one by one, 0 (off) to 7, bottom first (configuration `ledsBySysex`). */
  setTouchStripLeds(levels: ArrayLike<number>): void {
    this.sendSysex(pushSetTouchStripLeds(levels))
  }

  /** The display's backlight, 0 to 255. On USB power alone the device caps it itself. */
  setDisplayBrightness(brightness: number): void {
    this.sendSysex(pushSetDisplayBrightness(brightness))
  }

  /** All LEDs together, 0 to 127. */
  setLedBrightness(brightness: number): void {
    this.sendSysex(pushSetLedBrightness(brightness))
  }

  // Bytes out -----------------------------------------------------------------------

  private send(data: readonly number[]): void {
    if (!this.open_) return
    try {
      this.output.send([...data])
    } catch {
      // A port that went away mid-send; the app hears about it from the MIDI access.
    }
  }

  private sendSysex(data: readonly number[]): void {
    if (!this.open_ || !this.sysex) return
    try {
      this.output.send([...data])
    } catch (error) {
      // Only a page that was not granted sysex gives it up for this session;
      // a port that went away mid-send is the other throw, and the next
      // `open` tries sysex again.
      if (isSysexRefusal(error)) this.sysex = false
    }
  }

  /** Sends a command; with `reply` waits for the device's answer and returns its arguments. */
  private async command(
    command: number,
    args: readonly number[],
    reply: boolean,
  ): Promise<number[] | null> {
    const message = pushSysex(command, args)
    if (!reply) {
      this.sendSysex(message)
      return null
    }
    const answer = await this.ask(message, (data) => parsePushSysex(data)?.command === command)
    return answer ? (parsePushSysex(answer)?.args ?? null) : null
  }

  /** One question at a time, as the device asks: the next waits for this one's answer or its timeout. */
  private ask(
    message: readonly number[],
    matches: (data: readonly number[]) => boolean,
  ): Promise<readonly number[] | null> {
    const run = (): Promise<readonly number[] | null> =>
      new Promise((resolve) => {
        if (!this.open_ || !this.sysex) {
          resolve(null)
          return
        }
        this.pending = {
          matches,
          resolve,
          timer: this.setTimer(() => this.settle(null), this.replyTimeoutMs),
        }
        this.sendSysex(message)
        if (!this.sysex) this.settle(null)
      })
    const result = this.queue.then(run, run)
    this.queue = result
    return result
  }

  private settle(data: readonly number[] | null): void {
    const pending = this.pending
    if (!pending) return
    this.pending = null
    this.clearTimer(pending.timer)
    pending.resolve(data)
  }

  // Bytes in ------------------------------------------------------------------------

  /** Takes bytes as a port delivers them: whole messages, several at once, or a sysex in pieces. */
  receive(data: ArrayLike<number>): void {
    for (let i = 0; i < data.length; i += 1) {
      const value = data[i]
      if (value >= 0xf8) continue // Real-time bytes may sit anywhere, a sysex included.
      if (this.sysexBuffer) {
        if (value === 0xf7) {
          const message = [...this.sysexBuffer, 0xf7]
          this.sysexBuffer = null
          this.receiveSysex(message)
        } else if (value >= 0x80) {
          // A status byte ends a sysex that never closed.
          this.sysexBuffer = null
          i -= 1
        } else {
          this.sysexBuffer.push(value)
        }
        continue
      }
      if (value === 0xf0) {
        this.sysexBuffer = [0xf0]
        this.partial = []
        continue
      }
      if (value >= 0x80) {
        this.runningStatus = value < 0xf0 ? value : 0
        this.partial = []
        continue
      }
      if (this.runningStatus === 0) continue
      this.partial.push(value)
      const command = this.runningStatus & 0xf0
      const needed = command === 0xc0 || command === 0xd0 ? 1 : 2
      if (this.partial.length < needed) continue
      const [first, second = 0] = this.partial
      this.partial = []
      this.receiveMessage(command, this.runningStatus & 0x0f, first, second)
    }
  }

  private receiveSysex(message: readonly number[]): void {
    if (this.pending?.matches(message)) this.settle(message)
  }

  private receiveMessage(command: number, channel: number, first: number, second: number): void {
    switch (command) {
      case 0x90:
      case 0x80: {
        const on = command === 0x90 && second > 0
        const pad = pushPadAt(first)
        // With MPE on, Push 3 spreads the pads over the channels; a pad is a pad on any of them.
        if (pad) {
          this.events.emit({ type: 'pad', ...pad, on, velocity: on ? second : 0 })
          return
        }
        if (channel !== CHANNEL_1) return
        const control = pushTouchAt(first)
        if (control) this.events.emit({ type: 'touch', control, touched: on })
        return
      }
      case 0xa0: {
        const pad = pushPadAt(first)
        if (pad) this.events.emit({ type: 'pad-pressure', ...pad, pressure: second / 127 })
        return
      }
      case 0xd0:
        if (channel === CHANNEL_1) this.events.emit({ type: 'pressure', pressure: first / 127 })
        return
      case 0xe0:
        // Channel 1 is the strip; on other channels it is a pad sliding (MPE), which has its own meaning.
        if (channel === CHANNEL_1) {
          this.events.emit({ type: 'strip', value: Math.min(1, ((second << 7) | first) / 16320) })
        }
        return
      case 0xb0: {
        if (channel !== CHANNEL_1) return
        const encoder = pushEncoderAt(this.model, first)
        if (encoder) {
          const steps = pushEncoderSteps(second)
          if (steps !== 0) this.events.emit({ type: 'encoder', encoder, steps })
          return
        }
        const button = pushButtonAt(this.model, first)
        if (button) {
          this.events.emit({ type: 'button', button, down: second > 0 })
          return
        }
        if (first === 1) {
          this.events.emit({ type: 'strip', value: second / 127 })
          return
        }
        const pedal = PEDAL_CONTROLLERS[first]
        if (pedal) this.events.emit({ type: 'pedal', pedal, value: second / 127 })
        return
      }
      default:
        return
    }
  }
}
