#pragma once

// One string of a tanpura: a stiff string loop whose bridge end is a jawari,
// the wide curved bridge the string grazes once in every swing.
//
//   string (one period less everything below) ─► loss ─► stiffness ─► a ─┬───────── c ───┐
//        ▲                                                               └ cs ► trap     │
//        │                                                                     ▲  │ s    │
//        │                                                                -c ──┘  └ cs ►(+)─► out
//        └──────────────────────────────── pluck ►(+)◄────────────────────────────────────┘
//
// - The string is cut a short way from its bridge end. The short piece is
//   the trap. While the string is off the bridge (c = 0) the wave runs
//   through the trap and the loop is one period long.
// - Where the wave swings past the gap the string lies down on the bridge
//   (c towards 1): the wave turns round at the contact point, sooner by the
//   trap's length, and what was in the trap stays there until the string
//   lifts off again.
// - The junction is a rotation of the pair (trap output, arriving wave) by
//   the contact angle, so it neither makes nor loses energy whatever the
//   contact does. The string can only ring down.
// - The string is stiff (an allpass stretches its partials). On a stiff
//   string the edge the bridge cuts into the wave spreads as it travels, and
//   that is what makes the band of overtones open after the pluck and slide
//   down as the string dies: without stiffness the same bridge buzzes but
//   the buzz does not move.
// - The loop runs at twice the host's sample rate and the contact is soft
//   (a smooth step on a low-passed copy of the wave) so what the bridge adds
//   stays under the loop's Nyquist.
//
// - How much the bridge does depends on the string's pitch, because the bloom
//   takes a number of periods to open and has to fit under the loop's
//   Nyquist. Measured at full contact at 48 kHz: 9 to 11 dB of bloom on
//   strings from 49 to 262 Hz, 5 to 7 dB at 392 and 523 Hz, 3 dB at 33 Hz and
//   none from 784 Hz up, where the string is all but plain.
//
// A string that has rung down below kFloor goes to sleep and is not
// rendered, which is also why the loop needs no denormal flushing.

#include "../../kit/kit.h"

namespace livemix {

class JawariString {
 public:
  // 16.35 Hz (an octave under C1) at 192 kHz, twice a 96 kHz host, is 11743.
  static constexpr int kSize = 16384;
  static constexpr float kMinHz = 16.0f;

  // The figures below are choices, each settled by measurement on one string
  // at C3 (see cpp/test/tanpura_test.cpp), not measurements of an instrument.
  //
  // Inharmonicity B of f_n = n f0 sqrt(1 + B n^2). At full contact 1e-5 to
  // 4e-5 all bloom by 11 to 12 dB; with no stiffness the bloom halves and
  // the band does not slide, and over 8e-5 it is over in a quarter second.
  // One allpass does as well as four.
  static constexpr float kInharmonicity = 2.0e-5f;
  // The trap, as a share of the period. The bloom grows with it (2, 7, 10,
  // 11 dB at 0.1, 0.2, 0.3, 0.5 %); from 0.8 % the note goes 30 cents sharp
  // and its fundamental collapses.
  static constexpr float kTrapShare = 0.005f;
  // How far the wave must swing before it touches, and the swing over which
  // contact closes, in units of a full pluck. A wide reach is the soft
  // contact: 0.05 folds back at -45 dB, 0.3 with the smoothing below at -79.
  static constexpr float kGap = 0.1f;
  static constexpr float kReach = 0.3f;
  static constexpr float kContactHz = 6000.0f;
  // Upper partials die sooner: a sixth of the ring time at 3 kHz.
  static constexpr float kHighHz = 3000.0f;
  static constexpr float kHighShare = 1.0f / 6.0f;
  // Under this swing (100 dB under a full pluck) a string is asleep.
  static constexpr float kFloor = 1.0e-5f;

  // `loop_rate` is the rate render() runs at (twice the host's). `tick_rate`
  // is how often follow() is called.
  void init(float loop_rate, float tick_rate) {
    rate_ = loop_rate;
    contact_a_ = std::exp(-kit::kTwoPi * kContactHz / rate_);
    damp_k_ = 1.0f - kit::time_to_coeff(0.002f, rate_);
    follow_k_ = kit::time_to_coeff(0.3f, tick_rate);
    position_ = 0.0f;
    design(110.0f, 10.0f);
    clear();
  }

