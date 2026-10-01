#pragma once

// Choir: wordless voices, a sustained "aah" or "ooh" for held chords.
//
//   per note (up to 12), one to three singers:
//     glottal pulse ─► tilt ─► × onset ─► place ─┐
//     (own drift, jitter, late vibrato)          ├─► × envelope × levelling ─┐
//                                                ┘                           │
//   breath: noise × Breath × how open the folds of the notes are ────────────┤
//                                                                            ▼
//             out ◄─ soft clip ◄─ volume ◄─ five formants in parallel ◄─ tone
//                                           (one bank, left and right)
//
//   vowel ─► Ah · Eh · Ee · Oh · Oo tables × Voice ─► formant frequencies,
//            + Motion's slow drift                    bandwidths and weights
//
// - Source and tract are those of a formant speech synthesiser (glottal.h,
//   formants.h): a KLGLOTT88 flow-derivative pulse per singer, band-limited,
//   and five two-pole resonators in parallel weighted to equal their
//   cascade, so the formants stand at the heights a tract gives them.
// - The formants are paraphonic: every note goes through the one bank, as in
//   the choir machines of the seventies. A singer tunes the tract to the
//   note; one bank cannot, so each note is levelled instead: its gain is the
//   inverse of what its harmonics would come out with through the formants
//   as they are now (FormantBank::harmonic_power). Without it a note with a
//   harmonic on F1 is 10 dB louder than its neighbour and a chord is lumpy;
//   with it the vowel changes the colour of a note and not its loudness, on
//   any key and while the vowel moves.
// - Ensemble brings in the second singer (from 0) and the third (from 0.3),
//   and sets how far apart they are: up to ±13 cents, more drift, and
//   entries up to 0.1 s late. They stand left and right of the first, on
//   opposite sides for alternate notes; the section is scaled to the power
//   of one singer. Their vibratos run at slightly different rates.
// - Vibrato waits a quarter of a second and takes 0.7 s to arrive: a singer
//   finds the note first. It is not level modulation; the level follows
//   from harmonics moving across the formants.
// - Voice is the size of the tract, a factor on every formant: 1 is the
//   table (a man), about 0.88 a bass, 1.17 a woman, 1.3 and up a child.
// - Velocity is vocal effort: louder is brighter (the tilt low-pass opens).
// - Breath is one noise source for the whole choir, scaled to the root of
//   the summed power of the held notes and pulsed by their glottal flow, so
//   it sits in the voice rather than beside it; the bank gives it the vowel.
// - Vowel and Voice glide (about 0.1 s) when moved while notes sound and
//   snap when nothing does.
//
// The instrument sleeps when no note sounds.

#include "../../kit/kit.h"
#include "formants.h"
#include "glottal.h"
#include "params.gen.h"

namespace livemix {

class Choir : public kit::DeviceBase<choir::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kSingers = 3;
  static constexpr int kControlPeriod = 32;

