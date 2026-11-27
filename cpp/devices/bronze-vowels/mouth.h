#pragma once

// What Bronze Vowels speaks with: the vowels, the words made of them, the
// partials of the five metals, and the few pieces of arithmetic that are done
// four at a time.

#include <cstdint>
#include <cstring>

#include "../../kit/math.h"

namespace livemix {
namespace bronze {

// 2^x and log2(x) to about 1e-4 relative, in a shape a loop can take four at
// a time. `exp2_of` is held to [-60, 20].
inline float exp2_of(float x) {
  x = x < -60.0f ? -60.0f : (x > 20.0f ? 20.0f : x);
  const int32_t whole = static_cast<int32_t>(x + 128.0f) - 128;
  const float f = x - static_cast<float>(whole);
  const float p = 1.0f + f * (0.6931472f + f * (0.2401597f + f * (0.0558264f + f * (0.0089893f + f * 0.0018776f))));
  const int32_t bits = (whole + 127) << 23;
  float scale;
  std::memcpy(&scale, &bits, sizeof scale);
  return p * scale;
}

inline float log2_of(float x) {
  int32_t bits;
  std::memcpy(&bits, &x, sizeof bits);
  const float e = static_cast<float>((bits >> 23) - 127);
  bits = (bits & 0x7fffff) | 0x3f800000;
  float m;
  std::memcpy(&m, &bits, sizeof m);
  // log2 over [1, 2), exact at both ends.
  const float t = m - 1.0f;
  return e + t * (1.4420250f + t * (-0.7050600f + t * (0.4052900f + t * (-0.1932430f + t * 0.0509880f))));
}

// --- the mouth ---------------------------------------------------------------

// A mouth is twelve numbers: four formants (log2 of Hz), their four heights
// (log2 of a gain), how far it is open (log2 of a gain, 0 is open), the tilt
// it stands for above C5, where no partials are left to draw it (log2 of a
// gain per octave above the note), the chest (what is left of the partials
// under the first formant, log2), and the breath it lets out (0 to 1).
constexpr int kFormants = 4;
constexpr int kMouth = 12;
constexpr int kOpen = 8;
constexpr int kTilt = 9;
constexpr int kChest = 10;
constexpr int kBreathe = 11;

enum Vowel : int { kAh, kEh, kEe, kOh, kOo, kMm, kEr, kUe, kShut, kHiss, kNumVowels };

struct VowelRow {
  float hz[kFormants];
  float db[kFormants];
  float open_db, tilt_db, chest_db, breath;
};

// The places are the textbook averages of sung and spoken vowels; the heights
// of the upper formants are raised, since a struck bell has less to give up
// there than a throat.
inline const VowelRow& vowel_row(int v) {
  static const VowelRow kRows[kNumVowels] = {
      {{780.0f, 1220.0f, 2650.0f, 3600.0f}, {0.0f, 0.0f, -14.0f, -20.0f}, 0.0f, -1.5f, -24.0f, 0.05f},     // Ah
      {{560.0f, 1850.0f, 2600.0f, 3600.0f}, {-1.0f, -1.0f, -6.0f, -16.0f}, 0.0f, -1.0f, -20.0f, 0.1f},     // Eh
      {{270.0f, 2400.0f, 3150.0f, 4300.0f}, {-6.0f, 0.0f, -1.0f, -6.0f}, 0.0f, 2.0f, -20.0f, 0.1f},        // Ee
      {{470.0f, 780.0f, 2500.0f, 3400.0f}, {0.0f, -4.0f, -34.0f, -40.0f}, 0.0f, -7.0f, -15.0f, 0.0f},      // Oh
      {{290.0f, 620.0f, 2300.0f, 3300.0f}, {0.0f, -16.0f, -42.0f, -46.0f}, 0.0f, -14.0f, -7.0f, 0.0f},     // Oo
      {{190.0f, 900.0f, 2200.0f, 3300.0f}, {0.0f, -34.0f, -42.0f, -46.0f}, -9.0f, -20.0f, -1.0f, 0.0f},    // Mm
      {{490.0f, 1280.0f, 1620.0f, 3400.0f}, {-3.0f, 0.0f, 0.0f, -28.0f}, 0.0f, -4.0f, -22.0f, 0.0f},       // Er
      {{270.0f, 1700.0f, 2150.0f, 3400.0f}, {-1.0f, -2.0f, -3.0f, -26.0f}, 0.0f, -3.0f, -14.0f, 0.0f},     // Ue
      {{210.0f, 700.0f, 2100.0f, 3300.0f}, {0.0f, -34.0f, -44.0f, -48.0f}, -34.0f, -20.0f, -4.0f, 0.0f},   // shut
      {{420.0f, 1600.0f, 3300.0f, 5200.0f}, {-12.0f, -6.0f, 0.0f, 0.0f}, -10.0f, -8.0f, -18.0f, 1.0f},     // hiss
  };
  return kRows[v];
}

constexpr float kDbToLog2 = 0.166096405f;  // dB to log2 of a gain

inline void mouth_of(int v, float* mouth) {
  const VowelRow& row = vowel_row(v);
  for (int j = 0; j < kFormants; ++j) {
    mouth[j] = std::log2(row.hz[j]);
    mouth[kFormants + j] = row.db[j] * kDbToLog2;
  }
  mouth[kOpen] = row.open_db * kDbToLog2;
  mouth[kTilt] = row.tilt_db * kDbToLog2;
  mouth[kChest] = row.chest_db * kDbToLog2;
  mouth[kBreathe] = row.breath;
}

constexpr int kWords = 10;
constexpr int kStations = 5;

// Each word is five stations at even distances; it is said to the end, then
// back to its beginning, for as long as the bell rings.
inline const int* word_row(int word) {
  static const int kRows[kWords][kStations] = {
      {kAh, kAh, kOh, kOo, kOo},        // Ah oh oo
      {kOo, kOo, kEe, kEe, kEe},        // We
      {kMm, kMm, kMm, kMm, kMm},        // Hum
      {kOo, kShut, kShut, kShut, kOo},  // Noon
      {kEh, kShut, kEh, kShut, kEh},    // Nay nay
      {kAh, kEe, kShut, kShut, kAh},    // Ay ma
      {kOh, kOh, kOh, kShut, kShut},    // Home
      {kEe, kEe, kMm, kShut, kShut},    // Seem
      {kHiss, kHiss, kOo, kShut, kHiss},  // Whoosh
      {kEr, kAh, kHiss, kHiss, kHiss},  // Hush
  };
  return kRows[kit::clamp_int(word, 0, kWords - 1)];
}

// --- the metals --------------------------------------------------------------

constexpr int kPartials = 44;
constexpr int kPairs = 12;  // the lowest partials come in two halves that beat
constexpr int kSlots = kPartials + kPairs;

enum Metal : int { kHarmonic, kBar, kPlate, kBell, kGlass, kMetals };

struct MetalTable {
  float ratio[kPartials];   // of the note; 0 is the hum, 1 the prime
  float tuned[kPartials];   // where it goes when the metal is tuned
  float fade[kPartials];    // what is left of it there
  float level[kPartials];
  float keep[kPartials];    // its ring, as a share of the metal's
  float ring;               // of the Ring knob
  float bloom;              // seconds its highest partials take to come up
  float feed;               // how well it takes what a held key feeds it
  float let;                // how long it rings on when the key is let go
  float wide;               // how far it can be spread
  float gain;               // evens out the loudness of the five
};

// Partials in the order of their pitch, each with its strength: built once.
struct MetalMaker {
  float ratio[160];
  float level[160];
  int count = 0;
  void add(float r, float l) {
    if (count < 160) {
      ratio[count] = r;
      level[count++] = l;
    }
  }
  void sort() {
    for (int i = 1; i < count; ++i) {
      const float r = ratio[i], l = level[i];
      int j = i - 1;
      for (; j >= 0 && ratio[j] > r; --j) {
        ratio[j + 1] = ratio[j];
        level[j + 1] = level[j];
      }
      ratio[j + 1] = r;
      level[j + 1] = l;
    }
  }
};

inline void make_metal(int metal, MetalTable* out) {
  MetalMaker maker;
  float slope = 0.3f, share = 1.0f, bloom = 0.0f, feed = 1.0f, let = 1.0f, prime = 1.0f, wide = 0.75f, gain = 1.0f;
  switch (metal) {
    case kHarmonic:
      for (int n = 2; n <= 43; ++n) maker.add(static_cast<float>(n), n & 1 ? 1.15f : 0.8f);
      slope = 0.2f;
      share = 0.75f;
      let = 0.12f;
      wide = 0.7f;
      prime = 0.6f;
      break;
    case kBar: {
      // Beats on the length are tuned to the double octave; what twists and
      // what goes sideways fills in between, quietly.
      static const float kLong[6] = {3.984f, 9.45f, 15.9f, 23.8f, 33.1f, 43.8f};
      for (float r : kLong) maker.add(r, 0.8f * std::pow(r, -0.4f));
      for (int n = 1; n <= 26; ++n) maker.add(1.735f * static_cast<float>(n), n == 1 ? 0.03f : 0.12f);
      for (int n = 1; n <= 11; ++n) {
        const float x = static_cast<float>(n) + 0.55f;
        maker.add(0.93f * x * x, n == 1 ? 0.06f : 0.1f);
      }
      slope = 0.45f;
      share = 0.4f;
      feed = 0.5f;
      let = 0.5f;
      prime = 1.3f;
      wide = 0.45f;
      gain = 1.0f;
      break;
    }
    case kPlate:
      maker.add(1.51f, 0.5f);
      for (int m = 1; m <= 9; ++m) {
        for (int n = 1; n <= 11; ++n) {
          if (m * n == 1) continue;
          const float r = (static_cast<float>(m * m) + 0.57f * static_cast<float>(n * n)) / 1.57f;
          maker.add(r, 0.5f * std::pow(r, 0.1f));
        }
      }
      slope = 0.6f;
      share = 1.1f;
      bloom = 2.8f;
      feed = 1.25f;
      let = 0.5f;
      prime = 0.3f;
      wide = 1.0f;
      gain = 0.78f;
      break;
    case kBell: {
      static const float kLow[][2] = {{1.2f, 0.62f},  {1.5f, 0.32f},  {2.0f, 1.0f},   {2.51f, 0.34f},
                                      {2.67f, 0.3f},  {3.01f, 0.75f}, {3.36f, 0.25f}, {4.03f, 0.6f},
                                      {4.22f, 0.22f}, {5.11f, 0.42f}, {5.38f, 0.26f}, {6.26f, 0.36f},
                                      {6.6f, 0.22f},  {7.48f, 0.3f},  {8.06f, 0.2f}};
      for (const auto& row : kLow) maker.add(row[0], row[1]);
      for (int n = 0; n < 27; ++n) {
        const float x = static_cast<float>(n);
        maker.add(8.75f + 0.82f * x + 0.018f * x * x, 0.3f);
      }
      slope = 0.34f;
      share = 0.85f;
      let = 1.3f;
      prime = 1.15f;
      wide = 0.8f;
      break;
    }
    case kGlass:
    default: {
      for (int n = 2; n <= 12; ++n) {
        const float x = static_cast<float>(n);
        maker.add(0.62f * x * x - 0.14f * x + 0.12f, 0.14f);  // 2.32, 5.28, 9.48 ...
      }
      for (int n = 2; n <= 34; ++n) maker.add(static_cast<float>(n) * (1.0f + 0.0011f * static_cast<float>(n)), 0.02f);
      slope = 0.1f;
      share = 2.4f;
      bloom = 0.8f;
      feed = 1.2f;
      let = 3.0f;
      prime = 2.8f;
      wide = 0.9f;
      gain = 0.94f;
      break;
    }
  }
  maker.sort();
  out->ring = share;
  out->bloom = bloom;
  out->feed = feed;
  out->let = let;
  out->wide = wide;
  out->gain = gain;
  out->ratio[0] = 0.5f;
  out->level[0] = 1.0f;
  out->ratio[1] = 1.0f;
  out->level[1] = prime;
  for (int p = 2; p < kPartials; ++p) {
    out->ratio[p] = maker.ratio[p - 2];
    out->level[p] = maker.level[p - 2];
  }
  for (int p = 0; p < kPartials; ++p) {
    const float r = out->ratio[p];
    float whole = std::floor(r + 0.5f);
    if (r < 1.8f) whole = std::floor(2.0f * r + 0.5f) * 0.5f;
    const float semitones = 12.0f * std::log2(whole / r);
    const bool near = semitones * semitones < 0.4f;
    out->tuned[p] = near ? whole : r;
    out->fade[p] = near ? 1.0f : 0.0f;
    out->keep[p] = std::pow(kit::max(r, 1.0f), -slope) * (p == 0 ? 1.3f : 1.0f);
  }
}

}  // namespace bronze
}  // namespace livemix
