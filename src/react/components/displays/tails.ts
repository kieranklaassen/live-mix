// Displays of the reverbs that do more than die away: tails that bloom, shimmer, swarm, sing or speak.
//
// Every one is a window in two parts. Below, what every reverb has: the level
// against the time since a sound went in, falling at the device's own rate,
// with the time it takes to fall 60 dB said in seconds and, while sound runs,
// what really comes out riding it. Above, what only this device does.

import {
  FLOOR_DB,
  History,
  INK,
  clamp,
  clipped,
  dbGrid,
  dbOfY,
  dot,
  fillBetween,
  fillTo,
  freqGrid,
  gainToDb,
  ground,
  handle,
  hzOfX,
  rule,
  spectrum,
  text,
  trace,
  xOfHz,
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

// --- What they share: the two parts, the tail and what rides it -------------

type Size = Pick<DisplayView, 'width' | 'height'>
type Paint = Pick<DisplayFrame, 'ctx' | 'colours'>

/** The levels a tail spans, top to foot. */
const TOP_DB = 0
const FOOT_DB = -60

interface Panels {
  /** What the device alone does. */
  own: Box
  /** The tail, on a scale of seconds. */
  tail: Box
  /** The line between the two. */
  between: number
}

function panels(view: Size): Panels {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const tail = Math.max(12, Math.round(all.h * 0.38))
  const gap = 7
  return {
    own: { x: all.x, y: all.y, w: all.w, h: Math.max(8, all.h - tail - gap) },
    tail: { x: all.x, y: all.y + all.h - tail, w: all.w, h: tail },
    between: all.y + all.h - tail - 3,
  }
}

const xOfSec = (sec: number, box: Box, span: number): number =>
  box.x + clamp(sec / span, 0, 1) * box.w
const yOfLevel = (db: number, box: Box): number =>
  yOfDb(clamp(db, FOOT_DB, TOP_DB), box, TOP_DB, FOOT_DB)

/** Set point `index` of a list kept between frames, making it only the first time. */
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

/** A time as it is said: "320 ms", "5.0 s", "24 s", and "∞" for a tail that does not end. */
export function secondsText(sec: number): string {
  if (!Number.isFinite(sec)) return '∞'
  if (sec < 0.995) return `${Math.round(sec * 1000)} ms`
  return sec < 9.95 ? `${sec.toFixed(1)} s` : `${Math.round(sec)} s`
}

/** An upright line at every second, or every two, five or ten where they would crowd. */
function secondLines(frame: Paint, box: Box, span: number): void {
  const px = box.w / span
  const step = [1, 2, 5, 10, 20, 60].find((each) => each * px >= 7) ?? 60
  for (let sec = step; sec < span; sec += step) {
    const x = xOfSec(sec, box, span)
    rule(frame.ctx, x, box.y, x, box.y + box.h, {
      colour: frame.colours.ink,
      alpha: INK.grid * 0.55,
    })
  }
}

/** Many separate strokes laid at once: `lines` holds x1, y1, x2, y2 for each of `count`. */
function strokes(
  frame: Paint,
  lines: ArrayLike<number>,
  count: number,
  style: { colour: string; width?: number; alpha?: number },
): void {
  if (count <= 0) return
  const { ctx } = frame
  ctx.beginPath()
  for (let i = 0; i < count; i++) {
    ctx.moveTo(lines[i * 4], lines[i * 4 + 1])
    ctx.lineTo(lines[i * 4 + 2], lines[i * 4 + 3])
  }
  ctx.globalAlpha = style.alpha ?? 1
  ctx.strokeStyle = style.colour
  ctx.lineWidth = style.width ?? 1
  ctx.lineCap = 'butt'
  ctx.setLineDash([])
  ctx.stroke()
  ctx.globalAlpha = 1
}

/**
 * Where a straight fall of 60 dB in `rt60` seconds, begun at `from`, leaves
 * the tail's panel: at its foot, or at its right edge when it is longer than
 * the panel shows. The decay's handle stands there.
 */
export function fallEnd(box: Box, span: number, rt60: number, from = 0): Point {
  if (!Number.isFinite(rt60)) return [box.x + box.w, box.y]
  if (from + rt60 <= span) return [xOfSec(from + rt60, box, span), box.y + box.h]
  return [box.x + box.w, yOfLevel((-60 * (span - from)) / Math.max(rt60, 1e-3), box)]
}

/** The time to fall 60 dB of the straight fall from (`from`, 0 dB) through a point of the panel. */
export function fallThrough(box: Box, span: number, x: number, y: number, from = 0): number {
  const sec = Math.max(0.01, clamp((x - box.x) / box.w, 0, 1) * span - from)
  const db = clamp(dbOfY(y, box, TOP_DB, FOOT_DB), FOOT_DB, -0.01)
  return (-60 * sec) / db
}

/** How far under the loudest lately a sound still counts as a sound going in, in dB. */
const NEAR_DB = 4
/** How fast "the loudest lately" sinks, in dB a second. */
const HOLD_FALL_DB = 2
/** Under this nothing is heard. */
const QUIET_DB = -72
/** Slots in the kept level: one every pixel of a window, about. */
const RIDE_SLOTS = 120

/** What came out since a sound last went in, kept to ride the tail. */
interface Ride {
  /** The level coming out, dB, over the span of the tail's panel. */
  level: History
  /** The loudest going in lately, sinking. */
  hold: number
  /** When a sound that loud last went in, on the frame's clock; negative for never. */
  since: number
  /** The level that came out then: the ride starts at the top of the scale. */
  ref: number
  /** The points last drawn, kept to be used again. */
  points: Point[]
}

function newRide(span: number): Ride {
  return {
    level: new History(span, RIDE_SLOTS, FLOOR_DB),
    hold: FLOOR_DB,
    since: -1,
    ref: 0,
    points: [],
  }
}

/**
 * Listen for a frame. A sound "goes in" whenever the level going in (what
 * comes out, where the plate does not know what feeds the device) is within a
 * few dB of the loudest lately; from the last such moment the level coming
 * out is kept, to be drawn against the time since.
 */
function hear(frame: DisplayFrame, ride: Ride): void {
  const signal = frame.signal
  if (!signal) return
  const out = gainToDb(signal.output.rms)
  const going = gainToDb((signal.input ?? signal.output).peak)
  ride.level.push(frame.now, out)
  ride.hold = Math.max(going, ride.hold - HOLD_FALL_DB * frame.dt)
  if (going > QUIET_DB && going >= ride.hold - NEAR_DB) {
    ride.since = frame.now
    ride.ref = out
  } else if (frame.now - ride.since < 0.15) {
    // The hit is still passing through the window the level is taken over.
    ride.ref = Math.max(ride.ref, out)
  }
}

/** Seconds since a sound last went in, while what it left can still be heard; null otherwise. */
function riding(frame: DisplayFrame, ride: Ride): number | null {
  if (!frame.signal || !frame.powered || ride.since < 0) return null
  if (ride.level.at(0) <= QUIET_DB) return null
  return Math.max(0, frame.now - ride.since)
}

/** Whether sound runs through the device now: then it is awake and its readings are fresh. */
function sounding(frame: DisplayFrame): boolean {
  const signal = frame.signal
  if (!signal || !frame.powered) return false
  return gainToDb(Math.max(signal.input?.peak ?? 0, signal.output.peak)) > QUIET_DB
}

/** The level that came out since the last sound went in, in the accent, on the tail's scales. */
function drawRide(frame: DisplayFrame, ride: Ride, box: Box, span: number): void {
  const age = riding(frame, ride)
  if (age === null) return
  const { ctx, colours } = frame
  const slot = span / RIDE_SLOTS
  const points = ride.points
  let count = 0
  for (let back = Math.min(RIDE_SLOTS - 1, Math.floor(age / slot)); back >= 0; back--) {
    const sec = age - back * slot
    if (sec > span) break
    put(points, count++, xOfSec(sec, box, span), yOfLevel(ride.level.at(back) - ride.ref, box))
  }
  points.length = count
  trace(ctx, points, { colour: colours.accent, width: 1.25 })
  const [x, y] = points[points.length - 1] ?? [box.x, yOfLevel(ride.level.at(0) - ride.ref, box)]
  dot(ctx, x, y, 2.25, colours.accent, { ring: colours.ink })
}

/** An upright line in the accent where the last sound that went in is now, on a panel's own time scale. */
function playhead(frame: DisplayFrame, ride: Ride, box: Box, span: number): void {
  const age = riding(frame, ride)
  if (age === null || age > span) return
  const x = xOfSec(age, box, span)
  rule(frame.ctx, x, box.y, x, box.y + box.h, { colour: frame.colours.accent, alpha: 0.75 })
}

interface TailPicture {
  /** The level the device's own figures give, as points of the panel. */
  curve: readonly Point[]
  /** A second fall under it: the part of the sound that dies sooner. */
  under?: readonly Point[]
  /** A line the display draws beside the curve itself, for the words to keep clear of. */
  beside?: readonly Point[]
  /** The time to fall 60 dB, said. */
  said: string
}

/** The tail's panel: its scales, the fall the device is set to, the time said, and what rides it. */
function drawTail(
  frame: DisplayFrame,
  box: Box,
  span: number,
  picture: TailPicture,
  ride: Ride,
): void {
  const { ctx, colours } = frame
  const foot = box.y + box.h
  dbGrid(frame, box, TOP_DB, FOOT_DB, 20, 1)
  secondLines(frame, box, span)
  rule(ctx, box.x, foot, box.x + box.w, foot, { colour: colours.ink, alpha: INK.rule })
  clipped(ctx, { x: box.x, y: box.y - 2, w: box.w, h: box.h + 3 }, () => {
    fillTo(ctx, picture.curve, foot, colours.ink, INK.fill)
    if (picture.under) {
      fillTo(ctx, picture.under, foot, colours.ink, INK.fill)
      trace(ctx, picture.under, { colour: colours.ink, width: 1, alpha: INK.back })
    }
    trace(ctx, picture.curve, { colour: colours.ink })
  })
  // The time is said where the fall leaves room: above it at the right, or under it at the left.
  const corner = box.x + box.w * 0.7
  const under = box.y + 12
  const crowds = (line: readonly Point[]): boolean =>
    line.some(([x, y], i) => {
      if (x >= corner && y < under) return true
      const next = line[i + 1]
      if (!next || x >= corner || next[0] <= corner) return false
      return y + ((next[1] - y) * (corner - x)) / (next[0] - x) < under
    })
  const crowded = crowds(picture.curve) || (picture.beside ? crowds(picture.beside) : false)
  if (crowded) {
    text(frame, picture.said, box.x + 2, foot - 3, { size: 8 })
  } else {
    text(frame, picture.said, box.x + box.w - 1, box.y + 7, { align: 'right', size: 8 })
  }
  drawRide(frame, ride, box, span)
}

/** The line between the two parts. */
function divide(frame: Paint & Size, at: number): void {
  rule(frame.ctx, 1, at, frame.width - 1, at, { colour: frame.colours.ink, alpha: INK.rule })
}

/** The decay's handle: the tail's end, taken along the fall. */
function decayHandle(
  view: DisplayView,
  span: number,
  param: string,
  from = 0,
  name = 'Decay',
): DisplayHandle {
  const { tail } = panels(view)
  const spec = view.spec(param)
  const [x, y] = fallEnd(tail, span, view.value(param), from)
  return {
    key: param,
    name,
    x,
    y,
    drag: (toX, toY) => ({
      [param]: clamp(fallThrough(tail, span, toX, toY, from), spec?.min ?? 0.1, spec?.max ?? 60),
    }),
    reset: () => ({ [param]: spec?.default ?? view.value(param) }),
  }
}

// --- Bloom ------------------------------------------------------------------

/** Seconds across Bloom's two panels. */
const BLOOM_SPAN = 10
/** `bloom_reverb.h`: the eight lines, in seconds (samples at 44.1 kHz), and a grain of the drifter. */
const BLOOM_LINES = [4799, 5399, 5801, 6199, 6599, 6997, 7393, 7789].map((n) => n / 44100)
const BLOOM_MEAN_LINE = BLOOM_LINES.reduce((sum, sec) => sum + sec, 0) / BLOOM_LINES.length
const BLOOM_GRAIN_SEC = 6144 / 48000
/** `kDriftInjection`: the share of the shifted sound that goes round again, times Bloom. */
const BLOOM_INJECTION = 0.25
const BLOOM_INTERVALS: readonly (readonly number[])[] = [[7], [12], [12, 7]]

/** `SpectralDrifter::process`: how far the grains are shifted, from Bloom and the age of the ringing (0..1). */
export function bloomIntensity(bloom: number, age: number): number {
  return bloom * (0.3 + 0.7 * clamp(age, 0, 1))
}

/**
 * The speeds the grains play at, one for each group of grains that shares a
 * target, as `SpectralDrifter::process` and `calculatePitchRatio` set them:
 * unison blended towards the interval by the intensity. Atonal has no fixed
 * interval: its target follows the intensity too, so it is applied twice.
 */
export function bloomRatios(interval: number, direction: number, intensity: number): number[] {
  const blend = (target: number): number => 1 + (target - 1) * intensity
  if (interval >= 3) {
    if (direction === 0) return [blend(2 ** intensity)]
    if (direction === 1) return [blend(2 ** -intensity)]
    return [blend(2 ** (0.7 * intensity)), blend(2 ** (-0.5 * intensity))]
  }
  const steps = BLOOM_INTERVALS[clamp(Math.round(interval), 0, 2)]
  const ways = direction === 0 ? [1] : direction === 1 ? [-1] : [1, -1]
  return ways.flatMap((way) => steps.map((step) => blend(2 ** ((way * step) / 12))))
}

const semitones = (ratio: number): number => 12 * Math.log2(Math.max(ratio, 1e-6))

interface BloomLine {
  points: Point[]
  alpha: number
  width: number
}

interface BloomState {
  ride: Ride
  made: string
  lines: BloomLine[]
  tail: Point[]
}

/** The semitones the upper panel spans, by the way the tail drifts: up, down, or both. */
const bloomRange = (direction: number): [number, number] =>
  direction === 0 ? [-2, 26] : direction === 1 ? [-26, 2] : [-15, 15]

const bloom = plateDisplay<BloomState>({
  place: 'window',
  columns: 2,
  params: ['bloom', 'direction', 'interval', 'decay'],
  live: { meters: true, signal: true },
  info: 'Above, the pitch of the tail against how long it has rung: it drifts towards the interval, the fainter lines are what went round and was shifted again, and the mark is the pitch now. Below, the tail falling 60 dB in the time said. Drag its end to set Decay.',
  init: () => ({ ride: newRide(BLOOM_SPAN), made: '', lines: [], tail: [] }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { own, tail, between } = panels(frame)
    const amount = frame.value('bloom')
    const direction = Math.round(frame.value('direction'))
    const interval = Math.round(frame.value('interval'))
    const decay = frame.value('decay')
    const [low, high] = bloomRange(direction)
    const yOfSemi = (semi: number): number =>
      own.y + ((high - clamp(semi, low - 4, high + 4)) / (high - low)) * own.h
    hear(frame, state.ride)

    const made = `${amount} ${direction} ${interval} ${decay} ${frame.width} ${frame.height}`
    if (made !== state.made) {
      state.made = made
      // The age of the ringing is counted against twice the Decay (`max_age_`).
      const ratiosAt = (sec: number): number[] =>
        bloomRatios(interval, direction, bloomIntensity(amount, sec / (2 * decay)))
      const groups = ratiosAt(0).length
      state.lines = []
      // Each trip round, a quarter of the shifted sound times Bloom is shifted
      // again: the same drift on top of itself, that much fainter.
      const fainter = 20 * Math.log10(Math.max(amount * BLOOM_INJECTION, 1e-4))
      for (let trip = 3; trip >= 1; trip--) {
        const alpha = trip === 1 ? 1 : clamp(1 + (fainter * (trip - 1)) / 36, 0, 1)
        if (alpha <= 0.02) continue
        for (let group = 0; group < groups; group++) {
          const points: Point[] = []
          for (let x = 0; x <= own.w; x += 2) {
            const semi = trip * semitones(ratiosAt((x / own.w) * BLOOM_SPAN)[group])
            points.push([own.x + x, yOfSemi(semi)])
          }
          state.lines.push({ points, alpha, width: trip === 1 ? 1.5 : 1 })
        }
      }
      // The tail: nothing until the shortest line has come round, then up over
      // half a grain's reach back in time, and down 60 dB in Decay seconds.
      const first = BLOOM_LINES[0]
      const full = BLOOM_MEAN_LINE + (1 + ratiosAt(0)[0]) * 0.5 * BLOOM_GRAIN_SEC
      state.tail = [[xOfSec(first, tail, BLOOM_SPAN), tail.y + tail.h]]
      for (let step = 1; step <= 4; step++) {
        const sec = first + ((full - first) * step) / 4
        const window = Math.sin((Math.PI / 2) * (step / 4)) ** 2
        state.tail.push([
          xOfSec(sec, tail, BLOOM_SPAN),
          yOfLevel((-60 * sec) / decay + 20 * Math.log10(window), tail),
        ])
      }
      state.tail.push(fallEnd(tail, BLOOM_SPAN, decay))
    }

    // Above: the pitch, in semitones from where the sound went in.
    secondLines(frame, own, BLOOM_SPAN)
    for (const semi of [-24, -12, 0, 12, 24]) {
      if (semi < low || semi > high) continue
      const y = yOfSemi(semi)
      rule(ctx, own.x, y, own.x + own.w, y, {
        colour: colours.ink,
        alpha: semi === 0 ? INK.rule : INK.grid,
      })
      if (semi !== 0) {
        text(frame, `${semi > 0 ? '+' : '−'}${Math.abs(semi)}`, own.x + 1, y - 2, {
          size: 8,
          alpha: INK.back,
        })
      }
    }
    clipped(ctx, own, () => {
      for (const line of state.lines) {
        trace(ctx, line.points, { colour: colours.ink, width: line.width, alpha: line.alpha })
      }
    })
    // The pitch now: the drifter's own figure, at the age the device counts.
    if (riding(frame, state.ride) !== null && frame.hasMeter('drift')) {
      const now = bloomRatios(interval, direction, clamp(frame.meter('drift'), 0, 1))
      const sec = clamp(frame.meter('age'), 0, 1) * 2 * decay
      for (const ratio of now) {
        dot(ctx, xOfSec(sec, own, BLOOM_SPAN), yOfSemi(semitones(ratio)), 2.5, colours.accent, {
          ring: colours.ink,
        })
      }
    }

    divide(frame, between)
    drawTail(frame, tail, BLOOM_SPAN, { curve: state.tail, said: secondsText(decay) }, state.ride)
    for (const point of bloomHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: bloomHandles,
})

function bloomHandles(view: DisplayView): DisplayHandle[] {
  return [decayHandle(view, BLOOM_SPAN, 'decay')]
}

// --- Shimmer ----------------------------------------------------------------

/** Seconds across Shimmer's two panels. */
const SHIMMER_SPAN = 8
/** The note the ladder is drawn for: what a rung keeps depends on where it is, so one has to be taken. */
export const SHIMMER_NOTE_HZ = 220
/** `shimmer.h`: the tank's lines at Size 0.5, the steps, the shifters' windows and what follows them. */
const SHIMMER_LINES = [
  0.041354, 0.047896, 0.055104, 0.062313, 0.071938, 0.083271, 0.094729, 0.108104,
]
const SHIMMER_PASS = SHIMMER_LINES.reduce((sum, sec) => sum + sec, 0) / SHIMMER_LINES.length
const SHIMMER_RATIOS = [2, 1.5, 3, 0.5, 4]
const SHIMMER_WINDOW_SEC = (8192 + 6827) / 2 / 48000
const SHIMMER_AFTER_SEC = ((337 + 521 + 389 + 463) / 2 + 1024 / 2) / 48000
const SHIMMER_MOST_RUNGS = 12

/** `kit::Svf` as a low-pass or a high-pass: what it keeps of a frequency, as power. Exact for the digital filter. */
function svfPower(
  kind: 'lowpass' | 'highpass',
  hz: number,
  cutHz: number,
  q: number,
  sampleRate: number,
): number {
  if (hz >= sampleRate * 0.49) return kind === 'lowpass' ? 0 : 1
  const x =
    Math.tan((Math.PI * hz) / sampleRate) /
    Math.tan((Math.PI * clamp(cutHz, 5, sampleRate * 0.49)) / sampleRate)
  const through = 1 / ((1 - x * x) ** 2 + (x / q) ** 2)
  return kind === 'lowpass' ? through : through * x ** 4
}

/** `kit::OnePole` as a low-pass (and what is left as a high-pass): what it keeps of a frequency, as power. */
function onePolePower(
  kind: 'lowpass' | 'highpass',
  hz: number,
  cutHz: number,
  sampleRate: number,
): number {
  const a = Math.exp((-2 * Math.PI * clamp(cutHz, 0, sampleRate * 0.49)) / sampleRate)
  const cos = Math.cos((2 * Math.PI * Math.min(hz, sampleRate / 2)) / sampleRate)
  const under = 1 + a * a - 2 * a * cos
  return kind === 'lowpass' ? ((1 - a) * (1 - a)) / under : (a * a * (2 - 2 * cos)) / under
}

export interface ShimmerSettings {
  decay: number
  shimmer: number
  interval: number
  size: number
  tone: number
  predelay: number
  lowCut: number
}

export interface ShimmerLadder {
  /** Seconds one trip round the tank takes. */
  pass: number
  /** When the tank starts to answer, in seconds. */
  from: number
  /** The step of a rung, as a ratio of frequency. */
  ratio: number
  /** The rungs: the level in each, dB, at every pass, under the level that went in. */
  rungs: Float32Array[]
  /** All the rungs together, dB at every pass. */
  total: Float32Array
  /** Seconds for the whole to fall 60 dB; Infinity if it does not within the passes run. */
  rt60: number
}

/**
 * The tank of `shimmer.h` as energy, one trip at a time. After the Hadamard
 * mix two channels in eight pass the shifter, blended with equal power by
 * Shimmer, so each trip a share `sin²(Shimmer · 90°) / 4` of what a rung
 * holds moves up one, through the shifter's filters and later by the
 * shifter's own delay; the rest stays. Every trip also costs the decay gain
 * and the Tone damping at the rung's own frequency, which is what stops the
 * climb. What is heard is tapped before the shifter, through Low Cut.
 */
export function shimmerLadder(
  settings: ShimmerSettings,
  seconds: number,
  sampleRate = 48000,
): ShimmerLadder {
  const ratio = SHIMMER_RATIOS[clamp(Math.round(settings.interval), 0, 4)]
  const pass = SHIMMER_PASS * (0.5 + clamp(settings.size, 0, 1))
  const passes = Math.max(2, Math.ceil(seconds / pass) + 1)
  const kept = Math.pow(10, (-6 * pass) / Math.max(settings.decay, 0.01))
  const send = Math.sin((Math.PI / 2) * clamp(settings.shimmer, 0, 1))
  const moved = 0.25 * send * send
  const late = Math.max(
    0,
    Math.round((0.5 * Math.abs(ratio - 1) * SHIMMER_WINDOW_SEC + SHIMMER_AFTER_SEC) / pass),
  )
  const hz: number[] = []
  for (let k = 0; k < SHIMMER_MOST_RUNGS; k++) {
    const at = SHIMMER_NOTE_HZ * Math.pow(ratio, k)
    if (at > sampleRate * 0.45 || at < 16) break
    hz.push(at)
  }
  const bandLimit = Math.min((0.4 * sampleRate) / Math.max(ratio, 1), 16000)
  const ceiling = Math.min(0.75 * settings.tone, 6000)
  const floor = Math.max(settings.lowCut, 60)
  const damping = hz.map((at) => onePolePower('lowpass', at, settings.tone, sampleRate))
  // Into rung k: band-limited where it was, then the low-pass and high-pass where it lands.
  const through = hz.map((at, k) =>
    k === 0
      ? 0
      : svfPower('lowpass', hz[k - 1], bandLimit, 0.6, sampleRate) *
        svfPower('lowpass', at, ceiling, 0.6, sampleRate) *
        onePolePower('highpass', at, floor, sampleRate),
  )
  const heard = hz.map((at) => svfPower('highpass', at, settings.lowCut, Math.SQRT1_2, sampleRate))
  const energy = hz.map(() => new Float64Array(passes))
  energy[0][0] = 1
  for (let n = 0; n + 1 < passes; n++) {
    for (let k = 0; k < hz.length; k++) {
      const arrives = k > 0 && n >= late ? energy[k - 1][n - late] * moved * through[k] : 0
      energy[k][n + 1] = (energy[k][n] * (1 - moved) + arrives) * kept * damping[k]
    }
  }
  const start = Math.max(heard[0], 1e-9)
  const rungs = hz.map(() => new Float32Array(passes))
  const total = new Float32Array(passes)
  let rt60 = Infinity
  for (let n = 0; n < passes; n++) {
    let sum = 0
    for (let k = 0; k < hz.length; k++) {
      const out = (energy[k][n] * heard[k]) / start
      rungs[k][n] = out > 1e-12 ? 10 * Math.log10(out) : FLOOR_DB
      sum += out
    }
    total[n] = sum > 1e-12 ? 10 * Math.log10(sum) : FLOOR_DB
    if (rt60 === Infinity && n > 0 && total[n] <= FOOT_DB) {
      const before = total[n - 1]
      rt60 = (n - 1 + (before - FOOT_DB) / Math.max(before - total[n], 1e-6)) * pass
    }
  }
  return { pass, from: settings.predelay * 0.001, ratio, rungs, total, rt60 }
}

/** A level of the ladder at a time, between two passes. */
function ladderAt(levels: Float32Array, ladder: ShimmerLadder, sec: number): number {
  const at = (sec - ladder.from) / ladder.pass
  if (at < 0) return FLOOR_DB
  const n = Math.min(levels.length - 2, Math.floor(at))
  return levels[n] + (levels[n + 1] - levels[n]) * Math.min(1, at - n)
}

interface ShimmerState {
  ride: Ride
  made: string
  ladder: ShimmerLadder | null
  /** A streak for each rung in view: its two edges, and where its line lies. */
  streaks: { upper: Point[]; lower: Point[] }[]
  tail: Point[]
}

const shimmerSettings = (view: DisplayView): ShimmerSettings => ({
  decay: view.value('decay'),
  shimmer: view.value('shimmer'),
  interval: view.value('interval'),
  size: view.value('size'),
  tone: view.value('tone'),
  predelay: view.value('predelay'),
  lowCut: view.value('lowCut'),
})

/** The octaves the ladder's panel spans about the note, by the way the tail steps. */
const shimmerRange = (ratio: number): [number, number] => (ratio > 1 ? [-0.6, 6.4] : [-3.4, 0.6])

const shimmer = plateDisplay<ShimmerState>({
  place: 'window',
  columns: 2,
  params: ['decay', 'shimmer', 'interval', 'size', 'tone', 'predelay', 'lowCut'],
  live: { signal: true },
  info: 'Above, pitch against time for a note at 220 Hz: each streak is the tail one step higher, as thick as it is loud, climbing until Tone, the dashed line, stops it. Below, all of it together falling 60 dB in the time said. Drag the end of the straight line to set Decay.',
  init: () => ({ ride: newRide(SHIMMER_SPAN), made: '', ladder: null, streaks: [], tail: [] }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { own, tail, between } = panels(frame)
    const settings = shimmerSettings(frame)
    hear(frame, state.ride)

    const made = `${Object.values(settings).join(' ')} ${frame.sampleRate} ${frame.width} ${frame.height}`
    if (made !== state.made || !state.ladder) {
      state.made = made
      // Run past the panel when Decay is longer than it shows: the time said is the whole fall.
      const ladder = shimmerLadder(
        settings,
        Math.max(SHIMMER_SPAN, settings.decay * 1.05 + 1),
        frame.sampleRate,
      )
      state.ladder = ladder
      const [low, high] = shimmerRange(ladder.ratio)
      const step = Math.abs(Math.log2(ladder.ratio))
      const thick = clamp(0.42 * step * (own.h / (high - low)), 1, 3.2)
      state.streaks = []
      ladder.rungs.forEach((levels, k) => {
        const octaves = k * Math.log2(ladder.ratio)
        if (octaves < low || octaves > high) return
        const y = own.y + ((high - octaves) / (high - low)) * own.h
        const upper: Point[] = []
        const lower: Point[] = []
        for (let x = 0; x <= own.w; x += 2) {
          const db = ladderAt(levels, ladder, (x / own.w) * SHIMMER_SPAN)
          const half = thick * clamp(1 - db / FOOT_DB, 0, 1)
          upper.push([own.x + x, y - half])
          lower.push([own.x + x, y + half])
        }
        state.streaks.push({ upper, lower })
      })
      const foot = tail.y + tail.h
      state.tail = [[xOfSec(ladder.from, tail, SHIMMER_SPAN), foot]]
      for (let x = 0; x <= tail.w; x += 2) {
        const sec = (x / tail.w) * SHIMMER_SPAN
        if (sec < ladder.from) continue
        const db = ladderAt(ladder.total, ladder, sec)
        state.tail.push([tail.x + x, yOfLevel(db, tail)])
        if (db <= FOOT_DB) break
      }
    }
    const ladder = state.ladder
    const [low, high] = shimmerRange(ladder.ratio)
    const yOfOctaves = (octaves: number): number =>
      own.y + ((high - clamp(octaves, low, high)) / (high - low)) * own.h

    // Above: the ladder. Where the shifted sound is let back in ends it, at both ends.
    secondLines(frame, own, SHIMMER_SPAN)
    const ceiling = yOfOctaves(Math.log2(Math.min(0.75 * settings.tone, 6000) / SHIMMER_NOTE_HZ))
    rule(ctx, own.x, ceiling, own.x + own.w, ceiling, {
      colour: colours.ink,
      alpha: INK.back,
      dash: [3, 2],
    })
    if (ladder.ratio < 1) {
      const floor = yOfOctaves(Math.log2(Math.max(settings.lowCut, 60) / SHIMMER_NOTE_HZ))
      rule(ctx, own.x, floor, own.x + own.w, floor, {
        colour: colours.ink,
        alpha: INK.back,
        dash: [3, 2],
      })
    }
    clipped(ctx, own, () => {
      for (const streak of state.streaks) {
        fillBetween(ctx, streak.upper, streak.lower, colours.ink, 0.92)
      }
    })
    // The step of a rung, in semitones.
    const step = Math.round(semitones(ladder.ratio))
    text(frame, `${step > 0 ? '+' : '−'}${Math.abs(step)}`, own.x + own.w - 1, own.y + 7, {
      align: 'right',
      size: 8,
    })
    playhead(frame, state.ride, own, SHIMMER_SPAN)

    divide(frame, between)
    // The straight line is the tank's own decay; the tail lies under it by what climbed out of the top.
    const end = fallEnd(tail, SHIMMER_SPAN, settings.decay, ladder.from)
    rule(ctx, xOfSec(ladder.from, tail, SHIMMER_SPAN), tail.y, end[0], end[1], {
      colour: colours.ink,
      alpha: INK.back,
      dash: [2, 2],
      width: 1.01,
    })
    drawTail(
      frame,
      tail,
      SHIMMER_SPAN,
      {
        curve: state.tail,
        beside: [[xOfSec(ladder.from, tail, SHIMMER_SPAN), tail.y], end],
        said: secondsText(ladder.rt60),
      },
      state.ride,
    )
    for (const point of shimmerHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: shimmerHandles,
})

function shimmerHandles(view: DisplayView): DisplayHandle[] {
  return [decayHandle(view, SHIMMER_SPAN, 'decay', view.value('predelay') * 0.001)]
}

// --- Expanse ----------------------------------------------------------------

/** Seconds across Expanse's tail, and Sizes across its upper panel. */
const EXPANSE_SPAN = 20
const EXPANSE_SIZES = 3
/** Slots a Size is cut into for the arrival. */
const EXPANSE_SLOTS = 80
/** `expanse.h`: every length as a share of the Size, and the allpass coefficients at Density 1. */
const EXPANSE_LINES = [1, 0.8409, 0.7071, 0.5946]
const EXPANSE_SKEW = [1, 0.93, 1.07, 0.87]
const EXPANSE_LOOP = [0.113, 0.071, 0.047]
const EXPANSE_BLOOM = [0.043, 0.067, 0.097, 0.139, 0.191]
const EXPANSE_TAPS = [
  [0.83, 0.69, 0.127, 0.555],
  [0.41, 0.951, 0.933, 0.269],
]
const EXPANSE_INPUT_SEC = [229, 173, 611, 447].map((samples) => samples / 48000)
const EXPANSE_INPUT_DIFFUSION = 0.7
const EXPANSE_LOOP_DIFFUSION = 0.62
const EXPANSE_BLOOM_DIFFUSION = 0.62

/** The Size knob as the seconds of the longest line (`control()`: 40 ms to 2.5 s). */
export const expanseSeconds = (size: number): number => 0.04 * Math.pow(2.5 / 0.04, size)

/**
 * A sound's energy through an allpass `delay` slots long with coefficient
 * `c`: the share c² comes out at once, and the rest in echoes a delay apart,
 * each c² of the one before. In place of the samples, the energy in each slot.
 */
function throughAllpass(energy: Float64Array, delay: number, c: number): Float64Array {
  const slots = Math.round(delay)
  if (slots < 1) return energy
  const now = c * c
  const later = (1 - now) * (1 - now)
  const held = new Float64Array(energy.length)
  const out = new Float64Array(energy.length)
  for (let i = 0; i < energy.length; i++) {
    const delayed = i >= slots ? held[i - slots] : 0
    held[i] = energy[i] + now * delayed
    out[i] = now * energy[i] + later * delayed
  }
  return out
}

export interface ExpanseSettings {
  size: number
  decay: number
  gravity: number
  density: number
  /** The top of Decay's range: there the loop loses nothing. */
  decayMost: number
}

export interface ExpanseArrival {
  /** The Size in seconds, and the seconds of one slot of `level`. */
  seconds: number
  slot: number
  /** The level coming out in every slot, dB under its highest. */
  level: Float32Array
  /** When the first sound comes back, and when the level is first within a dB of its highest. */
  first: number
  peak: number
}

/**
 * How Expanse answers a sound over its first few Sizes, as energy in slots of
 * an eightieth of a Size, ported from `process()` and `control()`: the four
 * input allpasses, the five long ones of the bloom blended in by Gravity with
 * equal power, then the loop, where every pass goes through three allpasses,
 * down a line, out at the eight taps, and back through the decay gain.
 */
export function expanseArrival(settings: ExpanseSettings, sizes = EXPANSE_SIZES): ExpanseArrival {
  const seconds = expanseSeconds(settings.size)
  const slot = seconds / EXPANSE_SLOTS
  const count = Math.round(sizes * EXPANSE_SLOTS)
  let direct: Float64Array = new Float64Array(count)
  direct[0] = 1
  for (const sec of EXPANSE_INPUT_SEC) {
    direct = throughAllpass(direct, sec / slot, EXPANSE_INPUT_DIFFUSION * settings.density)
  }
  let swell = direct
  for (const share of EXPANSE_BLOOM) {
    swell = throughAllpass(swell, share * 1.03 * EXPANSE_SLOTS, EXPANSE_BLOOM_DIFFUSION)
  }
  const angle = (Math.PI / 2) * clamp(settings.gravity, 0, 1)
  const near = Math.cos(angle) ** 2
  const far = Math.sin(angle) ** 2

  const endless = settings.decay >= settings.decayMost * 0.995
  const lines = EXPANSE_LINES.map((share) => Math.max(1, Math.round(share * EXPANSE_SLOTS)))
  const loopShare = EXPANSE_LOOP.reduce((sum, share) => sum + share, 0)
  const kept = EXPANSE_LINES.map((share, n) =>
    endless
      ? 1
      : Math.pow(10, (-6 * seconds * (share + loopShare * EXPANSE_SKEW[n])) / settings.decay),
  )
  const stages = EXPANSE_LOOP.map((share) => Math.max(1, Math.round(share * EXPANSE_SLOTS)))
  const c2 = (EXPANSE_LOOP_DIFFUSION * settings.density) ** 2
  const later = (1 - c2) * (1 - c2)
  const held = stages.map(() => new Float64Array(count))
  const back = new Float64Array(count)
  const written = new Float64Array(count)
  for (let i = 0; i < count; i++) {
    let x = near * direct[i] + far * swell[i] + back[i]
    stages.forEach((delay, k) => {
      const delayed = i >= delay ? held[k][i - delay] : 0
      held[k][i] = x + c2 * delayed
      x = c2 * x + later * delayed
    })
    written[i] = x
    lines.forEach((length, n) => {
      if (i + length < count) back[i + length] += 0.25 * kept[n] * x
    })
  }
  const out = new Float64Array(count)
  let most = 0
  for (let i = 0; i < count; i++) {
    let sum = 0
    for (const side of EXPANSE_TAPS) {
      side.forEach((share, n) => {
        const at = i - Math.round(share * EXPANSE_LINES[n] * EXPANSE_SLOTS)
        if (at >= 0) sum += written[at]
      })
    }
    out[i] = sum / 8
    if (sum / 8 > most) most = sum / 8
  }
  const level = new Float32Array(count)
  let first = -1
  let peak = -1
  for (let i = 0; i < count; i++) {
    level[i] = out[i] > most * 1e-9 && most > 0 ? 10 * Math.log10(out[i] / most) : FLOOR_DB
    if (first < 0 && level[i] > FOOT_DB) first = i
    if (peak < 0 && level[i] >= -1) peak = i
  }
  return { seconds, slot, level, first: Math.max(0, first) * slot, peak: Math.max(0, peak) * slot }
}

const expanseSettings = (view: DisplayView): ExpanseSettings => ({
  size: view.value('size'),
  decay: view.value('decay'),
  gravity: view.value('gravity'),
  density: view.value('density'),
  decayMost: view.spec('decay')?.max ?? 60,
})

/** The last few arrivals worked out, by their settings: a frame and a handle ask for the same one. */
const expanseKept = new Map<string, ExpanseArrival>()

function expanseFor(settings: ExpanseSettings): ExpanseArrival {
  const key = `${settings.size} ${settings.decay} ${settings.gravity} ${settings.density}`
  let arrival = expanseKept.get(key)
  if (!arrival) {
    if (expanseKept.size >= 12) expanseKept.clear()
    arrival = expanseArrival(settings)
    expanseKept.set(key, arrival)
  }
  return arrival
}

/** Seconds for the loop to fall 60 dB: Decay, and no end at the very top of the knob. */
const expanseDecay = (settings: ExpanseSettings): number =>
  settings.decay >= settings.decayMost * 0.995 ? Infinity : settings.decay

interface ExpanseState {
  ride: Ride
  made: string
  arrival: Point[]
  tail: Point[]
}

const expanse = plateDisplay<ExpanseState>({
  place: 'window',
  columns: 2,
  params: ['size', 'decay', 'gravity', 'density', 'freeze'],
  live: { signal: true },
  info: 'Above, how the space answers a sound over its first three Sizes: when the first echo comes back, how Gravity lets it swell, how Density runs the echoes together. Below, the tail falling 60 dB in the time said, level when frozen. Drag its end to set Decay.',
  init: () => ({ ride: newRide(EXPANSE_SPAN), made: '', arrival: [], tail: [] }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { own, tail, between } = panels(frame)
    const settings = expanseSettings(frame)
    const frozen = frame.value('freeze') >= 0.5
    const model = expanseFor(settings)
    const decay = expanseDecay(settings)
    const head = EXPANSE_SIZES * model.seconds
    hear(frame, state.ride)

    const made = `${settings.size} ${settings.decay} ${settings.gravity} ${settings.density} ${frozen} ${frame.width} ${frame.height}`
    if (made !== state.made) {
      state.made = made
      const count = model.level.length
      state.arrival = []
      // The loudest slot under each pixel, so a single echo keeps its height.
      const per = Math.max(1, Math.round(count / own.w))
      for (let i = 0; i < count; i += per) {
        let db = FLOOR_DB
        for (let j = i; j < Math.min(count, i + per); j++) db = Math.max(db, model.level[j])
        state.arrival.push([own.x + (i / count) * own.w, yOfLevel(db, own)])
      }
      const foot = tail.y + tail.h
      if (frozen) {
        // Frozen, the loop loses nothing and takes nothing in: what is there stays.
        state.tail = [
          [tail.x, tail.y],
          [tail.x + tail.w, tail.y],
        ]
      } else {
        // Up to its highest the tail is the arrival; from there it falls as the loop's gain has it.
        state.tail = [[xOfSec(model.first, tail, EXPANSE_SPAN), foot]]
        const until = Math.min(count, Math.round(model.peak / model.slot))
        const step = Math.max(1, Math.round(EXPANSE_SPAN / tail.w / model.slot))
        for (let i = Math.round(model.first / model.slot); i < until; i += step) {
          let db = FLOOR_DB
          for (let j = i; j < Math.min(until, i + step); j++) db = Math.max(db, model.level[j])
          state.tail.push([xOfSec(i * model.slot, tail, EXPANSE_SPAN), yOfLevel(db, tail)])
        }
        state.tail.push([xOfSec(model.peak, tail, EXPANSE_SPAN), tail.y])
        state.tail.push(fallEnd(tail, EXPANSE_SPAN, decay, model.peak))
      }
    }

    // Above: the first three Sizes, a line at each.
    for (let size = 1; size < EXPANSE_SIZES; size++) {
      const x = xOfSec(size * model.seconds, own, head)
      rule(ctx, x, own.y, x, own.y + own.h, { colour: colours.ink, alpha: INK.grid })
    }
    dbGrid(frame, own, TOP_DB, FOOT_DB, 20, 1)
    clipped(ctx, own, () => {
      // Frozen, nothing new is let in: the answer is drawn as what it would be.
      if (!frozen) fillTo(ctx, state.arrival, own.y + own.h, colours.ink, INK.fill)
      trace(ctx, state.arrival, {
        colour: colours.ink,
        width: frozen ? 1 : 1.5,
        alpha: frozen ? INK.back : 1,
        dash: frozen ? [2, 2] : undefined,
      })
    })
    text(frame, secondsText(model.seconds), own.x + own.w - 1, own.y + own.h - 3, {
      align: 'right',
      size: 8,
    })
    if (!frozen) playhead(frame, state.ride, own, head)

    divide(frame, between)
    if (frozen) {
      const end = fallEnd(tail, EXPANSE_SPAN, decay, model.peak)
      rule(ctx, xOfSec(model.peak, tail, EXPANSE_SPAN), tail.y, end[0], end[1], {
        colour: colours.ink,
        alpha: INK.back,
        dash: [2, 2],
        width: 1.01,
      })
    }
    drawTail(
      frame,
      tail,
      EXPANSE_SPAN,
      { curve: state.tail, said: frozen ? 'held' : secondsText(decay) },
      state.ride,
    )
    for (const point of expanseHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: expanseHandles,
})

function expanseHandles(view: DisplayView): DisplayHandle[] {
  const settings = expanseSettings(view)
  const { tail } = panels(view)
  const from = expanseFor(settings).peak
  const [x, y] = fallEnd(tail, EXPANSE_SPAN, expanseDecay(settings), from)
  const spec = view.spec('decay')
  return [
    {
      key: 'decay',
      name: 'Decay',
      x,
      y,
      drag: (toX, toY) => ({
        decay: clamp(
          fallThrough(tail, EXPANSE_SPAN, toX, toY, from),
          spec?.min ?? 0.5,
          spec?.max ?? 60,
        ),
      }),
      reset: () => ({ decay: spec?.default ?? 10 }),
    },
  ]
}

// --- Swarm Reverb ----------------------------------------------------------

/** Seconds across Swarm Reverb's tail. */
const SWARM_SPAN = 12
const SWARM_TAPS = 14
const SWARM_SEED = 0x1f83d9ab
const SWARM_FIRST = 0.035
const SWARM_CURVE = 1.25
const SWARM_TILT_DB = 6
/** Where each side's line is read for the loop, and the four allpasses of each, as shares of a pass. */
const SWARM_LOOP = [1, 0.887]
const SWARM_STAGES = [
  [0.0037, 0.0059, 0.0083, 0.0113],
  [0.0041, 0.0061, 0.0079, 0.0121],
]
const SWARM_BLUR_MOST = 0.7
/** Stretch with Steps on, in octaves of time: 1/2, 2/3, 3/4, 1, 4/3, 3/2 and 2 times Length. */
export const SWARM_STEPS = [-1, -0.5849625, -0.4150375, 0, 0.4150375, 0.5849625, 1]
/** Slots of the echo train under each pixel while it is worked out. */
const SWARM_FINE = 4

export interface SwarmTap {
  /** When the echo arrives, as a share of one pass. */
  arrival: number
  /** How loud and which way up. */
  gain: number
}

let swarmTable: SwarmTap[][] | null = null

/**
 * The fourteen echoes of each side, ported from `build_swarm()` with its
 * generator (`kit::Rng`) and its seed, so these are the device's own echoes
 * and not a likeness: one per fourteenth of the pass, moved about in its slot,
 * closer together at the front, the last 6 dB under the first.
 */
export function swarmTaps(): SwarmTap[][] {
  if (swarmTable) return swarmTable
  let state = SWARM_SEED
  const uniform = (): number => {
    state ^= state << 13
    state >>>= 0
    state ^= state >>> 17
    state ^= state << 5
    state >>>= 0
    return (state >>> 8) / 16777216
  }
  swarmTable = [0, 1].map(() => {
    const taps: SwarmTap[] = []
    let energy = 0
    for (let k = 0; k < SWARM_TAPS; k++) {
      let u = (k + 0.5 + 0.7 * (uniform() - 0.5)) / SWARM_TAPS
      if (k === SWARM_TAPS - 1) u = 1
      const arrival = SWARM_FIRST + (1 - SWARM_FIRST) * Math.pow(u, SWARM_CURVE)
      // The sweep's phase and rate are drawn between the time and the sign.
      uniform()
      uniform()
      const sign = uniform() < 0.5 ? -1 : 1
      const gain = sign * Math.pow(10, (-SWARM_TILT_DB * arrival) / 20)
      energy += gain * gain
      taps.push({ arrival, gain })
    }
    // The loop read draws two more before the other side begins.
    uniform()
    uniform()
    const scale = 1 / Math.sqrt(energy)
    return taps.map((tap) => ({ arrival: tap.arrival, gain: tap.gain * scale }))
  })
  return swarmTable
}

/** Where Stretch puts the size, in octaves of time, as `control()` has it: free, or the nearest step. */
export function swarmOctaves(stretch: number, steps: boolean): number {
  const knob = 2 * stretch - 1
  if (!steps) return clamp(knob, -1, 1)
  let nearest = 0
  for (let s = 1; s < SWARM_STEPS.length; s++) {
    if (Math.abs(SWARM_STEPS[s] - knob) < Math.abs(SWARM_STEPS[nearest] - knob)) nearest = s
  }
  return SWARM_STEPS[nearest]
}

/** Seconds of one pass through the swarm: Length, stretched. */
export const swarmSeconds = (length: number, stretch: number, steps: boolean): number =>
  length * Math.pow(2, swarmOctaves(stretch, steps))

/**
 * Seconds for the cave to fall 60 dB. Every trip round the loop is a pass
 * long on one side and 0.887 of one on the other, and comes back at Feedback
 * whatever the frequency (the turn between the sides loses nothing), so the
 * level falls 20 log10(Feedback) dB in 0.9435 of a pass. At 1 it does not end.
 */
export function swarmRt60(seconds: number, feedback: number): number {
  if (feedback >= 1) return Infinity
  if (feedback <= 0) return 0
  const trip = (seconds * (SWARM_LOOP[0] + SWARM_LOOP[1])) / 2
  return (3 * trip) / -Math.log10(feedback)
}

/**
 * What comes back from one sound in the middle, as the size of the echoes in
 * every one of `slots` equal steps of `passes` passes, left and right.
 * Ported from `render()`: the taps of the first pass, then every trip round
 * the loop, which sends each side's end back into both (a quarter turn, the
 * left into the right upside down) at Feedback; and Blur's four allpasses,
 * which spill each echo over the next few hundredths of a pass. 1 is the
 * loudest echo of an unblurred swarm.
 */
export function swarmEchoes(
  passes: number,
  feedback: number,
  blur: number,
  slots: number,
): [Float32Array, Float32Array] {
  const taps = swarmTaps()
  const fine = slots * SWARM_FINE
  const perPass = fine / passes
  const back = Math.min(Math.max(feedback, 0), 1) * Math.SQRT1_2
  const c = clamp(blur, 0, 1) * SWARM_BLUR_MOST
  const loudest = Math.max(...taps[0].map((tap) => tap.gain * tap.gain))
  // What is on each line: when it was written (in ten thousandths of a pass) and how large.
  let lines: Map<number, number>[] = [new Map([[0, 1]]), new Map([[0, 1]])]
  const energy = [new Float64Array(fine), new Float64Array(fine)]
  for (let trip = 0; trip < 24; trip++) {
    let any = false
    for (let side = 0; side < 2; side++) {
      const before = SWARM_STAGES[side].reduce((sum, span) => sum + span, 0)
      for (const [at, size] of lines[side]) {
        for (const tap of taps[side]) {
          const slot = Math.floor((at / 1e4 + tap.arrival - before) * perPass)
          if (slot >= fine) continue
          energy[side][Math.max(0, slot)] += size * size * tap.gain * tap.gain
          any = true
        }
      }
    }
    if (!any || back <= 0) break
    const next = [new Map<number, number>(), new Map<number, number>()]
    for (let side = 0; side < 2; side++) {
      for (const [at, size] of lines[side]) {
        // Whole ten thousandths of a pass, so two ways round of one length add up.
        const then = at + Math.round(SWARM_LOOP[side] * 1e4)
        next[0].set(then, (next[0].get(then) ?? 0) + size * back)
        next[1].set(then, (next[1].get(then) ?? 0) + (side === 0 ? -size : size) * back)
      }
    }
    lines = next
  }
  return [0, 1].map((side) => {
    let train: Float64Array = energy[side]
    if (c > 0) {
      for (const span of SWARM_STAGES[side]) {
        train = throughAllpass(train, Math.max(1, span * perPass), c)
      }
    }
    const out = new Float32Array(slots)
    for (let i = 0; i < slots; i++) {
      let sum = 0
      for (let j = 0; j < SWARM_FINE; j++) sum += train[i * SWARM_FINE + j]
      out[i] = Math.sqrt(sum / loudest)
    }
    return out
  }) as [Float32Array, Float32Array]
}

/** The passes the upper panel is wide, at the size Length alone sets: room for Stretch at its longest. */
const SWARM_PASSES = 2

interface SwarmState {
  ride: Ride
  made: string
  /** The stems of each side, as `strokes` takes them, and how many. */
  stems: [Float32Array, Float32Array]
  count: [number, number]
  tail: Point[]
}

/** The size the cave is at: the device's own figure while sound runs, the knobs' otherwise. */
function swarmSize(frame: DisplayFrame): number {
  const set = swarmSeconds(
    frame.value('length'),
    frame.value('stretch'),
    frame.value('steps') >= 0.5,
  )
  if (!sounding(frame) || !frame.hasMeter('size')) return set
  const now = frame.meter('size')
  // Asleep or not yet run, the device has no figure: the knobs' own stands.
  return now > 0.01 ? clamp(now, 0.02, 3) : set
}

const swarm = plateDisplay<SwarmState>({
  place: 'window',
  columns: 2,
  params: ['length', 'stretch', 'steps', 'blur', 'feedback'],
  live: { meters: true, signal: true },
  info: 'Above, the echoes one sound sets off, left side up and right side down: the swarm, then each trip round fainter by Feedback and run together by Blur. Drag the handle on top to stretch the cave. Below, the tail falling 60 dB in the time said, its end the handle for Feedback.',
  init: () => ({
    ride: newRide(SWARM_SPAN),
    made: '',
    stems: [new Float32Array(0), new Float32Array(0)],
    count: [0, 0],
    tail: [],
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { own, tail, between } = panels(frame)
    const length = frame.value('length')
    const feedback = frame.value('feedback')
    const blur = frame.value('blur')
    const stepped = frame.value('steps') >= 0.5
    const seconds = swarmSize(frame)
    const head = SWARM_PASSES * length
    // The tail is drawn for the size the knobs set, where its handle stands; the
    // cave above is the size it is at, on its way there or wandering about it.
    const set = swarmSeconds(length, frame.value('stretch'), stepped)
    const rt60 = swarmRt60(set, feedback)
    hear(frame, state.ride)

    const middle = own.y + Math.round(own.h / 2) + 0.5
    const reach = own.h / 2 - 5
    const slots = Math.max(8, Math.round(own.w))
    // The size to a hundredth of a pixel: a glide redraws, a figure at rest does not.
    const made = `${Math.round((seconds / head) * own.w * 100)} ${set} ${feedback} ${blur} ${frame.width} ${frame.height}`
    if (made !== state.made) {
      state.made = made
      const echoes = swarmEchoes(head / seconds, feedback, blur, slots)
      for (let side = 0; side < 2; side++) {
        if (state.stems[side].length < slots * 4) state.stems[side] = new Float32Array(slots * 4)
        const stems = state.stems[side]
        let count = 0
        for (let i = 0; i < slots; i++) {
          const tall = Math.min(own.h / 2 - 1, echoes[side][i] * reach)
          if (tall < 0.5) continue
          const x = own.x + ((i + 0.5) / slots) * own.w
          stems[count * 4] = x
          stems[count * 4 + 1] = middle
          stems[count * 4 + 2] = x
          stems[count * 4 + 3] = middle + (side === 0 ? -tall : tall)
          count++
        }
        state.count[side] = count
      }
      // The tail: the first pass leans 6 dB from its first echo to its last, whatever
      // Feedback is; under it the trips round the loop fall at their own rate.
      const first = SWARM_FIRST * set
      const foot = tail.y + tail.h
      const level = (sec: number): number => {
        const loop = rt60 > 0 ? (-60 * (sec - first)) / rt60 : -Infinity
        const pass = sec <= set ? -SWARM_TILT_DB * (sec / set - SWARM_FIRST) : -Infinity
        return Math.max(loop, pass)
      }
      state.tail = [[xOfSec(first, tail, SWARM_SPAN), foot]]
      const step = SWARM_SPAN / tail.w
      let passed = false
      for (let sec = first; sec <= SWARM_SPAN + step; sec += step) {
        if (!passed && sec > set) {
          // The end of the first pass, exactly, so its edge stands upright.
          passed = true
          const x = xOfSec(set, tail, SWARM_SPAN)
          state.tail.push([x, yOfLevel(level(set), tail)])
          state.tail.push([x, yOfLevel(level(set + 1e-6), tail)])
        }
        const db = level(sec)
        state.tail.push([xOfSec(sec, tail, SWARM_SPAN), yOfLevel(db, tail)])
        if (db <= FOOT_DB) break
      }
    }

    // Above: the echoes, a line through the middle, and where one pass ends.
    rule(ctx, own.x, middle, own.x + own.w, middle, { colour: colours.ink, alpha: INK.rule })
    const end = xOfSec(seconds, own, head)
    rule(ctx, end, own.y, end, own.y + own.h, { colour: colours.ink, alpha: INK.rule })
    if (stepped) {
      // The seven sizes Stretch moves between with Steps on.
      for (const octaves of SWARM_STEPS) {
        const x = xOfSec(length * Math.pow(2, octaves), own, head)
        rule(ctx, x, own.y, x, own.y + 4, { colour: colours.ink, alpha: INK.text })
      }
    }
    clipped(ctx, own, () => {
      strokes(frame, state.stems[0], state.count[0], { colour: colours.ink })
      strokes(frame, state.stems[1], state.count[1], { colour: colours.ink })
    })
    playhead(frame, state.ride, own, head)
    text(frame, secondsText(seconds), own.x + own.w - 3, own.y + own.h - 1, {
      align: 'right',
      size: 8,
    })

    divide(frame, between)
    const said = secondsText(Number.isFinite(rt60) ? Math.max(rt60, set) : rt60)
    drawTail(frame, tail, SWARM_SPAN, { curve: state.tail, said }, state.ride)
    for (const point of swarmHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: swarmHandles,
})

function swarmHandles(view: DisplayView): DisplayHandle[] {
  const { own, tail } = panels(view)
  const length = view.value('length')
  const feedback = view.value('feedback')
  const stretch = view.value('stretch')
  const stepped = view.value('steps') >= 0.5
  const seconds = swarmSeconds(length, stretch, stepped)
  const first = SWARM_FIRST * seconds
  const [x, y] = fallEnd(tail, SWARM_SPAN, swarmRt60(seconds, feedback), first)
  const most = view.spec('feedback')?.max ?? 1.05
  return [
    {
      // Where the knob stands, which with Steps on is not always where the cave is.
      key: 'stretch',
      name: 'Stretch',
      x: own.x + (own.w * Math.pow(2, 2 * stretch - 1)) / SWARM_PASSES,
      y: own.y + 2,
      drag: (toX) => ({
        stretch: clamp(
          (Math.log2(Math.max(1e-3, (SWARM_PASSES * (toX - own.x)) / own.w)) + 1) / 2,
          0,
          1,
        ),
      }),
      reset: () => ({ stretch: view.spec('stretch')?.default ?? 0.5 }),
    },
    {
      key: 'feedback',
      name: 'Feedback',
      x,
      y,
      drag: (toX, toY) => {
        // Past 1 the cave feeds on itself and the tail has no end to take: left where it is
        // until the handle comes down off the top.
        if (feedback >= 1 && toY <= tail.y + 0.5 && toX >= tail.x + tail.w - 0.5)
          return { feedback }
        const rt60 = fallThrough(tail, SWARM_SPAN, toX, toY, first)
        const trip = (seconds * (SWARM_LOOP[0] + SWARM_LOOP[1])) / 2
        return { feedback: clamp(Math.pow(10, (-3 * trip) / rt60), 0, Math.min(1, most)) }
      },
      reset: () => ({ feedback: view.spec('feedback')?.default ?? 0.6 }),
    },
  ]
}

// --- Sympathetic -----------------------------------------------------------

/** Seconds across Sympathetic's tail. */
const SYMPATHETIC_SPAN = 8
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const MODE_NAMES = ['major', 'minor', 'learn']
const MAJOR = [0, 2, 4, 5, 7, 9, 11]
const MINOR = [0, 2, 3, 5, 7, 8, 10]
/** The notes the strings may take, C1 to B7 (`ScaleMapper`). */
const LOWEST_NOTE = 24
const HIGHEST_NOTE = 107
/** How far under full a string's level is still drawn, in dB: one that is only driven sits near the foot. */
const STRING_RANGE_DB = 48

/** A note as it is written: 60 is "C4". */
export const noteName = (note: number): string =>
  `${NOTE_NAMES[((note % 12) + 12) % 12]}${Math.floor(note / 12) - 1}`

export const hzOfNote = (note: number): number => 440 * Math.pow(2, (note - 69) / 12)

/**
 * The scale in use as semitones above the root, from `current_scale()`:
 * major or minor, and in Learn what has been gathered (`learned`, a bit for
 * each semitone), major until there is any.
 */
export function sympatheticScale(mode: number, learned = 0): number[] {
  if (mode === 1) return MINOR
  if (mode === 2 && learned > 0) {
    const scale: number[] = []
    for (let interval = 0; interval < 12; interval++) {
      if (learned & (1 << interval)) scale.push(interval)
    }
    if (scale.length) return scale
  }
  return MAJOR
}

/**
 * The notes of the strings, ported from `ScaleMapper::resonator_notes()`.
 * Before a note is heard (`heard` negative) they climb the scale from the
 * root at C3; after, they stand in that note's octave in order of consonance
 * (root, its octave, the fifth, the third, the rest) and then again an
 * octave up. Notes past either end are brought back by octaves.
 */
export function sympatheticNotes(
  count: number,
  root: number,
  scale: readonly number[],
  heard: number,
): number[] {
  const fold = (note: number): number => {
    while (note > HIGHEST_NOTE) note -= 12
    while (note < LOWEST_NOTE) note += 12
    return note
  }
  const notes: number[] = []
  if (heard < 0) {
    for (let i = 0; i < count; i++) {
      notes.push(fold(48 + root + scale[i % scale.length] + 12 * Math.floor(i / scale.length)))
    }
    return notes
  }
  const base = Math.floor(heard / 12) * 12 + root
  const order = [0, 12]
  const holds = (interval: number): boolean => order.some((each) => each % 12 === interval)
  for (const interval of scale) if (interval === 7) order.push(7)
  if (scale.length > 2 && !holds(scale[2])) order.push(scale[2])
  for (const interval of scale) if (!holds(interval)) order.push(interval)
  for (let i = 0; i < count; i++) {
    notes.push(fold(base + order[i % order.length] + 12 * Math.floor(i / order.length)))
  }
  return notes
}

/**
 * Seconds a string really takes to fall 60 dB, ported from
 * `TunedCombFilter::tune()` and `feedback_for()`: the feedback makes up what
 * the loop's low pass and its DC blocker take from the fundamental, but never
 * goes over 0.999, so from the fifth octave up a string dies sooner than
 * Decay says.
 */
export function stringSeconds(hz: number, decay: number, sampleRate = 48000): number {
  const w = (2 * Math.PI * hz) / sampleRate
  const cosw = Math.cos(w)
  // `set_damping(0.3 * 0.7)`, brought from 44.1 kHz to this rate.
  const k = (0.21 / (0.79 * 0.79)) * (sampleRate / 44100) ** 2
  const c = (2 * k + 1 - Math.sqrt(4 * k + 1)) / (2 * k)
  const r = 1 - (2 * Math.PI * 2) / sampleRate
  const lowPass = (1 - c) / Math.sqrt(1 + c * c - 2 * c * cosw)
  const blocker = 0.5 * (1 + r) * Math.sqrt((2 - 2 * cosw) / (1 + r * r - 2 * r * cosw))
  const loss = Math.max(1e-3, lowPass * blocker)
  const wanted = Math.exp(-6.907755278982137 / (hz * decay))
  const round = Math.min(wanted / loss, 0.999) * loss
  return -6.907755278982137 / (hz * Math.log(round))
}

interface StringsNow {
  root: number
  mode: number
  heard: number
  notes: number[]
  scale: readonly number[]
  /** The lowest note drawn (a C) and how many semitones the panel is wide. */
  low: number
  wide: number
}

/** The last few tunings worked out, by what they were worked out from. */
const stringsKept = new Map<string, StringsNow>()

/**
 * Where the strings are now: from the knobs, and from what the device has
 * heard where it says. How wide the panel is depends on the knobs alone, so
 * the handle stands on the root whatever has been heard: two octaves up to
 * eight strings, three up to fifteen, four for sixteen, and in Learn, where a
 * scale of a few notes sends the strings far up, the whole of C1 to B7.
 */
function stringsNow(view: DisplayView, frame?: DisplayFrame): StringsNow {
  const root = clamp(Math.round(view.value('root')), 0, 11)
  const mode = clamp(Math.round(view.value('mode')), 0, 2)
  const count = 4 + clamp(Math.round(view.value('strings')), 0, 12)
  const heard = frame?.hasMeter('note') ? Math.round(frame.meter('note')) : -1
  const learned = frame?.hasMeter('scale') ? clamp(Math.round(frame.meter('scale')), 0, 4095) : 0
  const key = `${root} ${mode} ${count} ${heard} ${learned}`
  const kept = stringsKept.get(key)
  if (kept) return kept
  const scale = sympatheticScale(mode, learned)
  const notes = sympatheticNotes(count, root, scale, heard)
  const low = mode === 2 ? LOWEST_NOTE : Math.floor(Math.min(...notes) / 12) * 12
  const wide = mode === 2 ? HIGHEST_NOTE + 1 - LOWEST_NOTE : count <= 8 ? 24 : count <= 15 ? 36 : 48
  const now = { root, mode, heard, notes, scale, low, wide }
  if (stringsKept.size >= 16) stringsKept.clear()
  stringsKept.set(key, now)
  return now
}

const xOfNote = (note: number, box: Box, now: StringsNow): number =>
  box.x + (clamp(note - now.low + 0.5, 0, now.wide) / now.wide) * box.w

/** A string's level from the device's readings: four strings to a reading, six bits each, dB above -63. */
function stringLevel(frame: DisplayFrame, index: number): number {
  const key = `strings${Math.floor(index / 4) + 1}`
  if (!frame.hasMeter(key)) return 0
  const packed = clamp(Math.floor(frame.meter(key)), 0, 16777215)
  return Math.floor(packed / Math.pow(64, index % 4)) % 64
}

interface SympatheticState {
  ride: Ride
}

const sympathetic = plateDisplay<SympatheticState>({
  place: 'window',
  columns: 2,
  params: ['root', 'mode', 'strings', 'decay'],
  live: { meters: true, signal: true },
  info: 'Above, the strings by pitch on the notes of their scale, each lit as high as it rings now, and under them the note last heard, which they move to. Drag the handle on the line to set Root. Below, the tail falling 60 dB in Decay, its end the handle, and the highest string where that dies sooner.',
  init: () => ({ ride: newRide(SYMPATHETIC_SPAN) }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { own, tail, between } = panels(frame)
    const now = stringsNow(frame, frame)
    const decay = frame.value('decay')
    hear(frame, state.ride)

    // Above: the scale on a line, the strings standing on it.
    const line = own.y + own.h - 8.5
    const top = own.y + 11
    const each = own.w / now.wide
    rule(ctx, own.x, line, own.x + own.w, line, { colour: colours.ink, alpha: INK.rule })
    for (let note = now.low; note < now.low + now.wide; note++) {
      const interval = (((note - now.root) % 12) + 12) % 12
      // The root has a string whatever Learn has gathered.
      if (interval !== 0 && !now.scale.includes(interval)) continue
      const x = xOfNote(note, own, now)
      rule(ctx, x, line, x, line + (interval === 0 ? 5 : 2.5), {
        colour: colours.ink,
        alpha: interval === 0 ? INK.text : INK.back,
      })
    }
    const lit = frame.powered && frame.signal !== null
    now.notes.forEach((note, index) => {
      const x = xOfNote(note, own, now)
      rule(ctx, x, top, x, line, { colour: colours.ink, alpha: INK.back })
      const level = lit ? stringLevel(frame, index) : 0
      const share = clamp((level - (63 - STRING_RANGE_DB)) / STRING_RANGE_DB, 0, 1)
      if (share > 0) {
        rule(ctx, x, line, x, line - share * (line - top), {
          colour: colours.accent,
          width: clamp(each * 0.6, 1.5, 3),
        })
      }
    })
    text(frame, `${NOTE_NAMES[now.root]} ${MODE_NAMES[now.mode]}`, own.x + 1, own.y + 7, {
      size: 8,
    })
    if (now.heard >= 0) {
      text(frame, `heard ${noteName(now.heard)}`, own.x + own.w - 1, own.y + 7, {
        align: 'right',
        size: 8,
      })
      dot(ctx, xOfNote(now.heard, own, now), line + 5, 2, colours.accent, { ring: colours.ink })
    }

    // Below: the tail, and under it the highest string where the loop cannot hold it as long.
    divide(frame, between)
    const start: Point = [tail.x, tail.y]
    const highest = stringSeconds(hzOfNote(Math.max(...now.notes)), decay, frame.sampleRate)
    drawTail(
      frame,
      tail,
      SYMPATHETIC_SPAN,
      {
        curve: [start, fallEnd(tail, SYMPATHETIC_SPAN, decay)],
        under:
          highest < decay * 0.95 ? [start, fallEnd(tail, SYMPATHETIC_SPAN, highest)] : undefined,
        said: secondsText(decay),
      },
      state.ride,
    )
    for (const point of sympatheticHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: sympatheticHandles,
})

function sympatheticHandles(view: DisplayView): DisplayHandle[] {
  const { own } = panels(view)
  const now = stringsNow(view)
  return [
    {
      key: 'root',
      name: 'Root',
      x: xOfNote(now.low + now.root, own, now),
      y: own.y + own.h - 8.5,
      drag: (toX) => ({
        root: clamp(Math.round(((toX - own.x) / own.w) * now.wide - 0.5), 0, 11),
      }),
      reset: () => ({ root: view.spec('root')?.default ?? 0 }),
    },
    decayHandle(view, SYMPATHETIC_SPAN, 'decay'),
  ]
}

// --- Vowel Reverb ----------------------------------------------------------

/** Seconds across Vowel Reverb's tail, and the frequencies and levels of its upper panel. */
const VOWEL_SPAN = 12
const VOWEL_LOW_HZ = 100
const VOWEL_HIGH_HZ = 10000
const VOWEL_TOP_DB = 12
const VOWEL_FOOT_DB = -24
const VOWEL_LETTERS = ['A', 'E', 'I', 'O', 'U']

export interface Formants {
  hz: number[]
  db: number[]
  bandwidth: number[]
}

const formants = (hz: number[], db: number[], bandwidth: number[]): Formants => ({
  hz,
  db,
  bandwidth,
})

/**
 * `kTable` of vowels.h: the five formants of the sung vowels a, e, i, o, u
 * for bass, tenor, alto and soprano, as centre (Hz), level (dB under the
 * first) and width (Hz).
 */
const VOWEL_TABLE: Formants[][] = [
  [
    formants([600, 1040, 2250, 2450, 2750], [0, -7, -9, -9, -20], [60, 70, 110, 120, 130]),
    formants([400, 1620, 2400, 2800, 3100], [0, -12, -9, -12, -18], [40, 80, 100, 120, 120]),
    formants([250, 1750, 2600, 3050, 3340], [0, -30, -16, -22, -28], [60, 90, 100, 120, 120]),
    formants([400, 750, 2400, 2600, 2900], [0, -11, -21, -20, -40], [40, 80, 100, 120, 120]),
    formants([350, 600, 2400, 2675, 2950], [0, -20, -32, -28, -36], [40, 80, 100, 120, 120]),
  ],
  [
    formants([650, 1080, 2650, 2900, 3250], [0, -6, -7, -8, -22], [80, 90, 120, 130, 140]),
    formants([400, 1700, 2600, 3200, 3580], [0, -14, -12, -14, -20], [70, 80, 100, 120, 120]),
    formants([290, 1870, 2800, 3250, 3540], [0, -15, -18, -20, -30], [40, 90, 100, 120, 120]),
    formants([400, 800, 2600, 2800, 3000], [0, -10, -12, -12, -26], [40, 80, 100, 120, 120]),
    formants([350, 600, 2700, 2900, 3300], [0, -20, -17, -14, -26], [40, 60, 100, 120, 120]),
  ],
  [
    formants([800, 1150, 2800, 3500, 4950], [0, -4, -20, -36, -60], [80, 90, 120, 130, 140]),
    formants([400, 1600, 2700, 3300, 4950], [0, -24, -30, -35, -60], [60, 80, 120, 150, 200]),
    formants([350, 1700, 2700, 3700, 4950], [0, -20, -30, -36, -60], [50, 100, 120, 150, 200]),
    formants([450, 800, 2830, 3500, 4950], [0, -9, -16, -28, -55], [70, 80, 100, 130, 135]),
    formants([325, 700, 2530, 3500, 4950], [0, -12, -30, -40, -64], [50, 60, 170, 180, 200]),
  ],
  [
    formants([800, 1150, 2900, 3900, 4950], [0, -6, -32, -20, -50], [80, 90, 120, 130, 140]),
    formants([350, 2000, 2800, 3600, 4950], [0, -20, -15, -40, -56], [60, 100, 120, 150, 200]),
    formants([270, 2140, 2950, 3900, 4950], [0, -12, -26, -26, -44], [60, 90, 100, 120, 120]),
    formants([450, 800, 2830, 3800, 4950], [0, -11, -22, -22, -50], [70, 80, 100, 130, 135]),
    formants([325, 700, 2700, 3800, 4950], [0, -16, -35, -40, -60], [50, 60, 170, 180, 200]),
  ],
]

const mix = (a: number, b: number, t: number): number => a + (b - a) * t

/** `formants_at()`: the formants at `vowel` (0..4, a to u) for `voice` (0..1, bass to soprano). */
export function formantsAt(vowel: number, voice: number): Formants {
  const v = clamp(vowel, 0, 4)
  const vi = Math.min(3, Math.floor(v))
  const vt = v - vi
  const s = clamp(voice, 0, 1) * 3
  const si = Math.min(2, Math.floor(s))
  const st = s - si
  const [a, b] = [VOWEL_TABLE[si][vi], VOWEL_TABLE[si][vi + 1]]
  const [c, d] = [VOWEL_TABLE[si + 1][vi], VOWEL_TABLE[si + 1][vi + 1]]
  const each = (pick: (from: Formants) => number[]): number[] =>
    pick(a).map((_, k) => mix(mix(pick(a)[k], pick(b)[k], vt), mix(pick(c)[k], pick(d)[k], vt), st))
  return {
    hz: each((from) => from.hz),
    db: each((from) => from.db),
    bandwidth: each((from) => from.bandwidth),
  }
}

/** `fold()`: a wandering vowel turns back at the ends of the line. */
export function foldVowel(vowel: number): number {
  let v = vowel
  if (v < 0) v = -v
  if (v > 4) v = 8 - v
  return clamp(v, 0, 4)
}

/**
 * What the vowel does to the reverb at `hz`, in dB against the plain room,
 * ported from `OutputBank` and the output blend of `control()`: five band
 * passes side by side at the formants (half the table's levels in dB, one
 * and a half times its widths, 80 Hz at least), a little of the low end under
 * the first, the makeup that keeps the level, and Resonance blending from
 * the flat signal to them.
 */
export function vowelDb(hz: number, at: Formants, resonance: number, sampleRate = 48000): number {
  const gf = Math.tan((Math.PI * Math.min(hz, sampleRate * 0.45)) / sampleRate)
  let re = 0
  let im = 0
  let power = 0
  for (let k = 0; k < at.hz.length; k++) {
    const centre = clamp(at.hz[k], 20, sampleRate * 0.45)
    const bandwidth = Math.max(at.bandwidth[k] * 1.5, 80)
    const level = Math.pow(10, clamp(at.db[k] * 0.5, -72, 0) / 20)
    // `BandCoeff::response()`.
    const x = gf / Math.tan((Math.PI * centre) / sampleRate)
    const p = 1 - x * x
    const q = x * clamp(bandwidth / centre, 0.02, 2)
    const scale = q / (p * p + q * q)
    re += level * q * scale
    im += level * p * scale
    power += (level * level * (Math.PI / 2) * bandwidth * 400) / (at.hz[k] * at.hz[k])
    if (k === 0) {
      // The body: a quarter of the first formant's level through a one-pole
      // low pass an octave under it.
      const half = 0.5 * Math.tan((Math.PI * centre) / sampleRate)
      const pole = (1 - half) / (1 + half)
      const w = (2 * Math.PI * hz) / sampleRate
      const dr = 1 - pole * Math.cos(w)
      const di = pole * Math.sin(w)
      const gain = (0.25 * level * (1 - pole)) / (dr * dr + di * di)
      re += gain * dr
      im -= gain * di
    }
  }
  const makeup = Math.min(Math.sqrt(1.6 / Math.max(power, 1e-6)), 4)
  const blend = clamp(resonance, 0, 1)
  const real = 1 - blend + blend * makeup * re
  const imaginary = blend * makeup * im
  return 10 * Math.log10(Math.max(real * real + imaginary * imaginary, 1e-12))
}

/**
 * Seconds the sound between the formants takes to fall 60 dB, from
 * `control()`: the loop's own vowel takes from everything off a formant, up
 * to three times the formants' rate again at Resonance 1, and never slower
 * than a fifth of a second's worth.
 */
export function valleySeconds(decay: number, resonance: number): number {
  const extra = resonance * resonance * Math.max(3 / decay, 0.2 - 1 / decay)
  return 1 / (1 / decay + extra)
}

interface VowelState {
  ride: Ride
  made: string
  /** The curve the knobs set, and the one being sung now. */
  set: Point[]
  now: Point[]
}

/** The reverb's colour across a box, a point every second pixel: the vowel and the two cuts. */
function vowelCurve(
  out: Point[],
  box: Box,
  sides: readonly Formants[],
  resonance: number,
  lowCut: number,
  highCut: number,
  sampleRate: number,
): void {
  let count = 0
  for (let x = box.x; x <= box.x + box.w + 0.01; x += 2) {
    const hz = hzOfX(x, box, VOWEL_LOW_HZ, VOWEL_HIGH_HZ)
    let db = 0
    for (const side of sides) db += vowelDb(hz, side, resonance, sampleRate) / sides.length
    // Low Cut is a second-order high pass and High Cut a first-order low pass, both on the way out.
    db += 10 * Math.log10(svfPower('highpass', hz, lowCut, Math.SQRT1_2, sampleRate))
    db += 10 * Math.log10(onePolePower('lowpass', hz, highCut, sampleRate))
    const y = yOfDb(
      clamp(db, VOWEL_FOOT_DB - 6, VOWEL_TOP_DB + 6),
      box,
      VOWEL_TOP_DB,
      VOWEL_FOOT_DB,
    )
    put(out, count++, x, y)
  }
  out.length = count
}

/** The part of the upper panel under the line of vowels, and where each vowel stands on that line. */
function vowelLayout(view: Size): {
  curve: Box
  rail: number
  xOfVowel: (vowel: number) => number
  own: Box
  tail: Box
  between: number
} {
  const { own, tail, between } = panels(view)
  const rail = own.y + 11.5
  const curve: Box = { x: own.x, y: own.y + 16, w: own.w, h: Math.max(4, own.h - 16) }
  const xOfVowel = (vowel: number): number => own.x + 8 + (clamp(vowel, 0, 4) / 4) * (own.w - 16)
  return { curve, rail, xOfVowel, own, tail, between }
}

const vowel = plateDisplay<VowelState>({
  place: 'window',
  columns: 2,
  params: ['vowel', 'resonance', 'voice', 'decay', 'lowCut', 'highCut'],
  live: { meters: true, signal: true, spectrum: true },
  info: 'Above, what the vowel does to the reverb across the frequencies, its formants as peaks, with the vowel sung now in the accent. Drag the handle along A E I O U to choose it. Below, the tail falling 60 dB in Decay, its end the handle, and under it the sound between the formants, which dies sooner.',
  init: () => ({ ride: newRide(VOWEL_SPAN), made: '', set: [], now: [] }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { curve, rail, xOfVowel, tail, between } = vowelLayout(frame)
    const resonance = frame.value('resonance')
    const decay = frame.value('decay')
    const lowCut = frame.value('lowCut')
    const highCut = frame.value('highCut')
    const set = frame.value('vowel')
    const voice = frame.value('voice')
    hear(frame, state.ride)

    const made = `${set} ${voice} ${resonance} ${lowCut} ${highCut} ${frame.sampleRate} ${frame.width} ${frame.height}`
    if (made !== state.made) {
      state.made = made
      vowelCurve(
        state.set,
        curve,
        [formantsAt(set, voice)],
        resonance,
        lowCut,
        highCut,
        frame.sampleRate,
      )
    }

    // Above: the line of vowels, then the colour over the sound.
    VOWEL_LETTERS.forEach((letter, index) => {
      text(frame, letter, xOfVowel(index), rail - 4, {
        align: 'center',
        size: 8,
        alpha: Math.abs(set - index) < 0.5 ? 1 : INK.back,
      })
    })
    rule(ctx, xOfVowel(0), rail, xOfVowel(4), rail, { colour: colours.ink, alpha: INK.rule })
    freqGrid(frame, curve, VOWEL_LOW_HZ, VOWEL_HIGH_HZ)
    text(frame, '1k', xOfHz(1000, curve, VOWEL_LOW_HZ, VOWEL_HIGH_HZ) + 2, curve.y + curve.h - 2, {
      size: 8,
      alpha: INK.back,
    })
    const level = yOfDb(0, curve, VOWEL_TOP_DB, VOWEL_FOOT_DB)
    rule(ctx, curve.x, level, curve.x + curve.w, level, { colour: colours.ink, alpha: INK.grid })
    clipped(ctx, curve, () => {
      spectrum(frame, curve, {
        topDb: 0,
        bottomDb: -72,
        alpha: 0.5,
        minHz: VOWEL_LOW_HZ,
        maxHz: VOWEL_HIGH_HZ,
      })
      fillTo(ctx, state.set, curve.y + curve.h, colours.ink, INK.fill)
      trace(ctx, state.set, { colour: colours.ink })
    })

    // The vowel sung now: where the device last tuned its banks, the two sides drawn as one.
    if (sounding(frame) && frame.hasMeter('vowel')) {
      const now = clamp(frame.meter('vowel'), 0, 4)
      const lean = clamp(frame.meter('lean'), -1, 1)
      const voiceNow = clamp(frame.meter('voice'), 0, 1)
      const build = clamp(frame.meter('build'), -0.2, 0.2)
      const moved =
        Math.abs(now - set) > 0.01 || Math.abs(lean) > 0.01 || Math.abs(voiceNow - voice) > 0.005
      if (moved) {
        vowelCurve(
          state.now,
          curve,
          [
            formantsAt(foldVowel(now + lean), voiceNow + build),
            formantsAt(foldVowel(now - lean), voiceNow - build),
          ],
          resonance,
          lowCut,
          highCut,
          frame.sampleRate,
        )
        clipped(ctx, curve, () => trace(ctx, state.now, { colour: colours.accent, width: 1.25 }))
      }
      const x = xOfVowel(now)
      rule(ctx, x, rail - 3, x, rail + 3, { colour: colours.accent, width: 2 })
    }

    divide(frame, between)
    const start: Point = [tail.x, tail.y]
    const valleys = valleySeconds(decay, resonance)
    drawTail(
      frame,
      tail,
      VOWEL_SPAN,
      {
        curve: [start, fallEnd(tail, VOWEL_SPAN, decay)],
        under: valleys < decay * 0.95 ? [start, fallEnd(tail, VOWEL_SPAN, valleys)] : undefined,
        said: secondsText(decay),
      },
      state.ride,
    )
    for (const point of vowelHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: vowelHandles,
})

function vowelHandles(view: DisplayView): DisplayHandle[] {
  const { rail, xOfVowel, own } = vowelLayout(view)
  return [
    {
      key: 'vowel',
      name: 'Vowel',
      x: xOfVowel(view.value('vowel')),
      y: rail,
      drag: (toX) => ({ vowel: clamp(((toX - own.x - 8) / (own.w - 16)) * 4, 0, 4) }),
      reset: () => ({ vowel: view.spec('vowel')?.default ?? 0 }),
    },
    decayHandle(view, VOWEL_SPAN, 'decay'),
  ]
}

export const TAILS_FACES: Readonly<Record<string, PlateFace>> = {
  'bloom-reverb': {
    display: bloom,
    face: ['bloom', 'interval', 'direction', 'mix'],
  },
  expanse: {
    display: expanse,
    face: ['size', 'gravity', 'freeze', 'mix'],
  },
  shimmer: {
    display: shimmer,
    face: ['shimmer', 'interval', 'tone', 'mix'],
  },
  'swarm-reverb': {
    display: swarm,
    face: ['length', 'blur', 'highCut', 'mix'],
  },
  sympathetic: {
    display: sympathetic,
    face: ['sympathy', 'strings', 'mode', 'mix'],
  },
  'vowel-reverb': {
    display: vowel,
    face: ['resonance', 'voice', 'motion', 'mix'],
  },
}
