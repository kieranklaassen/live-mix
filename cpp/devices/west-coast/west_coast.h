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
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    rate2_ = 2.0f * sr;
    inverse_rate2_ = 1.0f / rate2_;
    dc_coeff_ = 1.0f - kit::time_to_coeff(1.0f / (kit::kTwoPi * kDcBlockHz), rate2_);
    kit::SineTable::init();  // for kit::Drift
    curve_.init();
    build_tables();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      voice.pitch_drift.seed(0x51F15EEDu + 7919u * static_cast<uint32_t>(v));
      voice.pitch_drift.set_rate(kPitchDriftHz, sr);
      voice.timbre_drift.seed(0x0BADC0DEu + 104729u * static_cast<uint32_t>(v));
      voice.timbre_drift.set_rate(kTimbreDriftHz, sr);
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
    open_coeff_ = 1.0f - kit::time_to_coeff(kSmoothingSeconds, sr / kSlowPeriod);
    hold_samples_ = static_cast<int>(kStrikeHoldSeconds * sr) + 1;
    colour_coeff_ = 1.0f - kit::time_to_coeff(kColourSeconds, sr / kControlPeriod);
    until_control_ = 0;
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
    // The control clock starts with the first note out of silence, so what
    // is played does not depend on how long the instrument sat idle.
    if (pool_.count_active() == 0) {
      until_control_ = 0;
      colour_ = param(kColour);
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
      voice.dc = 0.0f;
      voice.ic1 = 0.0f;
      voice.ic2 = 0.0f;
      voice.vactrol = 0.0f;
      voice.last_gain = 0.0f;
    }
    voice.frequency = frequency;
    voice.increment = frequency / rate2_;
    voice.ratio = kRatios[kit::clamp_int(static_cast<int>(param(kRatio) + 0.5f), 0, kNumRatios - 1)];
    // Keep FM's sidebands under the top of the band: high notes get a
    // smaller index. (The folder's own limit is in aim().)
    voice.index_limit = kit::max(0.0f, (kFmLimitHz / frequency - 1.0f) / voice.ratio - 2.0f);
    voice.fold_reach = frequency / kFoldLimitHz;
    voice.fold_span = (FoldCurve::kFullLevel - kStartLevel) *
                      kit::clamp((kFoldEndHz - frequency) / (kFoldEndHz - kFoldFadeHz), 0.0f, 1.0f);

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
    voice.stage = kStageStrike;
    tune(voice);
    if (fresh) snap(voice);
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held < 0) return;
    Voice& voice = pool_.voices[held];
    voice.key_down = false;
    // A strike always lands; a swell or a held note lets go at once.
    const bool striking = voice.quick && (voice.stage == kStageStrike || voice.stage == kStageHold);
    if (!striking) voice.stage = kStageRelease;
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    int done = 0;
    while (done < frames) {
      // Work in chunks that end on the control clock, so the audio is the
      // same whatever the host's block size.
      if (until_control_ <= 0) {
        control();
        until_control_ = kControlPeriod;
      }
      const int count = frames - done < until_control_ ? frames - done : until_control_;
      until_control_ -= count;
      for (int i = 0; i < count; ++i) {
        fold_buf_[i] = fold_.next();
        symmetry_buf_[i] = symmetry_.next();
        const float fm = fm_.next();
        index_buf_[i] = kMaxIndex * fm * std::sqrt(fm);
        timbre_buf_[i] = timbre_env_.next();
        sustain_buf_[i] = sustain_.next();
      }
      for (int i = 0; i < 2 * count; ++i) {
        bus_left_[i] = 0.0f;
        bus_right_[i] = 0.0f;
      }
      for (int v = 0; v < kMaxVoices; ++v) {
        if (pool_.voices[v].active()) render(pool_.voices[v], count);
      }
      for (int i = 0; i < count; ++i) {
        const float volume = volume_.next() * kVoiceGain;
        out_left_[done + i] = kit::soft_clip(down_[0].down(bus_left_[2 * i], bus_left_[2 * i + 1]) * volume);
        out_right_[done + i] = kit::soft_clip(down_[1].down(bus_right_[2 * i], bus_right_[2 * i + 1]) * volume);
      }
      done += count;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  enum Stage : int { kStageOff = 0, kStageStrike, kStageHold, kStageSustain, kStageRelease };

  struct Voice {
    // Oscillators (phases in cycles, increments per 2× sample).
    float phase = 0.0f;
    float mod_phase = 0.0f;
    float increment = 0.0f;
    float ratio = 2.0f;
    float detune = 1.0f;
    float last_sine = 0.0f;
    west_coast::Wavefolder folder;
    // DC blocker and the gate's low-pass (two integrator states).
    float dc = 0.0f;
    float ic1 = 0.0f, ic2 = 0.0f;
    // Fold, ramped between the points steer() sets.
    int steer_in = 0;
    float drive = 0.42f, drive_step = 0.0f;
    float offset = 0.0f, offset_step = 0.0f;
    float fundamental = 0.42f, fundamental_step = 0.0f;
    float makeup = 1.0f, makeup_step = 0.0f;
    // The gate's control: where the key drives it and where the vactrol is.
    int stage = kStageOff;
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
    float fold_span = 1.0f;
    float fold_reach = 1.0f;
    float index_limit = 0.0f;
    float fold_chance = 0.0f;
    float fm_chance = 1.0f;
    float decay_chance = 1.0f;
    float fold_drift = 0.0f;
    // Smoothed per voice: how far the gate opens, and level times pan.
    float open_hz = 1000.0f, open_target = 1000.0f;
    float gain_left = 0.0f, gain_right = 0.0f;
    float target_left = 0.0f, target_right = 0.0f;
    // Carried between samples so the 2x pair can be interpolated.
    float last_drive = 0.0f;
    float last_gain = 0.0f;
    kit::Drift pitch_drift;
    kit::Drift timbre_drift;

    bool active() const { return stage != kStageOff; }
    bool releasing() const { return !key_down; }
    float level() const { return vactrol; }
  };

  // One note at gain 0.7 peaks near -17 dBFS at the default volume.
  static constexpr float kVoiceGain = 0.55f;

  // Wavefolder. Fold 0 sits inside the folder's linear part (a pure sine);
  // Fold 1 reaches every fold at low notes and fewer the higher the note.
  static constexpr int kLevelSteps = 96;
  static constexpr int kOffsetSteps = 16;
  static constexpr float kTableLevel = 6.6f;
  static constexpr float kTableOffset = 1.12f;
  static constexpr float kStartLevel = 0.42f;
  static constexpr float kOvertoneGain = 2.0f;
  static constexpr float kFoldLimitHz = 600.0f;
  static constexpr float kFoldFadeHz = 4000.0f;
  static constexpr float kFoldEndHz = 8000.0f;
  static constexpr float kSymmetryBase = 0.3f;
  static constexpr float kSymmetrySlope = 0.12f;
  static constexpr float kTimbreEnvRange = 0.6f;
  static constexpr float kDcBlockHz = 15.0f;

  // FM: index in radians at FM 1, and how high its sidebands may reach.
  static constexpr float kMaxIndex = 4.0f;
  // How much of FM's frequency swing counts against the folder's level.
  static constexpr float kFmReach = 1.0f;
  static constexpr float kFmLimitHz = 14000.0f;

  // Low-pass gate.
  static constexpr float kVactrolRiseSeconds = 0.0007f;
  static constexpr float kStrikeHoldSeconds = 0.002f;
  // A closing vactrol slows down: its time constant when nearly shut is
  // 1 / kSlowShare times the one it starts with.
  static constexpr float kSlowShare = 0.25f;
  // Sets the vactrol's fall rate so that Decay is the time a mid-keyboard
  // note takes to fall 60 dB.
  static constexpr float kDecayScale = 21.0f;
  // A voice stops once its gate has closed this far (-72 dB).
  static constexpr float kOffLevel = 2.5e-4f;
  // The gate never closes below the note itself: the tail of a note is its
  // bare sine, fading.
  static constexpr float kGateFloor = 1.0f;
  static constexpr float kGateCeilingHz = 18000.0f;
  static constexpr float kDarkRatio = 2.0f;
  static constexpr float kDarkFloorHz = 150.0f;
  static constexpr float kDarkCeilingHz = 6000.0f;
  static constexpr float kQuickAttackSeconds = 0.02f;
  static constexpr float kColourSeconds = 0.03f;
  static constexpr float kGateDamping = 1.25f;  // 1 / Q
  static constexpr float kGateLimit = 0.2f;     // of the 2x rate
  static constexpr int kSlowPeriod = 4;
  static constexpr int kControlPeriod = 32;
  static constexpr float kSoftStrike = 0.55f;

  // Chance and drift.
  static constexpr float kChanceFold = 0.25f;
  static constexpr float kChanceFm = 0.5f;
  static constexpr float kChanceDecayOctaves = 0.8f;
  static constexpr float kChancePan = 0.8f;
  static constexpr float kPitchDriftHz = 0.23f;
  static constexpr float kTimbreDriftHz = 0.13f;
  static constexpr float kMaxDriftCents = 7.0f;
  static constexpr float kMaxFoldDrift = 0.1f;

  // For a sine of every input level and offset: how much of the folder's
  // output is the fundamental (so it can be taken out and replaced by a
  // steady one), and the gain that keeps the loudness of body plus
  // overtones constant. With an offset the output is still made of sines of
  // the odd and cosines of the even harmonics, so the fundamental stays in
  // phase with the input.
  void build_tables() {
    static constexpr int kSteps = 128;
    double sines[kSteps];
    for (int k = 0; k < kSteps; ++k) {
      sines[k] = std::sin(3.14159265358979323846 * ((k + 0.5) / kSteps - 0.5));
    }
    for (int j = 0; j <= kOffsetSteps; ++j) {
      const double offset = static_cast<double>(j) * kTableOffset / kOffsetSteps;
      for (int i = 0; i <= kLevelSteps; ++i) {
        const double level = static_cast<double>(i) * kTableLevel / kLevelSteps;
        double first = 0.0, square = 0.0, mean = 0.0;
        for (int k = 0; k < kSteps; ++k) {
          const double y = curve_.shape(level * sines[k] + offset);
          first += y * sines[k];
          square += y * y;
          mean += y;
        }
        first *= 2.0 / kSteps;   // amplitude of the fundamental
        square *= 1.0 / kSteps;  // mean square
        mean *= 1.0 / kSteps;    // DC, which the voice blocks
        const double overtones = 2.0 * (square - mean * mean) - first * first;
        table_[j][i][0] = static_cast<float>(first);
        table_[j][i][1] = static_cast<float>(
            1.0 / std::sqrt(1.0 + kOvertoneGain * kOvertoneGain * (overtones > 0.0 ? overtones : 0.0)));
      }
    }
  }

  // sin(2π·phase) for a phase in [0, 1], without a table: a table read
  // needs a float-to-integer conversion, which costs several times this
  // polynomial in WebAssembly. Folded onto a quarter cycle as a cosine of
  // z = 1/4 − |phase − 1/2|, even in z. The carrier's fit is good to 6e-8
  // (below float rounding); the modulator's to 1e-5, which only ever bends
  // the pitch.
  static float carrier_sine(float phase) {
    const float z = 0.25f - std::fabs(phase - 0.5f);
    const float u = z * z;
    const float cosine =
        1.0f + u * (-19.7391792f + u * (64.9348952f + u * (-85.2436265f + u * 56.2430199f)));
    return std::copysign(cosine, 0.5f - phase);
  }
  static float modulator_sine(float phase) {
    const float z = 0.25f - std::fabs(phase - 0.5f);
    const float u = z * z;
    const float cosine = 1.0f + u * (-19.7363455f + u * (64.6701907f + u * -78.2186439f));
    return std::copysign(cosine, 0.5f - phase);
  }

  // Where a voice's fold is heading: the level the sine enters the folder
  // at, the offset Symmetry adds, and what the folder does to a sine of
  // that level (two table reads). Worked out every kSlowPeriod samples and
  // ramped in between.
  struct FoldPoint {
    float level, offset, fundamental, makeup;
  };

  FoldPoint aim(const Voice& voice, float fold, float symmetry, float index, float timbre_env,
                float vactrol) const {
    const float amount = kit::clamp(
        fold + voice.fold_chance + voice.fold_drift + timbre_env * kTimbreEnvRange * vactrol, 0.0f, 1.0f);
    // What the folder adds reaches as far up as the note is high, the sine
    // is driven hard and FM swings its frequency: the level Fold 1 stands
    // for shrinks with the first and the last, so high notes and deep FM
    // get fewer folds and nothing lands above the band.
    const float swing = 1.0f + kFmReach * voice.ratio * kit::min(index * voice.fm_chance, voice.index_limit);
    const float span = voice.fold_span / kit::max(1.0f, voice.fold_reach * swing);
    FoldPoint point;
    // Fold to the power 1.5: the first half of the knob is the first two folds.
    point.level = kStartLevel + amount * std::sqrt(amount) * span;
    point.offset = symmetry * (kSymmetryBase + kSymmetrySlope * point.level);
    const float x = point.level * (kLevelSteps / kTableLevel);
    const float y = point.offset * (kOffsetSteps / kTableOffset);
    const int i = kit::clamp_int(static_cast<int>(x), 0, kLevelSteps - 1);
    const int j = kit::clamp_int(static_cast<int>(y), 0, kOffsetSteps - 1);
    const float fx = x - static_cast<float>(i);
    const float fy = y - static_cast<float>(j);
    float read[2];
    for (int t = 0; t < 2; ++t) {
      const float low = table_[j][i][t] + (table_[j][i + 1][t] - table_[j][i][t]) * fx;
      const float high = table_[j + 1][i][t] + (table_[j + 1][i + 1][t] - table_[j + 1][i][t]) * fx;
      read[t] = low + (high - low) * fy;
    }
    point.fundamental = read[0];
    point.makeup = read[1];
    return point;
  }

  // A new voice starts on its point instead of gliding to it.
  void snap(Voice& voice) {
    const float fm = fm_.value;
    const FoldPoint point =
        aim(voice, fold_.value, symmetry_.value, kMaxIndex * fm * std::sqrt(fm), timbre_env_.value, voice.vactrol);
    voice.drive = point.level;
    voice.offset = point.offset;
    voice.fundamental = point.fundamental;
    voice.makeup = point.makeup;
    voice.last_drive = point.level;
    voice.drive_step = voice.offset_step = voice.fundamental_step = voice.makeup_step = 0.0f;
    voice.steer_in = 0;
    voice.open_hz = voice.open_target;
    voice.gain_left = voice.target_left;
    voice.gain_right = voice.target_right;
  }

  // One voice for `count` output samples (two samples at twice the rate
  // each), added to the bus. The voice's state lives in locals for the
  // length of the chunk.
  void render(Voice& voice, int count) {
    int stage = voice.stage;
    int hold_left = voice.hold_left;
    int steer_in = voice.steer_in;
    float ramp = voice.ramp;
    float vactrol = voice.vactrol;
    float drive = voice.drive, drive_step = voice.drive_step;
    float offset = voice.offset, offset_step = voice.offset_step;
    float fundamental = voice.fundamental, fundamental_step = voice.fundamental_step;
    float makeup = voice.makeup, makeup_step = voice.makeup_step;
    float open_hz = voice.open_hz;
    float gain_left = voice.gain_left, gain_right = voice.gain_right;
    float last_drive = voice.last_drive, last_gain = voice.last_gain;
    float phase = voice.phase, mod_phase = voice.mod_phase, last_sine = voice.last_sine;
    float dc = voice.dc, ic1 = voice.ic1, ic2 = voice.ic2;
    west_coast::Wavefolder folder = voice.folder;
    const float strike = voice.strike;
    const float fall = voice.fall;
    const float floor_hz = kGateFloor * voice.frequency;
    const float increment = voice.increment * voice.detune;
    const float mod_increment = increment * voice.ratio;
    const float fm_scale = voice.fm_chance * mod_increment;
    const float fm_limit = voice.index_limit * mod_increment;
    const float gate_limit = kGateLimit * rate2_;
    const float w_scale = kit::kPi * inverse_rate2_;

    for (int i = 0; i < count; ++i) {
      // Where the key drives the gate.
      float control = 0.0f;
      if (stage == kStageSustain) {
        control = strike * sustain_buf_[i];
      } else if (stage == kStageStrike) {
        ramp += voice.ramp_step;
        if (ramp >= 1.0f) {
          ramp = 1.0f;
          stage = kStageHold;
          hold_left = hold_samples_;
        }
        control = voice.ramp_from + (strike - voice.ramp_from) * ramp;
      } else if (stage == kStageHold) {
        control = strike;
        if (--hold_left <= 0) stage = voice.key_down ? kStageSustain : kStageRelease;
      }
      // The vactrol follows: up in a millisecond, down fast at first and
      // slower the further it has closed.
      if (control > vactrol) {
        vactrol += (control - vactrol) * rise_coeff_;
      } else {
        vactrol -= (vactrol - control) * fall * (kSlowShare + (1.0f - kSlowShare) * vactrol);
      }
      if (vactrol < kOffLevel && control < kOffLevel && stage >= kStageSustain) {
        stage = kStageOff;
        voice.key_down = false;
        break;
      }

      if (steer_in <= 0) {
        const FoldPoint point = aim(voice, fold_buf_[i], symmetry_buf_[i], index_buf_[i], timbre_buf_[i], vactrol);
        const float per_sample = 1.0f / kSlowPeriod;
        drive_step = (point.level - drive) * per_sample;
        offset_step = (point.offset - offset) * per_sample;
        fundamental_step = (point.fundamental - fundamental) * per_sample;
        makeup_step = (point.makeup - makeup) * per_sample;
        // Colour, and level and pan after a second strike, glide in 5 ms.
        open_hz += (voice.open_target - open_hz) * open_coeff_;
        gain_left += (voice.target_left - gain_left) * open_coeff_;
        gain_right += (voice.target_right - gain_right) * open_coeff_;
        steer_in = kSlowPeriod;
      }
      --steer_in;
      drive += drive_step;
      offset += offset_step;
      fundamental += fundamental_step;
      makeup += makeup_step;

      // The gate: the vactrol sets how far the low-pass is open (its cutoff
      // falls with the square, so the tone dulls before it fades) and the
      // gain. A trapezoidal state-variable low-pass, its tangent by the
      // same Padé form as kit::tan_prewarp, with one division for all of it.
      const float w = w_scale * kit::min(floor_hz + open_hz * vactrol * vactrol, gate_limit);
      const float w2 = w * w;
      const float n = w * (15.0f - w2);
      const float d = 15.0f - 6.0f * w2;
      const float scale = 1.0f / (d * d + n * (n + kGateDamping * d));
      const float a1 = d * d * scale;
      const float a2 = n * d * scale;
      const float a3 = n * n * scale;
      // (Less kOffLevel, so a voice lands on silence when it stops.)
      const float gain = kit::max(0.0f, vactrol - kOffLevel) * makeup;

      const float deviation = kit::min(index_buf_[i] * fm_scale, fm_limit);
      const float level_step = 0.5f * (drive - last_drive);
      const float gain_step = 0.5f * (gain - last_gain);
      float level_now = last_drive;
      float gain_now = last_gain;
      for (int s = 0; s < 2; ++s) {
        level_now += level_step;
        gain_now += gain_step;
        // Through-zero linear FM: the modulator adds to the frequency, and
        // the phase runs backwards when the sum goes negative. A step is
        // always shorter than a cycle, so one wrap each way is enough.
        float step = increment;
        if (deviation != 0.0f) {
          step += deviation * modulator_sine(mod_phase);
          mod_phase += mod_increment;
          if (mod_phase >= 1.0f) mod_phase -= 1.0f;
        }
        phase += step;
        if (phase >= 1.0f) phase -= 1.0f;
        if (phase < 0.0f) phase += 1.0f;
        const float sine = carrier_sine(phase);
        // The folder returns the mean of its curve over the step, so the
        // sine it is compared with is the mean over the same step.
        const float mean_sine = 0.5f * (sine + last_sine);
        last_sine = sine;
        const float folded = folder.process(curve_, level_now * sine + offset);
        // A steady sine as the body, the folder's overtones on top.
        const float tone = mean_sine + kOvertoneGain * (folded - fundamental * mean_sine);
        // DC block (Symmetry's offset), then the gate's low-pass.
        dc += (tone - dc) * dc_coeff_;
        const float v3 = tone - dc - ic2;
        const float v1 = a1 * ic1 + a2 * v3;
        const float v2 = ic2 + a2 * ic1 + a3 * v3;
        ic1 = 2.0f * v1 - ic1;
        ic2 = 2.0f * v2 - ic2;
        const float out = v2 * gain_now;
        bus_left_[2 * i + s] += out * gain_left;
        bus_right_[2 * i + s] += out * gain_right;
      }
      last_drive = drive;
      last_gain = gain;
    }

    voice.stage = stage;
    voice.hold_left = hold_left;
    voice.steer_in = steer_in;
    voice.ramp = ramp;
    voice.vactrol = vactrol;
    voice.drive = drive;
    voice.drive_step = drive_step;
    voice.offset = offset;
    voice.offset_step = offset_step;
    voice.fundamental = fundamental;
    voice.fundamental_step = fundamental_step;
    voice.makeup = makeup;
    voice.makeup_step = makeup_step;
    voice.open_hz = open_hz;
    voice.gain_left = gain_left;
    voice.gain_right = gain_right;
    voice.last_drive = last_drive;
    voice.last_gain = last_gain;
    voice.phase = phase;
    voice.mod_phase = mod_phase;
    voice.last_sine = last_sine;
    voice.dc = flush_denormal(dc);
    voice.ic1 = flush_denormal(ic1);
    voice.ic2 = flush_denormal(ic2);
    voice.folder = folder;
  }


  // Every 32 samples: drift, and what follows Decay and Colour.
  void control() {
    using namespace west_coast;
    const float drift = param(kDrift);
    // Colour moves the gate over six octaves: it glides, in octaves.
    colour_ += (param(kColour) - colour_) * colour_coeff_;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.active()) continue;
      voice.detune = kit::cents_to_ratio(drift * kMaxDriftCents * voice.pitch_drift.next(kControlPeriod));
      voice.fold_drift = drift * kMaxFoldDrift * voice.timbre_drift.next(kControlPeriod);
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
    voice.open_target = dark * std::pow(kGateCeilingHz / dark, colour_);
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
      case kColour:
        if (!primed()) colour_ = value;
        break;
      default:
        break;  // read at note-on or on the control clock
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Halfband2x down_[2];
  kit::Smoother fold_, symmetry_, fm_, timbre_env_, sustain_, volume_;
  int until_control_ = 0;
  // One chunk (up to a control period) of the smoothed controls and of the 2x bus.
  float fold_buf_[kControlPeriod] = {}, symmetry_buf_[kControlPeriod] = {}, index_buf_[kControlPeriod] = {};
  float timbre_buf_[kControlPeriod] = {}, sustain_buf_[kControlPeriod] = {};
  float bus_left_[2 * kControlPeriod] = {}, bus_right_[2 * kControlPeriod] = {};
  kit::IdleGate idle_;
  kit::Rng chance_;
  float rate2_ = 96000.0f;
  float rise_coeff_ = 0.02f;
  float open_coeff_ = 0.004f;
  float colour_ = 0.6f;
  float colour_coeff_ = 0.02f;
  int hold_samples_ = 96;
  west_coast::FoldCurve curve_;
  // [offset][level]{fundamental, makeup}
  float table_[kOffsetSteps + 1][kLevelSteps + 1][2] = {};
  float inverse_rate2_ = 1.0f / 96000.0f;
  float dc_coeff_ = 0.001f;
};

}  // namespace livemix
