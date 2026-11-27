#pragma once

// What Setting Glass is made of, and one piece of it.

#include "../../kit/kit.h"

namespace livemix {
namespace setting_glass {

constexpr int kModes = 32;
constexpr int kPartials = 24;  // the first kPairs of them are pairs
constexpr int kPairs = 8;
constexpr int kHolders = 16;
enum Matter : int { kGlass = 0, kCrystal, kSalt, kSugar, kObsidian, kBronze, kNumMatters };

// What sets. `ratio` is its partials in tune, `roll` how their level falls
// (a power of the ratio), `ring` and `slope` the set ring against Glass and
// how much sooner high tones die, `melt` how long a soft tone lasts,
// `scatter` cents at Order 0, `beat` the hertz between the halves of a pair,
// `tick` how often it ticks, `crack` the dry part of ticks and quench,
// `touch` how long a striker rests on it, `border` how wide its front is,
// `sing` and `air` how far it is rubbed and blown, `root` the level of its note, `formant` how far it speaks.
struct Stuff {
  float ratio[kPartials];
  float roll, ring, slope, melt, scatter, beat, tick, crack, touch, border, sing, air, root, formant, gain;
};

inline const Stuff& stuff(int matter) {
  static const Stuff kStuff[kNumMatters] = {
      // Glass: a full, plain row, thinning upward in fifths and octaves.
      {{1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 16, 18, 20, 24, 27, 30, 32, 36, 40, 45, 48, 54, 60},
       0.95f, 1.0f, 0.30f, 1.0f, 70.0f, 0.22f, 1.0f, 0.15f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 0.0f, 1.0f},
      // Crystal: octaves and twelfths, more of them than of the note, beating, very long.
      {{1, 2, 4, 3, 8, 6, 16, 12, 24, 32, 48, 64, 5, 10, 20, 40, 18, 36, 80, 96, 9, 72, 28, 56},
       0.48f, 2.2f, 0.06f, 0.6f, 45.0f, 0.75f, 0.6f, 0.0f, 0.5f, 0.6f, 1.2f, 0.4f, 1.0f, 0.0f, 0.75f},
      // Salt: the odd partials, hollow, full of air and of grains, its ring short.
      {{1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47},
       0.70f, 0.22f, 0.15f, 0.35f, 110.0f, 0.10f, 4.0f, 0.8f, 0.7f, 0.8f, 0.5f, 2.0f, 0.5f, 0.0f, 1.0f},
      // Sugar: brittle, every partial, bright and soon over, hardly singing.
      {{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 26, 28, 30, 32},
       0.50f, 0.10f, 0.30f, 0.40f, 90.0f, 0.30f, 2.2f, 1.0f, 0.25f, 0.5f, 0.15f, 0.12f, 1.0f, 0.0f, 1.9f},
      // Obsidian: dark, its front wide, its tones grouped as in a mouth.
      {{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 0.5f, 1.5f},
       1.45f, 0.8f, 0.60f, 1.8f, 60.0f, 0.12f, 0.3f, 0.1f, 2.4f, 2.2f, 1.4f, 0.7f, 1.0f, 1.0f, 1.0f},
      // Bronze: a bell's hum, third and fifth under its octave.
      {{1, 0.5f, 1.2f, 1.5f, 2, 2.4f, 3, 4, 2.5f, 5, 6, 8, 10, 12, 4.8f, 16, 20, 24, 7.2f, 9.6f, 32, 40, 48, 64},
       0.80f, 1.7f, 0.75f, 1.8f, 80.0f, 0.55f, 0.4f, 0.0f, 1.2f, 1.2f, 0.7f, 0.2f, 1.0f, 0.0f, 0.85f},
  };
  return kStuff[kit::clamp_int(matter, 0, kNumMatters - 1)];
}

// The resonances Obsidian speaks with, in hertz: low, middle and a thin high.
inline float mouth(float hz, float depth) {
  const float x = std::log2(kit::max(hz, 20.0f));
  const float a = (x - 9.0f) * 2.2f, b = (x - 10.15f) * 3.2f, c = (x - 11.4f) * 3.6f;
  const float gain = 0.12f + 1.6f / (1.0f + a * a * a * a) + 3.4f / (1.0f + b * b * b * b) + 6.0f / (1.0f + c * c * c * c);
  return 1.0f + depth * (gain - 1.0f);
}

struct alignas(16) Voice {
  // Per mode: state, turn and this tick's turn with loss, how a contact and
  // the breath go in, the place in the field.
  float re[kModes] = {}, im[kModes] = {};
  float step_re[kModes] = {}, step_im[kModes] = {};
  float hit[kModes] = {}, air[kModes] = {};
  float mid[kModes] = {}, side[kModes] = {};
  // What a tick works from.
  float turn_re[kModes] = {}, turn_im[kModes] = {};
  float place[kModes] = {};     // log2 of the mode's hertz
  float level[kModes] = {}, soft[kModes] = {}, way_in[kModes] = {};
  float nepers_set[kModes] = {}, nepers_melt[kModes] = {};
  float haze[kModes] = {}, above[kModes] = {}, uncap[kModes] = {};
  float set[kModes] = {};       // 0 soft, 1 set
  float owed[kModes] = {};      // amplitude on its way in
  float waits[kModes] = {};     // amplitude of a ping still to come
  float wait[kModes] = {};      // seconds until it does
  float due[kModes] = {};       // 1 when the front has yet to pass
  kit::Rng rng;
  kit::Svf clack;
  float frequency = 440.0f, gain = 0.0f;
  float heat = 0.0f, hot = 0.0f, rewarm = 0.0f, front = 8.0f, speed = 0.0f, thin = 1.0f;
  float on = 0.0f, choke = 0.0f, age = 0.0f;
  float flutter = 0.0f, flutter_to = 0.0f, rumble = 0.0f, rumble_to = 0.0f;
  float roar = 0.0f;
  float blow_in = 0.0f, fire_in = 0.0f, fire = 0.0f, pace = 1.0f;
  float contact_phase[2] = {}, contact_step[2] = {}, contact_area[2] = {};
  float grain = 0.0f, grain_a = 0.0f, grain_b = 0.0f, grain_pole = 0.9f;
  float pour = 0.0f, after = 0.0f, pour_to = 0.0f, stream = 0.0f;
  float bubble = 0.0f, bubble_phase = 0.0f, bubble_hz = 0.0f, bubble_wait = 0.0f, bubble_to = 0.0f, bubble_gain = 0.0f, bubble_rise = 0.0f;
  float bubble_from = 1.0f, bubble_seconds = 0.2f;
  float noise = 0.0f, noise_step = 0.0f;
  float follow = 0.0f, steal = 1.0f, dig = 0.0f, crest = 1.0f, crest_rim = 1.0f, rim = 0.0f;
  float rasp = 0.0f, muffle = 0.0f, muffle_to = 0.0f, bloom = 0.0f, bloom_in = 0.0f;
  float pending_frequency = 440.0f, pending_gain = 0.0f;
  uint32_t stamp = 0, tuned = 0, ticks = 0;
  int matter = 0, way = 1, drips = 0, holders = 0, next_contact = 0;
  int ids[kHolders] = {};
  bool sounding = false, pending = false, waiting_to_set = false, bare = false;

  bool released() const { return holders == 0; }
  void hold(int id) {
    drop(id);
    if (holders == kHolders) {
      for (int i = 1; i < kHolders; ++i) ids[i - 1] = ids[i];
      --holders;
    }
    ids[holders++] = id;
  }
  bool drop(int id) {
    for (int i = 0; i < holders; ++i) {
      if (ids[i] != id) continue;
      for (int j = i + 1; j < holders; ++j) ids[j - 1] = ids[j];
      --holders;
      return true;
    }
    return false;
  }
};

}  // namespace setting_glass
}  // namespace livemix
