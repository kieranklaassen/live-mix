#pragma once

#include "delay.h"

namespace livemix {
namespace kit {

// Delay-line pitch shifter: two read heads half a window apart sweep through
// the last `window` samples at (1 - ratio) samples per sample and crossfade
// with raised-cosine gains that always sum to one. The H910 principle. It
// smears transients over the window, which is what a shimmer loop or a
// detune wants; a harmonizer on exposed material wants the pitch-synchronous
// shifter instead.
template <int Size>
class DelayPitchShifter {
 public:
  void clear() {
    line_.clear();
    phase_ = 0.0f;
  }

  // `window` in samples, at most Size - 8.
  void set_window(float window) { window_ = clamp(window, 64.0f, static_cast<float>(Size - 8)); }

  float process(float x, float ratio) {
    line_.write(x);
    phase_ += (1.0f - ratio) / window_;
    phase_ -= std::floor(phase_);
    const float second = phase_ >= 0.5f ? phase_ - 0.5f : phase_ + 0.5f;
    const float a = line_.read_hermite(2.0f + phase_ * window_);
    const float b = line_.read_hermite(2.0f + second * window_);
    const float gain_a = 0.5f - 0.5f * SineTable::cos_lookup(phase_);
    return a * gain_a + b * (1.0f - gain_a);
  }

 private:
  DelayLine<Size> line_;
  float phase_ = 0.0f;
  float window_ = 2048.0f;
};

}  // namespace kit
}  // namespace livemix
