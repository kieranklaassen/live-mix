// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FADER_MAX_DB, FADER_MIN_DB, normalizeValue } from '../components/control-math'
import { Fader } from '../components/Fader'

afterEach(cleanup)

describe('Fader', () => {
  it('renders a vertical slider with ARIA state and the fill at the normalised position', () => {
    const { container } = render(
      <Fader
        label="Level"
        defaultValue={0}
        min={FADER_MIN_DB}
        max={FADER_MAX_DB}
        taper="fader"
        unit="dB"
      />,
    )
    const track = screen.getByRole('slider')
    expect(track).toHaveAttribute('aria-orientation', 'vertical')
    expect(track).toHaveAttribute('aria-valuenow', '0')
    expect(track).toHaveAttribute('aria-valuetext', '0.0 dB')
    const fill = container.querySelector<HTMLElement>('.lm-fader__fill')
    const unity = normalizeValue(0, FADER_MIN_DB, FADER_MAX_DB, 'fader')
    expect(fill?.style.height).toBe(`${unity * 100}%`)
    expect(container.querySelector<HTMLElement>('.lm-fader__thumb')?.style.bottom).toBe(
      `${unity * 100}%`,
    )
  })

  it('drags vertically: up is louder, horizontal drags are ignored', () => {
    const onChange = vi.fn()
    render(
      <Fader
        label="Level"
        defaultValue={0.5}
        min={0}
        max={1}
        step={0.01}
        sensitivityPx={100}
        onChange={onChange}
      />,
    )
    const track = screen.getByRole('slider')
    fireEvent.pointerDown(track, { pointerId: 1, button: 0, clientX: 0, clientY: 100 })
    fireEvent.pointerMove(track, { pointerId: 1, clientX: 40, clientY: 100 })
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.pointerMove(track, { pointerId: 1, clientX: 40, clientY: 75 })
    fireEvent.pointerUp(track, { pointerId: 1 })
    expect(onChange).toHaveBeenLastCalledWith(0.75)
  })

  it('drags horizontally when horizontal: right is more', () => {
    const onChange = vi.fn()
    const { container } = render(
      <Fader
        label="Send"
        orientation="horizontal"
        defaultValue={0.5}
        min={0}
        max={1}
        step={0.01}
        sensitivityPx={100}
        onChange={onChange}
      />,
    )
    const track = screen.getByRole('slider')
    expect(track).toHaveAttribute('aria-orientation', 'horizontal')
    fireEvent.pointerDown(track, { pointerId: 1, button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(track, { pointerId: 1, clientX: 20, clientY: 0 })
    fireEvent.pointerUp(track, { pointerId: 1 })
    expect(onChange).toHaveBeenLastCalledWith(0.7)
    expect(container.querySelector<HTMLElement>('.lm-fader__fill')?.style.width).toBe('70%')
  })

  it('accepts `axis` as the horizontal switch (alias of orientation, wins when both are given)', () => {
    const onChange = vi.fn()
    const { container } = render(
      <Fader
        label="Send"
        orientation="vertical"
        axis="horizontal"
        defaultValue={0.5}
        min={0}
        max={1}
        step={0.01}
        sensitivityPx={100}
        onChange={onChange}
      />,
    )
    const track = screen.getByRole('slider')
    expect(track).toHaveAttribute('aria-orientation', 'horizontal')
    expect(container.querySelector('.lm-fader--horizontal')).not.toBeNull()
    fireEvent.pointerDown(track, { pointerId: 1, button: 0, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(track, { pointerId: 1, clientX: 20, clientY: 0 })
    fireEvent.pointerUp(track, { pointerId: 1 })
    expect(onChange).toHaveBeenLastCalledWith(0.7)
  })

  it('draws ticks and steps with the keyboard along the fader taper', () => {
    const onChange = vi.fn()
    const { container } = render(
      <Fader
        label="Level"
        defaultValue={0}
        min={FADER_MIN_DB}
        max={FADER_MAX_DB}
        step={0.1}
        taper="fader"
        unit="dB"
        ticks={[0.5, 0.8]}
        onChange={onChange}
      />,
    )
    expect(container.querySelectorAll('.lm-fader__tick')).toHaveLength(2)
    const track = screen.getByRole('slider')
    fireEvent.keyDown(track, { key: 'ArrowDown' })
    expect(onChange).toHaveBeenLastCalledWith(-0.1)
    fireEvent.keyDown(track, { key: 'Home' })
    expect(onChange).toHaveBeenLastCalledWith(FADER_MIN_DB)
    expect(screen.getByText('-60.0 dB')).toBeInTheDocument()
    fireEvent.keyDown(track, { key: 'End' })
    expect(onChange).toHaveBeenLastCalledWith(FADER_MAX_DB)
    fireEvent.doubleClick(track)
    expect(onChange).toHaveBeenLastCalledWith(0)
  })

  it('draws a cap on a slot with `look="cap"`: no fill, no ticks, the thumb where it was', () => {
    const fader = (look?: 'bar' | 'cap', orientation: 'vertical' | 'horizontal' = 'vertical') => (
      <Fader
        label="Level"
        look={look}
        orientation={orientation}
        defaultValue={-12}
        min={FADER_MIN_DB}
        max={FADER_MAX_DB}
        taper="fader"
        unit="dB"
        ticks={[0.5, 0.8]}
      />
    )
    const thumbStyle = (container: HTMLElement) =>
      container.querySelector('.lm-fader__thumb')?.getAttribute('style')
    const at = `${normalizeValue(-12, FADER_MIN_DB, FADER_MAX_DB, 'fader') * 100}%`

    const bar = render(fader())
    expect(bar.container.firstChild).not.toHaveClass('lm-fader--cap')
    expect(bar.container.querySelector('.lm-fader__fill')).not.toBeNull()
    const barThumb = thumbStyle(bar.container)
    expect(render(fader('bar')).container.innerHTML).toBe(bar.container.innerHTML)
    cleanup()

    const cap = render(fader('cap'))
    expect(cap.container.firstChild).toHaveClass('lm-fader', 'lm-fader--vertical', 'lm-fader--cap')
    expect(cap.container.querySelector('.lm-fader__fill')).toBeNull()
    expect(cap.container.querySelectorAll('.lm-fader__tick')).toHaveLength(0)
    expect(cap.container.querySelector<HTMLElement>('.lm-fader__thumb')?.style.bottom).toBe(at)
    expect(thumbStyle(cap.container)).toBe(barThumb)
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '-12')
    cleanup()

    const flatBar = thumbStyle(render(fader('bar', 'horizontal')).container)
    cleanup()
    const flat = render(fader('cap', 'horizontal'))
    expect(flat.container.firstChild).toHaveClass('lm-fader--horizontal', 'lm-fader--cap')
    expect(flat.container.querySelector<HTMLElement>('.lm-fader__thumb')?.style.left).toBe(at)
    expect(thumbStyle(flat.container)).toBe(flatBar)
  })

  it('a cap fader is worked like any other, and says when it is in hand or switched off', () => {
    const onChange = vi.fn()
    const { container, rerender } = render(
      <Fader
        label="Level"
        look="cap"
        defaultValue={0.5}
        min={0}
        max={1}
        step={0.01}
        sensitivityPx={100}
        onChange={onChange}
      />,
    )
    const track = screen.getByRole('slider')
    fireEvent.pointerDown(track, { pointerId: 1, button: 0, clientX: 0, clientY: 100 })
    expect(container.firstChild).toHaveClass('lm-fader--cap', 'lm-fader--active')
    fireEvent.pointerMove(track, { pointerId: 1, clientX: 0, clientY: 75 })
    fireEvent.pointerUp(track, { pointerId: 1 })
    expect(onChange).toHaveBeenLastCalledWith(0.75)
    expect(container.querySelector<HTMLElement>('.lm-fader__thumb')?.style.bottom).toBe('75%')
    expect(container.firstChild).not.toHaveClass('lm-fader--active')
    rerender(<Fader label="Level" look="cap" defaultValue={0.5} min={0} max={1} disabled />)
    expect(container.firstChild).toHaveClass('lm-fader--cap', 'lm-fader--disabled')
  })

  it('ends a move that is open when the fader leaves the page, once', () => {
    const onChangeStart = vi.fn()
    const onChangeEnd = vi.fn()
    const { unmount } = render(
      <Fader
        label="Level"
        defaultValue={0.5}
        min={0}
        max={1}
        onChangeStart={onChangeStart}
        onChangeEnd={onChangeEnd}
      />,
    )
    const track = screen.getByRole('slider')
    fireEvent.pointerDown(track, { pointerId: 1, button: 0, clientX: 0, clientY: 100 })
    fireEvent.pointerMove(track, { pointerId: 1, clientX: 0, clientY: 75 })
    // A strip taken off the page with a finger on its fader: whoever holds the level lets it go.
    unmount()
    expect(onChangeStart).toHaveBeenCalledTimes(1)
    expect(onChangeEnd).toHaveBeenCalledTimes(1)
  })

  it('supports a custom formatter and a disabled state', () => {
    render(
      <Fader
        label="Level"
        defaultValue={FADER_MIN_DB}
        min={FADER_MIN_DB}
        max={FADER_MAX_DB}
        taper="fader"
        format={(db) => (db <= FADER_MIN_DB ? '-∞' : `${db}`)}
        disabled
      />,
    )
    expect(screen.getByText('-∞')).toBeInTheDocument()
    expect(screen.getByRole('slider')).toBeDisabled()
  })
})
