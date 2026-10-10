// The display of Bowls: the table as the player has it. Each bowl is a ring at
// its place between the sides; the bowls lie in rows by pitch, the lowest in
// the nearest row and the largest. A bowl is as far out of round as it beats,
// is lit as loud as it rings now, and turns with its beat. Across the top is
// how long a bowl rings, on a scale of seconds, with the fall of the ring over
// that time; up the left is Register, on a scale of octaves.
//
// Everything is the device's own: the notes, the slots and their places and
// beat rates are worked out as `bowls.h` works them out, and what rings and
// where each bowl is in its beat come from the device's readings. The picture
// is the table as it stands: a bowl that a retune has taken off it rings out
// unseen (the readings are of the bowls that stand).

import { INK, clamp, ground, handle, lerp, rule, text, trace, type Box } from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

// --- The table, as bowls.h lays it -------------------------------------------

/** `kMaxBowls`: the slots of the table. */
export const BOWL_SLOTS = 12
/** `kScaleNotes`: the scales as semitones above the root, in the order of the Scale control. */
export const BOWL_SCALES: readonly (readonly number[])[] = [
  [0, 2, 4, 7, 9],
  [0, 3, 5, 7, 10],
  [0, 2, 4, 5, 7, 9, 11],
  [0, 2, 3, 5, 7, 8, 10],
  [0, 2, 7],
  [0, 2, 4, 6, 8, 10],
  [0, 2, 3, 7, 8],
  [0, 1, 3, 7, 8],
]
/** `kLowNote` and `kRegisterSpan`: Register's note runs from C2 up three octaves. */
export const REGISTER_LOW = 36
export const REGISTER_SPAN = 36
/** `kBeatHz` and `kBeatSpread`: the lowest pair is this many Hz apart at Beat 1, times the slot's factor. */
export const BEAT_HZ = 5
export const BEAT_SPREAD = 0.3

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const SCALE_WORDS = [
  'major 5',
  'minor 5',
  'major',
  'minor',
  'fifths',
  'whole',
  'hirajoshi',
  'pelog',
]

/** A note as it is written: 60 is "C4". */
export const bowlName = (note: number): string =>
  `${NOTE_NAMES[((note % 12) + 12) % 12]}${Math.floor(note / 12) - 1}`

/** `note_of_step()`: step 0 of a scale is its root in octave 1. */
export function noteOfStep(scale: number, root: number, step: number): number {
  const notes = BOWL_SCALES[scale]
  return 24 + root + 12 * Math.floor(step / notes.length) + notes[step % notes.length]
}

/** `first_step()`: the first step at or above Register's note, in single precision as the device has it. */
export function firstStep(scale: number, root: number, register: number): number {
  const base = Math.fround(REGISTER_LOW + Math.fround(REGISTER_SPAN * Math.fround(register)))
  let step = 0
  while (noteOfStep(scale, root, step) < Math.fround(base - 0.5)) step += 1
  return step
}

/** `slot_place()`: where a slot sits between the sides at Spread 1, -1 (left) to 1. */
export const slotPlace = (slot: number): number => (((slot * 5) % BOWL_SLOTS) - 5.5) / 5.5

/** `slot_beat()`: a slot's share of the beat rate. */
export function slotBeat(slot: number): number {
  const t = slot * 0.618034
  return 1 - BEAT_SPREAD + 2 * BEAT_SPREAD * (t - Math.floor(t))
}

/** `tune()`: how many Hz apart the two modes of a slot's lowest pair are. */
export const beatHz = (beat: number, slot: number): number => BEAT_HZ * beat * beat * slotBeat(slot)

export interface Bowl {
  slot: number
  note: number
}

/** `retarget()`: the bowls on the table, lowest first, each in the slot of its step of the scale. */
export function bowlsTable(root: number, scale: number, count: number, register: number): Bowl[] {
  const first = firstStep(scale, root, register)
  const bowls: Bowl[] = []
  for (let step = first; step < first + count; step += 1)
    bowls.push({ slot: step % BOWL_SLOTS, note: noteOfStep(scale, root, step) })
  return bowls
}

function tableOf(view: DisplayView): Bowl[] {
  return bowlsTable(
    clamp(Math.round(view.value('root')), 0, 11),
    clamp(Math.round(view.value('scale')), 0, BOWL_SCALES.length - 1),
    clamp(Math.floor(Math.fround(Math.fround(view.value('bowls')) + 0.5)), 3, BOWL_SLOTS),
    clamp(view.value('register'), 0, 1),
  )
}

