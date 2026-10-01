#pragma once

// The voiced source of one singer: the derivative of the glottal flow, which
// is what leaves the lips (flow through the folds, differentiated by
// radiation).
//
// The flow is the KLGLOTT88 pulse (Klatt and Klatt 1990): while the folds
// are open, U(x) = x²(1 - x) over the open phase x in [0, 1), and zero while
// they are closed. Its derivative,
//
//   U'(x) = 2x - 3x²   (open)        0   (closed),
//
// rises gently, swings down to -1 and snaps back to zero when the folds
// close. That snap is the excitation of the vocal tract: the spectrum falls
// 6 dB per octave from it, as a sawtooth's does, with the shallow dips the
// closed part of the cycle leaves. How dark or pressed the voice is comes
// from the low-pass the device puts after this (Klatt's spectral tilt). The
// open quotient is the share of the cycle the folds are open (0.5 pressed,
// 0.7 breathy).
//
// Band-limiting: the snap is a step of height 1 (PolyBLEP), and the corners
// at opening and closure are changes of slope of 2/oq and 4/oq per cycle
// (PolyBLAMP). kit::BlepOsc keeps its residuals private, so they are
// repeated here.

#include "../../kit/math.h"

namespace livemix {
namespace choir_dsp {

struct GlottalPulse {
  float phase = 0.0f;
  float open = 0.64f;
  float inverse_open = 1.0f / 0.64f;

  void reset(float start, float open_quotient) {
    phase = start - std::floor(start);
    open = kit::clamp(open_quotient, 0.3f, 0.9f);
    inverse_open = 1.0f / open;
  }

  // Advance by `increment` cycles. True when a new cycle began.
  bool advance(float increment) {
    phase += increment;
    if (phase >= 1.0f) {
      phase -= 1.0f;
      return true;
    }
    return false;
  }

  // The flow derivative at the current phase, in [-1, 1/3].
  float derivative(float increment) const {
    float value = 0.0f;
    if (phase < open) {
      const float x = phase * inverse_open;
      value = x * (2.0f - 3.0f * x);
    }
    // Opening, at phase 0: the slope rises by 2/oq.
    const float corner = 2.0f * inverse_open * increment;
    if (phase < increment) {
      value += corner * blamp_after(phase / increment);
    } else if (phase > 1.0f - increment) {
      value += corner * blamp_before((phase - 1.0f) / increment);
    }
    // Closure, at phase oq: a step of +1 and the slope rises by 4/oq.
    const float t = phase - open;
    if (t >= 0.0f) {
      if (t < increment) {
        const float u = t / increment;
        value += 0.5f * blep_after(u) + 2.0f * corner * blamp_after(u);
      }
    } else if (t > -increment) {
      const float u = t / increment;
      value += 0.5f * blep_before(u) + 2.0f * corner * blamp_before(u);
    }
    return value;
  }

  // The flow itself, 0..1, for shaping the breath noise: air rushes while
  // the folds are open.
  float flow() const {
    if (phase >= open) return 0.0f;
    const float x = phase * inverse_open;
    return 6.75f * x * x * (1.0f - x);
  }

 private:
  // Residuals of a rising step of height 2, u = distance from the step in
  // samples: [0, 1) after it, (-1, 0) before it.
  static float blep_after(float u) { return u + u - u * u - 1.0f; }
  static float blep_before(float u) { return u * u + u + u + 1.0f; }
  // Residuals of a corner whose slope rises by one per sample.
  static float blamp_after(float u) {
    const float v = 1.0f - u;
    return v * v * v * (1.0f / 6.0f);
  }
  static float blamp_before(float u) {
    const float v = 1.0f + u;
    return v * v * v * (1.0f / 6.0f);
  }
};

}  // namespace choir_dsp
}  // namespace livemix
