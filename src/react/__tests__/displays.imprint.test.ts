// The truth of the Imprint's display: its curve against the bells and the
// smoothing written out here from the device's header, its point against the
// two parameters it sets, what the device's readings put on it, and the
// compiled device itself against what is drawn of it.

import { describe, expect, it } from 'vitest'

import { type ParamSpec } from '../../core/params'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS, biquad, type Box } from '../components/display-kit'
import {
  IMPRINT_FACES,
  IMPRINT_MID_HZ,
  IMPRINT_MOST_DB,
  IMPRINT_POINT_DB,
  IMPRINT_STAND_IN,
  imprintBins,
  imprintBuiltIn,
  imprintCaptured,
  imprintCurve,
  imprintHeard,
  imprintSmoothOctaves,
  imprintSpread,
} from '../components/displays/imprint'
import { type DisplayHandle } from '../components/plate-display'
import {
  displaySize,
  drawDisplay,
  patchUnder,
  runDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const stock = stockDescriptors()
const RATE = 48000
const { display } = IMPRINT_FACES.imprint
const params: Readonly<Record<string, ParamSpec>> = stock.get('imprint')?.params ?? {}
const size = displaySize(display)
const box: Box = { x: 4, y: 4, w: size.width - 8, h: size.height - 8 }

const draw = (options: FrameOptions = {}): RecordingContext => drawDisplay(display, params, options)
const run = (seconds: number, options: FrameOptions = {}): RecordingContext =>
  runDisplay(display, params, seconds, options)
const point = (values: Record<string, number> = {}, width = size.width): DisplayHandle => {
  const handles = display.handles?.(viewOf(display, params, { values, width })) ?? []
  expect(handles.length).toBe(1)
  return handles[0]
}

// --- From cpp/devices/imprint/imprint.h --------------------------------------
// kPerOctave, kPoints, kLowHz, kMidOctave, kSmoothLow, kSmoothSpan, kMaxGainDb,
// kStandIn, and kBuiltInShapes (each bell: Hz, dB, width in octaves; the slope
// is the shape's trend, which only Replace brings: what Replace adds depends
// on the sound itself, and the display draws it from the device's readings).
const PER_OCTAVE = 24
const POINTS = 217
const LOW_HZ = 40
const MID_OCTAVE = 4.5
const SMOOTH_LOW = 0.04
const SMOOTH_SPAN = 25
const MAX_GAIN_DB = 30
const SHAPES: readonly (readonly [number, number, number])[][] = [
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

const held = (data: readonly number[], g: number): number =>
  data[Math.min(data.length - 1, Math.max(0, g))]

/** `smooth_grid`: the mean over `reach` points either side, a part of a point counting as that part, twice. */
function smoothed(data: readonly number[], reach: number): number[] {
  if (!(reach > 0)) return [...data]
  const whole = Math.min(24, Math.floor(reach))
  const part = Math.min(reach - whole, 1)
  let now = [...data]
  for (let pass = 0; pass < 2; pass++) {
    now = now.map((_, g) => {
      let sum = part * (held(now, g - whole - 1) + held(now, g + whole + 1))
      for (let j = -whole; j <= whole; j++) sum += held(now, g + j)
      return sum / (2 * whole + 1 + 2 * part)
    })
  }
  return now
}

/** A built-in shape's colour on the grid after Smooth: `built_in_db`, then `refresh_built`. */
function colourOf(shape: number, smooth: number): number[] {
  const bells = SHAPES[shape - 1]
  const raw = Array.from({ length: POINTS }, (_, g) =>
    bells.reduce((db, [hz, height, width]) => {
      const away = (g / PER_OCTAVE - Math.log2(hz / LOW_HZ)) / width
      return db + height * Math.exp(-0.5 * away * away)
    }, 0),
  )
  const octaves = SMOOTH_LOW * Math.pow(SMOOTH_SPAN, smooth)
  return smoothed(raw, Math.max(0, 0.5 * (octaves * PER_OCTAVE - 1)))
}

/**
 * `compose` at a frequency: straight in dB between two grid points, the ends
 * held. `added` is what Replace adds on the grid, before the 30 dB stop; left
 * out, Replace is at nothing.
 */
function curveDb(
  colour: readonly number[],
  amount: number,
  shift: number,
  hz: number,
  added?: readonly number[],
): number {
  const on = (g: number): number => {
    const at = Math.min(POINTS - 1, Math.max(0, g - shift * (PER_OCTAVE / 12)))
    const index = Math.min(POINTS - 2, Math.floor(at))
    const db = amount * (colour[index] + (at - index) * (colour[index + 1] - colour[index]))
    return Math.min(MAX_GAIN_DB, Math.max(-MAX_GAIN_DB, db + (added ? added[g] : 0)))
  }
  const g = Math.min(POINTS - 1, Math.max(0, PER_OCTAVE * Math.log2(hz / LOW_HZ)))
  const below = Math.min(POINTS - 2, Math.floor(g))
  return on(below) + (g - below) * (on(below + 1) - on(below))
}

// From cpp/kit/stft.h: frames of 2048 with Hann on the way in and on the way
// out, so a tone takes the gains of the bins around it, each weighed by the
// square of the window's spectrum, which add up to 3/2.
const FRAME = 2048

function hannSpectrum(away: number): number {
  if (away === 0) return 1
  if (Math.abs(Math.abs(away) - 1) < 1e-9) return 0.5
  return Math.sin(Math.PI * away) / (Math.PI * away) / (1 - away * away)
}

/**
 * What a tone at `hz` comes out by under the curve, in dB, with Mix: `hold`
 * is the level hold's gain in dB, one gain for the whole of the wet sound.
 */
function heardDb(
  colour: readonly number[],
  amount: number,
  shift: number,
  hz: number,
  mix = 1,
  added?: readonly number[],
  hold = 0,
): number {
  const at = (hz * FRAME) / RATE
  let gain = 0
  for (let k = Math.floor(at) - 9; k <= Math.floor(at) + 10; k++) {
    const bin = Math.min(FRAME / 2, Math.abs(k))
    const db = curveDb(colour, amount, shift, (bin * RATE) / FRAME, added)
    gain += (hannSpectrum(k - at) ** 2 / 1.5) * Math.pow(10, (db + hold) / 20)
  }
  // Dry and wet in step: 1 - mix of the sound as it came, mix of it under the gains.
  return 20 * Math.log10(1 - mix + mix * gain)
}

// --- Reading what was drawn --------------------------------------------------

interface Shape {
  op: 'stroke' | 'fill'
  points: [number, number][]
  width: number
  alpha: number
  dash: number[]
  colour: string
}

/** Every path stroked or filled, with the pen it was drawn with. */
function shapes(drawn: RecordingContext): Shape[] {
  const found: Shape[] = []
  let points: [number, number][] = []
  let dash: number[] = []
  const pen: Record<string, unknown> = { lineWidth: 1, globalAlpha: 1 }
  for (const call of drawn.calls) {
    if (call.name.startsWith('set ')) pen[call.name.slice(4)] = call.args[0]
    else if (call.name === 'beginPath') points = []
    else if (call.name === 'moveTo' || call.name === 'lineTo')
      points.push([call.args[0] as number, call.args[1] as number])
    else if (call.name === 'setLineDash') dash = [...(call.args[0] as number[])]
    else if (call.name === 'stroke' || call.name === 'fill')
      found.push({
        op: call.name,
        points,
        width: pen.lineWidth as number,
        alpha: pen.globalAlpha as number,
        dash,
        colour: String(call.name === 'stroke' ? pen.strokeStyle : pen.fillStyle),
      })
  }
  return found
}

const lines = (drawn: RecordingContext, width: number, dashed: boolean): Shape[] =>
  shapes(drawn).filter(
    (shape) =>
      shape.op === 'stroke' &&
      shape.width === width &&
      shape.dash.length > 0 === dashed &&
      shape.points.length > 10,
  )

/** What is heard of the colour: the one long line in the ink at full strength. */
function heardCurve(drawn: RecordingContext): [number, number][] {
  const curves = lines(drawn, 1.5, false)
  expect(curves.length, 'one main curve').toBe(1)
  expect(curves[0].colour).toBe(PLAIN_COLOURS.ink)
  return curves[0].points
}

const xOf = (hz: number, within: Box = box): number =>
  within.x + (Math.log(hz / 20) / Math.log(1000)) * within.w

/** What a drawn curve says a frequency is changed by, in dB. */
function dbAt(points: readonly [number, number][], hz: number, within: Box = box): number {
  const x = xOf(hz, within)
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1]
    const [x1, y1] = points[i]
    if (x < x0 || x > x1) continue
    const y = x1 === x0 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
    return IMPRINT_MOST_DB - ((y - within.y) / within.h) * 2 * IMPRINT_MOST_DB
  }
  throw new Error(`the line does not reach ${hz} Hz`)
}

