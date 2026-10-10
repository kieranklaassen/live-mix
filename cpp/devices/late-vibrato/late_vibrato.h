#pragma once

// Late Vibrato: a pitch vibrato that waits. A note begins straight; once it
// has been held for Wait the pitch starts to sway, and the sway opens to its
// full Depth over Grow. A new attack sends it back to straight.
//
//   in ──┬──► delay, kLatency samples ───────────────────────────► dry ──┐
//        │                                                              mix ──► out
//        ├──► delay, kLatency + offset ──► level and brightness ──► wet ─┘
//        │                 ▲                        ▲
//        │       offset' = −bend(t)       Swell × sway
//        │                 ▲
//        │       bend = sway × Depth × sin(phase)        (in cents)
//        │                 ▲
//        └──► detector ──► note age ──► sway (0..1)
//
// - The bend is the thing that is set, not the delay: every sample the read
//   point moves by exactly the pitch ratio the bend asks for, so the cents on
//   the knob are the cents that are heard, at any Rate, and when the sway
//   falls to nothing the pitch is straight on that sample (the read point
//   simply stops where it is). A weak pull towards the centre, in proportion
//   to the sway and three cycles long, keeps the read point from wandering;
//   it takes 0.14 % off the depth.
// - Straight means home. When the sway has fallen to nothing the read point
//   is wherever the cycle left it, and it is drawn home to its centre: by no
//   more pitch than the sway was deep (and by 2 cents at the least, to land),
//   at the pace of the sway itself (kHomeTurns). So a new note bends the
//   sound that is held by no more than the Depth and never jumps or clicks:
//   there is no splice. Once home, and until the next sway, the wet signal IS
//   the dry signal, sample for sample. So a short note leaves as it came, and
//   with Mix part way a held note opens from one voice into a chorus instead
//   of sitting on a comb the whole time. A sway that opens again before the
//   last one is home swings on top of what is left (swing_ and rest_).
// - Both paths are delayed by kLatency samples (20 ms at 48 kHz), which is
//   what device.json reports; it never changes. The read point may swing
//   9.9 ms either side of it (less above 96 kHz). A sway can reach twice its
//   steady swing when it opens at the wrong moment of the cycle, so the Depth
//   that fits is 53.9 cents for each Hz of Rate (Human makes that a little
//   less); more than that is held to it. 100 cents fit from 1.9 Hz up. What
//   an earlier sway left off centre is taken off that room, and the hold
//   goes through Depth's own smoother, so a Rate thrown down does not step.
// - The cycle runs freely and is never reset: not by an attack, not by
//   silence. It keeps running while the device rests, on the same samples
//   whatever the host's block size.
// - The effect follows the newest note. A new note is new energy in some
//   part of the spectrum, heard by the detector in note_detector.h (40 bands;
//   a legato change of pitch, a melody over a held chord and a note struck
//   over ringing ones count; a beat, a tremolo, a stack of detuned saws and a
//   slow swell do not). Sense sets how large a share of what is sounding the
//   new energy must be. When a new note comes, everything that sounds goes
//   back to straight with it: a held chord under a melody too.
//   A quick envelope of the whole signal (0.5 ms up, 15 ms down) against one
//   that lags it (20 ms up, 350 ms down) says when nothing sounds: under
//   −80 dBFS, or 32 dB under the lagging one, the note is over and whatever
//   comes next is a new one.
// - While a note is younger than Wait the sway falls (30 ms for all of it);
//   older, it rises along an S over Grow. Quicken raises the rate with the
//   sway, by half at the most. Human wanders the rate by up to 12 % and the
//   depth by up to 25 %, each with three slow sines.
// - Swell lifts the swaying signal with the sway: its level (up to 2.3 dB)
//   and, through a shelf above 1.5 kHz, its brightness (up to 5.1 dB more),
//   both pulsing with the cycle, sharp being louder and brighter.
// - Width moves the right side's cycle ahead of the left's: half a cycle at
//   the most, and never so far that the two sides come more than 0.5 ms
//   apart (kWidthMostSeconds), which is where their sum to mono starts to
//   lose its upper half. A slow, deep sway therefore gets less of a lead
//   (aim_width), and a gap that opens anyway is drawn in (kHoldPulls).
// - Wet and dry are the same signal a moment apart, so Mix is a linear
//   crossfade: equal power would add 3 dB half way while the note is straight.
//   Once the sway is open the two no longer add in step and the linear sum
//   sinks, by up to 3 dB half way. The device measures how far (the power of
//   each and what they have in common, over 30 ms) and lifts the sum back to
//   the level the two would have in step: by 3 dB at the most, and by
//   nothing, exactly, while the read points are home (aim_lift).
// - Rest: 2048 samples and 50 ms after the last sample of input the delay is
//   empty; the device then puts out exact zeros and holds its note state
//   cleared until input returns. Knobs moved meanwhile have arrived when it
//   does. Both moments are decided sample by sample, never by block.
// - Input that is not a number is taken as silence, and no sample is let in
//   larger than 16.
//
// Storage: two delay lines of 2048 samples (the longest read is 1919 samples
// at any rate), a shared table of 1548 sinc taps and the detector's 40 bands:
// 26 kB.

