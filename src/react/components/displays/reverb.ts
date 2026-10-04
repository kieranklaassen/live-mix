// Displays of the reverbs that are rooms, plates and springs: how the tail
// dies away, and how long it takes.
//
// Five of them (plate, FDN, hall, Ether, spring) are windows in two parts, as
// the displays of the tails are. Above, the first moments after a sound goes
// in, on a short scale of their own: the dry sound, the gap of the pre-delay
// and the first reflections at their real times and levels, with 0 dB the
// sound going in. Below, the tail alone on a fixed scale of seconds: it
// starts at the top when the reverb first sounds and falls 60 dB to the
// foot, so the line is as long along the scale as the time written beside
// it, and a longer decay is a longer line.
// A second, darker wedge inside it is the top of the spectrum, which dies
// sooner. The shaped reverb and the convolver are strips with one picture.
//
// Every time and rate is worked out from the device's own loops and gains;
// the functions that do it are named after the code they were ported from,
// and where a loop does not fall as its length and its losses alone say, the
// reason is given with the figure that was measured on the device.
//
// The second colour is what happens now. At the left edge stands the level
// that comes out against the sound that went in. When that sound stops, what
// comes out is followed down the tail from that moment on, so a note is seen
// to ring away along the slope and a held chord shows nothing false while it
// lasts.

import { REVERB_DECAY_SECONDS } from '../../../core/devices/native/ConvolverReverb'
import { denormalizeParam } from '../../../core/params'
import {
  FLOOR_DB,
  History,
  INK,
  clamp,
  clipped,
  dbGrid,
  dbOfY,
  dot,
  fillRect,
  fillTo,
  gainToDb,
  ground,
  handle,
  lerp,
  rule,
  text,
  trace,
  yOfDb,
  type Box,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayView,
  type PlateDisplay,
  type PlateFace,
} from '../plate-display'

// --- What the family shares ---------------------------------------------------

/** The levels a reverb display spans: 0 dB at the top, 60 dB under it at the foot. */
const TOP_DB = 0
const FOOT_DB = -60
/** Where the two lines of a tail are worked out: the body of a sound, and the top of its spectrum. */
export const BODY_HZ = 500
export const TOP_HZ = 8000
/** The lowest a reverb's start is drawn: on the foot, where a reverb mixed out altogether stands, with nothing of it to see. */
const LOWEST_WET_DB = FOOT_DB
/** The height of a row of the words of a scale. */
const SCALE_HEIGHT = 8
/** Under this nothing goes in: quieter is the noise of what feeds the device, not a sound. */
const QUIET_DB = -72
/** A tail is followed down to here, far under where a quiet sound starts. */
const GONE_DB = -100
/** How far under the loudest lately a sound still counts as going in, in dB. */
const NEAR_DB = 4
/** How far under it a sound is still at its loudest, in dB. */
const LOUD_DB = 1.5
/** Seconds after a sound stops before what comes out is the reverb alone: the taps' window of 43 ms, and a frame. */
const SETTLE_SEC = 0.07
/** How often the level coming out is kept: once a frame. */
const SLOTS_PER_SEC = 30
/** The width of the level at the left edge. */
const METER_WIDTH = 3

const TWO_PI = Math.PI * 2

/**
 * What a one-pole low-pass `y = (1 − a)·x + a·y1` does to a frequency, in dB:
 * the damping filter of every loop here (`OnePoleLowpass` in `dsp_util.h`,
 * `kit::OnePole::lowpass`, the comb of `freeverb.h`).
 */
export function onePoleLossDb(a: number, hz: number, rate: number): number {
  const w = (TWO_PI * hz) / rate
  const power = ((1 - a) * (1 - a)) / (1 + a * a - 2 * a * Math.cos(w))
  return power > 1e-12 ? 10 * Math.log10(power) : FLOOR_DB
}

/**
 * How long a loop takes to fall 60 dB: `seconds` once round it, `gainDb`
 * (under 0) each time round. A loop that loses nothing never falls.
 */
export function loopRt60(seconds: number, gainDb: number): number {
  return gainDb < 0 ? (-60 * seconds) / gainDb : Infinity
}

/**
 * How long parts that each fall at their own rate take to fall 60 dB when
 * they are heard together, against the mean of them: `times` are their own
 * times, and each has as much to give as `shares` says (all alike when left
 * out). The slow parts are what is left at the end, so the whole takes
 * longer than the mean part does.
 */
export function fallTogether(times: readonly number[], shares?: readonly number[]): number {
  let mean = 0
  let whole = 0
  for (let i = 0; i < times.length; i++) {
    mean += times[i] / times.length
    whole += shares ? shares[i] : 1
  }
  let low = 0
  let high = 8 * mean
  for (let n = 0; n < 48; n++) {
    const middle = (low + high) / 2
    let left = 0
    for (let i = 0; i < times.length; i++) {
      left += (shares ? shares[i] : 1) * Math.pow(10, (-6 * middle) / times[i])
    }
    if (left / whole > 1e-6) low = middle
    else high = middle
  }
  return (low + high) / 2 / mean
}

/** The setting of a parameter at which `position` (which only rises or only falls with it) reaches `target`. */
function solveParam(
  view: DisplayView,
  name: string,
  position: (value: number) => number,
  target: number,
): number {
  const spec = view.spec(name)
  if (!spec) return view.value(name)
  const rising = position(spec.max) >= position(spec.min)
  let low = 0
  let high = 1
  for (let i = 0; i < 26; i++) {
    const middle = (low + high) / 2
    if (position(denormalizeParam(spec, middle)) < target === rising) low = middle
    else high = middle
  }
  // At either end of its range the parameter is at that end, not a hair inside it.
  const found = (low + high) / 2
  return found < 1e-6 ? spec.min : found > 1 - 1e-6 ? spec.max : denormalizeParam(spec, found)
}

/** The same view with one parameter somewhere else: where a handle would stand at another setting. */
function withParam(view: DisplayView, name: string, value: number): DisplayView {
  return {
    width: view.width,
    height: view.height,
    spec: (param) => view.spec(param),
    value: (param) => (param === name ? value : view.value(param)),
    at: (param) => {
      if (param !== name) return view.at(param)
      const spec = view.spec(param)
      if (!spec) return 0
      const position =
        spec.taper === 'log' && spec.min > 0
          ? Math.log(clamp(value, spec.min, spec.max) / spec.min) / Math.log(spec.max / spec.min)
          : (clamp(value, spec.min, spec.max) - spec.min) / (spec.max - spec.min)
      return Number.isFinite(position) ? position : 0
    },
  }
}

/**
 * The rate the last frame was drawn at. A handle is laid out from a view,
 * which does not say the rate the device runs at, and several of these loops
 * are counted in samples; the devices of a page share one rate, so the one
 * last drawn at is the handle's too, and a handle stands where it is drawn
 * at 44.1 kHz and at 96 kHz as it does at 48.
 */
let drawnRate = 48000

const rateOf = (view: DisplayView): number =>
  (view as Partial<DisplayFrame>).sampleRate ?? drawnRate

const defaultOf = (view: DisplayView, name: string): number =>
  view.spec(name)?.default ?? view.value(name)

const yOf = (db: number, box: Box): number =>
  yOfDb(clamp(db, FOOT_DB, TOP_DB), box, TOP_DB, FOOT_DB)

/**
 * Whether the size, the rate or a setting moved since the frame before;
 * `seen` keeps them. What a picture is laid out from is worked out again
 * only then, and not on every frame.
 */
function moved(
  view: DisplayView,
  rate: number,
  names: readonly string[],
  seen: Float64Array,
): boolean {
  let any = false
  for (let i = 0; i < names.length + 3; i++) {
    const value =
      i === 0 ? view.width : i === 1 ? view.height : i === 2 ? rate : view.value(names[i - 3])
    if (seen[i] !== value) {
      seen[i] = value
      any = true
    }
  }
  return any
}

const unseen = (names: readonly string[]): Float64Array =>
  new Float64Array(names.length + 3).fill(NaN)

/**
 * Seconds as they are said on a scale: "0.2s", "1s", "20s". Past 99 s no
 * figure is given: a loop that loses a hundredth of a dB a trip falls as
 * slowly as the least thing left out of the sum lets it.
 */
export function secondsText(seconds: number): string {
  if (!Number.isFinite(seconds)) return '∞'
  if (seconds > 99.5) return '>99s'
  if (seconds < 0.005) return '0s'
  const shown =
    seconds >= 9.95
      ? seconds.toFixed(0)
      : seconds >= 0.995
        ? seconds.toFixed(1).replace(/\.0$/, '')
        : seconds.toFixed(2).replace(/0$/, '')
  return `${shown}s`
}

/** The step of a scale of seconds `seconds` long over `width` pixels: 1, 2 or 5 of a power of ten, no two nearer than `apart`. */
function scaleStep(seconds: number, width: number, apart: number): number {
  const least = (seconds * apart) / Math.max(1, width)
  const decade = Math.pow(10, Math.floor(Math.log10(least)))
  for (const m of [1, 2, 5, 10]) if (m * decade >= least) return m * decade
  return 10 * decade
}

/**
 * A scale of seconds under a box that spans `seconds` from `box.x`: a line up
 * the box at every step, and the time in words under each when `each` says
 * so, or only the box's whole length at its right end.
 */
function timeScale(
  frame: DisplayFrame,
  box: Box,
  seconds: number,
  wordsY: number,
  each: boolean,
): void {
  const { ctx, colours } = frame
  if (!(seconds > 0) || !Number.isFinite(seconds)) return
  const step = scaleStep(seconds, box.w, each ? 24 : 30)
  for (let n = 1; n * step < seconds * 0.999; n++) {
    const x = box.x + ((n * step) / seconds) * box.w
    rule(ctx, x, box.y, x, box.y + box.h, { colour: colours.ink, alpha: INK.grid })
    if (each && x < box.x + box.w - 9) {
      text(frame, secondsText(n * step), x, wordsY, { align: 'center', alpha: INK.back })
    }
  }
  if (!each) {
    text(frame, secondsText(seconds), box.x + box.w, wordsY, { align: 'right', alpha: INK.back })
  }
}

/** The most columns marks can stand in. */
const MOST_COLUMNS = 512

/**
 * Upright marks: reflections at their times, from the foot up to their
 * levels. They stand two pixels apart at the nearest, and where several fall
 * in one column the loudest is kept, so echoes too dense to tell apart read
 * as an even hatch and not as a block, and a thousand of them cost no more
 * to draw than the columns they fall in.
 */
class Marks {
  /** The level in each column, dB against the level the reverb starts at; none where nothing falls. */
  readonly db = new Float32Array(MOST_COLUMNS)
  columns = 0
  private seconds = 1
  private width = 1

  /** Start again, for a box `width` wide that spans `seconds`. */
  clear(width: number, seconds: number): void {
    this.columns = clamp(Math.floor(width / 2) + 1, 0, MOST_COLUMNS)
    this.db.fill(-Infinity, 0, this.columns)
    this.seconds = seconds
    this.width = width
  }

  /** `seconds` after the sound went in, `db` against the level the reverb starts at. */
  add(seconds: number, db: number): void {
    if (!(seconds >= 0) || seconds > this.seconds || Number.isNaN(db)) return
    const column = Math.round(((seconds / this.seconds) * this.width) / 2)
    if (column < this.columns && db > this.db[column]) this.db[column] = db
  }
}

/** Every mark as one path and one stroke; the closer they stand the lighter they are drawn. */
function strokeMarks(
  frame: DisplayFrame,
  marks: Marks,
  box: Box,
  levelDb: number,
  alpha: number,
): void {
  const { ctx } = frame
  const foot = box.y + box.h
  let first = marks.columns
  let last = -1
  let taken = 0
  ctx.beginPath()
  for (let column = 0; column < marks.columns; column++) {
    const db = marks.db[column]
    if (db === -Infinity) continue
    const y = yOf(levelDb + db, box)
    if (y >= foot - 0.5) continue
    const x = Math.floor(box.x) + 2 * column + 0.5
    ctx.moveTo(x, foot)
    ctx.lineTo(x, y)
    taken += 1
    if (column < first) first = column
    last = column
  }
  if (taken === 0) return
  const crowded = taken / (last - first + 1)
  ctx.globalAlpha = alpha * lerp(1, 0.6, clamp((crowded - 0.25) / 0.5, 0, 1))
  ctx.strokeStyle = frame.colours.ink
  ctx.lineWidth = 1
  ctx.lineCap = 'butt'
  ctx.setLineDash([])
  ctx.stroke()
  ctx.globalAlpha = 1
}

