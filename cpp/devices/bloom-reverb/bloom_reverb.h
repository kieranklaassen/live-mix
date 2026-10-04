#pragma once

// Bloom: a reverb whose tail changes pitch as it ages. kkfonie's Bloom plugin
// (Bloom/Source/PluginProcessor.cpp) rebuilt on the kit around the two DSP
// classes live-mix already carries unchanged, SpectralDrifter and
// StereoWidener.
//
//   in ─► mono ─► 4 diffusers ─►(+)─► damping ─► DC block ─► 8 modulated lines ─┐
//                                ▲                                              │
//                                ├───────────── × g ◄─── Hadamard ◄─────────────┤
//                                │                                              │
//                                └── × Bloom × 0.25 ◄─┬─ drifter L ◄─ even lines ┤
//                                                     └─ drifter R ◄─ odd lines ─┘
//                                                          │  (driven by the lines' age)
//                                                          ▼
//   out = widener(dry · cos(mix) + wet · 0.35 · sin(mix)),  wet = the two drifters
//
// - The wet signal is only ever the drifters' output: even with Bloom at 0
//   the tail is read through eight reversed, Hann-windowed 6144-sample grains
//   at unison, a tanh and two low-passes. That smear is the instrument. A
//   new grain starts every 768 samples, so a steady tone only comes through
//   where (1 + ratio) x its frequency meets a multiple of rate / 768: held
//   sines are combed, moving material is not.
// - Each line counts how long it has carried signal above -80 dB; the mean
//   age of the even (odd) lines over twice the Decay time drives the left
//   (right) drifter, so the shift ratio creeps from unison towards the chosen
//   interval while a sound rings. A quarter of the drifted signal, times
//   Bloom, goes back into the lines, so what recirculates is shifted again:
//   the tail climbs (or falls) by the interval per trip. The loop cannot run
//   away: the network's own gain is below one and the drifter ends in a tanh.
// - g is the RT60 law 0.001^(mean line length / Decay), approached with a
//   23 ms one-pole. The lines are read with a first-order Thiran allpass, each
//   swept ±0.4 ms by its own LFO (0.1 to 0.275 Hz).
// - The four input diffusers are the source's: out = delayed - k·in. That is
//   a Schroeder allpass without its (1 - k²) factor, so each stage is a
//   resonant comb (about +10 dB on its peaks) rather than flat. It is kept:
//   it is the colour and the drive level of the original, and the 0.35 wet
//   headroom exists because of it.
// - Width works on the whole output, dry included, as in the source. The
//   widener leaves the band under its 200 Hz crossover as wide as it came in
//   when Width is 0, so on its own "0 = mono" holds only for the highs (the
//   tail keeps a side signal 9 to 14 dB under the mid). Below a quarter of
//   the travel the remaining side is therefore faded out here, and Width 0 is
//   exactly mono; from 0.25 up the output is the widener's alone.
//
// Sample rate. The source counts several things in samples (LFO depth, the
// damping, DC and feedback-smoothing poles); here they are read as their
// 44.1 kHz values and converted to time, so 48 kHz sounds like 44.1 kHz. The
// drifter's grain length and smoothing are sample counts inside the shared
// class, so above 64 kHz the whole reverb core runs at half the host rate
// behind a halfband pair (the wet path is band-limited to a few kHz by the
// drifter anyway): 96 kHz then sounds like 48 kHz. The dry path is never
// resampled or delayed.

#include "../../kit/kit.h"
#include "../spectral-drifter/SpectralDrifter.h"
#include "../stereo-widener/StereoWidener.h"
#include "params.gen.h"

namespace livemix {

class BloomReverb : public kit::DeviceBase<bloom_reverb::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace bloom_reverb;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    half_rate_ = sr > kHalfRateAbove;
    core_rate_ = half_rate_ ? 0.5f * sr : sr;
    const float scale = core_rate_ / kReferenceRate;

