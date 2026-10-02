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
  float closed_hz;        // brightness low-pass while a player is quiet ...
  float closed_track;     // (hz + track × note)
  float open_hz;          // ... and at full voice
  float open_track;
  float level_db;         // trim so the tapes sit at one loudness
  float blend;            // level of the other players under the first
};

// clang-format off
constexpr TapeDef kTapes[kNumTapes] = {
  // Strings: three violins. A fast bow attack with a scrape, wide vibrato.
  {3, 0.045f, 0.35f, 0.25f, 24.0f, 5.9f, 0.04f, 9.0f, -31.0f, 17.0f, 0.07f, 3600.0f, 0.0f,
   1800.0f, 3.0f, 14000.0f, 8.0f, 0.0f, 0.8f},
  // Cellos: slower to speak, darker, slower vibrato.
  {3, 0.09f, 0.5f, 0.3f, 20.0f, 5.2f, 0.04f, 8.0f, -33.0f, 15.0f, 0.1f, 1900.0f, 0.0f,
   900.0f, 3.0f, 9000.0f, 8.0f, 0.5f, 0.75f},
  // Flutes: breath that follows the tone, a chiff, vibrato that is mostly level.
  {3, 0.05f, 0.25f, 0.2f, 9.0f, 5.3f, 0.22f, 2.5f, -25.0f, 13.0f, 0.05f, 900.0f, 2.2f,
   1200.0f, 2.0f, 9000.0f, 6.0f, 1.3f, 0.24f},
  // Horns: a slow rounded attack that opens as it swells, hardly any vibrato.
  {4, 0.11f, 0.9f, 0.45f, 5.0f, 5.0f, 0.03f, 3.0f, -41.0f, 12.0f, 0.06f, 500.0f, 1.0f,
   100.0f, 0.8f, 2400.0f, 5.0f, 1.2f, 0.24f},
  // Reeds: clarinets and an oboe. Quick to speak, narrow vibrato.
  {3, 0.035f, 0.3f, 0.2f, 8.0f, 5.6f, 0.08f, 4.0f, -38.0f, 10.0f, 0.04f, 2200.0f, 0.0f,
   1500.0f, 3.0f, 12000.0f, 8.0f, 0.5f, 0.4f},
  // Choir: four singers a side, slow to arrive, wide slow vibrato.
  {4, 0.14f, 0.6f, 0.3f, 26.0f, 5.4f, 0.06f, 9.0f, -31.0f, 6.0f, 0.12f, 1700.0f, 0.0f,
   900.0f, 2.0f, 10000.0f, 6.0f, 1.0f, 0.55f},
};
// clang-format on

// --- spectra -----------------------------------------------------------------

inline float db_to_linear(float db) { return std::exp2(db * 0.16609640f); }

inline float bells_db(const Bell* bells, int count, float hz) {
  float db = 0.0f;
  for (int i = 0; i < count; ++i) {
    const float x = (hz - bells[i].hz) / bells[i].width;
    db += bells[i].db / (1.0f + x * x);
  }
  return db;
}

// Second-order high-pass and low-pass shapes (magnitude only).
inline float low_cut(float hz, float corner) {
  const float r = hz / corner;
  const float r2 = r * r;
  return r2 / std::sqrt(1.0f + r2 * r2);
}
inline float high_cut(float hz, float corner) {
  const float r = hz / corner;
  const float r2 = r * r;
  return 1.0f / std::sqrt(1.0f + r2 * r2);
}

inline float smoothstep(float x) {
  x = kit::clamp(x, 0.0f, 1.0f);
  return x * x * (3.0f - 2.0f * x);
}

// The dense unevenness of a body, in dB: three interleaved combs, fixed per
// tape, fading out below a few hundred hertz where the bells do the work.
inline float ripple_db(int tape, float hz, float depth) {
  const float t = 0.618034f * static_cast<float>(tape + 1);
  const float sum = 0.5f * kit::SineTable::lookup(hz * (1.0f / 97.0f) + t) +
                    0.3f * kit::SineTable::lookup(hz * (1.0f / 153.0f) + 2.3f * t) +
                    0.2f * kit::SineTable::lookup(hz * (1.0f / 61.0f) + 0.7f * t);
  return depth * sum * (hz / (hz + 450.0f)) * 2.0f;
}

// One formant of a vocal tract in cascade form: unity at DC, F/B at its peak.
inline float formant(float hz, float centre, float bandwidth) {
  const float f2 = hz * hz;
  const float c2 = centre * centre;
  const float d = c2 - f2;
  return c2 / std::sqrt(d * d + bandwidth * bandwidth * f2);
}

