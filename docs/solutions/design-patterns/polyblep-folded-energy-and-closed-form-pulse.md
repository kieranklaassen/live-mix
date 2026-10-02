---
title: 'PolyBLEP parks its folded energy near Nyquist: when a voice needs a closed-form pulse'
date: 2026-10-02
category: design-patterns
module: spec devices (cpp/devices, cpp/kit)
problem_type: design_pattern
component: audio_dsp
severity: medium
applies_when:
  - A device harness checks that fold-back at a high note is some number of dB down
  - A voice plays fundamentals above about 1 kHz through a filter that can be fully open
  - A voice is planned on kit::BlepOsc and its notes reach the top octaves
  - Someone proposes replacing a device's own band-limited oscillator with kit::BlepOsc
tags: [aliasing, polyblep, band-limited, oscillator, spec-device, measurement, chord-harp]
---

# PolyBLEP parks its folded energy near Nyquist: when a voice needs a closed-form pulse

## Context

The Chord Harp (`cpp/devices/chord-harp`) plucks pulse-wave strings up to 4.3 kHz. Its plan put the
voice on `kit::BlepOsc`, because the kit says of it that "aliasing sits below -60 dB for fundamentals
under a tenth of the sample rate" (`cpp/kit/osc.h:8`), and 4.3 kHz is under a tenth of 44.1 kHz. The
kit's own test agrees: one harmonic of a 1244.5 Hz saw folded to 535.5 Hz is under -90 dB
(`cpp/test/kit_test.cpp:176`).

The device's harness then measured something else: the share of all the energy in the band that does
not sit on a harmonic of the note (`folded_share`, `cpp/test/chord_harp_test.cpp:108`), with the
filter open, against a bar of 50 dB down. The PolyBLEP voice read -28.6 dB. Three things were mixed
up in that number, and it took several rounds of measuring to pull them apart.

## Guidance

**1. Decide what "N dB down" counts before choosing the oscillator.** The two kit figures and the
harness figure measure different things, and all are true at once. Measured on the raw output of
`kit::BlepOsc::pulse` at 30 % width, with the harness's own measure (16384-point Hann spectrum,
everything further than 16 bins from a harmonic counts as folded), at 48 kHz:

| Note      | Whole band | Strongest folded component | Under 10 kHz only | Under 5 kHz only |
| --------- | ---------- | -------------------------- | ----------------- | ---------------- |
| 261.6 Hz  | -38.7 dB   | -45.3 dB at 23.9 kHz       | -62.5 dB          | -74.6 dB         |
| 1046.5 Hz | -33.0 dB   | -35.5 dB at 21.8 kHz       | -56.9 dB          | -72.1 dB         |
| 2637 Hz   | -32.0 dB   | -32.8 dB at 19.0 kHz       | -50.1 dB          | -75.3 dB         |
| 3136 Hz   | -25.3 dB   | -25.0 dB at 22.9 kHz       | -56.5 dB          | -66.2 dB         |
| 4186 Hz   | -26.8 dB   | -26.7 dB at 22.9 kHz       | -64.2 dB          | -70.6 dB         |
| 4290 Hz   | -27.4 dB   | -26.7 dB at 22.3 kHz       | -45.6 dB          | -66.5 dB         |

At 44.1 kHz the whole-band figures are -38.4 dB at 261.6 Hz and -26 to -30 dB from 2 kHz up; the saw
and the square are within 6 dB of the 30 % pulse. (These came from a throwaway program run
against the kit while writing this note; it is not in the tree. To repeat it, feed `BlepOsc` output
to a copy of `folded_share`.)

So PolyBLEP does what the kit says where it matters most: what folds below 5 kHz is about 60 dB down
or better (58.9 dB at worst, at 44.1 kHz). What it leaves is energy folded into the top octave under
Nyquist, and counted over the whole band that is only 25 to 39 dB down for any note from middle C up
at 44.1 and 48 kHz. A whole-band bar of 50 dB cannot be met there by `kit::BlepOsc` alone.

**2. A low-pass after the oscillator is what moves a PolyBLEP voice toward a whole-band bar, so
measure with the filter as far open as the device lets it go.** With the Chord Harp's Tone at its
default the PolyBLEP voice read about -47 dB at the top strings, and about -30 dB with Tone fully up
(measured in the session that built the device; that version of the voice is not in the tree). How
far a filter takes it depends on its corner and slope; a voice whose filter stays low may pass on
`kit::BlepOsc`, and that is less code.

**3. Measure under the soft clip's knee.** `kit::soft_clip` makes harmonics of its own, and at high
notes those fold too. The first failing run was at Volume 0 dB with the note above the knee, so part
of the -28.6 dB was the clip and not the oscillator. The check now runs at the default volume and
says so (`cpp/test/chord_harp_test.cpp:355`).

