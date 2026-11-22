// A render starts every strip where the score has it. On the recording
// stand-ins this is what the graph is told: a level, pan, trim, mute or solo
// the score sets is written for the first sample of a render, where an
// engine that plays the same score approaches it over the strip's time
// constant. What the samples of a real render then hold is measured in a
// browser (`browser-tests/specs/render-starts-strips.spec.ts`).
//
// And a render starts every device where the score has it: one the score
// marks bypassed is made so, with nothing to cross over from, where a device
// bypassed while it plays crosses over its 5 ms. In real audio that is
// `browser-tests/specs/bypassed-and-aligned.spec.ts`.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  MockAudioBuffer,
  advance,
  asAudioContext,
  configureMocks,
  createMockContext,
  createMockOfflineContext,
  scheduleSnapshotOf,
  type AutomationEvent,
  type MockGainNode,
  type MockOfflineAudioContext,
  type MockStereoPannerNode,
} from '../../testing'
import { type Device } from '../../core/devices/Device'
import { gainIn, io } from '../../core/devices/native/__tests__/graph-helpers'
import { NODE_DEVICE_RAMP_SECONDS } from '../../core/devices/native/NodeDevice'
import { DeviceRegistry, type DeviceCreateOptions } from '../../core/devices/registry'
import { createEngine, type Engine } from '../../core/Engine'
import { type OfflineContextFactory } from '../../core/render/OfflineRenderer'
import { loadScore } from '../loadScore'
import { renderScore, renderScoreStems } from '../renderScore'
import {
  createScore,
  defaultStrip,
  groupDestination,
  masterDestination,
  type Score,
  type ScoreDevice,
  type ScoreStrip,
} from '../schema'
import { clip } from './fixtures'

const SAMPLE_RATE = 48000
/** The time constant a strip and a bus approach a level with when none is given. */
const APPROACH_SECONDS = 0.005

interface Strips {
  kick?: Partial<ScoreStrip>
  pad?: Partial<ScoreStrip>
  music?: Partial<ScoreStrip>
  master?: number
}

/** A kick through a group and a pad to the master, with the strips given. */
function arrangement(strips: Strips = {}): Score {
  const score = createScore({ id: 'start' })
  score.sources = [
    { id: 'a', url: '/a.mp3', durationSec: 10 },
    { id: 'b', url: '/b.mp3', durationSec: 10 },
  ]
  score.groups = [
    {
      id: 'music',
      name: 'Music',
      destination: masterDestination(),
      strip: defaultStrip(strips.music),
    },
  ]
  score.tracks = [
    {
      kind: 'audio',
      id: 'kick',
      name: 'Kick',
      destination: groupDestination('music'),
      strip: defaultStrip(strips.kick),
      lookaheadSec: 1,
      clips: [clip('k1', 'a', 0)],
    },
    {
      kind: 'audio',
      id: 'pad',
      name: 'Pad',
      destination: masterDestination(),
      strip: defaultStrip(strips.pad),
      lookaheadSec: 1,
      clips: [clip('p1', 'b', 0.5)],
    },
  ]
  score.master = { level: strips.master ?? 1, inserts: [] }
  return score
}

function resolveSource(): AudioBuffer {
  return new MockAudioBuffer(2, 10 * SAMPLE_RATE, SAMPLE_RATE) as unknown as AudioBuffer
}

let contexts: MockOfflineAudioContext[] = []
const factory: OfflineContextFactory = ({ numberOfChannels, length, sampleRate }) => {
  const ctx = createMockOfflineContext({ numberOfChannels, length, sampleRate })
  contexts.push(ctx)
  return ctx as unknown as ReturnType<OfflineContextFactory>
}

function render(score: Score, devices?: DeviceRegistry): Promise<{ engine: Engine }> {
  return renderScore(score, {
    durationSec: 2,
    sampleRate: SAMPLE_RATE,
    createContext: factory,
    renderer: { resolveSource, ...(devices ? { devices } : {}) },
  })
}

