#pragma once

#include "math.h"

namespace livemix {
namespace kit {

// A plucked or struck string: one delay loop in the extended Karplus-Strong
// form (Jaffe and Smith 1983; the loop filter of Välimäki et al. 1996).
//
//   excitation ─► pluck comb ─► (+) ───────────────────────────────► out
//                                ▲                                 │
//                                └─ tuning ◄─ stiffness ◄─ loss ◄─ delay
//
// - The loop's whole phase delay at the fundamental is one period, so the
//   note is in tune whatever the loss and stiffness are set to: the delay
//   line is shortened by the phase delay of everything else in the loop.
// - Loss is a one-pole low-pass and a gain, solved from two decay times: how
//   long the fundamental rings and how long a high partial does. That is what
//   makes a string darken as it dies.
// - Stiffness is a cascade of first-order allpasses that lets high partials
//   travel faster: partial n sits at n·f0·sqrt((1 + B·n²) / (1 + B)).
// - The pluck comb removes the partials that have a node where the string is
//   plucked. It also takes the pluck's DC with it; with the comb off the
//   string carries a DC offset that dies with the note, so a device that
//   plucks without it puts a DcBlocker after its strings.
//
// Tuning::Allpass holds a pitch with a flat loop gain (a first-order allpass
// makes the fraction of a sample); use it for notes that stay where they are.
// Tuning::Interpolated reads the line with a Hermite interpolator and glides
// to each new frequency over a millisecond: use it for pitch that moves (a
// slide, a bend, vibrato). It costs a little brightness at high notes.
//
// One instance is one string and one polarisation; a note with a beating
// second polarisation is two of them. `Size` is the line's capacity, a power
// of two: the lowest note is `lowest_hz`.
template <int Size>
class PluckedString {
 public:
  static constexpr int kMask = Size - 1;
  static constexpr int kMaxStiffStages = 4;
  static_assert((Size & (Size - 1)) == 0, "PluckedString size must be a power of two");

  enum class Tuning { Allpass, Interpolated };

  // The lowest frequency the line can hold at this sample rate.
  static float lowest_hz(float sample_rate) { return sample_rate / static_cast<float>(Size - 8); }

  // Silence, and forget every setting but the tuning mode.
  void reset() {
    for (int i = 0; i < Size; ++i) buffer_[i] = 0.0f;
    write_ = 0;
    loss_state_ = 0.0f;
    for (int s = 0; s < kMaxStiffStages; ++s) {
      stiff_x1_[s] = 0.0f;
      stiff_y1_[s] = 0.0f;
    }
    tune_x1_ = 0.0f;
    tune_y1_ = 0.0f;
    hz_ = 0.0f;
    sample_rate_ = 48000.0f;
    period_ = 64.0f;
    loss_a_ = 0.0f;
    loss_gain_ = 0.0f;
    designed_hz_ = 0.0f;
    decay_ = 4.0f;
    decay_high_ = 0.5f;
    high_hz_ = 4000.0f;
    stiffness_ = 0.0f;
    stiff_wanted_ = 0;
    stiff_a_ = 0.0f;
    stiff_stages_ = 0;
    line_ = 32.0f;
    whole_ = 32;
    tune_a_ = 0.0f;
    delay_ = 32.0f;
    delay_target_ = 32.0f;
    glide_ = 1.0f;
    comb_fraction_ = 0.0f;
    comb_offset_ = 0;
    primed_ = false;
  }

  void set_tuning(Tuning tuning) { tuning_ = tuning; }

  // The pitch. The first call after reset lands at once; later calls keep the
  // string ringing (Interpolated glides there, Allpass steps). A pitch that
  // moves a little, as in a slide or vibrato, only moves the delay; once it
  // is a third of a semitone from where the loss and stiffness were last
  // worked out, they are worked out again for the new pitch.
  void set_frequency(float hz, float sample_rate) {
    sample_rate_ = sample_rate;
    hz_ = clamp(hz, lowest_hz(sample_rate), sample_rate * 0.125f);
    period_ = sample_rate_ / hz_;
    glide_ = 1.0f - time_to_coeff(0.001f, sample_rate_);
    if (hz_ > designed_hz_ * 1.02f || hz_ < designed_hz_ * 0.98f) {
      design();
    } else {
      retune();
    }
  }

