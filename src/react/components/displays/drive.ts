// Displays of the devices that drive a sound: the curve the signal is bent
// along, and where on it the sound is now. The three are drawn the same way.
// Above, what comes out against what goes in, from minus to plus full scale
// on both axes, over the straight line of no change: the device's own shaping
// function at its present settings, ported from its source, with the level
// going in marked on it in the second ink and the wave coming out faint behind
// it. Below, the tone of the driven sound across frequency, from the filters
// the device has around its curve.
//
// What such a curve cannot hold is left to the strip below it or left out:
// a filter between two stages changes what reaches the curve by frequency,
// and a DC blocker moves it by the wave's own mean.

import { denormalizeParam } from '../../../core/params'
import {
  INK,
  biquad,
  biquadDb,
  clamp,
  clipped,
  dbText,
  dbToGain,
  dot,
  fillRect,
  fillTo,
  follow,
  freqGrid,
  ground,
  handle,
  hzOfX,
  hzText,
  lerp,
  responsePoints,
  rule,
  text,
  trace,
  xOfHz,
  yOfDb,
  type Biquad,
  type Box,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayLevel,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

// --- What the three share ---------------------------------------------------

/** How far past full scale a curve is followed before it is cut. */
const OVER = 1.3
/** Under this a level is silence: no mark, no wave. */
const QUIET = 0.002
/** How fast the mark of the level sinks back, in seconds. */
const LEVEL_FALL = 0.25
/** Where the Drive point stands along the input axis: far right with no drive, near the middle at full. */
const DRIVE_AT_REST = 0.92
const DRIVE_AT_FULL = 0.12

/** Points kept between frames and written again in place. */
type Trace = [number, number][]

interface DriveState {
  curve: Trace
  /** What the curve was worked out from, so it is worked out again only when that moves. */
  curveKey: string
  wave: Trace
  tone: Point[]
  back: Point[]
  toneKey: string
  /** The peak going in, in full scales, sinking back between peaks. */
  level: number
}

const driveState = (): DriveState => ({
  curve: [],
  curveKey: '',
  wave: [],
  tone: [],
  back: [],
  toneKey: '',
  level: 0,
})

/** A response across frequency, in dB. */
type Response = (hz: number) => number

/** What one drive display is drawn from on a frame. */
interface DrivePicture {
  /** What comes out for what goes in, both in full scales. */
  out: (x: number) => number
  /** What `out` was made from. */
  key: string
  /** The device's own reading of the peak going in, for when the plate was not told what feeds it. */
  reading: number | null
  /** The curve, circuit or speaker in use, in a word. */
  word: string
  tone: {
    key: string
    /** The levels at the top and the foot of the strip, in dB. */
    top: number
    foot: number
    /** The responses, made only when `key` moves: the driven sound, and what stands behind it. */
    make(): { main: Response; back?: Response }
  }
  handles: readonly DisplayHandle[]
  /** What the handle in hand is set to, in words. */
  says(key: string): string
}

interface DriveBoxes {
  curve: Box
  tone: Box
}

/**
 * The curve above, the tone in a strip below it. Full scale stands a little
 * inside the ground, so a curve that lies on it is whole, and the level going
 * in has a line of its own between the two.
 */
function driveBoxes(view: Pick<DisplayView, 'width' | 'height'>): DriveBoxes {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const strip = Math.round(all.h * 0.27)
  return {
    curve: { ...all, y: all.y + 3, h: all.h - strip - 10 },
    tone: { ...all, y: all.y + all.h - strip, h: strip },
  }
}

const xOfIn = (value: number, box: Box): number => box.x + ((value + 1) / 2) * box.w
const yOfOut = (value: number, box: Box): number =>
  box.y + ((1 - clamp(value, -OVER, OVER)) / 2) * box.h
const inOfX = (x: number, box: Box): number => ((x - box.x) / box.w) * 2 - 1
const outOfY = (y: number, box: Box): number => 1 - ((y - box.y) / box.h) * 2

/** A reading that is a level: nothing under zero, and nothing that is not a number. */
const levelOf = (reading: number): number => (reading > 0 && Number.isFinite(reading) ? reading : 0)

function sized(points: Trace, length: number): Trace {
  if (points.length === length) return points
  return Array.from({ length }, (): [number, number] => [0, 0])
}

/**
 * A cycle or two of a wave across a box, on the curve's own scale of levels.
 * It starts where the wave rises through zero and runs to the second such
 * place after it, so a steady note stands still from frame to frame. A column
 * that holds several samples shows the largest, so a flat top stays flat.
 */
function waveInto(level: DisplayLevel, box: Box, points: Trace): void {
  const wave = level.wave
  const arm = -0.2 * level.peak
  let armed = false
  let first = -1
  let second = -1
  let third = -1
  for (let i = 1; i < wave.length; i++) {
    if (wave[i] < arm) armed = true
    else if (armed && wave[i - 1] < 0 && wave[i] >= 0) {
      armed = false
      if (first < 0) first = i
      else if (second < 0) second = i
      else {
        third = i
        break
      }
    }
  }
  let start = Math.max(0, first)
  let end = third > 0 ? third : second > 0 ? second : Math.min(wave.length - 1, start + 512)
  if (end - start < 16) {
    start = 0
    end = Math.min(wave.length - 1, 512)
  }
  const step = (end - start) / (points.length - 1)
  for (let c = 0; c < points.length; c++) {
    const at = start + c * step
    let sample: number
    if (step <= 1) {
      const below = Math.floor(at)
      const above = Math.min(wave.length - 1, below + 1)
      sample = lerp(wave[below], wave[above], at - below)
    } else {
      sample = 0
      const last = Math.min(end, Math.ceil(at + step / 2))
      for (let i = Math.max(start, Math.floor(at - step / 2)); i <= last; i++) {
        if (Math.abs(wave[i]) > Math.abs(sample)) sample = wave[i]
      }
    }
    points[c][0] = box.x + (c / (points.length - 1)) * box.w
    points[c][1] = yOfOut(Number.isFinite(sample) ? sample : 0, box)
  }
}

function drawDrive(frame: DisplayFrame<DriveState>, picture: DrivePicture): void {
  const { ctx, colours, state } = frame
  const { signal } = frame
  ground(frame)
  const { curve, tone } = driveBoxes(frame)
  const zero = curve.y + curve.h / 2
  const middle = curve.x + curve.w / 2
  const foot = curve.y + curve.h
  const { out } = picture

  // The scale: full scale above and below, the two axes through silence, and
  // the straight line of no change.
  for (const y of [curve.y, zero, foot]) {
    rule(ctx, curve.x, y, curve.x + curve.w, y, { colour: colours.ink, alpha: INK.grid })
  }
  rule(ctx, middle, curve.y, middle, foot, { colour: colours.ink, alpha: INK.grid })
  rule(ctx, curve.x, foot, curve.x + curve.w, curve.y, {
    colour: colours.ink,
    alpha: INK.rule,
    dash: [2, 2],
  })

  const curveKey = `${picture.key} ${curve.w} ${curve.h}`
  if (curveKey !== state.curveKey) {
    state.curve = sized(state.curve, Math.max(2, Math.round(curve.w * 2) + 1))
    const last = state.curve.length - 1
    for (let i = 0; i <= last; i++) {
      state.curve[i][0] = curve.x + (i / last) * curve.w
      state.curve[i][1] = yOfOut(out((i / last) * 2 - 1), curve)
    }
    state.curveKey = curveKey
  }

  // The level going in: what the taps heard, else what the device itself reports.
  const heard = signal ? (signal.input ? signal.input.peak : picture.reading) : null
  state.level =
    heard === null ? 0 : follow(state.level, Math.min(1, levelOf(heard)), frame.dt, 0, LEVEL_FALL)
  const level = state.level > QUIET ? state.level : 0

  // A stroke on full scale is whole, and what goes over it is cut a little outside.
  clipped(ctx, { x: curve.x - 2, y: curve.y - 4, w: curve.w + 4, h: curve.h + 5.5 }, () => {
    if (signal && signal.output.peak > QUIET) {
      // What comes out, faint: its tops go flat where the curve does.
      state.wave = sized(state.wave, Math.max(2, Math.floor(curve.w / 2) + 1))
      waveInto(signal.output, curve, state.wave)
      fillTo(ctx, state.wave, zero, colours.ink, INK.fill)
    }
    if (level > 0) {
      // The part of the curve the sound is on, under the curve itself.
      const last = state.curve.length - 1
      const from = Math.ceil(((1 - level) / 2) * last)
      const to = Math.floor(((1 + level) / 2) * last)
      ctx.beginPath()
      ctx.moveTo(xOfIn(-level, curve), yOfOut(out(-level), curve))
      for (let i = from; i <= to; i++) ctx.lineTo(state.curve[i][0], state.curve[i][1])
      ctx.lineTo(xOfIn(level, curve), yOfOut(out(level), curve))
      ctx.globalAlpha = 0.85
      ctx.strokeStyle = colours.accent
      ctx.lineWidth = 4.5
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.stroke()
      ctx.globalAlpha = 1
    }
    trace(ctx, state.curve, { colour: colours.ink })
  })
  if (level > 0) {
    // The same level along the input axis, and the point at its peak.
    const left = xOfIn(-level, curve)
    fillRect(ctx, { x: left, y: foot + 2, w: xOfIn(level, curve) - left, h: 2 }, colours.accent)
    dot(
      ctx,
      xOfIn(level, curve),
      clamp(yOfOut(out(level), curve), curve.y, foot),
      2.5,
      colours.accent,
      { ring: colours.ink },
    )
  }

  // Below: the tone of the driven sound.
  const { top, foot: floor } = picture.tone
  const toneKey = `${picture.tone.key} ${tone.w} ${tone.h} ${frame.sampleRate}`
  if (toneKey !== state.toneKey) {
    const made = picture.tone.make()
    state.tone = responsePoints(tone, made.main, top, floor)
    state.back = made.back ? responsePoints(tone, made.back, top, floor) : []
    state.toneKey = toneKey
  }
  const flat = yOfDb(0, tone, top, floor)
  freqGrid(frame, tone)
  rule(ctx, tone.x, flat, tone.x + tone.w, flat, { colour: colours.ink, alpha: INK.rule })
  clipped(ctx, tone, () => {
    trace(ctx, state.back, { colour: colours.ink, width: 1, alpha: INK.back, dash: [2, 2] })
    fillTo(ctx, state.tone, tone.y + tone.h, colours.ink, INK.fill)
    trace(ctx, state.tone, { colour: colours.ink, width: 1.25 })
  })

  for (const point of picture.handles) {
    handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  }
  // In a corner the curve leaves free: what is in use, or what the point in hand is set to.
  const hot = picture.handles.find((point) => point.key === frame.hot)
  text(frame, hot ? picture.says(hot.key) : picture.word.toUpperCase(), curve.x + 1, curve.y + 8, {
    alpha: hot ? INK.text : INK.back,
  })
}

/** The Drive point: on the curve, further left the more drive there is. */
function driveHandle(
  view: DisplayView,
  box: Box,
  param: string,
  out: (x: number) => number,
): DisplayHandle {
  const spec = view.spec(param)
  const at = lerp(DRIVE_AT_REST, DRIVE_AT_FULL, view.at(param))
  return {
    key: 'drive',
    name: 'Drive',
    x: xOfIn(at, box),
    y: clamp(yOfOut(out(at), box), box.y, box.y + box.h),
    // Pulled towards the corner where a hard driven curve has its knee.
    drag: (x) => {
      const position = (DRIVE_AT_REST - inOfX(x, box)) / (DRIVE_AT_REST - DRIVE_AT_FULL)
      return { [param]: spec ? denormalizeParam(spec, position) : clamp(position, 0, 1) }
    },
    reset: () => ({ [param]: spec?.default ?? 0 }),
  }
}

/** The word of a choice parameter: the name of the curve, circuit or speaker it is set to. */
function choiceWord(view: DisplayView, param: string): string {
  return view.spec(param)?.choices?.[Math.round(view.value(param))] ?? ''
}

// --- Filters the three are built from ---------------------------------------

/** A first-order section, y = b0 x + b1 x₁ − a1 y₁. */
interface FirstOrder {
  b0: number
  b1: number
  a1: number
}

function firstOrderDb(filter: FirstOrder, hz: number, sampleRate: number): number {
  const cos = Math.cos((2 * Math.PI * hz) / sampleRate)
  const power =
    (filter.b0 * filter.b0 + filter.b1 * filter.b1 + 2 * filter.b0 * filter.b1 * cos) /
    (1 + filter.a1 * filter.a1 + 2 * filter.a1 * cos)
  return power > 1e-12 ? 10 * Math.log10(power) : -120
}

/**
 * The tilt both the Saturator (`TiltFilter` in `Waveshapers.h`) and Analog
 * Drive (`Tilt` in `filters.h`) end in: `tiltDb` down well below the pivot,
 * as much up well above it, nothing at the pivot.
 */
function tiltFilter(tiltDb: number, pivotHz: number, sampleRate: number): FirstOrder {
  const k = Math.pow(10, tiltDb / 20)
  const w0 = 2 * Math.PI * pivotHz
  const c = w0 / Math.tan(w0 / (2 * sampleRate))
  const zero = w0 / k
  const pole = w0 * k
  const norm = 1 / (c + pole)
  return { b0: k * (c + zero) * norm, b1: k * (zero - c) * norm, a1: (pole - c) * norm }
}

/** A one-pole low-pass, y = y₁ + a (x − y₁) with a = 1 − e^(−2π cut / rate), as both kits have it. */
function onePole(cutHz: number, sampleRate: number): FirstOrder {
  const keep = Math.exp((-2 * Math.PI * Math.min(cutHz, sampleRate * 0.49)) / sampleRate)
  return { b0: 1 - keep, b1: 0, a1: -keep }
}

// --- Saturator --------------------------------------------------------------

const SATURATOR_TAPE = 3

/**
 * The Saturator's five curves, as `Waveshapers.h` has them: tanh, a clip, a
 * tanh whose lower half lands a third sooner, x / √(1 + x²), and a triangle
 * that folds what goes past ±1 back on itself.
 */
export function saturatorShape(curve: number, x: number): number {
  switch (curve) {
    case 0:
      return Math.tanh(x)
    case 1:
      return clamp(x, -1, 1)
    case 2:
      return x >= 0 ? Math.tanh(x) : Math.tanh(x * 1.5) / 1.5
    case SATURATOR_TAPE:
      return x / Math.sqrt(1 + x * x)
    default: {
      const t = (x + 1) * 0.25
      return 4 * Math.abs(t - Math.floor(t + 0.5)) - 1
    }
  }
}

/**
 * What the Saturator puts out for what goes in, as `saturator.h` runs it:
 * Drive in front, the curve at Bias less its own value there (so silence
 * stays silence), Output behind, and the clean signal beside it by Mix.
 */
export function saturatorCurve(view: DisplayView): (x: number) => number {
  const curve = Math.round(view.value('curve'))
  const gain = dbToGain(view.value('driveDb'))
  const bias = view.value('bias')
  const offset = saturatorShape(curve, bias)
  const output = dbToGain(view.value('outputDb'))
  const mix = view.value('mix')
  return (x) => x + ((saturatorShape(curve, gain * x + bias) - offset) * output - x) * mix
}

/**
 * The Saturator's tone: the tilt about 1 kHz, and on the Tape curve the high
 * cut that closes from 16 kHz to 6 kHz as Drive goes up.
 */
export function saturatorTone(view: DisplayView, sampleRate: number): Response {
  const tilt = tiltFilter(view.value('toneDb'), 1000, sampleRate)
  const tape =
    Math.round(view.value('curve')) === SATURATOR_TAPE
      ? onePole(16000 * Math.pow(6000 / 16000, view.value('driveDb') / 36), sampleRate)
      : null
  return (hz) =>
    firstOrderDb(tilt, hz, sampleRate) + (tape ? firstOrderDb(tape, hz, sampleRate) : 0)
}

/** How far the Bias point travels: with the curve while Output and Mix leave it room, never less than half. */
const biasTravel = (view: DisplayView): number =>
  clamp(dbToGain(view.value('outputDb')) * view.value('mix'), 0.5, 1)

/** The bias at which a curve's own value is `value`: every curve rises from −1 to 1, so halving finds it. */
function biasFor(curve: number, value: number): number {
  let low = -1
  let high = 1
  for (let i = 0; i < 20; i++) {
    const half = (low + high) / 2
    if (saturatorShape(curve, half) < value) low = half
    else high = half
  }
  return (low + high) / 2
}

function saturatorHandles(view: DisplayView, out = saturatorCurve(view)): DisplayHandle[] {
  const { curve: box } = driveBoxes(view)
  const curve = Math.round(view.value('curve'))
  const bias = view.value('bias')
  const travel = biasTravel(view)
  return [
    driveHandle(view, box, 'driveDb', out),
    {
      // The middle of the curve, where the signal sits when it is not biased:
      // Bias takes it off the centre, down and to the left for more.
      key: 'bias',
      name: 'Bias',
      x: xOfIn(-bias / dbToGain(view.value('driveDb')), box),
      y: yOfOut(-saturatorShape(curve, bias) * travel, box),
      drag: (_x, y) => ({ bias: biasFor(curve, -outOfY(y, box) / travel) }),
      reset: () => ({ bias: view.spec('bias')?.default ?? 0 }),
    },
  ]
}

const saturator = plateDisplay<DriveState>({
  place: 'window',
  columns: 2,
  params: ['curve', 'driveDb', 'bias', 'toneDb', 'outputDb', 'mix'],
  live: { signal: true },
  info: 'Above, the curve the sound is bent along: in runs across, out runs up, and the dashed line is no change. The second colour marks the level going in, the faint shape is the wave coming out. Drag the point on the curve for Drive and the one in its middle for Bias. Below, the tone across the range.',
  init: driveState,
  draw(frame) {
    const bias = frame.value('bias')
    const out = saturatorCurve(frame)
    drawDrive(frame, {
      out,
      key: ['curve', 'driveDb', 'bias', 'outputDb', 'mix'].map((name) => frame.value(name)).join(),
      reading: null,
      word: choiceWord(frame, 'curve'),
      tone: {
        key: `${frame.value('curve')} ${frame.value('driveDb')} ${frame.value('toneDb')}`,
        top: 15,
        foot: -15,
        make: () => ({ main: saturatorTone(frame, frame.sampleRate) }),
      },
      handles: saturatorHandles(frame, out),
      says: (key) =>
        key === 'bias'
          ? `Bias ${bias > 0 ? '+' : bias < 0 ? '−' : ''}${Math.abs(bias).toFixed(2)}`
          : dbText(frame.value('driveDb')),
    })
  },
  handles: (view) => saturatorHandles(view),
})

// --- Analog Drive -----------------------------------------------------------

type Eq = readonly [
  kind: 'lowshelf' | 'highshelf' | 'peaking',
  hz: number,
  gainDb: number,
  q: number,
]

interface Circuit {
  /** The weights of the three kernels and where each lands: soft above and below zero, firm, hard. */
  soft: number
  softAbove: number
  softBelow: number
  firm: number
  firmCeiling: number
  hard: number
  hardCeiling: number
  /** Where the signal sits on the curve: bias + biasDrive × drive + biasLevel × e / (e + biasKnee). */
  bias: number
  biasDrive: number
  biasLevel: number
  biasKnee: number
  /** The gain into the curve falls to 1 / (1 + sag) when what leaves it stands at its ceiling. */
  sag: number
  /** The equaliser into the curve and the one out of it. */
  pre: readonly Eq[]
  post: readonly Eq[]
  /** Auto Gain's make-up in dB at 13 points of the gain range, with Push off and on (`gain_table.h`). */
  makeup: readonly [readonly number[], readonly number[]]
}

/** A circuit from its rows in `circuits.h`: the curve's seven numbers, then bias, its two slopes, its knee and the sag. */
function circuit(
  [soft, softAbove, softBelow, firm, firmCeiling, hard, hardCeiling]: readonly number[],
  [bias, biasDrive, biasLevel, biasKnee, sag]: readonly number[],
  pre: readonly Eq[],
  post: readonly Eq[],
  makeup: Circuit['makeup'],
): Circuit {
  return {
    soft,
    softAbove,
    softBelow,
    firm,
    firmCeiling,
    hard,
    hardCeiling,
    bias,
    biasDrive,
    biasLevel,
    biasKnee,
    sag,
    pre,
    post,
    makeup,
  }
}

/** The five circuits of Analog Drive, as `circuits.h` and `gain_table.h` have them. */
const CIRCUITS: readonly Circuit[] = [
  // Tape preamp: all soft knee, a little lopsided; treble lifted on the way in and cut by more on the way out.
  circuit(
    [1, 1, 1.3, 0, 1, 0, 1],
    [0.05, 0.08, 0, 1, 0.2],
    [['highshelf', 3200, 8, 0]],
    [
      ['highshelf', 3200, -10.5, 0],
      ['lowshelf', 120, 1.8, 0],
    ],
    [
      [12.61, 9.02, 5.48, 2.03, -1.11, -4.0, -6.52, -8.57, -10.1, -11.14, -11.79, -12.17, -12.38],
      [
        -5.85, -8.04, -9.71, -10.89, -11.64, -12.08, -12.33, -12.46, -12.54, -12.57, -12.59, -12.6,
        -12.6,
      ],
    ],
  ),
  // Console: a symmetric knee, half soft and half firm, reached first by the mids.
  circuit(
    [0.45, 1, 1, 0.55, 0.9, 0, 1],
    [0.01, 0.01, 0, 1, 0],
    [['peaking', 1800, 4, 0.5]],
    [
      ['peaking', 1800, -1.8, 0.5],
      ['highshelf', 9000, 0.8, 0],
    ],
    [
      [12.05, 8.39, 4.75, 1.13, -2.26, -5.53, -8.57, -11.17, -13.16, -14.56, -15.5, -16.12, -16.5],
      [
        -7.74, -10.48, -12.66, -14.21, -15.27, -15.97, -16.41, -16.68, -16.83, -16.92, -16.97,
        -16.99, -17.01,
      ],
    ],
  ),
  // Transformer: the curve sees the lows 8.5 dB up, and the exact inverse follows it.
  circuit(
    [0.65, 1, 1.06, 0.35, 1, 0, 1],
    [0.03, 0.03, 0, 1, 0.08],
    [['lowshelf', 160, 8.5, 0]],
    [
      ['lowshelf', 160, -8.5, 0],
      ['peaking', 240, 3, 0.7],
    ],
    [
      [12.12, 8.51, 4.95, 1.49, -1.64, -4.52, -7.02, -9.09, -10.73, -11.99, -12.92, -13.58, -14.02],
      [
        -6.35, -8.55, -10.3, -11.66, -12.68, -13.41, -13.91, -14.23, -14.42, -14.54, -14.6, -14.63,
        -14.65,
      ],
    ],
  ),
  // Triode: one soft knee far earlier on one side, at a working point that moves off centre with the level.
  circuit(
    [1, 0.7, 1.6, 0, 1, 0, 1],
    [0.14, 0.15, 1.2, 1.5, 0],
    [['lowshelf', 150, 2, 0]],
    [
      ['lowshelf', 150, -1.2, 0],
      ['highshelf', 6000, 1.2, 0],
    ],
    [
      [12.37, 8.76, 5.19, 1.68, -1.58, -4.69, -7.58, -10.18, -12.39, -14.16, -15.47, -16.4, -17.01],
      [
        -7.0, -9.67, -11.96, -13.8, -15.2, -16.2, -16.88, -17.31, -17.58, -17.73, -17.82, -17.87,
        -17.89,
      ],
    ],
  ),
  // Pentode: mostly a clip under a firm knee, so it stays clean and then bites; its supply sags most.
  circuit(
    [0, 1, 1, 0.35, 0.75, 0.65, 0.55],
    [0.02, 0.02, 0, 1, 0.5],
    [
      ['peaking', 2000, 3.5, 0.6],
      ['lowshelf', 150, -4, 0],
    ],
    [
      ['peaking', 2000, -1, 0.6],
      ['lowshelf', 150, 2, 0],
      ['highshelf', 4500, 1.5, 0],
    ],
    [
      [12.51, 8.93, 5.39, 1.91, -1.32, -4.43, -7.26, -9.59, -11.32, -12.52, -13.3, -13.78, -14.06],
      [
        -6.5, -8.99, -10.89, -12.23, -13.12, -13.67, -14.0, -14.19, -14.29, -14.35, -14.37, -14.39,
        -14.4,
      ],
    ],
  ),
]

/**
 * A circuit's curve, as `curve.h` has it: a soft knee that never quite lands
 * (and lands sooner on one side than the other), a firm one that does, and a
 * clip, each with unit slope at zero, by the circuit's weights.
 */
export function circuitShape(circuit: Circuit, v: number): number {
  let y = 0
  if (circuit.soft > 0) {
    const steep = v < 0 ? circuit.softBelow : circuit.softAbove
    const t = (v * steep) / 1.5
    const r2 = 1 + t * t
    y += ((circuit.soft / (2 * steep)) * t * (3 + 2 * t * t)) / (r2 * Math.sqrt(r2))
  }
  if (circuit.firm > 0) {
    const t = v / (1.5 * circuit.firmCeiling)
    y +=
      circuit.firm *
      circuit.firmCeiling *
      (Math.abs(t) < 1 ? t * (1.5 - 0.5 * t * t) : Math.sign(t))
  }
  if (circuit.hard > 0) y += circuit.hard * clamp(v, -circuit.hardCeiling, circuit.hardCeiling)
  return y
}

/** Where the Drive knob sits in the gain range, 0 to 1 (`drive_taper`): it rises fastest at the bottom. */
const driveTaper = (knob: number): number => Math.log1p(8 * clamp(knob, 0, 1)) / Math.log(9)
/** Drive 1 is 42 dB into the curve, from a quarter of the way to its ceiling; Push is ten times more. */
const ANALOG_DRIVE_DB = 42
const ANALOG_HEADROOM = 0.25
const ANALOG_PUSH = 10

/** The make-up after a circuit in dB (`makeup_db`): the measured table with Auto Gain on, the headroom given back without. */
function analogMakeupDb(circuit: Circuit, drive: number, push: boolean, autoGain: boolean): number {
  const [plain, pushed] = circuit.makeup
  const position = clamp(drive, 0, 1) * (plain.length - 1)
  const index = Math.min(plain.length - 2, Math.floor(position))
  const read = (table: readonly number[]): number =>
    lerp(table[index], table[index + 1], position - index)
  if (autoGain) return push ? read(pushed) : read(plain)
  return (
    plain[0] + 20 * Math.log10(ANALOG_HEADROOM) * drive + (push ? read(pushed) - read(plain) : 0)
  )
}

/** The last stage of the driven signal (`safety`): untouched up to 1.5, then a knee that lands on 4. */
function analogSafety(x: number): number {
  const size = Math.abs(x)
  if (size <= 1.5) return x
  return Math.sign(x) * Math.min(3.99999, 1.5 + 2.5 * Math.tanh((size - 1.5) / 2.5))
}

const analogCircuit = (view: DisplayView): Circuit =>
  CIRCUITS[clamp(Math.round(view.value('circuit')), 0, CIRCUITS.length - 1)]

/** The gain into the circuit's curve for a signal at full scale (`set_gain`, Push, and the sag under `envelope`). */
function analogGain(view: DisplayView, envelope = 0): number {
  const drive = driveTaper(view.value('drive'))
  const push = view.value('push') >= 0.5 ? ANALOG_PUSH : 1
  const full = ANALOG_HEADROOM * Math.pow(10, (ANALOG_DRIVE_DB * drive) / 20) * push
  return full / (1 + analogCircuit(view).sag * envelope)
}

/**
 * What Analog Drive puts out for what goes in, as `analog_drive.h` runs it:
 * the gain of Drive and Push, sagging under the level that leaves the curve
 * (`envelope`); the circuit's curve at a working point that moves with Drive
 * and with the level arriving (`arriving`), less its own value there; the
 * make-up, Output and the safety stage; and the clean signal beside it by
 * Mix. The two levels are the device's own readings, in the curve's units.
 */
export function analogDriveCurve(
  view: DisplayView,
  arriving = 0,
  envelope = 0,
): (x: number) => number {
  const circuit = analogCircuit(view)
  const drive = driveTaper(view.value('drive'))
  const push = view.value('push') >= 0.5
  const gain = analogGain(view, envelope)
  const bias =
    circuit.bias +
    circuit.biasDrive * drive +
    (circuit.biasLevel * arriving) / (arriving + circuit.biasKnee)
  const offset = circuitShape(circuit, bias)
  const after =
    dbToGain(analogMakeupDb(circuit, drive, push, view.value('autoGain') >= 0.5)) *
    dbToGain(view.value('output'))
  const mix = view.value('mix')
  return (x) =>
    x + (analogSafety((circuitShape(circuit, gain * x + bias) - offset) * after) - x) * mix
}

/**
 * One section of Analog Drive's state-variable filter (`Section` in
 * `filters.h`) at a frequency, as a complex number: a trapezoidal filter is
 * the analogue one with its frequencies bent by the tangent.
 */
function section(
  kind: 'highpass' | 'lowpass',
  cutHz: number,
  q: number,
  hz: number,
  sampleRate: number,
): [number, number] {
  const bend = (f: number): number =>
    Math.tan((Math.PI * clamp(f, 5, sampleRate * 0.49)) / sampleRate)
  const r = bend(hz) / bend(cutHz)
  // 1 / (1 − r² + j r / q), times −r² for the high-pass.
  const re = 1 - r * r
  const im = r / q
  const scale = (kind === 'highpass' ? -r * r : 1) / (re * re + im * im)
  return [re * scale, -im * scale]
}

/** The bell of the same filter (`set_bell`), in dB. */
function bellDb(cutHz: number, q: number, gainDb: number, hz: number, sampleRate: number): number {
  const bend = (f: number): number =>
    Math.tan((Math.PI * clamp(f, 5, sampleRate * 0.49)) / sampleRate)
  const r = bend(hz) / bend(cutHz)
  const amp = Math.pow(10, gainDb / 40)
  const k = 1 / (q * amp)
  const re = 1 - r * r
  return (
    10 * Math.log10((re * re + k * amp * amp * r * (k * amp * amp * r)) / (re * re + k * r * k * r))
  )
}

const powerDb = (re: number, im: number): number => {
  const power = re * re + im * im
  return power > 1e-12 ? 10 * Math.log10(power) : -120
}

/**
 * Analog Drive's tone for a quiet sound, as `control` in `analog_drive.h`
 * sets its filters. `into` is what reaches the circuit's curve: Low Cut (out
 * of the path at 20 Hz, all in from 30), Low Bump (a bell of up to 9 dB just
 * above the cut, never under 60 Hz) and the circuit's emphasis; what that
 * lifts is what breaks up first. `net` is what is heard: the same through the
 * circuit's de-emphasis, Tone (a tilt of up to 6 dB about 800 Hz) and High
 * Cut (24 dB an octave, out of the path at 20 kHz, all in from 16 kHz down).
 */
export function analogDriveTone(
  view: DisplayView,
  sampleRate: number,
): { into: Response; net: Response } {
  const circuit = analogCircuit(view)
  const made = (eq: Eq): Biquad => biquad(eq[0], eq[1], eq[3], eq[2], sampleRate)
  const pre = circuit.pre.map(made)
  const post = circuit.post.map(made)
  const lowHz = view.value('lowCut')
  const lowAmount = clamp((1.01 * Math.log(lowHz / 20)) / Math.log(30 / 20) - 0.01, 0, 1)
  const bump = view.value('lowBump')
  const bumpHz = Math.max(60, 1.6 * lowHz)
  const tilt = tiltFilter(6 * view.value('tone'), 800, sampleRate)
  const highHz = view.value('highCut')
  const highOpen = clamp((1.01 * Math.log(highHz / 16000)) / Math.log(20000 / 16000), 0, 1)
  const sum = (filters: readonly Biquad[], hz: number): number =>
    filters.reduce((db, filter) => db + biquadDb(filter, hz, sampleRate), 0)
  const into: Response = (hz) => {
    // The cut is faded in beside the clean signal, so the two are added as they stand.
    const [re, im] = section('highpass', lowHz, Math.SQRT1_2, hz, sampleRate)
    const cut = powerDb(1 + (re - 1) * lowAmount, im * lowAmount)
    return cut + (bump > 0 ? bellDb(bumpHz, 1.1, 9 * bump, hz, sampleRate) : 0) + sum(pre, hz)
  }
  const net: Response = (hz) => {
    // A fourth-order Butterworth as two sections, faded out towards the top of its travel.
    const [aRe, aIm] = section('lowpass', highHz, 0.5411961, hz, sampleRate)
    const [bRe, bIm] = section('lowpass', highHz, 1.30656296, hz, sampleRate)
    const re = aRe * bRe - aIm * bIm
    const im = aRe * bIm + aIm * bRe
    const cut = powerDb(re + (1 - re) * highOpen, im * (1 - highOpen))
    return into(hz) + sum(post, hz) + firstOrderDb(tilt, hz, sampleRate) + cut
  }
  return { into, net }
}

const ANALOG_TONE_TOP = 15
const ANALOG_TONE_FOOT = -27

function analogDriveHandles(view: DisplayView, out = analogDriveCurve(view)): DisplayHandle[] {
  const { curve, tone } = driveBoxes(view)
  const flat = yOfDb(0, tone, ANALOG_TONE_TOP, ANALOG_TONE_FOOT)
  const cut = (param: 'lowCut' | 'highCut', name: string): DisplayHandle => {
    const spec = view.spec(param)
    return {
      key: param,
      name,
      x: xOfHz(view.value(param), tone),
      y: flat,
      drag: (x) => ({ [param]: clamp(hzOfX(x, tone), spec?.min ?? 20, spec?.max ?? 20000) }),
      // Back to the end of its travel, where it is out of the path.
      reset: () => ({ [param]: spec?.default ?? view.value(param) }),
    }
  }
  return [
    driveHandle(view, curve, 'drive', out),
    cut('lowCut', 'Low cut'),
    cut('highCut', 'High cut'),
  ]
}

const analogDrive = plateDisplay<DriveState>({
  place: 'window',
  columns: 2,
  params: [
    'drive',
    'circuit',
    'push',
    'lowCut',
    'lowBump',
    'tone',
    'highCut',
    'autoGain',
    'output',
    'mix',
  ],
  live: { meters: true, signal: true },
  info: 'Above, the curve of the circuit: in runs across, out runs up. The second colour marks the level going in, the faint shape is the wave coming out. The curve leans and gives as it is pushed. Drag the point on it for Drive. Below, the tone, with a point per cut. Dashed is what reaches the circuit.',
  init: driveState,
  draw(frame) {
    // The circuit follows the sound: its working point and its sag are the device's own readings.
    const running = frame.signal !== null
    const arriving = running ? levelOf(frame.meter('arriving')) : 0
    const envelope = running ? levelOf(frame.meter('envelope')) : 0
    const out = analogDriveCurve(frame, arriving, envelope)
    const gain = analogGain(frame, envelope)
    drawDrive(frame, {
      out,
      key: `${['drive', 'circuit', 'push', 'autoGain', 'output', 'mix']
        .map((name) => frame.value(name))
        .join()} ${arriving.toFixed(3)} ${envelope.toFixed(3)}`,
      reading: frame.hasMeter('arriving') ? arriving / gain : null,
      word: choiceWord(frame, 'circuit'),
      tone: {
        key: ['circuit', 'lowCut', 'lowBump', 'tone', 'highCut']
          .map((name) => frame.value(name))
          .join(),
        top: ANALOG_TONE_TOP,
        foot: ANALOG_TONE_FOOT,
        make: () => {
          const { into, net } = analogDriveTone(frame, frame.sampleRate)
          return { main: net, back: into }
        },
      },
      handles: analogDriveHandles(frame, out),
      says: (key) =>
        key === 'lowCut' || key === 'highCut'
          ? `${key === 'lowCut' ? 'Low cut' : 'High cut'} ${hzText(frame.value(key))}`
          : // The gain into the circuit above where Drive starts.
            dbText(
              ANALOG_DRIVE_DB * driveTaper(frame.value('drive')) +
                (frame.value('push') >= 0.5 ? 20 : 0),
            ),
    })
  },
  handles: (view) => analogDriveHandles(view),
})

// --- Re-amp -----------------------------------------------------------------

type SpeakerSection = readonly [
  kind: 'highpass' | 'lowpass' | 'peaking',
  hz: number,
  q: number,
  db: number,
]

interface Speaker {
  sections: readonly SpeakerSection[]
  /** Where the cone starts to beam: the corner of the treble lost off its axis. */
  beamHz: number
  /** Level against the loudness match, in dB. */
  trimDb: number
}

/** The five loudspeakers of Re-amp, as `speakers.h` has them. */
const SPEAKERS: readonly Speaker[] = [
  {
    // Small.
    sections: [
      ['highpass', 450, 1.3, 0],
      ['peaking', 700, 1.4, 2.5],
      ['peaking', 1300, 2, -3],
      ['peaking', 2300, 2.5, 4],
      ['peaking', 3000, 5, -4],
      ['lowpass', 3450, 1.3, 0],
      ['lowpass', 3450, 0.54, 0],
    ],
    beamHz: 3500,
    trimDb: -2,
  },
  {
    // Combo.
    sections: [
      ['highpass', 125, 1.1, 0],
      ['highpass', 110, 0.6, 0],
      ['peaking', 400, 1, -2.5],
      ['peaking', 2500, 1.6, 5],
      ['peaking', 3500, 6, -5],
      ['peaking', 4100, 5, 3],
      ['lowpass', 3900, 1.2, 0],
      ['lowpass', 3900, 0.6, 0],
    ],
    beamHz: 1800,
    trimDb: -0.5,
  },
  {
    // Stack.
    sections: [
      ['highpass', 100, 1.3, 0],
      ['highpass', 82, 0.7, 0],
      ['peaking', 550, 0.8, -6],
      ['peaking', 2200, 5, -4],
      ['peaking', 3000, 1.8, 4],
      ['peaking', 4300, 5, 2.5],
      ['lowpass', 3600, 1.25, 0],
      ['lowpass', 3600, 0.58, 0],
    ],
    beamHz: 1500,
    trimDb: -0.5,
  },
  {
    // Horn.
    sections: [
      ['highpass', 520, 1.1, 0],
      ['highpass', 460, 0.7, 0],
      ['peaking', 950, 3.5, 6],
      ['peaking', 1350, 4, -5],
      ['peaking', 1900, 4, 5],
      ['peaking', 2800, 4, 3],
      ['lowpass', 2900, 1.2, 0],
      ['lowpass', 2900, 0.6, 0],
    ],
    beamHz: 2000,
    trimDb: -2.5,
  },
  {
    // Full range.
    sections: [
      ['highpass', 38, 0.7, 0],
      ['peaking', 2800, 1, -1],
      ['lowpass', 18000, 0.7, 0],
    ],
    beamHz: 5000,
    trimDb: 0,
  },
]

/** A speaker's filters at a sample rate, and the gain that makes it as loud as what went in. */
interface BuiltSpeaker {
  filters: readonly Biquad[]
  gainDb: number
}

const builtSpeakers = new Map<string, BuiltSpeaker>()

/**
 * A speaker as `SpeakerBank::design` builds it: its sections, and a gain from
 * their mean power on pink noise through a loudness weighting (a 4 dB shelf
 * above 1.7 kHz and a high-pass at 38 Hz), so every speaker is as loud.
 */
function builtSpeaker(model: number, sampleRate: number): BuiltSpeaker {
  const index = clamp(Math.round(model), 0, SPEAKERS.length - 1)
  const key = `${index} ${sampleRate}`
  const kept = builtSpeakers.get(key)
  if (kept) return kept
  const speaker = SPEAKERS[index]
  const filters = speaker.sections.map(([kind, hz, q, db]) =>
    biquad(kind, Math.min(hz, 0.45 * sampleRate), q, db, sampleRate),
  )
  const shelf = biquad('highshelf', 1682, 0, 4, sampleRate)
  const rumble = biquad('highpass', 38.1, 0.5, 0, sampleRate)
  const top = Math.min(20000, 0.45 * sampleRate)
  const points = 120
  let weighted = 0
  let reference = 0
  for (let i = 0; i < points; i++) {
    const hz = 20 * Math.pow(top / 20, (i + 0.5) / points)
    const weightDb = biquadDb(shelf, hz, sampleRate) + biquadDb(rumble, hz, sampleRate)
    const db = filters.reduce((sum, filter) => sum + biquadDb(filter, hz, sampleRate), 0)
    weighted += Math.pow(10, (weightDb + db) / 10)
    reference += Math.pow(10, weightDb / 10)
  }
  const loudness = weighted > 1e-12 ? weighted / reference : 1
  const built = { filters, gainDb: speaker.trimDb - 10 * Math.log10(loudness) }
  builtSpeakers.set(key, built)
  return built
}

/** The amplifier's make-up at five settings of Drive (`kMakeup`), read between them. */
const RE_AMP_MAKEUP = [1, 1, 1.005, 0.978, 0.875] as const

/** The valve: u / √(1 + u²). */
const valve = (u: number): number => u / Math.sqrt(1 + u * u)

/** The gain into the valve (`gain_`): half at Drive 0, 30 dB more at Drive 1. */
const reAmpGain = (view: DisplayView): number => 0.5 * Math.pow(2, 5 * view.value('drive'))

/** The limiter after Output (`kit::soft_clip` scaled by 4): untouched up to 2, landing on 4. */
function reAmpLimit(x: number): number {
  const size = Math.abs(x) / 4
  if (size <= 0.5) return x
  const t = clamp((size - 0.5) * 2, -3, 3)
  return Math.sign(x) * 4 * (0.5 + (0.5 * t * (27 + t * t)) / (27 + 9 * t * t))
}

/**
 * What Re-amp's amplifier puts out for what goes in, as `re_amp.h` runs it:
 * the gain of Drive into a valve at a bias that grows with Drive, less the
 * valve's own value there, at a level that holds an ordinary signal where it
 * came in. `load` is the device's own reading of how hard the supply is hit:
 * it takes up to 35 % off the gain and 20 % off the ceiling. The speaker, the
 * microphone and the room after it are taken as passing the level on; then
 * Output, the limiter, and the clean signal beside it by Mix.
 */
export function reAmpCurve(view: DisplayView, load = 0): (x: number) => number {
  const drive = clamp(view.value('drive'), 0, 1)
  const gain = reAmpGain(view)
  const bias = 0.12 + 0.2 * drive
  const position = drive * 4
  const index = Math.min(3, Math.floor(position))
  const makeup = lerp(RE_AMP_MAKEUP[index], RE_AMP_MAKEUP[index + 1], position - index)
  const level =
    (makeup * Math.sqrt(1 + 0.18 * 0.18 * gain * gain) * Math.pow(1 + bias * bias, 1.5)) / gain
  const droop = (load * load) / (load * load + 4)
  const driven = gain * (1 - 0.35 * droop)
  const ceiling = level * (1 - 0.2 * droop)
  const offset = valve(bias)
  const output = dbToGain(view.value('output'))
  const mix = view.value('mix')
  return (x) => x + (reAmpLimit((valve(driven * x + bias) - offset) * ceiling * output) - x) * mix
}

/**
 * Re-amp's tone for a quiet sound, as `control` in `re_amp.h` sets it. Both
 * start with the amplifier's Bass and Treble (shelves of up to 10 dB at
 * 160 Hz and 2.8 kHz) and the speaker. `direct` is the speaker as the
 * microphone hears it: the treble lost off the cone's axis (a shelf from
 * where it beams and a low-pass that closes with Angle), the lift under
 * 180 Hz close to the cone, and the share of the direct sound at this
 * Distance. `room` is the share of the room, which hears the speaker from all
 * sides through its own 6.5 kHz roll-off.
 */
export function reAmpTone(
  view: DisplayView,
  sampleRate: number,
): { direct: Response; room: Response } {
  const model = clamp(Math.round(view.value('speaker')), 0, SPEAKERS.length - 1)
  const speaker = builtSpeaker(model, sampleRate)
  const { beamHz } = SPEAKERS[model]
  const angle = view.value('angle')
  const distance = view.value('distance')
  const closeUp = 1 - Math.min(1, 2 * distance)
  const amp = [
    biquad('lowshelf', 160, 0, 10 * view.value('bass'), sampleRate),
    biquad('highshelf', 2800, 0, 10 * view.value('treble'), sampleRate),
    ...speaker.filters,
  ]
  const mic = [
    biquad('highshelf', beamHz, 0, -9 * angle, sampleRate),
    biquad('lowshelf', 180, 0, 3 * closeUp * closeUp, sampleRate),
  ]
  const air = onePole(18000 * Math.pow(Math.min(2.2 * beamHz, 18000) / 18000, angle), sampleRate)
  const airMix = Math.min(1, 4 * angle)
  const send = onePole(6500, sampleRate)
  // The direct sound gives way to the room at constant power.
  const theta = 1.44 * Math.pow(distance, 1.3)
  const directDb = 20 * Math.log10(Math.max(1e-6, Math.cos(theta)))
  const roomDb = 20 * Math.log10(Math.max(1e-6, Math.sin(theta)))
  const sum = (filters: readonly Biquad[], hz: number): number =>
    filters.reduce((db, filter) => db + biquadDb(filter, hz, sampleRate), speaker.gainDb)
  return {
    direct: (hz) => {
      // The low-pass is faded in beside the open sound: 1 + (H − 1) × mix, H = (1 − a) / (1 − a z⁻¹).
      const w = (2 * Math.PI * hz) / sampleRate
      const re = 1 + air.a1 * Math.cos(w)
      const im = -air.a1 * Math.sin(w)
      const scale = air.b0 / (re * re + im * im)
      const closed = powerDb(1 + (re * scale - 1) * airMix, -im * scale * airMix)
      return sum(amp, hz) + sum(mic, hz) - speaker.gainDb + closed + directDb
    },
    room: (hz) => sum(amp, hz) + firstOrderDb(send, hz, sampleRate) + roomDb,
  }
}

function reAmpHandles(view: DisplayView, out = reAmpCurve(view)): DisplayHandle[] {
  return [driveHandle(view, driveBoxes(view).curve, 'drive', out)]
}

const reAmp = plateDisplay<DriveState>({
  place: 'window',
  columns: 2,
  params: ['speaker', 'drive', 'bass', 'treble', 'distance', 'angle', 'output', 'mix'],
  live: { meters: true, signal: true },
  info: 'Above, the curve of the amplifier: in runs across, out runs up. The second colour marks the level going in, the faint shape is the wave coming out. Drag the point on the curve for Drive. Below, the speaker as the microphone hears it, and dashed the room, which comes up as it is pulled back.',
  init: driveState,
  draw(frame) {
    // The supply gives when the amplifier is hit hard: the device's own reading.
    const load = frame.signal ? levelOf(frame.meter('load')) : 0
    const out = reAmpCurve(frame, load)
    drawDrive(frame, {
      out,
      key: `${frame.value('drive')} ${frame.value('output')} ${frame.value('mix')} ${load.toFixed(3)}`,
      reading: frame.hasMeter('load') ? load / reAmpGain(frame) : null,
      word: choiceWord(frame, 'speaker'),
      tone: {
        key: ['speaker', 'bass', 'treble', 'distance', 'angle']
          .map((name) => frame.value(name))
          .join(),
        top: 15,
        foot: -33,
        make: () => {
          const { direct, room } = reAmpTone(frame, frame.sampleRate)
          return { main: direct, back: room }
        },
      },
      handles: reAmpHandles(frame, out),
      // The gain into the valve.
      says: () => dbText(20 * Math.log10(reAmpGain(frame))),
    })
  },
  handles: (view) => reAmpHandles(view),
})

export const DRIVE_FACES: Readonly<Record<string, PlateFace>> = {
  saturator: {
    display: saturator,
    face: ['curve', 'driveDb', 'toneDb', 'mix'],
  },
  'analog-drive': {
    display: analogDrive,
    face: ['drive', 'circuit', 'tone', 'output'],
  },
  're-amp': {
    display: reAmp,
    face: ['speaker', 'drive', 'distance', 'room'],
  },
}
