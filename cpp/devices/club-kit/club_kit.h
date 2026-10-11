#pragma once

// Club Kit: twelve synthesized drums for house and dance music, one on each
// key of the octave: a firmer kit with cymbals, beside the Drum Kit. Nothing
// is sampled and no circuit is modelled: sines, pulses, noise, filters,
// envelopes and a waveshaper on the kick.
//
//   key      drum         how it is made
//   C        kick         a sine falling to G1 through a waveshaper, a click
//   C#       crash        six detuned pulses and noise, wide, a fast fall and a wash
//   D        snare        two short tones under a firm band of noise
//   D#       ride         four high sines for the ping over a quieter bank of pulses
//   E        rim          two short high partials and a click, a side stick
//   F        closed hat   six detuned pulses and noise, high-passed
//   F#       shaker       a band of noise with a soft attack
//   G        open hat     the closed hat ringing; the closed hat chokes it
//   G#       clap         four bursts of noise and a tail, wide
//   A        low conga    a sine on G3 with a small fall, a fifth over it, a slap
//   A#       cowbell      two pulses a fifth apart, D5 and A5, through a band-pass
//   B        high conga   the conga a fifth up, on D4
//
//   note ─► key of the octave picks the drum, the octave and Tune retune it
//        ─► one of the drum's two slots ─► pan ─► drive ─► volume ─► soft clip
//
// - A hit is a one-shot; note off does nothing. Every per-hit control (Kit,
//   Tune, Length, Punch, Snap, Variation) is read when the drum is struck.
// - A drum struck again while it rings takes its other slot and the older
//   one fades in 4 ms. Drums never take each other's slots, so a pile of
//   notes is bounded at 24 slots. A drum is one drum whatever octave its key
//   is played in.
// - The closed hat, and only it, chokes the open hat in 8 ms, in the order
//   the notes arrive. The shaker does not: it plays under an open hat.
// - With Tune at 0, in the octave of middle C, everything with a pitch is on
//   a white key in every Kit: the kick on G1 (F1 in Deep), the snare's tones,
//   the rim's partials, the congas, the cowbell and the ride's ping. They are
//   all on C, D, E, G or A, Deep's kick apart. The pulses of the hats and
//   cymbals are inharmonic metal and have no pitch to hold.
// - A fall in pitch ends: the kick, the snare and the congas come down to
//   their pitch and then stay on it exactly.
// - Tone is one low-pass per slot, retuned on the control clock from the
//   smoothed knob: the top of a tonal drum, the upper edge of a noise drum.
// - Width moves each drum's place and opens the sides of the crash and the
//   clap; at 0 both channels are the same sample. Kick and snare are centred.
// - Drive blends towards a saturator that gives back the level of one firm
//   kick unchanged, so quieter material comes up under the same peaks.
// - Variation draws level, tone, length and pitch from one seeded generator
//   at each hit, and mixes a noise that is new at each hit into the drum's
//   own, which is the same every time: the new noise's share of the power is
//   the square of Variation. At 0 nothing is drawn into the sound and a drum
//   repeats sample for sample; at the default a hit is nearly the hit before.
// - Dusty makes the noise and the pulses of every drum at 16 kHz and holds
//   them, before the drum's filters: a sample and hold whose rate is in
//   hertz, taken and stepped between samples, so it is the same sound at
//   every sample rate. Nothing reaches over 8 kHz but its steps, and the
//   pulses fold.
//
// The bands of the hats, cymbals and shaker move half as far as the tuning
// (in octaves), so that an octave up is still in the hearing range;
// everything else moves by the full interval. No drum of tones is tuned
// under 24 Hz: the kick, the snare and the congas are held there, the
// snare's upper tone and the congas' fifth keeping their interval. A sine
// that would lie above 0.45 of the sample rate is left out, and no pulse is
// tuned above it.
//
// A slot is let go when its drum is 100 dB under its start: a last fade of
// 4 ms takes it to exact silence. The block is rendered slot by slot in
// stretches of the control clock (see process), which changes no sample.
//
// A note whose frequency or gain is not a finite number, or whose frequency
// is not above zero, is dropped.

#include "../../kit/kit.h"
#include "../../kit/keymap.h"
#include "params.gen.h"

namespace livemix {

class ClubKit : public kit::DeviceBase<club_kit::kNumParams> {
 public:
  enum Drum : int {
    kKick = 0,
    kCrash,
    kSnare,
    kRide,
    kRim,
    kClosedHat,
    kShaker,
    kOpenHat,
    kClap,
    kLowConga,
    kCowbell,
    kHighConga,
    kNumDrums,
  };
  static constexpr int kSlotsPerDrum = 2;
  static constexpr int kNumSlots = kNumDrums * kSlotsPerDrum;
  static constexpr int kMaxPartials = 4;
  static constexpr int kMaxPulses = 6;

