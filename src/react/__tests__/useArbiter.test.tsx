// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { MockAudioBuffer, type MockGainNode } from '../../testing'
import { NODE_DEVICES } from '../../core/devices/native'
import { DeviceRegistry } from '../../core/devices/registry'
import { Arbiter } from '../../score/Arbiter'
import { loadScore } from '../../score/loadScore'
import { type Author } from '../../score/log'
import { type Operation } from '../../score/operations'
import { findStripHost } from '../../score/schema'
import { ScoreDocument } from '../../score/ScoreDocument'
import { demoScore } from '../../score/__tests__/fixtures'
import { useArbiter, useArbiterTarget } from '../hooks/useArbiter'
import { LiveMixProvider } from '../hooks/useEngine'
import { useDeviceParam } from '../hooks/useParam'
import { useTrack } from '../hooks/useTrack'
import { createTestEngine } from './harness'

afterEach(cleanup)

const coach: Author = { id: 'coach', kind: 'agent' }
const kickLevel = { kind: 'strip' as const, owner: 'kick', param: 'level' as const }
const set = (value: number): Operation => ({ ...kickLevel, type: 'strip.set', value })

async function rig() {
  const fixture = createTestEngine({ devices: new DeviceRegistry(NODE_DEVICES) })
  const buffer = new MockAudioBuffer(2, 48000 * 10, 48000) as unknown as AudioBuffer
  await fixture.engine.samples.load('a', buffer)
  await fixture.engine.samples.load('b', buffer)
  const clock = { ms: 0 }
  const document = new ScoreDocument(demoScore(), { now: () => clock.ms })
  const renderer = loadScore(fixture.engine, document, { onError: () => {} })
  await renderer.whenIdle()
  const arbiter = new Arbiter(document, {
    now: () => clock.ms,
    renderer,
    setTimeoutFn: () => 0,
    clearTimeoutFn: () => {},
  })
  const wrapper = ({ children }: { children: ReactNode }): ReactNode =>
    createElement(
      LiveMixProvider,
      { engine: fixture.engine, frame: fixture.frames, arbiter },
      children,
    )
  return { ...fixture, document, renderer, arbiter, clock, wrapper }
}

describe('useArbiter', () => {
  it('follows holds and pending writes through every event, and exposes the controls', async () => {
    const { arbiter, clock, document } = await rig()
    const { result } = renderHook(() => useArbiter(arbiter))
    expect(result.current.holds).toEqual([])
    expect(result.current.pending).toEqual([])

    act(() => {
      result.current.apply(set(0.5))
    })
    expect(result.current.holds).toMatchObject([
      { target: 'strip:kick:level', owner: document.author },
    ])
    act(() => {
      arbiter.apply(set(0.2), { author: coach })
    })
    expect(result.current.pending).toHaveLength(1)
    expect(result.current.stateOf(kickLevel).pending).toHaveLength(1)
    act(() => {
      clock.ms = 5000
      arbiter.tick()
    })
    expect(result.current.holds).toEqual([])
    expect(result.current.pending).toEqual([])
    expect(findStripHost(document.score, 'kick')?.strip.level).toBe(0.2)

    act(() => result.current.lock('strip:kick:level', { reason: 'test' }))
    expect(result.current.locks).toMatchObject([{ reason: 'test' }])
    act(() => result.current.unlock('strip:kick:level'))
    expect(result.current.locks).toEqual([])
    act(() => result.current.undo())
    expect(findStripHost(document.score, 'kick')?.strip.level).toBe(0.5)
  })

  it('resolves the provided arbiter and throws without one', async () => {
    const { arbiter, wrapper } = await rig()
    const { result } = renderHook(() => useArbiter(), { wrapper })
    expect(result.current.arbiter).toBe(arbiter)
    expect(() => renderHook(() => useArbiter())).toThrow(/needs an arbiter/)
  })
})

describe('useArbiterTarget', () => {
  it('names who holds a control and whether an agent write waits on it', async () => {
    const { arbiter, clock, wrapper } = await rig()
    const listener: Author = { id: 'listener', kind: 'human' }
    const { result } = renderHook(() => useArbiterTarget(kickLevel), { wrapper })
    expect(result.current.status).toBe('')
    act(() => result.current.touch())
    expect(result.current).toMatchObject({
      heldByMe: true,
      heldByOther: false,
      status: 'held by you',
    })
    act(() => {
      arbiter.apply(set(0.1), { author: coach })
    })
    expect(result.current.agentPending).toBe(true)
    expect(result.current.status).toBe('held by you')
    act(() => result.current.release())
    act(() => {
      clock.ms = 5000
      arbiter.tick()
    })
    expect(result.current).toMatchObject({ agentPending: false, status: '' })

    act(() => {
      arbiter.apply(set(0.4), { author: listener })
    })
    expect(result.current).toMatchObject({ heldByOther: true, status: 'held by listener' })
    act(() => {
      arbiter.apply(set(0.3), { author: coach })
    })
    expect(result.current.status).toBe('held by listener')
    act(() => arbiter.clearHold(kickLevel))
    act(() => {
      arbiter.lock('strip:kick:level', { author: { id: 'rails', kind: 'system' } })
      arbiter.apply(set(0.2), { author: coach })
    })
    expect(result.current.status).toBe('locked by rails')
    act(() => arbiter.unlock('strip:kick:level'))
    expect(result.current.status).toBe('')
  })

  it('shows an agent pending on a free target (a lock lifted with a write still queued)', async () => {
    const { arbiter, wrapper } = await rig()
    const { result } = renderHook(() => useArbiterTarget('strip:pad:level'), { wrapper })
    act(() => {
      arbiter.touch('strip:pad', { id: 'x', kind: 'human' })
      arbiter.apply(
        { type: 'strip.set', owner: 'pad', param: 'level', value: 0.2 },
        { author: coach },
      )
    })
    expect(result.current.status).toBe('held by x')
    expect(result.current.pending).toHaveLength(1)
  })
})

