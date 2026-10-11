import { describe, expect, it } from 'vitest'

import { type ParamSpec } from '../../params'
import { Lfo, Macro, Random } from '../Modulator'
import { ModMatrix, deviceParamTarget } from '../ModMatrix'
import {
  modulatedParamValue,
  paramModOffset,
  paramModReach,
  paramModSource,
  paramModSourceValue,
  paramValueAtOffset,
  type ParamModSource,
  type ParamModulation,
} from '../param-modulation'

const mix: ParamSpec = {
  id: 0,
  name: 'Mix',
  min: 0,
  max: 1,
  default: 0.5,
  taper: 'linear',
  unit: '',
}
const cutoff: ParamSpec = {
  id: 1,
  name: 'Cutoff',
  min: 20,
  max: 20000,
  default: 1000,
  taper: 'log',
  unit: 'Hz',
}
const voices: ParamSpec = {
  id: 2,
  name: 'Voices',
  min: 1,
  max: 4,
  default: 1,
  taper: 'linear',
  unit: '',
  step: 1,
}

function timed(source: ParamModSource | null): ParamModSource {
  if (!source) throw new Error('not a timed source')
  return source
}

describe('paramModSource', () => {
  it('gives an LFO as numbers that land on the same value at the same moment', () => {
    const lfo = new Lfo({ rateHz: 0.7, shape: 'triangle', depth: 0.6, phase: 0.2, startSec: 3 })
    lfo.setRate(1.3, 11.5)
    const source = paramModSource(lfo)
    expect(source).toMatchObject({ kind: 'lfo', shape: 'triangle', rateHz: 1.3, depth: 0.6 })
    for (const t of [0, 4.2, 11.5, 12.75, 300.001]) {
      expect(paramModSourceValue(timed(source), t)).toBe(lfo.valueAtTime(t))
    }
  })

  it('gives seeded noise as numbers, stepped and gliding', () => {
    for (const smooth of [false, true]) {
      const random = new Random({ rateHz: 3, seed: 41, smooth })
      const source = paramModSource(random)
      expect(source).toEqual({ kind: 'random', rateHz: 3, seed: 41, smooth })
      for (const t of [0, 0.1, 0.34, 7.77]) {
        expect(paramModSourceValue(timed(source), t)).toBe(random.valueAtTime(t))
      }
    }
  })

  it('has no numbers for a source a hand moves', () => {
    expect(paramModSource(new Macro(0.4))).toBeNull()
  })
})

describe('modulatedParamValue', () => {
  const sine = (depth: number, polarity: 'unipolar' | 'bipolar'): ParamModulation => ({
    routes: [
      {
        source: { kind: 'lfo', shape: 'sine', rateHz: 1, depth: 1, anchorPhase: 0, anchorSec: 0 },
        depth,
        polarity,
      },
    ],
  })

  it('swings a linear parameter around its base and holds it inside its range', () => {
    const modulation = sine(0.25, 'bipolar')
    expect(modulatedParamValue(mix, 0.5, modulation, 0)).toBeCloseTo(0.5, 12)
    expect(modulatedParamValue(mix, 0.5, modulation, 0.25)).toBeCloseTo(0.75, 12)
    expect(modulatedParamValue(mix, 0.5, modulation, 0.75)).toBeCloseTo(0.25, 12)
    // From 0.9 the top of the swing would be 1.15.
    expect(modulatedParamValue(mix, 0.9, modulation, 0.25)).toBe(1)
  })

  it('swings a log parameter as many octaves up as down', () => {
    const modulation = sine(0.1, 'bipolar')
    const up = modulatedParamValue(cutoff, 1000, modulation, 0.25)
    const down = modulatedParamValue(cutoff, 1000, modulation, 0.75)
    expect(up / 1000).toBeCloseTo(1000 / down, 9)
    expect(up / 1000).toBeCloseTo(1000 ** 0.1, 9)
  })

  it('lands a stepped parameter on a step', () => {
    const modulation = sine(1, 'unipolar')
    const seen = new Set<number>()
    for (let t = 0; t < 1; t += 0.01) seen.add(modulatedParamValue(voices, 1, modulation, t))
    expect([...seen].sort()).toEqual([1, 2, 3, 4])
  })

  it('is the base to the bit while nothing moves it', () => {
    expect(paramValueAtOffset(cutoff, 749.9999, 0)).toBe(749.9999)
    expect(modulatedParamValue(cutoff, 440, { routes: [] }, 12)).toBe(440)
  })

  it('takes a base that is no number as the default', () => {
    expect(paramValueAtOffset(mix, Number.NaN, 0)).toBe(0.5)
  })

  it('is what the matrix gives the same routes on the same parameter', () => {
    const lfo = new Lfo({ rateHz: 0.31, shape: 'saw', depth: 0.8, phase: 0.4 })
    const noise = new Random({ rateHz: 2, seed: 9, smooth: true })
    const values = new Map<string, number>([['cutoff', 700]])
    const device = {
      id: 'fake',
      input: null as unknown as AudioNode,
      output: null as unknown as AudioNode,
      params: { cutoff },
      latencySec: 0,
      bypass: false,
      setParam: (name: string, value: number) => void values.set(name, value),
      getParam: (name: string) => values.get(name) ?? 0,
      dispose: () => {},
    }
    const matrix = new ModMatrix()
    const target = deviceParamTarget(device, 'cutoff')
    matrix.map(lfo, target, { depth: 0.3, polarity: 'bipolar' })
    matrix.map(noise, target, { depth: -0.15, polarity: 'unipolar' })
    const modulation: ParamModulation = {
      routes: [
        { source: timed(paramModSource(lfo)), depth: 0.3, polarity: 'bipolar' },
        { source: timed(paramModSource(noise)), depth: -0.15, polarity: 'unipolar' },
      ],
    }
    for (const t of [0, 0.5, 1.21, 9.99, 61.3]) {
      expect(modulatedParamValue(cutoff, 700, modulation, t)).toBe(matrix.valueAt(target, t))
      expect(paramModOffset(modulation, t)).toBeCloseTo(
        matrix.routes.reduce(
          (sum, route) =>
            sum +
            route.depth *
              (route.polarity === 'bipolar'
                ? route.source.valueAtTime(t) * 2 - 1
                : route.source.valueAtTime(t)),
          0,
        ),
        12,
      )
    }
  })
})

describe('paramModReach', () => {
  it('says how far below and above the base the routes can take the parameter', () => {
    const lfo = (depth: number): ParamModulation['routes'][number]['source'] => ({
      kind: 'lfo',
      shape: 'sine',
      rateHz: 1,
      depth,
      anchorPhase: 0,
      anchorSec: 0,
    })
    expect(
      paramModReach({ routes: [{ source: lfo(1), depth: 0.25, polarity: 'bipolar' }] }),
    ).toEqual({ below: 0.25, above: 0.25 })
    expect(
      paramModReach({ routes: [{ source: lfo(1), depth: 0.4, polarity: 'unipolar' }] }),
    ).toEqual({ below: 0, above: 0.4 })
    const inverted = paramModReach({
      routes: [{ source: lfo(1), depth: -0.4, polarity: 'unipolar' }],
    })
    expect(inverted.below).toBeCloseTo(0.4, 12)
    expect(inverted.above).toBe(0)
    // A shallow breath never falls to the bottom of the wave.
    const shallow = paramModReach({
      routes: [{ source: lfo(0.5), depth: 0.2, polarity: 'bipolar' }],
    })
    expect(shallow.below).toBe(0)
    expect(shallow.above).toBeCloseTo(0.2, 12)
  })
})
