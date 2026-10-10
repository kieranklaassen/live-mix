// The truth of the Breath's display: what it draws against the device it
// stands for. The formulas the display is drawn from are checked against
// numbers worked out by hand and against the compiled device itself (its
// level on a steady input, a tone through its filter, the readings it
// reports), the drawing against the formulas, and every point that can be
// dragged against the parameter it sets.

import { describe, expect, it } from 'vitest'

import { BREATH_PARAMS } from '../../dsp/devices/breath.gen'
import { loadWasmDevice, type WasmDeviceHarness } from '../../dsp/__tests__/wasm-device-harness'
import { type ParamSpec } from '../../core/params'
import { INK, PLAIN_COLOURS, type Box } from '../components/display-kit'
import {
  BREATH_AIR_SHARE,
  BREATH_CLOSED_HZ,
  BREATH_FACES,
  BREATH_HIGHS_HZ,
  BREATH_POLE_SCALE,
  BREATH_RANGE,
  breathAir,
  breathAirSize,
  breathAt,
  breathBox,
  breathCutoffHz,
  breathFloor,
  breathGain,
  breathHighs,
  breathIn,
  breathLevel,
  breathParts,
  breathPlace,
  breathRise,
  secondsText,
  type BreathParts,
} from '../components/displays/breath'
import { type DisplayHandle, type DisplayHold } from '../components/plate-display'
import {
  drawDisplay,
  patchUnder,
  runDisplay,
  testSignal,
  viewOf,
  type RecordingContext,
} from './display-harness'

const RATE = 48000
const TWO_PI = Math.PI * 2
const BLOCK = 128
const display = BREATH_FACES.breath.display
const specs: Readonly<Record<string, ParamSpec>> = BREATH_PARAMS

// From cpp/devices/breath/breath.h: the constants the display has copies of.
const K_CLOSED_HZ = 200 // kClosedHz
const K_RANGE = 100 // kRange
const K_POLE_SCALE = 1.553774 // kPoleScale, 1 / sqrt(sqrt(2) - 1)
const K_VARY_OCTAVES = 0.5 // kVaryOctaves

type Values = Readonly<Record<string, number>>

/** The sizes the display is drawn at: the strip as the tests have it, as the plate has it, and the upright plate. */
const SIZES = [
  { width: 184, height: 48 },
  { width: 224, height: 48 },
  { width: 204, height: 100 },
] as const

const SETTINGS: readonly Values[] = [
  {},
  { in: 4, hold: 4, out: 4, rest: 4, depth: 0.5, colour: 0.35, air: 0.15, ease: 0.5 },
  { in: 0.25, hold: 0, out: 0.32, rest: 0, depth: 0.5, colour: 0.4, air: 0.8, ease: 0.4 },
  { in: 0.3, hold: 1.6, out: 3, rest: 0.8, depth: 1, colour: 0.6, air: 0.7, ease: 0.3 },
  { in: 2, hold: 0.3, out: 12, rest: 2, depth: 0.8, colour: 1, air: 1, ease: 1, mix: 0.6 },
  { in: 2, hold: 2, out: 2, rest: 2, depth: 1, colour: 0, air: 0, ease: 0 },
]

const valueOf = (values: Values, name: string): number => values[name] ?? specs[name].default
const partsOf = (values: Values): BreathParts =>
  breathParts({ value: (name) => valueOf(values, name) })

function set(device: WasmDeviceHarness, values: Values): void {
  for (const [name, value] of Object.entries(values)) device.set(specs[name], value)
}

function meter(device: WasmDeviceHarness, index: number): number {
  const read = device.device.device_meter
  if (!read) throw new Error('the device reports no readings')
  return read(index)
}

/** What the device makes of `seconds` of a signal, on its left side. */
function render(
  device: WasmDeviceHarness,
  seconds: number,
  signal: (n: number) => number,
): Float32Array {
  const length = Math.round((seconds * RATE) / BLOCK) * BLOCK
  const out = new Float32Array(length)
  const block = new Float32Array(BLOCK)
  for (let done = 0; done < length; done += BLOCK) {
    for (let i = 0; i < BLOCK; i++) block[i] = signal(done + i)
    device.processBlock(block)
    out.set(device.view(device.device.device_out_left(), BLOCK), done)
  }
  return out
}

interface Stroke {
  colour: string
  alpha: number
  width: number
  points: { x: number; y: number }[]
}

/** Every line a drawing strokes, with what it was stroked in. */
function strokes(drawn: RecordingContext): Stroke[] {
  const all: Stroke[] = []
  let path: { x: number; y: number }[] = []
  let arcs = 0
  let colour = ''
  let alpha = 1
  let width = 1
  for (const call of drawn.calls) {
    if (call.name === 'beginPath') {
      path = []
      arcs = 0
    } else if (call.name === 'moveTo' || call.name === 'lineTo')
      path.push({ x: call.args[0] as number, y: call.args[1] as number })
    else if (call.name === 'arc') arcs += 1
    else if (call.name === 'set strokeStyle') colour = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = call.args[0] as number
    else if (call.name === 'set lineWidth') width = call.args[0] as number
    else if (call.name === 'stroke' && arcs === 0) all.push({ colour, alpha, width, points: path })
  }
  return all
}

