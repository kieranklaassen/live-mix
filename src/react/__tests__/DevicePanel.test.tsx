// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { type Device } from '../../core/devices/Device'
import { DeviceFrame, DevicePanel } from '../components/DevicePanel'
import { createTestEngine, type TestEngine } from './harness'

afterEach(cleanup)

async function filter(fixture: TestEngine): Promise<Device> {
  return fixture.engine.devices.create('filter', fixture.engine.context)
}

describe('DeviceFrame', () => {
  it('renders the title, an optional power switch and dims the body when off', () => {
    const onPowerChange = vi.fn()
    const { container, rerender } = render(
      <DeviceFrame title="Reverb" powered onPowerChange={onPowerChange}>
        <span>body</span>
      </DeviceFrame>,
    )
    expect(screen.getByRole('heading', { name: 'Reverb' })).toBeInTheDocument()
    const power = screen.getByRole('switch', { name: 'Reverb power' })
    expect(power).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(power)
    expect(onPowerChange).toHaveBeenCalledWith(false)
    rerender(
      <DeviceFrame title="Reverb" powered={false} onPowerChange={onPowerChange}>
        <span>body</span>
      </DeviceFrame>,
    )
    expect(container.firstChild).toHaveClass('lm-device--off')
    expect(container.querySelector('.lm-device__body')).toHaveAttribute('aria-disabled', 'true')
    rerender(<DeviceFrame title="Plain">x</DeviceFrame>)
    expect(screen.queryByRole('switch')).toBeNull()
  })
})

describe('DevicePanel', () => {
  it('generates one taper-aware knob per parameter from the device table', async () => {
    const fixture = createTestEngine()
    const device = await filter(fixture)
    render(<DevicePanel device={device} data-testid="panel" />, { wrapper: fixture.wrapper })
    expect(screen.getByRole('heading', { name: 'Filter' })).toBeInTheDocument()
    const knobs = screen.getAllByRole('slider')
    expect(knobs.map((knob) => knob.getAttribute('aria-label'))).toEqual([
      'Type',
      'Frequency',
      'Q',
      'Gain',
    ])
    const frequency = screen.getByRole('slider', { name: 'Frequency' })
    expect(frequency).toHaveAttribute('aria-valuemin', '20')
    expect(frequency).toHaveAttribute('aria-valuemax', '20000')
    expect(frequency).toHaveAttribute('aria-valuenow', '1000')
    expect(frequency).toHaveAttribute('aria-valuetext', '1.00 kHz')
    expect(screen.getByRole('slider', { name: 'Gain' })).toHaveAttribute('aria-valuetext', '0.0 dB')
    // The type is a choice: integer steps.
    expect(screen.getByRole('slider', { name: 'Type' })).toHaveAttribute('aria-valuetext', '0')
  })

  it('round-trips parameters: knob → device (ramped) and device → knob', async () => {
    const fixture = createTestEngine()
    const device = await filter(fixture)
    render(<DevicePanel device={device} />, { wrapper: fixture.wrapper })
    const frequency = screen.getByRole('slider', { name: 'Frequency' })
    fireEvent.keyDown(frequency, { key: 'End' })
    expect(device.getParam('frequency')).toBe(20000)
    expect(frequency).toHaveAttribute('aria-valuenow', '20000')
    fireEvent.keyDown(frequency, { key: 'Home' })
    expect(device.getParam('frequency')).toBe(20)
    // A log knob: one keyboard step from the bottom is 1 % of the log travel.
    fireEvent.keyDown(frequency, { key: 'ArrowUp' })
    expect(device.getParam('frequency')).toBeCloseTo(20 * Math.pow(1000, 0.01))
    const biquad = fixture.ctx.filters[0]
    expect(biquad.frequency.events.map((event) => event.method)).toContain(
      'linearRampToValueAtTime',
    )

    act(() => device.setParam('gain', 6))
    expect(screen.getByRole('slider', { name: 'Gain' })).toHaveAttribute('aria-valuenow', '6')
    expect(screen.getByRole('slider', { name: 'Gain' })).toHaveAttribute(
      'aria-valuetext',
      '+6.0 dB',
    )

    const type = screen.getByRole('slider', { name: 'Type' })
    fireEvent.keyDown(type, { key: 'ArrowUp' })
    fireEvent.keyDown(type, { key: 'ArrowUp' })
    expect(device.getParam('type')).toBe(2)
  })

  it('toggles bypass through the power switch and follows external bypass', async () => {
    const fixture = createTestEngine()
    const device = await filter(fixture)
    const { container } = render(<DevicePanel device={device} />, { wrapper: fixture.wrapper })
    const power = screen.getByRole('switch', { name: 'Filter power' })
    expect(power).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(power)
    expect(device.bypass).toBe(true)
    expect(container.firstChild).toHaveClass('lm-device--off')
    act(() => {
      device.bypass = false
    })
    expect(power).toHaveAttribute('aria-checked', 'true')
  })

  it('applies factory presets from the picker and clears the pick when a knob moves', async () => {
    const fixture = createTestEngine()
    const device = await filter(fixture)
    render(<DevicePanel device={device} />, { wrapper: fixture.wrapper })
    const picker = screen.getByRole('combobox', { name: 'Filter preset' })
    const names = within(picker)
      .getAllByRole('option')
      .map((option) => option.textContent)
    expect(names).toContain('Presence peak')
    fireEvent.change(picker, { target: { value: 'Presence peak' } })
    expect(device.getParam('frequency')).toBe(3000)
    expect(device.getParam('gain')).toBe(4)
    expect(picker).toHaveValue('Presence peak')
    expect(screen.getByRole('slider', { name: 'Frequency' })).toHaveAttribute(
      'aria-valuenow',
      '3000',
    )
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Gain' }), { key: 'ArrowUp' })
    expect(picker).toHaveValue('')
  })

  it('shows a subset of parameters, choice labels and a remove action', async () => {
    const fixture = createTestEngine()
    const device = await filter(fixture)
    const onRemove = vi.fn()
    render(
      <DevicePanel
        device={device}
        title="Tone"
        params={['type', 'frequency']}
        choiceLabels={{ type: ['LP', 'HP', 'BP', 'LS', 'HS', 'PK', 'N', 'AP'] }}
        onRemove={onRemove}
        showPresets={false}
      />,
      { wrapper: fixture.wrapper },
    )
    expect(screen.getByRole('heading', { name: 'Tone' })).toBeInTheDocument()
    expect(screen.getAllByRole('slider')).toHaveLength(2)
    expect(screen.getByRole('slider', { name: 'Type' })).toHaveAttribute('aria-valuetext', 'LP')
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Type' }), { key: 'ArrowUp' })
    expect(screen.getByRole('slider', { name: 'Type' })).toHaveAttribute('aria-valuetext', 'HP')
    expect(screen.queryByRole('combobox')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Remove Tone' }))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('works without a provider given an explicit registry, and without any registry', async () => {
    const fixture = createTestEngine()
    const device = await filter(fixture)
    const { unmount } = render(<DevicePanel device={device} registry={fixture.engine.devices} />)
    expect(screen.getByRole('heading', { name: 'Filter' })).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    unmount()
    render(<DevicePanel device={device} />)
    expect(screen.getByRole('heading', { name: 'filter' })).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).toBeNull()
  })
})
