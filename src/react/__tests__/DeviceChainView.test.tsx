// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { type Device } from '../../core/devices/Device'
import { DEVICE_CATEGORIES } from '../../core/devices/registry'
import {
  edgeScroll,
  labelPosition,
  landingIndex,
  markerInside,
  markerPosition,
} from '../components/chain-reorder'
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

describe('carrying a device along a chain', () => {
  // Three devices, 100 wide, 20 apart.
  const spans = [
    { left: 0, right: 100 },
    { left: 120, right: 220 },
    { left: 240, right: 340 },
  ]

  it('lands past a neighbour once the pointer is past its middle', () => {
    expect(landingIndex(spans, 0, 30)).toBe(0)
    expect(landingIndex(spans, 0, 169)).toBe(0)
    expect(landingIndex(spans, 0, 171)).toBe(1)
    expect(landingIndex(spans, 0, 291)).toBe(2)
    expect(landingIndex(spans, 2, 169)).toBe(1)
    expect(landingIndex(spans, 2, 49)).toBe(0)
    // Over its own place, wherever in it, it stays.
    expect(landingIndex(spans, 1, 125)).toBe(1)
    expect(landingIndex(spans, 1, 215)).toBe(1)
  })

  it('marks the middle of the gap it lands in, or the end of the chain it heads', () => {
    expect(markerPosition(spans, 0, 0)).toBeNull()
    expect(markerPosition(spans, 0, 1)).toBe(230)
    expect(markerPosition(spans, 0, 2)).toBe(340)
    expect(markerPosition(spans, 2, 1)).toBe(110)
    expect(markerPosition(spans, 2, 0)).toBe(0)
    expect(markerPosition([{ left: 0, right: 100 }], 0, 0)).toBeNull()
  })

  it('scrolls faster the nearer the pointer is to an end of the view, and not in the middle', () => {
    expect(edgeScroll(200, 0, 400)).toBe(0)
    expect(edgeScroll(36, 0, 400)).toBe(0)
    expect(edgeScroll(18, 0, 400)).toBe(-7)
    expect(edgeScroll(-50, 0, 400)).toBe(-14)
    expect(edgeScroll(382, 0, 400)).toBe(7)
    expect(edgeScroll(400, 0, 400)).toBe(14)
    expect(edgeScroll(10, 0, 0)).toBe(0)
  })

  it('keeps the carried name a little left of the pointer and inside the chain', () => {
    expect(labelPosition(150, 400, 80)).toBe(140)
    expect(labelPosition(4, 400, 80)).toBe(0)
    // At the far end it stops with its own end at the chain's: it never widens what scrolls.
    expect(labelPosition(395, 400, 80)).toBe(320)
    expect(labelPosition(900, 400, 80)).toBe(320)
    // A name wider than the chain starts at its head.
    expect(labelPosition(50, 60, 80)).toBe(0)
    // A chain that has not been laid out holds nothing back.
    expect(labelPosition(150, 0, 80)).toBe(140)
  })

  it('stands the marker whole inside the chain at either end', () => {
    expect(markerInside(230, 340)).toBe(230)
    expect(markerInside(0, 340)).toBe(4)
    expect(markerInside(340, 340)).toBe(336)
    // A chain that has not been laid out holds nothing back.
    expect(markerInside(340, 0)).toBe(340)
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

  /** jsdom lays nothing out: each device of the chain is given a place, 100 px wide, side by side. */
  function layOut(items: HTMLElement[]): void {
    items.forEach((item, index) => {
      item.getBoundingClientRect = () =>
        ({ left: index * 100, right: index * 100 + 100, top: 0, bottom: 40 }) as DOMRect
    })
  }

  async function threeDevices() {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const devices = await chain(fixture, ['filter', 'eq3', 'delay'])
    for (const device of devices) pad.strip.addInsert(device)
    render(<DeviceChainView strip={pad} data-testid="chain" />, { wrapper: fixture.wrapper })
    const items = [0, 1, 2].map((index) => screen.getByTestId(`chain-item-${index}`))
    layOut(items)
    const titles = items.map((item) => within(item).getByRole('heading'))
    return { pad, devices, items, titles }
  }

  it('carries a device by its title bar to the gap the marker stands in', async () => {
    const { pad, devices, items, titles } = await threeDevices()
    const [filter, eq, delay] = devices
    fireEvent.pointerDown(titles[2], { pointerId: 1, button: 0, clientX: 220 })
    // Under the slop it is still a press: nothing is carried yet.
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 218 })
    expect(screen.queryByTestId('chain-carried')).toBeNull()
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 130 })
    expect(items[2]).toHaveClass('lm-chain__item--dragging')
    expect(screen.getByTestId('chain-carried')).toHaveTextContent('Delay')
    expect(screen.getByTestId('chain-carried').style.transform).toBe('translateX(120px)')
    // Short of the middle device's middle it would stay where it is: no marker.
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 160 })
    expect(screen.queryByTestId('chain-marker')).toBeNull()
    // Past it, the gap between the first two.
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 130 })
    expect(screen.getByTestId('chain-marker').style.left).toBe('100px')
    // Past the first one's middle, the head of the chain.
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 20 })
    expect(screen.getByTestId('chain-marker').style.left).toBe('0px')
    expect(pad.strip.inserts).toEqual([filter, eq, delay])
    fireEvent.pointerUp(window, { pointerId: 1 })
    expect(pad.strip.inserts).toEqual([delay, filter, eq])
    expect(screen.queryByTestId('chain-marker')).toBeNull()
    expect(screen.queryByTestId('chain-carried')).toBeNull()
    expect(document.querySelector('.lm-chain__item--dragging')).toBeNull()
  })

  it('carries a device towards the end, and Escape leaves it where it was', async () => {
    const { pad, devices, titles } = await threeDevices()
    const [filter, eq, delay] = devices
    fireEvent.pointerDown(titles[0], { pointerId: 1, button: 0, clientX: 20 })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 290 })
    // After the last device: the marker is at the end of the chain.
    expect(screen.getByTestId('chain-marker').style.left).toBe('300px')
    const heard = vi.fn()
    document.body.addEventListener('keydown', heard)
    fireEvent.keyDown(document.body, { key: 'Escape' })
    document.body.removeEventListener('keydown', heard)
    // The key was the carry's: nothing else heard it.
    expect(heard).not.toHaveBeenCalled()
    expect(screen.queryByTestId('chain-marker')).toBeNull()
    fireEvent.pointerUp(window, { pointerId: 1 })
    expect(pad.strip.inserts).toEqual([filter, eq, delay])

    fireEvent.pointerDown(titles[0], { pointerId: 2, button: 0, clientX: 20 })
    fireEvent.pointerMove(window, { pointerId: 2, clientX: 160 })
    expect(screen.getByTestId('chain-marker').style.left).toBe('200px')
    fireEvent.pointerUp(window, { pointerId: 2 })
    expect(pad.strip.inserts).toEqual([eq, filter, delay])
  })

  it('keeps the click that ends a carry from pressing what is under the pointer', async () => {
    const { pad, devices, items, titles } = await threeDevices()
    const [filter, eq, delay] = devices
    const later = () => screen.getByRole('button', { name: 'Move eq3 later' })
    fireEvent.pointerDown(titles[0], { pointerId: 1, button: 0, clientX: 20 })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 160 })
    fireEvent.pointerUp(window, { pointerId: 1 })
    expect(pad.strip.inserts).toEqual([eq, filter, delay])
    // The click of that same button going up: it lands on nothing.
    expect(fireEvent.click(later())).toBe(false)
    expect(pad.strip.inserts).toEqual([eq, filter, delay])
    // The next click is a click.
    fireEvent.click(later())
    expect(pad.strip.inserts).toEqual([filter, eq, delay])

    // A carry left with Escape still has the button down: its click comes when that goes up.
    layOut(items)
    fireEvent.pointerDown(titles[0], { pointerId: 2, button: 0, clientX: 20 })
    fireEvent.pointerMove(window, { pointerId: 2, clientX: 160 })
    fireEvent.keyDown(document.body, { key: 'Escape' })
    fireEvent.pointerUp(window, { pointerId: 2 })
    expect(fireEvent.click(later())).toBe(false)
    expect(pad.strip.inserts).toEqual([filter, eq, delay])
  })

  it('does not hold on to a click that never comes, and leaves a plain press its click', async () => {
    const { pad, devices, items, titles } = await threeDevices()
    const [filter, eq, delay] = devices
    const later = () => screen.getByRole('button', { name: 'Move eq3 later' })
    fireEvent.pointerDown(titles[0], { pointerId: 1, button: 0, clientX: 20 })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 160 })
    fireEvent.pointerUp(window, { pointerId: 1 })
    expect(pad.strip.inserts).toEqual([eq, filter, delay])
    // The button went up where no click followed (outside the window): a later click is its own.
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)))
    fireEvent.click(later())
    expect(pad.strip.inserts).toEqual([filter, eq, delay])

    // A press on a title bar that never became a carry swallows nothing.
    fireEvent.pointerDown(titles[0], { pointerId: 2, button: 0, clientX: 20 })
    fireEvent.pointerUp(window, { pointerId: 2 })
    fireEvent.click(later())
    expect(pad.strip.inserts).toEqual([filter, delay, eq])

    // Escape, and then a new press: the button went up unseen, so that press keeps its click.
    layOut([items[0], items[2], items[1]])
    fireEvent.pointerDown(titles[0], { pointerId: 3, button: 0, clientX: 20 })
    fireEvent.pointerMove(window, { pointerId: 3, clientX: 160 })
    fireEvent.keyDown(document.body, { key: 'Escape' })
    const earlier = screen.getByRole('button', { name: 'Move eq3 earlier' })
    fireEvent.pointerDown(earlier, { pointerId: 4, button: 0, clientX: 280 })
    fireEvent.pointerUp(window, { pointerId: 4 })
    fireEvent.click(earlier)
    expect(pad.strip.inserts).toEqual([filter, eq, delay])
  })

  it('keeps a moved device its own panel: the panel is not drawn anew in its new place', async () => {
    const { pad, devices, items, titles } = await threeDevices()
    const [filter, eq, delay] = devices
    fireEvent.pointerDown(titles[0], { pointerId: 1, button: 0, clientX: 20 })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 290 })
    fireEvent.pointerUp(window, { pointerId: 1 })
    expect(pad.strip.inserts).toEqual([eq, delay, filter])
    // The same three elements, in their new order.
    expect(screen.getByTestId('chain-item-2')).toBe(items[0])
    expect(screen.getByTestId('chain-item-0')).toBe(items[1])
    expect(screen.getByTestId('chain-item-1')).toBe(items[2])
    expect(titles[0]).toBeInTheDocument()
  })

  it('scrolls a long chain under a pointer held at its end, and stops where the chain ends', async () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (frame: FrameRequestCallback) => frames.push(frame))
    vi.stubGlobal('cancelAnimationFrame', () => {})
    // The carried name is 80 wide.
    const width = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(80)
    try {
      const { pad, devices, titles } = await threeDevices()
      const [filter, eq, delay] = devices
      // The chain shows 200 of its 300 px, and scrolls itself.
      const view = screen.getByTestId('chain')
      let scrolled = 0
      Object.defineProperties(view, {
        scrollWidth: { get: () => 300 },
        clientWidth: { get: () => 200 },
        scrollLeft: { get: () => scrolled, set: (value: number) => void (scrolled = value) },
      })
      view.style.overflowX = 'auto'
      view.getBoundingClientRect = () => ({ left: 0, right: 200, top: 0, bottom: 40 }) as DOMRect

      fireEvent.pointerDown(titles[0], { pointerId: 1, button: 0, clientX: 20 })
      fireEvent.pointerMove(window, { pointerId: 1, clientX: 198 })
      // Still for longer than the chain is long: every frame scrolls it on.
      for (let frame = 0; frame < 40; frame += 1) act(() => frames.shift()?.(0))
      expect(scrolled).toBe(100)
      // The name stops with its end at the chain's end, so it never adds to what scrolls.
      expect(screen.getByTestId('chain-carried').style.transform).toBe('translateX(220px)')
      // Under the still pointer there is now the end of the chain, and the marker stands inside it.
      expect(screen.getByTestId('chain-marker').style.left).toBe('296px')
      fireEvent.pointerUp(window, { pointerId: 1 })
      expect(pad.strip.inserts).toEqual([eq, delay, filter])
    } finally {
      width.mockRestore()
      vi.unstubAllGlobals()
    }
  })

  it('takes a device by its grip, and leaves a press on a control to the control', async () => {
    const { pad, devices, items } = await threeDevices()
    const [filter, eq, delay] = devices
    // A button of the title bar is not a place to take the device by.
    fireEvent.pointerDown(within(items[0]).getByRole('button', { name: 'Move filter later' }), {
      pointerId: 1,
      button: 0,
      clientX: 80,
    })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 290 })
    fireEvent.pointerUp(window, { pointerId: 1 })
    // Nor is a knob.
    fireEvent.pointerDown(within(items[0]).getAllByRole('slider')[0], {
      pointerId: 1,
      button: 0,
      clientX: 50,
    })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 290 })
    fireEvent.pointerUp(window, { pointerId: 1 })
    expect(pad.strip.inserts).toEqual([filter, eq, delay])
    expect(screen.queryByTestId('chain-carried')).toBeNull()
    // The grip at its left is.
    fireEvent.pointerDown(within(items[0]).getByTitle('Drag to reorder'), {
      pointerId: 1,
      button: 0,
      clientX: 2,
    })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 290 })
    fireEvent.pointerUp(window, { pointerId: 1 })
    expect(pad.strip.inserts).toEqual([eq, delay, filter])
  })

  it('carries past pinned inserts as if they were not there', async () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const [trim, filter, eq] = await chain(fixture, ['utility', 'filter', 'eq3'])
    for (const device of [trim, filter, eq]) pad.strip.addInsert(device)
    render(<DeviceChainView strip={pad} pinned={1} data-testid="chain" />, {
      wrapper: fixture.wrapper,
    })
    const items = [0, 1].map((index) => screen.getByTestId(`chain-item-${index}`))
    layOut(items)
    fireEvent.pointerDown(within(items[1]).getByRole('heading'), {
      pointerId: 1,
      button: 0,
      clientX: 120,
    })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 10 })
    fireEvent.pointerUp(window, { pointerId: 1 })
    expect(pad.strip.inserts).toEqual([trim, eq, filter])
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
