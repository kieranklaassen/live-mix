// Displays of the devices that age a sound: what the medium takes away and
// what it adds. One language for the family: the medium's response across
// frequency is a line in the ink over the spectrum of what comes out; what
// the medium adds (its noise floor, its ticks, its dropouts) is in the second
// colour, at its real level on the spectrum's own scale; what it does to the
// pitch is a trace of the last seconds; what it does to the wave is the wave.
//
// Many of these stand open at once while music plays, so a frame makes
// nothing: curves are worked out again only when a control moves, and lines
// are drawn from points kept between frames (`Path`), not from arrays made
// for the kit's `trace`.

import {
  History,
  INK,
  biquad,
  biquadDb,
  clamp,
  crisp,
  dbOfY,
  gainToDb,
  ground,
  handle,
  hzOfX,
  hzText,
  text,
  trackPhase,
  xOfHz,
  yOfDb,
  type Biquad,
  type Box,
  type PhaseTrack,
  type TextStyle,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayHold,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

type Size = Pick<DisplayView, 'width' | 'height'>
type Paint = Pick<DisplayFrame, 'ctx' | 'colours'>

// --- The spectrum's scale ---------------------------------------------------

/** The spectrum behind a wear display: full scale at the top, this at the foot. */
const TOP_DB = 0
const FOOT_DB = -110
/** The analyser's window when there is no sound to ask: 2048 samples. */
const TAP_BINS = 2048
/**
 * What the analyser reads in one bin for noise, against the noise's power per
 * sample: the mean square of its Blackman window, and the π/4 its averaging of
 * magnitudes loses against an average of powers.
 */
const NOISE_WINDOW = 0.3046 * (Math.PI / 4)
/** What it reads in the bin of a steady tone of amplitude 1, in dB: half the window's mean, less a little for a tone between two bins. */
const TONE_DB = -14
/** Two sides with noise of their own are read as their sum: half the power of one. */
const SIDES_APART = 0.5
/** Under this nothing is drawn. */
const SILENT_DB = -200

const db10 = (power: number): number => (power > 1e-20 ? 10 * Math.log10(power) : SILENT_DB)
const db20 = (gain: number): number => (gain > 1e-10 ? 20 * Math.log10(gain) : SILENT_DB)
const fromDb = (db: number): number => Math.pow(10, db / 20)

/** Under this nothing sounds, as for the plate that draws the display. */
const QUIET = 1e-4
/**
 * What Mix leaves of what a device makes where it is a straight cross-fade
 * (Vinyl, Low Bitrate): Mix itself, and all of it for a device without one.
 * With less than `QUIET` of it only the sound that came in is heard, and the
 * display is at rest as it is when the device is switched off.
 */
const mixOf = (view: DisplayView): number => (view.spec('mix') ? clamp(view.value('mix'), 0, 1) : 1)

/** The width of one bin of the spectrum, with or without sound. */
const binHzOf = (frame: Pick<DisplayFrame, 'signal' | 'sampleRate'>): number =>
  frame.signal && frame.signal.binHz > 0 ? frame.signal.binHz : frame.sampleRate / TAP_BINS

/**
 * The level a bin of the spectrum shows for noise with `variance` per sample
 * at `sampleRate`, white before whatever shaped it.
 */
function noiseBinDb(variance: number, sampleRate: number, binHz: number): number {
  return db10(variance * (binHz / sampleRate) * NOISE_WINDOW)
}

// --- Filters as the kit in C++ has them -------------------------------------
//
// Where a device adds two filtered copies of one noise, their sum needs the
// phase too, so these answer with a complex number. Each says which C++
// filter it is.

interface Cx {
  re: number
  im: number
}
const cx = (re: number, im = 0): Cx => ({ re, im })
const cadd = (a: Cx, b: Cx): Cx => cx(a.re + b.re, a.im + b.im)
const cmul = (a: Cx, b: Cx): Cx => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re)
const cscale = (a: Cx, k: number): Cx => cx(a.re * k, a.im * k)
const cdiv = (a: Cx, b: Cx): Cx => {
  const d = b.re * b.re + b.im * b.im || 1e-30
  return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d)
}
const power = (a: Cx): number => a.re * a.re + a.im * a.im

/** Where `hz` stands against a corner once the bilinear transform has bent the scale. */
function warped(hz: number, cornerHz: number, sampleRate: number): number {
  const top = sampleRate * 0.49
  return (
    Math.tan((Math.PI * Math.min(hz, top)) / sampleRate) /
    Math.tan((Math.PI * clamp(cornerHz, 5, top)) / sampleRate)
  )
}

/** `kit::Svf` at a frequency: its low-pass, its band-pass (1 at the centre) or its high-pass. */
function svf(
  kind: 'low' | 'band' | 'high',
  hz: number,
  cornerHz: number,
  q: number,
  sampleRate: number,
): Cx {
  const t = warped(hz, cornerHz, sampleRate)
  const k = 1 / Math.max(q, 0.1)
  const over = cx(1 - t * t, t * k)
  return cdiv(kind === 'low' ? cx(1) : kind === 'high' ? cx(-t * t) : cx(0, t * k), over)
}

/** `noise_beds::TrapezoidPole`: a one-pole low-pass by the trapezoidal rule. */
const trapezoid = (hz: number, cornerHz: number, sampleRate: number): Cx =>
  cdiv(cx(1), cx(1, warped(hz, cornerHz, sampleRate)))

/** `kit::OnePole`: y = x + (y − x)·a with a = exp(−2π·corner / rate). */
function onePole(hz: number, cornerHz: number, sampleRate: number): Cx {
  const a = Math.exp((-2 * Math.PI * clamp(cornerHz, 0, sampleRate * 0.49)) / sampleRate)
  const w = (2 * Math.PI * hz) / sampleRate
  return cdiv(cx(1 - a), cx(1 - a * Math.cos(w), a * Math.sin(w)))
}
/** What `kit::OnePole::highpass` leaves: the input less its low-pass. */
const onePoleHigh = (hz: number, cornerHz: number, sampleRate: number): Cx =>
  cadd(cx(1), cscale(onePole(hz, cornerHz, sampleRate), -1))

/** `kit::DcBlocker`: y = x − x₁ + r·y₁ with r = 1 − 2π·corner / rate. */
function dcBlocker(hz: number, cornerHz: number, sampleRate: number): Cx {
  const r = 1 - (2 * Math.PI * cornerHz) / sampleRate
  const w = (2 * Math.PI * hz) / sampleRate
  return cdiv(cx(1 - Math.cos(w), Math.sin(w)), cx(1 - r * Math.cos(w), r * Math.sin(w)))
}

/** What a chain of `kit::Biquad`s does to a frequency, in dB. */
const chainDb = (filters: readonly Biquad[], hz: number, sampleRate: number): number =>
  filters.reduce((sum, filter) => sum + biquadDb(filter, hz, sampleRate), 0)

/** Butterworth section Qs for four poles, as the devices write them. */
const BUTTER4 = [0.5412, 1.3066] as const

// --- Drawing that makes nothing ----------------------------------------------

type Ctx = CanvasRenderingContext2D

/** The points of a line, kept between frames: x and y side by side, `n` of them in use. */
interface Path {
  x: Float64Array
  y: Float64Array
  n: number
}

const newPath = (room = 0): Path => ({
  x: new Float64Array(room),
  y: new Float64Array(room),
  n: 0,
})

/** Make room in a path for `n` points and say that many are in use. */
function sized(path: Path, n: number): Path {
  if (path.x.length < n) {
    path.x = new Float64Array(n)
    path.y = new Float64Array(n)
  }
  path.n = n
  return path
}

// One array for each kind of line, handed to the canvas as it is.
const SOLID: number[] = []
const DASHED: number[] = [2, 2]
const DOTTED: number[] = [1, 3]

/** A line through a path's points, or through those from `from` to `to`; the kit's `trace` without its arrays. */
function strokePath(
  ctx: Ctx,
  path: Path,
  colour: string,
  width = 1.5,
  alpha = 1,
  dash: number[] = SOLID,
  from = 0,
  to = path.n - 1,
): void {
  if (to - from < 1) return
  ctx.beginPath()
  ctx.moveTo(path.x[from], path.y[from])
  for (let i = from + 1; i <= to; i++) ctx.lineTo(path.x[i], path.y[i])
  ctx.globalAlpha = alpha
  ctx.strokeStyle = colour
  ctx.lineWidth = width
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  if (dash !== SOLID) ctx.setLineDash(dash)
  ctx.stroke()
  if (dash !== SOLID) ctx.setLineDash(SOLID)
  ctx.globalAlpha = 1
}

/** The area between a path and the level `toY`. */
function fillUnder(ctx: Ctx, path: Path, toY: number, colour: string, alpha: number): void {
  const n = path.n
  if (n < 2) return
  ctx.beginPath()
  ctx.moveTo(path.x[0], path.y[0])
  for (let i = 1; i < n; i++) ctx.lineTo(path.x[i], path.y[i])
  ctx.lineTo(path.x[n - 1], toY)
  ctx.lineTo(path.x[0], toY)
  ctx.closePath()
  ctx.globalAlpha = alpha
  ctx.fillStyle = colour
  ctx.fill()
  ctx.globalAlpha = 1
}

/** The area between two paths over the same columns. */
function fillBetween(ctx: Ctx, one: Path, other: Path, colour: string, alpha: number): void {
  if (one.n < 2 || other.n < 2) return
  ctx.beginPath()
  ctx.moveTo(one.x[0], one.y[0])
  for (let i = 1; i < one.n; i++) ctx.lineTo(one.x[i], one.y[i])
  for (let i = other.n - 1; i >= 0; i--) ctx.lineTo(other.x[i], other.y[i])
  ctx.closePath()
  ctx.globalAlpha = alpha
  ctx.fillStyle = colour
  ctx.fill()
  ctx.globalAlpha = 1
}

/** A straight line, one pixel wide unless told, sharp when level or upright: the kit's `rule`. */
function line(
  ctx: Ctx,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  colour: string,
  alpha = 1,
  width = 1,
  dash: number[] = SOLID,
): void {
  const level = y1 === y2 && width === 1
  const upright = x1 === x2 && width === 1
  ctx.beginPath()
  ctx.moveTo(upright ? crisp(x1) : x1, level ? crisp(y1) : y1)
  ctx.lineTo(upright ? crisp(x2) : x2, level ? crisp(y2) : y2)
  ctx.globalAlpha = alpha
  ctx.strokeStyle = colour
  ctx.lineWidth = width
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  if (dash !== SOLID) ctx.setLineDash(dash)
  ctx.stroke()
  if (dash !== SOLID) ctx.setLineDash(SOLID)
  ctx.globalAlpha = 1
}

/** A filled rectangle. */
function bar(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  colour: string,
  alpha = 1,
): void {
  if (w <= 0 || h <= 0) return
  ctx.globalAlpha = alpha
  ctx.fillStyle = colour
  ctx.fillRect(x, y, w, h)
  ctx.globalAlpha = 1
}

/** A filled dot; with `ring`, a line of that colour around it so it stands off a trace. */
function spot(ctx: Ctx, x: number, y: number, radius: number, colour: string, ring = ''): void {
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fillStyle = colour
  ctx.fill()
  if (ring) {
    ctx.strokeStyle = ring
    ctx.lineWidth = 1
    ctx.stroke()
  }
}

/** Keep what is drawn from here inside a rectangle, until `ctx.restore()`. */
function clipTo(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
}

const HOT = { hot: true } as const
const COLD = { hot: false } as const
/** A handle as the kit draws it. */
const knob = (frame: Paint, x: number, y: number, hot: boolean): void =>
  handle(frame, x, y, hot ? HOT : COLD)

const LEFT: TextStyle = {}
const RIGHT: TextStyle = { align: 'right' }

const GRID_HZ = [100, 1000, 10000]
const GRID_FINE_HZ = [50, 200, 500, 2000, 5000]

/** Upright lines at 100 Hz, 1 kHz and 10 kHz, and fainter ones between where there is room: the kit's `freqGrid`. */
function grid(frame: Paint, box: Box): void {
  const { ctx, colours } = frame
  const foot = box.y + box.h
  for (const hz of GRID_HZ) {
    const x = xOfHz(hz, box)
    line(ctx, x, box.y, x, foot, colours.ink, INK.grid)
  }
  if (box.w < 150) return
  for (const hz of GRID_FINE_HZ) {
    const x = xOfHz(hz, box)
    line(ctx, x, box.y, x, foot, colours.ink, INK.grid * 0.55)
  }
}

// --- What is kept between frames ---------------------------------------------

/** The numbers something was made from; nothing has been made from a new one. */
const newKey = (): Float64Array => new Float64Array(12).fill(NaN)

/**
 * Whether any of up to twelve numbers differs from the ones seen last, which
 * it then takes their place: what a curve is made from, so it is made again
 * only when one of them moves.
 */
function stale(
  seen: Float64Array,
  a: number,
  b = 0,
  c = 0,
  d = 0,
  e = 0,
  f = 0,
  g = 0,
  h = 0,
  i = 0,
  j = 0,
  k = 0,
  l = 0,
): boolean {
  if (
    seen[0] === a &&
    seen[1] === b &&
    seen[2] === c &&
    seen[3] === d &&
    seen[4] === e &&
    seen[5] === f &&
    seen[6] === g &&
    seen[7] === h &&
    seen[8] === i &&
    seen[9] === j &&
    seen[10] === k &&
    seen[11] === l
  )
    return false
  seen[0] = a
  seen[1] = b
  seen[2] = c
  seen[3] = d
  seen[4] = e
  seen[5] = f
  seen[6] = g
  seen[7] = h
  seen[8] = i
  seen[9] = j
  seen[10] = k
  seen[11] = l
  return true
}

/**
 * A curve across a box, one value in dB for every second pixel, with its
 * highest value and where that is (a share of the way across), and the
 * points it is drawn through.
 */
interface Curve {
  db: Float32Array
  peakDb: number
  peakAt: number
  path: Path
}

const newCurve = (): Curve => ({
  db: new Float32Array(0),
  peakDb: SILENT_DB,
  peakAt: 0,
  path: newPath(),
})

/** How many values a curve across `box` has. */
const curveLength = (box: Box): number => Math.max(2, Math.floor(box.w / 2) + 1)

/** Work a curve out: `db` at the frequency of each of its columns. */
function fillCurve(
  curve: Curve,
  box: Box,
  db: (hz: number, index: number) => number,
  minHz?: number,
  maxHz?: number,
): Curve {
  const length = curveLength(box)
  if (curve.db.length !== length) curve.db = new Float32Array(length)
  let best = 0
  for (let i = 0; i < length; i++) {
    const value = db(hzOfX(box.x + Math.min(box.w, i * 2), box, minHz, maxHz), i)
    curve.db[i] = Number.isFinite(value) ? value : SILENT_DB
    if (curve.db[i] > curve.db[best]) best = i
  }
  curve.peakDb = curve.db[best]
  curve.peakAt = best / Math.max(1, length - 1)
  return curve
}

/** A curve's points in a box on a scale of dB, moved by `shiftDb`; they stay within a few pixels of the box. They are the curve's own and hold until it is asked again. */
function curvePath(curve: Curve, box: Box, topDb: number, footDb: number, shiftDb = 0): Path {
  const length = curve.db.length
  const path = sized(curve.path, length)
  const low = box.y - 4
  const high = box.y + box.h + 4
  const scale = box.h / (topDb - footDb)
  for (let i = 0; i < length; i++) {
    path.x[i] = box.x + Math.min(box.w, i * 2)
    path.y[i] = clamp(box.y + (topDb - curve.db[i] - shiftDb) * scale, low, high)
  }
  return path
}

// --- The parts the family shares --------------------------------------------

/**
 * The noise the medium adds, on the spectrum's scale. The curve moved by
 * `setDb` is where the controls put it: a line. `live` is how far it is up
 * now (a gain, 1 for all of it): the band under the line, filled while it
 * sounds.
 */
function drawFloor(frame: Paint, box: Box, curve: Curve, live: number | null, setDb = 0): void {
  const { ctx, colours } = frame
  const foot = box.y + box.h
  if (setDb <= SILENT_DB / 2) return
  if (live !== null && live > 1e-3) {
    const liveDb = db20(live)
    const path = curvePath(curve, box, TOP_DB, FOOT_DB, setDb + liveDb)
    fillUnder(ctx, path, foot + 4, colours.accent, 0.45)
    strokePath(ctx, path, colours.accent, 1.25)
    if (Math.abs(liveDb) < 0.5) return
  }
  strokePath(
    ctx,
    curvePath(curve, box, TOP_DB, FOOT_DB, setDb),
    colours.accent,
    1,
    live === null ? 1 : INK.back,
    DASHED,
  )
}

/** A steady tone the medium adds (a hum's harmonic, an idle tone): a line at `x` from the foot up to its level. */
function drawTone(frame: Paint, box: Box, x: number, db: number, alpha = 1): void {
  if (db <= FOOT_DB) return
  const y = Math.max(box.y, yOfDb(db, box, TOP_DB, FOOT_DB))
  line(frame.ctx, x, box.y + box.h, x, y, frame.colours.accent, alpha)
}

/**
 * A row of harmonics the medium adds (mains hum), as it is kept: where each
 * stands across the box, its level and the level of the band's edge over it
 * (the stronger of it and its neighbours) in dB against an amplitude of 1,
 * and from which harmonic on they stand too close for lines.
 */
interface Comb {
  x: Float64Array
  db: Float32Array
  edgeDb: Float32Array
  count: number
  crowded: number
  path: Path
}

const newComb = (): Comb => ({
  x: new Float64Array(0),
  db: new Float32Array(0),
  edgeDb: new Float32Array(0),
  count: 0,
  crowded: 0,
  path: newPath(),
})

/** Lay a comb out: `amps` holds harmonic 1 of `baseHz` first. */
function fillComb(comb: Comb, box: Box, amps: readonly number[], baseHz: number): void {
  const count = amps.length
  if (comb.x.length !== count) {
    comb.x = new Float64Array(count)
    comb.db = new Float32Array(count)
    comb.edgeDb = new Float32Array(count)
  }
  comb.count = count
  comb.crowded = count
  for (let n = 0; n < count; n++) {
    const hz = baseHz * (n + 1)
    comb.x[n] = hz > 20 && hz < 20000 ? xOfHz(hz, box) : NaN
    comb.db[n] = db20(amps[n])
    // The band's edge runs over the stronger harmonics, not down into each weaker one between.
    comb.edgeDb[n] = db20(Math.max(amps[n], amps[n - 1] ?? 0, amps[n + 1] ?? 0))
  }
  for (let n = 1; n < count; n++) {
    if (comb.x[n] - comb.x[n - 1] < 3) {
      comb.crowded = n
      break
    }
  }
}

/** Draw a comb: each harmonic a line where there is room for lines, and where they crowd, the band they fill. `baseDb` is the level of an amplitude of 1. */
function drawComb(frame: Paint, box: Box, comb: Comb, baseDb: number, alpha = 1): void {
  const foot = box.y + box.h
  for (let n = 0; n < comb.crowded; n++)
    if (!Number.isNaN(comb.x[n])) drawTone(frame, box, comb.x[n], baseDb + comb.db[n], alpha)
  const path = sized(comb.path, comb.count)
  let count = 0
  for (let n = comb.crowded; n < comb.count; n++) {
    const db = baseDb + comb.edgeDb[n]
    if (Number.isNaN(comb.x[n]) || db <= FOOT_DB) continue
    path.x[count] = comb.x[n]
    path.y[count] = Math.max(box.y, yOfDb(db, box, TOP_DB, FOOT_DB))
    count += 1
  }
  path.n = count
  if (count < 2) return
  fillUnder(frame.ctx, path, foot + 4, frame.colours.accent, 0.45 * alpha)
  strokePath(frame.ctx, path, frame.colours.accent, 1.25, alpha)
}

/**
 * Which bins of the analyser fall in each column of a box, as the kit's
 * `spectrum` reads them: one point per two pixels, the loudest bin in the
 * column, and low down, where a bin is wider than a column, a reading
 * between two bins. Worked out once for a box and a spectrum, not for every
 * frame.
 */
interface Columns {
  made: Float64Array
  first: Int32Array
  last: Int32Array
  /** Where between two bins a narrow column reads; −1 where it takes the loudest of several. */
  between: Float32Array
  path: Path
}

const newColumns = (): Columns => ({
  made: newKey(),
  first: new Int32Array(0),
  last: new Int32Array(0),
  between: new Float32Array(0),
  path: newPath(),
})

/**
 * The spectrum of what comes out as points across a box, on the family's
 * scale; false when there is none or it is all under the foot.
 */
