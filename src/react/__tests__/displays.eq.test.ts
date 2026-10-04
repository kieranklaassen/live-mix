// The truth of the EQ and filter displays: each curve against numbers worked
// out from the filter it stands for, what the handles set, what the two
// compiled devices' readings put on the display, and the compiled devices
// themselves against what is drawn of them.

import { describe, expect, it } from 'vitest'

import { type ParamSpec } from '../../core/params'
import { loadWasmDevice } from '../../dsp/__tests__/wasm-device-harness'
import { PLAIN_COLOURS, biquad, biquadDb, xOfHz, yOfDb, type Box } from '../components/display-kit'
import {
  AMBIENT_DB,
  AUTO_FOOT_DB,
  AUTO_TOP_DB,
  CLEAR_BANDS,
  EQ3_DB,
  EQ_FACES,
  FILTER_DB,
  autoFilterDb,
  autoFilterSweep,
  biquadTurns,
  clearCuts,
  seriesDb,
  svfDb,
} from '../components/displays/eq'
import { type DisplayHandle } from '../components/plate-display'
import {
  displaySize,
  drawDisplay,
  runDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type FrameOptions,
  type RecordingContext,
} from './display-harness'

const stock = stockDescriptors()
const RATE = 48000

function face(id: string) {
  const { display } = EQ_FACES[id]
  const params: Readonly<Record<string, ParamSpec>> = stock.get(id)?.params ?? {}
  const size = displaySize(display)
  const box: Box = { x: 4, y: 4, w: size.width - 8, h: size.height - 8 }
  const handles = (values: Record<string, number> = {}): readonly DisplayHandle[] =>
    display.handles?.(viewOf(display, params, { values })) ?? []
  return {
    display,
    params,
    box,
    draw: (options: FrameOptions = {}) => drawDisplay(display, params, options),
    run: (seconds: number, options: FrameOptions = {}) =>
      runDisplay(display, params, seconds, options),
    handles,
    handle: (key: string, values: Record<string, number> = {}): DisplayHandle => {
      const found = handles(values).find((point) => point.key === key)
      if (!found) throw new Error(`no handle ${key}`)
      return found
    },
  }
}

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

/** The curve a display draws: the one long line in the ink at full strength. */
function mainCurve(drawn: RecordingContext): [number, number][] {
  const curves = shapes(drawn).filter(
    (shape) =>
      shape.op === 'stroke' &&
      shape.width === 1.5 &&
      shape.dash.length === 0 &&
      shape.points.length > 10,
  )
  expect(curves.length, 'one main curve').toBe(1)
  return curves[0].points
}

/** A line's height at `x`, between the two points either side of it. */
function yAt(points: readonly [number, number][], x: number): number {
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1]
    const [x1, y1] = points[i]
    if (x >= x0 && x <= x1) return x1 === x0 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
  }
  throw new Error(`the line does not reach x = ${x}`)
}

/** What a drawn curve says a frequency is changed by, in dB, on a scale from `top` to `foot`. */
function dbAt(
  points: readonly [number, number][],
  hz: number,
  box: Box,
  top: number,
  foot: number,
): number {
  return top - ((yAt(points, xOfHz(hz, box)) - box.y) / box.h) * (top - foot)
}

describe('the family', () => {
  it('is five windows, each with handles', () => {
    expect(Object.keys(EQ_FACES).sort()).toEqual(
      ['ambient-eq', 'auto-filter', 'eq3', 'filter', 'parametric-eq'].sort(),
    )
    for (const { display } of Object.values(EQ_FACES)) {
      expect(display.place).toBe('window')
      expect(display.handles).toBeDefined()
      expect(display.live?.spectrum).toBe(true)
    }
  })

  it('says what each shows in three sentences at most', () => {
    for (const [id, { display }] of Object.entries(EQ_FACES))
      expect(display.info.split(/(?<=\.)\s+/).length, id).toBeLessThanOrEqual(3)
  })

  it('sums filters in series as the kit sums them one by one', () => {
    const filters = [
      biquad('lowshelf', 120, 0, 7, RATE),
      biquad('peaking', 404, 4.32, -3.5, RATE),
      biquad('peaking', 3000, 0.7, 9, RATE),
      biquad('highshelf', 9000, 0, -11, RATE),
    ]
    for (const hz of [20, 120, 404, 1000, 3000, 9000, 20000]) {
      const one = filters.reduce((sum, filter) => sum + biquadDb(filter, hz, RATE), 0)
      expect(seriesDb(filters, hz, RATE)).toBeCloseTo(one, 9)
    }
    expect(seriesDb([], 1000, RATE)).toBe(0)
  })
})

