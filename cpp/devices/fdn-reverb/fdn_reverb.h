#pragma once

#include <cmath>

#include "../../common/dsp_util.h"

namespace livemix {

// 8-channel Feedback Delay Network reverb, extracted JUCE-free from kkfonie's
// Tides plugin (kieranklaassen/kkfonie@0c4ae88, Tides/Source/PluginProcessor.cpp:
// prepareToPlay :74-140, processAllpass :162-172, readDelayInterpolated
// :178-196, applyHadamard8 :202-228, computeFeedbackGain :244-247, per-sample
// loop :303-432). Header-only so Tides and Bloom can include the same source
// later.
//
// Signal path (mono in, stereo wet out):
//   pre-delay -> breathing gate -> 4 series input-diffusion allpasses
//   -> 8 coprime delay lines read with LFO-modulated allpass interpolation
//   -> 8x8 Hadamard -> per channel: + diffused input, feedback gain from RT60,
//      one-pole HF damping, DC blocker, tanh soft limit -> write back
//   -> left = even lines, right = odd lines (x0.25), tanh.
//
// Constants are Tides' verbatim: delays {4799..7789} and {142,107,379,277} at
// 44.1 kHz scaled to the running rate, diffusion 0.75/0.625, +/-12-sample line
// modulation at 0.3..0.79 Hz, DC blocker R = 0.995, feedback clamp 0.98.
// Additions over Tides: `size` scales the eight delays, `damping` maps 0..1 to
// a 20 kHz..1 kHz damping cutoff (0.4 is Tides' fixed 6 kHz), a pre-delay line
// (0 = Tides), and juce::SmoothedValue is a one-pole smoother. Tides' `style`
// (gate <-> swell blend) is fixed at its default 0: the breath LFO gates the
// input, `1 - depth * (1 - breathMod)`. The final tanh sits on the wet path
// rather than after the dry/wet mix so the dry signal is untouched at mix 0.
class FdnReverb {
 public:
  static constexpr int kChannels = 8;
  static constexpr int kInputAllpasses = 4;
  static constexpr int kMaxDelaySamples = 65536;  // fits 96 kHz at size 2
  static constexpr int kInputAllpassSamples = 2048;
  static constexpr int kPredelaySamples = 32768;  // fits 250 ms at 96 kHz
  static constexpr float kMaxSupportedSampleRate = 96000.0f;

  static constexpr float kMinDecaySeconds = 0.1f;
  static constexpr float kMaxDecaySeconds = 20.0f;
  static constexpr float kMinSize = 0.5f;
  static constexpr float kMaxSize = 2.0f;
  static constexpr float kMaxPredelayMs = 250.0f;
  static constexpr float kMinBreathRateHz = 0.05f;
  static constexpr float kMaxBreathRateHz = 2.0f;

  static constexpr float kDefaultDecaySeconds = 5.0f;
  static constexpr float kDefaultDamping = 0.4f;  // ~6 kHz, Tides' hfCutoff
  static constexpr float kDefaultSize = 1.0f;
  static constexpr float kDefaultPredelayMs = 0.0f;
  static constexpr float kDefaultBreathRateHz = 0.3f;
  static constexpr float kDefaultBreathDepth = 0.4f;

  // Replacement for juce::SmoothedValue: exponential approach that settles to
  // within 1 % of the target after `seconds`. Values set before the first
  // process() call snap so construction-time params take effect immediately.
  struct Smoother {
    float current = 0.0f;
    float target = 0.0f;
    float coefficient = 0.0f;

    void set_time(float seconds, float sample_rate) {
      // ln(100): 1 % residual after `seconds`.
      coefficient = std::exp(-4.605170186f / (seconds * sample_rate));
    }
    void snap(float value) { current = target = value; }
    void set_target(float value) { target = value; }
    float next() {
      current = target + flush_denormal((current - target) * coefficient);
      return current;
    }
  };

  void init(float sample_rate);