  void init(float sample_rate) {
    using namespace club_kit;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    // White noise spreads over a wider band at a higher rate; the filters are
    // fixed in hertz, so the level per hertz is held instead.
    noise_scale_ = std::sqrt(sr / 48000.0f);
    for (int n = 0; n < kNumSlots; ++n) slots_[n] = Slot();
    active_ = 0;
    live_ = 0;
    chance_.seed(0x3C6EF372u);
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
    // A note that is not a note is dropped: NaN or an infinity in either
    // number, or a frequency that is not above zero.
    if (!is_finite(frequency) || !is_finite(gain) || !(frequency > 0.0f)) return;
    gain = kit::clamp(gain, 0.0f, 1.0f);
    const kit::OctaveKey key = kit::octave_key(frequency);
    // Nothing sounds, so a knob moved in the silence has arrived, and the
    // control clock starts with the hit whatever the host's block size.
    if (active_ == 0) restart();
    strike(key.key, key.semitones() + param(club_kit::kTune), gain);
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
    // The block is rendered in stretches that end where the control clock
    // next fires, at most 16 samples, and each sounding slot is run through
    // a stretch on its own: a slot's work is one drum's from sample to
    // sample, which a processor follows far better than twelve drums' taken
    // in turn. The sums are made in the same order either way.
    int done = 0;
    while (done < frames) {
      const int stretch = kit::min(frames - done, clock_.period - clock_.counter);
      float width[kControlPeriod];
      float left[kControlPeriod];
      float right[kControlPeriod];
      for (int i = 0; i < stretch; ++i) {
        // A knob at rest costs a comparison, not a step of its smoother.
        if (!tone_.settled()) tone_.next();
        if (clock_.tick()) follow_tone();  // the first sample of a stretch, or none
        width[i] = width_.settled() ? width_.value : width_.next();
        left[i] = 0.0f;
        right[i] = 0.0f;
      }
      // One bit a sounding slot, lowest first: the kick's two, then the
      // crash's, and so on up the keys.
      Slot* next = slots_;
      for (uint32_t live = live_; live != 0; live >>= 1, ++next) {
        if ((live & 1u) == 0) continue;
        Slot& slot = *next;
        for (int i = 0; i < stretch && slot.active; ++i) {
          float mid = 0.0f;
          float side = 0.0f;
          render(slot, &mid, &side);
          const float place = slot.pan * width[i];
          left[i] += mid * (1.0f - place) + side * width[i];
          right[i] += mid * (1.0f + place) - side * width[i];
        }
      }
      for (int i = 0; i < stretch; ++i) {
        // Drive: a blend towards a saturator whose output at the level of
        // one firm kick is that level, so the loud hits stay and the rest
        // comes up.
        const float drive = drive_.settled() ? drive_.value : drive_.next();
        if (drive > 0.0f) {
          left[i] += drive * (kit::fast_tanh(left[i] * kDriveGain) * kDriveMakeup - left[i]);
          right[i] += drive * (kit::fast_tanh(right[i] * kDriveGain) * kDriveMakeup - right[i]);
        }
        const float volume = volume_.settled() ? volume_.value : volume_.next();
        out_left_[done + i] = kit::soft_clip(left[i] * volume);
        out_right_[done + i] = kit::soft_clip(right[i] * volume);
      }
      done += stretch;
    }
    idle_.settle(output_peak(frames), frames);
  }

  // For the harness (cpp/test/club_kit_test.cpp).
  bool asleep() const { return idle_.asleep(); }
  int sounding() const { return active_; }
  // How many of the slots' decaying numbers are subnormal: none, ever. A
  // subnormal costs many times a normal number on most processors.
  int subnormal_states() const {
    int count = 0;
    for (int n = 0; n < kNumSlots; ++n) {
      const Slot& slot = slots_[n];
      const float states[] = {
          slot.partial_env[0], slot.partial_env[1], slot.partial_env[2], slot.partial_env[3],
          slot.sweep,          slot.air_env,        slot.bite,           slot.carry,
          slot.carry_side,     slot.held,           slot.held_side,      slot.edge.ic1,
          slot.edge.ic2,       slot.edge_side.ic1,  slot.edge_side.ic2,  slot.shape.ic1,
          slot.shape.ic2,      slot.shape2.ic1,     slot.shape2.ic2,     slot.shape_side.ic1,
          slot.shape_side.ic2};
      for (float state : states) {
        if (state != 0.0f && std::fabs(state) < kSmallestNormal) ++count;
      }
    }
    return count;
  }

 private:
  static constexpr int kControlPeriod = 16;
  static constexpr float kSixtyDb = 6.907755279f;
  static constexpr float kQuietLevel = 1.0e-5f;    // a slot 100 dB down is let go
  static constexpr float kRestSeconds = 0.004f;    // and fades to nothing in this
  static constexpr float kAirDone = 1.0e-7f;       // a click this far down is over
  static constexpr float kStealSeconds = 0.004f;   // a drum struck again
  static constexpr float kChokeSeconds = 0.008f;   // an open hat closed
  static constexpr float kCarrySeconds = 0.008f;   // what a taken slot leaves
  static constexpr float kDriveGain = 6.0f;
  static constexpr float kDriveMakeup = 0.2943f;   // 0.2818 / fast_tanh(0.2818 * 6)
  static constexpr float kBodyFloorHz = 24.0f;     // no drum of tones is tuned under this
  static constexpr float kFifth = 1.4983071f;      // seven semitones
  static constexpr float kSmallestNormal = 1.17549435e-38f;

  static bool is_finite(float x) { return x - x == 0.0f; }  // false for NaN and the infinities

  // The white keys the kit is tuned to, in hertz (A4 is 440).
  static constexpr float kF1 = 43.65353f;
  static constexpr float kG1 = 48.99943f;
  static constexpr float kD3 = 146.8324f;
  static constexpr float kE3 = 164.8138f;
  static constexpr float kG3 = 195.9977f;
  static constexpr float kA3 = 220.0f;
  static constexpr float kC4 = 261.6256f;
  static constexpr float kD4 = 293.6648f;
  static constexpr float kE4 = 329.6276f;
  static constexpr float kC5 = 523.2511f;
  static constexpr float kD5 = 587.3295f;
  static constexpr float kA5 = 880.0f;
  static constexpr float kG6 = 1567.982f;
  static constexpr float kD7 = 2349.318f;
  static constexpr float kA7 = 3520.0f;
  static constexpr float kE8 = 5274.041f;
  static constexpr float kG8 = 6271.927f;

  // What a Kit choice is. Lengths, depths and levels are factors on the Firm
  // kit; a pitch is a white key, or an interval that lands on one.
  struct Character {
    float kick_hz;      // where the kick rests
    float kick_len;     // how long the kick rings, in seconds at Length 1
    float fall_depth;   // how far the pitch of the kick and congas falls
    float fall_time;    // how slowly
    float click;        // level of the kick's click, the rim's and the congas' slap
    float shape;        // how hard the kick's waveshaper is driven
    float snare_low;    // the snare's two tones
    float snare_high;
    float knock;        // the rim's two partials, as a ratio on C5 and G6
    float tonal_len;    // how long the snare's tones, the rim, congas and cowbell ring
    float noise_len;    // the snare's noise, the clap and the shaker
    float metal_len;    // the hats and cymbals
    float attack;       // length of the attacks
    float band;         // lower edge of the noise bands
    float edge;         // upper edge of the noise bands, top of the tonal drums
    float q;            // resonance of that upper edge
    float wires;        // the snare's noise against its tones
    float hold_hz;      // the rate of the sample and hold, 0 for none
    float dust;         // noise under the tonal drums
  };