/** The dots a drawing has: every whole circle, with its radius and what it was filled in. */
function dots(drawn: RecordingContext): { x: number; y: number; r: number; colour: string }[] {
  const all: { x: number; y: number; r: number; colour: string }[] = []
  let fill = ''
  let last: { x: number; y: number; r: number } | null = null
  for (const call of drawn.calls) {
    if (call.name === 'set fillStyle') fill = String(call.args[0])
    else if (call.name === 'arc')
      last = { x: call.args[0] as number, y: call.args[1] as number, r: call.args[2] as number }
    else if (call.name === 'beginPath') last = null
    else if (call.name === 'fill' && last) all.push({ ...last, colour: fill })
  }
  return all
}

/** The fills that are not dots, with what they were filled in. */
function fills(drawn: RecordingContext): { colour: string; alpha: number }[] {
  const all: { colour: string; alpha: number }[] = []
  let colour = ''
  let alpha = 1
  let arcs = 0
  for (const call of drawn.calls) {
    if (call.name === 'beginPath') arcs = 0
    else if (call.name === 'arc') arcs += 1
    else if (call.name === 'set fillStyle') colour = String(call.args[0])
    else if (call.name === 'set globalAlpha') alpha = call.args[0] as number
    else if (call.name === 'fill' && arcs === 0) all.push({ colour, alpha })
  }
  return all
}

const ink = PLAIN_COLOURS.ink
function found<T>(what: string, one: T | undefined | null): T {
  if (one === undefined || one === null) throw new Error(`the drawing has no ${what}`)
  return one
}
/** The level: the one heavy line in the ink. */
const levelLine = (drawn: RecordingContext): Stroke =>
  found(
    'level',
    strokes(drawn).find((s) => s.colour === ink && s.width === 1.5 && s.alpha === 1),
  )
/** The highs: the long thin line that stands back. */
const highsLine = (drawn: RecordingContext): Stroke =>
  found(
    'highs',
    strokes(drawn).find(
      (s) => s.colour === ink && s.width === 1 && s.alpha === INK.back && s.points.length > 2,
    ),
  )
/** The air: the short upright strokes that stand back. */
const airStrokes = (drawn: RecordingContext): Stroke[] =>
  strokes(drawn).filter(
    (s) =>
      s.colour === ink &&
      s.width === 1 &&
      s.alpha === INK.back &&
      s.points.length === 2 &&
      s.points[0].x === s.points[1].x,
  )
/** Where the breath is now: the dot in the accent. */
const nowDot = (drawn: RecordingContext): { x: number; y: number } | undefined =>
  dots(drawn).find((d) => d.r === 3 && d.colour === PLAIN_COLOURS.accent)
const theMark = (drawn: RecordingContext): { x: number; y: number } => found('mark', nowDot(drawn))

const yOf = (level: number, box: Box): number => box.y + (1 - level) * box.h
const phaseOf = (x: number, box: Box): number => (x - box.x) / box.w

function handlesOf(values: Values, size: { width: number; height: number } = SIZES[0]) {
  const view = viewOf(display, specs, { values, ...size })
  const all = display.handles?.(view) ?? []
  const by = (key: string): DisplayHandle => {
    const found = all.find((handle) => handle.key === key)
    if (!found) throw new Error(`no handle ${key}`)
    return found
  }
  return { view, all, by, box: breathBox(view) }
}

