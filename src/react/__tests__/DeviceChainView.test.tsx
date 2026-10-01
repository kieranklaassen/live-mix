// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { type Device } from '../../core/devices/Device'
import { DEVICE_CATEGORIES } from '../../core/devices/registry'
import { DeviceChainView, groupDevices, reorderInserts } from '../components/DeviceChainView'
import { createTestEngine, type TestEngine } from './harness'

afterEach(cleanup)

async function chain(fixture: TestEngine, ids: string[]): Promise<Device[]> {
  const devices: Device[] = []
  for (const id of ids)
    devices.push(await fixture.engine.devices.create(id, fixture.engine.context))
  return devices
}

function panels(): string[] {
  return screen.getAllByRole('heading').map((heading) => heading.textContent ?? '')
}

const order = DEVICE_CATEGORIES.map((category) => category.label)

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

  it('leaves pinned inserts where they are and reorders a bus the same way', async () => {
    const fixture = createTestEngine()
    const master = fixture.engine.master
    const [a, b, c] = await chain(fixture, ['filter', 'eq3', 'delay'])
    for (const device of [a, b, c]) master.addInsert(device)
    reorderInserts(master, 2, 0, 1)
    reorderInserts(master, 0, 2, 1)
    expect(master.inserts).toEqual([a, b, c])
    reorderInserts(master, 2, 1, 1)
    expect(master.inserts).toEqual([a, c, b])
    expect(master.output).toBe(b.output)
  })
})

describe('groupDevices', () => {
  it('lists devices under their category in menu order and drops empty categories', () => {
    const fixture = createTestEngine()
    const groups = groupDevices(fixture.engine.devices.list())
    const labels = groups.map((group) => group.label)
    expect(labels).toEqual([...labels].sort((x, y) => order.indexOf(x) - order.indexOf(y)))
    expect(groups.every((group) => group.devices.length > 0)).toBe(true)
    expect(groups.flatMap((group) => group.devices)).toHaveLength(
      fixture.engine.devices.list().length,
    )
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
    expect(panels()).toEqual(['Filter', 'EQ Three'])
    expect(screen.getByRole('button', { name: 'Move filter earlier' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move eq3 later' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Move filter later' }))
    expect(pad.strip.inserts).toEqual([eq, filter])
    expect(panels()).toEqual(['EQ Three', 'Filter'])
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

  it('edits the master bus chain and follows changes made elsewhere', async () => {
    const fixture = createTestEngine()
    const master = fixture.engine.master
    const [filter, eq] = await chain(fixture, ['filter', 'eq3'])
    master.addInsert(filter)
    render(<DeviceChainView strip={master} data-testid="chain" />, { wrapper: fixture.wrapper })
    expect(screen.getByRole('list', { name: `${master.name} devices` })).toBeInTheDocument()
    expect(panels()).toEqual(['Filter'])
    act(() => master.addInsert(eq))
    expect(panels()).toEqual(['Filter', 'EQ Three'])
    fireEvent.click(screen.getByRole('button', { name: 'Move eq3 earlier' }))
    expect(master.inserts).toEqual([eq, filter])
    const picker = screen.getByRole('combobox', { name: 'Add device' })
    await act(async () => {
      fireEvent.change(picker, { target: { value: 'delay' } })
    })
    await waitFor(() =>
      expect(master.inserts.map((device) => device.id)).toEqual(['eq3', 'filter', 'delay']),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remove Filter' }))
    expect(master.inserts.map((device) => device.id)).toEqual(['eq3', 'delay'])
  })

  it('hides pinned inserts and keeps them first', async () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const [trim, filter, eq] = await chain(fixture, ['utility', 'filter', 'eq3'])
    for (const device of [trim, filter, eq]) pad.strip.addInsert(device)
    render(<DeviceChainView strip={pad} pinned={1} data-testid="chain" />, {
      wrapper: fixture.wrapper,
    })
    expect(panels()).toEqual(['Filter', 'EQ Three'])
    expect(screen.getByTestId('chain-item-0')).toHaveTextContent('Filter')
    expect(screen.getByRole('button', { name: 'Move filter earlier' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Move eq3 earlier' }))
    expect(pad.strip.inserts).toEqual([trim, eq, filter])
  })

  it('groups the picker by category, leaves instruments out and takes a filter', () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const { rerender } = render(<DeviceChainView strip={pad} />, { wrapper: fixture.wrapper })
    const picker = screen.getByRole('combobox', { name: 'Add device' })
    const groups = within(picker)
      .getAllByRole('group')
      .map((group) => group.getAttribute('label'))
    expect(groups).not.toContain('Instruments')
    expect(groups).toContain('EQ and filters')
    const instruments = fixture.engine.devices
      .list()
      .filter((descriptor) => descriptor.category === 'instrument')
    for (const instrument of instruments)
      expect(within(picker).queryByRole('option', { name: instrument.name })).toBeNull()

    rerender(
      <DeviceChainView
        strip={pad}
        addLabel="Add reverb…"
        filter={(descriptor) => descriptor.category === 'reverb'}
      />,
    )
    const reverbs = within(screen.getByRole('combobox', { name: 'Add device' })).getAllByRole(
      'option',
    )
    expect(reverbs[0]).toHaveTextContent('Add reverb…')
    expect(reverbs.length).toBeGreaterThan(1)
    expect(
      within(screen.getByRole('combobox', { name: 'Add device' })).getAllByRole('group'),
    ).toHaveLength(1)
  })
})
