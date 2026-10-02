#pragma once

#include "curve.h"

// The five circuits as data. Each is an equaliser into its curve and another
// out of it, plus how its working point moves with level:
//
//   emphasis ─► × drive ─► curve(v + bias) − curve(bias) ─► de-emphasis
//
// What the emphasis lifts saturates first, and the de-emphasis puts the
// quiet signal back (nearly) flat, so the circuits differ in which part of
// the spectrum distorts and how, not only in the curve.

namespace livemix {
namespace analog_drive_dsp {

constexpr int kNumCircuits = 5;
constexpr int kMaxPre = 2;
constexpr int kMaxPost = 3;

struct Eq {
  enum Kind : int { kNone = 0, kLowShelf, kHighShelf, kPeak };
  Kind kind;
  float hz;
  float gain_db;
  float q;  // peaks only
};

struct Circuit {
  Curve curve;
  // Where the signal sits on the curve: bias + bias_drive × Drive, plus a
  // shift that follows the level arriving at the curve and tends to
  // bias_level: bias_level × e / (e + bias_knee) for an envelope e.
  float bias;
  float bias_drive;
  float bias_level;
  float bias_knee;
  // Gain into the curve falls to 1 / (1 + sag) when what leaves it has an
  // envelope of 1 (its ceiling).
  float sag;
  float attack_seconds;
  float release_seconds;
  Eq pre[kMaxPre];
  Eq post[kMaxPost];
};

inline const Circuit& circuit(int index) {
  static const Circuit table[kNumCircuits] = {
      // Tape preamp: all soft knee, a little lopsided. Treble is lifted on
      // the way in and cut by the same amount on the way out, so loud highs
      // saturate first and come back duller; quiet ones pass. A slow, slight
      // sag is the compression.
      {Curve(1.0, 1.0, 1.3, 0.0, 1.0, 0.0, 1.0),
       0.05f, 0.08f, 0.0f, 1.0f, 0.2f, 0.012f, 0.14f,
       {{Eq::kHighShelf, 3200.0f, 8.0f, 0.0f}, {Eq::kNone, 0.0f, 0.0f, 0.0f}},
       {{Eq::kHighShelf, 3200.0f, -10.0f, 0.0f},
        {Eq::kLowShelf, 180.0f, 2.0f, 0.0f},
        {Eq::kNone, 0.0f, 0.0f, 0.0f}}},
      // Console: a firm, nearly symmetric knee (odd harmonics), reached
      // first by the upper mids, with some of that lift and a little air
      // left in afterwards.
      {Curve(0.45, 1.0, 1.0, 0.55, 0.9, 0.0, 1.0),
       0.01f, 0.01f, 0.0f, 1.0f, 0.0f, 0.005f, 0.08f,
       {{Eq::kPeak, 3200.0f, 4.5f, 0.5f}, {Eq::kNone, 0.0f, 0.0f, 0.0f}},
       {{Eq::kPeak, 3200.0f, -2.0f, 0.5f},
        {Eq::kHighShelf, 9000.0f, 1.5f, 0.0f},
        {Eq::kNone, 0.0f, 0.0f, 0.0f}}},
      // Transformer: the core saturates on flux, which is the integral of
      // the signal, so the curve sees the lows 10 dB up and the exact
      // inverse follows it. Low notes distort long before high ones, and
      // the low mids are left a little thick.
      {Curve(0.65, 1.0, 1.06, 0.35, 1.0, 0.0, 1.0),
       0.03f, 0.03f, 0.0f, 1.0f, 0.08f, 0.03f, 0.25f,
       {{Eq::kLowShelf, 160.0f, 8.5f, 0.0f}, {Eq::kNone, 0.0f, 0.0f, 0.0f}},
       {{Eq::kLowShelf, 160.0f, -8.5f, 0.0f},
        {Eq::kPeak, 200.0f, 1.5f, 0.7f},
        {Eq::kHighShelf, 11000.0f, -1.2f, 0.0f}}},
      // Triode: one soft knee far earlier on one side than the other, and a
      // working point that sits off centre and moves further as the level
      // rises: second harmonic first, growing gradually.
      {Curve(1.0, 0.7, 1.6, 0.0, 1.0, 0.0, 1.0),
       0.14f, 0.15f, 1.2f, 1.5f, 0.0f, 0.02f, 0.2f,
       {{Eq::kLowShelf, 150.0f, 2.0f, 0.0f}, {Eq::kNone, 0.0f, 0.0f, 0.0f}},
       {{Eq::kLowShelf, 150.0f, -0.7f, 0.0f},
        {Eq::kHighShelf, 8000.0f, -0.3f, 0.0f},
        {Eq::kNone, 0.0f, 0.0f, 0.0f}}},
      // Pentode: a firm knee with a hard clip under it and no soft part, so
      // it stays clean and then bites; lows held back from the curve, upper
      // mids pushed at it; the supply sags under a sustained load and
      // recovers.
      {Curve(0.0, 1.0, 1.0, 0.5, 0.75, 0.5, 0.55),
       0.04f, 0.04f, 0.0f, 1.0f, 0.5f, 0.015f, 0.18f,
       {{Eq::kPeak, 2000.0f, 3.5f, 0.6f}, {Eq::kLowShelf, 150.0f, -4.0f, 0.0f}},
       {{Eq::kPeak, 2000.0f, -0.5f, 0.6f},
        {Eq::kLowShelf, 150.0f, 1.5f, 0.0f},
        {Eq::kHighShelf, 7000.0f, 1.0f, 0.0f}}},
  };
  return table[index < 0 ? 0 : (index >= kNumCircuits ? kNumCircuits - 1 : index)];
}

}  // namespace analog_drive_dsp
}  // namespace livemix
