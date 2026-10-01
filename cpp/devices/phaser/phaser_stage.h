#pragma once

// First-order allpass, ported from kkfonie
// Tatami/Source/Shared/DSP/PhaserStage.h:
//
//   y[n] = a x[n] + x[n-1] - a y[n-1],   a = (t - 1) / (t + 1),  t = tan(pi f / fs)
//
// Flat magnitude, -90 degrees at `f`. N stages on one frequency put the
// notches of the dry/wet sum where the phases add up to odd multiples of pi:
// N / 2 notches, at f * tan(pi (2k - 1) / (2N)) before frequency warping (for
// four stages 0.414 f and 2.414 f).
//
// Difference from the source: the coefficient comes from a rational
// approximation of the tangent instead of std::tan, because a 12-stage
// stereo phaser retunes 288,000 stages a second.

#include "../../kit/math.h"

namespace livemix {
namespace phaser {

// (tan(x) - 1) / (tan(x) + 1) for x = pi f / fs, f clamped to 10 Hz..0.45 fs
// as in the source. tan is the (5,4) Padé approximant n/d, within 1e-4 of the
// function up to 0.45 pi and far closer below; the quotient is taken once.
inline float allpass_coefficient(float hz, float sample_rate) {
  const float x = kit::kPi * kit::clamp(hz, 10.0f, sample_rate * 0.45f) / sample_rate;
  const float x2 = x * x;
  const float n = x * (945.0f + x2 * (x2 - 105.0f));
  const float d = 945.0f + x2 * (15.0f * x2 - 420.0f);
  return (n - d) / (n + d);
}

struct PhaserStage {
  float a = 0.0f;
  float x1 = 0.0f;
  float y1 = 0.0f;

  void reset() {
    x1 = 0.0f;
    y1 = 0.0f;
  }

  float process(float x) {
    const float y = flush_denormal(a * x + x1 - a * y1);
    x1 = x;
    y1 = y;
    return y;
  }
};

}  // namespace phaser
}  // namespace livemix