#include "../../kit/kit.h"
#include "note_detector.h"
#include "params.gen.h"
#include "sinc_read.h"

namespace livemix {

class LateVibrato : public kit::DeviceBase<late_vibrato::kNumParams> {
 public:
  // The fixed delay of both paths, as reported in device.json (latencySamples).
  static constexpr int kLatency = 960;

  void init(float sample_rate) {
    using namespace late_vibrato;
    kit::SineTable::init();
    late_vibrato_detail::SincRead::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int c = 0; c < 2; ++c) {
      line_[c].clear();
      shelf_[c].reset();
      shelf_[c].set_cutoff(kShelfHz, sr);
    }
    detector_.init(sr);
    fast_attack_ = kit::time_to_coeff(kFastAttackSeconds, sr);
    fast_release_ = kit::time_to_coeff(kFastReleaseSeconds, sr);
    lag_attack_ = kit::time_to_coeff(kLagAttackSeconds, sr);
    lag_release_ = kit::time_to_coeff(kLagReleaseSeconds, sr);
    depth_.set_time(kSmoothingSeconds, sr);
    swell_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    apart_.set_time(0.02f, sr);
    lift_.set_time(kLiftSeconds, sr);
    lift_.snap(1.0f);
    power_step_ = 1.0f - kit::time_to_coeff(kPowerSeconds, sr);
    width_most_ = static_cast<double>(kWidthMostSeconds * sr);
    // The room either side of the centre, in samples: all there is up to
    // 96 kHz in seconds, so a setting sways alike at every rate up to there.
    const float room = static_cast<float>(kLatency - kGuard);
    room_ = kit::min(room, room * sr * (1.0f / 96000.0f));
    cents_per_hz_ = room_ / sr * kit::kPi * kCentsPerOctave / kLn2;
    fall_step_ = 1.0f / (kFallSeconds * sr);
    rest_after_ = kLineSize + static_cast<long>(kRestSeconds * sr);
    phase_ = 0.0;
    rate_wander_.seed(0x5A17C0DEu);
    rate_wander_.set_rate(kRateWanderHz, sr);
    depth_wander_.seed(0x0B0E51A7u);
    depth_wander_.set_rate(kDepthWanderHz, sr);
    clock_.reset(kControlPeriod);
    resting_ = true;
    quiet_ = 0;
    clear_note();
    for (int id = 0; id < kNumParams; ++id) apply(id);
    arrive();
    rate_now_ = param(kRate);
    increment_ = static_cast<double>(rate_now_) / sr;
    depth_factor_ = 1.0f;
    leak_ = 0.0f;
    pull_ = 0.0;
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for a display to draw:
  // 0, how long the note now sounding has been held, in seconds (0 between
  // notes and at rest); 1, the depth of the sway now, in cents each way (0
  // while the note is straight); 2, where the sway is in its cycle (0..1; the
  // bend is the depth times the sine of it); 3, the rate of the sway now, Hz.
  float meter(int index) const {
    switch (index) {
      case 0:
        return resting_ ? 0.0f : static_cast<float>(age_) / sample_rate();
      case 1:
        return cents_now_;
      case 2:
        return static_cast<float>(phase_);
      case 3:
        return rate_now_;
      default:
        return 0.0f;
    }
  }

