import {
  describeOperation,
  wavBlob,
  type AgentController,
  type ScoreDocument,
  type StripHost,
  type ToolResult,
} from '@kieranklaassen/live-mix'
import {
  ChannelStripView,
  DeviceChainView,
  Fader,
  GridView,
  Knob,
  LiveMixProvider,
  Meter,
  MixerView,
  ToggleButton,
  TransportBar,
  TimelineView,
  themeStyle,
  themes,
  useEngine,
  useTransport,
  type LiveMixThemeName,
  type StripKind,
} from '@kieranklaassen/live-mix/react'
import { useEffect, useState, type CSSProperties } from 'react'

import { LOOP_SEC, createDemo, renderDemo, type Demo, type DemoMode, type DemoRender } from './demo'
import { useDocumentVersion } from './useDocumentVersion'

const THEMES: { name: LiveMixThemeName; attr: string; label: string }[] = [
  { name: 'jaxa-zen', attr: 'light', label: 'JAXA-Zen' },
  { name: 'jaxa-zen-dark', attr: 'dark', label: 'JAXA-Zen dark' },
  { name: 'ambient-water', attr: 'ambient', label: 'Ambient water' },
]

const query = new URLSearchParams(window.location.search)

/** The running demo, for the console and the browser smoke spec (`window.playground.demo`). */
function expose(demo: Demo | null): void {
  ;(window as unknown as { playground: { demo: Demo | null } }).playground = { demo }
}

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
      expose(created)
      setSelected({ host: created.tracks[0], kind: 'track' })
      if (query.get('play') === '1') created.engine.transport.start()
    })
    return () => {
      current?.dispose()
      expose(null)
    }
  }, [])

  const switchMode = async (mode: DemoMode): Promise<void> => {
    demo?.dispose()
    setDemo(null)
    expose(null)
    const next = await createDemo(mode)
    setDemo(next)
    expose(next)
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
          data-testid="mode-toggle"
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
              <RenderPanel document={demo.document} />
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
            <section className="pg-section" data-testid="devices">
              <h2>Devices — {selected.host.name}</h2>
              <DeviceChainView strip={selected.host} data-testid="chain" />
            </section>
          ) : null}

          <section className="pg-section">
            <h2>Device catalogue</h2>
            <DeviceCatalogue />
          </section>

          <section className="pg-section" data-testid="agent">
            <h2>Agent console — U29 tool surface over the score</h2>
            <AgentConsole agent={demo.agent} document={demo.document} />
          </section>

          <section className="pg-section" data-testid="grid-section">
            <h2>Session grid — scenes × slots over the same clips</h2>
            <GridView session={demo.session} data-testid="grid" />
          </section>

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
    <span className="pg-mode" data-testid="transport-state">
      {t.state} · loop {t.loop.enabled ? `${t.loop.lengthSec}s` : 'off'} · pass {t.iteration + 1}
    </span>
  )
}

type RenderState =
  | { status: 'idle' }
  | { status: 'rendering' }
  | { status: 'done'; render: DemoRender; url: string }
  | { status: 'failed'; message: string }

/**
 * Bounce the demo session offline (U33) and offer the WAV. The render builds
 * the same session on an `OfflineAudioContext`, independent of the engine on
 * screen, so it works from the mock demo too.
 */
