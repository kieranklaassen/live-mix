---
title: Audio Mixing Engine - Plan
type: feat
date: 2026-09-14
topic: audio-mixing-engine
artifact_contract: ce-unified-plan/v1
artifact_readiness: requirements-only
product_contract_source: ce-brainstorm
execution: code
---

# Audio Mixing Engine - Plan

Draft v0 — pending Kieran's confirmation.

North-star vision for the shared JS/TS mixing engine (working name `live-mix`). The near-term execution plan is [mixing-engine-plan.md](./mixing-engine-plan-of-record.md); its Phase 0 and Phase 1 are the first slices of this vision. Repo paths below are prefixed with the repo name (`breathwork-live/…`, `ambient-live/…`, `kkfonie/…`) and pinned to `breathwork-live@ebdd457`, `ambient-live@1d3b31b`, and the kkfonie workspace checkout.

---

## Goal Capsule

- **Objective:** Define the most complete version of one audio engine that Breathwork Live, ambient-live, and later products build on: an Ableton-class mixer, arrangement, and device host in the browser whose every capability an AI agent can drive through tools, with a native shell as a later tier. This document fixes *what* the engine must be able to do and which parts are Core, Dream, or Maybe-never; the execution order lives in the plan of record.
- **Product authority:** Kieran Klaassen — sole builder and sole user of both consumer apps. He has settled the runtime tiering (KD7). The remaining working assumptions (solo foundation, two consumers, agent control as core) are the coordinator's and await his confirmation.
- **Open blockers:** Kieran's confirmation of the three remaining working assumptions. Nothing else blocks planning; Phase 0 of the plan of record is already implementable.

---

## Product Contract

### Summary

Build `live-mix`: a UI-agnostic mixing engine (tracks, groups, returns, master, transport, arrangement, session grid, devices, automation, live inputs) on raw Web Audio + AudioWorklet, with a declarative score document as its source of truth, a tool-callable agent API as a first-class control surface, a WASM device ecosystem fed by Faust and Kieran's kkfonie C++, an optional React UI kit, and offline rendering that is sample-identical to live playback. Ship it as one public npm package that both apps consume.

### Problem Frame

Kieran has three mixing engines and none of them is a mixer. Breathwork Live's [`musicEngine.ts`](https://github.com/kieranklaassen/breathwork-live/blob/feat/breathwork-live/app/frontend/lib/breathwork/musicEngine.ts) sums everything into one duck bus, polls its sidechain on the main thread every 60 ms (`breathwork-live/app/frontend/lib/breathwork/musicEngine.ts:22`), has no pause or seek, and caches decoded audio forever. ambient-live plays clips through a global reverb with no tracks or sends (`ambient-live/engine/src/engine.cpp:83-108`). The BB plugin carries a third sample player (`ambient-live/bb-plugin-ambient-live/audio/sample-player.ts:1-10`). Every new musical idea — a limiter, a second reverb, a breath-synced filter, agent-steered stems — must be built twice or not at all.

The AI coach is already a mixing operator. It calls `set_music_volume`, `set_music(calmer|stronger|change)`, `set_pace`, `extend_current_section`, and `advance_to_next_section` mid-session (`breathwork-live/app/services/breathwork/agent_tools.rb:65-131`), yet those tools reach the audio only through a domain-specific conductor, and the whole musical vocabulary the coach can use is five verbs. The listener feedback loop (`record_feedback`, session webhooks) already drives code changes within hours; the audio layer is the slowest part to respond.

Why now: the shared-library decision has been taken, both apps are on the same Rails 8.1 + Inertia + Vite 8 chassis, ambient-live is dormant and un-deployed (a safe first consumer), and kkfonie's C++ (`StereoWidener`, the Tides FDN, `SpectralDrifter`, Ether, Felt) is a device catalogue waiting for a host.

### Actors

- A1. **Kieran the builder** — writes the engine, its devices, and both apps; solo; deploys Breathwork Live with Kamal from the Mac mini and runs ambient-live on the MacBook.
- A2. **The AI coach** — an OpenAI Realtime agent that speaks to the listener and calls tools during a session; later also a planning LLM that authors a whole session score before playback. Treats the mix as something it operates, not something it hears.
- A3. **The listener** — Kieran (and later others) in a breathwork session, often on an iPhone with the screen locked, speaking to the coach; consents before the session starts and expects the music never to startle or drown the voice.
- A4. **The ambient performer** — Kieran at the MacBook painting clips onto a looping timeline, playing keys or Web MIDI, later plugging in a guitar or mic; latency-sensitive.
- A5. **Consumer applications** — Breathwork Live and ambient-live today (and the BB plugin, other products later): host the engine, own their domain logic, and pin a version.

### Goals

- One engine, many products: the mixer, arrangement, and device host live in the library; only domain logic (breathwork sections, paint gestures) stays in apps.
- Agent-operable by design: every capability has a tool schema, an intent-level counterpart, safety rails, and an observable state snapshot.
- Ableton-grade musical vocabulary: tracks, groups, returns, sends, racks, macros, sidechains, automation, modulation, session and arrangement views, warping, bounce.
- One DSP source, two hosts: kkfonie C++ and Faust devices run in the browser as WASM and natively in JUCE without a rewrite.
- Deterministic and testable: the same score renders identically live and offline; behaviour is asserted at the AudioParam boundary and in rendered goldens.
- Browser-first, iPhone-honest: lock-screen playback, memory discipline, no COOP/COEP requirement, graceful degradation on Safari.
- Open-sourceable: MIT, zero runtime dependencies, no AGPL or commercial DSP in the core.

