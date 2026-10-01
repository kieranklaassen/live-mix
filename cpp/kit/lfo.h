#pragma once

#include "math.h"

namespace livemix {
namespace kit {

// Free-running LFO, bipolar. `Smooth` is a random value per cycle joined by
// cosine segments; `Hold` steps.
class Lfo {
 public:
  enum Shape : int { kSine = 0, kTriangle, kSawDown, kSquare, kHold, kSmooth, kNumShapes };

  void seed(uint32_t value) {
    rng_.seed(value);
    previous_ = rng_.bipolar();
    next_ = rng_.bipolar();
  }
  void reset(float phase = 0.0f) { phase_ = phase - std::floor(phase); }
  void set_rate(float hz, float sample_rate) { increment_ = hz / sample_rate; }
  float phase() const { return phase_; }

  float next(int shape) {
    const float value = value_at(shape);
    phase_ += increment_;
    if (phase_ >= 1.0f) {
      phase_ -= 1.0f;
      previous_ = next_;
      next_ = rng_.bipolar();
    }
    return value;
  }

  // Advance by a whole block at once (control-rate use).
  float next_block(int shape, int frames) {
    const float value = value_at(shape);
    phase_ += increment_ * static_cast<float>(frames);
    while (phase_ >= 1.0f) {
      phase_ -= 1.0f;
      previous_ = next_;
      next_ = rng_.bipolar();
    }
    return value;
  }

 private:
  float value_at(int shape) const {
    switch (shape) {
      case kTriangle:
        return phase_ < 0.5f ? 4.0f * phase_ - 1.0f : 3.0f - 4.0f * phase_;
      case kSawDown:
        return 1.0f - 2.0f * phase_;
      case kSquare:
        return phase_ < 0.5f ? 1.0f : -1.0f;
      case kHold:
        return previous_;
      case kSmooth: {
        const float t = 0.5f - 0.5f * SineTable::cos_lookup(phase_ * 0.5f);
        return previous_ + (next_ - previous_) * t;
      }
      case kSine:
      default:
        return SineTable::lookup(phase_);
    }
  }

  Rng rng_;
  float phase_ = 0.0f;
  float increment_ = 0.0f;
  float previous_ = 0.0f;
  float next_ = 0.0f;
};

// Slow organic drift: three sines at incommensurate rates around `hz`, summed
// to roughly ±1. What keeps a held drone from sounding static; cheaper and
// smoother than filtered noise, and it never settles into an audible cycle.
class Drift {
 public:
  void seed(uint32_t value) {
    Rng rng;
    rng.seed(value);
    for (float& phase : phase_) phase = rng.uniform();
  }
  void set_rate(float hz, float sample_rate) {
    increment_[0] = hz / sample_rate;
    increment_[1] = hz * 0.6180340f / sample_rate;
    increment_[2] = hz * 1.7320508f / sample_rate;
  }
  // One value per call; advance by `frames` samples.
  float next(int frames = 1) {
    float sum = 0.0f;
    static constexpr float kWeights[3] = {0.5f, 0.3f, 0.2f};
    for (int i = 0; i < 3; ++i) {
      sum += kWeights[i] * SineTable::lookup(phase_[i]);
      phase_[i] += increment_[i] * static_cast<float>(frames);
      phase_[i] -= std::floor(phase_[i]);
    }
    return sum;
  }

 private:
  float phase_[3] = {0.0f, 0.33f, 0.71f};
  float increment_[3] = {0.0f, 0.0f, 0.0f};
};

}  // namespace kit
}  // namespace livemix
