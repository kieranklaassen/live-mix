#pragma once

// Reed Organ: a harmonium or a small pipe organ, for held chords and drones.
//
//   per key (up to 16):
//     one phase ─┬─ 16'   (× Sub)        ┐
//                ├─ 8'    (always)       │ each rank: flute ◄─ Reed ─► reed
//                ├─ 4'    (× Octave)     ├─► speech envelope ─► C side / C♯ side
//                ├─ 2 2/3' (× Twelfth)   │
//                └─ 2'    (× Fifteenth)  ┘
//     celeste: an 8' rank a little sharp, from the other side of the case
//     chiff: a short puff of noise around the pipe's third harmonic
//
//   wind ─► noise following the keys held ─┐
//   all keys ──────────────────────────────┴─► × pressure ─► tone ─► soft clip
//
//   pressure = 1 + bellows (a slow uneven pump, 0.31 Hz) + tremulant (5.5 Hz)
//
// - Every rank of a key is read from that key's one phase accumulator (the
//   16' phase, multiplied by 2, 4, 6 and 8), so the ranks cannot drift
//   against each other: a key is one periodic waveform, as a drawbar organ's
//   is, and adding a rank changes its colour, not its steadiness. The celeste
//   is the exception by design: it has its own phase, celeste_beat_hz(f)
//   above the note, and beats against the 8'.
// - A rank is sin(x) / (1 - 2a·cos(x) + a²), which is the series
//   sin(x) + a·sin(2x) + a²·sin(3x) + ...: a sine at a = 0 (flute) and, as
//   Reed raises a towards 0.75, the full buzzing harmonic series of a free
//   reed, each harmonic 2.5 dB under the last. It is one division per rank
//   and band-limited by choosing a: a rank's a is capped so its harmonics
//   reach -60 dB by Nyquist, which leaves the full reed below 1 kHz and
//   turns small pipes into flutes, as they are. Each rank is scaled to the
//   same power whatever its a, so Reed changes colour, not loudness.
// - The sines and cosines of the five footages come from one sine and one
//   cosine of the key's phase by the double- and sum-angle formulas.
// - Wind pressure is one signal. It scales the level of pipes and wind noise
//   and bends the pitch with it (kPitchPerPressure: about 5 cents at the
//   deepest bellows), so Bellows breathes and Tremulant shakes level and
//   pitch together, the way an unsteady wind supply does.
// - Keys alternate sides by semitone, as pipes stand on a chest (C side and
//   C♯ side), and the celeste speaks from the opposite side to its 8', so
//   its beating moves across the image. The spread is small.
// - Registration is partly level-compensated: all ranks out is 2 dB louder
//   than the 8' alone, not 8 dB.
//
// The instrument sleeps when no key sounds.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Organ : public kit::DeviceBase<organ::kNumParams> {
 public:
  static constexpr int kMaxVoices = 16;
  static constexpr float kBellowsHz = 0.31f;
  static constexpr float kTremulantHz = 5.5f;
  // Peak change of wind pressure at Bellows 1 and Tremulant 1.
  static constexpr float kBellowsDepth = 0.22f;
  static constexpr float kTremulantDepth = 0.3f;
  // Ratio between neighbouring harmonics of a rank at Reed 1.
  static constexpr float kReedMost = 0.75f;
  // Relative pitch change per unit of pressure change.
  static constexpr float kPitchPerPressure = 0.012f;

  // How far above the note the celeste rank is tuned: one beat a second at
  // middle C, rising with the square root of pitch as organ builders tune it
  // (a fixed number of cents would be sluggish in the bass and a flutter in
  // the treble).
  static float celeste_beat_hz(float hz) { return std::sqrt(hz / 261.63f); }

  void init(float sample_rate) {
    using namespace organ;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      voice.env.set_sample_rate(sr);
    }
    start_.seed(0xC0FFEE11u);
    puff_.seed(0x51A7E5EDu);
    for (int c = 0; c < 2; ++c) {
      wind_[c] = kit::Noise();
      wind_[c].seed(0x9E3779B9u + 7919u * static_cast<uint32_t>(c));
      wind_low_[c].reset();
      wind_low_[c].set_cutoff(350.0f, sr);
      wind_high_[c].reset();
      wind_high_[c].set_cutoff(4200.0f, sr);
      tone_[c].reset();
      rumble_[c].reset();
      rumble_[c].set_cutoff(18.0f, sr);
    }
    for (kit::Smoother& level : rank_) level.set_time(kSmoothingSeconds, sr);
    reed_.set_time(kSmoothingSeconds, sr);
    breath_.set_time(kSmoothingSeconds, sr);
    bellows_.set_time(kSmoothingSeconds, sr);
    tremulant_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    tone_hz_.set_time(0.02f, sr / 32.0f);
    pump_phase_[0] = 0.0f;
    pump_phase_[1] = 0.37f;
    tremulant_phase_ = 0.0f;
    clock_.reset(32);
    idle_.reset(sr, 0.1f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int note_id, float frequency, float gain) {
    using namespace organ;
    if (!(frequency == frequency)) return;  // NaN
    const float sr = sample_rate();
    frequency = kit::clamp(frequency, 16.0f, kit::min(5000.0f, 0.1f * sr));
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    // A key struck again while held: let the old voice go quickly.
    const int held = pool_.find_held(note_id);
    if (held >= 0) pool_.voices[held].env.fast_release(0.03f);

    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    voice.increment = 0.5f * frequency / sr;
    voice.celeste_increment = (frequency + celeste_beat_hz(frequency)) / sr;
    // An organ key is a valve, not a hammer: touch moves the level a little.
    voice.gain = 0.7f + 0.3f * gain;
    // Odd semitones on one side of the chest, even on the other.
    const int semitone = static_cast<int>(std::floor(kit::hz_to_midi(frequency) + 0.5f));
    kit::pan_gains((semitone & 1) != 0 ? kChestSpread : -kChestSpread, &voice.left, &voice.right);
    for (int r = 0; r < kNumRanks; ++r) {
      // The most reed this rank may have: a^n at -60 dB where n reaches Nyquist.
      const float rank_hz = 0.5f * frequency * kRankMultiple[r];
      voice.reed[r] = std::exp(-6.907755f * rank_hz / (0.5f * sr));
    }
    if (!stolen) {
      // A fresh key starts anywhere in its cycle, so stacked keys do not add
      // up in phase; a stolen voice keeps running to avoid a click.
      voice.phase = start_.uniform();
      voice.celeste_phase = start_.uniform();
    }
    voice.chiff = 1.0f;
    voice.chiff_coeff = std::exp(-6.907755f / (kChiffSeconds * sr));
    voice.puff.reset();
    voice.puff.set(kit::clamp(3.0f * frequency, 500.0f, 0.3f * sr), 3.0f, sr);
    voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
    voice.env.gate_on();
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held >= 0) pool_.voices[held].env.gate_off();
  }

  void process(int frames) {
    using namespace organ;
    frames = begin_block(frames);
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    const float sr = sample_rate();
    const float pump_increment = kBellowsHz / sr;
    const float tremulant_increment = kTremulantHz / sr;
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) control(sr);

      // Wind pressure: the pump (two sines that never quite repeat) and the
      // tremulant.
      const float pump = 0.72f * kit::SineTable::lookup(pump_phase_[0]) +
                         0.28f * kit::SineTable::lookup(pump_phase_[1]);
      const float pressure = 1.0f + bellows_.next() * kBellowsDepth * pump +
                             tremulant_.next() * kTremulantDepth * kit::SineTable::lookup(tremulant_phase_);
      const float pitch = 1.0f + (pressure - 1.0f) * kPitchPerPressure;
      pump_phase_[0] = wrap(pump_phase_[0] + pump_increment);
      pump_phase_[1] = wrap(pump_phase_[1] + pump_increment * kPumpSecondRatio);
      tremulant_phase_ = wrap(tremulant_phase_ + tremulant_increment);

      float level[kNumRanks];
      level[0] = rank_[0].next();
      level[1] = 1.0f;
      level[2] = rank_[1].next();
      level[3] = rank_[2].next();
      level[4] = rank_[3].next();
      const float celeste = rank_[4].next();
      const float reed = reed_.next();
      const float breath = breath_.next();
      // Drawing every stop adds 2 dB, not 8.
      const float registration =
          1.0f / std::sqrt(1.0f + 0.5f * (level[0] * level[0] + level[2] * level[2] + level[3] * level[3] +
                                          level[4] * level[4] + celeste * celeste));

      float left = 0.0f, right = 0.0f, speaking = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.env.active()) continue;
        const float envelope = voice.env.next();
        speaking += envelope;
        // sin and cos of the 16' phase, then of 2, 4, 6 and 8 times it.
        float sine[kNumRanks], cosine[kNumRanks];
        sine[0] = kit::SineTable::lookup(voice.phase);
        cosine[0] = kit::SineTable::cos_lookup(voice.phase);
        sine[1] = 2.0f * sine[0] * cosine[0];
        cosine[1] = 1.0f - 2.0f * sine[0] * sine[0];
        sine[2] = 2.0f * sine[1] * cosine[1];
        cosine[2] = 1.0f - 2.0f * sine[1] * sine[1];
        sine[3] = sine[2] * cosine[1] + cosine[2] * sine[1];
        cosine[3] = cosine[2] * cosine[1] - sine[2] * sine[1];
        sine[4] = 2.0f * sine[2] * cosine[2];
        cosine[4] = 1.0f - 2.0f * sine[2] * sine[2];
        float pipes = 0.0f;
        for (int r = 0; r < kNumRanks; ++r) {
          if (level[r] == 0.0f) continue;
          pipes += level[r] * rank(sine[r], cosine[r], kit::min(reed, voice.reed[r]));
        }
        const float amount = envelope * voice.gain * registration;
        float own = pipes * amount;
        if (voice.chiff > 0.0f) {
          own += voice.puff.bandpass(puff_.bipolar()) * voice.chiff * breath * kChiffLevel * voice.gain;
          voice.chiff *= voice.chiff_coeff;
          if (voice.chiff < 1.0e-4f) voice.chiff = 0.0f;
        }
        left += own * voice.left;
        right += own * voice.right;
        if (celeste != 0.0f) {
          // The celeste stands on the other side.
          const float other = celeste * amount *
                              rank(kit::SineTable::lookup(voice.celeste_phase),
                                   kit::SineTable::cos_lookup(voice.celeste_phase),
                                   kit::min(reed, voice.reed[1]));
          left += other * voice.right;
          right += other * voice.left;
        }
        voice.phase = wrap(voice.phase + voice.increment * pitch);
        voice.celeste_phase = wrap(voice.celeste_phase + voice.celeste_increment * pitch);
      }

      // Wind: band-limited noise that follows the keys held, per channel.
      const float air = breath * kWindLevel * std::sqrt(kit::min(speaking, 1.0f));
      float out[2] = {left * kVoiceGain, right * kVoiceGain};
      const float volume = volume_.next();
      for (int c = 0; c < 2; ++c) {
        const float hiss = wind_low_[c].highpass(wind_high_[c].lowpass(wind_[c].pink()));
        const float mixed = (out[c] + air * hiss) * pressure;
        out[c] = kit::soft_clip(rumble_[c].highpass(tone_[c].lowpass(mixed)) * volume);
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kNumRanks = 5;
  // 16', 8', 4', 2 2/3', 2' as multiples of the 16' phase.
  static constexpr float kRankMultiple[kNumRanks] = {1.0f, 2.0f, 4.0f, 6.0f, 8.0f};
  static constexpr float kChestSpread = 0.2f;
  static constexpr float kPumpSecondRatio = 0.6180340f;
  static constexpr float kChiffSeconds = 0.25f;
  static constexpr float kChiffLevel = 5.0f;
  static constexpr float kWindLevel = 0.12f;
  // One key at gain 0.7 peaks near -22 dBFS at the default volume, and ten
  // held keys stay under the soft clip's knee.
  static constexpr float kVoiceGain = 0.19f;

  struct Voice {
    kit::Adsr env;
    kit::Svf puff;
    float phase = 0.0f;  // of the 16' rank
    float celeste_phase = 0.0f;
    float increment = 0.0f;
    float celeste_increment = 0.0f;
    float reed[kNumRanks] = {0.0f, 0.0f, 0.0f, 0.0f, 0.0f};
    float gain = 0.0f;
    float left = 0.7071f, right = 0.7071f;
    float chiff = 0.0f, chiff_coeff = 0.0f;

    bool active() const { return env.active(); }
    bool releasing() const { return env.releasing(); }
    float level() const { return env.level(); }
  };

  static float wrap(float phase) { return phase >= 1.0f ? phase - 1.0f : phase; }

  // One rank from the sine and cosine of its phase: the harmonic series with
  // ratio `a` between neighbours, at constant power (the series has power
  // 1 / (2 (1 - a²)); the polynomial is sqrt(1 - a²) to 1 % for a < 0.75).
  static float rank(float sine, float cosine, float a) {
    const float a2 = a * a;
    const float power = 1.0f - a2 * (0.5f + a2 * (0.125f + 0.0625f * a2));
    return sine * power / (1.0f - 2.0f * a * cosine + a2);
  }

  // Every 32 samples: envelope times of the sounding keys and the tone filter.
  void control(float sr) {
    using namespace organ;
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (voice.env.active()) voice.env.set(param(kAttack), 0.01f, 1.0f, param(kRelease));
    }
    const float hz = tone_hz_.next();
    tone_[0].set(hz, 0.6f, sr);
    tone_[1].set(hz, 0.6f, sr);
  }

  void apply(int id) {
    using namespace organ;
    const float value = param(id);
    switch (id) {
      case kSub:
        rank_[0].set(value, primed());
        break;
      case kOctave:
        rank_[1].set(value, primed());
        break;
      case kTwelfth:
        rank_[2].set(value, primed());
        break;
      case kFifteenth:
        rank_[3].set(value, primed());
        break;
      case kCeleste:
        rank_[4].set(value, primed());
        break;
      case kReed:
        reed_.set(value * kReedMost, primed());
        break;
      case kBreath:
        breath_.set(value, primed());
        break;
      case kBellows:
        bellows_.set(value, primed());
        break;
      case kTremulant:
        tremulant_.set(value, primed());
        break;
      case kTone:
        tone_hz_.set(value, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // Attack and Release are read on the control clock
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Svf tone_[2];
  kit::OnePole rumble_[2];
  kit::Noise wind_[2];
  kit::OnePole wind_low_[2], wind_high_[2];
  kit::Rng start_, puff_;
  // Sub, Octave, Twelfth, Fifteenth, Celeste.
  kit::Smoother rank_[5];
  kit::Smoother reed_, breath_, bellows_, tremulant_, volume_, tone_hz_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float pump_phase_[2] = {0.0f, 0.37f};
  float tremulant_phase_ = 0.0f;
};

}  // namespace livemix
