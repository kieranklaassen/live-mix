#pragma once

// One sounding key of Chord Clock: its body, its pulses, its tone's two tables
// and the ids that hold it. The instrument does the work (chord_clock.h).

#include "../../kit/kit.h"
#include "clock_tables.h"

namespace livemix {
namespace chord_clock_dsp {

constexpr int kHolders = 16;  // note ids one key remembers
constexpr int kTable = 1024;  // samples of a table, and between two
constexpr int kPeriods = 4;   // periods of the note in it
constexpr int kLines = 256;   // 64 harmonics

struct Voice {
  // Body.
  float step_re[kModes] = {}, step_im[kModes] = {};
  float re[kModes] = {}, im[kModes] = {};
  float push[kModes] = {}, hiss[kModes] = {};
  float side_a = 0.7071f, side_b = 0.7071f;  // gains of even and odd modes, left; right is swapped
  // Pulses.
  double phase = 0.0;   // of its own clock, in pulses since it was struck
  double target = 0.0;  // where the master clock wants it
  double path_phase = 0.0;
  float imp_carry = 0.0f, env1 = 0.0f, env2 = 0.0f, tau = 0.0f;
  float chirp = 0.0f;
  float tuned_hz = 0.0f, tuned_ring = 0.0f;
  const Material* tuned_material = nullptr;
  const Resonator* tuned_body = nullptr;
  float low[6] = {};  // what went into and out of the filter under the note, for both sides
  kit::Svf knock;
  float wind_gain = 0.0f;
  // Tone.
  float table[2][2][kTable + 3] = {};  // which, ear, with a sample before and two after
  int now = 0;                         // the older of the two
  int blend = 0;                       // samples into the crossfade
  double position = 0.0;
  float colour[kLines + 1] = {};
  float colour_hz = 0.0f, colour_damping = 0.5f;
  int colour_pulse = -1, colour_body = -1;
  float tone_gain = 0.0f, air_gain = 0.0f;
  // Envelopes and slow things.
  float attack_at = 1.0f, attack_from = 0.0f, level = 0.0f, hold_level = 1.0f;
  float rhythm = 0.0f;
  float lift_raw = 0.0f, lift = 0.0f;
  float home = 0.0f, glint = 0.0f;  // a return, and what it lights
  int stair = 0;
  float climbed = 0.0f, climb = 0.0f;
  float path_time = 0.0f, fused = 0.0f, below = 0.0f;  // `below`: octaves, smoothed
  float age = 0.0f, since_release = 0.0f, clock = 0.0f;
  float steal = 1.0f;
  // Pitch.
  float played = 220.0f, hz = 220.0f, aim = 220.0f, ratio = 1.0f;
  int numer = 1, denom = 1;
  float offset = 0.0f;
  float velocity = 0.7f, force = 0.7f;     // and the touch the tone has got to
  float accord = 0.0f, accord_to = 0.0f;  // how plain its ratio is, in octaves of colour
  float struck_for = 10.0f;               // seconds since it was struck
  bool placed = false;
  // Ids.
  int ids[kHolders] = {};
  int holders = 0;
  float pending_hz = 220.0f, pending_gain = 0.0f;
  uint32_t stamp = 0;
  kit::Rng rng;
  float seed = 0.0f;
  bool sounding = false, pending = false, struck = false;

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
  float loudness() const { return level * (0.2f + velocity) + 0.1f * rhythm; }
};

}  // namespace chord_clock_dsp
}  // namespace livemix
