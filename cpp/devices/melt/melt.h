#pragma once

// Melt: a tail in which sound ages. The longer a sound has been ringing, the
// further it has slid in pitch, the darker (or thinner) and the more smeared
// it is.
//
//   in ─┬──────────────────────────────────────────────────────── dry ─┐
//       └─► no DC ─► Solid (delay) ─┬───────────┐                      (+)─► out
//                                   ▼           │                      │
//                  ┌─────►(+)─► 4 lines ────────┼─► per line:          │
//                  │                            │   sliding head       │
//                  │                            │   Hold gain          │
//               Hadamard                        │   dark, thin shelves │
//                  │                            │   allpass (Blur)     │
//                  └────────────────────────────┴──────────┬───────────┘
//                                                          └─► level ─► width ─► wet
//
// - Everything a line does to the sound it does in proportion to its own
//   length. A line `a` seconds long (its delay, where its head stands and its
//   allpass together) moves the pitch by Sag x a cents, takes 60 dB x a / Hold
//   off the level and Dim's decibels a second x a off the highs or the lows.
//   So whatever way a sound took through the four lines, after `t` seconds in
//   them it is Sag x t cents from where it was, 60 t / Hold dB down, and that
//   much darker: pitch, level and colour are functions of age alone, and
//   because the lines differ in length the ages run together into a
//   continuous droop instead of steps.
// - The pitch moves without a splice for as long as it can. A line's read
//   head slides away from the write point (to sink) or towards it (to rise)
//   at 1 - ratio samples a sample, which is a pure change of pitch. Only when
//   it has used up its travel (0.4 of the line) does a second head start near
//   the other end and take over in a 30 ms fade. At 30 cents a second that is
//   once in 23 seconds per line. The usual two heads under one moving window
//   are always half way through a fade, and in a loop that costs a decibel or
//   two on every pass, which no Hold setting would survive.
// - The handover is laid where it shows least. The new head starts at the
//   place, within the nearest quarter of the travel (8 ms at most), where
//   what it is about to read is most like what the old head is about to read,
//   so a steady note goes over in phase; the fade is weighted by how alike
//   the two are (level across it stays what it was, for a note and for noise
//   alike); and each head brings its own level and colour, by where it stands,
//   into the fade, so that the line's age does not jump with the head.
// - Drip makes the slide run fast and slow: one free-running drift shared by
//   the four lines (never reset by the sound) and a smaller one of each
//   line's own scale the rate between none and twice what Sag says. The
//   lines mix on every pass, so it is mostly the fall as a whole that
//   wanders, in fits and stalls; the lines' own drifts spread it a little.
// - Dim is a shelf per line: highs above 1 kHz when the tail sinks, lows
//   below 400 Hz when it rises, cross-faded over +-10 cents a second round
//   Sag 0 so that turning Sag through zero does not switch the tone.
// - The sliding heads read with Hermite interpolation, which takes a little
//   off the very top on each pass (about 0.25 dB at 10 kHz): with Dim at 0 a
//   long tail still loses its top octave slowly, sooner at a small Size.
// - The allpass of a line holds a note longer at some pitches than at others
//   (its mean is its length, which is what the line counts as age), so a
//   single pure note can run some cents ahead of or behind Sag x age for a
//   while, most at a small Size and a high Blur. The rate over seconds is Sag.
// - Level. With steady sound going in, the lines hold g^2 / (1 - g^2) of its
//   power for a loop gain g, which Hold and Size both set. The tail is turned
//   down or up by exactly that, each side by its own two lines, so a held
//   chord comes out of the tail as loud as it went in at every Hold and Size,
//   and Hold and Size are not volume knobs. Width keeps the level too. The
//   same reckoning is kept running in time for a steady sound of unit power,
//   pass by pass as the lines themselves fill and empty, so that when Hold or
//   Size is moved the level follows what the lines hold at that moment (Hold
//   turned from 20 s to 0.4 s would otherwise turn up, at once, sound that
//   had piled up for 20 s). What comes out of the tail passes the same soft
//   clip as what goes into a line: nothing it does can be louder than +-3.
// - The level hold. That reckoning is for sound that has no pitch in common
//   with the lines. A network of four lines has pitches of its own, and with
//   Sag at 0 (nothing moves) a held note that falls on one piles up: 10 dB
//   over the same note a semitone away, at a long Hold and a small Size. So
//   the same reckoning is run in time (the power each line would hold now of
//   what went in, a line ago, had it not piled up), and when the tail comes
//   out more than 1 dB over it, the tail is turned down by the rest. It only
//   turns down, it is slow (0.1 s), and on sound that moves (Sag off 0, or
//   anything but a held note) it has little to do. It cannot bring up the
//   notes that fall between the lines' pitches: a single held pure note
//   there stays under, by 3 to 7 dB at a Hold of a few seconds and by 12 at
//   the longest.
// - The loop cannot run away: the mixing matrix is orthogonal, the shelves
//   only cut and Hold is below 1. What is written to a line passes a soft
//   clip that is linear to +-1.5, for what a full-scale drone piles up at the
//   longest Hold. A steady offset is taken off what goes into the lines (a
//   first-order high-pass at 8 Hz): the network would hold it 20 to 40 times
//   over at a long Hold.
// - The wet tail is another stretch of time and another pitch than the dry
//   sound, so Mix is equal power. At Mix 0 the output is the input.
// - Solid is a delay in front of the lines. A move of it is a cross-fade to
//   the new delay over 40 ms, not a glide: a glide over a second of delay is
//   a burst of sped-up sound.
// - Storage: four lines of 65536 samples (0.33 s at 96 kHz at the largest
//   Size, plus travel), two delays of 131072 for Solid (1 s at 96 kHz) and
//   four allpasses of 2048: 2.1 MB. The level's reckoning keeps 2048 control
//   ticks of four powers: 32 KB more.
// - Sleep is decided frame by frame, so that the moment the device stops and
//   the moment it starts again do not depend on the host's block size. A
//   knob moved while it sleeps is where it was put when sound returns.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Melt : public kit::DeviceBase<melt::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace melt;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int c = 0; c < 2; ++c) {
      pre_[c].clear();
      steady_[c].reset();
      steady_[c].set_cutoff(kSteadyHz, sr);
    }
    for (int n = 0; n < kLines; ++n) {
      line_[n].clear();
      allpass_[n].clear();
      dark_[n].reset();
      thin_[n].reset();
      dark_[n].set_cutoff(kDarkHz, sr);
      thin_[n].set_cutoff(kThinHz, sr);
      base_[n] = kLineSeconds[n] * sr;
      allpass_length_[n] =
          kit::clamp_int(static_cast<int>(kAllpassSeconds[n] * sr + 0.5f), 1, kAllpassSize - 1);
      rate_[n] = 0.0f;
    }
    dry_.set_time(kSmoothingSeconds, sr);
    wet_.set_time(kSmoothingSeconds, sr);
    mid_.set_time(kSmoothingSeconds, sr);
    side_.set_time(kSmoothingSeconds, sr);
    blur_.set_time(kSmoothingSeconds, sr);
    // Size moves read points: slow enough to bend, not to zip.
    scale_.set_time(kSizeGlideSeconds, sr);
    // Stepped on the control clock.
    const float control_rate = sr / kControlPeriod;
    sag_.set_time(kControlGlideSeconds, control_rate);
    hold_.set_time(kControlGlideSeconds, control_rate);
    dim_.set_time(kControlGlideSeconds, control_rate);
    drip_.set_time(kControlGlideSeconds, control_rate);
    weigh_ = 1.0f - std::exp(-1.0f / (kWeighSeconds * control_rate));
    hold_coeff_ = 1.0f - std::exp(-1.0f / (kHoldSeconds * control_rate));
    fade_step_ = 1.0f / (kFadeSeconds * sr);
    solid_step_ = 1.0f / (kSolidFadeSeconds * sr);
    // The longest silence the device can make on its own: Solid, then the
    // longest line with all its travel.
    quiet_frames_ = static_cast<long>(
        (kParamMax[kSolid] * 0.001f + kLineSeconds[kLines - 1] * kMaxScale * (1.0f + kTravelShare) +
         0.1f) *
        sr);
    quiet_ = 0;
    asleep_ = true;
    wander_seen_ = 0.0f;
    for (int id = 0; id < kNumParams; ++id) apply(id);
    restart();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The reading named by "meters" in device.json, for the display: how much
  // faster (above 0) or slower (below it) than Sag says the tail is sliding
  // now, as a share of Sag and the mean of the four lines. Drip moves it
  // between -1 (the slide has stopped) and 1 (twice as fast); with no Drip,
  // and asleep, it rests at 0.
  float meter(int index) const {
    if (index == 0) return asleep_ ? 0.0f : wander_seen_;
    return 0.0f;
  }

  void process(int frames) {
    frames = begin_block(frames);
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      in[0] = tidy(in[0]);
      in[1] = tidy(in[1]);
      const bool excited = in[0] != 0.0f || in[1] != 0.0f;
      // Asleep and awake are decided on the frame, not on the block: what
      // runs freely (the heads, the drifts, the control clock) then stands
      // still for the same frames at every block size.
      if (asleep_) {
        if (!excited) {
          out_left_[i] = 0.0f;
          out_right_[i] = 0.0f;
          continue;
        }
        asleep_ = false;
        restart();
      }
      const bool sounding = render_frame(in, &out_left_[i], &out_right_[i]);
      if (excited || sounding) {
        quiet_ = 0;
      } else if (++quiet_ > quiet_frames_) {
        asleep_ = true;
      }
    }
  }

 private:
  static constexpr int kLines = 4;
  static constexpr int kLineSize = 65536;
  static constexpr int kPreSize = 131072;
  static constexpr int kAllpassSize = 2048;
  static constexpr int kControlPeriod = 32;

  // Line lengths at Size's middle scale (1.0); Size runs them from 0.45 to
  // 4.5 times that: 20..32 ms up to 197..324 ms.
  static constexpr float kLineSeconds[kLines] = {0.0437f, 0.0539f, 0.0613f, 0.0719f};
  static constexpr float kMinScale = 0.45f;
  static constexpr float kMaxScale = 4.5f;
  // A head's travel as a share of its line, and where each line's head
  // starts in it, so the four never hand over together.
  static constexpr float kTravelShare = 0.4f;
  static constexpr float kStartShare[kLines] = {0.15f, 0.65f, 0.4f, 0.9f};
  static constexpr float kFadeSeconds = 0.03f;
  // Where a new head may start: within this share of the travel from its
  // end, and this long at most; and the stretch of sound it is matched over.
  static constexpr float kSpliceShare = 0.25f;
  static constexpr float kSpliceSeconds = 0.008f;
  static constexpr float kMatchSeconds = 0.01f;
  static constexpr int kMatchPoints = 128;
  // The allpass in each line, and its gain at Blur 1.
  static constexpr float kAllpassSeconds[kLines] = {0.0071f, 0.0097f, 0.0119f, 0.0137f};
  static constexpr float kBlurGain = 0.7f;
  // Dim at 1 takes this many dB a second off its side of the spectrum, and
  // grows as the square of the knob.
  static constexpr float kDimDbPerSecond = 36.0f;
  static constexpr float kDarkHz = 1000.0f;
  static constexpr float kThinHz = 400.0f;
  // Sag from -kTurn to +kTurn cents a second cross-fades Dim from the highs
  // to the lows.
  static constexpr float kTurnCents = 10.0f;
  // Drip: the drift all four lines share and each line's own, in Hz, and
  // how much of the rate each moves at Drip 1 (a drift seldom leaves +-0.7).
  static constexpr float kTideHz = 0.31f;
  static constexpr float kDripHz[kLines] = {0.113f, 0.171f, 0.139f, 0.197f};
  static constexpr float kTideShare = 1.4f;
  static constexpr float kOwnShare = 0.5f;
  static constexpr float kSolidFadeSeconds = 0.04f;
  static constexpr float kSizeGlideSeconds = 0.4f;
  static constexpr float kControlGlideSeconds = 0.02f;
  // What the two inputs put into each line and with which sign, and which
  // way each line goes into its side of the tail. With these signs the same
  // sound on both inputs stays spread over all four lines (it is a fixed
  // point of the mixing matrix); with all four alike it would gather in the
  // first line, which is on the left.
  static constexpr float kFeedGain = 0.5f;
  static constexpr float kFeedSign[kLines] = {1.0f, 1.0f, 1.0f, -1.0f};
  // The level hold: the tail's power is weighed against what it would be
  // of sound that did not pile up (the same power, no pitch in common with
  // the lines), over this long; past this many times that (1 dB) the tail
  // is turned down by the rest, this fast. The reckoning keeps this many
  // control ticks of the past (1.4 s at 48 kHz, 0.7 s at 96 kHz: the
  // longest line with all its travel is 0.47 s).
  static constexpr int kPast = 2048;
  static constexpr float kWeighSeconds = 0.06f;
  static constexpr float kHoldOver = 1.26f;
  static constexpr float kHoldSeconds = 0.1f;
  // The most the tail is turned up (60 dB): only reached where Hold is a
  // fraction of the lines' own length and what comes out is that much down.
  static constexpr float kLevelMost = 1000.0f;
  // How alike the two sides of the tail are taken to be when Width folds
  // them together (measured: 0.1 to 0.3).
  static constexpr float kSidesAlike = 0.2f;
  // A steady offset is kept out of the lines by a high-pass at this frequency.
  static constexpr float kSteadyHz = 8.0f;
  // No input sample is taken to be larger than this (12 dB over full scale),
  // and one smaller than this is silence.
  static constexpr float kInputBound = 4.0f;
  static constexpr float kInputFloor = 1.0e-15f;

  // What comes in is kept as it is unless it is not a number (then it is
  // silence), absurdly large (then it is held to the bound: one such sample
  // would otherwise go round the loop for good) or too small to be a sound
  // (then it is silence too: numbers that small cost many times the work,
  // and would keep the device from ever sleeping).
  static float tidy(float x) {
    if (!(x == x)) return 0.0f;
    if (x > -kInputFloor && x < kInputFloor) return 0.0f;
    return x > kInputBound ? kInputBound : (x < -kInputBound ? -kInputBound : x);
  }

  // A smoother that has arrived costs one compare.
  static float glide(kit::Smoother& s) { return s.value == s.target ? s.value : s.next(); }

  // Linear to +-1.5, landing on +-3.
  static float bound(float x) { return 3.0f * kit::soft_clip(x * (1.0f / 3.0f)); }

  static void hadamard4(float* v) {
    const float a0 = v[0] + v[1], a1 = v[0] - v[1], a2 = v[2] + v[3], a3 = v[2] - v[3];
    v[0] = 0.5f * (a0 + a2);
    v[1] = 0.5f * (a1 + a3);
    v[2] = 0.5f * (a0 - a2);
    v[3] = 0.5f * (a1 - a3);
  }

  // A value set on the control clock and walked to in a straight line over
  // the samples up to the next tick, so that nothing the clock sets is heard
  // as steps.
  struct Walk {
    float value = 0.0f;
    float step = 0.0f;
    void snap(float target) {
      value = target;
      step = 0.0f;
    }
    void aim(float target) { step = (target - value) * (1.0f / kControlPeriod); }
    float next() {
      value += step;
      return value;
    }
  };

  // What a head standing `position` samples past the line's length costs
  // the sound that passes it: the line's age there, and Hold's and Dim's
  // share for that age.
  float age_at(int n, float position) const {
    return (base_[n] * scale_.value + position + static_cast<float>(allpass_length_[n])) /
           sample_rate();
  }
  struct Cost {
    float gain, dark, thin;
  };
  Cost cost_of(float age) const {
    // 10^(-3 age / hold), and 1 - 10^(-0.05 dB): as powers of two.
    return {std::exp2(-9.9657843f * age / hold_now_),
            1.0f - std::exp2(-0.16609640f * dark_now_ * age),
            1.0f - std::exp2(-0.16609640f * thin_now_ * age)};
  }

  // How far the new head's fade has got, as a weight: a raised cosine.
  static float fade_weight(float fade) {
    return 0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * fade);
  }

  // Everything that runs on its own back where it starts, and every knob
  // where it was put: init, and the first sound after a sleep. Nothing is
  // sounding then (what is left in the lines is under the idle floor).
  void restart() {
    using namespace melt;
    clock_.reset(kControlPeriod);
    dry_.snap(dry_.target);
    wet_.snap(wet_.target);
    mid_.snap(mid_.target);
    side_.snap(side_.target);
    blur_.snap(blur_.target);
    scale_.snap(scale_.target);
    sag_.snap(param(kSag));
    hold_.snap(param(kHold));
    dim_.snap(param(kDim));
    drip_.snap(param(kDrip));
    solid_now_ = solid_target_;
    solid_next_ = solid_target_;
    solid_fade_ = 1.0f;
    started_ = false;
    for (int k = 0; k < kPast; ++k) {
      fed_past_[0][k] = 0.0f;
      fed_past_[1][k] = 0.0f;
      tail_past_[k] = 0.0f;
      unit_past_[k] = 0.0f;
    }
    past_at_ = 0;
    fed_sum_[0] = fed_sum_[1] = heard_sum_ = 0.0f;
    fed_[0] = fed_[1] = heard_ = 0.0f;
    held_ = 1.0f;
    tide_.seed(0x2F6E2B1Du);
    tide_.set_rate(kTideHz, sample_rate() / kControlPeriod);
    steady_[0].reset();
    steady_[1].reset();
    for (int n = 0; n < kLines; ++n) {
      wander_[n].seed(0x6D2B79F5u + 0x9E3779B9u * static_cast<uint32_t>(n + 1));
      wander_[n].set_rate(kDripHz[n], sample_rate() / kControlPeriod);
      lead_[n] = 0;
      fade_[n] = 1.0f;
      alike_[n] = 1.0f;
      model_[n] = 0.0f;
      unit_[n] = 0.0f;
      position_[n][0] = kStartShare[n] * kTravelShare * base_[n] * scale_.value;
      position_[n][1] = 0.0f;
    }
    quiet_ = 0;
  }

  // Every 32 samples: what each line does to the sound for its length now.
  void control() {
    using namespace melt;
    const float sag = sag_.next();
    hold_now_ = hold_.next();
    const float dim = dim_.next();
    const float drip = drip_.next();
    const float colour = kDimDbPerSecond * dim * dim;
    const float down = kit::clamp(0.5f - sag / (2.0f * kTurnCents), 0.0f, 1.0f);
    dark_now_ = colour * down;
    thin_now_ = colour * (1.0f - down);
    float factors = 0.0f;
    float squares[kLines];
    // What went into the lines and what the tail was since the last tick,
    // as power, each smoothed alike; and the power the lines held a tick
    // ago by the reckoning below.
    fed_[0] = flush_denormal(fed_[0] + weigh_ * (fed_sum_[0] * (1.0f / kControlPeriod) - fed_[0]));
    fed_[1] = flush_denormal(fed_[1] + weigh_ * (fed_sum_[1] * (1.0f / kControlPeriod) - fed_[1]));
    heard_ = flush_denormal(heard_ + weigh_ * (heard_sum_ * (1.0f / kControlPeriod) - heard_));
    fed_sum_[0] = fed_sum_[1] = heard_sum_ = 0.0f;
    fed_past_[0][past_at_] = fed_[0];
    fed_past_[1][past_at_] = fed_[1];
    tail_past_[past_at_] = model_[0] + model_[1] + model_[2] + model_[3];
    unit_past_[past_at_] = unit_[0] + unit_[1] + unit_[2] + unit_[3];
    const float tide = kTideShare * tide_.next();
    for (int n = 0; n < kLines; ++n) {
      const int lead = lead_[n];
      const float age = age_at(n, position_[n][lead]);
      const float factor =
          kit::clamp(1.0f + drip * (tide + kOwnShare * wander_[n].next()), 0.0f, 2.0f);
      // The head moves away from the write point by what the pitch gives up.
      rate_[n] = 1.0f - std::exp2(sag * age * factor * (1.0f / 1200.0f));
      const Cost cost = cost_of(age);
      float gain = cost.gain;
      dark_cut_[n][lead] = cost.dark;
      thin_cut_[n][lead] = cost.thin;
      if (fade_[n] < 1.0f) {
        // The head on its way out keeps its own age to the end.
        const int old = 1 - lead;
        const Cost leaving = cost_of(age_at(n, position_[n][old]));
        gain_[n][old].aim(leaving.gain);
        dark_cut_[n][old] = leaving.dark;
        thin_cut_[n][old] = leaving.thin;
        gain = leaving.gain + (gain - leaving.gain) * fade_weight(fade_[n]);
      }
      if (started_) {
        gain_[n][lead].aim(cost.gain);
      } else {
        gain_[n][lead].snap(cost.gain);
      }
      factors += factor;
      // Sound with nothing in common with the lines leaves this line with
      // g^2 of what went into it one line ago: its own input, and a quarter
      // of what all four held (the mixing matrix shares it out evenly).
      const int back = kit::clamp_int(
          static_cast<int>(age * sample_rate() * (1.0f / kControlPeriod) + 0.5f), 1, kPast - 1);
      const int then = (past_at_ - back) & (kPast - 1);
      model_[n] = gain * gain * (fed_past_[n & 1][then] + 0.25f * tail_past_[then]);
      // The same for steady sound of unit power on both inputs (each line is
      // fed a quarter of it): what the level is set by.
      unit_[n] = gain * gain * (kFeedGain * kFeedGain + 0.25f * unit_past_[then]);
      squares[n] = gain * gain;
    }
    past_at_ = (past_at_ + 1) & (kPast - 1);
    if (!started_) {
      // Where steady sound settles at these settings: each line holds
      // g^2 / (4 - G) of it, G the sum of the four g^2.
      const float all = squares[0] + squares[1] + squares[2] + squares[3];
      const float settled = 1.0f / kit::max(4.0f - all, 1.0e-6f);
      for (int k = 0; k < kPast; ++k) unit_past_[k] = all * settled;
      for (int n = 0; n < kLines; ++n) unit_[n] = squares[n] * settled;
    }
    wander_seen_ = factors * (1.0f / kLines) - 1.0f;
    // Each side of the tail is brought back to the power that went in: by
    // what its two lines hold now of steady sound of unit power.
    float reckoned = 0.0f;
    for (int c = 0; c < 2; ++c) {
      const float level =
          kit::min(1.0f / std::sqrt(kit::max(unit_[c] + unit_[c + 2], 1.0e-12f)), kLevelMost);
      reckoned += level * level * (model_[c] + model_[c + 2]);
      if (started_) {
        level_[c].aim(level);
      } else {
        level_[c].snap(level);
      }
    }
    // The level hold: a note that falls on one of the network's own pitches
    // piles up in it (ten times the power, at a long Hold and a small Size).
    // What the tail has beyond the reckoning, and 1 dB, is turned down.
    float hold = 1.0f;
    if (heard_ > 1.0e-10f && heard_ > kHoldOver * reckoned) {
      hold = std::sqrt(kHoldOver * reckoned / heard_);
    }
    held_ += hold_coeff_ * (hold - held_);
    if (started_) {
      hold_walk_.aim(held_);
    } else {
      hold_walk_.snap(held_);
    }
    started_ = true;
  }

  // Where the new head of line `n` starts, as a position, when the old one
  // (at `delay` samples behind the write point, where `length` is the line's
  // own) has used up its travel: the place within reach of the travel's
  // other end where the sound it will read is most like the sound the old
  // head will read. How alike the two are (0 to 1) goes to `alike`.
  float splice(int n, float length, float delay, float travel, bool sinking, float* alike) const {
    const float sr = sample_rate();
    const int reach = static_cast<int>(kit::min(kSpliceShare * travel, kSpliceSeconds * sr));
    const float end = sinking ? 0.0f : travel;
    // Every `stride`th sample of the next 10 ms of each head: 12 kHz is fine
    // enough to lay one wave on another.
    const int stride = kit::clamp_int(static_cast<int>(sr * (1.0f / 12000.0f) + 0.5f), 1, 64);
    const int old_delay = static_cast<int>(delay + 0.5f);
    // What a head will read in k samples lies k samples nearer the write
    // point than what it reads now, so the stretch must fit in its delay.
    const int shortest = static_cast<int>(length) - reach - 1;
    const int room = kit::clamp_int(shortest < old_delay ? shortest : old_delay - 1, 0, 1 << 20);
    int points = static_cast<int>(kMatchSeconds * sr) / stride;
    if (points > kMatchPoints) points = kMatchPoints;
    if (points > room / stride) points = room / stride;
    *alike = 0.0f;
    if (points < 8 || reach < 1) return end;
    float old_sound[kMatchPoints];
    float old_power = 0.0f;
    for (int k = 0; k < points; ++k) {
      old_sound[k] = line_[n].read(old_delay - k * stride);
      old_power += old_sound[k] * old_sound[k];
    }
    if (!(old_power > 1.0e-18f)) return end;
    const int base_delay = static_cast<int>(length + end + 0.5f);
    const int towards = sinking ? 1 : -1;  // into the travel from its end
    auto likeness = [&](int offset) {
      const int at = base_delay + towards * offset;
      float dot = 0.0f, power = 0.0f;
      for (int k = 0; k < points; ++k) {
        const float s = line_[n].read(at - k * stride);
        dot += s * old_sound[k];
        power += s * s;
      }
      return power > 1.0e-18f ? dot / std::sqrt(power * old_power) : 0.0f;
    };
    // Coarse, then every sample round the best.
    int best = 0;
    float best_like = likeness(0);
    for (int offset = stride; offset <= reach; offset += stride) {
      const float like = likeness(offset);
      if (like > best_like) {
        best_like = like;
        best = offset;
      }
    }
    const int centre = best;
    for (int offset = centre - stride + 1; offset < centre + stride; ++offset) {
      if (offset < 0 || offset > reach || offset == centre) continue;
      const float like = likeness(offset);
      if (like > best_like) {
        best_like = like;
        best = offset;
      }
    }
    *alike = kit::clamp(best_like, 0.0f, 1.0f);
    return end + static_cast<float>(towards * best);
  }

  // One frame. True while the tail is above the idle floor.
  bool render_frame(const float* in, float* out_left, float* out_right) {
    if (clock_.tick()) control();
    const float max_line = kit::DelayLine<kLineSize>::max_delay() - 2.0f;

    // Solid: the sound waits this long before it enters the lines. A move
    // is a fade from the one delay to the other.
    if (solid_fade_ >= 1.0f && solid_target_ != solid_now_) {
      solid_next_ = solid_target_;
      solid_fade_ = 0.0f;
    }
    float feed[2];
    if (solid_fade_ < 1.0f) {
      solid_fade_ += solid_step_;
      const float weight = solid_fade_ < 1.0f ? fade_weight(solid_fade_) : 1.0f;
      for (int c = 0; c < 2; ++c) {
        pre_[c].write(steady_[c].process(in[c]));
        const float from = pre_[c].read(1 + solid_now_);
        feed[c] = kFeedGain * (from + (pre_[c].read(1 + solid_next_) - from) * weight);
      }
      if (solid_fade_ >= 1.0f) {
        solid_fade_ = 1.0f;
        solid_now_ = solid_next_;
      }
    } else {
      for (int c = 0; c < 2; ++c) {
        pre_[c].write(steady_[c].process(in[c]));
        feed[c] = kFeedGain * pre_[c].read(1 + solid_now_);
      }
    }

    const float scale = glide(scale_);
    const float blur = glide(blur_);
    float u[kLines];
    for (int n = 0; n < kLines; ++n) {
      const float length = base_[n] * scale;
      const int lead = lead_[n];
      position_[n][lead] += rate_[n];
      float v, dark_cut, thin_cut;
      if (fade_[n] < 1.0f) {
        // The head that used up its travel hands over to the one that
        // started near the other end, each at its own level.
        const int old = 1 - lead;
        position_[n][old] += rate_[n];
        fade_[n] += fade_step_;
        if (fade_[n] > 1.0f) fade_[n] = 1.0f;
        const float in_gain = fade_weight(fade_[n]);
        const float a = gain_[n][lead].next() *
                        line_[n].read_hermite(kit::clamp(length + position_[n][lead], 4.0f, max_line));
        const float b = gain_[n][old].next() *
                        line_[n].read_hermite(kit::clamp(length + position_[n][old], 4.0f, max_line));
        // Two sounds `alike` by r, mixed w and 1 - w, have
        // 1 - 2 w (1 - w) (1 - r) of the power of either: made up.
        const float kept = 1.0f - 2.0f * in_gain * (1.0f - in_gain) * (1.0f - alike_[n]);
        v = (b + (a - b) * in_gain) / std::sqrt(kept);
        dark_cut = dark_cut_[n][old] + (dark_cut_[n][lead] - dark_cut_[n][old]) * in_gain;
        thin_cut = thin_cut_[n][old] + (thin_cut_[n][lead] - thin_cut_[n][old]) * in_gain;
      } else {
        v = gain_[n][lead].next() *
            line_[n].read_hermite(kit::clamp(length + position_[n][lead], 4.0f, max_line));
        dark_cut = dark_cut_[n][lead];
        thin_cut = thin_cut_[n][lead];
        const float travel = kTravelShare * length;
        const float at = position_[n][lead];
        if (at > travel || at < 0.0f) {
          const int next = 1 - lead;
          position_[n][next] = splice(n, length, length + at, travel, at > travel, &alike_[n]);
          const Cost cost = cost_of(age_at(n, position_[n][next]));
          gain_[n][next].snap(cost.gain);
          dark_cut_[n][next] = cost.dark;
          thin_cut_[n][next] = cost.thin;
          lead_[n] = next;
          fade_[n] = 0.0f;
        }
      }
      // What the line's length costs beyond level: colour, and a smear.
      float x = v;
      x -= dark_cut * (x - dark_[n].lowpass(x));
      x -= thin_cut * thin_[n].lowpass(x);
      u[n] = allpass_[n].process(x, allpass_length_[n], kBlurGain * blur);
    }

    fed_sum_[0] += feed[0] * feed[0];
    fed_sum_[1] += feed[1] * feed[1];
    float wet_left = (u[0] + u[2]) * level_[0].next();
    float wet_right = (u[1] - u[3]) * level_[1].next();
    heard_sum_ += wet_left * wet_left + wet_right * wet_right;
    const float held = hold_walk_.next();
    wet_left = bound(wet_left * held);
    wet_right = bound(wet_right * held);
    hadamard4(u);
    for (int n = 0; n < kLines; ++n) {
      line_[n].write(flush_denormal(bound(u[n] + kFeedSign[n] * feed[n & 1])));
    }

    const float mid = 0.5f * (wet_left + wet_right) * glide(mid_);
    const float side = 0.5f * (wet_left - wet_right) * glide(side_);
    const float wet = glide(wet_);
    const float dry = glide(dry_);
    *out_left = in[0] * dry + (mid + side) * wet;
    *out_right = in[1] * dry + (mid - side) * wet;

    const float floor = kit::IdleGate::kFloor * 0.25f;
    return wet_left > floor || wet_left < -floor || wet_right > floor || wet_right < -floor;
  }

  void apply(int id) {
    using namespace melt;
    const float value = param(id);
    // A knob moved while nothing sounds is there when sound returns.
    const bool ramp = primed() && !asleep_;
    switch (id) {
      case kMix: {
        float dry, wet;
        kit::equal_power(value, &dry, &wet);
        if (value >= 1.0f) dry = 0.0f;  // cos(pi/2) in floats is -4e-8, not 0
        dry_.set(dry, ramp);
        wet_.set(wet, ramp);
        break;
      }
      case kWidth: {
        // Folding the two sides together loses the power they do not share:
        // the tail is as loud at every Width.
        const float keep = std::sqrt(
            2.0f / ((1.0f + kSidesAlike) + (1.0f - kSidesAlike) * value * value));
        mid_.set(keep, ramp);
        side_.set(keep * value, ramp);
        break;
      }
      case kBlur:
        blur_.set(value, ramp);
        break;
      case kSolid:
        solid_target_ = kit::clamp_int(static_cast<int>(value * 0.001f * sample_rate() + 0.5f), 0,
                                       kPreSize - 8);
        if (!ramp) {
          solid_now_ = solid_target_;
          solid_next_ = solid_target_;
          solid_fade_ = 1.0f;
        }
        break;
      case kSize:
        scale_.set(kMinScale * std::pow(kMaxScale / kMinScale, value), ramp);
        break;
      case kSag:
        sag_.set(value, ramp);
        break;
      case kHold:
        hold_.set(value, ramp);
        break;
      case kDim:
        dim_.set(value, ramp);
        break;
      case kDrip:
        drip_.set(value, ramp);
        break;
      default:
        break;
    }
  }

  kit::DelayLine<kPreSize> pre_[2];
  kit::DelayLine<kLineSize> line_[kLines];
  kit::AllpassDelay<kAllpassSize> allpass_[kLines];
  kit::OnePole dark_[kLines], thin_[kLines];
  kit::DcBlocker steady_[2];
  kit::Drift tide_;
  kit::Drift wander_[kLines];
  float base_[kLines] = {};
  int allpass_length_[kLines] = {};
  // The two heads of each line: how far past the line's length each reads
  // (samples), which of them leads, how far its fade in has got (1: done),
  // and how alike the two were found when the fade began.
  float position_[kLines][2] = {};
  int lead_[kLines] = {};
  float fade_[kLines] = {};
  float alike_[kLines] = {};
  float fade_step_ = 0.0f;
  // Set on the control clock: the slide, each head's level and colour by
  // where it stands, each side's level and the level hold's gain.
  float rate_[kLines] = {};
  Walk gain_[kLines][2];
  float dark_cut_[kLines][2] = {};
  float thin_cut_[kLines][2] = {};
  Walk level_[2];
  Walk hold_walk_;
  // The level hold: the power fed to each side's lines and that of the tail
  // (before the hold) since the last tick, the same smoothed, the past of
  // what was fed and of what the lines held by the reckoning (a slot a
  // tick), each line's power by the reckoning, and the hold's gain.
  float fed_sum_[2] = {};
  float heard_sum_ = 0.0f;
  float fed_[2] = {};
  float heard_ = 0.0f;
  float fed_past_[2][kPast] = {};
  float tail_past_[kPast] = {};
  int past_at_ = 0;
  float model_[kLines] = {};
  // The same reckoning for steady sound of unit power: its past and each
  // line's share now. The level is set by it.
  float unit_past_[kPast] = {};
  float unit_[kLines] = {};
  float held_ = 1.0f;
  float weigh_ = 0.0f;
  float hold_coeff_ = 0.0f;
  float hold_now_ = 1.0f;
  float dark_now_ = 0.0f;
  float thin_now_ = 0.0f;
  // Solid, in samples: the delay in use, the one being faded to, how far
  // that fade has got (1: done), and the one asked for.
  int solid_now_ = 0;
  int solid_next_ = 0;
  int solid_target_ = 0;
  float solid_fade_ = 1.0f;
  float solid_step_ = 0.0f;

  kit::Smoother dry_, wet_, mid_, side_, blur_, scale_;
  kit::Smoother sag_, hold_, dim_, drip_;
  kit::ControlClock clock_;
  bool started_ = false;  // the first control tick snaps what later ones walk to
  long quiet_ = 0;
  long quiet_frames_ = 1;
  bool asleep_ = true;
  // For meter() only: never read by the sound.
  float wander_seen_ = 0.0f;
};

}  // namespace livemix
