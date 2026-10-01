#pragma once

#include "math.h"

namespace livemix {
namespace kit {

// Band-limited analogue shapes by PolyBLEP (saw, pulse) and PolyBLAMP
// (triangle). `increment` is frequency / sample rate. Aliasing sits below
// -60 dB for fundamentals under a tenth of the sample rate, which covers pad
// and drone registers; bright leads belong on an oversampled voice.
class BlepOsc {
 public:
  void reset(float phase = 0.0f) { phase_ = phase - std::floor(phase); }
  float phase() const { return phase_; }

  float saw(float increment) {
    advance(increment);
    return 2.0f * phase_ - 1.0f - blep(phase_, inc_);
  }

  // `width` in (0, 1): the fraction of the cycle the pulse is high.
  float pulse(float increment, float width) {
    advance(increment);
    width = clamp(width, 0.02f, 0.98f);
    float value = phase_ < width ? 1.0f : -1.0f;
    value += blep(phase_, inc_);
    value -= blep(wrap(phase_ + 1.0f - width), inc_);
    // Remove the DC a narrow pulse carries.
    return value - (2.0f * width - 1.0f);
  }

  float triangle(float increment) {
    advance(increment);
    float value = phase_ < 0.5f ? 4.0f * phase_ - 1.0f : 3.0f - 4.0f * phase_;
    value += 8.0f * inc_ * (blamp(phase_, inc_) - blamp(wrap(phase_ + 0.5f), inc_));
    return value;
  }

  float sine(float increment) {
    advance(increment);
    return SineTable::lookup(phase_);
  }

 private:
  static float wrap(float t) { return t >= 1.0f ? t - 1.0f : t; }

  void advance(float increment) {
    inc_ = clamp(increment, 1.0e-7f, 0.49f);
    phase_ += inc_;
    if (phase_ >= 1.0f) phase_ -= 1.0f;
  }

  // Residual of a unit-height rising step (height 2 in a ±1 waveform).
  static float blep(float t, float dt) {
    if (t < dt) {
      t /= dt;
      return t + t - t * t - 1.0f;
    }
    if (t > 1.0f - dt) {
      t = (t - 1.0f) / dt;
      return t * t + t + t + 1.0f;
    }
    return 0.0f;
  }

  static float blamp(float t, float dt) {
    if (t < dt) {
      t = 1.0f - t / dt;
      return t * t * t / 6.0f;
    }
    if (t > 1.0f - dt) {
      t = (t - 1.0f) / dt + 1.0f;
      return t * t * t / 6.0f;
    }
    return 0.0f;
  }

  float phase_ = 0.0f;
  float inc_ = 0.0f;
};

// Table-read sine oscillator with phase modulation input, in cycles.
struct SineOsc {
  float phase = 0.0f;

  void reset(float start = 0.0f) { phase = start - std::floor(start); }

  float next(float increment, float phase_mod = 0.0f) {
    const float out = SineTable::lookup(phase + phase_mod);
    phase += increment;
    if (phase >= 1.0f) phase -= 1.0f;
    return out;
  }
};

// Noise colours. Pink is Paul Kellet's economy filter (±0.5 dB of 1/f from
// 40 Hz to Nyquist at 44.1 kHz), scaled to an RMS near 0.2 so its peaks stay
// inside full scale; brown is a leaky integrator.
struct Noise {
  Rng rng;
  float b0 = 0.0f, b1 = 0.0f, b2 = 0.0f;
  float brown_state = 0.0f;

  void seed(uint32_t value) { rng.seed(value); }

  float white() { return rng.bipolar(); }

  float pink() {
    const float w = rng.bipolar();
    b0 = 0.99765f * b0 + w * 0.0990460f;
    b1 = 0.96300f * b1 + w * 0.2965164f;
    b2 = 0.57000f * b2 + w * 1.0526913f;
    return clamp((b0 + b1 + b2 + w * 0.1848f) * 0.12f, -1.0f, 1.0f);
  }

  float brown() {
    brown_state = flush_denormal(brown_state * 0.997f + rng.bipolar() * 0.05f);
    return clamp(brown_state * 1.6f, -1.0f, 1.0f);
  }
};

}  // namespace kit
}  // namespace livemix
