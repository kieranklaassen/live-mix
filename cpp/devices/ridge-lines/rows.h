#pragma once

// The rows of hills a note's wave is drawn from: four profiles over one
// cycle, what rock and sun do to them, the soft maximum that says which of
// three rows is seen, what each choice is made of and how it rings, and the
// body they all sound in. Nothing here knows of a voice.

#include <cmath>

#include "../../kit/kit.h"

namespace livemix {
namespace ridge_lines {

constexpr int kDraw = 512;  // points a profile and an outline are drawn with
constexpr int kShapes = 4;     // Hills, Pines, Cliffs, Towers: what may stand near
constexpr int kFarShapes = 3;  // the first three: what may stand behind
constexpr int kRows = 3;    // near, middle, far

// A block with steep but not sheer sides, so that it can be drawn.
inline float block(float x, float from, float to) {
  constexpr float kEdge = 0.01f;
  const float up = (x - from) / kEdge, down = (to - x) / kEdge;
  return kit::clamp(kit::min(up, down), 0.0f, 1.0f);
}

// Height, about 0 to 1, of a profile at x in [0, 1). The far row turns its
// back (`turned`), so two rows of one profile are not one picture twice.
inline float profile(int shape, float x, bool turned) {
  if (turned) x = x > 0.0f ? 1.0f - x : 0.0f;
  switch (shape) {
    case 0: {  // Hills: one round hill that leans into the wind
      const float lean = x + 0.07f * std::sin(kit::kTwoPi * x);
      const float hill = 0.5f - 0.5f * std::cos(kit::kTwoPi * lean);
      return hill * (0.45f + 0.55f * hill);
    }
    case 1: {  // Pines: sharp tops at uneven places, the middle ones the tallest
      static constexpr float kTops[7] = {0.06f, 0.17f, 0.335f, 0.455f, 0.615f, 0.79f, 0.915f};
      const float hill = 0.5f - 0.5f * std::cos(kit::kTwoPi * x);
      float s = 0.0f;
      for (float top : kTops) s = kit::max(s, 1.0f - std::fabs(x - top) * 14.0f);
      return (0.55f + 0.45f * hill) * s;
    }
    case 2: {  // Cliffs: a long climb and a fall into the sea
      constexpr float kEdge = 0.985f;
      return x < kEdge ? x / kEdge : (1.0f - x) / (1.0f - kEdge);
    }
    default: {  // Towers: thin blocks with sky between them
      const float a = block(x, 0.10f, 0.135f);
      const float b = 0.7f * block(x, 0.43f, 0.455f);
      return kit::max(a, b);
    }
  }
}

inline float bump(float octave, float at, float width) {
  const float off = (octave - at) / width;
  return std::exp(-0.5f * off * off);
}

// What the row in front is made of: the gain in dB of its harmonic `h`. A
// round hill is dark earth, pines let the light through high up and not
// under, rock gives everything back, a tower is thin and hollow.
inline float near_matter(int shape, float h) {
  const float x = std::log2(h);
  switch (shape) {
    case 0: return 3.0f - 5.0f * kit::max(0.0f, x - 0.8f);
    case 1: return 6.0f - 24.0f * bump(x, 1.0f, 0.8f) + 12.0f * bump(x, 2.8f, 0.7f) - 8.0f * kit::max(0.0f, x - 3.6f);
    case 2: return -1.2f * kit::max(0.0f, x - 2.0f);
    default: return -16.0f + 16.0f * kit::min(1.0f, x / 2.6f) + 2.0f * x;
  }
}

// What a near row does to the whole note, as the land between it and the ear:
// the gain in dB of a partial at `hz` that is harmonic `h`. Hills take the top
// away, pines leave a nose, cliffs throw the top back, towers take every other
// harmonic and the middle out.
inline float near_land(int shape, float hz, float h) {
  const float x = std::log2(hz * (1.0f / 440.0f));
  switch (shape) {
    case 0: return 4.0f - 7.5f * kit::clamp(x + 0.4f, 0.0f, 3.0f);
    case 1: return -11.0f * kit::clamp(0.4f - x, 0.0f, 2.0f) + 13.0f * bump(x, 1.45f, 0.42f) - 7.0f * kit::max(0.0f, x - 2.4f);
    case 2: return 4.6f * kit::clamp(x - 1.1f, 0.0f, 2.6f);
    default: {
      const int n = static_cast<int>(h + 0.5f);
      return (n % 2 == 0 ? -16.0f : 2.0f) - 9.0f * bump(x, 1.0f, 0.7f) + 3.5f * kit::clamp(x - 1.6f, 0.0f, 2.5f);
    }
  }
}

// What the land behind does to the whole note: open hills are warm, pines
// swallow the low middle, cliffs send the middle back.
inline float far_land(int shape, float hz) {
  const float x = std::log2(hz * (1.0f / 440.0f));
  switch (shape) {
    case 0: return 2.0f - 1.2f * kit::max(0.0f, x - 1.0f);
    case 1: return -14.0f * bump(x, 0.5f, 1.1f) + 6.0f * bump(x, 3.0f, 0.8f) - 5.0f * kit::max(0.0f, x - 3.6f);
    default: return -5.0f * kit::clamp(0.2f - x, 0.0f, 2.0f) + 12.0f * bump(x, 1.6f, 0.65f) - 12.0f * kit::max(0.0f, x - 2.3f);
  }
}

// How a near row rings, as a share of Decay and Release: needles swallow a
// note, towers hum on.
inline float near_ring(int shape) {
  static constexpr float kRing[kShapes] = {2.1f, 0.3f, 1.0f, 2.4f};
  return kRing[shape];
}

// What the rows behind are made of. Each lets through one broad band of the
// overtones that show over the front row, and the band moves as the row goes
// by: that is the glide. Counted in repeats of the row and not of the note.
struct Matter {
  float at;      // where the band lies, in harmonics of the row
  float sharp;   // how narrow it is
  float climb;   // octaves it moves by as the row goes by
  float apart;   // how much wider than Hills two eyes see it
  float lag;     // turns the second eye is behind the first
  float loud;    // dB it swells by as it goes by
  float swell;   // and dB the whole note swells by with it
  float level;   // dB against the others
};
inline Matter far_matter(int shape) {
  static constexpr Matter kMatter[kFarShapes] = {
      {1.1f, 0.9f, 2.4f, 0.24f, 0.03f, 2.0f, 1.5f, 0.0f},
      {6.0f, 3.0f, 0.9f, 2.6f, 0.45f, 3.0f, 0.0f, 3.0f},
      {2.8f, 1.6f, 3.0f, 0.9f, 0.12f, 4.0f, 6.5f, 3.0f}};
  return kMatter[shape];
}

// Where the band stands, from 0 to 1, over one whole passing: hills rise and
// sink, pines flicker, cliffs climb and fall.
inline float passing(int shape, float x) {
  x -= std::floor(x);
  switch (shape) {
    case 0: return 0.5f - 0.5f * kit::SineTable::cos_lookup(x);
    case 1: {
      const float t = 5.0f * x;
      const float s = 1.0f - 2.0f * std::fabs(t - std::floor(t) - 0.5f);
      return s * s;
    }
    default: return x < 0.84f ? x / 0.84f : (1.0f - x) / 0.16f;
  }
}

// The larger of two heights, with the corner between them rounded over a
// stretch `k` of height (inverse handed in). k wide against both is their
// mean: the rows shine through each other.
inline float soft_max(float a, float b, float k, float inverse_k) {
  const float gap = a > b ? a - b : b - a;
  const float top = a > b ? a : b;
  const float near = k - gap > 0.0f ? k - gap : 0.0f;
  return top + 0.25f * near * near * inverse_k;
}

// Leans a profile by `lean` cycles a unit of height and draws what is seen:
// where it overhangs, the higher line hides the lower.
inline void lean_profile(const float* in, float lean, float* out) {
  if (lean <= 0.0f) {
    for (int i = 0; i < kDraw; ++i) out[i] = in[i];
    return;
  }
  for (int i = 0; i < kDraw; ++i) out[i] = -1.0e9f;
  const float push = lean * kDraw;
  for (int i = 0; i < kDraw; ++i) {
    const float h0 = in[i], h1 = in[(i + 1) & (kDraw - 1)];
    float x0 = static_cast<float>(i) + push * h0;
    float x1 = static_cast<float>(i + 1) + push * h1;
    float a = h0, b = h1;
    if (x1 < x0) {
      const float swap_x = x0, swap_h = a;
      x0 = x1;
      x1 = swap_x;
      a = b;
      b = swap_h;
    }
    const float slope = x1 - x0 > 1.0e-6f ? (b - a) / (x1 - x0) : 0.0f;
    for (int p = static_cast<int>(std::ceil(x0)); static_cast<float>(p) <= x1; ++p) {
      const float h = a + slope * (static_cast<float>(p) - x0);
      const int at = p & (kDraw - 1);
      if (h > out[at]) out[at] = h;
    }
  }
  // Every point lies under some stretch of a closed line; rounding alone
  // could leave one out.
  for (int i = 0; i < kDraw; ++i) {
    if (out[i] < -1.0e8f) out[i] = in[i];
  }
}

// A running mean over `width` points round the ring (any width from one up),
// twice, which is a triangle: the blur of a moving row, and the least one has
// to be rounded by for its repeats to be drawn.
inline void blur_profile(float* ring, float width) {
  if (width <= 1.0f) return;
  width = kit::min(width, static_cast<float>(kDraw - 2));
  static float sum[2 * kDraw + 1];
  const int whole = static_cast<int>(width);
  const float part = width - static_cast<float>(whole);
  const float scale = 1.0f / width;
  for (int pass = 0; pass < 2; ++pass) {
    float total = 0.0f;
    for (int i = 0; i < 2 * kDraw; ++i) {
      sum[i] = total;
      total += ring[i & (kDraw - 1)];
    }
    sum[2 * kDraw] = total;
    // The two passes lean on opposite sides of the point, so nothing shifts.
    const int back = pass == 0 ? whole / 2 : whole - whole / 2;
    static float out[kDraw];
    for (int i = 0; i < kDraw; ++i) {
      const int start = (i - back) & (kDraw - 1);
      const float more = ring[(start + whole) & (kDraw - 1)];
      out[i] = (sum[start + whole] - sum[start] + part * more) * scale;
    }
    for (int i = 0; i < kDraw; ++i) ring[i] = out[i];
  }
}

// One row behind as it stands: its heights at `turn` of its own turns
// on, `multiple` times round, for every point of the cycle.
inline void read_row(const float* ring, int multiple, float turn, float lift, float* out) {
  turn -= std::floor(turn);
  const float place = turn * kDraw;
  const int first = static_cast<int>(place);
  const float part = place - static_cast<float>(first);
  for (int i = 0; i < kDraw; ++i) {
    const int at = (i * multiple + first) & (kDraw - 1);
    out[i] = ring[at] + (ring[at + 1] - ring[at]) * part + lift;
  }
}

// A wooden box: broad fixed bands, the same for every key.
struct Body {
  static constexpr int kPoints = 192;
  static constexpr float kLow = 5.0f, kHigh = 14.3f;  // octaves of 1 Hz
  float gain[kPoints + 1] = {};

