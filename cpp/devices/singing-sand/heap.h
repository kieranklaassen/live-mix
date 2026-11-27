#pragma once

// What the 24 grains of a key are like, the same for every key: how far off
// each wishes to slide, how loose it lies, its group in a cluster and what it
// weighs, and how hard the mean has to pull for a given share to be in step.

#include "../../kit/kit.h"
#include "sand_pulses.h"

namespace livemix {
namespace sand {

constexpr int kLanes = 4;
constexpr int kRows = 6;
constexpr int kGrains = kLanes * kRows;
constexpr int kMaxGroups = 6;

struct Heap {
  static constexpr int kPulls = 48;
  static constexpr float kMostLock = 0.985f;

  float wish[kGrains] = {};  // -1 to 1 of Spread
  float heat[kGrains] = {};  // how strong its noise is, 1 in the mean
  float warm[kGrains] = {};  // as an amplitude
  float pulls[kPulls + 2] = {};
  float weight[kMaxGroups][kGrains] = {};
  int group[kMaxGroups][kGrains] = {};
  float apart[kMaxGroups] = {};  // what grains out of step add up to, as power

  // Where each grain lies: the rank of its wish, and its group.
  void draw() {
    kit::Rng rng;
    rng.seed(0x5A4D1u);
    int order[kGrains];
    for (int i = 0; i < kGrains; ++i) order[i] = i;
    for (int i = kGrains - 1; i > 0; --i) {
      const int j = static_cast<int>(rng.uniform() * static_cast<float>(i + 1));
      const int kept = order[i];
      order[i] = order[j];
      order[j] = kept;
    }
    float most = 0.0f;
    for (int i = 0; i < kGrains; ++i) {
      const float q = (static_cast<float>(i) + 0.5f) / static_cast<float>(kGrains) - 0.5f;
      wish[order[i]] = std::tan(q * 2.5f);  // a few far out, most near
      most = kit::max(most, wish[order[i]]);
    }
    for (float& w : wish) w /= most;
    // The grains that wish furthest off are the loosest too: a core that locks
    // early, and a halo of grains that run about it.
    float total = 0.0f;
    for (int i = 0; i < kGrains; ++i) {
      const float far = std::atan(std::fabs(wish[i]) * most) * (2.0f / 2.5f);  // 0 to 1 by rank
      heat[i] = 0.1f * std::pow(45.0f, far);
      total += heat[i];
    }
    for (int i = 0; i < kGrains; ++i) {
      heat[i] *= static_cast<float>(kGrains) / total;
      warm[i] = std::sqrt(heat[i]);
    }
    // How hard the mean has to pull, against noise of strength 1, for r to be
    // in step: r is the mean of I1/I0(K r / heat) over the grains.
    for (int n = 0; n <= kPulls; ++n) pulls[n] = solve(kMostLock * static_cast<float>(n) / kPulls);
    for (int n = 0; n < kMaxGroups; ++n) {
      apart[n] = 0.0f;
      for (int i = 0; i < kGrains; ++i) {
        group[n][i] = group_of(i, n + 1);
        weight[n][i] = weight_for(i, n + 1);
        apart[n] += weight[n][i] * weight[n][i];
      }
    }
  }

  // How far in step a field of strength x holds noise of strength 1: I1(x) / I0(x).
  static float held_by(float x) {
    if (x > 12.0f) return 1.0f - 0.5f / x - 0.125f / (x * x) - 0.125f / (x * x * x);
    const float y = 0.25f * x * x;
    float term = 1.0f, zero = 1.0f, one = 1.0f;
    for (int n = 1; n < 40; ++n) {
      const float k = static_cast<float>(n);
      term *= y / (k * k);
      zero += term;
      one += term / (k + 1.0f);
    }
    return 0.5f * x * one / zero;
  }
  float solve(float r) const {
    float low = 0.0f, high = 600.0f;  // the field, K r
    for (int step = 0; step < 40; ++step) {
      const float x = 0.5f * (low + high);
      float mean = 0.0f;
      for (float h : heat) mean += held_by(x / h);
      if (mean < r * static_cast<float>(kGrains)) low = x;
      else high = x;
    }
    return high / kit::max(r, 0.02f);
  }
  float pull_for(float lock) const {
    const float at = kit::clamp(lock / kMostLock, 0.0f, 0.9999f) * kPulls;
    const int n = static_cast<int>(at);
    return pulls[n] + (pulls[n + 1] - pulls[n]) * (at - static_cast<float>(n));
  }

  static int group_of(int i, int count) { return (i / kLanes + i % kLanes) % count; }

  static float weight_for(int i, int count) {
    const float w = sand::group_weight(count);
    const float whole = 1.0f + w * static_cast<float>(count - 1);
    // 24 grains do not fit every count evenly: each carries its group's share.
    int members = 0;
    for (int j = 0; j < kGrains; ++j) members += group_of(j, count) == group_of(i, count) ? 1 : 0;
    return (group_of(i, count) == 0 ? 1.0f : w) / (whole * static_cast<float>(members));
  }
};

}  // namespace sand
}  // namespace livemix
