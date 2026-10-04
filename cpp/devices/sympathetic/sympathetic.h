#pragma once

// Sympathetic: a reverb made of tuned strings, ported from kkfonie's
// Sympathetic plugin. Virtual strings ring in sympathy with what is played,
// like a piano with the sustain pedal held or the drone strings of a sitar.
//
//   in ─┬───────────────────────────────────────────────────────────► dry ─┐
//       │                                                                  (+)─► out
//       └─► mono ─┬─► × Sympathy ─► 4..16 strings ─► soft limit ─► widener ─┘
//                 │                     ▲                          (wet only)
//                 └─► pitch detector ─► tuning (Root, Mode, last note heard)
//
// - Each string is a Karplus-Strong comb (tuned_comb_filter.h) tuned to a
//   note of the scale (scale_mapper.h) and panned by its place in the bank
//   (resonator_bank.h). A string only builds up when the input holds energy
//   at one of its harmonics, which is what makes the tail harmonic.
// - A YIN detector (yin_pitch_detector.h) listens to the dry input. A note
//   held for three windows in a row (about 130 ms) moves the strings to that
//   note's octave; in Learn mode it also joins the scale the strings are
//   tuned to (scale_learner.h). The plugin ran the detector on the message
//   thread; here its three steps run 128 samples apart inside process(), on a
//   count of samples, so no block carries more than one FFT and the result
//   does not depend on the block size.
// - Width does two things, as in the plugin: it spreads the strings across
//   the stereo field and drives the shared StereoWidener on the wet signal.
// - Every retune crossfades, so a new note, a new Root or a different number
//   of strings never clicks.
// - The strings are corrected against the plugin's (tuned_comb_filter.h):
//   they ring at the notes they are named for and for as long as Decay says.
//   That is what makes the bank selective, and it is why the drive into the
//   strings is lower here (kStringDrive below).

#include "../../kit/kit.h"
#include "../stereo-widener/StereoWidener.h"
#include "params.gen.h"
#include "resonator_bank.h"
#include "scale_learner.h"
#include "scale_mapper.h"
#include "yin_pitch_detector.h"

namespace livemix {

class Sympathetic : public kit::DeviceBase<sympathetic::kNumParams> {
 public:
  static constexpr int kMinStrings = 4;

