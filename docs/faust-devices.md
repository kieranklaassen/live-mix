# Faust devices

Stock effects written in [Faust](https://faust.grame.fr) ship as WASM devices
on the same C ABI as the hand-written C++ ones (`cpp/common/device_api.h`).
The worklet host does not know which devices came from Faust: every module
exports the same eight functions, imports nothing, and runs one static
instance in fixed memory. Faust itself runs only at library build time; no
compiler, library or runtime reaches a consumer.

## Pipeline

```
cpp/faust/<name>.dsp
   │  scripts/build-faust.sh   (Faust 2.88.0, pinned, built from the release tarball)
   ├─► cpp/faust/generated/<name>.h        generated C++ class, committed
   └─► src/dsp/devices/faust/<name>.ts     generated ParamSpec table, committed
cpp/faust/<name>.device.cpp                20-line hand-written ABI shim
   │  scripts/build-wasm.sh   (Emscripten 4.0.15, same flags as every device)
   └─► src/dsp/wasm/<name>.wasm            committed artefact, copied to dist/wasm/
src/dsp/devices/<name>.ts                  hand-written defineWasmDevice() + factory,
                                           same shape as dattorro.ts
```

Both generation steps are reproducible and gated in CI: job `faust` rebuilds
the pinned compiler (cached), reruns `build-faust.sh` and fails on any diff in
`cpp/faust/generated` or `src/dsp/devices/faust`; job `wasm` rebuilds every
`.wasm` and compares bytes, exactly as for Dattorro.

## Why Faust → C++ → the existing ABI

Faust can emit WebAssembly directly (`faust2wasm`, `@grame/faustwasm`), but
that output has its own export set (`compute`, `setParamValue`, …), imports
`Math` functions from JavaScript and lays out memory its own way. Hosting it
would have meant a second worklet processor or JS glue in the audio thread.
Compiling Faust to C++ and wrapping that class with `device_api.h` keeps one
device-agnostic processor and reuses `build-wasm.sh`, the native test harness
and the CI reproducibility gate unchanged.

The npm build of the compiler (`@grame/faustwasm`) ships without the C++
backend, so `build-faust.sh` builds the native compiler from the pinned
release tarball instead: C++ backend only, no LLVM, about a minute on four
cores, verified by SHA-256, installed under `tmp/faust-<version>/`. The
compiler is configured with `SELF_CONTAINED_LIBRARY=ON` and only its bundled
`libraries/` are on the import path, so the output cannot depend on a Faust
that happens to be installed on the machine.

## Generated code shape

`build-faust.sh` calls the compiler with

```
-lang cpp -nvi -ftz 1 -scn FaustDsp -ns livemix::faust -cn <ClassName>
```

- `-nvi` removes `virtual`: the DSP is a plain value member with no vtable,
  and `clone()` (the one method that would allocate) is dropped at link time.
- `-ftz 1` flushes denormals in every recursive signal with a
  `fabs(x) > FLT_MIN` test; WASM has no hardware flush-to-zero.
- `-scn FaustDsp -ns livemix::faust` make the class derive from the empty
  stand-in in `cpp/faust/common/faust_runtime.h`, which also provides `UI`
  and `Meta`. None of Faust's architecture files are used.

`cpp/faust/common/faust_device.h` hosts the class behind the stereo bus
contract shared with the hand-written devices (2048-frame fixed buffers,
input consumed once, allocation-free `process()`), and turns Faust widgets
into `device_set_param` ids.

### Parameter ids

Faust exposes parameters through `buildUserInterface()`. The `UI` stand-in
records every active widget (`hslider`, `vslider`, `nentry`, `button`,
`checkbox`) in declaration order; the position is the parameter id.
`scripts/faust-params-to-ts.mjs` derives the TypeScript table from the
compiler's `-json` description of the same tree, so the C++ ids and the
`ParamSpec` ids always come from one source, the `.dsp`. Conventions:

- Prefix labels with `[0]`, `[1]`, … so the order is explicit.
- The label is the display name; the TypeScript key is its camel-case
  (`"Pre-delay"` → `preDelay`, `"Input gain"` → `inputGain`).
- `[unit:ms]` becomes `unit`; `[scale:log]` becomes `taper: 'log'`.
- `set_param` clamps to the declared `[min, max]` and maps `NaN` to the
  default, so a stray value can never push a slider out of its domain.
- Smooth anything audible in the `.dsp` (`si.smooth(ba.tau2pole(0.005))`, a
  5 ms time constant); values arrive unsmoothed over the message port. Note
  that a float32 one-pole never reaches its target exactly: a `1 - mix` dry
  gain settles around −100 dB rather than 0.

## Devices

| Device         | Artefact                     | Source                                  | Params (id order)                                                                                                                                             |
| -------------- | ---------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `zita-rev1`    | `zita-rev1.wasm` (17.7 KB)   | `re.zita_rev1_stereo`, `fsmax = 96 kHz` | `preDelay` 20–100 ms (60), `crossover` 50–1000 Hz log (200), `lowDecay` 1–8 s (3), `midDecay` 1–8 s (2), `damping` 1.5–23.52 kHz log (6000), `mix` 0–1 (0.35) |
| `limiter-1176` | `limiter-1176.wasm` (6.2 KB) | `co.limiter_1176_R4_stereo`             | `inputGain` 0–40 dB (0), `outputGain` −24–24 dB (0)                                                                                                           |

`zita-rev1` applies `dry*(1-mix) + wet*mix`, the Dattorro device's law. Its
delay lines are sized for 96 kHz (about 1.9 MB of static state inside the 4 MB
module memory); higher context rates run but clamp the longest delays.

`limiter-1176` keeps the library's fixed 1176 "R4" law: 4:1 above −6 dB,
0.8 ms attack, 0.5 s release, level detected on `|L| + |R|`. Input gain
drives that threshold like the hardware's INPUT knob; output gain is make-up.
A full-scale sine in both channels sits 12 dB over the detector's threshold
and comes out 9 dB down.

From `@kieranklaassen/live-mix/dsp`: `createZitaReverb(ctx, options)` and
`createLimiter1176(ctx, options)` return a `WasmDevice` over the committed
artefact, exactly like `createDattorroReverb`; `ZITA_REV1_DEVICE` /
`LIMITER_1176_DEVICE` are the definitions and `ZITA_REV1_PARAMS` /
`LIMITER_1176_PARAMS` the tables.

## Tests

- Native (`pnpm test:native`): `cpp/test/zita_rev1_test.cpp`,
  `cpp/test/limiter_1176_test.cpp` compile the generated header with the
  system compiler and check the parameter contract (labels, ranges, defaults,
  clamping), the bus contract (pass-through, input cleared), impulse and step
  behaviour (tail exists and decays; T60 tracks the decay params; onset moves
  with pre-delay; 4:1 law within 0.4 dB; attack lets the onset through;
  release recovers), sample-rate independence (44.1/48/96 kHz) and stability
  (30 s at maximum decay or 40 dB of drive: bounded, no NaN).
- WASM (`pnpm test`): `src/dsp/__tests__/{zita-rev1,limiter-1176}-wasm.test.ts`
  instantiate the committed artefacts in Node with an empty import object and
  assert the same laws, so the browser build is held to the native numbers.

## Adding a Faust device

1. Write `cpp/faust/<name>.dsp`: stereo in and out, `[N]`-prefixed labels,
   smoothing on audible parameters, `declare name "<ClassName>"`.
2. Add `build_device <name> <ClassName>` to `scripts/build-faust.sh` and run
   `pnpm build:faust` (the first run builds the compiler into `tmp/`).
3. Write `cpp/faust/<name>.device.cpp` by copying `zita-rev1.device.cpp` and
   changing the include and class name.
4. Add `build_device <name> cpp/faust/<name>.device.cpp` to
   `scripts/build-wasm.sh`, run `pnpm build:wasm` (Emscripten 4.0.15) and
   commit `src/dsp/wasm/<name>.wasm`. Check the module memory still fits:
   `INITIAL_MEMORY` is 4 MB for every device.
5. Add a native harness under `cpp/test/` and a block to
   `scripts/test-native.sh`; add a WASM test next to the existing ones and a
   row to `src/dsp/__tests__/device-factories.test.ts`.
6. Write `src/dsp/devices/<name>.ts` (definition + factory, copy
   `zita-rev1.ts`), export it from `src/dsp/index.ts`, add a changeset.

To move to a newer Faust, change `FAUST_VERSION` and `FAUST_TARBALL_SHA256`
in `scripts/build-faust.sh`, rerun it, review the diff in
`cpp/faust/generated`, rebuild the `.wasm` files and commit everything
together; the CI cache key follows the script's hash.

## Licences

- The Faust compiler is GPL. It is a build tool here: nothing of it is
  linked into or shipped with the library.
- The Faust libraries our devices import are LGPL-2.1+ (GRAME sections:
  `basics`, `signals`, `maths`, `delays`, `routes`, `platform`) with the
  libraries' explicit **exception to the LGPL**: "you may create a larger
  FAUST program which directly or indirectly imports this library file and
  still distribute the compiled code generated by the FAUST compiler … under
  your own copyright and license." The Zita-Rev1, compressor and filter
  functions are Julius O. Smith III's, under the MIT-style STK-4.3 licence.
- The `.dsp` sources, the shims and the generated C++ and TypeScript are
  therefore live-mix's and carry the repository's MIT licence. Each generated
  header keeps the library credits Faust emits in `metadata()`.
