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
  ChangedMark,
  ChannelRowView,
  ChannelStripView,
  Check,
  ContextChip,
  CutNotch,
  CutSeam,
  DeviceChainView,
  DeviceFrame,
  DevicePanel,
  DeviceToggle,
  Fader,
  Glyph,
  InfoView,
  InlineNote,
  Input,
  JobRow,
  Knob,
  Lane,
  LaneHead,
  LinkMark,
  LiveMixProvider,
  LogRow,
  MasterStripView,
  Menu,
  MenuItem,
  Meter,
  MixerView,
  NoteBubble,
  NotePin,
  NoteSpan,
  Overview,
  PaintField,
  Panel,
  PanelHead,
  PictureMark,
  Playhead,
  Progress,
  PropRow,
  RangeSelection,
  ReferenceChip,
  SectionLabel,
  Segmented,
  Select,
  Sheet,
  SoundIcon,
  StateMark,
  Stroke,
  Tabs,
  TextButton,
  themeStyle,
  TimelineItem,
  TimelineView,
  TimeRuler,
  ToggleButton,
  TranscriptWord,
  TransitionMark,
  TransportBar,
  VideoStroke,
  Waveform,
  WhoMark,
  graphite,
  jaxaZenDark,
  paper,
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

    // The info view draws its idle line on the server and follows the pointer only in a browser.
    const info = renderToString(<InfoView />)
    expect(info).toContain('Point at a control to read what it does.')
    expect(knob).toContain('data-lm-info-title="Cutoff"')
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

  it('renders the paint kit to markup', async () => {
    const peaks = computePeaks([new Float32Array([0.5, -0.5, 0.25, -1])], 4, 4)
    const html = renderToString(
      <div style={themeStyle(graphite)} data-lm-theme="graphite" className="lm-dense">
        <PaintField columnPx={40} rowPx={20}>
          <Stroke
            width={200}
            height={40}
            brush={2}
            name="Creek, low"
            kind="texture"
            peaks={peaks}
            repeats={2}
            fadeIn={0.2}
            hits={[0.1]}
            automation={{
              label: 'Level',
              points: [
                [0, 0],
                [1, 1],
              ],
            }}
            selected
          />
        </PaintField>
        <SoundIcon kind="drone" label="Drone" />
      </div>,
    )
    expect(html).toContain('--lm-bg:#232826')
    expect(html).toContain('--lm-field-col:40px')
    expect(html).toContain('lm-stroke lm-stroke--b2 lm-stroke--selected')
    expect(html).toContain('width:200px;height:40px;border-radius:20px')
    expect(html).toContain('Creek, low')
    expect(html).toContain('lm-stroke__seam')
    expect(html).toContain('lm-stroke__fade-curve')
    expect(html).toContain('lm-stroke__automation-line')
    expect(html).toContain('aria-label="Drone"')

    const engine = await engineWithContent()
    const row = renderToString(
      <LiveMixProvider engine={engine}>
        <ChannelRowView strip={engine.track('bass')} brush={1} />
      </LiveMixProvider>,
    )
    expect(row).toContain('aria-label="bass strip"')
    expect(row).toContain('aria-orientation="horizontal"')
    engine.dispose()
  })

  it('renders the video kit to markup: a timeline, a panel, a sheet and a note', () => {
    const timeline = renderToString(
      <div style={themeStyle(paper)} data-lm-theme="paper" className="lm-app">
        <TimeRuler pxPerSecond={20} width={400} role="slider" aria-label="Playhead">
          <RangeSelection x={40} width={80} />
          <CutNotch x={200} label="2.4 s removed" />
          <Playhead x={120} flag />
        </TimeRuler>
        <LaneHead
          name="Display"
          brush={2}
          height={40}
          glyph={<Glyph kind="display" />}
          mute={false}
          solo={false}
        />
        <LinkMark top={0} height={80} />
        <PaintField columnPx={40} rowPx={20}>
          <Lane top={0} height={40} role="group" aria-label="Display track">
            <VideoStroke
              width={300}
              height={40}
              brush={2}
              name="Display"
              hits={[0.5]}
              tags={['1.5×']}
              selected
            />
            <TransitionMark width={8} height={20} />
          </Lane>
          <Lane top={40} height={20}>
            <TimelineItem width={120} shape="envelope" name="2.2×" rampIn={20} rampOut={20} />
            <TimelineItem width={90} name="Welcome" fadeIn={0.3} glyph={<Glyph kind="title" />} />
            <TimelineItem width={90} shape="span" name="Side by side" rampIn={12} />
            <NoteSpan x={0} width={60} />
            <NotePin x={0} number={1} text="Cut here" line={{ height: 60 }} />
          </Lane>
          <CutSeam x={200} top={0} height={60} />
          <Playhead x={120} />
        </PaintField>
        <Overview
          duration={120}
          windowStart={0}
          windowEnd={20}
          playhead={6}
          cuts={[60]}
          notes={[30]}
        />
      </div>,
    )
    expect(timeline).toContain('--lm-note:#8a3fa3')
    expect(timeline).toContain('--lm-lane-head-width:160px')
    expect(timeline).toContain('role="slider"')
    expect(timeline).toContain('--lm-ruler-minor:40px')
    expect(timeline).toContain('lm-playhead__flag')
    expect(timeline).toContain('aria-label="Mute Display"')
    expect(timeline).toContain('lm-vstroke lm-vstroke--b2 lm-vstroke--selected')
    expect(timeline).toContain('width:300px;height:40px;border-radius:20px')
    expect(timeline).toContain('lm-item lm-item--envelope')
    expect(timeline).toContain('M0 19.5L20 3.5H100L120 19.5Z')
    expect(timeline).toContain('lm-item--fade-in')
    expect(timeline).toContain('aria-label="Note 1: Cut here"')
    expect(timeline).toContain('width:12px')
    expect(timeline).toContain('left:5%')

    const chrome = renderToString(
      <Panel aria-label="Agent">
        <Tabs
          tabs={[
            { id: 'inspector', label: 'Inspector' },
            { id: 'agent', label: 'Agent', count: 2 },
          ]}
          selected="agent"
          onSelect={() => {}}
        />
        <PanelHead title="Agent" glyph={<Glyph kind="agent" />} />
        <SectionLabel>Jobs</SectionLabel>
        <JobRow title="Export" state="running" progress={0.5} onCancel={() => {}} />
        <LogRow
          who="agent"
          name="Agent"
          title="Split"
          time="12:04"
          outcome={{ ok: false, error: 'Nothing there.' }}
        />
        <PropRow label="Model" htmlFor="model">
          <Select id="model" value="opus" options={['opus', 'sonnet']} onChange={() => {}} />
        </PropRow>
        <Input value="" onChange={() => {}} placeholder="Ask the agent…" boxed />
        <Segmented options={[{ value: 'a', label: 'Timeline' }]} value="a" onChange={() => {}} />
        <Check checked onChange={() => {}} label="Snap" />
        <TextButton variant="primary" shortcut="⏎">
          Send
        </TextButton>
        <Menu items={[{ label: 'Claude Code', onSelect: () => {} }, 'separator']}>
          <MenuItem onSelect={() => {}}>Codex</MenuItem>
        </Menu>
        <InlineNote tone="danger" role="alert" title="Nothing was imported." />
        <Progress value={0.25} label="Zooms" />
        <StateMark state="busy" />
        <WhoMark who="outside" />
        <TranscriptWord text="um" state="removed" />
        <ContextChip kind="note" number={2} text="Cut here" onRemove={() => {}} />
        <ReferenceChip kind="moment" label="00:44.0" onGo={() => {}} />
        <ChangedMark />
        <PictureMark
          kind="arrow"
          points={[
            [0, 0],
            [40, 40],
          ]}
          number={2}
        />
        <NoteBubble number={2} text="Blur this" editing />
      </Panel>,
    )
    expect(chrome).toContain('role="tablist"')
    expect(chrome).toContain('aria-selected="true"')
    expect(chrome).toContain('role="progressbar"')
    expect(chrome).toContain('aria-label="Cancel Export"')
    expect(chrome).toContain('Refused: <!-- -->Nothing there.')
    expect(chrome).toContain('for="model"')
    expect(chrome).toContain('placeholder="Ask the agent…"')
    expect(chrome).toContain('aria-pressed="true"')
    expect(chrome).toContain('role="menu"')
    expect(chrome).toContain('role="alert"')
    expect(chrome).toContain('lm-who lm-who--outside')
    expect(chrome).toContain('lm-word lm-word--removed')
    expect(chrome).toContain('aria-label="Leave out Cut here"')
    expect(chrome).toContain('aria-label="Changed by the agent"')
    expect(chrome).toContain('lm-mark lm-mark--arrow')
    expect(chrome).toContain('lm-notebubble__caret')

    // A sheet takes the focus in an effect; on the server it is only its markup.
    const sheet = renderToString(
      <Sheet title="Import" onClose={() => {}} footer={<TextButton>Open in the editor</TextButton>}>
        <p>Three channels found.</p>
      </Sheet>,
    )
    expect(sheet).toContain('role="dialog"')
    expect(sheet).toContain('aria-modal="true"')
    expect(sheet).toContain('Three channels found.')
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