  void process(int frames) {
    using namespace late_vibrato;
    frames = begin_block(frames);
    if (resting_ && !input_present(frames)) {
      // Nothing to do but let the cycle run on, as it would have awake.
      for (int i = 0; i < frames; ++i) run_cycle();
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      in[0] = admit(in[0]);
      in[1] = admit(in[1]);
      const bool sound = sounds(in[0]) || sounds(in[1]);
      if (resting_) {
        if (!sound) {
          out_left_[i] = 0.0f;
          out_right_[i] = 0.0f;
          run_cycle();
          continue;
        }
        resting_ = false;
        quiet_ = 0;
        arrive();
      }
      quiet_ = sound ? 0 : quiet_ + 1;
      if (quiet_ >= rest_after_) {
        // The delay has emptied and the shelf has rung out: stop here, on
        // this sample, whatever the block size.
        rest();
        out_left_[i] = 0.0f;
        out_right_[i] = 0.0f;
        run_cycle();
        continue;
      }

      update_cycle();
      line_[0].write(in[0]);
      line_[1].write(in[1]);
      const float dry[2] = {line_[0].read(kLatency + 1), line_[1].read(kLatency + 1)};

      follow(in[0], in[1]);
      // Younger than Wait the sway falls; older it rises, once the read
      // point is back on the centre.
      const bool young = static_cast<float>(age_) < wait_samples_;
      if (young) {
        u_ = kit::max(0.0f, u_ - fall_step_);
      } else {
        u_ = kit::min(1.0f, u_ + grow_step_);
      }
      sway_ = u_ * u_ * (3.0f - 2.0f * u_);

      const float cents = sway_ * depth_.next() * depth_factor_;
      cents_now_ = cents;
      if (cents > deepest_) deepest_ = cents;
      // The way home never bends more than the sway did, nor less than
      // kLandCents, which is how it arrives.
      const double most_home =
          static_cast<double>(kit::max(deepest_, kLandCents) * (kLn2 / kCentsPerOctave));
      const float apart = apart_.next();
      const float swell = swell_.next() * sway_;
      const float mix = mix_.next();
      const float phase = static_cast<float>(phase_);
      float out[2];
      float both = 0.0f, wet_power = 0.0f, dry_power = 0.0f;
      bool centred = true;
      float wave[2];
      double offset[2];
      for (int c = 0; c < 2; ++c) {
        wave[c] = kit::SineTable::lookup(c == 0 ? phase : phase + apart);
        if (sway_ > 0.0f) {
          // The ratio a bend of so many cents is, less one, to second order
          // (0.06 cents out at 100): sharp reads faster, so the delay shrinks.
          const float v = (kLn2 / kCentsPerOctave) * cents * wave[c];
          double swing = swing_[c] - static_cast<double>(v + 0.5f * v * v);
          swing -= swing * static_cast<double>(sway_ * leak_);
          if (swing > -1.0e-12 && swing < 1.0e-12) swing = 0.0;
          swing_[c] = swing;
        }
        // The way home: what this sway has left of the read point, as the
        // note that made it gives way to a new one, and what earlier ones left.
        if (back_ > 0.0f && swing_[c] != 0.0) {
          swing_[c] -= static_cast<double>(back_) * home(swing_[c], most_home);
        }
        if (rest_[c] != 0.0) rest_[c] -= home(rest_[c], most_home);
        offset[c] = swing_[c] + rest_[c];
      }
      // The two sides are held together: where they are further apart than
      // Width at its fullest puts them (a sway that opened at an awkward
      // moment of a slow cycle stands off centre, each side its own way),
      // what is over is drawn in from both, four times as hard as a read
      // point is drawn home: they then stand at most an eighth further apart.
      const double gap = offset[0] - offset[1];
      const double over = (gap < 0.0 ? -gap : gap) - width_most_;
      if (over > 0.0) {
        const double step = 0.5 * over * kHoldPulls * pull_ * (gap < 0.0 ? -1.0 : 1.0);
        swing_[0] -= step;
        swing_[1] += step;
        offset[0] -= step;
        offset[1] += step;
      }
      for (int c = 0; c < 2; ++c) {
        if (offset[c] > room_ || offset[c] < -room_) {
          offset[c] = offset[c] > 0.0 ? room_ : -static_cast<double>(room_);
          swing_[c] = offset[c] - rest_[c];
        }
        float wet = dry[c];
        if (offset[c] != 0.0) {
          const double delay = static_cast<double>(kLatency) + offset[c];
          const int whole = static_cast<int>(delay);
          wet = late_vibrato_detail::SincRead::read(line_[c], whole,
                                                    static_cast<float>(delay - whole));
          centred = false;
        }
        const float low = shelf_[c].lowpass(wet);
        if (swell > 0.0f) {
          wet += (wet - low) * swell * (kShelfRise + kShelfPulse * wave[c]);
          wet *= 1.0f + swell * (kLevelRise + kLevelPulse * wave[c]);
        }
        out[c] = dry[c] + (wet - dry[c]) * mix;
        wet_power += wet * wet;
        dry_power += dry[c] * dry[c];
        both += wet * dry[c];
      }
      // What the straight and the swaying sound have in common, for the lift
      // that keeps a part-way Mix as loud as its two voices (aim_lift).
      wet_power_ = flush_denormal(wet_power_ + (wet_power - wet_power_) * power_step_);
      dry_power_ = flush_denormal(dry_power_ + (dry_power - dry_power_) * power_step_);
      both_ = both_ + (both - both_) * power_step_;
      if (both_ > -1.0e-30f && both_ < 1.0e-30f) both_ = 0.0f;
      centred_ = centred;
      const float lift = lift_.next();
      if (lift != 1.0f) {
        out[0] *= lift;
        out[1] *= lift;
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];

      // While the note is young its sway's read point is drawn home, a pull
      // that comes on as the sway goes off; once it is all on, what is left
      // is no longer this sway's.
      const bool away = swing_[0] != 0.0 || swing_[1] != 0.0;
      if (young && away) {
        back_ = kit::min(1.0f, back_ + fall_step_);
        if (back_ == 1.0f && u_ == 0.0f) {
          for (int c = 0; c < 2; ++c) {
            rest_[c] += swing_[c];
            swing_[c] = 0.0;
          }
          back_ = 0.0f;
        }
      } else {
        back_ = kit::max(0.0f, back_ - fall_step_);
      }
      if (!away && u_ == 0.0f && rest_[0] == 0.0 && rest_[1] == 0.0) deepest_ = 0.0f;
      advance_cycle();
    }
  }

