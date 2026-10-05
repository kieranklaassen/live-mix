// @vitest-environment jsdom
// Two things a chain's move cell keeps, each found by a second reader of a change to it: a second
// tap whose finger slid a little while it was down still goes on with the device the first one
// moved (#138), and a step the arbiter holds back has its focus given back when it lands.
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MockAudioBuffer } from '../../testing'
import { type Device } from '../../core/devices/Device'
import { NODE_DEVICES } from '../../core/devices/native'
import { DeviceRegistry } from '../../core/devices/registry'
import { Arbiter } from '../../score/Arbiter'
import { loadScore } from '../../score/loadScore'
import { type Author } from '../../score/log'
import { ScoreDocument } from '../../score/ScoreDocument'
import { demoScore } from '../../score/__tests__/fixtures'
import { DeviceChainView } from '../components/DeviceChainView'
import { LiveMixProvider } from '../hooks/useEngine'
import { createTestEngine, type TestEngine } from './harness'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

async function chain(fixture: TestEngine, ids: string[]): Promise<Device[]> {
  const devices: Device[] = []
  for (const id of ids)
    devices.push(await fixture.engine.devices.create(id, fixture.engine.context))
  return devices
}

/** A browser takes the focus from an element that is taken out of the page and put in again; jsdom does not. */
function dropFocusOnMove(): void {
  for (const method of ['insertBefore', 'appendChild'] as const) {
    const put = Node.prototype[method] as (this: Node, ...nodes: Node[]) => Node
    vi.spyOn(Node.prototype, method).mockImplementation(function (this: Node, ...nodes: Node[]) {
      const active = document.activeElement
      if (nodes[0].isConnected && active instanceof HTMLElement && nodes[0].contains(active))
        active.blur()
      return put.apply(this, nodes)
    })
  }
}

describe('a move cell pressed again where the pointer is', () => {
  it('goes on with the device it moved when a finger wobbled 3 px while it was down for the second tap', async () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const [filter, eq, delay] = await chain(fixture, ['filter', 'eq3', 'delay'])
    for (const device of [filter, eq, delay]) pad.strip.addInsert(device)
    render(<DeviceChainView strip={pad} data-testid="chain" />, { wrapper: fixture.wrapper })
    const there = { detail: 1, clientX: 40, clientY: 10 }
    fireEvent.click(screen.getByRole('button', { name: 'Move filter later' }), there)
    expect(pad.strip.inserts).toEqual([eq, filter, delay])
    // The second tap, on the cell that slid under the finger: down, a wobble of 3 px (the kit's
    // PlateDisplay takes up to 4 px of a finger for "still"), up, and the click where the first was.
    const under = screen.getByRole('button', { name: 'Move eq3 later' })
    fireEvent.pointerDown(under, { pointerId: 2, pointerType: 'touch', clientX: 40, clientY: 10 })
    fireEvent.pointerMove(under, { pointerId: 2, pointerType: 'touch', clientX: 43, clientY: 10 })
    fireEvent.pointerUp(under, { pointerId: 2, pointerType: 'touch', clientX: 41, clientY: 10 })
    fireEvent.click(under, there)
    // Round seven: it is still the filter that is meant, not the neighbour sent back the way it came.
    expect(pad.strip.inserts).toEqual([eq, delay, filter])
  })
})

const agent: Author = { id: 'coach', kind: 'agent' }
const person: Author = { id: 'me', kind: 'human' }

describe('the focus of a move cell whose step the arbiter holds back', () => {
  it('is given back when the step lands, as before', async () => {
    const fixture = createTestEngine({ devices: new DeviceRegistry(NODE_DEVICES) })
    const buffer = new MockAudioBuffer(2, 48000 * 10, 48000) as unknown as AudioBuffer
    await fixture.engine.samples.load('a', buffer)
    await fixture.engine.samples.load('b', buffer)
    const clock = { ms: 0 }
    const score = new ScoreDocument(demoScore(), { now: () => clock.ms })
    const renderer = loadScore(fixture.engine, score, { onError: () => {} })
    await renderer.whenIdle()
    // The page's own writer is an agent here (a host that drives the kit as one): its writes wait
    // behind a person's hold. A policy with `onHeld: { human: 'defer' }` is the other way there.
    const arbiter = new Arbiter(score, {
      now: () => clock.ms,
      renderer,
      author: agent,
      setTimeoutFn: () => 0,
      clearTimeoutFn: () => {},
    })
    const wrapper = ({ children }: { children: ReactNode }): ReactNode =>
      createElement(
        LiveMixProvider,
        { engine: fixture.engine, frame: fixture.frames, arbiter },
        children,
      )
    const kick = fixture.engine.track('kick')
    render(createElement(DeviceChainView, { strip: kick, 'data-testid': 'chain' }), { wrapper })
    fireEvent.change(screen.getByRole('combobox', { name: 'Add device' }), {
      target: { value: 'delay' },
    })
    await act(() => renderer.whenIdle())
    await waitFor(() => expect(screen.getAllByRole('heading')).toHaveLength(2))
    dropFocusOnMove()

    // A person has a knob of the filter in hand: the agent's step of that device waits.
    act(() => {
      arbiter.touch({ kind: 'device', device: 'kick-filter', param: 'frequency' }, person)
    })
    const cell = screen.getByTestId('chain-later-0')
    cell.focus()
    const logged = score.log.entries.length
    fireEvent.click(cell)
    expect(score.log.entries).toHaveLength(logged)
    expect(arbiter.pending()).toHaveLength(1)

    // The hold ends, the step lands, the device is put in its new place and its cell loses the focus.
    clock.ms += 1_000
    act(() => {
      arbiter.clearHold({ kind: 'device', device: 'kick-filter', param: 'frequency' })
    })
    await act(() => renderer.whenIdle())
    expect(arbiter.pending()).toHaveLength(0)
    expect(kick.strip.inserts.map((device) => renderer.deviceIdFor(device))).toEqual([
      'delay-1',
      'kick-filter',
    ])
    // The focus is in the chain's move cells again (the cell itself, or the one beside it at the end).
    expect(document.activeElement).not.toBe(document.body)
    expect(document.activeElement?.matches('.lm-chain__move')).toBe(true)
  })
})
