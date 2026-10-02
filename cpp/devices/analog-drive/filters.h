#pragma once

#include "../../kit/filters.h"

// The device's own small filters: a state-variable section with output mix
// coefficients (so one structure is the low cut, the Thump bell and the high
// cut, and all three can be retuned while sounding), a first-order tilt and a
// DC blocker whose state does not stall.

namespace livemix {
namespace analog_drive_dsp {

// Trapezoidal state-variable filter (Andrew Simper, "Solving the continuous
// SVF equations using trapezoidal integration and equivalent currents",
// Cytomic 2013), output = m0 x + m1 band + m2 low.
struct Section {
  float ic1 = 0.0f, ic2 = 0.0f;
  float a1 = 0.0f, a2 = 0.0f, a3 = 0.0f;
  float m0 = 1.0f, m1 = 0.0f, m2 = 0.0f;

  void reset() {
    ic1 = 0.0f;
    ic2 = 0.0f;
  }

  void set_highpass(float hz, float q, float sample_rate) {
    const float k = 1.0f / q;
    tune(hz, k, sample_rate);
    m0 = 1.0f;
    m1 = -k;
    m2 = -1.0f;
  }

  void set_lowpass(float hz, float q, float sample_rate) {
    tune(hz, 1.0f / q, sample_rate);
    m0 = 0.0f;
    m1 = 0.0f;
    m2 = 1.0f;
  }

  // A bell of `gain_db` at `hz`; 0 dB is the identity.
  void set_bell(float hz, float q, float gain_db, float sample_rate) {
    const float amp = std::pow(10.0f, gain_db * (1.0f / 40.0f));
    const float k = 1.0f / (q * amp);
    tune(hz, k, sample_rate);
    m0 = 1.0f;
    m1 = k * (amp * amp - 1.0f);
    m2 = 0.0f;
  }

  float process(float x) {
    const float v3 = x - ic2;
    const float v1 = a1 * ic1 + a2 * v3;
    const float v2 = ic2 + a2 * ic1 + a3 * v3;
    ic1 = flush_denormal(2.0f * v1 - ic1);
    ic2 = flush_denormal(2.0f * v2 - ic2);
    return m0 * x + m1 * v1 + m2 * v2;
  }

 private:
  void tune(float hz, float k, float sample_rate) {
    const float g = kit::tan_prewarp(kit::kPi * kit::clamp(hz, 5.0f, sample_rate * 0.49f) / sample_rate);
    a1 = 1.0f / (1.0f + g * (g + k));
    a2 = g * a1;
    a3 = g * a2;
  }
};

// First-order tilt: -tilt dB well below the pivot, +tilt dB well above,
// exactly 0 dB at the pivot. H(s) = k (s + w0/k) / (s + w0 k), k = 10^(tilt/20),
// bilinear with the pivot prewarped.
struct Tilt {
  float b0 = 1.0f, b1 = 0.0f, a1 = 0.0f;
  float x1 = 0.0f, y1 = 0.0f;

  void reset() {
    x1 = 0.0f;
    y1 = 0.0f;
  }

  void set(float tilt_db, float pivot_hz, float sample_rate) {
    const float k = std::pow(10.0f, tilt_db * 0.05f);
    const float w0 = kit::kTwoPi * pivot_hz;
    const float c = w0 / std::tan(w0 / (2.0f * sample_rate));
    const float zero = w0 / k;
    const float pole = w0 * k;
    const float norm = 1.0f / (c + pole);
    b0 = k * (c + zero) * norm;
    b1 = k * (zero - c) * norm;
    a1 = (pole - c) * norm;
  }

  float process(float x) {
    const float y = flush_denormal(b0 * x + b1 * x1 - a1 * y1);
    x1 = x;
    y1 = y;
    return y;
  }
};

// The input minus its one-pole low-pass. The state is a double: in float the
// low-pass stalls a rounding step short of a constant and leaves that much
// DC behind for good.
struct DcBlock {
  double a = 1.0;
  double state = 0.0;

  void set_cutoff(float hz, float sample_rate) {
    a = 1.0 - std::exp(-6.283185307179586 * static_cast<double>(hz) / static_cast<double>(sample_rate));
  }
  void reset() { state = 0.0; }
  float process(float x) {
    state += a * (static_cast<double>(x) - state);
    if (state > -1.0e-30 && state < 1.0e-30) state = 0.0;
    return x - static_cast<float>(state);
  }
};

}  // namespace analog_drive_dsp
}  // namespace livemix
