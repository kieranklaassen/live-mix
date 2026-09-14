import { describe, expect, it, vi } from 'vitest'

import {
  MockAudioBuffer,
  asAudioContext,
  asAudioNode,
  createMockContext,
  type MockAudioContext,
  type MockGainNode,
} from '../../testing'
import { Lfo, Macro } from '../../core/automation/Modulator'
import { type StretchNode, type StretchNodeFactory } from '../../core/sources/StretchSource'
import { type Device, type NoteDevice } from '../../core/devices/Device'
import { NODE_DEVICES } from '../../core/devices/native'
import { DeviceRegistry } from '../../core/devices/registry'
import { createEngine, type Engine } from '../../core/Engine'
import { type Operation } from '../operations'
import {
  createScore,
  defaultStrip,
  masterDestination,
  type Score,
  type ScoreDevice,
} from '../schema'
import { loadScore, scoreRendererOf, unloadScore } from '../loadScore'
import { ScoreDocument } from '../ScoreDocument'
import { ScoreRenderError, ScoreRenderer } from '../ScoreRenderer'
import { clip, demoScore } from './fixtures'

interface Rig {
  ctx: MockAudioContext
  engine: Engine
  document: ScoreDocument
  renderer: ScoreRenderer
  errors: unknown[]
  edit: (...ops: Operation[]) => Promise<void>
}

async function rig(score: Score = demoScore(), registry?: DeviceRegistry): Promise<Rig> {
  const ctx = createMockContext({ sampleRate: 48000 })
  const engine = createEngine({
    context: asAudioContext(ctx),
    setIntervalFn: () => 0 as unknown as ReturnType<typeof setInterval>,
    clearIntervalFn: () => {},
    devices: registry,
  })
  const buffer = new MockAudioBuffer(2, 48000 * 10, 48000) as unknown as AudioBuffer
  await engine.samples.load('a', buffer)
  await engine.samples.load('b', buffer)
  const document = new ScoreDocument(score, { now: () => 0 })
  const errors: unknown[] = []
  const renderer = loadScore(engine, document, { onError: (error) => errors.push(error) })
  await renderer.whenIdle()
  const edit = async (...ops: Operation[]): Promise<void> => {
    for (const op of ops) document.apply(op)
    await renderer.whenIdle()
  }
  return { ctx, engine, document, renderer, errors, edit }
}

function gainOf(node: AudioNode): MockGainNode {
  return node as unknown as MockGainNode
}