describe('the Filter display', () => {
  const filter = face('filter')
  const db = (values: Record<string, number>, hz: number): number =>
    dbAt(mainCurve(filter.draw({ values })), hz, filter.box, FILTER_DB, -FILTER_DB)

  it('draws a low pass that stands Q dB high at its cutoff and falls 12 dB an octave', () => {
    // Web Audio reads the Q of a low pass as dB: the gain at the cutoff is Q itself.
    expect(db({ type: 0, frequency: 1000, q: 6 }, 1000)).toBeCloseTo(6, 1)
    expect(db({ type: 0, frequency: 1000, q: Math.SQRT1_2 }, 1000)).toBeCloseTo(Math.SQRT1_2, 1)
    expect(db({ type: 0, frequency: 1000, q: 6 }, 100)).toBeCloseTo(0, 0)
    const octave =
      db({ type: 0, frequency: 500, q: 1 }, 4000) - db({ type: 0, frequency: 500, q: 1 }, 2000)
    expect(octave).toBeGreaterThan(-13.5)
    expect(octave).toBeLessThan(-11.5)
  })

  it('draws a high pass as the mirror of it', () => {
    expect(db({ type: 1, frequency: 200, q: 12 }, 200)).toBeCloseTo(12, 1)
    expect(db({ type: 1, frequency: 2000, q: 1 }, 20000)).toBeCloseTo(0, 0)
    const octave =
      db({ type: 1, frequency: 4000, q: 1 }, 500) - db({ type: 1, frequency: 4000, q: 1 }, 1000)
    expect(octave).toBeGreaterThan(-12.5)
    expect(octave).toBeLessThan(-11.5)
  })

  it('draws a band pass at 0 dB at its centre, narrower as Q rises', () => {
    expect(db({ type: 2, frequency: 1000, q: 1 }, 1000)).toBeCloseTo(0, 1)
    // An octave off centre at Q 1: (w/Q) / √((1 − w²)² + (w/Q)²) at w = 2 is 0.555, −5.1 dB.
    expect(db({ type: 2, frequency: 1000, q: 1 }, 2000)).toBeCloseTo(-5.1, 0)
    expect(db({ type: 2, frequency: 1000, q: 4 }, 2000)).toBeLessThan(-14)
  })

  it('draws the shelves and the peak with their gain', () => {
    expect(db({ type: 3, frequency: 400, gain: 12 }, 20)).toBeCloseTo(12, 0)
    expect(db({ type: 3, frequency: 400, gain: 12 }, 400)).toBeCloseTo(6, 0)
    expect(db({ type: 3, frequency: 400, gain: 12 }, 10000)).toBeCloseTo(0, 0)
    expect(db({ type: 4, frequency: 2000, gain: -18 }, 20000)).toBeCloseTo(-18, 0)
    expect(db({ type: 4, frequency: 2000, gain: -18 }, 2000)).toBeCloseTo(-9, 0)
    expect(db({ type: 4, frequency: 2000, gain: -18 }, 50)).toBeCloseTo(0, 0)
    expect(db({ type: 5, frequency: 3000, q: 1, gain: 9 }, 3000)).toBeCloseTo(9, 1)
    expect(db({ type: 5, frequency: 3000, q: 1, gain: 9 }, 100)).toBeCloseTo(0, 0)
  })

  it('follows Gain under a shelf and the peak, which are the types the device uses it for', () => {
    // The shared test cannot reach these types (Type names no choices), so Gain is checked here.
    const picture = (type: number, gain: number): string =>
      filter.draw({ values: { type, frequency: 700, q: 2, gain } }).print()
    for (let type = 0; type < 8; type++) {
      const follows = new Set([-24, 0, 24].map((gain) => picture(type, gain))).size === 3
      expect(follows, `type ${type}`).toBe(type === 3 || type === 4 || type === 5)
    }
  })

  it('keeps a narrow peak and a notch whole between two points of the curve', () => {
    // Q 20 at 5 kHz is a twentieth of the frequency wide: a pixel and a bit.
    expect(db({ type: 5, frequency: 5010, q: 20, gain: 18 }, 5010)).toBeCloseTo(18, 1)
    expect(db({ type: 6, frequency: 810, q: 10 }, 810)).toBeLessThan(-FILTER_DB)
    expect(db({ type: 6, frequency: 810, q: 10 }, 100)).toBeCloseTo(0, 0)
  })

  it('draws an all pass flat, with its phase as a dashed line through half a turn at the centre', () => {
    const drawn = filter.draw({ values: { type: 7, frequency: 1000, q: 1 } })
    for (const hz of [30, 1000, 15000])
      expect(dbAt(mainCurve(drawn), hz, filter.box, FILTER_DB, -FILTER_DB)).toBeCloseTo(0, 3)
    const phase = shapes(drawn).filter(
      (shape) => shape.op === 'stroke' && shape.dash.length > 0 && shape.points.length > 10,
    )
    expect(phase.length).toBe(1)
    const { box } = filter
    expect(yAt(phase[0].points, xOfHz(1000, box))).toBeCloseTo(box.y + box.h / 2, 0)
    expect(yAt(phase[0].points, xOfHz(21, box))).toBeLessThan(box.y + 2)
    expect(yAt(phase[0].points, xOfHz(19000, box))).toBeGreaterThan(box.y + box.h * 0.9)
    const allpass = biquad('allpass', 1000, 1, 0, RATE)
    expect(biquadTurns(allpass, 1000, RATE)).toBeCloseTo(-0.5, 6)
    expect(biquadTurns(allpass, 20, RATE)).toBeCloseTo(0, 1)
    expect(biquadTurns(allpass, 20000, RATE)).toBeLessThan(-0.95)
    // No other type has a second line.
    const lowpass = shapes(filter.draw({ values: { type: 0 } }))
    expect(lowpass.filter((shape) => shape.dash.length > 0 && shape.points.length > 10)).toEqual([])
  })

  it('says which type is set', () => {
    const names = [
      'Low pass',
      'High pass',
      'Band pass',
      'Low shelf',
      'High shelf',
      'Peak',
      'Notch',
      'All pass',
    ]
    names.forEach((name, type) => expect(filter.draw({ values: { type } }).words()).toContain(name))
  })

  it('has one point: across is the frequency, up and down the resonance or the gain', () => {
    const { box } = filter
    const at = (hz: number, level: number): [number, number] => [
      xOfHz(hz, box),
      yOfDb(level, box, FILTER_DB, -FILTER_DB),
    ]
    // A cut: the point rides the curve at the cutoff, Q dB high.
    const cut = filter.handle('point', { type: 0, frequency: 1000, q: 6 })
    expect([cut.x, cut.y]).toEqual(at(1000, 6))
    const moved = cut.drag(...at(2000, 12))
    expect(Object.keys(moved).sort()).toEqual(['frequency', 'q'])
    expect(moved.frequency).toBeCloseTo(2000, 6)
    expect(moved.q).toBeCloseTo(12, 6)
    // Under the 0 dB line there is no resonance left to take off.
    expect(cut.drag(...at(2000, -10)).q).toBe(0.1)
    expect(cut.wheel).toBeUndefined()
    expect(cut.reset?.()).toEqual({ frequency: 1000, q: Math.SQRT1_2 })

    // A shelf and the peak: the point stands at the gain.
    for (const type of [3, 4, 5]) {
      const gained = filter.handle('point', { type, frequency: 300, gain: -9 })
      expect([gained.x, gained.y]).toEqual(at(300, -9))
      const set = gained.drag(...at(5000, 15))
      expect(Object.keys(set).sort()).toEqual(['frequency', 'gain'])
      expect(set.frequency).toBeCloseTo(5000, 6)
      expect(set.gain).toBeCloseTo(15, 6)
      expect(gained.drag(0, -40).gain).toBe(24)
    }
    const peak = filter.handle('point', { type: 5, q: 2 })
    expect(peak.wheel?.(1).q).toBeCloseTo(2.4, 6)
    expect(peak.wheel?.(-1).q).toBeCloseTo(2 / 1.2, 6)
    expect(peak.reset?.()).toEqual({ gain: 0, q: Math.SQRT1_2 })
    expect(filter.handle('point', { type: 3 }).wheel).toBeUndefined()
    expect(filter.handle('point', { type: 3 }).reset?.()).toEqual({ gain: 0 })

    // The rest are 0 dB or nothing at their centre: the point's height is Q, wide at the foot.
    for (const type of [2, 6, 7]) {
      const wide = filter.handle('point', { type, q: 0.1 })
      const narrow = filter.handle('point', { type, q: 20 })
      expect(wide.y).toBeCloseTo(box.y + box.h, 6)
      expect(narrow.y).toBeCloseTo(box.y, 6)
      const middle = filter.handle('point', { type, q: Math.sqrt(0.1 * 20) })
      expect(middle.y).toBeCloseTo(box.y + box.h / 2, 6)
      expect(middle.drag(middle.x, middle.y).q).toBeCloseTo(Math.sqrt(2), 6)
      expect(middle.drag(middle.x, box.y - 30).q).toBeCloseTo(20, 6)
    }
  })

  it('leaves the point where it is when it is taken, at every type', () => {
    for (let type = 0; type < 8; type++) {
      const values = { type, frequency: 740, q: 3.3, gain: -7.5 }
      const point = filter.handle('point', values)
      for (const [name, value] of Object.entries(point.drag(point.x, point.y)))
        expect(value, `type ${type} ${name}`).toBeCloseTo(values[name as 'q'], 6)
    }
  })
})

