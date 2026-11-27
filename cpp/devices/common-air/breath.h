#pragma once

// The lung all the reeds of Common Air drink from: how full it is, which way
// the air goes and what pressure stands at the root. Runs on the control
// clock; the harness can drive it alone.

#include "../../kit/kit.h"

namespace livemix {
namespace common_air {

struct Breath {
  enum Mode : int { kOut = 0, kIn, kBoth, kCircular, kOnce };

  float air = 1.0f;       // what is left of this breath, 1 to 0
  float pressure = 0.0f;  // at the root, 0 to about 1.05
  float near = 0.0f;      // the first of the two lags pressure is behind
  float cheek = 0.0f;     // where the cheeks stand in circular breathing, cycles
  float sniff = 0.0f;     // 1 in the middle of the catch through the nose
  float timer = 0.0f;     // seconds since the breath turned
  bool turning = false;
  bool parted = false;    // the small volumes are on their own until the root is back
  int way = 1;            // 1 out, -1 in
  uint32_t count = 0;     // breaths taken

  void reset() { *this = Breath(); }

  // A fresh breath: what a player takes before the first key. Who breathes
  // both ways takes the next phrase (`other`) on the other one.
  void restart(bool other = false) {
    air = 1.0f;
    turning = false;
    parted = false;
    timer = 0.0f;
    way = other ? -way : 1;
    ++count;
  }

  // The root stands at once where this breath begins (out of silence).
  void snap(int mode) { near = pressure = curve(mode); }

  // What the breath would hold at its present point.
  float curve(int mode) const {
    const float spent = kit::clamp(1.0f - air, 0.0f, 1.0f);
    switch (mode) {
      case kOut:
        return 1.0f - 0.9f * spent * std::sqrt(spent);
      case kIn:
        return 0.3f + 0.75f * spent * std::sqrt(spent);
      case kBoth:
        if (way > 0) return 1.0f - 0.5f * spent * std::sqrt(spent);
        return 0.78f + 0.3f * kit::SineTable::lookup(0.5f * std::sqrt(spent)) - 0.42f * spent * spent;
      case kCircular:
        return (0.92f - 0.08f * kit::SineTable::lookup(cheek)) * (1.0f - kSniffDepth * sniff);
      case kOnce:
      default:
        return air;
    }
  }

  // One control tick of `dt` seconds. `lung` is how long one key's breath
  // lasts, `turn` how long the change of direction takes, `demand` how much
  // faster than one key the sounding reeds empty the lung.
  void tick(int mode, float dt, float lung, float turn, float demand) {
    float target;
    sniff = 0.0f;
    if (mode == kCircular) {
      turning = false;
      cheek += dt / lung;
      cheek -= std::floor(cheek);
      // Once round, the cheeks hold the tone while the nose fetches air.
      const float length = kit::min(0.5f, 0.45f * turn / lung);
      const float into = (cheek - 0.15f) / length;
      if (into > 0.0f && into < 1.0f) sniff = 0.5f - 0.5f * kit::SineTable::cos_lookup(into);
      way = 1;
      target = curve(mode);
    } else if (mode == kOnce) {
      turning = false;
      way = 1;
      // It is held for a while before it falls.
      timer += dt;
      const float given = kit::min(1.0f, timer / (0.5f * turn));
      air = flush_denormal(air * std::exp(-kOnceFall * given * dt * kit::min(demand, 2.0f) / lung));
      target = curve(mode);
    } else if (turning) {
      timer += dt;
      target = 0.0f;
      const float gap = mode == kOut ? 0.8f : (mode == kIn ? 0.5f : 0.28f);
      if (timer >= gap * turn) {
        turning = false;
        air = 1.0f;
        ++count;
        way = mode == kBoth ? -way : (mode == kIn ? -1 : 1);
        target = curve(mode);
      }
    } else {
      if (mode != kBoth) way = mode == kIn ? -1 : 1;
      air -= dt * demand / lung;
      if (air <= 0.0f) {
        air = 0.0f;
        turning = true;
        timer = 0.0f;
      }
      target = curve(mode);
    }
    // Two equal lags: the pressure leaves and arrives without a corner.
    const float seconds = mode == kOnce ? 0.003f : 0.006f + 0.085f * turn;
    const float coeff = 1.0f - std::exp(-dt / seconds);
    near = flush_denormal(near + (target - near) * coeff);
    pressure = flush_denormal(pressure + (near - pressure) * coeff);
    if (turning) parted = true;
    if (!turning && pressure > 0.85f * target) parted = false;
  }

 private:
  static constexpr float kSniffDepth = 0.3f;
  static constexpr float kOnceFall = 4.0f;
};

}  // namespace common_air
}  // namespace livemix