inline float vowel_ah(float hz, float scale) {
  static constexpr float kCentre[5] = {730.0f, 1090.0f, 2440.0f, 3400.0f, 4300.0f};
  static constexpr float kBand[5] = {120.0f, 140.0f, 210.0f, 320.0f, 400.0f};
  float gain = 1.0f;
  for (int i = 0; i < 5; ++i) gain *= formant(hz, kCentre[i] * scale, kBand[i] * scale);
  return gain;
}

// What the string, air column or voice gives harmonic `h` of a note at `f0`.
inline float source_gain(int tape, int h, float f0) {
  const float n = static_cast<float>(h);
  switch (tape) {
    case kStrings:
      // A bowed string falls 6 dB an octave; the body radiates the upper
      // harmonics better, which leaves about 4.5.
      return std::pow(n, -0.75f);
    case kCellos:
      return std::pow(n, -0.8f);
    case kFlutes: {
      // Nearly a sine; the harmonics are stronger in the low register.
      const float low = 1.0f + 0.6f * (1.0f - smoothstep((f0 - 300.0f) / 300.0f));
      if (h == 1) return 1.0f;
      if (h == 2) return 0.16f * low;
      if (h == 3) return 0.075f * low;
      return 0.035f * low * std::pow(0.62f, n - 4.0f);
    }
    case kHorns:
      return 1.0f / n;
    case kReeds: {
      // Clarinet below (even harmonics nearly absent, returning with their
      // number), oboe above (all harmonics).
      const float upper = smoothstep((f0 - 220.0f) / 300.0f);
      float source = std::pow(n, -0.9f);
      if ((h & 1) == 0) {
        const float even = kit::min(1.0f, 0.035f * std::pow(n, 1.6f));
        source *= even + (1.0f - even) * upper;
      }
      return source;
    }
    case kChoir:
    default:
      return 1.0f / n;
  }
}

// What the instrument's body (or bell, or vocal tract) does at `hz`, for a
// note at `f0`.
inline float body_gain(int tape, float f0, float hz) {
  switch (tape) {
    case kStrings: {
      // Air and wood resonances, the nasal region above them, a dip, and
      // the bridge hill near 3 kHz.
      static constexpr Bell kBody[6] = {{280.0f, 45.0f, 5.0f},   {450.0f, 60.0f, 4.0f},
                                        {700.0f, 110.0f, 3.0f},  {1100.0f, 400.0f, 4.0f},
                                        {1800.0f, 350.0f, -5.0f}, {2900.0f, 800.0f, 9.0f}};
      const float db = bells_db(kBody, 6, hz) + ripple_db(tape, hz, 3.5f);
      return db_to_linear(db) * low_cut(hz, 190.0f) * high_cut(hz, 5200.0f);
    }
    case kCellos: {
      static constexpr Bell kBody[6] = {{100.0f, 18.0f, 3.0f},  {190.0f, 30.0f, 6.0f},
                                        {300.0f, 55.0f, 5.0f},  {500.0f, 120.0f, 4.0f},
                                        {900.0f, 300.0f, 2.0f}, {1500.0f, 500.0f, 3.0f}};
      const float db = bells_db(kBody, 6, hz) + ripple_db(tape, hz, 3.0f);
      return db_to_linear(db) * low_cut(hz, 95.0f) * high_cut(hz, 2800.0f);
    }
    case kFlutes: {
      const float r = hz / 4000.0f;
      return db_to_linear(ripple_db(tape, hz, 1.0f)) / std::sqrt(1.0f + r * r);
    }
    case kHorns: {
      static constexpr Bell kBody[1] = {{450.0f, 300.0f, 6.0f}};
      const float db = bells_db(kBody, 1, hz) + ripple_db(tape, hz, 1.5f);
      return db_to_linear(db) * low_cut(hz, 70.0f) * high_cut(hz, 1800.0f);
    }
    case kReeds: {
      // The nasal formant of the oboe comes in up the keyboard.
      const float upper = smoothstep((f0 - 220.0f) / 300.0f);
      const Bell body[2] = {{1100.0f, 230.0f, 3.0f + 5.0f * upper}, {2800.0f, 600.0f, 3.0f}};
      const float db = bells_db(body, 2, hz) + ripple_db(tape, hz, 1.5f);
      return db_to_linear(db) * low_cut(hz, 110.0f) * high_cut(hz, 3200.0f);
    }
    case kChoir:
    default: {
      // Men and women on one vowel: two tracts of different length, and a
      // tract that shortens up the keyboard as the singers change.
      const float scale = 0.97f + 0.15f * smoothstep((f0 - 130.0f) / 300.0f);
      const float men = vowel_ah(hz, scale);
      const float women = vowel_ah(hz, scale * 1.18f);
      const float r = hz / 3500.0f;
      const float tilt = 1.0f / std::sqrt(1.0f + r * r);
      return std::sqrt(0.5f * (men * men + women * women)) * tilt * low_cut(hz, 90.0f) *
             db_to_linear(ripple_db(tape, hz, 1.5f));
    }
  }
}

