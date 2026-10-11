#pragma once

// Vessel: the sound played inside a body that rings.
//
//        ┌───────── the sound itself (0.4 closed to 0.7 open) ─────────┐
//   in ──┼─(+)─► up to 16 resonances in parallel ─► level trim ───────(+)─► tone ─► level match, hold ─► Mix ─► out
//        │   ▲       (frequency, decay and strength from the body,
//        │   │        Size, Material, Opening, Position, Width)
//        └─► follower ─► × pink noise × Air
//
// - A body is a table of resonances (bodies.h): a bottle, a tube open at both
//   ends, the same tube stopped, a shell, a drum, a soundboard. Each
//   resonance is one two-pole band-pass (the trapezoidal state-variable
//   filter of kit::Svf, written out here so sixteen of them cost little),
//   unity at its own frequency before its strength is applied.
// - All strengths are positive, as in a body driven and heard at one place,
//   and a band-pass's answer has a positive real part at every frequency. So
//   the body never turns against the sound itself: beside a share d of the
//   sound itself it passes at least d at every frequency (a note between two
//   sharp resonances is still heard), and Mix (a linear crossfade) cannot
//   cancel a note.
// - Size divides every frequency. Material is the time the slowest resonance
//   rings (40 ms to 4 s), the same at every Size; the upper ones die sooner.
//   Opening goes from only the low resonances to all of them and more of the
//   sound itself. Position is where the sound is heard: each resonance has
//   its own shape along the body. Width leans each resonance over 80 Hz to
//   one side, odd ones left and even ones right; each side has its own bank,
//   fed by its own input, and nothing is summed to mono.
// - Air is pink noise put into the same resonances beside the input, as loud
//   as the input is at that moment (a 5 ms / 150 ms follower): none in
//   silence.
// - Level. A tuned body passes the notes that land on its resonances far
//   more than the rest (36 dB more through the sharpest), and a line played
//   through it would jump by as much. Four things keep it in hand, in this
//   order. The level trim (bodies.h) makes a sound with equal power in every
//   octave come out as loud as it went in. The level match is a gain worked
//   out from the knobs alone, before any sound, so that a line of notes
//   comes out at its own level from the first note (bodies.h, start_gain),
//   and then refined, slowly and only upwards, by what is heard. The level
//   hold turns the wet signal down whenever it is over the loudest input of
//   late, by its peak and by its power: a note on a resonance comes out 2 dB
//   over its input, not 26. It stands still on a held note, follows a ring
//   down when the ring is cut off, and stays where it was once the input
//   stops, so a tail rings for the time Material says. After all three, a
//   soft limit that is exactly linear up to ±2 and lands on ±4.
// - A Body change crossfades over 60 ms between two banks; the old body
//   rings on under the new one while it fades.
// - Coefficients move on a 16-sample clock while a knob glides (5 ms), and
//   each resonance's strength is ramped across those 16 samples.
// - Storage: two banks of 2 x 16 resonances and a few followers. No delay
//   lines, no latency.

#include "../../kit/kit.h"
#include "bodies.h"
#include "params.gen.h"