describe('the Breath display: the formulas', () => {
  it('has the constants of the device', () => {
    expect(BREATH_CLOSED_HZ).toBe(K_CLOSED_HZ)
    expect(BREATH_RANGE).toBe(K_RANGE)
    expect(BREATH_POLE_SCALE).toBeCloseTo(K_POLE_SCALE, 6)
    // Two equal poles are 3 dB down together where each is 1.5 dB down: at the corner over this.
    expect(BREATH_POLE_SCALE).toBeCloseTo(1 / Math.sqrt(Math.SQRT2 - 1), 5)
  })

  it('has the floor, the way in and the cutoff worked out by hand', () => {
    expect(breathFloor(0)).toBe(1)
    expect(breathFloor(0.5)).toBeCloseTo(0.25, 12)
    expect(breathFloor(1)).toBe(0)
    // A line at Ease 0, half a cosine at 1, and half way between at a half.
    expect(breathRise(0.25, 0)).toBeCloseTo(0.25, 12)
    expect(breathRise(0.25, 1)).toBeCloseTo(0.5 - 0.5 * Math.SQRT1_2, 12)
    expect(breathRise(0.25, 0.5)).toBeCloseTo((0.25 + 0.5 - 0.5 * Math.SQRT1_2) / 2, 12)
    for (const ease of [0, 0.3, 1]) {
      expect(breathRise(0, ease)).toBeCloseTo(0, 12)
      expect(breathRise(0.5, ease)).toBeCloseTo(0.5, 12)
      expect(breathRise(1, ease)).toBeCloseTo(1, 12)
    }
    // The filter: shut at 200 Hz, a hundred times that where it is half shut... and open at no closing.
    expect(breathCutoffHz(1)).toBeCloseTo(200, 9)
    expect(breathCutoffHz(0.5)).toBeCloseTo((200 * 99) / 9, 9)
    expect(breathCutoffHz(0)).toBe(Infinity)
    expect(breathGain(0, 0.5)).toBeCloseTo(0.25, 12)
    expect(breathGain(1, 0.5)).toBe(1)
    expect(breathGain(0.5, 0.5)).toBeCloseTo(0.625, 12)
    expect(breathLevel(0, 0.5, 0.5)).toBeCloseTo(0.625, 12)
    expect(breathLevel(0, 1, 0)).toBe(1)
  })

  it('finds the part a place in the cycle lies in, also where Hold and Rest are nothing', () => {
    const parts = partsOf({ in: 2, hold: 1, out: 4, rest: 1 })
    expect(breathPlace(0.125, parts)).toEqual({ stage: 'in', t: 0.5 })
    expect(breathPlace(0.3125, parts)).toEqual({ stage: 'hold', t: 0.5 })
    expect(breathPlace(0.625, parts)).toEqual({ stage: 'out', t: 0.5 })
    expect(breathPlace(0.9375, parts)).toEqual({ stage: 'rest', t: 0.5 })
    const bare = partsOf({ in: 1, hold: 0, out: 3, rest: 0 })
    expect(breathPlace(0.25, bare)).toEqual({ stage: 'out', t: 0 })
    expect(breathPlace(0.625, bare)).toEqual({ stage: 'out', t: 0.5 })
    expect(breathAt(0.25, bare, 0.4)).toBe(1)
    expect(breathAt(0.125, bare, 0)).toBeCloseTo(0.5, 12)
    expect(breathIn('rest', 0.3, 1)).toBe(0)
    expect(breathIn('hold', 0.3, 1)).toBe(1)
    expect(breathAir('in', 0.5)).toBe(1)
    expect(breathAir('out', 0)).toBe(0)
    expect(breathAir('hold', 0.5)).toBe(0)
    expect(breathAir('rest', 0.5)).toBe(0)
  })

  const STEADY: readonly { name: string; values: Values }[] = [
    { name: 'the breath as it starts', values: { vary: 0, colour: 0, width: 0, air: 0 } },
    {
      name: 'no Hold and no Rest, half mixed',
      values: {
        in: 0.7,
        hold: 0,
        out: 1.1,
        rest: 0,
        depth: 0.8,
        ease: 0.3,
        mix: 0.6,
        vary: 0,
        colour: 0,
        width: 0,
        air: 0,
      },
    },
    {
      name: 'straight lines down to silence',
      values: {
        in: 0.5,
        hold: 0.25,
        out: 0.5,
        rest: 0.75,
        depth: 1,
        ease: 0,
        vary: 0,
        colour: 0,
        width: 0,
        air: 0,
      },
    },
  ]
  it.each(STEADY)('has the level the device gives a steady input: $name', async ({ values }) => {
    const device = await loadWasmDevice('breath', RATE)
    set(device, values)
    const parts = partsOf(values)
    const out = render(device, parts.total * 2.25, () => 0.5)
    let worst = 0
    for (let n = 0; n < out.length; n += 37) {
      const b = breathAt((n / RATE / parts.total) % 1, parts, valueOf(values, 'ease'))
      const model = breathLevel(b, valueOf(values, 'depth'), valueOf(values, 'mix'))
      worst = Math.max(worst, Math.abs(out[n] / 0.5 - model))
    }
    expect(worst).toBeLessThan(2e-3)
  })

  it.each([{ mix: 1 }, { mix: 0.5 }])(
    'has the level the device gives a tone of 4 kHz as the filter closes, at Mix $mix',
    async ({ mix }) => {
      const values = {
        in: 8,
        hold: 2,
        out: 8,
        rest: 2,
        depth: 0.5,
        colour: 1,
        width: 0,
        air: 0,
        ease: 0.5,
        vary: 0,
        mix,
      }
      const device = await loadWasmDevice('breath', RATE)
      set(device, values)
      const parts = partsOf(values)
      const w = (TWO_PI * BREATH_HIGHS_HZ) / RATE
      const out = render(device, parts.total, (n) => 0.5 * Math.sin(w * n))
      // A fiftieth of a second about each moment: 80 whole turns of the tone.
      const span = 960
      for (const at of [0.6, 1.5, 3, 4.5, 6, 7.4, 9, 10.6, 12.5, 14, 16, 17.5, 19]) {
        const start = Math.round(at * RATE) - span / 2
        let re = 0
        let im = 0
        for (let n = start; n < start + span; n++) {
          re += out[n] * Math.cos(w * n)
          im += out[n] * Math.sin(w * n)
        }
        const measured = (2 * Math.hypot(re, im)) / span / 0.5
        const b = breathAt(at / parts.total, parts, values.ease)
        const model = breathHighs(b, values.depth, values.colour, mix, RATE)
        expect(Math.abs(measured - model), `at ${at} s: ${measured} against ${model}`).toBeLessThan(
          0.004 + 0.03 * model,
        )
      }
      // And it is the filter that took them: the level alone would leave far more at the floor.
      const floor = breathHighs(0, values.depth, values.colour, mix, RATE)
      expect(floor).toBeLessThan(breathLevel(0, values.depth, mix) - 0.2 * mix)
    },
  )

  it('leaves the highs with the level where Colour is nothing or the breath is full', () => {
    for (const b of [0, 0.3, 1]) {
      expect(breathHighs(b, 0.6, 0, 1, RATE)).toBeCloseTo(breathLevel(b, 0.6, 1), 12)
    }
    expect(breathHighs(1, 0.6, 1, 1, RATE)).toBeCloseTo(1, 12)
    // At its cutoff the filter is 3 dB down: closely where the cutoff is low, and to a third of a dB
    // where it is near the tone, since the poles are set by their time and not warped.
    for (const [closing, within] of [
      [0.4, 0.3],
      [0.7, 0.08],
      [1, 0.03],
    ]) {
      const hz = breathCutoffHz(closing)
      const db = 20 * Math.log10(breathHighs(1 - closing, 0, 1, 1, RATE, hz))
      expect(Math.abs(db + 3.01), `closing ${closing}: ${db} dB`).toBeLessThan(within)
    }
  })
})

