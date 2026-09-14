# Devices and the registry

A **device** is any processor that satisfies one contract (R9): typed
parameters with range, taper, unit and default; `setParam`/`getParam`;
`bypass`; reported latency; an `input` and `output` node; `dispose`. Five
kinds satisfy it and a strip, bus, master or rack chain hosts any of them
without knowing which:

| Kind      | Class           | Runs                                                                               | Where                                                                                               |
| --------- | --------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `node`    | `NodeDevice`    | Native Web Audio nodes                                                             | core entry (`filter`, `eq3`, `parametric-eq`, `compressor`, `delay`, `utility`, `convolver-reverb`) |
| `wasm`    | `WasmDevice`    | C++/Faust compiled to the C ABI, one `WebAssembly.Instance` per `AudioWorkletNode` | `./dsp` — nine stock devices ([catalogue](../devices.md))                                           |
| `worklet` | `WorkletDucker` | A hand-written AudioWorklet processor                                              | `./dsp` (`ducker`)                                                                                  |
| `rack`    | `Rack`          | Parallel chains of other devices                                                   | core entry (`rack`)                                                                                 |
| `wam`     | `WamDevice`     | A WebAudioModules 2.0 plugin                                                       | `./wam` ([wam.md](../wam.md))                                                                       |

```ts
interface Device {
  readonly id: string // device type, e.g. 'dattorro'
  readonly params: Record<string, ParamSpec> // { id, name, min, max, default, taper: 'linear' | 'log', unit }
  readonly input: AudioNode
  readonly output: AudioNode
  readonly latencySec: number
  readonly latencySamples?: number // exact where known (limiter: 77 at 48 kHz)
  bypass: boolean // 5 ms dry/wet crossfade, chain keeps running
  setParam(name: string, value: number): void // clamped, ramped
  getParam(name: string): number
  dispose(): void
}
```

`NoteDevice` adds `noteOn(id, frequency, gain?)` / `noteOff(id)` (instruments;
`isNoteDevice`), `ObservableDevice` adds `onChange` (every stock kind; what
`useDevice` subscribes to). Parameter tables live in TypeScript next to each
device, readable before it is instantiated, and `normalizeParam` /
`denormalizeParam` map a value to a 0..1 knob position through its taper —
the same maths the UI kit, the control surface and the macros use.

## Node devices

Stock Web Audio graphs behind `NodeDevice`: every parameter change ramps the
underlying `AudioParam` over the same 5 ms the WASM bypass crossfades. A new
node device is a param table plus a `build(context)` returning the chain and
one applier per param:

```ts
import { defineNodeDevice, NodeDevice } from '@kieranklaassen/live-mix'

const TILT = defineNodeDevice({
  id: 'tilt',
  params: {
    tilt: { id: 0, name: 'Tilt', min: -6, max: 6, default: 0, taper: 'linear', unit: 'dB' },
  },
  build(ctx) {
    const low = ctx.createBiquadFilter()
    low.type = 'lowshelf'
    const high = ctx.createBiquadFilter()
    high.type = 'highshelf'
    low.connect(high)
    return {
      input: low,
      output: high,
      nodes: [low, high],
      apply: {
        tilt: (value, ramp) => {
          ramp(low.gain, -value)
          ramp(high.gain, value)
        },
      },
    }
  },
})
const tilt = new NodeDevice(ctx, TILT, { params: { tilt: 2 } })
```

`ConvolverReverb` (`createConvolverReverb`, a generated hall impulse) is the
node reverb Breathwork Live puts under the coach's voice.

## WASM devices and the C ABI

**One DSP source, two hosts** (KD3, KTD5): a device is C++ compiled with
Emscripten to a flat C ABI, and the same source builds natively in JUCE.
Every module exports exactly this (`cpp/common/device_api.h`):

