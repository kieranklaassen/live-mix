# Mixing engine plan of record

> **Distribution addendum (2026-09-14, after U1):** Kieran made `kieranklaassen/live-mix` **private**. Wherever this document says the repo or package is public, or that consumers install from public npm / trusted publishing, read: the package is published to **GitHub Packages** (`npm.pkg.github.com`, scope `@kieranklaassen`) by the release workflow's own `GITHUB_TOKEN`; consumers authenticate with a read-only PAT in CI and a Docker build secret under Kamal; the `github:#sha` fallback needs git auth. Details and the Kieran checklist: [README § Install](../../README.md#install). KTD2/U10 are superseded to that extent; the MIT licence stands.
>
> **Update (2026-09-14, later):** repo **public again as of 2026-09-14**; `github:kieranklaassen/live-mix#<sha>` installs need no token; registry publishing (GitHub Packages) pending.


Copied from the Breathwork project store on 2026-09-14. Companion to the [unified plan](./2026-09-14-001-feat-audio-mixing-engine-plan.md) and the [assessment](./audio-mixing-engine-assessment.md); this document holds the Phase 0 task list and the package/adoption decisions.


Superseded for execution: the unified plan [plans/2026-09-14-001-feat-audio-mixing-engine-plan.md](./plans/2026-09-14-001-feat-audio-mixing-engine-plan.md) (north-star requirements + implementation units) is now the single plan of record and replaces §4 and §5 below; §1–§3 (ambient-live map, requirement union, library location) remain the grounding it cites.

Plan of record for the JS/TS mixing engine. Supersedes §4 (phased plan) of the [assessment](./audio-mixing-engine-assessment.md); §1–§3 of that document (module map, library evaluation, architecture) still stand. Assessed 2026-09-14 against `breathwork-live@ebdd457` (`feat/breathwork-live`, private) and `ambient-live@1d3b31b` (`main`, public). Read-only; nothing edited or pushed.

Links: `bl:` = `https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/`, `al:` = `https://github.com/kieranklaassen/ambient-live/blob/main/`.

## TL;DR