  void set_decay(float seconds);         // kMinDecaySeconds..kMaxDecaySeconds (RT60)
  void set_damping(float damping);       // 0..1 (0 = 20 kHz bright, 1 = 1 kHz dark)
  void set_size(float size);             // kMinSize..kMaxSize, scales every delay
  void set_predelay_ms(float ms);        // 0..kMaxPredelayMs
  void set_breath_rate(float hz);        // kMinBreathRateHz..kMaxBreathRateHz
  void set_breath_depth(float depth);    // 0..1

  // Mono in, stereo wet out (100 % wet; the caller owns dry/wet mixing).
  void process(float in, float* wet_left, float* wet_right);

  // Tides' breathing law (PluginProcessor.cpp:332-333). UI code animating the
  // breath must use this exact formula; phase is 0..1.
  static float breath_law(float phase, float depth) {
    const float breath_mod = std::sin(phase * kTwoPi) * 0.5f + 0.5f;
    return 1.0f - depth * (1.0f - breath_mod);
  }

  // Tides' RT60 -> per-pass gain (PluginProcessor.cpp:244-247, clamp :314).
  static float feedback_gain_for(float rt60_seconds, float average_delay_seconds) {
    if (rt60_seconds < 0.1f) rt60_seconds = 0.1f;
    const float gain = std::pow(10.0f, -3.0f * average_delay_seconds / rt60_seconds);
    return gain < 0.98f ? gain : 0.98f;
  }

  // Test / UI hooks.
  float breath_phase() const { return breath_phase_; }
  float average_delay_seconds() const { return average_delay_seconds_; }
  bool is_silent_state() const;
  bool has_denormal_state() const;

 private:
  static constexpr float kTwoPi = 6.28318530717958647692f;
  static constexpr float kReferenceRate = 44100.0f;
  static constexpr float kInputDiffusion1 = 0.75f;
  static constexpr float kInputDiffusion2 = 0.625f;
  static constexpr float kLineModulationSamples = 12.0f;
  static constexpr float kDcBlockerR = 0.995f;
  static constexpr float kSmoothingSeconds = 0.005f;
  static constexpr float kBrightCutoffHz = 20000.0f;
  static constexpr float kDarkCutoffHz = 1000.0f;

  template <int N>
  struct DelayLine {
    float data[N];
    int write_index = 0;
    static constexpr int kMask = N - 1;
    static_assert((N & (N - 1)) == 0, "delay lines are power-of-two sized");

    void clear() {
      for (int i = 0; i < N; ++i) data[i] = 0.0f;
      write_index = 0;
    }
    void write(float x) {
      data[write_index] = flush_denormal(x);
      write_index = (write_index + 1) & kMask;
    }
    // Value written `delay` samples ago (delay >= 1), read before this
    // sample's write like Tides' writeIdx - delayLength.
    float read(int delay) const { return data[(write_index - delay) & kMask]; }
  };

  // Tides' processAllpass: y = -g*x + x[n-D]; store x + g*y.
  template <int N>
  struct Allpass {
    DelayLine<N> line;
    int length = 1;

    float process(float x, float coefficient) {
      const float delayed = line.read(length);
      const float y = -coefficient * x + delayed;
      line.write(x + coefficient * y);
      return y;
    }
  };

  float read_interpolated(int channel, float delay_samples);
  static void hadamard8(const float* in, float* out);
  void assign(Smoother& smoother, float value) {
    if (primed_) {
      smoother.set_target(value);
    } else {
      smoother.snap(value);
    }
  }

  float sample_rate_ = 48000.0f;
  float inverse_sample_rate_ = 1.0f / 48000.0f;
  float average_delay_seconds_ = 0.0f;
  bool primed_ = false;

  Smoother decay_;
  Smoother lp_coefficient_;
  Smoother size_;
  Smoother breath_rate_;
  Smoother breath_depth_;
  int predelay_samples_ = 0;

