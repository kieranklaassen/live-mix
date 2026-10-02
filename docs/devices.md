# Devices: catalogue and CPU cost

Every WASM device ships as a committed `.wasm` (`src/dsp/wasm/`, rebuilt
reproducibly by `scripts/build-wasm.sh` with Emscripten 4.0.15), a native C++
parity harness (`cpp/test/`, `pnpm test:native`), a TypeScript param table and
factory (`src/dsp/devices/`), a registry descriptor (`src/dsp/registry.ts`) and
a Vitest suite on the artefact. This page records what each device is, where
it came from and what it costs.

## CPU budget

The plan's budget for the audio thread is **under 5 % of one core on a current
iPhone at 48 kHz** for the meter and ducker together with two devices
(Verification Contract, R38). No iPhone is available to the library's CI, so
each device records two proxies at 48 kHz / 128-frame stereo blocks:

- **native**: the C++ harness's own timing (`g++ -O2`, one Xeon core), printed
  by `pnpm test:native`;
- **wasm**: the committed artefact driven in Node 22 (V8, the same engine as
  Chrome's AudioWorklet), 10 s of signal after a warm-up, on the same core.

A device whose wasm figure exceeds **5 % of real time** for its stated worst
case is marked `experimental: true` in its registry descriptor
(`DeviceDescriptor.experimental`) until the iPhone number is recorded and the
flag is lifted by hand. Figures below were
measured on the CI VM (Intel Xeon, Node 22.14, emsdk 4.0.15); a current
iPhone's performance core is faster than this machine's, so they are upper
bounds.

### Load while it runs

Those figures time a device in a tight loop. In an audio thread a block of
each device runs once every 3 ms, on a cache the other devices and the
browser have been through since, and costs about twice as much: four Zita
reverbs and two Shimmers took 4.6 % of real time flat out and 9.4 % at the
audio thread's pace, in the same headless Chromium on the same machine.

`engine.stats` gives the running figure (`averageLoad`, `peakLoad`, and
`devices` by kind with the memory they hold). No browser reports its audio
thread's load, and the thread cannot time itself (its only clock ticks in
milliseconds, in step with the audio callbacks), so the processors mark when
they are at work in shared memory and a worker samples the mark
(`src/core/load.ts`). That needs a cross-origin isolated page; on any other
page `supported` is false and there is no load figure, only the device list
and its memory. The figure covers the engine's worklet processors (WASM
devices, the plug-in bridge), not the browser's own nodes, and a hosted
plug-in's work is in the host's process, not in it.
`browser-tests/specs/engine-load.spec.ts` holds it against a worker's timing
of the same modules.

## Catalogue

| Device id           | Source                                                                        | Kind         | Params                                                                                                                                                             | `.wasm`  | Native cost                                                 | wasm cost (Node)                                            | Flag             |
| ------------------- | ----------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ----------------------------------------------------------- | ----------------------------------------------------------- | ---------------- |
| `dattorro`          | ambient-live's Dattorro plate                                                 | reverb       | mix, decay, damping, predelayMs                                                                                                                                    | 9,659 B  | —                                                           | 7.5 µs / block, 0.28 %                                      |                  |
| `fdn-reverb`        | kkfonie Tides (8-line FDN, breathing gate)                                    | reverb       | mix, decay, damping, predelayMs, size, breathRate, breathDepth                                                                                                     | 13,349 B | —                                                           | 31.7 µs / block, 1.19 %                                     |                  |
| `stereo-widener`    | kkfonie StereoWidener (byte-identical)                                        | spatial      | width                                                                                                                                                              | 3,553 B  | —                                                           | 3.8 µs / block, 0.14 %                                      |                  |
| `zita-rev1`         | Faust `re.zita_rev1_stereo`                                                   | reverb       | see `src/dsp/devices/faust/zita-rev1.ts`                                                                                                                           | 17,728 B | —                                                           | 7.8 µs / block, 0.29 %                                      |                  |
| `limiter-1176`      | Faust                                                                         | dynamics     | inputGain, outputGain                                                                                                                                              | 7,066 B  | —                                                           | 4.9 µs / block, 0.18 %                                      |                  |
| `true-peak-limiter` | live-mix (BS.1770 true-peak brickwall)                                        | master stage | ceilingDb, releaseMs, inputGainDb                                                                                                                                  | 5,135 B  | —                                                           | 6.3 µs / block, 0.23 %                                      |                  |
| `spectral-drifter`  | kkfonie Bloom `SpectralDrifter` (de-JUCEd)                                    | other        | mix, bloom, direction, season, seed, interval, decay, ageMode, age                                                                                                 | 12,418 B | 18.5 µs / block, 0.69 %                                     | 43.4 µs / block, 1.63 % (Atonal/Scatter, bloom 1)           |                  |
| `ether-reverb`      | kkfonie Ether (Freeverb as `juce::dsp::Reverb`, pre-delay, decay law, freeze) | reverb       | mix, decay, damping, predelayMs, size, freeze                                                                                                                      | 7,254 B  | 6.8 µs / block, 0.25 %                                      | 8.4 µs / block, 0.32 %                                      |                  |
| `felt-piano`        | kkfonie Felt (modal felt piano; ten DSP sources byte-identical)               | instrument   | felt, hardness, detune, stiffness, thump, action, pedalNoise, grit, resonance, damper, reverbMix, reverbSize, width, outputDb, sustain, sostenuto, soft, polyphony | 49,404 B | typical 152 µs / block, 5.7 %; worst 340 µs / block, 12.7 % | typical 218 µs / block, 8.2 %; worst 512 µs / block, 19.2 % | **experimental** |

