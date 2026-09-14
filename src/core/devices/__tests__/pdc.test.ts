import { describe, expect, it } from 'vitest'

import {
  TRUE_PEAK_LIMITER_LATENCY_SECONDS,
  truePeakLimiterLatencySamples,
} from '../../../dsp/devices/true-peak-limiter'
import { asAudioContext, createMockContext } from '../../../testing'
import { createCompressor } from '../native/Compressor'
import { createUtility } from '../native/Utility'
import {
  ALIGNMENT_DELAY_ID,
  AlignmentDelay,
  PDC_MAX_DELAY_SECONDS,
  buildLatencyReport,
  chainCompensationSamples,
  chainLatencySamples,
  deviceLatencySamples,
  isAlignmentDelay,
  secondsToSamples,
  type LatencyPathInput,
} from '../pdc'

const SR = 48000

describe('deviceLatencySamples', () => {
  it('prefers a reported sample count, else rounds the seconds, never below zero', () => {
    expect(deviceLatencySamples({ latencySec: 0.5, latencySamples: 77 }, SR)).toBe(77)
    expect(deviceLatencySamples({ latencySec: 0.006 }, SR)).toBe(288)
    expect(deviceLatencySamples({ latencySec: 0.006 }, 44100)).toBe(265)
    expect(deviceLatencySamples({ latencySec: 0 }, SR)).toBe(0)
    expect(deviceLatencySamples({ latencySec: -1 }, SR)).toBe(0)
    expect(deviceLatencySamples({ latencySec: Number.NaN }, SR)).toBe(0)
    expect(deviceLatencySamples({ latencySec: 1, latencySamples: Number.NaN }, SR)).toBe(SR)
    expect(deviceLatencySamples({ latencySec: 0, latencySamples: 10.4 }, SR)).toBe(10)
    expect(secondsToSamples(0.0015, SR)).toBe(72)
  })

  it('the node and WASM hosts report both forms consistently', () => {
    const ctx = asAudioContext(createMockContext({ sampleRate: 44100 }))
    const compressor = createCompressor(ctx)
    expect(compressor.latencySec).toBe(0.006)
    expect(compressor.latencySamples).toBe(265)
    expect(deviceLatencySamples(compressor, 44100)).toBe(265)
    expect(createUtility(ctx).latencySamples).toBe(0)
  })

  it('matches the true-peak limiter DSP at every common rate', () => {
    expect(truePeakLimiterLatencySamples(44100)).toBe(71)
    expect(truePeakLimiterLatencySamples(48000)).toBe(77)
    expect(truePeakLimiterLatencySamples(88200)).toBe(137)
    expect(truePeakLimiterLatencySamples(96000)).toBe(149)
    expect(truePeakLimiterLatencySamples(192000)).toBe(293)
    // Clamped lookahead: 8 frames at absurdly low rates, 512 at absurdly high ones.
    expect(truePeakLimiterLatencySamples(1000)).toBe(13)
    expect(truePeakLimiterLatencySamples(1_000_000)).toBe(517)
    expect(Math.round(TRUE_PEAK_LIMITER_LATENCY_SECONDS * 48000)).toBe(77)
  })
})

describe('AlignmentDelay', () => {
  it('is one DelayNode with no params and zero reported latency', () => {
    const mock = createMockContext({ sampleRate: SR, currentTime: 2 })
    const delay = new AlignmentDelay(asAudioContext(mock))
    expect(delay.id).toBe(ALIGNMENT_DELAY_ID)
    expect(delay.input).toBe(delay.node)
    expect(delay.output).toBe(delay.node)
    expect(mock.delays).toHaveLength(1)
    expect(mock.gains).toHaveLength(0)
    expect(isAlignmentDelay(delay)).toBe(true)
    expect(isAlignmentDelay(createUtility(asAudioContext(mock)))).toBe(false)
    expect(Object.keys(delay.params)).toEqual([])
    expect(delay.latencySec).toBe(0)
    expect(delay.latencySamples).toBe(0)
    expect(delay.maxDelaySamples).toBe(PDC_MAX_DELAY_SECONDS * SR)
    expect(() => delay.setParam('x', 1)).toThrow(/no parameter/)
    expect(() => delay.getParam('x')).toThrow(/no parameter/)
  })

  it('sets the delay as a sample-exact step at the current time and clamps to the maximum', () => {
    const mock = createMockContext({ sampleRate: SR, currentTime: 2 })
    const delay = new AlignmentDelay(asAudioContext(mock))
    const param = mock.delays[0].delayTime
    expect(delay.setDelaySamples(77)).toBe(77)
    expect(delay.delaySamples).toBe(77)
    expect(delay.delaySec).toBe(77 / SR)
    expect(param.events).toEqual([{ method: 'setValueAtTime', args: [77 / SR, 2] }])

    delay.setDelaySamples(77)
    expect(param.events).toHaveLength(1)

    expect(delay.setDelaySamples(10 * SR)).toBe(SR)
    expect(delay.setDelaySamples(-5)).toBe(0)
    expect(delay.setDelaySamples(Number.NaN)).toBe(0)
    expect(param.eventsFor('setValueAtTime')).toHaveLength(3)
    expect(param.lastEvent('setValueAtTime')?.args).toEqual([0, 2])
  })

  it('takes an initial delay and a custom maximum', () => {
    const mock = createMockContext({ sampleRate: SR })
    const delay = new AlignmentDelay(asAudioContext(mock), {
      delaySamples: 480,
      maxDelaySec: 0.005,
    })
    expect(delay.maxDelaySamples).toBe(240)
    expect(delay.delaySamples).toBe(240)
  })

  it('bypass removes the delay and restores it; dispose disconnects once', () => {
    const mock = createMockContext({ sampleRate: SR, currentTime: 1 })
    const delay = new AlignmentDelay(asAudioContext(mock), { delaySamples: 100 })
    const param = mock.delays[0].delayTime
    delay.bypass = true
    expect(delay.delaySamples).toBe(0)
    expect(param.lastEvent('setValueAtTime')?.args).toEqual([0, 1])
    delay.setDelaySamples(200)
    expect(param.eventsFor('setValueAtTime')).toHaveLength(2)
    delay.bypass = false
    expect(delay.delaySamples).toBe(200)
    expect(param.lastEvent('setValueAtTime')?.args).toEqual([200 / SR, 1])

    delay.dispose()
    delay.dispose()
    expect(mock.delays[0].disconnectCalls.count).toBe(1)
    delay.setDelaySamples(5)
    expect(param.eventsFor('setValueAtTime')).toHaveLength(3)
  })
})

