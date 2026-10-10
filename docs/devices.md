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
browser have been through since, and costs about twice as much: four Hall
Reverbs and two Shimmers took 4.6 % of real time flat out and 9.4 % at the
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
| `plate-reverb`      | ambient-live's plate (Dattorro 1997)                                          | reverb       | mix, decay, damping, predelayMs                                                                                                                                    | 10,383 B | —                                                           | 7.5 µs / block, 0.28 %                                      |                  |
| `fdn-reverb`        | kkfonie Tides (8-line FDN, breathing gate)                                    | reverb       | mix, decay, damping, predelayMs, size, breathRate, breathDepth                                                                                                     | 14,369 B | —                                                           | 31.7 µs / block, 1.19 %                                     |                  |
| `stereo-widener`    | kkfonie StereoWidener (byte-identical)                                        | spatial      | width                                                                                                                                                              | 3,878 B  | —                                                           | 3.8 µs / block, 0.14 %                                      |                  |
| `hall-reverb`       | Faust `re.zita_rev1_stereo`                                                   | reverb       | see `src/dsp/devices/faust/hall-reverb.ts`                                                                                                                         | 18,357 B | —                                                           | 7.8 µs / block, 0.29 %                                      |                  |
| `fet-limiter`       | Faust                                                                         | dynamics     | inputGain, outputGain                                                                                                                                              | 7,668 B  | —                                                           | 4.9 µs / block, 0.18 %                                      |                  |
| `true-peak-limiter` | live-mix (BS.1770 true-peak brickwall)                                        | master stage | ceilingDb, releaseMs, inputGainDb                                                                                                                                  | 5,813 B  | —                                                           | 6.3 µs / block, 0.23 %                                      |                  |
| `spectral-drifter`  | kkfonie Bloom `SpectralDrifter` (de-JUCEd)                                    | other        | mix, bloom, direction, season, seed, interval, decay, ageMode, age                                                                                                 | 12,930 B | 18.5 µs / block, 0.69 %                                     | 43.4 µs / block, 1.63 % (Atonal/Scatter, bloom 1)           |                  |
| `ether-reverb`      | kkfonie Ether (Freeverb as `juce::dsp::Reverb`, pre-delay, decay law, freeze) | reverb       | mix, decay, damping, predelayMs, size, freeze                                                                                                                      | 7,718 B  | 6.8 µs / block, 0.25 %                                      | 8.4 µs / block, 0.32 %                                      |                  |
| `felt-piano`        | kkfonie Felt (modal felt piano; ten DSP sources byte-identical)               | instrument   | felt, hardness, detune, stiffness, thump, action, pedalNoise, grit, resonance, damper, reverbMix, reverbSize, width, outputDb, sustain, sostenuto, soft, polyphony | 49,438 B | typical 152 µs / block, 5.7 %; worst 340 µs / block, 12.7 % | typical 218 µs / block, 8.2 %; worst 512 µs / block, 19.2 % | **experimental** |

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

