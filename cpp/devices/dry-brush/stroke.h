#pragma once

#include "../../kit/kit.h"
#include "matter.h"

// One stroke of Dry Brush as it stands, and the arithmetic four hairs at a
// time share.

namespace livemix {
namespace dry_brush_matter {

using V4 = float __attribute__((vector_size(16), may_alias));
using U4 = uint32_t __attribute__((vector_size(16), may_alias));
using I4 = int32_t __attribute__((vector_size(16)));

constexpr int kLine = 4096;  // the longest string under the paper, in samples

// A value that moves in a straight line from one tick to the next.
struct Glide {
  float value = 0.0f, target = 0.0f, step = 0.0f;
  void snap(float v) {
    value = target = v;
    step = 0.0f;
  }
  void aim(float v, float per_sample) {
    value = target;
    target = v;
    step = (v - value) * per_sample;
  }
  float next() {
    value += step;
    return value;
  }
};

struct alignas(16) Voice {
  // The rotators (28 hairs, then four paper modes), read four at a time.
  alignas(16) float re[32] = {}, im[32] = {}, turn_c[32] = {}, turn_s[32] = {};
  alignas(16) float ar[32] = {}, ai[32] = {};  // where each complex level is
  alignas(16) float tr[32] = {}, ti[32] = {};  // where it goes by the next tick
  alignas(16) float from_r[32] = {}, from_i[32] = {};  // where it stood at the last one
  // What each hair is.
  alignas(16) float angle[32] = {};   // radians a sample at the key's pitch
  alignas(16) float apart[32] = {};   // its share of Spread, -1 to 1
  alignas(16) float touch[32] = {};   // pressure at which it touches
  alignas(16) float late[32] = {};    // seconds it lands after the others
  alignas(16) float land[32] = {};    // how far it has landed
  alignas(16) float thirst[32] = {};
  alignas(16) float floor[32] = {};   // what is left of it when the ink is gone
  alignas(16) float core[32] = {};    // 1 in the middle of the brush, 0 outside
  alignas(16) float blur_k[32] = {}, blur_gain[32] = {};
  alignas(16) float wear_rate[32] = {};
  alignas(16) float loud[32] = {}, loud_to[32] = {};
  alignas(16) float stain_level[32] = {};
  // How each hair is doing.
  alignas(16) float ink[32] = {}, gate[32] = {}, goal[32] = {}, wet[32] = {};
  alignas(16) float lift[32] = {}, wear[32] = {}, stain[32] = {};
  alignas(16) float n1r[32] = {}, n2r[32] = {}, n1i[32] = {}, n2i[32] = {};
  alignas(16) float s1r[32] = {}, s1i[32] = {}, s2r[32] = {}, s2i[32] = {};
  alignas(16) uint32_t chance[4] = {};
  alignas(16) float pan_l[4] = {}, pan_r[4] = {}, pan_to_l[4] = {}, pan_to_r[4] = {};
  alignas(16) float pan_by_l[4] = {}, pan_by_r[4] = {};
  int timer[kHairs] = {};
  float spec[kHairs] = {}, plain[kHairs] = {};

  kit::PluckExciter exciter;
  kit::Svf rub_band[2];
  kit::OnePole rub_soft[2], drive_soft;
  kit::Rng rng;
  Glide rub, rub_side, drive, string_out, out;
  float mode_level[4] = {};
  float mode_keep[4] = {}, mode_fit[4] = {}, mode_drive[4] = {}, mode_first[4] = {};
  float weight = 0.0f, contact = 0.0f, knock = 0.0f;

  bool held = false, sounding = false, quick = false;
  int waiting = 0;
  int script = 0, brush = 0, paper = 0;
  float hz = 220.0f, gain = 0.7f, next_hz = 220.0f, next_gain = 0.7f;
  float side = 1.0f;
  float loudness = 0.0f;
  float time = 0.0f, u = 0.0f, lifted = 0.0f;
  float bend = 0.0f;
  float splash = 0.0f, refill = 0.0f, until_dip = 0.0f;
  float phase_a = 0.0f, phase_b = 0.0f;
  float tremor = 0.0f, tremor_depth = 0.0f;
  float stain_k = 0.01f, stain_gain = 1.0f;
  float pressure = 0.0f;
  float shade_seen = -1.0f, press_seen = -1.0f, release_seen = -1.0f;
  float trim = 1.0f, norm = 1.0f;
  float string_norm = 0.0f;
  float string_peak = 0.0f;
  bool string_fits = true;

