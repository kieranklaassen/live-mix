#pragma once

#include "../../kit/idle.h"
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
//
// Sleep: with no input, the limiter settled (its release and its gains at
// rest) and the output silent for kIdleHoldSeconds, process() only clears its
// output. By then the lookahead holds zeros and the attack window one gain,
// which is all silence would ever leave there: the next sound is limited
// exactly as if the limiter had kept running.
class TruePeakLimiterDevice {
 public:
  static constexpr int kMaxBlockFrames = 2048;

  static constexpr float kMinCeilingDb = -20.0f;
  static constexpr float kMaxCeilingDb = 0.0f;
  static constexpr float kMinReleaseMs = 10.0f;
  static constexpr float kMaxReleaseMs = 2000.0f;
  static constexpr float kMinInputGainDb = -24.0f;
  static constexpr float kMaxInputGainDb = 24.0f;
  // The delay, the sliding minimum and the box each span the 1.5 ms
  // lookahead; all three have to run out, with room to spare.
  static constexpr float kIdleHoldSeconds = 0.05f;

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
  // Test hook: true while process() only clears the output.
  bool asleep() const { return idle_.asleep(); }

 private:
  TruePeakLimiter limiter_;
  kit::IdleGate idle_;

  float in_left_[kMaxBlockFrames] = {};
  float in_right_[kMaxBlockFrames] = {};
  float out_left_[kMaxBlockFrames] = {};
  float out_right_[kMaxBlockFrames] = {};
};

}  // namespace livemix
