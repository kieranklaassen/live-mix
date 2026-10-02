#pragma once

// The steep filter at half the converter's rate, used twice per channel
// (before the sampler and after the hold): a ninth-order elliptic low-pass,
// 0.1 dB ripple, 80 dB stopband from 1.256 times its edge, built as the sum
// of two allpass chains (Vaidyanathan, Mitra & Neuvo, "A new approach to the
// realization of low-sensitivity IIR digital filters", IEEE ASSP 1986):
//
//   low = (A1 + A2) / 2      high = (A1 - A2) / 2
//
// The two outputs are in quadrature at every frequency, so low + g * high has
// the magnitude sqrt(|low|² + g²|high|²): flat below the edge, g above it,
// with no dip between. That is how the input filter is "taken away"
// progressively: g is the share of the out-of-band signal let through.
//
// The sections are trapezoidal (Simper's state-variable form), which is the
// bilinear transform of the analogue prototype and stays well behaved while
// the edge moves. Poles from Orfanidis, "Lecture notes on elliptic filter
// design" (2006), edge normalised to 1.

#include "../../kit/math.h"

namespace livemix {
namespace vintage_digital_detail {

class BandSplit {
 public:
  // Group delay of the low-pass at low frequencies, in units of 1 / (the
  // edge in radians): the mean of the two chains'.
  static constexpr float kLowDelay = 5.568f;

  void reset() {
    first_ = 0.0f;
    for (int i = 0; i < kPairs; ++i) ic1_[i] = ic2_[i] = 0.0f;
  }

  // `edge_hz` is the top of the passband; the stopband starts at 1.256 of it
  // (a little higher near the host's Nyquist, where the bilinear map squeezes).
  void set_edge(float edge_hz, float sample_rate) {
    const float w = std::tan(kit::kPi * kit::clamp(edge_hz, 20.0f, 0.47f * sample_rate) / sample_rate);
    const float g1 = w * kSigma;
    first_gain_ = g1 / (1.0f + g1);
    for (int i = 0; i < kPairs; ++i) {
      const float g = w * kW0[i];
      a1_[i] = 1.0f / (1.0f + g * (g + kK[i]));
      a2_[i] = g * a1_[i];
      a3_[i] = g * a2_[i];
    }
  }

  // The two allpass chains' outputs for one input sample.
  void process(float x, float* chain1, float* chain2) {
    // A1: the real pole, then pairs 1 and 3. A2: pairs 0 and 2.
    const float v = (x - first_) * first_gain_;
    const float low = v + first_;
    first_ = flush_denormal(low + v);
    *chain1 = pair(3, pair(1, 2.0f * low - x));
    *chain2 = pair(2, pair(0, x));
  }

  // low + stop_gain * high.
  float filter(float x, float stop_gain) {
    float c1, c2;
    process(x, &c1, &c2);
    return 0.5f * ((1.0f + stop_gain) * c1 + (1.0f - stop_gain) * c2);
  }

 private:
  static constexpr int kPairs = 4;
  static constexpr float kSigma = 0.376207429f;
  // Pole pairs in order of rising Q; k = 1 / Q.
  static constexpr float kW0[kPairs] = {0.559216356f, 0.804303955f, 0.952849823f, 1.016167021f};
  static constexpr float kK[kPairs] = {1.0f / 0.882510652f, 1.0f / 2.026083885f,
                                       1.0f / 4.873784954f, 1.0f / 17.864700141f};

  float pair(int i, float x) {
    const float v3 = x - ic2_[i];
    const float v1 = a1_[i] * ic1_[i] + a2_[i] * v3;
    const float v2 = ic2_[i] + a2_[i] * ic1_[i] + a3_[i] * v3;
    ic1_[i] = flush_denormal(2.0f * v1 - ic1_[i]);
    ic2_[i] = flush_denormal(2.0f * v2 - ic2_[i]);
    return x - 2.0f * kK[i] * v1;
  }

  float first_ = 0.0f;
  float first_gain_ = 0.5f;
  float ic1_[kPairs] = {};
  float ic2_[kPairs] = {};
  float a1_[kPairs] = {1.0f, 1.0f, 1.0f, 1.0f};
  float a2_[kPairs] = {};
  float a3_[kPairs] = {};
};

}  // namespace vintage_digital_detail
}  // namespace livemix
