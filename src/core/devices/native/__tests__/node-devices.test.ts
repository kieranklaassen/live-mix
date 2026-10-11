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
import { isMeteredDevice } from '../../Device'
import { resolvePreset } from '../../presets'
import {
  COMPRESSOR_DESCRIPTOR,
  COMPRESSOR_LOOKAHEAD_SECONDS,
  COMPRESSOR_PARAMS,
  compressorNodeMakeupDb,
  createCompressor,
} from '../Compressor'
import { DELAY_PARAMS, createDelay } from '../Delay'
import { EQ3_PARAMS, createEq3 } from '../Eq3'
import { FILTER_PARAMS, FILTER_TYPES, createFilter, filterTypeAt, filterTypeIndex } from '../Filter'
import { NODE_DEVICE_RAMP_SECONDS } from '../NodeDevice'
import { PARAMETRIC_EQ_BANDS, PARAMETRIC_EQ_PARAMS, createParametricEq } from '../ParametricEq'
import { UTILITY_PARAMS, createUtility, utilityGain } from '../Utility'
import { FLAT_CUT_Q_DB, cutQDb, dbToGain, gainToDb } from '../units'
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

  it('gives a cut its Q in decibels, as a BiquadFilterNode reads a lowpass and a highpass', () => {
    expect(cutQDb(1)).toBe(0)
    expect(cutQDb(2)).toBeCloseTo(6.0206, 4)
    // No bump at the corner (Butterworth): √½ as a number, −3.01 as the node takes it.
    expect(cutQDb(Math.SQRT1_2)).toBeCloseTo(-3.0103, 4)
    expect(FLAT_CUT_Q_DB).toBe(cutQDb(Math.SQRT1_2))
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
    expect(filter.getParam('q')).toBe(FILTER_PARAMS.q.default)

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

  it('gives a low-pass and a high-pass their Q in decibels, so the default has no bump', () => {
    const ctx = createMockContext({ currentTime: 1 })
    const filter = createFilter(asAudioContext(ctx))
    const [biquad] = ctx.filters

    // √½ on the control is a Butterworth cut: −3.01 dB to the node, not a 0.7 dB peak.
    expect(biquad.type).toBe('lowpass')
    expect(biquad.Q.value).toBeCloseTo(-3.0103, 4)
    filter.setParam('q', 2)
    expect(rampTo(biquad.Q)).toEqual([cutQDb(2), 1 + RAMP])
    filter.setParam('type', filterTypeIndex('highpass'))
    expect(rampTo(biquad.Q)).toEqual([cutQDb(2), 1 + RAMP])

    const rumble = createFilter(asAudioContext(ctx), {
      params: { type: filterTypeIndex('highpass'), frequency: 80, q: Math.SQRT1_2 },
    })
    expect(rumble.getParam('q')).toBe(Math.SQRT1_2)
    expect(ctx.filters[1].type).toBe('highpass')
    expect(ctx.filters[1].Q.value).toBeCloseTo(-3.0103, 4)
  })

  it('writes the Q again, at once, when the type turns between a cut and another shape', () => {
    const ctx = createMockContext({ currentTime: 1 })
    const filter = createFilter(asAudioContext(ctx), { params: { q: 4 } })
    const [biquad] = ctx.filters
    expect(biquad.Q.value).toBeCloseTo(cutQDb(4), 9)

    // The type turns at once, and what the node's Q means turns with it.
    filter.setParam('type', filterTypeIndex('bandpass'))
    expect(rampTo(biquad.Q)).toEqual([4, 1])
    filter.setParam('q', 8)
    expect(rampTo(biquad.Q)).toEqual([8, 1 + RAMP])
    filter.setParam('type', filterTypeIndex('peaking'))
    expect(rampTo(biquad.Q)).toEqual([8, 1 + RAMP])
    filter.setParam('type', filterTypeIndex('highpass'))
    expect(rampTo(biquad.Q)).toEqual([cutQDb(8), 1])
    expect(filter.getParam('q')).toBe(8)
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
    // Both cuts are flat up to their corner: a Q of √½, which the node takes in decibels.
    expect(filters[0].Q.value).toBe(FLAT_CUT_Q_DB)
    expect(filters[5].Q.value).toBe(FLAT_CUT_Q_DB)
    expect(FLAT_CUT_Q_DB).toBeCloseTo(-3.0103, 4)
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
    // Flat under its corner, so a pass round the loop never gives back more than it took.
    expect(damping.Q.value).toBe(FLAT_CUT_Q_DB)
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
    const cancel = gainIn(ctx.gains, (g) => node.outputs.has(g))
    const makeup = gainIn(ctx.gains, (g) => cancel.outputs.has(g))

    expect(ctx.compressors).toHaveLength(1)
    expect(input.outputs.has(node)).toBe(true)
    expect(reaches(makeup, output)).toBe(true)
    // The 6 ms of look-ahead in whole samples at this rate, as the node counts them.
    expect(compressor.latencySec).toBe(Math.floor(COMPRESSOR_LOOKAHEAD_SECONDS * 44100) / 44100)
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

  it('takes the node’s own make-up off again, so a make-up of 0 adds no gain', () => {
    // A DynamicsCompressorNode adds a gain of its own behind its curve: what
    // the curve takes off full scale, to the power 0.6. At the node's defaults
    // that is 3.66 dB on everything, a sound under the threshold too.
    expect(compressorNodeMakeupDb(-24, 30, 12)).toBeCloseTo(3.66, 2)
    expect(compressorNodeMakeupDb(-18, 12, 2)).toBeCloseTo(3.51, 2)
    expect(compressorNodeMakeupDb(-24, 0, 4)).toBeCloseTo(10.8, 6)
    expect(compressorNodeMakeupDb(0, 0, 1)).toBeCloseTo(0, 9)

    const ctx = createMockContext({ currentTime: 2 })
    const compressor = createCompressor(asAudioContext(ctx))
    const [node] = ctx.compressors
    const cancel = gainIn(ctx.gains, (g) => node.outputs.has(g))
    const makeup = gainIn(ctx.gains, (g) => cancel.outputs.has(g))
    expect(cancel).not.toBe(makeup)
    expect(makeup.gain.value).toBe(1)
    // The two gains behind the node come to 1 over the node's own.
    expect(gainToDb(cancel.gain.value)).toBeCloseTo(-compressorNodeMakeupDb(-24, 30, 12), 9)
    // Set where it starts, with nothing scheduled: there is no fade in to it.
    expect(cancel.gain.events).toEqual([])

    // The node's make-up moves with the threshold, the knee and the ratio, and the device with it.
    compressor.setParam('threshold', -18)
    expect(rampTo(node.threshold)).toEqual([-18, 2 + RAMP])
    expect(rampTo(cancel.gain)?.[1]).toBe(2 + RAMP)
    expect(gainToDb(rampTo(cancel.gain)?.[0] as number)).toBeCloseTo(
      -compressorNodeMakeupDb(-18, 30, 12),
      9,
    )
    compressor.setParam('knee', 12)
    expect(gainToDb(rampTo(cancel.gain)?.[0] as number)).toBeCloseTo(
      -compressorNodeMakeupDb(-18, 12, 12),
      9,
    )
    compressor.setParam('ratio', 2)
    expect(gainToDb(rampTo(cancel.gain)?.[0] as number)).toBeCloseTo(
      -compressorNodeMakeupDb(-18, 12, 2),
      9,
    )
    expect(gainToDb(rampTo(cancel.gain)?.[0] as number)).toBeCloseTo(-3.51, 2)
    // Attack, release and Make-up leave it alone.
    const scheduled = cancel.gain.events.length
    compressor.setParam('attack', 0.02)
    compressor.setParam('release', 0.3)
    compressor.setParam('makeupDb', 3)
    expect(cancel.gain.events.length).toBe(scheduled)
    expect(rampTo(makeup.gain)?.[0]).toBeCloseTo(dbToGain(3), 9)
  })

  it('starts where its settings put it: a preset’s cancelling gain is there from the first sample', () => {
    const ctx = createMockContext()
    createCompressor(asAudioContext(ctx), {
      params: { threshold: -18, knee: 12, ratio: 2, makeupDb: 0 },
    })
    const [node] = ctx.compressors
    const cancel = gainIn(ctx.gains, (g) => node.outputs.has(g))
    expect(gainToDb(cancel.gain.value)).toBeCloseTo(-compressorNodeMakeupDb(-18, 12, 2), 9)
    expect(cancel.gain.events).toEqual([])
  })

  it('gives each preset the make-up the node was adding under it, so it is as loud as it was', () => {
    // What each preset's Make-up was before the device took the node's own off.
    const before = { Gentle: 2, Voice: 4, Glue: 1, Limit: 0 }
    for (const [name, was] of Object.entries(before)) {
      const params = resolvePreset(COMPRESSOR_DESCRIPTOR, name).params
      const node = compressorNodeMakeupDb(params.threshold, params.knee, params.ratio)
      expect(Math.abs(params.makeupDb - (was + node)), name).toBeLessThan(0.006)
    }
    // The default device is the one whose sound changes: no make-up is none.
    expect(COMPRESSOR_PARAMS.makeupDb.default).toBe(0)
  })

  it('reports the samples the node looks ahead: 6 ms, rounded down', () => {
    const at = (sampleRate: number): number =>
      createCompressor(asAudioContext(createMockContext({ sampleRate }))).latencySamples
    expect(at(48000)).toBe(288)
    // 264.6 samples: Chromium's node delays by 264.
    expect(at(44100)).toBe(264)
    expect(at(96000)).toBe(576)
  })

  it('reports its gain reduction as a meter, declared on its descriptor', () => {
    const ctx = createMockContext()
    const compressor = createCompressor(asAudioContext(ctx))
    const [node] = ctx.compressors

    expect(isMeteredDevice(compressor)).toBe(true)
    expect(compressor.meters).toEqual({
      reduction: { id: 0, name: 'Gain reduction', unit: 'dB' },
    })
    expect(COMPRESSOR_DESCRIPTOR.meters).toBe(compressor.meters)

    // The reading is the node's own, there before anyone watches and after they stop.
    expect(compressor.meter('reduction')).toBe(0)
    const unwatch = compressor.watchMeters()
    node.reduction = -4.25
    expect(compressor.meter('reduction')).toBe(-4.25)
    unwatch()
    unwatch()
    node.reduction = -1
    expect(compressor.meter('reduction')).toBe(-1)
    expect(() => compressor.meter('level')).toThrow('compressor has no meter "level"')
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
