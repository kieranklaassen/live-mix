// Engine wiring for U34: the per-path latency report and cross-track delay
// compensation (`alignLatency`) on the recording mocks.

import { describe, expect, it } from 'vitest'

import {
  asAudioContext,
  createMockContext,
  type MockAudioContext,
  type MockDelayNode,
  type MockGainNode,
} from '../../testing'
import { type Device, type NoteDevice } from '../devices/Device'
import { createCompressor } from '../devices/native/Compressor'
import { createUtility } from '../devices/native/Utility'
import { isAlignmentDelay } from '../devices/pdc'
import { createRack } from '../devices/Rack'
import { createEngine, type Engine } from '../Engine'

const SR = 48000

function fakeDevice(
  mock: MockAudioContext,
  id: string,
  latencySamples: number,
): Device & { node: MockGainNode } {
  const node = mock.createGain()
  return {
    id,
    node,
    input: node as unknown as AudioNode,
    output: node as unknown as AudioNode,
    params: {},
    setParam: () => {},
    getParam: () => 0,
    bypass: false,
    latencySec: latencySamples / SR,
    latencySamples,
    dispose: () => node.disconnect(),
  }
}

function fakeInstrument(mock: MockAudioContext): NoteDevice {
  return { ...fakeDevice(mock, 'synth', 0), noteOn: () => {}, noteOff: () => {} }
}

/**
 * master (limiter 77) ← fx bus (10) ← ∅
 *                     ← drums group (compressor 288) ← pad track
 *                     ← music track (rack: chain A compressor 288 + 77, chain B empty → 365)
 *                     ← synth instrument, voice live input, hall return
 */
async function session() {
  const mock = createMockContext({ sampleRate: SR, currentTime: 1 })
  const ctx = asAudioContext(mock)
  const engine = createEngine({ context: ctx })
  const music = engine.addAudioTrack('music')
  const pad = engine.addAudioTrack('pad')
  const drums = engine.addGroup('drums', { members: [pad] })
  const fx = engine.addBus('fx')
  const voice = engine.addLiveInputTrack('voice')
  const hall = engine.addReturnTrack('hall', { device: createUtility(ctx) })
  const synth = engine.addInstrumentTrack('synth', { device: fakeInstrument(mock) })

  await engine.master.installLimiter(() => fakeDevice(mock, 'true-peak-limiter', 77))
  const glue = createCompressor(ctx)
  drums.strip.addInsert(glue)
  const rack = createRack(ctx)
  const chainA = rack.addChain()
  chainA.addInsert(createCompressor(ctx))
  chainA.addInsert(fakeDevice(mock, 'wall', 77))
  rack.addChain()
  music.strip.addInsert(rack)
  fx.addInsert(fakeDevice(mock, 'shimmer', 10))
  return { mock, ctx, engine, music, pad, drums, fx, voice, hall, synth, glue, rack }
}

function byKey(engine: Engine) {
  const report = engine.latencyReport()
  return { report, paths: Object.fromEntries(report.paths.map((path) => [path.key, path])) }
}

function stageOf(strip: { inserts: readonly Device[] }) {
  return strip.inserts.find(isAlignmentDelay)
}