 private:
  static constexpr int kLineSize = 2048;
  // The nearest the read point comes to the write point: the sinc's reach.
  static constexpr int kGuard = 8;
  static constexpr int kControlPeriod = 16;
  static constexpr float kLn2 = 0.69314718f;
  static constexpr float kCentsPerOctave = 1200.0f;

  static constexpr float kFallSeconds = 0.03f;
  static constexpr float kLandCents = 2.0f;
  static constexpr double kLandStep = 2.0 * 0.69314718 / 1200.0;  // kLandCents as a ratio less one
  static constexpr float kHomeTurns = 2.0f;  // the pull home, against the swing's own turning
  static constexpr float kWidthMostSeconds = 0.0005f;  // the most the two sides are ever apart
  static constexpr double kHoldPulls = 4.0;
  static constexpr float kPowerSeconds = 0.03f;
  static constexpr float kLiftSeconds = 0.02f;
  static constexpr float kLiftMost = 1.4142135f;  // 3 dB
  static constexpr float kRestSeconds = 0.05f;
  static constexpr float kLeakCycles = 3.0f;
  static constexpr float kQuickenMost = 0.5f;
  static constexpr float kHumanRate = 0.12f;
  static constexpr float kHumanDepth = 0.25f;
  static constexpr float kRateWanderHz = 0.23f;
  static constexpr float kDepthWanderHz = 0.31f;

