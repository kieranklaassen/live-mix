#pragma once

// Flanger: a 0.5 to 10 ms delay swept by a free-running LFO and mixed with
// the dry signal, so a comb of notches slides up and down the spectrum.
// Ported from kkfonie Tatami (Source/Devices/Effects/FlangerDevice).
//
//   in ──(+)──► delay line ──► swept read (Hermite) ──┬──► wet ──┐
//         ▲                                           │          ├─ mix ─► out
//         └── soft limit ◄── feedback (±) ◄── z⁻¹ ◄───┘     in ──┘
//
//   read point = Delay + lfo · Depth · 0.95 · Delay   (never reaches zero)
//   right LFO  = left LFO read Stereo degrees ahead
//
// - Notches sit at odd multiples of 1 / (2 · delay) in the dry/wet sum, so the
//   mix is a linear crossfade: 50 % is where they are deepest.
// - Positive feedback raises peaks at multiples of 1 / delay; negative
//   feedback moves them onto the odd half multiples, the hollow sound.
// - The LFO passes through a 3 ms lag before it moves the read point: Saw,
//   Square and Random would otherwise jump the delay and click.
// - The recirculated signal is exactly linear up to 0 dBFS and lands on
//   ±2 above it, which bounds the 26 dB resonance of 95 % feedback.

#include "../../kit/kit.h"
#include "mod_lfo.h"
#include "params.gen.h"

namespace livemix {

class Flanger : public kit::DeviceBase<flanger::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace flanger;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int c = 0; c < 2; ++c) {
      line_[c].clear();
      last_wet_[c] = 0.0f;
      sweep_[c] = 0.0f;
    }
    delay_.set_time(kGlideSeconds, sr);
    deviation_.set_time(kGlideSeconds, sr);
    feedback_.set_time(kSmoothingSeconds, sr);
    stereo_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    lag_ = 1.0f - kit::time_to_coeff(kLfoLagSeconds, sr);
    lfo_.reset();
    // The longest silent gap is the longest read point, 19.5 ms.
    idle_.reset(sr, 0.1f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for a display to draw:
  // where the LFO is in its cycle (0..1), and the delay the left and the
  // right side are read at now, in milliseconds.
  float meter(int index) const {
    switch (index) {
      case 0:
        return lfo_.phase();
      case 1:
        return read_ms(0);
      case 2:
        return read_ms(1);
      default:
        return 0.0f;
    }
  }

  void process(int frames) {
    using namespace flanger;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      // Free-running: the sweep keeps its place in the cycle while asleep.
      lfo_.advance(frames);
      snap_sweep();
      silence_output(frames);
      return;
    }
    const float max_delay = kit::DelayLine<kLineSize>::max_delay();
    float wet_peak = 0.0f;
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);

      const float base = delay_.next();
      const float deviation = deviation_.next();
      const float feedback = feedback_.next();
      const float mix = mix_.next();

      lfo_.advance();
      sweep_[0] += (lfo_.value() - sweep_[0]) * lag_;
      sweep_[1] += (lfo_.value(stereo_.next()) - sweep_[1]) * lag_;

      float out[2];
      for (int c = 0; c < 2; ++c) {
        // Two samples is the shortest read the interpolator can make.
        const float delay = kit::clamp(base + sweep_[c] * deviation, 2.0f, max_delay);
        const float wet = line_[c].read_hermite(delay);
        line_[c].write(flush_denormal(in[c] + loop_limit(last_wet_[c] * feedback)));
        last_wet_[c] = wet;
        out[c] = in[c] + (wet - in[c]) * mix;
        const float magnitude = wet < 0.0f ? -wet : wet;
        if (magnitude > wet_peak) wet_peak = magnitude;
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];
    }
    // The wet path counts too: at Mix 0 the loop still rings out of earshot.
    idle_.settle(kit::max(output_peak(frames), wet_peak), frames);
  }

 private:
  // 2 × 10 ms at 96 kHz.
  static constexpr int kLineSize = 2048;
  // Depth is the peak deviation as a share of the delay.
  static constexpr float kDepthScale = 0.95f;
  // Delay and Depth move the read point, so they glide rather than ramp in
  // 5 ms: a knob turn bends the pitch instead of zipping.
  static constexpr float kGlideSeconds = 0.05f;
  static constexpr float kLfoLagSeconds = 0.003f;

  // Linear up to ±1, a smooth knee to ±2.
  static float loop_limit(float x) { return 2.0f * kit::soft_clip(0.5f * x); }

  // The read point of one side as `process` computes it, in milliseconds.
  float read_ms(int channel) const {
    const float delay = kit::clamp(delay_.value + sweep_[channel] * deviation_.value, 2.0f,
                                   kit::DelayLine<kLineSize>::max_delay());
    return 1000.0f * delay / sample_rate();
  }

  // Put the lagged LFO on the LFO itself (nothing is sounding).
  void snap_sweep() {
    sweep_[0] = lfo_.value();
    sweep_[1] = lfo_.value(stereo_.target);
  }

  void apply(int id) {
    using namespace flanger;
    const bool ramp = primed() && !idle_.asleep();
    const float samples_per_ms = 0.001f * sample_rate();
    switch (id) {
      case kDelayMs:
      case kDepth: {
        const float delay = param(kDelayMs) * samples_per_ms;
        delay_.set(delay, ramp);
        deviation_.set(param(kDepth) * 0.01f * kDepthScale * delay, ramp);
        break;
      }
      case kRate:
        lfo_.set_rate(param(kRate), sample_rate());
        break;
      case kFeedback:
        feedback_.set(param(kFeedback) * 0.01f, ramp);
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

  kit::DelayLine<kLineSize> line_[2];
  flanger::ModLfo lfo_;
  kit::Smoother delay_, deviation_, feedback_, stereo_, mix_;
  kit::IdleGate idle_;
  float last_wet_[2] = {0.0f, 0.0f};
  float sweep_[2] = {0.0f, 0.0f};
  float lag_ = 1.0f;
};

}  // namespace livemix
