// Offline render goldens (AE6 at the graph-command level): the offline
// pre-scheduling path must hand the graph exactly what the live, timer-driven
// engine does for the same arrangement, and must do so identically on every
// run. Real audio comparison needs a browser OfflineAudioContext (Playwright
// follow-up); here the recording mocks capture every start/stop and AudioParam
// event, which is what determines the rendered audio.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  MockAudioBuffer,
  advance,
  asAudioContext,
  configureMocks,
  createMockContext,
  createMockOfflineContext,
  scheduleSnapshotOf,
  type MockOfflineAudioContext,
} from '../../../testing'
import { type Clip } from '../../clips/Clip'
import { type Device } from '../../devices/Device'
import { createEngine, type Engine } from '../../Engine'
import {
  maxAbsDifference,
  renderOffline,
  renderStems,
  scheduleAhead,
  type OfflineContextFactory,
} from '../OfflineRenderer'

const SAMPLE_RATE = 48000

function clip(id: string, startSec: number, extra: Partial<Clip> = {}): Clip {
  return {
    id,
    sourceId: `s-${id}`,
    startSec,
    offsetSec: 0,
    durationSec: 2,
    fadeInSec: 0.5,
    fadeOutSec: 0.5,
    fadeCurve: 'equalPower',
    gainDb: -3,
    ...extra,
  }
}

function buffer(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  return new MockAudioBuffer(2, seconds * ctx.sampleRate, ctx.sampleRate) as unknown as AudioBuffer
}

/** A two-track arrangement with a crossfade and a fader ramp. */
async function arrangement(engine: Engine): Promise<void> {
  const music = engine.addAudioTrack('music', { lookaheadSec: 1 })
  const voice = engine.addAudioTrack('voice', { lookaheadSec: 1 })
  await engine.samples.load('s-a', buffer(engine.context, 10))
  await engine.samples.load('s-b', buffer(engine.context, 10))
  await engine.samples.load('s-v', buffer(engine.context, 10))
  music.clips.add(clip('a', 0))
  music.clips.add(clip('b', 1.5))
  voice.clips.add(clip('v', 2, { fadeCurve: 'linear', gainDb: 0 }))
  voice.strip.setLevel(0.8, { at: 0 })
  voice.strip.setLevel(0.2, { at: 3, timeConstant: 0.5 })
}

let contexts: MockOfflineAudioContext[] = []
const factory: OfflineContextFactory = ({ numberOfChannels, length, sampleRate }) => {
  const ctx = createMockOfflineContext({ numberOfChannels, length, sampleRate })
  contexts.push(ctx)
  return ctx as unknown as ReturnType<OfflineContextFactory>
}

beforeEach(() => {
  contexts = []
})

describe('renderOffline', () => {
  it('renders the requested shape and hands every start to the graph before rendering', async () => {
    const result = await renderOffline({
      durationSec: 4,
      sampleRate: SAMPLE_RATE,
      createContext: factory,
      build: arrangement,
    })
    expect(result.buffer.numberOfChannels).toBe(2)
    expect(result.buffer.length).toBe(4 * SAMPLE_RATE)
    expect(result.sampleRate).toBe(SAMPLE_RATE)
    expect(result.audio.channels).toHaveLength(2)
    expect(result.audio.channels[0]).toHaveLength(4 * SAMPLE_RATE)

    const ctx = contexts[0]
    expect(ctx.renderCount).toBe(1)
    const starts = ctx.sources.map((source) => source.startCalls.calls[0]?.[0] as number).sort()
    expect(starts).toEqual([0, 1.5, 2])
  })

  it('is deterministic: two renders of the same arrangement give identical schedules', async () => {
    await renderOffline({ durationSec: 4, createContext: factory, build: arrangement })
    await renderOffline({ durationSec: 4, createContext: factory, build: arrangement })
    const [first, second] = contexts
    expect(first.scheduleSnapshot()).toEqual(second.scheduleSnapshot())
    expect(first.scheduleSnapshot().sources).toHaveLength(3)
    expect(first.scheduleSnapshot().params.length).toBeGreaterThan(0)
  })

  it('never schedules a timer (offline renders do not depend on wall-clock timers)', async () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    await renderOffline({ durationSec: 4, createContext: factory, build: arrangement })
    expect(setIntervalSpy).not.toHaveBeenCalled()
    setIntervalSpy.mockRestore()
  })

  it('starts from startSec: clips already running at that position are not started (ambient-live semantics)', async () => {
    await renderOffline({
      durationSec: 2,
      startSec: 1.6,
      createContext: factory,
      build: arrangement,
    })
    // 'a' (0 s) and 'b' (1.5 s) began before 1.6 so, as live, they are not picked up mid-clip;
    // 'v' (2 s) starts 0.4 s into the render.
    expect(contexts[0].sources).toHaveLength(1)
    expect(contexts[0].sources[0].startCalls.calls[0]?.[0]).toBeCloseTo(0.4, 9)
  })

  it('rejects a non-positive duration and reports a missing OfflineAudioContext', async () => {
    await expect(
      renderOffline({ durationSec: 0, createContext: factory, build: arrangement }),
    ).rejects.toThrow(/positive durationSec/)
    await expect(renderOffline({ durationSec: 1, build: arrangement })).rejects.toThrow(
      /OfflineAudioContext is not available/,
    )
  })

  it('rejects a clock step that would never reach the end, or never tick at all', async () => {
    // A step of 0 or less walks the virtual clock without end: the build stops
    // the scheduler after a thousand ticks so that this fails instead of hanging.
    const counted = async (engine: Engine): Promise<void> => {
      await arrangement(engine)
      const tick = engine.scheduler.tick.bind(engine.scheduler)
      let ticks = 0
      engine.scheduler.tick = () => {
        ticks += 1
        if (ticks > 1000) throw new Error('ticked without end')
        tick()
      }
    }
    for (const tickSec of [0, -0.05, Number.NaN, Number.POSITIVE_INFINITY]) {
      contexts = []
      await expect(
        renderOffline({ durationSec: 1, tickSec, createContext: factory, build: counted }),
      ).rejects.toThrow(/positive tickSec/)
      // Refused before anything was made for it.
      expect(contexts).toHaveLength(0)
    }

    const ctx = createMockContext({ sampleRate: SAMPLE_RATE })
    const engine = createEngine({ context: asAudioContext(ctx), now: () => 0 })
    await counted(engine)
    await expect(
      scheduleAhead(engine, { startSec: 0, durationSec: 1, tickSec: 0, setNow: () => {} }),
    ).rejects.toThrow(/positive tickSec/)
    engine.dispose()
  })
})

