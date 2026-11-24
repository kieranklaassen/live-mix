#pragma once

#include "../../kit/kit.h"

// The pitch of the swing the bridge is touched by: a normalised
// autocorrelation (the square difference form) of the sound under 1.4 kHz at
// about 6 kHz, 43 ms long, a hundred times a second, its lags spread over the
// control ticks so that no block carries the whole of one. It answers from
// 40 Hz to 2 kHz and keeps its last answer while it is unsure (noise, a
// chord with no common period, silence).

namespace livemix {
namespace buzzing_bridge_dsp {

class SwingPitch {
 public:
  void init(float sample_rate) {
    step_ = kit::clamp_int(static_cast<int>(sample_rate / 6000.0f + 0.5f), 1, 64);
    rate_ = sample_rate / static_cast<float>(step_);
    kit::SineTable::init();
    for (int i = 0; i < kFrame; ++i) {
      window_[i] = 0.5f - 0.5f * kit::SineTable::cos_lookup((static_cast<float>(i) + 0.5f) / kFrame);
    }
    for (kit::Svf& f : filter_) f.set(1400.0f, kit::kSqrtHalf, sample_rate);
    reset();
  }

  void reset() {
    for (kit::Svf& f : filter_) f.reset();
    for (float& v : ring_) v = 0.0f;
    for (float& v : frame_) v = 0.0f;
    for (float& v : score_) v = 0.0f;
    write_ = phase_ = fresh_ = 0;
    lag_ = -1;
    hz_ = asked_ = 0.0f;
  }

  // 0 until a pitch has been found.
  float hz() const { return hz_; }

  void push(float x) {
    const float y = filter_[1].lowpass(filter_[0].lowpass(x));
    if (++phase_ < step_) return;
    phase_ = 0;
    ring_[write_] = y;
    write_ = (write_ + 1) & kRingMask;
    if (fresh_ < kHop) ++fresh_;
  }

  // One control tick. `level` is the peak of the whole sound: what is left of
  // it under 1.4 kHz has to count for something.
  void tick(float level) {
    if (lag_ < 0) {
      if (fresh_ < kHop) return;
      fresh_ = 0;
      float energy = 0.0f;
      for (int i = 0; i < kFrame; ++i) {
        frame_[i] = ring_[(write_ - kFrame + i) & kRingMask];
        energy += frame_[i] * frame_[i];
      }
      if (energy < kFrame * 4.0e-4f * level * level || energy < 1.0e-9f) return;
      head_ = 0.0f;
      for (int i = 0; i < kWindow; ++i) head_ += frame_[i] * frame_[i];
      tail_ = head_;
      score_[0] = 1.0f;
      lag_ = 1;
    }
    for (int n = 0; n < kLagsPerTick && lag_ < kLags; ++n, ++lag_) {
      tail_ += frame_[lag_ + kWindow - 1] * frame_[lag_ + kWindow - 1] - frame_[lag_ - 1] * frame_[lag_ - 1];
      float sum = 0.0f;
      for (int i = 0; i < kWindow; ++i) sum += frame_[i] * frame_[i + lag_];
      const float scale = head_ + kit::max(tail_, 0.0f);
      score_[lag_] = scale > 1.0e-12f ? 2.0f * sum / scale : 0.0f;
    }
    if (lag_ >= kLags) {
      lag_ = -1;
      decide();
    }
  }

 private:
  static constexpr int kWindow = 256;
  static constexpr int kLags = 160;
  static constexpr int kFrame = kWindow + kLags;
  static constexpr int kRing = 512;
  static constexpr int kRingMask = kRing - 1;
  static constexpr int kHop = 60;
  static constexpr int kLagsPerTick = 12;
  static constexpr int kMultiples = 6;
  static constexpr float kSure = 0.75f;
  // The first peak this near the best is the period; a peak a few lags wide
  // is read too low by the parabola through it.
  static constexpr float kFirst = 0.9f;
  static constexpr float kFirstShort = 0.75f;

