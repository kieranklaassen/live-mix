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
import { type Clip } from '../../core/clips/Clip'
import { type StretchNode, type StretchNodeFactory } from '../../core/sources/StretchSource'
import { type Device, type NoteDevice, type StatefulDevice } from '../../core/devices/Device'
import { NODE_DEVICES } from '../../core/devices/native'
import { FILTER_DEVICE } from '../../core/devices/native/Filter'
import { NodeDevice } from '../../core/devices/native/NodeDevice'
import { DeviceRegistry } from '../../core/devices/registry'
import { createEngine, type Engine } from '../../core/Engine'
import { type Operation } from '../operations'
import {
  createScore,
  defaultStrip,
  findDevice,
  masterDestination,
  withCurrentDeviceIds,
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

  it('renders a device saved under an id it had before it was renamed, and follows the document on to the new one', async () => {
    // The filter under a new id, still answering to the old one.
    const renamed = new DeviceRegistry(
      NODE_DEVICES.map((descriptor) =>
        descriptor.id === 'filter'
          ? {
              ...descriptor,
              id: 'tone',
              formerIds: ['filter'],
              create: (context, options) =>
                new NodeDevice(context, { ...FILTER_DEVICE, id: 'tone' }, options),
            }
          : descriptor,
      ),
    )
    const score = demoScore()
    expect(findDevice(score, 'kick-filter')?.device.deviceId).toBe('filter')
    const { renderer, errors, document, edit } = await rig(score, renamed)
    expect(errors).toEqual([])
    const saved = renderer.device('kick-filter')
    expect(saved.id).toBe('tone')
    expect(saved.getParam('frequency')).toBe(2000)
    // The lane and the route that address the instance still reach it.
    expect(renderer.engine.modulation.routes).toHaveLength(1)

    await edit({ type: 'score.replace', score: withCurrentDeviceIds(document.score, renamed) })
    expect(errors).toEqual([])
    expect(findDevice(document.score, 'kick-filter')?.device.deviceId).toBe('tone')
    expect(renderer.device('kick-filter').id).toBe('tone')
    expect(renderer.device('kick-filter').getParam('frequency')).toBe(2000)
  })

  it("gives the scheduler the score's seed, and a clip its chance", async () => {
    const score = demoScore()
    score.transport.seed = 7
    const { engine, renderer } = await rig(score)
    expect(engine.scheduler.seed).toBe(7)
    await renderer.render({ ...score, transport: { ...score.transport, seed: 9 } })
    expect(engine.scheduler.seed).toBe(9)
    const unseeded = { loop: score.transport.loop, quantize: score.transport.quantize }
    await renderer.render({ ...score, transport: unseeded })
    expect(engine.scheduler.seed).toBe(0)

    const track = score.tracks.find((candidate) => candidate.kind === 'audio')
    if (track?.kind !== 'audio') throw new Error('demoScore has an audio track')
    const [first] = track.clips
    const drawn = {
      ...score,
      tracks: score.tracks.map((candidate) =>
        candidate === track
          ? { ...track, clips: [{ ...first, chance: 0.5 }, ...track.clips.slice(1)] }
          : candidate,
      ),
    }
    await renderer.render(drawn)
    expect(
      renderer
        .audioTrack(track.id)
        .clips.all()
        .find((clip) => clip.id === first.id)?.chance,
    ).toBe(0.5)
    engine.dispose()
  })

  it('gives a clip its turns, and takes them off again', async () => {
    const score = demoScore()
    const { engine, renderer } = await rig(score)
    const track = score.tracks.find((candidate) => candidate.kind === 'audio')
    if (track?.kind !== 'audio') throw new Error('demoScore has an audio track')
    const [first] = track.clips
    const withTurns = (turns: Clip['turns']) => ({
      ...score,
      tracks: score.tracks.map((candidate) =>
        candidate === track
          ? { ...track, clips: [{ ...first, turns }, ...track.clips.slice(1)] }
          : candidate,
      ),
    })
    const live = () =>
      renderer
        .audioTrack(track.id)
        .clips.all()
        .find((clip) => clip.id === first.id)
    await renderer.render(withTurns({ sourceIds: ['a', 'b'], every: 2 }))
    expect(live()?.turns).toEqual({ sourceIds: ['a', 'b'], every: 2 })
    await renderer.render(withTurns({ sourceIds: ['b', 'a'], every: 2 }))
    expect(live()?.turns).toEqual({ sourceIds: ['b', 'a'], every: 2 })
    await renderer.render(score)
    expect(live()?.turns).toBeUndefined()
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

  it('a parameter the device does not have is left out, also one named as something every plain object has', async () => {
    const { renderer } = await rig()
    const given = JSON.parse(
      '{"ratio":3,"nope":1,"constructor":1,"toString":2,"__proto__":3}',
    ) as Record<string, number>
    const params = renderer.effectiveParams({
      id: 'x',
      deviceId: 'compressor',
      params: given,
      bypass: false,
    })
    expect(params.ratio).toBe(3)
    expect(Object.keys(params)).not.toContain('nope')
    expect(Object.keys(params)).not.toContain('constructor')
    expect(Object.keys(params)).not.toContain('toString')
    expect(Object.getPrototypeOf(params)).toBe(Object.prototype)
  })

  it('a changed value for a parameter a loaded plug-in does not have is not written to it, and the render lands', async () => {
    const gain = {
      gain: { id: 0, name: 'Gain', min: 0, max: 1, default: 1, taper: 'linear', unit: '' },
    } as const
    const sets: [string, number][] = []
    const registry = new DeviceRegistry(NODE_DEVICES)
    // As a hosted plug-in registers: its table is only known once it is loaded.
    registry.register({
      id: 'hosted',
      name: 'Hosted',
      kind: 'native',
      category: 'plugin',
      version: 1,
      params: {},
      dynamicParams: true,
      create: (ctx) => {
        const node = ctx.createGain()
        const values = new Map<string, number>()
        const device: Device = {
          id: 'hosted',
          input: node,
          output: node,
          params: gain,
          setParam: (name, value) => {
            if (!Object.hasOwn(gain, name)) {
              throw new Error(`live-mix: hosted has no parameter "${name}"`)
            }
            sets.push([name, value])
            values.set(name, value)
          },
          getParam: (name) => values.get(name) ?? 1,
          bypass: false,
          latencySec: 0,
          dispose: () => node.disconnect(),
        }
        return device
      },
    })
    const score = demoScore()
    // `gone` was saved with a version of the plug-in that still had it.
    score.master.inserts.push({
      id: 'hosted-1',
      deviceId: 'hosted',
      params: { gone: 0.2, gain: 0.5 },
      bypass: false,
    })
    const { renderer, document, errors, edit } = await rig(score, registry)
    expect(errors).toEqual([])
    await edit(
      { type: 'device.setParam', device: 'hosted-1', param: 'gone', value: 0.6 },
      { type: 'device.setParam', device: 'hosted-1', param: 'gain', value: 0.8 },
    )
    expect(errors).toEqual([])
    expect(sets).toEqual([['gain', 0.8]])
    expect(renderer.rendered).toBe(document.score)
    // Nor under a name every object answers to and no plug-in lists.
    await edit({ type: 'device.setParam', device: 'hosted-1', param: 'constructor', value: 0.4 })
    expect(errors).toEqual([])
    expect(sets).toEqual([['gain', 0.8]])
    expect(renderer.rendered).toBe(document.score)
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

  it('a track loops at a length of its own when the document gives it one, and stops when it takes it away', async () => {
    const { renderer, edit, engine, ctx } = await rig()
    const pad = renderer.audioTrack('pad')
    expect(pad.loopLengthSec).toBeNull()
    await edit({ type: 'track.loop', id: 'pad', lengthSec: 10 })
    expect(renderer.audioTrack('pad')).toBe(pad)
    expect(pad.loopLengthSec).toBe(10)
    expect(renderer.audioTrack('kick').loopLengthSec).toBeNull()

    // 21 s in: the pad's clip (at 1 s) starts on its own loop's third pass, with nothing of the kick's near.
    engine.transport.seekElapsed(21)
    engine.transport.start()
    expect(pad.voices().map((voice) => voice.key)).toEqual(['a2:0:1.000'])
    expect(renderer.audioTrack('kick').voices()).toEqual([])
    engine.transport.stop()

    await edit({ type: 'track.loop', id: 'pad', lengthSec: null })
    expect(pad.loopLengthSec).toBeNull()

    await edit({
      type: 'track.add',
      track: {
        kind: 'audio',
        id: 'tape',
        name: 'Tape',
        destination: masterDestination(),
        strip: defaultStrip(),
        loopLengthSec: 23.5,
        clips: [],
      },
    })
    expect(renderer.audioTrack('tape').loopLengthSec).toBe(23.5)
    expect(ctx.currentTime).toBe(0)
  })

  it('a lane under modulation is read on its track’s own loop, where the track has one', async () => {
    const { renderer, edit, engine } = await rig()
    // The pad's level lane gets a route: it is now the base of a modulation target.
    await edit({
      type: 'route.add',
      route: {
        id: 'r2',
        source: 'lfo1',
        target: { kind: 'strip', owner: 'pad', param: 'level' },
        depth: 0.1,
        polarity: 'unipolar',
      },
    })
    const lane = renderer.lane('pad-level')
    const target = [...engine.modulation.targets].find((candidate) => candidate.base === lane)
    expect(target).toBeDefined()
    // On the transport's loop it names no clock of its own.
    expect(target?.timebase?.()).toBeUndefined()

    await edit({ type: 'track.loop', id: 'pad', lengthSec: 10 })
    const own = [...engine.modulation.targets].find((candidate) => candidate.base === lane)
    expect(own?.timebase?.()).toBe(renderer.audioTrack('pad').timebase)
    // 23 s in, the pad's loop is 3 s into its third pass, and that is where its lane is read.
    engine.transport.seekElapsed(23)
    expect(own?.timebase?.()?.position().positionSec).toBe(3)
    expect(engine.transport.position().positionSec).toBe(23)
  })

  it('muting a clip reaches the track; an annotation alone never touches it', async () => {
    const { renderer, edit } = await rig()
    const track = renderer.audioTrack('kick')
    const set = vi.spyOn(track.clips, 'set')
    await edit({ type: 'clip.update', track: 'kick', id: 'a1', patch: { meta: { row: 3 } } })
    expect(set).not.toHaveBeenCalled()
    await edit({ type: 'clip.update', track: 'kick', id: 'a1', patch: { muted: true } })
    expect(set).toHaveBeenCalledTimes(1)
    expect(track.clips.get('a1')?.muted).toBe(true)
    expect(track.clips.audible().map((c) => c.id)).toEqual(['b1'])
    await edit({ type: 'clip.update', track: 'kick', id: 'a1', patch: { muted: false } })
    expect(track.clips.audible().map((c) => c.id)).toEqual(['a1', 'b1'])
  })

  it('a change to the region a clip loops over reaches the track on its own', async () => {
    const { renderer, edit } = await rig()
    const track = renderer.audioTrack('kick')
    const loop = { loop: true, loopStartSec: 0, loopEndSec: 1 }
    await edit({ type: 'clip.update', track: 'kick', id: 'a1', patch: loop })
    const set = vi.spyOn(track.clips, 'set')
    await edit({ type: 'clip.update', track: 'kick', id: 'a1', patch: { loopEndSec: 0.5 } })
    expect(set).toHaveBeenCalledTimes(1)
    expect(track.clips.get('a1')?.loopEndSec).toBe(0.5)
  })

  it('reversing a clip reaches the track, and so does turning it back', async () => {
    const { renderer, edit } = await rig()
    const track = renderer.audioTrack('kick')
    const set = vi.spyOn(track.clips, 'set')
    await edit({ type: 'clip.update', track: 'kick', id: 'a1', patch: { reversed: true } })
    expect(set).toHaveBeenCalledTimes(1)
    expect(track.clips.get('a1')?.reversed).toBe(true)
    await edit({ type: 'clip.update', track: 'kick', id: 'a1', patch: { reversed: false } })
    expect(set).toHaveBeenCalledTimes(2)
    expect(track.clips.get('a1')?.reversed ?? false).toBe(false)
  })

  it('a change to where a clip sits reaches the track, and so does taking it off', async () => {
    const { renderer, edit } = await rig()
    const track = renderer.audioTrack('kick')
    const set = vi.spyOn(track.clips, 'set')
    await edit({ type: 'clip.update', track: 'kick', id: 'a1', patch: { pan: 0.4, spaceDb: -9 } })
    expect(set).toHaveBeenCalledTimes(1)
    expect(track.clips.get('a1')).toMatchObject({ pan: 0.4, spaceDb: -9 })
    await edit({ type: 'clip.update', track: 'kick', id: 'a1', patch: { lowpassHz: 3000 } })
    expect(set).toHaveBeenCalledTimes(2)
    await edit({ type: 'clip.update', track: 'kick', id: 'a1', patch: { pan: null } })
    expect(set).toHaveBeenCalledTimes(3)
    expect(track.clips.get('a1')?.pan).toBeUndefined()
  })

  it('a stretched timeline moves the transport with its clips and leaves what sounds sounding', async () => {
    const score = demoScore()
    score.transport.loop = { enabled: true, lengthSec: 32 }
    const { ctx, engine, renderer, document, edit } = await rig(score)
    const track = renderer.audioTrack('kick')
    ctx.currentTime = 100
    engine.transport.start()
    ctx.currentTime = 105
    engine.scheduler.tick()
    // b1 (4 s to 8 s) is sounding, a second in.
    const voice = track.voice('b1:0:4.000')
    expect(voice).toBeDefined()

    // 120 bpm to 100 bpm: the loop and every start 1.2 times as long, in one edit.
    const slower: Operation = {
      type: 'batch',
      ops: [
        { type: 'transport.loop', lengthSec: 38.4 },
        { type: 'clip.update', track: 'kick', id: 'b1', patch: { startSec: 4.8 } },
      ],
    }
    renderer.stretchTimeline(1.2)
    await edit(slower)

    expect(engine.transport.loop).toEqual({ enabled: true, lengthSec: 38.4 })
    // Bar for bar where it was: 5 s of 32 is 6 s of 38.4.
    expect(engine.transport.position().positionSec).toBeCloseTo(6, 9)
    expect(track.voice('b1:0:4.800')).toBe(voice)
    expect(track.voices()).toHaveLength(1)

    // The same edit back, unannounced, is a loop change and a moved clip:
    // the position stays in seconds and the voice is let go.
    document.apply({
      type: 'batch',
      ops: [
        { type: 'transport.loop', lengthSec: 32 },
        { type: 'clip.update', track: 'kick', id: 'b1', patch: { startSec: 4 } },
      ],
    })
    await renderer.whenIdle()
    expect(engine.transport.position().positionSec).toBeCloseTo(6, 9)
    expect(track.voice('b1:0:4.800')).toBeUndefined()

    // One announcement covers one render.
    expect(() => renderer.stretchTimeline(0)).toThrow(RangeError)
  })

  it('a source update that only renames or annotates leaves the tracks alone', async () => {
    const { renderer, document, edit } = await rig()
    const set = vi.spyOn(renderer.audioTrack('kick').clips, 'set')
    await edit({
      type: 'source.update',
      id: 'a',
      patch: { durationSec: 12, meta: { name: 'Kick' } },
    })
    expect(set).not.toHaveBeenCalled()
    expect(document.score.sources[0]).toEqual({
      id: 'a',
      url: '/a.mp3',
      durationSec: 12,
      meta: { name: 'Kick' },
    })
  })

  it('an annotation on the document changes nothing in the graph', async () => {
    const { renderer, document, edit } = await rig()
    const set = vi.spyOn(renderer.audioTrack('kick').clips, 'set')
    const kick = renderer.audioTrack('kick')
    await edit({ type: 'score.setMeta', patch: { chords: [0, 2, 5, 3] } })
    expect(set).not.toHaveBeenCalled()
    expect(renderer.audioTrack('kick')).toBe(kick)
    expect(document.score.meta).toEqual({ chords: [0, 2, 5, 3] })
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

  it('a lane on a track that loops at its own length comes round with that track', async () => {
    const { ctx, engine, renderer, edit } = await rig()
    await edit({ type: 'track.loop', id: 'pad', lengthSec: 10 })
    const fader = gainOf(renderer.audioTrack('pad').strip.fader)
    const [writer] = engine.automation.writers
    engine.automation.lookaheadSec = 0.5
    // 21 s in: the lane (0 s to 4 s) is a second into the pad's third pass.
    engine.transport.seekElapsed(21)
    engine.transport.start()
    const first = fader.gain.events.find((event) => event.method === 'setValueAtTime')
    expect(first?.args[1]).toBe(ctx.currentTime)
    expect(first?.args[0]).toBeCloseTo(renderer.lane('pad-level').valueAt(1))
    expect(writer.writtenUntilSec).not.toBeNull()

    // Taken off its own loop, the lane is back on the transport's timeline: past its end.
    await edit({ type: 'track.loop', id: 'pad', lengthSec: null })
    const before = fader.gain.events.length
    engine.automation.tick()
    const joined = fader.gain.events.slice(before)
    expect(joined.at(-1)?.args[0]).toBeCloseTo(0.8)
    engine.transport.stop()
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

  /** Two instruments in a registry that remembers every instance it made. */
  function instruments() {
    const made: (NoteDevice & { disposed: boolean; made: string })[] = []
    const registry = new DeviceRegistry(NODE_DEVICES)
    const params = {
      gain: { id: 0, name: 'Gain', min: 0, max: 1, default: 1, taper: 'linear', unit: '' },
    } as const
    for (const id of ['synth', 'organ']) {
      registry.register({
        id,
        name: id,
        kind: 'node',
        category: 'instrument',
        version: 1,
        params,
        create: (ctx) => {
          const device = fakeNoteDevice(ctx)
          const values = new Map<string, number>()
          const instance = Object.assign(device, {
            id,
            made: id,
            disposed: false,
            setParam: vi.fn((name: string, value: number) => void values.set(name, value)),
            getParam: (name: string) => values.get(name) ?? 1,
            dispose: () => {
              instance.disposed = true
            },
          })
          made.push(instance)
          return instance
        },
      })
    }
    const score = createScore()
    score.tracks = [
      {
        kind: 'instrument',
        id: 'keys',
        name: 'Keys',
        destination: masterDestination(),
        strip: defaultStrip({
          level: 0.5,
          inserts: [{ id: 'keys-delay', deviceId: 'delay', params: {}, bypass: false }],
        }),
        device: { id: 'synth-1', deviceId: 'synth', params: {}, bypass: false },
      },
    ]
    return { registry, score, made }
  }

  it('replacing an instrument swaps it on the track it has: strip and effects stay, the old one rings out', async () => {
    vi.useFakeTimers()
    try {
      const { registry, score, made } = instruments()
      const { engine, renderer, edit, document, errors } = await rig(score, registry)
      const track = renderer.instrument('keys')
      const delay = renderer.device('keys-delay')
      const synth = made[0]
      track.noteOn(1, 440)

      await edit({
        type: 'device.replace',
        id: 'synth-1',
        device: { id: 'organ-1', deviceId: 'organ', params: { gain: 0.25 }, bypass: false },
      })
      expect(errors).toEqual([])
      // The same track, strip and insert; another instrument on it.
      expect(renderer.instrument('keys')).toBe(track)
      expect(engine.instruments).toEqual([track])
      expect(renderer.device('keys-delay')).toBe(delay)
      expect(track.strip.inserts).toEqual([delay])
      expect(track.device).toBe(made[1])
      expect(made[1].made).toBe('organ')
      expect(renderer.device('organ-1')).toBe(made[1])
      expect(() => renderer.device('synth-1')).toThrow()
      // The held note was released on the instrument that left, which is not cut yet.
      expect(synth.noteOff).toHaveBeenCalledWith(1)
      expect(synth.disposed).toBe(false)
      track.noteOn(2, 220)
      expect(made[1].noteOn).toHaveBeenCalledWith(2, 220, undefined)
      expect(synth.noteOn).toHaveBeenCalledTimes(1)

      // Its tail over, it goes.
      vi.advanceTimersByTime(9_000)
      expect(synth.disposed).toBe(false)
      vi.advanceTimersByTime(2_000)
      expect(synth.disposed).toBe(true)

      // Undo puts the first instrument's kind back the same way, as a new instance.
      document.undo()
      await renderer.whenIdle()
      expect(renderer.instrument('keys')).toBe(track)
      expect(track.device).toBe(made[2])
      expect(made[2].made).toBe('synth')
      expect(renderer.device('synth-1')).toBe(made[2])
      expect(track.strip.inserts).toEqual([delay])

      // What is still ringing when the renderer goes is taken down with it.
      expect(made[1].disposed).toBe(false)
      renderer.dispose()
      expect(made[1].disposed).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('the tail of a swapped instrument is the renderer’s to set', async () => {
    vi.useFakeTimers()
    try {
      const { registry, score, made } = instruments()
      const ctx = createMockContext({ sampleRate: 48000 })
      const engine = createEngine({
        context: asAudioContext(ctx),
        setIntervalFn: () => 0 as unknown as ReturnType<typeof setInterval>,
        clearIntervalFn: () => {},
        devices: registry,
      })
      const document = new ScoreDocument(score, { now: () => 0 })
      const renderer = loadScore(engine, document, { instrumentTailSec: 0.5 })
      await renderer.whenIdle()
      document.apply({
        type: 'device.replace',
        id: 'synth-1',
        device: { id: 'organ-1', deviceId: 'organ', params: {}, bypass: false },
      })
      await renderer.whenIdle()
      vi.advanceTimersByTime(499)
      expect(made[0].disposed).toBe(false)
      vi.advanceTimersByTime(2)
      expect(made[0].disposed).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('the same instrument with other settings is not swapped, and a lane on it stays bound', async () => {
    const { registry, score, made } = instruments()
    score.lanes = [
      {
        id: 'keys-gain',
        target: { kind: 'device', device: 'synth-1', param: 'gain' },
        breakpoints: [{ timeSec: 0, value: 0.5 }],
      },
    ]
    const { renderer, edit, errors } = await rig(score, registry)
    await edit({
      type: 'device.replace',
      id: 'synth-1',
      device: { id: 'synth-1', deviceId: 'synth', params: { gain: 0.25 }, bypass: true },
    })
    expect(errors).toEqual([])
    expect(made).toHaveLength(1)
    expect(renderer.device('synth-1')).toBe(made[0])
    expect(made[0].bypass).toBe(true)
    expect(renderer.lane('keys-gain').breakpoints).toHaveLength(1)
  })

  it('an instrument kept under its own id but changed in kind is swapped too', async () => {
    const { registry, score, made } = instruments()
    const { renderer, edit, errors } = await rig(score, registry)
    const track = renderer.instrument('keys')
    await edit({
      type: 'device.replace',
      id: 'synth-1',
      device: { id: 'synth-1', deviceId: 'organ', params: {}, bypass: false },
    })
    expect(errors).toEqual([])
    expect(renderer.instrument('keys')).toBe(track)
    expect(made[1].made).toBe('organ')
    expect(track.device).toBe(made[1])
    expect(renderer.device('synth-1')).toBe(made[1])
  })

  it('an instrument swapped for something that plays no notes fails and the track keeps what it had', async () => {
    const { registry, score, made } = instruments()
    const { renderer, document, errors } = await rig(score, registry)
    document.apply({
      type: 'device.replace',
      id: 'synth-1',
      device: { id: 'f-1', deviceId: 'filter', params: {}, bypass: false },
    })
    await renderer.whenIdle()
    expect(errors).toHaveLength(1)
    expect(String(errors[0])).toMatch(/NoteDevice/)
    expect(renderer.instrument('keys').device).toBe(made[0])
    expect(renderer.device('synth-1')).toBe(made[0])
    expect(made[0].disposed).toBe(false)
    // Taking the edit back leaves a renderer that still follows the document.
    document.undo()
    await renderer.whenIdle()
    expect(renderer.instrument('keys').device).toBe(made[0])
  })
})

describe('ScoreRenderer: device state', () => {
  /** A device with a state besides its one parameter, as a hosted plug-in has. */
  function stateful() {
    const created: { state: string | undefined; params: Record<string, number> }[] = []
    const loads: string[] = []
    const sets: [string, number][] = []
    let held: string | undefined
    // What a load waits for, when a test wants it to take a while.
    let gate: Promise<void> = Promise.resolve()
    const registry = new DeviceRegistry(NODE_DEVICES)
    registry.register({
      id: 'sampler',
      name: 'Sampler',
      kind: 'node',
      category: 'plugin',
      version: 1,
      params: {
        gain: { id: 0, name: 'Gain', min: 0, max: 1, default: 1, taper: 'linear', unit: '' },
      },
      create: (ctx, options) => {
        created.push({ state: options?.state, params: { ...options?.params } })
        held = options?.state
        const node = ctx.createGain()
        const values = new Map<string, number>(Object.entries(options?.params ?? {}))
        const device: StatefulDevice = {
          id: 'sampler',
          stateful: true,
          input: node,
          output: node,
          params: {
            gain: { id: 0, name: 'Gain', min: 0, max: 1, default: 1, taper: 'linear', unit: '' },
          },
          setParam: (name, value) => {
            sets.push([name, value])
            values.set(name, value)
          },
          getParam: (name) => values.get(name) ?? 1,
          bypass: false,
          latencySec: 0,
          getState: () => Promise.resolve(held ?? ''),
          setState: (state) => {
            if (state === held) return Promise.resolve(false)
            if (state === 'broken') return Promise.reject(new Error('cannot read that'))
            held = state
            loads.push(state)
            return gate.then(() => {
              // Loading a state puts the parameter wherever the state had it.
              values.set('gain', 0.1)
              return true
            })
          },
          dispose: () => node.disconnect(),
        }
        return device
      },
    })
    const score = createScore()
    score.master.inserts.push({
      id: 'sampler-1',
      deviceId: 'sampler',
      params: { gain: 0.7 },
      bypass: false,
      state: 'first',
    })
    /** Loads wait from here on; the function returned lets them land. */
    const slow = (): (() => void) => {
      let release = (): void => {}
      gate = new Promise((resolve) => (release = resolve))
      return release
    }
    return { registry, score, created, loads, sets, slow, hold: (state: string) => (held = state) }
  }

  it('a device is created from the state the document holds, with its parameters on top', async () => {
    const { registry, score, created, loads } = stateful()
    const { errors } = await rig(score, registry)
    expect(errors).toEqual([])
    expect(created).toEqual([{ state: 'first', params: { gain: 0.7 } }])
    expect(loads).toEqual([])
  })

  it('a device without a state in the document is created without one', async () => {
    const { registry, score, created } = stateful()
    delete score.master.inserts[0].state
    await rig(score, registry)
    expect(created[0].state).toBeUndefined()
    expect('state' in created[0]).toBe(true)
  })

  it('a state the document is given reaches the device, then the document’s values again', async () => {
    const { registry, score, loads, sets } = stateful()
    const { renderer, edit, errors } = await rig(score, registry)
    await edit({ type: 'device.setState', device: 'sampler-1', state: 'second' })
    expect(errors).toEqual([])
    expect(loads).toEqual(['second'])
    // The state moved the gain; the document says 0.7 and has the last word.
    expect(sets).toEqual([['gain', 0.7]])
    expect(renderer.device('sampler-1').getParam('gain')).toBe(0.7)
  })

  it('a state read from the device and kept in the document is not loaded into it again', async () => {
    const { registry, score, loads, sets, hold } = stateful()
    const { edit, errors } = await rig(score, registry)
    hold('read')
    await edit({ type: 'device.setState', device: 'sampler-1', state: 'read' })
    expect(errors).toEqual([])
    expect(loads).toEqual([])
    expect(sets).toEqual([])
  })

  it('a parameter changed with the state is set either way', async () => {
    const { registry, score, loads, sets, hold } = stateful()
    const { document, renderer, errors } = await rig(score, registry)
    hold('read')
    // Both in one render: a knob turned in the plug-in and the state read after it.
    document.apply({ type: 'device.setParam', device: 'sampler-1', param: 'gain', value: 0.4 })
    document.apply({ type: 'device.setState', device: 'sampler-1', state: 'read' })
    await renderer.whenIdle()
    expect(errors).toEqual([])
    expect(loads).toEqual([])
    expect(sets).toEqual([['gain', 0.4]])
  })

  it('a knob turned while a state is still loading is what the device ends on', async () => {
    const { registry, score, loads, sets, slow } = stateful()
    const { renderer, document, errors } = await rig(score, registry)
    const land = slow()
    document.apply({ type: 'device.setState', device: 'sampler-1', state: 'second' })
    await vi.waitFor(() => expect(loads).toEqual(['second']))
    // The next edit arrives before the plug-in has taken the state.
    document.apply({ type: 'device.setParam', device: 'sampler-1', param: 'gain', value: 0.4 })
    land()
    await renderer.whenIdle()
    expect(errors).toEqual([])
    // The values the state was restored under first, then the knob: not the other way round.
    expect(sets).toEqual([
      ['gain', 0.7],
      ['gain', 0.4],
    ])
    expect(renderer.device('sampler-1').getParam('gain')).toBe(0.4)
  })

  it('a state the device cannot take is a render error and the device stays', async () => {
    const { registry, score } = stateful()
    const { renderer, document, errors } = await rig(score, registry)
    const device = renderer.device('sampler-1')
    document.apply({ type: 'device.setState', device: 'sampler-1', state: 'broken' })
    await renderer.whenIdle()
    expect(errors.map(String)).toEqual(['Error: cannot read that'])
    expect(renderer.device('sampler-1')).toBe(device)
  })

  it('a state on a device that keeps none is carried by the document and ignored by the graph', async () => {
    const { renderer, edit, errors, document } = await rig()
    const filter = renderer.device('kick-filter')
    await edit({ type: 'device.setState', device: 'kick-filter', state: 'anything' })
    expect(errors).toEqual([])
    expect(renderer.device('kick-filter')).toBe(filter)
    expect(document.score.tracks[0].strip.inserts[0].state).toBe('anything')
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

  it('an insert that cannot be made leaves the ones after it on the chain, and later renders go through', async () => {
    const registry = new DeviceRegistry(NODE_DEVICES)
    registry.register({
      id: 'unloadable',
      name: 'Unloadable',
      kind: 'node',
      category: 'other',
      version: 1,
      params: {
        gain: { id: 0, name: 'Gain', min: 0, max: 1, default: 1, taper: 'linear', unit: '' },
      },
      create: () => Promise.reject(new Error('its module did not load')),
    })
    const { renderer, document, errors, edit } = await rig(demoScore(), registry)
    await edit({
      type: 'device.add',
      owner: 'kick',
      device: { id: 'kick-eq', deviceId: 'eq3', params: {}, bypass: false },
    })
    const strip = renderer.audioTrack('kick').strip
    const chain = [renderer.device('kick-filter'), renderer.device('kick-eq')]
    // In front of the equaliser, which comes off the chain to make room for it.
    await edit({
      type: 'device.add',
      owner: 'kick',
      index: 1,
      device: { id: 'mid', deviceId: 'unloadable', params: {}, bypass: false },
    })
    expect(errors.map(String)).toEqual(['Error: its module did not load'])
    expect(strip.inserts).toEqual(chain)
    document.undo()
    await renderer.whenIdle()
    await edit({ type: 'strip.set', owner: 'kick', param: 'level', value: 0.5 })
    expect(errors).toHaveLength(1)
    expect(strip.inserts).toEqual(chain)
    expect(renderer.rendered).toBe(document.score)
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

  describe('disposed while a render runs', () => {
    /** An engine with the demo samples in, and nothing rendered yet. */
    async function bare(): Promise<Engine> {
      const engine = createEngine({
        context: asAudioContext(createMockContext({ sampleRate: 48000 })),
        setIntervalFn: () => 0 as unknown as ReturnType<typeof setInterval>,
        clearIntervalFn: () => {},
      })
      const buffer = new MockAudioBuffer(2, 48000 * 10, 48000) as unknown as AudioBuffer
      await engine.samples.load('a', buffer)
      await engine.samples.load('b', buffer)
      return engine
    }
    const turns = async (count: number): Promise<void> => {
      for (let turn = 0; turn < count; turn += 1) await Promise.resolve()
    }
    // How far into the first render the renderer goes before it is disposed.
    const MOMENTS = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 24]

    it('builds no further and leaves nothing in the engine', async () => {
      for (const moment of MOMENTS) {
        const engine = await bare()
        const errors: unknown[] = []
        const renderer = loadScore(engine, new ScoreDocument(demoScore()), {
          onError: (error) => errors.push(error),
        })
        await turns(moment)
        unloadScore(engine)
        await renderer.whenIdle()
        await turns(50)
        expect(errors, `after ${moment} turns`).toEqual([])
        expect(engine.tracks, `after ${moment} turns`).toEqual([])
        expect(engine.groups, `after ${moment} turns`).toEqual([])
        expect(engine.returnTracks, `after ${moment} turns`).toEqual([])
        expect(engine.liveInputs, `after ${moment} turns`).toEqual([])
        expect(engine.master.inserts, `after ${moment} turns`).toEqual([])
      }
    })

    it('a score loaded while the one before is still being built is in the engine once', async () => {
      for (const moment of MOMENTS) {
        const engine = await bare()
        const errors: unknown[] = []
        const onError = (error: unknown): number => errors.push(error)
        const first = loadScore(engine, new ScoreDocument(demoScore()), { onError })
        await turns(moment)
        const second = loadScore(engine, new ScoreDocument(demoScore()), { onError })
        await first.whenIdle()
        await second.whenIdle()
        await turns(50)
        expect(errors, `after ${moment} turns`).toEqual([])
        expect(
          engine.tracks.map((track) => track.name),
          `after ${moment} turns`,
        ).toEqual(['kick', 'pad'])
        expect(engine.groups, `after ${moment} turns`).toHaveLength(1)
        expect(engine.returnTracks, `after ${moment} turns`).toHaveLength(1)
        expect(engine.liveInputs, `after ${moment} turns`).toHaveLength(1)
        expect(engine.master.inserts, `after ${moment} turns`).toEqual([second.device('glue')])
      }
    })

    it('takes down an insert that was off the chain for one still being made', async () => {
      const params = {
        gain: { id: 0, name: 'Gain', min: 0, max: 1, default: 1, taper: 'linear', unit: '' },
      } as const
      let finish = (): void => {}
      const registry = new DeviceRegistry(NODE_DEVICES)
      registry.register({
        id: 'slow',
        name: 'Slow',
        kind: 'node',
        category: 'other',
        version: 1,
        params,
        create: (ctx) =>
          new Promise<Device>((resolve) => {
            finish = () => {
              const node = ctx.createGain()
              resolve({
                id: 'slow',
                input: node,
                output: node,
                params,
                setParam: () => {},
                getParam: () => 1,
                bypass: false,
                latencySec: 0,
                dispose: () => node.disconnect(),
              })
            }
          }),
      })
      const { engine, renderer, document, errors, edit } = await rig(demoScore(), registry)
      await edit({
        type: 'device.add',
        owner: 'kick',
        device: { id: 'kick-eq', deviceId: 'eq3', params: {}, bypass: false },
      })
      const dispose = vi.spyOn(renderer.device('kick-eq'), 'dispose')
      document.apply({
        type: 'device.add',
        owner: 'kick',
        index: 1,
        device: { id: 'mid', deviceId: 'slow', params: {}, bypass: false },
      })
      await turns(10)
      unloadScore(engine)
      finish()
      await renderer.whenIdle()
      await turns(50)
      expect(errors).toEqual([])
      expect(dispose).toHaveBeenCalledTimes(1)
    })

    it('the engine going away under a render is no failure of the render', async () => {
      for (const moment of MOMENTS) {
        const engine = await bare()
        const errors: unknown[] = []
        const renderer = loadScore(engine, new ScoreDocument(demoScore()), {
          onError: (error) => errors.push(error),
        })
        await turns(moment)
        engine.dispose()
        await renderer.whenIdle()
        await turns(50)
        expect(errors, `after ${moment} turns`).toEqual([])
      }
    })
  })

  it('disposes the inserts it made when the engine is disposed: no strip does', async () => {
    const { engine, renderer } = await rig()
    const made = ['kick-filter', 'glue', 'hall-verb'].map((id) => renderer.device(id))
    const disposals = made.map((device) => vi.spyOn(device, 'dispose'))
    engine.dispose()
    // A track's insert and the master's are the renderer's; a return's own device goes with its track.
    expect(disposals.map((spy) => spy.mock.calls.length)).toEqual([1, 1, 1])
  })

  it('a device that leaves through a non-insert path keeps the registry honest', async () => {
    const { renderer } = await rig()
    const device: Device = renderer.device('hall-verb')
    expect(device.id).toBe('convolver-reverb')
  })
})

describe('ScoreRenderer: a device id that changes strip', () => {
  // A strip of every kind, in the order a pass builds them: the master, then
  // the tracks, the groups and the returns.
  const PLACES = ['master', 'one', 'two', 'keys', 'voice', 'bus', 'hall'] as const
  type Place = (typeof PLACES)[number]

  const moving = (): ScoreDevice => ({ id: 'echo-1', deviceId: 'delay', params: {}, bypass: false })
  const staying = (place: Place): ScoreDevice => ({
    id: `${place}-own`,
    deviceId: 'utility',
    params: {},
    bypass: false,
  })

  function registry(): DeviceRegistry {
    const devices = new DeviceRegistry(NODE_DEVICES)
    const gain = { id: 0, name: 'Gain', min: 0, max: 1, default: 1, taper: 'linear', unit: '' }
    devices.register({
      id: 'synth',
      name: 'Synth',
      kind: 'node',
      category: 'instrument',
      version: 1,
      params: { gain: { ...gain, taper: 'linear' } },
      create: (ctx): NoteDevice => {
        const node = ctx.createGain()
        return {
          id: 'synth',
          input: node,
          output: node,
          params: { gain: { ...gain, taper: 'linear' } },
          setParam: () => {},
          getParam: () => 1,
          bypass: false,
          latencySec: 0,
          noteOn: () => {},
          noteOff: () => {},
          dispose: () => node.disconnect(),
        }
      },
    })
    // A device whose module never loads, and one that can be made once and not again.
    devices.register({
      id: 'unloadable',
      name: 'Unloadable',
      kind: 'node',
      category: 'other',
      version: 1,
      params: { gain: { ...gain, taper: 'linear' } },
      create: () => Promise.reject(new Error('its module did not load')),
    })
    let made = 0
    devices.register({
      id: 'once',
      name: 'Once',
      kind: 'node',
      category: 'instrument',
      version: 1,
      params: { gain: { ...gain, taper: 'linear' } },
      create: (ctx): Promise<NoteDevice> => {
        made += 1
        if (made > 1) return Promise.reject(new Error('it could not be made again'))
        const node = ctx.createGain()
        return Promise.resolve({
          id: 'once',
          input: node,
          output: node,
          params: { gain: { ...gain, taper: 'linear' } },
          setParam: () => {},
          getParam: () => 1,
          bypass: false,
          latencySec: 0,
          noteOn: () => {},
          noteOff: () => {},
          dispose: () => node.disconnect(),
        })
      },
    })
    return devices
  }

  /** Every strip with an insert of its own, and the moving one in front of it on `place`. */
  function scoreWith(
    place: Place | null,
    extra: Partial<Record<Place, ScoreDevice[]>> = {},
  ): Score {
    const inserts = (at: Place): ScoreDevice[] => [
      ...(at === place ? [moving()] : []),
      staying(at),
      ...(extra[at] ?? []),
    ]
    const score = createScore({ id: 'strips', name: 'Strips' })
    const destination = masterDestination()
    score.tracks = [
      {
        kind: 'audio',
        id: 'one',
        name: 'One',
        destination,
        strip: defaultStrip({ inserts: inserts('one') }),
        clips: [],
      },
      {
        kind: 'audio',
        id: 'two',
        name: 'Two',
        destination,
        strip: defaultStrip({ inserts: inserts('two') }),
        clips: [],
      },
      {
        kind: 'instrument',
        id: 'keys',
        name: 'Keys',
        destination,
        strip: defaultStrip({ inserts: inserts('keys') }),
        device: { id: 'keys-synth', deviceId: 'synth', params: {}, bypass: false },
      },
      {
        kind: 'live',
        id: 'voice',
        name: 'Voice',
        destination,
        strip: defaultStrip({ inserts: inserts('voice') }),
      },
    ]
    score.groups = [
      { id: 'bus', name: 'Bus', destination, strip: defaultStrip({ inserts: inserts('bus') }) },
    ]
    score.returns = [
      {
        id: 'hall',
        name: 'Hall',
        destination,
        device: { id: 'hall-verb', deviceId: 'convolver-reverb', params: {}, bypass: false },
        strip: defaultStrip({ soloSafe: true, inserts: inserts('hall') }),
      },
    ]
    score.master = { level: 1, inserts: inserts('master') }
    return score
  }

  function chainOf(renderer: ScoreRenderer, place: Place): readonly Device[] {
    switch (place) {
      case 'master':
        return renderer.engine.master.inserts
      case 'one':
      case 'two':
        return renderer.audioTrack(place).strip.inserts
      case 'keys':
        return renderer.instrument(place).strip.inserts
      case 'voice':
        return renderer.liveInput(place).strip.inserts
      case 'bus':
        return renderer.group(place).strip.inserts
      case 'hall':
        return renderer.returnTrack(place).strip.inserts
    }
  }

  function documentChain(score: Score, place: Place): readonly ScoreDevice[] {
    if (place === 'master') return score.master.inserts
    const host = [...score.tracks, ...score.groups, ...score.returns].find(
      (candidate) => candidate.id === place,
    )
    return host?.strip.inserts ?? []
  }

  function rendered(renderer: ScoreRenderer, id: string): Device | null {
    try {
      return renderer.device(id)
    } catch {
      return null
    }
  }

  /** Where a strip's inserts in the graph are not the document's, in order. */
  function strays(renderer: ScoreRenderer, score: Score): string[] {
    const out: string[] = []
    for (const place of PLACES) {
      const graph = chainOf(renderer, place)
      const specs = documentChain(score, place)
      const same =
        graph.length === specs.length &&
        specs.every(
          (spec, index) =>
            graph[index] === rendered(renderer, spec.id) && graph[index].id === spec.deviceId,
        )
      if (!same) {
        out.push(
          `${place} has ${graph.map((device) => device.id).join(',') || 'nothing'} for ${specs.map((spec) => spec.id).join(',')}`,
        )
      }
    }
    return out
  }

  /** Takes the moving device from each strip to each other in one pass, and says what went wrong where. */
  async function everyPair(change: (rig: Rig, to: Place) => void): Promise<string[]> {
    const failures: string[] = []
    for (const from of PLACES) {
      for (const to of PLACES) {
        if (from === to) continue
        const made = await rig(scoreWith(from), registry())
        const { renderer, document, errors, engine } = made
        const said = strays(renderer, document.score).map((stray) => `at first ${stray}`)
        const kept = PLACES.map((place) => renderer.device(`${place}-own`))
        const keptDisposals = kept.map((device) => vi.spyOn(device, 'dispose'))
        const left = renderer.device('echo-1')
        const leftDisposal = vi.spyOn(left, 'dispose')
        const reconcile = vi.spyOn(
          renderer as unknown as { reconcile: () => Promise<void> },
          'reconcile',
        )
        change(made, to)
        await renderer.whenIdle()
        said.push(...errors.map(String))
        if (reconcile.mock.calls.length !== 1) said.push(`${reconcile.mock.calls.length} passes`)
        if (renderer.rendered !== document.score) said.push('the pass did not land')
        said.push(...strays(renderer, document.score))
        PLACES.forEach((place, index) => {
          if (rendered(renderer, `${place}-own`) !== kept[index]) {
            said.push(`${place}-own is another instance`)
          }
          if (keptDisposals[index].mock.calls.length > 0) said.push(`${place}-own was disposed`)
        })
        // A device that changes strip is taken down and made anew, as one taken off and put back is.
        if (rendered(renderer, 'echo-1') === left) said.push('echo-1 is the instance it was')
        if (leftDisposal.mock.calls.length !== 1) {
          said.push(`the echo-1 that left was disposed ${leftDisposal.mock.calls.length} times`)
        }
        if (said.length > 0) failures.push(`${from} -> ${to}: ${said.join('; ')}`)
        engine.dispose()
      }
    }
    return failures
  }

  it('follows a piece opened over another that has the id on another strip, for every pair of strips', async () => {
    const failures = await everyPair(({ document }, to) => document.load(scoreWith(to)))
    expect(failures).toEqual([])
  })

  it('follows an id that leaves one strip in one edit and lands on another in the next, as one pass', async () => {
    const failures = await everyPair(({ document }, to) => {
      document.apply({ type: 'device.remove', id: 'echo-1' })
      document.apply({ type: 'device.add', owner: to, device: moving(), index: 0 })
    })
    expect(failures).toEqual([])
  })

  it('a device that only changes place on its strip is the instance it was, also in a pass where another leaves the strip', async () => {
    const eq: ScoreDevice = { id: 'one-eq', deviceId: 'eq3', params: {}, bypass: false }
    const { renderer, document, errors, edit } = await rig(
      scoreWith('one', { one: [eq] }),
      registry(),
    )
    const strip = renderer.audioTrack('one').strip
    const [echo, own, equaliser] = ['echo-1', 'one-own', 'one-eq'].map((id) => renderer.device(id))
    const disposals = [echo, own, equaliser].map((device) => vi.spyOn(device, 'dispose'))
    const is = (expected: readonly Device[]): boolean =>
      strip.inserts.length === expected.length &&
      strip.inserts.every((device, index) => device === expected[index])
    expect(is([echo, own, equaliser])).toBe(true)

    await edit({ type: 'device.move', id: 'one-eq', index: 0 })
    expect(is([equaliser, echo, own])).toBe(true)
    expect(disposals.map((spy) => spy.mock.calls.length)).toEqual([0, 0, 0])

    // The echo leaves for the next track while the two that stay change places, in one pass.
    await edit(
      { type: 'device.remove', id: 'echo-1' },
      { type: 'device.add', owner: 'two', device: moving(), index: 0 },
      { type: 'device.move', id: 'one-own', index: 0 },
    )
    expect(errors).toEqual([])
    expect(is([own, equaliser])).toBe(true)
    expect([renderer.device('one-own'), renderer.device('one-eq')]).toEqual([own, equaliser])
    expect(disposals.map((spy) => spy.mock.calls.length)).toEqual([1, 0, 0])
    expect(renderer.rendered).toBe(document.score)
    expect(strays(renderer, document.score)).toEqual([])
  })

  it('leaves the insert on its strip when the pass that takes it elsewhere fails before its new one is made', async () => {
    const { renderer, document, errors, edit } = await rig(scoreWith('two'), registry())
    const start = document.score
    const echo = renderer.device('echo-1')
    const disposal = vi.spyOn(echo, 'dispose')

    // To the return, whose turn comes after the track's, with a master insert that cannot be made.
    await edit(
      { type: 'device.remove', id: 'echo-1' },
      { type: 'device.add', owner: 'hall', device: moving(), index: 0 },
      {
        type: 'device.add',
        owner: 'master',
        device: { id: 'bad', deviceId: 'unloadable', params: {}, bypass: false },
        index: 0,
      },
    )
    expect(errors.map(String)).toEqual(['Error: its module did not load'])
    expect(renderer.rendered).toBe(start)
    expect(strays(renderer, start)).toEqual([])
    expect(renderer.device('echo-1')).toBe(echo)
    expect(disposal).not.toHaveBeenCalled()

    // Without the insert that cannot be made, the same move lands.
    await edit({ type: 'device.remove', id: 'bad' })
    expect(errors).toHaveLength(1)
    expect(renderer.rendered).toBe(document.score)
    expect(strays(renderer, document.score)).toEqual([])
    expect(renderer.device('echo-1')).not.toBe(echo)
    expect(disposal).toHaveBeenCalledTimes(1)
  })

  it('leaves the insert on its strip when its new one cannot be made, on a strip built first or as an instrument', async () => {
    const fragile: ScoreDevice = { id: 'fragile-1', deviceId: 'once', params: {}, bypass: false }
    for (const to of ['one', 'keys-instrument'] as const) {
      const first = scoreWith(null, { two: [fragile] })
      const { renderer, document, errors, engine } = await rig(first, registry())
      const start = document.score
      const device = renderer.device('fragile-1')
      const disposal = vi.spyOn(device, 'dispose')
      const instrument = renderer.instrument('keys').device

      const next =
        to === 'one'
          ? scoreWith(null, { one: [fragile] })
          : {
              ...scoreWith(null),
              tracks: scoreWith(null).tracks.map((track) =>
                track.kind === 'instrument' ? { ...track, device: fragile } : track,
              ),
            }
      document.load(next)
      await renderer.whenIdle()
      expect(errors.map(String), to).toEqual(['Error: it could not be made again'])
      expect(renderer.rendered, to).toBe(start)
      expect(strays(renderer, start), to).toEqual([])
      expect(renderer.device('fragile-1'), to).toBe(device)
      expect(disposal, to).not.toHaveBeenCalled()
      expect(renderer.instrument('keys').device, to).toBe(instrument)

      // The piece it had, loaded again, lands on what stands.
      document.load(first)
      await renderer.whenIdle()
      expect(errors, to).toHaveLength(1)
      expect(renderer.rendered, to).toBe(document.score)
      expect(strays(renderer, document.score), to).toEqual([])
      expect(renderer.device('fragile-1'), to).toBe(device)
      engine.dispose()
    }
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
