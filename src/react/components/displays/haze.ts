// The display of Haze: a reverb into a fuzz into a reverb, as one picture.
//
// Left, the fuzz: what comes out against what goes in for a wave at full
// level, the device's own curve at this Haze and Octave (`curve()` and
// `build_table()` of haze.h: part of the wave folded for the octave, the rest
// kept, the sum driven into the kit's tanh, and the hold that puts a sine back
// at the RMS it had). The dot in the second ink is where the peaks of the
// sound reach on it now, from the device's own reading, and the stretch of
// the curve in use is drawn in that ink.
//
// Right, the wall: the level against the seconds since the playing stopped,
// falling 60 dB in the time Decay and Feed make (`derive()` of haze.h). Under
// it, the highs: where Tone's tilt and low-pass put 3 kHz against 250 Hz, and
// the faster fall the wall's damping gives them. The dashed line is the same
// fall as Mix lets it out, and the wedge in the second ink is the wall as
// loud as it stands now, on its way down.

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
  type DisplayFrame,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

// --- haze.h -----------------------------------------------------------------

/** The constants of `cpp/devices/haze/haze.h` the picture is made from. */
export const HAZE = {
  /** kDriveMin, kDriveMax: Haze 0..1 is the drive, on a scale of equal ratios. */
  driveMin: 0.25,
  driveMax: 6,
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
  /** kLineShare, kFeedShare, kFeedMost: what a side taps, and what Feed returns at its top. */
  lineShare: 0.25,
  feedShare: 0.65,
  feedMost: 0.9,
} as const

/** `kit::fast_tanh` (cpp/kit/math.h). */
export function fastTanh(value: number): number {
  const x = clamp(value, -3, 3)
  return (x * (27 + x * x)) / (27 + 9 * x * x)
}

/** `apply()`: the drive into the curve at a Haze. */
export const hazeDrive = (haze: number): number =>
  HAZE.driveMin * Math.pow(HAZE.driveMax / HAZE.driveMin, clamp(haze, 0, 1))

const folded = (q: number): number => Math.sqrt(q * q + HAZE.foldSoft * HAZE.foldSoft) - HAZE.foldSoft

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

/**
 * `build_table()`: the gain that puts a sine back at the RMS it had, for peaks
 * that reach `push` on the curve: push / (√2 × the curve's RMS over a cycle).
 */
export function hazeHold(push: number, octave: number): number {
  const reach = Math.max(push, 1e-3)
  let sum = 0
  let squares = 0
  for (const n of CYCLE) {
    const s = fastTanh(reach * hazeFolded(n, octave))
    sum += s
    squares += s * s
  }
  const mean = sum / CYCLE.length
  const rms = Math.sqrt(Math.max(squares / CYCLE.length - mean * mean, 1e-20))
  return (reach * Math.SQRT1_2) / rms
}

/**
 * What leaves the fuzz for a wave at full level: `q` is the wave with its level
 * taken out (peaks at ±1), and the result is in the same units, so the straight
 * line out = in is no change.
 */
export function hazeCurve(q: number, haze: number, octave: number): number {
  const drive = hazeDrive(haze)
  return (fastTanh(drive * hazeFolded(q, octave)) * hazeHold(drive, octave)) / drive
}

/** `derive()`: the seconds the wall takes to fall 60 dB, with what Feed returns. */
export function hazeSeconds(decay: number, size: number, feed: number): number {
  const exponent = (-3 * HAZE.lineSeconds * lerp(HAZE.minScale, HAZE.maxScale, size)) / decay
  const gain = Math.pow(10, exponent)
  const loss = Math.max(1 - gain * gain, 1e-4)
  const back = feed * Math.min(Math.sqrt((HAZE.feedShare * loss) / HAZE.lineShare), HAZE.feedMost)
  const share = (back * back * HAZE.lineShare) / loss
  return decay / (1 - share)
}

/** The rate the wall's damping is worked out at: a handle is not told the device's. */
const TAIL_RATE = 48000

