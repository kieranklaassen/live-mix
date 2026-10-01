#pragma once

// Swell: takes the attack off whatever is played, so each note fades in.
//
//   in ──┬──► delay (20 ms at 48 kHz, fixed) ──────────────► × gain ──► mix ──► out
//        │                                                     ▲
//        └──► delay (20 ms − Lookahead) ──► detector ──► ramp ─┘
//
// - The detector hears the input Lookahead earlier than the gain stage does.
//   When it sees a note it first pulls the gain down to the floor during that
//   lookahead (so the pick is already gone when it arrives) and only then
//   starts the rise. With Lookahead at 0 the dive takes 2 ms and the first
//   moment of a note played over a ringing one leaks through, as it does on
//   the pedals.
// - The audio delay is always kLatency samples whatever Lookahead says, so the
//   reported latency never changes. It is a sample count, so above 48 kHz the
//   longest lookahead is 960 samples (10 ms at 96 kHz).
// - Attack is the whole way from the floor to unity. Curve 0 is a straight
//   line (its 10 to 90 % time is 0.8 of Attack); Curve 1 is an exponential
//   that stays low and arrives late, the way a volume pedal is rocked.
// - A note is "input above Sensitivity". Once the input has stayed 6 dB under
//   that for 25 ms the gain falls back to the floor over Release, re-armed.
// - Retrigger "On new notes" also restarts the swell when the level jumps
//   while a note is still sounding (a fast envelope against a slow one, 3.5 dB
//   to fire and it must close to 1.2 dB before it can fire again). Beating
//   between two held notes can fire it; "Only after silence" is for that.
// - Wet and dry are the same signal at different gains, so Mix is a linear
//   crossfade: equal power would add 3 dB half way.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Swell : public kit::DeviceBase<swell::kNumParams> {
 public:
  // The fixed audio delay, as reported in device.json (latencySamples).
  static constexpr int kLatency = 960;

  void init(float sample_rate) {
    using namespace swell;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int c = 0; c < 2; ++c) line_[c].clear();
    fast_.reset();
    fast_.set(0.0001f, kFastReleaseSeconds, sr);
    slow_.reset();
    slow_.set_cutoff(1.0f / (kit::kTwoPi * kSlowSeconds), sr);
    floor_.set_time(kSmoothingSeconds, sr);
    curve_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    state_ = kClosed;
    position_ = 0.0f;
    opening_ = 0.0f;
    dive_from_ = 0.0f;
    dive_left_ = 0;
    dive_length_ = 1;
    below_ = 0;
    onset_armed_ = false;
    hold_samples_ = static_cast<int>(kHoldSeconds * sr);
    min_dive_samples_ = static_cast<int>(kMinDiveSeconds * sr);
    // Hold, the longest Release and the delay all pass with nothing to hear;
    // sleeping only after them means the ramp is always back at the floor.
    idle_.reset(sr, kParamMax[kRelease] * 0.001f + 0.2f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    using namespace swell;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    const float sr = sample_rate();
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      const float delayed[2] = {line_[0].read(kLatency), line_[1].read(kLatency)};
      const int tap = kLatency - lookahead_samples_;
      const float seen_left = tap > 0 ? line_[0].read(tap) : in[0];
      const float seen_right = tap > 0 ? line_[1].read(tap) : in[1];
      line_[0].write(in[0]);
      line_[1].write(in[1]);

      const float level = kit::max(std::fabs(seen_left), std::fabs(seen_right));
      step_detector(level, sr);

      const float curve = curve_.next();
      const float floor = floor_.next();
      if (state_ != kDiving) opening_ = shape(position_, curve);
      const float gain = floor + (1.0f - floor) * opening_;
      const float mix = mix_.next();
      const float applied = 1.0f - mix + mix * gain;
      out_left_[i] = delayed[0] * applied;
      out_right_[i] = delayed[1] * applied;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  enum State : int { kClosed = 0, kDiving, kRising, kOpen, kFalling };

  static constexpr float kFastReleaseSeconds = 0.05f;
  static constexpr float kSlowSeconds = 0.06f;
  static constexpr float kHoldSeconds = 0.025f;
  static constexpr float kMinDiveSeconds = 0.002f;
  static constexpr float kOnsetRatio = 1.5f;
  static constexpr float kRearmRatio = 1.15f;
  static constexpr float kHysteresis = 0.5f;  // -6 dB
  static constexpr float kExpSteepness = 5.0f;

  // The rise as a function of ramp position: a line, an exponential, or
  // between the two.
  static float shape(float position, float curve) {
    if (position <= 0.0f) return 0.0f;
    if (position >= 1.0f) return 1.0f;
    if (curve <= 0.0f) return position;
    const float exponential =
        (std::exp(kExpSteepness * position) - 1.0f) * (1.0f / 147.4131591f);  // e^5 - 1
    return kit::lerp(position, exponential, curve);
  }

  void trigger() {
    // Reach the floor exactly when the note reaches the gain stage. From the
    // floor with no lookahead there is nothing to wait for.
    int samples = lookahead_samples_;
    if (opening_ > 0.0f && samples < min_dive_samples_) samples = min_dive_samples_;
    onset_armed_ = false;
    below_ = 0;
    position_ = 0.0f;
    if (samples <= 0) {
      state_ = kRising;
      return;
    }
    dive_left_ = samples;
    dive_length_ = samples;
    dive_from_ = opening_;
    state_ = kDiving;
  }

  void step_detector(float level, float sr) {
    using namespace swell;
    const float fast = fast_.process(level);
    const float slow = slow_.lowpass(fast);
    if (fast < kRearmRatio * slow) onset_armed_ = true;
    const bool above = level > threshold_;
    if (level > threshold_ * kHysteresis) {
      below_ = 0;
    } else if (below_ < hold_samples_) {
      ++below_;
    }

    switch (state_) {
      case kClosed:
        if (above) trigger();
        break;
      case kDiving: {
        // An S-curve down from wherever the gain was, whatever Curve is.
        --dive_left_;
        const float t = static_cast<float>(dive_left_) / static_cast<float>(dive_length_);
        opening_ = dive_from_ * t * t * (3.0f - 2.0f * t);
        if (dive_left_ <= 0) state_ = kRising;
        break;
      }
      case kRising:
      case kOpen:
        if (below_ >= hold_samples_) {
          state_ = kFalling;
          break;
        }
        if (retrigger_on_notes_ && onset_armed_ && above && fast > kOnsetRatio * slow) {
          trigger();
          break;
        }
        if (state_ == kRising) {
          position_ += 1.0f / (param(kAttack) * 0.001f * sr);
          if (position_ >= 1.0f) {
            position_ = 1.0f;
            state_ = kOpen;
          }
        }
        break;
      case kFalling:
        if (above) {
          trigger();
          break;
        }
        position_ -= 1.0f / (param(kRelease) * 0.001f * sr);
        if (position_ <= 0.0f) {
          position_ = 0.0f;
          state_ = kClosed;
        }
        break;
    }
  }

  void apply(int id) {
    using namespace swell;
    const float value = param(id);
    switch (id) {
      case kSensitivity:
        threshold_ = kit::db_to_gain(value);
        break;
      case kDepth: {
        // 0.5 is -12 dB, 0.9 is -40 dB, 1 is silence.
        const float open = 1.0f - value;
        floor_.set(open * open, primed());
        break;
      }
      case kCurve:
        curve_.set(value, primed());
        break;
      case kRetrigger:
        retrigger_on_notes_ = value < 0.5f;
        break;
      case kLookahead:
        lookahead_samples_ =
            kit::clamp_int(static_cast<int>(value * 0.001f * sample_rate() + 0.5f), 0, kLatency);
        break;
      case kMix:
        mix_.set(value, primed());
        break;
      default:
        break;  // Attack and Release are read as the ramp moves
    }
  }

  kit::DelayLine<1024> line_[2];
  kit::Follower fast_;
  kit::OnePole slow_;
  kit::Smoother floor_, curve_, mix_;
  kit::IdleGate idle_;
  int state_ = kClosed;
  float position_ = 0.0f;  // along the ramp, 0 at the floor and 1 at unity
  float opening_ = 0.0f;   // the shaped ramp: the gain's share of floor to unity
  float dive_from_ = 0.0f;
  int dive_left_ = 0;
  int dive_length_ = 1;
  int below_ = 0;
  int hold_samples_ = 1200;
  int min_dive_samples_ = 96;
  int lookahead_samples_ = 0;
  float threshold_ = 0.01f;
  bool retrigger_on_notes_ = true;
  bool onset_armed_ = false;
};

}  // namespace livemix
