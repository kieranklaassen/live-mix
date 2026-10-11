// The display of Haze: a reverb into a fuzz into a reverb, as one picture.
//
// Left, the fuzz: what comes out against what goes in, the device's own curve
// (`curve()` and `build_table()` of haze.h: part of the wave folded for the
// octave, the rest kept, the sum driven into the kit's tanh, and the hold that
// puts a sine back at the RMS it had). The ink curve is the one a sound at
// full level is bent along at this Haze and Octave. The drive follows the
// playing (`render()`: all of Haze's at full level, less below), so a softer
// sound is on a gentler curve: that one, worked out from the device's own
// reading of its push, is drawn in the second ink as far as the peaks reach
// on it, with a dot at either end.
//
// Right, the wall: the level against the seconds since the playing stopped.
// The ink line is the wall's own fall, 60 dB in the time `derive()` gives its
// middle line at 250 Hz (the gain per pass that Decay and Size set, and the
// damping on top of it), and the figure is that time. Under it, the highs:
// where Tone's tilt and low-pass put 3 kHz against 250 Hz, and the faster fall
// the damping gives them. The dashed line is the same fall as Mix lets it out.
// Feed and Blur hold the wall up longer than its own fall, by an amount no sum
// of the header's gives, so no line is drawn for them: the second ink is the
// level the device reads, traced from the moment the wall last stood at its
// height, and from where it stands now on down at the wall's own rate. With
// Mix at nothing none of it is heard, and nothing is lit.

