#pragma once

// The compander around a bucket-brigade line, after the gain-cell-and-
// rectifier chips those circuits use: a 2:1 compressor in front (the gain is
// divided by the averaged level of its own output) and a 1:2 expander behind
// (the gain is multiplied by the averaged level of its input). For a steady
// signal the pair is unity at every level. What it does to the sound comes
// from the rectifiers being slow: a transient reaches the line before the
// compressor has turned down and reaches the expander before it has opened,
// so attacks are rounded, and the line's hiss is turned down with the signal
// so the noise floor breathes.

#include "../../kit/math.h"

namespace livemix {
namespace analog_delay {

// Full-wave rectifier and average: two equal one-poles in series, which
// leave much less ripple on a bass note than one pole of the same speed.
struct Rectifier {
  float a = 0.0f;
  float s1 = 0.0f;
  float s2 = 0.0f;

  // `seconds` is the time constant of the pair taken together.
  void set_time(float seconds, float sample_rate) {
    a = kit::time_to_coeff(seconds * 0.5f, sample_rate);
  }
  void reset() {
    s1 = 0.0f;
    s2 = 0.0f;
  }
  float process(float x) {
    const float magnitude = x < 0.0f ? -x : x;
    s1 = flush_denormal(magnitude + (s1 - magnitude) * a);
    s2 = flush_denormal(s1 + (s2 - s1) * a);
    return s2;
  }
  float level() const { return s2; }
};

// The level at which the pair's gains are both 1 (the mean of the rectified
// signal, so a sine of amplitude kUnity / 0.637).
constexpr float kUnity = 0.16f;
// The compressor's gain stops rising 40 dB above unity, as the chip's does
// when its rectifier current runs out.
constexpr float kFloor = kUnity * 0.01f;
// The compressor's output stage clips here, well above the line's headroom.
constexpr float kRail = 2.0f;

struct Compressor {
  Rectifier rectifier;

  void reset() { rectifier.reset(); }
  float process(float x) {
    const float level = rectifier.level();
    float y = x * kUnity / (level > kFloor ? level : kFloor);
    y = kit::clamp(y, -kRail, kRail);
    rectifier.process(y);
    return y;
  }
};

struct Expander {
  Rectifier rectifier;

  void reset() { rectifier.reset(); }
  float process(float x) {
    const float level = rectifier.process(x);
    return x * level * (1.0f / kUnity);
  }
};

}  // namespace analog_delay
}  // namespace livemix
