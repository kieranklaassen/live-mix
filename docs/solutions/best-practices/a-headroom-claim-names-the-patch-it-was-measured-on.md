---
title: A headroom claim holds only for the patch it was measured on
date: 2026-10-16
category: best-practices
module: cpp/test (native device harnesses), device presets and the bank
problem_type: best_practice
component: testing_framework
severity: medium
applies_when:
  - A header, a manifest, a plan or a doc says a full pool of keys stays under the soft clip's knee, or that the clip is a guard only
  - A native harness proves a peak bound from init() and a few settings, and the device ships presets
  - A bank preset sets Volume over the device's default to meet the bank's loudness window
  - A device adds a layer beside the keys that its level scale counts (a noise bed, marks, air, overtones)
tags: [native-harness, presets, soft-clip, headroom, full-pool, loudness, measurement, instruments]
---

# A headroom claim holds only for the patch it was measured on

## Context

The six instruments of the beat and breath family (`binaural`, `isochronic`, `coloured-noise`, `breath-pacer`, `still-point`, `twin-bars`) end the same way. The sum of the keys is turned down by the root of the keys' power once that passes one key's worth. Volume follows. `kit::soft_clip` comes last: exactly linear to 0.5 and bent from there to 1 (`cpp/kit/math.h:44-52`). A sample over 0.5 going into the clip has passed its knee.

The plan asked that "a full pool of held keys never reaches the clip's knee in either ear" (`docs/plans/2026-10-15-1535-feat-beat-and-breath-devices-plan.md:56`). Each native harness proved a full pool at full gain at or under 0.5, and three header comments then said "the clip is a guard only".

Every one of those checks starts from `init()` and moves a few controls round the default patch:

| Harness                                      | What it holds under the knee                                                                                   |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `cpp/test/binaural_test.cpp:665-690`         | Eight keys of a chord for ten minutes; eight on one pitch at the defaults, at Ears 0, on Cross and at Warmth 1 |
| `cpp/test/isochronic_test.cpp:1225-1245`     | Eight keys on one pitch and on a chord, at three settings of Warmth, with Air at 0                             |
| `cpp/test/coloured_noise_test.cpp:1474-1491` | Ten keys at three Colours and both ends of Tint                                                                |
| `cpp/test/breath_pacer_test.cpp:1569-1586`   | Minor thirds and the first eight partials of one note, at the default patch                                    |
| `cpp/test/still_point_test.cpp:1158-1191`    | Eight keys on one pitch over 27 settings of Ears, Warmth and Level, and a chord at both ends of Ears           |
| `cpp/test/twin_bars_test.cpp:978-1003`       | Sixteen keys on three chords, each material, three settings of Ears; never one pitch                           |

None of the six loads a preset. Where one of them turns Volume up, it is to show that the clip holds the sound, not that the sound stays under the knee.

A code review after the six devices were joined asked whether the claim holds for the presets. It did not. The review measured it natively at 48 kHz: a full pool held at full gain on the default patch, on every own preset (142) and on the instrument of every bank preset (180). Each was rendered on two to four sets of keys, a chord and every id on one pitch among them, 875 renders in all. 30 own presets and 51 bank presets put samples past the knee.

Two things are outside the scale that the harnesses proved:

- **What a device adds beside the scaled keys.** Binaural adds its bed after the scale (`cpp/devices/binaural/binaural.h:456`, `:460-466`). Isochronic's noise has peaks 6 to 8 dB over its tone (`cpp/devices/isochronic/isochronic.h:53-59`). Breath Pacer scales its marks by their own power and adds the air (`cpp/devices/breath-pacer/breath_pacer.h:406-409`). Twin Bars counts the two low tones of a key and not its overtones (`cpp/devices/twin-bars/twin_bars.h:42-47`).
- **A preset's Volume.** Volume is applied after the scale and before the clip in all six, so every dB a preset adds over the default goes straight at the knee. 94 of the 180 bank presets set Volume over the default, and 41 of those pass the knee.

## Guidance

**Name the patch in the claim.** "A full pool stays under the knee" is a claim about one patch: the one the harness set up. Write it as "at the default patch" or "at the default Volume", in the header, the manifest and the doc. A harness that proves room at the default patch proves nothing about a preset whose Volume or added layers differ.

**Before writing a headroom claim, measure every preset with a full pool.** That means:

1. Every own preset in `device.json`, and the instrument of every bank preset with the values the bank gives it.
2. As many keys as the pool holds, at gain 1.0.
3. At least two sets of keys: a chord, and every id on one pitch. One pitch is the worst a pool can add up to, since every voice starts in step. Add the set where a device's own layer lines up: the partials of one low note for Breath Pacer's marks, keys a semitone apart for Twin Bars' overtones.
4. Ten seconds or more. Noise has no fixed peak, so a patch that is mostly noise is held longer. Coloured Noise's nearest patches were held for ten minutes.

**Read what goes into the clip, not what comes out.** The output never passes 1, so its peak says little about how far past the knee the sound went. Render the same passage a second time with Volume 30 dB lower, where the clip is a straight line, and scale that render back up. This works because Volume is one linear multiplier before the clip in all six headers (`binaural.h:468-470`, `isochronic.h:381-385`, `coloured_noise.h:341-343`, `breath_pacer.h:410-412`, `still_point.h:214-216`, `twin_bars.h:209-211`). It needs a device that renders the same samples from `init()` every time, noise included.

From the two renders, report four figures: the peak into the clip against 0.5 in dB, the count of samples past the knee, how far the clip bends the peak, and what the clip adds (the RMS of output minus input against the RMS of the input).

**For each preset that passes, find the fewest keys that do it.** Sweep one key up to the pool's size, at gain 1.0 and at 0.8. A preset that passes only with a full pool on one pitch at full gain is a far corner. One that passes from two keys is something a player meets.

**When two targets pull apart, say which one the presets were set for.** Here they did. The bank holds every preset to a loudness window on its preview phrase: the loudest 400 ms between -30 and -22 dBFS, the peak under -8 dBFS (`src/dsp/factory/packs/__tests__/support.ts:27-33`, `:107-115`, applied to each bank preset at `src/dsp/factory/__tests__/factory.test.ts:136-144`). The phrase is a few keys: a pad's is a chord of five (`src/dsp/factory/phrases.ts:14-22`). A full pool is eight to sixteen. The bank's Volumes were set for that window and not for the knee. At the default Volume 54 of the 94 raised presets would fall under its floor.

So the Volumes were left as they are, and the facts were written down where the library records what measurement says is weak:

- the family's weak table and the paragraph under it (`docs/devices.md:655`, `:679-700`)
- the last paragraph of each device's `WEAK.md` under `cpp/devices/`
- "Room for a full pool" in `docs/recipes/beat-and-breath-family.md:53`
- the three header comments, which now say which patch the claim holds for (`isochronic.h:36-40`, `still_point.h:25-28`, `breath_pacer.h:52-58`)

**The open gap.** As of this writing nothing in the repository checks a preset with a full pool. None of the six harnesses loads a preset, and the bank's test renders each preset on its preview phrase only. The 875 renders came from a scratch program written for the review, which is not in the repository. A new preset, or a bank preset with a raised Volume, can pass the knee and every test stays green. Until a check exists, the measurement above is done by hand when a preset is added or its Volume changes, and the weak rows are brought up to date with it.

## Why This Matters

Nobody listens to a device where it is built, so a header comment is what the next reader takes as fact. "Guard only" says the clip never colours the sound. Inside its knee the clip makes tones of its own, and on a device whose point is a beat between the two ears those tones land inside each ear (`cpp/devices/binaural/binaural.h:30-34`).

The sizes, as measured:

- With different pitches the clip bends the peak 0.42 dB at the most, and what it adds is 40 dB or more under the sound.
- With a full pool on one pitch the bend reaches 3.4 dB, and what the clip adds is 25 dB under the sound at the nearest.
- Some presets pass from very few keys. Breath Pacer's bank preset "Marked slow down" passes from two keys at full gain. Twin Bars' bank preset "Flam on wood" passes from three close keys.

So most of it is small, some of it is not, and none of it was in the claim.

The bank's own limits do not catch it. A preset inside the window peaks under -8 dBFS on its phrase, which is 0.40 at the patch's output, after its effects. That says nothing about the input of the instrument's clip with eight or sixteen keys down.

The easy fix would have broken the other target. Lowering the bank Volumes to the defaults puts 54 presets under the window's floor, and a preset that is too quiet in the list is a fault a player meets on the first key.

This is not special to one family. Older rows of the same doc already carry it: four strings of `string-bass` at full gain pass the knee on thirteen presets (`docs/devices.md:632`), and ten keys of `prepared-piano` at 0.7 pass it in five (`docs/devices.md:649`). The recipe's rule for every instrument is worded for the default patch too: "ten held notes stay under the clip knee" follows "at the default volume" (`docs/recipes/adding-a-spec-device.md:95`).

