#pragma once

// Phaser: 4 to 12 first-order allpass stages per channel, swept around a
// centre frequency by a free-running LFO and mixed with the dry signal.
// Ported from kkfonie Tatami (Source/Devices/Effects/PhaserDevice).
//
//   in ──(+)──► allpass 1 ──► allpass 2 ──► … ──► allpass N ──┬──► wet ──┐
//         ▲                                                   │          ├─ mix ─► out
//         └────── soft limit ◄── feedback (±) ◄── z⁻¹ ◄───────┘     in ──┘
//
//   sweep     = Centre · 2^(lfo · Depth · 2.5)          (Depth 100 % is 5 octaves)
//   stage s   = sweep · 2^(Spread · position),  position −1 … +1 across the stages
//   right LFO = left LFO read Stereo degrees ahead
//
// - The allpass chain only turns phase; the notches appear in the sum with
//   the dry signal, N / 2 of them, so the mix is a linear crossfade and 50 %
//   is where they are deepest.
// - Positive feedback lifts the bands where the chain is in phase (the lows,
//   the highs and between the notches); negative feedback lifts the notch
//   frequencies instead and flattens the nulls into peaks.
// - Stage frequencies are retuned every 4 samples on a control clock, as in
//   the source; the stage count, Centre, Spread and Depth are read there.
// - The LFO passes through a 3 ms lag so Saw, Square and Random steps and a
//   Shape change do not jump the filters.
// - Changing Stages crossfades to a second, freshly cleared chain over 20 ms
//   rather than cutting stages in or out of a ringing cascade.
// - The recirculated signal is linear up to 0 dBFS and lands on ±2 above it.

#include "../../kit/kit.h"
#include "mod_lfo.h"
#include "params.gen.h"
#include "phaser_stage.h"

namespace livemix {

class Phaser : public kit::DeviceBase<phaser::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace phaser;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (Chain& chain : chains_) chain.reset();
    active_ = 0;
    fade_remaining_ = 0;
    fade_length_ = static_cast<int>(kStageFadeSeconds * sr);
    if (fade_length_ < 1) fade_length_ = 1;
    // Read on the control clock, so their time constant is counted in ticks.
    const float control_rate = sr / static_cast<float>(kControlInterval);
    center_.set_time(kSmoothingSeconds, control_rate);
    spread_.set_time(kSmoothingSeconds, control_rate);
    depth_.set_time(kSmoothingSeconds, control_rate);
    stereo_.set_time(kSmoothingSeconds, control_rate);
    lag_ = 1.0f - kit::time_to_coeff(kLfoLagSeconds, control_rate);
    feedback_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    sweep_[0] = sweep_[1] = 0.0f;
    sweep_hz_[0] = sweep_hz_[1] = kParamDefault[kCenterHz];
    stage_spread_ = 0.0f;
    lfo_.reset();
    clock_.reset(kControlInterval);
    // Nothing in here delays the signal; the hold only has to outlast a block.
    idle_.reset(sr, 0.05f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for a display to draw:
  // where the LFO is in its cycle (0..1), and the frequency the left and the
  // right side's stages are swept to now, in Hz. Worked out from the lagged
  // LFO as `retune` does, so it is right while the device sleeps too.
  float meter(int index) const {
    switch (index) {
      case 0:
        return lfo_.phase();
      case 1:
        return swept_hz(0);
      case 2:
        return swept_hz(1);
      default:
        return 0.0f;
    }
  }

  void process(int frames) {
    using namespace phaser;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      // Free-running: the sweep keeps its place in the cycle while asleep,
      // and the first sample after waking retunes the stages.
      lfo_.advance(frames);
      snap_sweep();
      clock_.reset(kControlInterval);
      silence_output(frames);
      return;
    }
    float wet_peak = 0.0f;
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);

      lfo_.advance();
      if (clock_.tick()) retune();
      if (fade_remaining_ == 0 && chains_[active_].count != stages_) begin_stage_fade();

      const float feedback = feedback_.next();
      const float mix = mix_.next();

      float wet[2];
      chains_[active_].process(in, feedback, wet);
      if (fade_remaining_ > 0) {
        float incoming[2];
        chains_[1 - active_].process(in, feedback, incoming);
        const float t =
            1.0f - static_cast<float>(fade_remaining_) / static_cast<float>(fade_length_);
        wet[0] = kit::lerp(wet[0], incoming[0], t);
        wet[1] = kit::lerp(wet[1], incoming[1], t);
        if (--fade_remaining_ == 0) active_ = 1 - active_;
      }

