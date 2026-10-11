#pragma once

// Spread: width by frequency. The sound is taken apart into its middle
// (M = (L + R) / 2) and its sides (S = (L - R) / 2); the sides are given a
// gain that depends on frequency, in three regions: Low below the low split,
// Mid between the splits, High above the high split. Make adds sides where
// there are none.
//
//   L,R ─► M ─► turn (the curve at all ones) ─────────────────────┬──────► L = (M' + S') · output
//          │                                                      │        R = (M' - S') · output
//          └─► scatter (4 allpasses) ─► curve of what is over 1 ─► × Make ─┐
//   L,R ─► S ─► curve ───────────────────────────────────────────────────(+)─► Safe ─► S'
//
// Storage: four delay lines of 2048 samples for the scatter (6 ms at
// 96 kHz is 580), 32 KB; everything else is a few filters. No latency.
//
// - The curve is two stages in series, each a three region split whose three
//   parts are in phase with each other at every frequency. One stage, with A
//   a state variable filter at the low split and B one at the high split,
//   both critically damped (k = 2, so low = 1/(1+s)² and high = s²/(1+s)²,
//   and low - high is the first order allpass (1-s)/(1+s)):
//
//     below    = apB(lowA(x))            the bottom, turned as B turns the rest
//     between  = lowB(-highA(x))
//     above    = -highB(-highA(x))
//     out      = l·below + m·between + h·above
//
//   Each part is a real, positive share of apA·apB: with P = 1 / (1 + w²)
//   for w the frequency over the corner (through the tangent), the shares are
//   PA, (1 - PA)·PB and (1 - PA)·(1 - PB), which add to 1. So a stage is the
//   two allpasses times the plain gain l·PA + (1 - PA)·(m·PB + h·(1 - PB)):
//   the sides are never turned against themselves, only scaled.
// - The middle goes through the same two stages with every gain at 1, which
//   is the allpasses alone. So middle and sides stay in step at every
//   frequency: a sound on one side keeps its place and each speaker alone is
//   what the curve says, (1 ± gain) / 2 of it. Before this the sides alone were
//   filtered and turned against the middle near a split, and a sound panned
//   left came out louder on the right there.
// - The mono sum L + R is 2·M'·output: the middle, turned in phase near the
//   splits and otherwise untouched. Its level at every frequency is the
//   input's, and no width, Make, Smear or Safe can change it or make
//   anything cancel in it. With Low, Mid and High at 1 the device is those
//   allpasses on each side: the input in level, not sample for sample.
// - Both stages stand on the splits, and the two together make each region's
//   width: stage two gives a region 1 + Slope·(sqrt(width) - 1) and stage one
//   the rest, width over that. At Slope 1 each gives the square root: a
//   region at 0 falls away at 24 dB an octave and is 12 dB down at the split.
//   At Slope 0 stage one does it all and stage two is flat: 12 dB an octave,
//   6 dB down at the split. Moving the stages apart instead (the first design)
//   changed a region at 0 by 4 dB at most and any other by under 1 dB: a knob
//   that did nothing. Slope shows where a region is narrowed towards the
//   middle; a step between two widths that are both well over 0 takes about
//   three octaves whatever Slope is, because the parts of a split are in phase.
// - Make: a width over 1 asks for more sides than came in, and a mono sound
//   has none to raise. So the middle goes through four allpasses in series
//   (the scatter) and then through a second curve of the same shape whose
//   regions are what each width has over 1 (nothing for a region at 1 or
//   under, 1 for a region at 2); that, times Make, is added to the sides. At
//   Make 1 a region at 2 gets made sides as loud as the middle; a region at 1
//   or under gets none, so it stays as it came.
// - Smear scales the scatter's times (0.25 to 0.85 of 1.3, 2.9, 4.7 and
//   7.1 ms, so its energy centres 4 to 13.6 ms after the sound). The allpass
//   gains are ±0.7: over 0.618 an allpass gives its largest part at once and
//   less each time round, so the made sides are a tail that starts with the
//   note and falls, never a second strike after it. A settled time is a whole
//   number of samples, so the scatter is exactly allpass; a moving one glides.
// - Safe: four ears on power (30 ms): on the middle as it goes out and as
//   the scatter spreads it (the fuller of the two counts, because Make's
//   sides are made from the scattered middle, which starts after the note
//   and rings on after it), on the sides as they came in (turned as the
//   curve turns them, so that like is held against like) and on the sides
//   going out. The sides going out are held to the larger of the middle times
//   a ceiling (6 dB over the middle just above Safe 0, falling 18 dB to 12 dB
//   under it at Safe 1) and the sides as they came in: it holds what was
//   added, settles no narrower than the source, and does nothing at all
//   while no region is over 1. The ears are short so that they hear what
//   sounds now: a passage 30 dB louder is out of them in 0.2 s. The gain
//   takes hold in 50 ms and lets go in 1.5 s, so it does not move with each
//   note: it settles where the widest moment of the last seconds put it and
//   comes back at 5.8 dB a second at most. In a silence the ears fall
//   together and it stays where it was. (The ears once took 1.5 s both ways.
//   Being means of power, they remembered a loud passage for a third of a
//   second for each dB the next one was quieter, and a wide hiss after a
//   narrow phrase came out unheld for eight seconds and then stepped down.)
//   For a tenth of a second after a knob is moved the ears and the gain take
//   10 ms both ways, so the knobs answer at once; and for the first 10 ms
//   after waking the gain is the mean of what was asked so far, so a note
//   after a long silence is held from its first sample. Safe 0 holds nothing.
// - Widths and Slope are smoothed over 5 ms at the control rate (every 16
//   samples) and the gains ramped per sample between ticks. The splits move
//   in octaves over 15 ms and the filters are retuned at the ticks: the
//   middle passes those filters too, and a split thrown across a held note
//   in 5 ms turned its phase fast enough to be heard as a chirp.
//
// Sleep is counted by the sample, not by the block: after 0.3 s with no
// input and nothing going out the filters, the scatter and the ears are
// cleared and every smoothed value is put on its target, and the first input
// sample that is not zero wakes it. So waking is the same as starting, and
// the output is the same whatever the block size, also when sound comes back
// just as the device falls asleep.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Spread : public kit::DeviceBase<spread::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace spread;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    const float control_rate = sr / kPeriod;
    for (kit::Smoother& width : width_) width.set_time(kSmoothingSeconds, control_rate);
    low_octave_.set_time(kSplitSeconds, control_rate);
    high_octave_.set_time(kSplitSeconds, control_rate);
    slope_.set_time(kSmoothingSeconds, control_rate);
    make_.set_time(kSmoothingSeconds, sr);
    output_.set_time(kSmoothingSeconds, sr);
    for (ScatterAllpass& allpass : scatter_) allpass.delay.set_time(kSmearGlideSeconds, sr);
    ear_coeff_ = 1.0f - kit::time_to_coeff(kEarSeconds, sr);
    ear_quick_ = 1.0f - kit::time_to_coeff(kEarQuickSeconds, sr);
    hold_coeff_ = 1.0f - kit::time_to_coeff(kHoldSeconds, sr);
    take_coeff_ = 1.0f - kit::time_to_coeff(kTakeSeconds, sr);
    let_go_coeff_ = 1.0f - kit::time_to_coeff(kLetGoSeconds, sr);
    fresh_samples_ = static_cast<uint32_t>(kHoldSeconds * sr);
    quick_samples_ = static_cast<long>(kQuickSeconds * sr);
    quick_ = 0;
    idle_samples_ = static_cast<long>(kIdleSeconds * sr);
    asleep_ = true;
    quiet_ = 0;
    for (int id = 0; id < kNumParams; ++id) apply(id);
    rest();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // meters[0], for the display: how far Safe is holding the sides down right
  // now, in dB (0 or below; 0 at rest and asleep).
  float meter(int index) const {
    if (index != 0 || asleep_) return 0.0f;
    return kit::gain_to_db(hold_);
  }

  void process(int frames) {
    frames = begin_block(frames);
    for (int i = 0; i < frames; ++i) {
      float left, right;
      take_input(i, &left, &right);
      // Asleep: a sample of silence in is a sample of silence out, and the
      // first one that is not wakes the device on that very sample.
      const bool excited = left != 0.0f || right != 0.0f;
      if (asleep_) {
        if (!excited) {
          out_left_[i] = 0.0f;
          out_right_[i] = 0.0f;
          continue;
        }
        asleep_ = false;
        quiet_ = 0;
      }
      // A NaN or runaway sample would otherwise stay in every filter it met.
      if (!(left > -kSaneInput && left < kSaneInput)) left = 0.0f;
      if (!(right > -kSaneInput && right < kSaneInput)) right = 0.0f;

      if ((position_ & (kPeriod - 1)) == 0) tick();
      ++position_;
      if (ramping_) {
        for (int s = 0; s < 2; ++s) {
          for (int j = 0; j < kGains; ++j) {
            gain_[s][j] += gain_step_[s][j];
            made_gain_[s][j] += made_gain_step_[s][j];
          }
        }
      }

      const float mid = 0.5f * (left + right);
      const float side = 0.5f * (left - right);

      // The middle, turned as the curve turns the sides and not scaled.
      const float turned = turn_stage_[1].process(turn_stage_[0].process(mid, kOnes), kOnes);
      // The scatter and its curve always run, so that Make coming up finds them full.
      float scattered = mid;
      for (int a = 0; a < kScatter; ++a) scattered = scatter_[a].process(scattered, kScatterGain[a]);
      const float made =
          made_stage_[1].process(made_stage_[0].process(scattered, made_gain_[0]), made_gain_[1]);
      const float first = stage_[0].process(side, gain_[0]);
      const float shaped = stage_[1].process(first, gain_[1]) + make_.next() * made;
      // The sides as they came in, turned as the curve turns them and not scaled.
      const float came = in_stage_.process(stage_[0].plain, kOnes);

      // Safe: the sides going out against the middle and the sides coming in.
      // The middle is heard twice, as it goes out and as the scatter spreads it
      // (what Make is made from), and the fuller of the two counts: at the
      // start of a note the scatter has not yet filled, at its end the scatter
      // rings on, and either way the made sides are held against the middle
      // they were made from.
      const bool quick = quick_ > 0;
      if (quick) --quick_;
      const float ear = quick ? ear_quick_ : ear_coeff_;
      ear_mid_ = flush_denormal(ear_mid_ + ear * (turned * turned - ear_mid_));
      ear_scatter_ = flush_denormal(ear_scatter_ + ear * (scattered * scattered - ear_scatter_));
      ear_in_ = flush_denormal(ear_in_ + ear * (came * came - ear_in_));
      ear_out_ = flush_denormal(ear_out_ + ear * (shaped * shaped - ear_out_));
      float want = 1.0f;
      if (safe_on_ && raised_) {
        const float allowed = kit::max(ceiling_power_ * kit::max(ear_mid_, ear_scatter_), ear_in_);
        if (ear_out_ > allowed && ear_out_ > kEarFloor) {
          want = kit::max(std::sqrt(allowed / ear_out_), kHoldLeast);
        }
      }
      // The gain takes hold quickly and lets go slowly. Just awake the ears
      // have heard little, and the gain is the plain mean of what they have
      // asked so far: the first note after a silence is held from its first
      // sample, not let through wide and then pulled in. Just after a knob
      // moved it follows both ways at once. Letting go, the step is scaled by
      // where the gain stands against where it is going, which makes it a
      // plain one-pole on one over the gain: however deep the hold, it comes
      // back no faster than 8.7 dB / kLetGoSeconds a second.
      float rate;
      if (position_ <= fresh_samples_) {
        const float fresh = 1.0f / static_cast<float>(position_);
        rate = fresh > hold_coeff_ ? fresh : hold_coeff_;
      } else if (quick) {
        rate = hold_coeff_;
      } else if (want < hold_) {
        rate = take_coeff_;
      } else {
        rate = let_go_coeff_ * hold_ / want;
      }
      hold_ += rate * (want - hold_);
      if (want == 1.0f && hold_ > 1.0f - kHoldLanded) hold_ = 1.0f;

      const float output = output_.next();
      const float sides = shaped * hold_;
      const float out_l = (turned + sides) * output;
      const float out_r = (turned - sides) * output;
      out_left_[i] = out_l;
      out_right_[i] = out_r;

      // Sleep by the sample: nothing in and nothing out for kIdleSeconds.
      const float peak = kit::max(out_l < 0.0f ? -out_l : out_l, out_r < 0.0f ? -out_r : out_r);
      if (excited || peak > kit::IdleGate::kFloor) {
        quiet_ = 0;
      } else if (++quiet_ >= idle_samples_) {
        rest();
        asleep_ = true;
      }
    }
  }

 private:
  // The three gains of a stage, in the order Stage::process reads them.
  enum Gain : int { kLowGain = 0, kMidGain, kHighGain, kGains };

  static constexpr int kPeriod = 16;  // samples between control ticks
  static_assert((kPeriod & (kPeriod - 1)) == 0, "the control period must be a power of two");
  static constexpr int kScatter = 4;
  static constexpr int kScatterSize = 2048;  // 6 ms at 96 kHz is 580 samples; room to spare
  static constexpr float kScatterSeconds[kScatter] = {0.0013f, 0.0029f, 0.0047f, 0.0071f};
  static constexpr float kScatterGain[kScatter] = {-0.7f, 0.7f, -0.7f, 0.7f};
  static constexpr float kSmearLeast = 0.25f;  // of the times above, at Smear 0
  static constexpr float kSmearMost = 0.85f;   // and at Smear 1
  static constexpr float kSmearGlideSeconds = 0.05f;
  static constexpr float kTopOfRange = 0.45f;    // of the sample rate: no stage is tuned above it
  static constexpr float kSplitQ = 0.5f;         // critically damped: the parts of a split are in phase
  static constexpr float kSafeLooseDb = 6.0f;    // the ceiling just above Safe 0: sides over the middle
  static constexpr float kSafeTightDb = -12.0f;  // and at Safe 1
  static constexpr float kSplitSeconds = 0.015f;  // the splits, in octaves
  static constexpr float kEarSeconds = 0.03f;    // Safe's ears: a cycle of the lowest notes
  static constexpr float kTakeSeconds = 0.05f;   // Safe's gain coming down
  static constexpr float kLetGoSeconds = 1.5f;   // and going back up
  static constexpr float kEarQuickSeconds = 0.01f;  // the ears just after a knob moved
  static constexpr float kQuickSeconds = 0.1f;      // and for how long
  static constexpr float kHoldSeconds = 0.01f;  // the gain just awake and just after a knob moved
  static constexpr float kHoldLanded = 1.0e-5f;
  static constexpr float kHoldLeast = 1.0e-3f;  // Safe's gain never goes under this, so it is never 0
  static constexpr float kEarFloor = 1.0e-18f;  // under it there is nothing to compare
  static constexpr float kSaneInput = 64.0f;    // +36 dBFS; beyond it is a fault upstream
  static constexpr float kIdleSeconds = 0.3f;
  static constexpr float kOnes[kGains] = {1.0f, 1.0f, 1.0f};

  // One Schroeder allpass of the scatter. Its time glides when Smear moves and
  // lands on a whole number of samples, where the read is exact.
  struct ScatterAllpass {
    kit::DelayLine<kScatterSize> line;
    kit::Smoother delay;  // in samples

    float process(float x, float gain) {
      const float length = delay.next();
      const float delayed = delay.settled() ? line.read(static_cast<int>(length))
                                            : line.read_hermite(length);
      const float v = flush_denormal(x + gain * delayed);
      line.write(v);
      return delayed - gain * v;
    }
  };

  // One stage of the curve: see the notes at the top.
  struct Stage {
    kit::Svf a;       // at the low split
    kit::Svf b_low;   // at the high split: turns the bottom as it turns the rest
    kit::Svf b_high;  // at the high split, fed what is above the low split

    void reset() {
      a.reset();
      b_low.reset();
      b_high.reset();
      plain = 0.0f;
    }

    void tune(float low_hz, float high_hz, float sample_rate) {
      a.set(low_hz, kSplitQ, sample_rate);
      b_low.set(high_hz, kSplitQ, sample_rate);
      b_high.set(high_hz, kSplitQ, sample_rate);
    }

    // The same tuning as `other`, without working the tangents out again.
    void tune_as(const Stage& other) {
      copy(a, other.a);
      copy(b_low, other.b_low);
      copy(b_high, other.b_high);
    }

    float process(float x, const float* gain) {
      a.process(x);
      b_low.process(a.low);
      b_high.process(-a.high);
      const float below = b_low.low - b_low.high;
      plain = below + b_high.low - b_high.high;
      return gain[kLowGain] * below + gain[kMidGain] * b_high.low - gain[kHighGain] * b_high.high;
    }

    float plain = 0.0f;  // the last sample with every gain at 1: the input, turned only

   private:
    static void copy(kit::Svf& to, const kit::Svf& from) {
      to.g = from.g;
      to.k = from.k;
      to.a1 = from.a1;
      to.a2 = from.a2;
      to.a3 = from.a3;
    }
  };

  // True when a new value should glide: once a block has run and while the
  // device is awake. Asleep there is nothing sounding to glide.
  bool gliding() const { return primed() && !asleep_; }

  void apply(int id) {
    using namespace spread;
    const float value = param(id);
    const bool glide = gliding();
    switch (id) {
      case kLow:
      case kMid:
      case kHigh:
        width_[id - kLow].set(value, glide);
        break;
      case kLowHz:
        low_octave_.set(std::log2(value), glide);
        break;
      case kHighHz:
        high_octave_.set(std::log2(value), glide);
        break;
      case kSlope:
        slope_.set(value, glide);
        break;
      case kMake:
        make_.set(value, glide);
        break;
      case kSmear: {
        const float scale = kit::lerp(kSmearLeast, kSmearMost, value);
        for (int a = 0; a < kScatter; ++a) {
          const float samples = std::floor(kScatterSeconds[a] * scale * sample_rate() + 0.5f);
          scatter_[a].delay.set(samples, glide);
        }
        break;
      }
      case kSafe:
        safe_on_ = value > 0.0f;
        // The ceiling as a power ratio, straight in dB from loose to tight.
        ceiling_power_ =
            safe_on_ ? std::pow(10.0f, 0.1f * kit::lerp(kSafeLooseDb, kSafeTightDb, value)) : 0.0f;
        break;
      case kOutput:
        output_.set(kit::db_to_gain(value), glide);
        break;
      default:
        break;
    }
    if (id != kOutput) quick_ = quick_samples_;
    if (!glide) land();
  }

  // One region's width shared between the two stages: stage two gets
  // 1 + slope·(sqrt(width) - 1) and stage one what is left of the width.
  static void share(float width, float slope, float& first, float& second) {
    second = 1.0f + slope * (std::sqrt(width) - 1.0f);
    first = second > 0.0f ? width / second : 0.0f;
  }

  // The gains of both stages for the widths and the slope as they stand.
  void aim(float low, float mid, float high, float slope) {
    const float width[kGains] = {low, mid, high};
    for (int j = 0; j < kGains; ++j) {
      share(width[j], slope, gain_target_[0][j], gain_target_[1][j]);
      // The made sides: the same shape for what each width has over 1.
      share(kit::max(width[j] - 1.0f, 0.0f), slope, made_gain_target_[0][j], made_gain_target_[1][j]);
      width_set_[j] = width[j];
    }
    slope_set_ = slope;
    raised_ = low > 1.0f || mid > 1.0f || high > 1.0f;
  }

  // `low_octave` and `high_octave` are the splits as log2 of their Hz.
  void tune(float low_octave, float high_octave) {
    const float sr = sample_rate();
    const float top = kTopOfRange * sr;
    stage_[0].tune(kit::min(std::exp2(low_octave), top), kit::min(std::exp2(high_octave), top), sr);
    stage_[1].tune_as(stage_[0]);
    for (int s = 0; s < 2; ++s) {
      turn_stage_[s].tune_as(stage_[0]);
      made_stage_[s].tune_as(stage_[0]);
    }
    in_stage_.tune_as(stage_[0]);
    low_octave_set_ = low_octave;
    high_octave_set_ = high_octave;
  }

  // Control rate: land the ramps of the last period, move the smoothed values
  // and aim the gains and the filters at where they stand now.
  void tick() {
    settle();
    const float low = width_[0].next();
    const float mid = width_[1].next();
    const float high = width_[2].next();
    const float slope = slope_.next();
    ramping_ = low != width_set_[0] || mid != width_set_[1] || high != width_set_[2] ||
               slope != slope_set_;
    if (ramping_) {
      aim(low, mid, high, slope);
      for (int s = 0; s < 2; ++s) {
        for (int j = 0; j < kGains; ++j) {
          gain_step_[s][j] = (gain_target_[s][j] - gain_[s][j]) * (1.0f / kPeriod);
          made_gain_step_[s][j] = (made_gain_target_[s][j] - made_gain_[s][j]) * (1.0f / kPeriod);
        }
      }
    }
    const float low_octave = low_octave_.next();
    const float high_octave = high_octave_.next();
    if (low_octave != low_octave_set_ || high_octave != high_octave_set_) {
      tune(low_octave, high_octave);
    }
  }

  // Put the gains on the targets of the ramp they were on.
  void settle() {
    for (int s = 0; s < 2; ++s) {
      for (int j = 0; j < kGains; ++j) {
        gain_[s][j] = gain_target_[s][j];
        gain_step_[s][j] = 0.0f;
        made_gain_[s][j] = made_gain_target_[s][j];
        made_gain_step_[s][j] = 0.0f;
      }
    }
  }

  // Put everything that moves on its target at once.
  void land() {
    for (kit::Smoother& width : width_) width.snap(width.target);
    low_octave_.snap(low_octave_.target);
    high_octave_.snap(high_octave_.target);
    slope_.snap(slope_.target);
    make_.snap(make_.target);
    output_.snap(output_.target);
    for (ScatterAllpass& allpass : scatter_) allpass.delay.snap(allpass.delay.target);
    aim(width_[0].value, width_[1].value, width_[2].value, slope_.value);
    settle();
    ramping_ = false;
    tune(low_octave_.value, high_octave_.value);
  }

  // Nothing is sounding: clear what holds sound and start the clock again.
  void rest() {
    for (Stage& stage : stage_) stage.reset();
    for (Stage& stage : turn_stage_) stage.reset();
    for (Stage& stage : made_stage_) stage.reset();
    in_stage_.reset();
    for (ScatterAllpass& allpass : scatter_) allpass.line.clear();
    ear_mid_ = 0.0f;
    ear_scatter_ = 0.0f;
    ear_in_ = 0.0f;
    ear_out_ = 0.0f;
    hold_ = 1.0f;
    position_ = 0;
    quiet_ = 0;
    quick_ = 0;
    land();
  }

  Stage stage_[2];       // the curve on the sides
  Stage turn_stage_[2];  // the same filters with every gain at 1, on the middle
  Stage made_stage_[2];  // the curve of what is over 1, on the scattered middle
  Stage in_stage_;       // stage two with every gain at 1, on stage one's plain sides: for Safe
  ScatterAllpass scatter_[kScatter];
  kit::Smoother width_[3];  // Low, Mid, High: at the control rate
  kit::Smoother low_octave_, high_octave_;  // the splits as log2 Hz; at the control rate
  kit::Smoother slope_;                     // at the control rate
  kit::Smoother make_, output_;  // per sample

  float gain_[2][kGains] = {};         // what each stage uses now
  float gain_target_[2][kGains] = {};  // where the ramp of this period ends
  float gain_step_[2][kGains] = {};
  float made_gain_[2][kGains] = {};  // the same for the made sides
  float made_gain_target_[2][kGains] = {};
  float made_gain_step_[2][kGains] = {};
  float width_set_[3] = {};      // the widths and the slope the targets were worked out for
  float slope_set_ = 0.0f;
  float low_octave_set_ = 0.0f;  // and what the filters are tuned for
  float high_octave_set_ = 0.0f;
  bool ramping_ = false;
  bool raised_ = false;  // a region is over 1: only then can Safe have anything to hold

  float ear_mid_ = 0.0f;      // power of the middle as it goes out,
  float ear_scatter_ = 0.0f;  // of the middle as the scatter spreads it,
  float ear_in_ = 0.0f;       // of the sides coming in and of the sides going out
  float ear_out_ = 0.0f;
  float ear_coeff_ = 0.0f;
  float hold_ = 1.0f;  // Safe's gain on the sides
  float ear_quick_ = 0.0f;
  float hold_coeff_ = 0.0f;    // the gain's step just awake and just after a knob moved,
  float take_coeff_ = 0.0f;    // taking hold,
  float let_go_coeff_ = 0.0f;  // and letting go
  uint32_t fresh_samples_ = 1;  // how long after waking the gain is the mean so far
  long quick_samples_ = 1;  // how long after a knob moves the ears are quick
  long quick_ = 0;
  float ceiling_power_ = 0.0f;
  bool safe_on_ = false;
  uint32_t position_ = 0;  // samples since waking; the control ticks are counted from it
  long idle_samples_ = 1;  // how long nothing must happen before sleep
  long quiet_ = 0;         // samples of nothing so far
  bool asleep_ = true;
};

}  // namespace livemix