namespace livemix {

class Vessel : public kit::DeviceBase<vessel::kNumParams> {
 public:
  static constexpr int kModes = vessel_dsp::kMaxModes;
  static constexpr int kControlPeriod = 16;
  static constexpr float kFadeSeconds = 0.06f;
  // The level hold: the wet signal against the loudest input of late, by two
  // rules at once. Its peak is kept at or under 1.5 times the input's
  // loudest peak, and its power at or under 2 dB over the input's loudest
  // power (a ringing resonance is a plain sine and a chord is not: by peaks
  // alone a held chord on a sharp resonance came out 7 dB over the input).
  static constexpr float kHoldRatio = 1.5f;
  static constexpr float kHoldRms = 1.26f;
  // The peaks fall away over 250 ms for the wet signal (slow enough to sit on
  // the peaks of a low note), and for the input over 1.3 times that or 1.3
  // times the body's slowest resonance, whichever is longer. The powers rise
  // over 10 ms and fall the same ways. The hold closes at once and opens over
  // 10 ms, and only while sound is going in: once the input stops it stays
  // where it was (or closes), so a tail rings for the time Material says, at
  // the level the note had, and is never turned up as it dies.
  static constexpr float kHoldMemory = 0.25f;
  static constexpr float kHoldRise = 0.01f;
  static constexpr float kHoldWindow = 0.1f;
  static constexpr float kPeakWait = 0.025f;
  static constexpr float kSteady = 0.5f;
  static constexpr float kDying = 0.25f;
  static constexpr float kRising = 2.0f;
  static constexpr float kRisen = 4.0f;
  // Air at full: pink noise with an RMS of 0.29 of the input's peak (0.5 times
  // 0.577; a sine of that peak has 0.707). Through the body it measures 5 to
  // 24 dB under the wet sound of a held chord: least where the chord rings
  // the body (the level hold turns both down), most where it does not. The
  // knob is Air^1.5 of that.
  static constexpr float kAirGain = 0.5f;
  // The level match is a gain on the wet signal with two parts. Its starting
  // value is worked out from the knobs alone (bodies.h, start_gain), again at
  // every change of Body, Size, Material, Opening, Position or Width, so it
  // is right before any sound. Learning only refines it, and only upwards
  // (anything too loud is the hold's to take down): the power going in and
  // the power heard (after the hold) are each averaged over half a second,
  // and while sound is passing (the input within 34 dB of the loudest of
  // late and over -100 dBFS) and the hold is open, a second factor moves
  // towards the root of their ratio with a 2 s lag, between 1 and 2. In
  // silence it stands still; it goes back to 1 while a knob of the body
  // moves, across a Body change, and out of a sleep. The two together stay
  // between 9 dB down and 12 dB up, and the gain itself follows them over
  // 5 ms.
  static constexpr float kMatchSeconds = 0.5f;
  static constexpr float kLearnSeconds = 2.0f;
  static constexpr float kLearnMin = 1.0f;
  static constexpr float kLearnMax = 2.0f;
  static constexpr float kMatchGate = 0.02f;
  static constexpr float kMatchFloor = 1.0e-5f;
  // While a knob glides the starting value is worked out again every eighth
  // control tick (128 samples) and when the glide ends.
  static constexpr int kScanEvery = 8;
  // Tone: a first-order shelf, up to 12 dB either way about 1.8 kHz.
  static constexpr float kToneHz = 1800.0f;
  static constexpr float kToneDb = 12.0f;

