// The Imprint's display: the colour it presses on the sound, in dB over
// frequency, as Amount, Shift and Smooth have it, as the frame's bins let a
// tone meet it and as Mix lets it be heard,
// over the spectrum of what comes out. A built-in colour is worked out here
// from the same bells the device adds up; a captured one is the device's own
// reading of what it has learned.

import {
  INK,
  clamp,
  clipped,
  dbGrid,
  dbOfY,
  fillRect,
  fillTo,
  follow,
  freqGrid,
  ground,
  handle,
  label,
  rule,
  spectrum,
  trace,
  yOfDb,
  FREQ_MAX,
  FREQ_MIN,
  type Box,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

// --- The device's numbers (cpp/devices/imprint/imprint.h) --------------------

/** The grid every shape lives on: `kPerOctave` points to the octave from `kLowHz`, `kPoints` of them. */
export const IMPRINT_PER_OCTAVE = 24
export const IMPRINT_POINTS = 217
export const IMPRINT_LOW_HZ = 40
/** The middle of the grid, in octaves over its foot (`kMidOctave`): about 905 Hz. */
export const IMPRINT_MID_HZ = IMPRINT_LOW_HZ * Math.pow(2, 4.5)
/** The curve never asks for more than this either way (`kMaxGainDb`), and the scale runs as far. */
export const IMPRINT_MOST_DB = 30
/** Smooth as a width in octaves: `kSmoothLow` at 0, `kSmoothSpan` times that at 1. */
const SMOOTH_LOW = 0.04
const SMOOTH_SPAN = 25
/** The most points either side `smooth_grid` takes in (`kPad - 2`). */
const SMOOTH_MOST = 24

/** A bell of a built-in shape: its centre in Hz, its height in dB, its width (a sigma) in octaves. */
type Bell = readonly [hz: number, db: number, width: number]

/** The built-in shapes in the order of the Shape choice after "Captured" (`kBuiltInShapes`). */
export const IMPRINT_SHAPES: readonly (readonly Bell[])[] = [
  [
    [730, 18, 0.1],
    [1090, 15, 0.09],
    [2440, 13, 0.08],
    [3400, 9, 0.08],
  ],
  [
    [300, 18, 0.12],
    [870, 13, 0.09],
    [2240, 8, 0.08],
  ],
  [
    [270, 16, 0.12],
    [2290, 16, 0.08],
    [3010, 14, 0.08],
  ],
  [
    [220, 14, 0.14],
    [660, 14, 0.07],
    [1100, 13, 0.06],
    [1540, 12, 0.05],
    [1980, 11, 0.05],
    [2420, 10, 0.05],
  ],
  [
    [587, 8, 0.06],
    [1408, 11, 0.05],
    [2350, 13, 0.05],
    [3460, 14, 0.05],
    [5220, 14, 0.05],
    [7100, 12, 0.05],
  ],
  [
    [95, 12, 0.2],
    [210, 14, 0.14],
    [390, 10, 0.12],
    [640, 7, 0.1],
  ],
]

/** The captured colour comes at every fourth grid point (`kDisplayStep`), 55 of them, four to a reading in base 64. */
export const IMPRINT_STEP = 4
export const IMPRINT_READ_POINTS = 55
const READINGS: readonly string[] = Array.from({ length: 14 }, (_, r) => `shape${r + 1}`)
const PER_READING = 4
const LEVELS = 64

/** The width Smooth stands for, in octaves (`smooth_octaves`). */
export const imprintSmoothOctaves = (smooth: number): number =>
  SMOOTH_LOW * Math.pow(SMOOTH_SPAN, clamp(smooth, 0, 1))

/**
 * The device's `smooth_grid`: the mean over `reach` points either side, a
 * part of a point counting as that part, twice over, the ends held.
 */
export function imprintSmooth(data: Float32Array, reach: number): Float32Array {
  if (!(reach > 0)) return data
  const last = data.length - 1
  const whole = clamp(Math.floor(reach), 0, SMOOTH_MOST)
  const part = Math.min(reach - whole, 1)
  const scale = 1 / (2 * whole + 1 + 2 * part)
  const work = new Float32Array(data.length)
  for (let pass = 0; pass < 2; pass++) {
    for (let g = 0; g <= last; g++) {
      let sum = 0
      for (let j = -whole; j <= whole; j++) sum += data[clamp(g + j, 0, last)]
      const outer = data[clamp(g - whole - 1, 0, last)] + data[clamp(g + whole + 1, 0, last)]
      work[g] = (sum + part * outer) * scale
    }
    data.set(work)
  }
  return data
}

/** A built-in shape's colour on the grid in dB, after Smooth (`built_in_db`, then `refresh_built`). */
export function imprintBuiltIn(shape: number, smooth: number): Float32Array {
  const bells = IMPRINT_SHAPES[clamp(Math.round(shape), 1, IMPRINT_SHAPES.length) - 1]
  const colour = new Float32Array(IMPRINT_POINTS)
  for (let g = 0; g < IMPRINT_POINTS; g++) {
    const octave = g / IMPRINT_PER_OCTAVE
    let db = 0
    for (const [hz, height, width] of bells) {
      const away = (octave - Math.log2(hz / IMPRINT_LOW_HZ)) / width
      db += height * Math.exp(-0.5 * away * away)
    }
    colour[g] = db
  }
  return imprintSmooth(
    colour,
    Math.max(0, 0.5 * (imprintSmoothOctaves(smooth) * IMPRINT_PER_OCTAVE - 1)),
  )
}

/**
 * The captured colour at the 55 places the device reads it for this display,
 * in whole dB, out of its fourteen readings. A reading of nothing (none has
 * come yet) is no colour: the device never sends a digit of 0.
 */
export function imprintCaptured(
  reading: (name: string) => number,
  into: Float32Array,
): Float32Array {
  for (let r = 0; r < READINGS.length; r++) {
    let packed = Math.round(reading(READINGS[r]))
    if (!(packed > 0)) packed = 0
    for (let i = 0; i < PER_READING; i++) {
      const place = r * PER_READING + i
      if (place >= into.length) break
      const level = packed % LEVELS
      packed = (packed - level) / LEVELS
      into[place] = level > 0 ? level - LEVELS / 2 : 0
    }
  }
  return into
}

/** A colour read at every fourth grid point, on the whole grid: straight between two readings. */
export function imprintSpread(read: Float32Array, into: Float32Array): Float32Array {
  for (let g = 0; g < into.length; g++) {
    const at = Math.min(g / IMPRINT_STEP, read.length - 1)
    const below = Math.min(Math.floor(at), read.length - 2)
    into[g] = read[below] + (at - below) * (read[below + 1] - read[below])
  }
  return into
}

/**
 * The curve on the grid in dB (`compose` with Replace at nothing): Amount
 * times the colour, read `shift` semitones lower so that the colour stands
 * that much higher, the ends held, and never more than 30 dB either way.
 */
export function imprintCurve(
  colour: Float32Array,
  amount: number,
  shift: number,
  into: Float32Array,
): Float32Array {
  const last = colour.length - 1
  const moved = shift * (IMPRINT_PER_OCTAVE / 12)
  for (let g = 0; g < into.length; g++) {
    const at = clamp(g - moved, 0, last)
    const index = Math.min(Math.floor(at), last - 1)
    const db = amount * (colour[index] + (at - index) * (colour[index + 1] - colour[index]))
    into[g] = clamp(db, -IMPRINT_MOST_DB, IMPRINT_MOST_DB)
  }
  return into
}

/**
 * What a gain on the wet leaves of the sound at Mix, in dB: the dry and the
 * wet stand in step (the dry is held back by the frame's latency, and a gain
 * per bin turns no phase), so they add as they are.
 */
export const imprintHeard = (gain: number, mix: number): number =>
  20 * Math.log10(1 - mix + mix * gain)

/** The frame the device works in (`kit::Stft<2048, 512>`), and its bins. */
export const IMPRINT_FRAME = 2048
const BINS = IMPRINT_FRAME / 2 + 1

/** The gain of every bin under a curve on the grid in dB: straight in dB between two grid points, the ends held. */
export function imprintBins(
  curve: Float32Array,
  sampleRate: number,
  into: Float32Array,
): Float32Array {
  const last = curve.length - 1
  for (let k = 0; k < into.length; k++) {
    const hz = (k * sampleRate) / IMPRINT_FRAME
    const at =
      hz > IMPRINT_LOW_HZ ? Math.min(last, Math.log2(hz / IMPRINT_LOW_HZ) * IMPRINT_PER_OCTAVE) : 0
    const index = Math.min(Math.floor(at), last - 1)
    into[k] = Math.pow(10, (curve[index] + (at - index) * (curve[index + 1] - curve[index])) / 20)
  }
  return into
}

/** The Hann window's spectrum `away` bins from its middle: 1 there, a half one bin off, and soon nothing. */
function hann(away: number): number {
  if (away === 0) return 1
  const rest = 1 - away * away
  if (Math.abs(rest) < 1e-9) return 0.5
  return Math.sin(Math.PI * away) / (Math.PI * away * rest)
}

/**
 * What a steady tone at `hz` comes out by under those gains. A gain per bin
 * is a filter (see `cpp/kit/stft.h`): a tone lies over three or four bins,
 * windowed by Hann on the way in and again on the way out, so it takes the
 * gains of the bins around it, each weighed by the window's spectrum
 * squared: two thirds of its own bin and a sixth of each neighbour when it
 * stands on one. Low down, where a bin is a wide step in pitch, this is what
 * rounds a narrow bell off.
 */
export function imprintResponse(bins: Float32Array, hz: number, sampleRate: number): number {
  const at = (hz * IMPRINT_FRAME) / sampleRate
  const first = Math.floor(at) - 3
  let sum = 0
  let weight = 0
  for (let k = first; k < first + 8; k++) {
    const share = hann(k - at) ** 2
    sum += share * bins[Math.min(bins.length - 1, Math.abs(k))]
    weight += share
  }
  return sum / weight
}

// --- The picture -------------------------------------------------------------

/** The spectrum behind the curve runs from full scale at the top down to this at the foot. */
const SPECTRUM_FOOT_DB = -84
/** Where the point stands for Amount 1: the height a colour of so many dB is drawn at. */
export const IMPRINT_POINT_DB = 15
/** How far a turn of the wheel by one notch moves Smooth: twenty notches from one end to the other. */
const WHEEL_STEP = 0.05
/** The curve is worked out at so many places to the octave, from 20 Hz up ten octaves (the grid stops at 20.48 kHz). */
const TRACE_PER_OCTAVE = 2 * IMPRINT_PER_OCTAVE
const TRACE_POINTS = 10 * TRACE_PER_OCTAVE
/** The bar at the foot that fills as the Learn time is heard. */
const BAR_HEIGHT = 2

const curveBox = (view: Pick<DisplayView, 'width' | 'height'>): Box => ({
  x: 4,
  y: 4,
  w: view.width - 8,
  h: view.height - 8,
})

/** Where a frequency falls across the box, on the kit's scale but not held at its ends: the grid runs past 20 kHz. */
const xOf = (hz: number, box: Box): number =>
  box.x + (Math.log(hz / FREQ_MIN) / Math.log(FREQ_MAX / FREQ_MIN)) * box.w
const hzOf = (x: number, box: Box): number =>
  FREQ_MIN * Math.pow(FREQ_MAX / FREQ_MIN, (x - box.x) / box.w)
const yOf = (db: number, box: Box): number => yOfDb(db, box, IMPRINT_MOST_DB, -IMPRINT_MOST_DB)

function rangeOf(view: DisplayView, param: string, fallback: [number, number]): [number, number] {
  const spec = view.spec(param)
  return spec ? [spec.min, spec.max] : fallback
}

const startOf = (view: DisplayView, param: string, fallback: number): number =>
  view.spec(param)?.default ?? fallback

/** A number with its sign said, a real minus: "+7.0", "−1.50". */
const signed = (value: number, places: number): string => {
  const words = Math.abs(value).toFixed(places)
  return `${Number(words) === 0 ? '' : value > 0 ? '+' : '−'}${words}`
}

interface ImprintState {
  /** The captured colour as the device last reported it, and as it is drawn: the whole dB eased. */
  read: Float32Array
  eased: Float32Array
  /** The colour on the grid, and the built-in one it was last worked out for. */
  colour: Float32Array
  built: string
  curve: Float32Array
  /** The gain of each of the frame's bins under that curve. */
  bins: Float32Array
}

/**
 * The one point: across, where the middle of the shape (905 Hz) has been
 * moved to by Shift; up, how hard it is pressed on, at the height a colour
 * of 15 dB is drawn at, so the two ends of Amount are the top and the foot.
 */
function imprintHandles(view: DisplayView): DisplayHandle[] {
  const box = curveBox(view)
  const [amountMin, amountMax] = rangeOf(view, 'amount', [-2, 2])
  const [shiftMin, shiftMax] = rangeOf(view, 'shift', [-24, 24])
  const [smoothMin, smoothMax] = rangeOf(view, 'smooth', [0, 1])
  return [
    {
      key: 'stamp',
      name: 'Amount and Shift',
      x: xOf(IMPRINT_MID_HZ * Math.pow(2, view.value('shift') / 12), box),
      y: yOf(view.value('amount') * IMPRINT_POINT_DB, box),
      drag: (x, y) => ({
        shift: clamp(12 * Math.log2(hzOf(x, box) / IMPRINT_MID_HZ), shiftMin, shiftMax),
        amount: clamp(
          dbOfY(y, box, IMPRINT_MOST_DB, -IMPRINT_MOST_DB) / IMPRINT_POINT_DB,
          amountMin,
          amountMax,
        ),
      }),
      // The wheel smooths the colour out and sharpens it.
      wheel: (steps) => ({
        smooth: clamp(view.value('smooth') + WHEEL_STEP * steps, smoothMin, smoothMax),
      }),
      reset: () => ({ amount: startOf(view, 'amount', 1), shift: startOf(view, 'shift', 0) }),
    },
  ]
}

const imprint = plateDisplay<ImprintState>({
  place: 'window',
  columns: 2,
  params: ['shape', 'amount', 'shift', 'smooth', 'mix', 'capture'],
  live: { meters: true, spectrum: true },
  info: 'The colour pressed on the sound, in dB over frequency, as Mix lets it be heard, over the spectrum of what comes out. Drag the point up for more, down to turn the colour inside out, sideways for Shift, and turn the wheel on it for Smooth. The bar at the foot fills as it learns.',
  init: () => ({
    read: new Float32Array(IMPRINT_READ_POINTS),
    eased: new Float32Array(IMPRINT_READ_POINTS),
    colour: new Float32Array(IMPRINT_POINTS),
    built: '',
    curve: new Float32Array(IMPRINT_POINTS),
    bins: new Float32Array(BINS),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const box = curveBox(frame)
    const zero = yOf(0, box)
    const foot = box.y + box.h

    // The colour: the device's reading of what it has captured, or the bells of the shape named.
    const shape = Math.round(frame.value('shape'))
    if (shape < 1) {
      imprintCaptured((name) => frame.meter(name), state.read)
      for (let place = 0; place < state.eased.length; place++) {
        // Still, or just come to this shape, the reading is drawn as it stands.
        state.eased[place] =
          frame.dt > 0 && state.built === 'captured'
            ? follow(state.eased[place], state.read[place], frame.dt, 0.12, 0.12)
            : state.read[place]
      }
      imprintSpread(state.eased, state.colour)
      state.built = 'captured'
    } else {
      const built = `${shape} ${frame.value('smooth')}`
      if (built !== state.built) state.colour.set(imprintBuiltIn(shape, frame.value('smooth')))
      state.built = built
    }
    const mix = clamp(frame.value('mix'), 0, 1)
    imprintCurve(state.colour, frame.value('amount'), frame.value('shift'), state.curve)

    freqGrid(frame, box)
    dbGrid(frame, box, IMPRINT_MOST_DB, -IMPRINT_MOST_DB, 10)
    clipped(ctx, box, () => {
      spectrum(frame, box, { topDb: 0, bottomDb: SPECTRUM_FOOT_DB, alpha: 0.5 })
    })

    // The curve as a tone meets it, from the left edge (20 Hz) to the top of
    // the grid, twice as closely as the grid: it bends between two grid points.
    imprintBins(state.curve, frame.sampleRate, state.bins)
    const set: Point[] = []
    const heard: Point[] = []
    for (let n = 0; n <= TRACE_POINTS; n++) {
      const hz = FREQ_MIN * Math.pow(2, n / TRACE_PER_OCTAVE)
      const gain = imprintResponse(state.bins, hz, frame.sampleRate)
      const x = xOf(hz, box)
      set.push([x, yOf(imprintHeard(gain, 1), box)])
      heard.push([x, yOf(imprintHeard(gain, mix), box)])
    }
    const [point] = imprintHandles(frame)
    clipped(ctx, box, () => {
      fillTo(ctx, heard, zero, colours.accent, 0.7)
      // With Mix part way, the colour as it is set stands behind what is heard of it.
      if (mix < 0.995)
        trace(ctx, set, { colour: colours.ink, width: 1, alpha: INK.back, dash: [1, 3] })
      trace(ctx, heard, { colour: colours.ink })
    })
    // The point stands on a post from the line where nothing is changed.
    rule(ctx, point.x, zero, point.x, point.y, { colour: colours.ink, alpha: INK.rule })

    // While it listens, a bar along the foot: as much of it filled as of the Learn time has been heard.
    const listening = frame.value('capture') >= 0.5
    if (listening) {
      const bar = { x: box.x, y: foot - BAR_HEIGHT, w: box.w, h: BAR_HEIGHT }
      fillRect(ctx, bar, colours.ink, INK.rule)
      fillRect(ctx, { ...bar, w: box.w * clamp(frame.meter('heard'), 0, 1) }, colours.accent)
    }

    const hot = frame.hot === point.key
    handle(frame, point.x, point.y, { hot })
    // The words keep to the half of the display the point is not in.
    const high = point.y < box.y + box.h / 2
    const line = high ? foot - BAR_HEIGHT - 3 : box.y + 8
    if (hot) {
      label(frame, `Amount ${signed(frame.value('amount'), 2)}`, box.x + 2, line)
      label(frame, `${signed(frame.value('shift'), 1)} st`, box.x + box.w - 2, line, 'right')
    } else if (!listening) {
      // Capture off: what was learned is held as it stands.
      label(frame, 'Held', box.x + box.w - 2, line, 'right')
    }
  },
  handles: imprintHandles,
})

export const IMPRINT_FACES: Readonly<Record<string, PlateFace>> = {
  imprint: {
    display: imprint,
    face: ['shape', 'amount', 'capture', 'replace'],
  },
}