const eventsOf = (param: AudioParam): AutomationEvent[] =>
  (param as unknown as MockGainNode['gain']).events
const gainEvents = (node: GainNode): AutomationEvent[] => eventsOf(node.gain)
const panEvents = (node: StereoPannerNode): AutomationEvent[] =>
  (node as unknown as MockStereoPannerNode).pan.events

/** One write of `value` for the first sample, and nothing on its way there. */
const setAtStart = (value: number): AutomationEvent[] => [
  { method: 'setValueAtTime', args: [value, 0] },
]
/** One approach to `value` from `at`, over the default time constant. */
const approachFrom = (value: number, at: number): AutomationEvent[] => [
  { method: 'setTargetAtTime', args: [value, at, APPROACH_SECONDS] },
]

beforeEach(() => {
  contexts = []
  vi.useFakeTimers()
  configureMocks({ advanceTimers: vi.advanceTimersByTimeAsync })
})
afterEach(() => {
  configureMocks({})
  vi.useRealTimers()
})

describe('a render starts every strip where the score has it', () => {
  it('sets a level, a pan, a trim and a mute for the first sample', async () => {
    const { engine } = await render(
      arrangement({
        kick: { level: 0.5, pan: -0.25, inputGain: 0.75 },
        pad: { mute: true },
        music: { level: 0.25 },
        master: 0.8,
      }),
    )
    const kick = engine.track('kick').strip
    expect(gainEvents(kick.fader)).toEqual(setAtStart(0.5))
    expect(panEvents(kick.panner)).toEqual(setAtStart(-0.25))
    expect(gainEvents(kick.inputGainNode)).toEqual(setAtStart(0.75))
    // Not muted: its gate was never told anything.
    expect(gainEvents(kick.gate)).toEqual([])

    const pad = engine.track('pad').strip
    expect(pad.audible).toBe(false)
    expect(gainEvents(pad.gate)).toEqual(setAtStart(0))
    expect(gainEvents(pad.fader)).toEqual([])

    expect(gainEvents(engine.group('music').strip.fader)).toEqual(setAtStart(0.25))
    expect(eventsOf(engine.master.gain)).toEqual(setAtStart(0.8))
    engine.dispose()
  })

  it('closes every other track for the first sample when one is soloed', async () => {
    const { engine } = await render(arrangement({ pad: { solo: true } }))
    // The soloed track plays as it is: no node, nothing to set.
    expect(engine.track('pad').strip.materialized).toBe(false)
    expect(engine.track('kick').strip.audible).toBe(false)
    expect(gainEvents(engine.track('kick').strip.gate)).toEqual(setAtStart(0))
    // The group has no soloed track in it, so it is closed too.
    expect(gainEvents(engine.group('music').strip.gate)).toEqual(setAtStart(0))
    engine.dispose()
  })

  it('closes the other tracks of a stem for its first sample', async () => {
    const stems = await renderScoreStems(arrangement(), {
      durationSec: 2,
      sampleRate: SAMPLE_RATE,
      createContext: factory,
      stems: ['pad'],
      includeMaster: false,
      renderer: { resolveSource },
    })
    const { engine } = stems.pad
    expect(engine.track('pad').strip.materialized).toBe(false)
    expect(gainEvents(engine.track('kick').strip.gate)).toEqual(setAtStart(0))
    engine.dispose()
  })

  it('tells the graph of an untouched score what a playing engine tells it', async () => {
    const score = arrangement()
    const live = createMockContext({ sampleRate: SAMPLE_RATE })
    const playing = createEngine({ context: asAudioContext(live), tickMs: 50 })
    await loadScore(playing, score, { resolveSource }).whenIdle()
    for (const source of score.sources) await playing.samples.load(source.id, resolveSource())
    playing.transport.start(0)
    await advance(live, 3)
    const liveSnapshot = scheduleSnapshotOf(live)
    playing.dispose()

    const { engine } = await render(score)
    const offline = contexts[0].scheduleSnapshot()
    expect(offline.sources).toHaveLength(2)
    expect(offline).toEqual(liveSnapshot)
    // No strip was given a node, and the master was told nothing.
    expect(engine.track('kick').strip.materialized).toBe(false)
    expect(engine.track('pad').strip.materialized).toBe(false)
    expect(eventsOf(engine.master.gain)).toEqual([])
    engine.dispose()
  })
})

