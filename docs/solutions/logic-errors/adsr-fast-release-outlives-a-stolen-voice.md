---
title: A fast release that is cut short becomes the next note's release
date: 2026-10-02
category: logic-errors
module: cpp/kit envelope, instrument voice stealing
problem_type: logic_error
component: service_layer
symptoms:
  - A note stops in about 30 ms when its key is let go, whatever the Release knob says
  - It happens only after a held key is struck again while every voice is sounding
root_cause: logic_error
resolution_type: code_fix
severity: medium
tags: [adsr, fast-release, voice-stealing, instruments, kit]
---

# A fast release that is cut short becomes the next note's release

## Problem

`kit::Adsr::fast_release()` sets a flag that only a finished release clears. When the voice is taken for a new note before that release finishes, the new note keeps the flag, and its own release is the fast one.

## Symptoms

- Found in the Flute (`cpp/devices/flute/flute.h`): eight keys held, one of them struck again, then let go. With Release at 1 s the note read 0.00 of its held level 250 ms after the key was let go. Without the second strike it read 0.27.
- No check failed before the one that was written for it. The conformance pass and the click checks all passed.

## What Didn't Work

- `voice.env.reset()` before `gate_on()`. `reset()` sets the stage to idle and the level to zero (`cpp/kit/env.h:36`) and leaves `use_fast_` as it was. `gate_on()` (`cpp/kit/env.h:32`) does not clear it either.

## Solution

Start every note with a new envelope:

```cpp
voice.env = kit::Adsr();
voice.env.set_sample_rate(tick_rate_);  // or the sample rate, if the envelope runs per sample
voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
voice.env.gate_on();
```

This is in `Flute::start()`. The device build may not edit `cpp/kit`, so the fix is in the device.

## Why This Works

`fast_release()` sets `use_fast_ = true` (`cpp/kit/env.h:45`). The release stage multiplies by the fast coefficient while the flag is set, and the flag goes back to false only when the level falls under the idle level inside `next()` (`cpp/kit/env.h:71` to `75`). Two paths take a voice away before that:

1. Every voice is busy and a held key is struck again. The device fast-releases the key's old voice, then asks the pool for a voice. The pool steals the quietest releasing voice, which is the one just fast-released.
2. A voice is faded out by the device itself (a stolen voice whose new note was released before it began) while its envelope is still in a fast release.

A default-constructed `Adsr` has the flag clear, so the next note releases at the set time.

## Prevention

- A harness check, in `cpp/test/flute_test.cpp` ("a key struck again with every voice busy keeps its release"): fill every voice, put the test key far below the others in pitch so its level can be read alone, strike it again, let it go, and read its level a quarter of the release time later.
- Other instruments take the same path and were not run against this check. `cpp/devices/organ/organ.h` calls `fast_release()` on a re-struck key and then `gate_on()` on whichever voice the pool returns, with no new envelope. Choir, String Machine, Atmosphere, Drone, Wavetable, Grain Synth and Sampler also call `fast_release()` on a re-struck key. Each needs the check before it is called affected or clear.
- The fix that covers all of them is in the kit: clear `use_fast_` in `Adsr::gate_on()`. That changes shared code, so it belongs to whoever owns `cpp/kit`, with every instrument's harness run after it.
