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

class Curve {
 public:
  // soft, cubic and hard are the three weights; soft_pos and soft_neg the
  // soft kernel's steepness above and below zero (ceilings 1 / soft_pos and
  // 1 / soft_neg); the other two are ceilings.
  constexpr Curve(double soft, double soft_pos, double soft_neg, double cubic, double cubic_ceiling, double hard,
                  double hard_ceiling)
      : soft_(soft > 0.0),
        scale_{soft_pos / 1.5, soft_neg / 1.5},
        f_{soft / (2.0 * soft_pos), soft / (2.0 * soft_neg)},
        f1_{0.75 * soft / (soft_pos * soft_pos), 0.75 * soft / (soft_neg * soft_neg)},
        f2_{1.125 * soft / (soft_pos * soft_pos * soft_pos), 1.125 * soft / (soft_neg * soft_neg * soft_neg)},
        cubic_(cubic > 0.0),
        cubic_scale_(1.0 / (1.5 * cubic_ceiling)),
        cubic_f_(cubic * cubic_ceiling),
        cubic_f1_(cubic * cubic_ceiling * 1.5 * cubic_ceiling),
        cubic_f2_(cubic * cubic_ceiling * 2.25 * cubic_ceiling * cubic_ceiling),
        hard_(hard > 0.0),
        hard_weight_(hard),
        hard_ceiling_(hard_ceiling) {}

  // The curve.
  double f(double v) const {
    double y = 0.0;
    if (soft_) {
      const int side = v < 0.0;
      const double t = v * scale_[side];
      const double r2 = 1.0 + t * t;
      y += f_[side] * t * (3.0 + 2.0 * t * t) / (r2 * std::sqrt(r2));
    }
    if (cubic_) {
      const double t = v * cubic_scale_;
      const double a = std::fabs(t);
      y += cubic_f_ * (a < 1.0 ? t * (1.5 - 0.5 * t * t) : (t < 0.0 ? -1.0 : 1.0));
    }
    if (hard_) {
      y += hard_weight_ * (v > hard_ceiling_ ? hard_ceiling_ : (v < -hard_ceiling_ ? -hard_ceiling_ : v));
    }
    return y;
  }

  // Its integral from zero.
  double F1(double v) const {
    double y = 0.0;
    if (soft_) {
      const int side = v < 0.0;
      const double t = v * scale_[side];
      const double t2 = t * t;
      y += f1_[side] * ((1.0 + 2.0 * t2) / std::sqrt(1.0 + t2) - 1.0);
    }
    if (cubic_) {
      const double t = v * cubic_scale_;
      const double a = std::fabs(t);
      const double t2 = t * t;
      y += cubic_f1_ * (a < 1.0 ? t2 * (0.75 - 0.125 * t2) : a - 0.375);
    }
    if (hard_) {
      const double h = hard_ceiling_;
      const double a = std::fabs(v);
      y += hard_weight_ * (a < h ? 0.5 * v * v : h * (a - 0.5 * h));
    }
    return y;
  }

  // And the integral of that from zero. This is the one the anti-aliasing
  // works out for every sample, so it is kept to a square root and one
  // division.
  double F2(double v) const {
    double y = 0.0;
    if (soft_) {
      const int side = v < 0.0;
      const double t = v * scale_[side];
      // t (sqrt(1 + t^2) - 1) as t^3 / (sqrt(1 + t^2) + 1): nothing cancels
      // near zero.
      const double t2 = t * t;
      y += f2_[side] * t * t2 / (std::sqrt(1.0 + t2) + 1.0);
    }
    if (cubic_) {
      const double t = v * cubic_scale_;
      const double a = std::fabs(t);
      const double a2 = a * a;
      const double value = a < 1.0 ? a2 * a * (0.25 - 0.025 * a2) : 0.5 * a2 - 0.375 * a + 0.1;
      y += cubic_f2_ * (t < 0.0 ? -value : value);
    }
    if (hard_) {
      const double h = hard_ceiling_;
      const double a = std::fabs(v);
      const double value = a < h ? a * a * a * (1.0 / 6.0) : h * (0.5 * a * a - 0.5 * h * a + h * h * (1.0 / 6.0));
      y += hard_weight_ * (v < 0.0 ? -value : value);
    }
    return y;
  }

 private:
  // Soft kernel, per polarity (0 above zero, 1 below): t = v * scale, and
  // the factors in front of f, F1 and F2.
  bool soft_;
  double scale_[2];
  double f_[2];
  double f1_[2];
  double f2_[2];
  // Cubic kernel: t = v * scale, and the same three factors.
  bool cubic_;
  double cubic_scale_;
  double cubic_f_;
  double cubic_f1_;
  double cubic_f2_;
  bool hard_;
  double hard_weight_;
  double hard_ceiling_;
};

}  // namespace analog_drive_dsp
}  // namespace livemix