  // The three singers of a note: cents from the note at Ensemble 1 (each
  // note varies them by a fifth either way), place in the image, how late
  // they come in at Ensemble 1, share of the cycle their folds are open,
  // and their own drift rate, vibrato rate (as a ratio) and vibrato delay.
  static constexpr float kSpreadCents[kSingers] = {0.0f, 13.0f, -13.0f};
  static constexpr float kPosition[kSingers] = {0.0f, 0.8f, -0.8f};
  // 1/sqrt(1 + 0.8²): a singer at the side is as loud as one in the middle.
  static constexpr float kPanTrim = 0.781f;
  static constexpr float kLateSeconds[kSingers] = {0.0f, 0.045f, 0.09f};
  static constexpr float kOpenQuotient[kSingers] = {0.66f, 0.6f, 0.71f};
  static constexpr float kDriftHz[kSingers] = {0.37f, 0.29f, 0.47f};
  static constexpr float kVibratoPace[kSingers] = {1.0f, 1.07f, 0.94f};
  static constexpr float kVibratoDelay[kSingers] = {0.25f, 0.4f, 0.32f};
  // The second singer starts to sing at Ensemble 0 and the third at 0.3;
  // each comes up to full voice over a span of 0.4.
  static constexpr float kThirdFrom = 0.3f;
  static constexpr float kSingerSpan = 0.4f;
  // Every singer wanders by this many cents on their own, more in a section.
  static constexpr float kDriftCents = 1.5f;
  static constexpr float kDriftCentsEnsemble = 4.0f;
  // Cycle-to-cycle error in period (jitter), peak; a steady voice measures
  // about 0.2 % RMS.
  static constexpr float kJitter = 0.003f;
  // Vibrato comes in over this long once its delay has passed.
  static constexpr float kVibratoRiseSeconds = 0.7f;
  // Spectral tilt of the source: a one-pole low-pass from kTiltHz (softest)
  // up kTiltOctaves (loudest). Soft singing is darker, not only quieter.
  static constexpr float kTiltHz = 900.0f;
  static constexpr float kTiltOctaves = 2.2f;
  // Motion 1 moves the vowel this far along the morph (a vowel is 0.25) and
  // the length of the tract by this share.
  static constexpr float kMotionVowel = 0.22f;
  static constexpr float kMotionTract = 0.03f;
  static constexpr float kMotionVowelHz = 0.07f;
  static constexpr float kMotionTractHz = 0.11f;
  // The vowel and the voice follow their knobs through two of these in
  // series: an S-shaped glide that starts gently, done in about 0.1 s.
  static constexpr float kVowelGlideSeconds = 0.025f;
  // Breath noise: its level under the voice at Breath 1, how much of it
  // stays while the folds are closed, and how much of it is side signal.
  static constexpr float kBreathGain = 0.33f;
  static constexpr float kBreathFloor = 0.35f;
  static constexpr float kBreathSide = 0.7f;
  // One note at full velocity peaks near -9 dBFS before Volume.
  static constexpr float kVoiceGain = 0.45f;
  // Levelling never lifts a note by more than this (notes far above every
  // formant, which no voice sings).
  static constexpr float kMaxLevelling = 8.0f;

  void init(float sample_rate) {
    using namespace choir;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    const float control_rate = sr / static_cast<float>(kControlPeriod);
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      voice.env.set_sample_rate(sr);
      for (int s = 0; s < kSingers; ++s) {
        Singer& singer = voice.singer[s];
        const uint32_t seed = 0x9E3779B9u * static_cast<uint32_t>(v * kSingers + s + 1);
        singer.drift.seed(seed ^ 0x51ED270Bu);
        singer.drift.set_rate(kDriftHz[s], sr);
        singer.rng.seed(seed ^ 0x0BADC0DEu);
      }
    }
    bank_.reset();
    tone_left_.reset();
    tone_right_.reset();
    noise_mid_.seed(0xC0FFEE11u);
    noise_side_.seed(0x7F4A7C15u);
    start_.seed(0xA5A5F00Du);
    vowel_drift_.seed(0x13579BDFu);
    vowel_drift_.set_rate(kMotionVowelHz, sr);
    tract_drift_.seed(0x2468ACE1u);
    tract_drift_.set_rate(kMotionTractHz, sr);
    vowel_.set_time(kVowelGlideSeconds, control_rate);
    vowel_glide_.set_time(kVowelGlideSeconds, control_rate);
    scale_.set_time(kVowelGlideSeconds, control_rate);
    scale_glide_.set_time(kVowelGlideSeconds, control_rate);
    tone_.set_time(kSmoothingSeconds * 2.0f, control_rate);
    width_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    breath_.set_time(kSmoothingSeconds, sr);
    breath_.snap(0.0f);
    onset_coeff_ = 1.0f - kit::time_to_coeff(0.015f, sr);
    gain_coeff_ = 1.0f - kit::time_to_coeff(0.005f, sr);
    singer_weight_[0] = 1.0f;
    singer_weight_[1] = 0.0f;
    singer_weight_[2] = 0.0f;
    levelling_turn_ = 0;
    any_fresh_ = false;
    settle_ = true;
    clock_.reset(kControlPeriod);
    // Nothing outlives the envelopes but the ring of the formants (a few
    // milliseconds).
    idle_.reset(sr, 0.1f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    using namespace choir;
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, 8.0f, 12000.0f);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    // A note sung again while held: let the old voice go quickly.
    const int held = pool_.find_held(note_id);
    if (held >= 0) pool_.voices[held].env.fast_release(0.03f);

