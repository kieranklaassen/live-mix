#pragma once

// The saturator of Patina (patina.h): one curve family that covers the six
// media, and the stage that runs it between an emphasis and its inverse.
//
// - A curve has a side for each polarity, and each side is soft or hard with
//   its own ceiling c. Soft is u / sqrt(1 + (u/c)²), the tape curve: it
//   bends from the start and takes a long time to reach c. Hard is a cubic,
//   u - (4/27)·u³/c², that is flat at c from 1.5·c on: a knee, then a clip.
//   Both have a slope of 1 at zero, so the two sides join smoothly, and a
//   curve with unlike sides makes even harmonics.
// - The curve is averaged over each step by its antiderivative (first-order
//   antiderivative anti-aliasing), which with the 2x oversampling around it
//   keeps the fold-back of a hard drive well under a bare shaper's. The
//   difference of two antiderivatives is taken in double precision: at +30 dB
//   of drive it is a small difference of large numbers.
// - In the linear part that averaging is a two-point mean, which costs
//   1.6 dB at 18 kHz; one pole lifts it back to within 0.3 dB (as in Tape).
// - The emphasis is e = a·x + b·lowpass(x): a high boost with (1 + k, -k),
//   a low boost with (1, k), nothing with (1, 0). The stage solves it for
//   its input after the curve, so a quiet signal passes flat and a loud one
//   loses first whatever was boosted: the treble on tape, the bass in a
//   transformer.

#include <cmath>

#include "../../kit/kit.h"

namespace livemix {
namespace patina_parts {

struct Curve {
  bool hard_up = false;
  bool hard_down = false;
  float ceiling_up = 1.0f;
  float ceiling_down = 1.0f;

  float value(float u) const {
    const bool hard = u >= 0.0f ? hard_up : hard_down;
    const float c = u >= 0.0f ? ceiling_up : ceiling_down;
    const float v = u / c;
    if (!hard) return u / std::sqrt(1.0f + v * v);
    if (v > 1.5f) return c;
    if (v < -1.5f) return -c;
    return u * (1.0f - (4.0f / 27.0f) * v * v);
  }

  // The antiderivative, zero at zero.
  double primitive(float u) const {
    const bool hard = u >= 0.0f ? hard_up : hard_down;
    const double c = u >= 0.0f ? ceiling_up : ceiling_down;
    const double v = static_cast<double>(u) / c;
    if (!hard) return c * c * (std::sqrt(1.0 + v * v) - 1.0);
    const double magnitude = v < 0.0 ? -v : v;
    if (magnitude > 1.5) return c * c * (magnitude - 0.5625);
    const double v2 = v * v;
    return c * c * v2 * (0.5 - v2 * (1.0 / 27.0));
  }
};

// What both channels share: the curve, where it is worked, and the emphasis.
struct SaturatorSettings {
  Curve curve;
  float bias = 0.0f;      // added before the curve
  float bias_out = 0.0f;  // the curve at the bias, taken back out
  float alpha = 0.1f;     // the emphasis low-pass, per 2x sample
  float a = 1.0f;
  float b = 0.0f;
  float held = 0.0f;     // b·(1 - alpha)
  float inverse = 1.0f;  // 1 / (a + b·alpha)

  void set_emphasis(float direct, float low) {
    a = direct;
    b = low;
    held = b * (1.0f - alpha);
    inverse = 1.0f / (a + b * alpha);
  }
};

class Saturator {
 public:
  // The one pole that undoes most of the averaging's treble loss, and the
  // delay (in 2x samples) the pair leaves behind: 0.5 - a / (1 + a).
  static constexpr float kTilt = 0.45f;
  static constexpr float kAveragingDelay = 0.5f - kTilt / (1.0f + kTilt);

  // At rest on the bias, not at zero.
  void reset(const SaturatorSettings& s) {
    boost_low_ = 0.0f;
    cut_low_ = 0.0f;
    tilt_ = 0.0f;
    last_e_ = s.bias;
    last_primitive_ = s.curve.primitive(s.bias);
  }

  // One 2x sample, already multiplied by the drive.
  float process(float x, const SaturatorSettings& s) {
    boost_low_ = flush_denormal(boost_low_ + s.alpha * (x - boost_low_));
    const float e = s.a * x + s.b * boost_low_ + s.bias;
    const double primitive = s.curve.primitive(e);
    const float step = e - last_e_;
    // Too small a step to divide by: the curve at the midpoint is the mean.
    const float mean = (step > kSmallStep || step < -kSmallStep)
                           ? static_cast<float>((primitive - last_primitive_) / step)
                           : s.curve.value(0.5f * (e + last_e_));
    last_e_ = e;
    last_primitive_ = primitive;
    tilt_ = flush_denormal((1.0f + kTilt) * (mean - s.bias_out) - kTilt * tilt_);
    // De-emphasis: solve the emphasis for its input.
    const float flat = (tilt_ - s.held * cut_low_) * s.inverse;
    cut_low_ = flush_denormal(cut_low_ + s.alpha * (flat - cut_low_));
    return flat;
  }

 private:
  static constexpr float kSmallStep = 1.0e-4f;

  float boost_low_ = 0.0f;
  float cut_low_ = 0.0f;
  float tilt_ = 0.0f;
  float last_e_ = 0.0f;
  double last_primitive_ = 0.0;
};

}  // namespace patina_parts
}  // namespace livemix
