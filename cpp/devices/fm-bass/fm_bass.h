#pragma once

// FM Bass: a two-operator FM bass. A sine at the key (the carrier) has its
// phase bent by a second sine (the modulator). How far it is bent, the index,
// is the brightness: it is highest when a key is struck and falls away after.
//
//   key ─► one phase, at half the key ─┬─ × 2·Ratio ─► modulator ◄─ Feedback × its own last two outputs
//                                      │                   │
//                                      │                   × index (Depth, falling over Bite to Body × Depth)
//                                      │                   ▼
//                                      ├─ × 2 ──────────► carrier ─┐
//                                      └─ × 1 ─► sub × Sub ────────┴─► ÷ rate ─► DC block ─► loudness ─► out
//
// - One voice. Held keys sit on a stack and the newest plays; letting it go
//   returns to the one under it. Every new key strikes both envelopes again;
//   pitch glides only between overlapping keys, in a straight line that
//   arrives in the Glide time.
// - All three sines read one phase, so they cannot drift against each other:
//   the wave repeats with the key at every setting (with Ratio 1/2 and with
//   the sub, every second cycle), and a bend made of sines in step puts no DC
//   under the note. The sub is mixed in upside down, so that it adds to the
//   partial Ratio 1/2 puts an octave under the key instead of cancelling it.
// - The index is Depth squared times kMaxIndex radians, more for a harder key.
//   It starts there, covers 99 % of its way to Body times that in the Bite
//   time, and stays for as long as the key is held.
// - Feedback bends the modulator by the mean of its own last two outputs,
//   towards a sawtooth. The mean takes the loop's gain to zero at half the
//   inner rate, where a bare loop hunts; kMaxFeedback is one radian, under
//   which the loop has one solution and stays a wave locked to the key.
// - Loudness: a 2 ms strike from wherever it is (never a step), a fall that
//   is 60 dB down after Decay while a key is held (at the very top it holds),
//   and Release once the last key is up. A note never rings longer after the
//   key than it would have while held: Release only shortens. The contour
//   waits the 0.7 ms the voice takes to come through the decimators, so a
//   strike shapes the first sample the voice makes.
// - A key struck from silence starts every phase at zero, so every hit from
//   rest is the same sample for sample. A key struck while the note sounds
//   carries on from where the phases are.
// - Band-limiting. The voice runs at four times the sample rate (twice from
//   60 kHz up) and comes down through two decimators, the last with its
//   stopband at half the sample rate. Sidebands between half the sample rate
//   and the first frequency that would land back in the band are removed;
//   the index is capped per pitch so that none above -60 dB reaches further
//   than that (index_cap). In the bass register the cap is far above
//   kMaxIndex; high notes tend to a sine.
// - A change of Ratio while a note sounds takes the bend down to nothing,
//   changes the modulator there and brings the bend back, 5 ms each way.
// - The only high-pass is a DC blocker at 2 Hz, before the loudness contour,
//   so a note that has ended is exact silence and not the blocker's tail.
//   (Feedback through two samples leaves about -53 dB of DC without it.)
//
// Both outputs carry the same signal. The instrument sleeps once the note has
// faded to zero.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class FmBass : public kit::DeviceBase<fm_bass::kNumParams> {
 public:
  static constexpr int kMaxHeld = 16;
  static constexpr int kNumRatios = 7;
  // The modulator's frequency in units of the sub's, half the key's: the
  // ratios 1/2, 1, 2, 3, 4, 5 and 7.
  static constexpr int kModSteps[kNumRatios] = {1, 2, 4, 6, 8, 10, 14};
  // Index in radians at Depth 1 and full velocity.
  static constexpr float kMaxIndex = 8.0f;
  // Self-bend of the modulator in radians at Feedback 1.
  static constexpr float kMaxFeedback = 1.0f;
  // The softest key bends this share of what the hardest does.
  static constexpr float kBendFloor = 0.4f;

  void init(float sample_rate) {
    using namespace fm_bass;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int i = 0; i <= kTableSize; ++i) {
      table_[i] = static_cast<float>(std::sin(2.0 * 3.14159265358979323846 * i / kTableSize));
    }
    factor_ = sr < 60000.0f ? 4 : 2;
    inner_rate_ = sr * static_cast<float>(factor_);
    late_ = factor_ == 4 ? 34 : 32;  // 2.75 + 31.5 samples, or 31.5
    fold_hz_ = inner_rate_ - 0.5f * sr;
    // Down to twice the sample rate: all that has to go is what would land
    // under half the sample rate there, the band from 1.5 to 2 times it, so
    // 23 taps do (-80 dB from 0.364 of the inner rate).
    first_.init(0.25, kKaiserBeta);
    // Down to the sample rate: flat to 0.42 of it and -80 dB from half of
    // it, so nothing above half the sample rate is left to fold. It delays
    // the voice by 31.5 samples.
    last_.init(0.23, kKaiserBeta);
    dc_.reset();
    dc_.set_cutoff(kDcBlockHz, sr);
    master_ = 0;
    fed_[0] = fed_[1] = 0.0f;
    held_ = 0;
    for (int i = 0; i < kMaxHeld; ++i) keys_[i] = Key();
    pitch_ = kStartPitch;
    frequency_ = kStartHz;
    glide_step_ = 0.0f;
    glide_pitch_ = kStartPitch;
    glide_hz_ = kStartHz;
    glide_left_ = 0;
    amp_ = 0.0f;
    bend_ = 0.0f;
    for (float& value : loud_) value = 0.0f;
    loud_at_ = 0;
    striking_ = false;
    strike_at_ = 0;
    strike_from_ = 0.0f;
    bend_from_ = 1.0f;
    strike_length_ = static_cast<int>(kStrikeSeconds * sr + 0.5f);
    if (strike_length_ < 2) strike_length_ = 2;
    gate_ = 1.0f;
    gate_step_ = 1.0f / kit::max(1.0f, kRatioFadeSeconds * sr);
    kit::Smoother* const smoothers[] = {&depth_, &body_,     &feedback_,      &sub_,
                                        &volume_, &velocity_, &bend_velocity_, &index_cap_};
    for (kit::Smoother* smoother : smoothers) smoother->set_time(kSmoothingSeconds, sr);
    velocity_.snap(0.0f);
    bend_velocity_.snap(0.0f);
    clock_.reset(kControlPeriod);
    // The decimators hold under a millisecond; nothing else outlives the note.
    idle_.reset(sr, 0.02f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    step_ = wanted_step_;
    set_cap(true);
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
    Key& key = keys_[held_++];
    key.note_id = note_id;
    key.hz = frequency;
    key.pitch = std::log2(frequency);
    key.gain = gain;

    // Nothing is sounding when the contour is at zero, which it reaches on
    // the same sample whatever the block size (sleep does not).
    const bool silent = amp_ == 0.0f;
    // A key pressed while another is held slides from it, whether or not the
    // older note has already died away. The top key of a chord whose keys
    // land together does not: its strike is pending and nothing has sounded
    // yet to slide from.
    const bool unheard = striking_ && silent;
    if (silent) rest();
    play_top(overlapping && !unheard);
    if (silent) {
      velocity_.snap(velocity_.target);
      bend_velocity_.snap(bend_velocity_.target);
      set_cap(true);
    }
    strike_from_ = amp_;
    bend_from_ = silent ? 1.0f : bend_;
    strike_at_ = 0;
    striking_ = true;
  }

  void note_off(int note_id) {
    const int index = find(note_id);
    if (index < 0) return;
    const bool was_playing = index == held_ - 1;
    drop(index);
    // Back to the key still held, if there is one, without a strike; with
    // none the note releases.
    if (was_playing && held_ > 0) play_top(amp_ > 0.0f);
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(amp_ > 0.0f || striking_)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) set_cap(false);

      if (glide_left_ > 0) {
        pitch_ += glide_step_;
        if (--glide_left_ == 0) {
          pitch_ = glide_pitch_;
          frequency_ = glide_hz_;
        } else {
          frequency_ = std::exp2(pitch_);
        }
      }
      advance_contours();
      // The loudness the voice gets is the contour of `late_` samples ago:
      // that is how long the voice takes to come out of the decimators.
      loud_[loud_at_] = amp_;
      const float loud = loud_[(loud_at_ - late_) & (kLoudLine - 1)];
      loud_at_ = (loud_at_ + 1) & (kLoudLine - 1);

      // A Ratio change under a sounding note: bend down to nothing, change
      // the modulator where it cannot be heard, bend back.
      if (step_ != wanted_step_) {
        gate_ -= gate_step_;
        if (gate_ <= 0.0f) {
          gate_ = 0.0f;
          step_ = wanted_step_;
          set_cap(true);
        }
      } else if (gate_ < 1.0f) {
        gate_ = kit::min(1.0f, gate_ + gate_step_);
      }

      const float body = body_.next();
      const float index = kit::min(
          depth_.next() * bend_velocity_.next() * (body + (1.0f - body) * bend_) * gate_, index_cap_.next());
      // The bends as steps of a 32-bit phase. Feedback is halved: it
      // multiplies the sum of the last two outputs. The index can pass half
      // a cycle, so it is kept a quarter as large and the product shifted.
      const float feedback = 0.5f * kCycles * kTurn * feedback_.next();
      const float bend = 0.25f * kTurn * index;
      const float sub = sub_.next();
      const uint64_t step =
          static_cast<uint64_t>(0.5 * static_cast<double>(frequency_) / inner_rate_ * 18446744073709551616.0);
      const uint32_t ratio = static_cast<uint32_t>(step_);

      float y[4];
      for (int k = 0; k < factor_; ++k) {
        master_ += step;
        const uint32_t turn = static_cast<uint32_t>(master_ >> 32);
        const int32_t self = static_cast<int32_t>(feedback * (fed_[0] + fed_[1]));
        const float modulator = sine(turn * ratio + static_cast<uint32_t>(self));
        fed_[1] = fed_[0];
        fed_[0] = modulator;
        const uint32_t bent = static_cast<uint32_t>(static_cast<int32_t>(bend * modulator)) << 2;
        // The sub goes in upside down: with Ratio 1/2 the bend's own lowest
        // partial lies on it, as J3 - J1 of the index, and up to an index
        // of 3 the two then add.
        y[k] = sine(turn + turn + bent) - sub * sine(turn);
      }
      float raw;
      if (factor_ == 4) {
        const float early = first_.down(y[0], y[1]);
        const float late = first_.down(y[2], y[3]);
        raw = last_.down(early, late);
      } else {
        raw = last_.down(y[0], y[1]);
      }

      const float out = kit::soft_clip(dc_.process(raw) * loud * velocity_.next() * volume_.next());
      out_left_[i] = out;
      out_right_[i] = out;
    }
    idle_.settle(output_peak(frames), frames);
  }

  // Largest index (radians) whose sidebands above -60 dB reach no further
  // than `room` modulator widths from the carrier, for a modulator bent back
  // on itself by `beta` radians.
  //
  // Under a sine the sidebands above -60 dB reach I + 1.6·sqrt(I) + 1.8
  // widths: I is the peak deviation, the rest the skirt beyond it. A fed-back
  // modulator is steeper at its zero crossing, which widens both. The two
  // factors are fitted to this voice (the stray level of its output at room
  // 11 to 52, index 1 to 8, feedback up to 0.95 radians):
  //
  //   reach(I) = I · peak + (1.6·sqrt(I) + 1.8) · skirt
  static float index_cap(float room, float beta) {
    const float peak = 1.0f + 3.2f * beta * std::sqrt(beta);
    const float skirt = 1.0f + 0.7f * beta * beta * beta;
    const float spare = room - 1.8f * skirt;
    if (spare <= 0.0f) return 0.0f;
    const float root = (std::sqrt(2.56f * skirt * skirt + 4.0f * peak * spare) - 1.6f * skirt) / (2.0f * peak);
    return root * root;
  }

 private:
  struct Key {
    int note_id = -1;
    float hz = 0.0f;
    float pitch = 0.0f;  // log2 of hz
    float gain = 0.0f;
  };

  // Two samples in, one out: a Kaiser-windowed sinc of 2·Half + 1 taps with
  // its -6 dB point at `cutoff` of the input rate, linear phase. Two of them
  // bring the voice down (see init); kit::Halfband2x serves neither step: its
  // stopband starts at 0.58 of the output rate, since a halfband's response
  // is symmetric about a quarter of its input rate, so it lets the 8 % above
  // half the sample rate fold, and that is where FM puts sidebands.
  template <int Half, int Line>
  class Decimator {
   public:
    static constexpr int kTaps = 2 * Half + 1;
    static_assert((Line & (Line - 1)) == 0 && Line > kTaps, "the line is a power of two longer than the filter");

    void init(double cutoff, double beta) {
      const double pi = 3.14159265358979323846;
      const double i0_beta = bessel_i0(beta);
      double taps[Half + 1];
      double sum = 0.0;
      for (int k = 0; k <= Half; ++k) {
        const int n = Half - k;  // distance from the centre
        const double ideal = n == 0 ? 2.0 * cutoff : std::sin(2.0 * pi * cutoff * n) / (pi * n);
        const double r = static_cast<double>(n) / Half;
        taps[k] = ideal * bessel_i0(beta * std::sqrt(1.0 - r * r)) / i0_beta;
        sum += n == 0 ? taps[k] : 2.0 * taps[k];
      }
      for (int k = 0; k <= Half; ++k) taps_[k] = static_cast<float>(taps[k] / sum);
      reset();
    }

    void reset() {
      for (float& value : line_) value = 0.0f;
      at_ = 0;
    }

    float down(float first, float second) {
      push(first);
      push(second);
      // The last kTaps samples, oldest first, lie in one piece from
      // at_ + Line - kTaps: every sample is written twice, a line apart.
      const float* x = line_ + at_ + (Line - kTaps);
      float sum = taps_[Half] * x[Half];
      for (int k = 0; k < Half; ++k) sum += taps_[k] * (x[k] + x[kTaps - 1 - k]);
      return sum;
    }

   private:
    void push(float x) {
      line_[at_] = x;
      line_[at_ + Line] = x;
      at_ = (at_ + 1) & (Line - 1);
    }

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
    float line_[2 * Line] = {};
    int at_ = 0;
  };

  // The sine of a phase held in 32 bits (one cycle is 2^32, so it wraps by
  // itself): a 4097-point table read with linear interpolation.
  // kit::SineTable is such a table behind a float phase, which costs a floor
  // per read; twelve are read per sample.
  float sine(uint32_t phase) const {
    const uint32_t index = phase >> 20;
    const float fraction = static_cast<float>(phase & 0xFFFFFu) * (1.0f / 1048576.0f);
    return table_[index] + (table_[index + 1] - table_[index]) * fraction;
  }

  static constexpr float kStartHz = 55.0f;
  static constexpr float kStartPitch = 5.7813597f;  // log2(kStartHz)
  static constexpr float kCycles = 0.15915494f;     // radians to cycles
  static constexpr float kTurn = 4294967296.0f;     // cycles to steps of a 32-bit phase
  static constexpr double kKaiserBeta = 7.857;      // a stopband of 80 dB
  static constexpr float kSubGain = 1.0f;           // Sub 1 is as loud as the carrier
  // One key at gain 0.7 peaks near -15 dBFS at the default Volume. Up to C4
  // nothing the knobs can do there passes 0.48, under the soft clip's knee
  // (at 44.1 kHz and up). Higher keys can pass it: the loudest patch (Ratio
  // 7, Depth near full, Sub full, no Feedback, a hard key from B flat 4 up)
  // peaks at 0.54, because a wide bend cut off at the top of the band is no
  // longer a wave of constant height.
  static constexpr float kOutGain = 0.6f;
  static constexpr float kStrikeSeconds = 0.002f;
  static constexpr float kRatioFadeSeconds = 0.005f;
  static constexpr float kHoldFromSeconds = 19.9f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kBiteNepers = 4.605170186f;  // 99 % of the way
  static constexpr float kSilent = 1.0e-5f;
  static constexpr float kDcBlockHz = 2.0f;
  static constexpr int kControlPeriod = 32;
  static constexpr int kTableSize = 4096;
  static constexpr int kLoudLine = 64;
  // The share of the room the cap may use: the margin of the -60 dB fit.
  static constexpr float kRoomUsed = 0.9f;

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

  // A strike from silence: every phase at zero and every filter empty, so
  // each hit from rest is the same samples. Nothing sounds, so whatever a
  // knob was on its way to has arrived, and the control clock starts over.
  void rest() {
    master_ = 0;
    fed_[0] = fed_[1] = 0.0f;
    first_.reset();
    last_.reset();
    dc_.reset();
    for (float& value : loud_) value = 0.0f;
    step_ = wanted_step_;
    gate_ = 1.0f;
    kit::Smoother* const knobs[] = {&depth_, &body_, &feedback_, &sub_, &volume_};
    for (kit::Smoother* knob : knobs) knob->snap(knob->target);
    clock_.reset(kControlPeriod);
  }

  // Aim the voice at the newest held key: a straight line in pitch that
  // arrives in the Glide time when `slide`, a jump otherwise.
  void play_top(bool slide) {
    const Key& key = keys_[held_ - 1];
    const float samples = param(fm_bass::kGlide) * sample_rate();
    if (slide && samples >= 1.0f) {
      glide_left_ = static_cast<int>(samples);
      glide_pitch_ = key.pitch;
      glide_hz_ = key.hz;
      glide_step_ = (key.pitch - pitch_) / static_cast<float>(glide_left_);
    } else {
      glide_left_ = 0;
      pitch_ = key.pitch;
      frequency_ = key.hz;
    }
    velocity_.set_target(0.35f + 0.65f * key.gain);
    bend_velocity_.set_target(kBendFloor + (1.0f - kBendFloor) * key.gain);
  }

  // One sample of both contours: loudness in amp_, the bend's fall in bend_.
  void advance_contours() {
    if (striking_) {
      // A smooth step from wherever each stands to the top: no slope at
      // either end, so a strike is never a step.
      ++strike_at_;
      const float t = static_cast<float>(strike_at_) / static_cast<float>(strike_length_);
      const float rise = t * t * (3.0f - 2.0f * t);
      amp_ = strike_from_ + (1.0f - strike_from_) * rise;
      bend_ = bend_from_ + (1.0f - bend_from_) * rise;
      if (strike_at_ >= strike_length_) {
        amp_ = 1.0f;
        bend_ = 1.0f;
        striking_ = false;
      }
      return;
    }
    if (held_ == 0) {
      amp_ *= release_coeff_;
    } else if (!hold_) {
      amp_ *= decay_coeff_;
    }
    if (amp_ < kSilent) {
      amp_ = 0.0f;
      // A slide nobody can hear any more has arrived: where the next one
      // starts must not depend on when the instrument fell asleep.
      if (glide_left_ > 0) {
        glide_left_ = 0;
        pitch_ = glide_pitch_;
        frequency_ = glide_hz_;
      }
    }
    bend_ *= bite_coeff_;
    if (bend_ < 1.0e-6f) bend_ = 0.0f;
  }

  // The index cap for where the pitch is now, on the control clock.
  void set_cap(bool snap) {
    const float modulator_hz = 0.5f * frequency_ * static_cast<float>(step_);
    const float room = kRoomUsed * (fold_hz_ - frequency_) / modulator_hz;
    const float cap = kCycles * index_cap(room, kit::max(feedback_.value, feedback_.target));
    if (snap) {
      index_cap_.snap(cap);
    } else {
      index_cap_.set_target(cap);
    }
  }

  void apply(int id) {
    using namespace fm_bass;
    const float value = param(id);
    switch (id) {
      case kRatio:
        // Taken at the next strike from silence, or faded to in process().
        wanted_step_ = kModSteps[kit::clamp_int(static_cast<int>(value + 0.5f), 0, kNumRatios - 1)];
        break;
      case kDepth:
        depth_.set(kCycles * kMaxIndex * value * value, primed());
        break;
      case kBite:
        bite_coeff_ = std::exp(-kBiteNepers / (value * sample_rate()));
        break;
      case kBody:
        body_.set(value, primed());
        break;
      case kFeedback:
        // Finer towards the top, where the tone changes fastest.
        feedback_.set(kMaxFeedback * value * (2.0f - value), primed());
        break;
      case kSub:
        sub_.set(kSubGain * value, primed());
        break;
      case kDecay:
      case kRelease: {
        const float sr = sample_rate();
        const float decay = param(kDecay);
        hold_ = decay >= kHoldFromSeconds;
        decay_coeff_ = std::exp(-kSixtyDb / (decay * sr));
        const float release = hold_ ? param(kRelease) : kit::min(param(kRelease), decay);
        release_coeff_ = std::exp(-kSixtyDb / (release * sr));
        break;
      }
      case kVolume:
        volume_.set(kOutGain * kit::db_to_gain(value), primed());
        break;
      default:
        break;  // Glide is read when a key slides
    }
  }

  Decimator<11, 32> first_;
  Decimator<63, 128> last_;
  kit::DcBlocker dc_;
  kit::Smoother depth_, body_, feedback_, sub_, volume_, velocity_, bend_velocity_, index_cap_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  Key keys_[kMaxHeld];
  float table_[kTableSize + 1] = {};
  float loud_[kLoudLine] = {};  // the loudness contour's last samples
  uint64_t master_ = 0;  // phase of the sub; one cycle is 2^64
  float fed_[2] = {0.0f, 0.0f};
  int held_ = 0;
  int factor_ = 4;
  int step_ = 2, wanted_step_ = 2;
  int glide_left_ = 0;
  int strike_at_ = 0, strike_length_ = 96;
  int loud_at_ = 0, late_ = 34;
  float inner_rate_ = 192000.0f;
  float fold_hz_ = 168000.0f;
  float pitch_ = kStartPitch;
  float frequency_ = kStartHz;
  float glide_step_ = 0.0f;
  float glide_pitch_ = kStartPitch;
  float glide_hz_ = kStartHz;
  float amp_ = 0.0f, bend_ = 0.0f;
  float strike_from_ = 0.0f, bend_from_ = 1.0f;
  float gate_ = 1.0f, gate_step_ = 0.0f;
  float decay_coeff_ = 0.0f, release_coeff_ = 0.0f, bite_coeff_ = 0.0f;
  bool striking_ = false;
  bool hold_ = false;
};

}  // namespace livemix