import {
  INK,
  clamp,
  clipped,
  dbGrid,
  dbOfY,
  dot,
  fillTo,
  follow,
  gainToDb,
  ground,
  handle,
  label,
  lerp,
  rule,
  trace,
  yOfDb,
  type Box,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

// --- haze.h -----------------------------------------------------------------

/** The constants of `cpp/devices/haze/haze.h` the picture is made from. */
export const HAZE = {
  /** kDriveMax, kDriveCurve, kDriveLeast: Haze 0..1 is the drive, from none on a curve of equal ratios. */
  driveMax: 8,
  driveCurve: 24,
  driveLeast: 1e-3,
  /** kFollowLevel, kFollowMost: how much of the drive a level is given. */
  followLevel: 0.25,
  followMost: 1,
  /** kFloor: the level under which the push into the curve falls away. */
  floor: 0.01,
  /** kFoldSoft, kFoldGain, kFoldMost: the fold sqrt(x² + s²) − s, its gain, and Octave 1. */
  foldSoft: 0.05,
  foldGain: 2,
  foldMost: 0.85,
  /** kTablePoints: the points of one cycle the hold is worked out over. */
  tablePoints: 24,
  /** kTiltHz, kToneLowHz, kToneHighHz, kTiltLowDb, kTiltHighDb: Tone's tilt and low-pass. */
  tiltHz: 1000,
  toneLowHz: 800,
  toneHighHz: 12000,
  tiltLowDb: 3,
  tiltHighDb: 6,
  /** kLineSeconds[4], kMinScale, kMaxScale: the wall's middle line and what Size scales it by. */
  lineSeconds: 0.071938,
  minScale: 0.5,
  maxScale: 1.5,
  /** kDampingSlope, kDampingMost: the pole of the wall's damping from the log of a line's gain. */
  dampingSlope: -3.0221,
  dampingMost: 0.6,
} as const

/** `kit::fast_tanh` (cpp/kit/math.h). */
export function fastTanh(value: number): number {
  const x = clamp(value, -3, 3)
  return (x * (27 + x * x)) / (27 + 9 * x * x)
}

/** `apply()`: the drive Haze asks for, which a sound at full level is given whole. */
export const hazeDrive = (haze: number): number =>
  (HAZE.driveMax * (Math.pow(HAZE.driveCurve, clamp(haze, 0, 1)) - 1)) / (HAZE.driveCurve - 1)

/** `render()`: the share of that drive a level is given (the level as a sine's peak, full scale 1). */
export const hazeFollow = (level: number): number =>
  Math.min(
    Math.sqrt(
      ((1 + HAZE.followLevel) * Math.max(level, 0)) / (Math.max(level, 0) + HAZE.followLevel),
    ),
    HAZE.followMost,
  )

/** `render()`: the drive in use at a Haze and a level, never quite nothing. */
export const hazeDriveAt = (haze: number, level: number): number =>
  Math.max(hazeDrive(haze) * hazeFollow(level), HAZE.driveLeast)

/** `render()`: the device's reading "push": the drive in use times the level's share of level + floor. */
export const hazePush = (haze: number, level: number): number =>
  (hazeDriveAt(haze, level) * Math.max(level, 0)) / (Math.max(level, 0) + HAZE.floor)

/**
 * The level that reading stands for at a Haze: the push grows with the level,
 * so the level is found by halving (0 to 4, by ratio from a millionth).
 */
export function hazeLevelOf(push: number, haze: number): number {
  if (!(push > 0)) return 0
  let from = 1e-6
  let to = 4
  if (hazePush(haze, to) <= push) return to
  for (let step = 0; step < 48; step++) {
    const middle = Math.sqrt(from * to)
    if (hazePush(haze, middle) < push) from = middle
    else to = middle
  }
  return Math.sqrt(from * to)
}

const folded = (q: number): number =>
  Math.sqrt(q * q + HAZE.foldSoft * HAZE.foldSoft) - HAZE.foldSoft

/** One cycle of a full-level sine at the table's points, and the mean of its fold. */
const CYCLE = Array.from({ length: HAZE.tablePoints }, (_, j) =>
  Math.sin((2 * Math.PI * (j + 0.5)) / HAZE.tablePoints),
)
const FOLD_MEAN = CYCLE.reduce((sum, n) => sum + folded(n), 0) / CYCLE.length

/** `curve()`: what the tanh is given for a wave `q` (level taken out), before the drive. */
export function hazeFolded(q: number, octave: number): number {
  const fold = HAZE.foldMost * clamp(octave, 0, 1)
  return (1 - fold) * q + fold * HAZE.foldGain * (folded(q) - FOLD_MEAN)
}

/** A finer cycle of the same sine, for the mean that the device's DC blocker takes out. */
const FINE = Array.from({ length: 96 }, (_, j) => Math.sin((2 * Math.PI * (j + 0.5)) / 96))

/**
 * What leaves the fuzz at a drive, as a function worked out once for a drive
 * and an Octave: `q` is the wave with its level taken out (peaks at ±1) and
 * the result is in the same units, so the straight line out = in is no change.
 * The curve is the kit's tanh of the drive times the folded wave;
 * `build_table()`'s hold puts a sine back at the RMS it had (the push, over
 * √2 times the curve's RMS over a cycle of 24 points), and the DC blocker
 * after the curve takes out the mean a folded wave leaves with.
 */
export function hazeBendAt(driveInUse: number, octave: number): (q: number) => number {
  const drive = Math.max(driveInUse, HAZE.driveLeast)
  let sum = 0
  let squares = 0
  for (const n of CYCLE) {
    const s = fastTanh(drive * hazeFolded(n, octave))
    sum += s
    squares += s * s
  }
  const rms = Math.sqrt(Math.max(squares / CYCLE.length - (sum / CYCLE.length) ** 2, 1e-20))
  // hold(push) / drive at a push of the drive itself: the level is the wave's own.
  const gain = Math.SQRT1_2 / rms
  let mean = 0
  for (const n of FINE) mean += fastTanh(drive * hazeFolded(n, octave)) / FINE.length
  return (q) => (fastTanh(drive * hazeFolded(q, octave)) - mean) * gain
}

/** The curve a sound at full level is bent along at a Haze and an Octave. */
export const hazeBend = (haze: number, octave: number): ((q: number) => number) =>
  hazeBendAt(hazeDriveAt(haze, 1), octave)

/** One point of that curve. */
export const hazeCurve = (q: number, haze: number, octave: number): number =>
  hazeBend(haze, octave)(q)

/** The rate the wall's damping is worked out at: a handle is not told the device's. */
const TAIL_RATE = 48000

/**
 * `derive()` and `render()`: the seconds a frequency takes to fall 60 dB in
 * the wall with nothing fed back: per pass, the middle line's gain, the
 * one-pole that damps it, and what reading a line between two samples takes
 * (`read_linear` at a length that Size sets and that seldom falls on a whole
 * sample: (1 − f) + f z⁻¹, and the eight lines' f are spread from 0 to 1,
 * which is 1 − (1 − cos w) / 3 of the power on average; nothing to speak of
 * at 250 Hz, a tenth of a dB a pass at 3 kHz).
 */
export function hazeFall(hz: number, decay: number, size: number): number {
  const pass = HAZE.lineSeconds * lerp(HAZE.minScale, HAZE.maxScale, size)
  const exponent = (-3 * pass) / decay
  const pole = Math.min(HAZE.dampingSlope * exponent, HAZE.dampingMost)
  const w = (2 * Math.PI * hz) / TAIL_RATE
  const damped = (1 - pole) / Math.sqrt(1 - 2 * pole * Math.cos(w) + pole * pole)
  const read = 1 - (1 - Math.cos(w)) / 3
  return (-60 * pass) / (20 * exponent + 20 * Math.log10(damped) + 10 * Math.log10(read))
}

/**
 * `derive()` and `render()`: what Tone does to a frequency, in dB: the tilt
 * about 1 kHz and the low-pass. Below the middle of Tone the tilt only takes
 * highs away (the lows stay where they were); above it the highs come up and
 * the lows go down.
 */
export function hazeToneDb(hz: number, tone: number): number {
  const turn = 2 * clamp(tone, 0, 1) - 1
  const low = Math.pow(10, (-Math.max(turn, 0) * HAZE.tiltLowDb) / 20)
  const high = Math.pow(
    10,
    (turn > 0 ? turn * HAZE.tiltHighDb : turn * (HAZE.tiltHighDb + HAZE.tiltLowDb)) / 20,
  )
  // The one-pole split of kit::OnePole: (1 - a) / (1 - a z⁻¹).
  const a = Math.exp((-2 * Math.PI * HAZE.tiltHz) / TAIL_RATE)
  const w = (2 * Math.PI * hz) / TAIL_RATE
  const denRe = 1 - a * Math.cos(w)
  const denIm = a * Math.sin(w)
  const size = denRe * denRe + denIm * denIm
  const lowRe = ((1 - a) * denRe) / size
  const lowIm = (-(1 - a) * denIm) / size
  const re = high + (low - high) * lowRe
  const im = (low - high) * lowIm
  // kit::Svf's low-pass, Butterworth, on its warped frequency scale.
  const cut = HAZE.toneLowHz * Math.pow(HAZE.toneHighHz / HAZE.toneLowHz, clamp(tone, 0, 1))
  const ratio = Math.tan((Math.PI * hz) / TAIL_RATE) / Math.tan((Math.PI * cut) / TAIL_RATE)
  return 10 * Math.log10(re * re + im * im) - 10 * Math.log10(1 + ratio ** 4)
}

/** The two frequencies the tail is drawn at: its body and its highs. */
export const HAZE_BODY_HZ = 250
export const HAZE_HIGH_HZ = 3000

/** `apply()`: what Mix lets out of the wall, the wet gain of `kit::equal_power`, in dB. */
export const hazeWetDb = (mix: number): number =>
  gainToDb(Math.sin((Math.PI / 2) * clamp(mix, 0, 1)))

/** The Decay whose wall, at this Size, takes `seconds` to fall 60 dB at 250 Hz. */
export function hazeDecayFor(seconds: number, size: number, low: number, high: number): number {
  // The fall grows with Decay: halve the range of Decay (by ratio) until it stands on the time.
  let from = low
  let to = high
  if (hazeFall(HAZE_BODY_HZ, from, size) >= seconds) return from
  if (hazeFall(HAZE_BODY_HZ, to, size) <= seconds) return to
  for (let step = 0; step < 48; step++) {
    const middle = Math.sqrt(from * to)
    if (hazeFall(HAZE_BODY_HZ, middle, size) < seconds) from = middle
    else to = middle
  }
  return Math.sqrt(from * to)
}

// --- The picture ------------------------------------------------------------

/** The wave's level across the curve's box, either way, and what comes out up and down. */
const IN_SPAN = 1.05
const OUT_SPAN = 1.45
/** Where the Haze point stands on the full-level curve, as the wave's level: at its end with no drive, near the middle at full. */
const HAZE_AT_REST = 1
const HAZE_AT_FULL = 0.05
/** The seconds across the wall's box, and the levels at its top and foot: 10 dB over the wall's own level, for highs that Tone lifts over the body. */
const TAIL_SPAN = 12
const TOP_DB = 10
const FOOT_DB = -60
/** Under this the wall is not lit. */
const QUIET_DB = -66
/** The wall's level is put down this often while it falls, and no more of it is kept than crosses the box. */
export const HAZE_STEP = 0.125
const PAST_MOST = Math.round(TAIL_SPAN / HAZE_STEP) + 1
/** The wall stands at its height while it is within this of the highest it has read, and a rise of this much is new playing. */
const HEIGHT_DB = 1.5
const RISE_DB = 3
/** A fall that has not gone down this much in a second is no fall: the trace begins again from there. */
const FALLING_DB = 0.5

interface HazeBoxes {
  curve: Box
  tail: Box
}

/** The two boxes, from the size the display is given: the curve near square at the left, the wall in the rest. */
export function hazeBoxes(view: Pick<DisplayView, 'width' | 'height'>): HazeBoxes {
  const box: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const wide = Math.round(clamp(Math.max(box.w * 0.3, box.h * 0.8), 44, Math.max(44, box.h * 1.6)))
  return {
    curve: { x: box.x, y: box.y, w: wide, h: box.h },
    tail: { x: box.x + wide + 7, y: box.y, w: box.w - wide - 7, h: box.h },
  }
}

const xOfIn = (q: number, box: Box): number => box.x + ((q + IN_SPAN) / (2 * IN_SPAN)) * box.w
const inOfX = (x: number, box: Box): number => ((x - box.x) / box.w) * 2 * IN_SPAN - IN_SPAN
const yOfOut = (out: number, box: Box): number =>
  box.y + ((OUT_SPAN - out) / (2 * OUT_SPAN)) * box.h
const xOfSec = (sec: number, box: Box): number => box.x + (sec / TAIL_SPAN) * box.w

/** Where the full-level curve stands in its box for the wave `q` at a Haze and Octave. */
export function hazeCurveAt(box: Box, q: number, haze: number, octave: number): Point {
  return [xOfIn(q, box), yOfOut(hazeCurve(q, haze, octave), box)]
}

/** Where the curve a sound at `level` is on (a sine's peak, full scale 1) stands in the box for the wave `q`. */
export function hazeNowAt(box: Box, q: number, haze: number, octave: number, level: number): Point {
  return [xOfIn(q, box), yOfOut(hazeBendAt(hazeDriveAt(haze, level), octave)(q), box)]
}

/** Where a time since the playing stopped and a level against the wall's own stand in the wall's box. */
export function hazeTailAt(box: Box, seconds: number, db: number): Point {
  return [xOfSec(seconds, box), yOfDb(db, box, TOP_DB, FOOT_DB)]
}

/** Where a fall of 60 dB in `seconds` from full scale ends in the box: on its foot, or on its right edge when it is longer than the box. */
export function hazeFallEnd(box: Box, seconds: number): Point {
  if (seconds <= TAIL_SPAN) return [xOfSec(seconds, box), box.y + box.h]
  return [box.x + box.w, yOfDb((-60 * TAIL_SPAN) / seconds, box, TOP_DB, FOOT_DB)]
}

/**
 * The fall whose end is the point of the end's path nearest a hand: the path
 * runs along the foot and up the right edge, so a hand that strays off it
 * still has the end under it, across or up.
 */
export function hazeFallNear(box: Box, x: number, y: number): number {
  const foot = box.y + box.h
  const right = box.x + box.w
  const alongX = clamp(x, box.x, right)
  const alongY = clamp(y, box.y, foot)
  const toFoot = Math.hypot(x - alongX, y - foot)
  const toEdge = Math.hypot(x - right, y - alongY)
  if (toFoot <= toEdge) return Math.max(0.01, ((alongX - box.x) / box.w) * TAIL_SPAN)
  const db = clamp(dbOfY(alongY, box, TOP_DB, FOOT_DB), FOOT_DB, -0.5)
  return (-60 * TAIL_SPAN) / db
}

interface HazeState {
  /** The level under the fuzz the device's push stands for (a sine's peak, 0 when nothing sounds), and the wall's as it leaves, linear. */
  level: number
  wall: number
  /** The wall's level in dB at each HAZE_STEP since it last stood at its height, and the seconds since then. */
  past: number[]
  clock: number
  /** The highest the wall has read since the trace began. */
  top: number
}

const secondsText = (seconds: number): string =>
  seconds >= 99.5 ? `${Math.round(seconds)} s` : `${seconds.toFixed(1)} s`

function hazeHandles(view: DisplayView): DisplayHandle[] {
  const { curve, tail } = hazeBoxes(view)
  const haze = view.value('haze')
  const octave = view.value('octave')
  const size = view.value('size')
  const hazeSpec = view.spec('haze')
  const decaySpec = view.spec('decay')
  const at = lerp(HAZE_AT_REST, HAZE_AT_FULL, haze)
  const hazeX = xOfIn(at, curve)
  const [endX, endY] = hazeFallEnd(tail, hazeFall(HAZE_BODY_HZ, view.value('decay'), size))
  return [
    {
      key: 'haze',
      name: 'Haze',
      x: hazeX,
      y: clamp(yOfOut(hazeCurve(at, haze, octave), curve), curve.y, curve.y + curve.h),
      // Across is Haze: the point is taken along the curve towards the middle.
      drag: (toX) => ({
        haze:
          Math.abs(toX - hazeX) < 1e-6
            ? haze
            : clamp((HAZE_AT_REST - inOfX(toX, curve)) / (HAZE_AT_REST - HAZE_AT_FULL), 0, 1),
      }),
      reset: () => ({ haze: hazeSpec?.default ?? haze }),
    },
    {
      key: 'decay',
      name: 'Decay',
      x: endX,
      y: endY,
      // The end of the fall goes to the point of its path nearest the hand.
      drag: (toX, toY) => ({
        decay:
          Math.abs(toX - endX) < 1e-6 && Math.abs(toY - endY) < 1e-6
            ? view.value('decay')
            : hazeDecayFor(
                hazeFallNear(tail, toX, toY),
                size,
                decaySpec?.min ?? 0.5,
                decaySpec?.max ?? 30,
              ),
      }),
      reset: () => ({ decay: decaySpec?.default ?? view.value('decay') }),
    },
  ]
}

/** The straight fall from (`fromSec`, `fromDb`) at 60 dB in `seconds`, as far as the box's foot or its right edge. */
function fallPoints(box: Box, fromDb: number, seconds: number, fromSec = 0): Point[] {
  const reach = (seconds * (fromDb - FOOT_DB)) / 60
  const sec = Math.min(fromSec + reach, TAIL_SPAN)
  return [
    [xOfSec(Math.min(fromSec, TAIL_SPAN), box), yOfDb(fromDb, box, TOP_DB, FOOT_DB)],
    [xOfSec(sec, box), yOfDb(fromDb - (60 * (sec - fromSec)) / seconds, box, TOP_DB, FOOT_DB)],
  ]
}

/**
 * Puts the wall's level down for a frame: `db` is the level as it is heard and
 * `dt` the seconds since the frame before. While the wall stands at its
 * height, rises, or does not fall, the trace is one point at 0 s; once it
 * falls, a level is kept every HAZE_STEP. Under the quiet line nothing is kept.
 */
export function hazeTrace(
  state: Pick<HazeState, 'past' | 'clock' | 'top'>,
  db: number,
  dt: number,
): void {
  if (!(db > QUIET_DB)) {
    state.past = []
    state.clock = 0
    state.top = -Infinity
    return
  }
  const kept = state.past.length
  const last = kept > 0 ? state.past[kept - 1] : -Infinity
  const second = Math.round(1 / HAZE_STEP)
  const standing = db > state.top - HEIGHT_DB
  const stalled = kept > second && db > state.past[kept - 1 - second] - FALLING_DB
  if (kept === 0 || standing || db > last + RISE_DB || stalled) {
    state.top = standing ? Math.max(state.top, db) : db
    state.past = [db]
    state.clock = 0
    return
  }
  state.clock += dt
  while (state.past.length * HAZE_STEP <= state.clock && state.past.length < PAST_MOST)
    state.past.push(db)
}

const haze = plateDisplay<HazeState>({
  place: 'strip',
  params: ['haze', 'octave', 'decay', 'size', 'tone', 'mix'],
  live: { meters: true },
  info: "Left, the curve a full-level sound is bent along at this Haze and Octave; lit, the curve the sound is on now. Right, the wall's own fall over Decay, its highs under it by Tone, dashed as Mix lets it out; lit, the level the device reads as the wall falls. Drag the points for Haze and Decay.",
  init: () => ({ level: 0, wall: 0, past: [], clock: 0, top: -Infinity }),
  draw(frame) {
    ground(frame)
    const { ctx, colours, state } = frame
    const { curve, tail } = hazeBoxes(frame)
    const amount = frame.value('haze')
    const octave = frame.value('octave')
    const hot = frame.hot

    // The device's two readings: its push (the drive in use times the level's
    // share of level + floor), from which the level under the fuzz is worked
    // back, and the wall's peak as it leaves. A still draw stands on them; a
    // running one follows.
    const wet = hazeWetDb(frame.value('mix'))
    const live = frame.powered && frame.hasMeter('push') && wet > FOOT_DB
    const level = live ? hazeLevelOf(Math.max(0, frame.meter('push')), amount) : 0
    const wall = live ? Math.max(0, frame.meter('wall')) : 0
    state.level = frame.dt > 0 ? follow(state.level, level, frame.dt, 0.03, 0.2) : level
    state.wall = frame.dt > 0 ? follow(state.wall, wall, frame.dt, 0.03, 0.06) : wall
    const reach = state.level / (state.level + HAZE.floor)

    // The fuzz: out against in, over the two axes and the line of no change.
    const middleX = xOfIn(0, curve)
    const middleY = yOfOut(0, curve)
    rule(ctx, curve.x, middleY, curve.x + curve.w, middleY, {
      colour: colours.ink,
      alpha: INK.grid,
    })
    rule(ctx, middleX, curve.y, middleX, curve.y + curve.h, {
      colour: colours.ink,
      alpha: INK.grid,
    })
    clipped(ctx, curve, () => {
      trace(
        ctx,
        [
          [xOfIn(-IN_SPAN, curve), yOfOut(-IN_SPAN, curve)],
          [xOfIn(IN_SPAN, curve), yOfOut(IN_SPAN, curve)],
        ],
        { colour: colours.ink, width: 1, alpha: INK.rule, dash: [2, 2] },
      )
      const bend = hazeBend(amount, octave)
      const bent: Point[] = []
      for (let x = 0; x <= curve.w; x += 1) {
        bent.push([curve.x + x, yOfOut(bend(inOfX(curve.x + x, curve)), curve)])
      }
      trace(ctx, bent, { colour: colours.ink })
      if (reach > 0.01) {
        // The curve at the drive this level is given, as far as its peaks reach.
        const now = hazeBendAt(hazeDriveAt(amount, state.level), octave)
        const used: Point[] = []
        const steps = Math.max(2, Math.round(curve.w))
        for (let k = 0; k <= steps; k += 1) {
          const q = reach * ((2 * k) / steps - 1)
          used.push([xOfIn(q, curve), yOfOut(now(q), curve)])
        }
        trace(ctx, used, { colour: colours.accent, width: 2.5 })
        for (const end of [used[0], used[used.length - 1]]) {
          dot(ctx, end[0], end[1], 2.5, colours.accent, { ring: colours.ink })
        }
      }
    })

    // The wall: its own fall, the highs under it, what Mix lets out, and what the device reads of it.
    const foot = tail.y + tail.h
    const tone = frame.value('tone')
    const seconds = hazeFall(HAZE_BODY_HZ, frame.value('decay'), frame.value('size'))
    dbGrid(frame, tail, TOP_DB, FOOT_DB, 20, 0)
    for (let sec = 4; sec < TAIL_SPAN; sec += 4) {
      const x = xOfSec(sec, tail)
      rule(ctx, x, tail.y, x, foot, { colour: colours.ink, alpha: INK.grid })
    }
    rule(ctx, tail.x, foot, tail.x + tail.w, foot, { colour: colours.ink, alpha: INK.rule })
    const body = fallPoints(tail, 0, seconds)
    const highDb = hazeToneDb(HAZE_HIGH_HZ, tone) - hazeToneDb(HAZE_BODY_HZ, tone)
    const highs = fallPoints(
      tail,
      highDb,
      hazeFall(HAZE_HIGH_HZ, frame.value('decay'), frame.value('size')),
    )
    const heard = gainToDb(state.wall) + wet
    if (frame.dt > 0) hazeTrace(state, live ? heard : -Infinity, frame.dt)
    let nowAt: Point | null = null
    clipped(ctx, { x: tail.x, y: tail.y - 1, w: tail.w, h: tail.h + 2 }, () => {
      fillTo(ctx, body, foot, colours.ink, INK.fill)
      if (highDb > FOOT_DB) {
        fillTo(ctx, highs, foot, colours.ink, INK.fill)
        trace(ctx, highs, { colour: colours.ink, width: 1, alpha: INK.back })
      }
      if (live && heard > QUIET_DB) {
        // What was read on the way down, then from now on at the wall's own rate.
        const now = Math.min(state.clock, TAIL_SPAN)
        const lit: Point[] = []
        for (let k = 0; k < state.past.length && k * HAZE_STEP < now; k += 1) {
          lit.push(hazeTailAt(tail, k * HAZE_STEP, Math.min(state.past[k], TOP_DB)))
        }
        const ahead = fallPoints(tail, Math.min(heard, TOP_DB), seconds, now)
        lit.push(...ahead)
        fillTo(ctx, lit, foot, colours.accent, 0.5)
        trace(ctx, lit, { colour: colours.accent, width: 1.5 })
        if (now > 0) nowAt = ahead[0]
      }
      trace(ctx, body, { colour: colours.ink })
      if (wet > FOOT_DB) {
        trace(ctx, fallPoints(tail, wet, seconds), {
          colour: colours.ink,
          width: 1,
          alpha: INK.text,
          dash: [3, 2],
        })
      }
    })
    // Where the wall stands now on its way down (whole, where the box's edge would cut it).
    const stands = nowAt as Point | null
    if (stands) dot(ctx, stands[0], stands[1], 2, colours.accent, { ring: colours.ink })
    label(frame, secondsText(seconds), tail.x + tail.w - 1, tail.y + 8, 'right')

    for (const point of hazeHandles(frame))
      handle(frame, point.x, point.y, { hot: hot === point.key })
  },
  handles: hazeHandles,
})

export const HAZE_FACES: Readonly<Record<string, PlateFace>> = {
  haze: {
    display: haze,
    face: ['haze', 'blur', 'decay', 'mix'],
  },
}
