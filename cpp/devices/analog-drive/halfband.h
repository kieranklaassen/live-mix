#pragma once

#include <cmath>

// 2x up and down through a linear-phase halfband FIR of 4·Half − 1 taps
// (Kaiser window). The device uses two: Half = 16 (63 taps) between the
// sample rate and twice it, which has to be steep because the audio band
// ends just under its transition, and Half = 8 (31 taps) between twice and
// four times, which works on a signal that already has an octave of headroom
// and so reaches -98 dB with a transition four times as wide at a quarter of
// the arithmetic per output sample. (The structure is the saturator's second
// stage, cpp/devices/saturator/halfband.h, copied here.)
//
// Both directions read one contiguous window: every other tap of a halfband
// is zero, so upsampling needs only the input history, and downsampling only
// the history of the first sample of each pair plus one delayed sample of
// the second. Histories are written twice, a window apart, so the window
// never wraps.

namespace livemix {
namespace analog_drive_dsp {

template <int Half>
class Halfband {
 public:
  static_assert((Half & (Half - 1)) == 0, "Half must be a power of two");
  // Up then down, in samples of the lower rate.
  static constexpr int kLatency = 2 * Half - 1;

  void init(double beta) {
    const double i0_beta = bessel_i0(beta);
    for (int k = 0; k < Half; ++k) {
      const int n = 2 * k + 1;
      const double ideal = std::sin(3.14159265358979323846 * n / 2.0) / (3.14159265358979323846 * n);
      const double r = static_cast<double>(n) / (2 * Half);
      taps_[k] = static_cast<float>(ideal * bessel_i0(beta * std::sqrt(1.0 - r * r)) / i0_beta);
    }
    reset();
  }

  void reset() {
    for (float& value : up_) value = 0.0f;
    for (float& value : first_) value = 0.0f;
    for (float& value : second_) value = 0.0f;
    up_index_ = 0;
    first_index_ = 0;
    second_index_ = 0;
  }

  // One sample in, two out: the sample halfway to the next input, then the
  // input itself (both Half − 1 inputs late).
  void up(float x, float* first, float* second) {
    const float* window = push(up_, &up_index_, x);
    *first = 2.0f * dot(window);
    *second = window[Half];
  }

  // Two samples in (in order), one out, centred on a `second`.
  float down(float first, float second) {
    const float* window = push(first_, &first_index_, first);
    const float centre = second_[second_index_];
    second_[second_index_] = second;
    second_index_ = (second_index_ + 1) & (Half - 1);
    return 0.5f * centre + dot(window);
  }

 private:
  static constexpr int kWindow = 2 * Half;

  static double bessel_i0(double x) {
    double sum = 1.0;
    double term = 1.0;
    for (int k = 1; k < 40; ++k) {
      term *= (x / (2.0 * k)) * (x / (2.0 * k));
      sum += term;
    }
    return sum;
  }

  // Store `x` as the newest of the last kWindow samples and return them,
  // oldest first.
  static const float* push(float* history, int* index, float x) {
    history[*index] = x;
    history[*index + kWindow] = x;
    *index = (*index + 1) & (kWindow - 1);
    return history + *index;
  }

  // The symmetric taps over a window whose centre lies between its two
  // middle samples.
  float dot(const float* window) const {
    float sum = 0.0f;
    for (int k = 0; k < Half; ++k) sum += taps_[k] * (window[Half + k] + window[Half - 1 - k]);
    return sum;
  }

  float taps_[Half] = {};
  float up_[2 * kWindow] = {};
  float first_[2 * kWindow] = {};
  float second_[Half] = {};
  int up_index_ = 0;
  int first_index_ = 0;
  int second_index_ = 0;
};

}  // namespace analog_drive_dsp
}  // namespace livemix
