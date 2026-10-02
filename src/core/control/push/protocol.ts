// Ableton Push 2 and Push 3 on the wire: which note or controller each pad,
// button and encoder is, the sysex commands that configure the device, and
// the bytes that light an LED. Pure: numbers in, bytes out.
//
// Push 2 is as Ableton documents it in the "Ableton Push 2 MIDI and Display
// Interface Manual" (rev. 1.1, https://github.com/Ableton/push-interface).
// Ableton has published no such manual for Push 3. It answers to the same
// commands and keeps Push 2's numbers; what it adds (its jog wheel and the
// buttons Push 2 does not have, its USB product id, its third pressure mode)
// is taken from open-source drivers that run on the hardware and is marked
// `PUSH_3_*` here so the two sources stay apart.

export type PushModel = 2 | 3

export const ABLETON_USB_VENDOR_ID = 0x2982

/** USB product id per model: the display is claimed by it and the identity reply carries it. */
export const PUSH_USB_PRODUCT_IDS: Readonly<Record<PushModel, number>> = { 2: 0x1967, 3: 0x1969 }

export function pushModelForProductId(productId: number): PushModel | null {
  if (productId === PUSH_USB_PRODUCT_IDS[2]) return 2
  if (productId === PUSH_USB_PRODUCT_IDS[3]) return 3
  return null
}

// Ports ---------------------------------------------------------------------------

/** Push has two MIDI ports; the MIDI mode decides which one carries the controls. */
export type PushPort = 'live' | 'user'

export interface PushPortName {
  model: PushModel
  port: PushPort
}

/**
 * What a MIDI port's name says about it, or null when it is no Push 2 or 3.
 * The systems name the two ports differently: "… Live Port" and "… User Port"
 * (macOS), "Ableton Push 2" and "MIDIIN2 (Ableton Push 2)" (Windows),
 * "… MIDI 1" and "… MIDI 2" or "…:0" and "…:1" (Linux). The first Push has
 * another protocol and is not matched.
 */
export function parsePushPortName(name: string | null | undefined): PushPortName | null {
  if (!name) return null
  const match = /Ableton Push (\d)/i.exec(name)
  if (!match) return null
  const model = Number(match[1])
  if (model !== 2 && model !== 3) return null
  const user = /user port|MIDI(IN|OUT)2|MIDI 2\b|:1\s*$/i.test(name)
  return { model, port: user ? 'user' : 'live' }
}

// Pads ----------------------------------------------------------------------------

export const PUSH_PAD_ROWS = 8
export const PUSH_PAD_COLUMNS = 8
/** The bottom-left pad; notes rise to the right and then row by row to 99 at the top right. */
export const PUSH_FIRST_PAD_NOTE = 36
export const PUSH_LAST_PAD_NOTE = 99

/** The note of a pad. Row 0 is the bottom row, column 0 the left one. */
export function pushPadNote(row: number, column: number): number {
  return PUSH_FIRST_PAD_NOTE + row * PUSH_PAD_COLUMNS + column
}

/** The pad a note belongs to, or null when the note is no pad (a touch sensor, say). */
export function pushPadAt(note: number): { row: number; column: number } | null {
  if (note < PUSH_FIRST_PAD_NOTE || note > PUSH_LAST_PAD_NOTE) return null
  const index = note - PUSH_FIRST_PAD_NOTE
  return { row: Math.floor(index / PUSH_PAD_COLUMNS), column: index % PUSH_PAD_COLUMNS }
}

// Buttons -------------------------------------------------------------------------

/** Controller numbers of the buttons both models have (Push 2 manual, figure "MIDI Mapping"). */
export const PUSH_BUTTONS = {
  tapTempo: 3,
  metronome: 9,
  lower1: 20,
  lower2: 21,
  lower3: 22,
  lower4: 23,
  lower5: 24,
  lower6: 25,
  lower7: 26,
  lower8: 27,
  master: 28,
  stopClip: 29,
  setup: 30,
  layout: 31,
  convert: 35,
  scene8: 36,
  scene7: 37,
  scene6: 38,
  scene5: 39,
  scene4: 40,
  scene3: 41,
  scene2: 42,
  scene1: 43,
  left: 44,
  right: 45,
  up: 46,
  down: 47,
  select: 48,
  shift: 49,
  note: 50,
  session: 51,
  addDevice: 52,
  addTrack: 53,
  octaveDown: 54,
  octaveUp: 55,
  repeat: 56,
  accent: 57,
  scale: 58,
  user: 59,
  mute: 60,
  solo: 61,
  pageLeft: 62,
  pageRight: 63,
  play: 85,
  record: 86,
  new: 87,
  duplicate: 88,
  automate: 89,
  fixedLength: 90,
  upper1: 102,
  upper2: 103,
  upper3: 104,
  upper4: 105,
  upper5: 106,
  upper6: 107,
  upper7: 108,
  upper8: 109,
  device: 110,
  browse: 111,
  mix: 112,
  clip: 113,
  quantize: 116,
  doubleLoop: 117,
  delete: 118,
  undo: 119,
} as const

