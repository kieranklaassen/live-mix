#pragma once

// Ambient Compressor: a slow hand on the fader, for sound that has swells and
// tails where other music has transients.
//
//   in ──┬────────────────────────────────────────► × gain × make-up ──► mix ──► out
//        │                                               ▲
//        └──► high-pass ──► RMS ──► dB ──► curve ──► attack / release
//             (Ignore       (2 × 30 ms)    (knee)    (release waits while a
//              below)                                 tail dies away)
//
// - Stereo linked: one detector hears the mean power of the two channels and
//   one gain is applied to both, so the image never moves. Threshold is an
//   RMS level in dBFS: a full-scale sine on both channels reads -3 dB, the
//   same sine on one channel only reads -6 dB.
// - The detector is two 30 ms one-poles in cascade on the power. A low drone
//   makes the power wobble at twice its frequency; at 55 Hz that wobble is
//   52 dB down after the two poles, so even the fastest Attack cannot move
//   the gain within one cycle of the wave and bend it.
// - The high-pass (12 dB an octave) is in the detector's path only: rumble
//   under Ignore below is not measured, and it is not removed either.
// - The curve is the usual soft knee, in dB. With over = level - Threshold,
//   slope = 1 / Ratio - 1 and W = Knee: no reduction while over <= -W / 2,
//   slope · over once over >= W / 2, and slope · (over + W / 2)² / (2 W)
//   between the two.
// - Attack and Release are time constants of one pole each on the reduction
//   in dB: 63 % of the way in the time set. What the detector takes to read
//   a new level comes on top: about 40 ms on a step up, 80 ms on a step down.
// - Tails "Hold" pauses the release while the sound is dying away: while the
//   level sits more than 1.5 dB under a 1 s follower of itself, which is what
//   a fall faster than 1.5 dB a second does. The gain then stays where it is
//   and the tail keeps its own shape. Once the level stops falling the
//   follower catches up and the release carries on. Attack is never paused.
//   The follower may not trail a rising level by more than the same 1.5 dB,
//   or it would still be climbing out of the silence seconds after a sound
//   began and a tail that came soon after would not be seen as one.
//   Tails "Release" is the classic behaviour, which pulls a tail back up.
// - Everything from the dB conversion on runs every 16 samples on a control
//   clock and the linear gain is ramped between ticks, so the output does not
//   depend on the host's block size and no log or pow runs per sample. The
//   ramp makes the gain 16 samples late, the audio is not delayed at all.
// - Threshold, Make-up and Mix are smoothed. Ratio, Knee, Attack and Release
//   take effect at the next tick: they only move the target or the speed of
//   the ballistics, which are what smooths them.
// - Wet and dry are the same signal at different gains, so Mix is a linear
//   crossfade: equal power would add 3 dB half way.
// - No latency and no tail: silence in is exact silence out. After half a
//   second of it the device rests: the reduction goes back to 0 dB and the
//   followers are cleared (nothing is sounding, so it cannot click), and the
//   first sound after a silence is not met with the gain the last one left.
//   A shorter gap inside a phrase keeps the gain. The half second is counted
//   in samples, not blocks, so where it falls does not depend on the host.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class AmbientComp : public kit::DeviceBase<ambient_comp::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace ambient_comp;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    tick_rate_ = sr / static_cast<float>(kControlPeriod);
    for (kit::OnePole& stage : rms_) stage.set_cutoff(1.0f / (kit::kTwoPi * kRmsSeconds), sr);
    slow_coeff_ = kit::time_to_coeff(kSlowSeconds, tick_rate_);
    threshold_.set_time(kSmoothingSeconds, tick_rate_);  // it is read once a tick
    makeup_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    rest_samples_ = static_cast<int>(kRestSeconds * sr);
    idle_.reset(sr, kRestSeconds);
    rest();
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The reading named by "meters" in device.json: 0 is the gain reduction in
  // dB as it is now, 0 at rest and negative while the gain is down.
  float meter(int index) const { return index == 0 ? static_cast<float>(reduction_) : 0.0f; }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      if (in[0] == 0.0f && in[1] == 0.0f) {
        if (!resting_ && ++silent_ >= rest_samples_) rest();
        if (resting_) {
          out_left_[i] = 0.0f;
          out_right_[i] = 0.0f;
          continue;
        }
      } else {
        silent_ = 0;
        resting_ = false;
      }

      const float left = sidechain_[0].highpass(in[0]);
      const float right = sidechain_[1].highpass(in[1]);
      const float power = rms_[1].lowpass(rms_[0].lowpass(0.5f * (left * left + right * right)));
      if (clock_.tick()) step_gain(power);
      gain_ += gain_step_;

      const float mix = mix_.next();
      const float applied = 1.0f - mix + mix * gain_ * makeup_.next();
      out_left_[i] = in[0] * applied;
      out_right_[i] = in[1] * applied;
    }
    idle_.settle(output_peak(frames), frames);
    // Only when the input was under the gate's floor without being zero.
    if (idle_.asleep() && !resting_) rest();
  }

 private:
  static constexpr int kControlPeriod = 16;
  static constexpr float kRmsSeconds = 0.03f;
  static constexpr float kSlowSeconds = 1.0f;
  static constexpr float kDyingDb = 1.5f;
  static constexpr float kFloorDb = -100.0f;
  static constexpr float kFloorPower = 1.0e-10f;
  // 120 dB over full scale: above it, or NaN, the detector has been poisoned.
  static constexpr float kCeilingPower = 1.0e12f;
  static constexpr float kRestSeconds = 0.5f;

  // One control tick: read the level, find the reduction the curve asks for,
  // move towards it, and aim the gain ramp at the result.
  void step_gain(float power) {
    if (!(power < kCeilingPower)) {
      clear_detector();
      power = 0.0f;
    }
    const float level = power > kFloorPower ? 10.0f * std::log10(power) : kFloorDb;
    const float over = level - threshold_.next();
    float target = 0.0f;
    if (2.0f * over >= knee_) {
      target = slope_ * over;
    } else if (2.0f * over > -knee_) {
      const float into = over + 0.5f * knee_;
      target = slope_ * into * into / (2.0f * knee_);
    }

    slow_level_ = flush_denormal(level + (slow_level_ - level) * slow_coeff_);
    if (slow_level_ < level - kDyingDb) slow_level_ = level - kDyingDb;  // close behind a rise
    const bool dying = hold_tails_ && level < slow_level_ - kDyingDb;
    if (target < reduction_) {
      reduction_ = target + (reduction_ - target) * attack_coeff_;
    } else if (!dying) {
      reduction_ = target + (reduction_ - target) * release_coeff_;
    }
    if (reduction_ > -kDenormalThreshold) reduction_ = 0.0;

    // Land on the last tick's value exactly, then ramp to this one.
    gain_ = gain_target_;
    gain_target_ = kit::db_to_gain(static_cast<float>(reduction_));
    gain_step_ = (gain_target_ - gain_) * (1.0f / static_cast<float>(kControlPeriod));
  }

  void clear_detector() {
    for (kit::Svf& filter : sidechain_) filter.reset();
    for (kit::OnePole& stage : rms_) stage.reset();
    slow_level_ = kFloorDb;
  }

  // Nothing is sounding: forget the gain and let pending values land.
  void rest() {
    clear_detector();
    reduction_ = 0.0;
    gain_ = 1.0f;
    gain_target_ = 1.0f;
    gain_step_ = 0.0f;
    clock_.reset(kControlPeriod);
    threshold_.snap(threshold_.target);
    makeup_.snap(makeup_.target);
    mix_.snap(mix_.target);
    silent_ = 0;
    resting_ = true;
  }

  void apply(int id) {
    using namespace ambient_comp;
    const float value = param(id);
    // At rest there is nothing to glide under, so values snap.
    const bool glide = primed() && !resting_;
    switch (id) {
      case kThreshold:
        threshold_.set(value, glide);
        break;
      case kRatio:
        slope_ = 1.0f / value - 1.0f;
        break;
      case kAttack:
        attack_coeff_ = kit::time_to_coeff(value * 0.001f, tick_rate_);
        break;
      case kRelease:
        release_coeff_ = kit::time_to_coeff(value, tick_rate_);
        break;
      case kKnee:
        knee_ = value;
        break;
      case kTails:
        hold_tails_ = value < 0.5f;
        break;
      case kScLowCut:
        for (kit::Svf& filter : sidechain_) filter.set(value, kit::kSqrtHalf, sample_rate());
        break;
      case kMakeup:
        makeup_.set(kit::db_to_gain(value), glide);
        break;
      case kMix:
        mix_.set(value, glide);
        break;
      default:
        break;
    }
  }

  kit::Svf sidechain_[2];
  kit::OnePole rms_[2];  // in cascade, on the power
  kit::Smoother threshold_, makeup_, mix_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float tick_rate_ = 3000.0f;
  float slow_coeff_ = 0.0f;
  float attack_coeff_ = 0.0f;
  float release_coeff_ = 0.0f;
  float slope_ = -0.5f;  // dB of reduction per dB over the threshold
  float knee_ = 12.0f;
  bool hold_tails_ = true;
  float slow_level_ = kFloorDb;  // the 1 s follower of the level, dB
  // dB, 0 or below. A double: at the slowest times one tick moves it by less
  // than a float can add to 9 dB, and it would stop short of where it is going.
  double reduction_ = 0.0;
  float gain_ = 1.0f;
  float gain_target_ = 1.0f;
  float gain_step_ = 0.0f;
  int rest_samples_ = 24000;
  int silent_ = 0;  // input samples of exact zero in a row
  bool resting_ = true;
};

}  // namespace livemix
