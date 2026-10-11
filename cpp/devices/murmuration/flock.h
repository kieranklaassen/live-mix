#pragma once

// The flock that Murmuration (murmuration.h) flies: where each of up to
// sixteen birds is at a given moment of flight, as plain functions of that
// moment. Nothing here keeps state, so the device, its harness and its
// display (src/react/components/displays/murmuration.ts, which copies these
// formulas) all read the same flight.
//
// A bird's place is three numbers: `u`, how deep it is in the range (0 at the
// nearest distance, 1 at the farthest), `v`, how far to the side (-1 hard
// left, 1 hard right, before Spread) and `h`, how high (0..1).
//
//   centre   two slow sines per axis (the shared path the flock follows)
//   size     Together sets how much of the range the flock fills: at size 1
//            the birds are scattered over all of it, at the least size they
//            fly as a tight knot on the centre's path
//   place    each bird has a home in the formation (a sunflower, so no two
//            homes are close) and a small wander of its own around it; the
//            formation turns slowly as a whole
//   wheels   the flight is cut into slots of eight seconds. In the slots that
//            Turns picks (a hash of the slot against the control), the flock
//            leaves its path for a point of the slot's own, bunches up to
//            under half its size on the way, swings its formation half a turn
//            round, and comes back: out, round and home in one slot.
//
// Every rate is a whole number of cycles in kPeriod seconds of flight, so the
// whole flight comes round after kPeriod and the flight time can wrap there.

#include <cmath>
#include <cstdint>

#include "../../kit/math.h"

