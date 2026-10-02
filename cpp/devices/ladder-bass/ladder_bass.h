#pragma once

// Ladder Bass: a one-voice bass in the style of the seventies ladder-filter
// mono synths and bass pedals.
//
//   osc A (saw..square, -Beat/2) ─┐
//   osc B (saw..square, +Beat/2) ─┼─► × Drive ─► four-pole ladder ─► ÷ rate ─► contour ─► out
//   sub   (sine, octave down)    ─┘                  ▲
//                                    Cutoff × keyboard × 2^(Contour·contour)
//
// - One voice. Held keys sit on a stack and the newest plays; letting it go
//   returns to the one under it.
// - The oscillators and the filter run at four times the sample rate (twice
//   from 60 kHz up) and come down through kit::Halfband2x, so what Drive
//   folds back from above the audible band is removed before it lands.
// - Drive is gain into kit::Ladder, whose loop saturates. Nothing gives back
//   the level Emphasis takes from the passband: the bass thinning with
//   resonance is the character of the filter.
// - One contour shapes loudness and filter: a 2 ms strike from wherever it
//   is, then an exponential fall that is 60 dB down after Decay. With Decay
//   at the top it holds while a key is down.
// - Every new key strikes the contour again; pitch glides only between
//   overlapping keys, in a straight line that arrives in the Glide time.
// - The only high-pass is a DC blocker at 2 Hz: an octave-down sine under a
//   sawtooth is lopsided, so the saturation leaves a little DC that wanders
//   at the beat rate. At 2 Hz it takes a quarter of a dB from the 8 Hz sub
//   of the lowest C, so the bottom stays.
//
// Both outputs carry the same signal. The instrument sleeps once the contour
// has reached zero; the oscillators stop where they are and carry on from
// there, so waking never steps.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class LadderBass : public kit::DeviceBase<ladder_bass::kNumParams> {
 public:
  static constexpr int kMaxHeld = 16;

  void init(float sample_rate) {
    using namespace ladder_bass;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    factor_ = sr < 60000.0f ? 4 : 2;
    inner_rate_ = sr * static_cast<float>(factor_);
    for (kit::Halfband2x& stage : down_) stage.init();
    ladder_.reset();
    dc_.reset();
    dc_.set_cutoff(kDcBlockHz, sr);
    osc_a_.phase = 0.0;
    osc_b_.phase = 0.0;
    sub_phase_ = 0.0;
    held_ = 0;
    for (int i = 0; i < kMaxHeld; ++i) keys_[i] = Key();
    pitch_ = kPivotPitch;
    glide_step_ = 0.0f;
    glide_target_ = kPivotPitch;
    glide_left_ = 0;
    frequency_ = std::exp2(pitch_);
    contour_level_ = 0.0f;
    striking_ = false;
    last_decay_ = -1.0f;
    apart_step_ = 0.0;
    drift_common_.seed(0x1ADDE201u);
    drift_common_.set_rate(0.11f, sr);
    drift_apart_.seed(0x1ADDE202u);
    drift_apart_.set_rate(0.07f, sr);
    strike_rate_ =
        1.0f - std::exp(std::log((kStrikeTarget - 1.0f) / kStrikeTarget) / kit::max(1.0f, kStrikeSeconds * sr));
    kit::Smoother* const smoothers[] = {&wave_,       &sub_,    &cutoff_,   &emphasis_, &contour_,
                                        &drive_gain_, &makeup_, &velocity_, &volume_};
    for (kit::Smoother* smoother : smoothers) smoother->set_time(kSmoothingSeconds, sr);
    velocity_.snap(0.0f);
    clock_.reset(32);
    // The decimators hold under a millisecond; nothing else outlives the contour.
    idle_.reset(sr, 0.02f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, 8.0f, 12000.0f);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);

    release_key(note_id);
    const bool overlapping = held_ > 0;
    if (held_ == kMaxHeld) drop(0);  // a full stack forgets its oldest key
    keys_[held_].note_id = note_id;
    keys_[held_].pitch = std::log2(frequency);
    keys_[held_].level = 0.35f + 0.65f * gain;
    ++held_;

    // A key pressed while another is held slides from it, whether or not the
    // older note has already died away. A key struck with none held starts on
    // pitch, and so does the top key of a chord whose keys land together: its
    // strike is pending and nothing has sounded yet to slide from.
    const bool sounding = contour_level_ > 0.0f;
    const bool unheard = striking_ && !sounding;
    play_top(overlapping && !unheard);
    if (!sounding) velocity_.snap(keys_[held_ - 1].level);
    striking_ = true;
  }

  void note_off(int note_id) {
    const int index = find(note_id);
    if (index < 0) return;
    const bool was_playing = index == held_ - 1;
    drop(index);
    // Back to the key still held, if there is one; with none the contour releases.
    if (was_playing && held_ > 0) play_top(contour_level_ > 0.0f);
  }

  void process(int frames) {
    using namespace ladder_bass;
    frames = begin_block(frames);
    if (!idle_.wake(contour_level_ > 0.0f || striking_)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) control();

      if (glide_left_ > 0) {
        pitch_ += glide_step_;
        if (--glide_left_ == 0) pitch_ = glide_target_;
        frequency_ = std::exp2(pitch_);
      }
      const float contour = advance_contour();

      // The filter follows the keyboard by half, pivoting on C2, and opens by
      // up to kContourOctaves with the contour.
      const float tracking = std::sqrt(frequency_ * (1.0f / kPivotHz));
      const float cutoff = cutoff_.next() * tracking * std::exp2(contour_.next() * kContourOctaves * contour);
      ladder_.set(kit::min(cutoff, kMaxCutoffHz), emphasis_.next(), inner_rate_);

      const float wave = wave_.next();
      const float saw_gain = kOscGain * (1.0f - wave);
      const float square_gain = kOscGain * kSquareLevel * wave;
      const float sub_gain = kSubGain * sub_.next();
      const float drive = drive_gain_.next();
      const double step = static_cast<double>(frequency_) / inner_rate_;
      const double step_a = step * ratio_a_ - apart_step_;
      const double step_b = step * ratio_b_ + apart_step_;
      const double step_sub = step * 0.5;

      float y[4];
      for (int k = 0; k < factor_; ++k) {
        float saw_a, square_a, saw_b, square_b;
        osc_a_.next(step_a, &saw_a, &square_a);
        osc_b_.next(step_b, &saw_b, &square_b);
        sub_phase_ += step_sub;
        if (sub_phase_ >= 1.0) sub_phase_ -= 1.0;
        const float mixed = saw_gain * (saw_a + saw_b) + square_gain * (square_a + square_b) +
                            sub_gain * kit::SineTable::lookup(static_cast<float>(sub_phase_));
        y[k] = ladder_.process(mixed * drive);
      }
      float filtered;
      if (factor_ == 4) {
        const float first = down_[0].down(y[0], y[1]);
        const float second = down_[0].down(y[2], y[3]);
        filtered = down_[1].down(first, second);
      } else {
        filtered = down_[1].down(y[0], y[1]);
      }

      const float out =
          kit::soft_clip(dc_.process(filtered) * contour * velocity_.next() * makeup_.next() * volume_.next());
      out_left_[i] = out;
      out_right_[i] = out;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  struct Key {
    int note_id = -1;
    float pitch = 0.0f;  // log2 of the frequency
    float level = 0.0f;
  };

  // A sawtooth and a square read from one phase, band-limited with the same
  // PolyBLEP residual as kit::BlepOsc (whose shapes each advance the phase,
  // so it cannot blend two of them).
  struct WaveOsc {
    double phase = 0.0;

    void next(double increment, float* saw, float* square) {
      phase += increment;
      if (phase >= 1.0) phase -= 1.0;
      const float t = static_cast<float>(phase);
      const float dt = static_cast<float>(increment);
      const float edge = blep(t, dt);
      *saw = 2.0f * t - 1.0f - edge;
      const float half = t >= 0.5f ? t - 0.5f : t + 0.5f;
      *square = (t < 0.5f ? 1.0f : -1.0f) + edge - blep(half, dt);
    }

    // Residual of a unit-height rising step at phase 0.
    static float blep(float t, float dt) {
      if (t < dt) {
        t /= dt;
        return t + t - t * t - 1.0f;
      }
      if (t > 1.0f - dt) {
        t = (t - 1.0f) / dt;
        return t * t + t + t + 1.0f;
      }
      return 0.0f;
    }
  };

  static constexpr float kPivotHz = 65.40639f;      // C2: where Cutoff is the cutoff
  static constexpr float kPivotPitch = 6.0313597f;  // log2(kPivotHz)
  static constexpr float kContourOctaves = 5.0f;
  static constexpr float kMaxCutoffHz = 18000.0f;
  static constexpr float kMaxDriveDb = 24.0f;
  // Two sawtooths in phase reach 0.4 before Drive: under the ladder's knee.
  static constexpr float kOscGain = 0.2f;
  static constexpr float kSquareLevel = 0.7f;  // a square carries more power than a sawtooth
  static constexpr float kSubGain = 0.4f;
  static constexpr float kOutGain = 1.25f;
  static constexpr float kHoldFromSeconds = 9.9f;
  static constexpr float kMaxReleaseSeconds = 0.8f;
  static constexpr float kStrikeSeconds = 0.002f;
  static constexpr float kStrikeTarget = 1.3f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kSilent = 1.0e-5f;
  static constexpr float kDcBlockHz = 2.0f;
  // Both oscillators wander together by under a cent. Against each other
  // they wander by a fixed few hundredths of a hertz, not by cents: that
  // keeps their phases within about a sixteenth of a cycle of where Beat
  // puts them on every key, a slow shimmer in the top of the spectrum
  // instead of a fundamental that cancels on high notes.
  static constexpr float kCommonDriftCents = 0.8f;
  static constexpr float kApartDriftHz = 0.012f;

  int find(int note_id) const {
    for (int i = 0; i < held_; ++i) {
      if (keys_[i].note_id == note_id) return i;
    }
    return -1;
  }

  void drop(int index) {
    for (int i = index; i + 1 < held_; ++i) keys_[i] = keys_[i + 1];
    --held_;
  }

  void release_key(int note_id) {
    const int index = find(note_id);
    if (index >= 0) drop(index);
  }

  // Aim the voice at the newest held key: a straight line in pitch that
  // arrives in the Glide time when `slide`, a jump otherwise.
  void play_top(bool slide) {
    const Key& key = keys_[held_ - 1];
    const float samples = param(ladder_bass::kGlide) * sample_rate();
    if (slide && samples >= 1.0f) {
      glide_left_ = static_cast<int>(samples);
      glide_target_ = key.pitch;
      glide_step_ = (key.pitch - pitch_) / static_cast<float>(glide_left_);
    } else {
      glide_left_ = 0;
      pitch_ = key.pitch;
      frequency_ = std::exp2(pitch_);
    }
    velocity_.set_target(key.level);
  }

  float advance_contour() {
    if (striking_) {
      contour_level_ += strike_rate_ * (kStrikeTarget - contour_level_);
      if (contour_level_ >= 1.0f) {
        contour_level_ = 1.0f;
        striking_ = false;
      }
      return contour_level_;
    }
    if (held_ == 0) {
      contour_level_ *= release_coeff_;
    } else if (!hold_) {
      contour_level_ *= decay_coeff_;
    }
    if (contour_level_ < kSilent) contour_level_ = 0.0f;
    return contour_level_;
  }

  // Every 32 samples: the slow drift of the pair and the contour's rates.
  void control() {
    using namespace ladder_bass;
    const float common = kCommonDriftCents * drift_common_.next(32);
    const float apart = 0.5f * param(kBeat);
    ratio_a_ = kit::cents_to_ratio(common - apart);
    ratio_b_ = kit::cents_to_ratio(common + apart);
    apart_step_ = static_cast<double>(kApartDriftHz * drift_apart_.next(32)) / inner_rate_;
    const float decay = param(kDecay);
    if (decay != last_decay_) {
      last_decay_ = decay;
      const float sr = sample_rate();
      hold_ = decay >= kHoldFromSeconds;
      decay_coeff_ = std::exp(-kSixtyDb / (decay * sr));
      release_coeff_ = std::exp(-kSixtyDb / (kit::min(decay, kMaxReleaseSeconds) * sr));
    }
  }

  void apply(int id) {
    using namespace ladder_bass;
    const float value = param(id);
    switch (id) {
      case kWave:
        wave_.set(value, primed());
        break;
      case kSub:
        sub_.set(value, primed());
        break;
      case kCutoff:
        cutoff_.set(value, primed());
        break;
      case kEmphasis:
        emphasis_.set(value, primed());
        break;
      case kContour:
        contour_.set(value, primed());
        break;
      case kDrive: {
        // Half of the gain comes back off after the filter, which keeps a
        // saturated note about as loud as a clean one.
        const float db = value * kMaxDriveDb;
        drive_gain_.set(kit::db_to_gain(db), primed());
        makeup_.set(kOutGain * kit::db_to_gain(-0.5f * db), primed());
        break;
      }
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // Beat, Decay and Glide are read where they are used
    }
  }

  kit::Halfband2x down_[2];
  kit::Ladder ladder_;
  kit::DcBlocker dc_;
  WaveOsc osc_a_, osc_b_;
  kit::Drift drift_common_, drift_apart_;
  kit::Smoother wave_, sub_, cutoff_, emphasis_, contour_, drive_gain_, makeup_, velocity_, volume_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  Key keys_[kMaxHeld];
  double sub_phase_ = 0.0;
  double apart_step_ = 0.0;
  int held_ = 0;
  int factor_ = 4;
  int glide_left_ = 0;
  float inner_rate_ = 192000.0f;
  float pitch_ = kPivotPitch;
  float frequency_ = kPivotHz;
  float glide_step_ = 0.0f;
  float glide_target_ = kPivotPitch;
  float ratio_a_ = 1.0f, ratio_b_ = 1.0f;
  float contour_level_ = 0.0f;
  float strike_rate_ = 0.0f;
  float decay_coeff_ = 0.0f, release_coeff_ = 0.0f;
  float last_decay_ = -1.0f;
  bool striking_ = false;
  bool hold_ = false;
};

}  // namespace livemix