```c
void   device_init(float sample_rate, int max_block_frames);
void   device_set_param(int param_id, float value);
float* device_in_left(void);  float* device_in_right(void);
float* device_out_left(void); float* device_out_right(void);
int    device_max_block_frames(void);
void   device_process(int frames);   // allocation-free
// instruments add: device_note_on(id, frequency, gain), device_note_off(id)
```

Built with `emcc -O3 -fno-exceptions -fno-rtti --no-entry -s ALLOW_MEMORY_GROWTH=0`,
no JS glue, one static instance per module. On the main thread
`WasmDevice.create(ctx, definition, options)` compiles the module once per
page, adds the worklet script once per context, and gives each device its own
node and `WebAssembly.Instance`. Parameters travel over the `MessagePort`
(`set-param`) and are smoothed inside the C++; bypass is an in-thread 5 ms
crossfade; every factory accepts `{ processorUrl, wasm }` overrides
([getting started §3](../getting-started.md#3-worklet-and-wasm-asset-resolution)).
The committed `.wasm` artefacts reproduce byte-for-byte with the pinned
emsdk (CI gate), and `pnpm test:native` runs every device's C++ parity harness
with the system compiler. Adding one is a [recipe](../recipes/adding-a-wasm-device.md);
the nine stock devices, their origins, parameters and measured CPU cost are in
[devices.md](../devices.md); Faust's path onto the same ABI is
[faust-devices.md](../faust-devices.md).

## The registry and presets

`devices` (a `DeviceRegistry`) maps ids to descriptors — metadata, param
table, factory presets, version and factory — so an engine or a UI can
enumerate and instantiate any device uniformly (R31). The node devices are
pre-registered; the WASM devices join with one call from `./dsp`; a WAM joins
after a probe ([wam.md](../wam.md#registry-kind-wam)).

```ts
import { devices } from '@kieranklaassen/live-mix'
import { registerStockWasmDevices, wasmDeviceDescriptor } from '@kieranklaassen/live-mix/dsp'

registerStockWasmDevices() // dattorro, fdn-reverb, stereo-widener, zita-rev1, limiter-1176, ducker, spectral-drifter, ether-reverb, felt-piano
devices.register(wasmDeviceDescriptor(MY_DEVICE, { name: 'Mine', category: 'reverb' }))

devices.list({ category: 'reverb' }).map((d) => d.name)
const plate = await devices.create('dattorro', ctx, { preset: 'Small plate', params: { mix: 0.2 } })
const preset = devices.capturePreset(plate, 'Tonight') // { name, deviceId, deviceVersion, params }
localStorage.setItem('plate', serializePreset(preset))
applyPreset(plate, parsePreset(localStorage.getItem('plate')))
```

An engine takes its own registry (`createEngine({ devices })`) — the
playground gives its mock-context demo a registry without WASM devices, since
the mock cannot host a worklet. Presets are partial param snapshots stamped
with the descriptor version; on load, unknown params are dropped and values
clamped, so a preset from an older device version still applies. A descriptor
may carry `experimental: true` (Felt today: over the CPU gate) for hosts to
label or hide.

## Racks and macros

A `Rack` is a `Device` made of parallel `Chain`s summed back to one output, so
it sits anywhere a device does — a strip, a bus, the master, another rack.
Each chain is an ordered insert list with its own gain, pan and mute (5 ms
ramps) and a `keyZone`/`selectorZone` reserved for instrument racks. An empty
rack passes audio; `mix` is the rack's dry/wet (linear law, default wet) and
bypass crossfades to dry. Racks nest.

```ts
import { Lfo, createCompressor, createFilter, createRack } from '@kieranklaassen/live-mix'

const rack = createRack(engine.context, { name: 'Space' })
const dry = rack.addChain({ name: 'Dry', gain: 0.8 })
const wet = rack.addChain({ name: 'Wet', pan: 0.3 })
const squash = createCompressor(engine.context)
const tone = createFilter(engine.context)
wet.addInsert(squash)
wet.addInsert(tone)
music.strip.addInsert(rack)

// Macros: eight 0..1 params (`macro1`…`macro8`, plus `mix`) mapped onto inner
// device params with a range and a curve, following the param's taper (a log
// frequency sweeps geometrically). A macro's first mapping adopts the param's
// current position, so nothing jumps; later mappings move the param.
rack.mapMacro(0, tone, 'frequency', { min: 200, max: 8000, curve: 'logarithmic' })
rack.mapMacro(0, squash, 'threshold', { min: -12, max: -36 }) // inverted range
rack.macros[0].name = 'Tone'
rack.setParam('macro1', 0.5) // ≡ rack.macros[0].set(0.5)

// The macros are Macro modulators: lanes and LFOs drive them through the
// engine's ModMatrix, and they are ModSources other routes can read.
engine.modulation.attach(rack.macroTarget(0, { base: toneLane }))
engine.modulation.map(new Lfo({ rateHz: 0.1 }), rack.macroTarget(1), 0.3)
```

`devices.create('rack', ctx, { preset: 'Centred' })`, `capturePreset(rack)`
and `applyPreset` cover the macro and mix values. A whole-rack preset is the
structure too: `captureRackPreset(rack, 'Tonight', { registry: devices })`
records every chain's settings, every device as a preset (nested racks
recursively), macro names, values and mappings; `serializeRackPreset` /
`parseRackPreset` are its JSON form, and
`await createRackFromPreset(ctx, preset, { registry: devices })` rebuilds it
through the registry (`deviceOptions: (id) => ({ processorUrl, wasm })` hands
per-device factory options through).

## Latency and delay compensation

Every device reports `latencySec`, and those that know it exactly also report
`latencySamples` (the true-peak limiter: `truePeakLimiterLatencySamples(sampleRate)`,
77 at 48 kHz; every `NodeDevice` and `WasmDevice` derives it from the seconds
otherwise; `deviceLatencySamples()` reads either). Plugin delay compensation
(R12) then works at two levels:

- **Automatic inside a rack.** Each chain ends in a `DelayNode` set
  sample-exactly to the longest chain's latency minus its own, updated whenever
  any chain's inserts (or a nested rack's) change, so parallel processing never
  smears. The rack reports its longest chain as its own latency.
- **On request across the mix.** `engine.alignLatency()` gives every clip and
  instrument track an `AlignmentDelay` insert (one `DelayNode`, zero reported
  latency) sized so all of them reach the output together with the longest
  path; re-run it after inserts change and the stages resize in place.

Reported only, never delayed: **live-input tracks** (monitoring stays
immediate; `{ liveInputs: true }` opts in — the offline renderer does), returns
(sends are post-fader, so a return hears its sources already aligned), plain
buses, groups, element tracks, and sends themselves. A device's latency counts
whether or not it is bypassed, so toggling bypass never moves a delay line;
compensation is capped at `PDC_MAX_DELAY_SECONDS` (1 s) per stage.

```ts
const report = engine.latencyReport() // creates no nodes
report.masterSamples // inserts + limiter on the master (77 with the true-peak limiter at 48 kHz)
report.maxArrivalSamples // what alignLatency brings every alignable path to
for (const path of report.paths) {
  // { key: 'track/music', kind, ownSamples, compensationSamples, latencySamples,
  //   arrivalSamples, arrivalSec, deficitSamples, devices: [{ id, latencySamples, compensation }],
  //   destination: 'group/drums' | 'master' | null, alignable }
}
engine.alignLatency() // returns the report afterwards; alignable paths show deficitSamples 0
```

The whole mix is late by `maxArrivalSamples` relative to a dry input;
recorded input is compensated against that offset when it becomes a clip.

## Real-time rules every device follows

- Nothing allocates inside `process()`; WASM memory is fixed and heap views are
  taken once.
- Denormals are flushed in software (`flush_denormal`) in every feedback path
  — WASM has no flush-to-zero.
- Parameter changes are click-free: ramps or curves inside the device, never a
  hard switch.
- The engine never touches `window`, `document` or `AudioContext` at import
  time; asset URLs resolve inside factories.
