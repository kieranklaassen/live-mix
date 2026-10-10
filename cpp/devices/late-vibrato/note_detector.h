#pragma once

// Hears when a new note begins in played material: a legato line whose notes
// change pitch with hardly a change of level, a melody over a held chord, a
// note struck over others that ring on. And does not take for a note what is
// only a held sound moving: two strings beating, a stack of saws a few cents
// apart, a tremolo, the player's own vibrato, a filter opening, a reverb tail.
//
// One envelope over the whole signal cannot tell these apart (a legato line
// has no rise at all; a beat is nothing but rises), so the signal is heard in
// bands: 38 of them a whole tone apart from 55 Hz to 3.9 kHz, the highs above
// 4 kHz as one more, and what differs between the two sides as another.
//
//   in ─► mid ─► lowpass 4 kHz ─► every Mth sample ─► 38 band filters ─► energy
//        │           └─ what it takes off (the air) ──────────────────► energy
//        └─ side ─────────────────────────────────────────────────────► energy
//
// Every millisecond, for each band:
//
// - `level`: its energy now, smoothed over 4 ms.
// - `recent`: what it has held lately. It follows the level up in 20 ms,
//   stands for 250 ms, then falls away in 350 ms. A beat of 4 Hz and faster
//   comes back to it before it has moved; a slower one rises too slowly to get
//   ahead of it.
// - `known`: what the band is known to hold. It follows `recent` up in 150 ms
//   and stands for two seconds. A band that has been empty is a fresh one, and
//   a soft attack into it counts in full although it rises slowly; a band that
//   held as much a second ago is not fresh, so the slow return of a beat is
//   not a note.
// - A band that fell quickly (from half to a tenth of what it held in under
//   100 ms) and stayed down for 150 ms has lost its note, and forgets it: the
//   same pitch played again is a new note. A beat that falls so fast is back
//   sooner, and one that stays down so long fell slowly.
// - `before`: its mean level over the last 50 ms. What is remembered counts
//   only up to three times that: a band that leaps from next to nothing is a
//   note, whatever rang there a second ago (a line of plucked sines, each
//   dying under the next). A beat climbs out of its null too slowly to leap.
//
// What is new in a band is its level over the lesser of `recent` and `known`
// (both held to three times `before`), less a margin of the greater (0.4 of it at the default), so that a level
// swaying about what it was is nothing new. The bands' new energy is summed,
// each band weighted by its frequency up to 3 kHz (3 dB an octave: a high note
// over a low chord is heard, although the chord has more energy), and set
// against the sum of what all the bands have held lately. When that share
// passes the bar, a note has begun, and what sounds now is known from then on,
// so that one attack is not counted again while it finishes rising.
//
// The bar is Sense: the new energy must come within so many dB of all that is
// sounding (15 dB over it at 0, 13 dB under at the default, 20 dB under at 1).
// It rises with how much the sound moves on its own: six times the mean of the
// share over the last second is added, so a dense pad whose bands fade in and
// out all the time does not set it off, and a note over such a pad must be
// louder to be heard as one.
//
// Everything is counted in samples from the first one after a rest, so the
// answer is the same whatever the host's block size. Times are times and
// frequencies are frequencies at any sample rate: the bank runs on every Mth
// sample, M chosen to bring the rate nearest 12 kHz.
//
// Storage: 40 bands of state, under 3 kB.

#include <cmath>

#include "../../kit/math.h"

namespace livemix {
namespace late_vibrato_detail {

class NoteDetector {
 public:
  static constexpr int kBands = 38;            // a whole tone apart from kLowestHz
  static constexpr int kAll = kBands + 2;      // and the air, and the side
  static constexpr float kLowestHz = 55.0f;
  static constexpr float kBandsPerOctave = 6.0f;
  static constexpr float kBandQ = 8.65f;       // a whole tone wide; two filters in a row
  static constexpr float kNarrowestHz = 25.0f; // low bands are no narrower, so none rings longer than 13 ms
  static constexpr float kAirHz = 4000.0f;
  static constexpr float kBankRate = 12000.0f;
  static constexpr float kTickSeconds = 0.001f;

