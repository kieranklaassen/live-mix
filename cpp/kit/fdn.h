#pragma once

#include "math.h"

namespace livemix {
namespace kit {

// Orthogonal mixing matrices for feedback delay networks, in place. Both are
// lossless (energy in = energy out), so the loop gain of a network is set by
// the per-line gains alone.

// Fast Walsh-Hadamard transform, N a power of two, scaled by 1/sqrt(N).
template <int N>
inline void hadamard(float* v) {
  static_assert((N & (N - 1)) == 0, "hadamard size must be a power of two");
  for (int half = 1; half < N; half <<= 1) {
    for (int i = 0; i < N; i += half << 1) {
      for (int j = i; j < i + half; ++j) {
        const float a = v[j];
        const float b = v[j + half];
        v[j] = a + b;
        v[j + half] = a - b;
      }
    }
  }
  const float scale = 1.0f / std::sqrt(static_cast<float>(N));
  for (int i = 0; i < N; ++i) v[i] *= scale;
}

// Householder reflection I - (2/N)·11ᵀ: every line feeds every other equally.
template <int N>
inline void householder(float* v) {
  float sum = 0.0f;
  for (int i = 0; i < N; ++i) sum += v[i];
  sum *= 2.0f / static_cast<float>(N);
  for (int i = 0; i < N; ++i) v[i] -= sum;
}

// Mutually prime-ish delay lengths spread geometrically between `shortest`
// and `longest` samples, nudged to odd numbers so the lines' modes interleave
// instead of stacking.
template <int N>
inline void spread_lengths(float shortest, float longest, int* lengths) {
  for (int i = 0; i < N; ++i) {
    const float t = N > 1 ? static_cast<float>(i) / static_cast<float>(N - 1) : 0.0f;
    int length = static_cast<int>(shortest * std::pow(longest / shortest, t));
    length |= 1;
    // Keep neighbours from sharing a factor of three or five.
    while (i > 0 && (length % 3 == 0 || length % 5 == 0 || length == lengths[i - 1])) length += 2;
    lengths[i] = length;
  }
}

// The per-pass gain that makes a loop of `delay_samples` decay 60 dB in
// `rt60_seconds`.
inline float rt60_gain(float delay_samples, float rt60_seconds, float sample_rate) {
  if (!(rt60_seconds > 0.0f)) return 0.0f;
  return std::pow(10.0f, -3.0f * delay_samples / (rt60_seconds * sample_rate));
}

}  // namespace kit
}  // namespace livemix
