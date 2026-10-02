#pragma once

// The ensemble of Pad Follower: what turns one steady oscillator per partial
// into a section of players. Each side has its own delay line read by three
// taps, every tap swept by its own slow sine (a fifth to two thirds of a
// hertz, up to about nine cents of pitch bend each way) plus a small faster
// one (five to six and a half hertz, up to about three cents), the way the
// bucket brigade ensembles of string machines do it. The six taps differ in
// rate, so left and right are decorrelated by the timing itself and never by
// a polarity flip; their sum stays mono-compatible.
//
// Copies of one partial that are about equally loud cancel and reinforce
// each other as they drift: a single pure note then fades in and out by
// 15 dB several times a second. So each side has one main tap, which alone
// keeps a partial at a steady level whatever its pitch does, and two lesser
// ones beside it that give the shimmer; there is no unswept path. The amount
// sets how far the taps are swept and how strong the lesser ones are: none
// at all at zero (one steady voice per note), a third of the main tap's
// level at the default, half of it at full.

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
    counter_ = 0;
    amount_ = -1.0f;
    depth_ = -1.0f;
    depth_coeff_ = 1.0f - kit::time_to_coeff(kDepthSeconds, rate / kSweepPeriod);
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
        delay_[side][tap] = position(side, tap);
        delay_step_[side][tap] = 0.0f;
      }
    }
  }

  // In place. `amount` 0 is the main tap alone, standing still; raising it
  // sweeps the taps further and brings the lesser ones in. The three add in
  // power to one at every amount.
  void process(float* left, float* right, float amount) {
    float* channel[2] = {left, right};
    if (amount != amount_) {
      amount_ = kit::clamp(amount, 0.0f, 1.0f);
      if (depth_ < 0.0f) depth_ = amount_;
      lesser_gain_ = kLesserGain * amount_ * std::sqrt(amount_);
      main_gain_ = std::sqrt(1.0f - 2.0f * lesser_gain_ * lesser_gain_);
    }
    if (counter_ == 0) sweep();
    if (++counter_ >= kSweepPeriod) counter_ = 0;
    for (int side = 0; side < 2; ++side) {
      line_[side].write(*channel[side]);
      float lesser = 0.0f, main = 0.0f;
      for (int tap = 0; tap < kTaps; ++tap) {
        delay_[side][tap] += delay_step_[side][tap];
        if (tap == kMainTap) {
          main = line_[side].read_hermite(delay_[side][tap]);
        } else if (lesser_gain_ > 0.0f) {
          lesser += line_[side].read_hermite(delay_[side][tap]);
        }
      }
      *channel[side] = main * main_gain_ + lesser * lesser_gain_;
    }
  }

 private:
  // Every kSweepPeriod samples: where each tap will be one period from now.
  // The taps move in straight lines in between, which at these rates is the
  // sine to within a ten-thousandth of a sample.
  void sweep() {
    // The sweep follows the amount slowly: a turn of the knob moves the taps,
    // and moving them fast would bend the pitch.
    depth_ += depth_coeff_ * (amount_ - depth_);
    for (int side = 0; side < 2; ++side) {
      for (int tap = 0; tap < kTaps; ++tap) {
        float& slow = slow_phase_[side][tap];
        float& fast = fast_phase_[side][tap];
        slow += slow_step_[side][tap] * kSweepPeriod;
        if (slow >= 1.0f) slow -= 1.0f;
        fast += fast_step_[side][tap] * kSweepPeriod;
        if (fast >= 1.0f) fast -= 1.0f;
        const float next = position(side, tap);
        delay_step_[side][tap] = (next - delay_[side][tap]) * (1.0f / kSweepPeriod);
      }
    }
  }

  float position(int side, int tap) const {
    const float swing = slow_depth_[side][tap] * kit::SineTable::lookup(slow_phase_[side][tap]) +
                        fast_depth_[side][tap] * kit::SineTable::lookup(fast_phase_[side][tap]);
    return rate_ * (kBaseSeconds[side][tap] + kit::max(depth_, 0.0f) * swing);
  }

  static constexpr int kSweepPeriod = 16;
  // Longest read: 19 ms + 3.6 ms + margin, at an internal rate up to 48 kHz.
  static constexpr int kLineSize = 2048;
  static constexpr float kSlowBend = 0.0052f;  // 9 cents
  static constexpr float kFastBend = 0.0017f;  // 3 cents
  // The middle tap of each side is its main one; both rest at the same
  // length, so that the unswept pad sits in the centre.
  static constexpr int kMainTap = 1;
  // Each lesser tap at full amount (the main tap is then 0.80: when all three
  // line up on one pure note they reach 1.64, when they have drifted apart 1).
  static constexpr float kLesserGain = 0.42f;
  // How fast the sweep follows the amount.
  static constexpr float kDepthSeconds = 0.3f;
  static constexpr float kBaseSeconds[2][kTaps] = {{0.0071f, 0.0120f, 0.0157f},
                                                   {0.0083f, 0.0120f, 0.0179f}};
  static constexpr float kSlowHz[2][kTaps] = {{0.23f, 0.37f, 0.53f}, {0.29f, 0.43f, 0.61f}};
  static constexpr float kFastHz[2][kTaps] = {{5.1f, 5.9f, 6.5f}, {5.5f, 6.2f, 4.9f}};
  static constexpr float kStartPhase[2][kTaps] = {{0.0f, 0.37f, 0.71f}, {0.19f, 0.58f, 0.86f}};

  kit::DelayLine<kLineSize> line_[2];
  float rate_ = 24000.0f;
  float slow_phase_[2][kTaps] = {}, fast_phase_[2][kTaps] = {};
  float slow_step_[2][kTaps] = {}, fast_step_[2][kTaps] = {};
  float slow_depth_[2][kTaps] = {}, fast_depth_[2][kTaps] = {};
  float delay_[2][kTaps] = {}, delay_step_[2][kTaps] = {};
  int counter_ = 0;
  float amount_ = -1.0f, main_gain_ = 1.0f, lesser_gain_ = 0.0f;
  float depth_ = -1.0f, depth_coeff_ = 0.0f;
};

}  // namespace pad_follower
}  // namespace livemix
