#pragma once

#include "../../kit/idle.h"
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
//
// Sleep: the network's denormal guard takes a dying tail to exact zero. Once
// the network itself (before Mix, which can be 0 over a ringing network) has
// put out nothing but zeros for kIdleHoldSeconds with nothing coming in, the
// lines are empty and process() only clears its output and turns the line
// modulators and the breath: the next sound meets exactly what it would have
// met. A parameter that is set wakes the device for one hold (far longer
// than the 5 ms smoothing), so every smoothed value has landed before it
// sleeps again.
class FdnReverbDevice {
 public:
  static constexpr int kMaxBlockFrames = 2048;
  static constexpr float kDefaultMix = 0.5f;
  // The network is never silent for longer than this with sound still inside
  // it (the pre-delay, 250 ms at most, the input diffusion, 20 ms, and the
  // shortest line at Size 2, 218 ms), and by the end of it every buffer has
  // been written over with zeros: the lines, the longest, are 1.49 s at
  // 44.1 kHz.
  static constexpr float kIdleHoldSeconds = 2.0f;

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
  // Test hook: true while process() only clears the output.
  bool asleep() const { return idle_.asleep(); }

 private:
  static constexpr float kHalfPi = 1.57079632679489661923f;
  static constexpr float kSmoothingSeconds = 0.005f;

  FdnReverb::Smoother mix_;
  bool primed_ = false;
  FdnReverb reverb_;
  kit::IdleGate idle_;

  float in_left_[kMaxBlockFrames] = {};
  float in_right_[kMaxBlockFrames] = {};
  float out_left_[kMaxBlockFrames] = {};
  float out_right_[kMaxBlockFrames] = {};
};

}  // namespace livemix