  void init(float sample_rate) {
    using namespace vessel;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    size_.set_time(kSmoothingSeconds, sr);
    material_.set_time(kSmoothingSeconds, sr);
    opening_.set_time(kSmoothingSeconds, sr);
    position_.set_time(kSmoothingSeconds, sr);
    air_.set_time(kSmoothingSeconds, sr);
    tone_.set_time(kSmoothingSeconds, sr);
    width_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    fade_.set_time(kFadeSeconds, sr);
    breath_.set(0.005f, 0.15f, sr);
    peak_wait_ = kit::clamp_int(static_cast<int>(0.5f * kPeakWait * sr), 1, 1 << 20);
    peak_share_ = 1.0f / static_cast<float>(peak_wait_);
    rise_rate_ = 1.0f - kit::time_to_coeff(kHoldRise, sr);
    window_rate_ = 1.0f - kit::time_to_coeff(kHoldWindow, sr);
    power_rate_ = 1.0f - kit::time_to_coeff(kMatchSeconds, sr);
    learn_rate_ = 1.0f - kit::time_to_coeff(kLearnSeconds, sr);
    match_rate_ = 1.0f - kit::time_to_coeff(kSmoothingSeconds, sr);
    for (int i = 0; i < vessel_dsp::kScanPoints; ++i) {
      scan_tan_[i] = kit::tan_prewarp(kit::kPi * vessel_dsp::scan_hz(i) / sr);
    }
    clock_.reset(kControlPeriod);
    peak_age_ = 0;
    idle_.reset(sr, 0.25f);
    asleep_ = true;
    for (int id = 0; id < kNumParams; ++id) apply(id);
    rest();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for the display.
  // 0..3: how loud each of the sixteen resonances of the body in use is
  // ringing at the output of the bank (before Mix), four to a reading. Each
  // is a whole number 0..63, its level in dB above -63 dBFS (0 for silent or
  // not in use), and a reading is four of them as digits to the base 64,
  // lowest resonance first: under 2^24, so a float carries it exactly.
  // 4: what the level hold is taking off the wet signal, in dB (0 or less).
  // 5: what the level match is adding to the wet signal, in dB.
  float meter(int index) const {
    if (index >= 0 && index < 4) {
      if (idle_.asleep()) return 0.0f;
      int packed = 0;
      for (int m = 3; m >= 0; --m) packed = packed * 64 + level_digit_[4 * index + m];
      return static_cast<float>(packed);
    }
    if (index == 4) return idle_.asleep() ? 0.0f : hold_db_;
    if (index == 5) return idle_.asleep() ? 0.0f : match_db_;
    return 0.0f;
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      asleep_ = true;
      // The control clock counts samples through the sleep, so its ticks
      // fall on the same samples whatever the block size.
      clock_.counter = (clock_.counter + frames) % clock_.period;
      peak_age_ = (peak_age_ + frames) % peak_wait_;
      return;
    }
    // Out of a sleep everything starts from rest, with the knobs where they
    // stand now: the same sound whatever the block size was while it slept.
    if (asleep_) {
      rest();
      asleep_ = false;
    }
    for (int i = 0; i < frames; ++i) {
      float raw[2];
      take_input(i, &raw[0], &raw[1]);
      // A sample that is not a number, or is far past full scale (36 dB
      // over), is taken as silence.
      const float in[2] = {sane(raw[0]), sane(raw[1])};

      if (clock_.tick()) control();
      size_.next();
      material_.next();
      position_.next();
      const float width = width_.next();
      const float opening = opening_.next();
      const float air = air_.next();
      const float fade = fade_.next();

      // Air: noise as loud as the input is now. The generator only runs
      // while there is something to follow, so its sequence does not depend
      // on how long a silence was.
      const float left_mag = in[0] < 0.0f ? -in[0] : in[0];
      const float right_mag = in[1] < 0.0f ? -in[1] : in[1];
      const float mag = left_mag > right_mag ? left_mag : right_mag;
      const float breath = breath_.process(mag);
      float drive[2] = {in[0], in[1]};
      if (breath > 0.0f) {
        const float first = pink_[0].next(rng_.bipolar());
        const float second = pink_[1].next(rng_.bipolar());
        const float amount = air * breath;
        drive[0] += amount * first;
        drive[1] += amount * (first * kit::SineTable::cos_lookup(0.25f * width) +
                              second * kit::SineTable::lookup(0.25f * width));
      }

      float wet[2] = {0.0f, 0.0f};
      for (int b = 0; b < 2; ++b) {
        const float weight = b == front_ ? fade : 1.0f - fade;
        if (weight == 0.0f) continue;
        Bank& bank = bank_[b];
        for (int c = 0; c < 2; ++c) wet[c] += weight * bank.run(c, drive[c]);
      }

      const float direct = vessel_dsp::opening_direct(opening);
      // Tone: what lies above the corner, times a gain (1 leaves it alone).
      const float lift = tone_.next() - 1.0f;
      for (int c = 0; c < 2; ++c) {
        const float full = wet[c] + direct * in[c];
        wet[c] = full + lift * shelf_[c].highpass(full);
      }

      // The level match and the level hold (see the constants above).
      loud_ = mag > loud_ ? mag : flush_denormal(loud_ * loud_release_);
      const bool present = mag > kMatchFloor && mag > kMatchGate * loud_;
      const float in_now = 0.5f * (in[0] * in[0] + in[1] * in[1]);
      in_power_ += (in_now - in_power_) * power_rate_;
      in_level_ += (in_now - in_level_) * window_rate_;
      in_sum_ += in_now;
      const float start = fade * start_[front_] + (1.0f - fade) * start_[front_ ^ 1];
      match_ += (start * learn_ - match_) * match_rate_;
      wet[0] *= match_;
      wet[1] *= match_;
      const float wet_left = wet[0] < 0.0f ? -wet[0] : wet[0];
      const float wet_right = wet[1] < 0.0f ? -wet[1] : wet[1];
      const float wet_mag = wet_left > wet_right ? wet_left : wet_right;
      // The wet peak and the powers of the last 25 ms: time is cut into
      // stretches of 12.5 ms; the peak is the larger of the one being filled
      // and the one before (it holds through the half period of a 40 Hz note
      // without sagging). A quick power is the mean of the last 25 ms: the
      // stretch being filled, the whole of the one before, and of the one
      // before that the share the first has yet to fill, so it moves by one
      // sample's worth at a time and never by a stretch's (a reading that
      // jumped at the end of a stretch made the hold jump, and a click of
      // it). Both forget a ring that is cut off within 25 ms.
      const float wet_now = 0.5f * (wet[0] * wet[0] + wet[1] * wet[1]);
      if (wet_mag > peak_now_) peak_now_ = wet_mag;
      wet_sum_ += wet_now;
      if (++peak_age_ >= peak_wait_) {
        peak_last_ = peak_now_;
        peak_now_ = 0.0f;
        wet_old_ = wet_before_;
        in_old_ = in_before_;
        wet_before_ = wet_sum_;
        in_before_ = in_sum_;
        wet_sum_ = 0.0f;
        in_sum_ = 0.0f;
        peak_age_ = 0;
      }
      const float leaving = 1.0f - static_cast<float>(peak_age_) * peak_share_;
      const float wet_quick = 0.5f * (wet_sum_ + wet_before_ + leaving * wet_old_) * peak_share_;
      const float in_quick = 0.5f * (in_sum_ + in_before_ + leaving * in_old_) * peak_share_;
      wet_level_ = peak_now_ > peak_last_ ? peak_now_ : peak_last_;
      // Each power is read the same way (power_now): a 100 ms average while
      // it is steady, the quick one once the two are far apart.
      wet_power_ += (wet_now - wet_power_) * window_rate_;
      const float heard_power = power_now(wet_power_, wet_quick);
      const float in_power_now = power_now(in_level_, in_quick);
      loud_power_ =
          in_power_now > loud_power_ ? in_power_now : flush_denormal(loud_power_ * loud_power_release_);
      float want = 1.0f;
      const float ceiling = kHoldRatio * loud_;
      if (wet_level_ > ceiling) want = ceiling / wet_level_;
      const float power_ceiling = kHoldRms * kHoldRms * loud_power_;
      if (heard_power > power_ceiling) want = kit::min(want, std::sqrt(power_ceiling / heard_power));
      if (want < hold_) {
        hold_ = want;
      } else if (present) {
        hold_ += (want - hold_) * rise_rate_;
        if (hold_ > 0.99999f) hold_ = 1.0f;
      }
      const float hold = hold_;
      out_power_ += (wet_now * hold * hold - out_power_) * power_rate_;
      if (present && (learn_goal_ < learn_ || hold >= 1.0f)) learn_ += (learn_goal_ - learn_) * learn_rate_;

      const float mix = mix_.next();
      out_left_[i] = in[0] * (1.0f - mix) + limit(wet[0] * hold) * mix;
      out_right_[i] = in[1] * (1.0f - mix) + limit(wet[1] * hold) * mix;
    }
    // The bank may still ring while Mix is at zero: stay awake for it.
    idle_.settle(kit::max(output_peak(frames), wet_level_), frames);
  }

