# WebAudioModules 2.0 host (`@kieranklaassen/live-mix/wam`)

WAM 2.0 is the browser's plugin format: an ES module whose default export is a
`WebAudioModule` constructor, a `WamNode` (an `AudioNode`) with parameters,
state, MIDI/automation events and an optional GUI. `WamDevice` puts one behind
the library's `Device` contract, so a WAM sits in a channel strip, a bus or a
rack like a node or WASM device, takes presets from the registry and lanes
from the automation engine. U35 of the plan; requirements R30, KD3.

## Entry and dependencies

The adapter lives on its own entry, **`@kieranklaassen/live-mix/wam`**, not on
`./dsp`, because it imports `@webaudiomodules/sdk` and the two consumer apps
must keep installing `.` and `./dsp` without it. `pnpm pack:check` fails if
`.`, `./dsp` or `./testing` ever reaches an optional peer.

| Package                | Pinned          | Role                                                                                                                                                      | Licence (npm metadata)                                                                          |
| ---------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `@webaudiomodules/sdk` | `0.0.12`        | Host bootstrap: `initializeWamHost` installs the `WamEnv` and a `WamGroup` in the worklet scope. Only `src/initializeWamHost.js` is imported (see below). | MIT; bundles `RingBuffer` from padenot/ringbuf.js under MPL-2.0 (file-level, not vendored here) |
| `@webaudiomodules/api` | `2.0.0-alpha.6` | Types only (`WamNode`, `WamParameterInfo`, `WamDescriptor`, events). Erased at build; the `.d.ts` of `./wam` references it.                               | MIT                                                                                             |

Both are **optional peer dependencies** (and devDependencies for the tests).
A consumer that imports `./wam` installs them with exact versions:

```sh
npm install @webaudiomodules/sdk@0.0.12 @webaudiomodules/api@2.0.0-alpha.6
```

The SDK's `apiVersion` is `2.0.0-alpha.6`; a plugin built against another
alpha still loads as long as it follows the same `WamNode` methods. These are
the latest published versions (SDK July 2024, API March 2023); the WAM working
group publishes rarely, so the pins are expected to hold.

**Why the deep import.** `@webaudiomodules/sdk`'s index evaluates
`class WamNode extends AudioWorkletNode` at load, which throws wherever
`AudioWorkletNode` is missing (Node, SSR renders). `host.ts` imports
`@webaudiomodules/sdk/src/initializeWamHost.js` instead, so `./wam` stays
import-safe like every other entry (verified: `dist/wam/index.js` imports in
plain Node; the SDK index does not). Plugins bring their own `WamNode`
implementation in their bundle, so the host never needs the SDK's.

## Loading a plugin

```ts
import { createEngine } from '@kieranklaassen/live-mix'
import { WamDevice } from '@kieranklaassen/live-mix/wam'

const engine = createEngine({ context: new AudioContext() })
const verb = await WamDevice.create(
  engine.context,
  'https://www.webaudiomodules.com/community/plugins/wimmics/kbverb/index.js',
  { params: { mix: 0.3 } },
)
music.strip.addInsert(verb)
```

`create(context, source, options)`:

1. `ensureWamHost(context)` — installs the host once per `AudioContext`
   (two `audioWorklet.addModule` calls) and caches `{ groupId, groupKey }`.
   Pass `host: { groupId, groupKey }` to reuse a host the app already made, or
   `host: { groupId, initialize }` to pick the id / substitute the initializer.
2. Loads `source`: a URL through `importModule` (default `import(url)`, marked
   `/* @vite-ignore */`), or an already imported constructor. The default
   export must have `isWebAudioModuleConstructor === true` and `createInstance`.
3. `Constructor.createInstance(host.groupId, context, initialState)`.
4. Reads `getParameterInfo()` and `getCompensationDelay()`, mirrors the
   plugin's current values, applies `options.params` in one round trip.

The plugin's `audioNode` sits between two gains:

```
input ─┬─► wam.audioNode ─► wet ─┬─► output
       └──────────► dry ─────────┘
```

`bypass` crossfades dry/wet over 5 ms (`WAM_DEVICE_RAMP_SECONDS`, the same
ramp as `NodeDevice`); the plugin keeps running. A plugin without audio input
(`numberOfInputs === 0` or `descriptor.hasAudioInput === false`, i.e. an
instrument) gets no `input → node` connection.

## Parameters

`getParameterInfo()` becomes `device.params`, one `WamParamSpec` per WAM
parameter, keyed by the WAM id (so `setParam('mix', v)` sets WAM param `mix`):

