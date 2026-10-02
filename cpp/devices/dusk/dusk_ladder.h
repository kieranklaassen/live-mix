#pragma once

// The low-pass of Dusk: four one-pole stages with feedback around all four,
// the structure of kit::Ladder (trapezoidal stages, the feedback loop solved
// without a unit delay, a saturator on what enters the first stage). It is
// local because this instrument needs three things the kit's filter does not
// offer: a feedback gain above 4, so the loop keeps singing against its own
// saturation instead of dying away at exactly 4; a caller-supplied
// coefficient, so the cutoff can glide between control ticks; and a caller
// that keeps the drive low, because the originals' filter is a clean one.

#include "../../kit/filters.h"

namespace livemix {
namespace dusk_detail {

struct SingingLadder {
  float s[4] = {0.0f, 0.0f, 0.0f, 0.0f};

  void reset() { s[0] = s[1] = s[2] = s[3] = 0.0f; }

  // The stage coefficient g / (1 + g) for a cutoff in hertz.
  static float coefficient(float hz, float sample_rate) {
    const float g =
        kit::tan_prewarp(kit::kPi * kit::clamp(hz, 16.0f, sample_rate * 0.45f) / sample_rate);
    return g / (1.0f + g);
  }

  // `stage` from coefficient(); `feedback` is the loop gain, 4 at the edge of
  // self-oscillation.
  float process(float x, float stage, float feedback) {
    const float g2 = stage * stage;
    // What the four states alone put on the output.
    const float sigma = (1.0f - stage) * (g2 * stage * s[0] + g2 * s[1] + stage * s[2] + s[3]);
    float y = kit::fast_tanh((x - feedback * sigma) / (1.0f + feedback * g2 * g2));
    for (int i = 0; i < 4; ++i) {
      const float v = (y - s[i]) * stage;
      y = v + s[i];
      s[i] = flush_denormal(y + v);
    }
    return y;
  }
};

}  // namespace dusk_detail
}  // namespace livemix
