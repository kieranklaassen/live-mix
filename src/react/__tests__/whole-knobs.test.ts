// The knobs of the parameters a device takes as a whole number: a count of
// voices, a note, a number of scale steps. Each device rounds what it is
// given to the nearest whole number, a half going up, so a knob that moves
// and reads in hundredths shows settings that are not there. With a step of
// one the knob moves by what the device hears, and for a value a piece
// already holds between two whole numbers it reads the one that plays.

import { describe, expect, it } from 'vitest'

import { formatParamValue, isChoiceParam, paramStep, quantize } from '../components/control-math'
import { stockDescriptors } from './display-harness'

const stock = stockDescriptors()

/**
 * What the device plays for a value: `floor(value + 0.5f)` in single
 * precision, which is how `felt_piano_device.cpp` (Polyphony), `thesis.h`
 * (Center Note, never negative) and `lattice.h` (`to_int`) all have it.
 */
const played = (value: number): number => Math.floor(Math.fround(Math.fround(value) + 0.5))

const WHOLE: readonly (readonly [device: string, param: string, unit: string])[] = [
  ['felt-piano', 'polyphony', 'voices'],
  ['thesis', 'center', 'note'],
  ['lattice', 'v1Degrees', 'steps'],
  ['lattice', 'v2Degrees', 'steps'],
  ['lattice', 'v3Degrees', 'steps'],
  ['lattice', 'v4Degrees', 'steps'],
]

describe('a parameter its device takes whole', () => {
  it.each(WHOLE)('%s.%s moves in whole steps and keeps its unit', (device, param, unit) => {
    const spec = stock.get(device)?.params[param]
    expect(spec).toBeDefined()
    if (!spec) return
    expect(spec.unit).toBe(unit)
    expect(paramStep(spec)).toBe(1)
    // With a unit it is not one of a list: no labels, and never a switch of two places.
    expect(isChoiceParam(spec)).toBe(false)
    expect(spec.max - spec.min).toBeGreaterThan(1)
    // The ends and the default are places the knob has.
    for (const value of [spec.min, spec.default, spec.max]) {
      expect(Number.isInteger(value)).toBe(true)
      expect(quantize(value, 1, spec.min, spec.max)).toBe(value)
      expect(formatParamValue(spec, value)).toBe(`${value} ${unit}`)
    }
  })

  it.each(WHOLE)(
    '%s.%s reads, for a value held between two whole numbers, the one that plays',
    (device, param, unit) => {
      const spec = stock.get(device)?.params[param]
      expect(spec).toBeDefined()
      if (!spec) return
      // Every tenth of the range: the halves are among them, and they go up, below zero too.
      for (let tenths = spec.min * 10; tenths <= spec.max * 10; tenths++) {
        const value = tenths / 10
        expect(formatParamValue(spec, value), String(value)).toBe(`${played(value)} ${unit}`)
      }
    },
  )

  it('says a half goes up, as the devices take it', () => {
    const params = (device: string) => stock.get(device)?.params ?? {}
    expect(formatParamValue(params('felt-piano').polyphony, 31.5)).toBe('32 voices')
    expect(formatParamValue(params('felt-piano').polyphony, 31.49)).toBe('31 voices')
    expect(formatParamValue(params('thesis').center, 62.5)).toBe('63 note')
    expect(formatParamValue(params('lattice').v2Degrees, -2.5)).toBe('-2 steps')
    expect(formatParamValue(params('lattice').v2Degrees, -2.51)).toBe('-3 steps')
    expect(formatParamValue(params('lattice').v2Degrees, -0.4)).toBe('0 steps')
  })

  it.each(WHOLE)('%s.%s is whole in every preset its device lists', (device, param) => {
    const presets = Object.entries(stock.get(device)?.presets ?? {})
    for (const [preset, values] of presets) {
      const value = values[param]
      if (value !== undefined) expect(Number.isInteger(value), preset).toBe(true)
    }
  })
})
