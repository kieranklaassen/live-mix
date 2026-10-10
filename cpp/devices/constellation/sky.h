#pragma once

// The sky of Constellation: where a pattern puts each of the twelve stars,
// and how each star's time wanders. Plain functions of a pattern, a seed and
// a clock, with no state, so the harness and the plate's display
// (src/react/components/displays/constellation.ts) can work the same sums.
//
// A sky is twelve places. Place 0 is the last star: it stands at the end of
// the span (time 1) whatever the pattern, so with one star the device is one
// echo at Span, and it is the star that feeds the line again. Places 1 to 11
// are the pattern's. Stars is how many places are lit, from 0 up, and a
// pattern is laid out so that its first few places are a sky already and the
// rest fill it in: turning Stars up never moves a star that is sounding.
//
//   Spiral   time ratio^i from the last star back: each gap is longer than
//            the one before by the same ratio (0.58 to 0.78 by the seed), a
//            run that slows down. Sides wind round by the golden angle.
//   Cluster  three or four groups about evenly apart (each centre off the
//            even place by up to an eighth of a step), three or four stars
//            each, 2 to 5 % of the span apart inside a group.
//   Scatter  the golden sequence (i times 0.618..., wrapped) from a seeded
//            start, each place nudged: irregular, and never two close
//            together. Sides and brightness by chance.
//   Ladder   rungs at i read backwards in base two (1/2, 1/4, 3/4, 1/8 ...)
//            bent by a power of 1.14 to 1.44 or its inverse, so the steps are
//            even to the eye and never on a pulse. They walk from one side
//            to the other and the coarser rungs are the brighter.
//   Gather   Spiral the other way round: the gaps shrink by the ratio and
//            the stars draw together on the last one.

#include "../../kit/math.h"

