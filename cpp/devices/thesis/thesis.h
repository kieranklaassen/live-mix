#pragma once

// Thesis: a chord instrument made of filtered noise.
//
//                       per note (up to 8)
//   white noise ──┬─► band-pass  original       ─┐
//   (one source   ├─► band-pass  mirror          │
//    for every    ├─► band-pass  octaflip        ├─► ÷ √n ─► envelope ─┐
//    note)        ├─► band-pass  middle          │                     ├─► widener ─► soft clip ─► out
//                 ├─► band-pass  mirror middle   │       other notes ──┘
//                 └─► band-pass  centre         ─┘
//
// - A note is not one pitch but a small chord. ThesisTransform snaps the
//   played note to the scale and reflects it around the Center note, counting
//   in scale degrees: the mirror sits as far on the other side of the centre,
//   the octaflip is the note an octave towards the centre, the middle is
//   halfway to the centre, and so on. Each of the six results tunes one
//   resonant band-pass; the original is always on, the rest are switches.
// - Every filter of every note hears the same noise sample, as in the plugin,
//   so two notes that share a partial reinforce it instead of thickening it.
// - Resonance is the Q of the band-passes. Their output is scaled by
//   1 / max(1, Q / 10), which leaves a constant-Q noise band: level rises
//   3 dB per octave of pitch. The plugin clamps Q to 50, so the upper half of
//   the Resonance range does nothing; that is kept because three factory
//   presets sit up there and would change.
// - Mode moves the partials. Breathe swells each one between 0.3 and 1 with
//   its own phase; Drift wobbles the pitches by 2 %; Gravity pulls every
//   partial to the fifth above within a few milliseconds and holds it there
//   (that is what the plugin's attraction rule settles to).
// - Strum delays partial i by i x Strum. A waiting partial's filter does not
//   run, and the ÷ √n loudness correction counts only the partials that have
//   entered, so each entry is a small step as in the plugin.
// - The envelope is linear (attack and release in seconds, full sustain).
// - The voices sum to mono. The widener therefore only trims the level below
//   Width 75 and turns stereo above it, where its decorrelators come in.
//
// Filter coefficients are refreshed every 16 samples, and only for partials
// whose frequency has moved: a held note in Fixed or Breathe costs no tan().
// Everything is counted in samples from the note-on, so the output does not
// depend on the block size.

#include <cmath>

#include "../../kit/kit.h"
#include "../stereo-widener/StereoWidener.h"
#include "ThesisTransform.h"
#include "params.gen.h"

namespace livemix {

class Thesis : public kit::DeviceBase<thesis::kNumParams> {
 public:
  static constexpr int kMaxVoices = 8;
  static constexpr int kPartials = 6;

  void init(float sample_rate) {
    using namespace thesis;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    transform_ = ThesisTransform();
    noise_.seed(0x7E515A11u);
    phase_rng_.seed(0x0B5E55EDu);
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) pool_.voices[v] = Voice();

    glide_steps_ = static_cast<int>(kGlideSeconds * sr);
    if (glide_steps_ < 1) glide_steps_ = 1;
    max_hz_ = kit::min(20000.0f, 0.49f * sr);
    // White noise spreads its power up to Nyquist, so a band-pass would hear
    // 3 dB less of it at twice the rate. Scale the source to hold the level
    // the plugin has at 48 kHz.
    noise_gain_ = std::sqrt(sr / kReferenceRate);
    // The Gravity pull is a per-sample fraction in the plugin.
    gravity_scale_ = kGravityRate / sr;

    widener_.prepare(sr);
    widener_width_ = -1.0f;
    width_.set_time(kSmoothingSeconds, sr);
    resonance_.set_time(kSmoothingSeconds, sr);
    // Nothing outlives the envelopes but the widener's 2 ms of delay.
    idle_.reset(sr, 0.1f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, 8.0f, 13000.0f);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    const int midi = static_cast<int>(std::floor(kit::hz_to_midi(frequency) + 0.5f));