**4. When the notes are high and the filter can open, build the pulse from a fixed number of
harmonics.** A high note has few harmonics under 20 kHz, and a waveform that never contains anything
above them has nothing to fold. The Chord Harp's `Pulse` (`cpp/devices/chord-harp/chord_harp.h:281`)
does it this way:

- A band-limited impulse train is the closed form of `1 + 2 cos x + ... + 2 cos nx`, which is
  `sin((2n + 1) x / 2) / sin(x / 2)`. One train marks the rising edge, a second one `width` of a
  cycle later marks the falling edge, and a running sum of rising minus falling is the pulse.
- `n` is set once when the string starts: the harmonics that fit under 20 kHz, or under 0.45 of the
  sample rate if that is lower (`start`, `chord_harp.h:303`).
- The two sines turn by a fixed angle each sample, so they are kept as rotating sine and cosine
  pairs in double precision and never looked up. The falling edge reuses the same pairs turned back
  by the width, so both edges cost one division between them (`next`, `chord_harp.h:334`).
- The running sum leaks at 4 Hz so that rounding cannot walk it off centre, and it starts at the
  value that puts the first sample halfway up the edge with no DC (`chord_harp.h:323`).
- Where `sin(x / 2)` reaches zero the train is at its peak of 1; a guard takes that branch instead
  of dividing (`kEdge`, `chord_harp.h:283`).

With this voice the harness reads -76.9 dB at 44.1 kHz and -76.7 dB at 48 kHz, filter open, from
2 kHz to the top string.

## Why This Matters

The build brief for new instruments names both things at once: band-limit with the kit's PolyBLEP,
and test that fold-back at a high note is at least 50 dB down. Whether those two agree depends on
how the test counts, and nothing in the kit or the recipe says so. A device author who writes a
strict whole-band check will see `kit::BlepOsc` fail by 20 dB and has to work out alone whether the
kit, the measure or the device is wrong. An author who writes a narrow check (one folded harmonic in
the low band) will pass and ship high notes with inharmonic components 25 to 33 dB under the
fundamental between 18 and 23 kHz.

Nobody has listened to either version. Whether energy that high and that far down can be heard on a
bright, exposed note was not judged; the Chord Harp took the strict reading because nothing could be
auditioned and the closed form turned out to cost less than expected.

It also matters for review: the device's `Pulse` looks like a reuse finding ("the kit already has a
band-limited pulse"). Swapping it back reads about -30 dB against the check's -50 dB.

## When to Apply

- Use `kit::BlepOsc` when the voice sits behind a low-pass that stays well under Nyquist (and the
  check passes with it fully open), or when the bar counts only what folds below a stated frequency.
  State that frequency in the check.
- Use a fixed-harmonic closed form when notes reach the top octaves, the filter can be fully open
  and the bar is whole-band.
- The closed form here fixes its harmonic count when the note starts. It suits plucked and struck
  voices whose pitch does not move. A voice that bends or glides would have to change the count
  without a click, which was not tried.
- The kit's other suggestion for bright voices is oversampling (`cpp/kit/osc.h:8`). It was not tried
  here.

## Examples

What went wrong on the way, in order:

1. PolyBLEP pulse plus a PolyBLAMP triangle an octave up, filter open, Volume 0 dB: -28.6 dB. Read
   at first as "the oscillator is broken".
2. Same voice under the clip's knee: about -30 dB open, -47 dB at the default Tone. Now clearly the
   oscillator's top-octave residue, not the clip.
3. Closed-form pulse with `kit::SineTable::lookup` for its sines: passes the bar, but the device
   cost 3.3 % of real time in the WebAssembly smoke test for eight notes. Each lookup wraps its phase
   with `std::floor` (`cpp/kit/math.h:120`), and per this session's profiling that call was most of
   the cost.
4. Same closed form with rotating pairs in double: about 0.9 % for the same test on the same (busy)
   machine, and the triangle partner replaced by a sine an octave up derived from the same pairs by
   the double-angle formulas (`octave`, `chord_harp.h:328`), which adds no harmonics to fold.

Two more things were tried and reverted in the same session: a device-local sine table in place of
the kit's, and starting each string at a phase derived from its pitch.

## Related

- `cpp/kit/osc.h` — the PolyBLEP oscillator and its stated limits.
- `cpp/test/kit_test.cpp` — the kit's single-harmonic aliasing check.
- `docs/devices.md` — notes that the test kit has no shared aliasing measure, so each harness
  carries its own; that is why two devices can mean different things by "50 dB down".