  static const Character& character(int choice) {
    static const Character table[4] = {
        // Firm: tight and punchy
        {kG1, 0.320f, 1.00f, 1.00f, 1.00f, 1.00f, kG3, kE4, 1.0f, 1.00f, 1.00f, 1.00f, 1.00f, 1.00f,
         1.00f, 0.60f, 1.00f, 0.0f, 0.0f},
        // Deep: a longer, rounder kick a whole tone lower, darker and quieter tops
        {kF1, 0.440f, 0.60f, 1.60f, 0.30f, 0.45f, kD3, kA3, 0.8408964f, 1.40f, 1.25f, 1.00f, 1.60f,
         0.80f, 0.60f, 0.60f, 0.70f, 0.0f, 0.0f},
        // Dusty: worn, the tops held at 16 kHz, a shorter and thicker kick
        {kG1, 0.285f, 0.85f, 1.00f, 0.70f, 1.60f, kE3, kC4, 1.0f, 0.90f, 0.90f, 0.80f, 1.20f, 0.70f,
         0.50f, 0.90f, 2.00f, 16000.0f, 0.06f},
        // Bright: the tops forward, a shorter kick with more click
        {kG1, 0.265f, 1.25f, 0.80f, 1.35f, 1.00f, kA3, kE4, 1.122462f, 0.85f, 0.90f, 1.05f, 0.70f,
         1.15f, 1.40f, 0.60f, 1.50f, 0.0f, 0.0f},
    };
    return table[kit::clamp_int(choice, 0, 3)];
  }

  // Each drum's level in each Kit, in key order, set by measurement. On the
  // Firm kit one hit at gain 0.7 peaks, on the average of many hits: the
  // kick at -11 dBFS, the clap and snare 3 dB under it, the congas and crash
  // 5.5, the rim, cowbell, hats and ride 8, the shaker 11.5. The others keep
  // the kick there and move the rest as their character says.
  static float level_of(int choice, int drum) {
    static const float table[4][kNumDrums] = {
        /* Firm   */ {0.2595f, 0.0394f, 0.3250f, 0.0623f, 0.1607f, 0.3180f, 0.1980f, 0.1690f, 0.7384f, 0.1169f, 0.0625f, 0.1128f},
        /* Deep   */ {0.3382f, 0.0389f, 0.3288f, 0.0715f, 0.1626f, 0.3002f, 0.2733f, 0.1832f, 0.8191f, 0.1389f, 0.0640f, 0.1470f},
        /* Dusty  */ {0.2717f, 0.0285f, 0.3443f, 0.0683f, 0.1483f, 0.3408f, 0.5147f, 0.1874f, 0.8005f, 0.1183f, 0.0590f, 0.1487f},
        /* Bright */ {0.2159f, 0.0502f, 0.2672f, 0.0667f, 0.1416f, 0.3487f, 0.1891f, 0.1670f, 0.6432f, 0.1103f, 0.0646f, 0.0886f},
    };
    return table[kit::clamp_int(choice, 0, 3)][drum];
  }

  struct Slot {
    bool active = false;
    int index = 0;  // which bit of live_ is this slot's
    // Fade when choked or when the drum is struck again.
    float fade = 1.0f;
    float fade_step = 0.0f;
    // What the slot was putting out when it was taken for a new hit, dying
    // away in a few milliseconds so the cut is not a step.
    float carry = 0.0f;
    float carry_side = 0.0f;
    float carry_coeff = 0.0f;
    bool carrying = false;
    float last = 0.0f;
    float last_side = 0.0f;
    float level = 0.0f;
    float pan = 0.0f;

    // Up to four sine partials with their own decays and a common pitch fall.
    int partials = 0;
    float phase[kMaxPartials] = {};
    float increment[kMaxPartials] = {};
    float partial_gain[kMaxPartials] = {};
    float partial_env[kMaxPartials] = {};
    float partial_coeff[kMaxPartials] = {};
    float sweep = 0.0f;
    float sweep_coeff = 0.0f;
    float sweep_step = 0.0f;  // what brings the fall to its end
    float attack = 1.0f;
    float attack_step = 0.0f;

    // The kick's waveshaper: a soft saturation and a second harmonic.
    bool shaped = false;
    float even = 0.0f;
    float push = 1.0f;
    float push_norm = 1.0f;
    float dust = 0.0f;

    // The air: noise and pulses under one envelope, enveloped before their
    // filters so that the filters round their edges.
    bool air = false;
    bool wide = false;  // the air has sides of its own
    // The drum's own noise, the same at every hit, and a noise that is new
    // at every hit; Variation says how much of each.
    kit::Rng noise;
    kit::Rng noise_side;
    kit::Rng fresh;
    kit::Rng fresh_side;
    float own = 1.0f;
    float drawn = 0.0f;
    float noise_gain = 0.0f;
    float air_env = 0.0f;
    float air_coeff = 0.0f;
    float air_attack = 1.0f;
    float air_attack_step = 0.0f;
    float bite = 0.0f;
    float bite_coeff = 0.0f;
    int shaping = 0;  // kNone, kHighPass, kHighPassTwice, kBandPass
    kit::Svf shape;
    kit::Svf shape2;
    kit::Svf shape_side;

    // The metal and the cowbell: pulses at fixed ratios.
    int pulses = 0;
    float pulse_increment[kMaxPulses] = {};
    float pulse_width = 0.5f;
    float pulse_gain = 0.0f;
    float pulse_side = 0.0f;  // odd pulses against even ones, on the sides

    // The clap: bursts still to come, each restarting the air's envelope.
    int bursts = 0;
    int burst_wait = 0;
    int burst_gap = 0;
    float tail_coeff = 0.0f;
    float side_gain = 0.0f;  // the sides' own noise

    // Dusty: the air is made at a fixed rate and held.
    float hold_step = 0.0f;  // holds per sample, 0 for none
    float hold_phase = 0.0f;
    float held = 0.0f;
    float held_side = 0.0f;
    float pulse_phase[kMaxPulses] = {};

    // Tone: the low-pass everything in the slot goes through.
    kit::Svf edge;
    kit::Svf edge_side;
    float cut_base = 1000.0f;
    float edge_q = 0.6f;
    bool noise_class = false;  // Tone's narrower range: the noise drums and the cowbell
  };

  enum Shaping : int { kNone = 0, kHighPass, kHighPassTwice, kBandPass };

  float t60_coeff(float seconds) const {
    return std::exp(-kSixtyDb / kit::max(1.0f, seconds * sample_rate()));
  }
  float tau_coeff(float seconds) const {
    return std::exp(-1.0f / kit::max(1.0f, seconds * sample_rate()));
  }
  float ramp_step(float seconds) const { return 1.0f / kit::max(1.0f, seconds * sample_rate()); }

