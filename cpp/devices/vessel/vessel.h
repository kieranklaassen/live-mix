#pragma once

// Vessel: the sound played inside a body that rings.
//
//                 ┌──────────────── direct (Opening²) ───────────────┐
//   in ──┬──(+)───┴─► up to 16 resonances in parallel ─► level trim ─(+)─► tone ─► level match, hold ─► Mix ─► out
//        │   ▲           (frequency, decay and strength from the
//        │   │            body, Size, Material, Opening, Position)
//        └─► follower ─► × noise × Air
//
// - A body is a table of resonances (bodies.h): a bottle, a tube open at both
//   ends, the same tube stopped, a shell, a drum, a soundboard. Each
//   resonance is one two-pole band-pass (the trapezoidal state-variable
//   filter of kit::Svf, written out here so sixteen of them cost little),
//   unity at its own frequency before its strength is applied.
// - All strengths are positive, as in a body driven and heard at one place,
//   so between two resonances the body has a dip of its own, and the wet
//   signal never turns against the dry one: Mix (a linear crossfade) cannot
//   cancel a note, only show the body's dips part of the way.
// - Size divides every frequency. Material is the time the slowest resonance
//   rings (40 ms to 4 s), the same at every Size; the upper ones die sooner.
//   Opening goes from only the low resonances to all of them plus some of the
//   sound itself. Position is where the sound is heard: each resonance has
//   its own shape along the body. Width leans each resonance to one side,
//   odd ones left and even ones right, the lowest staying in the middle;
//   each side has its own bank, fed by its own input, and nothing is summed
//   to mono.
// - Air is noise put into the same resonances beside the input, as loud as
//   the input is at that moment (a 5 ms / 150 ms follower): none in silence.
// - Level. The level trim (bodies.h) makes a sound with equal power in every
//   octave come out as loud as it went in. Played notes are not that: they
//   land on a resonance or between two, and through sharp resonances a
//   phrase came out up to 16 dB quieter than it went in. So two things ride
//   the wet signal. The level match is slow: it averages the power going in
//   and the power coming out over half a second and, only while sound is
//   passing, moves a gain (9 dB down to 12 dB up) towards their ratio; in
//   silence it stands still, so it never bends a tail. The level hold is
//   fast: the wet signal is turned down whenever it is more than 1.5 times
//   the loudest input of late, where "of late" fades at the rate of the
//   body's own slowest resonance (so the hold never cuts a tail short
//   either). After both, a soft limit that is exactly linear up to ±2 and
//   lands on ±4.
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
  // The level hold: the wet signal against the loudest input of late.
  static constexpr float kHoldRatio = 1.5f;
  // Both levels are peaks that fall away: at once up, and down over 250 ms
  // for the wet signal (slow enough to sit on the peaks of a low note: it
  // sags 3 % between two peaks at 130 Hz, 10 % at 40 Hz), and for the input
  // over 1.3 times that or 1.3 times the body's slowest resonance, whichever
  // is longer. The input's memory is always the longer of the two, so once
  // the input stops the hold can only let go, never close.
  static constexpr float kHoldRelease = 0.25f;
  // Air at full: noise 1.5 times the input's peak (uniform noise has an RMS
  // of 0.577, a sine of the same peak 0.707). The knob is Air^1.5 of that.
  static constexpr float kAirGain = 1.5f;
  // The level match: the power going in and the power coming out of the
  // body are each averaged over half a second, and while sound is passing
  // (the input within 34 dB of the loudest of late and over -100 dBFS) the
  // gain moves towards the root of their ratio with a 300 ms lag, between
  // 9 dB down and 12 dB up. In silence it stays where it is, so it never
  // touches a tail, and it is kept through a sleep.
  static constexpr float kMatchSeconds = 0.5f;
  static constexpr float kMatchSlew = 0.3f;
  static constexpr float kMatchGate = 0.02f;
  static constexpr float kMatchFloor = 1.0e-5f;
  static constexpr float kMatchMin = 0.355f;
  static constexpr float kMatchMax = 4.0f;
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
    level_release_ = kit::time_to_coeff(kHoldRelease, sr);
    power_rate_ = 1.0f - kit::time_to_coeff(kMatchSeconds, sr);
    match_rate_ = 1.0f - kit::time_to_coeff(kMatchSlew, sr);
    match_ = 1.0f;
    noise_scale_ = std::sqrt(sr / 48000.0f);
    clock_.reset(kControlPeriod);
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
        const float first = rng_.bipolar();
        const float second = rng_.bipolar();
        const float amount = air * breath * noise_scale_;
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

      // The level match and the level hold (see the top of the file).
      loud_ = mag > loud_ ? mag : flush_denormal(loud_ * loud_release_);
      in_power_ += (0.5f * (in[0] * in[0] + in[1] * in[1]) - in_power_) * power_rate_;
      wet_power_ += (0.5f * (wet[0] * wet[0] + wet[1] * wet[1]) - wet_power_) * power_rate_;
      if (mag > kMatchFloor && mag > kMatchGate * loud_) match_ += (match_goal_ - match_) * match_rate_;
      const float match = match_;
      wet[0] *= match;
      wet[1] *= match;
      const float wet_left = wet[0] < 0.0f ? -wet[0] : wet[0];
      const float wet_right = wet[1] < 0.0f ? -wet[1] : wet[1];
      const float wet_mag = wet_left > wet_right ? wet_left : wet_right;
      wet_level_ = wet_mag > wet_level_ ? wet_mag : flush_denormal(wet_level_ * level_release_);
      const float level = wet_level_;
      const float ceiling = kHoldRatio * loud_;
      const float hold = level > ceiling ? ceiling / level : 1.0f;
      hold_now_ = hold;

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
      tune(bank, true);
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
      tune(bank_[front_], false);
      if (fade_.remaining > 0) tune(bank_[front_ ^ 1], false);
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
    hold_db_ = hold_now_ < 1.0f ? 20.0f * std::log10(kit::max(hold_now_, 1.0e-4f)) : 0.0f;
    match_db_ = match_ == 1.0f ? 0.0f : 20.0f * std::log10(match_);

    // The level match's goal: the gain that makes the body as loud as what
    // went into it, over the stretch both were measured.
    if (in_power_ > 1.0e-12f && wet_power_ > 1.0e-12f) {
      match_goal_ = kit::clamp(std::sqrt(in_power_ / wet_power_), kMatchMin, kMatchMax);
    } else {
      match_goal_ = match_;
    }
  }

  // The bank's coefficients and strengths from the knobs as they stand
  // (bodies.h has the laws). `snap` puts the strengths there at once;
  // otherwise they ramp over the next 16 samples.
  void tune(Bank& bank, bool snap) {
    using namespace vessel_dsp;
    const Body& body = kBodies[bank.body];
    const float sr = sample_rate();
    const float size = std::exp2(size_.value);
    const float material = material_.value;
    const float tilt = opening_tilt(opening_.value);
    const float x = listen_at(body, position_.value);
    const float width = width_.value;
    bank.count = body.count;
    float strength[kModes];
    float inverse_q[kModes];
    float share = 0.0f;
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
      strength[k] = mode.gain * mode_shape(mode, x) * std::pow(mode.ratio, -tilt) * in_range(hz, sr);
      share += strength[k] * strength[k] * kk;
    }
    const float trim = level_trim(share);
    for (int c = 0; c < 2; ++c) {
      for (int k = 0; k < kModes; ++k) {
        const float target =
            k < body.count ? trim * strength[k] * inverse_q[k] * side_gain(k, width, c) : 0.0f;
        bank.target[c][k] = target;
        if (snap) {
          bank.gain[c][k] = target;
          bank.step[c][k] = 0.0f;
        } else {
          bank.step[c][k] = (target - bank.gain[c][k]) * (1.0f / kControlPeriod);
        }
      }
    }
    // "Of late", for the level hold (see kHoldRelease).
    if (&bank == &bank_[front_]) {
      const float tau = kHoldSlower * kit::max(kHoldRelease, longest / 6.9078f);
      loud_release_ = kit::time_to_coeff(tau, sr);
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
    tune(bank_[0], true);
    for (int c = 0; c < 2; ++c) shelf_[c].reset();
    set_tone();
    tone_pending_ = false;
    rng_.seed(0x6E3A51C7u);
    breath_.reset();
    wet_level_ = 0.0f;
    loud_ = 0.0f;
    in_power_ = 0.0f;
    wet_power_ = 0.0f;
    match_goal_ = match_;
    hold_now_ = 1.0f;
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
  float level_release_ = 0.0f;
  float in_power_ = 0.0f;
  float wet_power_ = 0.0f;
  float power_rate_ = 0.0f;
  float match_ = 1.0f;
  float match_goal_ = 1.0f;
  float match_rate_ = 0.0f;
  kit::Rng rng_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float loud_ = 0.0f;
  float loud_release_ = 0.0f;
  float noise_scale_ = 1.0f;
  bool asleep_ = true;
  bool ramping_ = false;
  bool pending_ = false;
  bool tone_pending_ = false;
  // For meter() only: never read by the sound.
  float hold_now_ = 1.0f;
  float hold_db_ = 0.0f;
  float match_db_ = 0.0f;
  float level_power_[kModes] = {};
  int level_digit_[kModes] = {};
  int level_cursor_ = 0;
};

}  // namespace livemix
