#pragma once

// Half Speed: what is being played, slowed down as it is played.
//
//   in ─┬─────────────────────────────────────────────────────────── dry ─┐
//       ├─► ring ─► first set of heads (L, R) ──────────► L ─┐            (+)─► out
//       │      └──► second set (R only, held behind) ─┐      ├─► low cut ─► high cut ─► wet ─┘
//       │    first set R ─► below 200 Hz, and above ─(+)─► R ─┘   (Spread blends the two above)
//       └─► mono, 6 kHz copy ─► splice search (matcher.h)
//
// - Sound cannot be slowed without falling behind, so it runs in cycles of
//   Length. A head starts at the present and reads at Speed, losing
//   (1 - Speed) of a frame per frame; at the end of the cycle a new head
//   starts at the present again. What a cycle had no time for is skipped.
// - Three heads on one cycle clock, their gains summing to one (weigh()):
//   Smooth 0 is the cycle's head alone, cross-fading from the last cycle's
//   over Fade of the cycle (a rhythm of slowed chunks). Smooth 1 puts the
//   cycle's head under a Hann window and a third head, started mid-cycle,
//   under the same window half a cycle later: two heads half a cycle apart
//   that always sum to one, the delay-line pitch shifter with a window as
//   long as the cycle. In between the gains are blended.
// - A new head does not start exactly at the present but up to 26 ms before
//   it, where the waveform lines up with the heads it fades in against (the
//   WSOLA search, matcher.h), so a held note does not cancel or thump at
//   the join. How well they line up also sets how much the fade's level
//   is made up (make_up()): nothing when they match, 3 dB at the middle of
//   a fade between unrelated sounds.
// - Speed glides over 60 ms and every head follows it, so a change bends
//   like a tape machine. Length sets how fast the cycle clock turns and
//   acts at once; Jitter draws a new clock rate for every cycle.
// - Spread: a second set of heads on its own clock, a quarter of a cycle
//   behind the first, is blended into the right side above 200 Hz: none of
//   it at 0 (both sides the same), all of it at 1 (widen()). Left and bass
//   stay on the first set, so the low end is one signal on both sides. The
//   second clock runs a little fast or slow to reach its place; with no
//   Spread it locks to the first and the sets become one.
// - Power fades between dry and the mix; switching on from off starts a new
//   cycle at that moment, as does the first sound after a silence, with all
//   heads together so the slowed sound is there in full from the start.
// - No latency: the dry path is not delayed. The wet is a different stretch
//   of time from the dry, so Mix is equal power.
// - Sleep: once the input has been blank for longer than the furthest head
//   is behind, and the filters have rung out, the device stops.

#include "../../kit/kit.h"
#include "matcher.h"
#include "params.gen.h"
#include "ring.h"