describe('Engine.latencyReport', () => {
  it('lists every path with zero latency on a fresh engine and creates no nodes', () => {
    const mock = createMockContext({ sampleRate: SR })
    const ctx = asAudioContext(mock)
    const engine = createEngine({ context: ctx })
    engine.addAudioTrack('music')
    engine.addBus('fx')
    engine.addGroup('drums')
    engine.addLiveInputTrack('voice')
    engine.addReturnTrack('hall', { device: createUtility(ctx) })
    engine.addInstrumentTrack('synth', { device: fakeInstrument(mock) })
    const nodes = mock.allNodes().length

    const report = engine.latencyReport()
    expect(mock.allNodes()).toHaveLength(nodes)
    expect(report.sampleRate).toBe(SR)
    expect(report.masterSamples).toBe(0)
    expect(report.maxLatencySamples).toBe(0)
    expect(report.maxArrivalSamples).toBe(0)
    expect(report.paths.map((path) => path.key)).toEqual([
      'master',
      'bus/fx',
      'group/drums',
      'track/music',
      'instrument/synth',
      'live-input/voice',
      'return/hall',
    ])
    for (const path of report.paths) {
      expect(path.latencySamples).toBe(0)
      expect(path.deficitSamples).toBe(0)
      expect(path.devices).toEqual([])
      expect(path.destination).toBe(path.kind === 'master' ? null : 'master')
    }
    expect(report.paths.map((path) => path.alignable)).toEqual([
      false,
      false,
      false,
      true,
      true,
      false,
      false,
    ])
    expect(engine.tracks[0].strip.materialized).toBe(false)
  })

  it('sums inserts (racks as their longest chain, the master with its limiter) down each route', async () => {
    const { engine } = await session()
    const { report, paths } = byKey(engine)
    expect(report.masterSamples).toBe(77)
    expect(report.maxLatencySamples).toBe(442)
    expect(report.maxArrivalSamples).toBe(442)

    expect(paths.master).toMatchObject({
      ownSamples: 77,
      latencySamples: 77,
      deficitSamples: 365,
      devices: [{ id: 'true-peak-limiter', latencySamples: 77, compensation: false }],
    })
    expect(paths['bus/fx']).toMatchObject({
      ownSamples: 10,
      latencySamples: 87,
      destination: 'master',
      alignable: false,
    })
    expect(paths['group/drums']).toMatchObject({
      ownSamples: 288,
      latencySamples: 365,
      devices: [{ id: 'compressor', latencySamples: 288, compensation: false }],
    })
    expect(paths['track/pad']).toMatchObject({
      ownSamples: 0,
      latencySamples: 365,
      deficitSamples: 77,
      destination: 'group/drums',
      alignable: true,
    })
    expect(paths['track/music']).toMatchObject({
      ownSamples: 365,
      latencySamples: 442,
      arrivalSec: 442 / SR,
      deficitSamples: 0,
      devices: [{ id: 'rack', latencySamples: 365, compensation: false }],
    })
    expect(paths['instrument/synth']).toMatchObject({ latencySamples: 77, deficitSamples: 365 })
    expect(paths['live-input/voice']).toMatchObject({
      latencySamples: 77,
      deficitSamples: 365,
      alignable: false,
    })
    expect(paths['return/hall']).toMatchObject({ latencySamples: 77, alignable: false })
  })

  it('follows re-routing into buses, groups and raw nodes', async () => {
    const { engine, pad, fx, drums, ctx } = await session()
    pad.strip.connectTo(fx)
    expect(byKey(engine).paths['track/pad']).toMatchObject({
      destination: 'bus/fx',
      latencySamples: 87,
    })
    drums.strip.connectTo(fx)
    expect(byKey(engine).paths['group/drums']).toMatchObject({
      destination: 'bus/fx',
      latencySamples: 288 + 87,
    })
    pad.strip.connectTo(ctx.destination)
    expect(byKey(engine).paths['track/pad']).toMatchObject({ destination: null, latencySamples: 0 })
    const side = engine.addBus('side', { destination: fx })
    expect(byKey(engine).paths['bus/side']).toMatchObject({
      destination: 'bus/fx',
      latencySamples: 87,
    })
    side.addInsert(fakeDevice(engine.context as unknown as MockAudioContext, 'x', 3))
    expect(byKey(engine).paths['bus/side'].latencySamples).toBe(90)
  })
})

