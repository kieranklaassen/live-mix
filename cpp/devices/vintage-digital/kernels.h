#pragma once

// The two tables Vintage Digital's converter runs on, both cut from one
// Kaiser-windowed sinc h(t) (32 host samples long, cut off at 0.46 of the host
// rate, beta 8: flat to 0.38, 80 dB down from 0.54):
//
// - kSinc: h itself, to read the input between its samples when the converter
//   clock ticks (band-limited interpolation, Smith & Gossett, "A flexible
//   sampling-rate conversion method", ICASSP 1984).
// - kStep: the running integral of h minus a bare step: what has to be added
//   around a sudden change of the held value so that the stair the converter
//   puts out is band-limited to the host rate (Brandt, "Hard sync without
//   aliasing", ICMC 2001: the band-limited step, here in its linear-phase
//   form). The images of the hold below the host's Nyquist stay; the ones
//   above it are removed instead of folding back.
//
// Both are stored at 64 positions between two samples (plus the end point)
// and read with linear interpolation between neighbouring positions.

#include <cmath>

namespace livemix {
namespace vintage_digital_detail {

class Kernels {
 public:
  static constexpr int kTaps = 32;
  static constexpr int kHalf = 16;
  static constexpr int kPhases = 64;

  static void init() {
    if (ready()) return;
    // h on a fine grid: kFine points per sample over [-kHalf, kHalf].
    static double fine[kTaps * kFine + 1];
    double area = 0.0;
    for (int i = 0; i <= kTaps * kFine; ++i) {
      fine[i] = prototype(static_cast<double>(i) / kFine - kHalf);
      area += fine[i];
    }
    area /= kFine;
    // The running integral (trapezoid), normalised to end on exactly 1.
    static double integral[kTaps * kFine + 1];
    integral[0] = 0.0;
    for (int i = 1; i <= kTaps * kFine; ++i) {
      integral[i] = integral[i - 1] + 0.5 * (fine[i] + fine[i - 1]) / (kFine * area);
    }
    const double total = integral[kTaps * kFine];
    const int stride = kFine / kPhases;
    for (int p = 0; p <= kPhases; ++p) {
      // Reading at t = n - kHalf - p/kPhases with taps on x[n - 1 - k].
      double sum = 0.0;
      double row[kTaps];
      for (int k = 0; k < kTaps; ++k) {
        // h(k + 1 - kHalf - d), d = p / kPhases: index (k + 1) * kFine - p * stride.
        row[k] = fine[(k + 1) * kFine - p * stride];
        sum += row[k];
      }
      for (int k = 0; k < kTaps; ++k) sinc()[p][k] = static_cast<float>(row[k] / sum);
      // The step landed d before sample n; output index n + k is at
      // t = k - kHalf + d on the (delayed) step's own clock.
      for (int k = 0; k < kTaps; ++k) {
        const double band_limited = integral[k * kFine + p * stride] / total;
        step()[p][k] = static_cast<float>(band_limited - (k >= kHalf ? 1.0 : 0.0));
      }
    }
    ready() = true;
  }

  // Weights for a read `fraction` (0..1) of a sample before the newest tap.
  static void sinc_weights(float fraction, float* out) { blend(sinc(), fraction, out); }
  // What to add to the next kTaps outputs for a unit step that happened
  // `fraction` (0..1) of a sample before the current one.
  static void step_weights(float fraction, float* out) { blend(step(), fraction, out); }

 private:
  static constexpr int kFine = 512;
  static constexpr double kCutoff = 0.46;
  static constexpr double kBeta = 8.0;

  typedef float Table[kPhases + 1][kTaps];

  static void blend(const Table& table, float fraction, float* out) {
    float position = fraction * kPhases;
    if (position < 0.0f) position = 0.0f;
    int index = static_cast<int>(position);
    if (index > kPhases - 1) index = kPhases - 1;
    const float t = position - static_cast<float>(index);
    const float* a = table[index];
    const float* b = table[index + 1];
    for (int k = 0; k < kTaps; ++k) out[k] = a[k] + (b[k] - a[k]) * t;
  }

  static double bessel_i0(double x) {
    double sum = 1.0, term = 1.0;
    for (int k = 1; k < 40; ++k) {
      term *= (x / (2.0 * k)) * (x / (2.0 * k));
      sum += term;
    }
    return sum;
  }

  static double prototype(double t) {
    const double r = t / kHalf;
    if (r <= -1.0 || r >= 1.0) return 0.0;
    const double pi = 3.14159265358979323846;
    const double x = 2.0 * kCutoff * pi * t;
    const double ideal = (x > -1.0e-9 && x < 1.0e-9) ? 1.0 : std::sin(x) / x;
    return 2.0 * kCutoff * ideal * bessel_i0(kBeta * std::sqrt(1.0 - r * r)) / bessel_i0(kBeta);
  }

  static Table& sinc() {
    static Table table;
    return table;
  }
  static Table& step() {
    static Table table;
    return table;
  }
  static bool& ready() {
    static bool is_ready = false;
    return is_ready;
  }
};

}  // namespace vintage_digital_detail
}  // namespace livemix
