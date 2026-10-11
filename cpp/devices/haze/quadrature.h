#pragma once

#include <cmath>

// A pair of all-pass chains whose outputs stand a quarter turn apart: what
// Haze turns its wall by. The same network as kit::Hilbert (second-order
// sections in z², the first chain a sample late), but with its sections
// worked out for the sample rate, so the quarter turn holds from kLowHz up at
// 44.1, 48 and 96 kHz alike. kit::Hilbert's fixed sections hold it from 0.002
// of the rate, which is 96 Hz at 48 kHz and 192 Hz at 96 kHz: a bass note
// turned there would change level with the angle.
//
// The sections are those of an elliptic half-band low-pass made of two
// all-pass branches (the closed form for its poles, as a series in the nome
// of the transition width), moved a quarter of the rate up the band: the two
// branches then pass everything and differ by a quarter turn where the
// low-pass passed or stopped. Four sections a chain keep the pair within two
// degrees of the quarter turn from 20 Hz to the same distance under half the
// rate (measured: 1.0 degree at 44.1 and 48 kHz, 1.6 at 96 kHz; the device's
// harness holds it).

namespace livemix {
namespace haze_dsp {

class Quadrature {
 public:
  static constexpr int kSections = 4;  // a chain
  static constexpr double kLowHz = 20.0;

  void init(float sample_rate) {
    // The half-band's transition, as a share of the rate: kLowHz either side
    // of a quarter of it.
    const double transition = 2.0 * kLowHz / static_cast<double>(sample_rate);
    double k = std::tan((1.0 - transition * 2.0) * kPi / 4.0);
    k *= k;
    const double root = std::pow(1.0 - k * k, 0.25);
    const double e = 0.5 * (1.0 - root) / (1.0 + root);
    const double e4 = e * e * e * e;
    const double q = e * (1.0 + e4 * (2.0 + e4 * (15.0 + 150.0 * e4)));
    const int order = 4 * kSections + 1;
    for (int index = 0; index < 2 * kSections; ++index) {
      const int c = index + 1;
      double num = 0.0;
      for (int i = 0, sign = 1; i < 24; ++i, sign = -sign) {
        const double term = std::pow(q, static_cast<double>(i * (i + 1))) * std::sin((2 * i + 1) * c * kPi / order);
        num += sign * term;
        if (std::fabs(term) < 1.0e-30) break;
      }
      num *= std::pow(q, 0.25);
      double den = 0.5;
      for (int i = 1, sign = -1; i < 24; ++i, sign = -sign) {
        const double term = std::pow(q, static_cast<double>(i * i)) * std::cos(2 * i * c * kPi / order);
        den += sign * term;
        if (std::fabs(term) < 1.0e-30) break;
      }
      const double ww = (num / den) * (num / den);
      const double x = std::sqrt((1.0 - ww * k) * (1.0 - ww / k)) / (1.0 + ww);
      const float coeff = static_cast<float>((1.0 - x) / (1.0 + x));
      // In rising order they go to the two chains by turns; the chain that
      // takes the second of each pair is the one a sample late.
      if (index & 1) {
        late_[index >> 1].c = coeff;
      } else {
        early_[index >> 1].c = coeff;
      }
    }
    reset();
  }

  void reset() {
    for (Section& section : late_) section.clear();
    for (Section& section : early_) section.clear();
    delayed_ = 0.0f;
  }

  // The pair for `x`: `same` and `quarter` are `x` with its phase moved by
  // the same amount at every pitch, a quarter turn apart.
  void process(float x, float* same, float* quarter) {
    float a = x;
    for (Section& section : late_) a = section.process(a);
    float b = x;
    for (Section& section : early_) b = section.process(b);
    *same = delayed_;
    delayed_ = a;
    *quarter = b;
  }

 private:
  static constexpr double kPi = 3.14159265358979323846;

  struct Section {
    float c = 0.0f;
    float x1 = 0.0f, x2 = 0.0f, y1 = 0.0f, y2 = 0.0f;
    void clear() { x1 = x2 = y1 = y2 = 0.0f; }
    // y[n] = c (x[n] + y[n-2]) - x[n-2]
    float process(float x) {
      float y = c * (x + y2) - x2;
      if (y > -1.0e-20f && y < 1.0e-20f) y = 0.0f;
      x2 = x1;
      x1 = x;
      y2 = y1;
      y1 = y;
      return y;
    }
  };

  Section late_[kSections];
  Section early_[kSections];
  float delayed_ = 0.0f;
};

}  // namespace haze_dsp
}  // namespace livemix