describe('Engine.alignLatency', () => {
  it('delays clip and instrument tracks to the longest path and leaves everything else reported only', async () => {
    const { mock, engine, music, pad, synth, voice, hall, drums, fx } = await session()
    const delaysBefore = mock.delays.length
    const report = engine.alignLatency()

    // pad: 365 → 442 needs 77; synth: 77 → 442 needs 365; music is the longest path.
    const pad_ = stageOf(pad.strip)
    const synth_ = stageOf(synth.strip)
    expect(pad_?.delaySamples).toBe(77)
    expect(synth_?.delaySamples).toBe(365)
    expect(stageOf(music.strip)).toBeUndefined()
    expect(stageOf(voice.strip)).toBeUndefined()
    expect(stageOf(hall.strip)).toBeUndefined()
    expect(stageOf(drums.strip)).toBeUndefined()
    expect(fx.inserts.some(isAlignmentDelay)).toBe(false)
    expect(mock.delays).toHaveLength(delaysBefore + 2)
    expect((pad_?.node as unknown as MockDelayNode).delayTime.events).toEqual([
      { method: 'setValueAtTime', args: [77 / SR, 1] },
    ])

    const paths = Object.fromEntries(report.paths.map((path) => [path.key, path]))
    expect(report.maxArrivalSamples).toBe(442)
    expect(paths['track/pad']).toMatchObject({
      compensationSamples: 77,
      latencySamples: 365,
      arrivalSamples: 442,
      deficitSamples: 0,
      devices: [{ id: 'pdc-delay', latencySamples: 77, compensation: true }],
    })
    expect(paths['instrument/synth']).toMatchObject({
      compensationSamples: 365,
      arrivalSamples: 442,
      deficitSamples: 0,
    })
    expect(paths['track/music']).toMatchObject({ compensationSamples: 0, deficitSamples: 0 })
    expect(paths['live-input/voice']).toMatchObject({
      compensationSamples: 0,
      arrivalSamples: 77,
      deficitSamples: 365,
    })
    expect(paths['return/hall'].deficitSamples).toBe(365)
    expect(engine.latencyReport()).toEqual(report)
  })

  it('is idempotent and resizes the stages in place as latency moves', async () => {
    const { mock, engine, music, pad, synth, drums, glue, rack } = await session()
    engine.alignLatency()
    const delays = mock.delays.length
    const padStage = stageOf(pad.strip)
    const padDelay = padStage?.node as unknown as MockDelayNode

    engine.alignLatency()
    expect(mock.delays).toHaveLength(delays)
    expect(stageOf(pad.strip)).toBe(padStage)
    expect(padDelay.delayTime.events).toHaveLength(1)

    drums.strip.removeInsert(glue)
    let report = engine.alignLatency()
    expect(report.maxArrivalSamples).toBe(442)
    expect(padStage?.delaySamples).toBe(365)
    expect(stageOf(synth.strip)?.delaySamples).toBe(365)
    expect(report.paths.filter((p) => p.alignable).every((p) => p.deficitSamples === 0)).toBe(true)

    // The stale stages never inflate the target: dropping the rack leaves the
    // fx bus (10 + 77) as the longest path, so the stages shrink to 10.
    music.strip.removeInsert(rack)
    report = engine.alignLatency()
    expect(report.maxLatencySamples).toBe(87)
    expect(report.maxArrivalSamples).toBe(87)
    expect(padStage?.delaySamples).toBe(10)
    expect(stageOf(synth.strip)?.delaySamples).toBe(10)
    expect(stageOf(music.strip)?.delaySamples).toBe(10)
    expect(mock.delays).toHaveLength(delays + 1)
    expect(padDelay.delayTime.lastEvent('setValueAtTime')?.args).toEqual([10 / SR, 1])

    engine.removeBus('fx')
    report = engine.alignLatency()
    expect(report.maxArrivalSamples).toBe(77)
    expect(padStage?.delaySamples).toBe(0)
    expect(padDelay.delayTime.lastEvent('setValueAtTime')?.args).toEqual([0, 1])
  })

  it('aligns live inputs only when asked, and releases them again', async () => {
    const { engine, voice } = await session()
    engine.alignLatency()
    expect(stageOf(voice.strip)).toBeUndefined()

    let report = engine.alignLatency({ liveInputs: true })
    const stage = stageOf(voice.strip)
    expect(stage?.delaySamples).toBe(365)
    expect(report.paths.find((p) => p.key === 'live-input/voice')).toMatchObject({
      compensationSamples: 365,
      deficitSamples: 0,
      alignable: false,
    })

    report = engine.alignLatency()
    expect(stageOf(voice.strip)).toBe(stage)
    expect(stage?.delaySamples).toBe(0)
    expect(report.paths.find((p) => p.key === 'live-input/voice')?.deficitSamples).toBe(365)
  })

  it('re-inserts a stage the host pulled, prunes stages of removed tracks, and disposes with the engine', async () => {
    const { mock, engine, pad, synth } = await session()
    engine.alignLatency()
    const padStage = stageOf(pad.strip)
    if (!padStage) throw new Error('expected a stage on pad')
    pad.strip.removeInsert(padStage)
    expect(stageOf(pad.strip)).toBeUndefined()
    engine.alignLatency()
    expect(stageOf(pad.strip)).toBe(padStage)
    expect(padStage.delaySamples).toBe(77)

    const synthStage = stageOf(synth.strip)
    const synthDelay = synthStage?.node as unknown as MockDelayNode
    engine.removeTrack('pad')
    engine.alignLatency()
    expect((padStage.node as unknown as MockDelayNode).disconnectCalls.count).toBeGreaterThan(0)
    expect(stageOf(synth.strip)).toBe(synthStage)

    engine.dispose()
    expect(synthDelay.disconnectCalls.count).toBeGreaterThan(0)
    expect(() => engine.alignLatency()).toThrow(/disposed/)
    expect(mock.delays.length).toBeGreaterThan(0)
  })
})
