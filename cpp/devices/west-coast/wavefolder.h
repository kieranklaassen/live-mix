#pragma once

// A five-cell parallel wavefolder with first-order antiderivative
// anti-aliasing.
//
// The structure is the one of the classic "timbre" circuit of west coast
// oscillators: five dead-zone amplifiers side by side, each silent until the
// input passes its threshold, summed with alternating signs with the input
// itself. Every threshold the input crosses turns the transfer curve around
// once more, so a sine fed in at a growing level folds over itself up to
// five times each way:
//
//   out = x + Σ c[k] · deadzone(x, T[k])
//
//   turning points:   x   0.6    1.8    3.0    4.1    5.5
//                   out  +0.6   −0.7   +0.8   −0.9   +1.0   (then down again)
//
// The thresholds are unevenly spaced and each fold is a little taller than
// the one before, so the overtones do not come and go in a regular pattern
// as the level rises. The corners are rounded (a parabola kSoftness wide on
// each side of a threshold): an op-amp cell does not turn on a point either,
// and it takes the top octaves of fizz off.
//
// Between two corners the curve is a straight line and inside a corner a
// parabola, so the whole curve is eleven polynomial pieces. FoldCurve keeps
// them as coefficients (and those of the antiderivative, one degree higher)
// with a grid that finds the piece for an input without a search.
//
// Anti-aliasing: instead of the curve at x[n] the folder returns the mean of
// the curve between x[n-1] and x[n], from the antiderivative (Parker,
// Zavalishin and Le Bivic's first-order ADAA). The device runs it at twice
// the sample rate. The difference of antiderivatives is taken in double: in
// float its rounding error would sit at about -50 dB.

#include <cmath>
#include <cstdint>

namespace livemix {
namespace west_coast {

class FoldCurve {
 public:
  static constexpr int kCells = 5;
  static constexpr double kThreshold[kCells] = {0.6, 1.8, 3.0, 4.1, 5.5};
  // Slope of the curve between the thresholds, starting from the centre.
  static constexpr double kSlope[kCells + 1] = {1.0, -1.3 / 1.2, 1.5 / 1.2, -1.7 / 1.1, 1.9 / 1.4, -1.2};
  static constexpr double kSoftness = 0.15;
  // Below this input the folder is exactly linear.
  static constexpr float kLinearLimit = static_cast<float>(kThreshold[0] - kSoftness);
  // The input level that reaches every fold.
  static constexpr float kFullLevel = 6.3f;

  void init() {
    // Piece 0 is the straight line through the centre; each cell then adds
    // a corner piece and the straight piece after it.
    start_[0] = 0.0;
    double slope = kSlope[0];
    for (int k = 0; k < kCells; ++k) {
      const double bend = (kSlope[k + 1] - kSlope[k]) / (4.0 * kSoftness);
      start_[2 * k + 1] = kThreshold[k] - kSoftness;
      start_[2 * k + 2] = kThreshold[k] + kSoftness;
      curve_[2 * k][1] = slope;
      curve_[2 * k][2] = 0.0;
      curve_[2 * k + 1][1] = slope;
      curve_[2 * k + 1][2] = bend;
      slope = kSlope[k + 1];
    }
    curve_[kPieces - 1][1] = slope;
    curve_[kPieces - 1][2] = 0.0;
    // Join the pieces: each starts where the one before ends, and so does
    // its antiderivative.
    curve_[0][0] = 0.0;
    area_[0] = 0.0;
    for (int p = 0; p + 1 < kPieces; ++p) {
      const double u = start_[p + 1] - start_[p];
      curve_[p + 1][0] = curve_[p][0] + u * (curve_[p][1] + u * curve_[p][2]);
      area_[p + 1] = area_[p] + u * (curve_[p][0] + u * (0.5 * curve_[p][1] + u * curve_[p][2] * (1.0 / 3.0)));
    }
    for (int i = 0; i < kGrid; ++i) {
      const double centre = (i + 0.5) / kGridScale;
      int piece = 0;
      while (piece + 1 < kPieces && centre > start_[piece + 1]) ++piece;
      piece_[i] = static_cast<uint8_t>(piece);
    }
  }

  // The curve itself (odd).
  double shape(double x) const {
    const double a = x < 0.0 ? -x : x;
    const int p = piece_of(a);
    const double u = a - start_[p];
    const double y = curve_[p][0] + u * (curve_[p][1] + u * curve_[p][2]);
    return x < 0.0 ? -y : y;
  }

  // Its antiderivative (even).
  double antiderivative(double x) const {
    const double a = x < 0.0 ? -x : x;
    const int p = piece_of(a);
    const double u = a - start_[p];
    return area_[p] + u * (curve_[p][0] + u * (0.5 * curve_[p][1] + u * (curve_[p][2] * (1.0 / 3.0))));
  }

 private:
  static constexpr int kPieces = 2 * kCells + 1;
  // Every corner starts and ends on a multiple of 1 / kGridScale, so a grid
  // cell lies in one piece. An input that rounds into the neighbouring cell
  // reads the neighbouring piece a hair past its end, where the two agree.
  static constexpr double kGridScale = 20.0;
  static constexpr int kGrid = 160;

  int piece_of(double a) const {
    const int cell = static_cast<int>(a * kGridScale);
    return piece_[cell < kGrid ? cell : kGrid - 1];
  }

  double start_[kPieces] = {};
  double curve_[kPieces][3] = {};
  double area_[kPieces] = {};
  uint8_t piece_[kGrid] = {};
};

// One voice's folder: the mean of the curve over the step from the last
// input to this one.
struct Wavefolder {
  double last_input = 0.0;
  double last_area = 0.0;

  void reset() {
    last_input = 0.0;
    last_area = 0.0;
  }

  float process(const FoldCurve& curve, float input) {
    const double x = static_cast<double>(input);
    const double area = curve.antiderivative(x);
    const double delta = x - last_input;
    const double y = (delta > kMinDelta || delta < -kMinDelta) ? (area - last_area) / delta
                                                               : curve.shape(0.5 * (x + last_input));
    last_input = x;
    last_area = area;
    return static_cast<float>(y);
  }

  static constexpr double kMinDelta = 1.0e-5;
};

}  // namespace west_coast
}  // namespace livemix