    const float sr = sample_rate();
    bool stolen = false;
    const int index = pool_.note_on(note_id, &stolen);
    Voice& voice = pool_.voices[index];
    voice.frequency = frequency;
    voice.increment = frequency / sr;
    voice.velocity = 0.3f + 0.7f * gain;
    const float tilt_hz = kit::min(kTiltHz * std::exp2(kTiltOctaves * gain), 0.45f * sr);
    voice.tilt_coeff = std::exp(-kit::kTwoPi * tilt_hz / sr);
    const float ensemble = param(kEnsemble);
    // Sections alternate sides from note to note.
    const float side = (index & 1) ? -1.0f : 1.0f;
    for (int s = 0; s < kSingers; ++s) {
      Singer& singer = voice.singer[s];
      singer.spread = kSpreadCents[s] * (0.8f + 0.4f * start_.uniform());
      singer.position = kPosition[s] * side;
      singer.age = 0.0f;
      const float start = start_.uniform();
      const float late = 0.6f + 0.8f * start_.uniform();
      if (!stolen) {
        // A fresh voice starts its singers apart in phase and time; a
        // stolen one keeps singing so the new note does not click.
        singer.pulse.reset(start, kOpenQuotient[s]);
        singer.tilt = 0.0f;
        singer.jitter = 1.0f;
        singer.amp = 0.0f;
        singer.target = 0.0f;
        singer.vibrato_phase = start;
        singer.wait = kLateSeconds[s] * late * ensemble;
      }
    }
    // Levelled on the next sample processed (the formants may have moved).
    voice.fresh = true;
    voice.snap_gain = !stolen;
    any_fresh_ = true;
    voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
    voice.env.gate_on();
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held >= 0) pool_.voices[held].env.gate_off();
  }

  void process(int frames) {
    using namespace choir;
    frames = begin_block(frames);
    const bool was_asleep = idle_.asleep();
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    if (was_asleep) wake();
    const float sr = sample_rate();
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) control(sr);
      if (any_fresh_) level_fresh_voices(sr);

      float mid = 0.0f, side = 0.0f, rushing = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.env.active()) continue;
        float voice_mid = 0.0f, voice_side = 0.0f;
        for (int s = 0; s < kSingers; ++s) {
          Singer& singer = voice.singer[s];
          if (singer.amp == 0.0f && singer.target == 0.0f) continue;
          singer.amp += (singer.target - singer.amp) * onset_coeff_;
          if (singer.amp < 1.0e-5f && singer.target == 0.0f) singer.amp = 0.0f;
          const float increment = kit::min(voice.increment * singer.ratio * singer.jitter, 0.45f);
          if (singer.pulse.advance(increment)) {
            singer.jitter = 1.0f + kJitter * singer.rng.bipolar();
          }
          const float pulse = singer.pulse.derivative(increment);
          singer.tilt = flush_denormal(pulse + (singer.tilt - pulse) * voice.tilt_coeff);
          const float sung = singer.tilt * singer.amp;
          voice_mid += sung;
          voice_side += sung * singer.position;
        }
        voice.gain += (voice.gain_target - voice.gain) * gain_coeff_;
        const float env = voice.env.next();
        const float gain = env * voice.gain;
        mid += voice_mid * gain;
        side += voice_side * gain;
        // Breath follows the note's envelope and loudness and rushes while
        // the first singer's folds are open. Powers add, as if every note
        // had its own noise: a chord's breath grows as its voices do.
        const float open = kBreathFloor + (1.0f - kBreathFloor) * voice.singer[0].pulse.flow();
        const float rush = env * voice.velocity * open;
        rushing += rush * rush;
      }
      const float breath = std::sqrt(rushing) * breath_.next();
      mid += breath * noise_mid_.bipolar();
      side += breath * kBreathSide * noise_side_.bipolar();

      const float width = width_.next();
      float left = tone_left_.lowpass(mid + width * side);
      float right = tone_right_.lowpass(mid - width * side);
      bank_.process(left, right, &left, &right);
      const float volume = volume_.next();
      out_left_[i] = kit::soft_clip(left * volume);
      out_right_[i] = kit::soft_clip(right * volume);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  struct Singer {
    choir_dsp::GlottalPulse pulse;
    kit::Drift drift;
    kit::Rng rng;
    float tilt = 0.0f;           // state of the spectral-tilt low-pass
    float jitter = 1.0f;         // this cycle's error in period
    float ratio = 1.0f;          // spread, drift and vibrato, set on the control clock
    float amp = 0.0f;            // weight in the section, smoothed per sample
    float target = 0.0f;
    float wait = 0.0f;           // seconds until this singer comes in
    float age = 0.0f;            // seconds since, for the vibrato onset
    float vibrato_phase = 0.0f;
    float spread = 0.0f;         // cents from the note at Ensemble 1
    float position = 0.0f;       // -1 left .. 1 right
  };

  struct Voice {
    Singer singer[kSingers];
    kit::Adsr env;
    float frequency = 220.0f;
    float increment = 0.0f;
    float velocity = 0.0f;
    float tilt_coeff = 0.0f;
    float gain = 0.0f;           // velocity and levelling, smoothed per sample
    float gain_target = 0.0f;
    bool fresh = false;          // just started: level it before it sounds
    bool snap_gain = false;      // ... and start at that level (not stolen)

    bool active() const { return env.active(); }
    bool releasing() const { return env.releasing(); }
    float level() const { return env.level(); }
  };

  // Every 32 samples: the vowel and its drift, the shared filters, and each
  // singer's pitch.
  void control(float sr) {
    using namespace choir;
    const float dt = static_cast<float>(kControlPeriod) / sr;

    // The tract: vowel and size, both breathing with Motion.
    const float motion = param(kMotion);
    vowel_glide_.set_target(vowel_.next());
    scale_glide_.set_target(scale_.next());
    float vowel = vowel_glide_.next() + motion * kMotionVowel * vowel_drift_.next(kControlPeriod);
    // At either end of the morph the drift turns back instead of stopping.
    if (vowel < 0.0f) vowel = -vowel;
    if (vowel > 1.0f) vowel = 2.0f - vowel;
    const float sway = 1.0f + motion * kMotionTract * tract_drift_.next(kControlPeriod);
    const float scale = scale_glide_.next() * sway;
    choir_dsp::FormantSet formants;
    choir_dsp::vowel_at(vowel, scale, &formants);
    bank_.set(formants, scale, sr, kControlPeriod);
    tone_left_.set(tone_.next(), kit::kSqrtHalf, sr);
    tone_right_.g = tone_left_.g;
    tone_right_.k = tone_left_.k;
    tone_right_.a1 = tone_left_.a1;
    tone_right_.a2 = tone_left_.a2;
    tone_right_.a3 = tone_left_.a3;
    // Breath keeps its loudness under the voice whatever the vowel.
    const float breath = param(kBreath);
    const float hiss = breath * breath * kBreathGain * kVoiceGain;
    breath_.set(hiss * std::sqrt(sr / bank_.noise_power()), !settle_);
    settle_ = false;

    // The section: who sings, and how far apart.
    const float ensemble = param(kEnsemble);
    const float second = kit::clamp(ensemble / kSingerSpan, 0.0f, 1.0f);
    const float third = kit::clamp((ensemble - kThirdFrom) / kSingerSpan, 0.0f, 1.0f);
    const float even = 1.0f / std::sqrt(1.0f + second * second + third * third);
    singer_weight_[0] = even;
    singer_weight_[1] = second * even * kPanTrim;
    singer_weight_[2] = third * even * kPanTrim;
    const float drift_cents = kDriftCents + kDriftCentsEnsemble * ensemble;
    const float vibrato_cents = param(kVibrato);
    const float vibrato_step = param(kVibratoRate) * dt;

    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.env.active()) continue;
      voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
      for (int s = 0; s < kSingers; ++s) {
        Singer& singer = voice.singer[s];
        if (singer_weight_[s] == 0.0f && singer.amp == 0.0f) {
          singer.target = 0.0f;  // not in the section
          continue;
        }
        if (singer.wait > 0.0f) {
          singer.wait -= dt;
          singer.target = 0.0f;
        } else {
          singer.target = singer_weight_[s];
          singer.age += dt;
        }
        const float cents = singer.spread * ensemble +
                            drift_cents * singer.drift.next(kControlPeriod) +
                            vibrato_cents * vibrato(singer, s, vibrato_step);
        // 2^(cents/1200) to second order: exact to 0.01 cent over ±100 cents.
        const float x = cents * (0.69314718f / 1200.0f);
        singer.ratio = 1.0f + x + 0.5f * x * x;
      }
    }

    // Levelling: one note per tick while the vowel only drifts, every note
    // while a knob is moving it.
    if (!vowel_glide_.settled() || !scale_glide_.settled()) {
      for (int v = 0; v < kMaxVoices; ++v) {
        if (pool_.voices[v].env.active()) level(pool_.voices[v], sr);
      }
    } else {
      Voice& turn = pool_.voices[levelling_turn_];
      if (turn.env.active()) level(turn, sr);
      if (++levelling_turn_ >= kMaxVoices) levelling_turn_ = 0;
    }
  }

  // One singer's vibrato, -1..1: none at first, then in over
  // kVibratoRiseSeconds. `step` is the cycles the common rate turns per tick.
  static float vibrato(Singer& singer, int s, float step) {
    const float t = kit::clamp((singer.age - kVibratoDelay[s]) / kVibratoRiseSeconds, 0.0f, 1.0f);
    const float onset = t * t * (3.0f - 2.0f * t);
    singer.vibrato_phase += step * kVibratoPace[s];
    singer.vibrato_phase -= std::floor(singer.vibrato_phase);
    return onset * kit::SineTable::lookup(singer.vibrato_phase);
  }

  void level(Voice& voice, float sr) {
    const float power = bank_.harmonic_power(voice.frequency, sr);
    const float levelling = kit::min(1.0f / std::sqrt(power), kMaxLevelling);
    voice.gain_target = voice.velocity * kVoiceGain * levelling;
  }

  // Notes that started since the last sample: level them against the
  // formants as they are now, and bring the first singer in at once.
  void level_fresh_voices(float sr) {
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.fresh) continue;
      voice.fresh = false;
      level(voice, sr);
      if (voice.snap_gain) {
        voice.gain = voice.gain_target;
        voice.singer[0].target = singer_weight_[0];
        voice.singer[0].amp = singer_weight_[0];
      }
    }
    any_fresh_ = false;
  }

  // Back from sleep: whatever moved while nothing sounded is simply there,
  // and the control clock starts on the first sample.
  void wake() {
    vowel_.snap(vowel_.target);
    vowel_glide_.snap(vowel_.target);
    scale_.snap(scale_.target);
    scale_glide_.snap(scale_.target);
    tone_.snap(tone_.target);
    width_.snap(width_.target);
    volume_.snap(volume_.target);
    bank_.reset();
    tone_left_.reset();
    tone_right_.reset();
    clock_.reset(kControlPeriod);
    settle_ = true;
  }

  void apply(int id) {
    using namespace choir;
    const float value = param(id);
    switch (id) {
      case kVowel:
        vowel_.set(value, primed());
        if (!primed()) vowel_glide_.snap(value);
        break;
      case kVoice:
        scale_.set(value, primed());
        if (!primed()) scale_glide_.snap(value);
        break;
      case kTone:
        tone_.set(value, primed());
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
  choir_dsp::FormantBank bank_;
  kit::Svf tone_left_, tone_right_;
  kit::Rng noise_mid_, noise_side_, start_;
  kit::Drift vowel_drift_, tract_drift_;
  // Read on the control clock (time constants in control ticks).
  kit::Smoother vowel_, vowel_glide_, scale_, scale_glide_, tone_;
  // Read per sample.
  kit::Smoother width_, volume_, breath_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float singer_weight_[kSingers] = {1.0f, 0.0f, 0.0f};
  float onset_coeff_ = 0.0f;
  float gain_coeff_ = 0.0f;
  int levelling_turn_ = 0;
  bool any_fresh_ = false;
  bool settle_ = true;  // the next control tick snaps instead of gliding
};

}  // namespace livemix
