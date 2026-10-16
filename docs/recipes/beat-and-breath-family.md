# Recipe: the beat and breath family

Nine devices share three kit headers. None is part of `kit.h`: include `kit.h`, then the one you need. Each header opens with a usage sketch, and each is proved by its own native test (`cpp/test/beat_test.cpp`, `colour_test.cpp`, `band_test.cpp`). A builder does not change these headers and does not write a private copy of a law: a fault or a missing piece is reported, fixed once, and every device takes the fix.

## What each header gives

| Header     | Piece                                     | Call                                                                                                                                                       |
| ---------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beat.h`   | Slow clock, a phase in cycles in `double` | `clock.phase`, then `clock.step(kit::SlowClock::increment(hz, sr))`; `advance(increment, n)` for `n` samples at a steady rate                              |
|            | Tone pair                                 | `kit::tone_pair(kit::sin_cos(carrier), kit::sin_cos(half_beat.phase))` gives `hi` and `lo`; `second_partial` and `third_partial` for the next two partials |
|            | Ears law                                  | `kit::to_ears(kit::ear_gains(ears), hi, lo, &left, &right)`                                                                                                |
|            | Rate glide                                | `glide.set(base, target, seconds, voice_open)`, `glide.key()`, `glide.step()` each sample or `glide.advance(frames)`                                       |
|            | Pulse                                     | `kit::pulse_shape(hz, duty, edge_seconds)`, `gate.next(phase, shape, increment)`, `kit::pulse_gain(open, kit::pulse_floor(depth))`                         |
| `colour.h` | Independent noise streams                 | `rng.seed(n)` in `init`, `rng.bipolar()` each sample                                                                                                       |
|            | Colour filter, one a channel              | `filter.init(sr)`, `filter.set_colour(c)`, `filter.process(white)`; RMS is `kit::kColourRms`                                                               |
| `band.h`   | Three-way split, one a channel            | `split.set(low_hz, high_hz, sr)`, `split.process(x)` gives `low`, `band`, `high`                                                                           |

Call `kit::SineTable::init()` in `init` before the pair or the pulse is used.

## The pair and the ears

A voice owns a carrier phase `c`; the device owns one half-beat phase `h` that turns at half of Beat. The two tones are `hi = sin(2π(c + h))` and `lo = sin(2π(c - h))`, so `hi` is Beat hertz above `lo` on every key and all pairs turn together. Keep both phases in `double`: the phases carry the rate, the sine only has to be clean.

The left ear is the higher one, on every device. With Ears `e`, `same = (1 + e) / 2` and `other = (1 - e) / 2`; left is `same·hi + other·lo`, right is `other·hi + same·lo`. One rule for all, so two devices in one piece never pull against each other, and so the harness check "left reads higher" means the same everywhere. For Ear Shift the sign that sends the left ear up is fixed by a measurement, not by reading the formula.

At Ears 0 the two sides are the same to the sample. The mid is `(hi + lo) / 2` at every setting: the mono sum is a full beat at Beat whatever Ears says, and its level does not move with the knob. Side over mid is `20·log10(e)` dB. That is why a reverb fed from both sides, a pan or one speaker turns a two-ear beat into one in the air, and why every Ears, Width and Offset description says what speakers or a mono fold give. Width on two unlike noises uses the same law.

## Restarting and idling

- Instruments restart every free-running thing at the sample where a key arrives with no voice active, as `cpp/devices/dusk/dusk.h` does: clocks to phase 0, gates reset, the control clock reset, smoothers snapped to their targets. A later key joins what is running. The half-beat phase at 0 is the beat's crest; the pulse at phase 0 begins to rise.
- Effects never stop their clocks. Idle (asleep), an effect runs the same sums for every frame of the block and writes silence, as `cpp/devices/pulses/pulses.h` does. Nothing restarts on waking: a device falls idle on a block's edge, so anything set at that moment would depend on the block size.
- Nothing is scheduled per host block. Marks, strikes and turns come from the sample clock.
- Seed every generator in `init` with fixed seeds, so two `init` calls give the same render.

## The glide's life

`rate(t) = base · (target / base)^min(t / T, 1)`, with `t` in samples since it started. It is armed by `reset` and by any change of base, target or time. Armed with a voice open, it starts at that sample; armed with none, it starts at the first key (`key()`). It counts on through releases, new keys and idle blocks (`advance(frames)` equals that many steps to the bit), then holds at the target. A time of 0 is off. Moving a control is the only way to run it again, and the control's description says so. Its place (0 to 1) and state can be read for a display. The rate is refreshed on multiples of 32 of the glide's own count, never on a block's edge.

## The pulse law

On from phase 0 for Duty of the period, between the half heights of two half-cosine edges of Edge seconds. Edge is held to half of the shorter of the on and off times (6.25 ms at 40 Hz and half Duty). Depth `d` sets the gap to `(1 - d)²`: exactly 0 at 1, and at 0 the gain is exactly 1 everywhere. A pulse only turns down. The right ear reads the same clock Offset later: `kit::wrap_phase(phase - offset_in_turns)`. `kit::PulseGate` follows the law but never moves faster than a quarter over its own edge, so a change of Rate, Duty or Edge in the middle of a pulse becomes one more edge. Smooth Depth as any gain.

## Noise against sample rate

White noise is one value a sample, so its level in each hertz falls 3 dB when the rate doubles. `kit::ColourFilter` is worked out from the rate and gives the same RMS and the same level in each hertz at any rate. White noise that a device filters itself has to be scaled for the rate: `kit::white_gain(sr)` does it while the filter lies well under half the rate, and Isochronic, whose bands follow the keys up towards it, works out what each band lets through instead (`band_power` in `isochronic.h`). Two streams from `kit::StreamRng` are unlike; two `kit::Rng` are one sequence at two places.

## The split

`low + band + high` is flat in level and turned in phase: an all-pass of the input, not the input. An effect built on it has no dry path beside it. Guard the input before the split (not a number becomes silence) and call `reset()` if a bad sample got by.

## Room for a full pool

An instrument turns the sum of its keys down by the root of their power once that passes one key's worth (Twin Bars counts each key's two low tones; Coloured Noise has one bed, as loud as its loudest key). Volume follows, and `kit::soft_clip` comes last: exactly linear to 0.5, bent from there to 1. That scale holds a full pool at full gain at or under the knee at the default patch, on a chord and with every id on one pitch, on every device but Twin Bars, whose overtones take sixteen ids on one pitch 2.9 dB over; that is all a harness proves. Two things are not in it: what a device adds beside the scaled keys (Binaural's bed, Isochronic's noise with Air part way, Breath Pacer's marks and air, Twin Bars' overtones) and a preset's Volume. So a preset is never assumed to stay under the knee: it is measured with a full pool at full gain, on a chord and with every id on one pitch. Measured so at 48 kHz, 30 of the family's 142 own presets and 51 of its 180 bank presets pass the knee, some from two or three keys; the figures are in [devices.md](../devices.md#the-beat-and-breath-devices-what-measurement-says-is-weak) and in each device's `WEAK.md`. The clip is a guard that presets do reach, not one that is never met.

## Checks every harness carries from its first version

- Stepped silences (20 ms steps across fall time plus hold, and one long one) at block sizes 1, 128, 2048 and ragged, each against the 128-frame render to 1e-6, with a control moved inside the silence.
- The knob moved in silence identity, idle and off the control beat.
- `suddenness()` under 0.15 for steal, restrike, note off and each smoothed control thrown end to end, at several places in the device's own cycle.
- For effects: NaN, infinity and 1e30 at the input.
- Rates, levels and noise balance at 44.1, 48 and 96 kHz; a second `init` that equals the first; `report_cost`.

Nobody can listen here. Every claim about sound is a measurement of a render; say what only an ear can judge.

## Displays

A display draws a time axis and never flashes. Draw the pulse or the pair as a still shape over time, from the same formula as the device. A mark may show the place in a breath, a sweep, a glide or a halving. The beat or pulse phase is a moving mark only at 3 Hz or under, and absent above. Output level is drawn averaged over one second, and a held key is lit while held, not once a pulse. The display test proves it with a timed draw.

## Words

Plain words, no dash, descriptions of 170 characters at most ending in a full stop. Nothing is named after a product, a maker, an artist or a piece of music, and nothing is compared with one. No name, description, preset, label or display text says what a sound is for or what it does to a listener: names say what is heard (a rate in words, a colour, a material). The stems that must not start any word are listed under KTD11 in the plan. A device whose Ears default is above 0 opens its description with "On headphones".
