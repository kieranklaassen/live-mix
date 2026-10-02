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
// the curve between x[n-1] and x[n] (first-order antiderivative
// anti-aliasing, after Parker, Zavalishin and Le Bivic). The device runs it
// at twice the sample rate.

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
    for (int p = 0; p < kPieces; ++p) {
      fast_[p][0] = static_cast<float>(start_[p]);
      fast_[p][1] = static_cast<float>(curve_[p][0]);
      fast_[p][2] = static_cast<float>(0.5 * curve_[p][1]);
      fast_[p][3] = static_cast<float>(curve_[p][2] * (1.0 / 3.0));
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

  // For Wavefolder: the piece an input magnitude lies on, and the mean of
  // the curve between two magnitudes on one piece.
  int piece_of_float(float a) const {
    const int cell = static_cast<int>(a * static_cast<float>(kGridScale));
    return piece_[cell < kGrid ? cell : kGrid - 1];
  }
  float start_of(int piece) const { return fast_[piece][0]; }
  float mean_on_piece(int piece, float a0, float a1) const {
    const float* c = fast_[piece];
    const float u0 = a0 - c[0];
    const float u1 = a1 - c[0];
    return c[1] + c[2] * (u0 + u1) + c[3] * (u0 * u0 + u0 * u1 + u1 * u1);
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
  // {start, f0, f1 / 2, f2 / 3} of each piece, for mean_on_piece.
  float fast_[kPieces][4] = {};
  uint8_t piece_[kGrid] = {};
};

// One voice's folder: the mean of the curve over the step from the last
// input to this one. A step that stays on one piece, or runs from one piece
// into the next, is two parabolas' means weighted by length: no
// cancellation, so float is enough, and no branch the input's pattern could
// fool (a step inside one piece is split at its middle and takes the same
// path). Only a step over more than one corner, or through zero from beyond
// the first, takes the difference of the antiderivative.
struct Wavefolder {
  float last_input = 0.0f;
  int last_piece = 0;

  void reset() {
    last_input = 0.0f;
    last_piece = 0;
  }

  float process(const FoldCurve& curve, float input) {
    const float previous = last_input;
    const float a = input < 0.0f ? -input : input;
    const float b = previous < 0.0f ? -previous : previous;
    const int piece = curve.piece_of_float(a);
    const int old_piece = last_piece;
    last_input = input;
    last_piece = piece;
    const int apart = piece - old_piece;
    const bool opposite = (previous < 0.0f) != (input < 0.0f);
    if (apart > 1 || apart < -1 || (opposite && (piece | old_piece) != 0)) {
      return wide_step(curve, previous, input);
    }
    // The centre piece is a straight line through zero, so a step across
    // zero on it is the same sum with signed ends.
    const float from = (piece | old_piece) == 0 ? previous : b;
    const float to = (piece | old_piece) == 0 ? input : a;
    const float low = from < to ? from : to;
    const float high = from < to ? to : from;
    const int low_piece = apart < 0 ? piece : old_piece;
    const int high_piece = apart < 0 ? old_piece : piece;
    const float split = apart != 0 ? curve.start_of(high_piece) : 0.5f * (low + high);
    const float first = curve.mean_on_piece(low_piece, low, split);
    const float span = high - low;
    const float second = curve.mean_on_piece(high_piece, split, high);
    const float mean = span > 0.0f ? ((split - low) * first + (high - split) * second) / span : first;
    return ((piece | old_piece) != 0 && input < 0.0f) ? -mean : mean;
  }

  // A step over more than one corner, or through zero from beyond the
  // first: the difference of the antiderivative, in double because the two
  // values are large and close.
  static float wide_step(const FoldCurve& curve, float previous, float input) {
    const double x0 = static_cast<double>(previous);
    const double x1 = static_cast<double>(input);
    const double delta = x1 - x0;
    if (delta < kMinDelta && delta > -kMinDelta) return static_cast<float>(curve.shape(0.5 * (x0 + x1)));
    return static_cast<float>((curve.antiderivative(x1) - curve.antiderivative(x0)) / delta);
  }

  static constexpr double kMinDelta = 1.0e-5;
};

}  // namespace west_coast
}  // namespace livemix
