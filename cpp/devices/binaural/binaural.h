#pragma once

// Binaural: SKELETON. One plain sine a key, the same in both ears, so that
// the harness can be written and seen to fail before the device is built.

#include "../../kit/kit.h"
#include "../../kit/beat.h"
#include "../../kit/colour.h"
#include "params.gen.h"

namespace livemix {

class Binaural : public kit::DeviceBase<binaural::kNumParams> {
 public:
  static constexpr int kVoices = 8;
  static constexpr float kLowHz = 80.0f;
  static constexpr float kHighHz = 1000.0f;
  static constexpr float kVoiceAmp = 0.175f;
  static constexpr float kSecond = 0.5f;
  static constexpr float kThird = 0.25f;
  static constexpr float kBedLevel = 0.625f;
  static constexpr float kStealSeconds = 0.005f;
  static constexpr float kIdleSeconds = 0.1f;
  static constexpr int kControlPeriod = 32;

  static float fold(float hz) { return hz; }

  void init(float sample_rate) {
    using namespace binaural;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    pool_.reset();
    for (int v = 0; v < kVoices; ++v) {
      pool_.voices[v] = Voice();
      pool_.voices[v].env.set_sample_rate(sr);
    }
    idle_.reset(sr, kIdleSeconds);
  }

  void set_param(int id, float value) { store_param(id, value); }

  float meter(int) const { return 0.0f; }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;
    frequency = kit::clamp(frequency, 8.0f, 12000.0f);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    voice.carrier = 0.0;
    voice.increment = static_cast<double>(frequency) / sample_rate();
    voice.gain = gain;
    voice.env.reset();
    voice.env.set(param(binaural::kAttack), 0.1f, 1.0f, param(binaural::kRelease));
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
    const float volume = kit::db_to_gain(param(binaural::kVolume));
    for (int i = 0; i < frames; ++i) {
      float sum = 0.0f;
      for (int v = 0; v < kVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.env.active()) continue;
        sum += kit::sin_cos(voice.carrier).s * voice.env.next() * voice.gain;
        voice.carrier = kit::wrap_phase(voice.carrier + voice.increment);
      }
      out_left_[i] = out_right_[i] = kit::soft_clip(sum * kVoiceAmp * volume);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  struct Voice {
    kit::Adsr env;
    double carrier = 0.0;
    double increment = 0.0;
    float gain = 0.0f;
    bool active() const { return env.active(); }
    bool releasing() const { return env.releasing(); }
    float level() const { return env.level(); }
  };

  kit::VoicePool<Voice, kVoices> pool_;
  kit::IdleGate idle_;
};

}  // namespace livemix