  static float smoothstep(float t) { return t * t * (3.0f - 2.0f * t); }

  // The pulses of the metal, in hertz at Tune 0: three sets of six with no
  // simple ratio between any two, so that their harmonics never line up.
  static const float* metal_hz(int drum) {
    static const float hats[kMaxPulses] = {247.1f, 331.6f, 399.5f, 462.1f, 595.5f, 699.3f};
    static const float crash[kMaxPulses] = {173.3f, 219.7f, 281.9f, 337.1f, 421.3f, 529.7f};
    static const float ride[kMaxPulses] = {263.7f, 317.9f, 409.3f, 507.1f, 571.3f, 683.9f};
    return drum == kCrash ? crash : (drum == kRide ? ride : hats);
  }

  // Where each drum's own noise starts, in key order. A drum's noise is the
  // same at every hit, and Variation mixes a new one into it; the harness
  // holds the hit that repeats at Variation 0 to within 1 dB of the usual.
  static uint32_t seed_of(int drum) {
    static const uint32_t seeds[kNumDrums] = {0x9E3779B9u, 0x3C6EF372u, 0xDAA66D2Bu, 0x78DDE6E4u,
                                              0x1715609Du, 0xB54CDA56u, 0x5384540Fu, 0xF1BBCDC8u,
                                              0x8FF34781u, 0x2E2AC13Au, 0xCC623AF3u, 0x6A99B4ACu};
    return seeds[drum];
  }

  // A sine partial. One that would lie above 0.45 of the sample rate is left
  // out: it keeps its envelope, which is silent, and the drum its length.
  void partial(Slot& slot, int index, float hz, float gain, float seconds) const {
    const float sr = sample_rate();
    const float top = 0.45f * sr;
    if (hz > top) gain = 0.0f;
    slot.increment[index] = kit::clamp(hz, 8.0f, top) / sr;
    slot.partial_gain[index] = gain;
    slot.partial_env[index] = 1.0f;
    slot.partial_coeff[index] = t60_coeff(seconds);
    slot.phase[index] = 0.0f;
    if (slot.partials < index + 1) slot.partials = index + 1;
  }

  // Where a drum of tones is tuned: never under the floor.
  static float held(float hz) { return kit::max(hz, kBodyFloorHz); }

  // A fall in pitch from `depth` times the pitch above it. It dies away with
  // the time constant `seconds` and is over, exactly, 4.6 of them on.
  void fall(Slot& slot, float depth, float seconds) const {
    // Keep the swept pitch under 0.45 of the sample rate.
    float fastest = 0.0f;
    for (int k = 0; k < slot.partials; ++k) fastest = kit::max(fastest, slot.increment[k]);
    const float limit = fastest > 0.0f ? 0.45f / fastest - 1.0f : 0.0f;
    slot.sweep = kit::clamp(depth, 0.0f, kit::max(0.0f, limit));
    slot.sweep_coeff = tau_coeff(seconds);
    slot.sweep_step = 0.01f * slot.sweep * (1.0f - slot.sweep_coeff);
  }

  // The air's envelope: 60 dB down in `seconds`, risen in `attack_seconds`.
  void air(Slot& slot, float seconds, float attack_seconds) const {
    slot.air = true;
    slot.air_env = 1.0f;
    slot.air_coeff = t60_coeff(seconds);
    slot.air_attack = 0.0f;
    slot.air_attack_step = ramp_step(attack_seconds);
  }

  // White noise in the air, at a level that does not follow the sample rate.
  void noise(Slot& slot, float gain) const { slot.noise_gain = gain * noise_scale_; }

  // `count` pulses at `hz` times `ratio`, none of them above `top` of the rate.
  void pulses(Slot& slot, int count, const float* hz, float ratio, float width, float gain, float top) const {
    const float sr = sample_rate();
    slot.pulses = count;
    slot.pulse_width = width;
    slot.pulse_gain = gain;
    for (int k = 0; k < count; ++k) {
      slot.pulse_increment[k] = kit::clamp(hz[k] * ratio, 20.0f, top * sr) / sr;
      slot.pulse_phase[k] = static_cast<float>(k) * 0.137f;  // six pulses, six starts, all under 1
    }
  }

  void begin_fade(Slot& slot, float seconds) const {
    const float step = ramp_step(seconds);
    if (slot.fade_step < step) slot.fade_step = step;
  }

  void end(Slot& slot) {
    if (slot.active) {
      --active_;
      live_ &= ~(1u << slot.index);
    }
    slot.active = false;
    slot.last = 0.0f;
    slot.last_side = 0.0f;
  }