| Device id         | Name               | Source              | Kind       | Params | `.wasm`   | Native cost per block | wasm cost per block (Node) | Latency (samples) | Memory (MB) |
| ----------------- | ------------------ | ------------------- | ---------- | ------ | --------- | --------------------- | -------------------------- | ----------------- | ----------- |
| `acoustic-guitar` | Acoustic Guitar    | live-mix            | instrument | 10     | 28,418 B  | 55.8 µs, 2.09 %       | 32.5 µs, 1.22 %            | 0                 | 4           |
| `ambient-comp`    | Ambient Compressor | live-mix            | dynamics   | 9      | 11,205 B  | 3.8 µs, 0.14 %        | 5.5 µs, 0.21 %             | 0                 | 4           |
| `ambient-eq`      | Ambient EQ         | live-mix            | eq         | 8      | 28,200 B  | 16.3 µs, 0.61 %       | 21.3 µs, 0.80 %            | 0                 | 4           |
| `ambient-limiter` | Ambient Limiter    | live-mix            | dynamics   | 5      | 9,318 B   | 10.0 µs, 0.38 %       | 12.0 µs, 0.45 %            | 77                | 4           |
| `analog-delay`    | Analog Delay       | live-mix            | delay      | 12     | 19,255 B  | 28.2 µs, 1.06 %       | 18.3 µs, 0.68 %            | 0                 | 4           |
| `analog-drive`    | Analog Drive       | live-mix            | drive      | 10     | 33,308 B  | 79.8 µs, 2.99 %       | 31.5 µs, 1.18 %            | 39                | 4           |
| `atmosphere`      | Atmosphere         | live-mix            | instrument | 10     | 33,556 B  | 44.5 µs, 1.67 %       | 34.8 µs, 1.31 %            | 0                 | 4           |
| `aurora`          | Aurora             | live-mix            | instrument | 10     | 23,749 B  | 34.3 µs, 1.29 %       | 28.9 µs, 1.08 %            | 0                 | 4           |
| `auto-filter`     | Auto Filter        | kkfonie Tatami      | eq         | 12     | 23,170 B  | 21.0 µs, 0.79 %       | 22.8 µs, 0.86 %            | 31                | 4           |
| `bloom-reverb`    | Bloom              | kkfonie Bloom       | reverb     | 8      | 25,205 B  | 68.9 µs, 2.58 %       | 82.4 µs, 3.09 %            | 0                 | 4           |
| `bowed-string`    | Bow                | live-mix            | instrument | 12     | 34,141 B  | 85.8 µs, 3.22 %       | 108.2 µs, 4.06 %           | 0                 | 4           |
| `cascade`         | Cascade            | live-mix            | texture    | 12     | 29,332 B  | 23.3 µs, 0.87 %       | 28.6 µs, 1.07 %            | 0                 | 16          |
| `chamber-strings` | Chamber Strings    | live-mix            | instrument | 10     | 38,707 B  | 55.5 µs, 2.08 %       | 44.3 µs, 1.66 %            | 0                 | 4           |
| `choir`           | Choir              | live-mix            | instrument | 12     | 33,143 B  | 66.9 µs, 2.51 %       | 46.7 µs, 1.75 %            | 0                 | 4           |
| `chord-harp`      | Chord Harp         | live-mix            | instrument | 8      | 28,108 B  | 90.2 µs, 3.38 %       | 15.4 µs, 0.58 %            | 0                 | 4           |
| `chorus`          | Chorus             | kkfonie Tatami      | modulation | 8      | 12,666 B  | 24.3 µs, 0.91 %       | 18.7 µs, 0.70 %            | 0                 | 4           |
| `clarinet`        | Clarinet           | live-mix            | instrument | 8      | 26,190 B  | 86.2 µs, 3.23 %       | 39.6 µs, 1.49 %            | 0                 | 4           |
| `drone`           | Drone              | live-mix            | instrument | 13     | 32,220 B  | 56.1 µs, 2.11 %       | 73.5 µs, 2.75 %            | 0                 | 4           |
| `drum-kit`        | Drum Kit           | live-mix            | instrument | 10     | 29,156 B  | 17.9 µs, 0.67 %       | 0.7 µs, 0.03 %             | 0                 | 4           |
| `dusk`            | Dusk               | live-mix            | instrument | 10     | 23,428 B  | 36.8 µs, 1.38 %       | 31.7 µs, 1.19 %            | 0                 | 4           |
| `echo-memory`     | Echo Memory        | live-mix            | delay      | 12     | 25,341 B  | 27.2 µs, 1.02 %       | 16.4 µs, 0.61 %            | 0                 | 20          |
| `ember`           | Ember              | kkfonie Tatami      | instrument | 43     | 37,239 B  | 55.8 µs, 2.09 %       | 75.8 µs, 2.84 %            | 16                | 4           |
| `expanse`         | Expanse            | live-mix            | reverb     | 11     | 31,432 B  | 60.4 µs, 2.27 %       | 33.3 µs, 1.25 %            | 0                 | 6           |
| `flanger`         | Flanger            | kkfonie Tatami      | modulation | 7      | 11,926 B  | 11.9 µs, 0.45 %       | 10.4 µs, 0.39 %            | 0                 | 4           |
| `flute`           | Flute              | live-mix            | instrument | 9      | 25,369 B  | 76.8 µs, 2.88 %       | 44.2 µs, 1.66 %            | 0                 | 4           |
| `fm-glass`        | Glass              | live-mix            | instrument | 12     | 26,809 B  | 90.2 µs, 3.38 %       | 42.0 µs, 1.57 %            | 0                 | 4           |
| `freq-shifter`    | Frequency Shifter  | live-mix            | pitch      | 10     | 14,333 B  | 26.8 µs, 1.01 %       | 18.9 µs, 0.71 %            | 0                 | 4           |
| `glitch`          | Glitch             | live-mix            | texture    | 12     | 21,163 B  | 10.3 µs, 0.38 %       | 5.3 µs, 0.20 %             | 0                 | 10          |
| `glitch-kit`      | Glitch Kit         | live-mix            | instrument | 9      | 30,863 B  | 2.6 µs, 0.10 %        | 0.6 µs, 0.02 %             | 0                 | 4           |
| `grain-cloud`     | Cloud              | live-mix            | texture    | 12     | 15,870 B  | 18.4 µs, 0.69 %       | 23.8 µs, 0.89 %            | 0                 | 10          |
| `grain-delay`     | Grain Delay        | live-mix            | delay      | 11     | 17,855 B  | 27.2 µs, 1.02 %       | 32.8 µs, 1.23 %            | 0                 | 10          |
| `grain-synth`     | Grain              | live-mix            | instrument | 14     | 32,018 B  | 61.6 µs, 2.31 %       | 72.0 µs, 2.70 %            | 0                 | 12          |
| `guitar`          | Guitar             | live-mix            | instrument | 10     | 30,037 B  | 48.6 µs, 1.82 %       | 27.3 µs, 1.02 %            | 0                 | 4           |
| `half-speed`      | Half Speed         | live-mix            | pitch      | 10     | 27,007 B  | 48.4 µs, 1.82 %       | 33.6 µs, 1.26 %            | 0                 | 8           |
| `handpan`         | Handpan            | live-mix            | instrument | 9      | 25,680 B  | 21.4 µs, 0.80 %       | 10.2 µs, 0.38 %            | 0                 | 4           |
| `harp`            | Harp               | live-mix            | instrument | 10     | 28,801 B  | 14.2 µs, 0.53 %       | 17.1 µs, 0.64 %            | 0                 | 4           |
| `horns`           | Horns              | live-mix            | instrument | 9      | 34,673 B  | 53.2 µs, 2.00 %       | 43.9 µs, 1.64 %            | 0                 | 4           |
| `ladder-bass`     | Ladder Bass        | live-mix            | instrument | 10     | 19,637 B  | 34.0 µs, 1.28 %       | 0.8 µs, 0.03 %             | 0                 | 4           |
| `lattice`         | Lattice            | kkfonie Lattice     | pitch      | 59     | 34,723 B  | 52.7 µs, 1.98 %       | 62.2 µs, 2.33 %            | 0                 | 4           |
| `low-bitrate`     | Low Bitrate        | live-mix            | texture    | 10     | 32,898 B  | 11.7 µs, 0.44 %       | 12.6 µs, 0.47 %            | 4096              | 4           |
| `mallets`         | Mallets            | live-mix            | instrument | 10     | 27,223 B  | 27.3 µs, 1.02 %       | 2.3 µs, 0.09 %             | 0                 | 4           |
| `micro-looper`    | Micro Looper       | live-mix            | delay      | 10     | 40,216 B  | 40.5 µs, 1.52 %       | 43.2 µs, 1.62 %            | 0                 | 16          |
| `modal-bells`     | Bells              | live-mix            | instrument | 12     | 24,210 B  | 58.5 µs, 2.20 %       | 40.6 µs, 1.52 %            | 0                 | 4           |
| `noise-floor`     | Noise Floor        | live-mix            | texture    | 8      | 44,023 B  | 20.0 µs, 0.75 %       | 15.7 µs, 0.59 %            | 0                 | 4           |
| `octaves`         | Octaves            | live-mix            | pitch      | 10     | 65,517 B  | 95.7 µs, 3.59 %       | 48.2 µs, 1.81 %            | 0                 | 4           |
| `organ`           | Reed Organ         | live-mix            | instrument | 13     | 23,100 B  | 127.0 µs, 4.76 %      | 70.4 µs, 2.64 %            | 0                 | 4           |
| `outdoors`        | Outdoors           | live-mix            | instrument | 9      | 103,411 B | 81.2 µs, 3.05 %       | 35.4 µs, 1.33 %            | 0                 | 4           |
| `pad-follower`    | Pad Follower       | live-mix            | texture    | 10     | 47,099 B  | 41.8 µs, 1.57 %       | 38.3 µs, 1.43 %            | 0                 | 4           |
| `patina`          | Patina             | live-mix            | texture    | 8      | 36,191 B  | 39.8 µs, 1.49 %       | 29.2 µs, 1.10 %            | 271               | 4           |
| `pedal-steel`     | Pedal Steel        | live-mix            | instrument | 9      | 31,754 B  | 25.7 µs, 0.97 %       | 23.6 µs, 0.88 %            | 0                 | 4           |
| `phaser`          | Phaser             | kkfonie Tatami      | modulation | 9      | 14,298 B  | 13.9 µs, 0.52 %       | 10.9 µs, 0.41 %            | 0                 | 4           |
| `pitch-shifter`   | Pitch Shifter      | live-mix            | pitch      | 12     | 50,960 B  | 64.8 µs, 2.43 %       | 41.7 µs, 1.56 %            | 0                 | 6           |
| `radio`           | Radio              | live-mix            | texture    | 9      | 33,188 B  | 25.8 µs, 0.97 %       | 22.2 µs, 0.83 %            | 0                 | 4           |
| `re-amp`          | Re-amp             | live-mix            | drive      | 10     | 53,528 B  | 98.6 µs, 3.70 %       | 62.5 µs, 2.34 %            | 39                | 4           |
| `reverse-delay`   | Reverse Delay      | live-mix            | delay      | 8      | 15,057 B  | 17.1 µs, 0.64 %       | 13.2 µs, 0.50 %            | 0                 | 20          |
| `rotary`          | Rotary             | live-mix            | modulation | 9      | 16,495 B  | 25.3 µs, 0.95 %       | 27.2 µs, 1.02 %            | 0                 | 4           |
| `sampler`         | Sampler            | live-mix            | instrument | 13     | 27,588 B  | 46.8 µs, 1.76 %       | 30.9 µs, 1.16 %            | 0                 | 24          |
| `saturator`       | Saturator          | kkfonie Tatami      | drive      | 9      | 23,626 B  | 46.1 µs, 1.73 %       | 40.5 µs, 1.52 %            | 39                | 4           |
| `shaped-reverb`   | Shaped Reverb      | live-mix            | reverb     | 12     | 34,325 B  | 57.2 µs, 2.15 %       | 35.5 µs, 1.33 %            | 0                 | 6           |
| `shimmer`         | Shimmer            | live-mix            | reverb     | 10     | 26,901 B  | 70.4 µs, 2.64 %       | 39.1 µs, 1.47 %            | 0                 | 4           |
| `spectral-blur`   | Spectral Blur      | live-mix            | texture    | 9      | 18,615 B  | 42.8 µs, 1.60 %       | 53.1 µs, 1.99 %            | 2304              | 4           |
| `spring-reverb`   | Spring             | live-mix            | reverb     | 9      | 22,946 B  | 33.2 µs, 1.25 %       | 26.1 µs, 0.98 %            | 0                 | 4           |
| `stereo-detune`   | Stereo Detune      | live-mix            | spatial    | 8      | 25,561 B  | 51.9 µs, 1.95 %       | 28.9 µs, 1.08 %            | 0                 | 4           |
| `string-machine`  | String Machine     | live-mix            | instrument | 10     | 19,113 B  | 31.0 µs, 1.16 %       | 22.4 µs, 0.84 %            | 0                 | 4           |
| `sustainer`       | Sustain            | live-mix            | texture    | 11     | 41,796 B  | 23.9 µs, 0.90 %       | 23.8 µs, 0.89 %            | 0                 | 4           |
| `swarm-reverb`    | Swarm Reverb       | live-mix            | reverb     | 12     | 28,358 B  | 51.3 µs, 1.93 %       | 31.6 µs, 1.18 %            | 0                 | 4           |
| `swell`           | Swell              | live-mix            | dynamics   | 8      | 4,842 B   | 3.9 µs, 0.15 %        | 5.2 µs, 0.20 %             | 960               | 4           |
| `sympathetic`     | Sympathetic        | kkfonie Sympathetic | reverb     | 7      | 31,992 B  | 19.7 µs, 0.74 %       | 23.1 µs, 0.87 %            | 0                 | 4           |
| `tamer`           | Tamer              | live-mix            | eq         | 6      | 35,182 B  | 46.2 µs, 1.73 %       | 14.2 µs, 0.53 %            | 0                 | 4           |
| `tanpura`         | Tanpura            | live-mix            | instrument | 8      | 30,393 B  | 58.6 µs, 2.20 %       | 55.0 µs, 2.06 %            | 0                 | 4           |
| `tape`            | Tape               | live-mix            | texture    | 10     | 22,263 B  | 45.2 µs, 1.70 %       | 33.7 µs, 1.27 %            | 415               | 4           |
| `tape-echo`       | Tape Echo          | live-mix            | delay      | 10     | 16,147 B  | 19.5 µs, 0.73 %       | 18.3 µs, 0.69 %            | 0                 | 4           |
| `tape-loop`       | Tape Loop          | live-mix            | delay      | 10     | 18,730 B  | 19.3 µs, 0.72 %       | 21.3 µs, 0.80 %            | 0                 | 24          |
| `tape-orchestra`  | Tape Orchestra     | live-mix            | instrument | 12     | 41,483 B  | 28.8 µs, 1.08 %       | 32.8 µs, 1.23 %            | 0                 | 4           |
| `thesis`          | Thesis             | kkfonie Thesis      | instrument | 15     | 36,421 B  | 21.1 µs, 0.79 %       | 19.6 µs, 0.73 %            | 0                 | 4           |
| `tine-piano`      | Tine               | live-mix            | instrument | 11     | 17,742 B  | 76.9 µs, 2.88 %       | 44.9 µs, 1.68 %            | 0                 | 4           |
| `tremolo`         | Tremolo            | live-mix            | modulation | 9      | 12,884 B  | 7.7 µs, 0.29 %        | 8.1 µs, 0.30 %             | 0                 | 4           |
| `vintage-digital` | Vintage Digital    | live-mix            | texture    | 8      | 28,499 B  | 71.7 µs, 2.69 %       | 15.5 µs, 0.58 %            | 129               | 4           |
| `vinyl`           | Vinyl              | live-mix            | texture    | 10     | 37,003 B  | 38.0 µs, 1.43 %       | 26.6 µs, 1.00 %            | 0                 | 8           |
| `vowel-reverb`    | Vowel Reverb       | live-mix            | reverb     | 12     | 42,778 B  | 106.1 µs, 3.98 %      | 53.0 µs, 1.99 %            | 0                 | 4           |
| `wavetable`       | Wavetable          | live-mix            | instrument | 12     | 25,229 B  | 48.4 µs, 1.82 %       | 35.9 µs, 1.34 %            | 0                 | 5           |
| `west-coast`      | West Coast         | live-mix            | instrument | 12     | 31,237 B  | 115.7 µs, 4.34 %      | 8.2 µs, 0.31 %             | 0                 | 4           |
| `zither`          | Zither             | live-mix            | instrument | 13     | 50,006 B  | 50.8 µs, 1.91 %       | 27.9 µs, 1.05 %            | 0                 | 4           |
| `zone-sampler`    | Zone Sampler       | live-mix            | instrument | 7      | 32,368 B  | 48.0 µs, 1.80 %       | 6.5 µs, 0.24 %             | 0                 | 64          |

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
- **The fifteen ambient instruments** (Acoustic Guitar, Aurora, Chamber
  Strings, Chord Harp, Clarinet, Dusk, Flute, Guitar, Handpan, Harp, Horns,
  Ladder Bass, Mallets, Pedal Steel, Tanpura) all stay under 2.1 % in wasm
  with eight notes. Two wasm figures are of notes that have died: Ladder Bass
  is one voice whose default patch is a pluck, and Mallets' bars ring out and
  sleep, so read their native figures (a held drone, sixteen bars rolled).
  Heaviest loads measured natively: all 32 guzheng strings of the Harp with
  bends and full Halo 3.7 %, Chord Harp sweeping six keys over four octaves
  3.4 %, twelve Chamber Strings notes of six players each 3.1 %, eight Horns
  notes of four players with Harmony and Breath 2.8 %.