/**
 * A drawn curve against the device's. The line is straight between places a
 * 48th of an octave apart where the device's bends: at the sharpest bell there
 * is, on a corner of the grid, that is 0.18 dB, a third of a pixel.
 */
function near(drawn: number, expected: number, what = ''): void {
  expect(Math.abs(drawn - expected), `${what}: ${drawn} against ${expected}`).toBeLessThan(0.25)
}

/** Frequencies over the whole picture, a third of an octave apart, and every bell's own. */
const PROBES: readonly number[] = [
  ...Array.from({ length: 29 }, (_, n) => 25 * Math.pow(2, n / 3)),
  ...SHAPES.flatMap((bells) => bells.map(([hz]) => hz)),
]

describe('the curve', () => {
  it('is a window beside four knobs, with the two a player reaches for first among them', () => {
    expect(display.place).toBe('window')
    expect(display.columns).toBe(2)
    expect(IMPRINT_FACES.imprint.face).toEqual(['shape', 'amount', 'capture', 'replace'])
    expect(display.info.split(/(?<=\.)\s+/).length).toBeLessThanOrEqual(3)
  })

  it('is the bells of the shape named, smoothed as Smooth says, as a tone meets it through the frame', () => {
    expect(imprintSmoothOctaves(0)).toBeCloseTo(SMOOTH_LOW, 6)
    expect(imprintSmoothOctaves(1)).toBeCloseTo(SMOOTH_LOW * SMOOTH_SPAN, 6)
    for (let shape = 1; shape <= 6; shape++) {
      for (const smooth of [0, 0.15, 0.5, 0.83, 1]) {
        const colour = colourOf(shape, smooth)
        const own = imprintBuiltIn(shape, smooth)
        // On the grid, under Amount and Shift, it is the device's curve point for point.
        const onGrid = imprintCurve(own, 1.3, -5, new Float32Array(POINTS))
        for (let g = 0; g < POINTS; g++) {
          expect(own[g]).toBeCloseTo(colour[g], 3)
          const hz = LOW_HZ * Math.pow(2, g / PER_OCTAVE)
          expect(onGrid[g]).toBeCloseTo(curveDb(colour, 1.3, -5, hz), 3)
        }
        // And each bin has the gain the device gives it.
        const bins = imprintBins(onGrid, RATE, new Float32Array(FRAME / 2 + 1))
        for (const k of [0, 1, 2, 7, 31, 200, 853, 1024])
          expect(20 * Math.log10(bins[k]), `bin ${k}`).toBeCloseTo(
            curveDb(colour, 1.3, -5, (k * RATE) / FRAME),
            3,
          )
        const curve = heardCurve(draw({ values: { shape, smooth } }))
        for (const hz of PROBES)
          near(
            dbAt(curve, hz),
            heardDb(colour, 1, 0, hz),
            `shape ${shape}, Smooth ${smooth}, ${hz} Hz`,
          )
      }
    }
  })

  it('stands as high as Amount says, turned over under the middle, and never past 30 dB', () => {
    for (const amount of [-2, -1, -0.4, 0, 0.6, 1.5, 2]) {
      const colour = colourOf(1, 0.5)
      const curve = heardCurve(draw({ values: { shape: 1, amount } }))
      for (const hz of PROBES)
        near(dbAt(curve, hz), heardDb(colour, amount, 0, hz), `Amount ${amount}, ${hz} Hz`)
    }
    // The tallest bell at twice its height asks for 36 dB: the curve stops at 30, as the device does,
    // and a tone on it meets a little less, the bins beside it being under the top.
    const raw = imprintBuiltIn(1, 0)
    expect(Math.max(...imprintCurve(raw, 2, 0, new Float32Array(POINTS)))).toBe(MAX_GAIN_DB)
    expect(Math.min(...imprintCurve(raw, -2, 0, new Float32Array(POINTS)))).toBe(-MAX_GAIN_DB)
    const top = dbAt(heardCurve(draw({ values: { shape: 1, amount: 2, smooth: 0 } })), 730)
    expect(top).toBeLessThanOrEqual(MAX_GAIN_DB)
    expect(top).toBeGreaterThan(MAX_GAIN_DB - 2)
  })

  it('moves with Shift by that many semitones, its ends held', () => {
    for (const shift of [-24, -7, 0, 5, 12, 24]) {
      const colour = colourOf(3, 0.3)
      const curve = heardCurve(draw({ values: { shape: 3, shift, smooth: 0.3 } }))
      for (const hz of PROBES)
        near(dbAt(curve, hz), heardDb(colour, 1, shift, hz), `Shift ${shift}, ${hz} Hz`)
      // The bell at 2290 Hz stands where Shift has moved it.
      const moved = 2290 * Math.pow(2, shift / 12)
      expect(dbAt(curve, moved)).toBeGreaterThan(dbAt(curve, moved * 1.19))
      expect(dbAt(curve, moved)).toBeGreaterThan(dbAt(curve, moved / 1.19))
    }
  })

  it('draws what Mix lets be heard, and still shows the colour as it is set while Mix is 0', () => {
    const colour = colourOf(1, 0.5)
    // All the way: one line, nothing behind it.
    expect(lines(draw(), 1, true).length).toBe(0)
    for (const mix of [0, 0.3, 0.7]) {
      const drawn = draw({ values: { mix } })
      const heard = heardCurve(drawn)
      const set = lines(drawn, 1, true)
      expect(set.length, 'the colour as it is set, dotted').toBe(1)
      for (const hz of PROBES) {
        near(dbAt(heard, hz), heardDb(colour, 1, 0, hz, mix), `Mix ${mix}, ${hz} Hz`)
        near(dbAt(set[0].points, hz), heardDb(colour, 1, 0, hz), `as set, ${hz} Hz`)
      }
    }
    expect(imprintHeard(0.5, 0.3)).toBeCloseTo(20 * Math.log10(0.7 + 0.3 * 0.5), 9)
    expect(imprintHeard(3, 1)).toBeCloseTo(20 * Math.log10(3), 9)
    // Dry only: what is heard is level, and the fill between it and the line has no height.
    const dry = heardCurve(draw({ values: { mix: 0 } }))
    for (const [, y] of dry) expect(y).toBeCloseTo(box.y + box.h / 2, 6)
  })

  it('is drawn to the size it is given: upright, 204 wide', () => {
    const wide: Box = { x: 4, y: 4, w: 204 - 8, h: size.height - 8 }
    const colour = colourOf(5, 0.2)
    const curve = heardCurve(draw({ values: { shape: 5, smooth: 0.2, amount: 1.4 }, width: 204 }))
    for (const hz of PROBES) near(dbAt(curve, hz, wide), heardDb(colour, 1.4, 0, hz), '')
  })
})

