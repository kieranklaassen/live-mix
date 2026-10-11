#pragma once

// Bowls: a table of metal singing bowls tuned to a key. The sound that passes
// over them sets ringing the bowls it shares frequencies with.
//
//   in L ─┬───────────────────────────────────────────────────────────► dry ─┐
//   in R ─┤                                                                  (+)─► out
//         └─► onset boost ─► × drive ─► ears ─► bowls (up to 12) ─► pan ─► clip ─┘
//                (Strike)        ▲       │        each: three pairs of modes
//                                └ hold ◄┘  (an ear takes less in near its ceiling)
//
// - A bowl is three partials at 1, 2.77 and 5.17 times its note (the rim
//   modes measured on real bowls, the ratios modal-bells uses), and each
//   partial is a PAIR of modes a little apart in pitch, because a bowl is
//   never perfectly round: the two beat slowly against each other. Beat sets
//   how far apart, half each way from the partial; every bowl has its own
//   rate (kBeatSpread).
// - A mode is one complex number turned and shrunk a little every sample
//   (z' = r·e^jw·z), the form modal-bells uses: its length is the amplitude,
//   there to read and to steer, and pitch and decay can change under a
//   ringing bowl without a click.
// - The sound does not drive the heard modes. It drives the bowl's two EARS,
//   which are never heard: each is two resonators in a row on the bowl's
//   note, as wide as a singer is from the note (kEarCents: 3 dB down ten
//   cents off, 30 dB down a semitone off, whatever Ring is; only where Ring
//   is shorter than such an ear can be is it made as short as Ring and so
//   wider). What an ear holds is the part of the sound on the bowl's note,
//   in proportion to the sound: a note on the bowl's pitch, held, reads as
//   the note's own size times the drive (Strike), so a bowl rings as hard as
//   it is played, quiet for quiet.
// - The heard modes follow the ears, once a tick (1/1500 s). Each mode of the
//   lowest pair is raised to what its ear holds whenever it has less, and
//   left to die at its own rate (Ring) when it has more: so the bowl sings
//   for as long as its note is held and rings on after. Each upper partial
//   is owed its share (Metal) of every GAIN the ear makes, which then dies at
//   the partial's own, faster rate down to a part of that share (kSung) that
//   stays for as long as the note does: a bowl that is touched rings bright
//   and settles, and a bowl that is sung keeps its upper partials. A mode is
//   raised by turning it with a radius a little over one for a tick, never
//   by a step.
// - While its ears are fed, the lowest pair is turned (a few degrees a tick
//   at the most) so that its middle stays a quarter turn behind the sound
//   that feeds it, as a resonator on the note would be. A quarter turn is
//   where a bowl adds to the note in the mix and never takes from it: with
//   the bowl in step by chance, a note struck again over its own ring lost
//   up to 7 dB. The turn follows a note that is a few cents off (the sound's
//   own phase is read from the two resonators of the ear), so the bowl sings
//   at the pitch it is played at and goes back to its own when left alone.
// - One ear of a bowl listens mostly to the left input and one mostly to the
//   right (kCross); the two modes of each pair follow one ear each and sit a
//   little apart around the bowl's place (kPairWidth). A mono sound rings
//   both alike, an anti-phase one still rings both (and in step with each
//   other, so they do not cancel where they meet), and the beat moves
//   between the sides. The wet path is stereo: nothing is summed to mono.
// - Strike is how easily the sound gets in: the drive, and a boost of the
//   drive for the few tens of ms after an attack (a fast follower over a slow
//   one), when the sound is wide in pitch and so reaches the bowls near it.
// - Level: what a bowl holds is in proportion to the sound up to the top
//   dozen dB, where an ear takes less in as it nears a ceiling (kCeiling)
//   and nothing at it, and every ear takes less in as the whole table fills
//   (kTableCeiling), so that a full chord on twelve bowls stays bowls. The
//   sum of the bowls ends in kit::soft_clip, which only the tops of such a
//   chord reach: the wet side never passes full scale.
// - The bowls are the first `Bowls` notes of the scale at or above Register,
//   each in the slot (place between the sides, beat rate) of its step of the
//   scale, so moving Register takes one bowl off one end and stands one at
//   the other. A bowl that leaves the table goes on ringing where it stood
//   until it has died (the slot's second set of modes), while the new one
//   comes in beside it. Only when a slot is asked to let a third bowl in
//   while two still ring is the quieter of the two damped first (a hand on
//   the bowl, kDampSeconds): no retune ever clicks or slides.
// - Sleep is counted in samples and decided on the tick, and the first
//   sample of a sound wakes it, so the output is the same at every block
//   size across a silence. Asleep the table is cleared: knobs moved in the
//   silence snap.
//
// Storage: twelve slots of 12 modes of six floats and two ears of four, a
// few dozen floats a bowl and seven scratch rows of 256 floats; no delay
// lines, nothing sized by the sample rate. All of it is reset in init().
// Nothing here runs by itself: there is no LFO, and the beat is the two
// modes of a pair.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Bowls : public kit::DeviceBase<bowls::kNumParams> {
 public:
  static constexpr int kMaxBowls = 12;
  static constexpr int kNumPartials = 3;
  static constexpr int kNumScales = 8;
  // The partials of a bowl against its note, how long each rings against
  // Ring, and how much wider each pair beats than the lowest.
  static constexpr float kRatio[kNumPartials] = {1.0f, 2.77f, 5.17f};
  static constexpr float kPartialRing[kNumPartials] = {1.0f, 0.55f, 0.3f};
  static constexpr float kPartialBeat[kNumPartials] = {1.0f, 1.8f, 2.9f};
  // Metal: the share of the lowest pair's gain each upper partial is struck
  // with, in dB under it, at Metal 0 and at Metal 1; and the part of that
  // share a bowl keeps for as long as its note is held.
  static constexpr float kDullDb[kNumPartials] = {0.0f, -30.0f, -42.0f};
  static constexpr float kBrightDb[kNumPartials] = {0.0f, -3.0f, -8.0f};
  static constexpr float kSung = 0.5f;
  // Beat: the lowest pair of a bowl is kBeatHz·Beat² apart, times the bowl's
  // own factor, 1 - kBeatSpread to 1 + kBeatSpread by its slot.
  static constexpr float kBeatHz = 5.0f;
  static constexpr float kBeatSpread = 0.3f;
  // Register: the lowest bowl is the first note of the scale at or above this.
  static constexpr float kLowNote = 36.0f;
  static constexpr float kRegisterSpan = 36.0f;
  // A mode above this share of the sample rate is left out.
  static constexpr float kTopShare = 0.45f;
  // The ear: each of its two resonators is 3 dB down this many cents off the
  // note, and never rings longer than this share of Ring's own time.
  static constexpr float kEarCents = 15.6f;
  static constexpr float kEarOfRing = 0.6f;
  // The drive: what a bowl holds of a held note on its pitch, in dB against
  // the note, at Strike 0 and Strike 1; and how many times stronger the
  // drive is at the top of an attack, at Strike 1.
  static constexpr float kDriveLowDb = -10.0f;
  static constexpr float kDriveHighDb = 2.0f;
  static constexpr float kOnsetBoost = 4.0f;
  // The ceilings: an ear takes in less as what a bowl's two ears hold nears
  // kCeiling (as power, its square) and nothing at it; and every ear takes
  // in less as what all the ears of the table hold nears kTableCeiling.
  static constexpr float kCeiling = 0.56f;
  static constexpr float kTableCeiling = 1.0f;
  // The turn that keeps the lowest pair a quarter turn behind the sound:
  // how fast it closes (1/s), and how far off its own pitch it may hold a
  // bowl (a share of the note, 25 cents).
  static constexpr float kTurnRate = 40.0f;
  static constexpr float kTurnReach = 0.0145f;
  static constexpr float kCross = 0.3f;
  static constexpr float kPairWidth = 0.22f;
  static constexpr float kDampSeconds = 0.012f;  // time constant under the hand
  static constexpr float kSwapSeconds = 0.12f;   // then the bowl is swapped
  static constexpr float kInputLimit = 4.0f;
  static constexpr int kMaxChunk = 256;

  // The scales, as semitones above the root, and how many notes each has.
  static constexpr int kScaleSize[kNumScales] = {5, 5, 7, 7, 3, 6, 5, 5};
  static constexpr int kScaleNotes[kNumScales][7] = {
      {0, 2, 4, 7, 9, 0, 0},     // Major pentatonic
      {0, 3, 5, 7, 10, 0, 0},    // Minor pentatonic
      {0, 2, 4, 5, 7, 9, 11},    // Major
      {0, 2, 3, 5, 7, 8, 10},    // Minor
      {0, 2, 7, 0, 0, 0, 0},     // Fifths: the root, its fifth, the fifth above that
      {0, 2, 4, 6, 8, 10, 0},    // Whole tone
      {0, 2, 3, 7, 8, 0, 0},     // Hirajoshi
      {0, 1, 3, 7, 8, 0, 0},     // Pelog, as near as twelve notes come
  };

  // Step `k` of a scale as a MIDI note: step 0 is the root in octave 1.
  static int note_of_step(int scale, int root, int step) {
    const int size = kScaleSize[scale];
    return 24 + root + 12 * (step / size) + kScaleNotes[scale][step % size];
  }

  // The first step of the scale at or above Register's note.
  static int first_step(int scale, int root, float reg) {
    const float base = kLowNote + kRegisterSpan * reg;
    int step = 0;
    while (static_cast<float>(note_of_step(scale, root, step)) < base - 0.5f) ++step;
    return step;
  }

  // The place of slot `s` between the sides at Spread 1, -1 (left) to 1.
  static float slot_place(int slot) {
    return (static_cast<float>((slot * 5) % kMaxBowls) - 5.5f) * (1.0f / 5.5f);
  }

  // The beat factor of slot `s`: each bowl is out of round by its own amount.
  static float slot_beat(int slot) {
    const float t = static_cast<float>(slot) * 0.618034f;
    return 1.0f - kBeatSpread + 2.0f * kBeatSpread * (t - std::floor(t));
  }

  void init(float sample_rate) {
    using namespace bowls;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    // Control work every 1/1500 s whatever the rate, so what a tick does (a
    // strike's rise, the hold's ramp) lasts the same at 44.1 and at 96 kHz.
    period_ = kit::clamp_int(static_cast<int>(sr / 1500.0f + 0.5f), 8, kMaxChunk);
    const float tick_rate = sr / static_cast<float>(period_);
    tick_seconds_ = 1.0f / tick_rate;
    for (int b = 0; b < kMaxBowls; ++b) {
      bowls_[b] = Bowl();
      bowls_[b].place = slot_place(b);
      bowls_[b].beat = slot_beat(b);
    }
    drive_.set_time(kSmoothingSeconds, sr);
    boost_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    spread_.set_time(kSmoothingSeconds, tick_rate);
    fast_attack_ = kit::time_to_coeff(0.0005f, sr);
    fast_release_ = kit::time_to_coeff(0.015f, sr);
    slow_coeff_ = kit::time_to_coeff(0.04f, sr);
    damp_radius_ = std::exp(-1.0f / (kDampSeconds * sr));
    swap_ticks_ = static_cast<int>(kSwapSeconds * tick_rate + 0.5f);
    hold_samples_ = static_cast<long>(0.25f * sr);
    quiet_ = hold_samples_;
    asleep_ = true;
    counter_ = 0;
    meter_count_ = 0;
    fast_ = slow_ = 0.0f;
    dry_gain_ = 1.0f;
    wet_gain_ = 0.0f;
    table_ = 0.0f;
    for (int k = 0; k < 3; ++k) levels_[k] = phases_[k] = 0.0f;
    for (int id = 0; id < kNumParams; ++id) apply(id);
    tuning_dirty_ = ring_dirty_ = beat_dirty_ = true;
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for the display, four
  // slots to a reading: each slot is a whole number 0..63, and a reading is
  // the four of them as digits to the base 64, lowest slot first: under 2^24,
  // so a float carries it exactly.
  // 0..2: how loud the twelve slots ring, each the power of its bowl's heard
  // modes in dB above -63 dB (0 for silent or empty). A bowl that has left
  // the table and is ringing out is not in it.
  // 3..5: where each bowl is in its beat, the angle between the two modes of
  // its lowest pair in 64ths of a turn (0 is together, 32 opposite).
  // Worked out on the control clock; asleep they read 0.
  float meter(int index) const {
    if (index < 0 || index >= 6 || asleep_) return 0.0f;
    return index < 3 ? levels_[index] : phases_[index - 3];
  }

  // For the harness and the display's test: what stands in slot `s` now (the
  // MIDI note, -1 for none), the note still ringing out there (-1 for none),
  // and whether the table sleeps.
  int slot_note(int slot) const {
    return slot >= 0 && slot < kMaxBowls ? bowls_[slot].note : -1;
  }
  int slot_leaving(int slot) const {
    return slot >= 0 && slot < kMaxBowls ? bowls_[slot].left : -1;
  }
  bool asleep() const { return asleep_; }

  void process(int frames) {
    frames = begin_block(frames);
    int i = 0;
    while (i < frames) {
      if (asleep_) {
        // Asleep: exact silence, and the first sample that carries anything
        // wakes it, so everything counted from the wake is counted from the
        // sound and not from where the host's block happened to begin.
        while (i < frames && in_left_[i] == 0.0f && in_right_[i] == 0.0f) {
          out_left_[i] = 0.0f;
          out_right_[i] = 0.0f;
          ++i;
        }
        if (i >= frames) break;
        wake();
      }
      if (counter_ == 0) {
        tick();
        if (asleep_) continue;
      }
      const int room = period_ - counter_;
      const int len = frames - i < room ? frames - i : room;
      render(i, len);
      counter_ += len;
      if (counter_ >= period_) counter_ = 0;
      i += len;
    }
  }

 private:
  struct Mode {
    float re = 0.0f, im = 0.0f;      // the state: im is what is heard
    float c = 0.0f, s = 0.0f;        // radius times cos and sin of the turn per sample
    float cosw = 1.0f, sinw = 0.0f;  // the turn alone
  };

  // An ear: two resonators in a row on the bowl's note. The first takes the
  // sound in, the second takes the first.
  struct Ear {
    float re1 = 0.0f, im1 = 0.0f;
    float re2 = 0.0f, im2 = 0.0f;
  };

  struct Bowl {
    int note = -1;  // what stands in this slot, -1 for nothing
    int want = -1;  // what the knobs ask for
    int left = -1;  // the bowl that stood here before and is still ringing out
    int damp = 0;   // ticks left under the hand before the swap
    bool damp_left = false;  // the hand is on the one ringing out, not on the one standing
    float hz = 0.0f;
    float place = 0.0f;  // between the sides at Spread 1
    float beat = 1.0f;   // this bowl's share of the beat rate
    Ear ear[2];          // the two that listen: never heard
    float ear_c = 0.0f, ear_s = 0.0f;  // radius times cos and sin of the note's turn
    float ear_in = 0.0f;               // what the first resonator takes of the drive
    float ear_on = 0.0f;               // what the second takes of the first
    Mode mode[2][kNumPartials];  // the pairs that are heard
    Mode gone[2][kNumPartials];  // the pairs of the bowl ringing out
    bool live[kNumPartials] = {false, false, false};
    float owed[2][kNumPartials] = {};  // the amplitude a strike has left each upper mode
    float amp[2] = {0.0f, 0.0f};       // what each ear held at the last tick
    float turn = 0.0f;                 // how far off its own pitch the lowest pair is held, radians a tick
    float hold = 1.0f, hold_step = 0.0f, hold_to = 1.0f;  // how much of the drive it takes
    float gain_l[2] = {}, gain_r[2] = {};                 // each mode's way to the two sides
    float step_l[2] = {}, step_r[2] = {};
    float to_l[2] = {}, to_r[2] = {};
    float gone_l[2] = {}, gone_r[2] = {};  // the same for the bowl ringing out
  };

  // Turn every mode of a pair of sides that sounds through `len` samples and
  // add them, each side through its own gains. Returns nothing: wet_l_/wet_r_.
  void ring(Mode (&modes)[2][kNumPartials], const float* gl, const float* sl, const float* gr,
            const float* sr, float from, int len) {
    for (int side = 0; side < 2; ++side) {
      bool sounding = false;
      for (Mode& m : modes[side]) {
        if (m.re == 0.0f && m.im == 0.0f) continue;
        float re = m.re, im = m.im;
        const float c = m.c, s = m.s;
        if (!sounding) {
          for (int n = 0; n < len; ++n) {
            const float turned = c * re - s * im;
            im = s * re + c * im;
            re = turned;
            sum_[n] = im;
          }
          sounding = true;
        } else {
          for (int n = 0; n < len; ++n) {
            const float turned = c * re - s * im;
            im = s * re + c * im;
            re = turned;
            sum_[n] += im;
          }
        }
        m.re = re;
        m.im = im;
      }
      if (!sounding) continue;
      const float l0 = gl[side], l1 = sl ? sl[side] : 0.0f;
      const float r0 = gr[side], r1 = sr ? sr[side] : 0.0f;
      for (int n = 0; n < len; ++n) {
        const float k = from + static_cast<float>(n);
        wet_l_[n] += sum_[n] * (l0 + l1 * k);
        wet_r_[n] += sum_[n] * (r0 + r1 * k);
      }
    }
  }

  // One stretch of samples between two ticks (or two block edges).
  void render(int at, int len) {
    const float norm = 1.0f / (1.0f + kCross);
    int last_loud = -1;
    bool driven = false;
    for (int n = 0; n < len; ++n) {
      float l, r;
      take_input(at + n, &l, &r);
      // Not a number is silence and an absurd value is held to a bound, here
      // and in the dry path: nothing downstream ever sees one.
      l = l == l ? kit::clamp(l, -kInputLimit, kInputLimit) : 0.0f;
      r = r == r ? kit::clamp(r, -kInputLimit, kInputLimit) : 0.0f;
      dry_l_[n] = l;
      dry_r_[n] = r;
      if (l != 0.0f || r != 0.0f) last_loud = n;
      // The attack: a fast follower of the louder side over a slower copy of
      // itself. Full at a note from silence, gone within about 50 ms, and
      // nothing on a steady sound.
      const float size = kit::max(std::fabs(l), std::fabs(r));
      fast_ = flush_denormal(size + (fast_ - size) * (size > fast_ ? fast_attack_ : fast_release_));
      slow_ = flush_denormal(fast_ + (slow_ - fast_) * slow_coeff_);
      const float onset = kit::clamp((fast_ - 1.4f * slow_) / (fast_ + 1.0e-5f), 0.0f, 1.0f);
      const float gain = drive_.next() * (1.0f + boost_.next() * onset) * norm;
      const float a = (l + kCross * r) * gain;
      const float b = (r + kCross * l) * gain;
      excite_[0][n] = a;
      excite_[1][n] = b;
      if (a != 0.0f || b != 0.0f) driven = true;
      wet_l_[n] = 0.0f;
      wet_r_[n] = 0.0f;
    }

    const float from = static_cast<float>(counter_);
    for (Bowl& bowl : bowls_) {
      if (bowl.left >= 0) ring(bowl.gone, bowl.gone_l, nullptr, bowl.gone_r, nullptr, from, len);
      if (bowl.note < 0 || !bowl.live[0]) continue;
      const float c = bowl.ear_c, s = bowl.ear_s, on = bowl.ear_on;
      const float take = bowl.hold * bowl.ear_in, take_step = bowl.hold_step * bowl.ear_in;
      for (int side = 0; side < 2; ++side) {
        Ear& ear = bowl.ear[side];
        if (!driven && ear.re1 == 0.0f && ear.im1 == 0.0f && ear.re2 == 0.0f && ear.im2 == 0.0f) continue;
        const float* x = excite_[side];
        float re1 = ear.re1, im1 = ear.im1, re2 = ear.re2, im2 = ear.im2;
        for (int n = 0; n < len; ++n) {
          const float in = x[n] * (take + take_step * (from + static_cast<float>(n)));
          const float turned1 = c * re1 - s * im1 + in;
          im1 = s * re1 + c * im1;
          re1 = turned1;
          const float turned2 = c * re2 - s * im2 + on * re1;
          im2 = s * re2 + c * im2 + on * im1;
          re2 = turned2;
        }
        ear.re1 = re1;
        ear.im1 = im1;
        ear.re2 = re2;
        ear.im2 = im2;
      }
      ring(bowl.mode, bowl.gain_l, bowl.step_l, bowl.gain_r, bowl.step_r, from, len);
    }

    for (int n = 0; n < len; ++n) {
      const float wet_l = kit::soft_clip(wet_l_[n]);
      const float wet_r = kit::soft_clip(wet_r_[n]);
      if (std::fabs(wet_l) > kFloor || std::fabs(wet_r) > kFloor) last_loud = n;
      if (!mix_.settled()) set_mix(mix_.next());
      out_left_[at + n] = dry_l_[n] * dry_gain_ + wet_l * wet_gain_;
      out_right_[at + n] = dry_r_[n] * dry_gain_ + wet_r * wet_gain_;
    }
    // Samples since the last one that carried anything, in or out: counted by
    // the sample, so sleep begins on the same tick whatever the block size.
    quiet_ = last_loud >= 0 ? len - 1 - last_loud : quiet_ + len;
  }

  // The control clock: every period_ samples, counted from the wake.
  void tick() {
    using namespace bowls;
    if (quiet_ >= hold_samples_) {
      fall_asleep();
      return;
    }
    const float sr = sample_rate();
    if (tuning_dirty_) retarget();
    if (ring_dirty_) {
      for (int p = 0; p < kNumPartials; ++p) {
        // 60 dB down in Ring (times the partial's share of it).
        const float rate = -6.907755f / (param(kRing) * kPartialRing[p] * sr);
        radius_[p] = std::exp(rate);
        tick_decay_[p] = std::exp(rate * static_cast<float>(period_));
      }
    }
    const float spread = spread_.next();
    const bool placed = spread != spread_seen_;
    spread_seen_ = spread;
    const float ramp = 1.0f / static_cast<float>(period_);
    // What the whole table took in at the last tick holds every ear back.
    const float room = kit::clamp(1.0f - table_ * (1.0f / (kTableCeiling * kTableCeiling)), 0.0f, 1.0f);
    float held = 0.0f;

    for (Bowl& bowl : bowls_) {
      // Land the ramps of the tick before on their targets.
      bowl.hold = bowl.hold_to;
      bowl.hold_step = 0.0f;
      for (int side = 0; side < 2; ++side) {
        bowl.gain_l[side] = bowl.to_l[side];
        bowl.gain_r[side] = bowl.to_r[side];
        bowl.step_l[side] = bowl.step_r[side] = 0.0f;
      }
      lay(bowl, spread);
      if (bowl.left >= 0 && !(bowl.damp > 0 && bowl.damp_left)) keep_gone(bowl);
      if (bowl.note < 0 || (bowl.damp > 0 && !bowl.damp_left)) continue;
      if (beat_dirty_) tune(bowl);
      if (ring_dirty_) tune_ear(bowl);
      if (placed) {
        place(bowl, spread);
        for (int side = 0; side < 2; ++side) {
          bowl.step_l[side] = (bowl.to_l[side] - bowl.gain_l[side]) * ramp;
          bowl.step_r[side] = (bowl.to_r[side] - bowl.gain_r[side]) * ramp;
        }
      }
      held += follow(bowl, room);
    }
    table_ = held;
    tuning_dirty_ = ring_dirty_ = beat_dirty_ = false;
    if (meter_count_ == 0) read_levels();
    if (++meter_count_ >= kMeterTicks) meter_count_ = 0;
  }

  static constexpr float kFloor = 1.0e-7f;    // -140 dBFS: under it for hold_samples_, asleep
  static constexpr float kSilent = 1.0e-14f;  // the same as a bowl's power: nothing left to ring out
  static constexpr int kMeterTicks = 8;

  static void flush(Mode& m) {
    if (m.re * m.re + m.im * m.im < 1.0e-24f) m.re = m.im = 0.0f;
  }

  static float power_of(const Mode (&modes)[2][kNumPartials]) {
    float power = 0.0f;
    for (int side = 0; side < 2; ++side) {
      for (const Mode& m : modes[side]) power += m.re * m.re + m.im * m.im;
    }
    return power;
  }

  // The table: stand the bowl the knobs ask for in this slot. The one that
  // stood there goes on ringing as the slot's second bowl; if a second one
  // still rings there, a hand goes on the quieter of the two first.
  void lay(Bowl& bowl, float spread) {
    if (bowl.damp > 0) {
      if (--bowl.damp > 0) return;
      // The hand comes off a bowl that is silent now.
      if (bowl.damp_left) {
        drop_gone(bowl);
        if (bowl.want == bowl.note) return;
        leave(bowl);
      }
      adopt(bowl, spread);
      return;
    }
    if (bowl.want == bowl.note) return;
    if (bowl.note < 0 || power_of(bowl.mode) < kSilent) {
      adopt(bowl, spread);  // nothing to ring out
      return;
    }
    if (bowl.left < 0) {
      leave(bowl);
      adopt(bowl, spread);
      return;
    }
    if (bowl.left == bowl.want) {
      // The bowl asked for is the one ringing out here: the two change places.
      Mode keep[2][kNumPartials];
      float keep_l[2], keep_r[2];
      const int was = bowl.note;
      for (int side = 0; side < 2; ++side) {
        for (int p = 0; p < kNumPartials; ++p) keep[side][p] = bowl.mode[side][p];
        keep_l[side] = bowl.gain_l[side];
        keep_r[side] = bowl.gain_r[side];
      }
      adopt(bowl, spread);
      for (int side = 0; side < 2; ++side) {
        for (int p = 0; p < kNumPartials; ++p) bowl.gone[side][p] = freed(keep[side][p], p);
        bowl.gone_l[side] = keep_l[side];
        bowl.gone_r[side] = keep_r[side];
      }
      bowl.left = was;
      return;
    }
    bowl.damp = swap_ticks_;
    bowl.damp_left = power_of(bowl.gone) < power_of(bowl.mode);
    if (bowl.damp_left) {
      for (int side = 0; side < 2; ++side) {
        for (Mode& m : bowl.gone[side]) {
          m.c = damp_radius_ * m.cosw;
          m.s = damp_radius_ * m.sinw;
        }
      }
      return;
    }
    // A hand on the bowl that stands: it takes nothing in and dies in a few ms.
    for (int side = 0; side < 2; ++side) {
      for (Mode& m : bowl.mode[side]) {
        m.c = damp_radius_ * m.cosw;
        m.s = damp_radius_ * m.sinw;
      }
    }
    bowl.ear_c *= damp_radius_;
    bowl.ear_s *= damp_radius_;
    bowl.hold_to = 0.0f;
    bowl.hold_step = (bowl.hold_to - bowl.hold) / static_cast<float>(period_);
  }

  // A mode as it rings when nothing feeds it: on its own pitch, dying at Ring.
  Mode freed(Mode m, int p) const {
    m.c = radius_[p] * m.cosw;
    m.s = radius_[p] * m.sinw;
    return m;
  }

  // The bowl that stands becomes the one ringing out.
  void leave(Bowl& bowl) {
    for (int side = 0; side < 2; ++side) {
      for (int p = 0; p < kNumPartials; ++p) bowl.gone[side][p] = freed(bowl.mode[side][p], p);
      bowl.gone_l[side] = bowl.gain_l[side];
      bowl.gone_r[side] = bowl.gain_r[side];
    }
    bowl.left = bowl.note;
  }

  void drop_gone(Bowl& bowl) {
    for (int side = 0; side < 2; ++side) {
      for (Mode& m : bowl.gone[side]) m.re = m.im = 0.0f;
    }
    bowl.left = -1;
  }

  // The bowl ringing out: it dies at Ring, and is gone once nothing is left.
  void keep_gone(Bowl& bowl) {
    for (int side = 0; side < 2; ++side) {
      for (int p = 0; p < kNumPartials; ++p) {
        flush(bowl.gone[side][p]);
        if (ring_dirty_) bowl.gone[side][p] = freed(bowl.gone[side][p], p);
      }
    }
    if (power_of(bowl.gone) < kSilent) drop_gone(bowl);
  }

  // The heard modes of a bowl follow its ears, once a tick. `room` is how
  // much the table as a whole still lets in; returns what the ears hold.
  float follow(Bowl& bowl, float room) {
    const float ramp = 1.0f / static_cast<float>(period_);
    float heard = 0.0f;
    float rise[2], near[2], ur[2], ui[2];
    for (int side = 0; side < 2; ++side) {
      Ear& ear = bowl.ear[side];
      float p1 = ear.re1 * ear.re1 + ear.im1 * ear.im1;
      float p2 = ear.re2 * ear.re2 + ear.im2 * ear.im2;
      if (p1 < 1.0e-24f && p2 < 1.0e-24f) {
        ear = Ear();
        p1 = p2 = 0.0f;
      }
      heard += p1;
      const float amp = std::sqrt(p2);
      rise[side] = amp > bowl.amp[side] ? amp - bowl.amp[side] : 0.0f;
      bowl.amp[side] = amp;
      // The sound's own phase on this note: the first resonator is as far
      // behind the sound as the second is behind the first, so the sound is
      // at the first one's angle twice less the second one's.
      const float a = ear.re1 * ear.re1 - ear.im1 * ear.im1, b = 2.0f * ear.re1 * ear.im1;
      ur[side] = a * ear.re2 + b * ear.im2;
      ui[side] = b * ear.re2 - a * ear.im2;
      const float size = std::sqrt(ur[side] * ur[side] + ui[side] * ui[side]);
      // How near the note the sound is: 1 on it, a half where the ear is
      // 3 dB down, next to nothing a semitone off (the two in step or not).
      const float dot = ear.re1 * ear.re2 + ear.im1 * ear.im2;
      near[side] = 0.0f;
      if (p1 > 1.0e-18f && p2 > 1.0e-18f && size > 0.0f) {
        ur[side] /= size;
        ui[side] /= size;
        if (dot > 0.0f) near[side] = kit::min(1.0f, dot * dot / (p1 * p2));
      } else {
        ur[side] = 1.0f;
        ui[side] = 0.0f;
      }
    }
    // Two sides in opposite phase: the second mode goes with the first.
    if (ur[0] * ur[1] + ui[0] * ui[1] < 0.0f) {
      ur[1] = -ur[1];
      ui[1] = -ui[1];
    }

    // The turn of the lowest pair this tick: towards a quarter turn behind
    // the sound (the modes in line with it, since what is heard of a mode is
    // its second part), as hard as the ears are fed and the sound is on the
    // note. The pair turns as one, so its beat is left alone.
    float bend = 0.0f;
    {
      const Mode& m0 = bowl.mode[0][0];
      const Mode& m1 = bowl.mode[1][0];
      const float has = std::sqrt(m0.re * m0.re + m0.im * m0.im) + std::sqrt(m1.re * m1.re + m1.im * m1.im);
      const float fed = bowl.amp[0] + bowl.amp[1];
      float pull = 0.0f, off = 0.0f, share = 0.0f;
      if (has > 1.0e-9f && fed > 1.0e-9f) {
        const float r0 = m0.re * ur[0] + m0.im * ui[0], i0 = m0.im * ur[0] - m0.re * ui[0];
        const float r1 = m1.re * ur[1] + m1.im * ui[1], i1 = m1.im * ur[1] - m1.re * ui[1];
        const float pr = r0 * r1 - i0 * i1, pi = r0 * i1 + i0 * r1;
        if (pr != 0.0f || pi != 0.0f) off = 0.5f * std::atan2(pi, pr);
        share = kit::clamp(fed / has, 0.0f, 1.0f);
        pull = share * kit::min(near[0], near[1]);
      }
      const float rate = kTurnRate * tick_seconds_;
      bend = -(rate * pull * off + bowl.turn);
      const float reach = kit::kTwoPi * bowl.hz * kTurnReach * tick_seconds_;
      bowl.turn = kit::clamp(bowl.turn + 0.25f * rate * rate * pull * off, -reach, reach);
      // Left alone (its ears holding under half of what it rings with), the
      // bowl goes back to its own pitch within a twentieth of a second.
      bowl.turn *= 1.0f - kit::clamp(1.0f - 2.0f * share, 0.0f, 1.0f) * kit::min(1.0f, tick_seconds_ * 20.0f);
      if (std::fabs(bowl.turn) < 1.0e-12f) bowl.turn = 0.0f;
    }

    for (int side = 0; side < 2; ++side) {
      const float amp = bowl.amp[side];
      for (int p = 0; p < kNumPartials; ++p) {
        Mode& m = bowl.mode[side][p];
        flush(m);
        float radius = radius_[p];
        if (bowl.live[p]) {
          // What the mode should hold by the next tick. The lowest pair
          // keeps up with its ear. An upper one is owed its share of every
          // gain the ear makes, which then dies at the partial's own rate
          // down to the part of it a sung bowl keeps, and never more than
          // that share of what the ear holds.
          float target = amp;
          if (p > 0) {
            target = kit::min(bowl.owed[side][p] * tick_decay_[p] + share_[p] * rise[side], share_[p] * amp);
            bowl.owed[side][p] = target;
            target = kit::max(target, kSung * share_[p] * amp);
          }
          const float has = std::sqrt(m.re * m.re + m.im * m.im);
          if (target > has * tick_decay_[p] && target > 1.0e-9f) {
            // Start it if it is still: the lowest pair in line with the
            // sound, an upper one in the part that is not heard. Then let it
            // come to the target over the tick, by half again at the most
            // (a rise of a few ms).
            const float seed = 0.05f * target;
            float now = has;
            if (has < seed) {
              if (p == 0) {
                m.re = seed * ur[side];
                m.im = seed * ui[side];
              } else if (has > 1.0e-12f) {
                m.re *= seed / has;
                m.im *= seed / has;
              } else {
                m.re = seed;
                m.im = 0.0f;
              }
              now = seed;
            }
            radius = std::exp(std::log(kit::min(target / now, 1.5f)) * ramp);
          }
        }
        if (p == 0 && bend != 0.0f) {
          const float turn = bend * ramp;
          radius *= 1.0f - 0.5f * turn * turn;
          m.c = radius * (m.cosw - turn * m.sinw);
          m.s = radius * (m.sinw + turn * m.cosw);
        } else {
          m.c = radius * m.cosw;
          m.s = radius * m.sinw;
        }
      }
    }
    // The hold: an ear takes less of the drive as the two near the
    // ceiling, and none at it; and less again as the table fills.
    bowl.hold_to = room * kit::clamp(1.0f - heard * (1.0f / (kCeiling * kCeiling)), 0.0f, 1.0f);
    bowl.hold_step = (bowl.hold_to - bowl.hold) * ramp;
    return heard;
  }

  // The notes the knobs ask for, each in the slot of its step of the scale.
  void retarget() {
    using namespace bowls;
    const int scale = kit::clamp_int(static_cast<int>(param(kScale) + 0.5f), 0, kNumScales - 1);
    const int root = kit::clamp_int(static_cast<int>(param(kRoot) + 0.5f), 0, 11);
    const int count = kit::clamp_int(static_cast<int>(param(bowls::kBowls) + 0.5f), 3, kMaxBowls);
    const int first = first_step(scale, root, param(kRegister));
    for (Bowl& bowl : bowls_) bowl.want = -1;
    for (int step = first; step < first + count; ++step) {
      bowls_[step % kMaxBowls].want = note_of_step(scale, root, step);
    }
  }

  // The turn of every heard mode of a bowl from its note and Beat.
  void tune(Bowl& bowl) {
    using namespace bowls;
    const double sr = sample_rate();
    const float beat = param(kBeat);
    bowl.hz = kit::midi_to_hz(static_cast<float>(bowl.note));
    for (int p = 0; p < kNumPartials; ++p) {
      const double centre = static_cast<double>(bowl.hz) * kRatio[p];
      const double apart = static_cast<double>(kBeatHz * beat * beat * bowl.beat * kPartialBeat[p]);
      bowl.live[p] = centre + 0.5 * apart < static_cast<double>(kTopShare) * sr;
      for (int side = 0; side < 2; ++side) {
        const double hz = centre + (side == 0 ? -0.5 : 0.5) * apart;
        const double w = 2.0 * 3.14159265358979323846 * hz / sr;
        bowl.mode[side][p].cosw = static_cast<float>(std::cos(w));
        bowl.mode[side][p].sinw = static_cast<float>(std::sin(w));
      }
    }
  }

  // The ears of a bowl: on its note, as wide as kEarCents says, or as wide
  // as a resonator that rings no longer than Ring lets it has to be. What
  // they take in is set so that a held note on the bowl's pitch reads, in
  // both resonators, as the note's own size.
  void tune_ear(Bowl& bowl) {
    using namespace bowls;
    const double sr = sample_rate();
    const double hz = static_cast<double>(kit::midi_to_hz(static_cast<float>(bowl.note)));
    const double wide = hz * (std::exp2(static_cast<double>(kEarCents) / 1200.0) - 1.0);
    const double of_note = 1.0 / (2.0 * 3.14159265358979323846 * wide);
    const double of_ring = static_cast<double>(kEarOfRing * param(kRing)) / 6.907755;
    const double radius = std::exp(-1.0 / ((of_note < of_ring ? of_note : of_ring) * sr));
    const double w = 2.0 * 3.14159265358979323846 * hz / sr;
    bowl.ear_c = static_cast<float>(radius * std::cos(w));
    bowl.ear_s = static_cast<float>(radius * std::sin(w));
    bowl.ear_on = static_cast<float>(1.0 - radius);
    bowl.ear_in = static_cast<float>(2.0 * (1.0 - radius));
  }

  // Where the two modes of a bowl's pairs go between the sides.
  void place(Bowl& bowl, float spread) {
    for (int side = 0; side < 2; ++side) {
      const float pan = spread * (bowl.place + (side == 0 ? -kPairWidth : kPairWidth));
      kit::pan_gains(pan, &bowl.to_l[side], &bowl.to_r[side]);
    }
  }

  // Stand the bowl the knobs ask for in a slot whose own bowl is silent, has
  // left, or was never there. If it is the bowl still ringing out in this
  // slot, it comes back as it is.
  void adopt(Bowl& bowl, float spread) {
    const bool back = bowl.want >= 0 && bowl.want == bowl.left;
    bowl.note = bowl.want;
    bowl.damp = 0;
    for (int side = 0; side < 2; ++side) {
      for (int p = 0; p < kNumPartials; ++p) {
        bowl.mode[side][p].re = bowl.mode[side][p].im = 0.0f;
        bowl.owed[side][p] = 0.0f;
      }
      bowl.ear[side] = Ear();
      bowl.amp[side] = 0.0f;
    }
    bowl.turn = 0.0f;
    bowl.hold = bowl.hold_to = 1.0f;
    bowl.hold_step = 0.0f;
    if (bowl.note < 0) return;
    tune(bowl);
    tune_ear(bowl);
    place(bowl, spread);
    for (int side = 0; side < 2; ++side) {
      bowl.gain_l[side] = bowl.to_l[side];
      bowl.gain_r[side] = bowl.to_r[side];
      bowl.step_l[side] = bowl.step_r[side] = 0.0f;
    }
    if (!back) return;
    const float ramp = 1.0f / static_cast<float>(period_);
    for (int side = 0; side < 2; ++side) {
      for (int p = 0; p < kNumPartials; ++p) {
        bowl.mode[side][p].re = bowl.gone[side][p].re;
        bowl.mode[side][p].im = bowl.gone[side][p].im;
      }
      bowl.gain_l[side] = bowl.gone_l[side];
      bowl.gain_r[side] = bowl.gone_r[side];
      bowl.step_l[side] = (bowl.to_l[side] - bowl.gain_l[side]) * ramp;
      bowl.step_r[side] = (bowl.to_r[side] - bowl.gain_r[side]) * ramp;
    }
    drop_gone(bowl);
  }

  void read_levels() {
    for (int group = 0; group < 3; ++group) {
      int packed = 0, turned = 0;
      for (int k = 3; k >= 0; --k) {
        const Bowl& bowl = bowls_[4 * group + k];
        float power = 0.0f;
        int phase = 0;
        if (bowl.note >= 0) {
          power = power_of(bowl.mode);
          const Mode& a = bowl.mode[0][0];
          const Mode& b = bowl.mode[1][0];
          const float cross = b.im * a.re - b.re * a.im;
          const float dot = a.re * b.re + a.im * b.im;
          if (cross != 0.0f || dot != 0.0f) {
            const float turn = std::atan2(cross, dot) * (1.0f / kit::kTwoPi);
            phase = static_cast<int>(std::floor(turn * 64.0f + 0.5f)) & 63;
          }
        }
        const int level = power > 0.0f ? static_cast<int>(63.5f + 10.0f * std::log10(power)) : 0;
        packed = packed * 64 + kit::clamp_int(level, 0, 63);
        turned = turned * 64 + phase;
      }
      levels_[group] = static_cast<float>(packed);
      phases_[group] = static_cast<float>(turned);
    }
  }

  // Asleep every slot is empty, so the first tick after the wake stands the
  // bowls the knobs ask for then: a knob moved in the silence snaps.
  void fall_asleep() {
    asleep_ = true;
    table_ = 0.0f;
    for (Bowl& bowl : bowls_) {
      drop_gone(bowl);
      bowl.want = -1;
      adopt(bowl, 0.0f);
    }
    for (int k = 0; k < 3; ++k) levels_[k] = phases_[k] = 0.0f;
  }

  void wake() {
    asleep_ = false;
    quiet_ = 0;
    counter_ = 0;
    meter_count_ = 0;
    fast_ = slow_ = 0.0f;
    drive_.snap(drive_.target);
    boost_.snap(boost_.target);
    spread_.snap(spread_.target);
    spread_seen_ = -1.0f;
    mix_.snap(mix_.target);
    set_mix(mix_.value);
    tuning_dirty_ = ring_dirty_ = beat_dirty_ = true;
  }

  // Equal power: the bowls are not the sound that rang them. The ends are exact.
  void set_mix(float mix) {
    kit::equal_power(mix, &dry_gain_, &wet_gain_);
    if (mix <= 0.0f) wet_gain_ = 0.0f;
    if (mix >= 1.0f) dry_gain_ = 0.0f;
  }

  void set_drive() {
    using namespace bowls;
    drive_.set(kit::db_to_gain(kit::lerp(kDriveLowDb, kDriveHighDb, param(kStrike))), primed());
    boost_.set(kOnsetBoost * param(kStrike), primed());
  }

  void apply(int id) {
    using namespace bowls;
    switch (id) {
      case kRoot:
      case kScale:
      case bowls::kBowls:
      case kRegister:
        tuning_dirty_ = true;
        break;
      case kRing:
        ring_dirty_ = true;
        break;
      case kBeat:
        beat_dirty_ = true;
        break;
      case kStrike:
        set_drive();
        break;
      case kMetal:
        for (int p = 0; p < kNumPartials; ++p) {
          share_[p] = kit::db_to_gain(kit::lerp(kDullDb[p], kBrightDb[p], param(kMetal)));
        }
        break;
      case kSpread:
        spread_.set(param(kSpread), primed());
        break;
      case kMix:
        mix_.set(param(kMix), primed());
        if (!primed()) set_mix(param(kMix));
        break;
      default:
        break;
    }
  }

  Bowl bowls_[kMaxBowls];
  float excite_[2][kMaxChunk] = {};
  float dry_l_[kMaxChunk] = {}, dry_r_[kMaxChunk] = {};
  float wet_l_[kMaxChunk] = {}, wet_r_[kMaxChunk] = {};
  float sum_[kMaxChunk] = {};
  kit::Smoother drive_, boost_, mix_, spread_;
  float radius_[kNumPartials] = {1.0f, 1.0f, 1.0f};
  float tick_decay_[kNumPartials] = {1.0f, 1.0f, 1.0f};
  float share_[kNumPartials] = {1.0f, 0.0f, 0.0f};
  float levels_[3] = {0.0f, 0.0f, 0.0f};
  float phases_[3] = {0.0f, 0.0f, 0.0f};
  float table_ = 0.0f;  // what every ear of the table held at the last tick, as power
  float fast_ = 0.0f, slow_ = 0.0f;
  float fast_attack_ = 0.0f, fast_release_ = 0.0f, slow_coeff_ = 0.0f;
  float damp_radius_ = 0.99f;
  float tick_seconds_ = 1.0f / 1500.0f;
  float spread_seen_ = -1.0f;
  float dry_gain_ = 1.0f, wet_gain_ = 0.0f;
  long hold_samples_ = 12000;
  long quiet_ = 12000;
  int period_ = 32;
  int counter_ = 0;
  int swap_ticks_ = 180;
  int meter_count_ = 0;
  bool asleep_ = true;
  bool tuning_dirty_ = true, ring_dirty_ = true, beat_dirty_ = true;
};

}  // namespace livemix