- **The second ambient round** (Analog Delay to Zither, twenty-one effects
  and four instruments): every one is under the flag. The wasm column is the
  default patch on a tone; the native column is each harness's heaviest
  setting, and some of those are well above the default: Octaves with all
  four voices costs 3.5 to 3.7 % in wasm on chords and 4.6 % on noise (1.8 %
  at its default), Vowel Reverb with the vowel full up and moving 4.0 %
  natively, Re-amp at its heaviest 3.7 %. Pitch Shifter's Chords mode at
  96 kHz with both voices costs 4.1 %. West Coast's wasm figure is of plucks
  that have died; eight held notes at its heaviest cost 3.5 % in wasm (4.3 %
  natively). Sustain analyses once per caught note: up to three blocks of a
  catch cost 6 to 9 % of their time, the rest under 1 %. Low Bitrate (4,096
  samples), Vintage Digital (129) and the two drives (39) report latency.
- **The two kits** (Drum Kit, Glitch Kit) play one-shots, so the wasm figure,
  eight notes held for ten seconds, is of hits that have died and a device
  asleep. Read the native one: a busy bar on every key, played round. Before
  the Drum Kit's noise envelope was flushed its tail ran on subnormals and the
  same bar cost 1.8 %.
- **Memory** is the module's fixed linear memory (`memoryMb`), which holds the
  delay and sample buffers: 20 to 24 MB for the long loops and the sampler,
  64 MB for the zone sampler's pool of sounds ([zone-sampler.md](./zone-sampler.md)).
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

