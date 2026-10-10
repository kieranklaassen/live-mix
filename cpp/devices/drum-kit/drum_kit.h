#pragma once

// Drum Kit: twelve synthesized drums for quiet music, one on each key of the
// octave. Nothing is sampled: every drum is one or two sines, a noise source
// and a filter or two.
//
//   key      drum         how it is made
//   C        kick         a sine falling in pitch, a faint click
//   C#       sub          the kick's drum played soft: a slow swell, no click
//   D        snare        two short tones under band-limited noise
//   D#       brush        noise with a slow attack, duller than the snare
//   E        rim          two short high partials, a dry knock
//   F        closed hat   six detuned pulses and noise, high-passed
//   F#       shaker       a band of noise with a soft attack
//   G        open hat     the closed hat ringing; F and F# choke it
//   G#       clap         three bursts of noise and a tail
//   A        low tom      a sine with a small fall and a skin noise
//   A#       tick         two partials near 2.2 kHz, a woodblock
//   B        high tom     the tom a fifth up
//
//   note ─► key of the octave picks the drum, the octave and Tune retune it
//        ─► one of the drum's two slots ─► pan ─► drive ─► volume ─► soft clip
//
// - A hit is a one-shot; note off does nothing. Every per-hit control (Kit,
//   Tune, Length, Punch, Snap, Variation) is read when the drum is struck.
// - A drum struck again while it rings takes its other slot and the older
//   one fades in 4 ms. Drums never take each other's slots, so a pile of
//   notes is bounded at 24 slots.
// - Tone is one low-pass per slot, retuned on the control clock from the
//   smoothed knob: the top of a tonal drum, the upper edge of a noise drum.
// - Width moves each drum's place; at 0 both channels are the same sample.
//   The kick, sub, snare and brush have no place of their own: the centre.
// - Drive blends towards a saturator that gives back the level of one firm
//   kick unchanged, so quieter material comes up under the same peaks.
// - Variation draws level, tone, length, pitch and the noise itself from one
//   seeded generator at each hit. At 0 nothing is drawn into the sound and a
//   drum repeats sample for sample.
//
// The hats' and the shaker's bands move half as far as the tuning (in
// octaves), so that an octave up is still in the hearing range; everything
// else moves by the full interval.

#include "../../kit/kit.h"
#include "../../kit/keymap.h"
#include "params.gen.h"

namespace livemix {

class DrumKit : public kit::DeviceBase<drum_kit::kNumParams> {
 public:
  enum Drum : int {
    kKick = 0,
    kSub,
    kSnare,
    kBrush,
    kRim,
    kClosedHat,
    kShaker,
    kOpenHat,
    kClap,
    kLowTom,
    kTick,
    kHighTom,
    kNumDrums,
  };
  static constexpr int kSlotsPerDrum = 2;
  static constexpr int kMetalPartials = 6;