function spectrumPath(frame: Pick<DisplayFrame, 'signal'>, box: Box, columns: Columns): boolean {
  const bins = frame.signal?.spectrum
  const binHz = frame.signal?.binHz ?? 0
  if (!bins || binHz <= 0) return false
  const count = Math.max(2, Math.floor(box.w / 2))
  if (stale(columns.made, box.x, box.w, binHz, bins.length)) {
    if (columns.first.length !== count + 1) {
      columns.first = new Int32Array(count + 1)
      columns.last = new Int32Array(count + 1)
      columns.between = new Float32Array(count + 1)
    }
    const top = bins.length - 1
    for (let c = 0; c <= count; c++) {
      const from = hzOfX(box.x + ((c - 0.5) / count) * box.w, box)
      const to = hzOfX(box.x + ((c + 0.5) / count) * box.w, box)
      if (to - from < binHz) {
        columns.between[c] = clamp((from + to) / 2 / binHz, 1, top)
        columns.first[c] = columns.last[c] = 0
      } else {
        columns.between[c] = -1
        columns.first[c] = clamp(Math.ceil(from / binHz), 1, top)
        columns.last[c] = clamp(Math.floor(to / binHz), columns.first[c], top)
      }
    }
  }
  const path = sized(columns.path, count + 1)
  const foot = box.y + box.h
  const scale = box.h / (TOP_DB - FOOT_DB)
  let any = false
  for (let c = 0; c <= count; c++) {
    let db = -Infinity
    const at = columns.between[c]
    if (at >= 0) {
      const below = Math.floor(at)
      const above = Math.min(bins.length - 1, below + 1)
      db = bins[below] + (bins[above] - bins[below]) * (at - below)
    } else {
      const last = columns.last[c]
      for (let i = columns.first[c]; i <= last; i++) if (bins[i] > db) db = bins[i]
    }
    if (!(db > FOOT_DB)) db = FOOT_DB
    else any = true
    path.x[c] = box.x + (c / count) * box.w
    path.y[c] = clamp(box.y + (TOP_DB - db) * scale, box.y, foot)
  }
  return any
}

/** The spectrum of what comes out, behind everything: the sound itself, in the ink. */
function drawSpectrum(
  frame: Paint & Pick<DisplayFrame, 'signal'>,
  box: Box,
  columns: Columns,
): void {
  if (spectrumPath(frame, box, columns))
    fillUnder(frame.ctx, columns.path, box.y + box.h, frame.colours.ink, 0.42)
}

/**
 * How many things happened in each slot of the last so many seconds: a
 * `History` that adds up what it is given, for events counted by the device
 * (ticks, pops, dropouts) and drawn where they fell.
 */
export class Tally {
  private readonly counts: Float32Array
  private head = 0
  private lastSlot: number | null = null

  constructor(
    readonly seconds: number,
    readonly slots: number,
  ) {
    this.counts = new Float32Array(slots)
  }

  /** Add `count` events at `now` (seconds); 0 only moves the clock on. */
  push(now: number, count: number): void {
    const slot = Math.floor((now / this.seconds) * this.slots)
    if (this.lastSlot !== null && slot > this.lastSlot) {
      const steps = Math.min(this.slots, slot - this.lastSlot)
      for (let i = 0; i < steps; i++) {
        this.counts[this.head] = 0
        this.head = (this.head + 1) % this.slots
      }
    }
    this.lastSlot = this.lastSlot === null ? slot : Math.max(slot, this.lastSlot)
    this.counts[(this.head + this.slots - 1) % this.slots] += count
  }

  /** The count `back` slots ago: 0 is the newest. */
  at(back: number): number {
    return this.counts[(this.head + this.slots * 2 - 1 - back) % this.slots]
  }

  /** Where the slot `back` slots ago stands across a box whose right edge is now. */
  x(back: number, box: Box): number {
    return box.x + box.w - (back / (this.slots - 1)) * box.w
  }
}

// The device's counters wrap at 2^20.
const COUNTER_WRAP = 1048576
/** After a rest, readings are not news for this long: the first of them is still on its way (they come 30 times a second). */
const COUNTER_SETTLE_SEC = 0.25
/** Frames further apart than this were not one run of frames: the page was hidden between them. */
const COUNTER_GAP_SEC = 0.5
/** More than this in one frame is not a count of events: the device began again from nothing. */
const COUNTER_MOST = 4096

/**
 * How many more of something a device has counted since the frame before:
 * its ticks, its pops, its dropouts. A count is news only from one running
 * frame to the next. While the display is off the screen its readings stop
 * and read 0, and what the device counted meanwhile is not shown as a burst
 * when it comes back: after a rest (`rest()`), a gap between frames, or the
 * first frame of all, the readings only set the mark again for a quarter of
 * a second.
 */
export class Counter {
  private seen = 0
  private last = Number.NEGATIVE_INFINITY
  private from = Number.POSITIVE_INFINITY
  /** Whether the reading before this one could be counted from: false while the mark is being set again. */
  steady = false

  /** The display is not running: whatever is read next is not news. */
  rest(): void {
    this.from = Number.POSITIVE_INFINITY
    this.steady = false
  }

  /** How many more there are in `reading`, taken at `now` (seconds). */
  more(reading: number, now: number): number {
    const gap = now - this.last
    this.last = now
    if (this.from === Number.POSITIVE_INFINITY || gap > COUNTER_GAP_SEC || gap < 0)
      this.from = now + COUNTER_SETTLE_SEC
    let more = reading - this.seen
    this.seen = reading
    this.steady = now >= this.from
    if (!this.steady) return 0
    if (more < 0) more += COUNTER_WRAP
    return more <= COUNTER_MOST ? more : 0
  }
}

/** A window in two: the band across frequency above, the last seconds in a strip under it. */
interface TwoBoxes {
  band: Box
  past: Box
}

interface Layout extends TwoBoxes {
  made: Float64Array
}

const newLayout = (): Layout => ({
  made: newKey(),
  band: { x: 0, y: 0, w: 0, h: 0 },
  past: { x: 0, y: 0, w: 0, h: 0 },
})

/** The two boxes of a window of a size, worked out again only when the size changes. */
function layout(kept: Layout, view: Size, stripHeight = 26): Layout {
  if (!stale(kept.made, view.width, view.height, stripHeight)) return kept
  const w = view.width - 8
  const h = view.height - 8
  const strip = Math.min(stripHeight, Math.round(h * 0.45))
  kept.band.x = kept.past.x = 4
  kept.band.w = kept.past.w = w
  kept.band.y = 4
  kept.band.h = h - strip - 4
  kept.past.y = 4 + h - strip
  kept.past.h = strip
  return kept
}

/** The same for a handle asked for outside a frame, where nothing is kept. */
const twoBoxes = (view: Size, stripHeight = 26): TwoBoxes => layout(newLayout(), view, stripHeight)

/** The line between the two parts of a window. */
function divide(frame: Paint, boxes: TwoBoxes): void {
  const y = boxes.past.y - 2
  line(frame.ctx, 1, y, boxes.band.x + boxes.band.w + 3, y, frame.colours.ink, INK.grid)
}

// --- The medium's curve -----------------------------------------------------

/** The scale a medium's response is drawn on: a little over unchanged at the top, well down at the foot. */
const CURVE_TOP_DB = 12
const CURVE_FOOT_DB = -36

/** The line where the medium leaves a frequency as it was. */
function drawUnchanged(frame: Paint, box: Box): void {
  const y = yOfDb(0, box, CURVE_TOP_DB, CURVE_FOOT_DB)
  line(frame.ctx, box.x, y, box.x + box.w, y, frame.colours.ink, INK.grid)
}

/** The medium's response: a line in the ink, the main thing read. */
function drawResponse(frame: Paint, box: Box, curve: Curve): void {
  strokePath(frame.ctx, curvePath(curve, box, CURVE_TOP_DB, CURVE_FOOT_DB), frame.colours.ink)
}

/**
 * Where a hand takes a handle along the one way it goes, from `low` to `high`
 * on the picture, or NaN where the hand leaves it be: within half a pixel of
 * where it stands (a press that takes it moves nothing, however its place was
 * clamped), and past an end it already stands at (what it stands for lies
 * further out than the picture goes, and stays there). The other way is not
 * looked at: a hand that drifts across a handle that goes up and down moves
 * nothing.
 */
function handTo(hand: number, standing: number, low: number, high: number): number {
  if (hand < low) return standing <= low + 1e-6 ? Number.NaN : low
  if (hand > high) return standing >= high - 1e-6 ? Number.NaN : high
  return Math.abs(hand - standing) > 0.5 ? hand : Number.NaN
}

/**
 * A point whose setting lies where the picture does not reach is drawn at the
 * picture's edge. A hand that takes it there moves the setting from where it
 * really lies: as far past the hand as it lay when it was taken, so nothing
 * jumps and the end of the range is as far off as it truly is. The plate asks
 * for a display's handles again on every move, and an answer knows only where
 * the point stands now, so how far past it lay at the press is kept in the
 * hold the plate hands to every `drag` of one hand.
 *
 * What a hand at `hand` sets the point to, along the one way the point goes.
 * `standing` is where the point is drawn for `setting`, `placeOf` where a
 * setting lies on a scale that runs on past the picture, and `settingAt` the
 * setting at a place on it, held to its range. A hand that has not moved the
 * place gets the setting back as it was. The other way is not looked at: a
 * hand that drifts across a handle that goes up and down moves nothing.
 */
function carried(
  hold: DisplayHold | undefined,
  setting: number,
  hand: number,
  standing: number,
  placeOf: (setting: number) => number,
  settingAt: (place: number) => number,
): number {
  const lies = placeOf(setting)
  // Asked without a hold (not by a plate), the point is taken where it lies at every call.
  const kept = hold ?? {}
  kept.past ??= lies - standing
  const to = hand + kept.past
  return Math.abs(to - lies) < 1e-9 ? setting : settingAt(to)
}

/** As the kit's `xOfHz` and `hzOfX`, but on past the picture's two ends: where a frequency lies, not where it is drawn. */
const placeOfHz = (hz: number, box: Box): number =>
  box.x + (Math.log(Math.max(hz, 1e-3) / 20) / Math.log(1000)) * box.w
const hzOfPlace = (x: number, box: Box): number => 20 * Math.pow(1000, (x - box.x) / box.w)

/**
 * What a control from 0 to 1 that is raised to a power does to a level, in
 * dB: squared, it moves the level 40 dB for a tenfold turn.
 */
const amountDb = (amount: number, perTenfold = 40): number =>
  amount > 1e-4 ? perTenfold * Math.log10(amount) : SILENT_DB

/** Where the handle of a noise floor stands for such a control: across, on the floor's highest point. */
const floorHandleX = (band: Box, full: Curve): number =>
  clamp(band.x + full.peakAt * band.w, band.x + 4, band.x + band.w - 4)
/** And up: the floor's highest point with the control at 1, moved by what the control does to the level and by `shiftDb`. */
const floorHandleY = (
  band: Box,
  full: Curve,
  amount: number,
  perTenfold = 40,
  shiftDb = 0,
): number =>
  clamp(
    yOfDb(full.peakDb + shiftDb + amountDb(amount, perTenfold), band, TOP_DB, FOOT_DB),
    band.y,
    band.y + band.h,
  )

/**
 * A handle on the highest point of a noise floor, for such a control. The
 * curve is the floor with the control at 1, `shiftDb` what else moves all of
 * it; up and down sets the control.
 */
function floorHandle(
  view: DisplayView,
  band: Box,
  full: Curve,
  param: string,
  name: string,
  perTenfold = 40,
  shiftDb = 0,
): DisplayHandle {
  const top = full.peakDb + shiftDb
  const perPixel = (TOP_DB - FOOT_DB) / band.h
  // On a scale of dB nothing lies endlessly far down. From the foot of the
  // picture (or from the control at 1, where that is lower still) the control
  // runs on straight at the pace it has there, and is at nothing some ten
  // pixels further on.
  const edge = Math.min(1, Math.pow(10, (FOOT_DB - top) / perTenfold))
  const edgeY = yOfDb(top + perTenfold * Math.log10(edge), band, TOP_DB, FOOT_DB)
  const run = perTenfold / (Math.LN10 * perPixel)
  const placeOf = (amount: number): number =>
    amount >= edge
      ? yOfDb(top + perTenfold * Math.log10(amount), band, TOP_DB, FOOT_DB)
      : edgeY + (1 - amount / edge) * run
  const settingAt = (y: number): number =>
    clamp(
      y <= edgeY
        ? Math.pow(10, (dbOfY(y, band, TOP_DB, FOOT_DB) - top) / perTenfold)
        : edge * (1 - (y - edgeY) / run),
      0,
      1,
    )
  const point: DisplayHandle = {
    key: param,
    name,
    x: floorHandleX(band, full),
    y: floorHandleY(band, full, view.value(param), perTenfold, shiftDb),
    drag: (_x, y, hold) => ({
      [param]: carried(hold, view.value(param), y, point.y, placeOf, settingAt),
    }),
    reset: () => ({ [param]: view.spec(param)?.default ?? 0.25 }),
  }
  return point
}

// --- Pitch ------------------------------------------------------------------

/** How much of the past a pitch trace keeps, and in how many steps. */
const PITCH_SEC = 3
const PITCH_SLOTS = 150
/** The deviation at the edge of a pitch strip, per cent. */
const PITCH_FULL = 3
/** Room at the left of a pitch strip for the number. */
const PITCH_LABEL = 38

/**
 * Where a pitch deviation (per cent) stands in a strip. The scale is the
 * square root of the deviation, so the tenth of a per cent of a good
 * transport shows and the three per cent of a warped record fits; the knobs
 * that set it are squared in the same way.
 */
function pitchY(percent: number, box: Box): number {
  const share = Math.sqrt(Math.min(1, Math.abs(percent) / PITCH_FULL))
  return box.y + box.h / 2 - Math.sign(percent) * share * (box.h / 2 - 1)
}

interface PitchState {
  pitch: History
  flutter: PhaseTrack | null
  wow: number
  /** Dropouts as the device counted them, and how deep the deepest in each slot was. */
  drops: Tally
  dropDepth: History
  dropped: Counter
  path: Path
}

const newPitch = (seconds = PITCH_SEC, slots = PITCH_SLOTS): PitchState => ({
  pitch: new History(seconds, slots, 0),
  flutter: null,
  wow: 0,
  drops: new Tally(seconds, slots),
  dropDepth: new History(seconds, slots, 0, 'max'),
  dropped: new Counter(),
  path: newPath(slots),
})

/**
 * Add a frame to a pitch trace from what a transport reports: the pitch its
 * wow has it at (per cent), and its flutter as a phase and a depth. The
 * flutter turns several times between two readings, so the steps between are
 * filled in along its sine, which is the device's own:
 * delay = depth · sin(2π·phase), and pitch is how fast the delay shrinks.
 */
function pushWobble(
  state: PitchState,
  frame: Pick<DisplayFrame, 'now' | 'dt'>,
  wow: number,
  flutterPhase: number,
  flutterDepth: number,
  flutterHz: number,
): void {
  const before = state.flutter?.phase ?? flutterPhase
  state.flutter = trackPhase(state.flutter, flutterPhase, flutterHz, frame.dt)
  const expected = flutterHz * frame.dt
  let turned = state.flutter.phase - before
  turned -= Math.round(turned - expected)
  const steps = clamp(Math.ceil(frame.dt / (state.pitch.seconds / state.pitch.slots)), 1, 24)
  for (let k = 1; k <= steps; k++) {
    const t = k / steps
    const phase = before + turned * t
    state.pitch.push(
      frame.now - frame.dt * (1 - t),
      state.wow + (wow - state.wow) * t - flutterDepth * Math.cos(2 * Math.PI * phase),
    )
  }
  state.wow = wow
}

/**
 * The transport is not turning (the device sleeps once its sound has gone,
 * and its readings then stand where they stopped): true pitch, and nothing
 * moves.
 */
function pushStill(state: PitchState, now: number): void {
  state.pitch.push(now, 0)
  state.wow = 0
  state.flutter = null
}

/** Note the dropouts a device has counted since the last frame. */
function pushDrops(state: PitchState, now: number, counter: number, depth: number): void {
  const more = state.dropped.more(counter, now)
  state.drops.push(now, more)
  state.dropDepth.push(now, more > 0 ? depth : 0)
}

const newBox = (): Box => ({ x: 0, y: 0, w: 0, h: 0 })

/** Set a kept box. */
function setBox(box: Box, x: number, y: number, w: number, h: number): Box {
  box.x = x
  box.y = y
  box.w = w
  box.h = h
  return box
}

/** The part of a pitch strip the trace runs in: the number has the left end. */
const pitchBox = (kept: Box, whole: Box): Box =>
  setBox(kept, whole.x + PITCH_LABEL, whole.y, whole.w - PITCH_LABEL - 2, whole.h)

/** A number said once and kept until it changes: the words at the left end of a strip. */
interface Said {
  value: number
  words: string
}
const newSaid = (): Said => ({ value: NaN, words: '' })

/** A pitch deviation as it is said: "±0.25%". */
const reachText = (percent: number): string =>
  `±${percent >= 0.995 ? percent.toFixed(1) : percent.toFixed(2)}%`

function drawReach(frame: DisplayFrame, said: Said, x: number, y: number, reach: number): void {
  if (said.value !== reach) {
    said.value = reach
    said.words = reachText(reach)
  }
  text(frame, said.words, x, y, LEFT)
}

/** The ground of a pitch trace: true pitch along the middle, and the furthest the settings let it go as two dashed lines. */
function drawPitchLines(frame: Paint, box: Box, reach: number): void {
  const { ctx, colours } = frame
  const middle = box.y + box.h / 2
  line(ctx, box.x, middle, box.x + box.w, middle, colours.ink, INK.grid)
  if (reach <= 0.004) return
  const over = pitchY(reach, box)
  const under = pitchY(-reach, box)
  line(ctx, box.x, over, box.x + box.w, over, colours.ink, INK.rule, 1, DOTTED)
  line(ctx, box.x, under, box.x + box.w, under, colours.ink, INK.rule, 1, DOTTED)
}

/** A history as points across a box, oldest at the left and now at the right edge: a pitch on the strip's scale. */
function pitchPath(path: Path, box: Box, past: History): Path {
  const slots = past.slots
  sized(path, slots)
  for (let i = 0; i < slots; i++) {
    path.x[i] = box.x + (i / (slots - 1)) * box.w
    path.y[i] = pitchY(past.at(slots - 1 - i), box)
  }
  return path
}

/** The same for a level in dB, kept inside the scale. */
function levelPath(path: Path, box: Box, past: History, topDb: number, footDb: number): Path {
  const slots = past.slots
  sized(path, slots)
  for (let i = 0; i < slots; i++) {
    path.x[i] = box.x + (i / (slots - 1)) * box.w
    path.y[i] = yOfDb(clamp(past.at(slots - 1 - i), footDb, topDb), box, topDb, footDb)
  }
  return path
}

/** A trace of the last seconds, running to the left of now at the right edge, with a dot on now. */
function drawPast(frame: Paint, box: Box, path: Path): void {
  const { ctx, colours } = frame
  clipTo(ctx, box.x, box.y - 1, box.w + 3, box.h + 2)
  strokePath(ctx, path, colours.ink, 1.25)
  const now = path.n - 1
  if (now >= 0) spot(ctx, path.x[now], path.y[now], 2, colours.accent, colours.ink)
  ctx.restore()
}

/** Dropouts where they fell: each hangs from the top of the strip, longer the deeper it was. */
function drawDrops(frame: Paint, box: Box, state: PitchState): void {
  const slots = state.drops.slots
  for (let back = 0; back < slots; back++) {
    if (state.drops.at(back) <= 0) continue
    const x = state.drops.x(back, box)
    const length = 2 + state.dropDepth.at(back) * (box.h * 0.5)
    line(frame.ctx, x, box.y, x, box.y + length, frame.colours.accent, 1, 1.5)
  }
}

// --- Tape -------------------------------------------------------------------

// `tape.h`, per speed: 15 ips, 7.5 ips, 3.75 ips, Cassette.
const TAPE_FLUTTER_HZ = [9.5, 8, 6.5, 5.5]
const TAPE_BUMP_HZ = [60, 70, 85, 100]
const TAPE_BAND_HZ = [18000, 13000, 8000, 5500]
const TAPE_HISS_DB = [0, 3, 6, 9]

const tapeSpeed = (view: DisplayView): number => clamp(Math.round(view.value('speed')), 0, 3)

/** Where the playback roll-off stands: the speed's bandwidth, an octave either way by Tone, up to an octave off by Age. */
export function tapeCutoffHz(view: DisplayView, sampleRate: number): number {
  const bandwidth =
    TAPE_BAND_HZ[tapeSpeed(view)] * Math.pow(2, 2 * view.value('tone') - 1 - view.value('age'))
  return clamp(bandwidth, 300, 0.45 * sampleRate)
}

/** Tape's playback chain as `control()` sets it: the low cut under the head bump, the bump, the roll-off. */
function tapePlayback(view: DisplayView, sampleRate: number): Biquad[] {
  const bumpHz = TAPE_BUMP_HZ[tapeSpeed(view)]
  return [
    biquad('highpass', 0.4 * bumpHz, 0.6, 0, sampleRate),
    biquad('peaking', bumpHz, 1.2, 5 * view.value('bump'), sampleRate),
    biquad('lowpass', tapeCutoffHz(view, sampleRate), Math.SQRT1_2, 0, sampleRate),
  ]
}

/**
 * What Tape's playback side does to a tone at a frequency, in dB: the
 * playback chain and Output. A tone at the level the record stage's make-up
 * holds (−12 dBFS) comes out with exactly this; `tapeKeptDb` says what a
 * louder or a quieter one gets on top.
 */
export function tapeResponseDb(view: DisplayView, hz: number, sampleRate: number): number {
  return chainDb(tapePlayback(view, sampleRate), hz, sampleRate) + view.value('output')
}

/** How much `record()` boosts a frequency before its curve (and cuts it after): 1 + k above a pole at 3.5 kHz, at twice the rate. */
function tapeEmphasis(age: number, hz: number, sampleRate: number): number {
  const k = 2 + 1.5 * age
  const alpha = 1 - Math.exp((-2 * Math.PI * 3500) / (2 * sampleRate))
  const w = (2 * Math.PI * hz) / (2 * sampleRate)
  const low = cdiv(cx(alpha), cx(1 - (1 - alpha) * Math.cos(w), (1 - alpha) * Math.sin(w)))
  return Math.sqrt(power(cadd(cx(1 + k), cscale(low, -k))))
}

