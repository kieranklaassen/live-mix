#pragma once

#include "fdn_reverb.h"

namespace livemix {

// Parameter ids shared with src/dsp/devices/fdn-reverb.ts. Keep in sync.
enum class FdnReverbParam : int {
  kMix = 0,          // 0..1     equal-power dry/wet, default 0.5
  kDecay = 1,        // 0.1..20  RT60 seconds, default 5
  kDamping = 2,      // 0..1     default 0.4 (0 = bright, 1 = dark)
  kPredelayMs = 3,   // 0..250   default 0
  kSize = 4,         // 0.5..2   delay scale, default 1
  kBreathRate = 5,   // 0.05..2  Hz, default 0.3
  kBreathDepth = 6,  // 0..1     default 0.4
};

// Stereo in -> mono sum -> Tides FDN -> stereo wet, mixed with the dry input
// by Tides' equal-power law `dry*cos(mix*pi/2) + wet*sin(mix*pi/2)`
// (PluginProcessor.cpp:415-423). Statically allocated; process() is
// allocation-free.
class FdnReverbDevice {
 public:
  static constexpr int kMaxBlockFrames = 2048;
  static constexpr float kDefaultMix = 0.5f;

  void init(float sample_rate);
  void set_param(FdnReverbParam param, float value);
  float mix() const { return mix_.target; }

  // Write up to kMaxBlockFrames of input here before each process() call;
  // process() consumes and clears it.
  float* in_left() { return in_left_; }
  float* in_right() { return in_right_; }

  void process(int frames);

  const float* out_left() const { return out_left_; }
  const float* out_right() const { return out_right_; }

  FdnReverb& reverb() { return reverb_; }

 private:
  static constexpr float kHalfPi = 1.57079632679489661923f;
  static constexpr float kSmoothingSeconds = 0.005f;

  FdnReverb::Smoother mix_;
  bool primed_ = false;
  FdnReverb reverb_;

  float in_left_[kMaxBlockFrames] = {};
  float in_right_[kMaxBlockFrames] = {};
  float out_left_[kMaxBlockFrames] = {};
  float out_right_[kMaxBlockFrames] = {};
};

}  // namespace livemix
