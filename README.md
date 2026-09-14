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

| Import                                | Contents                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `@kieranklaassen/live-mix`            | Engine, tracks, buses, `Transport`, `Scheduler`, `Clip`, `SampleStore`, `OutputRouter`, native devices    |
| `@kieranklaassen/live-mix/dsp`        | `WasmDevice` host, the C ABI typings, device factories (`createDattorroReverb`, …) and their param tables |
| `@kieranklaassen/live-mix/react`      | Optional hooks and tokenised Knob/Fader/DevicePanel (Phase 1; `react` is an optional peer)                |
| `@kieranklaassen/live-mix/testing`    | `MockAudioContext` with an AudioParam event recorder, framework-free                                      |
| `@kieranklaassen/live-mix/worklets/*` | Raw worklet bundles, for consumers that prefer explicit `?url` imports                                    |
| `@kieranklaassen/live-mix/wasm/*`     | Raw `.wasm` artefacts, same reason                                                                        |

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
when a consumer ships them. The core entry is 40 KB minified (budget 60 KB);
the meter worklet bundle 6 KB.

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
  core/analysis/      Meter (analyser), LoudnessAnalyzer (BS.1770-4 DSP), LufsMeter (worklet host) + meter protocol
  dsp/                WasmDevice host, C ABI typings, device factories + param tables
  dsp/devices/faust/  generated param tables for the Faust devices (scripts/build-faust.sh)
  dsp/worklets/       wasm-device.processor.ts, ducker.processor.ts, meter.processor.ts → dist/worklets/*.js (one file each, no imports)
  dsp/wasm/           committed *.wasm artefacts (scripts/build-wasm.sh; CI verifies they reproduce)
  react/              Phase 1 hooks and components
  testing/            MockAudioContext + AudioParam recorder
cpp/
  common/             device_api.h (the C ABI), dsp_util.h
  devices/dattorro/   Dattorro plate (from ambient-live) behind the ABI
  devices/fdn-reverb/ Tides 8-line FDN reverb (from kkfonie) behind the ABI
  devices/stereo-widener/  kkfonie's StereoWidener (source unchanged, SHA in device.json) behind the ABI
  devices/true-peak-limiter/  lookahead BS.1770 true-peak brickwall for the master (header-only DSP) behind the ABI
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
[`docs/faust-devices.md`](./docs/faust-devices.md).

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

registerStockWasmDevices() // dattorro, fdn-reverb, stereo-widener, zita-rev1, limiter-1176
devices.register(wasmDeviceDescriptor(MY_DEVICE, { name: 'Mine', category: 'reverb' }))

devices.list({ category: 'reverb' }).map((d) => d.name)
const plate = await devices.create('dattorro', ctx, { preset: 'Small plate', params: { mix: 0.2 } })
const preset = devices.capturePreset(plate, 'Tonight') // { name, deviceId, deviceVersion, params }
localStorage.setItem('plate', serializePreset(preset))
applyPreset(plate, parsePreset(localStorage.getItem('plate')))
```

Presets are partial param snapshots; on load, unknown params are dropped and
values clamped, so a preset from an older device version still applies.

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
