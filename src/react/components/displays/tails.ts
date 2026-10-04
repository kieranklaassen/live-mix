// Displays of the reverbs that do more than die away: tails that bloom, shimmer, swarm, sing or speak.
//
// Every one is a window in two parts. Below, what every reverb has: the level
// against the time since a sound went in, falling as the device's own loop
// makes it fall, with the time it takes to fall 60 dB said in seconds and,
// while sound runs, the sounds now ringing in it lit where they are on their
// way down. Above, what only this device does.

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
  follow,
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

// --- What they share: the two parts, the tail and what rings in it ----------

type Size = Pick<DisplayView, 'width' | 'height'>
type Paint = Pick<DisplayFrame, 'ctx' | 'colours'>

/** The levels a tail spans, top to foot. */
const TOP_DB = 0
const FOOT_DB = -60
/**
 * The rate the falls are worked out at. A handle is not told the device's
 * rate, and it must stand where the curve ends; between 44.1 and 96 kHz the
 * loops' filters move a fall by far less than a pixel.
 */
const TAIL_RATE = 48000

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

/**
 * A time as it is said: "320 ms", "5.0 s", "24 s", "2.7 min", and "∞" for
 * a tail that does not end. Under a second it is said to the hundredth,
 * which is as near as a tail's length is known when the sound that set it
 * off has a length of its own. `rough` is for a figure good to a twentieth:
 * tenths of a second up to two seconds, whole seconds from there.
 */
