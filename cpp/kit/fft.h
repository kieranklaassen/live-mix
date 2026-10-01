#pragma once

#include "math.h"

namespace livemix {
namespace kit {

// In-place radix-2 complex FFT of a fixed power-of-two size with its own
// twiddle and bit-reversal tables (filled by init, no allocation). The
// inverse is unscaled: divide by N after forward + inverse.
template <int N>
class Fft {
 public:
  static constexpr int kSize = N;
  static_assert((N & (N - 1)) == 0, "Fft size must be a power of two");

  void init() {
    int bits = 0;
    while ((1 << bits) < N) ++bits;
    for (int i = 0; i < N; ++i) {
      int reversed = 0;
      for (int b = 0; b < bits; ++b) {
        if (i & (1 << b)) reversed |= 1 << (bits - 1 - b);
      }
      reverse_[i] = reversed;
    }
    for (int i = 0; i < N / 2; ++i) {
      const double angle = -2.0 * 3.14159265358979323846 * i / N;
      cos_[i] = static_cast<float>(std::cos(angle));
      sin_[i] = static_cast<float>(std::sin(angle));
    }
  }

  void forward(float* re, float* im) const { transform(re, im, false); }
  void inverse(float* re, float* im) const { transform(re, im, true); }

 private:
  void transform(float* re, float* im, bool inverse) const {
    for (int i = 0; i < N; ++i) {
      const int j = reverse_[i];
      if (j > i) {
        const float tr = re[i];
        re[i] = re[j];
        re[j] = tr;
        const float ti = im[i];
        im[i] = im[j];
        im[j] = ti;
      }
    }
    for (int size = 2; size <= N; size <<= 1) {
      const int half = size >> 1;
      const int stride = N / size;
      for (int start = 0; start < N; start += size) {
        for (int k = 0; k < half; ++k) {
          const float wr = cos_[k * stride];
          const float wi = inverse ? -sin_[k * stride] : sin_[k * stride];
          const int a = start + k;
          const int b = a + half;
          const float xr = re[b] * wr - im[b] * wi;
          const float xi = re[b] * wi + im[b] * wr;
          re[b] = re[a] - xr;
          im[b] = im[a] - xi;
          re[a] += xr;
          im[a] += xi;
        }
      }
    }
  }

  int reverse_[N] = {};
  float cos_[N / 2] = {};
  float sin_[N / 2] = {};
};

}  // namespace kit
}  // namespace livemix