describe('the EQ Three display', () => {
  const eq3 = face('eq3')
  const db = (values: Record<string, number>, hz: number): number =>
    dbAt(mainCurve(eq3.draw({ values })), hz, eq3.box, EQ3_DB, -EQ3_DB)

  it('is flat at its defaults', () => {
    for (const hz of [25, 200, 1000, 5000, 18000]) expect(db({}, hz)).toBeCloseTo(0, 6)
  })

  it('draws a low shelf, a peak and a high shelf', () => {
    expect(db({ lowGain: 6, lowFreq: 200 }, 20)).toBeCloseTo(6, 0)
    expect(db({ lowGain: 6, lowFreq: 200 }, 200)).toBeCloseTo(3, 1)
    expect(db({ lowGain: 6, lowFreq: 200 }, 8000)).toBeCloseTo(0, 1)
    expect(db({ midGain: -9, midFreq: 1500, midQ: 2 }, 1500)).toBeCloseTo(-9, 1)
    expect(db({ midGain: -9, midFreq: 1500, midQ: 2 }, 100)).toBeCloseTo(0, 1)
    expect(db({ highGain: 12, highFreq: 4000 }, 4000)).toBeCloseTo(6, 1)
    expect(db({ highGain: 12, highFreq: 4000 }, 20000)).toBeCloseTo(12, 0)
    // A narrower middle band reaches less far.
    const wide = db({ midGain: 12, midFreq: 1000, midQ: 0.3 }, 3000)
    const narrow = db({ midGain: 12, midFreq: 1000, midQ: 5 }, 3000)
    expect(wide).toBeGreaterThan(narrow + 5)
  })

  it('draws the three in series: their sum in dB', () => {
    const values = {
      lowGain: 9,
      lowFreq: 600,
      midGain: -12,
      midFreq: 900,
      midQ: 0.7,
      highGain: 7,
      highFreq: 1500,
    }
    const bands = [
      biquad('lowshelf', 600, 0, 9, RATE),
      biquad('peaking', 900, 0.7, -12, RATE),
      biquad('highshelf', 1500, 0, 7, RATE),
    ]
    for (const hz of [100, 600, 900, 1500, 6000]) {
      const sum = bands.reduce((total, band) => total + biquadDb(band, hz, RATE), 0)
      expect(db(values, hz)).toBeCloseTo(sum, 1)
    }
  })

  it('has a point per band: its frequency across, its gain up and down', () => {
    const { box } = eq3
    const values = { lowGain: 6, lowFreq: 100, midGain: -3, midFreq: 2000, highGain: 9 }
    const points = eq3.handles(values)
    expect(points.map((point) => point.key)).toEqual(['low', 'mid', 'high'])
    expect(points[0].x).toBeCloseTo(xOfHz(100, box), 6)
    expect(points[0].y).toBeCloseTo(yOfDb(6, box, EQ3_DB, -EQ3_DB), 6)
    expect(points[1].x).toBeCloseTo(xOfHz(2000, box), 6)
    expect(points[1].y).toBeCloseTo(yOfDb(-3, box, EQ3_DB, -EQ3_DB), 6)
    expect(points[2].x).toBeCloseTo(xOfHz(5000, box), 6)
    const set = points[1].drag(xOfHz(700, box), yOfDb(10, box, EQ3_DB, -EQ3_DB))
    expect(set.midFreq).toBeCloseTo(700, 6)
    expect(set.midGain).toBeCloseTo(10, 6)
    // A band keeps to the frequencies its knob has.
    expect(points[0].drag(xOfHz(8000, box), 0)).toEqual({ lowFreq: 1000, lowGain: 15 })
    expect(points[2].drag(xOfHz(50, box), 500)).toEqual({ highFreq: 1000, highGain: -15 })
    expect(eq3.handle('mid', { midQ: 2 }).wheel?.(1)).toEqual({ midQ: 2.4 })
    expect(points[0].wheel).toBeUndefined()
    expect(points[1].reset?.()).toEqual({ midGain: 0, midQ: 1 })
    expect(points[2].reset?.()).toEqual({ highGain: 0 })
  })

  it('draws the band in hand alone, as a dashed line', () => {
    const values = { lowGain: 9, midGain: -12, midFreq: 900 }
    const dashed = (hot: string | null) =>
      shapes(eq3.draw({ values, hot })).filter(
        (shape) => shape.dash.length > 0 && shape.points.length > 10,
      )
    expect(dashed(null)).toEqual([])
    const alone = dashed('mid')
    expect(alone.length).toBe(1)
    expect(dbAt(alone[0].points, 900, eq3.box, EQ3_DB, -EQ3_DB)).toBeCloseTo(-12, 1)
    expect(dbAt(alone[0].points, 30, eq3.box, EQ3_DB, -EQ3_DB)).toBeCloseTo(0, 0)
    expect(eq3.draw({ values, hot: 'mid' }).words()).toEqual(['900 Hz  −12.0 dB'])
  })
})