  static constexpr float kShelfHz = 1500.0f;
  static constexpr float kShelfRise = 0.5f;
  static constexpr float kShelfPulse = 0.3f;
  static constexpr float kLevelRise = 0.18f;
  static constexpr float kLevelPulse = 0.12f;

  static constexpr float kFastAttackSeconds = 0.0005f;
  static constexpr float kFastReleaseSeconds = 0.015f;
  static constexpr float kLagAttackSeconds = 0.02f;
  static constexpr float kLagReleaseSeconds = 0.35f;
  static constexpr float kFloor = 0.0001f;       // −80 dBFS: under it nothing sounds
  // −32 dB against the lagging envelope. The trough of a beat between two
  // equal notes, however slow, stands at 15 ms / 350 ms of it (−27 dB): the
  // two envelopes' release times. So a beat is never the end of a note.
  static constexpr float kEndRatio = 0.025f;
  static constexpr float kInputMost = 16.0f;
  static constexpr long kAgeMost = 1L << 30;

  static float admit(float x) {
    if (!(x == x)) return 0.0f;
    if (x > kInputMost) return kInputMost;
    if (x < -kInputMost) return -kInputMost;
    return x;
  }

  // Whether a sample is sound at all: one in the denormal range is not, and
  // must not keep the device from resting.
  static bool sounds(float x) { return x >= kDenormalThreshold || x <= -kDenormalThreshold; }

  // Every 16 samples, awake or at rest: the rate of the cycle now, how much
  // Human leans on the depth, the most Depth that fits, the pull to the centre.
  void update_cycle() {
    using namespace late_vibrato;
    if (!clock_.tick()) return;
    const float sr = sample_rate();
    const float human = param(kHuman);
    const float rate = param(kRate);
    const float rate_lean = kHumanRate * human * rate_wander_.next(kControlPeriod);
    const float depth_lean = kHumanDepth * human * depth_wander_.next(kControlPeriod);
    rate_now_ = rate * (1.0f + kQuickenMost * param(kQuicken) * sway_) * (1.0f + rate_lean);
    increment_ = static_cast<double>(rate_now_) / sr;
    depth_factor_ = 1.0f + depth_lean;
    leak_ = rate_now_ / (kLeakCycles * sr);
    // The pull home: twice what would take the bend the swing itself had to
    // bring its far end back, so from there it is that bend, held, and then
    // less and less of it (the way halves every eighteenth of a cycle).
    pull_ = static_cast<double>(kHomeTurns * 2.0f * kit::kPi * rate_now_ / sr);
    aim_depth();
    aim_lift();
  }

  // The lift that is aimed at. With Mix part way the straight and the swaying
  // sound are one signal a moment apart, and where they have drifted out of
  // step they add to less than their two levels: about 3 dB less at Mix 0.5
  // for anything with highs in it, so a held note would sink as its sway
  // opens. The lift is what brings the mix back to the level its two voices
  // would have in step, from their powers and their product over the last
  // 30 ms; 3 dB at the most, so a single tone the two cancel is still let go.
  // While the read points are home the two are the same samples and the lift
  // is exactly 1.
  void aim_lift() {
    float lift = 1.0f;
    const float mix = mix_.value;
    if (!centred_ && mix > 0.0f && mix < 1.0f) {
      const float wet = std::sqrt(wet_power_);
      const float dry = std::sqrt(dry_power_);
      const float in_step = mix * wet + (1.0f - mix) * dry;
      const float as_is = mix * mix * wet_power_ + (1.0f - mix) * (1.0f - mix) * dry_power_ +
                          2.0f * mix * (1.0f - mix) * both_;
      if (as_is > 1.0e-20f && in_step * in_step > as_is) {
        lift = kit::min(kLiftMost, in_step / std::sqrt(as_is));
      }
    }
    lift_.set_target(lift);
  }

