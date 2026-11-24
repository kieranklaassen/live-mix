#pragma once

#include <cmath>

// Four times up and down around the contact, in two halfband stages: 63 taps
// next to the audio band, 15 taps above it, where an octave and a half of
// headroom is enough room for a short filter. Histories are written twice, a
// window apart, so that a window never wraps.

namespace livemix {
namespace buzzing_bridge_dsp {

// One stage, 4 * Half - 1 taps (Kaiser window).
template <int Half>
class Stage {
 public:
  static_assert((Half & (Half - 1)) == 0, "Half must be a power of two");

  void init(double beta) {
    const double base = bessel_i0(beta);
    for (int k = 0; k < Half; ++k) {
      const int n = 2 * k + 1;
      const double ideal = std::sin(3.14159265358979323846 * n / 2.0) / (3.14159265358979323846 * n);
      const double r = static_cast<double>(n) / (2 * Half);
      taps_[k] = static_cast<float>(ideal * bessel_i0(beta * std::sqrt(1.0 - r * r)) / base);
    }
    reset();
  }

  void reset() {
    for (float& v : up_) v = 0.0f;
    for (float& v : first_) v = 0.0f;
    for (float& v : second_) v = 0.0f;
    up_at_ = first_at_ = second_at_ = 0;
  }

  // One sample in, two out.
  void up(float x, float* a, float* b) {
    const float* w = push(up_, &up_at_, x);
    *a = 2.0f * dot(w);
    *b = w[Half];
  }

  // Two samples in, one out.
  float down(float a, float b) {
    const float* w = push(first_, &first_at_, a);
    const float centre = second_[second_at_];
    second_[second_at_] = b;
    second_at_ = (second_at_ + 1) & (Half - 1);
    return 0.5f * centre + dot(w);
  }

 private:
  static constexpr int kWindow = 2 * Half;

  static double bessel_i0(double x) {
    double sum = 1.0, term = 1.0;
    for (int k = 1; k < 40; ++k) {
      term *= (x / (2.0 * k)) * (x / (2.0 * k));
      sum += term;
    }
    return sum;
  }

  static const float* push(float* history, int* at, float x) {
    history[*at] = x;
    history[*at + kWindow] = x;
    *at = (*at + 1) & (kWindow - 1);
    return history + *at;
  }

  float dot(const float* w) const {
    float sum = 0.0f;
    for (int k = 0; k < Half; ++k) sum += taps_[k] * (w[Half + k] + w[Half - 1 - k]);
    return sum;
  }

  float taps_[Half] = {};
  float up_[2 * kWindow] = {};
  float first_[2 * kWindow] = {};
  float second_[Half] = {};
  int up_at_ = 0, first_at_ = 0, second_at_ = 0;
};

// The whole trip. `shape(x, k)` is called with the four samples in order.
class Oversampler4x {
 public:
  // Up and down again in samples at the base rate: 31 for the outer stage,
  // 7 samples at twice the rate for the inner one.
  static constexpr float kDelay = 34.5f;

  void init() {
    outer_.init(8.0);
    inner_.init(7.0);
  }
  void reset() {
    outer_.reset();
    inner_.reset();
  }

  template <typename Shape>
  float process(float x, Shape shape) {
    float pair[2], back[2];
    outer_.up(x, &pair[0], &pair[1]);
    for (int k = 0; k < 2; ++k) {
      float a, b;
      inner_.up(pair[k], &a, &b);
      a = shape(a, 2 * k);
      b = shape(b, 2 * k + 1);
      back[k] = inner_.down(a, b);
    }
    return outer_.down(back[0], back[1]);
  }

 private:
  Stage<16> outer_;
  Stage<4> inner_;
};

}  // namespace buzzing_bridge_dsp
}  // namespace livemix