### Key Decisions

- KD1. **The engine is a shared library consumed by both apps, not an in-repo carve-out.** (session-settled: user-directed — chosen over carving `app/frontend/lib/mix/` out inside breathwork-live: Kieran requires the ambient-live workstation to use it too.) Governs R1, R36, R37.
- KD2. **Raw Web Audio + AudioWorklet is the core; Tone.js is not the foundation.** Carried from the project context and the assessment, not yet confirmed by Kieran in dialogue: Tone.js owns the clock and offers no sidechain or worklet DSP; it may appear only as isolated, wrapped inserts. Governs R1, R5, R9.
- KD3. **DSP comes from Faust, Emscripten-compiled kkfonie C++, `signalsmith-stretch` for warping, and WAM 2.0 as the optional browser plugin format; VST3/AU stay native-only under "one DSP source, two hosts".** Carried from the project context; openDAW (AGPL), Superpowered (commercial), and essentia (AGPL) are excluded from the core. Governs R11, R20, R30, R35.
- KD4. **Agent control is a first-class actor, not an add-on.** Working assumption from the coordinator: every mixer capability is exposed as a tool-callable operation with schema, rails, and observability, mirroring the coach tools that already exist (`breathwork-live/app/services/breathwork/agent_tools.rb:65-131`). Governs R25, R26, R27, R28, R29.
- KD5. **Seconds are the primary time unit; bars and beats are a view.** Breathwork Live is clock-driven; ambient-live loops in seconds; a tempo map layers on top for the grid and warping. Governs R5, R8, R20.
- KD6. **A declarative score document is the source of truth for everything except live input.** Arrangement, grid, automation, device graphs, and agent edits are operations on the score; the realtime mixer and the offline renderer are two renderers of it. Adopted from the challenger approach below because it makes undo, versioning, offline bounce, goldens, and attributed agent edits fall out of one mechanism. Governs R22, R24, R27.
- KD7. **Browser-first including iOS Safari/PWA; a native shell tier (Tauri/Electron + JUCE host for real VST3/AU) is optional per consumer and never a requirement for every app.** (session-settled: user-directed — chosen over browser-only forever and over a native shell for all consumers: Breathwork Live stays browser/PWA-only; ambient-live or a future workstation may opt into the shell, which implements the same device and score contracts.) No Core requirement depends on the shell; every native-shell item stays Dream tier. Governs R34, R35.
- KD8. **Every catalogue item carries a tier — Core, Dream, or Maybe-never — and YAGNI applies to carrying cost, not ambition.** Core = the north star is not credible without it and a consumer or the agent needs it; Dream = build when a consumer pulls; Maybe-never = named so it is consciously not built.
- KD9. **Visual = audio: any UI representation reads the same formula or state as the DSP.** kkfonie rule (`kkfonie/CLAUDE.md` "Visual = Audio"), already followed by ambient-live's clip fades (`ambient-live/app/frontend/audio/fade.ts:1-3`). Governs R33.
- KD10. **The listener's protection outranks the agent's intent.** Loudness ceilings, voice-priority ducking, no-silence and no-startle guards, and consent flags cannot be overridden by a tool call. Governs R3, R17, R27.

### Requirements

**Mixer core**

- R1. The engine provides tracks of kind audio, instrument, live-input, return, and group, each with input gain, inserts, pan, fader, mute, solo, and sends, feeding buses and one master with a single output terminus.
- R2. Every routing or parameter change while playing is click-free: ramps or crossfades, never a hard switch.
- R3. The master carries a true-peak limiter and peak/RMS/short-term-LUFS metering that no operation can bypass.
- R4. Groups sum member tracks and host their own inserts, sends, and automation.

**Transport and arrangement**

- R5. The transport offers play, pause, stop with fade, seek, loop with numbered passes, and position derived from the audio-clock anchor, with an optional tempo map.
- R6. Arrangement clips carry source offset, duration, fades with selectable curve, gain in dB, and loop, and edits under playback move boundaries rather than truncating sounding audio (`breathwork-live/docs/solutions/realtime-voice-session-architecture.md` decision 4).
- R7. Scheduling is idempotent and catches up from the anchor after timer throttling, joining late clips mid-way rather than replaying them (`ambient-live/app/frontend/audio/clip-player.ts:38-43`).

**Session grid**

- R8. Scenes × track slots with quantised launch, one playing clip per slot, stop/launch per scene, and follow actions, as a view over the same clip model as the arrangement.

**Devices and chains**

- R9. A device is any processor exposing typed parameters with range, taper, unit, and default, plus bypass, reported latency, state save/load, and a lifecycle; native-node, WASM, Faust, WAM, and later native implementations satisfy one contract.
- R10. Racks host parallel chains with per-chain gain and pan, macros that map to many parameters with curves, per-device dry/wet, and sidechain key inputs.
- R11. Stock devices cover EQ, compressor, ducker, delay, convolution and algorithmic reverbs, stereo widener, spectral drifter, limiter, filter, utility, and instruments including a breath/noise synth, sine, sampler, granular, and later a modal piano.
- R12. Plugin delay compensation aligns tracks and sends when devices report latency.

**Automation and modulation**

- R13. Parameter lanes hold breakpoints with curves, are written ahead inside the scheduler window, and yield to a live override with cancel-and-hold.
- R14. Modulators — free-running LFO, envelope follower, random/sample-and-hold, macro, and external phase sources such as breath phase — can target any parameter with depth and polarity.
- R15. MIDI, Web MIDI, and OSC map to parameters and transport through learn mode.