  // The lead that is aimed at: how far ahead of the left side's cycle the
  // right side's runs. At full Width the two sides are as far apart as they
  // can be, but never more than kWidthMostSeconds in time: half a cycle when
  // the swing is small (a fast or a shallow sway), less when it is large, so
  // that a slow deep sway does not put milliseconds between the sides, which
  // is a comb when they are summed. Width is a share of that lead. Sized, as
  // the Depth that fits is, for the slowest and the deepest Human makes it.
  void aim_width() {
    using namespace late_vibrato;
    const float human = param(kHuman);
    const float cents = depth_.target * (1.0f + kHumanDepth * human);
    const float rate = param(kRate) * (1.0f - kHumanRate * human);
    const float swing = cents * (kLn2 / kCentsPerOctave) / (2.0f * kit::kPi * rate);  // seconds each way
    const float reach = swing > 0.5f * kWidthMostSeconds ? 0.5f * kWidthMostSeconds / swing : 1.0f;
    apart_.set_target(param(kWidth) * std::asin(reach) * (1.0f / kit::kPi));
  }

  // The Depth that is aimed at: the knob, held to what fits. Sized for the
  // slowest and the deepest Human can make it, and for what an earlier sway
  // has left of the read point. Reached through the smoother, so the hold
  // moves without a step when Rate does.
  void aim_depth() {
    using namespace late_vibrato;
    const float human = param(kHuman);
    most_cents_ =
        cents_per_hz_ * param(kRate) * (1.0f - kHumanRate * human) / (1.0f + kHumanDepth * human);
    const double left = kit::max(std::fabs(rest_[0]), std::fabs(rest_[1]));
    const float free = 1.0f - kit::min(1.0f, static_cast<float>(left) / room_);
    depth_.set_target(kit::min(param(kDepth), most_cents_ * free));
    aim_width();
  }

  // One sample's step home for a read point `x` samples out: in proportion
  // to how far out it is, never more than `most` (the sway's own bend), and
  // at the last a steady kLandCents until it is there exactly.
  double home(double x, double most) const {
    const double out = x < 0.0 ? -x : x;
    double step = out * pull_;
    if (step > most) step = most;
    if (step < kLandStep) step = kLandStep;
    if (step > out) step = out;
    return x < 0.0 ? -step : step;
  }

  void advance_cycle() {
    phase_ += increment_;
    if (phase_ >= 1.0) phase_ -= 1.0;
  }

  void run_cycle() {
    update_cycle();
    advance_cycle();
  }

  // Sets age_, in samples since the newest note began. The detector hears the
  // notes (note_detector.h); the level of the whole signal says when nothing
  // is sounding at all.
  void follow(float left, float right) {
    const float level = kit::max(std::fabs(left), std::fabs(right));
    fast_ = flush_denormal(level + (fast_ - level) * (level > fast_ ? fast_attack_ : fast_release_));
    lag_ = flush_denormal(fast_ + (lag_ - fast_) * (fast_ > lag_ ? lag_attack_ : lag_release_));
    const bool over = fast_ < kFloor || fast_ < kEndRatio * lag_;
    if (over) lag_ = fast_;
    const bool attack = detector_.hear(left, right, over);
    if (attack || over) {
      age_ = 0;
    } else if (age_ < kAgeMost) {
      ++age_;
    }
  }

