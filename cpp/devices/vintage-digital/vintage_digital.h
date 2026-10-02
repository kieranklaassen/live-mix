#pragma once

// Vintage Digital: the converter pair of an early sampler, as an insert. A
// sample rate reducer and bit crusher in which every artefact is one the
// converters themselves would make, and nothing is added by the way it is
// computed.
//
//   in ─► × drive ─► clip ─► input filter ─► sampler ─► quantiser ─► hold ─► output filter ─► make-up ─► mix ─► out
//                            (Aliasing takes   (Rate,     (Bits,       (the     (None, Soft,                ▲
//                             it away)          Jitter)    Companding)  stair)   Steep)                     │
//   in ─► delay (kLatency) ─────────────────────────────────────────────────────────────────────────────────┘
//
// - Clip: the input stage is exactly linear up to full scale, bends over the
//   next 1 dB and is flat above. What it takes off is averaged over the two
//   steps either side of each sample with its antiderivative, which keeps the
//   fold-back of a hard-driven tone 15 to 19 dB under a bare clip's, and
//   leaves a signal that never clips untouched. The make-up after the
//   converter holds a signal at -18 dBFS where it came in.
// - Input filter: a ninth-order elliptic low-pass with its edge at 0.44 of
//   Rate (band_split.h), split into the part below half the rate and the part
//   above. Aliasing is how much of the part above is let through (its square,
//   as a gain): at 0 a tone above half the rate is 80 dB down before it can
//   fold, at 1 there is no filtering at all and everything folds.
// - Sampler: a clock at Rate. On each tick the input is read at the tick's
//   own instant between host samples (a 32-point windowed sinc, kernels.h).
//   Jitter moves that instant at random, up to 0.12 of a period RMS, one
//   clock for both channels; the value is still held from where the clock
//   says, so the error is noise that grows with the signal's frequency.
// - Quantiser: mid-tread with a step of 2^(1 - Bits), any Bits from 4 to 16.
//   No dither and no noise floor: the grain follows the signal, and silence
//   in is exact silence out. Mu-law quantises log2(1 + 255|x|) / 8 instead,
//   which puts the steps close together near zero.
// - Hold: the value stands until the next tick. Each change of it is drawn
//   as a band-limited step (kernels.h), so the stair's images below the
//   host's Nyquist are there at the level sin(x)/x gives, and the ones above
//   it are removed instead of folding back as a hash that no converter makes.
//   The hold's own droop (3.9 dB at half the rate) is left in.
// - Output filter: None is the stair; Soft is two poles at half the rate;
//   Steep is the elliptic filter again. Both follow Rate.
// - Rate all the way up (the host rate, at most 48 kHz) switches the sampler
//   and hold out with a 30 ms cross-fade: quantiser, clip and make-up remain.
//   With 16 bits and no drive that is the input to the last bit of 16.
// - Timing: the clip takes 1 sample, the sampler's interpolation looks 16
//   ahead and the band-limited step 16 more. On top of that the filters and
//   the hold delay the low end by a few periods of Rate; the sampler reads
//   up to kPad samples less far back to make up for it, so the converted
//   signal's low end lands on the dry signal (down to about 1.5 kHz of Rate
//   at 48 kHz) and Mix is a blend without a comb. The device reports
//   kLatency samples and the dry path is delayed by them.
// - Mix is a linear cross-fade: the two stay coherent below the converter's
//   band.

#include "../../kit/kit.h"
#include "band_split.h"
#include "kernels.h"
#include "params.gen.h"

namespace livemix {

class VintageDigital : public kit::DeviceBase<vintage_digital::kNumParams> {
 public:
  // The sampler's look-ahead and the band-limited step's.
  static constexpr int kConverterDelay = 2 * vintage_digital_detail::Kernels::kHalf;
  // How much of the converted signal's own lateness can be made up.
  static constexpr int kPad = 96;
  // As reported in device.json (latencySamples).
  static constexpr int kLatency = 1 + kConverterDelay + kPad;