/** The gain of a tone that swings `swing` through the curve u / √(1 + u²) about a bias: the first term of what comes out, over what went in. */
function tapeThrough(bias: number, swing: number): number {
  if (swing <= 1e-4) return Math.pow(1 + bias * bias, -1.5)
  let sum = 0
  for (let i = 0; i < 16; i++) {
    const sine = Math.sin((2 * Math.PI * (i + 0.5)) / 16)
    const u = swing * sine + bias
    sum += (u / Math.sqrt(1 + u * u)) * sine
  }
  return sum / 8 / swing
}

const tapeGain = (drive: number): number => Math.pow(2, 4 * drive - 1)
const tapeBias = (drive: number): number => 0.05 + 0.25 * drive
/** The make-up after the curve: a tone at −12 dBFS comes out as it went in. */
const tapeMakeUp = (drive: number): number =>
  Math.sqrt(1 + 0.0625 * tapeGain(drive) ** 2) * Math.pow(1 + tapeBias(drive) ** 2, 1.5)

/**
 * What Tape's record stage leaves of a tone of amplitude `level` at `hz`,
 * in dB against a tone at the level the make-up holds (−12 dBFS, low down).
 * `record()` boosts the highs by 1 + k before the curve u / √(1 + u²) (about
 * a bias) and cuts them by the same after it, so a loud tone loses its
 * treble first; this is the gain of the tone itself through that curve.
 */
export function tapeKeptDb(
  drive: number,
  age: number,
  level: number,
  hz: number,
  sampleRate: number,
): number {
  const swing = level * tapeGain(drive) * tapeEmphasis(age, hz, sampleRate)
  return db20(tapeThrough(tapeBias(drive), swing) * tapeMakeUp(drive))
}

/** Tape's hiss at Hiss 1 before the playback chain, as the spectrum shows it: white noise tilted up above 1.5 kHz. */
function tapeHissRawDb(speed: number, hz: number, sampleRate: number, binHz: number): number {
  const peak = 0.0229 * fromDb(TAPE_HISS_DB[speed])
  const tilt = power(cadd(cx(1), cscale(onePole(hz, 1500, sampleRate), -0.7)))
  return noiseBinDb(((peak * peak) / 3) * tilt * SIDES_APART, sampleRate, binHz)
}

/** Tape's hiss at Hiss 1 as the spectrum shows it: white noise tilted up above 1.5 kHz, through the playback chain. */
export function tapeHissDb(
  view: DisplayView,
  hz: number,
  sampleRate: number,
  binHz: number,
): number {
  return (
    tapeHissRawDb(tapeSpeed(view), hz, sampleRate, binHz) + tapeResponseDb(view, hz, sampleRate)
  )
}

/** The furthest Tape's wow and flutter take the pitch at these settings, per cent: ±0.8 and ±0.3 at full, half again by Age. */
function tapeReach(view: DisplayView): number {
  const worn = 1 + 0.5 * view.value('age')
  return (0.8 * view.value('wow') + 0.3 * view.value('flutter')) * worn
}

/** The swings the record stage's gain is kept for between frames: 2^−10 to 2^6, eight to the octave. */
const SWING_LOW = -10
const SWING_STEPS = 8
const SWING_COUNT = 16 * SWING_STEPS + 1

interface TapeState {
  boxes: Layout
  strip: Box
  made: Float64Array
  columns: Columns
  response: Curve
  loud: Curve
  kept: Curve
  floor: Curve
  /** Per column: the record stage's emphasis there. Per swing: what the curve leaves of a tone, with the make-up, in dB. */
  emphasis: Float32Array
  through: Float32Array
  /** The level the kept curve was last made for, dB; NaN before the first. */
  keptAt: number
  /** Where the two handles stand: x and y of Tone, then of Hiss. */
  spots: Float64Array
  transport: PitchState
  reach: Said
  level: number
}

/** A curve of a handle asked for outside a frame, where none is kept. */
function tapeFloor(view: DisplayView, band: Box, sampleRate: number, binHz: number): Curve {
  const playback = tapePlayback(view, sampleRate)
  const speed = tapeSpeed(view)
  const output = view.value('output')
  return fillCurve(
    newCurve(),
    band,
    (hz) =>
      tapeHissRawDb(speed, hz, sampleRate, binHz) + chainDb(playback, hz, sampleRate) + output,
  )
}

function tapeHandles(view: DisplayView, floor: Curve | null): DisplayHandle[] {
  const { band } = twoBoxes(view, 30)
  const sampleRate = 48000
  const cutoff = tapeCutoffHz(view, sampleRate)
  const speed = tapeSpeed(view)
  const age = view.value('age')
  const tone: DisplayHandle = {
    key: 'tone',
    name: 'Tone',
    x: xOfHz(cutoff, band),
    y: clamp(
      yOfDb(tapeResponseDb(view, cutoff, sampleRate), band, CURVE_TOP_DB, CURVE_FOOT_DB),
      band.y,
      band.y + band.h,
    ),
    // Across is where the top of the band ends: Tone moves it an octave either way.
    drag: (x, _y, hold) => ({
      tone: carried(
        hold,
        view.value('tone'),
        x,
        tone.x,
        (at) => placeOfHz(TAPE_BAND_HZ[speed] * Math.pow(2, 2 * at - 1 - age), band),
        (to) => clamp((Math.log2(hzOfPlace(to, band) / TAPE_BAND_HZ[speed]) + 1 + age) / 2, 0, 1),
      ),
    }),
    reset: () => ({ tone: view.spec('tone')?.default ?? 0.5 }),
  }
  const hiss = floorHandle(
    view,
    band,
    floor ?? tapeFloor(view, band, sampleRate, sampleRate / TAP_BINS),
    'hiss',
    'Hiss',
  )
  return [tone, hiss]
}

const tape = plateDisplay<TapeState>({
  place: 'window',
  columns: 2,
  params: ['drive', 'wow', 'flutter', 'speed', 'age', 'hiss', 'bump', 'tone', 'output'],
  live: { meters: true, signal: true, spectrum: true },
  info: 'Above, what the tape does across frequency: its response as a line over the spectrum, dashed for a tone at full level, and its hiss in the second colour. Drag the points for Tone and Hiss. Below, the pitch over three seconds: wow bends it, flutter shakes it, and a dropout hangs from the top.',
  init: () => ({
    boxes: newLayout(),
    strip: newBox(),
    made: newKey(),
    columns: newColumns(),
    response: newCurve(),
    loud: newCurve(),
    kept: newCurve(),
    floor: newCurve(),
    emphasis: new Float32Array(0),
    through: new Float32Array(SWING_COUNT),
    keptAt: NaN,
    spots: new Float64Array(4),
    transport: newPitch(),
    reach: newSaid(),
    level: 0,
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const boxes = layout(state.boxes, frame, 30)
    const { band, past } = boxes
    const sr = frame.sampleRate
    const binHz = binHzOf(frame)
    const drive = frame.value('drive')
    const age = frame.value('age')
    const hiss = frame.value('hiss')
    const running = frame.signal !== null && frame.hasMeter('flutter') && frame.dt > 0

    if (
      stale(
        state.made,
        frame.value('speed'),
        frame.value('tone'),
        age,
        frame.value('bump'),
        frame.value('output'),
        drive,
        binHz,
        sr,
        frame.width,
        frame.height,
      )
    ) {
      // The curves and what they are made from, again only when a control has moved.
      const playback = tapePlayback(frame, sr)
      const speed = tapeSpeed(frame)
      const output = frame.value('output')
      const length = curveLength(band)
      if (state.emphasis.length !== length) state.emphasis = new Float32Array(length)
      const { response, emphasis, through } = state
      fillCurve(response, band, (hz, i) => {
        emphasis[i] = tapeEmphasis(age, hz, sr)
        return chainDb(playback, hz, sr) + output
      })
      const gain = tapeGain(drive)
      const bias = tapeBias(drive)
      const makeUp = tapeMakeUp(drive)
      for (let s = 0; s < SWING_COUNT; s++)
        through[s] = db20(tapeThrough(bias, Math.pow(2, SWING_LOW + s / SWING_STEPS)) * makeUp)
      fillCurve(
        state.loud,
        band,
        (_hz, i) => response.db[i] + db20(tapeThrough(bias, gain * emphasis[i]) * makeUp),
      )
      fillCurve(state.floor, band, (hz, i) => tapeHissRawDb(speed, hz, sr, binHz) + response.db[i])
      state.keptAt = NaN
      const tone = tapeHandles(frame, state.floor)[0]
      state.spots[0] = tone.x
      state.spots[1] = tone.y
      state.spots[2] = floorHandleX(band, state.floor)
    }
    state.spots[3] = floorHandleY(band, state.floor, hiss)
    // How loud the sound going in is now, held a moment so the eye can follow it.
    if (frame.signal) {
      const peak = (frame.signal.input ?? frame.signal.output).peak
      state.level = Math.max(peak, state.level * Math.exp(-frame.dt / 0.25))
    }
    // The transport turns while the device is awake: its hiss is up from the first sound until a second after the last.
    const awake = running && frame.meter('hiss') > 0

    grid(frame, band)
    drawUnchanged(frame, band)
    clipTo(ctx, band.x, band.y, band.w, band.h)
    drawSpectrum(frame, band, state.columns)
    drawFloor(frame, band, state.floor, running ? frame.meter('hiss') : null, amountDb(hiss))
    if (frame.signal && state.level > 0.003) {
      // What the saturation is doing to the sound at the level it has now.
      const level = Math.round(gainToDb(state.level) * 2) / 2
      if (level !== state.keptAt) {
        state.keptAt = level
        const swing = Math.log2(fromDb(level) * tapeGain(drive))
        const { kept, response, emphasis, through } = state
        if (kept.db.length !== response.db.length) kept.db = new Float32Array(response.db.length)
        for (let i = 0; i < kept.db.length; i++) {
          const at = clamp(
            (swing + Math.log2(emphasis[i]) - SWING_LOW) * SWING_STEPS,
            0,
            SWING_COUNT - 1.001,
          )
          const below = Math.floor(at)
          kept.db[i] =
            response.db[i] + through[below] + (through[below + 1] - through[below]) * (at - below)
        }
      }
      fillBetween(
        ctx,
        curvePath(state.response, band, CURVE_TOP_DB, CURVE_FOOT_DB),
        curvePath(state.kept, band, CURVE_TOP_DB, CURVE_FOOT_DB),
        colours.accent,
        0.7,
      )
    }
    strokePath(
      ctx,
      curvePath(state.loud, band, CURVE_TOP_DB, CURVE_FOOT_DB),
      colours.ink,
      1,
      INK.back,
      DASHED,
    )
    drawResponse(frame, band, state.response)
    ctx.restore()
    knob(frame, state.spots[0], state.spots[1], frame.hot === 'tone')
    knob(frame, state.spots[2], state.spots[3], frame.hot === 'hiss')
    if (frame.hot === 'tone')
      text(frame, hzText(tapeCutoffHz(frame, sr)), band.x + 1, band.y + 8, LEFT)

    // Below: the transport.
    divide(frame, boxes)
    const transport = state.transport
    if (awake) {
      pushWobble(
        transport,
        frame,
        frame.meter('wow'),
        frame.meter('flutter'),
        frame.meter('flutterDepth'),
        TAPE_FLUTTER_HZ[tapeSpeed(frame)],
      )
      pushDrops(transport, frame.now, frame.meter('drops'), frame.meter('dropDepth'))
    } else if (running) {
      pushStill(transport, frame.now)
      pushDrops(transport, frame.now, frame.meter('drops'), 0)
    } else {
      transport.dropped.rest()
    }
    const reach = tapeReach(frame)
    drawReach(frame, state.reach, past.x, past.y + past.h / 2 + 3, reach)
    const strip = pitchBox(state.strip, past)
    drawPitchLines(frame, strip, reach)
    if (running) {
      drawDrops(frame, strip, transport)
      drawPast(frame, strip, pitchPath(transport.path, strip, transport.pitch))
    }
  },
  handles: (view) => tapeHandles(view, null),
})

// --- Vinyl ------------------------------------------------------------------

/** The strip under Vinyl's band holds three turns at 33⅓. */
const VINYL_SEC = 5.4
const VINYL_SLOTS = 160
/** The levels a click's height runs over, dBFS: the foot of the strip and its top. */
const CLICK_FOOT_DB = -62
const CLICK_TOP_DB = -6
// `vinyl.h`: the crackle stream's smallest event at Crackle 1, its largest, and how far above the floor a tick starts.
const CRACKLE_FLOOR = 2e-3
const CRACKLE_CEILING = 0.25
const TICK_RATIO = 6
const POP_CEILING = 0.2

const isShellac = (view: DisplayView): boolean => Math.round(view.value('speed')) === 2

/** The size of the crackle's smallest events at a setting, and of its largest (`crackle_floor`, `crackle_ceiling`). */
export function crackleSizes(crackle: number): { floor: number; ceiling: number } {
  const floor = CRACKLE_FLOOR * Math.sqrt(crackle)
  return {
    floor,
    ceiling: Math.max(CRACKLE_CEILING * crackle * crackle * Math.sqrt(crackle), 2 * floor),
  }
}

/** What follows the surface noise on its way out, in dB: shellac's narrow band on 78, then Tone's tilt. */
function vinylColourDb(view: DisplayView, hz: number, sampleRate: number): number {
  const tone = view.value('tone')
  let db =
    biquadDb(biquad('lowshelf', 250, 1, -3.5 * tone, sampleRate), hz, sampleRate) +
    biquadDb(biquad('highshelf', 2800, 1, 6 * tone, sampleRate), hz, sampleRate)
  if (isShellac(view)) {
    db +=
      chainDb(
        [
          biquad('highpass', 150, Math.SQRT1_2, 0, sampleRate),
          biquad('lowpass', 6000, 0.541, 0, sampleRate),
          biquad('lowpass', 6000, 1.307, 0, sampleRate),
          biquad('peaking', 1100, 0.8, 3, sampleRate),
        ],
        hz,
        sampleRate,
      ) + db20(0.89)
  }
  return db
}

/** What Wear's shelf takes off the top, in dB, at a frequency: up to 18 dB above 4.2 kHz. */
const wearShelfDb = (wear: number, hz: number, sampleRate: number): number =>
  biquadDb(biquad('highshelf', 4200, 1, -18 * wear * Math.sqrt(wear), sampleRate), hz, sampleRate)

/** What Vinyl does to a tone at a frequency, in dB: the worn top, the 78's band, Tone. */
export function vinylResponseDb(view: DisplayView, hz: number, sampleRate: number): number {
  return wearShelfDb(view.value('wear'), hz, sampleRate) + vinylColourDb(view, hz, sampleRate)
}

/** The area under pink noise high-passed at 200 Hz, per sample rate: what brings it to a power of 1. */
const pinkAreas = new Map<number, number>()
function pinkArea(sampleRate: number): number {
  let area = pinkAreas.get(sampleRate)
  if (area === undefined) {
    // ∫ |H|² / f df in steps of equal ratio, where df / f is the same for each.
    const steps = 240
    const ratio = Math.log(sampleRate / 2 / 5) / steps
    area = 0
    for (let i = 0; i < steps; i++)
      area += power(onePoleHigh(5 * Math.exp((i + 0.5) * ratio), 200, sampleRate)) * ratio
    pinkAreas.set(sampleRate, area)
  }
  return area
}

/**
 * Vinyl's surface at Surface 1 as the spectrum shows it. The hiss is pink above 200 Hz,
 * a stream to each wall, −40 dBFS at Surface 1 and 7 dB more on shellac. The
 * rumble is white noise through two poles at 38 Hz, cut under 20 Hz, mostly
 * shared by the walls: the sum of both sides keeps the shared part.
 */
export function vinylSurfaceDb(
  view: DisplayView,
  hz: number,
  sampleRate: number,
  binHz: number,
): number {
  const hiss = 0.01 * (isShellac(view) ? 2.2387 : 1)
  const pink =
    (power(onePoleHigh(hz, 200, sampleRate)) / hz) * (sampleRate / 2 / pinkArea(sampleRate))
  // `rumble_norm_`² over the 3 of uniform noise's power.
  const rumble = 0.006 ** 2 * (sampleRate / (Math.PI * 19)) * 1.5625
  const low = power(onePole(hz, 38, sampleRate))
  const variance =
    hiss * hiss * pink * SIDES_APART + rumble * low * low * power(onePoleHigh(hz, 20, sampleRate))
  return noiseBinDb(variance, sampleRate, binHz) + vinylColourDb(view, hz, sampleRate)
}

/** The frequency Wear's handle rides at: well into the shelf. */
const WEAR_HANDLE_HZ = 11000

function vinylHandles(view: DisplayView, floor: Curve | null): DisplayHandle[] {
  const { band } = twoBoxes(view, 36)
  const sampleRate = 48000
  const wear: DisplayHandle = {
    key: 'wear',
    name: 'Wear',
    x: xOfHz(WEAR_HANDLE_HZ, band),
    y: clamp(
      yOfDb(vinylResponseDb(view, WEAR_HANDLE_HZ, sampleRate), band, CURVE_TOP_DB, CURVE_FOOT_DB),
      band.y,
      band.y + band.h,
    ),
    // Down wears the record: the top of the band goes where the pointer is.
    drag: (_x, y) => {
      const to = handTo(y, wear.y, band.y, band.y + band.h)
      if (Number.isNaN(to)) return { wear: view.value('wear') }
      const wanted =
        dbOfY(to, band, CURVE_TOP_DB, CURVE_FOOT_DB) -
        vinylColourDb(view, WEAR_HANDLE_HZ, sampleRate)
      // Past either end of what Wear can do, the end itself.
      if (wanted >= wearShelfDb(0, WEAR_HANDLE_HZ, sampleRate)) return { wear: 0 }
      if (wanted <= wearShelfDb(1, WEAR_HANDLE_HZ, sampleRate)) return { wear: 1 }
      let low = 0
      let high = 1
      for (let i = 0; i < 16; i++) {
        const middle = (low + high) / 2
        if (wearShelfDb(middle, WEAR_HANDLE_HZ, sampleRate) > wanted) low = middle
        else high = middle
      }
      return { wear: (low + high) / 2 }
    },
    reset: () => ({ wear: view.spec('wear')?.default ?? 0.3 }),
  }
  const surface = floorHandle(
    view,
    band,
    floor ??
      fillCurve(newCurve(), band, (hz) =>
        vinylSurfaceDb(view, hz, sampleRate, sampleRate / TAP_BINS),
      ),
    'surface',
    'Surface',
    40,
    db20(mixOf(view)),
  )
  return [wear, surface]
}

interface VinylState {
  boxes: Layout
  strip: Box
  made: Float64Array
  columns: Columns
  response: Curve
  floor: Curve
  /** Where the two handles stand: x and y of Wear, then of Surface. */
  spots: Float64Array
  /** The sizes the settings let a click be, as places on the strip: the dust, where a tick starts, the largest tick, the largest pop. */
  sizesFor: Float64Array
  sizes: Float64Array
  pitch: History
  path: Path
  reach: Said
  /** The largest tick in each slot (linear), pops and the starts of turns where they fell. */
  ticks: History
  popped: Tally
  turned: Tally
  tickCount: Counter
  popCount: Counter
  turn: number
}

/** Where a click of a size (linear) reaches in the strip. */
const clickY = (level: number, box: Box): number =>
  yOfDb(clamp(db20(level), CLICK_FOOT_DB, CLICK_TOP_DB), box, CLICK_TOP_DB, CLICK_FOOT_DB)

const vinyl = plateDisplay<VinylState>({
  place: 'window',
  columns: 2,
  params: ['speed', 'warp', 'crackle', 'pops', 'surface', 'wear', 'tone', 'mix'],
  live: { meters: true, signal: true, spectrum: true },
  info: 'Above, what the record does across frequency: the worn top as a line over the spectrum, and the surface noise in the second colour. Drag the points for Wear and Surface. Below, the last seconds: the pitch as the warp bends it, a line at each turn, each tick at its size, and a dot for each pop.',
  init: () => ({
    boxes: newLayout(),
    strip: newBox(),
    made: newKey(),
    columns: newColumns(),
    response: newCurve(),
    floor: newCurve(),
    spots: new Float64Array(4),
    sizesFor: newKey(),
    sizes: new Float64Array(4),
    pitch: new History(VINYL_SEC, VINYL_SLOTS, 0),
    path: newPath(VINYL_SLOTS),
    reach: newSaid(),
    ticks: new History(VINYL_SEC, VINYL_SLOTS, 0, 'max'),
    popped: new Tally(VINYL_SEC, VINYL_SLOTS),
    turned: new Tally(VINYL_SEC, VINYL_SLOTS),
    tickCount: new Counter(),
    popCount: new Counter(),
    turn: 0,
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const boxes = layout(state.boxes, frame, 36)
    const { band, past } = boxes
    const sr = frame.sampleRate
    const binHz = binHzOf(frame)
    const surface = frame.value('surface')
    // What the record adds comes out as much lower as Mix turns the record down.
    const mix = mixOf(frame)
    const mixDb = db20(mix)
    const running = frame.signal !== null && frame.hasMeter('pitch') && frame.dt > 0 && mix > QUIET

    if (
      stale(
        state.made,
        Math.round(frame.value('speed')),
        frame.value('tone'),
        frame.value('wear'),
        binHz,
        sr,
        frame.width,
        frame.height,
      )
    ) {
      fillCurve(state.response, band, (hz) => vinylResponseDb(frame, hz, sr))
      fillCurve(state.floor, band, (hz) => vinylSurfaceDb(frame, hz, sr, binHz))
      const wear = vinylHandles(frame, state.floor)[0]
      state.spots[0] = wear.x
      state.spots[1] = wear.y
      state.spots[2] = floorHandleX(band, state.floor)
    }
    state.spots[3] = floorHandleY(band, state.floor, surface, 40, mixDb)

    grid(frame, band)
    drawUnchanged(frame, band)
    clipTo(ctx, band.x, band.y, band.w, band.h)
    drawSpectrum(frame, band, state.columns)
    drawFloor(
      frame,
      band,
      state.floor,
      running ? frame.meter('noise') : null,
      amountDb(surface) + mixDb,
    )
    drawResponse(frame, band, state.response)
    ctx.restore()
    knob(frame, state.spots[0], state.spots[1], frame.hot === 'wear')
    knob(frame, state.spots[2], state.spots[3], frame.hot === 'surface')

    // Below: the record turning.
    divide(frame, boxes)
    const strip = pitchBox(state.strip, past)
    const foot = past.y + past.h
    const warp = frame.value('warp')
    drawReach(frame, state.reach, past.x, past.y + past.h / 2 + 3, 3 * warp * warp)
    drawPitchLines(frame, strip, 3 * warp * warp)
    // What the settings let a click be: the crackle from its dust to its largest tick, and the largest pop.
    const crackle = frame.value('crackle')
    const pops = frame.value('pops')
    const { sizes } = state
    if (stale(state.sizesFor, crackle, pops, mix, past.y, past.h)) {
      const { floor, ceiling } = crackleSizes(crackle)
      sizes[0] = clickY(floor * mix, past)
      sizes[1] = clickY(Math.min(TICK_RATIO * floor, ceiling) * mix, past)
      sizes[2] = clickY(ceiling * mix, past)
      sizes[3] = clickY(POP_CEILING * pops * mix, past)
    }
    const edge = strip.x - 3
    // With none of the record in the mix there is no click of any size.
    if (mix <= QUIET) {
      state.tickCount.rest()
      state.popCount.rest()
      return
    }
    if (crackle > 0) {
      // Faint where it is an even bed of dust, full where a tick stands out of it.
      line(ctx, edge, sizes[0], edge, sizes[1], colours.accent, 0.45, 2)
      if (sizes[2] < sizes[1]) line(ctx, edge, sizes[1], edge, sizes[2], colours.accent, 1, 2)
    }
    if (pops > 0) spot(ctx, edge, sizes[3], 1.5, colours.accent)
    if (!running) {
      state.tickCount.rest()
      state.popCount.rest()
      return
    }

    const turn = frame.meter('turn')
    const ticked = state.tickCount.more(frame.meter('ticks'), frame.now)
    const popped = state.popCount.more(frame.meter('pops'), frame.now)
    state.pitch.push(frame.now, frame.meter('pitch'))
    state.ticks.push(frame.now, ticked > 0 ? frame.meter('tickLevel') * mix : 0)
    // A scratch that began before Pops was turned to nothing still comes round, with no sound: it is not a pop.
    state.popped.push(frame.now, pops > 0 ? popped : 0)
    state.turned.push(frame.now, state.tickCount.steady && turn < state.turn - 0.5 ? 1 : 0)
    state.turn = turn
    clipTo(ctx, strip.x, past.y - 1, strip.w + 1, past.h + 2)
    // A pop's size is not reported: each is a dot in a row of their own along the top, and says no more than that it fell.
    const row = past.y + 2.5
    for (let back = 0; back < VINYL_SLOTS; back++) {
      const x = state.turned.x(back, strip)
      // The start of each turn: a scratch comes back at the same place in every one.
      if (state.turned.at(back) > 0) line(ctx, x, past.y, x, foot, colours.ink, INK.rule)
      const tick = state.ticks.at(back)
      if (tick > 0) line(ctx, x, foot, x, clickY(tick, past), colours.accent, 0.6)
      if (state.popped.at(back) > 0) spot(ctx, x, row, 1.75, colours.accent)
    }
    ctx.restore()
    drawPast(frame, strip, pitchPath(state.path, strip, state.pitch))
  },
  handles: (view) => vinylHandles(view, null),
})

// --- The spectrum of what goes in -------------------------------------------

/**
 * The spectrum of the end of a wave, for a picture that needs what goes in
 * (the kit's taps give the spectrum of what comes out only). `power[i]` is
 * the square of the amplitude of a tone at `i · rate / size`, 1 for full
 * scale; it rises at once and falls 30 dB a second so the eye can follow it.
 * It is kept as a power so that a reading costs no logarithm for every bin,
 * and a display takes one only as often as it needs: every second frame is
 * enough for the eye.
 */
export class Bins {
  readonly power: Float32Array
  private readonly re: Float32Array
  private readonly im: Float32Array
  private readonly window: Float32Array
  private readonly cos: Float32Array
  private readonly sin: Float32Array
  private readonly swap: Uint16Array

  /** `size` is a power of two: 512 is fine across a few kilohertz, 2048 for the whole range. */
  constructor(readonly size = 512) {
    const n = size
    this.power = new Float32Array(n / 2 + 1)
    this.re = new Float32Array(n)
    this.im = new Float32Array(n)
    this.window = new Float32Array(n)
    this.cos = new Float32Array(n / 2)
    this.sin = new Float32Array(n / 2)
    this.swap = new Uint16Array(n)
    for (let i = 0; i < n; i++) {
      this.window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n)
      let reversed = 0
      for (let bit = 1, j = i; bit < n; bit <<= 1, j >>= 1) reversed = (reversed << 1) | (j & 1)
      this.swap[i] = reversed
    }
    for (let i = 0; i < n / 2; i++) {
      this.cos[i] = Math.cos((2 * Math.PI * i) / n)
      this.sin[i] = Math.sin((2 * Math.PI * i) / n)
    }
  }

  /** Take the end of `wave`; `dt` is the time since the last one, seconds. */
  read(wave: Float32Array, dt: number): void {
    const n = this.size
    const { re, im, swap, window, cos, sin, power } = this
    const from = wave.length - n
    for (let i = 0; i < n; i++) {
      re[swap[i]] = from + i >= 0 ? wave[from + i] * window[i] : 0
      im[i] = 0
    }
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1
      const stride = n / size
      for (let start = 0; start < n; start += size) {
        for (let k = 0; k < half; k++) {
          const c = cos[k * stride]
          const sn = sin[k * stride]
          const a = start + k
          const b = a + half
          const tr = re[b] * c + im[b] * sn
          const ti = im[b] * c - re[b] * sn
          re[b] = re[a] - tr
          im[b] = im[a] - ti
          re[a] += tr
          im[a] += ti
        }
      }
    }
    // 30 dB a second, as a share of the power.
    const fall = Math.pow(10, -3 * Math.max(0, dt))
    // A tone of amplitude 1 puts a quarter of the window's length in its bin.
    const scale = 16 / (n * n)
    for (let i = 0; i <= n / 2; i++) {
      const now = (re[i] * re[i] + im[i] * im[i]) * scale
      const held = power[i] * fall
      power[i] = now > held ? now : held
    }
  }

  /** The level of a bin, dB. */
  db(index: number): number {
    return db10(this.power[index])
  }

  /** The level at a frequency, between its two bins, dB. */
  at(hz: number, sampleRate: number): number {
    const place = clamp((Math.abs(hz) * this.size) / sampleRate, 0, this.size / 2 - 1)
    const index = Math.floor(place)
    const below = db10(this.power[index])
    return below + (db10(this.power[index + 1]) - below) * (place - index)
  }
}