**Live input and monitoring**

- R16. Live-input tracks wrap any `MediaStream` (microphone, WebRTC remote voice) with inserts, sends, monitoring toggle, and a stated latency budget, and never add buffering in the monitoring path.
- R17. Voice-keyed ducking runs in the audio thread on any bus with configurable attack, release, depth, and key, with the current constants as defaults (`breathwork-live/app/frontend/lib/breathwork/musicEngine.ts:13-24`).

**Analysis and awareness**

- R18. Realtime analysis exposes peak, RMS, short-term LUFS, and spectrum per bus; offline analysis provides integrated LUFS, key with Camelot code, BPM, energy curve, and lyric/vocal windows, whether imported from a server or computed in the browser.
- R19. Musical events (drop, swell, breakdown, vocal window, section boundary) are available on a time-addressed feed to agents, automation, and UI (`breathwork-live/app/frontend/lib/breathwork/conductor.ts:164-174`).

**Warping and key matching**

- R20. A stretch clip source provides tempo-synced time-stretch and pitch-shift with reported latency.
- R21. Harmonic compatibility follows the Camelot rule already shared by the server and client selectors — same number ±1 wrapping 1–12, letter-agnostic, unparseable codes compatible with everything (`breathwork-live/app/frontend/lib/breathwork/musicResolver.ts:49-64`, `breathwork-live/app/services/music/selection.rb:124-131`) — and is available as a pure helper for selection, crossfade choice, and key-matching.

**Recording, bounce, export**

- R22. Any score renders offline to WAV, MP3, or stems, sample-identical to live playback of the same score when no live inputs are involved.
- R23. Live inputs and the master can be recorded to clips or files during playback.

**Persistence and history**

- R24. The score document serialises to JSON with schema versioning, supports undo/redo, and records every operation with its author (human, agent, automation) and time.

**Agent control**

- R25. Every mixer capability is available as a named operation with a JSON schema, validated ranges, and a prompt result payload, in the same shape as the coach tools (`breathwork-live/app/frontend/lib/breathwork/toolHandlers.ts:95-193`).
- R26. Intent-level operations (calmer, stronger, change, more space, softer under voice, extend, advance) sit beside parameter-level ones, and the engine resolves intents using analysis data such as intensity labels, Camelot, LUFS, and vocal windows (`breathwork-live/app/frontend/lib/breathwork/musicResolver.ts:79-125`).
- R27. Safety rails clamp values, rate-limit changes, enforce loudness and no-silence guards, quantise musically sensitive edits, honour consent flags, and make every agent operation undoable and logged.
- R28. An observable state snapshot (now playing, upcoming, levels, active vocal windows, section position) is available at a settable cadence and on demand so an LLM can react without polling the graph.
- R29. Multiple controllers (UI, agent, automation) act on the same parameters under a stated arbitration rule with override memory, so a human touch is not silently undone by automation.

**Plugin ecosystem**

- R30. A stable WASM device ABI lets kkfonie C++ compile for the browser with Emscripten and for the existing JUCE plugin builds from one source (`kkfonie/Felt/Source/StereoWidener.h:21-28`), independent of any native shell; Faust devices precompile to the same ABI; a WAM 2.0 host adapter accepts third-party browser plugins.
- R31. Devices ship with metadata, presets, version, and lazy loading, and appear in every consumer's device list without app changes.

**UI kit**

- R32. A React kit offers headless hooks and separately styled components for mixer strips, device view, arrangement lane, session grid, waveform, meters, transport, and automation editing, themed through CSS variables.
- R33. Every visual derived from audio state uses the same formula as the DSP (per KD9).

**Platform**

- R34. The engine runs in current Chrome, Firefox, and Safari including iOS PWA: lock-screen playback through element output mode and `MediaSession`, memory eviction for long sessions, sample-rate and interruption recovery, no `crossOriginIsolated` requirement, and SharedArrayBuffer used only when available.
- R35. An optional native shell tier hosts the same score and device contracts with real VST3/AU plugins and low-latency I/O, adopted per consumer (per KD7); a consumer that stays browser-only loses no Core capability.
- R36. The library is ESM-only, has zero runtime dependencies, imports safely under server-side rendering, and ships compiled JS with type declarations.

**Developer experience**

- R37. The engine runs headless in Node for tests with a recording mock context and offline golden renders, ships typed docs and runnable examples for both consumer shapes, and follows semver with a changelog.
- R38. Performance budgets are stated and measured: allocation-free processing, CPU headroom on a current iPhone with a stated device count, and glitch counters exposed to the host.

### Key Flows

- F1. **The coach steers the mix mid-session**
  - **Trigger:** The listener says the music is too present, or asks for different music.
  - **Actors:** A2, A3, A5 (Breathwork Live)
  - **Steps:** The coach calls a parameter operation (music volume) or an intent operation (calmer); the engine resolves calmer to the next lower intensity and a Camelot-compatible replacement, swaps at a musical boundary, moves the section boundary rather than truncating, and returns now-playing plus seconds added; the ducker keeps the voice on top throughout; the operation is logged for the transcript and feedback loop.
  - **Covered by:** R2, R6, R17, R21, R25, R26, R27, R28

- F2. **The performer paints and plays**
  - **Trigger:** A sample is dropped on the looping timeline; a stroke is painted over a device parameter; a guitar is plugged in.
  - **Actors:** A4, A5 (ambient-live)
  - **Steps:** The drop becomes a clip; the stroke becomes an automation lane on the granular device; the guitar becomes a live-input track monitored through a chain; the loop iterates with quantised launches of held clips; the result bounces to a file.
  - **Covered by:** R5, R6, R8, R13, R16, R22

