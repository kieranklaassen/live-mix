#pragma once

// The carrier shapes of Ring (ring.h) as band-limited tables.
//
// A carrier that is not a sine has harmonics, and each of them rings the
// input too (a pair of new partials around 3c, around 5c, ...). A harmonic
// above half the sample rate less the input's own frequency folds back, so
// the shapes are kept as their Fourier series cut off at a number of
// harmonics, one table for each cut, and the device reads the table whose
// highest harmonic still lies under a sixth of the sample rate: input below
// a third of the sample rate then makes nothing that folds.
//
// All three shapes are odd and the same in each half cycle with the sign
// turned, so their series are sines of the odd harmonics only:
//
//   Triangle     rising through zero, peaks at a quarter and three quarters
//   Soft square  sin / √(sin² + kSoft²)
//   Diode        the bridge's small-signal gate A'(sin), see `Diode` below
//
// The series of each is taken by summation over 4096 points of one cycle.
// Each is scaled to a root mean square of one over the whole series, so the
// ringing sound has the power of what went in whatever the shape; the sine
// (kit::SineTable, times √2) is the fourth.
//
// Storage: 3 shapes × 12 cuts × 2049 floats, 295 kB, filled once.

#include "../../kit/math.h"

namespace livemix {
namespace ring {

// The diode bridge, after the usual four-diode ring: with the carrier c on
// the bridge and the signal x across it the output is
//
//   out = A(c + x/2) − A(c − x/2),   A(v) = h(v − vb) + h(−v − vb),
//   h(u) = (u + √(u² + k²)) / 2
//
// h is a diode that starts to conduct at its forward voltage vb, with a knee
// k wide. A is even, so no carrier comes out without a signal. For a small
// signal out = x·A'(c): the signal times a gate that is shut while the
// carrier is under the forward voltage. A loud signal opens the diodes by
// itself, which rounds the gate and lets odd harmonics of the signal through.
// The gate A'(sin) is one of the shapes below (`Waves::ideal`).
struct Diode {
  static constexpr float kForward = 0.3f;
  static constexpr float kKnee = 0.12f;

  // A(v): the linear parts of its two diodes sum to −vb.
  static float bridge(float v) {
    const float a = v - kForward;
    const float b = v + kForward;
    return 0.5f * (std::sqrt(a * a + kKnee * kKnee) + std::sqrt(b * b + kKnee * kKnee)) - kForward;
  }
};

class Waves {
 public:
  enum Shape : int { kTriangle = 0, kSoftSquare, kDiode, kNumShapes };

  static constexpr int kSize = 2048;
  static constexpr int kCuts = 12;
  // The highest harmonic each cut keeps.
  static constexpr int kLimit[kCuts] = {1, 3, 5, 7, 11, 15, 23, 31, 47, 63, 95, 127};
  static constexpr float kSoft = 0.3f;

  static void init() {
    if (ready()) return;
    kit::SineTable::init();
    for (int shape = 0; shape < kNumShapes; ++shape) build(shape);
    ready() = true;
  }

  // The shape at `phase` (cycles, any finite value) from the table of one cut.
  static float read(int shape, int cut, float phase) {
    phase -= std::floor(phase);
    const float position = phase * kSize;
    const int index = static_cast<int>(position);
    const float fraction = position - static_cast<float>(index);
    const float* table = data(shape, cut);
    return table[index] + (table[index + 1] - table[index]) * fraction;
  }

  // What the diode output is scaled by so its small-signal gate has a root
  // mean square of one, as the table has it.
  static float diode_gain() { return gain()[kDiode]; }

  // The shape itself, not band-limited and not scaled: for the series, and
  // for the harness to hold the tables to.
  static double ideal(int shape, double phase) {
    const double s = std::sin(2.0 * 3.14159265358979323846 * phase);
    switch (shape) {
      case kTriangle: {
        const double p = phase - std::floor(phase);
        return p < 0.25 ? 4.0 * p : (p < 0.75 ? 2.0 - 4.0 * p : 4.0 * p - 4.0);
      }
      case kSoftSquare:
        return s / std::sqrt(s * s + static_cast<double>(kSoft) * kSoft);
      case kDiode:
      default: {
        const double f = Diode::kForward, k = Diode::kKnee;
        return 0.5 * ((s - f) / std::sqrt((s - f) * (s - f) + k * k) +
                      (s + f) / std::sqrt((s + f) * (s + f) + k * k));
      }
    }
  }

 private:
  static constexpr int kPoints = 4096;  // of the summation; kit::SineTable's own size

  static void build(int shape) {
    // b_n = 2 · mean of shape(φ)·sin(2πnφ), exact at the sine table's nodes.
    static double harmonic[kLimit[kCuts - 1] + 1];
    static double cycle[kPoints];
    for (int i = 0; i < kPoints; ++i) cycle[i] = ideal(shape, static_cast<double>(i) / kPoints);
    double power = 0.0;
    for (int n = 1; n <= kLimit[kCuts - 1]; n += 2) {
      double sum = 0.0;
      for (int i = 0; i < kPoints; ++i) {
        sum += cycle[i] * static_cast<double>(node((i * n) & (kPoints - 1)));
      }
      harmonic[n] = 2.0 * sum / kPoints;
      power += 0.5 * harmonic[n] * harmonic[n];
    }
    const double scale = 1.0 / std::sqrt(power);
    gain()[shape] = static_cast<float>(scale);
    static double sum[kSize];
    for (int i = 0; i < kSize; ++i) sum[i] = 0.0;
    int n = 1;
    for (int cut = 0; cut < kCuts; ++cut) {
      for (; n <= kLimit[cut]; n += 2) {
        const double b = harmonic[n] * scale;
        for (int i = 0; i < kSize; ++i) {
          sum[i] += b * static_cast<double>(node((2 * i * n) & (kPoints - 1)));
        }
      }
      float* table = data(shape, cut);
      for (int i = 0; i < kSize; ++i) table[i] = static_cast<float>(sum[i]);
      table[kSize] = table[0];
    }
  }

  // sin(2π·index / kPoints), a node of kit::SineTable.
  static float node(int index) {
    return kit::SineTable::lookup(static_cast<float>(index) * (1.0f / kPoints));
  }

  static float* data(int shape, int cut) {
    static float tables[kNumShapes][kCuts][kSize + 1];
    return tables[shape][cut];
  }
  static float* gain() {
    static float gains[kNumShapes];
    return gains;
  }
  static bool& ready() {
    static bool is_ready = false;
    return is_ready;
  }
};

}  // namespace ring
}  // namespace livemix
