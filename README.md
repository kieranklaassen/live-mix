# live-mix

An Ableton-like mixing engine for the browser, as one small TypeScript library:
tracks → inserts → sends → master, a transport with an anchor-based clock, a
lookahead clip scheduler, live-input tracks, and a generic WASM device host on
raw Web Audio + AudioWorklet. No framework in the core, zero runtime
dependencies, import-safe under SSR, and headless-testable in Node.

`@kieranklaassen/live-mix` is the shared audio layer of
[Breathwork Live](https://github.com/kieranklaassen/breathwork-live) (a live
speech-to-speech breathwork coach that mixes music under an AI voice, on iPhones
with the screen locked) and
[ambient-live](https://github.com/kieranklaassen/ambient-live) (a personal
ambient instrument that paints samples onto a looping timeline through a plate
reverb). Both apps had grown their own half of a mixer; this is the one they
share.

> **Status:** `0.x`, pre-release, **private repository**. The API changes in
> minor versions; both consumer apps pin exact versions. No support promise —
> this is a solo-maintainer library that contains exactly what its two
> consumers use.

## Vision

- **One engine, many products.** The mixer, transport, arrangement and device
  host live here. Domain logic (breathwork sections, paint gestures) stays in
  the apps.
- **Seconds are the primary time unit.** Breathwork Live is clock-driven;
  ambient-live loops in seconds. Bars and beats are a later view over the same
  clock.
- **One scheduler, one lookahead.** Position always derives from an audio-clock
  anchor, never from accumulated ticks, so a throttled background tab catches
  up instead of skipping or replaying.
- **Live input is a pass-through track.** A `MediaStream` (a microphone, a
  WebRTC voice) gets inserts and sends like any other track and never crosses
  the lookahead path.
- **One DSP source, two hosts.** Devices are C++ compiled with Emscripten to a
  flat C ABI (`cpp/common/device_api.h`), one `WebAssembly.Instance` per
  `AudioWorkletNode`; the same source builds natively in JUCE. Native-node
  devices (Convolver, Biquad) exist too, but nothing in the core path depends
  on one.
- **Browser-first, iPhone-honest.** An `OutputRouter` is the single terminus
  for the whole mix, so lock-screen playback through a media element and
  `MediaSession` is engine-wide rather than per code path. No
  `crossOriginIsolated` requirement; `SharedArrayBuffer` is never mandatory.
- **Visual = audio.** Any UI curve reads the same formula as the DSP.
- **Testable at the AudioParam boundary.** `./testing` ships a recording mock
  context; behaviour is asserted on what the graph was told to do.

The full requirements and the phased execution plan live in
[`docs/plans/`](./docs/plans/).

## API sketch

```ts
import { createEngine } from '@kieranklaassen/live-mix'
import { createDattorroReverb } from '@kieranklaassen/live-mix/dsp'

const engine = createEngine({ context: new AudioContext(), outputMode: 'direct' })

// Tracks feed buses; everything ends at engine.master → OutputRouter.
const music = engine.addAudioTrack({ name: 'music', lookaheadSec: 5, preloadSec: 12 })
const voice = engine.addLiveInputTrack({ name: 'voice', stream: remoteMediaStream })
const hall = engine.addReturnTrack({ name: 'hall', device: engine.devices.convolverReverb() })
voice.sends.add(hall, { level: 0.26 })

// Sidechain: the voice keys a ducker on the music bus.
music.inserts.add(engine.devices.ducker({ key: voice, depth: 0.68 }))

// A WASM device as a master insert (ambient-live's Dattorro plate).
const plate = await createDattorroReverb(engine.context, { params: { mix: 0.35 } })
engine.master.inserts.add(plate)

// Opt-in master stages: an unbypassable −1 dBTP true-peak limiter after the
// inserts, and a BS.1770 loudness / true-peak meter tapping the limited output.
const limiter = await engine.master.installLimiter((ctx) => createTruePeakLimiter(ctx))
const lufs = await engine.master.installLufsMeter({ intervalMs: 50 })
lufs.subscribe(({ shortTerm }) => draw(shortTerm, lufs.truePeakDb))

// Clips are seconds-first records; the scheduler hands them to the graph
// inside the track's lookahead window and joins late clips mid-way.
music.clips.add({
  id: 'a',
  source: await engine.samples.load('a', '/music/a.mp3'),
  startSec: 0,
  offsetSec: 0,
  durationSec: 180,
  fadeInSec: 2.5,
  fadeOutSec: 2.5,
  fadeCurve: 'equalPower',
  gainDb: -3.2,
})

engine.transport.start()
engine.transport.onStateChange((state) => console.log(state))
engine.transport.stop({ fadeSec: 0.75 })
```

### Channel strips and groups

Every track kind (`AudioTrack`, `LiveInputTrack`, `InstrumentTrack`, `ReturnTrack`, `GroupTrack`)
has a `strip`: input gain → inserts → pan → fader → mute/solo gate →
destination, plus post-fader `sends`. All changes are `setTargetAtTime`
approaches (5 ms constant by default), never steps.

```ts
const kick = engine.addAudioTrack('kick')
const snare = engine.addAudioTrack('snare')
const drums = engine.addGroup('drums', { members: [kick, snare] }) // summing strip → master

kick.strip.setPan(-0.3)
drums.strip.setLevel(0.8)
snare.strip.mute = true
kick.strip.solo = true // solo-in-place: pad/voice ramp to silence, drums and returns stay open
engine.solo.clear()
drums.strip.addInsert(plate)
drums.strip.sends.add(hall, { level: 0.2 })
```

A track's strip creates **no nodes until first used** (pan, level, mute, solo,
an insert or a send), so Phase 0 node order is unchanged: voices and dry gains
connect straight to the destination and are re-pointed into the strip on
first use, at unity, on one render quantum. Groups are explicit and build
their four nodes on creation; `group.input` is the summing node.

