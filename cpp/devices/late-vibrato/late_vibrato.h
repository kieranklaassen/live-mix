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
// - Straight means untouched. When the sway has fallen to nothing the wet
//   read is spliced back onto the dry one over 10 ms, and from then until the
//   next sway the wet signal IS the dry signal, sample for sample. So a short
//   note leaves as it came, and with Mix part way a held note opens from one
//   voice into a chorus instead of sitting on a comb the whole time.
// - Both paths are delayed by kLatency samples (20 ms at 48 kHz), which is
//   what device.json reports; it never changes. The read point may swing
//   9.9 ms either side of it (less above 96 kHz). A sway can reach twice its
//   steady swing when it opens at the wrong moment of the cycle, so the Depth
//   that fits is 53.9 cents for each Hz of Rate (Human makes that a little
//   less); more than that is held to it. 100 cents fit from 1.9 Hz up.
// - The cycle runs freely and is never reset: not by an attack, not by
//   silence. It keeps running while the device rests, on the same samples
//   whatever the host's block size.
// - A new note is a rise: a fast envelope (0.5 ms up, 15 ms down) against one
//   that lags it (20 ms up, 350 ms down), over the whole signal and over
//   three bands of it (under 250 Hz, between, over 2.5 kHz), so that a quiet
//   high note over a loud low one counts. Sense sets how far the fast one
//   must stand above the other: 18 dB at 0, 3.2 dB at the default, 1 dB at 1.
//   Beating between held notes rises too slowly to count until Sense is high.
//   When the level falls under −66 dBFS, or 32 dB under the lagging envelope,
//   the note is over and the next sound is a new one.
// - While a note is younger than Wait the sway falls (30 ms for all of it);
//   older, it rises along an S over Grow. Quicken raises the rate with the
//   sway, by half at the most. Human wanders the rate by up to 12 % and the
//   depth by up to 25 %, each with three slow sines.
// - Swell lifts the swaying signal with the sway: its level (up to 2.3 dB)
//   and, through a shelf above 1.5 kHz, its brightness (up to 5.1 dB more),
//   both pulsing with the cycle, sharp being louder and brighter.
// - Width moves the right side's cycle ahead of the left's, half a cycle at
//   the most.
// - Wet and dry are the same signal a moment apart, so Mix is a linear
//   crossfade: equal power would add 3 dB half way while the note is straight.
// - Rest: 2048 samples and 50 ms after the last sample of input the delay is
//   empty; the device then puts out exact zeros and holds its note state
//   cleared until input returns. Knobs moved meanwhile have arrived when it
//   does. Both moments are decided sample by sample, never by block.
// - Input that is not a number is taken as silence, and no sample is let in
//   larger than 16.
//
// Storage: two delay lines of 2048 samples (the longest read is 1919 samples
// at any rate) and a shared table of 1548 sinc taps: 23 kB.

