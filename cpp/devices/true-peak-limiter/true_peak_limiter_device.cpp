#include "true_peak_limiter_device.h"

#include <cmath>

namespace livemix {

namespace {

float clamp_or_default(float value, float min, float max, float fallback) {
  if (std::isnan(value)) return fallback;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

}  // namespace

void TruePeakLimiterDevice::init(float sample_rate) {
  for (int i = 0; i < kMaxBlockFrames; ++i) {
    in_left_[i] = 0.0f;
    in_right_[i] = 0.0f;
    out_left_[i] = 0.0f;
    out_right_[i] = 0.0f;
  }
  limiter_.setCeilingDb(TruePeakLimiter::kDefaultCeilingDb);
  limiter_.setReleaseMs(TruePeakLimiter::kDefaultReleaseMs);
  limiter_.setInputGainDb(TruePeakLimiter::kDefaultInputGainDb);
  limiter_.prepare(sample_rate);
}

void TruePeakLimiterDevice::set_param(TruePeakLimiterParam param, float value) {
  switch (param) {
    case TruePeakLimiterParam::kCeilingDb:
      limiter_.setCeilingDb(clamp_or_default(value, kMinCeilingDb, kMaxCeilingDb,
                                             TruePeakLimiter::kDefaultCeilingDb));
      break;
    case TruePeakLimiterParam::kReleaseMs:
      limiter_.setReleaseMs(clamp_or_default(value, kMinReleaseMs, kMaxReleaseMs,
                                             TruePeakLimiter::kDefaultReleaseMs));
      break;
    case TruePeakLimiterParam::kInputGainDb:
      limiter_.setInputGainDb(clamp_or_default(value, kMinInputGainDb, kMaxInputGainDb,
                                               TruePeakLimiter::kDefaultInputGainDb));
      break;
  }
}

float TruePeakLimiterDevice::param_value(TruePeakLimiterParam param) const {
  switch (param) {
    case TruePeakLimiterParam::kCeilingDb:
      return limiter_.ceilingDb();
    case TruePeakLimiterParam::kReleaseMs:
      return limiter_.releaseMs();
    case TruePeakLimiterParam::kInputGainDb:
      return limiter_.inputGainDb();
  }
  return 0.0f;
}

void TruePeakLimiterDevice::process(int frames) {
  if (frames > kMaxBlockFrames) frames = kMaxBlockFrames;
  for (int i = 0; i < frames; ++i) {
    float left = in_left_[i];
    float right = in_right_[i];
    // Consumed once: the host writes the next block from scratch.
    in_left_[i] = 0.0f;
    in_right_[i] = 0.0f;
    limiter_.process(left, right);
    out_left_[i] = left;
    out_right_[i] = right;
  }
}

}  // namespace livemix