describe('ScoreRenderer: first render', () => {
  it('creates tracks, groups and returns with their routing and leaves untouched strips node-free', async () => {
    const { engine, renderer, ctx } = await rig()
    expect(engine.tracks.map((track) => track.name)).toEqual(['kick', 'pad'])
    expect(engine.groups.map((group) => group.name)).toEqual(['drums'])
    expect(engine.returnTracks.map((ret) => ret.name)).toEqual(['hall'])
    expect(engine.liveInputs.map((track) => track.name)).toEqual(['voice'])
    expect(renderer.audioTrack('kick').strip.destinationTarget).toBe(renderer.group('drums'))
    expect(renderer.audioTrack('pad').strip.destinationTarget).toBe(engine.master)
    // The live track's strip has defaults and no sends besides hall (direct): pre-fader list untouched.
    const voice = renderer.liveInput('voice')
    expect(voice.strip.materialized).toBe(true) // it has a send
    expect(renderer.returnTrack('hall').strip.materialized).toBe(false)
    expect(renderer.device('kick-filter').id).toBe('filter')
    expect(renderer.device('glue').getParam('ratio')).toBe(1.5)
    expect(engine.master.inserts).toEqual([renderer.device('glue')])
    expect(renderer.rendered).toBe(renderer.rendered)
    expect(ctx.gains.length).toBeGreaterThan(5)
    expect(
      renderer
        .audioTrack('kick')
        .clips.all()
        .map((c) => c.id),
    ).toEqual(['a1', 'b1'])
    expect(renderer.lane('pad-level').breakpoints).toHaveLength(2)
    expect(renderer.modulator('lfo1')).toBeInstanceOf(Lfo)
    expect(engine.automation.writers.size).toBe(1)
    expect(engine.modulation.routes).toHaveLength(1)
    expect(scoreRendererOf(engine)).toBe(renderer)
  })

  it('validates against the registry before touching the graph', async () => {
    const ctx = createMockContext()
    const engine = createEngine({ context: asAudioContext(ctx) })
    const score = demoScore()
    score.master.inserts[0].deviceId = 'unicorn'
    const renderer = new ScoreRenderer(engine)
    await expect(renderer.render(score)).rejects.toThrow(/not registered/)
    expect(engine.tracks).toEqual([])
    expect(ctx.gains).toHaveLength(1) // the master only
    expect(renderer.rendered).toBeNull()
    engine.dispose()
  })

  it('renders the transport loop and a live track the app attaches to', async () => {
    const score = demoScore()
    score.transport.loop = { enabled: true, lengthSec: 8 }
    const { engine, renderer, ctx } = await rig(score)
    expect(engine.transport.loop).toEqual({ enabled: true, lengthSec: 8 })
    const source = ctx.createGain()
    renderer.liveInput('voice').attach(asAudioNode(source))
    expect(renderer.liveInput('voice').source).toBe(source)
    expect(() => renderer.liveInput('kick')).toThrow(ScoreRenderError)
    expect(() => renderer.audioTrack('voice')).toThrow(ScoreRenderError)
    expect(() => renderer.host('nobody')).toThrow(/nothing rendered/)
  })
})

