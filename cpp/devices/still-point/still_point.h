#pragma once

// Still Point: held keys are steady tones, and one sine sweeps slowly back
// and forth through them.
//
//   per key: one phase ─► sine + partials 2, 3, 4 (Warmth) ─► envelope · gain ─┐
//   (up to eight keys)                                                         ├─► keys ──┐
//                                 scaled by the root of the keys' summed power ┘          ├─► Ears ─► Volume ─► out
//   sweep clock ─► triangle ─► pitch between the limits ─► one sine · Level · gate ───────┘
//
// - The sweep's place is a triangle on a double clock: one pass from limit to
//   limit takes Time seconds and is linear in pitch. The limits are Reach
//   semitones under the lowest held key and Reach over the highest; they
//   follow the held keys and Reach through two one poles of kLimitSeconds
//   each (a glide that starts and lands level), and stand still while no key
//   is held. Where the sine
//   crosses a key the beat between the two slows to nothing and speeds away.
// - The sine's level is Level times the loudest key's own (envelope and gain),
//   so it fades in with the keys, stands at Level against one key whatever
//   that key's gain, and stops with the last release.
// - Ears is the family's law (kit/beat.h) with the keys as the first part and
//   the sine as the second: at 1 the keys are in the left ear and the sine in
//   the right, at 0 both sides are the same sample for sample, and the mid is
//   the same at every setting.
// - The keys are scaled by 1 / sqrt(max(1, sum of (envelope · gain)²)), so
//   eight keys at full gain reach the edge of the soft clip's knee at the
//   default Volume and no further; the clip is a guard only.
//
// What restarts, and when: at the sample where a key arrives with no voice
// sounding, the sweep goes back to the lower limit going up, the sine to phase
// 0, the control clock to its first tick, and every smoothed control to its
// target; the limits are taken from whatever keys have landed by the first
// sample after it, in any order. A later key joins the sweep under way.
// Nothing is carried through a silence, so the output is the same whatever
// the host's block size and whether or not the device fell asleep.

#include "../../kit/kit.h"
#include "../../kit/beat.h"
#include "params.gen.h"

namespace livemix {

class StillPoint : public kit::DeviceBase<still_point::kNumParams> {
 public:
  static constexpr int kMaxVoices = 8;
  // What Warmth adds at full: the second, third and fourth partials as shares
  // of the fundamental. The even ones are cosines, which keeps the peak of
  // the whole tone at 1.19 of the fundamental's instead of 1.45.
  static constexpr float kPartial2 = 0.5f;
  static constexpr float kPartial3 = 0.3f;
  static constexpr float kPartial4 = 0.15f;
  // The limits follow the held keys and Reach through two one poles in a
  // row, each of this many seconds: a step becomes 1 - (1 + t/T) e^(-t/T),
  // which starts with no slope, so a chord let go a finger at a time (tens of
  // milliseconds apart) hardly moves them before the last key freezes them.
  static constexpr double kLimitSeconds = 0.4;
  // One key at full gain, before Volume and before the Ears law. With the
  // default Volume of -6 dB a full pool in step peaks at
  // sqrt(8) · 0.352 · 0.501 = 0.499, just inside the knee.
  static constexpr float kBase = 0.352f;
  // A stolen voice fades over this long (60 dB of it) before the new key starts.
  static constexpr float kStealSeconds = 0.02f;

  void init(float sample_rate) {
    using namespace still_point;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    kit::SineTable::init();
    const float sr = this->sample_rate();
    control_period_ = sr > 60000.0f ? 32 : 16;
    limit_coeff_ = 1.0 - std::exp(-static_cast<double>(control_period_) / (kLimitSeconds * static_cast<double>(sr)));
    top_hz_ = kit::min(12000.0f, 0.45f * sr);
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      voice.env.set_sample_rate(sr);
      voice.gain.set_time(kSmoothingSeconds, sr);
    }
    pending_ = 0;
    level_.set_time(kSmoothingSeconds, sr);
    ears_.set_time(kSmoothingSeconds, sr);
    warmth_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    sweep_.reset();
    clock_.reset(control_period_);
    sine_phase_ = 0.0;
    sine_increment_ = 0.0;
    sine_step_ = 0.0;
    low_key_ = high_key_ = 69.0;
    low_ = high_ = low_lag_ = high_lag_ = 69.0;
    reach_ = reach_lag_ = 0.0;
    holding_ = false;
    sine_pitch_ = 69.0;
    gate_ = 0.0f;
    fresh_ = true;
    peak_slope_ = full_warmth_peak() - 1.0f;
    idle_.reset(sr, 0.05f);  // nothing outlives the envelopes
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // not a number
    frequency = kit::clamp(frequency, 8.0f, top_hz_);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    if (pool_.count_active() == 0) restart();