  void build() {
    static constexpr float kBands[][3] = {  // Hz, octaves, dB
        {60.0f, 0.5f, -5.0f},  {205.0f, 0.28f, 6.0f},  {300.0f, 0.2f, 5.0f},   {410.0f, 0.24f, -6.0f},
        {540.0f, 0.22f, 6.0f}, {780.0f, 0.26f, -7.0f}, {1120.0f, 0.26f, 5.0f}, {1650.0f, 0.3f, -6.0f},
        {2500.0f, 0.4f, 3.0f}, {4300.0f, 0.5f, -6.0f}, {9500.0f, 0.9f, -8.0f}, {18000.0f, 0.8f, -8.0f}};
    for (int i = 0; i <= kPoints; ++i) {
      const float octave = kLow + (kHigh - kLow) * static_cast<float>(i) / kPoints;
      float db = 0.0f;
      for (const auto& band : kBands) {
        const float off = (octave - std::log2(band[0])) / band[1];
        db += band[2] * std::exp(-0.5f * off * off);
      }
      gain[i] = kit::db_to_gain(2.7f * db);
    }
  }
  float at(float hz) const {
    const float place = (std::log2(hz) - kLow) * (kPoints / (kHigh - kLow));
    const float point = kit::clamp(place, 0.0f, kPoints - 1.0f);
    const int i = static_cast<int>(point);
    return gain[i] + (gain[i + 1] - gain[i]) * (point - static_cast<float>(i));
  }
};

}  // namespace ridge_lines
}  // namespace livemix
