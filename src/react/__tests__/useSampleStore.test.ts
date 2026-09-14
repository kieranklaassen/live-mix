// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useEngineStats } from '../hooks/useEngineStats'
import { useSampleStore } from '../hooks/useSampleStore'
import { createTestEngine } from './harness'

afterEach(cleanup)

/** The mock decodes an N-byte buffer to N seconds of stereo audio at the context rate. */
function bytesFor(seconds: number): ArrayBuffer {
  return new ArrayBuffer(seconds)
}

describe('useSampleStore', () => {
  it('reports metrics and ids and follows loads, pins, holds, budget and forgets', async () => {
    const fixture = createTestEngine()
    const { result } = renderHook(() => useSampleStore(), { wrapper: fixture.wrapper })
    expect(result.current.store).toBe(fixture.engine.samples)
    expect(result.current.metrics).toMatchObject({ count: 0, bytes: 0, loads: 0, pinned: 0 })
    expect(result.current.ids).toEqual([])

    await act(() => result.current.load('a', bytesFor(1)))
    expect(result.current.ids).toEqual(['a'])
    const oneSecond = 2 * 48_000 * 4
    expect(result.current.metrics).toMatchObject({ count: 1, bytes: oneSecond, loads: 1 })

    act(() => result.current.pin('a'))
    expect(result.current.metrics.pinned).toBe(1)
    act(() => result.current.unpin('a'))
    expect(result.current.metrics.pinned).toBe(0)

    let release = (): void => {}
    act(() => {
      release = fixture.engine.samples.retain('a')
    })
    expect(result.current.metrics.held).toBe(1)
    act(() => release())
    expect(result.current.metrics.held).toBe(0)

    await act(() => result.current.load('b', bytesFor(2)))
    expect(result.current.ids).toEqual(['a', 'b'])
    act(() => result.current.setBudgetBytes(oneSecond * 2.5))
    expect(result.current.metrics).toMatchObject({
      count: 1,
      evictions: 1,
      budgetBytes: oneSecond * 2.5,
    })
    expect(result.current.ids).toEqual(['b'])

    act(() => result.current.forget('b'))
    expect(result.current.metrics.count).toBe(0)
  })
})

describe('useEngineStats', () => {
  it('reads the snapshot and follows recorded glitches and resets', () => {
    const fixture = createTestEngine()
    const { result } = renderHook(() => useEngineStats(), { wrapper: fixture.wrapper })
    expect(result.current.stats).toBe(fixture.engine.stats)
    expect(result.current).toMatchObject({ glitches: 0, supported: false, averageLoad: 0 })

    act(() => result.current.recordGlitch(3))
    expect(result.current.glitches).toBe(3)
    act(() => fixture.engine.stats.recordGlitch())
    expect(result.current.glitches).toBe(4)
    act(() => result.current.reset())
    expect(result.current.glitches).toBe(0)
  })
})
