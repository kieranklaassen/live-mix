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

  // forward() for a real signal, in half the butterflies. The spectrum of a
  // real signal mirrors itself (X[N-k] is the conjugate of X[k]), and so does
  // every stage on the way to it, so only the lower half of each is worked
  // out, by forward()'s arithmetic in forward()'s order: bins 0..N/2 are the
  // floats forward() leaves there when im starts at zero (test_real_fft in
  // cpp/test/kit_test.cpp). Two things can differ: the sign of a zero, and a
  // real part that cancels exactly. All that is left of that is the 6e-17
  // the table holds for the cosine of a quarter turn, and forward() carries
  // it into its mirrored half with the other sign: 1e-16 of the bin.
  //
  // The half spectrum comes packed in one array of N:
  //
  //   out[k]     = Re X[k],  k = 0..N/2
  //   out[N - k] = Im X[k],  k = 1..N/2-1   (Im X[0] and Im X[N/2] are zero)
  //
  // `sample(n)` is x[n], asked for once per n in bit-reversed order, so the
  // caller can window the signal or unwrap a ring on the way in.
  template <typename Source>
  void forward_real(const Source& sample, float* out) const {
    static_assert(N >= 8, "forward_real needs at least 8 points");
    // The twiddle a quarter of the way round: -j, but for a cosine that the
    // table holds as 6e-17 and forward() multiplies by all the same.
    const float cq = cos_[N / 4];
    const float sq = sin_[N / 4];
    // Sizes 2 and 4 in one pass, straight from the signal: four samples make
    // bins 0, 1 and 2 of their transform (re 0, re 1, re 2, im 1).
    for (int i = 0; i < N; i += 4) {
      const int n = reverse_[i];
      const float a = sample(n);
      const float b = sample(n + N / 2);
      const float c = sample(n + N / 4);
      const float d = sample(n + N / 4 + N / 2);
      const float e0 = a + b;
      const float e1 = a - b;
      const float o0 = c + d;
      const float o1 = c - d;
      const float xr = o1 * cq;
      out[i] = e0 + o0;
      out[i + 1] = e1 + xr;
      out[i + 2] = e0 - o0;
      out[i + 3] = o1 * sq;
    }
    // The sizes from 8 up two at a time, after one on its own when their
    // number is odd.
    int size = 8;
    int sizes = 0;
    for (int s = 8; s <= N; s <<= 1) ++sizes;
    if (sizes & 1) {
      real_stage(out, size);
      size <<= 1;
    }
    for (; size < N; size <<= 2) real_stage_pair(out, size);
  }

 private:
  // One stage of forward_real: every two packed transforms of size/2 points
  // that lie side by side become one of `size` points.
  void real_stage(float* out, int size) const {
    const int half = size >> 1;
    const int quarter = size >> 2;
    const int stride = N / size;
    const float cq = cos_[N / 4];
    const float sq = sin_[N / 4];
    for (int start = 0; start < N; start += size) {
      float* even = out + start;
      float* odd = even + half;
      // Bins 0 and half are real: the twiddle is 1.
      const float dc = odd[0];
      odd[0] = even[0] - dc;
      even[0] += dc;
      // Bin quarter: both inputs are real and the twiddle is (cq, sq).
      const float qr = odd[quarter] * cq;
      odd[quarter] = odd[quarter] * sq;
      even[quarter] += qr;
      for (int k = 1; k < quarter; ++k) {
        const float wr = cos_[k * stride];
        const float wi = sin_[k * stride];
        const float ar = even[k];
        const float ai = even[half - k];
        const float br = odd[k];
        const float bi = odd[half - k];
        const float xr = br * wr - bi * wi;
        const float xi = br * wi + bi * wr;
        // Bin k, and bin half-k: the conjugate of what forward() puts in bin
        // k+half.
        even[k] = ar + xr;
        odd[half - k] = ai + xi;
        even[half - k] = ar - xr;
        odd[k] = xi - ai;
      }
    }
  }

  // real_stage for `size` and then for twice `size`, in one pass: the eight
  // floats the two butterflies of the first stage touch (four in each of the
  // two transforms that the second stage joins) are the eight the second
  // stage's two butterflies touch. Every value is the one real_stage would
  // have made; it only never goes back to memory in between.
  void real_stage_pair(float* out, int size) const {
    const int half = size >> 1;
    const int quarter = size >> 2;
    const int stride = N / size;      // of the first stage's twiddles
    const int stride2 = stride >> 1;  // of the second's
    const float cq = cos_[N / 4];
    const float sq = sin_[N / 4];
    const float cr = cos_[N / 8];
    const float ci = sin_[N / 8];
    for (int start = 0; start < N; start += 2 * size) {
      float* p = out + start;
      float* q = p + size;
      {
        // Bins 0 and half of both, then bins 0, size and half of the whole.
        const float y0 = p[0] + p[half];
        const float yh = p[0] - p[half];
        const float z0 = q[0] + q[half];
        const float zh = q[0] - q[half];
        const float xr = zh * cq;
        p[0] = y0 + z0;
        q[0] = y0 - z0;
        p[half] = yh + xr;
        q[half] = zh * sq;
      }
      {
        // Bin quarter of both, then bins quarter and size-quarter of the
        // whole: the twiddle there is an eighth of the way round.
        const float yq = p[quarter + half] * cq;
        const float yr = p[quarter] + yq;
        const float yi = p[quarter + half] * sq;
        const float zq = q[quarter + half] * cq;
        const float zr = q[quarter] + zq;
        const float zi = q[quarter + half] * sq;
        const float xr = zr * cr - zi * ci;
        const float xi = zr * ci + zi * cr;
        p[quarter] = yr + xr;
        q[quarter + half] = yi + xi;
        p[quarter + half] = yr - xr;
        q[quarter] = xi - yi;
      }
      for (int k = 1; k < quarter; ++k) {
        // First stage, bins k and half-k of both transforms.
        const float wr = cos_[k * stride];
        const float wi = sin_[k * stride];
        const float ar = p[k];
        const float ai = p[half - k];
        const float br = p[half + k];
        const float bi = p[size - k];
        const float xr = br * wr - bi * wi;
        const float xi = br * wi + bi * wr;
        const float yr = ar + xr;  // bin k
        const float yi = ai + xi;
        const float ur = ar - xr;  // bin half-k
        const float ui = xi - ai;
        const float er = q[k];
        const float ei = q[half - k];
        const float fr = q[half + k];
        const float fi = q[size - k];
        const float gr = fr * wr - fi * wi;
        const float gi = fr * wi + fi * wr;
        const float zr = er + gr;
        const float zi = ei + gi;
        const float vr = er - gr;
        const float vi = gi - ei;
        // Second stage, bins k and size-k of the whole.
        const float w2r = cos_[k * stride2];
        const float w2i = sin_[k * stride2];
        const float tr = zr * w2r - zi * w2i;
        const float ti = zr * w2i + zi * w2r;
        p[k] = yr + tr;
        q[size - k] = yi + ti;
        p[size - k] = yr - tr;
        q[k] = ti - yi;
        // And bins half-k and half+k.
        const float w3r = cos_[N / 4 - k * stride2];
        const float w3i = sin_[N / 4 - k * stride2];
        const float sr = vr * w3r - vi * w3i;
        const float si = vr * w3i + vi * w3r;
        p[half - k] = ur + sr;
        q[half + k] = ui + si;
        p[half + k] = ur - sr;
        q[half - k] = si - ui;
      }
    }
  }

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