- F3. **The builder adds a device from kkfonie**
  - **Trigger:** Kieran wants Tides' breathing reverb in a session.
  - **Actors:** A1, A5
  - **Steps:** The C++ is compiled against the device ABI; the WASM artefact and parameter table land in the library; both apps list the device with a generated device view; the JUCE build is unchanged.
  - **Covered by:** R9, R11, R30, R31, R32

- F4. **An agent authors a session offline and it plays live unchanged**
  - **Trigger:** The planner LLM composes a 20-minute session.
  - **Actors:** A2, A1
  - **Steps:** The planner emits a score (tracks, LUFS trims, Camelot-ordered clips, cue-timed automation); the offline renderer produces an MP3 and analysis; the same score is loaded live and the coach edits it by operations during playback; the two renders are identical up to the live edits.
  - **Covered by:** R21, R22, R24, R25

- F5. **The listener locks the phone**
  - **Trigger:** The iPhone screen locks or a phone call interrupts mid-session.
  - **Actors:** A3
  - **Steps:** Playback continues through the element output with lock-screen metadata; an interruption suspends and resumes on the next gesture without losing position; memory stays bounded for a 45-minute session.
  - **Covered by:** R5, R7, R34

### Acceptance Examples

- AE1. **Covers R21, R26.** Given the playing track is `8A` at intensity 2 and the coach requests `calmer`, then the replacement has intensity 1 and a Camelot number in {7, 8, 9} when any such track exists, and the result reports the seconds the section grew.
- AE2. **Covers R27.** Given an agent operation requests music volume 3.0, then the applied value is 1.0, the clamp is logged with the requested value, and the operation is undoable.
- AE3. **Covers R8.** Given launch quantisation is one bar and a clip is launched 300 ms before the bar, then it starts on the bar, not immediately.
- AE4. **Covers R7.** Given the tab is backgrounded and the scheduler timer is throttled for 4 s, then no due clip is skipped and none plays twice.
- AE5. **Covers R34.** Given an iPhone in element output mode and the screen locks, then playback continues and the lock screen shows the session title.
- AE6. **Covers R22.** Given a score without live inputs, then the offline render and a live render of the same score are sample-identical at the same sample rate.
- AE7. **Covers R24, R29.** Given the coach lowers the music and the listener then drags the fader, then the fader wins, the agent's later automation does not undo it, and undo restores the coach's value.
- AE8. **Covers R14, R33.** Given breath phase is mapped to a filter cutoff, then the on-screen indicator and the audible cutoff follow the same inhale/exhale curve with no visible or audible lag between them.
- AE9. **Covers R10, R17.** Given the coach's voice is the sidechain key of the music group's ducker, then music dips within the configured attack when the coach speaks and recovers within the release when the coach stops, while the breath guide on a separate bus is unaffected when so configured.
- AE10. **Covers R30.** Given `StereoWidener` compiled to the device ABI, then processing a stereo test signal in the browser and in the JUCE build produces the same output within float tolerance.

### Success Criteria

