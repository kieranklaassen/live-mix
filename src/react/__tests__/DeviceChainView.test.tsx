// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { type Device } from '../../core/devices/Device'
import { DEVICE_CATEGORIES } from '../../core/devices/registry'
import {
  armedEnds,
  carryScrollMin,
  chainDropIndex,
  dropIndex,
  dropMarkerPosition,
  edgeScroll,
  labelPosition,
  landingIndex,
  markerInside,
  markerPosition,
} from '../components/chain-reorder'
import { DeviceChainView, groupDevices, reorderInserts } from '../components/DeviceChainView'
import { deviceSkin } from '../components/device-skins'
import { createTestEngine, type TestEngine } from './harness'

// jsdom's own `URL` is not one `fileURLToPath` takes: the path is joined instead.
const stylesheet = join(dirname(fileURLToPath(import.meta.url)), '..', 'styles.css')

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

  it('scrolls a carry back no further than the chain\u2019s own start, or than the view already stood', () => {
    // The chain starts 300 px into what its scroller holds: the carry goes back to there.
    expect(carryScrollMin(300, 400)).toBe(300)
    // A view that already showed what comes before the chain shows no more of it.
    expect(carryScrollMin(300, 120)).toBe(120)
    // A chain that is all its scroller holds goes back to its start.
    expect(carryScrollMin(0, 250)).toBe(0)
    expect(carryScrollMin(-8, 250)).toBe(0)
  })

  it('arms an end of the view once the pointer goes on toward it, or has been clear of it', () => {
    const none = { near: false, far: false }
    // Taken at the near end and not moved toward it: only the far end may scroll.
    expect(armedEnds(none, -7, 20, 20)).toEqual({ near: false, far: true })
    expect(armedEnds(none, -7, 26, 20)).toEqual({ near: false, far: true })
    // Gone on toward the near end from where it was taken.
    expect(armedEnds(none, -9, 14, 20)).toEqual({ near: true, far: true })
    // Taken at the far end: the same the other way round.
    expect(armedEnds(none, 7, 380, 384)).toEqual({ near: true, far: false })
    expect(armedEnds(none, 9, 390, 384)).toEqual({ near: true, far: true })
    // Clear of both ends arms both, and an end stays armed.
    expect(armedEnds(none, 0, 200, 20)).toEqual({ near: true, far: true })
    const both = { near: true, far: true }
    expect(armedEnds(both, -7, 26, 20)).toBe(both)
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

describe('carrying something into a chain from outside', () => {
  // Three devices, 100 wide, 20 apart.
  const spans = [
    { left: 0, right: 100 },
    { left: 120, right: 220 },
    { left: 240, right: 340 },
  ]

  it('lands after every device whose middle the pointer is past', () => {
    expect(dropIndex(spans, -20)).toBe(0)
    expect(dropIndex(spans, 49)).toBe(0)
    expect(dropIndex(spans, 51)).toBe(1)
    // Over a gap it is the gap's own place.
    expect(dropIndex(spans, 110)).toBe(1)
    expect(dropIndex(spans, 169)).toBe(1)
    expect(dropIndex(spans, 171)).toBe(2)
    expect(dropIndex(spans, 289)).toBe(2)
    expect(dropIndex(spans, 291)).toBe(3)
    expect(dropIndex(spans, 900)).toBe(3)
    // A chain with no device has one place.
    expect(dropIndex([], 120)).toBe(0)
  })

  it('marks the middle of the gap it lands in, or the end of the chain it heads or ends', () => {
    expect(dropMarkerPosition(spans, 0)).toBe(0)
    expect(dropMarkerPosition(spans, 1)).toBe(110)
    expect(dropMarkerPosition(spans, 2)).toBe(230)
    expect(dropMarkerPosition(spans, 3)).toBe(340)
    // A place past either end is that end.
    expect(dropMarkerPosition(spans, -2)).toBe(0)
    expect(dropMarkerPosition(spans, 9)).toBe(340)
    expect(dropMarkerPosition([{ left: 20, right: 120 }], 0)).toBe(20)
    expect(dropMarkerPosition([{ left: 20, right: 120 }], 1)).toBe(120)
    // No device, no gap to mark.
    expect(dropMarkerPosition([], 0)).toBeNull()
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
    const { rerender } = render(<DeviceChainView strip={pad} data-testid="chain" />, {
      wrapper: fixture.wrapper,
    })
    const items = [0, 1, 2].map((index) => screen.getByTestId(`chain-item-${index}`))
    layOut(items)
    const titles = items.map((item) => within(item).getByRole('heading'))
    return { pad, devices, items, titles, rerender }
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

  /**
   * A browser takes the focus from what is inside a node that is put in
   * another place of the page; jsdom leaves it. Here it is taken, as a browser does.
   */
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

  it('leaves the focus on the move cell that was pressed, so the next press moves the device on', async () => {
    const { pad, devices } = await threeDevices()
    dropFocusOnMove()
    const [filter, eq, delay] = devices
    const later = screen.getByRole('button', { name: 'Move filter later' })
    later.focus()
    fireEvent.click(later)
    expect(pad.strip.inserts).toEqual([eq, filter, delay])
    // The device that moved is the one taken out of the page and put in again: its cell has the focus back.
    expect(later).toHaveFocus()
    fireEvent.click(later)
    expect(pad.strip.inserts).toEqual([eq, delay, filter])
    // At the end there is no later: the focus goes to the cell beside it, which still moves the device.
    expect(later).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move filter earlier' })).toHaveFocus()

    const earlier = screen.getByRole('button', { name: 'Move delay earlier' })
    earlier.focus()
    fireEvent.click(earlier)
    expect(pad.strip.inserts).toEqual([delay, eq, filter])
    expect(earlier).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move delay later' })).toHaveFocus()
  })

  it('takes no focus for a move cell pressed without it, nor from what took the focus meanwhile', async () => {
    const { pad, devices } = await threeDevices()
    dropFocusOnMove()
    const [filter, eq, delay] = devices
    // A press that left the focus where it was (a browser that gives a pressed button none).
    const knob = screen.getAllByRole('slider')[0]
    knob.focus()
    fireEvent.click(screen.getByRole('button', { name: 'Move filter later' }))
    expect(pad.strip.inserts).toEqual([eq, filter, delay])
    expect(knob).toHaveFocus()
  })

  it('gives the focus back on a plate too, whose tools are not drawn once the focus is gone', async () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const [filter, eq, delay] = await chain(fixture, ['filter', 'eq3', 'delay'])
    for (const device of [filter, eq, delay]) pad.strip.addInsert(device)
    render(<DeviceChainView strip={pad} skin={deviceSkin} data-testid="chain" />, {
      wrapper: fixture.wrapper,
    })
    layOut([0, 1, 2].map((index) => screen.getByTestId(`chain-item-${index}`)))
    dropFocusOnMove()
    // The stylesheet's rule, which jsdom does not read: a plate draws its tools while it holds
    // the focus, is open or in hand, or says so for a refocus, and what is not drawn takes no focus.
    const css = await readFile(stylesheet, 'utf8')
    expect(css).toContain('.lm-plate[data-lm-refocus] .lm-plate__tools')
    expect(css).toContain(
      ':is(.lm-plate--display, .lm-plate--plain)[data-lm-refocus] .lm-plate__tools--above',
    )
    const focus = HTMLElement.prototype.focus
    vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(function (
      this: HTMLElement,
      options?: FocusOptions,
    ) {
      const plate = this.closest('.lm-plate')
      const drawn =
        !this.closest('.lm-plate__tools') ||
        !plate ||
        plate.contains(document.activeElement) ||
        plate.matches('.lm-plate--open, .lm-plate--held, [data-lm-refocus]')
      if (drawn) focus.call(this, options)
    })
    const later = screen.getByRole('button', { name: 'Move filter later' })
    // Reached by Tab from a knob of the plate: the plate holds the focus, so its tools are drawn.
    within(screen.getByTestId('chain-device-0')).getAllByRole('slider')[0].focus()
    later.focus()
    expect(later).toHaveFocus()
    fireEvent.click(later)
    expect(pad.strip.inserts).toEqual([eq, filter, delay])
    expect(later).toHaveFocus()
    // The plate says so only for that moment.
    expect(later.closest('.lm-plate')).not.toHaveAttribute('data-lm-refocus')
    fireEvent.click(later)
    expect(pad.strip.inserts).toEqual([eq, delay, filter])
    expect(screen.getByRole('button', { name: 'Move filter earlier' })).toHaveFocus()
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

  /**
   * The chain in a bar that scrolls and holds 300 px of other things before
   * it: 600 px of content in a view of 200, scrolled to its end, so the chain's
   * last two devices show. What is returned reads and sets how far the bar is.
   */
  function inABar(items: HTMLElement[]) {
    const view = screen.getByTestId('chain')
    const bar = view.parentElement
    if (!bar) throw new Error('the chain stands in nothing')
    let scrolled = 400
    Object.defineProperties(bar, {
      scrollWidth: { get: () => 600 },
      clientWidth: { get: () => 200 },
      scrollLeft: { get: () => scrolled, set: (value: number) => void (scrolled = value) },
    })
    bar.style.overflowX = 'auto'
    bar.getBoundingClientRect = () => ({ left: 0, right: 200, top: 0, bottom: 40 }) as DOMRect
    // The chain is as wide as its three devices and scrolls nothing itself.
    Object.defineProperties(view, {
      scrollWidth: { get: () => 300 },
      clientWidth: { get: () => 300 },
    })
    view.getBoundingClientRect = () =>
      ({ left: 300 - scrolled, right: 600 - scrolled, top: 0, bottom: 40 }) as DOMRect
    items.forEach((item, index) => {
      item.getBoundingClientRect = () =>
        ({
          left: 300 + index * 100 - scrolled,
          right: 400 + index * 100 - scrolled,
          top: 0,
          bottom: 40,
        }) as DOMRect
    })
    return { at: () => scrolled }
  }

  it('scrolls back under a carry to the chain\u2019s first device, not into what its bar holds before the chain', async () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (frame: FrameRequestCallback) => frames.push(frame))
    vi.stubGlobal('cancelAnimationFrame', () => {})
    try {
      const { pad, devices, items, titles } = await threeDevices()
      const [filter, eq, delay] = devices
      const bar = inABar(items)
      // The last device, taken in the middle of the view and held at the view's near edge.
      fireEvent.pointerDown(titles[2], { pointerId: 1, button: 0, clientX: 150 })
      fireEvent.pointerMove(window, { pointerId: 1, clientX: 2 })
      for (let frame = 0; frame < 60; frame += 1) act(() => frames.shift()?.(0))
      // The bar stops with the chain's start at its edge: the first device is what shows there.
      expect(bar.at()).toBe(300)
      expect(screen.getByTestId('chain-marker').style.left).toBe('4px')
      fireEvent.pointerUp(window, { pointerId: 1 })
      expect(pad.strip.inserts).toEqual([delay, filter, eq])
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('leaves the chain where it is when a device is taken at the view\u2019s edge and carried away from it', async () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (frame: FrameRequestCallback) => frames.push(frame))
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const run = (count: number) => {
      for (let frame = 0; frame < count; frame += 1) act(() => frames.shift()?.(0))
    }
    try {
      const { items, titles } = await threeDevices()
      const bar = inABar(items)
      // The second device stands at the view's near edge and is taken by its first few px.
      fireEvent.pointerDown(titles[1], { pointerId: 1, button: 0, clientX: 10 })
      fireEvent.pointerMove(window, { pointerId: 1, clientX: 16 })
      run(10)
      expect(screen.getByTestId('chain-carried')).toBeInTheDocument()
      expect(bar.at()).toBe(400)
      // Clear of that edge and back at it: now the pointer is asking for more of the chain.
      fireEvent.pointerMove(window, { pointerId: 1, clientX: 100 })
      run(2)
      expect(bar.at()).toBe(400)
      fireEvent.pointerMove(window, { pointerId: 1, clientX: 10 })
      run(3)
      expect(bar.at()).toBeLessThan(400)
      fireEvent.pointerUp(window, { pointerId: 1 })

      // Taken at the edge and carried on toward it, the chain scrolls from the start.
      fireEvent.pointerDown(titles[1], { pointerId: 2, button: 0, clientX: 20 })
      const before = bar.at()
      fireEvent.pointerMove(window, { pointerId: 2, clientX: 14 })
      run(3)
      expect(bar.at()).toBeLessThan(before)
      fireEvent.pointerUp(window, { pointerId: 2 })
    } finally {
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

  it('lets go without pressing the control the pointer landed on', async () => {
    const { pad, devices, titles } = await threeDevices()
    const [filter, eq, delay] = devices
    fireEvent.pointerDown(titles[0], { pointerId: 1, button: 0, clientX: 20 })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 290 })
    fireEvent.pointerUp(window, { pointerId: 1 })
    expect(pad.strip.inserts).toEqual([eq, delay, filter])
    // The click the browser sends after the drop is the carry's, not a press on what is under it.
    const later = screen.getByRole('button', { name: 'Move eq3 later' })
    fireEvent.click(later)
    expect(pad.strip.inserts).toEqual([eq, delay, filter])
    // The press after that is heard as ever.
    fireEvent.click(later)
    expect(pad.strip.inserts).toEqual([delay, eq, filter])
  })

  it('keeps the carried name inside what the chain scrolls', async () => {
    const { titles } = await threeDevices()
    // jsdom lays nothing out: the chain is made a scroller of 300 px of content in a 150 px view.
    const element = screen.getByTestId('chain')
    Object.defineProperty(element, 'scrollWidth', { value: 300 })
    Object.defineProperty(element, 'clientWidth', { value: 150 })
    element.style.overflowX = 'auto'
    fireEvent.pointerDown(titles[0], { pointerId: 1, button: 0, clientX: 20 })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 290 })
    const carried = screen.getByTestId('chain-carried')
    Object.defineProperty(carried, 'offsetWidth', { value: 80 })
    // Past the end of the content the name would be more for the chain to scroll.
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 291 })
    expect(carried.style.transform).toBe('translateX(220px)')
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

  it('reads the place a pointer from outside is over off the devices it shows', async () => {
    const { pad, rerender } = await threeDevices()
    const view = screen.getByTestId('chain')
    expect(chainDropIndex(view, -40)).toBe(0)
    expect(chainDropIndex(view, 49)).toBe(0)
    expect(chainDropIndex(view, 51)).toBe(1)
    expect(chainDropIndex(view, 249)).toBe(2)
    expect(chainDropIndex(view, 251)).toBe(3)
    // The marker and the add cell are no devices: with them drawn the places are the same.
    rerender(<DeviceChainView strip={pad} dropAt={1} data-testid="chain" />)
    expect(screen.getByTestId('chain-marker')).toBeInTheDocument()
    expect(chainDropIndex(view, 151)).toBe(2)
    expect(chainDropIndex(view, 900)).toBe(3)
  })

  it('stands its marker in the gap something carried in from outside would land in', async () => {
    const { pad, rerender } = await threeDevices()
    const view = screen.getByTestId('chain')
    expect(screen.queryByTestId('chain-marker')).toBeNull()
    expect(view).not.toHaveClass('lm-chain--receiving')
    const markerAt = (dropAt: number | null | undefined): string | null => {
      rerender(<DeviceChainView strip={pad} dropAt={dropAt} data-testid="chain" />)
      return screen.queryByTestId('chain-marker')?.style.left ?? null
    }
    // At the head of the chain, in a gap, at its end.
    expect(markerAt(0)).toBe('0px')
    expect(view).toHaveClass('lm-chain--receiving')
    expect(screen.getByTestId('chain-marker')).toHaveClass('lm-chain__marker')
    expect(markerAt(1)).toBe('100px')
    expect(markerAt(2)).toBe('200px')
    expect(markerAt(3)).toBe('300px')
    // A place past the last device is the end of the chain.
    expect(markerAt(9)).toBe('300px')
    expect(markerAt(-1)).toBe('0px')
    // The devices are still the chain's only items, and nothing was moved.
    expect(view.querySelectorAll(':scope > .lm-chain__item')).toHaveLength(3)
    expect(pad.strip.inserts.map((device) => device.id)).toEqual(['filter', 'eq3', 'delay'])
    // Nothing carried, no marker.
    expect(markerAt(null)).toBeNull()
    expect(view).not.toHaveClass('lm-chain--receiving')
    expect(markerAt(2)).toBe('200px')
    expect(markerAt(undefined)).toBeNull()
  })

  it('places that marker from its own left edge, whole inside either end, wherever it has scrolled', async () => {
    const { pad, items, rerender } = await threeDevices()
    // The chain stands 40 px into the window behind a 1 px border and scrolls 300 px of devices.
    const view = screen.getByTestId('chain')
    let scrolled = 0
    Object.defineProperties(view, {
      clientLeft: { get: () => 1 },
      scrollWidth: { get: () => 300 },
      scrollLeft: { get: () => scrolled },
    })
    view.getBoundingClientRect = () => ({ left: 40, right: 240, top: 0, bottom: 40 }) as DOMRect
    items.forEach((item, index) => {
      item.getBoundingClientRect = () => {
        const left = 41 + index * 100 - scrolled
        return { left, right: left + 100, top: 0, bottom: 40 } as DOMRect
      }
    })
    const markerAt = (dropAt: number): string => {
      rerender(<DeviceChainView strip={pad} dropAt={dropAt} data-testid="chain" />)
      return screen.getByTestId('chain-marker').style.left
    }
    expect(markerAt(1)).toBe('100px')
    expect(markerAt(0)).toBe('4px')
    expect(markerAt(3)).toBe('296px')
    // Scrolled, the same gap is the same place in what the chain scrolls.
    scrolled = 50
    expect(chainDropIndex(view, 45)).toBe(1)
    expect(markerAt(1)).toBe('100px')
    expect(markerAt(2)).toBe('200px')
  })

  it('gives the marker to a carry of its own for as long as that lasts', async () => {
    const { pad, devices, titles, rerender } = await threeDevices()
    rerender(<DeviceChainView strip={pad} dropAt={3} data-testid="chain" />)
    expect(screen.getByTestId('chain-marker').style.left).toBe('300px')
    fireEvent.pointerDown(titles[2], { pointerId: 1, button: 0, clientX: 220 })
    // Carried over its own place the device would stay: the chain shows no marker at all.
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 250 })
    expect(screen.getByTestId('chain-carried')).toHaveTextContent('Delay')
    expect(screen.queryByTestId('chain-marker')).toBeNull()
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 20 })
    expect(screen.getAllByTestId('chain-marker')).toHaveLength(1)
    expect(screen.getByTestId('chain-marker').style.left).toBe('0px')
    // Left with Escape, the marker is the outside one's again.
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(screen.getByTestId('chain-marker').style.left).toBe('300px')
    fireEvent.pointerUp(window, { pointerId: 1 })
    expect(pad.strip.inserts).toEqual(devices)
  })

  it('marks no gap in a chain that shows no device', async () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const [trim] = await chain(fixture, ['utility'])
    const { rerender } = render(<DeviceChainView strip={pad} dropAt={0} data-testid="chain" />, {
      wrapper: fixture.wrapper,
    })
    expect(screen.queryByTestId('chain-marker')).toBeNull()
    expect(chainDropIndex(screen.getByTestId('chain'), 500)).toBe(0)
    // Nor in one whose only insert is the host's own.
    act(() => pad.strip.addInsert(trim))
    rerender(<DeviceChainView strip={pad} pinned={1} dropAt={1} data-testid="chain" />)
    expect(screen.queryByTestId('chain-item-0')).toBeNull()
    expect(screen.queryByTestId('chain-marker')).toBeNull()
    expect(chainDropIndex(screen.getByTestId('chain'), 500)).toBe(0)
  })

  it('counts the place of what is carried in among the devices shown, past what is pinned', async () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const [trim, filter, eq] = await chain(fixture, ['utility', 'filter', 'eq3'])
    for (const device of [trim, filter, eq]) pad.strip.addInsert(device)
    const { rerender } = render(<DeviceChainView strip={pad} pinned={1} data-testid="chain" />, {
      wrapper: fixture.wrapper,
    })
    layOut([0, 1].map((index) => screen.getByTestId(`chain-item-${index}`)))
    const view = screen.getByTestId('chain')
    expect(chainDropIndex(view, 120)).toBe(1)
    expect(chainDropIndex(view, 400)).toBe(2)
    const markerAt = (dropAt: number): string => {
      rerender(<DeviceChainView strip={pad} pinned={1} dropAt={dropAt} data-testid="chain" />)
      return screen.getByTestId('chain-marker').style.left
    }
    // 0 is ahead of the first device shown, not ahead of the pinned one.
    expect(markerAt(0)).toBe('0px')
    expect(markerAt(1)).toBe('100px')
    expect(markerAt(2)).toBe('200px')
    // Two are shown: the third place is still the end.
    expect(markerAt(3)).toBe('200px')
  })

  it("draws a host's tool cells on each device, and leaves a press on one to the host", async () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const [trim, filter, eq] = await chain(fixture, ['utility', 'filter', 'eq3'])
    for (const device of [trim, filter, eq]) pad.strip.addInsert(device)
    const swap = vi.fn<(device: Device, index: number) => void>()
    render(
      <DeviceChainView
        strip={pad}
        pinned={1}
        // The second device shown is a plate, the first a panel.
        skin={(device) => (device === eq ? deviceSkin(device) : null)}
        deviceActions={(device, index) => (
          <button
            type="button"
            aria-label={`Swap ${device.id}`}
            onClick={() => swap(device, index)}
          >
            ⇄
          </button>
        )}
        data-testid="chain"
      />,
      { wrapper: fixture.wrapper },
    )
    const items = [0, 1].map((index) => screen.getByTestId(`chain-item-${index}`))
    layOut(items)
    expect(screen.getByTestId('chain-device-0')).toHaveClass('lm-device')
    expect(screen.getByTestId('chain-device-1')).toHaveClass('lm-plate')
    // After the two move cells and before the remove cell, on a panel and on a plate.
    for (const [index, id] of ['filter', 'eq3'].entries()) {
      const cells = within(items[index])
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label') ?? '')
      const at = cells.indexOf(`Swap ${id}`)
      expect(cells.slice(at - 2, at + 1)).toEqual([
        `Move ${id} earlier`,
        `Move ${id} later`,
        `Swap ${id}`,
      ])
      expect(cells[at + 1]).toMatch(/^Remove /)
    }
    // A press on one that moves is not a carry: the device stays, and nothing rides the chain.
    const cell = within(items[0]).getByRole('button', { name: 'Swap filter' })
    fireEvent.pointerDown(cell, { pointerId: 1, button: 0, clientX: 80 })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 190 })
    expect(screen.queryByTestId('chain-carried')).toBeNull()
    expect(screen.queryByTestId('chain-marker')).toBeNull()
    fireEvent.pointerUp(window, { pointerId: 1 })
    expect(pad.strip.inserts).toEqual([trim, filter, eq])
    // Its click is its own, with the device and its place among those shown.
    fireEvent.click(cell)
    expect(swap).toHaveBeenLastCalledWith(filter, 0)
    // On a plate, which is taken anywhere else on its face.
    const onPlate = within(items[1]).getByRole('button', { name: 'Swap eq3' })
    fireEvent.pointerDown(onPlate, { pointerId: 2, button: 0, clientX: 180 })
    fireEvent.pointerMove(window, { pointerId: 2, clientX: 10 })
    expect(screen.queryByTestId('chain-carried')).toBeNull()
    fireEvent.pointerUp(window, { pointerId: 2 })
    expect(pad.strip.inserts).toEqual([trim, filter, eq])
    fireEvent.click(onPlate)
    expect(swap).toHaveBeenLastCalledWith(eq, 1)
    expect(swap).toHaveBeenCalledTimes(2)
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
    // Each item says where its device sits in the strip's own chain, pinned ones counted.
    expect(screen.getByTestId('chain')).toHaveAttribute('data-lm-strip', 'pad')
    expect(screen.getByTestId('chain-item-0')).toHaveAttribute('data-lm-insert', '1')
    expect(screen.getByTestId('chain-item-1')).toHaveAttribute('data-lm-insert', '2')
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
