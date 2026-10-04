#pragma once

// Auto Filter: a resonant multimode filter whose cutoff follows the input's
// level and a free-running LFO.
//
//          |in| ─► envelope follower ─┐       LFO ─┐
//                                     ▼            ▼
//                     cutoff = Cutoff · 2^(5·Env·envelope + 3·LFO·lfo)   (octaves)
//                                     │
//   in ─┬─► × Drive ─► up 2x ─► SVF (─► SVF for 24 dB) ─► down 2x ─► ÷ √Drive ─┐
//       │                       tanh on the states when driven                 ├─► out
//       └─► delay 31 ───────────────────────────────────────────── dry ─► Mix ─┘
//
// Ported from kkfonie's Tatami FilterDevice; the filter stage (SvfTptTone.h)
// is the original.
//
// - The filter runs at twice the sample rate (kit::Halfband2x), so the cutoff
//   reaches 20 kHz without warping and the state saturation does not alias.
//   That costs 31 samples, which the dry path is delayed by.
// - 24 dB is two stages at √Q each, which keeps the gain at the cutoff at Q
//   for both slopes.
// - Drive pushes the input up and saturates the integrators (fully from
//   +3 dB), then gives half of the gain back in dB; that saturation is also
//   what caps the resonance when it is driven.
// - Type and Slope crossfade over 10 ms: every type is a weighting of the
//   stage's low, band and high outputs, and the second stage fades in.
// - Asleep, the envelope keeps decaying and the LFO keeps turning on paper:
//   waking applies the time that passed, so the sweep is where it would be.
// - Mix is a linear crossfade: wet and dry are time-aligned and correlated,
//   so equal power would add 3 dB at the middle.

#include "../../kit/kit.h"
#include "SvfTptTone.h"
#include "params.gen.h"

namespace livemix {

class AutoFilter : public kit::DeviceBase<auto_filter::kNumParams> {
 public:
  // What the manifest reports as latencySamples.
  static constexpr int kLatency = kit::Halfband2x::kLatency;

  enum LfoShape : int { kSine = 0, kTriangle, kSawUp, kSawDown, kSquare, kSampleHold, kNumLfoShapes };

  // The LFO at `phase` in [0, 1); `held` is the value Sample & Hold drew for
  // this cycle. Needs kit::SineTable::init() (init does it).
  static float lfo_value(int shape, float phase, float held) {
    switch (shape) {
      case kTriangle:
        return 1.0f - 4.0f * std::fabs(phase - 0.5f);
      case kSawUp:
        return 2.0f * phase - 1.0f;
      case kSawDown:
        return 1.0f - 2.0f * phase;
      case kSquare:
        return phase < 0.5f ? 1.0f : -1.0f;
      case kSampleHold:
        return held;
      default:
        return kit::SineTable::lookup(phase);
    }
  }