  // One hit. `semitones` is the tuning the octave, the cents and Tune ask for.
  void strike(int drum, float semitones, float gain) {
    using namespace club_kit;
    const float sr = sample_rate();
    Slot* pair = &slots_[drum * kSlotsPerDrum];

    // A free slot, else the one already fading. Two sounding slots are
    // never both unfaded: the second hit fades the first.
    int take = 0;
    if (pair[0].active && (!pair[1].active || pair[1].fade_step > 0.0f)) take = 1;
    Slot& other = pair[1 - take];
    if (other.active) begin_fade(other, kStealSeconds);
    if (drum == kClosedHat) {
      Slot* open = &slots_[kOpenHat * kSlotsPerDrum];
      for (int s = 0; s < kSlotsPerDrum; ++s) {
        if (open[s].active) begin_fade(open[s], kChokeSeconds);
      }
    }

    Slot& slot = pair[take];
    const float carry = slot.active ? slot.last : 0.0f;
    const float carry_side = slot.active ? slot.last_side : 0.0f;
    if (!slot.active) ++active_;
    slot = Slot();
    slot.active = true;
    slot.index = drum * kSlotsPerDrum + take;
    live_ |= 1u << slot.index;
    slot.carry = carry;
    slot.carry_side = carry_side;
    slot.carrying = carry != 0.0f || carry_side != 0.0f;
    slot.carry_coeff = t60_coeff(kCarrySeconds);

    // What this hit draws. The generator moves the same way whatever
    // Variation is, so a sequence of notes always gives the same audio.
    const float variation = param(kVariation);
    const float draw_level = chance_.bipolar();
    const float draw_tone = chance_.bipolar();
    const float draw_length = chance_.bipolar();
    const float draw_pitch = chance_.bipolar();
    const uint32_t draw_seed = chance_.next_u32();
    const uint32_t seed = seed_of(drum);
    slot.noise.seed(seed);
    slot.noise_side.seed(seed ^ 0x5BD1E995u);
    slot.fresh.seed(draw_seed);
    slot.fresh_side.seed(draw_seed ^ 0x5BD1E995u);
    // The share of new noise is the square of Variation, by power: a little
    // Variation leaves a hit nearly the hit before, all of it leaves nothing.
    slot.drawn = variation;
    slot.own = std::sqrt(1.0f - variation * variation);

    const int choice = static_cast<int>(param(kKit) + 0.5f);
    const Character& c = character(choice);
    semitones = kit::clamp(semitones + variation * 0.2f * draw_pitch, -36.0f, 36.0f);
    const float ratio = kit::semitones_to_ratio(semitones);
    const float half = std::sqrt(ratio);  // the bands of the metal move half as far
    // An octave up rings about a third shorter, an octave down half longer.
    const float length = param(kLength) * std::pow(1.5f, -semitones * (1.0f / 12.0f)) *
                         std::exp2(variation * 0.25f * draw_length);
    const float tonal = length * c.tonal_len;
    const float noisy = length * c.noise_len;
    const float metal = length * c.metal_len;
    const float punch = param(kPunch);
    const float snap = param(kSnap);
    // A soft hit is quieter and duller, a hard one louder and brighter.
    const float hardness = 0.5f + 0.7f * gain;  // 1 at the reference gain of 0.7
    const float bright = std::exp2((gain - 0.7f) * 1.5f + variation * 0.3f * draw_tone);
    // The bands of the metal and the shaker are narrow and high: half the move.
    const float bright_high = std::sqrt(bright);
    slot.level = (0.25f + 0.75f * gain) * std::exp2(variation * 0.2f * draw_level) * level_of(choice, drum);
    slot.edge_q = c.q;
    slot.hold_step = c.hold_hz > 0.0f ? kit::min(1.0f, c.hold_hz / sr) : 0.0f;

    switch (drum) {
      case kKick: {
        partial(slot, 0, held(c.kick_hz * ratio), 1.0f, c.kick_len * length);
        fall(slot, (0.6f + 4.4f * punch) * c.fall_depth * hardness,
             (0.007f + 0.008f * (1.0f - punch)) * c.fall_time);
        slot.attack = 0.0f;
        slot.attack_step = ramp_step((0.0016f - 0.0012f * punch) * c.attack);
        // The waveshaper: what is left of the kick on a small speaker.
        slot.shaped = true;
        slot.even = 0.22f * c.shape;
        slot.push = 1.0f + 0.9f * c.shape;
        slot.push_norm = 1.0f / kit::fast_tanh(slot.push);
        slot.dust = c.dust * noise_scale_;
        if (snap > 0.0f) {
          air(slot, 0.006f, 0.0002f);
          noise(slot, 4.0f * snap * c.click * hardness);
          slot.shaping = kBandPass;
          slot.shape.set(3500.0f * half, 0.8f, sr);
        }
        slot.cut_base = 5000.0f * half * bright * c.edge;
        slot.pan = 0.0f;
        break;
      }
      case kCrash: {
        air(slot, 2.3f * metal, kit::lerp(0.0030f, 0.0003f, snap) * c.attack);
        noise(slot, 0.55f);
        pulses(slot, kMaxPulses, metal_hz(drum), ratio, 0.31f, 1.0f, 0.3f);
        // The first fall: the stick, well over the wash for a tenth of a second or two.
        slot.bite = (1.0f + 1.5f * snap) * hardness;
        slot.bite_coeff = t60_coeff(0.25f);
        slot.shaping = kHighPassTwice;
        slot.shape.set(kit::min(3400.0f * c.band * half, 9000.0f), 0.7f, sr);
        slot.shape2.set(kit::min(2600.0f * c.band * half, 8000.0f), 0.7f, sr);
        // Wide: the odd pulses against the even ones, and a noise of its own.
        slot.wide = true;
        slot.pulse_side = 0.7f;
        slot.side_gain = 0.9f;
        slot.shape_side.set(kit::min(3400.0f * c.band * half, 9000.0f), 0.7f, sr);
        slot.cut_base = 14000.0f * c.edge * half * bright_high;
        slot.noise_class = true;
        slot.pan = -0.20f;
        break;
      }
      case kSnare: {
        const float tones = kit::lerp(1.0f, 0.5f, snap);
        // Held at the floor by its lower tone; the upper one keeps its ratio.
        const float lift = held(c.snare_low * ratio) / (c.snare_low * ratio);
        partial(slot, 0, c.snare_low * ratio * lift, 0.60f * tones, 0.100f * tonal);
        partial(slot, 1, c.snare_high * ratio * lift, 0.40f * tones, 0.070f * tonal);
        fall(slot, 0.22f * c.fall_depth * hardness, 0.004f * c.fall_time);
        slot.attack = 0.0f;
        slot.attack_step = ramp_step(0.0008f * c.attack);
        slot.dust = c.dust * noise_scale_;
        air(slot, 0.18f * noisy, kit::lerp(0.0040f, 0.0003f, snap) * c.attack);
        noise(slot, kit::lerp(0.35f, 1.0f, snap) * c.wires);
        slot.shaping = kHighPass;
        slot.shape.set(1800.0f * c.band * ratio, 0.7f, sr);
        slot.cut_base = 9000.0f * c.edge * ratio * bright;
        slot.noise_class = true;
        slot.pan = 0.0f;
        break;
      }
      case kRide: {
        // The ping: four sines a fifth and more apart, the high ones gone
        // first. A brighter Kit has more of the upper two and of the wash.
        partial(slot, 0, kA7 * ratio, 1.00f, 0.95f * metal);
        partial(slot, 1, kE8 * ratio, 0.55f * c.edge, 0.65f * metal);
        partial(slot, 2, kD7 * ratio, 0.40f, 1.15f * metal);
        partial(slot, 3, kG8 * ratio, 0.30f * c.edge, 0.45f * metal);
        slot.attack = 0.0f;
        slot.attack_step = ramp_step(kit::lerp(0.0015f, 0.0003f, snap) * c.attack);
        // The wash under it: pulses and a little noise, quieter than the ping.
        air(slot, 1.25f * metal, kit::lerp(0.0030f, 0.0003f, snap) * c.attack);
        noise(slot, 0.12f);
        pulses(slot, kMaxPulses, metal_hz(drum), ratio, 0.5f, 0.45f * c.edge, 0.3f);
        slot.bite = 0.8f * snap * hardness;
        slot.bite_coeff = t60_coeff(0.03f);
        slot.shaping = kHighPassTwice;
        slot.shape.set(kit::min(5200.0f * c.band * half, 12000.0f), 0.7f, sr);
        slot.shape2.set(kit::min(4200.0f * c.band * half, 10000.0f), 0.7f, sr);
        slot.cut_base = 13000.0f * c.edge * half * bright_high;
        slot.noise_class = true;
        slot.pan = 0.30f;
        break;
      }
      case kRim: {
        // A side stick is short in every Kit: half the move of the other drums.
        const float knock = length * std::sqrt(c.tonal_len);
        partial(slot, 0, kC5 * c.knock * ratio, 0.70f, 0.045f * knock);
        partial(slot, 1, kG6 * c.knock * ratio, 0.55f, 0.030f * knock);
        slot.attack = 0.0f;
        slot.attack_step = ramp_step(kit::lerp(0.0008f, 0.0002f, snap) * c.attack);
        slot.dust = c.dust * noise_scale_;
        air(slot, 0.004f, 0.0002f);
        noise(slot, (0.6f + 3.0f * snap) * c.click * hardness);
        slot.shaping = kBandPass;
        slot.shape.set(3200.0f * c.knock * ratio, 1.2f, sr);
        slot.cut_base = 5000.0f * ratio * bright * c.edge;
        slot.pan = -0.25f;
        break;
      }
      case kClosedHat:
      case kOpenHat: {
        const bool open = drum == kOpenHat;
        air(slot, (open ? 0.42f : 0.050f) * metal, kit::lerp(0.0030f, 0.0002f, snap) * c.attack);
        noise(slot, 0.35f);
        pulses(slot, kMaxPulses, metal_hz(drum), ratio, 0.5f, 1.0f, 0.3f);
        slot.bite = 0.8f * snap * hardness;
        slot.bite_coeff = t60_coeff(0.005f);
        slot.shaping = kHighPassTwice;
        slot.shape.set(kit::min(7000.0f * c.band * half, 13000.0f), 0.7f, sr);
        slot.shape2.set(kit::min(5500.0f * c.band * half, 11000.0f), 0.7f, sr);
        slot.cut_base = 11000.0f * c.edge * half * bright_high;
        slot.noise_class = true;
        slot.pan = open ? 0.40f : 0.35f;
        break;
      }
      case kShaker: {
        air(slot, 0.075f * noisy, kit::lerp(0.008f, 0.004f, snap) * c.attack);
        noise(slot, 1.0f);
        slot.shaping = kHighPass;
        slot.shape.set(kit::min(4500.0f * c.band * half, 12000.0f), 0.7f, sr);
        slot.cut_base = 9500.0f * c.edge * half * bright_high;
        slot.noise_class = true;
        slot.pan = -0.45f;
        break;
      }
      case kClap: {
        // Four bursts 8 ms apart, then the tail. The band is as wide as it
        // is high, so its level is held as it is retuned.
        air(slot, 0.022f, kit::lerp(0.0015f, 0.0002f, snap) * c.attack);
        noise(slot, 1.0f / half);
        slot.bursts = 4;
        slot.burst_gap = static_cast<int>(sr * 0.008f * std::exp2(variation * 0.3f * draw_tone));
        if (slot.burst_gap < 1) slot.burst_gap = 1;
        slot.burst_wait = slot.burst_gap;
        slot.tail_coeff = t60_coeff(0.20f * noisy);
        slot.shaping = kBandPass;
        slot.shape.set(1500.0f * c.band * ratio, 1.2f, sr);
        slot.wide = true;
        slot.side_gain = 0.8f;
        slot.shape_side.set(1800.0f * c.band * ratio, 1.2f, sr);
        slot.cut_base = 4200.0f * c.edge * ratio * bright;
        slot.noise_class = true;
        slot.pan = 0.10f;
        break;
      }
      case kLowConga:
      case kHighConga: {
        const bool high = drum == kHighConga;
        const float hz = held((high ? kD4 : kG3) * ratio);
        const float seconds = (high ? 0.20f : 0.25f) * tonal;
        partial(slot, 0, hz, 1.0f, seconds);
        partial(slot, 1, hz * kFifth, 0.35f, seconds * 0.6f);
        fall(slot, (0.08f + 0.30f * punch) * c.fall_depth * hardness,
             (0.004f + 0.004f * (1.0f - punch)) * c.fall_time);
        slot.attack = 0.0f;
        slot.attack_step = ramp_step((0.0012f - 0.0008f * punch) * c.attack);
        slot.dust = c.dust * noise_scale_;
        // The slap: a short noise a few harmonics up, more of it on the high one.
        air(slot, 0.035f * tonal, 0.0002f);
        noise(slot, (high ? 2.4f : 1.6f) * (0.4f + 1.0f * snap) * c.click * hardness);
        slot.shaping = kBandPass;
        slot.shape.set(hz * 7.0f, 0.8f, sr);
        slot.cut_base = hz * 13.0f * bright * c.edge;
        slot.pan = high ? 0.35f : -0.35f;
        break;
      }
      case kCowbell:
      default: {
        static const float bell[2] = {kD5, kA5};
        air(slot, 0.16f * tonal, kit::lerp(0.0010f, 0.0002f, snap) * c.attack);
        pulses(slot, 2, bell, ratio, 0.5f, 1.0f, 0.45f);
        // The hard start: half as much again and more for a hundredth of a second.
        slot.bite = (0.5f + 0.6f * snap) * hardness;
        slot.bite_coeff = t60_coeff(0.012f);
        slot.shaping = kBandPass;
        slot.shape.set(1200.0f * ratio, 0.9f, sr);
        // Its pulses are bright already: Tone moves it as it moves the noise drums.
        slot.cut_base = 3000.0f * ratio * bright * c.edge;
        slot.noise_class = true;
        slot.pan = 0.45f;
        break;
      }
    }
    // Held noise is one value at each tick of the hold: its level per hertz
    // is set by the hold's rate, whatever the sample rate.
    if (slot.hold_step > 0.0f) slot.noise_gain *= std::sqrt(c.hold_hz / sr);
    retune(slot);
  }