Costs for the devices that predate this page were measured with the same Node
harness when it was introduced (U37); their native harnesses do not print a
timing.

## Spec devices

The devices below are spec devices: a `cpp/devices/<id>/device.json`, one C++
class on `cpp/kit` and a native harness, with everything else generated (see
the [recipe](./recipes/adding-a-spec-device.md)). Their parameters and presets
are listed in [devices-generated.md](./devices-generated.md); this table
records what each costs. "kkfonie" in the source column means the DSP is a
port, and the manifest's `origin` block records the commit, the file hashes
and every deviation from the source.

Costs are for 128-frame stereo blocks at 48 kHz on the same VM as above, with
nothing else running: the native figure is the first load the harness prints
(instruments hold 8 to 20 notes, effects process a tone), the wasm figure is
the best of three runs of `scripts/smoke-wasm-device.mjs` (10 s; instruments
hold 8 notes).

| Device id         | Name               | Source              | Kind       | Params | `.wasm`  | Native cost per block | wasm cost per block (Node) | Latency (samples) | Memory (MB) |
| ----------------- | ------------------ | ------------------- | ---------- | ------ | -------- | --------------------- | -------------------------- | ----------------- | ----------- |
| `ambient-comp`    | Ambient Compressor | live-mix            | dynamics   | 9      | 11,205 B | 3.8 µs, 0.14 %        | 5.5 µs, 0.21 %             | 0                 | 4           |
| `ambient-eq`      | Ambient EQ         | live-mix            | eq         | 8      | 27,483 B | 16.3 µs, 0.61 %       | 21.3 µs, 0.80 %            | 0                 | 4           |
| `ambient-limiter` | Ambient Limiter    | live-mix            | dynamics   | 4      | 8,197 B  | 10.4 µs, 0.39 %       | 12.5 µs, 0.47 %            | 77                | 4           |
| `atmosphere`      | Atmosphere         | live-mix            | instrument | 10     | 33,549 B | 44.5 µs, 1.67 %       | 34.8 µs, 1.31 %            | 0                 | 4           |
| `auto-filter`     | Auto Filter        | kkfonie Tatami      | eq         | 12     | 23,170 B | 21.0 µs, 0.79 %       | 22.8 µs, 0.86 %            | 31                | 4           |
| `bloom-reverb`    | Bloom              | kkfonie Bloom       | reverb     | 8      | 25,205 B | 68.9 µs, 2.58 %       | 82.4 µs, 3.09 %            | 0                 | 4           |
| `bowed-string`    | Bow                | live-mix            | instrument | 12     | 34,123 B | 85.8 µs, 3.22 %       | 108.2 µs, 4.06 %           | 0                 | 4           |
| `choir`           | Choir              | live-mix            | instrument | 12     | 33,135 B | 66.9 µs, 2.51 %       | 46.7 µs, 1.75 %            | 0                 | 4           |
| `chorus`          | Chorus             | kkfonie Tatami      | modulation | 8      | 12,666 B | 24.3 µs, 0.91 %       | 18.7 µs, 0.70 %            | 0                 | 4           |
| `drone`           | Drone              | live-mix            | instrument | 13     | 32,213 B | 56.1 µs, 2.11 %       | 73.5 µs, 2.75 %            | 0                 | 4           |
| `ember`           | Ember              | kkfonie Tatami      | instrument | 43     | 37,239 B | 55.8 µs, 2.09 %       | 75.8 µs, 2.84 %            | 16                | 4           |
| `expanse`         | Expanse            | live-mix            | reverb     | 11     | 31,432 B | 60.4 µs, 2.27 %       | 33.3 µs, 1.25 %            | 0                 | 6           |
| `flanger`         | Flanger            | kkfonie Tatami      | modulation | 7      | 11,926 B | 11.9 µs, 0.45 %       | 10.4 µs, 0.39 %            | 0                 | 4           |
| `fm-glass`        | Glass              | live-mix            | instrument | 12     | 26,749 B | 90.2 µs, 3.38 %       | 42.0 µs, 1.57 %            | 0                 | 4           |
| `freq-shifter`    | Frequency Shifter  | live-mix            | pitch      | 10     | 14,333 B | 26.8 µs, 1.01 %       | 18.9 µs, 0.71 %            | 0                 | 4           |
| `grain-cloud`     | Cloud              | live-mix            | texture    | 12     | 15,870 B | 18.4 µs, 0.69 %       | 23.8 µs, 0.89 %            | 0                 | 10          |
| `grain-delay`     | Grain Delay        | live-mix            | delay      | 11     | 17,855 B | 27.2 µs, 1.02 %       | 32.8 µs, 1.23 %            | 0                 | 10          |
| `grain-synth`     | Grain              | live-mix            | instrument | 14     | 32,011 B | 61.6 µs, 2.31 %       | 72.0 µs, 2.70 %            | 0                 | 12          |
| `lattice`         | Lattice            | kkfonie Lattice     | pitch      | 59     | 34,723 B | 52.7 µs, 1.98 %       | 62.2 µs, 2.33 %            | 0                 | 4           |
| `modal-bells`     | Bells              | live-mix            | instrument | 12     | 24,210 B | 58.5 µs, 2.20 %       | 40.6 µs, 1.52 %            | 0                 | 4           |
| `organ`           | Reed Organ         | live-mix            | instrument | 13     | 23,093 B | 127.0 µs, 4.76 %      | 70.4 µs, 2.64 %            | 0                 | 4           |
| `patina`          | Patina             | live-mix            | texture    | 8      | 36,191 B | 39.8 µs, 1.49 %       | 29.2 µs, 1.10 %            | 271               | 4           |
| `phaser`          | Phaser             | kkfonie Tatami      | modulation | 9      | 14,298 B | 13.9 µs, 0.52 %       | 10.9 µs, 0.41 %            | 0                 | 4           |
| `reverse-delay`   | Reverse Delay      | live-mix            | delay      | 8      | 15,057 B | 17.1 µs, 0.64 %       | 13.2 µs, 0.50 %            | 0                 | 20          |
| `rotary`          | Rotary             | live-mix            | modulation | 9      | 16,495 B | 25.3 µs, 0.95 %       | 27.2 µs, 1.02 %            | 0                 | 4           |
| `sampler`         | Sampler            | live-mix            | instrument | 13     | 27,427 B | 46.8 µs, 1.76 %       | 30.9 µs, 1.16 %            | 0                 | 24          |
| `saturator`       | Saturator          | kkfonie Tatami      | drive      | 9      | 23,626 B | 46.1 µs, 1.73 %       | 40.5 µs, 1.52 %            | 39                | 4           |
| `shimmer`         | Shimmer            | live-mix            | reverb     | 10     | 26,901 B | 70.4 µs, 2.64 %       | 39.1 µs, 1.47 %            | 0                 | 4           |
| `spectral-blur`   | Spectral Blur      | live-mix            | texture    | 9      | 17,643 B | 42.8 µs, 1.60 %       | 53.1 µs, 1.99 %            | 2304              | 4           |
| `spring-reverb`   | Spring             | live-mix            | reverb     | 9      | 22,946 B | 33.2 µs, 1.25 %       | 26.1 µs, 0.98 %            | 0                 | 4           |
| `string-machine`  | String Machine     | live-mix            | instrument | 10     | 19,106 B | 31.0 µs, 1.16 %       | 22.4 µs, 0.84 %            | 0                 | 4           |
| `swell`           | Swell              | live-mix            | dynamics   | 8      | 4,842 B  | 3.9 µs, 0.15 %        | 5.2 µs, 0.20 %             | 960               | 4           |
| `sympathetic`     | Sympathetic        | kkfonie Sympathetic | reverb     | 7      | 31,992 B | 19.7 µs, 0.74 %       | 23.1 µs, 0.87 %            | 0                 | 4           |
| `tape`            | Tape               | live-mix            | texture    | 10     | 22,263 B | 45.2 µs, 1.70 %       | 33.7 µs, 1.27 %            | 415               | 4           |
| `tape-echo`       | Tape Echo          | live-mix            | delay      | 10     | 16,147 B | 19.5 µs, 0.73 %       | 18.3 µs, 0.69 %            | 0                 | 4           |
| `tape-loop`       | Tape Loop          | live-mix            | delay      | 10     | 18,730 B | 19.3 µs, 0.72 %       | 21.3 µs, 0.80 %            | 0                 | 24          |
| `thesis`          | Thesis             | kkfonie Thesis      | instrument | 15     | 36,421 B | 21.1 µs, 0.79 %       | 19.6 µs, 0.73 %            | 0                 | 4           |
| `tine-piano`      | Tine               | live-mix            | instrument | 11     | 17,742 B | 76.9 µs, 2.88 %       | 44.9 µs, 1.68 %            | 0                 | 4           |
| `tremolo`         | Tremolo            | live-mix            | modulation | 9      | 12,884 B | 7.7 µs, 0.29 %        | 8.1 µs, 0.30 %             | 0                 | 4           |
| `wavetable`       | Wavetable          | live-mix            | instrument | 12     | 25,222 B | 48.4 µs, 1.82 %       | 35.9 µs, 1.34 %            | 0                 | 5           |

