#pragma once

#include "true_peak_limiter.h"

namespace livemix {

// Parameter ids shared with src/dsp/devices/true-peak-limiter.ts. Keep in sync.
enum class TruePeakLimiterParam : int {
  kCeilingDb = 0,    // -20..0 dBTP, default -1
  kReleaseMs = 1,    // 10..2000 ms, default 100
  kInputGainDb = 2,  // -24..24 dB, default 0
};

// The limiter behind the stereo bus contract every device shares
// (cpp/devices/stereo-widener/stereo_widener_device.h): fixed buffers, input
// consumed once, allocation-free process(). Parameters arrive unsmoothed over
// the message port and are clamped here; the limiter smooths gains itself.
class TruePeakLimiterDevice {
 public:
  static constexpr int kMaxBlockFrames = 2048;

  static constexpr float kMinCeilingDb = -20.0f;
  static constexpr float kMaxCeilingDb = 0.0f;
  static constexpr float kMinReleaseMs = 10.0f;
  static constexpr float kMaxReleaseMs = 2000.0f;
  static constexpr float kMinInputGainDb = -24.0f;
  static constexpr float kMaxInputGainDb = 24.0f;

  void init(float sample_rate);
  void set_param(TruePeakLimiterParam param, float value);
  float param_value(TruePeakLimiterParam param) const;

  // Write up to kMaxBlockFrames of input here before each process() call;
  // process() consumes and clears it.
  float* in_left() { return in_left_; }
  float* in_right() { return in_right_; }

  void process(int frames);

  const float* out_left() const { return out_left_; }
  const float* out_right() const { return out_right_; }

  TruePeakLimiter& limiter() { return limiter_; }
  const TruePeakLimiter& limiter() const { return limiter_; }

 private:
  TruePeakLimiter limiter_;

  float in_left_[kMaxBlockFrames] = {};
  float in_right_[kMaxBlockFrames] = {};
  float out_left_[kMaxBlockFrames] = {};
  float out_right_[kMaxBlockFrames] = {};
};

}  // namespace livemix
