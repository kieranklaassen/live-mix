#pragma once

// Clarinet: a soft reed. Clarinet, bass clarinet, subtone saxophone and duduk
// from one driven pipe (driven_pipe.h).
//
//   per note (up to 8):
//
//   velocity ─► pressure ─► breath envelope ─┬─► tone level = pressure²
//                (slow drift, vibrato, growl) │        │
//                                             │        ├─► brightness = Blow × level
//                                             │        ▼
//                              phase ─► pipe_tone ─► odd half + even half ─┐
//                                             │      (Bore weighs the even) ├─► body ─► out
//                                             ▼                             │
//                    noise × pressure × Breath ─► PipeComb (Bore) ──────────┘
//
// - Nothing oscillates by itself. The tone is a closed-form harmonic series
//   read from one phase, so a note cannot squeal, jump register or fail to
//   speak.
// - The tone follows the square of the breath pressure and its brightness
//   follows the tone, so harmonic h grows h times as fast (in dB) as the
//   fundamental: a note opens up as it swells and darkens as it fades.
// - The air follows the pressure itself, so it falls half as fast as the
//   tone: quiet notes and the ends of notes are mostly breath. That is the
//   subtone.
// - Bore 0 is a cylinder closed at the reed: the odd harmonics only, with
//   the even ones coming back above 1.5 kHz (where a clarinet's open tone
//   holes stop reflecting), and air that resonates at the odd multiples of
//   the note. Bore 1 is a cone: every harmonic, air at every multiple, and a
//   more vocal body.
// - A note takes Attack plus eight of its own periods to speak, so low notes
//   are slower. Pitch leans a few cents flat as a note gets louder.
//
// The instrument sleeps when no note sounds.

#include "../../kit/kit.h"
#include "driven_pipe.h"
#include "params.gen.h"

namespace livemix {

class Clarinet : public kit::DeviceBase<clarinet::kNumParams> {
 public:
  static constexpr int kMaxVoices = 8;

  void init(float sample_rate) {
    using namespace clarinet;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      const uint32_t index = static_cast<uint32_t>(v);
      voice.air.seed(0x9E3779B9u + 0x85EBCA6Bu * (index + 1u));
      voice.drift.seed(0x51ED270Bu + 7919u * index);
      voice.drift.set_rate(kDriftHz, sr);
      voice.cutoff[0].set_cutoff(kToneHoleHz, sr);
      voice.cutoff[1].set_cutoff(kToneHoleHz, sr);
      voice.air_low.set_cutoff(kAirCeilingHz, sr);
    }
    start_.seed(0xC1A21E7u);
    for (int side = 0; side < 2; ++side) {
      rumble_[side].reset();
      rumble_[side].set_cutoff(kRumbleHz, sr);
      dark_[side].reset();
      formant_[side].reset();
      lip_[side] = Lip();
      lip_[side].noise.seed(side == 0 ? 0x1F2E3D4Cu : 0x5B6A7988u);
      lip_[side].low.set_cutoff(kLipCeilingHz, sr);
      lip_[side].high.set_cutoff(kLipFloorHz, sr);
    }
    body_bore_ = -1.0f;
    bore_.set_time(kSmoothingSeconds, sr);
    blow_.set_time(kSmoothingSeconds, sr);
    tone_.set_time(kSmoothingSeconds, sr);
    air_.set_time(kSmoothingSeconds, sr);
    growl_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    clock_.reset(kControlPeriod);
    control_seconds_ = static_cast<float>(kControlPeriod) / sr;
    fade_step_ = 1.0f / (kStealSeconds * sr);
    // White noise spreads over a wider band at a higher rate, so less of it
    // falls in the band that is heard: scaled to sound as it does at 48 kHz.
    air_scale_ = kAirGain * std::sqrt(sr / kVoicedRate);
    // Nothing outlives the envelopes but the body filters.
    idle_.reset(sr, 0.1f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kLowestHz, kit::min(kHighestHz, 0.2f * sample_rate()));
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    // A key struck again while held: the old note is tongued off.
    const int held = pool_.find_held(note_id);
    if (held >= 0) let_go(pool_.voices[held], kRestrikeSeconds);

    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    voice.next_hz = frequency;
    voice.next_pressure = kSoftestPressure + (1.0f - kSoftestPressure) * gain;
    if (stolen) {
      // Fade what is sounding first; process() starts the new note after it.
      voice.pending = true;
      voice.fading = true;
    } else {
      start(voice);
    }
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held >= 0) let_go(pool_.voices[held], 0.0f);
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

