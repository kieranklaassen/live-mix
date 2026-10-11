#pragma once

#include "../../kit/filters.h"
#include "../../kit/math.h"

namespace livemix {
namespace graft {

// A band-pass that turns no phase at its centre and has unity gain there:
// the kit's Svf (the same trapezoidal form) keeping only what a loop needs.
// Its owner flushes it once a chunk instead of once a sample.
struct Band {
  float ic1 = 0.0f, ic2 = 0.0f;
  float a1 = 0.0f, a2 = 0.0f, a3 = 0.0f, k = 1.0f, g = 0.0f;

  void reset() { ic1 = ic2 = 0.0f; }
  void set(float hz, float q, float sample_rate) {
    g = kit::tan_prewarp(kit::kPi * kit::clamp(hz, 5.0f, sample_rate * 0.49f) / sample_rate);
    set_q(q);
  }
  // The width alone, at the centre last set: cheap enough for every control tick.
  void set_q(float q) {
    k = 1.0f / kit::max(q, 0.1f);
    a1 = 1.0f / (1.0f + g * (g + k));
    a2 = g * a1;
    a3 = g * a2;
  }
  float pass(float x) {
    const float v3 = x - ic2;
    const float v1 = a1 * ic1 + a2 * v3;
    const float v2 = ic2 + a2 * ic1 + a3 * v3;
    ic1 = 2.0f * v1 - ic1;
    ic2 = 2.0f * v2 - ic2;
    return v1 * k;
  }
  void flush() {
    ic1 = flush_denormal(ic1);
    ic2 = flush_denormal(ic2);
  }
};

}  // namespace graft
}  // namespace livemix
