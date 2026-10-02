#pragma once

// The noise beds of Noise Floor: one small model per medium. Each makes a
// stereo pair whose two sides never share a noise source, and each is scaled
// so that one side measures an RMS of 1 at rest (Movement 0); the device
// applies Level, Tone and everything else on top.
//
// White noise here has the same power per hertz at every sample rate (it is
// scaled by sqrt(rate / 48 kHz)), and every filter is set in hertz and stops
// below 18 kHz, so a bed has the same level and colour at 44.1, 48 and 96 kHz.

#include "../../kit/kit.h"

namespace livemix {
namespace noise_beds {

// An unrelated seed per stream. Seeding one xorshift from the next output of
// another would hand out the same sequence one step apart.
inline uint32_t seed_for(uint32_t stream) {
  uint32_t x = (stream + 1u) * 0x9E3779B9u;
  x ^= x >> 16;
  x *= 0x85EBCA6Bu;
  x ^= x >> 13;
  x *= 0xC2B2AE35u;
  x ^= x >> 16;
  return x == 0 ? 0x2545F491u : x;
}

// White noise with unit variance at 48 kHz and the same density elsewhere.
struct Source {
  kit::Rng rng;
  float scale = 1.7320508f;

  void init(uint32_t stream, float sample_rate) {
    rng.seed(seed_for(stream));
    scale = std::sqrt(3.0f * sample_rate / 48000.0f);
  }
  float next() { return rng.bipolar() * scale; }
};

// The gap to the next event of a Poisson stream, in samples.
inline float poisson_gap(kit::Rng& rng, float per_second, float sample_rate) {
  const float gap = -std::log(1.0f - rng.uniform()) * sample_rate / kit::max(per_second, 1.0e-3f);
  return kit::max(gap, 1.0f);
}

// A heavy-tailed size: most draws sit just above 1, a few are many times
// larger (a Pareto tail, index 1 / `tail`), never more than `ceiling`.
inline float heavy_tail(kit::Rng& rng, float tail, float ceiling) {
  const float u = kit::max(rng.uniform(), 1.0e-6f);
  return kit::min(std::exp(-tail * std::log(u)), ceiling);
}

// A struck two-pole resonator: `strike` starts amp·rⁿ·sin(n·w) on top of
// whatever is still ringing. A tick, a click or a pop, depending on pitch and
// damping; at rest it costs one comparison.
struct Ping {
  float y1 = 0.0f, y2 = 0.0f;
  float c = 0.0f, r2 = 0.0f;

  void reset() {
    y1 = y2 = 0.0f;
    c = r2 = 0.0f;
  }
  void strike(float amp, float hz, float q, float sample_rate) {
    const float cycles = kit::clamp(hz / sample_rate, 1.0e-4f, 0.45f);
    const float r = std::exp(-kit::kPi * cycles / kit::max(q, 0.3f));
    c = 2.0f * r * kit::SineTable::cos_lookup(cycles);
    r2 = r * r;
    y1 += amp * r * kit::SineTable::lookup(cycles);
  }
  float next() {
    if (y1 == 0.0f && y2 == 0.0f) return 0.0f;
    const float out = y1;
    const float y0 = flush_denormal(c * y1 - r2 * y2);
    y2 = flush_denormal(y1);
    y1 = y0;
    // Far below anything audible the ring is dropped.
    if (y1 > -1.0e-9f && y1 < 1.0e-9f && y2 > -1.0e-9f && y2 < 1.0e-9f) y1 = y2 = 0.0f;
    return out;
  }
};

// Tape hiss: white noise through a shelf that sits 18 dB down below 1 kHz,
// rises at 6 dB an octave and levels off at 8.5 kHz. Movement adds a slow
// shimmer in level and a faster, finer one. On top rides modulation noise:
// the passing signal multiplied by low-passed noise, so loud passages are
// rougher than quiet ones, as on tape.
struct TapeHiss {
  static constexpr float kNorm = 1.0f;       // set by measurement, see the harness
  static constexpr float kShelf = 0.875f;
  static constexpr float kModulation = 1.0f;  // set by measurement

  Source src[2];
  kit::OnePole shelf[2], rough[2];
  kit::Svf top[2];
  kit::Drift shimmer[2];
  kit::Lfo flutter[2];
  float gain[2] = {1.0f, 1.0f};

  void init(float sr, uint32_t stream) {
    for (int c = 0; c < 2; ++c) {
      src[c].init(stream + c, sr);
      shelf[c].reset();
      shelf[c].set_cutoff(8500.0f, sr);
      rough[c].reset();
      rough[c].set_cutoff(1200.0f, sr);
      top[c].reset();
      top[c].set(16000.0f, 0.6f, sr);
      shimmer[c].seed(seed_for(stream + 2 + c));
      shimmer[c].set_rate(c == 0 ? 0.31f : 0.37f, sr);
      flutter[c].seed(seed_for(stream + 4 + c));
      flutter[c].reset(c == 0 ? 0.0f : 0.4f);
      flutter[c].set_rate(c == 0 ? 4.7f : 5.3f, sr);
      gain[c] = 1.0f;
    }
  }
  void control(float movement, int period) {
    for (int c = 0; c < 2; ++c) {
      gain[c] = 1.0f + movement * (0.12f * shimmer[c].next(period) +
                                   0.06f * flutter[c].next_block(kit::Lfo::kSmooth, period));
    }
  }
  void render(const float* in, float* out) {
    for (int c = 0; c < 2; ++c) {
      const float w = src[c].next();
      const float hiss = top[c].lowpass(w - kShelf * shelf[c].lowpass(w));
      out[c] = kNorm * (hiss * gain[c] + kModulation * in[c] * rough[c].lowpass(w));
    }
  }
};

// Air: the hiss of a microphone preamp in a quiet room. Nearly all of it is
// above 5 kHz, with a soft knee into the band and a faint flat floor under
// it. Movement lets each side breathe a little.
struct Air {
  static constexpr float kNorm = 1.0f;  // set by measurement
  static constexpr float kFloor = 0.05f;

  Source src[2];
  kit::Svf high[2], top[2];
  kit::Drift breath[2];
  float gain[2] = {1.0f, 1.0f};

  void init(float sr, uint32_t stream) {
    for (int c = 0; c < 2; ++c) {
      src[c].init(stream + c, sr);
      high[c].reset();
      high[c].set(5500.0f, 0.5f, sr);
      top[c].reset();
      top[c].set(17000.0f, 0.6f, sr);
      breath[c].seed(seed_for(stream + 2 + c));
      breath[c].set_rate(c == 0 ? 0.13f : 0.17f, sr);
      gain[c] = 1.0f;
    }
  }
  void control(float movement, int period) {
    for (int c = 0; c < 2; ++c) gain[c] = 1.0f + 0.2f * movement * breath[c].next(period);
  }
  void render(const float*, float* out) {
    for (int c = 0; c < 2; ++c) {
      const float w = src[c].next();
      out[c] = kNorm * gain[c] * top[c].lowpass(high[c].highpass(w) + kFloor * w);
    }
  }
};

// (more beds are appended below)

}  // namespace noise_beds
}  // namespace livemix