  bool active() const { return sounding; }
  bool releasing() const { return !held; }
  // True from the moment it is taken, and a held stroke is never quieter than one let go.
  float level() const { return held ? 1.0f + loudness : loudness; }
};

inline V4 load(const float* p) { return *reinterpret_cast<const V4*>(p); }
inline void store(float* p, V4 v) { *reinterpret_cast<V4*>(p) = v; }
inline V4 all(float x) { return V4{x, x, x, x}; }
inline V4 vmin(V4 a, V4 b) { return a < b ? a : b; }
inline V4 vmax(V4 a, V4 b) { return a > b ? a : b; }
inline V4 unit(V4 x) { return vmin(vmax(x, all(0.0f)), all(1.0f)); }
// What has all but gone is gone, before it is too small to reckon with.
inline V4 settle(V4 x) { return x > 1.0e-9f ? x : all(0.0f); }
inline V4 smooth(V4 x) { return x * x * (3.0f - 2.0f * x); }
inline float smooth1(float x) {
  x = kit::clamp(x, 0.0f, 1.0f);
  return x * x * (3.0f - 2.0f * x);
}

// Four numbers from -1 to 1.
inline V4 chance4(uint32_t* state) {
  U4 x = *reinterpret_cast<U4*>(state);
  x ^= x << 13;
  x ^= x >> 17;
  x ^= x << 5;
  *reinterpret_cast<U4*>(state) = x;
  return __builtin_convertvector(reinterpret_cast<I4>(x), V4) * (1.0f / 2147483648.0f);
}

// Sines and cosines of four angles from 0 to 2.65, by the half angle.
inline void turn4(V4 angle, V4* sine, V4* cosine) {
  const V4 h = angle * 0.5f;
  const V4 q = h * h;
  const V4 s = h * (1.0f - q * (1.0f / 6.0f) * (1.0f - q * (1.0f / 20.0f) * (1.0f - q * (1.0f / 42.0f) * (1.0f - q * (1.0f / 72.0f)))));
  const V4 c = 1.0f - q * 0.5f * (1.0f - q * (1.0f / 12.0f) * (1.0f - q * (1.0f / 30.0f) * (1.0f - q * (1.0f / 56.0f) * (1.0f - q * (1.0f / 90.0f)))));
  *sine = 2.0f * s * c;
  *cosine = 1.0f - 2.0f * s * s;
}

inline float pole_for(float hz, float dt) { return 1.0f - std::exp(-kit::kTwoPi * hz * dt); }
// What brings uniform noise through two poles of step k to unit variance.
inline float blur_norm(float k) {
  const float a = 1.0f - k;
  const float lost = 1.0f - a * a;
  return std::sqrt(3.0f * lost * lost * lost / (k * k * k * k * (1.0f + a * a)));
}
inline float sum(V4 x) { return x[0] + x[1] + x[2] + x[3]; }

enum Script : int { kLevelLine = 0, kDot, kHook, kSweep, kTremble, kStamp };

// The pressure a script comes to at its heaviest.
constexpr float kHeaviest[6] = {1.05f, 1.0f, 1.2f, 1.4f, 1.2f, 1.05f};
// What a script that is soon over is given to be heard beside the others.
constexpr float kPresence[6] = {1.0f, 1.4f, 1.1f, 1.25f, 1.0f, 1.0f};

// How loud a pressure is.
inline float heft_of(float p) { return kit::min(4.0f * p, 1.0f) * (0.3f + 0.7f * kit::min(p, 1.8f)); }

// How strong a brush is on its partial n, before the colour of the ink.
inline float spectrum(int brush, float n) {
  switch (brush) {
    case kHair: return 1.0f / n;
    case kReed: return n < 2.0f ? 0.95f : 1.0f / std::pow(n, 0.7f);
    case kEdge: return n < 1.0f ? 1.8f : (0.35f + std::fabs(std::sin(kit::kPi * n * 0.21f))) / std::pow(n, 0.75f);
    case kFeather: return n < 2.0f ? 0.6f : 1.0f / std::pow(n, 0.55f);
    default: return 1.0f / (n * n * 0.8f + 0.2f);
  }
}

inline uint32_t seed_for(uint32_t stream) {
  uint32_t x = (stream + 1u) * 0x9E3779B9u;
  x ^= x >> 16;
  x *= 0x85EBCA6Bu;
  x ^= x >> 13;
  x *= 0xC2B2AE35u;
  x ^= x >> 16;
  return x == 0u ? 1u : x;
}

// A touch and a lighter one, from -0.95 to 0.75.
inline float shake(float phase) {
  const float x = 0.5f + 0.5f * kit::SineTable::lookup(phase);
  return 1.9f * x * x * x - 0.96f;
}

// Where the hand is in its script: pressure, speed and the tremor, for a
// stroke that has run `u` of its length.
inline void hand(Voice& v, float* pressure, float* speed) {
  const float u = v.u;
  float p = 1.0f, s = 0.6f;
  v.tremor_depth = 0.0f;
  switch (v.script) {
    case kLevelLine: {
      const float sway = 0.6f * kit::SineTable::lookup(v.phase_a + u * 0.23f) + 0.4f * kit::SineTable::lookup(v.phase_b + u * 0.37f);
      const float come = kit::min(u, 1.0f);
      p = 0.9f + 0.22f * std::exp(-u * 2.0f) + 0.15f * sway * come;
      s = 0.6f + 0.25f * kit::SineTable::lookup(v.phase_b + u * 0.31f) * come;
      break;
    }
    case kDot:
      p = 1.0f;
      s = 0.6f * std::exp(-u * 4.0f);
      break;
    case kHook: {
      const float u = v.u;
      if (u < 1.0f) {
        p = 0.06f + 1.14f * u * u * std::sqrt(u);
        s = 0.25f + 0.9f * u * u;
      } else {
        const float after = std::exp(-(u - 1.0f) * 3.5f);
        p = 0.23f + 0.97f * after;
        s = 0.3f + 0.85f * after;
      }
      break;
    }
    case kSweep: {
      const float fall = std::exp(-u * 2.0f);
      p = 0.1f + 1.34f * fall;
      s = 0.35f + 0.85f * (1.0f - fall);
      break;
    }
    case kTremble:
      p = 0.82f;
      s = 0.75f;
      v.tremor_depth = 1.0f;
      break;
    default:
      p = 1.05f;
      s = 0.3f * std::exp(-u * 2.0f);
      break;
  }
  *pressure = p;
  *speed = s;
}

// Four noises through two poles of step k.
inline V4 wander(Voice& v, float* first, float* second, V4 k) {
  const V4 one = load(first) + k * (chance4(v.chance) - load(first));
  const V4 two = load(second) + k * (one - load(second));
  store(first, one);
  store(second, two);
  return two;
}

// Keeps four rotators on the unit circle.
inline void steady(Voice& v, int k) {
  const V4 re = load(v.re + k), im = load(v.im + k);
  const V4 size = 1.5f - 0.5f * (re * re + im * im);
  store(v.re + k, re * size);
  store(v.im + k, im * size);
}

// Where hair i stands among the rows: copies of one partial in different
// lanes, and the first of them not always in the same one.
inline int slot_of(int i) {
  const int row = i >> 2;
  return 4 * row + ((i + 2 * row + (row >> 1)) & 3);
}

// Two rows of four rotators, added to what the middle and the sides hear.
inline void spin(Voice& v, int k, V4 share, V4* mid, V4* side, int count) {
  V4 re = load(v.re + k), im = load(v.im + k), ar = load(v.ar + k), ai = load(v.ai + k);
  V4 re2 = load(v.re + k + 4), im2 = load(v.im + k + 4), ar2 = load(v.ar + k + 4), ai2 = load(v.ai + k + 4);
  const V4 c = load(v.turn_c + k), s = load(v.turn_s + k);
  const V4 c2 = load(v.turn_c + k + 4), s2 = load(v.turn_s + k + 4);
  const V4 dr = (load(v.tr + k) - load(v.from_r + k)) * share, di = (load(v.ti + k) - load(v.from_i + k)) * share;
  const V4 dr2 = (load(v.tr + k + 4) - load(v.from_r + k + 4)) * share;
  const V4 di2 = (load(v.ti + k + 4) - load(v.from_i + k + 4)) * share;
  for (int i = 0; i < count; ++i) {
    const V4 nr = re * c - im * s;
    im = re * s + im * c;
    re = nr;
    const V4 nr2 = re2 * c2 - im2 * s2;
    im2 = re2 * s2 + im2 * c2;
    re2 = nr2;
    ar += dr;
    ai += di;
    ar2 += dr2;
    ai2 += di2;
    mid[i] += ar * re + ar2 * re2;
    side[i] += ai * im + ai2 * im2;
  }
  store(v.re + k, re);
  store(v.im + k, im);
  store(v.ar + k, ar);
  store(v.ai + k, ai);
  store(v.re + k + 4, re2);
  store(v.im + k + 4, im2);
  store(v.ar + k + 4, ar2);
  store(v.ai + k + 4, ai2);
}

}  // namespace dry_brush_matter
}  // namespace livemix
