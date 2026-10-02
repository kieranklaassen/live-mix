---
title: A device's noise gets quieter as the sample rate rises unless it is scaled
date: 2026-10-02
category: logic-errors
module: cpp/devices (any device with a noise source)
problem_type: logic_error
component: dsp_devices
symptoms:
  - Breath, hiss or air sits about 3 dB lower against the tone at 96 kHz than at 48 kHz
  - The native harness and the conformance pass both pass at every sample rate
  - A patch that is mostly noise (a subtone, a breathy pad) sounds drier on a 96 kHz host
root_cause: logic_error
resolution_type: code_fix
severity: medium
tags: [noise, sample-rate, breath, instruments, native-harness, clarinet]
---

# A device's noise gets quieter as the sample rate rises unless it is scaled

## Problem

White noise made one random value per sample, at a fixed level, and then shaped by filters whose cutoffs are fixed in hertz loses audible level as the sample rate rises. The Clarinet's breath was 3 dB quieter against its tone at 96 kHz than at 48 kHz, and no test said so.

## Symptoms

- Measured on C3 at gain 0.8 with Breath at 1: tone against air 12.0 dB at 44.1 kHz, 12.2 dB at 48 kHz and 15.2 dB at 96 kHz (cylinder); 8.6, 8.8 and 11.9 dB (cone). The tone itself stayed at -28.2 dBFS at all three rates.
- Every check passed. The conformance pass renders at 44.1 and 96 kHz but only asks for sound that is finite and bounded (`cpp/test/support/test_kit.h:562`), and the device's own harness measured the breath at 48 kHz only.

## What Didn't Work

- Relying on the harness. It measured the share of breath across velocities and through the release, all at 48 kHz, so the trait looked proven.
- Relying on the conformance pass at other rates. It cannot know which part of a device is noise.
- Mutation checks on the harness. They showed that the harness caught a wrong noise law at 48 kHz; they say nothing about a rate the harness never renders.

Code review found it by asking what in the per-sample path depended on the rate and what did not.

## Solution

Scale the noise by the square root of the sample rate over the rate the level was set at. In the Clarinet the factor is folded into the gain the Breath knob sets (`cpp/devices/clarinet/clarinet.h:86`, used at `:442`):

```cpp
// init(): white noise spreads over a wider band at a higher rate
air_scale_ = kAirGain * std::sqrt(sr / kVoicedRate);   // kVoicedRate = 48000

// apply(kBreath)
air_.set(air_scale_ * value * value, primed());
```

At 48 kHz the factor is exactly 1, so the output there does not change and levels set by ear or by measurement at 48 kHz stay where they are. After the fix the share of breath at 96 kHz is within 0.1 dB of 48 kHz.

Two devices already did this: Thesis (`cpp/devices/thesis/thesis.h:72`, `noise_gain_ = std::sqrt(sr / kReferenceRate)`) and Choir, which scales its breath by the root of the sample rate over the noise power of its filter bank (`cpp/devices/choir/choir.h:345`).

## Why This Works

One random value per sample with a fixed variance has that variance spread evenly from 0 Hz to half the sample rate. Double the rate and the same power covers twice the band, so the power per hertz halves. A filter fixed in hertz (a 5 kHz low-pass, a comb tuned to a note) passes the same band at any rate and therefore passes half the power: -3 dB per doubling. Multiplying the noise by `sqrt(rate / 48000)` holds the power per hertz, and so the level of everything downstream, where it was at 48 kHz.

Oscillators, envelopes and filters with cutoffs in hertz do not have this problem, which is why the tone did not move and the difference showed only in the ratio.

## Prevention

- Any new device with a noise source (`kit::Rng`, a noise burst, a breath or hiss path) scales it by `std::sqrt(sample_rate / 48000.0f)` in `init()`.
- The harness compares a noise-dependent measure across rates, not only at 48 kHz. The Clarinet's check renders the same note with and without Breath at 48 and 96 kHz and asks that tone against air differ by under 1 dB (`cpp/test/clarinet_test.cpp:579`). Before the fix it differed by 3 dB, so the check fails without the scaling.
- When reviewing a device, list what on the per-sample path is defined per sample (random values, fixed feedback gains, coefficients not derived from the rate) and check each against a second sample rate.

## Related Issues

- None on file. The fix and the check are on branch `device/clarinet`, not merged as of this writing.
