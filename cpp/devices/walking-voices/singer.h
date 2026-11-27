#pragma once

// A singer of Walking Voices: who they are for life, where they are now and
// how they sing; and what each way of walking and each body does to them.

#include "../../kit/kit.h"
#include "crowd.h"
#include "wavelets.h"

namespace livemix {
namespace walking_dsp {

enum State : int { kHome = 0, kWait, kMove };

// What a manner of walking does to the rest of the voice: how quick it
// comes and goes, how hard it sings, where the mouth stands, how wide the
// crowd stands.
struct Manner {
  float attack, release, effort, vowel, spread;
};
constexpr Manner kManners[5] = {{1.0f, 1.0f, 0.0f, 0.0f, 1.0f},
                                {0.3f, 0.36f, 0.46f, 0.04f, 1.8f},
                                {1.6f, 3.2f, 0.26f, 0.08f, 1.35f},
                                {0.25f, 0.2f, -0.36f, -0.04f, 0.4f},
                                {2.6f, 2.4f, -0.14f, -0.14f, 0.9f}};
// How loud people are on the way there, a walk with a tune in it louder.
constexpr float kOnTheWay[5] = {0.6f, 0.9f, 0.9f, 1.0f, 0.75f};
// What each body does to it: whistlers stand far apart and hummers close
// together, a bow takes time to speak and leaves the wood ringing, a blown
// edge stops with the wind.
constexpr Manner kBodyManners[kBodies] = {{1.0f, 1.0f, 0.0f, 0.0f, 1.0f}, {1.3f, 1.6f, 0.0f, 0.0f, 0.42f},
                                          {0.45f, 0.3f, 0.0f, 0.0f, 0.4f}, {0.6f, 0.6f, 0.0f, 0.0f, 1.6f},
                                          {0.5f, 0.6f, 0.0f, 0.0f, 0.65f}, {2.0f, 2.8f, 0.0f, 0.0f, 1.2f}};

struct Note {
  int id = -1;
  bool held = false;
  bool fresh = false;  // struck since the crowd was last dealt out
  uint32_t serial = 0;
  float pitch = 60.0f;
  float touch = 0.7f;
};

struct Singer {
  // For life.
  float pace = 1.0f;   // how long everything takes them
  float will = 0.0f;   // 0 gives in at once .. 1 never
  float ear = 0.0f;    // which side of the pitch they hear it on, -1 .. 1
  float mouth = 0.0f;  // their own vowel, -1 .. 1
  float spot = 0.0f;   // -1 left .. 1 right
  float depth = 0.0f;  // 0 in front .. 1 at the back
  float side = 1.0f;   // where they come in from when nothing says
  float sway = 5.2f;   // vibrato, Hz
  int priority = 0;    // who sings when the crowd is small
  // Where they are.
  float place = 60.0f, from = 60.0f, goal = 60.0f, home = 60.0f;
  float u = 0.0f, pace_step = 0.0f, wait = 0.0f;
  float age = 0.0f;   // seconds at home
  float beat = 9.0f;  // seconds since the last spoken step
  float next_beat = 0.0f;
  float turning = 0.0f;  // 0..1 through a turn at home, 0 when there is none
  int state = kHome, manner = 0, steps = 1, step_at = 0;
  bool born = false, gate = false, own = true, away = false, lead = false, prompt = false;
  uint32_t serial = 0;
  int note = -1;
  float hush = 0.0f;  // until they come in at all
  float share = 1.0f, lift = 1.0f, tilt = 1.0f;
  float stay = 0.0f;  // until one who is away goes back
  float pure = 0.0f, pure_goal = 0.0f;
  // How they sing.
  float level = 0.0f;  // its square is the gain
  float accent = 1.0f, bright = 0.0f, word = 0.0f, tension = 0.0f;
  uint32_t heard = 0, syllable = 0;
  float touch = 0.7f, touch_goal = 0.7f, weight = 1.0f, front = 0.0f;
  bool risen = false;
  float sinking = 0.0f;
  float sung = 0.0f, phrase = 6.0f, gap = 0.0f, sunk = 1.0f;
  float duck = 1.0f;  // the mouth: closed at 0
  bool closing = false, jump = false, enter = false;
  float body_wait = -1.0f;
  float stand = 0.0f, round = 0.0f;
  float drift[3] = {0.0f, 0.0f, 0.0f}, drift_step[3] = {0.0f, 0.0f, 0.0f};
  float swing = 0.0f;
  kit::Rng rng;
  // What is heard.
  int body = 0, noise_delay = 0;
  float phase = 0.0f;
  bool sounding = false;
  Tone now, step, aim;
};

inline uint32_t seed_for(uint32_t stream) {
  uint32_t x = (stream + 1u) * 0x9E3779B9u;
  x ^= x >> 16;
  x *= 0x85EBCA6Bu;
  x ^= x >> 13;
  x *= 0xC2B2AE35u;
  x ^= x >> 16;
  return x;
}

// A value evenly laid over the crowd in a shuffled order: -1 .. 1.
inline float laid(int i, int stride, int offset) {
  return (2.0f * static_cast<float>((i * stride + offset) % kSingers) + 1.0f) / static_cast<float>(kSingers) - 1.0f;
}

inline void make_singer(Singer& s, int i, float dt, int longest, int ring) {
  s = Singer();
  s.rng.seed(seed_for(static_cast<uint32_t>(i)));
  s.pace = std::exp2(0.9f * laid(i, 13, 5));
  s.will = 0.5f + 0.5f * laid(i, 25, 11);
  s.ear = laid(i, 11, 17);
  s.mouth = laid(i, 5, 23);
  s.spot = laid(i, 19, 3);
  s.depth = 0.5f + 0.5f * laid(i, 29, 8);
  s.side = (i * 7 % 5) & 1 ? 1.0f : -1.0f;
  s.sway = 5.1f * std::exp2(0.22f * laid(i, 31, 2));
  s.priority = (i * 7 + 18) % kSingers;
  for (int k = 0; k < 3; ++k) {
    s.drift[k] = s.rng.uniform();
    s.drift_step[k] = (0.11f + 0.07f * s.rng.uniform()) * (k == 0 ? 1.0f : (k == 1 ? 2.3f : 0.63f)) * dt;
  }
  s.swing = s.rng.uniform();
  s.phase = s.rng.uniform();
  s.noise_delay = longest + static_cast<int>(s.rng.uniform() * static_cast<float>(ring - 2 * longest - 2));
}

// Over the note, under it and home again.
inline float turn_wave(float t) {
  const float lid = 4.0f * t * (1.0f - t);
  return kit::SineTable::lookup(t) * (0.35f + 0.65f * lid) * (t < 0.5f ? 1.1f : 0.75f);
}

// A phrase begins.
inline void renew(Singer& s) {
  s.sung = s.sinking = 0.0f;
  s.risen = false;
  s.sunk = 1.0f;
}

// Another step, another syllable.
inline void speak(Singer& s) {
  s.beat = 0.0f;
  ++s.syllable;
}

}  // namespace walking_dsp
}  // namespace livemix