/**
 * `derive()`: the seconds a frequency takes to fall 60 dB in the wall with
 * nothing fed back: a line's gain and the one-pole that damps it, per pass.
 */
export function hazeFall(hz: number, decay: number, size: number): number {
  const pass = HAZE.lineSeconds * lerp(HAZE.minScale, HAZE.maxScale, size)
  const exponent = (-3 * pass) / decay
  const pole = Math.min(HAZE.dampingSlope * exponent, HAZE.dampingMost)
  const w = (2 * Math.PI * hz) / TAIL_RATE
  const damped = (1 - pole) / Math.sqrt(1 - 2 * pole * Math.cos(w) + pole * pole)
  return (-60 * pass) / (20 * exponent + 20 * Math.log10(damped))
}

/** `process()` and `derive()`: what Tone does to a frequency, in dB: the tilt about 1 kHz and the low-pass. */
export function hazeToneDb(hz: number, tone: number): number {
  const low = Math.pow(10, ((1 - 2 * tone) * HAZE.tiltLowDb) / 20)
  const high = Math.pow(10, ((2 * tone - 1) * HAZE.tiltHighDb) / 20)
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

// --- The picture ------------------------------------------------------------

/** The wave's level across the curve's box, either way, and what comes out up and down. */
const IN_SPAN = 1.15
const OUT_SPAN = 1.1
/** Where the Haze point stands on the curve, as the wave's level: far out with no drive, near the middle at full. */
const HAZE_AT_REST = 1.05
const HAZE_AT_FULL = 0.1
/** The seconds across the wall's box, and the levels at its top and foot: 10 dB over the wall's own level, for highs that Tone lifts over the body. */
const TAIL_SPAN = 12
const TOP_DB = 10
const FOOT_DB = -60
/** Under this the wall is not lit. */
const QUIET_DB = -66

interface HazeBoxes {
  curve: Box
  tail: Box
}

/** The two boxes, from the size the display is given: the curve near square at the left, the wall in the rest. */
export function hazeBoxes(view: Pick<DisplayView, 'width' | 'height'>): HazeBoxes {
  const box: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const wide = Math.round(clamp(box.w * 0.3, 44, Math.max(44, box.h * 1.6)))
  return {
    curve: { x: box.x, y: box.y, w: wide, h: box.h },
    tail: { x: box.x + wide + 7, y: box.y, w: box.w - wide - 7, h: box.h },
  }
}

const xOfIn = (q: number, box: Box): number => box.x + ((q + IN_SPAN) / (2 * IN_SPAN)) * box.w
const inOfX = (x: number, box: Box): number => ((x - box.x) / box.w) * 2 * IN_SPAN - IN_SPAN
const yOfOut = (out: number, box: Box): number => box.y + ((OUT_SPAN - out) / (2 * OUT_SPAN)) * box.h
const xOfSec = (sec: number, box: Box): number => box.x + (sec / TAIL_SPAN) * box.w

/** Where a fall of 60 dB in `seconds` from full scale ends in the box: on its foot, or on its right edge when it is longer than the box. */
export function hazeFallEnd(box: Box, seconds: number): Point {
  if (seconds <= TAIL_SPAN) return [xOfSec(seconds, box), box.y + box.h]
  return [box.x + box.w, yOfDb((-60 * TAIL_SPAN) / seconds, box, TOP_DB, FOOT_DB)]
}

/** The seconds to fall 60 dB of the straight fall from full scale at 0 s through a point. */
export function hazeFallThrough(box: Box, x: number, y: number): number {
  const sec = Math.max(0.01, (Math.max(0, x - box.x) / box.w) * TAIL_SPAN)
  const db = clamp(dbOfY(y, box, TOP_DB, FOOT_DB), FOOT_DB, -0.5)
  return (-60 * sec) / db
}

/** The Decay whose wall, with this Size and Feed, takes `seconds` to fall 60 dB. */
export function hazeDecayFor(
  seconds: number,
  size: number,
  feed: number,
  low: number,
  high: number,
): number {
  // The fall grows with Decay: halve the range of Decay (by ratio) until it stands on the time.
  let from = low
  let to = high
  if (hazeSeconds(from, size, feed) >= seconds) return from
  if (hazeSeconds(to, size, feed) <= seconds) return to
  for (let step = 0; step < 40; step++) {
    const middle = Math.sqrt(from * to)
    if (hazeSeconds(middle, size, feed) < seconds) from = middle
    else to = middle
  }
  return Math.sqrt(from * to)
}

interface HazeState {
  /** How far up the curve the peaks reach, as the wave's level 0..1, and the wall's level as it leaves, linear. */
  reach: number
  wall: number
}

const secondsText = (seconds: number): string =>
  seconds >= 99.5 ? `${Math.round(seconds)} s` : `${seconds.toFixed(1)} s`

function hazeHandles(view: DisplayView): DisplayHandle[] {
  const { curve, tail } = hazeBoxes(view)
  const haze = view.value('haze')
  const octave = view.value('octave')
  const hazeSpec = view.spec('haze')
  const decaySpec = view.spec('decay')
  const at = lerp(HAZE_AT_REST, HAZE_AT_FULL, haze)
  const hazeX = xOfIn(at, curve)
  const seconds = hazeSeconds(view.value('decay'), view.value('size'), view.value('feed'))
  const [endX, endY] = hazeFallEnd(tail, seconds)
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
      // The fall is taken by any point of it: Decay is the one whose wall passes under the hand.
      drag: (toX, toY) => ({
        decay:
          Math.abs(toX - endX) < 1e-6 && Math.abs(toY - endY) < 1e-6
            ? view.value('decay')
            : hazeDecayFor(
                hazeFallThrough(tail, toX, toY),
                view.value('size'),
                view.value('feed'),
                decaySpec?.min ?? 0.5,
                decaySpec?.max ?? 30,
              ),
      }),
      reset: () => ({ decay: decaySpec?.default ?? view.value('decay') }),
    },
  ]
}

