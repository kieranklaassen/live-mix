# React: hooks, the UI kit and the playground

`@kieranklaassen/live-mix/react` is the only entry that imports React
(`react >= 18`, an optional peer). It ships two layers on top of the engine
(R32, KTD11): **headless hooks** that subscribe to the core's change events,
and a **styled kit** built on them and themed through `--lm-*` CSS variables.
Both render on the server from the same snapshots; `.` and `./dsp` never
import React.

## Hooks (U24)

Every hook subscribes through `useSyncExternalStore` to the change events the
core objects expose (`Transport.onChange`, `ChannelStrip.onChange`,
`ClipList.subscribe`, `ParamLane.onChange`, `ModMatrix.onChange`,
`SampleStore.onChange`, `EngineStats.subscribe`, `ObservableDevice.onChange`)
and re-renders only when its snapshot changed. Values the engine does not
announce — the playhead while playing, analyser and LUFS meter levels — are
sampled on `requestAnimationFrame` at a bounded rate (`fps`, default 30).
Setters go through the engine's own ramped calls (never a step).

```tsx
import type { Engine } from '@kieranklaassen/live-mix'
import {
  LiveMixProvider,
  useDeviceParam,
  useEngine,
  useMeter,
  useSchedule,
  useTrack,
  useTransport,
} from '@kieranklaassen/live-mix/react'

function App({ engine }: { engine: Engine | null }) {
  return (
    <LiveMixProvider engine={engine}>
      <Transport />
      <Strip name="pad" />
    </LiveMixProvider>
  )
}

function Transport() {
  const { playing, positionSec, toggle } = useTransport() // engine.transport
  const { peak, lufsShortTerm } = useMeter() // engine.master: analyser peak, LUFS once installed
  return (
    <button onClick={toggle}>
      {playing ? 'Pause' : 'Play'} {positionSec.toFixed(1)} s · {peak.toFixed(2)} ·{' '}
      {lufsShortTerm.toFixed(1)} LUFS
    </button>
  )
}

function Strip({ name }: { name: string }) {
  const pad = useEngine().track(name) // or useTrack(name) to resolve any track kind by name
  const { level, pan, audible, setLevel, setPan, toggleMute, toggleSolo } = useTrack(pad)
  const { sounding, upcoming } = useSchedule(pad, { horizonSec: 8 })
  const cutoff = useDeviceParam(pad.strip.inserts[0], 'frequency')
  // cutoff: { value, normalized, spec, set, setNormalized, reset }
  // …
}
```

