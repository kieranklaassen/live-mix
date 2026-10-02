---
title: A device's output depends on the block size across a silence
date: 2026-10-02
category: logic-errors
module: cpp/kit spec devices (IdleGate, instruments with free-running state)
problem_type: logic_error
component: dsp_device
symptoms:
  - The same notes at the same sample positions render differently at 1-frame and 2048-frame blocks
  - Only silences of one particular length show it, and a long silence renders identically
  - A parameter moved while nothing sounds glides in on the next note in one render and is already there in another
root_cause: logic_error
resolution_type: code_fix
severity: medium
tags: [block-size, idle-gate, sleep, lfo, smoothing, spec-device, determinism]
---

# A device's output depends on the block size across a silence

## Problem

A spec device that keeps anything running between notes (LFO phases, noise generators, smoothers, a control clock) can break the recipe's rule that output must not depend on the host's block size, even though all its control-rate work runs on `kit::ControlClock`. The break only shows for a note that arrives around the moment the device falls asleep, so the obvious test passes.

## Symptoms

- `dusk` rendered a phrase with a 0.44 s silence between two notes: 1-frame and 2048-frame blocks differed by 0.108 of full scale. Silences of 0.42 s and 0.46 s were identical, and so was a 1.3 s silence.
- The difference was the chorus sweep: one render restarted it, the other carried on from where the sweep had got to.

## What Didn't Work

- **Running control work on `kit::ControlClock`.** That makes the device block-size independent while it is awake. It says nothing about sleep.
- **Restarting the free-running state when the device wakes.** `dusk` first reset its LFO phases, hiss seeds and control clock on the first `process` call after sleeping. That fixes a long silence and nothing else, because whether the device slept is itself a block-size question: `kit::IdleGate::settle` adds a whole block of frames to its quiet count at a time (`cpp/kit/idle.h:41`), so sleep begins on a block boundary, up to one block later with large blocks than with small ones. A note that arrives inside that window finds the device asleep in one render and awake in the other.
- **Testing one long silence.** A harness phrase with a 1.3 s gap passed at every block size. The window is one block wide and sits just after the hold time; a single gap length almost never lands in it.

## Solution

Decide the restart on something that is exact to the sample, not on sleep. For an instrument that is "no voice is active": the envelopes end on the same sample at every block size.

`cpp/devices/dusk/dusk.h`, in `note_on`:

```cpp
if (pool_.count_active() == 0) restart();
```

`restart()` puts everything that runs on through a silence into a known state:

- LFO phases to zero and noise generators reseeded (`TwoLineChorus::restart` in `cpp/devices/dusk/dusk_chorus.h`),
- the control clock reset,
- every smoother snapped to its target, in the device and in its helpers.

The smoothers matter as much as the LFOs. A sleeping device does not advance them, so a parameter set during a silence has finished gliding in a render that was still awake and has not started in one that was asleep.

Nothing audible is sounding at that point (the last voice ended 100 dB down), so the restart cannot click.

## Why This Works

While it is awake, the device does the same work on the same samples at every block size. While it is asleep it stands still, and the length of that standstill is the only thing that differs between block sizes. A restart at a sample-exact moment after which nothing from the standstill is used removes the difference. The state that is not restarted (filter and delay memory) has decayed under the idle floor by the time sleep is possible, so what is left differs by less than 1e-7.

## Prevention

- `check_instrument` has no block-size test (`check_effect` has one, on continuous noise with no silence in it: `cpp/test/support/test_kit.h:391`). Every instrument harness needs its own.
- Step the silence across the hold time instead of testing one gap. In `cpp/test/dusk_test.cpp` (`test_hiss_and_sleep`) the phrase runs with silences of 0.38 to 0.50 s in 20 ms steps plus one of 1.3 s, at block sizes 1, 128, 2048 and a ragged mix, and compares each against the 128-frame render to 1e-6. The window sits at "time for the output to fall under the idle floor, plus the `IdleGate` hold": for `dusk` a 50 ms release, a 250 ms hiss fade and a 100 ms hold. 20 ms steps catch a window one 2048-frame block (43 ms) wide.
- Move a parameter inside the silence, a few milliseconds before the next note. That is what exposes smoothers.
- Effects have the same shape of problem with input instead of notes: an effect with a free-running LFO that sleeps on silent input wakes with a phase that depends on when it slept. The same remedy applies with "input returns after the tail has ended" as the sample-exact moment, if the effect's output must be reproducible across block sizes.

## Related Issues

- `docs/recipes/adding-a-spec-device.md`, rule 4 (control-rate work on `kit::ControlClock`; 1, 128 and 2048 frames give the same audio).
