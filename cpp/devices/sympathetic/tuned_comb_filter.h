#pragma once

// One sympathetic string: a Karplus-Strong comb, ported from kkfonie's
// TunedCombFilter.
//
//   in ──(+)──► soft clip ──► DC block ──► delay ──► tuning allpass ──┬──► out
//         ▲                                                           │
//         └────────────── feedback ◄── damping low-pass ◄─────────────┘
//
// What the port changes, and why:
//
// - Tuning is exact at the fundamental. The loop's delay is the delay line
//   plus the allpass plus the phase delay of the damping filter minus the
//   phase lead of the DC blocker; set_frequency solves for the delay that
//   makes the sum one period and picks the allpass coefficient that gives
//   the fractional part at that frequency. The source ignored the two
//   filters (and clamped the allpass delay), which left a string tuned to C3
//   ringing three quarters of a semitone sharp.
// - Decay is the RT60 of the fundamental: the feedback gain makes up for
//   what the damping filter and DC blocker take away at that frequency, up
//   to the source's 0.999 ceiling. From the fifth octave up the ceiling and
//   the damping win (at most 6.8 s at C5, 3.7 s at F5, 1.4 s at C6, 0.2 s at
//   C7) and the high strings die sooner than Decay says, as the short
//   strings of a piano do.
// - The DC blocker sits at 2 Hz instead of 35 Hz (R = 0.995 at 44.1 kHz),
//   where it still removes the comb's resonance at 0 Hz but no longer eats
//   the fundamentals of the low strings.
// - Retuning crossfades between two read taps on the same delay line, so
//   what the string holds carries on at the new pitch without a click.

#include "../../kit/math.h"

namespace livemix {
namespace sympathetic {

// flush_denormal with one comparison. The shared one tests both signs, which
// on a noisy signal is a coin toss the branch predictor loses half the time;
// with three of them per string per sample that doubled the native cost of
// the bank.
inline float flush_small(float x) { return std::fabs(x) < kDenormalThreshold ? 0.0f : x; }

class TunedCombFilter {
 public:
  static constexpr int kMaxDelaySamples = 4096;  // a 30 Hz string at 96 kHz is 3200
  static constexpr int kDelayMask = kMaxDelaySamples - 1;
  static constexpr float kMinFrequency = 30.0f;
  static constexpr float kMaxFrequency = 4000.0f;
  static constexpr float kMaxFeedback = 0.999f;
  static constexpr float kDcCornerHz = 2.0f;
  static constexpr float kRetuneSeconds = 0.04f;

  void prepare(float sample_rate) {
    sample_rate_ = sample_rate;
    dc_r_ = 1.0f - kit::kTwoPi * kDcCornerHz / sample_rate;
    dc_gain_ = 0.5f * (1.0f + dc_r_);  // exactly unity at Nyquist, never above
    fade_step_ = 1.0f / kit::max(1.0f, kRetuneSeconds * sample_rate);
    tap_[0] = Tap();
    tap_[1] = Tap();
    frequency_ = 0.0f;
    pending_ = 0.0f;
    fading_ = false;
    clear();
  }

  // Empty the string, keeping its tuning (a retune in flight lands at once).
  void clear() {
    const float hz = pending_ != 0.0f ? pending_ : frequency_;
    for (int i = 0; i < kMaxDelaySamples; ++i) buffer_[i] = 0.0f;
    write_ = 0;
    fade_ = 0.0f;
    fading_ = false;
    pending_ = 0.0f;
    damping_state_ = 0.0f;
    dc_x1_ = 0.0f;
    dc_y1_ = 0.0f;
    silent_ = true;
    if (hz > 0.0f) {
      frequency_ = hz;
      tune(&tap_[0], hz);
    }
    tap_[0].state = 0.0f;
    tap_[1].state = 0.0f;
  }

