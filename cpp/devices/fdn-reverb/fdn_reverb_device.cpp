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
  idle_.reset(sample_rate, kIdleHoldSeconds);
  // Awake to begin with: the first block primes the smoothers, here and in
  // the network, whether or not it carries sound.
  idle_.wake(true);
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
  // Asleep nothing advances the smoothers: stay up until this has landed.
  idle_.wake(true);
}

void FdnReverbDevice::process(int frames) {
  if (frames > kMaxBlockFrames) frames = kMaxBlockFrames;
  if (!idle_.wake(block_present(in_left_, in_right_, frames))) {
    reverb_.advance_modulators(frames);
    for (int i = 0; i < frames; ++i) {
      out_left_[i] = 0.0f;
      out_right_[i] = 0.0f;
    }
    return;
  }
  primed_ = true;
  bool ringing = false;

  for (int i = 0; i < frames; ++i) {
    const float dry_left = in_left_[i];
    const float dry_right = in_right_[i];
    // Consumed once: the host writes the next block from scratch.
    in_left_[i] = 0.0f;
    in_right_[i] = 0.0f;

    float wet_left = 0.0f;
    float wet_right = 0.0f;
    reverb_.process((dry_left + dry_right) * 0.5f, &wet_left, &wet_right);
    if (wet_left != 0.0f || wet_right != 0.0f) ringing = true;

    const float mix_angle = mix_.next() * kHalfPi;
    const float dry_gain = std::cos(mix_angle);
    const float wet_gain = std::sin(mix_angle);

    out_left_[i] = dry_left * dry_gain + wet_left * wet_gain;
    out_right_[i] = dry_right * dry_gain + wet_right * wet_gain;
  }
  // Exact silence, not the gate's floor: only then are the lines empty.
  idle_.settle(ringing ? 1.0f : 0.0f, frames);
}

}  // namespace livemix
