#pragma once

#include "curve.h"

// Second-order antiderivative anti-aliasing (Parker, Zavalishin and Le Bivic,
// "Reducing the aliasing of nonlinear waveshaping using continuous-time
// convolution", DAFx 2016; the second-order form and its fallbacks are from
// Bilbao, Esqueda, Parker and Välimäki, "Antiderivative antialiasing for
// memoryless nonlinearities", IEEE SPL 2017). Instead of f(x[n]) the output
// is f convolved with a triangle two samples wide, worked out exactly from
// the curve's second antiderivative: the triangle is a continuous-time
// low-pass on what the curve makes, so far less of it is left above Nyquist
// to fold back. On top of 4x oversampling it takes a squared-off 5 kHz tone's
// aliasing from -29 dB (plain) to -71 dB.
//
// For a straight line the result is the mean of three inputs, one sample
// late: that droop (1.5 dB at 20 kHz at four times 44.1 kHz) is what
// Compensator lifts back.
//
// The divided differences lose their precision when successive inputs are
// close, so each has a fallback that evaluates the curve at a midpoint; the
// tolerance grows with the input, because so does F2 (as v^2).

namespace livemix {
namespace analog_drive_dsp {

class Adaa2 {
 public:
  // Rest on `x`: the next outputs are the curve at x until the input moves.
  void reset(const Curve& curve, double x) {
    x1_ = x;
    x2_ = x;
    f2_1_ = curve.F2(x);
    f2_2_ = f2_1_;
  }

  double process(const Curve& curve, double x) {
    const double f2 = curve.F2(x);
    const double size = magnitude(x) + magnitude(x1_);
    const double tolerance = kTolerance * (size > 1.0 ? size : 1.0);
    const double step = x - x1_;
    const double last_step = x1_ - x2_;
    const double span = x - x2_;

    double y;
    if (magnitude(step) > tolerance && magnitude(last_step) > tolerance && magnitude(span) > tolerance) {
      // The usual case: the second divided difference of F2 over the last
      // three inputs, 2 (D[n] - D[n-1]) / (x[n] - x[n-2]), as one division.
      y = 2.0 * ((f2 - f2_1_) * last_step - (f2_1_ - f2_2_) * step) / (step * last_step * span);
    } else {
      const double d = magnitude(step) > tolerance ? (f2 - f2_1_) / step : curve.F1(0.5 * (x + x1_));
      if (magnitude(span) > tolerance) {
        const double last_d =
            magnitude(last_step) > tolerance ? (f2_1_ - f2_2_) / last_step : curve.F1(0.5 * (x1_ + x2_));
        y = 2.0 * (d - last_d) / span;
      } else {
        // x[n] and x[n-2] nearly meet (the top of a wave): integrate from
        // their mean to x[n-1] instead.
        const double mean = 0.5 * (x + x2_);
        const double delta = mean - x1_;
        if (magnitude(delta) > tolerance) {
          y = (2.0 / delta) * (curve.F1(mean) + (f2_1_ - curve.F2(mean)) / delta);
        } else {
          y = curve.f(0.5 * (mean + x1_));
        }
      }
    }
    x2_ = x1_;
    x1_ = x;
    f2_2_ = f2_1_;
    f2_1_ = f2;
    return y;
  }

 private:
  static constexpr double kTolerance = 2.0e-5;

  static double magnitude(double v) { return std::fabs(v); }

  double x1_ = 0.0;
  double x2_ = 0.0;
  double f2_1_ = 0.0;   // F2 at x1 and x2
  double f2_2_ = 0.0;
};

// Three taps at the curve's rate, (-1/3, 5/3, -1/3), one sample late: the
// inverse of the three-point mean to second order, which leaves the pair
// 0.2 dB down at 20 kHz instead of 1.5.
struct Compensator {
  float z1 = 0.0f;
  float z2 = 0.0f;

  void reset() {
    z1 = 0.0f;
    z2 = 0.0f;
  }
  float process(float x) {
    const float y = (5.0f / 3.0f) * z1 - (1.0f / 3.0f) * (x + z2);
    z2 = z1;
    z1 = x;
    return y;
  }
};

}  // namespace analog_drive_dsp
}  // namespace livemix
