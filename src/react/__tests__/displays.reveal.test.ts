// The truth of Reveal's display: its bands and its readings against the
// device's own layout and packing, the dotted line against the device's
// formula for one quiet partial, each point against the parameter it sets,
// what is drawn while it runs against the readings, and the compiled device
// against what is drawn of it. Numbers named after a constant come from
// `cpp/devices/reveal/reveal.h`.

import { describe, expect, it } from 'vitest'

import { type ParamSpec } from '../../core/params'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS, xOfHz, yOfDb, type Box } from '../components/display-kit'
import {
  REVEAL_EXAMPLE_DB,
  REVEAL_EXAMPLE_UNDER_DB,
  REVEAL_FACES,
  REVEAL_FOOT_DB,
  REVEAL_MAX_BANDS,
  REVEAL_SILENT_DB,
  REVEAL_TOP_DB,
  revealAfterDb,
  revealBands,
  revealExampleDb,
  revealFocus,
  revealHeard,
  revealOver,
  revealReadings,
} from '../components/displays/reveal'
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
const BLOCK = 128

const { display } = REVEAL_FACES.reveal
const params: Readonly<Record<string, ParamSpec>> = stock.get('reveal')?.params ?? {}
const meterNames = Object.keys(stock.get('reveal')?.meters ?? {})
const size = displaySize(display)
const box: Box = { x: 4, y: 4, w: size.width - 8, h: size.height - 8 }
const level = (db: number): number => yOfDb(db, box, REVEAL_TOP_DB, REVEAL_FOOT_DB)
const view = (values: Record<string, number> = {}) => viewOf(display, params, { values })
const draw = (options: FrameOptions = {}): RecordingContext => drawDisplay(display, params, options)
const handles = (values: Record<string, number> = {}): readonly DisplayHandle[] =>
  display.handles?.(view(values)) ?? []
const handle = (key: string, values: Record<string, number> = {}): DisplayHandle => {
  const found = handles(values).find((point) => point.key === key)
  if (!found) throw new Error(`no handle ${key}`)
  return found
}

// kBandsPerReading, kReadings, kSteps, kLiftStepDb, kLevelStepDb, kLevelFootDb.
const PER_READING = 4
const READINGS = 22
const STEPS = 64
const LIFT_STEP_DB = 0.5
const LEVEL_STEP_DB = 1.5
const LEVEL_FOOT_DB = -94.5

/**
 * The device's readings for bands at given lifts and levels (dB), packed as
 * the end of `compare` packs them: four bands to a reading, six bits each,
 * the lowest band in the lowest bits; `lift` is the largest lift and `hold`
 * the level hold. A band not named has no lift and nothing in it.
 */
function readings(
  bands: Record<number, { lift?: number; level: number }>,
  hold = 0,
): Record<string, number> {
  const meters: Record<string, number> = { lift: 0, hold }
  for (let r = 0; r < READINGS; r++) {
    let lifts = 0
    let levels = 0
    for (let b = r * PER_READING + PER_READING - 1; b >= r * PER_READING; b--) {
      const band = bands[b]
      const liftSteps = band
        ? Math.min(STEPS - 1, Math.floor((band.lift ?? 0) / LIFT_STEP_DB + 0.5))
        : 0
      const levelSteps = band
        ? Math.min(
            STEPS - 1,
            Math.max(0, Math.floor((band.level - LEVEL_FOOT_DB) / LEVEL_STEP_DB + 0.5)),
          )
        : 0
      lifts = lifts * STEPS + liftSteps
      levels = levels * STEPS + levelSteps
      if (band) meters.lift = Math.max(meters.lift, band.lift ?? 0)
    }
    meters[`lift${r + 1}`] = Math.fround(lifts)
    meters[`level${r + 1}`] = Math.fround(levels)
  }
  return meters
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
  colour: string
  alpha: number
}

/** Every rectangle filled, with the colour and strength it was filled in. */
function rects(drawn: RecordingContext): Rect[] {
  const found: Rect[] = []
  const pen: Record<string, unknown> = { globalAlpha: 1 }
  for (const call of drawn.calls) {
    if (call.name.startsWith('set ')) pen[call.name.slice(4)] = call.args[0]
    else if (call.name === 'fillRect') {
      const [x, y, w, h] = call.args as number[]
      found.push({ x, y, w, h, colour: String(pen.fillStyle), alpha: pen.globalAlpha as number })
    }
  }
  return found
}

/** What was lifted, as drawn: the rectangles in the second colour. */
const lifted = (drawn: RecordingContext): Rect[] =>
  rects(drawn).filter((rect) => rect.colour === PLAIN_COLOURS.accent)

interface Line {
  points: [number, number][]
  width: number
  alpha: number
  dash: number[]
}