/**
 * A decay as a straight line across a box that spans `seconds`: from `level`
 * at `from` seconds, falling 60 dB in `rt60`, as far as the foot or the
 * box's right edge. A tail that is held runs level.
 */
function decayLine(box: Box, seconds: number, from: number, level: number, rt60: number): Point[] {
  const x0 = box.x + (from / seconds) * box.w
  const right = box.x + box.w
  const foot = box.y + box.h
  const y0 = yOf(level, box)
  if (x0 >= right) return []
  if (!Number.isFinite(rt60)) {
    return [
      [x0, y0],
      [right, y0],
    ]
  }
  const reach = from + (rt60 * (level - FOOT_DB)) / 60
  if (reach <= seconds) {
    return [
      [x0, y0],
      [box.x + (reach / seconds) * box.w, foot],
    ]
  }
  return [
    [x0, y0],
    [right, yOf(level - (60 * (seconds - from)) / rt60, box)],
  ]
}

/**
 * Where a fall of 60 dB in `rt60`, begun at the top `from` seconds in, is
 * `db` down: on the line at that level, or where the line leaves the box at
 * its right edge when that comes sooner. A handle stands there.
 */
export function fallPoint(
  box: Box,
  seconds: number,
  from: number,
  rt60: number,
  db: number,
): Point {
  if (!Number.isFinite(rt60)) return [box.x + box.w, box.y]
  const at = from + (rt60 * -db) / 60
  if (at <= seconds) return [box.x + (at / seconds) * box.w, yOf(db, box)]
  return [box.x + box.w, yOf((-60 * (seconds - from)) / Math.max(rt60, 1e-6), box)]
}

/** The time to fall 60 dB of the straight fall from the top at `from` seconds through a point of the box: `fallPoint` the other way round. */
export function fallThrough(box: Box, seconds: number, from: number, x: number, y: number): number {
  const elapsed = Math.max(0.005, clamp((x - box.x) / box.w, 0, 1) * seconds - from)
  const db = clamp(dbOfY(y, box, TOP_DB, FOOT_DB), FOOT_DB, -0.05)
  return (-60 * elapsed) / db
}

/** Set point `index` of a list a display keeps between frames, making it only the first time. */
function put(points: Point[], index: number, x: number, y: number): void {
  // A point is not to be changed by those it is handed to; this list is the display's own.
  const point = points[index] as [number, number] | undefined
  if (point) {
    point[0] = x
    point[1] = y
  } else {
    points[index] = [x, y]
  }
}

/** What a display keeps of the sound, to show what happens now. */
interface Ride {
  /** The level coming out, dB, one reading a frame. */
  out: History
  /** The loudest going in lately, sinking, dB. */
  hold: number
  /** Whether sound was going in on the frame before. */
  going: boolean
  /** When the sound that goes in now, or went in last, began, on the frame's clock; NaN for never. */
  began: number
  /** When sound last went in; NaN for never. */
  last: number
  /** When it was last as loud as the loudest lately: the start of a note that dies away, the end of one that is held. */
  loud: number
  /** How loud that sound was, dB. */
  went: number
  /** What came out once the sound itself had gone: the fall is measured from it. NaN until then. */
  from: number
  /** Seconds the level coming out has been under the foot. */
  under: number
  /** The points last drawn, kept to be used again. */
  points: Point[]
}

const newRide = (seconds: number): Ride => ({
  out: new History(seconds, Math.round(seconds * SLOTS_PER_SEC), FLOOR_DB, 'max'),
  hold: FLOOR_DB,
  going: false,
  began: NaN,
  last: NaN,
  loud: NaN,
  went: FLOOR_DB,
  from: NaN,
  under: 0,
  points: [],
})

function forget(ride: Ride): void {
  ride.going = false
  ride.began = NaN
  ride.last = NaN
  ride.loud = NaN
  ride.from = NaN
  ride.under = 0
}

/**
 * Listen for a frame. A sound "goes in" while the level going in (what comes
 * out, where the plate was not told what feeds the device) is within a few
 * dB of the loudest lately; that level sinks at half the rate the tail falls
 * at, so a quieter sound counts once the tail of the last has made room for
 * it. A steady sound goes in for as long as it lasts. When it stops, the
 * level that comes out a moment later, with the dry sound gone from it, is
 * kept: the fall is measured from there. `held` is a room that lets nothing
 * in: what rings in it is followed from the frame it is first heard.
 */
function hear(frame: DisplayFrame, ride: Ride, rt60: number, held = false): void {
  const signal = frame.signal
  // Switched off or out of sight nothing is followed: the picture is what the device would do.
  if (!signal || !frame.powered) {
    forget(ride)
    ride.hold = FLOOR_DB
    return
  }
  const out = gainToDb(signal.output.rms)
  const level = gainToDb((signal.input ?? signal.output).rms)
  ride.out.push(frame.now, out)
  const sink = rt60 > 0 && Number.isFinite(rt60) ? Math.max(1, 30 / rt60) : 1
  ride.hold = Math.max(level, ride.hold - sink * frame.dt)
  const goes = !held && level > QUIET_DB && level >= ride.hold - NEAR_DB
  if (goes) {
    if (!ride.going) ride.began = frame.now
    if (level >= ride.hold - LOUD_DB || !ride.going) ride.loud = frame.now
    ride.last = frame.now
    ride.went = ride.hold
    ride.from = NaN
    ride.under = 0
  } else if (held && !Number.isFinite(ride.last)) {
    if (out > GONE_DB) {
      ride.began = frame.now
      ride.loud = frame.now
      ride.last = frame.now - SETTLE_SEC
      ride.went = out
      ride.from = out
    }
  } else if (Number.isFinite(ride.last)) {
    if (Number.isNaN(ride.from) && frame.now - ride.last >= SETTLE_SEC) ride.from = out
    const gone = out <= GONE_DB || (!Number.isNaN(ride.from) && out - ride.from < FOOT_DB)
    ride.under = gone ? ride.under + frame.dt : 0
    // The tail has died: the picture is at rest again.
    if (ride.under > 1) forget(ride)
  }
  ride.going = goes
}

/**
 * The level that comes out now against the sound that went in, as a bar in
 * the second colour up the left edge of `box`: with a steady sound it stands
 * (the dry sound and the reverb together), and when the sound stops it drops
 * to the reverb alone and sinks with it.
 */
function drawMeter(frame: DisplayFrame, ride: Ride, x: number, box: Box): void {
  if (!frame.signal || !frame.powered || !Number.isFinite(ride.last)) return
  const foot = box.y + box.h
  const y = yOf(ride.out.at(0) - (ride.going ? ride.hold : ride.went), box)
  if (y >= foot - 0.5) return
  fillRect(frame.ctx, { x, y, w: METER_WIDTH, h: foot - y }, frame.colours.accent)
}

/**
 * What came out since the sound stopped, across a box that spans `seconds`:
 * a line in the second colour that starts at `startDb` (where the drawn tail
 * starts) and falls as the level did, and a dot where it is now. Nothing
 * while sound still goes in. A tail that outlasts the scale is a dot at the
 * edge.
 */
function drawFall(
  frame: DisplayFrame,
  ride: Ride,
  box: Box,
  seconds: number,
  startDb: number,
): void {
  if (!frame.signal || !frame.powered || ride.going) return
  if (!Number.isFinite(ride.last) || Number.isNaN(ride.from)) return
  const { ctx, colours } = frame
  const foot = box.y + box.h
  const right = box.x + box.w
  const age = frame.now - ride.last
  const nowY = yOf(startDb + Math.min(0, ride.out.at(0) - ride.from), box)
  if (age > seconds) {
    if (nowY < foot - 0.5) dot(ctx, right, nowY, 2.5, colours.accent, { ring: colours.ink })
    return
  }
  const slot = 1 / SLOTS_PER_SEC
  const points = ride.points
  let count = 0
  for (let back = Math.min(ride.out.slots - 1, Math.floor(age / slot)); back >= 0; back--) {
    const elapsed = Math.max(0, age - back * slot)
    const level = startDb + Math.min(0, ride.out.at(back) - ride.from)
    put(points, count++, box.x + (elapsed / seconds) * box.w, yOf(level, box))
  }
  points.length = count
  clipped(ctx, { x: box.x, y: box.y - 2, w: box.w, h: box.h + 2 }, () =>
    trace(ctx, points, { colour: colours.accent, width: 1.5 }),
  )
  if (count > 0 && nowY < foot - 0.5) {
    dot(ctx, points[count - 1][0], nowY, 2.5, colours.accent, { ring: colours.ink })
  }
}

/**
 * What came out since the sound went in, for a picture that is the answer
 * to a short sound (the shaped reverb): a line in the second colour from the
 * moment the sound was at its loudest (the start of a note that dies away,
 * the end of one that is held), in dB under that sound, for as long as the
 * scale spans.
 */
function drawSince(frame: DisplayFrame, ride: Ride, box: Box, seconds: number): void {
  if (!frame.signal || !frame.powered || !Number.isFinite(ride.loud)) return
  const age = frame.now - ride.loud
  if (age > seconds) return
  const { ctx, colours } = frame
  const foot = box.y + box.h
  const slot = 1 / SLOTS_PER_SEC
  const points = ride.points
  let count = 0
  for (let back = Math.min(ride.out.slots - 1, Math.floor(age / slot)); back >= 0; back--) {
    const elapsed = Math.max(0, age - back * slot)
    const y = yOf(ride.out.at(back) - ride.went, box)
    put(points, count++, box.x + (elapsed / seconds) * box.w, y)
  }
  points.length = count
  if (count < 2) return
  clipped(ctx, { x: box.x, y: box.y - 2, w: box.w, h: box.h + 2 }, () =>
    trace(ctx, points, { colour: colours.accent, width: 1.5 }),
  )
  const [x, y] = points[count - 1]
  if (y < foot - 0.5) dot(ctx, x, y, 2.5, colours.accent, { ring: colours.ink })
}

/** The dry sound: an upright line at the moment it goes in, as high as it comes out. */
function dryMark(frame: DisplayFrame, box: Box, dryDb: number): void {
  if (dryDb <= FOOT_DB) return
  const x = box.x + 1
  rule(frame.ctx, x, box.y + box.h, x, yOf(dryDb, box), {
    colour: frame.colours.ink,
    width: 2,
    alpha: INK.back,
  })
}

// --- Rooms: a tail that dies away ---------------------------------------------

/** What a reverb answers a sound with, at the present settings. */
interface Answer {
  /** The dry sound and the start of the reverb, in dB under the sound going in. */
  dry: number
  wet: number
  /** The pre-delay, seconds. */
  gap: number
  /** Seconds from the sound going in to the reverb's first sound: the gap and what the device adds to it. */
  onset: number
  /** Seconds to fall 60 dB in the body of the sound; in a room that is held, once it is let go. */
  body: number
  /** The same at the top of the spectrum. */
  top: number
  /** The same low down, where a device sets that apart; NaN where it does not. */
  low: number
  /** A room that is held: its tail does not fall until it is let go. */
  held: boolean
}

/** What one device brings to the family's picture. */
interface Room {
  params: readonly string[]
  info: string
  /** Seconds the part with the first moments spans, and seconds the tail's part spans. */
  first: number
  span: number
  /** The parameters the handles set: the end of the tail, its start (across and up), the line of the highs. */
  decay: string
  mix: string
  predelay?: string
  damping?: string
  /** The level the reverb starts at for a setting of Mix, dB. */
  wetOf(mix: number): number
  answer(view: DisplayView, rate: number): Answer
  /** The first reflections, as marks. */
  reflections?(view: DisplayView, rate: number, answer: Answer, marks: Marks): void
  /** How far under its level the reverb may start, dB: something that lets less of a sound in at times. */
  sinks?(view: DisplayView): number
  /**
   * What is the device's own in the first moments, where marks do not say
   * it: `lay` works its outlines out into `into` when a setting moves and
   * says how many there are, `paint` draws them.
   */
  lay?(
    view: DisplayView,
    rate: number,
    answer: Answer,
    level: number,
    box: Box,
    into: Float32Array,
  ): number
  paint?(frame: DisplayFrame, outlines: Float32Array, count: number, box: Box): void
}

