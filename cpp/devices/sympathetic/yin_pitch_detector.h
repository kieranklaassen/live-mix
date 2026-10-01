#pragma once

// Monophonic pitch detector (de Cheveigné & Kawahara's YIN), ported from
// kkfonie's YINPitchDetector.
//
// The plugin ran it on the message thread from a 30 Hz timer; a device has
// one thread, so the work is cut into three steps the caller runs a fixed
// number of samples apart:
//
//   push() fills a 2048-sample window; when it reports the window full:
//   transform()   copy the window out, forward FFT
//   correlate()   cross spectrum, inverse FFT
//   pick()        difference function, normalise, threshold, interpolate
//
// What the port changes:
//
// - The difference function is the exact one, d(τ) = Σ (x[j] - x[j+τ])² over
//   a fixed window, built from the correlation of the window's head with the
//   whole of it plus two energy sums. The source took 2 r(0) - 2 r(τ) from a
//   zero-padded autocorrelation, whose taper leaves d(T) near T / 2048 of
//   full scale at the true period T and so never crosses the threshold for
//   notes below about 230 Hz.
// - Both FFT inputs ride one complex transform (head in the real part, whole
//   window in the imaginary part), so a detection is two 2048-point
//   kit::Fft passes in place of juce::dsp::FFT at 4096.
// - Above 50 kHz the input is averaged down by two (by four above 150 kHz),
//   so the window covers the same 43 to 46 ms at every sample rate.

#include "../../kit/fft.h"
#include "../../kit/math.h"

namespace livemix {
namespace sympathetic {

class YinPitchDetector {
 public:
  static constexpr int kBufferSize = 2048;
  static constexpr int kHalfSize = kBufferSize / 2;
  static constexpr float kThreshold = 0.10f;  // as in the YIN paper
  static constexpr float kMinFrequency = 50.0f;
  static constexpr float kMaxFrequency = 4000.0f;
  static constexpr float kSilenceRms = 0.001f;  // -60 dBFS

  struct Result {
    float frequency = 0.0f;
    float confidence = 0.0f;
    int midi_note = -1;
    bool valid() const { return confidence > 0.5f && frequency > 0.0f; }
  };

  void prepare(float sample_rate) {
    fft_.init();
    decimation_ = static_cast<int>(sample_rate / 48000.0f + 0.5f);
    if (decimation_ < 1) decimation_ = 1;
    rate_ = sample_rate / static_cast<float>(decimation_);
    max_tau_ = kit::clamp_int(static_cast<int>(rate_ / kMinFrequency), 8, kHalfSize - 2);
    min_tau_ = kit::clamp_int(static_cast<int>(rate_ / kMaxFrequency), 2, max_tau_ - 2);
    window_ = kBufferSize - max_tau_;
    for (int i = 0; i < kBufferSize; ++i) {
      buffer_[i] = 0.0f;
      re_[i] = 0.0f;
      im_[i] = 0.0f;
    }
    for (int i = 0; i < kHalfSize; ++i) {
      energy_[i] = 0.0f;
      yin_[i] = 1.0f;
    }
    quiet_ = true;
    reset();
  }

  // Start a new window (after a pause in the input).
  void reset() {
    fill_ = 0;
    phase_ = 0;
    sum_ = 0.0f;
  }

  // Host samples between two full windows.
  int hop_samples() const { return kBufferSize * decimation_; }
  float analysis_rate() const { return rate_; }

  // Feed one sample; true when a window has just filled (run transform()
  // before the next push).
  bool push(float sample) {
    sum_ += sample;
    if (++phase_ < decimation_) return false;
    buffer_[fill_] = sum_ / static_cast<float>(decimation_);
    phase_ = 0;
    sum_ = 0.0f;
    if (++fill_ < kBufferSize) return false;
    fill_ = 0;
    return true;
  }

