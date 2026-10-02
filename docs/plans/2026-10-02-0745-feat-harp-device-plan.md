---
title: Harp Device - Plan
type: feat
date: 2026-10-02
artifact_contract: ce-unified-plan/v1
product_contract_source: ce-plan-bootstrap
execution: code
---

# Harp Device - Plan

## Goal Capsule

- Objective: someone browsing live-mix's instruments can load "Harp" and play a concert harp (or a koto or guzheng) whose notes ring on after the key is let go, bloom into each other and sound like the instrument from C2 to C6, with every claim about its sound backed by a measurement in its harness.
- Means: one spec device `harp` built on the kit's plucked-string core, one string per pitch (KTD1, KTD2).
- Authority: `docs/recipes/adding-a-spec-device.md` for how a spec device is written; the settled decisions below; the research brief's sections 0, 5 and 6 for what the instrument is. Where the code forces a change from the research, the change is recorded in this plan's Assumptions and in the manifest's `origin.note`.
- Stop conditions: a settled decision turns out not to work; the device cannot meet 5 % of real time in WASM with eight held notes without `experimental: true`; the kit string core has a defect that cannot be worked round from the device directory.
- Execution profile: one branch (`device/harp`), no remote. The work ends as local commits; nothing is pushed.
- Nobody can listen in this environment. Every quality claim is a measurement; names and descriptions are claims for a human to check by ear later.

## Product Contract

### Summary

Add a spec device `harp` ("Harp"): a bank of undamped plucked strings, one per pitch, over a shared soundboard, with three string types (Harp, Koto, Guzheng), ten parameters, at least five device presets, and five factory presets. It ships with a native harness that measures the traits a listener knows the instrument by, its `.wasm`, and its generated files.

### Problem Frame

live-mix has struck, bowed and synthesised instruments but no plucked instrument whose notes overlap: Bow's Pluck mode damps at key-up, Modal Bells' plucked bars are inharmonic, Felt Piano has dampers. The harp looping into a delay is one of the defining ambient sounds of the last decade, and its identity is exactly what none of those have: nothing stops a string ringing, the next note does not cut the last, the other strings ring faintly in sympathy, and bass strings ring many times longer than treble ones. The koto and guzheng share the mechanism and add a plectrum attack and bends that only go up.

### Requirements

Instrument behaviour

- R1. One string per pitch: a note keeps ringing after its key is released (no dampers), and playing a pitch that is still ringing re-plucks the same string after a brief stop, rather than starting a second voice.
- R2. Enough strings that a glissando does not cut itself off: at least 24 ring at once, and when all are in use the quietest string is taken, fading over a couple of milliseconds.
- R3. Decay depends on register: bass strings ring several times longer than treble ones (the fundamental at C2 at least five times as long as at C6; C7 under a second at the default Decay), and every string darkens as it dies.
- R4. Harp type: a soft finger-pad pluck near the middle of the string (weak even harmonics, low onset centroid at soft Touch), harmonic partials (no audible stiffness).
- R5. Koto and Guzheng types: a bright plectrum attack with a short click, a bend that presses the note sharp after the pluck and never goes below the note, and a pitch that starts a few cents sharp on a hard pluck and settles. Guzheng rings longer and brighter than Koto and its partials are measurably stretched.
- R6. Sympathetic halo: strings that are already ringing pick up energy from a new note where they share partials, and the halo can never run away at any setting.
- R7. A shared soundboard colours the strings (broad for the harp, more hollow for the long zithers), and strings are spread across the stereo field by pitch while staying mono-compatible.
- R8. A Sweep control rolls notes that arrive together into a glissando, low to high, evenly over the set time.

Surface

- R9. At most ten parameters including `volume`; every one has a plain-language `description`; a parameter that only applies from the next pluck, or to some types, says so.
- R10. At least five device presets named in plain words (no brand or artist names); the first is the default patch.
- R11. Five factory presets in `src/dsp/factory/presets/harp.ts` exported as `HARP_PRESETS`, each the instrument plus one to four existing effects, with ids and names unique across the bank, category `string` and preview `keys`.

Engineering bar

- R12. Tuning within ±3 cents from C2 to C6 at 44.1, 48 and 96 kHz, for all three types, at soft and hard Touch.
- R13. The recipe's rules hold: no allocation, `init` resets everything bit-identically, smoothed audible parameters, block-size independence, sleep to exact zero, denormals flushed, bounded under 96 stacked notes, bad input survivable, output through `kit::soft_clip`, storage sized for 96 kHz.
- R14. Levels: one note at gain 0.7 peaks between -24 and -10 dBFS at the default volume, at gain 0.8 between about -22 and -16 dBFS; ten notes struck together stay under the clip knee region.
- R15. No clicks from voice stealing, re-plucking, note-off damping, or moving Body or Volume while sounding; out-of-series energy on a high note at least 50 dB down.
- R16. Eight held notes cost under 5 % of real time in the WASM smoke (target under 3 %), without `experimental: true`.

