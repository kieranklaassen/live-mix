#pragma once

// Analog Delay: a companded bucket-brigade delay, one line per channel.
//
//   in ─(+)─► low-pass ─► compress 2:1 ─► line (saturates, hisses) ─► low-pass
//        ▲                                                               │
//        └──── feedback ◄──── low cut ◄──── expand 1:2 ◄─────────────────┘──► wet

#include "../../kit/kit.h"
#include "bbd_line.h"
#include "compander.h"
#include "params.gen.h"

namespace livemix {

class AnalogDelay : public kit::DeviceBase<analog_delay::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace analog_delay;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int c = 0; c < 2; ++c) {
      Channel& ch = channel_[c];
      ch.line.reset(kNoiseSeed);
      for (kit::Svf& f : ch.in_filter) f.reset();
      for (kit::Svf& f : ch.out_filter) f.reset();
      ch.compressor.reset();
      ch.expander.reset();
      ch.low_cut.reset();
      ch.low_cut.set_cutoff(kLowCutHz, sr);
      ch.wet = 0.0f;
    }
    clock_.set_time(kClockLagSeconds, sr);
    feedback_.set_time(kSmoothingSeconds, sr);
    depth_.set_time(kSmoothingSeconds, sr);
    age_.set_time(kSmoothingSeconds, sr);
    spread_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    lfo_phase_ = 0.0f;
    drift_[0].seed(0x3C6EF372u);
    drift_[1].seed(0xA54FF53Au);
    drift_[0].set_rate(kDriftHz, sr);
    drift_[1].set_rate(kDriftHz * 1.13f, sr);
    activity_.reset();
    activity_.set(0.001f, 0.2f, sr);
    control_clock_.reset(kControlPeriod);
    // The longest silent gap is the longest delay an octave down.
    idle_.reset(sr, 2.0f * kParamMax[kTime] * 0.001f + 0.6f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    using namespace analog_delay;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    const float sr = sample_rate();
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);

      const float clock = clock_.next();
      if (control_clock_.tick()) update_control(clock);

      const float depth = depth_.next();
      const float spread = spread_.next();
      const float age = age_.next();
      const float feedback = feedback_.next();
      const float headroom = 1.0f - kHeadroomLoss * age;

      lfo_phase_ += lfo_increment_;
      if (lfo_phase_ >= 1.0f) lfo_phase_ -= 1.0f;
      const float drift_left = drift_[0].next();
      const float drift_right = kit::lerp(drift_left, drift_[1].next(), spread);
      const float wobble = kMaxClockDeviation * depth * depth;
      const float wander = kDriftShare * wobble + kDriftFloor * spread;
      float ticks[2];
      ticks[0] = clock * (1.0f + wobble * kit::SineTable::lookup(lfo_phase_) + wander * drift_left);
      ticks[1] = clock * (1.0f + wobble * kit::SineTable::lookup(lfo_phase_ + 0.5f * spread) +
                          wander * drift_right);

      const float cross = kCrossFeed * spread;
      const float back[2] = {kit::lerp(channel_[0].wet, channel_[1].wet, cross),
                             kit::lerp(channel_[1].wet, channel_[0].wet, cross)};
      const float level = activity_.process(kit::max(std::fabs(in[0] + feedback * back[0]),
                                                     std::fabs(in[1] + feedback * back[1])));
      const float gate = kit::clamp((level - kGateFloor) * kGateSlope, 0.0f, 1.0f);
      const float noise = noise_level_ * gate;

      float dry_gain, wet_gain;
      kit::equal_power(mix_.next(), &dry_gain, &wet_gain);
      for (int c = 0; c < 2; ++c) {
        Channel& ch = channel_[c];
        float x = in[c] + feedback * back[c];
        x = ch.in_filter[1].lowpass(ch.in_filter[0].lowpass(x));
        x = ch.compressor.process(x);
        float y = ch.line.process(x, ticks[c], headroom, noise);
        y = ch.out_filter[1].lowpass(ch.out_filter[0].lowpass(y));
        y = ch.expander.process(y, 1.0f);
        y = ch.low_cut.highpass(y);
        // Linear to ±1, never past ±2: only a runaway loop reaches the knee.
        ch.wet = flush_denormal(2.0f * kit::soft_clip(0.5f * y));
      }
      out_left_[i] = in[0] * dry_gain + channel_[0].wet * wet_gain;
      out_right_[i] = in[1] * dry_gain + channel_[1].wet * wet_gain;
    }
    (void)sr;
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr uint32_t kNoiseSeed = 0x6A09E667u;
  static constexpr int kControlPeriod = 16;
  // The clock oscillator follows the Time knob with this lag.
  static constexpr float kClockLagSeconds = 0.05f;
  // Corner of the filters as a share of the clock rate, when Tone is above it.
  static constexpr float kClockShare = 0.42f;
  static constexpr float kLowCutHz = 55.0f;
  // Mod Depth 1 moves the clock by this share either way.
  static constexpr float kMaxClockDeviation = 0.035f;
  static constexpr float kDriftHz = 0.23f;
  static constexpr float kDriftShare = 0.3f;
  static constexpr float kDriftFloor = 0.0012f;
  static constexpr float kCrossFeed = 0.25f;
  static constexpr float kHeadroomLoss = 0.6f;
  // The line's hiss is switched off under -100 dBFS so the device can sleep.
  static constexpr float kGateFloor = 1.0e-5f;
  static constexpr float kGateSlope = 1.0e4f;
  // Butterworth, fourth order, as two sections.
  static constexpr float kSectionQ[2] = {0.5411961f, 1.3065630f};

  struct Channel {
    analog_delay::BbdLine line;
    kit::Svf in_filter[2];
    kit::Svf out_filter[2];
    analog_delay::Compressor compressor;
    analog_delay::Expander expander;
    kit::OnePole low_cut;
    float wet = 0.0f;
  };

  // Control-rate work: the filters follow Tone and the clock.
  void update_control(float clock) {
    using namespace analog_delay;
    const float sr = sample_rate();
    const float corner = kit::min(param(kTone), kClockShare * clock * sr);
    const float age = age_.value;
    for (int c = 0; c < 2; ++c) {
      Channel& ch = channel_[c];
      for (int s = 0; s < 2; ++s) {
        ch.in_filter[s].set(corner, kSectionQ[s], sr);
        ch.out_filter[s].set(corner, kSectionQ[s], sr);
      }
      ch.compressor.rectifier.set_time(0.015f * (1.0f - 0.4f * age), sr);
      ch.expander.rectifier.set_time(0.015f * (1.0f + age), sr);
    }
    noise_level_ = 0.0003f + 0.006f * age * age;
  }

  // Clock ticks per host sample that give a delay of `seconds` end to end.
  float ticks_for(float seconds) const {
    using namespace analog_delay;
    const float sr = sample_rate();
    const float corner =
        kit::min(param(kTone), kClockShare * static_cast<float>(BbdLine::kSamples) / seconds);
    // What the rest of the path adds: two fourth-order low-passes and the
    // half sample of the box integral.
    const float extra = 2.0f * 2.6131f / (kit::kTwoPi * corner) + 0.5f / sr;
    const float line = kit::max(seconds - extra, 0.25f * seconds);
    return (static_cast<float>(BbdLine::kSamples) + 0.5f) / (line * sr);
  }

  void apply(int id) {
    using namespace analog_delay;
    const float value = param(id);
    switch (id) {
      case kTime:
      case kTone:
        clock_.set(ticks_for(param(kTime) * 0.001f), primed());
        break;
      case kFeedback:
        feedback_.set(value, primed());
        break;
      case kModDepth:
        depth_.set(value, primed());
        break;
      case kModRate:
        lfo_increment_ = value / sample_rate();
        break;
      case kAge:
        age_.set(value, primed());
        break;
      case kSpread:
        spread_.set(value, primed());
        break;
      case kMix:
        mix_.set(value, primed());
        break;
      default:
        break;
    }
  }

  Channel channel_[2];
  kit::Smoother clock_, feedback_, depth_, age_, spread_, mix_;
  kit::Drift drift_[2];
  kit::Follower activity_;
  kit::ControlClock control_clock_;
  kit::IdleGate idle_;
  float lfo_phase_ = 0.0f;
  float lfo_increment_ = 0.0f;
  float noise_level_ = 0.0f;
};

}  // namespace livemix