/** Every line stroked, with the pen it was drawn with. */
function lines(drawn: RecordingContext): Line[] {
  const found: Line[] = []
  let points: [number, number][] = []
  let dash: number[] = []
  const pen: Record<string, unknown> = { lineWidth: 1, globalAlpha: 1 }
  for (const call of drawn.calls) {
    if (call.name.startsWith('set ')) pen[call.name.slice(4)] = call.args[0]
    else if (call.name === 'beginPath') points = []
    else if (call.name === 'moveTo' || call.name === 'lineTo')
      points.push([call.args[0] as number, call.args[1] as number])
    else if (call.name === 'setLineDash') dash = [...(call.args[0] as number[])]
    else if (call.name === 'stroke')
      found.push({ points, width: pen.lineWidth as number, alpha: pen.globalAlpha as number, dash })
  }
  return found
}

/** The dotted line: one quiet partial as the settings have it come out. */
function dotted(drawn: RecordingContext): [number, number][] {
  const found = lines(drawn).filter((line) => line.dash.length === 2 && line.points.length > 8)
  expect(found.length, 'one dotted line').toBe(1)
  return found[0].points
}

/** The line of the sound going in: the long line at full strength, two points to a band. */
function going(drawn: RecordingContext): [number, number][] {
  const found = lines(drawn).filter(
    (line) => line.dash.length === 0 && line.alpha === 1 && line.points.length > 100,
  )
  expect(found.length, 'one line going in').toBe(1)
  return found[0].points
}

/** The frequency under a place across the display, on the kit's scale. */
const hzAt = (x: number): number => 20 * Math.pow(1000, (x - box.x) / box.w)

describe("Reveal's bands and readings", () => {
  it('lays the bands out as the device does', () => {
    const bands = revealBands(RATE)
    // The harness of the device prints these: 85 bands at 48 kHz, from 46.9 Hz to 19933.6 Hz.
    expect(bands.count).toBe(85)
    expect(bands.hz[0]).toBeCloseTo(46.875, 3)
    expect(bands.hz[84]).toBeCloseTo(19933.6, 0)
    // And these at the other rates it is laid out for.
    const counts: [number, number][] = [
      [22050, 84],
      [32000, 85],
      [44100, 86],
      [88200, 75],
      [96000, 74],
      [192000, 62],
    ]
    for (const [rate, count] of counts) expect(revealBands(rate).count, `${rate}`).toBe(count)
    // A band is its bins: single bins of 23.4 Hz at the foot, a twelfth of an octave above.
    expect(bands.edge[0]).toBeCloseTo(1.5 * (RATE / 2048), 3)
    expect(bands.edge[1] - bands.edge[0]).toBeCloseTo(RATE / 2048, 3)
    for (let b = 0; b < bands.count; b++) {
      expect(bands.edge[b + 1]).toBeGreaterThan(bands.edge[b])
      expect(bands.hz[b]).toBeCloseTo(0.5 * (bands.edge[b] + bands.edge[b + 1]), 1)
    }
    expect(Math.log2(bands.edge[81] / bands.edge[80])).toBeCloseTo(1 / 12, 2)
    expect(bands.count).toBeLessThanOrEqual(REVEAL_MAX_BANDS)
  })

  it('reads every band out of the packed readings', () => {
    const lifts = new Float32Array(REVEAL_MAX_BANDS)
    const levels = new Float32Array(REVEAL_MAX_BANDS)
    const meters = readings({
      0: { lift: 0.5, level: -93 },
      3: { lift: 30, level: -30 },
      4: { level: 0 },
      41: { lift: 12.5, level: -61.5 },
      87: { lift: 31.5, level: -45 },
    })
    revealReadings((name) => meters[name], lifts, levels)
    expect([lifts[0], lifts[3], lifts[4], lifts[41], lifts[87]]).toEqual([0.5, 30, 0, 12.5, 31.5])
    expect([levels[0], levels[3], levels[4], levels[41], levels[87]]).toEqual([
      -93, -30, 0, -61.5, -45,
    ])
    // A band with nothing in it stands under the foot of the scale.
    expect(levels[1]).toBe(REVEAL_SILENT_DB)
    expect(REVEAL_SILENT_DB).toBeLessThan(REVEAL_FOOT_DB)
    expect(lifts[1]).toBe(0)
    // A reading that is not a number, or under nothing, is no lift and no sound.
    revealReadings(() => Number.NaN, lifts, levels)
    expect(Math.max(...lifts)).toBe(0)
    expect(Math.max(...levels)).toBe(REVEAL_SILENT_DB)
  })
})

// kKneeDb, kFocusFromHz, kFocusToHz, and the example the display draws.
const KNEE_DB = 6
const FOCUS_FROM_HZ = 60
const FOCUS_TO_HZ = 12000