/**
 * Controller numbers only Push 3 sends. Not from Ableton: these are the
 * numbers the DrivenByMoss driver uses on the hardware.
 */
export const PUSH_3_BUTTONS = {
  smallEncoderPress: 15,
  add: 32,
  hotSwap: 33,
  sessionDisplay: 34,
  capture: 65,
  sets: 80,
  learn: 81,
  save: 82,
  lock: 83,
  dpadCentre: 91,
  jogLeft: 93,
  jogPress: 94,
  jogRight: 95,
  volumeMode: 111,
} as const

/**
 * Where Push 3 differs on a button both models have: its New button sends 92
 * (Push 2's sends 87), and it has no Browse button (111 is its master/cue
 * volume switch, `volumeMode`).
 */
const PUSH_3_MOVED: Partial<Record<keyof typeof PUSH_BUTTONS, number | null>> = {
  new: 92,
  browse: null,
}

export type PushButton = keyof typeof PUSH_BUTTONS | keyof typeof PUSH_3_BUTTONS

/** The eight buttons above the display and the eight below it, left to right. */
export const PUSH_UPPER_BUTTONS = [
  'upper1',
  'upper2',
  'upper3',
  'upper4',
  'upper5',
  'upper6',
  'upper7',
  'upper8',
] as const satisfies readonly PushButton[]
export const PUSH_LOWER_BUTTONS = [
  'lower1',
  'lower2',
  'lower3',
  'lower4',
  'lower5',
  'lower6',
  'lower7',
  'lower8',
] as const satisfies readonly PushButton[]
/** The buttons right of the pads, top to bottom: scene 1 is beside the top row. */
export const PUSH_SCENE_BUTTONS = [
  'scene1',
  'scene2',
  'scene3',
  'scene4',
  'scene5',
  'scene6',
  'scene7',
  'scene8',
] as const satisfies readonly PushButton[]

/** The buttons with a colour LED on Push 2; every other button's LED is white. */
const RGB_BUTTONS: ReadonlySet<PushButton> = new Set<PushButton>([
  ...PUSH_UPPER_BUTTONS,
  ...PUSH_LOWER_BUTTONS,
  ...PUSH_SCENE_BUTTONS,
  'mute',
  'solo',
  'stopClip',
  'automate',
  'record',
  'play',
])

export function isRgbPushButton(button: PushButton): boolean {
  return RGB_BUTTONS.has(button)
}

function buttonTable(model: PushModel): ReadonlyMap<PushButton, number> {
  const table = new Map<PushButton, number>()
  for (const [name, cc] of Object.entries(PUSH_BUTTONS)) {
    const button = name as keyof typeof PUSH_BUTTONS
    const moved = model === 3 ? PUSH_3_MOVED[button] : undefined
    if (moved === null) continue
    table.set(button, moved ?? cc)
  }
  if (model === 3) {
    for (const [name, cc] of Object.entries(PUSH_3_BUTTONS)) table.set(name as PushButton, cc)
  }
  return table
}

const BUTTON_CONTROLLERS: Readonly<Record<PushModel, ReadonlyMap<PushButton, number>>> = {
  2: buttonTable(2),
  3: buttonTable(3),
}

const BUTTONS_BY_CONTROLLER: Readonly<Record<PushModel, ReadonlyMap<number, PushButton>>> = {
  2: new Map([...BUTTON_CONTROLLERS[2]].map(([button, cc]) => [cc, button])),
  3: new Map([...BUTTON_CONTROLLERS[3]].map(([button, cc]) => [cc, button])),
}

/** The button a controller number belongs to on this model, or null. */
export function pushButtonAt(model: PushModel, controller: number): PushButton | null {
  return BUTTONS_BY_CONTROLLER[model].get(controller) ?? null
}

/** The controller number of a button, or null when this model has no such button. */
export function pushButtonController(model: PushModel, button: PushButton): number | null {
  return BUTTON_CONTROLLERS[model].get(button) ?? null
}

/** Every button of a model, with its controller number. */
export function pushButtons(model: PushModel): ReadonlyMap<PushButton, number> {
  return BUTTON_CONTROLLERS[model]
}

