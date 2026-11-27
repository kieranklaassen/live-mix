#pragma once

// What Night Drum is made of: the modes of a round skin, the bodies it is
// stretched over and the hands that play it. Numbers only, and the shapes of
// the modes along the radius, worked out once from the Bessel series.

#include "../../kit/kit.h"

namespace livemix {
namespace night_drum_tables {

constexpr int kModes = 20;              // modes of the struck skin
constexpr int kCavity = 4;             // resonances of the air in the body
constexpr int kOther = 4;              // modes of the second skin
constexpr int kAir = kCavity + kOther;
constexpr int kSlots = kModes + kAir;
constexpr int kShapeSteps = 32;

// One mode of the skin: how many nodal diameters (m), its Bessel zero, its
// ratio to the note on a bare skin, on a fully loaded one, and the same two
// over a kettle. `side` is 0 for a mode that lies along the hand's line, 1
// for its mate turned a quarter of its own wave.
struct SkinMode {
  int m;
  float zero;
  float bare, loaded;
  float kettle_bare, kettle_loaded;
  int side;
};

inline const SkinMode& skin_mode(int k) {
  static const SkinMode kModes[kModes] = {
      {0, 2.4048f, 1.000f, 1.0f, 1.000f, 1.0f, 0},  {1, 3.8317f, 1.594f, 2.0f, 1.560f, 1.5f, 0},
      {1, 3.8317f, 1.594f, 2.0f, 1.560f, 1.5f, 1},  {2, 5.1356f, 2.136f, 3.0f, 2.070f, 2.0f, 0},
      {2, 5.1356f, 2.136f, 3.0f, 2.070f, 2.0f, 1},  {0, 5.5201f, 2.296f, 3.0f, 2.030f, 2.0f, 0},
      {3, 6.3802f, 2.653f, 4.0f, 2.560f, 2.5f, 0},  {3, 6.3802f, 2.653f, 4.0f, 2.560f, 2.5f, 1},
      {1, 7.0156f, 2.918f, 4.0f, 2.610f, 2.5f, 0},  {1, 7.0156f, 2.918f, 4.0f, 2.610f, 2.5f, 1},
      {4, 7.5883f, 3.156f, 5.0f, 3.040f, 3.0f, 0},  {4, 7.5883f, 3.156f, 5.0f, 3.040f, 3.0f, 1},
      {2, 8.4172f, 3.501f, 5.0f, 3.190f, 3.0f, 0},  {2, 8.4172f, 3.501f, 5.0f, 3.190f, 3.0f, 1},
      {0, 8.6537f, 3.600f, 5.0f, 3.130f, 3.0f, 0},  {5, 8.7715f, 3.652f, 6.0f, 3.510f, 3.5f, 0},
      {3, 9.7610f, 4.060f, 6.0f, 3.640f, 3.5f, 1},  {6, 9.9361f, 4.154f, 7.0f, 3.980f, 4.0f, 0},
      {7, 11.0864f, 4.654f, 8.0f, 4.460f, 4.5f, 1}, {8, 12.2251f, 5.131f, 9.0f, 4.920f, 5.0f, 0},
  };
  return kModes[k];
}

// J_m(x) by its series, which is exact enough to x = 13 in double.
inline double bessel(int m, double x) {
  double term = 1.0;
  for (int i = 1; i <= m; ++i) term *= 0.5 * x / i;
  double sum = term;
  for (int k = 1; k < 60; ++k) {
    term *= -0.25 * x * x / (static_cast<double>(k) * (k + m));
    sum += term;
  }
  return sum;
}

// The skin's shape under the hand, from the centre (0) to the rim (kShapeSteps).
struct Shapes {
  float at[kModes][kShapeSteps + 1] = {};
  bool ready = false;

