#pragma once

#include <cmath>

#include "../../common/dsp_util.h"
#include "freeverb.h"

namespace livemix {

// Parameter ids shared with src/dsp/devices/ether-reverb.ts. Keep in sync.
// The first five match FdnReverbParam so the two reverbs share preset shapes.
enum class EtherReverbParam : int {
  kMix = 0,         // 0..1     linear dry/wet, default 0.3
  kDecay = 1,       // 0.5..30  s, default 5 (Ether's decay -> roomSize/damping law)
  kDamping = 2,     // 0..1     default 0.4
  kPredelayMs = 3,  // 0..200   default 0
  kSize = 4,        // 0..1     Freeverb roomSize before the decay offset, default 0.6
  kFreeze = 5,      // 0/1      >= 0.5 freezes: input and dry muted, combs lossless; default 0
};

// kkfonie Ether (Ether/Source/PluginProcessor.cpp:112-195) behind the device
// ABI: Freeverb as juce::dsp::Reverb, fed through a per-channel pre-delay
// (juce::dsp::DelayLine<float, Linear>, :45-46, :169-173) and controlled by
// Ether's mapping (:141-152):
//   decayFactor = (decay - 0.5) / 29.5
//   roomSize    = min(1, size + 0.3 * decayFactor)
//   damping     = max(0, damping - 0.2 * decayFactor)
//   freeze      -> roomSize 0.999, damping 0, freezeMode 1, input muted (:170)
//   wetLevel 1, dryLevel 0, width 1 (the mix is Ether's own, :186-189):
//   out = dry * (freeze ? 0 : 1 - mix) + wet * mix
// Deviations: Ether reads `mix` and the freeze dry-mute unsmoothed per block;
// here both gains ramp over 5 ms per sample so knob moves and freeze toggles
// are click-free. Everything inside Freeverb (10 ms linear ramps, instant
// input-gain switch on freeze) is juce::Reverb's. Statically allocated;
// process() is allocation-free.
class EtherReverbDevice {
 public:
  static constexpr int kMaxBlockFrames = 2048;
  static constexpr int kPredelaySamples = 32768;  // 200 ms at 96 kHz = 19200
  static constexpr float kMinDecaySeconds = 0.5f;
  static constexpr float kMaxDecaySeconds = 30.0f;
  static constexpr float kMaxPredelayMs = 200.0f;
  static constexpr float kDefaultMix = 0.3f;
  static constexpr float kDefaultDecaySeconds = 5.0f;
  static constexpr float kDefaultDamping = 0.4f;
  static constexpr float kDefaultPredelayMs = 0.0f;
  static constexpr float kDefaultSize = 0.6f;
  static constexpr float kFrozenRoomSize = 0.999f;

  // Replacement for juce::SmoothedValue on the host-side gains: exponential
  // approach that settles to within 1 % of the target after `seconds`.
  struct Smoother {
    float current = 0.0f;
    float target = 0.0f;
    float coefficient = 0.0f;

    void set_time(float seconds, float sample_rate) {
      coefficient = std::exp(-4.605170186f / (seconds * sample_rate));
    }
    void snap(float value) { current = target = value; }
    void set_target(float value) { target = value; }
    float next() {
      current = target + flush_denormal((current - target) * coefficient);
      return current;
    }
  };

  // juce::dsp::DelayLine<float, DelayLineInterpolationTypes::Linear>: push a
  // sample, then pop the value `delay` samples ago (0 = the sample just
  // pushed) with linear interpolation on the fraction.
  struct PredelayLine {
    float buffer[kPredelaySamples] = {};
    int write_index = 0;
    static constexpr int kMask = kPredelaySamples - 1;

    void clear() {
      for (int i = 0; i < kPredelaySamples; ++i) buffer[i] = 0.0f;
      write_index = 0;
    }
    float push_pop(float x, float delay) {
      buffer[write_index] = x;
      const int whole = static_cast<int>(delay);
      const float frac = delay - static_cast<float>(whole);
      const float y0 = buffer[(write_index - whole) & kMask];
      const float y1 = buffer[(write_index - whole - 1) & kMask];
      write_index = (write_index + 1) & kMask;
      return y0 + frac * (y1 - y0);
    }
  };

  void init(float sample_rate);
  void set_param(EtherReverbParam param, float value);

  float mix() const { return mix_; }
  float decay_seconds() const { return decay_seconds_; }
  float damping() const { return damping_; }
  float predelay_ms() const { return predelay_ms_; }
  float size() const { return size_; }
  bool frozen() const { return frozen_; }

  // Write up to kMaxBlockFrames of input here before each process() call;
  // process() consumes and clears it.
  float* in_left() { return in_left_; }
  float* in_right() { return in_right_; }

  void process(int frames);

  const float* out_left() const { return out_left_; }
  const float* out_right() const { return out_right_; }

  Freeverb& reverb() { return reverb_; }
  // Ether's decay -> Freeverb parameter law (PluginProcessor.cpp:141-149).
  static Freeverb::Parameters reverb_parameters_for(float decay_seconds, float size,
                                                    float damping, bool frozen);

 private:
  static constexpr float kSmoothingSeconds = 0.005f;

  void apply_parameters();

  float sample_rate_ = 48000.0f;
  bool primed_ = false;

  float mix_ = kDefaultMix;
  float decay_seconds_ = kDefaultDecaySeconds;
  float damping_ = kDefaultDamping;
  float predelay_ms_ = kDefaultPredelayMs;
  float size_ = kDefaultSize;
  bool frozen_ = false;
  float predelay_samples_ = 0.0f;

  Smoother dry_gain_;
  Smoother wet_gain_;

  PredelayLine predelay_[2];
  Freeverb reverb_;

  float in_left_[kMaxBlockFrames] = {};
  float in_right_[kMaxBlockFrames] = {};
  float out_left_[kMaxBlockFrames] = {};
  float out_right_[kMaxBlockFrames] = {};
};

}  // namespace livemix