What the table does not show:

- **`ember` and `bowed-string` are `experimental`.** Ember's default patch
  costs 2.9 % with eight notes, but unison multiplies it: the Super Saw preset
  (seven unison voices) measures 8.7 % with eight notes. Eight bowed notes
  cost 4.1 %, and the worst case (twelve, with the detuned second string)
  about 6.2 %; with Detune at 0 the same twelve cost 3.4 %.
- **Over the 2 % aim on their default patch, under the flag at their worst
  preset:** `bloom-reverb` (3.3 %; about two thirds of it is the two shared
  `SpectralDrifter`s), `drone` (3.6 %), `grain-synth` (3.4 %), `saturator`
  (2.8 % at 4x oversampling), `lattice` (2.7 %; about 70 % of it is the pitch
  tracker's FFT), `thesis` (2.6 %) and `organ` (2.5 %). The worst preset of
  every other device stays under 2.4 %.
- **Memory** is the module's fixed linear memory (`memoryMb`), which holds the
  delay and sample buffers: 20 to 24 MB for the long loops and the sampler.
- **Levels.** One note at velocity 0.8 peaks between -16 and -22 dBFS on the
  default patch of every instrument here, and ten notes at full velocity stay
  under 0 dBFS. `felt-piano` predates this convention and is about 15 dB
  hotter.

### Kit follow-ups

Building these devices on `cpp/kit` turned up the same gaps several times. None blocks a device (each one works around it locally and says so in a comment), but each is a candidate for the kit before the next batch:

- **Mix and pan.** `kit::equal_power(1)` leaves the dry gain at about -4e-8 instead of 0, so devices that promise exact silence at full wet force it to zero; it also calls `sin` and `cos` on every call, so several devices cache its result.
- **LFOs.** `kit::Lfo` keeps a `float` phase, which is coarse near 0.01 Hz, and has no rising saw. Flanger and phaser share a local `mod_lfo.h` (six shapes, `double` phase) that belongs in the kit.
- **Smoothing and sleep.** `kit::Smoother` at 5 ms is too fast for delay times, has no cheap path once settled, and keeps ramping while a device sleeps. `kit::IdleGate` has a fixed, block-quantised hold and no wake hook; delays and loops need a hold that follows a setting.
- **Oversampling.** `kit::Halfband2x` lets its transition band fold just under Nyquist (18.5 to 22 kHz at 44.1 kHz), has no short second stage for 4x and no decimate-only mode with whole-sample latency.
- **FFT.** A real-input transform would cut Lattice's pitch tracker (about 70 % of its cost) and the STFT devices.
- **Delay lines.** `kit::DelayLine` is power-of-two only and reads at a `float` position; long loops need a ring with `double` positions (tape loop and reverse delay each carry one), and high-Q waveguides have to compensate for the Hermite read's loss.
- **Grains and samples.** `kit::GrainPool` has no per-voice ownership and reads one channel at a time. `kit::SampleStore::commit` scans every frame (3.5 ms for 31 s of stereo) and does not expose its channel count.
- **Small helpers that got copied.** An anti-aliased waveshaper (rotary, tape), a three-multiply band-pass (drone, atmosphere), per-octave band-limited tables (wavetable, drone), a splice-search pitch shifter (shimmer), a seed hash so two generators seeded in sequence do not correlate (drone, atmosphere).
- **Test kit.** It lacks a power spectrum, a spectral centroid, a fast narrow-band level and pitch measure and an aliasing measure, so harnesses carry their own; `dominant_frequency` takes seconds per call; `check_instrument` has no block-size check.
- **Generator and smoke test.** `latencySamples` cannot vary with the sample rate; a class constant named like a parameter (`kPartials`) silently shadows the generated enum; the smoke test's cost is wall-clock and swings under load.

## spectral-drifter

Bloom's granular pitch drifter (`Bloom/Source/SpectralDrifter.{h,cpp}` at
kkfonie `0c4ae88`) as a stereo insert. Eight Hann-windowed grains of 6144
samples, staggered by 768, each read the last two seconds of input backwards at
a pitch ratio that blends from unison towards the chosen interval by an
intensity `bloom * (0.3 + 0.7 * age)`; the sum passes season shaping
(Spring/Summer/Autumn/Winter one-poles), seed emphasis (Fundamental lowpass
blend, Odd `tanh`, Even asymmetric), `tanh(0.8x) * 1.1` and two smoothing
stages. Left and right run independent drifters, as Bloom does on its even and
odd FDN taps, mixed equal-power with the dry input.

