#pragma once

// Handpan: a hand-played steel pan and tongue drum by modal synthesis.
//
//   key down ─► contact window ─┬─► note: fundamental, octave, twelfth ─┬─► pan by key ─┐
//   (1.5 to 6 ms)               │         and two weak shell modes      │               │
//                               │              ▲        ▲               │               ├─► volume ─► soft clip ─► out
//                               │   bloom ─────┘        └──── shell bus (all notes)     │
//                               ├─► air cavity, 80 Hz (shared) ─────────────────────────┤
//                               └─► skin tick: a breath of band-passed noise (shared) ──┘
//
// - A mode is one complex number turned and shrunk a little every sample
//   (z' = r·e^jw·z), the sound its imaginary part, as in Bells: frequency
//   and decay can change under a ringing note without a click, and it stays
//   in tune at low pitches in single precision.
// - A note field is hammered until its three lowest modes sit at 1 : 2 : 3.
//   `shimmer` moves the octave and the twelfth a few cents off, by an amount
//   and direction that belong to the key, so the three drift in phase and
//   the colour of the note turns slowly. The offset is capped in hertz so
//   the turn stays slow at the top of the keyboard.
// - A tap is a hand, not a mallet: its contact time does not follow the
//   pitch. Each mode is fed its own phasor through a raised-cosine window as
//   long as the contact, so it arrives at exactly its level with an S-shaped
//   rise and nothing above it. (A pulse through the modes would put the
//   nulls of its spectrum on the keyboard: 333 Hz for 6 ms.) `touch` sets
//   what a harder hand changes: a shorter contact, more octave, twelfth and
//   shell modes, a louder tick of skin noise and a deeper bloom.
// - Bloom: for about 15 ms after the tap the octave is fed the square of
//   the fundamental's phasor and the twelfth its cube. A phasor squared is a
//   phasor at twice the frequency and nothing else, so the push is in tune,
//   in phase with the tap and band-limited, and it grows with amplitude: a
//   hard strike brightens just after the hit, a soft one does not. It stops
//   growing at the size of the hardest single tap.
// - `position` is where the hand lands: the octave and the twelfth each have
//   a nodal line through the middle of the note, at right angles, so they
//   come up toward the edge, and not by the same amount.
// - The shell: after the turn, every tuned mode of every ringing note adds
//   a·S, where S is the sum of all of them and a = (e^jφ − 1) / 36. The map
//   I + a·u·uᴴ has its one moving eigenvalue on the chord from 1 to e^jφ, so
//   it can never add energy, whatever the knob and however many notes. Modes
//   at different frequencies average out; modes at the same frequency trade
//   energy, a quarter turn apart (so two of them never cancel in mono). A
//   tap on D4 sets the octave of a ringing D3 going and leaves an E4 alone.
//   A mode's own share of S is a known phase advance per sample, taken out
//   of its turn, so `sympathy` does not move the pitch.
// - The cavity is one more mode at 80 Hz with a Q of 8, fed the contact
//   pulse of every tap: the short low thump of the air in the shell.
// - Notes alternate sides going up the keyboard, as the note fields do
//   around the shell; both sides keep the same sign.
// - A key struck again while its note rings strikes the same modes. A
//   released note rings on unless `damp` lays a hand on it.
//
// The tongue drum is the same engine with other levels: a weak octave and
// the second mode of a clamped tongue at 6.27 times the note.
//
// The instrument sleeps when every mode has rung out below -120 dB.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Handpan : public kit::DeviceBase<handpan::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kModes = 5;  // a note: three tuned modes, then two shell modes
  static constexpr int kTuned = 3;  // the ones on the shell bus
  enum Type : int { kPan = 0, kTongue, kNumTypes };

  void init(float sample_rate) {
    using namespace handpan;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) pool_.voices[v] = Voice();
    serial_ = 1;
    couple();
    steal_step_ = 1.0f / (kStealSeconds * sr);
    bloom_coeff_ = std::exp(-1.0f / (kBloomSeconds * sr));
    const float cavity_w = kit::kTwoPi * kCavityHz / sr;
    const float cavity_radius = std::exp(-kit::kPi * kCavityHz / (kCavityQ * sr));
    cavity_step_re_ = cavity_radius * std::cos(cavity_w);
    cavity_step_im_ = cavity_radius * std::sin(cavity_w);
    tick_rise_coeff_ = kit::time_to_coeff(kTickRiseSeconds, sr);
    tick_fall_coeff_ = kit::time_to_coeff(kTickFallSeconds, sr);
    tick_band_.set(kTickLowHz, kTickQ, sr);
    tick_top_.set_cutoff(kTickTopHz, sr);
    tick_noise_.seed(0x7A9D11u);
    rest();
    volume_.set_time(kSmoothingSeconds, sr);
    volume_.set(kit::db_to_gain(param(kVolume)), false);
    clock_.reset(kControl);
    idle_.reset(sr, 0.1f);
  }

  void set_param(int id, float value) {
    using namespace handpan;
    if (!store_param(id, value)) return;
    switch (id) {
      case kSympathy:
        couple();
        ++serial_;
        break;
      case kDecay:
      case kShimmer:
      case kDamp:
        ++serial_;  // ringing notes follow on the control clock
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(param(kVolume)), primed());
        break;
      default:
        break;  // type, touch, position, cavity: the next tap
    }
  }

  void note_on(int note_id, float frequency, float gain) {
    using namespace handpan;
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    const int type = type_now();
    // The same key while its note still rings: tap those modes again.
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.sounding || voice.pending || voice.fading || pool_.note_id_of(v) != note_id) continue;
      if (voice.type == type && voice.frequency == frequency) {
        voice.released = false;
        strike(voice, gain);
        return;
      }
      voice.released = true;
    }
    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    if (stolen) {
      // Fade the old note over 2 ms, then start (see process).
      voice.pending = true;
      voice.fading = false;
      voice.released = false;
      voice.pending_frequency = frequency;
      voice.pending_gain = gain;
    } else {
      start(voice, frequency, gain);
    }
  }

  void note_off(int note_id) {
    const int held = pool_.find_held(note_id);
    if (held < 0) return;
    Voice& voice = pool_.voices[held];
    if (voice.pending) {
      // Released before its stolen start: it never sounds.
      voice.pending = false;
      voice.fading = true;
    }
    voice.released = true;
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (idle_.asleep()) clock_.reset(kControl);  // the control clock restarts with the sound
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);
    for (int i = 0; i < frames; ++i) {
      if (clock_.tick()) control();

      // Turn every mode, let the taps and blooms in, and gather the shell bus.
      float bus_re = 0.0f, bus_im = 0.0f, pulse = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (voice.sounding) turn(voice, &bus_re, &bus_im, &pulse);
      }
      const float push_re = alpha_re_ * bus_re - alpha_im_ * bus_im;
      const float push_im = alpha_re_ * bus_im + alpha_im_ * bus_re;

      float left = 0.0f, right = 0.0f;
      for (int v = 0; v < kMaxVoices; ++v) {
        Voice& voice = pool_.voices[v];
        if (!voice.sounding) continue;
        float sum = voice.im[3] + voice.im[4];
        for (int k = 0; k < kTuned; ++k) {
          voice.re[k] += voice.on_bus[k] * push_re;
          voice.im[k] += voice.on_bus[k] * push_im;
          sum += voice.im[k];
        }
        if (voice.pending || voice.fading) {
          // A stolen or cancelled voice: out over 2 ms, then the new note or nothing.
          voice.steal = kit::max(voice.steal - steal_step_, 0.0f);
          sum *= voice.steal;
          if (voice.steal <= 0.0f) {
            if (voice.pending) {
              start(voice, voice.pending_frequency, voice.pending_gain);
            } else {
              retire(voice);
            }
          }
        }
        left += sum * voice.left;
        right += sum * voice.right;
      }

      // The air in the shell, and the skin of the hand.
      const float cavity_re = cavity_step_re_ * cavity_re_ - cavity_step_im_ * cavity_im_ + pulse;
      cavity_im_ = flush_denormal(cavity_step_re_ * cavity_im_ + cavity_step_im_ * cavity_re_);
      cavity_re_ = flush_denormal(cavity_re);
      float tick = 0.0f;
      if (tick_fall_ > 0.0f) {
        tick_rise_ *= tick_rise_coeff_;
        tick_fall_ *= tick_fall_coeff_;
        if (tick_fall_ < kSilence) tick_rise_ = tick_fall_ = 0.0f;
        tick = tick_top_.lowpass(tick_band_.bandpass(tick_noise_.bipolar() * (tick_fall_ - tick_rise_)));
      } else if (tick_band_.ic1 != 0.0f || tick_band_.ic2 != 0.0f || tick_top_.state != 0.0f) {
        tick = tick_top_.lowpass(tick_band_.bandpass(0.0f));
      }
      const float centre = kit::kSqrtHalf * (cavity_im_ + tick);

      const float volume = kVoiceGain * volume_.next();
      out_left_[i] = kit::soft_clip((left + centre) * volume);
      out_right_[i] = kit::soft_clip((right + centre) * volume);
    }
    idle_.settle(output_peak(frames), frames);
    if (idle_.asleep()) rest();  // wake from the same state whatever the block size was
  }

 private:
  static constexpr int kControl = 32;  // control period, samples
  static constexpr float kMinHz = 20.0f;
  static constexpr float kMaxHz = 8000.0f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kTopOfBand = 0.45f;        // modes above this share of the sample rate do not exist
  static constexpr float kSoftContact = 0.006f;     // seconds, the pad of a finger
  static constexpr float kHardContact = 0.0015f;    // a knuckle
  static constexpr float kSoftTiltHz = 500.0f;      // where a soft touch starts to lose the overtones
  static constexpr float kTiltSpan = 12.0f;         // ... and a hard one, this many times higher
  static constexpr float kSoftOvertonesDb = -6.0f;  // octave and twelfth under a soft hand
  static constexpr float kHardOvertonesDb = 2.0f;   // ... and a hard one
  static constexpr float kBloomSeconds = 0.015f;
  static constexpr float kBloomOctave = 0.25f;      // of the fundamental squared, at the hardest touch
  static constexpr float kBloomTwelfth = 0.15f;     // of the fundamental cubed
  static constexpr float kShimmerCents = 8.0f;
  static constexpr float kShimmerOctaveHz = 1.6f;   // the most the octave moves
  static constexpr float kShimmerTwelfthHz = 2.2f;
  static constexpr float kShellRate = 1.2f;         // radians a second two matched modes trade at, sympathy 1
  static constexpr float kBusModes = kMaxVoices * kTuned;
  static constexpr float kCavityHz = 80.0f;
  static constexpr float kCavityQ = 8.0f;
  static constexpr float kTongueCavity = 1.4f;
  static constexpr float kSoftTick = 0.03f;         // skin noise going into its band-pass, re a full tap
  static constexpr float kHardTick = 0.28f;
  static constexpr float kTickRiseSeconds = 0.0004f;
  static constexpr float kTickFallSeconds = 0.0025f;
  static constexpr float kTickLowHz = 900.0f;       // band centre, soft touch
  static constexpr float kTickSpan = 3.0f;          // ... and hard, this many times higher
  static constexpr float kTickQ = 1.2f;
  static constexpr float kTickTopHz = 3500.0f;
  static constexpr float kDampSeconds = 0.18f;      // ring time of a released note, damp 1
  static constexpr float kStealSeconds = 0.002f;
  static constexpr float kLean = 0.25f;             // how far a note sits to its side
  static constexpr float kVoiceGain = 0.32f;        // one note at gain 0.8 peaks near -18 dBFS at the default volume
  static constexpr float kSilence = 1.0e-6f;

  struct Voice {
    // Per mode: the unit turn per sample, the turn with its radius, the
    // state, what the tap in progress puts in and that tap's own phasor.
    float turn_re[kModes] = {}, turn_im[kModes] = {};
    float step_re[kModes] = {}, step_im[kModes] = {};
    float re[kModes] = {}, im[kModes] = {};
    float amount[kModes] = {};
    float tap_re[kModes] = {}, tap_im[kModes] = {};
    float on_bus[kTuned] = {};  // 1 when the mode exists
    float frequency = 440.0f;
    float left = kit::kSqrtHalf, right = kit::kSqrtHalf;
    float tap = 1.0f, tap_step = 0.0f;  // the contact window: phase 0..1
    float thump = 0.0f;                 // what this tap sends to the cavity
    float bloom = 0.0f, bloom_octave = 0.0f, bloom_twelfth = 0.0f;
    float bend_octave = 0.0f, bend_twelfth = 0.0f;  // the key's own share of shimmer, -1..1
    float follow = 0.0f;
    float steal = 1.0f;
    float pending_frequency = 440.0f, pending_gain = 0.0f;
    uint32_t tuned = 0;  // the serial these modes were last set from
    int type = kPan;
    bool tuned_released = false;
    bool sounding = false, released = false, pending = false, fading = false;

    bool active() const { return sounding; }
    bool releasing() const { return released; }
    float level() const { return follow; }
  };

  // The Type knob as a note started now would take it.
  int type_now() const {
    return kit::clamp_int(static_cast<int>(param(handpan::kType) + 0.5f), 0, kNumTypes - 1);
  }

  // One sample of one note: turn the modes, add the tap and the bloom, and
  // put the tuned modes on the bus.
  void turn(Voice& voice, float* bus_re, float* bus_im, float* pulse) {
    for (int k = 0; k < kModes; ++k) {
      const float turned = voice.step_re[k] * voice.re[k] - voice.step_im[k] * voice.im[k];
      voice.im[k] = voice.step_re[k] * voice.im[k] + voice.step_im[k] * voice.re[k];
      voice.re[k] = turned;
    }
    if (voice.tap < 1.0f) {
      // Unit area whatever the length, so a mode ends up with its amount.
      const float window =
          voice.tap_step * (1.0f - kit::SineTable::cos_lookup(voice.tap + 0.5f * voice.tap_step));
      for (int k = 0; k < kModes; ++k) {
        voice.re[k] += voice.amount[k] * window * voice.tap_re[k];
        voice.im[k] += voice.amount[k] * window * voice.tap_im[k];
        const float next = voice.turn_re[k] * voice.tap_re[k] - voice.turn_im[k] * voice.tap_im[k];
        voice.tap_im[k] = voice.turn_re[k] * voice.tap_im[k] + voice.turn_im[k] * voice.tap_re[k];
        voice.tap_re[k] = next;
      }
      *pulse += voice.thump * window;
      voice.tap += voice.tap_step;
    }
    if (voice.bloom > 0.0f) {
      // The fundamental's phasor, held to the size of the hardest single tap:
      // a key struck again and again in phase piles the note up, and its
      // square and cube would run away with it.
      float re = voice.re[0], im = voice.im[0];
      const float power = re * re + im * im;
      if (power > 1.0f) {
        const float scale = 1.0f / std::sqrt(power);
        re *= scale;
        im *= scale;
      }
      const float square_re = re * re - im * im;
      const float square_im = 2.0f * re * im;
      const float octave = voice.bloom * voice.bloom_octave;
      voice.re[1] += octave * square_re;
      voice.im[1] += octave * square_im;
      const float twelfth = voice.bloom * voice.bloom_twelfth;
      voice.re[2] += twelfth * (square_re * re - square_im * im);
      voice.im[2] += twelfth * (square_re * im + square_im * re);
      voice.bloom *= bloom_coeff_;
      if (voice.bloom < kSilence) voice.bloom = 0.0f;
    }
    for (int k = 0; k < kTuned; ++k) {
      *bus_re += voice.on_bus[k] * voice.re[k];
      *bus_im += voice.on_bus[k] * voice.im[k];
    }
  }

  void start(Voice& voice, float frequency, float gain) {
    voice.type = type_now();
    voice.frequency = frequency;
    for (int k = 0; k < kModes; ++k) voice.re[k] = voice.im[k] = 0.0f;
    voice.sounding = true;
    voice.released = voice.pending = voice.fading = false;
    voice.steal = 1.0f;
    voice.follow = 0.0f;
    voice.bloom = 0.0f;
    // The key decides the side it sits on and which way its overtones lean.
    const int key = static_cast<int>(std::floor(kit::hz_to_midi(frequency) + 0.5f));
    kit::pan_gains((key & 1) ? kLean : -kLean, &voice.left, &voice.right);
    kit::Rng hash;
    hash.seed(0x9E3779B9u ^ (static_cast<uint32_t>(key + 1024) * 2246822519u));
    hash.next_u32();
    hash.next_u32();
    voice.bend_octave = (0.5f + 0.5f * hash.uniform()) * (hash.uniform() < 0.5f ? -1.0f : 1.0f);
    voice.bend_twelfth = (0.5f + 0.5f * hash.uniform()) * (hash.uniform() < 0.5f ? -1.0f : 1.0f);
    tune(voice);
    strike(voice, gain);
  }

  // The hand meets the note: how much each mode gets, over how long.
  void strike(Voice& voice, float gain) {
    using namespace handpan;
    const float sr = sample_rate();
    const bool tongue = voice.type == kTongue;
    const float position = param(kPosition);
    // Hitting harder is also hitting harder-handed.
    const float touch = kit::clamp(param(kTouch) + 0.4f * (gain - 0.6f), 0.0f, 1.0f);
    const float strength = gain * (0.3f + 0.7f * gain);

    // Levels by where the hand lands, in dB under the fundamental at the
    // centre and at the edge; the two overtones climb on different curves.
    // A harder hand brings both up, and wakes the shell.
    const float hard = kit::db_to_gain(kSoftOvertonesDb + (kHardOvertonesDb - kSoftOvertonesDb) * touch);
    float level[kModes];
    level[0] = 1.0f - 0.25f * position * position;
    if (tongue) {
      level[1] = hard * kit::db_to_gain(-25.0f + 11.0f * std::pow(position, 0.8f));
      level[2] = hard * kit::db_to_gain(-30.0f + 12.0f * std::pow(position, 1.4f));
      level[3] = level[4] = 0.0f;
    } else {
      level[1] = hard * kit::db_to_gain(-18.0f + 18.0f * std::pow(position, 0.8f));
      level[2] = hard * kit::db_to_gain(-21.0f + 20.0f * std::pow(position, 1.4f));
      level[3] = 0.080f * touch * touch;  // the shell answers only a hard hand
      level[4] = 0.056f * touch * touch;
    }
    // A soft hand loses the overtones above its corner; the fundamental is
    // the reference, so the note is as loud whatever the touch.
    const float corner = kSoftTiltHz * std::pow(kTiltSpan, touch);
    const float base = 1.0f + (voice.frequency / corner) * (voice.frequency / corner);
    for (int k = 0; k < kModes; ++k) {
      const float hz = voice.frequency * ratio(voice.type, k);
      const float tilt = base / (1.0f + (hz / corner) * (hz / corner));
      voice.amount[k] = voice.step_re[k] == 0.0f && voice.step_im[k] == 0.0f ? 0.0f : strength * level[k] * tilt;
      voice.tap_re[k] = 1.0f;
      voice.tap_im[k] = 0.0f;
    }

    const float contact = kSoftContact * std::pow(kHardContact / kSoftContact, touch);
    voice.tap = 0.0f;
    voice.tap_step = 1.0f / kit::max(2.0f, contact * sr);

    // Bloom: the sums of its feed are k·a² and k·a³ for a fundamental of a.
    const float depth = (0.1f + 0.9f * touch * std::sqrt(touch)) * (tongue ? 0.3f : 1.0f);
    voice.bloom = 1.0f - bloom_coeff_;
    voice.bloom_octave = voice.amount[1] > 0.0f ? depth * kBloomOctave : 0.0f;
    voice.bloom_twelfth = voice.amount[2] > 0.0f && !tongue ? depth * kBloomTwelfth : 0.0f;

    voice.thump = strength * param(kCavity) * (tongue ? kTongueCavity : 1.0f);

    const float skin = strength * (kSoftTick + (kHardTick - kSoftTick) * touch * touch) * (tongue ? 0.3f : 1.0f);
    tick_rise_ += skin;
    tick_fall_ += skin;
    tick_band_.set(kTickLowHz * std::pow(kTickSpan, touch), kTickQ, sr);

    voice.follow = kit::max(voice.follow, strength);  // not free before it sounds
  }

  // A mode's frequency as a multiple of the note's, before shimmer.
  static float ratio(int type, int k) {
    static constexpr float kRatios[kNumTypes][kModes] = {
        {1.0f, 2.0f, 3.0f, 4.2f, 5.6f},   // the note field, then two shell modes
        {1.0f, 2.0f, 6.27f, 0.0f, 0.0f},  // a clamped tongue: its second mode is the ping
    };
    return kRatios[type][k];
  }

  // Frequency and decay of every mode from the knobs as they stand.
  void tune(Voice& voice) {
    using namespace handpan;
    static constexpr float kRing[kNumTypes][kModes] = {
        {1.0f, 0.8f, 0.6f, 0.15f, 0.15f},
        {1.0f, 0.7f, 0.2f, 0.0f, 0.0f},
    };
    const float sr = sample_rate();
    const float decay = param(kDecay);
    const float shimmer = param(kShimmer);
    // A released key with a hand on it: no mode rings longer than this.
    const float damp = param(kDamp);
    const float limit =
        voice.released && damp > 0.001f ? kDampSeconds * std::pow(decay / kDampSeconds, 1.0f - damp) : 0.0f;
    for (int k = 0; k < kModes; ++k) {
      float hz = voice.frequency * ratio(voice.type, k);
      if (k == 1 || (k == 2 && voice.type == kPan)) {
        const float bend = k == 1 ? voice.bend_octave : voice.bend_twelfth;
        const float most = shimmer * (k == 1 ? kShimmerOctaveHz : kShimmerTwelfthHz);
        const float offset = hz * (kit::cents_to_ratio(kShimmerCents * shimmer * bend) - 1.0f);
        hz += kit::clamp(offset, -most, most);
      }
      const bool exists = kRing[voice.type][k] > 0.0f && hz < kTopOfBand * sr;
      if (k < kTuned) voice.on_bus[k] = exists ? 1.0f : 0.0f;
      if (!exists) {
        voice.turn_re[k] = voice.turn_im[k] = voice.step_re[k] = voice.step_im[k] = 0.0f;
        voice.re[k] = voice.im[k] = 0.0f;
        continue;
      }
      float seconds = decay * kRing[voice.type][k];
      if (limit > 0.0f) seconds = kit::min(seconds, limit);
      // A mode on the bus is advanced by its own share of it: take that out.
      const float w = kit::kTwoPi * hz / sr - (k < kTuned ? alpha_im_ : 0.0f);
      const float radius = std::exp(-kSixtyDb / (seconds * sr));
      voice.turn_re[k] = std::cos(w);
      voice.turn_im[k] = std::sin(w);
      voice.step_re[k] = radius * voice.turn_re[k];
      voice.step_im[k] = radius * voice.turn_im[k];
    }
    voice.tuned = serial_;
    voice.tuned_released = voice.released;
  }

  // Every kControl samples: follow the knobs, retire the notes that have
  // rung out.
  void control() {
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.sounding || voice.pending || voice.fading) continue;
      if (voice.tuned != serial_ || voice.tuned_released != voice.released) tune(voice);
      float energy = 0.0f;
      for (int k = 0; k < kModes; ++k) {
        const float power = voice.re[k] * voice.re[k] + voice.im[k] * voice.im[k];
        if (power < 1.0e-24f) voice.re[k] = voice.im[k] = 0.0f;
        energy += power;
      }
      if (voice.tap < 1.0f) continue;  // still being struck: its level is the tap's
      voice.follow = std::sqrt(energy);
      if (voice.follow < kSilence) retire(voice);
    }
  }

  // The bus's push, a = (e^jφ − 1) / 36, with φ from the rate two matched
  // modes should trade at. Ringing notes take their share of it out of
  // their turn on the next control tick.
  void couple() {
    const float sympathy = param(handpan::kSympathy);
    const double phi = static_cast<double>(kShellRate * sympathy * sympathy * kBusModes / sample_rate());
    const double half = std::sin(0.5 * phi);
    alpha_re_ = static_cast<float>(-2.0 * half * half / kBusModes);
    alpha_im_ = static_cast<float>(std::sin(phi) / kBusModes);
  }

  void retire(Voice& voice) {
    voice.sounding = voice.pending = voice.fading = false;
    voice.follow = 0.0f;
    voice.bloom = 0.0f;
    voice.tap = 1.0f;
    for (int k = 0; k < kModes; ++k) voice.re[k] = voice.im[k] = 0.0f;
  }

  // The shared parts at rest.
  void rest() {
    cavity_re_ = cavity_im_ = 0.0f;
    tick_rise_ = tick_fall_ = 0.0f;
    tick_band_.reset();
    tick_top_.reset();
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Smoother volume_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  kit::Svf tick_band_;
  kit::OnePole tick_top_;
  kit::Rng tick_noise_;
  uint32_t serial_ = 1;
  float alpha_re_ = 0.0f, alpha_im_ = 0.0f;
  float cavity_step_re_ = 0.0f, cavity_step_im_ = 0.0f;
  float cavity_re_ = 0.0f, cavity_im_ = 0.0f;
  float tick_rise_ = 0.0f, tick_fall_ = 0.0f;
  float tick_rise_coeff_ = 0.0f, tick_fall_coeff_ = 0.0f;
  float bloom_coeff_ = 0.0f;
  float steal_step_ = 0.0f;
};

}  // namespace livemix
