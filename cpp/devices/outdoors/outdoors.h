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

namespace scene = outdoors_scene;

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
    read_controls(false);
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

    read_controls(false);
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
  struct Voice {
    kit::Adsr env;
    kit::LinearRamp swap;  // ducks a stolen voice while its scene is replaced
    scene::Chimes chimes;
    float hz = 220.0f, next_hz = 220.0f;
    float gain = 0.0f, next_gain = 0.0f;
    bool restart = false;

    void reset() {
      env.reset();
      hz = next_hz = 220.0f;
      gain = next_gain = 0.0f;
      restart = false;
    }
    bool active() const { return env.active(); }
    bool releasing() const { return env.releasing(); }
    float level() const { return env.level(); }
  };

  static constexpr int kStages = 3;
  static constexpr int kDiffuserSize = 4096;
  static constexpr float kDiffuserSeconds[2][kStages] = {{0.0043f, 0.0101f, 0.0227f},
                                                         {0.0053f, 0.0119f, 0.0197f}};
  static constexpr float kDiffuserGain = 0.62f;

  // Put a voice at the start of the current type for its key.
  void begin(Voice& voice) {
    switch (kind_) {
      default:
        voice.chimes.start(voice.hz, controls_);
        break;
    }
  }

  // The four scene knobs as they stand, stepped once (on the control clock)
  // or only read (a note that arrives between steps).
  void read_controls(bool advance) {
    controls_.density = advance ? density_.next() : density_.value;
    controls_.distance = advance ? distance_.next() : distance_.value;
    controls_.movement = advance ? movement_.next() : movement_.value;
    controls_.tone = advance ? tone_.next() : tone_.value;
  }

  // Air takes the highs first: a one-pole from 20 kHz (near) to 1.2 kHz.
  void aim_air() {
    const float cutoff = 20000.0f * std::pow(0.06f, controls_.distance);
    for (int c = 0; c < 2; ++c) air_[c].set_cutoff(cutoff, sample_rate());
  }

  // Every 32 samples.
  void control() {
    using namespace outdoors;
    read_controls(true);
    aim_air();

    // A type change waits for the dip to reach silence, then every sounding
    // voice starts the new type.
    bool restart = false;
    if (pending_kind_ != kind_) {
      if (fade_.value <= 0.0f && fade_.remaining == 0) {
        kind_ = pending_kind_;
        fade_.set_target(1.0f);
        restart = true;
      } else {
        fade_.set_target(0.0f);
      }
    }
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.env.active()) continue;
      if (restart) begin(voice);
      switch (kind_) {
        default:
          voice.chimes.control(controls_);
          break;
      }
      voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
    }
  }

  void apply(int id) {
    using namespace outdoors;
    const float value = param(id);
    switch (id) {
      case kType:
        pending_kind_ = kit::clamp_int(static_cast<int>(value + 0.5f), 0, kKinds - 1);
        if (!primed()) kind_ = pending_kind_;
        break;
      case kDensity:
        density_.set(value, primed());
        break;
      case kDistance:
        distance_.set(value, primed());
        diffusion_.set(kDiffuserGain * std::sqrt(value), primed());
        break;
      case kMovement:
        movement_.set(value, primed());
        break;
      case kTone:
        tone_.set(value, primed());
        break;
      case kWidth:
        // Sources are panned, so the fold to mono loses a little: make it up.
        mid_.set(std::sqrt(1.0f + 0.22f * (1.0f - value * value)), primed());
        side_.set(value, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read on the control clock
    }
  }


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
