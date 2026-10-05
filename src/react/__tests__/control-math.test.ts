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
  heldPeak,
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
import { stockDescriptors } from './display-harness'

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

  it('keeps a step that is no power of ten on its own grid', () => {
    // A quarter was rounded to one decimal, and 0.25 came out 0.3.
    const quarters = [0, 0.25, 0.5, 0.75, 1]
    expect(quarters.map((value) => quantize(value, 0.25, 0, 1))).toEqual(quarters)
    expect(quantize(0.3, 0.25, 0, 1)).toBe(0.25)
    expect(quantize(0.07, 0.025, 0, 1)).toBe(0.075)
    expect(quantize(7.4, 2.5, 0, 10)).toBe(7.5)
    expect(quantize(-0.4, 0.125, -1, 1)).toBe(-0.375)
    // What a step of a power of ten, or a whole one, comes to is as it was.
    expect(quantize(0.1 + 0.2, 0.1, 0, 1)).toBe(0.3)
    expect(quantize(0.5 + 0.01 * 0.1, 0.01 * 0.1, 0, 1)).toBe(0.501)
    expect(quantize(20, 3, -24, 24)).toBe(21)
  })

  it('steps with fine mode', () => {
    expect(stepBy(0.5, 1, 0.01, 0, 1)).toBe(0.51)
    expect(stepBy(0.5, 1, 0.01, 0, 1, true)).toBe(0.501)
    expect(stepBy(0.5, -10, 0.01, 0, 1)).toBe(0.4)
  })
})

