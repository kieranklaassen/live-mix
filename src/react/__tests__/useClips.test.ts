// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { soundsOnPass } from '../../core/clips/chance'
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

  it('leaves muted clips out of what is sounding and coming up', () => {
    const fixture = createTestEngine()
    const track = fixture.engine.addAudioTrack('music')
    track.clips.set([{ ...clip('a', 0, 4), muted: true }, clip('b', 2, 4)])
    const { result } = renderHook(() => useSchedule(track, { horizonSec: 8 }), {
      wrapper: fixture.wrapper,
    })
    expect(result.current.clips.map((c) => c.id)).toEqual(['a', 'b'])
    expect(result.current.sounding).toEqual([])
    expect(result.current.upcoming.map((view) => view.clip.id)).toEqual(['b'])
    act(() => {
      track.clips.update('a', { muted: false })
    })
    expect(result.current.sounding.map((view) => view.clip.id)).toEqual(['a'])
  })

  it('leaves a clip that sits a pass out of what is sounding and coming up on that pass', () => {
    const fixture = createTestEngine()
    const { engine } = fixture
    const track = engine.addAudioTrack('music')
    const maybe = { ...clip('maybe', 1, 4), chance: 0.5 }
    track.clips.set([{ ...clip('never', 0, 4), chance: 0 }, maybe, clip('always', 2, 4)])
    engine.transport.setLoop({ enabled: true, lengthSec: 10 })
    const { result } = renderHook(() => useSchedule(track, { horizonSec: 4 }), {
      wrapper: fixture.wrapper,
    })
    const sounding = (): string[] => result.current.sounding.map((view) => view.clip.id)
    const upcoming = (): string[] => result.current.upcoming.map((view) => view.clip.id)
    // What the scheduler hands over on a pass: `never` on none, `maybe` on the ones its seed draws.
    const onPass = (pass: number): string[] =>
      soundsOnPass(maybe, pass, engine.scheduler.seed) ? ['maybe', 'always'] : ['always']

    // At 0 the playhead is inside `never`, which no pass sounds.
    expect(sounding()).toEqual([])
    expect(upcoming()).toEqual(onPass(0))

    const drawn = new Set<boolean>()
    for (let pass = 0; pass < 16; pass += 1) {
      act(() => {
        engine.transport.setPass(pass)
        engine.transport.seek(3)
      })
      expect(sounding(), `pass ${pass}`).toEqual(onPass(pass))
      expect(engine.scheduler.sounds(maybe)).toBe(sounding().includes('maybe'))
      drawn.add(sounding().includes('maybe'))
      // 8 + 4 = 12 reaches the starts of the pass after this one.
      act(() => engine.transport.seek(8))
      expect(upcoming(), `from pass ${pass}`).toEqual(onPass(pass + 1).slice(0, -1))
    }
    // Sixteen passes hold both: one it sounds on and one it sits out.
    expect(drawn).toEqual(new Set([true, false]))
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
