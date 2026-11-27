#pragma once

namespace livemix {

// WASM has no hardware flush-to-zero; snap denormal-range values to 0 in
// feedback paths so tails don't devolve into denormal-speed math.
constexpr float kDenormalThreshold = 1.0e-15f;

inline float flush_denormal(float x) {
  return (x > -kDenormalThreshold && x < kDenormalThreshold) ? 0.0f : x;
}

// The same for what only dies away: a level no sum can feel long before it is
// this small, let go before it is too small for the machine to be quick with.
// Lower than the one above, since nothing is added to it again: it has only to
// stay clear of the smallest numbers (1.2e-38).
constexpr float kSettleThreshold = 1.0e-30f;

inline float settle_to_zero(float x) {
  return (x > -kSettleThreshold && x < kSettleThreshold) ? 0.0f : x;
}

inline float clamp01(float x) {
  if (x < 0.0f) return 0.0f;
  if (x > 1.0f) return 1.0f;
  return x;
}

// True when a block of the input bus holds anything but exact zeros: what a
// device asks before it may sleep (kit::IdleGate, cpp/kit/idle.h).
inline bool block_present(const float* left, const float* right, int frames) {
  for (int i = 0; i < frames; ++i) {
    if (left[i] != 0.0f || right[i] != 0.0f) return true;
  }
  return false;
}

// The largest magnitude in a block of the output bus, for IdleGate::settle.
inline float block_peak(const float* left, const float* right, int frames) {
  float peak = 0.0f;
  for (int i = 0; i < frames; ++i) {
    const float l = left[i] < 0.0f ? -left[i] : left[i];
    const float r = right[i] < 0.0f ? -right[i] : right[i];
    if (l > peak) peak = l;
    if (r > peak) peak = r;
  }
  return peak;
}

// One-pole lowpass in the form Dattorro uses: y = x*(1-a) + y1*a.
struct OnePoleLowpass {
  float state = 0.0f;

  float process(float x, float coefficient) {
    state = flush_denormal(x * (1.0f - coefficient) + state * coefficient);
    return state;
  }
};

}  // namespace livemix