  void init(float sample_rate) {
    using namespace vintage_digital;
    Kernels::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    top_rate_ = kit::min(kParamMax[kRate], sr);
    for (int c = 0; c < 2; ++c) {
      input_filter_[c].reset();
      for (float& value : line_[c]) value = 0.0f;
      pre_[c].clear();
      dry_[c].clear();
      naive_[c].clear();
      held_[c] = 0.0f;
      last_in_[c] = 0.0f;
      last_integral_[c] = 0.0f;
      last_mean_[c] = 0.0f;
      for (float& value : pending_[c]) value = 0.0f;
    }
    jitter_rng_.seed(0x6A09E667u);
    gain_.set_time(kSmoothingSeconds, sr);
    jitter_.set_time(kSmoothingSeconds, sr);
    companding_.set_time(kSwitchSeconds, sr);
    // The alignment moves slowly: it is a read position, so a fast change
    // would be heard as a blip of pitch.
    pad_.set_time(kPadGlideSeconds, sr);
    started_ = false;
    tuned_rate_ = 0.0f;
    soft_.set_time(kSwitchSeconds, sr);
    steep_.set_time(kSwitchSeconds, sr);
    soft_.snap(0.0f);
    steep_.snap(0.0f);
    for (int c = 0; c < 2; ++c) {
      output_filter_[c].reset();
      soft_filter_[c].reset();
    }
    line_position_ = 0;
    pending_position_ = 0;
    phase_ = 0.0f;
    increment_ = 1.0f;
    log_rate_.set_time(kRateGlideSeconds, sr);
    bits_.set_time(kSmoothingSeconds, sr);
    stop_gain_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    bypass_.set_time(kSwitchSeconds, sr);
    clock_.reset(kControlPeriod);
    refresh_ = true;
    // The longest silent gap is the latency plus the input filter's ring.
    idle_.reset(sr, 0.25f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    const float sr = sample_rate();
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);

      if (!log_rate_.settled() || refresh_) {
        rate_ = std::exp2(log_rate_.next());
        increment_ = kit::min(1.0f, rate_ / sr);
      }
      if (!bits_.settled() || refresh_) {
        step_ = std::exp2(1.0f - bits_.next());
        inverse_step_ = 1.0f / step_;
      }
      if (clock_.tick()) {
        if (rate_ != tuned_rate_) {
          // The filters follow Rate. `edge_warp_` and `soft_warp_` are the
          // tangents the bilinear transform puts their corners at.
          tuned_rate_ = rate_;
          edge_warp_ = std::tan(kit::kPi * kit::min(kEdgeRatio * rate_, 0.47f * sr) / sr);
          soft_warp_ = std::tan(kit::kPi * kit::min(kSoftRatio * rate_, 0.49f * sr) / sr);
          for (int c = 0; c < 2; ++c) {
            input_filter_[c].set_warp(edge_warp_);
            output_filter_[c].set_warp(edge_warp_);
            soft_filter_[c].set(kSoftRatio * rate_, kit::kSqrtHalf, sr);
          }
        }
        // How late the converted signal's low end is on its own, in samples:
        // the input filter, half a period of hold, and the output filter (a
        // two-pole Butterworth is late by sqrt(2) over its corner). The
        // sampler reads that much less far back, so it meets the dry signal.
        const float own = BandSplit::low_delay(stop_gain_.value) * 0.5f / edge_warp_ + 0.5f / increment_ +
                          steep_.value * BandSplit::low_delay(0.0f) * 0.5f / edge_warp_ +
                          soft_.value * 0.70710678f / soft_warp_;
        const float reach = 3.5f * jitter_.value * kJitterPeriods / increment_;
        pad_.set(kit::max(reach, static_cast<float>(kPad) - own), started_);
        started_ = true;
      }
      pad_.next();
      if (!gain_.settled() || refresh_) {
        // The make-up holds a signal at the reference level where it came in.
        const float g = gain_.next();
        make_up_ = std::sqrt((1.0f + kReference * kReference * g * g) /
                             (1.0f + kReference * kReference)) / g;
      }
      refresh_ = false;
      const float gain = gain_.value;
      const float jitter = jitter_.settled() ? jitter_.value : jitter_.next();
      const float stop_gain = stop_gain_.settled() ? stop_gain_.value : stop_gain_.next();
      const float bypass = bypass_.next();
      const float mix = mix_.settled() ? mix_.value : mix_.next();
      const float soft = soft_.next();
      const float steep = steep_.next();
      companding_.next();

      // The converter clock. A tick lands `behind` of a sample before this one.
      phase_ += increment_;
      if (phase_ >= 1.0f) {
        phase_ -= 1.0f;
        const float behind = kit::clamp(phase_ / increment_, 0.0f, 1.0f);
        // Where to read: the tick's instant, earlier by the alignment pad,
        // moved by the jitter (the pad is never less than the jitter's
        // reach, so the read never asks for a sample that has not arrived).
        const float deviation = jitter * kJitterPeriods / increment_;
        const float late = kit::max(0.0f, behind + pad_.value + deviation * jitter_rng_.gaussian());
        const int whole = static_cast<int>(late);
        // The kTaps samples that end 1 + whole back, oldest first. Both
        // channels in one pass, the table read between its rows as it goes.
        const int start = (line_position_ - 1 - whole - (Kernels::kTaps - 1)) & kLineMask;
        const float* left = &line_[0][start];
        const float* right = &line_[1][start];
        float t;
        const float* row = Kernels::sinc_row(late - static_cast<float>(whole), &t);
        float value[2] = {0.0f, 0.0f};
        for (int k = 0; k < Kernels::kTaps; ++k) {
          const float weight = row[k] + (row[k + Kernels::kTaps] - row[k]) * t;
          value[0] += weight * left[k];
          value[1] += weight * right[k];
        }
        const float jump[2] = {quantise(value[0]) - held_[0], quantise(value[1]) - held_[1]};
        if (jump[0] != 0.0f || jump[1] != 0.0f) {
          held_[0] += jump[0];
          held_[1] += jump[1];
          // The stair's corrections for the outputs to come.
          row = Kernels::step_row(behind, &t);
          float* pending_left = &pending_[0][pending_position_];
          float* pending_right = &pending_[1][pending_position_];
          for (int k = 0; k < Kernels::kTaps; ++k) {
            const float weight = row[k] + (row[k + Kernels::kTaps] - row[k]) * t;
            pending_left[k] += jump[0] * weight;
            pending_right[k] += jump[1] * weight;
          }
        }
      }

      float out[2];
      for (int c = 0; c < 2; ++c) {
        const float pre = clip(c, in[c] * gain);
        // Written twice, a buffer length apart, so every window is contiguous.
        const float filtered = input_filter_[c].filter(pre, stop_gain);
        line_[c][line_position_] = filtered;
        line_[c][line_position_ + kLineSize] = filtered;

        float wet = naive_[c].read(Kernels::kHalf) + pending_[c][pending_position_];
        naive_[c].write(held_[c]);

        // The filter after the converter. None is the stair itself.
        if (soft > 0.0f || steep > 0.0f) {
          float shaped = wet * (1.0f - soft - steep);
          if (soft > 0.0f) shaped += soft * soft_filter_[c].lowpass(wet);
          if (steep > 0.0f) shaped += steep * output_filter_[c].filter(wet, 0.0f);
          wet = shaped;
        }

        // Rate at the top: the resampling is switched out, the rest stays.
        const float direct = pre_[c].read(kConverterDelay + kPad);
        pre_[c].write(pre);
        if (bypass > 0.0f) wet += (quantise(direct) - wet) * bypass;

        const float dry = dry_[c].read(kLatency);
        dry_[c].write(in[c]);
        out[c] = dry + (wet * make_up_ - dry) * mix;
      }
      line_position_ = (line_position_ + 1) & kLineMask;
      if (++pending_position_ == Kernels::kTaps) {
        // Slide what is still to come back to the front.
        for (int c = 0; c < 2; ++c) {
          for (int k = 0; k < Kernels::kTaps; ++k) {
            pending_[c][k] = pending_[c][k + Kernels::kTaps];
            pending_[c][k + Kernels::kTaps] = 0.0f;
          }
        }
        pending_position_ = 0;
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  typedef vintage_digital_detail::Kernels Kernels;
  typedef vintage_digital_detail::BandSplit BandSplit;

  static constexpr int kControlPeriod = 16;
  // Room for the interpolation window behind the furthest read: the pad (or
  // the jitter's reach if that is more) plus 3.5 deviations of jitter, 137
  // samples at most.
  static constexpr int kLineSize = 256;
  static constexpr int kLineMask = kLineSize - 1;
  static constexpr float kRateGlideSeconds = 0.03f;
  static constexpr float kSwitchSeconds = 0.03f;
  static constexpr float kPadGlideSeconds = 0.08f;
  // The filters' passband ends at 0.44 of the converter's rate, so their
  // stopband starts at 0.553 and what folds lands above 0.447.
  static constexpr float kEdgeRatio = 0.44f;
  // The Soft output filter: two poles at half the converter's rate.
  static constexpr float kSoftRatio = 0.5f;
  // Jitter at 1: the sampling instant is off by 0.12 of the converter's
  // period (RMS). The knob is squared.
  static constexpr float kJitterPeriods = 0.12f;
  // Drive's make-up holds a signal at this level (-18 dBFS) where it was.
  static constexpr float kReference = 0.125f;
  static constexpr float kMu = 255.0f;

  // The converter's input stage runs out of range just above full scale: it
  // is exactly linear up to ±1, bends over the next 2 * kKnee and is flat at
  // ±(1 + kKnee). Only what the clip takes off (the residual, zero inside
  // ±1) is anti-aliased, with its antiderivative, so a signal that never
  // clips passes untouched.
  static constexpr float kKnee = 0.06f;
  // The converter's own range ends a little above that: what overshoots the
  // input stage (the input filter rings on a clipped wave) is cut off flat at
  // the sampler, as a converter does.
  static constexpr float kCodeLimit = 1.125f;

  static float residual(float u) {
    const float a = u < 0.0f ? -u : u;
    if (a <= 1.0f) return 0.0f;
    const float over = a - 1.0f;
    const float r = over < 2.0f * kKnee ? over * over * (0.25f / kKnee) : over - kKnee;
    return u < 0.0f ? -r : r;
  }
  static float residual_integral(float u) {
    const float a = u < 0.0f ? -u : u;
    if (a <= 1.0f) return 0.0f;
    const float over = a - 1.0f;
    if (over < 2.0f * kKnee) return over * over * over * (1.0f / (12.0f * kKnee));
    const float past = over - kKnee;
    return (2.0f / 3.0f) * kKnee * kKnee + 0.5f * (past * past - kKnee * kKnee);
  }

  // One sample in, the sample before it out, clipped. What the clip takes
  // off over the step up to this sample and over the step before it are
  // averaged (a triangle across the output's own instant), so the correction
  // lines up with the sample it is taken from.
  float clip(int c, float u) {
    const float last = last_in_[c];
    const float last_integral = last_integral_[c];
    const float last_mean = last_mean_[c];
    last_in_[c] = u;
    if (u >= -1.0f && u <= 1.0f && last >= -1.0f && last <= 1.0f) {
      last_integral_[c] = 0.0f;
      last_mean_[c] = 0.0f;
      return last - 0.5f * last_mean;
    }
    const float integral = residual_integral(u);
    const float span = u - last;
    const float mean = (span > 1.0e-4f || span < -1.0e-4f) ? (integral - last_integral) / span
                                                          : residual(0.5f * (u + last));
    last_integral_[c] = integral;
    last_mean_[c] = mean;
    return last - 0.5f * (mean + last_mean);
  }

  // Mid-tread, so silence stays exact silence. Mu-law squeezes the level
  // through log(1 + 255|x|) first and stretches it back after, which spaces
  // the steps finely near zero and coarsely near full scale.
  float quantise_linear(float x) const { return step_ * std::floor(x * inverse_step_ + 0.5f); }
  float quantise_mu(float x) const {
    const float a = x < 0.0f ? -x : x;
    // 1 + mu is 256, so the squeezed level is log2(1 + 255 a) / 8.
    const float squeezed = Kernels::log2_from_one(1.0f + kMu * a) * 0.125f;
    const float code = step_ * std::floor(squeezed * inverse_step_ + 0.5f);
    const float back = (Kernels::exp2_small(code * 8.0f) - 1.0f) * (1.0f / kMu);
    return x < 0.0f ? -back : back;
  }
  float quantise(float x) const {
    x = kit::clamp(x, -kCodeLimit, kCodeLimit);
    if (companding_.value <= 0.0f) return quantise_linear(x);
    if (companding_.value >= 1.0f) return quantise_mu(x);
    return kit::lerp(quantise_linear(x), quantise_mu(x), companding_.value);
  }

  void apply(int id) {
    using namespace vintage_digital;
    const float value = param(id);
    switch (id) {
      case kRate: {
        const float rate = kit::min(value, top_rate_);
        log_rate_.set(std::log2(rate), primed());
        bypass_.set(value >= top_rate_ ? 1.0f : 0.0f, primed());
        refresh_ = true;
        break;
      }
      case kBits:
        bits_.set(value, primed());
        refresh_ = true;
        break;
      case kAliasing:
        stop_gain_.set(value * value, primed());
        break;
      case kFilter: {
        const int choice = kit::clamp_int(static_cast<int>(value + 0.5f), 0, 2);
        // A filter that is being brought in starts from rest.
        if (choice == 1 && soft_.value == 0.0f) {
          for (kit::Svf& filter : soft_filter_) filter.reset();
        }
        if (choice == 2 && steep_.value == 0.0f) {
          for (BandSplit& filter : output_filter_) filter.reset();
        }
        soft_.set(choice == 1 ? 1.0f : 0.0f, primed());
        steep_.set(choice == 2 ? 1.0f : 0.0f, primed());
        break;
      }
      case kCompanding:
        companding_.set(value >= 0.5f ? 1.0f : 0.0f, primed());
        break;
      case kJitter:
        jitter_.set(value * value, primed());
        break;
      case kDrive:
        gain_.set(kit::db_to_gain(value), primed());
        refresh_ = true;
        break;
      case kMix:
        mix_.set(value, primed());
        break;
      default:
        break;
    }
  }

  BandSplit input_filter_[2];
  float line_[2][2 * kLineSize] = {};  // the filtered input the sampler reads
  kit::DelayLine<256> pre_[2];    // the unfiltered input, for Rate at the top
  kit::DelayLine<256> dry_[2];
  kit::DelayLine<32> naive_[2];  // the bare stair, waiting for its corrections
  float pending_[2][2 * Kernels::kTaps] = {};  // corrections for outputs to come
  float held_[2] = {0.0f, 0.0f};
  int line_position_ = 0;
  int pending_position_ = 0;
  float phase_ = 0.0f;
  float increment_ = 1.0f;
  float rate_ = 16000.0f;
  float top_rate_ = 48000.0f;
  float step_ = 1.0f;
  float inverse_step_ = 1.0f;
  bool refresh_ = true;
  float make_up_ = 1.0f;
  float last_in_[2] = {0.0f, 0.0f};
  float last_integral_[2] = {0.0f, 0.0f};
  float last_mean_[2] = {0.0f, 0.0f};
  kit::Rng jitter_rng_;
  kit::Smoother log_rate_, bits_, stop_gain_, mix_, gain_, jitter_, pad_;
  bool started_ = false;
  float tuned_rate_ = 0.0f;
  float edge_warp_ = 1.0f;
  float soft_warp_ = 1.0f;
  kit::LinearRamp bypass_, companding_, soft_, steep_;
  BandSplit output_filter_[2];
  kit::Svf soft_filter_[2];
  kit::ControlClock clock_;
  kit::IdleGate idle_;
};

}  // namespace livemix
