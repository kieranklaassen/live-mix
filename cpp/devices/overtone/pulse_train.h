#pragma once

// Band-limited impulse trains in closed form, read from a phase.
//
// A train of unit impulses, one per cycle, kept to its first n harmonics is
//
//   1 + 2 cos x + 2 cos 2x + ... + 2 cos nx = sin((2n + 1) x / 2) / sin(x / 2)
//
// and the same train with every other impulse turned over, which has only
// the odd harmonics (the first m of them), is
//
//   2 cos x + 2 cos 3x + ... + 2 cos (2m - 1)x = sin(2m x) / sin(x).
//
// Every harmonic has amplitude 2 whatever n is, and there is nothing above
// the last one, so nothing folds back. The functions below take the phase
// in cycles (x = 2π · phase), as a double so that a long note stays exact,
// and fold it onto the stretch next to the impulse first: there the small
// sine underneath is taken where a float is most accurate.
//
// The sines are a polynomial, not the kit's table: these run twice or four
// times per sample and voice, and the table read (which wraps any phase
// with a floor) cost a tenth of the whole instrument more.

#include <cmath>

#include "../../kit/math.h"

namespace livemix {
namespace overtone_dsp {

// Under this the sine underneath counts as zero and the train is at its peak.
constexpr float kEdge = 1.0e-7f;

// sin(x) for x in [-π/2, π/2]: an odd polynomial of degree 9 fitted over the
// quarter cycle, within 2e-7 of the sine in float (the table is within 3e-7)
// and exactly x where x is small.
inline float sin_quarter(float x) {
  const float u = x * x;
  return x * (1.0f + u * (-0.16666657f + u * (8.3330173e-3f + u * (-1.9806615e-4f + u * 2.6000548e-6f))));
}

// sin(2π · t) for t in [0, 1.25] cycles.
inline float sin_cycles(float t) {
  if (t > 0.75f) t -= 1.0f;     // now in [-1/4, 3/4]
  if (t > 0.25f) t = 0.5f - t;  // the second and third quarters mirror the first and fourth
  return sin_quarter(6.28318530717958647692f * t);
}

// cos(2π · t) for t in [0, 1].
inline float cos_cycles(float t) { return sin_cycles(t + 0.25f); }

// Harmonics 1 to n, amplitude 2 each, no DC. `phase` in [0, 1).
inline float all_harmonics(double phase, int n) {
  // Even about the impulse: use the distance to the nearest one.
  const double near = phase > 0.5 ? 1.0 - phase : phase;
  const float below = sin_quarter(3.14159265358979323846f * static_cast<float>(near));  // near is at most 1/2
  if (below < kEdge) return static_cast<float>(2 * n);
  double turn = (static_cast<double>(n) + 0.5) * near;
  turn -= std::floor(turn);
  return sin_cycles(static_cast<float>(turn)) / below - 1.0f;
}

// The first m odd harmonics, amplitude 2 each. `phase` in [0, 1).
inline float odd_harmonics(double phase, int m) {
  // Even about the impulse at 0 and odd about the quarter cycle: fold onto
  // [0, 1/4], where the only impulse is the one at 0.
  double near = phase > 0.5 ? 1.0 - phase : phase;
  float sign = 1.0f;
  if (near > 0.25) {
    near = 0.5 - near;
    sign = -1.0f;
  }
  const float below = sin_quarter(6.28318530717958647692f * static_cast<float>(near));  // near is at most 1/4
  if (below < kEdge) return sign * static_cast<float>(2 * m);
  double turn = static_cast<double>(2 * m) * near;
  turn -= std::floor(turn);
  return sign * sin_cycles(static_cast<float>(turn)) / below;
}

}  // namespace overtone_dsp
}  // namespace livemix
