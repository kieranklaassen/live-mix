#pragma once

// The frame of Wire Lantern: four wires for each of the last twelve keys, an
// open fifth and the octave and twelfth over it, driven by the sum of all
// voices. Nothing goes back from it, so it cannot run away.

#include <cmath>
#include <cstdint>

#include "../../kit/math.h"

namespace livemix {
namespace wire_lantern_solids {

// Four lines at a time: the compiler's own vectors, which are the machine's
// where it has them.
typedef float F4 __attribute__((vector_size(16), may_alias));
inline F4* four(float* x) { return reinterpret_cast<F4*>(x); }
inline const F4* four(const float* x) { return reinterpret_cast<const F4*>(x); }

struct Frame {
  static constexpr int kKeys = 12;
  static constexpr int kWires = 4 * kKeys;
  static constexpr float kSixtyDb = 6.907755279f;

  alignas(16) float re[kWires] = {}, im[kWires] = {};
  alignas(16) float step_re[kWires] = {}, step_im[kWires] = {};
  alignas(16) float drive[kWires] = {}, left[kWires] = {}, right[kWires] = {};
  float left_to[kWires] = {}, right_to[kWires] = {};
  float frequency[kKeys] = {}, wanted[kKeys] = {};
  uint32_t used[kKeys] = {};
  uint32_t stamp = 0;
  int turn = 0;
  bool alive = false;

  // The key's own wires: the ones it has, or the ones used longest ago.
  void take(float hz) {
    alive = true;
    int oldest = 0;
    for (int k = 0; k < kKeys; ++k) {
      if (wanted[k] == hz) {
        used[k] = ++stamp;
        return;
      }
      if (used[k] < used[oldest]) oldest = k;
    }
    wanted[oldest] = hz;
    used[oldest] = ++stamp;
  }

  // Once a control tick: one key's wires at a time, since what it does is slow.
  void control(float sr, float decay, float release, float width, bool off, bool playing, bool down) {
    static const float kRatio[4] = {1.0f, 1.5f, 2.0f, 3.0f};
    static const float kCents[4] = {1.3f, -0.8f, -1.6f, 1.1f};
    static const float kLoud[4] = {0.8f, 0.55f, 0.55f, 0.35f};
    static const float kPan[4] = {-0.35f, 0.6f, -0.75f, 0.85f};
    float most = 0.0f;
    for (int k = 0; k < kWires; ++k) {
      const float power = re[k] * re[k] + im[k] * im[k];
      if (off || power < 1.0e-14f) {
        re[k] = im[k] = 0.0f;
      } else {
        most += power;
      }
    }
    const int f = turn;
    turn = f + 1 == kKeys ? 0 : f + 1;
    const int at = 4 * f;
    float power = 0.0f;
    for (int k = at; k < at + 4; ++k) power += re[k] * re[k] + im[k] * im[k];
    if (wanted[f] != frequency[f] && power < 1.0e-10f) {
      frequency[f] = wanted[f];
      for (int k = at; k < at + 4; ++k) re[k] = im[k] = 0.0f;
    }
    const float hz = frequency[f];
    const bool gone = wanted[f] != hz;
    // It rings with the keys, and is damped with the last of them.
    float ring = 2.5f + 0.5f * kit::min(decay, 14.0f);
    if (!down) ring = kit::min(ring, 0.5f + 1.6f * release);
    // Each key's wires lean to a side of their own.
    const float side = (f & 1) ? -1.0f : 1.0f;
    for (int j = 0; j < 4 && hz > 0.0f; ++j) {
      const int k = at + j;
      const float hertz = hz * kRatio[j] * kit::cents_to_ratio(kCents[j]);
      const float quick = std::pow(hertz * (1.0f / 220.0f), 0.35f);
      const float nepers = kSixtyDb / (sr * (gone ? 0.02f : ring / kit::max(quick, 0.5f)));
      const float edge = kit::clamp((9000.0f - hertz) * (1.0f / 4000.0f), 0.0f, 1.0f);
      const float w = kit::kTwoPi * kit::min(hertz, 0.45f * sr) / sr;
      const float radius = std::exp(-nepers);
      step_re[k] = radius * std::cos(w);
      step_im[k] = radius * std::sin(w);
      drive[k] = gone ? 0.0f : 2.0f * nepers * kLoud[j] * edge;
      kit::pan_gains(side * kPan[j] * width, &left_to[k], &right_to[k]);
    }
    for (int k = 0; k < kWires; ++k) {
      left[k] += 0.02f * (left_to[k] - left[k]);
      right[k] += 0.02f * (right_to[k] - right[k]);
    }
    if (!playing && (most < 1.0e-12f || off)) {
      const Frame rest = Frame();
      *this = rest;
    }
  }

  void render(int n, const float* in_left, const float* in_right, float* out_left, float* out_right) {
    float mono[64];
    for (int i = 0; i < n; ++i) mono[i] = 0.7071f * (in_left[i] + in_right[i]);
    F4 sum_left[64] = {}, sum_right[64] = {};
    for (int f = 0; f < kKeys; ++f) {
      if (frequency[f] <= 0.0f) continue;
      const int k = 4 * f;
      F4 real = *four(re + k), imag = *four(im + k);
      const F4 c = *four(step_re + k), s = *four(step_im + k), push = *four(drive + k);
      const F4 l = *four(left + k), r = *four(right + k);
      for (int i = 0; i < n; ++i) {
        const F4 turned = c * real - s * imag + push * mono[i];
        imag = c * imag + s * real;
        real = turned;
        sum_left[i] += l * imag;
        sum_right[i] += r * imag;
      }
      *four(re + k) = real;
      *four(im + k) = imag;
    }
    for (int i = 0; i < n; ++i) {
      const F4 l = sum_left[i], r = sum_right[i];
      out_left[i] = (l[0] + l[1]) + (l[2] + l[3]);
      out_right[i] = (r[0] + r[1]) + (r[2] + r[3]);
    }
  }
};

}  // namespace wire_lantern_solids
}  // namespace livemix
