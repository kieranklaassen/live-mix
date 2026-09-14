// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Knob } from '../components/Knob'

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