/**
 * What a spectrum of bins `binHz` apart holds between two frequencies: the
 * loudest bin there, or where a bin is wider than that, a reading between
 * two of them.
 */
export function loudestBin(
  bins: Float32Array,
  binHz: number,
  fromHz: number,
  toHz: number,
): number {
  if (toHz - fromHz < binHz) {
    const at = clamp((fromHz + toHz) / 2 / binHz, 0, bins.length - 1)
    const below = Math.floor(at)
    const above = Math.min(bins.length - 1, below + 1)
    return bins[below] + (bins[above] - bins[below]) * (at - below)
  }
  const first = clamp(Math.ceil(fromHz / binHz), 0, bins.length - 1)
  const last = clamp(Math.floor(toHz / binHz), first, bins.length - 1)
  let most = bins[first]
  for (let i = first + 1; i <= last; i++) if (bins[i] > most) most = bins[i]
  return most
}

// --- The wave ---------------------------------------------------------------

/**
 * Where a wave last rose through zero with `span` samples still to come: the
 * place to draw it from, so a steady sound stands still.
 */
export function risingEdge(wave: Float32Array, span: number): number {
  const last = wave.length - span - 1
  for (let i = last; i > 0; i--) if (wave[i - 1] < 0 && wave[i] >= 0) return i
  return Math.max(0, last)
}

/**
 * `span` samples of what comes out, from its last rise through zero, at a
 * height that fits the loudest of them: a sample that is held shows as a
 * step. Answers with the loudest of them.
 */
function drawWave(frame: Paint, box: Box, path: Path, wave: Float32Array, span: number): number {
  const start = risingEdge(wave, span)
  const end = Math.min(span, wave.length - 1 - start)
  let peak = 0.02
  for (let i = 0; i <= end; i++) {
    const size = Math.abs(wave[start + i])
    if (size > peak) peak = size
  }
  const middle = box.y + box.h / 2
  const scale = (box.h / 2 - 1) / peak
  sized(path, end + 1)
  for (let i = 0; i <= end; i++) {
    path.x[i] = box.x + (i / span) * box.w
    path.y[i] = middle - wave[start + i] * scale
  }
  strokePath(frame.ctx, path, frame.colours.ink, 1.25)
  return peak
}

/** Marks along the foot of a wave, one for each time a converter takes a new sample; `spread` is how far its clock wanders, as a share of the step. */
function drawHolds(frame: Paint, box: Box, span: number, period: number, spread = 0): void {
  const step = (period / span) * box.w
  if (step < 2.5) return
  const { ctx, colours } = frame
  const foot = box.y + box.h
  const end = box.x + box.w + 0.5
  if (spread > 0.01)
    for (let x = box.x + step; x <= end; x += step)
      bar(ctx, x - spread * step, foot - 2, 2 * spread * step, 2, colours.accent, 0.5)
  // All the marks in one stroke.
  ctx.beginPath()
  for (let x = box.x; x <= end; x += step) {
    ctx.moveTo(crisp(x), foot)
    ctx.lineTo(crisp(x), foot - 4)
  }
  ctx.strokeStyle = colours.accent
  ctx.lineWidth = 1
  ctx.lineCap = 'round'
  ctx.stroke()
}

// --- Patina -----------------------------------------------------------------

/** A medium of Patina in numbers, as `kMedia` in `patina.h` has it. */
interface Medium {
  hardUp: boolean
  hardDown: boolean
  ceilingUp: number
  ceilingDown: number
  bias: number
  octaves: number
  /** Peak pitch deviation of the wow and of the flutter at Wobble 1, per cent, and the flutter's rate. */
  wow: number
  flutter: number
  flutterHz: number
  /** The band at Wear 1. */
  lowHz: number
  highHz: number
  /** The steady noise at Noise 1, dBFS RMS. */
  noiseDb: number
}
const medium = (
  hardUp: boolean,
  hardDown: boolean,
  ceilingUp: number,
  ceilingDown: number,
  bias: number,
  octaves: number,
  wow: number,
  flutter: number,
  flutterHz: number,
  lowHz: number,
  highHz: number,
  noiseDb: number,
): Medium => ({
  hardUp,
  hardDown,
  ceilingUp,
  ceilingDown,
  bias,
  octaves,
  wow,
  flutter,
  flutterHz,
  lowHz,
  highHz,
  noiseDb,
})
const REEL = 0
const CASSETTE = 1
const RECORD = 2
const RADIO = 3
const SAMPLER = 4
const VALVE = 5
const MEDIA: readonly Medium[] = [
  medium(false, false, 1, 1, 0.3, 5, 0.6, 0.15, 7, 40, 7000, -43),
  medium(true, true, 0.7, 0.7, 0.12, 5, 1.2, 0.4, 11, 60, 4500, -37),
  medium(false, false, 1, 1, 0, 3.32, 0.5, 0, 0, 50, 9000, -42),
  medium(true, true, 1, 0.4, 0.8, 5, 0, 0, 0, 300, 3200, -40),
  medium(false, false, 1, 1, 0, 0, 0, 0, 0, 6, 40000, -42),
  medium(false, true, 1.2, 0.6, 1.7, 6.98, 0, 0, 0, 80, 6000, -40),
]
const mediumOf = (view: DisplayView): number =>
  clamp(Math.round(view.value('medium')), 0, MEDIA.length - 1)

/** One side of a medium's curve (`patina_saturator.h`): soft, u / √(1 + (u/c)²), or a knee and a clip. */
function bend(spec: Medium, u: number): number {
  const hard = u >= 0 ? spec.hardUp : spec.hardDown
  const c = u >= 0 ? spec.ceilingUp : spec.ceilingDown
  const v = u / c
  if (!hard) return u / Math.sqrt(1 + v * v)
  if (v > 1.5) return c
  if (v < -1.5) return -c
  return u * (1 - (4 / 27) * v * v)
}

/** The sampler's converter at Drive: how many steps there are to full scale on its square-root law, 18 bits down to 6. */
export const samplerSteps = (drive: number): number => Math.pow(2, 17 - 12 * drive)

/**
 * What Patina's Drive does to an instant of the wave: the medium's curve
 * worked at the gain and the bias Drive gives, with the make-up that holds a
 * tone at −12 dBFS where it came in. The sampler's is its converter, which
 * rounds on a square-root law.
 */
export function patinaCurve(index: number, drive: number): (x: number) => number {
  const spec = MEDIA[index]
  if (index === SAMPLER) {
    const steps = samplerSteps(drive)
    return (x) => {
      const step = Math.floor(Math.sqrt(Math.min(Math.abs(x), 4)) * steps + 0.5) / steps
      return Math.sign(x) * step * step
    }
  }
  const gain = 0.25 * Math.pow(2, spec.octaves * drive)
  const bias = spec.bias * drive * Math.pow(2, 0.5 * spec.octaves * (drive - 1))
  const rest = bend(spec, bias)
  let sum = 0
  let squares = 0
  for (let k = 0; k < 32; k++) {
    const y = bend(spec, gain * 0.3548 * Math.sin((2 * Math.PI * k) / 32) + bias) - rest
    sum += y
    squares += y * y
  }
  const mean = sum / 32
  const level = (0.3548 * Math.SQRT1_2) / Math.sqrt(Math.max(squares / 32 - mean * mean, 1e-12))
  return (x) => level * (bend(spec, gain * x + bias) - rest)
}

/** Where a medium's band ends at the top: closing with Wear, an octave either way by Tone. The sampler has none but its output filter, under the middle of Tone. */
export function patinaHighHz(view: DisplayView, sampleRate: number): number {
  const index = mediumOf(view)
  const tone = view.value('tone')
  const high =
    index === SAMPLER
      ? 40000 * Math.pow(2, -9.5 * Math.max(0.5 - tone, 0))
      : 40000 *
        Math.pow(MEDIA[index].highHz / 40000, view.value('wear')) *
        Math.pow(2, 2 * tone - 1)
  return clamp(high, 200, 0.49 * sampleRate)
}

/** How many samples the sampler holds each one for at Wear: down to a rate of 6 kHz. */
export const samplerHold = (wear: number, sampleRate: number): number =>
  Math.pow(Math.max(sampleRate / 6000, 1), wear)

/** What a medium does to a quiet tone, in dB at each frequency: its band, the reel's head bump, Tone's shelf, Output, and the droop of the sampler's hold. */
export function patinaResponse(view: DisplayView, sampleRate: number): (hz: number) => number {
  const index = mediumOf(view)
  const wear = view.value('wear')
  const low = 6 * Math.pow(MEDIA[index].lowHz / 6, wear)
  const high = patinaHighHz(view, sampleRate)
  const steep = index === RADIO
  const filters = [
    biquad('highpass', low, steep ? BUTTER4[0] : Math.SQRT1_2, 0, sampleRate),
    biquad('highshelf', 2500, 1, 12 * (view.value('tone') - 0.5), sampleRate),
  ]
  if (steep) filters.push(biquad('highpass', low, BUTTER4[1], 0, sampleRate))
  if (index === REEL) filters.push(biquad('peaking', 70, 1.2, 3 * wear, sampleRate))
  const hold = index === SAMPLER ? samplerHold(wear, sampleRate) : 1
  const output = view.value('output')
  return (hz) => {
    let db = chainDb(filters, hz, sampleRate) + output
    db += db10(power(svf('low', hz, high, steep ? BUTTER4[0] : Math.SQRT1_2, sampleRate)))
    if (steep) db += db10(power(svf('low', hz, high, BUTTER4[1], sampleRate)))
    if (hold > 1.01) {
      const turn = (Math.PI * hz * hold) / sampleRate
      db += db20(Math.abs(Math.sin(turn) / turn))
    }
    return db
  }
}

/** Patina's Noise knob as a level: Noise 0.3 is 24 dB under Noise 1. */
const PATINA_NOISE_TENFOLD = 45.9

/**
 * The steady noise of a medium at Noise 1 (`patina_noise.h`), as a power at a
 * frequency for white noise of power 1: each side has its own, so the sum of
 * both keeps half. Ticks, pops and bursts are events and are not in this; hum
 * and the idle tone are lines, see `patinaTones`.
 */
export function patinaNoisePower(index: number, hz: number, sampleRate: number): number {
  const tilt = (hzAt: number, amount: number): number =>
    power(cadd(cx(1), cscale(onePole(hz, hzAt, sampleRate), -amount)))
  switch (index) {
    case REEL:
      return 1.862 ** 2 * tilt(1000, 0.6) * SIDES_APART
    case CASSETTE:
      return 2.852 ** 2 * tilt(5000, 0.92) * SIDES_APART
    case RECORD: {
      // A soft surface, and a rumble near 30 Hz made from both sides' noise, most of it on one.
      const rumble = 0.35 * 4.5
      return (
        3.27 ** 2 *
        (power(onePole(hz, 3500, sampleRate)) * SIDES_APART +
          2 * rumble * rumble * power(svf('band', hz, 30, 1.5, sampleRate)))
      )
    }
    case RADIO:
      return 3.38 ** 2 * power(svf('band', hz, 1800, 0.5, sampleRate)) * SIDES_APART
    case SAMPLER:
      return 1.64 ** 2 * SIDES_APART
    default:
      return (1.19 * 0.35) ** 2 * tilt(1000, 0.6) * SIDES_APART
  }
}

/** The steady tones in a medium's noise, as [Hz, amplitude] against a noise of RMS 1: mains hum, or the sampler's idle tone. The two sides are a quarter of a cycle apart, which their sum hears as 0.707. */
export function patinaTones(index: number): readonly (readonly [number, number])[] {
  const apart = Math.SQRT1_2
  if (index === RADIO)
    return [
      [50, 3.38 * 0.08 * apart],
      [100, 3.38 * 0.08 * 0.6 * apart],
      [150, 3.38 * 0.08 * 0.3 * apart],
    ]
  if (index === SAMPLER) return [[3200, 1.64 * 0.3 * apart]]
  if (index === VALVE)
    return [
      [100, 1.19 * apart],
      [200, 1.19 * 0.5 * apart],
      [300, 1.19 * 0.3 * apart],
      [500, 1.19 * 0.15 * apart],
    ]
  return []
}

/** The furthest Wobble takes a medium's pitch, per cent. */
const patinaReach = (view: DisplayView): number =>
  view.value('wobble') * (MEDIA[mediumOf(view)].wow + MEDIA[mediumOf(view)].flutter)

/** The scale of the strip where Wobble moves the level and not the pitch, dB. */
const SWAY_TOP_DB = 7
const SWAY_FOOT_DB = -13
/** How many samples of the wave the sampler's strip shows. */
const SAMPLER_SPAN = 96
/** The share of full scale the sampler's curve is drawn over: its steps are at the bottom. */
const SAMPLER_ZOOM = 1 / 64

/** Room at the left of Patina's strip for the number that says what it shows. */
const PATINA_LABEL = 35
/** How much of the past Patina's strip keeps where it shows the pitch, and in how many steps: its strip is short. */
const PATINA_PITCH_SEC = 2
const PATINA_PITCH_SLOTS = 100