  bool awake() const { return awake_; }
  // How hard the string is swinging: about 1 for a full pluck.
  float level() const { return awake_ ? level_ : 0.0f; }

  // Tune the string and get it ready for a pluck: `hz` is its pitch, `decay`
  // the seconds its fundamental takes to fall 60 dB and `position` the pluck
  // point as a share of its length (0.5 is the middle). A string still
  // ringing keeps ringing; the finger is lifted (see damp).
  void strike(float hz, float decay, float position) {
    hz = kit::clamp(hz, kMinHz, 0.1f * rate_);
    if (hz != hz_ || decay != decay_) design(hz, decay);
    if (!awake_) clear();
    position_ = position;
    place_comb();
    awake_ = true;
    level_ = kit::max(level_, 1.0f);
    damp_target_ = 1.0f;
  }

  // Lay a finger on the string: from now it rings for `seconds` at most.
  void damp(float seconds) {
    damp_target_ = seconds < decay_ ? std::pow(10.0f, -3.0f / hz_ * (1.0f / seconds - 1.0f / decay_)) : 1.0f;
  }

  void sleep() {
    awake_ = false;
    level_ = 0.0f;
  }

  // Once per control tick: follow the level and fall asleep below the floor.
  void follow() {
    if (!awake_) return;
    const float now = last_ < 0.0f ? -last_ : last_;
    level_ = kit::max(now, level_ * follow_k_);
    if (level_ < kFloor) sleep();
  }

  // `n` samples at the loop rate into `out`. `excitation` is the pluck (null
  // when there is none) and `contact` how firmly the bridge holds the string,
  // 0 (a plain string) to 1, per sample.
  void render(const float* excitation, const float* contact, float* out, int n) {
    int write = write_;
    int trap_write = trap_write_;
    float loss = loss_state_, gain = gain_, swing = contact_state_;
    float tune_x1 = tune_x1_, tune_y1 = tune_y1_;
    float stiff_x1 = stiff_x1_, stiff_y1 = stiff_y1_;
    float trap_x1 = trap_x1_, trap_y1 = trap_y1_;
    // The one-poles are written as two products and a sum, which leaves one
    // multiply and one add between a sample's state and the next one's.
    const float loss_a = loss_a_, loss_b = 1.0f - loss_a_;
    const float gain_a = 1.0f - damp_k_, gain_b = loss_gain_ * damp_target_ * damp_k_;
    const float contact_a = contact_a_, contact_b = 1.0f - contact_a_;
    const float tune = tune_a_, stiff = stiff_a_, eta = trap_eta_;
    const int whole = whole_, trap_whole = trap_whole_, comb = comb_offset_;
    constexpr float inv_reach = 1.0f / kReach;
    for (int i = 0; i < n; ++i) {
      // The string: whole samples, an allpass for the rest of the period,
      // the losses, and the allpass that makes it stiff.
      const float x = buffer_[(write - whole) & kMask];
      const float tuned = tune * x + tune_x1 - tune * tune_y1;
      tune_x1 = x;
      tune_y1 = tuned;
      loss = loss * loss_a + tuned * loss_b;
      gain = gain * gain_a + gain_b;
      const float lossy = gain * loss;
      const float a = stiff * lossy + stiff_x1 - stiff * stiff_y1;
      stiff_x1 = lossy;
      stiff_y1 = a;

      // The bridge. Off it the wave goes through the trap untouched.
      swing = swing * contact_a + a * contact_b;
      const float over = swing - kGap;
      float y;
      if (over > 0.0f && contact[i] > 0.0f) {
        const float c = over * inv_reach < 1.0f ? over * inv_reach : 1.0f;
        const float sn = contact[i] * c * c * (3.0f - 2.0f * c);
        const float cs = std::sqrt(kit::max(0.0f, 1.0f - sn * sn));
        float s;
        if (trap_whole == 0) {
          // A trap shorter than a sample and a half is the allpass alone, so
          // the junction's loop has no delay in it and is solved in place.
          const float q = trap_x1 - eta * trap_y1;
          const float in = (cs * a - sn * q) / (1.0f + sn * eta);
          s = eta * in + q;
          trap_x1 = in;
        } else {
          const float v = trap_[(trap_write - trap_whole) & kTrapMask];
          s = eta * v + trap_x1 - eta * trap_y1;
          trap_x1 = v;
          trap_[trap_write] = cs * a - sn * s;
          trap_write = (trap_write + 1) & kTrapMask;
        }
        trap_y1 = s;
        y = cs * s + sn * a;
      } else if (trap_whole == 0) {
        y = eta * a + trap_x1 - eta * trap_y1;
        trap_x1 = a;
        trap_y1 = y;
      } else {
        const float v = trap_[(trap_write - trap_whole) & kTrapMask];
        y = eta * v + trap_x1 - eta * trap_y1;
        trap_x1 = v;
        trap_y1 = y;
        trap_[trap_write] = a;
        trap_write = (trap_write + 1) & kTrapMask;
      }

      // The pluck, and its mirror image a pluck-point away: the comb that
      // takes out every partial with a node under the finger.
      if (excitation != nullptr) {
        y += excitation[i];
        buffer_[(write - comb) & kMask] -= comb > 0 ? excitation[i] : 0.0f;
      }
      buffer_[write] = y;
      write = (write + 1) & kMask;
      out[i] = y;
    }
    write_ = write;
    trap_write_ = trap_write;
    loss_state_ = loss;
    gain_ = gain;
    contact_state_ = swing;
    tune_x1_ = tune_x1;
    tune_y1_ = tune_y1;
    stiff_x1_ = stiff_x1;
    stiff_y1_ = stiff_y1;
    trap_x1_ = trap_x1;
    trap_y1_ = trap_y1;
    if (n > 0) last_ = out[n - 1];
  }

