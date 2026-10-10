#pragma once

// Breath: the sound breathes. One cycle has four parts, each with its own
// length in seconds: In (the breath fills), Hold (full), Out (it empties) and
// Rest (empty). Over the cycle the level, the brightness and the width open
// and close together, and a little air can sound while the breath moves.
//
//   in ─► limit ─┬──────────────────────────────────────────────── dry ─┐
//                │                                                      ▼
//                ├─► width ─► low pass (two poles) ─► × gain ─► (+) ─► Mix ─► out
//                │      ▲            ▲                  ▲        ▲
//                │      └────────────┴── breath b ──────┘        │
//                └─► level follower ─► × noise ─► band pass ─────┘  (the air)
//
// The breath b runs from 0 (empty) to 1 (full):
//
//   In    b = rise(t)        Hold  b = 1
//   Out   b = 1 − rise(t)    Rest  b = 0          t = 0..1 through the part
//   rise(t) = t + Ease · (½ − ½·cos(π·t) − t)     a line, or a soft S
//
// and four things follow it:
//
//   level   gain = floor + (1 − floor)·b,  floor = (1 − Depth^1.5)²: a full
//           breath is the input's own level, and the empty one is 5 dB down
//           at Depth 0.4, 7.6 at a half, 15 at 0.7 and silence only at 1
//   colour  a low pass of two equal poles, 3 dB down at
//           kClosedHz·(kRange − 1) / (kRange^c − 1),  c = Colour·(1 − b):
//           200 Hz when it is all the way shut, and past every sample rate as
//           c reaches 0, where the poles' coefficient is exactly 0 and the
//           filter is a wire
//   width   the sides are turned down by Width·(1 − b) and, as the breath
//           fills, a little spread made from the middle is let in: the middle
//           with its lows cut, 1.3 ms late and through three short
//           all-passes, added to one side and taken from the other, so the
//           mono sum never changes. The delay keeps the spread from leaning
//           on the middle at the same instant, which would favour one side.
//           The spread is small on purpose (kSpread): it changes each side's
//           level tone by tone, and at 0.2 no single tone stands more than
//           3.5 dB apart between the sides at full Width; at 0.6 it was 12 dB
//           and a held note swung to one side with every breath.
//   air     noise, a band wide, whose centre rises with the breath from 800 Hz
//           to 4.5 kHz. It flows while the breath moves (sin(π·t) over In and
//           over Out, nothing in Hold and Rest) and is as loud as the
//           breathing sound is: the input's level (a follower, 80 ms to let
//           go) times the breath's own gain. So there is none over silence,
//           it dies with a note, and Depth turns it down with the sound.
//
// - The cycle starts full, at the top of Hold: a Breath put on a sound that
//   is playing begins as that sound, untouched, and lets go from there. From
//   then on it runs freely. Nothing in the sound restarts it, and it goes on
//   while the device is at rest: a note that arrives later lands wherever the
//   breath has got to. Vary makes each breath longer or shorter than set, by
//   up to half an octave of time either way, drawn afresh at the start of
//   every In from a seeded generator.
// - A change of a length changes the speed, never the place, so the times
//   need no smoothing. Depth, Colour, Width, Air, Ease and Mix glide (5 ms).
// - Rest and sleep. After kQuietSeconds without a sample of input everything
//   has rung out (the level follower is the slowest: under its floor in
//   1.2 s from the loudest input) and the device stops working: it writes
//   zeros and moves the cycle on by a block at a time. That moment is counted
//   in samples, not in blocks, and the first sound after it starts from a
//   known state (`arrive`: knobs where they are set, filters empty, the noise
//   reseeded), so the output is the same at every block size across a
//   silence. This is what kit::IdleGate does, with the count kept here
//   because the gate's own is taken per block.
// - Wet and dry are the same sound at another gain and tone, so Mix is a
//   linear crossfade. With Depth, Colour, Width and Air at 0, or Mix at 0,
//   the output is the input sample for sample.
// - The input is limited to ±16, and a sample that is not a number, or is
//   under 1e-30 (600 dB under full scale, on its way to a denormal), is
//   taken as silence, on the dry path too: nothing bad stays in the filters
//   and a sound dying away for ever does not cost eight times the work.
//
// Storage: three all-pass lines of 1,024 samples (6.1 ms at 96 kHz), a delay
// of 256 (1.3 ms at 96 kHz), two tables (513 and 257 floats) and the block
// buffers. Well under 1 MB.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Breath : public kit::DeviceBase<breath::kNumParams> {
 public:
  enum Stage : int { kStageIn = 0, kStageHold, kStageOut, kStageRest, kNumStages };

  // The colour filter: where it stands shut, and how many times higher it is
  // counted as open (see cutoff_hz).
  static constexpr float kClosedHz = 200.0f;
  static constexpr float kRange = 100.0f;
  // Two equal poles are 3 dB down together at 0.6436 of each one's corner.
  static constexpr float kPoleScale = 1.5537740f;
  // The spread: how much of the middle goes to the sides at full Width on a
  // full breath, the low cut and the delay in front of it, and its three
  // all-passes.
  static constexpr float kSpread = 0.2f;
  static constexpr float kSpreadLowHz = 200.0f;
  static constexpr float kSpreadDelaySeconds = 0.0013f;
  // After a rest the spread is fed over this long, so a sound that is
  // already playing when the device first hears it (a Breath put on a held
  // pad) does not arrive in the all-passes as an edge.
  static constexpr float kWakeSeconds = 0.01f;
  static constexpr int kNumAllpasses = 3;
  static constexpr float kAllpassSeconds[kNumAllpasses] = {0.0021f, 0.0037f, 0.0061f};
  static constexpr float kAllpassGain = 0.55f;
  // The air: its band, and its level against the input's at Air 1.
  static constexpr float kAirLowHz = 800.0f;
  static constexpr float kAirHighHz = 4500.0f;
  static constexpr float kAirQ = 0.9f;
  static constexpr float kAirGain = 1.25f;
  static constexpr float kAirAttackSeconds = 0.01f;
  static constexpr float kAirReleaseSeconds = 0.08f;
  // Under this the follower counts as silence: 100 dB under full scale.
  static constexpr float kAirFloor = 1.0e-5f;
  // Vary at 1: a breath is up to this many octaves of time longer or shorter.
  static constexpr float kVaryOctaves = 0.5f;
  static constexpr float kInputLimit = 16.0f;
  // Under this a sample is silence.
  static constexpr float kSilent = 1.0e-30f;
  static constexpr float kQuietSeconds = 4.0f;

  // The floor the level falls to when the breath is empty: (1 − Depth^1.5)².
  // The knob's lower half is the breaths one leaves on (2 dB at 0.25, 7.6 dB
  // at a half) and silence is its very end.
  static float floor_gain(float depth) {
    const float open = 1.0f - depth * std::sqrt(depth);
    return open * open;
  }

  // The way in at `t` (0..1): a straight line at Ease 0, half a cosine at 1.
  // Needs kit::SineTable::init() (init does it).
  static float rise(float t, float ease) {
    const float soft = 0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * t);
    return t + ease * (soft - t);
  }

  // How full the breath is at `t` through a part: 0 empty, 1 full.
  static float breath_at(int stage, float t, float ease) {
    switch (stage) {
      case kStageIn:
        return rise(t, ease);
      case kStageHold:
        return 1.0f;
      case kStageOut:
        return 1.0f - rise(t, ease);
      default:
        return 0.0f;
    }
  }

  // Where the colour filter is 3 dB down for a closing of 0..1 (Colour times
  // how empty the breath is), in Hz; infinite at 0, where it is a wire.
  static double cutoff_hz(double closing) {
    return static_cast<double>(kClosedHz) * (static_cast<double>(kRange) - 1.0) /
           (std::pow(static_cast<double>(kRange), closing) - 1.0);
  }

  void init(float sample_rate) {
    using namespace breath;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();

    // The poles' coefficient over the closing, and the air band's tuning
    // over the breath: worked out once so the sample loop only reads them.
    pole_[0] = 0.0f;
    for (int i = 1; i <= kPoleSteps; ++i) {
      const double corner = cutoff_hz(static_cast<double>(i) / kPoleSteps) * kPoleScale;
      const double a = std::exp(-2.0 * 3.14159265358979323846 * corner / sr);
      pole_[i] = a < 1.0e-12 ? 0.0f : static_cast<float>(a);
    }
    for (int i = 0; i <= kAirSteps; ++i) {
      const float hz =
          kAirLowHz * std::pow(kAirHighHz / kAirLowHz, static_cast<float>(i) / kAirSteps);
      air_g_[i] = std::tan(kit::kPi * kit::min(hz, 0.45f * sr) / sr);
    }
    for (int k = 0; k < kNumAllpasses; ++k) {
      allpass_delay_[k] = kit::clamp_int(static_cast<int>(kAllpassSeconds[k] * sr + 0.5f), 1,
                                         kAllpassSize - 1);
    }
    // White noise spreads over a wider band at a higher rate; this keeps its
    // level in the air's band where it is at 48 kHz.
    air_scale_ = kAirGain * std::sqrt(sr / 48000.0f);
    spread_delay_samples_ =
        kit::clamp_int(static_cast<int>(kSpreadDelaySeconds * sr + 0.5f), 1, kSpreadDelaySize - 1);
    spread_low_.set(kSpreadLowHz, kit::kSqrtHalf, sr);
    follower_.set(kAirAttackSeconds, kAirReleaseSeconds, sr);
    for (kit::Smoother* smoother : smoothers()) smoother->set_time(kSmoothingSeconds, sr);
    wake_.set_time(kWakeSeconds, sr);

    // Full: the first sample of Hold.
    stage_ = kStageHold;
    t_ = 0.0;
    pace_rng_.seed(0x6B8B4567u);
    draw_ = pace_rng_.bipolar();
    quiet_limit_ = static_cast<long>(kQuietSeconds * sr);
    quiet_ = quiet_limit_;
    for (int id = 0; id < kNumParams; ++id) apply(id);
    update_rates();
    arrive();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for a display to draw:
  // 0, where the breath is in its cycle as it is set (0 at the start of In,
  // 1 at the end of Rest, each part taking its share of the four lengths;
  // after init it stands at the end of In, where Hold begins);
  // 1, how much longer than set this breath is (1 with Vary at 0).
  float meter(int index) const {
    using namespace breath;
    if (index == 0) {
      const float seconds[kNumStages] = {param(kIn), param(kHold), param(kOut), param(kRest)};
      float before = 0.0f;
      for (int s = 0; s < stage_; ++s) before += seconds[s];
      const float total = seconds[0] + seconds[1] + seconds[2] + seconds[3];
      return (before + static_cast<float>(t_) * seconds[stage_]) / total;
    }
    if (index == 1) return pace_;
    return 0.0f;
  }

  void process(int frames) {
    using namespace breath;
    frames = begin_block(frames);
    if (quiet_ >= quiet_limit_ && !input_present(frames)) {
      // At rest: nothing to say, and the breath goes on.
      advance(static_cast<double>(frames));
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      in[0] = limit(in[0]);
      in[1] = limit(in[1]);
      if (in[0] != 0.0f || in[1] != 0.0f) {
        if (quiet_ >= quiet_limit_) arrive();
        quiet_ = 0;
      } else if (quiet_ < quiet_limit_) {
        ++quiet_;
      }

      // Where the breath is.
      const float t = static_cast<float>(t_);
      const bool moving = stage_ == kStageIn || stage_ == kStageOut;
      const float b = breath_at(stage_, t, ease_.next());

      // Width: the sides give way as the breath empties, the spread comes in
      // as it fills. What is added to one side is taken from the other.
      const float mid = 0.5f * (in[0] + in[1]);
      const float side = 0.5f * (in[0] - in[1]);
      float spread = spread_delay_.read(spread_delay_samples_);
      spread_delay_.write(spread_low_.highpass(mid * wake_.next()));
      for (int k = 0; k < kNumAllpasses; ++k) {
        spread = allpass_[k].process(spread, allpass_delay_[k], kAllpassGain);
      }
      const float lean = width_.next() * (b * kSpread * spread - (1.0f - b) * side);
      float wet[2] = {in[0] + lean, in[1] - lean};

      // Colour and level.
      const float a = pole_at(colour_.next() * (1.0f - b));
      const float floor = floor_.next();
      const float gain = floor + (1.0f - floor) * b;
      for (int c = 0; c < 2; ++c) {
        // What is kept is flushed, what is heard is not: with the poles at 0
        // the output is the input itself, down to its smallest sample.
        const float first = wet[c] + (low_[c][0] - wet[c]) * a;
        const float second = first + (low_[c][1] - first) * a;
        low_[c][0] = flush_denormal(first);
        low_[c][1] = flush_denormal(second);
        wet[c] = second * gain;
      }

      // Air.
      const float level = follower_.process(kit::max(std::fabs(in[0]), std::fabs(in[1])));
      const float air = air_.next();
      if (air > 0.0f || air_.target > 0.0f) {
        const float position = b * kAirSteps;
        const int index = kit::clamp_int(static_cast<int>(position), 0, kAirSteps - 1);
        const float g = kit::lerp(air_g_[index], air_g_[index + 1],
                                  position - static_cast<float>(index));
        const float a1 = 1.0f / (1.0f + g * (g + kAirK));
        const float a2 = g * a1;
        const float a3 = g * a2;
        // Half a sine over the part: nothing at its two ends, the most half way.
        const float flow = moving ? kit::SineTable::lookup(0.5f * t) : 0.0f;
        // As loud as the breathing sound: the input's level times the breath's gain.
        const float amount = level > kAirFloor ? air * flow * gain * level : 0.0f;
        for (int c = 0; c < 2; ++c) {
          kit::Svf& band = air_band_[c];
          band.g = g;
          band.k = kAirK;
          band.a1 = a1;
          band.a2 = a2;
          band.a3 = a3;
          wet[c] += amount * band.bandpass(noise_[c].bipolar());
        }
      }

      const float mix = mix_.next();
      out_left_[i] = in[0] + (wet[0] - in[0]) * mix;
      out_right_[i] = in[1] + (wet[1] - in[1]) * mix;

      t_ += inc_[stage_];
      if (t_ >= 1.0) roll();
    }
  }

 private:
  static constexpr int kPoleSteps = 512;
  static constexpr int kAirSteps = 256;
  static constexpr int kAllpassSize = 1024;
  static constexpr int kSpreadDelaySize = 256;
  static constexpr float kAirK = 1.0f / kAirQ;

  struct SmootherList {
    kit::Smoother* items[6];
    kit::Smoother** begin() { return items; }
    kit::Smoother** end() { return items + 6; }
  };
  SmootherList smoothers() { return {{&floor_, &colour_, &width_, &air_, &ease_, &mix_}}; }

  // A sample the filters can take: in range, and a number.
  static float limit(float x) {
    if (!(x == x)) return 0.0f;
    if (x > -kSilent && x < kSilent) return 0.0f;
    return x < -kInputLimit ? -kInputLimit : (x > kInputLimit ? kInputLimit : x);
  }

  // The poles' coefficient for a closing of 0..1, read between two entries.
  float pole_at(float closing) const {
    const float position = closing * kPoleSteps;
    const int index = kit::clamp_int(static_cast<int>(position), 0, kPoleSteps - 1);
    return kit::lerp(pole_[index], pole_[index + 1], position - static_cast<float>(index));
  }

  // The first sound after a rest: everything that ran on (or stood still)
  // through the silence starts from one known state. Nothing is sounding, so
  // nothing can click.
  void arrive() {
    for (kit::Smoother* smoother : smoothers()) smoother->snap(smoother->target);
    for (int c = 0; c < 2; ++c) {
      low_[c][0] = 0.0f;
      low_[c][1] = 0.0f;
      air_band_[c].reset();
    }
    for (kit::AllpassDelay<kAllpassSize>& stage : allpass_) stage.clear();
    spread_delay_.clear();
    spread_low_.reset();
    wake_.snap(0.0f);
    wake_.set_target(1.0f);
    follower_.reset();
    noise_[0].seed(0x1F123BB5u);
    noise_[1].seed(0x7A4D0C3Bu);
  }

  // How fast each part goes by, per sample, at this breath's pace. The
  // shortest part there is (a Hold or a Rest of 20 ms, at the quickest pace)
  // is hundreds of samples long at any rate a sound card runs at; the floor
  // of one sample only keeps the division safe.
  void update_rates() {
    using namespace breath;
    const float sr = sample_rate();
    pace_ = std::exp2(kVaryOctaves * param(kVary) * draw_);
    const float seconds[kNumStages] = {param(kIn), param(kHold), param(kOut), param(kRest)};
    for (int s = 0; s < kNumStages; ++s) {
      const double samples = static_cast<double>(seconds[s]) * pace_ * sr;
      inc_[s] = samples < 1.0 ? 1.0 : 1.0 / samples;
    }
  }

  // Move the cycle on by so many samples at once (at rest).
  void advance(double samples) {
    t_ += samples * inc_[stage_];
    if (t_ >= 1.0) roll();
  }

  // The part has ended: carry what is over into the next, drawing the next
  // breath's pace as In begins.
  void roll() {
    double over = (t_ - 1.0) / inc_[stage_];
    // In and Out are thousands of samples long, so a block at rest passes a
    // few parts at the most; the count is only a fence.
    for (int passed = 0; passed < 64; ++passed) {
      stage_ = (stage_ + 1) % kNumStages;
      if (stage_ == kStageIn) {
        draw_ = pace_rng_.bipolar();
        update_rates();
      }
      const double length = 1.0 / inc_[stage_];
      if (over < length) {
        t_ = over * inc_[stage_];
        return;
      }
      over -= length;
    }
    t_ = 0.0;
  }

  void apply(int id) {
    using namespace breath;
    const float value = param(id);
    switch (id) {
      case kIn:
      case kHold:
      case kOut:
      case kRest:
      case kVary:
        update_rates();
        break;
      case kDepth:
        floor_.set(floor_gain(value), primed());
        break;
      case kColour:
        colour_.set(value, primed());
        break;
      case kWidth:
        width_.set(value, primed());
        break;
      case kAir:
        air_.set(air_scale_ * value * value, primed());
        break;
      case kEase:
        ease_.set(value, primed());
        break;
      case kMix:
        mix_.set(value, primed());
        break;
      default:
        break;
    }
  }

  kit::AllpassDelay<kAllpassSize> allpass_[kNumAllpasses];
  kit::DelayLine<kSpreadDelaySize> spread_delay_;
  kit::Svf spread_low_;
  kit::Svf air_band_[2];
  kit::Follower follower_;
  kit::Rng noise_[2];
  kit::Rng pace_rng_;
  kit::Smoother floor_, colour_, width_, air_, ease_, mix_;
  // 0 at the first sound after a rest, then up to 1: what the spread is fed.
  kit::Smoother wake_;
  float pole_[kPoleSteps + 1] = {};
  float air_g_[kAirSteps + 1] = {};
  float low_[2][2] = {};
  int allpass_delay_[kNumAllpasses] = {1, 1, 1};
  int spread_delay_samples_ = 1;
  float air_scale_ = 1.0f;
  // The cycle: which part, how far through it, and how fast each part goes.
  int stage_ = kStageHold;
  double t_ = 0.0;
  double inc_[kNumStages] = {1.0, 1.0, 1.0, 1.0};
  float draw_ = 0.0f;
  float pace_ = 1.0f;
  // Samples since the last one that was not silence, up to the limit.
  long quiet_ = 0;
  long quiet_limit_ = 1;
};

}  // namespace livemix
