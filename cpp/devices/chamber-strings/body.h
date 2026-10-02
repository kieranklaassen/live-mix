#pragma once

// The wooden bodies of Chamber Strings: banks of resonances that stay where
// they are whatever note is played.
//
// A bank is nine band-pass resonators in parallel, a little of the input
// straight through, and a low-pass that closes the top:
//
//   x ─┬─► direct ────────────┐
//      ├─► resonator 1 × g1 ──┤
//      ├─► ...                ├─► low-pass at the rolloff ─► out
//      └─► resonator 9 × g9 ──┘
//
// Every resonator adds with the same sign, so between two neighbours (one
// past its peak, the next not yet at its own) they pull against each other
// and the response dips, as the admittance of a driven bridge does. The
// direct path is what keeps those dips from being holes and lets a note
// below the lowest resonance through.
//
// The resonators are trapezoidal state-variable band-passes (the form of
// kit::Svf): a 100 Hz mode at 96 kHz has its poles a hair from z = 1, where
// a direct-form biquad in single precision loses its tuning. The loop keeps
// only the band output and leaves denormals to flush(), which the device
// calls on its control clock.

#include "../../kit/filters.h"
#include "../../kit/math.h"

namespace livemix {
namespace chamber_strings_dsp {

constexpr int kBodyModes = 9;

struct BodyModes {
  float hz[kBodyModes];
  float q[kBodyModes];
  float gain[kBodyModes];  // height of each resonance at its own frequency
  float direct;            // level of the path around the resonators
  float rolloff_hz;        // two-pole low-pass after the sum
};

// The high body, a violin in outline. The air resonance near 280 Hz, the two
// body modes near 470 and 550 Hz and the bridge hill at 2.3 to 3.2 kHz are
// where the published measurements put them (Woodhouse, "On the bridge hill
// of the violin"; Gough's reviews). The three between are filler that keeps
// the envelope jagged, and every Q and height is a choice.
inline constexpr BodyModes kHighBody = {
    {280.0f, 470.0f, 550.0f, 800.0f, 1200.0f, 1700.0f, 2300.0f, 2700.0f, 3200.0f},
    {14.0f, 20.0f, 18.0f, 9.0f, 8.0f, 8.0f, 7.0f, 7.0f, 6.0f},
    {0.9f, 1.0f, 1.0f, 0.5f, 0.45f, 0.5f, 0.8f, 0.9f, 0.7f},
    0.3f,
    4500.0f,
};

// The low body, a cello in outline: air resonance near 100 Hz, main body
// resonance near 180 Hz (the wolf region), bridge resonances at 1 to 2 kHz.
// A cello is small for its pitch, so this is not the high body scaled down.
// All of it is a choice; the figures are remembered, not measured.
inline constexpr BodyModes kLowBody = {
    {100.0f, 180.0f, 250.0f, 350.0f, 500.0f, 700.0f, 1000.0f, 1500.0f, 2000.0f},
    {12.0f, 22.0f, 16.0f, 10.0f, 9.0f, 8.0f, 7.0f, 7.0f, 6.0f},
    {0.9f, 1.0f, 0.9f, 0.55f, 0.5f, 0.5f, 0.7f, 0.8f, 0.6f},
    0.3f,
    3500.0f,
};

// The left body is tuned this share below the table and the right body the
// same above it: two instruments of slightly different size, which is width
// without a chorus. Under half the bandwidth of the sharpest resonance, so
// the two still add when summed to mono.
constexpr float kBodySkew = 0.012f;

class BodyBank {
 public:
  // `tuning` scales every frequency of the table (1 - kBodySkew, 1 + kBodySkew).
  void set(const BodyModes& modes, float tuning, float sample_rate) {
    for (int k = 0; k < kBodyModes; ++k) {
      const float hz = kit::clamp(modes.hz[k] * tuning, 20.0f, sample_rate * 0.45f);
      g_[k] = std::tan(kit::kPi * hz / sample_rate);
      damping_[k] = 1.0f / modes.q[k];
      a1_[k] = 1.0f / (1.0f + g_[k] * (g_[k] + damping_[k]));
      a2_[k] = g_[k] * a1_[k];
      a3_[k] = g_[k] * a2_[k];
      // Band output times the damping is unity at the centre frequency.
      weight_[k] = modes.gain[k] * damping_[k];
    }
    direct_ = modes.direct;
    const float rolloff = kit::clamp(modes.rolloff_hz * tuning, 20.0f, sample_rate * 0.45f);
    top_g_ = std::tan(kit::kPi * rolloff / sample_rate);
    top_a1_ = 1.0f / (1.0f + top_g_ * (top_g_ + kTopDamping));
    top_a2_ = top_g_ * top_a1_;
    top_a3_ = top_g_ * top_a2_;
    reset();
  }

