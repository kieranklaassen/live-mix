#pragma once

// Ember's LFO: a port of Tatami/Source/Shared/DSP/Lfo.h. Free-running (never
// reset by notes), bipolar output in [-1, 1], five shapes; sample-and-hold
// draws from a small xorshift on every wrap.
//
// Differences from the source: the tempo-synced rate is gone (the device ABI
// has no tempo), and `skip` was added: one sample of phase without a value,
// for when nothing reads the LFO. It leaves the phase and the sample-and-hold
// sequence exactly where `next` would have.

#include <cmath>
#include <cstdint>

namespace livemix {
namespace ember {

class Lfo {
 public:
  enum class Shape { sine = 0, triangle, saw, square, sample_hold };

  static constexpr int kNumShapes = 5;

  void set_sample_rate(double rate) { sample_rate_ = rate; }
  void set_rate_hz(float hz) { increment_ = static_cast<float>(hz / sample_rate_); }
  void set_shape(Shape shape) { shape_ = shape; }

  void reset() {
    phase_ = 0.0f;
    held_ = 0.0f;
    seed_ = 0x9E3779B9u;
  }

  float next() {
    skip();
    switch (shape_) {
      case Shape::sine:
        return std::sin(phase_ * 6.283185307179586f);
      case Shape::triangle:
        return phase_ < 0.5f ? 4.0f * phase_ - 1.0f : 3.0f - 4.0f * phase_;
      case Shape::saw:
        return 1.0f - 2.0f * phase_;
      case Shape::square:
        return phase_ < 0.5f ? 1.0f : -1.0f;
      case Shape::sample_hold:
        return held_;
    }
    return 0.0f;
  }

  // One sample of phase, no output.
  void skip() {
    phase_ += increment_;
    if (phase_ >= 1.0f) {
      phase_ -= 1.0f;
      held_ = next_random();
    }
  }

  float phase() const { return phase_; }

 private:
  float next_random() {
    seed_ ^= seed_ << 13;
    seed_ ^= seed_ >> 17;
    seed_ ^= seed_ << 5;
    return static_cast<float>(seed_ & 0xFFFFFFu) / 8388607.5f - 1.0f;
  }

  double sample_rate_ = 44100.0;
  float increment_ = 0.0f;
  float phase_ = 0.0f;
  float held_ = 0.0f;
  uint32_t seed_ = 0x9E3779B9u;
  Shape shape_ = Shape::sine;
};

}  // namespace ember
}  // namespace livemix