  void transform() {
    double total = 0.0;
    for (int i = 0; i < kBufferSize; ++i) total += static_cast<double>(buffer_[i]) * buffer_[i];
    quiet_ = std::sqrt(total / kBufferSize) < kSilenceRms;
    if (quiet_) return;

    // energy_[τ] = Σ x[j]² for j in [τ, τ + window).
    double running = 0.0;
    for (int j = 0; j < window_; ++j) running += static_cast<double>(buffer_[j]) * buffer_[j];
    energy_[0] = static_cast<float>(running);
    for (int tau = 1; tau <= max_tau_; ++tau) {
      const double leaving = buffer_[tau - 1];
      const double entering = buffer_[tau - 1 + window_];
      running += entering * entering - leaving * leaving;
      energy_[tau] = static_cast<float>(running);
    }

    for (int i = 0; i < kBufferSize; ++i) {
      re_[i] = i < window_ ? buffer_[i] : 0.0f;
      im_[i] = buffer_[i];
    }
    fft_.forward(re_, im_);
  }

  void correlate() {
    if (quiet_) return;
    // With z = a + i b: A(k) = (Z(k) + Z*(-k)) / 2 and B(k) = (Z(k) - Z*(-k)) / 2i.
    // The spectrum of Σ a[j] b[j + τ] is A*(k) B(k).
    for (int k = 0; k <= kHalfSize; ++k) {
      const int m = (kBufferSize - k) & (kBufferSize - 1);
      const float ar = 0.5f * (re_[k] + re_[m]);
      const float ai = 0.5f * (im_[k] - im_[m]);
      const float br = 0.5f * (im_[k] + im_[m]);
      const float bi = -0.5f * (re_[k] - re_[m]);
      const float cr = ar * br + ai * bi;
      const float ci = ar * bi - ai * br;
      re_[k] = cr;
      im_[k] = ci;
      re_[m] = cr;
      im_[m] = -ci;
    }
    im_[0] = 0.0f;
    im_[kHalfSize] = 0.0f;
    fft_.inverse(re_, im_);
  }

  Result pick() {
    Result none;
    if (quiet_) return none;

    // Difference function and its cumulative-mean normalisation.
    const float scale = 2.0f / static_cast<float>(kBufferSize);
    yin_[0] = 1.0f;
    float running = 0.0f;
    for (int tau = 1; tau <= max_tau_; ++tau) {
      float difference = energy_[0] + energy_[tau] - scale * re_[tau];
      if (difference < 0.0f) difference = 0.0f;
      running += difference;
      yin_[tau] = running > 0.0f ? difference * static_cast<float>(tau) / running : 1.0f;
    }

    // The first dip under the threshold, followed down to its minimum.
    int tau = -1;
    for (int t = min_tau_; t < max_tau_; ++t) {
      if (yin_[t] < kThreshold) {
        while (t + 1 < max_tau_ && yin_[t + 1] < yin_[t]) ++t;
        tau = t;
        break;
      }
    }
    if (tau < 0) return none;

    // Parabola through the minimum and its neighbours.
    float period = static_cast<float>(tau);
    const float before = yin_[tau - 1];
    const float at = yin_[tau];
    const float after = yin_[tau + 1];
    const float curvature = 2.0f * (before - 2.0f * at + after);
    if (std::fabs(curvature) > 1.0e-10f) {
      period += kit::clamp((before - after) / curvature, -0.5f, 0.5f);
    }

    Result result;
    result.frequency = rate_ / period;
    if (result.frequency < 20.0f || result.frequency > kMaxFrequency) return none;
    result.confidence = 1.0f - at;
    result.midi_note = static_cast<int>(std::floor(kit::hz_to_midi(result.frequency) + 0.5f));
    return result;
  }

 private:
  kit::Fft<kBufferSize> fft_;
  float buffer_[kBufferSize] = {};
  float re_[kBufferSize] = {};
  float im_[kBufferSize] = {};
  float energy_[kHalfSize] = {};
  float yin_[kHalfSize] = {};
  float rate_ = 48000.0f;
  float sum_ = 0.0f;
  int decimation_ = 1;
  int phase_ = 0;
  int fill_ = 0;
  int window_ = kHalfSize;
  int min_tau_ = 12;
  int max_tau_ = 960;
  bool quiet_ = true;
};

}  // namespace sympathetic
}  // namespace livemix