Age. Bloom measures how long each FDN line has carried signal and feeds the
drifter `age / (2 * decay)`. Standing alone, the device runs that tracker on
each input channel (`ageMode` 0: age grows while |x| > 1e-4, clamps at
`2 * decay` seconds, decays by `0.9999^(44100/fs)` per sample in silence), so a
reverb tail placed before it drifts further the longer it rings and a new onset
starts fresh. `ageMode` 1 uses the `age` param directly, for automation or a
modulator (breath phase). What an insert cannot reproduce is Bloom's
re-injection of 25 % of the drifted signal into its own feedback loop, which
makes the shift compound per recirculation; on a return track the closest
equivalent is the send feeding a reverb whose return holds the drifter.

Choice params take the option index (`SPECTRAL_DRIFTER_DIRECTIONS` etc. in
`src/dsp/devices/spectral-drifter.ts`); values are rounded to the nearest
index. Quirks kept from Bloom: the buffer is 88200 samples and the grain 6144
samples at any sample rate (so the grain is 128 ms at 48 kHz, 64 ms at 96 kHz),
and Atonal mode applies the intensity twice (once choosing the target semitones,
once blending towards them).

Verification: `cpp/test/spectral_drifter_test.cpp` measures the dominant
output frequency of a tone for Octave/Fifth/Down/Scatter/Atonal, bloom 0,
the age law (`getCurrentDrift` at ages 0, 0.5, 1 and after silence), every
season/seed pair, 20 s of loud input, denormal flushing, 44.1/96 kHz, and
prints the CPU cost; `src/dsp/__tests__/spectral-drifter-wasm.test.ts` repeats
the octave-up/down, bloom 0, mix law and silence checks on the artefact.