namespace livemix {
namespace constellation {

constexpr int kPlaces = 12;
constexpr int kPatterns = 5;
enum Pattern : int { kSpiral = 0, kCluster, kScatter, kLadder, kGather };

// Where the last star stands to the side, of a full ±1 (its sign is the seed's).
constexpr float kAnchorPan = 0.8f;
// asin(kAnchorPan) as a share of a turn: the turn at which the winding passes the last star.
constexpr float kAnchorTurn = 0.14758362f;
// The golden angle as a share of a turn (1 - 1/phi), and 1/phi.
constexpr float kGoldenTurn = 0.38196601f;
constexpr float kGoldenStep = 0.61803399f;
// Spiral and Gather: the ratio of one gap to the next.
constexpr float kRatioLeast = 0.58f;
constexpr float kRatioRange = 0.2f;
// Ladder: how far the bending power is from 1.
constexpr float kWarpLeast = 0.14f;
constexpr float kWarpRange = 0.3f;
// Cluster: the gap between two stars of a group, as a share of the span.
constexpr float kFlamLeast = 0.022f;
constexpr float kFlamRange = 0.028f;
// Scatter: the share of the span the sequence fills, where it starts, and the nudge.
constexpr float kScatterFrom = 0.05f;
constexpr float kScatterFill = 0.9f;
constexpr float kScatterNudge = 0.012f;

struct Sky {
  float time[kPlaces];  // share of the span, in (0, 1]
  float pan[kPlaces];   // -1 left to 1 right, before Width
  float mag[kPlaces];   // how bright the pattern makes the star, 0..1
};

// The seed of a pattern's random numbers (kit::Rng, xorshift32): the pattern
// and the seed through a mixing hash, so neighbouring seeds share nothing.
// The first number drawn is the side of the last star; Cluster and Scatter
// draw the rest of their skies after it.
inline uint32_t sky_seed(int pattern, int seed) {
  uint32_t mixed = static_cast<uint32_t>(pattern + 1) * 0x9E3779B9u + static_cast<uint32_t>(seed) * 0x85EBCA6Bu;
  mixed ^= mixed >> 16;
  mixed *= 0x7FEB352Du;
  mixed ^= mixed >> 15;
  mixed *= 0x846CA68Bu;
  mixed ^= mixed >> 16;
  return mixed == 0 ? 0x2545F491u : mixed;
}

// A seed's share of a range, 0..1, for the patterns one number shapes (the
// ratio of Spiral and Gather, the bend of Ladder): the golden sequence, so
// the sixteen seeds are spread over the range, no two fall together, and a
// seed's neighbours are far from it. In doubles, so the display's sum is the
// same to the last bit.
inline float seed_share(int pattern, int seed) {
  double turn = (seed + 0.37 * (pattern + 1)) * 0.6180339887498949;
  turn -= std::floor(turn);
  return static_cast<float>(turn);
}

inline void lay_out(int pattern, int seed, Sky* sky) {
  kit::Rng rng;
  rng.seed(sky_seed(pattern, seed));
  const float dir = rng.uniform() < 0.5f ? -1.0f : 1.0f;
  sky->time[0] = 1.0f;
  sky->pan[0] = dir * kAnchorPan;
  sky->mag[0] = 1.0f;
  switch (pattern) {
    case kSpiral: {
      const float ratio = kRatioLeast + kRatioRange * seed_share(pattern, seed);
      float time = 1.0f;
      for (int i = 1; i < kPlaces; ++i) {
        time *= ratio;
        sky->time[i] = time;
        sky->pan[i] = dir * std::sin(kit::kTwoPi * (kAnchorTurn + static_cast<float>(i) * kGoldenTurn));
        sky->mag[i] = 1.0f - 0.04f * static_cast<float>(i);
      }
      break;
    }
    case kCluster: {
      const int groups = rng.uniform() < 0.5f ? 3 : 4;
      float centre[4] = {1.0f, 0.0f, 0.0f, 0.0f};
      float side[4] = {dir * kAnchorPan, 0.0f, 0.0f, 0.0f};
      float behind[4] = {0.0f, 0.0f, 0.0f, 0.0f};
      for (int g = 1; g < groups; ++g) {
        centre[g] = (static_cast<float>(g) + 0.5f * (rng.uniform() - 0.5f)) / static_cast<float>(groups);
        side[g] = 0.9f * rng.bipolar();
      }
      for (int i = 1; i < kPlaces; ++i) {
        const int g = i % groups;
        const int member = i / groups;
        if (member == 0) {
          // The head of a group: on its centre, the last of its group to sound.
          sky->time[i] = centre[g];
          sky->pan[i] = side[g];
          sky->mag[i] = 0.9f;
        } else {
          behind[g] += kFlamLeast + kFlamRange * rng.uniform();
          sky->time[i] = centre[g] - behind[g];
          sky->pan[i] = kit::clamp(side[g] + 0.3f * rng.bipolar(), -1.0f, 1.0f);
          sky->mag[i] = 0.85f - 0.15f * static_cast<float>(member);
        }
      }
      break;
    }
    case kScatter: {
      const float start = rng.uniform();
      for (int i = 1; i < kPlaces; ++i) {
        float place = start + static_cast<float>(i) * kGoldenStep;
        place -= std::floor(place);
        sky->time[i] = kScatterFrom + kScatterFill * place + kScatterNudge * rng.bipolar();
        sky->pan[i] = rng.bipolar();
        sky->mag[i] = 0.45f + 0.55f * rng.uniform();
      }
      break;
    }
    case kGather: {
      const float ratio = kRatioLeast + kRatioRange * seed_share(pattern, seed);
      float gap = 1.0f;
      for (int i = 1; i < kPlaces; ++i) {
        gap *= ratio;
        sky->time[i] = 1.0f - gap;
        const float wind = std::sin(kit::kTwoPi * (kAnchorTurn + static_cast<float>(i) * kGoldenTurn));
        // From anywhere at the start to the last star's own side at the end.
        sky->pan[i] = dir * (kAnchorPan * (1.0f - gap) + gap * wind);
        sky->mag[i] = 0.56f + 0.04f * static_cast<float>(i);
      }
      break;
    }
    case kLadder:
    default: {
      // The lower half of the seeds' shares bends the rungs late, the upper half early.
      const float share = 2.0f * seed_share(pattern, seed);
      const float warp = share < 1.0f ? 1.0f + kWarpLeast + kWarpRange * share
                                      : 1.0f / (1.0f + kWarpLeast + kWarpRange * (share - 1.0f));
      for (int i = 1; i < kPlaces; ++i) {
        float rung = 0.0f;
        float bit = 0.5f;
        int depth = 0;
        for (int n = i; n > 0; n >>= 1) {
          if (n & 1) rung += bit;
          bit *= 0.5f;
          ++depth;
        }
        sky->time[i] = std::pow(rung, warp);
        sky->pan[i] = dir * kAnchorPan * (2.0f * rung - 1.0f);
        sky->mag[i] = 1.0f - 0.15f * static_cast<float>(depth);
      }
      break;
    }
  }
}

// --- Fade -------------------------------------------------------------------
//
// What Fade leaves of a star at `time` (share of the span): 2^(-3 Fade time).
// Its level is times this and its low-pass corner is times this, so at full
// Fade the last star is 18 dB quieter and three octaves darker than a star
// at the start.
constexpr float kFadeOctaves = 3.0f;
inline float fade_share(float fade, float time) {
  return std::exp(-0.69314718f * kFadeOctaves * fade * time);
}

// A star's low-pass corner: Tone, times what Fade leaves, and up to an octave
// lower for a star the pattern made dim. Never under kDarkestHz.
constexpr float kDarkestHz = 150.0f;
inline float star_corner(float tone_hz, float fade_share_of_star, float mag) {
  return kit::max(kDarkestHz, tone_hz * fade_share_of_star * (0.5f + 0.5f * mag));
}

// --- Drift ------------------------------------------------------------------
//
// Each star's time wanders by three sines of its own, summed to about ±1.
// Their rates are whole numbers of turns in kDriftPeriodSeconds (0.11 to
// 0.77 Hz), so the whole wander comes round in that time and is a function of
// a clock that wraps there: the device counts samples, the display reads the
// clock as a meter, and both work this out.
constexpr int kDriftPeriodSeconds = 512;
constexpr int kDriftParts = 3;
constexpr int kDriftTurns[kDriftParts] = {97, 59, 163};
constexpr int kDriftTurnsStep[kDriftParts] = {13, 9, 21};
constexpr float kDriftWeight[kDriftParts] = {0.5f, 0.3f, 0.2f};
// The furthest Drift moves a star's time, in seconds, at 1 ...
constexpr float kDriftSeconds = 0.006f;
// ... and never more than this share of the star's own time, so a star close
// to the note cannot wander past it.
constexpr float kDriftShare = 0.5f;

// Turns of part `part` of star `star` in one period.
inline int drift_turns(int star, int part) {
  return kDriftTurns[part] + kDriftTurnsStep[part] * ((5 * star) % kPlaces);
}

// Where part `part` of star `star` starts, in turns.
inline double drift_start(int star, int part) {
  const double turn = (star + 1) * 0.6180339887498949 * (part + 1);
  return turn - std::floor(turn);
}

// The wander of `star` at `clock` (a share of the period, 0..1), about ±1.
inline float drift_at(int star, double clock) {
  float sum = 0.0f;
  for (int part = 0; part < kDriftParts; ++part) {
    double turn = drift_start(star, part) + drift_turns(star, part) * clock;
    turn -= std::floor(turn);
    sum += kDriftWeight[part] * kit::SineTable::lookup(static_cast<float>(turn));
  }
  return sum;
}

}  // namespace constellation
}  // namespace livemix