/** What a room's display keeps: the sound, and the picture as it was last laid out. */
interface RoomState {
  ride: Ride
  marks: Marks
  seen: Float64Array
  answer: Answer
  level: number
  /** The first moments: the tail setting off, and the lowest it may set off at. */
  setsOff: Point[]
  sunk: Point[]
  /** The tail: its body, its highs, its lows, and what a held room falls at once let go. */
  body: Point[]
  top: Point[]
  low: Point[]
  letGo: Point[]
  handles: readonly DisplayHandle[]
  outlines: Float32Array
  outlineCount: number
}

interface RoomBoxes {
  /** The left edge of the level that comes out. */
  meter: number
  first: Box
  tail: Box
  /** The baselines of the two scales' words, and the line between the parts. */
  firstWords: number
  tailWords: number
  between: number
}

/**
 * The first moments above, the tail below, each with its scale of seconds
 * under it. Of a window 100 high the first moments get 27 and the tail 37,
 * and the tail's foot stands clear of its scale's words, so a handle on the
 * foot does not cover them.
 */
function roomBoxes(view: Pick<DisplayView, 'width' | 'height'>): RoomBoxes {
  const free = Math.max(20, view.height - 8 - 2 * SCALE_HEIGHT - 11)
  const height = Math.round(free * 0.43)
  // A handle at the very top (Mix full up) is a whole circle: the box starts a pixel lower for it.
  const first: Box = { x: 6 + METER_WIDTH, y: 5, w: view.width - 10 - METER_WIDTH, h: height - 1 }
  const under = first.y + first.h + SCALE_HEIGHT
  return {
    meter: 4,
    first,
    tail: { x: 4, y: under + 9, w: view.width - 8, h: free - height },
    firstWords: under + 0.5,
    tailWords: view.height - 3.5,
    between: under + 4,
  }
}

const shownWet = (answer: Answer): number => Math.max(answer.wet, LOWEST_WET_DB)

/** The room a device's own outlines are given: the spring's, three springs of 24 bounces of 8 points. */
const MOST_OUTLINES = 3 * 24 * 2 * 8

/** How far down their line the handle of the highs stands. */
const HIGHS_DB = -30

function roomHandles(room: Room, view: DisplayView): DisplayHandle[] {
  const rate = rateOf(view)
  const answer = room.answer(view, rate)
  const { first, tail } = roomBoxes(view)
  const level = shownWet(answer)
  const lowestY = yOf(LOWEST_WET_DB, first)
  const { mix, predelay, damping, decay } = room
  const mixAt = (y: number): number => {
    // At the lowest level drawn the handle stands for every mix under it.
    if (y >= lowestY - 0.25) {
      return answer.wet <= LOWEST_WET_DB ? view.value(mix) : (view.spec(mix)?.min ?? 0)
    }
    return solveParam(view, mix, (value) => room.wetOf(value), dbOfY(y, first, TOP_DB, FOOT_DB))
  }
  const [endX, endY] = fallPoint(tail, room.span, answer.onset, answer.body, FOOT_DB)
  const handles: DisplayHandle[] = [
    {
      key: 'start',
      name: predelay ? 'Pre-delay and mix' : 'Mix',
      x: first.x + clamp(answer.onset / room.first, 0, 1) * first.w,
      y: yOf(level, first),
      drag: (x, y) => {
        const set: Record<string, number> = { [mix]: mixAt(y) }
        if (predelay) {
          const spec = view.spec(predelay)
          const seconds = ((x - first.x) / first.w) * room.first - (answer.onset - answer.gap)
          set[predelay] = clamp(seconds * 1000, spec?.min ?? 0, spec?.max ?? 250)
        }
        return set
      },
      reset: () => ({
        [mix]: defaultOf(view, mix),
        ...(predelay ? { [predelay]: defaultOf(view, predelay) } : {}),
      }),
    },
    {
      // The tail's end: on the foot at its time, or up the right edge when it outlasts the scale.
      key: 'decay',
      name: 'Decay',
      x: endX,
      y: endY,
      drag: (x, y) => ({
        [decay]: solveParam(
          view,
          decay,
          (value) => room.answer(withParam(view, decay, value), rate).body,
          fallThrough(tail, room.span, answer.onset, x, y),
        ),
      }),
      reset: () => ({ [decay]: defaultOf(view, decay) }),
    },
  ]
  if (damping) {
    const [x, y] = fallPoint(tail, room.span, answer.onset, answer.top, HIGHS_DB)
    handles.push({
      key: 'damping',
      name: 'Damping',
      x,
      y,
      drag: (toX, toY) => ({
        [damping]: solveParam(
          view,
          damping,
          (value) => room.answer(withParam(view, damping, value), rate).top,
          fallThrough(tail, room.span, answer.onset, toX, toY),
        ),
      }),
      reset: () => ({ [damping]: defaultOf(view, damping) }),
    })
  }
  return handles
}

/** Work a room's picture out from its settings: done when one of them moves, not on every frame. */
function layRoom(room: Room, view: DisplayView, rate: number, state: RoomState): void {
  const { first, tail } = roomBoxes(view)
  const answer = room.answer(view, rate)
  const level = shownWet(answer)
  const falls = answer.held ? Infinity : answer.body
  state.answer = answer
  state.level = level
  state.setsOff = decayLine(first, room.first, answer.onset, level, falls)
  // A line on the foot would not be seen: the lowest start is drawn just above it.
  const sinks = room.sinks?.(view) ?? 0
  state.sunk =
    sinks < -0.5
      ? decayLine(first, room.first, answer.onset, Math.max(level + sinks, FOOT_DB + 3), falls)
      : []
  state.marks.clear(first.w, room.first)
  room.reflections?.(view, rate, answer, state.marks)
  state.outlineCount = room.lay?.(view, rate, answer, level, first, state.outlines) ?? 0
  const fall = (rt60: number): Point[] =>
    Number.isFinite(rt60) ? decayLine(tail, room.span, answer.onset, TOP_DB, rt60) : []
  state.body = decayLine(tail, room.span, answer.onset, TOP_DB, falls)
  state.top = fall(answer.top)
  state.low = fall(answer.low)
  state.letGo = answer.held ? fall(answer.body) : []
  state.handles = roomHandles(room, view)
}

/** How high a line stands at `x`: the foot before it starts and after it has come down. */
function lineY(line: readonly Point[], x: number, foot: number): number {
  if (line.length < 2 || x < line[0][0]) return foot
  const [ax, ay] = line[0]
  const [bx, by] = line[line.length - 1]
  if (x >= bx) return by
  return bx > ax ? lerp(ay, by, (x - ax) / (bx - ax)) : by
}

const NO_ANSWER: Answer = {
  dry: FLOOR_DB,
  wet: FLOOR_DB,
  gap: 0,
  onset: 0,
  body: 0,
  top: NaN,
  low: NaN,
  held: false,
}

/** A reverb with a tail that dies away, drawn the family's way. */
function room(config: Room): PlateDisplay {
  return plateDisplay<RoomState>({
    place: 'window',
    columns: 2,
    params: config.params,
    live: { signal: true },
    info: config.info,
    init: () => ({
      ride: newRide(config.span),
      marks: new Marks(),
      seen: unseen(config.params),
      answer: NO_ANSWER,
      level: FLOOR_DB,
      setsOff: [],
      sunk: [],
      body: [],
      top: [],
      low: [],
      letGo: [],
      handles: [],
      outlines: new Float32Array(config.lay ? MOST_OUTLINES : 0),
      outlineCount: 0,
    }),
    draw(frame) {
      const { ctx, colours, state } = frame
      drawnRate = frame.sampleRate
      ground(frame)
      if (moved(frame, frame.sampleRate, config.params, state.seen)) {
        layRoom(config, frame, frame.sampleRate, state)
      }
      const { answer, level } = state
      const { meter, first, tail, firstWords, tailWords, between } = roomBoxes(frame)
      hear(frame, state.ride, answer.body, answer.held)

      // Above, the first moments: the dry sound, the gap, the first reflections, the tail setting off.
      const firstFoot = first.y + first.h
      dbGrid(frame, first, TOP_DB, FOOT_DB, 20)
      timeScale(frame, first, config.first, firstWords, false)
      rule(ctx, first.x, firstFoot, first.x + first.w, firstFoot, {
        colour: colours.ink,
        alpha: INK.rule,
      })
      clipped(ctx, first, () => {
        fillTo(ctx, state.setsOff, firstFoot, colours.ink, INK.fill)
        strokeMarks(frame, state.marks, first, level, INK.rule)
        config.paint?.(frame, state.outlines, state.outlineCount, first)
        trace(ctx, state.sunk, { colour: colours.ink, width: 1, alpha: INK.back, dash: [2, 2] })
        trace(ctx, state.setsOff, { colour: colours.ink, width: 1, alpha: INK.text })
      })
      dryMark(frame, first, answer.dry)
      drawMeter(frame, state.ride, meter, first)
      rule(ctx, 1, between, frame.width - 1, between, { colour: colours.ink, alpha: INK.rule })

      // Below, the tail alone: from the top to the foot in the time written beside it.
      const foot = tail.y + tail.h
      dbGrid(frame, tail, TOP_DB, FOOT_DB, 20)
      timeScale(frame, tail, config.span, tailWords, true)
      rule(ctx, tail.x, foot, tail.x + tail.w, foot, { colour: colours.ink, alpha: INK.rule })
      clipped(ctx, { x: tail.x, y: tail.y - 2, w: tail.w, h: tail.h + 2 }, () => {
        // The lows where they are set apart: a lighter wedge, dashed.
        fillTo(ctx, state.low, foot, colours.ink, INK.fill * 0.6)
        trace(ctx, state.low, { colour: colours.ink, width: 1, alpha: INK.back, dash: [3, 2] })
        fillTo(ctx, state.body, foot, colours.ink, INK.fill)
        if (answer.held) {
          // What it falls at once the hold is let go.
          trace(ctx, state.letGo, { colour: colours.ink, width: 1, alpha: INK.text, dash: [2, 2] })
          trace(ctx, state.top, { colour: colours.ink, width: 1, alpha: INK.back })
        } else {
          // The highs die sooner: a darker wedge inside the tail.
          fillTo(ctx, state.top, foot, colours.ink, INK.fill)
          trace(ctx, state.top, { colour: colours.ink, width: 1, alpha: INK.back })
        }
      })
      clipped(ctx, { x: tail.x, y: tail.y - 2, w: tail.w, h: tail.h + 2 }, () =>
        trace(ctx, state.body, { colour: colours.ink }),
      )
      drawFall(frame, state.ride, tail, config.span, TOP_DB)

      for (const point of state.handles) {
        handle(frame, point.x, point.y, { hot: frame.hot === point.key })
      }
      // The one figure a reverb is set by: how long the tail takes to fall 60 dB.
      // In the corner over the tail, or at the foot where a long tail runs through the corner.
      const words =
        frame.hot === 'damping'
          ? secondsText(answer.top)
          : frame.hot === 'start' && config.predelay
            ? `${Math.round(answer.gap * 1000)}ms`
            : secondsText(answer.held ? Infinity : answer.body)
      const right = tail.x + tail.w - 1
      const left = right - words.length * 5.5 - 3
      const through = Math.min(lineY(state.body, left, foot), lineY(state.low, left, foot))
      // The sign for a tail that never falls is a small one in most faces: it is set larger.
      text(frame, words, right, through < tail.y + 12 ? foot - 3 : tail.y + 8, {
        align: 'right',
        size: words === '∞' ? 13 : 9,
      })
    },
    handles: (view) => roomHandles(config, view),
  })
}

// --- Plate Reverb -------------------------------------------------------------

/** The tank of `plate_reverb.cpp`: its delays in samples at its reference rate of 29761 Hz, one half and the other. */
const PLATE_RATE = 29761
const PLATE_HALVES = [
  { diffuser: 672, first: 4453, second: 1800, last: 3720 },
  { diffuser: 908, first: 4217, second: 2656, last: 3163 },
] as const
/** Once round the figure of eight: both halves, an allpass counted at its length. */
const PLATE_LOOP_SEC =
  PLATE_HALVES.reduce((sum, h) => sum + h.diffuser + h.first + h.second + h.last, 0) / PLATE_RATE
/**
 * How much longer the tank rings than its length says. The four allpasses in
 * the loop (gains 0.7 and 0.5) hold each frequency back by its own time, from
 * a fifth of their length to more than five times it, so a trip round is
 * 0.80 to 1.75 of the loop for one frequency or another. Each falls at its
 * own rate, and heard together (`fallTogether`, every phase of the four
 * allpasses, each part lasting as long as its trip) they take 1.147 times as
 * long to fall 60 dB. Measured on the device at Decay 0.7: 3.9 s where the
 * loop's length alone says 3.5.
 */