    const float mod_depth = kModDepthSamples * scale;
    float total = 0.0f;
    for (int ch = 0; ch < kLines; ++ch) {
      line_[ch].clear();
      const int longest = kLineSize - static_cast<int>(mod_depth) - 4;
      const int shortest = static_cast<int>(mod_depth) + 4;
      const int length =
          kit::clamp_int(static_cast<int>(static_cast<float>(kLineDelays[ch]) * scale), shortest, longest);
      base_delay_[ch] = static_cast<float>(length);
      total += base_delay_[ch];
      // Golden-ratio phase spacing, 0.1 to 0.275 Hz.
      const double phase = 2.0 * 3.14159265358979323846 * static_cast<double>(ch) * 0.618033988749895;
      const double hz = 0.1 + static_cast<double>(ch) * 0.025;
      lfo_sin_[ch] = mod_depth * static_cast<float>(std::sin(phase));
      lfo_cos_[ch] = mod_depth * static_cast<float>(std::cos(phase));
      lfo_step_[ch] = static_cast<float>(2.0 * std::sin(3.14159265358979323846 * hz / core_rate_));
      interp_[ch] = 0.0f;
      damp_[ch] = 0.0f;
      dc_x_[ch] = 0.0f;
      dc_y_[ch] = 0.0f;
      age_[ch] = 0.0f;
    }
    mean_delay_seconds_ = total / static_cast<float>(kLines) / core_rate_;
    for (int a = 0; a < kDiffusers; ++a) {
      diffuser_[a].clear();
      diffuser_delay_[a] = kit::clamp_int(
          static_cast<int>(static_cast<float>(kDiffuserDelays[a]) * scale), 1, kDiffuserSize - 1);
    }

    // Per-sample constants of the source, held at their 44.1 kHz time.
    const float per_sample = kReferenceRate / core_rate_;
    damping_ = std::pow(kDamping, per_sample);
    dc_pole_ = std::pow(kDcPole, per_sample);
    feedback_pole_ = std::pow(kFeedbackPole, per_sample);
    age_decay_ = std::pow(kAgeDecay, per_sample);
    age_step_ = 1.0f / core_rate_;

    for (SpectralDrifter& drifter : drifter_) drifter.prepare(static_cast<double>(core_rate_));
    widener_.prepare(static_cast<double>(sr));
    decimator_.init();
    for (kit::Halfband2x& interpolator : interpolator_) interpolator.init();
    odd_frame_ = false;
    held_input_ = 0.0f;
    pending_[0] = pending_[1] = 0.0f;
    activity_ = 0.0f;