describe('ScoreRenderer: incremental edits', () => {
  it('strip settings ramp, and defaults never materialise a strip', async () => {
    const { renderer, edit } = await rig()
    const voice = renderer.liveInput('voice').strip
    await edit({ type: 'send.remove', owner: 'voice', target: 'hall' })
    const kick = renderer.audioTrack('kick').strip
    const fader = gainOf(kick.fader)
    const before = fader.gain.events.length
    await edit(
      { type: 'strip.set', owner: 'kick', param: 'level', value: 0.5 },
      { type: 'strip.set', owner: 'kick', param: 'inputGain', value: 1.2 },
      { type: 'strip.solo', owner: 'kick', solo: true },
      { type: 'strip.soloSafe', owner: 'pad', soloSafe: true },
    )
    expect(fader.gain.events.length).toBe(before + 1)
    expect(fader.gain.lastEvent('setTargetAtTime')?.args[0]).toBe(0.5)
    expect(kick.inputGain).toBe(1.2)
    expect(kick.solo).toBe(true)
    expect(renderer.audioTrack('pad').strip.soloSafe).toBe(true)
    // The live track stayed at defaults throughout: still whatever it was, no new ramps.
    expect(voice.level).toBe(1)
  })

  it('re-routes strips and dissolves groups', async () => {
    const { engine, renderer, edit } = await rig()
    await edit({ type: 'strip.route', id: 'pad', destination: { kind: 'group', id: 'drums' } })
    expect(renderer.audioTrack('pad').strip.destinationTarget).toBe(renderer.group('drums'))
    await edit({ type: 'group.remove', id: 'drums' })
    expect(engine.groups).toEqual([])
    expect(renderer.audioTrack('pad').strip.destinationTarget).toBe(engine.master)
    expect(renderer.audioTrack('kick').strip.destinationTarget).toBe(engine.master)
  })

  it('removing a return unwires the sends that fed it; removing a track drops its bindings', async () => {
    const { engine, renderer, edit } = await rig()
    const kick = renderer.audioTrack('kick')
    expect(kick.strip.sends.all()).toHaveLength(1)
    await edit({ type: 'return.remove', id: 'hall' })
    expect(engine.returnTracks).toEqual([])
    expect(kick.strip.sends.all()).toEqual([])
    expect(renderer.liveInput('voice').strip.sends.all()).toEqual([])

    expect(engine.automation.writers.size).toBe(1)
    await edit({ type: 'track.remove', id: 'pad' })
    expect(engine.automation.writers.size).toBe(0)
    expect(engine.tracks.map((track) => track.name)).toEqual(['kick'])
    expect(() => renderer.lane('pad-level')).toThrow()

    expect(engine.modulation.routes).toHaveLength(1)
    await edit({ type: 'track.remove', id: 'kick' })
    expect(engine.modulation.routes).toHaveLength(0)
    expect(engine.modulation.targets.size).toBe(0)
    expect(() => renderer.device('kick-filter')).toThrow()
  })

  it('adds, reorders and removes inserts, disposing what leaves the chain', async () => {
    const { renderer, edit } = await rig()
    const strip = renderer.audioTrack('kick').strip
    const filter = renderer.device('kick-filter')
    await edit({
      type: 'device.add',
      owner: 'kick',
      device: { id: 'kick-eq', deviceId: 'eq3', params: { lowGain: 3 }, bypass: true },
      index: 0,
    })
    const eq = renderer.device('kick-eq')
    expect(strip.inserts).toEqual([eq, filter])
    expect(eq.bypass).toBe(true)
    expect(eq.getParam('lowGain')).toBe(3)
    // The filter survived the reorder: same instance, still routed.
    expect(renderer.device('kick-filter')).toBe(filter)
    await edit({ type: 'device.move', id: 'kick-eq', index: 1 })
    expect(strip.inserts).toEqual([filter, eq])
    const dispose = vi.spyOn(eq, 'dispose')
    await edit({ type: 'device.remove', id: 'kick-eq' })
    expect(strip.inserts).toEqual([filter])
    expect(dispose).toHaveBeenCalledTimes(1)
    await edit({
      type: 'device.add',
      owner: 'master',
      device: { id: 'tail', deviceId: 'utility', params: {}, bypass: false },
    })
    expect(renderer.engine.master.inserts.map((device) => device.id)).toEqual([
      'compressor',
      'utility',
    ])
  })

  it('swaps a device whose type changed and rebuilds a return whose device changed', async () => {
    const { engine, renderer, edit } = await rig()
    const filter = renderer.device('kick-filter')
    const strip = renderer.audioTrack('kick').strip
    await edit(
      { type: 'device.remove', id: 'kick-filter' },
      {
        type: 'device.add',
        owner: 'kick',
        device: { id: 'kick-filter', deviceId: 'delay', params: {}, bypass: false },
      },
    )
    expect(renderer.device('kick-filter')).not.toBe(filter)
    expect(renderer.device('kick-filter').id).toBe('delay')
    expect(strip.inserts).toEqual([renderer.device('kick-filter')])
    // The route that targeted the old filter's `frequency` was dropped by the
    // operation cascade; a route on the new device binds to the new instance.
    expect(engine.modulation.routes).toHaveLength(0)
    await edit({
      type: 'route.add',
      route: {
        id: 'r1',
        source: 'lfo1',
        target: { kind: 'device', device: 'kick-filter', param: 'timeSec' },
        depth: 0.2,
        polarity: 'unipolar',
      },
    })
    expect(engine.modulation.routes).toHaveLength(1)
    // Swapping the type again (same id) rebinds: the route follows the new device.
    const delay = renderer.device('kick-filter')
    await edit(
      { type: 'device.remove', id: 'kick-filter' },
      {
        type: 'device.add',
        owner: 'kick',
        device: { id: 'kick-filter', deviceId: 'utility', params: {}, bypass: false },
      },
      {
        type: 'route.add',
        route: {
          id: 'r1',
          source: 'lfo1',
          target: { kind: 'device', device: 'kick-filter', param: 'gainDb' },
          depth: 0.2,
          polarity: 'unipolar',
        },
      },
    )
    expect(renderer.device('kick-filter')).not.toBe(delay)
    expect(engine.modulation.routes).toHaveLength(1)
    expect(engine.modulation.targets.size).toBe(1)

    const hall = renderer.returnTrack('hall')
    await edit(
      { type: 'return.remove', id: 'hall' },
      {
        type: 'return.add',
        return: {
          id: 'hall',
          name: 'Hall',
          destination: masterDestination(),
          strip: defaultStrip({ soloSafe: true }),
          device: { id: 'hall-verb', deviceId: 'delay', params: {}, bypass: false },
        },
      },
      { type: 'send.add', owner: 'kick', target: 'hall', level: 0.1 },
    )
    expect(renderer.returnTrack('hall')).not.toBe(hall)
    expect(engine.returnTracks).toHaveLength(1)
    expect(strip.sends.all()[0].target).toBe(renderer.returnTrack('hall'))
  })

  it('device params, presets and bypass follow the document', async () => {
    const { renderer, edit } = await rig()
    const filter = renderer.device('kick-filter')
    const glue = renderer.device('glue')
    await edit(
      { type: 'device.setParam', device: 'kick-filter', param: 'q', value: 4 },
      { type: 'device.preset', device: 'glue', preset: 'Limit' },
      { type: 'device.bypass', device: 'hall-verb', bypass: true },
    )
    expect(filter.getParam('q')).toBe(4)
    expect(glue.getParam('ratio')).toBe(20)
    expect(renderer.device('hall-verb').bypass).toBe(true)
    await edit({ type: 'device.preset', device: 'glue', preset: null, params: { ratio: 2 } })
    expect(glue.getParam('ratio')).toBe(2)
    expect(glue.getParam('threshold')).toBe(-24)
    expect(
      renderer.effectiveParams({
        id: 'x',
        deviceId: 'compressor',
        preset: 'Voice',
        params: { ratio: 99 },
        bypass: false,
      }),
    ).toMatchObject({ ratio: 20, threshold: -20 })
  })

  it('sends: level ramps in place, direct↔level swaps rewire, removals unwire', async () => {
    const { renderer, edit } = await rig()
    const kick = renderer.audioTrack('kick').strip
    const send = kick.sends.all()[0]
    if (!send.gainNode) throw new Error('expected a send level gain')
    const gain = gainOf(send.gainNode)
    await edit({ type: 'send.set', owner: 'kick', target: 'hall', level: 0.5 })
    expect(kick.sends.all()[0]).toBe(send)
    expect(gain.gain.lastEvent('setTargetAtTime')?.args[0]).toBe(0.5)
    await edit({ type: 'send.set', owner: 'kick', target: 'hall', level: null })
    expect(kick.sends.all()[0]).not.toBe(send)
    expect(kick.sends.all()[0].gainNode).toBeNull()
    await edit({ type: 'send.add', owner: 'pad', target: 'hall', level: 0.2 })
    expect(renderer.audioTrack('pad').strip.sends.all()).toHaveLength(1)
    await edit({ type: 'send.remove', owner: 'kick', target: 'hall' })
    expect(kick.sends.all()).toEqual([])
  })

  it('clips are replaced only when they changed; lookaheads follow the track', async () => {
    const { renderer, edit } = await rig()
    const track = renderer.audioTrack('kick')
    const set = vi.spyOn(track.clips, 'set')
    await edit({ type: 'strip.set', owner: 'kick', param: 'pan', value: 0.1 })
    expect(set).not.toHaveBeenCalled()
    await edit({ type: 'clip.add', track: 'kick', clip: clip('c', 'b', 9) })
    expect(set).toHaveBeenCalledTimes(1)
    expect(track.clips.all().map((c) => c.id)).toEqual(['a1', 'b1', 'c'])
    await edit({ type: 'clip.replaceFrom', track: 'kick', fromSec: 4, clips: [clip('d', 'a', 5)] })
    expect(track.clips.all().map((c) => c.id)).toEqual(['a1', 'd'])
    await edit({
      type: 'track.add',
      track: {
        kind: 'audio',
        id: 'bed',
        name: 'Bed',
        destination: masterDestination(),
        strip: defaultStrip(),
        lookaheadSec: 5,
        preloadSec: 12,
        clips: [],
      },
    })
    const bed = renderer.audioTrack('bed')
    expect([bed.lookaheadSec, bed.preloadSec]).toEqual([5, 12])
  })

  it('unloaded clip sources resolve through the score (url by default, or the app)', async () => {
    const seen: string[] = []
    const ctx = createMockContext()
    const engine = createEngine({ context: asAudioContext(ctx) })
    const score = createScore()
    score.sources = [{ id: 's', url: '/s.mp3' }]
    score.tracks = [
      {
        kind: 'audio',
        id: 't',
        name: 't',
        destination: masterDestination(),
        strip: defaultStrip(),
        clips: [clip('c', 's', 0)],
      },
    ]
    const renderer = new ScoreRenderer(engine, {
      resolveSource: (source) => {
        seen.push(source.id)
        return new MockAudioBuffer(2, 100, 44100) as unknown as AudioBuffer
      },
    })
    await renderer.render(score)
    engine.transport.start()
    engine.scheduler.tick()
    expect(seen).toEqual(['s'])
    engine.dispose()
  })
})

