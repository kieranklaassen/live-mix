#include "dattorro_device.h"

namespace livemix {

void DattorroDevice::init(float sample_rate) {
  mix_ = kDefaultMix;
  for (int i = 0; i < kMaxBlockFrames; ++i) {
    in_left_[i] = 0.0f;
    in_right_[i] = 0.0f;
    out_left_[i] = 0.0f;
    out_right_[i] = 0.0f;
  }
  reverb_.init(sample_rate);
}

void DattorroDevice::set_param(DattorroParam param, float value) {
  switch (param) {
    case DattorroParam::kMix:
      mix_ = clamp01(value);
      break;
    case DattorroParam::kDecay:
      reverb_.set_decay(value);
      break;
    case DattorroParam::kDamping:
      reverb_.set_damping(value);
      break;
    case DattorroParam::kPredelayMs:
      reverb_.set_predelay_ms(value);
      break;
  }
}

void DattorroDevice::process(int frames) {
  if (frames > kMaxBlockFrames) frames = kMaxBlockFrames;
  const float dry_gain = 1.0f - mix_;

  for (int i = 0; i < frames; ++i) {
    const float dry_left = in_left_[i];
    const float dry_right = in_right_[i];
    // Consumed once: the host writes the next block from scratch.
    in_left_[i] = 0.0f;
    in_right_[i] = 0.0f;

    float wet_left = 0.0f;
    float wet_right = 0.0f;
    reverb_.process((dry_left + dry_right) * 0.5f, &wet_left, &wet_right);

    out_left_[i] = dry_left * dry_gain + wet_left * mix_;
    out_right_[i] = dry_right * dry_gain + wet_right * mix_;
  }
}

}  // namespace livemix
