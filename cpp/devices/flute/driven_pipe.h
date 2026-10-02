#pragma once

// The driven pipe: the tone generator and the passive bore shared by blown
// instruments, with no instrument's voicing in it.
//
//   breath p ─┬─► brightness a = k·p ─► harmonic series(x, a) ──┐
//             │                                                 ├─► voice
//             └─► noise · p^v · (1 + m·cos x) ─► pipe comb ─────┘
//
// - The tone is a closed form read from one phase x per voice:
//   sin x / (1 - 2a·cos x + a²) = sin x + a·sin 2x + a²·sin 3x + ...
//   so harmonic h has amplitude a^(h-1). With a proportional to breath
//   pressure, harmonic h grows as the h-th power of the fundamental, which is
//   how blown instruments get brighter as they get louder. A second closed
//   form gives the odd harmonics alone at the same levels, for a stopped pipe
//   or a cylinder with a reed.
// - The same form read at 2x or 3x is the octave or the twelfth, phase-locked
//   to the note: what a pipe sounds for a moment before its fundamental
//   speaks.
// - It is band-limited by capping a (brightness_cap).
// - The pipe is a feedback comb that only noise goes through: an open pipe or
//   a cone resonates at every harmonic of its fundamental, a stopped pipe at
//   the odd ones. It is driven and never closes a nonlinear loop, so it
//   cannot squeal, jump register or fail to speak; the pitch is the phase
//   accumulator's.

#include "../../kit/delay.h"
#include "../../kit/filters.h"
#include "../../kit/math.h"

namespace livemix {
namespace flute {

// Every harmonic, h at amplitude a^(h-1), from the sine and cosine of the
// phase. 0 <= a < 1.
inline float harmonic_series(float sine, float cosine, float a) {
  return sine / (1.0f - 2.0f * a * cosine + a * a);
}

// The odd harmonics alone, at the amplitudes they have in harmonic_series.
inline float odd_series(float sine, float cosine, float a) {
  const float r = a * a;
  const float cosine2 = 2.0f * cosine * cosine - 1.0f;
  return sine * (1.0f + r) / (1.0f - 2.0f * r * cosine2 + r * r);
}

// Harmonic h at a^(h-1), the even ones scaled by `even`: 1 for an open pipe
// or a cone, 0 for a stopped pipe.
inline float pipe_tone(float sine, float cosine, float a, float even) {
  if (even >= 1.0f) return harmonic_series(sine, cosine, a);
  const float odd = odd_series(sine, cosine, a);
  if (even <= 0.0f) return odd;
  return odd + even * (harmonic_series(sine, cosine, a) - odd);
}

// The sine and cosine of twice or three times the phase (`multiple` 2 or 3).
inline void multiple_angle(float sine, float cosine, int multiple, float* out_sine, float* out_cosine) {
  if (multiple == 3) {
    *out_sine = sine * (3.0f - 4.0f * sine * sine);
    *out_cosine = cosine * (4.0f * cosine * cosine - 3.0f);
  } else {
    *out_sine = 2.0f * sine * cosine;
    *out_cosine = 1.0f - 2.0f * sine * sine;
  }
}

// The largest `a` a series at `hz` may have: the first harmonic above Nyquist
// is 60 dB under the fundamental, so what folds back is inaudible.
inline float brightness_cap(float hz, float sample_rate) {
  const float below = std::floor(0.5f * sample_rate / kit::max(hz, 1.0f));
  if (below < 1.0f) return 0.0f;
  return std::exp(-6.907755f / below);
}

// The passive pipe. Noise in, noise with the pipe's resonances out:
//
//   open:     y[n] = x[n] + g · LP(y[n - D]),     D = one period
//   stopped:  y[n] = x[n] - g · LP(y[n - D / 2])
//
// LP is a one-pole low-pass (upper modes are lossier). Its phase delay at the
// fundamental comes off the delay, so the first resonance sits on the note.
// The input is scaled by sqrt(1 - g²), which keeps the output's power near
// the input's whatever the feedback, and a DC blocker at half the
// fundamental removes the open pipe's resonance at zero frequency.
template <int Size>
class PipeComb {
 public:
  void clear() {
    line_.clear();
    block_.reset();
    low_ = 0.0f;
  }

  // The lowest fundamental the storage holds at `sample_rate`.
  static float lowest_hz(float sample_rate) { return sample_rate / (kit::DelayLine<Size>::max_delay() - 4.0f); }

  // `feedback` in [0, 1): 0.9 puts the resonances 26 dB above the gaps
  // between them. `damping_hz` is the loop low-pass's corner; keep it a few
  // times the fundamental or the first resonance loses its height.
  void tune(float hz, float feedback, float damping_hz, float sample_rate, bool stopped) {
    const float period = sample_rate / hz;
    pole_ = std::exp(-kit::kTwoPi * kit::clamp(damping_hz, 20.0f, 0.45f * sample_rate) / sample_rate);
    const float w = kit::kTwoPi / period;
    const float lag = std::atan2(pole_ * std::sin(w), 1.0f - pole_ * std::cos(w)) / w;
    delay_ = kit::clamp((stopped ? 0.5f * period : period) - lag, 2.0f, kit::DelayLine<Size>::max_delay());
    const float g = kit::clamp(feedback, 0.0f, 0.99f);
    feedback_ = stopped ? -g : g;
    drive_ = std::sqrt(1.0f - g * g);
    block_.set_cutoff(kit::min(0.5f * hz, 0.1f * sample_rate), sample_rate);
  }

  float process(float x) {
    const float back = line_.read_hermite(delay_);
    low_ = flush_denormal(back + (low_ - back) * pole_);
    const float y = flush_denormal(x * drive_ + feedback_ * low_);
    line_.write(y);
    return block_.process(y);
  }

 private:
  kit::DelayLine<Size> line_;
  kit::DcBlocker block_;
  float low_ = 0.0f;
  float pole_ = 0.0f;
  float delay_ = 64.0f;
  float feedback_ = 0.0f;
  float drive_ = 1.0f;
};

}  // namespace flute
}  // namespace livemix
