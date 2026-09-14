#include "ether_reverb_device.h"

namespace livemix {

void EtherReverbDevice::init(float sample_rate) {
  sample_rate_ = sample_rate;
  primed_ = false;

  mix_ = kDefaultMix;
  decay_seconds_ = kDefaultDecaySeconds;
  damping_ = kDefaultDamping;
  predelay_ms_ = kDefaultPredelayMs;
  size_ = kDefaultSize;
  frozen_ = false;
  predelay_samples_ = 0.0f;

  dry_gain_.set_time(kSmoothingSeconds, sample_rate);
  wet_gain_.set_time(kSmoothingSeconds, sample_rate);
  dry_gain_.snap(1.0f - kDefaultMix);
  wet_gain_.snap(kDefaultMix);

  predelay_[0].clear();
  predelay_[1].clear();

  // juce::dsp::Reverb::prepare then Ether's first processBlock: the ramps snap
  // to whatever the parameters were when the rate was set, so set them first.
  reverb_.set_parameters(reverb_parameters_for(decay_seconds_, size_, damping_, frozen_));
  reverb_.set_sample_rate(sample_rate);
  reverb_.reset();

  for (int i = 0; i < kMaxBlockFrames; ++i) {
    in_left_[i] = 0.0f;
    in_right_[i] = 0.0f;
    out_left_[i] = 0.0f;
    out_right_[i] = 0.0f;
  }
}

Freeverb::Parameters EtherReverbDevice::reverb_parameters_for(float decay_seconds, float size,
                                                              float damping, bool frozen) {
  Freeverb::Parameters parameters;
  parameters.wet_level = 1.0f;  // Ether handles the mix itself
  parameters.dry_level = 0.0f;
  parameters.width = 1.0f;

  // juce::jmap(decay, 0.5, 30, 0, 1); roomSize and damping shift with it.
  const float decay_factor = (decay_seconds - 0.5f) / 29.5f;
  float room_size = size + decay_factor * 0.3f;
  if (room_size > 1.0f) room_size = 1.0f;
  float damp = damping - decay_factor * 0.2f;
  if (damp < 0.0f) damp = 0.0f;

  if (frozen) {
    room_size = kFrozenRoomSize;
    damp = 0.0f;
  }
  parameters.room_size = room_size;
  parameters.damping = damp;
  parameters.freeze_mode = frozen ? 1.0f : 0.0f;
  return parameters;
}

void EtherReverbDevice::apply_parameters() {
  reverb_.set_parameters(reverb_parameters_for(decay_seconds_, size_, damping_, frozen_));
  // Ether :157: preDelaySamples = preDelayMs / 1000 * sampleRate, fractional.
  predelay_samples_ = predelay_ms_ * 0.001f * sample_rate_;
  if (predelay_samples_ > static_cast<float>(kPredelaySamples - 2)) {
    predelay_samples_ = static_cast<float>(kPredelaySamples - 2);
  }
  // Ether :187-188: dryLevel = freeze ? 0 : 1 - mix; wet = mix.
  const float dry = frozen_ ? 0.0f : 1.0f - mix_;
  if (primed_) {
    dry_gain_.set_target(dry);
    wet_gain_.set_target(mix_);
  } else {
    dry_gain_.snap(dry);
    wet_gain_.snap(mix_);
  }
}

void EtherReverbDevice::set_param(EtherReverbParam param, float value) {
  switch (param) {
    case EtherReverbParam::kMix:
      mix_ = clamp01(value);
      break;
    case EtherReverbParam::kDecay:
      if (value < kMinDecaySeconds) value = kMinDecaySeconds;
      if (value > kMaxDecaySeconds) value = kMaxDecaySeconds;
      decay_seconds_ = value;
      break;
    case EtherReverbParam::kDamping:
      damping_ = clamp01(value);
      break;
    case EtherReverbParam::kPredelayMs:
      if (value < 0.0f) value = 0.0f;
      if (value > kMaxPredelayMs) value = kMaxPredelayMs;
      predelay_ms_ = value;
      break;
    case EtherReverbParam::kSize:
      size_ = clamp01(value);
      break;
    case EtherReverbParam::kFreeze:
      frozen_ = value >= 0.5f;
      break;
  }
  apply_parameters();
}

void EtherReverbDevice::process(int frames) {
  if (frames > kMaxBlockFrames) frames = kMaxBlockFrames;
  primed_ = true;

  for (int i = 0; i < frames; ++i) {
    const float dry_left = in_left_[i];
    const float dry_right = in_right_[i];
    // Consumed once: the host writes the next block from scratch.
    in_left_[i] = 0.0f;
    in_right_[i] = 0.0f;

    // Ether :170: the pre-delay is fed silence while frozen.
    const float fed_left = frozen_ ? 0.0f : dry_left;
    const float fed_right = frozen_ ? 0.0f : dry_right;
    float wet_left = predelay_[0].push_pop(fed_left, predelay_samples_);
    float wet_right = predelay_[1].push_pop(fed_right, predelay_samples_);

    reverb_.process_stereo(&wet_left, &wet_right);

    const float dry_gain = dry_gain_.next();
    const float wet_gain = wet_gain_.next();
    out_left_[i] = dry_left * dry_gain + wet_left * wet_gain;
    out_right_[i] = dry_right * dry_gain + wet_right * wet_gain;
  }
}

}  // namespace livemix
