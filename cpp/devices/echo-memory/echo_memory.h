#pragma once

// Echo Memory: an echo beside a one-minute memory of what was played.
//
//   in ─┬──────────────────────────────────────────────────────────► dry ─┐
//       ├─► ping pong ─(+)─► limit ─► echo line ─► tone ─┬─► × Echo ──┐    │
//       │               ▲                                │            (+)─► limit ─► wet ─┴─► out
//       │               └──── feedback ◄─ low cut ◄──────┘            │
//       └─(+)─► memory (16-bit, 68 s) ─► two snippet voices ─► tone ─┬┴─ × Memory
//          ▲                                                         │
//          └────────────── Collect (-9 dB per generation) ◄──────────┘
//
// HEADER-NOTES

#include "../../kit/kit.h"
#include "memory_store.h"
#include "params.gen.h"

namespace livemix {

class EchoMemory : public kit::DeviceBase<echo_memory::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace echo_memory;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    // The memory holds at most 48 kHz: above that it is recorded at half rate.
    halved_ = sr > 50000.0f;
    store_rate_ = halved_ ? sr * 0.5f : sr;
    memory_.prepare(store_rate_);
    memory_.clear();
    for (int c = 0; c < 2; ++c) {
      line_[c].clear();
      down_[c].init();
    }
    time_.set_time(kMotorLagSeconds, sr);
    feedback_.set_time(kSmoothingSeconds, sr);
    echo_level_.set_time(kSmoothingSeconds, sr);
    memory_level_.set_time(kSmoothingSeconds, sr);
    spread_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    collect_.set_time(0.03f, sr);
    tone_.set_time(0.02f, sr / kControlPeriod);
    rng_.seed(0x3C6EF372u);
    asleep_ = true;
    for (int id = 0; id < kNumParams; ++id) apply(id);
    restart();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    using namespace echo_memory;
    frames = begin_block(frames);
    const bool excited = input_present(frames);
    if (asleep_) {
      if (!excited) {
        silence_output(frames);
        return;
      }
      asleep_ = false;
      memory_.forget();
      restart();
    }
    const float max_delay = kit::DelayLine<kLineSize>::max_delay() - 8.0f;
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      // A NaN or runaway input must not sit in the memory for a minute.
      if (!(in[0] > -8.0f && in[0] < 8.0f)) in[0] = 0.0f;
      if (!(in[1] > -8.0f && in[1] < 8.0f)) in[1] = 0.0f;
      if (clock_.tick()) control();

      // --- echo voice ---
      const float delay = kit::clamp(time_.next(), 4.0f, max_delay);
      float echo[2];
      for (int c = 0; c < 2; ++c) echo[c] = echo_tone_[c].lowpass(line_[c].read_hermite(delay));
      const float feedback = feedback_.next();
      const float spread = spread_.next();
      const float back[2] = {low_cut_[0].highpass(echo[0]), low_cut_[1].highpass(echo[1])};
      const float send_left = (in[0] + spread * in[1]) * kit::lerp(1.0f, kit::kSqrtHalf, spread);
      const float send_right = in[1] * (1.0f - spread);
      const float record[2] = {
          flush_denormal(limit(send_left + feedback * kit::lerp(back[0], back[1], spread))),
          flush_denormal(limit(send_right + feedback * kit::lerp(back[1], back[0], spread)))};
      line_[0].write(record[0]);
      line_[1].write(record[1]);
      if (record[0] > kFloor || record[0] < -kFloor || record[1] > kFloor || record[1] < -kFloor) {
        echo_blank_ = 0;
      } else if (echo_blank_ < kLongEnough) {
        ++echo_blank_;
      }

      // --- memory voice ---
      float recalled[2] = {0.0f, 0.0f};
      // MEMORY-VOICE

      // --- record into the memory ---
      // MEMORY-RECORD

