#pragma once

#include "math.h"

namespace livemix {
namespace kit {

// One-pole lowpass, y += (1 - a)(x - y), with the pole set from a cutoff.
struct OnePole {
  float state = 0.0f;
  float a = 0.0f;

  void set_cutoff(float hz, float sample_rate) {
    a = std::exp(-kTwoPi * clamp(hz, 0.0f, sample_rate * 0.49f) / sample_rate);
  }
  void reset() { state = 0.0f; }

  float lowpass(float x) {
    state = flush_denormal(x + (state - x) * a);
    return state;
  }
  float highpass(float x) { return x - lowpass(x); }
};

// First-order DC blocker, -3 dB near `hz`.
struct DcBlocker {
  float x1 = 0.0f;
  float y1 = 0.0f;
  float r = 0.999f;

  void set_cutoff(float hz, float sample_rate) { r = 1.0f - kTwoPi * hz / sample_rate; }
  void reset() {
    x1 = 0.0f;
    y1 = 0.0f;
  }
  float process(float x) {
    const float y = flush_denormal(x - x1 + r * y1);
    x1 = x;
    y1 = y;
    return y;
  }
};

// tan(x) for x in [0, ~1.5): Padé (3,2) inside the passband and the exact
// function near Nyquist, where only static filters are set.
inline float tan_prewarp(float x) {
  if (x > 0.7f) return std::tan(x);
  const float x2 = x * x;
  return x * (15.0f - x2) / (15.0f - 6.0f * x2);
}

// Trapezoidal (TPT) state-variable filter in Andrew Simper's form. Safe to
// retune every sample; all three responses come out of one tick.
struct Svf {
  float ic1 = 0.0f;
  float ic2 = 0.0f;
  float g = 0.1f;
  float k = 1.4142f;
  float a1 = 0.0f;
  float a2 = 0.0f;
  float a3 = 0.0f;
  float low = 0.0f;
  float band = 0.0f;
  float high = 0.0f;

  void reset() {
    ic1 = 0.0f;
    ic2 = 0.0f;
    low = band = high = 0.0f;
  }

  // q >= 0.5; 0.7071 is Butterworth.
  void set(float hz, float q, float sample_rate) {
    const float f = clamp(hz, 5.0f, sample_rate * 0.49f);
    g = tan_prewarp(kPi * f / sample_rate);
    k = 1.0f / max(q, 0.1f);
    a1 = 1.0f / (1.0f + g * (g + k));
    a2 = g * a1;
    a3 = g * a2;
  }

  void process(float x) {
    const float v3 = x - ic2;
    const float v1 = a1 * ic1 + a2 * v3;
    const float v2 = ic2 + a2 * ic1 + a3 * v3;
    ic1 = flush_denormal(2.0f * v1 - ic1);
    ic2 = flush_denormal(2.0f * v2 - ic2);
    low = v2;
    band = v1;
    high = x - k * v1 - v2;
  }

  float lowpass(float x) {
    process(x);
    return low;
  }
  float highpass(float x) {
    process(x);
    return high;
  }
  // Unity gain at the centre frequency.
  float bandpass(float x) {
    process(x);
    return band * k;
  }
  float notch(float x) {
    process(x);
    return low + high;
  }
};

// Biquad in transposed direct form II with the RBJ cookbook designs. For
// static or slowly moving EQ; use Svf where the cutoff is modulated.
struct Biquad {
  float b0 = 1.0f, b1 = 0.0f, b2 = 0.0f, a1 = 0.0f, a2 = 0.0f;
  float z1 = 0.0f, z2 = 0.0f;

  void reset() {
    z1 = 0.0f;
    z2 = 0.0f;
  }

  float process(float x) {
    const float y = b0 * x + z1;
    z1 = flush_denormal(b1 * x - a1 * y + z2);
    z2 = flush_denormal(b2 * x - a2 * y);
    return y;
  }

  void set_identity() {
    b0 = 1.0f;
    b1 = b2 = a1 = a2 = 0.0f;
  }

  void set_lowpass(float hz, float q, float sample_rate) {
    float cosw, alpha;
    prepare(hz, q, sample_rate, &cosw, &alpha);
    normalise((1.0f - cosw) * 0.5f, 1.0f - cosw, (1.0f - cosw) * 0.5f, 1.0f + alpha, -2.0f * cosw,
              1.0f - alpha);
  }

  void set_highpass(float hz, float q, float sample_rate) {
    float cosw, alpha;
    prepare(hz, q, sample_rate, &cosw, &alpha);
    normalise((1.0f + cosw) * 0.5f, -(1.0f + cosw), (1.0f + cosw) * 0.5f, 1.0f + alpha,
              -2.0f * cosw, 1.0f - alpha);
  }

