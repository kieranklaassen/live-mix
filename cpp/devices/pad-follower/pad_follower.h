#pragma once

// Pad Follower: grows a string-section pad out of whatever is played.
//
//   in ─┬───────────────────────────────────────────────────────────► dry ─┐
//       │                                                                  ├─► out
//       └─► mono ─► ↓2 (↓4 above 80 kHz) ─► follower bank ─► 8 register    │
//             buses ─► drift and pan ─► ensemble ─► tone ─► width ─► ↑ ─► wet
//
// - The bank (follower_bank.h) splits the input into 64 narrow bands and
//   gives each one sine oscillator that takes its pitch from the band's phase
//   and its level from the band's envelope through a slow follower, so the
//   pad plays the harmony that was played, without its attacks, and holds
//   its pitch while it fades. Octaves adds the same oscillators an octave up
//   or down.
// - The bands are dealt in turn to eight register buses. Each bus sits at
//   its own place across the stereo field and Movement lets its level and
//   place drift slowly, so a held chord shimmers.
// - The ensemble (section_chorus.h) is three modulated taps per side.
// - Brightness and Low Cut shape the pad only; below 180 Hz the pad is mono.
// - The pad is synthesised at a quarter or half of the host rate (it has
//   nothing above 10 kHz) and brought back up by the kit's half-band filter.
//   The dry signal never leaves the host rate and is not delayed.

#include "../../kit/kit.h"
#include "follower_bank.h"
#include "params.gen.h"
#include "section_chorus.h"