  // Tune the string. `glide` crossfades from the current pitch over
  // kRetuneSeconds; without it (or while the string holds nothing) the new
  // pitch takes over at once.
  void set_frequency(float hz, bool glide) {
    hz = kit::clamp(hz, kMinFrequency, kit::min(kMaxFrequency, 0.4f * sample_rate_));
    // A sample rate above 96 kHz can ask for more than the line holds.
    while (sample_rate_ / hz > static_cast<float>(kMaxDelaySamples - 8)) hz *= 2.0f;
    if (hz == frequency_ && pending_ == 0.0f) return;
    if (!glide || silent_) {
      frequency_ = hz;
      pending_ = 0.0f;
      fading_ = false;
      fade_ = 0.0f;
      tune(&tap_[0], hz);
      tap_[0].state = 0.0f;
      return;
    }
    if (fading_) {
      pending_ = hz;  // taken up when the fade in flight lands
      return;
    }
    begin_fade(hz);
  }

  // RT60 of the fundamental in seconds.
  void set_decay(float rt60_seconds) {
    rt60_ = rt60_seconds;
    tap_[0].feedback = feedback_for(tap_[0]);
    tap_[1].feedback = feedback_for(tap_[1]);
  }

  // The loop's one-pole coefficient as the source gives it, 0 (none) to
  // 0.95, taken to be for 44.1 kHz. It is converted to the coefficient that
  // loses the same amount per second at this sample rate (c / (1 - c)² grows
  // with the square of the rate), so the high strings last as long at 96 kHz
  // as they do at 44.1.
  void set_damping(float coefficient) {
    const double c = kit::clamp(coefficient, 0.0f, 0.95f);
    const double ratio = sample_rate_ / 44100.0;
    const double k = c / ((1.0 - c) * (1.0 - c)) * ratio * ratio;
    damping_ = k > 1.0e-9 ? static_cast<float>(((2.0 * k + 1.0) - std::sqrt(4.0 * k + 1.0)) / (2.0 * k))
                          : 0.0f;
    tune(&tap_[0], tap_[0].hz);
    if (fading_) tune(&tap_[1], tap_[1].hz);
  }

  float frequency() const { return frequency_; }
  // The mean square of what the string holds: the last period written to
  // the line. For a display; it reads and changes nothing.
  float energy() const {
    if (silent_) return 0.0f;
    const int span = tap_[0].delay;
    float sum = 0.0f;
    for (int i = 1; i <= span; ++i) {
      const float x = buffer_[(write_ - i) & kDelayMask];
      sum += x * x;
    }
    return sum / static_cast<float>(span);
  }
  // True while the string holds nothing: cleared, and not excited since.
  bool silent() const { return silent_; }

  float process(float input) {
    float out = read(&tap_[0]);
    float feedback = tap_[0].feedback;
    if (fading_) {
      const float incoming = read(&tap_[1]);
      out += (incoming - out) * fade_;
      feedback += (tap_[1].feedback - feedback) * fade_;
      fade_ += fade_step_;
      if (fade_ >= 1.0f) end_fade();
    }
    damping_state_ = flush_small((1.0f - damping_) * out + damping_ * damping_state_);

    // The source clips with std::tanh; the rational tanh has the same unit
    // slope at rest (so tuning and decay are untouched) at a tenth the cost.
    const float driven = kit::fast_tanh(input + damping_state_ * feedback);
    const float blocked = flush_small(dc_gain_ * (driven - dc_x1_) + dc_r_ * dc_y1_);
    dc_x1_ = driven;
    dc_y1_ = blocked;

    buffer_[write_] = blocked;
    write_ = (write_ + 1) & kDelayMask;
    if (blocked != 0.0f) silent_ = false;
    return out;
  }

 private:
  struct Tap {
    int delay = 2;
    float coefficient = 0.0f;  // tuning allpass
    float state = 0.0f;
    float feedback = 0.0f;
    double loss = 1.0;  // gain of damping filter and DC blocker at the fundamental
    float hz = 440.0f;
  };

  // Tuning allpass over the delay line: y[n] = a x[n] + x[n-1] - a y[n-1].
  float read(Tap* tap) {
    const float newer = buffer_[(write_ - tap->delay) & kDelayMask];
    const float older = buffer_[(write_ - tap->delay - 1) & kDelayMask];
    tap->state = flush_small(tap->coefficient * (newer - tap->state) + older);
    return tap->state;
  }

