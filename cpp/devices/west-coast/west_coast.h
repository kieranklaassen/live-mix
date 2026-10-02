#pragma once

// West Coast: a complex oscillator, a wavefolder and a low-pass gate.
//
//   modulator ──FM──► sine ─► wavefolder ─► low-pass gate ─► pan ─┐
//   (Ratio × note)   (the note)  (Fold, Symmetry)   ▲             ├─► ÷2 ─► Volume ─► soft clip
//                                                   │             │
//   key ─► strike / swell ─► vactrol (fast up, slow down)   (up to 8 voices, at 2× rate)
//
// HEADER_NOTES
//
// The instrument sleeps when no voice sounds.

#include "../../kit/kit.h"
#include "params.gen.h"
#include "wavefolder.h"

namespace livemix {

class WestCoast : public kit::DeviceBase<west_coast::kNumParams> {
 public:
  static constexpr int kMaxVoices = 8;
  static constexpr int kNumRatios = 7;
  static constexpr float kRatios[kNumRatios] = {0.5f, 1.0f, 1.5f, 2.0f, 3.0f, 3.5f, 5.0f};

  void init(float sample_rate) {
    using namespace west_coast;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    rate2_ = 2.0f * sr;
    build_tables();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      voice.pitch_drift.seed(0x51F15EEDu + 7919u * static_cast<uint32_t>(v));
      voice.pitch_drift.set_rate(kPitchDriftHz, sr);
      voice.timbre_drift.seed(0x0BADC0DEu + 104729u * static_cast<uint32_t>(v));
      voice.timbre_drift.set_rate(kTimbreDriftHz, sr);
      voice.dc.set_cutoff(kDcBlockHz, rate2_);
    }
    chance_.seed(0xC0A57A1u);
    for (kit::Halfband2x& half : down_) half.init();
    fold_.set_time(kSmoothingSeconds, sr);
    symmetry_.set_time(kSmoothingSeconds, sr);
    fm_.set_time(kSmoothingSeconds, sr);
    timbre_env_.set_time(kSmoothingSeconds, sr);
    sustain_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    rise_coeff_ = 1.0f - kit::time_to_coeff(kVactrolRiseSeconds, sr);
    open_coeff_ = 1.0f - kit::time_to_coeff(kSmoothingSeconds, sr);
    hold_samples_ = static_cast<int>(kStrikeHoldSeconds * sr) + 1;
    clock_.reset(32);
    // Nothing outlives the gate but the decimator's 63 taps.
    idle_.reset(sr, 0.1f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    using namespace west_coast;
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, 8.0f, kit::min(12000.0f, 0.4f * sample_rate()));
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);

    // The same key again while its voice still rings strikes the same gate
    // again, as a second trigger into one module would: no second copy of
    // the note to beat against.
    int slot = -1;
    for (int v = 0; v < kMaxVoices; ++v) {
      if (pool_.note_id_of(v) == note_id && pool_.voices[v].active()) slot = v;
    }
    bool fresh = false;
    if (slot < 0) {
      bool stolen = false;
      slot = pool_.note_on(note_id, &stolen);
      fresh = !stolen;
    }
    Voice& voice = pool_.voices[slot];
    if (fresh) {
      // A new voice starts from rest. A struck or stolen one keeps running:
      // a jump in phase or level would click.
      voice.phase = 0.0f;
      voice.mod_phase = 0.0f;
      voice.last_sine = 0.0f;
      voice.folder.reset();
      voice.dc.reset();
      voice.gate.reset();
      voice.vactrol = 0.0f;
      voice.last_level = kStartLevel;
      voice.last_gain = 0.0f;
    }
    voice.frequency = frequency;
    voice.increment = frequency / rate2_;
    voice.ratio = kRatios[kit::clamp_int(static_cast<int>(param(kRatio) + 0.5f), 0, kNumRatios - 1)];
    // Keep what FM and the folder add under the top of the band: high notes
    // get a smaller index and fewer folds, and tend to a sine.
    voice.index_limit = kit::max(0.0f, (kFmLimitHz / frequency - 1.0f) / voice.ratio - 2.0f);
    voice.level_limit =
        kStartLevel + (Wavefolder::kFullLevel - kStartLevel) *
                          kit::min(1.0f, std::pow(kFoldLimitHz / frequency, kFoldLimitSlope));

    // Chance: four draws per note whatever the setting, so a sequence is
    // the same every time after init.
    const float chance = param(kChance);
    voice.fold_chance = chance * kChanceFold * chance_.bipolar();
    voice.fm_chance = 1.0f + chance * kChanceFm * chance_.bipolar();
    voice.decay_chance = std::exp2(chance * kChanceDecayOctaves * chance_.bipolar());
    float pan_left, pan_right;
    kit::pan_gains(chance * kChancePan * chance_.bipolar(), &pan_left, &pan_right);
    // Velocity: how hard the gate is struck (louder is brighter) and level.
    voice.strike = kSoftStrike + (1.0f - kSoftStrike) * gain;
    const float amp = (0.45f + 0.55f * gain) * kit::kSqrtHalf * 2.0f;
    voice.target_left = amp * pan_left;
    voice.target_right = amp * pan_right;