namespace livemix {

class HalfSpeed : public kit::DeviceBase<half_speed::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace half_speed;
    kit::SineTable::init();
    half_speed::SincTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    ring_.clear();
    matcher_.init(sr);
    fade_.set_time(kSmoothingSeconds, sr);
    smooth_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    speed_.set_time(kSpeedGlideSeconds, sr);
    spread_.set_time(kSmoothingSeconds, sr);
    for (Timing& timing : timing_) timing.match.set_time(kMatchGlideSeconds, sr);
    power_.set_time(kPowerFadeSeconds, sr);
    asleep_ = true;
    for (int id = 0; id < kNumParams; ++id) apply(id);
    power_.snap(power_.target);
    restart();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    using namespace half_speed;
    frames = begin_block(frames);
    const float floor = kit::IdleGate::kFloor;
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      const bool excited = in[0] != 0.0f || in[1] != 0.0f;
      // Asleep and awake are decided frame by frame, not block by block:
      // waking starts a cycle, and it has to start on the first frame of the
      // note whatever the host's block size.
      if (asleep_) {
        if (!excited) {
          out_left_[i] = 0.0f;
          out_right_[i] = 0.0f;
          continue;
        }
        asleep_ = false;
        restart();
      }
      in[0] = tidy(in[0]);
      in[1] = tidy(in[1]);
      render_frame(in, &out_left_[i], &out_right_[i]);
      // Asleep once every head can only find blank input behind it and the
      // filters have rung out (the output under the floor for a while, not
      // just passing through zero).
      const float left = out_left_[i], right = out_right_[i];
      if (left > floor || left < -floor || right > floor || right < -floor) {
        quiet_ = 0;
      } else if (quiet_ < kLongEnough) {
        ++quiet_;
      }
      if (!excited && quiet_ > quiet_frames_ && static_cast<double>(blank_) > reach()) {
        asleep_ = true;
      }
    }
  }

 private:
  // The farthest a head falls behind: the last cycle's head is still read
  // for up to half of the next cycle, so it lives 1.5 cycles of 4 s, each
  // stretched a quarter by Jitter and (the second set) a third more while
  // Spread moves, losing three quarters of a frame per frame at Quarter
  // speed: 7.5 s at 96 kHz. advance() holds a head at the end of the ring.
  static constexpr int kRingFrames = 730000;
  // No input sample is taken to be larger than this (12 dB over full scale).
  static constexpr float kInputBound = 4.0f;
  static constexpr long kLongEnough = 1L << 30;
  // Where a head starts: as close to the present as the read kernel allows.
  static constexpr double kStartDelay = 6.0;
  static constexpr float kSpeedGlideSeconds = 0.06f;
  static constexpr float kMatchGlideSeconds = 0.02f;
  static constexpr float kPowerFadeSeconds = 0.03f;
  static constexpr float kMinFadeSeconds = 0.004f;
  // How long the output has to stay under the floor before the device sleeps.
  static constexpr float kQuietSeconds = 0.05f;
  // Jitter at 1 makes a cycle up to a quarter longer or shorter.
  static constexpr float kJitterRange = 0.25f;
  // With any Spread the second set runs a quarter of a cycle behind the first.
  static constexpr float kSpreadCycles = 0.25f;
  static constexpr float kSpreadPull = 4.0f;
  // The second set's share of the right side is Spread to this power, so
  // that the width grows evenly along the knob.
  static constexpr float kSpreadCurve = 0.6f;
  // Below this both sides play the same head, so the bass stays in step.
  static constexpr float kBassHz = 200.0f;
  // widen(): how fast the blend's level and the right side's level are
  // followed, and how far each may be corrected.
  static constexpr float kLiftSeconds = 0.1f;
  static constexpr float kTrimSeconds = 1.0f;
  static constexpr float kMaxTrim = 1.2589f;  // 2 dB either way
  static constexpr float kTrimPedestal = 1.0e-4f;
  static constexpr int kControlPeriod = 16;
  static constexpr float kFilterEaseSeconds = 0.008f;
  static constexpr float kSpeeds[4] = {0.75f, 2.0f / 3.0f, 0.5f, 0.25f};

  enum Head : int { kCur = 0, kPrev, kMid, kNumHeads };

  // Three heads on one cycle clock.
  struct Timing {
    double phase = 0.0;
    bool mid_done = false;
    double delay[kNumHeads] = {kStartDelay, kStartDelay, kStartDelay};
    float weight[kNumHeads] = {1.0f, 0.0f, 0.0f};
    // How alike the heads' waveforms are (Matcher), glided between cycles.
    kit::Smoother match;
  };

  // What comes in is kept as it is unless it is not a number (then it is
  // silence) or absurdly large (then it is held to the bound): one such
  // sample would otherwise sit in the ring and in every filter for good.
  static float tidy(float x) {
    if (!(x == x)) return 0.0f;
    return x > kInputBound ? kInputBound : (x < -kInputBound ? -kInputBound : x);
  }
  void restart();
  void apply(int id);
  void render_frame(const float* in, float* out_left, float* out_right);
  bool advance(Timing& timing, double increment, float lose, const Timing* leader);
  void launch(Timing& timing, int head, const Timing* leader);
  float make_up(Timing& timing) const;
  float widen(float low, float near_high, float far_high, float far);
  void control();
  bool ease(float* value, float target) const;
  void relaunch();
  void clear_filters();
  void weigh(Timing& timing, float fade, float smooth) const;
  double reach() const;
  // How far behind the first cycle clock the second runs, in cycles: a
  // quarter whenever Spread is up at all (how much of it is heard is the
  // blend in widen()), nothing at Spread 0, when the two sets are one.
  double spread_offset() const {
    return param(half_speed::kSpread) > 0.0f ? static_cast<double>(kSpreadCycles) : 0.0;
  }

  half_speed::StereoRing<kRingFrames> ring_;
  Timing timing_[2];
  kit::Rng rng_;
  half_speed::Matcher matcher_;
  kit::Smoother fade_, smooth_, mix_, speed_;
  kit::LinearRamp power_;
  double cycle_frames_ = 48000.0;
  float jitter_factor_ = 1.0f;
  float mix_seen_ = -1.0f, dry_gain_ = 1.0f, wet_gain_ = 0.0f;
  kit::Svf low_cut_[2], high_cut_[2], split_left_, split_right_, split_low_[2], split_high_[2];
  // The share of the second set in the right side (the square root of Spread).
  kit::Smoother spread_;
  // Running powers for widen(): the two sets above the split and their
  // product; the low half times the first set's upper half and times the
  // blend; the right side.
  float near_power_ = 0.0f, far_power_ = 0.0f, cross_power_ = 0.0f;
  float low_near_ = 0.0f, low_blend_ = 0.0f, right_power_ = 0.0f;
  float lift_rate_ = 0.0f, trim_rate_ = 0.0f, alike_ = 1.0f;
  kit::ControlClock clock_;
  float low_hz_ = 20.0f, high_hz_ = 20000.0f, filter_ease_ = 0.05f;
  bool together_ = true;
  bool engage_ = false;
  long blank_ = 0;
  long quiet_ = 0;
  long quiet_frames_ = 2400;
  bool asleep_ = true;
};

