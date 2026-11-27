#pragma once

// Four numbers at a time. The compilers' own vector type: the same arithmetic
// with and without the machine's vector instructions, but for the order of a sum.

#include <cstdint>

namespace livemix {
namespace closed_eyes {

typedef float V4 __attribute__((vector_size(16)));
typedef int32_t I4 __attribute__((vector_size(16)));
typedef uint32_t U4 __attribute__((vector_size(16)));

constexpr int kChunk = 32;  // samples from one aim to the next, a power of two

inline V4 splat(float x) { return V4{x, x, x, x}; }
inline V4 pick(I4 mask, V4 yes, V4 no) {
  return reinterpret_cast<V4>((mask & reinterpret_cast<I4>(yes)) | (~mask & reinterpret_cast<I4>(no)));
}
inline V4 most(V4 a, V4 b) { return pick(reinterpret_cast<I4>(a > b), a, b); }
inline V4 least(V4 a, V4 b) { return pick(reinterpret_cast<I4>(a < b), a, b); }
inline float total(V4 x) { return (x[0] + x[1]) + (x[2] + x[3]); }
inline float top(V4 x) {
  const float a = x[0] > x[1] ? x[0] : x[1];
  const float b = x[2] > x[3] ? x[2] : x[3];
  return a > b ? a : b;
}
// Add to a running sum, of which only the total is asked. Without the vector
// instructions one lane holds it all, so there is less to fetch and put back.
inline void gather(V4& sum, V4 x) {
#if defined(__wasm__) && !defined(__wasm_simd128__)
  sum[0] += total(x);
#else
  sum += x;
#endif
}
// What only dies away is let go long before it is too small to be quick with.
inline V4 let_go(V4 x) { return pick(reinterpret_cast<I4>(x > splat(1.0e-12f)), x, splat(0.0f)); }

// Partials as complex numbers that turn, in groups of four, with a level to
// the left and one to the right that move in a straight line over a chunk.
template <int Groups>
struct Bank {
  V4 re[Groups], im[Groups];       // where each is at the end of this chunk
  V4 turn_re[Groups], turn_im[Groups];  // its own turn each sample
  V4 omega[Groups];                // the same as an angle
  V4 left[Groups], right[Groups];  // levels now
  V4 left_to[Groups], right_to[Groups];
  V4 left_step[Groups], right_step[Groups];
  V4 now[Groups], stride[Groups], bow[Groups];  // what is heard, its step to the next sample, and what bends the step
  bool lit[Groups];

  void clear() {
    for (int g = 0; g < Groups; ++g) {
      re[g] = splat(1.0f);
      im[g] = turn_im[g] = omega[g] = splat(0.0f);
      turn_re[g] = splat(1.0f);
      left[g] = right[g] = left_to[g] = right_to[g] = left_step[g] = right_step[g] = splat(0.0f);
      now[g] = stride[g] = bow[g] = splat(0.0f);
      lit[g] = false;
    }
  }

  // The levels have arrived where the last chunk sent them. False when every
  // one of them is at zero.
  bool arrive() {
    bool any = false;
    for (int g = 0; g < Groups; ++g) {
      left[g] = left_to[g];
      right[g] = right_to[g];
      if (lit[g] && (top(left[g]) > 0.0f || top(right[g]) > 0.0f)) any = true;
    }
    return any;
  }

  // Send group g to these levels, its turn bent by `bend` radians a sample.
  void aim(int g, V4 to_left, V4 to_right, V4 bend, float per_chunk) {
    const V4 floor = splat(1.2e-5f);  // -98 dBFS: no partial under it is worth its turns
    to_left = pick(reinterpret_cast<I4>(to_left > floor), to_left, splat(0.0f));
    to_right = pick(reinterpret_cast<I4>(to_right > floor), to_right, splat(0.0f));
    left_to[g] = to_left;
    right_to[g] = to_right;
    lit[g] = top(left[g]) > 0.0f || top(right[g]) > 0.0f || top(to_left) > 0.0f || top(to_right) > 0.0f;
    if (!lit[g]) return;
    left_step[g] = (to_left - left[g]) * splat(per_chunk);
    right_step[g] = (to_right - right[g]) * splat(per_chunk);
    const V4 half = splat(1.0f) - splat(0.5f) * bend * bend;
    V4 c = turn_re[g] * half - turn_im[g] * bend;
    V4 s = turn_im[g] * half + turn_re[g] * bend;
    // Hold the length at 1: rounding would walk it off.
    const V4 trim = splat(1.5f) - splat(0.5f) * (re[g] * re[g] + im[g] * im[g]);
    const V4 a = re[g] * trim, b = im[g] * trim;
    // Inside the chunk a step is added that bends by what it has come to; the
    // turn itself is taken once, over all of the chunk.
    now[g] = b;
    bow[g] = splat(2.0f) * s * s / (splat(1.0f) + c);
    stride[g] = a * s + splat(0.5f) * b * bow[g];
    for (int n = 1; n < kChunk; n += n) {
      const V4 twice = c * c - s * s;
      s = splat(2.0f) * c * s;
      c = twice;
    }
    re[g] = a * c - b * s;
    im[g] = a * s + b * c;
  }

