#pragma once

// What a key of Undervoice is made of: the colour and the stance of every
// division, the ramps its values move along, and the voice itself.

#include "../../kit/kit.h"
#include "folds.h"
#include "tract.h"

namespace livemix {
namespace undervoice_dsp {

constexpr int kLanes = 4;  // singers
constexpr int kRings = 8;
constexpr int kControlPeriod = Tract::kPeriod;

// The divisions the knob offers: 32 stands for drips, and 0 asks for the
// shared pulse.
constexpr int kDivisions = 7;
inline constexpr int kDivide[kDivisions] = {1, 2, 3, 4, 8, 32, 0};

// How the voice is made for a group of n pulses: the same folds let
// through less and less of themselves. `edge` moves the corner of the
// folds' spectrum (octaves), `sharp` narrows the gate further, `floor` is
// the undertone's own tone, `drip` hands the voice over to the rings and
// the rings to their upper harmonics, `thin` takes the bottom away, `air`
// is the breath that comes with it. Values between are read by log2 n.
struct Colour {
  float edge, sharp, floor, drip, thin, air, trim;
};
inline constexpr int kColours = 6;
inline constexpr float kColourAt[kColours] = {0.0f, 1.0f, 1.585f, 2.0f, 3.0f, 5.0f};
inline constexpr Colour kColour[kColours] = {
    {0.7f, 0.0f, 0.4f, 0.0f, 0.0f, 1.0f, 1.15f},     // the open voice
    {-2.25f, 0.1f, 1.4f, 0.0f, 0.0f, 0.32f, 1.0f},   // an octave below
    {0.25f, 0.24f, 2.0f, 0.0f, 0.27f, 0.36f, 1.0f},  // a twelfth
    {-1.3f, 0.11f, 1.55f, 0.09f, 0.08f, 0.2f, 1.2f}, // two octaves
    {1.15f, 0.71f, 0.8f, 0.41f, 0.97f, 0.4f, 1.3f},  // a flutter
    {1.4f, 1.0f, 0.0f, 1.0f, 0.91f, 0.05f, 1.4f},    // drips
};
// How the throat stands for a division, within what a singer could do with
// it: a factor on its size, octaves on the lips' corner, a lean along the
// vowels (the ends stay where they are), and factors on the chest and on how
// far apart everything stands.
struct Posture {
  float size, lips, vowel, chest, width;
};
inline constexpr Posture kPosture[kDivisions] = {
    {1.1f, 0.8f, 0.08f, 0.53f, 1.24f},   {1.0f, -0.77f, 0.02f, 1.42f, 0.94f}, {1.27f, -0.61f, 0.1f, 0.7f, 0.6f},    {0.63f, -0.82f, -0.22f, 1.22f, 1.19f},
    {1.35f, 0.29f, 0.21f, 0.31f, 0.84f}, {0.71f, 1.3f, -0.13f, 1.2f, 1.03f}, {0.82f, 0.31f, -0.22f, 0.96f, 0.62f},
};
// The shared pulse: a purr, soft and full of air.
inline constexpr Colour kPurr = {-1.8f, 0.45f, 0.67f, 0.0f, 0.0f, 1.0f, 1.4f};

inline Colour mixed(const Colour& a, const Colour& b, float t) {
  return {kit::lerp(a.edge, b.edge, t), kit::lerp(a.sharp, b.sharp, t), kit::lerp(a.floor, b.floor, t), kit::lerp(a.drip, b.drip, t),
          kit::lerp(a.thin, b.thin, t), kit::lerp(a.air, b.air, t), kit::lerp(a.trim, b.trim, t)};
}

// The colour of a group of n pulses.
inline Colour colour_at(int n) {
  const float at = std::log2(static_cast<float>(n));
  int from = 0;
  while (from < kColours - 2 && at >= kColourAt[from + 1]) ++from;
  const float t = kit::clamp((at - kColourAt[from]) / (kColourAt[from + 1] - kColourAt[from]), 0.0f, 1.0f);
  return mixed(kColour[from], kColour[from + 1], t);
}

// The corner over which the folds' own spectrum falls away, 6 dB an octave
// and another 6 from kTiltAgain times higher.
constexpr float kTiltHz = 560.0f;
constexpr float kTiltAgain = 2.2f;
inline float tilt_for(float hz, float closure) {
  const float key = kit::clamp(std::log2(hz * (1.0f / 220.0f)), -3.0f, 4.0f);
  return kTiltHz * std::exp2(4.7f * closure + 0.35f * key);
}

// How loud ring h (a harmonic of the key) is: even while the voice is a
// voice, and with its weight on the second and fourth as it becomes drops.
constexpr int kDropped = 7;
inline float drip_tilt(int h, float drip) {
  static constexpr float kDrop[kDropped] = {0.0f, 0.2f, 1.0f, 0.5f, 1.1f, 0.4f, 0.7f};
  return 1.0f + drip * (kDrop[h] * 1.4f - 1.0f);
}

// The power a gate leaves a tone, by the hump's own arithmetic.
inline float hump_power(float depth, float narrow, float sharp) {
  float sum = 0.0f;
  for (int i = 0; i < 24; ++i) {
    const float t = (static_cast<float>(i) + 0.5f) * (1.0f / 24.0f);
    float w = t * t * (3.0f - 2.0f * t);
    w += narrow * (w * w * w * w - w);
    w += sharp * (w * w * w * w - w);
    const float gate = 1.0f - depth * (1.0f - w);
    sum += gate * gate;
  }
  return sum * (1.0f / 24.0f);
}

// Where the floor of a group of n pulses lies: on the key divided, or on the
// first octave of it that is a tone and not a flutter.
inline float floor_hz(float hz, int n) {
  float under = hz / static_cast<float>(n);
  while (under < 42.0f) under *= 2.0f;
  return under;
}

// What a key's values move along in, from one control tick to the next.
struct Ramp {
  float value = 0.0f, aim = 0.0f, step = 0.0f;
  void snap(float v) {
    value = aim = v;
    step = 0.0f;
  }
  void head(float target, float coeff) {
    value = aim;
    const float gap = target - aim;
    aim = std::fabs(gap) < 1.0e-6f * std::fabs(target) + 1.0e-9f ? target : aim + gap * coeff;
    step = (aim - value) * (1.0f / static_cast<float>(kControlPeriod));
  }
};
struct RampFour {
  F4 value = {}, aim = {}, step = {};
  void snap(F4 v) {
    value = aim = v;
    step = F4{};
  }
  void head(F4 target, float coeff) {
    value = aim;
    const F4 gap = target - aim;
    const F4 near = 1.0e-6f * undervoice_dsp::size_of(target) + 1.0e-9f;
    aim = undervoice_dsp::pick(undervoice_dsp::size_of(gap) < near, target, aim + gap * coeff);
    step = (aim - value) * (1.0f / static_cast<float>(kControlPeriod));
  }
};

// One of a key's two divisions: how many pulses a group has, how many it
// is asked to have, and how far its gate is in play while the two differ.
struct Slot {
  int n = 1, want = 1;
  float play = 1.0f;
  Colour colour = {};
  Ramp depth, trim;
  float shade = 0.0f;  // how far the colour of the group is in play
  float trim_depth = -1.0f, trim_narrow = -1.0f, trim_now = 1.0f;
};

struct Voice {
  kit::Adsr env;
  kit::Rng cycle;
  kit::Drift wander[kLanes];
  uint32_t air_left = 1, air_right = 2;
  F4 phase = {}, count1 = {}, count2 = {}, jitter = {}, shimmer = {}, group = {1.0f, 1.0f, 1.0f, 1.0f}, increment = {}, per_increment = {};
  RampFour left, right, door;
  RampFour ring_left[2], ring_right[2];
  F4 re[2] = {}, im[2] = {};
  F4 turn_re[2] = {}, turn_im[2] = {}, feed[2] = {};
  float turn_cos[kRings] = {}, turn_sin[kRings] = {};
  float ring_seconds = -1.0f;
  float pan_width = -1.0f, pan_others = -1.0f;
  float pan_left[kLanes] = {}, pan_right[kLanes] = {}, ring_pan_left[kRings] = {}, ring_pan_right[kRings] = {};
  Slot slot[2];
  Ramp open, tilt, tilt_again, force, air, dry, thin;
  float thin_left = 0.0f, thin_right = 0.0f, thin_coeff = 0.0f;
  float low_left = 0.0f, low_right = 0.0f;
  float soft_left = 0.0f, soft_right = 0.0f;
  float tilt_left = 0.0f, tilt_right = 0.0f;
  float fell_left = 0.0f, fell_right = 0.0f;
  float hz = 220.0f, gain = 0.7f, amp = 1.0f;
  float floor_even[2] = {1.0f, 1.0f};
  float evened = 1.0f;   // the levelling, worked out in turns
  float drip = 0.0f;     // how far the voice has gone over to drops
  float crowd = 1.0f;    // how deep this key may gate among its neighbours
  float flip_turn = 0.0f, breath_turn = 0.0f;
  float age = 0.0f;
  bool damped = false, ringing = false;
  int fade_left = 0;
  bool pending = false;
  float next_hz = 0.0f, next_gain = 0.0f;

  bool active() const { return env.active() || ringing || pending || fade_left > 0; }
  bool releasing() const { return !pending && (env.releasing() || !env.active() || fade_left > 0); }
  // True from the moment the voice is taken.
  float level() const {
    if (pending) return 0.3f + 0.7f * next_gain;
    if (env.stage() == kit::Adsr::kAttack) return amp;
    return env.level() * amp;
  }
};

inline void silence(Voice& voice) {
  voice.env.reset();
  voice.fade_left = 0;
  voice.ringing = false;
  for (int b = 0; b < 2; ++b) {
    voice.re[b] = F4{};
    voice.im[b] = F4{};
  }
}

inline float noise(uint32_t& state) {
  state ^= state << 13;
  state ^= state >> 17;
  state ^= state << 5;
  return static_cast<float>(static_cast<int32_t>(state)) * (1.0f / 2147483648.0f);
}

inline void aim_ring(Voice& voice, int lane, float hz, float sr) {
  const float w = kit::kTwoPi * kit::min(hz, 0.45f * sr) / sr;
  voice.turn_cos[lane] = std::cos(w);
  voice.turn_sin[lane] = std::sin(w);
}

}  // namespace undervoice_dsp
}  // namespace livemix