// --- implementation -------------------------------------------------------------------------

// Everything settled and a fresh cycle: init and waking from sleep.
inline void HalfSpeed::restart() {
  rng_.seed(0x48A1F5EDu);
  matcher_.rewind();
  relaunch();
  fade_.snap(fade_.target);
  smooth_.snap(smooth_.target);
  mix_.snap(mix_.target);
  speed_.snap(speed_.target);
  spread_.snap(spread_.target);
  clear_filters();
  clock_.reset(kControlPeriod);
  filter_ease_ = 1.0f - std::exp(-kControlPeriod / (kFilterEaseSeconds * sample_rate()));
  low_hz_ = param(half_speed::kLowCut);
  high_hz_ = param(half_speed::kHighCut);
  for (int c = 0; c < 2; ++c) {
    low_cut_[c].set(low_hz_, kit::kSqrtHalf, sample_rate());
    high_cut_[c].set(high_hz_, kit::kSqrtHalf, sample_rate());
  }
  mix_seen_ = -1.0f;
  engage_ = false;
  blank_ = 0;
  quiet_ = 0;
  quiet_frames_ = static_cast<long>(kQuietSeconds * sample_rate());
}

inline void HalfSpeed::clear_filters() {
  for (int c = 0; c < 2; ++c) {
    low_cut_[c].reset();
    high_cut_[c].reset();
  }
  kit::Svf* split[6] = {&split_left_,    &split_right_,   &split_low_[0],
                        &split_low_[1],  &split_high_[0], &split_high_[1]};
  for (kit::Svf* filter : split) {
    filter->reset();
    filter->set(kBassHz, kit::kSqrtHalf, sample_rate());
  }
  near_power_ = far_power_ = cross_power_ = 0.0f;
  // The right side's power starts from a pedestal, which dies away: its
  // level is only corrected once there is something to go by.
  low_near_ = low_blend_ = 0.0f;
  alike_ = 1.0f;
  right_power_ = kTrimPedestal;
  lift_rate_ = 1.0f - std::exp(-1.0f / (kLiftSeconds * sample_rate()));
  trim_rate_ = 1.0f - std::exp(-1.0f / (kTrimSeconds * sample_rate()));
}

// A fresh cycle with all three heads at the present. They read the same
// place and their gains sum to one, so the slowed sound is there in full
// from the first sample instead of fading in.
inline void HalfSpeed::relaunch() {
  for (Timing& timing : timing_) {
    timing.phase = 0.0;
    timing.mid_done = false;
    for (int h = 0; h < kNumHeads; ++h) timing.delay[h] = kStartDelay;
    timing.match.snap(1.0f);
  }
  // The second clock starts where Spread holds it, not a cycle of catching up.
  const double behind = spread_offset();
  if (behind > 0.0) {
    timing_[1].phase = 1.0 - behind;
    timing_[1].mid_done = true;
  }
  together_ = !(behind > 0.0);
  jitter_factor_ = 1.0f;
}