  void render(int frames, V4* out_left, V4* out_right) {
    for (int g = 0; g < Groups; ++g) {
      if (!lit[g]) continue;
      V4 l = left[g], r = right[g], y = now[g], step = stride[g];
      const V4 dl = left_step[g], dr = right_step[g], pull = bow[g];
      for (int i = 0; i < frames; ++i) {
        gather(out_left[i], y * l);
        gather(out_right[i], y * r);
        l += dl;
        r += dr;
        step -= pull * y;
        y += step;
      }
      now[g] = y;
      stride[g] = step;
      left[g] = l;
      right[g] = r;
    }
  }
};

// Four band-passes over noise of its own: a low band left and right, a high
// band left and right.
struct Noise {
  U4 seed_;
  V4 one_, two_;       // the filters' memories
  V4 a1_, a2_, a3_, k_;
  V4 level, level_to, step;
  bool lit = false;

  void clear(uint32_t seed) {
    seed_ = U4{seed, seed * 69069u + 1u, seed * 1664525u + 7u, seed * 22695477u + 3u};
    one_ = two_ = level = level_to = step = splat(0.0f);
    a1_ = a2_ = a3_ = k_ = splat(0.0f);
    lit = false;
  }

  // Bands of unit power whatever their width and the sample rate.
  void tune(float low_hz, float low_q, float high_hz, float high_q, float rate) {
    const float hz[4] = {low_hz, low_hz * 1.03f, high_hz, high_hz * 0.97f};
    const float q[4] = {low_q, low_q, high_q, high_q};
    for (int j = 0; j < 4; ++j) {
      const float f = kit::clamp(hz[j], 20.0f, 0.4f * rate);
      const float g = std::tan(kit::kPi * f / rate);
      const float k = 1.0f / q[j];
      a1_[j] = 1.0f / (1.0f + g * (g + k));
      a2_[j] = g * a1_[j];
      a3_[j] = g * a2_[j];
      // White noise of rms 0.577 through a band pi/2 * f/q wide.
      k_[j] = k / (0.577f * std::sqrt(kit::kPi * f * k / rate));
    }
  }

  void aim(V4 to, float per_chunk) {
    const V4 floor = splat(1.0e-7f);
    to = pick(reinterpret_cast<I4>(to > floor), to, splat(0.0f));
    level_to = to;
    lit = top(level) > 0.0f || top(to) > 0.0f;
    step = (to - level) * splat(per_chunk);
    if (!lit) one_ = two_ = splat(0.0f);
  }
  bool arrive() {
    level = level_to;
    return top(level) > 0.0f;
  }

  // Lanes 0 and 2 are the left, 1 and 3 the right.
  void render(int frames, V4* out_left, V4* out_right, float blend) {
    if (!lit) return;
    const float own = 1.0f / std::sqrt(1.0f + blend * blend), other = blend * own;
    const V4 left_lanes = V4{own, other, own, other}, right_lanes = V4{other, own, other, own};
    const V4 unit = splat(1.0f / 2147483648.0f);
    U4 s = seed_;
    V4 x1 = one_, x2 = two_, l = level;
    for (int i = 0; i < frames; ++i) {
      s = s * 1664525u + 1013904223u;
      const V4 white = __builtin_convertvector(reinterpret_cast<I4>(s), V4) * unit;
      const V4 v3 = white - x2;
      const V4 v1 = a1_ * x1 + a2_ * v3;
      const V4 v2 = x2 + a2_ * x1 + a3_ * v3;
      x1 = v1 + v1 - x1;
      x2 = v2 + v2 - x2;
      const V4 out = v1 * k_ * l;
      gather(out_left[i], out * left_lanes);
      gather(out_right[i], out * right_lanes);
      l += step;
    }
    seed_ = s;
    one_ = x1;
    two_ = x2;
    level = l;
  }
};

}  // namespace closed_eyes
}  // namespace livemix
