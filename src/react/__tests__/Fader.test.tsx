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
