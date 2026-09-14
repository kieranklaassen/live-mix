// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { dbToGain } from '../../core/devices/native/units'
import { type MockGainNode } from '../../testing'
import { MixerView } from '../components/MixerView'
import { createTestEngine } from './harness'

afterEach(cleanup)

describe('MixerView', () => {
  it('lays out tracks, groups, returns and the master from the provided engine', async () => {
    const fixture = createTestEngine()
    const { engine } = fixture
    const pad = engine.addAudioTrack('pad')
    const bass = engine.addAudioTrack('bass')
    engine.addGroup('rhythm', { members: [bass] })
    const hall = engine.addReturnTrack('hall', {
      device: await engine.devices.create('delay', engine.context),
    })
    render(<MixerView returns={[hall]} data-testid="mixer" stripProps={{ meter: false }} />, {
      wrapper: fixture.wrapper,
    })
    const tracks = screen.getByRole('group', { name: 'Tracks' })
    expect(
      within(tracks)
        .getAllByRole('region')
        .map((r) => r.getAttribute('aria-label')),
    ).toEqual(['pad strip', 'bass strip'])
    expect(within(screen.getByRole('group', { name: 'Groups' })).getByRole('region')).toHaveClass(
      'lm-strip--group',
    )
    expect(within(screen.getByRole('group', { name: 'Returns' })).getByRole('region')).toHaveClass(
      'lm-strip--return',
    )
    const master = screen.getByRole('group', { name: 'Master' })
    expect(within(master).getByRole('region', { name: 'Master strip' })).toHaveClass(
      'lm-strip--master',
    )
    expect(within(master).getByRole('meter', { name: 'Master level' })).toBeInTheDocument()
    expect(within(master).queryByRole('button', { name: 'Solo' })).toBeNull()
    expect(pad.strip.materialized).toBe(false)
  })

  it('drives the master fader through the bus and selects strips', () => {
    const fixture = createTestEngine()
    const { engine } = fixture
    const pad = engine.addAudioTrack('pad')
    const onSelectStrip = vi.fn()
    render(
      <MixerView
        onSelectStrip={onSelectStrip}
        selectedName="pad"
        stripProps={{ meter: false }}
        data-testid="mixer"
      />,
      { wrapper: fixture.wrapper },
    )
    const fader = screen.getByRole('slider', { name: 'Master level' })
    expect(fader).toHaveAttribute('aria-valuenow', '0')
    fireEvent.keyDown(fader, { key: 'ArrowDown' })
    fireEvent.keyDown(fader, { key: 'ArrowDown' })
    const masterGain = engine.master.gainNode as unknown as MockGainNode
    const last = masterGain.gain.events.at(-1)
    expect(last?.method).toBe('setTargetAtTime')
    expect(last?.args[0]).toBeCloseTo(dbToGain(-0.2))

    const strip = screen.getByRole('region', { name: 'pad strip' })
    expect(strip).toHaveClass('lm-strip--selected')
    fireEvent.click(within(strip).getByRole('heading'))
    expect(onSelectStrip).toHaveBeenCalledWith(pad, 'track')
  })

  it('renders explicit lists without a provider and hides the master on request', () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    render(<MixerView tracks={[pad]} master={false} stripProps={{ meter: false }} />)
    expect(screen.getByRole('region', { name: 'pad strip' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Master' })).toBeNull()
    expect(screen.queryByRole('group', { name: 'Groups' })).toBeNull()
  })
})