- Both apps run on the library with their existing behaviour tests green and no audible regression judged by Kieran (plan of record, Phase 0).
- The coach's musical vocabulary grows from five verbs to intent and parameter operations on any track, with a per-session log Kieran can read.
- A kkfonie device reaches both apps from a C++ source in one build step and one release, with no app code change.
- A session score renders offline and plays live identically, retiring the need for a second rendering path when Kieran chooses to.
- The ambient-live live-guitar monitoring path feels playable to Kieran (ambient-live's own success criterion: round-trip at or under ~50 ms judged by feel, `ambient-live/docs/plans/2026-07-21-001-feat-ambient-live-plan.md:143`).

### Scope Boundaries

**Deferred for later (Dream or pulled by a consumer)**

- Session grid, follow actions, and the arrangement UI — no current consumer asks for a grid; ambient-live rejects grid UI for its product (`ambient-live/docs/plans/2026-08-07-001-feat-ableton-workstation-shell-plan.md:39`).
- Native shell with VST3/AU hosting — optional per consumer (KD7); the browser engine designs for it only through the device and score contracts, and Breathwork Live never adopts it.
- In-browser lyric transcription and key detection — server analysis exists and is correct; browser analysis is a convenience tier.
- Collaborative multi-user editing.

**Outside this product's identity**

- A general-purpose DAW competing with Ableton or openDAW; the engine is a foundation for Kieran's products.
- Piano roll and full MIDI sequencing (ambient-live decided against a piano roll; Lilt and Thesis cover MIDI generation natively).
- Hosting third-party native plugins in the browser — not possible in any browser.
- Video, notation, surround and Ambisonics delivery.

### Feature tiers at a glance

| Tier | Meaning | Examples |
|---|---|---|
| Core | Not credible without it; a consumer or the agent needs it now | Mixer, transport, clips, live input, ducker, LUFS trims, agent operations with rails, WASM device ABI, iOS output mode, headless tests |
| Dream | The full vision; build when a consumer pulls | Session grid, racks and macros, modulation matrix, stretch and key-matching, offline bounce, undo/versioning, React kit, WAM host, kkfonie device catalogue, native shell |
| Maybe-never | Named so it is consciously not built | Piano roll, collaborative editing, surround, in-browser transcription, plugin marketplace |

### Dependencies / Assumptions

- Assumption (coordinator, unconfirmed): the library is a solo-developer foundation that may be open-sourced later.
- Assumption (coordinator, unconfirmed): consumers are Breathwork Live and ambient-live; others later.
- Assumption (coordinator, unconfirmed): agent/AI control of the mix is core, not an add-on.
- Settled by Kieran (KD7): browser-first including iOS/PWA; the native shell is an optional per-consumer Dream tier — Breathwork Live stays browser/PWA-only.
- Assumption: the OpenAI Realtime tool channel remains the primary live agent surface; a planning LLM authoring scores offline is an extension of the same operation set, not a second API.
- Assumption (unverified): kkfonie `SpectralDrifter` and the Tides FDN need a small de-JUCE pass before compiling with Emscripten — `SpectralDrifter.h` includes `juce_dsp` and uses `juce::jlimit`/`MathConstants` (`kkfonie/Bloom/Source/SpectralDrifter.h:2,73,118`); `StereoWidener` includes only `<array>` and `<cmath>` and compiles as-is (`kkfonie/Felt/Source/StereoWidener.h:2-3`).
- Assumption (unverified): Felt's modal piano can be hosted as a WASM instrument within an iPhone CPU budget; its architecture is documented (`kkfonie/Felt/README.md:3-7`) but its cost in a worklet was not measured.
- Assumption: Kieran controls the `@kieranklaassen` npm scope or will create it; otherwise `@kkfonie`.
- Dependency: the plan of record's Phase 0 package and its adoption in both apps precede every Dream item.
- Dependency: Emscripten on the MacBook and in the library's CI; never in the consumers' installs.

### Outstanding Questions

**Resolve Before Planning**

- Does agent control extend to ambient-live (an agent as co-performer or arranger), or is it a Breathwork Live concern only? This decides whether R25–R29 are Core for both consumers or Core for one.
- Should the offline renderer aim to replace the tuin pre-rendered pipeline (pydub, `−6 dB` fixed duck, hard cuts per the survey), or only serve tests and bounce? This decides how much of R22 is Core.
- Is the library public from the first release?

**Deferred to Planning**

- Tempo-map representation and how bars overlay seconds for the grid and warping.
- Undo granularity for continuous gestures (per gesture vs. per operation) and the arbitration rule between agent and human controllers.
- Which analyses move into the browser and which stay server-side.
- Stretch algorithm choice and licence at the time the grid needs it.
- WAM host depth (parameters and automation only vs. GUI embedding).

<!-- ce-section: work-relationships -->
### How This Work Fits Together

This plan owns the north-star requirements for the shared engine. The breakdown below is the current understanding, not a committed roadmap.

- [mixing-engine-plan.md](./mixing-engine-plan-of-record.md) — the execution plan of record.
  - Depends on this plan for the requirement set and tiers; its Phase 0 (mixer core, transport, clips, live input, ducker, output router, WASM device ABI with Dattorro, headless test mocks) is the first slice of the Core tier; its Phase 1 (strips, master limiter, worklet ducker, automation lanes, kkfonie devices, React hooks) is the second.
  - Enables every Dream item: nothing in the Dream tier starts before both apps consume the Phase 0 package.
  - Shares KD1–KD3 and KD5; conflicts, if any, are resolved by revising this plan and citing the plan of record.
- [audio-mixing-engine-assessment.md](./audio-mixing-engine-assessment.md) — library evaluation and architecture sketch; its §1–§3 remain the technical grounding for both plans.
- Breathwork Live's own plan (in `tuin`, per the [survey](https://github.com/kieranklaassen/breathwork-live)) — can proceed independently; adopts engine capabilities as they land. The coach's tool set is the seed of R25–R26.
- ambient-live's plans — can proceed independently; its deferred live-input latency spike becomes the acceptance test for R16 once it is on the engine.
- kkfonie JUCE workspace — shares the DSP sources under KD3; still to decide whether kkfonie hosts the C++ canonical copies or the library does.
- tuin pre-rendered pipeline — still to decide whether the offline renderer (R22) eventually replaces it.

### Sources / Research

- Coach tools and rails: `breathwork-live/app/services/breathwork/agent_tools.rb:65-74` (`set_pace`), `:81-87` (`extend_current_section`, 1–300 s), `:101-107` (`set_music_volume` 0–1), `:114-126` (`set_music` calmer/stronger/change, explicit-consent wording), `:32-51` (`begin_session_generation`, 5–45 min); client handling `breathwork-live/app/frontend/lib/breathwork/toolHandlers.ts:10` (300 s cap), `:17-37` (conductor API), `:135-161` (result carries `practice_extended_seconds`).
- Conductor steering: `breathwork-live/app/frontend/lib/breathwork/conductor.ts:65-72` (pace factors 1.15/0.85, bounds 0.7–1.6, 55-minute session cap), `:543-562` (`setPace`), `:568-593` (`extendSection` with headroom), `:628-650` (`setMusic` → replacement resolver, boundary moves), `:1665-1677` (user-speech dip multiplies master volume).
- Camelot and intensity logic: `breathwork-live/app/frontend/lib/breathwork/musicResolver.ts:38-46` (target intensity), `:49-64` (wheel number, ±1 wrap), `:79-125` (greedy ladder: target+harmonic → target → adjacent); server parity `breathwork-live/app/services/music/selection.rb:16-24`, `:99-102`, `:124-131`; tuin origin per the [survey](https://github.com/kieranklaassen/breathwork-live) (`music_selector.py`: S1 intensity 1 then 2, S2 always 3, S3 2-after-3 else 1, Camelot ±1 letter-agnostic, no repeats; `audio_composer.py`: −6 dB duck, hard cuts).
- Loudness: `breathwork-live/app/services/music/loudness.rb:15,26-29` (−16 LUFS target, ±12 dB cap); ducking constants `breathwork-live/app/frontend/lib/breathwork/musicEngine.ts:13-24`; main-thread poll `:840-854`; element output mode `:55-84`.
- Breath-synced modulation precedent: `breathwork-live/app/frontend/lib/breathwork/breathGuide.ts:26-43` (per-section cycles, 400–1100 Hz bandpass, 2 s automation lookahead).
- ambient-live primitives: anchor transport `ambient-live/app/frontend/pages/live/use-clip-transport.ts:47-67`; late-join clip playback `ambient-live/app/frontend/audio/clip-player.ts:35-73`; WASM worklet host `ambient-live/app/frontend/audio/engine-processor.ts:18-36`; Dattorro plate `ambient-live/engine/src/dattorro_reverb.h:13-30`; product rules `ambient-live/docs/plans/2026-07-21-001-feat-ambient-live-plan.md:69-71` (no VST in v1, live input day-one, iPad native later).
- kkfonie DSP inventory: `kkfonie/Felt/Source/StereoWidener.h:5-15` (three-stage S1-style widening, bass kept narrow), `:21-28` (API); Tides FDN `kkfonie/Tides/Source/PluginProcessor.cpp:107-110` (eight coprime delays), `:199-202` (Hadamard 8×8), `:332-333` (breathing LFO law `1 − depth·(1 − breathMod)`); Ether reverb parameters `kkfonie/Ether/Source/PluginProcessor.cpp:24-54` (decay, size, damping, mix, pre-delay, freeze); `kkfonie/Bloom/Source/SpectralDrifter.h:24-81` (direction, season, seed, tonality; granular pitch drift); Felt modal piano `kkfonie/Felt/README.md:3-7`; MIDI-only tools Lilt (`kkfonie/Lilt/README.md:3`) and Thesis.
- Library landscape and licences: [assessment §2](./audio-mixing-engine-assessment.md).

---

## Feature Catalogue

Mechanism-level, by area. Tier per KD8. `Covers` links the owning requirement.

### Transport and arrangement timeline

| Feature | Tier | Mechanism | Covers |
|---|---|---|---|
| Play/pause/stop-with-fade/seek/loop | Core | Anchor-based position; numbered loop passes | R5 |
| Arrangement clips with offset, duration, fades, gain, curve | Core | Equal-power and linear curves; per-clip dB trim | R6 |
| Live boundary edits (extend, advance, replace upcoming) | Core | Move boundaries; never cut sounding audio | R6 |
| Timer-throttle catch-up and late join | Core | Idempotent keys; join mid-clip | R7 |
| Tempo map, bars/beats view, metronome | Dream | Seconds ↔ bars mapping layered over the clock | R5 |
| Markers, locators, punch range | Dream | Named positions on the score | R5, R24 |
| Clip looping and slicing | Dream | Loop region per clip; slice to new clips | R6 |
| Comping/takes lanes | Maybe-never | Multiple takes per clip slot | — |

### Session grid

| Feature | Tier | Mechanism | Covers |
|---|---|---|---|
| Scenes × slots, one clip per slot, quantised launch | Dream | Launch at next quantum on the tempo map or in seconds | R8 |
| Follow actions (next, previous, random, stop, with probability) | Dream | Rule evaluated at clip end | R8 |
| Scene launch, stop-all, legato launch modes | Dream | Scene-level operations | R8 |
| Grid ↔ arrangement capture (record scene launches into arrangement) | Dream | Launch events become arrangement clips | R8, R23 |
| Follow-action chains as generative structure for ambient | Dream | Weighted graph of slots | R8 |

### Mixer

| Feature | Tier | Mechanism | Covers |
|---|---|---|---|
| Audio, instrument, live-input, return, group tracks | Core | Uniform channel strip | R1 |
| Inserts, pre/post sends, pan, fader, mute, solo | Core | Click-free ramps | R1, R2 |
| Master with true-peak limiter and meters | Core | Limiter after the final fader; unbypassable | R3 |
| Groups with inserts and automation | Dream | Summing bus per group | R4 |
| Pan laws, width, stereo/mono utilities | Dream | Utility device | R1, R11 |
| Cue/pre-listen bus, solo-in-place vs. solo-safe | Dream | Second output terminus | R1 |
| Track freeze/flatten | Dream | Offline render of a track into a clip | R22 |
| Surround/Ambisonics | Maybe-never | — | — |

### Devices and effect chains

| Feature | Tier | Mechanism | Covers |
|---|---|---|---|
| Device contract: typed params, bypass, latency, state | Core | One interface for native, WASM, Faust, WAM | R9 |
| WASM device ABI (init, set-param, stereo in/out, process) | Core | One instance per node; module compiled once | R30 |
| Ducker with sidechain key input | Core | Audio-thread envelope follower | R17 |
| Convolution reverb (generated IR and files) | Core | Convolver device with IR presets | R11 |
| Dattorro plate (from ambient-live) | Core | First WASM device | R11 |
| EQ, filter, delay, compressor, utility | Dream | Native nodes or Faust | R11 |
| kkfonie catalogue: StereoWidener, Tides FDN breathing reverb, Ether reverb with freeze, SpectralDrifter | Dream | Emscripten builds of shared C++ | R11, R30 |
| Instruments: breath/noise synth, sine, sampler, granular | Dream | Instrument tracks; note events | R11 |
| Felt modal piano as a WASM instrument | Dream | Modal bank in a worklet; CPU-budgeted | R11 |
| Racks: parallel chains, macros, dry/wet, key routing | Dream | Chain summing; macro → param curves | R10 |
| Plugin delay compensation | Dream | Latency reported per device; delay lines on other paths | R12 |
| Faust build recipe for stock effects | Dream | Precompiled at library build time | R30 |
| WAM 2.0 host adapter | Dream | WAM node satisfies the device contract | R30 |
| Native VST3/AU inside the browser | Maybe-never | Not possible | — |

### Automation and modulation

| Feature | Tier | Mechanism | Covers |
|---|---|---|---|
| Parameter lanes with breakpoints and curves | Dream | Lookahead writes; cancel-and-hold on override | R13 |
| Breath-phase modulation source | Dream | External phase → any param; the breath guide pattern generalised | R14 |
| LFO (free-running; Tides law), envelope follower, random, macro | Dream | Modulation matrix with depth and polarity | R14 |
| MIDI/Web MIDI/OSC learn | Dream | Mapping table persisted in the score | R15 |
| Paint strokes as automation (ambient-live) | Dream | Stroke → lane on a device param | R13 |
| Automation recording from live gestures | Dream | Touch → breakpoints | R13, R23 |

### Live inputs and monitoring

| Feature | Tier | Mechanism | Covers |
|---|---|---|---|
| Live-input track from any MediaStream | Core | Pass-through track with inserts and sends | R16 |
| WebRTC coach voice as a track and duck key | Core | Remote stream → track; key to ducker | R16, R17 |
| Mic/guitar monitoring with latency budget | Dream | Interactive latency hint; no added buffering | R16 |
| Input metering and clip indicators | Dream | Meter on input | R18 |
| Echo-safe routing (AEC reference) | Core | Music and voice in one context | R16 |
| Latency compensation for recorded input | Dream | Measured round-trip offset applied to clips | R12, R23 |

### Analysis

| Feature | Tier | Mechanism | Covers |
|---|---|---|---|
| Peak/RMS meters | Core | Analyser or worklet | R18 |
| Short-term LUFS on any bus | Dream | K-weighted worklet | R18 |
| Import of server analysis (LUFS, Camelot, BPM, energy, lyrics) | Core | Score carries analysis per clip source | R18 |
| Musical event feed (drop, swell, breakdown, vocal windows) | Core | Time-addressed events on the timeline | R19 |
| Spectrum display data | Dream | FFT frames at UI rate | R18 |
| In-browser key/BPM detection | Dream | Offline analysis on decode | R18 |
| In-browser lyric transcription | Maybe-never | — | — |

### Warping, time-stretch, key matching

| Feature | Tier | Mechanism | Covers |
|---|---|---|---|
| Camelot compatibility helper shared by selection, crossfade, steering | Core | Pure function; parity with server | R21 |
| Time-stretch clip source with tempo sync | Dream | Stretch node; reported latency | R20 |
| Key-matching by pitch shift within a semitone budget | Dream | Camelot distance → shift | R20, R21 |
| Warp markers per clip | Dream | Piecewise tempo map per clip | R20 |
| Beat-matched crossfades between tracks | Dream | Align downbeats using BPM and energy | R19, R20 |

### Recording, bounce, export, stems

| Feature | Tier | Mechanism | Covers |
|---|---|---|---|
| Offline render of a score to WAV/MP3 | Dream | Same graph on an offline context | R22 |
| Stems per track/group | Dream | One render per bus | R22 |
| Record live inputs and master to clips/files | Dream | Recorder device; clips land on the score | R23 |
| Render-equals-live guarantee | Dream | Deterministic scheduling from the score | R22 |
| Session audio recording for Breathwork Live | Dream | Master recorder; consent-gated | R23, R27 |

### Persistence, undo/redo, versioning

| Feature | Tier | Mechanism | Covers |
|---|---|---|---|
| Score document as JSON with schema version | Dream | Source of truth for everything but live input | R24 |
| Undo/redo with attributed operations | Dream | Operation log; author and time per op | R24 |
| Diff and version history of scores | Dream | Structural diff of two scores | R24 |
| Presets for devices, chains, tracks | Dream | Partial score fragments | R24, R31 |
| Cloud sync of scores | Maybe-never | Consumer apps own persistence | — |

### AI and agent control

| Feature | Tier | Mechanism | Covers |
|---|---|---|---|
| Operation catalogue with JSON schemas | Core | Named operations, ranges, result payloads | R25 |
| Intent operations (calmer, stronger, change, more space, softer under voice, extend, advance) | Core | Intent → resolver using analysis | R26 |
| Safety rails: clamps, rate limits, loudness ceiling, no-silence, consent flags | Core | Applied before any op reaches the graph | R27 |
| State snapshot for LLM context | Core | Now/upcoming/levels/vocal windows at a cadence | R28 |
| Operation log feeding transcripts and feedback loops | Core | Every op recorded with author | R24, R27 |
| Controller arbitration (human, agent, automation) | Dream | Priority and override memory per parameter | R29 |
| Musically quantised agent edits | Dream | Apply at next boundary or bar | R27 |
| Generative steering: agent proposes, listener confirms | Dream | Two-step ops with explicit consent | R27 |
| Agent-authored scores (planner writes the whole session) | Dream | Score emitted by an LLM, validated by rails | R22, R25 |
| Agent as co-performer in ambient-live | Dream | Same operations on the paint timeline | R25 |
| Biometric inputs (HRV, breath sensor) as modulation and rails | Maybe-never | — | — |

### Plugin ecosystem

| Feature | Tier | Mechanism | Covers |
|---|---|---|---|
| One-source-two-hosts for kkfonie C++ | Core | Device ABI compiled by Emscripten and JUCE | R30 |
| Device metadata, presets, versioning, lazy load | Dream | Registry in the library | R31 |
| Faust toolchain at build time | Dream | Precompiled WASM per effect | R30 |
| WAM 2.0 host and "make my Faust effect a WAM" | Dream | Adapter | R30 |
| Native VST3/AU via shell | Dream (native tier) | Shell implements the device contract | R35 |
| Plugin marketplace | Maybe-never | — | — |

### UI kit (React)

| Feature | Tier | Mechanism | Covers |
|---|---|---|---|
| Headless hooks (engine, transport, track, param, meter) | Dream | `useSyncExternalStore` over engine snapshots | R32 |
| Knob, fader, device panel from ambient-live, tokenised | Dream | CSS variables replace `al-*` tokens | R32 |
| Mixer strips, device view, arrangement lane, session grid | Dream | Components over the hooks | R32 |
| Waveform and peaks drawing | Dream | Peaks computed at decode | R32 |
| Automation editing | Dream | Breakpoint editor on lanes | R13, R32 |
| Visual = audio parity | Core | Shared formulas | R33 |
| Theming (JAXA-Zen, ambient water/grass) | Dream | Token sets | R32 |

### Platform targets

| Feature | Tier | Mechanism | Covers |
|---|---|---|---|
| Chrome, Firefox, Safari desktop | Core | Web Audio + worklets | R34 |
| iOS Safari/PWA with lock-screen playback | Core | Element output mode, MediaSession | R34 |
| Memory eviction and streaming sources for long sessions | Core | Evict after clip end; element sources | R34 |
| Interruption and sample-rate recovery | Core | Resume on gesture; worklets read global rate | R34 |
| SharedArrayBuffer fast path when isolated | Dream | Ring buffers for meters | R34 |
| Native shell (Tauri/Electron + JUCE host), opt-in per consumer | Dream | Same score and device contracts; Breathwork Live never adopts it | R35 |
| Native iPad/AUv3 shell | Dream | ambient-live's stated hatch | R35 |

### Developer experience

| Feature | Tier | Mechanism | Covers |
|---|---|---|---|
| Headless Node runtime with recording mock context | Core | Mock records AudioParam events | R37 |
| Offline golden renders in CI | Dream | Offline context render compared to WAV | R37 |
| Typed API, docs, examples for both consumer shapes | Core | Published with the package | R37 |
| Semver, changelog, exact pins | Core | Changesets | R37 |
| Performance budgets and glitch counters | Core | Exposed to hosts | R38 |
| Playground app for devices | Dream | Standalone Vite app in the library | R37 |

---

## Approaches

Product-shape approaches: what is built, not how.

### Approach A — Ableton-in-a-library

Build the full DAW-grade engine and UI kit up front: mixer, arrangement, session grid, racks, automation, warping, bounce, React components. Apps become thin shells over a complete instrument.

- **Pros:** Maximum reuse; every future product starts from a finished instrument; the dream realised in one shape.
- **Cons:** The largest surface a solo developer could choose; most of it has no consumer today; carrying cost lands before value.
- **Risks:** Never finishing; API churn across a huge surface with two live consumers; ambient-live's product identity (paint timeline, no grid) pulls against the grid.
- **When best:** If a third product — a real web DAW — is coming soon and both current apps can wait.

### Approach B — Adaptive-music runtime with an agent API (baseline)

Build a mixing engine whose headline is *agent-operable mixing*: the mixer core, transport, clips, live input, ducking, and analysis, with every capability exposed as tool operations with rails and a state snapshot. Timeline, grid, racks, and UI grow only when a consumer pulls.

- **Pros:** Differentiated (no library does this); fits both consumers today (coach as operator, performer as human plus optional agent); bounded surface; Phase 0 of the plan of record already is this.
- **Cons:** Less "DAW" on day one; grid and arrangement UI may lag; the agent API becomes the design centre and constrains naming and shape.
- **Risks:** Over-fitting the API to the breathwork coach; under-serving ambient-live's performance needs if the agent lens dominates.
- **When best:** Solo developer, two consumers, AI-first products — the current situation.

### Approach C — Score, not mixer (challenger, higher upside)

Invert the centre: the product is a declarative, time-addressed *score document* (tracks, clips, device graphs, automation, agent intents), and the mixer is one of two renderers of it, the offline renderer being the other. Every input — coach steering, paint strokes, Camelot selection, planner output — becomes an edit to the score. Analogy: a game engine's scene graph, or the tuin pipeline, which already renders a whole session offline with pydub.

- **Pros:** Undo, versioning, diffs, bounce, regression goldens, and attributed agent edits fall out of one mechanism; the pre-rendered and live breathwork products unify (the same score plays live or renders to MP3); agents edit data, which is what they are good at.
- **Cons:** Abstraction cost; live-input and gesture latency must bypass the edit-then-render loop; risk of over-modelling before the first consumer benefits.
- **Risks:** A second source of truth if apps keep their own timeline models; the score schema churns while both apps depend on it.
- **When best:** When determinism, offline rendering, and agent authorship matter as much as live performance — true for breathwork, partly true for ambient.

### Recommendation

Take B as the spine and adopt C's centre where it is cheap: the score document is the source of truth for arrangement, automation, and device graphs (KD6), while live input and direct parameter gestures stay immediate; A's full UI kit and grid remain Dream tier, pulled by ambient-live when it wants them. This keeps Phase 0 of the plan of record unchanged and gives every later Dream item one mechanism to land on.