export const PLATE_SPREAD = 0.147
/**
 * The two diffusers sway by 12 samples (`kExcursion`), which is half a cycle
 * at this frequency. Well above it the sway carries a frequency through every
 * trip time in turn and the spread evens out: measured, all of it is there at
 * 500 Hz, half at 1.2 kHz and none at 4 kHz.
 */
const PLATE_SWAY_HZ = PLATE_RATE / 24

/**
 * How long the plate takes to fall 60 dB at a frequency. `PlateReverb::process`
 * multiplies by Decay twice in each half of the tank and damps once, so a
 * trip round both halves is Decay⁴ and the damping filter twice; the
 * allpasses in the loop stretch that as `PLATE_SPREAD` says.
 */
export function plateRt60(decay: number, damping: number, hz: number, rate: number): number {
  const kept = clamp(decay, 0, 0.9999)
  const a = clamp(damping, 0, 0.9999)
  const ratio = hz / PLATE_SWAY_HZ
  return (
    loopRt60(PLATE_LOOP_SEC, 80 * Math.log10(kept) + 2 * onePoleLossDb(a, hz, rate)) *
    (1 + PLATE_SPREAD / (1 + ratio * ratio))
  )
}

/**
 * The plate's first trip, from the output taps of `plate_reverb.cpp` (the
 * paper's table 2): when each tap first sounds after the input reaches the
 * tank, its level against the first, and how often it has been through
 * Decay by then. A tap on a half's first delay hears the input at once; a
 * tap further round hears it after that delay, through Decay, and through
 * the second allpass (half straight through, three quarters after its
 * length). Every arrival comes again after the first allpass's length.
 */
const PLATE_TAPS: readonly (readonly [samples: number, db: number, trips: number])[] = (() => {
  // Output left, then right: [half, where, offset].
  const taps: readonly (readonly [0 | 1, 'first' | 'second' | 'last', number])[] = [
    [1, 'first', 266],
    [1, 'first', 2974],
    [1, 'second', 1913],
    [1, 'last', 1996],
    [0, 'first', 1990],
    [0, 'second', 187],
    [0, 'last', 1066],
    [0, 'first', 353],
    [0, 'first', 3627],
    [0, 'second', 1228],
    [0, 'last', 2673],
    [1, 'first', 2111],
    [1, 'second', 335],
    [1, 'last', 121],
  ]
  // The first allpass (gain 0.7) passes 0.7 at once and 1 − 0.7² after its length.
  const again = 20 * Math.log10(0.51 / 0.7)
  const out: [number, number, number][] = []
  for (const [half, where, offset] of taps) {
    const h = PLATE_HALVES[half]
    const arrivals: [number, number, number][] =
      where === 'first'
        ? [[offset, 0, 0]]
        : where === 'second'
          ? [[h.first + offset, 0, 1]]
          : [
              [h.first + offset, 20 * Math.log10(0.5), 1],
              [h.first + h.second + offset, 20 * Math.log10(0.75), 1],
            ]
    for (const [samples, db, trips] of arrivals) {
      out.push([samples, db, trips], [samples + h.diffuser, db + again, trips])
    }
  }
  return out
})()
/**
 * The four allpasses the input goes through before the tank (`kInputAp1` to
 * `4`, gains 0.75, 0.75, 0.625, 0.625): each hands a sound on at once (its
 * gain), after its length (1 − gain²) and after twice its length (gain times
 * that). Every way through the four, as samples added and dB against the
 * loudest way: they smear each tap over 60 ms, which is why a plate starts
 * dense.
 */
const PLATE_SMEAR: readonly (readonly [samples: number, db: number])[] = (() => {
  let ways: [number, number][] = [[0, 1]]
  for (const [length, gain] of [
    [142, 0.75],
    [107, 0.75],
    [379, 0.625],
    [277, 0.625],
  ]) {
    const echo = 1 - gain * gain
    ways = ways.flatMap(([samples, level]): [number, number][] => [
      [samples, level * gain],
      [samples + length, level * echo],
      [samples + 2 * length, level * gain * echo],
    ])
  }
  const most = Math.max(...ways.map(([, level]) => level))
  return ways.map(([samples, level]) => [samples, 20 * Math.log10(level / most)])
})()
/** The first tap of all: the plate's own part of the gap. */
const PLATE_FIRST_SEC = Math.min(...PLATE_TAPS.map(([samples]) => samples)) / PLATE_RATE

const plateReverb = room({
  params: ['mix', 'decay', 'damping', 'predelayMs'],
  info: 'Above, the first moments after a sound goes in: the dry sound, the gap and the plate answering, dense from the start. Below, the tail falling 60 dB on a scale of seconds, the time it takes written beside it and the highs dying sooner inside it. The second colour is the sound itself ringing away.',
  first: 0.4,
  span: 8,
  decay: 'decay',
  mix: 'mix',
  predelay: 'predelayMs',
  damping: 'damping',
  // `PlateReverbDevice::process`: dry·(1 − mix) + wet·mix.
  wetOf: (mix) => gainToDb(mix),
  answer(view, rate) {
    const mix = view.value('mix')
    const gap = view.value('predelayMs') / 1000
    return {
      dry: gainToDb(1 - mix),
      wet: gainToDb(mix),
      gap,
      onset: gap + PLATE_FIRST_SEC,
      body: plateRt60(view.value('decay'), view.value('damping'), BODY_HZ, rate),
      top: plateRt60(view.value('decay'), view.value('damping'), TOP_HZ, rate),
      low: NaN,
      held: false,
    }
  },
  reflections(view, rate, answer, marks) {
    const trip =
      20 * Math.log10(Math.max(1e-6, clamp(view.value('decay'), 0, 0.9999))) +
      onePoleLossDb(clamp(view.value('damping'), 0, 0.9999), BODY_HZ, rate)
    for (const [samples, db, trips] of PLATE_TAPS) {
      const at = answer.gap + samples / PLATE_RATE
      const level = db + trips * trip
      for (const [smear, less] of PLATE_SMEAR) marks.add(at + smear / PLATE_RATE, level + less)
    }
  },
})

// --- FDN Reverb ---------------------------------------------------------------

/** The eight lines of `fdn_reverb.h`, in samples at 44.1 kHz. */
const FDN_LINES = [4799, 5399, 5801, 6199, 6599, 6997, 7393, 7789] as const
/** One line's length in seconds at Size 1, cut to whole samples as `FdnReverb::init` cuts it. */
const fdnLine = (line: number, rate: number): number =>
  Math.floor((FDN_LINES[line] * rate) / 44100) / rate

/**
 * How long the network takes to fall 60 dB at a frequency. A trip is the
 * mean line times Size; on it `FdnReverb::process` multiplies by
 * `feedback_gain_for` (the gain that makes Decay the RT60, held under 0.98),
 * damps with a one-pole whose cutoff Damping sweeps from 20 kHz to 1 kHz,
 * and blocks DC with R = 0.995. Measured on the device at Decay 5: 4.8 to
 * 4.9 s at 500 Hz where this says 4.9.
 */
export function fdnRt60(
  decay: number,
  damping: number,
  size: number,
  hz: number,
  rate: number,
): number {
  let mean = 0
  for (let i = 0; i < FDN_LINES.length; i++) mean += fdnLine(i, rate) / FDN_LINES.length
  const trip = mean * clamp(size, 0.5, 2)
  const gain = Math.min(0.98, Math.pow(10, (-3 * trip) / clamp(decay, 0.1, 20)))
  const cutoff = 20000 * Math.pow(1000 / 20000, clamp(damping, 0, 1))
  const w = (TWO_PI * hz) / rate
  const r = 0.995
  const blocker = 10 * Math.log10((2 - 2 * Math.cos(w)) / (1 + r * r - 2 * r * Math.cos(w)))
  return loopRt60(
    trip,
    20 * Math.log10(gain) + onePoleLossDb(Math.exp((-TWO_PI * cutoff) / rate), hz, rate) + blocker,
  )
}

/** `FdnReverb::breath_law`: how much of the input the breath lets in at a place in its cycle. */
export function fdnBreath(phase: number, depth: number): number {
  const breathMod = Math.sin(phase * TWO_PI) * 0.5 + 0.5
  return 1 - depth * (1 - breathMod)
}

const fdnReverb = room({
  params: ['mix', 'decay', 'damping', 'predelayMs', 'size', 'breathDepth'],
  info: 'Above, the first moments after a sound goes in: the gap, then the eight lines answering, wider apart as Size grows, and dashed how low Breath lets the start sink. Below, the tail falling 60 dB on a scale of seconds, the highs dying sooner inside it. The figure is the time it takes.',
  first: 0.6,
  span: 10,
  decay: 'decay',
  mix: 'mix',
  predelay: 'predelayMs',
  damping: 'damping',
  // `FdnReverbDevice::process`: dry·cos(mix·π/2) + wet·sin(mix·π/2).
  wetOf: (mix) => gainToDb(Math.sin((clamp(mix, 0, 1) * Math.PI) / 2)),
  answer(view, rate) {
    const mix = clamp(view.value('mix'), 0, 1)
    const gap = view.value('predelayMs') / 1000
    const size = clamp(view.value('size'), 0.5, 2)
    return {
      dry: gainToDb(Math.cos((mix * Math.PI) / 2)),
      wet: gainToDb(Math.sin((mix * Math.PI) / 2)),
      gap,
      // Nothing comes out before the shortest line has been gone through once.
      onset: gap + fdnLine(0, rate) * size,
      body: fdnRt60(view.value('decay'), view.value('damping'), size, BODY_HZ, rate),
      top: fdnRt60(view.value('decay'), view.value('damping'), size, TOP_HZ, rate),
      low: NaN,
      held: false,
    }
  },
  reflections(view, rate, answer, marks) {
    const size = clamp(view.value('size'), 0.5, 2)
    // Once through a line, and what the Hadamard matrix hands on to every
    // line for a second trip: an eighth of the power each, less the loop's loss.
    const again = (-60 * fdnLine(3, rate) * size) / answer.body - 10 * Math.log10(8)
    for (let i = 0; i < FDN_LINES.length; i++) {
      marks.add(answer.gap + fdnLine(i, rate) * size, 0)
      for (let j = i; j < FDN_LINES.length; j++) {
        // Two ways round to the same moment when the lines differ.
        marks.add(
          answer.gap + (fdnLine(i, rate) + fdnLine(j, rate)) * size,
          again + (i === j ? 0 : 3),
        )
      }
    }
  },
  // The breath runs free and the device does not say where in its cycle it
  // is, so only its reach is drawn: the least it lets in, at the bottom of a cycle.
  sinks: (view) => gainToDb(fdnBreath(0.75, clamp(view.value('breathDepth'), 0, 1))),
})

// --- Hall Reverb --------------------------------------------------------------

/** The eight loops of `re.zita_rev1_stereo` and the allpass in front of each, in seconds (`hall-reverb.dsp`). */
const HALL_LOOPS = [
  0.153129, 0.210389, 0.127837, 0.256891, 0.174713, 0.192303, 0.125, 0.219991,
] as const
const HALL_ALLPASSES = [
  0.020346, 0.024421, 0.031604, 0.027333, 0.022904, 0.029291, 0.013458, 0.019123,
] as const
const HALL_MEAN_LOOP = HALL_LOOPS.reduce((sum, seconds) => sum + seconds, 0) / HALL_LOOPS.length
/** The reverb's own output runs 7 dB under what goes in; Mix is levelled for it (`wetPower` in the .dsp). */
const HALL_WET_POWER = 0.2
/**
 * How much longer the hall rings than its loops' lengths and losses say. The
 * allpass in each loop (gain 0.6) holds part of every trip back. With the
 * allpasses taken out the loops fall exactly as `hallTripDb` says; with them
 * in, the device measures 1 to 4 % longer under Crossover and 6 to 9 %
 * longer between Crossover and Damping, at Mid decay 1, 2, 4 and 8 alike.
 * This is the middle of what was measured, not a figure worked out.
 */
export const HALL_LONGER = 1.06

/**
 * What one trip round a loop `seconds` long does to a frequency, in dB, as
 * the generated `hall-reverb.h` computes each line's filter: the gain that
 * makes Mid decay the RT60, a low shelf at Crossover that turns it into Low
 * decay's, and a low-pass with that same gain again at the Damping frequency.
 */