  bool peak_at(int lag) const {
    return lag > 0 && lag < kLags - 1 && score_[lag] > score_[lag - 1] && score_[lag] >= score_[lag + 1];
  }

  // The top of the parabola through three scores.
  float refine(int lag, float* height) const {
    const float a = score_[lag - 1], b = score_[lag], c = score_[lag + 1];
    const float bend = a - 2.0f * b + c;
    const float offset = bend < -1.0e-9f ? kit::clamp(0.5f * (a - c) / bend, -0.5f, 0.5f) : 0.0f;
    *height = b - 0.25f * (a - c) * offset;
    return static_cast<float>(lag) + offset;
  }

  // A chord's common period lies under every note in it. The pitch is the
  // lowest multiple of it that sounds.
  float sounding(float hz) const {
    float level[kMultiples];
    float most = 0.0f;
    int count = 0;
    for (; count < kMultiples && hz * static_cast<float>(count + 1) < 2100.0f; ++count) {
      const float turn = hz * static_cast<float>(count + 1) / rate_;
      float re = 0.0f, im = 0.0f, phase = 0.0f;
      for (int i = 0; i < kFrame; ++i) {
        const float x = frame_[i] * window_[i];
        re += x * kit::SineTable::cos_lookup(phase);
        im += x * kit::SineTable::lookup(phase);
        phase += turn;
        if (phase >= 1.0f) phase -= 1.0f;
      }
      level[count] = re * re + im * im;
      most = kit::max(most, level[count]);
    }
    for (int m = 0; m < count; ++m) {
      if (level[m] >= 0.02f * most) return hz * static_cast<float>(m + 1);
    }
    return hz;
  }

  void decide() {
    int from = 1;
    while (from < kLags && score_[from] > 0.0f) ++from;
    float best = 0.0f;
    for (int lag = from; lag < kLags - 1; ++lag) {
      if (!peak_at(lag)) continue;
      float height;
      refine(lag, &height);
      best = kit::max(best, height);
    }
    if (best < kSure) return;
    float period = 0.0f;
    for (int lag = from; lag < kLags - 1; ++lag) {
      if (!peak_at(lag)) continue;
      float height;
      const float at = refine(lag, &height);
      if (height >= (lag < 8 ? kFirstShort : kFirst) * best) {
        period = at;
        break;
      }
    }
    if (!(period > 2.0f)) return;
    // A short period is read again off its multiples, where a part of a lag
    // counts for less.
    int times = 1;
    while (period * static_cast<float>(2 * times) < static_cast<float>(kLags - 3)) {
      times *= 2;
      const int near = static_cast<int>(period * static_cast<float>(times) + 0.5f);
      int top = near;
      for (int lag = near - 2; lag <= near + 2; ++lag) {
        if (lag < kLags && score_[lag] > score_[top]) top = lag;
      }
      if (!peak_at(top)) break;
      float height;
      const float at = refine(top, &height);
      if (height < 0.7f * best) break;
      period = at / static_cast<float>(times);
    }
    const float hz = sounding(rate_ / period);
    if (hz < 38.0f || hz > 2100.0f) return;
    // Taken at its word when the next reading says the same: one that stands
    // alone is the seam between two notes, or a chord's parts passing.
    if (asked_ > 0.0f && std::fabs(hz / asked_ - 1.0f) < 0.03f) hz_ = hz;
    asked_ = hz;
  }

  kit::Svf filter_[2];
  float ring_[kRing] = {};
  float frame_[kFrame] = {};
  float score_[kLags] = {};
  float window_[kFrame] = {};
  float rate_ = 6000.0f, head_ = 0.0f, tail_ = 0.0f, hz_ = 0.0f, asked_ = 0.0f;
  int step_ = 8, write_ = 0, phase_ = 0, fresh_ = 0, lag_ = -1;
};

}  // namespace buzzing_bridge_dsp
}  // namespace livemix
