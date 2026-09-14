import { describe, expect, it, vi } from 'vitest'

import { asAudioContext, createMockContext } from '../../testing'
import { createEngine } from '../Engine'
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
})