      out_left_[i] = in[0] + (wet[0] - in[0]) * mix;
      out_right_[i] = in[1] + (wet[1] - in[1]) * mix;
      const float left = wet[0] < 0.0f ? -wet[0] : wet[0];
      const float right = wet[1] < 0.0f ? -wet[1] : wet[1];
      if (left > wet_peak) wet_peak = left;
      if (right > wet_peak) wet_peak = right;
    }
    // The wet path counts too: at Mix 0 the loop still rings out of earshot.
    idle_.settle(kit::max(output_peak(frames), wet_peak), frames);
  }

 private:
  static constexpr int kMaxStages = 12;
  static constexpr float kSweepOctaves = 2.5f;
  static constexpr int kControlInterval = 4;
  static constexpr float kLfoLagSeconds = 0.003f;
  static constexpr float kStageFadeSeconds = 0.02f;

  // Linear up to ±1, a smooth knee to ±2.
  static float loop_limit(float x) { return 2.0f * kit::soft_clip(0.5f * x); }

  // One complete phaser: both channels' stages and their feedback samples.
  struct Chain {
    phaser::PhaserStage stages[2][kMaxStages];
    float last_out[2] = {0.0f, 0.0f};
    int count = 4;

    void reset() {
      for (int c = 0; c < 2; ++c) {
        for (phaser::PhaserStage& stage : stages[c]) stage.reset();
        last_out[c] = 0.0f;
      }
    }

    // Stage s of `count` sits at frequency · 2^(spread · position), position
    // running from −1 to +1: `lowest` is frequency · 2^(−spread) and `step`
    // the ratio from one stage to the next.
    void tune(int channel, float lowest, float step, float sample_rate) {
      float hz = lowest;
      for (int s = 0; s < count; ++s) {
        stages[channel][s].a = phaser::allpass_coefficient(hz, sample_rate);
        hz *= step;
      }
    }

    void process(const float* in, float feedback, float* wet) {
      for (int c = 0; c < 2; ++c) {
        float x = in[c] + loop_limit(last_out[c] * feedback);
        for (int s = 0; s < count; ++s) x = stages[c][s].process(x);
        last_out[c] = x;
        wet[c] = x;
      }
    }
  };

  // Control-rate work: where the sweep is now, and every stage's coefficient.
  void retune() {
    const float center = center_.next();
    const float depth = depth_.next();
    stage_spread_ = spread_.next();
    sweep_[0] += (lfo_.value() - sweep_[0]) * lag_;
    sweep_[1] += (lfo_.value(stereo_.next()) - sweep_[1]) * lag_;
    for (int c = 0; c < 2; ++c) {
      sweep_hz_[c] = center * std::exp2(sweep_[c] * depth * kSweepOctaves);
    }
    tune_chain(chains_[active_]);
    if (fade_remaining_ > 0) tune_chain(chains_[1 - active_]);
  }

  void tune_chain(Chain& chain) {
    const float lowest = std::exp2(-stage_spread_);
    const float step = std::exp2(2.0f * stage_spread_ / static_cast<float>(chain.count - 1));
    for (int c = 0; c < 2; ++c) chain.tune(c, sweep_hz_[c] * lowest, step, sample_rate());
  }

  float swept_hz(int channel) const {
    return center_.value * std::exp2(sweep_[channel] * depth_.value * kSweepOctaves);
  }

  // Put the lagged LFO on the LFO itself (nothing is sounding).
  void snap_sweep() {
    sweep_[0] = lfo_.value();
    sweep_[1] = lfo_.value(stereo_.target);
  }

  void begin_stage_fade() {
    Chain& incoming = chains_[1 - active_];
    incoming.reset();
    incoming.count = stages_;
    tune_chain(incoming);
    fade_remaining_ = fade_length_;
  }

  void apply(int id) {
    using namespace phaser;
    const bool ramp = primed() && !idle_.asleep();
    switch (id) {
      case kStages:
        stages_ = 4 + 2 * kit::clamp_int(static_cast<int>(param(kStages) + 0.5f), 0, 4);
        // Nothing is sounding: no need to fade.
        if (!ramp && fade_remaining_ == 0) {
          chains_[active_].reset();
          chains_[active_].count = stages_;
        }
        break;
      case kCenterHz:
        center_.set(param(kCenterHz), ramp);
        break;
      case kSpread:
        spread_.set(param(kSpread) * 0.01f, ramp);
        break;
      case kFeedback:
        feedback_.set(param(kFeedback) * 0.01f, ramp);
        break;
      case kRate:
        lfo_.set_rate(param(kRate), sample_rate());
        break;
      case kDepth:
        depth_.set(param(kDepth) * 0.01f, ramp);
        break;
      case kShape:
        lfo_.set_shape(static_cast<int>(param(kShape) + 0.5f));
        if (!ramp) snap_sweep();
        break;
      case kStereo:
        stereo_.set(param(kStereo) * (1.0f / 360.0f), ramp);
        if (!ramp) snap_sweep();
        break;
      case kMix:
        mix_.set(param(kMix), ramp);
        break;
      default:
        break;
    }
  }

  Chain chains_[2];
  phaser::ModLfo lfo_;
  kit::Smoother center_, spread_, depth_, stereo_, feedback_, mix_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  int stages_ = 6;
  int active_ = 0;
  int fade_remaining_ = 0;
  int fade_length_ = 1;
  float sweep_[2] = {0.0f, 0.0f};
  float sweep_hz_[2] = {800.0f, 800.0f};
  float stage_spread_ = 0.0f;
  float lag_ = 1.0f;
};

}  // namespace livemix