// Encoders ------------------------------------------------------------------------

/**
 * Controller numbers of the encoders. They are endless and send how far they
 * moved since the last message. `swing` is Push 2's second small encoder;
 * `jog` is Push 3's wheel (controller 70, from DrivenByMoss, not Ableton).
 */
export const PUSH_ENCODERS = {
  tempo: 14,
  swing: 15,
  jog: 70,
  track1: 71,
  track2: 72,
  track3: 73,
  track4: 74,
  track5: 75,
  track6: 76,
  track7: 77,
  track8: 78,
  master: 79,
} as const

export type PushEncoder = keyof typeof PUSH_ENCODERS

/** The eight encoders above the display, left to right. */
export const PUSH_TRACK_ENCODERS = [
  'track1',
  'track2',
  'track3',
  'track4',
  'track5',
  'track6',
  'track7',
  'track8',
] as const satisfies readonly PushEncoder[]

/** Notes the encoders send while a finger rests on them (velocity 127 touched, 0 let go). */
export const PUSH_TOUCH_NOTES = {
  track1: 0,
  track2: 1,
  track3: 2,
  track4: 3,
  track5: 4,
  track6: 5,
  track7: 6,
  track8: 7,
  master: 8,
  swing: 9,
  tempo: 10,
  strip: 12,
} as const

export type PushTouch = keyof typeof PUSH_TOUCH_NOTES

/** The encoder a controller number belongs to on this model, or null. */
export function pushEncoderAt(model: PushModel, controller: number): PushEncoder | null {
  if (controller >= PUSH_ENCODERS.track1 && controller <= PUSH_ENCODERS.track8) {
    return PUSH_TRACK_ENCODERS[controller - PUSH_ENCODERS.track1]
  }
  if (controller === PUSH_ENCODERS.master) return 'master'
  if (controller === PUSH_ENCODERS.tempo) return 'tempo'
  if (controller === PUSH_ENCODERS.swing) return model === 2 ? 'swing' : null
  if (controller === PUSH_ENCODERS.jog) return model === 3 ? 'jog' : null
  return null
}

export function pushTouchAt(note: number): PushTouch | null {
  for (const [name, value] of Object.entries(PUSH_TOUCH_NOTES)) {
    if (value === note) return name as PushTouch
  }
  return null
}

/**
 * How far an encoder moved: its 7-bit value is a two's complement count of
 * steps since the last message, 1 to 63 to the right and 127 down to 64 to
 * the left. A whole turn is about 210 steps (18 on the detented tempo encoder).
 */
export function pushEncoderSteps(value: number): number {
  const byte = value & 0x7f
  return byte < 64 ? byte : byte - 128
}

/** Steps as an encoder would send them (for tests and stand-ins); clamped to what one message holds. */
export function pushEncoderValue(steps: number): number {
  const clamped = Math.max(-64, Math.min(63, Math.round(steps)))
  return clamped < 0 ? clamped + 128 : clamped
}

/** Steps of the track encoders for one whole turn. */
export const PUSH_ENCODER_STEPS_PER_TURN = 210

// LEDs ----------------------------------------------------------------------------

/**
 * What the channel of an LED message asks for. Channel 0 sets a colour and
 * ends any animation; a message on another channel moves from that colour to
 * the one it carries, once, pulsing or blinking, over the named note length
 * (timed by MIDI clock, 120 bpm when the host sends none).
 */
export const PUSH_LED_ANIMATIONS = {
  none: 0,
  oneShot24th: 1,
  oneShot16th: 2,
  oneShot8th: 3,
  oneShotQuarter: 4,
  oneShotHalf: 5,
  pulse24th: 6,
  pulse16th: 7,
  pulse8th: 8,
  pulseQuarter: 9,
  pulseHalf: 10,
  blink24th: 11,
  blink16th: 12,
  blink8th: 13,
  blinkQuarter: 14,
  blinkHalf: 15,
} as const

export type PushLedAnimation = keyof typeof PUSH_LED_ANIMATIONS

/** Colour indices of the default palette that Ableton says will stay. */
export const PUSH_DEFAULT_COLORS = {
  black: 0,
  white: 122,
  lightGray: 123,
  darkGray: 124,
  blue: 125,
  green: 126,
  red: 127,
} as const

/** What a white LED shows for the documented indices of the default palette. */
export const PUSH_WHITE_LEVELS = { off: 0, dim: 16, half: 48, full: 127 } as const

/** The message that sets a pad's LED: a note-on whose velocity is a colour index. */
export function pushPadLedMessage(note: number, color: number, animation = 0): number[] {
  return [0x90 | (animation & 0x0f), note & 0x7f, color & 0x7f]
}