describe('the Ambient EQ display', () => {
  const ambient = face('ambient-eq')
  const db = (values: Record<string, number>, hz: number): number =>
    dbAt(mainCurve(ambient.draw({ values })), hz, ambient.box, AMBIENT_DB, -AMBIENT_DB)
  /** The five readings with these bands cut by so many dB. */
  const readings = (cuts: Record<number, number>, reduction: number): Record<string, number> => {
    const packed = [0, 0, 0, 0, 0]
    for (const [band, cut] of Object.entries(cuts))
      packed[Math.floor(Number(band) / 5)] += Math.round(-cut * 2) * Math.pow(25, Number(band) % 5)
    return Object.fromEntries([
      ['reduction', reduction],
      ...packed.map((value, r) => [`cuts${r + 1}`, value]),
    ]) as Record<string, number>
  }

  it('ports the Butterworth cuts of the device', () => {
    // Two stages of Q 0.5412 and 1.3066 are a fourth-order Butterworth: 3 dB down
    // at the cutoff, 24 dB an octave below it.
    const lowCut = (hz: number): number =>
      svfDb('highpass', 100, 0.5412, hz, RATE) + svfDb('highpass', 100, 1.3066, hz, RATE)
    expect(lowCut(100)).toBeCloseTo(-3.01, 1)
    expect(lowCut(50)).toBeCloseTo(-10 * Math.log10(1 + 256), 1)
    expect(lowCut(25) - lowCut(50)).toBeCloseTo(-24, 0)
    expect(lowCut(5000)).toBeCloseTo(0, 2)
    // One stage of Q √½ is a second-order Butterworth: 12 dB an octave, warped
    // towards half the sample rate as the device's filter is.
    expect(svfDb('lowpass', 5000, Math.SQRT1_2, 5000, RATE)).toBeCloseTo(-3.01, 2)
    const warped = Math.tan((Math.PI * 10000) / RATE) / Math.tan((Math.PI * 5000) / RATE)
    expect(svfDb('lowpass', 5000, Math.SQRT1_2, 10000, RATE)).toBeCloseTo(
      -10 * Math.log10(1 + Math.pow(warped, 4)),
      6,
    )
    expect(svfDb('lowpass', 5000, Math.SQRT1_2, 10000, RATE)).toBeLessThan(-12.3)
  })

  it('is flat with the cuts at their stops and every gain at 0, as the device is a wire', () => {
    for (const hz of [20, 21, 100, 1000, 19000, 20000]) expect(db({}, hz)).toBe(0)
  })

  it('draws the two cuts and the four tone controls where the device has them', () => {
    expect(db({ lowCut: 100 }, 100)).toBeCloseTo(-3.01, 1)
    expect(db({ lowCut: 100 }, 71)).toBeCloseTo(-12.3, 0)
    expect(db({ highCut: 4000 }, 4000)).toBeCloseTo(-3.01, 1)
    expect(db({ highCut: 4000 }, 400)).toBeCloseTo(0, 1)
    expect(db({ low: 8 }, 120)).toBeCloseTo(4, 1)
    expect(db({ low: 8 }, 20)).toBeCloseTo(8, 0)
    expect(db({ low: 8 }, 3000)).toBeCloseTo(0, 1)
    expect(db({ body: -6 }, 320)).toBeCloseTo(-6, 1)
    expect(db({ presence: 9 }, 3000)).toBeCloseTo(9, 1)
    // A bell of Q 0.7 is half its gain about an octave either side.
    expect(db({ presence: 9 }, 1500)).toBeGreaterThan(3)
    expect(db({ presence: 9 }, 1500)).toBeLessThan(6)
    expect(db({ air: -10 }, 9000)).toBeCloseTo(-5, 1)
    expect(db({ air: -10 }, 200)).toBeCloseTo(0, 1)
    // In series: the gains add.
    expect(db({ body: 4, presence: 4 }, 320)).toBeCloseTo(
      4 + biquadDb(biquad('peaking', 3000, 0.7, 4, RATE), 320, RATE),
      1,
    )
  })

  it("lays out Clear's bands as the device does", () => {
    expect(CLEAR_BANDS.length).toBe(23)
    expect(CLEAR_BANDS[0].hz).toBeCloseTo(45 * Math.pow(2, 0.25), 6)
    expect(CLEAR_BANDS[3].hz).toBeCloseTo(45 * Math.pow(2, 1.75), 6)
    expect(CLEAR_BANDS[4].hz).toBeCloseTo(180 * Math.pow(2, 1 / 6), 6)
    expect(CLEAR_BANDS[22].hz).toBeCloseTo(180 * 64 * Math.pow(2, 1 / 6), 6)
    // The Q whose width is the band: 2.87 for half an octave, 4.32 for a third.
    expect(CLEAR_BANDS[0].q).toBeCloseTo(2.87, 2)
    expect(CLEAR_BANDS[22].q).toBeCloseTo(4.32, 2)
    // Each band begins where the one before ends.
    for (let k = 1; k < 23; k++) {
      const octaves = (band: number): number => (band < 4 ? 0.5 : 1 / 3)
      const top = CLEAR_BANDS[k - 1].hz * Math.pow(2, octaves(k - 1) / 2)
      const foot = CLEAR_BANDS[k].hz / Math.pow(2, octaves(k) / 2)
      expect(foot).toBeCloseTo(top, 6)
    }
  })

  it('reads every band out of the five readings', () => {
    const cuts = { 2: -0.5, 4: -12, 5: -3, 11: -8.5, 19: -1, 20: -6, 22: -12 }
    const meters = readings(cuts, -12)
    // As the device packs them: band 4 is the fifth digit of the first reading.
    expect(meters.cuts1).toBe(1 * 625 + 24 * 390625)
    const read = clearCuts((name) => meters[name], new Float32Array(23))
    for (let band = 0; band < 23; band++)
      expect(read[band]).toBe((cuts as Record<number, number>)[band] ?? 0)
    // A reading that is no number of the device's is no cut.
    const none = clearCuts((name) => (name === 'cuts2' ? Number.NaN : -6), new Float32Array(23))
    expect([...none].every((cut) => cut === 0)).toBe(true)
  })

  /**
   * `AmbientEq::meter(index)` for index 1 to 5, term by term: the gains are
   * the bands' cuts in dB (0 or below), five bands to a reading from the
   * highest digit down, each `int(-2 * gain + 0.5)` kept to 0..24.
   */
  const packedAsTheDevice = (gains: Readonly<Record<number, number>>, index: number): number => {
    const first = (index - 1) * 5
    let packed = 0
    for (let k = first + 4; k >= first; k--) {
      const halfDb = k < 23 ? -2 * (gains[k] ?? 0) : 0
      const steps = Math.min(24, Math.max(0, Math.trunc(halfDb + 0.5)))
      packed = packed * 25 + steps
    }
    return Math.fround(packed)
  }
  const asTheDevice = (gains: Readonly<Record<number, number>>): Record<string, number> => ({
    reduction: Math.min(0, ...Object.values(gains)),
    ...Object.fromEntries(
      [1, 2, 3, 4, 5].map((index) => [`cuts${index}`, packedAsTheDevice(gains, index)]),
    ),
  })

  it('brings a cut of 3.5 dB in band 7 back as 3.5 dB at 404 Hz', () => {
    // Band 7 is the third digit of the second reading (bands 5 to 9): 7 half
    // decibels times 25², and nothing anywhere else.
    const meters = asTheDevice({ 7: -3.5 })
    expect(meters).toEqual({ reduction: -3.5, cuts1: 0, cuts2: 4375, cuts3: 0, cuts4: 0, cuts5: 0 })
    const read = clearCuts((name) => meters[name], new Float32Array(23))
    expect([...read].map((cut, band) => (cut === 0 ? null : [band, cut])).filter(Boolean)).toEqual([
      [7, -3.5],
    ])
    // The band is the fourth third of an octave from 180 Hz: 360 to 454 Hz, centre 404.
    expect(CLEAR_BANDS[7].hz).toBeCloseTo(360 * Math.pow(2, 1 / 6), 9)
    expect(CLEAR_BANDS[7].hz).toBeCloseTo(404.1, 1)
    const running = ambient.run(1, { meters, signal: testSignal(), values: { clear: 1 } })
    const now = shapes(running).filter(
      (shape) =>
        shape.op === 'stroke' &&
        shape.width === 1 &&
        shape.dash.length === 0 &&
        shape.points.length > 10,
    )
    expect(now.length).toBe(1)
    expect(
      dbAt(now[0].points, CLEAR_BANDS[7].hz, ambient.box, AMBIENT_DB, -AMBIENT_DB),
    ).toBeCloseTo(-3.5, 2)
    expect(running.words()).toContain('−3.5 dB')
  })

  it('reads the readings as the device packs them, at the ends of a digit too', () => {
    // A cut is rounded to the half decibel; one deeper than 12 dB, which Clear
    // never makes, would read as 12 and leave the band beside it alone.
    const gains = { 2: -3.26, 3: -3.24, 4: -0.2, 7: -3.5, 8: -13, 9: -0.2, 20: -12, 22: -0.5 }
    const meters = asTheDevice(gains)
    const read = clearCuts((name) => meters[name], new Float32Array(23))
    const want: Record<number, number> = { 2: -3.5, 3: -3, 7: -3.5, 8: -12, 20: -12, 22: -0.5 }
    for (let band = 0; band < 23; band++) expect(read[band], `band ${band}`).toBe(want[band] ?? 0)
    // Every band at its deepest is the largest reading there is, and a float holds it exactly.
    const deepest = Object.fromEntries(Array.from({ length: 23 }, (_, band) => [band, -12]))
    expect(packedAsTheDevice(deepest, 1)).toBe(Math.pow(25, 5) - 1)
    expect(Math.pow(25, 5)).toBeLessThan(Math.pow(2, 24))
    const all = asTheDevice(deepest)
    expect(
      [...clearCuts((name) => all[name], new Float32Array(23))].every((cut) => cut === -12),
    ).toBe(true)
  })

  it('shows in the accent what Clear is taking off, and how deep', () => {
    const band = 11
    const meters = readings({ [band]: -8.5 }, -8.7)
    const running = ambient.run(1, { meters, signal: testSignal(), values: { clear: 1 } })
    const drawn = shapes(running)
    const accent = drawn.filter(
      (shape) => shape.op === 'fill' && shape.colour === PLAIN_COLOURS.accent,
    )
    expect(accent.length).toBe(1)
    // The curve as it stands now, under the one that is set: the band's peak, 8.5 dB down.
    const now = drawn.filter(
      (shape) =>
        shape.op === 'stroke' &&
        shape.width === 1 &&
        shape.dash.length === 0 &&
        shape.points.length > 10,
    )
    expect(now.length).toBe(1)
    const centre = CLEAR_BANDS[band].hz
    expect(dbAt(now[0].points, centre, ambient.box, AMBIENT_DB, -AMBIENT_DB)).toBeCloseTo(-8.5, 1)
    expect(dbAt(now[0].points, centre / 4, ambient.box, AMBIENT_DB, -AMBIENT_DB)).toBeCloseTo(0, 0)
    expect(dbAt(mainCurve(running), centre, ambient.box, AMBIENT_DB, -AMBIENT_DB)).toBe(0)
    // One band wide: half the cut in dB is reached inside the band next to it.
    const next = CLEAR_BANDS[band + 1].hz
    expect(dbAt(now[0].points, next, ambient.box, AMBIENT_DB, -AMBIENT_DB)).toBeGreaterThan(-4.25)
    expect(running.words()).toContain('−8.7 dB')

    // At rest and switched off nothing is being taken off.
    for (const still of [ambient.draw({ meters }), ambient.run(1, { meters, powered: false })]) {
      expect(shapes(still).filter((shape) => shape.colour === PLAIN_COLOURS.accent)).toEqual([])
      expect(still.words()).toContain('0.0 dB')
    }
  })

  it('draws how far Clear may reach as a dotted line under the curve', () => {
    const dotted = (values: Record<string, number>) =>
      shapes(ambient.draw({ values })).filter(
        (shape) => shape.op === 'stroke' && shape.dash.length > 0 && shape.points.length > 10,
      )
    expect(dotted({ clear: 0 })).toEqual([])
    const [reach] = dotted({ clear: 0.5, body: 3 })
    // Clear times 12 dB under the curve, over the bands Clear works on: from 90 Hz to 14.5 kHz.
    expect(dbAt(reach.points, 1000, ambient.box, AMBIENT_DB, -AMBIENT_DB)).toBeCloseTo(
      -6 + biquadDb(biquad('peaking', 320, 0.7, 3, RATE), 1000, RATE),
      1,
    )
    expect(reach.points[0][0]).toBeGreaterThanOrEqual(xOfHz(90, ambient.box))
    expect(reach.points[0][0]).toBeLessThan(xOfHz(90, ambient.box) + 2)
    expect(reach.points.at(-1)?.[0]).toBeLessThanOrEqual(xOfHz(14500, ambient.box) + 0.5)
  })

  it('has a point for each cut and each tone control', () => {
    const { box } = ambient
    const values = { lowCut: 80, low: 4, body: -5, presence: 3, air: -6, highCut: 9000 }
    const points = ambient.handles(values)
    expect(points.map((point) => point.key)).toEqual([
      'lowCut',
      'low',
      'body',
      'presence',
      'air',
      'highCut',
    ])
    // A tone control sits where the device has it; only its gain is set.
    const places = { low: 120, body: 320, presence: 3000, air: 9000 }
    for (const [key, hz] of Object.entries(places)) {
      const point = ambient.handle(key, values)
      expect(point.x).toBeCloseTo(xOfHz(hz, box), 6)
      expect(point.y).toBeCloseTo(yOfDb(values[key as 'low'], box, AMBIENT_DB, -AMBIENT_DB), 6)
      expect(point.drag(3, yOfDb(7, box, AMBIENT_DB, -AMBIENT_DB))[key]).toBeCloseTo(7, 6)
      expect(Object.keys(point.drag(3, 3))).toEqual([key])
      expect(point.drag(3, -50)).toEqual({ [key]: 12 })
      expect(point.reset?.()).toEqual({ [key]: 0 })
    }
    // A cut's point stands where the cut has taken 3 dB.
    const lowCut = ambient.handle('lowCut', values)
    expect(lowCut.x).toBeCloseTo(xOfHz(80, box), 6)
    expect(lowCut.y).toBeCloseTo(yOfDb(-3, box, AMBIENT_DB, -AMBIENT_DB), 6)
    expect(ambient.handle('highCut', values).y).toBeCloseTo(
      yOfDb(-3, box, AMBIENT_DB, -AMBIENT_DB),
      6,
    )
    // At the end of its range a cut is out of circuit: its point is on the middle line, as the curve is.
    const zero = yOfDb(0, box, AMBIENT_DB, -AMBIENT_DB)
    expect(ambient.handle('lowCut').y).toBe(zero)
    expect(ambient.handle('highCut').y).toBe(zero)
    expect(ambient.handle('lowCut', { highCut: 9000 }).y).toBe(zero)
    expect(ambient.handle('highCut', { lowCut: 80 }).y).toBe(zero)
    expect(lowCut.drag(xOfHz(200, box), 0).lowCut).toBeCloseTo(200, 6)
    expect(lowCut.drag(xOfHz(5000, box), 0)).toEqual({ lowCut: 500 })
    expect(lowCut.reset?.()).toEqual({ lowCut: 20 })
    const highCut = ambient.handle('highCut', values)
    expect(highCut.drag(xOfHz(100, box), 0)).toEqual({ highCut: 1000 })
    expect(highCut.reset?.()).toEqual({ highCut: 20000 })
  })

  it('keeps every point clear of the others at each factory preset', () => {
    // The tone points do not move across, and a cut's travel passes two of
    // them: on the middle line a cut at 120 Hz would lie under Low.
    const presets = stock.get('ambient-eq')?.presets ?? {}
    expect(Object.keys(presets).length).toBeGreaterThan(10)
    for (const [name, preset] of Object.entries(presets)) {
      const values: Record<string, number> = {}
      for (const [param, value] of Object.entries(preset))
        if (value !== undefined) values[param] = value
      const points = ambient.handles(values)
      for (const a of points)
        for (const b of points)
          if (a.key < b.key)
            expect(
              Math.hypot(a.x - b.x, a.y - b.y),
              `${name}: ${a.key} and ${b.key}`,
            ).toBeGreaterThan(7)
    }
  })
})