 private:
  // One body's resonances for both sides: shared coefficients, a state and a
  // strength per side.
  struct Bank {
    int body = 0;
    int count = 0;
    float a1[kModes] = {}, a2[kModes] = {}, a3[kModes] = {};
    float ic1[2][kModes] = {}, ic2[2][kModes] = {};
    float gain[2][kModes] = {}, step[2][kModes] = {}, target[2][kModes] = {};

    void clear() {
      for (int c = 0; c < 2; ++c) {
        for (int k = 0; k < kModes; ++k) {
          ic1[c][k] = ic2[c][k] = 0.0f;
          gain[c][k] = step[c][k] = target[c][k] = 0.0f;
        }
      }
    }

    // One sample through every resonance of one side: the band output of the
    // trapezoidal state-variable filter (kit::Svf), times its strength.
    float run(int c, float x) {
      float* s1 = ic1[c];
      float* s2 = ic2[c];
      float* g = gain[c];
      const float* st = step[c];
      float sum = 0.0f;
      for (int k = 0; k < count; ++k) {
        const float v3 = x - s2[k];
        const float v1 = a1[k] * s1[k] + a2[k] * v3;
        const float v2 = s2[k] + a2[k] * s1[k] + a3[k] * v3;
        s1[k] = 2.0f * v1 - s1[k];
        s2[k] = 2.0f * v2 - s2[k];
        sum += v1 * g[k];
        g[k] += st[k];
      }
      return sum;
    }