      const float echo_level = echo_level_.next();
      const float memory_level = memory_level_.next();
      const float wet_left = limit(echo_level * echo[0] + memory_level * recalled[0]);
      const float wet_right = limit(echo_level * echo[1] + memory_level * recalled[1]);
      const float mix = mix_.next();
      if (mix != mix_seen_) {
        mix_seen_ = mix;
        dry_gain_ = kit::SineTable::cos_lookup(0.25f * mix);
        wet_gain_ = kit::SineTable::lookup(0.25f * mix);
      }
      out_left_[i] = in[0] * dry_gain_ + wet_left * wet_gain_;
      out_right_[i] = in[1] * dry_gain_ + wet_right * wet_gain_;
    }
    // SLEEP-CHECK
    if (!excited && echo_blank_ > kLineSize && output_peak(frames) <= kFloor) asleep_ = true;
  }

 private:
  // 4 s at 96 kHz plus the motor lag's overshoot room.
  static constexpr int kLineSize = 524288;
  // 68.75 s at 48 kHz: the longest Reach plus the longest Size, and a margin.
  static constexpr int kMemoryFrames = 3300000;
  static constexpr long kLongEnough = 1L << 30;
  static constexpr float kFloor = kit::IdleGate::kFloor;
  static constexpr float kMotorLagSeconds = 0.12f;
  static constexpr float kLowCutHz = 70.0f;
  static constexpr int kControlPeriod = 16;

  // Exactly linear up to ±1, never past ±2.
  static float limit(float x) { return 2.0f * kit::soft_clip(0.5f * x); }

  // Everything settled, nothing sounding (init and wake).
  void restart() {
    for (int c = 0; c < 2; ++c) {
      echo_tone_[c].reset();
      memory_tone_[c].reset();
      low_cut_[c].reset();
      low_cut_[c].set_cutoff(kLowCutHz, sample_rate());
      down_[c].reset();
    }
    clock_.reset(kControlPeriod);
    time_.snap(time_.target);
    feedback_.snap(feedback_.target);
    echo_level_.snap(echo_level_.target);
    memory_level_.snap(memory_level_.target);
    spread_.snap(spread_.target);
    mix_.snap(mix_.target);
    collect_.snap(collect_.target);
    tone_.snap(tone_.target);
    tone_seen_ = -1.0f;
    mix_seen_ = -1.0f;
    echo_blank_ = 0;
    // RESTART-MEMORY
  }

  void control() {
    using namespace echo_memory;
    const float tone = tone_.next();
    if (tone != tone_seen_) {
      tone_seen_ = tone;
      const float hz = std::exp(tone);
      for (int c = 0; c < 2; ++c) {
        echo_tone_[c].set(hz, 0.6f, sample_rate());
        memory_tone_[c].set(hz, 0.6f, sample_rate());
      }
    }
    // CONTROL-MEMORY
  }

  void apply(int id) {
    using namespace echo_memory;
    const float value = param(id);
    // Nothing sounds while asleep, so a value set then has nothing to glide from.
    const bool glide = primed() && !asleep_;
    switch (id) {
      case kTime:
        time_.set(value * 0.001f * sample_rate(), glide);
        break;
      case kFeedback:
        feedback_.set(value, glide);
        break;
      case kEcho:
        echo_level_.set(value, glide);
        break;
      case kMemory:
        memory_level_.set(value, glide);
        break;
      case kCollect:
        collect_.set(value >= 0.5f ? 1.0f : 0.0f, glide);
        break;
      case kTone:
        tone_.set(std::log(value), glide);
        break;
      case kSpread:
        spread_.set(value, glide);
        break;
      case kMix:
        mix_.set(value, glide);
        break;
      default:
        break;  // Reach, Wander, Size and Vary are read when a moment is chosen
    }
  }

  echo_memory::Memory<kMemoryFrames> memory_;
  kit::DelayLine<kLineSize> line_[2];
  kit::Halfband2x down_[2];
  kit::Svf echo_tone_[2];
  kit::Svf memory_tone_[2];
  kit::OnePole low_cut_[2];
  kit::Smoother time_, feedback_, echo_level_, memory_level_, spread_, mix_, tone_;
  kit::LinearRamp collect_;
  kit::ControlClock clock_;
  kit::Rng rng_;
  bool halved_ = false;
  bool asleep_ = true;
  float store_rate_ = 48000.0f;
  float tone_seen_ = -1.0f;
  float mix_seen_ = -1.0f, dry_gain_ = 1.0f, wet_gain_ = 0.0f;
  long echo_blank_ = 0;
  // MEMORY-MEMBERS
};

}  // namespace livemix
