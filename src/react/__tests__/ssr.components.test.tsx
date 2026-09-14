// Server-side rendering of every kit component: plain Node (no `window`, no
// frame API, no pointer events), `renderToString` from the same snapshots the
// client uses, with the engine on the recording mocks. Nothing here may touch
// the DOM or schedule a frame.

import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { computePeaks } from '../../core/clips/peaks'
import { createEngine, type Engine } from '../../core/Engine'
import { asAudioContext, createMockContext } from '../../testing'
import {
  ChannelStripView,
  DeviceChainView,
  DeviceFrame,
  DevicePanel,
  DeviceToggle,
  Fader,
  Knob,
  LiveMixProvider,
  MasterStripView,
  Meter,
  MixerView,
  themeStyle,
  TimelineView,
  ToggleButton,
  TransportBar,
  Waveform,
  jaxaZenDark,
} from '../index'

async function engineWithContent(): Promise<Engine> {
  const ctx = createMockContext()
  const engine = createEngine({ context: asAudioContext(ctx), master: { meter: true } })
  const pad = engine.addAudioTrack('pad')
  const bass = engine.addAudioTrack('bass')
  engine.addGroup('rhythm', { members: [bass] })
  const filter = await engine.devices.create('filter', engine.context)
  pad.strip.addInsert(filter)
  pad.clips.add({
    id: 'a',
    sourceId: 'tone',
    startSec: 1,
    offsetSec: 0,
    durationSec: 4,
    fadeInSec: 0,
    fadeOutSec: 0,
    fadeCurve: 'linear',
    gainDb: 0,
  })
  engine.transport.seek(2)
  return engine
}

describe('kit components under SSR', () => {
  it('runs without a window', () => {
    expect(typeof window).toBe('undefined')
    expect(typeof requestAnimationFrame).toBe('undefined')
  })

  it('renders the primitives to markup with ARIA state', () => {
    const knob = renderToString(
      <Knob label="Cutoff" defaultValue={1000} min={20} max={20000} taper="log" unit="Hz" />,
    )
    expect(knob).toContain('role="slider"')
    expect(knob).toContain('aria-valuenow="1000"')
    expect(knob).toContain('aria-valuetext="1.00 kHz"')
    expect(knob).toContain('stroke="var(--lm-accent, #E63946)"')

    const fader = renderToString(
      <Fader label="Level" defaultValue={0} min={-60} max={6} taper="fader" unit="dB" />,
    )
    expect(fader).toContain('aria-orientation="vertical"')
    expect(fader).toContain('0.0 dB')

    expect(renderToString(<DeviceToggle pressed onPressedChange={() => {}} />)).toContain(
      'role="switch"',
    )
    expect(
      renderToString(
        <ToggleButton pressed={false} onPressedChange={() => {}} tone="mute">
          M
        </ToggleButton>,
      ),
    ).toContain('aria-pressed="false"')

    const meter = renderToString(
      <Meter
        reading={{
          peak: 0.5,
          rms: 0.25,
          peakDb: -6,
          lufs: null,
          lufsShortTerm: -Infinity,
          truePeakDb: -Infinity,
          hasMeter: true,
          hasLufs: false,
        }}
      />,
    )
    expect(meter).toContain('role="meter"')
    expect(meter).toContain('aria-valuenow="-6"')
    expect(meter).toContain('height:90%')

    const wave = renderToString(
      <Waveform peaks={computePeaks([new Float32Array([0.5, -0.5])], 2, 2)} />,
    )
    expect(wave).toContain('<path d="M 0 0.5000')
  })

  it('renders every engine-bound view inside a provider from the same snapshots', async () => {
    const engine = await engineWithContent()
    const pad = engine.track('pad')
    const html = renderToString(
      <LiveMixProvider engine={engine}>
        <div style={themeStyle(jaxaZenDark)} data-lm-theme="dark">
          <TransportBar data-testid="t" />
          <MixerView data-testid="mixer" />
          <ChannelStripView strip={pad} data-testid="strip" />
          <MasterStripView master={engine.master} />
          <DevicePanel device={pad.strip.inserts[0]} />
          <DeviceChainView strip={pad} />
          <TimelineView pixelsPerSecond={10} data-testid="tl" />
          <DeviceFrame title="Frame">x</DeviceFrame>
        </div>
      </LiveMixProvider>,
    )
    expect(html).toContain('--lm-bg:#141414')
    expect(html).toContain('aria-label="Transport"')
    expect(html).toContain('0:02.0')
    expect(html).toContain('aria-label="pad strip"')
    expect(html).toContain('aria-label="bass strip"')
    expect(html).toContain('aria-label="rhythm strip"')
    expect(html).toContain('aria-label="Master strip"')
    expect(html).toContain('aria-label="Master level"')
    expect(html).toContain('aria-label="Frequency"')
    expect(html).toContain('Preset…')
    expect(html).toContain('aria-label="pad devices"')
    expect(html).toContain('Add device…')
    expect(html).toContain('aria-label="pad clips"')
    expect(html).toContain('left:10px;width:40px')
    expect(html).toContain('lm-timeline__playhead')
    // The strip meter is an effect: on the server there is a placeholder, no analyser.
    expect(html).not.toContain('aria-label="pad level"')
    expect(pad.strip.materialized).toBe(true) // the filter insert materialised it, not the view
    engine.dispose()
  })

  it('renders explicit-object views without a provider', async () => {
    const engine = await engineWithContent()
    const html = renderToString(
      <>
        <TransportBar transport={engine.transport} />
        <Meter source={engine.master} />
        <ChannelStripView strip={engine.track('pad')} meter={false} />
        <TimelineView lanes={[engine.track('pad')]} transport={engine.transport} samples={null} />
      </>,
    )
    expect(html).toContain('aria-label="Transport"')
    expect(html).toContain('role="meter"')
    expect(html).toContain('aria-label="pad strip"')
    expect(html).toContain('aria-label="pad clips"')
    engine.dispose()
  })
})