    // A resonance that has died away is set to rest (WASM has no hardware
    // flush-to-zero). Both states together: one alone passes through zero
    // twice a cycle.
    void flush() {
      for (int c = 0; c < 2; ++c) {
        for (int k = 0; k < count; ++k) {
          const float a = ic1[c][k], b = ic2[c][k];
          if (a > -kDenormalThreshold && a < kDenormalThreshold && b > -kDenormalThreshold &&
              b < kDenormalThreshold) {
            ic1[c][k] = ic2[c][k] = 0.0f;
          }
        }
      }
    }

    void land() {
      for (int c = 0; c < 2; ++c) {
        for (int k = 0; k < kModes; ++k) {
          gain[c][k] = target[c][k];
          step[c][k] = 0.0f;
        }
      }
    }
  };

  // A power read from its 100 ms average and its quick reading (the mean of
  // the last 25 ms): the average while the quick one
  // is between half and twice it (no ripple on a low note or a beating chord,
  // whose quick readings wander), the quick one once it is under a quarter of
  // it (a ring dying away or cut off is followed down, not remembered) or
  // over four times it (a resonance starting to ring), and a blend between.
  static float power_now(float average, float quick) {
    if (quick < kSteady * average) {
      const float w = kit::max((quick - kDying * average) / ((kSteady - kDying) * average), 0.0f);
      return quick + w * (average - quick);
    }
    if (quick > kRising * average) {
      const float w = kit::min((quick - kRising * average) / ((kRisen - kRising) * average + 1.0e-30f), 1.0f);
      return average + w * (quick - average);
    }
    return average;
  }

  // Air's noise: equal power in every octave (Paul Kellet's three-pole
  // filter on white noise), so that as much of it passes a large body as a
  // small one. Its poles are fractions of the sample rate, which leaves the
  // power in each octave the same at every rate. Scaled to the RMS of the
  // white noise it is made from (0.577).
  struct Pink {
    float b0 = 0.0f, b1 = 0.0f, b2 = 0.0f;
    void reset() { b0 = b1 = b2 = 0.0f; }
    float next(float white) {
      b0 = 0.99765f * b0 + white * 0.0990460f;
      b1 = 0.96300f * b1 + white * 0.2965164f;
      b2 = 0.57000f * b2 + white * 1.0526913f;
      return kPinkScale * (b0 + b1 + b2 + white * 0.1848f);
    }
  };
  static constexpr float kPinkScale = 0.3355f;

  static float sane(float x) { return (x > -64.0f && x < 64.0f) ? x : 0.0f; }
  // Exactly linear up to ±2, landing on ±4.
  static float limit(float x) { return 4.0f * kit::soft_clip(0.25f * x); }