export function hallTripDb(
  seconds: number,
  hz: number,
  crossover: number,
  lowDecay: number,
  midDecay: number,
  damping: number,
  rate: number,
): number {
  const mid = Math.pow(10, (-3 * seconds) / midDecay)
  const low = Math.pow(10, (-3 * seconds) / lowDecay)
  // The shelf: 1 + (low / mid − 1) · a first-order low-pass at Crossover.
  const ratio = Math.tan((Math.PI * hz) / rate) / Math.tan((Math.PI * crossover) / rate)
  const lift = low / mid
  const shelf = (lift * lift + ratio * ratio) / (1 + ratio * ratio)
  // The low-pass: one pole, 1 at DC and `mid` at the Damping frequency.
  const squared = mid * mid
  const half = (1 - squared * Math.cos((TWO_PI * damping) / rate)) / (1 - squared)
  const pole = half - Math.sqrt(Math.max(0, half * half - 1))
  return 20 * Math.log10(mid) + 10 * Math.log10(shelf) + onePoleLossDb(pole, hz, rate)
}

/** How long the hall takes to fall 60 dB at a frequency: the mean of its loops, what a trip round it loses, and what the allpasses add. */
export function hallRt60(
  hz: number,
  crossover: number,
  lowDecay: number,
  midDecay: number,
  damping: number,
  rate: number,
): number {
  return (
    HALL_LONGER *
    loopRt60(
      HALL_MEAN_LOOP,
      hallTripDb(HALL_MEAN_LOOP, hz, crossover, lowDecay, midDecay, damping, rate),
    )
  )
}

/** The dry and the wet gain of the hall's levelled Mix (`hall-reverb.dsp`). */
function hallGains(mix: number): { dry: number; wet: number } {
  const m = clamp(mix, 0, 1)
  const level = 1 / Math.sqrt((1 - m) * (1 - m) + HALL_WET_POWER * m * m)
  return { dry: (1 - m) * level, wet: m * level }
}

/** The frequencies the hall's three lines are worked out at: well under Crossover, between it and Damping, and the top. */
const hallMidHz = (view: DisplayView): number =>
  Math.sqrt(view.value('crossover') * Math.min(view.value('damping'), 12000))

const hallReverb = room({
  params: ['preDelay', 'crossover', 'lowDecay', 'midDecay', 'damping', 'mix'],
  info: 'Above, the first moments after a sound goes in: the gap, the first echoes and the eight loops coming round. Below, the tail falling 60 dB on a scale of seconds: the mids, dashed the lows under Crossover, and darker inside the highs above Damping. The figure is the time the mids take.',
  first: 0.4,
  span: 6,
  decay: 'midDecay',
  mix: 'mix',
  predelay: 'preDelay',
  damping: 'damping',
  wetOf: (mix) => gainToDb(hallGains(mix).wet) + 10 * Math.log10(HALL_WET_POWER),
  answer(view, rate) {
    const gains = hallGains(view.value('mix'))
    const gap = view.value('preDelay') / 1000
    const at = (hz: number): number =>
      hallRt60(
        hz,
        view.value('crossover'),
        view.value('lowDecay'),
        view.value('midDecay'),
        view.value('damping'),
        rate,
      )
    return {
      dry: gainToDb(gains.dry),
      wet: gainToDb(gains.wet) + 10 * Math.log10(HALL_WET_POWER),
      gap,
      // What goes straight through the allpasses cancels in the output: the
      // first sound is the shortest allpass's echo.
      onset: gap + Math.min(...HALL_ALLPASSES),
      body: at(hallMidHz(view)),
      top: at(TOP_HZ),
      low: at(view.value('crossover') / 4),
      held: false,
    }
  },
  reflections(view, rate, answer, marks) {
    // Each allpass (gain 0.6) hands on 1 − 0.6² after its length and 0.6 of
    // that again after twice it; then each loop comes round, straight
    // through its allpass (0.6) and after its length.
    const second = 20 * Math.log10(0.6)
    const through = 20 * Math.log10(0.6 / 0.64)
    const hz = hallMidHz(view)
    for (let i = 0; i < HALL_LOOPS.length; i++) {
      const allpass = HALL_ALLPASSES[i]
      const trip = hallTripDb(
        HALL_LOOPS[i],
        hz,
        view.value('crossover'),
        view.value('lowDecay'),
        view.value('midDecay'),
        view.value('damping'),
        rate,
      )
      marks.add(answer.gap + allpass, 0)
      marks.add(answer.gap + 2 * allpass, second)
      marks.add(answer.gap + HALL_LOOPS[i], trip + through)
      marks.add(answer.gap + HALL_LOOPS[i] + allpass, trip)
    }
  },
})

// --- Ether Reverb -------------------------------------------------------------

/** The eight combs of `freeverb.h` and the four allpasses after them, in samples at 44.1 kHz. */
const ETHER_COMBS = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617] as const
const ETHER_ALLPASSES = [556, 441, 341, 225] as const
const ETHER_MEAN_COMB =
  ETHER_COMBS.reduce((sum, samples) => sum + samples, 0) / ETHER_COMBS.length / 44100
/**
 * The eight combs feed back alike, so each falls 60 dB in a time that goes
 * with its length, the longest 1.45 times as slowly as the shortest. Heard
 * together they take this much longer than the mean comb: 1.067. Measured on
 * the device at its defaults: 1.8 to 1.9 s where the mean comb says 1.7.
 */
export const ETHER_TOGETHER = fallTogether(ETHER_COMBS)
/**
 * Every way through the four allpasses, in samples added. `AllpassFilter`
 * gives a sound back at once and, as loud, after its length, so each echo
 * of a comb arrives sixteen times over within 35 ms.
 */
const ETHER_SMEAR: readonly number[] = ETHER_ALLPASSES.reduce<number[]>(
  (ways, length) => ways.flatMap((samples) => [samples, samples + length]),
  [0],
)

/**
 * `EtherReverbDevice::reverb_parameters_for` and the scaling in `freeverb.h`:
 * what the combs feed back, and the coefficient of the damping in them.
 */
export function etherLaw(
  decay: number,
  size: number,
  damping: number,
  frozen: boolean,
): { feedback: number; damp: number } {
  if (frozen) return { feedback: 1, damp: 0 }
  const decayFactor = (decay - 0.5) / 29.5
  const roomSize = Math.min(1, size + decayFactor * 0.3)
  const damp = Math.max(0, damping - decayFactor * 0.2)
  return { feedback: roomSize * 0.28 + 0.7, damp: damp * 0.4 }
}

/** How long Ether's room takes to fall 60 dB at a frequency: the mean comb with its feedback and its damping, and the eight heard together. */
export function etherRt60(
  decay: number,
  size: number,
  damping: number,
  frozen: boolean,
  hz: number,
  rate: number,
): number {
  const { feedback, damp } = etherLaw(decay, size, damping, frozen)
  if (frozen) return Infinity
  return (
    ETHER_TOGETHER *
    loopRt60(ETHER_MEAN_COMB, 20 * Math.log10(feedback) + onePoleLossDb(damp, hz, rate))
  )
}

const etherReverb = room({
  params: ['mix', 'decay', 'damping', 'predelayMs', 'size', 'freeze'],
  info: 'Above, the first moments after a sound goes in: the dry sound, the gap, then the combs answering, dense from the start. Below, the tail falling 60 dB on a scale of seconds, the highs dying sooner inside it. With Freeze on the tail runs level and the dashed line is what it falls at once let go.',
  first: 0.3,
  span: 6,
  decay: 'decay',
  mix: 'mix',
  predelay: 'predelayMs',
  damping: 'damping',
  // `EtherReverbDevice::process`: dry·(1 − mix) + wet·mix.
  wetOf: (mix) => gainToDb(mix),
  answer(view, rate) {
    const mix = view.value('mix')
    const gap = view.value('predelayMs') / 1000
    const held = view.value('freeze') >= 0.5
    const at = (hz: number): number =>
      etherRt60(view.value('decay'), view.value('size'), view.value('damping'), false, hz, rate)
    return {
      // A held room mutes the dry sound.
      dry: held ? FLOOR_DB : gainToDb(1 - mix),
      wet: gainToDb(mix),
      gap,
      onset: gap + ETHER_COMBS[0] / 44100,
      body: at(BODY_HZ),
      top: at(TOP_HZ),
      low: NaN,
      held,
    }
  },
  reflections(view, rate, answer, marks) {
    // A held room lets nothing new in.
    if (answer.held) return
    const { feedback, damp } = etherLaw(
      view.value('decay'),
      view.value('size'),
      view.value('damping'),
      false,
    )
    const trip = 20 * Math.log10(feedback) + onePoleLossDb(damp, BODY_HZ, rate)
    // Each comb's echo on every trip the first moments hold, through every way of the allpasses.
    for (const samples of ETHER_COMBS) {
      for (let n = 1; (n * samples) / 44100 <= 0.3; n++) {
        const at = answer.gap + (n * samples) / 44100
        for (const smear of ETHER_SMEAR) marks.add(at + smear / 44100, (n - 1) * trip)
      }
    }
  },
})

// --- Spring -------------------------------------------------------------------

/** The constants of `spring_reverb.h`. */
const SPRING_TRANSITION_HZ = 4600
const SPRING_ROUND_TRIPS = [0.0412, 0.0356, 0.0479] as const
const SPRING_SLACK = 0.45
const SPRING_TAUT = 0.8
const SPRING_OFFSETS = [0, 0.02, -0.02] as const
const SPRING_STAGES = 100
const SPRING_TREBLE_LOSS = 0.6
const SPRING_LINE_MOST = 1024 - 8
const SPRING_DRIP_HZ = 2200
const SPRING_DRIP_GAIN = 4
/** What each spring is fed in each setting of Springs. */
const SPRING_FEED = [
  [1, 0, 0],
  [0.75, 0.75, 0],
  [0.62, 0.62, 0.62],
] as const
/** The pieces each bounce's sweep is drawn in. */
const SPRING_PIECES = 6
/** The most trips of one spring that are drawn. */
const SPRING_TRIPS = 24
/** The points of one bounce's outline. */
const SPRING_POINTS = SPRING_PIECES + 2

/** The rate the tank runs at: the device's rate over a whole number, so that half of it lands near the transition frequency. */
export function springRate(rate: number): number {
  return rate / clamp(Math.floor(rate / (2 * SPRING_TRANSITION_HZ) + 0.5), 1, 32)
}

/** The allpass coefficient of spring `n` at a Tension. */
const springCoefficient = (tension: number, n: number): number =>
  lerp(SPRING_SLACK, SPRING_TAUT, clamp(tension, 0, 1)) + SPRING_OFFSETS[n]

/**
 * The samples (at the tank's rate) the cascade of a hundred allpasses
 * `(a + z⁻¹) / (1 + a·z⁻¹)` holds a frequency back: its group delay at `w`
 * radians a sample. It grows with frequency, which is the spring's chirp.
 */
export function springCascade(a: number, w: number): number {
  return (SPRING_STAGES * (1 - a * a)) / (1 + a * a + 2 * a * Math.cos(w))
}

/** The frequency (radians a sample) the cascade holds back by `samples`: `springCascade` the other way round. */
function springCascadeAt(a: number, samples: number): number {
  return Math.acos(clamp(((SPRING_STAGES * (1 - a * a)) / samples - 1 - a * a) / (2 * a), -1, 1))
}

/** One spring as `SpringReverb::control` sets it: the line that makes up its round trip, its loop gain and its damping. */
function springLoop(n: number, decay: number, tension: number, rate: number) {
  const low = springRate(rate)
  const a = springCoefficient(tension, n)
  const trip = SPRING_ROUND_TRIPS[n] * low
  const gain = Math.pow(10, (-3 * trip) / (decay * low))
  return {
    low,
    a,
    line: clamp(trip - springCascade(a, 0), 4, SPRING_LINE_MOST),
    half: clamp(Math.floor(0.5 * trip + 0.5), 1, SPRING_LINE_MOST),
    gainDb: 20 * Math.log10(gain),
    damping: clamp(1 - Math.pow(gain, SPRING_TREBLE_LOSS), 0, 0.5),
  }
}

/**
 * How long a spring takes to fall 60 dB at a frequency: a trip round it is
 * the line and what the cascade holds that frequency back, and on each trip
 * it loses the loop gain and the damping.
 */
