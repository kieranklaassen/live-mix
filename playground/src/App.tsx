import { type StripHost } from '@kieranklaassen/live-mix'
import {
  ChannelStripView,
  DeviceChainView,
  Fader,
  Knob,
  LiveMixProvider,
  Meter,
  MixerView,
  ToggleButton,
  TransportBar,
  TimelineView,
  themeStyle,
  themes,
  useTransport,
  type LiveMixThemeName,
  type StripKind,
} from '@kieranklaassen/live-mix/react'
import { useEffect, useState, type CSSProperties } from 'react'

import { createDemo, type Demo, type DemoMode } from './demo'

const THEMES: { name: LiveMixThemeName; attr: string; label: string }[] = [
  { name: 'jaxa-zen', attr: 'light', label: 'JAXA-Zen' },
  { name: 'jaxa-zen-dark', attr: 'dark', label: 'JAXA-Zen dark' },
  { name: 'ambient-water', attr: 'ambient', label: 'Ambient water' },
]

const query = new URLSearchParams(window.location.search)

export function App() {
  const [demo, setDemo] = useState<Demo | null>(null)
  const [theme, setTheme] = useState<LiveMixThemeName>(
    (query.get('theme') as LiveMixThemeName | null) ?? 'jaxa-zen',
  )
  const [selected, setSelected] = useState<{ host: StripHost; kind: StripKind } | null>(null)

  useEffect(() => {
    let current: Demo | null = null
    void createDemo('mock').then((created) => {
      current = created
      setDemo(created)
      setSelected({ host: created.tracks[0], kind: 'track' })
      if (query.get('play') === '1') created.engine.transport.start()
    })
    return () => current?.dispose()
  }, [])

  const switchMode = async (mode: DemoMode): Promise<void> => {
    demo?.dispose()
    setDemo(null)
    const next = await createDemo(mode)
    setDemo(next)
    setSelected({ host: next.tracks[0], kind: 'track' })
  }

  const themeEntry = THEMES.find((entry) => entry.name === theme) ?? THEMES[0]

  return (
    <div className="pg-page" data-lm-theme={themeEntry.attr} style={themeVars(theme)}>
      <header className="pg-header">
        <h1>
          <span>live-mix</span> playground
        </h1>
        <span className="pg-mode">
          {demo
            ? demo.mode === 'mock'
              ? 'demo engine (mock context)'
              : 'real AudioContext'
            : 'loading…'}
        </span>
        <span className="pg-spacer" />
        <label>
          Theme{' '}
          <select
            className="pg-select"
            value={theme}
            onChange={(event) => setTheme(event.target.value as LiveMixThemeName)}
          >
            {THEMES.map((entry) => (
              <option key={entry.name} value={entry.name}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
        <ToggleButton
          pressed={demo?.mode === 'live'}
          onPressedChange={(live) => void switchMode(live ? 'live' : 'mock')}
          tone="accent"
        >
          {demo?.mode === 'live' ? 'Real audio on' : 'Use real audio'}
        </ToggleButton>
      </header>

      {demo ? (
        <LiveMixProvider engine={demo.engine}>
          <section className="pg-section">
            <div className="pg-row">
              <TransportBar data-testid="transport" />
              <Playing />
            </div>
          </section>

          <section className="pg-section">
            <h2>Mixer</h2>
            <MixerView
              returns={demo.returns}
              selectedName={selected?.host.name}
              onSelectStrip={(host, kind) => setSelected({ host, kind })}
              data-testid="mixer"
            />
          </section>

          {selected ? (
            <section className="pg-section">
              <h2>Devices — {selected.host.name}</h2>
              <DeviceChainView strip={selected.host} data-testid="chain" />
            </section>
          ) : null}

          <section className="pg-section">
            <h2>Arrangement</h2>
            <TimelineView lanes={demo.tracks} pixelsPerSecond={48} data-testid="timeline" />
          </section>

          <section className="pg-section">
            <h2>Primitives</h2>
            <Primitives />
          </section>

          <section className="pg-section">
            <h2>Single strip, no meter</h2>
            <ChannelStripView strip={demo.tracks[1]} meter={false} />
          </section>
        </LiveMixProvider>
      ) : null}
    </div>
  )
}

/** The ambient preset is only a token set, so it is applied inline; the others live in the stylesheet. */
function themeVars(theme: LiveMixThemeName): CSSProperties | undefined {
  return theme === 'ambient-water' ? themeStyle(themes[theme]) : undefined
}

function Playing() {
  const t = useTransport()
  return (
    <span className="pg-mode">
      {t.state} · loop {t.loop.enabled ? `${t.loop.lengthSec}s` : 'off'} · pass {t.iteration + 1}
    </span>
  )
}

function Primitives() {
  const [cutoff, setCutoff] = useState(1200)
  const [pan, setPan] = useState(-0.2)
  const [gain, setGain] = useState(0)
  return (
    <div className="pg-primitives">
      <Knob
        label="Cutoff"
        value={cutoff}
        defaultValue={1000}
        min={20}
        max={20000}
        taper="log"
        unit="Hz"
        onChange={setCutoff}
      />
      <Knob
        label="Pan"
        value={pan}
        defaultValue={0}
        min={-1}
        max={1}
        step={0.01}
        bipolar
        unit="pan"
        onChange={setPan}
      />
      <Knob
        label="Gain"
        value={gain}
        defaultValue={0}
        min={-24}
        max={24}
        step={0.1}
        bipolar
        unit="dB"
        onChange={setGain}
      />
      <Knob
        label="Mix"
        defaultValue={0.35}
        min={0}
        max={1}
        step={0.01}
        unit="%"
        format={(v) => `${Math.round(v * 100)} %`}
      />
      <Knob
        label="Type"
        defaultValue={2}
        min={0}
        max={7}
        step={1}
        format={(v) => ['LP', 'HP', 'BP', 'LS', 'HS', 'PK', 'N', 'AP'][v] ?? '?'}
      />
      <Knob label="Off" defaultValue={0.5} min={0} max={1} disabled />
      <Fader
        label="Level"
        defaultValue={-3}
        min={-60}
        max={6}
        step={0.1}
        taper="fader"
        unit="dB"
        ticks={[0.7987]}
      />
      <Fader
        label="Send"
        orientation="horizontal"
        defaultValue={-12}
        min={-60}
        max={6}
        step={0.1}
        taper="fader"
        unit="dB"
        className="pg-h"
      />
      <Meter
        reading={{
          peak: 0.5,
          rms: 0.2,
          peakDb: -6,
          lufs: null,
          lufsShortTerm: -14,
          truePeakDb: -5.2,
          hasMeter: true,
          hasLufs: true,
        }}
        label="Static reading"
      />
    </div>
  )
}