  DelayLine<kPredelaySamples> predelay_;
  Allpass<kInputAllpassSamples> input_allpass_[kInputAllpasses];

  DelayLine<kMaxDelaySamples> lines_[kChannels];
  int base_delays_[kChannels] = {};
  float interp_state_[kChannels] = {};
  float lfo_phase_[kChannels] = {};
  float lfo_increment_[kChannels] = {};
  float lp_state_[kChannels] = {};
  float dc_x1_[kChannels] = {};
  float dc_y1_[kChannels] = {};

  float breath_phase_ = 0.0f;
};

inline void FdnReverb::init(float sample_rate) {
  // Reset in place: the lines total ~2 MB, far beyond the WASM stack.
  sample_rate_ = sample_rate;
  inverse_sample_rate_ = 1.0f / sample_rate;
  primed_ = false;
  const float rate_ratio = sample_rate / kReferenceRate;

  predelay_.clear();

  // Input diffusion (Tides :96-101): Dattorro-style mutually prime delays.
  const int base_input_delays[kInputAllpasses] = {142, 107, 379, 277};
  for (int i = 0; i < kInputAllpasses; ++i) {
    input_allpass_[i].line.clear();
    int length = static_cast<int>(base_input_delays[i] * rate_ratio);
    if (length < 1) length = 1;
    if (length > kInputAllpassSamples - 1) length = kInputAllpassSamples - 1;
    input_allpass_[i].length = length;
  }

  // FDN lines (Tides :107-125): coprime delays, ~109-177 ms at 44.1 kHz.
  const int base_line_delays[kChannels] = {4799, 5399, 5801, 6199, 6599, 6997, 7393, 7789};
  float delay_sum = 0.0f;
  for (int i = 0; i < kChannels; ++i) {
    lines_[i].clear();
    base_delays_[i] = static_cast<int>(base_line_delays[i] * rate_ratio);
    delay_sum += static_cast<float>(base_delays_[i]);
    lfo_phase_[i] = static_cast<float>(i) / kChannels;
    lfo_increment_[i] = (0.3f + static_cast<float>(i) * 0.07f) * inverse_sample_rate_;
    interp_state_[i] = 0.0f;
    lp_state_[i] = 0.0f;
    dc_x1_[i] = 0.0f;
    dc_y1_[i] = 0.0f;
  }
  average_delay_seconds_ = (delay_sum / kChannels) * inverse_sample_rate_;

  breath_phase_ = 0.0f;

  decay_.set_time(kSmoothingSeconds, sample_rate);
  lp_coefficient_.set_time(kSmoothingSeconds, sample_rate);
  size_.set_time(kSmoothingSeconds, sample_rate);
  breath_rate_.set_time(kSmoothingSeconds, sample_rate);
  breath_depth_.set_time(kSmoothingSeconds, sample_rate);
  set_decay(kDefaultDecaySeconds);
  set_damping(kDefaultDamping);
  set_size(kDefaultSize);
  set_predelay_ms(kDefaultPredelayMs);
  set_breath_rate(kDefaultBreathRateHz);
  set_breath_depth(kDefaultBreathDepth);
}

inline void FdnReverb::set_decay(float seconds) {
  if (seconds < kMinDecaySeconds) seconds = kMinDecaySeconds;
  if (seconds > kMaxDecaySeconds) seconds = kMaxDecaySeconds;
  assign(decay_, seconds);
}

inline void FdnReverb::set_damping(float damping) {
  damping = clamp01(damping);
  // Log sweep 20 kHz -> 1 kHz; Tides' one-pole at 6 kHz (:131-133) is 0.4.
  const float cutoff_hz = kBrightCutoffHz * std::pow(kDarkCutoffHz / kBrightCutoffHz, damping);
  assign(lp_coefficient_, std::exp(-kTwoPi * cutoff_hz * inverse_sample_rate_));
}

inline void FdnReverb::set_size(float size) {
  if (size < kMinSize) size = kMinSize;
  if (size > kMaxSize) size = kMaxSize;
  assign(size_, size);
}

inline void FdnReverb::set_predelay_ms(float ms) {
  if (ms < 0.0f) ms = 0.0f;
  if (ms > kMaxPredelayMs) ms = kMaxPredelayMs;
  int samples = static_cast<int>(ms * 0.001f * sample_rate_ + 0.5f);
  if (samples > kPredelaySamples - 1) samples = kPredelaySamples - 1;
  predelay_samples_ = samples;
}

inline void FdnReverb::set_breath_rate(float hz) {
  if (hz < kMinBreathRateHz) hz = kMinBreathRateHz;
  if (hz > kMaxBreathRateHz) hz = kMaxBreathRateHz;
  assign(breath_rate_, hz);
}

inline void FdnReverb::set_breath_depth(float depth) { assign(breath_depth_, clamp01(depth)); }

// Tides' readDelayInterpolated (:178-196): first-order allpass interpolation,
// smoother than linear for modulated delays.
inline float FdnReverb::read_interpolated(int channel, float delay_samples) {
  const int whole = static_cast<int>(delay_samples);
  const float frac = delay_samples - static_cast<float>(whole);
  const float y0 = lines_[channel].read(whole);
  const float y1 = lines_[channel].read(whole + 1);
  const float coefficient = (1.0f - frac) / (1.0f + frac);
  const float output = y1 + coefficient * (y0 - interp_state_[channel]);
  interp_state_[channel] = flush_denormal(output);
  return output;
}

// Tides' applyHadamard8 (:202-228): fast Hadamard transform, 1/sqrt(8) scaled.
inline void FdnReverb::hadamard8(const float* x, float* out) {
  constexpr float scale = 0.353553390593f;

  const float a0 = x[0] + x[1], a1 = x[0] - x[1];
  const float a2 = x[2] + x[3], a3 = x[2] - x[3];
  const float a4 = x[4] + x[5], a5 = x[4] - x[5];
  const float a6 = x[6] + x[7], a7 = x[6] - x[7];

  const float b0 = a0 + a2, b1 = a1 + a3;
  const float b2 = a0 - a2, b3 = a1 - a3;
  const float b4 = a4 + a6, b5 = a5 + a7;
  const float b6 = a4 - a6, b7 = a5 - a7;

  out[0] = (b0 + b4) * scale;
  out[1] = (b1 + b5) * scale;
  out[2] = (b2 + b6) * scale;
  out[3] = (b3 + b7) * scale;
  out[4] = (b0 - b4) * scale;
  out[5] = (b1 - b5) * scale;
  out[6] = (b2 - b6) * scale;
  out[7] = (b3 - b7) * scale;
}

inline void FdnReverb::process(float in, float* wet_left, float* wet_right) {
  primed_ = true;

  const float decay = decay_.next();
  const float lp_coefficient = lp_coefficient_.next();
  const float size = size_.next();
  const float breath_rate = breath_rate_.next();
  const float breath_depth = breath_depth_.next();

  const float feedback_gain = feedback_gain_for(decay, average_delay_seconds_ * size);

  predelay_.write(in);
  const float delayed_in = predelay_samples_ > 0 ? predelay_.read(predelay_samples_) : in;

  // Breathing LFO (Tides :329-337), style 0: gate the input.
  breath_phase_ += breath_rate * inverse_sample_rate_;
  if (breath_phase_ >= 1.0f) breath_phase_ -= 1.0f;
  const float gate_amount = breath_law(breath_phase_, breath_depth);

  // Input diffusion (Tides :340-351).
  float diffused = delayed_in * gate_amount;
  diffused = input_allpass_[0].process(diffused, kInputDiffusion1);
  diffused = input_allpass_[1].process(diffused, kInputDiffusion1);
  diffused = input_allpass_[2].process(diffused, kInputDiffusion2);
  diffused = input_allpass_[3].process(diffused, kInputDiffusion2);

  // Read the modulated lines (Tides :356-372).
  float delay_out[kChannels];
  for (int ch = 0; ch < kChannels; ++ch) {
    lfo_phase_[ch] += lfo_increment_[ch];
    if (lfo_phase_[ch] >= 1.0f) lfo_phase_[ch] -= 1.0f;

    const float modulation = std::sin(lfo_phase_[ch] * kTwoPi) * kLineModulationSamples;
    float delay = static_cast<float>(base_delays_[ch]) * size + modulation;
    if (delay < 1.0f) delay = 1.0f;
    if (delay > static_cast<float>(kMaxDelaySamples - 2)) {
      delay = static_cast<float>(kMaxDelaySamples - 2);
    }
    delay_out[ch] = read_interpolated(ch, delay);
  }

  float mixed[kChannels];
  hadamard8(delay_out, mixed);

  // Feedback path (Tides :382-400): damping, DC block, soft limit, write.
  for (int ch = 0; ch < kChannels; ++ch) {
    const float input = diffused + mixed[ch] * feedback_gain;

    lp_state_[ch] = flush_denormal((1.0f - lp_coefficient) * input + lp_coefficient * lp_state_[ch]);

    const float dc_blocked = lp_state_[ch] - dc_x1_[ch] + kDcBlockerR * dc_y1_[ch];
    dc_x1_[ch] = lp_state_[ch];
    dc_y1_[ch] = flush_denormal(dc_blocked);

    lines_[ch].write(std::tanh(dc_blocked));
  }

  // Decorrelated stereo taps (Tides :405-406), swell fixed at 1 (style 0).
  const float wet_l = (delay_out[0] + delay_out[2] + delay_out[4] + delay_out[6]) * 0.25f;
  const float wet_r = (delay_out[1] + delay_out[3] + delay_out[5] + delay_out[7]) * 0.25f;
  *wet_left = std::tanh(wet_l);
  *wet_right = std::tanh(wet_r);
}

inline bool FdnReverb::is_silent_state() const {
  const auto buffer_silent = [](const float* data, int n) {
    for (int i = 0; i < n; ++i) {
      if (data[i] != 0.0f) return false;
    }
    return true;
  };
  for (int ch = 0; ch < kChannels; ++ch) {
    if (!buffer_silent(lines_[ch].data, kMaxDelaySamples)) return false;
    if (interp_state_[ch] != 0.0f || lp_state_[ch] != 0.0f) return false;
    if (dc_x1_[ch] != 0.0f || dc_y1_[ch] != 0.0f) return false;
  }
  for (int i = 0; i < kInputAllpasses; ++i) {
    if (!buffer_silent(input_allpass_[i].line.data, kInputAllpassSamples)) return false;
  }
  return buffer_silent(predelay_.data, kPredelaySamples);
}

inline bool FdnReverb::has_denormal_state() const {
  const auto in_flush_range = [](float value) {
    const float magnitude = value < 0.0f ? -value : value;
    return magnitude != 0.0f && magnitude < kDenormalThreshold;
  };
  const auto buffer_has_denormal = [&](const float* data, int n) {
    for (int i = 0; i < n; ++i) {
      if (in_flush_range(data[i])) return true;
    }
    return false;
  };
  for (int ch = 0; ch < kChannels; ++ch) {
    if (buffer_has_denormal(lines_[ch].data, kMaxDelaySamples)) return true;
    if (in_flush_range(interp_state_[ch]) || in_flush_range(lp_state_[ch])) return true;
    if (in_flush_range(dc_x1_[ch]) || in_flush_range(dc_y1_[ch])) return true;
  }
  for (int i = 0; i < kInputAllpasses; ++i) {
    if (buffer_has_denormal(input_allpass_[i].line.data, kInputAllpassSamples)) return true;
  }
  return buffer_has_denormal(predelay_.data, kPredelaySamples);
}

}  // namespace livemix