### Key Decisions

- KD1. String types are Harp, Koto and Guzheng only (session-settled: user-directed — chosen over also building the Zither and Hammered Dulcimer types of research section 7: a separate Zither instrument is being built elsewhere). Governs R4, R5.
- KD2. Let-ring voice logic: one string per key that keeps ringing after release, re-pluck on the same string (session-settled: user-directed — chosen over conventional note-off damping with a small voice pool: the harp has no dampers and overlap is its identity). Governs R1, R2.
- KD3. At most ten parameters including `volume`; factory category `string` for now with `plucked` wanted when it exists, preview phrase `keys` (session-settled: user-directed — chosen over a larger parameter surface or another category: the owner asked for "super simple"). Governs R9, R11.

### Scope Boundaries

- No Zither or Hammered Dulcimer types, no double courses, no hammer excitation.
- No one-sided vibrato control and no scale-true (pentatonic tuning table) sweep: both are in the research as options, and neither fits in ten knobs. The Bend covers the press; vibrato is left to a later revision.
- No always-open sympathetic string bank: the halo comes from strings that have been played and still ring. The existing `sympathetic` effect can follow the device for more, and one factory preset does that.
- No edits to `cpp/kit/**`, `cpp/test/support/**`, `scripts/**`, other devices, `docs/devices.md`, `docs/factory.md`, `CHANGELOG.md`, `.changeset/**`, `package.json`.

### Success Criteria

- The inner loop `CXX=g++ bash scripts/dev-device.sh harp` passes: native harness, WASM build, smoke under the cost budget.
- The harness holds at least eight behaviour measurements beyond conformance, each of which would fail if its trait were missing.
- `pnpm vitest run src/react/__tests__/param-descriptions.test.ts src/dsp/factory/__tests__/factory.test.ts`, `pnpm typecheck`, and prettier and eslint on the written files pass.

## Planning Contract

### Key Technical Decisions

