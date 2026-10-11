#pragma once

// Acid Bass: a one-voice bass line synthesizer.
//
//   oscillator (saw | square) ─► three-pole low-pass ─► Drive ─► ÷ rate ─► DC block ─► loudness ─► out
//                                      ▲                                                  ▲
//        Cutoff × 2^(Env Mod · filter envelope + accent store)              loudness envelope × velocity
//
// - One voice. Held keys sit on a stack and the newest plays. A key struck
//   with none held strikes both envelopes and starts on pitch. A key pressed
//   while another is held (a tie) slides to the new pitch and is heard: the
//   loudness rises from wherever it has fallen to back to full over 8 ms and
//   falls again from there. That is all a tie strikes: the filter envelope
//   and the accent store carry on from where they are, and the oscillator
//   runs on. Letting the top key go slides back to the one under it and
//   strikes nothing at all. (A key over a held note that has faded to
//   complete silence has nothing to slide from, and strikes.)
// - The slide is an exponential approach in pitch, as a capacitor charges:
//   it has covered 99 % of the interval after the Slide time.
// - One oscillator, a sawtooth or a square read from one phase and
//   band-limited by PolyBLEP. Oscillator, filter and Drive run at four times
//   the sample rate (twice from 60 kHz up) and come down through
//   kit::Halfband2x, so what resonance and Drive make above the audible band
//   is removed before it can fold back.
// - The filter is three one-pole stages in a loop (18 dB an octave), solved
//   without a delay and saturated where the feedback meets the input. Three
//   stages turn the phase by 180 degrees at 1.73 times their own corner, so
//   the stages are tuned down as Resonance rises and the peak stays on
//   Cutoff. Part of what the loop takes from the passband is given back
//   after the filter, so resonance does not thin the bass.
// - Two envelopes. Loudness: a 2 ms strike (8 ms back to full for a tie), a
//   fall that is 60 dB down after Sustain while a key is held (at the top it
//   holds), and its own short release once no key is held. Filter: a 2 ms
//   strike, then a fall that has come nine tenths of the way back after
//   Decay, key held or not.
// - A note struck harder than a gain of 0.7 is accented, by an amount that
//   grows to gain 1 and with Accent: louder, its filter envelope reaches an
//   octave further and falls fast whatever Decay says, and that envelope
//   charges a leaky store whose level opens the filter further still. The
//   store drains over a few hundred milliseconds, so accents in a row find
//   it part full and open further each time.
// - Drive is a saturator after the filter and before the loudness envelope,
//   so a note keeps its tone as it fades and the envelope times stay what
//   they say. Its gain in dB follows the control as d(2 - d): the part of
//   that gain which stays under the curve's knee is passed early, and the
//   lower half of the travel is heard. The curve bends into a square root
//   instead of a hard limit: how much a limiter takes depends on the patch
//   (a closed filter leaves a sine, an open one a spike), and no one make-up
//   gain holds the level for both; under this curve the level stays within
//   2 dB over the patches the harness tries.
// - Struck from silence, everything that could remember the last note is put
//   back (oscillator phase, filter, envelopes, smoothers): every hit from
//   rest is the same hit, sample for sample. Only the accent store carries
//   over, and the instrument stays awake until it has drained.
//
// Both outputs carry the same signal. The only high-pass is a DC blocker at
// 2 Hz, before the loudness envelope.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class AcidBass : public kit::DeviceBase<acid_bass::kNumParams> {
 public:
  static constexpr int kMaxHeld = 16;

  void init(float sample_rate) {
    using namespace acid_bass;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    factor_ = sr < 60000.0f ? 4 : 2;
    inner_rate_ = sr * static_cast<float>(factor_);
    for (kit::Halfband2x& stage : down_) stage.init();
    filter_.reset();
    dc_.reset();
    dc_.set_cutoff(kDcBlockHz, sr);
    osc_.phase = kStartPhase;
    held_ = 0;
    for (int i = 0; i < kMaxHeld; ++i) keys_[i] = Key();
    pitch_ = kRestPitch;
    slide_target_ = kRestPitch;
    sliding_ = false;
    frequency_ = std::exp2(kRestPitch);
    amp_level_ = 0.0f;
    filter_level_ = 0.0f;
    store_ = 0.0f;
    accent_ = 0.0f;
    striking_ = false;
    rising_ = false;
    filter_striking_ = false;
    hold_ = false;
    last_sustain_ = -1.0f;
    last_slide_ = -1.0f;
    last_decay_ = -1.0f;
    last_resonance_ = -1.0f;
    last_drive_ = -1.0f;
    strike_rate_ =
        1.0f - std::exp(std::log((kStrikeTarget - 1.0f) / kStrikeTarget) / kit::max(1.0f, kStrikeSeconds * sr));
    tie_rate_ =
        1.0f - std::exp(std::log((kStrikeTarget - 1.0f) / kStrikeTarget) / kit::max(1.0f, kTieSeconds * sr));
    release_coeff_ = std::exp(-1.0f / (kReleaseTau * sr));
    charge_rate_ = 1.0f - std::exp(-1.0f / (kStoreChargeTau * sr));
    drain_coeff_ = std::exp(-1.0f / (kStoreDrainTau * sr));
    for (kit::Smoother* smoother : smoothers()) smoother->set_time(kSmoothingSeconds, sr);
    level_.set_time(kSmoothingSeconds, sr);
    level_.snap(0.0f);
    clock_.reset(32);
    // Nothing outlives the loudness envelope: the output is exact zero from
    // the sample it ends.
    idle_.reset(sr, 0.02f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    using namespace acid_bass;
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, 8.0f, 12000.0f);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);

    release_key(note_id);
    const bool overlapping = held_ > 0;
    if (held_ == kMaxHeld) drop(0);  // a full stack forgets its oldest key
    Key& key = keys_[held_++];
    key.note_id = note_id;
    key.pitch = std::log2(frequency);
    // Accented from a gain of 0.7 up, by as much as Accent allows.
    key.accent = kit::clamp((gain - kAccentFrom) / (1.0f - kAccentFrom), 0.0f, 1.0f) * param(kAccent);
    key.level = (kLevelFloor + (1.0f - kLevelFloor) * gain) * (1.0f + kAccentBoost * key.accent);

    const bool silent = amp_level_ == 0.0f;
    if (overlapping && !silent) {
      // A key over a sounding one: slide. The filter envelope and the accent
      // are left alone; the loudness comes back to full and falls again.
      slide_to(key.pitch);
      level_.set_target(key.level);
      rising_ = !striking_;
      return;
    }
    if (silent) {
      restart();
      level_.snap(key.level);
    } else {
      level_.set_target(key.level);
    }
    pitch_ = key.pitch;
    slide_target_ = key.pitch;
    sliding_ = false;
    frequency_ = std::exp2(key.pitch);
    accent_ = key.accent;
    set_filter_decay();
    striking_ = true;
    rising_ = false;
    filter_striking_ = true;
  }

  void note_off(int note_id) {
    const int index = find(note_id);
    if (index < 0) return;
    const bool was_playing = index == held_ - 1;
    drop(index);
    if (!was_playing || held_ == 0) return;  // with none held the loudness envelope releases
    // Back to the key still held, sliding if anything is sounding.
    const Key& key = keys_[held_ - 1];
    if (amp_level_ > 0.0f) {
      slide_to(key.pitch);
      level_.set_target(key.level);
    } else {
      pitch_ = key.pitch;
      slide_target_ = key.pitch;
      sliding_ = false;
      frequency_ = std::exp2(key.pitch);
      level_.snap(key.level);
    }
  }

  void process(int frames) {
    using namespace acid_bass;
    frames = begin_block(frames);
    if (!idle_.wake(amp_level_ > 0.0f || striking_ || store_ > 0.0f)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    for (int i = 0; i < frames; ++i) {
      if (amp_level_ == 0.0f && !striking_) {
        // At rest: only the filter envelope and the accent store move on,
        // and the next strike puts everything else back.
        advance_filter_envelope();
        out_left_[i] = 0.0f;
        out_right_[i] = 0.0f;
        continue;
      }
      if (clock_.tick()) control();

      if (sliding_) {
        // In double: a float pitch moves in steps of half a millionth of an
        // octave, and the last steps of a slow slide are smaller than that,
        // so it would stop short of the key and stay there (3 cents at
        // 48 kHz with a 1 s Slide, 12 at 192 kHz).
        pitch_ += static_cast<double>(slide_rate_) * (slide_target_ - pitch_);
        const double left = slide_target_ - pitch_;
        if (left > -kArrived && left < kArrived) {
          pitch_ = slide_target_;
          sliding_ = false;
          frequency_ = std::exp2(slide_target_);  // as a strike on that key
        } else {
          frequency_ = static_cast<float>(std::exp2(pitch_));
        }
      }
      const float amp = advance_amp_envelope();
      const float opening = advance_filter_envelope();

      // Where the filter stands: Cutoff, opened by the envelope and by the
      // accent store, with the stages tuned so the peak sits there.
      const float resonance = resonance_.next();
      if (resonance != last_resonance_) set_resonance(resonance);
      const float octaves =
          (env_mod_.next() * kEnvOctaves + accent_ * kAccentStrikeOctaves) * opening + kAccentOctaves * store_;
      float cutoff = cutoff_.next();
      if (octaves > 0.0f) cutoff *= std::exp2(octaves);
      filter_.set(kit::min(cutoff, kMaxCutoffHz) * stage_ratio_, feedback_, inner_rate_);

      const float wave = wave_.next();
      const float saw_gain = kOscGain * (1.0f - wave);
      const float square_gain = kOscGain * kSquareLevel * wave;
      // The passband level resonance took comes back before the saturator.
      const float drive = drive_.next();
      if (drive != last_drive_) set_drive(drive);
      const float into_drive = drive_pre_ * passband_;
      const float out_of_drive = drive_post_;
      const double step = static_cast<double>(frequency_) / inner_rate_;

      float y[4];
      for (int k = 0; k < factor_; ++k) {
        float saw, square;
        osc_.next(step, &saw, &square);
        const float filtered = filter_.process(saw_gain * saw + square_gain * square);
        y[k] = saturate(filtered * into_drive) * out_of_drive;
      }
      float driven;
      if (factor_ == 4) {
        const float first = down_[0].down(y[0], y[1]);
        const float second = down_[0].down(y[2], y[3]);
        driven = down_[1].down(first, second);
      } else {
        driven = down_[1].down(y[0], y[1]);
      }

      const float out = kit::soft_clip(dc_.process(driven) * amp * level_.next() * volume_.next());
      out_left_[i] = out;
      out_right_[i] = out;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  struct Key {
    int note_id = -1;
    float pitch = 0.0f;   // log2 of the frequency
    float level = 0.0f;   // loudness from its velocity, accent included
    float accent = 0.0f;  // 0 plain .. 1 fully accented
  };

  // A sawtooth and a square read from one phase, band-limited with the
  // PolyBLEP residual of kit::BlepOsc (whose shapes each advance the phase,
  // so it cannot fade from one to the other).
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

  // Three-pole low-pass: three trapezoidal one-pole stages with the third
  // fed back to the input, the loop solved without a delay (as kit::Ladder
  // does for four) and saturated where feedback and input meet. With three
  // stages the loop starts to oscillate at a feedback of 8, at 1.73 times
  // the stages' corner; `feedback` stays under that. Whatever comes in, the
  // saturator holds every stage inside ±1.
  struct ThreePole {
    float s[3] = {0.0f, 0.0f, 0.0f};
    float big_g = 0.1f;   // g / (1 + g) of one stage
    float tail = 0.0f;    // 1 - big_g
    float feedback = 0.0f;
    float solve = 1.0f;   // 1 / (1 + feedback · big_g³)

    void reset() { s[0] = s[1] = s[2] = 0.0f; }

    // `hz` is the corner of the stages, not of the peak.
    void set(float hz, float k, float sample_rate) {
      const float g = kit::tan_prewarp(kit::kPi * kit::clamp(hz, 5.0f, sample_rate * 0.45f) / sample_rate);
      big_g = g / (1.0f + g);
      tail = 1.0f - big_g;
      feedback = k;
      solve = 1.0f / (1.0f + k * big_g * big_g * big_g);
    }

    float process(float x) {
      // What the stages' states alone put on the third output.
      const float sigma = tail * ((big_g * s[0] + s[1]) * big_g + s[2]);
      float y = kit::fast_tanh((x - feedback * sigma) * solve);
      for (int i = 0; i < 3; ++i) {
        const float v = (y - s[i]) * big_g;
        y = v + s[i];
        s[i] = flush_denormal(y + v);
      }
      return y;
    }
  };

  static constexpr float kRestPitch = 5.7813597f;  // log2(55): where the voice sits before any key
  static constexpr double kStartPhase = 0.5;       // the sawtooth's zero crossing
  static constexpr float kOscGain = 0.25f;         // well inside the filter's saturator
  static constexpr float kSquareLevel = 0.55f;     // a square's fundamental is twice a sawtooth's
  static constexpr float kMaxCutoffHz = 18000.0f;
  static constexpr float kEnvOctaves = 5.0f;       // Env Mod 1: five octaves above Cutoff
  static constexpr float kAccentStrikeOctaves = 1.0f;  // what a full accent adds to its own strike
  static constexpr float kAccentOctaves = 4.0f;        // what a full accent store would add
  // The loop oscillates at 8; Resonance 1 stops just short of it.
  static constexpr float kMaxFeedback = 7.7f;
  // With no resonance the stages sit a little above Cutoff, which puts the
  // response one and two octaves above it at 19 and 35 dB down: the 18 dB
  // slope read from Cutoff.
  static constexpr float kOpenRatio = 1.09f;
  // Share of the passband loss (1 / (1 + feedback)) given back after the filter.
  static constexpr float kBassKept = 0.6f;
  static constexpr float kAccentFrom = 0.7f;
  static constexpr float kLevelFloor = 0.3f;
  static constexpr float kAccentBoost = 0.58f;        // with velocity: 6 dB from gain 0.7 to gain 1
  static constexpr float kAccentDecaySeconds = 0.2f;  // a full accent's filter fall
  static constexpr float kStoreChargeTau = 0.15f;
  static constexpr float kStoreDrainTau = 0.35f;
  static constexpr float kStoreEmpty = 1.0e-3f;
  static constexpr float kStrikeSeconds = 0.002f;
  static constexpr float kStrikeTarget = 1.3f;
  static constexpr float kTieSeconds = 0.008f;     // a tied key's rise back to full, from silence
  static constexpr float kReleaseTau = 0.0035f;    // 40 dB down after 16 ms
  static constexpr float kHoldFromSeconds = 19.9f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kTwentyDb = 2.302585093f;
  static constexpr float kSlideArrival = 4.605170186f;  // ln 100: 99 % of the way
  static constexpr float kArrived = 1.0e-5f;            // octaves: a hundredth of a cent
  static constexpr float kSilent = 1.0e-6f;
  static constexpr float kMaxDriveDb = 36.0f;
  static constexpr float kDriveFloor = 0.6f;     // gain into the saturator at Drive 0: clean
  static constexpr float kDriveNominal = 0.13f;   // the level Drive's make-up is fitted to
  static constexpr float kOutGain = 1.7f;
  static constexpr float kDcBlockHz = 2.0f;

  struct SmootherList {
    kit::Smoother* items[6];
    kit::Smoother** begin() { return items; }
    kit::Smoother** end() { return items + 6; }
  };
  // Every smoothed knob; the note's own level is set where a key is taken.
  SmootherList smoothers() {
    return {{&wave_, &cutoff_, &resonance_, &env_mod_, &drive_, &volume_}};
  }

  // Drive's curve: a straight line through zero that bends over into a
  // square root, so a loud note still comes out louder than a quiet one (a
  // hard limit would flatten accents and the filter's sweep) while the zero
  // crossings steepen with the gain, which is where the buzz comes from.
  static float saturate(float x) { return x / std::sqrt(std::sqrt(1.0f + x * x)); }

  // What a signal at the nominal level loses to the curve at gain `pre`.
  static float made_up(float pre) {
    const float driven = pre * kDriveNominal;
    return std::sqrt(std::sqrt(1.0f + driven * driven));
  }

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

  void slide_to(float pitch) {
    slide_target_ = pitch;
    sliding_ = pitch != pitch_;
  }

  // Nothing is sounding: put back everything the last note left behind, so
  // the strike that follows is the same whatever came before and whenever
  // the instrument fell asleep. A knob moved in the silence has arrived.
  void restart() {
    osc_.phase = kStartPhase;
    filter_.reset();
    for (kit::Halfband2x& stage : down_) stage.reset();
    dc_.reset();
    filter_level_ = 0.0f;
    for (kit::Smoother* smoother : smoothers()) smoother->snap(smoother->target);
    clock_.reset(32);  // the first sample of the note reads Sustain, Slide and Decay
  }

  float advance_amp_envelope() {
    if (striking_) {
      amp_level_ += strike_rate_ * (kStrikeTarget - amp_level_);
      if (amp_level_ >= 1.0f) {
        amp_level_ = 1.0f;
        striking_ = false;
      }
      return amp_level_;
    }
    if (held_ == 0) {
      rising_ = false;
      amp_level_ *= release_coeff_;
    } else if (rising_) {
      // A tie: back to full from wherever the fall has got to, at its own
      // slower rate, then the fall starts again.
      amp_level_ += tie_rate_ * (kStrikeTarget - amp_level_);
      if (amp_level_ >= 1.0f) {
        amp_level_ = 1.0f;
        rising_ = false;
      }
    } else if (!hold_) {
      amp_level_ *= sustain_coeff_;
    }
    if (amp_level_ < kSilent) amp_level_ = 0.0f;
    return amp_level_;
  }

  // The filter envelope, and the accent store it charges. An accented
  // envelope fills the store through a resistance; the store empties by
  // itself, more slowly.
  float advance_filter_envelope() {
    if (filter_striking_) {
      filter_level_ += strike_rate_ * (kStrikeTarget - filter_level_);
      if (filter_level_ >= 1.0f) {
        filter_level_ = 1.0f;
        filter_striking_ = false;
      }
    } else if (filter_level_ > 0.0f) {
      filter_level_ *= filter_coeff_;
      if (filter_level_ < kSilent) filter_level_ = 0.0f;
    }
    const float feed = accent_ * filter_level_;
    if (feed > store_) {
      store_ += charge_rate_ * (feed - store_);
    } else {
      store_ *= drain_coeff_;
    }
    if (store_ < kStoreEmpty && feed < kStoreEmpty) store_ = 0.0f;
    return filter_level_;
  }

  // The filter envelope's fall: nine tenths of the way back after Decay, and
  // for an accented note no slower than the accent's own short fall.
  void set_filter_decay() {
    float seconds = param(acid_bass::kDecay);
    last_decay_ = seconds;
    if (accent_ > 0.0f && seconds > kAccentDecaySeconds) {
      seconds *= std::pow(kAccentDecaySeconds / seconds, accent_);
    }
    filter_coeff_ = std::exp(-kTwentyDb / (seconds * sample_rate()));
  }

  // Resonance as loop feedback, the stage tuning that keeps the peak on
  // Cutoff, and the passband level given back. In the linear filter the peak
  // of three equal stages with feedback k is at sqrt(sqrt(2k) - 1) times
  // their corner (there is no peak below k = 0.5).
  void set_resonance(float resonance) {
    last_resonance_ = resonance;
    feedback_ = kMaxFeedback * resonance;
    const float peak = std::sqrt(2.0f * feedback_) - 1.0f;
    stage_ratio_ = peak > 0.0f ? kit::min(kOpenRatio, 1.0f / std::sqrt(peak)) : kOpenRatio;
    passband_ = 1.0f + kBassKept * feedback_;
  }

  // Drive as gain into the saturator, and what comes back out: the gain of a
  // small signal at Drive 0, less what a signal at the nominal level gains
  // on the way. Both follow the one smoothed setting, so the two stay
  // matched while it moves.
  void set_drive(float drive) {
    last_drive_ = drive;
    // The gain in dB follows d(2 - d): straight in d, the first half of the
    // travel stayed under the curve's knee and did nothing to be heard.
    const float travel = drive * (2.0f - drive);
    drive_pre_ = kDriveFloor * std::exp(travel * kMaxDriveDb * 0.1151292546f);  // dB to gain
    drive_post_ = kOutGain * made_up(drive_pre_) / (made_up(kDriveFloor) * drive_pre_);
  }

  // Every 32 samples: the rates that follow Sustain, Slide and Decay.
  void control() {
    using namespace acid_bass;
    const float sr = sample_rate();
    const float sustain = param(kSustain);
    if (sustain != last_sustain_) {
      last_sustain_ = sustain;
      hold_ = sustain >= kHoldFromSeconds;
      sustain_coeff_ = std::exp(-kSixtyDb / (sustain * sr));
    }
    const float slide = param(kSlide);
    if (slide != last_slide_) {
      last_slide_ = slide;
      slide_rate_ = 1.0f - std::exp(-kSlideArrival / kit::max(1.0f, slide * sr));
    }
    if (param(kDecay) != last_decay_) set_filter_decay();
  }

  void apply(int id) {
    using namespace acid_bass;
    const float value = param(id);
    switch (id) {
      case kWave:
        wave_.set(value >= 0.5f ? 1.0f : 0.0f, primed());
        break;
      case kCutoff:
        cutoff_.set(value, primed());
        break;
      case kResonance:
        resonance_.set(value, primed());
        break;
      case kEnvMod:
        env_mod_.set(value, primed());
        break;
      case kDrive:
        drive_.set(value, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // Decay, Accent, Slide and Sustain are read where they are used
    }
  }

  kit::Halfband2x down_[2];
  ThreePole filter_;
  kit::DcBlocker dc_;
  WaveOsc osc_;
  kit::Smoother wave_, cutoff_, resonance_, env_mod_, drive_, level_, volume_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  Key keys_[kMaxHeld];
  int held_ = 0;
  int factor_ = 4;
  float inner_rate_ = 192000.0f;
  double pitch_ = kRestPitch;  // log2 of the frequency; double so that a slide arrives
  float slide_target_ = kRestPitch;
  float frequency_ = 55.0f;
  float slide_rate_ = 1.0f;
  float amp_level_ = 0.0f;
  float filter_level_ = 0.0f;
  float store_ = 0.0f;
  float accent_ = 0.0f;
  float strike_rate_ = 0.0f, tie_rate_ = 0.0f;
  float sustain_coeff_ = 0.0f, release_coeff_ = 0.0f, filter_coeff_ = 0.0f;
  float charge_rate_ = 0.0f, drain_coeff_ = 0.0f;
  float feedback_ = 0.0f, stage_ratio_ = kOpenRatio, passband_ = 1.0f;
  float drive_pre_ = kDriveFloor, drive_post_ = kOutGain / kDriveFloor;
  float last_sustain_ = -1.0f, last_slide_ = -1.0f, last_decay_ = -1.0f, last_resonance_ = -1.0f;
  float last_drive_ = -1.0f;
  bool sliding_ = false;
  bool striking_ = false;
  bool rising_ = false;  // a tied key is bringing the loudness back to full
  bool filter_striking_ = false;
  bool hold_ = false;
};

}  // namespace livemix