describe('the point', () => {
  it('stands where Shift has moved the middle of the shape and as high as Amount presses', () => {
    expect(IMPRINT_MID_HZ).toBeCloseTo(LOW_HZ * Math.pow(2, MID_OCTAVE), 6)
    for (const [amount, shift] of [
      [1, 0],
      [-2, -24],
      [2, 24],
      [0.35, 7],
      [-1.2, -11.5],
    ]) {
      const at = point({ amount, shift })
      expect(at.x).toBeCloseTo(xOf(IMPRINT_MID_HZ * Math.pow(2, shift / 12)), 6)
      const y =
        box.y + ((IMPRINT_MOST_DB - amount * IMPRINT_POINT_DB) / (2 * IMPRINT_MOST_DB)) * box.h
      expect(at.y).toBeCloseTo(y, 6)
      // Dragged to where it would stand at a setting, it sets that setting.
      const set = point().drag(at.x, at.y)
      expect(set.amount).toBeCloseTo(amount, 6)
      expect(set.shift).toBeCloseTo(shift, 6)
    }
    // The two ends of Amount are the top and the foot of the picture: the whole height to set it by.
    expect(point({ amount: -2 }).y - point({ amount: 2 }).y).toBeCloseTo(box.h, 6)
    expect(point({ shift: 24 }).x - point({ shift: -24 }).x).toBeGreaterThan(40)
    // Past the picture it stops at the ends of the two ranges.
    expect(point().drag(-50, -50)).toEqual({ shift: -24, amount: 2 })
    expect(point().drag(size.width + 50, size.height + 50)).toEqual({ shift: 24, amount: -2 })
  })

  it('takes the wheel for Smooth, twenty notches from end to end, and goes back on a double press', () => {
    expect(point({ smooth: 0.5 }).wheel?.(1).smooth).toBeCloseTo(0.55, 9)
    expect(point({ smooth: 0.5 }).wheel?.(-3).smooth).toBeCloseTo(0.35, 9)
    expect(point({ smooth: 0.98 }).wheel?.(1)).toEqual({ smooth: 1 })
    expect(point({ smooth: 0.02 }).wheel?.(-1)).toEqual({ smooth: 0 })
    expect(point({ amount: -1.3, shift: 9 }).reset?.()).toEqual({
      amount: params.amount.default,
      shift: params.shift.default,
    })
  })

  it('says its two settings while it is in hand, away from where it stands', () => {
    const high = draw({ values: { amount: 1.5, shift: -7 }, hot: 'stamp' })
    expect(high.words()).toEqual(['Amount +1.50', '−7.0 st'])
    const low = draw({ values: { amount: -0.5, shift: 0 }, hot: 'stamp' })
    expect(low.words()).toEqual(['Amount −0.50', '0.0 st'])
    const baseline = (drawn: RecordingContext): number =>
      drawn.calls.find((call) => call.name === 'fillText')?.args[2] as number
    expect(baseline(high)).toBeGreaterThan(box.y + box.h / 2)
    expect(baseline(low)).toBeLessThan(box.y + box.h / 2)
    for (const words of high.words())
      expect(patchUnder(high, words, PLAIN_COLOURS.plate), words).not.toBeNull()
  })
})

