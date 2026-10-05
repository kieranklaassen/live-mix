// What the plate displays share, so they read as one family: the ground they
// are drawn on, the two inks and how strongly each is used, the scales
// (frequency, decibels, time), traces, handles, a history that scrolls by the
// clock and not by the frame, and the response of the filters the devices are
// built from. A display in `displays/` draws with these and adds only what is
// its own.
//
// The rule for the two inks: the ink carries what is read (the curve, the
// trace, the scale), the accent points at what is happening now (the level on
// the curve, the LFO's place in its cycle, the gain taken off). Nothing here
// names a colour; a display paints in `frame.colours`.

import { type DisplayColours, type DisplayFrame, type DisplayView } from './plate-display'

/** How strongly an ink is laid, by what it draws; one scale for every display. */
export const INK = {
  /** How much of the plate's own colour lies over its finish under a display. */
  hush: 0.7,
  /** The ground under a display: the plate, a shade nearer its ink. */
  ground: 0.1,
  /** Scale lines. */
  grid: 0.16,
  /** The line around the ground, and the zero line of a scale. */
  rule: 0.34,
  /** A fill under a trace. */
  fill: 0.18,
  /** What stands behind the main trace: the sound going in, a curve's parts. */
  back: 0.5,
  /** A word or a mark that stands back a little from the main trace. */
  text: 0.8,
  /** The main trace. */
  trace: 1,
} as const

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

type Ctx = CanvasRenderingContext2D
type Paint = Pick<DisplayFrame, 'ctx' | 'colours'>
/** A place on a display, in its pixels. */
export type Point = readonly [number, number]

export const clamp = (value: number, low: number, high: number): number =>
  value < low ? low : value > high ? high : value
export const lerp = (from: number, to: number, t: number): number => from + (to - from) * t
/**
 * The middle of the pixel a value falls in, so a line one pixel wide lies on
 * one row of pixels and is sharp, never more than half a pixel from its value.
 */
export const crisp = (value: number): number => Math.floor(value) + 0.5

/**
 * The ground of a display, over the whole canvas: the plate with its finish
 * hushed, a shade nearer its ink, and a line around it. Returns the box to draw in, `pad` pixels inside
 * the line (default 3).
 */
export function ground(frame: Paint & Pick<DisplayView, 'width' | 'height'>, pad = 3): Box {
  const { ctx, colours, width, height } = frame
  // The plate's finish (specks, a brushing) is hushed under a display, so a thin line is not read against it.
  ctx.globalAlpha = INK.hush
  ctx.fillStyle = colours.plate
  ctx.fillRect(0, 0, width, height)
  ctx.globalAlpha = INK.ground
  ctx.fillStyle = colours.ink
  ctx.fillRect(0, 0, width, height)
  ctx.globalAlpha = INK.rule
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1)
  ctx.globalAlpha = 1
  return { x: 1 + pad, y: 1 + pad, w: width - 2 - 2 * pad, h: height - 2 - 2 * pad }
}

/** A box inside a box: so much taken off each side. */
export function inset(box: Box, left: number, top = left, right = left, bottom = top): Box {
  return { x: box.x + left, y: box.y + top, w: box.w - left - right, h: box.h - top - bottom }
}

/** Keep what is drawn in `draw` inside `box`. */
export function clipped(ctx: Ctx, box: Box, draw: () => void): void {
  ctx.save()
  ctx.beginPath()
  ctx.rect(box.x, box.y, box.w, box.h)
  ctx.clip()
  draw()
  ctx.restore()
}

export interface StrokeStyle {
  colour: string
  /** Line width in pixels (default 1.5). */
  width?: number
  alpha?: number
  /** Dash and gap in pixels. */
  dash?: readonly [number, number]
}

function pathOf(ctx: Ctx, points: readonly Point[]): void {
  ctx.beginPath()
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i]
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
}

