---
title: Check for clicks against the same render without the event
date: 2026-10-02
category: best-practices
module: cpp/test (native device harnesses)
problem_type: best_practice
component: testing_framework
severity: medium
applies_when:
  - Writing the click checks of a native harness for voice stealing, re-striking, note off or parameter jumps
  - A harness check compares max_step after an event with max_step of the steady sound
  - Measuring how long a note takes to speak with a window several periods long
tags: [native-harness, clicks, mutation-testing, voice-stealing, parameter-smoothing, instruments]
---

# Check for clicks against the same render without the event

## Context

Nobody listens to a device while it is built here, so the native harness is the only proof that stealing a voice, striking a held key or jumping a parameter does not click. The Clarinet's first click checks used the shared `max_step` helper (`cpp/test/support/test_kit.h:231`): render the event, take the largest sample-to-sample jump, and require it to stay near the largest jump of the steady sound.

Those checks passed. They also passed with the protection removed. In this session's mutation runs, deleting the 2 ms fade of a stolen voice, and making Blow, Bore and Volume snap to their targets instead of being smoothed, left every `max_step` comparison green. A bright tone already has large jumps between samples, eight voices make them larger, and the jump an unfaded event adds is often smaller than that, or lands near a zero crossing.

The same thing happened to the check that low notes speak later than high ones: measured with a window four periods long, removing the speech time altogether did not fail it, because the window adds a delay of its own that grows with the period.

## Guidance

Measure the event against the same passage rendered without it, and ask how much of the change is already there after a few samples.

`suddenness()` in `cpp/test/clarinet_test.cpp:245` does this:

1. Render the same setup twice from `init()`. In one render apply the event (a ninth note, a second strike, a note off, a parameter set from one end of its range to the other); in the other do nothing.
2. Take the difference of the two renders over the next 20 ms.
3. Divide the largest difference in the first 8 samples by the largest over the whole 20 ms.
4. Repeat at eight moments a little apart and keep the worst, so a jump cannot hide in a zero crossing.

A faded or smoothed event has moved a small part of the way after 8 samples; a jump is all there at once. The Clarinet asserts under 0.15 and measures 0.06 for a steal, 0.04 for a second strike and 0.02 for a note off.

The check needs the device to be deterministic from `init()`, random sources included: seed every noise generator and every random start phase in `init()`, so that the two renders are identical up to the event and the difference is the event alone.

For onset time, read it off the wave: the first sample whose magnitude reaches half the peak the held note reaches (`speech_time()`, `cpp/test/clarinet_test.cpp:191`). A window as long as a few periods hides what it is meant to measure.

Then run the mutation: remove the fade or the smoother in a scratch copy and confirm the check fails. A click check that has never been seen to fail proves nothing.

## Why This Matters

A `max_step` comparison answers "is there a jump larger than the waveform's own slope", which is not the question. The question is whether the event arrives gradually. For a dull sound the two coincide; for a bright or polyphonic one they do not, and the check goes green while the device clicks. Since the harness is the listener, a blind click check ships clicks.

`max_step` is still useful as a second, coarser bound (the Clarinet keeps two such checks, for a second strike and for the shortest Release) and for sweeps of a parameter under a pure tone.

## When to Apply

- Every instrument harness: steal, re-strike, note off at the shortest release.
- Every smoothed parameter that changes level or timbre: set it across its range in one call, both ways.
- Any check whose pass condition is "no worse than the steady sound".

## Examples

Before: passes with the steal fade deleted.

```cpp
Stereo before = render(device, 1.0f, kRate);
const double steady = both_step(before, at(0.5));
device.note_on(8, 987.77f, 0.8f);                 // steals a voice
Stereo after = render(device, 0.5f, kRate);
EXPECT(both_step(after) < 1.3 * steady, "a steal adds no step");
```

After: fails with the steal fade deleted.

```cpp
const double steal = suddenness(eight, [](Clarinet& d) { d.note_on(8, 987.77f, 0.8f); });
EXPECT(steal < 0.15, "a steal starts gradually");
```

## Related

- [A device's noise gets quieter as the sample rate rises unless it is scaled](../logic-errors/noise-level-falls-with-sample-rate.md): another trait the harness passed without measuring.