/** Where the device's formula puts a partial at -60 dB that lies 30 dB under the loud around it, in dB. */
function exampleDb(values: Record<string, number>, hz: number): number {
  const at = (name: string): number => values[name] ?? params[name].default
  const place = Math.min(
    1,
    Math.max(0, Math.log2(hz / FOCUS_FROM_HZ) / Math.log2(FOCUS_TO_HZ / FOCUS_FROM_HZ)),
  )
  const weight = at('focus') >= 0 ? 1 - at('focus') * (1 - place) : 1 + at('focus') * place
  const over = Math.min(1, Math.max(0, (-60 - at('floor')) / KNEE_DB))
  const lift = Math.min(at('amount') * 30, at('range')) * weight * over
  const listen = at('listen') >= 0.5 ? 1 : 0
  const dry = (1 - at('mix')) * (1 - listen)
  const wet = (at('mix') + listen * (1 - at('mix'))) * 10 ** (at('output') / 20)
  const gain = Math.abs(dry + wet * (10 ** (lift / 20) - listen))
  return gain > 1e-6 ? -60 + 20 * Math.log10(gain) : -180
}

describe("Reveal's formula", () => {
  it('weighs the lift by Focus as the device does', () => {
    // The harness measured, for a quiet sine at 125 Hz and at 8 kHz, about
    // 0.87 and 0.07 of the lift at Focus -1 and 0.13 and 0.93 at +1.
    expect(revealFocus(0, 125)).toBe(1)
    expect(revealFocus(0, 8000)).toBe(1)
    expect(revealFocus(-1, 125)).toBeCloseTo(1 - 0.1385, 3)
    expect(revealFocus(-1, 8000)).toBeCloseTo(1 - 0.9235, 3)
    expect(revealFocus(1, 125)).toBeCloseTo(0.1385, 3)
    expect(revealFocus(1, 8000)).toBeCloseTo(0.9235, 3)
    expect(revealFocus(0.5, 125)).toBeCloseTo(1 - 0.5 * (1 - 0.1385), 3)
    // Past its two ends it does not go on.
    expect(revealFocus(1, 30)).toBe(0)
    expect(revealFocus(1, 16000)).toBe(1)
    expect(revealFocus(-1, 30)).toBe(1)
    expect(revealFocus(-1, 16000)).toBe(0)
  })

  it('fades the lift in over the 6 dB above Floor', () => {
    expect(revealOver(-70, -66)).toBe(0)
    expect(revealOver(-66, -66)).toBe(0)
    expect(revealOver(-63, -66)).toBeCloseTo(0.5, 9)
    expect(revealOver(-60, -66)).toBe(1)
    expect(revealOver(-20, -66)).toBe(1)
  })

  it('says what a band comes out at through Mix, Output, Listen and the level hold', () => {
    const lift = 10 ** (12 / 20)
    expect(revealHeard(view(), 12, 0)).toBeCloseTo(lift, 9)
    expect(revealHeard(view(), 12, -3)).toBeCloseTo(lift * 10 ** (-3 / 20), 9)
    expect(revealHeard(view({ mix: 0 }), 12, -3)).toBe(1)
    expect(revealHeard(view({ mix: 0.5 }), 12, 0)).toBeCloseTo(0.5 + 0.5 * lift, 9)
    expect(revealHeard(view({ output: -6 }), 12, 0)).toBeCloseTo(lift * 10 ** (-6 / 20), 9)
    // Output trims what was lifted, not the sound as it came.
    expect(revealHeard(view({ mix: 0.25, output: 6 }), 12, 0)).toBeCloseTo(
      0.75 + 0.25 * 10 ** (6 / 20) * lift,
      9,
    )
    // Listen is only what was added, whatever Mix is.
    for (const mix of [0, 0.5, 1]) {
      expect(revealHeard(view({ listen: 1, mix }), 12, 0)).toBeCloseTo(lift - 1, 9)
      expect(revealHeard(view({ listen: 1, mix }), 0, 0)).toBe(0)
    }
    // In dB on a band: silence stays silence, and a band is never drawn over the foot's silence.
    expect(revealAfterDb(view(), REVEAL_SILENT_DB, 12, 0)).toBe(REVEAL_SILENT_DB)
    expect(revealAfterDb(view(), -50, 12, -2)).toBeCloseTo(-40, 9)
    expect(revealAfterDb(view({ listen: 1 }), -50, 0, 0)).toBe(REVEAL_SILENT_DB)
  })

  it('draws one quiet partial where the formula brings it out, across the spectrum', () => {
    expect(REVEAL_EXAMPLE_DB).toBe(-60)
    expect(REVEAL_EXAMPLE_UNDER_DB).toBe(30)
    const settings: Record<string, number>[] = [
      {},
      { amount: 1, range: 30 },
      { amount: 1, range: 12 },
      { amount: 0.2, range: 30 },
      { amount: 0 },
      { focus: 1, amount: 1, range: 24 },
      { focus: -1 },
      { focus: -0.4, amount: 0.8, range: 20 },
      { floor: -63 },
      { floor: -57 },
      { floor: -36 },
      { mix: 0.5 },
      { mix: 0 },
      { output: -6 },
      { output: 12, mix: 0.3 },
      { listen: 1 },
      { listen: 1, mix: 0.2, amount: 1, range: 30 },
    ]
    for (const values of settings) {
      const line = dotted(draw({ values }))
      // From the lowest band to the top of the display.
      expect(line[0][0]).toBeCloseTo(xOfHz(revealBands(RATE).edge[0], box), 6)
      expect(line[line.length - 1][0]).toBeCloseTo(box.x + box.w, 6)
      for (const [x, y] of line) {
        expect(y, JSON.stringify(values)).toBeCloseTo(level(exampleDb(values, hzAt(x))), 6)
        expect(revealExampleDb(view(values), hzAt(x))).toBeCloseTo(
          Math.max(-180, exampleDb(values, hzAt(x))),
          6,
        )
      }
    }
    // By hand: half of 30 dB at the defaults, the cap at Range, nothing under Floor, half way through the knee.
    for (const [, y] of dotted(draw())) expect(y).toBeCloseTo(level(-45), 9)
    for (const [, y] of dotted(draw({ values: { amount: 1, range: 12 } })))
      expect(y).toBeCloseTo(level(-48), 9)
    for (const [, y] of dotted(draw({ values: { floor: -50 } })))
      expect(y).toBeCloseTo(level(-60), 9)
    for (const [, y] of dotted(draw({ values: { floor: -63 } })))
      expect(y).toBeCloseTo(level(-52.5), 9)
    for (const [, y] of dotted(draw({ values: { mix: 0 } }))) expect(y).toBeCloseTo(level(-60), 9)
    // Focus to the right: nothing at 60 Hz and under, all of it from 12 kHz.
    const tilted = dotted(draw({ values: { focus: 1 } }))
    expect(tilted[0][1]).toBeCloseTo(level(-60), 9)
    expect(tilted[tilted.length - 1][1]).toBeCloseTo(level(-45), 9)
    for (let i = 1; i < tilted.length; i++)
      expect(tilted[i][1]).toBeLessThanOrEqual(tilted[i - 1][1])
  })
})

