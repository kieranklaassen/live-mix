#pragma once

#include "StereoWidener.h"

namespace livemix {

// Parameter ids shared with src/dsp/devices/stereo-widener.ts. Keep in sync.
enum class StereoWidenerParam : int {
  kWidth = 0,  // 0..1  0 = mono, 0.5 = normal stereo, 1 = super wide; default 0.5
};

// kkfonie's StereoWidener (Felt/Bloom/Sympathetic/Thesis, copied unchanged as
// StereoWidener.h/.cpp) behind the device ABI. Width arrives unsmoothed and is
// ramped here over 5 ms per sample, the way Bloom drives it with
// juce::SmoothedValue, so knob moves stay click-free. Statically allocated;
// process() is allocation-free.
class StereoWidenerDevice {
 public:
  static constexpr int kMaxBlockFrames = 2048;
  static constexpr float kDefaultWidth = 0.5f;
  static constexpr float kWidthRampSeconds = 0.005f;
  // After this much exact digital silence the widener's own reset() is called
  // once. Its bass one-pole lowpass has no denormal guard (the source is kept
  // identical to kkfonie), and multiplying a denormal by its 0.97 coefficient
  // rounds back to itself, so without this the state would sit at ~2.7e-44
  // forever and every block would run denormal-speed math. By 100 ms the
  // decayed state is far below that floor and every FIR buffer (512 samples)
  // holds only zeros, so the reset is exact apart from the denormal residue.
  static constexpr float kSilenceResetSeconds = 0.1f;
  static constexpr int kMinSilenceResetFrames = 1024;

  void init(float sample_rate);
  void set_param(StereoWidenerParam param, float value);
  float width() const { return target_width_; }

  // Write up to kMaxBlockFrames of input here before each process() call;
  // process() consumes and clears it.
  float* in_left() { return in_left_; }
  float* in_right() { return in_right_; }

  void process(int frames);

  const float* out_left() const { return out_left_; }
  const float* out_right() const { return out_right_; }

  StereoWidener& widener() { return widener_; }

 private:
  float target_width_ = kDefaultWidth;
  float current_width_ = kDefaultWidth;
  float width_step_ = 0.0f;
  int ramp_frames_ = 1;
  int ramp_remaining_ = 0;

  int silence_reset_frames_ = kMinSilenceResetFrames;
  int silent_frames_ = 0;

  StereoWidener widener_;

  float in_left_[kMaxBlockFrames] = {};
  float in_right_[kMaxBlockFrames] = {};
  float out_left_[kMaxBlockFrames] = {};
  float out_right_[kMaxBlockFrames] = {};
};

}  // namespace livemix
