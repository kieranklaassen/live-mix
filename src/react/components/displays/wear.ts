// Displays of the devices that age a sound: what the medium takes away and
// what it adds. One language for the family: the medium's response across
// frequency is a line in the ink over the spectrum of what comes out; what
// the medium adds (its noise floor, its ticks, its dropouts) is in the second
// colour, at its real level on the spectrum's own scale; what it does to the
// pitch is a trace of the last seconds; what it does to the wave is the wave.

import {
  History,
  INK,
  biquad,
  biquadDb,
  clamp,
  clipped,
  dbOfY,
  dot,
  fillRect,
  fillTo,
  freqGrid,
  gainToDb,
  ground,
  handle,
  hzOfX,
  hzText,
  rule,
  spectrum,
  text,
  trace,
  trackPhase,
  xOfHz,
  yOfDb,
  type Biquad,
  type Box,
  type PhaseTrack,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
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

// --- Curves kept between frames ---------------------------------------------

/**
 * A curve across a box, one value in dB for every second pixel, worked out
 * again only when what it was made from changes; the points it is drawn
 * through are kept too, so a frame makes no arrays.
 */
interface Curve {
  made: string
  db: Float32Array
  points: [number, number][]
}

const newCurve = (): Curve => ({ made: '', db: new Float32Array(0), points: [] })

/** How many values a curve across `box` has. */
const curveLength = (box: Box): number => Math.max(2, Math.floor(box.w / 2) + 1)

function makeCurve(
  curve: Curve,
  made: string,
  box: Box,
  db: (hz: number, index: number) => number,
  minHz?: number,
  maxHz?: number,
): void {
  const key = `${made}|${box.x},${box.w}`
  if (key === curve.made) return
  curve.made = key
  const length = curveLength(box)
  if (curve.db.length !== length) {
    curve.db = new Float32Array(length)
    curve.points = Array.from({ length }, (): [number, number] => [0, 0])
  }
  for (let i = 0; i < length; i++) {
    const value = db(hzOfX(box.x + Math.min(box.w, i * 2), box, minHz, maxHz), i)
    curve.db[i] = Number.isFinite(value) ? value : SILENT_DB
  }
}

/** A curve's points in a box on a scale of dB, moved by `shiftDb`; they stay within a few pixels of the box. */
function curvePoints(
  curve: Curve,
  box: Box,
  topDb: number,
  footDb: number,
  shiftDb = 0,
): readonly Point[] {
  const length = curve.points.length
  for (let i = 0; i < length; i++) {
    const point = curve.points[i]
    point[0] = box.x + Math.min(box.w, i * 2)
    point[1] = clamp(yOfDb(curve.db[i] + shiftDb, box, topDb, footDb), box.y - 4, box.y + box.h + 4)
  }
  return curve.points
}

/** The area between two curves over the same columns; unlike the kit's, the points are read where they lie and nothing is made. */
function fillBetweenCurves(
  ctx: CanvasRenderingContext2D,
  one: readonly Point[],
  other: readonly Point[],
  colour: string,
  alpha: number,
): void {
  if (one.length < 2 || other.length < 2) return
  ctx.beginPath()
  ctx.moveTo(one[0][0], one[0][1])
  for (let i = 1; i < one.length; i++) ctx.lineTo(one[i][0], one[i][1])
  for (let i = other.length - 1; i >= 0; i--) ctx.lineTo(other[i][0], other[i][1])
  ctx.closePath()
  ctx.globalAlpha = alpha
  ctx.fillStyle = colour
  ctx.fill()
  ctx.globalAlpha = 1
}

/** The highest value of a curve and where it is, as a share of the way across. */
function curvePeak(curve: Curve): { db: number; at: number } {
  let best = 0
  for (let i = 1; i < curve.db.length; i++) if (curve.db[i] > curve.db[best]) best = i
  return { db: curve.db[best] ?? SILENT_DB, at: best / Math.max(1, curve.db.length - 1) }
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
    const points = curvePoints(curve, box, TOP_DB, FOOT_DB, setDb + db20(live))
    fillTo(ctx, points, foot + 4, colours.accent, 0.45)
    trace(ctx, points, { colour: colours.accent, width: 1.25 })
    if (Math.abs(db20(live)) < 0.5) return
  }
  trace(ctx, curvePoints(curve, box, TOP_DB, FOOT_DB, setDb), {
    colour: colours.accent,
    width: 1,
    alpha: live === null ? 1 : INK.back,
    dash: [2, 2],
  })
}

/** A steady tone the medium adds (a hum's harmonic, an idle tone): a line from the foot up to its level. */
function drawTone(frame: Paint, box: Box, hz: number, db: number, alpha = 1): void {
  if (hz <= 20 || hz >= 20000 || db <= FOOT_DB) return
  const x = xOfHz(hz, box)
  rule(frame.ctx, x, box.y + box.h, x, Math.max(box.y, yOfDb(db, box, TOP_DB, FOOT_DB)), {
    colour: frame.colours.accent,
    alpha,
  })
}

/**
 * A row of harmonics the medium adds (mains hum): each a line where there is
 * room for lines, and where they crowd, the band they fill. `amps` holds
 * harmonic 1 first; `baseDb` is the level of an amplitude of 1.
 */
function drawComb(
  frame: Paint,
  box: Box,
  keep: [number, number][],
  amps: readonly number[],
  baseHz: number,
  baseDb: number,
  alpha = 1,
): void {
  const foot = box.y + box.h
  let crowded = amps.length
  for (let n = 1; n < amps.length; n++) {
    if (xOfHz(baseHz * (n + 1), box) - xOfHz(baseHz * n, box) < 3) {
      crowded = n
      break
    }
  }
  for (let n = 0; n < crowded; n++)
    drawTone(frame, box, baseHz * (n + 1), baseDb + db20(amps[n]), alpha)
  let count = 0
  for (let n = crowded; n < amps.length; n++) {
    const hz = baseHz * (n + 1)
    // The band's edge runs over the stronger harmonics, not down into each weaker one between.
    const db = baseDb + db20(Math.max(amps[n], amps[n - 1] ?? 0, amps[n + 1] ?? 0))
    if (hz >= 20000 || db <= FOOT_DB) continue
    keep[count] ??= [0, 0]
    keep[count][0] = xOfHz(hz, box)
    keep[count][1] = Math.max(box.y, yOfDb(db, box, TOP_DB, FOOT_DB))
    count += 1
  }
  keep.length = count
  if (count < 2) return
  fillTo(frame.ctx, keep, foot + 4, frame.colours.accent, 0.45 * alpha)
  trace(frame.ctx, keep, { colour: frame.colours.accent, width: 1.25, alpha })
}

