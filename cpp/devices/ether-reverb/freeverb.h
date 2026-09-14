#pragma once

#include <cmath>

#include "../../common/dsp_util.h"

namespace livemix {

// Freeverb (Jezar at Dreampoint, public domain) exactly as juce::Reverb
// configures it, which is the whole of kkfonie Ether's reverb
// (Ether/Source/PluginProcessor.h:44 `juce::dsp::Reverb reverb`). Written
// JUCE-free for live-mix from the published algorithm; every constant is
// Freeverb's: eight parallel comb filters and four series allpasses per
// channel, tuned {1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617} and
// {556, 441, 341, 225} samples at 44.1 kHz with the right channel 23 samples
// longer, integer-scaled to the running rate the way juce::Reverb::setSampleRate
// does ((int) rate * tuning / 44100); input gain 0.015 on the L+R sum;
// feedback = roomSize * 0.28 + 0.7; comb damping = damping * 0.4; allpass
// feedback 0.5; wet scale 3 split by width, dry scale 2.
//
// Freeze mode (juce::Reverb::isFrozen: freezeMode >= 0.5): input gain 0,
// feedback 1, damping 0, so the combs recirculate losslessly.
//
// juce::Reverb ramps damping, feedback and the three output gains linearly
// over 10 ms (juce::SmoothedValue<float>, LinearRamp below); the input gain
// switches instantly.
//
// One deviation: juce::Reverb runs JUCE_UNDENORMALISE (x += 0.1f; x -= 0.1f)
// on every stored comb and allpass sample. That quantises the stored values
// to multiples of 7.45e-9, and with the comb feedback the loop settles into a
// quantisation limit cycle instead of decaying: measured, an Ether tail idles
// at about -116 dBFS forever. livemix::flush_denormal is used in the same
// places instead (WASM has no flush-to-zero of its own), so a tail decays
// smoothly and reaches exact zero. Above -160 dBFS the two are identical.
class Freeverb {
 public:
  static constexpr int kCombs = 8;
  static constexpr int kAllpasses = 4;
  static constexpr int kStereoSpread = 23;
  static constexpr int kMaxCombSamples = 4096;      // (1617 + 23) * 96000 / 44100 = 3569
  static constexpr int kMaxAllpassSamples = 2048;   // (556 + 23) * 96000 / 44100 = 1260
  static constexpr float kMaxSupportedSampleRate = 96000.0f;
  static constexpr float kReferenceRate = 44100.0f;

  static constexpr float kFixedGain = 0.015f;
  static constexpr float kRoomScaleFactor = 0.28f;
  static constexpr float kRoomOffset = 0.7f;
  static constexpr float kDampScaleFactor = 0.4f;
  static constexpr float kWetScaleFactor = 3.0f;
  static constexpr float kDryScaleFactor = 2.0f;
  static constexpr float kAllpassFeedback = 0.5f;
  static constexpr float kSmoothingSeconds = 0.01f;

  struct Parameters {
    float room_size = 0.5f;
    float damping = 0.5f;
    float wet_level = 0.33f;
    float dry_level = 0.4f;
    float width = 1.0f;
    float freeze_mode = 0.0f;
  };

  // juce::LinearSmoothedValue<float>: a new target restarts a linear ramp of
  // `steps` samples from the current value; reset() snaps to the target.
  struct LinearRamp {
    float current = 0.0f;
    float target = 0.0f;
    float step = 0.0f;
    int steps_to_target = 0;
    int countdown = 0;

    void reset(float sample_rate, float ramp_seconds) {
      steps_to_target = static_cast<int>(std::floor(ramp_seconds * sample_rate));
      current = target;
      countdown = 0;
    }
    void set_target(float value) {
      if (value == target) return;
      if (steps_to_target <= 0) {
        current = target = value;
        return;
      }
      target = value;
      countdown = steps_to_target;
      step = (target - current) / static_cast<float>(countdown);
    }
    float next() {
      if (countdown <= 0) return target;
      --countdown;
      current += step;
      return current;
    }
    bool is_smoothing() const { return countdown > 0; }
  };

  static bool is_frozen(float freeze_mode) { return freeze_mode >= 0.5f; }

  static int comb_length(float sample_rate, int comb, int channel) {
    const int rate = static_cast<int>(sample_rate);
    return (rate * (kCombTunings[comb] + (channel == 1 ? kStereoSpread : 0))) / 44100;
  }
  static int allpass_length(float sample_rate, int allpass, int channel) {
    const int rate = static_cast<int>(sample_rate);
    return (rate * (kAllpassTunings[allpass] + (channel == 1 ? kStereoSpread : 0))) / 44100;
  }

  // juce::Reverb::setSampleRate: sizes (and clears) every line and snaps the
  // ramps to their current targets.
  void set_sample_rate(float sample_rate) {
    if (sample_rate > kMaxSupportedSampleRate) sample_rate = kMaxSupportedSampleRate;
    for (int ch = 0; ch < 2; ++ch) {
      for (int i = 0; i < kCombs; ++i) {
        combs_[ch][i].set_size(comb_length(sample_rate, i, ch));
      }
      for (int i = 0; i < kAllpasses; ++i) {
        allpasses_[ch][i].set_size(allpass_length(sample_rate, i, ch));
      }
    }
    damping_.reset(sample_rate, kSmoothingSeconds);
    feedback_.reset(sample_rate, kSmoothingSeconds);
    dry_gain_.reset(sample_rate, kSmoothingSeconds);
    wet_gain1_.reset(sample_rate, kSmoothingSeconds);
    wet_gain2_.reset(sample_rate, kSmoothingSeconds);
  }

