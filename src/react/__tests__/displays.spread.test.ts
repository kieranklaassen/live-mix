// The display of Spread against the device: the curve against the formula in
// `cpp/devices/spread/spread.h` and against the compiled device itself, the
// handles against the parameters they set, the bars against the two sides of
// a sound, and the held curve against the meter the device reports.

import { describe, expect, it } from 'vitest'

import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { SPREAD_METERS, SPREAD_PARAMS } from '../../dsp/devices/spread.gen'
import { PLAIN_COLOURS, hzOfX, xOfHz } from '../components/display-kit'
import {
  SPREAD_BANDS,
  SPREAD_FACES,
  SPREAD_STAGE_OCTAVES,
  SPREAD_TOP_OF_RANGE,
  spreadBand,
  spreadBox,
  spreadGain,
  spreadMade,
  spreadWidthOfY,
  spreadWidths,
  spreadY,
  type SpreadCurve,
} from '../components/displays/spread'
import { type DisplayLevel, type DisplaySignal } from '../components/plate-display'
import {
  displaySize,
  drawDisplay,
  patchUnder,
  runDisplay,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const display = SPREAD_FACES.spread.display
const params = SPREAD_PARAMS
const P = SPREAD_PARAMS
const RATE = 48000

/** The sizes the display is handed: beside two knobs, on an upright plate, and as low as a strip. */
const SIZES: readonly [number, number][] = [
  [displaySize(display).width, displaySize(display).height],
  [204, 100],
  [224, 48],
]

const START: SpreadCurve = {
  low: P.low.default,
  mid: P.mid.default,
  high: P.high.default,
  lowHz: P.lowHz.default,
  highHz: P.highHz.default,
  slope: P.slope.default,
}

const SETTINGS: readonly SpreadCurve[] = [
  START,
  { low: 2, mid: 0.5, high: 2, lowHz: 300, highHz: 2000, slope: 1 },
  { low: 1, mid: 0, high: 1, lowHz: 120, highHz: 6000, slope: 0 },
  { low: 0.6, mid: 2, high: 0, lowHz: 800, highHz: 12000, slope: 0.3 },
]

// --- The header's formula, written out apart from the display -----------------

/** `kSpreadOctaves` and `kTopOfRange` in `spread.h`. */
const K_SPREAD_OCTAVES = 1
const K_TOP_OF_RANGE = 0.45

interface C {
  re: number
  im: number
}
const c = (re: number, im = 0): C => ({ re, im })
const add = (...v: C[]): C => v.reduce((s, x) => c(s.re + x.re, s.im + x.im), c(0))
const times = (a: C, b: C): C => c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re)
const over = (a: C, b: C): C => {
  const d = b.re * b.re + b.im * b.im
  return c((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d)
}
const scaled = (a: C, g: number): C => c(a.re * g, a.im * g)

/**
 * `Stage::process` as a response: A and B are `kit::Svf` at Q √½, the bilinear
 * transform of s² + √2·s + 1, so a frequency is heard at tan(πf/rate) over
 * tan(πf₀/rate).
 */
function headerStage(hz: number, lowHz: number, highHz: number, g: number[], rate: number): C {
  const [l, m, h] = g
  const parts = (corner: number): [C, C, C] => {
    const w =
      Math.tan((Math.PI * hz) / rate) /
      Math.tan((Math.PI * Math.min(corner, K_TOP_OF_RANGE * rate)) / rate)
    const s = c(0, w)
    const d = add(times(s, s), scaled(s, Math.SQRT2), c(1))
    return [over(c(1), d), over(scaled(s, Math.SQRT2), d), over(times(s, s), d)]
  }
  const [lpA, bpA, hpA] = parts(lowHz)
  const [lpB, bpB, hpB] = parts(highHz)
  return add(
    times(lpB, add(scaled(lpA, l), scaled(bpA, Math.sqrt(l * m)), scaled(hpA, m))),
    times(hpA, add(scaled(bpB, Math.sqrt(m * h)), scaled(hpB, h))),
    scaled(times(add(lpA, bpA), add(bpB, hpB)), Math.cbrt(l * m * h)),
  )
}

function headerGain(hz: number, set: SpreadCurve, rate: number): number {
  const apart = Math.pow(2, K_SPREAD_OCTAVES * (1 - set.slope))
  const g = [Math.sqrt(set.low), Math.sqrt(set.mid), Math.sqrt(set.high)]
  const both = times(
    headerStage(hz, set.lowHz / apart, set.highHz / apart, g, rate),
    headerStage(hz, set.lowHz * apart, set.highHz * apart, g, rate),
  )
  return Math.hypot(both.re, both.im)
}

// --- Reading what was drawn ----------------------------------------------------

interface Stroke {
  points: [number, number][]
  colour: string
  alpha: number
  width: number
  dash: number[]
}

/** Every line put on the canvas, with what it was drawn in. */
function strokes(drawn: RecordingContext): Stroke[] {
  const found: Stroke[] = []
  let points: [number, number][] = []
  let colour = ''
  let alpha = 1
  let width = 1
  let dash: number[] = []
  for (const { name, args } of drawn.calls) {
    const numbers = args as number[]
    if (name === 'set strokeStyle') colour = String(args[0])
    else if (name === 'set globalAlpha') alpha = numbers[0]
    else if (name === 'set lineWidth') width = numbers[0]
    else if (name === 'setLineDash') dash = [...(args[0] as number[])]
    else if (name === 'beginPath') points = []
    else if (name === 'moveTo' || name === 'lineTo') points.push([numbers[0], numbers[1]])
    else if (name === 'stroke') found.push({ points, colour, alpha, width, dash })
  }
  return found
}

/** The rectangles filled in `colour`, with how strongly. */
function fills(drawn: RecordingContext, colour: string): { box: number[]; alpha: number }[] {
  const found: { box: number[]; alpha: number }[] = []
  let fill = ''
  let alpha = 1
  for (const { name, args } of drawn.calls) {
    if (name === 'set fillStyle') fill = String(args[0])
    else if (name === 'set globalAlpha') alpha = (args as number[])[0]
    else if (name === 'fillRect' && fill === colour) found.push({ box: args as number[], alpha })
  }
  return found
}

const draw = (options: FrameOptions = {}): RecordingContext => drawDisplay(display, params, options)

const handleOf = (key: string, values: Record<string, number> = {}, size = SIZES[0]) => {
  const view = viewOf(display, params, { values, width: size[0], height: size[1] })
  const found = display.handles?.(view).find((candidate) => candidate.key === key)
  if (!found) throw new Error(`spread has no handle ${key}`)
  return found
}

/** The curve as drawn: the one full line in the ink, a pixel and a half wide. */
const curveOf = (drawn: RecordingContext): Stroke => {
  const found = strokes(drawn).filter(
    (stroke) =>
      stroke.colour === PLAIN_COLOURS.ink &&
      stroke.width === 1.5 &&
      stroke.dash.length === 0 &&
      stroke.points.length > 10,
  )
  expect(found.length).toBe(1)
  return found[0]
}

describe('the spread display: the curve', () => {
  it('copies the constants of the header', () => {
    expect(SPREAD_STAGE_OCTAVES).toBe(K_SPREAD_OCTAVES)
    expect(SPREAD_TOP_OF_RANGE).toBe(K_TOP_OF_RANGE)
  })

  it("is the header's formula at every frequency, setting and sample rate", () => {
    for (const rate of [44100, 48000, 96000])
      for (const set of SETTINGS)
        for (let n = 0; n <= 60; n++) {
          const hz = 20 * Math.pow(1000, n / 60)
          expect(spreadGain(hz, set, rate)).toBeCloseTo(headerGain(hz, set, rate), 9)
        }
    // Every region at 1 changes nothing, and a region's own width is what its middle gets.
    const flat = { ...START, low: 1, mid: 1, high: 1 }
    for (const hz of [30, 180, 1000, 3200, 15000]) expect(spreadGain(hz, flat, RATE)).toBeCloseTo(1, 9)
    const sharp = { low: 0.4, mid: 1.3, high: 2, lowHz: 200, highHz: 4000, slope: 1 }
    expect(spreadGain(25, sharp, RATE)).toBeCloseTo(0.4, 2)
    expect(spreadGain(900, sharp, RATE)).toBeCloseTo(1.3, 2)
    expect(spreadGain(19000, sharp, RATE)).toBeCloseTo(2, 2)
  })

  it('is what the compiled device does to a tone on the sides', async () => {
    const harness = await loadWasmDevice('spread')
    const block = 128
    for (const set of SETTINGS) {
      for (const hz of [60, 180, 700, 3200, 9000]) {
        harness.device.device_init(RATE, harness.maxBlock)
        for (const name of ['low', 'mid', 'high', 'lowHz', 'highHz', 'slope'] as const)
          harness.set(P[name], set[name])
        harness.set(P.make, 0)
        harness.set(P.safe, 0)
        // Half a second of a tone in opposite phase on the two sides; the last 0.2 s is measured.
        const total = RATE / 2
        const from = total - 9600
        let re = 0
        let im = 0
        let weight = 0
        const left = new Float32Array(block)
        const right = new Float32Array(block)
        for (let done = 0; done < total; done += block) {
          for (let i = 0; i < block; i++) {
            left[i] = 0.5 * Math.sin((2 * Math.PI * hz * (done + i)) / RATE)
            right[i] = -left[i]
          }
          harness.processBlock(left, right)
          const outLeft = harness.view(harness.device.device_out_left(), block)
          const outRight = harness.view(harness.device.device_out_right(), block)
          for (let i = 0; i < block; i++) {
            const n = done + i - from
            if (n < 0) continue
            const hann = 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / 9600)
            const side = 0.5 * (outLeft[i] - outRight[i])
            const turn = (2 * Math.PI * hz * (done + i)) / RATE
            re += hann * side * Math.cos(turn)
            im += hann * side * Math.sin(turn)
            weight += hann
          }
        }
        const measured = (2 * Math.hypot(re, im)) / weight / 0.5
        const said = spreadGain(hz, set, RATE)
        expect(Math.abs(measured - said), `${JSON.stringify(set)} at ${hz} Hz`).toBeLessThan(
          0.01 * Math.max(said, 0.05),
        )
      }
    }
  })

  it('is drawn through its own value at every point, at every size', () => {
    for (const [width, height] of SIZES)
      for (const set of SETTINGS) {
        const box = spreadBox({ width, height })
        const curve = curveOf(draw({ values: { ...set }, width, height }))
        expect(curve.alpha).toBe(1)
        for (const [x, y] of curve.points)
          expect(y).toBeCloseTo(spreadY(spreadGain(hzOfX(x, box), set, RATE), box), 6)
        // It runs from edge to edge and has a point on each split.
        const xs = curve.points.map((point) => point[0])
        expect(xs[0]).toBe(box.x)
        expect(xs[xs.length - 1]).toBeGreaterThanOrEqual(box.x + box.w - 2)
        expect(xs).toContain(xOfHz(set.lowHz, box))
        expect(xs).toContain(xOfHz(set.highHz, box))
        expect([...xs].sort((a, b) => a - b)).toEqual(xs)
      }
  })

  it('stands on a scale where 0 is mono, 1 is as it came and 2 is twice as wide', () => {
    for (const [width, height] of SIZES) {
      const box = spreadBox({ width, height })
      expect(spreadY(2, box)).toBeGreaterThan(box.y)
      expect(spreadY(0, box)).toBeLessThan(box.y + box.h)
      expect(spreadY(1, box)).toBeCloseTo((spreadY(0, box) + spreadY(2, box)) / 2, 9)
      for (const value of [0, 0.37, 1, 2]) expect(spreadWidthOfY(spreadY(value, box), box)).toBeCloseTo(value, 9)
      // The three lines of the scale are drawn there, the one at 1 the strongest.
      const rules = strokes(draw({ width, height })).filter(
        (stroke) => stroke.points.length === 2 && stroke.points[0][1] === stroke.points[1][1],
      )
      const at = (value: number) =>
        rules.find((stroke) => stroke.points[0][1] === Math.floor(spreadY(value, box)) + 0.5)
      expect(at(0)).toBeDefined()
      expect(at(2)).toBeDefined()
      expect(at(1)?.alpha).toBeGreaterThan(at(0)?.alpha ?? 1)
    }
  })

  it('shows what Make adds beside a mono sound as a dashed line: the curve of what each region has over 1', () => {
    // `aim` in `spread.h`: the made sides go through the same stages, with what each width has over 1.
    const excess = (set: SpreadCurve): SpreadCurve => ({
      ...set,
      low: Math.max(0, set.low - 1),
      mid: Math.max(0, set.mid - 1),
      high: Math.max(0, set.high - 1),
    })
    for (const set of SETTINGS)
      for (const hz of [30, 180, 700, 3200, 9000, 16000])
        expect(spreadMade(hz, set, RATE)).toBeCloseTo(headerGain(hz, excess(set), RATE), 9)
    // A region at 2 gets made sides as loud as the middle; one at 1 or under gets none.
    expect(spreadMade(19000, { ...START, high: 2, slope: 1 }, RATE)).toBeCloseTo(1, 2)
    expect(spreadMade(500, { ...START, high: 2, slope: 1 }, RATE)).toBeLessThan(0.01)
    for (const [width, height] of SIZES) {
      const box = spreadBox({ width, height })
      const dashed = (values: Record<string, number>): Stroke[] =>
        strokes(draw({ values, width, height })).filter((stroke) => stroke.dash.length > 0)
      expect(dashed({ make: 0 })).toEqual([])
      // With no region over 1 there is nothing for Make to add.
      expect(dashed({ make: 1, low: 1, mid: 1, high: 0.5 })).toEqual([])
      for (const make of [0.3, 1]) {
        const [line, ...more] = dashed({ make })
        expect(more).toEqual([])
        expect(line.colour).toBe(PLAIN_COLOURS.ink)
        for (const [x, y] of line.points)
          expect(y).toBeCloseTo(spreadY(make * spreadMade(hzOfX(x, box), START, RATE), box), 6)
      }
    }
  })
})