inline void HalfSpeed::render_frame(const float* in, float* out_left, float* out_right) {
  using namespace half_speed;
  ring_.write(in[0], in[1]);
  matcher_.write(0.5f * (in[0] + in[1]));
  const float floor = kit::IdleGate::kFloor;
  if (in[0] > floor || in[0] < -floor || in[1] > floor || in[1] < -floor) {
    blank_ = 0;
  } else if (blank_ < kLongEnough) {
    ++blank_;
  }

  // Power: switching on from fully off starts a cycle at the present.
  if (engage_) {
    engage_ = false;
    if (power_.value == 0.0f) {
      relaunch();
      clear_filters();
    }
  }
  const float power = power_.next();
  if (power == 0.0f) {
    *out_left = in[0];
    *out_right = in[1];
    return;
  }

  if (clock_.tick()) control();
  const float lose = 1.0f - speed_.next();
  const float fade = fade_.next();
  const float smooth = smooth_.next();

  // The left side and the bass of both sides follow the first cycle clock;
  // the right side above the bass follows the second, which Spread holds a
  // part of a cycle behind the first.
  Timing& lead = timing_[0];
  Timing& late = timing_[1];
  weigh(lead, fade, smooth);
  lead.match.next();
  float left = 0.0f, right = 0.0f;
  for (int h = 0; h < kNumHeads; ++h) {
    if (lead.weight[h] <= 0.0f) continue;
    float l, r;
    ring_.read(lead.delay[h], &l, &r);
    left += lead.weight[h] * l;
    right += lead.weight[h] * r;
  }
  const float level = make_up(lead);
  left *= level;
  right *= level;
  float late_right = right;
  late.match.next();
  if (!together_) {
    weigh(late, fade, smooth);
    late_right = 0.0f;
    for (int h = 0; h < kNumHeads; ++h) {
      if (late.weight[h] <= 0.0f) continue;
      late_right += late.weight[h] * ring_.read_one(late.delay[h], 1);
    }
    late_right *= make_up(late);
  }
  float wet[2];
  // A fourth-order Linkwitz-Riley split on the right: lows from the first
  // set, the rest a blend of the first set and the second, as Spread says.
  // The two halves of the split add up to a second-order allpass, which the
  // left side gets too, so the sides stay in phase; the first set's upper
  // half is that allpass less its lower half.
  split_left_.process(left);
  wet[0] = left - 2.0f * split_left_.k * split_left_.band;
  const float low = split_low_[1].lowpass(split_low_[0].lowpass(right));
  split_right_.process(right);
  const float near_high = right - 2.0f * split_right_.k * split_right_.band - low;
  const float far_high = split_high_[1].highpass(split_high_[0].highpass(late_right));
  const float far = spread_.next();
  wet[1] = widen(low, near_high, far_high, far);
  for (int c = 0; c < 2; ++c) wet[c] = low_cut_[c].highpass(high_cut_[c].lowpass(wet[c]));

  // Cycle clocks. The second one runs a little fast or slow until it is
  // where Spread wants it, so moving Spread never jumps a head.
  const double increment = 1.0 / (cycle_frames_ * jitter_factor_);
  double wanted = lead.phase - spread_offset() - late.phase;
  wanted -= std::floor(wanted + 0.5);
  const bool locked = wanted > -1.0e-9 && wanted < 1.0e-9;
  double late_increment = increment;
  if (locked) {
    late.phase += wanted;
    if (late.phase < 0.0) late.phase += 1.0;
  } else {
    late_increment *= kit::clamp(1.0f + kSpreadPull * static_cast<float>(wanted), 0.75f, 1.5f);
  }
  const bool joined = locked && late.phase == lead.phase;
  if (advance(lead, increment, lose, nullptr)) {
    jitter_factor_ = 1.0f + kJitterRange * param(kJitter) * rng_.bipolar();
  }
  advance(late, late_increment, lose, joined ? &lead : nullptr);
  together_ = joined;
  for (int h = 0; h < kNumHeads; ++h) together_ = together_ && late.delay[h] == lead.delay[h];

  const float mix = mix_.next() * power;
  if (mix != mix_seen_) {
    mix_seen_ = mix;
    dry_gain_ = kit::SineTable::cos_lookup(0.25f * mix);
    wet_gain_ = kit::SineTable::lookup(0.25f * mix);
  }
  *out_left = in[0] * dry_gain_ + wet[0] * wet_gain_;
  *out_right = in[1] * dry_gain_ + wet[1] * wet_gain_;
}

