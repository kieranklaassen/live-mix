#pragma once

// Free-running modulation LFO, ported from kkfonie
// Tatami/Source/Shared/DSP/ModLfo.h. Six shapes, bipolar; `value(offset)`
// reads the same cycle a fraction ahead (the stereo offset). Nothing the
// audio does resets the phase.
//
// Differences from the source: the phase is a double (a float phase cannot
// hold 0.01 Hz at 96 kHz: the increment is under two float steps), the sine
// comes from the kit table, and `advance` takes a sample count so a sleeping
// device keeps its place in the cycle.

#include "../../kit/math.h"

namespace livemix {
namespace flanger {

class ModLfo {
 public:
  enum Shape : int { kSine = 0, kTriangle, kSawUp, kSawDown, kSquare, kRandom, kNumShapes };

  void reset() {
    phase_ = 0.0;
    seed_ = 0x9E3779B9u;
    held_ = 0.0f;
    next_ = 0.37f;
  }

  void set_rate(float hz, float sample_rate) {
    increment_ = static_cast<double>(hz > 0.0f ? hz : 0.0f) / static_cast<double>(sample_rate);
  }
  void set_shape(int shape) { shape_ = kit::clamp_int(shape, 0, kNumShapes - 1); }

  // 0..1.
  float phase() const { return static_cast<float>(phase_); }

  void advance(int frames = 1) {
    phase_ += increment_ * static_cast<double>(frames);
    while (phase_ >= 1.0) {
      phase_ -= 1.0;
      held_ = next_;
      next_ = random_bipolar();
    }
  }

  // The value `offset` cycles ahead of the current phase. Random holds one
  // value per cycle; an offset of half a cycle or more reads the next one.
  float value(float offset = 0.0f) const {
    if (shape_ == kRandom) return offset >= 0.5f ? next_ : held_;
    float phase = static_cast<float>(phase_) + offset;
    phase -= std::floor(phase);
    return value_at(shape_, phase);
  }

  static float value_at(int shape, float phase) {
    switch (shape) {
      case kSine:
        return kit::SineTable::lookup(phase);
      case kTriangle:
        return 1.0f - 4.0f * std::fabs(phase - 0.5f);
      case kSawUp:
        return 2.0f * phase - 1.0f;
      case kSawDown:
        return 1.0f - 2.0f * phase;
      case kSquare:
        return phase < 0.5f ? 1.0f : -1.0f;
      default:
        return 0.0f;
    }
  }

 private:
  float random_bipolar() {
    seed_ = seed_ * 1664525u + 1013904223u;
    return static_cast<float>(seed_ >> 8) / 8388608.0f - 1.0f;
  }

  double phase_ = 0.0;
  double increment_ = 0.0;
  int shape_ = kSine;
  uint32_t seed_ = 0x9E3779B9u;
  float held_ = 0.0f;
  float next_ = 0.37f;
};

}  // namespace flanger
}  // namespace livemix
