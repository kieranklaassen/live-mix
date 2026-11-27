#pragma once

// The pulses of Singing Sand: what one grain sounds like as it slips, as the
// harmonics of one cycle. A table is built for each key, so nothing in it is
// over the band, and the corner of a pulse is a length in time that only
// leans with the key: the same grain is duller high up and buzzes low down.

#include "../../kit/kit.h"
#include "../../kit/fft.h"

namespace livemix {
namespace sand {

constexpr int kTable = 1024;
constexpr int kHarmonics = 224;
constexpr int kHeard = 32;  // harmonics the level law counts one by one

enum Pulse : int { kRound = 0, kFlint, kSqueak, kWet, kGlassy };

// What each kind of sand does besides its pulse: the hiss it throws up and its
// band, how far a strike opens it, how fast it comes to rest, how it bubbles,
// how much deeper its boom is and how far across it lies.
struct Kind {
  float hiss, low_hz, high_hz;
  float strike;   // octaves of brightness and of level at the first moment
  float settle;   // of Slump
  float bubble;   // octaves of level its patches come and go by
  float boom;
  float wide;
};
inline const Kind& kind_of(int pulse) {
  static constexpr Kind kKinds[5] = {{1.0f, 600.0f, 3600.0f, 0.0f, 1.0f, 0.0f, 0.0f, 0.8f},
                                     {1.5f, 1000.0f, 4200.0f, 2.0f, 0.2f, 0.0f, 0.0f, 1.0f},
                                     {0.6f, 1500.0f, 3400.0f, 0.5f, 0.4f, 0.0f, 0.0f, 0.15f},
                                     {1.2f, 120.0f, 600.0f, 0.4f, 0.19f, 3.2f, 0.9f, 1.0f},
                                     {0.5f, 2400.0f, 5200.0f, 0.2f, 2.3f, 0.0f, 0.0f, 1.0f}};
  return kKinds[pulse < 0 ? 0 : (pulse > 4 ? 4 : pulse)];
}

// How much of the first group's weight the later groups of a cluster carry:
// the first is heavier, so the key's own note stays under the raised overtone.
inline float group_weight(int groups) {
  static constexpr float kWeights[6] = {1.0f, 0.62f, 0.56f, 0.52f, 0.48f, 0.45f};
  return kWeights[groups < 1 ? 0 : (groups > 6 ? 5 : groups - 1)];
}

// What a cluster of `groups` leaves of harmonic h.
inline float group_gain(int groups, int h) {
  if (groups <= 1) return 1.0f;
  const float w = group_weight(groups);
  const float whole = 1.0f + w * static_cast<float>(groups - 1);
  return h % groups == 0 ? 1.0f : (1.0f - w) / whole;
}

// A bump of `width` octaves around `hz`.
inline float bump(float octave_from, float width) {
  const float x = octave_from / width;
  return std::exp(-0.5f * x * x);
}

// The level of harmonic h (at `hz`) of a pulse whose corner is `corner`.
inline float pulse_level(int pulse, int h, float hz, float f0, float corner) {
  const float n = static_cast<float>(h);
  switch (pulse) {
    case kFlint: {
      // Broken edges: a jagged comb over a flat click.
      const uint32_t hash = (static_cast<uint32_t>(h) * 2654435761u) >> 24;
      const float jag = 0.35f + 0.65f * static_cast<float>(hash) * (1.0f / 255.0f);
      const float x = hz / (1.8f * corner);
      return (h == 1 ? 0.36f : jag) * std::pow(n, -0.2f + 0.08f * std::log2(corner * 0.001f)) / (1.0f + x * x * x);
    }
    case kSqueak: {
      // It stays where a squeak is, from a creak to a chirp.
      const float first = kit::max(600.0f * std::pow(corner * (1.0f / 250.0f), 0.45f), 2.0f * f0);
      const float low = std::log2(hz / first);
      const float high = low - 0.95f;
      return (h == 1 ? 0.34f : 0.0f) + bump(low, 0.27f) + 0.4f * bump(high, 0.2f) + 0.03f / n;
    }
    case kWet: {
      // A hollow pop: odd harmonics under one low bump, and one above.
      const float first = kit::max(270.0f * std::sqrt(corner * (1.0f / 250.0f)), f0);
      const float low = std::log2(hz / first);
      const float hollow = (h & 1) ? 1.0f : 0.06f;
      return hollow * ((h == 1 ? 0.5f : 0.0f) + bump(low, 0.4f) + 0.16f * bump(low - 1.9f, 0.16f));
    }
    case kGlassy: {
      float place = 0.0f;
      if (h == 1) place = 0.6f;
      else if (h == 4) place = 1.0f;
      else if (h == 6) place = 0.35f;
      else if (h == 9) place = 0.62f;
      else if (h == 15) place = 0.5f;
      else if (h == 20) place = 0.3f;
      else if (h == 28) place = 0.2f;
      const float x = hz / (0.9f * corner);
      return place / (1.0f + x * x * x);
    }
    case kRound:
    default: {
      const float x = hz / corner;
      return std::pow(n, -0.6f + 0.12f * std::log2(corner * 0.001f)) * std::exp(-0.8f * x * std::sqrt(x));
    }
  }
}

// How the ear weighs a level at `hz`, as power: less of the deepest.
inline float heard(float hz) {
  const float x = hz * (1.0f / 170.0f);
  const float x2 = x * x;
  return 0.22f + 0.78f * x2 / (1.0f + x2);
}

struct Table {
  float data[kTable + 1] = {};
};

// Builds tables; one for the whole instrument.
class Press {
 public:
  void init() { fft_.init(); }