/** The message that sets a button's LED: a control change whose value is a colour index. */
export function pushButtonLedMessage(controller: number, color: number, animation = 0): number[] {
  return [0xb0 | (animation & 0x0f), controller & 0x7f, color & 0x7f]
}

// Sysex ---------------------------------------------------------------------------

/** Start of every Push sysex message: Ableton's manufacturer id, device id 1, model id 1. */
export const PUSH_SYSEX_HEADER = [0xf0, 0x00, 0x21, 0x1d, 0x01, 0x01] as const

/** The documented commands. Every other id is reserved; some can damage a device. */
export const PUSH_COMMANDS = {
  setPaletteEntry: 0x03,
  getPaletteEntry: 0x04,
  reapplyPalette: 0x05,
  setLedBrightness: 0x06,
  getLedBrightness: 0x07,
  setDisplayBrightness: 0x08,
  getDisplayBrightness: 0x09,
  setMidiMode: 0x0a,
  setTouchStripConfiguration: 0x17,
  getTouchStripConfiguration: 0x18,
  setTouchStripLeds: 0x19,
  requestStatistics: 0x1a,
  setAftertouchMode: 0x1e,
  getAftertouchMode: 0x1f,
} as const

export type PushCommand = keyof typeof PUSH_COMMANDS

const KNOWN_COMMANDS: ReadonlySet<number> = new Set(Object.values(PUSH_COMMANDS))

/** A sysex command for the device. Throws for an id this module does not document. */
export function pushSysex(command: number, args: ArrayLike<number> = []): number[] {
  if (!KNOWN_COMMANDS.has(command)) {
    throw new RangeError(`live-mix: 0x${command.toString(16)} is not a documented Push command`)
  }
  const message: number[] = [...PUSH_SYSEX_HEADER, command]
  for (let i = 0; i < args.length; i += 1) {
    const value = args[i]
    if (!Number.isInteger(value) || value < 0 || value > 0x7f) {
      throw new RangeError(`live-mix: Push sysex argument ${i} is ${value}, not a 7-bit value`)
    }
    message.push(value)
  }
  message.push(0xf7)
  return message
}

/** The command id and arguments of a Push sysex message, or null when it is something else. */
export function parsePushSysex(
  data: ArrayLike<number>,
): { command: number; args: number[] } | null {
  if (data.length < PUSH_SYSEX_HEADER.length + 2) return null
  for (let i = 0; i < PUSH_SYSEX_HEADER.length; i += 1) {
    if (data[i] !== PUSH_SYSEX_HEADER[i]) return null
  }
  if (data[data.length - 1] !== 0xf7) return null
  const args: number[] = []
  for (let i = PUSH_SYSEX_HEADER.length + 1; i < data.length - 1; i += 1) args.push(data[i])
  return { command: data[PUSH_SYSEX_HEADER.length], args }
}

/** Which port carries the pads, buttons and LEDs. Sysex is always taken from both. */
export const PUSH_MIDI_MODES = { live: 0, user: 1, dual: 2 } as const

/**
 * What the pads send while held. `mpe` is Push 3's (value 2, from
 * DrivenByMoss): each note on its own channel with slide and pressure.
 */
export const PUSH_AFTERTOUCH_MODES = { channel: 0, poly: 1, mpe: 2 } as const

export type PushAftertouchMode = keyof typeof PUSH_AFTERTOUCH_MODES

export interface PushRgb {
  r: number
  g: number
  b: number
}

function byte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}

/** An 8-bit value as the two 7-bit arguments a palette entry carries: low seven bits, then the top one. */
function split8(value: number): [number, number] {
  const clamped = byte(value)
  return [clamped & 0x7f, clamped >> 7]
}

/** What a white LED shows for a colour: its luma, on the white palette's scale (128 is full). */
export function pushWhiteFor(color: PushRgb): number {
  const luma = 0.2126 * byte(color.r) + 0.7152 * byte(color.g) + 0.0722 * byte(color.b)
  return Math.round(luma / 2)
}

/** "Set LED Color Palette Entry": one colour index becomes this colour (and this white level). */
export function pushSetPaletteEntry(
  index: number,
  color: PushRgb,
  white = pushWhiteFor(color),
): number[] {
  return pushSysex(PUSH_COMMANDS.setPaletteEntry, [
    index & 0x7f,
    ...split8(color.r),
    ...split8(color.g),
    ...split8(color.b),
    ...split8(white),
  ])
}

export interface PushPaletteEntry extends PushRgb {
  index: number
  white: number
}

