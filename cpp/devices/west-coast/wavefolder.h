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
// them as coefficients, with the antiderivative at the start of each.
//
// Anti-aliasing: instead of the curve at x[n] the folder returns the mean of
// the curve between x[n-1] and x[n] (first-order antiderivative
// anti-aliasing, after the approach of Parker, Zavalishin and Le Bivic, as
// in the saturator's Adaa.h). The device runs it at twice the sample rate.

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
    edge_[kPieces] = 1.0e30f;
    for (int p = 0; p < kPieces; ++p) {
      edge_[p] = static_cast<float>(start_[p]);
      fast_[p][0] = static_cast<float>(start_[p]);
      fast_[p][1] = static_cast<float>(curve_[p][0]);
      fast_[p][2] = static_cast<float>(0.5 * curve_[p][1]);
      fast_[p][3] = static_cast<float>(curve_[p][2] * (1.0 / 3.0));
      fast_area_[p] = static_cast<float>(area_[p]);
    }
  }

  // The curve itself (odd). For building tables, not for audio.
  double shape(double x) const {
    const double a = x < 0.0 ? -x : x;
    const int p = piece_of(a);
    const double u = a - start_[p];
    const double y = curve_[p][0] + u * (curve_[p][1] + u * curve_[p][2]);
    return x < 0.0 ? -y : y;
  }

  // For Wavefolder: the piece an input magnitude lies on, found by walking
  // from the piece the last input was on (the input moves a little at a
  // time, and a float-to-integer conversion per sample costs far more in
  // WebAssembly than these two comparisons).
  int walk_to_piece(int piece, float a) const {
    while (a >= edge_[piece + 1]) ++piece;
    while (a < edge_[piece]) --piece;
    return piece;
  }
  // The antiderivative at magnitude `a`, known to lie on `piece`.
  float area_on_piece(int piece, float a) const {
    const float* c = fast_[piece];
    const float u = a - c[0];
    return fast_area_[piece] + u * (c[1] + u * (c[2] + u * c[3]));
  }
  float half_slope_at_centre() const { return fast_[0][2]; }
  // The mean of the curve from `low` on `piece` to `high` on the next one:
  // the two parts weighted by their lengths.
  float mean_across(int piece, float low, float high) const {
    const float corner = fast_[piece + 1][0];
    return ((corner - low) * mean_on_piece(piece, low, corner) +
            (high - corner) * mean_on_piece(piece + 1, corner, high)) /
           (high - low);
  }
  // The mean of the curve between two magnitudes on one piece.
  float mean_on_piece(int piece, float a0, float a1) const {
    const float* c = fast_[piece];
    const float u0 = a0 - c[0];
    const float u1 = a1 - c[0];
    return c[1] + c[2] * (u0 + u1) + c[3] * (u0 * u0 + u0 * u1 + u1 * u1);
  }

 private:
  static constexpr int kPieces = 2 * kCells + 1;
  int piece_of(double a) const {
    int piece = 0;
    while (piece + 1 < kPieces && a >= start_[piece + 1]) ++piece;
    return piece;
  }

  double start_[kPieces] = {};
  double curve_[kPieces][3] = {};
  double area_[kPieces] = {};
  // {start, f0, f1 / 2, f2 / 3} of each piece, for mean_on_piece.
  float fast_[kPieces][4] = {};
  float fast_area_[kPieces] = {};
  // Where each piece starts, closed by a value no input reaches.
  float edge_[kPieces + 1] = {};
};

// One voice's folder: the mean of the curve over the step from the last
// input to this one. A step that stays on one piece, or runs from one piece
// into the next, has a closed form with no cancellation (the mean of a
// parabola, or two of them weighted by length), however short the step.
// Only a step over more than one corner, or through zero from beyond the
// first, takes the difference of the antiderivative.
struct Wavefolder {
  float last_input = 0.0f;
  int last_piece = 0;

  void reset() {
    last_input = 0.0f;
    last_piece = 0;
  }

  float process(const FoldCurve& curve, float input) {
    const float previous = last_input;
    const float a = std::fabs(input);
    const float b = std::fabs(previous);
    const int old_piece = last_piece;
    const int piece = curve.walk_to_piece(old_piece, a);
    last_input = input;
    last_piece = piece;
    if ((previous < 0.0f) == (input < 0.0f)) {
      // The curve is odd: work on magnitudes and give the result the input's side.
      const float side = std::copysign(1.0f, input);
      if (piece == old_piece) return side * curve.mean_on_piece(piece, b, a);
      if (piece == old_piece + 1) return side * curve.mean_across(old_piece, b, a);
      if (piece + 1 == old_piece) return side * curve.mean_across(piece, a, b);
    } else if ((piece | old_piece) == 0) {
      // Through zero on the straight piece through the centre, which is
      // odd: the mean is the curve at the middle of the step.
      return curve.half_slope_at_centre() * (previous + input);
    }
    // A longer step: the difference of the antiderivative (even, so the
    // magnitudes will do) over the step. Such a step spans at least a whole
    // corner, 2 · kSoftness, or runs through zero from beyond the first
    // one, so the difference is far from the rounding of its two terms.
    return (curve.area_on_piece(piece, a) - curve.area_on_piece(old_piece, b)) / (input - previous);
  }
};

}  // namespace west_coast
}  // namespace livemix
