#pragma once

// Still Point, first step: plain sine keys and nothing else, so the harness
// can be seen to fail on what is still missing.

#include "../../kit/kit.h"
#include "../../kit/beat.h"
#include "params.gen.h"

namespace livemix {

class StillPoint : public kit::DeviceBase<still_point::kNumParams> {
 public:
  static constexpr int kMaxVoices = 8;
  static constexpr int kControlSamples = 16;
  static constexpr double kLimitSeconds = 0.8;

  void init(float sample_rate) {
    using namespace still_point;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    kit::SineTable::init();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      pool_.voices[v] = Voice();
      pool_.voices[v].env.set_sample_rate(this->sample_rate());
    }
    idle_.reset(this->sample_rate(), 0.05f);
  }

  void set_param(int id, float value) { store_param(id, value); }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;
    frequency = kit::clamp(frequency, 8.0f, 12000.0f);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    voice.phase = 0.0;
    voice.increment = static_cast<double>(frequency) / sample_rate();
    voice.gain = gain;
    voice.env.set(param(still_point::kAttack), 0.1f, 1.0f, param(still_point::kRelease));
    voice.env.reset();
    voice.env.gate_on();
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held >= 0) pool_.voices[held].env.gate_off();
  }

  float meter(int) const { return 0.0f; }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);
    const float volume = kit::db_to_gain(param(still_point::kVolume)) * 0.35f;
    for (int i = 0; i < frames; ++i) {
      float keys = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.env.active()) continue;
        keys += voice.env.next() * voice.gain * kit::sin_cos(voice.phase).s;
        voice.phase = kit::wrap_phase(voice.phase + voice.increment);
      }
      out_left_[i] = out_right_[i] = kit::soft_clip(0.5f * keys * volume);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  struct Voice {
    kit::Adsr env;
    double phase = 0.0;
    double increment = 0.0;
    float gain = 0.0f;
    bool active() const { return env.active(); }
    bool releasing() const { return env.releasing(); }
    float level() const { return env.level() * gain; }
  };

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::IdleGate idle_;
};

}  // namespace livemix