/** A line through points. */
export function trace(ctx: Ctx, points: readonly Point[], style: StrokeStyle): void {
  if (points.length < 2) return
  pathOf(ctx, points)
  ctx.globalAlpha = style.alpha ?? 1
  ctx.strokeStyle = style.colour
  ctx.lineWidth = style.width ?? 1.5
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.setLineDash(style.dash ? [...style.dash] : [])
  ctx.stroke()
  ctx.setLineDash([])
  ctx.globalAlpha = 1
}

/** The area between a line through points and the level `toY`. */
export function fillTo(
  ctx: Ctx,
  points: readonly Point[],
  toY: number,
  colour: string,
  alpha: number = INK.fill,
): void {
  if (points.length < 2) return
  pathOf(ctx, points)
  ctx.lineTo(points[points.length - 1][0], toY)
  ctx.lineTo(points[0][0], toY)
  ctx.closePath()
  ctx.globalAlpha = alpha
  ctx.fillStyle = colour
  ctx.fill()
  ctx.globalAlpha = 1
}

/** The area between two lines over the same x: what one has that the other has not. */
export function fillBetween(
  ctx: Ctx,
  upper: readonly Point[],
  lower: readonly Point[],
  colour: string,
  alpha: number = INK.fill,
): void {
  if (upper.length < 2 || lower.length < 2) return
  pathOf(ctx, upper)
  for (let i = lower.length - 1; i >= 0; i--) ctx.lineTo(lower[i][0], lower[i][1])
  ctx.closePath()
  ctx.globalAlpha = alpha
  ctx.fillStyle = colour
  ctx.fill()
  ctx.globalAlpha = 1
}

/** A straight line, one pixel wide unless told, sharp when level or upright. */
export function rule(
  ctx: Ctx,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style: StrokeStyle,
): void {
  const width = style.width ?? 1
  const level = y1 === y2 && width === 1
  const upright = x1 === x2 && width === 1
  trace(
    ctx,
    [
      [upright ? crisp(x1) : x1, level ? crisp(y1) : y1],
      [upright ? crisp(x2) : x2, level ? crisp(y2) : y2],
    ],
    { ...style, width },
  )
}

export function fillRect(ctx: Ctx, box: Box, colour: string, alpha = 1): void {
  if (box.w <= 0 || box.h <= 0) return
  ctx.globalAlpha = alpha
  ctx.fillStyle = colour
  ctx.fillRect(box.x, box.y, box.w, box.h)
  ctx.globalAlpha = 1
}

