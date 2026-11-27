#pragma once

// Common Air: every key is a reed, and all the reeds drink from one breath.
//
//                     ┌──────────────── drains ◄──────────────┐
//   lung (breath.h) ─► root pressure ─► small air ─► reed ────┤ (reeds.h)
//    turns over            ▲             of each key   │      │
//                          └── what all reeds let through     │
//                              pushes the root, per sample ◄──┘
//        reed ─► pipe of the key (pipe.h) ─► hands (Cup, Vowel) ─► out
//
// Breath. A single lung, emptied by what is sounding: five keys empty it sooner
// than one. When it is empty the breath turns (Both), is snatched again (Out),
// let go (In), or never ends (Circular). Pressure falls through the breath,
// and with it loudness, brightness and pitch.
//
// Reeds. Each reed has a small air volume that fills from the root, a pressure
// under which it will not sound, and a swing that grows like a real one's: slow
// from next to nothing, fast, then settling. Starve spreads those thresholds
// and filling times over the keys that are down, so the chord goes silent and
// opens again reed by reed; every breath draws the order anew, and the breath
// in runs the other way round.
//
// Share. A new key takes air from the rest for a moment, all keys press on the
// root's mean pressure, and what the reeds draw moves the root at audio rate,
// where each reed feels it through its own small volume: the keys make
// sum and difference tones.
//
// Lock. Two reeds whose pitches lie within 35 cents of a small whole-number
// ratio p:q pull each other by the sine of p a - q b, their phases, as any two
// oscillators on one air do. The pull grows while they stand together and goes
// with the pressure, so a tempered chord beats, slows, stands still, and comes
// loose again as the lung empties.
//
// A lone key is never starved and has no one to lean on: it speaks at once,
// breathes and is in tune.

#include "../../kit/kit.h"
#include "breath.h"
#include "params.gen.h"
#include "pipe.h"
#include "reeds.h"

namespace livemix {

class CommonAir : public kit::DeviceBase<common_air::kNumParams> {
 public:
  static constexpr int kVoices = common_air::kVoices;
  static constexpr int kLanes = common_air::kLanes;

  void init(float sample_rate) {
    using namespace common_air;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    kit::SineTable::init();
    const float sr = this->sample_rate();
    period_ = kit::clamp_int(static_cast<int>(sr / 1500.0f + 0.5f), 4, kMaxChunk);
    dt_ = static_cast<float>(period_) / sr;
    const float control_rate = sr / static_cast<float>(period_);
    pool_.reset();
    bank_.reset();
    bank_.root_coeff = 1.0f - kit::time_to_coeff(1.0f / (kit::kTwoPi * kRootHz), sr);
    for (int v = 0; v < kVoices; ++v) {
      pool_.voices[v] = Voice();
    }
    for (int k = 0; k < kLanes; ++k) {
      lane_[k] = Lane();
      pipe_[k].clear();
    }
    for (kit::Smoother* smoother : list_) smoother->set_time(0.02f, control_rate);
    volume_.set_time(kSmoothingSeconds, sr);
    for (float& field : shape_) field = 0.0f;
    breath_.reset();
    for (int side = 0; side < 2; ++side) {
      rumble_[side].reset();
      rumble_[side].set_cutoff(22.0f, sr);
      for (kit::Svf& f : formant_[side]) f.reset();
      dark_[side].reset();
      dark_[side].set_cutoff(420.0f, sr);
    }
    flap_coeff_ = 1.0f - std::exp(-kit::kTwoPi * 6.0f * dt_);
    bar_step_level_ = 1.0f - kit::time_to_coeff(0.0007f, sr);
    pipe_choice_ = -1;
    pipe_fade_ = 1.0f;
    pairs_ = 0;
    dip_ = dip_target_ = 0.0f;
    in_step_ = 0.0f;
    demand_ = 1.0f;
    vowel_at_ = cup_at_ = 0.0f;
    depth_ = 0.0f;
    company_ = 0.0f;
    breath_seen_ = 0;
    phrases_ = 0;
    listening_ = 0;
    keys_ = 0;
    seconds_ = false;
    piped_ = false;
    root_now_ = 0.0f;
    full_ = 1.0f;
    until_control_ = 0;
    idle_.reset(sr, 0.2f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    snap_controls();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  float meter(int index) const {
    switch (index) {
      case 0: return breath_.air;
      case 1: return breath_.pressure;
      case 2: return static_cast<float>(breath_.way) * breath_.pressure;
      case 3: return in_step_;
      default: return 0.0f;
    }
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kLowestHz, kit::min(kHighestHz, 0.2f * sample_rate()));
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);

    const bool silent = pool_.count_active() == 0;
    bool held = false;
    for (const Voice& voice : pool_.voices) held = held || (voice.active() && !voice.releasing());
    if (silent) {
      until_control_ = 0;
      snap_controls();
      dip_ = dip_target_ = 0.0f;
      in_step_ = 0.0f;
      company_ = 0.0f;
      bank_.root = 0.0f;
      demand_ = 1.0f;
      listening_ = 0;
      full_ = 1.0f;
      // What went on while it fell asleep is forgotten.
      breath_.cheek = 0.0f;
      breath_.count = 8191u * ++phrases_;
    }
    if (!held || static_cast<int>(param(common_air::kBreath) + 0.5f) == Breath::kOnce) {
      breath_.restart(!silent && mode() == Breath::kBoth);
    }
    if (silent) breath_.snap(mode());

    // The id again: at its pitch the same reed is tongued again, at another
    // the one that stands is let go. There is never more than one held.
    int same = -1;
    for (int v = 0; v < kVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (pool_.note_id_of(v) != note_id || !voice.active()) continue;
      const float stands = voice.pending ? voice.next_hz : voice.hz;
      if (std::fabs(stands - frequency) < 1.0e-3f * frequency && same < 0) {
        same = v;
      } else if (voice.pending) {
        voice.pending = false;
        voice.down = false;
      } else {
        voice.down = false;
      }
    }
    if (same >= 0) {
      Voice& voice = pool_.voices[same];
      if (voice.pending) {
        voice.next_gain = gain;
      } else {
        voice.down = true;
        voice.gain = gain;
        tongue(voice);
      }
    } else {
      bool stolen = false;
      const int v = pool_.note_on(note_id, &stolen);
      Voice& voice = pool_.voices[v];
      if (stolen) {
        voice.pending = true;
        voice.next_hz = frequency;
        voice.next_gain = gain;
        voice.down = false;
      } else {
        start(v, frequency, gain);
      }
    }
    dip_target_ = kit::min(0.7f, dip_target_ + 0.6f * (0.3f + 0.7f * gain));
    find_pairs();
  }

