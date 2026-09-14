// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ControlSurface } from '../../core/control/ControlSurface'
import { absoluteEvent, triggerEvent } from '../../core/control/event'
import { type ControlSource } from '../../core/control/source'
import { type ControlTarget } from '../../core/control/target'
import { useControlSurface, useLearn } from '../hooks/useControlSurface'
import { createTestEngine } from './harness'

afterEach(cleanup)

const cc74: ControlSource = { kind: 'cc', channel: 1, controller: 74 }
const pad36: ControlSource = { kind: 'note', channel: 1, note: 36 }
const level: ControlTarget = { kind: 'strip', track: 'pad', control: 'level' }
const mute: ControlTarget = { kind: 'strip', track: 'pad', control: 'mute' }

describe('useControlSurface', () => {
  it('reads the table and learn state and follows every edit', () => {
    const fixture = createTestEngine()
    fixture.engine.addAudioTrack('pad')
    const surface = new ControlSurface({ engine: fixture.engine })
    const { result } = renderHook(() => useControlSurface(surface))
    expect(result.current.mappings).toEqual([])
    expect(result.current.learning).toBeNull()
    expect(result.current.lastEvent).toBeNull()

    act(() => {
      result.current.map({ source: cc74, target: level, pickup: true })
    })
    expect(result.current.mappings).toHaveLength(1)
    expect(result.current.mappingFor(level)?.pickup).toBe(true)

    act(() => result.current.beginLearn(mute))
    expect(result.current.learning).toEqual(mute)
    act(() => {
      surface.handle(triggerEvent(pad36, true, 1))
    })
    expect(result.current.learning).toBeNull()
    expect(result.current.mappingFor(mute)).toMatchObject({ source: pad36, mode: 'toggle' })

    act(() => result.current.update(mute, { mode: 'set' }))
    expect(result.current.mappingFor(mute)?.mode).toBe('set')
    act(() => result.current.unmapSource(pad36))
    expect(result.current.mappings.map((mapping) => mapping.target)).toEqual([level])
    act(() => result.current.unmap(level))
    expect(result.current.mappings).toEqual([])

    const json = surface.serialize()
    act(() => {
      result.current.replace([surface.map({ source: cc74, target: level })])
    })
    expect(result.current.serialize()).not.toBe(json)
    act(() => result.current.clear())
    expect(result.current.mappings).toEqual([])
    act(() => {
      result.current.load(surface.serialize())
    })
    expect(result.current.mappings).toEqual([])
  })

  it('does not re-render on events unless asked, then exposes the last one', () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const surface = new ControlSurface({ engine: fixture.engine })
    surface.map({ source: cc74, target: level })
    const quiet = vi.fn()
    const loud = vi.fn()
    const silent = renderHook(() => {
      quiet()
      return useControlSurface(surface)
    })
    const active = renderHook(() => {
      loud()
      return useControlSurface(surface, { events: true })
    })
    const quietBefore = quiet.mock.calls.length
    const loudBefore = loud.mock.calls.length
    act(() => {
      surface.handle(absoluteEvent(cc74, 1, 127))
    })
    expect(pad.strip.level).toBe(1.5)
    expect(quiet.mock.calls.length).toBe(quietBefore)
    expect(loud.mock.calls.length).toBe(loudBefore + 1)
    expect(silent.result.current.lastEvent).toBeNull()
    expect(active.result.current.lastEvent).toEqual(absoluteEvent(cc74, 1, 127))
  })

  it('writes, reads and releases through the surface', () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const surface = new ControlSurface({ engine: fixture.engine })
    const { result } = renderHook(() => useControlSurface(surface))
    act(() => {
      result.current.set(level, 0.5)
    })
    expect(pad.strip.level).toBe(0.75)
    expect(() => result.current.release(level)).not.toThrow()
    expect(() => result.current.releaseAll()).not.toThrow()
    expect(result.current.surface).toBe(surface)
  })
})

describe('useLearn', () => {
  it('arms, cancels, toggles and reports the binding label for one target', () => {
    const fixture = createTestEngine()
    fixture.engine.addAudioTrack('pad')
    const surface = new ControlSurface({ engine: fixture.engine })
    const levelRow = renderHook(() => useLearn(surface, level))
    const muteRow = renderHook(() => useLearn(surface, mute))
    expect(levelRow.result.current).toMatchObject({
      target: level,
      armed: false,
      busy: false,
      mapping: undefined,
      label: null,
    })

    act(() => levelRow.result.current.begin())
    expect(levelRow.result.current.armed).toBe(true)
    expect(muteRow.result.current.busy).toBe(true)
    act(() => levelRow.result.current.cancel())
    expect(levelRow.result.current.armed).toBe(false)
    expect(muteRow.result.current.busy).toBe(false)

    act(() => levelRow.result.current.toggle())
    expect(levelRow.result.current.armed).toBe(true)
    act(() => levelRow.result.current.toggle())
    expect(levelRow.result.current.armed).toBe(false)

    act(() => levelRow.result.current.toggle())
    act(() => {
      surface.handle(absoluteEvent({ kind: 'cc', channel: 3, controller: 74 }, 0.5, 64))
    })
    expect(levelRow.result.current.armed).toBe(false)
    expect(levelRow.result.current.label).toBe('CC 74 · ch 3')
    expect(levelRow.result.current.mapping?.source).toEqual({
      kind: 'cc',
      channel: 3,
      controller: 74,
    })
    expect(muteRow.result.current.label).toBeNull()

    act(() => muteRow.result.current.begin({ mode: 'toggle' }))
    act(() => {
      surface.handle(absoluteEvent(cc74, 1, 127))
    })
    expect(muteRow.result.current.mapping?.mode).toBe('toggle')
    expect(muteRow.result.current.label).toBe('CC 74 · ch 1')

    act(() => levelRow.result.current.unmap())
    expect(levelRow.result.current.label).toBeNull()
    expect(muteRow.result.current.label).toBe('CC 74 · ch 1')
  })

  it('re-renders only on table and learn changes', () => {
    const fixture = createTestEngine()
    fixture.engine.addAudioTrack('pad')
    const surface = new ControlSurface({ engine: fixture.engine })
    surface.map({ source: cc74, target: level })
    const renders = vi.fn()
    renderHook(() => {
      renders()
      return useLearn(surface, level)
    })
    const before = renders.mock.calls.length
    act(() => {
      surface.handle(absoluteEvent(cc74, 0.2, 25))
    })
    expect(renders.mock.calls.length).toBe(before)
    act(() => surface.beginLearn(mute))
    expect(renders.mock.calls.length).toBe(before + 1)
  })
})
