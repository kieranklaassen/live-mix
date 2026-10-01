#pragma once

// The bank of sympathetic strings, ported from kkfonie's ResonatorBank: up
// to sixteen tuned combs fed the same excitation, spread across the stereo
// field in string order with constant-power pans and scaled by 1/√n.
//
// The source switched strings, pans and the 1/√n factor in steps; here each
// string has its own smoothed left and right gains, a string taken out of
// the bank fades and is then emptied, and one brought in starts empty.

#include "../../kit/math.h"
#include "../../kit/smooth.h"
#include "tuned_comb_filter.h"

namespace livemix {
namespace sympathetic {

class ResonatorBank {
 public:
  static constexpr int kMaxStrings = 16;
  static constexpr float kGainSeconds = 0.01f;

  void prepare(float sample_rate) {
    for (String& string : strings_) {
      string.comb.prepare(sample_rate);
      string.left.set_time(kGainSeconds, sample_rate);
      string.right.set_time(kGainSeconds, sample_rate);
      string.left.snap(0.0f);
      string.right.snap(0.0f);
    }
    count_ = 8;
    width_ = 0.5f;
  }

  int num_strings() const { return count_; }
  float string_frequency(int index) const { return strings_[index].comb.frequency(); }

  void set_num_strings(int count, bool glide) {
    count_ = kit::clamp_int(count, 1, kMaxStrings);
    update_gains(glide);
  }

  // 0 = every string in the centre, 1 = first string hard left, last hard right.
  void set_width(float width, bool glide) {
    width_ = kit::clamp(width, 0.0f, 1.0f);
    update_gains(glide);
  }

  void set_tuning(const float* frequencies, int count, bool glide) {
    for (int i = 0; i < count && i < kMaxStrings; ++i) {
      strings_[i].comb.set_frequency(frequencies[i], glide);
    }
  }

  void set_decay(float rt60_seconds) {
    for (String& string : strings_) string.comb.set_decay(rt60_seconds);
  }

  // 0..1; the loop filter's coefficient is 0.7 of it.
  void set_damping(float damping) {
    for (String& string : strings_) string.comb.set_damping(damping * 0.7f);
  }

  void process(float excitation, float* out_left, float* out_right) {
    float left = 0.0f;
    float right = 0.0f;
    for (int i = 0; i < kMaxStrings; ++i) {
      String& string = strings_[i];
      float input = excitation;
      if (i >= count_) {
        if (string.left.value == 0.0f && string.right.value == 0.0f) {
          if (!string.comb.silent()) string.comb.clear();
          continue;
        }
        input = 0.0f;  // on its way out
      }
      const float out = string.comb.process(input);
      if (!string.left.settled()) string.left.next();
      if (!string.right.settled()) string.right.next();
      left += out * string.left.value;
      right += out * string.right.value;
    }
    *out_left = left;
    *out_right = right;
  }

 private:
  struct String {
    TunedCombFilter comb;
    kit::Smoother left, right;
  };

  void update_gains(bool glide) {
    const float norm = 1.0f / std::sqrt(static_cast<float>(count_));
    for (int i = 0; i < kMaxStrings; ++i) {
      float left = 0.0f;
      float right = 0.0f;
      if (i < count_) {
        const float spread =
            count_ > 1 ? static_cast<float>(i) / static_cast<float>(count_ - 1) : 0.5f;
        const float angle = (0.5f + (spread - 0.5f) * width_) * kit::kHalfPi;
        left = std::cos(angle) * norm;
        right = std::sin(angle) * norm;
      }
      strings_[i].left.set(left, glide);
      strings_[i].right.set(right, glide);
    }
  }

  String strings_[kMaxStrings];
  int count_ = 8;
  float width_ = 0.5f;
};

}  // namespace sympathetic
}  // namespace livemix
