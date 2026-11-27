#pragma once

// One clock of Clock Room: two rods of sixteen modes each, what is being
// struck into them, its pendulum, the ids that hold its key, and the loop
// that renders it. What it is told each tick is worked out in clock_room.h.

#include "../../kit/kit.h"
#include "clock_case.h"
#include "gong_tables.h"

namespace livemix {

struct ClockVoice {
  // Four modes at a time.
  typedef float Four __attribute__((vector_size(16), may_alias));
  static constexpr int kModes = clock_room_tables::kModes;
  static constexpr int kRods = 2;
  static constexpr int kSlots = kModes * kRods;
  static constexpr int kLanes = kModes / 4;  // of one rod
  static constexpr int kBuses = 4;           // low and high part of each rod
  static constexpr int kHolders = 16;        // note ids one clock remembers
  static constexpr int kChunk = 64;          // control period, samples

  alignas(16) float re[kSlots] = {};
  alignas(16) float im[kSlots] = {};
  alignas(16) float step_re[kSlots] = {};
  alignas(16) float step_im[kSlots] = {};
  alignas(16) float push_re[kSlots] = {};
  alignas(16) float push_im[kSlots] = {};
  float base_re[kSlots] = {}, base_im[kSlots] = {};  // the turn with the decay, before any rub
  float correction[kSlots] = {};
  float nepers[kSlots] = {};
  float lift[kSlots] = {};  // what the case makes of this mode
  float late[kSlots] = {};  // what Bloom still owes this mode
  bool off[kSlots] = {};
  float gain_left[kBuses] = {}, gain_right[kBuses] = {};
  float step_left[kBuses] = {}, step_right[kBuses] = {};
  int pulse_at[kRods] = {}, pulse_length[kRods] = {};
  float queued[kRods] = {}, queued_edge[kRods] = {}, given[kRods] = {};
  float ahead[kRods] = {};  // how far strikes have turned what rang
  kit::Rng rng;
  kit::Svf knock_filter, tick_filter, air_filter;
  float knock = 0.0f, knock_step = 0.0f;
  float tick = 0.0f, tick_step = 0.0f;
  float air = 0.0f, air_step = 0.0f;
  double phase = 0.0;     // swings so far
  float nature = 0.0f;    // how far its own rate is off, -1 to 1
  float spread = 0.0f;    // where it stands with no wall, -1 to 1
  float place = 0.0f;     // where it stands, gliding
  float low = 1.0f, high = 1.0f, sway = 1.0f, apart = 1.0f;  // what the wall carries of it, gliding
  float turned = 0.0f;    // what every phase of this gong is turned by
  float rate = 0.0f;      // swings a second, as pulled
  float slot = 0.0f;      // its share of the swing under the wall's law
  float rank = 0.0f;      // 0 the lowest key on the wall to 1 the highest
  bool odd = false;
  float spring = 1.0f;    // how far it is wound
  float strength = 0.0f;  // of the last key strike
  float bloom = 0.0f;     // what the late rise goes by
  float answer = -1.0f;   // seconds until the chime's answer
  float brake = 0.0f;
  float struck_lately = 0.0f;
  float frequency = 440.0f;
  float ease = 1.0f;      // how much of the swing is let through: none as a key strikes
  int ease_hold = 0;
  float follow = 0.0f, floor = 0.0f;
  float steal = 1.0f;
  float pending_frequency = 440.0f, pending_gain = 0.0f;
  uint32_t stamp = 0, tuned = 0;
  int holders = 0;
  int ids[kHolders] = {};
  bool tuned_released = false;
  bool sounding = false, pending = false;
  bool fresh = false;  // to be struck in this tick

  bool released() const { return holders == 0; }
  bool struck(int rod) const { return pulse_at[rod] < pulse_length[rod]; }
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

  // Nothing rings, nothing is about to.
  void quiet() {
    for (int s = 0; s < kSlots; ++s) {
      re[s] = im[s] = push_re[s] = push_im[s] = late[s] = 0.0f;
    }
    for (int rod = 0; rod < kRods; ++rod) {
      pulse_at[rod] = pulse_length[rod] = 0;
      queued[rod] = 0.0f;
      ahead[rod] = 0.0f;
    }
    knock = tick = air = air_step = 0.0f;
    knock_filter.reset();
    tick_filter.reset();
    air_filter.reset();
  }

  // The hammer heard for itself: a thud from felt, a small knock from wood.
  void hammer(const ClockCase& in, float amount, float force, float hardness, float sr, float noise_scale) {
    const float size = std::sqrt(kit::clamp(220.0f / frequency, 0.1f, 6.0f));
    const float hz = kit::clamp((260.0f + 1900.0f * hardness * hardness) / std::sqrt(size), 120.0f, 3800.0f);
    knock_filter.set(hz, 0.9f, sr);
    const float loud = amount * force * force * (0.35f + 0.6f * hardness) / kit::max(in.lift(hz), 1.0f);
    knock = kit::max(knock, loud * noise_scale * std::sqrt(1200.0f / kit::max(hz, 200.0f)));
    knock_step = std::exp(-6.907755279f / ((0.05f - 0.03f * hardness) * size * sr));
  }

