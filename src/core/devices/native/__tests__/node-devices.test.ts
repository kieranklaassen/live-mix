// Graph wiring and AudioParam scheduling of every stock node device, asserted
// on the recording mocks: which nodes exist, how they chain, and which
// AudioParam each device parameter reaches (with what value law).

import { describe, expect, it } from 'vitest'

import {
  asAudioContext,
  createMockContext,
  type MockAudioContext,
  type MockAudioNode,
} from '../../../../testing'
import { COMPRESSOR_LOOKAHEAD_SECONDS, COMPRESSOR_PARAMS, createCompressor } from '../Compressor'
import { DELAY_PARAMS, createDelay } from '../Delay'
import { EQ3_PARAMS, createEq3 } from '../Eq3'
import { FILTER_PARAMS, FILTER_TYPES, createFilter, filterTypeAt, filterTypeIndex } from '../Filter'
import { NODE_DEVICE_RAMP_SECONDS } from '../NodeDevice'
import { PARAMETRIC_EQ_BANDS, PARAMETRIC_EQ_PARAMS, createParametricEq } from '../ParametricEq'
import { UTILITY_PARAMS, createUtility, utilityGain } from '../Utility'
import { dbToGain, gainToDb } from '../units'
import { gainIn, io, rampTo } from './graph-helpers'

const RAMP = NODE_DEVICE_RAMP_SECONDS

function reaches(from: MockAudioNode, to: MockAudioNode): boolean {
  return from.reaches(to)
}

describe('units', () => {
  it('converts dB and linear gain both ways', () => {
    expect(dbToGain(0)).toBe(1)
    expect(dbToGain(-6)).toBeCloseTo(0.501, 3)
    expect(dbToGain(20)).toBeCloseTo(10, 9)
    expect(gainToDb(1)).toBe(0)
    expect(gainToDb(0.5)).toBeCloseTo(-6.02, 2)
    expect(gainToDb(0)).toBe(-Infinity)
  })
})

describe('Filter', () => {
  it('is one biquad whose type/frequency/Q/gain the params drive', () => {
    const ctx = createMockContext({ currentTime: 1 })
    const filter = createFilter(asAudioContext(ctx), { params: { frequency: 500 } })
    const { input, output } = io(filter)
    const [biquad] = ctx.filters

    expect(ctx.filters).toHaveLength(1)
    expect(reaches(input, biquad) && reaches(biquad, output)).toBe(true)
    expect(biquad.type).toBe('lowpass')
    expect(biquad.frequency.value).toBe(500)
    expect(biquad.Q.value).toBe(FILTER_PARAMS.q.default)

    filter.setParam('type', filterTypeIndex('highshelf'))
    expect(biquad.type).toBe('highshelf')
    filter.setParam('type', 7.4)
    expect(biquad.type).toBe('allpass')
    filter.setParam('frequency', 2000)
    expect(rampTo(biquad.frequency)).toEqual([2000, 1 + RAMP])
    filter.setParam('q', 4)
    expect(rampTo(biquad.Q)).toEqual([4, 1 + RAMP])
    filter.setParam('gain', 30)
    expect(rampTo(biquad.gain)).toEqual([FILTER_PARAMS.gain.max, 1 + RAMP])
  })

  it('maps the type scale onto every biquad response and back', () => {
    expect(FILTER_TYPES).toHaveLength(FILTER_PARAMS.type.max + 1)
    for (const type of FILTER_TYPES) expect(filterTypeAt(filterTypeIndex(type))).toBe(type)
    expect(filterTypeAt(-3)).toBe('lowpass')
    expect(filterTypeAt(99)).toBe('allpass')
    expect(filterTypeAt(2.5)).toBe('lowshelf')
  })
})

describe('Eq3', () => {
  it('chains low shelf → peaking → high shelf and routes each band to its node', () => {
    const ctx = createMockContext({ currentTime: 0.5 })
    const eq = createEq3(asAudioContext(ctx), { params: { lowGain: 3 } })
    const { input, output } = io(eq)
    const [low, mid, high] = ctx.filters

    expect(ctx.filters).toHaveLength(3)
    expect([low.type, mid.type, high.type]).toEqual(['lowshelf', 'peaking', 'highshelf'])
    expect(input.outputs.has(low)).toBe(true)
    expect(low.outputs.has(mid)).toBe(true)
    expect(mid.outputs.has(high)).toBe(true)
    expect(reaches(high, output)).toBe(true)
    expect(low.gain.value).toBe(3)
    expect(low.frequency.value).toBe(EQ3_PARAMS.lowFreq.default)
    expect(mid.frequency.value).toBe(EQ3_PARAMS.midFreq.default)
    expect(high.frequency.value).toBe(EQ3_PARAMS.highFreq.default)

    eq.setParam('midQ', 2)
    expect(rampTo(mid.Q)).toEqual([2, 0.5 + RAMP])
    eq.setParam('highFreq', 8000)
    expect(rampTo(high.frequency)).toEqual([8000, 0.5 + RAMP])
    eq.setParam('lowGain', -40)
    expect(rampTo(low.gain)).toEqual([EQ3_PARAMS.lowGain.min, 0.5 + RAMP])
    expect(mid.gain.events).toEqual([])
  })
})