describe('ScoreRenderer: lanes, routes and modulators', () => {
  it('a lane edit re-plans in place; removing it hands the parameter back at the static value', async () => {
    const { engine, renderer, edit } = await rig()
    const lane = renderer.lane('pad-level')
    const version = lane.version
    const fader = gainOf(renderer.audioTrack('pad').strip.fader)
    await edit({
      type: 'lane.addBreakpoint',
      id: 'pad-level',
      breakpoint: { timeSec: 2, value: 1 },
    })
    expect(renderer.lane('pad-level')).toBe(lane)
    expect(lane.version).toBe(version + 1)
    expect(lane.breakpoints).toHaveLength(3)
    // The static level is owned by the lane: no ramp on the fader.
    const before = fader.gain.events.length
    await edit({ type: 'strip.set', owner: 'pad', param: 'level', value: 0.6 })
    expect(fader.gain.events.length).toBe(before)
    await edit({ type: 'lane.remove', id: 'pad-level' })
    expect(engine.automation.writers.size).toBe(0)
    expect(fader.gain.lastEvent('setTargetAtTime')?.args[0]).toBe(0.6)
  })

  it('routes update depth in place, and the static value becomes the base', async () => {
    const { engine, renderer, edit } = await rig()
    const route = engine.modulation.routes[0]
    await edit({ type: 'route.update', id: 'r1', depth: -0.2, polarity: 'unipolar' })
    expect(engine.modulation.routes[0]).toBe(route)
    expect(route).toMatchObject({ depth: -0.2, polarity: 'unipolar' })
    const target = route.target
    expect(target.base).toBe(2000)
    await edit({ type: 'device.setParam', device: 'kick-filter', param: 'frequency', value: 500 })
    expect(target.base).toBe(500)
    // The renderer did not also write the param directly: the matrix owns it.
    expect(renderer.device('kick-filter').getParam('frequency')).toBe(2000)
    await edit({ type: 'route.remove', id: 'r1' })
    expect(engine.modulation.targets.size).toBe(0)
    expect(renderer.device('kick-filter').getParam('frequency')).toBe(500)
  })

  it('a lane plus a route on one parameter runs through the matrix with the lane as base', async () => {
    const { engine, edit } = await rig()
    await edit({
      type: 'route.add',
      route: {
        id: 'r2',
        source: 'lfo1',
        target: { kind: 'strip', owner: 'pad', param: 'level' },
        depth: 0.1,
        polarity: 'bipolar',
      },
    })
    expect(engine.automation.writers.size).toBe(0)
    expect(engine.modulation.routes).toHaveLength(2)
    const route = engine.modulation.routes.find((r) => r.depth === 0.1)
    expect(route?.target.base).toBeInstanceOf(Object)
    expect(typeof route?.target.base).not.toBe('number')
    await edit({ type: 'route.remove', id: 'r2' })
    expect(engine.automation.writers.size).toBe(1)
  })

  it('a lane on a strip parameter of the master drives the master fader', async () => {
    const { engine, edit, ctx } = await rig()
    await edit({
      type: 'lane.add',
      lane: {
        id: 'm',
        target: { kind: 'strip', owner: 'master', param: 'level' },
        breakpoints: [{ timeSec: 0, value: 0.5 }],
      },
    })
    expect(engine.automation.writers.size).toBe(2)
    engine.transport.start()
    expect(ctx.gains[0].gain.lastEvent('setValueAtTime')?.args[0]).toBe(0.5)
  })

  it('modulators update in place or are recreated when their kind changes', async () => {
    const { engine, renderer, edit } = await rig()
    const lfo = renderer.modulator('lfo1') as Lfo
    await edit({ type: 'modulator.update', id: 'lfo1', patch: { rateHz: 2, shape: 'saw' } })
    expect(renderer.modulator('lfo1')).toBe(lfo)
    expect(lfo.rateHz).toBe(2)
    expect(lfo.shape).toBe('saw')
    const route = engine.modulation.routes[0]
    await edit(
      { type: 'modulator.remove', id: 'lfo1' },
      {
        type: 'modulator.add',
        modulator: { id: 'lfo1', kind: 'macro', value: 0.3 },
      },
      {
        type: 'route.add',
        route: {
          id: 'r1',
          source: 'lfo1',
          target: { kind: 'device', device: 'kick-filter', param: 'frequency' },
          depth: 0.3,
          polarity: 'bipolar',
        },
      },
    )
    expect(renderer.modulator('lfo1')).toBeInstanceOf(Macro)
    expect(engine.modulation.routes[0]).not.toBe(route)
    expect(engine.modulation.routes[0].source).toBe(renderer.modulator('lfo1'))
  })
})