describe('an engine that plays approaches where the score has a strip', () => {
  const moved = (): Score =>
    arrangement({
      kick: { level: 0.5, pan: -0.25, inputGain: 0.75 },
      pad: { mute: true },
      master: 0.8,
    })

  for (const now of [0, 1.5]) {
    it(`approaches each value over the time constant, loaded at ${now} s`, async () => {
      const live = createMockContext({ sampleRate: SAMPLE_RATE, currentTime: now })
      const engine = createEngine({ context: asAudioContext(live), tickMs: 50 })
      await loadScore(engine, moved(), { resolveSource }).whenIdle()

      const kick = engine.track('kick').strip
      expect(gainEvents(kick.fader)).toEqual(approachFrom(0.5, now))
      expect(panEvents(kick.panner)).toEqual(approachFrom(-0.25, now))
      expect(gainEvents(kick.inputGainNode)).toEqual(approachFrom(0.75, now))
      expect(gainEvents(engine.track('pad').strip.gate)).toEqual(approachFrom(0, now))
      expect(eventsOf(engine.master.gain)).toEqual(approachFrom(0.8, now))
      engine.dispose()
    })
  }

  it('approaches a value the score is given once a render is under way', async () => {
    const ctx = createMockOfflineContext({ sampleRate: SAMPLE_RATE, length: 4 * SAMPLE_RATE })
    const engine = createEngine({ context: asAudioContext(ctx) })
    const renderer = loadScore(engine, arrangement({ kick: { level: 0.5 } }), { resolveSource })
    await renderer.whenIdle()
    const kick = engine.track('kick').strip
    expect(gainEvents(kick.fader)).toEqual(setAtStart(0.5))

    // The render has made its first second: the track sounds, and a step would be heard.
    ctx.currentTime = 1
    await renderer.render(arrangement({ kick: { level: 0.2 }, pad: { mute: true }, master: 0.8 }))
    expect(gainEvents(kick.fader)).toEqual([...setAtStart(0.5), ...approachFrom(0.2, 1)])
    expect(gainEvents(engine.track('pad').strip.gate)).toEqual(approachFrom(0, 1))
    expect(eventsOf(engine.master.gain)).toEqual(approachFrom(0.8, 1))
    engine.dispose()
  })
})