describe('render equals live (graph-command golden)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    configureMocks({ advanceTimers: vi.advanceTimersByTimeAsync })
  })
  afterEach(() => {
    configureMocks({})
    vi.useRealTimers()
  })

  it('the offline schedule matches what the live engine tells its graph', async () => {
    // Live: real clock (context time), scheduler on its timer, advanced in 50 ms steps.
    const live = createMockContext({ sampleRate: SAMPLE_RATE })
    const engine = createEngine({ context: asAudioContext(live), tickMs: 50 })
    await arrangement(engine)
    engine.transport.start(0)
    await advance(live, 5)
    // Snapshot before pausing: pausing silences voices (a `stop()` now), which is
    // a live-only command that never reaches a render.
    const liveSnapshot = scheduleSnapshotOf(live)
    engine.transport.pause()

    const result = await renderOffline({
      durationSec: 4,
      sampleRate: SAMPLE_RATE,
      tickSec: 0.05,
      createContext: factory,
      build: arrangement,
    })
    const offlineSnapshot = contexts[0].scheduleSnapshot()

    expect(offlineSnapshot.sources).toEqual(liveSnapshot.sources)
    expect(offlineSnapshot.params).toEqual(liveSnapshot.params)
    expect(result.audio.channels[0].length).toBe(4 * SAMPLE_RATE)
    engine.dispose()
  })
})

describe('renderStems', () => {
  it('renders master plus one soloed render per stem', async () => {
    const stems = await renderStems({
      durationSec: 4,
      createContext: factory,
      stems: ['music', 'voice'],
      build: arrangement,
    })
    expect(Object.keys(stems)).toEqual(['master', 'music', 'voice'])
    expect(contexts).toHaveLength(3)

    const musicRender = stems.music.engine
    expect(musicRender.track('music').strip.audible).toBe(true)
    expect(musicRender.track('voice').strip.audible).toBe(false)
    const voiceRender = stems.voice.engine
    expect(voiceRender.track('voice').strip.audible).toBe(true)
    expect(voiceRender.track('music').strip.audible).toBe(false)
    const master = stems.master.engine
    expect(master.track('music').strip.audible).toBe(true)
    expect(master.track('voice').strip.audible).toBe(true)
  })

  it('can skip the master render', async () => {
    const stems = await renderStems({
      durationSec: 1,
      createContext: factory,
      stems: ['music'],
      includeMaster: false,
      build: arrangement,
    })
    expect(Object.keys(stems)).toEqual(['music'])
  })
})

describe('plugin delay compensation in renders (U34)', () => {
  function latentDevice(engine: Engine, id: string, latencySamples: number): Device {
    const node = engine.context.createGain()
    return {
      id,
      input: node,
      output: node,
      params: {},
      setParam: () => {},
      getParam: () => 0,
      bypass: false,
      latencySec: latencySamples / SAMPLE_RATE,
      latencySamples,
      dispose: () => node.disconnect(),
    }
  }

  async function latentArrangement(engine: Engine): Promise<void> {
    await arrangement(engine)
    engine.track('music').strip.addInsert(latentDevice(engine, 'look-ahead', 288))
  }

  it('aligns every alignable path to the latest arrival, identically in master and stem renders', async () => {
    const stems = await renderStems({
      durationSec: 4,
      sampleRate: SAMPLE_RATE,
      createContext: factory,
      stems: ['music', 'voice'],
      build: latentArrangement,
    })
    for (const result of Object.values(stems)) {
      const paths = Object.fromEntries(result.latency.paths.map((path) => [path.key, path]))
      expect(result.latency.maxArrivalSamples).toBe(288)
      expect(paths['track/music']).toMatchObject({ compensationSamples: 0, deficitSamples: 0 })
      expect(paths['track/voice']).toMatchObject({ compensationSamples: 288, deficitSamples: 0 })
    }
  })

  it('alignLatency: false leaves the raw report', async () => {
    const result = await renderOffline({
      durationSec: 4,
      alignLatency: false,
      createContext: factory,
      build: latentArrangement,
    })
    const voice = result.latency.paths.find((path) => path.key === 'track/voice')
    expect(voice).toMatchObject({ compensationSamples: 0, deficitSamples: 288 })
  })
})

