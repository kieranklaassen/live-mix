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
    up_.clear();
    down_.clear();
    for (float& value : between_) value = 0.0f;
    between_index_ = 0;
  }

  // One base-rate sample in, two 2x-rate samples out.
  void up(float x, float* first, float* second) {
    // Polyphase: with the zeros stuffed in, one output sees only the odd
    // taps (the sample halfway between two inputs) and the other only the
    // centre tap (0.5, times the interpolation gain of 2: the input itself).
    const float* past = up_.take(x);
    *first = 2.0f * odd_taps(past, 0.0f);
    *second = past[kHalf];
  }

  // Two 2x-rate samples in (in order), one base-rate sample out. The output
  // is taken on the first of the pair, which puts the centre tap on the
  // samples `up` passed straight through and makes the round trip a whole
  // number of base-rate samples.
  float down(float first, float second) {
    // The odd taps fall on the first of every pair and the centre on a
    // second, so the two are kept apart.
    const float* past = down_.take(first);
    const float sum = odd_taps(past, 0.5f * between_[between_index_]);
    between_[between_index_] = second;
    between_index_ = (between_index_ + 1) & (kHalf - 1);
    return sum;
  }

 private:
  static constexpr int kHalf = 16;
  static constexpr int kPast = 2 * kHalf;

  // The last kPast samples, always in a row: each is written twice, kPast
  // apart, and the row is read from wherever it starts.
  class Past {
   public:
    void clear() {
      for (float& value : data_) value = 0.0f;
      index_ = 0;
    }
    // Takes a sample and gives the row, oldest first.
    const float* take(float x) {
      data_[index_] = x;
      data_[index_ + kPast] = x;
      index_ = (index_ + 1) & (kPast - 1);
      return data_ + index_;
    }

   private:
    float data_[2 * kPast] = {};
    int index_ = 0;
  };

  // The taps out from the centre, added to `sum` in that order.
  float odd_taps(const float* past, float sum) const {
    float tap[kHalf];
    for (int k = 0; k < kHalf; ++k) tap[k] = odd_[k] * (past[kHalf + k] + past[kHalf - 1 - k]);
    for (int k = 0; k < kHalf; ++k) sum += tap[k];
    return sum;
  }

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
  Past up_, down_;
  float between_[kHalf] = {};  // the seconds of the last pairs
  int between_index_ = 0;
};

}  // namespace kit
}  // namespace livemix
