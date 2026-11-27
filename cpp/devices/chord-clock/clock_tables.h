#pragma once

// What Chord Clock knows by heart: the fractions a key is rounded to, the five
// pulse materials and the four bodies. Voiced by measurement; no state here.

#include <cmath>

#include "../../kit/math.h"

namespace livemix {
namespace chord_clock_dsp {

constexpr int kModes = 8;
enum Pulse : int { kTap = 0, kDrop, kBow, kBreath, kPluck, kNumPulses };
enum Body : int { kWood = 0, kGlass, kSkin, kAir, kNumBodies };
enum Path : int { kGlide = 0, kSteps, kSlowing, kTurn, kNumPaths };

// --- ratios ------------------------------------------------------------------

struct Fraction {
  int p = 1, q = 1;
};

// The fraction of each semitone above the bass, octave taken out, for threes,
// fives, sevens, nines and elevens. None is further than 51 cents from its key.
inline Fraction fraction_of(int family, int semitone) {
  static const Fraction kFractions[5][12] = {
      {{1, 1}, {256, 243}, {9, 8}, {32, 27}, {81, 64}, {4, 3}, {729, 512}, {3, 2}, {128, 81}, {27, 16}, {16, 9}, {243, 128}},
      {{1, 1}, {16, 15}, {9, 8}, {6, 5}, {5, 4}, {4, 3}, {45, 32}, {3, 2}, {8, 5}, {5, 3}, {9, 5}, {15, 8}},
      {{1, 1}, {15, 14}, {8, 7}, {7, 6}, {5, 4}, {4, 3}, {7, 5}, {3, 2}, {14, 9}, {12, 7}, {7, 4}, {15, 8}},
      {{1, 1}, {16, 15}, {10, 9}, {7, 6}, {9, 7}, {4, 3}, {10, 7}, {3, 2}, {14, 9}, {5, 3}, {16, 9}, {27, 14}},
      {{1, 1}, {22, 21}, {11, 10}, {11, 9}, {14, 11}, {4, 3}, {11, 8}, {3, 2}, {11, 7}, {18, 11}, {11, 6}, {21, 11}},
  };
  return kFractions[kit::clamp_int(family, 0, 4)][((semitone % 12) + 12) % 12];
}

inline int gcd(int a, int b) {
  while (b != 0) {
    const int t = a % b;
    a = b;
    b = t;
  }
  return a < 1 ? 1 : a;
}

// The whole ratio of a key `semitones` (0 or more) above the bass, reduced.
inline Fraction ratio_of(int family, int semitones) {
  semitones = kit::clamp_int(semitones, 0, 127);
  Fraction f = fraction_of(family, semitones);
  f.p <<= semitones / 12;
  const int g = gcd(f.p, f.q);
  f.p /= g;
  f.q /= g;
  return f;
}

// --- pulse materials ---------------------------------------------------------

struct Material {
  float tau;      // how long one pulse is, seconds (each of two one-poles)
  float imp;      // how much of it is a push
  float noise;    // how much of it is noise, shaped by the same pulse
  float chirp;    // how far below its pitch a pulse starts
  float tilt;     // the body's upper modes, a power of their ratio
  float comb;     // where a string is plucked (0: not a string)
  float ring;     // how long the body rings to this pulse
  float level;    // of the pulses
  float slope;    // of the tone's harmonics
  float corner;   // the harmonic where the tone starts to fall away faster
  float odd;      // odd harmonics over even
  float sustain;  // where the tone settles under a held key
  float fall;     // seconds it takes
  float attack;   // of the tone, times the knob
  float air;      // noise that goes with the tone
  float gain;     // of the tone
  float knock;    // noise of a pulse that the body does not tune
  float wind;     // and of the tone
  float release;  // of the tone, times the knob
  float spread;   // how wide the tone stands
};

inline const Material& material(int pulse) {
  static const Material kMaterials[kNumPulses] = {
      // Tap: a knuckle. Round tone, a little hollow.
      {0.00040f, 1.0f, 0.14f, 0.0f, 0.15f, 0.0f, 1.0f, 1.0f, 1.0f, 11.0f, 0.15f, 0.85f, 2.5f, 1.0f, 0.02f, 1.0f, 0.5f, 0.0f, 1.0f, 1.0f},
      // Drop: each pulse rises into its pitch. Nearly a pure tone.
      {0.00160f, 1.0f, 0.0f, 0.35f, -1.6f, 0.0f, 0.75f, 0.85f, 5.0f, 1.8f, 0.0f, 1.0f, 2.0f, 2.5f, 0.0f, 1.12f, 0.0f, 0.0f, 1.7f, 1.0f},
      // Bow stroke: a long rough stroke. Full, reedy tone that comes slowly.
      {0.05500f, 0.0f, 0.22f, 0.0f, 0.1f, 0.0f, 1.1f, 0.65f, 0.30f, 30.0f, 0.0f, 1.0f, 2.0f, 5.5f, 0.10f, 0.85f, 0.10f, 0.0f, 0.36f, 0.25f},
      // Breath: a puff. Soft tone with air round it.
      {0.08500f, 0.0f, 0.10f, 0.0f, 0.35f, 0.0f, 0.22f, 0.75f, 3.6f, 2.2f, 0.8f, 1.0f, 2.0f, 5.0f, 0.5f, 0.75f, 0.7f, 1.0f, 2.2f, 1.0f},
      // Pluck: a fingernail on a string. Bright, and it dies under the key.
      {0.00009f, 1.0f, 0.03f, 0.0f, 0.45f, 0.21f, 1.9f, 0.9f, 0.5f, 40.0f, 0.0f, 0.05f, 0.75f, 0.05f, 0.0f, 2.1f, 0.15f, 0.0f, 0.4f, 1.0f},
  };
  return kMaterials[kit::clamp_int(pulse, 0, kNumPulses - 1)];
}

// --- bodies --------------------------------------------------------------------

struct Formant {
  float hz, width, gain;  // width in octaves, gain as a share added
};

struct Resonator {
  float ratio[kModes], weight[kModes], keep[kModes];
  float ring;     // seconds to -60 dB of its first mode
  float tilt;     // of the tone's harmonics
  float odd;      // odd harmonics over even
  float corner;   // Hz where the tone is cut
  float sub;      // the octave below, always there
  float sustain, fall;  // a body that takes the tone down under a held key
  float attack;
  float release;  // of the tone, times the knob
  float air;      // noise with the tone, tuned
  float wind;     // and not
  float level;    // of the pulses
  float gain;     // of the tone
  float spread;   // how wide the tone stands
  float knock_hz;  // where the untuned noise lies
  Formant formants[3];
};

inline const Resonator& resonator(int body) {
  static const Resonator kBodies[kNumBodies] = {
      // Wood: a bar over a box.
      {{1.0f, 2.0f, 3.98f, 5.1f, 6.8f, 9.2f, 11.6f, 0.5f},
       {1.0f, 0.16f, 0.42f, 0.10f, 0.10f, 0.16f, 0.06f, 0.10f},
       {1.0f, 0.55f, 0.40f, 0.24f, 0.2f, 0.16f, 0.12f, 0.5f},
       0.55f, 0.0f, 0.25f, 3800.0f, 0.0f, 1.0f, 2.0f, 1.0f, 1.0f, 0.0f, 0.0f, 1.0f, 1.0f, 0.85f, 900.0f,
       {{330.0f, 0.55f, 0.9f}, {870.0f, 0.4f, 1.1f}, {2000.0f, 0.5f, 0.3f}}},
      // Glass: rings on, with sparse high partials.
      {{1.0f, 1.002f, 2.32f, 4.25f, 4.262f, 6.63f, 9.38f, 12.2f},
       {0.62f, 0.5f, 0.26f, 0.30f, 0.26f, 0.22f, 0.10f, 0.05f},
       {1.0f, 0.95f, 0.8f, 0.66f, 0.62f, 0.42f, 0.28f, 0.2f},
       2.6f, 0.34f, 0.85f, 5600.0f, 0.0f, 0.9f, 5.0f, 1.6f, 2.0f, 0.0f, 0.0f, 0.62f, 0.85f, 1.0f, 4200.0f,
       {{2300.0f, 0.6f, 0.65f}, {4300.0f, 0.35f, 0.5f}, {300.0f, 0.8f, -0.45f}}},
      // Skin: a membrane over air. Deep, soon over.
      {{1.0f, 0.5f, 1.5f, 1.98f, 2.44f, 2.9f, 3.45f, 4.4f},
       {1.0f, 0.45f, 0.42f, 0.28f, 0.18f, 0.13f, 0.09f, 0.05f},
       {1.0f, 0.8f, 0.6f, 0.46f, 0.34f, 0.28f, 0.22f, 0.16f},
       0.42f, -0.9f, 0.0f, 420.0f, 0.75f, 0.22f, 0.9f, 0.3f, 0.45f, 0.0f, 0.0f, 0.85f, 1.3f, 0.8f, 260.0f,
       {{140.0f, 0.8f, 1.0f}, {420.0f, 0.5f, 0.4f}, {1500.0f, 0.8f, -0.5f}}},
      // Air: a column with a mouth. Breath and vowels.
      {{1.0f, 3.0f, 2.0f, 5.0f, 4.0f, 7.0f, 9.0f, 6.0f},
       {0.75f, 0.40f, 0.22f, 0.30f, 0.12f, 0.20f, 0.12f, 0.10f},
       {1.0f, 0.7f, 0.8f, 0.5f, 0.6f, 0.4f, 0.3f, 0.45f},
       0.16f, 0.46f, 0.6f, 4800.0f, 0.0f, 1.0f, 2.0f, 3.5f, 0.32f, 0.6f, 1.9f, 1.05f, 0.9f, 1.75f, 2100.0f,
       {{560.0f, 0.26f, 4.5f}, {1150.0f, 0.2f, 5.0f}, {2700.0f, 0.26f, 4.5f}}},
  };
  return kBodies[kit::clamp_int(body, 0, kNumBodies - 1)];
}

// The body's colour at a frequency.
inline float body_colour(const Resonator& body, float hz) {
  const float over = hz / body.corner;
  float colour = 1.0f / std::sqrt(1.0f + over * over * over * over);
  const float octave = std::log2(hz);
  for (const Formant& formant : body.formants) {
    const float away = (octave - std::log2(formant.hz)) / formant.width;
    colour *= 1.0f + formant.gain * std::exp(-0.5f * away * away);
  }
  return colour;
}

}  // namespace chord_clock_dsp
}  // namespace livemix