/** The spectrum of what comes out, behind everything: the sound itself, in the ink. */
function drawSpectrum(frame: DisplayFrame, box: Box, minHz?: number, maxHz?: number): void {
  spectrum(frame, box, { topDb: TOP_DB, bottomDb: FOOT_DB, alpha: 0.42, minHz, maxHz })
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

/**
 * How many more of something a device has counted since the last frame. The
 * device's counters wrap at 2^20, and the first reading only sets the mark.
 */
function counted(before: number, reading: number): number {
  if (before < 0) return 0
  const more = reading - before
  return more < 0 ? more + 1048576 : more
}

interface TwoBoxes {
  band: Box
  past: Box
}

/** A window in two: the band across frequency above, the last seconds in a strip under it. */
function twoBoxes(view: Size, stripHeight = 26): TwoBoxes {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const strip = Math.min(stripHeight, Math.round(all.h * 0.45))
  return {
    band: { ...all, h: all.h - strip - 4 },
    past: { ...all, y: all.y + all.h - strip, h: strip },
  }
}

/** The line between the two parts of a window. */
function divide(frame: Paint, boxes: TwoBoxes): void {
  const y = boxes.past.y - 2
  rule(frame.ctx, 1, y, boxes.band.x + boxes.band.w + 3, y, {
    colour: frame.colours.ink,
    alpha: INK.grid,
  })
}

// --- The medium's curve -----------------------------------------------------

/** The scale a medium's response is drawn on: a little over unchanged at the top, well down at the foot. */
const CURVE_TOP_DB = 12
const CURVE_FOOT_DB = -36

/** The line where the medium leaves a frequency as it was. */
function drawUnchanged(frame: Paint, box: Box): void {
  const y = yOfDb(0, box, CURVE_TOP_DB, CURVE_FOOT_DB)
  rule(frame.ctx, box.x, y, box.x + box.w, y, { colour: frame.colours.ink, alpha: INK.grid })
}

/** The medium's response: a line in the ink, the main thing read. */
function drawResponse(frame: Paint, box: Box, curve: Curve): void {
  trace(frame.ctx, curvePoints(curve, box, CURVE_TOP_DB, CURVE_FOOT_DB), {
    colour: frame.colours.ink,
  })
}

/** Leave a handle's parameter alone when it is taken and not moved, however its place was clamped. */
const moved = (x: number, y: number, standing: { x: number; y: number }): boolean =>
  Math.abs(x - standing.x) > 0.5 || Math.abs(y - standing.y) > 0.5

/**
 * What a control from 0 to 1 that is raised to a power does to a level, in
 * dB: squared, it moves the level 40 dB for a tenfold turn.
 */
const amountDb = (amount: number, perTenfold = 40): number =>
  amount > 1e-4 ? perTenfold * Math.log10(amount) : SILENT_DB

/**
 * A handle on the highest point of a noise floor, for such a control. The
 * curve is the floor with the control at 1; up and down sets the control.
 */
function floorHandle(
  view: DisplayView,
  band: Box,
  full: Curve,
  param: string,
  name: string,
  perTenfold = 40,
): DisplayHandle {
  const peak = curvePeak(full)
  const foot = band.y + band.h
  const point: DisplayHandle = {
    key: param,
    name,
    x: clamp(band.x + peak.at * band.w, band.x + 4, band.x + band.w - 4),
    y: clamp(
      yOfDb(peak.db + amountDb(view.value(param), perTenfold), band, TOP_DB, FOOT_DB),
      band.y,
      foot,
    ),
    drag: (x, y) => ({
      [param]: moved(x, y, point)
        ? y >= foot - 0.5
          ? 0
          : clamp(
              Math.pow(
                10,
                (dbOfY(Math.max(y, band.y), band, TOP_DB, FOOT_DB) - peak.db) / perTenfold,
              ),
              0,
              1,
            )
        : view.value(param),
    }),
    reset: () => ({ [param]: view.spec(param)?.default ?? 0.25 }),
  }
  return point
}

/** A floor's curve for a handle asked for outside a frame, where none is kept. */
function scratchCurve(band: Box, db: (hz: number) => number): Curve {
  const curve = newCurve()
  makeCurve(curve, 'handle', band, db)
  return curve
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
  dropped: number
}

const newPitch = (seconds = PITCH_SEC, slots = PITCH_SLOTS): PitchState => ({
  pitch: new History(seconds, slots, 0),
  flutter: null,
  wow: 0,
  drops: new Tally(seconds, slots),
  dropDepth: new History(seconds, slots, 0, 'max'),
  dropped: -1,
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

/** Note the dropouts a device has counted since the last frame. */
function pushDrops(state: PitchState, now: number, counter: number, depth: number): void {
  const more = counted(state.dropped, counter)
  state.drops.push(now, more)
  state.dropDepth.push(now, more > 0 ? depth : 0)
  state.dropped = counter
}

/** The part of a pitch strip the trace runs in: the number has the left end. */
const pitchBox = (whole: Box): Box => ({
  x: whole.x + PITCH_LABEL,
  y: whole.y,
  w: whole.w - PITCH_LABEL - 2,
  h: whole.h,
})

/** The furthest the settings let the pitch go, as a number at the left end of a strip. */
function drawReach(frame: DisplayFrame, whole: Box, reach: number): void {
  text(frame, reachText(reach), whole.x, whole.y + whole.h / 2 + 3)
}

/** The ground of a pitch trace: true pitch along the middle, and the furthest the settings let it go as two dashed lines. */
function drawPitchLines(frame: Paint, box: Box, reach: number): void {
  const { ctx, colours } = frame
  const middle = box.y + box.h / 2
  rule(ctx, box.x, middle, box.x + box.w, middle, { colour: colours.ink, alpha: INK.grid })
  if (reach <= 0.004) return
  for (const side of [1, -1]) {
    const y = pitchY(side * reach, box)
    rule(ctx, box.x, y, box.x + box.w, y, { colour: colours.ink, alpha: INK.rule, dash: [1, 3] })
  }
}

/** A trace of the last seconds, running to the left of now at the right edge, with a dot on now. */
function drawPast(frame: Paint, box: Box, past: History, y: (value: number) => number): void {
  const { ctx, colours } = frame
  clipped(ctx, { x: box.x, y: box.y - 1, w: box.w + 3, h: box.h + 2 }, () => {
    const points = past.points(box, y)
    trace(ctx, points, { colour: colours.ink, width: 1.25 })
    const now = points[points.length - 1]
    dot(ctx, now[0], now[1], 2, colours.accent, { ring: colours.ink })
  })
}

/** Dropouts where they fell: each hangs from the top of the strip, longer the deeper it was. */
function drawDrops(frame: Paint, box: Box, state: PitchState): void {
  for (let back = 0; back < state.drops.slots; back++) {
    if (state.drops.at(back) <= 0) continue
    const x = state.drops.x(back, box)
    rule(frame.ctx, x, box.y, x, box.y + 2 + state.dropDepth.at(back) * (box.h * 0.5), {
      colour: frame.colours.accent,
      width: 1.5,
    })
  }
}

/** A pitch deviation as it is said: "±0.25 %". */
const reachText = (percent: number): string =>
  `±${percent >= 0.995 ? percent.toFixed(1) : percent.toFixed(2)}%`

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

/** What Tape does to a quiet tone at a frequency, in dB: the playback chain and Output. */
export function tapeResponseDb(view: DisplayView, hz: number, sampleRate: number): number {
  return chainDb(tapePlayback(view, sampleRate), hz, sampleRate) + view.value('output')
}

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
  const gain = Math.pow(2, 4 * drive - 1)
  const bias = 0.05 + 0.25 * drive
  const k = 2 + 1.5 * age
  const alpha = 1 - Math.exp((-2 * Math.PI * 3500) / (2 * sampleRate))
  const w = (2 * Math.PI * hz) / (2 * sampleRate)
  const low = cdiv(cx(alpha), cx(1 - (1 - alpha) * Math.cos(w), (1 - alpha) * Math.sin(w)))
  const emphasis = Math.sqrt(power(cadd(cx(1 + k), cscale(low, -k))))
  const swing = level * gain * emphasis
  const straight = Math.pow(1 + bias * bias, -1.5)
  let through = straight
  if (swing > 1e-4) {
    let sum = 0
    for (let i = 0; i < 16; i++) {
      const sine = Math.sin((2 * Math.PI * (i + 0.5)) / 16)
      const u = swing * sine + bias
      sum += (u / Math.sqrt(1 + u * u)) * sine
    }
    through = sum / 8 / swing
  }
  // The make-up: a tone at −12 dBFS comes out as it went in.
  const makeUp = Math.sqrt(1 + 0.0625 * gain * gain) / straight
  return db20(through * makeUp)
}

/** Tape's hiss at Hiss 1 as the spectrum shows it: white noise tilted up above 1.5 kHz, through the playback chain. */
export function tapeHissDb(
  view: DisplayView,
  hz: number,
  sampleRate: number,
  binHz: number,
): number {
  const peak = 0.0229 * fromDb(TAPE_HISS_DB[tapeSpeed(view)])
  const tilt = power(cadd(cx(1), cscale(onePole(hz, 1500, sampleRate), -0.7)))
  return (
    noiseBinDb(((peak * peak) / 3) * tilt * SIDES_APART, sampleRate, binHz) +
    tapeResponseDb(view, hz, sampleRate)
  )
}

/** The furthest Tape's wow and flutter take the pitch at these settings, per cent: ±0.8 and ±0.3 at full, half again by Age. */
function tapeReach(view: DisplayView): number {
  const worn = 1 + 0.5 * view.value('age')
  return (0.8 * view.value('wow') + 0.3 * view.value('flutter')) * worn
}

interface TapeState {
  response: Curve
  loud: Curve
  kept: Curve
  floor: Curve
  transport: PitchState
  level: number
}

const TAPE_CURVE = ['speed', 'tone', 'age', 'bump', 'output'] as const

function tapeHandles(view: DisplayView, floor: Curve | null): DisplayHandle[] {
  const { band } = twoBoxes(view, 30)
  const sampleRate = 48000
  const cutoff = tapeCutoffHz(view, sampleRate)
  const speed = tapeSpeed(view)
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
    drag: (x, y) => ({
      tone: moved(x, y, tone)
        ? clamp((Math.log2(hzOfX(x, band) / TAPE_BAND_HZ[speed]) + 1 + view.value('age')) / 2, 0, 1)
        : view.value('tone'),
    }),
    reset: () => ({ tone: view.spec('tone')?.default ?? 0.5 }),
  }
  const hiss = floorHandle(
    view,
    band,
    floor ?? scratchCurve(band, (hz) => tapeHissDb(view, hz, sampleRate, sampleRate / TAP_BINS)),
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
    response: newCurve(),
    loud: newCurve(),
    kept: newCurve(),
    floor: newCurve(),
    transport: newPitch(),
    level: 0,
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const boxes = twoBoxes(frame, 30)
    const { band, past } = boxes
    const sr = frame.sampleRate
    const binHz = binHzOf(frame)
    const drive = frame.value('drive')
    const age = frame.value('age')
    const settings = TAPE_CURVE.map((name) => frame.value(name).toFixed(3)).join(' ')
    const running = frame.signal !== null && frame.hasMeter('flutter') && frame.dt > 0

    makeCurve(state.response, settings, band, (hz) => tapeResponseDb(frame, hz, sr))
    makeCurve(
      state.loud,
      `${settings} ${drive.toFixed(3)}`,
      band,
      (hz, i) => state.response.db[i] + tapeKeptDb(drive, age, 1, hz, sr),
    )
    makeCurve(state.floor, `${settings} ${binHz.toFixed(2)}`, band, (hz) =>
      tapeHissDb(frame, hz, sr, binHz),
    )
    // How loud the sound going in is now, held a moment so the eye can follow it.
    if (frame.signal) {
      const peak = (frame.signal.input ?? frame.signal.output).peak
      state.level = Math.max(peak, state.level * Math.exp(-frame.dt / 0.25))
    }

    freqGrid(frame, band)
    drawUnchanged(frame, band)
    clipped(ctx, band, () => {
      drawSpectrum(frame, band)
      drawFloor(
        frame,
        band,
        state.floor,
        running ? frame.meter('hiss') : null,
        amountDb(frame.value('hiss')),
      )
      const response = curvePoints(state.response, band, CURVE_TOP_DB, CURVE_FOOT_DB)
      if (frame.signal && state.level > 0.003) {
        // What the saturation is doing to the sound at the level it has now.
        const level = Math.round(gainToDb(state.level) * 2) / 2
        makeCurve(
          state.kept,
          `${settings} ${drive.toFixed(3)} ${level}`,
          band,
          (hz, i) => state.response.db[i] + tapeKeptDb(drive, age, fromDb(level), hz, sr),
        )
        const kept = curvePoints(state.kept, band, CURVE_TOP_DB, CURVE_FOOT_DB)
        fillBetweenCurves(ctx, response, kept, colours.accent, 0.7)
      }
      trace(ctx, curvePoints(state.loud, band, CURVE_TOP_DB, CURVE_FOOT_DB), {
        colour: colours.ink,
        width: 1,
        alpha: INK.back,
        dash: [2, 2],
      })
      drawResponse(frame, band, state.response)
    })
    const handles = tapeHandles(frame, state.floor)
    for (const point of handles) handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    if (frame.hot === 'tone') text(frame, hzText(tapeCutoffHz(frame, sr)), band.x + 1, band.y + 8)

    // Below: the transport.
    divide(frame, boxes)
    if (running) {
      pushWobble(
        state.transport,
        frame,
        frame.meter('wow'),
        frame.meter('flutter'),
        frame.meter('flutterDepth'),
        TAPE_FLUTTER_HZ[tapeSpeed(frame)],
      )
      pushDrops(state.transport, frame.now, frame.meter('drops'), frame.meter('dropDepth'))
    }
    const strip = pitchBox(past)
    drawReach(frame, past, tapeReach(frame))
    drawPitchLines(frame, strip, tapeReach(frame))
    if (running) {
      drawDrops(frame, strip, state.transport)
      drawPast(frame, strip, state.transport.pitch, (percent) => pitchY(percent, strip))
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
    drag: (x, y) => {
      if (!moved(x, y, wear)) return { wear: view.value('wear') }
      const wanted =
        dbOfY(clamp(y, band.y, band.y + band.h), band, CURVE_TOP_DB, CURVE_FOOT_DB) -
        vinylColourDb(view, WEAR_HANDLE_HZ, sampleRate)
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
      scratchCurve(band, (hz) => vinylSurfaceDb(view, hz, sampleRate, sampleRate / TAP_BINS)),
    'surface',
    'Surface',
  )
  return [wear, surface]
}

interface VinylState {
  response: Curve
  floor: Curve
  pitch: History
  /** The largest tick in each slot (linear), pops and the starts of turns where they fell. */
  ticks: History
  popped: Tally
  turned: Tally
  tickCount: number
  popCount: number
  turn: number
}

/** Where a click of a size (linear) reaches in the strip. */
const clickY = (level: number, box: Box): number =>
  yOfDb(clamp(db20(level), CLICK_FOOT_DB, CLICK_TOP_DB), box, CLICK_TOP_DB, CLICK_FOOT_DB)

const vinyl = plateDisplay<VinylState>({
  place: 'window',
  columns: 2,
  params: ['speed', 'warp', 'crackle', 'pops', 'surface', 'wear', 'tone'],
  live: { meters: true, signal: true, spectrum: true },
  info: 'Above, what the record does across frequency: the worn top as a line over the spectrum, and the surface noise in the second colour. Drag the points for Wear and Surface. Below, three turns of the record: the pitch as the warp bends it, each tick of the crackle at its size, and pops as dots.',
  init: () => ({
    response: newCurve(),
    floor: newCurve(),
    pitch: new History(VINYL_SEC, VINYL_SLOTS, 0),
    ticks: new History(VINYL_SEC, VINYL_SLOTS, 0, 'max'),
    popped: new Tally(VINYL_SEC, VINYL_SLOTS),
    turned: new Tally(VINYL_SEC, VINYL_SLOTS),
    tickCount: -1,
    popCount: -1,
    turn: 0,
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const boxes = twoBoxes(frame, 36)
    const { band, past } = boxes
    const sr = frame.sampleRate
    const binHz = binHzOf(frame)
    const running = frame.signal !== null && frame.hasMeter('pitch') && frame.dt > 0
    const colour = `${Math.round(frame.value('speed'))} ${frame.value('tone').toFixed(3)}`

    makeCurve(state.response, `${colour} ${frame.value('wear').toFixed(3)}`, band, (hz) =>
      vinylResponseDb(frame, hz, sr),
    )
    makeCurve(state.floor, `${colour} ${binHz.toFixed(2)}`, band, (hz) =>
      vinylSurfaceDb(frame, hz, sr, binHz),
    )
    freqGrid(frame, band)
    drawUnchanged(frame, band)
    clipped(ctx, band, () => {
      drawSpectrum(frame, band)
      drawFloor(
        frame,
        band,
        state.floor,
        running ? frame.meter('noise') : null,
        amountDb(frame.value('surface')),
      )
      drawResponse(frame, band, state.response)
    })
    for (const point of vinylHandles(frame, state.floor))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })

    // Below: the record turning.
    divide(frame, boxes)
    const strip = pitchBox(past)
    const foot = past.y + past.h
    const warp = frame.value('warp')
    drawReach(frame, past, 3 * warp * warp)
    drawPitchLines(frame, strip, 3 * warp * warp)
    // What the settings let a click be: the crackle from its dust to its largest tick, and the largest pop.
    const sizes = crackleSizes(frame.value('crackle'))
    const edge = strip.x - 3
    if (frame.value('crackle') > 0) {
      // Faint where it is an even bed of dust, full where a tick stands out of it.
      const tick = Math.min(TICK_RATIO * sizes.floor, sizes.ceiling)
      rule(ctx, edge, clickY(sizes.floor, past), edge, clickY(tick, past), {
        colour: colours.accent,
        width: 2,
        alpha: 0.45,
      })
      if (sizes.ceiling > tick)
        rule(ctx, edge, clickY(tick, past), edge, clickY(sizes.ceiling, past), {
          colour: colours.accent,
          width: 2,
        })
    }
    const pops = frame.value('pops')
    if (pops > 0) dot(ctx, edge, clickY(POP_CEILING * pops, past), 1.5, colours.accent)
    if (!running) return

    const turn = frame.meter('turn')
    const ticks = frame.meter('ticks')
    const popCount = frame.meter('pops')
    state.pitch.push(frame.now, frame.meter('pitch'))
    state.ticks.push(frame.now, counted(state.tickCount, ticks) > 0 ? frame.meter('tickLevel') : 0)
    state.popped.push(frame.now, counted(state.popCount, popCount))
    state.turned.push(frame.now, turn < state.turn - 0.5 ? 1 : 0)
    state.tickCount = ticks
    state.popCount = popCount
    state.turn = turn
    clipped(ctx, { x: strip.x, y: past.y - 1, w: strip.w + 1, h: past.h + 2 }, () => {
      const popTop = clickY(POP_CEILING * Math.max(pops, 0.05), past)
      for (let back = 0; back < VINYL_SLOTS; back++) {
        const x = state.turned.x(back, strip)
        // The start of each turn: a scratch comes back at the same place in every one.
        if (state.turned.at(back) > 0)
          rule(ctx, x, past.y, x, foot, { colour: colours.ink, alpha: INK.rule })
        const tick = state.ticks.at(back)
        if (tick > 0)
          rule(ctx, x, foot, x, clickY(tick, past), { colour: colours.accent, alpha: 0.6 })
        if (state.popped.at(back) > 0) {
          rule(ctx, x, foot, x, popTop, { colour: colours.accent, alpha: INK.back })
          dot(ctx, x, popTop, 1.75, colours.accent)
        }
      }
    })
    drawPast(frame, strip, state.pitch, (percent) => pitchY(percent, strip))
  },
  handles: (view) => vinylHandles(view, null),
})

// --- The spectrum of what goes in -------------------------------------------

/**
 * The spectrum of the end of a wave, for a picture that needs what goes in
 * (the kit's taps give the spectrum of what comes out only). `db[i]` is the
 * level of a tone at `i · rate / size`, 0 for full scale; it rises at once
 * and falls 30 dB a second so the eye can follow it.
 */
export class Bins {
  readonly db: Float32Array
  private readonly re: Float32Array
  private readonly im: Float32Array
  private readonly window: Float32Array
  private readonly cos: Float32Array
  private readonly sin: Float32Array
  private readonly swap: Uint16Array

  /** `size` is a power of two: 512 is fine across a few kilohertz, 2048 for the whole range. */
  constructor(readonly size = 512) {
    const n = size
    this.db = new Float32Array(n / 2 + 1).fill(SILENT_DB)
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
    const { re, im } = this
    const from = Math.max(0, wave.length - n)
    for (let i = 0; i < n; i++) {
      re[this.swap[i]] = (wave[from + i] ?? 0) * this.window[i]
      im[i] = 0
    }
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1
      const stride = n / size
      for (let start = 0; start < n; start += size) {
        for (let k = 0; k < half; k++) {
          const c = this.cos[k * stride]
          const sn = this.sin[k * stride]
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
    const fall = 30 * Math.max(0, dt)
    for (let i = 0; i <= n / 2; i++) {
      // A tone of amplitude 1 puts a quarter of the window's length in its bin.
      const now = db20((Math.sqrt(re[i] * re[i] + im[i] * im[i]) * 4) / n)
      this.db[i] = Math.max(now, this.db[i] - fall)
    }
  }

  /** The level at a frequency, between its two bins. */
  at(hz: number, sampleRate: number): number {
    const place = clamp((Math.abs(hz) * this.size) / sampleRate, 0, this.size / 2 - 1)
    const index = Math.floor(place)
    return this.db[index] + (this.db[index + 1] - this.db[index]) * (place - index)
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
  let db = bins[first]
  for (let i = first + 1; i <= last; i++) if (bins[i] > db) db = bins[i]
  return db
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
 * step. Answers with the gain it was drawn at.
 */
function drawWave(
  frame: Paint,
  box: Box,
  keep: [number, number][],
  wave: Float32Array,
  span: number,
): number {
  const start = risingEdge(wave, span)
  let peak = 0.02
  for (let i = 0; i <= span; i++) peak = Math.max(peak, Math.abs(wave[start + i] ?? 0))
  const gain = 1 / peak
  const middle = box.y + box.h / 2
  for (let i = 0; i <= span; i++) {
    keep[i] ??= [0, 0]
    keep[i][0] = box.x + (i / span) * box.w
    keep[i][1] = middle - (wave[start + i] ?? 0) * gain * (box.h / 2 - 1)
  }
  keep.length = span + 1
  trace(frame.ctx, keep, { colour: frame.colours.ink, width: 1.25 })
  return gain
}

/** Marks along the foot of a wave, one for each time a converter takes a new sample; `spread` is how far its clock wanders, as a share of the step. */
function drawHolds(frame: Paint, box: Box, span: number, period: number, spread = 0): void {
  const step = (period / span) * box.w
  if (step < 2.5) return
  const foot = box.y + box.h
  for (let x = box.x; x <= box.x + box.w + 0.5; x += step) {
    if (spread > 0.01 && x > box.x)
      fillRect(
        frame.ctx,
        { x: x - spread * step, y: foot - 2, w: 2 * spread * step, h: 2 },
        frame.colours.accent,
        0.5,
      )
    rule(frame.ctx, x, foot, x, foot - 4, { colour: frame.colours.accent })
  }
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

/** The edges of the box the Drive curve is drawn in, and of the strip beside it. */
function patinaBoxes(view: Size): TwoBoxes & { curve: Box; strip: Box } {
  const boxes = twoBoxes(view, 30)
  const { past } = boxes
  return {
    ...boxes,
    curve: { x: past.x, y: past.y, w: past.h, h: past.h },
    strip: { x: past.x + past.h + 6, y: past.y, w: past.w - past.h - 8, h: past.h },
  }
}

function patinaHandles(view: DisplayView, floor: Curve | null): DisplayHandle[] {
  const { band } = patinaBoxes(view)
  const sampleRate = 48000
  const index = mediumOf(view)
  const sampler = index === SAMPLER
  // The sampler's edge is half its rate, where the images begin; a band's is where it ends.
  const edgeHz = sampler
    ? sampleRate / samplerHold(view.value('wear'), sampleRate) / 2
    : patinaHighHz(view, sampleRate)
  const response = patinaResponse(view, sampleRate)
  const wear: DisplayHandle = {
    key: 'wear',
    name: 'Wear',
    x: clamp(xOfHz(edgeHz, band), band.x, band.x + band.w),
    y: clamp(
      yOfDb(response(Math.min(edgeHz, 20000)), band, CURVE_TOP_DB, CURVE_FOOT_DB),
      band.y,
      band.y + band.h,
    ),
    // Across is where the band ends: to the left wears the medium.
    drag: (x, y) => {
      if (!moved(x, y, wear)) return { wear: view.value('wear') }
      const hz = hzOfX(clamp(x, band.x, band.x + band.w), band)
      const worn = sampler
        ? Math.log((2 * hz) / sampleRate) / Math.log(6000 / sampleRate)
        : Math.log(hz / (40000 * Math.pow(2, 2 * view.value('tone') - 1))) /
          Math.log(MEDIA[index].highHz / 40000)
      return { wear: clamp(worn, 0, 1) }
    },
    reset: () => ({ wear: view.spec('wear')?.default ?? 0.3 }),
  }
  const noise = floorHandle(
    view,
    band,
    floor ?? scratchCurve(band, patinaFloor(view, sampleRate, sampleRate / TAP_BINS)),
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
  response: Curve
  floor: Curve
  /** The Drive curve at 33 points across its box, and what it was made from. */
  bent: Float32Array
  bentFor: string
  line: [number, number][]
  swing: [number, number][]
  transport: PitchState
  /** The level Wobble has the sound at where it moves the level: slowly on the radio, faster in the valve. */
  fading: History
  sag: History
  level: number
  wave: [number, number][]
}

const PATINA_CURVE = ['medium', 'wear', 'tone', 'output'] as const

const patina = plateDisplay<PatinaState>({
  place: 'window',
  columns: 2,
  params: ['medium', 'drive', 'wobble', 'wear', 'noise', 'tone', 'output'],
  live: { meters: true, signal: true, spectrum: true },
  info: 'Above, what the medium does across frequency: its band as a line over the spectrum, its noise in the second colour. Drag the points for Wear and Noise. Below, the curve Drive bends the wave through, and what Wobble moves: the pitch, the level, or the clock of the sampler under its wave.',
  init: () => ({
    response: newCurve(),
    floor: newCurve(),
    bent: new Float32Array(33),
    bentFor: '',
    line: [],
    swing: [],
    transport: newPitch(),
    fading: new History(12, 120, 0),
    sag: new History(4, 120, 0),
    level: 0,
    wave: [],
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const boxes = patinaBoxes(frame)
    const { band, curve, strip } = boxes
    const sr = frame.sampleRate
    const binHz = binHzOf(frame)
    const index = mediumOf(frame)
    const spec = MEDIA[index]
    const wear = frame.value('wear')
    const wobble = frame.value('wobble')
    const drive = frame.value('drive')
    const settings = PATINA_CURVE.map((name) => frame.value(name).toFixed(3)).join(' ')
    const running = frame.signal !== null && frame.hasMeter('flutter') && frame.dt > 0
    const response = patinaResponse(frame, sr)
    const noiseDb = amountDb(frame.value('noise'), PATINA_NOISE_TENFOLD)
    const gate = running ? frame.meter('noise') : null

    makeCurve(state.response, settings, band, response)
    makeCurve(state.floor, `${settings} ${binHz.toFixed(2)}`, band, patinaFloor(frame, sr, binHz))
    freqGrid(frame, band)
    drawUnchanged(frame, band)
    clipped(ctx, band, () => {
      drawSpectrum(frame, band)
      drawFloor(frame, band, state.floor, gate, noiseDb)
      if (noiseDb > SILENT_DB / 2) {
        // The hum and the idle tone ride on the same level and the same band.
        const hold = samplerHold(wear, sr)
        for (const [hz, amplitude] of patinaTones(index)) {
          // The sampler's tone is held with the signal: over half its rate it folds back down.
          const rate = sr / hold
          const heard = index === SAMPLER ? Math.abs(hz - Math.round(hz / rate) * rate) : hz
          drawTone(
            frame,
            band,
            heard,
            spec.noiseDb + noiseDb + db20(amplitude * (gate ?? 1)) + TONE_DB + response(heard),
            gate === null ? INK.back : 1,
          )
        }
      }
      if (index === SAMPLER && samplerHold(wear, sr) > 1.01) {
        // Half the sampler's rate: what was above it comes back under it.
        const x = xOfHz(sr / samplerHold(wear, sr) / 2, band)
        rule(ctx, x, band.y, x, band.y + band.h, { colour: colours.accent, dash: [2, 2] })
      }
      drawResponse(frame, band, state.response)
    })
    for (const point of patinaHandles(frame, state.floor))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    if (frame.hot === 'wear') {
      const edge = index === SAMPLER ? sr / samplerHold(wear, sr) / 2 : patinaHighHz(frame, sr)
      text(frame, hzText(edge), band.x + 1, band.y + 8)
    }

    divide(frame, boxes)
    // Below, left: the curve Drive bends the wave through, input across and output up.
    const reach = index === SAMPLER ? SAMPLER_ZOOM : 1
    const bentFor = `${index} ${drive.toFixed(3)}`
    if (bentFor !== state.bentFor) {
      state.bentFor = bentFor
      const bent = patinaCurve(index, drive)
      for (let i = 0; i < state.bent.length; i++)
        state.bent[i] = bent((i / (state.bent.length - 1)) * 2 * reach - reach) / reach
    }
    const centreX = curve.x + curve.w / 2
    const centreY = curve.y + curve.h / 2
    rule(ctx, curve.x, centreY, curve.x + curve.w, centreY, {
      colour: colours.ink,
      alpha: INK.grid,
    })
    rule(ctx, centreX, curve.y, centreX, curve.y + curve.h, {
      colour: colours.ink,
      alpha: INK.grid,
    })
    // Unbent: out as in.
    rule(ctx, curve.x, curve.y + curve.h, curve.x + curve.w, curve.y, {
      colour: colours.ink,
      alpha: INK.rule,
      dash: [1, 3],
    })
    const last = state.bent.length - 1
    for (let i = 0; i <= last; i++) {
      state.line[i] ??= [0, 0]
      state.line[i][0] = curve.x + (i / last) * curve.w
      state.line[i][1] = centreY - clamp(state.bent[i], -1, 1) * (curve.h / 2)
    }
    state.line.length = last + 1
    trace(ctx, state.line, { colour: colours.ink, width: 1.25 })
    if (frame.signal) {
      const peak = (frame.signal.input ?? frame.signal.output).peak
      state.level = Math.max(peak, state.level * Math.exp(-frame.dt / 0.25))
    }
    if (running && state.level > 0.003) {
      // How far along its curve the sound is swinging now.
      const swing = Math.min(1, state.level / reach)
      const from = Math.floor(((1 - swing) / 2) * last)
      const to = Math.ceil(((1 + swing) / 2) * last)
      for (let i = from; i <= to; i++) state.swing[i - from] = state.line[i]
      state.swing.length = to - from + 1
      trace(ctx, state.swing, { colour: colours.accent, width: 2 })
      dot(ctx, state.line[to][0], state.line[to][1], 1.75, colours.accent)
    }

    // Below, right: what Wobble moves.
    if (index === SAMPLER) {
      // The converter's clock: a mark for each sample it takes, and how far Wobble lets each one stray.
      const hold = samplerHold(wear, sr)
      drawHolds(frame, strip, SAMPLER_SPAN, hold, 0.3 * wobble)
      const heard = running ? frame.signal?.output.wave : undefined
      if (heard)
        clipped(ctx, strip, () => {
          drawWave(frame, strip, state.wave, heard, SAMPLER_SPAN)
        })
      else
        rule(ctx, strip.x, strip.y + strip.h / 2, strip.x + strip.w, strip.y + strip.h / 2, {
          colour: colours.ink,
          alpha: INK.grid,
        })
      return
    }
    if (index === RADIO || index === VALVE) {
      const y = (db: number): number =>
        yOfDb(clamp(db, SWAY_FOOT_DB, SWAY_TOP_DB), strip, SWAY_TOP_DB, SWAY_FOOT_DB)
      rule(ctx, strip.x, y(0), strip.x + strip.w, y(0), { colour: colours.ink, alpha: INK.grid })
      // The furthest Wobble takes the level: the radio fades by up to 9 dB, the valve gives way and blooms by 6.
      const depth = 3 * wobble
      const ends =
        index === RADIO
          ? [-9 * wobble]
          : [db20(1 + 0.3228 * depth), db20((1 + 0.3228 * depth) / (1 + depth))]
      if (wobble > 0.004)
        for (const db of ends)
          rule(ctx, strip.x, y(db), strip.x + strip.w, y(db), {
            colour: colours.ink,
            alpha: INK.rule,
            dash: [1, 3],
          })
      if (!running) return
      const past = index === RADIO ? state.fading : state.sag
      past.push(frame.now, db20(Math.max(frame.meter('level'), 1e-3)))
      drawPast(frame, strip, past, y)
      return
    }
    drawPitchLines(frame, strip, patinaReach(frame))
    if (!running) return
    pushWobble(
      state.transport,
      frame,
      frame.meter('wow'),
      frame.meter('flutter'),
      frame.meter('flutterDepth'),
      spec.flutterHz,
    )
    // A dropout's depth is not reported: each is drawn at the deepest Wear lets it be.
    pushDrops(state.transport, frame.now, frame.meter('drops'), 0.9 * Math.sqrt(wear))
    drawDrops(frame, strip, state.transport)
    drawPast(frame, strip, state.transport.pitch, (percent) => pitchY(percent, strip))
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
    drag: (x, y) => {
      if (!moved(x, y, tuning)) return { tuning: view.value('tuning') }
      const hz = radioHz(clamp(x, box.x, box.x + box.w), band, box)
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
    drag: (x, y) => {
      if (!moved(x, y, bandwidth)) return { bandwidth: view.value('bandwidth') }
      const edge = radioHz(clamp(x, box.x, box.x + box.w), band, box)
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

interface RadioState {
  programme: Bins
  /** Per column of the picture: what the transmitter's filter and the receiver's do there, dB. */
  sent: Float32Array
  sentFor: string
  heard: Float32Array
  heardFor: string
  air: [number, number][]
  through: [number, number][]
  filter: [number, number][]
}

const radio = plateDisplay<RadioState>({
  place: 'window',
  columns: 2,
  params: ['band', 'tuning', 'fading', 'static', 'bandwidth'],
  live: { meters: true, signal: true },
  info: 'A stretch of the dial with the station in the middle: its carrier, and the programme either side as the sky wave hollows it. The line is the filter of the receiver and the second colour is the static. Drag the filter along to tune, and its edge for the bandwidth.',
  init: () => ({
    programme: new Bins(RADIO_BINS),
    sent: new Float32Array(0),
    sentFor: '',
    heard: new Float32Array(0),
    heardFor: '',
    air: [],
    through: [],
    filter: [],
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const box = radioBox(frame)
    const band = radioBand(frame)
    const sr = frame.sampleRate
    const foot = box.y + box.h
    const running = frame.signal !== null && frame.hasMeter('direct') && frame.dt > 0
    // Asleep, the receiver is off and reports nothing: then the picture is what the controls say.
    const live = running && frame.meter('direct') > 1e-4
    const off = live ? frame.meter('tuning') : radioDialHz(frame)
    const { centre, half } = radioFilter(frame, off)
    const columns = Math.floor(box.w / 2) + 1

    // What the transmitter's filter leaves at each column, and the receiver's: made again only when they move.
    const sentFor = `${frame.value('band')} ${columns} ${sr}`
    if (sentFor !== state.sentFor) {
      state.sentFor = sentFor
      if (state.sent.length !== columns) state.sent = new Float32Array(columns)
      const filters = BUTTER4.map((q) => biquad('lowpass', band.transmitHz, q, 0, sr))
      for (let i = 0; i < columns; i++)
        state.sent[i] = chainDb(filters, Math.abs(radioHz(box.x + i * 2, band, box)), sr)
    }
    const heardFor = `${sentFor} ${centre.toFixed(0)} ${half.toFixed(0)}`
    if (heardFor !== state.heardFor) {
      state.heardFor = heardFor
      if (state.heard.length !== columns) state.heard = new Float32Array(columns)
      const filters = BUTTER8.map((q) => biquad('lowpass', half, q, 0, sr))
      for (let i = 0; i < columns; i++)
        state.heard[i] = chainDb(
          filters,
          Math.min(Math.abs(radioHz(box.x + i * 2, band, box) - centre), sr * 0.49),
          sr,
        )
    }

    // The dial: a line every kilohertz or five, and the station.
    for (
      let hz = Math.ceil(band.fromHz / band.gridHz) * band.gridHz;
      hz <= band.toHz;
      hz += band.gridHz
    ) {
      const x = radioX(hz, band, box)
      rule(ctx, x, box.y, x, foot, { colour: colours.ink, alpha: hz === 0 ? INK.rule : INK.grid })
    }

    // The static at the aerial, the same all along the dial.
    const setStatic = 0.26 * Math.pow(frame.value('static'), 1.5) * Math.sqrt(sr / 48000)
    const setY = radioY(radioStaticDb(setStatic), box)
    if (live) {
      const y = radioY(radioStaticDb(frame.meter('static')), box)
      fillRect(ctx, { x: box.x, y, w: box.w, h: foot - y }, colours.accent, 0.45)
      rule(ctx, box.x, y, box.x + box.w, y, { colour: colours.accent, width: 1.25 })
    } else if (setStatic > 0) {
      rule(ctx, box.x, setY, box.x + box.w, setY, { colour: colours.accent, dash: [2, 2] })
    }

    // The station as it arrives: the programme on its carrier, through the two paths of the sky wave.
    const direct = live ? frame.meter('direct') : 1
    const lateRe = live ? frame.meter('lateRe') : 0
    const lateIm = live ? frame.meter('lateIm') : 0
    const late = live ? frame.meter('delay') : 0
    const wave = frame.signal ? (frame.signal.input ?? frame.signal.output).wave : null
    if (wave && running) state.programme.read(wave, frame.dt)
    let loudest = SILENT_DB
    for (let i = 0; i < columns; i++) {
      const x = box.x + i * 2
      const hz = radioHz(x, band, box)
      // With a carrier each tone of the programme is a pair of sidebands of half the depth; without, one of all of it, above.
      const programme =
        !wave || (!band.carrier && hz < 0)
          ? SILENT_DB
          : state.programme.at(hz, sr) + db20(band.carrier ? band.depth / 2 : band.depth)
      const arrived = programme + state.sent[i] + skyWaveDb(direct, lateRe, lateIm, late, hz)
      loudest = Math.max(loudest, arrived)
      state.air[i] ??= [0, 0]
      state.air[i][0] = x
      state.air[i][1] = radioY(arrived, box)
      state.through[i] ??= [0, 0]
      state.through[i][0] = x
      state.through[i][1] = radioY(arrived + state.heard[i], box)
      state.filter[i] ??= [0, 0]
      state.filter[i][0] = x
      state.filter[i][1] = radioY(state.heard[i], box)
    }
    state.air.length = state.through.length = state.filter.length = columns
    clipped(ctx, box, () => {
      if (loudest > RADIO_FOOT_DB) {
        // All of it faintly, and what the filter lets through over that.
        fillTo(ctx, state.air, foot + 8, colours.ink, INK.fill)
        fillTo(ctx, state.through, foot + 8, colours.ink, 0.42)
      } else {
        // No programme: the band the station sends in, as an outline.
        for (let i = 0; i < columns; i++) state.air[i][1] = radioY(-24 + state.sent[i], box)
        const from = band.carrier ? 0 : Math.ceil((radioX(0, band, box) - box.x) / 2)
        trace(ctx, state.air.slice(from), {
          colour: colours.ink,
          width: 1,
          alpha: INK.back,
          dash: [2, 2],
        })
      }
      if (band.carrier) {
        const x = radioX(0, band, box)
        const carrier = skyWaveDb(direct, lateRe, lateIm, late, 0)
        rule(ctx, x, foot, x, radioY(carrier, box), { colour: colours.ink, width: 2 })
      }
      trace(ctx, state.filter, { colour: colours.ink })
    })

    // How far the fading takes the signal down, at the left edge, and where it is now.
    const deepest = -band.fadeDb * Math.pow(frame.value('fading'), 0.75)
    const edge = box.x + 1.5
    rule(ctx, edge, radioY(0, box), edge, radioY(deepest, box), {
      colour: colours.ink,
      alpha: INK.text,
    })
    for (const db of [0, deepest])
      rule(ctx, edge, radioY(db, box), edge + 3, radioY(db, box), {
        colour: colours.ink,
        alpha: INK.text,
      })
    if (live) dot(ctx, edge, radioY(db20(direct), box), 2, colours.accent, { ring: colours.ink })

    for (const point of radioHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    if (frame.hot === 'tuning') {
      const dial = radioDialHz(frame)
      text(
        frame,
        `${dial >= 0 ? '+' : '−'}${hzText(Math.abs(dial))}`,
        box.x + box.w - 1,
        box.y + 8,
        {
          align: 'right',
        },
      )
    } else if (frame.hot === 'bandwidth') {
      text(frame, hzText(radioEdges(frame).high), box.x + box.w - 1, box.y + 8, { align: 'right' })
    }
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
const CODEC_BINS = 2048
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
    drag: (x, y) => {
      if (!moved(x, y, loss)) return { loss: view.value('loss') }
      const octaves = 14.4252 - Math.log2(hzOfX(clamp(x, band.x, band.x + band.w), band))
      return { loss: Math.pow(clamp(octaves / 2.6521, 0, 1), 2 / 3) }
    },
    reset: () => ({ loss: view.spec('loss')?.default ?? 0.5 }),
  }
  const highCut: DisplayHandle = {
    key: 'highCut',
    name: 'High Cut',
    x: clamp(xOfHz(view.value('highCut'), band), band.x, band.x + band.w),
    y: band.y + 13,
    drag: (x, y) => ({
      highCut: moved(x, y, highCut)
        ? clamp(hzOfX(clamp(x, band.x, band.x + band.w), band), 1000, 20000)
        : view.value('highCut'),
    }),
    reset: () => ({ highCut: view.spec('highCut')?.default ?? 20000 }),
  }
  return [loss, highCut]
}

interface CodecState {
  input: Bins
  /** The stream's recent peak, dB: it is let go over a second and a half. */
  reference: number
  edges: number[]
  edgesFor: string
  limit: Float32Array
  sound: [number, number][]
  under: [number, number][]
  stair: [number, number][]
  out: [number, number][]
  fan: [number, number][]
  /** The stream of packets: 0 flowing, 1 lost, 2 stuck. */
  packets: History
  lost: number
  stuck: number
}

const lowBitrate = plateDisplay<CodecState>({
  place: 'window',
  columns: 2,
  params: ['loss', 'mode', 'frame', 'dropouts', 'stutter', 'stereo', 'highCut'],
  live: { meters: true, signal: true, spectrum: true },
  info: 'Above, the spectrum going in and the line under which the codec throws detail away: kept in the ink, lost in the second colour, with a mark at the top where stereo folds to mono. Drag the points for Loss and High Cut. Below, the stream of packets: a gap is lost, the second colour is stuck.',
  init: () => ({
    input: new Bins(CODEC_BINS),
    reference: SILENT_DB,
    edges: [],
    edgesFor: '',
    limit: new Float32Array(32),
    sound: [],
    under: [],
    stair: [],
    out: [],
    fan: [],
    packets: new History(CODEC_PAST_SEC, CODEC_SLOTS, 0, 'max'),
    lost: -1,
    stuck: -1,
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const boxes = twoBoxes(frame, 18)
    const { band, past } = boxes
    const sr = frame.sampleRate
    const foot = band.y + band.h
    const loss = frame.value('loss')
    const mode = clamp(Math.round(frame.value('mode')), 0, 2)
    const scattered = mode === 2
    const residue = mode === 1
    const severity = codecSeverity(loss)
    const highCut = frame.value('highCut')
    const cutOn = highCut < HIGH_CUT_OFF
    // Nothing is kept above the lower of the two cuts; scattering has no cut of its own.
    const cutHz = scattered ? 30000 : severity.cutHz
    const topHz = Math.min(cutHz, cutOn ? highCut : 30000)
    const topX = clamp(xOfHz(topHz, band), band.x, band.x + band.w)
    const running = frame.signal !== null && frame.dt > 0
    const edgesFor = `${Math.round(frame.value('frame'))} ${sr}`
    if (edgesFor !== state.edgesFor) {
      state.edgesFor = edgesFor
      state.edges = codecBands(frame.value('frame'), sr)
    }
    const { edges } = state
    const bands = edges.length - 1

    freqGrid(frame, band)
    // The codec's bands, along the foot.
    for (let b = 1; b < bands; b++) {
      if (edges[b] < 20 || edges[b] > 20000) continue
      const x = xOfHz(edges[b], band)
      rule(ctx, x, foot, x, foot - 3, { colour: colours.ink, alpha: INK.back })
    }

    const wave = frame.signal ? (frame.signal.input ?? frame.signal.output).wave : null
    if (wave && running) state.input.read(wave, frame.dt)
    const binHz = sr / CODEC_BINS
    let loudest = SILENT_DB
    for (const db of state.input.db) loudest = Math.max(loudest, db)
    state.reference = Math.max(loudest, state.reference - (8.686 * frame.dt) / 1.5)
    const sounding = running && loudest > -100

    if (sounding) {
      // Each band's loudest, then the level under which the codec drops what is in it.
      for (let b = 0; b < bands; b++)
        state.limit[b] = loudestBin(state.input.db, binHz, edges[b], edges[b + 1] - binHz)
      if (!scattered && loss > 1e-4)
        codecThreshold(state.limit, bands, severity.marginDb, state.reference - severity.floorDb)
      else state.limit.fill(SILENT_DB)
      const columns = Math.floor(band.w / 2) + 1
      let b = 0
      for (let i = 0; i < columns; i++) {
        const x = band.x + Math.min(band.w, i * 2)
        const from = hzOfX(x - 1, band)
        const to = hzOfX(x + 1, band)
        const centre = hzOfX(x, band)
        while (b < bands - 1 && centre >= edges[b + 1]) b += 1
        // On the family's scale, where a tone at full level reads −14 dB.
        const level = loudestBin(state.input.db, binHz, from, to) + TONE_DB
        const limit = centre > topHz ? TOP_DB : state.limit[b] + TONE_DB
        const y = clamp(yOfDb(level, band, TOP_DB, FOOT_DB), band.y, foot)
        state.sound[i] ??= [0, 0]
        state.sound[i][0] = x
        state.sound[i][1] = y
        state.under[i] ??= [0, 0]
        state.under[i][0] = x
        state.under[i][1] = Math.max(y, clamp(yOfDb(limit, band, TOP_DB, FOOT_DB), band.y, foot))
      }
      state.sound.length = state.under.length = columns
      clipped(ctx, band, () => {
        // Over the line: kept. Under it, and past the cut: lost. Residue plays the lost part.
        fillBetweenCurves(ctx, state.sound, state.under, colours.ink, residue ? INK.fill : 0.5)
        if (!scattered)
          clipped(
            ctx,
            {
              x: band.x,
              y: band.y,
              w: (cutOn ? xOfHz(highCut, band) : band.x + band.w) - band.x,
              h: band.h,
            },
            () => fillTo(ctx, state.under, foot + 4, colours.accent, residue ? 0.75 : 0.4),
          )
        // What comes out, as a line: Smear holds it up after the sound has gone, a lost packet drops it.
        const bins = frame.signal?.spectrum
        const outHz = frame.signal?.binHz ?? 0
        if (bins && outHz > 0) {
          for (let i = 0; i < columns; i++) {
            const x = band.x + Math.min(band.w, i * 2)
            state.out[i] ??= [0, 0]
            state.out[i][0] = x
            state.out[i][1] = clamp(
              yOfDb(
                loudestBin(bins, outHz, hzOfX(x - 1, band), hzOfX(x + 1, band)),
                band,
                TOP_DB,
                FOOT_DB,
              ),
              band.y,
              foot,
            )
          }
          state.out.length = columns
          trace(ctx, state.out, { colour: colours.ink, width: 1, alpha: INK.back })
        }
        if (!scattered && loss > 1e-4) {
          let count = 0
          for (let k = 0; k < bands; k++) {
            if (edges[k] >= topHz) break
            const y = clamp(yOfDb(state.limit[k] + TONE_DB, band, TOP_DB, FOOT_DB), band.y, foot)
            for (const hz of [Math.max(edges[k], 20), Math.min(edges[k + 1], topHz)]) {
              state.stair[count] ??= [0, 0]
              state.stair[count][0] = xOfHz(hz, band)
              state.stair[count][1] = y
              count += 1
            }
          }
          state.stair.length = count
          trace(ctx, state.stair, { colour: colours.ink, width: 1.25 })
        }
      })
    } else if (!scattered) {
      // No sound: the part of the range that is kept, or in Residue the part that is thrown away and played.
      if (residue)
        fillRect(
          ctx,
          { x: topX, y: band.y, w: band.x + band.w - topX, h: band.h },
          colours.accent,
          INK.fill,
        )
      else
        fillRect(
          ctx,
          { x: band.x, y: band.y, w: topX - band.x, h: band.h },
          colours.ink,
          INK.ground,
        )
    }

    // The cuts: Loss takes the top away, High Cut cuts whatever is left.
    if (!scattered) {
      const x = xOfHz(cutHz, band)
      if (x <= band.x + band.w)
        rule(ctx, x, band.y, x, foot, {
          colour: colours.ink,
          alpha: cutHz <= topHz ? 1 : INK.rule,
        })
    }
    if (cutOn) {
      const x = xOfHz(highCut, band)
      rule(ctx, x, band.y, x, foot, { colour: colours.ink, alpha: highCut <= topHz ? 1 : INK.rule })
    }
    // Two sides as two lines along the top, one from where they are folded together.
    const monoX = clamp(
      xOfHz(codecMonoHz(loss, frame.value('stereo')), band),
      band.x,
      band.x + band.w,
    )
    for (const y of [band.y + 1, band.y + 4])
      rule(ctx, band.x, y, Math.max(band.x, monoX - 2), y, { colour: colours.ink, alpha: INK.text })
    if (monoX < band.x + band.w - 1)
      rule(ctx, monoX, band.y + 2.5, band.x + band.w, band.y + 2.5, {
        colour: colours.ink,
        alpha: INK.text,
      })

    const handles = codecHandles(frame)
    if (scattered) {
      // Scattered turns each coefficient's phase by up to ±Loss × 180°: the fan round the point.
      const centre = handles[0]
      const steps = 16
      for (let i = 0; i <= steps; i++) {
        const angle = Math.PI + ((i / steps) * 2 - 1) * loss * Math.PI
        state.fan[i] ??= [0, 0]
        state.fan[i][0] = centre.x + 11 * Math.cos(angle)
        state.fan[i][1] = centre.y + 11 * Math.sin(angle)
      }
      state.fan.length = steps + 1
      trace(ctx, state.fan, { colour: colours.accent, width: 2 })
      for (const end of [state.fan[0], state.fan[steps]])
        rule(ctx, centre.x, centre.y, end[0], end[1], { colour: colours.accent })
    }
    for (const point of handles) handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    if (frame.hot === 'loss' && !scattered)
      text(frame, hzText(severity.cutHz), band.x + 1, band.y + 14)
    else if (frame.hot === 'highCut') text(frame, hzText(highCut), band.x + 1, band.y + 14)

    // Below: the stream of packets over the last seconds.
    divide(frame, boxes)
    const ribbon: Box = { x: past.x, y: past.y + 2, w: past.w, h: past.h - 8 }
    const shares: Box = { x: past.x, y: past.y + past.h - 3, w: past.w, h: 2 }
    // How much of the stream the settings lose and hold, in the long run: a share of the line, from the right.
    const stuck = packetShare(frame.value('stutter')) * shares.w
    const lost = packetShare(frame.value('dropouts')) * shares.w
    fillRect(ctx, { ...shares, w: shares.w - stuck - lost }, colours.ink, INK.back)
    fillRect(ctx, { ...shares, x: shares.x + shares.w - stuck, w: stuck }, colours.accent)
    if (!running || !frame.hasMeter('packet')) {
      fillRect(ctx, ribbon, colours.ink, INK.fill)
      return
    }
    const lostCount = frame.meter('lost')
    const stuckCount = frame.meter('stuck')
    // An event shorter than the gap between two readings is still counted.
    if (counted(state.lost, lostCount) > 0) state.packets.push(frame.now, 1)
    if (counted(state.stuck, stuckCount) > 0) state.packets.push(frame.now, 2)
    state.packets.push(frame.now, Math.round(frame.meter('packet')))
    state.lost = lostCount
    state.stuck = stuckCount
    const slot = ribbon.w / CODEC_SLOTS
    let from = 0
    for (let i = 1; i <= CODEC_SLOTS; i++) {
      const kind = state.packets.at(CODEC_SLOTS - 1 - from)
      if (i < CODEC_SLOTS && state.packets.at(CODEC_SLOTS - 1 - i) === kind) continue
      const run: Box = { x: ribbon.x + from * slot, y: ribbon.y, w: (i - from) * slot, h: ribbon.h }
      if (kind === 0) fillRect(ctx, run, colours.ink, 0.42)
      else if (kind === 2) fillRect(ctx, run, colours.accent)
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

/** How many samples of the wave Vintage Digital's strip shows: 4 ms at 48 kHz. */
const DIGITAL_SPAN = 192
/** The level a signal is taken to be at where there is none to measure: −18 dBFS, where the device's make-up holds it. */
const DIGITAL_NOMINAL = 0.125

/** The grain of the quantiser as the spectrum shows it under 1 kHz, in dB: white noise of a twelfth of the step's square at the converter's rate. */
function grainDb(view: DisplayView, level: number, sampleRate: number, binHz: number): number {
  const { rate } = converterRate(view, sampleRate)
  const step = converterStep(view.value('bits'), view.value('companding') >= 0.5, level)
  return noiseBinDb(((step * step) / 12) * (sampleRate / rate), sampleRate, binHz)
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
    drag: (x, y) => ({
      rate: moved(x, y, rate)
        ? clamp(2 * hzOfX(clamp(x, band.x, band.x + band.w), band), 1000, 48000)
        : view.value('rate'),
    }),
    reset: () => ({ rate: view.spec('rate')?.default ?? 9000 }),
  }
  const grain = grainDb(view, DIGITAL_NOMINAL, sampleRate, sampleRate / TAP_BINS)
  const bits: DisplayHandle = {
    key: 'bits',
    name: 'Bits',
    x: band.x + 9,
    y: clamp(yOfDb(grain, band, TOP_DB, FOOT_DB), band.y, foot),
    // Up is a coarser step: the grain rises 6 dB for each bit taken away.
    drag: (x, y) => ({
      bits: moved(x, y, bits)
        ? clamp(
            view.value('bits') +
              (grain - dbOfY(clamp(y, band.y, foot), band, TOP_DB, FOOT_DB)) / 6.0206,
            4,
            16,
          )
        : view.value('bits'),
    }),
    reset: () => ({ bits: view.spec('bits')?.default ?? 12 }),
  }
  return [rate, bits]
}

interface DigitalState {
  input: Bins
  /** Per bin of the input: what the filter before the sampler lets through, and what was made from. */
  let: Float32Array
  letFor: string
  /** Per bin: the power that reaches the sampler now. */
  reach: Float32Array
  response: Curve
  before: Curve
  added: [number, number][]
  wave: [number, number][]
}

const DIGITAL_BINS = 2048

const vintageDigital = plateDisplay<DigitalState>({
  place: 'window',
  columns: 2,
  params: ['rate', 'bits', 'companding', 'aliasing', 'filter', 'jitter'],
  live: { meters: false, signal: true, spectrum: true },
  info: 'Above, the spectrum with half the sample rate marked: the line is what the hold and the output filter leave, the dashes what is let in to fold back, the second colour what the converter adds. Drag the points for Rate and Bits. Below, the wave, with a mark for each sample held.',
  init: () => ({
    input: new Bins(DIGITAL_BINS),
    let: new Float32Array(DIGITAL_BINS / 2 + 1),
    letFor: '',
    reach: new Float32Array(DIGITAL_BINS / 2 + 1),
    response: newCurve(),
    before: newCurve(),
    added: [],
    wave: [],
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const boxes = twoBoxes(frame, 28)
    const { band, past } = boxes
    const sr = frame.sampleRate
    const binHz = binHzOf(frame)
    const foot = band.y + band.h
    const { rate, out } = converterRate(frame, sr)
    const aliasing = frame.value('aliasing')
    const filter = Math.round(frame.value('filter'))
    const jitter = frame.value('jitter')
    const settings = `${rate.toFixed(0)} ${filter} ${out}`

    makeCurve(state.response, settings, band, (hz) =>
      out ? 0 : converterOutputDb(filter, hz, rate, sr),
    )
    makeCurve(state.before, `${settings} ${aliasing.toFixed(3)}`, band, (hz) =>
      out ? 0 : db10(converterInput(aliasing, hz, rate, sr)),
    )

    const wave = frame.signal ? (frame.signal.input ?? frame.signal.output).wave : null
    const running = wave !== null && frame.dt > 0
    if (wave && running) state.input.read(wave, frame.dt)
    // How loud the sound going in is: the grain is there only while there is a signal to round.
    const going = frame.signal ? (frame.signal.input ?? frame.signal.output) : null
    const level = going?.rms ?? 0
    const mu = frame.value('companding') >= 0.5
    const sounding = running && (going?.peak ?? 0) > 0.5 * converterStep(frame.value('bits'), mu, 0)

    freqGrid(frame, band)
    drawUnchanged(frame, band)
    clipped(ctx, band, () => {
      drawSpectrum(frame, band)
      const columns = Math.floor(band.w / 2) + 1
      const inHz = sr / DIGITAL_BINS
      const last = state.reach.length - 1
      let grain = 0
      if (sounding) {
        // What reaches the sampler, bin by bin, and how fast it moves: a clock that strays reads a moving wave wrong.
        const letFor = `${rate.toFixed(0)} ${aliasing.toFixed(3)} ${sr}`
        if (letFor !== state.letFor) {
          state.letFor = letFor
          for (let i = 0; i <= last; i++)
            state.let[i] = converterInput(aliasing, i * inHz, rate, sr)
        }
        let slope = 0
        for (let i = 0; i <= last; i++) {
          // A tone of amplitude a has the power a² / 2; its bin and the two beside it hold 1.5 a².
          const tone = Math.pow(10, state.input.db[i] / 10) / 2
          state.reach[i] = tone * state.let[i]
          slope += (2 * Math.PI * i * inHz) ** 2 * (state.reach[i] / 1.5)
        }
        const strays = (jitter * jitter * 0.12) / rate
        const step = converterStep(frame.value('bits'), mu, level)
        grain = (step * step) / 12 + (out ? 0 : slope * strays * strays)
      }
      // The quantiser's grain alone, where Bits puts it for a signal at a working level: the line its point rides on.
      const set = grainDb(frame, DIGITAL_NOMINAL, sr, binHz)
      for (let i = 0; i < columns; i++) {
        const x = band.x + Math.min(band.w, i * 2)
        state.added[i] ??= [0, 0]
        state.added[i][0] = x
        state.added[i][1] = clamp(
          yOfDb(set + state.response.db[i], band, TOP_DB, FOOT_DB),
          band.y - 4,
          foot + 4,
        )
      }
      state.added.length = columns
      trace(ctx, state.added, {
        colour: colours.accent,
        width: 1,
        alpha: sounding ? INK.back : 1,
        dash: [2, 2],
      })
      for (let i = 0; i < columns && sounding; i++) {
        const x = band.x + Math.min(band.w, i * 2)
        const hz = hzOfX(x, band)
        let db = SILENT_DB
        {
          // The grain, white at the converter's rate, and every copy of the input that lands here from a multiple of the rate away.
          let folded = 0
          if (!out) {
            const from = hzOfX(x - 1, band)
            const to = hzOfX(x + 1, band)
            const most = Math.floor((hz + sr / 2) / rate)
            for (let k = -most; k <= most; k++) {
              if (k === 0) continue
              const low = Math.min(Math.abs(from + k * rate), Math.abs(to + k * rate))
              const high = Math.max(Math.abs(from + k * rate), Math.abs(to + k * rate))
              if (low > sr / 2) continue
              const first = clamp(Math.round(low / inHz), 0, last)
              const end = clamp(Math.round(high / inHz), first, last)
              let loudest = 0
              for (let b = first; b <= end; b++) loudest = Math.max(loudest, state.reach[b])
              folded += loudest
            }
          }
          // A tone of power a² / 2 reads 20·log10(a) − 14 dB on the spectrum.
          const tones = folded > 0 ? db10(2 * folded) + TONE_DB : SILENT_DB
          const noise = noiseBinDb(grain * (out ? 1 : sr / rate), sr, binHz)
          db = db10(Math.pow(10, tones / 10) + Math.pow(10, noise / 10)) + state.response.db[i]
        }
        state.added[i][1] = clamp(yOfDb(db, band, TOP_DB, FOOT_DB), band.y - 4, foot + 4)
      }
      if (sounding) {
        fillTo(ctx, state.added, foot + 4, colours.accent, 0.45)
        trace(ctx, state.added, { colour: colours.accent, width: 1.25 })
      }
      if (!out) {
        // Half the rate: what was above it comes back under it.
        const x = xOfHz(rate / 2, band)
        rule(ctx, x, band.y, x, foot, { colour: colours.accent, dash: [2, 2] })
        trace(ctx, curvePoints(state.before, band, CURVE_TOP_DB, CURVE_FOOT_DB), {
          colour: colours.ink,
          width: 1,
          alpha: INK.back,
          dash: [2, 2],
        })
      }
      drawResponse(frame, band, state.response)
    })
    for (const point of digitalHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    if (frame.hot === 'rate') text(frame, hzText(rate), band.x + 1, band.y + 8)
    else if (frame.hot === 'bits')
      text(
        frame,
        `${frame.value('bits').toFixed(1).replace(/\.0$/, '')} bit`,
        band.x + 1,
        band.y + 8,
      )

    // Below: the wave as it comes out, 4 ms of it.
    divide(frame, boxes)
    const middle = past.y + past.h / 2
    const span = Math.round((DIGITAL_SPAN * sr) / 48000)
    if (!out) drawHolds(frame, past, span, sr / rate, 0.24 * jitter * jitter)
    const heard = frame.signal?.output
    if (!heard || !running || heard.peak < 1e-5) {
      rule(ctx, past.x, middle, past.x + past.w, middle, { colour: colours.ink, alpha: INK.grid })
      return
    }
    clipped(ctx, past, () => {
      const start = risingEdge(heard.wave, span)
      let peak = 0.02
      for (let i = 0; i <= span; i++) peak = Math.max(peak, Math.abs(heard.wave[start + i] ?? 0))
      // The levels the quantiser has, where they are far enough apart to see.
      const step = converterStep(frame.value('bits'), false, 0)
      const apart = (step / peak) * (past.h / 2 - 1)
      if (!mu && apart >= 3)
        for (let y = apart; y < past.h / 2; y += apart)
          for (const side of [-1, 1])
            rule(ctx, past.x, middle + side * y, past.x + past.w, middle + side * y, {
              colour: colours.ink,
              alpha: INK.grid,
            })
      rule(ctx, past.x, middle, past.x + past.w, middle, { colour: colours.ink, alpha: INK.grid })
      drawWave(frame, past, state.wave, heard.wave, span)
    })
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

interface NoiseState {
  floor: Curve
  /** The sound going in and the noise under it over the last seconds, dB. */
  sound: History
  noise: History
  /** Ticks and pops as the device counted them, where they fell. */
  ticked: Tally
  popped: Tally
  ticks: number
  pops: number
  lines: number[]
  linesFor: number
  comb: [number, number][]
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

function noiseCurve(state: NoiseState, view: DisplayView, box: Box, binHz: number): Curve {
  const made = ['type', 'level', 'tone', 'width'].map((name) => view.value(name).toFixed(3))
  makeCurve(state.floor, `${made.join(' ')} ${binHz.toFixed(2)}`, box, (hz) =>
    noiseFloorDb(view, hz, 48000, binHz),
  )
  return state.floor
}

/** The loudest of the hum's harmonics, in dB on the spectrum's scale, for a Level and a Width. */
function humPeakDb(view: DisplayView): number {
  const width = view.value('width')
  return (
    view.value('level') +
    db20(Math.max(...humLines(view.value('tone')))) +
    db10(1 - 0.151 * width * width) +
    TONE_DB
  )
}

const isHum = (view: DisplayView): boolean => {
  const bed = Math.round(view.value('type'))
  return bed === 3 || bed === 4
}

/** Where the handle of the floor stands: on the floor's highest point. */
function noiseHandle(view: DisplayView, curve: Curve | null): DisplayHandle[] {
  const { band } = twoBoxes(view)
  const scratch = curve ?? newCurve()
  if (!curve)
    makeCurve(scratch, 'handle', band, (hz) => noiseFloorDb(view, hz, 48000, 48000 / TAP_BINS))
  const peak = curvePeak(scratch)
  const hum = isHum(view)
  const mainsHz = Math.round(view.value('type')) === 4 ? 60 : 50
  const peakDb = hum ? humPeakDb(view) : peak.db
  const x = hum ? xOfHz(mainsHz, band) : band.x + peak.at * band.w
  const over = peakDb - view.value('level')
  const spec = view.spec('level')
  return [
    {
      key: 'level',
      name: 'Level',
      x: clamp(x, band.x + 4, band.x + band.w - 4),
      y: clamp(yOfDb(peakDb, band, TOP_DB, FOOT_DB), band.y, band.y + band.h),
      // Up and down is the level: the floor's highest point follows the pointer.
      drag: (_x, y) => ({
        level: clamp(
          dbOfY(clamp(y, band.y, band.y + band.h), band, TOP_DB, FOOT_DB) - over,
          spec?.min ?? -72,
          spec?.max ?? -12,
        ),
      }),
      reset: () => ({ level: spec?.default ?? -42 }),
    },
  ]
}

const noiseFloor = plateDisplay<NoiseState>({
  place: 'window',
  columns: 2,
  params: ['type', 'level', 'tone', 'width'],
  live: { meters: true, signal: true, spectrum: true },
  info: 'Above, the noise in the second colour under the spectrum of what comes out: its real level at every frequency, hum as lines at its harmonics. Drag its point for the level. Below, the last six seconds: the sound, and the noise riding with it or ducking under it, with its ticks.',
  init: () => ({
    floor: newCurve(),
    sound: new History(NOISE_PAST_SEC, 60, PAST_FOOT_DB, 'max'),
    noise: new History(NOISE_PAST_SEC, 60, PAST_FOOT_DB),
    ticked: new Tally(NOISE_PAST_SEC, 60),
    popped: new Tally(NOISE_PAST_SEC, 60),
    ticks: -1,
    pops: -1,
    lines: [],
    linesFor: NaN,
    comb: [],
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const boxes = twoBoxes(frame)
    const { band, past } = boxes
    const binHz = binHzOf(frame)
    // Without sound the device sleeps and its noise with it: then only where the controls put it is drawn.
    const running = frame.signal !== null && frame.hasMeter('gain')
    const sounding = running && frame.meter('gain') > 1e-3
    const gain = sounding ? frame.meter('gain') : null
    const curve = noiseCurve(state, frame, band, binHz)
    const hum = isHum(frame)

    freqGrid(frame, band)
    clipped(ctx, band, () => {
      drawSpectrum(frame, band)
      drawFloor(frame, band, curve, gain)
      if (hum) {
        const tone = frame.value('tone')
        if (tone !== state.linesFor) {
          state.lines = humLines(tone)
          state.linesFor = tone
        }
        const width = frame.value('width')
        const mains = Math.round(frame.value('type')) === 4 ? 60 : 50
        const base =
          frame.value('level') + db10(1 - 0.151 * width * width) + TONE_DB + db20(gain ?? 1)
        drawComb(frame, band, state.comb, state.lines, mains, base, gain === null ? INK.back : 1)
      }
    })
    for (const point of noiseHandle(frame, curve))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    if (frame.hot === 'level')
      text(frame, `${Math.round(frame.value('level'))} dB`, band.x + band.w - 1, band.y + 8, {
        align: 'right',
      })

    // Below: the sound and the noise under it, into the past.
    divide(frame, boxes)
    const set = frame.value('level')
    const y = (db: number): number =>
      yOfDb(clamp(db, PAST_FOOT_DB, PAST_TOP_DB), past, PAST_TOP_DB, PAST_FOOT_DB)
    if (frame.signal && running && frame.dt > 0) {
      const going = frame.signal.input ?? frame.signal.output
      state.sound.push(frame.now, gainToDb(going.rms))
      state.noise.push(frame.now, set + db20(frame.meter('gain')))
      const ticks = frame.meter('ticks')
      const pops = frame.meter('pops')
      state.ticked.push(frame.now, counted(state.ticks, ticks))
      state.popped.push(frame.now, counted(state.pops, pops))
      state.ticks = ticks
      state.pops = pops
    }
    clipped(ctx, past, () => {
      // Where Level puts the noise, on the strip's scale of levels.
      rule(ctx, past.x, y(set), past.x + past.w, y(set), {
        colour: colours.accent,
        alpha: running ? INK.back : 1,
        dash: [2, 2],
      })
      if (!running) return
      fillTo(ctx, state.sound.points(past, y), past.y + past.h, colours.ink, 0.42)
      const noise = state.noise.points(past, y)
      // Ticks stand on the noise they belong to, taller the more of them fell together; a pop is a dot over them.
      for (let i = 0; i < noise.length; i++) {
        const back = noise.length - 1 - i
        const [x, top] = noise[i]
        const ticks = state.ticked.at(back)
        if (ticks > 0)
          rule(ctx, x, top, x, top - 1 - Math.min(7, 2 * ticks), {
            colour: colours.accent,
            alpha: 0.8,
          })
        if (state.popped.at(back) > 0) dot(ctx, x, top - 9, 1.5, colours.accent)
      }
      trace(ctx, noise, { colour: colours.accent, width: 1.25 })
    })
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
    // The knob the kit's skin gave a shorter word is on the display now, as the filter's edge.
    labels: {},
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
