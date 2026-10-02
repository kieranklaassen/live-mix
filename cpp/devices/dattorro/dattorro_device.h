#pragma once

#include "../../kit/idle.h"
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
//
// Sleep: the plate's denormal guard takes a dying tail to exact zero. Once
// the plate itself (before Mix, which can be 0 over a ringing tank) has put
// out nothing but zeros for kIdleHoldSeconds with nothing coming in, the
// tank is empty and process() only clears its output and turns the two
// modulators: the next sound meets exactly what it would have met.
class DattorroDevice {
 public:
  static constexpr int kMaxBlockFrames = 2048;
  static constexpr float kDefaultMix = 0.35f;
  // The plate is never silent for longer than this with sound still inside
  // it (the pre-delay, 250 ms at most, then 12 ms to the first output tap),
  // and by the end of it every buffer has been written over with zeros: the
  // longest, the pre-delay line, is 0.74 s at 44.1 kHz.
  static constexpr float kIdleHoldSeconds = 1.0f;

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
  // Test hook: true while process() only clears the output.
  bool asleep() const { return idle_.asleep(); }

 private:
  float mix_ = kDefaultMix;
  DattorroReverb reverb_;
  kit::IdleGate idle_;

  float in_left_[kMaxBlockFrames] = {};
  float in_right_[kMaxBlockFrames] = {};
  float out_left_[kMaxBlockFrames] = {};
  float out_right_[kMaxBlockFrames] = {};
};

}  // namespace livemix