## When to Apply

- When a harness check on peak level first passes, and before its result is written into a header, a manifest, a plan or a doc.
- When a preset is added to `device.json`, or a bank preset sets `volume` over the device's default.
- When a device gains a layer that the level scale does not count.
- When a level is raised to meet a loudness target that was measured on a phrase of a few keys.
- When a review meets the words "never", "always" or "guard only" beside a level.

## Examples

The claim, before and after. `cpp/devices/still-point/still_point.h:25-28` said:

```cpp
// - The keys are scaled by 1 / sqrt(max(1, sum of (envelope · gain)²)), so
//   eight keys at full gain reach the edge of the soft clip's knee at the
//   default Volume and no further; the clip is a guard only.
```

and now says:

```cpp
// - The keys are scaled by 1 / sqrt(max(1, sum of (envelope · gain)²)), so
//   eight keys at full gain reach the edge of the soft clip's knee at the
//   default Volume and no further. A preset's Volume is outside that: one
//   bank preset passes the knee with a full pool on one pitch (WEAK.md).
```

The measurement, as a sketch of the review's scratch program. `render` sets the preset's values and the given Volume after `init()`, sends the keys and returns both ears.

```cpp
const Audio bare = render(device, preset, volume - 30.0f, keys, 1.0f);  // the clip is a straight line down here
const Audio loud = render(device, preset, volume, keys, 1.0f);
const double up = std::pow(10.0, 30.0 / 20.0);
double into = 0.0, worst = 0.0;
long past_knee = 0;
for (size_t i = 0; i < bare.left.size(); ++i) {
  const double pre = bare.left[i] * up;  // what went into the clip
  into = std::max(into, std::fabs(pre));
  if (std::fabs(pre) > 0.5) ++past_knee;
  // The method checks itself: the clip of the scaled render is the loud render.
  worst = std::max(worst, std::fabs(kit::soft_clip(static_cast<float>(pre)) - loud.left[i]));
}
```

In the review's run `worst` stayed under 0.0000003 over all 875 renders, so the scaled render is what the clip was given.

What the run found, by device. The figures are from each device's `WEAK.md` and `docs/devices.md:669-674`; read those for the presets by name.

| Device           | Pool | Default Volume | Outside the scale                    | Own presets past the knee | Bank presets past the knee (of 30) |
| ---------------- | ---- | -------------- | ------------------------------------ | ------------------------- | ---------------------------------- |
| `binaural`       | 8    | 0 dB           | the bed, Volume                      | 5 of 24                   | 2                                  |
| `isochronic`     | 8    | -6 dB          | noise with Air part way, Volume      | 4 of 24                   | 9                                  |
| `coloured-noise` | 10   | -12 dB         | Volume (one bed, whatever the count) | 0 of 24                   | 0                                  |
| `breath-pacer`   | 8    | -9 dB          | the marks, the air, Volume           | 3 of 23                   | 9                                  |
| `still-point`    | 8    | -6 dB          | Volume                               | 0 of 23                   | 1                                  |
| `twin-bars`      | 16   | -9 dB          | the overtones, Volume                | 18 of 24                  | 30                                 |

Twin Bars shows why one pitch belongs in the set. Its harness holds sixteen keys on three chords and passes. Sixteen ids on one pitch at full gain are 2.9 dB over the knee at the default patch itself.

Coloured Noise shows the other side. Every one of its thirty bank presets has Volume 2 to 6 dB over the default, and none passes. A raised Volume is a reason to measure, and the measurement decides.

## Related

- [Take each trait out of the device and see that its harness fails](./mutation-check-a-measuring-harness.md): a harness that passes says nothing about what it never renders. There it was a voice left switched off; here it is the presets.
- [A device's noise gets quieter as the sample rate rises unless it is scaled](../logic-errors/noise-level-falls-with-sample-rate.md): a trait measured at one sample rate and taken as proven at all of them.
- [The beat and breath devices: what measurement says is weak](../../devices.md#the-beat-and-breath-devices-what-measurement-says-is-weak): the rows and the paragraph that carry the figures.
- [Room for a full pool](../../recipes/beat-and-breath-family.md#room-for-a-full-pool): the family's rule.
- The devices, the weak rows and the changed comments are on the family's branch, which was not merged as of this writing.