describe('renderStems with a stretch track', () => {
  it('solos a stretch-track stem instead of throwing', async () => {
    const stems = await renderStems({
      durationSec: 1,
      createContext: factory,
      stems: ['warped'],
      includeMaster: false,
      build: async (engine) => {
        await arrangement(engine)
        engine.addStretchTrack('warped', {
          createStretch: () => Promise.reject(new Error('unused')),
        })
      },
    })
    const engine = stems.warped.engine
    expect(engine.stretchTrack('warped').strip.audible).toBe(true)
    expect(engine.track('music').strip.audible).toBe(false)
    await expect(
      renderStems({ durationSec: 1, createContext: factory, stems: ['nope'], build: arrangement }),
    ).rejects.toThrow(/no track "nope"/)
  })
})

describe('a render that fails', () => {
  /** Counts the engines a build was handed and those that were disposed. */
  function watched(build: (engine: Engine) => Promise<void>): {
    build: (engine: Engine) => Promise<void>
    made: () => number
    disposed: () => number
  } {
    let made = 0
    let disposed = 0
    return {
      build: async (engine) => {
        made += 1
        engine.onDispose(() => {
          disposed += 1
        })
        await build(engine)
      },
      made: () => made,
      disposed: () => disposed,
    }
  }

  it('disposes the engine it made when the build throws: nobody else can reach it', async () => {
    const seen = watched(async (engine) => {
      await arrangement(engine)
      throw new Error('the build broke')
    })
    await expect(
      renderOffline({ durationSec: 1, createContext: factory, build: seen.build }),
    ).rejects.toThrow(/the build broke/)
    expect(seen.made()).toBe(1)
    expect(seen.disposed()).toBe(1)
  })

  it('reports the failure of the render, not that of a companion that broke while it was taken down', async () => {
    const seen = watched(async (engine) => {
      engine.onDispose(() => {
        throw new Error('a companion broke')
      })
      await arrangement(engine)
      throw new Error('the build broke')
    })
    await expect(
      renderOffline({ durationSec: 1, createContext: factory, build: seen.build }),
    ).rejects.toThrow(/the build broke/)
    expect(seen.disposed()).toBe(1)
  })

  it('disposes it when the context cannot render', async () => {
    const seen = watched(arrangement)
    const failing: OfflineContextFactory = (size) => {
      const ctx = factory(size)
      ctx.startRendering = () => Promise.reject(new Error('out of memory'))
      return ctx
    }
    await expect(
      renderOffline({ durationSec: 1, createContext: failing, build: seen.build }),
    ).rejects.toThrow(/out of memory/)
    expect(seen.disposed()).toBe(1)
  })

  it('leaves the engine of a render that succeeds for its caller to dispose', async () => {
    const seen = watched(arrangement)
    const result = await renderOffline({
      durationSec: 1,
      createContext: factory,
      build: seen.build,
    })
    expect(seen.disposed()).toBe(0)
    result.engine.dispose()
    expect(seen.disposed()).toBe(1)
  })

  it('disposes the stems already rendered when a later stem fails', async () => {
    const seen = watched(arrangement)
    await expect(
      renderStems({
        durationSec: 1,
        createContext: factory,
        stems: ['music', 'nope'],
        build: seen.build,
      }),
    ).rejects.toThrow(/no track "nope"/)
    // The master, 'music' and the one that failed.
    expect(seen.made()).toBe(3)
    expect(seen.disposed()).toBe(3)
  })
})

describe('maxAbsDifference', () => {
  it('measures the largest sample deviation and flags shape mismatches', () => {
    const a = { channels: [Float32Array.from([0, 0.5, 1])], sampleRate: 48000 }
    const b = { channels: [Float32Array.from([0, 0.25, 1])], sampleRate: 48000 }
    expect(maxAbsDifference(a, a)).toBe(0)
    expect(maxAbsDifference(a, b)).toBeCloseTo(0.25)
    expect(maxAbsDifference(a, { channels: [Float32Array.from([0, 0])], sampleRate: 48000 })).toBe(
      Number.POSITIVE_INFINITY,
    )
    expect(maxAbsDifference(a, { channels: [], sampleRate: 48000 })).toBe(Number.POSITIVE_INFINITY)
  })
})