/** A filled dot; with `ring`, a line of that colour around it so it stands off a trace. */
export function dot(
  ctx: Ctx,
  x: number,
  y: number,
  radius: number,
  colour: string,
  options: { alpha?: number; ring?: string } = {},
): void {
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.globalAlpha = options.alpha ?? 1
  ctx.fillStyle = colour
  ctx.fill()
  if (options.ring) {
    ctx.strokeStyle = options.ring
    ctx.lineWidth = 1
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

/**
 * A point that can be dragged: a ring in the ink, filled with the plate so the
 * trace under it shows as cut, and filled with the accent while it is under
 * the pointer or in hand. Every display draws its handles with this.
 */
export function handle(
  frame: Paint,
  x: number,
  y: number,
  options: { hot?: boolean; radius?: number } = {},
): void {
  const { ctx, colours } = frame
  const radius = options.radius ?? 3.5
  ctx.beginPath()
  ctx.arc(x, y, options.hot ? radius + 1 : radius, 0, Math.PI * 2)
  ctx.fillStyle = options.hot ? colours.accent : colours.plate
  ctx.fill()
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1.5
  ctx.stroke()
}

export interface TextStyle {
  align?: CanvasTextAlign
  baseline?: CanvasTextBaseline
  /** Type size in pixels (default 8, the size of a knob's word). */
  size?: number
  colour?: string
  alpha?: number
}

/**
 * The faintest a word is drawn: a scale's numbers and a part that is not in
 * use stand back no further. Measured on the plates: at 0.62 such a word stood
 * at about 2.5 to 1 against its ground, too little for type this small.
 */
export const TEXT_LEAST = 0.8

/** Words on a display, in the plate's own type. */
export function text(
  frame: Pick<DisplayFrame, 'ctx' | 'colours' | 'fontFamily'>,
  words: string,
  x: number,
  y: number,
  style: TextStyle = {},
): void {
  const { ctx } = frame
  ctx.font = `${style.size ?? 8}px ${frame.fontFamily}`
  ctx.textAlign = style.align ?? 'left'
  ctx.textBaseline = style.baseline ?? 'alphabetic'
  // At 8 px a word needs all the ink there is; one told to stand back still has to be read.
  ctx.globalAlpha = Math.max(TEXT_LEAST, style.alpha ?? 1)
  ctx.fillStyle = style.colour ?? frame.colours.ink
  ctx.fillText(words, x, y)
  ctx.globalAlpha = 1
}

/**
 * Words over a part of a display where things move: they stand on a patch of
 * the plate, so what runs under them does not cross the letters. `x` is their
 * left end, or their right end with `align` right; `y` their baseline.
 */
export function label(
  frame: Pick<DisplayFrame, 'ctx' | 'colours' | 'fontFamily'>,
  words: string,
  x: number,
  y: number,
  align: 'left' | 'right' = 'left',
  size = 8,
): void {
  const { ctx } = frame
  ctx.font = `${size}px ${frame.fontFamily}`
  const wide = Math.ceil(ctx.measureText(words).width) + 4
  const left = align === 'right' ? x - wide + 2 : x - 2
  fillRect(ctx, { x: left, y: y - size, w: wide, h: size + 2 }, frame.colours.plate, 0.7)
  text(frame, words, x, y, { align, size })
}

// --- Decibels ---------------------------------------------------------------

/** Under this a level is silence. */
export const FLOOR_DB = -120

export function gainToDb(gain: number): number {
  return gain > 1e-6 ? 20 * Math.log10(gain) : FLOOR_DB
}

export function dbToGain(db: number): number {
  return Math.pow(10, db / 20)
}

/** Where a level in dB falls in a box whose top is `topDb` and whose foot is `bottomDb`. */
export function yOfDb(db: number, box: Box, topDb: number, bottomDb: number): number {
  return box.y + ((topDb - db) / (topDb - bottomDb)) * box.h
}

export function dbOfY(y: number, box: Box, topDb: number, bottomDb: number): number {
  return topDb - ((y - box.y) / box.h) * (topDb - bottomDb)
}

/** Level lines every `stepDb`, the one at `zeroDb` (default 0) stronger. */
export function dbGrid(
  frame: Paint,
  box: Box,
  topDb: number,
  bottomDb: number,
  stepDb: number,
  zeroDb = 0,
): void {
  const { ctx, colours } = frame
  for (let db = Math.ceil(bottomDb / stepDb) * stepDb; db <= topDb; db += stepDb) {
    if (db === bottomDb || db === topDb) continue
    const y = yOfDb(db, box, topDb, bottomDb)
    rule(ctx, box.x, y, box.x + box.w, y, {
      colour: colours.ink,
      alpha: db === zeroDb ? INK.rule : INK.grid,
    })
  }
}

// --- Frequency --------------------------------------------------------------

export const FREQ_MIN = 20
export const FREQ_MAX = 20000

/** Where a frequency falls across a box, on a scale of equal octaves from 20 Hz to 20 kHz. */
export function xOfHz(hz: number, box: Box, minHz = FREQ_MIN, maxHz = FREQ_MAX): number {
  const t = Math.log(clamp(hz, minHz, maxHz) / minHz) / Math.log(maxHz / minHz)
  return box.x + t * box.w
}

export function hzOfX(x: number, box: Box, minHz = FREQ_MIN, maxHz = FREQ_MAX): number {
  return minHz * Math.pow(maxHz / minHz, clamp((x - box.x) / box.w, 0, 1))
}

/** Upright lines at 100 Hz, 1 kHz and 10 kHz, and fainter ones at the 2s and 5s between when there is room. */
export function freqGrid(frame: Paint, box: Box, minHz = FREQ_MIN, maxHz = FREQ_MAX): void {
  const { ctx, colours } = frame
  const fine = box.w >= 150
  for (let decade = 10; decade <= maxHz; decade *= 10) {
    for (const step of fine ? [1, 2, 5] : [1]) {
      const hz = decade * step
      if (hz <= minHz || hz >= maxHz) continue
      const x = xOfHz(hz, box, minHz, maxHz)
      rule(ctx, x, box.y, x, box.y + box.h, {
        colour: colours.ink,
        alpha: step === 1 ? INK.grid : INK.grid * 0.55,
      })
    }
  }
}

/** A frequency as it is said: "80 Hz", "1.2 kHz", "12 kHz". */
export function hzText(hz: number): string {
  // The unit is chosen by the number printed: 999.6 rounds to a thousand, which is "1 kHz".
  const whole = Math.round(hz)
  if (!(whole >= 1000)) return `${whole} Hz`
  if (hz >= 10000) return `${Math.round(hz / 1000)} kHz`
  return `${(hz / 1000).toFixed(1).replace(/\.0$/, '')} kHz`
}

/** A level as it is said, with a real minus: "+3.0 dB", "−12.5 dB". */
export function dbText(db: number): string {
  const rounded = Math.round(db * 10) / 10
  return `${rounded > 0 ? '+' : rounded < 0 ? '−' : ''}${Math.abs(rounded).toFixed(1)} dB`
}

/**
 * The sound's spectrum behind a curve: a fill in the ink from the foot of the
 * box up to each band's level, on the frequency scale. One point per pixel
 * column at most, the loudest bin in the column, so a narrow peak is kept.
 */
export function spectrum(
  frame: Paint & Pick<DisplayFrame, 'signal'>,
  box: Box,
  options: {
    topDb?: number
    bottomDb?: number
    alpha?: number
    minHz?: number
    maxHz?: number
  } = {},
): void {
  const bins = frame.signal?.spectrum
  const binHz = frame.signal?.binHz ?? 0
  if (!bins || binHz <= 0) return
  const topDb = options.topDb ?? 0
  const bottomDb = options.bottomDb ?? -90
  const minHz = options.minHz ?? FREQ_MIN
  const maxHz = options.maxHz ?? FREQ_MAX
  const foot = box.y + box.h
  const points: Point[] = []
  const columns = Math.max(2, Math.floor(box.w / 2))
  let any = false
  for (let c = 0; c <= columns; c++) {
    const from = hzOfX(box.x + ((c - 0.5) / columns) * box.w, box, minHz, maxHz)
    const to = hzOfX(box.x + ((c + 0.5) / columns) * box.w, box, minHz, maxHz)
    let db = -Infinity
    if (to - from < binHz) {
      // Low down a bin is wider than a column: read between two bins, so the
      // bass is a slope and not a flight of steps.
      const at = clamp((from + to) / 2 / binHz, 1, bins.length - 1)
      const below = Math.floor(at)
      const above = Math.min(bins.length - 1, below + 1)
      db = lerp(bins[below], bins[above], at - below)
    } else {
      const first = clamp(Math.ceil(from / binHz), 1, bins.length - 1)
      const last = clamp(Math.floor(to / binHz), first, bins.length - 1)
      for (let i = first; i <= last; i++) if (bins[i] > db) db = bins[i]
    }
    if (!Number.isFinite(db)) db = bottomDb
    if (db > bottomDb) any = true
    points.push([
      box.x + (c / columns) * box.w,
      clamp(yOfDb(db, box, topDb, bottomDb), box.y, foot),
    ])
  }
  if (!any) return
  fillTo(frame.ctx, points, foot, frame.colours.ink, options.alpha ?? INK.fill)
}

// --- Time -------------------------------------------------------------------

/**
 * A value kept over the last so many seconds, for a trace that scrolls. It
 * moves by the clock: a slot is a fixed length of time, so the trace runs at
 * the same speed at 30 frames a second as at 60, and after a pause the gap is
 * filled with the value before it.
 */
export class History {
  private readonly values: Float32Array
  private head = 0
  private lastSlot: number | null = null

  constructor(
    readonly seconds: number,
    readonly slots: number,
    private readonly fill = 0,
    /** Within one slot keep the highest reading (a level) or the lowest (a gain); default the latest. */
    private readonly keep: 'latest' | 'max' | 'min' = 'latest',
  ) {
    this.values = new Float32Array(slots).fill(fill)
  }

  /** Add a reading taken at `now` (seconds). */
  push(now: number, value: number): void {
    const slot = Math.floor((now / this.seconds) * this.slots)
    const newest = (this.head + this.slots - 1) % this.slots
    if (this.lastSlot === null || slot <= this.lastSlot) {
      // Still in the newest slot: it keeps the latest, the highest or the lowest of its readings.
      const kept = this.values[newest]
      this.values[newest] =
        this.lastSlot === null || this.keep === 'latest'
          ? value
          : this.keep === 'max'
            ? Math.max(kept, value)
            : Math.min(kept, value)
      this.lastSlot ??= slot
      return
    }
    // A slot for every step of the clock since: the ones a pause skipped hold
    // what was there before, the newest takes the reading.
    const steps = Math.min(this.slots, slot - this.lastSlot)
    const held = this.values[newest]
    for (let i = 0; i < steps; i++) {
      this.values[this.head] = i === steps - 1 ? value : held
      this.head = (this.head + 1) % this.slots
    }
    this.lastSlot = slot
  }

  /** The reading `back` slots ago: 0 is the newest. */
  at(back: number): number {
    return this.values[(this.head + this.slots * 2 - 1 - back) % this.slots]
  }

  /**
   * The history as points across a box, oldest at the left and now at the
   * right edge; `y` places a reading.
   */
  points(box: Box, y: (value: number) => number): Point[] {
    const points: Point[] = []
    for (let i = 0; i < this.slots; i++) {
      const value = this.values[(this.head + i) % this.slots]
      points.push([box.x + (i / (this.slots - 1)) * box.w, y(value)])
    }
    return points
  }

  clear(): void {
    this.values.fill(this.fill)
    this.lastSlot = null
  }
}

/**
 * A value on its way to a target: it rises with one time constant and falls
 * with another (seconds), whatever the frame rate. For a level that should
 * jump up and sink back, as a meter does.
 */
export function follow(
  value: number,
  target: number,
  dt: number,
  riseSec: number,
  fallSec: number,
): number {
  if (!Number.isFinite(target)) return value
  const time = target > value ? riseSec : fallSec
  if (time <= 0 || dt <= 0) return dt <= 0 && time > 0 ? value : target
  return target + (value - target) * Math.exp(-dt / time)
}

// --- Filters ----------------------------------------------------------------

export type BiquadKind =
  'lowpass' | 'highpass' | 'bandpass' | 'notch' | 'peaking' | 'lowshelf' | 'highshelf' | 'allpass'

export interface Biquad {
  b0: number
  b1: number
  b2: number
  a1: number
  a2: number
}

/**
 * The coefficients of a second-order filter as the Audio EQ Cookbook gives
 * them, which is what Web Audio's `BiquadFilterNode` computes: for `lowpass`
 * and `highpass` there, Q is the height of the peak in dB (pass `qIsDb`); the
 * shelves take no Q (slope 1). A device with a filter of its own that is not
 * one of these has its formula beside its display.
 */
export function biquad(
  kind: BiquadKind,
  hz: number,
  q: number,
  gainDb: number,
  sampleRate: number,
  qIsDb = false,
): Biquad {
  const w0 = (2 * Math.PI * clamp(hz, 1, sampleRate * 0.499)) / sampleRate
  const cos = Math.cos(w0)
  const sin = Math.sin(w0)
  const A = Math.pow(10, gainDb / 40)
  const Q = qIsDb ? Math.pow(10, q / 20) : Math.max(1e-4, q)
  const alpha = sin / (2 * Q)
  let b0: number, b1: number, b2: number, a0: number, a1: number, a2: number
  switch (kind) {
    case 'lowpass':
      b0 = (1 - cos) / 2
      b1 = 1 - cos
      b2 = (1 - cos) / 2
      a0 = 1 + alpha
      a1 = -2 * cos
      a2 = 1 - alpha
      break
    case 'highpass':
      b0 = (1 + cos) / 2
      b1 = -(1 + cos)
      b2 = (1 + cos) / 2
      a0 = 1 + alpha
      a1 = -2 * cos
      a2 = 1 - alpha
      break
    case 'bandpass':
      b0 = alpha
      b1 = 0
      b2 = -alpha
      a0 = 1 + alpha
      a1 = -2 * cos
      a2 = 1 - alpha
      break
    case 'notch':
      b0 = 1
      b1 = -2 * cos
      b2 = 1
      a0 = 1 + alpha
      a1 = -2 * cos
      a2 = 1 - alpha
      break
    case 'allpass':
      b0 = 1 - alpha
      b1 = -2 * cos
      b2 = 1 + alpha
      a0 = 1 + alpha
      a1 = -2 * cos
      a2 = 1 - alpha
      break
    case 'peaking':
      b0 = 1 + alpha * A
      b1 = -2 * cos
      b2 = 1 - alpha * A
      a0 = 1 + alpha / A
      a1 = -2 * cos
      a2 = 1 - alpha / A
      break
    case 'lowshelf': {
      const shelf = (sin / 2) * Math.SQRT2
      const k = 2 * Math.sqrt(A) * shelf
      b0 = A * (A + 1 - (A - 1) * cos + k)
      b1 = 2 * A * (A - 1 - (A + 1) * cos)
      b2 = A * (A + 1 - (A - 1) * cos - k)
      a0 = A + 1 + (A - 1) * cos + k
      a1 = -2 * (A - 1 + (A + 1) * cos)
      a2 = A + 1 + (A - 1) * cos - k
      break
    }
    case 'highshelf': {
      const shelf = (sin / 2) * Math.SQRT2
      const k = 2 * Math.sqrt(A) * shelf
      b0 = A * (A + 1 + (A - 1) * cos + k)
      b1 = -2 * A * (A - 1 + (A + 1) * cos)
      b2 = A * (A + 1 + (A - 1) * cos - k)
      a0 = A + 1 - (A - 1) * cos + k
      a1 = 2 * (A - 1 - (A + 1) * cos)
      a2 = A + 1 - (A - 1) * cos - k
      break
    }
  }
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 }
}

/** What a second-order filter does to a frequency, in dB. */
export function biquadDb(filter: Biquad, hz: number, sampleRate: number): number {
  const w = (2 * Math.PI * hz) / sampleRate
  const cos1 = Math.cos(w)
  const cos2 = Math.cos(2 * w)
  const sin1 = Math.sin(w)
  const sin2 = Math.sin(2 * w)
  const numRe = filter.b0 + filter.b1 * cos1 + filter.b2 * cos2
  const numIm = -(filter.b1 * sin1 + filter.b2 * sin2)
  const denRe = 1 + filter.a1 * cos1 + filter.a2 * cos2
  const denIm = -(filter.a1 * sin1 + filter.a2 * sin2)
  const power = (numRe * numRe + numIm * numIm) / (denRe * denRe + denIm * denIm)
  return power > 1e-12 ? 10 * Math.log10(power) : FLOOR_DB
}

/** What a first-order low or high cut at `cutHz` does to a frequency, in dB (6 dB an octave). */
export function onePoleDb(kind: 'lowpass' | 'highpass', cutHz: number, hz: number): number {
  const ratio = kind === 'lowpass' ? hz / cutHz : cutHz / hz
  return -10 * Math.log10(1 + ratio * ratio)
}

/**
 * A response curve across a box: `db(hz)` at every second pixel, as points on
 * the frequency and dB scales. The points run past the box where the curve
 * does, so clip to the box when drawing it.
 */
export function responsePoints(
  box: Box,
  db: (hz: number) => number,
  topDb: number,
  bottomDb: number,
  minHz = FREQ_MIN,
  maxHz = FREQ_MAX,
): Point[] {
  const points: Point[] = []
  for (let x = 0; x <= box.w; x += 2) {
    const hz = hzOfX(box.x + x, box, minHz, maxHz)
    points.push([box.x + x, yOfDb(clamp(db(hz), bottomDb - 24, topDb + 24), box, topDb, bottomDb)])
  }
  return points
}

// --- Modulation -------------------------------------------------------------

export type LfoShape = 'sine' | 'triangle' | 'square' | 'saw' | 'ramp'

/** One cycle of a plain LFO shape at `phase` (0..1), between −1 and 1, starting as a sine does. */
export function lfo(shape: LfoShape, phase: number): number {
  const p = phase - Math.floor(phase)
  switch (shape) {
    case 'sine':
      return Math.sin(p * Math.PI * 2)
    case 'triangle':
      return p < 0.25 ? p * 4 : p < 0.75 ? 2 - p * 4 : p * 4 - 4
    case 'square':
      return p < 0.5 ? 1 : -1
    case 'saw':
      return 1 - p * 2
    case 'ramp':
      return p * 2 - 1
  }
}

/**
 * Where an LFO is in its cycle on this frame, from a reading that arrives
 * less often than frames do: the reading is carried forward at the LFO's rate
 * between two arrivals, so the mark moves smoothly and stays in step with the
 * sound. A running LFO never reports the same place twice, so the same
 * reading for `PHASE_STANDS_SEC` means the device is not running (it sleeps,
 * or the engine is stopped): then the mark stands on the reading and is not
 * carried on by the clock. Keep the returned state and pass it back.
 */
export interface PhaseTrack {
  phase: number
  reading: number
  /** How long the same reading has come, in seconds. */
  stood?: number
}

/** How long the same reading may come before the mark stands on it, in seconds. */
export const PHASE_STANDS_SEC = 0.15

export function trackPhase(
  track: PhaseTrack | null,
  reading: number,
  rateHz: number,
  dt: number,
): PhaseTrack {
  if (!track) return { phase: reading, reading }
  const carried = track.phase + rateHz * dt
  if (reading !== track.reading) {
    // A new reading: go to it, unless carrying forward already put us within a
    // step of it. It is measured against where this frame was carried to, so
    // the mark settles on the reading and not a frame ahead of it.
    const ahead = ((((carried - reading + 0.5) % 1) + 1) % 1) - 0.5
    const near = Math.abs(ahead) < Math.max(0.02, rateHz / 20)
    return { phase: near ? wrap(carried - ahead * 0.5) : reading, reading }
  }
  const stood = (track.stood ?? 0) + dt
  if (stood >= PHASE_STANDS_SEC) return { phase: reading, reading, stood }
  return { phase: wrap(carried), reading, stood }
}

const wrap = (phase: number): number => phase - Math.floor(phase)

// --- Colour -----------------------------------------------------------------

/** The colours a display is painted in when it cannot ask the page: a test, a server. */
export const PLAIN_COLOURS: DisplayColours = {
  plate: 'Canvas',
  ink: 'CanvasText',
  accent: 'Highlight',
}
