#pragma once

// Bowls: a table of metal singing bowls tuned to a key. The sound that passes
// over them sets ringing the bowls it shares frequencies with.
//
//   in L ─┬───────────────────────────────────────────────────────────► dry ─┐
//   in R ─┤                                                                  (+)─► out
//         └─► onset boost ─► × drive ─► ears ─► bowls (up to 12) ─► pan ─► clip ─┘
//                (Strike)        ▲       │        each: three pairs of modes
//                                └ hold ◄┘  (an ear takes less in as it nears its ceiling)
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
// - The sound does not drive the heard modes. It drives the bowl's two EARS:
//   two more modes exactly on the bowl's note, ringing as long as the bowl
//   does and never heard. An ear is a resonator a fraction of a hertz wide,
//   so it holds what was played on its note and little else. Were the heard
//   pair driven itself, a held note would fall in the gap between its two
//   modes; and nothing played can reach the upper partials at all (2.77
//   times a note is a quarter tone off the scale).
// - The heard modes follow the ears, once a tick (1/1500 s). Each mode of the
//   lowest pair is raised to what its ear holds whenever it has less, and
//   left to die at its own rate when it has more: so the bowl sings for as
//   long as its note is held and rings on after. Each upper partial is owed
//   its share (Metal) of every GAIN the ear makes, which then dies at the
//   partial's own, faster rate: a bowl that is touched rings bright and
//   settles to a hum, as a struck one does. A mode is raised by turning it
//   with a radius a little over one for a tick, never by a step.
// - One ear of a bowl listens mostly to the left input and one mostly to the
//   right (kCross); the two modes of each pair follow one ear each and sit a
//   little apart around the bowl's place (kPairWidth). A mono sound rings
//   both alike, an anti-phase one still rings both, and the beat moves
//   between the sides. The wet path is stereo: nothing is summed to mono.
// - Strike is how easily the sound gets in: the drive, and a boost of the
//   drive for the few tens of ms after an attack (a fast follower over a slow
//   one), when the sound is wide in pitch and so reaches the bowls near it.
// - Level: an ear takes less of the sound in as it nears a ceiling
//   (kCeiling) and nothing at it, so a held note cannot pile up; the drive is
//   trimmed against Ring so a short ring is not a quiet one; and the sum of
//   the bowls ends in kit::soft_clip, so the wet side never passes full scale.
// - The bowls are the first `Bowls` notes of the scale at or above Register,
//   each in the slot (place between the sides, beat rate) of its step of the
//   scale, so moving Register takes one bowl off one end and stands one at
//   the other. A slot whose note changes is damped first (a hand on the
//   bowl, kDampSeconds) and then swapped: no retune ever clicks or slides.
// - Sleep is counted in samples and decided on the tick, and the first
//   sample of a sound wakes it, so the output is the same at every block
//   size across a silence. Asleep the table is cleared: knobs moved in the
//   silence snap.
//
// Storage: 96 modes of six floats, a few dozen floats a bowl and seven
// scratch rows of 256 floats; no delay lines, nothing sized by the sample
// rate. All of it is reset in init(). Nothing here runs by itself: there is
// no LFO, and the beat is the two modes of a pair.

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
  // with, in dB under it, at Metal 0 and at Metal 1.
  static constexpr float kDullDb[kNumPartials] = {0.0f, -30.0f, -42.0f};
  static constexpr float kBrightDb[kNumPartials] = {0.0f, -3.0f, -8.0f};
  // Beat: the lowest pair of a bowl is kBeatHz·Beat² apart, times the bowl's
  // own factor, 1 - kBeatSpread to 1 + kBeatSpread by its slot.
  static constexpr float kBeatHz = 5.0f;
  static constexpr float kBeatSpread = 0.3f;
  // Register: the lowest bowl is the first note of the scale at or above this.
  static constexpr float kLowNote = 36.0f;
  static constexpr float kRegisterSpan = 36.0f;
  // A mode above this share of the sample rate is left out.
  static constexpr float kTopShare = 0.45f;
  // The drive: amplitude a bowl gains per second from a full-scale sine on
  // its note, at Strike 0 and Strike 1, at the reference ring; and how many
  // times stronger the drive is at the top of an attack, at Strike 1.
  static constexpr float kDriveLow = 1.0f;
  static constexpr float kDriveHigh = 6.0f;
  static constexpr float kOnsetBoost = 24.0f;
  static constexpr float kRefRingSeconds = 10.0f;
  static constexpr float kCeiling = 0.125f;
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
  // modes in dB above -63 dB (0 for silent or empty).
  // 3..5: where each bowl is in its beat, the angle between the two modes of
  // its lowest pair in 64ths of a turn (0 is together, 32 opposite).
  // Worked out on the control clock; asleep they read 0.
  float meter(int index) const {
    if (index < 0 || index >= 6 || asleep_) return 0.0f;
    return index < 3 ? levels_[index] : phases_[index - 3];
  }

  // For the harness and the display's test: what stands in slot `s` now (the
  // MIDI note, -1 for none), and the slot of the lowest bowl.
  int slot_note(int slot) const {
    return slot >= 0 && slot < kMaxBowls ? bowls_[slot].note : -1;
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

  struct Bowl {
    int note = -1;  // what rings in this slot, -1 for nothing
    int want = -1;  // what the knobs ask for
    int damp = 0;   // ticks left under the hand before the swap
    float hz = 0.0f;
    float place = 0.0f;  // between the sides at Spread 1
    float beat = 1.0f;   // this bowl's share of the beat rate
    Mode ear[2];                 // the two that listen, on the note itself: never heard
    Mode mode[2][kNumPartials];  // the pairs that are heard
    bool live[kNumPartials] = {false, false, false};
    float owed[2][kNumPartials] = {};  // the amplitude a strike has left each upper mode
    float amp[2] = {0.0f, 0.0f};       // what each ear held at the last tick
    float hold = 1.0f, hold_step = 0.0f, hold_to = 1.0f;  // how much of the drive it takes
    float gain_l[2] = {}, gain_r[2] = {};                 // each mode's way to the two sides
    float step_l[2] = {}, step_r[2] = {};
    float to_l[2] = {}, to_r[2] = {};
  };

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
      if (bowl.note < 0 || !bowl.live[0]) continue;
      for (int side = 0; side < 2; ++side) {
        Mode& ear = bowl.ear[side];
        if (driven || ear.re != 0.0f || ear.im != 0.0f) {
          const float* x = excite_[side];
          float re = ear.re, im = ear.im;
          const float c = ear.c, s = ear.s;
          for (int n = 0; n < len; ++n) {
            const float hold = bowl.hold + bowl.hold_step * (from + static_cast<float>(n));
            const float turned = c * re - s * im + x[n] * hold;
            im = s * re + c * im;
            re = turned;
          }
          ear.re = re;
          ear.im = im;
        }
        bool sounding = false;
        for (Mode& m : bowl.mode[side]) {
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
        const float gl = bowl.gain_l[side], sl = bowl.step_l[side];
        const float gr = bowl.gain_r[side], sr = bowl.step_r[side];
        for (int n = 0; n < len; ++n) {
          const float k = from + static_cast<float>(n);
          wet_l_[n] += sum_[n] * (gl + sl * k);
          wet_r_[n] += sum_[n] * (gr + sr * k);
        }
      }
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

    for (Bowl& bowl : bowls_) {
      // Land the ramps of the tick before on their targets.
      bowl.hold = bowl.hold_to;
      bowl.hold_step = 0.0f;
      for (int side = 0; side < 2; ++side) {
        bowl.gain_l[side] = bowl.to_l[side];
        bowl.gain_r[side] = bowl.to_r[side];
        bowl.step_l[side] = bowl.step_r[side] = 0.0f;
      }
      if (bowl.want != bowl.note && bowl.damp == 0) {
        if (bowl.note < 0) {
          adopt(bowl, spread);
        } else {
          // A hand on the bowl: it takes nothing in and dies in a few ms.
          bowl.damp = swap_ticks_;
          for (int side = 0; side < 2; ++side) {
            bowl.ear[side].c = damp_radius_ * bowl.ear[side].cosw;
            bowl.ear[side].s = damp_radius_ * bowl.ear[side].sinw;
            for (Mode& m : bowl.mode[side]) {
              m.c = damp_radius_ * m.cosw;
              m.s = damp_radius_ * m.sinw;
            }
          }
          bowl.hold_to = 0.0f;
          bowl.hold_step = (bowl.hold_to - bowl.hold) * ramp;
        }
      }
      if (bowl.damp > 0) {
        if (--bowl.damp > 0) continue;
        adopt(bowl, spread);
      }
      if (bowl.note < 0) continue;
      if (beat_dirty_) tune(bowl);
      if (placed) {
        place(bowl, spread);
        for (int side = 0; side < 2; ++side) {
          bowl.step_l[side] = (bowl.to_l[side] - bowl.gain_l[side]) * ramp;
          bowl.step_r[side] = (bowl.to_r[side] - bowl.gain_r[side]) * ramp;
        }
      }
      float heard = 0.0f;
      for (int side = 0; side < 2; ++side) {
        Mode& ear = bowl.ear[side];
        flush(ear);
        ear.c = radius_[0] * ear.cosw;
        ear.s = radius_[0] * ear.sinw;
        const float power = ear.re * ear.re + ear.im * ear.im;
        const float amp = std::sqrt(power);
        const float rise = amp > bowl.amp[side] ? amp - bowl.amp[side] : 0.0f;
        bowl.amp[side] = amp;
        heard += power;
        for (int p = 0; p < kNumPartials; ++p) {
          Mode& m = bowl.mode[side][p];
          flush(m);
          float radius = radius_[p];
          if (bowl.live[p]) {
            // What the mode should hold by the next tick. The lowest pair
            // keeps up with its ear. An upper one is owed its share of every
            // gain the ear makes, which then dies at the partial's own rate,
            // and never more than that share of what the ear holds.
            float target = amp;
            if (p > 0) {
              target = kit::min(bowl.owed[side][p] * tick_decay_[p] + share_[p] * rise,
                                share_[p] * amp);
              bowl.owed[side][p] = target;
            }
            const float has = std::sqrt(m.re * m.re + m.im * m.im);
            if (target > has * tick_decay_[p] && target > 1.0e-9f) {
              // Start it if it is still: the lowest pair in step with its
              // ear, an upper one in the part that is not heard. Then let it
              // come to the target over the tick, by half again at the most
              // (a rise of a few ms).
              const float seed = 0.05f * target;
              float now = has;
              if (has < seed) {
                if (p == 0) {
                  m.re = ear.re * (seed / amp);
                  m.im = ear.im * (seed / amp);
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
          m.c = radius * m.cosw;
          m.s = radius * m.sinw;
        }
      }
      // The hold: an ear takes less of the drive as the two near the
      // ceiling, and none at it.
      bowl.hold_to = kit::clamp(1.0f - heard * (1.0f / (kCeiling * kCeiling)), 0.0f, 1.0f);
      bowl.hold_step = (bowl.hold_to - bowl.hold) * ramp;
    }
    tuning_dirty_ = ring_dirty_ = beat_dirty_ = false;
    if (meter_count_ == 0) read_levels();
    if (++meter_count_ >= kMeterTicks) meter_count_ = 0;
  }

  static constexpr float kFloor = 1.0e-7f;  // -140 dBFS: under it for hold_samples_, asleep
  static constexpr int kMeterTicks = 8;

  static void flush(Mode& m) {
    if (m.re * m.re + m.im * m.im < 1.0e-24f) m.re = m.im = 0.0f;
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

  // The turn of every mode of a bowl from its note and Beat.
  void tune(Bowl& bowl) {
    using namespace bowls;
    const double sr = sample_rate();
    const float beat = param(kBeat);
    bowl.hz = kit::midi_to_hz(static_cast<float>(bowl.note));
    {
      const double w = 2.0 * 3.14159265358979323846 * static_cast<double>(bowl.hz) / sr;
      for (Mode& ear : bowl.ear) {
        ear.cosw = static_cast<float>(std::cos(w));
        ear.sinw = static_cast<float>(std::sin(w));
      }
    }
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

  // Where the two modes of a bowl's pairs go between the sides.
  void place(Bowl& bowl, float spread) {
    for (int side = 0; side < 2; ++side) {
      const float pan = spread * (bowl.place + (side == 0 ? -kPairWidth : kPairWidth));
      kit::pan_gains(pan, &bowl.to_l[side], &bowl.to_r[side]);
    }
  }

  // Stand the bowl the knobs ask for in a slot that is empty or has been damped.
  void adopt(Bowl& bowl, float spread) {
    bowl.note = bowl.want;
    bowl.damp = 0;
    for (int side = 0; side < 2; ++side) {
      for (int p = 0; p < kNumPartials; ++p) {
        bowl.mode[side][p].re = bowl.mode[side][p].im = 0.0f;
        bowl.owed[side][p] = 0.0f;
      }
      bowl.ear[side].re = bowl.ear[side].im = 0.0f;
      bowl.amp[side] = 0.0f;
    }
    bowl.hold = bowl.hold_to = 1.0f;
    bowl.hold_step = 0.0f;
    if (bowl.note < 0) return;
    tune(bowl);
    place(bowl, spread);
    for (int side = 0; side < 2; ++side) {
      bowl.gain_l[side] = bowl.to_l[side];
      bowl.gain_r[side] = bowl.to_r[side];
      bowl.step_l[side] = bowl.step_r[side] = 0.0f;
    }
  }

  void read_levels() {
    for (int group = 0; group < 3; ++group) {
      int packed = 0, turned = 0;
      for (int k = 3; k >= 0; --k) {
        const Bowl& bowl = bowls_[4 * group + k];
        float power = 0.0f;
        int phase = 0;
        if (bowl.note >= 0) {
          for (int side = 0; side < 2; ++side) {
            for (const Mode& m : bowl.mode[side]) power += m.re * m.re + m.im * m.im;
          }
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
    for (Bowl& bowl : bowls_) {
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
    // Per second, so per sample at this rate; and trimmed against Ring, since
    // what a held note builds to grows with the ring.
    const float trim = std::sqrt(kRefRingSeconds / param(kRing));
    const float drive = kit::lerp(kDriveLow, kDriveHigh, param(kStrike)) * trim / sample_rate();
    drive_.set(drive, primed());
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
        set_drive();
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
  float fast_ = 0.0f, slow_ = 0.0f;
  float fast_attack_ = 0.0f, fast_release_ = 0.0f, slow_coeff_ = 0.0f;
  float damp_radius_ = 0.99f;
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