describe('the spread display: the points', () => {
  it('has a point for each region, in the middle of it, at the width it is set to', () => {
    for (const size of SIZES) {
      const box = spreadBox({ width: size[0], height: size[1] })
      const values = { low: 0.4, mid: 1.3, high: 1.9, lowHz: 250, highHz: 5000 }
      const middles = { low: Math.sqrt(20 * 250), mid: Math.sqrt(250 * 5000), high: Math.sqrt(5000 * 20000) }
      for (const key of ['low', 'mid', 'high'] as const) {
        const point = handleOf(key, values, size)
        expect(point.x).toBeCloseTo(xOfHz(middles[key], box), 9)
        expect(point.y).toBeCloseTo(spreadY(values[key], box), 9)
        // A drag is solved for the width whose height is under the hand; across does nothing.
        for (const want of [0, 0.25, 1, 1.62, 2]) {
          expect(point.drag(3, spreadY(want, box))[key]).toBeCloseTo(want, 9)
          expect(point.drag(box.x + box.w, spreadY(want, box))).toEqual(point.drag(0, spreadY(want, box)))
        }
        expect(Object.keys(point.drag(10, 10))).toEqual([key])
        // Past the ends of the scale it stops at the end of the range.
        expect(point.drag(0, -40)[key]).toBe(P[key].max)
        expect(point.drag(0, size[1] + 40)[key]).toBe(P[key].min)
        expect(point.reset?.()).toEqual({ [key]: P[key].default })
        // Room for the hand: the whole range is at least 20 px of travel.
        expect(spreadY(P[key].min, box) - spreadY(P[key].max, box)).toBeGreaterThanOrEqual(20)
      }
    }
  })

  it('has a point for each split, on the curve at the split, that moves across', () => {
    for (const size of SIZES) {
      const box = spreadBox({ width: size[0], height: size[1] })
      for (const set of SETTINGS)
        for (const key of ['lowHz', 'highHz'] as const) {
          const point = handleOf(key, { ...set }, size)
          expect(point.x).toBeCloseTo(xOfHz(set[key], box), 9)
          expect(point.y).toBeCloseTo(spreadY(spreadGain(set[key], set, RATE), box), 9)
          for (const want of [P[key].min, P[key].default, P[key].max]) {
            const got = point.drag(xOfHz(want, box), 0)
            expect(Object.keys(got)).toEqual([key])
            expect(got[key] / want).toBeCloseTo(1, 9)
            expect(point.drag(xOfHz(want, box), size[1])).toEqual(got)
          }
          expect(point.drag(-30, 0)[key]).toBe(P[key].min)
          expect(point.drag(size[0] + 30, 0)[key]).toBe(P[key].max)
          expect(point.reset?.()).toEqual({ [key]: P[key].default })
          expect(xOfHz(P[key].max, box) - xOfHz(P[key].min, box)).toBeGreaterThanOrEqual(20)
          // The wheel sets the slope, a tenth a step, and stops at its ends.
          expect(point.wheel?.(1).slope).toBeCloseTo(Math.min(1, set.slope + 0.1), 9)
          expect(point.wheel?.(-1).slope).toBeCloseTo(Math.max(0, set.slope - 0.1), 9)
          expect(point.wheel?.(40)).toEqual({ slope: 1 })
        }
    }
  })

  it('draws the points where they are taken, and says the one in hand on a patch', () => {
    const box = spreadBox({ width: SIZES[0][0], height: SIZES[0][1] })
    const arcs = (drawn: RecordingContext): number[][] =>
      drawn.calls.filter((call) => call.name === 'arc').map((call) => call.args as number[])
    const drawn = draw()
    const view = viewOf(display, params)
    const handles = display.handles?.(view) ?? []
    expect(handles.map((point) => point.key)).toEqual(['low', 'lowHz', 'mid', 'highHz', 'high'])
    for (const point of handles)
      expect(arcs(drawn).some(([x, y]) => x === point.x && y === point.y)).toBe(true)
    // At rest the scale is said in two words.
    expect(drawn.words()).toEqual(['wide', 'mono'])
    const said = (hot: string, values: Record<string, number> = {}): string => {
      const picture = draw({ values, hot })
      const words = picture.words()[0]
      expect(patchUnder(picture, words, PLAIN_COLOURS.plate)).not.toBeNull()
      return words
    }
    expect(said('low')).toBe('Low  mono')
    expect(said('mid', { mid: 1.25 })).toBe('Mid  ×1.25')
    expect(said('high', { high: 2 })).toBe('High  ×2.00')
    expect(said('lowHz')).toBe('Low split  180 Hz')
    expect(said('highHz', { highHz: 12000 })).toBe('High split  12 kHz')
    // The words in hand keep clear of every point.
    for (const hot of ['low', 'lowHz', 'mid', 'highHz', 'high'])
      for (const values of [{}, { low: 2, mid: 2, high: 2 }, { low: 0, mid: 0, high: 0 }]) {
        const picture = draw({ values, hot })
        const patch = patchUnder(picture, picture.words()[0], PLAIN_COLOURS.plate)
        if (!patch) throw new Error('no patch')
        for (const point of display.handles?.(viewOf(display, params, { values })) ?? [])
          expect(
            point.x > patch.x - 3 &&
              point.x < patch.x + patch.w + 3 &&
              point.y > patch.y - 3 &&
              point.y < patch.y + patch.h + 3,
            `${hot}: ${point.key} under the words`,
          ).toBe(false)
      }
    expect(box.w).toBeGreaterThan(100)
  })
})

