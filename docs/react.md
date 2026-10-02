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

| Hook                                      | Reads                                                                                                                       | Writes                                                                                        |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `useEngine()` / `useMaybeEngine()`        | the provided `Engine` (throws / null without one)                                                                           | —                                                                                             |
| `useTransport(transport?, { fps })`       | `state`, `playing`, `position` (frame-sampled while playing), `loop`                                                        | `start`, `pause`, `stop`, `seek`, `setLoop`, `toggle`                                         |
| `useStrip(strip)`                         | `level`, `pan`, `inputGain`, `mute`, `solo`, `audible`, `implicitlyMuted`, `inserts`                                        | `setLevel`, `setPan`, `setMute`, `setSolo`, `addInsert`, …                                    |
| `useTrack(track \| name)`                 | `useStrip` of any track kind, resolved by object or name                                                                    | same                                                                                          |
| `useGroup(group \| name)`                 | `useStrip` plus `members`                                                                                                   | `add`, `remove`                                                                               |
| `useMeter(source?, { fps, active })`      | `peak`, `rms`, `peakDb`, `lufs` reading, `lufsShortTerm`, `truePeakDb`                                                      | —                                                                                             |
| `useDevice(device, { registry })`         | `values`, `bypass`, `params`, `descriptor`, `presets`                                                                       | `setParam`, `setBypass`, `applyPreset`, `capturePreset`, `reset`                              |
| `useDeviceParam(device, name)`            | `value`, `normalized` (taper-aware), `spec`                                                                                 | `set`, `setNormalized`, `reset`                                                               |
| `useLane(lane)`                           | `breakpoints`, `version`, `valueAt`                                                                                         | `add`, `remove`, `replace`, `clear`                                                           |
| `useModulation(matrix?)`                  | `routes`, `targets`, `routesFor`                                                                                            | `map`, `unmap`, `setRoute`, `attach`, `detach`                                                |
| `useSampleStore(store?)`                  | `metrics`, `ids`                                                                                                            | `load`, `forget`, `pin`, `unpin`, `setBudgetBytes`, `evict`                                   |
| `useEngineStats(stats?)`                  | `glitches`, `underrunRatio`, `averageLoad`, `peakLoad`, `supported`, `loadSource`, `glitchSource`, `underrunSec`, `devices` | `reset`, `recordGlitch`                                                                       |
| `useClips(track \| list)`                 | `clips` (sorted)                                                                                                            | `add`, `update`, `remove`, `set`, `replaceFrom`, `clear`                                      |
| `useSchedule(track, { horizonSec, fps })` | `sounding`, `upcoming` (the Scheduler's own window function), `positionSec`, `playing`                                      | —                                                                                             |
| `useControlSurface(surface, { events })`  | `mappings`, `learning`, `lastEvent`                                                                                         | `beginLearn`, `cancelLearn`, `map`, `unmap`, `unmapSource`, …                                 |
| `useLearn(surface, target)`               | `armed`, `busy`, `mapping`, `label` (`CC 74 · ch 1`)                                                                        | `begin`, `cancel`, `toggle`, `unmap`                                                          |
| `useSession(session)`                     | `scenes`, `tracks`, `cells[scene][track]` (slot + state), `statuses`, `quantize`                                            | `launchScene`, `launchSlot`, `releaseSlot`, `stopSlot`, `stopTrack`, `stopAll`, `setQuantize` |
| `useSlot(session, id)`                    | `slot`, `status`, `state`, `playing`, `queued`, `stopping`                                                                  | `launch`, `release`, `stop`                                                                   |

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
the inline style, `ambientWater` is ambient-live's water/moss palette,
`graphite`, `paper` and the other grid themes are below, and `LM_TOKENS` lists
every variable.

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

| Component                                   | What it draws                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Knob`, `Fader`                             | `role="slider"` controls, controlled (`value`) or uncontrolled (`defaultValue`): pointer drag (Shift = fine), wheel, arrows / PageUp / Home / End, double-click reset; `linear`, `log`, `skewed` and `fader` tapers; `onChangeStart` / `onChangeEnd` bracket a gesture                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `Meter`                                     | Peak / RMS / LUFS / true-peak bars on the dB scale (`gainToDb` of the analyser reading) with a peak-hold marker; a `MeterSource` through `useMeter`, or an explicit `reading`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `TransportBar`                              | Play / pause, stop, position (`m:ss.t`), loop toggle with length, loop pass                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `ChannelStripView` (`MixerStrip`)           | Inserts, sends (name, level, thin fader), pan, a dB fader (`−60 … +6`, unity tick, `−∞` at the bottom) that converts through `dbToGain` / `gainToDb`, mute / solo, a meter tapped off the strip output (`meter` prop)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `MixerView`, `MasterStripView`              | Sections for tracks (+ `inputs`), groups, `returns`, and the master (bus fader + engine meter); lists default to the provided engine's `tracks` / `groups`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `DevicePanel` (`DeviceView`), `DeviceFrame` | One taper-aware knob per `ParamSpec` (steps derived from unit and range; `choiceLabels` for enumerations), bypass on the power switch, a preset picker from the registry descriptor; the frame alone for custom bodies                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `DeviceChainView`                           | An insert chain as panels with move earlier / later, a device carried to another place by its title bar or grip, or a plate by its face (pointer events: its name rides the top of the chain, a marker stands in the gap it lands in, Escape leaves it, the chain scrolls near an end; `useChainReorder` for a rack drawn by hand, where `data-lm-drag-handle` marks what a device is taken by), remove (+ dispose) and an add picker over the registry, grouped by category and without instruments. `strip` takes a track, a strip or a bus (`engine.master`); `pinned={n}` hides the first `n` inserts the app owns and keeps them first; `filter` narrows the picker. Under an arbiter, a chain on a strip the score carries (or the master) adds, removes and reorders with `device.add` / `device.remove` / `device.move`, so chain edits are saved and undoable; any other strip is edited on the engine as before |
| `DevicePlate`                               | The same device as an object of its own, drawn from a skin: plate colour, finish, a picture that follows the settings, knobs with the skin's cap. A few knobs on the face, a cell that opens the rest, a name tag, a lamp for power. `DeviceChainView` draws plates when given `skin` (see Device plates below)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `TimelineView`, `Waveform`                  | Lanes per clip source with clips placed in seconds, `sounding` / `upcoming` from `useSchedule`, loop region, a frame-sampled playhead, waveforms from decoded peaks; click or arrow the ruler to seek                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `DeviceToggle`, `ToggleButton`              | The squared power switch and the pressed / unpressed button (mute, solo, loop tones)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `GridView`                                  | The session grid over `useSession` / `useSlot`: scenes × audio tracks, a slot button per cell (`data-state` empty / stopped / queued / playing / recording, stopping, `gate` dashed), scene launch per row, per-track stop row and stop-all, the quantise selector (`quantizeKey` / `quantizeLabel`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

### Device plates

A chain of grey panels says nothing about what is in it. `DevicePlate` draws a
device from a `DeviceSkin`, so each effect is its own object, the way pedals on
a board are:

```tsx
import { DeviceChainView, deviceSkin } from '@kieranklaassen/live-mix/react'

;<DeviceChainView strip={track} skin={deviceSkin} />
```

A skin is five choices and a face:

| Field                    | What it sets                                                                                                                                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plate`, `ink`, `accent` | The plate's colour and its two inks. They reach the plate as `--lm-plate`, `--lm-plate-ink` and `--lm-plate-accent`, and everything on it is drawn in those, so a plate keeps its colours in every theme. |
| `finish`                 | `matte`, `grain`, `brushed`, `speckle`, `hammered`, `linen`, `fade` or `gloss`: SVG noise or a gradient over the plate, light on a dark plate and dark on a light one. No image files.                    |
| `cap`                    | The knobs' cap: `disc`, `dot`, `skirt` or `pointer` (`Knob`'s `cap`; `arc` is the kit's own knob).                                                                                                        |
| `face`, `labels`         | The four knobs on the face and shorter words for them. The rest are behind the `+n` cell, which widens the plate by whole 20 px cells.                                                                    |
| `picture`                | `{ params, draw(at) }`: SVG in a 240 by 140 box, drawn from the positions (0..1) of the parameters it names and again only when one of them moves. More Feedback on the Tape Echo draws more repeats.     |
| `name`                   | The word on the tag when the device's own name is too long for it.                                                                                                                                        |

`DEVICE_SKINS` holds the kit's own, for eighteen of the stock effects.
`deviceSkin(device, skins?)` answers for a chain: the device's skin, else
`QUIET_SKIN` (the theme's colours, no finish, no picture, eight knobs in two
rows) so tools sit quietly between the others, and null for a device that
draws itself (a hosted plug-in), which keeps its `DevicePanel`. Pass your own
table as the second argument, or your own function as `skin`, to add or
replace skins. A plate is 140 px high and `plateLayout(knobs, pictured)` gives
its width.

A plate costs nothing while it sits: the finish and the picture are drawn when
the device is added or one of its knobs moves, not per frame. The names are the
devices' own, and no skin borrows a maker's colours or layout.

### The info view

`InfoView` is the box in the bottom left corner of Ableton Live: point at a
control and it says the control's name and what it does. A control carries
its entry in two attributes, which `infoProps` writes:

```tsx
import { InfoView, infoProps } from '@kieranklaassen/live-mix/react'

function Shell() {
  const shell = useRef<HTMLElement>(null)
  return (
    <main ref={shell}>
      <button {...infoProps('Loop', 'Plays the loop again each time it ends.')}>Loop</button>
      <InfoView root={shell} />
    </main>
  )
}
```

- `infoProps(title, text)` gives `data-lm-info-title` and `data-lm-info`. A
  null title names the control by its `aria-label`, its label or its own short
  text. Paragraphs are split by a line break (`infoText(a, b)` joins them).
- The view shows the nearest entry from the element under the pointer up to
  `root` (`resolveInfo`, `findInfo`). A control without an entry is described
  by its `title` tooltip, and failing that by whatever around it has an entry,
  so nothing a host forgot is blank. An empty `data-lm-info=""` leaves a part
  of the page undescribed. Keyboard focus is followed like the pointer, and a
  control whose text changes when it is pressed is read again.
- The kit's own controls have entries already. `Knob` and `Fader` take an
  `info` sentence and add how they are worked (drag, Shift, what a double-click
  returns to); `DeviceFrame`, `DeviceToggle`, `ToggleButton` and `Meter` take
  `info` too. `DevicePanel` says the descriptor's `description` for the device
  and, for each knob, the parameter's own `ParamSpec.description`, else the
  common meaning of its name (`paramInfo`: Mix, Attack, Feedback, …), and
  describes its preset picker, power switch, readings and remove button;
  `DeviceChainView` its handle, move buttons and add picker. The strips, the
  transport bar, the session grid and the version list say theirs
  (`STRIP_INFO`, `TRANSPORT_INFO` for a host that builds its own).
- `useInfo({ root, disabled })` returns the entry for a view of your own;
  `InfoView` takes `idle` (what it says over nothing), `actions` (a hide
  button in its title row) and `entry` (to draw one without following).

### The paint kit and the grid themes

The grid themes and the pieces a paint-style arranger needs. The grid themes
put the kit on a strict module, `--lm-col` × `--lm-row` (40 × 20 px): square
controls, 28 px knobs that fill one column, a Futura-style sans in a regular
weight (`Jost` first in the stack; load it yourself). They share that geometry
and differ only in colour:

| Theme       |       | Palette                                                      |
| ----------- | ----- | ------------------------------------------------------------ |
| `graphite`  | dark  | green-grey surfaces, mint accent                             |
| `paper`     | light | off-white paper, ink rules, water-to-grass paint             |
| `water`     | dark  | `ambientWater`'s deep water and moss                         |
| `dusk`      | dark  | indigo-grey surfaces, peach accent, paint in dusk colours    |
| `night`     | dark  | near black with a warm cast, dim amber accent, low chrome    |
| `sand`      | light | oat surfaces, brown ink, terracotta accent                   |
| `groovebox` | light | warm grey body, near-black ink, orange accent, primary paint |
| `chalk`     | light | white surfaces, black ink, grey rules, one blue accent       |
| `mist`      | light | cool off-white, blue-grey rules, slate ink, lavender accent  |

Set one with `data-lm-theme="graphite"` (or any name above) or
`themeStyle(graphite)`, and add `className="lm-dense"` on the wrapper for the
density rules (one-row device title bars, no body padding, sentence-case
labels). Every theme also carries a six-colour brush palette (`--lm-brush-N`
to paint with, `--lm-brush-ink-N` for detail and text on it), grid lines
(`--lm-grid-line`, `--lm-grid-line-strong`, `--lm-rule`) and an automation
colour.

Under `lm-dense` a `DeviceChainView` is a rack: panels edge to edge and as tall
as the rack, each panel's knobs in cells 1.5 columns wide that fill top to
bottom in `--lm-rack-rows` rows (default 2; a cell wants three rows of the
module, so set it from the rack's height). `className="lm-device--rack"` gives a
`DevicePanel` outside a chain the same layout.

```tsx
<div data-lm-theme="graphite" className="lm-dense">
  <PaintField columnPx={40} rowPx={20} style={{ height: 240 }}>
    <Stroke
      style={{ position: 'absolute', left: 80, top: 40 }}
      width={320}
      height={40}
      brush={2}
      name="Tabla loop"
      kind={sample.analysis?.kind}
      peaks={sample.peaks}
      repeats={4}
      hits={onsetFractions}
      fadeIn={0.1}
      automation={{
        label: 'Reverb',
        points: [
          [0, 0.2],
          [1, 0.8],
        ],
      }}
      tags={['96 bpm']}
    />
  </PaintField>
  <ChannelRowView strip={engine.track('tabla')} brush={2} />
</div>
```

| Component        | What it draws                                                                                                                                                                                                                                                                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Stroke`         | One sound as a pill: a thin ring in the brush colour around the sound's own waveform (halo, filled shape, fine bars, from `WaveformPeaks`). `repeats` dims later passes behind a dashed seam; `fadeIn` / `fadeOut` close toward the centre line (`crossfade` leaves them unshaded); `hits`, `automation`, `selected`, `muted`, `reversed`, `gain`, `tags` |
| `SoundIcon`      | A 10 px glyph per `SoundKind` (texture, pad, drone, one-shot, melodic, beat loop) plus loop and reverse; `SOUND_KIND_LABELS` names them                                                                                                                                                                                                                   |
| `PaintField`     | The grid the strokes sit on: hairlines every cell, a stronger line every `majorColumns` / `majorRows`                                                                                                                                                                                                                                                     |
| `ChannelRowView` | A strip on its side in one row: brush swatch, name, mute, solo, a horizontal dB fader and a meter, over the same `useStrip` state as `ChannelStripView`                                                                                                                                                                                                   |

`Stroke` is presentational: the host gives it a size in px and everything
along it as fractions of its width, and owns dragging, trimming and painting
(pointer handlers and `data-*` pass through to the root). The geometry is
exported for hosts that hit-test or draw their own (`strokeLevels`,
`levelsOutlinePath`, `fadePaths`, `fadeGainAt`, `repeatSeams`, `hitPositions`,
`automationPositions`). The kind, hits and tempo come from the engine's sound
analysis (`analyzeSound`, or `samples: { analysis: true }` on the engine).

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