  void set_peak(float hz, float q, float gain_db, float sample_rate) {
    float cosw, alpha;
    prepare(hz, q, sample_rate, &cosw, &alpha);
    const float amp = std::pow(10.0f, gain_db / 40.0f);
    normalise(1.0f + alpha * amp, -2.0f * cosw, 1.0f - alpha * amp, 1.0f + alpha / amp,
              -2.0f * cosw, 1.0f - alpha / amp);
  }

  void set_low_shelf(float hz, float gain_db, float sample_rate) {
    float cosw, alpha;
    prepare(hz, kSqrtHalf, sample_rate, &cosw, &alpha);
    const float amp = std::pow(10.0f, gain_db / 40.0f);
    const float beta = 2.0f * std::sqrt(amp) * alpha;
    normalise(amp * ((amp + 1.0f) - (amp - 1.0f) * cosw + beta),
              2.0f * amp * ((amp - 1.0f) - (amp + 1.0f) * cosw),
              amp * ((amp + 1.0f) - (amp - 1.0f) * cosw - beta),
              (amp + 1.0f) + (amp - 1.0f) * cosw + beta,
              -2.0f * ((amp - 1.0f) + (amp + 1.0f) * cosw),
              (amp + 1.0f) + (amp - 1.0f) * cosw - beta);
  }

  void set_high_shelf(float hz, float gain_db, float sample_rate) {
    float cosw, alpha;
    prepare(hz, kSqrtHalf, sample_rate, &cosw, &alpha);
    const float amp = std::pow(10.0f, gain_db / 40.0f);
    const float beta = 2.0f * std::sqrt(amp) * alpha;
    normalise(amp * ((amp + 1.0f) + (amp - 1.0f) * cosw + beta),
              -2.0f * amp * ((amp - 1.0f) + (amp + 1.0f) * cosw),
              amp * ((amp + 1.0f) + (amp - 1.0f) * cosw - beta),
              (amp + 1.0f) - (amp - 1.0f) * cosw + beta,
              2.0f * ((amp - 1.0f) - (amp + 1.0f) * cosw),
              (amp + 1.0f) - (amp - 1.0f) * cosw - beta);
  }

 private:
  static void prepare(float hz, float q, float sample_rate, float* cosw, float* alpha) {
    const float w = kTwoPi * clamp(hz, 5.0f, sample_rate * 0.49f) / sample_rate;
    *cosw = std::cos(w);
    *alpha = std::sin(w) / (2.0f * max(q, 0.05f));
  }

  void normalise(float nb0, float nb1, float nb2, float na0, float na1, float na2) {
    const float inverse = 1.0f / na0;
    b0 = nb0 * inverse;
    b1 = nb1 * inverse;
    b2 = nb2 * inverse;
    a1 = na1 * inverse;
    a2 = na2 * inverse;
  }
};

// First-order allpass, the phaser stage: unity magnitude, phase turning
// through -90° at the corner set by `set_corner`.
struct Allpass1 {
  float a = 0.0f;
  float x1 = 0.0f;
  float y1 = 0.0f;

  void reset() {
    x1 = 0.0f;
    y1 = 0.0f;
  }
  void set_corner(float hz, float sample_rate) {
    const float t = tan_prewarp(kPi * clamp(hz, 5.0f, sample_rate * 0.49f) / sample_rate);
    a = (t - 1.0f) / (t + 1.0f);
  }
  float process(float x) {
    const float y = flush_denormal(a * x + x1 - a * y1);
    x1 = x;
    y1 = y;
    return y;
  }
};

// Four-pole lowpass ladder (TPT, zero-delay feedback solved linearly, tanh on
// the feedback path): the warm resonant filter of the pad synths. Resonance
// in [0, 1]; self-oscillates near 1.
struct Ladder {
  float s[4] = {0.0f, 0.0f, 0.0f, 0.0f};
  float g = 0.1f;
  float resonance = 0.0f;

  void reset() { s[0] = s[1] = s[2] = s[3] = 0.0f; }

  void set(float hz, float reso, float sample_rate) {
    g = tan_prewarp(kPi * clamp(hz, 10.0f, sample_rate * 0.45f) / sample_rate);
    resonance = clamp(reso, 0.0f, 1.0f) * 4.0f;
  }

  float process(float x) {
    const float big_g = g / (1.0f + g);
    const float g2 = big_g * big_g;
    const float g4 = g2 * g2;
    const float one_minus = 1.0f - big_g;
    // State contribution to the fourth stage's output.
    const float sigma =
        one_minus * (g2 * big_g * s[0] + g2 * s[1] + big_g * s[2] + s[3]);
    // Solve the feedback loop, then saturate what goes back in.
    float u = (x - resonance * sigma) / (1.0f + resonance * g4);
    u = fast_tanh(u);
    float y = u;
    for (int i = 0; i < 4; ++i) {
      const float v = (y - s[i]) * big_g;
      y = v + s[i];
      s[i] = flush_denormal(y + v);
    }
    return y;
  }
};

}  // namespace kit
}  // namespace livemix