inline void HalfSpeed::apply(int id) {
  using namespace half_speed;
  const float value = param(id);
  // Nothing sounds while asleep, so a value set then has nothing to glide from.
  const bool glide = primed() && !asleep_;
  switch (id) {
    case kPower: {
      const float on = value < 0.5f ? 1.0f : 0.0f;
      if (on > power_.target) engage_ = true;
      power_.set(on, glide);
      break;
    }
    case kLength:
      cycle_frames_ = static_cast<double>(value) * 0.001 * sample_rate();
      break;
    case kSpeed:
      speed_.set(kSpeeds[kit::clamp_int(static_cast<int>(value + 0.5f), 0, 3)], glide);
      break;
    case kFade:
      fade_.set(value, glide);
      break;
    case kSmooth:
      smooth_.set(value, glide);
      break;
    case kMix:
      mix_.set(value, glide);
      break;
    case kSpread:
      spread_.set(std::pow(value, kSpreadCurve), glide);
      break;
    default:
      break;  // Jitter is read when a cycle starts; the rest on the control clock
  }
}

// Move every head `lose` frames further behind (it plays slower than the
// input arrives) and turn the cycle clock. True when a new cycle started.
inline bool HalfSpeed::advance(Timing& timing, double increment, float lose,
                                const Timing* leader) {
  const double limit = half_speed::StereoRing<kRingFrames>::max_delay();
  for (int h = 0; h < kNumHeads; ++h) {
    timing.delay[h] += lose;
    if (timing.delay[h] > limit) timing.delay[h] = limit;
  }
  timing.phase += increment;
  if (!timing.mid_done && timing.phase >= 0.5) {
    timing.mid_done = true;
    launch(timing, kMid, leader);
  }
  if (timing.phase < 1.0) return false;
  timing.phase -= 1.0;
  timing.mid_done = false;
  timing.delay[kPrev] = timing.delay[kCur];
  launch(timing, kCur, leader);
  return true;
}

// Put a head back at the present, or up to 26 ms before it: at the place
// where it lines up best with the heads it is about to fade in against.
inline void HalfSpeed::launch(Timing& timing, int head, const Timing* leader) {
  if (leader) {
    // On the same clock as the first set: take the place it has just chosen,
    // so that with no Spread the two sets become one again.
    timing.delay[head] = leader->delay[head];
    timing.match.set_target(leader->match.target);
    return;
  }
  timing.delay[head] = kStartDelay;
  const float smooth = smooth_.value;
  if (head == kMid && smooth <= 0.0f) return;  // silent in the chop layout
  weigh(timing, fade_.value, smooth);
  double delays[2];
  float weights[2];
  int others = 0;
  for (int h = 0; h < kNumHeads; ++h) {
    if (h == head || (head == kMid && h == kPrev)) continue;
    delays[others] = timing.delay[h];
    weights[others] = timing.weight[h];
    ++others;
  }
  const half_speed::Matcher::Match rough = matcher_.coarse(delays, weights, others, kStartDelay);
  const half_speed::Matcher::Match found =
      matcher_.fine(ring_, rough, delays, weights, others, kStartDelay, sample_rate());
  timing.delay[head] = kStartDelay + found.offset;
  timing.match.set_target(found.score);
}

// Head gains from the place in the cycle. Two layouts, blended by Smooth,
// each summing to one:
//   chop    the cycle's own head, fading in from the previous cycle's head
//           over the first `fade` of the cycle;
//   smooth  the cycle's head under a Hann window over the whole cycle and
//           the mid-cycle head under the same window half a cycle later.
// The cycle's head is the same head in both, so the blend is one of gains.
inline void HalfSpeed::weigh(Timing& timing, float fade, float smooth) const {
  const float phase = static_cast<float>(timing.phase);
  // Never a shorter splice than 4 ms, however short the cycle.
  const float shortest = static_cast<float>(kMinFadeSeconds * sample_rate() / cycle_frames_);
  if (fade < shortest) fade = shortest < 0.5f ? shortest : 0.5f;
  const float chop =
      phase < fade ? 0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * phase / fade) : 1.0f;
  const float hann = 0.5f - 0.5f * kit::SineTable::cos_lookup(phase);
  timing.weight[kCur] = (1.0f - smooth) * chop + smooth * hann;
  timing.weight[kPrev] = (1.0f - smooth) * (1.0f - chop);
  timing.weight[kMid] = smooth * (1.0f - hann);
}

// The gains sum to one, which keeps the level when the heads carry the same
// waveform in step (`match` 1). Unrelated heads add in power and the sum
// would dip by up to 3 dB mid-fade, so make up for what is missing (Fink,
// Holters and Zölzer, "Signal-matched power-complementary cross-fading and
// dry-wet mixing", DAFx-16, for two signals; here for three gains).
inline float HalfSpeed::make_up(Timing& timing) const {
  float squares = 0.0f;
  for (int h = 0; h < kNumHeads; ++h) squares += timing.weight[h] * timing.weight[h];
  if (squares > 0.9999f) return 1.0f;
  const float match = timing.match.value;
  return 1.0f / std::sqrt(squares + match * (1.0f - squares));
}

