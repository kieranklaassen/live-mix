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
case is marked `experimental: true` in its registry descriptor until the
iPhone number is recorded and the flag is lifted by hand. Figures below were
measured on the CI VM (Intel Xeon, Node 22.14, emsdk 4.0.15); a current
iPhone's performance core is faster than this machine's, so they are upper
bounds.

## Catalogue

| Device id           | Source                                                                        | Kind         | Params                                                             | `.wasm`  | Native cost             | wasm cost (Node)                                  | Flag |
| ------------------- | ----------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------ | -------- | ----------------------- | ------------------------------------------------- | ---- |
| `dattorro`          | ambient-live's Dattorro plate                                                 | reverb       | mix, decay, damping, predelayMs                                    | 9,659 B  | —                       | 7.5 µs / block, 0.28 %                            |      |
| `fdn-reverb`        | kkfonie Tides (8-line FDN, breathing gate)                                    | reverb       | mix, decay, damping, predelayMs, size, breathRate, breathDepth     | 13,349 B | —                       | 31.7 µs / block, 1.19 %                           |      |
| `stereo-widener`    | kkfonie StereoWidener (byte-identical)                                        | spatial      | width                                                              | 3,553 B  | —                       | 3.8 µs / block, 0.14 %                            |      |
| `zita-rev1`         | Faust `re.zita_rev1_stereo`                                                   | reverb       | see `src/dsp/devices/faust/zita-rev1.ts`                           | 17,754 B | —                       | 7.8 µs / block, 0.29 %                            |      |
| `limiter-1176`      | Faust                                                                         | dynamics     | inputGain, outputGain                                              | 6,222 B  | —                       | 4.9 µs / block, 0.18 %                            |      |
| `true-peak-limiter` | live-mix (BS.1770 true-peak brickwall)                                        | master stage | ceilingDb, releaseMs, inputGainDb                                  | 5,135 B  | —                       | 6.3 µs / block, 0.23 %                            |      |
| `spectral-drifter`  | kkfonie Bloom `SpectralDrifter` (de-JUCEd)                                    | other        | mix, bloom, direction, season, seed, interval, decay, ageMode, age | 12,418 B | 18.5 µs / block, 0.69 % | 43.4 µs / block, 1.63 % (Atonal/Scatter, bloom 1) |      |
| `ether-reverb`      | kkfonie Ether (Freeverb as `juce::dsp::Reverb`, pre-delay, decay law, freeze) | reverb       | mix, decay, damping, predelayMs, size, freeze                      | 6,753 B  | 6.8 µs / block, 0.25 %  | 8.4 µs / block, 0.32 %                            |      |

Costs for the devices that predate this page were measured with the same Node
harness when it was introduced (U37); their native harnesses do not print a
timing.

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
rate-independent, damping, freeze (held level over 8 s, silence in, silence
out), 10 s of loud input at maximum feedback, the flush to exact zero, the 5 ms
host ramps, and prints the CPU cost; `src/dsp/__tests__/ether-reverb-wasm.test.ts`
repeats the mix law, onsets, tail-to-silence, freeze and stability checks on
the artefact.
