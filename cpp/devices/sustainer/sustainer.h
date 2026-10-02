#pragma once

// Sustain: catches what is played and holds it as an endless pad.
// (Signal path and method notes: see the end of this comment block, filled
// in as the device grows.)

#include "../../kit/kit.h"
#include "params.gen.h"
#include "real_fft.h"

namespace livemix {

class Sustainer : public kit::DeviceBase<sustainer::kNumParams> {
 public:
  static constexpr int kMaxFrame = 8192;  // the frame at 96 kHz
  static constexpr int kMaxHalf = kMaxFrame / 2;
  static constexpr int kSlots = 6;
  static constexpr int kMaxRegions = 512;

  void init(float sample_rate) {
    using namespace sustainer;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    frame_ = sr > 64000.0f ? 8192 : 4096;
    half_ = frame_ / 2;
    hop_ = frame_ / 4;
    hop_seconds_ = static_cast<float>(hop_) / sr;
    fft_.init();
    for (int n = 0; n < frame_; ++n) {
      window_[n] = 0.5f - 0.5f * static_cast<float>(std::cos(2.0 * 3.14159265358979323846 * n / frame_));
    }
    for (int i = 0; i < kRing; ++i) {
      input_[i] = 0.0f;
      output_[0][i] = 0.0f;
      output_[1][i] = 0.0f;
    }
    position_ = 0;
    mix_.set_time(kSmoothingSeconds, sr);
    mix_seen_ = -1.0f;
    dry_gain_ = 1.0f;
    wet_gain_ = 0.0f;
    reset_engine();
    // Once the last layer has gone, the frames in flight still play out.
    idle_.reset(sr, static_cast<float>(frame_ + 2 * hop_) / sr);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    using namespace sustainer;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames) || engine_busy())) {
      silence_output(frames);
      return;
    }
    const uint32_t hop_mask = static_cast<uint32_t>(hop_ - 1);
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      const float mono = 0.5f * (in[0] + in[1]);
      // A NaN or runaway sample must not reach the analysis.
      input_[position_ & kRingMask] = (mono > -64.0f && mono < 64.0f) ? mono : 0.0f;

      const uint32_t phase = position_ & hop_mask;
      if (phase == 0) synthesise();
      on_sample(phase);

      const float mix = mix_.next();
      if (mix != mix_seen_) {
        mix_seen_ = mix;
        kit::equal_power(mix, &dry_gain_, &wet_gain_);
      }
      float wet[2];
      for (int c = 0; c < 2; ++c) {
        float& slot = output_[c][position_ & kRingMask];
        // Linear up to ±1, never past ±2.
        wet[c] = 2.0f * kit::soft_clip(0.5f * slot);
        slot = 0.0f;
      }
      out_left_[i] = in[0] * dry_gain_ + wet[0] * wet_gain_;
      out_right_[i] = in[1] * dry_gain_ + wet[1] * wet_gain_;
      ++position_;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kRing = 16384;
  static constexpr uint32_t kRingMask = kRing - 1;

  void apply(int id) {
    using namespace sustainer;
    switch (id) {
      case kMix:
        mix_.set(param(id), primed());
        break;
      default:
        break;  // the rest is read on the frame clock
    }
  }

  // --- engine (grown in stages) ---------------------------------------------------------
  void reset_engine() {}
  bool engine_busy() const { return false; }
  void on_sample(uint32_t /*phase*/) {}
  void synthesise() {}

  sustainer_detail::RealFft<kMaxFrame> fft_;
  float window_[kMaxFrame];
  float input_[kRing];
  float output_[2][kRing];
  kit::Smoother mix_;
  kit::IdleGate idle_;
  float mix_seen_ = -1.0f;
  float dry_gain_ = 1.0f;
  float wet_gain_ = 0.0f;
  float hop_seconds_ = 0.0f;
  uint32_t position_ = 0;
  int frame_ = 4096;
  int half_ = 2048;
  int hop_ = 1024;
};

}  // namespace livemix