describe("Reveal's points", () => {
  it('has a point for Range, for Amount and for Floor, each where its setting lies', () => {
    const points = handles()
    expect(points.map((point) => point.key)).toEqual(['range', 'amount', 'floor'])
    expect(points.map((point) => point.name)).toEqual(['Range', 'Amount', 'Floor'])
    const [range, amount, floor] = points
    // Range and Amount on the scale of the example: -60 dB and what each allows over it.
    expect([range.x, range.y]).toEqual([box.x + 0.2 * box.w, level(-60 + 15)])
    expect([amount.x, amount.y]).toEqual([box.x + 0.5 * box.w, level(-60 + 0.5 * 30)])
    // Floor at the end of its line, at its level.
    expect([floor.x, floor.y]).toEqual([box.x + box.w - 8, level(-66)])

    // Up and down sets each; across sets nothing.
    expect(Object.keys(amount.drag(3, level(-37.5)))).toEqual(['amount'])
    expect(amount.drag(3, level(-37.5)).amount).toBeCloseTo(0.75, 9)
    expect(amount.drag(160, level(-54)).amount).toBeCloseTo(0.2, 9)
    expect(amount.drag(amount.x, amount.y).amount).toBeCloseTo(0.5, 9)
    expect(amount.drag(amount.x, -40)).toEqual({ amount: 1 })
    expect(amount.drag(amount.x, 400)).toEqual({ amount: 0 })
    expect(amount.reset?.()).toEqual({ amount: 0.5 })

    expect(Object.keys(range.drag(90, level(-40)))).toEqual(['range'])
    expect(range.drag(90, level(-40)).range).toBeCloseTo(20, 9)
    expect(range.drag(range.x, range.y).range).toBeCloseTo(15, 9)
    expect(range.drag(range.x, -40)).toEqual({ range: 30 })
    expect(range.drag(range.x, 400)).toEqual({ range: 0 })
    expect(range.reset?.()).toEqual({ range: 15 })

    expect(Object.keys(floor.drag(2, level(-80)))).toEqual(['floor'])
    expect(floor.drag(2, level(-80)).floor).toBeCloseTo(-80, 9)
    expect(floor.drag(floor.x, floor.y).floor).toBeCloseTo(-66, 9)
    expect(floor.drag(floor.x, -40)).toEqual({ floor: -36 })
    expect(floor.drag(floor.x, 400)).toEqual({ floor: -96 })
    expect(floor.reset?.()).toEqual({ floor: -66 })
    for (const point of points) expect(point.wheel).toBeUndefined()
  })

  it('follows its setting, and one drag is one value', () => {
    for (const amount of [0, 0.25, 0.6, 1]) {
      const point = handle('amount', { amount })
      expect(point.y).toBeCloseTo(level(-60 + 30 * amount), 9)
      expect(point.drag(point.x, point.y).amount).toBeCloseTo(amount, 9)
    }
    for (const range of [0, 6, 22.5, 30]) {
      const point = handle('range', { range })
      expect(point.y).toBeCloseTo(level(-60 + range), 9)
      expect(point.drag(point.x, point.y).range).toBeCloseTo(range, 9)
    }
    for (const floor of [-96, -80, -36]) {
      const point = handle('floor', { floor })
      expect(point.y).toBeCloseTo(level(floor), 9)
      expect(point.drag(point.x, point.y).floor).toBeCloseTo(floor, 9)
    }
    // No other setting moves a point: where it stands is its own setting alone.
    const moved = { focus: 1, mix: 0.2, output: -12, listen: 1, detail: 0, rise: 4000 }
    for (const key of ['range', 'amount', 'floor'])
      expect([handle(key, moved).x, handle(key, moved).y]).toEqual([handle(key).x, handle(key).y])
  })

  it('keeps every point whole, clear of the words and of the others at every preset', () => {
    // At the ends of their travel: 5 px to the rim of a point in hand.
    const head = box.y + 12
    const foot = box.y + box.h
    expect(handle('amount', { amount: 1 }).y - 5).toBeGreaterThan(head)
    expect(handle('range', { range: 30 }).y - 5).toBeGreaterThan(head)
    expect(handle('floor', { floor: -36 }).y - 5).toBeGreaterThan(head)
    expect(handle('floor', { floor: -96 }).y + 5).toBeLessThan(foot)
    expect(handle('floor').x + 5).toBeLessThan(box.x + box.w)
    const presets = stock.get('reveal')?.presets ?? {}
    expect(Object.keys(presets).length).toBe(16)
    for (const [name, preset] of Object.entries(presets)) {
      const values: Record<string, number> = {}
      for (const [param, value] of Object.entries(preset))
        if (value !== undefined) values[param] = value
      const points = handles(values)
      for (const a of points)
        for (const b of points)
          if (a.key < b.key)
            expect(
              Math.hypot(a.x - b.x, a.y - b.y),
              `${name}: ${a.key} and ${b.key}`,
            ).toBeGreaterThan(12)
    }
  })

  it('ties a point that stands off the dotted line to it', () => {
    /** The upright lines one pixel wide that are not the scale's: from a point to the dotted line. */
    const ties = (values: Record<string, number>): [number, number, number][] =>
      lines(draw({ values }))
        .filter(
          (line) =>
            line.points.length === 2 &&
            line.points[0][0] === line.points[1][0] &&
            Math.abs(line.points[1][1] - line.points[0][1]) < box.h - 1,
        )
        .map((line) => [line.points[0][0], line.points[0][1], line.points[1][1]])
    // At the defaults both points are on the line.
    expect(ties({})).toEqual([])
    // Range above what Amount asks for: its point stands over the line, tied down to it.
    const range = handle('range', { range: 30 })
    expect(ties({ range: 30 })).toEqual([[Math.floor(range.x) + 0.5, range.y, level(-45)]])
    // Amount asking for more than Range allows: its point over the line.
    const amount = handle('amount', { amount: 1 })
    expect(ties({ amount: 1 })).toEqual([[Math.floor(amount.x) + 0.5, amount.y, level(-45)]])
    // Mix down brings the line under both.
    expect(ties({ mix: 0 }).length).toBe(2)
  })

  it('says the most that is lifted, what the point in hand is at, and Listen', () => {
    const said = (options: FrameOptions): [string, number, number][] =>
      draw(options)
        .calls.filter((call) => call.name === 'fillText')
        .map((call) => call.args as [string, number, number])
    const number: [string, number, number] = ['0.0 dB', box.x + box.w - 2, box.y + 9]
    const head = box.y + 8
    expect(said({})).toEqual([number])
    expect(said({ hot: 'amount' })).toEqual([number, ['Amount  50 %', box.x + 2, head]])
    expect(said({ hot: 'amount', values: { amount: 0.333 } })).toEqual([
      number,
      ['Amount  33 %', box.x + 2, head],
    ])
    expect(said({ hot: 'range' })).toEqual([number, ['Range  +15.0 dB', box.x + 2, head]])
    expect(said({ hot: 'floor', values: { floor: -72.5 } })).toEqual([
      number,
      ['Floor  −72.5 dB', box.x + 2, head],
    ])
    expect(said({ values: { listen: 1 } })).toEqual([number, ['Listen', box.x + 2, head]])
    // Every word stands on a patch of the plate: the sound runs under them.
    const drawn = draw({ hot: 'floor', values: { listen: 1 } })
    for (const words of drawn.words())
      expect(patchUnder(drawn, words, PLAIN_COLOURS.plate), words).not.toBeNull()
  })
})

