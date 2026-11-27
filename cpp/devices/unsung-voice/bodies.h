#pragma once

// What the keys are sung with: five bodies and one mouth.
//
// A body says how strong each harmonic of a key is, once for a soft touch
// and once for a hard one, what rings beside the harmonics when it is struck
// (three modes of its own), how it speaks (chiff) and how it goes on. The
// mouth is three formants that Vowel takes from a hum through Oo, Ah and Eh
// to Ee; every body goes through it, some only partly.

#include "../../kit/kit.h"

namespace livemix {
namespace unsung {

enum BodyKind : int { kThroat = 0, kReed, kGlass, kBowed, kHollow, kNumBodies };

struct BodyTraits {
  float mouth;         // how much of the mouth it has
  float attack;        // on the Attack knob
  float attack_add;    // seconds, whatever the knob
  float release;       // on the Release knob
  float settle;        // what a held key settles to
  float settle_s;      // over this
  float section;       // how much of the two other singers it has
  float apart;         // how far off they are, on Closeness
  float air;           // how Breath sounds in it
  float wind;          // the noise it always has
  float chiff;         // the noise it speaks with
  float chiff_ratio;   // of the note
  float chiff_q;
  float chiff_s;
  float gain;          // evens out the five
  float line;          // the same for the line over it
  float rich;          // how much the line has over its own pitch
  float sub;           // an octave under, as long as the key sounds
  float strike;        // the three modes of the strike
  float mode_ratio[3];
  float mode_level[3];
  float mode_s[3];     // to -60 dB
};

inline const BodyTraits& traits(int body) {
  static const BodyTraits kTraits[kNumBodies] = {
      // Throat: opens slowly, all mouth.
      {1.0f, 1.2f, 0.012f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 0.0f, 0.04f, 3.0f, 1.0f, 0.09f, 0.88f, 1.0f, 1.0f, 0.0f, 0.0f,
       {2.0f, 3.0f, 4.0f}, {0.0f, 0.0f, 0.0f}, {0.1f, 0.1f, 0.1f}},
      // Reed: a tongue over a slot; quick to speak and quick to stop.
      {0.8f, 0.3f, 0.015f, 0.28f, 1.0f, 1.0f, 0.6f, 0.6f, 0.4f, 0.015f, 0.16f, 7.0f, 1.2f, 0.05f, 1.0f, 1.12f, 1.35f, 0.0f, 0.0f,
       {2.0f, 3.0f, 4.0f}, {0.0f, 0.0f, 0.0f}, {0.1f, 0.1f, 0.1f}},
      // Glass: struck at once, rings down to a rubbed rim and on after the key.
      {0.7f, 0.15f, 0.0f, 2.2f, 0.16f, 1.1f, 0.45f, 0.5f, 0.45f, 0.0f, 0.10f, 9.0f, 1.4f, 0.02f, 1.48f, 1.12f, 0.45f, 0.0f, 1.0f,
       {2.756f, 5.404f, 8.933f}, {0.42f, 0.30f, 0.18f}, {1.5f, 0.85f, 0.5f}},
      // Bowed: gut that takes its time, with hair on it.
      {0.6f, 3.6f, 0.3f, 1.6f, 1.0f, 1.0f, 1.25f, 1.1f, 0.8f, 0.25f, 0.34f, 5.0f, 0.8f, 0.22f, 1.0f, 1.2f, 1.6f, 0.0f, 0.0f,
       {2.0f, 3.0f, 4.0f}, {0.0f, 0.0f, 0.0f}, {0.1f, 0.1f, 0.1f}},
      // Hollow: stopped pipes, wood and wind, odd harmonics and an octave under.
      {0.45f, 0.6f, 0.02f, 0.38f, 0.66f, 0.4f, 0.0f, 0.3f, 1.3f, 0.1f, 0.55f, 3.0f, 3.0f, 0.10f, 1.12f, 1.0f, 1.0f, 0.54f, 0.5f,
       {3.01f, 5.03f, 2.02f}, {0.30f, 0.16f, 0.10f}, {0.16f, 0.12f, 0.10f}},
  };
  return kTraits[kit::clamp_int(body, 0, kNumBodies - 1)];
}

struct Mouth {
  float f1 = 320.0f, f2 = 800.0f, f3 = 2300.0f;
  float g2 = 0.3f, g3 = 0.1f;

