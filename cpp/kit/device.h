#pragma once

#include <cmath>

namespace livemix {
namespace kit {

// What every generated device shares: the stereo bus the ABI exposes
// (cpp/common/device_api.h) and a clamped parameter store filled from the
// tables scripts/gen-devices.mjs writes into params.gen.h.
//
//   class EchoDevice : public kit::DeviceBase<echo::kNumParams> {
//    public:
//     void init(float sample_rate);          // call init_base(...) first
//     void set_param(int id, float value);   // call store_param(id, value)
//     void process(int frames);              // call begin_block(frames)
//   };
//
// Inputs are consumed once: process() must zero what it read (take_input
// does), so a block the host did not write is silence, not a repeat.
template <int NumParams>
class DeviceBase {
 public:
  static constexpr int kMaxBlockFrames = 2048;
  static constexpr float kSmoothingSeconds = 0.005f;

  float* in_left() { return in_left_; }
  float* in_right() { return in_right_; }
  const float* out_left() const { return out_left_; }
  const float* out_right() const { return out_right_; }

  float sample_rate() const { return sample_rate_; }
  float param(int id) const { return params_[id]; }
  // False until the first process(): parameters set before then snap.
  bool primed() const { return primed_; }

 protected:
  void init_base(float sample_rate, const float* mins, const float* maxs, const float* defaults) {
    sample_rate_ = sample_rate > 1.0f ? sample_rate : 48000.0f;
    mins_ = mins;
    maxs_ = maxs;
    defaults_ = defaults;
    primed_ = false;
    for (int i = 0; i < NumParams; ++i) params_[i] = defaults[i];
    for (int i = 0; i < kMaxBlockFrames; ++i) {
      in_left_[i] = 0.0f;
      in_right_[i] = 0.0f;
      out_left_[i] = 0.0f;
      out_right_[i] = 0.0f;
    }
  }

  // Clamp to the table's range (non-finite values become the default) and
  // store. False for an unknown id.
  bool store_param(int id, float value) {
    if (id < 0 || id >= NumParams) return false;
    if (std::isnan(value) || std::isinf(value)) value = defaults_[id];
    if (value < mins_[id]) value = mins_[id];
    if (value > maxs_[id]) value = maxs_[id];
    params_[id] = value;
    return true;
  }

  // Clamp the block length and mark the device primed.
  int begin_block(int frames) {
    primed_ = true;
    if (frames < 0) return 0;
    return frames > kMaxBlockFrames ? kMaxBlockFrames : frames;
  }

  // Read one input frame and clear it.
  void take_input(int i, float* left, float* right) {
    *left = in_left_[i];
    *right = in_right_[i];
    in_left_[i] = 0.0f;
    in_right_[i] = 0.0f;
  }

  void clear_input(int frames) {
    for (int i = 0; i < frames; ++i) {
      in_left_[i] = 0.0f;
      in_right_[i] = 0.0f;
    }
  }

  // The three below serve kit::IdleGate (idle.h).
  bool input_present(int frames) const {
    for (int i = 0; i < frames; ++i) {
      if (in_left_[i] != 0.0f || in_right_[i] != 0.0f) return true;
    }
    return false;
  }

  float output_peak(int frames) const {
    float peak = 0.0f;
    for (int i = 0; i < frames; ++i) {
      const float left = out_left_[i] < 0.0f ? -out_left_[i] : out_left_[i];
      const float right = out_right_[i] < 0.0f ? -out_right_[i] : out_right_[i];
      if (left > peak) peak = left;
      if (right > peak) peak = right;
    }
    return peak;
  }

  // Write a silent block (and consume the input, which is silent or unwanted).
  void silence_output(int frames) {
    for (int i = 0; i < frames; ++i) {
      in_left_[i] = 0.0f;
      in_right_[i] = 0.0f;
      out_left_[i] = 0.0f;
      out_right_[i] = 0.0f;
    }
  }

  float in_left_[kMaxBlockFrames] = {};
  float in_right_[kMaxBlockFrames] = {};
  float out_left_[kMaxBlockFrames] = {};
  float out_right_[kMaxBlockFrames] = {};

 private:
  float params_[NumParams] = {};
  const float* mins_ = nullptr;
  const float* maxs_ = nullptr;
  const float* defaults_ = nullptr;
  float sample_rate_ = 48000.0f;
  bool primed_ = false;
};

}  // namespace kit
}  // namespace livemix
