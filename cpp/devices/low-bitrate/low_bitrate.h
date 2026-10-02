#pragma once

// Low Bitrate: a transform codec in outline, without the bitstream.

#include "../../kit/kit.h"
#include "mdct.h"
#include "params.gen.h"

namespace livemix {

class LowBitrate : public kit::DeviceBase<low_bitrate::kNumParams> {
 public:
  static constexpr int kLatency = 4096;

  void init(float sample_rate) {
    using namespace low_bitrate;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    rate_factor_ = sr >= 70000.0f ? 2 : 1;
    for (int f = 0; f < kNumFrames; ++f) plan_[f].init(kBaseFrame[f] * rate_factor_);
    for (int c = 0; c < 2; ++c) {
      for (int i = 0; i < kRing; ++i) input_[c][i] = 0.0f;
    }
    for (Engine& engine : engine_) reset_engine(engine, 0);
    position_ = 0;
    current_ = 0;
    switching_ = false;
    fade_start_ = 0;
    fade_length_ = static_cast<uint32_t>(kSwitchFadeSeconds * sr);
    wanted_frame_ = frame_choice();
    reset_engine(engine_[0], wanted_frame_);
    engine_[0].active = true;
    mix_.set_time(kSmoothingSeconds, sr);
    idle_.reset(sr, static_cast<float>(kRing + kLatency) / sr + 0.1f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    using namespace low_bitrate;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames) || alive())) {
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);

      if (!switching_ && wanted_frame_ != engine_[current_].frame) begin_switch();
      for (Engine& engine : engine_) {
        if (engine.active && (position_ & static_cast<uint32_t>(plan_[engine.frame].size() - 1)) == 0) {
          run_frame(engine);
        }
      }

      const uint32_t at = position_ & kRingMask;
      // A NaN or runaway sample would otherwise spread over a whole frame.
      input_[0][at] = (in[0] > -64.0f && in[0] < 64.0f) ? in[0] : 0.0f;
      input_[1][at] = (in[1] > -64.0f && in[1] < 64.0f) ? in[1] : 0.0f;

      float mid = engine_[current_].out[0][at];
      float side = engine_[current_].out[1][at];
      if (switching_) {
        const int32_t into = static_cast<int32_t>(position_ - fade_start_);
        if (into >= 0) {
          const Engine& next = engine_[1 - current_];
          const float t = static_cast<float>(into) / static_cast<float>(fade_length_);
          if (t >= 1.0f) {
            engine_[current_].active = false;
            current_ = 1 - current_;
            switching_ = false;
            mid = next.out[0][at];
            side = next.out[1][at];
          } else {
            const float g = t * t * (3.0f - 2.0f * t);
            mid += g * (next.out[0][at] - mid);
            side += g * (next.out[1][at] - side);
          }
        }
      }
      // Linear up to ±1, never past ±2.
      const float wet_left = 2.0f * kit::soft_clip(0.5f * (mid + side));
      const float wet_right = 2.0f * kit::soft_clip(0.5f * (mid - side));

      const uint32_t dry_at = (position_ - kLatency) & kRingMask;
      const float mix = mix_.next();
      // Dry and wet are time-aligned and coherent: a linear crossfade.
      out_left_[i] = input_[0][dry_at] * (1.0f - mix) + wet_left * mix;
      out_right_[i] = input_[1][dry_at] * (1.0f - mix) + wet_right * mix;
      ++position_;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kNumFrames = 3;
  static constexpr int kMaxN = 2048;  // the Long frame at 96 kHz
  static constexpr int kRing = 8192;  // input: a window plus the latency
  static constexpr uint32_t kRingMask = kRing - 1;
  // Coefficients per frame at 44.1 and 48 kHz; doubled from 88.2 kHz up.
  static constexpr int kBaseFrame[kNumFrames] = {128, 512, 1024};
  static constexpr float kSwitchFadeSeconds = 0.03f;

  struct Engine {
    int frame;    // which plan
    bool active;  // running frames
    float overlap[2][kMaxN];  // second half of the last frame, windowed
    float out[2][kRing];      // finished wet samples by output time (mid, side)
  };

  void reset_engine(Engine& engine, int frame) {
    engine.frame = frame;
    engine.active = false;
    for (int c = 0; c < 2; ++c) {
      for (int i = 0; i < kMaxN; ++i) engine.overlap[c][i] = 0.0f;
      for (int i = 0; i < kRing; ++i) engine.out[c][i] = 0.0f;
    }
  }

  int frame_choice() const {
    return kit::clamp_int(static_cast<int>(param(low_bitrate::kFrame) + 0.5f), 0, kNumFrames - 1);
  }

  bool alive() const { return false; }

  void apply(int id) {
    using namespace low_bitrate;
    switch (id) {
      case kFrame:
        wanted_frame_ = frame_choice();
        if (!primed()) {
          reset_engine(engine_[current_], wanted_frame_);
          engine_[current_].active = true;
        }
        break;
      case kMix:
        mix_.set(param(id), primed());
        break;
      default:
        break;  // the rest is read once per frame
    }
  }

  // Start the other engine at the wanted frame size. What it writes is whole
  // from one latency on; the crossfade starts there.
  void begin_switch() {
    Engine& next = engine_[1 - current_];
    reset_engine(next, wanted_frame_);
    next.active = true;
    switching_ = true;
    fade_start_ = position_ + kLatency;
  }

  // One frame of one engine: the 2N samples that ended just now, as mid and
  // side, through the transform and back, overlap-added so that every sample
  // comes out kLatency after it went in.
  void run_frame(Engine& engine) {
    MdctPlan& plan = plan_[engine.frame];
    const int n = plan.size();
    const float* window = plan.window();
    const uint32_t start = position_ - 2 * static_cast<uint32_t>(n);
    for (int c = 0; c < 2; ++c) {
      const float sign = c == 0 ? 0.5f : -0.5f;
      for (int k = 0; k < 2 * n; ++k) {
        const uint32_t at = (start + k) & kRingMask;
        time_[k] = (0.5f * input_[0][at] + sign * input_[1][at]) * window[k];
      }
      plan.forward(time_, cosine_[c]);
    }
    for (int c = 0; c < 2; ++c) {
      plan.inverse(cosine_[c], time_);
      float* overlap = engine.overlap[c];
      float* out = engine.out[c];
      const uint32_t out_start = start + kLatency;
      for (int k = 0; k < n; ++k) {
        out[(out_start + k) & kRingMask] = overlap[k] + time_[k] * window[k];
        overlap[k] = time_[n + k] * window[n + k];
      }
    }
  }

  using MdctPlan = low_bitrate_dsp::Mdct<kMaxN>;

  MdctPlan plan_[kNumFrames];
  Engine engine_[2];
  float input_[2][kRing];        // left and right
  float time_[2 * kMaxN];        // scratch: one windowed frame
  float cosine_[2][kMaxN];       // scratch: MDCT coefficients, mid and side
  kit::Smoother mix_;
  kit::IdleGate idle_;
  uint32_t position_ = 0;        // samples processed; rings use its low bits
  uint32_t fade_start_ = 0;
  uint32_t fade_length_ = 1;
  int rate_factor_ = 1;
  int current_ = 0;              // the engine that is heard
  int wanted_frame_ = 1;
  bool switching_ = false;
};

}  // namespace livemix