    const float attack = param(kAttack);
    voice.quick = attack <= kQuickAttackSeconds;
    voice.ramp = 0.0f;
    voice.ramp_step = 1.0f / kit::max(1.0f, attack * sample_rate());
    voice.ramp_from = voice.vactrol;
    voice.key_down = true;
    voice.stage = kAttack;
    tune(voice);
    if (fresh) {
      voice.open_hz = voice.open_target;
      voice.gain_left = voice.target_left;
      voice.gain_right = voice.target_right;
    }
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held < 0) return;
    Voice& voice = pool_.voices[held];
    voice.key_down = false;
    // A strike always lands; a swell or a held note lets go at once.
    const bool striking = voice.quick && (voice.stage == kAttack || voice.stage == kHold);
    if (!striking) voice.stage = kRelease;
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) control();

      const float fold = fold_.next();
      const float symmetry = symmetry_.next();
      const float fm = fm_.next();
      const float index = kMaxIndex * fm * std::sqrt(fm);
      const float timbre_env = timbre_env_.next();
      const float sustain = sustain_.next();
      float left[2] = {0.0f, 0.0f};
      float right[2] = {0.0f, 0.0f};
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.active()) continue;
        render(voice, fold, symmetry, index, timbre_env, sustain, left, right);
      }
      const float volume = volume_.next() * kVoiceGain;
      out_left_[i] = kit::soft_clip(down_[0].down(left[0], left[1]) * volume);
      out_right_[i] = kit::soft_clip(down_[1].down(right[0], right[1]) * volume);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  enum Stage : int { kOff = 0, kAttack, kHold, kSustain, kRelease };

  struct Voice {
    // Oscillators (phases in cycles, increments per 2× sample).
    float phase = 0.0f;
    float mod_phase = 0.0f;
    float increment = 0.0f;
    float ratio = 2.0f;
    float detune = 1.0f;
    float last_sine = 0.0f;
    west_coast::Wavefolder folder;
    kit::OnePole dc;
    kit::Svf gate;
    // The gate's control: where the key drives it and where the vactrol is.
    int stage = kOff;
    float ramp = 0.0f;
    float ramp_step = 1.0f;
    float ramp_from = 0.0f;
    int hold_left = 0;
    float vactrol = 0.0f;
    float fall = 0.001f;
    // The key: a short strike finishes even if the key has already gone up.
    bool key_down = false;
    bool quick = true;
    // Per note.
    float frequency = 220.0f;
    float strike = 1.0f;
    float level_limit = 1.0f;
    float index_limit = 0.0f;
    float fold_chance = 0.0f;
    float fm_chance = 1.0f;
    float decay_chance = 1.0f;
    float fold_drift = 0.0f;
    float off_level = 0.01f;
    // Smoothed per voice: how far the gate opens, and level times pan.
    float open_hz = 1000.0f, open_target = 1000.0f;
    float gain_left = 0.0f, gain_right = 0.0f;
    float target_left = 0.0f, target_right = 0.0f;
    // Carried between samples so the 2x pair can be interpolated.
    float last_level = 0.0f;
    float last_gain = 0.0f;
    kit::Drift pitch_drift;
    kit::Drift timbre_drift;

    bool active() const { return stage != kOff; }
    bool releasing() const { return !key_down; }
    float level() const { return vactrol; }
  };

  // One note at gain 0.7 peaks near -17 dBFS at the default volume.
  static constexpr float kVoiceGain = 0.55f;

  // Wavefolder. Fold 0 sits inside the folder's linear part (a pure sine);
  // Fold 1 reaches every fold at low notes and fewer the higher the note.
  static constexpr int kTableSize = 128;
  static constexpr float kTableLevel = 8.0f;
  static constexpr float kStartLevel = 0.42f;
  static constexpr float kOvertoneGain = 2.0f;
  static constexpr float kFoldLimitHz = 1000.0f;
  static constexpr float kFoldLimitSlope = 0.9f;
  static constexpr float kSymmetryBase = 0.3f;
  static constexpr float kSymmetrySlope = 0.12f;
  static constexpr float kTimbreEnvRange = 0.6f;
  static constexpr float kDcBlockHz = 15.0f;

  // FM: index in radians at FM 1, and how high its sidebands may reach.
  static constexpr float kMaxIndex = 5.0f;
  static constexpr float kFmLimitHz = 14000.0f;

  // Low-pass gate.
  static constexpr float kVactrolRiseSeconds = 0.0007f;
  static constexpr float kStrikeHoldSeconds = 0.002f;
  // A closing vactrol slows down: its time constant when nearly shut is
  // 1 / kSlowShare times the one it starts with.
  static constexpr float kSlowShare = 0.25f;
  // Sets the vactrol's fall rate so that Decay is the time a mid-keyboard
  // note takes to fall 60 dB.
  static constexpr float kDecayScale = 9.0f;
  // A voice stops once its gate has closed this far below its open level.
  static constexpr float kOffGain = 3.0e-6f;
  static constexpr float kGateCeilingHz = 18000.0f;
  static constexpr float kDarkRatio = 2.0f;
  static constexpr float kDarkFloorHz = 150.0f;
  static constexpr float kDarkCeilingHz = 6000.0f;
  static constexpr float kQuickAttackSeconds = 0.02f;
  static constexpr float kGateQ = 0.8f;
  static constexpr float kSoftStrike = 0.55f;

  // Chance and drift.
  static constexpr float kChanceFold = 0.25f;
  static constexpr float kChanceFm = 0.6f;
  static constexpr float kChanceDecayOctaves = 0.8f;
  static constexpr float kChancePan = 0.8f;
  static constexpr float kPitchDriftHz = 0.23f;
  static constexpr float kTimbreDriftHz = 0.13f;
  static constexpr float kMaxDriftCents = 7.0f;
  static constexpr float kMaxFoldDrift = 0.1f;

  // For a sine of every input level: how much of the folder's output is the
  // fundamental (so it can be taken out and replaced by a steady one), and
  // the gain that keeps the loudness of body plus overtones constant.
  void build_tables() {
    const int steps = 256;
    for (int i = 0; i <= kTableSize; ++i) {
      const double level = static_cast<double>(i) * kTableLevel / kTableSize;
      double first = 0.0, square = 0.0;
      for (int k = 0; k < steps; ++k) {
        const double s = std::sin(1.5707963267948966 * (k + 0.5) / steps);
        const double y = west_coast::Wavefolder::shape(level * s);
        first += y * s;
        square += y * y;
      }
      first *= 2.0 / steps;   // amplitude of the fundamental
      square *= 1.0 / steps;  // mean square
      const double overtones = 2.0 * square - first * first;
      fundamental_[i] = static_cast<float>(first);
      makeup_[i] = static_cast<float>(
          1.0 / std::sqrt(1.0 + kOvertoneGain * kOvertoneGain * (overtones > 0.0 ? overtones : 0.0)));
    }
  }

  // One voice for one output sample: two samples at twice the rate, added
  // to the bus. `index` is the FM depth in radians.
  void render(Voice& voice, float fold, float symmetry, float index, float timbre_env, float sustain,
              float* left, float* right) {
    // Where the key drives the gate.
    float control = 0.0f;
    switch (voice.stage) {
      case kAttack:
        voice.ramp += voice.ramp_step;
        if (voice.ramp >= 1.0f) {
          voice.ramp = 1.0f;
          voice.stage = kHold;
          voice.hold_left = hold_samples_;
        }
        control = voice.ramp_from + (voice.strike - voice.ramp_from) * voice.ramp;
        break;
      case kHold:
        control = voice.strike;
        if (--voice.hold_left <= 0) voice.stage = voice.key_down ? kSustain : kRelease;
        break;
      case kSustain:
        control = voice.strike * sustain;
        break;
      default:
        break;
    }
    // The vactrol follows: up in a millisecond, down fast at first and
    // slower the further it has closed.
    float vactrol = voice.vactrol;
    if (control > vactrol) {
      vactrol += (control - vactrol) * rise_coeff_;
    } else {
      vactrol -= (vactrol - control) * voice.fall * (kSlowShare + (1.0f - kSlowShare) * vactrol);
    }
    voice.vactrol = vactrol;
    if (vactrol < voice.off_level && control < voice.off_level && voice.stage >= kSustain) {
      voice.stage = kOff;
      voice.key_down = false;
      return;
    }

    // Fold: the level the sine enters the folder at, and what the folder
    // does to a sine of that level.
    const float amount = kit::clamp(
        fold + voice.fold_chance + voice.fold_drift + timbre_env * kTimbreEnvRange * vactrol, 0.0f, 1.0f);
    const float level = kStartLevel + amount * (voice.level_limit - kStartLevel);
    const float offset = symmetry * (kSymmetryBase + kSymmetrySlope * level);
    const float position = level * (kTableSize / kTableLevel);
    const int cell = static_cast<int>(position);
    const float fraction = position - static_cast<float>(cell);
    const float fundamental = fundamental_[cell] + (fundamental_[cell + 1] - fundamental_[cell]) * fraction;
    const float makeup = makeup_[cell] + (makeup_[cell + 1] - makeup_[cell]) * fraction;

    // The gate: the vactrol sets how far the low-pass is open (its cutoff
    // falls with the square, so the tone dulls before it fades) and the gain.
    voice.open_hz += (voice.open_target - voice.open_hz) * open_coeff_;
    const float cutoff = kit::min(voice.open_hz * vactrol * vactrol, 0.2f * rate2_);
    kit::Svf& gate = voice.gate;
    gate.g = kit::tan_prewarp(kit::kPi * cutoff / rate2_);
    gate.a1 = 1.0f / (1.0f + gate.g * (gate.g + gate.k));
    gate.a2 = gate.g * gate.a1;
    gate.a3 = gate.g * gate.a2;
    const float gain = vactrol * makeup;
    voice.gain_left += (voice.target_left - voice.gain_left) * open_coeff_;
    voice.gain_right += (voice.target_right - voice.gain_right) * open_coeff_;

    const float increment = voice.increment * voice.detune;
    const float mod_increment = increment * voice.ratio;
    const float deviation = kit::min(index * voice.fm_chance, voice.index_limit) * mod_increment;
    const float level_step = 0.5f * (level - voice.last_level);
    const float gain_step = 0.5f * (gain - voice.last_gain);
    float level_now = voice.last_level;
    float gain_now = voice.last_gain;
    for (int s = 0; s < 2; ++s) {
      level_now += level_step;
      gain_now += gain_step;
      // Through-zero linear FM: the modulator adds to the frequency, and
      // the phase runs backwards when the sum goes negative.
      const float modulator = kit::SineTable::lookup(voice.mod_phase);
      voice.mod_phase += mod_increment;
      voice.mod_phase -= std::floor(voice.mod_phase);
      voice.phase += increment + deviation * modulator;
      voice.phase -= std::floor(voice.phase);
      const float sine = kit::SineTable::lookup(voice.phase);
      // The folder returns the mean of its curve over the step, so the sine
      // it is compared with is the mean over the same step.
      const float mean_sine = 0.5f * (sine + voice.last_sine);
      voice.last_sine = sine;
      const float folded = voice.folder.process(level_now * sine + offset);
      // A steady sine as the body, the folder's overtones on top.
      const float tone = mean_sine + kOvertoneGain * (folded - fundamental * mean_sine);
      const float out = gate.lowpass(voice.dc.highpass(tone)) * gain_now;
      left[s] += out * voice.gain_left;
      right[s] += out * voice.gain_right;
    }
    voice.last_level = level;
    voice.last_gain = gain;
  }

  // Every 32 samples: drift, and what follows Decay and Colour.
  void control() {
    using namespace west_coast;
    const float drift = param(kDrift);
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.active()) continue;
      voice.detune = kit::cents_to_ratio(drift * kMaxDriftCents * voice.pitch_drift.next(32));
      voice.fold_drift = drift * kMaxFoldDrift * voice.timbre_drift.next(32);
      tune(voice);
    }
  }

  // A voice's gate from Decay and Colour.
  void tune(Voice& voice) {
    using namespace west_coast;
    voice.fall = kit::min(0.5f, kDecayScale / (param(kDecay) * voice.decay_chance * sample_rate()));
    // Colour 0 opens the gate to just above the note; Colour 1 opens it
    // all the way whatever the note.
    const float dark = kit::clamp(kDarkRatio * voice.frequency, kDarkFloorHz, kDarkCeilingHz);
    voice.open_target = dark * std::pow(kGateCeilingHz / dark, param(kColour));
    // The closed gate passes the note at about (open·v²/f)² · v: stop the
    // voice when that is kOffGain.
    const float ratio = voice.frequency / voice.open_target;
    voice.off_level = kit::clamp(std::pow(kOffGain * ratio * ratio, 0.2f), 1.0e-3f, 0.05f);
  }

  void apply(int id) {
    using namespace west_coast;
    const float value = param(id);
    switch (id) {
      case kFold:
        fold_.set(value, primed());
        break;
      case kSymmetry:
        symmetry_.set(value, primed());
        break;
      case kFm:
        fm_.set(value, primed());
        break;
      case kTimbreEnv:
        timbre_env_.set(value, primed());
        break;
      case kSustain:
        sustain_.set(value, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read at note-on or on the control clock
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Halfband2x down_[2];
  kit::Smoother fold_, symmetry_, fm_, timbre_env_, sustain_, volume_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  kit::Rng chance_;
  float rate2_ = 96000.0f;
  float rise_coeff_ = 0.02f;
  float open_coeff_ = 0.004f;
  int hold_samples_ = 96;
  float fundamental_[kTableSize + 1] = {};
  float makeup_[kTableSize + 1] = {};
};

}  // namespace livemix