// --- Where things lie ---------------------------------------------------------

/** The notes a bowl's size is read over: C2 the largest, C7 and over the smallest. */
const SIZE_LOW = REGISTER_LOW
const SIZE_HIGH = 96
/** The ends of the Ring scale, seconds (the control's own). */
const RING_MIN = 0.5
const RING_MAX = 40
/** A bowl is lit from this reading up, and full at `LIT_TOP` (dB above -63 dBFS of what is heard). */
const LIT_FOOT = 9
const LIT_TOP = 51
/** How far out of round the fastest bowl is drawn: its two radii differ by twice this share. */
const SQUASH = 0.3

/**
 * How far out of round a bowl is drawn: by the root of its beat rate, so it
 * goes evenly with the Beat control (the rate goes by its square), up to
 * `SQUASH` for the fastest bowl there can be.
 */
export const bowlSquash = (hz: number): number =>
  SQUASH * Math.sqrt(clamp(hz / (BEAT_HZ * (1 + BEAT_SPREAD)), 0, 1))

export interface BowlsLayout {
  /** The table: the bowls lie in rows on it, the lowest note in the nearest row, at its foot. */
  field: Box
  /** The Ring scale: its line, from RING_MIN at `x` to RING_MAX at `x + w`, at height `y`. */
  ring: { x: number; y: number; w: number }
  /** Register's scale, upright at the left: C2 at `foot`, C5 at `head`. */
  gauge: { x: number; foot: number; head: number }
  /** The radius of the largest and of the smallest bowl. */
  big: number
  small: number
  /** The baseline of the words under the table. */
  words: number
}

export function bowlsLayout(view: Pick<DisplayView, 'width' | 'height'>): BowlsLayout {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const top = Math.min(12, Math.max(9, all.h * 0.2))
  const under = all.h >= 60 ? 10 : 0
  const field: Box = { x: all.x, y: all.y + top, w: all.w, h: Math.max(8, all.h - top - under) }
  const key = Math.min(34, all.w * 0.3)
  return {
    field,
    ring: { x: all.x + key, y: all.y + top - 3.5, w: Math.max(20, all.w - key - 5) },
    gauge: { x: all.x + 4.5, foot: field.y + field.h - 4, head: field.y + 4 },
    big: clamp(field.h * 0.15, 3.5, 11),
    small: 3.5,
    words: all.y + all.h - 1,
  }
}

/** A bowl's radius: the lower its note the larger, evenly by the note. */
export const bowlRadius = (note: number, at: BowlsLayout): number =>
  lerp(at.big, at.small, clamp((note - SIZE_LOW) / (SIZE_HIGH - SIZE_LOW), 0, 1))

/** The height of a row of the table: row 0 (the lowest bowl) nearest, at the foot; twelve rows in all. */
export function yOfRow(row: number, at: BowlsLayout): number {
  const reach = 1 + SQUASH
  const foot = at.field.y + at.field.h - at.big * reach - 1
  const head = at.field.y + at.small * reach + 1
  return lerp(foot, head, row / (BOWL_SLOTS - 1))
}

/** Where a slot lies across the table at this Spread. */
export function xOfSlot(slot: number, spread: number, at: BowlsLayout): number {
  const left = at.gauge.x + 5
  const right = at.field.x + at.field.w - 1
  const half = Math.max(0, (right - left) / 2 - at.big * (1 + SQUASH))
  return (left + right) / 2 + slotPlace(slot) * clamp(spread, 0, 1) * half
}

/** Where Register lies on its scale, and the Register that lies at a height. */
export const yOfRegister = (register: number, at: BowlsLayout): number =>
  lerp(at.gauge.foot, at.gauge.head, clamp(register, 0, 1))

export const registerOfY = (y: number, at: BowlsLayout): number =>
  clamp((at.gauge.foot - y) / (at.gauge.foot - at.gauge.head), 0, 1)

export const xOfRing = (seconds: number, at: BowlsLayout): number =>
  at.ring.x +
  (Math.log(clamp(seconds, RING_MIN, RING_MAX) / RING_MIN) / Math.log(RING_MAX / RING_MIN)) *
    at.ring.w

export const ringOfX = (x: number, at: BowlsLayout): number =>
  RING_MIN * Math.pow(RING_MAX / RING_MIN, clamp((x - at.ring.x) / at.ring.w, 0, 1))