describe('ParametricEq', () => {
  it('has a low cut, four peaking bands and a high cut in series', () => {
    const ctx = createMockContext({ currentTime: 2 })
    const eq = createParametricEq(asAudioContext(ctx), { params: { band2Gain: -4 } })
    const { input, output } = io(eq)
    const filters = ctx.filters

    expect(filters).toHaveLength(PARAMETRIC_EQ_BANDS + 2)
    expect(filters.map((f) => f.type)).toEqual([
      'highpass',
      'peaking',
      'peaking',
      'peaking',
      'peaking',
      'lowpass',
    ])
    for (let i = 0; i < filters.length - 1; i += 1) {
      expect(filters[i].outputs.has(filters[i + 1])).toBe(true)
    }
    expect(input.outputs.has(filters[0])).toBe(true)
    expect(reaches(filters[5], output)).toBe(true)
    expect(filters[0].Q.value).toBe(Math.SQRT1_2)
    expect(filters[5].Q.value).toBe(Math.SQRT1_2)
    expect(filters.slice(1, 5).map((f) => f.frequency.value)).toEqual([100, 400, 1600, 6400])
    expect(filters[2].gain.value).toBe(-4)

    eq.setParam('lowCut', 80)
    expect(rampTo(filters[0].frequency)).toEqual([80, 2 + RAMP])
    eq.setParam('highCut', 12000)
    expect(rampTo(filters[5].frequency)).toEqual([12000, 2 + RAMP])
    eq.setParam('band4Q', 3)
    expect(rampTo(filters[4].Q)).toEqual([3, 2 + RAMP])
    eq.setParam('band1Freq', 5)
    expect(rampTo(filters[1].frequency)).toEqual([PARAMETRIC_EQ_PARAMS.band1Freq.min, 2 + RAMP])
  })

  it('numbers its 14 params contiguously', () => {
    const ids = Object.values(PARAMETRIC_EQ_PARAMS)
      .map((spec) => spec.id)
      .sort((a, b) => a - b)
    expect(ids).toEqual(Array.from({ length: 2 + PARAMETRIC_EQ_BANDS * 3 }, (_, i) => i))
  })
})

describe('Delay', () => {
  it('splits into dry and a damped feedback loop, mixed linearly', () => {
    const ctx = createMockContext({ currentTime: 4 })
    const delay = createDelay(asAudioContext(ctx), { params: { mix: 0.3, timeSec: 0.25 } })
    const { input, output } = io(delay)
    const [line] = ctx.delays
    const [damping] = ctx.filters
    const split = gainIn(input.outputs, (g) => g.outputs.has(line))
    const feedback = gainIn(ctx.gains, (g) => g.outputs.has(line) && g !== split)
    const wet = gainIn(ctx.gains, (g) => line.outputs.has(g))
    const dry = gainIn(split.outputs, (g) => g !== wet)

    expect(ctx.delays).toHaveLength(1)
    expect(damping.type).toBe('lowpass')
    expect(line.delayTime.value).toBe(0.25)
    expect(damping.frequency.value).toBe(DELAY_PARAMS.damping.default)
    expect(feedback.gain.value).toBe(DELAY_PARAMS.feedback.default)
    expect(dry.gain.value).toBeCloseTo(0.7)
    expect(wet.gain.value).toBeCloseTo(0.3)
    expect(line.outputs.has(damping)).toBe(true)
    expect(damping.outputs.has(feedback)).toBe(true)
    expect(feedback.outputs.has(line)).toBe(true)
    expect(reaches(dry, output) && reaches(wet, output)).toBe(true)

    delay.setParam('mix', 0.5)
    expect(rampTo(dry.gain)).toEqual([0.5, 4 + RAMP])
    expect(rampTo(wet.gain)).toEqual([0.5, 4 + RAMP])
    delay.setParam('timeSec', 0.75)
    expect(rampTo(line.delayTime)).toEqual([0.75, 4 + RAMP])
    delay.setParam('feedback', 1.5)
    expect(rampTo(feedback.gain)).toEqual([DELAY_PARAMS.feedback.max, 4 + RAMP])
    delay.setParam('damping', 2000)
    expect(rampTo(damping.frequency)).toEqual([2000, 4 + RAMP])
  })
})