  static constexpr float kSmoothSeconds = 0.004f;
  static constexpr float kRecentRiseSeconds = 0.02f;
  static constexpr float kRecentHoldSeconds = 0.25f;
  static constexpr float kRecentFallSeconds = 0.35f;
  static constexpr float kKnownRiseSeconds = 0.15f;
  static constexpr float kKnownHoldSeconds = 2.0f;
  static constexpr float kKnownFallSeconds = 0.4f;
  static constexpr float kBeforeSeconds = 0.05f;  // the moment ago a leap is measured against
  static constexpr float kLeap = 3.0f;             // what is remembered counts up to this many times it
  static constexpr float kHalf = 0.5f;          // a band is falling from here
  static constexpr float kGone = 0.1f;          // and has lost its note under here
  static constexpr float kFallSeconds = 0.1f;   // when it got there this fast
  static constexpr float kGoneSeconds = 0.15f;  // and stayed this long

  static constexpr float kWeightHz = 500.0f;    // a band here weighs 1
  static constexpr float kWeightTopHz = 3000.0f;
  static constexpr float kMarginDefault = 0.4f; // Sense up to the default
  static constexpr float kMarginLeast = 0.15f;  // Sense 1
  static constexpr float kBarMostDb = 15.0f;    // Sense 0
  static constexpr float kBarSpanDb = 35.0f;    // down to −20 dB at Sense 1
  static constexpr float kBarBend = 1.756f;     // which puts the default, 0.6, at −13 dB
  static constexpr float kSenseDefault = 0.6f;
  static constexpr float kMovingSeconds = 1.0f;
  static constexpr float kMovingCap = 4.0f;     // a share counts in the mean up to this many bars
  static constexpr float kMovingWeight = 6.0f;
  static constexpr float kEnergyFloor = 1.0e-10f;  // a tone of −97 dBFS

  void init(float sample_rate) {
    step_ = static_cast<int>(sample_rate / kBankRate + 0.5f);
    if (step_ < 1) step_ = 1;
    const float bank_rate = sample_rate / static_cast<float>(step_);
    ticks_ = static_cast<int>(bank_rate * kTickSeconds + 0.5f);
    if (ticks_ < 1) ticks_ = 1;
    const float tick = static_cast<float>(ticks_ * step_) / sample_rate;
    for (int b = 0; b < kBands; ++b) {
      const float hz = kLowestHz * std::pow(2.0f, static_cast<float>(b) / kBandsPerOctave);
      weight_[b] = kit::min(hz, kWeightTopHz) / kWeightHz;
      if (hz >= 0.45f * bank_rate) {
        // No such band at this sample rate: it hears nothing.
        gain_[b] = 0.0f;
        a1_[b] = 0.0f;
        a2_[b] = 0.0f;
        continue;
      }
      const float q = kit::min(kBandQ, hz / kNarrowestHz);
      const float w = kit::kTwoPi * hz / bank_rate;
      const float alpha = std::sin(w) / (2.0f * q);
      gain_[b] = alpha / (1.0f + alpha);
      a1_[b] = -2.0f * std::cos(w) / (1.0f + alpha);
      a2_[b] = (1.0f - alpha) / (1.0f + alpha);
    }
    weight_[kBands] = kWeightTopHz / kWeightHz;
    weight_[kBands + 1] = 1.0f;
    air_ = 1.0f - std::exp(-kit::kTwoPi * kit::min(kAirHz, 0.45f * sample_rate) / sample_rate);
    bank_scale_ = 1.0f / static_cast<float>(ticks_);
    wide_scale_ = 1.0f / static_cast<float>(ticks_ * step_);
    mid_scale_ = 1.0f / static_cast<float>(step_);
    smooth_ = 1.0f - std::exp(-tick / kSmoothSeconds);
    recent_rise_ = 1.0f - std::exp(-tick / kRecentRiseSeconds);
    recent_fall_ = 1.0f - std::exp(-tick / kRecentFallSeconds);
    known_rise_ = 1.0f - std::exp(-tick / kKnownRiseSeconds);
    known_fall_ = 1.0f - std::exp(-tick / kKnownFallSeconds);
    before_step_ = 1.0f - std::exp(-tick / kBeforeSeconds);
    moving_step_ = 1.0f - std::exp(-tick / kMovingSeconds);
    recent_hold_ = static_cast<int>(kRecentHoldSeconds / tick);
    known_hold_ = static_cast<int>(kKnownHoldSeconds / tick);
    fall_ticks_ = static_cast<int>(kFallSeconds / tick);
    gone_ticks_ = static_cast<int>(kGoneSeconds / tick);
    set_sense(kSenseDefault);
    clear();
  }

