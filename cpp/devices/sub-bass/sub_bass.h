#pragma once

// Sub Bass: a deep sine bass whose tone is made by adding to a sine. There is
// no filter anywhere in it.
//
//   phase ─► sine ─┬─► + odd harmonics 3, 5, 7 (Shape) ─┐
//                  └─► + harmonics 2 and 3 (Harmonics) ─┴─► × loudness ─► drive ─► ÷ rate ─► volume ─► out
//     ▲
//   key (glide between overlapping keys) + Drop, falling onto the key in Fall
//
// - One voice. Held keys sit on a stack and the newest plays; letting it go
//   returns to the one under it. Pitch glides only between overlapping keys,
//   in a straight line that arrives in the Glide time.
// - Every harmonic is a polynomial in the sine and cosine of the one
//   double-precision phase, so all of them are locked to the fundamental and
//   none exists that was not asked for. All are in sine phase: the wave is
//   odd in time, which is why it carries no DC before or after the drive (an
//   odd curve) and why no DC blocker is needed.
// - Shape adds the third, fifth and seventh harmonic in the proportions of a
//   square wave with its corners rounded off (no overshoot). Harmonics adds
//   the second at half and the third at 0.316 of the fundamental. Neither
//   touches the fundamental's own level.
// - A strike from silence starts the phase at zero and everything else from
//   a known state, so every hit from rest is the same samples. A strike while
//   the last note still sounds carries on from where the wave is.
// - Drop: a key played apart starts that many semitones high and falls onto
//   the key along an exponential that is cut off, and so exactly on pitch,
//   after the Fall time. A key slid to does not drop.
// - Loudness: an S-shaped rise over Attack from wherever the level is, then
//   an exponential fall that is 60 dB down after Decay (at the top of Decay
//   it holds while a key is down), and one that is 60 dB down after Release
//   once no key is held. A half-millisecond lag rounds its corners.
// - Drive is a seventh-order curve that is flat where it ends, after the
//   loudness, so loud notes and the start of a note are driven harder than
//   quiet ones and tails. The level it takes is given back from the loudness
//   and the drive setting, so a driven note is as loud as a clean one.
// - The tone and the drive run at four times the sample rate (twice from
//   60 kHz up), so what the drive adds has room above the band, and come
//   down through low-passes of this device's own (SubBassDecimator, below)
//   that are 80 dB down at half the sample rate.
// - A harmonic fades out as it climbs from 12 to 18 kHz: the instrument
//   makes nothing above 18 kHz, at any sample rate.
//
// Both outputs carry the same signal. The instrument sleeps once the loudness
// has reached zero.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

// A Kaiser-windowed low-pass (80 dB) of 2 * Half + 1 taps that halves the
// rate: two samples in, one out, linear phase, Half input samples of delay.
// `Step` 2 is for a cutoff of a quarter of the input rate with an odd Half,
// where every second tap is zero and is skipped.
//
// The instrument comes down from four times the sample rate in two of
// these, and neither is kit::Halfband2x, which is 6 dB down at half its
// output rate and reaches its stopband at 0.58 of it: what lies between the
// two folds back into the top of the band, and under a driven wave on a
// high key that was a component only 40 dB under the note.
// - The last step (SubBassDecimator<31, 1>, cutoff 0.21 of twice the sample
//   rate) is flat to 0.34 of the sample rate and 80 dB down from half of
//   it. It takes twice the multiplies of the kit's and gives up the band
//   above 0.34 (16 kHz at 48 kHz, where this instrument makes little: its
//   harmonics have faded out by 18 kHz), and lets nothing fold.
// - The first step (SubBassDecimator<11, 2>, cutoff 0.25 of four times the
//   sample rate) only has to remove what would land in the band, which is
//   what lies from one and a half times the sample rate to twice it; what
//   it leaves between a half and one and a half the last step removes.
//   That takes seven multiplies where the kit's takes sixteen.
template <int Half, int Step>
class SubBassDecimator {
 public:
  void init(double cutoff) {
    const double pi = 3.14159265358979323846;
    const double beta = 8.0;
    const double i0_beta = bessel_i0(beta);
    double h[Half + 1];
    double sum = 0.0;
    for (int k = 0; k <= Half; ++k) {
      const int n = Half - k;  // distance from the centre tap
      const double ideal = n == 0 ? 2.0 * cutoff : std::sin(2.0 * pi * cutoff * n) / (pi * n);
      const double r = static_cast<double>(n) / (Half + 1);
      h[k] = ideal * bessel_i0(beta * std::sqrt(1.0 - r * r)) / i0_beta;
      if (Step == 2 && k % 2 == 1 && n != 0) h[k] = 0.0;  // zero but for rounding
      sum += n == 0 ? h[k] : 2.0 * h[k];
    }
    for (int k = 0; k <= Half; ++k) taps_[k] = static_cast<float>(h[k] / sum);
    reset();
  }

