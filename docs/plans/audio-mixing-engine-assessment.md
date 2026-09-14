Plan of record: [mixing-engine-plan.md](./mixing-engine-plan-of-record.md) — shared `live-mix` library consumed by both Breathwork Live and ambient-live; supersedes §4 below.

# Audio mixing engine assessment: extracting an Ableton-like JS/TS mixer from Breathwork Live

Assessed 2026-09-14 against `breathwork-live@ebdd457` (branch `feat/breathwork-live`) and `ambient-live@1d3b31b` (`main`), plus the kkfonie JUCE workspace. Read-only; nothing was edited or pushed. Companion to the [Breathwork survey](https://github.com/kieranklaassen/breathwork-live).

Links below use `bl:` = `https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/` and `al:` = `https://github.com/kieranklaassen/ambient-live/blob/main/`.

## TL;DR

- **Recommendation: hybrid, core-first.** Build a small UI-agnostic engine core on raw Web Audio + AudioWorklet yourself (you already own ~60% of it across `musicEngine.ts` and ambient-live's transport/WASM host), adopt point libraries for DSP (Faust via `@grame/faustwasm`, Emscripten for your kkfonie C++), and treat WAM 2.0 as the optional "browser plugin" format. Do not build the core on Tone.js, and do not adopt the openDAW SDK (AGPL, heavyweight, needs COOP/COEP) — but watch it.
- **Biggest finding:** [`musicEngine.ts`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/musicEngine.ts) is already a mixing engine in embryo — lookahead clip scheduler, equal-power crossfades, per-clip LUFS trim, a duck bus, a live-input voice channel with a reverb send, a master, and an output router — and the whole `lib/breathwork/` layer has **zero React/Inertia imports** with every browser dependency injectable. Extraction cost is low.
- **Biggest gap:** it has no track/bus/insert model (everything sums into one `duckGain`), the sidechain duck runs on the main thread (60 ms `setInterval` polling an `AnalyserNode`), there is no transport (no pause/seek), and decoded `AudioBuffer`s are cached forever (memory risk on iOS for long sessions).
- **VST reality:** browsers cannot host VST3/AU. The honest path for your own effects is "one DSP source, two hosts": the kkfonie C++ (StereoWidener is already JUCE-free) compiled with Emscripten into an AudioWorklet device for the web, and built with JUCE natively. Third-party VSTs need a native shell (Electron + `plugbridge-electron`, Tauri + Rust, or a JUCE host) — that is a different product from a Rails web app used on an iPhone.
- **First step:** Phase 0 — carve `app/frontend/lib/mix/` out of `musicEngine.ts` behind the existing `MusicEngineLike` interface, keep the conductor untouched, and run the existing 979-line engine test suite against the adapter as the parity gate.

---

## 1. What exists today: the client audio layer in Breathwork Live

### 1.1 Module map (`app/frontend/lib/breathwork/`, ~4.9k LOC + ~5.7k LOC tests)

| Module | LOC | Role | Mixing-engine relevance |
|---|---|---|---|
| [`musicEngine.ts`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/musicEngine.ts) | 873 | Section-playlist clip player + duck + voice channel + master + output router | **The embryo.** Most of Phase 0 comes from here |
| [`conductor.ts`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/conductor.ts) | 1,705 | Session state machine, cue schedule, holds, tools, reconnect, noise gate | Domain logic (breathwork). Stays app-side; consumes the engine via `MusicEngineLike` |
| [`breathGuide.ts`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/breathGuide.ts) | 348 | Procedural noise → bandpass → gain instrument with 2 s lookahead automation, phase callbacks for visuals | Model for an "instrument device" + parameter automation + visual sync |
| [`voiceReverb.ts`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/voiceReverb.ts) | 55 | Generated-IR convolver hall, wet gain to output | A `Send` → `ReturnTrack` with a convolver device |
| [`ambience.ts`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/ambience.ts) | 139 | Looping intake bed with fade in / handoff fade out | A looping `Clip` on its own track |
| [`realtimeClient.ts`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/realtimeClient.ts) | 371 | WebRTC + data channel to OpenAI Realtime; remote track → muted `<audio>` + `onRemoteTrack(stream)` | Source of the live-input `MediaStream` |
| [`musicResolver.ts`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/musicResolver.ts) | 125 | Pure Camelot/intensity steering resolver | App-level (playlist policy), not engine |
| [`types.ts`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/types.ts) | 165 | `MusicTrack`/`MusicSelection` (server JSON mirrors), plan/cue types | `MusicTrack` ≈ a sample asset; needs a neutral `ClipSource` type |
| `eventLog.ts`, `csrf.ts`, `completion.ts`, `normalize.ts`, `sessionPrefs.ts`, `cameraCapture.ts`, `toolHandlers.ts`, `cueBuilder.ts` | ~1k | Rails I/O, prefs, camera, tool routing | Rails-coupled or domain; **not** engine |

### 1.2 The Web Audio graph as built (guided session, "fresh" path)

```
[track N: AudioBufferSourceNode] → fadeGain(setValueCurveAtTime equal-power) → [trim 10^(gainDb/20)] ─┐
[track N+1 ...]                                                                                      ├→ duckGain → masterGain → output
[BreathGuide: loop noise → BiquadFilter(bandpass) → gain] ───────────────────────────────────────────┘        ▲
                                                                                                             │
[Realtime remote MediaStream] → MediaStreamAudioSourceNode ─┬→ voiceGain ────────────────────────────────────┤
                                                            ├→ AnalyserNode (fftSize 256)  ← polled 60 ms → duckGain.gain.setTargetAtTime
                                                            └→ ConvolverNode(generated IR 2.6 s) → wetGain(0.26) ┘
output = ctx.destination            (direct mode)
       | MediaStreamDestination → unmuted <audio> + MediaSession   (element mode, iOS lock screen)
```

- Built in [`MusicEngine` constructor](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/musicEngine.ts#L193-L234), [`attachVoiceSource`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/musicEngine.ts#L310-L347), [`scheduleEntry`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/musicEngine.ts#L762-L809).
- Wired from React in [`SessionExperience.tsx` `startFresh`/`takeOver`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/components/breathwork/SessionExperience.tsx#L457-L564): one `AudioContext` per session, `outputMode: isIOSWebKit() ? 'element' : 'direct'`, `BreathGuide` connected to `musicEngine.duckBus()`, `onRemoteTrack → attachVoiceSource(ctx.createMediaStreamSource(stream))`.
- The intake path in [`New.tsx` `routeIntakeVoice`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/pages/practice_sessions/New.tsx#L398-L413) builds a **parallel** voice → gain → `ctx.destination` + hall chain, and [`Ambience`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/ambience.ts#L67) also connects straight to `ctx.destination`. So today there are up to three independent output paths per context; in element mode only the engine's path goes through the lock-screen element, and [`takeOver`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/components/breathwork/SessionExperience.tsx#L532) constructs `MusicEngine` without `outputMode`, so the coach path is direct-mode on iOS (a known gap in the plan: lock-screen playback is fresh-path only). A single master/output router makes this class of gap structurally impossible.

### 1.3 Scheduling and clock model

- **Clock:** everything is `AudioContext.currentTime` (injected as `now`/`clock`); the model never keeps time ([architecture doc, decision 1](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/docs/solutions/realtime-voice-session-architecture.md)).
- **Three independent tick loops:** engine 100 ms (`SCHEDULER_TICK_MS`) with 12 s preload and 5 s schedule lookahead ([`tickAsync`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/musicEngine.ts#L723-L745)); conductor 250 ms ([`tick`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/conductor.ts#L1057-L1126)); breath guide 100 ms with 2 s automation lookahead ([`tick`/`scheduleCycle`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/breathGuide.ts#L313-L347)).
- **Timeline = mutable `TimelineEntry[]`** (`startAt`, `duration`, `scheduled`, optional `source`/`gain`) laid out from summed real durations with crossfade overlap ([`buildTimelineFrom`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/musicEngine.ts#L672-L702)). Live edits while playing: [`advanceToSection`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/musicEngine.ts#L355-L373), [`extendCurrentSection`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/musicEngine.ts#L385-L443), [`replaceUpcoming`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/musicEngine.ts#L542-L642) — these are arrangement edits under playback with a hard-won invariant ("never truncate music to fit a boundary — move the boundary", decision 4).
- **No transport:** no pause/seek/loop; `stop()` is terminal. The "scheduled" discipline (an entry is handed to the graph once, ≤ 5 s ahead) is the right primitive and maps directly onto a generic clip scheduler.
- **Ducking is two layers:** the envelope follower on the voice ([`pollEnvelope`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/musicEngine.ts#L840-L854): attack 80 ms, release 800 ms, depth 0.68 ≈ −10 dB) plus a conductor-level user-speech dip that multiplies **master** volume by 0.6 ([`dipForUserSpeech`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/conductor.ts#L1665-L1677)). The second one conflates "master fader" with "duck", which is why `toolHandlers` routes `set_music_volume` through the conductor rather than the engine.

### 1.4 Loudness handling

- Server-side: ffmpeg `ebur128` → `tracks.loudness_lufs`; [`Music::Loudness.gain_db`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/services/music/loudness.rb) targets −16 LUFS with a ±12 dB cap; selection JSON carries `gain_db`.
- Client-side: applied as a constant `GainNode` per scheduled entry ([`scheduleEntry`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/musicEngine.ts#L775-L795)). This is exactly a per-clip gain. Keep the analysis offline (it is already right); the engine only needs "clip gain in dB".

### 1.5 Tests (Vitest, 347 cases repo-wide)

- [`musicEngine.test.ts`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/__tests__/musicEngine.test.ts) (979 LOC): a hand-rolled `MockAudioContext` whose `MockAudioParam` **records every automation call** (`setValueAtTime`, `setValueCurveAtTime`, `setTargetAtTime`, …) and asserts on them. This is the parity harness for Phase 0 — it tests behavior at the AudioParam boundary, not internals.
- [`conductor.test.ts`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/__tests__/conductor.test.ts) (1,984 LOC): fake timers, stub `MusicEngineLike`. Because the conductor depends on the structural interface, swapping the engine underneath does not touch these tests.
- Gap: no rendered-audio golden (no `OfflineAudioContext` render compared to a WAV). Worth adding once in a real browser (Playwright) for crossfade/duck curves.

### 1.6 Coupling and the extraction boundary

- **UI coupling: none.** `lib/breathwork/*.ts` imports nothing from React or Inertia; DOM access is behind injectable factories (`createAudioElement`, `mediaSession`, `setIntervalFn`, `fetchImpl`, `now`). The conductor already depends on structural interfaces ([`MusicEngineLike`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/conductor.ts#L179-L216), `BreathGuideLike`, `RealtimeClientLike`).
- **Rails coupling** is confined to `eventLog.ts` (POST `/practice_sessions/:id/events`, CSRF), snake_case JSON mirrors in `types.ts`/`normalize.ts`/`musicResolver.ts` (`duration_seconds`, `track_manifest`, `gain_db`), and `completion.ts`/`csrf.ts`.
- **Domain coupling inside `musicEngine.ts`** is the real cut line: `MusicSelection.sections`, `sectionIndex`, `boundaries`, `onSectionEnd`, `sparesBySection`, `loopCursorBySection`, `currentTrackInfo().intensity`, `camelot`. None of that belongs in a mixer.
- **Clean boundary:** engine = tracks/clips/devices/sends/master/transport/scheduler/output; **section playlist** = an app-level adapter (`SectionPlaylist implements MusicEngineLike`) that owns section boundaries, spares, steering and `onSectionEnd`, and drives the engine's arrangement API. The conductor, breath guide and tests keep working unchanged.

### 1.7 Reusable material in ambient-live

ambient-live is the same Rails+Inertia chassis with a **portable C++ → WASM → AudioWorklet** core and a clip timeline; it already contains the pieces `musicEngine.ts` lacks.

| File | What it gives the engine |
|---|---|
| [`engine-processor.ts`](https://github.com/kieranklaassen/ambient-live/blob/main/app/frontend/audio/engine-processor.ts) + [`audio-engine.ts`](https://github.com/kieranklaassen/ambient-live/blob/main/app/frontend/audio/audio-engine.ts) + [`script/build-engine`](https://github.com/kieranklaassen/ambient-live/blob/main/script/build-engine) | Proven WASM device host: `WebAssembly.Module` passed via `processorOptions`, raw module (no Emscripten JS glue), fixed memory, heap views, allocation-free `process()`, exhaustive-`never` message switch, `emcc -O3 -fno-exceptions -fno-rtti --no-entry` |
| [`engine/src/dattorro_reverb.{h,cpp}`](https://github.com/kieranklaassen/ambient-live/blob/main/engine/src/dattorro_reverb.cpp), [`dsp_util.h`](https://github.com/kieranklaassen/ambient-live/blob/main/engine/src/dsp_util.h), [`engine/test/engine_test.cpp`](https://github.com/kieranklaassen/ambient-live/blob/main/engine/test/engine_test.cpp) | A JUCE-free plate reverb with a native test harness and software FTZ — first stock WASM device |
| [`clip-player.ts`](https://github.com/kieranklaassen/ambient-live/blob/main/app/frontend/audio/clip-player.ts), [`clip-schedule.ts`](https://github.com/kieranklaassen/ambient-live/blob/main/app/frontend/pages/live/clip-schedule.ts), [`use-clip-transport.ts`](https://github.com/kieranklaassen/ambient-live/blob/main/app/frontend/pages/live/use-clip-transport.ts) | Generic clip semantics (`offsetSec`/`durationSec`/fades, late-join, cancel-pending, dedupe by `clipId:iteration:startSec`), a pure lookahead window function, and an **anchor-based transport** (`contextTime ↔ playheadSec`, loop iterations) — the transport `musicEngine.ts` is missing |
| [`timeline-model.ts`](https://github.com/kieranklaassen/ambient-live/blob/main/app/frontend/pages/live/timeline-model.ts) | `SampleRegion` = an Ableton-style clip record |
| [`waveform.ts`](https://github.com/kieranklaassen/ambient-live/blob/main/app/frontend/audio/waveform.ts) | `computePeaks` for clip drawing (no need for wavesurfer in the engine) |
| [`components/daw/`](https://github.com/kieranklaassen/ambient-live/tree/main/app/frontend/components/daw) (`knob.tsx`, `fader.tsx`, `control-math.ts`, `use-param-control.ts`, `device-panel.tsx`) | Mixer UI primitives for the React bindings |

Note the [Ableton workstation shell plan](https://github.com/kieranklaassen/ambient-live/blob/main/docs/plans/2026-08-07-001-feat-ableton-workstation-shell-plan.md) already decided "built-in devices only; no VST/AU hosting" and "paint timeline, not clip grid" for *that* product. A shared engine should support both a grid and a paint timeline as views over the same clip model.

---

## 2. Library and ecosystem evaluation (state as of 2025–2026)

| Library | What it is | Latest signal | Licence | Fit here | Verdict |
|---|---|---|---|---|---|
| **Tone.js** | Web Audio framework: `Transport` (BPM/bars), `Player`, `Part`/`Loop`, ~30 effects, `UserMedia`, `Draw` | 15.5.x, Jun 2026; open [synced-Player phantom replay bug #1417](https://github.com/tonejs/tone.js/issues/1417) | MIT | Fights the existing clock model (its own `Signal`/`Param` wrappers, global context, no sidechain, no worklet DSP, no clip grid). Effects are decent but not "great" | **Borrow, don't build on.** Wrap individual effects as devices if wanted |
| **Elementary Audio** | Declarative (React-like) DSP graphs rendered inside one WASM worklet; `el.in` for live input, virtual FS for samples | v4.0 Dec 2024; `web-renderer` 4.0.3 ~1 yr old; single maintainer, slowed cadence | MIT (Pro tier removed) | Excellent for authoring a *device* in JS; poor as the whole mixer (all routing must live inside its graph, outside nodes are second-class) | **Optional device DSL**, not the core |
| **Faust** (`@grame/faustwasm`, `faust2wasm`, `faust2wam`) | DSL → WASM AudioWorklet; huge stock library (`re.zita_rev1`, `re.dattorro_rev`, `re.greyhole`, `re.jpverb`, `co.compressor_*`, `co.limiter_1176_*`, `fi.*`) | 0.16.5 Jun 2026, monthly releases; Faust IDE exports WAM directly | Compiler GPL; libraries LGPL **with explicit exception**: generated code is yours (many JOS parts MIT-style STK-4.3) | Best ratio of effect quality to effort; precompile at build time (`faust2wasm`), don't ship the 10 MB compiler | **Adopt as primary DSP source for stock effects** |
| **WebAudioModules 2.0 (WAM)** | The browser "VST-like" standard: `WebAudioModule` → `WamNode extends AudioNode`, params, automation events, MIDI, state, GUI factory | API/SDK maintained (`@webaudiomodules/api`, `sdk`); community index at webaudiomodules.com has **58 plugins** (Sequencer Party pedals/synths, Faust pedalboard, Grey Hole, KBVerb, Microverb, OWLShimmer, GraphicEqualizer, Stereo Enhancer, Csound pitch shifter, ButterChurn…) | MIT | Cheap to host (a WAM is an `AudioNode`); ecosystem is thin and hobbyist, little mixing-grade material; but *your* Faust effects can be WAMs for free | **Implement a host adapter in Phase 2** as the plugin format; don't depend on the catalogue |
| **RNBO (Max 9)** | Export Max patches as WASM AudioWorklet via `@rnbo/js` | 1.4.3 Mar 2026 | Adapter MIT; exported code under Max licence or GPLv3; needs a Max licence and cloud compiler | Only pays off if you already design in Max | **Skip** unless Max enters the workflow |
| **Superpowered Web SDK** | Commercial WASM DSP (FX, stretch, analysis, mixer) | Active | Paid White Label for any public use; evaluation ≤ 1,000 installs, case-by-case | Opaque pricing, licence key in main thread; nothing Faust can't do here | **Reject** |
| **openDAW SDK** (`@opendaw/studio-sdk`, Rust WASM engine) | Full Ableton/Bitwig-class DAW in TS: tracks, groups, sends/aux, master, automation, stretch, recording (`CaptureAudio`), stem export; launching Sep 2026 | Very active (weekly npm releases) | **AGPL v3** (applies to SaaS use) or commercial | The strongest existing "Ableton in TypeScript". But: AGPL would bind a published lib and a hosted app; engine needs COOP/COEP (SharedArrayBuffer) on the Rails app; its box-graph model is opinionated and heavy; live-input routing to an aux is not a documented API | **Do not adopt; study.** Its mixer/automation model is a good reference for API shape |
| **Cmajor** | DSL that generates both WASM/Web Audio (`--target=webaudio`) and JUCE VST/AU projects (`--target=juce`) | 1.0.3096 Jan 2026, pushes May 2026 | GPLv3 or commercial (generated C++ from *your* code is yours) | Attractive "write once, two hosts" for new devices; smaller library than Faust; GPL engine only matters if you embed the JIT | **Watch**; Faust + Emscripten covers the same ground without a new toolchain |
| **essentia.js** | WASM port of Essentia (EBU R128, key, onset, MFCC…) | Maintained; `LoudnessEBUR128` is block-based, no streaming integrated state | AGPL (Essentia) | LUFS is already done server-side with ffmpeg; realtime short-term LUFS is ~40 lines of K-weighting in a worklet | **Skip** for runtime; server analysis stays as is |
| **meyda** | Lightweight JS feature extraction (RMS, spectral centroid, loudness) | Stable, low churn | MIT | Fine for UI meters; main-thread oriented | **Optional** for visualisation only |
| **signalsmith-stretch** | MIT WASM/AudioWorklet time/pitch stretch (live input or buffers, `schedule`, `latency()`) | 1.3.2 Jun 2025 | MIT | Best-in-class quality for its size; only needed once the grid view wants tempo-synced clips | **Adopt when** stretch is needed |
| **@soundtouchjs/audio-worklet** | WSOLA stretch in a worklet | 2.1.0 Jul 2026 | LGPL | Lower quality than Signalsmith for music | Fallback only |
| **wavesurfer.js 7** | Waveform player with Regions/Timeline/Multitrack plugins | Active | BSD-3 | Player-centric; Multitrack plugin owns playback (conflicts with our engine clock) | **Skip in engine**; use `computePeaks` + own canvas. OK for standalone previews |
| **peaks.js** | Konva-based zoomable waveform editor with segments | Active (BBC) | LGPL | Good editor widget, single-track, needs external sync | **Optional** for a clip editor later |
| **ringbuf.js** / SharedArrayBuffer | Lock-free worklet ↔ main data | Stable | MPL-2 | Needed only for high-rate meter/waveform streaming from worklets; requires COOP/COEP | **Defer**; `MessagePort` + `AudioParam` is enough for v1 |
| **plugbridge-electron**, Tauri + `vst3` crate, JUCE `AudioPluginHost` | Native VST3 hosting for a desktop shell | plugbridge: VST3 shipping, AU/LV2 planned | MIT / Rust crates / JUCE dual | Only relevant for a desktop product | See §2.1 |

### 2.1 The honest VST3/AU story

- **In a browser: impossible.** No WebKit/Chromium API loads native plugin binaries; there is no sandbox story for third-party native code with a GUI. This will not change.
- **The browser analogue is WAM 2.0.** It gives the *shape* of a plugin standard (params, automation, MIDI, state, GUI), and Faust IDE exports it, so the ecosystem is "whatever people compile to WASM". Expect to bring your own plugins.
- **Native hosting means a native shell**, i.e. a different product: Electron with `plugbridge-electron` (zero-copy `Float32Array` processing, `IPlugView` editor embedding via `BrowserWindow.getNativeWindowHandle()`), Tauri with the Rust `vst3` crate (ACE-Step DAW's route, with a WebSocket companion fallback for web), or a JUCE `AudioProcessorGraph` host (ShallowHost-style). All three put the audio graph in the native process, so the web engine would drive it over IPC — you would effectively own two engines.
- **For a Rails app used from an iPhone with lock-screen playback**, the native path is out of scope. Do not design the web engine around it; design the **device interface** so a native host could implement it later.
- **Your own DSP is the exception that works both ways:** `Felt/Source/StereoWidener.{h,cpp}` includes only `<array>`, `<cmath>`, `<algorithm>` and compiles with Emscripten as-is. The FDN reverb is embedded in `Tides/Source/PluginProcessor.{h,cpp}` (8 coprime delays, Hadamard mixing, allpass interpolation, DC blocker, LP damping) with `juce::SmoothedValue` for parameters — extract it into a header-only `FdnReverb` (`prepare(sr)`, `setDecay/Damping/Mix`, `process(l, r)`) and both JUCE and WASM consume it. `Bloom/Source/SpectralDrifter.h` only uses `juce::jlimit` and `MathConstants` and needs a trivial de-JUCE. The build recipe is literally ambient-live's `script/build-engine`; add `-msimd128` later.

---

## 3. Proposed architecture: a UI-agnostic engine core

Working name `live-mix` (package `@kieranklaassen/live-mix`, same `github:` distribution as `swiss-grid`). Raw Web Audio for routing and clip playback, AudioWorklet for custom DSP, no framework in the core.

### 3.1 Layers

```
live-mix/
  core/
    Engine            owns BaseAudioContext (or adopts one), MasterBus, OutputRouter, device registry, SampleStore
    Track             kinds: AudioTrack (clips), LiveInputTrack (MediaStream), InstrumentTrack (procedural), ReturnTrack (aux)
    ChannelStrip      inputGain → inserts[] → pan → fader → mute/solo → sends[] (pre/post) → destination bus
    Bus / MasterBus   summing GainNode; master has inserts + Limiter + Meter
    Device            interface { node, params, bypass, latency, dispose }  +  registry by id
    devices/native    Gain, EQ3/Parametric (Biquad), Delay, ConvolverReverb (generated IR or file), Compressor (native node), Panner
    devices/worklet   WasmDevice (Emscripten C++: StereoWidener, FdnReverb, Dattorro), FaustDevice (faustwasm), SidechainDucker (2 inputs)
    devices/wam       WamDevice adapter (Phase 2)
  transport/
    Transport         start/pause/stop/seek/loop, position from an audio-clock anchor, optional tempo map (seconds-first, bars optional)
    Scheduler         one lookahead loop (interval or worklet-clock message), window [now+lookahead], "scheduled once" discipline
    Arrangement       clips per track: { source, startAt, offset, duration, fadeIn, fadeOut, gainDb, loop } with live edits (move/trim/replace-upcoming)
    Session           scenes × tracks slots; launch quantisation (seconds or bars); one playing clip per track; follow actions (later)
  automation/
    ParamLane         breakpoints → AudioParam writes inside the lookahead window; cancel-and-hold on live override; the BreathGuide pattern
  analysis/
    Meter             peak/RMS (AnalyserNode v1, worklet later), short-term LUFS (K-weighted worklet, optional)
    EnvelopeFollower  worklet, exposes envelope to main thread at UI rate
  output/
    OutputRouter      'direct' | 'element' (MediaStreamDestination → unmuted <audio> + MediaSession)   ← lifted from musicEngine
  testing/
    MockAudioContext + AudioParam event recorder (lifted from musicEngine.test.ts), Offline render helper
react/
    useEngine, useTransport, useTrack, useParam, useMeter (rAF)   — useSyncExternalStore over engine snapshots
```

### 3.2 Key design decisions

- **Seconds are the primary time unit; bars are a view.** Breathwork Live is clock-driven, not tempo-driven. A tempo map can be layered for the grid view without touching clip scheduling.
- **One scheduler, one lookahead.** Today three 100–250 ms loops each write ahead. The engine runs one loop (100 ms tick, 0.2–5 s window depending on source type) and everything — clips, automation, session launches, breath cycles — enqueues into it. Position always derives from an anchor (`contextTime ↔ position`), never from accumulated ticks (ambient-live's `positionFromAnchor`).
- **Live input is a pass-through track.** `LiveInputTrack` wraps `MediaStreamAudioSourceNode` and encapsulates the Chrome "muted `<audio>` element" workaround; it never passes through the lookahead path. Its channel strip supports inserts and sends like any other, which is how the voice gets its hall send today.
- **Ducking becomes a device with a key input.** `SidechainDucker` is an AudioWorklet with two inputs (signal, key); attack/release/depth/scale ported from the current constants. This removes the 60 ms main-thread poll, removes the timer-throttling failure mode (background tabs / iOS), and lets the conductor's user-speech dip become a second key or a parameter automation instead of a master-volume multiply.
- **Clip sources are pluggable:** `BufferSource` (decoded, current behaviour), `ElementSource` (`MediaElementAudioSourceNode` streaming — the fix for the memory risk on long sessions), later `StretchSource` (signalsmith).
- **Devices are `AudioNode`-shaped**, with `params: Record<string, AudioParam | WorkletParamProxy>` and `latency` for later delay compensation. WAM plugs into this with no special casing.
- **The engine adopts an external `AudioContext`** (the intake path creates it before the session exists) and exposes `now()` so the conductor keeps its clock injection unchanged.

### 3.3 Latency and glitch considerations

- Web Audio renders in 128-frame quanta (~2.7 ms at 48 kHz). `renderSizeHint` is landing in Chrome and Firefox, not Safari — do not depend on it. The WebRTC voice arrives with 70–120 ms inherent latency (Opus frame + NetEQ jitter buffer), so engine-side latency for the voice path is negligible; what matters is that ducking *reacts* to the voice, which it does by construction.
- **Main-thread scheduling** is fine with ≥ 100 ms lookahead, but timers throttle in background tabs and on iOS; the scheduler must catch up from the anchor (never assume tick regularity), and clip/automation writes must be idempotent by key.
- **Never allocate in `process()`** (already the rule in kkfonie's CLAUDE.md and ambient-live's engine): WASM memory fixed-size, heap views created once, parameters via `MessagePort` or `AudioParam`s. Avoid SharedArrayBuffer in v1 so the Rails app does not need COOP/COEP (which would also break cross-origin `<img>`/iframes and needs care with the OpenAI WebRTC flow).
- **Sample-rate changes** (Bluetooth connect/disconnect) do not change `ctx.sampleRate` after creation; decoded buffers resample automatically, worklets must read the global `sampleRate`. Handle `statechange` → `suspended` (phone call) with a resume-on-gesture path.
- **Memory:** decoded stereo float PCM costs ~23 MB per minute at 48 kHz (`60 × 48000 × 2 × 4 bytes`); `buffers` is never evicted today ([`ensureLoaded`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/musicEngine.ts#L858-L872)). A 30–45 min session can hold several hundred MB — a jetsam risk on iOS. Evict after a clip ends, or stream long clips via `ElementSource`.
- **Echo:** keep music and voice in the same `AudioContext` so the browser's AEC playout reference sees the whole mix; mic capture keeps `echoCancellation: true` as today.
- **Element mode:** keep it engine-wide (every path through the master), fixing the takeover/intake bypasses noted in §1.2.

### 3.4 Reuse vs rewrite

| Reuse as-is (lift and rename) | Rewrite |
|---|---|
| Equal-power curves, `setValueCurveAtTime` crossfade scheduling, `STOP_FADE` | `TimelineEntry` + section fields → generic `Clip` on `AudioTrack`; sections move to a `SectionPlaylist` adapter |
| `OutputRouter` + `MediaSession` (`outputMode: 'element'`, `isIOSWebKit`) | Duck: `pollEnvelope` → `SidechainDucker` worklet; conductor dip → key/automation |
| LUFS trim math (`10^(gainDb/20)`, ±12 dB cap) as `Clip.gainDb` | Hard-wired `voiceGain`/`hall` → `LiveInputTrack` + `Send` → `ReturnTrack(ConvolverReverb)` |
| `createHallReverb` IR generator → `ConvolverReverb` device preset | `buffers` cache → `SampleStore` with eviction and streaming sources |
| `BreathGuide` cycle writer → `InstrumentTrack` example + `ParamLane` pattern; `onPhase` → generic `useParamPhase` | Three tick loops → one `Scheduler` |
| ambient-live `clip-player`, `clip-schedule`, anchor transport, `engine-processor` WASM host, Dattorro, `computePeaks`, `components/daw` | ambient-live's single-voice WASM core → per-device WASM modules (one module per effect, or one module with multiple instances) |
| `MockAudioContext`/`MockAudioParam` recorder → `live-mix/testing` | — |

---

## 4. Phased plan

Effort is expressed as scope (modules, LOC, tests), not calendar time.

### Phase 0 — Carve the engine out in-repo, existing app as first consumer

- **Where:** `app/frontend/lib/mix/` first (no build/tooling changes, Vitest and `tsc -p tsconfig.app.json` already cover it). Promote to a workspace package (`packages/live-mix` with `pnpm`/npm workspaces) only at Phase 2.
- **Deliverables:** `Engine`, `MasterBus`, `OutputRouter`, `AudioTrack` + `Clip` + `Scheduler` (from `musicEngine.ts` + ambient-live), `LiveInputTrack`, `Send`/`ReturnTrack` with `ConvolverReverb`, a `SidechainDucker` (native-graph version first: the existing envelope follower moved into a device; worklet swap in Phase 1), and `SectionPlaylist implements MusicEngineLike` carrying every section/boundary/steer/extend rule verbatim.
- **Parity gate:** point [`musicEngine.test.ts`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/__tests__/musicEngine.test.ts) at `SectionPlaylist` (same public API, same recorded `AudioParam` events); `conductor.test.ts` untouched. Add one Playwright/OfflineAudioContext render golden for a two-track crossfade + duck if time allows. Feature-flag the swap in `SessionExperience.tsx`; run two or three real sessions before deleting `musicEngine.ts`.
- **Size:** medium. ~8–10 modules, ~1.5–2k LOC engine + adapter, the existing 979-line test file re-targeted, ~150 lines of new tests. Mostly moving code; the risky part is the boundary math in `extendCurrentSection`/`replaceUpcoming`.
- **Top risks:** behaviour drift in steer/extend (mitigated by the recorded-event tests); iOS element mode regressions (mitigated by making it engine-wide, which also fixes the takeover path); accidentally widening scope into Phase 1.

### Phase 1 — Grid view, effect chains, master

- **Engine:** `ChannelStrip` inserts/pan/fader/mute/solo, `Bus`, `MasterBus` with `Limiter` + `Meter`, `Transport` (pause/seek/loop), `Session` (scenes × tracks, launch quantisation), `ParamLane` automation, worklet `SidechainDucker`, `SampleStore` eviction + `ElementSource`.
- **Devices:** native EQ3/Delay/Compressor; first WASM devices — `StereoWidener` (kkfonie, compiles today), `FdnReverb` (extracted from Tides/Bloom), Dattorro (ambient-live), one or two Faust builds (`re.zita_rev1` or `re.greyhole`, `co.limiter_1176_R4`). Build scripts modelled on `script/build-engine`; artefacts committed like ambient-live does.
- **UI (thin React layer):** `useEngine/useTrack/useParam/useMeter`; mixer strip and device panel reusing ambient-live `components/daw`; a grid view over `Session`; arrangement lane over `Arrangement` with `computePeaks`.
- **App changes:** Breathwork Live gains a real master limiter and a proper ducker; optionally the breath guide and ambience become tracks on the same master (fixes the parallel-output paths).
- **Size:** large. ~15 modules, ~3–4k LOC TS + ~600 LOC C++ extraction + build scripts; new tests for transport/session/automation (pure functions first, like ambient-live's `clip-schedule.test.ts`).
- **Top risks:** worklet + WASM bundling under Vite 8 (`?worker&url`, dev vs prod paths — ambient-live solved this once; copy it); CPU on iPhone with several WASM devices (measure with `AudioContext` glitch counters / `performance.now()` in `process`); session-view semantics creeping into DAW scope creep — keep the grid minimal (launch/stop/quantise).

### Phase 2 — Publish as a separate library

- Move to `packages/live-mix` with `core/`, `react/`, `devices/` entry points; ESM + types; Vitest with the exported `testing/` mocks; a `WamDevice` adapter and a "make my Faust effect a WAM" recipe; examples (breathwork playlist, ambient paint timeline); README with the real-time rules.
- Distribution like `swiss-grid` (`github:kieranklaassen/live-mix`) first; npm later. Keep everything MIT/BSD-compatible: no Superpowered, no openDAW, no essentia at runtime; Faust output is yours by the library exception; Emscripten output is yours.
- ambient-live becomes the second consumer (its `AudioEngine` + `ClipPlayer` collapse into `live-mix` tracks; its C++ core becomes devices).
- **Size:** medium. Mostly packaging, docs, API hardening, two consumers migrating.
- **Top risks:** API churn while two apps depend on it (version-pin, migrate one at a time); maintenance load of a public lib vs a personal one — publishing can stay "github: dep, no semver promise" for a long time.

---

## 5. Recommendation

- **Build (the core), adopt (the DSP), skip (the frameworks).** The mixing core — tracks, strips, sends, master, transport, scheduler, live input, output routing — is small, you have most of it, and every framework that offers it either owns your clock (Tone.js), owns your graph (Elementary), or owns your licence (openDAW, Superpowered). Custom DSP is where adoption pays: Faust for stock effects, Emscripten for your kkfonie C++, `signalsmith-stretch` when the grid needs stretch.
- **Libraries to use:** `@grame/faustwasm` toolchain at build time (not in-browser compile), Emscripten (already required by ambient-live), `signalsmith-stretch` (Phase 1+, when needed), `@webaudiomodules/api` + `sdk` for the Phase 2 host adapter. Nothing else in the core.
- **Plugins:** WAM 2.0 is the only browser plugin format worth supporting, and mainly as a way to package your own Faust/C++ effects. Real VST3/AU stays native; if that ever becomes a goal, do it as a JUCE or Electron shell that implements the same `Device` interface, not as a browser feature.
- **Do first:** Phase 0, starting with `Engine` + `OutputRouter` + `AudioTrack`/`Scheduler` lifted from `musicEngine.ts`, then `SectionPlaylist implements MusicEngineLike`, then re-target `musicEngine.test.ts`. While there, close the two concrete gaps the mapping surfaced: unbounded `AudioBuffer` caching, and the takeover/intake paths bypassing element mode on iOS.