namespace livemix {

class PadFollower : public kit::DeviceBase<pad_follower::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace pad_follower;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    factor_ = sr < 40000.0f ? 1 : (sr < 80000.0f ? 2 : 4);
    rate_ = sr / static_cast<float>(factor_);
    for (int stage = 0; stage < 2; ++stage) {
      for (int c = 0; c < 2; ++c) half_[stage][c].init();
    }
    for (int k = 0; k < 4; ++k) hold_[k] = pending_[0][k] = pending_[1][k] = 0.0f;
    phase_ = 0;
    mix_now_ = -1.0f;
    bank_.prepare(rate_);
    chorus_.prepare(rate_);
    for (int c = 0; c < 2; ++c) {
      bright_[c].reset();
      low_cut_[c].reset();
    }
    side_bass_.reset();
    side_bass_.set_cutoff(kMonoBelowHz, rate_);
    for (int g = 0; g < kGroups; ++g) {
      level_drift_[g].seed(0x6D2B79F5u + 0x9E3779B9u * static_cast<uint32_t>(g));
      level_drift_[g].set_rate(0.11f + 0.023f * static_cast<float>(g), rate_);
      pan_drift_[g].seed(0x1B873593u + 0x85EBCA6Bu * static_cast<uint32_t>(g));
      pan_drift_[g].set_rate(0.07f + 0.017f * static_cast<float>((g * 5) % kGroups), rate_);
      gain_left_[g] = gain_right_[g] = kit::kSqrtHalf;
    }
    clock_.reset(FollowerBank::kTick);
    const float slow = 0.03f;
    ensemble_.set_time(kSmoothingSeconds, rate_);
    width_.set_time(kSmoothingSeconds, rate_);
    mix_.set_time(kSmoothingSeconds, sr);
    movement_.set_time(slow, rate_ / FollowerBank::kTick);
    bright_hz_.set_time(slow, rate_ / FollowerBank::kTick);
    low_cut_hz_.set_time(slow, rate_ / FollowerBank::kTick);
    // The only silent gap is the chorus and the rate converters: 25 ms.
    idle_.reset(sr, 0.2f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    update_tone();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float left, right;
      take_input(i, &left, &right);
      float wet_left, wet_right;
      float mono = 0.5f * (left + right);
      // A NaN or a wild value must not get into the resonators: it would never leave.
      if (!(mono > -64.0f && mono < 64.0f)) mono = 0.0f;
      push(mono, &wet_left, &wet_right);
      // Equal power: the pad is a new voice, not a copy of the input. From
      // the table so that Mix 0 is exactly the input.
      const float mix = mix_.next();
      if (mix != mix_now_) {
        mix_now_ = mix;
        dry_gain_ = kit::SineTable::cos_lookup(0.25f * mix);
        wet_gain_ = kit::SineTable::lookup(0.25f * mix);
      }
      out_left_[i] = left * dry_gain_ + wet_left * wet_gain_;
      out_right_[i] = right * dry_gain_ + wet_right * wet_gain_;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kGroups = pad_follower::FollowerBank::kGroups;
  static constexpr float kMonoBelowHz = 180.0f;
  // Where each register bus sits (-1 left, 1 right): neighbours in pitch on
  // opposite sides, so no register leans the image one way.
  static constexpr float kSeat[kGroups] = {-0.55f, 0.4f, -0.2f, 0.7f, -0.7f, 0.2f, -0.4f, 0.55f};
  // Full Movement: each bus drifts between 6 dB down and 3 dB up in level
  // (more down than up, so that a single held note cannot swell far past
  // its own level) and ±0.4 in position.
  static constexpr float kLevelDrift = 0.75f;
  static constexpr float kLevelRest = 0.25f;
  static constexpr float kSeatDrift = 0.4f;

  // One host-rate sample in, one stereo pad sample out, with the bank and
  // everything after it running on every `factor_`-th sample.
  void push(float x, float* wet_left, float* wet_right) {
    if (factor_ == 1) {
      core(x, wet_left, wet_right);
      return;
    }
    hold_[phase_] = x;
    if (phase_ == factor_ - 1) {
      float low;
      if (factor_ == 2) {
        low = half_[0][0].down(hold_[0], hold_[1]);
      } else {
        const float a = half_[0][0].down(hold_[0], hold_[1]);
        const float b = half_[0][0].down(hold_[2], hold_[3]);
        low = half_[1][0].down(a, b);
      }
      float pad[2];
      core(low, &pad[0], &pad[1]);
      for (int c = 0; c < 2; ++c) {
        if (factor_ == 2) {
          half_[0][c].up(pad[c], &pending_[c][0], &pending_[c][1]);
        } else {
          float a, b;
          half_[1][c].up(pad[c], &a, &b);
          half_[0][c].up(a, &pending_[c][0], &pending_[c][1]);
          half_[0][c].up(b, &pending_[c][2], &pending_[c][3]);
        }
      }
    }
    phase_ = phase_ + 1 >= factor_ ? 0 : phase_ + 1;
    *wet_left = pending_[0][phase_];
    *wet_right = pending_[1][phase_];
  }

  // One sample at the internal rate.
  void core(float x, float* left, float* right) {
    if (clock_.tick()) control();
    float buses[kGroups] = {};
    bank_.process(x, buses);
    float l = 0.0f, r = 0.0f;
    for (int g = 0; g < kGroups; ++g) {
      l += buses[g] * gain_left_[g];
      r += buses[g] * gain_right_[g];
    }
    chorus_.process(&l, &r, ensemble_.next());
    l = low_cut_[0].highpass(bright_[0].lowpass(l));
    r = low_cut_[1].highpass(bright_[1].lowpass(r));
    // Width scales the difference; its bass is always removed.
    const float mid = 0.5f * (l + r);
    const float side = side_bass_.highpass(0.5f * (l - r)) * width_.next();
    *left = mid + side;
    *right = mid - side;
  }

  // Every FollowerBank::kTick internal samples: seats, drift and tone.
  void control() {
    const int tick = pad_follower::FollowerBank::kTick;
    const float movement = movement_.next();
    for (int g = 0; g < kGroups; ++g) {
      const float swing = kLevelDrift * level_drift_[g].next(tick) - kLevelRest;
      const float level = std::exp2(movement * swing);
      const float seat =
          kit::clamp(kSeat[g] + movement * kSeatDrift * pan_drift_[g].next(tick), -1.0f, 1.0f);
      // Constant-power seat, scaled so the centre is unity on both sides.
      const float angle = (seat + 1.0f) * 0.125f;
      gain_left_[g] = level * kit::SineTable::cos_lookup(angle) * 1.41421356f;
      gain_right_[g] = level * kit::SineTable::lookup(angle) * 1.41421356f;
    }
    update_tone();
  }

  void update_tone() {
    const float bright = bright_hz_.next();
    const float low = low_cut_hz_.next();
    for (int c = 0; c < 2; ++c) {
      bright_[c].set(bright, 0.6f, rate_);
      low_cut_[c].set(low, 0.7071f, rate_);
    }
  }

  void apply(int id) {
    using namespace pad_follower;
    const float value = param(id);
    switch (id) {
      case kRise:
      case kFall:
        bank_.set_times(param(kRise), param(kFall));
        break;
      case kSensitivity:
        bank_.set_threshold(kit::db_to_gain(kit::lerp(kQuietestDb[0], kQuietestDb[1], value)));
        break;
      case kOctaves:
        bank_.set_octaves(value, primed());
        break;
      case kBrightness:
        bright_hz_.set(value, primed());
        break;
      case kEnsemble:
        ensemble_.set(value, primed());
        break;
      case kMovement:
        movement_.set(value, primed());
        break;
      case kLowCut:
        low_cut_hz_.set(value, primed());
        break;
      case kWidth:
        width_.set(value, primed());
        break;
      case kMix:
        mix_.set(value, primed());
        break;
      default:
        break;
    }
  }

  // The partial level at which the gate is half open, at Sensitivity 0 and 1.
  static constexpr float kQuietestDb[2] = {-36.0f, -84.0f};

  pad_follower::FollowerBank bank_;
  pad_follower::SectionChorus chorus_;
  kit::Halfband2x half_[2][2];
  kit::Svf bright_[2], low_cut_[2];
  kit::OnePole side_bass_;
  kit::Drift level_drift_[kGroups], pan_drift_[kGroups];
  kit::Smoother ensemble_, width_, mix_, movement_, bright_hz_, low_cut_hz_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float gain_left_[kGroups] = {}, gain_right_[kGroups] = {};
  float hold_[4] = {}, pending_[2][4] = {};
  float rate_ = 24000.0f;
  float mix_now_ = -1.0f, dry_gain_ = 1.0f, wet_gain_ = 0.0f;
  int factor_ = 2;
  int phase_ = 0;
};

}  // namespace livemix
