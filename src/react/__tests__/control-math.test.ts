import { describe, expect, it } from 'vitest'

import { dbToGain, gainToDb } from '../../core/devices/native/units'
import { type ParamSpec } from '../../core/params'
import {
  clamp,
  dbToMeterPosition,
  denormalizeValue,
  FADER_MAX_DB,
  FADER_MIN_DB,
  faderDbToLevel,
  formatControlValue,
  formatParamValue,
  formatTimeSec,
  isChoiceParam,
  knobAngleToNorm,
  levelToFaderDb,
  levelToMeterPosition,
  normalizeValue,
  normToKnobAngle,
  paramStep,
  paramTaper,
  pointerDeltaToNormDelta,
  quantize,
  stepBy,
  wheelDeltaToNormDelta,
} from '../components/control-math'

describe('clamp / quantize / stepBy', () => {
  it('clamps into range', () => {
    expect(clamp(-1, 0, 1)).toBe(0)
    expect(clamp(2, 0, 1)).toBe(1)
    expect(clamp(0.5, 0, 1)).toBe(0.5)
    expect(clamp(Number.NaN, 0, 1)).toBe(0)
  })

  it('quantizes to the step grid; a zero step only clamps', () => {
    expect(quantize(0.334, 0.01, 0, 1)).toBe(0.33)
    expect(quantize(21.4, 1, 0, 250)).toBe(21)
    expect(quantize(0.33333, 0, 0, 1)).toBe(0.33333)
    expect(quantize(5, 0, 0, 1)).toBe(1)
  })

  it('steps with fine mode', () => {
    expect(stepBy(0.5, 1, 0.01, 0, 1)).toBe(0.51)
    expect(stepBy(0.5, 1, 0.01, 0, 1, true)).toBe(0.501)
    expect(stepBy(0.5, -10, 0.01, 0, 1)).toBe(0.4)
  })
})

describe('normalize / denormalize', () => {
  it('round-trips linear', () => {
    const n = normalizeValue(0.35, 0, 1, 'linear')
    expect(n).toBeCloseTo(0.35)
    expect(denormalizeValue(n, 0, 1, 'linear')).toBeCloseTo(0.35)
  })

  it('maps log taper for positive ranges and refuses non-positive minima', () => {
    const mid = denormalizeValue(0.5, 20, 20000, 'log')
    expect(mid).toBeCloseTo(Math.sqrt(20 * 20000))
    expect(normalizeValue(mid, 20, 20000, 'log')).toBeCloseTo(0.5, 5)
    expect(() => normalizeValue(1, 0, 10, 'log')).toThrow(RangeError)
  })

  it('applies skewed taper (more resolution near min when skew > 1)', () => {
    const linearHalf = denormalizeValue(0.5, 0, 1, 'linear')
    const skewedHalf = denormalizeValue(0.5, 0, 1, 'skewed', 2)
    expect(skewedHalf).toBeLessThan(linearHalf)
  })

  it('fader taper puts 0 dB near 80 % of a −60…+6 travel and round-trips', () => {
    const unity = normalizeValue(0, FADER_MIN_DB, FADER_MAX_DB, 'fader')
    expect(unity).toBeGreaterThan(0.78)
    expect(unity).toBeLessThan(0.82)
    expect(denormalizeValue(unity, FADER_MIN_DB, FADER_MAX_DB, 'fader')).toBeCloseTo(0, 9)
    expect(denormalizeValue(0, FADER_MIN_DB, FADER_MAX_DB, 'fader')).toBe(FADER_MIN_DB)
    expect(denormalizeValue(1, FADER_MIN_DB, FADER_MAX_DB, 'fader')).toBe(FADER_MAX_DB)
    for (const position of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      const db = denormalizeValue(position, FADER_MIN_DB, FADER_MAX_DB, 'fader')
      expect(normalizeValue(db, FADER_MIN_DB, FADER_MAX_DB, 'fader')).toBeCloseTo(position, 9)
    }
  })

  it('rejects inverted ranges', () => {
    expect(() => normalizeValue(0, 1, 0)).toThrow(RangeError)
  })
})

