#pragma once

// The oscillator of Dusk: sawtooth, pulse and sub-octave square read from ONE
// phase, the way a counter-reset ramp, a comparator on that ramp and a
// flip-flop on its reset do in the instruments it follows. kit::BlepOsc keeps
// a phase per call, so three calls would be three oscillators; here the three
// waves cannot drift or beat against each other by construction.
//
// Edges are band-limited with a four-point PolyBLEP: the residual of a step
// smoothed by a cubic B-spline, two samples either side of the edge. The
// kit's two-point residual leaves fold-back near -40 dB between 15 and 22 kHz
// for a sawtooth at C6; this one keeps it under -50 dB.

#include <cstdint>

#include "../../kit/math.h"

namespace livemix {
namespace dusk_detail {

// Residual of a unit rising step at t = 0, t in samples, zero outside (-2, 2).
inline float blep4(float t) {
  if (t < 0.0f) {
    if (t <= -2.0f) return 0.0f;
    if (t <= -1.0f) {
      const float u = 2.0f + t;
      const float u2 = u * u;
      return u2 * u2 * (1.0f / 24.0f);
    }
    const float t2 = t * t;
    return 0.5f + t * (2.0f / 3.0f) - t2 * t * (1.0f / 3.0f) - t2 * t2 * 0.125f;
  }
  if (t >= 2.0f) return 0.0f;
  if (t >= 1.0f) {
    const float u = 2.0f - t;
    const float u2 = u * u;
    return -u2 * u2 * (1.0f / 24.0f);
  }
  const float t2 = t * t;
  return -0.5f + t * (2.0f / 3.0f) - t2 * t * (1.0f / 3.0f) + t2 * t2 * 0.125f;
}

struct LockedOsc {
  // The phase is a 32-bit counter, as in the instruments this follows: the
  // pitch is exact to a hundred-thousandth of a hertz, it never drifts, and
  // two keys on one note stay in step for ever.
  uint32_t phase = 0;
  uint32_t step = 0;
  float samples_per_cycle = 1.0e7f;
  float sub_state = 1.0f;  // flips on every wrap: a square one octave down

  void reset(float start) {
    phase = static_cast<uint32_t>(static_cast<double>(start - std::floor(start)) * kCycle);
    sub_state = 1.0f;
  }

  // `increment` is frequency / sample rate.
  void set_frequency(float increment) {
    const double cycles = static_cast<double>(kit::clamp(increment, 1.0e-7f, 0.49f));
    step = static_cast<uint32_t>(cycles * kCycle + 0.5);
    samples_per_cycle = static_cast<float>(1.0 / cycles);
  }

  // One sample of all three waves, each in ±1. `width` is the share of the
  // cycle the pulse is high.
  void next(float width, float* saw, float* pulse, float* sub) {
    const uint32_t previous = phase;
    phase += step;
    if (phase < previous) sub_state = -sub_state;
    // The top 24 bits convert to a float exactly, and stay under 1.
    const float position = static_cast<float>(phase >> 8) * (1.0f / 16777216.0f);
    // The wrap, seen from just after it and from just before the next one.
    const float after = blep4(position * samples_per_cycle);
    const float before = blep4((position - 1.0f) * samples_per_cycle);
    const float wrap = after + before;

    *saw = 2.0f * position - 1.0f - 2.0f * wrap;

    width = kit::clamp(width, 0.05f, 0.95f);
    float edge = position - width;  // signed distance to the falling edge, in cycles
    if (edge > 0.5f) edge -= 1.0f;
    if (edge < -0.5f) edge += 1.0f;
    // The DC a pulse off 50 % carries is taken out.
    *pulse = (position < width ? 1.0f : -1.0f) + 2.0f * wrap -
             2.0f * blep4(edge * samples_per_cycle) - (2.0f * width - 1.0f);

    // After a wrap the sub has just stepped to its state; before one it is
    // about to step away from it.
    *sub = sub_state * (1.0f + 2.0f * after - 2.0f * before);
  }

 private:
  static constexpr double kCycle = 4294967296.0;
};

}  // namespace dusk_detail
}  // namespace livemix