| `WamParameterInfo`              | `ParamSpec`    | Note                                                       |
| ------------------------------- | -------------- | ---------------------------------------------------------- |
| position in the table           | `id`           | The contract's numeric id; not sent to the plugin          |
| `label` (or `id`)               | `name`         |                                                            |
| `minValue`, `maxValue`          | `min`, `max`   | boolean → 0..1, choice → 0..choices−1 (SDK rule)           |
| `defaultValue`                  | `default`      | clamped into range                                         |
| `exponent > 0` and `min > 0`    | `taper: 'log'` | otherwise `'linear'`; the exact skew is kept as `exponent` |
| `units`                         | `unit`         |                                                            |
| `type`                          | `type`         | `'float'                                                   | 'int' | 'boolean' | 'choice'` — extra field |
| `discreteStep` (or 1 for `int`) | `step`         | extra field; `setParam` snaps to it                        |
| `choices`                       | `choices`      | extra field, labels indexed by value                       |

Degenerate params (`min >= max`, non-finite) are left out of `params` but stay
in `device.paramInfo`, the raw table. `setParam` clamps, snaps discrete params,
mirrors the value for `getParam`, and calls `setParameterValues` (SDK
processors interpolate the change over a short window, so it is click-free).
`setParams({ … })` writes several in one message.

The mirror `getParam` serves is the last value the adapter set or saw. A GUI
that writes to the node directly bypasses it: call `await device.syncParams()`
before capturing a preset. Automation events the plugin processes
(`wam-automation`, ours or its own) update the mirror automatically.

## Presets and state

Two layers, both usable:

- **Library presets (U23).** `capturePreset(device, name)`, `applyPreset`,
  `serializePreset`/`parsePreset` work unchanged: a preset is the param map
  above, portable and diffable. `applyPreset` goes through `setParam`.
- **Plugin state.** `await device.getState()` / `await device.setState(state)`
  are the WAM's own opaque state (params plus whatever else it keeps — sample
  data, sequences). `setState` refreshes the mirror afterwards. Pass an earlier
  `getState()` result as `initialState` to `create` to restore before the node
  exists.

A score that wants exact recall stores both: the preset for the mixer's view
of the plugin, the state for the plugin's own.

## Registry: `kind: 'wam'`

A registry descriptor needs a param table before an instance exists; a WAM
only tells it at run time. Two ways in:

```ts
import { devices } from '@kieranklaassen/live-mix'
import {
  describeWamDevice,
  wamDeviceDescriptor,
  registerWamDevice,
} from '@kieranklaassen/live-mix/wam'

// Probe once (instantiate, read, dispose) and register: id `wam:<identifier>`.
const kbverb = await registerWamDevice(engine.context, KBVERB_URL, {
  presets: { Hall: { mix: 0.4, size: 0.8 } },
})
devices.list({ kind: 'wam' })
const verb = await devices.create(kbverb.id, engine.context, { preset: 'Hall' })

// Later, without a probe: a score persisted `{ id, name, params, wam, url }`.
devices.register(wamDeviceDescriptor({ ...persisted, source: persisted.url }))
```

`WamDeviceDescriptor` carries `url` and the plugin's `wam` descriptor next to
the usual fields; `category` defaults to `'instrument'` for `isInstrument`
plugins and `'other'` otherwise. `registry.create` hands `preset`, `params` and
any `WamDeviceOptions` (`host`, `importModule`, `initialState`) to
`WamDevice.create`; the probe's `host` and `importModule` are reused.

## Automation (U19)

WAM automation is timed point values (`wam-automation` events), not AudioParam
curves. Two levels:

- `device.scheduleParam(name, value, contextTime)` — one event;
  `device.clearScheduled()` — drop the plugin's pending queue.
- `wamDeviceParam(device, name, { stepSec })` — a `ScheduledParam` for
  `LaneWriter` and `ParamRamper`: `setValueAtTime` is one event; linear,
  exponential and `setTargetAtTime` ramps become points every `stepSec`
  (default 20 ms, `WAM_AUTOMATION_STEP_SECONDS`) which the plugin's
  interpolator smooths; `cancelScheduledValues` / `cancelAndHoldAtTime` clear
  the queue and anchor the next ramp at the mirrored value.

Two WAM limits are visible by design: `clearEvents()` is **plugin-wide** (every
pending event of every param, MIDI included), and a hold keeps the plugin
where it is when the clear lands, not where it would have been at `cancelTime`.
Lanes write inside the lookahead (seconds), so both are small; drive one WAM
from one lane set and override them together.

`ModMatrix`'s `deviceParamTarget` works unchanged (it calls `setParam`).

## Instruments and MIDI

