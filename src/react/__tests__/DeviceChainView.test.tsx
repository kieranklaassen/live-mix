// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { type Device } from '../../core/devices/Device'
import { DeviceChainView, reorderInserts } from '../components/DeviceChainView'
import { createTestEngine, type TestEngine } from './harness'

afterEach(cleanup)

async function chain(fixture: TestEngine, ids: string[]): Promise<Device[]> {
  const devices: Device[] = []
  for (const id of ids)
    devices.push(await fixture.engine.devices.create(id, fixture.engine.context))
  return devices
}

function order(): string[] {
  return screen.getAllByRole('heading').map((heading) => heading.textContent ?? '')
}

describe('reorderInserts', () => {
  it('moves a device and keeps the graph wired input → inserts → pan', async () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const [a, b, c] = await chain(fixture, ['filter', 'eq3', 'delay'])
    for (const device of [a, b, c]) pad.strip.addInsert(device)
    reorderInserts(pad.strip, 2, 0)
    expect(pad.strip.inserts).toEqual([c, a, b])
    reorderInserts(pad.strip, 0, 1)
    expect(pad.strip.inserts).toEqual([a, c, b])
    reorderInserts(pad.strip, 1, 1)
    reorderInserts(pad.strip, 5, 0)
    expect(pad.strip.inserts).toEqual([a, c, b])
    const outputs = (device: Device) =>
      (device.output as unknown as { outputs: Set<unknown> }).outputs
    expect(outputs(a).has(c.input)).toBe(true)
    expect(outputs(c).has(b.input)).toBe(true)
    expect(outputs(b).has(pad.strip.panner)).toBe(true)
  })
})

describe('DeviceChainView', () => {
  it('renders a panel per insert with move buttons that reorder the strip', async () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const [filter, eq] = await chain(fixture, ['filter', 'eq3'])
    pad.strip.addInsert(filter)
    pad.strip.addInsert(eq)
    render(<DeviceChainView strip={pad} data-testid="chain" />, { wrapper: fixture.wrapper })
    expect(screen.getByRole('list', { name: 'pad devices' })).toBeInTheDocument()
    expect(order()).toEqual(['Filter', 'EQ Three'])
    expect(screen.getByRole('button', { name: 'Move filter earlier' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move eq3 later' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Move filter later' }))
    expect(pad.strip.inserts).toEqual([eq, filter])
    expect(order()).toEqual(['EQ Three', 'Filter'])
  })

  it('reorders by drag and drop', async () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const [filter, eq, delay] = await chain(fixture, ['filter', 'eq3', 'delay'])
    for (const device of [filter, eq, delay]) pad.strip.addInsert(device)
    render(<DeviceChainView strip={pad} data-testid="chain" />, { wrapper: fixture.wrapper })
    const items = screen.getAllByRole('listitem')
    const data = new Map<string, string>()
    const dataTransfer = {
      effectAllowed: 'move',
      dropEffect: 'move',
      setData: (type: string, value: string) => data.set(type, value),
      getData: (type: string) => data.get(type) ?? '',
    }
    fireEvent.dragStart(items[2], { dataTransfer })
    fireEvent.dragOver(items[0], { dataTransfer })
    expect(items[0]).toHaveClass('lm-chain__item--over')
    fireEvent.drop(items[0], { dataTransfer })
    expect(pad.strip.inserts).toEqual([delay, filter, eq])
    fireEvent.dragEnd(items[2])
    expect(
      screen.queryByText(
        (_, element) => element?.classList.contains('lm-chain__item--over') ?? false,
      ),
    ).toBeNull()
  })

  it('removes and disposes a device, or hands removal to the host', async () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const [filter, eq] = await chain(fixture, ['filter', 'eq3'])
    pad.strip.addInsert(filter)
    pad.strip.addInsert(eq)
    const dispose = vi.spyOn(filter, 'dispose')
    const { rerender } = render(<DeviceChainView strip={pad} />, { wrapper: fixture.wrapper })
    fireEvent.click(screen.getByRole('button', { name: 'Remove Filter' }))
    expect(pad.strip.inserts).toEqual([eq])
    expect(dispose).toHaveBeenCalledTimes(1)

    const onRemove = vi.fn()
    rerender(<DeviceChainView strip={pad} onRemove={onRemove} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove EQ Three' }))
    expect(onRemove).toHaveBeenCalledWith(eq, 0)
    expect(pad.strip.inserts).toEqual([eq])
  })

  it('adds a registry device into the chain from the picker', async () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    render(<DeviceChainView strip={pad} data-testid="chain" />, { wrapper: fixture.wrapper })
    const picker = screen.getByRole('combobox', { name: 'Add device' })
    const names = within(picker)
      .getAllByRole('option')
      .map((option) => option.textContent)
    expect(names).toContain('Filter')
    await act(async () => {
      fireEvent.change(picker, { target: { value: 'filter' } })
    })
    await waitFor(() => expect(pad.strip.inserts.map((device) => device.id)).toEqual(['filter']))
    expect(screen.getByRole('heading', { name: 'Filter' })).toBeInTheDocument()
  })

  it('tweaks a parameter through the panel inside the chain', async () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const [filter] = await chain(fixture, ['filter'])
    pad.strip.addInsert(filter)
    render(<DeviceChainView strip={pad.strip} showAdd={false} />, { wrapper: fixture.wrapper })
    expect(screen.queryByRole('combobox', { name: 'Add device' })).toBeNull()
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Gain' }), { key: 'End' })
    expect(filter.getParam('gain')).toBe(24)
  })
})