export function secondsText(sec: number, rough = false): string {
  if (!Number.isFinite(sec)) return '∞'
  if (sec >= 99.5) return `${(sec / 60).toFixed(1)} min`
  const ms = rough ? Math.round(sec * 10) * 100 : Math.round(sec * 100) * 10
  if (ms < 1000) return `${ms} ms`
  return sec < (rough ? 1.95 : 9.95) ? `${sec.toFixed(1)} s` : `${Math.round(sec)} s`
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

/** The last few of something worked out, by what it was worked out from: a frame and a handle ask for the same one. */
function keeper<T>(most = 12): (key: string, make: () => T) => T {
  const kept = new Map<string, T>()
  return (key, make) => {
    let found = kept.get(key)
    if (found === undefined) {
      if (kept.size >= most) kept.clear()
      found = make()
      kept.set(key, found)
    }
    return found
  }
}

// --- A fall that is not one straight line -----------------------------------
//
// A loop's gain gives every frequency the same fall, and its filters take a
// little more from some on every trip, so the whole falls in a curve: fast
// while the edges die, then at the rate of what is left. The falls here were
// each held against the compiled device: a tenth of a second of noise with as
// much in every octave, wet only, the level in windows of 50 ms, the time
// from the loudest window to 60 dB under it.

/** Thirty bands a third of an octave apart, from 25 Hz to 20 kHz. */
const FALL_BANDS: readonly number[] = Array.from({ length: 30 }, (_, b) => 25 * Math.pow(2, b / 3))

/** A fall band by band, for a sound with as much in each. */
export interface BandFall {
  /** How fast each band dies, in dB a second. */
  rates: number[]
  /** Each band's share of the sound when the tail is at its highest. */
  weights: number[]
}

/** The level of the whole, `sec` after its highest, in dB under that. */
export function bandLevel(fall: BandFall, sec: number): number {
  let sum = 0
  let all = 0
  for (let b = 0; b < fall.rates.length; b++) {
    all += fall.weights[b]
    sum += fall.weights[b] * Math.pow(10, (-fall.rates[b] * sec) / 10)
  }
  return sum > all * 1e-12 ? 10 * Math.log10(sum / all) : FLOOR_DB
}

/** Seconds until a level that only falls is `down` dB under where it began; Infinity past ten minutes. */
function secondsDown(level: (sec: number) => number, down = -FOOT_DB): number {
  let high = 600
  if (level(high) > -down) return Infinity
  let low = 0
  for (let i = 0; i < 36; i++) {
    const mid = (low + high) / 2
    if (level(mid) > -down) low = mid
    else high = mid
  }
  return high
}

/**
 * A room's modes by the share of each that lies in some of its lines. Where
 * only `some` of the lines carry a loss, a mode loses by its share in them,
 * so the room does not fall at one rate: the modes that keep clear of those
 * lines outlast the rest. The shares are spread as a Beta(a, b) law, cut into
 * `count` classes; `a` and `b` were fitted to the compiled device.
 */
function modeShares(a: number, b: number, count = 12): { share: number[]; weight: number[] } {
  const share = Array.from({ length: count }, (_, j) => (j + 0.5) / count)
  const raw = share.map((x) => Math.pow(x, a - 1) * Math.pow(1 - x, b - 1))
  const all = raw.reduce((sum, each) => sum + each, 0)
  return { share, weight: raw.map((each) => each / all) }
}

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

const decibels = (power: number): number => 10 * Math.log10(Math.max(power, 1e-30))

/** A tail as a device's own figures give it: the level against the time since a sound went in. */
export class Tail {
  private took: number | null

  constructor(
    /** Seconds after the sound before any of it comes back. */
    readonly first: number,
    /** Seconds after the sound until the tail is at its highest. */
    readonly from: number,
    /** The level on the way up, at a time since the sound went in. */
    private readonly rise: ((sec: number) => number) | null,
    /** The level on the way down, at a time since the highest: 0 dB at 0, and only falling. */
    private readonly fall: (sec: number) => number,
    /** Times since the sound went in where the level steps, to be drawn upright. */
    readonly steps: readonly number[] = [],
    /** The time to fall 60 dB, where it is known without looking for it. */
    seconds: number | null = null,
  ) {
    this.took = seconds
  }

  /** The level `sec` after the sound went in, in dB under the highest. */
  level(sec: number): number {
    if (sec < this.first) return FLOOR_DB
    if (sec < this.from) return this.rise ? this.rise(sec) : FLOOR_DB
    return this.fall(sec - this.from)
  }

  /** Seconds from its highest to 60 dB under it; Infinity where it does not end. */
  get seconds(): number {
    return (this.took ??= secondsDown(this.fall))
  }
}

/** The straight tail: 60 dB in `seconds`, from the moment the sound goes in. */
const straightTail = (seconds: number): Tail =>
  new Tail(0, 0, null, (sec) => (-60 * sec) / Math.max(seconds, 1e-3), [], seconds)

/**
 * Where a tail leaves its panel: at the foot once it is 60 dB down, or at the
 * right edge, as far down as it is there, when it lasts longer than the panel
 * shows. Its handle stands there.
 */
export function tailEnd(tail: Tail, box: Box, span: number): Point {
  const end = tail.from + tail.seconds
  if (end <= span) return [xOfSec(end, box, span), box.y + box.h]
  return [box.x + box.w, yOfLevel(tail.level(span), box)]
}

/** A tail as points of its panel: up from the foot where it begins, a point every other pixel, to where it leaves. */
function tailPoints(out: Point[], tail: Tail, box: Box, span: number): void {
  const until = Math.min(span, tail.from + tail.seconds)
  const marks = [tail.from, ...tail.steps]
    .filter((sec) => sec > tail.first && sec < until)
    .sort((a, b) => a - b)
  let count = 0
  let mark = 0
  put(out, count++, xOfSec(tail.first, box, span), box.y + box.h)
  const upright = (at: number): void => {
    const x = xOfSec(at, box, span)
    put(out, count++, x, yOfLevel(tail.level(at - 1e-6), box))
    put(out, count++, x, yOfLevel(tail.level(at), box))
  }
  const step = (2 * span) / box.w
  for (let sec = tail.first; sec < until; sec += step) {
    while (mark < marks.length && marks[mark] <= sec) upright(marks[mark++])
    put(out, count++, xOfSec(sec, box, span), yOfLevel(tail.level(sec), box))
  }
  while (mark < marks.length) upright(marks[mark++])
  const [x, y] = tailEnd(tail, box, span)
  put(out, count++, x, y)
  out.length = count
}

/**
 * The setting whose tail passes through a point of the panel. `tailOf` makes
 * the tail of a setting, and a larger setting is a longer tail; the setting
 * is looked for between `low` and `high`. At the top of the right edge the
 * tail asked for has no end: that is `high`.
 */
export function settingThrough(
  tailOf: (value: number) => Tail,
  low: number,
  high: number,
  box: Box,
  span: number,
  x: number,
  y: number,
): number {
  const sec = clamp((x - box.x) / box.w, 0, 1) * span
  const db = dbOfY(y, box, TOP_DB, FOOT_DB)
  if (db >= -0.25 && sec >= span) return high
  const wanted = clamp(db, FOOT_DB, -0.25)
  let under = low
  let over = high
  for (let i = 0; i < 30; i++) {
    const mid = (under + over) / 2
    const tail = tailOf(mid)
    if (tail.level(Math.max(sec, tail.from + 1e-3)) < wanted) under = mid
    else over = mid
  }
  return (under + over) / 2
}

/**
 * Where a straight fall of 60 dB in `rt60` seconds, begun at `from`, leaves
 * the tail's panel: at its foot, or at its right edge when it is longer than
 * the panel shows.
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

// --- What rings in the tail now ---------------------------------------------

/** Under this nothing is heard. */
const QUIET_DB = -72
/** Slots in the kept level: one every pixel of a window, about. */
const HEARD_SLOTS = 120
/** How far over what it has been the level going in must stand for a sound to have begun, in dB. */
const ONSET_DB = 6

/** What a display has heard go in, kept between frames. */
interface Heard {
  /** The level that went in, dB, over the span of the tail's panel: the loudest of each slot. */
  went: History
  /** The loudest of it, which the rest is drawn against; it sinks slowly once that has gone by. */
  most: number
  /** The level going in, followed slowly: a sound that stands well over it has just begun. */
  slow: number
  /** When a sound last began, on the frame's clock; negative for never. */
  since: number
  /** The tail's level at the age of each slot, and what it was worked out from. */
  fall: Float32Array
  made: string
  /** The points last drawn, kept to be used again. */
  points: Point[]
}

function newHeard(span: number): Heard {
  return {
    went: new History(span, HEARD_SLOTS, FLOOR_DB, 'max'),
    most: FLOOR_DB,
    slow: FLOOR_DB,
    since: -1,
    fall: new Float32Array(HEARD_SLOTS + 1).fill(FLOOR_DB),
    made: '',
    points: [],
  }
}

/**
 * Listen for a frame: keep the level going in, and mark the moment a sound
 * begins. It begins when the level stands well over what it has lately been:
 * a hit, a note, a chord struck. A drone that only goes on begins once.
 * Where the plate does not know what feeds the device, what comes out stands
 * in for the beginnings, and nothing is kept of what went in.
 */
function hear(frame: DisplayFrame, heard: Heard): void {
  const signal = frame.signal
  if (!signal) return
  const going = gainToDb((signal.input ?? signal.output).peak)
  heard.went.push(frame.now, signal.input && frame.powered ? going : FLOOR_DB)
  if (going > QUIET_DB && going > heard.slow + ONSET_DB) {
    heard.since = frame.now
    heard.slow = going
  } else {
    heard.slow = follow(heard.slow, Math.max(going, QUIET_DB), frame.dt, 0.25, 0.12)
  }
}

/** Whether sound runs through the device now: then it is awake and its readings are fresh. */
function sounding(frame: DisplayFrame): boolean {
  const signal = frame.signal
  if (!signal || !frame.powered) return false
  return gainToDb(Math.max(signal.input?.peak ?? 0, signal.output.peak)) > QUIET_DB
}

/** The tail the sounds going in are drawn in: worked out again only when `key` is new. */
function ringIn(heard: Heard, key: string, tail: Tail | null, span: number): void {
  if (key === heard.made) return
  heard.made = key
  for (let k = 0; k <= HEARD_SLOTS; k++) {
    heard.fall[k] = tail ? Math.max(FLOOR_DB, tail.level((k / HEARD_SLOTS) * span)) : FLOOR_DB
  }
}

/**
 * What rings in the tail now, in the accent: every sound that went in over
 * the panel's span, drawn where it has got to. A sound that went in `sec`
 * ago stands `sec` along, as far down as the tail has taken it by then, and
 * under that by what it was quieter than the loudest. So a hit slides down
 * the fall as it dies, and a drone lights the whole of it.
 */
function drawRinging(frame: DisplayFrame, heard: Heard, box: Box, span: number): void {
  if (!frame.signal || !frame.powered) return
  let most = FLOOR_DB
  for (let k = 0; k < HEARD_SLOTS; k++) most = Math.max(most, heard.went.at(k))
  heard.most = most >= heard.most ? most : follow(heard.most, most, frame.dt, 0, 0.4)
  if (heard.most <= QUIET_DB) return
  // The newest slot is still filling: the rest stand that far on.
  const clock = (frame.now / span) * HEARD_SLOTS
  const part = clock - Math.floor(clock)
  const points = heard.points
  const foot = box.y + box.h
  let count = 0
  let any = false
  put(points, count++, box.x, yOfLevel(heard.went.at(0) - heard.most + heard.fall[0], box))
  for (let k = 0; k < HEARD_SLOTS; k++) {
    const down = heard.fall[k] + (heard.fall[k + 1] - heard.fall[k]) * part
    const y = yOfLevel(heard.went.at(k) - heard.most + down, box)
    if (y < foot - 0.75) any = true
    put(points, count++, box.x + ((k + part) / HEARD_SLOTS) * box.w, y)
  }
  points.length = count
  if (!any) return
  // Nothing of it along the foot, where nothing rings.
  clipped(frame.ctx, { x: box.x, y: box.y - 2, w: box.w, h: box.h + 1.5 }, () => {
    fillTo(frame.ctx, points, foot, frame.colours.accent, 0.5)
    trace(frame.ctx, points, { colour: frame.colours.accent, width: 1 })
  })
}

/** Seconds since a sound last began, while the device is awake; null otherwise. */
function sinceBegun(frame: DisplayFrame, heard: Heard): number | null {
  if (heard.since < 0 || !sounding(frame)) return null
  return Math.max(0, frame.now - heard.since)
}

/** An upright line in the accent where the sound that last began is now, on a panel's own time scale. */
function playhead(frame: DisplayFrame, heard: Heard, box: Box, span: number): void {
  const age = sinceBegun(frame, heard)
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

/** The tail's panel: its scales, the fall the device is set to, the time said, and what rings in it. */
function drawTail(
  frame: DisplayFrame,
  box: Box,
  span: number,
  picture: TailPicture,
  heard: Heard,
): void {
  const { ctx, colours } = frame
  const foot = box.y + box.h
  dbGrid(frame, box, TOP_DB, FOOT_DB, 20, 1)
  secondLines(frame, box, span)
  rule(ctx, box.x, foot, box.x + box.w, foot, { colour: colours.ink, alpha: INK.rule })
  const within: Box = { x: box.x, y: box.y - 2, w: box.w, h: box.h + 3 }
  clipped(ctx, within, () => fillTo(ctx, picture.curve, foot, colours.ink, INK.fill))
  drawRinging(frame, heard, box, span)
  clipped(ctx, within, () => {
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
}

/** The line between the two parts. */
function divide(frame: Paint & Size, at: number): void {
  rule(frame.ctx, 1, at, frame.width - 1, at, { colour: frame.colours.ink, alpha: INK.rule })
}

/** The handle of a straight tail: its end, taken along the fall. */
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

/**
 * The handle of a tail that falls in a curve: it stands where the curve
 * leaves the panel, and taken elsewhere it sets the parameter whose tail
 * passes through that point.
 */
function tailHandle(
  view: DisplayView,
  span: number,
  param: string,
  name: string,
  tail: Tail,
  tailOf: (value: number) => Tail,
  high = view.spec(param)?.max ?? 60,
): DisplayHandle {
  const box = panels(view).tail
  const spec = view.spec(param)
  const [x, y] = tailEnd(tail, box, span)
  return {
    key: param,
    name,
    x,
    y,
    drag: (toX, toY) => ({
      [param]: settingThrough(tailOf, spec?.min ?? 0, high, box, span, toX, toY),
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

/** The rate Bloom's loop runs at: over 64 kHz it is half the device's (`kHalfRateAbove`). */
const bloomRate = (sampleRate: number): number => (sampleRate > 64000 ? sampleRate / 2 : sampleRate)

/**
 * What one trip round a line of Bloom costs at `hz` beside the decay gain,
 * in dB, from `process()` of bloom_reverb.h: the damping, a one-pole low-pass
 * whose pole is 0.45 a sample at 44.1 kHz (5.6 kHz), and the DC blocker,
 * whose pole is 0.995. Both poles are held at their 44.1 kHz time.
 */
export function bloomLossDb(hz: number, sampleRate = TAIL_RATE): number {
  const rate = bloomRate(sampleRate)
  const pole = Math.pow(0.995, 44100 / rate)
  const dampHz = (-Math.log(0.45) * 44100) / (2 * Math.PI)
  const cos = Math.cos((2 * Math.PI * Math.min(hz, rate * 0.49)) / rate)
  const blocker = (2 - 2 * cos) / (1 + pole * pole - 2 * pole * cos)
  return decibels(blocker * onePolePower('lowpass', hz, dampHz, rate))
}

/**
 * How Bloom's tail falls, band by band. Every trip round a line costs the
 * decay gain, which is 60 dB in Decay seconds at any frequency, and then the
 * loop's two filters. The damping takes the top off at once, so the whole
 * falls faster than Decay says: 60 dB in 4.6 s at 5, in 24 s at 30 (the
 * compiled device: 4.6 and 24).
 */
export function bloomFall(decay: number, sampleRate = TAIL_RATE): BandFall {
  const rate = bloomRate(sampleRate)
  const rates: number[] = []
  const weights: number[] = []
  for (const hz of FALL_BANDS) {
    const loss = bloomLossDb(hz, sampleRate)
    rates.push(60 / Math.max(decay, 0.01) - loss / BLOOM_MEAN_LINE)
    // What is heard is the drifter's output, smoothed: a one-pole at 4 kHz,
    // then 0.4 of that and 0.6 of it through a second pole at 0.92 a sample.
    const w = (2 * Math.PI * Math.min(hz, rate * 0.49)) / rate
    const first = onePolePower('lowpass', hz, 4000, rate)
    const dr = 1 - 0.92 * Math.cos(w)
    const di = 0.92 * Math.sin(w)
    const re = 0.4 + (0.6 * 0.08 * dr) / (dr * dr + di * di)
    const im = (-0.6 * 0.08 * di) / (dr * dr + di * di)
    weights.push(first * (re * re + im * im) * Math.pow(10, loss / 10))
  }
  return { rates, weights }
}

/**
 * Bloom's tail. Nothing until the shortest line has come round; then up, as
 * the grains of the drifter open, until a mean line and the grains' reach
 * back have passed (`ratio` is the speed they play at when the tail is new);
 * then down as the loop has it.
 */
function bloomTailOf(decay: number, ratio: number): Tail {
  const fall = bloomFall(decay)
  const first = BLOOM_LINES[0]
  const from = BLOOM_MEAN_LINE + (1 + ratio) * 0.5 * BLOOM_GRAIN_SEC
  return new Tail(
    first,
    from,
    (sec) =>
      40 * Math.log10(Math.max(1e-3, Math.sin((Math.PI / 2) * ((sec - first) / (from - first))))),
    (sec) => bandLevel(fall, sec),
  )
}

const bloomKept = keeper<Tail>()

function bloomTail(view: DisplayView): Tail {
  const decay = view.value('decay')
  const fresh = bloomIntensity(view.value('bloom'), 0)
  const ratio = bloomRatios(
    Math.round(view.value('interval')),
    Math.round(view.value('direction')),
    fresh,
  )[0]
  return bloomKept(`${decay} ${ratio}`, () => bloomTailOf(decay, ratio))
}

interface BloomLine {
  points: Point[]
  alpha: number
  width: number
}

interface BloomState {
  heard: Heard
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
  info: 'Above, the pitch of the tail against how long it has rung: it drifts towards the interval, the fainter lines went round and were shifted again, the mark is the pitch now. Below, the tail and the time it takes to fall 60 dB, lit where sounds now ring in it. Drag its end to set Decay.',
  init: () => ({ heard: newHeard(BLOOM_SPAN), made: '', lines: [], tail: [] }),
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
    const falls = bloomTail(frame)
    hear(frame, state.heard)

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
      tailPoints(state.tail, falls, tail, BLOOM_SPAN)
    }
    ringIn(state.heard, made, falls, BLOOM_SPAN)

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
        // Over its line, or under it where the panel's top would cut the figures.
        text(
          frame,
          `${semi > 0 ? '+' : '−'}${Math.abs(semi)}`,
          own.x + 1,
          y < own.y + 6 ? y + 8 : y - 2,
          {
            size: 8,
            alpha: INK.back,
          },
        )
      }
    }
    clipped(ctx, own, () => {
      for (const line of state.lines) {
        trace(ctx, line.points, { colour: colours.ink, width: line.width, alpha: line.alpha })
      }
    })
    // The pitch now: the drifter's own figure, at the age the device counts.
    if (sounding(frame) && frame.hasMeter('drift')) {
      const now = bloomRatios(interval, direction, clamp(frame.meter('drift'), 0, 1))
      const sec = clamp(frame.meter('age'), 0, 1) * 2 * decay
      for (const ratio of now) {
        dot(ctx, xOfSec(sec, own, BLOOM_SPAN), yOfSemi(semitones(ratio)), 2.5, colours.accent, {
          ring: colours.ink,
        })
      }
    }

    divide(frame, between)
    drawTail(
      frame,
      tail,
      BLOOM_SPAN,
      { curve: state.tail, said: secondsText(falls.seconds) },
      state.heard,
    )
    for (const point of bloomHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: bloomHandles,
})

function bloomHandles(view: DisplayView): DisplayHandle[] {
  const falls = bloomTail(view)
  // The grains' reach back does not move with Decay: the tail begins to fall where it does now.
  const ratio = (falls.from - BLOOM_MEAN_LINE) / (0.5 * BLOOM_GRAIN_SEC) - 1
  return [
    tailHandle(view, BLOOM_SPAN, 'decay', 'Decay', falls, (decay) => bloomTailOf(decay, ratio)),
  ]
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
/**
 * What a shifter gives back of a tail, as power. Its four heads read the
 * line a quarter window apart, each under half a Hann bell: in step they add
 * to the whole, but a tail a quarter window apart is no longer in step with
 * itself, so their powers add instead: four times a quarter of the mean
 * square of the bell, 3/8.
 */
const SHIMMER_SHIFTED = 0.375
/**
 * The tank's modes by their share in the two lines of eight that are
 * shifted: about a quarter on average. Fitted to the compiled device (the
 * mean of eight runs of a tenth of a second of notes round 220 Hz, at
 * thirteen settings).
 */
const SHIMMER_MODES = modeShares(6, 19, 24)

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
 * Shimmer. So each trip a mode gives up `sin²(Shimmer · 90°)` of what it has
 * in those two lines; 3/8 of that comes out of the shifter one rung up,
 * through the shifter's filters and later by its own delay, and the rest is
 * lost. Every trip also costs the decay gain and the Tone damping at the
 * rung's own frequency, which is what stops the climb. The modes that keep
 * clear of the two lines give up least and are what is left at the end, so
 * the fall slows as it goes. What is heard is tapped before the shifter,
 * through Low Cut.
 *
 * Against the compiled device the time to fall 60 dB is within 6 % at
 * twelve settings of thirteen and 9 % out at the worst found (Size 0): it
 * is said in whole seconds.
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
  const send = Math.sin((Math.PI / 2) * clamp(settings.shimmer, 0, 1)) ** 2
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
      : SHIMMER_SHIFTED *
        svfPower('lowpass', hz[k - 1], bandLimit, 0.6, sampleRate) *
        svfPower('lowpass', at, ceiling, 0.6, sampleRate) *
        onePolePower('highpass', at, floor, sampleRate),
  )
  const heard = hz.map((at) => svfPower('highpass', at, settings.lowCut, Math.SQRT1_2, sampleRate))
  const { share, weight } = SHIMMER_MODES
  const classes = share.length
  // What comes out of the shifter goes back into the two lines: into each mode by its share of them.
  const mean = share.reduce((sum, x, j) => sum + x * weight[j], 0)
  const lands = share.map((x, j) => (x * weight[j]) / mean)
  const gives = share.map((x) => send * x)
  const held = hz.map(() => new Float64Array(classes))
  held[0].set(weight)
  const energy = hz.map(() => new Float64Array(passes))
  const sent = hz.map(() => new Float64Array(passes))
  for (let n = 0; n < passes; n++) {
    for (let k = 0; k < hz.length; k++) {
      let all = 0
      let out = 0
      for (let j = 0; j < classes; j++) {
        all += held[k][j]
        out += held[k][j] * gives[j]
      }
      energy[k][n] = all
      sent[k][n] = out
    }
    for (let k = 0; k < hz.length; k++) {
      const arrives = k > 0 && n >= late ? sent[k - 1][n - late] * through[k] : 0
      const loss = kept * damping[k]
      for (let j = 0; j < classes; j++) {
        held[k][j] = (held[k][j] * (1 - gives[j]) + arrives * lands[j]) * loss
      }
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
  heard: Heard
  made: string
  ladder: ShimmerLadder | null
  /** A streak for each rung in view: its two edges, and where its line lies. */
  streaks: { upper: Point[]; lower: Point[] }[]
  /** Half the thickness of a streak at its loudest. */
  thick: number
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

/**
 * The octaves the ladder's panel spans about the note, by the way the tail
 * steps, with room beside the note for its name: under it where the tail
 * climbs, over it where it goes down.
 */
const shimmerRange = (ratio: number): [number, number] => (ratio > 1 ? [-1.5, 6.4] : [-3.4, 1.3])

const shimmer = plateDisplay<ShimmerState>({
  place: 'window',
  columns: 2,
  params: ['decay', 'shimmer', 'interval', 'size', 'tone', 'predelay', 'lowCut'],
  live: { signal: true },
  info: 'Above, pitch against time for one note, taken at 220 Hz: each streak is the tail one step higher, as thick as it is loud, until Tone, the dashed line, stops the climb. Below, all of it together and the time it takes to fall 60 dB. Drag the end of the straight line to set Decay.',
  init: () => ({
    heard: newHeard(SHIMMER_SPAN),
    made: '',
    ladder: null,
    streaks: [],
    thick: 1,
    tail: [],
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { own, tail, between } = panels(frame)
    const settings = shimmerSettings(frame)
    hear(frame, state.heard)

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
      state.thick = clamp(0.42 * step * (own.h / (high - low)), 1, 3.2)
      state.streaks = []
      ladder.rungs.forEach((levels, k) => {
        const octaves = k * Math.log2(ladder.ratio)
        if (octaves < low || octaves > high) return
        const y = own.y + ((high - octaves) / (high - low)) * own.h
        const upper: Point[] = []
        const lower: Point[] = []
        for (let x = 0; x <= own.w; x += 2) {
          const db = ladderAt(levels, ladder, (x / own.w) * SHIMMER_SPAN)
          const half = state.thick * clamp(1 - db / FOOT_DB, 0, 1)
          upper.push([own.x + x, y - half])
          lower.push([own.x + x, y + half])
        }
        state.streaks.push({ upper, lower })
      })
      const whole = new Tail(
        ladder.from,
        ladder.from,
        null,
        (sec) => ladderAt(ladder.total, ladder, ladder.from + sec),
        [],
        ladder.rt60,
      )
      tailPoints(state.tail, whole, tail, SHIMMER_SPAN)
      ringIn(state.heard, made, whole, SHIMMER_SPAN)
    }
    const ladder = state.ladder
    const [low, high] = shimmerRange(ladder.ratio)
    const yOfOctaves = (octaves: number): number =>
      own.y + ((high - clamp(octaves, low, high)) / (high - low)) * own.h

    // Above: the ladder. Where the shifted sound is let back in ends it: Tone above, Low Cut below.
    secondLines(frame, own, SHIMMER_SPAN)
    const up = ladder.ratio > 1
    const stop = up
      ? Math.log2(Math.min(0.75 * settings.tone, 6000) / SHIMMER_NOTE_HZ)
      : Math.log2(Math.max(settings.lowCut, 60) / SHIMMER_NOTE_HZ)
    if (stop > low && stop < high) {
      const y = yOfOctaves(stop)
      rule(ctx, own.x, y, own.x + own.w, y, { colour: colours.ink, alpha: INK.back, dash: [3, 2] })
    }
    clipped(ctx, own, () => {
      for (const streak of state.streaks) {
        fillBetween(ctx, streak.upper, streak.lower, colours.ink, 0.92)
      }
    })
    // The note the ladder stands on, named beside its streak, and the step of a rung in semitones.
    const note = yOfOctaves(0)
    text(
      frame,
      `${SHIMMER_NOTE_HZ} Hz note`,
      own.x + 1,
      up ? note + state.thick + 7 : note - state.thick - 2,
      {
        size: 8,
        alpha: INK.back,
      },
    )
    const step = Math.round(semitones(ladder.ratio))
    text(frame, `${step > 0 ? '+' : '−'}${Math.abs(step)}`, own.x + own.w - 1, own.y + 7, {
      align: 'right',
      size: 8,
    })
    playhead(frame, state.heard, own, SHIMMER_SPAN)

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
        said: secondsText(ladder.rt60, true),
      },
      state.heard,
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
/** `kSweepSeconds`: how far a modulated read is swept at Mod Depth 1, at 1 Hz or slower. */
const EXPANSE_SWEEP_SEC = 0.0012

/** The Size knob as the seconds of the longest line (`control()`: 40 ms to 2.5 s). */
export const expanseSeconds = (size: number): number => 0.04 * Math.pow(2.5 / 0.04, size)

/**
 * A sound's energy through an allpass `delay` slots long with coefficient
 * `c`: the share c² comes out at once, and the rest in echoes a delay apart,
 * each c² of the one before. In place of the samples, the energy in each
 * slot. With no coefficient it is the delay alone.
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
  /** The loop's two cuts, and how far its read points are swept: what the tail loses beside Decay. */
  lowCut?: number
  highCut?: number
  modDepth?: number
}

export interface ExpanseArrival {
  /** The Size in seconds, and the seconds of one slot of `level`. */
  seconds: number
  slot: number
  /** The level coming out in every slot, dB under its highest, and the same as energy. */
  level: Float32Array
  energy: Float64Array
  /** When the first sound comes back, and when the level is first within a dB of its highest. */
  first: number
  peak: number
}

/**
 * What goes into Expanse's loop when a sound goes in, as energy in slots of
 * an eightieth of a Size: through the four input allpasses, and by Gravity
 * through the five long ones of the bloom as well, blended with equal power.
 * Decay has no part in it.
 */
export function expanseFeed(settings: ExpanseSettings, sizes = EXPANSE_SIZES): Float64Array {
  const slot = expanseSeconds(settings.size) / EXPANSE_SLOTS
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
  const fed = new Float64Array(count)
  for (let i = 0; i < count; i++) fed[i] = near * direct[i] + far * swell[i]
  return fed
}

/**
 * How Expanse answers a sound over its first few Sizes, as energy in slots of
 * an eightieth of a Size, ported from `process()` and `control()`: the four
 * input allpasses, the five long ones of the bloom blended in by Gravity with
 * equal power, then the loop, where every pass goes through three allpasses,
 * down a line, out at the eight taps, and back through the decay gain.
 */
export function expanseArrival(
  settings: ExpanseSettings,
  sizes = EXPANSE_SIZES,
  fed = expanseFeed(settings, sizes),
): ExpanseArrival {
  const seconds = expanseSeconds(settings.size)
  const slot = seconds / EXPANSE_SLOTS
  const count = Math.round(sizes * EXPANSE_SLOTS)
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
    let x = fed[i] + back[i]
    for (let k = 0; k < stages.length; k++) {
      const delayed = i >= stages[k] ? held[k][i - stages[k]] : 0
      held[k][i] = x + c2 * delayed
      x = c2 * x + later * delayed
    }
    written[i] = x
    for (let n = 0; n < lines.length; n++) {
      if (i + lines[n] < count) back[i + lines[n]] += 0.25 * kept[n] * x
    }
  }
  const taps: number[] = []
  for (const side of EXPANSE_TAPS) {
    side.forEach((share, n) => taps.push(Math.round(share * EXPANSE_LINES[n] * EXPANSE_SLOTS)))
  }
  const out = new Float64Array(count)
  let most = 0
  for (let i = 0; i < count; i++) {
    let sum = 0
    for (const tap of taps) {
      if (i >= tap) sum += written[i - tap]
    }
    out[i] = sum / taps.length
    if (out[i] > most) most = out[i]
  }
  const level = new Float32Array(count)
  let first = -1
  let peak = -1
  for (let i = 0; i < count; i++) {
    level[i] = out[i] > most * 1e-9 && most > 0 ? 10 * Math.log10(out[i] / most) : FLOOR_DB
    if (first < 0 && level[i] > FOOT_DB) first = i
    if (peak < 0 && level[i] >= -1) peak = i
  }
  return {
    seconds,
    slot,
    level,
    energy: out,
    first: Math.max(0, first) * slot,
    peak: Math.max(0, peak) * slot,
  }
}

/** Seconds of one pass round Expanse's loop: a line and its three allpasses, the mean of the four. */
export function expansePass(size: number): number {
  const loopShare = EXPANSE_LOOP.reduce((sum, share) => sum + share, 0)
  return (
    (expanseSeconds(size) *
      EXPANSE_LINES.reduce((sum, share, n) => sum + share + loopShare * EXPANSE_SKEW[n], 0)) /
    EXPANSE_LINES.length
  )
}

/** What Expanse's loop keeps of `hz` through its High Cut and Low Cut, as power: two-pole, Q 0.707. */
function expanseCuts(hz: number, settings: ExpanseSettings, sampleRate: number): number {
  return (
    svfPower('highpass', hz, settings.lowCut ?? 20, Math.SQRT1_2, sampleRate) *
    svfPower('lowpass', hz, settings.highCut ?? 18000, Math.SQRT1_2, sampleRate)
  )
}

/**
 * What one pass round Expanse's loop costs at `hz` beside the decay gain, in
 * dB, from `process()` and `control()`: the loop's two cuts and, with Mod
 * Depth up, what its three swept reads lose. A read between two samples is
 * their mean, which keeps 1 - (1 - cos w) / 3 of the power on average over
 * a sweep; inside an allpass of coefficient g that is
 * 1 - (1 - h)(1 - g²) / (1 - g² h) of the allpass's.
 */
export function expanseLossDb(
  hz: number,
  settings: ExpanseSettings,
  sampleRate = TAIL_RATE,
): number {
  const g2 = (EXPANSE_LOOP_DIFFUSION * clamp(settings.density, 0, 1)) ** 2
  // The sweep in samples: under half a sample the read stays near a whole one and loses less.
  const sweep = clamp(settings.modDepth ?? 0, 0, 1) * EXPANSE_SWEEP_SEC * sampleRate
  const between =
    sweep >= 0.5 ? 1 / 6 : Math.min(1 / 6, (2 / Math.PI) * sweep - (sweep * sweep) / 2)
  const read = 1 - 2 * between * (1 - Math.cos((2 * Math.PI * hz) / sampleRate))
  const stage = 1 - ((1 - read) * (1 - g2)) / (1 - g2 * read)
  return decibels(expanseCuts(hz, settings, sampleRate)) + EXPANSE_LOOP.length * decibels(stage)
}

/**
 * How Expanse's tail falls, band by band. A pass costs the decay gain, which
 * is 60 dB in Decay seconds at any frequency, and what the loop's filters
 * and swept reads take. At the top of Decay only those are left: the middle
 * stays and the edges fall away. (Compiled device, time to fall 60 dB at
 * the defaults: 9.4 s at Decay 10, 26 s at 30; this gives 9.4 and 27.)
 */
export function expanseFall(settings: ExpanseSettings, sampleRate = TAIL_RATE): BandFall {
  const pass = expansePass(settings.size)
  const endless = settings.decay >= settings.decayMost * 0.995
  const rates: number[] = []
  const weights: number[] = []
  for (const hz of FALL_BANDS) {
    rates.push(
      (endless ? 0 : 60 / Math.max(settings.decay, 0.01)) -
        expanseLossDb(hz, settings, sampleRate) / pass,
    )
    weights.push(expanseCuts(hz, settings, sampleRate))
  }
  return { rates, weights }
}

const expanseSettings = (view: DisplayView): ExpanseSettings => ({
  size: view.value('size'),
  decay: view.value('decay'),
  gravity: view.value('gravity'),
  density: view.value('density'),
  decayMost: view.spec('decay')?.max ?? 60,
  lowCut: view.value('lowCut'),
  highCut: view.value('highCut'),
  modDepth: view.value('modDepth'),
})

/** Sizes the arrival is worked out over for the tail: by then what feeds the loop has rung out. */
const EXPANSE_TAIL_SIZES = 8

/** The last few arrivals worked out, by their settings: a frame and a handle ask for the same one. */
const expanseKept = keeper<ExpanseArrival>()

function expanseFor(settings: ExpanseSettings): ExpanseArrival {
  return expanseKept(
    `${settings.size} ${settings.decay} ${settings.gravity} ${settings.density}`,
    () => expanseArrival(settings, EXPANSE_TAIL_SIZES),
  )
}

/** Seconds of the sound the tail is drawn for: its arrival is taken over this long, so single echoes run together as they do for the ear. */
const EXPANSE_SOUND_SEC = 0.1

/**
 * Expanse's tail, for a short sound. Up as the arrival has it to its
 * highest, and down as the arrival has it too for as long as that is worked
 * out: the allpasses ring on for a few Sizes whatever Decay says, so a short
 * Decay in a large space does not end the sound. (Compiled device, Size 1
 * and Gravity 1: 8.5 s from the loudest to 60 dB under it at Decay 0.5 and
 * at Decay 3 alike.) The arrival counts the decay gain alone, so what the
 * loop's filters and swept reads take beside it is added; after the
 * arrival's last slot the loop's own fall goes on from there. At the top of
 * Decay only the filters are left, and where they take more than ten
 * minutes the tail has no end. `fed` is `expanseFeed()` over the same Sizes,
 * for a caller that has it.
 */
export function expanseTailOf(
  settings: ExpanseSettings,
  arrival?: ExpanseArrival,
  fed?: Float64Array,
): Tail {
  const answer = arrival ?? expanseArrival(settings, EXPANSE_TAIL_SIZES, fed)
  const fall = expanseFall(settings)
  const endless = settings.decay >= settings.decayMost * 0.995
  const plain = endless ? 0 : 60 / Math.max(settings.decay, 0.01)
  const beside: BandFall = { rates: fall.rates.map((rate) => rate - plain), weights: fall.weights }
  const count = answer.level.length
  // The energy of the last tenth of a second at each slot, under its highest.
  const wide = Math.max(1, Math.round(EXPANSE_SOUND_SEC / answer.slot))
  const power = new Float64Array(count)
  let sum = 0
  let most = 0
  for (let i = 0; i < count; i++) {
    sum += answer.energy[i]
    if (i >= wide) sum -= answer.energy[i - wide]
    power[i] = Math.max(sum, 0)
    if (power[i] > most) most = power[i]
  }
  const level = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    level[i] = most > 0 ? Math.max(FLOOR_DB, decibels(power[i] / most)) : FLOOR_DB
  }
  // The highest: the first slot within a quarter of a dB of it, so a level top is left at its start.
  let top = 0
  while (top < count - 1 && level[top] < -0.25) top++
  // From each slot on, the highest still to come, so the tail does not rise again.
  let still = FLOOR_DB
  for (let i = count - 1; i >= top; i--) {
    still = Math.max(still, level[i])
    level[i] = still
  }
  const known = (count - 1 - top) * answer.slot
  const at = (slots: number): number => {
    const i = clamp(Math.floor(slots), 0, count - 1)
    const next = Math.min(count - 1, i + 1)
    return level[i] + (level[next] - level[i]) * clamp(slots - i, 0, 1)
  }
  return new Tail(
    answer.first,
    top * answer.slot,
    (sec) => at(sec / answer.slot),
    (sec) =>
      at(top + Math.min(sec, known) / answer.slot) -
      plain * Math.max(0, sec - known) +
      bandLevel(beside, sec),
  )
}

const expanseTails = keeper<Tail>()

function expanseTail(settings: ExpanseSettings): Tail {
  return expanseTails(Object.values(settings).join(' '), () =>
    expanseTailOf(settings, expanseFor(settings)),
  )
}

interface ExpanseState {
  heard: Heard
  made: string
  arrival: Point[]
  tail: Point[]
}

/** The upper panel under its measure: the arrival is drawn here. */
const expanseGraph = (own: Box): Box => ({ x: own.x, y: own.y + 10, w: own.w, h: own.h - 10 })

const expanse = plateDisplay<ExpanseState>({
  place: 'window',
  columns: 2,
  params: ['size', 'decay', 'gravity', 'density', 'freeze', 'lowCut', 'highCut', 'modDepth'],
  live: { signal: true },
  info: 'Above, how the space answers a sound over its first three Sizes: the first echo, the swell Gravity makes, the echoes Density runs together. Below, the tail and the time it takes to fall 60 dB, lit where sounds now ring in it, and level when frozen. Drag its end to set Decay.',
  init: () => ({ heard: newHeard(EXPANSE_SPAN), made: '', arrival: [], tail: [] }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { own, tail, between } = panels(frame)
    const graph = expanseGraph(own)
    const settings = expanseSettings(frame)
    const frozen = frame.value('freeze') >= 0.5
    const model = expanseFor(settings)
    const falls = expanseTail(settings)
    const head = EXPANSE_SIZES * model.seconds
    hear(frame, state.heard)

    const made = `${Object.values(settings).join(' ')} ${frozen} ${frame.width} ${frame.height}`
    if (made !== state.made) {
      state.made = made
      const count = Math.min(model.level.length, EXPANSE_SIZES * EXPANSE_SLOTS)
      state.arrival = []
      // The loudest slot under each pixel, so a single echo keeps its height.
      const per = Math.max(1, Math.round(count / graph.w))
      for (let i = 0; i < count; i += per) {
        let db = FLOOR_DB
        for (let j = i; j < Math.min(count, i + per); j++) db = Math.max(db, model.level[j])
        state.arrival.push([graph.x + (i / count) * graph.w, yOfLevel(db, graph)])
      }
      tailPoints(state.tail, falls, tail, EXPANSE_SPAN)
    }
    // Frozen, the loop takes nothing in: no sound that goes in now will ring in it.
    ringIn(state.heard, made, frozen ? null : falls, EXPANSE_SPAN)

    // Above: a measure of one Size, then the first three Sizes with a line at each.
    const one = xOfSec(model.seconds, own, head)
    const bar = own.y + 4.5
    rule(ctx, own.x, bar, one, bar, { colour: colours.ink, alpha: INK.text })
    rule(ctx, own.x + 0.5, bar - 2.5, own.x + 0.5, bar + 2.5, {
      colour: colours.ink,
      alpha: INK.text,
    })
    rule(ctx, one, bar - 2.5, one, bar + 2.5, { colour: colours.ink, alpha: INK.text })
    text(frame, secondsText(model.seconds), one + 3, own.y + 7.5, { size: 8 })
    for (let size = 1; size < EXPANSE_SIZES; size++) {
      const x = xOfSec(size * model.seconds, graph, head)
      rule(ctx, x, graph.y, x, graph.y + graph.h, { colour: colours.ink, alpha: INK.grid })
    }
    dbGrid(frame, graph, TOP_DB, FOOT_DB, 20, 1)
    clipped(ctx, graph, () => {
      // Frozen, nothing new is let in: the answer is drawn as what it would be.
      if (!frozen) fillTo(ctx, state.arrival, graph.y + graph.h, colours.ink, INK.fill)
      trace(ctx, state.arrival, {
        colour: colours.ink,
        width: frozen ? 1 : 1.5,
        alpha: frozen ? INK.back : 1,
        dash: frozen ? [2, 2] : undefined,
      })
    })
    if (!frozen) playhead(frame, state.heard, graph, head)

    divide(frame, between)
    if (frozen) {
      // What is in the loop stays: level, with the fall it would take when let go dashed under it.
      clipped(ctx, { x: tail.x, y: tail.y - 2, w: tail.w, h: tail.h + 3 }, () =>
        trace(ctx, state.tail, { colour: colours.ink, alpha: INK.back, dash: [2, 2], width: 1.01 }),
      )
    }
    const level: Point[] = [
      [tail.x, tail.y],
      [tail.x + tail.w, tail.y],
    ]
    drawTail(
      frame,
      tail,
      EXPANSE_SPAN,
      frozen
        ? { curve: level, beside: state.tail, said: 'held' }
        : { curve: state.tail, said: secondsText(falls.seconds) },
      state.heard,
    )
    for (const point of expanseHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: expanseHandles,
})

function expanseHandles(view: DisplayView): DisplayHandle[] {
  const settings = expanseSettings(view)
  // What feeds the loop does not move with Decay: worked out once, when the handle is first moved.
  let fed: Float64Array | null = null
  return [
    tailHandle(view, EXPANSE_SPAN, 'decay', 'Decay', expanseTail(settings), (decay) =>
      expanseTailOf(
        { ...settings, decay },
        undefined,
        (fed ??= expanseFeed(settings, EXPANSE_TAIL_SIZES)),
      ),
    ),
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
const SWARM_TRIP = (SWARM_LOOP[0] + SWARM_LOOP[1]) / 2
const SWARM_STAGES = [
  [0.0037, 0.0059, 0.0083, 0.0113],
  [0.0041, 0.0061, 0.0079, 0.0121],
]
const SWARM_BLUR_MOST = 0.7
/** `kOpenFrom` and the octaves the return's two cuts have opened by at Feedback 1. */
const SWARM_OPEN_FROM = 0.9
const SWARM_OPEN_HIGH = 0.75
const SWARM_OPEN_LOW = 1.5
/**
 * How far a whole pass lies under its first echo, taken together: the mean
 * of a lean of 6 dB, 10 log10((1 - 10^-0.6) / (0.6 ln 10)).
 */
const SWARM_PASS_DB = 10 * Math.log10((1 - Math.pow(10, -0.6)) / (0.6 * Math.LN10))
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

export interface SwarmSettings {
  /** Seconds of one pass. */
  seconds: number
  feedback: number
  lowCut: number
  highCut: number
}

/**
 * What one trip round the cave costs at `hz`, in dB, from `process()` and
 * `control()`: it comes back at Feedback (the turn between the sides loses
 * nothing) through the return's own High Cut and Low Cut (two-pole, Q
 * 0.707), which above Feedback 0.9 open by up to 0.75 and 1.5 octaves.
 */
export function swarmLossDb(hz: number, settings: SwarmSettings, sampleRate = TAIL_RATE): number {
  const feedback = clamp(settings.feedback, 0, 1)
  let open = clamp((feedback - SWARM_OPEN_FROM) / (1 - SWARM_OPEN_FROM), 0, 1)
  open = open * open * (3 - 2 * open)
  const high = Math.min(settings.highCut * Math.pow(2, SWARM_OPEN_HIGH * open), 0.45 * sampleRate)
  const low = settings.lowCut * Math.pow(2, -SWARM_OPEN_LOW * open)
  return (
    20 * Math.log10(Math.max(feedback, 1e-6)) +
    decibels(
      svfPower('highpass', hz, low, Math.SQRT1_2, sampleRate) *
        svfPower('lowpass', hz, high, Math.SQRT1_2, sampleRate),
    )
  )
}

/**
 * How the trips round the cave fall, band by band. A trip is a pass long on
 * one side and 0.887 of one on the other, 0.9435 of a pass on average. The
 * return's cuts are why the cave dies sooner than Feedback alone says: 60 dB
 * in 6.1 s at the defaults, not 6.4.
 */
export function swarmFall(settings: SwarmSettings, sampleRate = TAIL_RATE): BandFall {
  const trip = Math.max(settings.seconds, 1e-3) * SWARM_TRIP
  const rates: number[] = []
  const weights: number[] = []
  for (const hz of FALL_BANDS) {
    rates.push(-swarmLossDb(hz, settings, sampleRate) / trip)
    // What is in the cave went in through the two cuts on the way in.
    weights.push(
      svfPower('highpass', hz, settings.lowCut, Math.SQRT1_2, sampleRate) *
        svfPower('lowpass', hz, settings.highCut, Math.SQRT1_2, sampleRate),
    )
  }
  return { rates, weights }
}

/**
 * The cave's tail. The first pass is the swarm itself: it begins at its
 * first echo and leans 6 dB to its last, whatever Feedback is. Under it lie
 * the trips round the loop: each is a whole pass at once, so taken together
 * they stand at a pass's mean, 2.7 dB under the first echo, from the middle
 * of the first pass on. At Feedback 1 and over they do not fall.
 * (Compiled device, time to fall 60 dB: 2.8 s at Feedback 0.3, 6.1 at 0.6,
 * 28 at 0.9; this gives 2.7, 6.1 and 28.)
 */
export function swarmTailOf(settings: SwarmSettings): Tail {
  const { seconds } = settings
  const first = SWARM_FIRST * seconds
  const fall = settings.feedback > 0 ? swarmFall(settings) : null
  const level = (since: number): number => {
    const sec = since + first
    const pass = sec < seconds ? -SWARM_TILT_DB * (sec / seconds - SWARM_FIRST) : FLOOR_DB
    const trips =
      fall && sec >= seconds / 2 ? SWARM_PASS_DB + bandLevel(fall, sec - seconds / 2) : FLOOR_DB
    return Math.max(pass, trips)
  }
  return new Tail(first, first, null, level, [seconds], settings.feedback >= 1 ? Infinity : null)
}

const swarmSettings = (view: DisplayView): SwarmSettings => ({
  seconds: swarmSeconds(view.value('length'), view.value('stretch'), view.value('steps') >= 0.5),
  feedback: view.value('feedback'),
  lowCut: view.value('lowCut'),
  highCut: view.value('highCut'),
})

const swarmTails = keeper<Tail>()

/** The tail at the size the knobs set, where its handle stands. */
function swarmTail(settings: SwarmSettings): Tail {
  return swarmTails(Object.values(settings).join(' '), () => swarmTailOf(settings))
}

/**
 * What comes back from one sound in the middle, as the size of the echoes in
 * every one of `slots` equal steps of `passes` passes, left and right.
 * Ported from `render()`: the taps of the first pass, then every trip round
 * the loop, which sends each side's end back into both (a quarter turn, the
 * left into the right upside down) at Feedback; and Blur's four allpasses,
 * which spill each echo over the next few hundredths of a pass and with no
 * Blur are the delay they are long. 1 is the loudest echo of an unblurred
 * swarm.
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
    // The taps were set down earlier by the allpasses' length: the allpasses bring them back to their time.
    let train: Float64Array = energy[side]
    for (const span of SWARM_STAGES[side]) {
      train = throughAllpass(train, Math.max(1, span * perPass), c)
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
  heard: Heard
  made: string
  /** The stems of each side, as `strokes` takes them, and how many. */
  stems: [Float32Array, Float32Array]
  count: [number, number]
  /** The tail's points, and what they were worked out from. */
  tail: Point[]
  tailOf: string
}

/** The size the cave is at: the device's own figure while sound runs, the knobs' otherwise. */
function swarmSize(frame: DisplayFrame, set: number): number {
  if (!sounding(frame) || !frame.hasMeter('size')) return set
  const now = frame.meter('size')
  // Asleep or not yet run, the device has no figure: the knobs' own stands.
  return now > 0.01 ? clamp(now, 0.02, 3) : set
}

const swarm = plateDisplay<SwarmState>({
  place: 'window',
  columns: 2,
  params: ['length', 'stretch', 'steps', 'blur', 'feedback', 'lowCut', 'highCut'],
  live: { meters: true, signal: true },
  info: 'Above, the echoes one sound sets off, left side up and right side down: the swarm, then each trip round fainter by Feedback and run together by Blur. Drag the handle on top to stretch the cave. Below, the tail and the time it takes to fall 60 dB, its end the handle for Feedback.',
  init: () => ({
    heard: newHeard(SWARM_SPAN),
    made: '',
    stems: [new Float32Array(0), new Float32Array(0)],
    count: [0, 0],
    tail: [],
    tailOf: '',
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { own, tail, between } = panels(frame)
    const length = frame.value('length')
    const blur = frame.value('blur')
    const stepped = frame.value('steps') >= 0.5
    // The tail is drawn for the size the knobs set, where its handle stands; the
    // cave above is the size it is at, on its way there or wandering about it.
    const settings = swarmSettings(frame)
    const { feedback } = settings
    const seconds = swarmSize(frame, settings.seconds)
    const head = SWARM_PASSES * length
    const falls = swarmTail(settings)
    hear(frame, state.heard)

    const middle = own.y + Math.round(own.h / 2) + 0.5
    const reach = own.h / 2 - 5
    const slots = Math.max(8, Math.round(own.w))
    // The size to a quarter of a pixel, finer than a stem is wide: a glide redraws, a figure at rest does not.
    const made = `${Math.round((seconds / head) * own.w * 4)} ${feedback} ${blur} ${frame.width} ${frame.height}`
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
    }
    const tailOf = `${Object.values(settings).join(' ')} ${frame.width} ${frame.height}`
    if (tailOf !== state.tailOf) {
      state.tailOf = tailOf
      tailPoints(state.tail, falls, tail, SWARM_SPAN)
    }
    ringIn(state.heard, tailOf, falls, SWARM_SPAN)

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
    playhead(frame, state.heard, own, head)
    text(frame, secondsText(seconds), own.x + own.w - 3, own.y + own.h - 1, {
      align: 'right',
      size: 8,
    })

    divide(frame, between)
    drawTail(
      frame,
      tail,
      SWARM_SPAN,
      { curve: state.tail, said: secondsText(falls.seconds) },
      state.heard,
    )
    for (const point of swarmHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: swarmHandles,
})

function swarmHandles(view: DisplayView): DisplayHandle[] {
  const { own, tail } = panels(view)
  const stretch = view.value('stretch')
  const settings = swarmSettings(view)
  const { feedback } = settings
  const [x, y] = tailEnd(swarmTail(settings), tail, SWARM_SPAN)
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
        // until the handle comes down from where it stands.
        if (feedback >= 1 && toY <= y + 0.5 && toX >= tail.x + tail.w - 0.5) return { feedback }
        return {
          feedback: settingThrough(
            (value) => swarmTailOf({ ...settings, feedback: value }),
            0,
            Math.min(1, most),
            tail,
            SWARM_SPAN,
            toX,
            toY,
          ),
        }
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
const stringsKept = keeper<StringsNow>(16)

/**
 * Where the strings are now: from the knobs, and from what the device has
 * heard where it says. How wide the panel is depends on the knobs alone, so
 * the handle stands on the root whatever has been heard: two octaves up to
 * eight strings, three up to fifteen, four for sixteen, and in Learn, where a
 * scale of a few notes sends the strings far up, the whole of C1 to B7.
 *
 * The device says -1 until it has settled on a note, and a reading that has
 * not come yet (the display at rest, the device asleep) reads 0, which is no
 * note the detector can give: both are no note heard.
 */
function stringsNow(view: DisplayView, frame?: DisplayFrame): StringsNow {
  const root = clamp(Math.round(view.value('root')), 0, 11)
  const mode = clamp(Math.round(view.value('mode')), 0, 2)
  const count = 4 + clamp(Math.round(view.value('strings')), 0, 12)
  const note = frame?.hasMeter('note') ? Math.round(frame.meter('note')) : -1
  const heard = note >= 1 ? note : -1
  const learned = frame?.hasMeter('scale') ? clamp(Math.round(frame.meter('scale')), 0, 4095) : 0
  return stringsKept(`${root} ${mode} ${count} ${heard} ${learned}`, () => {
    const scale = sympatheticScale(mode, learned)
    const notes = sympatheticNotes(count, root, scale, heard)
    const low = mode === 2 ? LOWEST_NOTE : Math.floor(Math.min(...notes) / 12) * 12
    const wide =
      mode === 2 ? HIGHEST_NOTE + 1 - LOWEST_NOTE : count <= 8 ? 24 : count <= 15 ? 36 : 48
    return { root, mode, heard, notes, scale, low, wide }
  })
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
  heard: Heard
  tail: Point[]
  under: Point[]
}

const sympathetic = plateDisplay<SympatheticState>({
  place: 'window',
  columns: 2,
  params: ['root', 'mode', 'strings', 'decay'],
  live: { meters: true, signal: true },
  info: 'Above, the strings by pitch on the notes of their scale, each lit as high as it rings now, and the note last heard, which they move to. Drag the handle on the line to set Root. Below, the tail falling 60 dB in Decay, its end the handle, and the highest string where that dies sooner.',
  init: () => ({ heard: newHeard(SYMPATHETIC_SPAN), tail: [], under: [] }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { own, tail, between } = panels(frame)
    const now = stringsNow(frame, frame)
    const decay = frame.value('decay')
    hear(frame, state.heard)
    const made = `${decay}`
    if (made !== state.heard.made) ringIn(state.heard, made, straightTail(decay), SYMPATHETIC_SPAN)

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
    const highest = stringSeconds(hzOfNote(Math.max(...now.notes)), decay, frame.sampleRate)
    put(state.tail, 0, tail.x, tail.y)
    const [endX, endY] = fallEnd(tail, SYMPATHETIC_SPAN, decay)
    put(state.tail, 1, endX, endY)
    put(state.under, 0, tail.x, tail.y)
    const [underX, underY] = fallEnd(tail, SYMPATHETIC_SPAN, highest)
    put(state.under, 1, underX, underY)
    drawTail(
      frame,
      tail,
      SYMPATHETIC_SPAN,
      {
        curve: state.tail,
        under: highest < decay * 0.95 ? state.under : undefined,
        said: secondsText(decay),
      },
      state.heard,
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
/** `vowel_reverb.h`: the eight lines at a Size scale of 1 and the allpass in each loop, in seconds. */
const VOWEL_LINES = [0.059313, 0.066729, 0.074354, 0.083896, 0.093104, 0.104729, 0.116938, 0.131313]
const VOWEL_LOOP_ALLPASS = [
  0.008938, 0.010354, 0.011896, 0.009729, 0.012729, 0.008354, 0.011313, 0.010938,
]
/**
 * The room's modes by their share in the four lines of eight that carry the
 * vowel: a half on average. Fitted to the compiled device (the mean of eight
 * runs of a tenth of a second of notes round 1700 Hz, between two formants,
 * at nine settings).
 */
const VOWEL_MODES = modeShares(3, 3)
/** `kHighDamping`: above High Cut the room lasts a quarter as long, and the four lines without the vowel carry that. */
const VOWEL_HIGH_DAMPING = 3

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

/** Seconds of one pass round Vowel Reverb's loop: a line and its allpass, the mean of the eight. */
function vowelPass(size: number): number {
  const scale = 0.4 + 1.2 * clamp(size, 0, 1)
  return (
    VOWEL_LINES.reduce((sum, sec, n) => sum + sec * scale + VOWEL_LOOP_ALLPASS[n], 0) /
    VOWEL_LINES.length
  )
}

/**
 * What a line with the vowel takes from everything off a formant, beside the
 * decay gain, as the share of the signal the loop's vowel filter is blended
 * in at (`amount_` in `control()`): 1 - exp(extra x pass), where `extra` is
 * -6.9078 x Resonance² x 2 x max(3 / Decay, 0.2 - 1 / Decay) a second.
 */
function vowelAmount(decay: number, resonance: number, pass: number): number {
  const still = Math.max(decay, 0.01)
  const extra = resonance * resonance * 2 * Math.max(3 / still, 0.2 - 1 / still)
  return 1 - Math.exp(-6.907755278982137 * extra * pass)
}

/**
 * How the sound between the formants falls, from `control()`. Four of the
 * eight lines carry the vowel, and there a pass costs a valley, beside the
 * decay gain, (1 - amount)² of its power. The header reckons that the mixing
 * shares this with the other four, so that the valleys last a quarter as
 * long as the formants at Resonance 1. They last longer: a mode loses only
 * by its share in the four lines, and the modes that keep clear of them are
 * what is left. At Decay 6 the valleys take 3.5 s at Resonance 1 and 4.0 s
 * at 0.6 (the compiled device: 3.4 and 3.6), not 1.5 and 2.9.
 */
export function valleyTail(decay: number, resonance: number, size = 0.6): Tail {
  const pass = vowelPass(size)
  const still = Math.max(decay, 0.01)
  const kept = (1 - vowelAmount(decay, resonance, pass)) ** 2
  const { share, weight } = VOWEL_MODES
  const fall: BandFall = {
    rates: share.map((x) => 60 / still - decibels(1 - x * (1 - kept)) / pass),
    weights: weight,
  }
  return new Tail(0, 0, null, (sec) => bandLevel(fall, sec))
}

/** Seconds the sound between the formants takes to fall 60 dB. */
export const valleySeconds = (decay: number, resonance: number, size = 0.6): number =>
  valleyTail(decay, resonance, size).seconds

/**
 * The vowel as the room's loop has it, ported from `LoopBank::set()`: the
 * first three formants as broad band-passes (three times the table's width,
 * a Q of 4 at most), weighted so that their sum stands at level^0.05 on each
 * centre, and the whole scaled so that its highest point is just under 1.
 * Returns what a line keeps of a frequency, as power, when the bank is
 * blended in at `amount`: |1 - amount + amount x bank|².
 */
function vowelLoop(at: Formants, sampleRate: number): (hz: number, amount: number) => number {
  const bands = [0, 1, 2]
  const g = bands.map((k) =>
    Math.tan((Math.PI * clamp(at.hz[k], 20, sampleRate * 0.45)) / sampleRate),
  )
  const k = bands.map((n) =>
    clamp(
      Math.max(at.bandwidth[n] * 3, at.hz[n] / 4) / clamp(at.hz[n], 20, sampleRate * 0.45),
      0.02,
      2,
    ),
  )
  const wanted = bands.map((n) => Math.pow(10, clamp(at.db[n] * 0.05, -72, 0) / 20))
  // `BandCoeff::response()`, summed: the real and imaginary parts at a warped frequency.
  let re = 0
  let im = 0
  const respond = (weights: readonly number[], gf: number): void => {
    re = 0
    im = 0
    for (const n of bands) {
      const x = gf / g[n]
      const p = 1 - x * x
      const q = x * k[n]
      const scale = q / (p * p + q * q)
      re += weights[n] * q * scale
      im += weights[n] * p * scale
    }
  }
  const weights = [...wanted]
  for (let round = 0; round < 3; round++) {
    for (const n of bands) {
      respond(weights, g[n])
      weights[n] *= wanted[n] / Math.max(Math.hypot(re, im), 1e-6)
    }
  }
  // The device looks for the highest point about and between the centres; here, along the whole stretch.
  let highest = 0
  for (let i = 0; i <= VOWEL_SEARCH; i++) {
    respond(weights, Math.tan((Math.PI * vowelSearchHz(i)) / sampleRate))
    highest = Math.max(highest, Math.hypot(re, im))
  }
  const scale = 0.997 / Math.max(highest, 1)
  for (const n of bands) weights[n] *= scale
  return (hz, amount) => {
    respond(weights, Math.tan((Math.PI * Math.min(hz, sampleRate * 0.45)) / sampleRate))
    return (1 - amount + amount * re) ** 2 + (amount * im) ** 2
  }
}

/** The frequencies the loop's highest point is looked for at: 150 Hz to 5 kHz, a hundredth apart. */
const VOWEL_SEARCH = 350
const vowelSearchHz = (i: number): number => 150 * Math.pow(5000 / 150, i / VOWEL_SEARCH)

export interface VowelSettings {
  decay: number
  resonance: number
  size: number
  vowel: number
  voice: number
  lowCut: number
  highCut: number
}

/**
 * How Vowel Reverb's tail falls for a wide sound, band by band and mode by
 * mode, from `control()` and `process()`. Every pass costs the decay gain.
 * In the four lines with the vowel it also costs what the loop's vowel
 * filter takes at that frequency, counted against its highest point, which
 * the device makes up for so that only there Decay is the decay time. In
 * the other four it costs the high shelf: a one-pole low-pass at High Cut
 * blended in so far that the highs last a quarter as long. A mode loses by
 * its share in each four. The bands are weighed as they come out: an even
 * (pink) sound through the vowel, Low Cut and High Cut.
 *
 * So a wide sound does not last as long as Decay says: only what lies right
 * on the first formant does. (Compiled device, the mean of four runs of a
 * tenth of a second of pink noise, time from the loudest to 60 dB under it:
 * 5.1 s at Decay 6, 17 s at 20, 31 s at 40; this gives 5.0, 16 and 30. At
 * Resonance 0 the device takes 5.8 s and this gives 5.8.)
 */
export function vowelFall(settings: VowelSettings, sampleRate = TAIL_RATE): BandFall {
  const pass = vowelPass(settings.size)
  const still = Math.max(settings.decay, 0.01)
  const amount = vowelAmount(settings.decay, settings.resonance, pass)
  const damp = 1 - Math.exp(((2 * -6.907755278982137) / still) * VOWEL_HIGH_DAMPING * pass)
  const at = formantsAt(settings.vowel, settings.voice)
  const through = vowelLoop(at, sampleRate)
  let peak = (1 - amount) ** 2
  for (let i = 0; i <= VOWEL_SEARCH; i++) peak = Math.max(peak, through(vowelSearchHz(i), amount))
  const pole = Math.exp((-2 * Math.PI * clamp(settings.highCut, 0, sampleRate * 0.49)) / sampleRate)
  const { share, weight } = VOWEL_MODES
  const rates: number[] = []
  const weights: number[] = []
  for (const hz of FALL_BANDS) {
    const vowelKeeps = Math.min(1, through(hz, amount) / peak)
    // The shelf, 1 - damp x (1 - lowpass), with the low-pass as real and imaginary parts.
    const w = (2 * Math.PI * Math.min(hz, sampleRate / 2)) / sampleRate
    const dr = 1 - pole * Math.cos(w)
    const di = pole * Math.sin(w)
    const under = dr * dr + di * di
    const shelfKeeps =
      (1 - damp * (1 - ((1 - pole) * dr) / under)) ** 2 + ((damp * (1 - pole) * di) / under) ** 2
    const colour =
      Math.pow(10, vowelDb(hz, at, settings.resonance, sampleRate) / 10) *
      svfPower('highpass', hz, settings.lowCut, Math.SQRT1_2, sampleRate) *
      onePolePower('lowpass', hz, settings.highCut, sampleRate)
    share.forEach((x, j) => {
      const keeps = Math.max(1e-9, 1 - x * (1 - vowelKeeps) - (1 - x) * (1 - shelfKeeps))
      rates.push(60 / still - decibels(keeps) / pass)
      weights.push(colour * weight[j])
    })
  }
  return { rates, weights }
}

/** Vowel Reverb's tail for a wide sound: it answers at once and falls as its bands and modes do. */
export function vowelTailOf(settings: VowelSettings): Tail {
  const fall = vowelFall(settings)
  return new Tail(0, 0, null, (sec) => bandLevel(fall, sec))
}

const vowelSettings = (view: DisplayView): VowelSettings => ({
  decay: view.value('decay'),
  resonance: view.value('resonance'),
  size: view.value('size'),
  vowel: view.value('vowel'),
  voice: view.value('voice'),
  lowCut: view.value('lowCut'),
  highCut: view.value('highCut'),
})

/** The last few tails worked out, by their settings: a frame and a handle ask for the same one. */
const vowelTails = keeper<Tail>()

function vowelTail(settings: VowelSettings): Tail {
  return vowelTails(Object.values(settings).join(' '), () => vowelTailOf(settings))
}

interface VowelState {
  heard: Heard
  made: string
  /** The curve the knobs set, and the one being sung now with what it was worked out from. */
  set: Point[]
  now: Point[]
  sung: string
  /** The tail of a wide sound and of the sound between the formants, and what they were worked out from. */
  tail: Point[]
  under: Point[]
  /** Seconds each takes to fall 60 dB. */
  whole: number
  valleys: number
  tailOf: string
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
  params: ['vowel', 'resonance', 'voice', 'decay', 'size', 'lowCut', 'highCut'],
  live: { meters: true, signal: true, spectrum: true },
  info: 'Above, what the vowel does to the reverb over the frequencies, its formants as peaks, the vowel sung now in the accent. Drag the handle along A E I O U to choose it. Below, the tail and its time to fall 60 dB, its end the handle for Decay, and under it the sound between formants, which dies sooner.',
  init: () => ({
    heard: newHeard(VOWEL_SPAN),
    made: '',
    set: [],
    now: [],
    sung: '',
    tail: [],
    under: [],
    whole: 0,
    valleys: 0,
    tailOf: '',
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { curve, rail, xOfVowel, tail, between } = vowelLayout(frame)
    const resonance = frame.value('resonance')
    const decay = frame.value('decay')
    const size = frame.value('size')
    const lowCut = frame.value('lowCut')
    const highCut = frame.value('highCut')
    const set = frame.value('vowel')
    const voice = frame.value('voice')
    hear(frame, state.heard)

    const made = `${set} ${voice} ${resonance} ${lowCut} ${highCut} ${frame.sampleRate} ${frame.width} ${frame.height}`
    if (made !== state.made) {
      state.made = made
      state.sung = ''
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
    const settings = vowelSettings(frame)
    const tailOf = `${Object.values(settings).join(' ')} ${frame.width} ${frame.height}`
    if (tailOf !== state.tailOf) {
      state.tailOf = tailOf
      const whole = vowelTail(settings)
      state.whole = whole.seconds
      tailPoints(state.tail, whole, tail, VOWEL_SPAN)
      const valleys = valleyTail(decay, resonance, size)
      state.valleys = valleys.seconds
      tailPoints(state.under, valleys, tail, VOWEL_SPAN)
      ringIn(state.heard, tailOf, whole, VOWEL_SPAN)
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
        // To a two hundredth of a vowel, a fifth of a pixel along the line: Motion is slow, and most frames find it where it was.
        const sung = `${Math.round(now * 200)} ${Math.round(lean * 200)} ${Math.round(voiceNow * 400)} ${Math.round(build * 400)}`
        if (sung !== state.sung) {
          state.sung = sung
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
        }
        clipped(ctx, curve, () => trace(ctx, state.now, { colour: colours.accent, width: 1.25 }))
      }
      const x = xOfVowel(now)
      rule(ctx, x, rail - 3, x, rail + 3, { colour: colours.accent, width: 2 })
    }

    divide(frame, between)
    drawTail(
      frame,
      tail,
      VOWEL_SPAN,
      {
        curve: state.tail,
        under: state.valleys < state.whole * 0.95 ? state.under : undefined,
        said: secondsText(state.whole, true),
      },
      state.heard,
    )
    for (const point of vowelHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: vowelHandles,
})

function vowelHandles(view: DisplayView): DisplayHandle[] {
  const { rail, xOfVowel, own } = vowelLayout(view)
  const settings = vowelSettings(view)
  return [
    {
      key: 'vowel',
      name: 'Vowel',
      x: xOfVowel(view.value('vowel')),
      y: rail,
      drag: (toX) => ({ vowel: clamp(((toX - own.x - 8) / (own.w - 16)) * 4, 0, 4) }),
      reset: () => ({ vowel: view.spec('vowel')?.default ?? 0 }),
    },
    tailHandle(view, VOWEL_SPAN, 'decay', 'Decay', vowelTail(settings), (decay) =>
      vowelTailOf({ ...settings, decay }),
    ),
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