// --- The sound -------------------------------------------------------------------

/** One window of sound on each side: tones as [Hz, level left, level right]. */
function sound(tones: readonly [number, number, number][]): DisplaySignal {
  const side = (which: 1 | 2): DisplayLevel => {
    const wave = new Float32Array(2048)
    let peak = 0
    let sum = 0
    for (let i = 0; i < wave.length; i++) {
      for (const tone of tones) wave[i] += tone[which] * Math.sin((2 * Math.PI * tone[0] * i) / RATE)
      peak = Math.max(peak, Math.abs(wave[i]))
      sum += wave[i] * wave[i]
    }
    return { peak, rms: Math.sqrt(sum / wave.length), wave }
  }
  const left = side(1)
  return { input: null, output: left, spectrum: null, binHz: RATE / 2048, left, right: side(2) }
}

/** The two sides of a sound as the display is handed them. */
function wavesOf(signal: DisplaySignal): [Float32Array, Float32Array] {
  if (!signal.left || !signal.right) throw new Error('a sound without its two sides')
  return [signal.left.wave, signal.right.wave]
}

/** The band a frequency falls in. */
const bandOf = (hz: number): number => {
  for (let n = 0; n < SPREAD_BANDS; n++) {
    const [low, high] = spreadBand(n)
    if (hz >= low && hz < high) return n
  }
  throw new Error(`${hz} Hz is in no band`)
}

