# Recipe: adding a C++ or Faust device

The F3 flow from the plan: Kieran wants a kkfonie effect in a session; the
C++ is compiled against the device ABI, the `.wasm` and the parameter table
land in the library, both apps list the device with a generated panel, the
JUCE build is unchanged. One DSP source, two hosts (KD3, KTD5, KTD10).

For Faust the C++ is generated: follow [faust-devices.md § Adding a Faust device](../faust-devices.md#adding-a-faust-device)
for the `.dsp` → C++ step, then continue from step 3 here.

## 0. Rules the DSP must obey

- `process()` allocates nothing; state is static or allocated in `init`.
- No exceptions, no RTTI (`-fno-exceptions -fno-rtti`), no `<iostream>`.
- Flush denormals in software in every feedback path — WASM has no
  flush-to-zero, and a Freeverb tail otherwise idles in a −116 dBFS limit
  cycle forever (Ether's port measured it). `flush_denormal` is in
  `cpp/common/dsp_util.h`.
- Parameter changes are smoothed inside the device (5 ms ramps are the house
  rule), because the host sends a bare value over the `MessagePort`.
- Stereo in, stereo out, `kMaxBlockFrames` ≥ 2048; the worklet feeds 128-frame
  blocks.
- Keep the origin source byte-identical where you can and put the adaptation
  in a separate `*_device.{h,cpp}`; record the origin files and their SHA-256
  in `device.json` so the copy can be audited against kkfonie.

## 1. The C++ — `cpp/devices/<name>/`

```
cpp/devices/tilt-eq/
  TiltEq.h / TiltEq.cpp       the DSP (copied from kkfonie unchanged, or new)
  tilt_eq_device.h / .cpp     livemix::TiltEqDevice: params enum, ramps, in/out buffers, process(frames)
  device_api.cpp              the flat C ABI over one static instance
  device.json                 id, name, wasm path, params path, source { repository, commit, files[{ path, copiedTo, sha256 }] }
```

The device class owns four `float[kMaxBlockFrames]` buffers and exposes
`init(sample_rate)`, `set_param(Param, float)`, `in_left/right()`,
`out_left/right()`, `process(frames)`. `device_api.cpp` is boilerplate — copy
`cpp/devices/stereo-widener/device_api.cpp` and rename the type:

```cpp
extern "C" {
void   device_init(float sample_rate, int max_block_frames) { g_device.init(sample_rate); }
void   device_set_param(int id, float value) { g_device.set_param(static_cast<livemix::TiltEqParam>(id), value); }
float* device_in_left(void)  { return g_device.in_left(); }
float* device_in_right(void) { return g_device.in_right(); }
float* device_out_left(void)  { return const_cast<float*>(g_device.out_left()); }
float* device_out_right(void) { return const_cast<float*>(g_device.out_right()); }
int    device_max_block_frames(void) { return livemix::TiltEqDevice::kMaxBlockFrames; }
void   device_process(int frames) { g_device.process(frames); }
}
```

Instruments additionally export `device_note_on(id, frequency, gain)` and
`device_note_off(id)` (Felt is the precedent: `EXTRA_EXPORTS` in the build
script, `NoteDevice` on the TypeScript side).

## 2. The native harness — `cpp/test/<name>_test.cpp`

A parity test with the system compiler, no browser: feed a known signal,
compare against the origin (a recorded golden, an analytic expectation, or
the kkfonie class run side by side), and assert the invariants that matter
(silence in → exact zero out after the tail; no NaN; a param sweep is
click-free). Add its compile line to `scripts/test-native.sh`; `pnpm
test:native` runs it. Measure CPU here too: the harness prints µs per 128
frames at 48 kHz, which `docs/devices.md` records against the 5 % gate.

## 3. The parameter table — `src/dsp/devices/<name>.ts`

```ts
import { type ParamSpec } from '../../core/params'
import { defineWasmDevice, WasmDevice, type WasmDeviceOptions } from '../WasmDevice'

// Ids must match the C++ enum. Keep in sync.
export const TILT_EQ_PARAMS = {
  tilt: { id: 0, name: 'Tilt', min: -6, max: 6, default: 0, taper: 'linear', unit: 'dB' },
  pivotHz: { id: 1, name: 'Pivot', min: 200, max: 4000, default: 1000, taper: 'log', unit: 'Hz' },
} as const satisfies Record<string, ParamSpec>

export type TiltEqParamName = keyof typeof TILT_EQ_PARAMS

export const TILT_EQ_DEVICE = defineWasmDevice({
  id: 'tilt-eq',
  // Static literal so Vite can rewrite it to a hashed asset URL at build time.
  wasm: () => new URL('../wasm/tilt-eq.wasm', import.meta.url),
  params: TILT_EQ_PARAMS,
  // latencySamples: (sampleRate) => … for lookahead/FIR stages (PDC reads it)
})

export type TiltEq = WasmDevice<typeof TILT_EQ_PARAMS>

export function createTiltEq(
  context: BaseAudioContext,
  options: WasmDeviceOptions<typeof TILT_EQ_PARAMS> = {},
): Promise<TiltEq> {
  return WasmDevice.create(context, TILT_EQ_DEVICE, options)
}
```

The `wasm` path is `../wasm/<name>.wasm` on purpose: it resolves from
`src/dsp/devices/` in the source tree and from `dist/dsp/` in the build.

## 4. Build the artefact and commit it

```sh
# add a build_device block to scripts/build-wasm.sh
build_device tilt-eq \
  cpp/devices/tilt-eq/TiltEq.cpp \
  cpp/devices/tilt-eq/tilt_eq_device.cpp \
  cpp/devices/tilt-eq/device_api.cpp

pnpm build:wasm      # emsdk 4.0.15 → src/dsp/wasm/tilt-eq.wasm
```

The `.wasm` is committed; consumers never run Emscripten. CI (and
`scripts/ci-local.sh`) rebuilds every device with the pinned emsdk and fails
if a byte differs, so build with exactly 4.0.15.

## 5. Register it

- `src/dsp/registry.ts`: a descriptor with name, category, presets, then add
  it to `STOCK_WASM_DEVICES` (order is append-only):

```ts
export const TILT_EQ_DESCRIPTOR = wasmDeviceDescriptor(TILT_EQ_DEVICE, {
  name: 'Tilt EQ',
  category: 'eq',
  presets: { Flat: { tilt: 0 }, Bright: { tilt: 3 }, Warm: { tilt: -3 } },
  // experimental: true  — when over the CPU gate; docs/devices.md says why
})
```

- `src/dsp/index.ts`: export the params, device, factory and types.
- Tests that enumerate devices: `src/__tests__/public-entry.test.ts` (pins),
  `src/dsp/__tests__/device-contract.test.ts` (a row per device: contract,
  bypass, latency), the registry and factory tests.
- `scripts/ci-local.sh` / `ci.yml` check nothing new — the artefact list is
  `src/dsp/wasm/*.wasm`.

## 6. Document and measure

`docs/devices.md` gets a section: origin (repo, commit, files), parameters
(id, range, default, what it does), deviations from the origin and why, the
`.wasm` size, and CPU (native and wasm-in-Node at 48 kHz/128) against the 5 %
gate; over the gate means `experimental: true` until an iPhone figure clears
it. A changeset (`patch`) names the device.

## 7. Use it

```ts
import { createTiltEq } from '@kieranklaassen/live-mix/dsp'

const tilt = await createTiltEq(engine.context, { params: { tilt: 2 } })
music.strip.addInsert(tilt)
// or, through the registry every UI enumerates:
registerStockWasmDevices()
const same = await devices.create('tilt-eq', engine.context, { preset: 'Bright' })
```

Both apps see it in `devices.list()` and get a generated `DevicePanel` for it
with no app change (R31). If kkfonie should share the source rather than a
copy, that is the open vendoring question (KTD10) — keep the copy and the SHA
until it is decided.
