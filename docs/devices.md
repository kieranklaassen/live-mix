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

## Catalogue

| Device id           | Source                                                                        | Kind         | Params                                                                                                                                                             | `.wasm`  | Native cost                                                 | wasm cost (Node)                                            | Flag             |
| ------------------- | ----------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ----------------------------------------------------------- | ----------------------------------------------------------- | ---------------- |
| `dattorro`          | ambient-live's Dattorro plate                                                 | reverb       | mix, decay, damping, predelayMs                                                                                                                                    | 9,659 B  | —                                                           | 7.5 µs / block, 0.28 %                                      |                  |
| `fdn-reverb`        | kkfonie Tides (8-line FDN, breathing gate)                                    | reverb       | mix, decay, damping, predelayMs, size, breathRate, breathDepth                                                                                                     | 13,349 B | —                                                           | 31.7 µs / block, 1.19 %                                     |                  |
| `stereo-widener`    | kkfonie StereoWidener (byte-identical)                                        | spatial      | width                                                                                                                                                              | 3,553 B  | —                                                           | 3.8 µs / block, 0.14 %                                      |                  |
| `zita-rev1`         | Faust `re.zita_rev1_stereo`                                                   | reverb       | see `src/dsp/devices/faust/zita-rev1.ts`                                                                                                                           | 17,754 B | —                                                           | 7.8 µs / block, 0.29 %                                      |                  |
| `limiter-1176`      | Faust                                                                         | dynamics     | inputGain, outputGain                                                                                                                                              | 6,222 B  | —                                                           | 4.9 µs / block, 0.18 %                                      |                  |
| `true-peak-limiter` | live-mix (BS.1770 true-peak brickwall)                                        | master stage | ceilingDb, releaseMs, inputGainDb                                                                                                                                  | 5,135 B  | —                                                           | 6.3 µs / block, 0.23 %                                      |                  |
| `spectral-drifter`  | kkfonie Bloom `SpectralDrifter` (de-JUCEd)                                    | other        | mix, bloom, direction, season, seed, interval, decay, ageMode, age                                                                                                 | 12,418 B | 18.5 µs / block, 0.69 %                                     | 43.4 µs / block, 1.63 % (Atonal/Scatter, bloom 1)           |                  |
| `ether-reverb`      | kkfonie Ether (Freeverb as `juce::dsp::Reverb`, pre-delay, decay law, freeze) | reverb       | mix, decay, damping, predelayMs, size, freeze                                                                                                                      | 6,753 B  | 6.8 µs / block, 0.25 %                                      | 8.4 µs / block, 0.32 %                                      |                  |
| `felt-piano`        | kkfonie Felt (modal felt piano; ten DSP sources byte-identical)               | instrument   | felt, hardness, detune, stiffness, thump, action, pedalNoise, grit, resonance, damper, reverbMix, reverbSize, width, outputDb, sustain, sostenuto, soft, polyphony | 49,404 B | typical 152 µs / block, 5.7 %; worst 340 µs / block, 12.7 % | typical 218 µs / block, 8.2 %; worst 512 µs / block, 19.2 % | **experimental** |

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
