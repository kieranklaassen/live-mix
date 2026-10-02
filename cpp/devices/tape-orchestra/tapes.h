#pragma once

// The recordings of Tape Orchestra: what is "on the tape" under each key.
//
// There are no samples. A key's recording is one period of the instrument at
// that key's pitch, built from its harmonics at note-on by an inverse FFT:
//
//   harmonic h of a note at f0 = source(h, f0) × body(h·f0) × ripple(h·f0)
//
// - `source` is what the string, air column or voice produces: a sawtooth-like
//   series for bowed strings and brass, a near-sine for the flute, mostly odd
//   harmonics for the reeds in their low register, a glottal series for the
//   choir.
// - `body` is the fixed resonator the instrument speaks through, at absolute
//   frequencies: the wood resonances and bridge hill of a violin, the bell of
//   a horn, the nasal formant of an oboe, the vowel of a choir.
// - `ripple` is a dense, fixed unevenness of a few dB (the many narrow modes
//   of a wooden body, the room the recording was made in). Because it does
//   not move with the note, every key comes out with a slightly different
//   balance of harmonics, as on a set of separate recordings.
//
// Two periods are built per key, A with the body sampled a little flat of
// the note and B a little sharp (±kVibratoSpanCents). A player's vibrato and
// detuning fade between the two while its pitch moves, so harmonics rise and
// fall as they cross the resonances: the shimmer of real vibrato, which a
// single looped period cannot have. Tape speed changes read both faster or
// slower, which moves pitch and resonances together, as tape does.

#include "../../kit/fft.h"
#include "../../kit/math.h"

namespace livemix {
namespace tape_orchestra_dsp {

enum Tape : int { kStrings = 0, kCellos, kFlutes, kHorns, kReeds, kChoir, kNumTapes };

constexpr int kTableSize = 2048;
constexpr int kMaxHarmonics = 192;
// The recordings hold nothing above this: the tape path rolls off below it.
constexpr float kRecordedBandHz = 10500.0f;
// Half the distance in pitch between the two periods of a key.
constexpr float kVibratoSpanCents = 30.0f;
constexpr int kMaxPlayers = 4;

// A resonance of a body: a bell `db` high and `width` Hz to its half height.
struct Bell {
  float hz;
  float width;
  float db;
};

// What differs between the tapes besides their spectra.
struct TapeDef {
  int players;            // how many play each key
  float attack;           // seconds a player takes to speak
  float swell;            // seconds of slow swell after that ...
  float swell_amount;     // ... and how much of the level it holds back
  float vibrato_cents;    // depth at Vibrato 1
  float vibrato_hz;       // centre rate
  float tremolo;          // level change that goes with the vibrato
  float detune_cents;     // spread of the players at Section 1
  float noise_db;         // bow or breath noise under the tone
  float burst_db;         // extra noise at the start (scrape, chiff) ...
  float burst_seconds;    // ... and how long it lasts
  float noise_hz;         // centre of the noise band: this ...
  float noise_track;      // ... plus this many times the note
  float noise_q;
  float closed_hz;        // brightness low-pass while a player is quiet ...
  float closed_track;     // (hz + track × note)
  float open_hz;          // ... and at full voice
  float open_track;
  float level_db;         // trim so the tapes sit at one loudness
};

// clang-format off
constexpr TapeDef kTapes[kNumTapes] = {
  // Strings: three violins. A fast bow attack with a scrape, wide vibrato.
  {3, 0.045f, 0.35f, 0.25f, 24.0f, 5.9f, 0.04f, 9.0f, -31.0f, 17.0f, 0.07f, 3600.0f, 0.0f, 0.7f,
   1800.0f, 3.0f, 14000.0f, 8.0f, 0.0f},
  // Cellos: slower to speak, darker, slower vibrato.
  {3, 0.09f, 0.5f, 0.3f, 20.0f, 5.2f, 0.04f, 8.0f, -33.0f, 15.0f, 0.1f, 1900.0f, 0.0f, 0.7f,
   900.0f, 3.0f, 9000.0f, 8.0f, 0.5f},
  // Flutes: breath that follows the tone, a chiff, vibrato that is mostly level.
  {3, 0.05f, 0.25f, 0.2f, 9.0f, 5.3f, 0.22f, 6.0f, -25.0f, 13.0f, 0.05f, 900.0f, 2.2f, 1.1f,
   1200.0f, 2.0f, 9000.0f, 6.0f, 1.5f},
  // Horns: a slow rounded attack that opens as it swells, hardly any vibrato.
  {4, 0.11f, 0.9f, 0.45f, 5.0f, 5.0f, 0.03f, 8.0f, -41.0f, 12.0f, 0.06f, 500.0f, 1.0f, 0.8f,
   260.0f, 1.3f, 2400.0f, 5.0f, 2.0f},
  // Reeds: clarinets and an oboe. Quick to speak, narrow vibrato.
  {3, 0.035f, 0.3f, 0.2f, 8.0f, 5.6f, 0.08f, 6.0f, -38.0f, 10.0f, 0.04f, 2200.0f, 0.0f, 0.8f,
   1500.0f, 3.0f, 12000.0f, 8.0f, 0.5f},
  // Choir: four singers a side, slow to arrive, wide slow vibrato.
  {4, 0.14f, 0.6f, 0.3f, 26.0f, 5.4f, 0.06f, 12.0f, -31.0f, 6.0f, 0.12f, 1700.0f, 0.0f, 0.6f,
   900.0f, 2.0f, 10000.0f, 6.0f, 1.0f},
};
// clang-format on

}  // namespace tape_orchestra_dsp
}  // namespace livemix
