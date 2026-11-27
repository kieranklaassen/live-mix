#pragma once

#include <cmath>

#include "../../kit/math.h"

namespace livemix {
namespace returning_wave_dsp {

// A wave in a closed space: twenty-four standing modes, a law that gives each
// its energy, and the harmonics of what is read off it.
//
// Time is counted in returns: at 1 the modes of the plain laws are in step
// again (the packet stands mirrored, which sounds the same), at 1/2 harmonics
// 2 4 6 are, at 1/3 harmonics 3 6 9, and so on.
constexpr int kModes = 24;
constexpr int kPairs = kModes * (kModes - 1) / 2;
// The highest harmonic a reading has: the sum of the two highest modes.
constexpr int kHarmonics = 2 * kModes;
constexpr int kBins = kHarmonics + 4;

enum Walls : int { kBox = 0, kRing, kBowl, kTwoRooms, kFadingWell, kNumWalls };
enum Reading : int { kDensity = 0, kWaveItself, kFlow, kNumReadings };

// Where the pairs of modes that are `m` apart begin in the arrays of pairs:
// pair (m, i) is modes i and i + m.
inline int pair_offset(int m) { return (m - 1) * kModes - m * (m - 1) / 2; }

// A Walls choice, worked out once: the energy of each mode (in turns a
// return), and how fast each pair's share of the density moves along the
// space, as it lies at the difference of the two modes and at their sum.
struct Law {
  double energy[kModes];
  float slope[kModes];       // turns a return from a mode to the next
  float along[kPairs];       // (E - E') / (n - n')
  float across[kPairs];      // (E - E') / (n + n')
  float apart[kPairs];       // |E - E'|
  int base = 1;              // the number of the first mode
  float mirror = -1.0f;      // -1 a wall that turns the wave over, 1 one that does not, 0 no wall
  float breath = 0.0f;       // a bowl squeezes and spreads the packet as it swings
};

inline void make_law(int walls, Law* law) {
  // Round a ring modes run both ways; between walls they are counted from 1,
  // or from 0 where the wave is not turned over.
  law->base = walls == kRing ? -kModes / 2 : (walls == kBowl ? 0 : 1);
  law->mirror = walls == kRing ? 0.0f : (walls == kBowl ? 1.0f : -1.0f);
  law->breath = walls == kBowl ? 0.2f : 0.0f;
  for (int i = 0; i < kModes; ++i) {
    const double n = static_cast<double>(i + law->base);
    double e = 0.5 * n * n;
    switch (walls) {
      case kBowl:
        // Every mode a step over the last: the packet never spreads, it
        // parts in two that swing from side to side three times a return.
        e = 1.5 * n;
        break;
      case kTwoRooms: {
        // Modes in pairs that nearly agree: the halves of a pair part once a
        // return, which is the wave going through the wall and back.
        const int pair = (i / 2) + 1;
        e = 2.0 * pair * pair + ((i & 1) ? 0.5 : -0.5) * (1.0 + 0.11 * pair);
        break;
      }
      case kFadingWell:
        // Steps that shrink to nothing at the top, as in a well without a
        // rim: the low part hurries, the high part all but stands.
        e = -1400.0 / ((n + 3.0) * (n + 3.0));
        break;
      default:
        break;
    }
    law->energy[i] = e;
  }
  for (int i = 0; i < kModes; ++i) {
    const int a = i > 0 ? i - 1 : 0, b = i < kModes - 1 ? i + 1 : kModes - 1;
    law->slope[i] = static_cast<float>(std::fabs(law->energy[b] - law->energy[a]) / (b - a));
  }
  for (int m = 1; m < kModes; ++m) {
    const int at = pair_offset(m);
    for (int i = 0; i + m < kModes; ++i) {
      const double d = law->energy[i + m] - law->energy[i];
      law->along[at + i] = static_cast<float>(d / m);
      law->across[at + i] = law->mirror == 0.0f ? 0.0f : static_cast<float>(d / (2 * (i + law->base) + m));
      law->apart[at + i] = static_cast<float>(std::fabs(d));
    }
  }
}

// The modes of a packet as it is thrown, of total weight 1.
struct Packet {
  float re[kModes] = {};
  float im[kModes] = {};
  int centre = 0;       // the mode nearest the middle of them
  float pace = 1.0f;    // how fast it moves, in the units of Law::along
};

// One packet of `spread` modes around momentum `push`, at `place` (radians
// from the wall), weighed and added to `packet`.
inline void add_packet(const Law& law, float spread, float push, float place, float weight, Packet* packet) {
  const float inverse = 1.0f / (4.0f * spread * spread);
  const float turn = 1.0f / kit::kTwoPi;
  for (int i = 0; i < kModes; ++i) {
    const float n = static_cast<float>(i + law.base);
    // The wave on its way, and its mirror image in the wall.
    const float on = weight * std::exp(-(n - push) * (n - push) * inverse);
    const float back = law.mirror * weight * std::exp(-(n + push) * (n + push) * inverse);
    const float a = (push - n) * place * turn, b = (push + n) * place * turn;
    packet->re[i] += on * kit::SineTable::cos_lookup(a) + back * kit::SineTable::cos_lookup(b);
    packet->im[i] += on * kit::SineTable::lookup(a) + back * kit::SineTable::lookup(b);
  }
}

// Weight 1 in all, and what is read off it: its middle and its pace.
inline void finish_packet(const Law& law, Packet* packet) {
  float total = 0.0f, middle = 0.0f, pace = 0.0f;
  for (int i = 0; i < kModes; ++i) {
    const float power = packet->re[i] * packet->re[i] + packet->im[i] * packet->im[i];
    total += power;
    middle += power * static_cast<float>(i);
    pace += power * law.slope[i];
  }
  if (!(total > 1.0e-12f)) {
    packet->re[0] = total = 1.0f;
    pace = law.slope[0];
  }
  const float scale = 1.0f / std::sqrt(total);
  for (int i = 0; i < kModes; ++i) {
    packet->re[i] *= scale;
    packet->im[i] *= scale;
  }
  packet->centre = kit::clamp_int(static_cast<int>(middle / total + 0.5f), 0, kModes - 1);
  packet->pace = kit::max(0.25f, pace / total);
}

// What each pair (and, for the wave itself, each mode against the middle
// one) is let through by: 1 for what stands, falling fast over what turns
// quicker than `blur` (seconds) lets through, at the pace time has now (in
// returns a second). Where the wave lingers nothing turns quickly, so a whole
// wave is heard with all its edges.
struct Weights {
  float pair[kPairs];
  float mode[kModes];
};

inline void make_weights(const Law& law, int reading, int centre, float pace, float blur, Weights* weights) {
  const float k = blur * 4.0f * pace;
  if (reading == kWaveItself) {
    for (int i = 0; i < kModes; ++i) {
      const float x = static_cast<float>(law.energy[i] - law.energy[centre]) * k;
      const float y = 1.0f / (1.0f + x * x);
      weights->mode[i] = y * y;
    }
    return;
  }
  for (int p = 0; p < kPairs; ++p) {
    const float x = law.apart[p] * k;
    const float y = 1.0f / (1.0f + x * x);
    weights->pair[p] = y * y;
  }
}

// How far the modes are in step: 1 for a packet as it was thrown, near 0 when
// it is dissolved, between them where it stands in two or three copies.
inline float wholeness(const float* re, const float* im) {
  float best = 0.0f;
  for (int m = 1; m <= 3; ++m) {
    float sr = 0.0f, si = 0.0f, all = 1.0e-12f;
    for (int i = 0; i + m < kModes; ++i) {
      const float r = re[i + m] * re[i] + im[i + m] * im[i];
      const float q = im[i + m] * re[i] - re[i + m] * im[i];
      sr += r;
      si += q;
      all += std::sqrt(r * r + q * q);
    }
    best = kit::max(best, std::sqrt(sr * sr + si * si) / all / (0.4f + 0.6f * static_cast<float>(m)));
  }
  return kit::min(best, 1.0f);
}

// The harmonics of the density (cosines) and of its current (sines) for the
// modes (re, im). Both are read there and back, so they are exact: nothing
// lies between the harmonics and nothing over the last of them.
inline void density(const Law& law, const Weights& weights, const float* re, const float* im, float pace,
                    float* rho, float* flow) {
  for (int k = 0; k < kBins; ++k) rho[k] = flow[k] = 0.0f;
  const float tide = 1.0f / pace;
  const float mirror = law.mirror;
  float p[kModes], q[kModes];
  for (int m = 1; m < kModes; ++m) {
    const int at = pair_offset(m), count = kModes - m;
    const float* w = weights.pair + at;
    for (int i = 0; i < count; ++i) {
      p[i] = w[i] * (re[i + m] * re[i] + im[i + m] * im[i]);
      q[i] = w[i] * (im[i + m] * re[i] - re[i + m] * im[i]) * tide;
    }
    const float* along = law.along + at;
    float still = 0.0f, moving = 0.0f;
    for (int i = 0; i < count; ++i) {
      still += p[i];
      moving += q[i] * along[i];
    }
    rho[m] += still;
    flow[m] += moving;
    if (mirror != 0.0f) {
      const float* across = law.across + at;
      const int first = m + 2 * law.base;
      for (int i = 0; i < count; ++i) {
        rho[first + 2 * i] += mirror * p[i];
        flow[first + 2 * i] += mirror * q[i] * across[i];
      }
    }
  }
  if (mirror != 0.0f) {
    for (int i = 0; i < kModes; ++i) {
      rho[2 * (i + law.base)] += 0.5f * mirror * (re[i] * re[i] + im[i] * im[i]);
    }
  }
}

// The wave itself, read as a pipe closed at one end: each mode is an odd
// harmonic, against the middle mode's turning so that the whole does not go
// round. Round a ring the two ways of a mode are one harmonic.
inline int crest_harmonic(const Law& law, int i) {
  const int n = law.mirror == 0.0f ? i + law.base : i;
  return 2 * (n < 0 ? -n : n) + 1;
}

inline void crests(const Law& law, const Weights& weights, const float* re, const float* im, float turn_re,
                   float turn_im, float* rho, float* flow) {
  for (int k = 0; k < kBins; ++k) rho[k] = flow[k] = 0.0f;
  for (int i = 0; i < kModes; ++i) {
    const int n = crest_harmonic(law, i);
    rho[n] += weights.mode[i] * (re[i] * turn_re - im[i] * turn_im);
    flow[n] += weights.mode[i] * (re[i] * turn_im + im[i] * turn_re);
  }
}

}  // namespace returning_wave_dsp
}  // namespace livemix
