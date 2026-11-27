#pragma once

// What the tubes are and what burns in them. Figures set by measurement.

namespace livemix {
namespace flame_organ {

constexpr int kTubes = 5;
constexpr int kFuels = 4;
constexpr int kModes = 12;
constexpr int kTwin = 8;  // the first mode of the double tube's longer pipe

// A tube: the harmonics it has, how long each rings and how it gives them off.
struct Tube {
  float q;         // of the first mode at A3
  float q_tilt;    // mode n has q * n^q_tilt
  float mouth;     // level of harmonic n outside: n^mouth
  float direct;    // how much of the flame itself is heard past the tube
  float breath;    // how much of the fuel's noise gets out
  float body_hz;   // a resonance of the tube's own, the same for every key
  float body_q;
  float body;      // how much of it is added
  float thin;      // Hz under which it lets nothing out
  float spread;    // how far from the middle its harmonics stand
};

inline const Tube& tube(int index) {
  static constexpr Tube kTable[kTubes] = {
      // q    tilt    mouth  direct breath body_hz  q    body   thin   spread
      {64.0f, -0.20f, 0.30f, 0.60f, 0.8f, 420.0f, 0.8f, 0.25f, 12.0f, 1.0f},    // Open
      {90.0f, -0.20f, -0.70f, 0.00f, 0.03f, 190.0f, 1.0f, 2.0f, 12.0f, 0.15f},  // Half closed
      {30.0f, 0.30f, 1.30f, 20.0f, 2.2f, 1400.0f, 1.1f, 8.00f, 900.0f, 1.0f},    // Flared
      {190.0f, -1.00f, -3.2f, 0.00f, 1.1f, 3000.0f, 1.6f, 0.60f, 90.0f, 1.0f},  // Narrow
      {70.0f, -0.15f, -0.20f, 0.10f, 0.4f, 110.0f, 0.9f, 2.20f, 12.0f, 1.3f},    // Double
  };
  return kTable[index];
}

// Which harmonic of the key mode `m` of a tube is. The half closed tube has
// the odd ones; the double one is two pipes, the second an octave below.
inline float tube_ratio(int tube, int m) {
  if (tube == 1) return static_cast<float>(2 * m + 1);
  if (tube == 3) return static_cast<float>(m < 4 ? m + 1 : 2 * m - 2);
  if (tube == 4) return m < kTwin ? static_cast<float>(m + 1) : 0.5f + static_cast<float>(m - kTwin);
  return static_cast<float>(m + 1);
}

// A fuel: the shape of the flame's answer to the air that comes to it, and its noise.
struct Fuel {
  float bias;      // how far down the flame rests as the air swings: deeper is a narrower pulse
  float drive;     // how far over the threshold it burns
  float slow;      // the harmonic up to which the flame can follow
  float jitter;    // turbulence inside the flame
  float direct;    // the flame heard by itself
  float direct_hz;
  float hiss;      // noise heard by itself
  float hiss_hz;
  float hiss_low;  // how much of the hiss is under its band as well
  float crackle;   // embers that jump
  float puff_hz;   // how fast the flame flickers
  float puff;      // and how much
  float bright;    // octaves by which it opens the mouth
  float late;      // how much longer it takes to catch
};

inline const Fuel& fuel(int index) {
  static constexpr Fuel kTable[kFuels] = {
      // bias  drive  slow  jitter direct d_hz   hiss   hiss_hz  low  crackle puff_hz puff bright late
      {0.36f, 1.00f, 2.4f, 0.05f, 1.50f, 2000.0f, 3.00f, 2200.0f, 0.10f, 0.0f, 1.3f, 0.7f, -0.4f, 1.0f},    // Gas
      {0.08f, 0.35f, 1.5f, 0.02f, 0.00f, 700.0f, 0.12f, 380.0f, 0.60f, 0.0f, 3.1f, 2.1f, -1.9f, 2.0f},     // Candle
      {0.80f, 2.2f, 5.5f, 0.04f, 60.0f, 14000.0f, 1.20f, 4600.0f, 0.0f, 0.0f, 2.0f, 1.5f, 1.7f, 0.4f},    // Spirit
      {0.55f, 1.40f, 1.3f, 1.00f, 0.80f, 900.0f, 13.0f, 140.0f, 1.00f, 1.0f, 0.8f, 1.0f, -1.1f, 1.3f},     // Coal
  };
  return kTable[index];
}

// The glass of the tube itself, struck: the rings of a thin cylinder, the
// lowest an octave over the key.
constexpr int kRings = 4;
constexpr float kRingRatio[kRings] = {2.0f, 5.657f, 10.84f, 17.54f};
constexpr float kRingLevel[kRings] = {0.8f, 0.75f, 0.45f, 0.22f};

}  // namespace flame_organ
}  // namespace livemix
