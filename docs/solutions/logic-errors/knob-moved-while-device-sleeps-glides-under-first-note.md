---
title: A knob moved while a device sleeps is still on its way when the next note starts
date: 2026-10-02
category: logic-errors
module: cpp/devices (spec devices on cpp/kit)
problem_type: logic_error
component: dsp_kit
symptoms:
  - The first note after a knob was moved in silence starts at the old setting and glides to the new one under the pick
  - A per-note value read from a smoother at note on stays wrong for as long as the note rings (5.4 dB on the guitar's level trim)
  - The harness passes, because every check sets its knobs before the first block or moves them while a note sounds
root_cause: logic_error
resolution_type: code_fix
severity: medium
tags: [idle-gate, smoother, control-clock, spec-device, native-harness]
---

# A knob moved while a device sleeps is still on its way when the next note starts

## Problem

A device that sleeps behind `kit::IdleGate` returns from `process` before its sample loop, so its `kit::Smoother` objects and its control clock do not run while it is asleep. `Smoother::set(v, primed)` only moves the target once the device has rendered a block (`cpp/kit/smooth.h:27`). A knob moved in silence is therefore still at its old value when the next note wakes the device, and glides to the new one during that note's attack. On an instrument the attack is most of the note.

## Symptoms

- On the guitar, Pickup moved from the bridge to the neck in silence left the next note 5.4 dB too loud at E2 and E4 and 3.0 dB too quiet at E6, for the whole note: `strike()` took the note's level trim from `pickup_.value`, and the code that retrims ringing notes only runs on the control tick where the target changes, which had already passed.
- The same first note began under the old Tone, Warmth and Volume: against a guitar set that way from the start it differed, sample for sample, by 0.04 to 0.19 where the note itself peaks at 0.1 to 0.2.
- Nothing in the harness failed. `check_instrument` and every hand-written check either set knobs before the first block (the smoother snaps) or moved them under a ringing chord (the smoother runs).

## What Didn't Work

- **Taking the per-note value from the smoother's target alone.** That fixes the latched trim, but the knob itself still glides under the first note.
- **Snapping the smoothers on waking, and nothing else.** A filter whose coefficients are set on the control clock keeps its old setting until the next tick, up to a control period later, which is exactly where the pick's spike is. The test for this passed by accident at first: `render` in `cpp/test/support/test_kit.h` works in whole blocks, the blocks are a multiple of the control period, the clock stops while the device sleeps, so the device always woke on a tick. One odd-sized block while a note still rang (`device.process(13)`) put it off the beat and showed a difference of 0.05.

## Solution

On waking, send every smoothed knob to its target and set anything that is derived from one on the control clock. In `cpp/devices/guitar/guitar.h`:

```cpp
void process(int frames) {
  frames = begin_block(frames);
  const bool was_asleep = idle_.asleep();
  if (!idle_.wake(any_on())) {
    silence_output(frames);
    return;
  }
  // Nothing is sounding, so a knob moved in the silence has arrived.
  if (was_asleep) arrive();
  ...
}

void arrive() {
  pickup_.snap(pickup_.target);
  tone_.snap(tone_.target);
  resonance_.set(tone_.target, kResonanceQ, sample_rate());  // not at the next control tick
  drive_.snap(drive_.target);
  makeup_.snap(makeup_.target);
  volume_.snap(volume_.target);
}
```

And a value a note keeps is taken from where the knob is going, starting from where it is:

```cpp
voice.trim = level_trim(pickup_fraction(pickup_.value, voice.ratio));
voice.trim_target = level_trim(pickup_fraction(pickup_.target, voice.ratio));
```

`cpp/devices/auto-filter/auto_filter.h` has the same idea in `wake_up()` ("whatever changed while asleep applies at once"), and about a dozen devices test `idle_.asleep()` for it. The recipe's sleep rule (`docs/recipes/adding-a-spec-device.md`, rule 6) does not mention it, and a device written from the recipe alone will not have it.

## Why This Works

The gate only sleeps once the output has been under its floor for the hold time (`cpp/kit/idle.h`), so on waking nothing is in the signal path and a jump in a gain or a filter setting has nothing to click on. Snapping there makes the sleeping device equal to one that was set that way before its first block, which is the state every other check already measures.

## Prevention

- Measure it as an identity, not a level: move the knob in silence, play a note, and compare sample for sample with the same note on a device that had the knob there from the start. `test_settings` in `cpp/test/guitar_test.cpp` does this for Pickup, Tone, Warmth and Volume and expects a difference under 1e-6.
- Put the device to sleep off the beat of its control clock before the move (one odd-sized `process` call while a note still sounds). Without that, a device that forgets its control-rate filters passes.
- Check a note picked while the knob is still moving as well (5 ms into a throw under a ringing note): its settled level should match the note at the new setting.
- When a note latches anything from a smoothed knob at note on, read `.target`, and ask what corrects it if the knob moves later.

## Related Issues

- `docs/recipes/adding-a-spec-device.md`, rules 3 (smooth what is audible) and 6 (sleep when idle): the two rules meet here.
- `docs/plans/2026-10-02-0724-feat-guitar-device-plan.md`, "What Changed in the Build".
