---
title: A key struck twice inside a steal fade leaves a voice that no note off ends
date: 2026-10-02
category: logic-errors
module: cpp/devices (polyphonic instruments on kit::VoicePool)
problem_type: logic_error
component: dsp_devices
symptoms:
  - A note keeps sounding after every key has been let go, until its voice is stolen or the device is reloaded
  - With a full pool, striking one key twice in the same block silences two held notes instead of one
root_cause: logic_error
resolution_type: code_fix
severity: medium
tags: [voice-pool, voice-stealing, pending-note, stuck-note, note-on, instruments]
---

# A key struck twice inside a steal fade leaves a voice that no note off ends

## Problem

An instrument that fades a stolen voice out before starting the new note keeps that note waiting in the voice ("pending"). If the same key arrives again while it waits, the instrument can end up with two voices for one note id. One note off releases only one of them and the other sounds for ever.

## Symptoms

- After every `note_off`, the device never reaches silence. In Chamber Strings the output still peaked at 0.10 eight seconds after the last key was let go.
- It needs all of: every voice in use, the held voices exactly equally loud (a chord that has finished its attack), and the same note id twice within the steal fade (2.5 ms there, so in practice two note ons in one audio block).
- A chord held for only a second does not show it: the voices are still rising, the first stolen voice is still the quietest, and the pool picks it again.

## What Didn't Work

- The first reproduction held the chord for one second and found nothing. `VoicePool::note_on` takes the quietest voice and only falls back to the oldest on a tie in `level()`, so the second strike took the same voice again. The bug needs the tie; hold the chord until the levels are identical before striking.
- The harness's existing steal checks (a thirteenth note, a note let go during the fade) all passed. None struck a key twice.

## Solution

In `note_on`, look at the voice `find_held` returns before releasing it. If its note is still waiting, the new strike replaces the waiting note and nothing else happens (`cpp/devices/chamber-strings/chamber_strings.h`, `note_on`):

```cpp
const int held = pool_.find_held(note_id);
if (held >= 0) {
  Voice& again = pool_.voices[held];
  if (again.pending) {
    // Struck again before it could start: the waiting note is this one.
    again.next_frequency = frequency;
    again.next_gain = gain;
    return;
  }
  release(again, true);  // a key struck again while held
}
```

## Why This Works

The chain that made two voices:

1. The pool is full. `note_on(X)` steals voice V, the pool records X as V's note id, and the instrument marks V pending while the old note fades.
2. `note_on(X)` again. `find_held(X)` returns V, because a pending voice is active and reports itself as not releasing (it has to, so that `note_off` can find it and cancel the waiting note).
3. The instrument treats this as a key struck again while held and releases V. V is still pending, so it still does not count as releasing, and the pool has no idle and no releasing voice to hand out.
4. The pool falls back to the quietest held voice, oldest on a tie (`cpp/kit/voices.h`, `quietest`). V now has the newest stamp, so on a tie the pool takes a different voice W and records X for it too.
5. Both fades end and both voices start note X. `find_held` returns the newest match, so `note_off(X)` releases W. V holds X with no key that can end it.

Replacing the waiting note keeps one voice per note id, which is the invariant `find_held` and `note_off` rely on.

## Prevention

- Any instrument that parks a note in a stolen voice needs the pending case in `note_on`, before the "struck again" path. Bowed String (`cpp/devices/bowed-string/bowed_string.h`) and Modal Bells (`cpp/devices/modal-bells/modal_bells.h`) park notes the same way; neither was checked for this sequence when this was written.
- Test it with levels that tie. The check in `cpp/test/chamber_strings_test.cpp` ("a key struck twice during a steal") holds twelve equal notes for three seconds, strikes a thirteenth key twice, and asserts two things: the chord's second note is still there (only one voice was taken), and after every note off the device reaches exact silence. Before the fix both failed.
- A decaying instrument hides the bug, because the orphaned voice rings out by itself. A sustained one does not.