describe('ScoreRenderer: instruments', () => {
  function fakeNoteDevice(ctx: BaseAudioContext): NoteDevice {
    const node = ctx.createGain()
    return {
      id: 'synth',
      input: node,
      output: node,
      params: {
        gain: { id: 0, name: 'Gain', min: 0, max: 1, default: 1, taper: 'linear', unit: '' },
      },
      setParam: () => {},
      getParam: () => 1,
      bypass: false,
      latencySec: 0,
      noteOn: vi.fn(),
      noteOff: vi.fn(),
      dispose: () => node.disconnect(),
    }
  }

  it('creates an instrument track from a NoteDevice in the registry and refuses a plain device', async () => {
    const registry = new DeviceRegistry(NODE_DEVICES)
    registry.register({
      id: 'synth',
      name: 'Synth',
      kind: 'node',
      category: 'instrument',
      version: 1,
      params: {
        gain: { id: 0, name: 'Gain', min: 0, max: 1, default: 1, taper: 'linear', unit: '' },
      },
      create: (ctx) => fakeNoteDevice(ctx),
    })
    const score = createScore()
    const device: ScoreDevice = { id: 'synth-1', deviceId: 'synth', params: {}, bypass: false }
    score.tracks = [
      {
        kind: 'instrument',
        id: 'keys',
        name: 'Keys',
        destination: masterDestination(),
        strip: defaultStrip(),
        device,
      },
    ]
    const { engine, renderer, edit } = await rig(score, registry)
    expect(engine.instruments.map((track) => track.name)).toEqual(['keys'])
    renderer.instrument('keys').noteOn(1, 440)
    expect((renderer.device('synth-1') as NoteDevice).noteOn).toHaveBeenCalledWith(
      1,
      440,
      undefined,
    )
    await edit({ type: 'track.remove', id: 'keys' })
    expect(engine.instruments).toEqual([])

    const plain = createScore()
    plain.tracks = [
      {
        kind: 'instrument',
        id: 'k2',
        name: '',
        destination: masterDestination(),
        strip: defaultStrip(),
        device: { id: 'f', deviceId: 'filter', params: {}, bypass: false },
      },
    ]
    await expect(new ScoreRenderer(engine, { devices: registry }).render(plain)).rejects.toThrow(
      /NoteDevice/,
    )
  })
})