  // juce::Reverb::reset: clears the lines only; the ramps keep going.
  void reset() {
    for (int ch = 0; ch < 2; ++ch) {
      for (auto& comb : combs_[ch]) comb.clear();
      for (auto& allpass : allpasses_[ch]) allpass.clear();
    }
  }

  // juce::Reverb::setParameters.
  void set_parameters(const Parameters& parameters) {
    const float wet = parameters.wet_level * kWetScaleFactor;
    dry_gain_.set_target(parameters.dry_level * kDryScaleFactor);
    wet_gain1_.set_target(0.5f * wet * (1.0f + parameters.width));
    wet_gain2_.set_target(0.5f * wet * (1.0f - parameters.width));
    gain_ = is_frozen(parameters.freeze_mode) ? 0.0f : kFixedGain;
    parameters_ = parameters;
    if (is_frozen(parameters.freeze_mode)) {
      damping_.set_target(0.0f);
      feedback_.set_target(1.0f);
    } else {
      damping_.set_target(parameters.damping * kDampScaleFactor);
      feedback_.set_target(parameters.room_size * kRoomScaleFactor + kRoomOffset);
    }
  }

  const Parameters& parameters() const { return parameters_; }

  // juce::Reverb::processStereo for one sample, in place.
  void process_stereo(float* left, float* right) {
    const float input = (*left + *right) * gain_;
    float out_left = 0.0f;
    float out_right = 0.0f;

    const float damp = damping_.next();
    const float feedback = feedback_.next();

    for (int j = 0; j < kCombs; ++j) {
      out_left += combs_[0][j].process(input, damp, feedback);
      out_right += combs_[1][j].process(input, damp, feedback);
    }
    for (int j = 0; j < kAllpasses; ++j) {
      out_left = allpasses_[0][j].process(out_left);
      out_right = allpasses_[1][j].process(out_right);
    }

    const float dry = dry_gain_.next();
    const float wet1 = wet_gain1_.next();
    const float wet2 = wet_gain2_.next();

    const float in_left = *left;
    const float in_right = *right;
    *left = out_left * wet1 + out_right * wet2 + in_left * dry;
    *right = out_right * wet1 + out_left * wet2 + in_right * dry;
  }

  // Test hooks.
  int comb_size(int channel, int comb) const { return combs_[channel][comb].size; }
  int allpass_size(int channel, int allpass) const { return allpasses_[channel][allpass].size; }
  float current_feedback() const { return feedback_.is_smoothing() ? feedback_.current : feedback_.target; }
  float current_damping() const { return damping_.is_smoothing() ? damping_.current : damping_.target; }
  float input_gain() const { return gain_; }
  bool is_silent_state() const {
    for (int ch = 0; ch < 2; ++ch) {
      for (const auto& comb : combs_[ch]) {
        if (comb.last != 0.0f) return false;
        for (int i = 0; i < comb.size; ++i) {
          if (comb.buffer[i] != 0.0f) return false;
        }
      }
      for (const auto& allpass : allpasses_[ch]) {
        for (int i = 0; i < allpass.size; ++i) {
          if (allpass.buffer[i] != 0.0f) return false;
        }
      }
    }
    return true;
  }

 private:
  static constexpr int kCombTunings[kCombs] = {1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617};
  static constexpr int kAllpassTunings[kAllpasses] = {556, 441, 341, 225};

  struct CombFilter {
    float buffer[kMaxCombSamples] = {};
    int size = 1;
    int index = 0;
    float last = 0.0f;

    void set_size(int new_size) {
      if (new_size < 1) new_size = 1;
      if (new_size > kMaxCombSamples) new_size = kMaxCombSamples;
      size = new_size;
      clear();
    }
    void clear() {
      last = 0.0f;
      for (int i = 0; i < kMaxCombSamples; ++i) buffer[i] = 0.0f;
      index = 0;
    }
    float process(float input, float damp, float feedback_level) {
      const float output = buffer[index];
      last = flush_denormal(output * (1.0f - damp) + last * damp);
      const float temp = flush_denormal(input + last * feedback_level);
      buffer[index] = temp;
      index = (index + 1) % size;
      return output;
    }
  };

  struct AllpassFilter {
    float buffer[kMaxAllpassSamples] = {};
    int size = 1;
    int index = 0;

    void set_size(int new_size) {
      if (new_size < 1) new_size = 1;
      if (new_size > kMaxAllpassSamples) new_size = kMaxAllpassSamples;
      size = new_size;
      clear();
    }
    void clear() {
      for (int i = 0; i < kMaxAllpassSamples; ++i) buffer[i] = 0.0f;
      index = 0;
    }
    float process(float input) {
      const float buffered = buffer[index];
      buffer[index] = flush_denormal(input + buffered * kAllpassFeedback);
      index = (index + 1) % size;
      return buffered - input;
    }
  };

  Parameters parameters_;
  float gain_ = kFixedGain;
  LinearRamp damping_;
  LinearRamp feedback_;
  LinearRamp dry_gain_;
  LinearRamp wet_gain1_;
  LinearRamp wet_gain2_;
  CombFilter combs_[2][kCombs];
  AllpassFilter allpasses_[2][kAllpasses];
};

}  // namespace livemix