  void init(float sample_rate) {
    using namespace auto_filter;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    oversampled_rate_ = 2.0 * sr;
    max_cutoff_ = kit::min(kMaxCutoffHz, 0.45f * 2.0f * sr);
    for (kit::LinearRamp* ramp : value_ramps()) ramp->set_time(kSmoothingSeconds, sr);
    for (kit::LinearRamp* ramp : switch_ramps()) ramp->set_time(kSwitchSeconds, sr);
    for (int c = 0; c < 2; ++c) {
      oversampler_[c].init();
      dry_[c].clear();
      stage1_[c].reset();
      stage2_[c].reset();
    }
    envelope_ = 0.0f;
    lfo_phase_ = 0.0;
    lfo_held_ = 0.0f;
    random_.seed(0x7a7au);
    slept_ = 0.0;
    clock_.reset(64);
    // The longest silent gap is the latency, under a millisecond.
    idle_.reset(sr, 0.05f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    wake_up();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The reading named by meters[0] in device.json, for a display to draw: the
  // cutoff the filter stands at, in Hz, after the envelope and the LFO have
  // moved it. Awake it is what the coefficients were last made from. Asleep,
  // and before the first block, it is where waking would put it: the knobs
  // where they are set, the envelope run down and the LFO turned on by the
  // time slept (see wake_up).
  float meter(int index) const {
    using namespace auto_filter;
    if (index != 0) return 0.0f;
    float pitch = last_pitch_;
    if (slept_ > 0.0 || pitch == kUnset) {
      float envelope = envelope_;
      if (slept_ > 0.0) {
        envelope *= static_cast<float>(std::exp(slept_ * std::log1p(-static_cast<double>(release_coeff_))));
      }
      const double phase = lfo_phase_ + static_cast<double>(lfo_rate_.target) * slept_ / sample_rate();
      const int shape = kit::clamp_int(static_cast<int>(param(kLfoShape) + 0.5f), 0, kNumLfoShapes - 1);
      const float lfo = lfo_value(shape, static_cast<float>(phase - std::floor(phase)), lfo_held_);
      pitch = cutoff_log2_.target + env_amount_.target * 0.01f * kEnvOctaves * kit::min(1.0f, envelope) +
              lfo_amount_.target * 0.01f * kLfoOctaves * lfo;
    }
    return kit::clamp(std::exp2(pitch), kMinCutoffHz, max_cutoff_);
  }

  void process(int frames) {
    using namespace auto_filter;
    frames = begin_block(frames);
    const bool was_asleep = idle_.asleep();
    if (!idle_.wake(input_present(frames))) {
      slept_ += frames;
      silence_output(frames);
      return;
    }
    // Nothing is sounding, so whatever changed while asleep applies at once.
    if (was_asleep) wake_up();

    const float sr = sample_rate();
    const int shape = kit::clamp_int(static_cast<int>(param(kLfoShape) + 0.5f), 0, kNumLfoShapes - 1);
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);

      // Envelope follower on the louder channel, before Drive.
      const float attack_ms = attack_ms_.next();
      if (attack_ms != last_attack_ms_) {
        last_attack_ms_ = attack_ms;
        attack_coeff_ = 1.0f - std::exp(-1000.0f / (attack_ms * sr));
      }
      const float release_ms = release_ms_.next();
      if (release_ms != last_release_ms_) {
        last_release_ms_ = release_ms;
        release_coeff_ = 1.0f - std::exp(-1000.0f / (release_ms * sr));
      }
      const float level = kit::max(std::fabs(in[0]), std::fabs(in[1]));
      envelope_ = flush_denormal(envelope_ +
                                 (level > envelope_ ? attack_coeff_ : release_coeff_) * (level - envelope_));

      const float lfo = lfo_value(shape, static_cast<float>(lfo_phase_), lfo_held_);
      lfo_phase_ += lfo_rate_.next() / sr;
      if (lfo_phase_ >= 1.0) {
        lfo_phase_ -= std::floor(lfo_phase_);
        lfo_held_ = random_.bipolar();
      }

      const float octaves = env_amount_.next() * 0.01f * kEnvOctaves * kit::min(1.0f, envelope_) +
                            lfo_amount_.next() * 0.01f * kLfoOctaves * lfo;
      const float pitch = cutoff_log2_.next() + octaves;
      const float q_log2 = resonance_log2_.next();
      const float slope = slope_.next();
      if (q_log2 != last_q_log2_ || slope != last_slope_) {
        if (slope == 0.0f) {
          stage2_[0].reset();
          stage2_[1].reset();
        }
        last_q_log2_ = q_log2;
        last_slope_ = slope;
        stage_q_ = std::exp2(q_log2 * (1.0f - 0.5f * slope));
        last_pitch_ = kUnset;
      }
      if (pitch != last_pitch_) {
        last_pitch_ = pitch;
        const float cutoff = kit::clamp(std::exp2(pitch), kMinCutoffHz, max_cutoff_);
        coeffs_ = tatami::dsp::SvfToneCoeffs::make(cutoff, stage_q_, oversampled_rate_);
      }

      const float drive_db = drive_db_.next();
      if (drive_db != last_drive_db_) set_drive(drive_db);
      const float wet = mix_.next();
      const float weights[3] = {low_.next(), band_.next() * coeffs_.k, high_.next()};

      float out[2];
      for (int c = 0; c < 2; ++c) {
        const float dry = dry_[c].read(kLatency);
        dry_[c].write(in[c]);
        float a, b;
        oversampler_[c].up(in[c] * drive_gain_, &a, &b);
        a = filter(c, a, weights, slope);
        b = filter(c, b, weights, slope);
        const float y = oversampler_[c].down(a, b) * makeup_;
        out[c] = dry + (y - dry) * wet;
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];

      if (clock_.tick()) sanitize();
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr float kMinCutoffHz = 20.0f;
  static constexpr float kMaxCutoffHz = 20000.0f;
  static constexpr float kEnvOctaves = 5.0f;
  static constexpr float kLfoOctaves = 3.0f;
  static constexpr float kDriveFullAmountDb = 3.0f;
  static constexpr float kSwitchSeconds = 0.010f;
  static constexpr float kUnset = -1.0e30f;
  // Low, band (times k) and high weights of each Type: lowpass, highpass,
  // bandpass (0 dB at the peak), notch (low + high = in − k·band) and peak
  // (low − high, 2Q at the cutoff).
  static constexpr float kTypeWeights[5][3] = {
      {1.0f, 0.0f, 0.0f}, {0.0f, 0.0f, 1.0f}, {0.0f, 1.0f, 0.0f}, {1.0f, 0.0f, 1.0f}, {1.0f, 0.0f, -1.0f},
  };

  struct RampList {
    kit::LinearRamp* items[9];
    int count;
    kit::LinearRamp** begin() { return items; }
    kit::LinearRamp** end() { return items + count; }
  };
  RampList value_ramps() {
    return {{&cutoff_log2_, &resonance_log2_, &drive_db_, &env_amount_, &attack_ms_, &release_ms_, &lfo_amount_,
             &lfo_rate_, &mix_},
            9};
  }
  RampList switch_ramps() { return {{&low_, &band_, &high_, &slope_}, 4}; }

  void apply(int id) {
    using namespace auto_filter;
    const float value = param(id);
    switch (id) {
      case kType: {
        const int type = kit::clamp_int(static_cast<int>(value + 0.5f), 0, 4);
        low_.set(kTypeWeights[type][0], primed());
        band_.set(kTypeWeights[type][1], primed());
        high_.set(kTypeWeights[type][2], primed());
        break;
      }
      case kSlope:
        slope_.set(value >= 0.5f ? 1.0f : 0.0f, primed());
        break;
      case kCutoffHz:
        cutoff_log2_.set(std::log2(value), primed());
        break;
      case kResonance:
        resonance_log2_.set(std::log2(value), primed());
        break;
      case kDriveDb:
        drive_db_.set(value, primed());
        break;
      case kEnvAmount:
        env_amount_.set(value, primed());
        break;
      case kEnvAttackMs:
        attack_ms_.set(value, primed());
        break;
      case kEnvReleaseMs:
        release_ms_.set(value, primed());
        break;
      case kLfoAmount:
        lfo_amount_.set(value, primed());
        break;
      case kLfoRateHz:
        lfo_rate_.set(value, primed());
        break;
      case kMix:
        mix_.set(value, primed());
        break;
      default:
        break;  // the LFO shape is read in process()
    }
  }

  // Account for the time spent asleep, then jump to the current targets.
  // Only called when the signal path is empty (init, waking).
  void wake_up() {
    if (slept_ > 0.0) {
      // The envelope released the whole time, by the per-sample step it was
      // taking when the device nodded off; the LFO kept turning.
      envelope_ = flush_denormal(
          envelope_ * static_cast<float>(std::exp(slept_ * std::log1p(-static_cast<double>(release_coeff_)))));
      const double phase = lfo_phase_ + static_cast<double>(lfo_rate_.value) * slept_ / sample_rate();
      if (phase >= 1.0) lfo_held_ = random_.bipolar();
      lfo_phase_ = phase - std::floor(phase);
      slept_ = 0.0;
    }
    for (kit::LinearRamp* ramp : value_ramps()) ramp->snap(ramp->target);
    for (kit::LinearRamp* ramp : switch_ramps()) ramp->snap(ramp->target);
    last_attack_ms_ = kUnset;
    last_release_ms_ = kUnset;
    last_q_log2_ = kUnset;
    last_slope_ = kUnset;
    last_pitch_ = kUnset;
    set_drive(drive_db_.value);
  }

  void set_drive(float db) {
    last_drive_db_ = db;
    drive_gain_ = kit::db_to_gain(db);
    drive_amount_ = kit::min(1.0f, db / kDriveFullAmountDb);
    makeup_ = 1.0f / std::sqrt(drive_gain_);
  }

  // One sample at the 2x rate through one or two stages.
  float filter(int c, float x, const float* weights, float slope) {
    tatami::dsp::SvfOutputs o = stage1_[c].process(x, coeffs_);
    float y = weights[0] * o.low + weights[1] * o.band + weights[2] * o.high;
    if (drive_amount_ > 0.0f) stage1_[c].saturateStates(drive_amount_);
    if (slope > 0.0f) {
      o = stage2_[c].process(y, coeffs_);
      const float second = weights[0] * o.low + weights[1] * o.band + weights[2] * o.high;
      if (drive_amount_ > 0.0f) stage2_[c].saturateStates(drive_amount_);
      y += (second - y) * slope;
    }
    return y;
  }

  // A state or envelope that went non-finite (bad input) restarts.
  void sanitize() {
    for (int c = 0; c < 2; ++c) {
      stage1_[c].sanitize();
      stage2_[c].sanitize();
    }
    if (!(envelope_ < 1.0e6f)) envelope_ = 0.0f;
  }

  kit::Halfband2x oversampler_[2];
  kit::DelayLine<32> dry_[2];
  tatami::dsp::SvfTptTone stage1_[2];
  tatami::dsp::SvfTptTone stage2_[2];
  tatami::dsp::SvfToneCoeffs coeffs_;
  kit::LinearRamp cutoff_log2_, resonance_log2_, drive_db_, env_amount_, attack_ms_, release_ms_, lfo_amount_,
      lfo_rate_, mix_;
  kit::LinearRamp low_, band_, high_, slope_;
  kit::Rng random_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  double oversampled_rate_ = 96000.0;
  double lfo_phase_ = 0.0;
  double slept_ = 0.0;
  float max_cutoff_ = 20000.0f;
  float envelope_ = 0.0f;
  float lfo_held_ = 0.0f;
  float attack_coeff_ = 1.0f;
  float release_coeff_ = 1.0f;
  float stage_q_ = 0.7071f;
  float drive_gain_ = 1.0f;
  float drive_amount_ = 0.0f;
  float makeup_ = 1.0f;
  float last_attack_ms_ = kUnset;
  float last_release_ms_ = kUnset;
  float last_q_log2_ = kUnset;
  float last_slope_ = kUnset;
  float last_pitch_ = kUnset;
  float last_drive_db_ = kUnset;
};

}  // namespace livemix