  // Sense, 0..1: how small a share of new energy is a new note.
  void set_sense(float sense) {
    sense = kit::clamp(sense, 0.0f, 1.0f);
    const float db = kBarMostDb - kBarSpanDb * (1.0f - std::pow(1.0f - sense, kBarBend));
    bar_ = std::pow(10.0f, 0.1f * db);
    const float over = kit::max(0.0f, sense - kSenseDefault) / (1.0f - kSenseDefault);
    margin_ = kMarginDefault + (kMarginLeast - kMarginDefault) * over;
  }

  // Nothing heard yet: the state the device rests in.
  void clear() {
    for (int b = 0; b < kAll; ++b) {
      z1_[b] = z2_[b] = z3_[b] = z4_[b] = 0.0f;
      sum_[b] = level_[b] = recent_[b] = known_[b] = before_[b] = 0.0f;
      stand_[b] = keep_[b] = since_[b] = down_[b] = 0;
      fell_fast_[b] = false;
    }
    low_ = 0.0f;
    mid_sum_ = 0.0f;
    moving_ = 0.0f;
    phase_ = 0;
    tick_ = 0;
  }

  // One sample of each side. True on the sample a new note is heard to begin
  // (once a millisecond at the most, and again while an attack goes on
  // rising). `silent` says nothing is sounding at all: then whatever comes
  // next is a new note, and nothing is remembered.
  bool hear(float left, float right, bool silent) {
    const float mid = 0.5f * (left + right);
    const float side = 0.5f * (left - right);
    low_ = flush_denormal(low_ + (mid - low_) * air_);
    const float air = mid - low_;
    sum_[kBands] += air * air;
    sum_[kBands + 1] += side * side;
    mid_sum_ += low_;
    if (++phase_ < step_) return false;
    phase_ = 0;
    const float x = mid_sum_ * mid_scale_;
    mid_sum_ = 0.0f;
    for (int b = 0; b < kBands; ++b) {
      // Two band filters in a row; an output too small to matter is nothing,
      // which empties the filters two samples later.
      const float g = gain_[b];
      const float y = flush_denormal(g * x + z1_[b]);
      z1_[b] = z2_[b] - a1_[b] * y;
      z2_[b] = -g * x - a2_[b] * y;
      const float v = flush_denormal(g * y + z3_[b]);
      z3_[b] = z4_[b] - a1_[b] * v;
      z4_[b] = -g * y - a2_[b] * v;
      sum_[b] += v * v;
    }
    if (++tick_ < ticks_) return false;
    tick_ = 0;

    float fresh = 0.0f;
    float sounding = 0.0f;
    for (int b = 0; b < kAll; ++b) {
      const float now = sum_[b] * (b < kBands ? bank_scale_ : wide_scale_);
      sum_[b] = 0.0f;
      level_[b] = flush_denormal(level_[b] + (now - level_[b]) * smooth_);
      const float level = level_[b];
      // What is remembered counts only up to a few times what the band held
      // on average a moment ago: a band that leaps from next to nothing is a
      // note, whatever sounded there seconds before.
      const float most = kLeap * before_[b];
      before_[b] = flush_denormal(before_[b] + (level - before_[b]) * before_step_);
      const float recent = kit::min(recent_[b], most);
      const float known = kit::min(known_[b], most);
      const float lesser = kit::min(recent, known);
      const float greater = kit::max(recent, known);
      const float over = level - lesser - margin_ * greater;
      if (over > 0.0f) fresh += weight_[b] * over;
      sounding += weight_[b] * recent_[b];

      // A band that fell fast and stayed down has lost its note.
      if (level >= kHalf * kit::max(recent_[b], known_[b])) {
        since_[b] = 0;
        down_[b] = 0;
      } else {
        if (since_[b] < kLong) ++since_[b];
        if (level < kGone * kit::max(recent_[b], known_[b])) {
          if (down_[b] == 0) fell_fast_[b] = since_[b] <= fall_ticks_;
          if (++down_[b] >= gone_ticks_ && fell_fast_[b]) forget(b);
        } else {
          down_[b] = 0;
        }
      }

      if (level > recent_[b]) {
        recent_[b] += (level - recent_[b]) * recent_rise_;
        stand_[b] = recent_hold_;
      } else if (stand_[b] > 0) {
        --stand_[b];
      } else {
        recent_[b] = flush_denormal(recent_[b] + (level - recent_[b]) * recent_fall_);
      }
      if (recent_[b] > known_[b]) {
        known_[b] += (recent_[b] - known_[b]) * known_rise_;
        keep_[b] = known_hold_;
      } else if (keep_[b] > 0) {
        --keep_[b];
      } else {
        known_[b] = flush_denormal(known_[b] + (recent_[b] - known_[b]) * known_fall_);
      }
    }

    if (silent) {
      for (int b = 0; b < kAll; ++b) forget(b);
      moving_ = 0.0f;
      return false;
    }
    const float share = fresh / (sounding + kEnergyFloor);
    const float bar = bar_ + kMovingWeight * moving_;
    moving_ += (kit::min(share, kMovingCap * bar_) - moving_) * moving_step_;
    if (share <= bar) return false;
    // Taken as a note: what sounds now is known, and its attack is not
    // counted a second time unless it goes on rising.
    for (int b = 0; b < kAll; ++b) {
      if (level_[b] > known_[b]) {
        known_[b] = level_[b];
        keep_[b] = known_hold_;
      }
    }
    return true;
  }

