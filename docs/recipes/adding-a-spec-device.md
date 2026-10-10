# Adding a spec device

A spec device is a WASM device whose manifest carries its parameter table. You write three files; everything else is generated.

```
cpp/devices/<id>/device.json      what it is: name, category, params, presets, origin
cpp/devices/<id>/<snake_id>.h     the DSP: one class on cpp/kit (add .cpp files only if you must)
cpp/test/<snake_id>_test.cpp      the native harness
```

Reference devices to read first, in full: `cpp/devices/tape-echo/` (effect) and `cpp/devices/string-machine/` (instrument), with their harnesses in `cpp/test/`. The kit is `cpp/kit/*.h` (about 2,200 lines, every block documented at its definition; a plucked string starts from `kit::PluckedString` in `cpp/kit/string.h`, as `cpp/devices/guitar/` and `cpp/devices/harp/` do); the test helpers are `cpp/test/support/test_kit.h`.

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
  "presets": { "Warm repeats": { "time": 380 } },
  "origin": { "kind": "new", "note": "…" }
}
```

- `category`: `instrument`, `reverb`, `delay`, `texture`, `pitch`, `modulation`, `eq`, `dynamics`, `drive`, `spatial`, `utility`. `instrument` adds the note entry points.
- `params`: array order is the parameter id. `key` is camelCase; `taper` is `linear` (default) or `log` (needs `min > 0`); `unit` is free text (`ms`, `s`, `Hz`, `dB`, `st`, `ct`, or empty for 0..1 amounts). A `choices` param takes only `key`, `name`, `choices`, `default` (an index). Any param may carry a `description`: a sentence or two on what turning it does to the sound, which the kit's info view shows when the knob is pointed at (leave out the range and the unit, and how a knob is turned). A wet/dry control is called `mix`, 0..1: equal power when the wet signal is decorrelated from the dry one (a reverb, a long delay, a granular cloud), a linear crossfade when the two stay time-aligned and coherent (a filter, a saturator, a tremolo), where equal power would add 3 dB at the centre.
- `presets`: at least four for an instrument and sixteen for an effect, named in plain words (24 characters at most), each a sound someone would want. A preset lists only what it changes; loaded by name, the rest goes back to the defaults. An effect's presets are rendered and measured by `src/dsp/__tests__/effect-presets*.test.ts` (see [Effect presets](../devices.md#effect-presets)). No preset is named after a product, a brand, a maker or an artist.
- `formerPresets`: when a preset is renamed, the name it had and the name of today (`{ "Space echo": "Warm repeats" }`). A saved score names its presets, and one that names the old one still loads; lists show only the names of today.
- `retiredPresets`: when a preset is retuned. A shipped name never changes what it loads, because a saved score names its presets: the retune goes into `presets` under a new name, and the old name goes here with the settings it had (`{ "Studio master": { "drive": 0.4 } }`). It still loads by name and no list shows it. `shipped-presets.test.ts` fails when a shipped preset's values or a default change.
- `sources`: extra `.cpp` files, repo-relative. Prefer header-only.
- `memoryMb` (default 4): raise it when the static storage needs it (the linker says so). `samples: true` adds the sample entry points (see `cpp/kit/sample.h`). `experimental: true` marks a device over the CPU budget. `latencySamples` when the device delays its output by a fixed count.
- `meters`: readings the device reports about its own work, for a meter beside its knobs: `[{ "key": "reduction", "name": "Gain reduction", "unit": "dB" }]`. Array order is the meter id. A device with meters adds `float meter(int index) const` to its class; it is called on the audio thread after `process`, about 30 times a second and only while someone is watching, so it returns a value the device already has (no work, no state change). At rest and asleep a meter reads its resting value (0 dB of reduction). On the web side the device is a `MeteredDevice` (`meters`, `meter(name)`, `watchMeters()`), `useDeviceMeter(device, name)` follows one reading, and the generated `DevicePanel` shows each in its title bar. A reading that is only for the device's display on its plate (an LFO's phase, where a playhead stands) takes `"display": true` and is printed nowhere; after adding one, `node scripts/same-sound.mjs <id>` proves the sound is the same sample for sample.
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
  // meters:
  float meter(int index) const;
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

Faults the conformance pass does not see, each found while building a device and written up under `docs/solutions/`:

- **A voice's `level()` is true from the moment it is taken.** `kit::VoicePool` steals by level; a level written only on the control clock lets the second note of a chord steal the first ([write-up](../solutions/logic-errors/voice-level-must-be-valid-when-a-voice-is-taken.md)). A key struck twice inside a steal fade must not leave a voice sounding ([write-up](../solutions/logic-errors/stolen-voice-pending-note-restrike-stuck-voice.md)).
- **Knobs moved while the device sleeps snap on the next note.** A smoother that keeps its old value through a sleep glides under the first note ([write-up](../solutions/logic-errors/knob-moved-while-device-sleeps-glides-under-first-note.md)), and anything free-running (an LFO, a chorus) must restart the same way whatever the block size ([write-up](../solutions/logic-errors/device-output-depends-on-block-size-across-a-silence.md)).
- **Noise is scaled by `sqrt(sample_rate / 48000)`**, or it drops 3 dB against the tone at 96 kHz ([write-up](../solutions/logic-errors/noise-level-falls-with-sample-rate.md)).
- **`kit::BlepOsc` folds more than its comment says at the top of the keyboard**: measure fold-back at C6 with the filters open, and use a closed-form band-limited wave or a longer correction where it matters ([write-up](../solutions/design-patterns/polyblep-folded-energy-and-closed-form-pulse.md)).
- **A click check needs a reference with no event in it**, and a harness is only worth what it fails on: break the device on purpose and see which checks notice ([click checks](../solutions/best-practices/click-checks-need-an-event-free-reference.md), [mutation checks](../solutions/best-practices/mutation-check-a-measuring-harness.md)).

## Spectral devices

A device that works on the spectrum builds on `kit::Stft` (`cpp/kit/stft.h`): one channel of streaming
short-time Fourier analysis and resynthesis, Hann on the way in and on the way out, proved once in
`cpp/test/stft_test.cpp`. It is not part of `kit.h`; include it beside the kit. Every call is documented at its
definition. (`cpp/devices/spectral-blur/` is older and carries its own framing: read it for what a device does
per bin, not for the frames.)

```cpp
#include "../../kit/kit.h"
#include "../../kit/stft.h"
#include "params.gen.h"