/**
 * How much of its ring a bowl still has `seconds` after the touch, 1 down to 0: the lowest pair of
 * `bowls.h` falls 60 dB in Ring seconds, evenly in dB, and this is the share of those 60 dB left.
 */
export const ringLeft = (seconds: number, ring: number): number =>
  clamp(1 - seconds / Math.max(ring, 1e-6), 0, 1)

/** The fall is drawn this many pixels high where the whole ring is left, through this many points. */
export const FALL_HEIGHT = 7
const FALL_POINTS = 24

// --- What the device reports ---------------------------------------------------

/** One slot's digit of a reading: four slots to a reading, six bits each, lowest slot first. */
function digit(frame: DisplayFrame, family: 'levels' | 'beats', slot: number): number {
  const key = `${family}${Math.floor(slot / 4) + 1}`
  if (!frame.hasMeter(key)) return 0
  const packed = clamp(Math.floor(frame.meter(key)), 0, 16777215)
  return Math.floor(packed / Math.pow(64, slot % 4)) % 64
}

/**
 * How strongly a bowl is lit, 0..1: its reading (dB above -63 dBFS) as it is
 * heard, which is times the wet gain of `kit::equal_power` of Mix, so at Mix 0
 * no bowl is lit however it rings inside.
 */
export function bowlGlow(reading: number, mix: number): number {
  if (reading <= 0 || mix <= 0) return 0
  const heard = reading + 20 * Math.log10(Math.sin((clamp(mix, 0, 1) * Math.PI) / 2))
  return clamp((heard - LIT_FOOT) / (LIT_TOP - LIT_FOOT), 0, 1)
}

/** The angle a bowl is turned to by its beat reading (64ths of a turn between its two modes): half of it. */
export const bowlTurn = (reading: number): number => (Math.PI * reading) / 64

/** A time as it is said: "500 ms", "6.0 s", "25 s". */
function secondsText(seconds: number): string {
  if (seconds < 0.995) return `${Math.round(seconds * 100) * 10} ms`
  if (seconds < 9.95) return `${seconds.toFixed(1)} s`
  return `${Math.round(seconds)} s`
}

// --- The display ----------------------------------------------------------------

type Paint = Pick<DisplayFrame, 'ctx' | 'colours'>

/** One bowl: a ring out of round by `squash`, turned by `turn`, filled in the accent as far as it is lit. */
function ring(
  frame: Paint,
  x: number,
  y: number,
  radius: number,
  squash: number,
  turn: number,
  glow: number,
): void {
  const { ctx, colours } = frame
  ctx.beginPath()
  ctx.ellipse(x, y, radius * (1 + squash), radius * (1 - squash), turn, 0, Math.PI * 2)
  if (glow > 0) {
    ctx.globalAlpha = 0.15 + 0.75 * glow
    ctx.fillStyle = colours.accent
    ctx.fill()
  }
  ctx.globalAlpha = glow > 0 ? INK.trace : INK.back
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.setLineDash([])
  ctx.stroke()
  ctx.globalAlpha = 1
}

