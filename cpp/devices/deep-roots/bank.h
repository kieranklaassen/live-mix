#pragma once

#include "leaf_and_soil.h"

namespace livemix {
namespace deep_roots {

constexpr int kTick = 32;  // samples between two looks at levels and pitches

// Eight partials side by side.
struct Bank {
  float re[kLane] = {}, im[kLane] = {}, c[kLane] = {}, s[kLane] = {};
  float l[kLane] = {}, r[kLane] = {}, dl[kLane] = {}, dr[kLane] = {};
  bool quiet = true;

  void begin(int k, double cycles) {
    const double a = 6.283185307179586 * (cycles - std::floor(cycles));
    re[k] = static_cast<float>(std::cos(a));
    im[k] = static_cast<float>(std::sin(a));
  }
  // Turn by w radians a sample (w under 1.6), and take the drift of the
  // recurrence out.
  void aim(const float* w) {
    for (int k = 0; k < kLane; ++k) {
      const float u = w[k] * w[k];
      s[k] = w[k] * (1.0f - u * (1.0f / 6.0f - u * (1.0f / 120.0f - u * (1.0f / 5040.0f - u * (1.0f / 362880.0f)))));
      c[k] = 1.0f - u * (0.5f - u * (1.0f / 24.0f - u * (1.0f / 720.0f - u * (1.0f / 40320.0f))));
    }
    for (int k = 0; k < kLane; ++k) {
      const float g = 1.5f - 0.5f * (re[k] * re[k] + im[k] * im[k]);
      re[k] *= g;
      im[k] *= g;
    }
  }
  void ramp(const float* to_l, const float* to_r) {
    float sum = 0.0f;
    for (int k = 0; k < kLane; ++k) {
      sum += std::fabs(to_l[k]) + std::fabs(to_r[k]) + std::fabs(l[k]) + std::fabs(r[k]);
      dl[k] = (to_l[k] - l[k]) * (1.0f / kTick);
      dr[k] = (to_r[k] - r[k]) * (1.0f / kTick);
    }
    quiet = sum < 1.0e-9f;
    if (quiet) {
      for (int k = 0; k < kLane; ++k) l[k] = r[k] = dl[k] = dr[k] = 0.0f;
    }
  }
  // The end of a ramp is its target exactly.
  void land(const float* to_l, const float* to_r) {
    for (int k = 0; k < kLane; ++k) {
      l[k] = to_l[k];
      r[k] = to_r[k];
    }
  }
};

}  // namespace deep_roots
}  // namespace livemix
