// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { dbToGain } from '../../core/devices/native/units'
import { ChannelRowView } from '../components/ChannelRowView'
import { ChannelStripView } from '../components/ChannelStripView'
import { createTestEngine } from './harness'

afterEach(cleanup)

describe('ChannelRowView', () => {
  it('shows a swatch, the name, mute, solo and a horizontal dB fader at unity', () => {
    const fixture = createTestEngine()
    const rain = fixture.engine.addAudioTrack('rain')
    render(<ChannelRowView strip={rain} brush={2} meter={false} data-testid="row" />, {
      wrapper: fixture.wrapper,
    })
    const row = screen.getByRole('region', { name: 'rain strip' })
    expect(within(row).getByRole('heading', { name: 'rain' })).toBeInTheDocument()
    expect(row.querySelector('.lm-row__swatch--b2')).not.toBeNull()
    const fader = within(row).getByRole('slider', { name: 'Level' })
    expect(fader).toHaveAttribute('aria-orientation', 'horizontal')
    expect(fader).toHaveAttribute('aria-valuetext', '0.0 dB')
    expect(within(row).getByRole('button', { name: 'Mute' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(within(row).getByRole('button', { name: 'Solo' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('writes level, mute and solo to the strip', () => {
    const fixture = createTestEngine()
    const rain = fixture.engine.addAudioTrack('rain')
    render(<ChannelRowView strip={rain} meter={false} />, { wrapper: fixture.wrapper })
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Level' }), { key: 'ArrowDown' })
    expect(rain.strip.level).toBeCloseTo(dbToGain(-0.1))
    fireEvent.click(screen.getByRole('button', { name: 'Mute' }))
    expect(rain.strip.mute).toBe(true)
    expect(screen.getByRole('region', { name: 'rain strip' })).toHaveClass('lm-row--muted')
    fireEvent.click(screen.getByRole('button', { name: 'Solo' }))
    expect(rain.strip.solo).toBe(true)
  })

  it('stays in step with a full strip over the same track', () => {
    const fixture = createTestEngine()
    const rain = fixture.engine.addAudioTrack('rain')
    render(
      <>
        <ChannelRowView strip={rain} meter={false} data-testid="row" />
        <ChannelStripView strip={rain} meter={false} data-testid="strip" />
      </>,
      { wrapper: fixture.wrapper },
    )
    fireEvent.click(within(screen.getByTestId('strip')).getByRole('button', { name: 'Mute' }))
    expect(within(screen.getByTestId('row')).getByRole('button', { name: 'Mute' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('can hide solo, takes a custom name, and reports selection', () => {
    const fixture = createTestEngine()
    const rain = fixture.engine.addAudioTrack('rain')
    const onSelect = vi.fn()
    render(
      <ChannelRowView
        strip={rain}
        name="Rain on tin"
        showSolo={false}
        meter={false}
        selected
        onSelect={onSelect}
      />,
      { wrapper: fixture.wrapper },
    )
    const row = screen.getByRole('region', { name: 'Rain on tin strip' })
    expect(row).toHaveClass('lm-row--selected')
    expect(row.querySelector('.lm-row__swatch')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Solo' })).toBeNull()
    fireEvent.click(row)
    expect(onSelect).toHaveBeenCalledTimes(1)
  })
})