 private:
  static constexpr int kLong = 1 << 20;

  void forget(int b) {
    recent_[b] = level_[b];
    known_[b] = level_[b];
    stand_[b] = 0;
    keep_[b] = 0;
    down_[b] = 0;
  }

  // The bank.
  int step_ = 4;     // input samples to one of the bank's
  int ticks_ = 12;   // the bank's samples to one look at the bands
  int phase_ = 0;
  int tick_ = 0;
  float air_ = 0.0f;
  float low_ = 0.0f;
  float mid_sum_ = 0.0f;
  float mid_scale_ = 0.25f, bank_scale_ = 1.0f, wide_scale_ = 1.0f;
  float gain_[kBands] = {};
  float a1_[kBands] = {};
  float a2_[kBands] = {};
  float z1_[kAll] = {}, z2_[kAll] = {}, z3_[kAll] = {}, z4_[kAll] = {};
  float sum_[kAll] = {};

  // The bands.
  float weight_[kAll] = {};
  float level_[kAll] = {};
  float recent_[kAll] = {};
  float known_[kAll] = {};
  float before_[kAll] = {};
  int stand_[kAll] = {};
  int keep_[kAll] = {};
  int since_[kAll] = {};
  int down_[kAll] = {};
  bool fell_fast_[kAll] = {};
  float smooth_ = 0.0f;
  float recent_rise_ = 0.0f, recent_fall_ = 0.0f;
  float known_rise_ = 0.0f, known_fall_ = 0.0f;
  float before_step_ = 0.0f;
  int recent_hold_ = 0, known_hold_ = 0, fall_ticks_ = 0, gone_ticks_ = 0;

  // The bar.
  float bar_ = 0.05f;
  float margin_ = kMarginDefault;
  float moving_ = 0.0f;
  float moving_step_ = 0.0f;
};

}  // namespace late_vibrato_detail
}  // namespace livemix