 private:
  static constexpr int kMask = kSize - 1;
  static constexpr int kTrapSize = 64;
  static constexpr int kTrapMask = kTrapSize - 1;
  static constexpr int kStiffFit = 16;  // the harmonic whose stretch the allpass matches

  // Gain of the loss low-pass y = (1 - a) x + a y1 at a frequency whose
  // cosine is `cosw`, and the phase delay in samples of the two filter kinds.
  static float loss_magnitude(float a, float cosw) {
    return (1.0f - a) / std::sqrt(1.0f - 2.0f * a * cosw + a * a);
  }
  static float lowpass_delay(float a, float w) { return std::atan2(a * std::sin(w), 1.0f - a * std::cos(w)) / w; }
  static float allpass_delay(float a, float w) {
    return 1.0f - 2.0f * std::atan2(a * std::sin(w), 1.0f + a * std::cos(w)) / w;
  }

  void clear() {
    for (float& v : buffer_) v = 0.0f;
    for (float& v : trap_) v = 0.0f;
    write_ = 0;
    trap_write_ = 0;
    loss_state_ = 0.0f;
    contact_state_ = 0.0f;
    tune_x1_ = tune_y1_ = 0.0f;
    stiff_x1_ = stiff_y1_ = 0.0f;
    trap_x1_ = trap_y1_ = 0.0f;
    damp_target_ = 1.0f;
    gain_ = loss_gain_;
    last_ = 0.0f;
    level_ = 0.0f;
    awake_ = false;
  }