const scratch = () => ({
  re: new Float32Array(2048),
  im: new Float32Array(2048),
  measured: new Float32Array(SPREAD_BANDS),
  power: new Float32Array(SPREAD_BANDS),
})

describe('the spread display: the sound', () => {
  // 200 Hz the same on both sides, 1 kHz stronger on the left, 5 kHz on the left alone, 9 kHz in opposite phase.
  const tones: [number, number, number][] = [
    [200, 0.2, 0.2],
    [1000, 0.3, 0.1],
    [5000, 0.2, 0],
    [9000, 0.1, -0.1],
  ]

  it('lays its bands a third of an octave wide from 40 Hz up, edge to edge', () => {
    expect(spreadBand(0)[0] * spreadBand(0)[1]).toBeCloseTo(40 * 40, 6)
    for (let n = 0; n < SPREAD_BANDS; n++) {
      const [low, high] = spreadBand(n)
      expect(high / low).toBeCloseTo(Math.pow(2, 1 / 3), 9)
      if (n > 0) expect(low).toBeCloseTo(spreadBand(n - 1)[1], 6)
    }
    expect(spreadBand(SPREAD_BANDS - 1)[1]).toBeGreaterThan(12000)
  })

  it('measures the sides against the middle in each band: (L - R) over (L + R)', () => {
    const state = scratch()
    const heard = sound(tones)
    spreadWidths(...wavesOf(heard), RATE, state)
    expect(state.measured[bandOf(200)]).toBeLessThan(0.01)
    expect(state.measured[bandOf(1000)]).toBeCloseTo((0.3 - 0.1) / (0.3 + 0.1), 2)
    expect(state.measured[bandOf(5000)]).toBeCloseTo(1, 2)
    expect(state.measured[bandOf(9000)]).toBeGreaterThan(50)
    // A band's power is that of the tone in it, middle and sides together.
    expect(state.power[bandOf(200)]).toBeCloseTo(0.2 * 0.2, 2)
    expect(state.power[bandOf(1000)]).toBeCloseTo((0.2 * 0.2 + 0.1 * 0.1), 2)
    expect(state.power[bandOf(400)]).toBeLessThan(1e-7)
  })

  it('draws a bar in the accent for each band that sounds, up to its width', () => {
    for (const [width, height] of SIZES) {
      const box = spreadBox({ width, height })
      const foot = spreadY(0, box)
      const drawn = draw({ signal: sound(tones), width, height })
      const bars = fills(drawn, PLAIN_COLOURS.accent)
      const bar = (hz: number) => {
        const [low, high] = spreadBand(bandOf(hz))
        const found = bars.find(({ box: [x] }) => Math.abs(x - (xOfHz(low, box) + 0.5)) < 1e-6)
        if (!found) throw new Error(`no bar at ${hz} Hz`)
        // A band wide, less a pixel, and standing on the line of a mono sound.
        expect(found.box[2]).toBeCloseTo(xOfHz(high, box) - xOfHz(low, box) - 1, 6)
        expect(found.box[1] + found.box[3]).toBeCloseTo(foot, 6)
        return found.box[1]
      }
      const state = scratch()
      const heard = sound(tones)
      spreadWidths(...wavesOf(heard), RATE, state)
      expect(bar(1000)).toBeCloseTo(spreadY(state.measured[bandOf(1000)], box), 4)
      expect(bar(1000)).toBeCloseTo(spreadY(0.5, box), 0)
      expect(bar(5000)).toBeCloseTo(spreadY(1, box), 0)
      // A mono band is a line on the foot; one that is all sides stops at the top of the scale.
      expect(bar(200)).toBeCloseTo(foot - 1.5, 6)
      expect(bar(9000)).toBeCloseTo(box.y, 6)
      // Only the bands with sound in them: the four tones and what the window spills beside them.
      expect(bars.length).toBeGreaterThanOrEqual(4)
      expect(bars.length).toBeLessThanOrEqual(12)
    }
  })

  it('draws no bars in silence, switched off, or without the two sides', () => {
    const silent = sound([[1000, 0, 0]])
    expect(fills(draw({ signal: silent }), PLAIN_COLOURS.accent)).toEqual([])
    expect(fills(draw({ signal: sound(tones), powered: false }), PLAIN_COLOURS.accent)).toEqual([])
    expect(fills(draw(), PLAIN_COLOURS.accent)).toEqual([])
    const oneSided = { ...sound(tones), left: null, right: null }
    expect(fills(draw({ signal: oneSided }), PLAIN_COLOURS.accent)).toEqual([])
  })

  it('lets a bar rise at once and sink slowly, by the clock', () => {
    const state = display.init?.()
    const box = spreadBox(displaySize(display))
    const top = (drawn: RecordingContext): number =>
      fills(drawn, PLAIN_COLOURS.accent).find(
        ({ box: [x] }) => Math.abs(x - (xOfHz(spreadBand(bandOf(5000))[0], box) + 0.5)) < 1e-6,
      )?.box[1] ?? NaN
    const wide = sound([[5000, 0.2, 0]])
    const narrow = sound([[5000, 0.2, 0.2]])
    expect(top(runDisplay(display, params, 0.5, { state, signal: wide }))).toBeCloseTo(spreadY(1, box), 0)
    // A tenth of a second after the sound turns mono the bar is still most of the way up.
    const soon = top(runDisplay(display, params, 0.1, { state, signal: narrow, now: 20 }))
    expect(soon).toBeGreaterThan(spreadY(1, box) + 1)
    expect(soon).toBeLessThan(spreadY(0.5, box))
    expect(top(runDisplay(display, params, 4, { state, signal: narrow, now: 30 }))).toBeCloseTo(
      spreadY(0, box) - 1.5,
      1,
    )
  })

  it('draws the curve as Safe holds it, from the reading the device reports', () => {
    expect(Object.keys(SPREAD_METERS)).toEqual(['held'])
    expect(SPREAD_METERS.held.display).toBe(true)
    for (const [width, height] of SIZES) {
      const box = spreadBox({ width, height })
      const heldLines = (held: number, options: FrameOptions = {}): Stroke[] =>
        strokes(
          draw({ meters: { held }, signal: sound(tones), width, height, ...options }),
        ).filter((stroke) => stroke.colour === PLAIN_COLOURS.accent && stroke.points.length > 10)
      expect(heldLines(0)).toEqual([])
      expect(heldLines(-0.05)).toEqual([])
      for (const held of [-3, -12]) {
        const [line, ...more] = heldLines(held)
        expect(more).toEqual([])
        for (const [x, y] of line.points)
          expect(y).toBeCloseTo(
            spreadY(Math.pow(10, held / 20) * spreadGain(hzOfX(x, box), START, RATE), box),
            6,
          )
      }
      // Not while it is switched off or nothing is heard: the reading is stale then.
      expect(heldLines(-6, { powered: false })).toEqual([])
      expect(heldLines(-6, { signal: null })).toEqual([])
    }
  })
})
