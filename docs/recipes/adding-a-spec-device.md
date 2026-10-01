# Adding a spec device

A spec device is a WASM device whose manifest carries its parameter table. You write three files; everything else is generated.

```
cpp/devices/<id>/device.json      what it is: name, category, params, presets, origin
cpp/devices/<id>/<snake_id>.h     the DSP: one class on cpp/kit (add .cpp files only if you must)
cpp/test/<snake_id>_test.cpp      the native harness
```

Reference devices to read first, in full: `cpp/devices/tape-echo/` (effect) and `cpp/devices/string-machine/` (instrument), with their harnesses in `cpp/test/`. The kit is `cpp/kit/*.h` (about 2,400 lines, every block documented at its definition); the test helpers are `cpp/test/support/test_kit.h`.

## The loop

```bash
CXX=g++ bash scripts/dev-device.sh <id>            # generate, native test, build .wasm, wasm smoke
CXX=g++ bash scripts/dev-device.sh <id> --native-only
```

`dev-device.sh` writes only that device's files (`params.gen.h`, `device_api.gen.cpp`, `src/dsp/devices/<id>.gen.ts`, `src/dsp/wasm/<id>.wasm`). When the device is done, `node scripts/gen-devices.mjs` refreshes the shared lists (`index.gen.ts`, `scripts/devices.gen.sh`, `docs/devices-generated.md`); `pnpm test` fails while they are stale.

The `.wasm` must come from Emscripten 4.0.15 (CI rebuilds it and compares bytes).

## device.json

```json
{
  "id": "tape-echo",
  "name": "Tape Echo",
  "category": "delay",
  "description": "One sentence a musician reads in the device browser.",
  "class": "TapeEcho",
  "header": "tape_echo.h",
  "sources": [],
  "params": [
    {
      "key": "time",
      "name": "Time",
      "min": 30,
      "max": 2000,
      "default": 380,
      "taper": "log",
      "unit": "ms"
    },
    { "key": "heads", "name": "Heads", "choices": ["One", "Two", "Three"], "default": 0 }
  ],
  "presets": { "Space echo": { "time": 380 } },
  "origin": { "kind": "new", "note": "…" }
}
```

- `category`: `instrument`, `reverb`, `delay`, `texture`, `pitch`, `modulation`, `eq`, `dynamics`, `drive`, `spatial`, `utility`. `instrument` adds the note entry points.
- `params`: array order is the parameter id. `key` is camelCase; `taper` is `linear` (default) or `log` (needs `min > 0`); `unit` is free text (`ms`, `s`, `Hz`, `dB`, `st`, `ct`, or empty for 0..1 amounts). A `choices` param takes only `key`, `name`, `choices`, `default` (an index). A wet/dry control is called `mix`, 0..1: equal power when the wet signal is decorrelated from the dry one (a reverb, a long delay, a granular cloud), a linear crossfade when the two stay time-aligned and coherent (a filter, a saturator, a tremolo), where equal power would add 3 dB at the centre.
- `presets`: at least four, named in plain words, each a sound someone would want. A preset lists only what it changes.
- `sources`: extra `.cpp` files, repo-relative. Prefer header-only.
- `memoryMb` (default 4): raise it when the static storage needs it (the linker says so). `samples: true` adds the sample entry points (see `cpp/kit/sample.h`). `experimental: true` marks a device over the CPU budget. `latencySamples` when the device delays its output by a fixed count.
- `origin`: `{ "kind": "new", "note": … }`, or for a port `{ "kind": "port", "repository": "kieranklaassen/kkfonie", "commit": "<sha>", "files": [{ "path", "sha256", "portedTo", "deviations": [...] }], "note": … }`. A port records every deviation from the source.

## The class

```cpp
#include "../../kit/kit.h"
#include "params.gen.h"   // namespace livemix::<snake_id>: enum Param { kTime, … kNumParams }, kParamMin/Max/Default

namespace livemix {
class TapeEcho : public kit::DeviceBase<tape_echo::kNumParams> {
 public:
  void init(float sample_rate);              // init_base(...) first; reset ALL state; reseed every RNG
  void set_param(int id, float value);       // if (store_param(id, value)) apply(id);
  void process(int frames);                  // frames = begin_block(frames); …
  // instruments:
  void note_on(int note_id, float frequency, float gain);
  void note_off(int note_id);
  // samples: true
  int sample_capacity(); float* sample_buffer(); void sample_commit(int frames, int channels, float rate);
};
}
```

The rules every device keeps (the conformance pass checks most of them):

1. **No allocation, no exceptions, no RTTI, no `std::vector`/`std::string`/`new`** in device code. All storage is members of the one static instance. Size delay lines for 96 kHz.
2. **`init` resets everything**: two `init` calls must give bit-identical renders. Seed RNGs with constants.
3. **Smooth what is audible.** Values arrive as bare steps; use `kit::Smoother` (5 ms, `kSmoothingSeconds`) and `set(value, primed())` so values set before the first block snap instead of gliding.
4. **Control-rate work runs on `kit::ControlClock`**, never once per host block: output must not depend on block size (1, 128 and 2048 frames give the same audio).
5. **Consume the input**: `take_input` per sample, or `clear_input(frames)` for an instrument.
6. **Sleep when idle** with `kit::IdleGate`: exact zero out once nothing excites the device and its tail is below -140 dBFS. The hold must be longer than the longest silent gap the device can produce (its longest delay).
7. **Flush denormals in every feedback path** (`flush_denormal`); the kit's filters and allpasses already do.
8. **Stay bounded.** Any parameter combination with full-scale input (or 96 stacked notes) stays finite and under the harness's `max_peak`. Feedback above unity needs a saturator in the loop. Instruments end in `kit::soft_clip`.
9. **Levels.** Effects are unity gain for the dry path and do not get louder than their input by more than a few dB at defaults. One instrument note at gain 0.7 peaks between -24 and -10 dBFS at the default volume; ten held notes stay under the clip knee.
10. **Bad input is survivable**: NaN, infinite and out-of-range parameter values (`store_param` clamps), unknown ids, NaN or absurd note frequencies and gains (ignore or clamp), `note_off` for notes that are not playing.
11. **Defaults sound good.** The default patch is what someone hears first.

## The harness

```cpp
Conformance spec;                       // name, num_params, mins/maxs/defaults from params.gen.h
spec.tail_seconds = 14.0f;              // how long the default patch may ring after input stops
spec.max_peak = 4.0f;                   // instruments: 1.01f (they end in soft_clip)
check_effect(device, spec, 48000.0f);   // or check_instrument
```

Then assert what makes the device what it is: at least six behaviour checks, each a measurement (`tone_level`, `dominant_frequency`, `rt60`, `correlation`, `rms`, `peak`, `max_step`, `energy_above`), not a smoke test. A reverb proves its decay time follows the control; a pitch shifter proves the output frequency; a tremolo proves depth and rate; a filter proves its cutoff. Include a click test (`max_step`) for the parameter most likely to be moved while sounding. End with `report_cost` under a realistic load and `return finish("<id>");`.

Budget: the WASM smoke prints the cost of a 128-frame block. Over 5 % of real time (8 notes held for instruments) means `experimental: true` in the manifest, or a cheaper algorithm.

## What not to touch

`cpp/kit`, `cpp/test/support`, `scripts`, and anything generated or shared (`index.gen.ts`, `devices.gen.sh`, `registry.ts`) belong to the foundation. If the kit lacks a block or has a bug, write the helper in your device's directory and say so in the pull request; it moves into the kit once a second device needs it.
