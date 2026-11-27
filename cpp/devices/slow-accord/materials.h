#pragma once

// What a key of Slow Accord is made of before it agrees with anything: the
// ratios of the metal's overtones to its note, how loud each is struck, how
// long it rings, how it beats and what its knock is like. And the four lane
// arithmetic the partials are turned with.

#include "../../kit/kit.h"

namespace livemix {
namespace slow_accord {

constexpr int kPartials = 20;  // the note and nineteen overtones
constexpr int kLanes = 4;

enum Material : int { kBar = 0, kPlate, kBell, kStretched, kSqueezed, kScattered, kNumMaterials };

struct Overtone {
  float ratio, level;
};

struct Body {
  // In the order they are taken as Overtones goes up.
  Overtone overtones[kPartials - 1];
  float slope;   // how levels fall with the ratio, a power
  float ring;    // the note's ring, of Ring
  float keep;    // how much sooner high overtones die, a power
  float beat;    // the beat of the metal, hertz
  float depth;   // and how deep it goes
  float knock;   // how much of the mallet is heard
  float knock_hz;
  float wash;    // seconds of it
  float note;    // the note itself, of a full strike
  float colour;  // how its overtones rest, a power of the ratio
  float width;   // of Spread
  float bloom;   // seconds over which its overtones come in
  float reach;   // octaves over the note that a chord's tones are taken from
  float struck, held;  // how loud its strike is, and how loud it rests
  float root;    // of that, the note's own share
};

inline const Body& body(int material) {
  static const Body kBodies[kNumMaterials] = {
      // Bar: few and far apart, soon down to the note.
      {{{2.756f, 1.0f}, {5.404f, 0.8f}, {8.933f, 0.55f}, {3.64f, 0.3f}, {13.34f, 0.4f}, {1.73f, 0.22f}, {7.12f, 0.3f},
        {4.55f, 0.25f}, {10.9f, 0.25f}, {2.09f, 0.18f}, {6.31f, 0.2f}, {12.1f, 0.2f}, {3.13f, 0.2f}, {9.71f, 0.2f},
        {14.7f, 0.2f}, {5.93f, 0.2f}, {1.46f, 0.15f}, {11.6f, 0.2f}, {8.13f, 0.2f}},
       -0.5f, 0.35f, 0.9f, 0.22f, 0.10f, 1.4f, 620.0f, 0.045f, 1.0f, -1.4f, 0.45f, 0.0f, 1.7f, 1.5f, 0.5f, 2.1f},
      // Plate: a bright crowd of nearly equal overtones that all ring.
      {{{2.46f, 0.8f}, {4.11f, 1.0f}, {5.17f, 0.9f}, {6.38f, 1.0f}, {1.53f, 0.6f}, {8.71f, 1.0f}, {3.37f, 0.8f},
        {10.4f, 1.0f}, {7.41f, 0.9f}, {12.2f, 1.0f}, {5.83f, 0.8f}, {1.94f, 0.6f}, {9.23f, 0.9f}, {13.3f, 1.0f},
        {3.02f, 0.7f}, {14.9f, 1.0f}, {11.3f, 0.9f}, {7.93f, 0.8f}, {16.4f, 0.9f}},
       0.15f, 1.6f, 0.2f, 1.3f, 0.45f, 0.7f, 2100.0f, 0.45f, 0.2f, -0.6f, 1.1f, 0.7f, 2.0f, 1.65f, 0.6f, 0.35f},
      // Bell: a hum under the note, a narrow third, a strong octave.
      {{{2.03f, 1.0f}, {1.19f, 0.85f}, {0.5f, 0.5f}, {2.66f, 0.55f}, {1.52f, 0.5f}, {4.16f, 0.6f}, {3.04f, 0.5f},
        {5.43f, 0.5f}, {6.79f, 0.4f}, {2.45f, 0.35f}, {8.21f, 0.35f}, {3.62f, 0.3f}, {9.7f, 0.3f}, {4.7f, 0.3f},
        {1.83f, 0.25f}, {11.2f, 0.25f}, {7.4f, 0.25f}, {12.9f, 0.22f}, {6.1f, 0.25f}},
       0.0f, 1.0f, 0.55f, 0.55f, 0.35f, 0.6f, 1250.0f, 0.06f, 0.75f, -0.05f, 0.95f, 0.0f, 2.8f, 1.3f, 0.82f, 1.1f},
      // Stretched: a series pulled too wide, like stiff wire.
      {{{2.30f, 1.0f}, {3.74f, 0.9f}, {5.28f, 0.8f}, {6.90f, 0.75f}, {8.59f, 0.7f}, {10.33f, 0.65f}, {12.13f, 0.6f},
        {13.97f, 0.55f}, {15.85f, 0.5f}, {17.77f, 0.45f}, {19.73f, 0.4f}, {3.0f, 0.5f}, {4.5f, 0.5f}, {6.08f, 0.5f},
        {7.74f, 0.45f}, {9.45f, 0.45f}, {1.62f, 0.35f}, {11.2f, 0.4f}, {13.0f, 0.4f}},
       0.1f, 0.42f, 0.60f, 2.1f, 0.25f, 0.6f, 2800.0f, 0.025f, 0.8f, 0.75f, 0.4f, 0.0f, 3.6f, 1.1f, 0.85f, 1.0f},
      // Squeezed: everything crowded round the note, over it and under.
      {{{1.47f, 1.0f}, {0.71f, 0.65f}, {1.83f, 1.0f}, {1.21f, 0.8f}, {2.14f, 1.0f}, {0.84f, 0.4f}, {2.43f, 0.95f},
        {1.66f, 0.8f}, {2.68f, 0.95f}, {0.59f, 0.4f}, {1.99f, 0.8f}, {2.92f, 0.9f}, {1.34f, 0.6f}, {2.29f, 0.8f},
        {3.14f, 0.9f}, {2.56f, 0.75f}, {3.35f, 0.85f}, {2.80f, 0.7f}, {3.55f, 0.8f}},
       -0.3f, 1.1f, 0.40f, 3.6f, 0.75f, 0.8f, 480.0f, 0.12f, 0.2f, -2.2f, 0.22f, 3.0f, 1.0f, 0.16f, 1.0f, 0.2f},
      // Scattered: places drawn for each key (see scatter); the levels here.
      {{{1.0f, 0.9f}, {1.0f, 1.0f}, {1.0f, 0.7f}, {1.0f, 0.9f}, {1.0f, 0.6f}, {1.0f, 1.0f}, {1.0f, 0.8f},
        {1.0f, 0.7f}, {1.0f, 0.9f}, {1.0f, 0.6f}, {1.0f, 0.8f}, {1.0f, 0.7f}, {1.0f, 0.8f}, {1.0f, 0.6f},
        {1.0f, 0.8f}, {1.0f, 0.7f}, {1.0f, 0.7f}, {1.0f, 0.6f}, {1.0f, 0.7f}},
       0.25f, 1.5f, 0.2f, 0.12f, 0.8f, 0.12f, 3400.0f, 0.25f, 0.12f, 0.45f, 1.5f, 5.0f, 4.3f, 0.12f, 1.2f, 0.15f},
  };
  return kBodies[kit::clamp_int(material, 0, kNumMaterials - 1)];
}

// The place of overtone k of `count` of a scattered key: one in each share of
// the range from a twelfth to four octaves, anywhere in it.
inline float scatter(int k, int count, kit::Rng& rng) {
  const float share = (static_cast<float>(k) + 0.1f + 0.8f * rng.uniform()) / static_cast<float>(count);
  return std::exp2(1.5f + 2.5f * share);
}

// --- four at a time ---------------------------------------------------------

typedef float Four __attribute__((vector_size(16)));

inline Four load(const float* from) { return Four{from[0], from[1], from[2], from[3]}; }
inline void store(const Four& value, float* to) {
  for (int l = 0; l < kLanes; ++l) to[l] = value[l];
}

// sin(2 pi x) for x in [-0.5, 0.5], to a few parts in ten million.
inline float turn_sine(float x) {
  x = x > 0.25f ? 0.5f - x : (x < -0.25f ? -0.5f - x : x);
  const float y = x * kit::kTwoPi, z = y * y;
  return y * (1.0f + z * (-0.16666667f + z * (8.3333333e-3f + z * (-1.9841270e-4f + z * (2.7557319e-6f - z * 2.5052108e-8f)))));
}
// The cosine and the sine of a place in the cycle, 0 to 1.
inline void turn(float phase, float* c, float* s) {
  const float x = phase > 0.5f ? phase - 1.0f : phase;
  const float q = x + 0.25f;
  *s = turn_sine(x);
  *c = turn_sine(q > 0.5f ? q - 1.0f : q);
}

}  // namespace slow_accord
}  // namespace livemix