describe('the Breath display: the drawing', () => {
  it.each(SIZES)('draws the level of every setting at $width by $height', (size) => {
    for (const values of SETTINGS) {
      const drawn = drawDisplay(display, specs, {
        values,
        ...size,
        meters: { phase: 0.4, pace: 1 },
      })
      const box = breathBox(size)
      const parts = partsOf(values)
      const line = levelLine(drawn)
      expect(line.points.length).toBeGreaterThan(8)
      expect(line.points[0].x).toBeCloseTo(box.x, 9)
      expect(line.points[line.points.length - 1].x).toBeCloseTo(box.x + box.w, 9)
      for (const point of line.points) {
        const b = breathAt(phaseOf(point.x, box), parts, valueOf(values, 'ease'))
        const y = yOf(breathLevel(b, valueOf(values, 'depth'), valueOf(values, 'mix')), box)
        // A corner is a point of the line twice, once from each side; both are on it.
        expect(Math.abs(point.y - y)).toBeLessThan(box.h * 0.02 + 1e-6)
      }
      // The corners themselves are points of the line, so a short part is not stepped over.
      let seconds = 0
      for (const stage of ['in', 'hold', 'out'] as const) {
        seconds += parts[stage]
        const x = box.x + (seconds / parts.total) * box.w
        expect(line.points.some((point) => Math.abs(point.x - x) < 1e-6)).toBe(true)
      }
    }
  })

  it.each(SIZES)('draws the highs of every setting at $width by $height', (size) => {
    for (const values of SETTINGS) {
      const drawn = drawDisplay(display, specs, { values, ...size })
      const box = breathBox(size)
      const level = levelLine(drawn)
      const highs = highsLine(drawn)
      expect(highs.points.length).toBe(level.points.length)
      highs.points.forEach((point, i) => {
        // The same place in the same part as the level's point: so a corner is read from its own side.
        const y = level.points[i].y
        const gain = 1 - (y - box.y) / box.h
        const mix = valueOf(values, 'mix')
        const depth = valueOf(values, 'depth')
        const floor = breathFloor(depth)
        const b = floor < 1 && mix > 0 ? ((gain - 1 + mix) / mix - floor) / (1 - floor) : 1
        const model = breathHighs(
          Math.min(1, Math.max(0, b)),
          depth,
          valueOf(values, 'colour'),
          mix,
          RATE,
        )
        expect(Math.abs(point.y - yOf(model, box))).toBeLessThan(1e-6 * box.h + 1e-6)
        // Never over the level: the filter only takes.
        expect(point.y).toBeGreaterThan(y - 1e-6)
      })
    }
  })

  it('draws the air as tall as the root of its level, across the line, on the two slopes', () => {
    for (const size of SIZES) {
      const values = { in: 3, hold: 1, out: 3, rest: 1, air: 0.8, depth: 0.7, mix: 0.9, ease: 0.6 }
      const drawn = drawDisplay(display, specs, { values, ...size })
      const box = breathBox(size)
      const parts = partsOf(values)
      const air = airStrokes(drawn)
      expect(air.length).toBeGreaterThan(20)
      let tallest = 0
      for (const stroke of air) {
        const x = stroke.points[0].x
        const tall = Math.abs(stroke.points[1].y - stroke.points[0].y)
        const middle = (stroke.points[0].y + stroke.points[1].y) / 2
        // A stroke is set on the pixel; its place in the cycle is read to within one.
        const fits = [-1, -0.5, 0, 0.5, 1].some((off) => {
          const { stage, t } = breathPlace(phaseOf(x + off, box), parts)
          const want = breathAirSize(values.air, values.mix, stage, t) * BREATH_AIR_SHARE * box.h
          const b = breathIn(stage, t, values.ease)
          const y = yOf(breathLevel(b, values.depth, values.mix), box)
          return Math.abs(tall - want) < 0.25 && Math.abs(middle - y) < 0.6
        })
        expect(fits, `the stroke at ${x}`).toBe(true)
        const { stage } = breathPlace(phaseOf(x, box), parts)
        expect(stage === 'in' || stage === 'out').toBe(true)
        tallest = Math.max(tallest, tall)
      }
      // The tallest stands near the middle of a slope, as tall as Air and Mix make it.
      const most = Math.sqrt(values.air * values.air * values.mix) * BREATH_AIR_SHARE * box.h
      expect(tallest).toBeGreaterThan(most * 0.97)
      expect(tallest).toBeLessThanOrEqual(most + 1e-9)
    }
    expect(breathAirSize(0.5, 1, 'in', 0.5)).toBeCloseTo(0.5, 12)
    expect(breathAirSize(1, 0.25, 'out', 0.5)).toBeCloseTo(0.5, 12)
    expect(airStrokes(drawDisplay(display, specs, { values: { air: 0 } }))).toHaveLength(0)
    expect(airStrokes(drawDisplay(display, specs, { values: { air: 1, mix: 0 } }))).toHaveLength(0)
  })

  it('draws only what Mix lets be heard, and still reads the device with no Mix', () => {
    const size = SIZES[1]
    const box = breathBox(size)
    const drawn = drawDisplay(display, specs, {
      values: { mix: 0, depth: 1, colour: 1, air: 1 },
      ...size,
      meters: { phase: 0.7, pace: 1 },
    })
    for (const point of levelLine(drawn).points) expect(point.y).toBeCloseTo(box.y, 9)
    for (const point of highsLine(drawn).points) expect(point.y).toBeCloseTo(box.y, 9)
    // The breath goes on all the same: the mark is where the device says.
    expect(nowDot(drawn)?.x).toBeCloseTo(box.x + 0.7 * box.w, 9)
    expect(nowDot(drawn)?.y).toBeCloseTo(box.y, 9)
    const half = drawDisplay(display, specs, { values: { mix: 0.5, depth: 1, ease: 0 }, ...size })
    const lowest = Math.max(...levelLine(half).points.map((point) => point.y))
    expect(lowest).toBeCloseTo(box.y + 0.5 * box.h, 9)
  })

  it('marks where each part ends, and writes how long the breath is on a patch', () => {
    const size = SIZES[1]
    const box = breathBox(size)
    const values = { in: 2, hold: 1, out: 4, rest: 1 }
    const drawn = drawDisplay(display, specs, { values, ...size, meters: { phase: 0.2, pace: 1 } })
    const rules = strokes(drawn).filter(
      (s) => s.alpha === INK.grid && s.points.length === 2 && s.points[0].x === s.points[1].x,
    )
    const at = rules.map((s) => s.points[0].x).sort((a, b) => a - b)
    expect(at).toHaveLength(3)
    ;[2, 3, 7].forEach((seconds, i) => {
      expect(Math.abs(at[i] - (box.x + (seconds / 8) * box.w))).toBeLessThanOrEqual(0.5)
    })
    expect(drawn.words()).toEqual(['8.0 s'])
    expect(patchUnder(drawn, '8.0 s', PLAIN_COLOURS.plate)).not.toBeNull()
    expect(secondsText(0.57)).toBe('0.6 s')
    expect(secondsText(9.96)).toBe('10 s')
    expect(secondsText(12.3)).toBe('12 s')
  })

  it('writes what the point in hand sets', () => {
    const values = { in: 2, hold: 1, out: 4, rest: 1.5, depth: 0.5 }
    const words = (hot: string): string[] => drawDisplay(display, specs, { values, hot }).words()
    expect(words('full')).toEqual(['in 2.0 s  hold 1.0 s'])
    expect(words('turn')).toEqual(['hold 1.0 s  out 4.0 s'])
    expect(words('empty')).toEqual(['out 4.0 s  rest 1.5 s'])
    // The floor: a quarter of the level is 12 dB down.
    expect(words('depth')).toEqual(['−12.0 dB'])
    expect(drawDisplay(display, specs, { values: { depth: 1 }, hot: 'depth' }).words()).toEqual([
      'silence',
    ])
  })

  it('keeps the figures clear of the corners at the top', () => {
    for (const size of SIZES) {
      for (const values of [
        ...SETTINGS,
        { in: 1.5, hold: 6, out: 1.5, rest: 0.5 },
        { in: 6, hold: 0, out: 0.5, rest: 0 },
      ]) {
        for (const hot of [null, 'full', 'turn', 'empty']) {
          const drawn = drawDisplay(display, specs, { values, ...size, hot })
          const [words] = drawn.words()
          const patch = found('patch', patchUnder(drawn, words, PLAIN_COLOURS.plate))
          expect(patch.x).toBeGreaterThanOrEqual(0)
          expect(patch.x + patch.w).toBeLessThanOrEqual(size.width)
          const { by } = handlesOf(values, size)
          const corners = [by('full'), by('turn')]
          const free = [patch.x, patch.x + patch.w]
          const clear = corners.every((c) => c.x < free[0] - 5 || c.x > free[1] + 5)
          // Where there is room for them anywhere along the top, that is where they are.
          const room = (from: number, to: number): boolean =>
            corners.every((c) => c.x < from - 7 || c.x > to + 7)
          const box = breathBox(size)
          const anywhere =
            room(box.x + box.w - 1 - patch.w, box.x + box.w - 1) ||
            room(box.x + 8.25, box.x + 8.25 + patch.w)
          if (anywhere) expect(clear, `${JSON.stringify(values)} ${hot}`).toBe(true)
        }
      }
    }
  })
})

