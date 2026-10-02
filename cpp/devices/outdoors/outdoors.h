#pragma once

// Outdoors: living things and small events as an instrument.
//
//   per key (up to 8): one scene of the chosen type, with its own random
//   streams, places in the stereo field and register (from the key)
//                         │
//   out ◄─ soft clip ◄─ volume ◄─ width ◄─ diffusion ◄─ air low-pass ◄─ envelope
//
// The scenes are in their own headers, one each.

#include "../../kit/kit.h"
#include "chimes.h"
#include "params.gen.h"
#include "scene.h"

namespace livemix {

class Outdoors : public kit::DeviceBase<outdoors::kNumParams> {
 public:
  static constexpr int kMaxVoices = 8;
  enum Kind : int { kBirds = 0, kCrickets, kFrogs, kStream, kThunder, kChimes, kKinds };

  void init(float sample_rate) {
    using namespace outdoors;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    pool_.reset();
    uint32_t stream = 0;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice.reset();
      voice.env.set_sample_rate(sr);
      voice.swap.set_time(0.005f, sr);
      voice.swap.snap(1.0f);
      voice.chimes.seed(scene::seed_for(stream), scene::seed_for(stream + 1));
      stream += 16;
    }
    for (int c = 0; c < 2; ++c) {
      air_[c].reset();
      for (int stage = 0; stage < kStages; ++stage) {
        diffuser_[c][stage].clear();
        diffuser_length_[c][stage] =
            kit::clamp_int(static_cast<int>(kDiffuserSeconds[c][stage] * sr), 1, kDiffuserSize - 4);
      }
    }
    clock_.reset(scene::kControlPeriod);
    const float control_rate = sr / static_cast<float>(scene::kControlPeriod);
    density_.set_time(0.03f, control_rate);
    distance_.set_time(0.03f, control_rate);
    movement_.set_time(0.03f, control_rate);
    tone_.set_time(0.03f, control_rate);
    diffusion_.set_time(0.02f, sr);
    mid_.set_time(kSmoothingSeconds, sr);
    side_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    fade_.set_time(0.01f, sr);
    fade_.snap(1.0f);
    kind_ = kit::clamp_int(static_cast<int>(param(kType) + 0.5f), 0, kKinds - 1);
    pending_kind_ = kind_;
    controls_ = scene::Controls();
    controls_.sample_rate = sr;
    controls_.step_seconds = static_cast<float>(scene::kControlPeriod) / sr;
    // The diffusers hold 37 ms; the hold has to outlast them.
    idle_.reset(sr, 0.3f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    read_controls(true);
    aim_air();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    using namespace outdoors;
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, 8.0f, 12000.0f);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    const int held = pool_.find_held(note_id);
    if (held >= 0) pool_.voices[held].env.fast_release(0.05f);

    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    if (stolen) {
      // Duck the old scene out over 5 ms; the new one starts at the bottom.
      voice.next_hz = frequency;
      voice.next_gain = gain;
      voice.restart = true;
      voice.swap.set_target(0.0f);
    } else {
      voice.hz = frequency;
      voice.gain = gain;
      voice.restart = false;
      voice.swap.snap(1.0f);
      begin(voice);
    }
    voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
    voice.env.gate_on();
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held >= 0) pool_.voices[held].env.gate_off();
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) control();

      const int kind = kind_;
      float left = 0.0f, right = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.env.active()) continue;
        float l = 0.0f, r = 0.0f;
        switch (kind) {
          default:
            voice.chimes.tick(l, r);
            break;
        }
        const float swap = voice.swap.next();
        const float level = voice.env.next() * voice.gain * swap;
        left += l * level;
        right += r * level;
        if (voice.restart && swap <= 0.0f) {
          voice.hz = voice.next_hz;
          voice.gain = voice.next_gain;
          voice.restart = false;
          voice.swap.set_target(1.0f);
          begin(voice);
        }
      }

      // The dip around a type change happens here, ahead of the delays, so
      // the new type fades in at its source. Then distance: the air's
      // low-pass and the allpass chain.
      const float fade = fade_.next();
      left = air_[0].lowpass(left * fade);
      right = air_[1].lowpass(right * fade);
      const float diffusion = diffusion_.next();
      for (int stage = 0; stage < kStages; ++stage) {
        left = diffuser_[0][stage].process(left, diffuser_length_[0][stage], diffusion);
        right = diffuser_[1][stage].process(right, diffuser_length_[1][stage], diffusion);
      }

      const float mid = (left + right) * 0.5f * mid_.next();
      const float side = (left - right) * 0.5f * side_.next();
      const float volume = volume_.next();
      out_left_[i] = kit::soft_clip((mid + side) * volume);
      out_right_[i] = kit::soft_clip((mid - side) * volume);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  // SCENES

  // DEVICE

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::OnePole air_[2];
  kit::AllpassDelay<kDiffuserSize> diffuser_[2][kStages];
  int diffuser_length_[2][kStages] = {};
  kit::Smoother density_, distance_, movement_, tone_;  // advanced on the control clock
  kit::Smoother diffusion_, mid_, side_, volume_;
  kit::LinearRamp fade_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  scene::Controls controls_;
  int kind_ = 0;
  int pending_kind_ = 0;
};

}  // namespace livemix