function RenderPanel({ document }: { document: ScoreDocument }) {
  const [state, setState] = useState<RenderState>({ status: 'idle' })

  useEffect(() => {
    if (state.status !== 'done') return
    const { url } = state
    return () => URL.revokeObjectURL(url)
  }, [state])

  const render = async (): Promise<void> => {
    setState({ status: 'rendering' })
    try {
      const render = await renderDemo(document)
      const url = URL.createObjectURL(wavBlob(render.result.audio, { bitDepth: 16 }))
      setState({ status: 'done', render, url })
    } catch (error) {
      setState({
        status: 'failed',
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const label = ((): string => {
    switch (state.status) {
      case 'idle':
        return ''
      case 'rendering':
        return 'rendering…'
      case 'done': {
        const { render } = state
        const peak = Number.isFinite(render.peakDb) ? `${render.peakDb.toFixed(1)} dBFS` : '−∞'
        return `${render.result.durationSec} s · peak ${peak} · aligned ${render.alignedSamples} samples`
      }
      case 'failed':
        return `failed: ${state.message}`
      default: {
        const _exhaustive: never = state
        return _exhaustive
      }
    }
  })()

  return (
    <div className="pg-row pg-render" data-testid="render" data-status={state.status}>
      <ToggleButton
        pressed={state.status === 'rendering'}
        onPressedChange={() => void render()}
        disabled={state.status === 'rendering'}
        data-testid="render-button"
      >
        Render offline ({LOOP_SEC} s)
      </ToggleButton>
      <span className="pg-mode" data-testid="render-status">
        {label}
      </span>
      {state.status === 'done' ? (
        <a className="pg-link" href={state.url} download="live-mix-playground.wav">
          Download WAV
        </a>
      ) : null}
    </div>
  )
}

/** Every device the demo engine can create, from its registry (node devices always; WASM with real audio). */
function DeviceCatalogue() {
  const engine = useEngine()
  const list = engine.devices.list()
  return (
    <table className="pg-catalogue" data-testid="catalogue">
      <thead>
        <tr>
          <th>id</th>
          <th>name</th>
          <th>kind</th>
          <th>category</th>
          <th>params</th>
          <th>presets</th>
        </tr>
      </thead>
      <tbody>
        {list.map((descriptor) => (
          <tr key={descriptor.id}>
            <td>
              <code>{descriptor.id}</code>
            </td>
            <td>{descriptor.name}</td>
            <td>{descriptor.kind}</td>
            <td>{descriptor.category}</td>
            <td>{Object.keys(descriptor.params).length}</td>
            <td>{descriptor.presets ? Object.keys(descriptor.presets).length : 0}</td>
          </tr>
        ))}
      </tbody>
    </table>
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

/** Ready-made calls for the console; every other tool is reachable from the picker. */
const QUICK_CALLS: { id: string; label: string; tool: string; args: Record<string, unknown> }[] = [
  { id: 'music-down', label: 'music −6 dB', tool: 'set_music_volume', args: { level: 0.4 } },
  {
    id: 'music-clamped',
    label: 'music 300 % (clamped)',
    tool: 'set_music_volume',
    args: { level: 3 },
  },
  { id: 'calmer', label: 'steer calmer', tool: 'steer_music', args: { direction: 'calmer' } },
  { id: 'stronger', label: 'steer stronger', tool: 'steer_music', args: { direction: 'stronger' } },
  { id: 'more-space', label: 'more space', tool: 'more_space', args: {} },
  {
    id: 'pan-keys',
    label: 'pan keys left',
    tool: 'strip_set',
    args: { owner: 'keys', param: 'pan', value: -0.5 },
  },
  {
    id: 'mute-drums',
    label: 'mute drums',
    tool: 'strip_mute',
    args: { owner: 'drums', mute: true },
  },
  { id: 'get-state', label: 'get state', tool: 'get_state', args: {} },
  { id: 'undo', label: 'undo', tool: 'undo', args: {} },
]

/**
 * The agent API as a person would drive it: pick a tool, edit its JSON
 * arguments, call it (or dry-run it) and read the result, the snapshot and
 * the operation log the call left behind. Everything the console does goes
 * through `agent.call`, so the mixer above follows.
 */
function AgentConsole({ agent, document }: { agent: AgentController; document: ScoreDocument }) {
  const version = useDocumentVersion(document)
  const tools = agent.listTools()
  const [tool, setTool] = useState('set_music_volume')
  const [args, setArgs] = useState('{ "level": 0.4 }')
  const [result, setResult] = useState<ToolResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const call = (name: string, parsed: Record<string, unknown>, dryRun = false): void => {
    setError(null)
    setResult(agent.call(name, parsed, { dryRun }))
  }
  const callFromForm = (dryRun: boolean): void => {
    let parsed: unknown
    try {
      parsed = args.trim() === '' ? {} : JSON.parse(args)
    } catch (parseError) {
      setError(`arguments are not JSON: ${String(parseError)}`)
      return
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      setError('arguments must be a JSON object')
      return
    }
    call(tool, parsed as Record<string, unknown>, dryRun)
  }
  const pick = (name: string, quickArgs: Record<string, unknown>): void => {
    setTool(name)
    setArgs(JSON.stringify(quickArgs))
    call(name, quickArgs)
  }

  const selected = tools.find((definition) => definition.name === tool)
  const snapshot = agent.snapshot()
  const recent = document.log.entries.slice(-6).reverse()

  return (
    <div className="pg-agent">
      <div className="pg-row pg-agent__quick">
        {QUICK_CALLS.filter((quick) =>
          tools.some((definition) => definition.name === quick.tool),
        ).map((quick) => (
          <ToggleButton
            key={quick.id}
            pressed={false}
            onPressedChange={() => pick(quick.tool, quick.args)}
            tone="accent"
            data-testid={`agent-quick-${quick.id}`}
          >
            {quick.label}
          </ToggleButton>
        ))}
      </div>
      <div className="pg-row pg-agent__form">
        <label>
          Tool{' '}
          <select
            className="pg-select"
            value={tool}
            onChange={(event) => setTool(event.target.value)}
            data-testid="agent-tool"
          >
            {tools.map((definition) => (
              <option key={definition.name} value={definition.name}>
                {definition.name} · {definition.category}
              </option>
            ))}
          </select>
        </label>
        <input
          className="pg-input"
          value={args}
          onChange={(event) => setArgs(event.target.value)}
          spellCheck={false}
          aria-label="Tool arguments (JSON)"
          data-testid="agent-args"
        />
        <ToggleButton
          pressed={false}
          onPressedChange={() => callFromForm(false)}
          data-testid="agent-call"
        >
          Call
        </ToggleButton>
        <ToggleButton pressed={false} onPressedChange={() => callFromForm(true)} tone="mute">
          Dry run
        </ToggleButton>
        <span className="pg-mode">
          {tools.length} tools · {version} operations logged
        </span>
      </div>
      {selected ? <p className="pg-agent__description">{selected.description}</p> : null}
      {error ? (
        <pre className="pg-agent__out pg-agent__out--error" data-testid="agent-error">
          {error}
        </pre>
      ) : null}
      <div className="pg-agent__panes">
        <div>
          <h3>Result</h3>
          <pre
            className="pg-agent__out"
            data-testid="agent-result"
            data-ok={result ? String(result.ok) : ''}
          >
            {result ? JSON.stringify(result, null, 2) : 'nothing called yet'}
          </pre>
        </div>
        <div>
          <h3>Snapshot ({JSON.stringify(snapshot).length} bytes)</h3>
          <pre className="pg-agent__out" data-testid="agent-snapshot">
            {JSON.stringify(snapshot, null, 2)}
          </pre>
        </div>
        <div>
          <h3>Operation log (latest first)</h3>
          <ol className="pg-agent__log" data-testid="agent-log">
            {recent.map((entry) => (
              <li key={entry.seq}>
                <code>#{entry.seq}</code> {entry.kind} · {entry.author.kind}:{entry.author.id} ·{' '}
                {entry.label ?? describeOperation(entry.op)}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
