#include "stereo_widener_device.h"

#include "../../common/dsp_util.h"

namespace livemix {

void StereoWidenerDevice::init(float sample_rate) {
  target_width_ = kDefaultWidth;
  current_width_ = kDefaultWidth;
  width_step_ = 0.0f;
  ramp_frames_ = static_cast<int>(kWidthRampSeconds * sample_rate);
  if (ramp_frames_ < 1) ramp_frames_ = 1;
  ramp_remaining_ = 0;

  silence_reset_frames_ = static_cast<int>(kSilenceResetSeconds * sample_rate);
  if (silence_reset_frames_ < kMinSilenceResetFrames) {
    silence_reset_frames_ = kMinSilenceResetFrames;
  }
  silent_frames_ = 0;

  for (int i = 0; i < kMaxBlockFrames; ++i) {
    in_left_[i] = 0.0f;
    in_right_[i] = 0.0f;
    out_left_[i] = 0.0f;
    out_right_[i] = 0.0f;
  }

  widener_.prepare(static_cast<double>(sample_rate));
  widener_.setWidth(kDefaultWidth);
}

void StereoWidenerDevice::set_param(StereoWidenerParam param, float value) {
  switch (param) {
    case StereoWidenerParam::kWidth: {
      // juce::SmoothedValue<float>::setTargetValue: a new target restarts the
      // ramp from the current value over the full ramp length.
      const float target = clamp01(value);
      if (target == target_width_) return;
      target_width_ = target;
      ramp_remaining_ = ramp_frames_;
      width_step_ = (target_width_ - current_width_) / static_cast<float>(ramp_frames_);
      break;
    }
  }
}

void StereoWidenerDevice::process(int frames) {
  if (frames > kMaxBlockFrames) frames = kMaxBlockFrames;

  for (int i = 0; i < frames; ++i) {
    float left = in_left_[i];
    float right = in_right_[i];
    // Consumed once: the host writes the next block from scratch.
    in_left_[i] = 0.0f;
    in_right_[i] = 0.0f;

    if (left == 0.0f && right == 0.0f) {
      if (silent_frames_ < silence_reset_frames_) {
        ++silent_frames_;
        if (silent_frames_ == silence_reset_frames_) widener_.reset();
      }
    } else {
      silent_frames_ = 0;
    }

    if (ramp_remaining_ > 0) {
      --ramp_remaining_;
      current_width_ = ramp_remaining_ == 0 ? target_width_ : current_width_ + width_step_;
      widener_.setWidth(current_width_);
    }

    widener_.process(left, right);
    out_left_[i] = left;
    out_right_[i] = right;
  }
}

}  // namespace livemix