Solo-in-place: a soloed strip is heard through its normal routing at the main
output; every other strip is muted by a ramp on its gate unless it is soloed,
an ancestor group is soloed, a descendant is soloed, or it is `soloSafe`
(returns default to `soloSafe: true`). An explicit `mute` always wins. Plain
`Bus`es are summing nodes outside the solo tree.

Entry points (all ESM):

| Import                                      | Contents                                                                                                                                                                                                                |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@kieranklaassen/live-mix`                  | Engine, tracks, buses, `Transport`, `Scheduler`, `Clip`, `SampleStore`, `OutputRouter`, native devices, score                                                                                                           |
| `@kieranklaassen/live-mix/dsp`              | `WasmDevice` host, the C ABI typings, device factories (`createDattorroReverb`, …) and their param tables                                                                                                               |
| `@kieranklaassen/live-mix/react`            | Headless hooks over the engine (`LiveMixProvider`, `useTransport`, `useTrack`, `useMeter`, …) and the styled kit (`Knob`, `Fader`, `Meter`, `MixerView`, `DevicePanel`, `TimelineView`, …); `react` is an optional peer |
| `@kieranklaassen/live-mix/react/styles.css` | The kit's default theme (JAXA-Zen, `data-lm-theme="dark"`) and component rules; optional — set the `--lm-*` tokens yourself instead                                                                                     |
| `@kieranklaassen/live-mix/testing`          | `MockAudioContext` with an AudioParam event recorder, framework-free                                                                                                                                                    |
| `@kieranklaassen/live-mix/wam`              | `WamDevice`: WebAudioModules 2.0 plugins as devices (`@webaudiomodules/sdk` + `api` are optional peers)                                                                                                                 |
| `@kieranklaassen/live-mix/worklets/*`       | Raw worklet bundles, for consumers that prefer explicit `?url` imports                                                                                                                                                  |
| `@kieranklaassen/live-mix/wasm/*`           | Raw `.wasm` artefacts, same reason                                                                                                                                                                                      |

### Memory: sample eviction and streaming beds

Decoded stereo PCM costs ~23 MB per minute at 48 kHz, so the `SampleStore` is
an LRU cache with an optional byte budget. Off by default; opt in per engine:

```ts
const engine = createEngine({ context, samples: { budgetBytes: 192 * 1024 * 1024 } })
engine.samples.pin('stinger') // never evicted until unpin
const release = engine.samples.retain('intro') // held while a clip uses it
engine.samples.metrics // { bytes, budgetBytes, count, pinned, held, evictions, evictedBytes, loads, overBudget }

// Keep what a track is about to play out of eviction: follows its preload window.
new SampleRetainer({
  samples: engine.samples,
  track: music,
  now: () => engine.now(),
  scheduler: engine.scheduler,
})

// Long beds stream instead of decoding: an <audio> element into the same graph.
const bed = new ElementSource(engine.context, { id: 'bed', url: '/beds/forest.mp3' })
const beds = new ElementTrack(engine.context, {
  name: 'beds',
  destination: engine.master,
  now: () => engine.now(),
  sources: [bed],
  scheduler: engine.scheduler,
})
beds.clips.add({
  id: 'forest',
  sourceId: 'bed',
  startSec: 0,
  offsetSec: 0,
  durationSec: 2700,
  fadeInSec: 4,
  fadeOutSec: 8,
  fadeCurve: 'linear',
  gainDb: -6,
})
await beds.unlockAll() // from the start gesture, so iOS allows the timer-driven play()
```

Element starts are timer-accurate, not sample-accurate; the envelope stays on
the audio clock. Differences from `AudioTrack` and the iPhone checklist are in
[`docs/iphone-memory-and-element-source.md`](./docs/iphone-memory-and-element-source.md).

### Master limiter, loudness meters and stats

Nothing below is in the default graph: the engine still creates exactly the
nodes it did before (router → master gain → optional analyser meter → buses),
so recorded-node-order harnesses stay green. Each stage is installed once,
after the engine exists, because it loads a worklet.

**Limiter.** `engine.master.installLimiter((ctx) => createTruePeakLimiter(ctx, options))`
places the device the factory returns as a fixed stage after the fader and
every insert, ahead of the analyser meter and the terminus. It is not an
insert: `removeInsert` cannot reach it, the returned `MasterLimiter` exposes
`setParam`/`getParam`/`params`/`latencySec` and no bypass, and the bus disposes
it. `createTruePeakLimiter` (dsp entry, `cpp/devices/true-peak-limiter/`) is a
stereo-linked lookahead brickwall: the detector is the ITU-R BS.1770-4 Annex 2
four-phase true-peak FIR — the same table the meter uses — so the meter's
true-peak reading of the limited output never exceeds `ceilingDb` (−20..0 dBTP,
default −1), and a final clip keeps every sample under it too. Attack is a
linear ramp over the 1.5 ms lookahead ending exactly when the peak arrives;
`releaseMs` (10..2000, default 100) is the exponential recovery; `inputGainDb`
(±24) drives the detector. Latency 77 samples at 48 kHz
(`TRUE_PEAK_LIMITER_LATENCY_SECONDS`). Any other `Device` can be installed the
same way (e.g. `createLimiter1176` for character before the wall — as an
insert — or a custom device as the wall).

**Meters.** `LufsMeter.create(ctx, { intervalMs, processorUrl, createNode })`
hosts `dist/worklets/meter.js`, an AudioWorklet sink (one stereo input, no
output) that computes BS.1770-4 momentary (400 ms), short-term (3 s) and gated
integrated loudness (−70 LUFS absolute, −10 LU relative, 0.01 LU histogram so
memory is fixed for any session length), sample peak and true peak (4× to
48 kHz, 2× to 96 kHz), and posts a `MeterReading` at ≤ 30 Hz (default 20 Hz).
Read it synchronously (`lufsShortTerm`, `truePeakDb`, `maxTruePeakDb`, …) or
`subscribe`. Feed it from any bus with `bus.addTap(meter.input)` — taps are
re-fed after every insert change — or use
`engine.master.installLufsMeter(options)`, which taps the limited output.
`LoudnessAnalyzer` (core entry) is the same DSP as a plain class for offline
analysis of decoded buffers; the EBU Tech 3341 references (997 Hz at −23 dBFS
stereo → −23.0 LUFS ±0.1, gating cases) are its tests.

**Stats.** `engine.stats` counts glitches from `AudioContext.renderCapacity`
where a browser exposes it (`supported`), converting each update's
`underrunRatio` into render quanta; hosts add their own with
`stats.recordGlitch()` and read `snapshot()` / `subscribe`.

**Budgets (R38).** In Node 22 on one Xeon core the analyser runs 60 s of
stereo 48 kHz audio in 294 ms (0.5 % of real time) and the limiter's `.wasm` in
96 ms (0.16 %); both are allocation-free per block. The iPhone figure (target:
meter and ducker together under 5 % CPU with two devices) is recorded by hand
when a consumer ships them. The core entry with its shared chunks (React and
`signalsmith-stretch` external) is 115 KB minified / 34 KB gzipped, measured
with `esbuild dist/index.js --bundle --minify --format=esm`; the meter worklet
bundle is 13 KB, the capture worklet 3 KB.

## Install

The repository is **private**, so every install path authenticates. The
package is published to **GitHub Packages** (`npm.pkg.github.com`) under the
`@kieranklaassen` scope; consumers pin exact versions and point the scope at
that registry.

### 1. Consumer `.npmrc` (committed)

```ini
@kieranklaassen:registry=https://npm.pkg.github.com
```

No token goes in the committed file. `swiss-grid` and other `github:`
dependencies in the same scope are unaffected (git specs bypass the registry).

### 2. Auth, per environment

| Where                   | How                                                                                                                                                                                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Kieran's machines       | `npm login --registry=https://npm.pkg.github.com --scope=@kieranklaassen` once (username `kieranklaassen`, password = a PAT with `read:packages`). Stored in `~/.npmrc`.                                                                                                                               |
| Consumer GitHub Actions | `actions/setup-node` with `registry-url: https://npm.pkg.github.com`, `scope: '@kieranklaassen'` and `NODE_AUTH_TOKEN: ${{ secrets.LIVE_MIX_NPM_TOKEN }}` — a classic PAT with `read:packages`, stored as a repository secret. A repo's own `GITHUB_TOKEN` cannot read another repo's private package. |
| Kamal / Docker build    | Kamal `builder.secrets: [NPM_TOKEN]` (value from `.kamal/secrets`, e.g. the same token as `KAMAL_REGISTRY_PASSWORD`, which already needs `packages` scope to push to ghcr), and in the Dockerfile build stage:                                                                                         |

```dockerfile
RUN --mount=type=secret,id=NPM_TOKEN,required=true \
    echo "//npm.pkg.github.com/:_authToken=$(cat /run/secrets/NPM_TOKEN)" > /root/.npmrc && \
    npm ci && rm -f /root/.npmrc
```

### 3. Versions

```sh
npm install @kieranklaassen/live-mix@0.1.0        # releases (dist-tag latest)
npm install @kieranklaassen/live-mix@next          # snapshot of the latest main with pending changesets
```

### Fallback: git dependency

`npm install github:kieranklaassen/live-mix#<sha>` still works — `prepare`
builds `dist/` with nothing but Node, and the `.wasm` artefacts are committed —
but it needs git access to the private repo wherever `npm ci` runs (a PAT with
`repo` scope via `git config url."https://x-access-token:$TOKEN@github.com/".insteadOf "https://github.com/"`)
and re-runs the library build in every consumer install. CI proves this path on
every run (`git-fallback` job); prefer the registry.

### Vite

Vite consumers add this so the pure-ESM package is not pre-bundled (which would
break `import.meta.url` asset resolution for the worklet and `.wasm` in dev):

```ts
// vite.config.ts
export default defineConfig({
  optimizeDeps: { exclude: ['@kieranklaassen/live-mix'] },
})
```

## Development

```sh
pnpm install          # also builds dist/ (prepare)
pnpm test             # Vitest, Node environment
pnpm typecheck
pnpm lint             # eslint + prettier --check
pnpm dev              # rebuild on change
pnpm build            # tsup entries + esbuild worklet bundles + wasm copy
pnpm pack:check       # pack a tarball and verify every export resolves
pnpm test:native      # C++ device harnesses with the system compiler
pnpm build:wasm       # rebuild src/dsp/wasm/*.wasm (needs Emscripten 4.0.15)
bash scripts/ci-local.sh   # the whole CI matrix locally; prints a Markdown summary for PR bodies
pnpm build:faust      # regenerate cpp/faust/generated + src/dsp/devices/faust from *.dsp (builds Faust 2.88.0 into tmp/)
```

`scripts/ci-local.sh` mirrors `.github/workflows/ci.yml` step for step (typecheck,
lint, tests, build, pack check, native C++ tests, emsdk rebuild diffed against
the committed `.wasm`, and the `github:` install path — set `GITHUB_TOKEN` for
the last one). On machines where `c++` is a header-less clang it picks `g++`.

Iterating against an app without publishing:

```sh
# live-mix
pnpm build --watch    # (or re-run pnpm build)
# the app (both apps use npm)
npm link ../live-mix
```

### Layout

```
src/
  index.ts            core entry
  core/               Engine, tracks, buses, Transport, Scheduler, Clip, SampleStore, OutputRouter, Meter, native devices, stats
  core/devices/       Device contract, NodeDevice host + stock node devices, registry, presets, Rack/Chain, Macro maths, pdc (latency report, AlignmentDelay)
  core/analysis/      Meter (analyser), LoudnessAnalyzer (BS.1770-4 DSP), LufsMeter (worklet host) + meter protocol
  core/render/        OfflineRenderer (renderOffline, renderStems, scheduleAhead), encode (WAV), Recorder (worklet + MediaRecorder capture)
  browser-tests/      Playwright real-audio golden: page harness over /dist, Web Audio call recorder, fingerprints, playground smoke
  dsp/                WasmDevice host, C ABI typings, device factories + param tables
  dsp/devices/faust/  generated param tables for the Faust devices (scripts/build-faust.sh)
  dsp/worklets/       wasm-device, ducker, meter, recorder processors → dist/worklets/*.js (one file each, no imports)
  dsp/wasm/           committed *.wasm artefacts (scripts/build-wasm.sh; CI verifies they reproduce)
  react/              headless hooks (U24): hooks/*, frame sampling, useSyncExternalStore store
  react/components/   the styled kit (U25): control maths, useParamControl, Knob, Fader, Meter, TransportBar, strips, mixer, device panel/chain, timeline, tokens
  react/styles.css    default theme (--lm-* tokens) + component rules → dist/react/styles.css
  score/              Score schema, operations + inverses, OperationLog, History, ScoreDocument, ScoreRenderer
  testing/            MockAudioContext + AudioParam recorder
  wam/                WebAudioModules 2.0 host adapter → its own entry (docs/wam.md)
playground/           Vite page mounting the kit on a demo engine (not published): pnpm playground
cpp/
  common/             device_api.h (the C ABI), dsp_util.h
  devices/dattorro/   Dattorro plate (from ambient-live) behind the ABI
  devices/fdn-reverb/ Tides 8-line FDN reverb (from kkfonie) behind the ABI
  devices/stereo-widener/  kkfonie's StereoWidener (source unchanged, SHA in device.json) behind the ABI
  devices/true-peak-limiter/  lookahead BS.1770 true-peak brickwall for the master (header-only DSP) behind the ABI
  devices/spectral-drifter/  kkfonie Bloom's granular pitch drifter (de-JUCEd, SHA in device.json) behind the ABI
  devices/ether-reverb/  kkfonie Ether: Freeverb as juce::Reverb runs it, pre-delay, decay law, freeze, behind the ABI
  devices/felt-piano/  kkfonie Felt: modal felt piano instrument (Felt's DSP sources unchanged, SHA in device.json) behind the ABI + note entry points
  faust/              Faust devices: *.dsp sources, generated/ C++, *.device.cpp ABI shims (docs/faust-devices.md)
  test/               native harnesses (parity tests for every ported device)
scripts/              build.mjs, build-wasm.sh, build-faust.sh, test-native.sh, check-pack.mjs
```

### The WASM device ABI

Every device module exports exactly this (see `cpp/common/device_api.h`):

```c
void   device_init(float sample_rate, int max_block_frames);
void   device_set_param(int param_id, float value);
float* device_in_left(void);  float* device_in_right(void);
float* device_out_left(void); float* device_out_right(void);
int    device_max_block_frames(void);
void   device_process(int frames);   // allocation-free
```

Built with `emcc -O3 -fno-exceptions -fno-rtti --no-entry -s ALLOW_MEMORY_GROWTH=0`,
no JS glue, one static instance per module. Parameter tables (id, name, range,
taper, default) live in TypeScript next to each device
(`src/dsp/devices/*.ts`), and a `device.json` beside the C++ records the
sources and their origin.

On the main thread a device is `WasmDevice.create(ctx, definition, options)`:
the module is compiled once per page, the worklet script is added once per
context, and each device gets its own node and `WebAssembly.Instance`.
Parameters travel over the `MessagePort` (`set-param`), bypass is an in-thread
5 ms crossfade (`bypass`), and every factory accepts `{ processorUrl, wasm }`
overrides for hosts that resolve assets themselves:

```ts
import { defineWasmDevice, WasmDevice } from '@kieranklaassen/live-mix/dsp'

const MY_DEVICE = defineWasmDevice({
  id: 'my-device',
  wasm: () => new URL('./my-device.wasm', import.meta.url), // lazy, literal path
  params: {
    amount: { id: 0, name: 'Amount', min: 0, max: 1, default: 0.5, taper: 'linear', unit: '' },
  },
})
const device = await WasmDevice.create(ctx, MY_DEVICE, { params: { amount: 0.8 } })
device.setParam('amount', 0.2)
device.bypass = true
```

Devices written in [Faust](https://faust.grame.fr) (`cpp/faust/*.dsp`:
Zita-Rev1 via `createZitaReverb`, an 1176 limiter via `createLimiter1176`)
compile to C++ at library build time and sit behind the same ABI; see
[`docs/faust-devices.md`](./docs/faust-devices.md). The full device catalogue
with each device's origin, parameters and measured CPU cost (native and wasm)
is [`docs/devices.md`](./docs/devices.md).

### Node devices, the registry and presets

Stock Web Audio graphs satisfy the same `Device` contract through `NodeDevice`
(core entry): `filter`, `eq3`, `parametric-eq`, `compressor`, `delay` and
`utility`. Every parameter change ramps the underlying `AudioParam` over the
same 5 ms the WASM bypass crossfades, and bypass is a dry/wet crossfade that
keeps the chain running. A new node device is a param table plus a
`build(context)` that returns the chain and one applier per param:

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

The registry (`devices`, a `DeviceRegistry`) maps ids to descriptors —
metadata, param table, factory presets, version and factory — so an engine or
UI can enumerate and instantiate any device uniformly. The node devices are
pre-registered; the WASM devices join with one call from `./dsp`:

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

Presets are partial param snapshots; on load, unknown params are dropped and
values clamped, so a preset from an older device version still applies.

### Racks, macros and delay compensation

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
music.strip.addInsert(rack) // or bus.addInsert, or anotherRack.chains[0].addInsert

// Macros: eight 0..1 params (`macro1`…`macro8`, plus `mix`) mapped onto inner
// device params with a range and a curve, following the param's taper (a log
// frequency sweeps geometrically). A macro's first mapping adopts the param's
// current position, so nothing jumps; later mappings move the param.
rack.mapMacro(0, tone, 'frequency', { min: 200, max: 8000, curve: 'logarithmic' })
rack.mapMacro(0, squash, 'threshold', { min: -12, max: -36 }) // inverted range
rack.macros[0].name = 'Tone'
rack.setParam('macro1', 0.5) // ≡ rack.macros[0].set(0.5)

// The macros are U19 `Macro`s: lanes and LFOs drive them through the engine's
// ModMatrix, and they are `ModSource`s other routes can read.
engine.modulation.attach(rack.macroTarget(0, { base: toneLane })) // a ParamLane at the playhead
engine.modulation.map(new Lfo({ rateHz: 0.1 }), rack.macroTarget(1), 0.3)
```

`devices.create('rack', ctx, { preset: 'Centred' })`, `capturePreset(rack)` and
`applyPreset` cover the macro and mix values (the U23 model). A whole-rack
preset is the structure too: `captureRackPreset(rack, 'Tonight', { registry: devices })`
records every chain's settings, every device as a U23 preset (nested racks
recursively), macro names, values and mappings; `serializeRackPreset` /
`parseRackPreset` are its JSON form, and
`await createRackFromPreset(ctx, preset, { registry: devices })` rebuilds it
through the registry (`deviceOptions: (id) => ({ processorUrl, wasm })` hands
per-device factory options through).

**Plugin delay compensation (R12).** Every device reports `latencySec`, and
those that know it exactly also report `latencySamples` (the true-peak limiter:
`truePeakLimiterLatencySamples(sampleRate)`, 77 at 48 kHz; every `NodeDevice`
and `WasmDevice` derives it from the seconds otherwise; `deviceLatencySamples()`
reads either). Compensated automatically: the chains inside a rack — each one
ends in a `DelayNode` set sample-exactly to the longest chain's latency minus
its own, updated whenever any chain's inserts (or a nested rack's) change, so
parallel processing never smears. The rack reports its longest chain as its own
latency. Compensated on request: `engine.alignLatency()` gives every clip and
instrument track an `AlignmentDelay` insert (one `DelayNode`, zero reported
latency) sized so all of them reach the output together with the longest path;
re-run it after inserts change and the stages resize in place. Reported only,
never delayed: **live-input tracks (monitoring stays immediate; pass
`{ liveInputs: true }` to opt in)**, returns (sends are post-fader, so a return
hears its sources already aligned), plain buses (raw sources connect to
`bus.input`), groups, element tracks, and sends themselves. A device's latency
counts whether or not it is bypassed, so toggling bypass never moves a delay
line; compensation is capped at `PDC_MAX_DELAY_SECONDS` (1 s) per stage.

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
compensating recorded input against that offset is U33.

### WebAudioModules 2.0 plugins

Third-party browser plugins in the [WAM 2.0](https://www.webaudiomodules.com)
format load through `@kieranklaassen/live-mix/wam`, a separate entry so that
`.` and `./dsp` never depend on `@webaudiomodules/sdk` (an optional peer,
pinned with `@webaudiomodules/api`; `pnpm pack:check` enforces the split). A
WAM's `audioNode` becomes a `Device`: its `getParameterInfo()` is the param
table (WAM ids as names, `type`/`step`/`choices` kept on `WamParamSpec`),
`setParam` is `setParameterValues`, bypass is the 5 ms dry/wet crossfade,
`latencySec` comes from `getCompensationDelay()`, presets work unchanged and
`getState`/`setState` carry the plugin's own state. Instruments are
`NoteDevice`s (notes → MIDI events).

```ts
import { devices } from '@kieranklaassen/live-mix'
import { WamDevice, registerWamDevice, wamDeviceParam } from '@kieranklaassen/live-mix/wam'

const verb = await WamDevice.create(ctx, 'https://…/kbverb/index.js', { params: { mix: 0.3 } })
music.strip.addInsert(verb)
panel.append(await verb.createGui()) // the plugin's own UI, placed by the UI kit
engine.automation.add(lane, wamDeviceParam(verb, 'mix')) // U19 lanes as wam-automation events

const kbverb = await registerWamDevice(ctx, 'https://…/kbverb/index.js') // kind: 'wam', id wam:<identifier>
const another = await devices.create(kbverb.id, ctx, { preset: 'Hall' })
```

The host (`WamEnv` + `WamGroup`) installs once per context through the SDK's
`initializeWamHost`; the entry imports only that file, so it stays import-safe
under SSR. Param mapping, the state/preset split, the automation caveats, a
Faust → WAM recipe, the plugin gallery and its licensing are in
[`docs/wam.md`](./docs/wam.md).

### Sidechain ducker: legacy poll or audio-thread worklet

`engine.addDucker(bus)` is the Phase 0 main-thread follower (analyser poll on
the engine clock writing `setTargetAtTime` on the bus fader — identical
recorded events to Breathwork Live). `mode: 'worklet'` swaps in the
audio-thread `WorkletDucker`: a two-input `AudioWorkletNode` (signal, key)
inserted post-fader into the bus, envelope and gain computed per sample with
the same defaults (depth 0.68, attack 80 ms, release 800 ms, key scale 4, gain
time constant 80 ms) plus a hold, no timers. Both implement `SidechainDucker`
(`key`, `unkey`, `stop`, `dispose`, `envelope`). The processor is loaded once
per context from the dsp entry:

```ts
import { createEngine } from '@kieranklaassen/live-mix'
import { loadDuckerProcessor } from '@kieranklaassen/live-mix/dsp'

await loadDuckerProcessor(engine.context) // once, before the first worklet ducker
const ducker = engine.addDucker(music, { mode: 'worklet', holdMs: 120 })
voice.onAttach((source) => ducker.key(source))
ducker.setParam('depth', 0.5) // params: depth, attackMs, holdMs, releaseMs, gainScale, timeConstant
```

`DuckerKernel` is the same DSP as a plain class over `Float32Array` blocks
(offline renders, tests); `createWorkletDucker(ctx, options)` builds a
standalone device for `bus.addInsert`.

### Automation writers: transport- and clock-anchored

`LaneWriter` writes a `ParamLane` ahead of the transport playhead (loop-aware,
rejoins with a short ramp after a seek, stall, edit or released fader, dedupes
same-time events). Both writers hand a segment to the graph whole the moment
the window reaches into it: Chrome and Safari render a ramp issued after its
segment began as a jump to the interpolated value, so the write cursor lands
on segment ends, never inside a segment. `ClockLaneWriter` is the other anchoring: lane seconds are
audio-clock seconds from `anchorSec`, and every lane event is written
verbatim — no join ramps, no dedupe — so a producer that already schedules its
own automation (Breathwork Live's breath guide) can publish it as a lane
without one recorded event changing. `tick(nowSec, lookaheadSec)` is the
guide's loop; `override(t)` / `release(now)` hold and resume with a plain set;
`onEdit: 'append'` keeps scheduled events when the lane only grows.

`OutputRouter.setMediaTitle(title, artist?)` rewrites the lock-screen metadata
in element mode (a placeholder at intake, the theme at takeover); `metadata`
reads it back.

### Warping, tempo and key matching

Seconds stay primary; `TempoMap` (piecewise-constant BPM and meter) is a view
for the grid, quantised launches and warping: `secondsToBeats`,
`beatsToSeconds`, `barBeatAt`, `quantize(sec, 'bar' | 'beat' | n)`.

`StretchSource` plays a decoded buffer through a
[`signalsmith-stretch`](https://www.npmjs.com/package/signalsmith-stretch)
worklet (MIT, optional peer — the library imports nothing from it; pass the
package's `SignalsmithStretch` factory) with tempo-synced rates from warp
markers (`Clip.warp`, `warpSegments(markers, tempo)`) and pitch in semitones
(`Clip.semitones`). It reports the node's latency for delay compensation.

Key matching follows the Camelot rule shared with Breathwork Live's selector
(same number or ±1 wrapping 1–12, letter-agnostic, unparseable codes
compatible with everything): `camelotCompatible`, `camelotDistance`,
`transposeCamelot` (one semitone = seven steps around the wheel), and
`keyMatch(anchor, candidate, { maxSemitones })` — the smallest shift that
lands compatible, `rankByKeyMatch` to order candidates.

### Bouncing, stems and recording

`renderOffline({ durationSec, sampleRate, build })` builds the same engine on
an `OfflineAudioContext` and pre-schedules the whole arrangement from a
virtual clock (scheduler and automation ticks stepped through the duration
plus lookahead) before `startRendering()`, so a bounce is a pure function of
the arrangement: identical every run, and identical — at the level of every
source start and AudioParam event — to what the live engine tells its graph
(`render equals live` golden on the recording mocks; a real-audio comparison
needs a browser and is a Playwright follow-up). `engine.alignLatency()` runs
after the build so plugin-delay compensation is the same in every render;
`result.latency` is the report. `renderStems({ stems: ['music', 'voice'] })`
renders the master plus one solo-in-place pass per track. Main-thread
followers (the legacy `Ducker`, `Meter` readings) cannot run offline; use the
worklet ducker for bounces with sidechain ducking.

**Real-audio golden (`browser-tests/`).** `pnpm test:browser` builds a page
harness over the built package (`/dist`, so worklets and WASM resolve as they
do for a consumer) and drives headless Chrome through Playwright with a real
`AudioContext` (`--autoplay-policy=no-user-gesture-required`, fake media
devices). A scripted session — two clip tracks with a crossfade, a fader lane,
a send into a Dattorro return — is rendered on a real `OfflineAudioContext`
with the graph's `start/stop` and AudioParam calls recorded, then played live
and captured through the recorder worklet. Asserted: the real offline schedule
equals the Node mock golden for the same session; audio flows through the
worklets and WASM; the live capture matches the offline render within 1.5 dB
RMS, 3 dB per 250 ms block and per log band (gated 25 dB under the loudest);
and the built playground mounts without errors. The installed Google Chrome is
used (`channel: 'chrome'`), or Playwright's Chromium with
`LIVE_MIX_BROWSER=chromium`; `scripts/ci-local.sh --browser` runs it, and the
`browser` CI job runs it on every push. Its first catch: a lane ramp handed
to the graph after its segment had begun rendered live as a jump — writers now
schedule a segment whole as soon as the window reaches into it.

`encodeWav(planar, { bitDepth: 16 | 24 | 32 })` writes PCM or float WAV
(`audioBufferToWav`, `wavBlob`, `decodeWav` for tests and imports).
Compressed formats come from the browser: `createRecorder(ctx, source, { mode:
'media-recorder', mimeType })` feeds a `MediaStreamAudioDestinationNode` into
`MediaRecorder` and resolves a `Blob`. The default `'worklet'` mode taps the
master or any bus/track through `dist/worklets/recorder.js`, which posts
sample-exact planar chunks; `stop()` resolves planar audio to encode or to load
into the `SampleStore` as a new clip. Recorders are taps: nothing is inserted
into the audible path.

### React hooks (`./react`)

Headless bindings, no components and no styles (the styled kit is U25). Every
hook subscribes through `useSyncExternalStore` to the change events the core
objects expose (`Transport.onChange`, `ChannelStrip.onChange`,
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
      <TransportBar />
      <Strip name="pad" />
    </LiveMixProvider>
  )
}

function TransportBar() {
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
| `useSession(session)`                     | `scenes`, `tracks`, `cells[scene][track]` with slot states, `statuses`, `quantize`     | `launchScene`, `launchSlot`, `releaseSlot`, `stopSlot`, `stopTrack`, `stopAll`, `setQuantize` |
| `useSlot(session, id)`                    | `slot`, `status`, `state`, `playing`, `queued`, `stopping`                             | `launch`, `release`, `stop`                                                                   |

Hooks that default to an engine part (`useTransport()`, `useMeter()`, …) need
the provider; every hook also takes the object explicitly. The entry is
import-safe under SSR and renders on the server from the same snapshots; the
`.` and `./dsp` entries never import React. Tests run in jsdom with
`@testing-library/react` (`src/react/__tests__`); `LiveMixProvider`'s `frame`
prop injects a hand-driven frame scheduler.

### The score: document, operations, undo, rendering

The score is the source of truth for arrangement, automation and device
graphs: a versioned, seconds-first JSON document (tracks, element tracks,
groups, returns, strips with inserts and sends, clips, lanes, modulators,
routes, master, loop, tempo map, session scenes and slots — `format: 3`). Every edit is a JSON `Operation` with a stable name — the vocabulary
the agent API calls — applied as a pure function with a computed inverse;
an append-only `OperationLog` records author and time; `History` undoes one
step per gesture (a fader drag is one undo); and `loadScore` makes the
engine follow the document through the same public API an app would call, so
the graph is identical either way. Live-input audio is never in the document.

```ts
import { ScoreDocument, loadScore } from '@kieranklaassen/live-mix'

const document = ScoreDocument.parse(json, { devices: engine.devices })
const renderer = loadScore(engine, document)
document.apply({ type: 'strip.set', owner: 'kick', param: 'level', value: 0.6 }, { author })
document.apply({ type: 'clip.replaceFrom', track: 'music', fromSec: 120, clips: plan })
document.undo()
renderer.liveInput('voice').attach(stream)
const bounce = await renderScore(document.score, { durationSec: 240 })
```

Schema, the operation list, the undo granularity decision, the rendering
rules and score bouncing are in [`docs/score.md`](./docs/score.md).

### MIDI and OSC learn (`ControlSurface`)

`src/core/control` maps hardware to the engine (U36, R15). A **mapping table**
binds a `ControlSource` — a MIDI note, CC, 14-bit CC pair, pitch bend or
channel pressure on a channel (0 = omni), or one argument of an OSC address
pattern — to a `ControlTarget`: a strip control (`level`, `pan`, `mute`,
`solo`, `inputGain`) by track name, a send level, the master fader, one
parameter of a registered device instance (taper-aware, through the same
`normalizeParam`/`denormalizeParam` as `useDeviceParam`), a macro, or a
transport action. Modes are `set` (the knob's position becomes the value),
`toggle` and `relative` (endless encoders in two's-complement, binary-offset
or signed-bit encoding); every mapping has an input range, an output span (a
reversed span inverts), a curve (`linear`, `exp`, `log`, `s`) and optional
**soft takeover** (`pickup`): an absolute controller only takes a target once
it crosses the target's current position, and lets go again when automation
or the UI moves the target away.

```ts
import {
  ControlSurface,
  MidiInput,
  OscInput,
  controlEventsFromMidi,
  isMapped,
} from '@kieranklaassen/live-mix'

const surface = new ControlSurface({ engine })
surface.registerDevice('pad-filter', filter) // { kind: 'device', device: 'pad-filter', param: 'frequency' }
surface.attachWriter({ kind: 'strip', track: 'pad', control: 'level' }, laneWriter) // automation yields (R29)

const midi = new MidiInput() // navigator.requestMIDIAccess, injectable
await midi.open()
surface.connect(midi) // every event → surface.handle
midi.onMessage((message) => {
  // Unmapped notes still play the instrument; a mapped pad never does.
  if (message.type !== 'note-on') return
  const [event] = controlEventsFromMidi(message)
  if (!isMapped(surface.table, event)) instrument.noteOn(message.note, midiToHz(message.note))
})

const osc = new OscInput({ url: 'ws://localhost:8080' }) // OSC 1.0 over a WebSocket bridge, bundles included
await osc.open()
surface.connect(osc)

surface.beginLearn({ kind: 'strip', track: 'pad', control: 'level' }) // next CC/note/OSC arg binds
surface.persist(localStorage) // versioned JSON, malformed entries dropped, migrations supported
```

Dispatch goes through the engine's own ramped setters (`ChannelStrip.setLevel`
/ `setPan` / `setMute` / `setSolo`, `Bus.setLevel`, `Device.setParam`,
`Macro.set`), never a step. A target with an attached `LaneWriter` is
overridden with cancel-and-hold on the first controller write and handed back
with `surface.release(target)`. `handle(event)` reports whether the event was
consumed, so a mapped pad never reaches an instrument. Learning binds the
next position or press (a release keeps waiting); a 14-bit knob learned from
its MSB upgrades to the `cc14` pair when the LSB follows.

The pure layer (`createMapping`, `mapTarget`, `resolveControlEvent`,
`learnFromEvent`, `serializeMappingTable`/`parseMappingTable`,
`loadMappingTable`/`saveMappingTable`) is ambient-live's U27 `midi-map`
generalised; `ambientLiveMidiMapMigration` converts its stored format-1
tables. `./react` adds `useControlSurface(surface)` and
`useLearn(surface, target)`. Details and the migration path:
[docs/control-surface.md](./docs/control-surface.md).

### React UI kit (`./react`, U25)

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

| Component                                   | What it draws                                                                                                                                                                                                                                                          |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Knob`, `Fader`                             | `role="slider"` controls, controlled (`value`) or uncontrolled (`defaultValue`): pointer drag (Shift = fine), wheel, arrows / PageUp / Home / End, double-click reset; `linear`, `log`, `skewed` and `fader` tapers; `onChangeStart` / `onChangeEnd` bracket a gesture |
| `Meter`                                     | Peak / RMS / LUFS / true-peak bars on the dB scale (`gainToDb` of the analyser reading) with a peak-hold marker; a `MeterSource` through `useMeter`, or an explicit `reading`                                                                                          |
| `TransportBar`                              | Play / pause, stop, position (`m:ss.t`), loop toggle with length, loop pass                                                                                                                                                                                            |
| `ChannelStripView` (`MixerStrip`)           | Inserts, sends (name, level, thin fader), pan, a dB fader (`−60 … +6`, unity tick, `−∞` at the bottom) that converts through `dbToGain` / `gainToDb`, mute / solo, a meter tapped off the strip output (`meter` prop)                                                  |
| `MixerView`, `MasterStripView`              | Sections for tracks (+ `inputs`), groups, `returns`, and the master (bus fader + engine meter); lists default to the provided engine's `tracks` / `groups`                                                                                                             |
| `DevicePanel` (`DeviceView`), `DeviceFrame` | One taper-aware knob per `ParamSpec` (steps derived from unit and range; `choiceLabels` for enumerations), bypass on the power switch, a preset picker from the registry descriptor; the frame alone for custom bodies                                                 |
| `DeviceChainView`                           | A strip's inserts as panels with move earlier / later, drag-and-drop reorder (`reorderInserts`), remove (+ dispose) and an add picker over the registry                                                                                                                |
| `TimelineView`, `Waveform`                  | Lanes per clip source with clips placed in seconds, `sounding` / `upcoming` from `useSchedule`, loop region, a frame-sampled playhead, waveforms from decoded peaks; click or arrow the ruler to seek                                                                  |
| `DeviceToggle`, `ToggleButton`              | The squared power switch and the pressed / unpressed button (mute, solo, loop tones)                                                                                                                                                                                   |

`useParamControl` is the shared interaction hook for custom controls, and the
pure maths (`normalizeValue`, `quantize`, `faderDbToLevel`, `dbToMeterPosition`,
`formatControlValue`, `paramStep`, …) is exported for hosts that draw their
own. Every value shown derives from the DSP's own formula (R33): fader dB is
`gainToDb` of the strip level, meter positions are `gainToDb` of the analyser
peak, knob positions are `useDeviceParam`'s taper. Component tests run in
jsdom (pointer, wheel and keyboard through `@testing-library/react`), and every
component renders under `react-dom/server` from the same snapshots.
`playground/` mounts the kit on a demo engine over the recording mocks:
`pnpm playground`, then <http://localhost:5199/> (`?play=1` starts the
transport, `?theme=jaxa-zen-dark`).

### The agent control API

Every capability is a tool a model can call: the 59 score operations, the
coach's intents (`steer_music`, `set_intensity`, `set_music_volume`, `duck`,
`extend_section`, `advance_section`, `set_breath_pace`, `fade_out`,
`set_ambience`, `more_space`, `match_key`), a `get_state` query and `undo`,
each with a JSON Schema. `listTools()` / `toOpenAiTools()` /
`toAnthropicTools()` export the catalogue for a model session; `call` runs
the safety rails the agent cannot override — fader range, short-term LUFS and
true-peak ceilings, gain slew, no hard mute of the voice while speaking, no
silencing the music, per-tool rate limits, consent for structural edits —
applies through `ScoreDocument.apply` with the agent as author, and records
an audit trail. `snapshot()` is a ≤ 2 KB state document for the prompt;
`diffSince(cursor)` only what changed. Intents compile to score operations,
engine calls, or the consumer's session hooks (sections, pace, dip logic).

```ts
import { AgentController } from '@kieranklaassen/live-mix'

const agent = new AgentController({
  engine,
  document,
  roles: { voice: 'voice', music: 'music' },
  library,
  session,
})
realtime.update({ tools: agent.toOpenAiTools() })
const result = agent.call(
  'steer_music',
  { direction: 'calmer' },
  { author: { kind: 'agent', id: 'coach' } },
)
// { ok: true, result: { direction: 'calmer', targetIntensity: 1, nowPlaying: 'Still Water', boundaryShiftSec: 84 }, operations: [...], rails: [] }
```

The tool list, the intent mapping table, the rails and their defaults and
the snapshot shape are in [`docs/agent-api.md`](./docs/agent-api.md).

### The session grid: scenes, slots, quantised launch, follow actions

Scenes × clip slots over the same clip model as the arrangement (score
`format: 3`: `scenes`, `slots`, `transport.quantize`; older documents
migrate). A slot holds a clip and its launch settings — quantisation
(`'none' | 'bar' | 'beat' | n bars | { seconds }` on the document's tempo map),
`trigger`/`gate`/`toggle` launch modes, legato, and a follow action (A/B
with a probability and a follow time in bars or seconds: `next`, `previous`,
`first`, `last`, `any`, `other`, `again`, `stop`, `none`). Launching places
the clip on its track's arrangement lane at the quantised time (`clip.add`),
stopping trims it there (`clip.trim`), a scene launch is one `batch` — so the
grid plays through the same scheduler path as the arrangement, the
arrangement holds what was performed, and undo takes a launch back. Follow
actions are evaluated on the scheduler tick from an injected random source.

```ts
import { Session } from '@kieranklaassen/live-mix'

const session = new Session({ document, engine })
session.launchScene('verse') // on the next bar, one undo step
session.launchSlot('kick-chorus', { quantize: 'beat' })
session.status('kick-chorus') // { state: 'queued' | 'playing' | 'stopped' | 'empty', startSec, … }
session.stopAll()
```

`useSession(session)` / `useSlot(session, id)` on `./react` expose the grid
and its controls for the kit. `Scheduler.onTick` is new (additive). Model,
decisions and limits in [`docs/session.md`](./docs/session.md).

### Real-time rules

- Nothing allocates inside `process()`; WASM memory is fixed and heap views are
  taken once.
- Denormals are flushed in software (`flush_denormal`) in every feedback path.
- Parameter changes are click-free: ramps or curves, never a hard switch.
- Scheduling runs on a timer, not `requestAnimationFrame`, so background tabs
  keep playing; every scheduled start is idempotent by key.
- The engine never touches `window`, `document` or `AudioContext` at import
  time.

## Releasing

Versioning uses [changesets](./.changeset/README.md): add one per PR. On every
push to `main` the release workflow publishes to GitHub Packages with the
workflow's own `GITHUB_TOKEN`:

- pending changesets → a `next` snapshot (`0.0.0-next-<timestamp>`, dist-tag
  `next`) and the "Version Packages" PR;
- merging that PR → the versioned release (dist-tag `latest`).

One-time repository settings (Kieran):

- Settings → Actions → General → **Allow GitHub Actions to create and approve
  pull requests** (otherwise the version PR cannot be opened; the branch
  `changeset-release/main` is still pushed and can be turned into a PR by hand).
- Billing: Actions minutes on a private repository are metered; keep a spending
  limit or the included minutes available, or CI stops running.

## License

MIT