  // One tick of a kit::Svf, as its process() makes it, with the two states
  // flushed by their size alone. The kit's flush_denormal asks for the sign
  // first, which g++ makes a branch on the sign of the signal: nothing can
  // foresee that in noise, and under a busy bar it was half of what the kit
  // cost natively. These give the same samples.
  static float settle(float x) { return std::fabs(x) < kDenormalThreshold ? 0.0f : x; }
  static float lowpass(kit::Svf& f, float x) {
    const float v3 = x - f.ic2;
    const float v1 = f.a1 * f.ic1 + f.a2 * v3;
    const float v2 = f.ic2 + f.a2 * f.ic1 + f.a3 * v3;
    f.ic1 = settle(2.0f * v1 - f.ic1);
    f.ic2 = settle(2.0f * v2 - f.ic2);
    return v2;
  }
  static float highpass(kit::Svf& f, float x) {
    const float v3 = x - f.ic2;
    const float v1 = f.a1 * f.ic1 + f.a2 * v3;
    const float v2 = f.ic2 + f.a2 * f.ic1 + f.a3 * v3;
    f.ic1 = settle(2.0f * v1 - f.ic1);
    f.ic2 = settle(2.0f * v2 - f.ic2);
    return x - f.k * v1 - v2;
  }
  // Unity gain at the centre frequency.
  static float bandpass(kit::Svf& f, float x) {
    const float v3 = x - f.ic2;
    const float v1 = f.a1 * f.ic1 + f.a2 * v3;
    const float v2 = f.ic2 + f.a2 * f.ic1 + f.a3 * v3;
    f.ic1 = settle(2.0f * v1 - f.ic1);
    f.ic2 = settle(2.0f * v2 - f.ic2);
    return v1 * f.k;
  }

