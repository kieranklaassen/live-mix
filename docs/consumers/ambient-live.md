# Consumer guide: ambient-live

[ambient-live](https://github.com/kieranklaassen/ambient-live) (Rails 8.1 +
Inertia + Vite, `main`; public repository, un-deployed) is Kieran's personal
ambient instrument: samples painted onto a 32-second looping timeline, a
sine/sample synth from keys or Web MIDI, a live input for a guitar or mic,
all through one Dattorro plate. It adopted the library first (U11, KTD4)
because it was boundary-clean and had no users to break: the same
`dry·(1−mix) + wet·mix` reverb law and mono-sum feed, its `clip-player` and
`clip-schedule` deleted, its in-engine reverb deleted from `engine/`. U27
added the live-input latency spike and MIDI pass-through on top; the U36
`ControlSurface` migration (deleting the app's own MIDI mapping) is in
flight.

Pinned: `"@kieranklaassen/live-mix": "github:kieranklaassen/live-mix#532e9b3"`
(v0.1.0) as of `main@972aa15`; the `ControlSurface` migration bumps it to
≥ `bff2bbd`.

## What it uses

| App file (`app/frontend/`)                                      | Library surface                                                                                                                                                                                                                                                                                                                                                                                                                         | Why                                                                                                                                                                                                                                                                                            |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `audio/live-engine.ts` (`LiveEngine`)                           | `createEngine({ context, master: { gain: 0.8, meter: true }, samples: { peaks: true }, loop: { enabled: true, lengthSec: 32 }, tickMs: 40 })`, `engine.addInstrumentTrack('synth', { device })`, `engine.addAudioTrack('clips', { lookaheadSec: 0.2 })`, `engine.addLiveInputTrack('input')`, `engine.master.addInsert(plate)`, `engine.master.setLevel`, `engine.master.level()`, `engine.samples.load/get/forget`, `engine.dispose()` | The whole audio stack behind one class the pages call; it imports nothing from Inertia or pages (its boundary rule). Signal flow: synth + clips + input → master fader (0.8) → plate → meter → destination.                                                                                    |
|                                                                 | `createDattorroReverb(ctx)` (`./dsp`), `plate.setParam('mix' \| 'decay' \| 'damping' \| 'predelayMs', v)`                                                                                                                                                                                                                                                                                                                               | The plate that used to live in `engine/src/engine.cpp`, bit-identical (`cpp/test/dattorro_test.cpp` is the parity test; the reverb A/B was Kieran's acceptance).                                                                                                                               |
|                                                                 | `input.attach(stream)`, `input.detach()`, `input.source`, `input.strip.setMute` (monitor), `strip.setLevel/setPan` on `synth`, `clips`, `input`                                                                                                                                                                                                                                                                                         | U27: the live input as a pass-through track with monitoring through the same mix; every mapped control is a ramped strip or device write.                                                                                                                                                      |
| `audio/instrument.ts`, `instrument-processor.ts`, `messages.ts` | `defineWasmDevice({ id, wasm: () => wasmUrl, params, processor: { name, url } })`, `WasmDevice`, `WasmDeviceOptions`, `WasmDeviceProcessorOptions`, `DeviceExports`, `DeviceMessage`                                                                                                                                                                                                                                                    | The app's own C++ core (`engine/`, sine voices + a PCM audition voice) hosted as a `WasmDevice` with an **app-local worklet processor** that speaks the library ABI plus its own `instrument_sample_*` messages; `?url` imports for the `.wasm` and processor (the explicit-URL escape hatch). |
| `audio/latency-probe.ts`                                        | `ensureProcessor` (`./dsp`), `WorkletNodeFactory`                                                                                                                                                                                                                                                                                                                                                                                       | The round-trip probe: a chirp into `destination`, a capture worklet on the input, cross-correlation; the per-context `addModule` cache is the library's.                                                                                                                                       |
| `pages/live/use-clip-transport.ts`                              | `Transport`, `TransportChange`                                                                                                                                                                                                                                                                                                                                                                                                          | Anchor, loop passes, lookahead scheduling and catch-up are the library's; the hook keeps the clip track in step with the painted regions.                                                                                                                                                      |
| `pages/live/regions-to-clips.ts`, `timeline*.tsx`               | `Clip`, `WaveformPeaks`, `slicePeaks`                                                                                                                                                                                                                                                                                                                                                                                                   | Painted regions become seconds-first clips; waveforms slice the store's decoded peaks (the app's `waveform.ts` moved into the library in U3).                                                                                                                                                  |
| `audio/*.test.ts`                                               | `@kieranklaassen/live-mix/testing`                                                                                                                                                                                                                                                                                                                                                                                                      | 146 Vitest tests at U27; the engine tests pass compiled modules and a mock node factory through `LiveEngineDeviceOptions`.                                                                                                                                                                     |

Not yet used: groups and returns (one plate on the master is the product),
the score document, automation lanes, the React entry — `components/daw/`
(`knob`, `fader`, `device-panel`, `control-math`, `use-param-control`) is
what U25 ported into the library's kit; deleting the app copy and mapping
`al-*` tokens to `--lm-*` (`ambientWater`) is the follow-up PR.

## MIDI and the control surface

U27 gave the Live page MIDI learn over a pure `midi-map.ts` (format 1,
`localStorage` key `ambient-live:midi-map`) and `LiveEngine.applyControl(id,
value)` with an exhaustive switch over `reverb.*`, `master.gain`,
`{synth,clips,input}.{level,pan}` and `input.monitor`. U36 generalised that
layer into the library's `ControlSurface`; the migration
([control-surface.md § Migration path](../control-surface.md#migration-path-for-ambient-live-u27--library))
maps each id to a `ControlTarget`, loads stored tables through
`ambientLiveMidiMapMigration`, replaces `use-midi-map.ts` with
`useControlSurface`/`useLearn`, and deletes `midi-map.ts`, `parseMidiEvent`
and `applyControl`. The synth path stays: `MidiInput.onMessage` plus
`isMapped(surface.table, controlEventsFromMidi(msg)[0])` so a mapped pad
never plays a note.

## Latency

Headless Chrome 148, fake devices: `baseLatency` 10 ms at 44.1 kHz,
`outputLatency` 30 ms once audio flows, in-graph loopback round trip
**21.61 ms** (9/9 passes within 2 ms). The real-machine acceptance — ≤ ~50 ms
judged by feel on Kieran's MacBook with built-in and interface I/O — is still
to be recorded; the probe, the gates (peak ≥ 8× RMS, three passes agreeing)
and the steps are in the app's `docs/live-input-latency.md`. The library
never adds buffering to the monitoring path and `alignLatency()` leaves live
inputs alone by default.

## Install and build

- `vite.config.ts`: `optimizeDeps: { exclude: ['@kieranklaassen/live-mix'] }`,
  `server: { fs: { allow: ['..'] } }` (for `npm link ../live-mix`).
- `engine/` builds with `script/build-engine` against the library's
  `cpp/common/device_api.h` from `node_modules`; `script/test-engine` runs its
  native harness. The library never builds `.wasm` inside a consumer's
  install — this is the app's own artefact.
- CI (`.github/workflows/ci.yml`): Actions run on this public repo;
  `lint`/`scan_ruby` are green, the Node jobs need `LIVE_MIX_NPM_TOKEN` to
  `npm ci` the private dependency (an open item for Kieran).
- Verification per the plan: `npm ci && npm run check && npm test`,
  `bin/rails db:test:prepare test && bin/rails test:system`, `bin/vite
build` and a manual `bin/dev` — the worklet and `.wasm` load in dev, build,
  `--mode test` and SSR (U11 proved all four before U12 started).

## Reading order for a change here

1. `audio/live-engine.ts` — everything audible, one class.
2. `audio/instrument.ts` — how an app hosts its own WASM device with its own
   processor.
3. `docs/midi-mapping.md` and `docs/live-input-latency.md` in the app.
4. The [live instrument recipe](../recipes/live-instrument.md) is this app in
   library calls, with the library's `ControlSurface` in place of the app's
   mapping layer.