const bowlsDisplay = plateDisplay({
  place: 'window',
  columns: 2,
  params: ['root', 'scale', 'bowls', 'register', 'ring', 'beat', 'spread'],
  live: { meters: true, signal: true, settle: 40 },
  info: "The table from the player's seat: each bowl a ring at its place between the sides, the lowest nearest and largest, lit as it rings and turning with its beat. Drag the point at the left to set Register, the one at the top to set Ring.",
  draw(frame) {
    const { ctx, colours } = frame
    ground(frame)
    const at = bowlsLayout(frame)
    const table = tableOf(frame)
    const spread = frame.value('spread')
    const beat = clamp(frame.value('beat'), 0, 1)
    const mix = frame.value('mix')
    const live = frame.powered && frame.signal !== null

    // The top: how long a bowl rings, said and on a scale of seconds.
    text(frame, secondsText(frame.value('ring')), at.field.x + 1, at.ring.y + 2.5)
    const ringX = xOfRing(frame.value('ring'), at)
    rule(ctx, at.ring.x, at.ring.y, at.ring.x + at.ring.w, at.ring.y, {
      colour: colours.ink,
      alpha: INK.rule,
    })
    for (const seconds of [1, 2, 5, 10, 20]) {
      const x = xOfRing(seconds, at)
      const tall = seconds === 1 || seconds === 10
      rule(ctx, x, at.ring.y - (tall ? 4 : 2), x, at.ring.y, {
        colour: colours.ink,
        alpha: tall ? INK.text : INK.back,
      })
    }
    // The ring falling away after the touch, as the device lets it: 60 dB by Ring, the height of the
    // line the dB it still has. (On a scale of seconds that is even by ratio it holds, then drops.)
    const fall: [number, number][] = []
    for (let k = 0; k <= FALL_POINTS; k += 1) {
      const x = lerp(at.ring.x, ringX, k / FALL_POINTS)
      fall.push([x, at.ring.y - FALL_HEIGHT * ringLeft(ringOfX(x, at), frame.value('ring'))])
    }
    fall[FALL_POINTS] = [ringX, at.ring.y]
    trace(ctx, fall, { colour: colours.ink, width: 1.5 })

    // Register's scale: C2 at its foot, a mark at each C up to C5.
    rule(ctx, at.gauge.x, at.gauge.head, at.gauge.x, at.gauge.foot, {
      colour: colours.ink,
      alpha: INK.rule,
    })
    for (let octave = 0; octave <= REGISTER_SPAN / 12; octave += 1) {
      const y = yOfRegister((12 * octave) / REGISTER_SPAN, at)
      rule(ctx, at.gauge.x, y, at.gauge.x + 3, y, { colour: colours.ink, alpha: INK.back })
    }

    // The bowls, the nearest first so the further lie over them.
    let ringing = false
    table.forEach((bowl, row) => {
      const glow = live ? bowlGlow(digit(frame, 'levels', bowl.slot), mix) : 0
      if (glow > 0) ringing = true
      ring(
        frame,
        xOfSlot(bowl.slot, spread, at),
        yOfRow(row, at),
        bowlRadius(bowl.note, at),
        bowlSquash(beatHz(beat, bowl.slot)),
        live && glow > 0 ? bowlTurn(digit(frame, 'beats', bowl.slot)) : 0,
        glow,
      )
    })

    // While nothing rings, the note each bowl is tuned to, small, in its ring: the nearest first, and
    // only those that stand clear of the names already written.
    if (!ringing) {
      const taken: Box[] = []
      table.forEach((bowl, row) => {
        const words = bowlName(bowl.note)
        ctx.font = `8px ${frame.fontFamily}`
        const wide = Math.ceil(ctx.measureText(words).width)
        const x = xOfSlot(bowl.slot, spread, at)
        const y = yOfRow(row, at)
        const patch: Box = { x: x - wide / 2 - 1, y: y - 4, w: wide + 2, h: 8 }
        const clear = taken.every(
          (other) =>
            patch.x >= other.x + other.w ||
            other.x >= patch.x + patch.w ||
            patch.y >= other.y + other.h ||
            other.y >= patch.y + patch.h,
        )
        if (!clear) return
        taken.push(patch)
        text(frame, words, x, y + 3, { align: 'center' })
      })
    }

    // Under the table: its key, and the notes it runs from and to.
    if (at.words > at.field.y + at.field.h + 6) {
      const root = clamp(Math.round(frame.value('root')), 0, 11)
      const scale = clamp(Math.round(frame.value('scale')), 0, SCALE_WORDS.length - 1)
      text(frame, `${NOTE_NAMES[root]} ${SCALE_WORDS[scale]}`, at.field.x + 1, at.words)
      const span = `${bowlName(table[0].note)} to ${bowlName(table[table.length - 1].note)}`
      text(frame, span, at.field.x + at.field.w - 1, at.words, { align: 'right' })
    }
    for (const point of bowlsHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: bowlsHandles,
})

function bowlsHandles(view: DisplayView): DisplayHandle[] {
  const at = bowlsLayout(view)
  return [
    {
      key: 'register',
      name: 'Register',
      x: at.gauge.x,
      y: yOfRegister(view.value('register'), at),
      drag: (_x, toY) => ({ register: registerOfY(toY, at) }),
      reset: () => ({ register: view.spec('register')?.default ?? 0.5 }),
    },
    {
      key: 'ring',
      name: 'Ring',
      x: xOfRing(view.value('ring'), at),
      y: at.ring.y,
      drag: (toX) => ({ ring: ringOfX(toX, at) }),
      reset: () => ({ ring: view.spec('ring')?.default ?? 10 }),
    },
  ]
}

export const BOWLS_FACES: Readonly<Record<string, PlateFace>> = {
  bowls: { display: bowlsDisplay, face: ['root', 'ring', 'strike', 'mix'] },
}
