// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { type Device, type MeteredDevice } from '../../core/devices/Device'
import { MissingNativeDevice } from '../../native/missing'
import { DeviceFrame, DevicePanel, formatDeviceMeter } from '../components/DevicePanel'
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
  it('writes a reading to one decimal with its unit, and never as minus zero', () => {
    expect([
      formatDeviceMeter(-3.24, 'dB'),
      formatDeviceMeter(0, 'dB'),
      formatDeviceMeter(-0.04, 'dB'),
      formatDeviceMeter(1.25, ''),
    ]).toEqual(['−3.2 dB', '0.0 dB', '0.0 dB', '1.3'])
  })

  it('shows the readings of a device that reports them, while it is on', async () => {
    const fixture = createTestEngine()
    const state = { reduction: -3.24, watching: 0 }
    const device: MeteredDevice = Object.assign(await filter(fixture), {
      meters: { reduction: { id: 0, name: 'Gain reduction', unit: 'dB' } },
      meter: () => state.reduction,
      watchMeters: () => {
        state.watching += 1
        return () => {
          state.watching -= 1
        }
      },
    })
    render(<DevicePanel device={device} data-testid="panel" />, { wrapper: fixture.wrapper })
    const readout = screen.getByTestId('panel-meter-reduction')
    expect(readout).toHaveAccessibleName('Gain reduction')
    expect(readout).toHaveTextContent('−3.2 dB')
    expect(state.watching).toBe(1)
    state.reduction = -7.96
    act(() => fixture.frames.flush(1000))
    expect(readout).toHaveTextContent('−8.0 dB')

    // Switched off it does no work: nothing is asked of it, and it reads zero.
    fireEvent.click(screen.getByRole('switch', { name: 'Filter power' }))
    expect(state.watching).toBe(0)
    expect(readout).toHaveTextContent('0.0 dB')
  })

  it('has no reading for a device that reports none', async () => {
    const fixture = createTestEngine()
    render(<DevicePanel device={await filter(fixture)} data-testid="panel" />, {
      wrapper: fixture.wrapper,
    })
    expect(screen.queryByTestId('panel-meter-reduction')).toBeNull()
  })

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
    expect(screen.getByRole('slider', { name: 'Type' })).toHaveAttribute(
      'aria-valuetext',
      'Low pass',
    )
  })

  it('moves a list by whole entries with Shift held too, never to a place between two', async () => {
    const fixture = createTestEngine()
    const device = await filter(fixture)
    render(<DevicePanel device={device} data-testid="panel" />, { wrapper: fixture.wrapper })
    const type = screen.getByRole('slider', { name: 'Type' })
    // A tenth of a step is no entry of a list: the device would be set to 0.1 and the knob still say the first.
    fireEvent.keyDown(type, { key: 'ArrowUp', shiftKey: true })
    expect(device.getParam('type')).toBe(1)
    expect(type).toHaveAttribute('aria-valuetext', 'High pass')
    fireEvent.keyDown(type, { key: 'ArrowUp', shiftKey: true })
    fireEvent.keyDown(type, { key: 'ArrowDown', shiftKey: true })
    fireEvent.keyDown(type, { key: 'ArrowUp', shiftKey: true })
    expect(device.getParam('type')).toBe(2)
    // A setting with no steps of its own keeps its fine key.
    const gain = screen.getByRole('slider', { name: 'Gain' })
    fireEvent.keyDown(gain, { key: 'ArrowUp', shiftKey: true })
    expect(device.getParam('gain')).toBeCloseTo(0.01, 6)
  })

  it('says which device, parameter and power switch each part is, for a host that maps controllers', async () => {
    const fixture = createTestEngine()
    const device = await filter(fixture)
    render(<DevicePanel device={device} data-testid="panel" />, { wrapper: fixture.wrapper })
    const panel = screen.getByTestId('panel')
    expect(panel).toHaveAttribute('data-lm-device', 'filter')
    expect(
      [...panel.querySelectorAll('[data-lm-param]')].map((knob) =>
        knob.getAttribute('data-lm-param'),
      ),
    ).toEqual(['type', 'frequency', 'q', 'gain'])
    expect(
      screen.getByRole('slider', { name: 'Frequency' }).closest('[data-lm-param]'),
    ).toHaveAttribute('data-lm-param', 'frequency')
    expect(screen.getByRole('switch', { name: 'Filter power' })).toHaveAttribute(
      'data-lm-power',
      '',
    )
  })

  it('leaves a frame that holds no device unmarked', () => {
    render(
      <DeviceFrame title="Keyboard" powered onPowerChange={() => {}} data-testid="frame">
        keys
      </DeviceFrame>,
    )
    expect(screen.getByTestId('frame')).not.toHaveAttribute('data-lm-device')
    expect(screen.getByRole('switch', { name: 'Keyboard power' })).not.toHaveAttribute(
      'data-lm-power',
    )
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

  it('sets every knob from a preset, so the one picked before leaves nothing behind', async () => {
    const fixture = createTestEngine()
    const device = await filter(fixture)
    render(<DevicePanel device={device} />, { wrapper: fixture.wrapper })
    const picker = screen.getByRole('combobox', { name: 'Filter preset' })
    fireEvent.change(picker, { target: { value: 'Presence peak' } })
    expect(device.getParam('gain')).toBe(4)
    // This one names no gain: the gain goes back to where the device starts it.
    fireEvent.change(picker, { target: { value: 'Low-pass gentle' } })
    expect(device.getParam('frequency')).toBe(4000)
    expect(device.getParam('gain')).toBe(0)
  })

  it('gives the place of its preset list to a picker the host draws', async () => {
    const fixture = createTestEngine()
    const device = await filter(fixture)
    render(
      <DevicePanel device={device} presetPicker={<button type="button">Presets of mine</button>} />,
      { wrapper: fixture.wrapper },
    )
    expect(screen.getByRole('button', { name: 'Presets of mine' })).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Filter preset' })).toBeNull()
    // Null says there is none to draw, and the kit's list stays away all the same.
    cleanup()
    render(<DevicePanel device={device} presetPicker={null} />, { wrapper: fixture.wrapper })
    expect(screen.queryByRole('combobox', { name: 'Filter preset' })).toBeNull()
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

  it('shows what a device has to say for itself, and nothing when it says nothing', async () => {
    const fixture = createTestEngine()
    const device = await filter(fixture)
    const { rerender } = render(<DevicePanel device={device} data-testid="panel" />, {
      wrapper: fixture.wrapper,
    })
    expect(screen.queryByRole('note')).toBeNull()

    // A plug-in that is not there: no knobs, a sentence in their place.
    const standIn = new MissingNativeDevice(
      fixture.engine.context,
      'native:VST3-Verb-1-2',
      { p7: 0.3 },
      'Verb did not load: the file is gone.',
    )
    rerender(<DevicePanel device={standIn} title="Verb" onRemove={() => {}} data-testid="panel" />)
    expect(screen.getByTestId('panel-notice')).toHaveTextContent(
      'Verb did not load: the file is gone. Its sound passes through unchanged and its settings are kept.',
    )
    expect(screen.queryAllByRole('slider')).toEqual([])
    expect(screen.queryByRole('button', { name: 'Open Verb editor' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Remove Verb' })).toBeInTheDocument()
  })
})
