#pragma once

// The ensemble of Pad Follower: what turns one steady oscillator per partial
// into a section of players. Each side has its own delay line read by three
// taps, every tap swept by its own slow sine (a fifth to two thirds of a
// hertz, about nine cents of pitch bend each way) plus a small faster one
// (five to six and a half hertz, about three cents), the way the bucket
// brigade ensembles of string machines do it. The six taps differ in length
// and in rate, so left and right are decorrelated by the timing itself and
// never by a polarity flip; their sum stays mono-compatible.

#include "../../kit/delay.h"
#include "../../kit/math.h"

namespace livemix {
namespace pad_follower {

class SectionChorus {
 public:
  static constexpr int kTaps = 3;

  // `rate` is the rate process() is called at. Clears the lines.
  void prepare(float rate) {
    rate_ = rate;
    for (int side = 0; side < 2; ++side) {
      line_[side].clear();
      for (int tap = 0; tap < kTaps; ++tap) {
        slow_phase_[side][tap] = kStartPhase[side][tap];
        fast_phase_[side][tap] = kStartPhase[1 - side][kTaps - 1 - tap];
        slow_step_[side][tap] = kSlowHz[side][tap] / rate;
        fast_step_[side][tap] = kFastHz[side][tap] / rate;
        // Depth in seconds for the wanted pitch bend: bend = 2π · rate · depth.
        slow_depth_[side][tap] = kSlowBend / (kit::kTwoPi * kSlowHz[side][tap]);
        fast_depth_[side][tap] = kFastBend / (kit::kTwoPi * kFastHz[side][tap]);
      }
    }
  }

  // In place. `amount` 0 leaves the signal alone, 1 is the taps only; in
  // between the two cross by equal power, as the taps are decorrelated.
  void process(float* left, float* right, float amount) {
    float* channel[2] = {left, right};
    const float angle = kit::clamp(amount, 0.0f, 1.0f) * kit::kHalfPi * (1.0f / kit::kTwoPi);
    const float direct_gain = kit::SineTable::cos_lookup(angle);
    const float tap_gain = kit::SineTable::lookup(angle) * kTapGain;
    for (int side = 0; side < 2; ++side) {
      const float x = *channel[side];
      line_[side].write(x);
      float sum = 0.0f;
      for (int tap = 0; tap < kTaps; ++tap) {
        float& slow = slow_phase_[side][tap];
        float& fast = fast_phase_[side][tap];
        slow += slow_step_[side][tap];
        if (slow >= 1.0f) slow -= 1.0f;
        fast += fast_step_[side][tap];
        if (fast >= 1.0f) fast -= 1.0f;
        const float seconds = kBaseSeconds[side][tap] +
                              slow_depth_[side][tap] * kit::SineTable::lookup(slow) +
                              fast_depth_[side][tap] * kit::SineTable::lookup(fast);
        sum += line_[side].read_hermite(seconds * rate_);
      }
      *channel[side] = x * direct_gain + sum * tap_gain;
    }
  }

 private:
  // Longest read: 19 ms + 3.6 ms + margin, at an internal rate up to 48 kHz.
  static constexpr int kLineSize = 2048;
  static constexpr float kSlowBend = 0.0052f;  // 9 cents
  static constexpr float kFastBend = 0.0017f;  // 3 cents
  // Three taps that have drifted apart add in power, not in amplitude.
  static constexpr float kTapGain = 0.57735f;
  static constexpr float kBaseSeconds[2][kTaps] = {{0.0071f, 0.0113f, 0.0157f},
                                                   {0.0083f, 0.0127f, 0.0179f}};
  static constexpr float kSlowHz[2][kTaps] = {{0.23f, 0.37f, 0.53f}, {0.29f, 0.43f, 0.61f}};
  static constexpr float kFastHz[2][kTaps] = {{5.1f, 5.9f, 6.5f}, {5.5f, 6.2f, 4.9f}};
  static constexpr float kStartPhase[2][kTaps] = {{0.0f, 0.37f, 0.71f}, {0.19f, 0.58f, 0.86f}};

  kit::DelayLine<kLineSize> line_[2];
  float rate_ = 24000.0f;
  float slow_phase_[2][kTaps] = {}, fast_phase_[2][kTaps] = {};
  float slow_step_[2][kTaps] = {}, fast_step_[2][kTaps] = {};
  float slow_depth_[2][kTaps] = {}, fast_depth_[2][kTaps] = {};
};

}  // namespace pad_follower
}  // namespace livemix