// --- The device's readings ---------------------------------------------------

/** The fourteen readings for a colour given at the 55 places, as `refresh_captured` packs them. */
function readingsOf(
  colour: (place: number) => number,
  heard = 0,
  name = 'shape',
): Record<string, number> {
  const meters: Record<string, number> = { heard }
  for (let r = 0; r < 14; r++) {
    let packed = 0
    for (let j = 3; j >= 0; j--) {
      const place = r * 4 + j
      const db = place < 55 ? colour(place) : 0
      packed = packed * 64 + Math.min(63, Math.max(1, Math.floor(db + 0.5) + 32))
    }
    meters[`${name}${r + 1}`] = packed
  }
  return meters
}

/** A colour read at every fourth grid point, on the whole grid: straight between two readings. */
const spread = (read: ArrayLike<number>): number[] =>
  Array.from({ length: POINTS }, (_, g) => {
    const below = Math.min(53, Math.floor(g / 4))
    return read[below] + (g / 4 - below) * (read[below + 1] - read[below])
  })

/** The frequency of one of the 55 places: every fourth grid point from 40 Hz. */
const placeHz = (place: number): number => LOW_HZ * Math.pow(2, (place * 4) / PER_OCTAVE)

describe('what the device reports', () => {
  const hump = (place: number): number => Math.round(14 * Math.sin(place / 5) - 6 * (place % 3)) + 0

  it('is read back place by place, and nothing is read from no reading', () => {
    const read = imprintCaptured((name) => readingsOf(hump)[name], new Float32Array(55))
    for (let place = 0; place < 55; place++) expect(read[place], `place ${place}`).toBe(hump(place))
    const none = imprintCaptured(() => 0, new Float32Array(55).fill(9))
    expect([...none].every((db) => db === 0)).toBe(true)
    // The ends of what a reading can say.
    const ends = imprintCaptured(
      (name) => readingsOf((place) => (place % 2 ? 40 : -40))[name],
      new Float32Array(55),
    )
    expect([ends[0], ends[1]]).toEqual([-31, 31])
  })

  it('draws the captured colour through the places it was read at, under Amount and Shift', () => {
    const meters = readingsOf(hump, 1)
    const colour = spread(Array.from({ length: 55 }, (_, place) => hump(place)))
    // On the grid the colour goes through every place it was read at.
    const read = imprintCaptured((name) => meters[name], new Float32Array(55))
    const onGrid = imprintSpread(read, new Float32Array(POINTS))
    for (let g = 0; g < POINTS; g++) expect(onGrid[g]).toBeCloseTo(colour[g], 4)
    for (let place = 0; place < 55; place++) expect(onGrid[place * 4]).toBe(hump(place))
    const plain = heardCurve(draw({ values: { shape: 0 }, meters }))
    for (let place = 0; place < 54; place++)
      near(dbAt(plain, placeHz(place)), heardDb(colour, 1, 0, placeHz(place)), `place ${place}`)
    const set = heardCurve(draw({ values: { shape: 0, amount: -1.5, shift: 5 }, meters }))
    for (const hz of PROBES) near(dbAt(set, hz), heardDb(colour, -1.5, 5, hz), `${hz} Hz`)
  })

  it('draws the open vowel, and says so, while Shape is Captured and nothing has been', () => {
    // The device presses the open vowel on the sound then (kStandIn): that is what is drawn.
    expect(IMPRINT_STAND_IN).toBe(1)
    const colour = colourOf(IMPRINT_STAND_IN, 0.5)
    for (const capture of [0, 1]) {
      const none = draw({ values: { shape: 0, amount: 1.5, shift: -3, capture } })
      const curve = heardCurve(none)
      for (const hz of PROBES) near(dbAt(curve, hz), heardDb(colour, 1.5, -3, hz), `${hz} Hz`)
      expect(none.words()).toEqual(['Nothing captured'])
      expect(patchUnder(none, 'Nothing captured', PLAIN_COLOURS.plate)).not.toBeNull()
    }
    // Readings left over from before count for nothing while the device says it has heard nothing.
    const stale = heardCurve(draw({ values: { shape: 0 }, meters: readingsOf(() => 9, 0) }))
    for (const hz of PROBES) near(dbAt(stale, hz), heardDb(colour, 1, 0, hz), `${hz} Hz`)
    // The first of the Learn time heard, the capture is the colour, whatever it reads.
    const begun = heardCurve(draw({ values: { shape: 0 }, meters: readingsOf(() => 0, 0.01) }))
    for (const hz of PROBES) expect(dbAt(begun, hz)).toBeCloseTo(0, 6)
  })

  it('adds what Replace is reported to add, before the 30 dB stop, to any shape', () => {
    const tilt = (place: number): number => Math.round(12 - place / 2)
    const added = spread(Array.from({ length: 55 }, (_, place) => tilt(place)))
    const meters = { ...readingsOf(hump, 1), ...readingsOf(tilt, 1, 'added') }
    const built = colourOf(4, 0.5)
    const onBuilt = heardCurve(draw({ values: { shape: 4, amount: 1.2, shift: 4 }, meters }))
    for (const hz of PROBES)
      near(dbAt(onBuilt, hz), heardDb(built, 1.2, 4, hz, 1, added), `built in, ${hz} Hz`)
    // What is added does not move with Shift or turn over with Amount: it is the sound's own.
    const under = heardCurve(draw({ values: { shape: 4, amount: 0 }, meters }))
    for (const hz of PROBES) near(dbAt(under, hz), heardDb(built, 0, 0, hz, 1, added), `${hz} Hz`)
    const captured = spread(Array.from({ length: 55 }, (_, place) => hump(place)))
    const onCaptured = heardCurve(draw({ values: { shape: 0, amount: -1 }, meters }))
    for (const hz of PROBES)
      near(dbAt(onCaptured, hz), heardDb(captured, -1, 0, hz, 1, added), `captured, ${hz} Hz`)
    // Colour and what is added together past 30 dB stop there, as the device's curve does.
    const steep = { ...readingsOf(() => 25, 1), ...readingsOf(() => 20, 1, 'added') }
    const top = heardCurve(draw({ values: { shape: 0 }, meters: steep }))
    for (const hz of [200, 1000, 5000]) expect(dbAt(top, hz)).toBeCloseTo(MAX_GAIN_DB, 4)
  })

  it('moves the whole curve by the gain the level hold reports, under Mix', () => {
    const colour = colourOf(1, 0.5)
    for (const hold of [-9.5, 0, 4.25]) {
      for (const mix of [1, 0.4]) {
        const drawn = draw({ values: { mix }, meters: { hold } })
        const curve = heardCurve(drawn)
        for (const hz of PROBES)
          near(
            dbAt(curve, hz),
            heardDb(colour, 1, 0, hz, mix, undefined, hold),
            `hold ${hold}, Mix ${mix}, ${hz} Hz`,
          )
        // The colour as it is set, dotted behind, is the wet sound alone: it has the hold too.
        if (mix < 1) {
          const [set] = lines(drawn, 1, true)
          for (const hz of PROBES)
            near(dbAt(set.points, hz), heardDb(colour, 1, 0, hz, 1, undefined, hold), `${hz} Hz`)
        }
      }
    }
    // The hold eases over a few frames like the other readings.
    const after = (seconds: number): number =>
      dbAt(
        heardCurve(
          runDisplay(display, params, 0.5 + seconds, { signal: testSignal() }, (time) => ({
            meters: { hold: time < 0.5 ? 0 : -8 },
          })),
        ),
        60,
      )
    expect(after(0.1)).toBeLessThan(-1)
    expect(after(0.1)).toBeGreaterThan(-7.5)
    expect(after(1)).toBeCloseTo(-8, 1)
  })

  it('comes to a new reading over a few frames while it runs, and is there in a second', () => {
    const options = { values: { shape: 0 }, signal: testSignal() }
    const flat = readingsOf(() => 0, 1)
    const raised = readingsOf(() => 12, 1)
    // The reading changes half a second in.
    const after = (seconds: number): number =>
      dbAt(
        heardCurve(
          runDisplay(display, params, 0.5 + seconds, options, (time) => ({
            meters: time < 0.5 ? flat : raised,
          })),
        ),
        placeHz(27),
      )
    const first = after(0.1)
    expect(first).toBeGreaterThan(0.5)
    expect(first).toBeLessThan(11)
    const settled = after(1)
    expect(settled).toBeCloseTo(12, 1)
  })

  it('fills the bar at the foot by the share of the Learn time heard, and says Held with Capture off', () => {
    const bars = (drawn: RecordingContext): { colour: string; w: number; y: number }[] => {
      let colour = ''
      const found: { colour: string; w: number; y: number }[] = []
      for (const call of drawn.calls) {
        if (call.name === 'set fillStyle') colour = String(call.args[0])
        else if (call.name === 'fillRect' && call.args[3] === 2)
          found.push({ colour, w: call.args[2] as number, y: call.args[1] as number })
      }
      return found
    }
    for (const heard of [0.25, 0.8, 1]) {
      const drawn = run(0.2, { meters: readingsOf(() => 0, heard), signal: testSignal() })
      const [track, fill] = bars(drawn)
      expect(track).toEqual({ colour: PLAIN_COLOURS.ink, w: box.w, y: box.y + box.h - 2 })
      expect(fill.colour).toBe(PLAIN_COLOURS.accent)
      expect(fill.w).toBeCloseTo(heard * box.w, 6)
      expect(drawn.words()).toEqual([])
    }
    // Nothing heard yet: the bar is there, empty.
    expect(bars(draw()).length).toBe(1)
    const off = draw({ values: { capture: 0 }, meters: readingsOf(() => 0, 0.8) })
    expect(bars(off)).toEqual([])
    expect(off.words()).toEqual(['Held'])
    expect(patchUnder(off, 'Held', PLAIN_COLOURS.plate)).not.toBeNull()
    // Capture off with nothing learned: nothing is held, and a built-in shape needs no word.
    expect(draw({ values: { capture: 0 } }).words()).toEqual([])
  })
})

