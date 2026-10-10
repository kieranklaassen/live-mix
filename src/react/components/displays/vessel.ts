// The display of Vessel: the body's resonances over the frequencies, each
// peak where the device puts it, with the body itself drawn above and the
// place the sound is heard from marked on it. The laws and the tables are
// those of `cpp/devices/vessel/bodies.h` and `vessel.h`, copied here; the
// test beside this file holds them to the header's numbers.

import {
  FLOOR_DB,
  FREQ_MAX,
  FREQ_MIN,
  INK,
  clamp,
  clipped,
  fillTo,
  follow,
  freqGrid,
  ground,
  handle,
  hzOfX,
  hzText,
  label,
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
  type DisplayHold,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

// --- The bodies (bodies.h: kBodies) ------------------------------------------

/** One resonance: its frequency over the lowest, its strength, how long it rings against the slowest, and its shape along the body. */
export interface VesselMode {
  ratio: number
  gain: number
  ring: number
  lobes: number
  phase: number
}

export interface VesselBody {
  /** The lowest resonance at Size 1, in Hz. */
  baseHz: number
  /** The place Position's far end stands for. */
  far: number
  modes: readonly VesselMode[]
}

type Row = readonly [number, number, number, number, number]
const body = (baseHz: number, far: number, rows: readonly Row[]): VesselBody => ({
  baseHz,
  far,
  modes: rows.map(([ratio, gain, ring, lobes, phase]) => ({ ratio, gain, ring, lobes, phase })),
})

/** A tube's resonances: every multiple of the lowest (open), or the odd ones (stopped). */
const tube = (stopped: boolean): Row[] => {
  const gains = stopped
    ? [1, 0.9, 0.84, 0.8, 0.76, 0.73, 0.7, 0.68, 0.66, 0.64, 0.62, 0.61, 0.6, 0.59, 0.58, 0.57]
    : [1, 0.92, 0.86, 0.82, 0.78, 0.75, 0.72, 0.7, 0.68, 0.66, 0.64, 0.62, 0.61, 0.6, 0.59, 0.58]
  return gains.map((gain, k): Row =>
    stopped ? [2 * k + 1, gain, 1, k + 0.5, 0.5] : [k + 1, gain, 1, k + 1, 0],
  )
}

export const VESSEL_BODIES: readonly VesselBody[] = [
  // Bottle
  body(110, 0.5, [
    [1, 1, 1, 0, 0.5],
    [5.3, 0.5, 0.6, 1, 0.5],
    [8.9, 0.44, 0.55, 2, 0.5],
    [12.6, 0.4, 0.5, 3, 0.5],
    [16.1, 0.36, 0.45, 4, 0.5],
    [19.8, 0.32, 0.4, 5, 0.5],
    [23.3, 0.3, 0.36, 6, 0.5],
    [27, 0.28, 0.33, 7, 0.5],
  ]),
  // Open pipe
  body(130.81, 0.5, tube(false)),
  // Stopped pipe
  body(65.41, 0.97, tube(true)),
  // Shell
  body(620, 0.97, [
    [1, 0.8, 0.8, 0.6, 0.5],
    [1.17, 1, 1, 1.3, 0],
    [1.41, 0.9, 0.9, 1.9, 0.5],
    [1.58, 0.75, 0.7, 2.7, 0],
    [1.83, 1, 1, 3.2, 0.5],
    [2.12, 0.85, 0.85, 4.1, 0],
    [2.37, 0.7, 0.65, 4.6, 0.5],
    [2.74, 0.95, 0.9, 5.4, 0],
    [3.05, 0.8, 0.75, 6.3, 0.5],
    [3.48, 0.7, 0.8, 6.9, 0],
    [3.97, 0.85, 0.7, 7.7, 0.5],
    [4.43, 0.65, 0.6, 8.4, 0],
    [5.12, 0.7, 0.6, 9.3, 0.5],
    [5.86, 0.6, 0.5, 10.2, 0],
  ]),
  // Drum
  body(82.41, 0.97, [
    [1, 1, 0.35, 0.5, 0.5],
    [1.593, 0.9, 0.8, 1, 0],
    [2.136, 0.85, 1, 1, 0],
    [2.295, 0.8, 0.6, 1.5, 0.5],
    [2.653, 0.75, 1, 1, 0],
    [2.917, 0.72, 0.8, 2, 0],
    [3.155, 0.68, 0.95, 1, 0],
    [3.5, 0.66, 0.8, 2, 0],
    [3.598, 0.64, 0.6, 2.5, 0.5],
    [3.647, 0.6, 0.9, 1, 0],
    [4.059, 0.58, 0.75, 2, 0],
    [4.132, 0.56, 0.85, 1, 0],
    [4.23, 0.54, 0.7, 3, 0],
    [4.601, 0.52, 0.7, 2, 0],
    [4.61, 0.5, 0.8, 1, 0],
    [4.832, 0.48, 0.65, 3, 0],
  ]),
  // Soundboard
  body(98, 0.97, [
    [1, 0.9, 0.5, 0.5, 0.5],
    [1.83, 1, 0.45, 1, 0],
    [2.27, 0.85, 0.4, 1.6, 0.5],
    [2.91, 0.95, 0.42, 2, 0],
    [3.38, 0.8, 0.36, 1.3, 0.5],
    [4.07, 0.9, 0.4, 3, 0],
    [4.61, 0.75, 0.34, 2.4, 0.5],
    [5.19, 0.85, 0.36, 3.7, 0],
    [5.94, 0.7, 0.32, 4, 0],
    [6.58, 0.8, 0.34, 2.8, 0.5],
    [7.43, 0.68, 0.3, 5, 0],
    [8.21, 0.74, 0.32, 4.3, 0.5],
    [9.17, 0.64, 0.28, 6, 0],
    [10.4, 0.68, 0.3, 5.2, 0.5],
    [11.8, 0.6, 0.26, 7, 0],
    [13.3, 0.62, 0.26, 6.4, 0.5],
  ]),
]

// --- The laws (bodies.h, vessel.h) -------------------------------------------

/** bodies.h: a mode past the ceiling (18 kHz, or 0.45 of the rate) or under 12 Hz is faded out. */
const CEILING_HZ = 18000
const CEILING_OF_RATE = 0.45
/** bodies.h: Material is the slowest mode's 60 dB time, 40 ms to 4 s. */
const RING_MIN = 0.04
const RING_MAX = 4
/** bodies.h: a mode at `ratio` rings ratio^-slope as long; the slope goes from dead to ringing. */
const SLOPE_DEAD = 0.9
const SLOPE_RINGING = 0.3
/** bodies.h: Q = pi f T60 / ln(1000), held between 0.7 and 1500. */
const Q_PER_HZ_SECOND = 0.45473
const Q_MIN = 0.7
const Q_MAX = 1500
/** bodies.h: the listening place is kept 3 % off the near end. */
const EDGE = 0.03
/** bodies.h: closed, the upper modes are held in by ratio^-1.5; open, 0.6 of the sound passes straight through. */
const CLOSED_TILT = 1.5
const OPEN_DIRECT = 0.6
/** bodies.h: the level trim, one over the root of 0.2274 times the sum of strength² / Q, at most 63. */
const SHARE = 0.2274
const TRIM_MAX = 63
/** vessel.h: Tone is a first-order shelf of up to 12 dB about 1.8 kHz. */
const TONE_HZ = 1800
const TONE_DB = 12

/** What the display reads of the knobs. */
export interface VesselSetting {
  body: number
  size: number
  material: number
  opening: number
  position: number
  tone: number
  mix: number
}

export const vesselBody = (index: number): VesselBody =>
  VESSEL_BODIES[clamp(Math.round(index), 0, VESSEL_BODIES.length - 1)]

export const vesselRingSeconds = (material: number): number =>
  RING_MIN * Math.pow(RING_MAX / RING_MIN, clamp(material, 0, 1))

export const vesselModeSeconds = (mode: VesselMode, material: number): number =>
  vesselRingSeconds(material) *
  mode.ring *
  Math.pow(mode.ratio, -(SLOPE_DEAD + (SLOPE_RINGING - SLOPE_DEAD) * clamp(material, 0, 1)))

/** Where along the body the sound is heard, 0..1, for Position 0..1. */
export const vesselListenAt = (shape: VesselBody, position: number): number =>
  EDGE + (shape.far - EDGE) * clamp(position, 0, 1)

/** How strongly a mode is heard at the place `x`. */
export const vesselModeShape = (mode: VesselMode, x: number): number =>
  Math.abs(Math.sin(Math.PI * (mode.lobes * x + mode.phase)))

function inRange(hz: number, sampleRate: number): number {
  const ceiling = Math.min(CEILING_HZ, CEILING_OF_RATE * sampleRate)
  return clamp((ceiling - hz) / (0.15 * ceiling), 0, 1) * clamp((hz - 12) / 8, 0, 1)
}

/** kit::tan_prewarp: Padé inside the passband, the exact function near Nyquist. */
function tanPrewarp(x: number): number {
  if (x > 0.7) return Math.tan(x)
  const x2 = x * x
  return (x * (15 - x2)) / (15 - 6 * x2)
}

/** One resonance as the device has tuned it. */
export interface VesselPeak {
  hz: number
  q: number
  /** Its strength before the level trim: table gain, shape at the place, Opening's tilt, the range fade. */
  strength: number
  /** tan(pi f / rate) as the filter has it. */
  g: number
}

export interface VesselModel {
  peaks: VesselPeak[]
  trim: number
  direct: number
  /** Tone's gain above its corner, and the one-pole coefficient of its corner. */
  toneGain: number
  toneA: number
  mix: number
  sampleRate: number
}

/** `Vessel::tune()` and `set_tone()`: every coefficient the body's response is made of. */
export function vesselModel(setting: VesselSetting, sampleRate: number): VesselModel {
  const shape = vesselBody(setting.body)
  const x = vesselListenAt(shape, setting.position)
  const tilt = CLOSED_TILT * (1 - clamp(setting.opening, 0, 1))
  let share = 0
  const peaks = shape.modes.map((mode): VesselPeak => {
    const hz = (shape.baseHz * mode.ratio) / setting.size
    const q = clamp(Q_PER_HZ_SECOND * hz * vesselModeSeconds(mode, setting.material), Q_MIN, Q_MAX)
    const strength =
      mode.gain * vesselModeShape(mode, x) * Math.pow(mode.ratio, -tilt) * inRange(hz, sampleRate)
    share += (strength * strength) / q
    const g = tanPrewarp((Math.PI * clamp(hz, 5, sampleRate * 0.49)) / sampleRate)
    return { hz, q, strength, g }
  })
  const opening = clamp(setting.opening, 0, 1)
  const toneGain = Math.pow(10, ((setting.tone - 0.5) * 2 * TONE_DB) / 20)
  const corner = clamp(TONE_HZ * Math.sqrt(toneGain), 0, sampleRate * 0.49)
  return {
    peaks,
    trim: Math.min(1 / Math.sqrt(Math.max(SHARE * share, 1e-9)), TRIM_MAX),
    direct: OPEN_DIRECT * opening * opening,
    toneGain,
    toneA: Math.exp((-2 * Math.PI * corner) / sampleRate),
    mix: clamp(setting.mix, 0, 1),
    sampleRate,
  }
}

/**
 * What the body does to a frequency, as a complex gain: the sum of the
 * resonances (each the band output of a trapezoidal state-variable filter,
 * unity at its own frequency), the level trim, the direct sound and Tone.
 */
export function vesselWet(model: VesselModel, hz: number): [number, number] {
  const warped = Math.tan((Math.PI * clamp(hz, 1, model.sampleRate * 0.499)) / model.sampleRate)
  let re = 0
  let im = 0
  for (const peak of model.peaks) {
    if (peak.strength === 0) continue
    const w = warped / peak.g
    const wk = w / peak.q
    const off = 1 - w * w
    const scale = (peak.strength * wk) / (off * off + wk * wk)
    re += scale * wk
    im += scale * off
  }
  re = re * model.trim + model.direct
  im *= model.trim
  // Tone: 1 + (gain - 1) (1 - lowpass), the low-pass a one-pole at the corner.
  const omega = (2 * Math.PI * hz) / model.sampleRate
  const a = model.toneA
  const denRe = 1 - a * Math.cos(omega)
  const denIm = a * Math.sin(omega)
  const den = denRe * denRe + denIm * denIm
  const lift = model.toneGain - 1
  const toneRe = 1 + lift * (1 - ((1 - a) * denRe) / den)
  const toneIm = lift * (((1 - a) * denIm) / den)
  return [re * toneRe - im * toneIm, re * toneIm + im * toneRe]
}

/**
 * What comes out of the device at a frequency, in dB against what went in:
 * the dry sound's share and the body's, the body's times `riding`, the gain
 * the level match and the level hold have on it now (1 at rest).
 */
export function vesselOutDb(model: VesselModel, hz: number, riding = 1): number {
  const [re, im] = vesselWet(model, hz)
  const outRe = 1 - model.mix + model.mix * riding * re
  const outIm = model.mix * riding * im
  const power = outRe * outRe + outIm * outIm
  return power > 1e-12 ? 10 * Math.log10(power) : FLOOR_DB
}

/** The body alone, all wet, in dB. */
export function vesselBodyDb(model: VesselModel, hz: number): number {
  const [re, im] = vesselWet(model, hz)
  const power = re * re + im * im
  return power > 1e-12 ? 10 * Math.log10(power) : FLOOR_DB
}

// --- The picture -------------------------------------------------------------

/** The curve runs from this at the top to this at the foot, in dB against the input. */
export const VESSEL_TOP_DB = 36
export const VESSEL_FOOT_DB = -30
/** The spectrum behind it runs from full scale at the top down to this. */
const SPECTRUM_FOOT_DB = -84
/** The ring's scale is marked at these times, and its wedge is this high at its start, each side of the line. */
const RING_MARKS = [0.1, 1]
const RING_HALF = 3.5
/** A resonance's reading is its level in dB above this (vessel.h: `meter()`), 63 at full scale. */
const LEVEL_SPAN = 63

type Size = Pick<DisplayView, 'width' | 'height'>

/** A body as it is drawn: lines in a box 1 by 1, and where a listening place falls on it. */
interface Outline {
  lines: readonly (readonly Point[])[]
  /** How much wider than high it is drawn. */
  aspect: number
  place: (x: number) => Point
}

const SPIRAL_TURNS = 2.2
const spiral = (t: number): Point => {
  const angle = 2 * Math.PI * SPIRAL_TURNS * t
  const radius = 0.5 * (1 - 0.78 * t)
  return [0.5 + radius * Math.cos(angle), 0.5 + radius * Math.sin(angle)]
}

const OUTLINES: readonly Outline[] = [
  // Bottle: belly, shoulders, neck; the mouth is at the right.
  {
    lines: [
      [
        [1, 0.36],
        [0.74, 0.36],
        [0.6, 0.08],
        [0.04, 0.08],
        [0, 0.22],
        [0, 0.78],
        [0.04, 0.92],
        [0.6, 0.92],
        [0.74, 0.64],
        [1, 0.64],
      ],
    ],
    aspect: 3,
    place: (x) => [x, 0.5],
  },
  // Open pipe: two walls.
  {
    lines: [
      [
        [0, 0.26],
        [1, 0.26],
      ],
      [
        [0, 0.74],
        [1, 0.74],
      ],
    ],
    aspect: 3.4,
    place: (x) => [x, 0.5],
  },
  // Stopped pipe: the same, closed at the left.
  {
    lines: [
      [
        [1, 0.26],
        [0, 0.26],
        [0, 0.74],
        [1, 0.74],
      ],
    ],
    aspect: 3.4,
    place: (x) => [x, 0.5],
  },
  // Shell: a spiral, heard from the mouth inwards.
  {
    lines: [Array.from({ length: 49 }, (_, n) => spiral(n / 48))],
    aspect: 1.5,
    place: (x) => spiral(x),
  },
  // Drum: a skin over a shallow frame, heard from the middle of the skin to its rim.
  {
    lines: [
      [
        [0, 0.2],
        [1, 0.2],
      ],
      [
        [0.04, 0.2],
        [0.09, 0.9],
        [0.91, 0.9],
        [0.96, 0.2],
      ],
    ],
    aspect: 3,
    place: (x) => [0.5 + 0.5 * x, 0.2],
  },
  // Soundboard: a board with its bridge, heard across it.
  {
    lines: [
      [
        [0.06, 0.06],
        [0.94, 0.06],
        [1, 0.3],
        [1, 0.7],
        [0.94, 0.94],
        [0.06, 0.94],
        [0, 0.7],
        [0, 0.3],
        [0.06, 0.06],
      ],
      [
        [0.78, 0.3],
        [0.78, 0.7],
      ],
    ],
    aspect: 3,
    place: (x) => [0.06 + 0.88 * x, 0.76 - 0.52 * x],
  },
]

export interface VesselLayout {
  /** Where the body is drawn, already fitted to its own shape; no height when there is no room for it. */
  shape: Box
  /** The centre of the mouth, from which the sound leaves. */
  mouth: Point
  /** The ring: a line from `from`, with Material 0 at `short` and Material 1 at `long`, at the height `y`. */
  ring: { from: number; short: number; long: number; y: number }
  /** The right end of the line of words. */
  wordsX: number
  wordsY: number
  curve: Box
}

export function vesselLayout(view: Size, bodyIndex: number): VesselLayout {
  const inner: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const band = inner.h >= 60 ? clamp(Math.round(inner.h * 0.28), 16, 26) : 0
  const outline = OUTLINES[clamp(Math.round(bodyIndex), 0, OUTLINES.length - 1)]
  const room: Box = {
    x: inner.x + 4,
    y: inner.y + 5,
    w: clamp(inner.w * 0.45, 30, 78),
    h: Math.max(0, band - 7),
  }
  const w = Math.min(room.w, room.h * outline.aspect)
  const h = w / outline.aspect
  const shape: Box = { x: room.x, y: room.y + (room.h - h) / 2, w, h }
  const mouth: Point = [room.x + w + 3, room.y + room.h / 2]
  const from = mouth[0] + 12
  return {
    shape,
    mouth,
    ring: { from, short: from + 6, long: inner.x + inner.w - 6, y: mouth[1] },
    wordsX: inner.x + inner.w - 2,
    wordsY: inner.y + 8,
    curve: { x: inner.x, y: inner.y + band, w: inner.w, h: Math.max(8, inner.h - band) },
  }
}

/** Whether the body, the sound leaving it and its ring are drawn at this size. */
const bodyShown = (layout: VesselLayout): boolean =>
  layout.shape.h >= 8 && layout.ring.long - layout.ring.short >= 20

/** A point of the body's own box in the display's pixels. */
const onShape = (shape: Box, [u, v]: Point): Point => [shape.x + u * shape.w, shape.y + v * shape.h]

const settingOf = (view: DisplayView): VesselSetting => ({
  body: view.value('body'),
  size: view.value('size') || 1,
  material: view.value('material'),
  opening: view.value('opening'),
  position: view.value('position'),
  tone: view.spec('tone') ? view.value('tone') : 0.5,
  mix: view.value('mix'),
})

/** A ring time as it is said: "40 ms", "400 ms", "1.6 s". */
export function ringText(seconds: number): string {
  return seconds < 0.995 ? `${Math.round(seconds * 1000)} ms` : `${seconds.toFixed(1)} s`
}

/** How finely a hand on the body is matched to a Position. */
const PLACE_STEPS = 200

/** Where a frequency lies along the curve's box, past its ends too. */
const lieOfHz = (hz: number, curve: Box): number =>
  curve.x + (Math.log(hz / FREQ_MIN) / Math.log(FREQ_MAX / FREQ_MIN)) * curve.w

/** Where the ring's handle stands for a Material: the slowest resonance's ring, 40 ms to 4 s, on a scale of even ratios. */
export const vesselRingX = (ring: { short: number; long: number }, material: number): number =>
  ring.short + clamp(material, 0, 1) * (ring.long - ring.short)

function vesselHandles(view: DisplayView): DisplayHandle[] {
  const setting = settingOf(view)
  const shape = vesselBody(setting.body)
  const outline = OUTLINES[clamp(Math.round(setting.body), 0, OUTLINES.length - 1)]
  const layout = vesselLayout(view, setting.body)
  const { curve, ring } = layout
  const sizeSpec = view.spec('size')
  const lies = lieOfHz(shape.baseHz / setting.size, curve)
  const handles: DisplayHandle[] = [
    {
      key: 'size',
      name: 'Size',
      // The lowest resonance, on the foot of the curve: across is Size.
      x: clamp(lies, curve.x, curve.x + curve.w),
      y: curve.y + curve.h - 5,
      drag: (toX: number, _y: number, hold?: DisplayHold) => {
        // A resonance under the picture's left edge waits at the edge and moves from where it lies.
        const kept = hold ?? {}
        kept.past ??= lies - clamp(lies, curve.x, curve.x + curve.w)
        const to = toX + kept.past
        const hz = FREQ_MIN * Math.pow(FREQ_MAX / FREQ_MIN, (to - curve.x) / curve.w)
        return { size: clamp(shape.baseHz / hz, sizeSpec?.min ?? 0.25, sizeSpec?.max ?? 4) }
      },
      reset: () => ({ size: sizeSpec?.default ?? 1 }),
    },
  ]
  if (!bodyShown(layout)) return handles
  handles.push({
    key: 'material',
    name: 'Material',
    // The end of the ring: further along is a longer ring.
    x: vesselRingX(ring, setting.material),
    y: ring.y,
    drag: (toX) => ({ material: clamp((toX - ring.short) / (ring.long - ring.short), 0, 1) }),
    reset: () => ({ material: view.spec('material')?.default ?? 0.5 }),
  })
  const place = (position: number): Point =>
    onShape(layout.shape, outline.place(vesselListenAt(shape, position)))
  const [x, y] = place(setting.position)
  handles.push({
    key: 'position',
    name: 'Position',
    x,
    y,
    // The Position whose place on the body is nearest the hand.
    drag: (toX, toY) => {
      let best = 0
      let least = Infinity
      for (let n = 0; n <= PLACE_STEPS; n++) {
        const [px, py] = place(n / PLACE_STEPS)
        const distance = (px - toX) * (px - toX) + (py - toY) * (py - toY)
        if (distance < least) {
          least = distance
          best = n / PLACE_STEPS
        }
      }
      const stands = (x - toX) * (x - toX) + (y - toY) * (y - toY)
      return { position: stands <= least ? setting.position : best }
    },
    reset: () => ({ position: view.spec('position')?.default ?? 0.3 }),
  })
  return handles
}

interface VesselState {
  /** What the curves below were made from. */
  made: string
  model: VesselModel | null
  /** The frequencies the curves are drawn at: every pixel column and every resonance. */
  hz: number[]
  x: number[]
  /** What comes out now, the gain on the body it was drawn with (0 for not yet), and the body alone. */
  out: Point[]
  gain: number
  alone: Point[]
  /** The gain the level match and the level hold have on the body now, in dB, as drawn. */
  riding: number
  /** How loud each resonance rings, 0..1 of the reading's span, as drawn. */
  levels: number[]
}

/** The frequencies a curve is drawn at across a box: each pixel column, and each resonance exactly, so that a sharp peak keeps its height. */
function curveHz(model: VesselModel, curve: Box): number[] {
  const hz: number[] = []
  const columns = Math.max(2, Math.floor(curve.w))
  for (let c = 0; c <= columns; c++) hz.push(hzOfX(curve.x + (c / columns) * curve.w, curve))
  const low = hz[0]
  const high = hz[hz.length - 1]
  for (const peak of model.peaks)
    if (peak.strength > 0 && peak.hz > low && peak.hz < high) hz.push(peak.hz)
  return hz.sort((a, b) => a - b)
}

/** A reading of four resonances (vessel.h: `meter()`), as their levels 0..63, lowest first. */
export function vesselLevels(reading: number): [number, number, number, number] {
  let packed = Number.isFinite(reading) ? Math.max(0, Math.floor(reading)) : 0
  const digits: number[] = []
  for (let n = 0; n < 4; n++) {
    digits.push(packed % 64)
    packed = Math.floor(packed / 64)
  }
  return digits as [number, number, number, number]
}

const QUIET = 1e-4
/** vessel.h: the level match goes from 9 dB under to 12 dB over; the level hold only takes off, and the picture follows it this far down. */
const RIDING_MOST_DB = 12
const RIDING_LEAST_DB = -40
/** The room a word of the top line is given: "1.6 kHz" and "400 ms" at the plate's type. */
const WORD_WIDTH = 38

/** Whether sound runs through the device now: then it is awake and its readings are fresh. */
function sounding(frame: DisplayFrame): boolean {
  const signal = frame.signal
  if (!signal || !frame.powered) return false
  return Math.max(signal.input?.peak ?? 0, signal.output.peak) > QUIET
}

function drawBody(frame: DisplayFrame, layout: VesselLayout, setting: VesselSetting): void {
  const { ctx, colours } = frame
  const outline = OUTLINES[clamp(Math.round(setting.body), 0, OUTLINES.length - 1)]
  const { shape } = layout
  for (const line of outline.lines) {
    trace(
      ctx,
      line.map((point) => onShape(shape, point)),
      { colour: colours.ink, width: 1.25 },
    )
  }
  // Opening: the sound that gets out, as arcs leaving the mouth; none when it is closed.
  const [mx, my] = layout.mouth
  for (let arc = 0; arc < 3; arc++) {
    const share = clamp(setting.opening * 3 - arc, 0, 1)
    if (share <= 0) break
    ctx.beginPath()
    ctx.arc(mx - 2, my, 3 + 3 * arc, -0.85, 0.85)
    ctx.globalAlpha = share
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1.25
    ctx.stroke()
    ctx.globalAlpha = 1
  }
  // Material: how long the body rings, a wedge that dies away at the handle, on a scale with marks at 100 ms and 1 s.
  const { ring } = layout
  const end = vesselRingX(ring, setting.material)
  rule(ctx, ring.from, ring.y, ring.long, ring.y, {
    colour: colours.ink,
    width: 1,
    alpha: INK.rule,
  })
  for (const seconds of RING_MARKS) {
    const x = vesselRingX(ring, Math.log(seconds / RING_MIN) / Math.log(RING_MAX / RING_MIN))
    rule(ctx, x, ring.y - 2.5, x, ring.y + 2.5, { colour: colours.ink, width: 1, alpha: INK.rule })
  }
  const wedge: Point[] = [
    [ring.from, ring.y - RING_HALF],
    [end, ring.y],
    [ring.from, ring.y + RING_HALF],
  ]
  ctx.beginPath()
  ctx.moveTo(wedge[0][0], wedge[0][1])
  ctx.lineTo(wedge[1][0], wedge[1][1])
  ctx.lineTo(wedge[2][0], wedge[2][1])
  ctx.closePath()
  ctx.globalAlpha = INK.back
  ctx.fillStyle = colours.ink
  ctx.fill()
  ctx.globalAlpha = 1
}

const vessel = plateDisplay<VesselState>({
  place: 'window',
  columns: 2,
  params: ['body', 'size', 'material', 'opening', 'position', 'tone', 'mix'],
  live: { meters: true, signal: true, spectrum: true },
  info: 'The resonances of the body over the frequencies, each peak filling as the sound makes it ring, on the spectrum of what comes out. Drag the foot handle across for Size, the end of the wedge above for how long the body rings, and the point on the body for where the sound is heard.',
  init: () => ({
    made: '',
    model: null,
    hz: [],
    x: [],
    out: [],
    alone: [],
    gain: 0,
    riding: 0,
    levels: new Array<number>(16).fill(0),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const setting = settingOf(frame)
    const shape = vesselBody(setting.body)
    const layout = vesselLayout(frame, setting.body)
    const { curve } = layout
    const foot = curve.y + curve.h
    const yOf = (db: number): number =>
      clamp(yOfDb(db, curve, VESSEL_TOP_DB, VESSEL_FOOT_DB), curve.y, foot)

    const made = `${Object.values(setting).join(' ')} ${frame.sampleRate} ${frame.width} ${frame.height}`
    if (made !== state.made || !state.model) {
      state.made = made
      const model = vesselModel(setting, frame.sampleRate)
      state.model = model
      state.hz = curveHz(model, curve)
      state.x = state.hz.map((hz) => xOfHz(hz, curve))
      state.gain = 0
      state.alone = state.hz.map((hz, n): Point => [state.x[n], yOf(vesselBodyDb(model, hz))])
    }
    const model = state.model
    const live = sounding(frame)

    // The body, the sound leaving it, its ring, and the two numbers the handles set.
    if (bodyShown(layout)) {
      drawBody(frame, layout, setting)
      const ring = ringText(vesselRingSeconds(setting.material))
      text(frame, ring, layout.wordsX, layout.wordsY, { align: 'right' })
      const lowest = hzText(shape.baseHz / setting.size)
      const left = layout.wordsX - WORD_WIDTH
      if (left - WORD_WIDTH >= layout.shape.x + layout.shape.w + 4)
        text(frame, lowest, left, layout.wordsY, { align: 'right' })
    }

    freqGrid(frame, curve)
    const level = yOf(0)
    rule(ctx, curve.x, level, curve.x + curve.w, level, { colour: colours.ink, alpha: INK.rule })

    // The gain riding on the body now: what the level match adds and the level hold takes off.
    // The curve is what comes out with it; at rest, and in silence, with none.
    const riding = live
      ? clamp(frame.meter('match') + frame.meter('hold'), RIDING_LEAST_DB, RIDING_MOST_DB)
      : 0
    state.riding = follow(state.riding, riding, frame.dt, 0.05, 0.2)
    const gain = Math.abs(state.riding) > 0.05 ? Math.pow(10, state.riding / 20) : 1
    if (gain !== state.gain) {
      state.gain = gain
      state.out = state.hz.map((hz, n): Point => [state.x[n], yOf(vesselOutDb(model, hz, gain))])
    }

    clipped(ctx, curve, () => {
      spectrum(frame, curve, { topDb: 0, bottomDb: SPECTRUM_FOOT_DB, alpha: 0.35 })
      // Under a Mix below 1 the body alone stands behind what comes out.
      if (model.mix < 0.995)
        trace(ctx, state.alone, { colour: colours.ink, width: 1, alpha: INK.back })
      fillTo(ctx, state.out, foot, colours.ink, INK.fill)
      trace(ctx, state.out, { colour: colours.ink })

      // Each resonance fills from the foot towards its peak as it rings.
      const readings = [0, 1, 2, 3].flatMap((n) =>
        vesselLevels(live ? frame.meter(`modes${n + 1}`) : 0),
      )
      model.peaks.forEach((peak, k) => {
        const target = clamp(readings[k] / LEVEL_SPAN, 0, 1)
        state.levels[k] = follow(state.levels[k], target, frame.dt, 0.03, 0.3)
        const rings = state.levels[k]
        if (rings < 0.02 || peak.strength <= 0 || model.mix <= 0) return
        const x = xOfHz(peak.hz, curve)
        const top = yOf(vesselOutDb(model, peak.hz, gain))
        rule(ctx, x, foot, x, foot + (top - foot) * rings, { colour: colours.accent, width: 1.5 })
      })
    })
    // The frequencies, along the top of the curve: the foot is the Size handle's.
    for (const [words, hz] of [
      ['100', 100],
      ['1k', 1000],
      ['10k', 10000],
    ] as const) {
      const x = xOfHz(hz, curve)
      const room = curve.x + curve.w - x >= 20
      label(frame, words, room ? x + 3 : x - 3, curve.y + 9, room ? 'left' : 'right')
    }

    for (const point of vesselHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: vesselHandles,
})

export const VESSEL_FACES: Readonly<Record<string, PlateFace>> = {
  vessel: {
    display: vessel,
    face: ['body', 'size', 'material', 'mix'],
  },
}