  // Every 16 samples: finish the last ramp, start a Body change, follow the
  // knobs that are gliding, and note how loud one resonance is.
  void control() {
    const bool fading = fade_.remaining > 0;
    if (ramping_) {
      bank_[0].land();
      bank_[1].land();
      ramping_ = false;
    }
    bank_[front_].flush();
    if (fading) bank_[front_ ^ 1].flush();

    if (!fading && bank_[front_].body != body_target_) {
      front_ ^= 1;
      Bank& bank = bank_[front_];
      bank.clear();
      bank.body = body_target_;
      tune(bank, true, true);
      fade_.snap(0.0f);
      fade_.set_target(1.0f);
      for (int k = 0; k < kModes; ++k) {
        level_power_[k] = 0.0f;
        level_digit_[k] = 0;
      }
    }

    const bool moving = !(size_.settled() && material_.settled() && opening_.settled() &&
                          position_.settled() && width_.settled());
    if (moving || pending_) {
      const bool scan = !moving || ++scan_tick_ >= kScanEvery;
      if (scan) scan_tick_ = 0;
      tune(bank_[front_], false, scan);
      if (fade_.remaining > 0) tune(bank_[front_ ^ 1], false, scan);
      ramping_ = true;
      pending_ = moving;
    }
    if (!tone_.settled() || tone_pending_) {
      set_tone();
      tone_pending_ = !tone_.settled();
    }

    // One resonance a tick, all sixteen every 5 ms at 48 kHz.
    const Bank& bank = bank_[front_];
    const int k = level_cursor_;
    level_cursor_ = (level_cursor_ + 1) & (kModes - 1);
    float power = 0.0f;
    if (k < bank.count) {
      for (int c = 0; c < 2; ++c) {
        const float amplitude2 = bank.ic1[c][k] * bank.ic1[c][k] + bank.ic2[c][k] * bank.ic2[c][k];
        power = kit::max(power, amplitude2 * bank.gain[c][k] * bank.gain[c][k]);
      }
    }
    level_power_[k] = kit::max(power, level_power_[k] * kLevelFall);
    const float p = level_power_[k];
    level_digit_[k] =
        p > 1.0e-7f ? kit::clamp_int(static_cast<int>(63.5f + 10.0f * std::log10(p)), 0, 63) : 0;
    hold_db_ = hold_ < 1.0f ? 20.0f * std::log10(kit::max(hold_, 1.0e-4f)) : 0.0f;
    match_db_ = match_ == 1.0f ? 0.0f : 20.0f * std::log10(match_);

    // Learning's goal: the factor that makes what is heard as loud as what
    // went in, over the stretch both were measured; at most 6 dB from 1, and
    // with the starting value inside the match's whole range. While a knob
    // of the body moves or a Body change fades, it goes back to 1 instead:
    // what was learnt belongs to the body as it was.
    if (moving || fade_.remaining > 0) {
      learn_ += (1.0f - learn_) * kLearnForget;
      learn_goal_ = learn_;
    } else if (in_power_ > 1.0e-12f && out_power_ > 1.0e-12f) {
      const float begin = start_[front_];
      const float low = kit::max(kLearnMin, vessel_dsp::kMatchMin / begin);
      const float high = kit::min(kLearnMax, vessel_dsp::kMatchMax / begin);
      learn_goal_ = kit::clamp(learn_ * std::sqrt(in_power_ / out_power_), low, high);
    } else {
      learn_goal_ = learn_;
    }
  }

