// The display of Silent Keys: a chord held down without a sound, and how
// loudly each of its strings answers.
//
// Along the top stand the eight chords of the list, the held one filled, with
// how far it is on its way to the next one under it while the list walks, and
// the ring that sets Chord. Under them the held chord is named. Below is a
// keyboard: a thin line stands over each key that is held, which is its free
// string, and a bar climbs the line as far as the string rings, on a scale in
// dB, with the key lit by as much. The bass strings have dashed lines. A
// string whose damper has come down goes on as a bar with no line over it,
// falling as its damper has it fall.
//
// Which keys a chord holds is worked out here from the knobs with the device's
// own arithmetic (`keys_of` in `cpp/devices/silent-keys/silent_keys.h`), so
// the chord is drawn before any sound has come; the levels, the chord a walk
// has come to and how far it is are the device's readings.
//
// Nothing here moves faster than three times a second: a bar that turns from
// rising to falling waits a sixth of a second before it turns again, and a
// list that walks faster than that shows its chords three a second and not
// how far each has come.

import {
  INK,
  clamp,
  fillRect,
  follow,
  gainToDb,
  ground,
  handle,
  lerp,
  rule,
  text,
  type Box,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayHold,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

// --- The device's numbers (`silent_keys.h`) -------------------------------------

/** `kChords`, `kKeys`: chords in the list, and keys in a chord at most. */
export const SILENT_CHORDS = 8
export const SILENT_KEYS_MOST = 6
/** `kLowestNote`, `kHighestNote`: C0 and C8, as note numbers (60 is C4). */
export const SILENT_LOWEST = 12
export const SILENT_HIGHEST = 108
/** `keys_of`: Root counts semitones up from C1. */
const ROOT_FROM = 24
/** `apply`, kEvery: under this the list stands, and from it a chord is held a quarter of a second at the least. */
const EVERY_LEAST = 0.125
const EVERY_SHORTEST = 0.25

/** `shape`: the semitones over the root of each Shape, in the order of its choices. Keys has none of its own. */
export const SILENT_SHAPES: readonly (readonly number[])[] = [
  [],
  [0],
  [0, 4, 7],
  [0, 3, 7],
  [0, 4, 7, 11],
  [0, 4, 7, 10],
  [0, 3, 7, 10],
  [0, 4, 7, 11, 14],
  [0, 3, 7, 10, 14],
  [0, 4, 7, 14],
  [0, 2, 7],
  [0, 5, 7],
  [0, 4, 7, 9],
  [0, 3, 7, 9],
  [0, 7, 14],
  [0, 7, 12],
  [0, 12, 24, 36],
  [0, 5, 10, 15],
  [0, 3, 6],
  [0, 3, 6, 9],
  [0, 3, 6, 10],
  [0, 4, 8],
  [0, 4, 7, 11, 14, 18],
  [0, 3, 7, 10, 14, 17],
  [0, 1, 2, 3],
]

/** `whole`: how the device rounds a setting it takes whole. */
const whole = (value: number): number => Math.floor(value + 0.5)

type Value = (param: string) => number

/** The chord the Chord knob points at, from 0: `chord_of`. */
export const silentChordOf = (value: number): number => clamp(whole(value), 1, SILENT_CHORDS) - 1

/** How long a chord is held while the list walks, in seconds; 0 when it stands. */
export const silentEvery = (every: number): number =>
  every < EVERY_LEAST ? 0 : Math.max(every, EVERY_SHORTEST)

/** Whether a chord, from 0, is one a walk comes round to: `after` goes 1 to Count and round. */
export const silentInWalk = (chord: number, count: number): boolean =>
  chord === 0 || chord < whole(count)

/** Whether the shape of chord `chord`, from 0, is Keys. */
const keysShape = (value: Value, chord: number): boolean => whole(value(`shape${chord + 1}`)) === 0

/** `keys_of`: the note numbers chord `chord`, from 0, holds, lowest first, none twice. */
export function silentKeys(value: Value, chord: number): number[] {
  const notes: number[] = []
  const insert = (note: number): void => {
    if (!notes.includes(note)) notes.push(note)
  }
  if (keysShape(value, chord)) {
    for (let k = 1; k <= SILENT_KEYS_MOST; k++) {
      const key = whole(value(`key${k}`))
      if (key > 0) insert(SILENT_LOWEST - 1 + key)
    }
  } else {
    const root = ROOT_FROM + whole(value(`root${chord + 1}`))
    const spacing = whole(value('spacing'))
    const shape = SILENT_SHAPES[clamp(whole(value(`shape${chord + 1}`)), 0, 24)]
    shape.forEach((interval, k) => {
      let note = root + interval
      if (k % 2 === 1) note += spacing === 1 ? 12 : spacing === 2 ? 24 : 0
      else if (k > 0 && spacing === 2) note += 12
      while (note > SILENT_HIGHEST) note -= 12
      insert(note)
    })
  }
  return notes.sort((a, b) => a - b)
}

/** `hold`: the bass strings under a chord's lowest key, one and two octaves down, where the keyboard goes that far. */
export function silentBass(value: Value, keys: readonly number[]): number[] {
  if (keys.length === 0 || !(value('bass') > 0)) return []
  return [keys[0] - 12, keys[0] - 24].filter((note) => note >= SILENT_LOWEST)
}

/** `decay_seconds`: how long a string at `hz` rings, in seconds to fall 60 dB. */
export const silentRing = (ring: number, hz: number): number =>
  ring * clamp(Math.pow(220 / hz, 0.4), 0.25, 1.5)

/** `decay`, its damper down: how many dB a second the fundamental of a dying string falls. */
export const silentFall = (ring: number, damperMs: number, hz: number): number =>
  60 * (1 / silentRing(ring, hz) + 1000 / damperMs)

const hzOfNote = (note: number): number => 440 * Math.pow(2, (note - 69) / 12)

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
/** A note number as the knobs say it: 60 is "C4". */
export const silentNoteName = (note: number): string =>
  `${NAMES[((note % 12) + 12) % 12]}${Math.floor(note / 12) - 1}`

// --- The keyboard ---------------------------------------------------------------

/** A white key wider than this makes room for another octave, and the widest a bar is, in pixels. */
const WIDEST_KEY = 12
const WIDEST_BAR = 5

/** The keys drawn, from a C to a C. */
export interface SilentRange {
  low: number
  high: number
}

/**
 * The stretch of keyboard that is drawn: whole octaves that hold every key of
 * all eight chords, with one key to spare at each end, so it stays as it is
 * whichever chord is held. Three octaves at the least, and more across a wide
 * display, where its keys would be wider than they need to be.
 */
export function silentRange(value: Value, width = 0): SilentRange {
  let least = Infinity
  let most = -Infinity
  for (let chord = 0; chord < SILENT_CHORDS; chord++) {
    const keys = silentKeys(value, chord)
    for (const note of [...keys, ...silentBass(value, keys)]) {
      least = Math.min(least, note)
      most = Math.max(most, note)
    }
  }
  const none = !Number.isFinite(least)
  let low = none ? 36 : Math.max(SILENT_LOWEST, 12 * Math.floor((least - 1) / 12))
  let high = none ? 72 : Math.min(SILENT_HIGHEST, 12 * Math.ceil((most + 1) / 12))
  while (high - low < 36) {
    if (high < SILENT_HIGHEST) high += 12
    else low -= 12
  }
  // Past the room eight octaves have nothing is left to add, and the keys go on growing.
  while (
    high - low < SILENT_HIGHEST - SILENT_LOWEST &&
    width / silentWhites({ low, high }) > WIDEST_KEY
  ) {
    if (high < SILENT_HIGHEST && SILENT_HIGHEST - high >= low - SILENT_LOWEST) high += 12
    else low -= 12
  }
  return { low, high }
}

const BLACK = [false, true, false, true, false, false, true, false, true, false, true, false]
const isBlack = (note: number): boolean => BLACK[((note % 12) + 12) % 12]
/** Where each key of an octave stands, in white keys from its C: a white key at its middle, a black one on the line between two. */
const KEY_AT = [0.5, 1, 1.5, 2, 2.5, 3.5, 4, 4.5, 5, 5.5, 6, 6.5]

/** How many white keys a range has: seven an octave and the C on top. */
export const silentWhites = (range: SilentRange): number => (7 * (range.high - range.low)) / 12 + 1

/** Where the middle of a key is across the keyboard. */
export function silentKeyX(note: number, range: SilentRange, keys: Box): number {
  const over = note - range.low
  const at = 7 * Math.floor(over / 12) + KEY_AT[((over % 12) + 12) % 12]
  return keys.x + (at * keys.w) / silentWhites(range)
}

/** The key whose middle is nearest to a place across the keyboard. */
export function silentNoteOfX(x: number, range: SilentRange, keys: Box): number {
  let best = range.low
  for (let note = range.low; note <= range.high; note++) {
    const nearer =
      Math.abs(silentKeyX(note, range, keys) - x) < Math.abs(silentKeyX(best, range, keys) - x)
    if (nearer) best = note
  }
  return best
}

/** The scale of the bars: a string's level as its reading has it, in dB. */
export const SILENT_TOP_DB = -6
export const SILENT_FOOT_DB = -66
/** How far up its line a level stands, 0 to 1. */
export const silentShare = (db: number): number =>
  clamp((db - SILENT_FOOT_DB) / (SILENT_TOP_DB - SILENT_FOOT_DB), 0, 1)

// --- Where things stand -------------------------------------------------------

export interface SilentLayout {
  /** The row of eight chords, and how wide one cell is. */
  cells: Box
  cell: number
  /** The line under the row that the ring of Chord stands on. */
  track: number
  /** The line the held chord is named on, and its two ends. */
  base: number
  left: number
  right: number
  /** The strings over the keys, and the keys. */
  strings: Box
  keys: Box
  /** The line the octaves are named on. */
  octaves: number
}

/** Laid out from the size it is given: the list, the chord's name, the strings, the keyboard, its octaves. */
export function silentLayout(view: Pick<DisplayView, 'width' | 'height'>): SilentLayout {
  const { width, height } = view
  const inside = Math.max(16, width - 10)
  const cells: Box = { x: 5, y: 4, w: inside, h: 10 }
  const octaves = height - 4
  const tall = Math.max(8, Math.round(height * 0.2))
  const keys: Box = { x: 5, y: octaves - 11 - tall, w: inside, h: tall }
  const base = 33
  const top = base + 4
  return {
    cells,
    cell: cells.w / SILENT_CHORDS,
    track: 20,
    base,
    left: 6,
    right: width - 6,
    strings: { x: keys.x, y: top, w: keys.w, h: Math.max(4, keys.y - top) },
    keys,
    octaves,
  }
}

/** Where the middle of a chord's cell is across the row. */
export const silentCellX = (chord: number, layout: SilentLayout): number =>
  layout.cells.x + (chord + 0.5) * layout.cell

// --- The points ---------------------------------------------------------------

/**
 * Chord is the ring under its cell: across the row is the chord. While the
 * list stands, the ring on the front of the lowest key is the chord's Root,
 * a turn of the wheel over it steps through its shapes, and a chord of the
 * Keys shape has a ring on each of its keys instead.
 */
function silentHandles(view: DisplayView): DisplayHandle[] {
  const layout = silentLayout(view)
  const value: Value = (name) => view.value(name)
  const chord = silentChordOf(view.value('chord'))
  const start = (name: string): number => view.spec(name)?.default ?? view.value(name)
  const points: DisplayHandle[] = [
    {
      key: 'chord',
      name: 'Chord',
      x: silentCellX(chord, layout),
      y: layout.track,
      drag: (x) => ({
        chord:
          1 + clamp(Math.floor((x - layout.cells.x) / layout.cell + 1e-9), 0, SILENT_CHORDS - 1),
      }),
      wheel: (steps) => ({ chord: clamp(chord + 1 + steps, 1, SILENT_CHORDS) }),
      reset: () => ({ chord: start('chord') }),
    },
  ]
  // A list that walks holds other chords than the one these would set.
  if (silentEvery(view.value('every')) > 0) return points
  const { keys } = layout
  const range = silentRange(value, layout.keys.w)
  /** The key under the hand, on the stretch of keyboard that was drawn when it was taken: that stretch may change with it. */
  const noteAt = (x: number, hold?: DisplayHold): number => {
    const low = hold ? (hold.low ??= range.low) : range.low
    const high = hold ? (hold.high ??= range.high) : range.high
    return silentNoteOfX(x, { low, high }, keys)
  }
  const y = keys.y + keys.h
  if (keysShape(value, chord)) {
    for (let k = 1; k <= SILENT_KEYS_MOST; k++) {
      const name = `key${k}`
      const key = whole(view.value(name))
      if (key < 1) continue
      const from = SILENT_LOWEST - 1
      points.push({
        key: name,
        name: `Key ${k}`,
        x: silentKeyX(from + key, range, keys),
        y,
        drag: (x, _y, hold) => ({
          [name]: clamp(noteAt(x, hold) - from, 1, view.spec(name)?.max ?? 97),
        }),
        reset: () => ({ [name]: start(name) }),
      })
    }
    return points
  }
  const name = `root${chord + 1}`
  const shape = `shape${chord + 1}`
  points.push({
    key: 'root',
    name: 'Root',
    x: silentKeyX(ROOT_FROM + whole(view.value(name)), range, keys),
    y,
    drag: (x, _y, hold) => ({
      [name]: clamp(noteAt(x, hold) - ROOT_FROM, 0, view.spec(name)?.max ?? 60),
    }),
    // Not as far as Keys, which has no root to hold.
    wheel: (steps) => ({
      [shape]: clamp(whole(view.value(shape)) + steps, 1, SILENT_SHAPES.length - 1),
    }),
    reset: () => ({ [name]: start(name) }),
  })
  return points
}

// --- The display --------------------------------------------------------------

/** A bar that has turned may not turn again for this long: three times up and down a second at the most. */
const TURN_SEC = 1 / 6 + 0.001
/** A list that walks faster than this shows three chords a second. */
const SHOWN_SEC = 1 / 3
/** How fast a bar comes up to its string's level, and down to it. */
const RISE_SEC = 0.03
const SINK_SEC = 0.1

/** One string as it is drawn. */
interface SilentString {
  note: number
  bass: boolean
  /** Its key is held; else its damper is down. */
  held: boolean
  /** The level it has, in dB: the device's reading, or what its damper has left of the last one. */
  level: number
  /** The level drawn. */
  shown: number
  /** Which way the bar moves, and when it last turned. */
  way: -1 | 0 | 1
  turned: number
}

interface SilentState {
  /** The chord drawn, from 0, and since when; -1 before the first frame. */
  chord: number
  since: number
  strings: Map<string, SilentString>
}

const STRING_METERS = Array.from({ length: SILENT_KEYS_MOST }, (_, k) => `string${k + 1}`)
const NOTE_METERS = Array.from({ length: SILENT_KEYS_MOST }, (_, k) => `note${k + 1}`)
const BASS_METERS = ['bass1', 'bass2']

/** A string's level in dB as the device reads it out; the foot of the scale for a key the device does not say it holds. */
function levelOf(frame: DisplayFrame, note: number, bass: boolean, lowest: number): number {
  let reading = 0
  if (bass) {
    reading = frame.meter(BASS_METERS[(lowest - note) / 12 - 1])
  } else {
    const at = NOTE_METERS.findIndex((name) => frame.hasMeter(name) && frame.meter(name) === note)
    if (at >= 0) reading = frame.meter(STRING_METERS[at])
  }
  return Number.isFinite(reading) ? clamp(gainToDb(reading), SILENT_FOOT_DB, 12) : SILENT_FOOT_DB
}

/** Bring a bar towards its string's level, no sooner than it may turn. */
function climb(string: SilentString, now: number, dt: number): void {
  const way = Math.sign(string.level - string.shown) as -1 | 0 | 1
  if (way === 0) return
  if (string.way !== 0 && way !== string.way) {
    if (now - string.turned < TURN_SEC) return
    string.turned = now
  }
  string.way = way
  string.shown = follow(string.shown, string.level, dt, RISE_SEC, SINK_SEC)
}

const silentKeysDisplay = plateDisplay<SilentState>({
  place: 'window',
  columns: 2,
  params: [
    'chord',
    'count',
    'every',
    'spacing',
    ...Array.from({ length: SILENT_CHORDS }, (_, k) => [`root${k + 1}`, `shape${k + 1}`]).flat(),
    ...Array.from({ length: SILENT_KEYS_MOST }, (_, k) => `key${k + 1}`),
    'bass',
  ],
  // A walk goes on through a silence as long as Every, and then stands at its start.
  live: { meters: true, settle: 32 },
  info: 'The eight chords of the list, and the held one on a keyboard: a line over each key is its free string, and the bar on it is how loudly it rings. Drag the ring under the list to pick a chord and the ring on a key to move its root; the wheel over that ring changes its shape.',
  init: () => ({ chord: -1, since: -Infinity, strings: new Map<string, SilentString>() }),
  draw(frame) {
    const { ctx, colours, state, now } = frame
    ground(frame)
    const layout = silentLayout(frame)
    const value: Value = (name) => frame.value(name)
    const every = silentEvery(frame.value('every'))
    const walking = every > 0

    // --- The chord that is held: Chord's own, or the one a walk has come to ---
    const metered = frame.powered && frame.hasMeter('held')
    const reading = metered ? frame.meter('held') : 0
    const asked = silentChordOf(frame.value('chord'))
    const held = walking && reading >= 1 ? silentChordOf(reading) : asked
    const running = frame.dt > 0
    if (
      !walking ||
      !running ||
      state.chord < 0 ||
      (held !== state.chord && now - state.since >= SHOWN_SEC)
    ) {
      if (held !== state.chord) state.since = now
      state.chord = held
    }
    const chord = state.chord
    const keys = silentKeys(value, chord)
    const bass = silentBass(value, keys)

    // --- What each string has ---
    if (!metered) state.strings.clear()
    for (const string of state.strings.values()) string.held = false
    if (metered) {
      for (const [notes, low] of [
        [keys, false],
        [bass, true],
      ] as const) {
        for (const note of notes) {
          const id = `${note}${low ? ' bass' : ''}`
          const level = levelOf(frame, note, low, keys[0])
          let string = state.strings.get(id)
          if (!string) {
            string = {
              note,
              bass: low,
              held: true,
              level,
              shown: SILENT_FOOT_DB,
              way: 0,
              turned: 0,
            }
            if (!running) string.shown = level
            state.strings.set(id, string)
          }
          string.held = true
          string.level = level
        }
      }
    }
    for (const [id, string] of state.strings) {
      // Its damper is down: what it had falls as the device has it fall.
      if (!string.held)
        string.level = Math.max(
          SILENT_FOOT_DB,
          string.level -
            silentFall(frame.value('ring'), frame.value('damper'), hzOfNote(string.note)) *
              frame.dt,
        )
      if (running) climb(string, now, frame.dt)
      else string.shown = string.level
      if (!string.held && silentShare(string.shown) < 0.01) state.strings.delete(id)
    }

    // --- The list ---
    const { cells, cell } = layout
    const foot = cells.y + cells.h
    for (let k = 0; k < SILENT_CHORDS; k++) {
      const box: Box = { x: cells.x + k * cell + 0.5, y: cells.y, w: cell - 1, h: cells.h }
      const inWalk = !walking || silentInWalk(k, frame.value('count'))
      if (k === chord) fillRect(ctx, box, colours.ink, 1)
      else if (inWalk) fillRect(ctx, box, colours.ink, INK.fill)
      text(frame, String(k + 1), silentCellX(k, layout), foot - 2, {
        align: 'center',
        colour: k === chord ? colours.plate : colours.ink,
        alpha: inWalk ? 1 : INK.text,
      })
    }
    // How far it is on its way to the next, where the chords come slowly enough to be followed.
    if (walking && every >= SHOWN_SEC && metered && chord === held) {
      const turn = clamp(frame.meter('turn'), 0, 1)
      const box: Box = { x: cells.x + chord * cell + 0.5, y: foot + 1, w: (cell - 1) * turn, h: 2 }
      fillRect(ctx, box, colours.accent, 1)
    }
    rule(ctx, cells.x, layout.track, cells.x + cells.w, layout.track, {
      colour: colours.ink,
      alpha: INK.rule,
    })

    // --- Its name ---
    if (keysShape(value, chord)) {
      const names = keys.map(silentNoteName).join(' ')
      text(frame, names === '' ? 'No key held' : names, layout.left, layout.base)
    } else {
      const root = silentNoteName(ROOT_FROM + whole(frame.value(`root${chord + 1}`)))
      const shapes = frame.spec(`shape${chord + 1}`)?.choices ?? []
      const spacings = frame.spec('spacing')?.choices ?? []
      text(
        frame,
        `${root} ${shapes[whole(frame.value(`shape${chord + 1}`))] ?? ''}`,
        layout.left,
        layout.base,
      )
      text(frame, spacings[whole(frame.value('spacing'))] ?? '', layout.right, layout.base, {
        align: 'right',
        alpha: INK.text,
      })
    }

    // --- The keyboard, and the strings over it ---
    const range = silentRange(value, layout.keys.w)
    const board = layout.keys
    const white = board.w / silentWhites(range)
    const black = Math.max(1, white * 0.6)
    const bar = clamp(white * 0.38, 1.2, WIDEST_BAR)
    const front = board.y + board.h
    const strings = [...state.strings.values()]
    /** How brightly a key is lit: a held one always shows, and the rest is how loudly its string rings. */
    const light = (note: number): number => {
      let much = keys.includes(note) ? 0.45 : 0
      for (const string of strings)
        if (string.note === note && silentShare(string.shown) > 0)
          much = Math.max(
            much,
            lerp(string.held && !string.bass ? 0.45 : 0.15, 1, silentShare(string.shown)),
          )
      return much
    }
    const edges: number[] = [board.x]
    for (let k = 1; k <= silentWhites(range); k++) edges.push(board.x + k * white)
    for (let note = range.low, k = 0; note <= range.high; note++) {
      if (isBlack(note)) continue
      const much = light(note)
      if (much > 0)
        fillRect(
          ctx,
          { x: edges[k] + 0.25, y: board.y, w: white - 0.5, h: board.h },
          colours.accent,
          much,
        )
      k++
    }
    for (const y of [board.y, front])
      rule(ctx, board.x, y, board.x + board.w, y, { colour: colours.ink, alpha: INK.back })
    for (const x of edges)
      rule(ctx, x, board.y, x, front, {
        colour: colours.ink,
        alpha: white > 3 ? INK.rule : INK.grid,
      })
    for (let note = range.low; note <= range.high; note++) {
      if (!isBlack(note)) continue
      const box: Box = {
        x: silentKeyX(note, range, board) - black / 2,
        y: board.y,
        w: black,
        h: board.h * 0.6,
      }
      fillRect(ctx, box, colours.ink, 1)
      const much = light(note)
      if (much > 0) fillRect(ctx, box, colours.accent, much)
    }
    const { strings: above } = layout
    for (const [notes, low] of [
      [keys, false],
      [bass, true],
    ] as const) {
      for (const note of notes) {
        const x = silentKeyX(note, range, board)
        rule(ctx, x, above.y, x, board.y, {
          colour: colours.ink,
          alpha: INK.text,
          ...(low ? { dash: [1, 3] as const } : {}),
        })
      }
    }
    for (const string of strings) {
      const tall = silentShare(string.shown) * above.h
      if (tall <= 0) continue
      const x = silentKeyX(string.note, range, board)
      fillRect(
        ctx,
        { x: x - bar / 2, y: board.y - tall, w: bar, h: tall },
        colours.accent,
        string.held ? 1 : INK.text,
      )
    }
    for (let note = range.low; note <= range.high; note += 12)
      if (range.high - range.low <= 48 || (note / 12) % 2 === 0)
        text(
          frame,
          silentNoteName(note),
          // Clear of the line around the display.
          clamp(silentKeyX(note, range, board), 9, frame.width - 9),
          layout.octaves,
          { align: 'center', alpha: INK.text },
        )

    for (const point of silentHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: silentHandles,
})

export const SILENT_KEYS_FACES: Readonly<Record<string, PlateFace>> = {
  // The chord, how long it rings, how hard it is driven and how much of it there is.
  'silent-keys': {
    display: silentKeysDisplay,
    face: ['chord', 'ring', 'lift', 'mix'],
    // Each root over its shape, four chords to a block, where a host spreads every knob on the plate.
    sections: [
      ['chord', 'every', 'count', 'spacing'],
      ['root1', 'root2', 'root3', 'root4', 'shape1', 'shape2', 'shape3', 'shape4'],
      ['root5', 'root6', 'root7', 'root8', 'shape5', 'shape6', 'shape7', 'shape8'],
      ['key1', 'key2', 'key3', 'key4', 'key5', 'key6'],
      ['partials', 'tilt', 'sharpness', 'ring', 'damper', 'bass'],
      ['lift', 'lowCut', 'tune', 'width', 'mix', 'output'],
    ],
  },
}