// --- the recorder --------------------------------------------------------------

// One key's recording: the two periods interleaved (A at even indices, B at
// odd), with the first two frames repeated at the end for the interpolating
// read (two, so a phase that rounds up to a whole cycle still reads inside).
constexpr int kRecordingFloats = (kTableSize + 2) * 2;

// Builds recordings. One instance per device; `record` runs on the audio
// thread at note starts (an inverse FFT of kTableSize points, both periods
// in one transform: A in the real part, B in the imaginary part).
class Recorder {
 public:
  void init() { fft_.init(); }

  // `seed` fixes the phases of the harmonics, so a key is always the same
  // recording. Both periods come out at unit RMS (times the tape's trim).
  void record(int tape, float f0, uint32_t seed, float* recording) {
    tape = kit::clamp_int(tape, 0, kNumTapes - 1);
    for (int i = 0; i < kTableSize; ++i) {
      re_[i] = 0.0f;
      im_[i] = 0.0f;
    }
    int harmonics = static_cast<int>(kRecordedBandHz / f0);
    harmonics = kit::clamp_int(harmonics, 1, kMaxHarmonics);
    static const float kFlat = std::exp2(-kVibratoSpanCents / 1200.0f);
    static const float kSharp = std::exp2(kVibratoSpanCents / 1200.0f);
    kit::Rng rng;
    rng.seed(seed);
    // Levels first: A at re_[h], B at im_[h].
    float power = 0.0f;
    for (int h = 1; h <= harmonics; ++h) {
      const float hz = f0 * static_cast<float>(h);
      const float source = source_gain(tape, h, f0);
      re_[h] = source * body_gain(tape, f0, hz * kFlat);
      im_[h] = source * body_gain(tape, f0, hz * kSharp);
      power += 0.25f * (re_[h] * re_[h] + im_[h] * im_[h]);
    }
    power = kit::max(power, 1.0e-12f);
    // Then phases. Each harmonic comes a little later than the one below
    // it, by the share of the power that lies under it (the well-known rule
    // for a signal with a low peak factor), so the period is a glide through
    // its own spectrum instead of one pulse: the tape is driven evenly, not
    // on peaks, and stacked keys do not pile up. The glide lasts `smear` of the
    // period: at most 5 ms, which is what a body and a room do to a
    // waveform, and at most four fifths of it. A little scatter on top.
    const float smear = kit::min(0.8f, 0.005f * f0);
    float phase = 0.0f;
    float below = 0.0f;
    for (int h = 1; h <= harmonics; ++h) {
      const float a = re_[h];
      const float b = im_[h];
      phase -= smear * below / power;
      below += 0.25f * (a * a + b * b);
      const float turned = phase + 0.06f * rng.bipolar() * (h > 1 ? 1.0f : 0.0f);
      const float c = kit::SineTable::cos_lookup(turned);
      const float s = kit::SineTable::lookup(turned);
      re_[h] = 0.5f * (a * s + b * c);
      im_[h] = -0.5f * (a * c - b * s);
      re_[kTableSize - h] = 0.5f * (a * s - b * c);
      im_[kTableSize - h] = 0.5f * (a * c + b * s);
    }
    fft_.inverse(re_, im_);
    const float scale = db_to_linear(kTapes[tape].level_db) / std::sqrt(power);
    for (int i = 0; i < kTableSize; ++i) {
      recording[2 * i] = re_[i] * scale;
      recording[2 * i + 1] = im_[i] * scale;
    }
    for (int i = 0; i < 4; ++i) recording[2 * kTableSize + i] = recording[i];
  }

 private:
  kit::Fft<kTableSize> fft_;
  float re_[kTableSize] = {};
  float im_[kTableSize] = {};
};

}  // namespace tape_orchestra_dsp
}  // namespace livemix
