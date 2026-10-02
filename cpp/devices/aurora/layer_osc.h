#pragma once

// The oscillator of one layer: a sawtooth, and on request a pulse of moving
// width riding the same phase.
//
// Band-limiting is a four-sample PolyBLEP: each edge is replaced by the step
// response of a cubic B-spline, so the two samples before and the two after
// it carry a correction. kit::BlepOsc corrects one sample each side, which
// leaves the folded harmonics of a C6 sawtooth 38 to 45 dB under the
// fundamental above 10 kHz when Brilliance is wide open; this keeps them
// more than 50 dB down. The price is a gentle fall of the top octave (2.6 dB
// at 10 kHz, 48 kHz rate), which suits a brass and string pad.

#include "../../kit/math.h"

namespace livemix {
namespace aurora_dsp {

struct LayerOsc {
  float phase = 0.0f;

  void reset(float start) { phase = start - std::floor(start); }

  // `increment` is frequency / sample rate.
  float saw(float increment) {
    const float step = advance(increment);
    return 2.0f * phase - 1.0f - edge(phase, step);
  }

  // The sawtooth plus `level` of a pulse that is low for `width` of the
  // cycle and then high. The pulse falls where the sawtooth falls, so the two
  // add at the fundamental; the other way round they cancel there at half
  // width and leave a sawtooth an octave up.
  float saw_and_pulse(float increment, float width, float level) {
    const float step = advance(increment);
    width = kit::clamp(width, 0.02f, 0.98f);
    const float wrap = edge(phase, step);
    float rise = phase + 1.0f - width;
    if (rise >= 1.0f) rise -= 1.0f;
    // Less the DC a pulse off the half-way width carries.
    const float pulse = (phase < width ? -1.0f : 1.0f) - wrap + edge(rise, step) + (2.0f * width - 1.0f);
    return 2.0f * phase - 1.0f - wrap + level * pulse;
  }

 private:
  // The edges may not reach each other: under a quarter cycle per sample.
  float advance(float increment) {
    const float step = kit::clamp(increment, 1.0e-7f, 0.24f);
    phase += step;
    if (phase >= 1.0f) phase -= 1.0f;
    return step;
  }

  // What a band-limited unit step is short of the ideal one, `x` samples
  // after it (0 to 2): the integral of the cubic B-spline less one. Before
  // the step it is the same with the sign turned.
  static float after(float x) {
    if (x < 1.0f) return -0.5f + x * (2.0f / 3.0f) + x * x * x * (x * 0.125f - 1.0f / 3.0f);
    const float rest = 2.0f - x;
    return -(rest * rest) * (rest * rest) * (1.0f / 24.0f);
  }

  // Correction for a rising step of height 2 at phase 0, read `t` cycles
  // after it, `step` cycles per sample.
  static float edge(float t, float step) {
    const float reach = step + step;
    if (t < reach) return 2.0f * after(t / step);
    if (t > 1.0f - reach) return -2.0f * after((1.0f - t) / step);
    return 0.0f;
  }
};

}  // namespace aurora_dsp
}  // namespace livemix
