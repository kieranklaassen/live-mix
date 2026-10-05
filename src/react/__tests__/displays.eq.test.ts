// The truth of the EQ and filter displays: each curve against numbers worked
// out from the filter it stands for, what the handles set, what the three
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
  TAMER_FOOT_DB,
  TAMER_MOST_DB,
  TAMER_POINTS,
  TAMER_TOP_DB,
  autoFilterDb,
  autoFilterSweep,
  biquadTurns,
  clearCuts,
  seriesDb,
  svfDb,
  tamerCuts,
  tamerQ,
  tamerWidth,
} from '../components/displays/eq'
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
  it('is six windows, each with handles', () => {
    expect(Object.keys(EQ_FACES).sort()).toEqual(
      ['ambient-eq', 'auto-filter', 'eq3', 'filter', 'parametric-eq', 'tamer'].sort(),
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

  it('sets the type on a patch of the plate: a grid line or the curve can run where the word stands', () => {
    for (const type of [0, 1, 5]) {
      const drawn = filter.draw({ values: { type } })
      const name = drawn.words().find((word) => /pass|Peak/.test(word))
      expect(name).toBeDefined()
      const patch = patchUnder(drawn, name ?? '', PLAIN_COLOURS.plate)
      expect(patch, `under "${name}"`).not.toBeNull()
      expect(patch?.h).toBeGreaterThanOrEqual(8)
    }
  })

  it('names its types on the knob as the display names them', () => {
    expect(filter.params.type.choices).toEqual([
      'Low pass',
      'High pass',
      'Band pass',
      'Low shelf',
      'High shelf',
      'Peak',
      'Notch',
      'All pass',
    ])
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

describe('the Parametric EQ display', () => {
  const parametric = face('parametric-eq')
  /** A little past the bands' ±18 dB, as the display's scale is. */
  const SCALE = 20

  it('draws a narrow band up to its point wherever the point stands between two pixels', () => {
    // Q 10 is a tenth of the frequency wide, about two pixels: moved a quarter
    // of a pixel at a time, its top must stay at the gain its point stands at.
    const from = xOfHz(1000, parametric.box)
    for (let step = 0; step < 12; step++) {
      const x = from + step / 4
      const hz = 20 * Math.pow(1000, (x - parametric.box.x) / parametric.box.w)
      const values = { band2Freq: hz, band2Q: 10, band2Gain: 18 }
      const curve = mainCurve(parametric.draw({ values }))
      const top = Math.min(...curve.map(([, y]) => y))
      const point = parametric.handle('band2', values)
      expect(point.y).toBeCloseTo(yOfDb(18, parametric.box, SCALE, -SCALE), 6)
      expect(Math.abs(top - point.y), `at x = ${x}`).toBeLessThan(0.2)
      expect(dbAt(curve, hz, parametric.box, SCALE, -SCALE)).toBeCloseTo(18, 1)
    }
  })

  it('draws a narrow cut down to its point too, and two bands each through their own frequency', () => {
    const values = {
      band1Freq: 333,
      band1Q: 10,
      band1Gain: -18,
      band3Freq: 3210,
      band3Q: 10,
      band3Gain: 12,
    }
    const curve = mainCurve(parametric.draw({ values }))
    expect(dbAt(curve, 333, parametric.box, SCALE, -SCALE)).toBeCloseTo(-18, 1)
    expect(dbAt(curve, 3210, parametric.box, SCALE, -SCALE)).toBeCloseTo(12, 1)
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

describe('the Tamer display', () => {
  const tamer = face('tamer')
  const { box } = tamer
  const level = (db: number): number => yOfDb(db, box, TAMER_TOP_DB, TAMER_FOOT_DB)
  /** What the drawn curve says is cut at a frequency, in dB. */
  const cutAt = (drawn: RecordingContext, hz: number): number =>
    dbAt(mainCurve(drawn), hz, box, TAMER_TOP_DB, TAMER_FOOT_DB)
  /** The one dotted line: the shape of one cut. */
  const dotted = (drawn: RecordingContext): [number, number][] => {
    const lines = shapes(drawn).filter(
      (shape) => shape.op === 'stroke' && shape.dash.length > 0 && shape.points.length > 10,
    )
    expect(lines.length, 'one dotted line').toBe(1)
    return lines[0].points
  }
  const inAccent = (drawn: RecordingContext): Shape[] =>
    shapes(drawn).filter((shape) => shape.colour === PLAIN_COLOURS.accent)
  /** The thirteen readings with these places cut by so many dB. */
  const readings = (cuts: Record<number, number>, reduction: number): Record<string, number> => {
    const packed = new Array<number>(12).fill(0)
    for (const [place, cut] of Object.entries(cuts))
      packed[Math.floor(Number(place) / 4)] +=
        Math.round(-cut * 2) * Math.pow(64, Number(place) % 4)
    return Object.fromEntries([
      ['reduction', reduction],
      ...packed.map((value, r) => [`cut${r + 1}`, value]),
    ]) as Record<string, number>
  }
  const read = (meters: Readonly<Record<string, number>>): number[] => [
    ...tamerCuts((name) => meters[name], new Float32Array(48)),
  ]

  it('hangs its scale from the 0 dB line, with room over it for a line of words', () => {
    // The points of the range stand on the 0 dB line and the words at the
    // head: a point in hand is 5 px to its rim, a line of words 12 px deep.
    expect(level(0)).toBeGreaterThan(box.y + 12 + 5)
    expect(level(0)).toBeLessThan(box.y + box.h / 3)
    // The deepest cut there is stands whole over the foot.
    expect(TAMER_MOST_DB).toBe(18)
    expect(level(-TAMER_MOST_DB) + 5).toBeLessThan(box.y + box.h)
  })

  it('has the places of the curve where the device reads them', () => {
    // `display_hz_`: 48 places evenly spaced in pitch from 40 Hz to 20 kHz.
    expect(TAMER_POINTS.length).toBe(48)
    expect(TAMER_POINTS[0]).toBe(40)
    expect(TAMER_POINTS[47]).toBeCloseTo(20000, 6)
    const step = Math.log2(20000 / 40) / 47
    for (let place = 1; place < 48; place++)
      expect(Math.log2(TAMER_POINTS[place] / TAMER_POINTS[place - 1])).toBeCloseTo(step, 9)
  })

  it('reads every place out of the twelve readings', () => {
    // The ends of a digit too: half a decibel is 1, and 63 is 31.5 dB.
    const cuts = { 0: -0.5, 3: -31.5, 4: -18, 5: -3.5, 22: -9, 23: -0.5, 44: -31.5, 47: -12 }
    const meters = readings(cuts, -18)
    // As the device packs them: place 5 is the second digit of the second reading.
    expect(meters.cut1).toBe(1 + 63 * 262144)
    expect(meters.cut2).toBe(36 + 7 * 64)
    expect(meters.cut12).toBe(63 + 24 * 262144)
    const places = read(meters)
    for (let place = 0; place < 48; place++)
      expect(places[place], `place ${place}`).toBe((cuts as Record<number, number>)[place] ?? 0)
    // Four places at their deepest are the largest reading there is, and a float holds it exactly.
    const largest = Math.pow(64, 4) - 1
    expect(largest).toBeLessThan(Math.pow(2, 24))
    expect(Math.fround(largest)).toBe(largest)
    expect(read({ cut7: largest }).filter((cut) => cut !== 0)).toEqual([-31.5, -31.5, -31.5, -31.5])
    // A reading that is no number of the device's is no cut.
    for (const bad of [Number.NaN, -6, Number.POSITIVE_INFINITY])
      expect(
        read(Object.fromEntries(Array.from({ length: 12 }, (_, r) => [`cut${r + 1}`, bad]))).every(
          (cut) => cut === 0,
        ),
        String(bad),
      ).toBe(true)
  })

  interface Cut {
    hz: number
    q: number
    /** The filter's gain in dB, 0 or below. */
    db: number
  }

  /**
   * `Tamer::meter(index)` for index 1 to 12, term by term. The cut at a place
   * is the sum over the live filters of each one's skirt there, by the rule
   * the device solves its gains with: `1 / (1 + Q²(r − 1/r)²)` of the gain at
   * `r` times the centre. Four places to a reading from the highest digit
   * down, each `int(2 * cut + 0.5)` kept to 0..63.
   */
  const skirt = (r: number, q: number): number => {
    const d = q * (r - 1 / r)
    return 1 / (1 + d * d)
  }
  const cutAsTheDevice = (filters: readonly Cut[], place: number): number => {
    let db = 0
    for (const filter of filters) db -= filter.db * skirt(TAMER_POINTS[place] / filter.hz, filter.q)
    return db
  }
  const packedAsTheDevice = (filters: readonly Cut[], index: number): number => {
    const first = (index - 1) * 4
    let packed = 0
    for (let place = first + 3; place >= first; place--) {
      const steps = Math.trunc(2 * cutAsTheDevice(filters, place) + 0.5)
      packed = packed * 64 + Math.min(63, Math.max(0, steps))
    }
    return Math.fround(packed)
  }
  const asTheDevice = (filters: readonly Cut[]): Record<string, number> => ({
    reduction: Math.min(0, ...filters.map((filter) => filter.db)),
    ...Object.fromEntries(
      Array.from({ length: 12 }, (_, r) => [`cut${r + 1}`, packedAsTheDevice(filters, r + 1)]),
    ),
  })

  it('brings a cut of 3.5 dB at one place back as 3.5 dB at that frequency', () => {
    // A filter far narrower than the places are apart, centred on place 21:
    // the second digit of the sixth reading (places 20 to 23), 7 half
    // decibels times 64, and nothing anywhere else.
    const meters = asTheDevice([{ hz: TAMER_POINTS[21], q: 40, db: -3.5 }])
    expect(meters).toEqual({ ...readings({}, -3.5), cut6: 448 })
    expect(TAMER_POINTS[21]).toBeCloseTo(40 * Math.pow(500, 21 / 47), 9)
    expect(TAMER_POINTS[21]).toBeCloseTo(642.7, 1)
    const running = tamer.run(1, { meters, signal: testSignal() })
    expect(cutAt(running, TAMER_POINTS[21])).toBeCloseTo(-3.5, 2)
    expect(cutAt(running, TAMER_POINTS[20])).toBeCloseTo(0, 6)
    expect(cutAt(running, TAMER_POINTS[22])).toBeCloseTo(0, 6)
    expect(running.words()).toContain('−3.5 dB')
  })

  it('reads the readings as the device packs them: skirts that add, rounded, and kept to a digit', () => {
    // Two wide filters lying over one another and a third far off. Where the
    // two overlap the curve is deeper than either: their skirts add.
    const filters = [
      { hz: 900, q: 0.667, db: -9 },
      { hz: 1400, q: 0.667, db: -7 },
      { hz: 9000, q: 4, db: -4.2 },
    ]
    const meters = asTheDevice(filters)
    const places = read(meters)
    for (let place = 0; place < 48; place++) {
      const exact = cutAsTheDevice(filters, place)
      // To the half decibel, a half rounding away from 0.
      expect(places[place], `place ${place}`).toBe(0 - Math.floor(2 * exact + 0.5) / 2)
      expect(Math.abs(places[place] + exact)).toBeLessThanOrEqual(0.25)
    }
    expect(Math.min(...places)).toBeLessThan(-12)
    const running = tamer.run(1, { meters, signal: testSignal() })
    for (const place of [0, 12, 24, 27, 30, 41, 47])
      expect(cutAt(running, TAMER_POINTS[place]), `place ${place}`).toBeCloseTo(places[place], 2)
    // A sum deeper than a digit holds, which the device's 18 dB a filter never
    // reaches at one place, reads as 31.5 dB and leaves the places beside it alone.
    const deep = asTheDevice([
      { hz: TAMER_POINTS[9], q: 200, db: -18 },
      { hz: TAMER_POINTS[9], q: 200, db: -18 },
    ])
    expect(
      read(deep)
        .map((cut, place) => (cut === 0 ? null : [place, cut]))
        .filter(Boolean),
    ).toEqual([[9, -31.5]])
  })

  it('shows in the accent what is being cut, and nothing at rest or switched off', () => {
    const meters = readings({ 20: -4, 21: -8.5, 22: -6 }, -5.2)
    const running = tamer.run(1, { meters, signal: testSignal() })
    // One fill, between the 0 dB line and the curve, and the curve over it in the ink.
    const accent = inAccent(running)
    expect(accent.length).toBe(1)
    expect(accent[0].op).toBe('fill')
    expect(cutAt(running, TAMER_POINTS[21])).toBeCloseTo(-8.5, 2)
    expect(cutAt(running, TAMER_POINTS[20])).toBeCloseTo(-4, 2)
    expect(cutAt(running, TAMER_POINTS[30])).toBe(0)
    // The fill closes along the 0 dB line.
    expect(accent[0].points.slice(-2).map(([, y]) => y)).toEqual([level(0), level(0)])
    // It comes in eased, never past the reading.
    const early = tamer.run(0.1, { meters, signal: testSignal() })
    expect(cutAt(early, TAMER_POINTS[21])).toBeLessThan(-1)
    expect(cutAt(early, TAMER_POINTS[21])).toBeGreaterThan(-8.5)

    // At rest, switched off and without sound nothing is being cut: a flat line at 0, no accent.
    const stills = [
      tamer.draw({ meters }),
      tamer.run(1, { meters, signal: testSignal(), powered: false }),
      tamer.run(1, { meters }),
      tamer.run(1, { meters: readings({}, 0), signal: testSignal() }),
    ]
    for (const still of stills) {
      expect(inAccent(still)).toEqual([])
      for (const [, y] of mainCurve(still)) expect(y).toBe(level(0))
      expect(still.words()).toEqual(['0.0 dB'])
    }
  })

  it('says the deepest cut as the deeper of the reading and the curve', () => {
    const number = (meters: Record<string, number>): string[] =>
      tamer.run(1, { meters, signal: testSignal() }).words()
    // Filters that lie over one another add: the curve hangs lower than the deepest of them.
    expect(number(readings({ 20: -4, 21: -8.5, 22: -6 }, -5.2))).toEqual(['−8.5 dB'])
    // A cut narrower than the places are apart falls between two of them.
    expect(number(readings({ 25: -16 }, -17.8))).toEqual(['−17.8 dB'])
    // A reading that is no number is no cut.
    expect(number(readings({}, Number.NaN))).toEqual(['0.0 dB'])
  })

  it('carries the curve level from its first place to the left edge', () => {
    // Under 40 Hz the device reads nothing.
    const curve = mainCurve(tamer.run(1, { meters: readings({ 0: -3 }, -3), signal: testSignal() }))
    expect(curve.length).toBe(49)
    expect(curve[0][0]).toBe(box.x)
    expect(curve[1][0]).toBeCloseTo(xOfHz(40, box), 9)
    expect(curve[0][1]).toBe(curve[1][1])
    expect(curve[1][1]).toBeCloseTo(level(-3), 2)
    expect(curve[48][0]).toBeCloseTo(box.x + box.w, 9)
  })

  it('lays the plate back over what lies outside From and To, with a post at each', () => {
    /** The veils: the patches of the plate that are as high as the box. */
    const veils = (values: Record<string, number>): number[][] => {
      const drawn = tamer.draw({ values })
      let fill = ''
      const found: number[][] = []
      for (const call of drawn.calls) {
        if (call.name === 'set fillStyle') fill = String(call.args[0])
        else if (call.name === 'fillRect' && fill === PLAIN_COLOURS.plate && call.args[3] === box.h)
          found.push(call.args as number[])
      }
      return found
    }
    const [below, above] = veils({ from: 300, to: 5000 })
    expect(below[0]).toBe(box.x)
    expect(below[2]).toBeCloseTo(xOfHz(300, box) - box.x, 9)
    expect(above[0]).toBeCloseTo(xOfHz(5000, box), 9)
    expect(above[0] + above[2]).toBeCloseTo(box.x + box.w, 9)
    // From above To is no range at all: the whole of it is laid over, once.
    const none = veils({ from: 2000, to: 1000 })
    expect(none.length).toBe(2)
    expect(none[0][0] + none[0][2]).toBeCloseTo(none[1][0], 9)
    expect(none[0][2] + none[1][2]).toBeCloseTo(box.w, 9)
    // A post from the 0 dB line to the foot at each end of the range.
    const posts = shapes(tamer.draw({ values: { from: 300, to: 5000 } })).filter(
      (shape) =>
        shape.op === 'stroke' &&
        shape.points.length === 2 &&
        shape.points[0][1] === level(0) &&
        shape.points[1][1] === box.y + box.h,
    )
    expect(posts.map((post) => post.points[0][0])).toEqual([
      Math.floor(xOfHz(300, box)) + 0.5,
      Math.floor(xOfHz(5000, box)) + 0.5,
    ])
  })

  it('ports the width of a cut: twice what Sharpness listens with', () => {
    // `width_for`: an octave at 0, a twelfth at 1.
    expect(tamerWidth(0)).toBe(1)
    expect(tamerWidth(1)).toBeCloseTo(1 / 12, 9)
    expect(tamerWidth(0.5)).toBeCloseTo(Math.pow(2, -0.5 * 3.5849625), 9)
    // `lay_out_width`: Q = 1 / (2 sinh(ln 2 / 2 × 2w)), with the width kept
    // in octaves up to the top by w / sin w, which is nothing low down.
    for (const sharpness of [0, 0.3, 0.6, 1]) {
      const plain = 1 / (2 * Math.sinh((Math.LN2 / 2) * 2 * tamerWidth(sharpness)))
      expect(tamerQ(sharpness, 100, RATE) / plain).toBeCloseTo(1, 3)
      expect(tamerQ(sharpness, 1000, RATE) / plain).toBeGreaterThan(0.99)
      expect(tamerQ(sharpness, 1000, RATE)).toBeLessThan(plain)
    }
    expect(tamerQ(0, 100, RATE)).toBeCloseTo(0.667, 3)
    expect(tamerQ(1, 100, RATE)).toBeCloseTo(8.65, 2)
    // The device's own design, `alpha = sin w × sinh(ln 2 / 2 × width × w / sin w)`,
    // is the kit's `sin w / 2Q` at that Q: high up, where the two would part, too.
    const w = (2 * Math.PI * 6000) / RATE
    const alpha = Math.sin(w) * Math.sinh(((Math.LN2 / 2) * 2 * tamerWidth(0.4) * w) / Math.sin(w))
    expect(Math.sin(w) / (2 * tamerQ(0.4, 6000, RATE))).toBeCloseTo(alpha, 12)
  })

  it('draws the shape of one cut as a dotted line: Depth times 18 dB deep at the middle of the range', () => {
    const values = { from: 200, to: 5000, depth: 0.5, sharpness: 0.3 }
    const line = dotted(tamer.draw({ values }))
    const at = (hz: number): number => dbAt(line, hz, box, TAMER_TOP_DB, TAMER_FOOT_DB)
    // The middle of 200 Hz and 5 kHz, in pitch, is 1 kHz.
    expect(at(1000)).toBeCloseTo(-9, 2)
    expect(at(25)).toBeCloseTo(0, 1)
    expect(at(19000)).toBeCloseTo(0, 1)
    // It is the peak the device would make there.
    const peak = biquad('peaking', 1000, tamerQ(0.3, 1000, RATE), -9, RATE)
    for (const hz of [300, 700, 1000, 1500, 4000])
      expect(at(hz)).toBeCloseTo(biquadDb(peak, hz, RATE), 1)
    // It follows the range and Depth: all of the 18 dB at Depth 1.
    const moved = dotted(tamer.draw({ values: { from: 1000, to: 16000, depth: 1 } }))
    expect(dbAt(moved, 4000, box, TAMER_TOP_DB, TAMER_FOOT_DB)).toBeCloseTo(-18, 2)
    // Whole at its foot, however narrow, wherever the middle falls between two pixels.
    for (const to of [3000, 3100, 3200, 3300])
      expect(
        Math.max(
          ...dotted(tamer.draw({ values: { to, depth: 0.5, sharpness: 1 } })).map(([, y]) => y),
        ),
      ).toBeCloseTo(level(-9), 6)
  })

  it('draws the cut narrower as Sharpness rises: half its depth where the width says', () => {
    /** How wide the dotted cut is at half its depth, in octaves. */
    const width = (sharpness: number): number => {
      const line = dotted(tamer.draw({ values: { from: 200, to: 5000, depth: 0.5, sharpness } }))
      const half = level(-4.5)
      const crossings: number[] = []
      for (let i = 1; i < line.length; i++) {
        const [x0, y0] = line[i - 1]
        const [x1, y1] = line[i]
        if (y0 < half !== y1 < half) crossings.push(x0 + ((half - y0) / (y1 - y0)) * (x1 - x0))
      }
      expect(crossings.length).toBe(2)
      return ((crossings[1] - crossings[0]) / box.w) * Math.log2(1000)
    }
    // The width of a peak is between the places where it has half its gain in
    // dB: two octaves at Sharpness 0, and 2 × 2^(−0.5 × 3.585) = 0.58 at 0.5.
    expect(width(0)).toBeCloseTo(2 * tamerWidth(0), 1)
    expect(width(0.5)).toBeCloseTo(2 * tamerWidth(0.5), 1)
    expect(width(0.5)).toBeCloseTo(0.58, 1)
    expect(width(0.8)).toBeLessThan(width(0.5))
  })

  it('draws the cut flat at Depth 0, with its point on the 0 dB line', () => {
    for (const sharpness of [0, 0.6, 1]) {
      const values = { depth: 0, sharpness }
      for (const [, y] of dotted(tamer.draw({ values }))) expect(y).toBeCloseTo(level(0), 9)
      expect(tamer.handle('depth', values).y).toBe(level(0))
    }
  })

  it('has a point for each end of the range and one at the foot of the cut', () => {
    const values = { from: 200, to: 5000, depth: 0.5, sharpness: 0.6 }
    const points = tamer.handles(values)
    expect(points.map((point) => point.key)).toEqual(['from', 'depth', 'to'])
    expect(points.map((point) => point.name)).toEqual(['From', 'Depth', 'To'])

    // The ends stand on the 0 dB line at their frequencies; across sets them, in Hz.
    const [from, depth, to] = points
    expect([from.x, from.y]).toEqual([xOfHz(200, box), level(0)])
    expect([to.x, to.y]).toEqual([xOfHz(5000, box), level(0)])
    expect(Object.keys(from.drag(xOfHz(500, box), 70))).toEqual(['from'])
    expect(from.drag(xOfHz(500, box), 70).from).toBeCloseTo(500, 6)
    expect(to.drag(xOfHz(9000, box), 3).to).toBeCloseTo(9000, 6)
    // Each keeps to the frequencies its knob has.
    expect(from.drag(-20, 0)).toEqual({ from: 120 })
    expect(from.drag(xOfHz(9000, box), 0)).toEqual({ from: 2000 })
    expect(to.drag(xOfHz(200, box), 0)).toEqual({ to: 1000 })
    expect(to.drag(900, 0)).toEqual({ to: 20000 })
    expect(from.wheel).toBeUndefined()
    expect(to.wheel).toBeUndefined()
    expect(from.reset?.()).toEqual({ from: 120 })
    expect(to.reset?.()).toEqual({ to: 16000 })

    // The third stands at the foot of the cut, in the middle of the range: up and down is Depth.
    expect(depth.x).toBeCloseTo(xOfHz(1000, box), 9)
    expect(depth.y).toBeCloseTo(level(-9), 9)
    expect(Object.keys(depth.drag(3, level(-13.5)))).toEqual(['depth'])
    expect(depth.drag(3, level(-13.5)).depth).toBeCloseTo(0.75, 6)
    expect(depth.drag(depth.x, depth.y).depth).toBeCloseTo(0.5, 6)
    // Over the line there is nothing to cut, and under 18 dB no more.
    expect(depth.drag(depth.x, level(0))).toEqual({ depth: 0 })
    expect(depth.drag(depth.x, -50)).toEqual({ depth: 0 })
    expect(depth.drag(depth.x, 500)).toEqual({ depth: 1 })
    expect(depth.reset?.()).toEqual({ depth: 0.5 })
    // The wheel on it is Sharpness, twenty notches from end to end.
    expect(depth.wheel?.(1).sharpness).toBeCloseTo(0.65, 9)
    expect(depth.wheel?.(-2).sharpness).toBeCloseTo(0.5, 9)
    expect(Object.keys(depth.wheel?.(1) ?? {})).toEqual(['sharpness'])
    expect(depth.wheel?.(20)).toEqual({ sharpness: 1 })
    expect(depth.wheel?.(-20)).toEqual({ sharpness: 0 })

    // At the deepest cut the point is whole on the display, 5 px to its rim in hand.
    const deepest = tamer.handle('depth', { depth: 1 })
    expect(deepest.y).toBeCloseTo(level(-18), 9)
    expect(deepest.y + 5).toBeLessThan(box.y + box.h)
    // It goes with the range: the middle of 1 and 4 kHz is 2 kHz.
    expect(tamer.handle('depth', { from: 1000, to: 4000 }).x).toBeCloseTo(xOfHz(2000, box), 9)
  })

  it('keeps every point clear of the others at each factory preset', () => {
    // The ends stand on one line and can be brought together, and at Depth 0
    // the third is on that line too: no preset has them so.
    const presets = stock.get('tamer')?.presets ?? {}
    expect(Object.keys(presets).length).toBeGreaterThanOrEqual(10)
    for (const [name, preset] of Object.entries(presets)) {
      const values: Record<string, number> = {}
      for (const [param, value] of Object.entries(preset))
        if (value !== undefined) values[param] = value
      const points = tamer.handles(values)
      for (const a of points)
        for (const b of points)
          if (a.key < b.key)
            expect(
              Math.hypot(a.x - b.x, a.y - b.y),
              `${name}: ${a.key} and ${b.key}`,
            ).toBeGreaterThan(7)
    }
  })

  it('says what the point in hand is at, and Listen while Listen is on', () => {
    const said = (options: FrameOptions): [string, number, number][] =>
      tamer
        .draw(options)
        .calls.filter((call) => call.name === 'fillText')
        .map((call) => call.args as [string, number, number])
    const head = box.y + 8
    const number: [string, number, number] = ['0.0 dB', box.x + box.w - 2, head]
    expect(said({})).toEqual([number])
    // The point in hand at the left of the head: an end in Hz, the cut in dB and nothing else.
    expect(said({ hot: 'from' })).toEqual([number, ['From  120 Hz', box.x + 2, head]])
    expect(said({ hot: 'to' })).toEqual([number, ['To  16 kHz', box.x + 2, head]])
    expect(said({ hot: 'depth', values: { depth: 0.25, sharpness: 0.9 } })).toEqual([
      number,
      ['Depth  −4.5 dB', box.x + 2, head],
    ])
    // Listen keeps its corner while a point is taken: what the point is at goes to the foot.
    expect(said({ values: { listen: 1 } })).toEqual([number, ['Listen', box.x + 2, head]])
    expect(said({ values: { listen: 1 }, hot: 'from' })).toEqual([
      number,
      ['Listen', box.x + 2, head],
      ['From  120 Hz', box.x + 2, box.y + box.h - 3],
    ])
    // The words at the head keep their corners wherever the points of the range stand.
    for (const from of [120, 400, 2000])
      for (const to of [1000, 5000, 20000])
        for (const depth of [0, 1])
          expect(
            said({ values: { from, to, depth, listen: 1 } }),
            `${from} Hz to ${to} Hz at Depth ${depth}`,
          ).toEqual([number, ['Listen', box.x + 2, head]])
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
    for (const depth of [0, 1])
      for (const from of [120, 2000]) {
        settings.push(['tamer', 'depth', { depth, from }])
        settings.push(['tamer', 'from', { depth, from, listen: 1 }])
        for (const to of [1000, 20000]) settings.push(['tamer', 'to', { depth, from, to }])
      }
    expect(settings.length).toBeGreaterThan(90)
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

  /**
   * Three seconds through the Tamer of a bed of pink noise at 0.05 RMS with a
   * sine of amplitude 0.05 at `hz` standing out of it, about 15 dB over the
   * bed in its twelfth of an octave: the thirteen readings as they stand at
   * the end, and what the device did to the sine over the last second, in dB.
   */
  async function tamed(
    values: Record<string, number>,
    hz: number,
  ): Promise<{ meters: Record<string, number>; measured: number }> {
    const device = await loadWasmDevice('tamer', RATE)
    const params = stock.get('tamer')?.params ?? {}
    for (const [name, value] of Object.entries(values)) device.set(params[name], value)
    // White noise through three one-pole filters whose sum falls 3 dB an octave.
    const white = noiseSource()
    const bed = new Float32Array(RATE * 3)
    let b0 = 0
    let b1 = 0
    let b2 = 0
    let power = 0
    for (let n = 0; n < bed.length; n++) {
      const sample = white()
      b0 = 0.99765 * b0 + sample * 0.099046
      b1 = 0.963 * b1 + sample * 0.2965164
      b2 = 0.57 * b2 + sample * 1.0526913
      bed[n] = b0 + b1 + b2 + sample * 0.1848
      power += bed[n] * bed[n]
    }
    const scale = 0.05 / Math.sqrt(power / bed.length)
    const step = (2 * Math.PI * hz) / RATE
    const block = new Float32Array(BLOCK)
    // The sine in what goes in and in what comes out, by its two quadratures: the noise falls out of the sum.
    const tone = { inSin: 0, inCos: 0, outSin: 0, outCos: 0 }
    for (let done = 0; done + BLOCK <= bed.length; done += BLOCK) {
      for (let i = 0; i < BLOCK; i++)
        block[i] = scale * bed[done + i] + 0.05 * Math.sin(step * (done + i))
      device.processBlock(block)
      if (done < RATE * 2) continue
      const out = device.view(device.device.device_out_left(), BLOCK)
      for (let i = 0; i < BLOCK; i++) {
        const sin = Math.sin(step * (done + i))
        const cos = Math.cos(step * (done + i))
        tone.inSin += block[i] * sin
        tone.inCos += block[i] * cos
        tone.outSin += out[i] * sin
        tone.outCos += out[i] * cos
      }
    }
    const meters: Record<string, number> = {}
    Object.keys(stock.get('tamer')?.meters ?? {}).forEach(
      (name, index) => (meters[name] = device.device.device_meter?.(index) ?? Number.NaN),
    )
    const measured =
      20 * Math.log10(Math.hypot(tone.outSin, tone.outCos) / Math.hypot(tone.inSin, tone.inCos))
    return { meters, measured }
  }

  /** What the Tamer display draws of these readings once it has eased to them. */
  function tamerDrawn(meters: Record<string, number>, values: Record<string, number>) {
    const tamer = face('tamer')
    const running = tamer.run(1, { meters, signal: testSignal(), values })
    const curve = mainCurve(running)
    return {
      running,
      at: (hz: number): number => dbAt(curve, hz, tamer.box, TAMER_TOP_DB, TAMER_FOOT_DB),
    }
  }

  it('the Tamer: a tone that stands out of its bed is cut where the curve hangs lowest, by what the curve says', async () => {
    const ringing = 1130
    // Sharpness 0: the cuts are two octaves wide, and the places of the curve resolve them.
    const values = { depth: 1, sharpness: 0 }
    const { meters, measured } = await tamed(values, ringing)
    expect(Object.keys(meters)).toEqual([
      'reduction',
      ...Array.from({ length: 12 }, (_, r) => `cut${r + 1}`),
    ])
    expect(meters.reduction).toBeLessThan(-3)
    const cuts = tamerCuts((name) => meters[name], new Float32Array(48))
    const deepest = cuts.indexOf(Math.min(...cuts))
    expect(Math.abs(Math.log2(TAMER_POINTS[deepest] / ringing))).toBeLessThan(0.5)

    const { running, at } = tamerDrawn(meters, values)
    // The curve at the tone is what the device does to the tone.
    expect(Math.abs(at(ringing) - measured), `${at(ringing)} drawn, ${measured} done`).toBeLessThan(
      1,
    )
    expect(at(ringing)).toBeCloseTo(Math.min(...cuts), 0)
    // `reduction` is the deepest of the device's filters. Here they lie over
    // one another and their cuts add, so the curve is no shallower than that
    // reading says, and the number on the display is the curve's.
    expect(at(ringing)).toBeLessThan(meters.reduction + 0.5)
    expect(running.words()).toEqual([
      `−${Math.max(-Math.min(...cuts), -meters.reduction).toFixed(1)} dB`,
    ])
    // Two octaves away a third of it at most is left, and three octaves away next to nothing.
    for (const octaves of [-2, 2]) {
      expect(at(ringing * Math.pow(2, octaves))).toBeGreaterThan(at(ringing) / 3)
      expect(at(ringing * Math.pow(2, octaves))).toBeLessThanOrEqual(0)
    }
    for (const octaves of [-3, 3]) expect(at(ringing * Math.pow(2, octaves))).toBeGreaterThan(-1)
    expect(
      shapes(running).filter(
        (shape) => shape.op === 'fill' && shape.colour === PLAIN_COLOURS.accent,
      ).length,
    ).toBe(1)
  })

  it('the Tamer: a cut narrower than the places are apart reads between the deepest filter and nothing', async () => {
    const ringing = 1130
    // Sharpness 1: a cut is a sixth of an octave wide, and the places are 0.19 of one apart.
    const values = { depth: 1, sharpness: 1 }
    const { meters } = await tamed(values, ringing)
    expect(meters.reduction).toBeLessThan(-9)
    const cuts = tamerCuts((name) => meters[name], new Float32Array(48))
    const octavesOff = TAMER_POINTS.map((hz) => Math.abs(Math.log2(hz / ringing)))
    const nearest = octavesOff.indexOf(Math.min(...octavesOff))
    expect(cuts.indexOf(Math.min(...cuts))).toBe(nearest)
    expect(cuts[nearest]).toBeLessThan(-3)
    expect(cuts[nearest]).toBeGreaterThanOrEqual(meters.reduction - 0.25)
    const { running, at } = tamerDrawn(meters, values)
    expect(at(TAMER_POINTS[nearest])).toBeCloseTo(cuts[nearest], 1)
    expect(at(ringing * 2)).toBeGreaterThan(-1)
    expect(at(ringing / 2)).toBeGreaterThan(-1)
    // The number is the filter's, which is the deeper.
    expect(running.words()).toEqual([`−${(-meters.reduction).toFixed(1)} dB`])
  })

  it('reading a device changes nothing it puts out', async () => {
    const settings: Record<string, Record<string, number>> = {
      'auto-filter': { lfoAmount: 100, lfoRateHz: 3, envAmount: 60, resonance: 6 },
      'ambient-eq': { clear: 1, clearTime: 0.2, lowCut: 80, presence: 4 },
      tamer: { depth: 1, sharpness: 0.3, time: 10 },
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
