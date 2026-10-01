#pragma once

// The kit: JUCE-free building blocks shared by the ambient devices
// (cpp/devices/*). Header-only, no allocation, no exceptions, no RTTI; every
// block keeps its state in plain members so a device is one static object.
// Feedback paths flush denormals in software because WASM has no
// flush-to-zero.

#include <cmath>
#include <cstdint>

#include "../common/dsp_util.h"

namespace livemix {
namespace kit {

constexpr float kPi = 3.14159265358979323846f;
constexpr float kTwoPi = 6.28318530717958647692f;
constexpr float kHalfPi = 1.57079632679489661923f;
constexpr float kSqrtHalf = 0.70710678118654752440f;

inline float clamp(float x, float lo, float hi) { return x < lo ? lo : (x > hi ? hi : x); }
inline int clamp_int(int x, int lo, int hi) { return x < lo ? lo : (x > hi ? hi : x); }
inline float lerp(float a, float b, float t) { return a + (b - a) * t; }
inline float max(float a, float b) { return a > b ? a : b; }
inline float min(float a, float b) { return a < b ? a : b; }

inline float db_to_gain(float db) { return std::pow(10.0f, db * 0.05f); }
inline float gain_to_db(float gain) { return 20.0f * std::log10(gain < 1.0e-9f ? 1.0e-9f : gain); }
inline float midi_to_hz(float note) { return 440.0f * std::exp2((note - 69.0f) * (1.0f / 12.0f)); }
inline float hz_to_midi(float hz) {
  return 69.0f + 12.0f * std::log2((hz < 1.0e-3f ? 1.0e-3f : hz) * (1.0f / 440.0f));
}
inline float semitones_to_ratio(float semitones) { return std::exp2(semitones * (1.0f / 12.0f)); }
inline float cents_to_ratio(float cents) { return std::exp2(cents * (1.0f / 1200.0f)); }

// Rational tanh: within 2.5 % of tanh over [-3, 3], monotonic, clamps at ±1.
inline float fast_tanh(float x) {
  x = clamp(x, -3.0f, 3.0f);
  const float x2 = x * x;
  return x * (27.0f + x2) / (27.0f + 9.0f * x2);
}

// Equal-power dry/wet gains for mix in [0, 1].
inline void equal_power(float mix, float* dry_gain, float* wet_gain) {
  const float angle = clamp(mix, 0.0f, 1.0f) * kHalfPi;
  *dry_gain = std::cos(angle);
  *wet_gain = std::sin(angle);
}

// Equal-power pan gains for pan in [-1, 1].
inline void pan_gains(float pan, float* left, float* right) {
  const float angle = (clamp(pan, -1.0f, 1.0f) + 1.0f) * (kHalfPi * 0.5f);
  *left = std::cos(angle);
  *right = std::sin(angle);
}

// 4-point, 3rd-order Hermite (Catmull-Rom) between y0 and y1 at t in [0, 1).
inline float hermite(float ym1, float y0, float y1, float y2, float t) {
  const float c1 = 0.5f * (y1 - ym1);
  const float c2 = ym1 - 2.5f * y0 + 2.0f * y1 - 0.5f * y2;
  const float c3 = 0.5f * (y2 - ym1) + 1.5f * (y0 - y1);
  return ((c3 * t + c2) * t + c1) * t + y0;
}

// A time constant as a one-pole coefficient: the pole that covers 63 % of a
// step in `seconds`. Zero or negative time gives 0 (no smoothing).
inline float time_to_coeff(float seconds, float sample_rate) {
  if (!(seconds > 0.0f)) return 0.0f;
  return std::exp(-1.0f / (seconds * sample_rate));
}

// xorshift32: deterministic per seed, never allocates.
struct Rng {
  uint32_t state = 0x2545F491u;

  void seed(uint32_t value) { state = value == 0 ? 0x2545F491u : value; }

  uint32_t next_u32() {
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    return state;
  }

  // Uniform in [0, 1).
  float uniform() { return static_cast<float>(next_u32() >> 8) * (1.0f / 16777216.0f); }
  // Uniform in [-1, 1).
  float bipolar() { return uniform() * 2.0f - 1.0f; }
  // Roughly normal (sum of four uniforms), unit variance.
  float gaussian() { return (uniform() + uniform() + uniform() + uniform() - 2.0f) * 1.7320508f; }
};

// A 4097-point sine table read with linear interpolation: error below
// -100 dB, about ten times cheaper than std::sin in WASM. Phase is in cycles.
class SineTable {
 public:
  static constexpr int kSize = 4096;

  static void init() {
    if (ready()) return;
    float* table = data();
    for (int i = 0; i <= kSize; ++i) {
      table[i] = static_cast<float>(std::sin(2.0 * 3.14159265358979323846 * i / kSize));
    }
    ready() = true;
  }

  // sin(2π·phase); any finite phase.
  static float lookup(float phase) {
    phase -= std::floor(phase);
    const float position = phase * kSize;
    const int index = static_cast<int>(position);
    const float fraction = position - static_cast<float>(index);
    const float* table = data();
    return table[index] + (table[index + 1] - table[index]) * fraction;
  }

  static float cos_lookup(float phase) { return lookup(phase + 0.25f); }

 private:
  static float* data() {
    static float table[kSize + 1];
    return table;
  }
  static bool& ready() {
    static bool is_ready = false;
    return is_ready;
  }
};

}  // namespace kit
}  // namespace livemix