  // What a band-limited step is short of a plain one, `t` of a cycle after
  // it or before the next (PolyBLEP, as in kit/osc.h).
  static float step_residual(float t, float dt) {
    if (t < dt) {
      t /= dt;
      return t + t - t * t - 1.0f;
    }
    if (t > 1.0f - dt) {
      t = (t - 1.0f) / dt;
      return t * t + t + t + 1.0f;
    }
    return 0.0f;
  }

  // One sample of a band-limited pulse between -1 and 1, its phase moved on:
  // kit::BlepOsc's pulse without the checks it makes at every sample, which
  // are made once here when the drum is struck (eighteen pulses sound under
  // a busy bar). The increment is under 0.45 and the width is 0.31 or 0.5.
  static float pulse_wave(float* phase, float increment, float width) {
    float at = *phase + increment;
    if (at >= 1.0f) at -= 1.0f;
    *phase = at;
    // The step up is where the phase wraps, the step down at the width,
    // which is further than an increment from either end of the cycle. High
    // before the width and low after it, with no branch: which half a pulse
    // is in cannot be foreseen with six of them running.
    const float past = at - width;
    float value = std::copysign(1.0f, -past) + step_residual(at, increment);
    if (std::fabs(past) < increment) {
      const float t = past / increment;
      value -= past < 0.0f ? t * t + t + t + 1.0f : t + t - t * t - 1.0f;
    }
    return value;
  }

  // One sample of the slot's noise: its own, and as much new as Variation says.
  static float white(Slot& slot) {
    float value = slot.noise.bipolar();
    if (slot.drawn > 0.0f) value = value * slot.own + slot.fresh.bipolar() * slot.drawn;
    return value;
  }
  static float white_side(Slot& slot) {
    float value = slot.noise_side.bipolar();
    if (slot.drawn > 0.0f) value = value * slot.own + slot.fresh_side.bipolar() * slot.drawn;
    return value;
  }