  void reset() {
    for (float& value : line_) value = 0.0f;
    index_ = 0;
  }

  // Two samples at the higher rate in (in order), one out.
  float down(float first, float second) {
    line_[index_] = first;
    index_ = (index_ + 1) & kMask;
    line_[index_] = second;
    float sum = taps_[Half] * line_[(index_ - Half) & kMask];
    for (int k = 0; k < Half; k += Step) {
      sum += taps_[k] * (line_[(index_ - k) & kMask] + line_[(index_ - 2 * Half + k) & kMask]);
    }
    index_ = (index_ + 1) & kMask;
    return sum;
  }

 private:
  static constexpr int kSize = Half < 16 ? 32 : 64;
  static constexpr int kMask = kSize - 1;
  static_assert(2 * Half + 1 <= kSize, "the line holds every tap");
  static_assert(Step == 1 || (Step == 2 && Half % 2 == 1), "Step 2 needs an odd Half");

  static double bessel_i0(double x) {
    double sum = 1.0;
    double term = 1.0;
    for (int k = 1; k < 32; ++k) {
      term *= (x / (2.0 * k)) * (x / (2.0 * k));
      sum += term;
    }
    return sum;
  }

  float taps_[Half + 1] = {};
  float line_[kSize] = {};
  int index_ = 0;
};

class SubBass : public kit::DeviceBase<sub_bass::kNumParams> {
 public:
  static constexpr int kMaxHeld = 16;

