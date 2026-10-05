// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { useLayoutEffect } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  frameIntervalMs,
  subscribeFrames,
  subscribeFrameSampled,
  useFrameSampled,
  type FrameScheduler,
} from '../frame'
import { ManualFrames } from './harness'

afterEach(cleanup)

describe('subscribeFrames', () => {
  it('runs every subscriber of a scheduler on one chain of frame requests', () => {
    const frames = new ManualFrames()
    const first = vi.fn()
    const second = vi.fn()
    const stopFirst = subscribeFrames(frames, 10, first)
    const stopSecond = subscribeFrames(frames, 25, second)
    expect(frames.size).toBe(1)
    expect(frames.requests).toBe(1)

    frames.flush(0)
    expect(first).toHaveBeenCalledWith(0)
    expect(second).toHaveBeenCalledWith(0)
    // One request per frame, however many subscribers there are.
    expect(frames.size).toBe(1)
    expect(frames.requests).toBe(2)

    stopFirst()
    expect(frames.size).toBe(1)
    stopSecond()
    expect(frames.size).toBe(0)
    expect(frames.cancels).toBe(1)
    // Stopping twice is nothing.
    stopSecond()
    expect(frames.cancels).toBe(1)
  })

  it('keeps one chain per scheduler', () => {
    const one = new ManualFrames()
    const other = new ManualFrames()
    const onOne = vi.fn()
    const onOther = vi.fn()
    subscribeFrames(one, 10, onOne)
    subscribeFrames(other, 10, onOther)
    one.flush(0)
    expect(onOne).toHaveBeenCalledTimes(1)
    expect(onOther).not.toHaveBeenCalled()
    expect(other.size).toBe(1)
  })

  it('lets a subscriber through at most every interval, with half a millisecond of slack', () => {
    const frames = new ManualFrames()
    const fast: number[] = []
    subscribeFrames(frames, frameIntervalMs(60), (time) => fast.push(time))
    // 60 Hz frames against a 60 fps interval: every one passes.
    for (const time of [0, 16.6, 33.3, 50]) frames.flush(time)
    expect(fast).toEqual([0, 16.6, 33.3, 50])

    const slow: number[] = []
    subscribeFrames(frames, 50, (time) => slow.push(time))
    for (const time of [60, 80, 100, 109.4, 109.6, 150, 160]) frames.flush(time)
    expect(slow).toEqual([60, 109.6, 160])
  })

  it('fires subscribers with the same interval on the same frames, whenever they joined', () => {
    const frames = new ManualFrames()
    const seen: string[] = []
    subscribeFrames(frames, 30, (time) => seen.push(`a${time}`))
    frames.flush(0)
    frames.flush(16)
    // The second joins between two of the first one's frames, and waits for the next of them.
    subscribeFrames(frames, 30, (time) => seen.push(`b${time}`))
    frames.flush(20)
    expect(seen).toEqual(['a0'])
    frames.flush(32)
    frames.flush(48)
    frames.flush(64)
    expect(seen).toEqual(['a0', 'a32', 'b32', 'a64', 'b64'])
    // Another interval keeps its own rhythm.
    subscribeFrames(frames, 20, (time) => seen.push(`c${time}`))
    frames.flush(70)
    frames.flush(80)
    frames.flush(96)
    expect(seen.slice(5)).toEqual(['c70', 'a96', 'b96', 'c96'])
  })

  it('starts a fresh rhythm once an interval has lost its last subscriber', () => {
    const frames = new ManualFrames()
    const first = vi.fn()
    const stop = subscribeFrames(frames, 100, first)
    frames.flush(0)
    stop()
    const second = vi.fn()
    subscribeFrames(frames, 100, second)
    expect(frames.size).toBe(1)
    frames.flush(10)
    expect(second).toHaveBeenCalledWith(10)
    expect(first).toHaveBeenCalledTimes(1)
  })

  it('leaves out a subscriber that stopped during the frame, and one that joined during it', () => {
    const frames = new ManualFrames()
    const late = vi.fn()
    const joiner = vi.fn()
    const stoppers: (() => void)[] = []
    subscribeFrames(frames, 10, () => {
      stoppers[0]()
      subscribeFrames(frames, 10, joiner)
    })
    stoppers.push(subscribeFrames(frames, 10, late))
    frames.flush(0)
    expect(late).not.toHaveBeenCalled()
    expect(joiner).not.toHaveBeenCalled()
    frames.flush(10)
    expect(late).not.toHaveBeenCalled()
    expect(joiner).toHaveBeenCalledTimes(1)
  })

  it('cancels the frame it asked for when the last subscriber stops during a frame', () => {
    const frames = new ManualFrames()
    const stoppers: (() => void)[] = []
    stoppers.push(subscribeFrames(frames, 10, () => stoppers[0]()))
    frames.flush(0)
    expect(frames.size).toBe(0)
    // And starts again for the next one.
    const again = vi.fn()
    subscribeFrames(frames, 10, again)
    expect(frames.size).toBe(1)
    frames.flush(1)
    expect(again).toHaveBeenCalledTimes(1)
  })

  it('drops a subscriber that throws, after the others had their frame', () => {
    const frames = new ManualFrames()
    const before = vi.fn()
    const after = vi.fn()
    const broken = vi.fn(() => {
      throw new Error('sample failed')
    })
    subscribeFrames(frames, 10, before)
    subscribeFrames(frames, 10, broken)
    subscribeFrames(frames, 10, after)
    expect(() => frames.flush(0)).toThrow('sample failed')
    expect(before).toHaveBeenCalledTimes(1)
    expect(after).toHaveBeenCalledTimes(1)
    frames.flush(10)
    expect(broken).toHaveBeenCalledTimes(1)
    expect(after).toHaveBeenCalledTimes(2)
  })

  it('asks for no frame when a scheduler that could not cancel calls back with nobody left', () => {
    const callbacks: ((timeMs: number) => void)[] = []
    const deaf: FrameScheduler = {
      request: (callback) => callbacks.push(callback),
      cancel: () => {},
    }
    subscribeFrames(deaf, 10, () => {})()
    expect(callbacks).toHaveLength(1)
    callbacks[0](0)
    expect(callbacks).toHaveLength(1)
  })

  it('keeps one chain on a scheduler that hands out no handle', () => {
    // A host's own loop: it queues the callback and has nothing to give back for it.
    const queue: ((timeMs: number) => void)[] = []
    const frames: FrameScheduler = {
      request: (callback) => {
        queue.push(callback)
        return undefined
      },
      cancel: () => {},
    }
    const flush = (timeMs: number): void => {
      for (const callback of queue.splice(0)) callback(timeMs)
    }
    const stopFirst = subscribeFrames(frames, 10, vi.fn())
    expect(queue).toHaveLength(1)
    // A second subscriber before the first frame, and a third between two frames.
    const stopSecond = subscribeFrames(frames, 10, vi.fn())
    expect(queue).toHaveLength(1)
    flush(0)
    const stopThird = subscribeFrames(frames, 25, vi.fn())
    expect(queue).toHaveLength(1)
    flush(20)
    expect(queue).toHaveLength(1)
    stopFirst()
    stopSecond()
    stopThird()
  })
})

