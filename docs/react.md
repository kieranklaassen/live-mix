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
| `useTransport(transport?, { fps })`       | `state`, `playing`, `position` (frame-sampled while playing), `pass` (the loop's counted pass), `loop`                      | `start`, `pause`, `stop`, `seek`, `setLoop`, `toggle`                                         |
| `useStrip(strip)`                         | `level`, `pan`, `inputGain`, `mute`, `solo`, `audible`, `implicitlyMuted`, `inserts`                                        | `setLevel`, `setPan`, `setMute`, `setSolo`, `addInsert`, …                                    |
| `useTrack(track \| name)`                 | `useStrip` of any track kind, resolved by object or name                                                                    | same                                                                                          |
| `useGroup(group \| name)`                 | `useStrip` plus `members`                                                                                                   | `add`, `remove`                                                                               |
| `useMeter(source?, { fps, active })`      | `peak`, `rms`, `peakDb`, `lufs` reading, `lufsShortTerm`, `truePeakDb`                                                      | —                                                                                             |
| `useDevice(device, { registry })`         | `values`, `bypass`, `params`, `descriptor`, `presets`                                                                       | `setParam`, `setBypass`, `applyPreset` (by name: every knob), `capturePreset`, `reset`        |
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

Everything sampled on one scheduler rides one chain of frame requests, and
subscribers with the same `fps` fire on the same frames. A `Meter` on a source
does not render per frame: it writes each reading to its elements itself. To
do the same for a value of your own, `subscribeFrameSampled(scheduler,
intervalMs, sample, onValue, isEqual?)` tells `onValue` the first sample and
then each one that changed, with no React state in between, and
`subscribeFrames(scheduler, intervalMs, onFrame)` is the bare frame. Both
return a function that stops them; `useFrameScheduler()` is the scheduler.

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
| `Knob`, `Fader`                             | `role="slider"` controls, controlled (`value`) or uncontrolled (`defaultValue`): pointer drag (Shift = fine), wheel, arrows / PageUp / Home / End, double-click or Delete reset; a knob of two places (`wholeSteps` with one step for all of its travel: off and on) is switched by a press or by Enter, and a double-click on it is two presses; `linear`, `log`, `skewed` and `fader` tapers; `onChangeStart` / `onChangeEnd` bracket a gesture. `Fader look="cap"` is a console fader (see Grounds and depth below)                                                                                                                                                                                                                                                                                                                                                                                                    |
| `Meter`                                     | Peak / RMS / LUFS / true-peak bars on the dB scale (`gainToDb` of the analyser reading) with a peak-hold marker; a `MeterSource` through `useMeter`, or an explicit `reading`. `look="segments"` is a console meter: three zones, lit segments and a clip lamp                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `TransportBar`                              | Play / pause, stop, position (`m:ss.t`), loop toggle with length, loop pass                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `ChannelStripView` (`MixerStrip`)           | Inserts, sends (name, level, thin fader), pan, a dB fader (`−60 … +6`, unity tick, `−∞` at the bottom) that converts through `dbToGain` / `gainToDb`, mute / solo, a meter tapped off the strip output (`meter` prop)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `MixerView`, `MasterStripView`              | Sections for tracks (+ `inputs`), groups, `returns`, and the master (bus fader + engine meter); lists default to the provided engine's `tracks` / `groups`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `DevicePanel` (`DeviceView`), `DeviceFrame` | One taper-aware knob per `ParamSpec` (steps derived from unit and range; `choiceLabels` for enumerations), bypass on the power switch, a preset picker from the registry descriptor; the frame alone for custom bodies                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `DeviceChainView`                           | An insert chain as panels with move earlier / later, a device carried to another place by its title bar or grip, or a plate by its face (pointer events: its name rides the top of the chain, a marker stands in the gap it lands in, Escape leaves it, the chain scrolls near an end; `useChainReorder` for a rack drawn by hand, where `data-lm-drag-handle` marks what a device is taken by), remove (+ dispose) and an add picker over the registry, grouped by category and without instruments. `strip` takes a track, a strip or a bus (`engine.master`); `pinned={n}` hides the first `n` inserts the app owns and keeps them first; `filter` narrows the picker. Under an arbiter, a chain on a strip the score carries (or the master) adds, removes and reorders with `device.add` / `device.remove` / `device.move`, so chain edits are saved and undoable; any other strip is edited on the engine as before |
| `DevicePlate`                               | The same device as an object of its own, drawn from a skin: plate colour, finish, a picture that follows the settings, knobs with the skin's cap. A few knobs on the face, a cell that opens the rest, a name tag, a lamp for power. `DeviceChainView` draws plates when given `skin` (see Device plates below)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `TimelineView`, `Waveform`                  | Lanes per clip source with clips placed in seconds, `sounding` / `upcoming` from `useSchedule`, loop region, a frame-sampled playhead, waveforms from decoded peaks; click or arrow the ruler to seek                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `DeviceToggle`, `ToggleButton`              | The squared power switch and the pressed / unpressed button (mute, solo, loop tones)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `GridView`                                  | The session grid over `useSession` / `useSlot`: scenes × audio tracks, a slot button per cell (`data-state` empty / stopped / queued / playing / recording, stopping, `gate` dashed), scene launch per row, per-track stop row and stop-all, the quantise selector (`quantizeKey` / `quantizeLabel`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

### Grounds and depth

A theme is its literal tokens (`LM_TOKENS`). The stylesheet derives a second
set from them, as `color-mix` formulas declared once for every theme, so a
workstation can tell its surfaces apart without a colour of its own:

| Token                                        | What it is                                                                                                  |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `--lm-bar`, `--lm-pane`, `--lm-head`         | Three grounds: the lowest one (a top bar, the gaps between panes), a pane standing on it, a pane's head row |
| `--lm-edge`                                  | The line around a block: the theme's rule in a light theme, a light line in a dark one                      |
| `--lm-line`, `--lm-line-strong`, `--lm-hair` | Quieter versions of `border`, `grid-line-strong` and `hairline`, for lines inside a pane                    |
| `--lm-well`, `--lm-slot`                     | The ground of a sunken well, and of a fader's slot or an unlit meter bar                                    |
| `--lm-cap`, `--lm-cap-edge`                  | A fader cap and its edge and grip lines                                                                     |
| `--lm-meter-warm`                            | The middle zone of a segmented meter, between `meter` and `meter-hot`                                       |
| `--lm-shade`, `--lm-shade-in`, `--lm-light`  | A shade under a block, a shade inside a well, the light along a block's top edge                            |

The dark themes (`dark`, `graphite`, `water`, `dusk`, `night`) have formulas of
their own where a light theme's would not show. The formulas are worked out on
the element that carries the theme: `:root`, an element with `data-lm-theme`,
or one with the class `lm-root`. An element that only sets the tokens inline
(`themeStyle`) takes `data-lm-theme` or `lm-root` as well to get them.

Three classes use them:

- `lm-pane` puts what is inside it on the pane's ground: it sets `--lm-panel`,
  `--lm-border`, `--lm-hairline` and `--lm-grid-line-strong` to the pane's
  versions and paints the pane. Put it inside the themed element, never on that
  element itself, because the derived tokens read the tokens it replaces.
- `lm-pane--raised` adds the light along the top and a soft shade under it.
- `lm-well` is a sunken box with a hairline border, for a scale, a fader and a
  meter.

```tsx
<div data-lm-theme="graphite" style={{ background: 'var(--lm-bar)' }}>
  <section className="lm-pane lm-pane--raised">
    <div className="lm-well" style={{ display: 'flex', gap: 5, height: 220, padding: '10px 5px' }}>
      <Fader label="Level" look="cap" defaultValue={0} min={-60} max={6} taper="fader" unit="dB" />
      <Meter source={engine.master} look="segments" showReadout={false} />
    </div>
  </section>
</div>
```

`Fader` and `Meter` each have a second look for that well. Both default to the
look they always had.

| Prop           | Values                           | What it does                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Fader look`   | `'bar'` (default), `'cap'`       | `'cap'` adds the class `lm-fader--cap`: the track is a lane with a slot down its middle, and the thumb is a cap 15 px long with grip lines and a centre line in the accent, exactly at the value. No fill is drawn and `ticks` are not drawn, so put a scale beside it. The lane is `--lm-fader-width` wide, and 24 px at least; a rule of your own on `.lm-fader__track` sets another width |
| `Meter look`   | `'bars'` (default), `'segments'` | `'segments'` adds the class `lm-meter--segments`: each bar is lit in segments (2 px lit, 1 px dark) in three zones that stay where they are on the scale, the RMS bar dimmer than the peak, the unlit bar in `--lm-slot`, the peak-hold mark in `--lm-text`. The whole bar no longer changes colour above `hotDb`. A LUFS bar keeps its one colour                                           |
| `Meter warmDb` | dB, default `-12`                | Where the warm zone starts in the segments look. `--lm-meter` is drawn up to `warmDb`, `--lm-meter-warm` from there to `hotDb` (default `-6`), `--lm-meter-hot` above. The two positions reach the stylesheet as `--lm-meter-warm-at` and `--lm-meter-hot-at`                                                                                                                                |

A value sits at the same place along the track in both fader looks, so a scale
drawn for one fits the other. The segments meter has a clip lamp
(`lm-meter__clip`, `data-testid` `<testId>-clip`) past the far end of the scale:
it lights (`data-on`) when a peak reaches 0 dB or a true peak passes it, and
stays lit until the meter is clicked or its `reading` is taken away. The lamp
stands 6 px beyond the bars, which keep their whole length, so leave it that
room; the padding of a well does.

`heldPeak(previous, db, now, holdMs)` is the rule the meter holds its mark by
(a reading as high as the held one takes its place at once, a lower one after
`holdMs`), for an app that prints the held peak as a number beside the meter.
Start from `{ db: -Infinity, at: 0 }` and keep the result between readings.

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
| `face`, `labels`         | The knobs on the face and shorter words for them: four over a picture or a strip, two for each column beside a window. The rest are behind the `+n` cell, which widens the plate by whole 20 px cells.    |
| `picture`                | `{ params, draw(at) }`: SVG in a 240 by 140 box, drawn from the positions (0..1) of the parameters it names and again only when one of them moves. More Feedback on the Tape Echo draws more repeats.     |
| `display`                | A `PlateDisplay`: a canvas that shows what the device is doing while it does it, in place of a picture. See "Displays" below.                                                                             |
| `name`                   | The word on the tag when the device's own name is too long for it.                                                                                                                                        |

`DEVICE_SKINS` holds the kit's own, one for every stock effect: the EQs and
filters, the compressors and limiters, the reverbs, delays, tape and
modulation, and the ambient ones (Analog Delay, Cascade, Glitch, Low Bitrate,
Vinyl, Radio, Patina and the rest). An instrument has none.
`deviceSkin(device, skins?)` answers for a chain: the device's skin, else
`QUIET_SKIN` (the theme's colours, no finish, no picture, eight knobs in two
rows) so tools sit quietly between the others, and null for a plug-in that is
missing, which keeps its `DevicePanel` and says there why it did not load.
Pass your own table as the second argument, or your own function as `skin`, to
add or replace skins. A plate is 140 px high and
`plateLayout(knobs, pictured, display?)` gives its width and where its display
stands.

A hosted plug-in (a device with `openEditor`) is a plate too, though the kit
has never seen it. `hostedSkin(device)` picks one of the eight cases in
`HOSTED_PLATES` by the plug-in's id, with a finish and a knob cap, so the same
plug-in is the same colour every time and two in a chain are told apart. Its
first four parameters are the knobs on the face, and the picture is its own
window drawn small, with three sliders that follow its first three parameters.
The `Edit` cell at the right opens the real window (`openEditor`), and the
`+n` cell sits under it. The cases are workshop colours, apart from the plates
in `PLATE_PALETTES`.

A device's own presets are a small list among the tools that show while a
plate is pointed at, and a list in a panel's title bar. A host with a picker of
its own (a search, stars, a play cell) passes it as `presetPicker`: a node on
`DevicePlate` and `DevicePanel`, a function of the device and its place among
the devices shown on `DeviceChainView`. The kit's list then stays away, and on
a plate the picker sits on the foot beside the name, in view without the
pointer. It gets the room the name leaves, down to one 20 px cell, and that
room is a container named `lm-plate-presets`, so the picker can fold to a
smaller form with a container query. Beside a picker the foot has no room for
the tools, so they stand in a row of their own just above it at the plate's
edge (`lm-plate__tools--above`): the name stays whole and nothing on the foot
moves when they show. A tool is a cell of `--lm-plate-tool`, 16 px unless a
host sets it. A finger points at nothing, so a plate pressed with a finger or
a pen is in hand (`lm-plate--held`) and shows its tools until a press lands
anywhere else. `null` draws none, takes no room and still
keeps the kit's list away. Either way a preset picked by name sets every knob
(`useDevice().applyPreset(name)`): what the preset does not name goes back to
where the device starts, so the preset picked before leaves nothing behind.

A chain takes two more things from its host. `deviceActions` is a function of
a device and its place among the devices shown, and what it returns are tool
cells of the host's own (swap the device for another, keep its settings). They
stand after the two move cells and before the remove cell, on a plate and on a
panel, and a button among them keeps its own press: it never starts a carry.

`dropAt` is where something carried in from outside the chain would land (an
effect dragged from the host's browser), counted among the devices shown: 0
heads them, their number ends them, `null` is nothing carried. The chain stands
its marker in that gap, the one a carry inside the chain shows, and has the
class `lm-chain--receiving` meanwhile. Adding what lands is the host's, and so
is marking its own add cell when the chain shows no device and has no gap.
`chainDropIndex(chain, clientX)` reads that place for a pointer off the chain's
element (`.lm-chain`): past a device's middle is after it.

```tsx
const [dropAt, setDropAt] = useState<number | null>(null)
// While the host carries a device over the chain:
const over = (event: PointerEvent) => {
  const chain = document.querySelector<HTMLElement>('[data-lm-strip="pad"]')
  setDropAt(chain ? chainDropIndex(chain, event.clientX) : null)
}

;<DeviceChainView
  strip={track}
  skin={deviceSkin}
  dropAt={dropAt}
  deviceActions={(device, index) => <SwapCell device={device} index={index} />}
/>
```

`dropIndex(spans, x)` and `dropMarkerPosition(spans, index)` are the same
counting and the marker's place over `ItemSpan`s, for a rack drawn by hand.

A plate costs nothing while it sits: the finish and the picture are drawn when
the device is added or one of its knobs moves, not per frame, and a display
runs only while it is in view and its device is on. The names are the devices'
own, and no skin borrows a maker's colours or layout.

#### Displays

A picture is drawn from the knobs. A display (`PlateDisplay`, in
`plate-display.ts`) is drawn on frames from three things: the parameters, the
device's own readings (`MeteredDevice`: a compressor's gain reduction, an
LFO's phase), and the sound going in and coming out, read by two analysers the
plate hangs on the device while the display runs. So a compressor shows its
curve and the gain it takes off, an EQ its response over the spectrum, a
tremolo its modulation in step with the sound.

```ts
import { plateDisplay, displayKit, type PlateFace } from '@kieranklaassen/live-mix/react'

const sweep = plateDisplay({
  place: 'window', // or 'strip'
  columns: 1, // window only: columns of two knobs beside it
  params: ['frequency', 'q'], // a still display is drawn again when one moves
  live: { spectrum: true }, // left out, the display is still and costs nothing
  info: 'The response of the filter over the spectrum of what comes out.',
  draw(frame) {
    const box = displayKit.ground(frame)
    displayKit.spectrum(frame, box)
    // frame.value('frequency'), frame.meter('reduction'), frame.signal?.output.peak ...
  },
  handles: (view) => [
    /* points to drag: { key, name, x, y, drag(x, y) => params, wheel?, reset? } */
  ],
})

const faces: Record<string, PlateFace> = { filter: { display: sweep, face: ['type', 'gain'] } }
```

| Place    | Where it stands                                                                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `strip`  | 224 by 48 under one row of four knobs, on a plate 280 wide. Opened, it is as wide as the row; on a device with more than twelve knobs it is 184 by 100 beside two rows. For what happens in time.            |
| `window` | 100 high beside two rows of knobs, on a plate 280 wide: 176, 128 or 80 wide beside one, two or three columns (`displayWindowWidth`). For what has two axes: a curve over frequency, a level against a level. |

A display draws to the size it is given and in the plate's own colours
(`frame.colours`): the ink carries what is read (curves, scales, traces), the
accent points at what is happening now (the level on a curve, an LFO's place,
the gain taken off). `displayKit` has what displays share so they read as one
family: the ground (which hushes the plate's finish under it, so a thin line is
not read against specks), words at 8 px or more in full ink and never fainter
than a scale's numbers, the `INK` strengths, dB and frequency scales and grids,
traces and fills, `spectrum`, a `History` that scrolls by the clock, the
response of the filters devices are built from (`biquad`, `biquadDb`,
`onePoleDb`), plain LFO shapes and `trackPhase`, which carries a phase the
device reports thirty times a second smoothly between two readings.

`live` says what a running display follows: `meters` (the device's readings,
watched only while it runs), `signal` (the levels in and out, each with its
`wave`), `spectrum`, `stereo` (the two sides apart), and `fps` (30, or 60 for
something small that moves fast). The level going in needs the node that feeds
the device: `DeviceChainView` passes it (`source` on `DevicePlate`); a plate on
its own shows the output only. All displays on a page share one frame loop on
the provider's `FrameScheduler`, each stops when it scrolls out of view or its
device is switched off, and a canvas lays nothing out, so many can run while
music plays.

A handle is a point that can be dragged. Its `drag(x, y)` returns parameters
in their own units; the plate clamps them and writes them through
`useDevice().setMany` between `touchMany` and `releaseMany`, so under an
arbiter a whole drag is one `device.setParams` gesture and one undo step. A
double press calls `reset`, the wheel over a handle calls `wheel` (an EQ band's
width). The chain leaves a press on a handle alone (`data-lm-handle`) and
carries the plate from a press anywhere else on the display.

A device may report a reading that is only for its display (an LFO's phase):
`"display": true` on the meter in `device.json`, which keeps it out of the
panel's title bar and the plate's foot. A plate with a display prints no
readouts in its foot at all; the display draws them. Adding such a reading
must not change one sample of the sound: `node scripts/same-sound.mjs <id>`
plays the device as it was at `origin/main` and as it is now, at its defaults,
every preset and with every parameter swept, and compares sample for sample.

`PLATE_FACES` holds the stock displays by device id, one file per family under
`components/displays/`. `src/react/__tests__/displays.test.ts` holds every one
of them to the same rules (it reads parameters the device has, draws at any
setting without a number the canvas cannot take, paints only in the plate's
colours, follows every parameter it names, and its handles stand on it and set
what they stand for), and `display-harness.ts` beside it has a recording
canvas for a display's own tests.

`playground/plates.html` (`pnpm playground`, then `/plates.html`) is the plate
bench: every stock effect as a plate with sound running through it, by
`?only=`, `?category=`, `?theme=`, `?open=1`, `?still=1`, `?chain=1` and
`?preset=`. `node scripts/plates/shoot.mjs out.png "only=tremolo"` takes its
picture in headless Chromium.
Each plate there carries a `DevicePresetCell` on its foot, and the cell at the
top of the page is a `PickCell` that finds a plate by name, so the list and the
preset cell are looked at where the plates are.

### Lists to pick from, and the preset cell

A preset, an effect to add and a chain for a strip are all picked the same
way: a cell names what is on, a press opens a list off it, and the list is
searched and walked with the keys. The parts came from Ambient Live, where an
effect's presets and the effect browser are drawn with them, and they are the
kit's now so a second app draws the same thing.

`PickCell` is the whole of it for a list of the app's own:

```tsx
import { PickCell, deviceItems, patchItems } from '@kieranklaassen/live-mix/react'

;<PickCell
  label="Effects"
  items={deviceItems(engine.devices.list({ kind: 'effect' }))}
  onPick={(item) => addEffect(item.id)}
  verb="Add"
  data-testid="add-effect"
>
  Add effect
</PickCell>

;<PickCell
  label="Chains for a voice"
  items={patchItems(VOICE_CHAINS)}
  current={chainOn?.id ?? null}
  onPick={(item) => applyChain(item.id)}
  verb="Apply"
>
  {chainOn?.name ?? 'Chains'}
</PickCell>
```

A `PickItem` is `{ id, name, detail?, more?, group? }`: `detail` is said dim
beside the name, `more` are words the search finds it by, and items of one
`group` stand under one head with their count (`deviceItems` heads a registry's
devices by category, in the order `DEVICE_CATEGORIES` lists them; `patchItems`
makes one item a `Patch`). `PickList` is the list alone, for a cell of the
app's own: `open`, `anchorRef`, `onClose` and the same props.

| What the list does  | How                                                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Opens               | Off its cell: above it, or below with `side="below"`, lined up with the cell's left edge (`align="start"`) or its right. `rail` names an element whose edge it stands on in place of the cell's. `pickerPlace` works the place out and keeps it in the window.   |
| Starts              | With the cursor on the one that is on (`current`), marked "on now"; on the first row where nothing is.                                                                                                                                                           |
| Searches            | Every word typed has to be in the name, the detail or `more` (`searchRows`, `matchRanges`). What it found leads, best first, with the found letters marked; the rest follow dimmed, so the list never empties. A letter typed anywhere in the panel is a search. |
| Walks               | Up, Down, Page Up, Page Down, Home, End. Return picks the row under the cursor and closes; with Shift held it picks and stays open, to try one after another. A held Return picks once.                                                                          |
| Closes              | Escape, a press outside, the cell again, a pick. The focus goes back to what had it. Tab stays inside while it is open.                                                                                                                                          |
| Says what Return is | The action cell on its foot reads the verb and the row: "Apply Podcast voice", "On Clean voice" for the one that is on, "Nothing to apply" where a search found nothing.                                                                                         |

`filters` is a row of the app's own under the search (chips), `rowTools` cells
at the end of a row (a star, a play cell: a press on one is not a pick), and
`rowProps` and `cellProps` put an app's own attributes on a row and on the
cell. The panel's parts are exported for a picker with rows of another shape:
`PickerPanel`, `PickerSearch`, `PickerGroup`, `PickerAction`, `Highlight`,
`Keycap`, `cursorStep`, `tabStops`, `focusCell` and `useRowInView`. Their
classes are `lm-picker*`; `lm-pick` is the wrapper of a select and stays so.

`PresetCell` is the preset cell of one effect: the name of the preset it is on,
a cell to step to the one before and one to the one after without opening
anything, and the list the name opens. It keeps nothing about which preset is
on. `presetLabel(presets, values, specs)` reads it off the values each time, so
a knob turned anywhere (on the plate, by an undo, by an agent) leaves the cell
saying what is true: the preset's name, `Default` while every parameter is
where the device starts it, `No preset` once they fit none. The matching is
`presetIsOn`, `currentPreset`, `atDefaults`, `stepPreset` and `retiredPresets`,
from the root entry: a preset is on while every parameter it names is where it
puts it and every other is where the device starts it, in single precision and
inside the range, the way the device keeps a value.

`DevicePresetCell` is that cell read off a device, and what a plate's
`presetPicker` is for:

```tsx
import { DevicePlate, DevicePresetCell, deviceSkin } from '@kieranklaassen/live-mix/react'

;<DevicePlate
  device={device}
  skin={deviceSkin(device)}
  writes={writes}
  presetPicker={
    <DevicePresetCell
      device={device}
      writes={writes}
      presets={VIDEO_PRESETS[device.id]}
      groupOf={(preset) => (isOurs(preset) ? 'For video' : 'Compressor')}
    />
  }
/>
```

`presets` are the app's own, in the kit's `Preset` format, listed before the
device's (`ownOnly` leaves the device's out). A pick is one write of every
parameter the device has: the ones the preset names to its values and the rest
to where the device starts them, by value and never by name, since one of the
app's own is no preset the device knows. On a plate's foot the cell folds with
the room the name leaves (`lm-plate-presets`): name, chevron and both step
cells where there is room, the name and chevron on a narrower plate (the list
does the stepping there, as it does under a finger), the chevron alone on the
narrowest.

`writes` is for a host that keeps its own document, as a video editor's edit
is. A `DeviceWrites` on `useDevice`, `DevicePlate`, `DevicePanel` and
`DevicePresetCell` takes every change in place of the device:

| Call                | When                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| `touch(names)`      | A knob, a slider or a handle on a display is taken hold of.                                              |
| `set(params)`       | Every value while it is held, and once for a change that is not held: a preset, a reset, a typed number. |
| `release(names)`    | It is let go.                                                                                            |
| `setBypass(bypass)` | The lamp is pressed.                                                                                     |

The plate still reads the device, so the host's part is to put what it was
told on the device by its own way: preview between `touch` and `release`,
commit once at `release`, and commit a `set` that came without a `touch` as
one step. Nothing here is in the signal path: a plate, its display and its
preset cell read parameters and taps, and a host that never mounts one sounds
the same.

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
  returns to; for a knob of two places, that a press switches it); `DeviceFrame`, `DeviceToggle`, `ToggleButton` and `Meter` take
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
`automationPositions`; `strokeWavePaths` is the halo, the wave and the bars of
a stroke in one call, which is how `Stroke` draws them). The kind, hits and
tempo come from the engine's sound analysis (`analyzeSound`, or
`samples: { analysis: true }` on the engine).

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

### The video kit

What a timeline of picture and sound, a panel, a sheet and a note are drawn
with, for an app that edits video on the grid themes (Cutroom is the first).
The elements are presentational, like `Stroke`: the host gives each one px,
fractions and words, owns the data and every gesture, and gets pointer
handlers, `aria-*`, `data-*` and the ref on the element a person acts on.
Nothing here reads the engine, so all of it renders without a provider.

Five rules hold the elements together:

- Everything sits on the module (`--lm-col` × `--lm-row`). Neighbours touch
  and a 1 px line separates them. No shadows, no gradients.
- Round is media, square is everything else. A clip is a stroke with round
  ends; a layer, a zoom, a layout change and a note are square.
- A colour means one thing. A brush is a source, the accent is a control's
  value or its pressed state, the automation colour is automation, and
  `--lm-note` is a note. Errors use `--lm-danger`.
- Who did something is a shape, never a colour (`WhoMark`): a filled square is
  a person, an outlined square is the agent inside the app, a dashed square is
  an agent from outside.
- One pattern tells a person something in place (`InlineNote`).

Wrap the app in `className="lm-app"` beside its `data-lm-theme`: the font, one
row to a line, border-box sizing, and a 1 px `--lm-focus` ring at 1 px offset
on whatever has the keyboard.

```tsx
const { minorSec, majorColumns } = rulerScale(pxPerSecond)

<div data-lm-theme="graphite" className="lm-app">
  <TimeRuler pxPerSecond={pxPerSecond} width={width} role="slider" aria-label="Playhead" onPointerDown={seek}>
    <Playhead x={playheadPx} flag />
  </TimeRuler>
  <LaneHead name="Display" brush={2} height={40} glyph={<Glyph kind="display" />} />
  <PaintField columnPx={minorSec * pxPerSecond} majorColumns={majorColumns} majorRows={0}>
    <Lane top={0} height={40} role="group" aria-label="Display track">
      <VideoStroke
        style={{ position: 'absolute', left: clip.start * pxPerSecond }}
        width={(clip.end - clip.start) * pxPerSecond}
        height={40}
        brush={2}
        name="Display"
        hits={clickFractions}
        tags={['1.5×']}
      />
    </Lane>
    <Lane top={40} height={20}>
      <TimelineItem
        style={{ position: 'absolute', left: zoom.start * pxPerSecond }}
        width={(zoom.end - zoom.start) * pxPerSecond}
        shape="envelope"
        glyph={<Glyph kind="follows" />}
        name="2.2×"
        rampIn={easeInPx}
        rampOut={easeOutPx}
      />
    </Lane>
    <Playhead x={playheadPx} />
  </PaintField>
</div>
```

**Tokens.** Every theme carries them; a host that sets every token itself adds
these:

| Token                                                         | Use                                                                                               |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `stage`                                                       | The ground behind a picture: a preview, a source view                                             |
| `scrim`                                                       | Over the window behind a sheet                                                                    |
| `removed`                                                     | The wash behind removed words                                                                     |
| `record`                                                      | The record dot. The value of `danger`, with a meaning of its own                                  |
| `note`, `note-soft`                                           | A note's tab, line and span edge, and the wash behind its words. 4.5:1 or better on `bg`/`sunken` |
| `note-mark`, `mark-edge`                                      | A note's marks on a picture and the dark line around any mark there. One value in every theme     |
| `bar-height`, `panel-width`, `lane-head-width`, `handle-size` | 40 px, 320 px, 160 px, 7 px                                                                       |
| `read-size`                                                   | 13 px: text that is read (a transcript, a conversation). `.lm-read` sets it on a 20 px line       |

`.lm-time-large` is the transport's time (the mono face at 13 px), `.lm-num` a
mono readout and `.lm-lbl` a 9 px label.

**Timeline.**

| Component             | What it draws                                                                                                                                                                                                                                                               |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TimeRuler`           | One row of ticks for `width` px from `start` seconds at `pxPerSecond`. It picks the ticks from the scale (`rulerScale`); labelled ticks say `format(seconds)`. Children place themselves in px                                                                              |
| `Playhead`            | The 1 px line; `flag` adds the 9 by 11 px flag, for the one in the ruler. Leave `x` out and set `transform` on the ref to move it without a render                                                                                                                          |
| `Lane`, `LaneHead`    | A row of the field at `top`, 20 or 40 px high, and its head: swatch in the `brush`, `glyph`, name, mute and solo (the kit's `ToggleButton`, shown when their state is given), and on a 40 px head a second row for a peak `meter` or a `note`                               |
| `VideoStroke`         | A `Stroke` for a picture: ring and wash in the brush, `frames` as a strip of thumbnails (flat frames without them), a tick per `hits`, the tag with `name` and `tags`, an `automation` line for a speed ramp, and `selected`, `linked`, `muted`, `missing`                  |
| `TimelineItem`        | Anything that is not media, one row tall and square. `shape="plate"`: glyph, name, readouts, a corner cut where `fadeIn` / `fadeOut` is above 0. `"envelope"`: an outline whose slopes are `rampIn` / `rampOut`. `"span"`: a line at its start and a hatch `rampIn` px wide |
| `LinkMark`            | The bracket on the lane heads of one link group                                                                                                                                                                                                                             |
| `RangeSelection`      | A selected range of time: an accent wash, full strength on the ruler and half through the lanes                                                                                                                                                                             |
| `CutSeam`, `CutNotch` | Where a gap was closed: a dashed line through the lanes it joins, and its 7 by 4 px notch on the ruler                                                                                                                                                                      |
| `TransitionMark`      | A square with a cross over a cut, never narrower than 12 px                                                                                                                                                                                                                 |
| `Overview`            | The whole timeline in one row: cuts, notes, the playhead and a box for what the lanes show. A press or a drag calls `onScroll(start)`                                                                                                                                       |

A speed is not a component: a constant speed is a `tags` entry and a ramp is
`automation` with the label "Speed", on `Stroke` and `VideoStroke` alike.

The arithmetic is exported for hosts that scroll and zoom (`timeline-math`):
`rulerScale` (fifths of a second under a second from 100 px per second, two seconds under
ten from 20, ten under thirty from 5, thirty under two minutes below),
`rulerLabels`, `zoomAround` (the time under the pointer stays under it),
`fitPxPerSecond`, `pageScroll` (the page turn while playing) and
`clampPxPerSecond` (2 to 400, default 20). A field takes
`columnPx={minorSec * pxPerSecond}` and `majorColumns` from `rulerScale`.

**Panels and controls.**

| Component                               | What it is                                                                                                                                                                                                        |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Panel`, `PanelHead`                    | A column on the panel ground, and its head row: `glyph`, `title`, `actions` flush at the right                                                                                                                    |
| `Tabs`                                  | A row of tabs on the page ground; the selected one stands on the panel ground. `selected` is null while the panel is closed. Arrow keys, Home and End move between tabs                                           |
| `SectionLabel`, `PropRow`               | The label over a group of rows, and a property: a 120 px label and a value cell                                                                                                                                   |
| `TextButton`                            | A button with words on it. `variant`: `default`, `primary` (the one a bar or a sheet leads to), `quiet`, `danger`. `pressed` makes it a toggle. `cell` sits flush in a bar, `icon` is one glyph, `shortcut` a key |
| `Input`, `Select`, `Segmented`, `Check` | The fields a property row holds. Each reports the new value. `boxed` gives a field a border of its own outside a row                                                                                              |
| `Menu`, `MenuItem`, `MenuSeparator`     | A list of one-row items with shortcuts at the right. `items`, or `MenuItem` children when an item needs attributes of its own; `checked` marks a choice. Arrow keys move, Escape calls `onClose`                  |
| `Sheet`                                 | One thing to settle, over the window on a scrim: head, body, and a foot two rows tall. Escape calls `onClose`, Tab stays inside, and the focus goes back where it was                                             |
| `InlineNote`                            | The inline message: a title that says what happened, a line that says what it means, at most one `action`. `tone="danger"` for what stops the person; `role` is `status` or `alert`                               |
| `Progress`, `StateMark`, `WhoMark`      | A 6 px bar; an 8 px square that is `off`, `on`, `busy` or `failed`; an 8 px square that says who                                                                                                                  |
| `JobRow`, `LogRow`                      | Long-running work (state, bar, percentage, note, Cancel) and a call somebody made (who, what, when, "Done" or "Refused" in the words it was refused with, the arguments, Undo)                                    |
| `TranscriptWord`                        | A word as a button at the reading size: `rest`, `selected`, `removed`, `filler`, `now`; `pause` shows a length. A removal is a run of removed words, and a `CutSeam` on the timeline                              |
| `Glyph`                                 | A 10 px glyph by `SoundIcon`'s rules for things that are not a kind of sound: sources, layers, the look, acts and panels (`GLYPHS` lists the kinds), or a path of your own as `d`                                 |

The inline message is called `InlineNote` because a note is something else
here: what a person or an agent says about the work.

**Notes.** A note takes a colour role of its own and is always a numbered
square tab, whose fill says who and what state: filled is a person's open
note, the same with an arrow has been sent, outlined in the note colour is an
agent's, outlined in grey with a tick is resolved.

| Component                   | What it draws                                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NoteTab`                   | The tab alone                                                                                                                                     |
| `NotePin`, `NoteSpan`       | A note on a timeline: a button with the tab and the start of its text at `x`, an optional `line` down through the lanes, and the wash of its span |
| `PictureMark`, `NoteBubble` | A `box`, an `arrow` or a `line` on a picture from points in output px, with the dark edge under it, and the note's words beside it                |
| `ContextChip`               | What goes with an ask: the selection, a note or a frame, with an x that leaves it out                                                             |
| `ReferenceChip`             | A moment, a span or an item named in an answer, as a button that goes there                                                                       |
| `ChangedMark`               | An 11 px square on something an agent changed                                                                                                     |

**The clock under a picture.** `followStep` (the core entry) is the rule by
which a media element follows a clock it is not the master of: a video
element under a picture that follows the audio clock. Paused, it seeks to the
exact time and never while a seek is under way; playing, its rate is nudged
toward the clock, and past `FOLLOW_DRIFT_SEEK` it seeks. The host reads the
element, asks for the step and applies it.

`playground/video-kit.html` (`pnpm playground`, then `/video-kit.html`) mounts
every element with made-up content; `?theme=paper` or any other theme, and
`?sheet=1` for the sheet.

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
ambient-live's plate reverb and the keys track gets kkfonie's StereoWidener
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
