#pragma once

// Outdoors: living things and small events as an instrument.
//
//   per key (up to 8): one scene of the chosen type, with its own random
//   streams, its own places in the stereo field and a register from the key
//                         │
//   out ◄─ soft clip ◄─ volume ◄─ width ◄─ spread ◄─ blur ◄─ air low-pass ◄─ envelope
//
// The scenes, one header each:
//
//   Birds     up to six birds a key, of eight species: a tone that sweeps and
//             trills in syllables, arranged by a grammar (motif, repeats,
//             pauses, long silences, another bird). The key shifts the
//             register by a third of an octave per octave.
//   Crickets  up to six a key: pulses of a 4.5 kHz tone, three or four to a
//             chirp, each individual at its own pitch and rate. A higher key
//             is a warmer night: higher and quicker.
//   Frogs     up to five a key: pulse trains through three formants; two
//             croakers that call and answer, a peeper, a triller, a deep one.
//             A lower key is a bigger frog.
//   Stream    bubbles: damped sines whose pitch rises as they decay, shed at
//             four places, over a soft rush of noise. A lower key is deeper
//             water.
//   Thunder   a stroke every 10 to 60 s: hundreds of arrivals kicking the
//             envelopes of four bands of noise. A lower key is a deeper storm.
//   Chimes    six tubes on the major pentatonic of the key, four bar partials
//             each, struck by a clapper that the wind swings. With several
//             keys down the tubes that would clash with the chord stay quiet.
//
// - Density is how many sources a key has and how often they sound; Movement
//   is how far a slow random wave (never a cycle) takes the scene up and
//   down; Tone leans the colour of whatever the scene is made of.
// - Sources are panned, not doubled: left and right are in phase and the sum
//   of the two is always the whole scene. Distance closes a one-pole low-pass
//   (20 kHz near, 2 kHz far), raises the feedback of five allpass stages that
//   are the same on both sides (the blur), and feeds a second, different
//   allpass pair of the middle into the difference only (the spread: what
//   comes back off the ground arrives from elsewhere, and mono never hears
//   it). The stages are always in the path, so nothing jumps as it turns.
// - Every random source is seeded in init(), each from its own hashed seed;
//   a key's scene carries on from where its voice's streams are, so no two
//   presses and no two keys play the same thing.
// - Changing Type while keys are down dips the output for 20 ms around the
//   switch. A stolen voice ducks for 5 ms while its scene is replaced.

#include "../../kit/kit.h"
#include "birds.h"
#include "chimes.h"
#include "crickets.h"
#include "frogs.h"
#include "params.gen.h"
#include "scene.h"
#include "stream.h"
#include "thunder.h"

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
    air_distance_ = -1.0f;
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
    survey();
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
    scene::Crickets crickets;
    scene::Frogs frogs;
    scene::Stream stream;
    scene::Thunder thunder;
    scene::Chimes chimes;
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

  // Air takes the highs first: a one-pole from 20 kHz (near) to 2 kHz.
  void aim_air() {
    if (controls_.distance == air_distance_) return;
    air_distance_ = controls_.distance;
    const float cutoff = 20000.0f * std::pow(0.1f, controls_.distance);
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
  float air_distance_ = -1.0f;
  int kind_ = 0;
  int pending_kind_ = 0;
};

}  // namespace livemix
