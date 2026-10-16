---
title: A key sent at one pitch, another and the first again is left with two held voices
date: 2026-10-16
category: logic-errors
module: cpp/devices (polyphonic instruments on kit::VoicePool)
problem_type: logic_error
component: dsp_devices
symptoms:
  - Coloured Noise keeps sounding with no key down after its one note off
  - Twin Bars rings on at the held Decay after its key is let go
  - It needs one note id sent at a pitch, at another pitch and at the first again while the first voice still sounds
  - Every harness passed, and a run of random note events did not reach the sequence
root_cause: logic_error
resolution_type: code_fix
severity: medium
tags: [voice-pool, note-id, note-on, stuck-note, early-return, retune, native-harness, instruments]
---

# A key sent at one pitch, another and the first again is left with two held voices

## Problem

In Coloured Noise and Twin Bars a note id sent at pitch A, then at pitch B, then at pitch A again while its first voice still sounded was left with two held voices. `kit::VoicePool::find_held` returns only the newest held voice of an id (`cpp/kit/voices.h:59`), so one note off ended one of them and the other played on.

## Symptoms

Measured natively at 48 kHz, at the default settings, in blocks of 128.

- **Coloured Noise** (Attack 2 s, Release 4 s). A held for 3 s, then B, then A again 10 ms later, then one note off: the last second still read RMS 0.028 forty seconds after the note off, and 0.030 after 600 seconds. A plain key is exactly zero from 6.7 s after its note off.
- **Twin Bars** (Decay 6 s, Damp 0.3). After the same sequence the bars took 5.3 to 5.6 s to fall 60 dB. A plain key let go takes 1.43 s, and a key never let go takes 5.66 s. The bars do ring out in the end, so nothing sounds for ever.
- The third strike has to come while the first voice is still active. In Coloured Noise that is about 80 ms after the second strike when the first voice was held (it falls 60 dB in 50 ms; at 90 ms the sequence ended). When the first key had been let go by a note off before B, it is as long as that key's release tail lasts: at Release 4 s, A sent 5 s after B never ended and A sent 8 s after B ended. In Twin Bars it is as long as the first bars still ring.
- It depends on where the voices stand in the pool. With the voice at A standing after the voice at B, every sequence ended as a plain key does, in both devices.
- A full pool does not stop it. Where B had to wait in a taken voice and A came back during the wait, Coloured Noise never ended.

## What Didn't Work

- The build's own checkers and all the native harnesses passed. The fault was found by a code review after the nine devices of the family were joined. Two review lenses found it in Coloured Noise, each by itself, and one of them found it in Twin Bars. A third traced the same sequence by hand against the older write-up on waiting notes. A validator and a separate run then built the devices and measured it.
- The Coloured Noise harness played "the same id again at the same pitch" (`cpp/test/coloured_noise_test.cpp:1283`) and "the same id at a new pitch" (`cpp/test/coloured_noise_test.cpp:1346`), each alone. Both pass on the old header. The fault needs the two together, in that order.
- One harness in the family did play the return to the first pitch: Binaural's (`cpp/test/binaural_test.cpp:1608`, the id at 220, 330 and 220 Hz in one block, then one note off and exact silence). Binaural passes it. The case was not carried over to the other five instrument harnesses.
- The review's run of random events did not reach it: about 450 events a run, note ons and offs on 22 ids with ids and pitches repeated, at three sample rates. A random run needs the same id, the first pitch again, inside the window, and the right order in the pool.
- A check for silence long after the note off read Twin Bars as clean. One of the review's programs looked at the peak 120 s after the one note off, and Twin Bars was at zero there, because its bars ring out by themselves. The fault showed only when the ring time was measured against a plain key up.
- How often the app reaches it was not measured. The engine's track passes the id and the frequency straight to the device (`src/core/tracks/InstrumentTrack.ts:77`). Per the review, the app's play tools pair each note on with a note off. A host that retunes held ids reaches it: a glide, a scale change, an arpeggio over held ids.

## Solution

Do not return from inside the loop over the id's voices. Remember the voice that stands at the struck pitch, let the loop go on and let go every other voice of the id, then strike the remembered voice after the loop.

Coloured Noise before, inside the loop of `note_on`:

```cpp
if (own.frequency == frequency && !own.stolen) {
  // Struck again where it stands.
  own.gain_target = gain;
  own.env.gate_on();
  return;  // the id's voices further on in the pool are never looked at
}
// The same id at another pitch: a held voice is let go quickly.
if (!own.env.releasing()) own.env.fast_release(kRestrikeSeconds);
```

Coloured Noise now (`cpp/devices/coloured-noise/coloured_noise.h:123` to `154`):

```cpp
int again = -1;
for (int v = 0; v < kMaxVoices; ++v) {
  Voice& own = pool_.voices[v];
  if (pool_.note_id_of(v) != note_id || !own.active()) continue;
  if (own.waiting) { /* the waiting note is this one */ return; }
  if (again < 0 && own.frequency == frequency && !own.stolen) {
    again = v;  // struck again where it stands: held again below
    continue;
  }
  if (!own.env.releasing()) own.env.fast_release(kRestrikeSeconds);
}
if (again >= 0) {
  Voice& own = pool_.voices[again];
  own.gain_target = gain;
  own.env.gate_on();
  return;
}
```