describe('the Breath display: what is live', () => {
  it('reads the place in the breath the device reports, awake and at rest', async () => {
    const values = { in: 0.6, hold: 0.2, out: 0.9, rest: 0.3, vary: 0 }
    const device = await loadWasmDevice('breath', RATE)
    set(device, values)
    const parts = partsOf(values)
    const block = new Float32Array(BLOCK).fill(0.25)
    const silent = new Float32Array(BLOCK)
    let frames = 0
    const size = SIZES[1]
    const box = breathBox(size)
    for (let n = 0; n < 4000; n++) {
      // Sound for a second and a half, then silence long enough for the device to go to rest and stay there.
      device.processBlock(frames < 1.5 * RATE ? block : silent)
      frames += BLOCK
      if (n % 97 !== 0) continue
      const phase = meter(device, 0)
      const clock = (frames / RATE / parts.total) % 1
      const apart = Math.abs(((phase - clock + 1.5) % 1) - 0.5)
      expect(apart, `after ${frames} frames`).toBeLessThan(2e-4)
      expect(meter(device, 1)).toBeCloseTo(1, 6)
      // The mark is drawn there, on the line.
      const drawn = drawDisplay(display, specs, { values, ...size, meters: { phase, pace: 1 } })
      const mark = theMark(drawn)
      expect(mark.x).toBeCloseTo(box.x + phase * box.w, 9)
      const b = breathAt(phase, parts, valueOf(values, 'ease'))
      expect(mark.y).toBeCloseTo(yOf(breathLevel(b, valueOf(values, 'depth'), 1), box), 9)
    }
    // It ran for more than ten seconds, most of them silent.
    expect(frames / RATE).toBeGreaterThan(10)
  })

  it('reads the pace of this breath, which is how long it lasts', async () => {
    const values = { in: 0.3, hold: 0.1, out: 0.4, rest: 0.1, vary: 1 }
    const device = await loadWasmDevice('breath', RATE)
    set(device, values)
    const parts = partsOf(values)
    const block = new Float32Array(BLOCK).fill(0.25)
    let last = meter(device, 0)
    let began = 0
    let pace = meter(device, 1)
    const paces: number[] = []
    for (let n = 1; n <= 9000; n++) {
      device.processBlock(block)
      const phase = meter(device, 0)
      if (phase < last) {
        // A breath ended in this block: it lasted as long as its pace said.
        const lasted = (n * BLOCK - began) / RATE
        if (began > 0) {
          expect(Math.abs(lasted - parts.total * pace)).toBeLessThan((2 * BLOCK) / RATE)
          paces.push(pace)
        }
        began = n * BLOCK
        pace = meter(device, 1)
      }
      last = phase
    }
    expect(paces.length).toBeGreaterThan(15)
    // Vary at full is half an octave each way.
    for (const one of paces) {
      expect(one).toBeGreaterThanOrEqual(2 ** -K_VARY_OCTAVES - 1e-6)
      expect(one).toBeLessThanOrEqual(2 ** K_VARY_OCTAVES + 1e-6)
    }
    expect(Math.max(...paces) / Math.min(...paces)).toBeGreaterThan(1.3)
    // The display says how long this breath is, not the nominal one.
    const drawn = drawDisplay(display, specs, { values, meters: { phase: 0.3, pace: 1.3 } })
    expect(drawn.words()).toEqual([secondsText(parts.total * 1.3)])
  })

  it('carries the mark between two readings at the pace of this breath', () => {
    const values = { in: 0.25, hold: 0, out: 0.32, rest: 0, vary: 1 }
    const parts = partsOf(values)
    const size = SIZES[1]
    const box = breathBox(size)
    for (const pace of [0.72, 1, 1.4]) {
      const rate = 1 / (parts.total * pace)
      // A reading every tenth of a second, a frame every thirtieth: two frames in three are carried.
      const reading = (time: number): number =>
        (0.1 + Math.floor(time * 10 + 1e-9) * 0.1 * rate) % 1
      for (const seconds of [0.3, 0.3 + 1 / 30, 0.3 + 2 / 30, 1.0 + 2 / 30]) {
        const drawn = runDisplay(
          display,
          specs,
          seconds + 1 / 30 + 1e-9,
          { values, ...size, meters: { phase: 0.1, pace } },
          (time) => ({ meters: { phase: reading(time), pace } }),
        )
        const truth = (0.1 + seconds * rate) % 1
        const mark = theMark(drawn)
        const apart = Math.abs(((phaseOf(mark.x, box) - truth + 1.5) % 1) - 0.5)
        expect(apart * box.w, `pace ${pace} after ${seconds} s`).toBeLessThan(1.5)
      }
    }
  })

  it('stands still on the reading while the device is off, and takes readings that make no sense', () => {
    const size = SIZES[1]
    const box = breathBox(size)
    const off = runDisplay(display, specs, 1, {
      ...size,
      powered: false,
      meters: { phase: 0.25, pace: 1 },
    })
    expect(nowDot(off)?.x).toBeCloseTo(box.x + 0.25 * box.w, 9)
    for (const meters of [
      { phase: -6, pace: -6 },
      { phase: 0, pace: 0 },
      { phase: Number.NaN, pace: Number.NaN },
      { phase: 7.5, pace: Infinity },
    ]) {
      const drawn = runDisplay(display, specs, 0.5, { ...size, meters, signal: testSignal() })
      for (const { value } of drawn.numbers()) expect(Number.isFinite(value)).toBe(true)
      const mark = theMark(drawn)
      expect(mark.x).toBeGreaterThanOrEqual(box.x)
      expect(mark.x).toBeLessThanOrEqual(box.x + box.w)
    }
    // A device that reports nothing has no mark and no filling.
    const bare = drawDisplay(display, specs, { ...size })
    expect(nowDot(bare)).toBeUndefined()
    expect(fills(bare).some((fill) => fill.colour === PLAIN_COLOURS.accent)).toBe(false)
  })

  it('fills the breath so far up to the mark, the stronger the louder the sound', () => {
    const size = SIZES[1]
    const box = breathBox(size)
    const filled = (output: number | null): { alpha: number; clip: number[] } => {
      const drawn = runDisplay(display, specs, 1.5, {
        ...size,
        powered: false,
        meters: { phase: 0.6, pace: 1 },
        signal: output === null ? null : testSignal(0.5, output),
      })
      const fill = fills(drawn).filter((one) => one.colour === PLAIN_COLOURS.accent)
      expect(fill).toHaveLength(1)
      const clips = drawn.calls.filter((call) => call.name === 'rect')
      return { alpha: fill[0].alpha, clip: clips[0].args as number[] }
    }
    const none = filled(null)
    const quiet = filled(0.02)
    const loud = filled(0.125)
    const full = filled(0.9)
    expect(none.alpha).toBeGreaterThan(0.1)
    expect(quiet.alpha).toBeGreaterThan(none.alpha)
    expect(loud.alpha).toBeGreaterThan(quiet.alpha + 0.1)
    expect(full.alpha).toBeGreaterThan(loud.alpha + 0.1)
    expect(full.alpha).toBeLessThan(0.7)
    // From the start of the breath to the mark, and no further.
    expect(full.clip[0]).toBeCloseTo(box.x, 9)
    expect(full.clip[0] + full.clip[2]).toBeCloseTo(box.x + 0.6 * box.w, 9)
  })
})