describe('the Auto Filter display', () => {
  const auto = face('auto-filter')
  const setting = { type: 0, steep: false, q: Math.SQRT1_2, mix: 1 }
  const at = (changes: Partial<typeof setting>, cutoff: number, hz: number): number =>
    autoFilterDb({ ...setting, ...changes }, cutoff, RATE)(hz)
  const db = (drawn: RecordingContext, hz: number): number =>
    dbAt(mainCurve(drawn), hz, auto.box, AUTO_TOP_DB, AUTO_FOOT_DB)

  it("ports the device's filter: 3 dB down at the cutoff, 12 or 24 dB an octave", () => {
    expect(at({}, 1000, 1000)).toBeCloseTo(-3.01, 2)
    expect(at({}, 1000, 100)).toBeCloseTo(0, 2)
    expect(at({}, 100, 1600) - at({}, 100, 800)).toBeCloseTo(-12, 0)
    // 24 dB is two stages at √Q each, so the cutoff stays 3 dB down.
    expect(at({ steep: true }, 1000, 1000)).toBeCloseTo(-3.01, 2)
    expect(at({ steep: true }, 100, 1600) - at({ steep: true }, 100, 800)).toBeCloseTo(-24, 0)
    expect(at({ type: 1 }, 1000, 1000)).toBeCloseTo(-3.01, 2)
    expect(at({ type: 1 }, 1000, 125) - at({ type: 1 }, 1000, 250)).toBeCloseTo(-12, 0)
  })

  it('ports the resonance of every type', () => {
    // At the cutoff a low or a high pass stands at Q, on either slope.
    for (const steep of [false, true]) {
      expect(at({ q: 4, steep }, 700, 700)).toBeCloseTo(20 * Math.log10(4), 2)
      expect(at({ type: 1, q: 10, steep }, 700, 700)).toBeCloseTo(20, 2)
    }
    // A band pass is 0 dB there, a notch nothing, a peak 2Q (4Q at 24 dB).
    expect(at({ type: 2, q: 6 }, 700, 700)).toBeCloseTo(0, 6)
    expect(at({ type: 2, q: 6 }, 700, 1400)).toBeLessThan(-18)
    expect(at({ type: 3, q: 2 }, 700, 700)).toBeLessThan(-100)
    expect(at({ type: 3, q: 2 }, 700, 70)).toBeCloseTo(0, 1)
    expect(at({ type: 4, q: 2 }, 700, 700)).toBeCloseTo(20 * Math.log10(4), 2)
    expect(at({ type: 4, q: 2, steep: true }, 700, 700)).toBeCloseTo(20 * Math.log10(8), 2)
    expect(at({ type: 4, q: 2 }, 700, 30)).toBeCloseTo(0, 1)
  })

  it('adds the dry sound as the device does, with its phase', () => {
    for (const hz of [50, 1000, 12000]) expect(at({ mix: 0 }, 1000, hz)).toBeCloseTo(0, 9)
    // Far above a low pass only the dry half is left: −6 dB.
    expect(at({ mix: 0.5, steep: true }, 200, 16000)).toBeCloseTo(-6.02, 1)
    // At the cutoff a Butterworth low pass is √½ a quarter turn behind:
    // half of 1 and half of −0.707j is 0.612, −4.26 dB. Adding levels would say −1.4.
    expect(at({ mix: 0.5 }, 1000, 1000)).toBeCloseTo(20 * Math.log10(Math.hypot(0.5, 0.3536)), 2)
  })

  it('knows how far the envelope and the LFO can take the cutoff', () => {
    expect(autoFilterSweep(1000, 0, 0)).toEqual([1000, 1000])
    // The LFO goes three octaves either way at 100 %, the envelope five one way.
    expect(autoFilterSweep(1000, 0, 100)).toEqual([125, 8000])
    expect(autoFilterSweep(500, 100, 0)).toEqual([500, 16000])
    expect(autoFilterSweep(4000, -100, 0)).toEqual([125, 4000])
    const [low, high] = autoFilterSweep(1000, -50, 50)
    expect(low).toBeCloseTo(1000 * Math.pow(2, -4), 6)
    expect(high).toBeCloseTo(1000 * Math.pow(2, 1.5), 6)
    // The filter keeps to 20 Hz and 20 kHz.
    expect(autoFilterSweep(100, -100, 100)).toEqual([20, 800])
    expect(autoFilterSweep(8000, 100, 0)).toEqual([8000, 20000])
  })

  it('draws the curve where the device says the cutoff is now, and marks it in the accent', () => {
    const values = { cutoffHz: 1000, lfoAmount: 100 }
    const running = auto.run(0.2, { values, meters: { cutoff: 4000 }, signal: testSignal() })
    expect(db(running, 4000)).toBeCloseTo(-3.01, 1)
    expect(db(running, 1000)).toBeCloseTo(0, 0)
    const dots = running.calls.filter((call) => call.name === 'arc')
    // The point where the knobs have it, and the mark where the filter is.
    expect(dots.map((call) => call.args[0])).toEqual([xOfHz(1000, auto.box), xOfHz(4000, auto.box)])
    expect(dots[1].args[1]).toBeCloseTo(yOfDb(-3.01, auto.box, AUTO_TOP_DB, AUTO_FOOT_DB), 1)
    expect(running.calls.map((call) => call.args[0])).toContain(PLAIN_COLOURS.accent)

    // The span it can sweep: from 125 Hz to 8 kHz, shaded.
    const span = running.calls.filter(
      (call) => call.name === 'fillRect' && call.args[0] === xOfHz(125, auto.box),
    )
    expect(span.length).toBe(1)
    expect(span[0].args[2]).toBeCloseTo(xOfHz(8000, auto.box) - xOfHz(125, auto.box), 6)
  })

  it('stands where the knobs have it at rest, switched off, and when nothing moves it', () => {
    const swept = { cutoffHz: 1000, lfoAmount: 100 }
    const stills = [
      auto.draw({ values: swept, meters: { cutoff: 4000 } }),
      auto.run(0.2, {
        values: swept,
        meters: { cutoff: 4000 },
        signal: testSignal(),
        powered: false,
      }),
      // No reading yet.
      auto.run(0.2, { values: swept, meters: { cutoff: 0 }, signal: testSignal() }),
      // Nothing sweeps it: the knob is the cutoff, whatever was last read.
      auto.run(0.2, {
        values: { cutoffHz: 1000 },
        meters: { cutoff: 4000 },
        signal: testSignal(),
      }),
    ]
    for (const still of stills) {
      expect(db(still, 1000)).toBeCloseTo(-3.01, 1)
      expect(still.calls.filter((call) => call.name === 'arc').length).toBe(1)
      expect(still.calls.map((call) => call.args[0])).not.toContain(PLAIN_COLOURS.accent)
    }
  })

  it('draws the type, the slope and Mix that are set', () => {
    expect(db(auto.draw({ values: { type: 1, cutoffHz: 2000 } }), 250)).toBeCloseTo(-36.1, 0)
    // An octave up, each of the two stages at Q 0.841 is 1 / √(9 + 4 / 0.707): −11.66 dB.
    expect(db(auto.draw({ values: { slope: 1, cutoffHz: 500 } }), 1000)).toBeCloseTo(-23.3, 0)
    expect(db(auto.draw({ values: { type: 2, resonance: 5, cutoffHz: 3000 } }), 3000)).toBeCloseTo(
      0,
      1,
    )
    expect(db(auto.draw({ values: { mix: 0, cutoffHz: 200 } }), 5000)).toBeCloseTo(0, 6)
    // The peak of a high resonance is whole though it is narrower than two points.
    expect(db(auto.draw({ values: { resonance: 25, cutoffHz: 1234 } }), 1234)).toBeCloseTo(
      20 * Math.log10(25),
      1,
    )
  })

  it('has one point: the cutoff across, the resonance up and down', () => {
    const { box } = auto
    const level = (dbs: number): number => yOfDb(dbs, box, AUTO_TOP_DB, AUTO_FOOT_DB)
    const point = auto.handle('cutoff', { cutoffHz: 400, resonance: 4 })
    // Q as the height it gives a low pass at the cutoff: the point rides that curve.
    expect(point.x).toBeCloseTo(xOfHz(400, box), 6)
    expect(point.y).toBeCloseTo(level(20 * Math.log10(4)), 6)
    const set = point.drag(xOfHz(3000, box), level(20))
    expect(set.cutoffHz).toBeCloseTo(3000, 6)
    expect(set.resonance).toBeCloseTo(10, 6)
    expect(point.drag(-20, 500)).toEqual({ cutoffHz: 20, resonance: 0.5 })
    expect(point.drag(900, -20)).toEqual({ cutoffHz: 20000, resonance: 25 })
    expect(point.reset?.()).toEqual({ cutoffHz: 1000, resonance: 0.7071 })
    // The whole of the resonance is on the display, so no end of it is out of reach.
    for (const resonance of [0.5, 25]) {
      const end = auto.handle('cutoff', { resonance })
      expect(end.y).toBeGreaterThanOrEqual(box.y)
      expect(end.y).toBeLessThanOrEqual(box.y + box.h)
      expect(end.drag(end.x, end.y).resonance).toBeCloseTo(resonance, 6)
    }
    // The point stays where the knobs have it while the device moves the curve.
    const moved = auto.run(0.2, {
      values: { cutoffHz: 400, resonance: 4, lfoAmount: 50 },
      meters: { cutoff: 2000 },
      signal: testSignal(),
    })
    expect(moved.calls.find((call) => call.name === 'arc')?.args[0]).toBeCloseTo(xOfHz(400, box), 6)
  })
})

