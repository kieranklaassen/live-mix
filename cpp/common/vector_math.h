#pragma once

#include <cmath>

#if defined(__wasm_simd128__)
#include <wasm_simd128.h>
#endif

namespace livemix {

// Eight sines and eight hyperbolic tangents at a time, for a device built with
// the vector instructions (EXTRA_FLAGS="-msimd128" in scripts/build-wasm.sh).
// They give what std::sin and std::tanh give of each number by itself, bit for
// bit: the same polynomials in the same order as the C library the devices are
// built with. A device moves to these with its sound unchanged.

#if defined(__wasm_simd128__)
namespace vector_math {

// Two sines of angles from 0 to 2 pi, held as doubles.
inline v128_t sin_turn_f64x2(v128_t x) {
  constexpr double kHalfPi = 1.57079632679489661923;
  // Which quarter of the turn, by the C library's own edges: they lie a hair
  // off the odd multiples of pi / 4, and which polynomial answers decides the
  // last bit.
  const v128_t one = wasm_f64x2_const_splat(1.0);
  const v128_t k = wasm_f64x2_add(
      wasm_f64x2_add(
          wasm_v128_and(wasm_f64x2_gt(x, wasm_f64x2_const_splat(0x1.921fb4p-1)), one),
          wasm_v128_and(wasm_f64x2_gt(x, wasm_f64x2_const_splat(0x1.2d97c6p+1)), one)),
      wasm_f64x2_add(
          wasm_v128_and(wasm_f64x2_gt(x, wasm_f64x2_const_splat(0x1.f6a7a2p+1)), one),
          wasm_v128_and(wasm_f64x2_gt(x, wasm_f64x2_const_splat(0x1.5fdbbep+2)), one)));
  const v128_t y = wasm_f64x2_sub(x, wasm_f64x2_mul(k, wasm_f64x2_const_splat(kHalfPi)));
  const v128_t z = wasm_f64x2_mul(y, y);
  const v128_t w = wasm_f64x2_mul(z, z);

  const v128_t s = wasm_f64x2_mul(z, y);
  const v128_t sr = wasm_f64x2_add(
      wasm_f64x2_const_splat(-0x1a00f9e2cae774.0p-65),
      wasm_f64x2_mul(z, wasm_f64x2_const_splat(0x16cd878c3b46a7.0p-71)));
  const v128_t sine = wasm_f64x2_add(
      wasm_f64x2_add(
          y, wasm_f64x2_mul(
                 s, wasm_f64x2_add(wasm_f64x2_const_splat(-0x15555554cbac77.0p-55),
                                   wasm_f64x2_mul(
                                       z, wasm_f64x2_const_splat(0x111110896efbb2.0p-59))))),
      wasm_f64x2_mul(wasm_f64x2_mul(s, w), sr));

  const v128_t cr = wasm_f64x2_add(
      wasm_f64x2_const_splat(-0x16c087e80f1e27.0p-62),
      wasm_f64x2_mul(z, wasm_f64x2_const_splat(0x199342e0ee5069.0p-68)));
  const v128_t cosine = wasm_f64x2_add(
      wasm_f64x2_add(
          wasm_f64x2_add(one, wasm_f64x2_mul(z, wasm_f64x2_const_splat(-0x1ffffffd0c5e81.0p-54))),
          wasm_f64x2_mul(w, wasm_f64x2_const_splat(0x155553e1053a42.0p-57))),
      wasm_f64x2_mul(wasm_f64x2_mul(w, z), cr));

  // Quarters 1 and 3 are cosines, 2 and 3 turned over.
  const v128_t odd = wasm_v128_or(wasm_f64x2_eq(k, one), wasm_f64x2_eq(k, wasm_f64x2_const_splat(3.0)));
  const v128_t over = wasm_v128_or(wasm_f64x2_eq(k, wasm_f64x2_const_splat(2.0)),
                                   wasm_f64x2_eq(k, wasm_f64x2_const_splat(3.0)));
  const v128_t value = wasm_v128_bitselect(cosine, sine, odd);
  return wasm_v128_xor(value, wasm_v128_and(over, wasm_f64x2_const_splat(-0.0)));
}

// Four sines of angles from 0 to 2 pi.
inline v128_t sin_turn_f32x4(v128_t x) {
  const v128_t low = wasm_f32x4_demote_f64x2_zero(
      sin_turn_f64x2(wasm_f64x2_promote_low_f32x4(x)));
  const v128_t high = wasm_f32x4_demote_f64x2_zero(
      sin_turn_f64x2(wasm_f64x2_promote_low_f32x4(wasm_i32x4_shuffle(x, x, 2, 3, 2, 3))));
  return wasm_i32x4_shuffle(low, high, 0, 1, 4, 5);
}

// Four tangents of numbers within +/- 0.1733 (half of 0.5 ln 2): the
// library's shortest path, which a quiet sound takes all the time.
inline v128_t tanh_small_f32x4(v128_t value) {
  const v128_t sign = wasm_v128_and(value, wasm_i32x4_const_splat(static_cast<int>(0x80000000)));
  const v128_t magnitude = wasm_v128_xor(value, sign);
  const v128_t x = wasm_f32x4_mul(wasm_f32x4_const_splat(-2.0f), magnitude);
  const v128_t hfx = wasm_f32x4_mul(wasm_f32x4_const_splat(0.5f), x);
  const v128_t hxs = wasm_f32x4_mul(x, hfx);
  const v128_t r1 = wasm_f32x4_add(
      wasm_f32x4_const_splat(1.0f),
      wasm_f32x4_mul(hxs, wasm_f32x4_add(wasm_f32x4_const_splat(-3.3333212137e-2f),
                                         wasm_f32x4_mul(hxs, wasm_f32x4_const_splat(
                                                                 1.5807170421e-3f)))));
  const v128_t t = wasm_f32x4_sub(wasm_f32x4_const_splat(3.0f), wasm_f32x4_mul(r1, hfx));
  const v128_t e = wasm_f32x4_mul(
      hxs, wasm_f32x4_div(wasm_f32x4_sub(r1, t),
                          wasm_f32x4_sub(wasm_f32x4_const_splat(6.0f), wasm_f32x4_mul(x, t))));
  const v128_t grown = wasm_f32x4_sub(x, wasm_f32x4_sub(wasm_f32x4_mul(x, e), hxs));
  // Under 2^-25 the library hands the number back.
  const v128_t tiny = wasm_f32x4_gt(x, wasm_f32x4_const_splat(-0x1p-25f));
  const v128_t expm1 = wasm_v128_bitselect(x, grown, tiny);
  const v128_t result = wasm_f32x4_div(
      wasm_f32x4_neg(expm1), wasm_f32x4_add(expm1, wasm_f32x4_const_splat(2.0f)));
  return wasm_v128_xor(result, sign);
}

}  // namespace vector_math
#endif

// `out[i] = std::sin(angle[i])` of eight angles from 0 to 2 pi.
inline void sin_turn_8(const float* angle, float* out) {
#if defined(__wasm_simd128__)
  wasm_v128_store(out, vector_math::sin_turn_f32x4(wasm_v128_load(angle)));
  wasm_v128_store(out + 4, vector_math::sin_turn_f32x4(wasm_v128_load(angle + 4)));
#else
  for (int i = 0; i < 8; ++i) out[i] = std::sin(angle[i]);
#endif
}

// `values[i] = std::tanh(values[i])` of eight numbers.
inline void tanh_8(float* values) {
  for (int four = 0; four < 8; four += 4) {
#if defined(__wasm_simd128__)
    const v128_t value = wasm_v128_load(values + four);
    // 0.5 ln 2 as the library has it, where its short path ends: it is asked
    // of twice the number. The comparison is false of a NaN.
    const v128_t edge = wasm_f32x4_const_splat(0.5f * 0x1.62e430p-2f);
    if (wasm_i32x4_all_true(wasm_f32x4_le(wasm_f32x4_abs(value), edge))) {
      wasm_v128_store(values + four, vector_math::tanh_small_f32x4(value));
      continue;
    }
#endif
    for (int i = four; i < four + 4; ++i) values[i] = std::tanh(values[i]);
  }
}

}  // namespace livemix