/** The straight fall from (0 s, `fromDb`) at 60 dB in `seconds`, as far as the box's foot or its right edge. */
function fallPoints(box: Box, fromDb: number, seconds: number): Point[] {
  const reach = (seconds * (fromDb - FOOT_DB)) / 60
  const sec = Math.min(reach, TAIL_SPAN)
  return [
    [box.x, yOfDb(fromDb, box, TOP_DB, FOOT_DB)],
    [xOfSec(sec, box), yOfDb(fromDb - (60 * sec) / seconds, box, TOP_DB, FOOT_DB)],
  ]
}

const haze = plateDisplay<HazeState>({
  place: 'strip',
  params: ['haze', 'octave', 'decay', 'size', 'feed', 'tone', 'mix'],
  live: { meters: true },
  info: 'Left, the curve the blurred sound is bent along at this Haze and Octave, with a dot where its peaks reach now. Right, the wall falling over Decay and Feed, its highs under it by Tone, dashed as Mix lets it out and lit as loud as it stands. Drag the points for Haze and Decay.',
  init: () => ({ reach: 0, wall: 0 }),
  draw(frame) {
    ground(frame)
    const { ctx, colours, state } = frame
    const { curve, tail } = hazeBoxes(frame)
    const amount = frame.value('haze')
    const octave = frame.value('octave')
    const hot = frame.hot

    // The device's two readings: how far up the curve the peaks reach (the
    // push is the drive times the level's share of level + floor), and the
    // wall's peak as it leaves. A still draw stands on them; a running one follows.
    const live = frame.powered && frame.hasMeter('push')
    const reach = live ? clamp(frame.meter('push') / hazeDrive(amount), 0, 1) : 0
    const wall = live ? Math.max(0, frame.meter('wall')) : 0
    state.reach = frame.dt > 0 ? follow(state.reach, reach, frame.dt, 0.03, 0.2) : reach
    state.wall = frame.dt > 0 ? follow(state.wall, wall, frame.dt, 0.03, 0.3) : wall

    // The fuzz: out against in, over the two axes and the line of no change.
    const middleX = xOfIn(0, curve)
    const middleY = yOfOut(0, curve)
    rule(ctx, curve.x, middleY, curve.x + curve.w, middleY, { colour: colours.ink, alpha: INK.grid })
    rule(ctx, middleX, curve.y, middleX, curve.y + curve.h, { colour: colours.ink, alpha: INK.grid })
    clipped(ctx, curve, () => {
      trace(
        ctx,
        [
          [xOfIn(-IN_SPAN, curve), yOfOut(-IN_SPAN, curve)],
          [xOfIn(IN_SPAN, curve), yOfOut(IN_SPAN, curve)],
        ],
        { colour: colours.ink, width: 1, alpha: INK.rule, dash: [2, 2] },
      )
      const bent: Point[] = []
      const used: Point[] = []
      for (let x = 0; x <= curve.w; x += 1) {
        const q = inOfX(curve.x + x, curve)
        const point: Point = [curve.x + x, yOfOut(hazeCurve(q, amount, octave), curve)]
        bent.push(point)
        if (Math.abs(q) <= state.reach) used.push(point)
      }
      trace(ctx, bent, { colour: colours.ink })
      if (state.reach > 0.01) {
        trace(ctx, used, { colour: colours.accent, width: 2.5 })
        for (const side of [-1, 1]) {
          const q = side * state.reach
          dot(ctx, xOfIn(q, curve), yOfOut(hazeCurve(q, amount, octave), curve), 2.5, colours.accent, {
            ring: colours.ink,
          })
        }
      }
    })

    // The wall: its fall, the highs under it, what Mix lets out, and what stands in it now.
    const foot = tail.y + tail.h
    const seconds = hazeSeconds(frame.value('decay'), frame.value('size'), frame.value('feed'))
    dbGrid(frame, tail, TOP_DB, FOOT_DB, 20, 0)
    for (let sec = 4; sec < TAIL_SPAN; sec += 4) {
      const x = xOfSec(sec, tail)
      rule(ctx, x, tail.y, x, foot, { colour: colours.ink, alpha: INK.grid })
    }
    rule(ctx, tail.x, foot, tail.x + tail.w, foot, { colour: colours.ink, alpha: INK.rule })
    const body = fallPoints(tail, 0, seconds)
    const tone = frame.value('tone')
    const highDb = hazeToneDb(HAZE_HIGH_HZ, tone) - hazeToneDb(HAZE_BODY_HZ, tone)
    const highs = fallPoints(
      tail,
      highDb,
      Math.min(seconds, hazeFall(HAZE_HIGH_HZ, frame.value('decay'), frame.value('size'))),
    )
    const wet = hazeWetDb(frame.value('mix'))
    clipped(ctx, { x: tail.x, y: tail.y - 1, w: tail.w, h: tail.h + 2 }, () => {
      fillTo(ctx, body, foot, colours.ink, INK.fill)
      if (highDb > FOOT_DB) {
        fillTo(ctx, highs, foot, colours.ink, INK.fill)
        trace(ctx, highs, { colour: colours.ink, width: 1, alpha: INK.back })
      }
      const level = gainToDb(state.wall) + wet
      if (level > QUIET_DB) {
        const lit = fallPoints(tail, Math.min(level, TOP_DB), seconds)
        fillTo(ctx, lit, foot, colours.accent, 0.5)
        trace(ctx, lit, { colour: colours.accent, width: 1.5 })
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
    label(frame, secondsText(seconds), tail.x + tail.w - 1, tail.y + 8, 'right')

    for (const point of hazeHandles(frame)) handle(frame, point.x, point.y, { hot: hot === point.key })
  },
  handles: hazeHandles,
})

export const HAZE_FACES: Readonly<Record<string, PlateFace>> = {
  haze: {
    display: haze,
    face: ['haze', 'blur', 'decay', 'mix'],
  },
}