    // A key struck again while held: the old voice releases at its own pace.
    const int held = pool_.find_held(note_id);
    if (held >= 0) pool_.voices[held].env.note_off();

    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    const ThesisTransform::VoiceFrequencies chord = transform_.transform(midi);
    const float base[kPartials] = {chord.original, chord.mirror,       chord.octaflip,
                                   chord.middle,   chord.mirrorMiddle, chord.center};
    const int strum = static_cast<int>(param(thesis::kStrum) * 0.001f * sample_rate());
    for (int i = 0; i < kPartials; ++i) {
      Partial& partial = voice.partial[i];
      partial.base = base[i];
      partial.gravity = base[i];
      glide_to(partial, base[i]);
      partial.strum = strum * i;
    }
    voice.gain = gain;
    // A stolen voice keeps its envelope and its filters and glides to the
    // new chord, so the steal does not click.
    voice.env.note_on();
    const float phase = phase_rng_.uniform() * 0.1f * kit::kTwoPi;
    voice.lfo_sin = std::sin(phase);
    voice.lfo_cos = std::cos(phase);
    voice.moving = true;
    voice.refresh_in = 0;
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held >= 0) pool_.voices[held].env.note_off();
  }

  void process(int frames) {
    frames = begin_block(frames);
    const bool sounding = pool_.count_active() > 0;
    if (sounding && idle_.asleep()) {
      // Waking: start the widener from rest and take up controls that moved
      // while nothing sounded, so the first note does not glide in.
      widener_.reset();
      width_.snap(width_.target);
      resonance_.snap(resonance_.target);
    }
    if (!idle_.wake(sounding)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    for (int i = 0; i < frames; ++i) {
      q_ = resonance_.next();
      // Noise is drawn only while a note sounds, so what a note hears does
      // not depend on how long the device idled before it.
      float noise = 0.0f;
      bool drawn = false;
      float mono = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.env.active()) continue;
        if (!drawn) {
          noise = noise_.bipolar() * noise_gain_;
          drawn = true;
        }
        mono += render(voice, noise);
      }
      mono *= kOutputGain / kit::max(1.0f, q_ * 0.1f);

      const float width = width_.next();
      if (width != widener_width_) {
        widener_width_ = width;
        widener_.setWidth(width);
      }
      float left = mono;
      float right = mono;
      widener_.process(left, right);
      out_left_[i] = kit::soft_clip(left);
      out_right_[i] = kit::soft_clip(right);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  enum Mode : int { kFixed = 0, kBreathe, kDrift, kGravity };

  static constexpr float kGlideSeconds = 0.005f;      // partial frequency ramp
  static constexpr float kReferenceRate = 48000.0f;   // noise level reference
  static constexpr float kGravityRate = 44100.0f;     // rate the pull was tuned at
  static constexpr float kOutputGain = 0.3f;          // the plugin's voice level
  static constexpr float kDriftDepth = 0.02f;         // +/- 2 % of the frequency
  static constexpr float kGravityPull = 0.1f;         // largest per-sample fraction
  static constexpr int kRefreshInterval = 16;         // samples between retunes
  static constexpr float kRetuneThreshold = 1.0e-5f;  // 0.02 cents
  // sin and cos of the six phase offsets {0, 0.17, 0.33, 0.5, 0.67, 0.83} cycles.
  static constexpr float kOffsetSin[kPartials] = {0.0f,        0.87630668f,  0.87630668f,
                                                  0.0f,        -0.87630668f, -0.87630668f};
  static constexpr float kOffsetCos[kPartials] = {1.0f,        0.48175367f,  -0.48175367f,
                                                  -1.0f,       -0.48175367f, 0.48175367f};
  static constexpr float kInvSqrt[kPartials + 1] = {1.0f,        1.0f,        0.70710678f, 0.57735027f,
                                                    0.5f,        0.44721360f, 0.40824829f};

  // Straight-line attack and release with full sustain. The rates are the
  // device's, so the knobs act on notes that are already sounding.
  struct Envelope {
    enum Stage : int { kIdle = 0, kAttack, kSustain, kRelease };
    int stage = kIdle;
    float value = 0.0f;

    void note_on() { stage = kAttack; }
    void note_off() {
      if (stage != kIdle) stage = kRelease;
    }
    bool active() const { return stage != kIdle; }
    bool releasing() const { return stage == kRelease; }

    float next(float attack_step, float release_step) {
      switch (stage) {
        case kAttack:
          value += attack_step;
          if (value >= 1.0f) {
            value = 1.0f;
            stage = kSustain;
          }
          break;
        case kSustain:
          value = 1.0f;
          break;
        case kRelease:
          value -= release_step;
          if (value <= 0.0f) {
            value = 0.0f;
            stage = kIdle;
          }
          break;
        default:
          return 0.0f;
      }
      return value;
    }
  };

  struct Partial {
    // Band-pass state and coefficients (trapezoidal state-variable filter).
    float s1 = 0.0f, s2 = 0.0f;
    float g = 0.0f, damping = 2.0f, h = 1.0f;
    float tuned_hz = 0.0f;  // frequency the coefficients were made for
    // Frequency: where the transform put it, and the 5 ms ramp towards it.
    float base = 0.0f;
    float hz = 0.0f;
    float target = 0.0f;
    float step = 0.0f;
    int glide = 0;
    float gravity = 0.0f;  // Gravity's own running frequency
    int strum = 0;         // samples until this partial enters
  };

  struct Voice {
    Partial partial[kPartials];
    Envelope env;
    float gain = 0.0f;
    float lfo_sin = 0.0f, lfo_cos = 1.0f;
    float tuned_q = 0.0f;
    int refresh_in = 0;
    bool moving = false;

    bool active() const { return env.active(); }
    bool releasing() const { return env.releasing(); }
    float level() const { return env.value * gain; }
  };

  // Start a ramp of `glide_steps_` samples; a target that has not changed
  // leaves a running ramp alone.
  void glide_to(Partial& partial, float hz) {
    if (hz == partial.target) return;
    partial.target = hz;
    partial.glide = glide_steps_;
    partial.step = (hz - partial.hz) / static_cast<float>(glide_steps_);
  }

  // One sample of one note, before the resonance and output gains.
  float render(Voice& voice, float noise) {
    const float lfo_sin = voice.lfo_sin;
    const float lfo_cos = voice.lfo_cos;
    if (voice.moving) move(voice, lfo_sin, lfo_cos);
    if (--voice.refresh_in <= 0) {
      voice.refresh_in = kRefreshInterval;
      retune(voice);
    }

    const float envelope = voice.env.next(attack_step_, release_step_);
    const bool breathe = mode_ == kBreathe;
    float sum = 0.0f;
    int entered = 0;
    for (int i = 0; i < kPartials; ++i) {
      if (!enabled_[i]) continue;
      Partial& partial = voice.partial[i];
      if (partial.strum > 0) {
        --partial.strum;
        continue;
      }
      ++entered;
      const float high = partial.h * (noise - partial.s1 * partial.damping - partial.s2);
      const float band = high * partial.g + partial.s1;
      partial.s1 = high * partial.g + band;
      const float low = band * partial.g + partial.s2;
      partial.s2 = band * partial.g + low;
      if (breathe) {
        const float lfo = lfo_sin * kOffsetCos[i] + lfo_cos * kOffsetSin[i];
        const float breath = 0.5f + 0.5f * lfo;
        sum += band * (0.3f + 0.7f * breath * breath);
      } else {
        sum += band;
      }
    }

    // The evolution LFO: a coupled-form oscillator, one turn per 1 / Rate.
    voice.lfo_sin = lfo_sin + lfo_step_ * lfo_cos;
    voice.lfo_cos = lfo_cos - lfo_step_ * voice.lfo_sin;
    return sum * kInvSqrt[entered] * envelope * voice.gain;
  }

  // Advance the six frequencies: the mode's target, then the 5 ms ramp.
  void move(Voice& voice, float lfo_sin, float lfo_cos) {
    bool gliding = false;
    for (int i = 0; i < kPartials; ++i) {
      Partial& partial = voice.partial[i];
      float target = partial.base;
      if (mode_ == kDrift) {
        const float lfo = lfo_sin * kOffsetCos[i] + lfo_cos * kOffsetSin[i];
        target = partial.base * (1.0f + kDriftDepth * lfo);
      } else if (mode_ == kGravity) {
        // The plugin's rule: aim at the octave on this side of the note, or
        // at the fifth above if that is nearer. From the note itself the
        // fifth always wins, so every partial ends a fifth up.
        const float lfo = lfo_sin * kOffsetCos[i] + lfo_cos * kOffsetSin[i];
        const float pull = (lfo * 0.5f + 0.5f) * kGravityPull * gravity_scale_;
        const float fifth = partial.base * 1.5f;
        float aim = partial.gravity < partial.base ? partial.base * 0.5f : partial.base * 2.0f;
        if (std::fabs(fifth - partial.gravity) < std::fabs(aim - partial.gravity)) aim = fifth;
        partial.gravity = partial.gravity * (1.0f - pull) + aim * pull;
        target = partial.gravity;
      }
      glide_to(partial, target);
      if (partial.glide > 0) {
        --partial.glide;
        partial.hz = partial.glide > 0 ? partial.hz + partial.step : partial.target;
        gliding = true;
      }
    }
    voice.moving = gliding || mode_ >= kDrift;
  }

  // Bring the filter coefficients up to date with the frequencies and Q.
  void retune(Voice& voice) {
    const bool new_q = voice.tuned_q != q_;
    voice.tuned_q = q_;
    const float damping = 1.0f / q_;
    const float w = kit::kPi / sample_rate();
    for (int i = 0; i < kPartials; ++i) {
      Partial& partial = voice.partial[i];
      const float hz = kit::clamp(partial.hz, 20.0f, max_hz_);
      const float moved = hz - partial.tuned_hz;
      const bool retuned = moved > kRetuneThreshold * hz || moved < -kRetuneThreshold * hz;
      if (retuned) {
        partial.tuned_hz = hz;
        partial.g = std::tan(w * hz);
      }
      if (retuned || new_q) {
        partial.damping = partial.g + damping;
        partial.h = 1.0f / (1.0f + damping * partial.g + partial.g * partial.g);
      }
    }
  }

  void apply(int id) {
    using namespace thesis;
    const float value = param(id);
    const float sr = sample_rate();
    switch (id) {
      case kCenter:
        transform_.setCenterNote(static_cast<int>(value + 0.5f));
        break;
      case kScale:
        transform_.setScale(static_cast<ThesisTransform::Scale>(
            choice(value, static_cast<int>(ThesisTransform::Scale::NumScales))));
        break;
      case kRoot:
        transform_.setRoot(choice(value, 12));
        break;
      case kResonance:
        // The plugin's voices clamp Q to 1..50.
        resonance_.set(kit::clamp(value, 1.0f, 50.0f), primed());
        break;
      case kWidth:
        width_.set(value * 0.01f, primed());
        break;
      case kAttack:
        attack_step_ = 1.0f / (value * sr);
        break;
      case kRelease:
        release_step_ = 1.0f / (value * sr);
        break;
      case kMode:
        mode_ = choice(value, 4);
        for (int v = 0; v < kMaxVoices; ++v) pool_.voices[v].moving = true;
        break;
      case kBreatheRate:
        lfo_step_ = 2.0f * std::sin(kit::kPi * value / sr);
        break;
      case kStrum:
        break;  // read at note-on
      case kMirrorEnabled:
        enabled_[1] = value > 0.5f;
        break;
      case kOctaflipEnabled:
        enabled_[2] = value > 0.5f;
        break;
      case kMiddleEnabled:
        enabled_[3] = value > 0.5f;
        break;
      case kMirrorMiddleEnabled:
        enabled_[4] = value > 0.5f;
        break;
      case kCenterEnabled:
        enabled_[5] = value > 0.5f;
        break;
      default:
        break;
    }
  }

  static int choice(float value, int count) {
    const int index = static_cast<int>(value + 0.5f);
    return index < 0 ? 0 : (index >= count ? count - 1 : index);
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  ThesisTransform transform_;
  StereoWidener widener_;
  kit::Rng noise_;
  kit::Rng phase_rng_;
  kit::LinearRamp width_, resonance_;
  kit::IdleGate idle_;
  bool enabled_[kPartials] = {true, true, true, false, false, false};
  int mode_ = kBreathe;
  int glide_steps_ = 1;
  float q_ = 40.0f;
  float max_hz_ = 20000.0f;
  float noise_gain_ = 1.0f;
  float gravity_scale_ = 1.0f;
  float attack_step_ = 0.0f, release_step_ = 0.0f;
  float lfo_step_ = 0.0f;
  float widener_width_ = -1.0f;
};

}  // namespace livemix