function patinaHandles(view: DisplayView, floor: Curve | null): DisplayHandle[] {
  const { band } = twoBoxes(view, 30)
  const sampleRate = 48000
  const index = mediumOf(view)
  const sampler = index === SAMPLER
  // The sampler's edge is half its rate, where the images begin; a band's is where it ends.
  const edgeHz = sampler
    ? sampleRate / samplerHold(view.value('wear'), sampleRate) / 2
    : patinaHighHz(view, sampleRate)
  const response = patinaResponse(view, sampleRate)
  // The edge with no wear and with all of it, before the device holds it under half the rate.
  const open = sampler ? sampleRate / 2 : 40000 * Math.pow(2, 2 * view.value('tone') - 1)
  const closed = sampler ? 3000 : open * (MEDIA[index].highHz / 40000)
  const wear: DisplayHandle = {
    key: 'wear',
    name: 'Wear',
    x: clamp(xOfHz(edgeHz, band), band.x, band.x + band.w),
    y: clamp(
      yOfDb(response(Math.min(edgeHz, 20000)), band, CURVE_TOP_DB, CURVE_FOOT_DB),
      band.y,
      band.y + band.h,
    ),
    // Across is where the band ends: to the left wears the medium. With little
    // wear it ends above the picture, and the point is taken from where it ends.
    drag: (x, _y, hold) => ({
      wear: carried(
        hold,
        view.value('wear'),
        x,
        wear.x,
        (worn) => placeOfHz(open * Math.pow(closed / open, worn), band),
        (to) => clamp(Math.log(hzOfPlace(to, band) / open) / Math.log(closed / open), 0, 1),
      ),
    }),
    reset: () => ({ wear: view.spec('wear')?.default ?? 0.3 }),
  }
  const noise = floorHandle(
    view,
    band,
    floor ?? fillCurve(newCurve(), band, patinaFloor(view, sampleRate, sampleRate / TAP_BINS)),
    'noise',
    'Noise',
    PATINA_NOISE_TENFOLD,
  )
  return [wear, noise]
}

/** A medium's noise at Noise 1 as the spectrum shows it: the bed, through the band it is played back through. */
function patinaFloor(view: DisplayView, sampleRate: number, binHz: number): (hz: number) => number {
  const index = mediumOf(view)
  const response = patinaResponse(view, sampleRate)
  const level = fromDb(MEDIA[index].noiseDb)
  // Uniform noise has a third of the power of its peak; its density is that of 48 kHz at any rate.
  return (hz) =>
    noiseBinDb((level * level * patinaNoisePower(index, hz, sampleRate)) / 3, 48000, binHz) +
    response(hz)
}

interface PatinaState {
  boxes: Layout
  curve: Box
  strip: Box
  made: Float64Array
  columns: Columns
  response: Curve
  floor: Curve
  /** Where the two handles stand: x and y of Wear, then of Noise. */
  spots: Float64Array
  /** The steady tones in the noise: where each stands, and its level at Noise 1 with all of it up, dB. */
  toneX: Float64Array
  toneDb: Float64Array
  tones: number
  /** Where half the sampler's rate stands; NaN where there is no such line. */
  halfRateX: number
  /** The Drive curve at 33 points across its box, and what it was made from. */
  bentFor: Float64Array
  bent: Path
  transport: PitchState
  /** The level Wobble has the sound at where it moves the level: slowly on the radio, faster in the valve. */
  fading: History
  sag: History
  past: Path
  level: number
  wave: Path
  said: Said
}

/** A level as it is said in a small place: "−6 dB". */
const dbWords = (db: number): string => {
  const whole = Math.round(db)
  return `${whole < 0 ? '−' : ''}${Math.abs(whole)} dB`
}