Twin Bars has the same change (`cpp/devices/twin-bars/twin_bars.h:142` to `156`): the loop remembers the voice whose material and frequency match, marks every other ringing voice of the id `released`, and after the loop sets `released = false` on the remembered voice and plays it.

Both harnesses now play the sequence and ask for the end a plain key has:

- `cpp/test/coloured_noise_test.cpp:1360`: A, B, then A 10 ms later, one note off, exact silence.
- `cpp/test/coloured_noise_test.cpp:1382`: A let go, B, A a second later under a Release of 2 s, one note off, exact silence.
- `cpp/test/coloured_noise_test.cpp:1401`: through a full pool, where B waits in a taken voice and A comes back 10 ms later.
- `cpp/test/twin_bars_test.cpp:627`: A, B, A, one key up, and the ring time is within 5 % of a key struck once and let go, at the default Damp and at Damp 1.
- `cpp/test/twin_bars_test.cpp:1178`: through a full pool, then exact silence a second after every key is let go.

As reported with the fix, each new case failed on the old header and passes on the new one. The review's own run with the same change of shape left 0 of its sequences sounding in Coloured Noise and 0 ringing as if held in Twin Bars. The fix is in live-mix #194, not merged as of this writing.

## Why This Works

The chain that made two held voices in Coloured Noise:

1. `note_on(X, A)` starts voice 0.
2. `note_on(X, B)`. The loop meets voice 0 at another pitch and lets it go with a fall of 50 ms (`kRestrikeSeconds`, `cpp/devices/coloured-noise/coloured_noise.h:220`). The pool hands out voice 1 for B. Voice 0 is still active and still carries id X, because the pool writes an id only when it hands a voice out (`cpp/kit/voices.h:54`).
3. `note_on(X, A)` inside that fall. The loop goes by index, so it meets voice 0 first. Voice 0 stands at A, so the old code opened its envelope again and returned. Voice 1, at B and held, was never reached.
4. X now has two held voices. `note_off(X)` asks `find_held`, which gives the newest one (`cpp/kit/voices.h:60` to `68`), voice 1. Voice 0 stays held with no key that can end it.

When the first key was let go by a note off before B, step 2 leaves voice 0 alone ("a fading one fades on"), so it stays active for the whole Release and step 3 has that long to happen.

Twin Bars takes the same steps with other flags. A let go voice whose bars still ring is taken up as held when its key is struck again at its pitch (`released = false`), which is right for a plain key. The old code returned there before the loop had marked the id's other voice `released`. `note_off` then marked only the voice `find_held` gave (`cpp/devices/twin-bars/twin_bars.h:174`), and Damp never reached the other.

The order in the pool decides it. When the voice at A stands after the voice at B, the loop lets B go before it meets A, and the old code was right by chance. That is why a fault this plain passed every run that did not put the voices in the failing order.

After the fix the loop sees every voice of the id before any of them is held again. An id keeps one held voice, which is what `find_held` and `note_off` rely on.

## Prevention

- Every device with a "struck again where it stands" path needs a harness case that plays the same id at pitch A, at B and at A again while the first voice still rings, then one note off, and asks the device to end as fast as it does after a plain key up.
- Ask a device that sustains for exact silence. Ask a device that decays for the damped ring time against a plain key up. Silence alone passes a decaying device that has the fault.
- Play it three ways: the third strike inside the fall that the second strike began (10 ms on), the first key let go before B under a long Release, and through a full pool where B has to wait for a voice. Start the id in an empty pool, so that its first voice stands before its second.
- The shape to look for in code: a `return` inside a loop that also cleans up for the same id. Whatever stands after the returning voice is skipped. Finish the loop, then act.
- What is known of the other four instruments of the family, at this writing:
  - Binaural has the same loop with a `return` in it (`cpp/devices/binaural/binaural.h:172`). By reading, it is kept clear of the fault by one line: the loop skips a voice that is already on its way out (`cpp/devices/binaural/binaural.h:171`), and a strike at another pitch puts the id's other voices on their way out (`cpp/devices/binaural/binaural.h:179`). Its harness holds the sequence in one block.
  - Isochronic and Still Point have no such loop. They act on the one voice `find_held` gives (`cpp/devices/isochronic/isochronic.h:132`, `cpp/devices/still-point/still_point.h:113`).
  - Breath Pacer keeps the id's one voice and retunes it where it is (`cpp/devices/breath-pacer/breath_pacer.h:213`).
  - In the review's run all four were at exact zero 120 s after the one note off, for two sequences: A, B and A in one block, and A let go, B 0.2 s later, A 0.2 s after that. Other timings and a full pool were not run on them, and of the four only Binaural's harness plays the sequence.
- Instruments outside this family were not part of the review and were not read for this shape.

## Related Issues

- [A key struck twice inside a steal fade leaves a voice that no note off ends](stolen-voice-pending-note-restrike-stuck-voice.md): another route to two voices under one id, through a note that waits in a taken voice. The rule broken is the same one.
- [A fast release that is cut short becomes the next note's release](adsr-fast-release-outlives-a-stolen-voice.md): the same restrike path, another fault.
- [A voice must report its loudness from the moment it is taken, or the next note steals it](voice-level-must-be-valid-when-a-voice-is-taken.md): what the pool needs from a voice when it picks one.
- [Take each trait out of the device and see that its harness fails](../best-practices/mutation-check-a-measuring-harness.md): a harness that passes says little until the trait is taken out.