  // The bank's coefficients and strengths from the knobs as they stand
  // (bodies.h has the laws). `snap` puts the strengths there at once;
  // otherwise they ramp over the next 16 samples. `scan` works out the level
  // match's starting value for this bank as well.
  void tune(Bank& bank, bool snap, bool scan) {
    using namespace vessel_dsp;
    const Body& body = kBodies[bank.body];
    const float sr = sample_rate();
    const float size = std::exp2(size_.value);
    const float material = material_.value;
    const float tilt = opening_tilt(opening_.value);
    const float direct = opening_direct(opening_.value);
    const float x = listen_at(body, position_.value);
    const float width = width_.value;
    bank.count = body.count;
    float strength[kModes];
    float inverse_q[kModes];
    float inverse_g[kModes];
    float lean_of[kModes];
    float power = 0.0f;
    float step = 0.0f;
    float longest = 0.0f;
    for (int k = 0; k < body.count; ++k) {
      const Mode& mode = body.modes[k];
      const float hz = mode_hz(body, k, size);
      const float seconds = mode_seconds(mode, material);
      const float q = kit::clamp(kQPerHzSecond * hz * seconds, kQMin, kQMax);
      if (seconds > longest) longest = seconds;
      const float g = kit::tan_prewarp(kit::kPi * kit::clamp(hz, 5.0f, sr * 0.49f) / sr);
      const float kk = 1.0f / q;
      bank.a1[k] = 1.0f / (1.0f + g * (g + kk));
      bank.a2[k] = g * bank.a1[k];
      bank.a3[k] = g * bank.a2[k];
      inverse_q[k] = kk;
      inverse_g[k] = 1.0f / g;
      strength[k] = mode.gain * mode_shape(mode, x) * std::pow(mode.ratio, -tilt) * in_range(hz, sr);
      lean_of[k] = mode_lean(k, hz, width);
      const float lean = lean_of[k];
      power += strength[k] * strength[k] * (1.0f + lean * lean) * kk;
      step += strength[k] * kk;
    }
    const float trim = level_trim(power, step, direct);
    for (int c = 0; c < 2; ++c) {
      for (int k = 0; k < kModes; ++k) {
        const float target =
            k < body.count ? trim * strength[k] * inverse_q[k] * (c == 0 ? 1.0f + lean_of[k] : 1.0f - lean_of[k])
                           : 0.0f;
        bank.target[c][k] = target;
        if (snap) {
          bank.gain[c][k] = target;
          bank.step[c][k] = 0.0f;
        } else {
          bank.step[c][k] = (target - bank.gain[c][k]) * (1.0f / kControlPeriod);
        }
      }
    }
    // The level match's starting value (bodies.h, start_gain): what the two
    // sides pass at each reading, the part they share and the part that
    // leans, whose powers add.
    if (scan) {
      float heard[kScanPoints];
      for (int i = 0; i < kScanPoints; ++i) {
        float real = direct, imaginary = 0.0f, lean_real = 0.0f, lean_imaginary = 0.0f;
        for (int k = 0; k < body.count; ++k) {
          float re, im;
          mode_answer(scan_tan_[i] * inverse_g[k], inverse_q[k], &re, &im);
          const float amount = trim * strength[k];
          const float lean = amount * lean_of[k];
          real += amount * re;
          imaginary += amount * im;
          lean_real += lean * re;
          lean_imaginary += lean * im;
        }
        heard[i] = real * real + imaginary * imaginary + lean_real * lean_real + lean_imaginary * lean_imaginary;
      }
      start_[&bank == &bank_[0] ? 0 : 1] = start_gain(heard, kHoldRms);
    }
    // "Of late", for the level hold (see kHoldMemory).
    if (&bank == &bank_[front_]) {
      const float tau = kHoldSlower * kit::max(kHoldMemory, longest / 6.9078f);
      loud_release_ = kit::time_to_coeff(tau, sr);
      loud_power_release_ = loud_release_ * loud_release_;
    }
  }

  // Tone is H(s) = (g s + w) / (s + w), a first-order shelf of gain g above
  // its corner. The corner is put at kToneHz times the root of g, so that
  // cut and boost are mirror images about kToneHz: the shelf runs from
  // kToneHz / sqrt(g) to kToneHz sqrt(g) either way.
  void set_tone() {
    const float corner = kToneHz * std::sqrt(tone_.value);
    for (int c = 0; c < 2; ++c) shelf_[c].set_cutoff(corner, sample_rate());
  }

  // Everything at rest with the knobs where they stand: after init and out
  // of every sleep.
  void rest() {
    size_.snap(size_.target);
    material_.snap(material_.target);
    opening_.snap(opening_.target);
    position_.snap(position_.target);
    air_.snap(air_.target);
    tone_.snap(tone_.target);
    width_.snap(width_.target);
    mix_.snap(mix_.target);
    fade_.snap(1.0f);
    front_ = 0;
    bank_[0].clear();
    bank_[1].clear();
    bank_[0].body = body_target_;
    bank_[1].body = body_target_;
    tune(bank_[0], true, true);
    start_[1] = start_[0];
    for (int c = 0; c < 2; ++c) shelf_[c].reset();
    set_tone();
    tone_pending_ = false;
    rng_.seed(0x6E3A51C7u);
    pink_[0].reset();
    pink_[1].reset();
    breath_.reset();
    wet_level_ = 0.0f;
    loud_ = 0.0f;
    in_power_ = 0.0f;
    wet_power_ = 0.0f;
    wet_old_ = 0.0f;
    wet_sum_ = 0.0f;
    in_sum_ = 0.0f;
    in_old_ = 0.0f;
    wet_before_ = 0.0f;
    in_before_ = 0.0f;
    peak_now_ = 0.0f;
    peak_last_ = 0.0f;
    out_power_ = 0.0f;
    loud_power_ = 0.0f;
    in_level_ = 0.0f;
    learn_ = 1.0f;
    learn_goal_ = 1.0f;
    match_ = start_[0];
    hold_ = 1.0f;
    scan_tick_ = 0;
    hold_db_ = 0.0f;
    match_db_ = 0.0f;
    ramping_ = false;
    pending_ = false;
    level_cursor_ = 0;
    for (int k = 0; k < kModes; ++k) {
      level_power_[k] = 0.0f;
      level_digit_[k] = 0;
    }
  }

