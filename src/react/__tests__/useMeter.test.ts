// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { silentReading, type MeterReading } from '../../core/analysis/loudness'
import { type MockAnalyserNode, type MockAudioWorkletNode } from '../../testing'
import { readMeter, useMeter } from '../hooks/useMeter'
import { createTestEngine, type TestEngine } from './harness'

afterEach(cleanup)

function analyser(fixture: TestEngine): MockAnalyserNode {
  return fixture.ctx.analysers[0]
}

async function installLufs(fixture: TestEngine): Promise<MockAudioWorkletNode> {
  await fixture.engine.master.installLufsMeter({
    processorUrl: 'meter.js',
    createNode: (_context, name, options) =>
      fixture.ctx.createWorkletNode(name, options) as unknown as AudioWorkletNode,
  })
  return fixture.ctx.workletNodes[fixture.ctx.workletNodes.length - 1]
}

function reading(shortTerm: number, truePeak: number): MeterReading {
  return {
    ...silentReading(),
    shortTerm,
    momentary: shortTerm,
    truePeak: [truePeak, truePeak],
    samplePeak: [truePeak * 0.9, truePeak * 0.9],
    maxTruePeak: truePeak,
  }
}

describe('useMeter', () => {
  it('samples the master analyser on frames at the bounded rate', () => {
    const fixture = createTestEngine()
    const { result } = renderHook(() => useMeter(undefined, { fps: 20 }), {
      wrapper: fixture.wrapper,
    })
    expect(result.current).toMatchObject({ peak: 0, rms: 0, hasMeter: true, hasLufs: false })
    expect(result.current.peakDb).toBe(-Infinity)
    expect(fixture.frames.size).toBe(1)

    analyser(fixture).level = 0.5
    act(() => fixture.frames.flush(0))
    expect(result.current.peak).toBe(0.5)
    expect(result.current.rms).toBeCloseTo(0.5)
    expect(result.current.peakDb).toBeCloseTo(-6.02, 2)

    analyser(fixture).level = 0.25
    act(() => fixture.frames.flush(20))
    expect(result.current.peak).toBe(0.5)
    act(() => fixture.frames.flush(50))
    expect(result.current.peak).toBe(0.25)
  })

  it('does not re-render while the reading is unchanged', () => {
    const fixture = createTestEngine()
    const renders = vi.fn()
    renderHook(
      () => {
        renders()
        return useMeter()
      },
      { wrapper: fixture.wrapper },
    )
    const before = renders.mock.calls.length
    act(() => fixture.frames.flush(0))
    act(() => fixture.frames.flush(100))
    expect(renders.mock.calls.length).toBe(before)
  })

  it('picks up a LUFS meter installed after mount and reads its latest message', async () => {
    const fixture = createTestEngine()
    const { result } = renderHook(() => useMeter(), { wrapper: fixture.wrapper })
    expect(result.current.hasLufs).toBe(false)

    const node = await installLufs(fixture)
    node.port.receive({ type: 'reading', reading: reading(-18, 0.5) })
    act(() => fixture.frames.flush(0))
    expect(result.current.hasLufs).toBe(true)
    expect(result.current.lufsShortTerm).toBe(-18)
    expect(result.current.truePeakDb).toBeCloseTo(-6.02, 2)
    expect(result.current.lufs?.shortTerm).toBe(-18)

    // Two messages between frames: the frame reads the latest.
    node.port.receive({ type: 'reading', reading: reading(-20, 0.4) })
    node.port.receive({ type: 'reading', reading: reading(-14, 0.8) })
    act(() => fixture.frames.flush(100))
    expect(result.current.lufsShortTerm).toBe(-14)
  })

  it('reads a bare Meter or LufsMeter and reports what is missing', async () => {
    const fixture = createTestEngine()
    const meterOnly = renderHook(() => useMeter(fixture.engine.master.meter ?? undefined), {
      wrapper: fixture.wrapper,
    })
    expect(meterOnly.result.current).toMatchObject({ hasMeter: true, hasLufs: false })

    const node = await installLufs(fixture)
    const lufs = fixture.engine.master.lufs
    if (!lufs) throw new Error('lufs not installed')
    node.port.receive({ type: 'reading', reading: reading(-23, 0.25) })
    const lufsOnly = renderHook(() => useMeter(lufs))
    act(() => fixture.frames.flush(0))
    expect(lufsOnly.result.current).toMatchObject({ hasMeter: false, hasLufs: true, rms: 0 })
    expect(lufsOnly.result.current.peak).toBeCloseTo(0.225)
    expect(lufsOnly.result.current.lufsShortTerm).toBe(-23)
  })

  it('stops sampling when inactive and on unmount', () => {
    const fixture = createTestEngine()
    const { result, rerender, unmount } = renderHook(
      ({ active }: { active: boolean }) => useMeter(undefined, { active }),
      { wrapper: fixture.wrapper, initialProps: { active: true } },
    )
    expect(fixture.frames.size).toBe(1)
    analyser(fixture).level = 0.5
    act(() => fixture.frames.flush(0))
    expect(result.current.peak).toBe(0.5)

    rerender({ active: false })
    expect(fixture.frames.size).toBe(0)
    analyser(fixture).level = 0.75
    expect(result.current.peak).toBe(0.5)

    rerender({ active: true })
    expect(fixture.frames.size).toBe(1)
    unmount()
    expect(fixture.frames.size).toBe(0)
  })

  it('readMeter on a master without meters is silent', () => {
    const fixture = createTestEngine({ master: {} })
    expect(readMeter(fixture.engine.master)).toMatchObject({
      peak: 0,
      hasMeter: false,
      hasLufs: false,
      lufs: null,
    })
  })
})
