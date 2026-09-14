// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { audioParamTarget, type ModTarget } from '../../core/automation/ModMatrix'
import { Lfo } from '../../core/automation/Modulator'
import { ParamLane } from '../../core/automation/ParamLane'
import { useLane, useModulation } from '../hooks/useLane'
import { createTestEngine } from './harness'

afterEach(cleanup)

describe('useLane', () => {
  it('reads breakpoints and follows edits, with the lane formula for drawing', () => {
    const lane = new ParamLane({ min: 0, max: 1, defaultValue: 0.5 })
    const { result } = renderHook(() => useLane(lane))
    expect(result.current.breakpoints).toEqual([])
    expect(result.current.version).toBe(0)
    expect(result.current).toMatchObject({ min: 0, max: 1, defaultValue: 0.5 })
    expect(result.current.valueAt(3)).toBe(0.5)

    act(() => {
      result.current.add({ timeSec: 0, value: 0 })
      result.current.add({ timeSec: 10, value: 1 })
    })
    expect(result.current.breakpoints).toEqual([
      { timeSec: 0, value: 0 },
      { timeSec: 10, value: 1 },
    ])
    expect(result.current.version).toBe(2)
    expect(result.current.valueAt(5)).toBe(0.5)
    expect(result.current.valueAt(5)).toBe(lane.valueAt(5))

    act(() => result.current.remove(10))
    expect(result.current.breakpoints).toHaveLength(1)
    act(() => result.current.replace([{ timeSec: 2, value: 0.25, curve: 'smooth' }]))
    expect(result.current.breakpoints).toEqual([{ timeSec: 2, value: 0.25, curve: 'smooth' }])
    act(() => result.current.clear())
    expect(result.current.breakpoints).toEqual([])
  })

  it('re-renders for edits made directly on the lane, not for other lanes', () => {
    const lane = new ParamLane()
    const other = new ParamLane()
    const renders = vi.fn()
    const { result } = renderHook(() => {
      renders()
      return useLane(lane)
    })
    const before = renders.mock.calls.length
    act(() => {
      other.add({ timeSec: 1, value: 1 })
    })
    expect(renders.mock.calls.length).toBe(before)
    act(() => {
      lane.add({ timeSec: 1, value: 1 })
    })
    expect(renders.mock.calls.length).toBe(before + 1)
    expect(result.current.breakpoints).toHaveLength(1)
  })
})

describe('useModulation', () => {
  function gainTarget(fixture: ReturnType<typeof createTestEngine>): ModTarget {
    const node = fixture.ctx.createGain()
    return audioParamTarget(node.gain, { min: 0, max: 1, base: 0.5 })
  }

  it("defaults to the engine's matrix and follows map/unmap/attach/detach", () => {
    const fixture = createTestEngine()
    const { result } = renderHook(() => useModulation(), { wrapper: fixture.wrapper })
    expect(result.current.matrix).toBe(fixture.engine.modulation)
    expect(result.current.routes).toEqual([])

    const lfo = new Lfo({ rateHz: 0.5 })
    const target = gainTarget(fixture)
    let route = result.current.routes[0]
    act(() => {
      route = result.current.map(lfo, target, 0.4)
    })
    expect(result.current.routes).toEqual([route])
    expect(result.current.targets).toEqual([target])
    expect(result.current.routesFor(target)).toEqual([route])
    expect(route.depth).toBe(0.4)

    act(() => result.current.setRoute(route, { depth: -0.2, polarity: 'bipolar' }))
    expect(result.current.routes[0]).toMatchObject({ depth: -0.2, polarity: 'bipolar' })

    act(() => result.current.unmap(route))
    expect(result.current.routes).toEqual([])
    expect(result.current.targets).toEqual([target])

    act(() => result.current.detach(target))
    expect(result.current.targets).toEqual([])

    const bare = gainTarget(fixture)
    act(() => result.current.attach(bare))
    expect(result.current.targets).toEqual([bare])
  })

  it('re-renders when a route is edited in place through setRoute', () => {
    const fixture = createTestEngine()
    const renders = vi.fn()
    const { result } = renderHook(
      () => {
        renders()
        return useModulation()
      },
      { wrapper: fixture.wrapper },
    )
    const target = gainTarget(fixture)
    act(() => {
      result.current.map(new Lfo({ rateHz: 1 }), target)
    })
    const before = renders.mock.calls.length
    act(() => {
      fixture.engine.modulation.setRoute(result.current.routes[0], { depth: 0.1 })
    })
    expect(renders.mock.calls.length).toBe(before + 1)
    expect(result.current.routes[0].depth).toBe(0.1)
  })
})
