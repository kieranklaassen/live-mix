#pragma once

// What Deep Roots is made of: the five leaves a key is heard as, the five
// soils its roots grow in, and the divisions each series lists.

#include "../../kit/kit.h"

namespace livemix {
namespace deep_roots {

// A body that does not move with the note: three humps on a plain floor.
struct Body {
  float hz[3];
  float width[3];  // as a share of hz
  float gain[3];

  float at(float f) const {
    float sum = 1.0f;
    for (int i = 0; i < 3; ++i) {
      const float off = (f - hz[i]) / (hz[i] * width[i]);
      sum += gain[i] / (1.0f + off * off);
    }
    return sum;
  }
};

constexpr int kLane = 8;         // partials in one bank, two fours
constexpr int kLeafPartials = 16;
constexpr int kLeaves = 5;
constexpr int kSoils = 5;

// A partial that is struck falls from 1 to `hold` over `ring` seconds (at
// 200 Hz, shorter for higher notes); with ring 0 it stands. `noise` is how far
// the partial is a narrow band of noise instead of a line, `beat` how many Hz
// it lies above its ratio.
struct Leaf {
  float ratio[kLeafPartials];
  float level[kLeafPartials];
  float ring[kLeafPartials];
  float hold[kLeafPartials];
  float noise[kLeafPartials];
  float beat[kLeafPartials];
  Body body;
  float attack;  // the Attack knob times this
  float air;     // broad noise round the fourth harmonic
  float dark;    // how steeply Leaf tone closes it, in powers of two an octave
  float trim;
  float fan;     // how far Width spreads its partials
  float breath;  // slow swells of its level
  float life;    // seconds its roots last at the most: a struck key feeds them no longer; 0 is for ever
};

constexpr Leaf kLeafTable[kLeaves] = {
    // Sine: a round tone with a trace of octave and twelfth.
    {{1, 2, 3, 4, 5, 6, 8, 10, 1, 1, 1, 1, 1, 1, 1, 1},
     {1.0f, 0.28f, 0.14f, 0.075f, 0.045f, 0.03f, 0.018f, 0.011f, 0, 0, 0, 0, 0, 0, 0, 0},
     {}, {}, {}, {},
     {{400, 1200, 3000}, {1.0f, 0.8f, 0.8f}, {0.0f, 0.0f, 0.0f}},
     1.0f, 0.0f, 1.3f, 1.0f, 0.8f, 0.0f, 0.0f},
    // Reed: every harmonic, a hollow nose.
    {{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18},
     {0.30f, 0.44f, 0.96f, 0.60f, 1.00f, 0.58f, 0.76f, 0.34f, 0.32f, 0.13f, 0.12f, 0.06f, 0.05f, 0.02f, 0.01f, 0.005f},
     {}, {}, {}, {0, 0, 0, 0.5f, 0, 0, 0.8f, 0, 0, 1.0f, 0, 0, 0, 0, 0, 0},
     {{520, 1250, 2500}, {0.3f, 0.22f, 0.25f}, {1.6f, 3.5f, 0.9f}},
     0.4f, 0.0f, 1.5f, 1.35f, 0.4f, 0.0f, 0.0f},
    // Glass: a rubbed bowl that throbs, its upper modes struck as it starts.
    {{1, 1, 2, 2.756f, 2.756f, 4.0f, 5.404f, 5.404f, 8.933f, 8.933f, 13.34f, 6.0f, 18.64f, 1, 1, 1},
     {0.62f, 0.46f, 0.03f, 0.16f, 0.14f, 0.05f, 0.24f, 0.20f, 0.28f, 0.24f, 0.28f, 0.03f, 0.22f, 0, 0, 0},
     {4.0f, 4.0f, 4.0f, 4.0f, 3.6f, 3.0f, 3.2f, 3.0f, 2.6f, 2.4f, 2.0f, 2.4f, 1.5f, 0, 0, 0},
     {0.30f, 0.30f, 0.3f, 0.16f, 0.15f, 0.1f, 0.12f, 0.12f, 0.10f, 0.10f, 0.08f, 0.1f, 0.06f, 0, 0, 0},
     {}, {-0.38f, 0.52f, 0, -0.7f, 0.9f, 0, 0, 2.3f, 0, 3.1f, 0, 0, 0, 0, 0, 0},
     {{900, 2600, 4800}, {0.6f, 0.5f, 0.4f}, {0.0f, 0.8f, 0.8f}},
     0.05f, 0.0f, 0.9f, 1.55f, 1.6f, 0.0f, 12.0f},
    // Breath: bands of noise at the harmonics, and air over them.
    {{1, 2, 3, 4, 5, 6, 7, 8, 1, 10, 12, 1, 1, 1, 1, 1},
     {0.52f, 0.20f, 0.11f, 0.05f, 0.035f, 0.03f, 0.04f, 0.05f, 0.35f, 0.08f, 0.08f, 0, 0, 0, 0, 0},
     {}, {},
     {0.9f, 1, 1, 1, 1, 1, 1, 1, 0.0f, 1, 1, 0, 0, 0, 0, 0},
     {},
     {{450, 1500, 3200}, {0.5f, 0.4f, 0.4f}, {0.4f, 0.6f, 0.5f}},
     3.4f, 2.4f, 1.2f, 0.85f, 2.0f, 0.9f, 0.0f},
    // Pluck: a string picked near its end, the top first to go.
    {{1, 2.0004f, 3.001f, 4.003f, 5.006f, 6.01f, 7.016f, 8.024f, 9.034f, 10.047f, 11.06f, 12.08f, 13.1f, 14.13f, 15.2f, 16.2f},
     {0.95f, 0.90f, 0.66f, 0.46f, 0.20f, 0.26f, 0.36f, 0.36f, 0.24f, 0.10f, 0.20f, 0.24f, 0.20f, 0.12f, 0.09f, 0.12f},
     {2.4f, 2.2f, 2.0f, 1.8f, 1.6f, 1.4f, 1.3f, 1.1f, 1.0f, 0.9f, 0.8f, 0.7f, 0.6f, 0.55f, 0.5f, 0.45f},
     {0.05f, 0.03f, 0.02f, 0.01f, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0},
     {}, {},
     {{210, 480, 1500}, {0.35f, 0.4f, 0.5f}, {0.8f, 0.5f, 0.5f}},
     0.012f, 0.0f, 1.3f, 2.3f, 0.3f, 0.0f, 7.0f},
};

struct Soil {
  float ratio[kLane];
  float level[kLane];
  float ring[kLane];
  float hold[kLane];
  float noise[kLane];
  float beat[kLane];
  Body body;
  float rise;     // how quickly a root comes up, times the Growth knob
  float quick;    // and the shortest it may take, seconds
  float release;  // the Release knob times this
  float trim;
  float fan;      // how far Width spreads its partials
  float throb;    // slow bubbles in its level
  float top;      // no partial above this, Hz
};

constexpr Soil kSoilTable[kSoils] = {
    // Clay: round and warm, a soft swell.
    {{1, 2, 3, 4, 5, 6, 7, 8},
     {1.0f, 0.68f, 0.44f, 0.27f, 0.16f, 0.10f, 0.06f, 0.035f},
     {0, 0, 3.5f, 2.5f, 2.0f, 1.5f, 1.2f, 1.0f},
     {1, 1, 0.75f, 0.6f, 0.5f, 0.4f, 0.4f, 0.4f},
     {}, {0, 0, 0.11f, 0.17f, 0, 0.23f, 0, 0},
     {{190, 520, 1300}, {0.5f, 0.5f, 0.6f}, {0.8f, 0.5f, 0.0f}},
     1.0f, 0.014f, 1.0f, 1.0f, 0.8f, 0.0f, 5000.0f},
    // Sand: the note is a thread, over it run streams of grains.
    {{1, 2, 3, 6, 14, 30, 54, 88},
     {0.46f, 0.28f, 0.22f, 0.14f, 0.28f, 0.44f, 0.36f, 0.20f},
     {}, {},
     {0.0f, 0.3f, 0.8f, 1, 1, 1, 1, 1},
     {},
     {{700, 1700, 3600}, {0.5f, 0.5f, 0.5f}, {0.3f, 0.9f, 1.2f}},
     0.9f, 0.010f, 0.6f, 0.95f, 2.4f, 0.35f, 8000.0f},
    // Peat: dark and thick, pairs that lean on each other, slow bubbles.
    {{1, 1, 2, 2, 3, 3, 4, 5},
     {0.85f, 0.65f, 0.20f, 0.15f, 0.20f, 0.15f, 0.012f, 0.005f},
     {}, {},
     {0, 0.25f, 0, 0.3f, 0.0f, 0.2f, 0.5f, 0.6f},
     {-0.13f, 0.18f, -0.20f, 0.27f, -0.28f, 0.38f, 0.2f, 0.0f},
     {{75, 130, 330}, {0.4f, 0.4f, 0.4f}, {1.8f, 0.8f, 0.6f}},
     4.0f, 0.06f, 2.0f, 1.20f, 0.4f, 0.8f, 2200.0f},
    // Chalk: a bar is struck as each root arrives; what is left of it is faint.
    {{1, 2, 4, 5.404f, 8.933f, 13.34f, 18.64f, 31.87f},
     {0.70f, 0.40f, 0.75f, 0.50f, 0.60f, 0.54f, 0.52f, 0.42f},
     {2.2f, 1.8f, 1.5f, 1.3f, 1.2f, 1.1f, 0.9f, 0.7f},
     {0.030f, 0.012f, 0.002f, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f},
     {}, {0, 0.2f, 0.5f, 0, 0.8f, 0, 0, 0},
     {{700, 1700, 3600}, {0.5f, 0.5f, 0.5f}, {1.0f, 0.5f, 0.4f}},
     0.10f, 0.0015f, 1.2f, 6.4f, 2.0f, 0.0f, 9000.0f},
    // Stone: bowed rock, hard ringing harmonics under a hollow body.
    {{1, 2, 3, 5, 8, 12, 16, 20},
     {0.26f, 0.20f, 0.56f, 0.86f, 0.90f, 0.80f, 0.40f, 0.16f},
     {0, 0, 0, 0, 0, 6.0f, 5.0f, 4.0f},
     {1, 1, 1, 1, 1, 0.8f, 0.7f, 0.6f},
     {0, 0, 0.0f, 0.05f, 0.08f, 0.08f, 0.1f, 0.1f}, {0, 0, 0.23f, 0.0f, 0.37f, 0.0f, 0.5f, 0.0f},
     {{480, 1100, 2000}, {0.2f, 0.16f, 0.18f}, {1.8f, 3.0f, 2.4f}},
     2.2f, 0.04f, 1.1f, 1.25f, 1.4f, 0.12f, 5500.0f},
};

// How much of division n the Series knob grows, from 0 (halves only) over
// halves and thirds (a third of the way) and every division (two thirds) to
// the odd ones alone.
constexpr int kDivisions = 11;
constexpr int kDivision[kDivisions] = {2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12};
// 0: only twos. 1: twos and threes. 2: fives and above.
constexpr int kFamily[kDivisions] = {0, 1, 0, 2, 1, 2, 0, 2, 2, 2, 1};

inline float series_share(int i, float series) {
  const float at = series * 3.0f;
  float share = 1.0f;
  if (kFamily[i] == 1) share = kit::clamp(at, 0.0f, 1.0f);
  if (kFamily[i] == 2) share = kit::clamp(at - 1.0f, 0.0f, 1.0f);
  if ((kDivision[i] & 1) == 0) share *= kit::clamp(3.0f - at, 0.0f, 1.0f);
  return share;
}

}  // namespace deep_roots
}  // namespace livemix