describe('chain latency', () => {
  it('sums device latency and keeps alignment stages apart as compensation', () => {
    const ctx = asAudioContext(createMockContext({ sampleRate: SR }))
    const chain = [
      createCompressor(ctx),
      new AlignmentDelay(ctx, { delaySamples: 50 }),
      { latencySec: 0, latencySamples: 77 },
    ]
    expect(chainLatencySamples(chain, SR)).toBe(288 + 77)
    expect(chainCompensationSamples(chain)).toBe(50)
    expect(chainLatencySamples([], SR)).toBe(0)
  })
})

describe('buildLatencyReport', () => {
  const dev = (id: string, latencySamples: number) => ({ id, latencySec: 0, latencySamples })

  it('follows destinations to the output and measures every path against the latest arrival', () => {
    const ctx = asAudioContext(createMockContext({ sampleRate: SR }))
    const compensated = new AlignmentDelay(ctx, { delaySamples: 50 })
    const inputs: LatencyPathInput[] = [
      {
        key: 'master',
        name: 'master',
        kind: 'master',
        devices: [dev('true-peak-limiter', 77)],
        destination: null,
        alignable: false,
      },
      {
        key: 'group/drums',
        name: 'drums',
        kind: 'group',
        devices: [dev('glue', 100)],
        destination: 'master',
        alignable: false,
      },
      { key: 'track/a', name: 'a', kind: 'track', devices: [], destination: 'group/drums' },
      {
        key: 'track/b',
        name: 'b',
        kind: 'track',
        devices: [dev('comp', 288)],
        destination: 'master',
      },
      { key: 'track/c', name: 'c', kind: 'track', devices: [compensated], destination: 'master' },
      {
        key: 'live-input/voice',
        name: 'voice',
        kind: 'live-input',
        devices: [],
        destination: 'master',
        alignable: false,
      },
    ]
    const report = buildLatencyReport(inputs, SR)
    expect(report.sampleRate).toBe(SR)
    expect(report.masterSamples).toBe(77)
    expect(report.maxLatencySamples).toBe(365)
    expect(report.maxArrivalSamples).toBe(365)

    const byKey = Object.fromEntries(report.paths.map((path) => [path.key, path]))
    expect(byKey.master).toMatchObject({
      ownSamples: 77,
      latencySamples: 77,
      arrivalSamples: 77,
      deficitSamples: 288,
      alignable: false,
      devices: [{ id: 'true-peak-limiter', latencySamples: 77, compensation: false }],
    })
    expect(byKey['group/drums']).toMatchObject({ ownSamples: 100, latencySamples: 177 })
    expect(byKey['track/a']).toMatchObject({
      ownSamples: 0,
      latencySamples: 177,
      arrivalSamples: 177,
      deficitSamples: 188,
      destination: 'group/drums',
      alignable: true,
    })
    expect(byKey['track/b']).toMatchObject({
      ownSamples: 288,
      latencySamples: 365,
      deficitSamples: 0,
      arrivalSec: 365 / SR,
    })
    expect(byKey['track/c']).toMatchObject({
      ownSamples: 0,
      compensationSamples: 50,
      latencySamples: 77,
      arrivalSamples: 127,
      deficitSamples: 238,
      devices: [{ id: ALIGNMENT_DELAY_ID, latencySamples: 50, compensation: true }],
    })
    expect(byKey['live-input/voice']).toMatchObject({ arrivalSamples: 77, alignable: false })
  })

  it('treats unknown destinations as the terminus, breaks cycles, and rejects duplicate keys', () => {
    const inputs: LatencyPathInput[] = [
      { key: 'a', name: 'a', kind: 'bus', devices: [dev('x', 10)], destination: 'b' },
      { key: 'b', name: 'b', kind: 'bus', devices: [dev('y', 20)], destination: 'a' },
      { key: 'c', name: 'c', kind: 'bus', devices: [dev('z', 5)], destination: 'elsewhere' },
    ]
    const report = buildLatencyReport(inputs, SR)
    const byKey = Object.fromEntries(report.paths.map((path) => [path.key, path]))
    // a → b → (a again: stop); b was resolved on that walk and keeps its own 20.
    expect(byKey.a.latencySamples).toBe(30)
    expect(byKey.b.latencySamples).toBe(20)
    expect(byKey.c.latencySamples).toBe(5)
    expect(report.masterSamples).toBe(0)
    expect(() => buildLatencyReport([inputs[0], inputs[0]], SR)).toThrow(/duplicate/)
  })
})
