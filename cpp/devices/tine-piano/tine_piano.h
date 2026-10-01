#pragma once

// Tine: a tine electric piano, modelled rather than sampled.
//
//   per key (up to 20):
//     tine      sine at f: the strike, a prompt decay ──┐
//     tone bar  the same pitch, slow to speak and slow  ├─► tip displacement d
//               to die: the sustain ────────────────────┤
//     bell      the tine's second mode, 6.27 f, gone    │
//               in a fraction of a second ──────────────┘
//     pickup    flux(u0 + d) ─► d/dt ─► key level ──┐
//                                                   ▼
//   all keys ─► amplifier drive ─► tone ─► tremolo / auto-pan ─► soft clip
//
// - The tone bar is tuned to its tine and is not heard as a pitch of its
//   own; it stores the strike and hands it back. So tine and bar are one
//   oscillator with a two-stage level: the tine's share falls quickly, the
//   bar's share arrives over 30 ms and falls at less than half the rate.
// - The pickup is where the character is. The flux through the coil is a
//   bell-shaped function of how far the tine tip is from the pole axis,
//   1/(1 + u²) in pole widths, and the output voltage is its rate of change.
//   Where the tine rests on that curve decides the tone. At the inflection
//   point (u0 = 0.577) the curve is antisymmetric about the rest position:
//   small swings come out as a sine and large ones gain odd harmonics, the
//   hollow tone of Bark 0. Bark moves the rest position towards the axis and
//   the tine closer to the pole (a larger swing in pole widths): the curve is
//   now lopsided, and a hard note swings over its top, which is the
//   even-harmonic bark. Because the displacement goes through the curve with
//   its envelope on, every note grows purer as it dies away, and a soft note
//   is nearly a sine at any setting.
// - Taking the rate of change weights harmonic k by k, which is why the
//   small second mode of the tine is heard as a clear bell on the attack. It
//   is taken analytically, flux'(u) times the tip's velocity (the cosines of
//   the same oscillators), not as a difference of samples: that keeps the
//   weighting exact and means a step anywhere (a stolen voice, Bark moving
//   under a held bass note) is not multiplied by the hundred or so that a
//   normalised first difference costs at 55 Hz.
// - Velocity always sets the loudness. Hardness decides how much of it also
//   reaches the swing at the pickup (bark) and the bell: at 0 a hard note is
//   a loud soft note.
// - Notes last sustain_seconds(f) × Decay: long in the bass, short in the
//   treble, as tines do. Key up brings the damper down: Release is the time
//   it takes to take 60 dB off the tine.
// - The swing is limited per key so that the harmonics the pickup makes above
//   Nyquist stay under -60 dB; the top octaves are therefore nearly pure,
//   which is also true of the instrument.
// - Tremolo is the suitcase amplifier's: one sine LFO on both channels, the
//   right one Pan × 180° behind. Pan 0 is plain amplitude tremolo, Pan 1 a
//   full auto-pan. Its gain is scaled so depth does not change loudness.
//
// Bell, Bark's swing, Hardness, Decay are read when a key is struck; the rest
// are live. The instrument sleeps when no key sounds.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class TinePiano : public kit::DeviceBase<tine_piano::kNumParams> {
 public:
  static constexpr int kMaxVoices = 20;
  // Second bending mode of a clamped bar over its first. (A real tine's
  // tuning spring moves it a little; the ear hears "inharmonic and high".)
  static constexpr float kBellRatio = 6.267f;
  static constexpr float kKeyReferenceHz = 261.63f;

  // Seconds for a held note at `hz` to fall 60 dB, at Decay 1.
  static float sustain_seconds(float hz) {
    return kit::clamp(11.0f * std::pow(kKeyReferenceHz / hz, 0.45f), 1.2f, 24.0f);
  }
  // The same for the bell partial (not scaled by Decay).
  static float bell_seconds(float hz) {
    return kit::clamp(0.45f * std::pow(kKeyReferenceHz / hz, 0.3f), 0.12f, 0.9f);
  }

  void init(float sample_rate) {
    using namespace tine_piano;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) pool_.voices[v] = Voice();
    tone_.reset();
    rumble_.reset();
    rumble_.set_cutoff(30.0f, sr);
    // Bark moves the working point of every sounding note; slowly, please.
    position_.set_time(0.05f, sr);
    tone_position_.set_time(0.02f, sr / 32.0f);
    drive_.set_time(kSmoothingSeconds, sr);
    depth_.set_time(kSmoothingSeconds, sr);
    pan_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    lfo_phase_ = 0.0f;
    lfo_increment_ = 0.0f;
    clock_.reset(32);
    idle_.reset(sr, 0.1f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    using namespace tine_piano;
    if (!(frequency == frequency)) return;  // NaN
    const float sr = sample_rate();
    frequency = kit::clamp(frequency, 16.0f, kit::min(8000.0f, 0.3f * sr));
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    // A key struck again while it sounds: the damper catches the old note.
    const int held = pool_.find_held(note_id);
    if (held >= 0) pool_.voices[held].release(kRestrikeSeconds, sr);

    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    voice = Voice();  // a stolen voice stops dead; it was the quietest one
    voice.on = true;

    const float hardness = param(kHardness);
    const float bark = param(kBark);
    // How far the tine swings at the pickup, in pole widths.
    const float strike = kit::lerp(kSoftStrike, 0.15f + 0.85f * gain, hardness);
    const float key = kit::clamp(std::pow(kKeyReferenceHz / frequency, 0.3f), 0.5f, 1.3f);
    const float nyquist_share = frequency / (0.5f * sr);
    // Harmonic k of the pickup curve falls as swing^k (and the derivative
    // weights it by k): the swing whose first harmonic above Nyquist is at
    // -60 dB.
    const float clean = std::pow(1.0e-3f * nyquist_share, nyquist_share);
    voice.swing = kit::min(kMaxSwing * (0.35f + 0.65f * bark) * strike * key, clean);

    const float bell_hz = frequency * kBellRatio;
    const float bell_room = kit::clamp((0.45f * sr - bell_hz) / (0.1f * sr), 0.0f, 1.0f);
    voice.bell_level = param(kBell) * kBellSwing * bell_room *
                       kit::lerp(0.5f, 1.3f * gain * gain, hardness);

    voice.increment[0] = frequency / sr;
    voice.increment[1] = bell_room > 0.0f ? bell_hz / sr : 0.0f;

    const float sustain = sustain_seconds(frequency) * param(kDecay);
    voice.tine_coeff = decay_coeff(sustain * kTineDecay, sr);
    voice.bar_coeff = decay_coeff(sustain * kBarDecay, sr);
    voice.bell_coeff = decay_coeff(bell_seconds(frequency), sr);
    voice.rise_coeff = 1.0f - kit::time_to_coeff(kBarRiseSeconds, sr);
    voice.attack_step = 1.0f / (kAttackSeconds * sr);

    // Velocity to loudness.
    voice.gain = 0.12f + 0.88f * gain * std::sqrt(gain);
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held >= 0) pool_.voices[held].release(param(tine_piano::kRelease), sample_rate());
  }

  void process(int frames) {
    using namespace tine_piano;
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    const float sr = sample_rate();
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) {
        tone_.set(kToneLowHz * std::pow(kToneSpan, tone_position_.next()), 0.6f, sr);
        lfo_increment_ = param(kTremoloRate) / sr;
      }

      // The pickup curve at the tine's rest position.
      const float rest = position_.next();
      const float rest_flux = 1.0f / (1.0f + rest * rest);
      float mono = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (voice.on) mono += voice.render(rest);
      }
      // Unity small-signal gain wherever the tine rests: 1 / |flux'(rest)|.
      mono *= kVoiceGain * 0.5f / (rest * rest_flux * rest_flux);

      // Amplifier: a soft stage that leaves quiet playing alone, then tone.
      const float drive = drive_.next();
      mono = kit::fast_tanh(mono * drive) / drive;
      mono = rumble_.highpass(tone_.lowpass(mono));

      // Tremolo: the right channel's LFO lags by Pan × 180°.
      lfo_phase_ += lfo_increment_;
      if (lfo_phase_ >= 1.0f) lfo_phase_ -= 1.0f;
      const float depth = depth_.next();
      const float lag = 0.5f * pan_.next();
      const float left = 1.0f - depth * (0.5f + 0.5f * kit::SineTable::lookup(lfo_phase_));
      const float right = 1.0f - depth * (0.5f + 0.5f * kit::SineTable::lookup(lfo_phase_ + lag));
      // Equal loudness at any depth: the RMS of either gain is held at 1.
      const float level =
          volume_.next() / std::sqrt((1.0f - 0.5f * depth) * (1.0f - 0.5f * depth) + 0.125f * depth * depth);
      out_left_[i] = kit::soft_clip(mono * left * level);
      out_right_[i] = kit::soft_clip(mono * right * level);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  // Pole widths the tine swings at Bark 1, full velocity, middle C.
  static constexpr float kMaxSwing = 0.55f;
  // Rest position: the curve's inflection point at Bark 0, this much nearer
  // the axis at Bark 1.
  static constexpr float kRestPosition = 0.57735f;
  static constexpr float kRestTravel = 0.22f;
  // The share of full swing every note gets when Hardness is 0.
  static constexpr float kSoftStrike = 0.5f;
  // Bell swing relative to the tine's at Bell 1 (the pickup's derivative
  // multiplies it by 6.27).
  static constexpr float kBellSwing = 0.09f;
  // Tine and tone bar: the tine carries the first seconds, the bar the rest.
  static constexpr float kTineDecay = 0.5f;
  static constexpr float kBarDecay = 1.1f;
  static constexpr float kBarLevel = 0.3f;
  static constexpr float kBarRiseSeconds = 0.03f;
  static constexpr float kAttackSeconds = 0.002f;
  static constexpr float kRestrikeSeconds = 0.04f;
  static constexpr float kSilence = 1.0e-5f;
  static constexpr float kToneLowHz = 500.0f;
  static constexpr float kToneSpan = 28.0f;  // Tone 1 is 14 kHz
  // One key at gain 0.7 peaks near -17 dBFS at the default volume.
  static constexpr float kVoiceGain = 0.42f;

  // Per-sample factor that takes 60 dB off in `seconds`.
  static float decay_coeff(float seconds, float sample_rate) {
    return std::exp(-6.907755f / kit::max(1.0f, seconds * sample_rate));
  }

  struct Voice {
    float phase[2] = {0.0f, 0.0f};  // tine and tone bar, bell
    float increment[2] = {0.0f, 0.0f};
    float tine = 1.0f, bar = 1.0f, bell = 1.0f;  // decaying levels
    float bar_rise = 0.0f;
    float attack = 0.0f;
    float damper = 1.0f;
    float tine_coeff = 1.0f, bar_coeff = 1.0f, bell_coeff = 1.0f, rise_coeff = 1.0f;
    float attack_step = 1.0f;
    float damper_coeff = 1.0f;
    float swing = 0.1f;
    float bell_level = 0.0f;
    float gain = 0.0f;
    float sounding = 0.0f;
    bool released = false;
    bool on = false;

    bool active() const { return on; }
    bool releasing() const { return released; }
    float level() const { return sounding; }

    void release(float seconds, float sample_rate) {
      if (!on) return;
      const float coeff = decay_coeff(seconds, sample_rate);
      // A faster damper may take over from a slower one, never the reverse.
      if (!released || coeff < damper_coeff) damper_coeff = coeff;
      released = true;
    }

    // One sample of pickup voltage for a tine resting at `rest`:
    // -flux'(rest + displacement) × velocity, the velocity in units of the
    // key's angular frequency so every key has the same small-signal gain.
    float render(float rest) {
      if (attack < 1.0f) attack = kit::min(1.0f, attack + attack_step);
      tine *= tine_coeff;
      bar *= bar_coeff;
      bar_rise += (1.0f - bar_rise) * rise_coeff;
      bell *= bell_coeff;
      if (bell < kSilence) bell = 0.0f;  // or it idles among the denormals
      if (released) damper *= damper_coeff;
      const float envelope = attack * damper;
      const float body = tine + kBarLevel * bar * bar_rise;
      const float ring = bell_level * bell;
      sounding = body * damper;
      if (sounding < kSilence) on = false;

      const float displacement =
          envelope * swing *
          (body * kit::SineTable::lookup(phase[0]) + ring * kit::SineTable::lookup(phase[1]));
      const float velocity = envelope * (body * kit::SineTable::cos_lookup(phase[0]) +
                                         ring * kBellRatio * kit::SineTable::cos_lookup(phase[1]));
      for (int k = 0; k < 2; ++k) {
        phase[k] += increment[k];
        if (phase[k] >= 1.0f) phase[k] -= 1.0f;
      }
      const float u = rest + displacement;
      const float flux = 1.0f / (1.0f + u * u);
      return 2.0f * u * flux * flux * velocity * gain;
    }
  };

  void apply(int id) {
    using namespace tine_piano;
    const float value = param(id);
    switch (id) {
      case kBark:
        position_.set(kRestPosition - kRestTravel * value, primed());
        break;
      case kTone:
        tone_position_.set(value, primed());
        break;
      case kDrive:
        drive_.set(0.5f + 7.5f * value * value, primed());
        break;
      case kTremolo:
        depth_.set(value, primed());
        break;
      case kPan:
        pan_.set(value, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read at note-on, at key-up or on the control clock
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Svf tone_;
  kit::OnePole rumble_;
  kit::Smoother position_, tone_position_, drive_, depth_, pan_, volume_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float lfo_phase_ = 0.0f;
  float lfo_increment_ = 0.0f;
};

}  // namespace livemix
