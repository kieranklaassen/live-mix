#pragma once

// The driven pipe: the tone generator of a wind instrument that is blown
// open loop. A breath envelope sets how bright a harmonic series is and
// feeds noise through a comb that is the passive tube; nothing closes a
// nonlinear loop, so the pipe cannot squeal, jump register or fail to speak.
//
//   series        sin x / (1 - 2a·cos x + a²) = sin x + a·sin 2x + a²·sin 3x ...
//                 one division per sample; `a` is the ratio between
//                 neighbouring harmonics, the brightness
//   brightness_cap  the largest `a` whose series is still clean at Nyquist
//   Rotor         the oscillator: a unit phasor (cos x, sin x) turned once a
//                 sample, retuned by small ratios on the control clock
//   PipeComb      y[n] = in + g·LP(y[n - D]): the open pipe, peaks at every
//                 multiple of the note
//
// This header holds no instrument's voicing: how brightness follows the
// breath, the bell and the players live with the instrument (horns.h).

#include <cmath>

#include "../../kit/kit.h"

namespace livemix {
namespace horns {

// The harmonic series with ratio `a` (0 <= a < 1) at the phase whose cosine
// and sine are given: harmonic h has amplitude a^(h-1).
inline float series(float cosine, float sine, float a) {
  return sine / (1.0f - 2.0f * a * cosine + a * a);
}

// The brightness at which a series on `frequency` has fallen by `down_db`
// where its harmonics cross Nyquist. Keeping `a` under it keeps what folds
// back that far under the fundamental (the organ's rule, per note).
inline float brightness_cap(float frequency, float sample_rate, float down_db = 70.0f) {
  const float harmonics = 0.5f * sample_rate / kit::max(frequency, 1.0f);
  return std::exp(-0.11512925f * down_db / harmonics);
}

// A unit phasor turned by a fixed angle each sample. Sine and cosine come
// for the price of four multiplies, with no table and no phase wrap, which
// is what the series wants. The angle is kept as its own cosine and sine,
// worked out in double when the note starts, so the pitch is exact to a
// thousandth of a cent; small changes of pitch (detune, drift, vibrato)
// turn that pair a little further on the control clock.
struct Rotor {
  float c = 1.0f, s = 0.0f;            // cos and sin of the phase
  float turn_c = 1.0f, turn_s = 0.0f;  // of the angle turned each sample
  float base_c = 1.0f, base_s = 0.0f;  // of the note's own angle
  float angle = 0.0f;                  // the note's own angle, radians per sample

  // Tune to `frequency` without touching the phase.
  void tune(float frequency, float sample_rate) {
    const double w = 6.283185307179586 * static_cast<double>(frequency) / sample_rate;
    angle = static_cast<float>(w);
    base_c = static_cast<float>(std::cos(w));
    base_s = static_cast<float>(std::sin(w));
    turn_c = base_c;
    turn_s = base_s;
  }

  // Start at `phase` cycles.
  void start(float phase) {
    const double x = 6.283185307179586 * static_cast<double>(phase);
    c = static_cast<float>(std::cos(x));
    s = static_cast<float>(std::sin(x));
  }

  // Play at `ratio` times the tuned frequency, for ratios within a few
  // percent of one (the extra angle goes through a fourth-order series), and
  // pull the phasor back onto the unit circle. Call on the control clock.
  void bend(float ratio) {
    const float d = angle * (ratio - 1.0f);
    const float d2 = d * d;
    const float cd = 1.0f - 0.5f * d2 + d2 * d2 * (1.0f / 24.0f);
    const float sd = d * (1.0f - d2 * (1.0f / 6.0f));
    turn_c = base_c * cd - base_s * sd;
    turn_s = base_s * cd + base_c * sd;
    const float trim = 1.5f - 0.5f * (c * c + s * s);
    c *= trim;
    s *= trim;
  }

  void tick() {
    const float turned = c * turn_c - s * turn_s;
    s = s * turn_c + c * turn_s;
    c = turned;
  }
};

// The passive pipe as a feedback comb with a one-pole loss in the loop:
// noise fed through it takes peaks at every multiple of the tuned
// frequency, taller and narrower as `feedback` nears one. The delay is read
// with Hermite interpolation and shortened by the phase delay the loss
// filter has at the fundamental, so the first peak sits on the note.
template <int Size>
class PipeComb {
 public:
  void clear() {
    line_.clear();
    state_ = 0.0f;
  }

  // `feedback` in [0, 0.97]; `damping_hz` is the corner of the loop's loss.
  void tune(float frequency, float feedback, float damping_hz, float sample_rate) {
    feedback_ = kit::clamp(feedback, 0.0f, 0.97f);
    pole_ = std::exp(-kit::kTwoPi * kit::clamp(damping_hz, 20.0f, 0.45f * sample_rate) / sample_rate);
    const float w = kit::kTwoPi * kit::max(frequency, 1.0f) / sample_rate;
    // Phase delay of y = (1 - p)·x + p·y1 at w, in samples.
    const float lag = std::atan2(pole_ * std::sin(w), 1.0f - pole_ * std::cos(w)) / w;
    delay_ = kit::clamp(sample_rate / kit::max(frequency, 1.0f) - lag, 2.0f, line_.max_delay());
  }

  float process(float in) {
    const float back = line_.read_hermite(delay_);
    state_ = back + (state_ - back) * pole_;
    const float out = flush_denormal(in + feedback_ * state_);
    line_.write(out);
    return out;
  }

 private:
  kit::DelayLine<Size> line_;
  float state_ = 0.0f;
  float pole_ = 0.0f;
  float feedback_ = 0.0f;
  float delay_ = 2.0f;
};

}  // namespace horns
}  // namespace livemix
