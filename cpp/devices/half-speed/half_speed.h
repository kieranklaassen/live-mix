#pragma once

// Half Speed: what is being played, slowed down as it is played.
//
// (signal path and method notes are filled in at the end of the file's life)

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
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    ring_.clear();
    matcher_.init(sr);
    fade_.set_time(kSmoothingSeconds, sr);
    smooth_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    speed_.set_time(kSpeedGlideSeconds, sr);
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
    const bool excited = input_present(frames);
    if (asleep_) {
      if (!excited) {
        silence_output(frames);
        return;
      }
      asleep_ = false;
      restart();
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      render_frame(in, &out_left_[i], &out_right_[i]);
    }
    // Asleep once every head can only find blank input behind it.
    if (!excited && static_cast<double>(blank_) > reach() &&
        output_peak(frames) <= kit::IdleGate::kFloor) {
      asleep_ = true;
    }
  }

 private:
  // The farthest a head falls behind: the previous cycle's head is still
  // read during the first half of the next cycle, 1.5 cycles of 4 s
  // stretched by a quarter by Jitter, at 96 kHz, losing a quarter of a
  // sample per sample at the fastest speed... (see reach()); plus margin.
  static constexpr int kRingFrames = 560000;
  static constexpr long kLongEnough = 1L << 30;
  static constexpr double kStartDelay = 3.0;
  static constexpr float kSpeedGlideSeconds = 0.06f;
  static constexpr float kMatchGlideSeconds = 0.02f;
  static constexpr float kPowerFadeSeconds = 0.03f;
  static constexpr float kMinFadeSeconds = 0.004f;
  // Jitter at 1 makes a cycle up to a quarter longer or shorter.
  static constexpr float kJitterRange = 0.25f;
  // Spread at 1 holds the right side a quarter of a cycle behind the left.
  static constexpr float kSpreadCycles = 0.25f;
  static constexpr float kSpreadPull = 4.0f;
  // Below this both sides play the same head, so the bass stays in step.
  static constexpr float kBassHz = 200.0f;
  static constexpr int kControlPeriod = 16;
  static constexpr float kFilterEaseSeconds = 0.008f;
  static constexpr float kSpeeds[4] = {0.75f, 2.0f / 3.0f, 0.5f, 0.25f};

  enum Head : int { kCur = 0, kPrev, kMid, kNumHeads };

  // Three heads on one cycle clock.
  struct Timing {
    double phase = 0.0;
    bool mid_done = false;
    double delay[kNumHeads] = {3.0, 3.0, 3.0};
    float weight[kNumHeads] = {1.0f, 0.0f, 0.0f};
    // How alike the heads' waveforms are (Matcher), glided between cycles.
    kit::Smoother match;
  };

  void restart();
  void apply(int id);
  void render_frame(const float* in, float* out_left, float* out_right);
  bool advance(Timing& timing, double increment, float lose, const Timing* leader);
  void launch(Timing& timing, int head, const Timing* leader);
  float make_up(Timing& timing) const;
  void control();
  void relaunch();
  void weigh(Timing& timing, float fade, float smooth) const;
  double reach() const;

  half_speed::StereoRing<kRingFrames> ring_;
  Timing timing_[2];
  kit::Rng rng_;
  half_speed::Matcher matcher_;
  kit::Smoother fade_, smooth_, mix_, speed_;
  kit::LinearRamp power_;
  double cycle_frames_ = 48000.0;
  float jitter_factor_ = 1.0f;
  float mix_seen_ = -1.0f, dry_gain_ = 1.0f, wet_gain_ = 0.0f;
  kit::Svf low_cut_[2], high_cut_[2], bass_;
  kit::ControlClock clock_;
  float low_hz_ = 20.0f, high_hz_ = 20000.0f, filter_ease_ = 0.05f;
  bool together_ = true;
  bool engage_ = false;
  long blank_ = 0;
  bool asleep_ = true;
};

// --- implementation -------------------------------------------------------------------------

// Every head at the present, on a fresh cycle: init, waking and switching on.
inline void HalfSpeed::restart() {
  rng_.seed(0x48A1F5EDu);
  relaunch();
  fade_.snap(fade_.target);
  smooth_.snap(smooth_.target);
  mix_.snap(mix_.target);
  speed_.snap(speed_.target);
  for (int c = 0; c < 2; ++c) {
    low_cut_[c].reset();
    high_cut_[c].reset();
  }
  bass_.reset();
  bass_.set(kBassHz, kit::kSqrtHalf, sample_rate());
  clock_.reset(kControlPeriod);
  filter_ease_ = 1.0f - std::exp(-kControlPeriod / (kFilterEaseSeconds * sample_rate()));
  low_hz_ = param(half_speed::kLowCut);
  high_hz_ = param(half_speed::kHighCut);
  mix_seen_ = -1.0f;
  engage_ = false;
  blank_ = 0;
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
  const double behind = static_cast<double>(kSpreadCycles) * param(half_speed::kSpread);
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
    if (power_.value == 0.0f) relaunch();
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
  wet[0] = left;
  wet[1] = late_right + bass_.lowpass(right - late_right);
  for (int c = 0; c < 2; ++c) wet[c] = low_cut_[c].highpass(high_cut_[c].lowpass(wet[c]));

  // Cycle clocks. The second one runs a little fast or slow until it is
  // where Spread wants it, so moving Spread never jumps a head.
  const double increment = 1.0 / (cycle_frames_ * jitter_factor_);
  double wanted = lead.phase - static_cast<double>(kSpreadCycles) * param(kSpread) - late.phase;
  wanted -= std::floor(wanted + 0.5);
  const bool locked = wanted > -1.0e-9 && wanted < 1.0e-9;
  double late_increment = increment;
  if (locked) {
    late.phase += wanted;
    if (late.phase < 0.0) late.phase += 1.0;
  } else {
    late_increment *= kit::clamp(1.0f + kSpreadPull * static_cast<float>(wanted), 0.5f, 2.0f);
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

// Put a head back at the present.
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

// Band filters, eased towards their settings so a sweep does not step.
inline void HalfSpeed::control() {
  using namespace half_speed;
  const float sr = sample_rate();
  low_hz_ += (param(kLowCut) - low_hz_) * filter_ease_;
  high_hz_ += (param(kHighCut) - high_hz_) * filter_ease_;
  for (int c = 0; c < 2; ++c) {
    low_cut_[c].set(low_hz_, kit::kSqrtHalf, sr);
    high_cut_[c].set(high_hz_, kit::kSqrtHalf, sr);
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
