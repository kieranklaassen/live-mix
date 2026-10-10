#pragma once

// Currents: the sound in three to six bands, each with a slow cycle of level
// and a slow cycle of position between the sides, no two at one speed.
//
//                       ┌─► band 1 ─► × level 1, placed at side 1 ─┐
//   in ─┬───────────────┼─► band 2 ─► × level 2, placed at side 2 ─┼─(Σ of what
//       │               └─► ...                                    │   changed)
//       │                                                          ▼
//       └──────────────────────────────────────────────────────► (+) ─► out
//
//   out = in + Mix · Σ over bands of (what the band becomes − the band)
//
// - A band is one two-pole band-pass (kit::Svf, unity gain and no phase turn
//   at its centre), so "in + (g − 1)·band" is a bell that lifts or cuts by g
//   at the centre. Nothing is split and summed again: with Depth 0 and Sway 0
//   every term is exactly nought and the output is the input, bit for bit,
//   at any Mix. There is no latency and nothing to align.
// - The centres stand in equal ratios from one step above Low Hold up to
//   6.4 kHz, and at Focus 0.25 each band meets the next at its half-power
//   points, so together they cover the range evenly. Focus narrows or widens
//   every band by up to a factor of 2.8 either way. Below Low Hold only the
//   lowest band's skirt reaches, 6 dB less for every octave.
// - Level: g = c · (1 − Depth·(1 − m)/2) for a wave m in −1..1. c is set so
//   that the power averaged over a cycle is the input's: c² = 1 / ((1 −
//   Depth/2)² + Depth²/8). At Depth 1 a band falls to silence and crests
//   4.3 dB over where it was.
// - Side: the band's part that both sides share is placed with an equal
//   power law at Sway·s, s a second wave; what the sides do not share stays
//   where it was. So a centred sound moves bodily, a wide one keeps its
//   width, and the sum of the sides never loses a band (it is 3 dB down at
//   the furthest).
// - The waves run freely and are never reset by the sound. Band k of N turns
//   at Rate · (2π)^(Tide · k/(N − 1)): the lowest at Rate, the highest 2π
//   times faster at full Tide, and no pair in a whole-number ratio. The side
//   wave of a band turns at 0.618 of its level wave.
// - One cycle of a wave rises from a trough to a crest over a share of the
//   cycle (half at Shape 0, 0.92 at Shape 1: a slow rise and a quick fall)
//   and falls back, each way a half cosine. Chance moves every trough and
//   crest of every cycle by up to 0.6 and the crest's place by up to 0.2 of
//   a cycle, from a hash of the cycle's number: the same every time the
//   device starts, never the same two cycles running, and the period itself
//   is untouched. The pattern of a wave repeats after 4096 of its cycles.
// - The waves are worked out every 16 samples and the gains run straight
//   between two workings; knobs glide over 5 ms, band centres over 30 ms.
// - Asleep (no input, nothing sounding), time still passes for the waves:
//   waking moves each on by the time slept. When sound returns after a fifth
//   of a second of exact silence the knobs are where they were last set and
//   the filters are empty, at that sample and not at the block's edge, so
//   the output does not depend on the block size.
// - Storage: twelve two-pole filters and the waves' phases. No delay lines.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Currents : public kit::DeviceBase<currents::kNumParams> {
 public:
  static constexpr int kMaxBands = 6;
  // A wave's phase is kept in cycles and wraps here, so it stays exact for
  // ever and a reading of it fits a float.
  static constexpr int kPhaseWrap = 4096;
  // The highest band's centre, and the least room the bands are given above Low Hold.
  static constexpr float kTopHz = 6400.0f;
  // How much faster the highest band turns than the lowest at full Tide.
  static constexpr float kSpread = 6.2831853f;
  // A band's side wave against its level wave.
  static constexpr float kSideRatio = 0.6180340f;
  // The share of a cycle the rise takes: kTurn at Shape 0, kTurn + kBreak at Shape 1.
  static constexpr float kTurn = 0.5f;
  static constexpr float kBreak = 0.42f;
  // What Chance 1 does to a cycle: troughs and crests by this much, the crest's place by this much.
  static constexpr float kWander = 0.6f;
  static constexpr float kSkew = 0.2f;
  // The least share of a cycle a rise or a fall is given.
  static constexpr float kLeastTurn = 0.06f;
  // Focus at which the bands meet at their half-power points, and the octaves of width it covers.
  static constexpr float kEvenFocus = 0.25f;
  static constexpr float kFocusOctaves = 2.0f;
  // Where the waves stand when the device starts: band k's level wave at
  // kLevelStart + k·kLevelStep cycles, its side wave likewise.
  static constexpr float kLevelStart = 0.35f;
  static constexpr float kLevelStep = 0.6180340f;
  static constexpr float kSideStart = 0.25f;
  static constexpr float kSideStep = 0.3819660f;
  static constexpr uint32_t kLevelSeed = 0x51C0FFEEu;
  static constexpr uint32_t kSideSeed = 0x0DD5EA51u;

  // A number in [0, 1) for one cycle of one wave: `which` picks the trough
  // (0), the crest (1) or the crest's place (2).
  static float wander(uint32_t seed, int cycle, int which) {
    uint32_t x = seed ^ (static_cast<uint32_t>(cycle) * 0x9E3779B1u) ^
                 (static_cast<uint32_t>(which) * 0x85EBCA77u);
    x ^= x >> 16;
    x *= 0x7FEB352Du;
    x ^= x >> 15;
    x *= 0x846CA68Bu;
    x ^= x >> 16;
    return static_cast<float>(x >> 8) * (1.0f / 16777216.0f);
  }

  // The seed of band `band`'s level wave (side false) or side wave.
  static uint32_t seed_of(int band, bool side) {
    return (side ? kSideSeed : kLevelSeed) + static_cast<uint32_t>(band) * 0x01000193u;
  }

  // A wave at `phase` cycles (0 <= phase < kPhaseWrap), in −1..1: from this
  // cycle's trough up to its crest over `turn` of the cycle, then down to the
  // next cycle's trough. Needs kit::SineTable::init() (init does it).
  static float wave(double phase, float turn, float chance, uint32_t seed) {
    int cycle = static_cast<int>(phase);
    if (cycle >= kPhaseWrap) cycle = kPhaseWrap - 1;
    const float at = static_cast<float>(phase - static_cast<double>(cycle));
    const float reach = chance * kWander;
    const float trough = -1.0f + reach * wander(seed, cycle, 0);
    const float crest = 1.0f - reach * wander(seed, cycle, 1);
    const float rise = kit::clamp(turn + chance * kSkew * (2.0f * wander(seed, cycle, 2) - 1.0f),
                                  kLeastTurn, 1.0f - kLeastTurn);
    float from, to, t;
    if (at < rise) {
      from = trough;
      to = crest;
      t = at / rise;
    } else {
      from = crest;
      to = -1.0f + reach * wander(seed, (cycle + 1) & (kPhaseWrap - 1), 0);
      t = (at - rise) / (1.0f - rise);
    }
    return from + (to - from) * (0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * t));
  }

  // What keeps the power of a band, averaged over a cycle, at the input's.
  static float level_trim(float depth) {
    const float rest = 1.0f - 0.5f * depth;
    return 1.0f / std::sqrt(rest * rest + 0.125f * depth * depth);
  }

  // A band's gain for a level wave at `m`.
  static float level_gain(float depth, float m) {
    return level_trim(depth) * (1.0f - 0.5f * depth * (1.0f - m));
  }

  // The centre of band `band` of `count` above `low_hold`, the ratio between
  // two centres, and the Q at which neighbours meet at their half-power points.
  static float step_ratio(float low_hold, int count, float top) {
    return std::pow(kit::max(top / low_hold, 2.0f), 1.0f / static_cast<float>(count));
  }
  static float centre_hz(float low_hold, int count, int band, float top) {
    const int slot = band < count ? band : count - 1;
    return low_hold * std::pow(step_ratio(low_hold, count, top), static_cast<float>(slot + 1));
  }
  static float even_q(float ratio) {
    const float root = std::sqrt(ratio);
    return 1.0f / (root - 1.0f / root);
  }

  void init(float sample_rate) {
    using namespace currents;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    const float control_rate = sr / static_cast<float>(kControlPeriod);
    depth_.set_time(kSmoothingSeconds, control_rate);
    sway_.set_time(kSmoothingSeconds, control_rate);
    shape_.set_time(kSmoothingSeconds, control_rate);
    chance_.set_time(kSmoothingSeconds, control_rate);
    mix_.set_time(kSmoothingSeconds, control_rate);
    q_.set_time(kGlideSeconds, control_rate);
    for (int k = 0; k < kMaxBands; ++k) {
      centre_[k].set_time(kGlideSeconds, control_rate);
      active_[k].set_time(kGlideSeconds, control_rate);
      level_phase_[k] = fraction(kLevelStart + static_cast<double>(k) * kLevelStep);
      side_phase_[k] = fraction(kSideStart + static_cast<double>(k) * kSideStep);
    }
    top_hz_ = kit::min(kTopHz, 0.4f * sr);
    slept_ = 0.0;
    rest_samples_ = static_cast<long>(kRestSeconds * sr);
    quiet_run_ = rest_samples_;
    // Sleep must not begin before the silence is a rest: the gate counts in
    // whole blocks, so it is given a block more than the rest.
    idle_.reset(sr, static_cast<float>(rest_samples_ + kMaxBlockFrames + 64) / sr);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    arrive();
  }

  void set_param(int id, float value) {
    using namespace currents;
    // The waves have turned at the old speeds for as long as the device slept.
    if (slept_ > 0.0 && (id == kRate || id == kTide || id == kBands)) catch_up();
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for a display to draw:
  // 0..5, where each band's level wave is, in cycles (0 <= reading < 4096);
  // 6..11, where its side wave is. Asleep, where waking now would put it.
  float meter(int index) const {
    if (index < 0 || index >= 2 * kMaxBands) return 0.0f;
    const bool side = index >= kMaxBands;
    const int k = side ? index - kMaxBands : index;
    double phase = side ? side_phase_[k] : level_phase_[k];
    if (slept_ > 0.0) phase = turned(phase, side ? side_step_[k] : level_step_[k], slept_);
    return static_cast<float>(phase);
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      slept_ += frames;
      if (quiet_run_ < rest_samples_) quiet_run_ += frames;
      silence_output(frames);
      return;
    }
    if (slept_ > 0.0) catch_up();
    for (int i = 0; i < frames; ++i) {
      float raw_left, raw_right;
      take_input(i, &raw_left, &raw_right);
      if (raw_left != 0.0f || raw_right != 0.0f) {
        // Sound after a rest: nothing is in the filters, so the knobs are
        // where they were last set. Decided here, on the sample, because
        // whether the device slept through the rest depends on the block size.
        if (quiet_run_ >= rest_samples_) arrive();
        quiet_run_ = 0;
      } else if (quiet_run_ < rest_samples_) {
        ++quiet_run_;
      }
      const float left = clean(raw_left);
      const float right = clean(raw_right);

      if (clock_.tick()) control();
      for (int k = 0; k < kMaxBands; ++k) {
        level_phase_[k] += level_step_[k];
        if (level_phase_[k] >= kPhaseWrap) level_phase_[k] -= kPhaseWrap;
        side_phase_[k] += side_step_[k];
        if (side_phase_[k] >= kPhaseWrap) side_phase_[k] -= kPhaseWrap;
      }

      float out_left = left;
      float out_right = right;
      for (int k = 0; k < kMaxBands; ++k) {
        Weights& w = now_[k];
        w.ll += slope_[k].ll;
        w.rl += slope_[k].rl;
        w.rr += slope_[k].rr;
        w.lr += slope_[k].lr;
        const float band_left = band_[0][k].bandpass(left);
        const float band_right = band_[1][k].bandpass(right);
        out_left += w.ll * band_left + w.rl * band_right;
        out_right += w.rr * band_right + w.lr * band_left;
      }
      out_left_[i] = out_left;
      out_right_[i] = out_right;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kControlPeriod = 16;
  static constexpr float kGlideSeconds = 0.03f;
  // A silence this long is a rest: sound after it finds the knobs arrived.
  static constexpr float kRestSeconds = 0.2f;
  // What reaches the filters is held to this (24 dB over full scale); a
  // sample that is not a number is silence.
  static constexpr float kCeiling = 16.0f;

  // What a band adds to each side: its own side's band times ll (left) or rr
  // (right), and the other side's band times rl (into the left) or lr.
  struct Weights {
    float ll = 0.0f, rl = 0.0f, rr = 0.0f, lr = 0.0f;
  };

  static float clean(float x) {
    if (!(x == x)) return 0.0f;
    return kit::clamp(x, -kCeiling, kCeiling);
  }

  static double fraction(double x) { return x - std::floor(x); }

  // A phase `samples` further on at `step` cycles a sample.
  static double turned(double phase, double step, double samples) {
    return std::fmod(phase + step * samples, static_cast<double>(kPhaseWrap));
  }

  int band_count() const {
    return kit::clamp_int(static_cast<int>(param(currents::kBands) + 0.5f), 3, kMaxBands);
  }

  // Move every wave on by the time slept.
  void catch_up() {
    for (int k = 0; k < kMaxBands; ++k) {
      level_phase_[k] = turned(level_phase_[k], level_step_[k], slept_);
      side_phase_[k] = turned(side_phase_[k], side_step_[k], slept_);
    }
    slept_ = 0.0;
  }

  // Every knob where it was last set, the filters empty and tuned, and the
  // control clock at its start. Only called when nothing is sounding.
  void arrive() {
    depth_.snap(depth_.target);
    sway_.snap(sway_.target);
    shape_.snap(shape_.target);
    chance_.snap(chance_.target);
    mix_.snap(mix_.target);
    q_.snap(q_.target);
    for (int k = 0; k < kMaxBands; ++k) {
      centre_[k].snap(centre_[k].target);
      active_[k].snap(active_[k].target);
      band_[0][k].reset();
      band_[1][k].reset();
    }
    clock_.reset(kControlPeriod);
    fresh_ = true;
  }

  // Every 16 samples: the knobs, the band centres, and each band's gains.
  void control() {
    const float sr = sample_rate();
    const bool fresh = fresh_;
    fresh_ = false;
    const float depth = depth_.next();
    const float sway = sway_.next();
    const float turn = kTurn + kBreak * shape_.next();
    const float chance = chance_.next();
    const float mix = mix_.next();
    const float trim = level_trim(depth);

    const float q_was = q_.value;
    const float q = q_.next();
    for (int k = 0; k < kMaxBands; ++k) {
      const float centre_was = centre_[k].value;
      const float centre = centre_[k].next();
      if (fresh || centre != centre_was || q != q_was) {
        const float hz = std::exp2(centre);
        band_[0][k].set(hz, q, sr);
        band_[1][k].set(hz, q, sr);
      }

      const float m = wave(level_phase_[k], turn, chance, seed_of(k, false));
      const float s = wave(side_phase_[k], kTurn, chance, seed_of(k, true));
      const float gain = trim * (1.0f - 0.5f * depth * (1.0f - m));
      const float place = sway * s;
      float to_left = 1.0f, to_right = 1.0f;
      if (place != 0.0f) {
        const float angle = (place + 1.0f) * 0.125f;  // cycles: 0 left, 1/4 right
        to_left = 1.41421356f * kit::SineTable::cos_lookup(angle);
        to_right = 1.41421356f * kit::SineTable::lookup(angle);
      }
      const float share = active_[k].next() * mix;
      Weights goal;
      goal.ll = share * (gain * (to_left + 1.0f) * 0.5f - 1.0f);
      goal.rl = share * (gain * (to_left - 1.0f) * 0.5f);
      goal.rr = share * (gain * (to_right + 1.0f) * 0.5f - 1.0f);
      goal.lr = share * (gain * (to_right - 1.0f) * 0.5f);
      // The gains stand where the last working sent them, and run straight to this one.
      now_[k] = fresh ? goal : goal_[k];
      const float inverse = 1.0f / static_cast<float>(kControlPeriod);
      slope_[k].ll = (goal.ll - now_[k].ll) * inverse;
      slope_[k].rl = (goal.rl - now_[k].rl) * inverse;
      slope_[k].rr = (goal.rr - now_[k].rr) * inverse;
      slope_[k].lr = (goal.lr - now_[k].lr) * inverse;
      goal_[k] = goal;
    }
  }

  // Where the bands stand and which of them are in use.
  void layout() {
    using namespace currents;
    const int count = band_count();
    const float low_hold = param(kLowHold);
    const float ratio = step_ratio(low_hold, count, top_hz_);
    q_.set(even_q(ratio) * std::exp2(kFocusOctaves * (param(kFocus) - kEvenFocus)), primed());
    for (int k = 0; k < kMaxBands; ++k) {
      centre_[k].set(std::log2(centre_hz(low_hold, count, k, top_hz_)), primed());
      active_[k].set(k < count ? 1.0f : 0.0f, primed());
    }
  }

  // How fast each wave turns, in cycles a sample.
  void speeds() {
    using namespace currents;
    const int count = band_count();
    const double sr = sample_rate();
    for (int k = 0; k < kMaxBands; ++k) {
      const int slot = k < count ? k : count - 1;
      const float along = static_cast<float>(slot) / static_cast<float>(count - 1);
      const double hz = param(kRate) * std::pow(kSpread, param(kTide) * along);
      level_step_[k] = hz / sr;
      side_step_[k] = hz * kSideRatio / sr;
    }
  }

  void apply(int id) {
    using namespace currents;
    const float value = param(id);
    switch (id) {
      case kDepth:
        depth_.set(value, primed());
        break;
      case kSway:
        sway_.set(value, primed());
        break;
      case kShape:
        shape_.set(value, primed());
        break;
      case kChance:
        chance_.set(value, primed());
        break;
      case kMix:
        mix_.set(value, primed());
        break;
      case kRate:
      case kTide:
        speeds();
        break;
      case kBands:
        speeds();
        layout();
        break;
      case kFocus:
      case kLowHold:
        layout();
        break;
      default:
        break;
    }
  }

  kit::Svf band_[2][kMaxBands];
  // All of these step on the control clock, not on the sample.
  kit::Smoother depth_, sway_, shape_, chance_, mix_, q_;
  kit::Smoother centre_[kMaxBands];  // log2 of Hz
  kit::Smoother active_[kMaxBands];
  Weights now_[kMaxBands];
  Weights slope_[kMaxBands];
  Weights goal_[kMaxBands];
  double level_phase_[kMaxBands] = {};
  double side_phase_[kMaxBands] = {};
  double level_step_[kMaxBands] = {};
  double side_step_[kMaxBands] = {};
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  // Samples slept through that the waves have not been moved on by yet.
  double slept_ = 0.0;
  // Samples of exact silence in a row, counted up to a rest.
  long quiet_run_ = 0;
  long rest_samples_ = 1;
  float top_hz_ = kTopHz;
  bool fresh_ = true;
};

}  // namespace livemix
