import { describe, expect, it } from 'vitest'

import { validateDescriptor } from '../../core/devices/registry'
import {
  isMappableWamParam,
  snapWamValue,
  wamParamSpec,
  wamParamSpecs,
  wamParamStep,
  wamTaper,
} from '../params'
import { fakeParameterInfo } from './fake-wam'

describe('wamParamSpec', () => {
  it('maps a float: label, range, default, unit, linear taper, no grid', () => {
    const spec = wamParamSpec(
      fakeParameterInfo('mix', {
        label: 'Mix',
        minValue: 0,
        maxValue: 1,
        defaultValue: 0.3,
        units: '%',
      }),
      7,
    )
    expect(spec).toEqual({
      id: 7,
      name: 'Mix',
      min: 0,
      max: 1,
      default: 0.3,
      taper: 'linear',
      unit: '%',
      type: 'float',
      step: 0,
      choices: [],
      exponent: 0,
    })
  })

  it('falls back to the WAM id when there is no label and clamps a default into range', () => {
    const info = { ...fakeParameterInfo('q', { minValue: 0.1, maxValue: 20 }), defaultValue: 50 }
    const spec = wamParamSpec(info, 0)
    expect(spec.name).toBe('q')
    expect(spec.default).toBe(20)
  })

  it('calls a positive exponent over a positive range a log taper', () => {
    expect(wamTaper({ exponent: 2, minValue: 20 })).toBe('log')
    expect(wamTaper({ exponent: 2, minValue: 0 })).toBe('linear')
    expect(wamTaper({ exponent: 0, minValue: 20 })).toBe('linear')
    expect(wamTaper({ exponent: -1, minValue: 20 })).toBe('linear')
  })

  it('gives boolean, choice and int params a unit grid', () => {
    const on = wamParamSpec(fakeParameterInfo('on', { type: 'boolean', defaultValue: 1 }), 0)
    expect(on).toMatchObject({ type: 'boolean', min: 0, max: 1, step: 1, default: 1 })
    const mode = wamParamSpec(
      fakeParameterInfo('mode', { type: 'choice', choices: ['a', 'b', 'c', 'd'], defaultValue: 2 }),
      1,
    )
    expect(mode).toMatchObject({
      type: 'choice',
      min: 0,
      max: 3,
      step: 1,
      choices: ['a', 'b', 'c', 'd'],
    })
    expect(mode.choices).not.toBe(
      fakeParameterInfo('mode', { type: 'choice', choices: ['a'] }).choices,
    )
    expect(wamParamStep({ type: 'int', discreteStep: 0 })).toBe(1)
    expect(wamParamStep({ type: 'int', discreteStep: 5 })).toBe(5)
    expect(wamParamStep({ type: 'float', discreteStep: 0 })).toBe(0)
  })

  it('snaps to the grid from the minimum', () => {
    expect(snapWamValue({ step: 1, min: 1 }, 4.4)).toBe(4)
    expect(snapWamValue({ step: 5, min: -10 }, -3)).toBe(-5)
    expect(snapWamValue({ step: 0, min: 0 }, 0.123)).toBe(0.123)
  })
})

describe('wamParamSpecs', () => {
  it('numbers params in plugin order and drops degenerate ranges', () => {
    const specs = wamParamSpecs({
      b: fakeParameterInfo('b', { minValue: 0, maxValue: 2 }),
      broken: { ...fakeParameterInfo('broken'), minValue: 1, maxValue: 1 },
      nan: { ...fakeParameterInfo('nan'), maxValue: Number.NaN },
      a: fakeParameterInfo('a'),
    })
    expect(Object.keys(specs)).toEqual(['b', 'a'])
    expect(specs.b.id).toBe(0)
    expect(specs.a.id).toBe(1)
    expect(isMappableWamParam(fakeParameterInfo('x'))).toBe(true)
    expect(isMappableWamParam({ ...fakeParameterInfo('x'), minValue: 2 })).toBe(false)
  })

  it('produces a table validateDescriptor accepts', () => {
    const params = wamParamSpecs({
      cutoff: fakeParameterInfo('cutoff', {
        minValue: 20,
        maxValue: 20000,
        defaultValue: 800,
        exponent: 2,
      }),
      mode: fakeParameterInfo('mode', { type: 'choice', choices: ['x', 'y'] }),
    })
    expect(() =>
      validateDescriptor({
        id: 'probe',
        name: 'Probe',
        kind: 'wam',
        category: 'other',
        version: 1,
        params,
        presets: { Bright: { cutoff: 12000, mode: 1 } },
        create: () => {
          throw new Error('unused')
        },
      }),
    ).not.toThrow()
  })
})
