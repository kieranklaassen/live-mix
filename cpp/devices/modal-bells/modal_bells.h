#pragma once

// Bells: struck and rubbed metal, glass and wood by modal synthesis.
//
//   key down ─► mallet pulse ──┐                    ┌─► pan ─► left
//                              ├─► modes (up to 16) ┤
//   key held ─► rub (sustain) ─┘   ring and decay   └─► pan ─► right
//
//   all notes ─► volume ─► soft clip ─► out
//
// - A mode is one complex number turned and shrunk a little every sample
//   (z' = r·e^jw·z): its angle is the phase, its length the amplitude. That
//   costs twice a two-pole resonator, and buys three things used here: the
//   amplitude is there to read, so rubbing can hold a mode at a level by
//   making r slightly more than 1 until it gets there; frequency and decay
//   can change under a ringing note without a click; and it stays in tune
//   and stable down to 20 Hz in single precision.
// - The mallet is a raised-cosine pulse whose length is a share of the
//   note's period (most of a period for a soft mallet, a few hundredths for
//   a hard one) and shortens with velocity, so the same mallet lights the
//   same partials on every key. A little noise rides on it so no mode sits
//   in a null of the pulse.
// - `position` weights each mode by its shape at the strike point. For bars
//   and the kalimba tine these are the bending shapes of a free and a
//   clamped bar without their end corrections; for the plate, modes with
//   nodal diameters vanish toward the centre. For bells, bowls and glasses
//   it is a voicing (striking further from the rim thins the upper modes).
// - Round things ring in pairs: each doublet is two modes `detune` Hz apart
//   (wider for the upper pairs), one in the middle and one moved by `spread`
//   to a side and on into opposite polarity, so the beat turns between the
//   speakers (see gains()).
// - Decay is the lowest mode's ring time; every other mode's decay rate is
//   that times 1 + d·(its ratio to the lowest - 1), d from 0.02 (metal) to
//   2 (wood) with `damping`.
// - Rubbing (`sustain`) makes the low modes grow toward a level while the
//   key is down, and fades the mallet out as it comes up.
// - A key struck again while its note still rings strikes the same modes
//   again, as a mallet would, instead of starting a second copy.
//
// Mode ratios: church bell, the classic minor-third tuning; singing bowl,
// after Inacio, Henrique and Antunes's measurements; vibraphone, the tuned
// 1 : 4 : 10 bar (upper two about); bar and kalimba, the free and the
// clamped Euler-Bernoulli bar; glass, Rossing's wineglass; gong, the free
// circular plate (Leissa).
//
// The instrument sleeps when every mode has rung out below -120 dB.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class ModalBells : public kit::DeviceBase<modal_bells::kNumParams> {
 public:
  static constexpr int kMaxVoices = 12;
  static constexpr int kSlots = 16;
  enum Material : int { kBell = 0, kBowl, kVibraphone, kBar, kKalimba, kGlass, kGong, kNumMaterials };

  void init(float sample_rate) {
    using namespace modal_bells;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    pool_.reset();
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      voice = Voice();
      voice.rng.seed(0xBE115u + 7919u * static_cast<uint32_t>(v));
    }
    tuning_serial_ = gain_serial_ = 1;
    chunk_left_ = 0;
    pump_step_ = 1.0f / (kRubSeconds * sr);
    steal_step_ = 1.0f / (0.002f * sr);
    volume_.set_time(0.02f, sr);
    volume_.set(kit::db_to_gain(param(kVolume)), false);
    idle_.reset(sr, 0.1f);
  }

  void set_param(int id, float value) {
    using namespace modal_bells;
    if (!store_param(id, value)) return;
    switch (id) {
      case kDecay:
      case kDamping:
      case kDetune:
      case kStretch:
      case kRelease:
        ++tuning_serial_;
        break;
      case kBrightness:
      case kSpread:
        ++gain_serial_;
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(param(kVolume)), primed());
        break;
      default:
        break;  // material, hardness, position: the next strike; sustain: read every tick
    }
  }

  void note_on(int note_id, float frequency, float gain) {
    using namespace modal_bells;
    if (!(frequency == frequency)) return;  // NaN
    frequency = kit::clamp(frequency, kMinHz, kMaxHz);
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    const int material = static_cast<int>(param(kMaterial) + 0.5f);
    // The same key while its note still rings: strike those modes again.
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.sounding || voice.pending || voice.fading || pool_.note_id_of(v) != note_id) continue;
      if (voice.material == material && voice.frequency == frequency) {
        voice.released = false;
        strike(voice, gain);
        return;
      }
      voice.released = true;
    }
    bool stolen = false;
    Voice& voice = pool_.voices[pool_.note_on(note_id, &stolen)];
    if (stolen) {
      // Fade the old note over 2 ms, then start (see render_voice).
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
    if (idle_.asleep()) chunk_left_ = 0;  // the control clock restarts with the sound
    if (!idle_.wake(pool_.count_active() > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);
    int done = 0;
    while (done < frames) {
      if (chunk_left_ == 0) {
        control();
        chunk_left_ = kChunk;
      }
      const int n = kit::clamp_int(frames - done, 1, chunk_left_);
      float left[kChunk] = {}, right[kChunk] = {};
      for (int v = 0; v < kMaxVoices; ++v) {
        if (pool_.voices[v].sounding) render_voice(pool_.voices[v], n, left, right);
      }
      for (int i = 0; i < n; ++i) {
        const float volume = volume_.next();
        out_left_[done + i] = kit::soft_clip(left[i] * volume);
        out_right_[done + i] = kit::soft_clip(right[i] * volume);
      }
      chunk_left_ -= n;
      done += n;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kChunk = 32;  // control period, samples
  static constexpr float kMinHz = 20.0f;
  static constexpr float kMaxHz = 8000.0f;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kTopOfBand = 0.45f;     // modes above this share of the sample rate are dropped
  static constexpr float kSoftPulse = 0.9f;      // mallet contact, periods of the note
  static constexpr float kHardPulse = 0.03f;
  static constexpr float kLongestPulse = 0.008f; // seconds
  static constexpr float kPulseNoise = 0.5f;
  static constexpr float kLeastDamping = 0.02f;  // extra decay rate per unit of frequency ratio, metal
  static constexpr float kDampingSpan = 100.0f;  // ... times this for wood
  static constexpr float kChokeSeconds = 0.1f;   // release 1
  static constexpr float kChokeSpan = 400.0f;    // release near 0 rings this many times longer
  static constexpr float kRubSeconds = 0.3f;     // how fast rubbing closes on its level
  static constexpr float kRubLevel = 0.4f;
  static constexpr float kStrikeLevel = 0.6f;
  static constexpr float kFarSide = 0.8f;         // how far past its side a doublet's second half goes
  static constexpr float kTilt = 1.5f;           // brightness: +-0.75 as a power of the frequency ratio
  static constexpr float kSilence = 1.0e-6f;

  enum Family : int { kShell, kFreeBar, kTine, kPlate };

  // `a` and `b` describe the mode's shape for `position` (see weight()).
  // `mate` is the slot's offset in units of `detune`: the two halves of a
  // doublet carry opposite signs.
  struct Mode {
    float ratio, level, a, b, mate, rub;
  };
  struct Table {
    int family;
    int count;
    float gain;  // evens out how loud a strike is across materials
    Mode modes[kSlots];
  };

  static const Table& table(int material) {
    static const Table kTables[kNumMaterials] = {
        // Church bell: hum, prime, tierce, quint, nominal, then the upper partials.
        {kShell, 16, 0.6f, {{0.5f, 0.27f, 0.0f, 0, +0.5f, 0.6f},  {0.5f, 0.18f, 0.0f, 0, -0.5f, 0.4f},
                      {1.0f, 0.36f, 0.7f, 0, +0.7f, 0.2f},  {1.0f, 0.24f, 0.7f, 0, -0.7f, 0.1f},
                      {1.2f, 0.48f, 0.5f, 0, +0.9f, 0.1f},  {1.2f, 0.32f, 0.5f, 0, -0.9f, 0.0f},
                      {1.5f, 0.25f, 2.0f, 0, 0.0f, 0.0f},   {2.0f, 0.60f, 0.3f, 0, +1.2f, 0.0f},
                      {2.0f, 0.40f, 0.3f, 0, -1.2f, 0.0f},  {2.5f, 0.35f, 1.5f, 0, 0.0f, 0.0f},
                      {3.0f, 0.33f, 1.0f, 0, +1.6f, 0.0f},  {3.0f, 0.22f, 1.0f, 0, -1.6f, 0.0f},
                      {4.0f, 0.40f, 1.3f, 0, 0.0f, 0.0f},   {5.33f, 0.20f, 1.7f, 0, 0.0f, 0.0f},
                      {6.67f, 0.12f, 2.2f, 0, 0.0f, 0.0f},  {8.0f, 0.08f, 2.6f, 0, 0.0f, 0.0f}}},
        // Singing bowl: six rim modes, each a doublet.
        {kShell, 12, 1.0f, {{1.0f, 0.60f, 0.0f, 0, +0.5f, 0.6f},   {1.0f, 0.40f, 0.0f, 0, -0.5f, 0.4f},
                      {2.77f, 0.36f, 0.6f, 0, +0.8f, 0.18f}, {2.77f, 0.24f, 0.6f, 0, -0.8f, 0.12f},
                      {5.17f, 0.21f, 1.0f, 0, +1.15f, 0.05f}, {5.17f, 0.14f, 1.0f, 0, -1.15f, 0.03f},
                      {8.14f, 0.12f, 1.4f, 0, +1.5f, 0.0f},  {8.14f, 0.08f, 1.4f, 0, -1.5f, 0.0f},
                      {11.64f, 0.06f, 1.8f, 0, +1.9f, 0.0f}, {11.64f, 0.04f, 1.8f, 0, -1.9f, 0.0f},
                      {15.6f, 0.036f, 2.2f, 0, +2.3f, 0.0f}, {15.6f, 0.024f, 2.2f, 0, -2.3f, 0.0f}}},
        // Vibraphone: the bar is cut so its modes sit at 1 : 4 : 10.
        {kFreeBar, 8, 1.0f, {{1.0f, 0.60f, 1, 0, +0.5f, 0.6f},  {1.0f, 0.40f, 1, 0, -0.5f, 0.4f},
                       {4.0f, 0.27f, 2, 0, +0.8f, 0.1f},  {4.0f, 0.18f, 2, 0, -0.8f, 0.05f},
                       {10.0f, 0.13f, 3, 0, +1.2f, 0.0f}, {10.0f, 0.09f, 3, 0, -1.2f, 0.0f},
                       {18.2f, 0.10f, 4, 0, 0.0f, 0.0f},  {28.4f, 0.05f, 5, 0, 0.0f, 0.0f}}},
        // Bar: an uncut free bar (chimes, glockenspiel, music box comb).
        {kFreeBar, 11, 1.0f, {{1.0f, 0.60f, 1, 0, +0.5f, 0.6f},   {1.0f, 0.40f, 1, 0, -0.5f, 0.4f},
                        {2.757f, 0.36f, 2, 0, +0.8f, 0.1f}, {2.757f, 0.24f, 2, 0, -0.8f, 0.05f},
                        {5.404f, 0.24f, 3, 0, +1.2f, 0.0f}, {5.404f, 0.16f, 3, 0, -1.2f, 0.0f},
                        {8.933f, 0.17f, 4, 0, +1.6f, 0.0f}, {8.933f, 0.11f, 4, 0, -1.6f, 0.0f},
                        {13.345f, 0.18f, 5, 0, 0.0f, 0.0f}, {18.64f, 0.12f, 6, 0, 0.0f, 0.0f},
                        {24.81f, 0.08f, 7, 0, 0.0f, 0.0f}}},
        // Kalimba: a tine clamped at one end.
        {kTine, 8, 1.0f, {{1.0f, 0.60f, 1, 0, +0.5f, 0.6f},   {1.0f, 0.40f, 1, 0, -0.5f, 0.4f},
                    {6.263f, 0.21f, 2, 0, +0.8f, 0.05f}, {6.263f, 0.14f, 2, 0, -0.8f, 0.0f},
                    {17.54f, 0.09f, 3, 0, +1.2f, 0.0f}, {17.54f, 0.06f, 3, 0, -1.2f, 0.0f},
                    {34.37f, 0.07f, 4, 0, 0.0f, 0.0f},  {56.82f, 0.03f, 5, 0, 0.0f, 0.0f}}},
        // Glass: the rim modes of a wineglass.
        {kShell, 10, 1.0f, {{1.0f, 0.60f, 0.0f, 0, +0.5f, 0.6f},  {1.0f, 0.40f, 0.0f, 0, -0.5f, 0.4f},
                      {2.32f, 0.24f, 0.6f, 0, +0.8f, 0.09f}, {2.32f, 0.16f, 0.6f, 0, -0.8f, 0.06f},
                      {4.25f, 0.12f, 1.0f, 0, +1.15f, 0.02f}, {4.25f, 0.08f, 1.0f, 0, -1.15f, 0.01f},
                      {6.63f, 0.06f, 1.4f, 0, +1.5f, 0.0f}, {6.63f, 0.04f, 1.4f, 0, -1.5f, 0.0f},
                      {9.38f, 0.03f, 1.8f, 0, +1.9f, 0.0f}, {9.38f, 0.02f, 1.8f, 0, -1.9f, 0.0f}}},
        // Gong: a free circular plate; a = nodal diameters, b = nodal circles.
        {kPlate, 16, 0.8f, {{1.0f, 0.60f, 2, 0, +0.5f, 0.6f},  {1.0f, 0.40f, 2, 0, -0.5f, 0.4f},
                      {1.73f, 0.80f, 0, 1, 0.0f, 0.3f},  {2.33f, 0.42f, 3, 0, +0.9f, 0.1f},
                      {2.33f, 0.28f, 3, 0, -0.9f, 0.1f}, {3.91f, 0.60f, 1, 1, 0.0f, 0.0f},
                      {4.11f, 0.55f, 4, 0, 0.0f, 0.0f},  {6.30f, 0.45f, 5, 0, 0.0f, 0.0f},
                      {6.71f, 0.27f, 2, 1, +1.4f, 0.0f}, {6.71f, 0.18f, 2, 1, -1.4f, 0.0f},
                      {7.34f, 0.40f, 0, 2, 0.0f, 0.0f},  {8.80f, 0.30f, 6, 0, 0.0f, 0.0f},
                      {10.07f, 0.30f, 3, 1, 0.0f, 0.0f}, {11.40f, 0.25f, 1, 2, 0.0f, 0.0f},
                      {13.92f, 0.20f, 4, 1, 0.0f, 0.0f}, {16.71f, 0.15f, 0, 3, 0.0f, 0.0f}}},
    };
    return kTables[kit::clamp_int(material, 0, kNumMaterials - 1)];
  }

  // The mode's displacement at the strike point; position 0 is the edge
  // (the end of a bar, the tip of a tine, the rim), 1 the middle (the
  // centre of a bar or plate, the clamp of a tine, the crown of a bell).
  static float weight(int family, float a, float b, float position) {
    switch (family) {
      case kFreeBar: {
        // Mode n of a free bar: symmetric about the middle when n is odd.
        const float angle = (a + 0.5f) * kit::kPi * (0.5f * position - 0.5f);
        return (static_cast<int>(a) & 1) ? std::cos(angle) : std::sin(angle);
      }
      case kTine:
        return std::sin((a - 0.5f) * kit::kPi * (1.0f - 0.9f * position));
      case kPlate: {
        const float radius = 1.0f - position;
        // Nodal circles near where a free plate has them (0.68 R for one),
        // with the edge an antinode.
        return std::pow(radius, 0.7f * a) * std::cos(b * kit::kPi * std::pow(radius, 1.8f));
      }
      default:
        return std::cos(a * kit::kHalfPi * position);
    }
  }

  struct Voice {
    // Per mode: the unit turn per sample, the turn with this tick's radius,
    // the state, the output gains and their ramps, and what a strike and a
    // rub put in.
    float turn_re[kSlots] = {}, turn_im[kSlots] = {};
    float step_re[kSlots] = {}, step_im[kSlots] = {};
    float re[kSlots] = {}, im[kSlots] = {};
    float left[kSlots] = {}, right[kSlots] = {};
    float left_step[kSlots] = {}, right_step[kSlots] = {};
    float left_to[kSlots] = {}, right_to[kSlots] = {};
    float radius[kSlots] = {};  // the mode's own decay per sample
    float strike[kSlots] = {};
    float rub[kSlots] = {};
    int count = 0;
    int material = 0;
    float frequency = 440.0f;
    float strength = 0.0f;      // of the last strike, for the rub level
    float pulse = 1.0f, pulse_step = 0.0f, pulse_gain = 0.0f;  // the mallet: phase 0..1
    float follow = 0.0f;
    float steal = 1.0f;
    float pending_frequency = 440.0f, pending_gain = 0.0f;
    uint32_t tuned = 0, gained = 0;  // the serials these modes were last set from
    bool tuned_released = false;
    bool ramping = false;
    bool sounding = false, released = false, pending = false, fading = false;
    kit::Rng rng;

    bool active() const { return sounding; }
    bool releasing() const { return released; }
    float level() const { return follow; }
  };

  void start(Voice& voice, float frequency, float gain) {
    using namespace modal_bells;
    voice.material = kit::clamp_int(static_cast<int>(param(kMaterial) + 0.5f), 0, kNumMaterials - 1);
    voice.frequency = frequency;
    voice.count = table(voice.material).count;
    for (int k = 0; k < kSlots; ++k) voice.re[k] = voice.im[k] = 0.0f;
    voice.sounding = true;
    voice.released = voice.pending = voice.fading = false;
    voice.steal = 1.0f;
    voice.follow = 0.0f;
    tune(voice);
    gains(voice, true);
    strike(voice, gain);
  }

  // The mallet meets the bar: weights for where it lands, a pulse for how
  // hard and how fast.
  void strike(Voice& voice, float gain) {
    using namespace modal_bells;
    const Table& modes = table(voice.material);
    const float position = param(kPosition);
    for (int k = 0; k < voice.count; ++k) {
      const Mode& mode = modes.modes[k];
      voice.strike[k] = modes.gain * mode.level * weight(modes.family, mode.a, mode.b, position);
      voice.rub[k] = mode.rub;
    }
    voice.strength = 0.25f + 0.75f * gain;
    // Squared, so the middle of the knob is a medium mallet (0.4 of a period)
    // rather than one that already rings everything.
    const float hardness = param(kHardness);
    const float periods = kSoftPulse * std::pow(kHardPulse / kSoftPulse, hardness * hardness) * (1.5f - gain);
    const float sr = sample_rate();
    const float length = kit::clamp(periods * sr / voice.frequency, 2.0f, kLongestPulse * sr);
    // Rubbing takes the mallet's place as sustain comes up.
    const float sustain = param(kSustain);
    const float hit = gain * (0.3f + 0.7f * gain) * (1.0f - 0.9f * sustain * sustain);
    voice.pulse = 0.0f;
    voice.pulse_step = 1.0f / length;
    voice.pulse_gain = kStrikeLevel * hit * 2.0f * voice.pulse_step;  // unit area whatever the length
    if (voice.follow < kSilence) voice.follow = kSilence;              // not free before it sounds
  }

  // Frequency and decay of every mode from the knobs as they stand.
  void tune(Voice& voice) {
    using namespace modal_bells;
    const Table& modes = table(voice.material);
    const float sr = sample_rate();
    const float stretch = param(kStretch);
    const float detune = param(kDetune);
    const float decay = param(kDecay);
    const float extra = kLeastDamping * std::pow(kDampingSpan, param(kDamping));
    float lowest = 1.0e9f;
    for (int k = 0; k < voice.count; ++k) lowest = kit::min(lowest, std::pow(modes.modes[k].ratio, stretch));
    // A released key damps every mode to `release` at most; 0 leaves it ringing.
    const float release = param(kRelease);
    const float limit =
        voice.released && release > 0.001f ? kChokeSeconds * std::pow(kChokeSpan, 1.0f - release) : 0.0f;
    for (int k = 0; k < voice.count; ++k) {
      const Mode& mode = modes.modes[k];
      const float ratio = std::pow(mode.ratio, stretch);
      const float hz = voice.frequency * ratio + detune * mode.mate;
      if (hz >= kTopOfBand * sr || hz < 5.0f) {
        // Out of band: the mode does not exist.
        voice.turn_re[k] = voice.turn_im[k] = voice.radius[k] = 0.0f;
        voice.step_re[k] = voice.step_im[k] = 0.0f;
        continue;
      }
      float seconds = decay / (1.0f + extra * (ratio / lowest - 1.0f));
      if (limit > 0.0f) seconds = kit::min(seconds, limit);
      const float w = kit::kTwoPi * hz / sr;
      voice.radius[k] = std::exp(-kSixtyDb / (seconds * sr));
      voice.turn_re[k] = std::cos(w);
      voice.turn_im[k] = std::sin(w);
      voice.step_re[k] = voice.radius[k] * voice.turn_re[k];
      voice.step_im[k] = voice.radius[k] * voice.turn_im[k];
    }
    voice.tuned = tuning_serial_;
    voice.tuned_released = voice.released;
  }

  // Output gain of every mode: brightness tilts them about the played note,
  // spread places them. One half of a doublet stays in the middle; the other
  // moves to a side and then past it, into opposite polarity on the far side
  // (two modes turned against each other on the rim reach two ears with
  // different signs). So left hears the sum where right hears the
  // difference, and a beating bowl turns between the speakers.
  void gains(Voice& voice, bool snap) {
    using namespace modal_bells;
    const Table& modes = table(voice.material);
    const float tilt = kTilt * (param(kBrightness) - 0.5f);
    const float spread = param(kSpread);
    const float turn = kFarSide * kit::kHalfPi * spread;
    const float near = kit::kSqrtHalf * (std::cos(turn) + std::sin(turn));
    const float far = kit::kSqrtHalf * (std::cos(turn) - std::sin(turn));
    int pairs = 0;
    for (int k = 0; k < voice.count; ++k) {
      const Mode& mode = modes.modes[k];
      float left = kit::kSqrtHalf, right = kit::kSqrtHalf;
      if (mode.mate < 0.0f) {
        // Alternate pairs lean to alternate sides.
        left = (pairs & 1) ? far : near;
        right = (pairs & 1) ? near : far;
        ++pairs;
      } else if (mode.mate == 0.0f) {
        kit::pan_gains(((k & 1) ? 0.8f : -0.8f) * spread, &left, &right);
      }
      const float level = std::pow(mode.ratio, tilt);
      voice.left_to[k] = level * left;
      voice.right_to[k] = level * right;
      if (snap) {
        voice.left[k] = voice.left_to[k];
        voice.right[k] = voice.right_to[k];
        voice.left_step[k] = voice.right_step[k] = 0.0f;
      } else {
        voice.left_step[k] = (voice.left_to[k] - voice.left[k]) * (1.0f / kChunk);
        voice.right_step[k] = (voice.right_to[k] - voice.right[k]) * (1.0f / kChunk);
      }
    }
    voice.ramping = !snap;
    voice.gained = gain_serial_;
  }

  // Every kChunk samples: follow the knobs, rub the held notes, retire the
  // dead ones.
  void control() {
    using namespace modal_bells;
    const float sustain = param(kSustain);
    for (int v = 0; v < kMaxVoices; ++v) {
      Voice& voice = pool_.voices[v];
      if (!voice.sounding || voice.pending || voice.fading) continue;
      if (voice.tuned != tuning_serial_ || voice.tuned_released != voice.released) tune(voice);
      if (voice.ramping) {
        for (int k = 0; k < voice.count; ++k) {
          voice.left[k] = voice.left_to[k];
          voice.right[k] = voice.right_to[k];
          voice.left_step[k] = voice.right_step[k] = 0.0f;
        }
        voice.ramping = false;
      }
      if (voice.gained != gain_serial_) gains(voice, false);
      // Rubbing: a mode under its level grows toward it (r a little over 1),
      // one at or over it is left to ring. The level is reached and held
      // without knowing the mode's phase, because the push is the mode itself.
      const bool rubbing = !voice.released && sustain > 0.0f;
      const float rub_level = kRubLevel * sustain * voice.strength;
      bool fed = false;
      float energy = 0.0f;
      for (int k = 0; k < voice.count; ++k) {
        const float power = voice.re[k] * voice.re[k] + voice.im[k] * voice.im[k];
        float radius = voice.radius[k];
        if (rubbing && voice.rub[k] > 0.0f && radius > 0.0f) {
          fed = true;
          const float target = voice.rub[k] * rub_level;
          float amplitude = std::sqrt(power);
          if (amplitude < target) {
            if (amplitude < 1.0e-4f * target) {
              amplitude = 1.0e-4f * target;
              voice.re[k] = amplitude;
              voice.im[k] = 0.0f;
            }
            radius = 1.0f + kit::min((target - amplitude) / amplitude, 4.0f) * pump_step_;
          }
        } else if (power < 1.0e-24f) {
          voice.re[k] = voice.im[k] = 0.0f;
        }
        voice.step_re[k] = radius * voice.turn_re[k];
        voice.step_im[k] = radius * voice.turn_im[k];
        energy += power * (voice.left_to[k] * voice.left_to[k] + voice.right_to[k] * voice.right_to[k]);
      }
      voice.follow = std::sqrt(energy);
      if (!fed && voice.pulse >= 1.0f && voice.follow < kSilence) retire(voice);
    }
  }

  void retire(Voice& voice) {
    voice.sounding = voice.pending = voice.fading = false;
    voice.follow = 0.0f;
    for (int k = 0; k < kSlots; ++k) voice.re[k] = voice.im[k] = 0.0f;
  }

  void render_voice(Voice& voice, int n, float* left, float* right) {
    const bool leaving = voice.pending || voice.fading;
    float pulse[kChunk];
    const bool struck = !leaving && voice.pulse < 1.0f;
    if (struck) {
      for (int i = 0; i < n; ++i) {
        if (voice.pulse < 1.0f) {
          const float window = 0.5f - 0.5f * kit::SineTable::cos_lookup(voice.pulse + 0.5f * voice.pulse_step);
          pulse[i] = voice.pulse_gain * window * (1.0f + kPulseNoise * voice.rng.bipolar());
          voice.pulse += voice.pulse_step;
        } else {
          pulse[i] = 0.0f;
        }
      }
    }
    float out_left[kChunk] = {}, out_right[kChunk] = {};
    for (int k = 0; k < voice.count; ++k) {
      float re = voice.re[k], im = voice.im[k];
      const float in = struck ? voice.strike[k] : 0.0f;
      if (re == 0.0f && im == 0.0f && in == 0.0f) continue;
      const float step_re = voice.step_re[k], step_im = voice.step_im[k];
      float gain_left = voice.left[k], gain_right = voice.right[k];
      const float ramp_left = voice.left_step[k], ramp_right = voice.right_step[k];
      // The push goes in on the real side and the sound is the imaginary
      // side, so a mode answers a pulse from zero, as a displacement does.
      if (struck) {
        for (int i = 0; i < n; ++i) {
          const float turned = step_re * re - step_im * im + in * pulse[i];
          im = step_re * im + step_im * re;
          re = turned;
          out_left[i] += gain_left * im;
          out_right[i] += gain_right * im;
          gain_left += ramp_left;
          gain_right += ramp_right;
        }
      } else {
        for (int i = 0; i < n; ++i) {
          const float turned = step_re * re - step_im * im;
          im = step_re * im + step_im * re;
          re = turned;
          out_left[i] += gain_left * im;
          out_right[i] += gain_right * im;
          gain_left += ramp_left;
          gain_right += ramp_right;
        }
      }
      voice.re[k] = re;
      voice.im[k] = im;
      voice.left[k] = gain_left;
      voice.right[k] = gain_right;
    }
    if (!leaving) {
      for (int i = 0; i < n; ++i) {
        left[i] += out_left[i];
        right[i] += out_right[i];
      }
      return;
    }
    // A stolen or cancelled voice: out over 2 ms, then the new note or nothing.
    for (int i = 0; i < n; ++i) {
      voice.steal = kit::max(voice.steal - steal_step_, 0.0f);
      left[i] += out_left[i] * voice.steal;
      right[i] += out_right[i] * voice.steal;
    }
    if (voice.steal <= 0.0f) {
      if (voice.pending) {
        start(voice, voice.pending_frequency, voice.pending_gain);
      } else {
        retire(voice);
      }
    }
  }

  kit::VoicePool<Voice, kMaxVoices> pool_;
  kit::Smoother volume_;
  kit::IdleGate idle_;
  uint32_t tuning_serial_ = 1, gain_serial_ = 1;
  int chunk_left_ = 0;
  float pump_step_ = 0.0f;
  float steal_step_ = 0.0f;
};

}  // namespace livemix