#include "../../kit/kit.h"
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
    split_low_.set_cutoff(kLowBandHz, sr);
    split_high_.set_cutoff(kHighBandHz, sr);
    fast_attack_ = kit::time_to_coeff(kFastAttackSeconds, sr);
    fast_release_ = kit::time_to_coeff(kFastReleaseSeconds, sr);
    lag_attack_ = kit::time_to_coeff(kLagAttackSeconds, sr);
    lag_release_ = kit::time_to_coeff(kLagReleaseSeconds, sr);
    depth_.set_time(kSmoothingSeconds, sr);
    swell_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    apart_.set_time(0.02f, sr);
    // The room either side of the centre, in samples: all there is up to
    // 96 kHz in seconds, so a setting sways alike at every rate up to there.
    const float room = static_cast<float>(kLatency - kGuard);
    room_ = kit::min(room, room * sr * (1.0f / 96000.0f));
    cents_per_hz_ = room_ / sr * kit::kPi * kCentsPerOctave / kLn2;
    fall_step_ = 1.0f / (kFallSeconds * sr);
    splice_length_ = static_cast<int>(kSpliceSeconds * sr);
    if (splice_length_ < 1) splice_length_ = 1;
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
    most_cents_ = cents_per_hz_ * param(kRate);
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
      if (static_cast<float>(age_) >= wait_samples_) {
        if (splice_left_ == 0) u_ = kit::min(1.0f, u_ + grow_step_);
      } else {
        u_ = kit::max(0.0f, u_ - fall_step_);
      }
      sway_ = u_ * u_ * (3.0f - 2.0f * u_);

      const float cents = sway_ * kit::min(depth_.next(), most_cents_) * depth_factor_;
      cents_now_ = cents;
      const float apart = apart_.next();
      const float swell = swell_.next() * sway_;
      const float mix = mix_.next();
      const float phase = static_cast<float>(phase_);
      // The splice's share of the dry read: 0 as it begins, 1 as it ends.
      float splice = 0.0f;
      if (splice_left_ > 0) {
        const float t = 1.0f - static_cast<float>(splice_left_) / static_cast<float>(splice_length_);
        splice = t * t * (3.0f - 2.0f * t);
      }

      float out[2];
      for (int c = 0; c < 2; ++c) {
        const float wave = kit::SineTable::lookup(c == 0 ? phase : phase + apart);
        if (sway_ > 0.0f) {
          // The ratio a bend of so many cents is, less one, to second order
          // (0.06 cents out at 100): sharp reads faster, so the delay shrinks.
          const float v = (kLn2 / kCentsPerOctave) * cents * wave;
          double offset = offset_[c] - static_cast<double>(v + 0.5f * v * v);
          offset -= offset * static_cast<double>(sway_ * leak_);
          if (offset > room_) offset = room_;
          if (offset < -room_) offset = -room_;
          if (offset > -1.0e-12 && offset < 1.0e-12) offset = 0.0;
          offset_[c] = offset;
        }
        float wet = dry[c];
        if (offset_[c] != 0.0) {
          const double delay = static_cast<double>(kLatency) + offset_[c];
          const int whole = static_cast<int>(delay);
          wet = late_vibrato_detail::SincRead::read(line_[c], whole,
                                                    static_cast<float>(delay - whole));
          wet += (dry[c] - wet) * splice;
        }
        const float low = shelf_[c].lowpass(wet);
        if (swell > 0.0f) {
          wet += (wet - low) * swell * (kShelfRise + kShelfPulse * wave);
          wet *= 1.0f + swell * (kLevelRise + kLevelPulse * wave);
        }
        out[c] = dry[c] + (wet - dry[c]) * mix;
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];

      if (splice_left_ > 0) {
        if (--splice_left_ == 0) offset_[0] = offset_[1] = 0.0;
      } else if (u_ == 0.0f && (offset_[0] != 0.0 || offset_[1] != 0.0)) {
        splice_left_ = splice_length_;
      }
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
  static constexpr float kSpliceSeconds = 0.01f;
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

  static constexpr int kDetectors = 4;  // the whole signal, lows, middle, highs
  static constexpr float kLowBandHz = 250.0f;
  static constexpr float kHighBandHz = 2500.0f;
  static constexpr float kFastAttackSeconds = 0.0005f;
  static constexpr float kFastReleaseSeconds = 0.015f;
  static constexpr float kLagAttackSeconds = 0.02f;
  static constexpr float kLagReleaseSeconds = 0.35f;
  static constexpr float kFloor = 0.0005f;       // −66 dBFS: under it nothing sounds
  // −32 dB against the lagging envelope. The trough of a beat between two
  // equal notes, however slow, stands at 15 ms / 350 ms of it (−27 dB): the
  // two envelopes' release times. So a beat is never the end of a note.
  static constexpr float kEndRatio = 0.025f;
  static constexpr float kBandShare = 0.0631f;   // a band counts from −24 dB of the whole
  static constexpr float kRiseMostDb = 18.0f;    // Sense 0
  static constexpr float kRiseLeastDb = 1.0f;    // Sense 1
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
    // Sized for the slowest and the deepest Human can make it.
    most_cents_ =
        cents_per_hz_ * rate * (1.0f - kHumanRate * human) / (1.0f + kHumanDepth * human);
    leak_ = rate_now_ / (kLeakCycles * sr);
  }

  void advance_cycle() {
    phase_ += increment_;
    if (phase_ >= 1.0) phase_ -= 1.0;
  }

  void run_cycle() {
    update_cycle();
    advance_cycle();
  }

  // The note detector: sets age_, in samples since the last attack.
  void follow(float left, float right) {
    const float mono = 0.5f * (left + right);
    const float low = split_low_.lowpass(mono);
    const float body = split_high_.lowpass(mono);
    const float level[kDetectors] = {kit::max(std::fabs(left), std::fabs(right)), std::fabs(low),
                                     std::fabs(body - low), std::fabs(mono - body)};
    for (int d = 0; d < kDetectors; ++d) {
      const float coeff = level[d] > fast_[d] ? fast_attack_ : fast_release_;
      fast_[d] = flush_denormal(level[d] + (fast_[d] - level[d]) * coeff);
    }
    const float whole = fast_[0];
    bool attack = false;
    for (int d = 0; d < kDetectors; ++d) {
      if (fast_[d] > rise_ * lag_[d] && fast_[d] > kFloor && fast_[d] >= kBandShare * whole) {
        attack = true;
      }
      const float coeff = fast_[d] > lag_[d] ? lag_attack_ : lag_release_;
      lag_[d] = flush_denormal(fast_[d] + (lag_[d] - fast_[d]) * coeff);
    }
    const bool over = whole < kFloor || whole < kEndRatio * lag_[0];
    if (over) {
      for (int d = 0; d < kDetectors; ++d) lag_[d] = fast_[d];
    }
    if (attack || over) {
      age_ = 0;
    } else if (age_ < kAgeMost) {
      ++age_;
    }
  }

  // Everything a note leaves behind, cleared: the state the device rests in.
  void clear_note() {
    for (int c = 0; c < 2; ++c) {
      offset_[c] = 0.0;
      shelf_[c].reset();
    }
    split_low_.reset();
    split_high_.reset();
    for (int d = 0; d < kDetectors; ++d) {
      fast_[d] = 0.0f;
      lag_[d] = 0.0f;
    }
    age_ = 0;
    u_ = 0.0f;
    sway_ = 0.0f;
    cents_now_ = 0.0f;
    splice_left_ = 0;
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
        depth_.set_target(value);
        break;
      case kSwell:
        swell_.set_target(value);
        break;
      case kSense:
        rise_ = kit::db_to_gain(kRiseMostDb * std::pow(kRiseLeastDb / kRiseMostDb, value));
        break;
      case kWidth:
        apart_.set_target(0.5f * value);
        break;
      case kMix:
        mix_.set_target(value);
        break;
      default:
        break;  // Rate, Quicken and Human are read on the control clock
    }
    // At rest nothing sounds, so a knob is there at once.
    if (resting_) arrive();
  }

  kit::DelayLine<kLineSize> line_[2];
  kit::OnePole shelf_[2];
  kit::OnePole split_low_, split_high_;
  kit::Smoother depth_, swell_, mix_, apart_;
  kit::Drift rate_wander_, depth_wander_;
  kit::ControlClock clock_;

  // The cycle: free-running, in double so a slow rate still moves.
  double phase_ = 0.0;
  double increment_ = 0.0;
  float rate_now_ = 5.0f;
  float depth_factor_ = 1.0f;
  float most_cents_ = 100.0f;
  float leak_ = 0.0f;

  // The detector.
  float fast_[kDetectors] = {};
  float lag_[kDetectors] = {};
  float fast_attack_ = 0.0f, fast_release_ = 0.0f, lag_attack_ = 0.0f, lag_release_ = 0.0f;
  float rise_ = 1.5f;

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
  double offset_[2] = {0.0, 0.0};
  float room_ = 0.0f;
  float cents_per_hz_ = 0.0f;
  int splice_left_ = 0;
  int splice_length_ = 1;

  // Rest.
  bool resting_ = true;
  long quiet_ = 0;
  long rest_after_ = kLineSize;
};

}  // namespace livemix