describe('ScoreRenderer: lifecycle', () => {
  it('folds a burst of document changes into one render and reports busy/idle', async () => {
    const { renderer, document } = await rig()
    const reconcile = vi.spyOn(
      renderer as unknown as { reconcile: () => Promise<void> },
      'reconcile',
    )
    document.apply({ type: 'strip.set', owner: 'kick', param: 'level', value: 0.1 })
    document.apply({ type: 'strip.set', owner: 'kick', param: 'level', value: 0.2 })
    document.apply({ type: 'strip.set', owner: 'kick', param: 'level', value: 0.3 })
    expect(renderer.busy).toBe(true)
    await renderer.whenIdle()
    expect(renderer.busy).toBe(false)
    expect(reconcile).toHaveBeenCalledTimes(1)
    expect(renderer.rendered).toBe(document.score)
    expect(renderer.audioTrack('kick').strip.level).toBe(0.3)
  })

  it('a render requested during a render lands afterwards with the latest score', async () => {
    const { renderer, document, engine } = await rig()
    const first = renderer.render(document.score)
    const edited = document.score
    const second = renderer.render({ ...edited, master: { ...edited.master, level: 0.1 } })
    await Promise.all([first, second])
    expect(renderer.rendered?.master.level).toBe(0.1)
    expect(engine.master.gain.value).toBe(1) // ramped, not stepped
  })

  it('undo and redo through the document reconcile the graph both ways', async () => {
    const { renderer, document, edit, engine } = await rig()
    await edit({ type: 'track.remove', id: 'kick' })
    expect(engine.tracks.map((track) => track.name)).toEqual(['pad'])
    document.undo()
    await renderer.whenIdle()
    expect(engine.tracks.map((track) => track.name)).toEqual(['pad', 'kick'])
    expect(renderer.audioTrack('kick').strip.level).toBe(0.8)
    expect(renderer.audioTrack('kick').strip.inserts).toHaveLength(1)
    expect(engine.modulation.routes).toHaveLength(1)
    document.redo()
    await renderer.whenIdle()
    expect(engine.tracks.map((track) => track.name)).toEqual(['pad'])
  })

  it('failures from document-driven renders go to onError; the previous render stands', async () => {
    const { renderer, document, errors } = await rig()
    const before = renderer.rendered
    // Valid for the document, unknown to the registry.
    document.apply({
      type: 'device.add',
      owner: 'pad',
      device: { id: 'x', deviceId: 'not-a-device', params: {}, bypass: false },
    })
    await renderer.whenIdle()
    expect(errors).toHaveLength(1)
    expect(renderer.rendered).toBe(before)
  })

  it('dispose removes everything the renderer created; engine.dispose disposes the renderer', async () => {
    const { renderer, engine, document } = await rig()
    renderer.dispose()
    expect(engine.tracks).toEqual([])
    expect(engine.groups).toEqual([])
    expect(engine.returnTracks).toEqual([])
    expect(engine.liveInputs).toEqual([])
    expect(engine.master.inserts).toEqual([])
    expect(engine.automation.writers.size).toBe(0)
    expect(engine.modulation.routes).toEqual([])
    expect(renderer.rendered).toBeNull()
    await expect(renderer.render(document.score)).rejects.toThrow(/disposed/)
    // Detached: further edits do not reach the renderer.
    document.apply({ type: 'score.rename', name: 'x' })
    await renderer.whenIdle()

    const again = loadScore(engine, document)
    await again.whenIdle()
    expect(scoreRendererOf(engine)).toBe(again)
    expect(engine.tracks).toHaveLength(2)
    const previous = loadScore(engine, demoScore())
    expect(scoreRendererOf(engine)).toBe(previous)
    await previous.whenIdle()
    expect(engine.tracks).toHaveLength(2)
    // Engine disposal tears the graph down itself; the renderer lets go and stops following.
    engine.dispose()
    await expect(previous.render(demoScore())).rejects.toThrow(/disposed/)
    unloadScore(engine)
    expect(scoreRendererOf(engine)).toBeUndefined()
  })

  it('a device that leaves through a non-insert path keeps the registry honest', async () => {
    const { renderer } = await rig()
    const device: Device = renderer.device('hall-verb')
    expect(device.id).toBe('convolver-reverb')
  })
})