- **Where it lives:** a new public repo `kieranklaassen/live-mix`, published to public npm as **one package `@kieranklaassen/live-mix`** with subpath entry points (`.` core, `./dsp`, `./react`, `./testing`). Not a monorepo with the apps, not subtree/submodule, not GitHub Packages. `github:kieranklaassen/live-mix#<sha>` stays as a zero-infra fallback (public repo + `prepare` script), same mechanism the apps already use for `swiss-grid`.
- **Why one package, not three:** both apps install with **npm** (not pnpm); npm git deps cannot target a sub-directory, a single version number avoids a core/dsp/react compatibility matrix, and subpath exports tree-shake just as well. Split later only if a third consumer or a divergent dsp cadence forces it.
- **What ambient-live is:** the same Rails 8.1 + Inertia/React + Vite 8 chassis as Breathwork Live, but a *personal browser instrument-DAW* ("paint sound onto a 32 s looping timeline"), with a **portable C++ → WASM → AudioWorklet** core (sine voices, sample voice, Dattorro plate), a Web Audio clip player, an anchor-based transport, Web MIDI, and Ableton-style knob/fader primitives. Public, CI green, **not deployed** (Kamal config is the template), **dormant since 2026-08-15** (only Dependabot since). Its audio layer already obeys a "no Inertia/server state in `audio/`" rule, so it is nearly library-shaped.
- **Phase 0 headline:** stand up `live-mix` with `core` + `dsp` (transport, scheduler, clip tracks, live-input track, sends/returns, output router, generic WASM device host, Dattorro as the first device, the recorded-`AudioParam` test mocks), **adopt in ambient-live first** (un-deployed, boundary-clean: proves packaging, Vite asset loading and WASM hosting with zero production exposure), **then Breathwork Live behind a flag** with the existing 979-line `musicEngine.test.ts` re-targeted at a `SectionPlaylist` adapter as the parity gate. Behaviour-preserving in both apps; structure changes, sound does not.
- **Top risks:** API churn with two consumers (mitigate: `0.x` exact pins, one app migrates per bump, minimal Phase 0 surface); Vite asset resolution of worklet/WASM from a dependency (mitigate: `new URL(..., import.meta.url)` + `optimizeDeps.exclude`, explicit URL overrides, verify dev/build/test/SSR in both apps as a Phase 0 task); WASM toolchain (mitigate: Emscripten only in the library's CI, artefacts committed and shipped, consumers and Docker never compile C++).

---

## 1. ambient-live as a consumer

### 1.1 Identity and stack

| Aspect | Finding |
|---|---|
| Purpose | Personal ambient instrument-DAW: paint sample clips onto a single slow 32 s looping lane; play a sine synth from keyboard/Web MIDI; everything through a Dattorro plate. Product plan: [`docs/plans/2026-07-21-001-feat-ambient-live-plan.md`](https://github.com/kieranklaassen/ambient-live/blob/main/docs/plans/2026-07-21-001-feat-ambient-live-plan.md); shell: [`2026-08-07-001`](https://github.com/kieranklaassen/ambient-live/blob/main/docs/plans/2026-08-07-001-feat-ableton-workstation-shell-plan.md); clips: [`2026-08-15-001`](https://github.com/kieranklaassen/ambient-live/blob/main/docs/plans/2026-08-15-001-feat-timeline-sample-clips-plan.md) |
| Runtime | **Browser only** (desktop Chrome/Firefox primary, Safari demo-grade). No Electron/Tauri. A native iPad/AUv3 shell is the stated long-term "hatch", which is why DSP is C++ |
| Framework | Rails 8.1.3 (`inertia_rails` 3.22, `vite_rails` 3.11), Inertia + React 19, Tailwind 4, `@kieranklaassen/swiss-grid` (`github:` dep) — [`package.json`](https://github.com/kieranklaassen/ambient-live/blob/main/package.json), [`Gemfile`](https://github.com/kieranklaassen/ambient-live/blob/main/Gemfile) |
| Bundler / TS | Vite 8.1 via `vite-plugin-ruby`; **TypeScript ^7.0.2** (Breathwork Live is on ^5.7) — the library must ship `.d.ts` that TS 5.7 accepts |
| Package manager | **npm** (`package-lock.json`); no pnpm. `npm run check` = `tsc -p tsconfig.app.json && tsc -p tsconfig.node.json`; `npm test` = `vitest run` (Vitest 3.2, node env, `app/frontend/**/*.test.ts`) |
| Run | `bin/setup`, `bin/dev` (Procfile: `bin/rails s` + `bin/vite dev`). Dev auto-login |
| Build / deploy | [`Dockerfile`](https://github.com/kieranklaassen/ambient-live/blob/main/Dockerfile) is the Rails template (**no Node stage** — `assets:precompile` would fail without it); [`config/deploy.yml`](https://github.com/kieranklaassen/ambient-live/blob/main/config/deploy.yml) is the untouched template (`192.168.0.1`, `localhost:5555`). **Not deployed anywhere**; runs from `~/kkfonie/ambient-live` on the MacBook |
| CI | [`.github/workflows/ci.yml`](https://github.com/kieranklaassen/ambient-live/blob/main/.github/workflows/ci.yml): brakeman, bundler-audit, rubocop, `npm ci` + `npm run check` + `npm test` + Rails tests + system tests, Node 22. Green on `main` |
| Headers | Serves **COOP `same-origin` + COEP `credentialless`** on every response ([`cross_origin_isolation.rb`](https://github.com/kieranklaassen/ambient-live/blob/main/config/initializers/cross_origin_isolation.rb)) so SharedArrayBuffer/WASM threads are available later. Breathwork Live does **not** — the library must not require `crossOriginIsolated` |
| WASM toolchain | Emscripten locally (`brew install emscripten`; plan records 6.0.3). **Artefact committed** ([`engine.wasm`](https://github.com/kieranklaassen/ambient-live/blob/main/app/frontend/audio/engine.wasm), 12.7 KB) so CI/dev never need `emcc` (KTD-7) |
| Activity | Last human commit 2026-08-15 (PR #17 "Ableton-style sample clips"); 6 open Dependabot PRs; one open issue (#9, t=0 rising edge). 66 commits total |
| Third surface | [`bb-plugin-ambient-live/`](https://github.com/kieranklaassen/ambient-live/tree/main/bb-plugin-ambient-live) — a BB plugin with its **own** [`sample-player.ts`](https://github.com/kieranklaassen/ambient-live/blob/main/bb-plugin-ambient-live/audio/sample-player.ts) (third copy of a sample player). Plans say "do not retarget"; noted only as evidence that a shared engine is overdue |

### 1.2 Audio layer

| File | LOC | What it is | Goes to `live-mix`? |
|---|---|---|---|
| [`audio/audio-engine.ts`](https://github.com/kieranklaassen/ambient-live/blob/main/app/frontend/audio/audio-engine.ts) | 187 | Main-thread wrapper: `AudioContext` → one `AudioWorkletNode('ambient-engine')` (1 stereo input bus, 1 output) → `AnalyserNode(2048)` peak meter → destination. `compileStreaming` + `Module` via `processorOptions` (KTD-3). `loadSample` = `decodeAudioData` + `computePeaks`, cached by id, `forgetSample`. Note-on/off + `setParam` over the port | Split: WASM boot + meter + sample store → core/dsp; note-on/off stays app-side as an instrument device API |
| [`audio/engine-processor.ts`](https://github.com/kieranklaassen/ambient-live/blob/main/app/frontend/audio/engine-processor.ts) | 105 | Worklet host: sync `WebAssembly.Instance` in constructor, fixed memory, heap views created once, allocation-free `process()`, exhaustive-`never` message switch, input bus copy | **Yes** → generic `WasmDeviceProcessor` (device-agnostic ABI) |
| [`audio/messages.ts`](https://github.com/kieranklaassen/ambient-live/blob/main/app/frontend/audio/messages.ts) | 43 | Port protocol + C ABI typings (`engine_*`) | Yes, generalised (`device_*`) |
| [`audio/clip-player.ts`](https://github.com/kieranklaassen/ambient-live/blob/main/app/frontend/audio/clip-player.ts) | 115 | `AudioBufferSourceNode` + `GainNode` per clip, linear fades against the clip's own timeline, **late-join** (`start(when+late, offset+late, duration-late)`), `stopPending()` / `stop(key)` / `stopAll()` | **Yes** → `AudioTrack` clip playback |
| [`audio/fade.ts`](https://github.com/kieranklaassen/ambient-live/blob/main/app/frontend/audio/fade.ts), [`waveform.ts`](https://github.com/kieranklaassen/ambient-live/blob/main/app/frontend/audio/waveform.ts) | 16 + 76 | Pure linear fade envelope; `computePeaks`/`slicePeaks` | Yes (with their tests) |
| [`pages/live/use-clip-transport.ts`](https://github.com/kieranklaassen/ambient-live/blob/main/app/frontend/pages/live/use-clip-transport.ts) | 293 | React hook containing the **transport**: `TransportAnchor {contextTime, playheadSec, iteration}`, [`positionFromAnchor`](https://github.com/kieranklaassen/ambient-live/blob/main/app/frontend/pages/live/use-clip-transport.ts#L47-L67) (loop passes from the audio clock, never accumulated ticks), 40 ms `setInterval` scheduler with 0.2 s lookahead, dedupe key `clipId:iteration:startSec`, re-derive-on-edit (cancel pending, stop moved clips), rAF playhead, play/pause/stop/seek/loop | **Yes** — the framework-free 80% → `Transport` + `Scheduler`; the hook shrinks to a subscription |
| [`pages/live/clip-schedule.ts`](https://github.com/kieranklaassen/ambient-live/blob/main/app/frontend/pages/live/clip-schedule.ts) | 64 | Pure `clipsInWindow` (half-open window + loop wrap) with tests | Yes |
| [`pages/live/timeline-model.ts`](https://github.com/kieranklaassen/ambient-live/blob/main/app/frontend/pages/live/timeline-model.ts), [`timeline-clips.ts`](https://github.com/kieranklaassen/ambient-live/blob/main/app/frontend/pages/live/timeline-clips.ts) | 79 + 151 | `SampleRegion` (Ableton-style clip record: `startSec/offsetSec/durationSec/sourceDurationSec/fadeIn/fadeOut`), move/trim/fade math, `effectiveFades` (overlap → crossfade) | `Clip` type shape yes; edit math stays app-side (UI semantics) |
| [`engine/src/dattorro_reverb.{h,cpp}`](https://github.com/kieranklaassen/ambient-live/blob/main/engine/src/dattorro_reverb.cpp), [`dsp_util.h`](https://github.com/kieranklaassen/ambient-live/blob/main/engine/src/dsp_util.h) | 128 + 230 + 23 | JUCE-free Dattorro plate (mono in, 100 % wet stereo out; decay/damping/predelay), software FTZ, power-of-two delay buffers | **Yes** → first `dsp` device |
| [`engine/src/engine.{h,cpp}`](https://github.com/kieranklaassen/ambient-live/blob/main/engine/src/engine.h), [`sine_voice.h`](https://github.com/kieranklaassen/ambient-live/blob/main/engine/src/sine_voice.h), [`sample_voice.h`](https://github.com/kieranklaassen/ambient-live/blob/main/engine/src/sample_voice.h), [`api.cpp`](https://github.com/kieranklaassen/ambient-live/blob/main/engine/src/api.cpp) | 74 + 111 + 74 + 55 + 52 | The instrument: 8 sine voices with envelopes + voice stealing, one PCM sample voice, stereo input bus, `dry*(1-mix) + wet*mix` master. Flat C ABI over one static instance | Instrument stays **app-side** as a `WasmDevice` built against the library's ABI; the reverb leaves the module |
| [`engine/test/engine_test.cpp`](https://github.com/kieranklaassen/ambient-live/blob/main/engine/test/engine_test.cpp), [`script/test-engine`](https://github.com/kieranklaassen/ambient-live/blob/main/script/test-engine), [`script/build-engine`](https://github.com/kieranklaassen/ambient-live/blob/main/script/build-engine) | 291 | Native harness (pitch, click, reverb tail/decay, stability, denormals, sample, input bus); `emcc -O3 -fno-exceptions -fno-rtti --no-entry`, fixed 32 MB memory, no JS glue | Reverb/denormal/stability tests + build recipe → `dsp/` |
| [`components/daw/`](https://github.com/kieranklaassen/ambient-live/tree/main/app/frontend/components/daw) (`knob`, `fader`, `device-panel`, `device-toggle`, `control-math`, `use-param-control`) | ~750 | Ableton-style controls: tapers, units, pointer/keyboard stepping, hard-coded Tailwind `al-*` tokens | Phase 1 `./react`, **after** tokenising colours to CSS variables |
| [`audio/midi.ts`](https://github.com/kieranklaassen/ambient-live/blob/main/app/frontend/audio/midi.ts), [`pages/live/keyboard.tsx`](https://github.com/kieranklaassen/ambient-live/blob/main/app/frontend/pages/live/keyboard.tsx) | 43 + 146 | Web MIDI note parsing, on-screen keyboard, note refcounting | App-side (instrument input), Phase 1 `InstrumentTrack.noteOn/Off` pass-through |

Signal flow today: `sine voices + sample voice + input bus(clips) → mono sum → Dattorro → mix → masterGain → worklet output → Analyser → destination`. The reverb is global and mono-fed; there are no tracks, inserts or sends.

### 1.3 Tests

- Vitest, pure functions only: `clip-schedule`, `fade`, `waveform`, `timeline-model`, `timeline-clips`, `use-clip-drag`, `keymap`, `control-math`, `local-folder`, `sample-drag`, `workstation-layout`, `midi`. **No Web Audio mock, no engine-level test** — the transport/clip-player behaviour is untested in JS.
- Native C++ harness ([`engine_test.cpp`](https://github.com/kieranklaassen/ambient-live/blob/main/engine/test/engine_test.cpp)): 8 tests including [reverb tail exists and decays, decay lengthens tail, stability under load, denormals flush](https://github.com/kieranklaassen/ambient-live/blob/main/engine/test/engine_test.cpp#L102-L186). These become the `dsp` package's tests.
- Rails: controller/model/integration tests, including the [COOP/COEP header test](https://github.com/kieranklaassen/ambient-live/blob/main/test/integration/isolation_headers_test.rb).

### 1.4 Rules the library inherits from ambient-live

- Engine code imports nothing from Inertia/pages/server state (KTD-8, R16) — the library must be usable with a plain `new AudioContext()` and no Rails.
- All of *ambient-live's own* DSP is portable C++ (R17). The library may offer native-node devices (Biquad, Convolver) — they are fine for Breathwork Live — but ambient-live will only pick WASM devices. Do not make native-node devices mandatory in the core path.
- `process()` is allocation-free; WASM memory is fixed; heap views are created once; denormals flushed in software.
- Committed, reproducible WASM artefacts; no `emcc` in the consumer's install or CI.
- Position derives from an audio-clock anchor; scheduling runs on a timer (not rAF) so background tabs keep playing.

---

## 2. Union of requirements for the engine core

`BL` = Breathwork Live, `AL` = ambient-live. Phase column is the earliest phase that needs it.

| Capability | BL needs | AL needs | Engine requirement | Phase |
|---|---|---|---|---|
| **Tracks / inserts / sends / master** | Music (clips) → duck bus → master; breath guide instrument on the duck bus; live voice → voiceGain → master + hall send; single terminus for element mode ([`musicEngine.ts#L193-L234`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/musicEngine.ts#L193-L234)) | One clip lane + one instrument, global reverb, master gain, peak meter; future per-material device chains (granular, delays) and live input through chains (R6) | `AudioTrack`, `InstrumentTrack`, `LiveInputTrack`, `ReturnTrack`, `Bus`, `MasterBus`; `inserts[]`, `sends[]` (post-fader v1), one output terminus. Pan/mute/solo can wait | 0 (strips), 1 (pan/mute/solo, limiter) |
| **Transport + timeline** | Monotonic session clock, no pause/seek; `stop()` with 0.75 s fade; arrangement edits under playback (`advanceToSection`, `extendCurrentSection`, `replaceUpcoming`) | Play/pause/stop/seek; 32 s loop with numbered passes; anchor-based position; pause-at-end when loop off; rAF playhead | `Transport` with `start/pause/stop({fadeSec})/seek/loop{enabled,lengthSec}`, `position()` from anchor, `onStateChange`; **seconds are primary, bars are a later view** | 0 |
| **Clip scheduling** | 100 ms tick, **5 s** lookahead, **12 s** decode preload, equal-power `setValueCurveAtTime` crossfades (2.5 s / 4 s steer), per-clip `gainDb`, `scheduled` once, "move the boundary, never truncate" ([`buildTimelineFrom`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/musicEngine.ts#L672-L702)) | 40 ms tick, **0.2 s** lookahead, `offsetSec/durationSec`, linear fades, late-join, cancel-pending, dedupe by `clipId:iteration:startSec`, overlap crossfades computed from the model | One `Scheduler` loop; per-track `lookaheadSec`/`preloadSec`; `Clip { source, startSec, offsetSec, durationSec, fadeInSec, fadeOutSec, fadeCurve: 'linear' \| 'equalPower', gainDb }`; `clips.add/update/remove/replaceFrom(sec)`; idempotent keys; catch-up from anchor after timer throttling | 0 |
| **Grid / session launch** | None (section playlist is a queue, app-side) | **Explicitly rejected** as UI ("paint timeline, not clip grid") | **Not required by either app.** Keep the clip model slot-compatible; build `Session` only when a consumer asks | 2 (or never) |
| **Live input tracks** | Remote WebRTC `MediaStream` (OpenAI voice) → `MediaStreamAudioSourceNode` ([`attachVoiceSource`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/musicEngine.ts#L310-L347)); latency irrelevant (70–120 ms inherent); Chrome muted-`<audio>` workaround in [`realtimeClient.ts`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/realtimeClient.ts) | Local mic/guitar via `getUserMedia`, **monitoring**, ≤ ~50 ms round-trip target, through device chains (R6, deferred but "first in line") | `LiveInputTrack(MediaStream)` with inserts + sends, no buffering added; `latencyHint: 'interactive'` respected; key output for the ducker | 0 (BL shape), 1 (AL latency work) |
| **LUFS / ducking** | Per-clip trim from server ebur128 (−16 LUFS, ±12 dB cap); sidechain duck (attack 80 ms, release 800 ms, depth 0.68, scale 4, 60 ms main-thread poll, [`pollEnvelope`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/musicEngine.ts#L840-L854)); conductor user-speech dip ×0.6 on master | None; master gain 0.8; output peak meter | `Clip.gainDb`; `Ducker` device (key input) — Phase 0 behaviour-identical main-thread follower, Phase 1 worklet; `Meter` (peak/RMS); realtime LUFS optional later | 0 |
| **WASM devices** | None today (convolver hall, biquad breath noise); would gain limiter/ducker/StereoWidener later | Everything (R17); one module hosting the whole instrument; params by id over the port; input bus; committed artefact | Generic `WasmDevice` host + **C ABI** (`device_init/set_param/in_*/out_*/process`), one `WebAssembly.Instance` per node, `Module` compiled once per page; k-rate param smoothing inside C++; SAB **not** required | 0 |
| **Automation** | `BreathGuide` 2 s lookahead `AudioParam` writes + phase callbacks for visuals ([`breathGuide.ts`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/breathGuide.ts)) | None yet — but "painting is playing" means paint strokes are literally param lanes | `ParamLane` (breakpoints → writes inside the lookahead window, cancel-and-hold on override) | 1 |
| **Output routing incl. iOS** | `'element'` mode: `MediaStreamDestination` → unmuted `<audio>` + `MediaSession` for lock-screen playback ([`musicEngine.ts#L55-L84`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/musicEngine.ts#L55-L84)); must be engine-wide (today takeover/intake bypass it) | `ctx.destination`; Safari demo-grade; eventual native iPad/AUv3 shell hosting the same C++ | `OutputRouter { mode: 'direct' \| 'element', mediaTitle }` as the single terminus; `Device` ABI portable to native | 0 |
| **Samples / assets** | `fetch` + `decodeAudioData`, cached forever ([`ensureLoaded`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/musicEngine.ts#L858-L872)) — iOS memory risk | Decode + `computePeaks`, `forgetSample`, blob URLs from local folders, URL allow-list | `SampleStore { load(id, url \| ArrayBuffer), get, forget, peaks }`; eviction + streaming `ElementSource` later | 0 (store), 1 (eviction) |
| **Meters** | None | Output peak (Analyser 2048, rAF-polled) | `Meter` on any bus; UI polls at rAF | 0 |
| **MIDI / notes** | None | Web MIDI + keyboard → `noteOn/noteOff` with refcounting | `InstrumentTrack.device.noteOn/Off` pass-through; MIDI parsing stays app-side | 1 |
| **Render / bounce** | Golden-render tests would help | R14 bounce to file | Engine adopts `BaseAudioContext` so `OfflineAudioContext` works | 1 (tests), 2 (bounce) |
| **Testing** | 979-line recorded-`AudioParam` mock harness ([`musicEngine.test.ts`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/__tests__/musicEngine.test.ts)); Vitest 4 + jsdom | Pure-function tests; Vitest 3, node env; native C++ harness | Ship `./testing` (mocks, no jsdom dependency); dsp native tests in the lib | 0 |
| **Platform constraints** | Inertia **SSR build** (`build:ssr`) → import-safe on Node; Node 22.14 in Docker; `npm audit --omit=dev` in CI | COOP/COEP `credentialless`; TS 7 | ESM only; **zero runtime deps**; no `window`/`AudioContext` at import time; `.d.ts` valid for TS ≥ 5.7; `engines.node >= 22` | 0 |

### 2.1 Where the two apps genuinely differ

- **Time model:** BL is a monotonic, one-way session clock with boundary edits; AL is a short loop with numbered passes and seek. → `Transport` supports both (`loop.enabled=false` + never seeking is BL). BL's "section" semantics stay in its adapter.
- **Fade curves:** BL equal-power `setValueCurveAtTime`; AL linear ramps that must match drawn triangles. → `fadeCurve` per clip; both curves are part of the parity tests.
- **Lookahead:** 5 s/12 s vs 0.2 s. → per-track config, same loop.
- **Input:** remote, AEC'd, latency-agnostic voice vs local, latency-critical instrument monitoring. → same `LiveInputTrack`, but AL's Phase 1 latency spike is a real acceptance test; never insert buffering in that path.
- **iOS:** BL needs element mode + MediaSession and must run without COOP/COEP; AL needs COOP/COEP and never runs on iPhone. → element mode optional; SAB optional; both defaults off.
- **DSP source:** BL happily uses native nodes (convolver hall); AL's rule is C++-only. → both kinds of `Device` exist; nothing in the core path depends on a native-node effect.
- **UI:** BL takes nothing visual from the lib; AL wants knob/fader/device-panel. → `./react` is a separate, optional entry with `react` as an optional peer dep.
- **Toolchain versions:** TS 5.7 vs 7.0, Vitest 4/jsdom vs 3/node, Node 24 vs 22. → ship compiled JS + `.d.ts`, never TS source; test mocks framework-free.

---

## 3. Where the library lives and how both apps consume it

### 3.1 Options considered

| Option | Verdict | Why |
|---|---|---|
| **Separate repo, public npm package** | **Recommended** | `npm ci` in the Kamal Docker build on Hetzner needs no auth, no git, no build step; `npm audit` sees a normal package; exact pins; provenance via npm trusted publishing (no token secret) |
| Separate repo, `github:` dependency (swiss-grid style) | **Fallback / bootstrap** | Works today for `swiss-grid` (public repo → https tarball, git present in the [BL build stage](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/Dockerfile)). Needs a `prepare` script (tsc runs in every consumer install, incl. Docker) or committed `dist/`. Cannot target a sub-directory → forces a **single package** |
| GitHub Packages (npm registry) | Reject | Requires a token even for public reads → `.npmrc` + `--mount=type=secret` in the Dockerfile + Kamal `builder.secrets`; friction for zero benefit |
| pnpm workspace / monorepo containing both apps | Reject | Two Rails apps, two deploy machines, Kamal builds from the app repo root; both apps are npm, not pnpm; would force a repo merge nobody wants |
| git subtree | Reject | Two drifting copies, no version, two-way merges of WASM binaries |
| git submodule | Reject | Kamal builds from a clone of the committed tree; submodules aren't initialised → Docker build breaks unless the Dockerfile is taught about it; CI needs `submodules: true` |
| Private library repo (any distribution) | Reject | Every install path then needs a secret. The library carries no breathwork domain logic (the section playlist, Camelot steering, cue timing stay in BL), so public + MIT costs nothing |

### 3.2 Recommended shape

- **Repo:** `github.com/kieranklaassen/live-mix` (name free on GitHub and npm as of 2026-09-14), MIT, public. pnpm inside the repo is fine (kkfonie already uses pnpm); consumers stay on npm.
- **Package:** `@kieranklaassen/live-mix` — one package, subpath exports. (Verify `npm whoami` owns the `kieranklaassen` scope; if not, create the free `kieranklaassen` org on npm or use `@kkfonie`.)
- **Layout:**

```
live-mix/
  package.json          name @kieranklaassen/live-mix, type module, sideEffects false, files [dist], zero deps,
                        peerDependencies { react: optional }, engines node >= 22, prepare: pnpm build
  src/
    core/               Engine, tracks, ChannelStrip, Bus/MasterBus, Transport, Scheduler, Clip, SampleStore,
                        OutputRouter, Meter, devices/native (Gain, ConvolverReverb, Ducker), Device interface
    dsp/                WasmDevice host (main-thread), device factories (createDattorroReverb, …), ABI typings
    dsp/worklets/       wasm-device.processor.ts  → built to ONE self-contained file, no imports
    dsp/wasm/           committed *.wasm artefacts (built by scripts/build-wasm.sh, verified reproducible in CI)
    react/              Phase 1: useEngine/useTransport/useParam/useMeter, tokenised Knob/Fader/DevicePanel
    testing/            MockAudioContext + AudioParam event recorder (from musicEngine.test.ts), offline render helper
  cpp/
    common/dsp_util.h   (from ambient-live)
    devices/dattorro/   dattorro_reverb.{h,cpp} + device_api.cpp (C ABI)
    test/               native harness (from engine_test.cpp), run with system clang: scripts/test-native.sh
  scripts/build-wasm.sh emcc per device: -O3 -fno-exceptions -fno-rtti --no-entry, fixed memory, no JS glue
  .changeset/           changesets
  .github/workflows/    ci (typecheck, vitest, native tests, wasm reproducibility), release (changesets → npm)
```

- **Exports:** `"."` (core), `"./dsp"`, `"./react"`, `"./testing"`, `"./worklets/*"` and `"./wasm/*"` (raw files for consumers that prefer explicit `?url` imports).
- **Asset loading (the part that bites):** the dsp entry resolves its worklet and `.wasm` with `new URL('./worklets/wasm-device.js', import.meta.url)` lazily (inside the factory, never at import time), and every factory accepts `{ processorUrl?, wasm?: URL | WebAssembly.Module }` overrides. Consumers add `optimizeDeps: { exclude: ['@kieranklaassen/live-mix'] }` to `vite.config.ts` (the package is pure ESM with no deps, so pre-bundling buys nothing and would break `import.meta.url` in dev). Rejected: base64-inlining WASM (fine at 12 KB, wrong once SIMD/kkfonie devices arrive) and blob-URL worklets (WebKit history with `addModule(blob:)` on iOS, and BL runs on iPhone).
- **Build:** `tsup` for the entries (ESM + `.d.ts`), plus an esbuild step that bundles each worklet processor to a single IIFE file. `dist/` is **not** committed; `.wasm` artefacts **are** (KTD-7 carried over), so the `github:` fallback only needs `tsc`, never `emcc`.

### 3.3 Versioning and release

- `0.x` semver: minor = breaking, patch = everything else. Both apps pin **exact** versions (`"@kieranklaassen/live-mix": "0.3.1"`); a bump is a one-line PR per app, and only one app migrates per breaking bump.
- **changesets** (`pnpm changeset` per PR → "Version Packages" PR → merge → `changesets/action` publishes). Publish via **npm trusted publishing** (GitHub OIDC), so no `NPM_TOKEN` secret to rotate. Fallback: `npm version && npm publish` from the MacBook.
- Consumers get a Dependabot/`npm-check-updates` nudge; the lib's CHANGELOG is the migration note.

### 3.4 Iterating locally without publishing

```bash
# terminal 1 — library
cd ~/live-mix && pnpm install && pnpm build --watch          # tsup watch → dist/

# terminal 2 — either app (both are npm)
cd ~/kkfonie/ambient-live   # or ~/breathwork-live on the Mac mini
npm link ../live-mix          # symlink node_modules/@kieranklaassen/live-mix → the checkout
bin/dev                       # Vite treats the linked package as source: HMR on dist changes
```

- `vite.config.ts` in each app (committed, harmless when not linked): `optimizeDeps.exclude: ['@kieranklaassen/live-mix']`, `server.fs.allow: ['..']` (linked path is outside the Vite root), and `resolve.dedupe: ['react', 'react-dom']` once `./react` is used (avoids two Reacts through the symlink).
- `npm ci`/`npm install` removes the link; re-run `npm link`. Nothing lands in `package.json` or the lockfile, so nothing can leak into a deploy.
- Before a release: `pnpm pack` in the lib, `npm i ../live-mix/kieranklaassen-live-mix-0.x.y.tgz --no-save` in an app to test the *packed* artefact (catches `files`/`exports` mistakes that links hide), then run that app's tests.
- `pnpm link`/`workspace:` protocol do **not** apply: neither app uses pnpm, and converting them is out of scope. `file:` deps behave like `npm link` but edit `package.json` — avoid.

### 3.5 Deploy path check (Breathwork Live, Kamal from the Mac mini)

- [`Dockerfile`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/Dockerfile) build stage: Node 22.14 via node-build, `git` installed, `COPY package.json package-lock.json` → `npm ci` → `assets:precompile` → `rm -rf node_modules`. A public npm dependency changes nothing. The remote amd64 builder on `the Hetzner host` already reaches registry.npmjs.org and github.com (it installs `swiss-grid` today).
- Worklet + `.wasm` end up in `public/vite/assets/*` with hashed names via `vite_rails`; Kamal's `asset_path: /rails/public/vite` bridges versions. Thruster serves them with correct `application/wasm`.
- CI ([`ci.yml`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/.github/workflows/ci.yml)) runs `npm audit --omit=dev --audit-level=moderate` — the lib's zero-runtime-deps rule keeps this green.
- ambient-live is not deployed; if it ever is, copy BL's Node build stage into its template Dockerfile.

---

## 4. Revised phased plan

Effort is scope (files, LOC, tests), not calendar time. S ≈ < 300 LOC touched, M ≈ 300–1,000, L ≈ > 1,000.

### Phase 0 — a package both apps consume

**Goal:** `@kieranklaassen/live-mix@0.1.0` on npm; ambient-live and Breathwork Live both run on it; sound and behaviour unchanged in both; the old engines deleted.

**Order and provenance**

1. **Scaffold `live-mix`** (S): pnpm, tsup, Vitest (node), changesets, CI (typecheck, unit, native C++ tests with system clang, `emsdk` job that rebuilds `.wasm` and diffs against the committed artefact, release job). Lift the [`MockAudioContext`/`MockAudioParam` recorder](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/__tests__/musicEngine.test.ts#L21-L134) into `src/testing/` first — every later step is tested with it.
2. **From ambient-live → core** (M, mostly moves): `fade.ts`, `waveform.ts`, `clip-schedule.ts` with tests; `use-clip-transport.ts` → `Transport` (anchor, iterations, pause-at-end, seek, `stop`) + `Scheduler` (one timer, per-track lookahead, dedupe keys, re-derive on edit); `clip-player.ts` → `AudioTrack` clip playback (linear fades, late-join, `cancelPending`, `stop(key)`). `SampleStore` from `audio-engine.ts` `loadSample/forgetSample/sample` + peaks. `Meter` from its analyser.
3. **From ambient-live → dsp** (M): `engine-processor.ts` + `messages.ts` → generic `WasmDeviceProcessor` + `WasmDevice` (device-agnostic C ABI below, `Module` compiled once, `Instance` per node, params over the port, k-rate smoothing in C++); `dattorro_reverb.{h,cpp}` + `dsp_util.h` → `cpp/devices/dattorro/` with a `device_api.cpp` exposing stereo in → stereo out and `mix/decay/damping/predelayMs`; the four reverb/stability/denormal tests → `cpp/test/`; `script/build-engine` → `scripts/build-wasm.sh`.
4. **From Breathwork Live → core** (M): `OutputRouter` (element mode, `MediaSession`, `isIOSWebKit`, single terminus — [`#L55-L84`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/musicEngine.ts#L55-L84), [`#L214-L233`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/musicEngine.ts#L214-L233)); equal-power curves + `setValueCurveAtTime` crossfade scheduling + `STOP_FADE` ([`scheduleEntry`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/musicEngine.ts#L762-L809)) → `fadeCurve: 'equalPower'` on `AudioTrack`; `gainDb` trim with the ±12 dB cap; `preloadSec`/`lookaheadSec` per track; `LiveInputTrack` from [`attachVoiceSource`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/musicEngine.ts#L310-L347); `Send` → `ReturnTrack(ConvolverReverb)` from [`voiceReverb.ts`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/voiceReverb.ts); `Ducker` device wrapping the existing [`pollEnvelope`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/musicEngine.ts#L840-L854) follower **unchanged** (same constants, same `setTargetAtTime` calls — the parity harness asserts on them).
5. **ambient-live adopts** (M, net-negative LOC): `AudioEngine.start()` → `createEngine({ context })`; the C++ instrument loses its reverb and becomes an app-local `WasmDevice` (sine + sample voices + input bus) on an `InstrumentTrack`; `createDattorroReverb()` becomes a master insert with the same mono-sum input and `dry*(1-mix)+wet*mix` law; `masterGain` → `engine.master.gain`; `useClipTransport` shrinks to a subscription over `engine.transport` + `track.clips`; delete `ClipPlayer`, `clip-schedule.ts`, `fade.ts`, `waveform.ts`; rebuild and commit the smaller `engine.wasm`. Add `optimizeDeps.exclude`.
6. **Breathwork Live adopts, gated** (L): new `app/frontend/lib/breathwork/sectionPlaylist.ts` — `SectionPlaylist implements MusicEngineLike` ([interface](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/conductor.ts#L179-L216)) with the *same constructor signature, constants and public methods* as `MusicEngine`, owning sections/boundaries/spares/steering/`onSectionEnd` and driving one `AudioTrack` + `LiveInputTrack` + hall `ReturnTrack` + `Ducker` + `OutputRouter`; `duckBus()` keeps returning the node the `BreathGuide` connects to. Flag in [`SessionExperience.tsx`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/components/breathwork/SessionExperience.tsx#L457-L564) (`sessionPrefs` or `?engine=live-mix`), **both** `startFresh` and `takeOver` paths (the latter currently omits `outputMode` — fix it while there). Re-target `musicEngine.test.ts` at `SectionPlaylist`; `conductor.test.ts` and `breathGuide.test.ts` untouched.
7. **Release and pin** (S): changeset → `0.1.0` → pin in both apps → `npm ci` in BL Docker via `bin/kamal build` from the Mac mini → deploy → run sessions (desktop, iPhone locked screen, coach takeover) → delete `musicEngine.ts` and the old ambient-live audio files.

**Why ambient-live first**

- Its audio layer already respects the boundary the library needs (KTD-8), so step 5 is the cheapest end-to-end proof of the risky plumbing: npm install, Vite dev/build URL resolution for a worklet and `.wasm` inside `node_modules`, COEP `credentialless`, `Module` transfer, one-`Instance`-per-node.
- It is not deployed and has no users: the API is at its most volatile exactly then, and nobody hears a mistake.
- It contributes the primitives BL lacks (transport, scheduler, WASM host); exercising them in their home app before BL's adapter is written on top of them avoids designing them twice.
- BL's adoption is the strongest gate regardless of order (recorded-`AudioParam` harness + real sessions on iPhone). Doing it second means the API has already survived one consumer. Counter-argument — BL is where the value is — is addressed by lifting BL's internals (step 4) in the same milestone, so the core is designed for both from day one rather than retrofitted.

**Parity strategy**

- ambient-live: (a) moved pure tests (`clip-schedule`, `fade`, `waveform`) pass unchanged in the lib; (b) native reverb tests pass against the extracted device (tail exists/decays, decay lengthens tail, stability, denormals); (c) new recorded-`AudioParam` tests for `AudioTrack` linear fades, late-join and cancel-pending, encoding today's `ClipPlayer` behaviour before it is deleted; (d) new `Transport` tests for `positionFromAnchor`, loop iteration numbering and pause-at-end; (e) manual A/B of the reverb at identical params (mono-sum feed and mix law preserved) and of a painted loop with overlapping clips; (f) existing UI tests (`timeline-clips`, `use-clip-drag`, `keymap`, …) untouched.
- Breathwork Live: (a) `musicEngine.test.ts` (979 LOC) re-pointed at `SectionPlaylist` — same recorded events, same constants, same public API; (b) `conductor.test.ts` (1,984 LOC) untouched because it stubs `MusicEngineLike`; (c) `breathGuide.test.ts` untouched; (d) flag on for two or three real sessions incl. an iPhone with the screen locked (element mode) and a coach takeover; (e) optional: one `OfflineAudioContext` golden (two-track crossfade + duck) rendered in Playwright — Phase 1 if it slips.

**Effort:** Phase 0 is **L overall**: ~3.0–3.5k LOC written or moved into the lib (of which ~1.6k are moves), ~1.2k LOC deleted from the two apps, one new ~450-LOC adapter in BL, ~60 lines of build/CI scripts, one 979-line test file re-targeted. Highest-uncertainty items: the boundary math in `extendCurrentSection`/`replaceUpcoming` (moves verbatim into the adapter, protected by the harness) and Vite asset resolution (verified early by ambient-live).

**Phase 0 C ABI (target for every device, including kkfonie ports later)**

```c
void   device_init(float sample_rate, int max_block_frames);
void   device_set_param(int param_id, float value);      // smoothed inside C++
float* device_in_left(void);  float* device_in_right(void);
float* device_out_left(void); float* device_out_right(void);
int    device_max_block_frames(void);
void   device_process(int frames);                         // allocation-free
```

Built with `emcc -O3 -fno-exceptions -fno-rtti --no-entry -s ALLOW_MEMORY_GROWTH=0`, one static instance per module, one `WebAssembly.Instance` per `AudioWorkletNode`. Param tables (id, name, range, taper, default) live in TypeScript next to each device.

### Phase 1 — strips, automation, devices, React

- Core: `ChannelStrip` pan/mute/solo, `MasterBus` limiter + meter, worklet `SidechainDucker` (removes the 60 ms main-thread poll and its background-tab failure mode), `SampleStore` eviction + streaming `ElementSource` (the iOS memory fix), `ParamLane` automation (the `BreathGuide` pattern, and ambient-live's paint strokes), `InstrumentTrack.noteOn/Off`.
- dsp: kkfonie `StereoWidener` (compiles today), `FdnReverb` extracted from Tides/Bloom, one or two Faust builds; `-msimd128` once measured on iPhone.
- `./react`: `useEngine/useTransport/useTrack/useParam/useMeter` (`useSyncExternalStore`), `Knob/Fader/DevicePanel` from ambient-live after `al-*` colours become CSS variables.
- Apps: BL moves `BreathGuide` and `Ambience` onto engine tracks (kills the three parallel output paths and the intake/takeover element-mode gaps); AL runs its live-input latency spike on `LiveInputTrack`.
- Size: L (~15 modules, ~3–4k LOC TS, ~600 LOC C++ extraction).

### Phase 2 — only on demand

- `Session` (scenes × slots, launch quantisation) if a consumer wants a grid; WAM 2.0 host adapter; `OfflineAudioContext` bounce (AL R14); a native shell implementing the same `Device` ABI (AUv3); split into `@kieranklaassen/live-mix-{core,dsp,react}` only if versions need to diverge.

### Top risks

| Risk | Mitigation |
|---|---|
| **API churn with two consumers** | `0.x` exact pins; breaking = minor; migrate one app per bump; keep the Phase 0 surface minimal (no `Session`, no automation, no pan/solo); changesets changelog; the BL adapter is the only place BL touches the API |
| **Build/deploy friction** | Public npm → `npm ci` unchanged in Docker on Hetzner; zero runtime deps keeps `npm audit` green; `github:#sha` fallback only needs `tsc` because `.wasm` is committed; never a private registry, never a build secret |
| **WASM toolchain in CI/Docker** | Emscripten exists only in the lib's CI (`mymindstorm/setup-emsdk`, pinned) and on the MacBook; artefacts committed and shipped; reproducibility check in CI; consumers and Docker never see `emcc`; native tests use system clang |
| **Vite resolution of worklet/`.wasm` from a dependency** | `new URL(..., import.meta.url)` inside factories + `optimizeDeps.exclude` + explicit URL overrides; Phase 0 task verifies `bin/vite dev`, `bin/vite build`, `--mode test` and BL's SSR build in both apps |
| **Behaviour drift in BL steer/extend math** | Verbatim move into `SectionPlaylist`; 979-line recorded-event harness; flag; real sessions before deletion |
| **iOS element-mode regression** | `OutputRouter` is the only terminus; flag applied to `startFresh` **and** `takeOver`; test on iPhone with screen locked |
| **Linked-package pitfalls (two Reacts, fs allow-list)** | `resolve.dedupe`, `server.fs.allow`, `pnpm pack` smoke before release |
| **Solo-maintainer load of a public lib** | "0.x, no support promise" in the README; automation via changesets + trusted publishing; the lib contains only what two apps use |

---

## 5. Recommendation and Phase 0 task list

**Recommendation:** build `kieranklaassen/live-mix` as a single public npm package with `core`/`dsp`/`react`/`testing` entry points; adopt in ambient-live first, Breathwork Live second behind a flag; keep both apps on npm with exact pins and `npm link` for local iteration; keep Emscripten out of every consumer path.

Hand-off list (each item has a done-when; `[lib]`, `[al]`, `[bl]` mark the repo):

1. `[lib]` Create repo `kieranklaassen/live-mix` (public, MIT): pnpm, `tsup` (ESM + d.ts, entries `core`, `dsp`, `react` stub, `testing`), Vitest (node), changesets, `engines.node >= 22`, `sideEffects: false`, zero deps. Done when `pnpm build && pnpm test` pass on an empty core and `pnpm pack` produces a tarball whose `exports` resolve.
2. `[lib]` Port `MockAudioContext`/`MockAudioParam` recorder from BL `musicEngine.test.ts#L21-L134` into `src/testing/`, framework-free. Done when a smoke test records `setValueCurveAtTime`/`setTargetAtTime` events.
3. `[lib]` Move `fade.ts`, `waveform.ts`, `clip-schedule.ts` (+ tests) from ambient-live into `src/core/clips/`. Done when their tests pass unchanged.
4. `[lib]` `Transport` + `Scheduler` from `use-clip-transport.ts` (anchor, iterations, loop, seek, pause-at-end, timer loop with per-track lookahead, dedupe keys, catch-up from anchor). Tests for `positionFromAnchor`, iteration numbering, loop-off finish, re-derive on edit.
5. `[lib]` `AudioTrack` + `Clip` from `clip-player.ts` (linear fades, late-join, cancel-pending, stop by key) and BL `scheduleEntry` (equal-power curves, `gainDb` ±12 dB, `STOP_FADE`), `fadeCurve` per clip. Tests with the recorder for both curve types.
6. `[lib]` `SampleStore` (decode, peaks, forget, cache by id) and `Meter` (peak) from `audio-engine.ts`.
7. `[lib]` `OutputRouter` (direct/element, `MediaSession`, `isIOSWebKit`), `MasterBus`, `Bus`, `Send`/`ReturnTrack`, `LiveInputTrack`, `ConvolverReverb` (generated-IR preset from `voiceReverb.ts`), `Ducker` (main-thread follower, identical constants). Tests: element mode wires an unmuted element; ducker emits the same `setTargetAtTime` sequence as BL's `pollEnvelope`.
8. `[lib]` `cpp/common/dsp_util.h`, `cpp/devices/dattorro/` (from ambient-live) + `device_api.cpp` implementing the C ABI in §4; `cpp/test/` with the reverb tail/decay/stability/denormal tests; `scripts/test-native.sh`; `scripts/build-wasm.sh` → `src/dsp/wasm/dattorro.wasm` committed. Done when native tests pass and CI's emsdk job reproduces the committed bytes.
9. `[lib]` `WasmDeviceProcessor` (from `engine-processor.ts`, ABI-generic, single-file worklet bundle) + `WasmDevice` + `createDattorroReverb(ctx, opts?)`; `new URL(..., import.meta.url)` defaults with `processorUrl`/`wasm` overrides; lazy, SSR-safe. Done when a Vitest test instantiates the module with `WebAssembly.instantiate` and processes a block.
10. `[lib]` CI: typecheck, Vitest, native tests, wasm reproducibility, `pnpm pack` + `exports` check; release workflow with changesets + npm trusted publishing. Publish `0.0.1` to claim the name.
11. `[al]` Adopt: `vite.config.ts` `optimizeDeps.exclude` + `server.fs.allow`; `createEngine`; app synth as `WasmDevice` on an `InstrumentTrack` (C++ instrument minus reverb, rebuilt `engine.wasm` committed); `createDattorroReverb` as master insert; `SampleStore`; `useClipTransport` → subscription over `engine.transport`; delete `ClipPlayer`, `clip-schedule.ts`, `fade.ts`, `waveform.ts`, reverb from `engine/`. Verify `bin/vite dev`, `bin/vite build`, `npm run check`, `npm test`, `crossOriginIsolated === true` still, A/B reverb + overlapping clips by ear.
12. `[bl]` `sectionPlaylist.ts`: `SectionPlaylist implements MusicEngineLike`, same constructor/options/constants as `MusicEngine`, all section/boundary/spare/steer/extend logic moved verbatim; `duckBus()` preserved for `BreathGuide`. Re-target `musicEngine.test.ts` (imports only); all 347 cases green.
13. `[bl]` Flag in `SessionExperience.tsx` for `startFresh` **and** `takeOver` (pass `outputMode` in both); `vite.config.ts` `optimizeDeps.exclude`; verify `bin/vite build`, `build:ssr`, `--mode test` CI job.
14. `[lib]` Changeset → `0.1.0`; `[al]` `[bl]` pin exact version; `[bl]` `bin/kamal build` from the Mac mini confirms `npm ci` resolves in Docker; deploy with flag off.
15. `[bl]` Flag on; two or three real sessions (desktop Chrome, iPhone locked screen, coach takeover); then delete `musicEngine.ts`, the `voiceReverb.ts` remnants and the flag. `[al]` delete the old engine files. Update the assessment's §4 pointer if scope shifts.