namespace livemix {
class Veil : public kit::DeviceBase<veil::kNumParams> {
 public:
  using Stft = kit::Stft<2048, 512>;               // frame, hop
  static constexpr int kLatency = Stft::kLatency;  // 2304: "latencySamples" in device.json

  void init(float sample_rate) {
    using namespace veil;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    stft_[0].init();                   // left: works as soon as a frame is whole
    stft_[1].init(Stft::kMaxStagger);  // right: half a hop later, on the very same frames
    // … every per-bin table (from sr) and all per-bin state …
    idle_.reset(sr, static_cast<float>(Stft::kLatency + Stft::kFrame + Stft::kHop) / sr);
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames) || alive_[0] || alive_[1])) {
      silence_output(frames);
      stft_[0].skip(frames);  // the frame clock runs on through the sleep
      stft_[1].skip(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      // … dry_gain and wet_gain from the smoothed mix …
      float out[2];
      for (int c = 0; c < 2; ++c) {
        const float wet = stft_[c].process(in[c], [this, c](float* re, float* im) { frame(c, re, im); });
        out[c] = stft_[c].dry() * dry_gain + wet * wet_gain;
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  // One frame of channel c: Stft::kBins bins, real and imaginary parts, changed in place.
  void frame(int c, float* re, float* im);

  Stft stft_[2];
  bool alive_[2] = {false, false};  // any bin still holding sound
};
}  // namespace livemix
```

**The frame.** `process(x, fn)` takes one sample and returns one. Every `Hop` samples it first calls
`fn(float* re, float* im)` with the spectrum of the newest whole frame: `kBins = Frame/2 + 1` bins to change in
place, bin k at `k × rate / Frame` Hz (`bin_to_hz`, `hz_to_bin`, `nearest_bin`). A sine of amplitude 1 on a
bin's centre reads `kFullScale` (`Frame/4`) there and half that in each neighbour; noise of RMS 1 reads
`√(3·Frame/8)` per bin (27.7 at 2048). With a callable that changes nothing the output is the input
`kLatency` samples late, to 4e-7. Pick the frame for the job:

| `kit::Stft<…>` | a bin at 48 kHz | a frame lasts | `latencySamples` | a frame costs (WASM) | storage per channel |
| -------------- | --------------- | ------------- | ---------------- | -------------------- | ------------------- |
| `<1024, 256>`  | 46.9 Hz         | 21 ms         | 1152             | 8 µs                 | 44 KB               |
| `<2048, 512>`  | 23.4 Hz         | 43 ms         | 2304             | 17 µs                | 88 KB               |
| `<4096, 1024>` | 11.7 Hz         | 85 ms         | 4608             | 38 µs                | 176 KB              |

**Latency and the dry path.** `kLatency` is `Frame + Hop/2`, the same for both channels whatever their
stagger. Put that number in the manifest as `latencySamples`, and take the dry signal from `stft_[c].dry()`: the
input of `kLatency` samples ago, read from the ring the frames come from, so `mix` does not comb and at `mix` 0
the output is the input `kLatency` late, bit for bit. Assert both in the harness.

**The stagger.** A frame is two transforms. `init(stagger)` does one channel's work up to half a hop
(`kMaxStagger`) later, on the same stretch of input, so that with the channels at 0 and `kMaxStagger` no
128-frame block ever holds the transforms of both (for a hop of 256 or more). The stagger does not move the
frames or the output, not by a bit: mono in is still mono out. Channel 0's frame n always comes before channel
1's frame n; whatever is worked out once per frame (a gain table, a shared decision) is worked out when channel
0's comes, not once per call.

**Sleep.** The frame clock counts samples. In the branch that sleeps call `skip(frames)` on every `Stft`, as
above: the frames then fall on the same samples whatever the block size, which is what decides when sleep
begins. `stft.frame()` numbers the frames, with the same number for both channels and for the same place in
time whatever was slept through: seed per-frame randomness from it, never from a count of calls. With both, the
output is the same at block sizes 1, 128 and 2048 across a silence; without either it is not (a test device
differed by 0.6 of full scale). The idle hold is at least `kLatency + Frame + Hop` samples, plus whatever the
device itself delays; and sleep only on exact zeros: set what a bin holds to zero once it is under a floor (1e-6
is -174 dBFS a bin at 2048), keep `alive` true until every bin is there, and nothing stale can come back.
Silence in is exact silence out `kLatency + Frame` after the last sample.

**Cost.** The transforms are the small part: under 0.2 % of real time a channel at 48 kHz at a quarter hop
whatever the frame size (0.4 % for a stereo device, twice that at 96 kHz or at an eighth hop), and
`analyse()` in place of `process()`, for a device that measures and does not resynthesise, is under half. The
rest is the callable. At a quarter hop the whole 5 % is about 240 ns per bin per frame per channel; aim for a
fifth of that. Per bin in WASM: a gain or a rotator (multiply by a unit vector) 1 ns, `kit::to_polar` 8 ns,
`kit::from_polar` 4 ns, against about 20 ns for `std::atan2` and 12 to 25 ns for a `std::sin` and a `std::cos`;
`std::exp`, `std::pow` and `std::log` per bin belong in a table built in `init` or when a knob moves. The budget
is an average, and a frame's work lands in one block: report the worst block as well (the harness of
`spectral-blur` shows how).

**Pitfalls**, each measured:

- **A frozen frame replayed buzzes at the frame rate.** The same spectrum handed over frame after frame repeats
  every `Hop` samples exactly: 93.75 Hz at 2048/512 and 48 kHz. A bin that is held goes on turning: advance its
  phase each frame by the turn it was last measured to make.
- **Random phase costs up to 6 dB.** Fresh random phases every frame come out 6.0 dB down at a quarter hop and
  9.0 dB at an eighth, because frames that no longer agree add as power. Raise the magnitudes by what is lost
  (`spectral_blur.h` has the gain for partly random phase).
- **Bins of one partial must turn together.** A partial is three or four bins wide. A held sine whose bins each
  turn by their own bin's centre ripples by 35 dB at the frame rate and lands on the bin's pitch; turned by the
  partial's own frequency it is steady to 0.03 dB. Measure the turn (`Stft::advance_to_hz` from two frames'
  phases, or the rotator `X × conj(X_last)`, normalised) and give a peak's neighbours the peak's turn.
- **A gain per bin is a filter three bins wide.** At a bin's centre the response is 2/3 of that bin's gain and
  1/6 of each neighbour's: one bin set to zero is a dip of 9.5 dB, not silence.
- **Hertz and seconds are worked out again for the sample rate.** Bins are `rate / Frame` wide and a frame comes
  every `Hop / rate` seconds: at 96 kHz the bins are twice as wide and the frames twice as often. Anything per
  bin meant in Hz, and anything per frame meant in seconds, is computed in `init` from `sample_rate()`, and
  storage counted in frames is sized for 96 kHz.
- **Parameters read once per frame need no smoother**: the overlap crossfades any change over a frame. `mix` is
  smoothed per sample as everywhere.
- **The frame is a circle.** A delay or a stretch done in the spectrum wraps round the frame's ends; the output
  window fades the ends, it does not undo the wrap. Keep a phase that accumulates wrapped (`kit::princarg`).
- **Silence is exact zeros.** The first frame after `init` and every frame of a silence is all zeros: whatever
  divides by a magnitude (a normalised rotator, a ratio of two frames) needs a floor.
- **Bad input stops at the block.** `process()` takes a NaN, an infinite or a runaway sample as zero (in `dry()`
  too), so the spectrum and whatever is kept per bin never see one. Any path of the device's own beside the
  `Stft` still has to survive them.

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