- KTD1. Build every string on `kit::PluckedString<4096>` and `kit::PluckExciter`; do not edit the kit (session-settled: user-directed — chosen over writing a new delay-loop string in the device or editing the kit: the core is section 0 of the research and is already measured in `cpp/test/kit_test.cpp`). 4096 samples hold 23.5 Hz at 96 kHz. Anything the core lacks is written in `cpp/devices/harp/`.
- KTD2. Strings are keyed by pitch, not by host note id. `note_on` looks for a string already tuned within a quarter tone of the frequency (ringing or waiting to be plucked) and re-plucks it; otherwise it takes an idle string, else the quietest string with no pluck waiting. `note_off` finds the string by the note id it last carried. This is what makes R1 hold when a host sends a fresh id for every note. 32 strings (0.5 MB of lines, inside the default 4 MB).
- KTD3. A `kit::DcBlocker` follows the string sum on each channel (session-settled: user-directed — chosen over no DC blocking: with the pluck comb off the string carries DC that dies with the note). The comb is always on here (Pluck never reaches 0), so the blocker is a safety net and also keeps the halo bus free of DC.
- KTD4. Register map per type, a choice and not a measurement of any instrument: the fundamental's T60 follows a power law of pitch (`harp: 12 s × (32.7 / f)^0.72`, giving about 7 s at C2, 2.7 s at C4, 1 s at C6; koto about 2.2 s at C4 and guzheng about 4.5 s at C4 with a gentler slope), scaled by Decay; the high-partial decay is a fixed fraction of it per type (guzheng the brightest). Read at the pluck, so Decay "applies from the next note": redesigning 32 loss filters on every knob step would cost more than the strings.
- KTD5. Re-pluck and steal without a click or a buffer walk per tick: each string has an output gain that ducks over 10 ms (re-pluck, to about -10 dB: the finger landing) or 3 ms (steal, to zero); at the bottom of the duck the string state is scaled once with `damp()` (or `reset()` for a steal), the gain returns to one in the same sample, and the exciter strikes. The output is continuous across that sample by construction.
- KTD6. The halo is true feedback, kept stable by a bound instead of a fixed level. Each ringing string receives `g × D(sum of the other strings)`, one sample late, where `D` is a per-string DC blocker (the loop's 0 Hz resonance must not be fed). The research's "-35 dB into every string" is unstable: a string's resonance gain is `P = 1 / (1 - G)`, several hundred, so the coupling loop exceeds unity. Instead `g = Halo × 0.45 / ΣP` over the strings ringing now, with `P` from each string's pitch and decay; the loop matrix's spectral radius is then at most `g × (ΣP + max P) ≤ 0.9`, so it cannot grow. The cost is honest: the halo each string receives falls as more strings ring. `g` is smoothed, and recomputed on the control clock.
- KTD7. Bends and pitch settling use `Tuning::Interpolated`; held pitches use `Tuning::Allpass`. The mode is fixed when a string is taken (Interpolated when the type is Koto or Guzheng, or Bend is above zero) and never switched while it rings, because the kit's interpolated delay glides from wherever it was. Bend is an S-curve starting 80 ms after the pluck and taking about 220 ms, upward only; settling adds a few cents at the pluck, scaled by velocity squared, falling with a 120 ms time constant (Koto and Guzheng only). Both move the string on the control clock through `set_frequency`. A re-pluck restarts both at the bottom of its duck, so what is left of a bent note falls back to the open pitch while it is 10 dB down, as when the hand lets go before the next pluck.
- KTD8. Sweep schedules, it does not delay audio: notes that arrive between two `process` calls are a batch, sorted by pitch at the start of the next block and given pluck countdowns `i × T / (n - 1)` in samples. With Sweep at zero a batch of several notes still gets a hashed 0 to 4 ms scatter so ten plucks do not land on one sample; a single note plucks at once. Scheduling counts samples from where the notes arrived, so it is block-size independent.
- KTD9. Per-note variation (pluck position ±3 %, level ±1 dB, scatter) comes from a hash of the pitch and that pitch's own pluck count, not from one shared generator. A note then sounds the same whatever else is playing, which keeps `init` deterministic and lets the harness measure the halo as the difference between a chord and the sum of its notes.
- KTD10. Touch acts on the excitation at the pluck (pick low-pass rising with Touch and velocity, click noise by type). The plectrum types also get a shared high shelf after the strings, because an ideal pluck's 1/n spectrum cannot reach the onset brightness the research asks of a koto (centroid above 2 kHz at C4). The shelf gain belongs to the type and glides when the type changes.
- KTD11. Soundboard: the mid signal through six `kit::Svf` band-passes (a broad set from 150 Hz to 2 kHz for the harp, a more hollow set weighted to 150 to 500 Hz for the zithers), mixed against the direct strings by Body. The resonators are mono and added to both channels; strings are panned by pitch with an equal-power law over ±0.5, low notes left. That keeps the mid above the side and the mono sum within 1 dB.
- KTD12. A string is freed when its level follower falls under about -100 dB re a full pluck; the output then reaches exact zero through the gate. This bounds the default patch's tail at roughly 1.7 × T60 of the lowest ringing string, so the conformance `tail_seconds` is set to cover a 55 Hz string at Decay 1.

### High-Level Technical Design

Directional, not a specification:

```
note_on ─► find or take a string ─► batch ─► (sorted, countdown) ─► duck ─► damp/reset ─► strike
per string:  exciter ─► PluckedString (comb, loss, stiffness, tuning) ─► × duck gain ─► pan ─► L, R
                 ▲ g × DcBlocker(bus − own)        (bus = sum of string outputs, one sample late)
shared:      L, R ─► DcBlocker ─► plectrum shelf ─► direct ──────────────┐
             (L + R)/2 ─► 6 band-passes (soundboard) × Body ─────────────┼─► × volume ─► soft_clip
control clock (32 samples): bend and settle per string, level followers, freeing, ΣP and g, body glide
```

Parameters, in id order: `strings` (Harp, Koto, Guzheng), `pluck` (0.04 to 0.5), `touch` (0 to 1), `decay` (0.25 to 4, log), `damp` (0 to 1), `halo` (0 to 1), `sweep` (0 to 1.5 s), `bend` (0 to 200 ct), `body` (0 to 1), `volume` (dB).

### Assumptions

- Hosts may send a new note id for every note; pitch is the string's identity (KTD2). Two keys within a quarter tone share a string.
- Notes of one chord reach the device between the same two `process` calls (true of `renderPatch`; assumed of the worklet). A chord split across blocks is rolled as two batches.
- Low strings pan left and high strings right; the research says "as heard from the player's seat" without a direction.
- Bend is allowed on the Harp type too (a pedal harp cannot bend, but a knob that does nothing on the default type is worse); settling is not, since gut and nylon harp strings are plucked softly.
- Figures the research marks "likely" or "unsure" (decay by register, koto and guzheng decay and body resonances, bend timing, settle depth, guzheng inharmonicity) are choices and are named as such in `origin.note`.
- The Sweep spreads a batch over the whole time, so two notes land a full Sweep apart, as the research's acceptance check words it.
- Damp reshapes a string's decay at key-up with `set_decay`; at zero it does nothing at all, so a released note is bit-identical to a held one.

### Risks & Dependencies

- Halo stability rests on `P` being a true upper bound of each string's resonance gain. The interpolated tuning's Hermite read is not exactly unity gain; if the harness's maximum-halo stability check fails, lower the 0.45 margin before anything else.
- CPU: 32 ringing strings cost about four times the eight-note smoke. If eight notes come in over 3 %, drop to 24 strings or take the level follower to the control clock.
- `set_decay` at key-up steps the loss filter; if the note-off click check fails, cross-fade through the duck gain instead.
- The WASM must come from the pinned Emscripten at `/home/claude/emsdk`.

### Sources & Research

- Research brief (outside the repo): `strings.md` sections 0 (shared plucked-string core), 5 (concert harp) and 6 (koto and guzheng), with their acceptance checks. Its physics rests on general knowledge; URLs there were found by title only.
- `docs/recipes/adding-a-spec-device.md`; `cpp/kit/string.h` and `test_plucked_string` in `cpp/test/kit_test.cpp`; `cpp/devices/string-machine/`, `cpp/devices/tine-piano/`, `cpp/test/bowed_string_test.cpp` (pitch and ring-time measurement idiom); `cpp/test/support/test_kit.h`; `docs/factory.md` and `src/dsp/factory/presets/string-machine.ts`.
- No learnings store exists in this repo (`docs/solutions/` is absent). No external research was run: the kit core and the brief cover the method.

## Implementation Units

### U1. Manifest and device skeleton

- Goal: `cpp/devices/harp/device.json` with the ten parameters, descriptions, presets and `origin`, and a `Harp` class that passes conformance with plain let-ring strings.
- Requirements: R1, R2, R3, R9, R10, R13, R14.
- Files: `cpp/devices/harp/device.json`, `cpp/devices/harp/harp.h`, generated `cpp/devices/harp/params.gen.h`, `cpp/devices/harp/device_api.gen.cpp`, `src/dsp/devices/harp.gen.ts`.
- Approach: follow `cpp/devices/string-machine/string_machine.h` for the class shape. String struct with the kit string, exciter, pan gains, duck gain, level follower, note id, held flag, pending pluck. Pitch-keyed allocation (KTD2), register map (KTD4), duck and strike (KTD5), freeing (KTD12), DC blockers (KTD3), volume smoother, `soft_clip`, `IdleGate`. Voice gain set by measurement for R14.
- Test Scenarios: conformance (`check_instrument`) at 48 kHz with `tail_seconds` sized by KTD12; one note at gain 0.7 and 0.8 inside the level windows; ten notes struck together peak under 0.9.
- Verification: `CXX=g++ bash scripts/dev-device.sh harp --native-only`.

### U2. Types, touch, soundboard and stereo

- Goal: the three types sound different in the ways R4, R5 and R7 name.
- Requirements: R4, R5 (attack, decay, stiffness), R7, R15.
- Files: `cpp/devices/harp/harp.h`.
- Approach: per-type constant table (decay law, high-partial fraction, pick range, click, stiffness, shelf, settle, body mode set). Touch and velocity to pick cutoff (KTD10). Soundboard and pan (KTD11), body modes gliding on the control clock.
- Test Scenarios: Pluck 0.5 leaves even harmonics at least 12 dB under adjacent odd ones at onset; C4 onset centroid under 1.5 kHz at minimum Touch on Harp and above 2 kHz on Koto at a plectrum setting; a pluck at 1/5 leaves partial 5 at least 15 dB under its neighbours; guzheng T60 at least 1.5 times koto's and at least 6 dB more energy above 3 kHz at 500 ms; guzheng partial 8 sharp by more than 4 cents while Harp's is within 3; low and high notes lean to opposite sides, mono sum loses under 1 dB, mid above side; Body adds level in the soundboard band.
- Verification: native harness.

### U3. Halo

- Goal: sympathetic bloom that is measurable and cannot grow.
- Requirements: R6.
- Files: `cpp/devices/harp/harp.h`.
- Approach: KTD6. Bus is last sample's sum of string outputs; per-string DC blocker on `bus − own`; `ΣP` and `g` on the control clock, `g` smoothed.
- Test Scenarios: with C3 ringing, striking C4 leaves a residual (chord minus the two notes alone) at 261.6 Hz that is within a stated window below the C4 note at Halo 1, at least 20 dB lower for a pitch sharing no partial with C3, and below -100 dB at Halo 0; with Halo and Decay at maximum and every string ringing, the level in successive seconds never rises after the last pluck; Halo does not change a lone note's decay time by more than 10 %.
- Verification: native harness.

### U4. Bend, settling and Sweep

- Goal: the long zithers' gestures and the glissando.
- Requirements: R5 (bend, settle), R8, R12.
- Files: `cpp/devices/harp/harp.h`.
- Approach: KTD7 and KTD8.
- Test Scenarios: Koto with Bend 100: the pitch track never falls more than 3 cents below the note, starts moving 50 to 120 ms after onset, takes 100 to 250 ms from 10 % to 90 %, ends at +100 ±5 cents, with out-of-series energy 50 dB down during the bend; a hard koto pluck starts at least 3 cents sharp and is within 3 cents by 500 ms, a soft one starts within 2; an eight-note chord with Sweep 0.8 gives eight onsets in pitch order, evenly spaced over 0.8 s ±10 %; tuning within ±3 cents for all three types at C2, C3, C4, C5, C6 at 44.1, 48 and 96 kHz, at soft and hard Touch.
- Verification: native harness.

### U5. Harness for the identity traits

- Goal: `cpp/test/harp_test.cpp` measuring what makes it this instrument, beyond the scenarios above.
- Requirements: R1, R2, R3, R13, R15, R16.
- Files: `cpp/test/harp_test.cpp`.
- Approach: measurement helpers in the file, in the manner of `cpp/test/bowed_string_test.cpp` (`fine_pitch`, `bin_level`, `ring_time`).
- Test Scenarios: let ring (level 1 s after key-up within 1 dB of the held note at Damp 0; at Damp 1 at least 30 dB down within half a second); register decay (C2 at least five times C6, C7 under 1 s, T60 within ±15 % of the map at three pitches, Decay scales it); the spectral centroid falls over the first second; overlap (twenty notes in two seconds all measurable a second later); re-pluck 200 ms later raises the peak by less than 3 dB and uses one string; `max_step` under a pile of stolen strings, a re-pluck, a damped note-off, and Body and Volume swept while sounding, each against the step of a plain note; out-of-series energy at C6 and C7 at least 50 dB down; ragged blocks give the same audio as 128-frame blocks; cost with eight held notes and with every string ringing.
- Verification: `CXX=g++ bash scripts/dev-device.sh harp` (native, `.wasm`, smoke).

### U6. Presets, factory presets and shared lists

- Goal: the device in the bank.
- Requirements: R10, R11, R14.
- Files: `cpp/devices/harp/device.json`, `src/dsp/factory/presets/harp.ts`, `src/dsp/factory/presets/index.ts`, `src/dsp/wasm/harp.wasm`, files `node scripts/gen-devices.mjs` regenerates.
- Approach: at least five device presets (harp, glissando, near the soundboard, long ring, koto, rising koto, guzheng cascade). Five factory presets with existing effects (an echo, halls, the `sympathetic` effect, a shimmer), levels tuned on the bench in `docs/factory.md`.
- Test Scenarios: Test expectation: none of its own — the factory and description suites in the Verification Contract cover it.
- Verification: the vitest, typecheck, prettier and eslint commands below.

## Verification Contract

```bash
source /home/claude/emsdk/emsdk_env.sh >/dev/null 2>&1; CXX=g++ bash scripts/dev-device.sh harp
node scripts/gen-devices.mjs
pnpm vitest run src/react/__tests__/param-descriptions.test.ts src/dsp/factory/__tests__/factory.test.ts
FACTORY_REPORT=presets FACTORY_DEVICE=harp pnpm vitest run src/dsp/factory/__tests__/report.test.ts
pnpm typecheck
npx prettier --check <written files> && npx eslint <written ts files>
```

Never `scripts/test-native.sh` or the whole `pnpm test`. The smoke's cost line is recorded verbatim; near the limit it is re-run and the best reported.

## Definition of Done

- Every unit's scenarios are assertions in `cpp/test/harp_test.cpp` and pass, with at least eight behaviour measurements beyond conformance.
- The Verification Contract's commands pass in the clone.
- `device.json` has a description on every parameter, at least five presets, and an `origin.note` naming what is modelled, what is simplified, which figures are choices, and that it is not a sample or circuit emulation.
- No experiment code is left in the diff; nothing outside the allowed paths is edited.
- The work is committed on `device/harp`; nothing is pushed.