  void note_off(int note_id) {
    const int v = pool_.find_held(note_id);
    if (v < 0) return;
    Voice& voice = pool_.voices[v];
    voice.pending = false;
    voice.down = false;
    find_pairs();
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);
    int done = 0;
    while (done < frames) {
      if (until_control_ <= 0) {
        control();
        until_control_ = period_;
      }
      const int count = kit::clamp_int(frames - done, 1, until_control_);
      until_control_ -= count;
      render(done, count);
      done += count;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  using Breath = common_air::Breath;
  using ReedShape = common_air::ReedShape;

  static constexpr int kHarmonics = 20;

  struct Voice {
    bool down = false;     // the key is held
    bool sounding = false; // the voice is in use
    bool pending = false;  // fading out for another note
    float hz = 220.0f, gain = 0.7f;
    float next_hz = 220.0f, next_gain = 0.7f;
    float gate = 0.0f;     // closes the valve: release and steal
    float fade = 1.0f;     // 3 ms ramp at the start and for a steal
    float puff = 0.0f;     // the tongue
    float strike = 0.0f;   // what is left to go into the bar
    float bar = 0.0f;      // how much the bar rings
    float bar_phase = 0.0f;
    float bar_at = 0.0f;
    float glow = 0.0f;     // how far it stands in step with the others
    float rank = 0.0f;     // place among the keys that are down
    float hash = 0.0f;
    float age = 0.0f;      // seconds it has stood open with others
    float peak = 0.0f;
    float noise_low = 0.3f, noise_slow = 0.02f, noise_norm = 1.0f;

    bool active() const { return sounding; }
    bool releasing() const { return !down && !pending; }
    float level() const { return pending ? 10.0f : gate * (0.1f + gain) * (0.2f + swing); }
    float swing = 0.5f;
  };

  struct Lane {
    float phase = 0.0f;    // turns
    float own = 0.0f;      // where in the turn it likes to lock
    float ratio = 1.0f;
    float air = 0.0f;      // pressure in its own small volume
    float swing = 0.0f;    // how far the reed swings
    float pull = 0.0f;     // cents the others pull it by
    float want = 0.0f;     // gathers the pull
    float lean = 0.0f;     // how far the others swing it with them, -1 to 1
    float lean_want = 0.0f;
    float rough = 0.0f;
    float hz = 0.0f;
    float flap = 0.0f, flap_near = 0.0f;  // the unsteady swing of a soft reed
    float level = 0.0f;    // smoothed share of the key's level
    float heard[kHarmonics] = {};  // how loud the pipe lets each harmonic out, squared
    float gl = 0.0f, gr = 0.0f, dl = 0.0f, dr = 0.0f;
    float noise = 0.0f, dnoise = 0.0f;
    float low = 0.0f, round = 0.0f, slow = 0.0f;  // of the breath noise
    kit::Rng white;
    kit::Drift drift;
  };

  struct Pair {
    int a = 0, b = 0;
    float p = 1.0f, q = 1.0f, weight = 1.0f;
    float re = 0.0f, im = 0.0f;
  };

  static constexpr float kLowestHz = 16.0f;
  static constexpr float kHighestHz = 5000.0f;
  static constexpr float kRootHz = 260.0f;
  static constexpr float kVoiceGain = 0.125f;
  static constexpr float kFloor = 1.0e-5f;
  static constexpr int kMaxPairs = 120;
  static constexpr float kDepth = 1.3f;        // how far the root moves a reed at audio rate
  static constexpr float kLockCents = 24.0f;   // half the widest pull of a pair
  static constexpr float kLeanSeconds = 0.9f;  // how long two reeds take to lean in full
  static constexpr float kFadeSeconds = 0.005f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kSwingTime = 5.0f;
  static constexpr float kBandDecay = 5.1f;    // nepers the train has lost at the top of the band
  static constexpr float kMiddleBite = 0.7f;   // where a material is as it comes
  static constexpr float kBarRatio = 6.267f;   // the second bending of a bar fixed at one end

  void apply(int id);
  void snap_controls();
  int mode() const;
  void start(int v, float hz, float gain);
  void tongue(Voice& voice);
  void fit_pipes(int v);
  void find_pairs();
  void control();
  void control_breath();
  void control_lock();
  void control_hands();
  void control_voice(int v, float root);
  float interval() const;
  float wetness() const;
  void listen(int k);
  float held_back() const;
  float hand() const;
  static float wrapped(float turns);
  static float touch_of(float gain);
  static float draw(float place, uint32_t breath);
  void control_lane(int v, int which, float root);
  void render(int at, int count);

  kit::VoicePool<Voice, kVoices> pool_;
  common_air::ReedBank bank_;
  Lane lane_[kLanes];
  common_air::Pipe pipe_[kLanes];
  Breath breath_;
  Pair pair_[kMaxPairs];
  int pairs_ = 0;

  kit::Smoother bite_, body_, vowel_, cup_, beat_, starve_, share_, lock_, sag_, leak_, chiff_, spread_, second_;
  kit::Smoother* const list_[13] = {&bite_,  &body_, &vowel_, &cup_,  &beat_,  &starve_,
                                    &share_, &lock_, &sag_,   &leak_, &chiff_, &spread_,
                                    &second_};
  kit::Smoother volume_;
  int listening_ = 0;
  float comb_[kHarmonics] = {};  // what the two pulses of a reed make of each harmonic, squared
  float shape_[common_air::ReedShape::kFields] = {};  // the reed as it stands, between materials
  float dt_ = 0.001f;
  int period_ = 16;
  int until_control_ = 0;
  int pipe_choice_ = -1;
  float pipe_fade_ = 1.0f, pipe_wet_ = 0.0f, pipe_wet_step_ = 0.0f, pipe_hold_ = 0.0f, pipe_hold_step_ = 0.0f;
  float depth_ = 0.0f, depth_step_ = 0.0f;
  float dip_ = 0.0f, dip_target_ = 0.0f;
  float demand_ = 1.0f;
  float in_step_ = 0.0f;
  float wayness_ = 1.0f;  // 1 out, -1 in, between while it turns
  float round_ = 0.0f;    // 1 in circular breathing
  uint32_t breath_seen_ = 0;
  uint32_t phrases_ = 0;  // notes out of silence
  float root_now_ = 0.0f;
  float company_ = 0.0f;  // 0 for a lone key, 1 for several
  int keys_ = 0;          // lanes to run, a multiple of four
  bool seconds_ = false;
  bool piped_ = false;
  float pipe_wet_to_ = 0.0f, pipe_hold_to_ = 0.0f, depth_to_ = 0.0f, cup_to_ = 0.0f;
  float full_ = 1.0f;
  float turn_ = 1.0f, attack_ = 0.1f, touch_second_ = 1.0f, touch_first_ = 1.0f, bite_curve_ = 1.0f, body_now_ = 0.0f;
  float leak_curve_ = 0.0f, gate_fall_ = 1.0f, gate_rise_ = 1.0f, swing_fall_ = 1.0f;
  float bar_step_level_ = 0.01f, flap_coeff_ = 0.02f;
  float vowel_at_ = 0.0f, cup_at_ = 0.0f, cup_step_ = 0.0f;
  float formant_gain_[3] = {0.0f, 0.0f, 0.0f};
  float bus_left_[common_air::kMaxChunk] = {}, bus_right_[common_air::kMaxChunk] = {};
  kit::DcBlocker rumble_[2];
  kit::Svf formant_[2][3];
  kit::OnePole dark_[2];
  kit::IdleGate idle_;
};

}  // namespace livemix

#include "common_air_control.h"
#include "common_air_render.h"
