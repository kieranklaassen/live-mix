#pragma once

// A fractional read for a delay line whose read point moves all the time
// and whose treble matters: twelve taps of a Kaiser-windowed sinc, from a
// table of 128 phases read with linear interpolation.
//
// At 44.1 kHz it is flat within 0.05 dB to 15 kHz and 0.5 dB down at 18 kHz
// whatever the fraction, where the four-point Hermite read loses 1.6 dB at
// 15 kHz on average and ripples by 3.5 dB as the fraction moves: on a read
// point that travels a hundred samples a second that ripple is a flutter in
// the top octave. Each row is scaled to unit gain at DC.
//
//   y = SincRead::read(line, delay);   // x[n - delay] after line.write(x[n]),
//                                      // delay >= SincRead::kMinDelay

#include "../../kit/delay.h"

namespace livemix {
namespace vinyl_detail {

class SincRead {
 public:
  static constexpr int kTaps = 12;
  static constexpr int kPhases = 128;
  // The newest tap is five samples ahead of the read point.
  static constexpr int kMinDelay = 5;

  static void init() {
    if (ready()) return;
    float* table = data();
    const double beta = 5.0;
    const double i0_beta = bessel_i0(beta);
    for (int phase = 0; phase <= kPhases; ++phase) {
      const double fraction = static_cast<double>(phase) / kPhases;
      double row[kTaps];
      double sum = 0.0;
      for (int k = 0; k < kTaps; ++k) {
        const double x = static_cast<double>(k - (kTaps / 2 - 1)) - fraction;
        const double r = x / (kTaps / 2);
        const double window = r > -1.0 && r < 1.0 ? bessel_i0(beta * std::sqrt(1.0 - r * r)) / i0_beta : 0.0;
        const double sinc = x > -1.0e-9 && x < 1.0e-9 ? 1.0 : std::sin(kPiD * x) / (kPiD * x);
        row[k] = sinc * window;
        sum += row[k];
      }
      for (int k = 0; k < kTaps; ++k) table[phase * kTaps + k] = static_cast<float>(row[k] / sum);
    }
    ready() = true;
  }

  // `whole` + `fraction` samples back from the sample just written;
  // whole >= kMinDelay, fraction in [0, 1).
  template <int Size>
  static float read(const kit::DelayLine<Size>& line, int whole, float fraction) {
    const float position = fraction * kPhases;
    const int phase = static_cast<int>(position);
    const float blend = position - static_cast<float>(phase);
    const float* a = data() + phase * kTaps;
    const float* b = a + kTaps;
    // Tap k is the sample whole - 5 + k back; read(1) is the newest.
    const int first = whole - (kTaps / 2 - 1) + 1;
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
    static float table[(kPhases + 1) * kTaps];
    return table;
  }
  static bool& ready() {
    static bool is_ready = false;
    return is_ready;
  }
};

}  // namespace vinyl_detail
}  // namespace livemix