describe('subscribeFrameSampled', () => {
  it('tells the first sample at once, then each sample that changed, at the bounded rate', () => {
    const frames = new ManualFrames()
    let level = 1
    const told: number[] = []
    const stop = subscribeFrameSampled(
      frames,
      50,
      () => level,
      (value) => told.push(value),
    )
    expect(told).toEqual([1])
    frames.flush(0)
    expect(told).toEqual([1])
    level = 2
    frames.flush(20)
    expect(told).toEqual([1])
    frames.flush(50)
    expect(told).toEqual([1, 2])
    frames.flush(100)
    expect(told).toEqual([1, 2])
    stop()
    expect(frames.size).toBe(0)
  })

  it('compares samples shallowly unless told how', () => {
    const frames = new ManualFrames()
    let reading = { db: -6, clipped: false }
    const told = vi.fn()
    subscribeFrameSampled(frames, 10, () => ({ ...reading }), told)
    frames.flush(0)
    expect(told).toHaveBeenCalledTimes(1)
    reading = { db: -3, clipped: false }
    frames.flush(10)
    expect(told).toHaveBeenLastCalledWith({ db: -3, clipped: false })

    const rounded = vi.fn()
    let level = 0.2
    subscribeFrameSampled(
      frames,
      10,
      () => level,
      rounded,
      (previous, next) => Math.round(previous) === Math.round(next),
    )
    level = 0.4
    frames.flush(20)
    expect(rounded).toHaveBeenCalledTimes(1)
    level = 0.6
    frames.flush(30)
    expect(rounded).toHaveBeenLastCalledWith(0.6)
  })
})

describe('useFrameSampled', () => {
  it('shares the chain between hooks and aligns the ones with the same interval', () => {
    const frames = new ManualFrames()
    let level = 0
    const first = renderHook(() => useFrameSampled(true, 30, () => level, frames))
    act(() => frames.flush(0))
    const second = renderHook(() => useFrameSampled(true, 30, () => level, frames))
    expect(frames.size).toBe(1)

    level = 1
    act(() => frames.flush(16))
    expect([first.result.current, second.result.current]).toEqual([0, 0])
    act(() => frames.flush(32))
    expect([first.result.current, second.result.current]).toEqual([1, 1])

    first.unmount()
    expect(frames.size).toBe(1)
    second.unmount()
    expect(frames.size).toBe(0)
  })

  it('samples once while inactive and asks for no frame', () => {
    const frames = new ManualFrames()
    let level = 3
    const { result, rerender } = renderHook(
      ({ active }: { active: boolean }) => useFrameSampled(active, 30, () => level, frames),
      { initialProps: { active: false } },
    )
    expect(result.current).toBe(3)
    expect(frames.size).toBe(0)
    level = 4
    rerender({ active: true })
    expect(result.current).toBe(4)
    expect(frames.size).toBe(1)
  })

  it('takes its sample afresh in the render that turns it on: the old one is never drawn', () => {
    const frames = new ManualFrames()
    let level = 3
    const drawn: number[] = []
    const { rerender } = renderHook(
      ({ active }: { active: boolean }) => {
        const value = useFrameSampled(active, 30, () => level, frames)
        useLayoutEffect(() => {
          drawn.push(value)
        })
        return value
      },
      { initialProps: { active: false } },
    )
    // A playhead moved at rest: nothing samples it until it runs.
    level = 4
    drawn.length = 0
    rerender({ active: true })
    expect(drawn).toEqual([4])
  })
})
