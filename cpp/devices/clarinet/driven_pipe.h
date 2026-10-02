#pragma once

// The driven pipe: an open-loop wind kernel. Nothing here is voiced for one
// instrument; a reed, a flute or a horn supplies the numbers.
//
//   breath level A ──┬─► brightness a ─► pipe_tone(sin x, cos x, a) ─► odd + even halves
//                    │
//   breath noise ────┴─► PipeComb (the passive pipe) ─► air with the note's resonances
//
// - The tone is a closed-form harmonic series read from one phase:
//   harmonic h has amplitude a^(h-1). It comes in two halves, the odd
//   harmonics and the even ones, so a voicing can weigh them: a cylinder
//   closed at one end (a clarinet, a stopped pipe) sounds the odd half, a
//   cone or an open pipe sounds both.
// - `a` is the brightness: 0 is a sine, 0.5 loses 6 dB per harmonic, 0.85 is
//   brassy. A voicing that makes `a` proportional to the level of the tone
//   gets the behaviour of reed and lip instruments at soft and medium
//   levels: harmonic h grows as the h-th power of the fundamental.
// - Nothing is band-limited by filtering. brightness_limit gives the largest
//   `a` a note may use so that the first harmonic above Nyquist is 60 dB
//   under the fundamental.
// - The pipe is passive: a feedback comb that noise is sent through, never a
//   loop that has to start by itself. It cannot squeal, jump register or
//   fail to speak, whatever it is fed.

#include "../../kit/kit.h"

namespace livemix {
namespace clarinet {

// The two halves of a series whose harmonic h has amplitude a^(h-1): the odd
// harmonics in cosine phase and the even ones in sine phase.
struct PipeTone {
  float odd;
  float even;
};

// Both halves from the sine and cosine of the phase, in one division. With
// D1 = 1 - 2a·cos x + a² and D2 = 1 + 2a·cos x + a²:
//
//   odd  = (1 - a²)·cos x / (D1·D2)        = Σ a^(h-1)·cos(h·x) over odd h
//   even = 2a·sin x·cos x / (D1·D2)        = Σ a^(h-1)·sin(h·x) over even h
//
// (D1·D2 = 1 - 2a²·cos 2x + a⁴, the denominator of the odd-only series in
// a².) 0 <= a < 1. The odd half is a pulse up and a pulse down each period,
// as the sound a reed radiates is, and peaks at 1 / (1 - a²). The even half
// is a quarter turn away from it, so that the two do not peak together:
// with every harmonic in cosine phase the sum would peak at 1 / (1 - a),
// 4 dB higher at a = 0.88 for the same loudness.
inline PipeTone pipe_tone(float sine, float cosine, float a) {
  const float square = a * a;
  const float sum = 1.0f + square;
  const float cross = 2.0f * a * cosine;
  const float scaled = cosine / ((sum - cross) * (sum + cross));
  return {(1.0f - square) * scaled, 2.0f * a * sine * scaled};
}

// The largest brightness for a note at `hz`: a^(H-1) is -60 dB where H is
// the first harmonic above Nyquist. Pass the highest frequency the note can
// reach (vibrato and bends included).
inline float brightness_limit(float hz, float sample_rate) {
  const float below_nyquist = std::floor(0.5f * sample_rate / kit::max(hz, 1.0f));
  if (below_nyquist < 1.0f) return 0.0f;
  return std::exp(-6.907755f / below_nyquist);
}

// How long a resonance of quality `q` at `hz` takes to build: the time
// constant q / (π·f). Low notes speak more slowly than high ones.
inline float speech_seconds(float hz, float q) { return q / (kit::kPi * kit::max(hz, 1.0f)); }

// The passive pipe, for noise:
//
//   y[n] = x[n] + LP(open·y[n - D] - stopped·y[n - D/2]),   D = fs / f
//
// The whole-period tap alone is an open pipe or a cone: peaks at every
// multiple of the note. The half-period tap alone, inverted, is a pipe
// closed at one end: peaks at the odd multiples, dips at the even ones.
// Together they morph: at odd multiples the loop gain is open + stopped
// whatever the split, at even multiples it is open - stopped. Keep
// open + stopped under 1 (0.8 to 0.95 gives peaks 19 to 32 dB over the dips).
// LP is a one-pole low-pass, so high resonances are lossier; its phase delay
// at the note is taken off both taps, which keeps the first peak on the
// note.
template <int Size>
class PipeComb {
 public:
  // A Hermite read needs two samples behind it.
  static constexpr float kMinDelay = 2.0f;

  void clear() {
    line_.clear();
    damp_.reset();
  }

  void tune(float hz, float cutoff_hz, float sample_rate) {
    damp_.set_cutoff(cutoff_hz, sample_rate);
    const float w = kit::kTwoPi * hz / sample_rate;
    const float lag = std::atan2(damp_.a * std::sin(w), 1.0f - damp_.a * std::cos(w)) / w;
    const float period = sample_rate / hz;
    open_delay_ = kit::clamp(period - lag, kMinDelay, kit::DelayLine<Size>::max_delay());
    stopped_delay_ = kit::clamp(0.5f * period - lag, kMinDelay, kit::DelayLine<Size>::max_delay());
  }

  float process(float x, float open, float stopped) {
    float back = 0.0f;
    if (open != 0.0f) back += open * line_.read_hermite(open_delay_);
    if (stopped != 0.0f) back -= stopped * line_.read_hermite(stopped_delay_);
    const float y = flush_denormal(x + damp_.lowpass(back));
    line_.write(y);
    return y;
  }

 private:
  kit::DelayLine<Size> line_;
  kit::OnePole damp_;
  float open_delay_ = 64.0f;
  float stopped_delay_ = 32.0f;
};

}  // namespace clarinet
}  // namespace livemix