  // Everything in the loop but the delay line, and then the delay line as
  // one period less the phase delay of all of it at the fundamental.
  void design(float hz, float decay) {
    hz_ = hz;
    decay_ = decay;
    const float period = rate_ / hz;
    const float w1 = kit::kTwoPi / period;

    // Loss: a one-pole low-pass and a gain that give the ring time at the
    // fundamental and kHighShare of it at kHighHz (or the second partial).
    const float w2 = kit::kTwoPi * kit::clamp(kit::max(kHighHz, 2.0f * hz), 0.0f, 0.45f * rate_) / rate_;
    const float cos1 = std::cos(w1), cos2 = std::cos(w2);
    const float gain1 = std::pow(10.0f, -3.0f / (hz * decay));
    const float wanted = std::pow(10.0f, -3.0f / (hz * decay * kHighShare)) / gain1;
    float lo = 0.0f, hi = 0.995f;
    if (loss_magnitude(hi, cos2) / loss_magnitude(hi, cos1) < wanted) {
      for (int i = 0; i < 30; ++i) {
        const float mid = 0.5f * (lo + hi);
        if (loss_magnitude(mid, cos2) / loss_magnitude(mid, cos1) > wanted) {
          lo = mid;
        } else {
          hi = mid;
        }
      }
    }
    loss_a_ = hi;
    loss_gain_ = kit::min(gain1 / loss_magnitude(loss_a_, cos1), 0.99999f);
    float others = lowpass_delay(loss_a_, w1);

    // Stiffness: an allpass whose delay falls from the fundamental to
    // harmonic `fit` by as much as the stiff string's period shrinks.
    const int fit = kit::clamp_int(static_cast<int>(0.2f * period), 2, kStiffFit);
    const float harmonic = static_cast<float>(fit);
    const float stretch = std::sqrt((1.0f + kInharmonicity * harmonic * harmonic) / (1.0f + kInharmonicity));
    const float wn = w1 * harmonic * stretch;
    const float spread = period * (1.0f - 1.0f / stretch);
    float pole_lo = 0.0f, pole_hi = 0.95f;
    if (allpass_delay(-pole_hi, w1) - allpass_delay(-pole_hi, wn) > spread) {
      for (int i = 0; i < 30; ++i) {
        const float mid = 0.5f * (pole_lo + pole_hi);
        if (allpass_delay(-mid, w1) - allpass_delay(-mid, wn) < spread) {
          pole_lo = mid;
        } else {
          pole_hi = mid;
        }
      }
    } else {
      pole_lo = pole_hi;
    }
    stiff_a_ = -pole_lo;
    others += allpass_delay(stiff_a_, w1);

    // The trap: whole samples and an allpass for the rest, so it can be
    // shorter than a sample on a high string.
    const float trap = kit::clamp(kTrapShare * period, 0.15f, static_cast<float>(kTrapSize - 4));
    trap_whole_ = trap < 1.5f ? 0 : static_cast<int>(trap - 0.5f);
    const float rest = trap - static_cast<float>(trap_whole_);
    trap_eta_ = (1.0f - rest) / (1.0f + rest);
    others += static_cast<float>(trap_whole_) + allpass_delay(trap_eta_, w1);

    // The rest of the period: whole samples and an allpass of half a sample
    // to a sample and a half, exact at the fundamental.
    const float line = kit::clamp(period - others, 2.0f, static_cast<float>(kSize - 4));
    whole_ = static_cast<int>(line - 0.5f);
    const float rest_of_line = line - static_cast<float>(whole_);
    tune_a_ = std::sin(0.5f * (1.0f - rest_of_line) * w1) / std::sin(0.5f * (1.0f + rest_of_line) * w1);
    period_ = period;
    place_comb();
  }

  // The mirror pluck goes into the line behind the write head, in a slot the
  // read head has not reached yet.
  void place_comb() {
    const int room = whole_ - 3;
    comb_offset_ = kit::clamp_int(static_cast<int>(position_ * period_ + 0.5f), 0, room > 0 ? room : 0);
  }

  float buffer_[kSize] = {};
  float trap_[kTrapSize] = {};
  int write_ = 0;
  int trap_write_ = 0;
  float rate_ = 96000.0f;
  float hz_ = 0.0f;
  float decay_ = 0.0f;
  float period_ = 64.0f;
  float position_ = 0.0f;
  float loss_a_ = 0.0f, loss_gain_ = 0.0f, loss_state_ = 0.0f;
  float stiff_a_ = 0.0f;
  float stiff_x1_ = 0.0f, stiff_y1_ = 0.0f;
  int trap_whole_ = 0;
  float trap_eta_ = 0.0f, trap_x1_ = 0.0f, trap_y1_ = 0.0f;
  int whole_ = 32;
  float tune_a_ = 0.0f, tune_x1_ = 0.0f, tune_y1_ = 0.0f;
  int comb_offset_ = 0;
  float contact_a_ = 0.0f, contact_state_ = 0.0f;
  float gain_ = 0.0f, damp_target_ = 1.0f, damp_k_ = 0.0f;
  float follow_k_ = 0.0f;
  float last_ = 0.0f;
  float level_ = 0.0f;
  bool awake_ = false;
};

}  // namespace livemix
