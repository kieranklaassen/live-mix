---
'@kieranklaassen/live-mix': patch
---

Devices that cost less: nine more rest when there is nothing left to hear, and the mixer EQ's analysis takes a third of the time.

- **Nine devices sleep.** `plate-reverb`, `fdn-reverb`, `ether-reverb`, `stereo-widener`, `true-peak-limiter`, `spectral-drifter`, `felt-piano`, `hall-reverb` and `fet-limiter` ran their whole DSP on silence for as long as they lived. Each now rests behind `kit::IdleGate` once its input is silent and its own tail is over, and wakes on input, a note or a parameter. At rest the nine together cost 2.8 µs a block where they cost 124 µs (`node scripts/bench-devices.mjs`, 128 frames at 48 kHz).
  - `plate-reverb`, `fdn-reverb`, `ether-reverb`, `stereo-widener` and `true-peak-limiter` render the same bits as before, after a sleep too: the reverbs keep their modulators turning while they sleep, and a held freeze never sleeps.
  - `hall-reverb` is the same while awake and after it wakes; asleep it writes exact zeros where it used to leave 1.6e-20 for ever. `fet-limiter` differs by at most 2.4e-7 after a sleep.
  - `spectral-drifter` and `felt-piano` are the same until their first sleep. After one, their free-running clocks (the grain cycle; the room's LFOs and the grit noise) go on from where they stopped, not from where they would have been: the same sound at another moment of its drift.
  - A Faust device states its own hold, the second argument of `FaustDevice<Dsp, IdleHoldSeconds>`: longer than anything the DSP goes on doing in silence that its output does not show (`docs/faust-devices.md`).
- **`kit::Fft::forward_real`**: `forward()` for a real signal in half the butterflies. Only the lower half of every stage is worked out, with `forward()`'s arithmetic in `forward()`'s order, so bins 0 to N/2 come out as the same floats (`test_real_fft` in `cpp/test/kit_test.cpp`); the half spectrum is packed in one array of N. `ambient-eq`'s analysis and `spectral-blur`'s forward transform use it, and `ambient-eq` no longer steps what has settled. Both render the same bits as before; `ambient-eq` costs 4.7 µs a block where it cost 12.6 µs, `spectral-blur` 24 µs where it cost 31 µs (old and new alternated in one process).
- `scripts/bench-devices.mjs` times every built device the way the worklet runs it, at work and at rest, and prints one JSON object: the way to compare two builds of the whole set (`--wasm <dir>` names the other build).