describe("Reveal's display while it runs", () => {
  const bands = revealBands(RATE)
  const left = (band: number): number => xOfHz(bands.edge[band], box)
  const right = (band: number): number => xOfHz(bands.edge[band + 1], box)
  const sound = { 20: { level: -30 }, 40: { lift: 12, level: -61.5 }, 60: { lift: 30, level: -81 } }
  const running = (values: Record<string, number> = {}, hold = -2): RecordingContext =>
    draw({ values, meters: readings(sound, hold), signal: testSignal() })
  /** The long lines without dashes: the sound going in at full strength, and under it what comes out lower. */
  const long = (drawn: RecordingContext): Line[] =>
    lines(drawn).filter((line) => line.dash.length === 0 && line.points.length > 100)

  it('draws the sound going in band by band, as wide as the bands are', () => {
    const line = going(running())
    expect(line.length).toBe(2 * bands.count)
    for (const [band, db] of [
      [20, -30],
      [40, -61.5],
      [60, -81],
      [0, REVEAL_SILENT_DB],
      [84, REVEAL_SILENT_DB],
    ]) {
      expect(line[2 * band]).toEqual([left(band), level(db)])
      expect(line[2 * band + 1]).toEqual([right(band), level(db)])
    }
    // The bands lie side by side from the lowest to the top of the scale.
    for (let b = 1; b < bands.count; b++) expect(left(b)).toBeCloseTo(right(b - 1), 9)
    expect(right(84)).toBeCloseTo(box.x + box.w, 1)
  })

  it('fills what was lifted in the second colour, from where a band went in to where it comes out', () => {
    const filled = lifted(running())
    expect(filled.length).toBe(2)
    // Lift and level hold together: 12 - 2 dB over -61.5, and 30 - 2 over -81.
    for (const [i, band, went, comes] of [
      [0, 40, -61.5, -51.5],
      [1, 60, -81, -53],
    ]) {
      expect(filled[i].x).toBeCloseTo(left(band), 9)
      expect(filled[i].w).toBeCloseTo(right(band) - left(band), 9)
      expect(filled[i].y).toBeCloseTo(level(comes), 6)
      expect(filled[i].h).toBeCloseTo(level(went) - level(comes), 6)
      expect(filled[i].alpha).toBe(1)
    }
    // A band that is not lifted comes out lower by the level hold: a line of its own, under the one going in.
    const [, lower] = [going(running()), long(running()).find((line) => line.alpha < 1)]
    expect(lower?.points[2 * 20][0]).toBe(left(20))
    expect(lower?.points[2 * 20][1]).toBeCloseTo(level(-32), 9)
    expect(lower?.points[2 * 40]).toEqual([left(40), level(-61.5)])
    // The number is the band lifted most, as it is heard.
    expect(running().words()).toEqual(['+28.0 dB'])
    expect(running({}, 0).words()).toEqual(['+30.0 dB'])
  })

  it('draws only what Mix, Output and Listen let be heard, and still reads the device', () => {
    // Mix down: nothing is lifted in what is heard, and the sound going in is still drawn.
    const dry = running({ mix: 0 })
    expect(lifted(dry)).toEqual([])
    expect(going(dry)[2 * 40]).toEqual([left(40), level(-61.5)])
    expect(dry.words()).toEqual(['0.0 dB'])
    // Half way: the sound as it came and the lifted one, added.
    const half = lifted(running({ mix: 0.5 }, 0))
    const comes = -61.5 + 20 * Math.log10(0.5 + 0.5 * 10 ** (12 / 20))
    expect(half[0].y).toBeCloseTo(level(comes), 6)
    expect(half[0].h).toBeCloseTo(level(-61.5) - level(comes), 6)
    // Output trims what was lifted.
    const trimmed = lifted(running({ output: -6 }, 0))
    expect(trimmed[0].y).toBeCloseTo(level(-61.5 + 12 - 6), 6)
    expect(running({ output: -6 }, 0).words()).toEqual(['+24.0 dB'])
    // Listen: only what was added; a band that is not lifted is not heard at all.
    const added = running({ listen: 1 }, 0)
    const heard = -81 + 20 * Math.log10(10 ** (30 / 20) - 1)
    expect(lifted(added).length).toBe(2)
    expect(lifted(added)[1].y).toBeCloseTo(level(heard), 6)
    const lower = long(added).find((line) => line.alpha < 1)
    expect(lower?.points[2 * 20][1]).toBe(level(REVEAL_SILENT_DB))
    expect(added.words()).toEqual([`+${(heard + 81).toFixed(1)} dB`, 'Listen'])
  })

  it('stands empty while it does not run, and eases from one reading to the next', () => {
    const meters = readings(sound, -2)
    for (const still of [
      draw({ meters }),
      runDisplay(display, params, 1, { meters, signal: testSignal(), powered: false }),
      runDisplay(display, params, 1, { meters }),
    ]) {
      expect(long(still)).toEqual([])
      expect(lifted(still)).toEqual([])
      expect(still.words()).toEqual(['0.0 dB'])
    }
    // The first readings of a run are taken as they are; later ones are eased to.
    const next = readings({ 40: { lift: 20, level: -70.5 } }, 0)
    const at = (seconds: number): Rect[] =>
      lifted(
        runDisplay(display, params, seconds, { meters, signal: testSignal() }, (time) =>
          time > 0.01 ? { meters: next } : {},
        ),
      )
    const early = at(0.07).find((rect) => Math.abs(rect.x - left(40)) < 1e-6)
    // A frame after the change it is at neither: 20 dB of lift is 17 px high.
    expect(Math.abs((early?.h ?? 0) - (level(-70.5) - level(-50.5)))).toBeGreaterThan(1)
    expect(Math.abs((early?.h ?? 0) - (level(-61.5) - level(-51.5)))).toBeGreaterThan(1)
    const late = at(2)
    expect(late.length).toBe(1)
    expect(late[0].y).toBeCloseTo(level(-50.5), 2)
    expect(late[0].h).toBeCloseTo(level(-70.5) - level(-50.5), 2)
  })

  it('lays the plate back over what is under Floor, up to a line with the point at its end', () => {
    for (const floor of [-96, -66, -40]) {
      const drawn = draw({ values: { floor } })
      const veil = rects(drawn).filter(
        (rect) => rect.colour === PLAIN_COLOURS.plate && rect.w === box.w && rect.alpha < 0.6,
      )
      expect(veil.length).toBe(1)
      expect(veil[0].y).toBeCloseTo(level(floor), 9)
      expect(veil[0].y + veil[0].h).toBeCloseTo(box.y + box.h, 9)
      const across = lines(drawn).filter(
        (line) =>
          line.points.length === 2 &&
          line.points[0][0] === box.x &&
          line.points[1][0] === box.x + box.w &&
          line.alpha > 0.4,
      )
      expect(across.map((line) => line.points[0][1])).toContain(Math.floor(level(floor)) + 0.5)
      expect(handle('floor', { floor }).y).toBeCloseTo(level(floor), 9)
    }
  })
})