  void apply(int id) {
    using namespace vessel;
    const float value = param(id);
    // Before the first block and while asleep a knob lands at once.
    const bool glide = primed() && !asleep_;
    switch (id) {
      case kBody:
        body_target_ = kit::clamp_int(static_cast<int>(value + 0.5f), 0, vessel_dsp::kNumBodies - 1);
        break;
      case kSize:
        size_.set(std::log2(value), glide);
        pending_ = true;
        break;
      case kMaterial:
        material_.set(value, glide);
        pending_ = true;
        break;
      case kOpening:
        opening_.set(value, glide);
        pending_ = true;
        break;
      case kPosition:
        position_.set(value, glide);
        pending_ = true;
        break;
      case kAir:
        air_.set(value * std::sqrt(value) * kAirGain, glide);
        break;
      case kTone:
        tone_.set(kit::db_to_gain((value - 0.5f) * 2.0f * kToneDb), glide);
        tone_pending_ = true;
        break;
      case kWidth:
        width_.set(value, glide);
        pending_ = true;
        break;
      case kMix:
        mix_.set(value, glide);
        break;
      default:
        break;
    }
  }

  // The hold's memory of the input is this much slower than what it is held against.
  static constexpr float kHoldSlower = 1.3f;
  // What was learnt is forgotten at this rate per control tick while the body
  // changes (to a tenth in about 15 ms at 48 kHz).
  static constexpr float kLearnForget = 0.05f;
  // A resonance's reading falls by this each time it is looked at (5 ms).
  static constexpr float kLevelFall = 0.84f;

  Bank bank_[2];
  int front_ = 0;
  int body_target_ = 0;
  kit::LinearRamp fade_;
  kit::Smoother size_, material_, opening_, position_, air_, tone_, width_, mix_;
  kit::OnePole shelf_[2];
  kit::Follower breath_;
  float wet_level_ = 0.0f;
  float in_power_ = 0.0f;
  float wet_power_ = 0.0f;
  float power_rate_ = 0.0f;
  float out_power_ = 0.0f;
  float loud_power_ = 0.0f;
  float loud_power_release_ = 0.0f;
  float window_rate_ = 0.0f;
  float peak_share_ = 1.0f;
  float wet_sum_ = 0.0f;
  float in_sum_ = 0.0f;
  float in_old_ = 0.0f;
  float wet_before_ = 0.0f;
  float in_before_ = 0.0f;
  float wet_old_ = 0.0f;
  int peak_wait_ = 1;
  int peak_age_ = 0;
  float peak_now_ = 0.0f;
  float peak_last_ = 0.0f;
  float in_level_ = 0.0f;
  float rise_rate_ = 0.0f;
  float match_ = 1.0f;
  float match_rate_ = 0.0f;
  float start_[2] = {1.0f, 1.0f};
  float learn_ = 1.0f;
  float learn_goal_ = 1.0f;
  float learn_rate_ = 0.0f;
  float hold_ = 1.0f;
  float scan_tan_[vessel_dsp::kScanPoints] = {};
  int scan_tick_ = 0;
  kit::Rng rng_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float loud_ = 0.0f;
  float loud_release_ = 0.0f;
  Pink pink_[2];
  bool asleep_ = true;
  bool ramping_ = false;
  bool pending_ = false;
  bool tone_pending_ = false;
  // For meter() only: never read by the sound.
  float hold_db_ = 0.0f;
  float match_db_ = 0.0f;
  float level_power_[kModes] = {};
  int level_digit_[kModes] = {};
  int level_cursor_ = 0;
};

}  // namespace livemix