  void init(float sample_rate) {
    using namespace sympathetic;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    bank_.prepare(sr);
    bank_.set_damping(kDamping);
    detector_.prepare(sr);
    mapper_.reset();
    learner_.reset();
    widener_.prepare(sr);
    widener_quiet_ = 0;
    widener_quiet_limit_ = static_cast<int>(0.1f * sr);
    sympathy_.set_time(kSmoothingSeconds, sr);
    decay_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    width_.set_time(kSmoothingSeconds, sr);
    decay_clock_.reset(32);
    applied_decay_ = 0.0f;
    detected_note_ = -1;
    detected_hz_ = 0.0f;
    candidate_note_ = -1;
    stable_windows_ = 0;
    stage_ = kIdle;
    stage_countdown_ = 0;
    asleep_ = true;
    // A string that has just been struck is silent for one period before the
    // line returns it (33 ms at 30 Hz); the tail itself is never silent, so
    // the hold does not need to follow Decay.
    idle_.reset(sr, 0.5f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // What the detector last settled on (-1 and 0 before the first note).
  int detected_note() const { return detected_note_; }
  float detected_frequency() const { return detected_hz_; }
  float string_frequency(int index) const { return bank_.string_frequency(index); }

  // The readings named by "meters" in device.json, for a display to draw.
  // 0..3: how loud the sixteen strings ring, four to a reading. Each string
  // is a whole number 0..63, its level in dB above -63 dB (0 for silent or
  // not in use), and a reading is the four of them as digits to the base
  // 64, lowest string first: under 2^24, so a float carries it exactly.
  // 4: the note the detector last settled on (-1 before the first).
  // 5: the scale the strings are tuned to, one bit for each semitone above
  // the root that is in it (what Learn has gathered, in Learn mode).
  float meter(int index) const {
    if (index >= 0 && index < 4) {
      int packed = 0;
      for (int s = 3; s >= 0; --s) {
        const float power = bank_.string_energy(4 * index + s);
        int level = power > 0.0f ? static_cast<int>(63.5f + 10.0f * std::log10(power)) : 0;
        packed = packed * 64 + kit::clamp_int(level, 0, 63);
      }
      return static_cast<float>(packed);
    }
    if (index == 4) return static_cast<float>(detected_note_);
    if (index == 5) {
      int scale[sympathetic::ScaleMapper::kMaxScale];
      const int size = mapper_.current_scale(scale);
      int bits = 0;
      for (int i = 0; i < size; ++i) bits |= 1 << scale[i];
      return static_cast<float>(bits);
    }
    return 0.0f;
  }

  void process(int frames) {
    using namespace sympathetic;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      if (!asleep_) fall_asleep();
      silence_output(frames);
      return;
    }
    // Waking up, start on the first sample that carries anything, so the
    // detector's windows are counted from the sound and not from wherever
    // the host's block happened to begin.
    int first = 0;
    if (asleep_) {
      while (first < frames - 1 && in_left_[first] == 0.0f && in_right_[first] == 0.0f) {
        out_left_[first] = 0.0f;
        out_right_[first] = 0.0f;
        ++first;
      }
      asleep_ = false;
    }
    float wet_peak = 0.0f;
    for (int i = first; i < frames; ++i) {
      float in_l, in_r;
      take_input(i, &in_l, &in_r);
      const float mono = 0.5f * (in_l + in_r);

      listen(mono);

      const float decay = decay_.next();
      if (decay_clock_.tick() && decay != applied_decay_) {
        applied_decay_ = decay;
        bank_.set_decay(decay);
      }

      float wet_l, wet_r;
      bank_.process(mono * sympathy_.next() * kStringDrive, &wet_l, &wet_r);
      wet_l = kit::fast_tanh(wet_l * kWetGain);
      wet_r = kit::fast_tanh(wet_r * kWetGain);

      if (!width_.settled()) widener_.setWidth(width_.next());
      if (wet_l == 0.0f && wet_r == 0.0f) {
        // The widener's bass filter has no denormal guard (its source is
        // shared and unchanged): empty it once the strings have stopped.
        if (widener_quiet_ < widener_quiet_limit_ && ++widener_quiet_ == widener_quiet_limit_) {
          widener_.reset();
        }
      } else {
        widener_quiet_ = 0;
      }
      widener_.process(wet_l, wet_r);
      const float magnitude = kit::max(std::fabs(wet_l), std::fabs(wet_r));
      if (magnitude > wet_peak) wet_peak = magnitude;

      if (!mix_.settled()) kit::equal_power(mix_.next(), &dry_gain_, &wet_gain_);
      out_left_[i] = in_l * dry_gain_ + wet_l * wet_gain_;
      out_right_[i] = in_r * dry_gain_ + wet_r * wet_gain_;
    }
    // The strings keep the device awake even when Mix hides them, so a tail
    // is never frozen half way and replayed later.
    idle_.settle(kit::max(output_peak(frames), wet_peak), frames);
  }

 private:
  // The plugin fed the strings at full level and took 18 dB off after them
  // (0.125). With the strings in tune a held note at that level pins the clip
  // inside every string it matches, and matched and unmatched notes come out
  // alike. The same 18 dB is split here: 20 dB less into the strings, 2 dB
  // more out of them, which leaves quiet and broadband material where it was
  // and gives a matched note 20 dB to build before the clip.
  static constexpr float kStringDrive = 0.1f;
  static constexpr float kWetGain = 1.25f;
  static constexpr float kDamping = 0.3f;    // fixed in the plugin too
  static constexpr int kStabilityWindows = 3;
  static constexpr float kWindowSeconds = 0.033f;  // weight of one Learn observation
  static constexpr int kStageSpacing = 128;

  enum Stage { kIdle, kCorrelate, kPick };

  // One input sample to the detector, and whichever step of a detection in
  // flight falls on this sample.
  void listen(float mono) {
    if (detector_.push(mono)) {
      detector_.transform();
      stage_ = kCorrelate;
      stage_countdown_ = kStageSpacing;
    } else if (stage_ != kIdle && --stage_countdown_ == 0) {
      if (stage_ == kCorrelate) {
        detector_.correlate();
        stage_ = kPick;
        stage_countdown_ = kStageSpacing;
      } else {
        stage_ = kIdle;
        heard(detector_.pick());
      }
    }
  }

  void heard(const sympathetic::YinPitchDetector::Result& result) {
    if (!result.valid()) {
      stable_windows_ = 0;
      return;
    }
    if (result.midi_note == candidate_note_) {
      ++stable_windows_;
    } else {
      candidate_note_ = result.midi_note;
      stable_windows_ = 1;
    }
    if (stable_windows_ < kStabilityWindows) return;
    detected_note_ = result.midi_note;
    detected_hz_ = result.frequency;
    if (mapper_.mode() == sympathetic::ScaleMapper::kLearn) {
      learner_.record(result.midi_note, kWindowSeconds, result.confidence);
      use_learned_scale();
    }
    retune();
  }

  void use_learned_scale() {
    int intervals[12];
    const int size = learner_.learned_scale(mapper_.root(), 7, intervals);
    mapper_.set_learned_scale(intervals, size);
  }

  void retune() {
    float hz[sympathetic::ResonatorBank::kMaxStrings];
    const int count = bank_.num_strings();
    mapper_.resonator_frequencies(count, detected_note_, hz);
    bank_.set_tuning(hz, count, primed());
  }

  void fall_asleep() {
    asleep_ = true;
    detector_.reset();
    stage_ = kIdle;
    stable_windows_ = 0;
    widener_.reset();
    widener_quiet_ = widener_quiet_limit_;
  }

  void apply(int id) {
    using namespace sympathetic;
    const float value = param(id);
    switch (id) {
      case kRoot:
        mapper_.set_root(static_cast<int>(value + 0.5f));
        if (mapper_.mode() == ScaleMapper::kLearn) use_learned_scale();
        retune();
        break;
      case kMode: {
        const int mode = kit::clamp_int(static_cast<int>(value + 0.5f), 0, 2);
        // Choosing Learn starts a fresh scale (the plugin had a Reset button).
        if (mode == ScaleMapper::kLearn && mapper_.mode() != ScaleMapper::kLearn) {
          learner_.reset();
          mapper_.set_learned_scale(nullptr, 0);
        }
        mapper_.set_mode(mode);
        retune();
        break;
      }
      case kSympathy:
        sympathy_.set(value, primed());
        break;
      case kStrings:
        bank_.set_num_strings(kMinStrings + static_cast<int>(value + 0.5f), primed());
        retune();
        break;
      case kDecay:
        decay_.set(value, primed());
        if (!primed()) {
          applied_decay_ = value;
          bank_.set_decay(value);
        }
        break;
      case kMix:
        mix_.set(value, primed());
        if (!primed()) kit::equal_power(value, &dry_gain_, &wet_gain_);
        break;
      case kWidth:
        width_.set(value, primed());
        bank_.set_width(value, primed());
        if (!primed()) widener_.setWidth(value);
        break;
      default:
        break;
    }
  }

  sympathetic::ResonatorBank bank_;
  sympathetic::YinPitchDetector detector_;
  sympathetic::ScaleMapper mapper_;
  sympathetic::ScaleLearner learner_;
  StereoWidener widener_;
  kit::Smoother sympathy_, decay_, mix_, width_;
  kit::ControlClock decay_clock_;
  kit::IdleGate idle_;
  float applied_decay_ = 0.0f;
  float dry_gain_ = 1.0f;
  float wet_gain_ = 0.0f;
  float detected_hz_ = 0.0f;
  int detected_note_ = -1;
  int candidate_note_ = -1;
  int stable_windows_ = 0;
  int stage_ = kIdle;
  int stage_countdown_ = 0;
  int widener_quiet_ = 0;
  int widener_quiet_limit_ = 4800;
  bool asleep_ = true;
};

}  // namespace livemix
