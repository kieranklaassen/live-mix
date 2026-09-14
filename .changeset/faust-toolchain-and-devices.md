---
'@kieranklaassen/live-mix': patch
---

Add the Faust toolchain and two stock Faust devices on the WASM device ABI (U22).

- `scripts/build-faust.sh` builds a pinned Faust 2.88.0 (C++ backend only) from the release tarball and compiles `cpp/faust/*.dsp` to committed C++ (`cpp/faust/generated/`) and generated `ParamSpec` tables (`src/dsp/devices/faust/`); CI job `faust` regenerates and diffs them like the `wasm` job does for the artefacts.
- `zita-rev1.wasm` (`re.zita_rev1_stereo`: pre-delay, crossover, low/mid decay, damping, mix) and `limiter-1176.wasm` (`co.limiter_1176_R4_stereo`: input gain, output gain) ship next to `dattorro.wasm`; `createZitaReverb`, `createLimiter1176`, their `*_DEVICE` definitions and `*_PARAMS` tables are exported from `@kieranklaassen/live-mix/dsp`.
- Native and WASM harnesses cover the parameter contract, impulse/step behaviour, param ranges and stability. Integration notes and licence position in `docs/faust-devices.md`.
