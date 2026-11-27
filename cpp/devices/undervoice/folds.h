#pragma once

// The two pairs of folds under one key, four singers at a time.
//
// The true folds make one pulse of air for every cycle of the key: flow that
// rises while they are open, x²(1 - x) over the open share of the cycle, and
// nothing while they are shut. What leaves the lips is its slope,
//
//   x (2 - 3x)   open        0   shut,
//
// whose step at the closure is what rings the throat. The step and the two
// corners are rounded off over one sample either side (a step and a ramp of
// the second and third order), so nothing audible folds back at the top of
// the keyboard.
//
// The false folds lie above them and turn once for every n pulses. Their
// gate is one hump over those n cycles, zero where one group ends and the
// next begins, so no setting of it can step:
//
//   u = (pulses counted + phase) / n     0 .. 1 over the group
//   t = u / rise, then (1 - u) / (1 - rise)
//   w = t² (3 - 2t), narrowed towards its fourth power
//   gate = 1 - depth (1 - w)
//
// Counting the pulses instead of running a second oscillator is what keeps
// the undertone exactly in tune: it is the key's own phase divided.

#include <cstdint>

#include "../../kit/math.h"

namespace livemix {
namespace undervoice_dsp {

typedef float F4 __attribute__((vector_size(16)));
typedef int32_t I4 __attribute__((vector_size(16)));

inline F4 splat(float x) { return F4{x, x, x, x}; }
inline F4 pick(I4 mask, F4 yes, F4 no) { return reinterpret_cast<F4>((mask & reinterpret_cast<I4>(yes)) | (~mask & reinterpret_cast<I4>(no))); }
inline F4 size_of(F4 x) { return reinterpret_cast<F4>(reinterpret_cast<I4>(x) & I4{0x7fffffff, 0x7fffffff, 0x7fffffff, 0x7fffffff}); }
inline F4 positive(F4 x) { return pick(x > splat(0.0f), x, splat(0.0f)); }
inline F4 lesser(F4 a, F4 b) { return pick(a < b, a, b); }
inline float sum_of(F4 x) { return (x[0] + x[1]) + (x[2] + x[3]); }

// The slope of the flow at phase `p`, for an open share `open` of the cycle
// and a phase step `inc` with `per_inc` its inverse.
inline F4 flow_slope(F4 p, float open, float inv_open, F4 inc, F4 per_inc) {
  const F4 one = splat(1.0f), zero = splat(0.0f);
  const F4 x = p * inv_open;
  F4 value = pick(p < splat(open), x * (2.0f - 3.0f * x), zero);
  const F4 corner = (2.0f / 6.0f) * inv_open * inc;
  const F4 d0 = p - pick(p > splat(0.5f), one, zero);
  const F4 v0 = positive(one - size_of(d0) * per_inc);
  value += corner * (v0 * v0 * v0);
  const F4 d1 = p - open;
  const F4 v1 = positive(one - size_of(d1) * per_inc);
  const F4 v2 = v1 * v1;
  value += 2.0f * corner * (v2 * v1);
  const F4 half = 0.5f * v2;
  return value + pick(d1 < zero, half, -half);
}

// The false folds' hump over one group.
struct Hump {
  float rise = 0.3f, inv_rise = 1.0f / 0.3f, inv_fall = 1.0f / 0.7f;
  float narrow = 0.0f;

  void set(float rise_share, float narrowness) {
    rise = rise_share;
    inv_rise = 1.0f / rise;
    inv_fall = 1.0f / (1.0f - rise);
    narrow = narrowness;
  }
  F4 at(F4 u, float sharp) const {
    const F4 one = splat(1.0f);
    const F4 t = pick(u < splat(rise), u * inv_rise, positive((one - u) * inv_fall));
    const F4 w = t * t * (3.0f - 2.0f * t);
    const F4 w2 = w * w;
    const F4 n = w + narrow * (w2 * w2 - w);
    const F4 n2 = n * n;
    return n + sharp * (n2 * n2 - n);
  }
};

}  // namespace undervoice_dsp
}  // namespace livemix
