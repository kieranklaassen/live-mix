#pragma once

#include <cmath>

#include "../../common/dsp_util.h"
#include "SpectralDrifter.h"

namespace livemix {

// Parameter ids shared with src/dsp/devices/spectral-drifter.ts. Keep in sync.
enum class SpectralDrifterParam : int {
  kMix = 0,        // 0..1   equal-power dry/wet, default 0.5
  kBloom = 1,      // 0..1   drift intensity (Bloom's "Bloom" knob), default 0.5
  kDirection = 2,  // 0 Up, 1 Down, 2 Scatter; default 0
  kSeason = 3,     // 0 Spring, 1 Summer, 2 Autumn, 3 Winter; default 0
  kSeed = 4,       // 0 Fundamental, 1 Odd, 2 Even; default 0
  kInterval = 5,   // 0 Fifth, 1 Octave, 2 Fifth+Octave, 3 Atonal; default 1
  kDecay = 6,      // 1..30  s, the age ceiling is 2 x decay (Bloom's maxAge), default 5
  kAgeMode = 7,    // 0 auto (Bloom's activity tracker on the input), 1 manual (kAge); default 0
  kAge = 8,        // 0..1   normalised age used when kAgeMode is manual, default 1
};

// Bloom's SpectralDrifter as a stereo insert: one drifter per channel (Bloom
// runs drifterL on the even FDN taps and drifterR on the odd ones), wet mixed
// with the dry input by Bloom's equal-power law `dry*cos(mix*pi/2) +
// wet*sin(mix*pi/2)` (PluginProcessor.cpp:399-403, without the FDN's -9 dB
// wet headroom). `bloom` is ramped over 5 ms per sample like Bloom's
// juce::SmoothedValue.
//
// Age. Bloom derives `ageNormalized` from how long each FDN line has carried
// signal (PluginProcessor.cpp:323-333, 336-343): while |x| > 1e-4 the age
// grows by one sample up to `maxAge = 2 * decay` seconds, otherwise it decays
// by 0.9999^(44100/fs) per sample; the drifter receives age / maxAge. Standing
// alone the device runs that exact tracker on each input channel (`ageMode`
// 0), so a reverb tail fed into it drifts more the longer it rings. `ageMode`
// 1 bypasses the tracker and uses `age` directly, for hosts that want to
// automate or modulate the drift (a breath phase, an envelope).
//
// Not reproduced: Bloom feeds 25 % of the drifted signal back into its FDN so
// the shift compounds per recirculation; an insert has no loop to feed.
// Statically allocated; process() is allocation-free.
class SpectralDrifterDevice {
 public:
  static constexpr int kMaxBlockFrames = 2048;
  static constexpr float kDefaultMix = 0.5f;
  static constexpr float kDefaultBloom = 0.5f;
  static constexpr float kMinDecaySeconds = 1.0f;
  static constexpr float kMaxDecaySeconds = 30.0f;
  static constexpr float kDefaultDecaySeconds = 5.0f;
  static constexpr float kDefaultAge = 1.0f;
  static constexpr float kAgeActivityThreshold = 0.0001f;  // Bloom :324
  static constexpr float kAgeDecayPerSampleAt44k = 0.9999f;  // Bloom :133

  // Replacement for juce::SmoothedValue: exponential approach that settles to
  // within 1 % of the target after `seconds`. Values set before the first
  // process() call snap so construction-time params take effect immediately.
  struct Smoother {
    float current = 0.0f;
    float target = 0.0f;
    float coefficient = 0.0f;

    void set_time(float seconds, float sample_rate) {
      coefficient = std::exp(-4.605170186f / (seconds * sample_rate));
    }
    void snap(float value) { current = target = value; }
    void set_target(float value) { target = value; }
    float next() {
      current = target + flush_denormal((current - target) * coefficient);
      return current;
    }
  };

  void init(float sample_rate);
  void set_param(SpectralDrifterParam param, float value);

  float mix() const { return mix_.target; }
  float bloom() const { return bloom_.target; }
  float decay_seconds() const { return decay_seconds_; }
  bool manual_age() const { return manual_age_; }
  // Current normalised age per channel (0..1), whichever mode produced it.
  float age_left() const { return age_normalized_[0]; }
  float age_right() const { return age_normalized_[1]; }

  // Write up to kMaxBlockFrames of input here before each process() call;
  // process() consumes and clears it.
  float* in_left() { return in_left_; }
  float* in_right() { return in_right_; }

  void process(int frames);

  const float* out_left() const { return out_left_; }
  const float* out_right() const { return out_right_; }

  SpectralDrifter& drifter_left() { return drifters_[0]; }
  SpectralDrifter& drifter_right() { return drifters_[1]; }

 private:
  static constexpr float kHalfPi = 1.57079632679489661923f;
  static constexpr float kSmoothingSeconds = 0.005f;

  static int choice(float value, int count);
  float track_age(int channel, float sample);

  float sample_rate_ = 48000.0f;
  float inverse_sample_rate_ = 1.0f / 48000.0f;
  float age_decay_rate_ = kAgeDecayPerSampleAt44k;
  bool primed_ = false;

  Smoother mix_;
  Smoother bloom_;
  float decay_seconds_ = kDefaultDecaySeconds;
  bool manual_age_ = false;
  float manual_age_value_ = kDefaultAge;

  float age_seconds_[2] = {};
  float age_normalized_[2] = {};

  SpectralDrifter drifters_[2];

  float in_left_[kMaxBlockFrames] = {};
  float in_right_[kMaxBlockFrames] = {};
  float out_left_[kMaxBlockFrames] = {};
  float out_right_[kMaxBlockFrames] = {};
};

}  // namespace livemix
