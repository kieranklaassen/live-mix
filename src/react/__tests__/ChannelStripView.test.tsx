// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { dbToGain, gainToDb } from '../../core/devices/native/units'
import { type MockGainNode } from '../../testing'
import { ChannelStripView } from '../components/ChannelStripView'
import { FADER_MIN_DB } from '../components/control-math'
import { createTestEngine } from './harness'

afterEach(cleanup)

const mock = (node: AudioNode | null | undefined): MockGainNode => node as unknown as MockGainNode

describe('ChannelStripView', () => {
  it('shows the name, a dB fader at unity, a centred pan knob and mute/solo', () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    render(<ChannelStripView strip={pad} data-testid="pad" meter={false} />, {
      wrapper: fixture.wrapper,
    })
    const strip = screen.getByRole('region', { name: 'pad strip' })
    expect(within(strip).getByRole('heading', { name: 'pad' })).toBeInTheDocument()
    const fader = screen.getByRole('slider', { name: 'Level' })
    expect(fader).toHaveAttribute('aria-valuenow', '0')
    expect(fader).toHaveAttribute('aria-valuetext', '0.0 dB')
    expect(screen.getByRole('slider', { name: 'Pan' })).toHaveAttribute('aria-valuetext', 'C')
    expect(screen.getByRole('button', { name: 'Mute' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Solo' })).toHaveAttribute('aria-pressed', 'false')
    expect(strip.querySelector('.lm-fader__tick')).not.toBeNull()
  })

  it('fader dB ↔ strip level through the DSP law; −∞ at the bottom sets 0', () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    render(<ChannelStripView strip={pad} meter={false} />, { wrapper: fixture.wrapper })
    const fader = screen.getByRole('slider', { name: 'Level' })
    fireEvent.keyDown(fader, { key: 'ArrowDown' })
    expect(pad.strip.level).toBeCloseTo(dbToGain(-0.1))
    expect(fader).toHaveAttribute('aria-valuetext', '-0.1 dB')
    fireEvent.keyDown(fader, { key: 'Home' })
    expect(pad.strip.level).toBe(0)
    expect(fader).toHaveAttribute('aria-valuenow', String(FADER_MIN_DB))
    expect(fader).toHaveAttribute('aria-valuetext', '-∞ dB')
    // The strip ramps: the fader node saw setTargetAtTime, never a step.
    const faderNode = mock(pad.strip.fader)
    expect(faderNode.gain.events.map((event) => event.method)).toContain('setTargetAtTime')
    expect(faderNode.gain.events.map((event) => event.method)).not.toContain('setValueAtTime')

    act(() => pad.strip.setLevel(0.5))
    expect(Number(fader.getAttribute('aria-valuenow'))).toBeCloseTo(gainToDb(0.5), 1)
    fireEvent.doubleClick(fader)
    expect(pad.strip.level).toBe(1)
  })

  it('pans, mutes and solos through the strip and reflects solo gates from elsewhere', () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const bass = fixture.engine.addAudioTrack('bass')
    const { container } = render(<ChannelStripView strip={pad} meter={false} />, {
      wrapper: fixture.wrapper,
    })
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Pan' }), { key: 'End' })
    expect(pad.strip.pan).toBe(1)
    expect(screen.getByRole('slider', { name: 'Pan' })).toHaveAttribute('aria-valuetext', 'R50')

    fireEvent.click(screen.getByRole('button', { name: 'Mute' }))
    expect(pad.strip.mute).toBe(true)
    expect(container.firstChild).toHaveClass('lm-strip--muted')
    fireEvent.click(screen.getByRole('button', { name: 'Mute' }))
    expect(pad.strip.mute).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'Solo' }))
    expect(pad.strip.solo).toBe(true)
    expect(container.firstChild).toHaveClass('lm-strip--soloed')
    act(() => pad.strip.setSolo(false))
    act(() => bass.strip.setSolo(true))
    expect(pad.strip.implicitlyMuted).toBe(true)
    expect(container.firstChild).toHaveClass('lm-strip--implicit-muted')
  })

  it('taps a meter off the strip output by default and removes it on unmount', () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const before = fixture.ctx.analysers.length
    const { unmount } = render(<ChannelStripView strip={pad} />, { wrapper: fixture.wrapper })
    expect(fixture.ctx.analysers.length).toBe(before + 1)
    const tap = fixture.ctx.analysers[before]
    expect(mock(pad.strip.gate).isConnectedTo(tap)).toBe(true)
    expect(screen.getByRole('meter', { name: 'pad level' })).toBeInTheDocument()
    tap.level = 0.5
    act(() => fixture.frames.flush(1000))
    expect(screen.getByRole('meter').getAttribute('aria-valuenow')).not.toBe('-60')
    unmount()
    expect(fixture.ctx.analysers.length).toBe(before + 1)
    expect(mock(pad.strip.gate).isConnectedTo(tap)).toBe(false)
  })

  it('lists inserts and sends; a levelled send gets a horizontal fader', async () => {
    const fixture = createTestEngine()
    const { engine } = fixture
    const pad = engine.addAudioTrack('pad')
    const filter = await engine.devices.create('filter', engine.context)
    pad.strip.addInsert(filter)
    const reverb = await engine.devices.create('delay', engine.context)
    const hall = engine.addReturnTrack('hall', { device: reverb })
    pad.strip.sends.add(hall, { level: 0.5 })
    render(<ChannelStripView strip={pad} meter={false} />, { wrapper: fixture.wrapper })
    expect(
      within(screen.getByRole('list', { name: 'Inserts' })).getByText('filter'),
    ).toBeInTheDocument()
    const send = screen.getByRole('slider', { name: 'hall' })
    expect(send).toHaveAttribute('aria-orientation', 'horizontal')
    expect(Number(send.getAttribute('aria-valuenow'))).toBeCloseTo(gainToDb(0.5), 1)
    fireEvent.keyDown(send, { key: 'End' })
    const sendGain = mock(pad.strip.sends.all()[0].gainNode)
    expect(sendGain.gain.events.at(-1)?.method).toBe('setTargetAtTime')
    act(() => {
      filter.bypass = true
    })
    expect(screen.getByText('filter')).toHaveClass('lm-strip__insert--bypassed')
  })

  it('accepts a bare ChannelStrip, a display name and a kind', () => {
    const fixture = createTestEngine()
    const drums = fixture.engine.addGroup('drums')
    const { container } = render(
      <ChannelStripView
        strip={drums.strip}
        kind="group"
        name="Drums"
        meter={false}
        showPan={false}
      />,
      { wrapper: fixture.wrapper },
    )
    expect(container.firstChild).toHaveClass('lm-strip--group')
    expect(screen.getByRole('heading', { name: 'Drums' })).toBeInTheDocument()
    expect(screen.queryByRole('slider', { name: 'Pan' })).toBeNull()
  })
})