/** The arguments of a palette reply (or of a set command) as a colour. */
export function parsePushPaletteEntry(args: ArrayLike<number>): PushPaletteEntry | null {
  if (args.length < 9) return null
  const join = (at: number): number => (args[at] & 0x7f) | ((args[at + 1] & 0x01) << 7)
  return { index: args[0], r: join(1), g: join(3), b: join(5), white: join(7) }
}

/** "Set Display Brightness", 0 (off) to 255. */
export function pushSetDisplayBrightness(brightness: number): number[] {
  return pushSysex(PUSH_COMMANDS.setDisplayBrightness, split8(brightness))
}

/** "Set LED Brightness", 0 to 127. */
export function pushSetLedBrightness(brightness: number): number[] {
  return pushSysex(PUSH_COMMANDS.setLedBrightness, [
    Math.max(0, Math.min(127, Math.round(brightness))),
  ])
}

/** What the touch strip does, as the flags of "Set Touch Strip Configuration". */
export interface PushTouchStripConfiguration {
  /** The host lights the strip's LEDs; otherwise Push shows the finger itself. */
  hostLeds?: boolean
  /** With `hostLeds`: the host sends the 31 LEDs by sysex, not a value to draw. */
  ledsBySysex?: boolean
  /** The strip sends the mod wheel (controller 1), not pitch bend. */
  modWheel?: boolean
  /** The LEDs show one point, not a bar. */
  point?: boolean
  /** A bar starts at the centre, not the bottom. */
  barFromCentre?: boolean
  /** The value returns when the finger lifts. */
  autoReturn?: boolean
  /** It returns to the centre, not the bottom. */
  returnToCentre?: boolean
}

/** The device's own setting: a point that follows the finger and springs back to the centre, as pitch bend. */
export const PUSH_TOUCH_STRIP_DEFAULT: PushTouchStripConfiguration = {
  point: true,
  autoReturn: true,
  returnToCentre: true,
}

export function pushTouchStripFlags(configuration: PushTouchStripConfiguration): number {
  return (
    (configuration.hostLeds ? 1 : 0) |
    (configuration.ledsBySysex ? 2 : 0) |
    (configuration.modWheel ? 4 : 0) |
    (configuration.point ? 8 : 0) |
    (configuration.barFromCentre ? 16 : 0) |
    (configuration.autoReturn ? 32 : 0) |
    (configuration.returnToCentre ? 64 : 0)
  )
}

export const PUSH_TOUCH_STRIP_LEDS = 31

/**
 * "Set Touch Strip LEDs": 31 brightness steps of 0 to 7, bottom LED first,
 * packed two to a byte. Only shown when the configuration has `hostLeds`
 * and `ledsBySysex`.
 */
export function pushSetTouchStripLeds(levels: ArrayLike<number>): number[] {
  const args: number[] = []
  for (let i = 0; i < PUSH_TOUCH_STRIP_LEDS; i += 2) {
    const low = Math.max(0, Math.min(7, Math.round(levels[i] ?? 0)))
    const high =
      i + 1 < PUSH_TOUCH_STRIP_LEDS ? Math.max(0, Math.min(7, Math.round(levels[i + 1] ?? 0))) : 0
    args.push(low | (high << 3))
  }
  return pushSysex(PUSH_COMMANDS.setTouchStripLeds, args)
}

/** The MIDI standard's identity request; Push answers with its model, firmware and serial number. */
export const PUSH_IDENTITY_REQUEST = [0xf0, 0x7e, 0x01, 0x06, 0x01, 0xf7] as const

export interface PushIdentity {
  /** The USB product id (0x1967 for Push 2). */
  productId: number
  model: PushModel | null
  /** Firmware as "major.minor.build". */
  firmware: string
  serial: number
  boardRevision: number
}

/** Reads an identity reply; null for anything that is not Ableton's. */
export function parsePushIdentity(data: ArrayLike<number>): PushIdentity | null {
  if (data.length < 23) return null
  const expected = [0xf0, 0x7e, -1, 0x06, 0x02, 0x00, 0x21, 0x1d]
  for (let i = 0; i < expected.length; i += 1) {
    if (expected[i] >= 0 && data[i] !== expected[i]) return null
  }
  const productId = data[8] | (data[9] << 7)
  const build = data[14] | (data[15] << 7)
  const serial =
    data[16] + data[17] * 2 ** 7 + data[18] * 2 ** 14 + data[19] * 2 ** 21 + data[20] * 2 ** 28
  return {
    productId,
    model: pushModelForProductId(productId),
    firmware: `${data[12]}.${data[13]}.${build}`,
    serial,
    boardRevision: data[21],
  }
}