  // Everything a note leaves behind, cleared: the state the device rests in.
  void clear_note() {
    for (int c = 0; c < 2; ++c) {
      swing_[c] = 0.0;
      rest_[c] = 0.0;
      shelf_[c].reset();
    }
    back_ = 0.0f;
    deepest_ = 0.0f;
    wet_power_ = dry_power_ = both_ = 0.0f;
    centred_ = true;
    lift_.snap(1.0f);
    detector_.clear();
    fast_ = 0.0f;
    lag_ = 0.0f;
    age_ = 0;
    u_ = 0.0f;
    sway_ = 0.0f;
    cents_now_ = 0.0f;
  }

  void rest() {
    resting_ = true;
    clear_note();
  }

  // Nothing is sounding: a knob moved meanwhile is where it was put.
  void arrive() {
    depth_.snap(depth_.target);
    swell_.snap(swell_.target);
    mix_.snap(mix_.target);
    apart_.snap(apart_.target);
  }

  void apply(int id) {
    using namespace late_vibrato;
    const float value = param(id);
    const float sr = sample_rate();
    switch (id) {
      case kWait:
        wait_samples_ = value * 0.001f * sr;
        break;
      case kGrow:
        grow_step_ = 1.0f / (value * 0.001f * sr);
        break;
      case kDepth:
      case kRate:
      case kHuman:
        aim_depth();
        break;
      case kSwell:
        swell_.set_target(value);
        break;
      case kSense:
        detector_.set_sense(value);
        break;
      case kWidth:
        aim_width();
        break;
      case kMix:
        mix_.set_target(value);
        break;
      default:
        break;  // Quicken is read on the control clock, as Rate and Human are
    }
    // At rest nothing sounds, so a knob is there at once.
    if (resting_) arrive();
  }

  kit::DelayLine<kLineSize> line_[2];
  kit::OnePole shelf_[2];
  late_vibrato_detail::NoteDetector detector_;
  kit::Smoother depth_, swell_, mix_, apart_, lift_;
  kit::Drift rate_wander_, depth_wander_;
  kit::ControlClock clock_;

  // The cycle: free-running, in double so a slow rate still moves.
  double phase_ = 0.0;
  double increment_ = 0.0;
  float rate_now_ = 5.0f;
  float depth_factor_ = 1.0f;
  float most_cents_ = 100.0f;
  float leak_ = 0.0f;

  // The level of the whole signal: a quick envelope and one that lags it.
  float fast_ = 0.0f;
  float lag_ = 0.0f;
  float fast_attack_ = 0.0f, fast_release_ = 0.0f, lag_attack_ = 0.0f, lag_release_ = 0.0f;

  // The note's life.
  long age_ = 0;
  float wait_samples_ = 0.0f;
  float grow_step_ = 0.0f;
  float fall_step_ = 0.0f;
  float u_ = 0.0f;      // along the rise, 0 straight and 1 fully open
  float sway_ = 0.0f;   // the S of it: the share of Depth now
  float cents_now_ = 0.0f;

  // The read points, as samples away from kLatency: in double, so that a
  // bend of a hundredth of a cent still moves one that stands far out.
  // `swing_` is what the sway now open (or closing) has made of it, `rest_`
  // what earlier ones left behind, on its way home.
  double swing_[2] = {0.0, 0.0};
  double rest_[2] = {0.0, 0.0};
  double pull_ = 0.0;     // the share of the way home taken each sample
  double width_most_ = 24.0;  // kWidthMostSeconds in samples
  float back_ = 0.0f;     // how much of that pull the closing sway feels, 0..1
  float deepest_ = 0.0f;  // the deepest this sway has been, in cents
  float room_ = 0.0f;
  float cents_per_hz_ = 0.0f;

  // The powers of the swaying and the straight sound and their product, over
  // kPowerSeconds, both sides together.
  float wet_power_ = 0.0f, dry_power_ = 0.0f, both_ = 0.0f;
  float power_step_ = 0.0f;
  bool centred_ = true;  // both read points were home on the last sample

  // Rest.
  bool resting_ = true;
  long quiet_ = 0;
  long rest_after_ = kLineSize;
};

}  // namespace livemix
