#pragma once

// Twice the sample rate, a run at a time.
//
// The players and the tape of every key run at half the host's rate: what
// is on the tapes ends near a fifth of it (tapes.h), so nothing is lost,
// and the keys cost half as much. This brings their sum back up: a 47-tap
// halfband FIR (Kaiser window, beta 7), flat to 0.2 of the host rate and
// about 70 dB down from 0.3, where the images of the top of the band would
// land. In polyphase form one output of each pair is an input sample as it
// stands and the other is the sample halfway to the next. Linear phase;
// 23 host samples of delay.

#include <cmath>

namespace livemix {
namespace tape_orchestra_dsp {

class Doubler {
 public:
  static constexpr int kPairs = 12;                 // 4 * kPairs - 1 taps
  static constexpr int kHistory = 2 * kPairs - 1;   // inputs kept from before
  static constexpr int kMaxRun = 64;

  void init() {
    const double pi = 3.14159265358979323846;
    const double beta = 7.0;
    double sum = 0.0;
    double tap[kPairs];
    for (int j = 0; j < kPairs; ++j) {
      const int n = 2 * j + 1;  // taps away from the centre
      const double ideal = std::sin(pi * n / 2.0) / (pi * n);
      const double r = static_cast<double>(n) / (2 * kPairs);
      tap[j] = ideal * bessel_i0(beta * std::sqrt(1.0 - r * r)) / bessel_i0(beta);
      sum += 2.0 * tap[j];
    }
    // The halfway sample of a constant is that constant.
    for (int j = 0; j < kPairs; ++j) tap_[j] = static_cast<float>(tap[j] / sum);
    reset();
  }

  void reset() {
    for (float& value : line_) value = 0.0f;
  }

  // `count` samples in (at most kMaxRun), twice as many out.
  void process(const float* in, int count, float* out) {
    for (int i = 0; i < count; ++i) line_[kHistory + i] = in[i];
    for (int i = 0; i < count; ++i) {
      const float* p = line_ + i;  // p[kHistory] is the newest input
      float sum = 0.0f;
      for (int j = 0; j < kPairs; ++j) sum += tap_[j] * (p[kPairs + j] + p[kPairs - 1 - j]);
      out[2 * i] = sum;
      out[2 * i + 1] = p[kPairs];
    }
    for (int i = 0; i < kHistory; ++i) {
      const float kept = line_[count + i];
      line_[i] = (kept > -1.0e-20f && kept < 1.0e-20f) ? 0.0f : kept;
    }
  }

 private:
  static double bessel_i0(double x) {
    double sum = 1.0, term = 1.0;
    for (int k = 1; k < 40; ++k) {
      term *= (x / (2.0 * k)) * (x / (2.0 * k));
      sum += term;
    }
    return sum;
  }

  float tap_[kPairs] = {};
  float line_[kHistory + kMaxRun] = {};
};

}  // namespace tape_orchestra_dsp
}  // namespace livemix