describe('hooks write through the arbiter', () => {
  it('useTrack setters apply attributed operations; touch/release bracket the drag as one undo step', async () => {
    const { document, renderer, arbiter, wrapper, clock } = await rig()
    const { result } = renderHook(() => useTrack('kick'), { wrapper })
    expect(result.current.attributed).toBe(true)
    act(() => result.current.touch('level'))
    act(() => result.current.setLevel(0.5))
    act(() => result.current.setLevel(0.4))
    act(() => result.current.release('level'))
    await act(() => renderer.whenIdle())
    expect(
      document.log.entries.map((entry) => [entry.op.type, entry.author.kind, entry.gesture]),
    ).toEqual([
      ['strip.set', 'human', 'ui:kick:level#1'],
      ['strip.set', 'human', 'ui:kick:level#1'],
    ])
    expect(document.history.undoStack).toHaveLength(1)
    expect(result.current.level).toBe(0.4)
    const fader = result.current.strip.fader as unknown as MockGainNode
    expect(fader.gain.lastEvent('setTargetAtTime')?.args[0]).toBe(0.4)
    expect(arbiter.stateOf(kickLevel).hold?.touching).toBe(false)

    // A second drag is a second undo step.
    act(() => result.current.touch('level'))
    act(() => result.current.setLevel(0.6))
    act(() => result.current.release('level'))
    expect(document.history.undoStack).toHaveLength(2)
    expect(document.log.entries.at(-1)?.gesture).toBe('ui:kick:level#2')

    act(() => result.current.toggleMute())
    expect(document.log.entries.at(-1)?.op).toEqual({
      type: 'strip.mute',
      owner: 'kick',
      mute: true,
    })
    act(() => result.current.setSolo(true))
    expect(document.log.entries.at(-1)?.op).toEqual({
      type: 'strip.solo',
      owner: 'kick',
      solo: true,
    })
    act(() => result.current.setSoloSafe(true))
    expect(document.log.entries.at(-1)?.op).toEqual({
      type: 'strip.soloSafe',
      owner: 'kick',
      soloSafe: true,
    })

    // The coach cannot move the fader while the hand's hold runs.
    expect(arbiter.apply(set(0.1), { author: coach }).outcome).toBe('deferred')
    clock.ms = 10_000
    arbiter.tick()
    expect(findStripHost(document.score, 'kick')?.strip.level).toBe(0.1)
  })

  it('toggles flip the score value: quick repeats before the renderer catches up alternate', async () => {
    const { document, renderer, wrapper } = await rig()
    const { result } = renderHook(() => useTrack('kick'), { wrapper })
    const flags = (key: 'mute' | 'solo', count: number): unknown[] =>
      document.log.entries.slice(-count).map((entry) => (entry.op as Record<string, unknown>)[key])
    act(() => {
      result.current.toggleMute()
      result.current.toggleMute()
    })
    expect(flags('mute', 2)).toEqual([true, false])
    act(() => {
      result.current.toggleSolo()
      result.current.toggleSolo()
      result.current.toggleSolo()
    })
    expect(flags('solo', 3)).toEqual([true, false, true])
    await act(() => renderer.whenIdle())
    expect(result.current.mute).toBe(false)
    expect(result.current.solo).toBe(true)
  })

  it('a strip the score does not carry keeps writing the engine directly', async () => {
    const { engine, document, wrapper } = await rig()
    engine.addAudioTrack('extra')
    const { result } = renderHook(() => useTrack('extra'), { wrapper })
    expect(result.current.attributed).toBe(false)
    act(() => result.current.setLevel(0.5))
    expect(result.current.level).toBe(0.5)
    expect(document.log.length).toBe(0)
    act(() => result.current.touch('level'))
    act(() => result.current.release('level'))
  })

  it('useDeviceParam writes device.setParam for a device the renderer created', async () => {
    const { document, renderer, wrapper } = await rig()
    const verb = renderer.device('hall-verb')
    const { result } = renderHook(() => useDeviceParam(verb, 'wet'), { wrapper })
    expect(result.current.attributed).toBe(true)
    act(() => result.current.touch())
    act(() => result.current.set(0.6))
    act(() => result.current.release())
    expect(document.log.entries.at(-1)).toMatchObject({
      op: { type: 'device.setParam', device: 'hall-verb', param: 'wet', value: 0.6 },
      author: { kind: 'human' },
      gesture: 'ui:hall-verb:wet#1',
    })
    await act(() => renderer.whenIdle())
    expect(result.current.value).toBeCloseTo(0.6)
  })
})