      const float bore = bore_.next();
      const float blow = blow_.next();
      const float tone_gain = tone_.next();
      const float air_gain = air_.next();
      const float growl = growl_.next();
      const float open = kPipeGain * bore;
      const float stopped = kPipeGain - open;

      float left = 0.0f, right = 0.0f, total_level = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.active() || !fade(voice)) continue;

        // Breath pressure, and the tone level it gives.
        voice.sway += voice.sway_step;
        float pressure = voice.pressure * voice.breath.next() * voice.sway;
        if (growl > 0.0f) {
          voice.growl_phase += voice.growl_increment;
          if (voice.growl_phase >= 1.0f) voice.growl_phase -= 1.0f;
          pressure *= 1.0f - growl * (0.5f + 0.5f * kit::SineTable::lookup(voice.growl_phase));
        }
        const float level = pressure * pressure;
        const float brightness = kit::min(blow * level, voice.limit);

        voice.ratio += voice.ratio_step;
        voice.phase += voice.increment * voice.ratio;
        if (voice.phase >= 1.0f) voice.phase -= 1.0f;
        const float sine = kit::SineTable::lookup(voice.phase);
        const float cosine = kit::SineTable::cos_lookup(voice.phase);
        const clarinet::PipeTone tone = clarinet::pipe_tone(sine, cosine, brightness);

        // The even half: all of it for a cone, only what lies above the
        // tone-hole cutoff for a cylinder.
        const float even = level * tone.even;
        float returned = even - voice.cutoff[0].lowpass(even);
        returned -= voice.cutoff[1].lowpass(returned);
        float sound = tone_gain * (level * tone.odd + returned + bore * (even - returned));

        // The air: noise in step with the reed, through the passive pipe.
        if (air_gain > 0.0f) {
          float air = voice.air_low.lowpass(voice.air.bipolar());
          air -= voice.air_high.lowpass(air);
          air *= air_gain * pressure * (1.0f + kReedPulse * cosine);
          sound += voice.pipe.process(air, open, stopped);
        }

        sound *= voice.fade;
        left += sound * voice.pan_left;
        right += sound * voice.pan_right;
        total_level += level;
      }

      left = formant_[0].process(dark_[0].lowpass(rumble_[0].highpass(left)));
      right = formant_[1].process(dark_[1].lowpass(rumble_[1].highpass(right)));
      // Hiss at the lips, which the pipe does not colour; one per side.
      if (total_level > 0.0f && air_gain > 0.0f) {
        const float hiss = kLipGain * air_gain * std::sqrt(total_level);
        left += hiss * lip_[0].next();
        right += hiss * lip_[1].next();
      }
      const float volume = volume_.next();
      out_left_[i] = kit::soft_clip(left * volume);
      out_right_[i] = kit::soft_clip(right * volume);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  struct Voice {
    kit::Adsr breath;  // the pressure envelope
    clarinet::PipeComb<4096> pipe;
    kit::OnePole cutoff[2];
    kit::OnePole air_low, air_high;
    kit::Rng air;
    kit::Drift drift;
    float hz = 220.0f;
    float speech = 0.0f;
    float pressure = 0.0f;
    float increment = 0.0f;
    float phase = 0.0f;
    float limit = 0.0f;
    float ratio = 1.0f, ratio_step = 0.0f;
    float sway = 1.0f, sway_step = 0.0f;
    float age = 0.0f;
    float vibrato_phase = 0.0f, vibrato_hz = 5.0f;
    float growl_phase = 0.0f, growl_increment = 0.0f;
    float pan_left = 0.7071f, pan_right = 0.7071f;
    // A stolen voice fades out, then starts the note that is waiting.
    float fade = 1.0f;
    bool fading = false;
    bool pending = false;
    bool ending = false;
    float next_hz = 220.0f;
    float next_pressure = 0.0f;

    void stop() {
      breath.reset();
      fading = false;
      pending = false;
      fade = 1.0f;
    }

    bool active() const { return breath.active() || pending; }
    bool releasing() const { return !pending && (breath.releasing() || fading); }
    // How loud it is (or is about to be): soft notes are stolen first.
    float level() const { return pending ? next_pressure : pressure * breath.level(); }
  };

  // Uncombed noise for one output side.
  struct Lip {
    kit::Rng noise;
    kit::OnePole low, high;
    float next() {
      const float band = low.lowpass(noise.bipolar());
      return band - high.lowpass(band);
    }
  };

  static constexpr int kControlPeriod = 32;
  static constexpr float kLowestHz = 25.0f;
  static constexpr float kHighestHz = 4186.0f;
  // Velocity 0 still blows; velocity 0.8 is the reference dynamic.
  static constexpr float kSoftestPressure = 0.3f;
  static constexpr float kReferenceLevel = 0.7396f;  // (0.3 + 0.7 × 0.8)²
  // Brightness at the reference dynamic for Blow 0 and Blow 1, and the most
  // any note may have (0.88 loses 1.1 dB per harmonic).
  static constexpr float kDullest = 0.08f;
  static constexpr float kBrightest = 0.82f;
  static constexpr float kMaxBrightness = 0.88f;
  // Vibrato, the lean and the drift together stay under 3 %.
  static constexpr float kHighestBend = 1.03f;
  static constexpr float kToneHoleHz = 1500.0f;
  // A resonance of this quality takes eight periods to build.
  static constexpr float kSpeechQ = 25.0f;
  static constexpr float kLeanCents = 6.0f;
  static constexpr float kDriftHz = 0.7f;
  static constexpr float kDriftDepth = 0.04f;
  static constexpr float kVibratoHz = 5.0f;
  static constexpr float kVibratoCents = 35.0f;
  static constexpr float kVibratoSway = 0.05f;
  static constexpr float kVibratoDelay = 0.25f;
  static constexpr float kVibratoRise = 0.6f;
  static constexpr float kGrowlHz = 28.0f;
  static constexpr float kGrowlDepth = 0.5f;
  // The pipe: loop gain, loss, and how the air is coloured going in.
  static constexpr float kPipeGain = 0.9f;
  static constexpr float kPipeLossHz = 4000.0f;
  static constexpr float kAirCeilingHz = 5000.0f;
  static constexpr float kAirFloor = 0.7f;  // of the note
  static constexpr float kReedPulse = 0.6f;
  static constexpr float kAirGain = 0.33f;
  static constexpr float kVoicedRate = 48000.0f;  // where the air's level was set
  static constexpr float kLipGain = 0.06f;
  static constexpr float kLipFloorHz = 2000.0f;
  static constexpr float kLipCeilingHz = 6000.0f;
  // The body: darker for the cylinder, a vocal peak for the cone.
  static constexpr float kRumbleHz = 25.0f;
  static constexpr float kDarkHz = 3200.0f;
  static constexpr float kOpenHz = 7000.0f;
  static constexpr float kFormantHz = 1200.0f;
  static constexpr float kFormantDb = 5.0f;
  static constexpr float kSpread = 0.12f;
  static constexpr float kStealSeconds = 0.002f;
  static constexpr float kRestrikeSeconds = 0.04f;
  // A released note is ended once its breath is 60 dB down.
  static constexpr float kSilentPressure = 1.0e-3f;
  static constexpr float kEndSeconds = 0.05f;
  // One note at velocity 0.8 peaks near -14.5 dBFS before Volume, which
  // leaves eight of them under the clip knee at the default Volume.
  static constexpr float kOutputGain = 0.24f;

  void let_go(Voice& voice, float seconds) {
    if (voice.pending) {
      // Not started yet: the fade under way simply ends the voice.
      voice.pending = false;
    } else if (seconds > 0.0f) {
      voice.breath.fast_release(seconds);
    } else {
      voice.breath.gate_off();
    }
  }

  // One sample of a stolen or cancelled voice's fade. At its end the note
  // that is waiting starts; false when there is none and the voice stops.
  bool fade(Voice& voice) {
    if (!voice.fading) return true;
    voice.fade -= fade_step_;
    if (voice.fade > 0.0f) return true;
    if (!voice.pending) {
      voice.stop();
      return false;
    }
    start(voice);
    return true;
  }

  void set_times(Voice& voice) {
    using namespace clarinet;
    // The tone is the square of the breath, so it covers 60 dB in half the
    // envelope's release.
    voice.breath.set(param(kAttack) + voice.speech, 0.01f, 1.0f, 2.0f * param(kRelease));
  }

  void start(Voice& voice) {
    const float sr = sample_rate();
    voice.pending = false;
    voice.fading = false;
    voice.ending = false;
    voice.fade = 1.0f;
    voice.hz = voice.next_hz;
    voice.pressure = voice.next_pressure;
    voice.increment = voice.hz / sr;
    voice.speech = clarinet::speech_seconds(voice.hz, kSpeechQ);
    voice.limit =
        kit::min(clarinet::brightness_limit(voice.hz * kHighestBend, sr), kMaxBrightness);
    voice.phase = start_.uniform();
    voice.pipe.clear();
    voice.pipe.tune(voice.hz, kPipeLossHz, sr);
    voice.cutoff[0].reset();
    voice.cutoff[1].reset();
    voice.air_low.reset();
    voice.air_high.reset();
    voice.air_high.set_cutoff(kAirFloor * voice.hz, sr);
    // A fresh envelope: Adsr keeps a fast release across gate_on().
    voice.breath = kit::Adsr();
    voice.breath.set_sample_rate(sr);
    set_times(voice);
    voice.breath.gate_on();
    voice.age = 0.0f;
    voice.vibrato_phase = 0.0f;
    voice.vibrato_hz = kVibratoHz * (1.0f + 0.03f * start_.bipolar());
    voice.growl_phase = 0.0f;
    voice.growl_increment = kGrowlHz * (1.0f + 0.05f * start_.bipolar()) / sr;
    voice.sway = 1.0f;
    voice.sway_step = 0.0f;
    voice.ratio = kit::cents_to_ratio(kLeanCents * kReferenceLevel);
    voice.ratio_step = 0.0f;
    const float key = kit::hz_to_midi(voice.hz);
    kit::pan_gains(kSpread * kit::clamp((key - 60.0f) * (1.0f / 24.0f), -1.0f, 1.0f),
                   &voice.pan_left, &voice.pan_right);
  }

  // Every 32 samples: the body, and per note the envelope times, the slow
  // drift of the breath, vibrato and the lean of pitch against level. Sway
  // and pitch ramp to the next tick.
  void control() {
    using namespace clarinet;
    const float sr = sample_rate();
    const float bore = bore_.value;
    if (bore != body_bore_) {
      body_bore_ = bore;
      for (int side = 0; side < 2; ++side) {
        dark_[side].set_cutoff(kit::lerp(kDarkHz, kOpenHz, bore), sr);
        formant_[side].set_peak(kFormantHz, 0.7f, kFormantDb * bore, sr);
      }
    }
    const float vibrato = param(kVibrato);
    const float per_sample = 1.0f / static_cast<float>(kControlPeriod);
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.breath.active()) continue;
      set_times(voice);
      if (voice.breath.releasing() && !voice.ending && voice.breath.level() < kSilentPressure) {
        voice.breath.fast_release(kEndSeconds);
        voice.ending = true;
      }
      float sway = 1.0f + kDriftDepth * voice.drift.next(kControlPeriod);
      float cents = 0.0f;
      voice.age += control_seconds_;
      if (vibrato > 0.0f) {
        float onset = kit::clamp((voice.age - kVibratoDelay) * (1.0f / kVibratoRise), 0.0f, 1.0f);
        onset = onset * onset * (3.0f - 2.0f * onset);
        voice.vibrato_phase += voice.vibrato_hz * control_seconds_;
        voice.vibrato_phase -= std::floor(voice.vibrato_phase);
        const float shake = vibrato * onset * kit::SineTable::lookup(voice.vibrato_phase);
        cents = kVibratoCents * shake;
        sway += kVibratoSway * shake;
      }
      const float pressure = voice.pressure * voice.breath.level() * sway;
      cents -= kLeanCents * (pressure * pressure - kReferenceLevel);
      voice.sway_step = (sway - voice.sway) * per_sample;
      voice.ratio_step = (kit::cents_to_ratio(cents) - voice.ratio) * per_sample;
    }
  }

  // Brightness per unit of tone level, and a gain that holds the loudness of
  // the reference dynamic where it is while Blow adds harmonics and Bore adds
  // the even half: neither knob is a volume control as well.
  void set_tone() {
    using namespace clarinet;
    const float brightness = kit::lerp(kDullest, kBrightest, param(kBlow));
    const float square = brightness * brightness;
    const float even = param(kBore) * param(kBore) * square;
    blow_.set(brightness / kReferenceLevel, primed());
    tone_.set(std::sqrt((1.0f - square) / (1.0f + even)), primed());
  }

  void apply(int id) {
    using namespace clarinet;
    const float value = param(id);
    switch (id) {
      case kBore:
        bore_.set(value, primed());
        set_tone();
        break;
      case kBlow:
        set_tone();
        break;
      case kBreath:
        air_.set(air_scale_ * value * value, primed());
        break;
      case kGrowl:
        growl_.set(kGrowlDepth * value, primed());
        break;
      case kVolume:
        volume_.set(kOutputGain * kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read on the control clock
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::OnePole rumble_[2];
  kit::OnePole dark_[2];
  kit::Biquad formant_[2];
  Lip lip_[2];
  kit::Smoother bore_, blow_, tone_, air_, growl_, volume_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  kit::Rng start_;
  float body_bore_ = -1.0f;
  float control_seconds_ = 0.0f;
  float fade_step_ = 0.0f;
  float air_scale_ = kAirGain;
};

}  // namespace livemix
