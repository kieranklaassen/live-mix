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
import { createEngine, type Engine } from '../../Engine'
import { maxAbsDifference, renderOffline, renderStems, type OfflineContextFactory } from '../OfflineRenderer'

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

describe('maxAbsDifference', () => {
  it('measures the largest sample deviation and flags shape mismatches', () => {
    const a = { channels: [Float32Array.from([0, 0.5, 1])], sampleRate: 48000 }
    const b = { channels: [Float32Array.from([0, 0.25, 1])], sampleRate: 48000 }
    expect(maxAbsDifference(a, a)).toBe(0)
    expect(maxAbsDifference(a, b)).toBeCloseTo(0.25)
    expect(
      maxAbsDifference(a, { channels: [Float32Array.from([0, 0])], sampleRate: 48000 }),
    ).toBe(Number.POSITIVE_INFINITY)
    expect(maxAbsDifference(a, { channels: [], sampleRate: 48000 })).toBe(Number.POSITIVE_INFINITY)
  })
})
