#pragma once

// Frequency Shifter: single-sideband modulation, per channel.
//
//   in ──(+)──► Hilbert ──► I ──× cos ──┐
//         ▲            └──► Q ──× sin ──(±)──► wet ──► mix ──► out
//         │                                    │
//         └── feedback ◄─ limit ◄─ tone ◄─ delay ◄┘
//
// - wet = I·cos + d·Q·sin (kit::Hilbert's quadrature output leads its
//   in-phase one). The direction d is +1 for the upper sideband, −1 for the
//   lower and 0 for both (ring modulation, made up by √2 so the two
//   half-height sidebands carry the power of one). Up, Down, Stereo and Ring
//   are four settings of d per channel, so switching mode glides through the
//   ring sound instead of jumping.
// - Every partial moves by the same number of hertz, so harmonic sounds turn
//   inharmonic. Shift + Fine + the LFO set the carrier frequency; the carrier
//   phase is integrated, so the frequency can move without a jump in phase.
//   The phases are doubles: at 0.01 Hz a float accumulator rounds the
//   increment away.
// - The feedback path shifts the signal again on every pass (540, 640,
//   740 Hz ... for a 440 Hz tone shifted by 100): with a few hertz and a short
//   delay that is the endlessly rising or falling comb of a barber pole.
// - Width turns the right carrier by up to a quarter cycle, which puts the
//   two outputs in quadrature at every frequency: wide, and the beating
//   against the dry signal travels between the sides.
// - LFO Depth is squared before it scales to ±50 Hz, so the lower half of
//   the control covers the sub-hertz to few-hertz range ambient use lives in.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class FreqShifter : public kit::DeviceBase<freq_shifter::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace freq_shifter;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int c = 0; c < 2; ++c) {
      hilbert_[c].reset();
      delay_[c].clear();
      tone_[c].reset();
      direction_[c].set_time(kGlideSeconds, sr);
    }
    carrier_phase_ = 0.0;
    lfo_phase_ = 0.0;
    shift_.set_time(kGlideSeconds, sr);
    delay_time_.set_time(kDelayLagSeconds, sr);
    feedback_.set_time(kSmoothingSeconds, sr);
    lfo_depth_.set_time(kSmoothingSeconds, sr);
    width_.set_time(kGlideSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    tone_clock_.reset(16);
    // The longest silent gap is the longest feedback delay.
    idle_.reset(sr, kParamMax[kDelay] * 0.001f + 0.2f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for a display to draw:
  // the shift as it is now, LFO included (Hz), and where the carrier is in
  // its cycle (0..1), which turns once for every beat against the dry sound.
  float meter(int index) const {
    switch (index) {
      case 0:
        return shift_.value +
               lfo_depth_.value * kLfoRangeHz * kit::SineTable::lookup(static_cast<float>(lfo_phase_));
      case 1:
        return static_cast<float>(carrier_phase_);
      default:
        return 0.0f;
    }
  }

  void process(int frames) {
    using namespace freq_shifter;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    const float sr = sample_rate();
    const double inverse_sr = 1.0 / static_cast<double>(sr);
    const float max_delay = kit::DelayLine<kDelaySize>::max_delay() - 4.0f;
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);

      if (tone_clock_.tick()) {
        for (int c = 0; c < 2; ++c) tone_[c].set(param(kTone), 0.6f, sr);
      }

      const float lfo = kit::SineTable::lookup(static_cast<float>(lfo_phase_));
      lfo_phase_ += static_cast<double>(param(kLfoRate)) * inverse_sr;
      if (lfo_phase_ >= 1.0) lfo_phase_ -= 1.0;

      const float hz = shift_.next() + lfo_depth_.next() * kLfoRangeHz * lfo;
      const float phase = static_cast<float>(carrier_phase_);
      carrier_phase_ += static_cast<double>(hz) * inverse_sr;
      carrier_phase_ -= std::floor(carrier_phase_);

      const float delay = kit::clamp(delay_time_.next(), 2.0f, max_delay);
      const float feedback = feedback_.next();
      const float offset = width_.next() * 0.25f;
      float dry_gain, wet_gain;
      kit::equal_power(mix_.next(), &dry_gain, &wet_gain);

      float out[2];
      for (int c = 0; c < 2; ++c) {
        const float carrier = c == 0 ? phase : phase + offset;
        const float cosine = kit::SineTable::cos_lookup(carrier);
        const float sine = kit::SineTable::lookup(carrier);
        // The limiter is exactly linear up to ±0.5, so it only acts when the
        // loop has built up.
        const float back = kit::soft_clip(tone_[c].lowpass(delay_[c].read_hermite(delay)));
        float driven = in[c] + feedback * back;
        // A NaN or runaway input must not lodge in the allpass states.
        if (!(driven > -64.0f && driven < 64.0f)) driven = 0.0f;
        float in_phase, quadrature;
        hilbert_[c].process(driven, &in_phase, &quadrature);
        const float d = direction_[c].next();
        const float makeup = 1.0f + (kit::kSqrtHalf * 2.0f - 1.0f) * (1.0f - d * d);
        const float wet = (in_phase * cosine + d * quadrature * sine) * makeup;
        delay_[c].write(flush_denormal(wet));
        out[c] = in[c] * dry_gain + wet * wet_gain;
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  // 500 ms at 96 kHz, rounded up.
  static constexpr int kDelaySize = 65536;
  static constexpr float kLfoRangeHz = 50.0f;
  // Shift, mode and width glide over 20 ms: long enough that a jump of
  // hundreds of hertz is a sweep, short enough to feel immediate.
  static constexpr float kGlideSeconds = 0.02f;
  // The feedback delay moves like a tape head, bending what is in the loop.
  static constexpr float kDelayLagSeconds = 0.08f;
  // Direction per mode and channel: +1 upper sideband, -1 lower, 0 both.
  static constexpr float kDirection[4][2] = {
      {1.0f, 1.0f},    // Up
      {-1.0f, -1.0f},  // Down
      {1.0f, -1.0f},   // Stereo
      {0.0f, 0.0f},    // Ring
  };

  void apply(int id) {
    using namespace freq_shifter;
    const float value = param(id);
    switch (id) {
      case kShift:
      case kFine:
        shift_.set(param(kShift) + param(kFine), primed());
        break;
      case kMode: {
        const int mode = kit::clamp_int(static_cast<int>(value + 0.5f), 0, 3);
        for (int c = 0; c < 2; ++c) direction_[c].set(kDirection[mode][c], primed());
        break;
      }
      case kFeedback:
        feedback_.set(value, primed());
        break;
      case kDelay:
        delay_time_.set(value * 0.001f * sample_rate(), primed());
        break;
      case kLfoDepth:
        lfo_depth_.set(value * value, primed());
        break;
      case kWidth:
        width_.set(value, primed());
        break;
      case kMix:
        mix_.set(value, primed());
        break;
      default:
        break;  // the LFO rate and the tone filter read their parameters directly
    }
  }

  kit::Hilbert hilbert_[2];
  kit::DelayLine<kDelaySize> delay_[2];
  kit::Svf tone_[2];
  kit::Smoother shift_, delay_time_, feedback_, lfo_depth_, width_, mix_;
  kit::Smoother direction_[2];
  double carrier_phase_ = 0.0;
  double lfo_phase_ = 0.0;
  kit::ControlClock tone_clock_;
  kit::IdleGate idle_;
};

}  // namespace livemix
