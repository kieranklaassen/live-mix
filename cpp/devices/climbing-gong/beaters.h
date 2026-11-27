#pragma once

// What touches the metal of the Climbing Gong.

#include "../../kit/kit.h"

namespace livemix {
namespace climbing_gong_beater {

enum Beater : int { kFelt = 0, kYarn, kWood, kBrush, kBow, kNumBeaters };

// How a beater touches: how long it rests (periods of the key), how long a
// stroke takes (seconds), its own knock (level, pitch), how much of it goes
// straight into the rungs, how strong a stroke is, how it tilts the ground
// register, what it leaves of the low ring, the rush it brings, and how far it
// lets each rung come.
struct Touch {
  float contact, seconds, knock, knock_hz, upper, level, tilt, ring, rush;
  float reach[3];
};
inline const Touch& touch(int beater) {
  static const Touch kTouches[kNumBeaters] = {
      {0.50f, 0.0120f, 0.11f, 260.0f, 0.30f, 1.0f, -0.9f, 1.2f, 0.0f, {0.45f, 0.72f, 0.45f}},   // felt
      {0.10f, 0.0030f, 0.28f, 750.0f, 0.92f, 1.15f, 1.4f, 0.5f, 0.0f, {0.6f, 0.5f, 0.4f}},    // yarn
      {0.02f, 0.0013f, 0.30f, 2100.0f, 3.6f, 1.0f, 2.0f, 0.93f, 0.0f, {1.5f, 0.5f, 3.0f}},     // wood
      {0.30f, 0.2200f, 0.0f, 0.0f, 0.10f, 0.6f, -0.6f, 1.2f, 0.9f, {0.3f, 2.8f, 0.5f}},        // brush
      {0.34f, 0.0900f, 0.0f, 0.0f, 0.50f, 0.10f, -0.6f, 0.7f, 0.0f, {0.8f, 0.35f, 3.0f}},     // bow
  };
  return kTouches[kit::clamp_int(beater, 0, kNumBeaters - 1)];
}

}  // namespace climbing_gong_beater
}  // namespace livemix