// The right side: the first set's low half, and above it a blend of the two
// sets, `far` of it the second set's (none at Spread 0, when both sides play
// the first set; all of it at Spread 1).
// - The blend's two gains sum to one. Two sets that are not in step add up
//   to less than either alone, so the blend is lifted by what is missing,
//   going by how alike the two have been over the last tenth of a second
//   (the same law as make_up(), measured here instead of taken from the
//   splice search). Sets that are out of step count as unrelated: making up
//   for a cancellation would overshoot as soon as it ended.
// - Where the low half of one set meets the upper half of the other (around
//   200 Hz) they are not in step either, and a held chord comes out a little
//   quieter on the right than on the left. The two halves of one set add
//   more than their separate powers (they overlap, in phase); the low half
//   and the second set's upper half do not. A slow trim, 2 dB at most, puts
//   back what is missing, measured: the product of the low half with the
//   first set's upper half and with the blend, each followed over a second.
//   With none of the second set nothing is missing and the trim is one. It
//   does not compare the sides' levels, which would pump on notes the two
//   sets play at different moments, and it goes by the right channel only,
//   so a lean in the input stays as it is.
inline float HalfSpeed::widen(float low, float near_high, float far_high, float far) {
  const float near = 1.0f - far;
  near_power_ = flush_denormal(near_power_ + (near_high * near_high - near_power_) * lift_rate_);
  far_power_ = flush_denormal(far_power_ + (far_high * far_high - far_power_) * lift_rate_);
  cross_power_ = flush_denormal(cross_power_ + (near_high * far_high - cross_power_) * lift_rate_);
  // alike_ is how alike the two sets have been (control()): 1 in step, 0
  // unrelated or out of step.
  const float lift = 1.0f / std::sqrt(near * near + far * far + 2.0f * near * far * alike_);
  const float blend = lift * (near * near_high + far * far_high);
  const float side = low + blend;

  // What the two halves of the split add over their separate powers when
  // they are one set in step (the first set's own halves), and what they
  // add as they are here.
  low_near_ = flush_denormal(low_near_ + (low * near_high - low_near_) * trim_rate_);
  low_blend_ = flush_denormal(low_blend_ + (low * blend - low_blend_) * trim_rate_);
  right_power_ = flush_denormal(right_power_ + (side * side - right_power_) * trim_rate_);
  float trim = 1.0f;
  if (right_power_ > 1.0e-18f) {
    const float missing = 2.0f * (low_near_ - low_blend_);
    trim = std::sqrt(kit::clamp(1.0f + missing / right_power_, 1.0f / (kMaxTrim * kMaxTrim),
                                kMaxTrim * kMaxTrim));
  }
  return side * trim;
}

// One step of `value` towards `target`; false once it is there.
inline bool HalfSpeed::ease(float* value, float target) const {
  if (*value == target) return false;
  *value += (target - *value) * filter_ease_;
  const float gap = *value - target;
  if (gap > -1.0e-3f * target && gap < 1.0e-3f * target) *value = target;
  return true;
}

// Band filters, eased towards their settings so a sweep does not step, and
// how alike the two sets of heads are for widen().
inline void HalfSpeed::control() {
  using namespace half_speed;
  const float sr = sample_rate();
  const float both = near_power_ * far_power_;
  alike_ = both > 1.0e-30f ? kit::clamp(cross_power_ / std::sqrt(both), 0.0f, 1.0f) : 1.0f;
  if (ease(&low_hz_, param(kLowCut))) {
    for (kit::Svf& filter : low_cut_) filter.set(low_hz_, kit::kSqrtHalf, sr);
  }
  if (ease(&high_hz_, param(kHighCut))) {
    for (kit::Svf& filter : high_cut_) filter.set(high_hz_, kit::kSqrtHalf, sr);
  }
}

// How far back any head is, with a margin: input that has been blank for
// longer than this can only give blank output.
inline double HalfSpeed::reach() const {
  double longest = 0.0;
  for (const Timing& timing : timing_) {
    for (int h = 0; h < kNumHeads; ++h) {
      if (timing.delay[h] > longest) longest = timing.delay[h];
    }
  }
  return longest + matcher_.window() + 64.0;
}

}  // namespace livemix
