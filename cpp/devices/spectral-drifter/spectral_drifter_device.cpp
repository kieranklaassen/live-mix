#include "spectral_drifter_device.h"

namespace livemix {

void SpectralDrifterDevice::init(float sample_rate) {
  sample_rate_ = sample_rate;
  inverse_sample_rate_ = 1.0f / sample_rate;
  // Bloom :134: the same real-time age decay at any rate.
  age_decay_rate_ = std::pow(kAgeDecayPerSampleAt44k, 44100.0f / sample_rate);
  primed_ = false;

  mix_.set_time(kSmoothingSeconds, sample_rate);
  mix_.snap(kDefaultMix);
  bloom_.set_time(kSmoothingSeconds, sample_rate);
  bloom_.snap(kDefaultBloom);
  decay_seconds_ = kDefaultDecaySeconds;
  manual_age_ = false;
  manual_age_value_ = kDefaultAge;

  for (int ch = 0; ch < 2; ++ch) {
    age_seconds_[ch] = 0.0f;
    age_normalized_[ch] = 0.0f;
    drifters_[ch].prepare(static_cast<double>(sample_rate));
    drifters_[ch].setBloom(kDefaultBloom);
    drifters_[ch].setDirection(SpectralDrifter::Direction::Up);
    drifters_[ch].setSeason(SpectralDrifter::Season::Spring);
    drifters_[ch].setSeed(SpectralDrifter::Seed::Fundamental);
    drifters_[ch].setInterval(SpectralDrifter::Interval::Octave);
  }

  for (int i = 0; i < kMaxBlockFrames; ++i) {
    in_left_[i] = 0.0f;
    in_right_[i] = 0.0f;
    out_left_[i] = 0.0f;
    out_right_[i] = 0.0f;
  }
}

// Discrete params arrive as floats: nearest integer, clamped to the range.
int SpectralDrifterDevice::choice(float value, int count) {
  int index = static_cast<int>(value + 0.5f);
  if (index < 0) index = 0;
  if (index > count - 1) index = count - 1;
  return index;
}

void SpectralDrifterDevice::set_param(SpectralDrifterParam param, float value) {
  switch (param) {
    case SpectralDrifterParam::kMix:
      if (primed_) {
        mix_.set_target(clamp01(value));
      } else {
        mix_.snap(clamp01(value));
      }
      break;
    case SpectralDrifterParam::kBloom:
      if (primed_) {
        bloom_.set_target(clamp01(value));
      } else {
        bloom_.snap(clamp01(value));
      }
      break;
    case SpectralDrifterParam::kDirection:
      for (auto& drifter : drifters_) {
        drifter.setDirection(static_cast<SpectralDrifter::Direction>(choice(value, 3)));
      }
      break;
    case SpectralDrifterParam::kSeason:
      for (auto& drifter : drifters_) {
        drifter.setSeason(static_cast<SpectralDrifter::Season>(choice(value, 4)));
      }
      break;
    case SpectralDrifterParam::kSeed:
      for (auto& drifter : drifters_) {
        drifter.setSeed(static_cast<SpectralDrifter::Seed>(choice(value, 3)));
      }
      break;
    case SpectralDrifterParam::kInterval:
      for (auto& drifter : drifters_) {
        drifter.setInterval(static_cast<SpectralDrifter::Interval>(choice(value, 4)));
      }
      break;
    case SpectralDrifterParam::kDecay:
      if (value < kMinDecaySeconds) value = kMinDecaySeconds;
      if (value > kMaxDecaySeconds) value = kMaxDecaySeconds;
      decay_seconds_ = value;
      break;
    case SpectralDrifterParam::kAgeMode:
      manual_age_ = value >= 0.5f;
      break;
    case SpectralDrifterParam::kAge:
      manual_age_value_ = clamp01(value);
      break;
  }
}

// Bloom's per-line age tracker (PluginProcessor.cpp:323-333), on one input.
float SpectralDrifterDevice::track_age(int channel, float sample) {
  const float max_age = decay_seconds_ * 2.0f;
  float& age = age_seconds_[channel];
  if (std::fabs(sample) > kAgeActivityThreshold) {
    age += inverse_sample_rate_;
    if (age > max_age) age = max_age;
  } else {
    age = flush_denormal(age * age_decay_rate_);
  }
  return age / max_age;
}

void SpectralDrifterDevice::process(int frames) {
  if (frames > kMaxBlockFrames) frames = kMaxBlockFrames;
  primed_ = true;

  for (int i = 0; i < frames; ++i) {
    const float dry[2] = {in_left_[i], in_right_[i]};
    // Consumed once: the host writes the next block from scratch.
    in_left_[i] = 0.0f;
    in_right_[i] = 0.0f;

    const float bloom = bloom_.next();
    float wet[2];
    for (int ch = 0; ch < 2; ++ch) {
      age_normalized_[ch] = manual_age_ ? manual_age_value_ : track_age(ch, dry[ch]);
      drifters_[ch].setBloom(bloom);
      wet[ch] = drifters_[ch].process(dry[ch], age_normalized_[ch]);
    }

    const float mix_angle = mix_.next() * kHalfPi;
    const float dry_gain = std::cos(mix_angle);
    const float wet_gain = std::sin(mix_angle);

    out_left_[i] = dry[0] * dry_gain + wet[0] * wet_gain;
    out_right_[i] = dry[1] * dry_gain + wet[1] * wet_gain;
  }
}

}  // namespace livemix
