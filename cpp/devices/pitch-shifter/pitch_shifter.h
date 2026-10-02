#pragma once

// Pitch Shifter: two shifted voices reading one ring of recent input.
//
//   in ─(+)─► band limit ─► ring ─┬─► voice A ─► tone ─┬─► place ─┐
//        ▲                        └─► voice B ─► tone ─┼─► place ─┴─► wet
//        │                                             │
//        └── limit ◄─ Feedback ◄─ 35 Hz low cut ◄──────┘  (A + B, before placing)
//
// - A voice is a few read heads moving along the ring at the pitch ratio
//   (ShiftVoice.h): spliced where the waveform lines up (Smooth), rebuilt
//   from overlapping grains (Grain) or crossfaded blindly (Vintage).
// - Delay is not a second line: the heads simply read that much further
//   back, and it glides when moved. Feedback goes back into the ring, so
//   every pass is shifted again and the repeats climb or fall by the
//   interval; a low cut and the Tone filter are what they leave through.
// - What is recorded is band-limited to what the fastest voice can read
//   without aliasing.
// - Pitch glides (12 ms) and the heads follow it sample by sample, so a
//   sweep bends instead of stepping. Size and Jitter are read as each head
//   starts.
// - Spread places A to the left and B to the right by the level of B, so a
//   single voice stays in the middle; a voice keeps the stereo of its input
//   where it is not moved aside.

#include "../../kit/kit.h"
#include "ShiftVoice.h"
#include "params.gen.h"

namespace livemix {

class PitchShifter : public kit::DeviceBase<pitch_shifter::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace pitch_shifter;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    ring_.clear();
    for (int v = 0; v < 2; ++v) {
      voice_[v].reset(v == 0 ? 0x3C6EF372u : 0xA54FF53Au, sr);
      pitch_[v].set_time(kGlideSeconds, sr);
      for (int c = 0; c < 2; ++c) {
        tone_[v][c].reset();
        guard_[v][c].reset();
      }
      mid_left_[v].set_time(kSmoothingSeconds, sr);
      mid_right_[v].set_time(kSmoothingSeconds, sr);
      side_[v].set_time(kSmoothingSeconds, sr);
      rumble_[v].reset();
      rumble_[v].set_cutoff(35.0f, sr);
    }
    level_b_.set_time(kSmoothingSeconds, sr);
    feedback_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    base_.set_time(kDelayLagSeconds, sr);
    tone_hz_.set_time(kSmoothingSeconds, sr / kControlPeriod);
    clock_.reset(kControlPeriod);
    mix_seen_ = -1.0f;
    tone_seen_ = -1.0f;
    guard_seen_ = -1.0f;
    b_active_ = false;
    // The longest silent gap: Delay, plus a head two octaves up at the
    // longest Size with full Jitter.
    idle_.reset(sr, 3.0f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    for (int v = 0; v < 2; ++v) {
      ratio_[v] = kit::semitones_to_ratio(pitch_[v].value);
      ratio_step_[v] = 0.0f;
    }
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames);

 private:
  static constexpr int kControlPeriod = 16;
  static constexpr float kGlideSeconds = 0.012f;
  static constexpr float kDelayLagSeconds = 0.08f;

  void apply(int id);
  void control();

  pitch_shifter_dsp::Ring ring_;
  pitch_shifter_dsp::ShiftVoice voice_[2];
  pitch_shifter_dsp::VoiceSetup setup_[2];
  kit::Smoother pitch_[2];  // semitones, detune included
  kit::Smoother mid_left_[2], mid_right_[2], side_[2];
  kit::Smoother level_b_, feedback_, mix_, base_, tone_hz_;
  kit::Svf tone_[2][2];   // [voice][channel]
  kit::Svf guard_[2][2];  // [stage][channel]
  kit::OnePole rumble_[2];
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float ratio_[2] = {1.0f, 1.0f};
  float ratio_step_[2] = {0.0f, 0.0f};
  float mix_seen_ = -1.0f, dry_gain_ = 1.0f, wet_gain_ = 0.0f;
  float tone_seen_ = -1.0f, guard_seen_ = -1.0f;
  bool b_active_ = false;
};

}  // namespace livemix