namespace livemix {
namespace flock {

constexpr int kMaxBirds = 16;
// Seconds of flight after which everything repeats.
constexpr double kPeriod = 1024.0;
// A wheel lasts one slot; kPeriod holds a whole number of them.
constexpr double kSlotSeconds = 8.0;
constexpr int kSlots = 128;

// The centre's path: cycles per kPeriod, weight and starting phase of the two
// sines of each axis.
constexpr int kDepthCycles[2] = {47, 109};
constexpr int kSideCycles[2] = {61, 139};
constexpr float kPathWeight[2] = {0.62f, 0.38f};
constexpr float kDepthPhase[2] = {0.11f, 0.53f};
constexpr float kSidePhase[2] = {0.29f, 0.77f};

// The formation: homes out to kHomeRadius of the flock's half-size, a wander
// of kWander around each (a cycle every 1.5 to 4.4 s, each bird its own), and
// one slow turn of the whole every 16 s.
constexpr float kHomeRadius = 0.78f;
constexpr float kGoldenTurn = 0.381966f;
constexpr float kWander = 0.1f;
constexpr int kChurnCycles = 64;

// The flock's size at Together 1, as a share of the range, and the curve of
// the control between there and 1.
constexpr float kLeastSize = 0.08f;

// A wheel: how far towards the slot's point the centre goes, how much of its
// size the flock gives up, and how far round the formation swings (cycles),
// all at the middle of the slot. kTurnsEdge is the width of the band of
// Turns over which a slot's wheel grows from nothing to whole.
constexpr float kSwoop = 0.85f;
constexpr float kBunch = 0.6f;
constexpr float kSwing = 0.5f;
constexpr float kTurnsEdge = 0.15f;

// The most a bird's depth can change per second of flight, whatever the
// controls: each term of d(u)/d(tau) at its greatest.
//   centre     0.5 * 2pi/1024 * (0.62 * 47 + 0.38 * 109)          = 0.2165
//   swoop      kSwoop * pi / 8                                    = 0.3338
//   bunching   kBunch * pi / 8                                    = 0.2356
//   formation  0.5 * (kHomeRadius * 2pi * (64/1024 + kSwing * pi / 8)
//                     + kWander * 2pi * 668/1024)                 = 0.8393
// The flight itself never comes near all four at once: the harness finds a
// third of this at most.
constexpr float kMaxDepthRate = 1.63f;

inline uint32_t mix32(uint32_t z) {
  z ^= z >> 16;
  z *= 0x7FEB352Du;
  z ^= z >> 15;
  z *= 0x846CA68Bu;
  z ^= z >> 16;
  return z;
}

// A number in [0, 1) that belongs to a slot; `salt` picks which.
inline float chance(int slot, uint32_t salt) {
  return static_cast<float>(mix32(static_cast<uint32_t>(slot) * 0x9E3779B1u + salt) >> 8) *
         (1.0f / 16777216.0f);
}

// sin(2 pi phase) for a phase that may lie under nought (down to -1).
// kit::SineTable::lookup brings a phase into [0, 1) by taking its floor off,
// and for a phase between -2^-25 and nought that comes to 1 as a float: it
// then reads the entry after the table's last. The turn added here is the
// one the lookup adds, so every other phase gives the number it always gave,
// and a sum of 1 is taken to 0 by the lookup's own floor.
inline float sine(float phase) {
  return kit::SineTable::lookup(phase < 0.0f ? phase + 1.0f : phase);
}

// sin(2 pi (cycles * tau / kPeriod + offset)).
inline float wave(double tau, int cycles, float offset) {
  const double phase = static_cast<double>(cycles) * tau * (1.0 / kPeriod) + offset;
  return kit::SineTable::lookup(static_cast<float>(phase - std::floor(phase)));
}

// What the whole flock shares at a moment of flight.
struct Flight {
  float u;      // the centre's depth, 0..1
  float v;      // the centre's side, -1..1
  float size;   // how much of the range the flock fills, kLeastSize..1
  float twist;  // how far round the formation has turned, in cycles
  float wheel;  // how far into a wheel the flock is, 0..1 (0 between wheels)
};

inline float size_of(float together) {
  const float loose = kit::clamp(1.0f - together, 0.0f, 1.0f);
  return kLeastSize + (1.0f - kLeastSize) * loose * std::sqrt(loose);
}

inline Flight flight(double tau, float together, float turns) {
  Flight f;
  f.u = 0.5f + 0.5f * (kPathWeight[0] * wave(tau, kDepthCycles[0], kDepthPhase[0]) +
                       kPathWeight[1] * wave(tau, kDepthCycles[1], kDepthPhase[1]));
  f.v = kPathWeight[0] * wave(tau, kSideCycles[0], kSidePhase[0]) +
        kPathWeight[1] * wave(tau, kSideCycles[1], kSidePhase[1]);
  f.size = size_of(together);
  f.twist = static_cast<float>(kChurnCycles) * static_cast<float>(tau * (1.0 / kPeriod));

  const double slots = tau * (1.0 / kSlotSeconds);
  const double whole = std::floor(slots);
  const int slot = ((static_cast<int>(whole) % kSlots) + kSlots) % kSlots;
  const float amount = kit::clamp(
      ((1.0f + kTurnsEdge) * turns - chance(slot, 0x51u)) * (1.0f / kTurnsEdge), 0.0f, 1.0f);
  f.wheel = 0.0f;
  if (amount > 0.0f) {
    const float half = kit::SineTable::lookup(0.5f * static_cast<float>(slots - whole));
    const float bump = amount * half * half;  // amount * sin^2(pi x)
    const float to_u = chance(slot, 0xA7u);
    const float to_v = 2.0f * chance(slot, 0x3Du) - 1.0f;
    const float way = chance(slot, 0xC9u) < 0.5f ? -1.0f : 1.0f;
    f.u += (to_u - f.u) * kSwoop * bump;
    f.v += (to_v - f.v) * kSwoop * bump;
    f.size *= 1.0f - kBunch * bump;
    f.twist += way * kSwing * bump;
    f.wheel = bump;
  }
  return f;
}

struct Place {
  float u;  // depth in the range, 0 nearest .. 1 farthest
  float v;  // side, -1 left .. 1 right
  float h;  // height, 0..1
};

// Each bird's own numbers: its home in the formation and the rates and
// phases of its wander and of its rise and fall.
inline float home_radius(int bird) {
  return kHomeRadius * std::sqrt((static_cast<float>(bird) + 0.5f) / static_cast<float>(kMaxBirds));
}
inline float home_turn(int bird) { return static_cast<float>(bird) * kGoldenTurn; }
inline int wander_cycles_u(int bird) { return 233 + 29 * ((7 * bird) % 16); }
inline int wander_cycles_v(int bird) { return 241 + 31 * ((5 * bird + 3) % 16); }
inline int height_cycles(int bird) { return 71 + 9 * ((3 * bird + 1) % 16); }
inline float wander_phase_u(int bird) { return static_cast<float>(bird) * 0.618034f + 0.1f; }
inline float wander_phase_v(int bird) { return static_cast<float>(bird) * 0.754878f + 0.6f; }
inline float height_phase(int bird) { return static_cast<float>(bird) * 0.445f + 0.3f; }

inline Place place(int bird, double tau, const Flight& f) {
  const float turn = home_turn(bird) + f.twist;
  const float radius = home_radius(bird);
  // The first bird's turn is the twist alone, which a wheel takes under nought.
  const float own_u = radius * sine(turn + 0.25f) +
                      kWander * wave(tau, wander_cycles_u(bird), wander_phase_u(bird));
  const float own_v = radius * sine(turn) +
                      kWander * wave(tau, wander_cycles_v(bird), wander_phase_v(bird));
  Place p;
  p.u = f.u * (1.0f - f.size) + f.size * (0.5f + 0.5f * own_u);
  p.v = f.v * (1.0f - f.size) + f.size * own_v;
  p.h = 0.5f + 0.5f * wave(tau, height_cycles(bird), height_phase(bird));
  return p;
}

// --- From a place to a sound ------------------------------------------------

constexpr float kSoundSpeed = 343.0f;  // metres per second
// The nearest a bird comes, as a share of Range.
constexpr float kNearShare = 0.125f;
constexpr float kFarOverNear = 1.0f / kNearShare;
// The fastest any bird may close on the listener or leave, by the bound
// above: half the speed of sound. A flock with a long range flies slower
// than Speed says once Speed times its range would pass this.
constexpr float kMaxRadialSpeed = 0.5f * kSoundSpeed;
// A bird at no distance and full height is not dulled: a one-pole at kOpenHz.
// The farthest bird at Air 1 is kAirOctaves lower, the lowest at Lift 1
// kLiftOctaves lower again.
constexpr float kOpenHz = 20000.0f;
constexpr float kAirOctaves = 3.5f;
constexpr float kLiftOctaves = 2.5f;

inline float near_metres(float range) { return range * kNearShare; }
inline float distance_metres(float range, float u) {
  return range * (kNearShare + (1.0f - kNearShare) * u);
}
inline float delay_seconds(float range, float u) { return distance_metres(range, u) / kSoundSpeed; }

// Seconds of flight per second: Speed, held back for a long range.
inline float flight_rate(float speed, float range) {
  const float most = kMaxRadialSpeed / (range * (1.0f - kNearShare) * kMaxDepthRate);
  return speed < most ? speed : most;
}

// How loud a bird at depth u is: the inverse of its distance to the power
// Air (Air 1 is the open-air law, 6 dB per doubling; Air 0 is no loss), as
// loud as the voice at kLevelRatio times the nearest distance. That is where
// the flight keeps a bird's mean power within 1.5 dB of one at any setting
// (the harness measures it): nearer birds are louder than the voice, up to
// 12 dB at the nearest point at Air 1, and farther ones quieter, down to 6,
// before the ceiling below.
constexpr float kLevelRatio = 4.0f;
inline float loudness(float u, float air) {
  const float ratio = (1.0f + (kFarOverNear - 1.0f) * u) * (1.0f / kLevelRatio);
  return std::exp(-air * std::log(ratio));
}

// The flock as a whole is held to kCeilingPower times the voice's power
// (3 dB): by the law above a tight flock passing close at Air 1 would be
// 12 dB over the sound it copies, for as long as it stays there. `power` is
// the birds' mean square loudness; what comes back scales every bird alike,
// so the near ones still stand out from the far ones. The knee is soft: at
// the voice's own power it takes off 0.07 dB.
constexpr float kCeilingPower = 2.0f;
inline float ceiling(float power) {
  const float over = power * (1.0f / kCeilingPower);
  const float fourth = over * over * over * over;
  return 1.0f / std::sqrt(std::sqrt(std::sqrt(1.0f + fourth)));
}

// A bird that joins or leaves when Birds changes does it on this curve of
// the fade's 0..1: no step at either end, in level or in slope.
inline float ease(float x) {
  const float t = kit::clamp(x, 0.0f, 1.0f);
  return t * t * (3.0f - 2.0f * t);
}

// Turns changes what the flock is doing in the wheel it is in, so the flight
// follows the control no faster than this per second of flight: a wheel that
// a turn of the knob brings in or takes away moves the birds no faster than
// a wheel of the flight's own does.
constexpr float kTurnsSlew = 0.03f;

// Where a bird is heard between the sides, -1 left to 1 right: Spread opens
// the flock up to a quarter turn either side of straight ahead, and a bird is
// panned by the sine of its bearing, as far off the middle as it is to the
// side of the listener.
inline float pan(float v, float spread) {
  return sine(0.25f * kit::clamp(spread * v, -1.0f, 1.0f));
}

// The corner of the one-pole that dulls a bird.
inline float cutoff_hz(float u, float h, float air, float lift) {
  return kOpenHz * std::exp2(-(air * kAirOctaves * u + lift * kLiftOctaves * (1.0f - h)));
}

}  // namespace flock
}  // namespace livemix
