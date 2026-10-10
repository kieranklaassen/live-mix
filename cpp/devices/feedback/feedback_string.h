#pragma once

// The string of the Feedback instrument: one delay loop with a loss low-pass
// and a tuning allpass, as kit::PluckedString has, but opened where the
// amplifier comes back in:
//
//   v = loop();          what comes round the string this sample
//   write(v + x);        x is the pluck and the feedback
//
// and with the last period and a half of the string readable (`at`), which
// is what the device's zero-phase band is made of. The kit's string adds its
// excitation inside `tick` and keeps its loop gain to itself, so this one
// lives here.

#include "../../kit/math.h"

namespace livemix {

template <int Size>
class FeedbackString {
 public:
  static constexpr int kMask = Size - 1;
  static_assert((Size & (Size - 1)) == 0, "FeedbackString size must be a power of two");

  void reset() {
    for (int i = 0; i < Size; ++i) buffer_[i] = 0.0f;
    write_ = 0;
    loss_state_ = tune_x1_ = tune_y1_ = 0.0f;
    extra_ = 1.0f;
  }

  // The pitch and how long the string rings by itself, to -60 dB: `seconds`
  // at the note and `high_seconds` at `high_hz` (an octave above the note
  // when that is higher). The loss low-pass also lets high partials round a
  // little sooner than low ones, which puts them sharp of the note's
  // harmonics: `max_pole` is the most pole the caller will stand for that,
  // and past it the top simply rings longer than asked. Safe to call while
  // the string rings: only the filter coefficients and the line length move.
  void set(float hz, float sample_rate, float seconds, float high_seconds, float high_hz, float max_pole) {
    hz_ = hz;
    sample_rate_ = sample_rate;
    period_ = sample_rate / hz;
    const float w1 = kit::kTwoPi * hz / sample_rate;
    const float w2 = kit::kTwoPi * kit::min(kit::max(high_hz, 2.0f * hz), 0.45f * sample_rate) / sample_rate;
    seconds = kit::max(seconds, 0.001f);
    high_seconds = kit::clamp(high_seconds, 0.0005f, seconds);
    const float gain1 = std::pow(10.0f, -3.0f / (hz * seconds));
    const float gain2 = std::pow(10.0f, -3.0f / (hz * high_seconds));
    const float wanted = gain2 / gain1;  // how much quieter the high partial comes round
    loss_a_ = 0.0f;
    if (w2 > w1 && wanted < 1.0f) {
      float lo = 0.0f, hi = kMaxLossPole;
      if (ratio(hi, w1, w2) < wanted) {
        for (int i = 0; i < 20; ++i) {
          const float mid = 0.5f * (lo + hi);
          if (ratio(mid, w1, w2) > wanted) {
            lo = mid;
          } else {
            hi = mid;
          }
        }
      }
      loss_a_ = kit::min(hi, max_pole);
    }
    loss_gain_ = kit::min(gain1 / magnitude(loss_a_, w1), kMaxLoopGain);
    // One period round the loop at the fundamental: whole samples in the
    // line, the rest (0.5 to 1.5) in the allpass.
    const float loss_delay = std::atan2(loss_a_ * std::sin(w1), 1.0f - loss_a_ * std::cos(w1)) / w1;
    const float line = kit::clamp(period_ - loss_delay, 3.0f, static_cast<float>(Size - 4));
    whole_ = static_cast<int>(line - 0.5f);
    const float rest = line - static_cast<float>(whole_);
    tune_a_ = std::sin((1.0f - rest) * w1 * 0.5f) / std::sin((1.0f + rest) * w1 * 0.5f);
  }

  // A further gain on everything that comes round (the hand that stops the
  // string at key up); 1 leaves the string as it was set.
  void set_extra(float gain) { extra_ = gain; }

  float loop() {
    const float x = buffer_[(write_ - whole_) & kMask];
    loss_state_ = flush_denormal(x + (loss_state_ - x) * loss_a_);
    const float y = loss_gain_ * extra_ * loss_state_;
    const float out = flush_denormal(tune_a_ * y + tune_x1_ - tune_a_ * tune_y1_);
    tune_x1_ = y;
    tune_y1_ = out;
    return out;
  }

  void write(float y) {
    buffer_[write_] = y;
    write_ = (write_ + 1) & kMask;
  }

  // The string `delay` samples before the one about to be written (1 is the
  // last sample written).
  float at(int delay) const { return buffer_[(write_ - delay) & kMask]; }
  float at_linear(float delay) const {
    const int whole = static_cast<int>(delay);
    const float fraction = delay - static_cast<float>(whole);
    const float a = buffer_[(write_ - whole) & kMask];
    const float b = buffer_[(write_ - whole - 1) & kMask];
    return a + (b - a) * fraction;
  }

  // What is left of a partial at `w` radians per sample after one trip round.
  float gain_at(float w) const { return loss_gain_ * magnitude(loss_a_, w); }

  float period() const { return period_; }
  float frequency() const { return hz_; }

 private:
  static constexpr float kMaxLossPole = 0.98f;
  static constexpr float kMaxLoopGain = 0.99999f;

  // |H| of the loss low-pass (1 - a) / (1 - a z^-1) at w.
  static float magnitude(float a, float w) {
    return (1.0f - a) / std::sqrt(1.0f - 2.0f * a * std::cos(w) + a * a);
  }
  static float ratio(float a, float w1, float w2) { return magnitude(a, w2) / magnitude(a, w1); }

  float buffer_[Size] = {};
  int write_ = 0;
  float hz_ = 110.0f;
  float sample_rate_ = 48000.0f;
  float period_ = 436.0f;
  float loss_a_ = 0.0f;
  float loss_gain_ = 0.0f;
  float loss_state_ = 0.0f;
  float extra_ = 1.0f;
  int whole_ = 32;
  float tune_a_ = 0.0f;
  float tune_x1_ = 0.0f;
  float tune_y1_ = 0.0f;
};

}  // namespace livemix
