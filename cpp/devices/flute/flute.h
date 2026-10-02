#pragma once

// Flute: a blown pipe for slow lines and held chords.
//
//   key ─► breath p ─┬─► speech lag ─► level and brightness ─► harmonic series ─┐
//                    ├─► chiff: the octave (or twelfth) for a moment ───────────┤
//                    ├─► noise · p^1.75 (+ puff) ─► pipe comb ──────────────────┼─► body ─► pan
//                    └─► pitch: scoop, vibrato, drift, sharper when blown harder
//   every voice's noise level ─► one stereo pair of lip hiss ─► out
//
// - One breath pressure per voice drives everything: the note's level, its
//   brightness (driven_pipe.h: harmonic h grows as the h-th power of the
//   fundamental), the amount of air, and a few cents of pitch. Drift and the
//   vibrato are applied to that pressure, so tone, brightness, air and pitch
//   move together, which is what a tone with hiss laid on top of it lacks.
// - The tone follows the breath through a lag of Q / (π·f) seconds, the time
//   a resonance takes to build: air is heard first and low notes speak later
//   than high ones.
// - Breath noise goes through the passive pipe, so it has the pipe's
//   resonances in it; the tone does not, so its level and pitch never depend
//   on the pipe's tuning. The pipe is tuned once, to the key: the tone's
//   scoop and vibrato move it against fixed resonances, as on a real bore.
// - Chiff is the octave (the twelfth on stopped pipes), phase-locked to the
//   note, and a puff of noise, both riding the breath and dying in tens of
//   milliseconds. A slow attack has almost none.
// - Type, Chiff and Scoop are read when a note starts.
// - Everything that moves slowly (envelope, drift, vibrato, scoop, the
//   powers and the cents) is worked out every 16 samples and ramped.
//
// The five types are voicings of this one model (kVoicings). Their numbers
// are choices made without listening; cpp/test/flute_test.cpp holds what
// each is supposed to do.
//
// The instrument sleeps when no pipe sounds.

#include "../../kit/kit.h"
#include "driven_pipe.h"
#include "params.gen.h"

namespace livemix {

class Flute : public kit::DeviceBase<flute::kNumParams> {
 public:
  static constexpr int kMaxVoices = 8;
  enum Type : int { kConcert = 0, kLowFlute, kShakuhachi, kPanPipes, kWoodFlute, kNumTypes };

  void init(float sample_rate) {
    using namespace flute;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    tick_rate_ = sr / static_cast<float>(kControlPeriod);
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice.reset();
      voice.env.set_sample_rate(tick_rate_);
      voice.air.seed(0xF1A7E001u + 104729u * static_cast<uint32_t>(v));
      voice.drift_pressure.seed(0x0B5EED01u + 7919u * static_cast<uint32_t>(v));
      voice.drift_pressure.set_rate(kDriftPressureHz, sr);
      voice.drift_pitch.seed(0x51F7ED03u + 6007u * static_cast<uint32_t>(v));
      voice.drift_pitch.set_rate(kDriftPitchHz, sr);
    }
    start_.seed(0xB0A7F1A7u);
    for (int c = 0; c < 2; ++c) {
      hiss_[c].seed(0x9E3779B9u + 7919u * static_cast<uint32_t>(c));
      hiss_band_[c].reset();
      hiss_band_[c].set(kHissHz, kHissQ, sr);
    }
    hiss_level_.snap(0.0f);
    breath_.set_time(kSmoothingSeconds, tick_rate_);
    blow_.set_time(kSmoothingSeconds, tick_rate_);
    vibrato_.set_time(kSmoothingSeconds, tick_rate_);
    volume_.set_time(kSmoothingSeconds, sr);
    // White noise spreads over the whole band, so the share that is heard
    // falls as the rate rises; this holds it.
    noise_scale_ = std::sqrt(sr / 48000.0f);
    fade_step_ = 1.0f / (kStealSeconds * sr);
    clock_.reset(kControlPeriod);
    // Nothing outlives a voice: its pipe is counted as part of it.
    idle_.reset(sr, 0.1f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    const float sr = sample_rate();
    frequency =
        kit::clamp(frequency, kit::max(kLowestHz, Pipe::lowest_hz(sr)), kit::min(kHighestHz, kHighestShare * sr));
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    // A key struck again while held: the old breath stops quickly.
    const int held = pool_.find_held(note_id);
    if (held >= 0) release(pool_.voices[held], true);

    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    if (stolen) {
      // Fade the old note over 2 ms, then start (see render).
      voice.pending = true;
      voice.fading = true;
      voice.pending_frequency = frequency;
      voice.pending_gain = gain;
    } else {
      start(voice, frequency, gain);
    }
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held >= 0) release(pool_.voices[held], false);
  }

