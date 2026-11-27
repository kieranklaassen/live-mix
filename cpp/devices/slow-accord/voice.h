#pragma once

// One key of Slow Accord, where its overtones go and how they get there: the
// parts of slow_accord.h that know nothing of the other keys.

#include "../../kit/kit.h"
#include "materials.h"

namespace livemix {
namespace slow_accord {

constexpr int kHolders = 12;
constexpr float kPeak = 0.04f;  // of a stroke or a breath

enum Goal : int { kChord = 0, kOwn, kOctaves, kBass };
enum State : int { kMetal = 0, kMoving, kRested, kHome };

// One key. Arrays are by partial: 0 is the note, the overtones follow in
// the order of the metal.
struct Voice {
  float sway[kPartials] = {};                                   // how much it hangs on the pendulum
  float bare[kPartials] = {};                                   // how loud it is in the metal
  float before[kPartials] = {};                                 // how much of it was heard when it left
  float phase[kPartials] = {}, hz[kPartials] = {}, still[kPartials] = {};      // hz before it is drawn
  float re[kPartials] = {}, im[kPartials] = {}, turn_re[kPartials] = {}, turn_im[kPartials] = {};
  float left[kPartials] = {}, right[kPartials] = {}, left_step[kPartials] = {}, right_step[kPartials] = {};
  float gust[kPartials] = {}, breath[kPartials] = {};                  // noise through one pole, and through two
  float metal[kPartials] = {}, place[kPartials] = {}, goal[kPartials] = {};  // octaves over the note
  float from[kPartials] = {}, to[kPartials] = {}, aim[kPartials] = {}, clock[kPartials] = {}, span[kPartials] = {};
  float amp[kPartials] = {}, rest[kPartials] = {}, struck[kPartials] = {}, lift[kPartials] = {}, shape[kPartials] = {};
  float tone[kPartials] = {};                                   // tilt and the top edge
  float die[kPartials] = {};                                    // nepers a second, as metal
  float beat[kPartials] = {}, beat_hz[kPartials] = {}, depth[kPartials] = {};
  float pan[kPartials] = {}, chance[kPartials] = {}, restless[kPartials] = {}, wait[kPartials] = {}, stroke[kPartials] = {}, side[kPartials] = {};
  int state[kPartials] = {};
  bool homeward[kPartials] = {}, strayed[kPartials] = {};
  int count = 0, material = 0, turns = 0;
  float hz0 = 440.0f, octave0 = 0.0f, gain = 0.0f;
  float bloom = 0.0f, pendulum = 0.0f, swung_left = 0.0f, swung_right = 0.0f;
  float env = 0.0f, rise = 0.0f, age = 0.0f, fade = 1.0f;
  float trim = 1.0f, trim_to = 1.0f, strike = 0.0f, makeup = 1.0f, follow = 0.0f, heard = 0.0f, track = 0.0f, colour = 0.0f, gather_to = 1.0f;
  float knock = 0.0f, knock_keep = 0.0f;
  kit::Svf knock_filter;
  kit::Rng rng;
  bool sounding = false, pending = false, damped = false;
  float next_hz = 440.0f, next_gain = 0.0f;
  uint32_t stamp = 0;
  int holders = 0;
  int ids[kHolders] = {};

