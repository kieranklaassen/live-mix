#pragma once

// A real-input FFT whose size is chosen at run time (any power of two up to
// MaxN), so one device can use a 4096-point frame at 48 kHz and an 8192-point
// frame at 96 kHz. A real frame of N samples is transformed with one complex
// FFT of N/2 points (the usual packing of even and odd samples into one
// complex sequence), which is about half the work of kit::Fft on the same
// frame. No allocation: the tables are members.
//
//   forward(x, re, im)   x[0..N)            -> re/im[0..N/2]
//   inverse(re, im, x)   re/im[0..N/2]      -> x[0..N), scaled by N/2
//
// `inverse` destroys re/im. kit::Fft has a fixed size per instance, which is
// why this lives here.

#include <cmath>

namespace livemix {
namespace sustainer_detail {

template <int MaxN>
class RealFft {
 public:
  static_assert((MaxN & (MaxN - 1)) == 0, "RealFft size must be a power of two");
  static constexpr int kMaxHalf = MaxN / 2;

  void init() {
    int bits = 0;
    while ((1 << bits) < kMaxHalf) ++bits;
    for (int i = 0; i < kMaxHalf; ++i) {
      int reversed = 0;
      for (int b = 0; b < bits; ++b) {
        if (i & (1 << b)) reversed |= 1 << (bits - 1 - b);
      }
      reverse_[i] = reversed;
    }
    for (int i = 0; i <= kMaxHalf; ++i) {
      const double angle = 2.0 * 3.14159265358979323846 * i / MaxN;
      cos_[i] = static_cast<float>(std::cos(angle));
      sin_[i] = static_cast<float>(std::sin(angle));
    }
  }

  // n: a power of two, 16 <= n <= MaxN.
  void forward(const float* x, float* re, float* im, int n) {
    const int m = n / 2;
    for (int i = 0; i < m; ++i) {
      zr_[i] = x[2 * i];
      zi_[i] = x[2 * i + 1];
    }
    transform(m, false);
    const int step = MaxN / n;  // table index of e^(-j 2 pi k / n) is k * step
    for (int k = 0; k <= m; ++k) {
      const int a = k == m ? 0 : k;
      const int b = k == 0 ? 0 : m - k;
      // E = (Z[a] + conj Z[b]) / 2, O = (Z[a] - conj Z[b]) / 2j
      const float er = 0.5f * (zr_[a] + zr_[b]);
      const float ei = 0.5f * (zi_[a] - zi_[b]);
      const float dr = 0.5f * (zr_[a] - zr_[b]);
      const float di = 0.5f * (zi_[a] + zi_[b]);
      const float or_ = di;   // (dr + j di) / j
      const float oi = -dr;
      const float wr = cos_[k * step];
      const float wi = -sin_[k * step];
      re[k] = er + wr * or_ - wi * oi;
      im[k] = ei + wr * oi + wi * or_;
    }
  }

  void inverse(const float* re, const float* im, float* x, int n) {
    const int m = n / 2;
    const int step = MaxN / n;
    for (int k = 0; k < m; ++k) {
      const int b = m - k;
      // E = (X[k] + conj X[m-k]) / 2, O = (X[k] - conj X[m-k]) / 2 * e^(+j 2 pi k / n)
      const float er = 0.5f * (re[k] + re[b]);
      const float ei = 0.5f * (im[k] - im[b]);
      const float dr = 0.5f * (re[k] - re[b]);
      const float di = 0.5f * (im[k] + im[b]);
      const float wr = cos_[k * step];
      const float wi = sin_[k * step];
      const float or_ = dr * wr - di * wi;
      const float oi = dr * wi + di * wr;
      // Z = E + j O
      zr_[k] = er - oi;
      zi_[k] = ei + or_;
    }
    transform(m, true);
    for (int i = 0; i < m; ++i) {
      x[2 * i] = zr_[i];
      x[2 * i + 1] = zi_[i];
    }
  }

 private:
  // In-place radix-2 complex FFT of zr_/zi_[0..m), unscaled both ways.
  void transform(int m, bool inverse) {
    int shift = 0;
    while ((m << shift) < kMaxHalf) ++shift;
    for (int i = 0; i < m; ++i) {
      const int j = reverse_[i] >> shift;
      if (j > i) {
        const float tr = zr_[i];
        zr_[i] = zr_[j];
        zr_[j] = tr;
        const float ti = zi_[i];
        zi_[i] = zi_[j];
        zi_[j] = ti;
      }
    }
    const float sign = inverse ? 1.0f : -1.0f;
    // The first two stages together: their twiddles are 1 and ±j.
    for (int i = 0; i + 3 < m; i += 4) {
      const float ar = zr_[i] + zr_[i + 1], ai = zi_[i] + zi_[i + 1];
      const float br = zr_[i] - zr_[i + 1], bi = zi_[i] - zi_[i + 1];
      const float cr = zr_[i + 2] + zr_[i + 3], ci = zi_[i + 2] + zi_[i + 3];
      const float dr = zr_[i + 2] - zr_[i + 3], di = zi_[i + 2] - zi_[i + 3];
      const float xr = -sign * di, xi = sign * dr;  // ±j × d
      zr_[i] = ar + cr;
      zi_[i] = ai + ci;
      zr_[i + 2] = ar - cr;
      zi_[i + 2] = ai - ci;
      zr_[i + 1] = br + xr;
      zi_[i + 1] = bi + xi;
      zr_[i + 3] = br - xr;
      zi_[i + 3] = bi - xi;
    }
    for (int size = 8; size <= m; size <<= 1) {
      const int half = size >> 1;
      const int stride = MaxN / size;  // e^(-j 2 pi k / size)
      for (int start = 0; start < m; start += size) {
        float* ar = zr_ + start;
        float* ai = zi_ + start;
        float* br = ar + half;
        float* bi = ai + half;
        for (int k = 0; k < half; ++k) {
          const float wr = cos_[k * stride];
          const float wi = sign * sin_[k * stride];
          const float xr = br[k] * wr - bi[k] * wi;
          const float xi = br[k] * wi + bi[k] * wr;
          br[k] = ar[k] - xr;
          bi[k] = ai[k] - xi;
          ar[k] += xr;
          ai[k] += xi;
        }
      }
    }
  }

  int reverse_[kMaxHalf] = {};
  float cos_[kMaxHalf + 1] = {};
  float sin_[kMaxHalf + 1] = {};
  float zr_[kMaxHalf] = {};
  float zi_[kMaxHalf] = {};
};

}  // namespace sustainer_detail
}  // namespace livemix
