#pragma once

// What the harness of Undervoice measures with: one line of a spectrum, the
// strongest line near a guess, loudness over time, what it beats at, and how
// sharp a click is.

#include "support/test_kit.h"

namespace undervoice_measure {
using namespace testkit;

constexpr float kRate = 48000.0f;

// Level of the `hz` component over n samples from `from`: a Hann-windowed DFT
// bin by a rotating phasor (no trig per sample).
inline double bin(const std::vector<float>& x, double hz, size_t from, size_t n, double rate = kRate) {
  const double w = 2.0 * kPi * hz / rate, ww = 2.0 * kPi / static_cast<double>(n);
  const double cr = std::cos(w), ci = std::sin(w), wr = std::cos(ww), wi = std::sin(ww);
  double pr = 1.0, pi = 0.0, hr = 1.0, hi = 0.0, re = 0.0, im = 0.0, sum = 0.0;
  for (size_t i = 0; i < n && from + i < x.size(); ++i) {
    const double window = 0.5 - 0.5 * hr, turned = pr * cr - pi * ci, waned = hr * wr - hi * wi;
    re += window * x[from + i] * pr, im -= window * x[from + i] * pi, sum += window;
    pi = pr * ci + pi * cr, pr = turned;
    hi = hr * wi + hi * wr, hr = waned;
  }
  return 2.0 * std::sqrt(re * re + im * im) / sum;
}

// The strongest component within `reach` (a share) of `guess`.
inline double pitch(const std::vector<float>& x, double guess, size_t from, size_t n, double reach = 0.012, double rate = kRate) {
  double best = guess, most = -1.0, span = guess * reach;
  for (int pass = 0; pass < 4; ++pass) {
    const double centre = best;
    for (int i = -8; i <= 8; ++i) {
      const double hz = centre + span * i / 8.0, level = bin(x, hz, from, n, rate);
      if (level > most) most = level, best = hz;
    }
    span *= 0.2;
  }
  return best;
}

// Loudness in windows of `hop` samples.
inline std::vector<float> envelope(const std::vector<float>& x, size_t from, size_t hop) {
  std::vector<float> e;
  for (size_t i = from; i + hop <= x.size(); i += hop) e.push_back(static_cast<float>(rms(x, i, i + hop)));
  return e;
}

// The rate the loudness beats at, between lo and hi.
inline double beat(const std::vector<float>& x, size_t from, double lo, double hi) {
  std::vector<float> e = envelope(x, from, 96);
  const float middle = static_cast<float>(mean(e));
  for (float& v : e) v -= middle;
  double best = 0.0, most = -1.0;
  for (double hz = lo; hz <= hi; hz += 0.01) {
    const double level = bin(e, hz, 0, e.size(), kRate / 96.0);
    if (level > most) most = level, best = hz;
  }
  return best;
}

// How strong a 1 ms stretch of sound above about 9 kHz gets: what a click is.
inline double tick(const std::vector<float>& x, size_t from, size_t to) {
  double worst = 0.0, sum = 0.0;
  for (size_t i = from + 3, n = 0; i < to && i < x.size(); ++i) {
    const double d = x[i] - 3.0f * x[i - 1] + 3.0f * x[i - 2] - x[i - 3];
    sum += d * d;
    if (++n % 48 != 0) continue;
    worst = std::max(worst, std::sqrt(sum / 48.0));
    sum = 0.0;
  }
  return worst;
}

}  // namespace undervoice_measure
