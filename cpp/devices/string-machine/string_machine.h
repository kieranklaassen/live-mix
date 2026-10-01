#pragma once

// String Machine: a seventies string ensemble.
//
//   per key: saw 16' + saw 8' + saw 4' ─► envelope ─┐
//                                                   ├─► tone filter ─► ensemble ─► out
//   (up to 16 keys)                                 ┘
//
// - Each key plays three sawtooths an octave apart. The 8' is always there;
//   Cello adds the 16' and Violin the 4'.
// - All keys share one low-pass (Tone) and a fixed 90 Hz high-pass, as the
//   paraphonic originals did.
// - The ensemble is three short modulated delay lines whose LFOs sit 120
//   degrees apart, each the sum of a slow (0.6 Hz) and a fast (6 Hz) sine.
//   Left takes lines 1 and 2, right lines 3 and 2, which is where the width
//   comes from. Ensemble 0 is the dry signal.
// - Drift detunes each key by a few cents with its own slow random walk.
//
// The instrument sleeps when no key sounds and the chorus has emptied.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class StringMachine : public kit::DeviceBase<string_machine::kNumParams> {
 public:
  static constexpr int kMaxVoices = 16;

  void init(float sample_rate) {
    using namespace string_machine;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      voice.env.set_sample_rate(sr);
      voice.drift.seed(0x1234567u + 7919u * static_cast<uint32_t>(v));
      voice.drift.set_rate(0.31f, sr);
    }
    start_.seed(0xA5A5F00Du);
    tone_.reset();
    rumble_.reset();
    rumble_.set_cutoff(90.0f, sr);
    for (int line = 0; line < 3; ++line) chorus_[line].clear();
    slow_phase_ = 0.0f;
    fast_phase_ = 0.0f;
    low_.set_time(kSmoothingSeconds, sr);
    high_.set_time(kSmoothingSeconds, sr);
    ensemble_.set_time(kSmoothingSeconds, sr);
    width_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    clock_.reset(32);
    // The chorus holds 10 ms; nothing else outlives the envelopes.
    idle_.reset(sr, 0.1f);
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
    // A key struck again while held: let the old voice go quickly.
    const int held = pool_.find_held(note_id);
    if (held >= 0) pool_.voices[held].env.fast_release(0.02f);

    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    voice.increment = frequency / sample_rate();
    voice.gain = 0.35f + 0.65f * gain;
    if (!stolen) {
      // A fresh voice starts its oscillators apart so stacked keys do not
      // add up in phase; a stolen one keeps running to avoid a click.
      voice.osc[0].reset(start_.uniform());
      voice.osc[1].reset(start_.uniform());
      voice.osc[2].reset(start_.uniform());
    }
    voice.env.set(param(string_machine::kAttack), 0.01f, 1.0f, param(string_machine::kRelease));
    voice.env.gate_on();
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held >= 0) pool_.voices[held].env.gate_off();
  }

  void process(int frames) {
    using namespace string_machine;
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    const float sr = sample_rate();
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) control(sr);

      const float low = low_.next();
      const float high = high_.next();
      float mono = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.env.active()) continue;
        const float increment = voice.increment * voice.detune;
        const float saws = voice.osc[1].saw(increment) + low * voice.osc[0].saw(increment * 0.5f) +
                           high * voice.osc[2].saw(increment * 2.0f);
        mono += saws * voice.env.next() * voice.gain;
      }
      mono *= kVoiceGain;
      mono = rumble_.highpass(tone_.lowpass(mono));

      // Ensemble: three lines, LFOs 120 degrees apart.
      const float ensemble = ensemble_.next();
      slow_phase_ += slow_increment_;
      slow_phase_ -= std::floor(slow_phase_);
      fast_phase_ += fast_increment_;
      fast_phase_ -= std::floor(fast_phase_);
      float tap[3];
      for (int line = 0; line < 3; ++line) {
        const float offset = static_cast<float>(line) * (1.0f / 3.0f);
        const float sweep = kSlowDepthSeconds * kit::SineTable::lookup(slow_phase_ + offset) +
                            kFastDepthSeconds * kit::SineTable::lookup(fast_phase_ + offset);
        tap[line] = chorus_[line].read_linear((kChorusBaseSeconds + sweep) * sr);
        chorus_[line].write(mono);
      }
      const float width = width_.next();
      const float centre = (tap[0] + tap[1] + tap[2]) * (1.0f / 3.0f);
      const float wet_left = kit::lerp(centre, 0.62f * tap[0] + 0.38f * tap[1], width);
      const float wet_right = kit::lerp(centre, 0.62f * tap[2] + 0.38f * tap[1], width);
      const float volume = volume_.next();
      out_left_[i] = kit::soft_clip(kit::lerp(mono, wet_left * kChorusMakeup, ensemble) * volume);
      out_right_[i] = kit::soft_clip(kit::lerp(mono, wet_right * kChorusMakeup, ensemble) * volume);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  struct Voice {
    kit::BlepOsc osc[3];
    kit::Adsr env;
    kit::Drift drift;
    float increment = 0.0f;
    float detune = 1.0f;
    float gain = 0.0f;

    bool active() const { return env.active(); }
    bool releasing() const { return env.releasing(); }
    float level() const { return env.level(); }
  };

  // One key at full velocity peaks near -10 dBFS before Volume.
  static constexpr float kVoiceGain = 0.18f;
  static constexpr float kChorusBaseSeconds = 0.006f;
  static constexpr float kSlowDepthSeconds = 0.0012f;
  static constexpr float kFastDepthSeconds = 0.00018f;
  static constexpr float kChorusMakeup = 1.25f;
  static constexpr float kMaxDriftCents = 9.0f;

  // Every 32 samples: per-key drift, envelope times and the shared filter.
  void control(float sr) {
    using namespace string_machine;
    const float drift_cents = param(kDrift) * kMaxDriftCents;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.env.active()) continue;
      voice.detune = kit::cents_to_ratio(drift_cents * voice.drift.next(32));
      voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
    }
    tone_.set(param(kTone), 0.6f, sr);
    slow_increment_ = 0.6f * param(kSpeed) / sr;
    fast_increment_ = 6.0f * param(kSpeed) / sr;
  }

  void apply(int id) {
    using namespace string_machine;
    const float value = param(id);
    switch (id) {
      case kLow:
        low_.set(value, primed());
        break;
      case kHigh:
        high_.set(value, primed());
        break;
      case kEnsemble:
        ensemble_.set(value, primed());
        break;
      case kWidth:
        width_.set(value, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read on the control clock
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Svf tone_;
  kit::OnePole rumble_;
  kit::DelayLine<2048> chorus_[3];
  kit::Smoother low_, high_, ensemble_, width_, volume_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  kit::Rng start_;
  float slow_phase_ = 0.0f, fast_phase_ = 0.0f;
  float slow_increment_ = 0.0f, fast_increment_ = 0.0f;
};

}  // namespace livemix
