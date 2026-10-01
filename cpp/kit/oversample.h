#pragma once

#include "math.h"

namespace livemix {
namespace kit {

// 2x oversampling around a nonlinearity: a 63-tap Kaiser-windowed halfband
// FIR up and the same filter down. Passband flat to 0.42 of the base sample
// rate, stopband below -80 dB from 0.58, so what a saturator folds back from
// above the base Nyquist is removed before decimation. Linear phase; the
// round trip delays the signal by kLatency base-rate samples, which the
// device reports for delay compensation.
class Halfband2x {
 public:
  static constexpr int kTaps = 63;
  static constexpr int kCentre = 31;
  static constexpr int kLatency = 31;

  void init() {
    // Odd offsets from the centre carry the response; even ones are zero.
    const double beta = 8.0;
    const double i0_beta = bessel_i0(beta);
    for (int k = 0; k < kHalf; ++k) {
      const int n = 2 * k + 1;
      const double ideal = std::sin(3.14159265358979323846 * n / 2.0) /
                           (3.14159265358979323846 * n);
      const double r = static_cast<double>(n) / (kCentre + 1);
      const double window = bessel_i0(beta * std::sqrt(1.0 - r * r)) / i0_beta;
      odd_[k] = static_cast<float>(ideal * window);
    }
    reset();
  }

  void reset() {
    for (float& value : up_) value = 0.0f;
    for (float& value : down_) value = 0.0f;
    up_index_ = 0;
    down_index_ = 0;
  }

  // One base-rate sample in, two 2x-rate samples out.
  void up(float x, float* first, float* second) {
    up_[up_index_] = x;
    // Polyphase: with the zeros stuffed in, one output sees only the odd
    // taps (the sample halfway between two inputs) and the other only the
    // centre tap (0.5, times the interpolation gain of 2: the input itself).
    float sum = 0.0f;
    for (int k = 0; k < kHalf; ++k) {
      const float newer = up_[(up_index_ - (kHalf - 1 - k)) & kMask];
      const float older = up_[(up_index_ - (kHalf + k)) & kMask];
      sum += odd_[k] * (newer + older);
    }
    *first = 2.0f * sum;
    *second = up_[(up_index_ - (kHalf - 1)) & kMask];
    up_index_ = (up_index_ + 1) & kMask;
  }

  // Two 2x-rate samples in (in order), one base-rate sample out. The output
  // is taken on the first of the pair, which puts the centre tap on the
  // samples `up` passed straight through and makes the round trip a whole
  // number of base-rate samples.
  float down(float first, float second) {
    down_[down_index_] = first;
    float sum = 0.5f * down_[(down_index_ - kCentre) & kDownMask];
    for (int k = 0; k < kHalf; ++k) {
      const int offset = 2 * k + 1;
      sum += odd_[k] * (down_[(down_index_ - kCentre + offset) & kDownMask] +
                        down_[(down_index_ - kCentre - offset) & kDownMask]);
    }
    down_index_ = (down_index_ + 1) & kDownMask;
    down_[down_index_] = second;
    down_index_ = (down_index_ + 1) & kDownMask;
    return sum;
  }

 private:
  static constexpr int kHalf = 16;
  static constexpr int kMask = 31;
  static constexpr int kDownMask = 63;

  static double bessel_i0(double x) {
    double sum = 1.0;
    double term = 1.0;
    for (int k = 1; k < 32; ++k) {
      term *= (x / (2.0 * k)) * (x / (2.0 * k));
      sum += term;
    }
    return sum;
  }

  float odd_[kHalf] = {};
  float up_[32] = {};
  float down_[64] = {};
  int up_index_ = 0;
  int down_index_ = 0;
};

}  // namespace kit
}  // namespace livemix
