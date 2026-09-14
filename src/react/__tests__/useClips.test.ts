// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { type Clip } from '../../core/clips/Clip'
import { useClips, useSchedule } from '../hooks/useClips'
import { createTestEngine } from './harness'

afterEach(cleanup)

function clip(id: string, startSec: number, durationSec = 4): Clip {
  return {
    id,
    sourceId: id,
    startSec,
    offsetSec: 0,
    durationSec,
    fadeInSec: 0,
    fadeOutSec: 0,
    fadeCurve: 'linear',
    gainDb: 0,
  }
}

describe('useClips', () => {
  it('reads the sorted list and follows every mutation', () => {
    const fixture = createTestEngine()
    const track = fixture.engine.addAudioTrack('music')
    const { result } = renderHook(() => useClips(track))
    expect(result.current.list).toBe(track.clips)
    expect(result.current.clips).toEqual([])

    act(() => {
      result.current.add(clip('b', 8))
      result.current.add(clip('a', 0))
    })
    expect(result.current.clips.map((c) => c.id)).toEqual(['a', 'b'])

    act(() => {
      result.current.update('a', { startSec: 12 })
    })
    expect(result.current.clips.map((c) => c.id)).toEqual(['b', 'a'])

    act(() => {
      result.current.remove('b')
    })
    expect(result.current.clips.map((c) => c.id)).toEqual(['a'])

    act(() => result.current.replaceFrom(10, [clip('c', 20)]))
    expect(result.current.clips.map((c) => c.id)).toEqual(['c'])

    act(() => result.current.set([clip('d', 1), clip('e', 2)]))
    expect(result.current.clips.map((c) => c.id)).toEqual(['d', 'e'])
    act(() => result.current.clear())
    expect(result.current.clips).toEqual([])
  })

  it('accepts a bare ClipList and does not re-render for other lists', () => {
    const fixture = createTestEngine()
    const a = fixture.engine.addAudioTrack('a')
    const b = fixture.engine.addAudioTrack('b')
    const renders = vi.fn()
    renderHook(() => {
      renders()
      return useClips(a.clips)
    })
    const before = renders.mock.calls.length
    act(() => {
      b.clips.add(clip('x', 0))
    })
    expect(renders.mock.calls.length).toBe(before)
  })
})

describe('useSchedule', () => {
  it('lists sounding and upcoming clips from the resting position and after seeks', () => {
    const fixture = createTestEngine()
    const track = fixture.engine.addAudioTrack('music')
    track.clips.set([clip('a', 0, 4), clip('b', 6, 4), clip('c', 30, 4)])
    const { result } = renderHook(() => useSchedule(track, { horizonSec: 8 }), {
      wrapper: fixture.wrapper,
    })
    expect(result.current.playing).toBe(false)
    expect(result.current.sounding.map((view) => view.clip.id)).toEqual(['a'])
    expect(result.current.upcoming.map((view) => [view.clip.id, view.startsInSec])).toEqual([
      ['a', 0],
      ['b', 6],
    ])

    act(() => fixture.engine.transport.seek(7))
    expect(result.current.positionSec).toBe(7)
    expect(result.current.sounding.map((view) => view.clip.id)).toEqual(['b'])
    expect(result.current.sounding[0].startsInSec).toBe(-1)
    expect(result.current.upcoming).toEqual([])

    act(() => fixture.engine.transport.seek(25))
    expect(result.current.upcoming.map((view) => view.clip.id)).toEqual(['c'])
  })

  it('follows the playhead on frames while playing and wraps into the next loop pass', () => {
    const fixture = createTestEngine()
    const track = fixture.engine.addAudioTrack('music')
    track.clips.set([clip('a', 0, 4), clip('b', 6, 4)])
    fixture.engine.transport.setLoop({ enabled: true, lengthSec: 10 })
    const { result } = renderHook(() => useSchedule(track, { horizonSec: 6, fps: 10 }), {
      wrapper: fixture.wrapper,
    })

    act(() => fixture.engine.transport.start())
    expect(result.current.playing).toBe(true)
    fixture.ctx.advanceClock(7)
    act(() => fixture.frames.flush(0))
    expect(result.current.positionSec).toBeCloseTo(7)
    expect(result.current.sounding.map((view) => view.clip.id)).toEqual(['b'])
    // 7 + 6 = 13 reaches into the next pass: `a` at 10 s, pass 1.
    expect(result.current.upcoming.map((view) => [view.clip.id, view.iteration])).toEqual([
      ['a', result.current.iteration + 1],
    ])
    expect(result.current.upcoming[0].startsInSec).toBeCloseTo(3)
  })

  it('recomputes when the clip list changes', () => {
    const fixture = createTestEngine()
    const track = fixture.engine.addAudioTrack('music')
    const { result } = renderHook(() => useSchedule(track), { wrapper: fixture.wrapper })
    expect(result.current.upcoming).toEqual([])
    act(() => {
      track.clips.add(clip('a', 2))
    })
    expect(result.current.upcoming.map((view) => view.clip.id)).toEqual(['a'])
    expect(result.current.clips).toHaveLength(1)
  })
})