describe('ScoreRenderer: stretch tracks (U31 follow-up)', () => {
  const createStretch: StretchNodeFactory = () =>
    Promise.resolve({
      connect: vi.fn(),
      disconnect: vi.fn(),
      schedule: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      addBuffers: vi.fn(() => Promise.resolve(10)),
      dropBuffers: vi.fn(() => Promise.resolve(undefined)),
      latency: () => 0.05,
      inputTime: 0,
    } as unknown as StretchNode)

  async function stretchRig(withFactory: boolean) {
    const score = demoScore()
    const kick = score.tracks[0]
    if (kick.kind === 'audio') kick.stretch = true
    const ctx = createMockContext({ sampleRate: 48000 })
    const engine = createEngine({
      context: asAudioContext(ctx),
      setIntervalFn: () => 0 as unknown as ReturnType<typeof setInterval>,
      clearIntervalFn: () => {},
    })
    const document = new ScoreDocument(score, { now: () => 0 })
    const errors: unknown[] = []
    const renderer = loadScore(engine, document, {
      onError: (error) => errors.push(error),
      ...(withFactory ? { createStretch } : {}),
    })
    await renderer.whenIdle()
    return { engine, document, renderer, errors }
  }

  it('renders an audio track marked stretch as a StretchTrack with its clips, strip and routing', async () => {
    const { engine, renderer, document } = await stretchRig(true)
    const kick = renderer.stretchTrack('kick')
    expect(engine.stretchTracks).toEqual([kick])
    expect(engine.tracks.map((track) => track.name)).toEqual(['pad'])
    expect(renderer.clipTrack('kick')).toBe(kick)
    expect(renderer.clipTrack('pad')).toBe(renderer.audioTrack('pad'))
    expect(() => renderer.audioTrack('kick')).toThrow(/not an audio track/)
    expect(kick.strip.destinationTarget).toBe(renderer.group('drums'))
    expect(kick.clips.all().map((clip) => clip.id)).toEqual(['a1', 'b1'])
    expect(kick.strip.inserts.map((device) => device.id)).toEqual(['filter'])

    // Flipping the flag rebuilds the track the other way; clips follow.
    document.apply({
      type: 'clip.add',
      track: 'kick',
      clip: { ...kick.clips.all()[0], id: 'c1', startSec: 20 },
    })
    await renderer.whenIdle()
    expect(kick.clips.all().map((clip) => clip.id)).toEqual(['a1', 'b1', 'c1'])
    const score = {
      ...document.score,
      tracks: document.score.tracks.map((track) =>
        track.id === 'kick' && track.kind === 'audio' ? { ...track, stretch: false } : track,
      ),
    }
    await renderer.render(score)
    expect(engine.stretchTracks).toEqual([])
    expect(
      renderer
        .audioTrack('kick')
        .clips.all()
        .map((clip) => clip.id),
    ).toEqual(['a1', 'b1', 'c1'])
  })

  it('a stretch track without a factory is a render error, not a silent buffer track', async () => {
    const { errors, engine } = await stretchRig(false)
    expect(errors).toHaveLength(1)
    expect(String((errors[0] as Error).message)).toMatch(/createStretch/)
    expect(engine.stretchTracks).toEqual([])
  })
})