`WamDevice` is a `NoteDevice`: `noteOn(noteId, frequency, gain)` /
`noteOff(noteId)` send MIDI note on/off (nearest note number to the frequency,
velocity from gain) as `wam-midi` events, so a WAM synth goes into
`engine.addInstrumentTrack({ device })`. `sendMidi(bytes, time?)` and
`scheduleEvents(...events)` pass raw MIDI, transport, sysex or OSC events
through. Effects ignore MIDI.

## GUI

```ts
const gui = await device.createGui() // Element | null
panel.append(gui)
device.destroyGui(gui) // or leave it: dispose() destroys every GUI it handed out
```

The element is the plugin's; the UI kit places it. Plugins without a GUI
module return `null`. GUI parameter changes usually go straight to the node —
`syncParams()` before reading.

## Latency

`getCompensationDelay()` is in samples per the WAM API; `latencySec` divides
by the context sample rate (the SDK's own JSDoc says seconds, its default is
0). `latencySec` in the options overrides a plugin that misreports.

## Dispose

`dispose()` removes the automation listener, destroys every GUI still handed
out, disconnects the four gains, disconnects and `destroy()`s the WAM node
(which closes its port and tells the processor). Idempotent; the device then
mirrors `setParam` but sends nothing.

## Playground snippet (real-browser smoke, Kieran)

```html
<!doctype html>
<script type="module">
  import { ParamLane, createEngine } from '@kieranklaassen/live-mix'
  import { WamDevice, wamDeviceParam } from '@kieranklaassen/live-mix/wam'

  const context = new AudioContext()
  const engine = createEngine({ context, outputMode: 'direct' })
  const music = engine.addAudioTrack({ name: 'music', lookaheadSec: 5, preloadSec: 12 })

  const base = 'https://www.webaudiomodules.com/community/plugins/'
  const verb = await WamDevice.create(context, base + 'wimmics/kbverb/index.js')
  console.table(verb.params) // what the plugin exposes
  music.strip.addInsert(verb)
  document.body.append((await verb.createGui()) ?? 'no gui')

  // A lane on the plugin's first param, written ahead by the engine's automation loop.
  const [first, spec] = Object.entries(verb.params)[0]
  const lane = new ParamLane({
    min: spec.min,
    max: spec.max,
    breakpoints: [
      { timeSec: 0, value: spec.min },
      { timeSec: 8, value: spec.max },
    ],
  })
  engine.automation.add(lane, wamDeviceParam(verb, first))

  document.querySelector('button').onclick = async () => {
    await context.resume()
    music.clips.add({
      id: 'a',
      source: await engine.samples.load('a', '/a.mp3'),
      startSec: 0,
      offsetSec: 0,
      durationSec: 60,
      fadeInSec: 1,
      fadeOutSec: 1,
      fadeCurve: 'equalPower',
      gainDb: 0,
    })
    engine.transport.start()
  }
</script>
<button>play</button>
```

Checklist: host installs (two blob modules in the worklet), plugin loads
cross-origin (the community server sets CORS), `params` matches the plugin's
GUI, `bypass` is click-free, `getState()` round-trips through `initialState`,
a lane moves the GUI's knob, `dispose()` silences the plugin. Serve over HTTPS
or localhost; `import()` of a cross-origin module needs CORS headers on the
plugin server (the community index has them).

## Faust effect → WAM

Your own Faust effects (`cpp/faust/*.dsp`) can be WAMs without touching this
repo's build: [faust2wam](https://github.com/fr0stbyter/faust2wam)
(`@shren/faust2wam`, LGPL-3.0 tool; the output is yours under the Faust
library exception) generates a static plugin directory:

```sh
npx @shren/faust2wam cpp/faust/zita-rev1.dsp out/zita-wam          # effect
npx @shren/faust2wam my-synth.dsp out/my-synth -poly                # polyphonic MIDI instrument
```