  void process(int frames) {
    frames = begin_block(frames);
    const bool was_asleep = idle_.asleep();
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    // The clock stood still while asleep; start it with the note that woke
    // the device, so what is heard does not depend on when sleep began.
    if (was_asleep) clock_.reset(kControlPeriod);
    clear_input(frames);  // an instrument ignores its input
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) control();

      float left = 0.0f, right = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (voice.sounding) render(voice, &left, &right);
      }
      left *= kVoiceGain;
      right *= kVoiceGain;
      const float hiss = hiss_level_.next();
      if (hiss > 0.0f) {
        left += hiss * hiss_band_[0].bandpass(hiss_[0].bipolar());
        right += hiss * hiss_band_[1].bandpass(hiss_[1].bipolar());
      }
      const float volume = volume_.next();
      out_left_[i] = kit::soft_clip(left * volume);
      out_right_[i] = kit::soft_clip(right * volume);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kControlPeriod = 16;
  static constexpr int kPipeSize = 4096;
  using Pipe = flute::PipeComb<kPipeSize>;

  // What makes one member of the family: all of it chosen, none measured.
  struct Voicing {
    float even;             // share of the even harmonics: 1 open pipe, near 0 stopped
    bool stopped;           // the pipe resonates at odd harmonics only
    float bright;           // brightness against the Concert flute
    float air;              // breath noise against the Concert flute
    float pipe_feedback;    // height of the pipe's resonances in the noise
    float pipe_damping_hz;  // where the noise's upper resonances give out
    float hiss;             // unpitched lip hiss, against the pipe noise
    int blip_harmonic;      // what speaks first: 2 the octave, 3 the twelfth
    float blip;             // its level at Chiff 1, against the note
    float puff;             // the noise puff at Chiff 1
    float chiff_seconds;    // how fast both die
    float speech_q;         // the tone lags the breath by Q / (π·f)
    float vibrato_hz;
    float vibrato_cents;    // pitch swing at Vibrato 1
    float vibrato_depth;    // pressure swing at Vibrato 1
    float scoop_seconds;    // time constant of the bend into tune
    float body_hz, body_db; // a broad peak
    float cut_hz;           // and the top of the tone
  };

  // Columns, in the order above:
  //   even, stopped, bright, air, pipe_feedback, pipe_damping_hz, hiss, blip_harmonic, blip, puff,
  //   chiff_seconds, speech_q, vibrato_hz, vibrato_cents, vibrato_depth,
  //   scoop_seconds, body_hz, body_db, cut_hz
  static constexpr Voicing kVoicings[kNumTypes] = {
      // Concert: clear, a quick octave chiff, a medium vibrato.
      {1.0f, false, 1.0f, 1.0f, 0.90f, 5000.0f, 0.25f, 2, 0.6f, 1.0f, 0.030f, 14.0f, 5.4f, 12.0f, 0.17f,
       0.050f, 900.0f, 2.0f, 5200.0f},
      // Low flute: a wide bore, dark and airy, slow to speak.
      {1.0f, false, 0.8f, 2.2f, 0.92f, 2500.0f, 0.07f, 2, 0.5f, 0.9f, 0.045f, 22.0f, 4.6f, 10.0f, 0.17f,
       0.060f, 500.0f, 3.0f, 2200.0f},
      // Shakuhachi: the most air, an explosive start, a slow wide vibrato.
      {1.0f, false, 1.15f, 1.9f, 0.86f, 7000.0f, 0.5f, 2, 0.8f, 2.0f, 0.040f, 12.0f, 3.8f, 22.0f, 0.2f,
       0.060f, 1100.0f, 3.0f, 8000.0f},
      // Pan pipes: stopped tubes, hollow, a big puff and the twelfth.
      {0.1f, true, 1.0f, 1.3f, 0.88f, 4500.0f, 0.3f, 3, 0.7f, 1.8f, 0.025f, 9.0f, 5.8f, 8.0f, 0.12f,
       0.035f, 1400.0f, 2.0f, 4200.0f},
      // Wood flute: a duct flute, round and steady, a short chirp.
      {1.0f, false, 0.7f, 0.55f, 0.90f, 3500.0f, 0.15f, 2, 0.7f, 0.5f, 0.020f, 16.0f, 5.0f, 8.0f, 0.12f,
       0.045f, 700.0f, 3.0f, 3200.0f},
  };

  // Softest touch as a share of full breath: a flute's dynamic range is small.
  static constexpr float kSoftestPressure = 0.3f;
  // The pressure of a mezzo-forte note (gain 0.75), where the pitch is true.
  static constexpr float kReferencePressure = 0.825f;
  // Cents per unit of pressure: harder is sharper, a dying note sags.
  static constexpr float kPitchPerPressure = 12.0f;
  // Ratio between neighbouring harmonics per unit of pressure, at Blow 0 and
  // the range Blow adds; and the most any note gets.
  static constexpr float kBlowFloor = 0.08f;
  static constexpr float kBlowRange = 0.47f;
  static constexpr float kMostBrightness = 0.62f;
  // Above C5 the tone purifies by half per octave; below it fills out a little.
  static constexpr float kRegisterHz = 523.25f;
  // The chiff's octave or twelfth has a little of its own series in it.
  static constexpr float kBlipBrightness = 0.25f;
  // Pipe noise at Breath 1, and the chiff's puff, for the Concert flute.
  static constexpr float kBreathLevel = 1.9f;
  static constexpr float kPuffLevel = 0.22f;
  // How deep the pipe noise pulses at the pitch period.
  static constexpr float kNoisePulse = 0.5f;
  // The lip hiss against the pipe noise it follows, and its band.
  static constexpr float kHissLevel = 0.4f;
  static constexpr float kHissHz = 3500.0f;
  static constexpr float kHissQ = 0.8f;
  static constexpr float kDriftPressure = 0.1f;
  static constexpr float kDriftCents = 2.5f;
  static constexpr float kDriftPressureHz = 0.9f;
  static constexpr float kDriftPitchHz = 0.55f;
  // The vibrato waits for the note to settle, then fades in.
  static constexpr float kVibratoDelay = 0.15f;
  static constexpr float kVibratoFade = 0.55f;
  // Each voice's vibrato runs at its own speed, so a chord does not wobble as one.
  static constexpr float kVibratoSpread[kMaxVoices] = {1.0f, 1.017f, 0.985f, 1.009f,
                                                       0.991f, 1.022f, 0.978f, 1.004f};
  static constexpr float kBodyQ = 0.9f;
  static constexpr float kSpread = 0.18f;
  static constexpr float kStealSeconds = 0.002f;
  static constexpr float kLowestHz = 24.0f;
  static constexpr float kHighestHz = 4200.0f;
  // And as a share of the sample rate: the chiff's twelfth stays under Nyquist.
  static constexpr float kHighestShare = 0.1f;
  // A voice is over when its tone and its pipe are both under these.
  static constexpr float kSilentTone = 1.0e-5f;
  static constexpr float kSilentPipe = 1.0e-6f;
  // One note at gain 0.8 peaks near -20 dBFS at the default volume, which
  // keeps ten held notes under the soft clip's knee.
  static constexpr float kVoiceGain = 0.26f;

  // A value set every control period and ramped across it.
  struct Ramp {
    float value = 0.0f;
    float target = 0.0f;
    float step = 0.0f;

    void snap(float v) {
      value = target = v;
      step = 0.0f;
    }
    void aim(float v) {
      value = target;
      target = v;
      step = (v - value) * (1.0f / static_cast<float>(kControlPeriod));
    }
    float next() {
      value += step;
      return value;
    }
  };

  struct Voice {
    Pipe pipe;
    kit::Adsr env;  // ticks on the control clock
    kit::Drift drift_pressure, drift_pitch;
    kit::Biquad body;
    kit::Svf cut;
    kit::Rng air;
    const Voicing* voicing = &kVoicings[0];
    Ramp increment, brightness, tone, blip, noise;
    float phase = 0.0f;
    float base_increment = 0.0f;
    float pressure = 0.0f;      // of the touch
    float speech = 0.0f;        // the breath as the tone has taken it up
    float speech_coeff = 0.0f;
    float register_gain = 1.0f;
    float cap = 0.0f;
    float blip_brightness = 0.0f;
    float chiff = 0.0f, chiff_coeff = 0.0f;
    float scoop = 0.0f, scoop_coeff = 0.0f;
    float age = 0.0f;
    float vibrato_phase = 0.0f, vibrato_step = 0.0f;
    float left = 0.7071f, right = 0.7071f;
    float fade = 1.0f;
    float ring = 0.0f;  // the pipe's peak since the last control tick
    float pending_frequency = 0.0f, pending_gain = 0.0f;
    bool sounding = false;
    bool fading = false;   // being faded out: stolen, or cancelled before it began
    bool pending = false;  // a note waits for the fade to end

    void reset() {
      pipe.clear();
      env = kit::Adsr();
      drift_pressure = kit::Drift();
      drift_pitch = kit::Drift();
      body.reset();
      body.set_identity();
      cut.reset();
      voicing = &kVoicings[0];
      increment.snap(0.0f);
      brightness.snap(0.0f);
      tone.snap(0.0f);
      blip.snap(0.0f);
      noise.snap(0.0f);
      phase = base_increment = pressure = speech = speech_coeff = 0.0f;
      register_gain = 1.0f;
      cap = blip_brightness = 0.0f;
      chiff = chiff_coeff = scoop = scoop_coeff = 0.0f;
      age = vibrato_phase = vibrato_step = 0.0f;
      left = right = 0.7071f;
      fade = 1.0f;
      ring = 0.0f;
      pending_frequency = pending_gain = 0.0f;
      sounding = fading = pending = false;
    }

    bool active() const { return sounding; }
    bool releasing() const { return !pending && (env.releasing() || !env.active()); }
    float level() const { return kit::max(pressure * env.level(), speech); }
  };

  void start(Voice& voice, float frequency, float gain) {
    using namespace flute;
    const float sr = sample_rate();
    const Voicing& type = kVoicings[kit::clamp_int(static_cast<int>(param(kType) + 0.5f), 0, kNumTypes - 1)];
    voice.voicing = &type;
    voice.pressure = kSoftestPressure + (1.0f - kSoftestPressure) * gain;
    voice.base_increment = frequency / sr;
    voice.register_gain = frequency > kRegisterHz
                              ? kRegisterHz / frequency
                              : kit::min(1.5f, std::sqrt(std::sqrt(kRegisterHz / frequency)));
    voice.cap = kit::min(kMostBrightness, brightness_cap(frequency, sr));
    voice.blip_brightness =
        kit::min(kBlipBrightness, brightness_cap(frequency * static_cast<float>(type.blip_harmonic), sr));
    voice.pipe.clear();
    voice.pipe.tune(frequency, type.pipe_feedback, kit::max(type.pipe_damping_hz, 4.0f * frequency), sr,
                    type.stopped);
    voice.body.reset();
    voice.body.set_peak(type.body_hz, kBodyQ, type.body_db, sr);
    voice.cut.reset();
    voice.cut.set(kit::max(type.cut_hz, 2.5f * frequency), kit::kSqrtHalf, sr);
    // Neighbouring semitones stand a little apart, as pipes on a rack do.
    const int semitone = static_cast<int>(std::floor(kit::hz_to_midi(frequency) + 0.5f));
    kit::pan_gains((semitone & 1) != 0 ? kSpread : -kSpread, &voice.left, &voice.right);
    // Anywhere in its cycle, so stacked notes do not add up in phase.
    voice.phase = start_.uniform();
    // A new envelope, not a reset one: a reset keeps a quick stop that was
    // cut short, and this note's release would be that quick stop.
    voice.env = kit::Adsr();
    voice.env.set_sample_rate(tick_rate_);
    voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
    voice.env.gate_on();
    voice.age = 0.0f;
    voice.vibrato_phase = 0.0f;
    voice.vibrato_step = type.vibrato_hz * kVibratoSpread[&voice - pool_.voices] / tick_rate_;
    voice.speech = 0.0f;
    voice.speech_coeff = 1.0f - std::exp(-kit::kPi * frequency / (type.speech_q * tick_rate_));
    voice.chiff = param(kChiff);
    voice.chiff_coeff = std::exp(-1.0f / (type.chiff_seconds * tick_rate_));
    voice.scoop = -param(kScoop);
    voice.scoop_coeff = std::exp(-1.0f / (type.scoop_seconds * tick_rate_));
    // No breath yet: flat by the scoop and by the missing pressure.
    voice.increment.snap(voice.base_increment *
                         kit::cents_to_ratio(voice.scoop - kPitchPerPressure * kReferencePressure));
    voice.brightness.snap(0.0f);
    voice.tone.snap(0.0f);
    voice.blip.snap(0.0f);
    voice.noise.snap(0.0f);
    voice.fade = 1.0f;
    voice.ring = 0.0f;
    voice.sounding = true;
    voice.fading = false;
    voice.pending = false;
  }

  void release(Voice& voice, bool fast) {
    // Released before its stolen start: it never sounds.
    voice.pending = false;
    if (fast) {
      voice.env.fast_release(0.03f);
    } else {
      voice.env.gate_off();
    }
  }

  // Every 16 samples: each voice's breath and what follows from it.
  void control() {
    using namespace flute;
    const float breath = breath_.next();
    const float air = kBreathLevel * noise_scale_ * breath * breath;
    const float puff = kPuffLevel * noise_scale_;
    const float blow = kBlowFloor + kBlowRange * blow_.next();
    const float vibrato = vibrato_.next();
    const float tick_seconds = 1.0f / tick_rate_;
    float hiss = 0.0f;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.sounding) continue;
      const Voicing& type = *voice.voicing;
      voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
      const float envelope = voice.env.next();

      voice.age += tick_seconds;
      const float settled = kit::clamp((voice.age - kVibratoDelay) / kVibratoFade, 0.0f, 1.0f);
      const float wobble =
          vibrato * settled * settled * (3.0f - 2.0f * settled) * kit::SineTable::lookup(voice.vibrato_phase);
      voice.vibrato_phase += voice.vibrato_step;
      voice.vibrato_phase -= std::floor(voice.vibrato_phase);

      const float pressure = voice.pressure * envelope *
                             (1.0f + kDriftPressure * voice.drift_pressure.next(kControlPeriod)) *
                             (1.0f + type.vibrato_depth * wobble);
      voice.speech = flush_denormal(voice.speech + (pressure - voice.speech) * voice.speech_coeff);
      voice.chiff *= voice.chiff_coeff;
      if (voice.chiff < 1.0e-4f) voice.chiff = 0.0f;
      voice.scoop *= voice.scoop_coeff;

      const float cents = voice.scoop + type.vibrato_cents * wobble +
                          kPitchPerPressure * (pressure - kReferencePressure) +
                          kDriftCents * voice.drift_pitch.next(kControlPeriod);
      voice.increment.aim(voice.base_increment * kit::cents_to_ratio(cents));
      voice.brightness.aim(kit::min(voice.cap, blow * voice.register_gain * type.bright * voice.speech));
      voice.tone.aim(voice.speech);
      voice.blip.aim(type.blip * voice.chiff * pressure);
      // Turbulence rises faster than the tone: pressure to the power 1.75.
      const float root = std::sqrt(pressure);
      const float noise =
          type.air * (air * pressure * root * std::sqrt(root) + puff * type.puff * voice.chiff * pressure);
      voice.noise.aim(noise);
      hiss += noise * type.hiss * voice.fade;

      if (!voice.env.active() && !voice.fading && voice.speech < kSilentTone && voice.ring < kSilentPipe) {
        voice.sounding = false;
      }
      voice.ring = 0.0f;
    }
    hiss_level_.aim(hiss * kHissLevel);
  }

  void render(Voice& voice, float* left, float* right) {
    if (voice.fading) {
      voice.fade -= fade_step_;
      if (voice.fade <= 0.0f) {
        if (!voice.pending) {
          voice.sounding = false;
          voice.fading = false;
          voice.fade = 1.0f;
          return;
        }
        start(voice, voice.pending_frequency, voice.pending_gain);
      }
    }
    const Voicing& type = *voice.voicing;
    voice.phase += voice.increment.next();
    if (voice.phase >= 1.0f) voice.phase -= 1.0f;
    const float sine = kit::SineTable::lookup(voice.phase);
    const float cosine = kit::SineTable::cos_lookup(voice.phase);
    float sound = voice.tone.next() * flute::pipe_tone(sine, cosine, voice.brightness.next(), type.even);
    const float blip = voice.blip.next();
    if (blip > 0.0f) {
      float upper_sine, upper_cosine;
      flute::multiple_angle(sine, cosine, type.blip_harmonic, &upper_sine, &upper_cosine);
      sound += blip * flute::harmonic_series(upper_sine, upper_cosine, voice.blip_brightness);
    }
    const float air =
        voice.pipe.process(voice.air.bipolar() * voice.noise.next() * (1.0f + kNoisePulse * cosine));
    voice.ring = kit::max(voice.ring, std::fabs(air));
    sound = voice.cut.lowpass(voice.body.process(sound + air)) * voice.fade;
    *left += sound * voice.left;
    *right += sound * voice.right;
  }

  void apply(int id) {
    using namespace flute;
    const float value = param(id);
    switch (id) {
      case kBreath:
        breath_.set(value, primed());
        break;
      case kBlow:
        blow_.set(value, primed());
        break;
      case kVibrato:
        vibrato_.set(value, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // Type, Chiff and Scoop at note-on; Attack and Release on the control clock
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Rng start_;
  kit::Rng hiss_[2];
  kit::Svf hiss_band_[2];
  Ramp hiss_level_;
  kit::Smoother breath_, blow_, vibrato_, volume_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float tick_rate_ = 3000.0f;
  float noise_scale_ = 1.0f;
  float fade_step_ = 0.01f;
};

}  // namespace livemix
