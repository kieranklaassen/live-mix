#pragma once

// Micro Looper: an always-listening short looper with a variable clock.
// (Signal path and behaviour notes are at the end of the class comment below
// once the pieces are in.)

#include "../../kit/kit.h"
#include "memory.h"
#include "params.gen.h"

namespace livemix {

class MicroLooper : public kit::DeviceBase<micro_looper::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace micro_looper;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    ring_.clear();
    store_.clear();
    clock_.set_time(kClockGlideSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    for (int c = 0; c < 2; ++c) {
      for (float& value : history_[c]) value = 0.0f;
    }
    write_phase_ = 0.0f;
    mix_seen_ = -1.0f;
    control_.reset(kControlPeriod);
    asleep_ = true;
    quiet_ = 0;
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    frames = begin_block(frames);
    const bool excited = input_present(frames);
    if (asleep_) {
      if (!excited) {
        silence_output(frames);
        return;
      }
      wake();
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      const float clock = clock_.next();
      record(in, clock);

      float wet[2] = {0.0f, 0.0f};

      const float mix = mix_.next();
      if (mix != mix_seen_) {
        mix_seen_ = mix;
        kit::equal_power(mix, &dry_gain_, &wet_gain_);
      }
      out_left_[i] = in[0] * dry_gain_ + wet[0] * wet_gain_;
      out_right_[i] = in[1] * dry_gain_ + wet[1] * wet_gain_;
    }
    settle(excited, frames);
  }

 private:
  // The ring holds 10.9 s at 96 kHz and full clock; a loop is at most 8 s of
  // it plus its join, and the rest is the time the copy into the store has.
  static constexpr int kRingFrames = 1 << 20;
  static constexpr int kStoreFrames = 776192;
  static constexpr int kControlPeriod = 16;
  static constexpr float kClockGlideSeconds = 0.08f;
  static constexpr float kClocks[8] = {1.0f,        0.75f,       2.0f / 3.0f, 0.5f,
                                       0.375f,      1.0f / 3.0f, 0.25f,       0.125f};
  static constexpr float kSpeeds[6] = {-2.0f, -1.0f, -0.5f, 0.5f, 1.0f, 2.0f};

  // The record stage: the input, band-limited to the clock, written to the
  // ring `clock` frames per sample. At full clock it is an exact copy.
  void record(const float* in, float clock) {
    for (int c = 0; c < 2; ++c) {
      float* h = history_[c];
      h[0] = h[1];
      h[1] = h[2];
      h[2] = h[3];
      h[3] = in[c];
    }
    if (clock >= 1.0f) {
      write_phase_ = 0.0f;
      ring_.write(guard(history_[0][2]), guard(history_[1][2]));
      return;
    }
    write_phase_ += clock;
    if (write_phase_ < 1.0f) return;
    write_phase_ -= 1.0f;
    // The frame falls `late` samples before now; read it one sample back so
    // that Hermite has a neighbour on each side.
    const float t = 1.0f - write_phase_ / clock;
    float frame[2];
    for (int c = 0; c < 2; ++c) {
      const float* h = history_[c];
      frame[c] = guard(kit::hermite(h[0], h[1], h[2], h[3], t));
    }
    ring_.write(frame[0], frame[1]);
  }

  // A NaN or a runaway input must not sit in the memory for seconds.
  static float guard(float x) { return (x > -8.0f && x < 8.0f) ? flush_denormal(x) : 0.0f; }

  void wake() {
    asleep_ = false;
    quiet_ = 0;
    ring_.forget();
    write_phase_ = 0.0f;
    for (int c = 0; c < 2; ++c) {
      for (float& value : history_[c]) value = 0.0f;
    }
    control_.reset(kControlPeriod);
    clock_.snap(clock_.target);
    mix_.snap(mix_.target);
  }

  // Sleep once nothing is coming in, nothing is looping and the output has
  // been below the floor for a little while.
  void settle(bool excited, int frames) {
    if (excited || output_peak(frames) > kit::IdleGate::kFloor) {
      quiet_ = 0;
      return;
    }
    quiet_ += frames;
    if (quiet_ > static_cast<long>(0.05f * sample_rate())) asleep_ = true;
  }

  void apply(int id) {
    using namespace micro_looper;
    const float value = param(id);
    const bool glide = primed() && !asleep_;
    switch (id) {
      case kClock:
        clock_.set(kClocks[kit::clamp_int(static_cast<int>(value + 0.5f), 0, 7)], glide);
        break;
      case kMix:
        mix_.set(value, glide);
        break;
      default:
        break;
    }
  }

  micro_looper::Ring<kRingFrames> ring_;
  micro_looper::Store<kStoreFrames> store_;
  kit::LinearRamp clock_;
  kit::Smoother mix_;
  kit::ControlClock control_;
  float history_[2][4] = {};
  float write_phase_ = 0.0f;
  float mix_seen_ = -1.0f, dry_gain_ = 1.0f, wet_gain_ = 0.0f;
  bool asleep_ = true;
  long quiet_ = 0;
};

}  // namespace livemix