// --- The compiled device -----------------------------------------------------

describe('the compiled device', () => {
  const BLOCK = 128

  function noiseSource(): () => number {
    let seed = 1
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed / 2147483648 - 1
    }
  }

  type Device = Awaited<ReturnType<typeof loadWasmDevice>>

  async function deviceAt(values: Record<string, number>): Promise<Device> {
    const device = await loadWasmDevice('imprint', RATE)
    for (const [name, value] of Object.entries(values)) device.set(params[name], value)
    return device
  }

  /**
   * What the device does to each of a set of tones played together, in dB,
   * once it has settled: four seconds to settle, two measured. Each tone is a
   * whole number of Hz, so over two seconds none leaks into another. With
   * `tilt` the tones fall off by so many times 6 dB an octave from the lowest.
   */
  function gains(device: Device, tones: readonly number[], tilt = 0): number[] {
    const sums = tones.map(() => ({ inSin: 0, inCos: 0, outSin: 0, outCos: 0 }))
    const block = new Float32Array(BLOCK)
    for (let done = 0; done < RATE * 6; done += BLOCK) {
      block.fill(0)
      for (const hz of tones) {
        const step = (2 * Math.PI * hz) / RATE
        const size = 0.02 * Math.pow(hz / tones[0], -tilt)
        for (let i = 0; i < BLOCK; i++) block[i] += size * Math.sin(step * (done + i))
      }
      device.processBlock(block)
      if (done < RATE * 4) continue
      const out = device.view(device.device.device_out_left(), BLOCK)
      tones.forEach((hz, t) => {
        const step = (2 * Math.PI * hz) / RATE
        for (let i = 0; i < BLOCK; i++) {
          const sin = Math.sin(step * (done + i))
          const cos = Math.cos(step * (done + i))
          sums[t].inSin += block[i] * sin
          sums[t].inCos += block[i] * cos
          sums[t].outSin += out[i] * sin
          sums[t].outCos += out[i] * cos
        }
      })
    }
    return sums.map(
      (sum) =>
        20 * Math.log10(Math.hypot(sum.outSin, sum.outCos) / Math.hypot(sum.inSin, sum.inCos)),
    )
  }

  /**
   * How far the device's gains stand from the drawn curve, in dB, at worst:
   * as they are, nothing laid over anything. The level hold's one gain for
   * the whole sound is in the picture, from the device's own reading of it.
   */
  const apart = (measured: readonly number[], drawn: readonly number[]): number =>
    Math.max(...measured.map((db, t) => Math.abs(db - drawn[t])))

  /** Every reading the device gives, by name, as the bench hands them to the display. */
  function readings(device: Device): Record<string, number> {
    const meters: Record<string, number> = {}
    Object.keys(stock.get('imprint')?.meters ?? {}).forEach(
      (name, index) => (meters[name] = device.device.device_meter?.(index) ?? Number.NaN),
    )
    return meters
  }

  const TONES = [
    150, 220, 300, 450, 600, 730, 900, 1090, 1400, 1800, 2440, 2900, 3400, 4500, 6000, 9000,
  ]

  it('presses a built-in colour on tones as the curve is drawn', async () => {
    const settings: Record<string, number>[] = [
      { shape: 1, replace: 0 },
      { shape: 2, replace: 0, amount: -1.5, shift: 7, smooth: 0.7 },
      // Narrow bells brought down to where a bin is a wide step in pitch: the frame rounds them off, and so does the curve.
      { shape: 6, replace: 0, amount: 2, shift: -12, smooth: 0.35 },
    ]
    const holds: number[] = []
    for (const values of settings) {
      const device = await deviceAt(values)
      const measured = gains(device, TONES)
      const meters = readings(device)
      holds.push(meters.hold)
      const curve = heardCurve(draw({ values, meters }))
      const drawn = TONES.map((hz) => dbAt(curve, hz))
      expect(Math.max(...drawn) - Math.min(...drawn), 'a curve worth the name').toBeGreaterThan(8)
      expect(apart(measured, drawn), JSON.stringify(values)).toBeLessThan(0.2)
    }
    // The level is held where it came in: the hold's gain is far from nothing, and it is drawn.
    expect(Math.max(...holds.map(Math.abs)), 'a hold worth drawing').toBeGreaterThan(2)
  })

  it('draws what Replace adds as the device does it', async () => {
    const settings: Record<string, number>[] = [
      { shape: 1, replace: 1 },
      { shape: 3, replace: 0.6, amount: -1, shift: 5 },
      { shape: 6, replace: 1, amount: -0.5 },
    ]
    for (const values of settings) {
      // Tones that fall off by 6 dB an octave: a shape of its own for Replace to flatten.
      const device = await deviceAt(values)
      const measured = gains(device, TONES, 1)
      const meters = readings(device)
      const drawn = TONES.map((hz) => dbAt(heardCurve(draw({ values, meters })), hz))
      // Without what Replace adds the picture would be far out: it is a good part of what is done.
      const { hold } = meters
      const bare = TONES.map((hz) => dbAt(heardCurve(draw({ values, meters: { hold } })), hz))
      expect(apart(measured, bare), 'what Replace adds is worth drawing').toBeGreaterThan(3)
      // What is added comes in whole dB at every sixth of an octave, each the mean around its
      // place: a lone tone stands in a dip of its own making that the readings round off, so it
      // comes out a dB or so under the line (on noise the two agree within half a dB: the harness).
      expect(apart(measured, drawn), JSON.stringify(values)).toBeLessThan(2.5)
      const mean = (list: readonly number[]): number =>
        list.reduce((a, b) => a + b, 0) / list.length
      expect(Math.abs(mean(measured) - mean(drawn)), 'on the whole').toBeLessThan(1.5)
    }
  })

  it('reports the colour it has captured, and presses it on as the display draws it', async () => {
    // Four seconds of noise with a rise at 1.2 kHz and a dip at 4 kHz, learned and then held.
    const device = await deviceAt({ shape: 0, replace: 0, capture: 1 })
    const noise = noiseSource()
    const filters = [biquad('peaking', 1200, 1.5, 14, RATE), biquad('peaking', 4000, 2, -12, RATE)]
    const memory = filters.map(() => [0, 0])
    const block = new Float32Array(BLOCK)
    for (let done = 0; done < RATE * 4; done += BLOCK) {
      for (let i = 0; i < BLOCK; i++) {
        let x = 0.05 * noise()
        filters.forEach((filter, f) => {
          const y = filter.b0 * x + memory[f][0]
          memory[f][0] = filter.b1 * x - filter.a1 * y + memory[f][1]
          memory[f][1] = filter.b2 * x - filter.a2 * y
          x = y
        })
        block[i] = x
      }
      device.processBlock(block)
    }
    device.set(params.capture, 0)
    expect(Object.keys(readings(device))).toEqual([
      ...Array.from({ length: 14 }, (_, r) => `shape${r + 1}`),
      'heard',
      ...Array.from({ length: 14 }, (_, r) => `added${r + 1}`),
      'hold',
    ])
    const captured = readings(device)
    // Learn is two seconds and four were heard.
    expect(captured.heard).toBe(1)
    const values = { shape: 0, replace: 0, capture: 0 }
    // The rise and the dip are where they were put.
    const learned = heardCurve(draw({ values, meters: captured }))
    expect(dbAt(learned, 1200)).toBeGreaterThan(dbAt(learned, 500) + 6)
    expect(dbAt(learned, 4000)).toBeLessThan(dbAt(learned, 2500) - 6)
    const measured = gains(device, TONES)
    // With the tones playing, the hold is the tones' own: the readings are taken again.
    const meters = readings(device)
    const curve = heardCurve(draw({ values, meters }))
    // The readings are whole dB at every sixth of an octave.
    expect(
      apart(
        measured,
        TONES.map((hz) => dbAt(curve, hz)),
      ),
    ).toBeLessThan(1)
  })

  it('with nothing captured presses the open vowel on, as the display draws it', async () => {
    const values = { shape: 0, replace: 0, capture: 0 }
    const device = await deviceAt(values)
    const measured = gains(device, TONES)
    const meters = readings(device)
    expect(meters.heard).toBe(0)
    const drawn = draw({ values, meters })
    expect(drawn.words()).toEqual(['Nothing captured'])
    const curve = heardCurve(drawn)
    const said = TONES.map((hz) => dbAt(curve, hz))
    expect(Math.max(...said) - Math.min(...said)).toBeGreaterThan(8)
    expect(apart(measured, said)).toBeLessThan(0.2)
  })
})
