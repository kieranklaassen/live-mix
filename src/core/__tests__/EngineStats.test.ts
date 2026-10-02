import { describe, expect, it, vi } from 'vitest'

import { asAudioContext, createMockContext } from '../../testing'
import { createEngine } from '../Engine'
import { LoadProbe, type LoadSampler, type LoadSamplerInit } from '../load'
import { EngineStats, type RenderCapacityLike, type RenderCapacityUpdate } from '../stats'

/** A stand-in for AudioContext.renderCapacity that lets tests fire updates. */
function fakeCapacity() {
  const listeners = new Set<(event: RenderCapacityUpdate) => void>()
  const capacity: RenderCapacityLike & {
    started: { updateInterval?: number }[]
    stopped: number
    fire(update: Partial<RenderCapacityUpdate>): void
  } = {
    started: [],
    stopped: 0,
    start: (options) => {
      capacity.started.push(options ?? {})
    },
    stop: () => {
      capacity.stopped += 1
    },
    addEventListener: (_type, listener) => {
      listeners.add(listener)
    },
    removeEventListener: (_type, listener) => {
      listeners.delete(listener)
    },
    fire: (update) => {
      const event: RenderCapacityUpdate = {
        timestamp: 0,
        averageLoad: 0,
        peakLoad: 0,
        underrunRatio: 0,
        ...update,
      }
      for (const listener of listeners) listener(event)
    },
  }
  return capacity
}