  void init(float sample_rate) {
    using namespace drum_kit;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    // White noise spreads over a wider band at a higher rate; the filters are
    // fixed in hertz, so the level per hertz is held instead.
    noise_scale_ = std::sqrt(sr / 48000.0f);
    for (int d = 0; d < kNumDrums; ++d) {
      for (int s = 0; s < kSlotsPerDrum; ++s) slots_[d][s] = Slot();
    }
    active_ = 0;
    chance_.seed(0x51F7A3C9u);
    tone_.set_time(kSmoothingSeconds, sr);
    drive_.set_time(kSmoothingSeconds, sr);
    width_.set_time(kSmoothingSeconds, sr);
    volume_.set_time(kSmoothingSeconds, sr);
    clock_.reset(kControlPeriod);
    // Nothing outlives the slots: once the last one ends the output is zero.
    idle_.reset(sr, 0.05f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    tone_seen_ = -1.0f;
    follow_tone();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void note_on(int /*note_id*/, float frequency, float gain) {
    if (!(frequency == frequency)) return;  // NaN
    if (!(gain == gain)) gain = 0.5f;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    const kit::OctaveKey key = kit::octave_key(frequency);
    // Nothing sounds, so a knob moved in the silence has arrived, and the
    // control clock starts with the hit whatever the host's block size.
    if (active_ == 0) restart();
    strike(key.key, key.semitones() + param(drum_kit::kTune), gain);
  }

  // A hit is a one-shot: letting the key go changes nothing.
  void note_off(int /*note_id*/) {}

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(active_ > 0)) {
      silence_output(frames);
      return;
    }
    clear_input(frames);  // an instrument ignores its input
    for (int i = 0; i < frames; ++i) {
      tone_.next();
      if (clock_.tick()) follow_tone();
      const float width = width_.next();
      float left = 0.0f;
      float right = 0.0f;
      if (active_ > 0) {
        for (int d = 0; d < kNumDrums; ++d) {
          for (int s = 0; s < kSlotsPerDrum; ++s) {
            Slot& slot = slots_[d][s];
            if (!slot.active) continue;
            float mid = 0.0f;
            float side = 0.0f;
            render(slot, &mid, &side);
            const float place = slot.pan * width;
            left += mid * (1.0f - place) + side * width;
            right += mid * (1.0f + place) - side * width;
          }
        }
      }
      // Drive: a blend towards a saturator whose output at the level of one
      // firm kick is that level, so the loud hits stay and the rest comes up.
      const float drive = drive_.next();
      left += drive * (kit::fast_tanh(left * kDriveGain) * kDriveMakeup - left);
      right += drive * (kit::fast_tanh(right * kDriveGain) * kDriveMakeup - right);
      const float volume = volume_.next();
      out_left_[i] = kit::soft_clip(left * volume);
      out_right_[i] = kit::soft_clip(right * volume);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kControlPeriod = 16;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kEndLevel = 1.0e-6f;      // a slot ends 120 dB down
  static constexpr float kStealSeconds = 0.004f;   // a drum struck again
  static constexpr float kChokeSeconds = 0.008f;   // an open hat closed
  static constexpr float kCarrySeconds = 0.008f;   // what a taken slot leaves
  static constexpr float kDriveGain = 6.0f;
  static constexpr float kDriveMakeup = 0.3095f;   // 0.3 / fast_tanh(0.3 * 6)

  // What a Kit choice changes, as factors on the Soft kit.
  struct Character {
    float low_pitch;    // kick and sub
    float pitch;        // snare tones and toms
    float knock;        // rim and tick
    float tonal_len;    // how long the tonal drums ring
    float noise_len;    // how long the noise drums ring
    float sweep_time;   // how slowly the pitch falls
    float sweep_depth;  // how far it falls
    float click;        // level of the clicks and skin noise
    float attack;       // length of the soft attacks
    float band;         // lower edge of the noise bands
    float edge;         // upper edge of the noise bands, top of the tonal drums
    float q;            // resonance of that upper edge
    float metal;        // level of the hats, whose band the edges squeeze
    float air;          // level of the brush and the shaker, the same way
  };

  static const Character& character(int choice) {
    static const Character table[4] = {
        // Soft
        {1.00f, 1.00f, 1.00f, 1.00f, 1.00f, 1.00f, 1.00f, 1.00f, 1.00f, 1.00f, 1.00f, 0.60f, 1.00f, 1.00f},
        // Deep: longer, lower, rounder
        {0.84f, 0.84f, 0.84f, 1.60f, 1.35f, 1.80f, 0.80f, 0.55f, 1.50f, 0.75f, 0.66f, 0.60f, 1.20f, 1.20f},
        // Tight: short, clicking, bright
        {1.12f, 1.12f, 1.15f, 0.60f, 0.60f, 0.60f, 1.20f, 1.40f, 0.50f, 1.12f, 1.50f, 0.60f, 0.85f, 0.75f},
        // Paper: no low end, narrow low bands, tones damped
        {1.90f, 1.25f, 0.80f, 0.42f, 0.42f, 0.70f, 0.50f, 1.30f, 0.80f, 0.62f, 0.50f, 1.40f, 0.70f, 1.25f},
    };
    return table[kit::clamp_int(choice, 0, 3)];
  }

  struct Slot {
    bool active = false;
    // Fade when choked or when the drum is struck again.
    float fade = 1.0f;
    float fade_step = 0.0f;
    // What the slot was putting out when it was taken for a new hit, dying
    // away in a few milliseconds so the cut is not a step.
    float carry = 0.0f;
    float carry_coeff = 0.0f;
    float last = 0.0f;
    float level = 0.0f;
    float pan = 0.0f;

    // Up to two sine partials with their own decays and a common pitch fall.
    int partials = 0;
    float phase[2] = {0.0f, 0.0f};
    float increment[2] = {0.0f, 0.0f};
    float partial_gain[2] = {0.0f, 0.0f};
    float partial_env[2] = {0.0f, 0.0f};
    float partial_coeff[2] = {0.0f, 0.0f};
    float sweep = 0.0f;
    float sweep_coeff = 0.0f;
    float attack = 1.0f;
    float attack_step = 0.0f;

    // Noise, enveloped before its filters so that they round its edges.
    kit::Rng noise;
    kit::Rng noise_side;
    float noise_gain = 0.0f;
    float noise_env = 0.0f;
    float noise_coeff = 0.0f;
    float noise_attack = 1.0f;
    float noise_attack_step = 0.0f;
    float bite = 0.0f;
    float bite_coeff = 0.0f;
    int shaping = 0;  // kNone, kHighPass, kBandPass
    kit::Svf shape;
    kit::Svf shape2;

    // The hats: six pulses at inharmonic ratios.
    bool metal = false;
    kit::BlepOsc pulse[kMetalPartials];
    float pulse_increment[kMetalPartials] = {};
    float metal_gain = 0.0f;

    // The clap: bursts still to come, each restarting the noise envelope.
    int bursts = 0;
    int burst_wait = 0;
    int burst_gap = 0;
    float tail_coeff = 0.0f;
    float side_gain = 0.0f;

    // Tone: the low-pass everything in the slot goes through.
    kit::Svf edge;
    kit::Svf edge_side;
    float cut_base = 1000.0f;
    float edge_q = 0.6f;
    bool noise_class = false;  // Tone's narrower range: the noise drums and the tick
  };

  enum Shaping : int { kNone = 0, kHighPass, kBandPass };

  float t60_coeff(float seconds) const {
    return std::exp(-kSixtyDb / kit::max(1.0f, seconds * sample_rate()));
  }
  float tau_coeff(float seconds) const {
    return std::exp(-1.0f / kit::max(1.0f, seconds * sample_rate()));
  }
  float ramp_step(float seconds) const { return 1.0f / kit::max(1.0f, seconds * sample_rate()); }

  static float smoothstep(float t) { return t * t * (3.0f - 2.0f * t); }

  void partial(Slot& slot, int index, float hz, float gain, float seconds) const {
    const float sr = sample_rate();
    slot.increment[index] = kit::clamp(hz, 12.0f, 0.2f * sr) / sr;
    slot.partial_gain[index] = gain;
    slot.partial_env[index] = 1.0f;
    slot.partial_coeff[index] = t60_coeff(seconds);
    slot.phase[index] = 0.0f;
    if (slot.partials < index + 1) slot.partials = index + 1;
  }

  void fall(Slot& slot, float depth, float seconds) const {
    // Keep the swept pitch under 0.45 of the sample rate.
    const float fastest = kit::max(slot.increment[0], slot.increment[1]);
    const float limit = fastest > 0.0f ? 0.45f / fastest - 1.0f : 0.0f;
    slot.sweep = kit::clamp(depth, 0.0f, kit::max(0.0f, limit));
    slot.sweep_coeff = tau_coeff(seconds);
  }

  void noise(Slot& slot, float gain, float seconds, float attack_seconds) const {
    slot.noise_gain = gain * noise_scale_;
    slot.noise_env = 1.0f;
    slot.noise_coeff = t60_coeff(seconds);
    slot.noise_attack = 0.0f;
    slot.noise_attack_step = ramp_step(attack_seconds);
  }

  void metal(Slot& slot, float ratio, float gain) const {
    static const float kHz[kMetalPartials] = {205.3f, 304.4f, 369.6f, 522.7f, 540.0f, 800.0f};
    const float sr = sample_rate();
    slot.metal = true;
    slot.metal_gain = gain;
    for (int k = 0; k < kMetalPartials; ++k) {
      slot.pulse_increment[k] = kit::clamp(kHz[k] * ratio, 20.0f, 0.3f * sr) / sr;
      slot.pulse[k].reset(static_cast<float>(k) * 0.137f);
    }
  }

  void begin_fade(Slot& slot, float seconds) const {
    const float step = ramp_step(seconds);
    if (slot.fade_step < step) slot.fade_step = step;
  }

  void end(Slot& slot) {
    if (slot.active) --active_;
    slot.active = false;
    slot.last = 0.0f;
  }

  // One hit. `semitones` is the tuning the octave, the cents and Tune ask for.
  void strike(int drum, float semitones, float gain) {
    using namespace drum_kit;
    const float sr = sample_rate();
    Slot* pair = slots_[drum];

    // A free slot, else the one already fading. Two sounding slots are
    // never both unfaded: the second hit fades the first.
    int take = 0;
    if (pair[0].active && (!pair[1].active || pair[1].fade_step > 0.0f)) take = 1;
    Slot& other = pair[1 - take];
    if (other.active) begin_fade(other, kStealSeconds);
    if (drum == kClosedHat || drum == kShaker) {
      for (int s = 0; s < kSlotsPerDrum; ++s) {
        if (slots_[kOpenHat][s].active) begin_fade(slots_[kOpenHat][s], kChokeSeconds);
      }
    }

    Slot& slot = pair[take];
    const float carry = slot.active ? slot.last : 0.0f;
    if (!slot.active) ++active_;
    slot = Slot();
    slot.active = true;
    slot.carry = carry;
    slot.carry_coeff = t60_coeff(kCarrySeconds);

    // What this hit draws. The generator moves the same way whatever
    // Variation is, so a sequence of notes always gives the same audio.
    const float variation = param(kVariation);
    const float draw_level = chance_.bipolar();
    const float draw_tone = chance_.bipolar();
    const float draw_length = chance_.bipolar();
    const float draw_pitch = chance_.bipolar();
    const uint32_t draw_seed = chance_.next_u32();
    const uint32_t seed = (0x9E3779B9u * static_cast<uint32_t>(drum + 1)) ^
                          (variation > 0.0f ? draw_seed : 0u);
    slot.noise.seed(seed);
    slot.noise_side.seed(seed ^ 0x5BD1E995u);

    const Character& c = character(static_cast<int>(param(kKit) + 0.5f));
    semitones = kit::clamp(semitones + variation * 0.2f * draw_pitch, -36.0f, 36.0f);
    const float ratio = kit::semitones_to_ratio(semitones);
    const float half = std::sqrt(ratio);  // the hats' bands move half as far
    // An octave up rings about a third shorter, an octave down half longer.
    const float length = param(kLength) * std::pow(1.5f, -semitones * (1.0f / 12.0f)) *
                         std::exp2(variation * 0.25f * draw_length);
    const float tonal = length * c.tonal_len;
    const float noisy = length * c.noise_len;
    const float punch = param(kPunch);
    const float snap = param(kSnap);
    // A soft hit is quieter and duller, a hard one louder and brighter.
    const float hardness = 0.5f + 0.7f * gain;  // 1 at the reference gain of 0.7
    const float bright = std::exp2((gain - 0.7f) * 1.5f + variation * 0.3f * draw_tone);
    // The hats' and the shaker's bands are narrow and high: half the move.
    const float bright_high = std::sqrt(bright);
    slot.level = (0.25f + 0.75f * gain) * std::exp2(variation * 0.2f * draw_level);
    slot.edge_q = c.q;

    switch (drum) {
      case kKick: {
        partial(slot, 0, 49.0f * c.low_pitch * ratio, 1.0f, 0.45f * tonal);
        fall(slot, (0.3f + 5.0f * punch) * c.sweep_depth * hardness,
             (0.012f + 0.014f * (1.0f - punch)) * c.sweep_time);
        slot.attack = 0.0f;
        slot.attack_step = ramp_step((0.004f - 0.0034f * punch) * c.attack);
        if (snap > 0.0f) {
          noise(slot, 1.2f * snap * c.click * hardness, 0.006f, 0.0002f);
          slot.shaping = kBandPass;
          slot.shape.set(3000.0f * half, 0.8f, sr);
        }
        slot.cut_base = 4000.0f * half * bright * c.edge;
        slot.level *= 0.373f;
        slot.pan = 0.0f;
        break;
      }
      case kSub: {
        partial(slot, 0, 49.0f * c.low_pitch * ratio, 1.0f, 0.9f * tonal);
        fall(slot, 0.06f * c.sweep_depth, 0.04f * c.sweep_time);
        slot.attack = 0.0f;
        slot.attack_step = ramp_step((0.014f - 0.008f * gain) * c.attack);
        slot.cut_base = 900.0f * half * bright * c.edge;
        slot.level *= 0.289f;
        slot.pan = 0.0f;
        break;
      }
      case kSnare: {
        const float tones = kit::lerp(1.0f, 0.45f, snap);
        partial(slot, 0, 185.0f * c.pitch * ratio, 0.60f * tones, 0.11f * tonal);
        partial(slot, 1, 330.0f * c.pitch * ratio, 0.40f * tones, 0.09f * tonal);
        fall(slot, 0.18f * c.sweep_depth * hardness, 0.012f * c.sweep_time);
        slot.attack = 0.0f;
        slot.attack_step = ramp_step(0.0015f * c.attack);
        noise(slot, kit::lerp(0.25f, 0.8f, snap), 0.25f * noisy,
              kit::lerp(0.006f, 0.0005f, snap) * c.attack);
        slot.shaping = kHighPass;
        slot.shape.set(1500.0f * c.band * ratio, 0.7f, sr);
        slot.cut_base = 7000.0f * c.edge * ratio * bright;
        slot.noise_class = true;
        slot.level *= 0.344f;
        slot.pan = 0.0f;
        break;
      }
      case kBrush: {
        noise(slot, 1.0f, 0.35f * noisy, kit::lerp(0.020f, 0.012f, snap) * c.attack);
        slot.shaping = kHighPass;
        slot.shape.set(700.0f * c.band * ratio, 0.7f, sr);
        slot.cut_base = 4200.0f * c.edge * ratio * bright;
        slot.noise_class = true;
        slot.level *= 0.340f * c.air;
        slot.pan = 0.0f;
        break;
      }
      case kRim: {
        partial(slot, 0, 480.0f * c.knock * ratio, 0.70f, 0.060f * tonal);
        partial(slot, 1, 1700.0f * c.knock * ratio, 0.50f, 0.040f * tonal);
        slot.attack = 0.0f;
        slot.attack_step = ramp_step(kit::lerp(0.0012f, 0.0003f, snap) * c.attack);
        noise(slot, (0.15f + 0.6f * snap) * c.click * hardness, 0.004f, 0.0002f);
        slot.shaping = kBandPass;
        slot.shape.set(1700.0f * c.knock * ratio, 1.2f, sr);
        slot.cut_base = 3000.0f * ratio * bright * c.edge;
        slot.level *= 0.174f;
        slot.pan = -0.25f;
        break;
      }
      case kClosedHat:
      case kOpenHat: {
        const bool open = drum == kOpenHat;
        noise(slot, 0.35f, (open ? 0.40f : 0.045f) * noisy,
              kit::lerp(0.003f, 0.0002f, snap) * c.attack);
        metal(slot, ratio * c.pitch, 1.0f);
        slot.bite = 0.8f * snap * hardness;
        slot.bite_coeff = t60_coeff(0.005f);
        slot.shaping = kHighPass;
        slot.shape.set(kit::min(7000.0f * c.band * half, 13000.0f), 0.7f, sr);
        slot.shape2.set(kit::min(5500.0f * c.band * half, 11000.0f), 0.7f, sr);
        slot.cut_base = 10000.0f * c.edge * half * bright_high;
        slot.noise_class = true;
        slot.level *= (open ? 0.400f : 0.840f) * c.metal;
        slot.pan = open ? 0.40f : 0.35f;
        break;
      }
      case kShaker: {
        noise(slot, 1.0f, 0.09f * noisy, kit::lerp(0.010f, 0.006f, snap) * c.attack);
        slot.shaping = kHighPass;
        slot.shape.set(kit::min(4000.0f * c.band * half, 12000.0f), 0.7f, sr);
        slot.cut_base = 9000.0f * c.edge * half * bright_high;
        slot.noise_class = true;
        slot.level *= 0.296f * c.air;
        slot.pan = -0.45f;
        break;
      }
      case kClap: {
        // Three bursts about 10 ms apart, then the tail. The band is as
        // wide as it is high, so its level is held as it is retuned.
        noise(slot, 1.0f / half, 0.03f, kit::lerp(0.002f, 0.0002f, snap) * c.attack);
        slot.bursts = 3;
        slot.burst_gap = static_cast<int>(sr * 0.010f * std::exp2(variation * 0.3f * draw_tone));
        if (slot.burst_gap < 1) slot.burst_gap = 1;
        slot.burst_wait = slot.burst_gap;
        slot.tail_coeff = t60_coeff(0.15f * noisy);
        slot.shaping = kBandPass;
        slot.shape.set(1200.0f * c.band * ratio, 1.4f, sr);
        slot.shape2.set(1450.0f * c.band * ratio, 1.4f, sr);
        slot.side_gain = 0.8f;
        slot.cut_base = 3200.0f * c.edge * ratio * bright;
        slot.noise_class = true;
        slot.level *= 0.810f;
        slot.pan = 0.10f;
        break;
      }
      case kLowTom:
      case kHighTom: {
        const bool high = drum == kHighTom;
        const float hz = (high ? 165.0f : 110.0f) * c.pitch * ratio;
        const float seconds = (high ? 0.30f : 0.40f) * tonal;
        partial(slot, 0, hz, 1.0f, seconds);
        partial(slot, 1, hz * 1.59f, 0.16f, seconds * 0.4f);
        fall(slot, (0.10f + 0.9f * punch) * c.sweep_depth * hardness,
             (0.010f + 0.012f * (1.0f - punch)) * c.sweep_time);
        slot.attack = 0.0f;
        slot.attack_step = ramp_step((0.003f - 0.0024f * punch) * c.attack);
        // The skin: a little noise a few harmonics up.
        noise(slot, 0.18f * (0.5f + 0.7f * snap) * c.click * hardness, 0.05f * tonal, 0.001f);
        slot.shaping = kBandPass;
        slot.shape.set(hz * 6.0f, 0.7f, sr);
        slot.cut_base = 1400.0f * ratio * bright * c.edge;
        slot.level *= 0.262f;
        slot.pan = high ? 0.30f : -0.50f;
        break;
      }
      case kTick:
      default: {
        partial(slot, 0, 2200.0f * c.knock * ratio, 0.70f, 0.040f * tonal);
        partial(slot, 1, 3410.0f * c.knock * ratio, 0.40f, 0.025f * tonal);
        fall(slot, 0.05f * c.sweep_depth, 0.006f * c.sweep_time);
        slot.attack = 0.0f;
        slot.attack_step = ramp_step(kit::lerp(0.0010f, 0.0002f, snap) * c.attack);
        // Its partials are high already: Tone moves it as it moves the noise drums.
        slot.cut_base = 4500.0f * ratio * bright * c.edge;
        slot.noise_class = true;
        slot.level *= 0.149f;
        slot.pan = 0.50f;
        break;
      }
    }
    retune(slot);
  }

  // One sample of one slot, before its place in the stereo field.
  void render(Slot& slot, float* mid_out, float* side_out) {
    float x = 0.0f;
    float side = 0.0f;
    float remaining = 0.0f;

    if (slot.partials > 0) {
      const float bend = 1.0f + slot.sweep;
      slot.sweep = flush_denormal(slot.sweep * slot.sweep_coeff);
      float tone = 0.0f;
      for (int k = 0; k < slot.partials; ++k) {
        tone += kit::SineTable::lookup(slot.phase[k]) * slot.partial_env[k] * slot.partial_gain[k];
        slot.phase[k] += slot.increment[k] * bend;
        if (slot.phase[k] >= 1.0f) slot.phase[k] -= 1.0f;
        if (slot.partial_env[k] > remaining) remaining = slot.partial_env[k];
        slot.partial_env[k] *= slot.partial_coeff[k];
      }
      if (slot.attack < 1.0f) {
        tone *= smoothstep(slot.attack);
        slot.attack = kit::min(1.0f, slot.attack + slot.attack_step);
      }
      x += tone;
    }

    if (slot.noise_gain > 0.0f) {
      if (slot.bursts > 0 && --slot.burst_wait <= 0) {
        // The next burst, or after the last one the tail.
        slot.noise_env = 1.0f;
        slot.burst_wait = slot.burst_gap;
        if (--slot.bursts == 0) slot.noise_coeff = slot.tail_coeff;
      }
      float envelope = slot.noise_env;
      if (envelope > remaining) remaining = envelope;
      if (slot.bursts > 0) remaining = 1.0f;
      slot.noise_env *= slot.noise_coeff;
      if (slot.noise_attack < 1.0f) {
        envelope *= smoothstep(slot.noise_attack);
        slot.noise_attack = kit::min(1.0f, slot.noise_attack + slot.noise_attack_step);
      }
      if (slot.bite > 0.0f) {
        envelope *= 1.0f + slot.bite;
        slot.bite = flush_denormal(slot.bite * slot.bite_coeff);
      }
      envelope *= slot.noise_gain;
      float source = slot.noise.bipolar() * envelope;
      if (slot.metal) {
        float pulses = 0.0f;
        for (int k = 0; k < kMetalPartials; ++k) {
          pulses += slot.pulse[k].pulse(slot.pulse_increment[k], 0.5f);
        }
        // The pulses are not noise: their level does not follow the rate.
        source += pulses * slot.metal_gain * (envelope / noise_scale_);
        source = slot.shape2.highpass(slot.shape.highpass(source));
      } else if (slot.shaping == kHighPass) {
        source = slot.shape.highpass(source);
      } else if (slot.shaping == kBandPass) {
        source = slot.shape.bandpass(source);
        if (slot.side_gain > 0.0f) {
          side = slot.shape2.bandpass(slot.noise_side.bipolar() * envelope) * slot.side_gain;
        }
      }
      x += source;
    }

    x = slot.edge.lowpass(x);
    if (slot.side_gain > 0.0f) side = slot.edge_side.lowpass(side);

    float gain = slot.level;
    if (slot.fade_step > 0.0f) {
      slot.fade -= slot.fade_step;
      if (slot.fade <= 0.0f) slot.fade = 0.0f;
      gain *= smoothstep(slot.fade);
    }
    slot.carry = flush_denormal(slot.carry * slot.carry_coeff);
    const float mid = x * gain + slot.carry;
    slot.last = mid;
    *mid_out = mid;
    *side_out = side * gain;

    if (remaining < kEndLevel || slot.fade <= 0.0f) end(slot);
  }

  // The slot's low-pass, from where Tone stands now.
  void retune(Slot& slot) const {
    const float sr = sample_rate();
    const float factor = slot.noise_class ? noise_factor_ : tonal_factor_;
    slot.edge.set(kit::clamp(slot.cut_base * factor, 40.0f, 0.45f * sr), slot.edge_q, sr);
    // The same filter for the clap's sides; only the state is its own.
    const kit::Svf state = slot.edge_side;
    slot.edge_side = slot.edge;
    slot.edge_side.ic1 = state.ic1;
    slot.edge_side.ic2 = state.ic2;
  }

  // On the control clock: move every sounding slot's low-pass with Tone.
  void follow_tone() {
    if (tone_.value == tone_seen_) return;
    tone_seen_ = tone_.value;
    tonal_factor_ = std::exp2((tone_seen_ - 0.5f) * 4.0f);
    noise_factor_ = std::exp2((tone_seen_ - 0.5f) * 1.7f);
    for (int d = 0; d < kNumDrums; ++d) {
      for (int s = 0; s < kSlotsPerDrum; ++s) {
        if (slots_[d][s].active) retune(slots_[d][s]);
      }
    }
  }

  // Called when a hit arrives and nothing is sounding.
  void restart() {
    tone_.snap(tone_.target);
    drive_.snap(drive_.target);
    width_.snap(width_.target);
    volume_.snap(volume_.target);
    clock_.reset(kControlPeriod);
    follow_tone();
  }

  void apply(int id) {
    using namespace drum_kit;
    const float value = param(id);
    switch (id) {
      case kTone:
        tone_.set(value, primed());
        break;
      case kDrive:
        drive_.set(value, primed());
        break;
      case kWidth:
        width_.set(value, primed());
        break;
      case kVolume:
        volume_.set(kit::db_to_gain(value), primed());
        break;
      default:
        break;  // read when a drum is struck
    }
  }

  Slot slots_[kNumDrums][kSlotsPerDrum];
  int active_ = 0;
  kit::Rng chance_;
  kit::Smoother tone_, drive_, width_, volume_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float noise_scale_ = 1.0f;
  float tone_seen_ = -1.0f;
  float tonal_factor_ = 1.0f;
  float noise_factor_ = 1.0f;
};

}  // namespace livemix