  // How long the string rings, to -60 dB: `fundamental_seconds` at the note
  // and `high_seconds` at `high_hz` (taken an octave above the note when it
  // is not above that already). When the high partials are asked to die far
  // faster than the fundamental, the filter that does it also takes a little
  // off the fundamental, which then gives way.
  void set_decay(float fundamental_seconds, float high_seconds, float high_hz) {
    decay_ = max(fundamental_seconds, 0.001f);
    decay_high_ = clamp(high_seconds, 0.0005f, decay_);
    high_hz_ = high_hz;
    design();
  }

  // Stretches the partials like a stiff string with inharmonicity `b` (about
  // 1e-5 to 1e-4 for guitar strings, up to 1e-2 at the top of a piano), using
  // `stages` allpasses (1 to 4; more follow the law further up the partials).
  // Zero switches it off. High notes, whose few partials cannot be told from
  // harmonic ones, are left alone.
  void set_stiffness(float b, int stages) {
    stiffness_ = max(b, 0.0f);
    stiff_wanted_ = clamp_int(stages, 0, kMaxStiffStages);
    design();
  }

  // Where the string is plucked, as a fraction of its length from the bridge
  // (0 to 0.5; 0 switches the comb off). A pluck at 1/5 has no 5th, 10th or
  // 15th partial.
  void set_pluck_position(float fraction) {
    comb_fraction_ = clamp(fraction, 0.0f, 0.5f);
    place_comb();
  }

  // One sample. `excitation` is the pluck (see PluckExciter) or zero.
  float tick(float excitation) {
    float x;
    if (tuning_ == Tuning::Interpolated) {
      delay_ += (delay_target_ - delay_) * glide_;
      const int whole = static_cast<int>(delay_);
      const float fraction = delay_ - static_cast<float>(whole);
      x = hermite(buffer_[(write_ - whole + 1) & kMask], buffer_[(write_ - whole) & kMask],
                  buffer_[(write_ - whole - 1) & kMask], buffer_[(write_ - whole - 2) & kMask], fraction);
    } else {
      x = buffer_[(write_ - whole_) & kMask];
    }
    loss_state_ = flush_denormal(x + (loss_state_ - x) * loss_a_);
    float y = loss_gain_ * loss_state_;
    for (int s = 0; s < stiff_stages_; ++s) {
      const float out = flush_denormal(stiff_a_ * y + stiff_x1_[s] - stiff_a_ * stiff_y1_[s]);
      stiff_x1_[s] = y;
      stiff_y1_[s] = out;
      y = out;
    }
    if (tuning_ == Tuning::Allpass) {
      const float out = flush_denormal(tune_a_ * y + tune_x1_ - tune_a_ * tune_y1_);
      tune_x1_ = y;
      tune_y1_ = out;
      y = out;
    }
    y += excitation;
    buffer_[write_] = y;
    // The comb's second, inverted pluck goes in further round the loop.
    if (comb_offset_ > 0 && excitation != 0.0f) buffer_[(write_ - comb_offset_) & kMask] -= excitation;
    write_ = (write_ + 1) & kMask;
    return y;
  }

  // The string `delay` samples ago (0 is what tick just returned), for a
  // pickup or a second reading point: `tick(e) - tap(q * period())` hears the
  // string through a pickup a fraction q of its length from the bridge.
  float tap(float delay) const {
    const int whole = static_cast<int>(delay);
    const float fraction = delay - static_cast<float>(whole);
    const float a = buffer_[(write_ - 1 - whole) & kMask];
    const float b = buffer_[(write_ - 2 - whole) & kMask];
    return a + (b - a) * fraction;
  }

  // Scales everything on the string, once: 0 stops it dead, 0.5 is a finger
  // laid on it for a moment before the next pluck.
  void damp(float gain) {
    for (int i = 0; i < Size; ++i) buffer_[i] *= gain;
    loss_state_ *= gain;
    for (int s = 0; s < kMaxStiffStages; ++s) {
      stiff_x1_[s] *= gain;
      stiff_y1_[s] *= gain;
    }
    tune_x1_ *= gain;
    tune_y1_ *= gain;
  }

  float frequency() const { return hz_; }
  // One period of the note in samples.
  float period() const { return period_; }

 private:
  static constexpr float kMaxLossPole = 0.98f;
  static constexpr float kMaxStiffPole = 0.9f;
  static constexpr float kMaxLoopGain = 0.99999f;