  // One tick of the train, tuned to the note: the octave of it the case
  // answers to, a fourth under that on the way back.
  void let_go(const ClockCase& in, int which, float level, float sr, float noise_scale) {
    level *= 0.35f + 0.65f * strength;
    if (level <= 0.0f) return;
    const float want = in.tick_hz();
    float hz = frequency * std::exp2(std::floor(std::log2(want / frequency) + 0.5f));
    if (which >= 2) hz *= 0.75f;
    tick_filter.set(kit::clamp(hz, 300.0f, 7000.0f), in.tick_q(), sr);
    tick = kit::max(tick, level * in.tick_gain() * noise_scale * std::sqrt(in.tick_q() * 0.2f));
    tick_step = std::exp(-6.907755279f / (0.045f * sr));
  }

  void forget() {
    bloom = 0.0f;
    for (float& owed : late) owed = 0.0f;
  }

  void retire() {
    sounding = pending = false;
    holders = 0;
    follow = 0.0f;
    for (int s = 0; s < kSlots; ++s) re[s] = im[s] = 0.0f;
  }

  static Four all(float x) { return Four{x, x, x, x}; }

  void render(int n, float steal_step, float* left, float* right) {
    float sums[kBuses][kChunk];
    for (int rod = 0; rod < kRods; ++rod) {
      const bool hit = !pending && struck(rod);
      float pulse[kChunk];
      if (hit) {
        // A raised cosine whose samples add up to 1.
        const float share = 1.0f / static_cast<float>(pulse_length[rod]);
        for (int i = 0; i < n; ++i) {
          const bool on = struck(rod);
          pulse[i] = on ? share * (1.0f - kit::SineTable::cos_lookup((static_cast<float>(pulse_at[rod]) + 0.5f) * share)) : 0.0f;
          if (on) ++pulse_at[rod];
        }
      }
      for (int half = 0; half < 2; ++half) {
        Four out[kChunk] = {};
        for (int lane = half == 0 ? 0 : 1; lane < (half == 0 ? 1 : kLanes); ++lane) {
          render_lane((rod * kModes) + lane * 4, n, hit ? pulse : nullptr, out);
        }
        float* sum = sums[rod * 2 + half];
        for (int i = 0; i < n; ++i) sum[i] = out[i][0] + out[i][1] + out[i][2] + out[i][3];
      }
    }
    float extra[kChunk];
    const bool sounds = noises(n, extra);
    float gl[kBuses], gr[kBuses], sl[kBuses], sr[kBuses];
    for (int b = 0; b < kBuses; ++b) {
      gl[b] = gain_left[b];
      gr[b] = gain_right[b];
      sl[b] = step_left[b];
      sr[b] = step_right[b];
    }
    for (int i = 0; i < n; ++i) {
      float l = 0.0f, r = 0.0f;
      for (int b = 0; b < kBuses; ++b) {
        l += gl[b] * sums[b][i];
        r += gr[b] * sums[b][i];
      }
      if (sounds) {
        l += extra[i];
        r += extra[i];
      }
      for (int b = 0; b < kBuses; ++b) {
        gl[b] += sl[b];
        gr[b] += sr[b];
      }
      if (pending) {  // a taken voice: out over 3 ms, then the new clock at the next tick
        steal = kit::max(steal - steal_step, 0.0f);
        l *= steal;
        r *= steal;
      }
      left[i] += l;
      right[i] += r;
    }
    for (int b = 0; b < kBuses; ++b) {
      gain_left[b] = gl[b];
      gain_right[b] = gr[b];
    }
  }

  // Four modes over n samples, with the strike that is going in if there is one.
  void render_lane(int from, int n, const float* pulse, Four* out) {
    Four zr = *reinterpret_cast<const Four*>(&re[from]);
    Four zi = *reinterpret_cast<const Four*>(&im[from]);
    const Four cr = *reinterpret_cast<const Four*>(&step_re[from]);
    const Four ci = *reinterpret_cast<const Four*>(&step_im[from]);
    if (pulse) {
      Four pr = *reinterpret_cast<const Four*>(&push_re[from]);
      Four pi = *reinterpret_cast<const Four*>(&push_im[from]);
      for (int i = 0; i < n; ++i) {
        // The push turns with the mode, so it keeps its angle to what rings.
        const Four pushed = cr * pr - ci * pi;
        pi = cr * pi + ci * pr;
        pr = pushed;
        const Four p = all(pulse[i]);
        const Four spun = cr * zr - ci * zi + pr * p;
        zi = cr * zi + ci * zr + pi * p;
        zr = spun;
        out[i] += zi;
      }
      *reinterpret_cast<Four*>(&push_re[from]) = pr;
      *reinterpret_cast<Four*>(&push_im[from]) = pi;
    } else {
      for (int i = 0; i < n; ++i) {
        const Four spun = cr * zr - ci * zi;
        zi = cr * zi + ci * zr;
        zr = spun;
        out[i] += zi;
      }
    }
    *reinterpret_cast<Four*>(&re[from]) = zr;
    *reinterpret_cast<Four*>(&im[from]) = zi;
  }

  // The knock of the hammer, the tick of the train and the air of the rub.
  bool noises(int n, float* out) {
    const bool knocks = knock > 0.0f, ticks = tick > 0.0f;
    const bool airs = air > 0.0f || air_step != 0.0f;
    if (!knocks && !ticks && !airs) return false;
    for (int i = 0; i < n; ++i) {
      const float white = rng.bipolar();
      float x = 0.0f;
      if (knocks) {
        x += knock_filter.bandpass(white * knock);
        knock *= knock_step;
      }
      if (ticks) {
        x += tick_filter.bandpass(white * tick);
        tick *= tick_step;
      }
      if (airs) {
        x += air_filter.bandpass(white * air);
        air += air_step;
      }
      out[i] = x;
    }
    if (air < 0.0f) air = 0.0f;
    return true;
  }
};

}  // namespace livemix
