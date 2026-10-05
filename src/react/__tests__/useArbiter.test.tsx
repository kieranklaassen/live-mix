// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
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
import { ChannelRowView } from '../components/ChannelRowView'
import { DeviceChainView } from '../components/DeviceChainView'
import { demoScore } from '../../score/__tests__/fixtures'
import { useArbiter, useArbiterTarget } from '../hooks/useArbiter'
import { LiveMixProvider } from '../hooks/useEngine'
import { useDevice, useDeviceParam } from '../hooks/useParam'
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

  it('reads the arbiter it is given now, not the one before it at the same revision', async () => {
    const first = await rig()
    const second = await rig()
    first.arbiter.touch(kickLevel)
    second.arbiter.lock('strip:pad:level', { reason: 'test' })
    expect(first.arbiter.revision).toBe(second.arbiter.revision)
    const { result, rerender } = renderHook(({ arbiter }) => useArbiter(arbiter), {
      initialProps: { arbiter: first.arbiter },
    })
    expect(result.current.holds).toHaveLength(1)
    rerender({ arbiter: second.arbiter })
    expect(result.current.arbiter).toBe(second.arbiter)
    expect(result.current.holds).toEqual([])
    expect(result.current.locks).toMatchObject([{ target: 'strip:pad:level' }])
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

  it('reads the target it is given now, not the one before it', async () => {
    const { wrapper } = await rig()
    const { result, rerender } = renderHook(({ target }) => useArbiterTarget(target), {
      wrapper,
      initialProps: { target: 'strip:kick:level' },
    })
    act(() => result.current.touch())
    expect(result.current.status).toBe('held by you')
    // No arbiter event falls between the two renders: the revision does not tell them apart.
    rerender({ target: 'strip:pad:level' })
    expect(result.current.key).toBe('strip:pad:level')
    expect(result.current.status).toBe('')
    rerender({ target: 'strip:kick:level' })
    expect(result.current.status).toBe('held by you')
  })

  it('lets go of a target still in hand when it is given another, or leaves the page', async () => {
    const { arbiter, wrapper } = await rig()
    const { result, rerender, unmount } = renderHook(({ target }) => useArbiterTarget(target), {
      wrapper,
      initialProps: { target: 'strip:kick:level' },
    })
    act(() => result.current.touch())
    expect(arbiter.stateOf(kickLevel).hold?.touching).toBe(true)
    // The badge stands for another control now: the hand's pointer up will be told to that one.
    rerender({ target: 'strip:pad:level' })
    expect(arbiter.stateOf(kickLevel).hold?.touching).toBe(false)
    act(() => result.current.release())
    expect(arbiter.stateOf('strip:pad:level').hold).toBeNull()

    act(() => result.current.touch())
    expect(arbiter.stateOf('strip:pad:level').hold?.touching).toBe(true)
    unmount()
    expect(arbiter.stateOf('strip:pad:level').hold?.touching).toBe(false)
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

  it('useTrack lets go of a fader still in hand when another strip takes its place, or it leaves the page', async () => {
    const { arbiter, wrapper } = await rig()
    const { result, rerender, unmount } = renderHook(
      ({ name }: { name: string }) => useTrack(name),
      { wrapper, initialProps: { name: 'kick' } },
    )
    act(() => result.current.touch('level'))
    expect(arbiter.stateOf(kickLevel).hold?.touching).toBe(true)
    // The view shows another strip now: the hand's pointer up will be told to that one.
    rerender({ name: 'pad' })
    expect(arbiter.stateOf(kickLevel).hold?.touching).toBe(false)
    act(() => result.current.release('level'))
    expect(arbiter.stateOf(kickLevel).hold?.touching).toBe(false)

    act(() => result.current.touch('pan'))
    expect(arbiter.stateOf('strip:pad:pan').hold?.touching).toBe(true)
    unmount()
    expect(arbiter.stateOf('strip:pad:pan').hold?.touching).toBe(false)
  })

  it('useTrack lets go of a fader whose track left the score while it was in hand', async () => {
    const { arbiter, document, wrapper } = await rig()
    const { result } = renderHook(() => useTrack('kick'), { wrapper })
    act(() => result.current.touch('level'))
    act(() => {
      arbiter.apply({ type: 'track.remove', id: 'kick' })
    })
    expect(findStripHost(document.score, 'kick')).toBeUndefined()
    act(() => result.current.release('level'))
    // Undo brings the track back: its fader is not held against the coach by a hand long gone.
    expect(arbiter.stateOf(kickLevel).hold?.touching ?? false).toBe(false)
  })

  it('a row given another strip in the middle of a move leaves neither fader held', async () => {
    const { arbiter, engine, wrapper } = await rig()
    const row = (name: string) =>
      createElement(ChannelRowView, { strip: engine.track(name), meter: false })
    const { rerender } = render(row('kick'), { wrapper })
    const fader = screen.getByRole('slider', { name: 'Level' })
    fireEvent.pointerDown(fader, { pointerId: 1, button: 0, clientX: 10, clientY: 0 })
    expect(arbiter.stateOf(kickLevel).hold?.touching).toBe(true)
    rerender(row('pad'))
    fireEvent.pointerUp(fader, { pointerId: 1 })
    expect(arbiter.stateOf(kickLevel).hold?.touching).toBe(false)
    expect(arbiter.stateOf('strip:pad:level').hold?.touching ?? false).toBe(false)
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

  it('useDevice lets go of knobs still in hand when another device takes its place, or it leaves the page', async () => {
    const { arbiter, renderer, wrapper } = await rig()
    const filter = renderer.device('kick-filter')
    const verb = renderer.device('hall-verb')
    const held = (device: string, param: string): boolean =>
      arbiter.stateOf({ kind: 'device', device, param }).hold?.touching ?? false
    const { result, rerender, unmount } = renderHook(
      ({ device }: { device: typeof filter }) => useDevice(device),
      { wrapper, initialProps: { device: filter } },
    )
    act(() => result.current.touch('frequency'))
    act(() => result.current.touchMany(['gain', 'q']))
    expect([held('kick-filter', 'frequency'), held('kick-filter', 'gain')]).toEqual([true, true])
    // The panel shows another device now: the pointer's up will be told to that one.
    rerender({ device: verb })
    expect(['frequency', 'gain', 'q'].map((param) => held('kick-filter', param))).toEqual([
      false,
      false,
      false,
    ])

    act(() => result.current.touch('wet'))
    expect(held('hall-verb', 'wet')).toBe(true)
    unmount()
    expect(held('hall-verb', 'wet')).toBe(false)
  })

  it('useDeviceParam lets go of its knob when it leaves the page in hand', async () => {
    const { arbiter, renderer, wrapper } = await rig()
    const verb = renderer.device('hall-verb')
    const { result, unmount } = renderHook(() => useDeviceParam(verb, 'wet'), { wrapper })
    act(() => result.current.touch())
    unmount()
    expect(
      arbiter.stateOf({ kind: 'device', device: 'hall-verb', param: 'wet' }).hold?.touching,
    ).toBe(false)
  })

  it('useDevice bypass, presets and reset are score operations for a score device', async () => {
    const { document, renderer, wrapper } = await rig()
    const filter = renderer.device('kick-filter')
    const { result } = renderHook(() => useDevice(filter), { wrapper })
    const scoreFilter = () =>
      findStripHost(document.score, 'kick')?.strip.inserts.find((d) => d.id === 'kick-filter')

    act(() => result.current.toggleBypass())
    expect(document.log.entries.at(-1)?.op).toEqual({
      type: 'device.bypass',
      device: 'kick-filter',
      bypass: true,
    })
    // A second toggle before the renderer has caught up flips the score's value back.
    act(() => result.current.toggleBypass())
    expect(scoreFilter()?.bypass).toBe(false)
    act(() => result.current.setBypass(true))
    await act(() => renderer.whenIdle())
    expect(filter.bypass).toBe(true)

    const preset = result.current.presets[0]
    let report = { applied: [] as string[], skipped: [] as string[] }
    act(() => {
      report = result.current.applyPreset({
        ...preset,
        params: { ...preset.params, notAParam: 1 },
      })
    })
    expect(report.skipped).toEqual(['notAParam'])
    expect(report.applied).toEqual(Object.keys(preset.params))
    expect(document.log.entries.at(-1)?.op).toEqual({
      type: 'device.setParams',
      device: 'kick-filter',
      params: preset.params,
    })

    act(() => result.current.setParam('gain', 6))
    await act(() => renderer.whenIdle())
    expect(filter.getParam('gain')).toBe(6)
    act(() => result.current.reset())
    expect(document.log.entries.at(-1)?.op).toMatchObject({
      type: 'device.setParams',
      device: 'kick-filter',
      params: { frequency: filter.params.frequency.default },
    })
    await act(() => renderer.whenIdle())
    // (The LFO route owns `frequency`, so the static value shows on another parameter.)
    expect(filter.getParam('gain')).toBe(filter.params.gain.default)
    // One undo step each: three bypass writes, the preset, the gain, the reset.
    expect(document.history.undoStack).toHaveLength(6)
  })

  it('DeviceChainView adds, moves and removes through the score when it carries the strip', async () => {
    const { document, engine, renderer, wrapper } = await rig()
    const kick = engine.track('kick')
    render(createElement(DeviceChainView, { strip: kick, 'data-testid': 'chain' }), { wrapper })
    const ids = () =>
      findStripHost(document.score, 'kick')?.strip.inserts.map((device) => device.id)
    expect(ids()).toEqual(['kick-filter'])

    const picker = screen.getByRole('combobox', { name: 'Add device' })
    fireEvent.change(picker, { target: { value: 'delay' } })
    expect(document.log.entries.at(-1)?.op).toEqual({
      type: 'device.add',
      owner: 'kick',
      device: { id: 'delay-1', deviceId: 'delay', params: {}, bypass: false },
    })
    fireEvent.change(picker, { target: { value: 'delay' } })
    expect(ids()).toEqual(['kick-filter', 'delay-1', 'delay-2'])
    // The renderer builds the chain; the view follows the strip.
    await act(() => renderer.whenIdle())
    await waitFor(() => expect(screen.getAllByRole('heading')).toHaveLength(3))
    expect(kick.strip.inserts[1]).toBe(renderer.device('delay-1'))

    fireEvent.click(screen.getByTestId('chain-earlier-2'))
    expect(document.log.entries.at(-1)?.op).toEqual({
      type: 'device.move',
      id: 'delay-2',
      index: 1,
    })
    // A second click before the renderer has caught up steps on from the slot
    // the score holds now, not back to the one the first click came from.
    fireEvent.click(screen.getByTestId('chain-earlier-2'))
    expect(document.log.entries.at(-1)?.op).toEqual({
      type: 'device.move',
      id: 'delay-2',
      index: 0,
    })
    act(() => {
      document.undo()
    })
    await act(() => renderer.whenIdle())
    expect(kick.strip.inserts.map((device) => renderer.deviceIdFor(device))).toEqual([
      'kick-filter',
      'delay-2',
      'delay-1',
    ])

    // Carried by its title bar past the last device: one move in the score, one undo step.
    const items = [0, 1, 2].map((index) => screen.getByTestId(`chain-item-${index}`))
    items.forEach((item, index) => {
      item.getBoundingClientRect = () =>
        ({ left: index * 100, right: index * 100 + 100, top: 0, bottom: 40 }) as DOMRect
    })
    const steps = document.history.undoStack.length
    fireEvent.pointerDown(within(items[0]).getByRole('heading'), {
      pointerId: 1,
      button: 0,
      clientX: 20,
    })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 290 })
    fireEvent.pointerUp(window, { pointerId: 1 })
    expect(document.log.entries.at(-1)?.op).toEqual({
      type: 'device.move',
      id: 'kick-filter',
      index: 2,
    })
    expect(document.history.undoStack).toHaveLength(steps + 1)
    act(() => {
      document.undo()
    })
    await act(() => renderer.whenIdle())

    fireEvent.click(screen.getAllByRole('button', { name: 'Remove Delay' })[0])
    expect(document.log.entries.at(-1)?.op).toEqual({ type: 'device.remove', id: 'delay-2' })
    await act(() => renderer.whenIdle())
    expect(kick.strip.inserts).toHaveLength(2)

    // Every edit is on the undo stack: back to the chain the score started with.
    act(() => {
      while (document.canUndo) document.undo()
    })
    await act(() => renderer.whenIdle())
    expect(ids()).toEqual(['kick-filter'])
    expect(kick.strip.inserts).toHaveLength(1)
  })

  it('DeviceChainView keeps no focus to give back for a step the score did not take', async () => {
    const { document, engine, renderer, wrapper } = await rig()
    const kick = engine.track('kick')
    render(createElement(DeviceChainView, { strip: kick, 'data-testid': 'chain' }), { wrapper })
    const picker = screen.getByRole('combobox', { name: 'Add device' })
    fireEvent.change(picker, { target: { value: 'delay' } })
    await act(() => renderer.whenIdle())
    await waitFor(() => expect(screen.getAllByRole('heading')).toHaveLength(2))
    // The filter goes to the chain's end; pressed again with the pointer where it was, it is
    // still the filter that is meant, and it has no further place.
    const still = { detail: 1, clientX: 40, clientY: 10 }
    fireEvent.click(screen.getByTestId('chain-later-0'), still)
    await act(() => renderer.whenIdle())
    const moves = document.log.entries.length
    const under = screen.getByTestId('chain-later-0')
    under.focus()
    fireEvent.click(under, still)
    expect(document.log.entries).toHaveLength(moves)
    // The focus goes to the page, and later the chain changes from elsewhere.
    under.blur()
    act(() => {
      document.undo()
    })
    await act(() => renderer.whenIdle())
    expect(kick.strip.inserts.map((device) => renderer.deviceIdFor(device))).toEqual([
      'kick-filter',
      'delay-1',
    ])
    expect(globalThis.document.activeElement).toBe(globalThis.document.body)
  })

  it('DeviceChainView never steps a device in front of a pinned insert the score holds', async () => {
    const { document, engine, renderer, wrapper } = await rig()
    const kick = engine.track('kick')
    render(createElement(DeviceChainView, { strip: kick, pinned: 1, 'data-testid': 'chain' }), {
      wrapper,
    })
    const ids = () =>
      findStripHost(document.score, 'kick')?.strip.inserts.map((device) => device.id)
    const picker = screen.getByRole('combobox', { name: 'Add device' })
    fireEvent.change(picker, { target: { value: 'delay' } })
    fireEvent.change(picker, { target: { value: 'delay' } })
    await act(() => renderer.whenIdle())
    await waitFor(() => expect(screen.getAllByRole('heading')).toHaveLength(2))
    expect(ids()).toEqual(['kick-filter', 'delay-1', 'delay-2'])

    // Two clicks before the renderer has caught up: the first steps the device
    // to the head of the movable part, the second has nowhere left to go.
    fireEvent.click(screen.getByTestId('chain-earlier-1'))
    fireEvent.click(screen.getByTestId('chain-earlier-1'))
    expect(ids()).toEqual(['kick-filter', 'delay-2', 'delay-1'])
    await act(() => renderer.whenIdle())
    expect(kick.strip.inserts.map((device) => renderer.deviceIdFor(device))).toEqual([
      'kick-filter',
      'delay-2',
      'delay-1',
    ])
  })
  it('DeviceChainView edits the master through the score and leaves hand-made inserts first', async () => {
    const { document, engine, renderer, wrapper } = await rig()
    render(
      createElement(DeviceChainView, { strip: engine.master, pinned: 0, 'data-testid': 'chain' }),
      { wrapper },
    )
    fireEvent.change(screen.getByRole('combobox', { name: 'Add device' }), {
      target: { value: 'eq3' },
    })
    expect(document.score.master.inserts.map((device) => device.id)).toEqual(['glue', 'eq3-1'])
    await act(() => renderer.whenIdle())
    expect(engine.master.inserts.map((device) => device.id)).toEqual(['compressor', 'eq3'])
  })

  it('DeviceChainView keeps writing the engine for a strip the score does not carry', async () => {
    const { document, engine, wrapper } = await rig()
    const extra = engine.addAudioTrack('extra')
    const before = document.log.length
    render(createElement(DeviceChainView, { strip: extra }), { wrapper })
    await act(async () => {
      fireEvent.change(screen.getByRole('combobox', { name: 'Add device' }), {
        target: { value: 'filter' },
      })
    })
    await waitFor(() => expect(extra.strip.inserts.map((d) => d.id)).toEqual(['filter']))
    expect(document.log.length).toBe(before)
  })
})