  // |H| of the loss low-pass (1 - a) / (1 - a·z⁻¹) at angular frequency w.
  static float loss_magnitude(float a, float w) {
    return (1.0f - a) / std::sqrt(1.0f - 2.0f * a * std::cos(w) + a * a);
  }
  static float loss_ratio(float a, float w1, float w2) { return loss_magnitude(a, w2) / loss_magnitude(a, w1); }
  // Phase delay in samples of the allpass (a + z⁻¹) / (1 + a·z⁻¹) at w.
  static float allpass_delay(float a, float w) {
    return 1.0f - 2.0f * std::atan2(a * std::sin(w), 1.0f + a * std::cos(w)) / w;
  }
  // How much sooner a stiffness allpass with coefficient -pole lets wn round than w1.
  static float stiff_spread(float pole, float w1, float wn) {
    return allpass_delay(-pole, w1) - allpass_delay(-pole, wn);
  }

  // The loss and stiffness coefficients for the note as it is now.
  void design() {
    if (hz_ <= 0.0f) return;
    designed_hz_ = hz_;
    const float w1 = kTwoPi * hz_ / sample_rate_;

    const float w2 = kTwoPi * clamp(max(high_hz_, 2.0f * hz_), 0.0f, 0.45f * sample_rate_) / sample_rate_;
    const float gain1 = std::pow(10.0f, -3.0f / (hz_ * decay_));
    const float gain2 = std::pow(10.0f, -3.0f / (hz_ * decay_high_));
    const float wanted = gain2 / gain1;  // how much quieter the high partial comes round
    loss_a_ = 0.0f;
    if (w2 > w1 && wanted < 1.0f) {
      float lo = 0.0f, hi = kMaxLossPole;
      if (loss_ratio(hi, w1, w2) < wanted) {
        for (int i = 0; i < 24; ++i) {
          const float mid = 0.5f * (lo + hi);
          if (loss_ratio(mid, w1, w2) > wanted) {
            lo = mid;
          } else {
            hi = mid;
          }
        }
      }
      loss_a_ = hi;
    }
    // The loop also resonates at 0 Hz, where the low-pass passes everything:
    // the gain stays below one so nothing can build up there.
    loss_gain_ = min(gain1 / loss_magnitude(loss_a_, w1), kMaxLoopGain);

    stiff_a_ = 0.0f;
    stiff_stages_ = 0;
    // Fit the allpasses so the partial `fit` lands where the law puts it.
    const int fit = clamp_int(static_cast<int>(0.2f * period_), 0, 8);
    if (stiffness_ > 0.0f && stiff_wanted_ > 0 && fit >= 2) {
      const float n = static_cast<float>(fit);
      const float stretch = std::sqrt((1.0f + stiffness_ * n * n) / (1.0f + stiffness_));
      const float wn = w1 * n * stretch;
      const float wanted_spread = period_ * (1.0f - 1.0f / stretch) / static_cast<float>(stiff_wanted_);
      float lo = 0.0f, hi = kMaxStiffPole;  // the coefficient is -pole
      if (stiff_spread(hi, w1, wn) > wanted_spread) {
        for (int i = 0; i < 24; ++i) {
          const float mid = 0.5f * (lo + hi);
          if (stiff_spread(mid, w1, wn) < wanted_spread) {
            lo = mid;
          } else {
            hi = mid;
          }
        }
      } else {
        lo = hi;
      }
      float pole = lo;
      // The allpasses must leave most of the loop to the delay line.
      while (pole > 1.0e-4f &&
             static_cast<float>(stiff_wanted_) * allpass_delay(-pole, w1) > 0.4f * period_) {
        pole *= 0.5f;
      }
      if (pole > 1.0e-4f) {
        stiff_a_ = -pole;
        stiff_stages_ = stiff_wanted_;
      }
    }
    retune();
  }

  // Sets the delay line so the loop is one period long at the fundamental.
  void retune() {
    if (hz_ <= 0.0f) return;
    const float w = kTwoPi * hz_ / sample_rate_;
    const float loss_delay = std::atan2(loss_a_ * std::sin(w), 1.0f - loss_a_ * std::cos(w)) / w;
    const float stiff_delay = static_cast<float>(stiff_stages_) * allpass_delay(stiff_a_, w);
    line_ = clamp(period_ - loss_delay - stiff_delay, 3.0f, static_cast<float>(Size - 4));
    if (tuning_ == Tuning::Interpolated) {
      delay_target_ = line_;
      if (!primed_) delay_ = delay_target_;
    } else {
      // Whole samples in the line, the rest (0.5 to 1.5) in the allpass,
      // whose phase delay is exact at the fundamental.
      whole_ = static_cast<int>(line_ - 0.5f);
      const float rest = line_ - static_cast<float>(whole_);
      tune_a_ = std::sin((1.0f - rest) * w * 0.5f) / std::sin((1.0f + rest) * w * 0.5f);
    }
    primed_ = true;
    place_comb();
  }