  bool used() const { return sounding || pending; }
  bool held() const { return sounding && !pending && holders > 0; }
  bool holds(int id) const {
    for (int i = 0; i < holders; ++i) {
      if (ids[i] == id) return true;
    }
    return false;
  }
  void hold(int id) {
    drop(id);
    if (holders == kHolders) {
      for (int i = 1; i < kHolders; ++i) ids[i - 1] = ids[i];
      --holders;
    }
    ids[holders++] = id;
  }
  void drop(int id) {
    for (int i = 0; i < holders; ++i) {
      if (ids[i] != id) continue;
      for (int j = i + 1; j < holders; ++j) ids[j - 1] = ids[j];
      --holders;
      return;
    }
  }
};

// --- goals ------------------------------------------------------------------

// The tone under the lowest key, an octave down where that can be heard.
inline float under(float lowest) { return lowest > std::log2(60.0f) ? lowest - 1.0f : lowest; }

// How loud an overtone rests, by where it is (octaves over its note).
inline float rest_level(int goal, float octaves) {
  switch (goal) {
    case kOwn:
      return std::exp2(0.5f * octaves);
    case kOctaves:
      return octaves < 0.0f ? 1.1f : std::exp2(1.1f * octaves);
    case kBass:
      return octaves < 0.0f ? 4.2f : std::exp2(-3.0f * kit::min(octaves, 1.2f));
    default:
      return octaves < 0.0f ? 0.5f : std::exp2(-0.45f * octaves);
  }
}

// The octaves the metal's colour tells on.
inline float coloured(int goal, float octaves) { return octaves > 0.0f ? octaves : (goal == kBass ? 0.0f : -0.45f); }

inline float nearest(const float* tones, int total, float to) {
  float best = tones[0];
  for (int i = 1; i < total; ++i) {
    if (std::fabs(tones[i] - to) < std::fabs(best - to)) best = tones[i];
  }
  return best;
}

inline void send(Voice& voice, int k, float aim, float bend) {
  voice.aim[k] = aim;
  voice.goal[k] = bend >= 1.0f ? aim : voice.metal[k] + (aim - voice.metal[k]) * bend;
}

// --- on the way -------------------------------------------------------------

inline float ease(float t) { return t * t * (3.0f - 2.0f * t); }

// The stroke of Manner's right half: up in a fortieth, then dying away.
inline float stroke_at(float t) {
  const float close = t > 0.9f ? ease((1.0f - t) * 10.0f) : 1.0f;
  return (t < 0.04f ? ease(t * 25.0f) : 1.0f) * 1.5f * std::exp2(-4.5f * t) * close;
}
// How much of a resting overtone is heard, by where it is in its breath or
// its stroke (0 to 1; the peak is at kPeak).
inline float resting_shape(float manner, float at) {
  if (manner >= 0.0f) return 1.0f + manner * (stroke_at(at) - 1.0f);
  const float x = 0.5f + 0.5f * kit::SineTable::cos_lookup(at - kPeak);
  return 1.0f - manner * (1.4f * x * x - 1.0f);
}

// Where an overtone is on its way and how much of it is heard: `t` of a way of
// `span` seconds is done, and `before` of it was heard where it left.
struct Path {
  float place, shape;
};
inline Path path_at(float t, float span, float from, float to, float manner, float swing, float before) {
  // A swinging one is there sooner, and spends the rest of its time swinging.
  const float early = kit::min(t / (1.0f - 0.5f * swing), 1.0f);
  const float apart = from - to;
  float left, shape = 1.0f, gone = 1.0f;  // what is left of the way
  if (manner > 0.0f) {
    const int hops = kit::clamp_int(static_cast<int>(span / 0.11f), 1, 5);
    const float at = t * static_cast<float>(hops);
    const int hop = kit::clamp_int(static_cast<int>(at), 0, hops - 1);
    const float within = kit::max(at - static_cast<float>(hop) - (hop == 0 ? 0.08f : 0.0f), 0.0f);
    const float hopped = (static_cast<float>(hop) + ease(kit::min(within / (0.03f + 0.97f * (1.0f - manner)), 1.0f))) / static_cast<float>(hops);
    const float u = 1.0f - ease(early);
    left = (1.0f - manner) * u * u + manner * (1.0f - hopped);
    // What was heard goes first, and then each hop is a stroke.
    const float beat = at - std::floor(at);
    gone = ease(kit::min(at * 10.0f, 1.0f));
    const float stroke = at < 0.1f ? 1.0f - ease(at * 10.0f) : (at < 1.0f ? stroke_at((at - 0.1f) / 0.9f) : stroke_at(beat));
    shape = 1.0f + manner * (stroke - 1.0f);
  } else {
    const float u = 1.0f - ease(early);
    gone = ease(kit::min(t * 2.5f, 1.0f));
    const float jump = ease(kit::clamp((early - 0.4f) * 25.0f, 0.0f, 1.0f));
    left = (1.0f + manner) * u * u - manner * (1.0f - jump);
    const float dissolve = t < 0.4f ? 1.0f - ease(t * 2.5f) : (t < 0.44f ? 0.0f : 1.4f * ease((t - 0.44f) / 0.56f));
    shape = 1.0f - manner * (dissolve - 1.0f);
  }
  shape += (before - 1.0f) * (1.0f - gone);
  float place = to + apart * left;
  const float reach = swing * kit::clamp(0.7f * std::fabs(apart), 0.06f, 0.28f) * (apart < 0.0f ? -1.0f : 1.0f);
  place -= reach * kit::SineTable::lookup(1.75f * t * t) * (1.0f - t) * (1.0f - t) * 2.2f;
  return {place, shape};
}

}  // namespace slow_accord
}  // namespace livemix
