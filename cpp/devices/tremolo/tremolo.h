#pragma once

// Tremolo: one low-frequency oscillator, four things it can move.
//
//   rate ─(× drift)─► phase ─► shape ─► slew ─► m (left), m at +Stereo Phase (right)
//
//   Tremolo   in ─► × (1 − depth·(1 − m)/2)                       per channel
//   Pan       in ─► × √2·cos/sin of the pan angle depth·m          left against right
//   Harmonic  in ─┬─► low  ─► × (1 − depth·(1 − m)/2) ─┐
//                 └─► high ─► × (1 − depth·(1 + m)/2) ─┴─► sum    per channel
//   Vibrato   in ─► delay swung by m                               per channel
//
// - Tremolo only ever turns down: the peaks stay at unity and Depth sets how
//   far the troughs fall (1 is silence).
// - Pan is equal power, normalised to unity at the centre, so the summed
//   power does not move while the sides trade places. Stereo Phase has no
//   part in it: the two sides are opposite by definition.
// - Harmonic splits with one pole (high = in − low, so Depth 0 is the input
//   exactly) and moves the two bands in opposite phase. The level barely
//   changes; the tone rocks between dark and bright.
// - Vibrato's swing is sized so Depth 1 bends pitch by ±2 % (a third of a
//   semitone) at any rate above 1 Hz; below that the swing stops at 3 ms and
//   the bend gets gentler. The Hermite read needs one sample in hand, so this
//   mode alone delays by one sample plus the swing.
// - The slew is two poles and never less than 1 ms each, which is what keeps
//   Square (and a change of Shape) from clicking. Smooth lengthens it in
//   proportion to the period, so it rounds every rate alike.
// - Random is a new target each cycle joined by cosine segments.
// - Drift leans on the rate by up to ±25 % with a slow three-sine wander.
// - Modes crossfade over 20 ms. Wet and dry are the same signal at different
//   gains, so Mix is a linear crossfade: equal power would add 3 dB half way.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Tremolo : public kit::DeviceBase<tremolo::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace tremolo;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int c = 0; c < 2; ++c) {
      line_[c].clear();
      split_[c].reset();
      slew_a_[c] = 0.0f;
      slew_b_[c] = 0.0f;
    }
    depth_.set_time(kSmoothingSeconds, sr);
    offset_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    swing_.set_time(0.03f, sr);
    for (kit::Smoother& weight : weight_) weight.set_time(0.02f, sr);
    phase_ = 0.0;
    increment_ = 0.0;
    rng_.seed(0x7E3A11C5u);
    for (float& value : walk_) value = rng_.bipolar();
    wander_.seed(0x2C9277B5u);
    wander_.set_rate(kDriftHz, sr);
    crossover_ = param(kCrossover);
    slew_coeff_ = 0.0f;
    slew_seconds_ = 0.0f;
    started_ = false;
    clock_.reset(kControlPeriod);
    idle_.reset(sr, 0.1f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for a display to draw:
  // where the oscillator is in its cycle (0..1), and the modulator after the
  // slew as the left and the right side hear it (-1..1).
  float meter(int index) const {
    switch (index) {
      case 0:
        return static_cast<float>(phase_);
      case 1:
        return slew_b_[0];
      case 2:
        return slew_b_[1];
      default:
        return 0.0f;
    }
  }

  void process(int frames) {
    using namespace tremolo;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    const float sr = sample_rate();
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      if (clock_.tick()) control(sr);

      // The oscillator, once per channel.
      const float offset = offset_.next();
      const float raw[2] = {wave(static_cast<float>(phase_)),
                            wave(static_cast<float>(phase_) + offset)};
      phase_ += increment_;
      if (phase_ >= 1.0) {
        phase_ -= 1.0;
        walk_[0] = walk_[1];
        walk_[1] = walk_[2];
        walk_[2] = rng_.bipolar();
      }
      if (!started_) {
        for (int c = 0; c < 2; ++c) slew_a_[c] = slew_b_[c] = raw[c];
        started_ = true;
      }
      float m[2];
      for (int c = 0; c < 2; ++c) {
        slew_a_[c] = raw[c] + (slew_a_[c] - raw[c]) * slew_coeff_;
        slew_b_[c] = slew_a_[c] + (slew_b_[c] - slew_a_[c]) * slew_coeff_;
        m[c] = slew_b_[c];
      }

      const float depth = depth_.next();
      const float half = 0.5f * depth;
      const float w_tremolo = weight_[kModeTremolo].next();
      const float w_pan = weight_[kModePan].next();
      const float w_harmonic = weight_[kModeHarmonic].next();
      const float w_vibrato = weight_[kModeVibrato].next();
      const float swing = swing_.next() * sr;

      float pan[2] = {1.0f, 1.0f};
      if (w_pan > 0.0f) {
        const float angle = (depth * m[0] + 1.0f) * 0.125f;  // cycles: 0 left, 1/4 right
        pan[0] = 1.41421356f * kit::SineTable::cos_lookup(angle);
        pan[1] = 1.41421356f * kit::SineTable::lookup(angle);
      }

      float out[2];
      for (int c = 0; c < 2; ++c) {
        const float x = in[c];
        const float low = split_[c].lowpass(x);
        line_[c].write(x);
        const float down = 1.0f - half * (1.0f - m[c]);
        float wet = w_tremolo * x * down + w_pan * x * pan[c];
        if (w_harmonic > 0.0f) {
          wet += w_harmonic * (low * down + (x - low) * (1.0f - half * (1.0f + m[c])));
        }
        if (w_vibrato > 0.0f) {
          // Written first, so a read at 1 is the current sample.
          wet += w_vibrato * line_[c].read_hermite(2.0f + swing * (1.0f + m[c]));
        }
        out[c] = wet;
      }

      const float mix = mix_.next();
      out_left_[i] = in[0] + (out[0] - in[0]) * mix;
      out_right_[i] = in[1] + (out[1] - in[1]) * mix;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  enum Mode : int { kModeTremolo = 0, kModePan, kModeHarmonic, kModeVibrato, kNumModes };
  enum Shape : int { kSine = 0, kTriangle, kSquare, kRandom };

  static constexpr int kControlPeriod = 16;
  static constexpr float kDriftHz = 0.09f;
  static constexpr float kDriftAmount = 0.25f;
  static constexpr float kMinSlewSeconds = 0.001f;
  static constexpr float kSmoothPeriods = 0.08f;
  static constexpr float kVibratoBend = 0.02f;
  static constexpr float kVibratoMaxSeconds = 0.003f;

  // The shape at `phase` cycles, 0 <= phase < 1.5. Sine, Triangle and Square
  // all rise through zero at 0 and peak in the first half.
  float wave(float phase) const {
    const bool next_cycle = phase >= 1.0f;
    if (next_cycle) phase -= 1.0f;
    switch (shape_) {
      case kTriangle:
        return phase < 0.25f ? 4.0f * phase
                             : (phase < 0.75f ? 2.0f - 4.0f * phase : 4.0f * phase - 4.0f);
      case kSquare:
        return phase < 0.5f ? 1.0f : -1.0f;
      case kRandom: {
        const float from = walk_[next_cycle ? 1 : 0];
        const float to = walk_[next_cycle ? 2 : 1];
        return from + (to - from) * (0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * phase));
      }
      case kSine:
      default:
        return kit::SineTable::lookup(phase);
    }
  }

  // Every 16 samples: the drifting rate, the slew, the crossover, the swing.
  void control(float sr) {
    using namespace tremolo;
    const float rate = param(kRate);
    const float drifted =
        rate * (1.0f + kDriftAmount * param(kDrift) * wander_.next(kControlPeriod));
    increment_ = static_cast<double>(drifted) / sr;

    const float slew_seconds = kMinSlewSeconds + param(kSmooth) * kSmoothPeriods / rate;
    if (slew_seconds != slew_seconds_ || slew_coeff_ == 0.0f) {
      slew_seconds_ = slew_seconds;
      slew_coeff_ = kit::time_to_coeff(slew_seconds, sr);
    }

    const float target = param(kCrossover);
    if (crossover_ != target || !started_) {
      crossover_ += (target - crossover_) * 0.1f;
      if (std::fabs(crossover_ - target) < 0.01f || !started_) crossover_ = target;
      for (kit::OnePole& filter : split_) filter.set_cutoff(crossover_, sr);
    }

    const float seconds = kit::min(kVibratoMaxSeconds, kVibratoBend / (kit::kTwoPi * rate));
    swing_.set(param(kDepth) * seconds, started_);
  }

  void apply(int id) {
    using namespace tremolo;
    const float value = param(id);
    switch (id) {
      case kMode: {
        const int mode = kit::clamp_int(static_cast<int>(value + 0.5f), 0, kNumModes - 1);
        for (int k = 0; k < kNumModes; ++k) weight_[k].set(k == mode ? 1.0f : 0.0f, primed());
        break;
      }
      case kDepth:
        depth_.set(value, primed());
        break;
      case kShape:
        shape_ = kit::clamp_int(static_cast<int>(value + 0.5f), 0, 3);
        break;
      case kPhase:
        offset_.set(value * (1.0f / 360.0f), primed());
        break;
      case kMix:
        mix_.set(value, primed());
        break;
      default:
        break;  // Rate, Crossover, Drift and Smooth are read on the control clock
    }
  }

  kit::DelayLine<1024> line_[2];  // 2 × 3 ms at 96 kHz, and the interpolator's margin
  kit::OnePole split_[2];
  kit::Smoother depth_, offset_, mix_, swing_;
  kit::Smoother weight_[kNumModes];
  kit::Drift wander_;
  kit::Rng rng_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  double phase_ = 0.0;
  double increment_ = 0.0;
  float walk_[3] = {0.0f, 0.0f, 0.0f};
  float slew_a_[2] = {0.0f, 0.0f};
  float slew_b_[2] = {0.0f, 0.0f};
  float slew_coeff_ = 0.0f;
  float slew_seconds_ = 0.0f;
  float crossover_ = 700.0f;
  int shape_ = kSine;
  bool started_ = false;
};

}  // namespace livemix