describe('fader law = DSP law (R33)', () => {
  it('converts fader dB through the same dbToGain/gainToDb the gain nodes use', () => {
    expect(faderDbToLevel(0)).toBe(1)
    expect(faderDbToLevel(-6)).toBeCloseTo(dbToGain(-6))
    expect(faderDbToLevel(FADER_MIN_DB)).toBe(0)
    expect(faderDbToLevel(-100)).toBe(0)
    expect(faderDbToLevel(Number.NEGATIVE_INFINITY)).toBe(0)
    expect(levelToFaderDb(1)).toBe(0)
    expect(levelToFaderDb(0.5)).toBeCloseTo(gainToDb(0.5))
    expect(levelToFaderDb(0)).toBe(FADER_MIN_DB)
    expect(levelToFaderDb(100)).toBe(FADER_MAX_DB)
    for (const db of [-40, -18, -6, -0.5, 3]) {
      expect(levelToFaderDb(faderDbToLevel(db))).toBeCloseTo(db, 9)
    }
  })

  it('places meter readings on the dB scale', () => {
    expect(dbToMeterPosition(0)).toBe(1)
    expect(dbToMeterPosition(-60)).toBe(0)
    expect(dbToMeterPosition(-30)).toBeCloseTo(0.5)
    expect(dbToMeterPosition(Number.NEGATIVE_INFINITY)).toBe(0)
    expect(dbToMeterPosition(3)).toBe(1)
    expect(levelToMeterPosition(1)).toBe(1)
    expect(levelToMeterPosition(0)).toBe(0)
    expect(levelToMeterPosition(dbToGain(-12))).toBeCloseTo(0.8)
    expect(dbToMeterPosition(-20, -40)).toBeCloseTo(0.5)
  })
})

describe('knob angle mapping', () => {
  it('maps 0 and 1 to sweep endpoints', () => {
    expect(normToKnobAngle(0)).toBe(-225)
    expect(normToKnobAngle(1)).toBe(45)
  })

  it('round-trips angle → norm for in-range angles', () => {
    expect(knobAngleToNorm(normToKnobAngle(0.25))).toBeCloseTo(0.25, 5)
    expect(knobAngleToNorm(normToKnobAngle(0.8))).toBeCloseTo(0.8, 5)
  })
})

describe('pointer and wheel deltas', () => {
  it('drag up increases value; fine reduces sensitivity', () => {
    expect(pointerDeltaToNormDelta(-60, 120)).toBeCloseTo(0.5)
    expect(pointerDeltaToNormDelta(-60, 120, true)).toBeCloseTo(0.125)
  })

  it('scroll up increases; line mode scales; fine is a tenth', () => {
    expect(wheelDeltaToNormDelta(-100)).toBeCloseTo(0.025)
    expect(wheelDeltaToNormDelta(100)).toBeCloseTo(-0.025)
    expect(wheelDeltaToNormDelta(-100, 0, true)).toBeCloseTo(0.0025)
    expect(wheelDeltaToNormDelta(-1, 1)).toBeCloseTo(wheelDeltaToNormDelta(-16))
  })
})

describe('drag accumulation', () => {
  /** Mirrors useParamControl.commitNorm: the pointer norm carries across frames. */
  function dragValues(deltas: number[], sensitivityPx: number, fine: boolean): number[] {
    let norm = normalizeValue(0.5, 0, 1)
    return deltas.map((dy) => {
      norm = clamp(norm + pointerDeltaToNormDelta(dy, sensitivityPx, fine), 0, 1)
      return quantize(denormalizeValue(norm, 0, 1), 0.01, 0, 1)
    })
  }

  it('accumulates sub-step fine drag across frames', () => {
    const values = dragValues(Array<number>(10).fill(-1), 110, true)
    expect(values[0]).toBe(0.5)
    expect(values.at(-1)).toBeGreaterThan(0.5)
  })

  it('lands in the same place for one jump or many small moves', () => {
    expect(dragValues(Array<number>(12).fill(-1), 110, true).at(-1)).toBe(
      dragValues([-12], 110, true).at(-1),
    )
  })
})