    const int held = pool_.find_held(note_id);
    if (held >= 0) {
      Voice& again = pool_.voices[held];
      if (again.pending) {
        // Struck again before it could start: the waiting key is this one.
        again.next_frequency = frequency;
        again.next_gain = gain;
        retarget();
        return;
      }
      if (again.frequency == frequency) {
        // A held key struck again carries on in its own voice, in phase with
        // itself, and takes the new gain smoothly.
        again.gain.set_target(gain);
        again.env.gate_on();
        return;
      }
      // Another pitch under the same id: the old one makes way.
      again.env.fast_release(kStealSeconds);
    }

    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    if (stolen) {
      // The old key fades out first; the new one waits in the voice.
      if (!voice.pending) {
        voice.pending = true;
        ++pending_;
        voice.env.fast_release(kStealSeconds);
      }
      voice.next_frequency = frequency;
      voice.next_gain = gain;
    } else {
      start(voice, frequency, gain);
    }
    retarget();
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held < 0) return;
    Voice& voice = pool_.voices[held];
    if (voice.pending) {
      // Let go before it could start: the voice just finishes its fade.
      voice.pending = false;
      --pending_;
    } else {
      voice.env.gate_off();
    }
    retarget();
  }

  // For a display. 0: the sine's pitch, 1 and 2: the lower and the upper
  // limit, all in semitones on the MIDI scale (69 is A at 440 Hz); 3: the
  // sine's gate, the loudest key's envelope times its gain, 0 at rest.
  float meter(int index) const {
    if (index == 0) return static_cast<float>(sine_pitch_);
    if (index == 1) return static_cast<float>(low_ - reach_);
    if (index == 2) return static_cast<float>(high_ + reach_);
    if (index == 3) return gate_;
    return 0.0f;
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
      fresh_ = false;
      if (pending_ > 0) begin_pending();

      const float warmth = warmth_.next();
      float keys = 0.0f, power = 0.0f, top = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.env.active()) continue;
        const float amp = voice.env.next() * voice.gain.next();
        const kit::SinCos turn = kit::sin_cos(voice.phase);
        voice.phase += voice.increment;
        if (voice.phase >= 1.0) voice.phase -= 1.0;
        const kit::SinCos two = kit::second_partial(turn);
        const float three = kit::third_partial(turn).s;
        const float four = kit::second_partial(two).c;
        keys += amp * (turn.s + warmth * voice.partials * (kPartial2 * two.c + kPartial3 * three + kPartial4 * four));
        power += amp * amp;
        if (amp > top) top = amp;
      }
      // The tone's peak is under 1 + slope · Warmth of its fundamental's
      // (the peak is convex in Warmth), so a key never peaks over its gain.
      const float scale = 1.0f / ((1.0f + peak_slope_ * warmth) * std::sqrt(power > 1.0f ? power : 1.0f));
      const float sine = level_.next() * top * kit::SineTable::lookup(static_cast<float>(sine_phase_));
      sine_increment_ += sine_step_;
      sine_phase_ += sine_increment_;
      if (sine_phase_ >= 1.0) sine_phase_ -= 1.0;

      float left, right;
      kit::to_ears(kit::ear_gains(ears_.next()), keys * scale, sine * scale, &left, &right);
      const float volume = volume_.next();
      out_left_[i] = kit::soft_clip(left * volume);
      out_right_[i] = kit::soft_clip(right * volume);
      gate_ = top;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  struct Voice {
    kit::Adsr env;
    kit::Smoother gain;           // the key's gain; a second strike moves it
    double phase = 0.0;           // in cycles
    double increment = 0.0;       // cycles a sample
    double pitch = 69.0;          // semitones on the MIDI scale
    float frequency = 0.0f;
    float partials = 1.0f;        // 1, falling to 0 where the fourth partial nears the top of the band
    float next_frequency = 0.0f;  // the key that waits while a stolen voice fades
    float next_gain = 0.0f;
    bool pending = false;

    bool active() const { return env.active() || pending; }
    bool releasing() const { return env.releasing() && !pending; }
    // From the envelope and the key's gain, never from the output: true from
    // the moment the voice is taken (a held key counts at its gain however
    // far its attack has come), and a voice with a key waiting is not taken
    // twice.
    float level() const {
      if (pending) return 2.0f;
      return env.releasing() ? env.level() * gain.target : gain.target;
    }
  };

  static double pitch_of(float hz) { return 69.0 + 12.0 * std::log2(static_cast<double>(hz) / 440.0); }

  // Smoothed controls glide only once sound is under way: before the first
  // block, and from a key that arrives in silence until its first sample,
  // they are simply there.
  bool glides() const { return primed() && !fresh_; }

  // The peak of the tone at full Warmth against its fundamental's, read off
  // the same sums process() makes.
  static float full_warmth_peak() {
    float peak = 1.0f;
    for (int n = 0; n < 4096; ++n) {
      const kit::SinCos turn = kit::sin_cos(static_cast<double>(n) / 4096.0);
      const kit::SinCos two = kit::second_partial(turn);
      const float three = kit::third_partial(turn).s;
      const float four = kit::second_partial(two).c;
      const float tone = turn.s + kPartial2 * two.c + kPartial3 * three + kPartial4 * four;
      const float size = tone < 0.0f ? -tone : tone;
      if (size > peak) peak = size;
    }
    return peak + 1.0e-4f;
  }

  void set_envelope(Voice& voice) const {
    voice.env.set(param(still_point::kAttack), 0.1f, 1.0f, param(still_point::kRelease));
  }

  // Start a key in a voice that is silent.
  void start(Voice& voice, float frequency, float gain) {
    const double sr = sample_rate();
    voice.frequency = frequency;
    voice.increment = static_cast<double>(frequency) / sr;
    voice.pitch = pitch_of(frequency);
    // Partials are whole below a tenth of the sample rate and gone by 0.1125
    // of it, where the fourth would reach 0.45.
    voice.partials = kit::clamp(static_cast<float>((0.1125 - voice.increment) / 0.0125), 0.0f, 1.0f);
    voice.gain.snap(gain);
    // A voice already on this pitch: start in phase with it, so the two add
    // and can never cancel. Otherwise from zero.
    voice.phase = 0.0;
    for (int v = 0; v < kMaxVoices; ++v) {
      const Voice& sounding = pool_.voices[v];
      if (&sounding != &voice && sounding.env.active() && sounding.increment == voice.increment) {
        voice.phase = sounding.phase;
        break;
      }
    }
    set_envelope(voice);
    voice.env.reset();
    voice.env.gate_on();
  }

  // Keys that waited for a stolen voice to fade begin, before any phase moves this sample.
  void begin_pending() {
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.pending || voice.env.active()) continue;
      voice.pending = false;
      --pending_;
      start(voice, voice.next_frequency, voice.next_gain);
    }
  }

  // The outer held keys: held, or waiting to start. Keys in their release do
  // not count. With none held the limits stand still where they are (they do
  // not finish a glide they had begun), so a chord let go within a few tens
  // of milliseconds keeps its range while it rings out. Fingers lifted more
  // slowly narrow it on the way: a chord 27 semitones wide keeps about 23
  // with its five keys let go 100 ms apart, 13 at 300 ms and 3 at a second.
  void retarget() {
    double low = 1.0e9, high = -1.0e9;
    for (int v = 0; v < kMaxVoices; ++v) {
      const Voice& voice = pool_.voices[v];
      double pitch;
      if (voice.pending) {
        pitch = pitch_of(voice.next_frequency);
      } else if (voice.env.active() && !voice.env.releasing()) {
        pitch = voice.pitch;
      } else {
        continue;
      }
      if (pitch < low) low = pitch;
      if (pitch > high) high = pitch;
    }
    holding_ = high >= low;
    if (holding_) {
      low_key_ = low;
      high_key_ = high;
    }
  }

  // Before the first key after every voice has ended (see the top of the file).
  void restart() {
    sweep_.reset();
    clock_.reset(control_period_);
    sine_phase_ = 0.0;
    fresh_ = true;
    kit::Smoother* const smoothers[] = {&level_, &ears_, &warmth_, &volume_};
    for (kit::Smoother* smoother : smoothers) smoother->snap(smoother->target);
  }

  static double triangle(double phase) { return phase < 0.5 ? 2.0 * phase : 2.0 - 2.0 * phase; }

  double sine_increment_at(double pitch) const {
    const double step = 440.0 * std::exp2((pitch - 69.0) / 12.0) / static_cast<double>(sample_rate());
    return step > 1.0e-7 ? (step < 0.45 ? step : 0.45) : 1.0e-7;
  }

  // The sine's pitch for a place in the sweep, between the limits as they stand.
  double pitch_at(double phase) const {
    const double low = low_ - reach_, high = high_ + reach_;
    return low + triangle(phase) * (high - low);
  }

  // Every control period, counted in samples from the restart: the limits
  // move a step nearer the held keys (while a key is held) and Reach, the
  // sweep moves on, and the sine's frequency is set to arrive, in a straight
  // line, where the sweep will be one period on.
  void control() {
    using namespace still_point;
    const double reach = param(kReach);
    if (fresh_) {
      low_ = low_lag_ = low_key_;
      high_ = high_lag_ = high_key_;
      reach_ = reach_lag_ = reach;
      sine_increment_ = sine_increment_at(pitch_at(sweep_.phase));
    } else {
      if (holding_) {
        low_lag_ += (low_key_ - low_lag_) * limit_coeff_;
        high_lag_ += (high_key_ - high_lag_) * limit_coeff_;
        low_ += (low_lag_ - low_) * limit_coeff_;
        high_ += (high_lag_ - high_) * limit_coeff_;
      }
      reach_lag_ += (reach - reach_lag_) * limit_coeff_;
      reach_ += (reach_lag_ - reach_) * limit_coeff_;
    }
    sweep_.advance(kit::SlowClock::increment(0.5 / static_cast<double>(param(kTime)), sample_rate()), control_period_);
    sine_pitch_ = pitch_at(sweep_.phase);
    sine_step_ = (sine_increment_at(sine_pitch_) - sine_increment_) / static_cast<double>(control_period_);
  }

  void apply(int id) {
    using namespace still_point;
    const float value = param(id);
    switch (id) {
      case kLevel:
        level_.set(value, glides());
        break;
      case kEars:
        ears_.set(value, glides());
        break;
      case kWarmth:
        warmth_.set(value, glides());
        break;
      case kVolume:
        volume_.set(kBase * kit::db_to_gain(value), glides());
        break;
      case kAttack:
      case kRelease:
        for (int v = 0; v < kMaxVoices; ++v) set_envelope(pool_.voices[v]);
        break;
      default:
        break;  // Time and Reach are read on the control clock
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Smoother level_, ears_, warmth_, volume_;
  kit::SlowClock sweep_;  // one turn is a pass up and a pass down
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  double sine_phase_ = 0.0;
  double sine_increment_ = 0.0;  // cycles a sample, moved in a straight line between control ticks
  double sine_step_ = 0.0;
  double low_key_ = 69.0, high_key_ = 69.0;  // the outer held keys, in semitones
  double low_lag_ = 69.0, high_lag_ = 69.0;  // the same after the first pole
  double low_ = 69.0, high_ = 69.0;          // and after the second: what the limits stand on
  double reach_lag_ = 0.0, reach_ = 0.0;     // Reach after each pole
  double sine_pitch_ = 69.0;
  double limit_coeff_ = 0.0;
  float peak_slope_ = 0.2f;
  float top_hz_ = 12000.0f;
  float gate_ = 0.0f;
  int control_period_ = 16;
  int pending_ = 0;
  bool holding_ = false;  // a key is held or waiting
  bool fresh_ = true;
};

}  // namespace livemix
