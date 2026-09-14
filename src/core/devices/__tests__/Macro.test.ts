import { describe, expect, it, vi } from 'vitest'

import { asAudioContext, createMockContext } from '../../../testing'
import { type ParamSpec } from '../../params'
import {
  MACRO_CURVES,
  RackMacro,
  createMacroMapping,
  macroCurve,
  macroCurveInverse,
  macroMappedValue,
  macroPositionFor,
  taperPosition,
  taperValue,
} from '../Macro'
import { createFilter } from '../native/Filter'

const LOG_SPEC: ParamSpec = {
  id: 0,
  name: 'Freq',
  min: 20,
  max: 20000,
  default: 1000,
  taper: 'log',
  unit: 'Hz',
}
const LINEAR_SPEC: ParamSpec = {
  id: 1,
  name: 'Gain',
  min: -12,
  max: 12,
  default: 0,
  taper: 'linear',
  unit: 'dB',
}

describe('macroCurve', () => {
  it.each(MACRO_CURVES)('%s pins 0 → 0 and 1 → 1, is monotonic, and inverts', (curve) => {
    expect(macroCurve(curve, 0)).toBe(0)
    expect(macroCurve(curve, 1)).toBe(1)
    let previous = 0
    for (let step = 1; step <= 100; step += 1) {
      const value = macroCurve(curve, step / 100)
      expect(value).toBeGreaterThanOrEqual(previous)
      expect(macroCurveInverse(curve, value)).toBeCloseTo(step / 100, 9)
      previous = value
    }
  })

  it('has the documented shapes at the midpoint and clamps its input', () => {
    expect(macroCurve('linear', 0.5)).toBe(0.5)
    expect(macroCurve('exponential', 0.5)).toBe(0.25)
    expect(macroCurve('logarithmic', 0.5)).toBe(0.75)
    expect(macroCurve('s-curve', 0.5)).toBe(0.5)
    expect(macroCurve('s-curve', 0.25)).toBeCloseTo(0.15625, 12)
    expect(macroCurve('exponential', 2)).toBe(1)
    expect(macroCurve('exponential', -1)).toBe(0)
    expect(macroCurve('linear', Number.NaN)).toBe(0)
  })
})

describe('taperValue / taperPosition', () => {
  it('interpolates linear ranges and inverts them', () => {
    expect(taperValue('linear', 0.25, -12, 12)).toBe(-6)
    expect(taperValue('linear', 0.5, 12, -12)).toBe(0)
    expect(taperPosition('linear', -6, -12, 12)).toBe(0.25)
    expect(taperPosition('linear', 100, -12, 12)).toBe(1)
  })

  it('sweeps log ranges geometrically (the midpoint is the geometric mean)', () => {
    expect(taperValue('log', 0.5, 20, 20000)).toBeCloseTo(Math.sqrt(20 * 20000), 9)
    expect(taperValue('log', 1 / 3, 20, 20000)).toBeCloseTo(200, 9)
    expect(taperPosition('log', 200, 20, 20000)).toBeCloseTo(1 / 3, 12)
    expect(taperValue('log', 0.5, 20000, 20)).toBeCloseTo(Math.sqrt(20 * 20000), 9)
  })

  it('falls back to linear when a log range touches zero', () => {
    expect(taperValue('log', 0.5, 0, 10)).toBe(5)
    expect(taperPosition('log', 5, 0, 10)).toBe(0.5)
    expect(taperPosition('linear', 3, 3, 3)).toBe(0)
  })
})

describe('macroMappedValue', () => {
  it('follows the param taper over the full range by default', () => {
    const mapping = { spec: LOG_SPEC, min: 20, max: 20000, curve: 'linear' as const }
    expect(macroMappedValue(mapping, 0)).toBe(20)
    expect(macroMappedValue(mapping, 0.5)).toBeCloseTo(632.4555, 3)
    expect(macroMappedValue(mapping, 1)).toBe(20000)
    expect(macroPositionFor(mapping, 632.4555320336759)).toBeCloseTo(0.5, 9)
  })

  it('applies the curve before the taper and clamps into the spec', () => {
    const mapping = { spec: LINEAR_SPEC, min: 0, max: 12, curve: 'exponential' as const }
    expect(macroMappedValue(mapping, 0.5)).toBe(3)
    expect(macroPositionFor(mapping, 3)).toBe(0.5)
    const wild = { spec: LINEAR_SPEC, min: -100, max: 100, curve: 'linear' as const }
    expect(macroMappedValue(wild, 0)).toBe(-12)
    expect(macroMappedValue(wild, 1)).toBe(12)
  })

  it('inverts when min > max', () => {
    const mapping = { spec: LINEAR_SPEC, min: 12, max: -12, curve: 'linear' as const }
    expect(macroMappedValue(mapping, 0)).toBe(12)
    expect(macroMappedValue(mapping, 1)).toBe(-12)
    expect(macroPositionFor(mapping, 6)).toBe(0.25)
  })
})

describe('createMacroMapping', () => {
  it('reads the spec from the device, defaults to the full range and clamps a custom one', () => {
    const filter = createFilter(asAudioContext(createMockContext()))
    const full = createMacroMapping(0, filter, 'frequency')
    expect(full.spec).toBe(filter.params.frequency)
    expect(full.min).toBe(filter.params.frequency.min)
    expect(full.max).toBe(filter.params.frequency.max)
    expect(full.curve).toBe('linear')

    const custom = createMacroMapping(3, filter, 'frequency', {
      min: 1,
      max: 1_000_000,
      curve: 's-curve',
    })
    expect(custom.macro).toBe(3)
    expect(custom.min).toBe(filter.params.frequency.min)
    expect(custom.max).toBe(filter.params.frequency.max)
    expect(custom.curve).toBe('s-curve')
  })

  it('rejects unknown params and bad macro indices', () => {
    const filter = createFilter(asAudioContext(createMockContext()))
    expect(() => createMacroMapping(0, filter, 'nope')).toThrow(/no parameter "nope"/)
    expect(() => createMacroMapping(-1, filter, 'frequency')).toThrow(/non-negative integer/)
    expect(() => createMacroMapping(1.5, filter, 'frequency')).toThrow(/non-negative integer/)
  })
})

describe('RackMacro', () => {
  it('is a U19 Macro that reports changes (and only changes) to its owner', () => {
    const onChange = vi.fn()
    const macro = new RackMacro(2, 'Space', onChange, 0.25)
    expect(macro.index).toBe(2)
    expect(macro.name).toBe('Space')
    expect(macro.value).toBe(0.25)
    expect(macro.valueAtTime(123)).toBe(0.25)
    expect(onChange).not.toHaveBeenCalled()

    macro.set(0.5)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(macro)
    macro.set(0.5)
    expect(onChange).toHaveBeenCalledTimes(1)
    macro.set(4)
    expect(macro.value).toBe(1)
    expect(onChange).toHaveBeenCalledTimes(2)
  })
})