    bloom_.set_time(kSmoothingSeconds, core_rate_);
    mix_.set_time(kSmoothingSeconds, sr);
    width_.set_time(kSmoothingSeconds, sr);
    applied_width_ = -1.0f;
    applied_mix_ = -1.0f;
    mono_fold_ = 1.0f;
    // Longer than the longest gap between input and its first echo: the
    // longest line (0.18 s) plus a grain's reach back in time (0.42 s).
    idle_.reset(sr, 1.0f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for a display to draw: how
  // long the left side has been ringing, as a share of the longest age that
  // is counted (twice Decay), and how far its grains are shifted now (0..1).
  // Both stand still while the device sleeps.
  float meter(int index) const {
    switch (index) {
      case 0:
        return kit::min(0.25f * (age_[0] + age_[2] + age_[4] + age_[6]) / max_age_, 1.0f);
      case 1:
        return drifter_[0].getCurrentDrift();
      default:
        return 0.0f;
    }
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    activity_ = 0.0f;
    for (int i = 0; i < frames; ++i) {
      float in_left, in_right;
      take_input(i, &in_left, &in_right);
      const float mono = 0.5f * (in_left + in_right);

      float wet[2];
      if (!half_rate_) {
        core(mono, wet);
      } else if (odd_frame_) {
        float drifted[2];
        core(decimator_.down(held_input_, mono), drifted);
        interpolator_[0].up(drifted[0], &wet[0], &pending_[0]);
        interpolator_[1].up(drifted[1], &wet[1], &pending_[1]);
        odd_frame_ = false;
      } else {
        held_input_ = mono;
        wet[0] = pending_[0];
        wet[1] = pending_[1];
        odd_frame_ = true;
      }

      const float mix = mix_.next();
      if (mix != applied_mix_) {
        kit::equal_power(mix, &dry_gain_, &wet_gain_);
        wet_gain_ *= kWetHeadroom;
        applied_mix_ = mix;
      }
      float left = in_left * dry_gain_ + wet[0] * wet_gain_;
      float right = in_right * dry_gain_ + wet[1] * wet_gain_;

      const float width = width_.next();
      if (width != applied_width_) {
        widener_.setWidth(width);
        mono_fold_ = kit::min(1.0f, width * (1.0f / kMonoBelowWidth));
        applied_width_ = width;
      }
      widener_.process(left, right);
      if (mono_fold_ < 1.0f) {
        const float mid = 0.5f * (left + right);
        const float side = 0.5f * (left - right) * mono_fold_;
        left = mid + side;
        right = mid - side;
      }
      out_left_[i] = left;
      out_right_[i] = right;
    }
    // The gate listens to the network as well as the output: at Mix 0 the
    // output is silent while the tail still rings inside.
    idle_.settle(kit::max(output_peak(frames), activity_), frames);
  }

 private:
  static constexpr int kLines = 8;
  static constexpr int kDiffusers = 4;
  // The longest line is 0.177 s: 16955 samples at a 96 kHz core rate (a
  // 192 kHz host), plus the LFO excursion.
  static constexpr int kLineSize = 32768;
  static constexpr int kDiffuserSize = 2048;
  static constexpr float kReferenceRate = 44100.0f;
  static constexpr float kHalfRateAbove = 64000.0f;
  // Bloom's constants, in samples at 44.1 kHz where they are lengths.
  static constexpr int kLineDelays[kLines] = {4799, 5399, 5801, 6199, 6599, 6997, 7393, 7789};
  static constexpr int kDiffuserDelays[kDiffusers] = {142, 107, 379, 277};
  static constexpr float kDiffusion[kDiffusers] = {0.75f, 0.75f, 0.625f, 0.625f};
  static constexpr float kModDepthSamples = 18.0f;
  static constexpr float kDamping = 0.45f;
  static constexpr float kDcPole = 0.995f;
  static constexpr float kFeedbackPole = 0.999f;
  static constexpr float kAgeDecay = 0.9999f;
  static constexpr float kAgeThreshold = 0.0001f;
  static constexpr float kDriftInjection = 0.25f;
  static constexpr float kWetHeadroom = 0.35f;
  static constexpr float kMonoBelowWidth = 0.25f;

  static int choice(float value, int count) {
    return kit::clamp_int(static_cast<int>(value + 0.5f), 0, count - 1);
  }

  // One core-rate sample: mono in, the two drifted sums out.
  void core(float mono, float* wet) {
    const float bloom = bloom_.next();
    feedback_ = feedback_ * feedback_pole_ + feedback_target_ * (1.0f - feedback_pole_);

    float diffused = mono;
    for (int a = 0; a < kDiffusers; ++a) {
      const float delayed = diffuser_[a].read(diffuser_delay_[a]);
      diffuser_[a].write(flush_denormal(diffused + kDiffusion[a] * delayed));
      diffused = delayed - kDiffusion[a] * diffused;
    }

    float out[kLines];
    float loudest = 0.0f;
    for (int ch = 0; ch < kLines; ++ch) {
      // The line's LFO as a coupled-form oscillator: a sine of fixed
      // amplitude (the modulation depth) for two multiplies.
      lfo_sin_[ch] += lfo_step_[ch] * lfo_cos_[ch];
      lfo_cos_[ch] -= lfo_step_[ch] * lfo_sin_[ch];
      const float delay = base_delay_[ch] + lfo_sin_[ch];
      // First-order Thiran allpass between the two neighbouring samples:
      // fractional delay with a flat magnitude, so the modulation does not
      // dull the loop the way linear interpolation would.
      const int whole = static_cast<int>(delay);
      const float fraction = delay - static_cast<float>(whole);
      const float coefficient = (1.0f - fraction) / (1.0f + fraction);
      const float sample = flush_denormal(line_[ch].read(whole + 1) +
                                          coefficient * (line_[ch].read(whole) - interp_[ch]));
      interp_[ch] = sample;
      out[ch] = sample;

      const float magnitude = sample < 0.0f ? -sample : sample;
      if (magnitude > loudest) loudest = magnitude;
      if (magnitude > kAgeThreshold) {
        age_[ch] += age_step_;
        if (age_[ch] > max_age_) age_[ch] = max_age_;
      } else {
        age_[ch] = flush_denormal(age_[ch] * age_decay_);
      }
    }

    const float inverse_max_age = 1.0f / max_age_;
    float drifted[2];
    for (int side = 0; side < 2; ++side) {
      const float age =
          0.25f * (age_[side] + age_[side + 2] + age_[side + 4] + age_[side + 6]) * inverse_max_age;
      const float sum = 0.25f * (out[side] + out[side + 2] + out[side + 4] + out[side + 6]);
      drifter_[side].setBloom(bloom);
      drifted[side] = drifter_[side].process(sum, kit::min(age, 1.0f));
    }

    float mixed[kLines];
    hadamard8(out, mixed);
    const float inject[2] = {drifted[0] * bloom * kDriftInjection, drifted[1] * bloom * kDriftInjection};
    for (int ch = 0; ch < kLines; ++ch) {
      const float back = diffused + mixed[ch] * feedback_ + inject[ch & 1];
      damp_[ch] = flush_denormal((1.0f - damping_) * back + damping_ * damp_[ch]);
      const float blocked = flush_denormal(damp_[ch] - dc_x_[ch] + dc_pole_ * dc_y_[ch]);
      dc_x_[ch] = damp_[ch];
      dc_y_[ch] = blocked;
      line_[ch].write(blocked);
    }

    wet[0] = drifted[0];
    wet[1] = drifted[1];
    const float left = drifted[0] < 0.0f ? -drifted[0] : drifted[0];
    const float right = drifted[1] < 0.0f ? -drifted[1] : drifted[1];
    activity_ = kit::max(activity_, kit::max(loudest, kit::max(left, right)));
  }

  // Bloom's three butterfly stages, scaled by 1/sqrt(8).
  static void hadamard8(const float* in, float* out) {
    const float a0 = in[0] + in[4], a1 = in[1] + in[5], a2 = in[2] + in[6], a3 = in[3] + in[7];
    const float a4 = in[0] - in[4], a5 = in[1] - in[5], a6 = in[2] - in[6], a7 = in[3] - in[7];
    const float b0 = a0 + a2, b1 = a1 + a3, b2 = a0 - a2, b3 = a1 - a3;
    const float b4 = a4 + a6, b5 = a5 + a7, b6 = a4 - a6, b7 = a5 - a7;
    constexpr float scale = 0.353553391f;
    out[0] = (b0 + b1) * scale;
    out[1] = (b0 - b1) * scale;
    out[2] = (b2 + b3) * scale;
    out[3] = (b2 - b3) * scale;
    out[4] = (b4 + b5) * scale;
    out[5] = (b4 - b5) * scale;
    out[6] = (b6 + b7) * scale;
    out[7] = (b6 - b7) * scale;
  }

  void apply(int id) {
    using namespace bloom_reverb;
    const float value = param(id);
    switch (id) {
      case kBloom:
        bloom_.set(value, primed());
        break;
      case kDirection:
        for (SpectralDrifter& drifter : drifter_) {
          drifter.setDirection(static_cast<SpectralDrifter::Direction>(choice(value, 3)));
        }
        break;
      case kSeason:
        for (SpectralDrifter& drifter : drifter_) {
          drifter.setSeason(static_cast<SpectralDrifter::Season>(choice(value, 4)));
        }
        break;
      case kDecay:
        feedback_target_ = std::pow(0.001f, mean_delay_seconds_ / value);
        if (!primed()) feedback_ = feedback_target_;
        max_age_ = 2.0f * value;
        break;
      case kSeed:
        for (SpectralDrifter& drifter : drifter_) {
          drifter.setSeed(static_cast<SpectralDrifter::Seed>(choice(value, 3)));
        }
        break;
      case kMix:
        mix_.set(value, primed());
        break;
      case kInterval:
        for (SpectralDrifter& drifter : drifter_) {
          drifter.setInterval(static_cast<SpectralDrifter::Interval>(choice(value, 4)));
        }
        break;
      case kWidth:
        width_.set(value, primed());
        break;
      default:
        break;
    }
  }

  kit::DelayLine<kLineSize> line_[kLines];
  kit::DelayLine<kDiffuserSize> diffuser_[kDiffusers];
  float base_delay_[kLines] = {};
  int diffuser_delay_[kDiffusers] = {};
  float lfo_sin_[kLines] = {};
  float lfo_cos_[kLines] = {};
  float lfo_step_[kLines] = {};
  float interp_[kLines] = {};
  float damp_[kLines] = {};
  float dc_x_[kLines] = {};
  float dc_y_[kLines] = {};
  float age_[kLines] = {};

  SpectralDrifter drifter_[2];
  StereoWidener widener_;
  kit::Halfband2x decimator_;
  kit::Halfband2x interpolator_[2];
  kit::LinearRamp bloom_, mix_, width_;
  kit::IdleGate idle_;

  float core_rate_ = 48000.0f;
  float mean_delay_seconds_ = 0.14f;
  float damping_ = 0.45f, dc_pole_ = 0.995f, feedback_pole_ = 0.999f;
  float age_decay_ = 0.9999f, age_step_ = 0.0f, max_age_ = 10.0f;
  float feedback_ = 0.8f, feedback_target_ = 0.8f;
  float dry_gain_ = 1.0f, wet_gain_ = 0.0f;
  float applied_mix_ = -1.0f, applied_width_ = -1.0f;
  float mono_fold_ = 1.0f;
  float held_input_ = 0.0f;
  float pending_[2] = {0.0f, 0.0f};
  float activity_ = 0.0f;
  bool half_rate_ = false;
  bool odd_frame_ = false;
};

}  // namespace livemix