describe('the words on a display', () => {
  /** The words a point stands in: 5 px a letter, as the recording canvas measures them. */
  function covered(drawn: RecordingContext, points: readonly DisplayHandle[]): string[] {
    const found: string[] = []
    let align = 'left'
    let size = 8
    for (const call of drawn.calls) {
      if (call.name === 'set textAlign') align = String(call.args[0])
      else if (call.name === 'set font') size = Number(/(\d+)px/.exec(String(call.args[0]))?.[1])
      else if (call.name === 'fillText') {
        const [words, x, y] = call.args as [string, number, number]
        const from = align === 'right' ? x - words.length * 5 : x
        const under = points.some(
          (point) =>
            point.x > from - 4 &&
            point.x < from + words.length * 5 + 4 &&
            point.y > y - size - 4 &&
            point.y < y + 6,
        )
        if (under) found.push(words)
      }
    }
    return found
  }

  it('keep clear of a point at either end of its travel, in hand or not', () => {
    const settings: [string, string | null, Record<string, number>][] = []
    for (const frequency of [20, 150, 1000, 9000, 20000]) {
      for (const type of [0, 1, 2, 6, 7])
        for (const q of [0.1, 20]) settings.push(['filter', 'point', { type, frequency, q }])
      for (const type of [3, 4, 5])
        for (const gain of [-24, 24]) settings.push(['filter', 'point', { type, frequency, gain }])
      for (const resonance of [0.5, 25])
        settings.push(['auto-filter', 'cutoff', { cutoffHz: frequency, resonance }])
    }
    for (const gain of [-15, 15]) {
      for (const lowFreq of [40, 1000]) settings.push(['eq3', 'low', { lowGain: gain, lowFreq }])
      for (const midFreq of [200, 8000]) settings.push(['eq3', 'mid', { midGain: gain, midFreq }])
      for (const highFreq of [1000, 16000])
        settings.push(['eq3', 'high', { highGain: gain, highFreq }])
    }
    for (const gain of [-12, 12])
      for (const tone of ['low', 'body', 'presence', 'air'])
        settings.push(['ambient-eq', tone, { [tone]: gain }])
    expect(settings.length).toBeGreaterThan(80)
    for (const [id, key, values] of settings) {
      const made = face(id)
      for (const hot of [key, null]) {
        const drawn = made.draw({ values, hot })
        expect(covered(drawn, made.handles(values)), `${id} ${JSON.stringify(values)}`).toEqual([])
        // What the point is at is still said while it is in hand.
        if (hot)
          expect(
            drawn.words().some((words) => /\d/.test(words)),
            id,
          ).toBe(true)
      }
    }
  })

  it('stand at the head of the display, the point in hand at the left, while nothing is in the way', () => {
    const filter = face('filter')
    const { box } = filter
    const head = (drawn: RecordingContext): [string, number, number][] =>
      drawn.calls
        .filter((call) => call.name === 'fillText')
        .map((call) => call.args as [string, number, number])
    expect(head(filter.draw({ values: { type: 5, gain: 6 }, hot: 'point' }))).toEqual([
      ['1 kHz  +6.0 dB', box.x + 2, box.y + 8],
      ['Peak', box.x + box.w - 2, box.y + 8],
    ])
    // A high pass far up at 150 Hz stands at the left of the head: the words in hand go to the right.
    const moved = head(filter.draw({ values: { type: 1, frequency: 150, q: 20 }, hot: 'point' }))
    expect(moved[0]).toEqual(['150 Hz  Q 20', box.x + box.w - 2, box.y + 8])
    expect(moved[1][0]).toBe('High pass')
    expect(moved[1][2]).toBe(box.y + box.h - 3)
  })
})