const patina = plateDisplay<PatinaState>({
  place: 'window',
  columns: 2,
  params: ['medium', 'drive', 'wobble', 'wear', 'noise', 'tone', 'output'],
  live: { meters: true, signal: true, spectrum: true },
  info: 'Above, what the medium does across frequency: its band as a line over the spectrum, its noise in the second colour. Drag the points for Wear and Noise. Below, the curve Drive bends the wave through, and what Wobble moves and how far: the pitch, the level, or the clock of the sampler under its wave.',
  init: () => ({
    boxes: newLayout(),
    curve: newBox(),
    strip: newBox(),
    made: newKey(),
    columns: newColumns(),
    response: newCurve(),
    floor: newCurve(),
    spots: new Float64Array(4),
    toneX: new Float64Array(4),
    toneDb: new Float64Array(4),
    tones: 0,
    halfRateX: NaN,
    bentFor: newKey(),
    bent: newPath(33),
    transport: newPitch(PATINA_PITCH_SEC, PATINA_PITCH_SLOTS),
    fading: new History(12, 60, 0),
    sag: new History(4, 60, 0),
    past: newPath(60),
    level: 0,
    wave: newPath(),
    said: newSaid(),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const boxes = layout(state.boxes, frame, 30)
    const { band, past } = boxes
    const curve = setBox(state.curve, past.x, past.y, past.h, past.h)
    const labelX = past.x + past.h + 5
    const strip = setBox(
      state.strip,
      labelX + PATINA_LABEL,
      past.y,
      past.w - past.h - 7 - PATINA_LABEL,
      past.h,
    )
    const sr = frame.sampleRate
    const binHz = binHzOf(frame)
    const index = mediumOf(frame)
    const spec = MEDIA[index]
    const wear = frame.value('wear')
    const wobble = frame.value('wobble')
    const drive = frame.value('drive')
    const noise = frame.value('noise')
    const running = frame.signal !== null && frame.hasMeter('flutter') && frame.dt > 0
    const noiseDb = amountDb(noise, PATINA_NOISE_TENFOLD)
    const gate = running ? frame.meter('noise') : null
    // The transport turns while the device is awake: its noise is up from the first sound until three seconds after the last.
    const awake = gate !== null && gate > 0

    if (
      stale(
        state.made,
        index,
        wear,
        frame.value('tone'),
        frame.value('output'),
        binHz,
        sr,
        frame.width,
        frame.height,
      )
    ) {
      const response = patinaResponse(frame, sr)
      fillCurve(state.response, band, response)
      fillCurve(state.floor, band, patinaFloor(frame, sr, binHz))
      // The hum and the idle tone ride on the same level and the same band.
      const rate = sr / samplerHold(wear, sr)
      const tones = patinaTones(index)
      state.tones = tones.length
      for (let k = 0; k < tones.length; k++) {
        const [hz, amplitude] = tones[k]
        // The sampler's tone is held with the signal: over half its rate it folds back down.
        const heard = index === SAMPLER ? Math.abs(hz - Math.round(hz / rate) * rate) : hz
        state.toneX[k] = heard > 20 && heard < 20000 ? xOfHz(heard, band) : NaN
        state.toneDb[k] = spec.noiseDb + db20(amplitude) + TONE_DB + response(heard)
      }
      // Half the sampler's rate: what was above it comes back under it.
      state.halfRateX =
        index === SAMPLER && samplerHold(wear, sr) > 1.01 ? xOfHz(rate / 2, band) : NaN
      const point = patinaHandles(frame, state.floor)[0]
      state.spots[0] = point.x
      state.spots[1] = point.y
      state.spots[2] = floorHandleX(band, state.floor)
    }
    state.spots[3] = floorHandleY(band, state.floor, noise, PATINA_NOISE_TENFOLD)

    grid(frame, band)
    drawUnchanged(frame, band)
    clipTo(ctx, band.x, band.y, band.w, band.h)
    drawSpectrum(frame, band, state.columns)
    drawFloor(frame, band, state.floor, gate, noiseDb)
    if (noiseDb > SILENT_DB / 2) {
      const up = noiseDb + (gate === null ? 0 : db20(gate))
      for (let k = 0; k < state.tones; k++)
        if (!Number.isNaN(state.toneX[k]))
          drawTone(frame, band, state.toneX[k], state.toneDb[k] + up, gate === null ? INK.back : 1)
    }
    if (!Number.isNaN(state.halfRateX))
      line(
        ctx,
        state.halfRateX,
        band.y,
        state.halfRateX,
        band.y + band.h,
        colours.accent,
        1,
        1,
        DASHED,
      )
    drawResponse(frame, band, state.response)
    ctx.restore()
    knob(frame, state.spots[0], state.spots[1], frame.hot === 'wear')
    knob(frame, state.spots[2], state.spots[3], frame.hot === 'noise')
    if (frame.hot === 'wear') {
      const edge = index === SAMPLER ? sr / samplerHold(wear, sr) / 2 : patinaHighHz(frame, sr)
      text(frame, hzText(edge), band.x + 1, band.y + 8, LEFT)
    }

    divide(frame, boxes)
    // Below, left: the curve Drive bends the wave through, input across and output up.
    const reach = index === SAMPLER ? SAMPLER_ZOOM : 1
    const centreX = curve.x + curve.w / 2
    const centreY = curve.y + curve.h / 2
    const bent = state.bent
    const last = 32
    if (stale(state.bentFor, index, drive, curve.x, curve.y, curve.h)) {
      const through = patinaCurve(index, drive)
      sized(bent, last + 1)
      for (let i = 0; i <= last; i++) {
        bent.x[i] = curve.x + (i / last) * curve.w
        bent.y[i] =
          centreY - clamp(through((i / last) * 2 * reach - reach) / reach, -1, 1) * (curve.h / 2)
      }
    }
    line(ctx, curve.x, centreY, curve.x + curve.w, centreY, colours.ink, INK.grid)
    line(ctx, centreX, curve.y, centreX, curve.y + curve.h, colours.ink, INK.grid)
    // Unbent: out as in.
    line(
      ctx,
      curve.x,
      curve.y + curve.h,
      curve.x + curve.w,
      curve.y,
      colours.ink,
      INK.rule,
      1,
      DOTTED,
    )
    strokePath(ctx, bent, colours.ink, 1.25)
    if (frame.signal) {
      const peak = (frame.signal.input ?? frame.signal.output).peak
      state.level = Math.max(peak, state.level * Math.exp(-frame.dt / 0.25))
    }
    if (running && state.level > 0.003) {
      // How far along its curve the sound is swinging now.
      const swing = Math.min(1, state.level / reach)
      const from = Math.floor(((1 - swing) / 2) * last)
      const to = Math.ceil(((1 + swing) / 2) * last)
      strokePath(ctx, bent, colours.accent, 2, 1, SOLID, from, to)
      spot(ctx, bent.x[to], bent.y[to], 1.75, colours.accent)
    }

    // Below, right: what Wobble moves, and at the left of it a number whose unit says which.
    const transport = state.transport
    const said = state.said
    const middle = strip.y + strip.h / 2
    if (index === SAMPLER) {
      // The converter's clock: its rate, a mark for each sample it takes, and how far Wobble lets each one stray.
      const hold = samplerHold(wear, sr)
      const key = index * 1e6 + hold
      if (said.value !== key) {
        said.value = key
        said.words = hzText(sr / hold)
      }
      text(frame, said.words, labelX, middle + 3, LEFT)
      drawHolds(frame, strip, SAMPLER_SPAN, hold, 0.3 * wobble)
      transport.dropped.rest()
      const heard = running ? frame.signal?.output.wave : undefined
      if (heard) {
        clipTo(ctx, strip.x, strip.y, strip.w, strip.h)
        drawWave(frame, strip, state.wave, heard, SAMPLER_SPAN)
        ctx.restore()
      } else line(ctx, strip.x, middle, strip.x + strip.w, middle, colours.ink, INK.grid)
      return
    }
    if (index === RADIO || index === VALVE) {
      const zero = yOfDb(0, strip, SWAY_TOP_DB, SWAY_FOOT_DB)
      line(ctx, strip.x, zero, strip.x + strip.w, zero, colours.ink, INK.grid)
      // The furthest Wobble takes the level: the radio fades by up to 9 dB, the valve gives way and blooms by 6.
      const depth = 3 * wobble
      const down = index === RADIO ? -9 * wobble : db20((1 + 0.3228 * depth) / (1 + depth))
      const key = index * 1e6 + Math.round(down)
      if (said.value !== key) {
        said.value = key
        said.words = dbWords(down)
      }
      text(frame, said.words, labelX, middle + 3, LEFT)
      if (wobble > 0.004) {
        const under = yOfDb(down, strip, SWAY_TOP_DB, SWAY_FOOT_DB)
        line(ctx, strip.x, under, strip.x + strip.w, under, colours.ink, INK.rule, 1, DOTTED)
        if (index === VALVE) {
          const over = yOfDb(db20(1 + 0.3228 * depth), strip, SWAY_TOP_DB, SWAY_FOOT_DB)
          line(ctx, strip.x, over, strip.x + strip.w, over, colours.ink, INK.rule, 1, DOTTED)
        }
      }
      transport.dropped.rest()
      if (!running) return
      const levels = index === RADIO ? state.fading : state.sag
      levels.push(frame.now, db20(Math.max(frame.meter('level'), 1e-3)))
      drawPast(frame, strip, levelPath(state.past, strip, levels, SWAY_TOP_DB, SWAY_FOOT_DB))
      return
    }
    const furthest = patinaReach(frame)
    drawReach(frame, said, labelX, middle + 3, furthest)
    drawPitchLines(frame, strip, furthest)
    if (!running) {
      transport.dropped.rest()
      return
    }
    if (awake) {
      pushWobble(
        transport,
        frame,
        frame.meter('wow'),
        frame.meter('flutter'),
        frame.meter('flutterDepth'),
        spec.flutterHz,
      )
    } else {
      pushStill(transport, frame.now)
    }
    // A dropout's depth is not reported: each is a mark of one length, and says no more than that it fell.
    pushDrops(transport, frame.now, frame.meter('drops'), 0.4)
    drawDrops(frame, strip, transport)
    drawPast(frame, strip, pitchPath(transport.path, strip, transport.pitch))
  },
  handles: (view) => patinaHandles(view, null),
})

// --- Radio ------------------------------------------------------------------

/** A band of Radio in numbers, as `kBandSpec` in `radio.h` has it, and the stretch of the dial its picture shows. */
interface RadioBand {
  /** The audio's low and high edge at Bandwidth 0 and at 1, Hz. */
  low: readonly [number, number]
  high: readonly [number, number]
  transmitHz: number
  carrier: boolean
  depth: number
  /** Tuning at ±1, Hz, and whether the dial is square-law. */
  tuneHz: number
  square: boolean
  /** The flat fade at its deepest, Fading 1. */
  fadeDb: number
  fromHz: number
  toHz: number
  gridHz: number
}
const RADIO_BANDS: readonly RadioBand[] = [
  {
    low: [110, 60],
    high: [2800, 6000],
    transmitHz: 6500,
    carrier: true,
    depth: 0.8,
    tuneHz: 5500,
    square: true,
    fadeDb: 24,
    fromHz: -10000,
    toHz: 10000,
    gridHz: 5000,
  },
  {
    low: [330, 155],
    high: [2400, 5000],
    transmitHz: 5500,
    carrier: true,
    depth: 0.8,
    tuneHz: 5500,
    square: true,
    fadeDb: 40,
    fromHz: -10000,
    toHz: 10000,
    gridHz: 5000,
  },
  {
    low: [350, 180],
    high: [2200, 3200],
    transmitHz: 3400,
    carrier: false,
    depth: 1,
    tuneHz: 400,
    square: false,
    fadeDb: 40,
    fromHz: -1400,
    toHz: 4600,
    gridHz: 1000,
  },
]
/** How many samples the picture's spectrum of the programme is made from. */
const RADIO_BINS = 512
/** Butterworth section Qs for eight poles (`radio_parts::kButter8`). */
const BUTTER8 = [0.50979558, 0.60134489, 0.89997622, 2.56291545] as const
/** The picture's scale: the carrier is 0 dB. */
const RADIO_TOP_DB = 14
const RADIO_FOOT_DB = -84

const radioBand = (view: DisplayView): RadioBand =>
  RADIO_BANDS[clamp(Math.round(view.value('band')), 0, RADIO_BANDS.length - 1)]

/** The audio band the receiver passes at Bandwidth: low edge and high edge, Hz. */
export function radioEdges(view: DisplayView): { low: number; high: number } {
  const band = radioBand(view)
  const width = view.value('bandwidth')
  return {
    low: band.low[0] * Math.pow(band.low[1] / band.low[0], width),
    high: band.high[0] * Math.pow(band.high[1] / band.high[0], width),
  }
}

/** How far the dial is off the station, Hz: square-law where there is a carrier, so it is fine near the station. */
export function radioDialHz(view: DisplayView): number {
  const band = radioBand(view)
  const dial = view.value('tuning')
  return band.tuneHz * (band.square ? dial * Math.abs(dial) : dial)
}

/**
 * Where the receiver's filter sits against the station, for a dial `offHz`
 * off it: its centre and its half-width, Hz. With a carrier the filter
 * passes both sidebands and moves with the dial; on Sideband it sits beside
 * the missing carrier, from the low edge to the high, and the dial slides
 * the programme along under it.
 */
export function radioFilter(view: DisplayView, offHz: number): { centre: number; half: number } {
  const { low, high } = radioEdges(view)
  return radioBand(view).carrier
    ? { centre: offHz, half: high }
    : { centre: 0.5 * (low + high) - offHz, half: 0.5 * (high - low) }
}

/**
 * The static against a carrier of 1, in dB, as one bin of the picture's
 * spectrum reads it, for its amplitude at the aerial: uniform noise on both
 * parts of the signal (a third of the peak's power each) across the whole
 * rate, of which a bin under its window takes one and a half parts in 512.
 */
export const radioStaticDb = (gain: number): number =>
  db10(((2 * gain * gain) / 3) * (1.5 / RADIO_BINS))

/** What two paths do to the signal at a frequency off the carrier: the late one arrives `ms` behind, turned. */
export function skyWaveDb(
  direct: number,
  lateRe: number,
  lateIm: number,
  ms: number,
  hz: number,
): number {
  const turn = -2 * Math.PI * hz * ms * 0.001
  const re = direct + lateRe * Math.cos(turn) - lateIm * Math.sin(turn)
  const im = lateRe * Math.sin(turn) + lateIm * Math.cos(turn)
  return db10(re * re + im * im)
}

const radioBox = (view: Size): Box => ({ x: 4, y: 4, w: view.width - 8, h: view.height - 8 })
const radioX = (hz: number, band: RadioBand, box: Box): number =>
  box.x + ((hz - band.fromHz) / (band.toHz - band.fromHz)) * box.w
const radioHz = (x: number, band: RadioBand, box: Box): number =>
  band.fromHz + ((x - box.x) / box.w) * (band.toHz - band.fromHz)
const radioY = (db: number, box: Box): number =>
  yOfDb(clamp(db, RADIO_FOOT_DB - 6, RADIO_TOP_DB), box, RADIO_TOP_DB, RADIO_FOOT_DB)

function radioHandles(view: DisplayView): DisplayHandle[] {
  const box = radioBox(view)
  const band = radioBand(view)
  const off = radioDialHz(view)
  const { centre, half } = radioFilter(view, off)
  const tuning: DisplayHandle = {
    key: 'tuning',
    name: 'Tuning',
    x: clamp(radioX(centre, band, box), box.x, box.x + box.w),
    y: radioY(0, box),
    // Across is where the receiver listens.
    drag: (x) => {
      const to = handTo(x, tuning.x, box.x, box.x + box.w)
      if (Number.isNaN(to)) return { tuning: view.value('tuning') }
      const hz = radioHz(to, band, box)
      const turned = clamp((band.carrier ? hz : centre + off - hz) / band.tuneHz, -1, 1)
      return { tuning: band.square ? Math.sign(turned) * Math.sqrt(Math.abs(turned)) : turned }
    },
    reset: () => ({ tuning: 0 }),
  }
  const bandwidth: DisplayHandle = {
    key: 'bandwidth',
    name: 'Bandwidth',
    x: clamp(radioX(centre + half, band, box), box.x, box.x + box.w),
    y: radioY(-3, box),
    // Across is the filter's upper edge.
    drag: (x) => {
      const to = handTo(x, bandwidth.x, box.x, box.x + box.w)
      if (Number.isNaN(to)) return { bandwidth: view.value('bandwidth') }
      const edge = radioHz(to, band, box)
      const high = band.carrier ? edge - off : edge + off
      return {
        bandwidth: clamp(
          Math.log(Math.max(high, 1) / band.high[0]) / Math.log(band.high[1] / band.high[0]),
          0,
          1,
        ),
      }
    },
    reset: () => ({ bandwidth: view.spec('bandwidth')?.default ?? 0.5 }),
  }
  return [tuning, bandwidth]
}

/** How many steps the receiver's filter is kept in, from its centre to the far end of the picture. */
const RADIO_SHAPE = 256
/** How long the receiver counts as on after the last sound, in or out: over a gap in the playing, not over a sleep. */
const RADIO_ON_SEC = 2

interface RadioState {
  programme: Bins
  /** Frames since the programme's spectrum was taken, and the time. */
  turn: number
  since: number
  made: Float64Array
  /** The audio band's edges at this Bandwidth, Hz. */
  low: number
  high: number
  /** Per column of the picture: its frequency off the carrier, what the transmitter's filter leaves there, and the programme there, dB. */
  hz: Float32Array
  sent: Float32Array
  heard: Float32Array
  /** The receiver's filter by distance from its centre, dB, in steps of `shapeHz`. */
  shape: Float32Array
  shapeHz: number
  air: Path
  through: Path
  filter: Path
  /** When something last sounded, going in or coming out. */
  heardAt: number
}

const radio = plateDisplay<RadioState>({
  place: 'window',
  columns: 2,
  params: ['band', 'tuning', 'fading', 'static', 'bandwidth'],
  live: { meters: true, signal: true },
  info: 'A stretch of the dial with the station in the middle: its carrier, and the programme either side as the sky wave hollows it. The line is the filter of the receiver and the second colour is the static. Drag the filter along to tune, and its edge for the bandwidth.',
  init: () => ({
    programme: new Bins(RADIO_BINS),
    turn: 0,
    since: 0,
    made: newKey(),
    low: 0,
    high: 0,
    hz: new Float32Array(0),
    sent: new Float32Array(0),
    heard: new Float32Array(0),
    shape: new Float32Array(RADIO_SHAPE + 1),
    shapeHz: 1,
    air: newPath(),
    through: newPath(),
    filter: newPath(),
    heardAt: Number.NEGATIVE_INFINITY,
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const x0 = 4
    const y0 = 4
    const w = frame.width - 8
    const h = frame.height - 8
    const foot = y0 + h
    const index = clamp(Math.round(frame.value('band')), 0, RADIO_BANDS.length - 1)
    const band = RADIO_BANDS[index]
    const sr = frame.sampleRate
    const span = band.toHz - band.fromHz
    const columns = Math.floor(w / 2) + 1
    // The picture's scale of levels, as `radioY` has it.
    const perDb = h / (RADIO_TOP_DB - RADIO_FOOT_DB)
    const lowest = RADIO_FOOT_DB - 6
    const running = frame.signal !== null && frame.hasMeter('direct') && frame.dt > 0
    if (running && Math.max(frame.signal?.output.peak ?? 0, frame.signal?.input?.peak ?? 0) > QUIET)
      state.heardAt = frame.now
    // Asleep, the receiver is off, and its readings stand where they were when it
    // went: it is on only while something sounds, its static if nothing else.
    // Off, the picture is what the controls say.
    const live = running && frame.meter('direct') > 1e-4 && frame.now - state.heardAt < RADIO_ON_SEC

    // What the transmitter's filter leaves at each column, and the receiver's by distance from its centre: made again only when they move.
    if (stale(state.made, index, frame.value('bandwidth'), sr, w)) {
      const edges = radioEdges(frame)
      state.low = edges.low
      state.high = edges.high
      if (state.hz.length !== columns) {
        state.hz = new Float32Array(columns)
        state.sent = new Float32Array(columns)
        state.heard = new Float32Array(columns).fill(SILENT_DB)
      }
      const sending = BUTTER4.map((q) => biquad('lowpass', band.transmitHz, q, 0, sr))
      for (let i = 0; i < columns; i++) {
        state.hz[i] = band.fromHz + ((i * 2) / w) * span
        state.sent[i] = chainDb(sending, Math.abs(state.hz[i]), sr)
      }
      const half = band.carrier ? edges.high : 0.5 * (edges.high - edges.low)
      const receiving = BUTTER8.map((q) => biquad('lowpass', half, q, 0, sr))
      // Far enough for a filter at either end of the dial to reach the other end of the picture.
      state.shapeHz = (span + 2 * band.tuneHz) / RADIO_SHAPE
      for (let k = 0; k <= RADIO_SHAPE; k++)
        state.shape[k] = chainDb(receiving, Math.min(k * state.shapeHz, sr * 0.49), sr)
    }
    const dial = radioDialHz(frame)
    const off = live ? frame.meter('tuning') : dial
    const half = band.carrier ? state.high : 0.5 * (state.high - state.low)
    const middle = band.carrier ? 0 : 0.5 * (state.low + state.high)
    const centre = band.carrier ? off : middle - off

    // The dial: a line every kilohertz or five, and the station.
    for (
      let hz = Math.ceil(band.fromHz / band.gridHz) * band.gridHz;
      hz <= band.toHz;
      hz += band.gridHz
    ) {
      const x = x0 + ((hz - band.fromHz) / span) * w
      line(ctx, x, y0, x, foot, colours.ink, hz === 0 ? INK.rule : INK.grid)
    }

    // The static at the aerial, the same all along the dial.
    if (live) {
      const db = clamp(radioStaticDb(frame.meter('static')), lowest, RADIO_TOP_DB)
      const y = y0 + (RADIO_TOP_DB - db) * perDb
      bar(ctx, x0, y, w, foot - y, colours.accent, 0.45)
      line(ctx, x0, y, x0 + w, y, colours.accent, 1, 1.25)
    } else {
      // Where Static puts it for a part at the level the device takes as usual.
      const set = 0.26 * Math.pow(frame.value('static'), 1.5) * Math.sqrt(sr / 48000)
      if (set > 0) {
        const db = clamp(radioStaticDb(set), lowest, RADIO_TOP_DB)
        const y = y0 + (RADIO_TOP_DB - db) * perDb
        line(ctx, x0, y, x0 + w, y, colours.accent, 1, 1, DASHED)
      }
    }

    // The programme: a spectrum of what goes in, taken every second frame.
    const wave = frame.signal ? (frame.signal.input ?? frame.signal.output).wave : null
    if (wave && running) {
      state.since += frame.dt
      if (state.turn === 0) {
        state.programme.read(wave, state.since)
        state.since = 0
        // With a carrier each tone of the programme is a pair of sidebands of half the depth; without, one of all of it, above.
        const depth = db20(band.carrier ? band.depth / 2 : band.depth)
        for (let i = 0; i < columns; i++)
          state.heard[i] =
            !band.carrier && state.hz[i] < 0
              ? SILENT_DB
              : state.programme.at(state.hz[i], sr) + depth
      }
      state.turn = (state.turn + 1) % 2
    }

    // The station as it arrives: the programme on its carrier, through the two paths of the sky wave.
    const direct = live ? frame.meter('direct') : 1
    const lateRe = live ? frame.meter('lateRe') : 0
    const lateIm = live ? frame.meter('lateIm') : 0
    const late = live ? frame.meter('delay') : 0
    // The late path's turn at each column: the columns are evenly spaced, so it is carried from one to the next.
    const first = -2 * Math.PI * state.hz[0] * late * 0.001
    const step = -2 * Math.PI * ((2 / w) * span) * late * 0.001
    const stepCos = Math.cos(step)
    const stepSin = Math.sin(step)
    let cos = Math.cos(first)
    let sin = Math.sin(first)
    const air = sized(state.air, columns)
    const through = sized(state.through, columns)
    const filter = sized(state.filter, columns)
    let loudest = SILENT_DB
    for (let i = 0; i < columns; i++) {
      const x = x0 + i * 2
      const re = direct + lateRe * cos - lateIm * sin
      const im = lateRe * sin + lateIm * cos
      const turned = cos * stepCos - sin * stepSin
      sin = sin * stepCos + cos * stepSin
      cos = turned
      const at = Math.min(Math.abs(state.hz[i] - centre) / state.shapeHz, RADIO_SHAPE - 0.001)
      const below = Math.floor(at)
      const passed =
        state.shape[below] + (state.shape[below + 1] - state.shape[below]) * (at - below)
      const arrived = (wave ? state.heard[i] : SILENT_DB) + state.sent[i] + db10(re * re + im * im)
      if (arrived > loudest) loudest = arrived
      air.x[i] = through.x[i] = filter.x[i] = x
      air.y[i] = y0 + (RADIO_TOP_DB - clamp(arrived, lowest, RADIO_TOP_DB)) * perDb
      through.y[i] = y0 + (RADIO_TOP_DB - clamp(arrived + passed, lowest, RADIO_TOP_DB)) * perDb
      filter.y[i] = y0 + (RADIO_TOP_DB - clamp(passed, lowest, RADIO_TOP_DB)) * perDb
    }
    clipTo(ctx, x0, y0, w, h)
    if (loudest > RADIO_FOOT_DB) {
      // All of it faintly, and what the filter lets through over that.
      fillUnder(ctx, air, foot + 8, colours.ink, INK.fill)
      fillUnder(ctx, through, foot + 8, colours.ink, 0.42)
    } else {
      // No programme: the band the station sends in, as an outline.
      for (let i = 0; i < columns; i++)
        air.y[i] = y0 + (RADIO_TOP_DB - clamp(-24 + state.sent[i], lowest, RADIO_TOP_DB)) * perDb
      const from = band.carrier ? 0 : Math.ceil((((0 - band.fromHz) / span) * w) / 2)
      strokePath(ctx, air, colours.ink, 1, INK.back, DASHED, from)
    }
    if (band.carrier) {
      const x = x0 + ((0 - band.fromHz) / span) * w
      const carrier = clamp(db10((direct + lateRe) ** 2 + lateIm ** 2), lowest, RADIO_TOP_DB)
      line(ctx, x, foot, x, y0 + (RADIO_TOP_DB - carrier) * perDb, colours.ink, 1, 2)
    }
    strokePath(ctx, filter, colours.ink)
    ctx.restore()

    // How far the fading takes the signal down, at the left edge, and where it is now.
    const deepest = -band.fadeDb * Math.pow(frame.value('fading'), 0.75)
    const edge = x0 + 1.5
    const top = y0 + RADIO_TOP_DB * perDb
    const bottom = y0 + (RADIO_TOP_DB - clamp(deepest, lowest, RADIO_TOP_DB)) * perDb
    line(ctx, edge, top, edge, bottom, colours.ink, INK.text)
    line(ctx, edge, top, edge + 3, top, colours.ink, INK.text)
    line(ctx, edge, bottom, edge + 3, bottom, colours.ink, INK.text)
    if (live)
      spot(
        ctx,
        edge,
        y0 + (RADIO_TOP_DB - clamp(db20(direct), lowest, RADIO_TOP_DB)) * perDb,
        2,
        colours.accent,
        colours.ink,
      )

    // The handles stand where the dial and Bandwidth put the filter.
    const setCentre = band.carrier ? dial : middle - dial
    knob(
      frame,
      clamp(x0 + ((setCentre - band.fromHz) / span) * w, x0, x0 + w),
      top,
      frame.hot === 'tuning',
    )
    knob(
      frame,
      clamp(x0 + ((setCentre + half - band.fromHz) / span) * w, x0, x0 + w),
      y0 + (RADIO_TOP_DB + 3) * perDb,
      frame.hot === 'bandwidth',
    )
    if (frame.hot === 'tuning')
      text(frame, `${dial >= 0 ? '+' : '−'}${hzText(Math.abs(dial))}`, x0 + w - 1, y0 + 8, RIGHT)
    else if (frame.hot === 'bandwidth') text(frame, hzText(state.high), x0 + w - 1, y0 + 8, RIGHT)
  },
  handles: (view) => radioHandles(view),
})

// --- Low Bitrate ------------------------------------------------------------

// `low_bitrate.h`: the critical bands' edges, Hz, and the coefficients in a frame at 44.1 and 48 kHz.
const CODEC_EDGES = [
  100, 200, 300, 400, 510, 630, 770, 920, 1080, 1270, 1480, 1720, 2000, 2320, 2700, 3150, 3700,
  4400, 5300, 6400, 7700, 9500, 12000, 15500, 20000,
]
const CODEC_FRAMES = [128, 512, 1024]

/**
 * Where the codec's bands begin and end, Hz, for a Frame (`build_layout`): the
 * critical bands, with any narrower than four coefficients joined to the
 * next, so a short frame has few bands low down.
 */
export function codecBands(frame: number, sampleRate: number): number[] {
  const n = CODEC_FRAMES[clamp(Math.round(frame), 0, 2)] * (sampleRate >= 70000 ? 2 : 1)
  const binHz = sampleRate / (2 * n)
  const starts = [0]
  for (const edge of CODEC_EDGES) {
    const bin = Math.floor(edge / binHz + 0.5)
    if (bin - starts[starts.length - 1] >= 4 && n - bin >= 4) starts.push(bin)
  }
  starts.push(n)
  return starts.map((bin) => bin * binHz)
}

/** What a Loss setting means for a frame (`severity`): the margin under its band's peak a coefficient is kept within, the floor under the stream's recent peak, both dB, and the frequency above which nothing is kept. */
export function codecSeverity(loss: number): { marginDb: number; floorDb: number; cutHz: number } {
  const keep = (1 - loss) * (1 - loss)
  return {
    marginDb: 2 + 60 * keep,
    floorDb: 14 + 82 * keep,
    cutHz: Math.pow(2, 14.4252 - 2.6521 * loss * Math.sqrt(loss)),
  }
}

/**
 * The level under which the codec drops a coefficient, per band, in dB
 * (`lose`): the margin under the band's loudest, raised by the loud bands
 * beside it (masking falls 8 dB a band upwards, 16 downwards) and by the
 * floor under the stream's peak. `peaks` holds each band's loudest and is
 * overwritten with the answer.
 */
export function codecThreshold(
  peaks: Float32Array,
  bands: number,
  marginDb: number,
  floorDb: number,
): void {
  for (let b = 0; b < bands; b++) peaks[b] -= marginDb
  for (let b = 1; b < bands; b++) peaks[b] = Math.max(peaks[b], peaks[b - 1] - 8)
  for (let b = bands - 2; b >= 0; b--) peaks[b] = Math.max(peaks[b], peaks[b + 1] - 16)
  for (let b = 0; b < bands; b++) peaks[b] = Math.max(peaks[b], floorDb)
}

/** Above this the output is the sum of both sides: the side signal is dropped from the top down as far as Loss × (1 − Stereo) says. */
export const codecMonoHz = (loss: number, stereo: number): number =>
  Math.pow(2, 14.2877 - 11.9658 * loss * (1 - stereo))

/** The share of the stream's packets that Dropouts loses or Stutter holds, in the long run. */
const packetShare = (amount: number): number => 0.5 * amount * Math.sqrt(amount)

const CODEC_PAST_SEC = 4
const CODEC_SLOTS = 240
const HIGH_CUT_OFF = 19900

function codecHandles(view: DisplayView): DisplayHandle[] {
  const { band } = twoBoxes(view, 18)
  const cutHz = codecSeverity(view.value('loss')).cutHz
  const loss: DisplayHandle = {
    key: 'loss',
    name: 'Loss',
    x: clamp(xOfHz(cutHz, band), band.x, band.x + band.w),
    y: band.y + band.h * 0.45,
    // Across is the top of what is kept: to the left loses more.
    drag: (x) => {
      const to = handTo(x, loss.x, band.x, band.x + band.w)
      if (Number.isNaN(to)) return { loss: view.value('loss') }
      const octaves = 14.4252 - Math.log2(hzOfX(to, band))
      return { loss: Math.pow(clamp(octaves / 2.6521, 0, 1), 2 / 3) }
    },
    reset: () => ({ loss: view.spec('loss')?.default ?? 0.5 }),
  }
  const highCut: DisplayHandle = {
    key: 'highCut',
    name: 'High Cut',
    x: clamp(xOfHz(view.value('highCut'), band), band.x, band.x + band.w),
    y: band.y + 13,
    drag: (x) => {
      const to = handTo(x, highCut.x, band.x, band.x + band.w)
      return {
        highCut: Number.isNaN(to) ? view.value('highCut') : clamp(hzOfX(to, band), 1000, 20000),
      }
    },
    reset: () => ({ highCut: view.spec('highCut')?.default ?? 20000 }),
  }
  return [loss, highCut]
}

/**
 * How many samples the picture's spectrum of what goes in is made from: as
 * many as one of the codec's frames spans (twice its coefficients), so the
 * picture tells apart what the codec can tell apart and no more. Short
 * frames get twice that, or their spectrum would jump about.
 */
function codecBins(frame: number, sampleRate: number): number {
  const choice = clamp(Math.round(frame), 0, 2)
  const span = 2 * CODEC_FRAMES[choice] * (sampleRate >= 70000 ? 2 : 1)
  return Math.min(2048, choice === 0 ? 2 * span : span)
}

interface CodecState {
  boxes: Layout
  columns: Columns
  input: Bins
  /** Frames since the spectrum going in was taken, and the time. */
  turn: number
  since: number
  /** The stream's recent peak, dB: it is let go over a second and a half. */
  reference: number
  /** What the codec's bands were laid out for, their edges in Hz, and where each stands along the foot. */
  made: Float64Array
  edges: number[]
  edgeX: Float64Array
  /** Per column: the band it is in, and the frequencies at its middle and its two sides. */
  bandOf: Int16Array
  centreHz: Float32Array
  fromHz: Float32Array
  toHz: Float32Array
  /** What Loss means now, and what it was worked out for. */
  lossFor: Float64Array
  marginDb: number
  floorDb: number
  cutHz: number
  /** What the verdict on each column was reached for, apart from the spectrum. */
  verdictFor: Float64Array
  limit: Float32Array
  /** The spectrum going in, in two parts: the columns the codec keeps, and the ones it throws away. */
  kept: Path
  lost: Path
  stair: Path
  sounding: boolean
  fanFor: Float64Array
  fan: Path
  /** The stream of packets: 0 flowing, 1 lost, 2 stuck. */
  packets: History
  lostCount: Counter
  stuckCount: Counter
}

const lowBitrate = plateDisplay<CodecState>({
  place: 'window',
  columns: 2,
  params: ['loss', 'mode', 'frame', 'dropouts', 'stutter', 'stereo', 'highCut', 'mix'],
  live: { meters: true, signal: true, spectrum: true },
  info: 'Above, the spectrum going in and the line under which the codec throws detail away: kept in the ink, lost in the second colour, with a mark at the top where stereo folds to mono. Drag the points for Loss and High Cut. Below, the stream of packets: a gap is lost, the second colour is stuck.',
  init: () => ({
    boxes: newLayout(),
    columns: newColumns(),
    input: new Bins(1024),
    turn: 0,
    since: 0,
    reference: SILENT_DB,
    made: newKey(),
    edges: [],
    edgeX: new Float64Array(0),
    bandOf: new Int16Array(0),
    centreHz: new Float32Array(0),
    fromHz: new Float32Array(0),
    toHz: new Float32Array(0),
    lossFor: newKey(),
    marginDb: 0,
    floorDb: 0,
    cutHz: 0,
    verdictFor: newKey(),
    limit: new Float32Array(32),
    kept: newPath(),
    lost: newPath(),
    stair: newPath(),
    sounding: false,
    fanFor: newKey(),
    fan: newPath(17),
    packets: new History(CODEC_PAST_SEC, CODEC_SLOTS, 0, 'max'),
    lostCount: new Counter(),
    stuckCount: new Counter(),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const boxes = layout(state.boxes, frame, 18)
    const { band, past } = boxes
    const sr = frame.sampleRate
    const foot = band.y + band.h
    const right = band.x + band.w
    const loss = frame.value('loss')
    const mode = clamp(Math.round(frame.value('mode')), 0, 2)
    const scattered = mode === 2
    const residue = mode === 1
    if (stale(state.lossFor, loss)) {
      const severity = codecSeverity(loss)
      state.marginDb = severity.marginDb
      state.floorDb = severity.floorDb
      state.cutHz = severity.cutHz
    }
    const highCut = frame.value('highCut')
    const cutOn = highCut < HIGH_CUT_OFF
    // Nothing is kept above the lower of the two cuts; scattering has no cut of its own.
    const cutHz = scattered ? 30000 : state.cutHz
    const topHz = Math.min(cutHz, cutOn ? highCut : 30000)
    // With none of the codec in the mix nothing it loses is missed: the picture
    // rests, and all of the range is kept.
    const mixed = mixOf(frame) > QUIET
    const running = frame.signal !== null && frame.dt > 0 && mixed
    const choice = clamp(Math.round(frame.value('frame')), 0, 2)
    const columns = Math.floor(band.w / 2) + 1
    let laid = false
    if (stale(state.made, choice, sr, band.x, band.w)) {
      laid = true
      state.edges = codecBands(choice, sr)
      const size = codecBins(choice, sr)
      if (state.input.size !== size) state.input = new Bins(size)
      const count = state.edges.length - 1
      if (state.edgeX.length !== count) state.edgeX = new Float64Array(count)
      for (let b = 1; b < count; b++) {
        const hz = state.edges[b]
        state.edgeX[b] = hz < 20 || hz > 20000 ? NaN : xOfHz(hz, band)
      }
      if (state.bandOf.length !== columns) {
        state.bandOf = new Int16Array(columns)
        state.centreHz = new Float32Array(columns)
        state.fromHz = new Float32Array(columns)
        state.toHz = new Float32Array(columns)
      }
      let b = 0
      for (let i = 0; i < columns; i++) {
        const x = band.x + Math.min(band.w, i * 2)
        const centre = hzOfX(x, band)
        state.centreHz[i] = centre
        state.fromHz[i] = hzOfX(x - 1, band)
        state.toHz[i] = hzOfX(x + 1, band)
        while (b < count - 1 && centre >= state.edges[b + 1]) b += 1
        state.bandOf[i] = b
      }
    }
    const { edges, input } = state
    const bands = edges.length - 1

    grid(frame, band)
    // The codec's bands, along the foot: all the marks in one stroke.
    ctx.beginPath()
    for (let b = 1; b < bands; b++) {
      const x = state.edgeX[b]
      if (Number.isNaN(x)) continue
      ctx.moveTo(crisp(x), foot)
      ctx.lineTo(crisp(x), foot - 3)
    }
    ctx.globalAlpha = INK.back
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.lineCap = 'round'
    ctx.stroke()
    ctx.globalAlpha = 1

    // The spectrum of what goes in, taken every second frame.
    const wave = frame.signal ? (frame.signal.input ?? frame.signal.output).wave : null
    let taken = false
    if (wave && running) {
      state.since += frame.dt
      if (state.turn === 0) {
        input.read(wave, state.since)
        let loudest = 0
        for (const power of input.power) if (power > loudest) loudest = power
        const loudestDb = db10(loudest)
        state.reference = Math.max(loudestDb, state.reference - (8.686 * state.since) / 1.5)
        state.sounding = loudestDb > -100
        state.since = 0
        taken = true
      }
      state.turn = (state.turn + 1) % 2
    } else {
      state.sounding = false
    }

    const judged = stale(state.verdictFor, loss, mode, highCut, band.y, band.h)
    if (state.sounding && (taken || judged || laid)) {
      // Each band's loudest, then the level under which the codec drops what is in it.
      const binHz = sr / input.size
      const { limit } = state
      for (let b = 0; b < bands; b++)
        limit[b] = db10(loudestBin(input.power, binHz, edges[b], edges[b + 1] - binHz))
      if (!scattered && loss > 1e-4)
        codecThreshold(limit, bands, state.marginDb, state.reference - state.floorDb)
      else limit.fill(SILENT_DB)
      // A column whose loudest is over its band's line is kept; under it, or past the codec's own cut, it is thrown
      // away. What is past High Cut is in neither part: that cut comes after everything.
      const kept = sized(state.kept, 2 * columns)
      const lost = sized(state.lost, 2 * columns)
      for (let i = 0; i < columns; i++) {
        const x = band.x + Math.min(band.w, i * 2)
        const centre = state.centreHz[i]
        // On the family's scale, where a tone at full level reads −14 dB.
        const level = db10(loudestBin(input.power, binHz, state.fromHz[i], state.toHz[i]))
        const y = clamp(yOfDb(level + TONE_DB, band, TOP_DB, FOOT_DB), band.y, foot)
        const gone = cutOn && centre > highCut
        const keeps = !gone && centre <= cutHz && level >= limit[state.bandOf[i]]
        kept.x[2 * i] = lost.x[2 * i] = Math.max(band.x, x - 1)
        kept.x[2 * i + 1] = lost.x[2 * i + 1] = Math.min(right, x + 1)
        kept.y[2 * i] = kept.y[2 * i + 1] = keeps ? y : foot
        lost.y[2 * i] = lost.y[2 * i + 1] = keeps || gone ? foot : y
      }
      const stair = sized(state.stair, 2 * bands)
      let count = 0
      if (!scattered && loss > 1e-4) {
        for (let b = 0; b < bands; b++) {
          if (edges[b] >= topHz) break
          const y = clamp(yOfDb(limit[b] + TONE_DB, band, TOP_DB, FOOT_DB), band.y, foot)
          stair.x[count] = xOfHz(Math.max(edges[b], 20), band)
          stair.x[count + 1] = xOfHz(Math.min(edges[b + 1], topHz), band)
          stair.y[count] = stair.y[count + 1] = y
          count += 2
        }
      }
      stair.n = count
    }

    const topX = mixed ? clamp(xOfHz(topHz, band), band.x, right) : right
    if (state.sounding) {
      clipTo(ctx, band.x, band.y, band.w, band.h)
      // Kept in the ink, lost in the second colour. Residue plays the lost part.
      fillUnder(ctx, state.kept, foot, colours.ink, residue ? INK.fill : 0.5)
      if (!scattered) fillUnder(ctx, state.lost, foot, colours.accent, residue ? 0.75 : 0.45)
      // What comes out, as a line: Smear holds it up after the sound has gone, a lost packet drops it.
      if (spectrumPath(frame, band, state.columns))
        strokePath(ctx, state.columns.path, colours.ink, 1, INK.back)
      strokePath(ctx, state.stair, colours.ink, 1.25)
      ctx.restore()
    } else if (!scattered) {
      // No sound: the part of the range that is kept, or in Residue the part that is thrown away and played.
      if (residue && mixed) bar(ctx, topX, band.y, right - topX, band.h, colours.accent, INK.fill)
      else bar(ctx, band.x, band.y, topX - band.x, band.h, colours.ink, INK.ground)
    }

    // The cuts: Loss takes the top away, High Cut cuts whatever is left.
    const lossX = xOfHz(cutHz, band)
    if (!scattered && lossX <= right)
      line(ctx, lossX, band.y, lossX, foot, colours.ink, cutHz <= topHz ? 1 : INK.rule)
    const highX = xOfHz(highCut, band)
    if (cutOn) line(ctx, highX, band.y, highX, foot, colours.ink, highCut <= topHz ? 1 : INK.rule)
    // Two sides as two lines along the top, one from where they are folded together.
    const monoX = clamp(xOfHz(codecMonoHz(loss, frame.value('stereo')), band), band.x, right)
    const apart = Math.max(band.x, monoX - 2)
    line(ctx, band.x, band.y + 1, apart, band.y + 1, colours.ink, INK.text)
    line(ctx, band.x, band.y + 4, apart, band.y + 4, colours.ink, INK.text)
    if (monoX < right - 1)
      line(ctx, monoX, band.y + 2.5, right, band.y + 2.5, colours.ink, INK.text)

    // The handles: Loss on the codec's own cut, High Cut on its edge.
    const lossSpotX = clamp(xOfHz(state.cutHz, band), band.x, right)
    const lossSpotY = band.y + band.h * 0.45
    if (scattered) {
      // Scattered turns each coefficient's phase by up to ±Loss × 180°: the fan round the point.
      const fan = state.fan
      const steps = 16
      if (stale(state.fanFor, loss, lossSpotX, lossSpotY)) {
        sized(fan, steps + 1)
        for (let i = 0; i <= steps; i++) {
          const angle = Math.PI + ((i / steps) * 2 - 1) * loss * Math.PI
          fan.x[i] = lossSpotX + 11 * Math.cos(angle)
          fan.y[i] = lossSpotY + 11 * Math.sin(angle)
        }
      }
      strokePath(ctx, fan, colours.accent, 2)
      line(ctx, lossSpotX, lossSpotY, fan.x[0], fan.y[0], colours.accent)
      line(ctx, lossSpotX, lossSpotY, fan.x[steps], fan.y[steps], colours.accent)
    }
    knob(frame, lossSpotX, lossSpotY, frame.hot === 'loss')
    knob(frame, clamp(highX, band.x, right), band.y + 13, frame.hot === 'highCut')
    if (frame.hot === 'loss' && !scattered)
      text(frame, hzText(state.cutHz), band.x + 1, band.y + 14, LEFT)
    else if (frame.hot === 'highCut') text(frame, hzText(highCut), band.x + 1, band.y + 14, LEFT)

    // Below: the stream of packets over the last seconds.
    divide(frame, boxes)
    const ribbonY = past.y + 2
    const ribbonH = past.h - 8
    // How much of the stream the settings lose and hold, in the long run: a share of the line, from the right.
    const sharesY = past.y + past.h - 3
    const stuck = packetShare(frame.value('stutter')) * past.w
    const lost = packetShare(frame.value('dropouts')) * past.w
    bar(ctx, past.x, sharesY, past.w - stuck - lost, 2, colours.ink, INK.back)
    bar(ctx, past.x + past.w - stuck, sharesY, stuck, 2, colours.accent)
    if (!running || !frame.hasMeter('packet')) {
      state.lostCount.rest()
      state.stuckCount.rest()
      bar(ctx, past.x, ribbonY, past.w, ribbonH, colours.ink, INK.fill)
      return
    }
    // An event shorter than the gap between two readings is still counted.
    if (state.lostCount.more(frame.meter('lost'), frame.now) > 0) state.packets.push(frame.now, 1)
    if (state.stuckCount.more(frame.meter('stuck'), frame.now) > 0) state.packets.push(frame.now, 2)
    // With no sound in and none out the device sleeps and its last packet's state stands: a stream of nothing loses nothing.
    const asleep = frame.signal?.output.peak === 0 && frame.signal.input?.peak === 0
    state.packets.push(frame.now, asleep ? 0 : Math.round(frame.meter('packet')))
    const slot = past.w / CODEC_SLOTS
    let from = 0
    for (let i = 1; i <= CODEC_SLOTS; i++) {
      const kind = state.packets.at(CODEC_SLOTS - 1 - from)
      if (i < CODEC_SLOTS && state.packets.at(CODEC_SLOTS - 1 - i) === kind) continue
      if (kind === 0)
        bar(ctx, past.x + from * slot, ribbonY, (i - from) * slot, ribbonH, colours.ink, 0.42)
      else if (kind === 2)
        bar(ctx, past.x + from * slot, ribbonY, (i - from) * slot, ribbonH, colours.accent)
      from = i
    }
  },
  handles: (view) => codecHandles(view),
})

// --- Vintage Digital --------------------------------------------------------

// `band_split.h`: the ninth-order elliptic low-pass as two chains of allpasses,
// its edge at 1: the real pole, and four pole pairs in order of rising Q.
const SPLIT_SIGMA = 0.376207429
const SPLIT_W0 = [0.559216356, 0.804303955, 0.952849823, 1.016167021]
const SPLIT_K = [1 / 0.882510652, 1 / 2.026083885, 1 / 4.873784954, 1 / 17.864700141]

/**
 * How much of a tone the steep filter's low side keeps, as a power, at
 * `ratio` times its edge (on the scale the bilinear transform bends, see
 * `splitRatio`). The two chains only turn the phase; half their sum is the
 * low side, so what it keeps is cos² of half the angle between them, and the
 * high side has the rest.
 */
export function splitLow(ratio: number): number {
  const pair = (i: number): number => {
    const u = ratio / SPLIT_W0[i]
    return -2 * Math.atan2(SPLIT_K[i] * u, 1 - u * u)
  }
  const first = -2 * Math.atan(ratio / SPLIT_SIGMA) + pair(1) + pair(3)
  const second = pair(0) + pair(2)
  return Math.cos((first - second) / 2) ** 2
}

/** Where `hz` stands against the steep filter's edge, 0.44 of the converter's rate. */
const splitRatio = (hz: number, rate: number, sampleRate: number): number =>
  Math.tan((Math.PI * Math.min(hz, 0.499 * sampleRate)) / sampleRate) /
  Math.tan((Math.PI * Math.min(0.44 * rate, 0.47 * sampleRate)) / sampleRate)

/** The converter's rate: Rate, and at the host's rate or 48 kHz the sampler is switched out. */
function converterRate(view: DisplayView, sampleRate: number): { rate: number; out: boolean } {
  const top = Math.min(48000, sampleRate)
  const rate = view.value('rate')
  return { rate: Math.min(rate, top), out: rate >= top }
}

/**
 * What gets past the filter in front of the sampler, as a power: all of what
 * is under its edge, and of what is over it the share Aliasing lets through
 * (its square, as a gain), which the sampler then folds back down.
 */
export function converterInput(
  aliasing: number,
  hz: number,
  rate: number,
  sampleRate: number,
): number {
  const low = splitLow(splitRatio(hz, rate, sampleRate))
  return low + aliasing ** 4 * (1 - low)
}

/**
 * What follows the sampler, in dB: the droop of a held sample, sin(x) / x
 * with x = π·f / rate (3.9 dB at half the rate, and the level its images come
 * out at above it), then the output filter: none, two poles at half the rate,
 * or the steep filter again.
 */
export function converterOutputDb(
  filter: number,
  hz: number,
  rate: number,
  sampleRate: number,
): number {
  const turn = (Math.PI * hz) / rate
  let db = db20(Math.abs(Math.sin(turn) / turn))
  if (filter === 1)
    db += db10(
      power(svf('low', hz, Math.min(0.5 * rate, 0.49 * sampleRate), Math.SQRT1_2, sampleRate)),
    )
  else if (filter === 2) db += db10(splitLow(splitRatio(hz, rate, sampleRate)))
  return db
}

/**
 * The size of the quantiser's step for a signal at `level` (linear). Linear
 * coding has one step, 2^(1 − Bits). Mu-law counts in the same steps along
 * log2(1 + 255·|x|) / 8, which makes them 33 dB finer at nothing and 15 dB
 * coarser at full scale.
 */
export function converterStep(bits: number, mu: boolean, level: number): number {
  const step = Math.pow(2, 1 - bits)
  return mu ? (step * 8 * Math.LN2 * (1 + 255 * Math.abs(level))) / 255 : step
}

/** What a bit is worth: each one halves the quantiser's step. */
const BIT_DB = 6.0206
/** How many samples of the wave Vintage Digital's strip shows: 4 ms at 48 kHz. */
const DIGITAL_SPAN = 192
/** The level a signal is taken to be at where there is none to measure: −18 dBFS, where the device's make-up holds it. */
const DIGITAL_NOMINAL = 0.125

/**
 * Drive, as `vintage_digital.h` has it: the gain in front of the converter,
 * and the make-up after it that holds a signal at −18 dBFS about where it
 * came in. The converter's grain is made between the two, so the make-up
 * turns it down with the rest: 11 dB at Drive 12, 17 dB at 24.
 */
export function converterDrive(driveDb: number): { gain: number; makeUp: number } {
  const gain = fromDb(driveDb)
  const reference = DIGITAL_NOMINAL * DIGITAL_NOMINAL
  return { gain, makeUp: Math.sqrt((1 + reference * gain * gain) / (1 + reference)) / gain }
}

/**
 * The grain of the quantiser as the spectrum shows it under 1 kHz, in dB,
 * for a signal that comes in at `level`: white noise of a twelfth of the
 * step's square at the converter's rate, as loud as Drive's make-up leaves it.
 */
function grainDb(view: DisplayView, level: number, sampleRate: number, binHz: number): number {
  const { rate } = converterRate(view, sampleRate)
  const { gain, makeUp } = converterDrive(view.value('drive'))
  const step = converterStep(
    view.value('bits'),
    view.value('companding') >= 0.5,
    Math.min(1, level * gain),
  )
  return noiseBinDb(((step * step) / 12) * (sampleRate / rate), sampleRate, binHz) + db20(makeUp)
}

function digitalHandles(view: DisplayView): DisplayHandle[] {
  const { band } = twoBoxes(view, 28)
  const sampleRate = 48000
  const foot = band.y + band.h
  const rate: DisplayHandle = {
    key: 'rate',
    name: 'Rate',
    x: clamp(xOfHz(view.value('rate') / 2, band), band.x, band.x + band.w),
    y: band.y + band.h * 0.4,
    // Across is half the rate: what is above it cannot be kept.
    drag: (x) => {
      const to = handTo(x, rate.x, band.x, band.x + band.w)
      return {
        rate: Number.isNaN(to) ? view.value('rate') : clamp(2 * hzOfX(to, band), 1000, 48000),
      }
    },
    reset: () => ({ rate: view.spec('rate')?.default ?? 9000 }),
  }
  const grain = grainDb(view, DIGITAL_NOMINAL, sampleRate, sampleRate / TAP_BINS)
  const set = view.value('bits')
  const bits: DisplayHandle = {
    key: 'bits',
    name: 'Bits',
    x: band.x + 9,
    y: clamp(yOfDb(grain, band, TOP_DB, FOOT_DB), band.y, foot),
    // Up is a coarser step: the grain rises 6 dB for each bit taken away. The
    // finest grain lies under the picture, and the point is taken from where it lies.
    drag: (_x, y, hold) => ({
      bits: carried(
        hold,
        set,
        y,
        bits.y,
        (at) => yOfDb(grain - BIT_DB * (at - set), band, TOP_DB, FOOT_DB),
        (to) => clamp(set + (grain - dbOfY(to, band, TOP_DB, FOOT_DB)) / BIT_DB, 4, 16),
      ),
    }),
    reset: () => ({ bits: view.spec('bits')?.default ?? 12 }),
  }
  return [rate, bits]
}

/** How many samples the picture's spectrum of what goes in is made from: bins 47 Hz apart at 48 kHz, finer than a column of the picture from 400 Hz up. */
const DIGITAL_BINS = 1024

/**
 * Where each bin of a spectrum lands once a sampler at `rate` has folded it:
 * the bin of its distance from the nearest multiple of the rate. Everything
 * a sampler puts out at a frequency came from one of the bins that land on
 * that frequency's own.
 */
export function foldedBins(alias: Uint16Array, rate: number, binHz: number): void {
  const top = Math.max(0, Math.round(rate / 2 / binHz))
  for (let b = 0; b < alias.length; b++) {
    const hz = b * binHz
    alias[b] = Math.min(top, Math.round(Math.abs(hz - Math.round(hz / rate) * rate) / binHz))
  }
}

interface DigitalState {
  boxes: Layout
  columns: Columns
  input: Bins
  /** Frames since the spectrum going in was taken, and the time. */
  turn: number
  since: number
  made: Float64Array
  setFor: Float64Array
  response: Curve
  before: Curve
  /** Per bin of the input: what the filter before the sampler lets through, and the bin it folds to. */
  let: Float32Array
  alias: Uint16Array
  /** Per bin: the power that reaches the sampler now, and all that lands on that bin once folded. */
  reach: Float32Array
  folded: Float32Array
  /** Per column of the picture: the bins of the input it holds, as `Columns` has them. */
  first: Int16Array
  last: Int16Array
  between: Float32Array
  /** How fast what reaches the sampler moves: the sum of each tone's power by the square of its angular frequency. */
  slope: number
  sounding: boolean
  added: Path
  set: Path
  wave: Path
  /** Where the two handles stand: x and y of Rate, then of Bits. */
  spots: Float64Array
}

const vintageDigital = plateDisplay<DigitalState>({
  place: 'window',
  columns: 2,
  params: ['rate', 'bits', 'companding', 'aliasing', 'filter', 'jitter', 'drive'],
  live: { meters: false, signal: true, spectrum: true },
  info: 'Above, the spectrum with half the sample rate marked: the line is what the hold and the output filter leave, the dashes what is let in to fold back, the second colour what the converter adds. Drag the points for Rate and Bits. Below, the wave, with a mark for each sample held.',
  init: () => ({
    boxes: newLayout(),
    columns: newColumns(),
    input: new Bins(DIGITAL_BINS),
    turn: 0,
    since: 0,
    made: newKey(),
    setFor: newKey(),
    response: newCurve(),
    before: newCurve(),
    let: new Float32Array(DIGITAL_BINS / 2 + 1),
    alias: new Uint16Array(DIGITAL_BINS / 2 + 1),
    reach: new Float32Array(DIGITAL_BINS / 2 + 1),
    folded: new Float32Array(DIGITAL_BINS / 2 + 1),
    first: new Int16Array(0),
    last: new Int16Array(0),
    between: new Float32Array(0),
    slope: 0,
    sounding: false,
    added: newPath(),
    set: newPath(),
    wave: newPath(),
    spots: new Float64Array(4),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const boxes = layout(state.boxes, frame, 28)
    const { band, past } = boxes
    const sr = frame.sampleRate
    const binHz = binHzOf(frame)
    const foot = band.y + band.h
    const top = Math.min(48000, sr)
    const rate = Math.min(frame.value('rate'), top)
    const out = frame.value('rate') >= top
    const aliasing = frame.value('aliasing')
    const filter = Math.round(frame.value('filter'))
    const jitter = frame.value('jitter')
    const bits = frame.value('bits')
    const mu = frame.value('companding') >= 0.5
    const drive = frame.value('drive')
    const { gain, makeUp } = converterDrive(drive)
    // What a signal under full scale keeps of its level through Drive and the make-up.
    const kept = gain * makeUp
    const columns = curveLength(band)
    const inHz = sr / DIGITAL_BINS
    const bins = DIGITAL_BINS / 2

    // The curves, and where each bin of the input goes, again only when a control has moved.
    const remade = stale(
      state.made,
      rate,
      out ? 1 : 0,
      filter,
      aliasing,
      sr,
      frame.width,
      frame.height,
    )
    if (remade) {
      fillCurve(state.response, band, (hz) => (out ? 0 : converterOutputDb(filter, hz, rate, sr)))
      fillCurve(state.before, band, (hz) =>
        out ? 0 : db10(converterInput(aliasing, hz, rate, sr)),
      )
      for (let b = 0; b <= bins; b++) state.let[b] = converterInput(aliasing, b * inHz, rate, sr)
      foldedBins(state.alias, rate, inHz)
      if (state.first.length !== columns) {
        state.first = new Int16Array(columns)
        state.last = new Int16Array(columns)
        state.between = new Float32Array(columns)
      }
      for (let i = 0; i < columns; i++) {
        const x = band.x + Math.min(band.w, i * 2)
        const from = hzOfX(x - 1, band)
        const to = hzOfX(x + 1, band)
        if (to - from < inHz) {
          state.between[i] = clamp((from + to) / 2 / inHz, 0, bins - 0.001)
        } else {
          state.between[i] = -1
          state.first[i] = clamp(Math.ceil(from / inHz), 0, bins)
          state.last[i] = clamp(Math.floor(to / inHz), state.first[i], bins)
        }
      }
    }
    // The quantiser's grain alone, where Bits puts it for a signal at a working level: the line its point rides on.
    const reset = stale(state.setFor, bits, mu ? 1 : 0, binHz, drive)
    if (remade || reset) {
      const grain = grainDb(frame, DIGITAL_NOMINAL, sr, binHz)
      const set = sized(state.set, columns)
      for (let i = 0; i < columns; i++) {
        set.x[i] = band.x + Math.min(band.w, i * 2)
        set.y[i] = clamp(
          yOfDb(grain + state.response.db[i], band, TOP_DB, FOOT_DB),
          band.y - 4,
          foot + 4,
        )
      }
      const points = digitalHandles(frame)
      state.spots[0] = points[0].x
      state.spots[1] = points[0].y
      state.spots[2] = points[1].x
      state.spots[3] = points[1].y
    }

    // The spectrum of what goes in, taken every second frame.
    const going = frame.signal ? (frame.signal.input ?? frame.signal.output) : null
    const running = going !== null && frame.dt > 0
    const sounding = running && going.peak * gain > 0.5 * converterStep(bits, mu, 0)
    let taken = false
    if (going && running) {
      state.since += frame.dt
      if (state.turn === 0) {
        state.input.read(going.wave, state.since)
        state.since = 0
        taken = true
      }
      state.turn = (state.turn + 1) % 2
    }
    if (sounding && (taken || remade || reset || !state.sounding)) {
      // What reaches the sampler, bin by bin, and how fast it moves: a clock that strays reads a moving wave wrong.
      const { reach, folded, alias } = state
      const power = state.input.power
      let slope = 0
      folded.fill(0)
      for (let b = 0; b <= bins; b++) {
        // A tone of amplitude a has the power a² / 2; its bin and the two beside it hold 1.5 a².
        const tone = (power[b] / 2) * state.let[b]
        reach[b] = tone
        folded[alias[b]] += tone
        slope += (2 * Math.PI * b * inHz) ** 2 * (tone / 1.5)
      }
      state.slope = slope
      // How loud the sound going in is: the grain is there only while there is a signal to round.
      // The step is made after Drive and so comes out smaller by the make-up; what a
      // straying clock adds is part of the signal and keeps its level with it.
      const strays = (jitter * jitter * 0.12) / rate
      const step = converterStep(bits, mu, Math.min(1, going.rms * gain)) * makeUp
      const grain = (step * step) / 12 + (out ? 0 : kept * kept * slope * strays * strays)
      // The grain, white at the converter's rate, as the spectrum reads it.
      const noise = Math.pow(10, noiseBinDb(grain * (out ? 1 : sr / rate), sr, binHz) / 10)
      // A tone of power a² / 2 reads 20·log10(a) − 14 dB on the spectrum.
      const asTone = 2 * Math.pow(10, TONE_DB / 10)
      const added = sized(state.added, columns)
      for (let i = 0; i < columns; i++) {
        // Every copy of the input that lands here from a multiple of the rate away: all that lands, less what was here.
        let copies = 0
        if (!out) {
          const at = state.between[i]
          if (at >= 0) {
            const below = Math.floor(at)
            const one = folded[alias[below]] - reach[below]
            const other = folded[alias[below + 1]] - reach[below + 1]
            copies = one + (other - one) * (at - below)
          } else {
            const last = state.last[i]
            for (let b = state.first[i]; b <= last; b++) {
              const here = folded[alias[b]] - reach[b]
              if (here > copies) copies = here
            }
          }
        }
        const db = db10(Math.max(0, copies) * kept * kept * asTone + noise) + state.response.db[i]
        added.x[i] = band.x + Math.min(band.w, i * 2)
        added.y[i] = clamp(yOfDb(db, band, TOP_DB, FOOT_DB), band.y - 4, foot + 4)
      }
    }
    state.sounding = sounding

    grid(frame, band)
    drawUnchanged(frame, band)
    clipTo(ctx, band.x, band.y, band.w, band.h)
    drawSpectrum(frame, band, state.columns)
    strokePath(ctx, state.set, colours.accent, 1, sounding ? INK.back : 1, DASHED)
    if (sounding) {
      fillUnder(ctx, state.added, foot + 4, colours.accent, 0.45)
      strokePath(ctx, state.added, colours.accent, 1.25)
    }
    if (!out) {
      // Half the rate: what was above it comes back under it.
      const x = xOfHz(rate / 2, band)
      line(ctx, x, band.y, x, foot, colours.accent, 1, 1, DASHED)
      strokePath(
        ctx,
        curvePath(state.before, band, CURVE_TOP_DB, CURVE_FOOT_DB),
        colours.ink,
        1,
        INK.back,
        DASHED,
      )
    }
    drawResponse(frame, band, state.response)
    ctx.restore()
    knob(frame, state.spots[0], state.spots[1], frame.hot === 'rate')
    knob(frame, state.spots[2], state.spots[3], frame.hot === 'bits')
    if (frame.hot === 'rate') text(frame, hzText(rate), band.x + 1, band.y + 8, LEFT)
    else if (frame.hot === 'bits')
      text(frame, `${bits.toFixed(1).replace(/\.0$/, '')} bit`, band.x + 1, band.y + 8, LEFT)

    // Below: the wave as it comes out, 4 ms of it.
    divide(frame, boxes)
    const middle = past.y + past.h / 2
    const span = Math.round((DIGITAL_SPAN * sr) / 48000)
    if (!out) drawHolds(frame, past, span, sr / rate, 0.24 * jitter * jitter)
    const heard = frame.signal?.output
    if (!heard || !running || heard.peak < 1e-5) {
      line(ctx, past.x, middle, past.x + past.w, middle, colours.ink, INK.grid)
      return
    }
    clipTo(ctx, past.x, past.y, past.w, past.h)
    const start = risingEdge(heard.wave, span)
    let peak = 0.02
    for (let i = 0; i <= span && start + i < heard.wave.length; i++) {
      const size = Math.abs(heard.wave[start + i])
      if (size > peak) peak = size
    }
    // The levels the quantiser has, where they are far enough apart to see.
    const apart = ((converterStep(bits, false, 0) * makeUp) / peak) * (past.h / 2 - 1)
    if (!mu && apart >= 3)
      for (let y = apart; y < past.h / 2; y += apart) {
        line(ctx, past.x, middle - y, past.x + past.w, middle - y, colours.ink, INK.grid)
        line(ctx, past.x, middle + y, past.x + past.w, middle + y, colours.ink, INK.grid)
      }
    line(ctx, past.x, middle, past.x + past.w, middle, colours.ink, INK.grid)
    drawWave(frame, past, state.wave, heard.wave, span)
    ctx.restore()
  },
  handles: (view) => digitalHandles(view),
})

// --- Noise Floor ------------------------------------------------------------

const NOISE_BEDS = ['tape', 'vinyl', 'room', 'hum50', 'hum60', 'static', 'air'] as const
type NoiseBed = (typeof NOISE_BEDS)[number]
// `noise_floor.h`: where Tone's two filters stand open and where they end, per bed.
const DARK_OPEN_HZ = [18000, 9000, 2000, 1, 1, 5000, 18000]
const DARK_HZ = [2500, 450, 80, 1, 1, 900, 5000]
const THIN_OPEN_HZ = [500, 100, 30, 1, 1, 300, 3000]
const THIN_HZ = [6000, 900, 300, 1, 1, 1200, 9000]
/** `kToneLevelDb`: the level Tone adds from −1 to 1 in quarters, which the device takes back out. */
const TONE_LEVEL_DB = [
  [-16.57, -12.07, -7.77, -3.93, 0, -0.07, -0.18, -0.48, -1.23],
  [-5.46, -2.38, -0.78, -0.21, 0, -0.75, -1.4, -2.54, -4.35],
  [-4.72, -2.19, -0.9, -0.29, 0, -1.54, -2.77, -4.44, -6.59],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [-4.57, -2.83, -1.64, -0.86, 0, -1.03, -1.62, -2.41, -3.45],
  [-12.54, -9.05, -5.96, -3.27, 0, -0.47, -0.76, -1.2, -1.88],
]

function toneLevelDb(bed: number, tone: number): number {
  const at = (clamp(tone, -1, 1) + 1) * 4
  const index = clamp(Math.floor(at), 0, 7)
  const row = TONE_LEVEL_DB[bed]
  return row[index] + (row[index + 1] - row[index]) * (at - index)
}

/**
 * One bed of `noise_beds.h` at a frequency, before Level and Tone: what its
 * filters make of white noise of power 1 per sample at 48 kHz. Each bed
 * measures an RMS of about 1; the ticks and pops over the record and the
 * static are events, not floor, and are not in this.
 */
export function noiseBedPower(bed: NoiseBed, hz: number, sampleRate: number): number {
  const sr = sampleRate
  switch (bed) {
    case 'tape': {
      // TapeHiss: a shelf 18 dB down below 1 kHz that levels off at 8.5 kHz.
      const shelf = cadd(cx(1), cscale(trapezoid(hz, 8500, sr), -0.875))
      return 2.008 ** 2 * power(cmul(svf('low', hz, 16000, 0.6, sr), shelf))
    }
    case 'vinyl': {
      // Vinyl: a dull surface from 200 Hz to 1 kHz over a trace of hiss, and a rumble at 42 Hz.
      const surface = cmul(svf('low', hz, 1000, 0.6, sr), onePoleHigh(hz, 200, sr))
      const rumble = cscale(svf('band', hz, 42, 0.8, sr), 0.85)
      return 5.508 ** 2 * power(cadd(cadd(surface, cx(0.0115)), rumble))
    }
    case 'room': {
      // Room: a rumble under 90 Hz, three modes, ventilation near 220 Hz and a trace of air.
      const low = cmul(dcBlocker(hz, 22, sr), cmul(onePole(hz, 90, sr), onePole(hz, 90, sr)))
      let sum = low
      const modes: [number, number][] = [
        [43, 1],
        [67, 0.8],
        [109, 0.5],
      ]
      for (const [modeHz, weight] of modes)
        sum = cadd(sum, cscale(svf('band', hz, modeHz, 5, sr), 1.44 * weight))
      sum = cadd(sum, cscale(cmul(onePole(hz, 450, sr), svf('band', hz, 220, 0.7, sr)), 0.42))
      sum = cadd(sum, cscale(onePoleHigh(hz, 1500, sr), 0.0047))
      return 9.189 ** 2 * power(sum)
    }
    case 'static':
      // Static: a darkened hiss in a receiver's band, 350 Hz to 3.8 kHz.
      return (
        5.8 ** 2 *
        power(
          cmul(
            trapezoid(hz, 700, sr),
            cmul(svf('high', hz, 350, 0.7, sr), svf('low', hz, 3800, 0.9, sr)),
          ),
        )
      )
    case 'air':
      // Air: nearly all above 5.5 kHz, over a faint flat floor.
      return (
        1.816 ** 2 *
        power(cmul(cadd(svf('high', hz, 5500, 0.5, sr), cx(0.05)), svf('low', hz, 17000, 0.6, sr)))
      )
    default:
      // Hum: the trace of amplifier hiss under it, 26 dB down (its harmonics are lines, see `humLines`).
      return 0.1005 ** 2 * power(cmul(onePoleHigh(hz, 2000, sr), svf('low', hz, 12000, 0.6, sr)))
  }
}

/** What Tone's two filters do to a bed at a frequency, with the level they add taken back out, as a power. */
export function noiseTonePower(bed: number, tone: number, hz: number, sampleRate: number): number {
  const comp = fromDb(-toneLevelDb(bed, tone))
  if (bed === 3 || bed === 4) return comp * comp
  const dark = clamp(-4 * tone, 0, 1)
  const thin = clamp(4 * tone, 0, 1)
  const darkHz = DARK_OPEN_HZ[bed] * Math.pow(DARK_HZ[bed] / DARK_OPEN_HZ[bed], Math.max(0, -tone))
  const thinHz = THIN_OPEN_HZ[bed] * Math.pow(THIN_HZ[bed] / THIN_OPEN_HZ[bed], Math.max(0, tone))
  // y += dark·(lowpass(y) − y), then y −= thin·lowpass(y).
  const darkened = cadd(cx(1 - dark), cscale(svf('low', hz, darkHz, 0.6, sampleRate), dark))
  const thinned = cadd(cx(1), cscale(trapezoid(hz, thinHz, sampleRate), -thin))
  return comp * comp * power(cmul(darkened, thinned))
}

/**
 * The harmonics of mains hum as `HumTables` and `Hum::control` make them:
 * the body (1 to 7) and the buzz (8 to 40), each scaled to an RMS of 1, in
 * the balance Tone sets. Amplitudes, harmonic 1 first.
 */
export function humLines(tone: number): number[] {
  const body = [1, 0.8, 0.45, 0.2, 0.2, 0.1, 0.1]
  const level: number[] = []
  let bodyPower = 0
  let buzzPower = 0
  for (let n = 1; n <= 40; n++) {
    if (n <= 7) {
      level.push(body[n - 1])
      bodyPower += 0.5 * body[n - 1] ** 2
    } else {
      let l = Math.pow(8 / n, 0.9) * (n % 2 ? 0.35 : 1)
      if (n >= 28) l *= Math.cos((Math.PI / 2) * ((n - 28) / 13)) ** 2
      level.push(l)
      buzzPower += 0.5 * l * l
    }
  }
  const ratio = tone < 0 ? 0.15 * (1 + tone) : 0.15 * Math.pow(2, 3 * tone)
  const norm = 1 / Math.sqrt(1 + ratio * ratio + 0.00251)
  return level.map((l, i) =>
    i < 7 ? (l * norm) / Math.sqrt(bodyPower) : (l * norm * ratio) / Math.sqrt(buzzPower),
  )
}

const NOISE_PAST_SEC = 6
/** The levels the strip of the last seconds spans. */
const PAST_TOP_DB = 0
const PAST_FOOT_DB = -78

/** How the noise's own level reads through the sum of both sides: Width sets how much the sides share. */
const noiseSides = (width: number): number => (2 - width * width) / 2

/** The noise floor's curve from the controls: the bed, Tone and Level, as the spectrum shows them. */
function noiseFloorDb(view: DisplayView, hz: number, sampleRate: number, binHz: number): number {
  const bed = clamp(Math.round(view.value('type')), 0, NOISE_BEDS.length - 1)
  const level = fromDb(view.value('level'))
  const width = view.value('width')
  // Hum is brought most of the way to the middle: its hiss follows it there.
  const sides = bed === 3 || bed === 4 ? 1 - 0.151 * width * width : noiseSides(width)
  const variance =
    level *
    level *
    sides *
    noiseBedPower(NOISE_BEDS[bed], hz, 48000) *
    noiseTonePower(bed, view.value('tone'), hz, sampleRate)
  return noiseBinDb(variance, 48000, binHz)
}

const isHum = (view: DisplayView): boolean => {
  const bed = Math.round(view.value('type'))
  return bed === 3 || bed === 4
}

/** The loudest of the hum's harmonics, in dB on the spectrum's scale, for a Level and a Width. */
function humPeakDb(view: DisplayView): number {
  const width = view.value('width')
  let loudest = 0
  for (const amplitude of humLines(view.value('tone'))) loudest = Math.max(loudest, amplitude)
  return view.value('level') + db20(loudest) + db10(1 - 0.151 * width * width) + TONE_DB
}

/** Where the handle of the floor stands: on the floor's highest point. */
function noiseHandle(view: DisplayView, curve: Curve | null): DisplayHandle[] {
  const { band } = twoBoxes(view)
  const floor =
    curve ?? fillCurve(newCurve(), band, (hz) => noiseFloorDb(view, hz, 48000, 48000 / TAP_BINS))
  const hum = isHum(view)
  const mainsHz = Math.round(view.value('type')) === 4 ? 60 : 50
  const peakDb = hum ? humPeakDb(view) : floor.peakDb
  const x = hum ? xOfHz(mainsHz, band) : band.x + floor.peakAt * band.w
  const over = peakDb - view.value('level')
  const spec = view.spec('level')
  const level: DisplayHandle = {
    key: 'level',
    name: 'Level',
    x: clamp(x, band.x + 4, band.x + band.w - 4),
    y: clamp(yOfDb(peakDb, band, TOP_DB, FOOT_DB), band.y, band.y + band.h),
    // Up and down is the level: the floor's highest point follows the pointer.
    drag: (_x, y) => {
      const to = handTo(y, level.y, band.y, band.y + band.h)
      return {
        level: Number.isNaN(to)
          ? view.value('level')
          : clamp(dbOfY(to, band, TOP_DB, FOOT_DB) - over, spec?.min ?? -72, spec?.max ?? -12),
      }
    },
    reset: () => ({ level: spec?.default ?? -42 }),
  }
  return [level]
}

const NOISE_PAST_SLOTS = 60

interface NoiseState {
  boxes: Layout
  columns: Columns
  made: Float64Array
  floor: Curve
  comb: Comb
  /** The level of a hum's harmonic of amplitude 1 with all of the noise up, dB. */
  combDb: number
  /** Where the handle stands. */
  spot: Float64Array
  /** The sound going in and the noise under it over the last seconds, dB. */
  sound: History
  noise: History
  soundPath: Path
  noisePath: Path
  /** Ticks and pops as the device counted them, where they fell. */
  ticked: Tally
  popped: Tally
  ticks: Counter
  pops: Counter
}

const noiseFloor = plateDisplay<NoiseState>({
  place: 'window',
  columns: 2,
  params: ['type', 'level', 'tone', 'width'],
  live: { meters: true, signal: true, spectrum: true },
  info: 'Above, the noise in the second colour under the spectrum of what comes out: its real level at every frequency, hum as lines at its harmonics. Drag its point for the level. Below, the last six seconds: the sound, and the noise riding with it or ducking under it, with its ticks.',
  init: () => ({
    boxes: newLayout(),
    columns: newColumns(),
    made: newKey(),
    floor: newCurve(),
    comb: newComb(),
    combDb: 0,
    spot: new Float64Array(2),
    sound: new History(NOISE_PAST_SEC, NOISE_PAST_SLOTS, PAST_FOOT_DB, 'max'),
    noise: new History(NOISE_PAST_SEC, NOISE_PAST_SLOTS, PAST_FOOT_DB),
    soundPath: newPath(NOISE_PAST_SLOTS),
    noisePath: newPath(NOISE_PAST_SLOTS),
    ticked: new Tally(NOISE_PAST_SEC, NOISE_PAST_SLOTS),
    popped: new Tally(NOISE_PAST_SEC, NOISE_PAST_SLOTS),
    ticks: new Counter(),
    pops: new Counter(),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const boxes = layout(state.boxes, frame)
    const { band, past } = boxes
    const binHz = binHzOf(frame)
    const bed = Math.round(frame.value('type'))
    const hum = bed === 3 || bed === 4
    const set = frame.value('level')
    const width = frame.value('width')
    // Without sound the device sleeps and its noise with it: then only where the controls put it is drawn.
    const running = frame.signal !== null && frame.hasMeter('gain')
    const sounding = running && frame.meter('gain') > 1e-3
    const gain = sounding ? frame.meter('gain') : null

    if (stale(state.made, bed, set, frame.value('tone'), width, binHz, frame.width, frame.height)) {
      fillCurve(state.floor, band, (hz) => noiseFloorDb(frame, hz, 48000, binHz))
      if (hum) fillComb(state.comb, band, humLines(frame.value('tone')), bed === 4 ? 60 : 50)
      state.combDb = set + db10(1 - 0.151 * width * width) + TONE_DB
      const point = noiseHandle(frame, state.floor)[0]
      state.spot[0] = point.x
      state.spot[1] = point.y
    }

    grid(frame, band)
    clipTo(ctx, band.x, band.y, band.w, band.h)
    drawSpectrum(frame, band, state.columns)
    drawFloor(frame, band, state.floor, gain)
    if (hum)
      drawComb(
        frame,
        band,
        state.comb,
        state.combDb + (gain === null ? 0 : db20(gain)),
        gain === null ? INK.back : 1,
      )
    ctx.restore()
    knob(frame, state.spot[0], state.spot[1], frame.hot === 'level')
    if (frame.hot === 'level')
      text(frame, `${Math.round(set)} dB`, band.x + band.w - 1, band.y + 8, RIGHT)

    // Below: the sound and the noise under it, into the past.
    divide(frame, boxes)
    if (frame.signal && running && frame.dt > 0) {
      const going = frame.signal.input ?? frame.signal.output
      state.sound.push(frame.now, gainToDb(going.rms))
      state.noise.push(frame.now, set + db20(frame.meter('gain')))
      state.ticked.push(frame.now, state.ticks.more(frame.meter('ticks'), frame.now))
      state.popped.push(frame.now, state.pops.more(frame.meter('pops'), frame.now))
    } else {
      state.ticks.rest()
      state.pops.rest()
    }
    clipTo(ctx, past.x, past.y, past.w, past.h)
    // Where Level puts the noise, on the strip's scale of levels.
    const level = yOfDb(clamp(set, PAST_FOOT_DB, PAST_TOP_DB), past, PAST_TOP_DB, PAST_FOOT_DB)
    line(
      ctx,
      past.x,
      level,
      past.x + past.w,
      level,
      colours.accent,
      running ? INK.back : 1,
      1,
      DASHED,
    )
    if (running) {
      fillUnder(
        ctx,
        levelPath(state.soundPath, past, state.sound, PAST_TOP_DB, PAST_FOOT_DB),
        past.y + past.h,
        colours.ink,
        0.42,
      )
      const noise = levelPath(state.noisePath, past, state.noise, PAST_TOP_DB, PAST_FOOT_DB)
      // Ticks stand on the noise they belong to, taller the more of them fell together; a pop is a dot over them.
      for (let i = 0; i < noise.n; i++) {
        const back = noise.n - 1 - i
        const ticks = state.ticked.at(back)
        if (ticks > 0)
          line(
            ctx,
            noise.x[i],
            noise.y[i],
            noise.x[i],
            noise.y[i] - 1 - Math.min(7, 2 * ticks),
            colours.accent,
            0.8,
          )
        if (state.popped.at(back) > 0) spot(ctx, noise.x[i], noise.y[i] - 9, 1.5, colours.accent)
      }
      strokePath(ctx, noise, colours.accent, 1.25)
    }
    ctx.restore()
  },
  handles: (view) => noiseHandle(view, null),
})

export const WEAR_FACES: Readonly<Record<string, PlateFace>> = {
  tape: {
    display: tape,
    face: ['drive', 'wow', 'flutter', 'age'],
  },
  vinyl: {
    display: vinyl,
    face: ['warp', 'crackle', 'wear', 'mix'],
  },
  patina: {
    display: patina,
    face: ['medium', 'drive', 'wobble', 'wear'],
  },
  radio: {
    display: radio,
    face: ['band', 'tuning', 'fading', 'static'],
  },
  'low-bitrate': {
    display: lowBitrate,
    face: ['loss', 'dropouts', 'smear', 'mix'],
  },
  'vintage-digital': {
    display: vintageDigital,
    face: ['rate', 'bits', 'aliasing', 'jitter'],
  },
  'noise-floor': {
    display: noiseFloor,
    face: ['type', 'level', 'follow', 'tone'],
  },
}
