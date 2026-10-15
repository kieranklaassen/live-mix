#pragma once

// Isochronic: skeleton. Each key is a plain sine with an envelope; the pulse,
// the glide, the noise band and the rest are still to come. It exists so the
// harness can be written first and seen to fail.

#include "../../kit/kit.h"
#include "../../kit/beat.h"
#include "../../kit/colour.h"
#include "params.gen.h"

namespace livemix {

class Isochronic : public kit::DeviceBase<isochronic::kNumParams> {
 public:
  static constexpr int kMaxVoices = 8;

  void init(float sample_rate) {
    using namespace isochronic;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    kit::SineTable::init();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      voice.env.set_sample_rate(sr);
    }
    volume_.set_time(kSmoothingSeconds, sr);
    idle_.reset(sr, 0.05f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;
    frequency = kit::clamp(frequency, 8.0f, 12000.0f);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    voice.step = static_cast<double>(frequency) / sample_rate();
    voice.gain = gain;
    voice.carrier = 0.0;
    voice.env.reset();
    voice.env.set(param(isochronic::kAttack), 0.1f, 1.0f, param(isochronic::kRelease));
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
      float mono = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.env.active()) continue;
        mono += kit::sin_cos(voice.carrier).s * voice.env.next() * voice.gain;
        voice.carrier = kit::wrap_phase(voice.carrier + voice.step);
      }
      const float out = kit::soft_clip(mono * 0.35f * volume_.next());
      out_left_[i] = out;
      out_right_[i] = out;
    }
    idle_.settle(output_peak(frames), frames);
  }

  float meter(int) const { return 0.0f; }

 private:
  struct Voice {
    kit::Adsr env;
    double carrier = 0.0;
    double step = 0.0;
    float gain = 0.0f;

    bool active() const { return env.active(); }
    bool releasing() const { return env.releasing(); }
    float level() const { return env.level(); }
  };

  void apply(int id) {
    if (id == isochronic::kVolume) volume_.set(kit::db_to_gain(param(id)), primed());
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Smoother volume_;
  kit::IdleGate idle_;
};

}  // namespace livemix