  // Writes the cycle into `table` and the power of each of the first harmonics
  // into `power`, as it is heard, and returns how many there are.
  int press(int pulse, float grain, int groups, float velocity, float f0, float sample_rate, Table& table,
            float* power) {
    const float corner = 250.0f * std::exp2(4.7f * grain + 2.4f * (velocity - 0.7f)) *
                         std::pow(f0 * (1.0f / 220.0f), 0.4f) *
                         std::pow(static_cast<float>(groups), 0.7f);
    const float ceiling = kit::min(0.44f * sample_rate, 11500.0f);
    const int count = kit::clamp_int(static_cast<int>(ceiling / f0), 1, kHarmonics);
    for (int k = 0; k < kTable; ++k) re_[k] = im_[k] = 0.0f;
    float whole = 0.0f;
    for (int h = 1; h <= count; ++h) {
      const float hz = f0 * static_cast<float>(h);
      // Nothing ends with an edge: the last octave under the ceiling fades.
      const float fade = kit::clamp((ceiling - hz) / (0.5f * ceiling), 0.0f, 1.0f);
      const float level = kit::max(pulse_level(pulse, h, hz, f0, corner), h == 1 ? 0.02f : 0.0f) *
                          (h == 1 ? 1.0f : fade);
      re_[h] = level;
      whole += level * level * heard(hz);
    }
    const float scale = 1.0f / std::sqrt(kit::max(0.5f * whole, 1.0e-9f));
    for (int h = 1; h <= count; ++h) {
      const float level = re_[h] * scale;
      if (h <= kHeard) power[h - 1] = 0.5f * level * level * heard(f0 * static_cast<float>(h));
      // The pulse stands in the middle of its cycle and its highs are spread
      // a little, so a slip is a soft push and not a spike.
      const float n = static_cast<float>(h);
      const float turn = 0.5f * n + 0.15f * n * std::sqrt(n);
      re_[h] = level * kit::SineTable::cos_lookup(turn);
      im_[h] = level * kit::SineTable::lookup(turn);
    }
    fft_.inverse(re_, im_);
    for (int i = 0; i < kTable; ++i) table.data[i] = re_[i];
    table.data[kTable] = table.data[0];
    for (int h = count; h < kHeard; ++h) power[h] = 0.0f;
    return count < kHeard ? count : kHeard;
  }

 private:
  kit::Fft<kTable> fft_;
  float re_[kTable] = {};
  float im_[kTable] = {};
};

}  // namespace sand
}  // namespace livemix
