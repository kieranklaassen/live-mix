#pragma once

// Short halfband filters for changing rate by two inside Octaves. The kit's
// kit::Halfband2x is one fixed 63-tap design (0.65 ms each way at 48 kHz),
// sized for oversampling a saturator; here the bands that change rate sit
// far below the fold, so much shorter filters do, and every tap is latency
// in front of a voice that is meant to start with the note.
//
// HalfbandDown<H> and HalfbandUp<H> are Kaiser-windowed halfbands of
// 4·H - 1 taps (H taps a side are not zero).
//
//   down(a, b): a then b are two samples at the high rate. The result is the
//               signal at the place of the `a` given H - 1 calls earlier.
//   up(x, &p, &q): q is the x given H - 1 calls earlier; p is the sample
//               half a step before it.
//
// So down then up delays by 2·(Hdown + Hup) - 2 high-rate samples when p is
// played at once and q one high-rate sample later.

#include <cmath>

namespace livemix {
namespace octaves {

namespace halfband {

inline double bessel_i0(double x) {
  double sum = 1.0, term = 1.0;
  for (int n = 1; n < 40; ++n) {
    term *= (x / (2.0 * n)) * (x / (2.0 * n));
    sum += term;
  }
  return sum;
}

// The `half` taps at odd offsets 1, 3, 5... from the centre (the centre tap
// is 0.5, the even ones are zero), scaled so the filter has unity gain at 0 Hz.
inline void design(int half, double beta, float* odd) {
  const double pi = 3.14159265358979323846;
  double sum = 0.0;
  double taps[32];
  for (int k = 0; k < half; ++k) {
    const int n = 2 * k + 1;
    const double ideal = std::sin(pi * n / 2.0) / (pi * n);
    const double r = static_cast<double>(n) / (2.0 * half);
    taps[k] = ideal * bessel_i0(beta * std::sqrt(1.0 - r * r)) / bessel_i0(beta);
    sum += 2.0 * taps[k];
  }
  for (int k = 0; k < half; ++k) odd[k] = static_cast<float>(taps[k] * 0.5 / sum);
}

}  // namespace halfband

template <int H>
class HalfbandDown {
 public:
  void init(double beta) {
    halfband::design(H, beta, odd_);
    reset();
  }
  void reset() {
    for (float& v : even_) v = 0.0f;
    for (float& v : late_) v = 0.0f;
    index_ = 0;
  }
  float down(float a, float b) {
    index_ = (index_ + 1) & kMask;
    even_[index_] = a;
    late_[index_] = b;
    float sum = 0.5f * even_[(index_ - (H - 1)) & kMask];
    for (int j = 0; j < H; ++j) {
      sum += odd_[j] * (late_[(index_ - (H - 1) + j) & kMask] + late_[(index_ - H - j) & kMask]);
    }
    return sum;
  }

 private:
  static constexpr int kSize = H <= 4 ? 8 : (H <= 8 ? 16 : 32);
  static constexpr int kMask = kSize - 1;
  float odd_[H] = {};
  float even_[kSize] = {};
  float late_[kSize] = {};
  int index_ = 0;
};

template <int H>
class HalfbandUp {
 public:
  void init(double beta) {
    halfband::design(H, beta, odd_);
    reset();
  }
  void reset() {
    for (float& v : line_) v = 0.0f;
    index_ = 0;
  }
  void up(float x, float* p, float* q) {
    index_ = (index_ + 1) & kMask;
    line_[index_] = x;
    float sum = 0.0f;
    for (int j = 0; j < H; ++j) {
      sum += odd_[j] * (line_[(index_ - (H - 1) + j) & kMask] + line_[(index_ - H - j) & kMask]);
    }
    *p = 2.0f * sum;
    *q = line_[(index_ - (H - 1)) & kMask];
  }

 private:
  static constexpr int kSize = H <= 4 ? 8 : (H <= 8 ? 16 : 32);
  static constexpr int kMask = kSize - 1;
  float odd_[H] = {};
  float line_[kSize] = {};
  int index_ = 0;
};

}  // namespace octaves
}  // namespace livemix
