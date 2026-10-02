#pragma once

// The lapped transform of Low Bitrate: an MDCT (and the matching MDST) of a
// size chosen at run time, on one radix-2 complex FFT of a quarter of the
// window length. kit::Fft has its size fixed at compile time and the device
// needs three sizes at once, so the transform lives here.
//
//   X[k] = sum over n of x[n] cos(pi/N (n + 1/2 + N/2)(k + 1/2)),  n < 2N, k < N
//
// (Princen and Bradley, "Analysis/synthesis filter bank design based on time
// domain aliasing cancellation", 1986.) With the sine window before the
// forward transform and again after the inverse, frames N apart add up to
// the input. The MDST is the same sum with sin for cos; the pair is the
// complex spectrum of the frame (Malvar's modulated complex lapped
// transform), which gives each bin a magnitude that does not flicker with
// the phase of a steady tone.
//
// Both go through a DCT-IV: fold the 2N samples into N, then one N/2-point
// complex FFT between two twiddles.

#include <cmath>

namespace livemix {
namespace low_bitrate_dsp {

template <int MaxN>
class Mdct {
 public:
  static_assert((MaxN & (MaxN - 1)) == 0, "MaxN must be a power of two");

  // n coefficients per frame (a power of two, 8 <= n <= MaxN).
  void init(int n) {
    n_ = n;
    const int m = n / 2;
    int bits = 0;
    while ((1 << bits) < m) ++bits;
    for (int i = 0; i < m; ++i) {
      int reversed = 0;
      for (int b = 0; b < bits; ++b) {
        if (i & (1 << b)) reversed |= 1 << (bits - 1 - b);
      }
      reverse_[i] = static_cast<short>(reversed);
    }
    const double pi = 3.14159265358979323846;
    for (int i = 0; i < m / 2; ++i) {
      fft_cos_[i] = static_cast<float>(std::cos(-2.0 * pi * i / m));
      fft_sin_[i] = static_cast<float>(std::sin(-2.0 * pi * i / m));
    }
    for (int i = 0; i < m; ++i) {
      const double angle = -pi * (8.0 * i + 1.0) / (8.0 * n);
      twiddle_re_[i] = static_cast<float>(std::cos(angle));
      twiddle_im_[i] = static_cast<float>(std::sin(angle));
    }
    for (int i = 0; i < 2 * n; ++i) {
      window_[i] = static_cast<float>(std::sin(pi * (i + 0.5) / (2.0 * n)));
    }
  }

  int size() const { return n_; }
  const float* window() const { return window_; }

  // 2N windowed samples in, N cosine coefficients out.
  void forward(const float* x, float* out) {
    const int m = n_ / 2;
    for (int j = 0; j < m; ++j) {
      fold_[j] = -x[3 * m - 1 - j] - x[3 * m + j];
      fold_[m + j] = x[j] - x[2 * m - 1 - j];
    }
    dct4(fold_, out);
  }

  // 2N windowed samples in, N sine coefficients out.
  void forward_sine(const float* x, float* out) {
    const int m = n_ / 2;
    // DST-IV(v)[k] = (-1)^k DCT-IV(v reversed)[k]; v = [c_r - d, a + b_r].
    for (int j = 0; j < m; ++j) {
      fold_[n_ - 1 - j] = x[3 * m - 1 - j] - x[3 * m + j];
      fold_[m - 1 - j] = x[j] + x[2 * m - 1 - j];
    }
    dct4(fold_, out);
    for (int k = 1; k < n_; k += 2) out[k] = -out[k];
  }

  // N cosine coefficients in, 2N samples out, scaled so that windowed
  // overlap-add of forward and inverse is the identity.
  void inverse(const float* in, float* y) {
    const int m = n_ / 2;
    dct4(in, fold_);
    const float scale = 2.0f / static_cast<float>(n_);
    for (int j = 0; j < m; ++j) {
      const float p = fold_[j] * scale;
      const float q = fold_[m + j] * scale;
      y[j] = q;
      y[2 * m - 1 - j] = -q;
      y[3 * m - 1 - j] = -p;
      y[3 * m + j] = -p;
    }
  }

 private:
  // DCT-IV of n_ points, unscaled (applied twice it gives n_/2 times the input).
  void dct4(const float* v, float* out) {
    const int n = n_;
    const int m = n / 2;
    for (int i = 0; i < m; ++i) {
      const float a = v[2 * i];
      const float b = v[n - 1 - 2 * i];
      const int at = reverse_[i];
      re_[at] = a * twiddle_re_[i] - b * twiddle_im_[i];
      im_[at] = a * twiddle_im_[i] + b * twiddle_re_[i];
    }
    for (int size = 2; size <= m; size <<= 1) {
      const int half = size >> 1;
      const int stride = m / size;
      for (int start = 0; start < m; start += size) {
        for (int k = 0; k < half; ++k) {
          const float wr = fft_cos_[k * stride];
          const float wi = fft_sin_[k * stride];
          const int a = start + k;
          const int b = a + half;
          const float xr = re_[b] * wr - im_[b] * wi;
          const float xi = re_[b] * wi + im_[b] * wr;
          re_[b] = re_[a] - xr;
          im_[b] = im_[a] - xi;
          re_[a] += xr;
          im_[a] += xi;
        }
      }
    }
    for (int k = 0; k < m; ++k) {
      const float yr = re_[k] * twiddle_re_[k] - im_[k] * twiddle_im_[k];
      const float yi = re_[k] * twiddle_im_[k] + im_[k] * twiddle_re_[k];
      out[2 * k] = yr;
      out[n - 1 - 2 * k] = -yi;
    }
  }

  int n_ = 8;
  short reverse_[MaxN / 2] = {};
  float fft_cos_[MaxN / 4] = {};
  float fft_sin_[MaxN / 4] = {};
  float twiddle_re_[MaxN / 2] = {};
  float twiddle_im_[MaxN / 2] = {};
  float window_[2 * MaxN] = {};
  float fold_[MaxN] = {};
  float re_[MaxN / 2] = {};
  float im_[MaxN / 2] = {};
};

}  // namespace low_bitrate_dsp
}  // namespace livemix