Building the fifteen ambient instruments added to the list:

- **Oscillators.** `kit::BlepOsc` cannot give a saw, a pulse and a sub octave from one phase, and its two-sample correction leaves fold-back near -40 dB at C6 with the filters open. Dusk, Aurora, Ladder Bass and Chord Harp each carry their own oscillator (a four-sample PolyBLEP, a closed-form band-limited pulse).
- **A driven pipe.** Flute, Clarinet and Horns each carry a `driven_pipe.h` (a closed-form harmonic series whose brightness follows breath pressure, with noise through a comb); the three were written apart and want to be one kit block.
- **A resonator bank.** Chamber Strings (`body.h`), both guitars, Harp and Tanpura each build a bank of fixed body resonances by hand.
- **Plucked strings.** `kit::PluckedString` cannot make the top of a note die more than about `(high_hz / f0)²` faster than its fundamental, so above about 900 Hz Harp and Guitar set the high decay nearer the fundamental; its pluck comb is whole-sample; and a line too short for the lowest note at the host's rate plays sharp without saying so (`lowest_hz` is there to be asked).
- **Voices.** Two faults found here are likely in older instruments and were not checked there: a voice whose `level()` is stale until the next control tick is stolen by the second note of a chord (Bells), and a key struck twice inside a steal fade can leave a voice sounding (Bow, Bells). The same goes for smoothers that keep gliding from before a sleep.
- **Test kit and smoke test.** Every harness carries its own narrow-band level, fine pitch and spectrum helpers; `max_step` does not see a click under a bright tone; the smoke test times a voice that has gone to sleep when the default patch decays; and conformance has no check for a key struck again in phase, which piles a modal note up.