## ether-reverb

kkfonie's Ether (`Ether/Source/PluginProcessor.cpp` at `0c4ae88`). Ether's
reverb is `juce::dsp::Reverb`, which is Freeverb (Jezar at Dreampoint) with
JUCE's constants; `cpp/devices/ether-reverb/freeverb.h` is that algorithm
written JUCE-free: eight parallel damped comb filters and four series
allpasses per channel, tuned {1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617}
and {556, 441, 341, 225} samples at 44.1 kHz with the right channel 23 samples
longer and `(int) rate * tuning / 44100` scaling, input gain 0.015 on L+R,
feedback `roomSize * 0.28 + 0.7`, comb damping `damping * 0.4`, allpass
feedback 0.5, wet scale 3, 10 ms linear parameter ramps. Around it,
`ether_reverb_device.*` reproduces Ether's `processBlock`: a per-channel
linear-interpolating pre-delay (0..200 ms), the knob law `decayFactor =
(decay - 0.5) / 29.5`, `roomSize = min(1, size + 0.3 decayFactor)`,
`damping = max(0, damping - 0.2 decayFactor)`, and freeze (`>= 0.5`): roomSize
0.999 → JUCE forces feedback 1, damping 0 and input gain 0, while Ether feeds
the pre-delay silence and mutes the dry, so whatever is in the combs hangs
losslessly until released. Output is Ether's linear `dry * (1 - mix) + wet *
mix`.

Freeze on an empty room is the one place the device does not follow Ether.
There, freeze shuts the input and the dry signal the moment it is on, so the
"Frozen" preset, or a session saved with freeze on, loaded to silence and
stayed silent whatever was played. Here a freeze with nothing in the room
(the reverb's own output under about −50 dBFS) is armed: the device runs
unfrozen, the first sound gets in and is heard, and once its tail has turned
and fallen 3 dB from its top the room is held (2 s after the tail became
audible at the latest, so a pad that keeps swelling is held too). From then
on it is Ether's freeze. Thrown while the room is ringing it holds at once.

Deviations, all recorded in `device.json`: `mix` and the freeze dry-mute ramp
over 5 ms (Ether steps them per block); the reverb's parameters are applied
before the rate is set so there is no start-up ramp from JUCE's constructor
defaults; and JUCE_UNDENORMALISE (`x += 0.1f; x -= 0.1f` on every stored
sample) is replaced by `flush_denormal`. That last one matters: the 0.1f
add/subtract quantises the loop to multiples of 7.45e-9 and, measured, an Ether
tail then idles in a −116 dBFS limit cycle forever; here it decays to exact
zero. Freeverb has no limiter and neither does Ether: at decay 30 / size 1
(feedback 0.98) a tone on a comb resonance can gain ~+18 dB into the wet path
(measured wet peak 7.8 for a 3.2-peak input at mix 1), so keep the master
limiter in the chain.

Note on RT60: Ether's `decay` is not an RT60 in seconds. It moves roomSize
(feedback 0.7..0.98) and damping, so decay 1 s at size 0.6 measures a short
room and decay 30 s a long hall; `size` adds to it. `ETHER_REVERB_PARAMS`
shares its first five ids with `FDN_REVERB_PARAMS` so presets keep their shape.

Verification: `cpp/test/ether_reverb_test.cpp` checks the line lengths at
44.1/48/96 kHz, the knob law and Freeverb's mapping, the linear mix and
input-bus contract, onset at the shortest comb (1214 / 1239 samples at 48 kHz)
and with pre-delay, a decaying tail whose RT60 grows with decay and size and is
rate-independent, damping, freeze (held level over 8 s, no more input once
held; armed on an empty room, silent until a sound arrives, then held near
the top of its tail, at 44.1, 48 and 96 kHz), 10 s of loud input at maximum feedback, the flush to exact zero, the 5 ms
host ramps, and prints the CPU cost; `src/dsp/__tests__/ether-reverb-wasm.test.ts`
repeats the mix law, onsets, tail-to-silence, freeze and stability checks on
the artefact.

## felt-piano

kkfonie's Felt (`Felt/Source/*` at `0c4ae88`): a physically modelled felt
piano with no samples. Per note, `ModeTable::buildNote` fills a `ModalBank` of
up to 200 complex one-pole resonators (inharmonic partials from measured
Fletcher/Young tables, Weinreich double decay via one to three detuned unison
strings per partial, longitudinal-mode precursors below C4, the measured
Steinway body curve); `HammerExciter` strikes it with a half-sine force pulse
whose duration is the Askenfelt/Jansson contact time shaped by velocity,
hardness and the felt strip; `VelvetBurst` adds hammer thump, strike splash,
key action and damper felt; a `GhostPool` fades stolen voices; on the bus a
`SympatheticBank` of twelve Karplus-Strong strings blooms under the pedal, then
grit, `StereoWidener` width, `FeltReverb` (the Bloom/Tides 8-line FDN) and a
soft limiter. Those ten sources are byte-identical to kkfonie (`device.json`
lists every SHA-256); `felt_voice.h`, `felt_synth.h` and `felt_piano_device.*`
are live-mix's JUCE-free `FeltVoice`, `juce::Synthesiser` and
`PluginProcessor::processBlock`.

Notes and pedals. The worklet host's `noteOn(id, frequency, gain)` becomes a
key press: the frequency rounds to the nearest key (A0..C8; `feltPianoKeyFor`
is the same law in TypeScript) and `gain` is the MIDI velocity 0..1; `noteOff(id)`
releases it. `juce::Synthesiser`'s rules are kept: re-striking a sounding key
releases the old voice and starts a new one, a free voice is taken before
Felt's steal policy (quietest tail voice, else quietest non-sostenuto voice)
hands the old state to the ghost pool, sustain holds released keys and is
inherited by notes started under it, sostenuto holds what was sounding when it
went down. Pedals are params (`sustain` continuous: ≥ 0.5 holds, below that it
sets the half-pedal damping rate; `sostenuto`, `soft`), so automation and
modulators can drive them, and a sustain transition fires Felt's damper-felt
burst exactly as CC64 does.

Deviations (all in `device.json`): percent knobs are 0..1; `polyphony`
(1..32) caps the pool new notes may start in, the CPU knob; sostenuto-up clears
the voice's sostenuto flag before releasing it, where `juce::Synthesiser`
leaves it set and Felt's damper therefore never falls on a key released under
sostenuto (reported to kkfonie); and denormal hygiene Felt gets for free from
`juce::ScopedNoDenormals`: once per block, resonator states under 1e-18 snap to
zero and rung-out velvet bursts are reset (measured natively without FTZ: 186 %
of real time → 5.7 % for a six-note chord), and after one second of exact bus
silence with the output under −180 dBFS the room, sympathetic strings, widener,
damper filters and grit envelope are reset once.

CPU. This is the device the plan gates on an iPhone measurement. On the CI
core at 48 kHz / 128 frames: a six-note chord under the pedal restruck every
two seconds costs **5.7 % native / 8.2 % wasm**; Felt's README worst case (32
voices ff under the pedal, restruck every second) **12.7 % native / 19.2 %
wasm**. Both exceed the 5 % gate, so the descriptor is `experimental: true`
until the iPhone figure is recorded. Levers, in order: `polyphony` (cost is
close to linear in sounding voices); an `-msimd128` build (measured: 7.3 % /
13.5 % with LLVM auto-vectorisation alone — hand-written `wasm_simd128`
intrinsics in `ModalBank::process` would approach Felt's NEON figure of 2.7 %
on Apple Silicon — but it needs a feature-detected second artefact, Safari <
16.4 cannot instantiate SIMD); and skipping the ghost pool render when no slot
is active. The memory footprint is 2.4 MB static (32 voices × 31 KB, 1 MB of
room delay lines), inside the 4 MB module.

Verification: `cpp/test/felt_piano_test.cpp` checks frequency→key mapping,
Felt's defaults, silence with no notes, the fundamental of A2/A4/C6 (Goertzel),
velocity level and brightness (share of energy above 1.5 kHz), felt darkening
and shortening, release vs held decay, sustain (hold, lift, inherit),
half-pedal ordering, sostenuto capture and release, same-key retrigger, 48 keys
through the steal path (≤ 32 voices, |x| ≤ 1, all freed), the polyphony cap,
output gain, width, room, the idle flush to exact zero (notes and pedal noise
alone), pitch and level at 44.1/48/96 kHz, and prints both CPU figures;
`src/dsp/__tests__/felt-piano-wasm.test.ts` repeats silence, fundamental,
release/sustain, the 48-key stress and the flush on the artefact, and pins the
note entry points.
