#pragma once

// The walls of Walking Voices: what stands at the back comes round once more
// from both sides, softened. Taps and no feedback, so it ends by itself.

#include "../../kit/kit.h"

namespace livemix {
namespace walking_dsp {

class Walls {
 public:
  void init(float sample_rate) {
    for (int t = 0; t < kTaps; ++t) {
      left_[t] = kit::clamp_int(static_cast<int>(kLeftSeconds[t] * sample_rate), 1, kSize - 4);
      right_[t] = kit::clamp_int(static_cast<int>(kRightSeconds[t] * sample_rate), 1, kSize - 4);
    }
    soft_.set_cutoff(3200.0f, sample_rate);
    dc_.set_cutoff(18.0f, sample_rate);
    clear();
  }

  void clear() {
    line_.clear();
    soft_.reset();
    dc_.reset();
  }

  void process(float x, float* left, float* right) {
    float from_left = 0.0f, from_right = 0.0f;
    for (int t = 0; t < kTaps; ++t) {
      from_left += kGain[t] * line_.read(left_[t]);
      from_right += kGain[t] * line_.read(right_[t]);
    }
    line_.write(soft_.lowpass(dc_.process(x)));
    *left = from_left;
    *right = from_right;
  }

 private:
  static constexpr int kSize = 16384;
  static constexpr int kTaps = 5;
  static constexpr float kLeftSeconds[kTaps] = {0.0131f, 0.0227f, 0.0379f, 0.0533f, 0.0719f};
  static constexpr float kRightSeconds[kTaps] = {0.0163f, 0.0199f, 0.0341f, 0.0587f, 0.0677f};
  static constexpr float kGain[kTaps] = {0.62f, -0.55f, 0.47f, 0.38f, -0.31f};

  kit::DelayLine<kSize> line_;
  kit::OnePole soft_;
  kit::DcBlocker dc_;
  int left_[kTaps] = {}, right_[kTaps] = {};
};

}  // namespace walking_dsp
}  // namespace livemix