  void reset() {
    for (int k = 0; k < kBodyModes; ++k) {
      ic1_[k] = 0.0f;
      ic2_[k] = 0.0f;
    }
    top_ic1_ = 0.0f;
    top_ic2_ = 0.0f;
  }

  float process(float x) {
    float sum = direct_ * x;
    for (int k = 0; k < kBodyModes; ++k) {
      const float v3 = x - ic2_[k];
      const float v1 = a1_[k] * ic1_[k] + a2_[k] * v3;
      const float v2 = ic2_[k] + a2_[k] * ic1_[k] + a3_[k] * v3;
      ic1_[k] = 2.0f * v1 - ic1_[k];
      ic2_[k] = 2.0f * v2 - ic2_[k];
      sum += weight_[k] * v1;
    }
    const float v3 = sum - top_ic2_;
    const float v1 = top_a1_ * top_ic1_ + top_a2_ * v3;
    const float v2 = top_ic2_ + top_a2_ * top_ic1_ + top_a3_ * v3;
    top_ic1_ = 2.0f * v1 - top_ic1_;
    top_ic2_ = 2.0f * v2 - top_ic2_;
    return v2;
  }

  // Snap states in the denormal range to zero. Once per control period is
  // enough: a ring takes seconds to fall that far.
  void flush() {
    for (int k = 0; k < kBodyModes; ++k) {
      ic1_[k] = flush_denormal(ic1_[k]);
      ic2_[k] = flush_denormal(ic2_[k]);
    }
    top_ic1_ = flush_denormal(top_ic1_);
    top_ic2_ = flush_denormal(top_ic2_);
  }

  // The complex response at the frequency f, given as t = tan(π·f / sample
  // rate). Exact for the filters above: a trapezoidal filter is its analogue
  // prototype with the frequency axis warped by that tangent.
  void response(float t, float* re, float* im) const {
    float sum_re = direct_, sum_im = 0.0f;
    for (int k = 0; k < kBodyModes; ++k) {
      // Band-pass j·e / (d + j·e) with d = 1 - x², e = x / Q, x = f / centre.
      const float x = t / g_[k];
      const float d = 1.0f - x * x;
      const float e = x * damping_[k];
      const float scale = weight_[k] / damping_[k] / (d * d + e * e);
      sum_re += scale * e * e;
      sum_im += scale * e * d;
    }
    // Low-pass 1 / (d + j·e).
    const float x = t / top_g_;
    const float d = 1.0f - x * x;
    const float e = x * kTopDamping;
    const float scale = 1.0f / (d * d + e * e);
    *re = (sum_re * d + sum_im * e) * scale;
    *im = (sum_im * d - sum_re * e) * scale;
  }

 private:
  // 1/Q of the closing low-pass: Butterworth.
  static constexpr float kTopDamping = 1.41421356f;

  float g_[kBodyModes] = {};
  float damping_[kBodyModes] = {};
  float a1_[kBodyModes] = {};
  float a2_[kBodyModes] = {};
  float a3_[kBodyModes] = {};
  float weight_[kBodyModes] = {};
  float ic1_[kBodyModes] = {};
  float ic2_[kBodyModes] = {};
  float direct_ = 0.0f;
  float top_g_ = 1.0f;
  float top_a1_ = 0.0f, top_a2_ = 0.0f, top_a3_ = 0.0f;
  float top_ic1_ = 0.0f, top_ic2_ = 0.0f;
};

}  // namespace chamber_strings_dsp
}  // namespace livemix