  // One sample of one slot, before its place in the stereo field.
  void render(Slot& slot, float* mid_out, float* side_out) {
    float x = 0.0f;
    float side = 0.0f;
    float remaining = 0.0f;

    if (slot.partials > 0) {
      const float bend = 1.0f + slot.sweep;
      if (slot.sweep > 0.0f) {
        // The fall dies away and is taken down a little more each sample,
        // so that it reaches zero and the drum is then on its pitch.
        slot.sweep = slot.sweep * slot.sweep_coeff - slot.sweep_step;
        if (slot.sweep < 0.0f) slot.sweep = 0.0f;
      }
      float rise = 1.0f;
      if (slot.attack < 1.0f) {
        rise = smoothstep(slot.attack);
        slot.attack = kit::min(1.0f, slot.attack + slot.attack_step);
      }
      const float body = slot.partial_env[0] * slot.partial_gain[0] * rise;
      float tone = 0.0f;
      for (int k = 0; k < slot.partials; ++k) {
        float wave = kit::SineTable::lookup(slot.phase[k]);
        // The kick's waveshaper works on the sine before its envelope, so
        // the harmonics keep their share as the drum dies away: a soft
        // saturation gives the odd ones, and the square of the sine less its
        // mean is the second, with no offset.
        if (slot.shaped) {
          wave = kit::fast_tanh(wave * slot.push) * slot.push_norm + slot.even * (2.0f * wave * wave - 1.0f);
        }
        tone += wave * slot.partial_env[k] * slot.partial_gain[k];
        slot.phase[k] += slot.increment[k] * bend;
        if (slot.phase[k] >= 1.0f) slot.phase[k] -= 1.0f;
        if (slot.partial_env[k] > remaining) remaining = slot.partial_env[k];
        // A quick partial is far under a slow one by the time the slot ends.
        slot.partial_env[k] = flush_denormal(slot.partial_env[k] * slot.partial_coeff[k]);
      }
      tone *= rise;
      // Dusty: a little noise that lives and dies with the body. It is drawn
      // from the generator of the sides, which a drum of tones has no other
      // use for, so the drum's air draws the same noise at every sample rate.
      if (slot.dust > 0.0f) tone += white_side(slot) * slot.dust * body;
      x += tone;
    }

    if (slot.air) {
      if (slot.bursts > 0 && --slot.burst_wait <= 0) {
        // The next burst, or after the last one the tail.
        slot.air_env = 1.0f;
        slot.burst_wait = slot.burst_gap;
        if (--slot.bursts == 0) slot.air_coeff = slot.tail_coeff;
      }
      float envelope = slot.air_env;
      if (envelope > remaining) remaining = envelope;
      if (slot.bursts > 0) remaining = 1.0f;
      // A click's envelope is over long before its drum is: without the
      // flush it would sit in the subnormals for the rest of the slot's life.
      slot.air_env = flush_denormal(slot.air_env * slot.air_coeff);
      // A click or a slap is over long before its drum: 140 dB down its
      // noise and its filter are left out for the rest of the slot's life.
      if (slot.air_env < kAirDone && slot.bursts == 0) slot.air = false;
      if (slot.air_attack < 1.0f) {
        envelope *= smoothstep(slot.air_attack);
        slot.air_attack = kit::min(1.0f, slot.air_attack + slot.air_attack_step);
      }
      if (slot.bite > 0.0f) {
        envelope *= 1.0f + slot.bite;
        slot.bite = flush_denormal(slot.bite * slot.bite_coeff);
      }
      float source = 0.0f;
      float sides = 0.0f;
      if (slot.hold_step > 0.0f) {
        // Dusty: a sample and hold at a rate in hertz. The air is made at
        // the hold's own clock, a noise value and the plain pulses where
        // the clock falls between two samples, so the held values are the
        // same at every sample rate; the step from one to the next is this
        // sample's share of each. What folds is the grit.
        for (int k = 0; k < slot.pulses; ++k) {
          slot.pulse_phase[k] += slot.pulse_increment[k];
          if (slot.pulse_phase[k] >= 1.0f) slot.pulse_phase[k] -= 1.0f;
        }
        slot.hold_phase += slot.hold_step;
        if (slot.hold_phase >= 1.0f) {
          slot.hold_phase -= 1.0f;
          const float since = kit::min(1.0f, slot.hold_phase / slot.hold_step);
          float taken = 0.0f;
          float taken_side = 0.0f;
          if (slot.noise_gain > 0.0f) taken = white(slot) * slot.noise_gain;
          if (slot.pulses > 0) {
            float sum = 0.0f;
            float apart = 0.0f;
            for (int k = 0; k < slot.pulses; ++k) {
              float phase = slot.pulse_phase[k] - slot.pulse_increment[k] * since;
              if (phase < 0.0f) phase += 1.0f;
              const float value = (phase < slot.pulse_width ? 1.0f : -1.0f) - (2.0f * slot.pulse_width - 1.0f);
              sum += value;
              apart += (k & 1) ? -value : value;
            }
            taken += sum * slot.pulse_gain;
            taken_side = apart * slot.pulse_gain * slot.pulse_side;
          }
          taken *= envelope;
          if (slot.wide) {
            taken_side += white_side(slot) * slot.noise_gain * slot.side_gain;
            taken_side *= envelope;
          }
          source = slot.held + (taken - slot.held) * since;
          sides = slot.held_side + (taken_side - slot.held_side) * since;
          slot.held = taken;
          slot.held_side = taken_side;
        } else {
          source = slot.held;
          sides = slot.held_side;
        }
      } else {
        if (slot.noise_gain > 0.0f) source = white(slot) * slot.noise_gain;
        if (slot.pulses > 0) {
          // The pulses come in pairs: the first of each on one hand, the
          // second on the other. Their sum is the middle, their difference
          // the sides.
          float even = 0.0f;
          float odd = 0.0f;
          for (int k = 0; k + 1 < slot.pulses; k += 2) {
            even += pulse_wave(&slot.pulse_phase[k], slot.pulse_increment[k], slot.pulse_width);
            odd += pulse_wave(&slot.pulse_phase[k + 1], slot.pulse_increment[k + 1], slot.pulse_width);
          }
          // The pulses are not noise: their level does not follow the rate.
          // What a pulse that is not square carries at 0 Hz is taken off.
          const float offset = static_cast<float>(slot.pulses) * (2.0f * slot.pulse_width - 1.0f);
          source += (even + odd - offset) * slot.pulse_gain;
          sides = (even - odd) * slot.pulse_gain * slot.pulse_side;
        }
        source *= envelope;
        if (slot.wide) {
          sides += white_side(slot) * slot.noise_gain * slot.side_gain;
          sides *= envelope;
        }
      }
      if (slot.shaping == kHighPassTwice) {
        source = highpass(slot.shape2, highpass(slot.shape, source));
        if (slot.wide) sides = highpass(slot.shape_side, sides);
      } else if (slot.shaping == kHighPass) {
        source = highpass(slot.shape, source);
      } else if (slot.shaping == kBandPass) {
        source = bandpass(slot.shape, source);
        if (slot.wide) sides = bandpass(slot.shape_side, sides);
      }
      x += source;
      side = sides;
    }

    x = lowpass(slot.edge, x);
    if (slot.wide) side = lowpass(slot.edge_side, side);

    float gain = slot.level;
    if (slot.fade_step > 0.0f) {
      slot.fade -= slot.fade_step;
      if (slot.fade <= 0.0f) slot.fade = 0.0f;
      gain *= smoothstep(slot.fade);
    }
    float mid = x * gain;
    float wide = side * gain;
    if (slot.carrying) {
      slot.carry = flush_denormal(slot.carry * slot.carry_coeff);
      slot.carry_side = flush_denormal(slot.carry_side * slot.carry_coeff);
      mid += slot.carry;
      wide += slot.carry_side;
      slot.carrying = slot.carry != 0.0f || slot.carry_side != 0.0f;
    }
    slot.last = mid;
    slot.last_side = wide;
    *mid_out = mid;
    *side_out = wide;

    // A drum 100 dB under its start is let go: a last fade of 4 ms takes it
    // to nothing with no step, and the slot is free.
    if (remaining < kQuietLevel) begin_fade(slot, kRestSeconds);
    if (slot.fade <= 0.0f) end(slot);
  }

  // The slot's low-pass, from where Tone stands now.
  void retune(Slot& slot) const {
    const float sr = sample_rate();
    const float factor = slot.noise_class ? noise_factor_ : tonal_factor_;
    slot.edge.set(kit::clamp(slot.cut_base * factor, 40.0f, 0.45f * sr), slot.edge_q, sr);
    // The same filter for the sides; only the state is its own.
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
    for (int n = 0; n < kNumSlots; ++n) {
      if (slots_[n].active) retune(slots_[n]);
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
    using namespace club_kit;
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

  Slot slots_[kNumSlots];  // a drum's two side by side, in the order of the keys
  int active_ = 0;
  uint32_t live_ = 0;  // one bit a sounding slot
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