describe('the Auto Filter face', () => {
  it('has a word of one line under each knob', () => {
    // Two rows of knobs stand beside the window: a second line would stand against the knob below.
    const { face = [], labels = {} } = EQ_FACES['auto-filter']
    const params = stock.get('auto-filter')?.params ?? {}
    expect(face).toEqual(['type', 'envAmount', 'lfoAmount', 'lfoRateHz'])
    for (const name of face)
      expect((labels[name] ?? params[name].name).length, name).toBeLessThanOrEqual(9)
  })
})

describe('the compiled devices against what is drawn of them', () => {
  const BLOCK = 128
  const LEVEL = 0.1

  /** What a compiled device does to a sine at `hz` once it has settled, in dB: the level out over the level in. */
  async function measuredDb(
    id: string,
    values: Record<string, number>,
    hz: number,
  ): Promise<number> {
    const device = await loadWasmDevice(id, RATE)
    const params = stock.get(id)?.params ?? {}
    for (const [name, value] of Object.entries(values)) device.set(params[name], value)
    const block = new Float32Array(BLOCK)
    const step = (2 * Math.PI * hz) / RATE
    let sum = 0
    let count = 0
    for (let done = 0; done < RATE * 0.45; done += BLOCK) {
      for (let i = 0; i < BLOCK; i++) block[i] = LEVEL * Math.sin(step * (done + i))
      device.processBlock(block)
      if (done < RATE * 0.25) continue
      for (const sample of device.view(device.device.device_out_left(), BLOCK)) {
        sum += sample * sample
        count += 1
      }
    }
    return 10 * Math.log10(sum / count / ((LEVEL * LEVEL) / 2))
  }

  /** The same noise every time, between −1 and 1. */
  function noiseSource(): () => number {
    let seed = 1
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed / 2147483648 - 1
    }
  }

  it('the Auto Filter: every type on both slopes, and the dry sound added by Mix', async () => {
    for (const type of [0, 1, 2, 3, 4]) {
      for (const slope of [0, 1]) {
        for (const [resonance, mix] of [
          [2, 1],
          [Math.SQRT1_2, 0.5],
        ]) {
          const drawn = autoFilterDb({ type, steep: slope === 1, q: resonance, mix }, 1000, RATE)
          for (const hz of [250, 700, 1400, 3900]) {
            const measured = await measuredDb(
              'auto-filter',
              { type, slope, cutoffHz: 1000, resonance, mix },
              hz,
            )
            expect(
              Math.abs(measured - drawn(hz)),
              `type ${type} slope ${slope} Q ${resonance} mix ${mix} at ${hz} Hz: ${measured} against ${drawn(hz)}`,
            ).toBeLessThan(0.05)
          }
        }
      }
    }
  })

  it('the Auto Filter: the reading is the cutoff, awake, asleep and on waking', async () => {
    const device = await loadWasmDevice('auto-filter', RATE)
    const params = stock.get('auto-filter')?.params ?? {}
    const reading = (): number => device.device.device_meter?.(0) ?? Number.NaN
    device.set(params.cutoffHz, 1000)
    device.set(params.lfoAmount, 100)
    device.set(params.lfoRateHz, 1)
    // Before the first block the LFO has not turned: the knob is the cutoff.
    expect(reading()).toBeCloseTo(1000, 1)
    const [low, high] = autoFilterSweep(1000, 0, 100)
    const block = new Float32Array(BLOCK)
    const sound = (from: number): void => {
      for (let i = 0; i < BLOCK; i++)
        block[i] = 0.2 * Math.sin((2 * Math.PI * 300 * (from + i)) / RATE)
    }
    // Awake over two turns of the LFO: three octaves down and three up, no further.
    const awake: number[] = []
    let done = 0
    for (; done < RATE * 2; done += BLOCK) {
      sound(done)
      device.processBlock(block)
      awake.push(reading())
    }
    expect(Math.min(...awake) / low).toBeCloseTo(1, 2)
    expect(Math.max(...awake) / high).toBeCloseTo(1, 2)
    // Asleep the LFO turns on paper, and the reading with it, a block at a time.
    block.fill(0)
    const asleep: number[] = []
    for (let n = 0; n < RATE * 1.3; n += BLOCK) {
      device.processBlock(block)
      asleep.push(reading())
    }
    expect(Math.max(...device.view(device.device.device_out_left(), BLOCK))).toBe(0)
    expect(Math.min(...asleep) / low).toBeCloseTo(1, 2)
    expect(Math.max(...asleep) / high).toBeCloseTo(1, 2)
    // One block at 1 Hz moves three octaves' sine by 0.05 of an octave at most.
    const octaves = (a: number, b: number): number => Math.abs(Math.log2(a / b))
    for (let i = 1; i < asleep.length; i++)
      expect(octaves(asleep[i], asleep[i - 1])).toBeLessThan(0.06)
    // Waking, the filter is where the reading said it would be.
    sound(done)
    device.processBlock(block)
    expect(octaves(reading(), asleep[asleep.length - 1])).toBeLessThan(0.06)
  })

  it('the Ambient EQ: the two cuts and the four tone controls', async () => {
    const ambient = face('ambient-eq')
    const values = { lowCut: 100, low: 6, body: -4, presence: 5, air: -6, highCut: 6000, clear: 0 }
    const curve = mainCurve(ambient.draw({ values }))
    for (const hz of [50, 71, 100, 120, 320, 997, 3001, 6007, 9001, 12007]) {
      const measured = await measuredDb('ambient-eq', values, hz)
      const drawn = dbAt(curve, hz, ambient.box, AMBIENT_DB, -AMBIENT_DB)
      // The curve is a line between points two pixels apart: a tenth of a dB off where it bends.
      expect(Math.abs(measured - drawn), `${hz} Hz: ${measured} against ${drawn}`).toBeLessThan(
        0.15,
      )
    }
  })

  it('the Ambient EQ: a band that rings is the band the readings name and the display cuts', async () => {
    const device = await loadWasmDevice('ambient-eq', RATE)
    const params = stock.get('ambient-eq')?.params ?? {}
    device.set(params.clear, 1)
    device.set(params.clearTime, 0.2)
    // A bed of noise with a tone at the centre of band 7 standing out of it.
    const noise = noiseSource()
    const ringing = 7
    const step = (2 * Math.PI * CLEAR_BANDS[ringing].hz) / RATE
    const block = new Float32Array(BLOCK)
    for (let done = 0; done < RATE * 5; done += BLOCK) {
      for (let i = 0; i < BLOCK; i++) block[i] = 0.1 * noise() + 0.02 * Math.sin(step * (done + i))
      device.processBlock(block)
    }
    const meters: Record<string, number> = {}
    const names = ['reduction', 'cuts1', 'cuts2', 'cuts3', 'cuts4', 'cuts5']
    names.forEach(
      (name, index) => (meters[name] = device.device.device_meter?.(index) ?? Number.NaN),
    )
    const cuts = clearCuts((name) => meters[name], new Float32Array(23))
    // Only that band is cut, by what the device says is its deepest cut, to the half decibel.
    expect(meters.reduction).toBeLessThan(-3)
    expect(Math.abs(cuts[ringing] - meters.reduction)).toBeLessThanOrEqual(0.25)
    for (let band = 0; band < 23; band++)
      if (band !== ringing) expect(cuts[band], `band ${band}`).toBe(0)

    const ambient = face('ambient-eq')
    const running = ambient.run(1, { meters, signal: testSignal(), values: { clear: 1 } })
    const now = shapes(running).filter(
      (shape) =>
        shape.op === 'stroke' &&
        shape.width === 1 &&
        shape.dash.length === 0 &&
        shape.points.length > 10,
    )
    expect(now.length).toBe(1)
    expect(
      dbAt(now[0].points, CLEAR_BANDS[ringing].hz, ambient.box, AMBIENT_DB, -AMBIENT_DB),
    ).toBeCloseTo(cuts[ringing], 1)
    expect(
      shapes(running).filter(
        (shape) => shape.op === 'fill' && shape.colour === PLAIN_COLOURS.accent,
      ).length,
    ).toBe(1)
  })

  it('reading a device changes nothing it puts out', async () => {
    const settings: Record<string, Record<string, number>> = {
      'auto-filter': { lfoAmount: 100, lfoRateHz: 3, envAmount: 60, resonance: 6 },
      'ambient-eq': { clear: 1, clearTime: 0.2, lowCut: 80, presence: 4 },
    }
    for (const [id, values] of Object.entries(settings)) {
      const params = stock.get(id)?.params ?? {}
      const read = await loadWasmDevice(id, RATE)
      const unread = await loadWasmDevice(id, RATE)
      for (const device of [read, unread])
        for (const [name, value] of Object.entries(values)) device.set(params[name], value)
      const readings = Object.keys(stock.get(id)?.meters ?? {}).length
      expect(readings).toBeGreaterThan(0)
      const noise = noiseSource()
      const block = new Float32Array(BLOCK)
      let different = 0
      for (let done = 0; done < RATE * 1.5; done += BLOCK) {
        // Sound, a silence long enough to fall asleep in, and sound again.
        const silent = done > RATE * 0.5 && done < RATE
        for (let i = 0; i < BLOCK; i++)
          block[i] = silent
            ? 0
            : 0.1 * noise() + 0.05 * Math.sin((2 * Math.PI * 404 * (done + i)) / RATE)
        read.processBlock(block)
        unread.processBlock(block)
        for (let twice = 0; twice < 2; twice++)
          for (let index = 0; index < readings; index++) read.device.device_meter?.(index)
        const a = read.view(read.device.device_out_left(), BLOCK)
        const b = unread.view(unread.device.device_out_left(), BLOCK)
        for (let i = 0; i < BLOCK; i++) if (a[i] !== b[i]) different += 1
      }
      expect(different, id).toBe(0)
    }
  })
})