  // The comb's second pluck goes into the line ahead of the first, in a slot
  // the read head has not reached yet.
  void place_comb() {
    comb_offset_ = 0;
    if (comb_fraction_ <= 0.0f) return;
    const int room = static_cast<int>(line_) - 3;
    comb_offset_ = clamp_int(static_cast<int>(comb_fraction_ * period_ + 0.5f), 0, room > 0 ? room : 0);
  }

  float buffer_[Size] = {};
  int write_ = 0;
  Tuning tuning_ = Tuning::Allpass;
  float hz_ = 0.0f;
  float sample_rate_ = 48000.0f;
  float period_ = 64.0f;
  float loss_a_ = 0.0f;
  float loss_gain_ = 0.0f;
  float loss_state_ = 0.0f;
  float designed_hz_ = 0.0f;
  float decay_ = 4.0f;
  float decay_high_ = 0.5f;
  float high_hz_ = 4000.0f;
  float stiffness_ = 0.0f;
  int stiff_wanted_ = 0;
  float stiff_a_ = 0.0f;
  int stiff_stages_ = 0;
  float line_ = 32.0f;
  float stiff_x1_[kMaxStiffStages] = {};
  float stiff_y1_[kMaxStiffStages] = {};
  int whole_ = 32;
  float tune_a_ = 0.0f;
  float tune_x1_ = 0.0f;
  float tune_y1_ = 0.0f;
  float delay_ = 32.0f;
  float delay_target_ = 32.0f;
  float glide_ = 1.0f;
  float comb_fraction_ = 0.0f;
  int comb_offset_ = 0;
  bool primed_ = false;
};

// The pluck itself, for PluckedString::tick: one impulse rounded by two
// low-passes, with a little noise for the pick or the nail.
//
// The first low-pass sits at the note, which gives the 1/n fall of an ideal
// pluck's partials; the second is the pick: lower is a soft thumb, higher a
// plectrum. The level is scaled by the period, so a note's fundamental comes
// out near 0.7 × `amplitude` at any pitch.
struct PluckExciter {
  // `noise` is 0 to 1. It comes from the generator handed to `next`, so two
  // strikes from the same seed are the same sound.
  void strike(float amplitude, float hz, float pick_hz, float noise, float sample_rate) {
    const float period = sample_rate / max(hz, 1.0f);
    body_a_ = std::exp(-kTwoPi * clamp(hz, 1.0f, 0.45f * sample_rate) / sample_rate);
    pick_a_ = std::exp(-kTwoPi * clamp(pick_hz, 20.0f, 0.45f * sample_rate) / sample_rate);
    impulse_ = amplitude * period * 0.5f;
    noise_level_ = amplitude * clamp(noise, 0.0f, 1.0f) * std::sqrt(period) * 0.5f;
    noise_decay_ = time_to_coeff(0.002f, sample_rate);
    // Long enough for the slower of the two low-passes to fall 120 dB.
    const float slowest = min(clamp(hz, 1.0f, 0.45f * sample_rate), clamp(pick_hz, 20.0f, 0.45f * sample_rate));
    remaining_ = static_cast<int>(sample_rate * min(0.25f, 0.02f + 2.2f / slowest));
  }

  bool active() const { return remaining_ > 0; }

  void stop() {
    remaining_ = 0;
    impulse_ = 0.0f;
    noise_level_ = 0.0f;
    body_ = 0.0f;
    pick_ = 0.0f;
  }

  float next(Rng& rng) {
    if (remaining_ <= 0) return 0.0f;
    float x = impulse_;
    impulse_ = 0.0f;
    if (noise_level_ > 1.0e-9f) {
      x += noise_level_ * rng.bipolar();
      noise_level_ *= noise_decay_;
    }
    body_ = x + (body_ - x) * body_a_;
    pick_ = body_ + (pick_ - body_) * pick_a_;
    if (--remaining_ == 0) {
      body_ = 0.0f;
      pick_ = 0.0f;
    }
    return pick_;
  }

 private:
  float body_a_ = 0.0f;
  float pick_a_ = 0.0f;
  float body_ = 0.0f;
  float pick_ = 0.0f;
  float impulse_ = 0.0f;
  float noise_level_ = 0.0f;
  float noise_decay_ = 0.0f;
  int remaining_ = 0;
};

}  // namespace kit
}  // namespace livemix