export function springRt60(
  decay: number,
  tension: number,
  hz: number,
  rate: number,
  n = 0,
): number {
  const loop = springLoop(n, decay, tension, rate)
  const w = (TWO_PI * Math.min(hz, loop.low * 0.499)) / loop.low
  return loopRt60(
    (loop.line + springCascade(loop.a, w)) / loop.low,
    loop.gainDb + onePoleLossDb(loop.damping, hz, loop.low),
  )
}

/** What Drip adds at a frequency, in dB: `x + drip · 4 · highpass(x)` with the high-pass at 2.2 kHz. */
export function springDripDb(drip: number, hz: number, rate: number): number {
  const a = Math.exp((-TWO_PI * SPRING_DRIP_HZ) / rate)
  const w = (TWO_PI * hz) / rate
  const under = 1 + a * a - 2 * a * Math.cos(w)
  const lowRe = ((1 - a) * (1 - a * Math.cos(w))) / under
  const lowIm = (-(1 - a) * a * Math.sin(w)) / under
  const amount = SPRING_DRIP_GAIN * clamp(drip, 0, 1)
  const re = 1 + amount * (1 - lowRe)
  const im = -amount * lowIm
  return 10 * Math.log10(re * re + im * im)
}

/** The top of what comes back from the tank: Tone, or 0.8 of the way to half the tank's rate, where its filters close. */
const springTopHz = (view: DisplayView, rate: number): number =>
  Math.min(view.value('tone'), 0.4 * springRate(rate))

const springMode = (view: DisplayView): number => clamp(Math.round(view.value('springs')), 0, 2)

/**
 * The bounces of the springs: each trip an echo, and each echo a sweep. The
 * lows of a bounce arrive together and its highs trail behind, further
 * behind on every trip, so a bounce is drawn as a wedge: upright where the
 * lows land, sloping away to where the top of the band lands. Its height
 * along the way is how much of the band arrives in that moment, which is
 * what Tension shapes; Drip lifts the trailing highs. The outline of every
 * wedge goes into `into`, eight points each; how many is handed back.
 */
function layBounces(
  view: DisplayView,
  rate: number,
  answer: Answer,
  level: number,
  box: Box,
  seconds: number,
  into: Float32Array,
): number {
  const decay = view.value('decay')
  const tension = view.value('tension')
  const drip = view.value('drip')
  const feeds = SPRING_FEED[springMode(view)]
  const topHz = springTopHz(view, rate)
  const x = (t: number): number => box.x + (t / seconds) * box.w
  const shares = new Float64Array(SPRING_PIECES)
  let wedges = 0
  for (let n = 0; n < feeds.length; n++) {
    if (feeds[n] <= 0) continue
    const loop = springLoop(n, decay, tension, rate)
    const still = springCascade(loop.a, 0)
    const wTop = (TWO_PI * topHz) / loop.low
    const trails = springCascade(loop.a, wTop) - still
    const feedDb = 20 * Math.log10(feeds[n])
    for (let trip = 0; trip < SPRING_TRIPS; trip++) {
      const lands = answer.gap + (still + loop.half + trip * (loop.line + still)) / loop.low
      const base = level + feedDb + trip * loop.gainDb
      if (lands > seconds || base < FOOT_DB) break
      if (2 * SPRING_POINTS * (wedges + 1) > into.length) break
      const spread = ((trip + 1) * trails) / loop.low
      // How much of the band lands in each piece of the sweep, and the most in any.
      let from = 0
      let most = -Infinity
      for (let piece = 0; piece < SPRING_PIECES; piece++) {
        const held = still + (trails * (piece + 1)) / SPRING_PIECES
        const to = piece === SPRING_PIECES - 1 ? wTop : springCascadeAt(loop.a, held)
        const hz = ((from + to) / 2 / TWO_PI) * loop.low
        const share =
          10 * Math.log10(Math.max(1e-6, ((to - from) / wTop) * SPRING_PIECES)) +
          trip * onePoleLossDb(loop.damping, hz, loop.low)
        if (share > most) most = share
        shares[piece] = share + springDripDb(drip, hz, rate)
        from = to
      }
      const at = 2 * SPRING_POINTS * wedges
      into[at] = x(lands)
      into[at + 1] = yOf(base + shares[0] - most, box)
      for (let piece = 0; piece < SPRING_PIECES; piece++) {
        into[at + 2 + 2 * piece] = x(lands + (spread * (piece + 0.5)) / SPRING_PIECES)
        into[at + 3 + 2 * piece] = yOf(base + shares[piece] - most, box)
      }
      into[at + 2 * SPRING_POINTS - 2] = x(lands + spread)
      into[at + 2 * SPRING_POINTS - 1] = into[at + 2 * SPRING_POINTS - 3]
      wedges += 1
    }
  }
  return wedges
}

/** Every wedge of `layBounces`: one fill and two strokes for them all. */
function paintBounces(frame: DisplayFrame, wedges: Float32Array, count: number, box: Box): void {
  if (count === 0) return
  const { ctx, colours } = frame
  const foot = box.y + box.h
  const outline = (part: 'whole' | 'front' | 'sweep'): void => {
    ctx.beginPath()
    for (let wedge = 0; wedge < count; wedge++) {
      const at = 2 * SPRING_POINTS * wedge
      if (part === 'sweep') ctx.moveTo(wedges[at], wedges[at + 1])
      else ctx.moveTo(wedges[at], foot)
      const points = part === 'front' ? 1 : SPRING_POINTS
      for (let i = 0; i < points; i++) ctx.lineTo(wedges[at + 2 * i], wedges[at + 2 * i + 1])
      if (part === 'whole') {
        ctx.lineTo(wedges[at + 2 * SPRING_POINTS - 2], foot)
        ctx.closePath()
      }
    }
  }
  ctx.fillStyle = colours.ink
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.lineJoin = 'round'
  ctx.lineCap = 'butt'
  ctx.setLineDash([])
  outline('whole')
  ctx.globalAlpha = INK.fill
  ctx.fill()
  // The slope of each bounce's sweep, lightly, and the moment it lands.
  outline('sweep')
  ctx.globalAlpha = INK.back
  ctx.stroke()
  outline('front')
  ctx.globalAlpha = INK.back
  ctx.stroke()
  ctx.globalAlpha = 1
}

const SPRING_FIRST_SEC = 0.4

const springReverb = room({
  params: ['mix', 'decay', 'tension', 'springs', 'tone', 'drip', 'predelay'],
  info: 'Above, the first moments after a sound goes in: every bounce of the springs, its highs trailing further behind on each trip as Tension and Drip shape them. Below, the tail falling 60 dB on a scale of seconds, the highs dying sooner inside it. The figure is the time it takes.',
  first: SPRING_FIRST_SEC,
  span: 6,
  decay: 'decay',
  mix: 'mix',
  predelay: 'predelay',
  // `kit::equal_power`: dry·cos(mix·π/2) + wet·sin(mix·π/2).
  wetOf: (mix) => gainToDb(Math.sin((clamp(mix, 0, 1) * Math.PI) / 2)),
  answer(view, rate) {
    const mix = clamp(view.value('mix'), 0, 1)
    const gap = view.value('predelay') / 1000
    const decay = view.value('decay')
    const tension = view.value('tension')
    const feeds = SPRING_FEED[springMode(view)]
    // The pickup is half way round: the first sound is half a trip of the shortest spring that is fed.
    let first = Infinity
    for (let n = 0; n < feeds.length; n++) {
      if (feeds[n] <= 0) continue
      const loop = springLoop(n, decay, tension, rate)
      first = Math.min(first, (springCascade(loop.a, 0) + loop.half) / loop.low)
    }
    return {
      dry: mix >= 1 ? FLOOR_DB : gainToDb(Math.cos((mix * Math.PI) / 2)),
      wet: gainToDb(Math.sin((mix * Math.PI) / 2)),
      gap,
      onset: gap + first,
      body: springRt60(decay, tension, BODY_HZ, rate),
      top: springRt60(decay, tension, springTopHz(view, rate), rate),
      low: NaN,
      held: false,
    }
  },
  lay: (view, rate, answer, level, box, into) =>
    layBounces(view, rate, answer, level, box, SPRING_FIRST_SEC, into),
  paint: paintBounces,
})

// --- Convolver Reverb ---------------------------------------------------------

/** The power the generated impulse's envelope is raised to: `(1 − i / length) ** 2.5` in `generateHallImpulse`. */
const CONVOLVER_POWER = 2.5
/** The seconds the convolver's picture spans: a little more than its impulse. */
const CONVOLVER_SPAN = 3

/**
 * The level of the generated impulse `seconds` after a sound, in dB against
 * its start (`generateHallImpulse`): noise under `(1 − t / length) ** 2.5`,
 * which on a scale of decibels is no straight slope: it leans over slowly
 * and then drops away to nothing at the impulse's end.
 */
export function convolverDb(seconds: number): number {
  const left = 1 - seconds / REVERB_DECAY_SECONDS
  return left > 1e-6 ? 20 * CONVOLVER_POWER * Math.log10(left) : FLOOR_DB
}

/** The seconds after which that is `db` down. */
export function convolverSeconds(db: number): number {
  return REVERB_DECAY_SECONDS * (1 - Math.pow(10, -db / (20 * CONVOLVER_POWER)))
}

/** The box a strip draws in, with room at its left for the level that comes out. */
const stripBox = (view: Pick<DisplayView, 'width' | 'height'>): Box => ({
  x: 6 + METER_WIDTH,
  y: 5,
  w: view.width - 10 - METER_WIDTH,
  h: view.height - 9 - SCALE_HEIGHT,
})

function convolverHandles(view: DisplayView): DisplayHandle[] {
  const box = stripBox(view)
  const wet = gainToDb(view.value('wet'))
  const lowestY = yOf(LOWEST_WET_DB, box)
  return [
    {
      key: 'wet',
      name: 'Wet',
      x: box.x,
      y: yOf(Math.max(wet, LOWEST_WET_DB), box),
      drag: (_x, y) => {
        if (y >= lowestY - 0.25) {
          return { wet: wet <= LOWEST_WET_DB ? view.value('wet') : (view.spec('wet')?.min ?? 0) }
        }
        return { wet: clamp(Math.pow(10, dbOfY(y, box, TOP_DB, FOOT_DB) / 20), 0, 1) }
      },
      reset: () => ({ wet: defaultOf(view, 'wet') }),
    },
  ]
}

const CONVOLVER_PARAMS = ['wet'] as const

interface ConvolverState {
  ride: Ride
  seen: Float64Array
  curve: Point[]
}

/**
 * The convolver: one fixed room, so one fixed curve, and Wet sets how high
 * it starts. It has no dry side, no gap and no first reflections: the
 * impulse is noise from its first sample on, the same at every frequency.
 */