  void set(float vowel, float f0) {
    static const float kF1[5] = {250.0f, 330.0f, 700.0f, 530.0f, 290.0f};
    static const float kF2[5] = {900.0f, 780.0f, 1150.0f, 1840.0f, 2250.0f};
    static const float kF3[5] = {2100.0f, 2300.0f, 2650.0f, 2550.0f, 3050.0f};
    static const float kG2[5] = {0.14f, 0.62f, 1.40f, 1.30f, 1.05f};
    static const float kG3[5] = {0.02f, 0.10f, 0.50f, 0.90f, 1.20f};
    const float at = kit::clamp(vowel, 0.0f, 1.0f) * 4.0f;
    const int i = at >= 3.999f ? 3 : static_cast<int>(at);
    const float t = at - static_cast<float>(i);
    f1 = kit::lerp(kF1[i], kF1[i + 1], t);
    f2 = kit::lerp(kF2[i], kF2[i + 1], t);
    f3 = kit::lerp(kF3[i], kF3[i + 1], t);
    g2 = kit::lerp(kG2[i], kG2[i + 1], t);
    g3 = kit::lerp(kG3[i], kG3[i + 1], t);
    // A singer tunes the mouth to a note above it.
    if (f1 < f0 * 1.05f) f1 = f0 * 1.05f;
    if (f2 < f1 * 1.35f) f2 = f1 * 1.35f;
    if (f3 < f2 * 1.25f) f3 = f2 * 1.25f;
  }

  float gain(float hz) const {
    return low(hz, f1, 3.2f) + g2 * band(hz, f2, 4.5f) + g3 * band(hz, f3, 6.0f);
  }

  static float low(float hz, float f, float q) {
    const float r = hz / f, d = 1.0f - r * r, e = r / q;
    return 1.0f / std::sqrt(d * d + e * e);
  }
  static float band(float hz, float f, float q) {
    const float r = hz / f, d = (1.0f - r * r) * q;
    return r / std::sqrt(d * d + r * r);
  }
};

// A hill of unit height in the spectrum, `q` narrow.
inline float hill(float hz, float f, float q) { return Mouth::band(hz, f, q); }
inline float roll(float hz, float corner) {
  const float r = hz / corner;
  return 1.0f / std::sqrt(1.0f + r * r);
}

// Harmonic k of a key at f0, before the mouth: soft touch and hard touch.
inline void source(int body, int k, float f0, float* soft, float* hard) {
  const float n = static_cast<float>(k), hz = n * f0;
  switch (body) {
    case kThroat: {
      const float a = 1.0f / n;
      const float r = roll(hz, 520.0f);
      *soft = a * r * r;
      *hard = a * std::sqrt(n) * roll(hz, 5200.0f);
      return;
    }
    case kReed: {
      // A narrow pulse through a small box, lean at the bottom.
      const float a = (0.3f + 0.7f * std::fabs(std::sin(kit::kPi * n * 0.19f))) / std::sqrt(std::sqrt(n));
      const float lean = hz / (hz + 330.0f);
      const float box = 0.3f + 1.0f * hill(hz, 1100.0f, 1.5f) + 0.7f * hill(hz, 2600.0f, 2.0f);
      const float r = roll(hz, 1250.0f), h = roll(hz, 5200.0f);
      *soft = a * lean * box * r * r;
      *hard = a * lean * box * h * h * std::sqrt(std::sqrt(n));
      return;
    }
    case kGlass: {
      static const float kRim[12] = {1.0f, 0.10f, 0.26f, 0.035f, 0.11f, 0.02f, 0.05f, 0.03f, 0.016f, 0.02f, 0.006f, 0.012f};
      const float a = k <= 12 ? kRim[k - 1] : 0.0f;
      *soft = a * roll(hz, 1500.0f) * (k > 1 ? 0.6f : 1.0f);
      *hard = a * roll(hz, 6000.0f) * (k > 1 ? 2.8f : 1.0f);
      return;
    }
    case kBowed: {
      const float a = (0.25f + std::fabs(std::sin(kit::kPi * n * 0.127f))) / n;
      const float wood = 0.55f + 0.9f * hill(hz, 280.0f, 4.0f) + 0.8f * hill(hz, 470.0f, 5.0f) +
                         0.5f * hill(hz, 760.0f, 5.0f) + 2.7f * hill(hz, 2350.0f, 1.8f);
      const float r = roll(hz, 950.0f), h = roll(hz, 4400.0f);
      *soft = a * wood * r * r;
      *hard = a * wood * h * h * std::sqrt(n);
      return;
    }
    default: {
      const float a = (k % 2 == 1 ? 1.0f : 0.05f) / (n * std::sqrt(std::sqrt(n)));
      const float r = roll(hz, 300.0f), h = roll(hz, 3600.0f);
      *soft = a * r * r;
      *hard = a * h * h;
      return;
    }
  }
}

}  // namespace unsung
}  // namespace livemix
