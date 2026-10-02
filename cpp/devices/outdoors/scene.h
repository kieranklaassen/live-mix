#pragma once

// What the six scenes of Outdoors share: the control values they read, a
// damped sine that costs four multiplies, an aperiodic slow random value and
// a few random draws.

#include "../../kit/kit.h"

namespace livemix {
namespace outdoors_scene {

// One control step is this many samples (the device's ControlClock).
constexpr int kControlPeriod = 32;

// What a scene reads every control step. All four knobs arrive smoothed.
struct Controls {
  float sample_rate = 48000.0f;
  float step_seconds = kControlPeriod / 48000.0f;  // one control step
  float density = 0.5f;
  float distance = 0.4f;
  float movement = 0.5f;
  float tone = 0.5f;
  // The keys that are down (not yet released), for scenes that tune to them.
  int held = 0;
  float held_hz[8] = {};
};

// An unrelated seed per stream (seeding one xorshift from the output of
// another would hand out the same sequence one step apart).
inline uint32_t seed_for(uint32_t stream) {
  uint32_t x = (stream + 1u) * 0x9E3779B9u;
  x ^= x >> 16;
  x *= 0x85EBCA6Bu;
  x ^= x >> 13;
  x *= 0xC2B2AE35u;
  x ^= x >> 16;
  return x == 0 ? 0x2545F491u : x;
}

// An exponentially distributed gap with the given mean: Poisson arrivals.
inline float exp_gap(kit::Rng& rng, float mean) { return -mean * std::log(1.0f - rng.uniform()); }

// Uniform in [lo, hi).
inline float between(kit::Rng& rng, float lo, float hi) { return lo + (hi - lo) * rng.uniform(); }

// Geometric: uniform in octaves between lo and hi.
inline float between_log(kit::Rng& rng, float lo, float hi) {
  return lo * std::exp2(std::log2(hi / lo) * rng.uniform());
}

// The key leans every scene: `octaves_per_octave` of shift per octave of key
// around middle C, held inside ±`limit` octaves.
inline float key_lean(float hz, float octaves_per_octave, float limit) {
  const float octaves = std::log2(kit::clamp(hz, 8.0f, 12000.0f) / 261.63f) * octaves_per_octave;
  return std::exp2(kit::clamp(octaves, -limit, limit));
}

// A damped sinusoid as a rotating pair (the "magic circle"): stable at any
// frequency, keeps its amplitude when the frequency glides, and a strike
// added to `y` never steps the output `x`. `eps` is 2·sin(π·f/sr); `r` is the
// per-sample decay.
struct Ringer {
  float x = 0.0f, y = 0.0f;
  float eps = 0.0f, r = 1.0f;

  void reset() { x = y = 0.0f; }
  void tune(float hz, float sample_rate) {
    eps = 2.0f * std::sin(kit::kPi * kit::min(hz, 0.49f * sample_rate) / sample_rate);
  }
  // Seconds to fall 60 dB.
  void decay(float seconds, float sample_rate) {
    r = std::exp(-6.907755f / (kit::max(seconds, 1.0e-4f) * sample_rate));
  }
  void strike(float amplitude) { y -= amplitude; }
  float tick() {
    x = (x - eps * y) * r;
    y = (y + eps * x) * r;
    return x;
  }
  float size() const { return std::fabs(x) + std::fabs(y); }
};

// A slow random value in [0, 1] that never cycles: a target redrawn at
// random moments, followed through two one-poles. Stepped once per control
// step; `rate` is how many times a second the target moves, on average.
struct Wander {
  kit::Rng rng;
  float target = 0.5f, a = 0.5f, b = 0.5f;
  float hold = 0.0f;

  void seed(uint32_t value) {
    rng.seed(value);
    target = rng.uniform();
    a = b = target;
    hold = 0.0f;
  }
  float next(float rate, float step_seconds) {
    hold -= step_seconds;
    if (hold <= 0.0f) {
      target = rng.uniform();
      hold = (0.4f + exp_gap(rng, 0.6f)) / kit::max(rate, 1.0e-3f);
    }
    const float k = kit::min(1.0f, 3.0f * rate * step_seconds);
    a += (target - a) * k;
    b += (a - b) * k;
    // The two poles pull the value towards the middle; stretch it back out.
    return kit::clamp(0.5f + 1.5f * (b - 0.5f), 0.0f, 1.0f);
  }
};

// Raised-cosine edges around a flat top: `u` in [0, 1], `edge` the share of
// the whole that each fade takes (0.5 is a Hann bell).
inline float window(float u, float edge) {
  if (u < edge) return 0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * u / edge);
  if (u > 1.0f - edge) return 0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * (1.0f - u) / edge);
  return 1.0f;
}

}  // namespace outdoors_scene
}  // namespace livemix
