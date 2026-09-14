#pragma once

#include <cmath>

#include "../../common/dsp_util.h"
#include "../stereo-widener/StereoWidener.h"
#include "FeltMath.h"
#include "FeltReverb.h"
#include "GhostPool.h"
#include "SympatheticBank.h"
#include "VelvetNoise.h"
#include "felt_synth.h"

namespace livemix {

// Parameter ids shared with src/dsp/devices/felt-piano.ts. Keep in sync.
// Felt's percent knobs are 0..1 here (the processor divides by 100); ranges
// and defaults are Felt's (PluginProcessor.cpp:33-71).
enum class FeltPianoParam : int {
  kFelt = 0,        // 0..1    felt moderator, default 0.65
  kHardness = 1,    // 0..1    hammer hardness, default 0.35
  kDetune = 2,      // 0..1    unison detune, default 0.5
  kStiffness = 3,   // 0..2    inharmonicity scale, default 1
  kThump = 4,       // 0..1    hammer thump + strike splash, default 0.5
  kAction = 5,      // 0..1    key action ticks, default 0.4
  kPedalNoise = 6,  // 0..1    damper felt on pedal moves, default 0.4
  kGrit = 7,        // 0..1    parallel drive + close-mic floor, default 0.12
  kResonance = 8,   // 0..1    sympathetic bank amount, default 0.5
  kDamper = 9,      // 0..1    damper speed / half-pedal range, default 0.5
  kReverbMix = 10,  // 0..1    room mix (equal-power inside FeltReverb), default 0.25
  kReverbSize = 11, // 0..1    room size (RT60 0.2..3 s), default 0.3
  kWidth = 12,      // 0..1    StereoWidener width, default 0.5
  kOutputDb = 13,   // -24..12 dB, default 0
  kSustain = 14,    // 0..1    CC64/127: >= 0.5 is down, continuous half-pedal, default 0
  kSostenuto = 15,  // 0..1    CC66: >= 0.5 is down, default 0
  kSoft = 16,       // 0..1    CC67 una corda: >= 0.5 is down, default 0
  kPolyphony = 17,  // 1..32   voices new notes may use (CPU budget), default 32
};

// kkfonie Felt (Felt/Source/PluginProcessor.cpp at 0c4ae88) as a WASM
// instrument on the device ABI plus device_note_on/off. The modal piano,
// hammer, velvet mechanics, ghost pool, sympathetic bank and room are Felt's
// unchanged sources in this directory (SHA-256 in device.json); the
// StereoWidener is the byte-identical copy in ../stereo-widener. This class is
// PluginProcessor::processBlock (:186-290) and updateVoiceParameters (:156-184)
// with juce::Synthesiser replaced by FeltSynth and MIDI CCs by params.
//
// Notes: device_note_on(id, frequency, gain) rounds the frequency to the
// nearest key (MIDI 21..108, A4 = 440 Hz) and uses gain as the MIDI velocity
// 0..1 (0.5 = mf); device_note_off(id) releases that note. Pedals are params
// so automation and modulators can drive them; a sustain transition fires
// Felt's damper-felt burst exactly as CC64 does (:128-144).
//
// Deviations: juce::SmoothedValue -> LinearRamp (5 ms, same semantics); the
// audio input is ignored (an instrument has none; the ABI's input bus is
// cleared every block); after the bus has been exactly silent and the output
// below 1e-9 for kIdleFlushSeconds, the room, sympathetic strings, widener,
// damper-noise filters and grit envelope are reset once so no feedback path
// idles on denormals (Felt relies on ScopedNoDenormals; WASM has no FTZ). The
// output is Felt's: soft-limited to |x| <= 1.
class FeltPianoDevice {
 public:
  static constexpr int kMaxBlockFrames = 2048;
  static constexpr int kMaxPolyphony = FeltSynth::kMaxPolyphony;
  static constexpr int kLowestKey = 21;
  static constexpr int kHighestKey = 108;
  static constexpr float kIdleFlushSeconds = 1.0f;
  static constexpr float kIdleOutputThreshold = 1.0e-9f;

  // juce::LinearSmoothedValue<float> with a 5 ms ramp, advanced per sample.
  struct LinearRamp {
    float current = 0.0f;
    float target = 0.0f;
    float step = 0.0f;
    int steps_to_target = 0;
    int countdown = 0;

    void reset(float sample_rate, float ramp_seconds, float value) {
      steps_to_target = static_cast<int>(std::floor(ramp_seconds * sample_rate));
      current = target = value;
      countdown = 0;
    }
    void set_target(float value) {
      if (value == target) return;
      if (steps_to_target <= 0) {
        current = target = value;
        return;
      }
      target = value;
      countdown = steps_to_target;
      step = (target - current) / static_cast<float>(countdown);
    }
    float next() {
      if (countdown <= 0) return target;
      --countdown;
      current += step;
      return current;
    }
    void snap() {
      current = target;
      countdown = 0;
    }
  };

  void init(float sample_rate);
  void set_param(FeltPianoParam param, float value);
  void note_on(int note_id, float frequency, float gain);
  void note_off(int note_id);

  // The ABI input bus; an instrument ignores it but clears it every block.
  float* in_left() { return in_left_; }
  float* in_right() { return in_right_; }

  void process(int frames);

  const float* out_left() const { return out_left_; }
  const float* out_right() const { return out_right_; }

  // Diagnostics / test hooks.
  static int midi_note_for(float frequency);
  int active_voices() const { return synth_.active_voice_count(); }
  bool sustain_down() const { return sustain_down_; }
  bool sostenuto_down() const { return sostenuto_down_; }
  bool soft_down() const { return soft_down_; }
  bool idle() const { return idle_; }
  float param(FeltPianoParam param) const { return params_[static_cast<int>(param)]; }
  FeltSynth& synth() { return synth_; }
  FeltReverb& reverb() { return reverb_; }

 private:
  static constexpr int kParamCount = 18;
  static constexpr float kRampSeconds = 0.005f;

  void update_voice_parameters();
  void flush_idle_state();
  static float decibels_to_gain(float db) {
    // juce::Decibels::decibelsToGain with the -100 dB floor.
    return db > -100.0f ? std::pow(10.0f, db * 0.05f) : 0.0f;
  }

  float sample_rate_ = 48000.0f;
  float params_[kParamCount] = {};

  FeltSynth synth_;
  GhostPool ghost_pool_;
  SympatheticBank sympathetic_;
  StereoWidener stereo_widener_;
  FeltReverb reverb_;
  VelvetBurst damper_noise_;

  FeltMath::XorShift32 grit_rng_;
  float grit_env_ = 0.0f;
  float grit_noise_lp_ = 0.0f;
  float grit_noise_coeff_ = 0.06f;
  float grit_env_decay_ = 0.9995f;

  float last_applied_width_ = -1.0f;
  float last_output_db_ = -1000.0f;

  LinearRamp sm_grit_, sm_reverb_mix_, sm_width_, sm_output_gain_;

  bool sustain_down_ = false;
  bool sostenuto_down_ = false;
  bool soft_down_ = false;
  bool primed_ = false;

  int idle_frames_ = 0;
  int idle_flush_frames_ = 48000;
  bool idle_ = true;

  float in_left_[kMaxBlockFrames] = {};
  float in_right_[kMaxBlockFrames] = {};
  float out_left_[kMaxBlockFrames] = {};
  float out_right_[kMaxBlockFrames] = {};
};

}  // namespace livemix