describe('the Breath display: the points', () => {
  const TIMES = ['in', 'hold', 'out', 'rest'] as const
  const merged = (values: Values, set: Values): Values => ({ ...values, ...set })

  it.each(SIZES)(
    'stands each point on what it sets, whole on the canvas, at $width by $height',
    (size) => {
      for (const values of [...SETTINGS, { mix: 0 }, { mix: 0.3, depth: 1 }]) {
        const { all, by, box } = handlesOf(values, size)
        const parts = partsOf(values)
        expect(all.map((handle) => handle.key)).toEqual(['depth', 'full', 'turn', 'empty'])
        const x = (seconds: number): number => box.x + (seconds / parts.total) * box.w
        const mix = valueOf(values, 'mix')
        const foot = yOf(breathLevel(0, valueOf(values, 'depth'), mix), box)
        expect(by('full').x).toBeCloseTo(x(parts.in), 9)
        expect(by('full').y).toBeCloseTo(box.y, 9)
        expect(by('turn').x).toBeCloseTo(x(parts.in + parts.hold), 9)
        expect(by('turn').y).toBeCloseTo(box.y, 9)
        expect(by('empty').x).toBeCloseTo(x(parts.in + parts.hold + parts.out), 9)
        expect(by('empty').y).toBeCloseTo(foot, 9)
        expect(by('depth').x).toBeCloseTo(box.x, 9)
        // On the floor of the line wherever Mix is a half or more; under that it keeps half the height to move in.
        if (mix >= 0.5) expect(by('depth').y).toBeCloseTo(foot, 9)
        else
          expect(by('depth').y).toBeCloseTo(
            box.y + 0.5 * (1 - breathFloor(valueOf(values, 'depth'))) * box.h,
            9,
          )
        for (const handle of all) {
          expect(handle.x - 5.25).toBeGreaterThanOrEqual(0)
          expect(handle.x + 5.25).toBeLessThanOrEqual(size.width)
          expect(handle.y - 5.25).toBeGreaterThanOrEqual(0)
          expect(handle.y + 5.25).toBeLessThanOrEqual(size.height)
        }
      }
    },
  )

  it('moves a corner to where the hand is, by giving one part the time of the next', () => {
    // In 3, Hold 0.5, Out 4.5, Rest 1: nine seconds across.
    const { by, box } = handlesOf({})
    const x = (seconds: number): number => box.x + (seconds / 9) * box.w
    const near = (got: Readonly<Record<string, number>>, want: Record<string, number>): void => {
      expect(Object.keys(got).sort()).toEqual(Object.keys(want).sort())
      for (const [name, value] of Object.entries(want)) expect(got[name]).toBeCloseTo(value, 9)
    }
    near(by('full').drag(x(2), 0, {}), { in: 2, hold: 1.5, out: 4.5 })
    near(by('full').drag(x(3.5), 0, {}), { in: 3.5, hold: 0, out: 4.5 })
    // Past the end of Hold it pushes on into Out.
    near(by('full').drag(x(5), 0, {}), { in: 5, hold: 0, out: 3 })
    near(by('full').drag(x(0), 0, {}), { in: 0.2, hold: 3.3, out: 4.5 })
    near(by('turn').drag(x(6), 0, {}), { in: 3, hold: 3, out: 2 })
    near(by('turn').drag(x(3), 0, {}), { in: 3, hold: 0, out: 5 })
    // Before the end of In it pushes back into In.
    near(by('turn').drag(x(1), 0, {}), { in: 1, hold: 0, out: 7 })
    near(by('turn').drag(x(9), 0, {}), { in: 3, hold: 4.8, out: 0.2 })
    near(by('empty').drag(x(8.5), 0, {}), { hold: 0.5, out: 5, rest: 0.5 })
    near(by('empty').drag(x(9), 0, {}), { hold: 0.5, out: 5.5, rest: 0 })
    near(by('empty').drag(x(5), 0, {}), { hold: 0.5, out: 1.5, rest: 4 })
    // Out is never under its least: from there the corner pushes back into Hold.
    near(by('empty').drag(x(3.4), 0, {}), { hold: 0.2, out: 0.2, rest: 5.6 })
    near(by('empty').drag(x(0), 0, {}), { hold: 0, out: 0.2, rest: 5.8 })
  })

  it('remembers the press: a corner pushed through a part gives it back on the way back', () => {
    let values: Values = {}
    const hold: DisplayHold = {}
    const press = handlesOf(values)
    const x = (seconds: number): number => press.box.x + (seconds / 9) * press.box.w
    // The plate asks for the points again at every move, with the hold of this hand.
    const move = (key: string, to: number): void => {
      const { by } = handlesOf(values)
      values = merged(values, by(key).drag(to, 0, hold))
    }
    move('full', x(3))
    expect(hold.total).toBeCloseTo(9, 12)
    for (const to of [3.4, 4.2, 6.5, 8.9, 9, 7, 5, 3.2]) move('full', x(to))
    expect(valueOf(values, 'in')).toBeCloseTo(3.2, 9)
    expect(valueOf(values, 'hold')).toBeCloseTo(0.3, 9)
    expect(valueOf(values, 'out')).toBeCloseTo(4.5, 9)
    move('full', x(3))
    expect(valueOf(values, 'in')).toBeCloseTo(3, 9)
    expect(valueOf(values, 'hold')).toBeCloseTo(0.5, 9)
    // Without the hold the same way there and back would have left Hold what the push made of it.
    let loose: Values = {}
    for (const to of [5, 3]) loose = merged(loose, handlesOf(loose).by('full').drag(x(to), 0))
    expect(valueOf(loose, 'hold')).toBeCloseTo(2, 9)
  })

  it.each(SIZES)('follows the hand as far as the lengths go, at $width by $height', (size) => {
    for (const values of [
      ...SETTINGS,
      { in: 20, hold: 20, out: 20, rest: 20 },
      { in: 0.2, hold: 0, out: 0.2, rest: 0 },
      { in: 15, hold: 0, out: 0.2, rest: 18 },
      { in: 0.2, hold: 19, out: 20, rest: 0 },
    ]) {
      const { box } = handlesOf(values, size)
      const total = partsOf(values).total
      for (const key of ['full', 'turn', 'empty']) {
        for (let step = -1; step <= 25; step++) {
          const to = box.x + (step / 24) * box.w
          const { by } = handlesOf(values, size)
          const set = by(key).drag(to, by(key).y, {})
          const after = merged(values, set)
          // Every length stays one the device can have, and the breath as long as it was.
          for (const name of TIMES) {
            expect(valueOf(after, name)).toBeGreaterThanOrEqual(specs[name].min - 1e-9)
            expect(valueOf(after, name)).toBeLessThanOrEqual(specs[name].max + 1e-9)
          }
          expect(partsOf(after).total).toBeCloseTo(total, 9)
          const landed = handlesOf(after, size).by(key).x
          const aimed = Math.min(box.x + box.w, Math.max(box.x, to))
          if (Math.abs(landed - aimed) < 1e-6) continue
          // Where it did not get there, it went towards the hand and stopped at the end of some length's range.
          const from = by(key).x
          expect(landed).toBeGreaterThanOrEqual(Math.min(from, aimed) - 1e-6)
          expect(landed).toBeLessThanOrEqual(Math.max(from, aimed) + 1e-6)
          const stopped = TIMES.some(
            (name) =>
              name in set &&
              (Math.abs(valueOf(after, name) - specs[name].min) < 1e-9 ||
                Math.abs(valueOf(after, name) - specs[name].max) < 1e-9),
          )
          expect(stopped, `${key} of ${JSON.stringify(values)} to ${step}/24`).toBe(true)
        }
      }
    }
  })

  it('sets Depth from the height of its point, through Mix', () => {
    for (const size of SIZES) {
      for (const mix of [1, 0.7, 0.5, 0.2, 0]) {
        const travel = Math.max(0.5, mix)
        for (let step = -1; step <= 21; step++) {
          const { by, box } = handlesOf({ mix }, size)
          const to = box.y + (step / 20) * box.h
          const { depth } = by('depth').drag(0, to, {})
          expect(depth).toBeGreaterThanOrEqual(0)
          expect(depth).toBeLessThanOrEqual(1)
          const fall = Math.min(1, Math.max(0, step / 20) / travel)
          expect(depth).toBeCloseTo(1 - Math.sqrt(1 - fall), 9)
          // The point is then under the hand, as far down as it goes.
          const landed = handlesOf({ mix, depth }, size).by('depth').y
          expect(landed).toBeCloseTo(box.y + Math.min(travel, Math.max(0, step / 20)) * box.h, 6)
        }
      }
    }
    const { by, box } = handlesOf({})
    expect(by('depth').drag(0, box.y, {}).depth).toBe(0)
    expect(by('depth').drag(0, box.y + box.h, {}).depth).toBe(1)
    expect(by('depth').drag(0, box.y + box.h / 2, {}).depth).toBeCloseTo(1 - Math.SQRT1_2, 9)
  })

  it('leaves everything as it is when a point is pressed and not moved, and resets to the start', () => {
    for (const values of SETTINGS) {
      const { all } = handlesOf(values)
      for (const handle of all) {
        const set = handle.drag(handle.x, handle.y, {})
        for (const [name, value] of Object.entries(set)) {
          expect(value).toBeCloseTo(valueOf(values, name), 9)
        }
      }
    }
    const { by } = handlesOf({ in: 7, hold: 3, out: 9, rest: 4, depth: 0.9 })
    expect(by('depth').reset?.()).toEqual({ depth: 0.55 })
    expect(by('full').reset?.()).toEqual({ in: 3, hold: 0.5, out: 9 })
    expect(by('turn').reset?.()).toEqual({ in: 7, hold: 0.5, out: 4.5 })
    expect(by('empty').reset?.()).toEqual({ hold: 3, out: 4.5, rest: 1 })
  })
})
