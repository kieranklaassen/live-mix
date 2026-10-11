// The display of Falling: the pieces it catches, each on its way down (or up).
//
// Time runs to the right and pitch up and down. The upright line is now. A
// piece is a stroke that begins on the level line (the pitch it was caught
// at) at the moment it started and runs to the right along its own bend, as
// thick as its window is open: so a piece that sinks is a stroke running down
// to the right, and it sounds where it crosses the upright line. The strokes
// travel to the left as time passes. The stroke that begins on the upright
// line is the piece that would start now, with a ring at its end (down or up:
// Fall; across: Size) and one half way along (Curve).
//
// The scale's numbers stand in a column of their own at the left edge. A piece
// that has travelled that far is cut off at the column: it is where it was,
// only not drawn under the numbers.
//
// The pieces are the device's own: it reports each one it starts (when, how
// far it falls, how long it is, where in the caught sound it reads) and the
// level it is catching, and the display keeps them by the device's clock. A
// piece that reads nothing but silence is not drawn. While the device is
// asleep or has not run yet, the strokes are a worked example of the same
// settings, in the ink and without motion.

import { denormalizeParam } from '../../../core/params'
import {
  History,
  INK,
  clamp,
  clipped,
  dot,
  fillBetween,
  gainToDb,
  ground,
  handle,
  label,
  lerp,
  rule,
  trace,
  type Box,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

/** `falling.h`: the most pieces at once, how far Vary throws a piece, the quickest window, where the clock goes round. */
const MAX_OVERLAP = 16
const VARY_REACH = 1.5
const QUICK_SHARE = 0.04
const MIN_ATTACK_SEC = 0.003
const CLOCK_LAP_SEC = 64
/** The Fall knob's reach either way, in semitones. */
const FALL_REACH = 24

/** Under this nothing sounds, as for the plate that draws the display; a piece counts from a little over it. */
const QUIET = 1e-4
const HEARD = 4 * QUIET

/** Where now stands across the display, and the share of the room right of it a piece takes at the shortest Size and the longest. */
const NOW_AT = 0.3
const SIZE_LEAST = 0.25
const SIZE_MOST = 1
/**
 * How the pitch scale is drawn out: the end of a piece stands off the middle
 * by `fallingRise` of half the height, which grows fast for a small Fall and
 * evenly for a large one, so a sigh of a semitone is seen and two octaves
 * still fit, and no semitone is under a pixel.
 */
const RISE_EVEN = 0.6
const RISE_KNEE = 0.1
/** The steps the scale's lines may be apart, in semitones, and the least room between two of them. */
const LINE_STEPS = [1, 2, 3, 6, 12, 24] as const
const LINE_ROOM = 14
/** Room kept clear above and below the scale, and right of the longest piece, for a ring. */
const PAD = 5
/** Where a number of the scale begins, from the box's left edge, and the room its patch keeps past its last figure (`label`). */
const NUMBER_AT = 2
const NUMBER_PATCH = 2
/** A stroke: its points, its thickness where the window is shut and what an open window adds. */
const POINTS = 16
const HAIR = 0.5
const THICK = 2.4
/** Pieces the display follows, and the pieces of a worked example at the most. */
const KEPT = 64
const EXAMPLES = 40
/** The level caught, kept by the device's time: this far back, this fine. */
const LEVEL_SEC = 8
const LEVEL_SLOTS = 240
/** With no new reading for this long the device stands; a step of its clock longer than this is not a step but a new start. */
const STALLED_SEC = 0.15
const JUMP_SEC = 1
/** How far the time here may stand from the device's before it is put right. */
const SLACK_SEC = 0.05
/** Under this height a piece's bend is too flat to take the Curve from where the hand is: the hand's travel sets it. */
const CURVE_LEAST = 12
/** Under this many semitones the hand sets the Fall in tenths. */
const FINE_UNDER = 3

type Size = Pick<DisplayView, 'width' | 'height'>
type Spot = [number, number]
const spots = (count: number): Spot[] => Array.from({ length: count }, (): Spot => [0, 0])

/** How far along its bend a piece is at `phase` (0..1) of its life: `Falling::bend`. */
export function fallingBend(phase: number, curve: number): number {
  const amount = Math.abs(curve)
  const p = curve < 0 ? 1 - phase : phase
  const late = p + amount * (p * p * p * p - p)
  return curve < 0 ? 1 - late : late
}

/** The share of a piece its window rises over: `Falling::attack_share`. */
export function fallingAttack(shape: number, sizeSec: number): number {
  return clamp(Math.max(lerp(0.5, QUICK_SHARE, shape), MIN_ATTACK_SEC / sizeSec), 0, 0.5)
}

/** A piece's window at `phase` of its life: `Falling::window`, two raised-cosine halves that meet at the attack share. */
export function fallingWindow(phase: number, attack: number): number {
  if (phase <= 0 || phase >= 1) return 0
  if (phase < attack) return 0.5 - 0.5 * Math.cos((Math.PI * phase) / attack)
  return 0.5 + 0.5 * Math.cos((Math.PI * (phase - attack)) / (1 - attack))
}

/** Pieces a second after the overlap ceiling: `schedule()`. */
export function fallingRate(density: number, sizeMs: number): number {
  return Math.min(density, MAX_OVERLAP / (sizeMs * 0.001))
}

/** The fall of the piece Vary throws furthest: `spawn()`, with its draw at 1. */
export const fallingOther = (fall: number, vary: number): number =>
  fall * (1 - VARY_REACH * clamp(vary, 0, 1))

/**
 * How far a piece has dropped behind the sound it started on by `phase` of
 * its life, in seconds: it reads at 2^(fall / 12 × bend) of the speed the
 * sound is written at, so a sinking piece falls behind and a rising one
 * catches up.
 */
export function fallingLag(phase: number, fall: number, curve: number, length: number): number {
  const steps = 6
  let sum = 0
  for (let i = 0; i < steps; i++)
    sum += 1 - Math.pow(2, (fall / 12) * fallingBend((phase * (i + 0.5)) / steps, curve))
  return (length * phase * sum) / steps
}

export interface FallingLayout {
  box: Box
  /** Where now stands, and the room right of it for the longest piece. */
  now: number
  reach: number
  /** The middle of the pitch scale, and the height the pieces have to fall through. */
  mid: number
  room: number
}

export function fallingLayout(view: Size): FallingLayout {
  const box: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const now = box.x + Math.round(box.w * NOW_AT)
  return {
    box,
    now,
    reach: Math.max(8, box.x + box.w - now - PAD),
    mid: box.y + box.h / 2,
    room: Math.max(1, box.h - 2 * PAD),
  }
}

/** The share of half the height the end of a piece stands off the middle by, for a Fall of `share` of the knob's reach. */
export function fallingRise(share: number): number {
  const u = clamp(share, 0, 1)
  return RISE_EVEN * u + ((1 - RISE_EVEN) * (1 + RISE_KNEE) * u) / (u + RISE_KNEE)
}

/** The Fall, as a share of the knob's reach, whose piece ends `rise` of half the height off the middle. */
function fallOfRise(rise: number): number {
  let low = 0
  let high = 1
  for (let i = 0; i < 30; i++) {
    const middle = (low + high) / 2
    if (fallingRise(middle) < rise) low = middle
    else high = middle
  }
  return rise <= 0 ? 0 : rise >= 1 ? 1 : (low + high) / 2
}

/**
 * The share of Fall the level line stands off the middle by: the scale is
 * centred on what the pieces span, from the pitch they are caught at to where
 * the furthest of them lands, so a piece has the whole height to fall through.
 */
const centreShare = (vary: number): number => (vary <= 2 / 3 ? 0.5 : 1 - 0.75 * clamp(vary, 0, 1))

/** A semitone's height: what the pieces span (Fall, and Vary's throw the other way) is drawn `fallingRise` of the height tall. */
export function fallingPer(lay: FallingLayout, fall: number, vary: number): number {
  const most = Math.max(1, VARY_REACH * clamp(vary, 0, 1))
  const share = Math.abs(fall) / FALL_REACH
  // (for no Fall at all, the slope the rise starts with)
  const rise =
    share > 1e-6
      ? fallingRise(share) / share
      : RISE_EVEN + ((1 - RISE_EVEN) * (1 + RISE_KNEE)) / RISE_KNEE
  return (lay.room * rise) / (FALL_REACH * most)
}

/** Where a pitch stands, in semitones from the pitch a piece was caught at. */
export function fallingY(
  lay: FallingLayout,
  semitones: number,
  fall: number,
  vary: number,
): number {
  return lay.mid - (semitones - fall * centreShare(vary)) * fallingPer(lay, fall, vary)
}

/** A number of the scale as it is written, with a real minus: "0", "+3", "−12". */
const numberText = (semitones: number): string =>
  semitones === 0 ? '0' : `${semitones > 0 ? '+' : '−'}${Math.abs(semitones)}`

/**
 * The inner edge of the numbers' column: the right end of the patch under the
 * widest number the scale shows, which is the furthest it goes either way
 * (every size shows that line when Fall is at an end of its knob). It is
 * measured in the plate's own type, so the column is as wide as that number
 * and no wider, and it is the same at every setting: the pieces are not cut
 * at a different place when Fall is turned. A display too narrow to have any
 * room left of now gives all of it to the column, and never more.
 */
function fallingColumn(
  frame: Pick<DisplayFrame, 'ctx' | 'fontFamily'>,
  layout: FallingLayout,
): number {
  const { ctx } = frame
  ctx.font = `8px ${frame.fontFamily}`
  const widest = Math.max(
    ctx.measureText(numberText(-FALL_REACH)).width,
    ctx.measureText(numberText(FALL_REACH)).width,
  )
  return Math.min(layout.now, layout.box.x + NUMBER_AT + Math.ceil(widest) + NUMBER_PATCH)
}

/** How wide a piece is drawn: its share of the room right of now follows the Size knob. */
const wideOf = (lay: FallingLayout, at: number): number =>
  lay.reach * lerp(SIZE_LEAST, SIZE_MOST, clamp(at, 0, 1))

/** A number in 0..1 that is the same every time for the same piece and draw: the worked example's dice. */
function dice(index: number, draw: number): number {
  let h = Math.imul(index + 1, 374761393) ^ Math.imul(draw + 1, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

interface Piece {
  /** When it started, by the device's time as kept here; never, for an empty place. */
  born: number
  fall: number
  length: number
  /** How far behind the newest sound it started, in seconds. */
  behind: number
  /** The Curve and the window's attack share when it started: a piece keeps them. */
  curve: number
  attack: number
  /** The loudest it has read so far. */
  heard: number
}

interface FallingState {
  pieces: Piece[]
  next: number
  /** The device's count of pieces at the last reading; null before the first. */
  count: number | null
  /** The device's time, in seconds that only go forward here. */
  time: number
  /** Its clock at the last reading (null: asleep, or none yet), that reading's time here, and how long it has stood. */
  reading: number | null
  at: number
  stood: number
  /** Whether the clock has moved since it was first read: a device that stands is not running. */
  moving: boolean
  /** The level caught, by the device's time, and how many seconds of it are kept. */
  levels: History
  watched: number
  /** The points of the stroke being drawn, kept so a frame makes no new ones. */
  upper: Spot[]
  lower: Spot[]
  line: Spot[]
  far: Spot[]
}

const NEVER = -1e12

function forget(state: FallingState): void {
  for (const piece of state.pieces) piece.born = NEVER
  state.levels.clear()
  state.watched = 0
  state.count = null
}

/** Keep a piece the device says it started: `which` is "new" or "old", `ran` the clock of the same reading. */
function keep(
  frame: DisplayFrame<FallingState>,
  which: 'new' | 'old',
  ran: number,
  curve: number,
  shape: number,
): void {
  const { state } = frame
  const start = frame.meter(`${which}Start`)
  const length = frame.meter(`${which}Length`)
  const fall = frame.meter(`${which}Fall`)
  const behind = frame.meter(`${which}Behind`)
  if (!(start >= 0) || !(length > 0) || !Number.isFinite(fall) || !Number.isFinite(behind)) return
  let age = ran - start
  if (age < 0) age += CLOCK_LAP_SEC
  // One that ended before the display looked is not shown as starting now.
  if (!(age < length)) return
  const piece = state.pieces[state.next]
  state.next = (state.next + 1) % KEPT
  piece.born = state.at - age
  piece.fall = fall
  piece.length = length
  piece.behind = Math.max(0, behind)
  piece.curve = curve
  piece.attack = fallingAttack(shape, length)
  piece.heard = 0
}

/** Move the device's time on, and take in what the device reports. Whether it is running comes back. */
function follow(frame: DisplayFrame<FallingState>, curve: number, shape: number): boolean {
  const { state } = frame
  const ran = frame.powered && frame.hasMeter('clock') ? frame.meter('clock') : -1
  if (!(ran >= 0)) {
    // Asleep, switched off or not there: what it held is over.
    if (state.reading !== null) forget(state)
    state.reading = null
    state.moving = false
    return false
  }
  if (state.moving && state.stood < STALLED_SEC) {
    state.time += frame.dt
    state.watched = Math.min(LEVEL_SEC, state.watched + frame.dt)
  }
  if (state.reading === null) {
    state.reading = ran
    state.at = state.time
    state.stood = 0
  } else if (ran !== state.reading) {
    let step = ran - state.reading
    if (step < 0) step += CLOCK_LAP_SEC
    if (step > JUMP_SEC) {
      // The device woke anew, or the display was away: nothing kept is still true.
      forget(state)
      state.at = state.time
    } else {
      state.at += step
      state.time =
        Math.abs(state.time - state.at) > SLACK_SEC ? state.at : lerp(state.time, state.at, 0.3)
    }
    state.reading = ran
    state.stood = 0
    state.moving = true
  } else {
    state.stood += frame.dt
  }
  if (!state.moving) return false
  state.levels.push(state.time, Math.max(0, frame.meter('level')))
  const count = frame.meter('grains')
  if (state.count === null) {
    // The first look: the two newest, if they still sound.
    keep(frame, 'old', ran, curve, shape)
    keep(frame, 'new', ran, curve, shape)
  } else if (count !== state.count) {
    // The device tells of the last two it started.
    const started = (((count - state.count) % 16777216) + 16777216) % 16777216
    if (started >= 2) keep(frame, 'old', ran, curve, shape)
    keep(frame, 'new', ran, curve, shape)
  }
  state.count = count
  return true
}

/** The level that was caught `ago` seconds before now; what is older than the display has watched is taken as full. */
function caught(state: FallingState, ago: number): number {
  if (ago > state.watched) return 1
  const slot = Math.round((Math.max(0, ago) * LEVEL_SLOTS) / LEVEL_SEC)
  // (a slot either side, for a reading that came late)
  return Math.max(
    state.levels.at(Math.max(0, slot - 1)),
    state.levels.at(slot),
    state.levels.at(Math.min(LEVEL_SLOTS - 1, slot + 1)),
  )
}

interface Stroke {
  /** Where it begins across, how wide it is, the level line, and how far down its end lies (up, when negative). */
  x: number
  wide: number
  zero: number
  drop: number
  curve: number
  attack: number
}

/** How many points a stroke has: its ends, the steps between, and the peak of its window. */
const STROKE = POINTS + 2

/** Lay a stroke's two edges and its middle line into the state's own points. */
function lay(state: FallingState, stroke: Stroke): void {
  const { upper, lower, line } = state
  let n = 0
  const put = (q: number): void => {
    const x = stroke.x + q * stroke.wide
    const y = stroke.zero + stroke.drop * fallingBend(q, stroke.curve)
    const half = HAIR + THICK * fallingWindow(q, stroke.attack)
    upper[n][0] = lower[n][0] = line[n][0] = x
    upper[n][1] = y - half
    lower[n][1] = y + half
    line[n][1] = y
    n += 1
  }
  let peaked = false
  for (let i = 0; i <= POINTS; i++) {
    const q = i / POINTS
    // The window's peak is a point of its own, so a quick start is not cut off.
    if (!peaked && stroke.attack <= q) {
      put(stroke.attack)
      peaked = true
    }
    put(q)
  }
}

function fallingHandles(view: DisplayView): DisplayHandle[] {
  const layout = fallingLayout(view)
  const fall = view.value('fall')
  const vary = view.value('vary')
  const curve = view.value('curve')
  const size = view.value('size')
  const sizeSpec = view.spec('size')
  const fallSpec = view.spec('fall')
  const wide = wideOf(layout, view.at('size'))
  const zero = fallingY(layout, 0, fall, vary)
  const end = fallingY(layout, fall, fall, vary)
  const half = lerp(zero, end, fallingBend(0.5, curve))
  return [
    {
      key: 'fall',
      name: 'Fall and Size',
      x: layout.now + wide,
      y: end,
      // The end stands `fallingRise` of half the height off the middle, so the
      // Fall is the one whose piece ends under the hand: in whole semitones,
      // each within reach, and in tenths under three, where a pixel is far
      // less than one. On the row or the column it was taken at, the setting
      // is what it was: a hand that only goes across changes the Size alone.
      drag: (x, y, hold) => {
        const kept = hold ?? {}
        kept.fall ??= fall
        kept.size ??= size
        kept.x ??= layout.now + wide
        kept.y ??= end
        const at = ((x - layout.now) / layout.reach - SIZE_LEAST) / (SIZE_MOST - SIZE_LEAST)
        const off = (layout.mid - y) / (layout.room / 2)
        const found = (off < 0 ? -1 : 1) * FALL_REACH * fallOfRise(Math.abs(off))
        const whole =
          Math.abs(found) >= FINE_UNDER ? Math.round(found) : Math.round(found * 10) / 10
        return {
          fall:
            Math.abs(y - kept.y) < 0.5
              ? kept.fall
              : clamp(whole, fallSpec?.min ?? -FALL_REACH, fallSpec?.max ?? FALL_REACH) + 0,
          size:
            Math.abs(x - kept.x) < 0.5 || !sizeSpec ? kept.size : denormalizeParam(sizeSpec, at),
        }
      },
      // The wheel steps the Fall by a semitone.
      wheel: (steps) => ({
        fall:
          clamp(
            Math.round(fall) + steps,
            fallSpec?.min ?? -FALL_REACH,
            fallSpec?.max ?? FALL_REACH,
          ) + 0,
      }),
      reset: () => ({ fall: fallSpec?.default ?? -7, size: sizeSpec?.default ?? 700 }),
    },
    {
      key: 'curve',
      name: 'Curve',
      x: layout.now + wide / 2,
      y: half,
      // Half way through, a piece has bent by 0.5 - 0.4375 × Curve of its
      // fall: the Curve is the one whose stroke passes under the hand.
      drag: (_x, y, hold) => {
        const kept = hold ?? {}
        kept.curve ??= curve
        kept.y ??= half
        if (Math.abs(y - kept.y) < 0.5) return { curve: kept.curve }
        const drop = end - zero
        const share =
          Math.abs(drop) >= CURVE_LEAST
            ? (y - zero) / drop
            : fallingBend(0.5, kept.curve) + (y - kept.y) / (drop < 0 ? -CURVE_LEAST : CURVE_LEAST)
        return { curve: clamp((0.5 - share) / 0.4375, -1, 1) + 0 }
      },
      reset: () => ({ curve: view.spec('curve')?.default ?? 0.5 }),
    },
  ]
}

const falling = plateDisplay<FallingState>({
  place: 'window',
  columns: 2,
  params: ['fall', 'curve', 'size', 'density', 'vary', 'shape', 'mix'],
  live: { meters: true },
  info: 'Time runs to the right, pitch up and down. Each stroke is a piece on its way from the pitch it was caught at, on the level line, as thick as it is loud; its dot on the upright line is what sounds now. Drag the ring at the end for Fall and Size, the one half way for Curve.',
  init: () => ({
    pieces: Array.from({ length: KEPT }, (): Piece => ({
      born: NEVER,
      fall: 0,
      length: 1,
      behind: 0,
      curve: 0,
      attack: 0.5,
      heard: 0,
    })),
    next: 0,
    count: null,
    time: 0,
    reading: null,
    at: 0,
    stood: 0,
    moving: false,
    levels: new History(LEVEL_SEC, LEVEL_SLOTS, 0, 'max'),
    watched: 0,
    upper: spots(STROKE),
    lower: spots(STROKE),
    line: spots(STROKE),
    far: spots(STROKE),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const layout = fallingLayout(frame)
    const { box, now } = layout
    const fall = frame.value('fall')
    const curve = frame.value('curve')
    const vary = frame.value('vary')
    const shape = frame.value('shape')
    const sizeSec = Math.max(0.001, frame.value('size') / 1000)
    const wide = wideOf(layout, frame.at('size'))
    const pxPerSec = wide / sizeSec
    const yOf = (semitones: number): number => fallingY(layout, semitones, fall, vary)
    const zero = yOf(0)
    const foot = box.y + box.h
    // What has sounded is drawn from here to now: left of it are the numbers.
    const column = fallingColumn(frame, layout)

    // falling.h mixes by `kit::equal_power`: the pieces at the sine of Mix quarter turns.
    const wet = Math.sin((clamp(frame.value('mix'), 0, 1) * Math.PI) / 2)
    const heard = wet > QUIET
    // The device is followed whatever Mix is: what it did unheard is not drawn, and is not missed later.
    const running = follow(frame, curve, shape)
    const showing = running && heard

    // The scale: the pitch a piece is caught at, and lines so many semitones from it.
    const per = fallingPer(layout, fall, vary)
    const step = LINE_STEPS.find((semitones) => semitones * per >= LINE_ROOM) ?? FALL_REACH
    const lines: number[] = []
    for (let semitones = -FALL_REACH; semitones <= FALL_REACH; semitones += step) {
      const y = yOf(semitones)
      if (semitones === 0 || y < box.y + 1 || y > foot - 1) continue
      lines.push(semitones)
      rule(ctx, box.x, y, box.x + box.w, y, { colour: colours.ink, alpha: INK.grid })
    }
    rule(ctx, box.x, zero, box.x + box.w, zero, { colour: colours.ink, alpha: INK.rule })

    const stroke: Stroke = { x: now, wide, zero, drop: 0, curve, attack: 0.5 }
    const paint = (colour: string, alpha: number): void => {
      fillBetween(ctx, state.upper, state.lower, colour, alpha)
    }

    // The piece that would start now. Where Vary may throw it is a fan behind it.
    const attack = fallingAttack(shape, sizeSec)
    const other = fallingOther(fall, vary)
    if (heard && Math.abs(other - fall) * per >= 1) {
      stroke.drop = yOf(other) - zero
      lay(state, stroke)
      for (let i = 0; i < STROKE; i++) {
        state.far[i][0] = state.line[i][0]
        state.far[i][1] = state.line[i][1]
      }
      stroke.drop = yOf(fall) - zero
      lay(state, stroke)
      fillBetween(ctx, state.line, state.far, colours.ink, INK.grid)
    }
    stroke.drop = yOf(fall) - zero
    stroke.attack = attack
    lay(state, stroke)
    if (heard) paint(colours.ink, showing ? INK.fill : INK.back * 0.6)
    trace(ctx, state.line, {
      colour: colours.ink,
      width: 1,
      alpha: heard ? INK.text : INK.back,
      dash: heard ? undefined : [2, 2],
    })

    // The pieces: what has sounded left of now, what is still to come right of it and fainter.
    const pieces = (side: 0 | 1): void => {
      const share = side === 0 ? 1 : 0.5
      if (showing) {
        for (const piece of state.pieces) {
          const age = state.time - piece.born
          // (one whose end has reached the numbers' column is past the picture)
          if (!(age >= 0) || now + (piece.length - age) * pxPerSec < column) continue
          const phase = age / piece.length
          if (side === 0 && phase < 1) {
            const ago = piece.behind + fallingLag(phase, piece.fall, piece.curve, piece.length)
            piece.heard = Math.max(piece.heard, caught(state, ago))
          }
          if (!(piece.heard * wet > HEARD)) continue
          stroke.x = now - age * pxPerSec
          stroke.wide = piece.length * pxPerSec
          stroke.drop = yOf(piece.fall) - zero
          stroke.curve = piece.curve
          stroke.attack = piece.attack
          lay(state, stroke)
          // As strong as what it reads is loud.
          const loud = clamp(1 + gainToDb(piece.heard * wet) / 60, 0, 1)
          paint(colours.accent, share * (0.3 + 0.6 * loud))
          if (side === 0 && phase < 1) {
            const open = fallingWindow(phase, piece.attack)
            dot(
              ctx,
              now,
              zero + stroke.drop * fallingBend(phase, piece.curve),
              1.2 + 1.6 * open,
              colours.accent,
            )
          }
        }
        return
      }
      if (!heard) return
      // At rest, the pieces these settings make: one every 1 / rate seconds on
      // the average, each thrown as `spawn()` throws one, the newest a third
      // of the way through its life.
      const rate = fallingRate(frame.value('density'), sizeSec * 1000)
      const past = (now - column) / pxPerSec + sizeSec
      let age = Math.min((0.3 * (0.5 + dice(0, 1))) / rate, 0.35 * sizeSec)
      for (let i = 0; i < EXAMPLES && age < past; i++) {
        stroke.x = now - age * pxPerSec
        stroke.wide = wide
        stroke.drop = yOf(fall * (1 - VARY_REACH * vary * dice(i, 0))) - zero
        stroke.curve = curve
        stroke.attack = attack
        lay(state, stroke)
        paint(colours.ink, share * INK.back)
        const phase = age / sizeSec
        if (side === 0 && phase < 1) {
          const open = fallingWindow(phase, attack)
          dot(
            ctx,
            now,
            zero + stroke.drop * fallingBend(phase, curve),
            1.2 + 1.6 * open,
            colours.ink,
          )
        }
        age += (0.5 + dice(i + 1, 1)) / rate
      }
    }
    // What has sounded stops at the numbers' column and is not drawn under it.
    clipped(ctx, { x: column, y: box.y, w: now - column, h: box.h }, () => pieces(0))
    clipped(ctx, { x: now, y: box.y, w: box.x + box.w - now, h: box.h }, () => pieces(1))

    // Now: in the second ink while pieces are coming.
    rule(ctx, now, box.y, now, foot, {
      colour: showing ? colours.accent : colours.ink,
      alpha: showing ? 1 : INK.back,
    })

    // The scale's numbers, in semitones from the pitch a piece is caught at:
    // one for every line drawn. A line at an edge has its number as near as
    // the box lets it stand, at most four pixels off; lines are `LINE_ROOM`
    // apart, so no two numbers meet. They stand in their column (`fallingColumn`),
    // on a patch that keeps the scale's own lines off the figures.
    for (const semitones of [0, ...lines]) {
      const y = yOf(semitones)
      label(frame, numberText(semitones), box.x + NUMBER_AT, clamp(y + 3, box.y + 8, foot - 2))
    }

    for (const point of fallingHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key, radius: 3 })
    }
  },
  handles: fallingHandles,
})

export const FALLING_FACES: Readonly<Record<string, PlateFace>> = {
  falling: {
    display: falling,
    face: ['fall', 'size', 'density', 'mix'],
  },
}