  void init() {
    if (ready) return;
    for (int k = 0; k < kModes; ++k) {
      const SkinMode& mode = skin_mode(k);
      double most = 1.0e-9;
      for (int i = 0; i <= kShapeSteps; ++i) {
        const double y = bessel(mode.m, mode.zero * i / kShapeSteps);
        at[k][i] = static_cast<float>(y);
        most = y > most ? y : (-y > most ? -y : most);
      }
      for (int i = 0; i <= kShapeSteps; ++i) at[k][i] = static_cast<float>(at[k][i] / most);
    }
    ready = true;
  }
  float read(int k, float place) const {
    const float position = kit::clamp(place, 0.0f, 0.999f) * kShapeSteps;
    const int i = static_cast<int>(position);
    return at[k][i] + (at[k][i + 1] - at[k][i]) * (position - static_cast<float>(i));
  }
};

// What the air under a skin does. The bumps are formants of the body, where
// it stands in hertz whatever the key (moved by Cavity Tune); the air
// resonances follow the key. Every number is a float, so a change of body is
// a glide from one list to the other.
struct Body {
  float bump[3], width[3], lift[3];  // log2 Hz, octaves, gain
  float base, low, high;             // flat part, Hz below and above which it falls
  float ring, radial;                // ring time, and how much sooner the modes with no diameter die
  float tilt;                        // added to the colour of the overtones, a power of the ratio
  float kettle;                      // how far the kettle's air pulls the ratios
  float air[kCavity], q[kCavity], gain[kCavity];  // log2 ratio, sharpness, level
  float direct;                      // how much of the hand goes straight into the air
  float gulp;                        // octaves the air rises after a stroke
  float wide;
  float tap, tap_level;              // octaves the hand itself is moved by, and its gain
};
constexpr int kBodyFloats = static_cast<int>(sizeof(Body) / sizeof(float));
constexpr int kNumBodies = 5;
enum BodyId : int { kShallow = 0, kPot, kKettle, kTube, kNone };

inline const Body& body_of(int id) {
  static const Body kBodies[kNumBodies] = {
      // Shallow: a frame with hardly any air in it. Thin below, open, wide and bright above.
      {{9.4f, 10.7f, 11.7f}, {0.4f, 0.5f, 0.6f}, {1.5f, 3.0f, 1.4f}, 0.35f, 620.0f, 7000.0f, 1.9f, 1.5f, 0.6f, 0.0f,
       {0.0f, 1.585f, 2.0f, 2.32f}, {2.0f, 2.0f, 2.0f, 2.0f}, {0.12f, 0.0f, 0.0f, 0.0f}, 0.1f, 0.0f, 1.7f, 0.2f, 1.1f},
      // Pot: one round mouth of air that gulps up to its place under every stroke.
      {{7.8f, 9.1f, 10.3f}, {0.8f, 0.34f, 0.28f}, {1.5f, 2.4f, 1.8f}, 0.38f, 30.0f, 2000.0f, 0.8f, 1.2f, 0.1f, 0.0f,
       {0.0f, 1.0f, 1.585f, 2.0f}, {9.0f, 14.0f, 10.0f, 8.0f}, {0.9f, 0.35f, 0.3f, 0.0f}, 1.4f, 1.0f, 1.0f, -0.5f, 0.6f},
      // Kettle: closed bowl whose air pulls the overtones into a chain of fifths and octaves. Dark, wide and long.
      {{7.0f, 8.3f, 10.2f}, {0.5f, 0.7f, 0.6f}, {1.6f, 0.9f, 0.2f}, 0.4f, 40.0f, 760.0f, 2.6f, 4.0f, -0.5f, 1.0f,
       {-1.0f, 0.0f, 0.585f, 1.0f}, {40.0f, 24.0f, 20.0f, 20.0f}, {1.6f, 0.6f, 0.2f, 0.1f}, 2.0f, 0.0f, 2.2f, -1.2f, 0.8f},
      // Tube: a long shell. It booms below and speaks like a nasal vowel above, with a hollow between.
      {{6.8f, 9.6f, 10.9f}, {0.3f, 0.14f, 0.2f}, {0.6f, 3.2f, 5.0f}, 0.03f, 60.0f, 4500.0f, 0.75f, 0.6f, 0.4f, 0.0f,
       {-1.0f, 0.585f, 1.3219f, 2.585f}, {26.0f, 24.0f, 26.0f, 26.0f}, {2.4f, 0.9f, 0.9f, 1.2f}, 1.4f, 0.05f, 0.5f, 0.4f, 1.1f},
      // None: a skin held in the air. The two sides cancel below, so it is thin, short and close.
      {{10.0f, 10.8f, 12.0f}, {0.8f, 0.8f, 0.8f}, {1.1f, 0.6f, 0.2f}, 0.9f, 640.0f, 5500.0f, 0.15f, 0.6f, 0.35f, 0.0f,
       {0.0f, 1.585f, 2.0f, 2.32f}, {2.0f, 2.0f, 2.0f, 2.0f}, {0.0f, 0.0f, 0.0f, 0.0f}, 0.0f, 0.0f, 0.2f, -0.6f, 1.2f},
  };
  return kBodies[kit::clamp_int(id, 0, kNumBodies - 1)];
}

// How the skin is touched. `touch` is the time the contact lasts; `area` how
// wide it is (a wide one cannot wake short waves); `bright` leans on the
// overtones, a power of the ratio; `tap` is the sound of the hand itself,
// round `tap_hz`; `air` what it sends straight into the body; `keep` how
// much of a single stroke's level a roll holds; `land` how quickly a hand
// that stays is fully on the skin, `leave` how quickly it is
// off; `pace` how quick the hand is, of the strokes a second Roll asks for;
// `spread` how far apart its drums stand; `loud` how heavy the hand is; `clear`
// how much longer it lets the overtones ring, a power of the ratio.
struct Hand {
  bool sustained;
  float touch, area, bright;
  float tap, tap_hz, tap_q, tap_seconds;
  float air, ring, bend, keep;
  float land, leave, pace, spread;
  float loud, clear;
};
constexpr int kNumHands = 7;
enum HandId : int { kFinger = 0, kThumb, kPalm, kStick, kBrush, kRub, kHum };

inline const Hand& hand_of(int id) {
  static const Hand kHands[kNumHands] = {
      // finger: soft, round, pattering
      {false, 0.00009f, 0.10f, 0.0f, 1.1f, 1500.0f, 0.7f, 0.040f, 0.35f, 1.0f, 1.0f, 0.8f, 0.0f, 0.0f, 1.0f, 1.0f, 1.0f, 0.0f},
      // thumb: heavy, dark, leans on the skin
      {false, 0.0005f, 0.26f, -1.0f, 1.2f, 240.0f, 0.9f, 0.100f, 1.1f, 0.5f, 1.8f, 0.95f, 0.0f, 0.0f, 0.16f, 0.6f, 1.15f, -0.6f},
      // palm: a slap and a gulp of air, then the hand stays and stops it
      {false, 0.00016f, 0.34f, 0.3f, 8.0f, 300.0f, 0.5f, 0.160f, 3.4f, 0.13f, 1.2f, 0.8f, 0.0f, 0.0f, 0.22f, 0.4f, 1.4f, 0.2f},
      // stick: a hard point that leaves the overtones ringing
      {false, 0.00010f, 0.02f, 1.4f, 2.2f, 2200.0f, 0.6f, 0.024f, 0.1f, 1.3f, 0.8f, 0.55f, 0.0f, 0.0f, 1.25f, 1.8f, 1.0f, 0.8f},
      // brush: bristles that swirl
      {true, 0.00008f, 0.22f, -0.3f, 8.0f, 1250.0f, 0.45f, 0.1f, 0.2f, 0.25f, 0.6f, 0.42f, 0.03f, 0.1f, 0.09f, 1.8f, 0.95f, 0.0f},
      // rub: a dry finger that sticks and slips
      {true, 0.00005f, 0.04f, 1.4f, 3.5f, 1200.0f, 1.6f, 0.1f, 0.3f, 0.09f, 1.4f, 0.46f, 0.3f, 0.05f, 0.08f, 0.1f, 1.0f, 0.0f},
      // hum: a voice sent into the skin
      {true, 0.00012f, 0.13f, 0.6f, 6.0f, 520.0f, 3.0f, 0.1f, 1.6f, 1.0f, 1.0f, 0.66f, 0.12f, 0.4f, 0.5f, 0.7f, 1.0f, 0.0f},
  };
  return kHands[kit::clamp_int(id, 0, kNumHands - 1)];
}

}  // namespace night_drum_tables
}  // namespace livemix
