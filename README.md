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

> **Status:** `0.x`, pre-release. The API changes in minor versions; both
> consumer apps pin exact versions. No support promise — this is a
> solo-maintainer library that contains exactly what its two consumers use.

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
const plate = await createDattorroReverb(engine.context, { mix: 0.35 })
engine.master.inserts.add(plate)

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

Entry points (all ESM):

| Import                                | Contents                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `@kieranklaassen/live-mix`            | Engine, tracks, buses, `Transport`, `Scheduler`, `Clip`, `SampleStore`, `OutputRouter`, native devices    |
| `@kieranklaassen/live-mix/dsp`        | `WasmDevice` host, the C ABI typings, device factories (`createDattorroReverb`, …) and their param tables |
| `@kieranklaassen/live-mix/react`      | Optional hooks and tokenised Knob/Fader/DevicePanel (Phase 1; `react` is an optional peer)                |
| `@kieranklaassen/live-mix/testing`    | `MockAudioContext` with an AudioParam event recorder, framework-free                                      |
| `@kieranklaassen/live-mix/worklets/*` | Raw worklet bundles, for consumers that prefer explicit `?url` imports                                    |
| `@kieranklaassen/live-mix/wasm/*`     | Raw `.wasm` artefacts, same reason                                                                        |

## Install

Not yet on npm. Until the first release, install straight from GitHub at a
pinned commit; the `prepare` script builds `dist/` with nothing but Node (the
`.wasm` artefacts are committed, so consumers never need Emscripten):

```sh
npm install github:kieranklaassen/live-mix#<sha>
```

Vite consumers add this so the pure-ESM package is not pre-bundled (which would
break `import.meta.url` asset resolution for the worklet and `.wasm` in dev):

```ts
// vite.config.ts
export default defineConfig({
  optimizeDeps: { exclude: ['@kieranklaassen/live-mix'] },
})
```

Once published: `npm install @kieranklaassen/live-mix@0.1.0` (exact pins).

## Development

```sh
pnpm install          # also builds dist/ (prepare)
pnpm test             # Vitest, Node environment
pnpm typecheck
pnpm lint             # eslint + prettier --check
pnpm build            # tsup entries + esbuild worklet bundles + wasm copy
pnpm check:pack       # pack a tarball and verify every export resolves
pnpm test:native      # C++ device harnesses with the system compiler
pnpm build:wasm       # rebuild src/dsp/wasm/*.wasm (needs Emscripten 4.0.15)
```

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
  core/               Engine, tracks, buses, Transport, Scheduler, Clip, SampleStore, OutputRouter, Meter, native devices
  dsp/                WasmDevice host, C ABI typings, device factories + param tables
  dsp/worklets/       wasm-device.processor.ts → dist/worklets/wasm-device.js (one file, no imports)
  dsp/wasm/           committed *.wasm artefacts (scripts/build-wasm.sh; CI verifies they reproduce)
  react/              Phase 1 hooks and components
  testing/            MockAudioContext + AudioParam recorder
cpp/
  common/             device_api.h (the C ABI), dsp_util.h
  devices/dattorro/   Dattorro plate (from ambient-live) behind the ABI
  test/               native harnesses (parity tests for every ported device)
scripts/              build.mjs, build-wasm.sh, test-native.sh, check-pack.mjs
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
(`src/dsp/devices/*.ts`).

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

Versioning uses [changesets](./.changeset/README.md): add one per PR, merge the
generated "Version Packages" PR to publish. The release workflow publishes via
npm **trusted publishing** (GitHub OIDC), which needs one-time setup on
npmjs.com: publish `0.0.1` once by hand to create the package, then add this
repository's `release.yml` as a trusted publisher in the package settings.

## License

MIT