describe('heldPeak', () => {
  const none = { db: Number.NEGATIVE_INFINITY, at: 0 }

  it('takes a reading as high as the held one at once', () => {
    expect(heldPeak(none, -20, 100, 1500)).toEqual({ db: -20, at: 100 })
    expect(heldPeak({ db: -20, at: 100 }, -6, 200, 1500)).toEqual({ db: -6, at: 200 })
    // An equal reading holds again from now.
    expect(heldPeak({ db: -6, at: 200 }, -6, 900, 1500)).toEqual({ db: -6, at: 900 })
    expect(heldPeak(none, Number.NEGATIVE_INFINITY, 50, 1500)).toEqual({ ...none, at: 50 })
  })

  it('keeps the held peak over a lower reading until the hold time has passed', () => {
    const held = { db: -6, at: 1000 }
    expect(heldPeak(held, -30, 1001, 1500)).toBe(held)
    expect(heldPeak(held, -30, 2500, 1500)).toBe(held)
    expect(heldPeak(held, -30, 2501, 1500)).toEqual({ db: -30, at: 2501 })
    expect(heldPeak(held, Number.NEGATIVE_INFINITY, 2501, 1500)).toEqual({
      db: Number.NEGATIVE_INFINITY,
      at: 2501,
    })
  })

  it('is the rule the meter holds its mark by', () => {
    let held = none
    const marks = [-12, -3, -20, -20, -9].map((db, index) => {
      held = heldPeak(held, db, index * 600, 1500)
      return held.db
    })
    expect(marks).toEqual([-12, -3, -3, -3, -9])
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
    // No space between number and unit for tight readouts (ambient-live's knobs).
    expect(formatControlValue(20, 'ms', { spacing: '' })).toBe('20ms')
    expect(formatControlValue(2.5, 'ms', { digits: 2, spacing: '' })).toBe('2.50ms')
    expect(formatControlValue(-6, 'dB', { spacing: '' })).toBe('-6.0dB')
    expect(formatControlValue(Number.NEGATIVE_INFINITY, 'dB', { spacing: '' })).toBe('-∞dB')
    expect(formatControlValue(2000, 'Hz', { spacing: '' })).toBe('2.00kHz')
    expect(formatControlValue(50, '%', { spacing: '' })).toBe('50%')
    expect(formatControlValue(1.5, 's', { spacing: '' })).toBe('1.50s')
    expect(formatControlValue(0.5, 'ratio', { digits: 1 })).toBe('0.5')
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

  it("tells a short time and a slow rate apart over the low part of a knob's travel", () => {
    // A compressor's attack: every one of these read "0.00 s".
    expect(formatControlValue(0.0001, 's')).toBe('0.1 ms')
    expect(formatControlValue(0.0005, 's')).toBe('0.5 ms')
    expect(formatControlValue(0.003, 's')).toBe('3.0 ms')
    expect(formatControlValue(0.02, 's')).toBe('20 ms')
    expect(formatControlValue(0.099, 's')).toBe('99 ms')
    expect(formatControlValue(0.0996, 's')).toBe('0.10 s')
    expect(formatControlValue(0.25, 's')).toBe('0.25 s')
    expect(formatControlValue(0, 's')).toBe('0.00 s')
    expect(formatControlValue(0.003, 's', { spacing: '' })).toBe('3.0ms')
    // Digits asked for are given, in seconds.
    expect(formatControlValue(0.003, 's', 3)).toBe('0.003 s')
    // A slow rate: these read "0.0 Hz" and "0.1 Hz".
    expect(formatControlValue(0.01, 'Hz')).toBe('0.01 Hz')
    expect(formatControlValue(0.04, 'Hz')).toBe('0.04 Hz')
    expect(formatControlValue(0.15, 'Hz')).toBe('0.15 Hz')
    expect(formatControlValue(0.999, 'Hz')).toBe('1.00 Hz')
    expect(formatControlValue(1, 'Hz')).toBe('1.0 Hz')
    expect(formatControlValue(0, 'Hz')).toBe('0.0 Hz')
    expect(formatControlValue(-0.5, 'Hz')).toBe('-0.50 Hz')
  })

  it('formats transport time', () => {
    expect(formatTimeSec(0)).toBe('0:00.0')
    expect(formatTimeSec(3.25)).toBe('0:03.2')
    expect(formatTimeSec(65)).toBe('1:05.0')
    expect(formatTimeSec(3725.5)).toBe('1:02:05.5')
    expect(formatTimeSec(Number.NaN)).toBe('0:00.0')
  })
})

describe('the stock devices', () => {
  const stock = [...stockDescriptors().values()]

  it('step a parameter only where every setting of it is whole, its presets too', () => {
    const stepped: string[] = []
    for (const device of stock) {
      for (const [name, spec] of Object.entries(device.params)) {
        if (!isChoiceParam(spec) && spec.step === undefined) continue
        if (!spec.choices && spec.unit === '') stepped.push(`${device.id}.${name}`)
        expect([spec.min, spec.max, spec.default].every(Number.isInteger)).toBe(true)
        for (const [preset, values] of Object.entries(device.presets ?? {})) {
          const value = values[name]
          if (value === undefined) continue
          expect(Number.isInteger(value), `${device.id} "${preset}" ${name}`).toBe(true)
        }
      }
    }
    // The counts, which have no names to give: every other stepped parameter names its choices.
    expect(stepped.sort()).toEqual([
      'cascade.repeats',
      'chamber-strings.players',
      'ember.unisonVoices',
    ])
  })

  it('can each be turned as a knob: a range with width, a default and a top the step lands on, a label for every value of a list, a number in every text', () => {
    for (const device of stock) {
      for (const [name, spec] of Object.entries(device.params)) {
        const at = `${device.id}.${name}`
        expect(spec.max, at).toBeGreaterThan(spec.min)
        expect(spec.default, at).toBeGreaterThanOrEqual(spec.min)
        expect(spec.default, at).toBeLessThanOrEqual(spec.max)
        if (spec.choices) expect(spec.choices, at).toHaveLength(spec.max - spec.min + 1)
        if (spec.taper === 'log') expect(spec.min, at).toBeGreaterThan(0)
        // A double click lands on the default and End on the top: both are places the knob has.
        const step = isChoiceParam(spec) ? 1 : paramStep(spec)
        expect(quantize(spec.default, step, spec.min, spec.max), at).toBe(spec.default)
        expect(quantize(spec.max, step, spec.min, spec.max), at).toBe(spec.max)
        for (const value of [spec.min, spec.default, spec.max]) {
          expect(formatParamValue(spec, value), at).not.toMatch(
            /NaN|Infinity|undefined|^-0(\.0+)?( |$)/,
          )
        }
        for (const [preset, values] of Object.entries(device.presets ?? {})) {
          const value = values[name]
          if (value === undefined) continue
          expect(value, `${at} in "${preset}"`).toBeGreaterThanOrEqual(spec.min)
          expect(value, `${at} in "${preset}"`).toBeLessThanOrEqual(spec.max)
        }
      }
    }
  })

  it('leave a tone, a pan, a tuning or a vowel continuous, as their presets set them', () => {
    const continuous = [
      'analog-drive.tone',
      'noise-floor.follow',
      'noise-floor.tone',
      'radio.tuning',
      're-amp.bass',
      're-amp.treble',
      'saturator.bias',
      'sustainer.tone',
      'utility.pan',
      'vinyl.tone',
      'vowel-reverb.vowel',
    ]
    for (const path of continuous) {
      const [id, name] = path.split('.')
      const spec = stock.find((device) => device.id === id)?.params[name]
      expect(spec, path).toBeDefined()
      if (!spec) continue
      expect(isChoiceParam(spec), path).toBe(false)
      expect(paramStep(spec), path).toBeLessThan(0.05)
    }
  })

  it('name the choices of the Filter type and of the Spectral Drifter', () => {
    const choices = (id: string, name: string): readonly string[] | undefined =>
      stock.find((device) => device.id === id)?.params[name].choices
    expect(choices('filter', 'type')).toHaveLength(8)
    expect(choices('filter', 'type')?.[5]).toBe('Peak')
    expect(choices('spectral-drifter', 'direction')).toEqual(['Up', 'Down', 'Scatter'])
    expect(choices('spectral-drifter', 'season')).toHaveLength(4)
    expect(choices('spectral-drifter', 'seed')).toHaveLength(3)
    expect(choices('spectral-drifter', 'interval')).toHaveLength(4)
    expect(choices('spectral-drifter', 'ageMode')).toEqual(['Auto', 'Manual'])
  })
})

describe('ParamSpec helpers', () => {
  const type: ParamSpec = {
    id: 0,
    name: 'Type',
    min: 0,
    max: 2,
    default: 0,
    taper: 'linear',
    unit: '',
    choices: ['Low pass', 'High pass', 'Band pass'],
  }
  const voices: ParamSpec = {
    id: 5,
    name: 'Voices',
    min: 1,
    max: 8,
    default: 1,
    taper: 'linear',
    unit: '',
    step: 1,
  }
  // Whole numbers at both ends and in the middle, and no list: a tilt.
  const tone: ParamSpec = {
    id: 6,
    name: 'Tone',
    min: -1,
    max: 1,
    default: 0,
    taper: 'linear',
    unit: '',
  }
  const vowel: ParamSpec = { ...tone, id: 7, name: 'Vowel', min: 0, max: 4 }
  // Whole semitones: stepped, and not a list.
  const pitch: ParamSpec = { ...tone, id: 8, name: 'Pitch', min: -24, max: 24, unit: 'st', step: 1 }
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
    expect(isChoiceParam(voices)).toBe(true)
    expect(isChoiceParam(mix)).toBe(false)
    // A range is not a list by its numbers alone: these two are continuous.
    expect(isChoiceParam(tone)).toBe(false)
    expect(isChoiceParam(vowel)).toBe(false)
    expect(paramStep(type)).toBe(1)
    expect(paramStep(voices)).toBe(1)
    expect(paramStep(tone)).toBe(0.001)
    expect(paramStep(vowel)).toBe(0.001)
    expect(isChoiceParam(pitch)).toBe(false)
    expect(paramStep(pitch)).toBe(1)
    expect(paramStep(freq)).toBe(0)
    expect(paramStep(gain)).toBe(0.1)
    expect(paramStep(time)).toBe(1)
    expect(paramStep(mix)).toBe(0.001)
  })

  it('maps tapers and formats with the unit', () => {
    expect(paramTaper(freq)).toBe('log')
    expect(paramTaper(gain)).toBe('linear')
    expect(formatParamValue(type, 2.4)).toBe('Band pass')
    expect(formatParamValue(voices, 2.4)).toBe('2')
    expect(formatParamValue(tone, 0.6)).toBe('0.60')
    expect(formatParamValue(vowel, 3.4)).toBe('3.40')
    expect(formatParamValue(pitch, 7)).toBe('7 st')
    expect(formatParamValue(pitch, -12.2)).toBe('-12 st')
    expect(formatParamValue(freq, 1000)).toBe('1.00 kHz')
    expect(formatParamValue(gain, -3)).toBe('-3.0 dB')
    expect(formatParamValue(mix, 0.5)).toBe('0.50')
  })
})