  // Double precision: 1 - cos(w) at 30 Hz is a few parts in a million.
  void tune(Tap* tap, float hz) {
    tap->hz = hz;
    const double w = 2.0 * 3.14159265358979323846 * hz / sample_rate_;
    const double cosw = std::cos(w);
    const double sinw = std::sin(w);
    const double c = damping_;
    const double r = dc_r_;
    // Phase delay of the damping low-pass and phase lead of the DC blocker
    // at the fundamental, in samples.
    const double damping_delay = std::atan2(c * sinw, 1.0 - c * cosw) / w;
    const double dc_lead = (std::atan2(sinw, 1.0 - cosw) - std::atan2(r * sinw, 1.0 - r * cosw)) / w;
    const double wanted = sample_rate_ / hz - damping_delay + dc_lead;
    // Whole samples on the line, the rest (0.5 to 1.5 samples) on the allpass.
    int whole = static_cast<int>(wanted - 0.5);
    whole = kit::clamp_int(whole, 1, kMaxDelaySamples - 2);
    double fraction = wanted - whole;
    if (fraction < 0.5) fraction = 0.5;
    if (fraction > 1.5) fraction = 1.5;
    tap->delay = whole;
    // The coefficient whose phase delay is `fraction` at this frequency
    // exactly, not just towards 0 Hz as the Thiran design gives.
    tap->coefficient = static_cast<float>(std::sin(0.5 * w * (1.0 - fraction)) /
                                          std::sin(0.5 * w * (1.0 + fraction)));

    const double damping_gain = (1.0 - c) / std::sqrt(1.0 + c * c - 2.0 * c * cosw);
    const double dc_gain = dc_gain_ * std::sqrt((2.0 - 2.0 * cosw) / (1.0 + r * r - 2.0 * r * cosw));
    tap->loss = damping_gain * dc_gain;
    if (tap->loss < 1.0e-3) tap->loss = 1.0e-3;
    tap->feedback = feedback_for(*tap);
  }

  // feedback^(rt60 / period) = 0.001 (-60 dB), with the loop's own loss at
  // the fundamental made up.
  float feedback_for(const Tap& tap) const {
    if (!(rt60_ > 0.0f)) return 0.0f;
    const double wanted = std::exp(-6.907755278982137 / (static_cast<double>(tap.hz) * rt60_));
    const double feedback = wanted / tap.loss;
    return feedback > kMaxFeedback ? kMaxFeedback : static_cast<float>(feedback);
  }

  void begin_fade(float hz) {
    frequency_ = hz;
    tune(&tap_[1], hz);
    // Start the incoming allpass where a settled one would be.
    tap_[1].state = buffer_[(write_ - tap_[1].delay - 1) & kDelayMask];
    fade_ = 0.0f;
    fading_ = true;
  }

  void end_fade() {
    tap_[0] = tap_[1];
    fade_ = 0.0f;
    fading_ = false;
    if (pending_ != 0.0f) {
      const float next = pending_;
      pending_ = 0.0f;
      if (next != frequency_) begin_fade(next);
    }
  }

  float buffer_[kMaxDelaySamples] = {};
  int write_ = 0;
  Tap tap_[2];
  float fade_ = 0.0f;
  float fade_step_ = 0.0f;
  bool fading_ = false;
  float pending_ = 0.0f;  // a pitch asked for during a fade; 0 = none

  float damping_ = 0.5f;
  float damping_state_ = 0.0f;
  float dc_r_ = 0.9997f;
  float dc_gain_ = 1.0f;
  float dc_x1_ = 0.0f;
  float dc_y1_ = 0.0f;

  float rt60_ = 3.0f;
  float sample_rate_ = 48000.0f;
  float frequency_ = 0.0f;
  bool silent_ = true;
};

}  // namespace sympathetic
}  // namespace livemix
