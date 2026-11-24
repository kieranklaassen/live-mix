#pragma once

#include "../../kit/kit.h"

// The room next door for the buzz: a gap before it, a wall that takes the
// top off, two diffusers and a four line network. Four lines, longest 47 ms.

namespace livemix {
namespace buzzing_bridge_dsp {

class NextRoom {
 public:
  static constexpr float kGapSeconds = 0.045f;

  void init(float sample_rate) {
    rate_ = sample_rate;
    kit::spread_lengths<kLines>(0.023f * rate_, 0.047f * rate_, lengths_);
    diffuse_[0] = static_cast<int>(0.0043f * rate_) | 1;
    diffuse_[1] = static_cast<int>(0.0071f * rate_) | 1;
    distance_ = -1.0f;
    set(0.0f);
    reset();
  }

  void reset() {
    gap_.clear();
    first_.clear();
    second_.clear();
    for (auto& line : lines_) line.clear();
    for (kit::OnePole& d : damp_) d.reset();
    wall_[0].reset();
    wall_[1].reset();
    ringing_ = false;
  }

  void set(float distance) {
    if (distance == distance_) return;
    distance_ = distance;
    wanted_ = 1.0f + distance * kGapSeconds * rate_;
    const float cut = 9000.0f * std::pow(0.16f, distance);
    for (kit::OnePole& w : wall_) w.set_cutoff(cut, rate_);
    const float rt60 = 0.25f + 0.85f * distance;
    tail_ = 0.75f * std::sqrt(0.25f / rt60);  // a longer tail is not a louder one
    for (int i = 0; i < kLines; ++i) {
      gain_[i] = kit::rt60_gain(static_cast<float>(lengths_[i]), rt60, rate_);
      damp_[i].set_cutoff(6000.0f - 2500.0f * distance, rate_);
    }
  }

  // At rest the gap is at once as long as it is set to be.
  void land() { delay_ = wanted_; }

  bool ringing() const { return ringing_; }

  void process(float x, float* mid, float* side) {
    // The gap grows and shrinks at a walking pace.
    delay_ += kit::clamp(wanted_ - delay_, -0.25f, 0.25f);
    gap_.write(x);
    const float far = wall_[1].lowpass(wall_[0].lowpass(gap_.read_linear(delay_)));
    const float in = second_.process(first_.process(far, diffuse_[0], 0.6f), diffuse_[1], 0.6f);
    float v[kLines];
    for (int i = 0; i < kLines; ++i) v[i] = lines_[i].read(lengths_[i]);
    *mid = 0.9f * far + tail_ * (v[0] + v[1] - v[2] + v[3]);
    *side = tail_ * (v[0] - v[1] + v[2] + v[3]);
    const float held = std::fabs(*mid) + std::fabs(*side) + std::fabs(v[2]);
    ringing_ = held > 1.0e-8f;
    kit::hadamard<kLines>(v);
    for (int i = 0; i < kLines; ++i) {
      lines_[i].write(flush_denormal(damp_[i].lowpass(v[i] * gain_[i]) + 0.5f * in));
    }
  }

 private:
  static constexpr int kLines = 4;

  kit::DelayLine<16384> gap_;
  kit::AllpassDelay<2048> first_;
  kit::AllpassDelay<2048> second_;
  kit::DelayLine<16384> lines_[kLines];
  kit::OnePole damp_[kLines];
  kit::OnePole wall_[2];
  int lengths_[kLines] = {};
  int diffuse_[2] = {1, 1};
  float gain_[kLines] = {};
  float rate_ = 48000.0f, delay_ = 1.0f, wanted_ = 1.0f, distance_ = -1.0f, tail_ = 0.75f;
  bool ringing_ = false;
};

}  // namespace buzzing_bridge_dsp
}  // namespace livemix
