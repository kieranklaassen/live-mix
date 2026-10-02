---
title: Controls moved while a kit device sleeps glide through the next note's attack
date: 2026-10-02
category: logic-errors
module: cpp/kit devices (IdleGate, Smoother, ControlClock)
problem_type: logic_error
component: tooling
symptoms:
  - The first note after a preset or type change made in silence sounds different from the same note on a freshly initialised device
  - A Volume or Body move made in silence ramps over the next pluck instead of being in place for it
  - Harnesses that set parameters before the first block never show it
root_cause: logic_error
resolution_type: code_fix
severity: medium
tags: [idle-gate, smoother, control-clock, spec-device, attack, preset-change]
---

# Controls moved while a kit device sleeps glide through the next note's attack

## Problem

A spec device that sleeps through `kit::IdleGate` returns from `process()` before its smoothers and its control clock run. Anything moved while it is asleep (a preset load, a type switch, Volume, Body) is therefore only caught up once the next note wakes it, which is exactly while that note's attack is sounding.

## Symptoms

- In `harp`, the first Koto note after switching from Harp in silence was 2 dB away (peak of the difference against the note) from the same note on a device set up that way from `init`: the previous type's soundboard and plectrum shelf glided for about 100 ms through the attack, where the shelf matters most.
- A Volume move of 30 dB made in silence ramped over the first 5 ms of the pluck.
- Every other measurement passed, because harnesses call `init`, set parameters and only then render: before the first block `primed()` is false and `kit::Smoother::set` snaps.

## What Didn't Work

- Relying on `primed()`: it only covers parameters set before the first block ever rendered. A device that has played once and gone back to sleep is primed, so `set(value, primed())` ramps, and the ramp does not advance while asleep.
- Relying on the control clock: `kit::ControlClock` is not ticked while asleep, so on waking it fires at an arbitrary phase, up to one control period after the first sample of the note. A coefficient set that is recomputed there changes under the attack.

## Solution

In the asleep branch, land everything that would otherwise glide, and restart the control clock so control runs on the first sample after waking (`cpp/devices/harp/harp.h`):

```cpp
if (!idle_.wake(sounding)) {
  // Asleep, a control lands where it points and the soundboard is the
  // type's in use: the next note starts on them, not on the way to them.
  body_.snap(body_.target);
  volume_.snap(volume_.target);
  board_type_ = -1;              // the next control() snaps the glided coefficients
  clock_.reset(kControlPeriod);  // and runs on the first sample
  silence_output(frames);
  return;
}
```

The harness case that catches it (`cpp/test/harp_test.cpp`, "controls moved in silence"): play a note, let the device reach exact zero, move the controls, render a little silence, play a note, and compare with the same note on a device that was initialised and set up that way. Before the fix the two were 2 dB apart; after it they are identical (−229 dB).

## Why This Works

Nothing audible depends on a glide while the output is exact zero, so snapping there cannot click. What the glide protects is a control moved under sound; asleep there is none. Resetting the clock makes the first sample after waking deterministic, which also keeps a render independent of how long the device slept.

## Prevention

- When a device has an `idle_.wake(...)` early return, list what advances only while awake (every `kit::Smoother`, any coefficient set glided on the control clock, the `kit::ControlClock` phase) and land each of them in that branch.
- Add the harness case above to any instrument with smoothed or glided controls. A test that sets parameters only before the first block cannot see this.
- The idle branch is bare (only `silence_output` and `return`) in at least `string-machine`, `tine-piano` and `modal-bells` at the time of writing; devices whose smoothed controls shape the attack are worth checking the same way.

## Related Issues

- `cpp/kit/idle.h` documents that state is left as it is while asleep.
- `cpp/kit/smooth.h`: `Smoother::set(value, primed)` and `ControlClock::tick`.