Building the twenty-one effects and four instruments of the second ambient round added:

- **Bad input.** `take_input` hands on whatever the host wrote, and `check_effect` never feeds a bad sample. One not-a-number sample lodged in a filter or a feedback loop of most of the new effects until each was given a guard on entry (not a number becomes silence, an absurd value is held to a bound), with a harness check. The guard belongs in `take_input` and the check in `check_effect`; older devices have neither (`tape-echo` still sticks on a NaN).
- **Reading between samples.** There is no windowed-sinc read: Vinyl (`sinc_read.h`), Echo Memory (`memory.h`) and Stereo Detune (`SpliceShifter.h`) each wrote one. The splice-search shifter and the stereo ring of any length now each exist three times.
- **Filters and transforms.** No Butterworth cascade (Radio's `radio_parts.h`), no bank of state-variable filters with shared coefficients and no fast dB-to-gain (Vowel Reverb's `vowels.h`), no short halfband (Octaves' `Halfband.h`), no MDCT and no FFT of a size chosen at run time (Low Bitrate's `mdct.h`).
- **Noise.** `kit::Noise::seed` does not reset the pink filter's state, so a second `init` is not the same sound as the first; Outdoors rebuilds its voices instead.
- **Sleep.** `kit::IdleGate::asleep()` with a short hold can read true after one silent 2,048-frame block at a low sample rate. A noise bed that has to outlast the gaps of slow playing (Vinyl, Radio, Noise Floor: fourteen seconds, then a fade) keeps its own timer; the gate's hold is fixed.
- **Test kit.** `check_instrument` still has no block-size check, and Zither's output depended on the host's block size while strings were being stolen until the second worker's own render showed it.

### The second ambient round: what measurement says is weak

None of these twenty-five has been listened to. Each was built by one worker and checked by a second, who rebuilt it, rendered every preset on played material, swept and jumped every control while sounding and fed it broken samples. What that left open, device by device, so the first listen knows where to go:

| Device            | Weak or unproven                                                                                                                                                                                                                                      | Listen first                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `octaves`         | Dense or bright chords come out rougher than single notes (one up: 26 dB clean in the middle, 13 dB at worst); a held note's octave drops for a moment when another note enters a few semitones away; a low legato step of a tone answers weakly      | An arpeggio over held notes; the first tenth of a second of a struck chord; a low legato line  |
| `pitch-shifter`   | The default mode, Chords, answers 193 ms late, so on plucks the shifted voice can read as an echo; Smooth wavers on chords; low attacks smear                                                                                                         | A piano through the default; a note struck over a held pad                                     |
| `stereo-detune`   | At Mix 1 a stereo source loses its side (the copies come from the mono sum); a level hold stops chords sagging and leaves stray tones 37 dB down                                                                                                      | A soft held chord and one held note at the default, for a copy fading out and back on one side |
| `half-speed`      | Wet peaks run up to 3.4 dB over the dry peak where slowed notes overlap                                                                                                                                                                               | "Smooth octave" on a phrase                                                                    |
| `analog-drive`    | Auto Gain is a fixed curve: a quiet pad gets louder as Drive rises                                                                                                                                                                                    | A quiet pad with Drive turned up                                                               |
| `re-amp`          | Part-way Mix notches near 3 kHz (dry against the speaker's phase); the far presets are wide (the mono sum is 3 dB down); a held pure tone far away fades slowly by 9 dB or more                                                                       | Held single notes on "Down the hall"                                                           |
| `vintage-digital` | Part-way Mix dips at 0.44 of Rate; Jitter near 1 hisses                                                                                                                                                                                               | "Dusty"                                                                                        |
| `low-bitrate`     | Residue is spiky on struck notes; the default is subtle on a dull pad; 4,096 samples of latency                                                                                                                                                       | Residue on a pad, then on a piano                                                              |
| `vinyl`           | The crackle's voicing                                                                                                                                                                                                                                 | The default on sparse notes: does the surface sit right through the gaps                       |
| `radio`           | Output is mono; on "Far station" the music is under the static about half the time, by design; the bed builds over the first slow notes                                                                                                               | "Far station"; Sideband between notes                                                          |
| `noise-floor`     | Vinyl and Static were re-voiced with a ceiling on their ticks and may be too woolly                                                                                                                                                                   | "Old record", "Radio static"                                                                   |
| `glitch`          | Level depends on what an event lands on (0.8 to 2.4 dB down at Chance 0.6)                                                                                                                                                                            | Soft stumbles on a pad                                                                         |
| `micro-looper`    | Double speed folds back on very bright held material; a loop shorter than about fifty periods of the note can land off phase                                                                                                                          | A held note through the default, for a dip where the loop joins                                |
| `cascade`         | A held tone whose period divides Time piles up to +10 dB in Drone with many repeats                                                                                                                                                                   | "Long drone" on one held note                                                                  |
| `echo-memory`     | The echo leans left by 1 to 1.5 dB at the default Spread (the first repeat lands left)                                                                                                                                                                | The default on a mono source                                                                   |
| `sustainer`       | A note under about -37 dBFS is not caught at the default Sensitivity; a note with vibrato is held at the pitch of the instant it was caught; a catch made while the last chord still fades keeps a ghost of it; the default sits 2 to 2.6 dB over dry | A bowed or sung note with vibrato; a slow pad swell; a fast run into a chord                   |
| `pad-follower`    | The pad is sines with a section's movement, so it may read as an organ with chorus; on a sustained source the dry sound and the pad beat slowly                                                                                                       | An organ or synth chord held at the default; lower Ensemble if it swims                        |
| `analog-delay`    | The compander softens the attack of each repeat; "Runaway" never ends; a clock whine 62 dB down at the longest time with Age at 1                                                                                                                     | Plucked notes through the default                                                              |
| `shaped-reverb`   | A held pure tone sits on the comb of the taps                                                                                                                                                                                                         | Gate and Reverse on single struck notes                                                        |
| `vowel-reverb`    | The formant table is from memory; presets heavy on the vowel wander 1.4 to 2.4 dB on a steady chord; a slow balance trim on the wet side is unheard                                                                                                   | A held pad chord at the default; a hard-panned source                                          |
| `swarm-reverb`    | Each note sits a little left or right (-2.4 to +1.4 dB over a phrase) and at its own level: the comb of fourteen taps; above Modulation 0.5 held notes swell and fade                                                                                 | Single held notes up the keyboard at the default                                               |
| `tape-orchestra`  | A leveller takes most of the pumping out of held keys (1.1 to 2.9 dB left); keys above 4 kHz alias 54 to 60 dB down; horns and choir speak slowly                                                                                                     | One high choir, reed or flute key held for twenty seconds                                      |
| `west-coast`      | Plucks are peaky (crest 19 dB) and nearly mono; aliasing 50 dB down in the worst corner                                                                                                                                                               | The default pluck; "Slow bloom"                                                                |
| `zither`          | No stiffness, so partials are exactly harmonic; the finger and body detail is subtle; ten loud keys reach the limiter on three presets                                                                                                                | A strummed chord on the chord zither presets                                                   |
| `zone-sampler`    | Nobody has listened to it; not loaded with an instrument another tool made; the previews play three built-in tones, so its bank presets are untried on real instruments                                                                               | A loop's crossfade on a real recording; keys between two zones; a steal at 48 voices           |
| `outdoors`        | Birds are whistled syllables and frogs a formant buzz, so both may read as synthetic                                                                                                                                                                  | Birds, the frog buzz, the near crack of thunder                                                |

### The two kits: what measurement says is weak

Neither kit has been listened to. Each was built by one worker and checked by
a second, who rebuilt it, played every key at five octaves and three sample
rates, swept every control and broke the code on purpose to see the harness
catch it (63 changes to the Drum Kit, 43 caught at first and all that change
the output caught now). What that left open:

| Device       | Weak or unproven                                                                                                                                                                                                                                                                                 | Listen first                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `drum-kit`   | Every drum is a model, none a recording, and whether a kick reads as a kick is unheard; short or dark also means quieter for the hats and shaker (Length 0.25: shaker 11 dB down); Drive is louder (1 to 5 dB at 1); a drum struck at two octaves at once is one drum, the second cuts the first | The four kits on one bar; "Muffled"; the hats with Tone turned down; a kick an octave down |
| `glitch-kit` | A click's level is set as it is struck, so Tone moved under a ringing crackle does not re-level it; under Crush 1 a click's level wanders 6 dB with its octave; in a stutter the click grain is 10 dB under the pip grain in energy at equal peak; Crush does nothing below 0.04 at 44.1 kHz     | Clicks up and down the octaves; "Low bitrate kit"; the stutter with Scatter up             |

A drum is one drum whatever octave its key is in: struck at two octaves at
once, the second strike cuts the first in 4 ms. Closed hat and shaker choke
the open hat in the order notes arrive, so an open hat then a closed one in
the same block leaves only the closed one. The keys of both kits are in
`rhythm.ts` (`KIT`, `FAULT`) and in [factory.md](./factory.md#kits).

### The four bass instruments: what measurement says is weak

None of the four has been listened to. Each was built by one worker and read
by a second, who measured the pitch of every preset from E0 to A3 at several
sample rates, looked for a click at every kind of key change, played every
preset on a bass line, moved every control end to end against what its
description says and broke the device on purpose to see whether its harness
noticed. What that left open:

| Device        | Weak or unproven                                                                                                                                                                                                                                                                                                                                                                                                      | Listen first                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `sub-bass`    | A sine with harmonics added up to the seventh, so its held presets differ mostly in how they start, fall and glide; "Pure sine" has nothing over its fundamental and is not heard on small speakers; with Volume at the top a high key folds back 37 dB down                                                                                                                                                          | "Soft sub" against "Pure sine" on the speakers a piece is for; "Deep dive"           |
| `fm-bass`     | "Held hum" and "Deep weight" (Ratio 1/2) sound an octave under the key; at Ratio 1/2 with Depth near the top, Sub cancels that lower partial (no preset goes there); "Low growl" struck at full gain has its fundamental 22 dB under the rest for 0.15 s; the loudest corner (Ratio 7, Depth 0.95, Sub 1, from B flat 4) passes the clip knee                                                                         | "Low growl" played hard; "Held hum" for the octave it reads as                       |
| `acid-bass`   | A key pressed over a held one slides, comes back to full loudness and does not strike the filter or the accent again, so a line of keys that all overlap opens the filter once; an accent (a key struck over 0.7) also shortens the decay; at C4 "Held sub tone" and "Dub weight" are 14 dB thinner than at A1                                                                                                        | "Rubber slides" and "Long glide drone" with overlapping keys; Drive on a dark square |
| `string-bass` | Growl is trains of impulses through a band-pass, not a model of a string on a neck; Mute at the top flattens a note by up to 8 cents; four strings struck at full gain pass the clip knee on thirteen presets (by up to 8 dB on "Near the bridge") and one string does on three; every pluck differs a little by design, so a loop made of it never comes round to the same samples; the upright's thump has no pitch | "Singing fretless" on a slow line; "Slapped upright"; four low strings played hard   |

## Effect presets

Every effect comes with presets of its own: sixteen each, fewer for the eight
that say why not in `FEWER_PRESETS` (`src/dsp/__tests__/effect-preset-support.ts`),
824 over the 54 effects. A preset lists only what it changes and, loaded by
name, puts the rest back where the effect starts, so what it sounds like does
not depend on the preset that was on before.

Each is rendered alone on two things and measured
(`src/dsp/__tests__/effect-presets*.test.ts`, in `pnpm test`): the dry electric
piano a chain preview plays, and that piano under a swell of bright saws, 4 dB
over full scale, for the presets that only bite on a loud or bright signal. A
preset passes when it

- puts out numbers, peaks under -1 dBFS on the piano and leaves no offset;
- is within 12 LU under and 6 LU over the dry phrase;
- is told from the dry phrase, unless it is the effect as it starts;
- is told from every sibling.

"Told from" is a distance between two sounds as grids of level, eighteen bands
by 43 ms frames, for the middle and the sides, over the cells within 50 dB of
the loudest: 1 is about the least a listener notices and the bar, 3 is plainly
another sound. A delay of a few samples does not count, as it would sample by
sample. The presets named in `QUIET_PRESETS` are let off the last two rules:
the settings a host's mixer starts a channel's EQ and compressor on, and the
limiter's ways of doing one job.

**A shipped preset never changes what it loads.** A saved score names the
presets it loads (`{ deviceId, preset, params }`) and leaves the rest to the
device's defaults, and so do the factory sounds, chains and packs. Retune a
preset in place and every piece saved with it sounds different the next time
it is opened. So a retune gets a new name, and the old name moves to the
device's `retiredPresets` with the settings it had: `resolvePreset` and
`hasPreset` still find it, and no list shows it. Fifteen presets were retuned
here (up to 14 LU over the dry phrase, 12 LU under it, or too close to it or
to a sibling), and each is both: auto-filter "Auto-Wah" as it was, and "Touch
wah" as the retune. The factory sounds that loaded one name the retune and
carry the old value of the retuned control as `params`, so they resolve to
what they were tuned with.

`src/dsp/__tests__/shipped-presets.json` holds every preset that has shipped,
on every device, with every parameter filled in, and
`shipped-presets.test.ts` holds the devices to it: a changed value, a changed
default or a name that no longer loads fails the suite and says what to do. A
new preset, device or parameter is added to the file with
`UPDATE_SHIPPED_PRESETS=1 pnpm vitest run src/dsp/__tests__/shipped-presets.test.ts`,
which adds what is missing and never changes a row that is there.

A saved score names the presets it loads, so a preset that is renamed keeps
its old name in the device's `formerPresets` (old name to the name of today),
which `resolvePreset` and `hasPreset` follow. Five were renamed here. Three
carried a product's name: tape-echo "Space echo" is "Warm repeats", swell
"Slow gear" is "Slow attack", tremolo "Brownface shimmer" is "Harmonic
shimmer". Two leaned on a record's title: tape-echo "Discreet" is "Short and
soft", tape "Disintegrating loop" is "Worn thin". The factory sounds name the
new ones.

**A shipped device keeps answering to its id.** A saved score, patch or
preset names a device by its id, so a device that is renamed lists the id it
had in `formerIds` on its descriptor. The registry finds it under each of them
(`has`, `get`, `describe`, `create`, `presets`), `resolveId` gives the id of
today, and `ids` and `list` show the device once. A document saved under the
old id validates and renders as it is; `parseScore(input, { devices })` and
`withCurrentDeviceIds(score, devices)` move it on to the new id, for a host
that keys anything of its own by device id, and leave instance ids alone.
`describeStockWasmDevice(id)` is the same lookup over the stock WASM devices
with no registry, which is what `renderPatch` uses. Three devices were renamed
here, because each carried a maker's or a product's name: `dattorro` is
`plate-reverb`, `zita-rev1` is `hall-reverb`, `limiter-1176` is `fet-limiter`.
Their sources and exports follow the new ids, and the three `.wasm` files are
byte for byte what they were. The rows of `shipped-presets.json` under the old
ids stay as they are and are still checked, through the former id.

The bench the presets were written at prints a line per preset:

```sh
EFFECT_PRESETS=tape-echo,chorus pnpm vitest run src/dsp/__tests__/effect-presets.test.ts
EFFECT_PRESETS=all pnpm vitest run src/dsp/__tests__/effect-presets.test.ts   # tmp/effect-presets-all.txt
```

None of them has been listened to. What the bench does not show, for the first
listen:

- **Latency.** `low-bitrate` and `spectral-blur` are not compensated in the
  render, so even a transparent setting reads 4 to 5.5 from the dry phrase.
  Their subtle presets ("Watery trace", "Faint haze") were measured against a
  transparent setting of the same effect instead.
- **Anything longer than the render.** A loop of 8 s or more never returns
  inside it ("Endless hold" on `tape-loop` is 7 s for that reason), and the
  rotary's rotors start at speed, so its acceleration does not show.
- **A pitch wobble in mono.** "Pitch wobble" on `tremolo` passes by a slight
  left and right offset, not by more wobble.
- **Freeze and Hold.** No preset loads frozen or held: nothing has been played
  at that moment, so the wet side would be silent (`expanse`, `grain-cloud`,
  `spectral-blur`, `sustainer`).
- **Level where there is no trim.** `swell`, `lattice`, `flanger`, `phaser`,
  `tremolo`, `radio` and `vinyl` have no output control, so some of their
  presets sit 3 to 6 LU under the dry phrase; "Piano to pad" on `swell` is
  8.6 LU under. The presets with "alone" or "only" in the name are all wet,
  for a send.

## Instrument presets

Every instrument comes with sixteen presets of its own (Ember has seventeen),
657 over the 41 instruments: the list a player steps through where the
instrument stands, apart from the bank's sounds, which are an instrument with
effects after it. Until this list was filled most instruments had six.

Each is played alone, with no effect after it and not normalised, on the
phrase most of the instrument's bank sounds are auditioned with, and measured
(`src/dsp/__tests__/instrument-presets.test.ts`, in `pnpm test`; the limits
are `INSTRUMENT_PRESET_LIMITS` in `instrument-preset-support.ts`). A preset
passes when it

- puts out numbers, is heard (the loudest 400 ms over -50 dBFS), peaks under
  -3 dBFS and leaves no offset;
- has its loudest 400 ms within 6 dB of the middle preset of its instrument,
  so stepping through the list does not send a hand to the fader;
- is 1 dB or more from every sibling on the print the bank's sounds are told
  apart by (`soundPrint`, `printDistance`);
- has a name of 20 characters at most, as it stands beside the instrument's.

Thirty-nine presets that shipped before the limits sit outside one of them and
stay as they shipped, listed with what each is outside of in `AS_SHIPPED`: a
shipped preset never changes what it loads. No preset written since is let
off. The level is measured against the middle of the list, so a preset added
to a list can carry a shipped one across the line.

`INSTRUMENT_REPORT=1 INSTRUMENT_PRESETS=harp pnpm vitest run src/dsp/__tests__/instrument-presets.test.ts`
prints, for one instrument, what each preset measured, its nearest sibling and
how far apart they are, and writes the same to `tmp/instrument-presets/`.

What the measure does not hear, so what a preset's name rests on is the DSP as
it was read: the phrase's notes are short and overlap, so a glide, a slow
vibrato, a roll and an attack of seconds are under-measured; the print mostly
follows level over time, less so timbre; and nobody has listened to them.

What reading the instruments for these presets turned up, none of it changed
here:

- `ladder-bass`: Wave mixes a saw and a square of opposite polarity, so near
  0.42 every odd harmonic cancels and the note is a saw an octave up, about
  11 dB quieter; the shipped "Singing lead" (0.3) and "Rubber pluck" (0.6) sit
  in it. At Beat 0 the two oscillators are never brought back in step, so a
  preset with no beat can come up thin after one with a beat.
- `thesis`: it has no volume, and a low Resonance is far louder (every band
  shares one noise source); Rate does nothing in Gravity.
- `tine-piano`: Drive has no make-up, so a loud note gets quieter as it rises.
- `bowed-string`: Position is barely heard under the bow; only Pluck hears it.
- `handpan`: in the tongue drum Shimmer moves only the weak octave.
- `modal-bells`: Release does nothing while it is longer than Decay.
- `flute`: Chiff does next to nothing at attacks over a tenth of a second.
- `organ`: Breath at full is about 19 dB under one held key.
- `felt-piano`: the pedal's noise sounds only when Sustain crosses halfway.
- `sampler`: Crossfade is ignored unless Loop is Forward.
- `zone-sampler`: its three built-in tones have nothing above about 2.6 kHz.
- `wavetable`: Spread widens nothing while Detune and Motion are both 0.
- `drone`: Shape does nothing at Partials 0. `west-coast`: Colour does
  nothing on a pure sine.

## ambient-limiter: auto gain

With `autoGain` above 0 the limiter turns a quiet mix up by itself, by at most
that many dB, to the line its ride works to (Ceiling − 0.5 dB, read before
Gain). It starts at the setting and gives way to what stands over the line:
the first 3 s of sound set it (50 ms), after that a sustained over is taken out
of it with a 3 s time constant while the ride holds the over, handed back to
the ride dB for dB so the output does not dip. It rises 1.2 dB a minute and
never on what is under −45 dBFS, and it is kept through a sleep, so a quiet
passage stays quiet and a tail dies away as it would. At 0 the device is what
it was before the parameter, sample for sample
(`node scripts/same-sound.mjs ambient-limiter --shipped`).

A file cannot be found out as it plays: it would start too loud and come down
over its first swell. An export that ends in this limiter with Auto gain on
leaves it out of the graph and runs the render through it afterwards:

```ts
import { limitRendered } from '@kieranklaassen/live-mix/dsp'

const { autoGainDb } = await limitRendered(audio, { ceiling: -0.3, autoGain: 12 })
```

It hears the whole of `audio` once, takes the lowest its auto gain came to, and
then limits with that one gain on what goes in and Auto gain off, in place and
with the lookahead taken off again (mono or stereo, at any rate). That is the
level the piece has live once the limiter has heard it through.

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
