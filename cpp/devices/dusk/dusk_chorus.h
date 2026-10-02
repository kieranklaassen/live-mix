#pragma once

// The chorus of Dusk, which is most of what the instrument is known by.
//
//   mono in ─┬──────────────────────────────────────────► dry ─┐
//            └─► low-pass ─┬─► line A ─► (+ hiss) ─► low-pass ─┴─► left  = g (dry + A)
//                          └─► line B ─► (+ hiss) ─► low-pass ───► right = g (dry + B)
//
// Two delay lines read the same signal. ONE triangle LFO moves both delays:
// in modes I and II in opposite directions, so while the left copy runs flat
// the right one runs sharp by the same amount and they swap twice a cycle; in
// mode I + II in the same direction, fast and shallow, so the wet signal is in
// the centre. A triangle makes the detune a constant offset that flips, not a
// wobble. Dry and wet are summed equally, the wet path is darker than the dry
// one, and each side has its own hiss.
//
// Rates and sweeps are design targets from the research named in the
// manifest's origin note; the corner of the low-passes and the hiss level are
// choices.

#include "../../kit/delay.h"
#include "../../kit/filters.h"
#include "../../kit/smooth.h"

namespace livemix {
namespace dusk_detail {

class TwoLineChorus {
 public:
  enum Mode : int { kOff = 0, kOne, kTwo, kBoth, kNumModes };

  struct Setting {
    float rate_hz;
    float shortest_s;
    float longest_s;
    float polarity;  // of the right line against the left
  };

  static constexpr Setting kSettings[kNumModes] = {
      {0.513f, 0.00166f, 0.00535f, -1.0f},  // Off keeps mode I's motion and mutes the wet path
      {0.513f, 0.00166f, 0.00535f, -1.0f},
      {0.863f, 0.00166f, 0.00535f, -1.0f},
      {9.75f, 0.0033f, 0.0037f, 1.0f},
  };
  // Dry plus one decorrelated copy carries twice the power of the dry alone.
  static constexpr float kSumGain = 0.7071f;
  static constexpr float kWetCornerHz = 8000.0f;
  // Peak of the white noise fed to each wet low-pass at 48 kHz.
  static constexpr float kHissLevel = 0.0029f;
  static constexpr uint32_t kSeedLeft = 0x51ED270Bu;
  static constexpr uint32_t kSeedRight = 0x9E3779B9u;

  void init(float sample_rate) {
    sample_rate_ = sample_rate;
    left_line_.clear();
    right_line_.clear();
    pre_.reset();
    post_left_.reset();
    post_right_.reset();
    pre_.set_lowpass(kWetCornerHz, kit::kSqrtHalf, sample_rate);
    post_left_.set_lowpass(kWetCornerHz, kit::kSqrtHalf, sample_rate);
    post_right_.set_lowpass(kWetCornerHz, kit::kSqrtHalf, sample_rate);
    // White noise has the same density at every sample rate when its level
    // grows with the root of the rate.
    hiss_level_ = kHissLevel * std::sqrt(sample_rate / 48000.0f);
    rate_.set_time(kGlideSeconds, sample_rate);
    centre_.set_time(kGlideSeconds, sample_rate);
    depth_.set_time(kGlideSeconds, sample_rate);
    polarity_.set_time(kGlideSeconds, sample_rate);
    wet_.set_time(kFadeSeconds, sample_rate);
    set_mode(kOne, false);
    restart();
  }

  // A change glides: the rate, the sweep and the polarity move over tens of
  // milliseconds and the wet path fades, so the delay time never jumps.
  void set_mode(int mode, bool glide) {
    mode = kit::clamp_int(mode, 0, kNumModes - 1);
    wet_.set(mode == kOff ? 0.0f : 1.0f, glide);
    if (mode == kOff) return;  // keep moving as before while the wet path fades
    const Setting& setting = kSettings[mode];
    rate_.set(setting.rate_hz, glide);
    centre_.set(0.5f * (setting.shortest_s + setting.longest_s), glide);
    depth_.set(0.5f * (setting.longest_s - setting.shortest_s), glide);
    polarity_.set(setting.polarity, glide);
  }

  // Start the sweep and the hiss from the same place, with the mode fully
  // arrived. The device calls this before the first key after a silence, so
  // what follows does not depend on when exactly it fell asleep.
  void restart() {
    phase_ = 0.0f;
    hiss_left_.seed(kSeedLeft);
    hiss_right_.seed(kSeedRight);
    kit::Smoother* const smoothers[] = {&rate_, &centre_, &depth_, &polarity_, &wet_};
    for (kit::Smoother* smoother : smoothers) smoother->snap(smoother->target);
  }

  // `hiss` in [0, 1] gates the noise.
  void process(float dry, float hiss, float* left, float* right) {
    phase_ += rate_.next() / sample_rate_;
    if (phase_ >= 1.0f) phase_ -= 1.0f;
    const float triangle = phase_ < 0.5f ? 4.0f * phase_ - 1.0f : 3.0f - 4.0f * phase_;
    const float centre = centre_.next();
    const float sweep = depth_.next() * triangle;
    const float limit = Line::max_delay();
    const float left_delay = kit::min((centre + sweep) * sample_rate_, limit);
    const float right_delay = kit::min((centre + polarity_.next() * sweep) * sample_rate_, limit);

    const float band_limited = pre_.process(dry);
    const float noise = hiss * hiss_level_;
    const float wet_left =
        post_left_.process(left_line_.read_hermite(left_delay) + noise * hiss_left_.bipolar());
    const float wet_right =
        post_right_.process(right_line_.read_hermite(right_delay) + noise * hiss_right_.bipolar());
    left_line_.write(band_limited);
    right_line_.write(band_limited);

    // Off is the dry signal on both sides, exactly: the wet gain lands on 0.
    const float amount = wet_.next();
    const float dry_gain = 1.0f + (kSumGain - 1.0f) * amount;
    const float wet_gain = kSumGain * amount;
    *left = dry * dry_gain + wet_left * wet_gain;
    *right = dry * dry_gain + wet_right * wet_gain;
  }

 private:
  // 5.35 ms is 514 samples at 96 kHz and 1028 at 192 kHz.
  using Line = kit::DelayLine<2048>;
  static constexpr float kGlideSeconds = 0.05f;
  static constexpr float kFadeSeconds = 0.03f;

  Line left_line_;
  Line right_line_;
  kit::Biquad pre_, post_left_, post_right_;
  kit::Rng hiss_left_, hiss_right_;
  kit::Smoother rate_, centre_, depth_, polarity_, wet_;
  float sample_rate_ = 48000.0f;
  float hiss_level_ = kHissLevel;
  float phase_ = 0.0f;
};

}  // namespace dusk_detail
}  // namespace livemix
