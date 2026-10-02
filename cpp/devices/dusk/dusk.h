#pragma once

// Dusk: an eighties chorus polysynth for pads.
//
//   per key: one phase ─► saw + pulse + sub ─► four-pole low-pass ─► level ─┐
//            one envelope ──────────────────────► (cutoff)  ───────► (level) ├─► low cut ─► chorus ─► out
//   (up to ten keys)                                                        ┘
//
// - Every key is ONE oscillator: sawtooth, pulse and the square an octave
//   below all read the same phase (dusk_osc.h). There is no drift and no
//   detune between keys; dry, the instrument is plain and exactly in tune.
// - The low-pass (dusk_ladder.h) follows the keyboard fully around middle C,
//   so Cutoff is a brightness and, with Resonance at the top, the filter
//   sings a note that tracks the keys.
// - One envelope per key shapes level and filter together. Decay follows
//   Release and the sustain level is fixed.
// - Low cut is one first-order high-pass on the sum of the keys.
// - The chorus (dusk_chorus.h) is where the width and the motion come from.
//   With it off the output is mono.
//
// The instrument sleeps when no key sounds and the chorus has emptied; its
// hiss is tied to sounding keys for that reason. The first key after every
// voice has ended restarts the sweeps, the hiss and the smoothing, so what it
// plays does not depend on when (or whether) the device fell asleep.

#include "../../kit/kit.h"
#include "dusk_chorus.h"
#include "dusk_ladder.h"
#include "dusk_osc.h"
#include "params.gen.h"

namespace livemix {

class Dusk : public kit::DeviceBase<dusk::kNumParams> {
 public:
  static constexpr int kMaxVoices = 10;

  // The choices of Wave, in the manifest's order.
  enum Wave : int { kSaw = 0, kSquare, kSawSquare, kMovingPulse, kSawMovingPulse };

  // The corner Cutoff names is the one a key at middle C gets.
  static constexpr float kKeyFollowHz = 261.6256f;
  // Envelope at ±1 moves the cutoff this many octaves at the envelope's peak.
  static constexpr float kEnvelopeOctaves = 6.0f;
  static constexpr float kSustain = 0.7f;
  // Loop gain at Resonance 1. The loop sings from 4 upwards.
  static constexpr float kMaxFeedback = 4.3f;
  static constexpr float kPulseLfoHz = 0.6f;
  static constexpr float kPulseSweep = 0.38f;  // 50 % to 88 %
  static constexpr float kLowCutHz[4] = {10.0f, 120.0f, 350.0f, 800.0f};

