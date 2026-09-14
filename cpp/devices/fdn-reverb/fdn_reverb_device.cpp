#include "fdn_reverb_device.h"

#include <cmath>

namespace livemix {

void FdnReverbDevice::init(float sample_rate) {
  primed_ = false;
  mix_.set_time(kSmoothingSeconds, sample_rate);
  mix_.snap(kDefaultMix);
  for (int i = 0; i < kMaxBlockFrames; ++i) {
    in_left_[i] = 0.0f;
    in_right_[i] = 0.0f;
    out_left_[i] = 0.0f;
    out_right_[i] = 0.0f;
  }
  reverb_.init(sample_rate);
}

void FdnReverbDevice::set_param(FdnReverbParam param, float value) {
  switch (param) {
    case FdnReverbParam::kMix:
      if (primed_) {
        mix_.set_target(clamp01(value));
      } else {
        mix_.snap(clamp01(value));
      }
      break;
    case FdnReverbParam::kDecay:
      reverb_.set_decay(value);
      break;
    case FdnReverbParam::kDamping:
      reverb_.set_damping(value);
      break;
    case FdnReverbParam::kPredelayMs:
      reverb_.set_predelay_ms(value);
      break;
    case FdnReverbParam::kSize:
      reverb_.set_size(value);
      break;
    case FdnReverbParam::kBreathRate:
      reverb_.set_breath_rate(value);
      break;
    case FdnReverbParam::kBreathDepth:
      reverb_.set_breath_depth(value);
      break;
  }
}

void FdnReverbDevice::process(int frames) {
  if (frames > kMaxBlockFrames) frames = kMaxBlockFrames;
  primed_ = true;

  for (int i = 0; i < frames; ++i) {
    const float dry_left = in_left_[i];
    const float dry_right = in_right_[i];
    // Consumed once: the host writes the next block from scratch.
    in_left_[i] = 0.0f;
    in_right_[i] = 0.0f;

    float wet_left = 0.0f;
    float wet_right = 0.0f;
    reverb_.process((dry_left + dry_right) * 0.5f, &wet_left, &wet_right);

    const float mix_angle = mix_.next() * kHalfPi;
    const float dry_gain = std::cos(mix_angle);
    const float wet_gain = std::sin(mix_angle);

    out_left_[i] = dry_left * dry_gain + wet_left * wet_gain;
    out_right_[i] = dry_right * dry_gain + wet_right * wet_gain;
  }
}

}  // namespace livemix
