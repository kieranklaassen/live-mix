#pragma once

#include "dattorro_reverb.h"

namespace livemix {

// Parameter ids shared with src/dsp/devices/dattorro.ts. Keep in sync.
enum class DattorroParam : int {
  kMix = 0,         // 0..1  dry/wet, default 0.35
  kDecay = 1,       // 0..1  default 0.7
  kDamping = 2,     // 0..1  default 0.3 (0 = bright, 1 = dark)
  kPredelayMs = 3,  // 0..250 default 20
};

// Stereo in -> mono sum -> Dattorro plate -> stereo wet, mixed with the dry
// input as `dry*(1-mix) + wet*mix`. This is the exact signal law ambient-live's
// engine applied to its global reverb (engine.cpp), lifted out as a device so
// it can sit on any bus. Statically allocated; process() is allocation-free.
class DattorroDevice {
 public:
  static constexpr int kMaxBlockFrames = 2048;
  static constexpr float kDefaultMix = 0.35f;

  void init(float sample_rate);
  void set_param(DattorroParam param, float value);
  float mix() const { return mix_; }

  // Write up to kMaxBlockFrames of input here before each process() call;
  // process() consumes and clears it.
  float* in_left() { return in_left_; }
  float* in_right() { return in_right_; }

  void process(int frames);

  const float* out_left() const { return out_left_; }
  const float* out_right() const { return out_right_; }

  DattorroReverb& reverb() { return reverb_; }

 private:
  float mix_ = kDefaultMix;
  DattorroReverb reverb_;

  float in_left_[kMaxBlockFrames] = {};
  float in_right_[kMaxBlockFrames] = {};
  float out_left_[kMaxBlockFrames] = {};
  float out_right_[kMaxBlockFrames] = {};
};

}  // namespace livemix
