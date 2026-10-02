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
// Anti-aliasing: instead of the curve at x[n] the folder returns the mean of
// the curve between x[n-1] and x[n], from the closed-form antiderivative
// (Parker, Zavalishin and Le Bivic's first-order ADAA). The device runs it at
// twice the sample rate. The difference of antiderivatives is taken in
// double: in float its rounding error would sit at about -50 dB.

#include <cmath>

namespace livemix {
namespace west_coast {

class Wavefolder {
 public:
  static constexpr int kCells = 5;
  static constexpr double kThreshold[kCells] = {0.6, 1.8, 3.0, 4.1, 5.5};
  // Slope of the curve between the thresholds, starting from the centre.
  static constexpr double kSlope[kCells + 1] = {1.0, -1.3 / 1.2, 1.5 / 1.2, -1.7 / 1.1, 1.9 / 1.4, -1.2};
  // Each cell's gain is the change of slope at its threshold.
  static constexpr double kWeight[kCells] = {kSlope[1] - kSlope[0], kSlope[2] - kSlope[1],
                                             kSlope[3] - kSlope[2], kSlope[4] - kSlope[3],
                                             kSlope[5] - kSlope[4]};
  static constexpr double kSoftness = 0.15;
  // Below this input the folder is exactly linear.
  static constexpr float kLinearLimit = static_cast<float>(kThreshold[0] - kSoftness);
  // The input level that reaches every fold.
  static constexpr float kFullLevel = 6.3f;

  void reset() {
    x1_ = 0.0;
    f1_ = 0.0;
  }

  // The curve itself.
  static double shape(double x) {
    const double a = x < 0.0 ? -x : x;
    double sum = a;
    for (int k = 0; k < kCells; ++k) {
      const double over = a - kThreshold[k] + kSoftness;
      if (over <= 0.0) break;
      sum += kWeight[k] * (over < 2.0 * kSoftness ? over * over * (0.25 / kSoftness) : over - kSoftness);
    }
    return x < 0.0 ? -sum : sum;
  }

  // Its antiderivative (an even function).
  static double antiderivative(double x) {
    const double a = x < 0.0 ? -x : x;
    double sum = 0.5 * a * a;
    for (int k = 0; k < kCells; ++k) {
      const double over = a - kThreshold[k] + kSoftness;
      if (over <= 0.0) break;
      if (over < 2.0 * kSoftness) {
        sum += kWeight[k] * over * over * over * (1.0 / (12.0 * kSoftness));
      } else {
        const double past = over - kSoftness;
        sum += kWeight[k] * (0.5 * past * past + kSoftness * kSoftness * (1.0 / 6.0));
      }
    }
    return sum;
  }

  // The mean of the curve over the step from the last input to this one.
  float process(float input) {
    const double x = static_cast<double>(input);
    const double f = antiderivative(x);
    const double delta = x - x1_;
    const double y = (delta > kMinDelta || delta < -kMinDelta) ? (f - f1_) / delta : shape(0.5 * (x + x1_));
    x1_ = x;
    f1_ = f;
    return static_cast<float>(y);
  }

 private:
  static constexpr double kMinDelta = 1.0e-5;

  double x1_ = 0.0;
  double f1_ = 0.0;
};

}  // namespace west_coast
}  // namespace livemix