or export from the [Faust IDE](https://faustide.grame.fr) with
`Platform = web`, `Architecture = wam2-ts` / `wam2-poly-ts`. Serve `out/…` and
load `index.js` with `WamDevice.create`. The result includes an auto-generated
GUI. For the stock effects the WASM ABI path (`./dsp`) remains the primary
one — smaller, no SDK, bit-identical parity tests; WAM is for sharing an effect
with other WAM hosts or loading someone else's.

## Gallery: known WAM 2.0 plugins

The WAM Community index is `https://www.webaudiomodules.com/community/plugins.json`
(58 entries at the time of writing, each `path` relative to
`https://www.webaudiomodules.com/community/plugins/`). Selection of
insertable audio effects (audio in and out) that fit a mixing engine:

| Plugin                              | Vendor          | Category                     | URL (relative to the community base)                                                    |
| ----------------------------------- | --------------- | ---------------------------- | --------------------------------------------------------------------------------------- |
| KBVerb                              | Wimmics         | Reverb                       | `wimmics/kbverb/index.js`                                                               |
| Grey Hole                           | Wimmics         | Reverb                       | `wimmics/greyhole/index.js`                                                             |
| OWLShimmer                          | Wimmics         | Reverb                       | `wimmics/OwlShimmer/index.js`                                                           |
| OwlDirty                            | Wimmics         | Reverb                       | `wimmics/OwlDirty/index.js`                                                             |
| Microverb                           | Sequencer Party | Reverb                       | `burns-audio/reverb/index.js`                                                           |
| PingPongDelay                       | Wimmics         | Delay                        | `wimmics/pingpongdelay/dist/index.js`                                                   |
| SmoothDelay                         | Wimmics         | Delay                        | `wimmics/SmoothDelay/index.js`                                                          |
| Simple Delay                        | Sequencer Party | Delay                        | `burns-audio/delay/index.js`                                                            |
| GraphicEqualizer                    | Wimmics         | EQ & filter                  | `wimmics/graphicEqualizer/index.js`                                                     |
| Simple EQ                           | Sequencer Party | EQ & filter                  | `burns-audio/simpleEQ/index.js`                                                         |
| SweetWah                            | Wimmics         | EQ & filter                  | `wimmics/sweetWah/index.js`                                                             |
| Stereo Enhancer                     | Wimmics         | Modulation / spatial         | `wimmics/StereoEnhancer/index.js`                                                       |
| StonePhaser, ThruZeroFlanger        | Wimmics         | Modulation                   | `wimmics/stonephaser/index.js`, `wimmics/ThruZeroFlanger/index.js`                      |
| Csound Pitch Shifter                | Wimmics         | Pitch                        | `wimmics/csoundPitchShifter/dist/index.js`                                              |
| DualPitchShifter                    | Wimmics         | Pitch                        | `wimmics/DualPitchShifter/index.js`                                                     |
| Big Muff, TS9 Overdrive, Temper     | Wimmics         | Distortion (Faust)           | `wimmics/BigMuff/index.js`, `wimmics/TS9_Overdrive/index.js`, `wimmics/temper/index.js` |
| Simple Distortion                   | Sequencer Party | Distortion                   | `burns-audio/distortion/index.js`                                                       |
| LiveGain, Oscilloscope, Spectrogram | Wimmics         | Visualisation (pass-through) | `wimmics/SRVisualizers/dist/<name>/index.js`                                            |

Instruments in the index (MIDI in, no audio in): Synth-101, Spectrum: Modal,
DRM-16 DrumComputer, Soundfont Player (all Sequencer Party). Not insertable:
Audio Input, Envelope Follower (no audio out), Randomizer, Step Sequencer, the
MIDI and video plugins. Six index entries are mis-categorised against their
descriptors (see the waveform-playlist survey), so trust
`descriptor.hasAudioInput && hasAudioOutput`, which `WamDevice` reads.

**Licensing of the gallery.** The index carries no licence field. The
`webaudiomodules/wam-examples` repository is MIT; `boourns/burns-audio-wam`
(Sequencer Party) and `boourns/wam-community` publish **no licence file**; the
Wimmics collection mixes sources (Faust-generated pedals from the Faust
libraries — LGPL with the library exception —, Csound, hand-written JS) and
must be checked per plugin. Treat the gallery as a demo catalogue: before a
plugin ships inside Breathwork Live or ambient-live, confirm its licence with
the author and pin a copy on our own origin (the community server is a
volunteer host). The adapter itself adds no licence obligation beyond the
SDK's MIT and the MPL-2.0 ring buffer it bundles.

## Testing

`src/wam/__tests__/fake-wam.ts` is a minimal WAM (module constructor, node
with the parameter/state/event/destroy surface, GUI) on the recording mocks,
with parameter info built by the SDK's rules. It drives the adapter's tests and
sits in the shared device-contract table
(`src/core/devices/__tests__/device-contract.test.ts`, row `wam-fake-effect`)
next to every node and WASM device. `host.test.ts` runs the **real**
`initializeWamHost` against the mock context and asserts the two blob modules.
Real-browser smoke is the playground snippet above.

## Out of scope (for now)

Cross-WAM event routing (`connectEvents`), transport events from the engine's
`Transport` to plugins, per-param cancel (a WAM API limit), a UI-kit panel
that lays out `WamParamSpec.choices` as dropdowns (U25 territory).
