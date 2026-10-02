#pragma once

#include <cmath>

// The memoryless part of a circuit: a weighted sum of three saturation
// kernels, each with unit slope at zero, and second-order antiderivative
// anti-aliasing over it.
//
//   soft   (1/a) K(a v / 1.5), K(t) = t (3 + 2 t^2) / (2 (1 + t^2)^1.5)
//                                     a gradual knee that never quite lands
//                                     (slope (1 + t^2)^-2.5: tanh-like at
//                                     first, slower to its ceiling 1/a); a
//                                     differs for the two polarities, which
//                                     is where the even harmonics come from
//   cubic  1.5 t - 0.5 t^3, clipped   a firm knee that lands on its ceiling
//   hard   clip                       no knee at all
//
// Every kernel has a closed-form first and second antiderivative (F1, F2),
// which is what the anti-aliasing needs, and none of the three needs more
// than a square root: K is the second derivative of t sqrt(1 + t^2) / 2,
// chosen for that. The weights sum to 1, so the curve itself has unit slope
// at zero.

namespace livemix {
namespace analog_drive_dsp {

struct Curve {
  double soft;           // weight of the soft kernel
  double soft_pos;       // its steepness above zero (ceiling 1 / soft_pos)
  double soft_neg;       // and below
  double cubic;          // weight of the cubic kernel
  double cubic_ceiling;
  double hard;           // weight of the hard clip
  double hard_ceiling;

  // The curve.
  double f(double v) const {
    double y = 0.0;
    if (soft > 0.0) {
      const double a = v >= 0.0 ? soft_pos : soft_neg;
      const double t = a * v * (1.0 / 1.5);
      const double r2 = 1.0 + t * t;
      y += soft * t * (3.0 + 2.0 * t * t) / (2.0 * a * r2 * std::sqrt(r2));
    }
    if (cubic > 0.0) {
      const double t = v / (1.5 * cubic_ceiling);
      const double a = t < 0.0 ? -t : t;
      const double shaped = a < 1.0 ? cubic_ceiling * (1.5 * t - 0.5 * t * t * t)
                                    : (t < 0.0 ? -cubic_ceiling : cubic_ceiling);
      y += cubic * shaped;
    }
    if (hard > 0.0) {
      y += hard * (v > hard_ceiling ? hard_ceiling : (v < -hard_ceiling ? -hard_ceiling : v));
    }
    return y;
  }

  // Its integral from zero.
  double F1(double v) const {
    double y = 0.0;
    if (soft > 0.0) {
      const double a = v >= 0.0 ? soft_pos : soft_neg;
      const double t = a * v * (1.0 / 1.5);
      const double t2 = t * t;
      y += soft * 0.75 * ((1.0 + 2.0 * t2) / std::sqrt(1.0 + t2) - 1.0) / (a * a);
    }
    if (cubic > 0.0) {
      const double s = 1.5 * cubic_ceiling;
      const double t = v / s;
      const double a = t < 0.0 ? -t : t;
      const double t2 = t * t;
      y += cubic * cubic_ceiling * s * (a < 1.0 ? t2 * (0.75 - 0.125 * t2) : a - 0.375);
    }
    if (hard > 0.0) {
      const double a = v < 0.0 ? -v : v;
      y += hard * (a < hard_ceiling ? 0.5 * v * v : hard_ceiling * (a - 0.5 * hard_ceiling));
    }
    return y;
  }

  // And the integral of that from zero.
  double F2(double v) const {
    double y = 0.0;
    if (soft > 0.0) {
      const double a = v >= 0.0 ? soft_pos : soft_neg;
      const double t = a * v * (1.0 / 1.5);
      // t (sqrt(1 + t^2) - 1), written so nothing cancels near zero.
      const double t2 = t * t;
      const double r = std::sqrt(1.0 + t2);
      y += soft * 1.125 * t * t2 / ((r + 1.0) * a * a * a);
    }
    if (cubic > 0.0) {
      const double s = 1.5 * cubic_ceiling;
      const double t = v / s;
      const double a = t < 0.0 ? -t : t;
      const double a2 = a * a;
      const double value = a < 1.0 ? a2 * a * (0.25 - 0.025 * a2) : 0.5 * a2 - 0.375 * a + 0.1;
      y += cubic * cubic_ceiling * s * s * (t < 0.0 ? -value : value);
    }
    if (hard > 0.0) {
      const double h = hard_ceiling;
      const double a = v < 0.0 ? -v : v;
      const double value = a < h ? a * a * a * (1.0 / 6.0) : h * (0.5 * a * a - 0.5 * h * a + h * h * (1.0 / 6.0));
      y += hard * (v < 0.0 ? -value : value);
    }
    return y;
  }
};

}  // namespace analog_drive_dsp
}  // namespace livemix