const convolverReverb = plateDisplay<ConvolverState>({
  place: 'strip',
  params: CONVOLVER_PARAMS,
  live: { signal: true },
  info: 'Level against time from the moment a sound stops: this reverb is one fixed room, whose tail leans over slowly and drops away 2.6 seconds on. The figure is the time it takes to fall 60 dB. Drag the start up or down for how loud it is.',
  init: () => ({ ride: newRide(CONVOLVER_SPAN), seen: unseen(CONVOLVER_PARAMS), curve: [] }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const box = stripBox(frame)
    const foot = box.y + box.h
    const wet = gainToDb(frame.value('wet'))
    const level = Math.max(wet, LOWEST_WET_DB)
    if (moved(frame, 0, CONVOLVER_PARAMS, state.seen)) {
      // The curve as far as the foot, and the moment it gets there.
      const reach = convolverSeconds(level - FOOT_DB)
      const curve: Point[] = []
      for (let x = 0; x <= box.w + 2; x += 2) {
        const seconds = Math.min(reach, (x / box.w) * CONVOLVER_SPAN)
        curve.push([
          box.x + (seconds / CONVOLVER_SPAN) * box.w,
          yOf(level + convolverDb(seconds), box),
        ])
        if (seconds >= reach) break
      }
      state.curve = curve
    }
    hear(frame, state.ride, convolverSeconds(60))

    dbGrid(frame, box, TOP_DB, FOOT_DB, 20)
    timeScale(frame, box, CONVOLVER_SPAN, frame.height - 3.5, true)
    rule(ctx, box.x, foot, box.x + box.w, foot, { colour: colours.ink, alpha: INK.rule })
    clipped(ctx, box, () => {
      fillTo(ctx, state.curve, foot, colours.ink, INK.fill)
      trace(ctx, state.curve, { colour: colours.ink })
    })
    drawFall(frame, state.ride, box, CONVOLVER_SPAN, level)
    // The impulse's end, where there is nothing left at all.
    const end = box.x + (REVERB_DECAY_SECONDS / CONVOLVER_SPAN) * box.w
    rule(ctx, end, foot - 3, end, foot, { colour: colours.ink, alpha: INK.back })
    drawMeter(frame, state.ride, 4, box)

    for (const point of convolverHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
    const words =
      frame.hot !== 'wet'
        ? secondsText(convolverSeconds(60))
        : wet > FLOOR_DB
          ? `${Math.round(wet)}dB`
          : 'off'
    text(frame, words, box.x + box.w - 1, box.y + 8, { align: 'right', size: 9 })
  },
  handles: convolverHandles,
})

// --- Shaped Reverb ------------------------------------------------------------

/** The constants of `shaped_reverb.h`. */
const SHAPED_MOST_TAPS = 256
const SHAPED_FLOOR_SEC = 0.001
const SHAPED_COLOUR_HZ = 900
const SHAPED_TAIL_DAMP_SHARE = 0.5
const SHAPED_TAIL_LOW_HZ = 140
/** The tail's eight lines in seconds, which `kit::spread_lengths` lays out from 99.1 to 316.7 ms in equal ratios, and their mean. */
const SHAPED_TAIL_LINES = [0, 1, 2, 3, 4, 5, 6, 7].map(
  (line) => 0.0991 * Math.pow(0.3167 / 0.0991, line / 7),
)
const SHAPED_TAIL_PASS =
  SHAPED_TAIL_LINES.reduce((sum, seconds) => sum + seconds, 0) / SHAPED_TAIL_LINES.length
/** The most steps the level is worked out in: one a pixel. */
const SHAPED_STEPS = 1024

/**
 * Where in its cell each tap of the left side falls: `jitter_[0]`, drawn by
 * `kit::Rng` (a 32-bit xorshift) from the device's own seed, so the marks
 * stand where the echoes are.
 */
const SHAPED_JITTER: Float32Array = (() => {
  const jitter = new Float32Array(SHAPED_MOST_TAPS)
  let state = 0x3c6ef372
  const uniform = (): number => {
    state = (state ^ (state << 13)) >>> 0
    state = (state ^ (state >>> 17)) >>> 0
    state = (state ^ (state << 5)) >>> 0
    return (state >>> 8) / 16777216
  }
  for (let k = 0; k < SHAPED_MOST_TAPS; k++) {
    jitter[k] = uniform()
    // A tap's sign, its colour group and its side are drawn after its place.
    uniform()
    uniform()
    uniform()
  }
  return jitter
})()

/** The Shape as an amplitude at `u` along the span: `ShapedReverb::shape_gain`. Gate, Reverse, Bloom, Fall, Pulse. */
export function shapedGain(shape: number, u: number): number {
  if (!(u >= 0 && u <= 1)) return 0
  switch (shape) {
    case 1:
      return Math.exp(-3.22 * (1 - u)) * Math.min(1, 12 * u)
    case 2:
      return Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(u, 0.8))), 1.2)
    case 3:
      return 1 - u
    case 4: {
      const wave = Math.sin(3 * Math.PI * u)
      return Math.pow(wave * wave, 0.75) * (1 - 0.3 * u)
    }
    default:
      return 1
  }
}

/** How many echoes make the shape: `ShapedReverb::taps_for`. */
export function shapedTaps(density: number, seconds: number): number {
  const rate = 8 * Math.pow(260 / 8, density)
  return clamp(Math.floor(rate * seconds + 0.5), 4 + Math.floor(44 * density), SHAPED_MOST_TAPS)
}

/** How long the allpasses in front draw each echo out: `ShapedReverb::smear_for`. */
export function shapedSmear(seconds: number, taps: number): number {
  return Math.min(clamp((1.8 * seconds) / taps, 0.008, 0.045), 0.25 * seconds)
}

/** The seconds after the sound that echo `k` of `taps` arrives: its place in `ShapedReverb::build`, and the smear the allpasses hold it back by. */
export function shapedTapSeconds(k: number, taps: number, seconds: number, pre: number): number {
  const smear = shapedSmear(seconds, taps)
  return pre + SHAPED_FLOOR_SEC + ((k + SHAPED_JITTER[k]) / taps) * (seconds - smear) + smear
}

/** The seconds the tail after the shape takes to fall 60 dB: `0.6 · 10^Tail` in `ShapedReverb::control`. */
export const shapedTailRt60 = (tail: number): number => 0.6 * Math.pow(10, tail)

/** The level the tail settles at against a shape that is held, as a gain: `ShapedReverb::tail_level_for`. */
export const shapedTailLevel = (tail: number): number =>
  tail <= 0 ? 0 : 0.95 * Math.pow(tail, 0.765)

/** The level the shape's top comes out at, dB: `kit::equal_power`, and what Repeat takes back, `(1 − repeat²)^¼`. */
export function shapedWetDb(mix: number, repeat: number): number {
  return gainToDb(Math.sin((clamp(mix, 0, 1) * Math.PI) / 2) * Math.pow(1 - repeat * repeat, 0.25))
}

/** A one-pole low-pass `kit::OnePole` set to `cutoff`, at a frequency: the real and imaginary parts of what it passes. */
function onePoleAt(cutoff: number, hz: number, rate: number): { re: number; im: number } {
  const a = Math.exp((-TWO_PI * clamp(cutoff, 0, rate * 0.49)) / rate)
  const w = (TWO_PI * hz) / rate
  const under = 1 + a * a - 2 * a * Math.cos(w)
  return {
    re: ((1 - a) * (1 - a * Math.cos(w))) / under,
    im: (-(1 - a) * a * Math.sin(w)) / under,
  }
}

/** What the shaped reverb does to one frequency, each as a share of its power. */
interface ShapedBand {
  /** High Cut and Low Cut on the whole of the wet sound: two poles each. */
  cut: number
  /** Colour on the early echoes and on the late ones. */
  early: number
  late: number
  /** What a trip round the Repeat loop keeps, less the Repeat setting itself. */
  loop: number
  /** What gets into the tail. */
  feed: number
  /** What the tail loses a second, as a rate of its power. */
  fall: number
}

function shapedBand(view: DisplayView, hz: number, rate: number): ShapedBand {
  const high = view.value('highCut')
  const low = view.value('lowCut')
  const colour = view.value('colour')
  const warp = (f: number): number => Math.tan((Math.PI * clamp(f, 5, rate * 0.49)) / rate)
  const over = Math.pow(warp(hz) / warp(high), 4)
  const under = Math.pow(warp(low) / warp(hz), 4)
  // A treble shelf on one group: the group mixed towards a low-pass of itself.
  const amount = 1 - Math.pow(10, -1.2 * Math.abs(colour))
  const dull = onePoleAt(SHAPED_COLOUR_HZ, hz, rate)
  const shelf = (1 - amount + amount * dull.re) ** 2 + (amount * dull.im) ** 2
  const loopHigh = onePoleAt(high, hz, rate)
  const loopLow = onePoleAt(low, hz, rate)
  const thin = onePoleAt(SHAPED_TAIL_LOW_HZ, hz, rate)
  const damp = onePoleAt(SHAPED_TAIL_DAMP_SHARE * high, hz, rate)
  const kept = damp.re * damp.re + damp.im * damp.im
  const rt60 = shapedTailRt60(view.value('tail'))
  return {
    cut: 1 / (1 + over) / (1 + under),
    early: colour > 0 ? shelf : 1,
    late: colour < 0 ? shelf : 1,
    loop:
      (loopHigh.re * loopHigh.re + loopHigh.im * loopHigh.im) *
      ((1 - loopLow.re) ** 2 + loopLow.im * loopLow.im),
    // The tail is read through its damping before it is heard, and fed thinned.
    feed: kept * ((1 - thin.re) ** 2 + thin.im * thin.im),
    // 60 dB in its time, and the damping once more on every pass of a line.
    fall:
      (Math.LN10 / 10) * (60 / rt60 - (10 * Math.log10(Math.max(kept, 1e-9))) / SHAPED_TAIL_PASS),
  }
}

/** The settings the picture is laid out by. */
interface ShapedLayout {
  shape: number
  time: number
  taps: number
  smear: number
  /** Seconds after the sound that the shape starts and ends. */
  from: number
  to: number
  /** Seconds the box spans. */
  seconds: number
  repeat: number
  tail: number
  wet: number
  dry: number
}

/**
 * How far across its box the shape ends for a Time knob at `at`. Time spans
 * a factor of forty, which no one scale of seconds can hold, so here the
 * knob places the end (28 % across at the shortest, 60 % at the longest) and
 * the scale stretches to make it true; the rest of the box is what comes
 * after the shape.
 */
const SHAPED_END = [0.28, 0.6] as const
const shapedEnd = (at: number): number => lerp(SHAPED_END[0], SHAPED_END[1], clamp(at, 0, 1))

function shapedLayout(view: DisplayView): ShapedLayout {
  const shape = clamp(Math.round(view.value('shape')), 0, 4)
  const time = view.value('time')
  const pre = view.value('preDelay') / 1000
  const taps = shapedTaps(view.value('density'), time)
  const smear = shapedSmear(time, taps)
  const repeat = clamp(view.value('repeat'), 0, 0.95)
  const mix = clamp(view.value('mix'), 0, 1)
  const to = pre + SHAPED_FLOOR_SEC + time
  return {
    shape,
    time,
    taps,
    smear,
    from: pre + SHAPED_FLOOR_SEC + smear,
    to,
    seconds: to / shapedEnd(view.at('time')),
    repeat,
    tail: view.value('tail'),
    wet: shapedWetDb(mix, repeat),
    dry: mix >= 1 ? FLOOR_DB : gainToDb(Math.cos((mix * Math.PI) / 2)),
  }
}

/** The odds an echo at `u` along the shape is of the late colour group: none in the first tenth, all in the last (`ShapedReverb::build`). */
function shapedLate(u: number): number {
  const along = clamp((u - 0.1) * 1.25, 0, 1)
  return along * along * (3 - 2 * along)
}

/**
 * The level of the wet sound at one frequency, in dB against the shape's
 * top, at `steps + 1` moments evenly across `layout.seconds`, into `out`.
 * Three things add up, as powers: the shape itself (`shape_gain` squared,
 * through Colour); the shape coming round again every Time, each trip down
 * by Repeat and by the loop's filters; and the tail, an eight-line network
 * the shaped sound feeds. The tail hears the shape a line later, each line
 * in its own time, fills and empties at the rate of its decay, and stands at
 * `tail_level_for` under a shape that is held. `tail` gets the tail alone.
 */
function shapedLevels(
  layout: ShapedLayout,
  band: ShapedBand,
  steps: number,
  power: Float32Array,
  out: Float32Array,
  tail: Float32Array,
): void {
  const step = layout.seconds / steps
  const span = layout.time - layout.smear
  const each = layout.repeat * layout.repeat * band.loop
  for (let i = 0; i <= steps; i++) {
    const t = i * step
    let sum = 0
    let trip = 1
    for (let n = 0; n < 16 && trip > 1e-7; n++) {
      let u = (t - layout.from - n * layout.time) / span
      // The smear between one time round and the next is no gap to hear.
      if (u < 0 && n > 0 && u >= -layout.smear / span) u = 0
      if (u < 0) break
      if (u <= 1) {
        const gain = shapedGain(layout.shape, u)
        const late = shapedLate(u)
        sum += trip * gain * gain * ((1 - late) * band.early + late * band.late)
      }
      trip *= each
    }
    power[i] = sum
  }
  const level = shapedTailLevel(layout.tail)
  const fills =
    (1 - Math.exp((-step * 6 * Math.LN10) / shapedTailRt60(layout.tail))) / SHAPED_TAIL_LINES.length
  const keeps = Math.exp(-step * band.fall)
  let held = 0
  for (let i = 0; i <= steps; i++) {
    let heard = 0
    for (const line of SHAPED_TAIL_LINES) {
      const from = i - Math.round(line / step)
      if (from >= 0) heard += power[from]
    }
    held = held * keeps + fills * band.feed * heard
    const rings = band.cut * level * level * held
    const whole = band.cut * power[i] + rings
    out[i] = whole > 1e-12 ? 10 * Math.log10(whole) : FLOOR_DB
    tail[i] = rings > 1e-12 ? 10 * Math.log10(rings) : FLOOR_DB
  }
}

const shapedShownWet = (layout: ShapedLayout): number => Math.max(layout.wet, LOWEST_WET_DB)