  void init(float sample_rate) {
    using namespace sub_bass;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    factor_ = sr < 60000.0f ? 4 : 2;
    inner_rate_ = sr * static_cast<float>(factor_);
    inner_step_ = 1.0f / static_cast<float>(factor_);
    first_down_.init(0.25);  // of its input rate: flat to 0.14, 80 dB down from 0.36
    last_down_.init(0.21);   // flat to 0.17, 80 dB down from 0.25: half the sample rate
    max_hz_ = kit::min(kMaxHz, 0.4f * sr);
    fade_slope_ = 3.0f / kit::min(kFadeToHz, 0.42f * sr);  // a harmonic fades over the top third of the way there
    phase_ = 0.0;
    held_ = 0;
    for (int i = 0; i < kMaxHeld; ++i) keys_[i] = Key();
    pitch_ = kRestPitch;
    glide_step_ = 0.0f;
    glide_target_ = kRestPitch;
    glide_left_ = 0;
    drop_octaves_ = 0.0f;
    fall_level_ = 0.0f;
    fall_coeff_ = 0.0f;
    fall_left_ = 0;
    join_ = 0.0f;
    join_step_ = 0.0f;
    join_left_ = 0;
    retune_ = false;
    frequency_ = std::exp2(pitch_);
    turned_by_ = -1.0;
    level_ = 0.0f;
    attack_from_ = 0.0f;
    attack_at_ = 0.0f;
    attack_step_ = 1.0f;
    striking_ = false;
    last_attack_ = -1.0f;
    last_decay_ = -1.0f;
    last_release_ = -1.0f;
    last_amp_ = 0.0f;
    kit::Smoother* const smoothers[] = {&shape_, &harmonics_, &drive_, &velocity_, &volume_};
    for (kit::Smoother* smoother : smoothers) smoother->set_time(kSmoothingSeconds, sr);
    velocity_.snap(0.0f);
    lag_.set_time(kLagSeconds, sr);
    lag_.snap(0.0f);
    clock_.reset(32);
    // The decimators hold under a millisecond; nothing else outlives the loudness.
    idle_.reset(sr, 0.02f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    read_times();
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
    if (held_ == kMaxHeld) forget(0);  // a full stack forgets its oldest key
    keys_[held_].note_id = note_id;
    keys_[held_].pitch = std::log2(frequency);
    keys_[held_].level = kSoftestLevel + (1.0f - kSoftestLevel) * gain;
    ++held_;

    if (!sounding()) {
      // From rest. A key over a held one that has died away still slides from
      // it; the keys of a chord that land together do not (the strike of the
      // first is pending and nothing has sounded to slide from).
      const bool slide = overlapping && !striking_;
      rest();
      aim(slide ? param(sub_bass::kGlide) : 0.0f);
      if (!slide) start_fall(0.0f);
      velocity_.snap(keys_[held_ - 1].level);
    } else if (overlapping) {
      aim(param(sub_bass::kGlide));  // a key slid to does not drop
    } else {
      // A key played apart while the last note still sounds: the wave carries
      // on, and the pitch goes to the top of the new drop without a jump.
      const float offset = pitch_offset();
      aim(0.0f);
      start_fall(offset);
    }
    attack_from_ = level_;
    attack_at_ = 0.0f;
    striking_ = true;
  }

  void note_off(int note_id) {
    const int index = find(note_id);
    if (index < 0) return;
    const bool was_playing = index == held_ - 1;
    forget(index);
    if (held_ == 0) {
      striking_ = false;  // the release starts from wherever the rise had got to
    } else if (was_playing) {
      aim(sounding() ? param(sub_bass::kGlide) : 0.0f);  // back to the key still held, without a new strike
    }
  }

  void process(int frames) {
    using namespace sub_bass;
    frames = begin_block(frames);
    if (!idle_.wake(sounding() || striking_)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) read_times();

      // Pitch: the key (gliding or not) plus what is left of the drop.
      if (glide_left_ > 0 || fall_left_ > 0 || join_left_ > 0 || retune_) {
        // One more pass after all three have ended lands exactly on the key
        // (the last step of a fall, or of a join, is still short of it).
        retune_ = glide_left_ > 0 || fall_left_ > 0 || join_left_ > 0;
        if (glide_left_ > 0) {
          pitch_ += glide_step_;
          if (--glide_left_ == 0) pitch_ = glide_target_;
        }
        const float octaves = pitch_ + pitch_offset();
        if (fall_left_ > 0) {
          fall_level_ *= fall_coeff_;
          --fall_left_;
        }
        if (join_left_ > 0) {
          join_ -= join_step_;
          --join_left_;
        }
        frequency_ = kit::min(std::exp2(octaves), max_hz_);
      }

      // The harmonics, each fading out as it nears the top of the band.
      const float shape = shape_.next();
      const float harmonics = harmonics_.next();
      float second = kSecond * harmonics;
      float third = kShapeThird * shape + kThird * harmonics;
      float fifth = kShapeFifth * shape * shape;
      float seventh = kShapeSeventh * shape * shape * shape;
      if (frequency_ * 7.0f * fade_slope_ > 2.0f) {
        second *= fade(2.0f);
        third *= fade(3.0f);
        fifth *= fade(5.0f);
        seventh *= fade(7.0f);
      }
      // sin 3x, sin 5x and sin 7x are polynomials in s = sin x; with the
      // fundamental they collect into s (b0 + b1 s² + b2 s⁴ + b3 s⁶), and
      // sin 2x is 2 s cos x.
      const float b0 = 1.0f + 3.0f * third + 5.0f * fifth + 7.0f * seventh;
      const float b1 = -4.0f * third - 20.0f * fifth - 56.0f * seventh;
      const float b2 = 16.0f * fifth + 112.0f * seventh;
      const float b3 = -64.0f * seventh;
      const float twice_second = 2.0f * second;

      // Loudness, and what the drive has to give back at this loudness: the
      // level a sine as strong as this wave loses in the curve.
      lag_.set_target(advance_level());
      const float amp = lag_.next() * velocity_.next();
      const float drive = drive_.next();
      const bool driven = drive > kCleanBelow;
      float give_back = 1.0f;
      if (driven) {
        const float size2 = 1.0f + second * second + third * third + fifth * fifth + seventh * seventh;
        const float depth2 = drive * drive * amp * amp * size2;
        const float lost = 1.0f + 1.5f * depth2 + kLossC * depth2 * depth2 / (1.0f + kLossD * depth2);
        give_back = std::sqrt(lost) / drive;
      }

      // The phase moves on by one sample; its sine and cosine are read from
      // the table at the first of the oversampled points and turned from
      // there to the others by the angle of one step.
      const double step = static_cast<double>(frequency_) / inner_rate_;
      if (step != turned_by_) {
        turned_by_ = step;
        const float half = kit::SineTable::lookup(0.5f * static_cast<float>(step));
        turn_sin_ = kit::SineTable::lookup(static_cast<float>(step));
        turn_cos_ = 1.0f - 2.0f * half * half;
      }
      double first_phase = phase_ + step;
      if (first_phase >= 1.0) first_phase -= 1.0;
      phase_ += step * static_cast<double>(factor_);
      if (phase_ >= 1.0) phase_ -= 1.0;
      float s = kit::SineTable::lookup(static_cast<float>(first_phase));
      float c = kit::SineTable::cos_lookup(static_cast<float>(first_phase));
      const float amp_step = (amp - last_amp_) * inner_step_;
      float y[4];
      for (int k = 0; k < factor_; ++k) {
        const float s2 = s * s;
        last_amp_ += amp_step;
        float v = s * (b0 + s2 * (b1 + s2 * (b2 + s2 * b3)) + twice_second * c) * last_amp_;
        if (driven) {
          // x - x³ + 3/5 x⁵ - 1/7 x⁷: slope one at the centre and flat, with
          // its next two derivatives, at ±1 where it is held.
          const float x = kit::clamp(v * drive, -1.0f, 1.0f);
          const float x2 = x * x;
          v = x * (1.0f + x2 * (-1.0f + x2 * (0.6f - x2 * (1.0f / 7.0f)))) * give_back;
        }
        y[k] = v;
        const float turned = s * turn_cos_ + c * turn_sin_;
        c = c * turn_cos_ - s * turn_sin_;
        s = turned;
      }
      last_amp_ = amp;
      float tone;
      if (factor_ == 4) {
        const float first = first_down_.down(y[0], y[1]);
        const float second_half = first_down_.down(y[2], y[3]);
        tone = last_down_.down(first, second_half);
      } else {
        tone = last_down_.down(y[0], y[1]);
      }

      const float out = kit::soft_clip(tone * kOutGain * volume_.next());
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

  static constexpr float kRestPitch = 5.7813597f;  // log2(55 Hz); never heard, a strike sets the pitch
  static constexpr float kMaxHz = 16000.0f;        // a drop from the top keys stops here
  static constexpr float kFadeToHz = 18000.0f;     // no harmonic is made above this
  // Harmonics at full: the second 6 dB and the third 10 dB under the fundamental.
  static constexpr float kSecond = 0.5f;
  static constexpr float kThird = 0.3162f;
  // Shape at full: the first four terms of a square wave, sin(nx)/n, each
  // scaled by sinc(n/8) (Lanczos) so the flat top has no ripple.
  static constexpr float kShapeThird = 0.2682f;
  static constexpr float kShapeFifth = 0.0966f;
  static constexpr float kShapeSeventh = 0.0204f;
  // The fall is exp(-kFallRate t / Fall), cut off where it has reached a
  // hundredth and stretched so that the cut is zero.
  static constexpr float kFallRate = 4.6051702f;  // ln 100
  static constexpr float kFallFloor = 0.01f;
  static constexpr float kFallScale = 1.0f / (1.0f - kFallFloor);
  static constexpr float kMaxDrive = 1.25f;  // gain into the curve at full Drive
  // While a note sounds its pitch never jumps: a new key, or the top of a new
  // drop, is reached along a line this long.
  static constexpr float kJoinSeconds = 0.002f;
  static constexpr float kCleanBelow = 1.0e-4f;
  // Mean square a sine of depth a (its peak times the drive gain) loses in
  // the curve: 1 + 1.5 a² + C a⁴ / (1 + D a²), fitted within 0.1 dB to a = 3.2.
  static constexpr float kLossC = 1.78f;
  static constexpr float kLossD = 1.606f;
  static constexpr float kSoftestLevel = 0.3f;
  static constexpr float kOutGain = 0.72f;
  static constexpr float kHoldFromSeconds = 19.9f;
  static constexpr float kLagSeconds = 0.0005f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kSilent = 1.0e-6f;

  bool sounding() const { return level_ > 0.0f || lag_.value > 0.0f; }

  int find(int note_id) const {
    for (int i = 0; i < held_; ++i) {
      if (keys_[i].note_id == note_id) return i;
    }
    return -1;
  }

  void forget(int index) {
    for (int i = index; i + 1 < held_; ++i) keys_[i] = keys_[i + 1];
    --held_;
  }

  void release_key(int note_id) {
    const int index = find(note_id);
    if (index >= 0) forget(index);
  }

  // Everything that runs on between notes, put where a first note finds it:
  // a strike from silence is the same samples whatever came before, whatever
  // the block size, and with every knob where it was last set.
  void rest() {
    phase_ = 0.0;
    first_down_.reset();
    last_down_.reset();
    clock_.reset(32);
    glide_left_ = 0;
    fall_left_ = 0;
    join_left_ = 0;
    level_ = 0.0f;
    lag_.snap(0.0f);
    last_amp_ = 0.0f;
    shape_.snap(shape_.target);
    harmonics_.snap(harmonics_.target);
    drive_.snap(drive_.target);
    volume_.snap(volume_.target);
    read_times();
  }

  // Aim the voice at the newest held key along a straight line in pitch that
  // arrives after `seconds`. From rest a time under one sample is a jump;
  // while a note sounds the line is never shorter than kJoinSeconds.
  void aim(float seconds) {
    const Key& key = keys_[held_ - 1];
    if (sounding()) seconds = kit::max(seconds, kJoinSeconds);
    const float samples = seconds * sample_rate();
    if (samples >= 1.0f) {
      glide_left_ = static_cast<int>(samples);
      glide_target_ = key.pitch;
      glide_step_ = (key.pitch - pitch_) / static_cast<float>(glide_left_);
    } else {
      glide_left_ = 0;
      pitch_ = key.pitch;
      retune_ = true;
    }
    velocity_.set_target(key.level);
  }

  // How far above the key the pitch is now, in octaves: what is left of the
  // drop, and of the line that joins a sounding note to a new drop.
  float pitch_offset() const {
    float offset = join_left_ > 0 ? join_ : 0.0f;
    if (fall_left_ > 0) offset += drop_octaves_ * (fall_level_ - kFallFloor) * kFallScale;
    return offset;
  }

  // Start the drop: Drop semitones up, on the key after Fall. `from` is the
  // offset the pitch has now; a sounding note is led from there to the new
  // curve over kJoinSeconds, a note from rest starts on the curve (`from` 0).
  void start_fall(float from) {
    using namespace sub_bass;
    const bool join = sounding();
    drop_octaves_ = param(kDrop) * (1.0f / 12.0f);
    if (drop_octaves_ > 0.0f) {
      fall_left_ = static_cast<int>(kit::max(1.0f, param(kFall) * 0.001f * sample_rate()));
      fall_level_ = 1.0f;
      fall_coeff_ = std::exp(-kFallRate / static_cast<float>(fall_left_));
    } else {
      fall_left_ = 0;
    }
    if (join) {
      join_left_ = static_cast<int>(kit::max(1.0f, kJoinSeconds * sample_rate()));
      join_ = from - drop_octaves_;
      join_step_ = join_ / static_cast<float>(join_left_);
    } else {
      join_left_ = 0;
    }
    retune_ = true;
  }

  float advance_level() {
    if (striking_) {
      attack_at_ += attack_step_;
      if (attack_at_ >= 1.0f) {
        level_ = 1.0f;
        striking_ = false;
      } else {
        // Smoothstep: no corner where the rise starts or where it ends.
        const float curve = attack_at_ * attack_at_ * (3.0f - 2.0f * attack_at_);
        level_ = attack_from_ + (1.0f - attack_from_) * curve;
      }
      return level_;
    }
    if (held_ == 0) {
      level_ *= release_coeff_;
    } else if (!hold_) {
      level_ *= decay_coeff_;
    }
    if (level_ < kSilent) level_ = 0.0f;
    return level_;
  }

  // Every 32 samples, and at a strike from rest: the rates of the loudness.
  void read_times() {
    using namespace sub_bass;
    const float sr = sample_rate();
    const float attack = param(kAttack);
    if (attack != last_attack_) {
      last_attack_ = attack;
      attack_step_ = 1.0f / kit::max(1.0f, attack * sr);
    }
    const float decay = param(kDecay);
    if (decay != last_decay_) {
      last_decay_ = decay;
      hold_ = decay >= kHoldFromSeconds;
      decay_coeff_ = std::exp(-kSixtyDb / (decay * sr));
    }
    const float release = param(kRelease);
    if (release != last_release_) {
      last_release_ = release;
      release_coeff_ = std::exp(-kSixtyDb / (release * sr));
    }
  }

  // 1 while harmonic `n` is under two thirds of the way to the top of the
  // band, 0 from the top on.
  float fade(float n) const { return kit::clamp(3.0f - n * frequency_ * fade_slope_, 0.0f, 1.0f); }

  void apply(int id) {
    using namespace sub_bass;
    const float value = param(id);
    switch (id) {
      case kShape:
        shape_.set(value, primed());
        break;
      case kHarmonics:
        harmonics_.set(value, primed());
        break;
      case kDrive:
        drive_.set(value * kMaxDrive, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // Drop, Fall and Glide are read at a key; the times on the control clock
    }
  }

  SubBassDecimator<11, 2> first_down_;  // four times the rate to twice
  SubBassDecimator<31, 1> last_down_;   // twice the rate to the sample rate
  kit::Smoother shape_, harmonics_, drive_, velocity_, volume_, lag_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  Key keys_[kMaxHeld];
  double phase_ = 0.0;
  int held_ = 0;
  int factor_ = 4;
  int glide_left_ = 0;
  int fall_left_ = 0;
  int join_left_ = 0;
  float inner_rate_ = 192000.0f;
  float inner_step_ = 0.25f;
  float max_hz_ = kMaxHz;
  float fade_slope_ = 3.0f / kFadeToHz;
  float pitch_ = kRestPitch;
  float frequency_ = 55.0f;
  double turned_by_ = -1.0;  // the step turn_sin_ and turn_cos_ were made for
  float turn_sin_ = 0.0f, turn_cos_ = 1.0f;
  float glide_step_ = 0.0f;
  float glide_target_ = kRestPitch;
  float drop_octaves_ = 0.0f;
  float fall_level_ = 0.0f;
  float fall_coeff_ = 0.0f;
  float join_ = 0.0f;
  float join_step_ = 0.0f;
  float level_ = 0.0f;
  float attack_from_ = 0.0f;
  float attack_at_ = 0.0f;
  float attack_step_ = 1.0f;
  float decay_coeff_ = 0.0f, release_coeff_ = 0.0f;
  float last_attack_ = -1.0f, last_decay_ = -1.0f, last_release_ = -1.0f;
  float last_amp_ = 0.0f;
  bool striking_ = false;
  bool hold_ = false;
  bool retune_ = false;
};

}  // namespace livemix