describe('Compressor', () => {
  it('drives the DynamicsCompressorNode params and a make-up gain in dB', () => {
    const ctx = createMockContext({ currentTime: 1.5 })
    const compressor = createCompressor(asAudioContext(ctx), { params: { makeupDb: 6 } })
    const { input, output } = io(compressor)
    const [node] = ctx.compressors
    const makeup = gainIn(ctx.gains, (g) => node.outputs.has(g))

    expect(ctx.compressors).toHaveLength(1)
    expect(input.outputs.has(node)).toBe(true)
    expect(reaches(makeup, output)).toBe(true)
    expect(compressor.latencySec).toBe(COMPRESSOR_LOOKAHEAD_SECONDS)
    expect(node.threshold.value).toBe(COMPRESSOR_PARAMS.threshold.default)
    expect(node.ratio.value).toBe(COMPRESSOR_PARAMS.ratio.default)
    expect(makeup.gain.value).toBeCloseTo(dbToGain(6))

    compressor.setParam('threshold', -30)
    expect(rampTo(node.threshold)).toEqual([-30, 1.5 + RAMP])
    compressor.setParam('knee', 6)
    expect(rampTo(node.knee)).toEqual([6, 1.5 + RAMP])
    compressor.setParam('ratio', 4)
    expect(rampTo(node.ratio)).toEqual([4, 1.5 + RAMP])
    compressor.setParam('attack', 0.01)
    expect(rampTo(node.attack)).toEqual([0.01, 1.5 + RAMP])
    compressor.setParam('release', 0.2)
    expect(rampTo(node.release)).toEqual([0.2, 1.5 + RAMP])
    compressor.setParam('makeupDb', 0)
    expect(rampTo(makeup.gain)).toEqual([1, 1.5 + RAMP])

    node.reduction = -7.5
    expect(compressor.reductionDb).toBe(-7.5)
  })
})

describe('Utility', () => {
  it('chains polarity → stereo/mono crossfade → pan → trim', () => {
    const ctx = createMockContext({ currentTime: 3 })
    const utility = createUtility(asAudioContext(ctx), { params: { gainDb: -6, width: 0.25 } })
    const { input, output } = io(utility)
    const [panner] = ctx.panners
    const polarity = gainIn(input.outputs, (g) => g.outputs.size === 2)
    const stereo = gainIn(polarity.outputs, (g) => g.channelCountMode === 'max')
    const mono = gainIn(polarity.outputs, (g) => g !== stereo)
    const sum = gainIn(stereo.outputs)
    const trim = gainIn(panner.outputs)

    expect(ctx.panners).toHaveLength(1)
    expect(mono.channelCount).toBe(1)
    expect(mono.channelCountMode).toBe('explicit')
    expect(stereo.channelCountMode).toBe('max')
    expect(mono.outputs.has(sum)).toBe(true)
    expect(sum.outputs.has(panner)).toBe(true)
    expect(reaches(trim, output)).toBe(true)
    expect(polarity.gain.value).toBe(1)
    expect(stereo.gain.value).toBe(0.25)
    expect(mono.gain.value).toBe(0.75)
    expect(trim.gain.value).toBeCloseTo(dbToGain(-6))
    expect(panner.pan.value).toBe(0)

    utility.setParam('pan', -0.5)
    expect(rampTo(panner.pan)).toEqual([-0.5, 3 + RAMP])
    utility.setParam('width', 1)
    expect(rampTo(stereo.gain)).toEqual([1, 3 + RAMP])
    expect(rampTo(mono.gain)).toEqual([0, 3 + RAMP])
    utility.setParam('polarity', 1)
    expect(rampTo(polarity.gain)).toEqual([-1, 3 + RAMP])
    utility.setParam('polarity', 0.2)
    expect(rampTo(polarity.gain)).toEqual([1, 3 + RAMP])
    utility.setParam('gainDb', -60)
    expect(rampTo(trim.gain)).toEqual([0, 3 + RAMP])
    utility.setParam('gainDb', 40)
    expect(rampTo(trim.gain)).toEqual([dbToGain(UTILITY_PARAMS.gainDb.max), 3 + RAMP])
  })

  it('treats the gain floor as silence', () => {
    expect(utilityGain(UTILITY_PARAMS.gainDb.min)).toBe(0)
    expect(utilityGain(UTILITY_PARAMS.gainDb.min + 0.1)).toBeGreaterThan(0)
    expect(utilityGain(0)).toBe(1)
  })
})

describe('every node device', () => {
  const factories = [
    createFilter,
    createEq3,
    createParametricEq,
    createDelay,
    createCompressor,
    createUtility,
  ]

  it.each(factories)('%o exposes GainNode I/O and a stereo-safe graph', (create) => {
    const ctx: MockAudioContext = createMockContext()
    const device = (create as typeof createFilter)(asAudioContext(ctx))
    const { input, output } = io(device)
    expect(input.kind).toBe('gain')
    expect(output.kind).toBe('gain')
    expect(reaches(input, output)).toBe(true)
    device.dispose()
    for (const node of ctx.allNodes()) expect(node.outputs.size).toBe(0)
  })
})
