// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Knob } from '../components/Knob'
import { forgetPresses } from '../components/presses'

afterEach(cleanup)

function slider(): HTMLElement {
  return screen.getByRole('slider')
}

function drag(
  element: HTMLElement,
  from: number,
  to: number,
  options: { shiftKey?: boolean } = {},
) {
  fireEvent.pointerDown(element, { pointerId: 1, button: 0, clientX: 0, clientY: from })
  fireEvent.pointerMove(element, { pointerId: 1, clientX: 0, clientY: to, ...options })
  fireEvent.pointerUp(element, { pointerId: 1 })
}

describe('Knob', () => {
  it('renders ARIA slider semantics, the label and the formatted value', () => {
    render(<Knob label="Cutoff" defaultValue={1000} min={20} max={20000} taper="log" unit="Hz" />)
    const control = slider()
    expect(control).toHaveAttribute('aria-label', 'Cutoff')
    expect(control).toHaveAttribute('aria-valuemin', '20')
    expect(control).toHaveAttribute('aria-valuemax', '20000')
    expect(control).toHaveAttribute('aria-valuenow', '1000')
    expect(control).toHaveAttribute('aria-valuetext', '1.00 kHz')
    expect(screen.getByText('Cutoff')).toHaveClass('lm-knob__label')
    expect(screen.getByText('1.00 kHz')).toHaveClass('lm-knob__value')
  })

  it('draws through --lm-* tokens only', () => {
    const { container } = render(<Knob label="Mix" defaultValue={0.5} min={0} max={1} />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    const strokes = [...(svg?.querySelectorAll('[stroke]') ?? [])].map((el) =>
      el.getAttribute('stroke'),
    )
    expect(strokes.length).toBeGreaterThan(2)
    for (const stroke of strokes) {
      if (stroke !== 'none') expect(stroke).toMatch(/^var\(--lm-/)
    }
  })

  it('steps with the keyboard: arrows, Shift for fine, PageUp/Down, Home/End', () => {
    const onChange = vi.fn()
    render(<Knob label="Mix" defaultValue={0.5} min={0} max={1} step={0.01} onChange={onChange} />)
    const control = slider()
    fireEvent.keyDown(control, { key: 'ArrowUp' })
    expect(onChange).toHaveBeenLastCalledWith(0.51)
    fireEvent.keyDown(control, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith(0.52)
    fireEvent.keyDown(control, { key: 'ArrowDown', shiftKey: true })
    expect(onChange).toHaveBeenLastCalledWith(0.519)
    // Coarse steps snap back to the step grid.
    fireEvent.keyDown(control, { key: 'PageUp' })
    expect(onChange).toHaveBeenLastCalledWith(0.62)
    fireEvent.keyDown(control, { key: 'Home' })
    expect(onChange).toHaveBeenLastCalledWith(0)
    fireEvent.keyDown(control, { key: 'End' })
    expect(onChange).toHaveBeenLastCalledWith(1)
    expect(control).toHaveAttribute('aria-valuenow', '1')
  })

  it('adds fine steps up on a knob whose value the host holds: ten are one whole step', () => {
    const seen: number[] = []
    function Host() {
      const [value, setValue] = useState(50)
      return (
        <Knob
          label="Depth"
          value={value}
          defaultValue={50}
          min={0}
          max={100}
          step={1}
          onChange={(next) => {
            seen.push(next)
            setValue(next)
          }}
        />
      )
    }
    render(<Host />)
    for (let press = 0; press < 3; press += 1)
      fireEvent.keyDown(slider(), { key: 'ArrowUp', shiftKey: true })
    expect(seen).toEqual([50.1, 50.2, 50.3])
    for (let press = 0; press < 7; press += 1)
      fireEvent.keyDown(slider(), { key: 'ArrowUp', shiftKey: true })
    expect(seen[seen.length - 1]).toBe(51)
    expect(slider()).toHaveAttribute('aria-valuenow', '51')
    for (let press = 0; press < 3; press += 1)
      fireEvent.keyDown(slider(), { key: 'ArrowDown', shiftKey: true })
    expect(seen[seen.length - 1]).toBe(50.7)
    // A whole step from between two goes on from the step shown.
    fireEvent.keyDown(slider(), { key: 'ArrowUp' })
    expect(seen[seen.length - 1]).toBe(52)
    // And a key that lands on the step shown, from beside it, is still a move.
    fireEvent.keyDown(slider(), { key: 'ArrowDown', shiftKey: true })
    expect(seen[seen.length - 1]).toBe(51.9)
    expect(slider()).toHaveAttribute('aria-valuenow', '52')
    fireEvent.keyDown(slider(), { key: 'End' })
    fireEvent.keyDown(slider(), { key: 'ArrowDown', shiftKey: true })
    expect(seen[seen.length - 1]).toBe(99.9)
    fireEvent.keyDown(slider(), { key: 'End' })
    expect(seen[seen.length - 1]).toBe(100)
  })

  it('with `wholeSteps`, a key moves a whole step with Shift held too', () => {
    function Host() {
      const [value, setValue] = useState(12)
      return (
        <Knob
          label="Pitch"
          value={value}
          defaultValue={12}
          min={-24}
          max={24}
          step={1}
          wholeSteps
          onChange={setValue}
        />
      )
    }
    render(<Host />)
    for (const key of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowUp']) {
      fireEvent.keyDown(slider(), { key, shiftKey: true })
    }
    expect(slider()).toHaveAttribute('aria-valuenow', '14')
  })

  it('without a step, keys move one percent of the travel under the taper', () => {
    const onChange = vi.fn()
    render(
      <Knob
        label="Cutoff"
        defaultValue={20}
        min={20}
        max={20000}
        taper="log"
        onChange={onChange}
      />,
    )
    fireEvent.keyDown(slider(), { key: 'ArrowUp' })
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0]).toBeCloseTo(20 * Math.pow(1000, 0.01))
  })

  it('leaves other keys to the page', () => {
    const onChange = vi.fn()
    const onKeyDown = vi.fn()
    render(
      <div onKeyDown={onKeyDown}>
        <Knob label="Mix" defaultValue={0.5} min={0} max={1} step={0.01} onChange={onChange} />
      </div>,
    )
    fireEvent.keyDown(slider(), { key: ' ' })
    expect(onChange).not.toHaveBeenCalled()
    expect(onKeyDown).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(slider(), { key: 'Home' })
    // Stepping keys stop at the slider.
    expect(onKeyDown).toHaveBeenCalledTimes(1)
  })

  it('drags: up increases, Shift is four times finer, the accumulator carries sub-steps', () => {
    const onChange = vi.fn()
    render(
      <Knob
        label="Mix"
        defaultValue={0.5}
        min={0}
        max={1}
        step={0.01}
        sensitivityPx={100}
        onChange={onChange}
      />,
    )
    const control = slider()
    drag(control, 100, 80)
    expect(onChange).toHaveBeenLastCalledWith(0.7)
    drag(control, 100, 120, { shiftKey: true })
    expect(onChange).toHaveBeenLastCalledWith(0.65)
    // Twelve one-pixel fine moves add up like one twelve-pixel move.
    fireEvent.pointerDown(control, { pointerId: 2, button: 0, clientY: 50 })
    for (let y = 49; y >= 38; y -= 1) {
      fireEvent.pointerMove(control, { pointerId: 2, clientY: y, shiftKey: true })
    }
    fireEvent.pointerUp(control, { pointerId: 2 })
    expect(onChange).toHaveBeenLastCalledWith(0.68)
  })

  it('brackets a pointer gesture with onChangeStart / onChangeEnd and marks it active', () => {
    const onChangeStart = vi.fn()
    const onChangeEnd = vi.fn()
    const { container } = render(
      <Knob
        label="Mix"
        defaultValue={0.5}
        min={0}
        max={1}
        onChangeStart={onChangeStart}
        onChangeEnd={onChangeEnd}
      />,
    )
    const control = slider()
    fireEvent.pointerDown(control, { pointerId: 1, button: 0, clientY: 10 })
    expect(onChangeStart).toHaveBeenCalledTimes(1)
    expect(onChangeEnd).not.toHaveBeenCalled()
    expect(container.firstChild).toHaveClass('lm-knob--active')
    fireEvent.pointerMove(control, { pointerId: 1, clientY: 0 })
    fireEvent.pointerUp(control, { pointerId: 1 })
    expect(onChangeEnd).toHaveBeenCalledTimes(1)
    expect(container.firstChild).not.toHaveClass('lm-knob--active')
  })

  it('puts back what it was turned by when the browser takes the press for a scroll', () => {
    const onChange = vi.fn()
    const onChangeEnd = vi.fn()
    render(
      <Knob
        label="Mix"
        defaultValue={0.5}
        min={0}
        max={1}
        step={0.01}
        onChange={onChange}
        onChangeEnd={onChangeEnd}
      />,
    )
    const control = slider()
    fireEvent.pointerDown(control, { pointerId: 1, button: 0, clientX: 100, clientY: 50 })
    // A finger swiping along a chain drifts a few pixels up or down before the browser scrolls.
    fireEvent.pointerMove(control, { pointerId: 1, clientX: 80, clientY: 44 })
    expect(onChange).toHaveBeenCalled()
    expect(control).not.toHaveAttribute('aria-valuenow', '0.5')
    fireEvent.pointerCancel(control, { pointerId: 1 })
    // Back where it was, and the gesture is closed.
    expect(onChange).toHaveBeenLastCalledWith(0.5)
    expect(control).toHaveAttribute('aria-valuenow', '0.5')
    expect(onChangeEnd).toHaveBeenCalledTimes(1)
    // A press that is let go keeps what it was turned to, as ever.
    fireEvent.pointerDown(control, { pointerId: 2, button: 0, clientX: 100, clientY: 50 })
    fireEvent.pointerMove(control, { pointerId: 2, clientX: 100, clientY: 40 })
    fireEvent.pointerUp(control, { pointerId: 2 })
    expect(control).not.toHaveAttribute('aria-valuenow', '0.5')
  })

  it('holds back a finger’s first pixels, so a swipe the browser takes never turns it at all', () => {
    const onChange = vi.fn()
    render(<Knob label="Mix" defaultValue={0.5} min={0} max={1} onChange={onChange} />)
    const control = slider()
    const finger = { pointerId: 7, pointerType: 'touch' }
    fireEvent.pointerDown(control, { ...finger, button: 0, clientX: 100, clientY: 50 })
    // A swipe along a chain: far across, a pixel or two of drift, and then the browser has it.
    fireEvent.pointerMove(control, { ...finger, clientX: 90, clientY: 49 })
    fireEvent.pointerMove(control, { ...finger, clientX: 80, clientY: 47 })
    fireEvent.pointerCancel(control, { ...finger })
    expect(onChange).not.toHaveBeenCalled()
    expect(control).toHaveAttribute('aria-valuenow', '0.5')
    // A finger that goes on up means the knob, which catches up with all of the way so far.
    fireEvent.pointerDown(control, { ...finger, button: 0, clientX: 100, clientY: 50 })
    fireEvent.pointerMove(control, { ...finger, clientX: 100, clientY: 47 })
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.pointerMove(control, { ...finger, clientX: 100, clientY: 38 })
    fireEvent.pointerUp(control, { ...finger })
    // Twelve pixels of a knob's 110, not the nine since it let go.
    expect(onChange.mock.calls.at(-1)?.[0]).toBeCloseTo(0.5 + 12 / 110, 6)
    // A mouse turns it from the first pixel, as ever.
    onChange.mockClear()
    fireEvent.pointerDown(control, { pointerId: 1, button: 0, clientX: 100, clientY: 50 })
    fireEvent.pointerMove(control, { pointerId: 1, clientX: 100, clientY: 49 })
    expect(onChange).toHaveBeenCalledTimes(1)
    fireEvent.pointerUp(control, { pointerId: 1 })
  })

  it('holds back a finger that goes more across than along, however far it drifts', () => {
    const onChange = vi.fn()
    render(<Knob label="Mix" defaultValue={0.5} min={0} max={1} onChange={onChange} />)
    const control = slider()
    const finger = { pointerId: 7, pointerType: 'touch' }
    // A swipe on a slant, 140 across and 40 up: four pixels up after eleven across, then the browser has it.
    fireEvent.pointerDown(control, { ...finger, button: 0, clientX: 136, clientY: 723 })
    fireEvent.pointerMove(control, { ...finger, clientX: 125, clientY: 720 })
    fireEvent.pointerMove(control, { ...finger, clientX: 114, clientY: 716 })
    fireEvent.pointerCancel(control, { ...finger })
    expect(onChange).not.toHaveBeenCalled()
    // As far up as across is the knob's: the browser leaves that one to it.
    fireEvent.pointerDown(control, { ...finger, button: 0, clientX: 137, clientY: 723 })
    fireEvent.pointerMove(control, { ...finger, clientX: 132, clientY: 718 })
    expect(onChange.mock.calls.at(-1)?.[0]).toBeCloseTo(0.5 + 5 / 110, 6)
    fireEvent.pointerUp(control, { ...finger })
    // A finger that sets off across and then goes up takes the knob once it has gone further up.
    onChange.mockClear()
    fireEvent.pointerDown(control, { ...finger, button: 0, clientX: 100, clientY: 50 })
    fireEvent.pointerMove(control, { ...finger, clientX: 92, clientY: 46 })
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.pointerMove(control, { ...finger, clientX: 92, clientY: 40 })
    expect(onChange).toHaveBeenCalledTimes(1)
    fireEvent.pointerUp(control, { ...finger })
  })

  it('ends a key gesture after the idle time', () => {
    vi.useFakeTimers()
    try {
      const onChangeStart = vi.fn()
      const onChangeEnd = vi.fn()
      render(
        <Knob
          label="Mix"
          defaultValue={0.5}
          min={0}
          max={1}
          step={0.1}
          gestureIdleMs={100}
          onChangeStart={onChangeStart}
          onChangeEnd={onChangeEnd}
        />,
      )
      fireEvent.keyDown(slider(), { key: 'ArrowUp' })
      fireEvent.keyDown(slider(), { key: 'ArrowUp' })
      expect(onChangeStart).toHaveBeenCalledTimes(1)
      expect(onChangeEnd).not.toHaveBeenCalled()
      act(() => {
        vi.advanceTimersByTime(150)
      })
      expect(onChangeEnd).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('ends a move that is open when the knob leaves the page, once', () => {
    const onChangeStart = vi.fn()
    const onChangeEnd = vi.fn()
    const knob = (
      <Knob
        label="Mix"
        defaultValue={0.5}
        min={0}
        max={1}
        step={0.1}
        onChangeStart={onChangeStart}
        onChangeEnd={onChangeEnd}
      />
    )
    // Taken off the page with the pointer still down: nothing more comes from the browser.
    const dragged = render(knob)
    fireEvent.pointerDown(slider(), { pointerId: 1, button: 0, clientY: 10 })
    fireEvent.pointerMove(slider(), { pointerId: 1, clientY: 0 })
    expect(onChangeEnd).not.toHaveBeenCalled()
    dragged.unmount()
    expect(onChangeStart).toHaveBeenCalledTimes(1)
    expect(onChangeEnd).toHaveBeenCalledTimes(1)
    // And within the idle time of a key or a notch of the wheel, whose timer goes with the knob.
    const keyed = render(knob)
    fireEvent.keyDown(slider(), { key: 'ArrowUp' })
    keyed.unmount()
    expect(onChangeStart).toHaveBeenCalledTimes(2)
    expect(onChangeEnd).toHaveBeenCalledTimes(2)
    // A knob that leaves with no move open says nothing.
    const still = render(knob)
    fireEvent.pointerDown(slider(), { pointerId: 1, button: 0, clientY: 10 })
    fireEvent.pointerUp(slider(), { pointerId: 1 })
    expect(onChangeEnd).toHaveBeenCalledTimes(3)
    still.unmount()
    expect(onChangeEnd).toHaveBeenCalledTimes(3)
  })

  it('ends a move at once when the knob is switched off under the pointer, and once', () => {
    const onChange = vi.fn()
    const onChangeEnd = vi.fn()
    const knob = (disabled: boolean) => (
      <Knob
        label="Mix"
        defaultValue={0.5}
        min={0}
        max={1}
        step={0.1}
        disabled={disabled}
        onChange={onChange}
        onChangeEnd={onChangeEnd}
      />
    )
    const { rerender, container } = render(knob(false))
    fireEvent.pointerDown(slider(), { pointerId: 1, button: 0, clientY: 100 })
    expect(container.firstChild).toHaveClass('lm-knob--active')
    // A browser may send a disabled control nothing more, so the move does not wait for it.
    rerender(knob(true))
    expect(onChangeEnd).toHaveBeenCalledTimes(1)
    expect(container.firstChild).not.toHaveClass('lm-knob--active')
    // What a browser does still send turns nothing and ends nothing a second time.
    fireEvent.pointerMove(slider(), { pointerId: 1, clientY: 50 })
    fireEvent.pointerUp(slider(), { pointerId: 1 })
    expect(onChange).not.toHaveBeenCalled()
    expect(onChangeEnd).toHaveBeenCalledTimes(1)
    // Switched on again, the pointer that is still down does not have it in hand.
    rerender(knob(false))
    fireEvent.pointerMove(slider(), { pointerId: 1, clientY: 0 })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('ends a move when the pointer is taken from the knob, and once', () => {
    const onChange = vi.fn()
    const onChangeStart = vi.fn()
    const onChangeEnd = vi.fn()
    render(
      <Knob
        label="Mix"
        defaultValue={0.5}
        min={0}
        max={1}
        step={0.1}
        onChange={onChange}
        onChangeStart={onChangeStart}
        onChangeEnd={onChangeEnd}
      />,
    )
    const control = slider()
    // Something else captures the pointer: the knob is sent no more of it, not its going up either.
    fireEvent.pointerDown(control, { pointerId: 1, button: 0, clientY: 100 })
    fireEvent.pointerMove(control, { pointerId: 1, clientY: 78 })
    fireEvent.lostPointerCapture(control, { pointerId: 1 })
    expect(onChangeEnd).toHaveBeenCalledTimes(1)
    // What it was turned to stays, as when the pointer goes up.
    expect(onChange).toHaveBeenLastCalledWith(0.7)
    expect(control).toHaveAttribute('aria-valuenow', '0.7')
    // A browser says the capture is lost after every pointer up as well: that is the same end.
    fireEvent.pointerDown(control, { pointerId: 2, button: 0, clientY: 100 })
    fireEvent.pointerUp(control, { pointerId: 2 })
    fireEvent.lostPointerCapture(control, { pointerId: 2 })
    expect(onChangeStart).toHaveBeenCalledTimes(2)
    expect(onChangeEnd).toHaveBeenCalledTimes(2)
    // And the capture another pointer lost is not this one's.
    fireEvent.pointerDown(control, { pointerId: 3, button: 0, clientY: 100 })
    fireEvent.lostPointerCapture(control, { pointerId: 2 })
    expect(onChangeEnd).toHaveBeenCalledTimes(2)
    fireEvent.pointerUp(control, { pointerId: 3 })
    expect(onChangeEnd).toHaveBeenCalledTimes(3)
  })

  it('turns with the wheel and swallows the scroll', () => {
    const onChange = vi.fn()
    render(
      <Knob label="Mix" defaultValue={0.5} min={0} max={1} step={0.0001} onChange={onChange} />,
    )
    const control = slider()
    const up = new WheelEvent('wheel', { deltaY: -100, cancelable: true, bubbles: true })
    control.dispatchEvent(up)
    expect(up.defaultPrevented).toBe(true)
    expect(onChange).toHaveBeenLastCalledWith(0.525)
    const fine = new WheelEvent('wheel', { deltaY: -100, shiftKey: true, cancelable: true })
    control.dispatchEvent(fine)
    expect(onChange.mock.calls.at(-1)?.[0]).toBeCloseTo(0.5275, 4)
  })

  it('leaves a swipe that goes more across than up or down to the scroller', () => {
    const onChange = vi.fn()
    render(
      <Knob label="Mix" defaultValue={0.5} min={0} max={1} step={0.0001} onChange={onChange} />,
    )
    const control = slider()
    // A trackpad scrolling a chain sideways, the pointer over a knob: straight across, and a little down.
    for (const init of [
      { deltaX: 12, deltaY: 0 },
      { deltaX: 12, deltaY: 1 },
      { deltaX: -40, deltaY: -8 },
    ]) {
      const swipe = new WheelEvent('wheel', { ...init, cancelable: true, bubbles: true })
      control.dispatchEvent(swipe)
      expect(swipe.defaultPrevented, JSON.stringify(init)).toBe(false)
    }
    expect(onChange).not.toHaveBeenCalled()
    // More down than across is the knob's, as before.
    const turn = new WheelEvent('wheel', { deltaX: 3, deltaY: 100, cancelable: true })
    control.dispatchEvent(turn)
    expect(turn.defaultPrevented).toBe(true)
    expect(onChange).toHaveBeenLastCalledWith(0.475)
    // With Shift held a wheel comes as a sideways delta on most platforms: that is a fine turn.
    const shifted = new WheelEvent('wheel', { deltaX: -100, shiftKey: true, cancelable: true })
    control.dispatchEvent(shifted)
    expect(shifted.defaultPrevented).toBe(true)
    expect(onChange.mock.calls.at(-1)?.[0]).toBeCloseTo(0.4775, 4)
  })

  it('ignores the wheel when disabled or opted out', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <Knob label="Mix" defaultValue={0.5} min={0} max={1} wheel={false} onChange={onChange} />,
    )
    const scroll = new WheelEvent('wheel', { deltaY: -100, cancelable: true })
    slider().dispatchEvent(scroll)
    expect(onChange).not.toHaveBeenCalled()
    expect(scroll.defaultPrevented).toBe(false)
    rerender(<Knob label="Mix" defaultValue={0.5} min={0} max={1} disabled onChange={onChange} />)
    fireEvent.keyDown(slider(), { key: 'ArrowUp' })
    drag(slider(), 100, 0)
    fireEvent.doubleClick(slider())
    expect(onChange).not.toHaveBeenCalled()
    expect(slider()).toBeDisabled()
  })

  it('resets on double-click to the default (or an explicit reset value)', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <Knob label="Mix" defaultValue={0.5} min={0} max={1} step={0.01} onChange={onChange} />,
    )
    fireEvent.keyDown(slider(), { key: 'End' })
    fireEvent.doubleClick(slider())
    expect(onChange).toHaveBeenLastCalledWith(0.5)
    rerender(
      <Knob
        label="Mix"
        defaultValue={0.5}
        min={0}
        max={1}
        step={0.01}
        resetValue={0.25}
        onChange={onChange}
      />,
    )
    fireEvent.doubleClick(slider())
    expect(onChange).toHaveBeenLastCalledWith(0.25)
  })

  it('resets on Delete or Backspace with the keys on it, as a double-click does, and keeps the key from the page', () => {
    const onChange = vi.fn()
    const onChangeStart = vi.fn()
    const onChangeEnd = vi.fn()
    const page = vi.fn()
    window.addEventListener('keydown', page)
    try {
      const { rerender } = render(
        <Knob
          label="Mix"
          defaultValue={0.5}
          min={0}
          max={1}
          step={0.01}
          onChange={onChange}
          onChangeStart={onChangeStart}
          onChangeEnd={onChangeEnd}
        />,
      )
      fireEvent.keyDown(slider(), { key: 'End' })
      fireEvent.blur(slider())
      onChangeStart.mockClear()
      onChangeEnd.mockClear()
      // One gesture of its own, so a host's undo takes it back in one step.
      expect(fireEvent.keyDown(slider(), { key: 'Delete' })).toBe(false)
      expect(onChange).toHaveBeenLastCalledWith(0.5)
      expect(onChangeStart).toHaveBeenCalledTimes(1)
      expect(onChangeEnd).toHaveBeenCalledTimes(1)
      // Whatever is selected on the page behind it is not deleted.
      expect(page).not.toHaveBeenCalled()
      rerender(
        <Knob
          label="Mix"
          defaultValue={0.5}
          min={0}
          max={1}
          step={0.01}
          resetValue={0.25}
          onChange={onChange}
        />,
      )
      fireEvent.keyDown(slider(), { key: 'Backspace' })
      expect(onChange).toHaveBeenLastCalledWith(0.25)
      // Held down it is one press, and the repeats go nowhere either.
      const calls = onChange.mock.calls.length
      fireEvent.keyDown(slider(), { key: 'End' })
      fireEvent.keyDown(slider(), { key: 'Delete', repeat: true })
      expect(onChange).toHaveBeenLastCalledWith(1)
      expect(onChange).toHaveBeenCalledTimes(calls + 1)
      expect(page).not.toHaveBeenCalled()
      // With a modifier the key is the page's.
      for (const modifier of [
        { shiftKey: true },
        { metaKey: true },
        { ctrlKey: true },
        { altKey: true },
      ]) {
        expect(fireEvent.keyDown(slider(), { key: 'Delete', ...modifier })).toBe(true)
      }
      expect(onChange).toHaveBeenCalledTimes(calls + 1)
      expect(page).toHaveBeenCalledTimes(4)
      // A disabled knob has no way back to take: the key goes on to the page.
      rerender(<Knob label="Mix" defaultValue={0.5} min={0} max={1} disabled onChange={onChange} />)
      fireEvent.keyDown(slider(), { key: 'Delete' })
      expect(onChange).toHaveBeenCalledTimes(calls + 1)
      expect(page).toHaveBeenCalledTimes(5)
    } finally {
      window.removeEventListener('keydown', page)
    }
  })

  it('takes a double click for its own only when the first press was on it too', () => {
    forgetPresses()
    const onChange = vi.fn()
    render(
      <>
        <button type="button">More</button>
        <Knob label="Mix" defaultValue={0.5} min={0} max={1} step={0.01} onChange={onChange} />
      </>,
    )
    const cell = screen.getByRole('button', { name: 'More' })
    fireEvent.keyDown(slider(), { key: 'End' })
    expect(onChange).toHaveBeenLastCalledWith(1)
    // The cell is pressed and moves away; the knob stands under the pointer for the second press,
    // and the browser sends the double click there.
    fireEvent.click(cell, { detail: 1 })
    fireEvent.click(slider(), { detail: 2 })
    fireEvent.doubleClick(slider(), { detail: 2 })
    expect(onChange).toHaveBeenLastCalledWith(1)
    expect(onChange).toHaveBeenCalledTimes(1)
    // Both presses on the knob: that is its reset.
    fireEvent.click(slider(), { detail: 1 })
    fireEvent.click(slider(), { detail: 2 })
    fireEvent.doubleClick(slider(), { detail: 2 })
    expect(onChange).toHaveBeenLastCalledWith(0.5)
    // And one a script makes, with no press before it, is taken as it comes.
    fireEvent.keyDown(slider(), { key: 'End' })
    fireEvent.click(cell, { detail: 1 })
    fireEvent.doubleClick(slider())
    expect(onChange).toHaveBeenLastCalledWith(0.5)
    forgetPresses()
  })

  it('moves a list one entry for a notch of the wheel, a notch at a time, and adds up what is less', () => {
    const seen: number[] = []
    function Host() {
      const [value, setValue] = useState(0)
      return (
        <Knob
          label="Shape"
          value={value}
          defaultValue={0}
          min={0}
          max={3}
          step={1}
          wholeSteps
          onChange={(next) => {
            seen.push(next)
            setValue(next)
          }}
        />
      )
    }
    vi.useFakeTimers()
    try {
      render(<Host />)
      const notch = (deltaY: number, init: WheelEventInit = {}): void => {
        act(() => {
          slider().dispatchEvent(new WheelEvent('wheel', { deltaY, cancelable: true, ...init }))
        })
      }
      // One notch, then nothing for longer than a move stays open, then another.
      notch(-100)
      expect(seen).toEqual([1])
      act(() => {
        vi.advanceTimersByTime(600)
      })
      notch(-100)
      expect(seen).toEqual([1, 2])
      act(() => {
        vi.advanceTimersByTime(600)
      })
      // A trackpad: twenty-four events of 4 px are short of a notch, the next one makes it.
      for (let event = 0; event < 24; event += 1) notch(4)
      expect(seen).toEqual([1, 2])
      notch(4)
      expect(seen).toEqual([1, 2, 1])
      // Turned the other way, what was left of a step is dropped.
      notch(60)
      notch(-60)
      expect(seen).toEqual([1, 2, 1])
      notch(-40)
      expect(seen).toEqual([1, 2, 1, 2])
      // At the end it stays, and with Shift a notch is a tenth of a step.
      notch(-300)
      expect(seen).toEqual([1, 2, 1, 2, 3])
      notch(-100)
      notch(100, { shiftKey: true })
      expect(seen).toEqual([1, 2, 1, 2, 3])
      expect(slider()).toHaveAttribute('aria-valuenow', '3')
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not announce a value that did not move', () => {
    const onChange = vi.fn()
    render(<Knob label="Mix" defaultValue={1} min={0} max={1} step={0.01} onChange={onChange} />)
    fireEvent.keyDown(slider(), { key: 'End' })
    fireEvent.keyDown(slider(), { key: 'ArrowUp' })
    const control = slider()
    fireEvent.pointerDown(control, { pointerId: 1, button: 0, clientY: 100 })
    fireEvent.pointerMove(control, { pointerId: 1, clientY: 100 })
    fireEvent.pointerUp(control, { pointerId: 1 })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('is controlled when given a value: shows the prop, follows it, and does not jump on drag', () => {
    function Host() {
      const [value, setValue] = useState(0.2)
      return (
        <>
          <Knob
            label="Mix"
            value={value}
            defaultValue={0.5}
            min={0}
            max={1}
            step={0.01}
            onChange={setValue}
          />
          <button type="button" onClick={() => setValue(0.9)}>
            external
          </button>
        </>
      )
    }
    render(<Host />)
    expect(slider()).toHaveAttribute('aria-valuenow', '0.2')
    fireEvent.click(screen.getByText('external'))
    expect(slider()).toHaveAttribute('aria-valuenow', '0.9')
    fireEvent.keyDown(slider(), { key: 'ArrowDown' })
    expect(slider()).toHaveAttribute('aria-valuenow', '0.89')
    // A drag starts from the controlled value, not from an internal one.
    fireEvent.pointerDown(slider(), { pointerId: 1, button: 0, clientY: 100 })
    expect(slider()).toHaveAttribute('aria-valuenow', '0.89')
    fireEvent.pointerMove(slider(), { pointerId: 1, clientY: 111 })
    fireEvent.pointerUp(slider(), { pointerId: 1 })
    expect(slider()).toHaveAttribute('aria-valuenow', '0.79')
  })

  it('a controlled knob whose host rejects changes stays put', () => {
    render(<Knob label="Mix" value={0.3} defaultValue={0.5} min={0} max={1} step={0.01} />)
    fireEvent.keyDown(slider(), { key: 'End' })
    expect(slider()).toHaveAttribute('aria-valuenow', '0.3')
  })

  it('fills the arc from the centre when bipolar', () => {
    const { container, rerender } = render(
      <Knob label="Pan" defaultValue={0} min={-1} max={1} bipolar unit="pan" />,
    )
    // At the centre there is no fill arc: track, hub and pointer only.
    expect(container.querySelectorAll('path')).toHaveLength(1)
    rerender(<Knob label="Pan" value={0.5} defaultValue={0} min={-1} max={1} bipolar unit="pan" />)
    expect(container.querySelectorAll('path')).toHaveLength(2)
    expect(screen.getByText('R25')).toBeInTheDocument()
  })

  it('accepts a custom formatter and hides label or value', () => {
    render(
      <Knob
        label="Type"
        defaultValue={2}
        min={0}
        max={7}
        step={1}
        format={(value) => ['LP', 'HP', 'BP', 'N'][value] ?? '?'}
        hideLabel
      />,
    )
    expect(screen.queryByText('Type')).toBeNull()
    expect(slider()).toHaveAttribute('aria-valuetext', 'BP')
  })
})
