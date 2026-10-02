#pragma once

#include "math.h"

namespace livemix {
namespace kit {

// Exponential ADSR for slow material. The attack aims above the peak and is
// clipped so it arrives in the set time; decay and release cover 60 dB of
// their travel in the set time. Times up to tens of seconds are the point:
// ambient pads spend most of their life in attack and release.
class Adsr {
 public:
  enum Stage : int { kIdle = 0, kAttack, kDecay, kSustain, kRelease };

  void set_sample_rate(float sample_rate) {
    sample_rate_ = sample_rate;
    recompute();
  }

  void set(float attack_s, float decay_s, float sustain, float release_s) {
    if (attack_s == attack_ && decay_s == decay_ && sustain == sustain_ && release_s == release_) {
      return;
    }
    attack_ = attack_s;
    decay_ = decay_s;
    sustain_ = clamp(sustain, 0.0f, 1.0f);
    release_ = release_s;
    recompute();
  }

  // A new note releases at the set time, whatever happened to the last one:
  // a fast release cut short by the next note does not carry over.
  void gate_on() {
    stage_ = kAttack;
    use_fast_ = false;
  }
  void gate_off() {
    if (stage_ != kIdle) stage_ = kRelease;
  }
  void reset() {
    stage_ = kIdle;
    level_ = 0.0f;
    use_fast_ = false;
  }
  // A release that completes in `seconds` regardless of the set time (steals).
  void fast_release(float seconds) {
    if (stage_ == kIdle) return;
    stage_ = kRelease;
    fast_coeff_ = std::exp(-kSixtyDb / max(1.0f, seconds * sample_rate_));
    use_fast_ = true;
  }

  float next() {
    switch (stage_) {
      case kIdle:
        return 0.0f;
      case kAttack:
        level_ += attack_rate_ * (kAttackTarget - level_);
        if (level_ >= 1.0f) {
          level_ = 1.0f;
          stage_ = kDecay;
        }
        return level_;
      case kDecay:
        level_ = sustain_ + (level_ - sustain_) * decay_coeff_;
        if (level_ - sustain_ < kIdleLevel) {
          level_ = sustain_;
          stage_ = kSustain;
        }
        return level_;
      case kSustain:
        level_ = sustain_;
        if (sustain_ <= 0.0f) stage_ = kIdle;
        return level_;
      case kRelease:
        level_ *= use_fast_ ? fast_coeff_ : release_coeff_;
        if (level_ < kIdleLevel) {
          level_ = 0.0f;
          stage_ = kIdle;
          use_fast_ = false;
        }
        return level_;
    }
    return 0.0f;
  }

  bool active() const { return stage_ != kIdle; }
  bool releasing() const { return stage_ == kRelease; }
  int stage() const { return stage_; }
  float level() const { return level_; }

 private:
  static constexpr float kAttackTarget = 1.3f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kIdleLevel = 1.0e-5f;

  void recompute() {
    const float attack_samples = max(1.0f, attack_ * sample_rate_);
    attack_rate_ = 1.0f - std::exp(std::log((kAttackTarget - 1.0f) / kAttackTarget) / attack_samples);
    decay_coeff_ = std::exp(-kSixtyDb / max(1.0f, decay_ * sample_rate_));
    release_coeff_ = std::exp(-kSixtyDb / max(1.0f, release_ * sample_rate_));
  }

  float sample_rate_ = 48000.0f;
  float attack_ = 0.01f, decay_ = 0.1f, sustain_ = 1.0f, release_ = 0.1f;
  float attack_rate_ = 0.01f, decay_coeff_ = 0.999f, release_coeff_ = 0.999f;
  float fast_coeff_ = 0.99f;
  bool use_fast_ = false;
  int stage_ = kIdle;
  float level_ = 0.0f;
};

// Peak envelope follower with separate attack and release times.
struct Follower {
  float level = 0.0f;
  float attack = 0.0f;
  float release = 0.0f;

  void set(float attack_s, float release_s, float sample_rate) {
    attack = time_to_coeff(attack_s, sample_rate);
    release = time_to_coeff(release_s, sample_rate);
  }
  void reset() { level = 0.0f; }
  float process(float x) {
    const float magnitude = x < 0.0f ? -x : x;
    const float coeff = magnitude > level ? attack : release;
    level = flush_denormal(magnitude + (level - magnitude) * coeff);
    return level;
  }
};

}  // namespace kit
}  // namespace livemix