describe('a render makes a device bypassed where the score has it so', () => {
  const compressor = (bypass: boolean): ScoreDevice => ({
    id: 'held',
    deviceId: 'compressor',
    params: {},
    bypass,
  })

  /** The dry and wet gains of a node device that takes time, found by how they are wired. */
  function paths(device: Device, gains: Iterable<MockGainNode>) {
    const { input, output } = io(device)
    const dryDelay = [...input.outputs].find((node) => node.kind === 'delay')
    if (!dryDelay) throw new Error('expected a delay on the dry path')
    const dry = gainIn(dryDelay.outputs)
    const wet = gainIn(gains, (gain) => gain !== dry && gain.outputs.has(output))
    return { dry, wet }
  }

  it('has a node device dry in the first sample, with nothing to cross over from', async () => {
    const { engine } = await render(arrangement({ pad: { inserts: [compressor(true)] } }))
    const device = engine.track('pad').strip.inserts[0]
    expect(device.bypass).toBe(true)
    const { dry, wet } = paths(device, contexts[0].gains)
    expect(dry.gain.value).toBe(1)
    expect(wet.gain.value).toBe(0)
    expect(gainEvents(dry as unknown as GainNode)).toEqual([])
    expect(gainEvents(wet as unknown as GainNode)).toEqual([])
    engine.dispose()
  })

  /** A registry of one device that takes no time, whose factory notes what it was asked for. */
  function recording(honours: boolean) {
    const asked: DeviceCreateOptions[] = []
    const told: boolean[] = []
    const params = {
      gain: { id: 0, name: 'Gain', min: 0, max: 1, default: 1, taper: 'linear', unit: '' },
    } as const
    const registry = new DeviceRegistry([
      {
        id: 'plain',
        name: 'Plain',
        kind: 'node',
        category: 'utility',
        version: 1,
        params,
        create: (ctx, options) => {
          asked.push(options)
          const node = ctx.createGain()
          let bypassed = honours && options.bypass === true
          return {
            id: 'plain',
            input: node,
            output: node,
            params,
            setParam: () => {},
            getParam: () => 1,
            get bypass() {
              return bypassed
            },
            // Told after it was made: on a device that plays this is a crossfade.
            set bypass(enabled: boolean) {
              told.push(enabled)
              bypassed = enabled
            },
            latencySec: 0,
            dispose: () => node.disconnect(),
          }
        },
      },
    ])
    return { registry, asked, told }
  }

  const plain = (bypass: boolean): ScoreDevice => ({
    id: 'held',
    deviceId: 'plain',
    params: {},
    bypass,
  })

  it('asks the factory for a bypassed device, and tells one made so nothing more', async () => {
    const { registry, asked, told } = recording(true)
    const { engine } = await render(arrangement({ pad: { inserts: [plain(true)] } }), registry)
    expect(asked.map((options) => options.bypass)).toEqual([true])
    expect(engine.track('pad').strip.inserts[0].bypass).toBe(true)
    expect(told).toEqual([])
    engine.dispose()
  })

  it('asks for no bypass on a device the score has working', async () => {
    const { registry, asked, told } = recording(true)
    const { engine } = await render(arrangement({ pad: { inserts: [plain(false)] } }), registry)
    expect(asked.map((options) => options.bypass)).toEqual([undefined])
    expect(engine.track('pad').strip.inserts[0].bypass).toBe(false)
    expect(told).toEqual([])
    engine.dispose()
  })

  it('bypasses a device whose factory made it working all the same', async () => {
    const { registry, told } = recording(false)
    const { engine } = await render(arrangement({ pad: { inserts: [plain(true)] } }), registry)
    expect(engine.track('pad').strip.inserts[0].bypass).toBe(true)
    expect(told).toEqual([true])
    engine.dispose()
  })

  it('crosses a device over its 5 ms when it is bypassed while it plays', async () => {
    const live = createMockContext({ sampleRate: SAMPLE_RATE, currentTime: 1.5 })
    const engine = createEngine({ context: asAudioContext(live), tickMs: 50 })
    const renderer = loadScore(engine, arrangement({ pad: { inserts: [compressor(false)] } }), {
      resolveSource,
    })
    await renderer.whenIdle()
    const device = engine.track('pad').strip.inserts[0]
    const { dry, wet } = paths(device, live.gains)
    expect(dry.gain.value).toBe(0)
    expect(wet.gain.value).toBe(1)

    await renderer.render(arrangement({ pad: { inserts: [compressor(true)] } }))
    expect(device.bypass).toBe(true)
    expect(gainEvents(dry as unknown as GainNode)).toEqual([
      { method: 'cancelAndHoldAtTime', args: [1.5] },
      { method: 'linearRampToValueAtTime', args: [1, 1.5 + NODE_DEVICE_RAMP_SECONDS] },
    ])
    expect(gainEvents(wet as unknown as GainNode)).toEqual([
      { method: 'cancelAndHoldAtTime', args: [1.5] },
      { method: 'linearRampToValueAtTime', args: [0, 1.5 + NODE_DEVICE_RAMP_SECONDS] },
    ])
    engine.dispose()
  })
})
