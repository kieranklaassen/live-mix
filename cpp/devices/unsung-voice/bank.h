#pragma once

// Turning numbers: a row of sines, each one complex number turned a little
// every sample, with a complex gain to the left and one to the right that
// move in straight lines from tick to tick. Four at a time, with the
// compiler's own vectors, so native and WASM do the same arithmetic.

#include "../../kit/kit.h"

namespace livemix {
namespace unsung {

typedef float F4 __attribute__((vector_size(16)));

inline F4 load4(const float* p) {
  F4 v;
  __builtin_memcpy(&v, p, 16);
  return v;
}
inline F4 all4(float v) { return F4{v, v, v, v}; }
inline void store4(float* p, F4 v) { __builtin_memcpy(p, &v, 16); }

template <int N>
struct Bank {
  static_assert(N % 4 == 0, "whole groups of four");
  float re[N] = {}, im[N] = {};           // where each sine is
  float turn_re[N] = {}, turn_im[N] = {};  // what it turns by a sample
  float lr[N] = {}, li[N] = {}, rr[N] = {}, ri[N] = {};  // gains now
  float tlr[N] = {}, tli[N] = {}, trr[N] = {}, tri[N] = {};  // gains at the end of the tick
  float dlr[N] = {}, dli[N] = {}, drr[N] = {}, dri[N] = {};  // a sample's share

  void silence(int from, int to) {
    for (int k = from; k < to; ++k) {
      lr[k] = li[k] = rr[k] = ri[k] = 0.0f;
      tlr[k] = tli[k] = trr[k] = tri[k] = 0.0f;
      dlr[k] = dli[k] = drr[k] = dri[k] = 0.0f;
    }
  }

  // The tick before has been rendered: the gains are where they were going,
  // and the lengths are put right for what rounding did to them.
  void land(int count) {
    for (int k = 0; k < count; ++k) {
      lr[k] = tlr[k];
      li[k] = tli[k];
      rr[k] = trr[k];
      ri[k] = tri[k];
      const float fix = 1.5f - 0.5f * (re[k] * re[k] + im[k] * im[k]);
      re[k] *= fix;
      im[k] *= fix;
    }
  }

  void aim(int count, float per_sample) {
    for (int k = 0; k < count; ++k) {
      dlr[k] = (tlr[k] - lr[k]) * per_sample;
      dli[k] = (tli[k] - li[k]) * per_sample;
      drr[k] = (trr[k] - rr[k]) * per_sample;
      dri[k] = (tri[k] - ri[k]) * per_sample;
    }
  }

  void render(int count, int n, F4* left, F4* right) {
    for (int g = 0; g < count; g += 4) {
      F4 x = load4(re + g), y = load4(im + g);
      const F4 c = load4(turn_re + g), s = load4(turn_im + g);
      F4 a = load4(lr + g), b = load4(li + g), d = load4(rr + g), e = load4(ri + g);
      const F4 da = load4(dlr + g), db = load4(dli + g), dd = load4(drr + g), de = load4(dri + g);
      for (int i = 0; i < n; ++i) {
        left[i] += a * x - b * y;
        right[i] += d * x - e * y;
        a += da;
        b += db;
        d += dd;
        e += de;
        const F4 turned = x * c - y * s;
        y = x * s + y * c;
        x = turned;
      }
      store4(re + g, x);
      store4(im + g, y);
      store4(lr + g, a);
      store4(li + g, b);
      store4(rr + g, d);
      store4(ri + g, e);
    }
  }
};

inline float smoothstep(float t) {
  t = kit::clamp(t, 0.0f, 1.0f);
  return t * t * (3.0f - 2.0f * t);
}

}  // namespace unsung
}  // namespace livemix
