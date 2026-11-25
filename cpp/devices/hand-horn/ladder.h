#pragma once

// The ladder of a natural horn: the partials n · f1 of one crook, and what a
// key asks of the lips and the hand. Everything is in cents over C1 (32.703
// Hz), so a retuned key is taken at the pitch it has and not by its name.
//
//   key within the lips' reach of its nearest partial   open: lipped there
//   any other key                                       the next partial
//                                                       ABOVE, stopped down
//
// The hand closes by the cents it has to lower the note, and 120 cents is a
// hand fully in: F4 on the C crook (from the 11th partial, 51 cents) is a
// little covered, A4 (from the 14th, 69) more, F sharp 4 (from the 12th,
// 102) nearly all the way. In the low octaves the gaps are wider than a hand
// can close; there the covering stays at full and the pitch is right anyway.

#include <cmath>

#include "../../kit/kit.h"

namespace livemix {
namespace hand_horn {

constexpr float kC1Hz = 32.703196f;
constexpr float kFullStopCents = 120.0f;
// A note lipped up by this much is as thin as lipping makes it.
constexpr float kThinCents = 60.0f;
constexpr int kNumCrooks = 11;
constexpr int kMaxPartial = 4096;

inline float cents_of(float hz) { return 1200.0f * std::log2(hz * (1.0f / kC1Hz)); }
inline float hz_of(float cents) { return kC1Hz * std::exp2(cents * (1.0f / 1200.0f)); }

// Cents from the fundamental to partial n.
inline float rung(int n) { return 1200.0f * std::log2(static_cast<float>(n)); }

// Semitones from C1 to each crook's fundamental.
inline float crook_cents(int crook) {
  static const float kSemitones[kNumCrooks] = {-2.0f, 0.0f, 2.0f, 3.0f, 4.0f, 5.0f,
                                               7.0f,  8.0f, 9.0f, 10.0f, 12.0f};
  return 100.0f * kSemitones[kit::clamp_int(crook, 0, kNumCrooks - 1)];
}

// What a key asks of the horn.
struct Ask {
  int nearest = 1;        // the partial nearest the key
  int from = 1;           // the partial it is made from
  bool open = true;       // within the lips' reach
  float nearest_at = 0.0f;  // cents of `nearest` over C1
  float from_at = 0.0f;     // cents of `from`
  float covering = 0.0f;  // 0 open .. 1 fully stopped, with the hand at full
  float thin = 0.0f;      // 0 .. 1, how far lipped up
};

// `key` and `base` (the crook's fundamental) in cents over C1.
inline Ask ask(float key, float base, float lip) {
  Ask a;
  const float up = key - base;
  int low = static_cast<int>(std::exp2(kit::clamp(up, -2400.0f, 14000.0f) * (1.0f / 1200.0f)));
  low = kit::clamp_int(low, 1, kMaxPartial);
  // exp2 may land a hair on either side of a whole number.
  while (low > 1 && rung(low) > up) --low;
  while (low < kMaxPartial && rung(low + 1) <= up) ++low;
  const float below = up - rung(low);       // negative under the fundamental
  const float above = rung(low + 1) - up;
  if (below < 0.0f) {
    a.nearest = low;
  } else {
    a.nearest = below <= above ? low : low + 1;
  }
  a.nearest_at = base + rung(a.nearest);
  const float off = key - a.nearest_at;
  a.open = std::fabs(off) <= lip;
  if (a.open) {
    a.from = a.nearest;
    a.thin = kit::clamp(off / kThinCents, 0.0f, 1.0f);
  } else {
    a.from = below < 0.0f ? low : low + 1;
    a.covering = kit::clamp((rung(a.from) - up) / kFullStopCents, 0.0f, 1.0f);
  }
  a.from_at = base + rung(a.from);
  return a;
}

}  // namespace hand_horn
}  // namespace livemix