| Hook                                      | Reads                                                                                  | Writes                                                                                        |
| ----------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `useEngine()` / `useMaybeEngine()`        | the provided `Engine` (throws / null without one)                                      | —                                                                                             |
| `useTransport(transport?, { fps })`       | `state`, `playing`, `position` (frame-sampled while playing), `loop`                   | `start`, `pause`, `stop`, `seek`, `setLoop`, `toggle`                                         |
| `useStrip(strip)`                         | `level`, `pan`, `inputGain`, `mute`, `solo`, `audible`, `implicitlyMuted`, `inserts`   | `setLevel`, `setPan`, `setMute`, `setSolo`, `addInsert`, …                                    |
| `useTrack(track \| name)`                 | `useStrip` of any track kind, resolved by object or name                               | same                                                                                          |
| `useGroup(group \| name)`                 | `useStrip` plus `members`                                                              | `add`, `remove`                                                                               |
| `useMeter(source?, { fps, active })`      | `peak`, `rms`, `peakDb`, `lufs` reading, `lufsShortTerm`, `truePeakDb`                 | —                                                                                             |
| `useDevice(device, { registry })`         | `values`, `bypass`, `params`, `descriptor`, `presets`                                  | `setParam`, `setBypass`, `applyPreset`, `capturePreset`, `reset`                              |
| `useDeviceParam(device, name)`            | `value`, `normalized` (taper-aware), `spec`                                            | `set`, `setNormalized`, `reset`                                                               |
| `useLane(lane)`                           | `breakpoints`, `version`, `valueAt`                                                    | `add`, `remove`, `replace`, `clear`                                                           |
| `useModulation(matrix?)`                  | `routes`, `targets`, `routesFor`                                                       | `map`, `unmap`, `setRoute`, `attach`, `detach`                                                |
| `useSampleStore(store?)`                  | `metrics`, `ids`                                                                       | `load`, `forget`, `pin`, `unpin`, `setBudgetBytes`, `evict`                                   |
| `useEngineStats(stats?)`                  | `glitches`, `underrunRatio`, `averageLoad`, `peakLoad`, `supported`                    | `reset`, `recordGlitch`                                                                       |
| `useClips(track \| list)`                 | `clips` (sorted)                                                                       | `add`, `update`, `remove`, `set`, `replaceFrom`, `clear`                                      |
| `useSchedule(track, { horizonSec, fps })` | `sounding`, `upcoming` (the Scheduler's own window function), `positionSec`, `playing` | —                                                                                             |
| `useControlSurface(surface, { events })`  | `mappings`, `learning`, `lastEvent`                                                    | `beginLearn`, `cancelLearn`, `map`, `unmap`, `unmapSource`, …                                 |
| `useLearn(surface, target)`               | `armed`, `busy`, `mapping`, `label` (`CC 74 · ch 1`)                                   | `begin`, `cancel`, `toggle`, `unmap`                                                          |
| `useSession(session)`                     | `scenes`, `tracks`, `cells[scene][track]` (slot + state), `statuses`, `quantize`       | `launchScene`, `launchSlot`, `releaseSlot`, `stopSlot`, `stopTrack`, `stopAll`, `setQuantize` |
| `useSlot(session, id)`                    | `slot`, `status`, `state`, `playing`, `queued`, `stopping`                             | `launch`, `release`, `stop`                                                                   |

Hooks that default to an engine part (`useTransport()`, `useMeter()`, …) need
the provider; every hook also takes the object explicitly. `LiveMixProvider`'s
`frame` prop injects a frame scheduler (one rAF loop shared by every sampled
hook; `ManualFrames` in the tests drives it by hand). Building blocks for your
own hooks: `useExternalSnapshot(subscribe, read, isEqual?)`,
`useFrameSampled(active, intervalMs, sample)`, `normalizeParam` /
`denormalizeParam`.

Under automation a knob must `writer.override(engine.now())` before `set` and
`writer.release()` on pointer-up — the hooks do not reach the `LaneWriter`
from a `Device`; the kit's `onChangeStart`/`onChangeEnd` are where a host does
it ([automation § the override](./concepts/automation.md#the-override)).

## The kit (U25)

Styled components over the hooks, from the same entry. Every colour, size and
font they use is a `--lm-*` CSS variable; import the stylesheet for the
defaults (JAXA-Zen: Paper White `#FDFDFB`, Ceramic Grey `#F4F4F0`, Obsidian
`#1A1A1A`, Vermillion `#E63946`; `data-lm-theme="dark"` for the same palette
on Obsidian) or set the tokens yourself — `themeStyle(jaxaZenDark)` returns
the inline style, `ambientWater` is ambient-live's water/moss palette, and
`LM_TOKENS` lists every variable.

```tsx
import '@kieranklaassen/live-mix/react/styles.css'
import {
  DeviceChainView,
  LiveMixProvider,
  MixerView,
  TimelineView,
  TransportBar,
} from '@kieranklaassen/live-mix/react'

function Studio({ engine }: { engine: Engine }) {
  return (
    <LiveMixProvider engine={engine}>
      <TransportBar />
      <MixerView returns={[hall]} onSelectStrip={(host) => select(host)} />
      <DeviceChainView strip={engine.track('pad')} />
      <TimelineView pixelsPerSecond={48} />
    </LiveMixProvider>
  )
}
```

| Component                                   | What it draws                                                                                                                                                                                                                                                                                        |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Knob`, `Fader`                             | `role="slider"` controls, controlled (`value`) or uncontrolled (`defaultValue`): pointer drag (Shift = fine), wheel, arrows / PageUp / Home / End, double-click reset; `linear`, `log`, `skewed` and `fader` tapers; `onChangeStart` / `onChangeEnd` bracket a gesture                               |
| `Meter`                                     | Peak / RMS / LUFS / true-peak bars on the dB scale (`gainToDb` of the analyser reading) with a peak-hold marker; a `MeterSource` through `useMeter`, or an explicit `reading`                                                                                                                        |
| `TransportBar`                              | Play / pause, stop, position (`m:ss.t`), loop toggle with length, loop pass                                                                                                                                                                                                                          |
| `ChannelStripView` (`MixerStrip`)           | Inserts, sends (name, level, thin fader), pan, a dB fader (`−60 … +6`, unity tick, `−∞` at the bottom) that converts through `dbToGain` / `gainToDb`, mute / solo, a meter tapped off the strip output (`meter` prop)                                                                                |
| `MixerView`, `MasterStripView`              | Sections for tracks (+ `inputs`), groups, `returns`, and the master (bus fader + engine meter); lists default to the provided engine's `tracks` / `groups`                                                                                                                                           |
| `DevicePanel` (`DeviceView`), `DeviceFrame` | One taper-aware knob per `ParamSpec` (steps derived from unit and range; `choiceLabels` for enumerations), bypass on the power switch, a preset picker from the registry descriptor; the frame alone for custom bodies                                                                               |
| `DeviceChainView`                           | A strip's inserts as panels with move earlier / later, drag-and-drop reorder (`reorderInserts`), remove (+ dispose) and an add picker over the registry                                                                                                                                              |
| `TimelineView`, `Waveform`                  | Lanes per clip source with clips placed in seconds, `sounding` / `upcoming` from `useSchedule`, loop region, a frame-sampled playhead, waveforms from decoded peaks; click or arrow the ruler to seek                                                                                                |
| `DeviceToggle`, `ToggleButton`              | The squared power switch and the pressed / unpressed button (mute, solo, loop tones)                                                                                                                                                                                                                 |
| `GridView`                                  | The session grid over `useSession` / `useSlot`: scenes × audio tracks, a slot button per cell (`data-state` empty / stopped / queued / playing / recording, stopping, `gate` dashed), scene launch per row, per-track stop row and stop-all, the quantise selector (`quantizeKey` / `quantizeLabel`) |

`useParamControl` is the shared interaction hook for custom controls, and the
pure maths (`normalizeValue`, `quantize`, `faderDbToLevel`,
`dbToMeterPosition`, `formatControlValue`, `paramStep`, …) is exported for
hosts that draw their own. **Visual = audio** (R33, KD9): every value shown
derives from the DSP's own formula — fader dB is `gainToDb` of the strip
level, meter positions are `gainToDb` of the analyser peak, knob positions are
`useDeviceParam`'s taper, timeline `sounding`/`upcoming` is the Scheduler's own
window function, and modulator previews use `renderModulator`. Component
tests run in jsdom (pointer, wheel and keyboard through
`@testing-library/react`), and every component renders under
`react-dom/server`.

Things the kit leaves to the host today: `Engine` has no public list of
returns / live inputs / instruments as strips, so `MixerView` takes `returns`
/ `inputs` props; `ChannelStripView meter={true}` (the default) taps an
analyser off `strip.output` on mount, which materialises the strip's nodes —
pass `meter={false}` where a recorded-node-order harness is watching; the
master `Bus` keeps no commanded level, so its fader is uncontrolled.

## The playground

`playground/` is a Vite app in this repository (not published) that mounts
the kit on a demo **score** — four tracks, a group, a return, sends, clips
over synthesised tones, a filter, an EQ, a compressor, three scenes of slots —
and is the quickest way to see the engine move:

```sh
pnpm playground              # http://localhost:5199/  (?play=1 starts the transport, ?theme=jaxa-zen-dark)
pnpm playground:build        # static build into playground/dist
pnpm playground:smoke        # build + the Playwright smoke spec in headless Chrome; screenshots into playground/screenshots/
```

The demo is a `ScoreDocument` the engine follows through `loadScore`, so the
three ways of driving the engine meet on one page: the **mixer, device chain
and timeline** (the kit over the engine); the **agent console** — every tool
the demo's `AgentController` lists, JSON arguments, call or dry-run, with the
result, the snapshot and the operation log beside it; the **session grid** —
scenes × slots over `useSession`, launches landing as clips on the timeline;
and **Render offline**, which bounces the same document with `renderScore` on
an `OfflineAudioContext` (WASM devices and all, agent edits included) and
offers the WAV.

It starts on the library's **recording mock context** (clock and analysers
driven by timers, so it renders headless and without an audio permission) and
switches to a real `AudioContext` on **Use real audio**. With real audio the
device registry gains the nine stock WASM devices: the hall return becomes
ambient-live's Dattorro plate and the keys track gets kkfonie's StereoWidener
after its EQ, so the device catalogue, the add picker and the panels show
node and WASM devices side by side. `window.playground.demo` is the running
demo for the console. The grid on the page is the playground's own minimal
one over `useSession`; the kit's styled `GridView` is a follow-up.

The page imports the library from `src/` (aliases in
`playground/vite.config.ts`), so edits hot-reload; that also means the dsp
entry's `new URL('../worklets/…', import.meta.url)` has nothing to point at,
which the config solves by serving `dist/worklets` at `/worklets/` and the
demo by passing `processorUrl` to every WASM factory — the consumer escape
hatch from [getting started §3](./getting-started.md#3-worklet-and-wasm-asset-resolution)
in use. Run `pnpm build` once so `dist/worklets` exists.

`browser-tests/specs/playground.smoke.spec.ts` is the headless check, part of
the one Playwright suite (`pnpm test:browser`, the installed Google Chrome or
`LIVE_MIX_BROWSER=chromium`): it loads the built page, clicks **Use real
audio** (a real pointer gesture), presses play and waits for signal at the
master meter, selects the keys strip and checks two device panels, presses
**Render offline** and checks the bounce's peak, calls `set_music_volume`
from the agent console and checks the pad strip followed, checks the AE2
clamp on `level: 3` and undo, launches the "Groove" scene and waits for its
drums slot to play as a placed clip, then screenshots the mixer, the device
chain, the agent console, the grid and the page into
`playground/screenshots/`. Any console error, page exception or failed load
fails it. `pnpm playground:smoke` builds the playground and runs just this
spec; `scripts/ci-local.sh` runs it when Google Chrome is present
(`--skip-playground`, or `--browser` for the whole suite with the real-audio
golden), and the `docs` CI job uploads the screenshots.