describe('the compiled Reveal against its display', () => {
  /**
   * Three seconds through the device of a sine at 1 kHz, 12 dB under full
   * scale, with a sine at 5 kHz 40 dB under it: the readings as they stand at
   * the end, and what the device did to each sine over the last second, in dB.
   */
  async function revealed(
    values: Record<string, number>,
  ): Promise<{ meters: Record<string, number>; loud: number; quiet: number }> {
    const device = await loadWasmDevice('reveal', RATE)
    for (const [name, value] of Object.entries(values)) device.set(params[name], value)
    const block = new Float32Array(BLOCK)
    const tones = [
      { step: (2 * Math.PI * 1000) / RATE, gain: 0.25, inSin: 0, inCos: 0, outSin: 0, outCos: 0 },
      { step: (2 * Math.PI * 5000) / RATE, gain: 0.0025, inSin: 0, inCos: 0, outSin: 0, outCos: 0 },
    ]
    for (let done = 0; done + BLOCK <= RATE * 3; done += BLOCK) {
      for (let i = 0; i < BLOCK; i++) {
        block[i] = 0
        for (const tone of tones) block[i] += tone.gain * Math.sin(tone.step * (done + i))
      }
      device.processBlock(block)
      if (done < RATE * 2) continue
      const out = device.view(device.device.device_out_left(), BLOCK)
      // Each sine by its two quadratures: the device's delay turns it and leaves its size.
      for (let i = 0; i < BLOCK; i++) {
        for (const tone of tones) {
          const sin = Math.sin(tone.step * (done + i))
          const cos = Math.cos(tone.step * (done + i))
          tone.inSin += block[i] * sin
          tone.inCos += block[i] * cos
          tone.outSin += out[i] * sin
          tone.outCos += out[i] * cos
        }
      }
    }
    const meters: Record<string, number> = {}
    meterNames.forEach(
      (name, index) => (meters[name] = device.device.device_meter?.(index) ?? Number.NaN),
    )
    const [loud, quiet] = tones.map(
      (tone) =>
        20 * Math.log10(Math.hypot(tone.outSin, tone.outCos) / Math.hypot(tone.inSin, tone.inCos)),
    )
    return { meters, loud, quiet }
  }

  const bands = revealBands(RATE)
  /** The band a frequency lies in. */
  const bandOf = (hz: number): number => {
    for (let b = 0; b < bands.count; b++) if (hz < bands.edge[b + 1]) return b
    return bands.count - 1
  }

  it('declares the readings the display asks for', () => {
    expect(meterNames.slice(0, 2)).toEqual(['lift', 'hold'])
    expect(meterNames.length).toBe(2 + 2 * READINGS)
    for (let r = 0; r < READINGS; r++) {
      expect(meterNames[2 + r]).toBe(`lift${r + 1}`)
      expect(meterNames[2 + READINGS + r]).toBe(`level${r + 1}`)
    }
  })

  it('draws the two sines where the device heard them, and the quiet one lifted by what was measured', async () => {
    for (const values of [
      {},
      { amount: 1, range: 30 },
      { amount: 1, range: 30, mix: 0.5 },
    ] as Record<string, number>[]) {
      const { meters, loud, quiet } = await revealed(values)
      const drawn = draw({ values, meters, signal: testSignal() })
      const line = going(drawn)
      // The levels: a sine on both sides 12 dB under full scale reads -12, the other 40 dB under it, to the 1.5 dB step.
      expect(line[2 * bandOf(1000)][1]).toBeGreaterThan(level(-12 + 0.8))
      expect(line[2 * bandOf(1000)][1]).toBeLessThan(level(-12 - 0.8))
      expect(line[2 * bandOf(5000)][1]).toBeGreaterThan(level(-52 + 0.8))
      expect(line[2 * bandOf(5000)][1]).toBeLessThan(level(-52 - 0.8))
      // One band is lifted, the quiet sine's, and as far as the sine came out louder.
      const filled = lifted(drawn)
      expect(filled.length, JSON.stringify(values)).toBe(1)
      expect(filled[0].x).toBeCloseTo(xOfHz(bands.edge[bandOf(5000)], box), 9)
      const drawnDb = (filled[0].h * (REVEAL_TOP_DB - REVEAL_FOOT_DB)) / box.h
      expect(
        Math.abs(drawnDb - quiet),
        `${JSON.stringify(values)}: ${drawnDb} drawn, ${quiet} measured`,
      ).toBeLessThan(0.4)
      expect(quiet).toBeGreaterThan(8)
      // The loud one comes out as it went in, to the level hold.
      expect(Math.abs(loud)).toBeLessThan(0.5)
      // And the number says it.
      const said = Number(drawn.words()[0].replace(' dB', '').replace('+', ''))
      expect(Math.abs(said - quiet)).toBeLessThan(0.45)
    }
  })

  it('reading the device changes nothing it puts out', async () => {
    const values: Record<string, number> = {
      amount: 1,
      range: 30,
      floor: -90,
      rise: 50,
      detail: 0.3,
    }
    const read = await loadWasmDevice('reveal', RATE)
    const unread = await loadWasmDevice('reveal', RATE)
    for (const device of [read, unread])
      for (const [name, value] of Object.entries(values)) device.set(params[name], value)
    let seed = 1
    const noise = (): number => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed / 2147483648 - 1
    }
    const block = new Float32Array(BLOCK)
    let different = 0
    let peak = 0
    for (let done = 0; done < RATE * 1.5; done += BLOCK) {
      // Sound, a silence, and sound again.
      const silent = done > RATE * 0.5 && done < RATE
      for (let i = 0; i < BLOCK; i++)
        block[i] = silent
          ? 0
          : 0.01 * noise() + 0.2 * Math.sin((2 * Math.PI * 404 * (done + i)) / RATE)
      read.processBlock(block)
      unread.processBlock(block)
      for (let twice = 0; twice < 2; twice++)
        for (let index = 0; index < meterNames.length; index++) read.device.device_meter?.(index)
      const a = read.view(read.device.device_out_left(), BLOCK)
      const b = unread.view(unread.device.device_out_left(), BLOCK)
      for (let i = 0; i < BLOCK; i++) {
        if (a[i] !== b[i]) different += 1
        peak = Math.max(peak, Math.abs(a[i]))
      }
    }
    expect(peak).toBeGreaterThan(0.1)
    expect(different).toBe(0)
  })
})
