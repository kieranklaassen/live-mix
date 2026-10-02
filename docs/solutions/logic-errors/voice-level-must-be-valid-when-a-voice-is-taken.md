---
title: A voice must report its loudness from the moment it is taken, or the next note steals it
date: 2026-10-02
category: logic-errors
module: cpp/devices (instruments on kit::VoicePool)
problem_type: logic_error
component: voice_allocation
symptoms:
  - With every voice held, two notes arriving before the next process() call leave only the last one sounding
  - The first note of a chord is missing when the pool is full, with no click and no failed check
root_cause: async_timing
resolution_type: code_fix
severity: medium
tags: [voice-pool, voice-stealing, polyphony, instruments, control-rate]
---

# A voice must report its loudness from the moment it is taken, or the next note steals it

## Problem

`kit::VoicePool` picks the voice a new note takes by asking each voice for `level()`. An instrument whose `level()` is an envelope follower written only on its control clock reports the wrong loudness for a voice it has just handed out, so the next note in the same block takes that voice again and the first note is never heard.

## Symptoms

- Sixteen held Mallets notes, then `note_on` at 2000 Hz and `note_on` at 2500 Hz with no `process()` between them: 2000 Hz came out at -83 dB (absent), 2500 Hz at -31 dB.
- With fifteen held notes the result was the same: the first new note took the free voice, and the second stole it.
- Nothing failed. The stolen voice fades over 2 ms as designed, so there is no click, and the conformance pass (many keys, bounded output, exact silence afterwards) cannot tell which notes sounded.

## What Didn't Work

- The existing steal check (seventeen notes over sixteen voices, one at a time with audio rendered between them) passed throughout, because the control clock had run before each new note. The failure needs two note-ons inside one control period, which is how a chord arrives.
- Reading the pool for a bug: `VoicePool::note_on` is correct. It takes an idle voice, else the quietest releasing one, else the quietest held one (`cpp/kit/voices.h:44-51`). The contract it states for `level()` is "current loudness, for stealing" (`cpp/kit/voices.h:16`), and the instrument was not keeping that contract between control ticks.

## Solution

Make `level()` true as soon as the voice is handed out, not at the next control tick. In `cpp/devices/mallets/mallets.h`:

1. On a key press, set the follower to what the stroke will leave before any audio is rendered (`play`, line 391):

   ```cpp
   voice.struck_level = stroke_level(voice.instrument, gain);
   voice.follow = kit::max(voice.follow, voice.struck_level);  // as loud as it will be, before it has sounded
   ```

2. When a voice is stolen and waits out its 2 ms fade, it counts as the incoming note from that moment (`note_on`, line 136):

   ```cpp
   voice.follow = stroke_level(instrument, gain);
   voice.pending = true;
   ```

3. On the control clock, do not lower the follower while the stroke is still in flight (`control`, line 559):

   ```cpp
   const float ringing = std::sqrt(energy);
   voice.follow = voice.struck() ? kit::max(voice.follow, ringing) : ringing;
   ```

After the change both notes sound at about -21 dB with fifteen or sixteen held notes.

## Why This Works

Two states gave a wrong answer. A voice that had just started had its follower at about zero (the stroke only raised it to the silence floor so the voice would not be freed), which made it the quietest held voice in the pool. A voice that had just been stolen was still fading the old note and still reported the old note's loudness, which is the reason it was chosen in the first place, so it was chosen again. In both cases the follower was only corrected by `control()`, which runs every 32 samples inside `process()`, and a chord's note-ons all arrive before that.

Setting the follower from the note's own gain at the two places a voice changes hands closes both states. Holding it while a stroke is in flight keeps the first control tick, which may run before the stroke has landed, from undoing that.

## Prevention

- When an instrument's `level()` is computed on a control clock, set it at `note_on` too, from the note's gain, on both the fresh-voice path and the stolen-voice path.
- Test stealing with the notes of a chord, not one at a time: fill the pool with held notes, send two or three note-ons back to back, render, and assert each new pitch is present. The Mallets check is in `cpp/test/mallets_test.cpp` ("held notes, then two in one block: both sound"). Pick probe pitches clear of the held notes' partials, or a partial of a held note reads as the missing one.
- Bells has the same shape and was not changed with Mallets: `level()` returns `follow` (`cpp/devices/modal-bells/modal_bells.h:318`), `start` zeroes it (line 330) and only the control clock writes the real value (line 490). Other instruments that return a follower from `level()` are worth the same check.

## Related Issues

- The fix is on branch `device/mallets`, unmerged as of this writing.