describe('EngineStats', () => {
  it('reports unsupported on contexts without renderCapacity and still counts host glitches', () => {
    const ctx = createMockContext()
    const stats = new EngineStats(asAudioContext(ctx))
    expect(stats.supported).toBe(false)
    expect(stats.snapshot()).toEqual({
      glitches: 0,
      underrunRatio: 0,
      averageLoad: 0,
      peakLoad: 0,
      supported: false,
      loadSource: null,
      glitchSource: null,
      underrunSec: null,
      devices: [],
    })
    const listener = vi.fn()
    stats.subscribe(listener)
    stats.recordGlitch()
    stats.recordGlitch(2)
    expect(stats.glitches).toBe(3)
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ glitches: 3 }))
    stats.reset()
    expect(stats.glitches).toBe(0)
    stats.dispose()
  })

  it('turns render-capacity underrun ratios into a count of glitched quanta', () => {
    const ctx = createMockContext({ sampleRate: 48000 })
    const capacity = fakeCapacity()
    Object.assign(ctx, { renderCapacity: capacity })
    const stats = new EngineStats(asAudioContext(ctx), { updateIntervalSec: 1 })
    expect(stats.supported).toBe(true)
    expect(capacity.started).toEqual([{ updateInterval: 1 }])

    // 1 s at 48 kHz = 375 quanta; 2 % underrun ≈ 8 of them.
    capacity.fire({ underrunRatio: 0.02, averageLoad: 0.4, peakLoad: 0.9 })
    expect(stats.glitches).toBe(8)
    capacity.fire({ underrunRatio: 0 })
    expect(stats.glitches).toBe(8)
    expect(stats.snapshot()).toEqual({
      glitches: 8,
      underrunRatio: 0,
      averageLoad: 0,
      peakLoad: 0,
      supported: true,
      loadSource: 'render-capacity',
      glitchSource: 'render-capacity',
      underrunSec: null,
      devices: [],
    })

    stats.dispose()
    stats.dispose()
    expect(capacity.stopped).toBe(1)
    capacity.fire({ underrunRatio: 1 })
    expect(stats.glitches).toBe(8)
  })

  it('is owned by the engine and stopped on dispose', () => {
    const ctx = createMockContext()
    const capacity = fakeCapacity()
    Object.assign(ctx, { renderCapacity: capacity })
    const engine = createEngine({ context: asAudioContext(ctx), stats: { updateIntervalSec: 0.5 } })
    expect(engine.stats.supported).toBe(true)
    expect(engine.stats.updateIntervalSec).toBe(0.5)
    capacity.fire({ underrunRatio: 0.1 })
    // 0.5 s at 44.1 kHz ≈ 172 quanta; 10 % ≈ 17.
    expect(engine.stats.glitches).toBe(17)
    engine.dispose()
    expect(capacity.stopped).toBe(1)
  })

  it('measures its own devices where the browser reports no load and the page can share memory', () => {
    const ctx = createMockContext()
    const samplers: (LoadSampler & { init: LoadSamplerInit; stopped: boolean })[] = []
    const probe = new LoadProbe({
      measurable: true,
      createSampler: (init) => {
        const sampler = {
          init,
          stopped: false,
          onreport: null,
          stop: () => {
            sampler.stopped = true
          },
        } as (typeof samplers)[number]
        samplers.push(sampler)
        return sampler
      },
    })
    const reverb = probe.claim('zita-rev1')
    const first = probe.claim('grain-cloud')
    const second = probe.claim('grain-cloud')
    const mark = (claim: typeof reverb): number => claim.slot?.slot ?? -1
    expect([mark(reverb), mark(first), mark(second)]).toEqual([1, 2, 3])
    reverb.memoryBytes = 4 << 20
    first.memoryBytes = 10 << 20
    second.memoryBytes = 10 << 20
    const stats = new EngineStats(asAudioContext(ctx), { probe, updateIntervalSec: 0.5 })
    expect(stats.supported).toBe(true)
    expect(stats.loadSource).toBe('devices')
    // Nothing is sampled until somebody watches.
    expect(samplers).toHaveLength(0)

    const listener = vi.fn()
    const unsubscribe = stats.subscribe(listener)
    expect(samplers).toHaveLength(1)
    expect(samplers[0].init.intervalSec).toBe(0.5)
    expect(samplers[0].init.buffer).toBe(reverb.slot?.buffer)

    // 1000 looks: 60 found the reverb at work, 20 and 30 the two grain clouds.
    const counts = new Uint32Array(8)
    counts[mark(reverb)] = 60
    counts[mark(first)] = 20
    counts[mark(second)] = 30
    samplers[0].onreport?.({ counts, total: 1000 })
    expect(listener).toHaveBeenCalledTimes(1)
    const snapshot = stats.snapshot()
    expect(snapshot.averageLoad).toBeCloseTo(0.11)
    expect(snapshot.peakLoad).toBeCloseTo(0.11)
    expect(snapshot.devices).toEqual([
      { label: 'zita-rev1', count: 1, load: 0.06, memoryBytes: 4 << 20 },
      { label: 'grain-cloud', count: 2, load: 0.05, memoryBytes: 20 << 20 },
    ])

    // The peak is the busiest of the recent intervals; the average is the last one.
    samplers[0].onreport?.({ counts: new Uint32Array(8), total: 1000 })
    expect(stats.snapshot().averageLoad).toBe(0)
    expect(stats.snapshot().peakLoad).toBeCloseTo(0.11)

    // A device that is gone leaves the list, and its mark goes to the next one made.
    const freed = mark(first)
    first.release()
    expect(probe.claim('drone').slot?.slot).toBe(freed)

    unsubscribe()
    expect(samplers[0].stopped).toBe(true)
    expect(stats.snapshot().averageLoad).toBe(0)
    stats.subscribe(listener)
    expect(samplers).toHaveLength(2)
    stats.dispose()
    expect(samplers[1].stopped).toBe(true)
  })

  it('hands out no marks where load cannot be measured, and still lists the devices', () => {
    const probe = new LoadProbe({ measurable: false })
    const claim = probe.claim('ember')
    claim.memoryBytes = 4 << 20
    expect(claim.slot).toBeUndefined()
    expect(probe.devices()).toEqual([{ label: 'ember', count: 1, load: 0, memoryBytes: 4 << 20 }])
    const onReading = vi.fn()
    probe.start(1, onReading)()
    expect(onReading).not.toHaveBeenCalled()
    claim.release()
    expect(probe.devices()).toEqual([])
    // The context's own probe: a test runner's page is not isolated, and an offline render has no real time.
    expect(LoadProbe.for(asAudioContext(createMockContext())).measurable).toBe(false)
  })

  it("counts output underruns from the browser's playback statistics, under either name", () => {
    vi.useFakeTimers()
    try {
      const ctx = createMockContext()
      const playbackStats = { underrunEvents: 2, underrunDuration: 0.05 }
      Object.assign(ctx, { playbackStats })
      const stats = new EngineStats(asAudioContext(ctx))
      expect(stats.glitchSource).toBe('playback-stats')
      // What ran dry before the engine existed is not its count.
      expect(stats.snapshot()).toMatchObject({ glitches: 0, underrunSec: 0, supported: false })

      const listener = vi.fn()
      stats.subscribe(listener)
      playbackStats.underrunEvents = 5
      playbackStats.underrunDuration = 0.17
      vi.advanceTimersByTime(1000)
      expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ glitches: 3 }))
      expect(stats.snapshot().underrunSec).toBeCloseTo(0.12)
      stats.recordGlitch()
      expect(stats.glitches).toBe(4)
      stats.reset()
      expect(stats.snapshot()).toMatchObject({ glitches: 0, underrunSec: 0 })
      stats.dispose()

      // Older Chromium: `playoutStats`, the duration in milliseconds.
      const older = createMockContext()
      const playoutStats = { fallbackFramesEvents: 0, fallbackFramesDuration: 0 }
      Object.assign(older, { playoutStats })
      const olderStats = new EngineStats(asAudioContext(older))
      olderStats.subscribe(() => {})
      playoutStats.fallbackFramesEvents = 1
      playoutStats.fallbackFramesDuration = 30
      vi.advanceTimersByTime(1000)
      expect(olderStats.snapshot()).toMatchObject({ glitches: 1, glitchSource: 'playback-stats' })
      expect(olderStats.snapshot().underrunSec).toBeCloseTo(0.03)
      olderStats.dispose()
    } finally {
      vi.useRealTimers()
    }
  })
})
