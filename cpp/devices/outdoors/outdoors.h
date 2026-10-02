#pragma once

// Outdoors: living things and small events as an instrument.
//
//   per key (up to 8): one scene of the chosen type, with its own random
//   streams, places in the stereo field and register (from the key)
//                         │
//   out ◄─ soft clip ◄─ volume ◄─ width ◄─ spread ◄─ blur ◄─ air low-pass ◄─ envelope
//
// The scenes are in their own headers, one each.

#include "../../kit/kit.h"
#include "birds.h"
#include "chimes.h"
#include "thunder.h"
#include "stream.h"
#include "frogs.h"
#include "crickets.h"
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
      voice = Voice();  // every scene back to how it was built
      voice.env.set_sample_rate(sr);
      voice.swap.set_time(0.005f, sr);
      voice.swap.snap(1.0f);
      voice.birds.seed(stream);
      voice.chimes.seed(scene::seed_for(stream + 16), scene::seed_for(stream + 17));
      voice.crickets.seed(stream + 24);
      voice.frogs.seed(stream + 32);
      voice.stream.seed(stream + 40);
      voice.thunder.seed(stream + 48);
      stream += 64;
    }
    for (int stage = 0; stage < kStages; ++stage) {
      blur_line_[0][stage].clear();
      blur_line_[1][stage].clear();
      blur_length_[stage] = kit::clamp_int(static_cast<int>(kBlurSeconds[stage] * sr), 1, kLineSize - 4);
    }
    for (int stage = 0; stage < kSpreadStages; ++stage) {
      spread_line_[stage].clear();
      spread_length_[stage] =
          kit::clamp_int(static_cast<int>(kSpreadSeconds[stage] * sr), 1, kLineSize - 4);
    }
    air_[0].reset();
    air_[1].reset();
    clock_.reset(scene::kControlPeriod);
    const float control_rate = sr / static_cast<float>(scene::kControlPeriod);
    density_.set_time(0.03f, control_rate);
    distance_.set_time(0.03f, control_rate);
    movement_.set_time(0.03f, control_rate);
    tone_.set_time(0.03f, control_rate);
    blur_.set_time(0.02f, sr);
    spread_.set_time(0.02f, sr);
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
    // The allpass chains hold 57 ms between them; the hold has to outlast them.
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
          case kBirds:
            voice.birds.tick(l, r);
            break;
          case kCrickets:
            voice.crickets.tick(l, r);
            break;
          case kFrogs:
            voice.frogs.tick(l, r);
            break;
          case kStream:
            voice.stream.tick(l, r);
            break;
          case kThunder:
            voice.thunder.tick(l, r);
            break;
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
      // low-pass, and the same allpass chain on both sides, which blurs every
      // onset without moving it in the image.
      const float fade = fade_.next();
      left = air_[0].lowpass(left * fade);
      right = air_[1].lowpass(right * fade);
      const float blur = blur_.next();
      for (int stage = 0; stage < kStages; ++stage) {
        left = blur_line_[0][stage].process(left, blur_length_[stage], blur);
        right = blur_line_[1][stage].process(right, blur_length_[stage], blur);
      }
      // What the ground and the trees send back arrives from somewhere else:
      // a second, different chain of the middle goes into the difference
      // only, so the sum of left and right never hears it.
      float mid = (left + right) * 0.5f;
      float side = (left - right) * 0.5f;
      float echo = mid;
      for (int stage = 0; stage < kSpreadStages; ++stage) {
        echo = spread_line_[stage].process(echo, spread_length_[stage], kSpreadGain);
      }
      side += echo * spread_.next();
      mid *= mid_.next();
      side *= side_.next();
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
    scene::Birds birds;
    scene::Chimes chimes;
    scene::Thunder thunder;
    scene::Stream stream;
    scene::Frogs frogs;
    scene::Crickets crickets;
    float hz = 220.0f, next_hz = 220.0f;
    float gain = 0.0f, next_gain = 0.0f;
    bool restart = false;

    bool active() const { return env.active(); }
    bool releasing() const { return env.releasing(); }
    float level() const { return env.level(); }
  };

  static constexpr int kStages = 5;
  static constexpr int kSpreadStages = 2;
  static constexpr int kLineSize = 2048;
  // Short and unrelated, so a pulse smears into a wash, not into echoes.
  static constexpr float kBlurSeconds[kStages] = {0.0019f, 0.0031f, 0.0053f, 0.0083f, 0.0131f};
  static constexpr float kSpreadSeconds[kSpreadStages] = {0.0079f, 0.0171f};
  static constexpr float kBlurGain = 0.62f;
  static constexpr float kSpreadGain = 0.55f;
  static constexpr float kSpread = 0.45f;

  // Put a voice at the start of the current type for its key.
  void begin(Voice& voice) {
    switch (kind_) {
      case kBirds:
        voice.birds.start(voice.hz, controls_);
        break;
      case kCrickets:
        voice.crickets.start(voice.hz, controls_);
        break;
      case kFrogs:
        voice.frogs.start(voice.hz, controls_);
        break;
      case kStream:
        voice.stream.start(voice.hz, controls_);
        break;
      case kThunder:
        voice.thunder.start(voice.hz, controls_);
        break;
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

  // Which keys are down, for the scenes that tune to them.
  void survey() {
    controls_.held = 0;
    for (int v = 0; v < kMaxVoices; ++v) {
      const Voice& voice = pool_.voices[v];
      if (!voice.env.active() || voice.env.releasing()) continue;
      controls_.held_hz[controls_.held++] = voice.restart ? voice.next_hz : voice.hz;
    }
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
    survey();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.env.active()) continue;
      if (restart) begin(voice);
      switch (kind_) {
        case kBirds:
          voice.birds.control(controls_);
          break;
        case kCrickets:
          voice.crickets.control(controls_);
          break;
        case kFrogs:
          voice.frogs.control(controls_);
          break;
        case kStream:
          voice.stream.control(controls_);
          break;
        case kThunder:
          voice.thunder.control(controls_);
          break;
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
        blur_.set(kBlurGain * std::sqrt(value), primed());
        spread_.set(kSpread * value, primed());
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
  kit::AllpassDelay<kLineSize> blur_line_[2][kStages];
  kit::AllpassDelay<kLineSize> spread_line_[kSpreadStages];
  int blur_length_[kStages] = {};
  int spread_length_[kSpreadStages] = {};
  kit::Smoother density_, distance_, movement_, tone_;  // advanced on the control clock
  kit::Smoother blur_, spread_, mid_, side_, volume_;
  kit::LinearRamp fade_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  scene::Controls controls_;
  int kind_ = 0;
  int pending_kind_ = 0;
};

}  // namespace livemix