describe('formatting', () => {
  it('formats common units', () => {
    expect(formatControlValue(0.35, 'ratio')).toBe('0.35')
    expect(formatControlValue(0.35, '')).toBe('0.35')
    expect(formatControlValue(20, 'ms')).toBe('20 ms')
    expect(formatControlValue(2.5, 'ms')).toBe('2.5 ms')
    expect(formatControlValue(1.5, 's')).toBe('1.50 s')
    expect(formatControlValue(-6, 'dB')).toBe('-6.0 dB')
    expect(formatControlValue(3, 'dB')).toBe('+3.0 dB')
    expect(formatControlValue(Number.NEGATIVE_INFINITY, 'dB')).toBe('-∞ dB')
    expect(formatControlValue(440, 'Hz')).toBe('440 Hz')
    expect(formatControlValue(55.5, 'Hz')).toBe('55.5 Hz')
    expect(formatControlValue(2400, 'Hz')).toBe('2.40 kHz')
    expect(formatControlValue(80, '%')).toBe('80 %')
    expect(formatControlValue(-0.5, 'pan')).toBe('L25')
    expect(formatControlValue(1, 'pan')).toBe('R50')
    expect(formatControlValue(0.004, 'pan')).toBe('C')
    expect(formatControlValue(7, 'raw')).toBe('7')
    expect(formatControlValue(2.5, 'st')).toBe('2.50 st')
  })

  it('formats transport time', () => {
    expect(formatTimeSec(0)).toBe('0:00.0')
    expect(formatTimeSec(3.25)).toBe('0:03.2')
    expect(formatTimeSec(65)).toBe('1:05.0')
    expect(formatTimeSec(3725.5)).toBe('1:02:05.5')
    expect(formatTimeSec(Number.NaN)).toBe('0:00.0')
  })
})

describe('ParamSpec helpers', () => {
  const type: ParamSpec = {
    id: 0,
    name: 'Type',
    min: 0,
    max: 7,
    default: 0,
    taper: 'linear',
    unit: '',
  }
  const freq: ParamSpec = {
    id: 1,
    name: 'Frequency',
    min: 20,
    max: 20000,
    default: 1000,
    taper: 'log',
    unit: 'Hz',
  }
  const gain: ParamSpec = {
    id: 2,
    name: 'Gain',
    min: -24,
    max: 24,
    default: 0,
    taper: 'linear',
    unit: 'dB',
  }
  const mix: ParamSpec = {
    id: 3,
    name: 'Mix',
    min: 0,
    max: 1,
    default: 0.5,
    taper: 'linear',
    unit: '',
  }
  const time: ParamSpec = {
    id: 4,
    name: 'Time',
    min: 1,
    max: 2000,
    default: 250,
    taper: 'linear',
    unit: 'ms',
  }

  it('recognises choice parameters and derives steps', () => {
    expect(isChoiceParam(type)).toBe(true)
    expect(isChoiceParam(mix)).toBe(false)
    expect(paramStep(type)).toBe(1)
    expect(paramStep(freq)).toBe(0)
    expect(paramStep(gain)).toBe(0.1)
    expect(paramStep(time)).toBe(1)
    expect(paramStep(mix)).toBe(0.001)
  })

  it('maps tapers and formats with the unit', () => {
    expect(paramTaper(freq)).toBe('log')
    expect(paramTaper(gain)).toBe('linear')
    expect(formatParamValue(type, 2.4)).toBe('2')
    expect(formatParamValue(freq, 1000)).toBe('1.00 kHz')
    expect(formatParamValue(gain, -3)).toBe('-3.0 dB')
    expect(formatParamValue(mix, 0.5)).toBe('0.50')
  })
})
