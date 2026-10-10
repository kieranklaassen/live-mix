#pragma once

// A fractional read for a delay line whose read point never stands still and
// whose treble has to stay where it is: twelve taps of a Kaiser-windowed
// sinc, from a table of 128 fractions read with linear interpolation.
//
// A vibrato sweeps the fraction through every value hundreds of times a
// second. The four-point Hermite read of the kit loses up to 0.5 dB at 10 kHz
// and 2.5 dB at 15 kHz half way between two samples and nothing on a sample,
// so under a sweep the top octave flutters in level; this read is flat within
// a few hundredths of a dB to 15 kHz at any fraction (the harness measures
// the ripple on a 10 kHz tone). Each row is scaled to unit gain at DC.
//
//   line.write(x);
//   y = SincRead::read(line, whole, fraction);   // x[n - whole - fraction],
//                                                // whole >= SincRead::kLeast
//
// The kit has no such read yet (cpp/devices/vinyl carries one of its own).

#include "../../kit/delay.h"

namespace livemix {
namespace late_vibrato_detail {

class SincRead {
 public:
  static constexpr int kTaps = 12;
  static constexpr int kFractions = 128;
  // The newest tap lies five samples on the near side of the read point.
  static constexpr int kLeast = 5;

  static void init() {
    if (ready()) return;
    float* table = data();
    const double beta = 6.0;
    const double norm = bessel_i0(beta);
    for (int row = 0; row <= kFractions; ++row) {
      const double fraction = static_cast<double>(row) / kFractions;
      double taps[kTaps];
      double sum = 0.0;
      for (int k = 0; k < kTaps; ++k) {
        // Tap k sits (k - 5) samples further back than `whole`.
        const double x = static_cast<double>(k - (kTaps / 2 - 1)) - fraction;
        const double r = x / (kTaps / 2);
        const double window =
            r > -1.0 && r < 1.0 ? bessel_i0(beta * std::sqrt(1.0 - r * r)) / norm : 0.0;
        const double sinc = x > -1.0e-9 && x < 1.0e-9 ? 1.0 : std::sin(kPiD * x) / (kPiD * x);
        taps[k] = sinc * window;
        sum += taps[k];
      }
      for (int k = 0; k < kTaps; ++k) table[row * kTaps + k] = static_cast<float>(taps[k] / sum);
    }
    ready() = true;
  }

  // `whole` + `fraction` samples back from the sample just written;
  // whole >= kLeast, fraction in [0, 1).
  template <int Size>
  static float read(const kit::DelayLine<Size>& line, int whole, float fraction) {
    const float position = fraction * kFractions;
    const int row = static_cast<int>(position);
    const float blend = position - static_cast<float>(row);
    const float* a = data() + row * kTaps;
    const float* b = a + kTaps;
    // line.read(1) is the newest sample, so `whole` back is read(whole + 1).
    const int first = whole + 1 - (kTaps / 2 - 1);
    float sum = 0.0f;
    for (int k = 0; k < kTaps; ++k) {
      sum += (a[k] + (b[k] - a[k]) * blend) * line.read(first + k);
    }
    return sum;
  }

 private:
  static constexpr double kPiD = 3.14159265358979323846;

  static double bessel_i0(double x) {
    double sum = 1.0;
    double term = 1.0;
    for (int k = 1; k < 32; ++k) {
      term *= (x / (2.0 * k)) * (x / (2.0 * k));
      sum += term;
    }
    return sum;
  }

  static float* data() {
    static float table[(kFractions + 1) * kTaps];
    return table;
  }
  static bool& ready() {
    static bool is_ready = false;
    return is_ready;
  }
};

}  // namespace late_vibrato_detail
}  // namespace livemix