  void init(float sample_rate) {
    using namespace dusk;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    control_period_ = sr > 60000.0f ? 32 : 16;
    const float control_rate = sr / static_cast<float>(control_period_);
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      voice.env.set_sample_rate(sr);
    }
    start_.seed(0xD05C1982u);
    low_cut_.reset();
    chorus_.init(sr);
    pulse_phase_ = 0.0f;
    saw_.set_time(kSmoothingSeconds, sr);
    pulse_.set_time(kSmoothingSeconds, sr);
    moving_.set_time(kSmoothingSeconds, sr);
    sub_.set_time(kSmoothingSeconds, sr);
    feedback_.set_time(kSmoothingSeconds, sr);
    drive_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    cutoff_octave_.set_time(kSweepSeconds, control_rate);
    envelope_octaves_.set_time(kSweepSeconds, control_rate);
    low_cut_octave_.set_time(kLowCutSeconds, control_rate);
    hiss_.snap(0.0f);
    clock_.reset(control_period_);
    // The chorus holds 5.35 ms; nothing else outlives the envelopes.
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
    if (pool_.count_active() == 0) restart();
    // A key struck again while held: let the old voice go quickly.
    const int held = pool_.find_held(note_id);
    if (held >= 0) let_go(pool_.voices[held], kRestrikeSeconds);

    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    voice.next_frequency = frequency;
    // The originals have no velocity: gain moves the level only, and gently.
    voice.next_gain = 0.5f + 0.5f * gain;
    if (stolen) {
      // The voice fades out first and starts the new note from silence.
      voice.waiting = true;
      voice.env.fast_release(kStealSeconds);
    } else {
      start(voice);
    }
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held < 0) return;
    Voice& voice = pool_.voices[held];
    if (voice.waiting) {
      voice.waiting = false;  // released before it began: the fade just finishes
    } else {
      voice.env.gate_off();
    }
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    const float sr = sample_rate();
    const float pulse_increment = kPulseLfoHz / sr;
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) control(sr);

      pulse_phase_ += pulse_increment;
      if (pulse_phase_ >= 1.0f) pulse_phase_ -= 1.0f;
      // One-sided: the width leaves 50 % and comes back, never crossing it.
      const float rise = pulse_phase_ < 0.5f ? 2.0f * pulse_phase_ : 2.0f - 2.0f * pulse_phase_;
      const float width = 0.5f + kPulseSweep * moving_.next() * rise;
      const float saw_level = saw_.next();
      const float pulse_level = pulse_.next();
      const float sub_level = sub_.next();
      const float feedback = feedback_.next();
      const float drive = drive_.next();

      float mono = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.env.active()) {
          if (!voice.waiting) continue;
          start(voice);
        }
        float saw, pulse, sub;
        voice.osc.next(width, &saw, &pulse, &sub);
        voice.stage += voice.stage_step;
        const float mixed = saw_level * saw + pulse_level * pulse + sub_level * sub;
        mono += voice.filter.process(mixed * drive, voice.stage, feedback) * voice.env.next() *
                voice.gain;
      }
      mono = low_cut_.highpass(mono * kVoiceGain);

      float left, right;
      chorus_.process(mono, hiss_.next(), &left, &right);
      const float volume = volume_.next();
      out_left_[i] = kit::soft_clip(left * volume);
      out_right_[i] = kit::soft_clip(right * volume);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  struct Voice {
    dusk_detail::LockedOsc osc;
    dusk_detail::SingingLadder filter;
    kit::Adsr env;
    float key_follow = 1.0f;
    float gain = 0.0f;
    // The filter's stage coefficient glides to its target between control ticks.
    float stage = 0.1f;
    float stage_step = 0.0f;
    float stage_target = 0.1f;
    // A stolen voice waits for its fade before it plays the next note.
    bool waiting = false;
    float next_frequency = 0.0f;
    float next_gain = 0.0f;

    bool active() const { return env.active() || waiting; }
    // A waiting voice is as good as held: it must not be stolen twice.
    bool releasing() const { return env.releasing() && !waiting; }
    float level() const { return waiting ? 2.0f : env.level(); }
  };

  // The filter is driven low so it stays clean; the gain after it puts one
  // key at full velocity near -10 dBFS before Volume.
  static constexpr float kDrive = 0.12f;
  static constexpr float kVoiceGain = 0.24f / kDrive;
  static constexpr float kStealSeconds = 0.003f;
  static constexpr float kRestrikeSeconds = 0.02f;
  static constexpr float kSweepSeconds = 0.01f;
  static constexpr float kLowCutSeconds = 0.03f;
  static constexpr float kHissInSeconds = 0.02f;
  static constexpr float kHissOutSeconds = 0.25f;

  static int choice(float value) { return static_cast<int>(value + 0.5f); }

  float cutoff_hz(const Voice& voice, float level) const {
    return std::exp2(cutoff_octave_.value + envelope_octaves_.value * level) * voice.key_follow;
  }

  void set_envelope(Voice& voice) const {
    const float release = param(dusk::kRelease);
    voice.env.set(param(dusk::kAttack), release, kSustain, release);
  }

  void start(Voice& voice) {
    voice.waiting = false;
    voice.osc.set_frequency(voice.next_frequency / sample_rate());
    voice.key_follow = voice.next_frequency / kKeyFollowHz;
    voice.gain = voice.next_gain;
    // Free-running counters: every note starts somewhere else in its cycle.
    voice.osc.reset(start_.uniform());
    voice.filter.reset();
    voice.stage = dusk_detail::SingingLadder::coefficient(cutoff_hz(voice, 0.0f), sample_rate());
    voice.stage_target = voice.stage;
    voice.stage_step = 0.0f;
    set_envelope(voice);
    voice.env.gate_on();
  }

  void let_go(Voice& voice, float seconds) {
    if (voice.waiting) {
      voice.waiting = false;
    } else {
      voice.env.fast_release(seconds);
    }
  }

  // Before the first key after every voice has ended. A sleeping device
  // stands still and the block it falls asleep in depends on the host's block
  // size, so nothing that runs on through a silence may be carried into the
  // next note: the sweeps and the hiss start from the same place, and a
  // parameter moved in the silence is simply there. Nothing audible is
  // sounding at this point (the last voice ended 100 dB down).
  void restart() {
    chorus_.restart();
    pulse_phase_ = 0.0f;
    clock_.reset(control_period_);
    kit::Smoother* const smoothers[] = {&saw_,   &pulse_,  &moving_,        &sub_,              &feedback_,
                                        &drive_, &volume_, &cutoff_octave_, &envelope_octaves_, &low_cut_octave_};
    for (kit::Smoother* smoother : smoothers) smoother->snap(smoother->target);
  }

  // Every control period: envelope times, each key's cutoff, the low cut and
  // the hiss gate.
  void control(float sr) {
    cutoff_octave_.next();
    envelope_octaves_.next();
    low_cut_.set_cutoff(std::exp2(low_cut_octave_.next()), sr);
    const float per_tick = 1.0f / static_cast<float>(control_period_);
    bool sounding = false;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      sounding = sounding || voice.active();
      if (!voice.env.active()) continue;
      set_envelope(voice);
      voice.stage = voice.stage_target;
      voice.stage_target =
          dusk_detail::SingingLadder::coefficient(cutoff_hz(voice, voice.env.level()), sr);
      voice.stage_step = (voice.stage_target - voice.stage) * per_tick;
    }
    const float hiss = sounding ? 1.0f : 0.0f;
    if (hiss != hiss_.target) {
      hiss_.set_time(sounding ? kHissInSeconds : kHissOutSeconds, sr);
      hiss_.set_target(hiss);
    }
  }

  void apply(int id) {
    using namespace dusk;
    const float value = param(id);
    switch (id) {
      case kWave: {
        const int wave = choice(value);
        const bool moving = wave == kMovingPulse || wave == kSawMovingPulse;
        saw_.set(wave == kSaw || wave == kSawSquare || wave == kSawMovingPulse ? 1.0f : 0.0f, primed());
        pulse_.set(wave == kSaw ? 0.0f : 1.0f, primed());
        moving_.set(moving ? 1.0f : 0.0f, primed());
        break;
      }
      case kSub:
        sub_.set(value, primed());
        break;
      case kLowCut:
        low_cut_octave_.set(std::log2(kLowCutHz[kit::clamp_int(choice(value), 0, 3)]), primed());
        break;
      case kCutoff:
        cutoff_octave_.set(std::log2(value), primed());
        break;
      case kResonance: {
        const float feedback = value * kMaxFeedback;
        feedback_.set(feedback, primed());
        // A ladder's pass band falls by 1 + feedback as resonance rises; the
        // input makes up half of that in decibels so pads keep their body.
        drive_.set(kDrive * std::sqrt(1.0f + feedback), primed());
        break;
      }
      case kEnvelope:
        envelope_octaves_.set(value * kEnvelopeOctaves, primed());
        break;
      case kChorus:
        chorus_.set_mode(choice(value), primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // attack and release are read on the control clock
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::OnePole low_cut_;
  dusk_detail::TwoLineChorus chorus_;
  // Per sample.
  kit::Smoother saw_, pulse_, moving_, sub_, feedback_, drive_, volume_;
  kit::LinearRamp hiss_;
  // Per control period, in octaves (log2 of hertz).
  kit::Smoother cutoff_octave_, envelope_octaves_, low_cut_octave_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  kit::Rng start_;
  float pulse_phase_ = 0.0f;
  int control_period_ = 16;
};

}  // namespace livemix