const shapedSteps = (box: Box): number => clamp(Math.round(box.w), 8, SHAPED_STEPS)

/** Where the Tail handle stands: on the tail once every one of its lines has heard the whole shape, or at the box's end. */
function shapedTailStep(layout: ShapedLayout, steps: number): number {
  const longest = SHAPED_TAIL_LINES[SHAPED_TAIL_LINES.length - 1]
  return Math.min(steps - 3, Math.round(((layout.to + longest) / layout.seconds) * steps))
}

/** Scratch for laying out the handles, which have no state of their own. */
const SHAPED_SCRATCH = [0, 1, 2].map(() => new Float32Array(SHAPED_STEPS + 1))

function shapedHandles(view: DisplayView): DisplayHandle[] {
  const box = stripBox(view)
  const layout = shapedLayout(view)
  const level = shapedShownWet(layout)
  const foot = box.y + box.h
  const lowestY = yOf(LOWEST_WET_DB, box)
  const across = shapedEnd(view.at('time')) * box.w
  const timeSpec = view.spec('time')
  const steps = shapedSteps(box)
  const tailStep = shapedTailStep(layout, steps)
  // The tail alone where its handle stands, in dB, at a setting of Tail.
  const tailAt = (value: number): number => {
    const [power, whole, tail] = SHAPED_SCRATCH
    const other = withParam(view, 'tail', value)
    shapedLevels(
      { ...layout, tail: value },
      shapedBand(other, BODY_HZ, rateOf(view)),
      steps,
      power,
      whole,
      tail,
    )
    return level + tail[tailStep]
  }
  const tailDb = tailAt(layout.tail)
  return [
    {
      key: 'start',
      name: 'Pre-delay and mix',
      x: box.x + (layout.from / layout.to) * across,
      y: yOf(level, box),
      drag: (x, y) => {
        // The end of the shape stays where it is, so the start alone says the gap.
        const share = clamp((x - box.x) / across, 0, 0.99)
        const gap = (share * layout.time - layout.smear) / (1 - share) - SHAPED_FLOOR_SEC
        const spec = view.spec('preDelay')
        return {
          preDelay: clamp(gap * 1000, spec?.min ?? 0, spec?.max ?? 250),
          mix:
            y >= lowestY - 0.25
              ? layout.wet <= LOWEST_WET_DB
                ? view.value('mix')
                : (view.spec('mix')?.min ?? 0)
              : solveParam(
                  view,
                  'mix',
                  (mix) => shapedWetDb(mix, layout.repeat),
                  dbOfY(y, box, TOP_DB, FOOT_DB),
                ),
        }
      },
      reset: () => ({ preDelay: defaultOf(view, 'preDelay'), mix: defaultOf(view, 'mix') }),
    },
    {
      key: 'end',
      name: 'Time',
      x: box.x + across,
      y: yOf(level, box),
      drag: (x) => ({
        time: timeSpec
          ? denormalizeParam(
              timeSpec,
              clamp(((x - box.x) / box.w - SHAPED_END[0]) / (SHAPED_END[1] - SHAPED_END[0]), 0, 1),
            )
          : layout.time,
      }),
      reset: () => ({ time: defaultOf(view, 'time') }),
    },
    {
      key: 'tail',
      name: 'Tail',
      x: box.x + (tailStep / steps) * box.w,
      y: yOf(tailDb, box),
      drag: (_x, y) => {
        if (y >= foot - 0.25) return { tail: tailDb <= FOOT_DB ? layout.tail : 0 }
        // The Tail that puts the tail at that level here: more of it is louder and longer.
        return { tail: solveParam(view, 'tail', tailAt, dbOfY(y, box, TOP_DB, FOOT_DB)) }
      },
      reset: () => ({ tail: defaultOf(view, 'tail') }),
    },
  ]
}

interface ShapedState {
  ride: Ride
  marks: Marks
  seen: Float64Array
  power: Float32Array
  body: Float32Array
  top: Float32Array
  tail: Float32Array
  /** The picture as it was last laid out. */
  layout: ShapedLayout | null
  bodyRuns: Point[][]
  topRuns: Point[][]
  tailRuns: Point[][]
  handles: readonly DisplayHandle[]
  /** The right end and the baseline of the figure, and whether no line runs where it stands. */
  wordsX: number
  wordsY: number
  wordsClear: boolean
}

/** The parts of a line of levels that stand above the foot, each with its feet on it, so a gate's sides are upright. */
function runsAbove(levels: Float32Array, steps: number, box: Box, levelDb: number): Point[][] {
  const runs: Point[][] = []
  const foot = box.y + box.h
  let run: Point[] | null = null
  for (let i = 0; i <= steps; i++) {
    const x = box.x + (i / steps) * box.w
    const db = levelDb + levels[i]
    if (db > FOOT_DB + 0.05) {
      if (!run) {
        run = i > 0 ? [[x, foot]] : []
        runs.push(run)
      }
      run.push([x, yOf(db, box)])
    } else if (run) {
      run.push([box.x + ((i - 1) / steps) * box.w, foot])
      run = null
    }
  }
  return runs
}

/** The settings the shaped reverb's picture is laid out from: all it reads. */
const SHAPED_PARAMS = [
  'shape',
  'time',
  'density',
  'preDelay',
  'colour',
  'highCut',
  'lowCut',
  'repeat',
  'tail',
  'mix',
] as const

/** Work the shaped reverb's picture out from its settings: done when one of them moves. */
function layShaped(view: DisplayView, rate: number, box: Box, state: ShapedState): void {
  const layout = shapedLayout(view)
  const level = shapedShownWet(layout)
  const steps = shapedSteps(box)
  const bodyBand = shapedBand(view, BODY_HZ, rate)
  shapedLevels(layout, shapedBand(view, TOP_HZ, rate), steps, state.power, state.top, state.tail)
  shapedLevels(layout, bodyBand, steps, state.power, state.body, state.tail)
  state.layout = layout
  state.bodyRuns = runsAbove(state.body, steps, box, level)
  state.topRuns = runsAbove(state.top, steps, box, level)
  state.tailRuns = runsAbove(state.tail, steps, box, level)
  // The echoes of the shape's first time round, each as high as the shape is there.
  state.marks.clear(box.w, layout.seconds)
  const cut = 10 * Math.log10(bodyBand.cut)
  for (let k = 0; k < layout.taps; k++) {
    const u = (k + SHAPED_JITTER[k]) / layout.taps
    const gain = shapedGain(layout.shape, u)
    if (gain <= 0) continue
    const late = shapedLate(u)
    state.marks.add(
      shapedTapSeconds(k, layout.taps, layout.time, layout.from - layout.smear - SHAPED_FLOOR_SEC),
      cut +
        20 * Math.log10(gain) +
        10 * Math.log10((1 - late) * bodyBand.early + late * bodyBand.late),
    )
  }
  state.handles = shapedHandles(view)
  // The figure stands in the corner, left of the Tail handle when that
  // stands at the box's end. Where repeats or a long tail hold the line up
  // there it goes under the line, on a patch of the plate that keeps the
  // fainter lines from running through it.
  const right = box.x + box.w - 1
  const tailX = state.handles[2].x
  state.wordsX = tailX > right - 30 ? tailX - 6 : right
  const last = Math.round(((state.wordsX - box.x) / box.w) * steps)
  let highest = FOOT_DB
  let lowest = TOP_DB
  for (let i = Math.max(0, last - Math.round((26 / box.w) * steps)); i <= last; i++) {
    highest = Math.max(highest, level + state.body[i])
    lowest = Math.min(lowest, level + state.body[i])
  }
  const under = yOf(lowest, box) + 10
  state.wordsClear = yOf(highest, box) >= box.y + 11
  state.wordsY = !state.wordsClear && under <= box.y + box.h - 1 ? under : box.y + 8
}

/**
 * The shaped reverb: its level over time is drawn, not decayed, so the shape
 * is the picture. The echoes that make it stand as marks at their own
 * moments, as many as Density asks for; the line over them is the level in
 * the body of the sound and the fainter one the level of the highs, which
 * Colour takes from the early or the late echoes. After the shape, on the
 * same scale: the repeats and the tail. Its scale of seconds stretches with
 * Time, which spans a factor of forty: the shape's end stands at 28 % of the
 * box at the shortest and 60 % at the longest, so a longer shape is a wider
 * one and the scale says by how much.
 */
const shapedReverb = plateDisplay<ShapedState>({
  place: 'strip',
  params: SHAPED_PARAMS,
  live: { signal: true },
  info: 'Level against time from the moment a sound goes in: the marks are the echoes that make the shape, the line over them their level, and after it come its repeats and, dashed, its tail. Drag the start for pre-delay and mix, the end for time, the point after it for the tail.',
  init: () => ({
    ride: newRide(8),
    marks: new Marks(),
    seen: unseen(SHAPED_PARAMS),
    power: new Float32Array(SHAPED_STEPS + 1),
    body: new Float32Array(SHAPED_STEPS + 1),
    top: new Float32Array(SHAPED_STEPS + 1),
    tail: new Float32Array(SHAPED_STEPS + 1),
    layout: null,
    bodyRuns: [],
    topRuns: [],
    tailRuns: [],
    handles: [],
    wordsX: 0,
    wordsY: 0,
    wordsClear: true,
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    drawnRate = frame.sampleRate
    ground(frame)
    const box = stripBox(frame)
    const foot = box.y + box.h
    if (moved(frame, frame.sampleRate, SHAPED_PARAMS, state.seen) || !state.layout) {
      layShaped(frame, frame.sampleRate, box, state)
    }
    const layout = state.layout ?? shapedLayout(frame)
    const level = shapedShownWet(layout)
    hear(frame, state.ride, layout.time)

    dbGrid(frame, box, TOP_DB, FOOT_DB, 20)
    timeScale(frame, box, layout.seconds, frame.height - 3.5, true)
    rule(ctx, box.x, foot, box.x + box.w, foot, { colour: colours.ink, alpha: INK.rule })

    clipped(ctx, box, () => {
      for (const run of state.bodyRuns) fillTo(ctx, run, foot, colours.ink, INK.fill)
      strokeMarks(frame, state.marks, box, level, INK.back)
      for (const run of state.topRuns) {
        trace(ctx, run, { colour: colours.ink, width: 1, alpha: INK.back })
      }
      // The tail alone, filling up under the shape and its repeats.
      for (const run of state.tailRuns) {
        trace(ctx, run, { colour: colours.ink, width: 1, alpha: INK.text, dash: [2, 2] })
      }
    })
    clipped(ctx, box, () => {
      for (const run of state.bodyRuns) trace(ctx, run, { colour: colours.ink })
    })
    drawSince(frame, state.ride, box, layout.seconds)
    dryMark(frame, box, layout.dry)
    drawMeter(frame, state.ride, 4, box)

    // The frame the shape is drawn in: its length and the level of its top.
    const points = state.handles
    if (points.length >= 2) {
      rule(ctx, points[0].x, points[0].y, points[1].x, points[1].y, {
        colour: colours.ink,
        alpha: INK.back,
        dash: [1, 2],
      })
    }
    const words =
      frame.hot === 'start' ? `${Math.round(frame.value('preDelay'))}ms` : secondsText(layout.time)
    if (!state.wordsClear) {
      const wide = words.length * 5.5 + 3
      fillRect(
        ctx,
        { x: state.wordsX + 1 - wide, y: state.wordsY - 8, w: wide, h: 10 },
        colours.plate,
        INK.back,
      )
    }
    text(frame, words, state.wordsX, state.wordsY, { align: 'right', size: 9 })
    for (const point of points) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: shapedHandles,
})

export const REVERB_FACES: Readonly<Record<string, PlateFace>> = {
  'convolver-reverb': { display: convolverReverb, face: ['wet'] },
  'plate-reverb': {
    display: plateReverb,
    face: ['decay', 'damping', 'predelayMs', 'mix'],
  },
  'fdn-reverb': {
    display: fdnReverb,
    face: ['decay', 'size', 'breathDepth', 'mix'],
  },
  'hall-reverb': {
    display: hallReverb,
    face: ['midDecay', 'lowDecay', 'crossover', 'mix'],
  },
  'spring-reverb': {
    display: springReverb,
    face: ['decay', 'tension', 'drip', 'mix'],
  },
  'shaped-reverb': {
    display: shapedReverb,
    face: ['shape', 'time', 'density', 'mix'],
  },
  'ether-reverb': {
    display: etherReverb,
    face: ['decay', 'size', 'freeze', 'mix'],
  },
}
