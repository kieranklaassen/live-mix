// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { cleanup } from '@testing-library/react'

import { useTransport } from '../hooks/useTransport'
import { createTestEngine } from './harness'

afterEach(cleanup)

describe('useTransport', () => {
  it('reads state and the resting position, and re-renders on transport changes', () => {
    const { engine, wrapper } = createTestEngine()
    const { result } = renderHook(() => useTransport(), { wrapper })
    expect(result.current.state).toBe('stopped')
    expect(result.current.stopped).toBe(true)
    expect(result.current.positionSec).toBe(0)
    expect(result.current.loop).toEqual({ enabled: false, lengthSec: Infinity })

    act(() => engine.transport.seek(12.5))
    expect(result.current.positionSec).toBe(12.5)
    expect(result.current.state).toBe('stopped')

    act(() => engine.transport.setLoop({ enabled: true, lengthSec: 20 }))
    expect(result.current.loop).toEqual({ enabled: true, lengthSec: 20 })
  })

  it('binds the controls', () => {
    const { engine, ctx, wrapper } = createTestEngine()
    const { result } = renderHook(() => useTransport(), { wrapper })
    act(() => result.current.start())
    expect(engine.transport.state).toBe('playing')
    expect(result.current.playing).toBe(true)

    ctx.advanceClock(3)
    act(() => result.current.pause())
    expect(result.current.paused).toBe(true)
    expect(result.current.positionSec).toBeCloseTo(3)

    act(() => result.current.toggle())
    expect(result.current.playing).toBe(true)
    act(() => result.current.toggle())
    expect(result.current.paused).toBe(true)

    act(() => result.current.seek(1))
    expect(result.current.positionSec).toBe(1)
    act(() => result.current.stop({ fadeSec: 0.5 }))
    expect(result.current.stopped).toBe(true)
    expect(result.current.positionSec).toBe(0)
  })

  it('samples the playhead on frames while playing, no faster than fps', () => {
    const { engine, ctx, frames, wrapper } = createTestEngine()
    const { result } = renderHook(() => useTransport(undefined, { fps: 10 }), { wrapper })
    expect(frames.size).toBe(0)

    act(() => engine.transport.start())
    expect(frames.size).toBe(1)

    ctx.advanceClock(0.5)
    act(() => frames.flush(0))
    expect(result.current.positionSec).toBeCloseTo(0.5)

    // 50 ms later: under the 100 ms interval, no re-sample.
    ctx.advanceClock(0.5)
    act(() => frames.flush(50))
    expect(result.current.positionSec).toBeCloseTo(0.5)

    act(() => frames.flush(100))
    expect(result.current.positionSec).toBeCloseTo(1)
    expect(frames.size).toBe(1)

    act(() => engine.transport.pause())
    expect(frames.size).toBe(0)
    expect(result.current.positionSec).toBeCloseTo(1)
  })

  it('counts the passes of the loop through a pause and a seek, where `iteration` starts anew', () => {
    const { engine, ctx, frames, wrapper } = createTestEngine()
    const { result } = renderHook(() => useTransport(), { wrapper })
    act(() => engine.transport.setLoop({ enabled: true, lengthSec: 8 }))
    act(() => engine.transport.start())
    act(() => engine.transport.pause())
    act(() => engine.transport.start())
    expect([result.current.pass, result.current.iteration]).toEqual([0, 1])

    ctx.advanceClock(17)
    act(() => frames.flush(0))
    expect(result.current.pass).toBe(2)
    expect(result.current.positionSec).toBeCloseTo(1)
    act(() => engine.transport.pause())
    act(() => engine.transport.seek(3))
    expect(result.current.pass).toBe(2)
    expect(result.current.position).toEqual({ positionSec: 3, iteration: 3, finished: false })

    act(() => engine.transport.stop())
    expect(result.current.pass).toBe(0)
  })

  it('stops the frame loop on unmount', () => {
    const { engine, frames, wrapper } = createTestEngine()
    const { unmount } = renderHook(() => useTransport(), { wrapper })
    act(() => engine.transport.start())
    expect(frames.size).toBe(1)
    unmount()
    expect(frames.size).toBe(0)
  })

  it('takes an explicit transport without a provider', () => {
    const { engine } = createTestEngine()
    const { result } = renderHook(() => useTransport(engine.transport))
    expect(result.current.transport).toBe(engine.transport)
    act(() => engine.transport.seek(4))
    expect(result.current.positionSec).toBe(4)
  })

  it('throws without a provider or an explicit transport', () => {
    expect(() => renderHook(() => useTransport())).toThrow(/useTransport needs an engine/)
  })
})
