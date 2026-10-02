// Native harness for West Coast (cpp/devices/west-coast).

#include <complex>
#include <cstdlib>

#include "../devices/west-coast/west_coast.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::WestCoast;
namespace p = livemix::west_coast;

static WestCoast device;

static const float kRate = 48000.0f;

// --- measuring ----------------------------------------------------------------------------

static void fft(std::vector<std::complex<double>>& a) {
  const size_t n = a.size();
  for (size_t i = 1, j = 0; i < n; ++i) {
    size_t bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) std::swap(a[i], a[j]);
  }
  for (size_t len = 2; len <= n; len <<= 1) {
    const double angle = -2.0 * kPi / static_cast<double>(len);
    const std::complex<double> turn(std::cos(angle), std::sin(angle));
    for (size_t i = 0; i < n; i += len) {
      std::complex<double> w(1.0, 0.0);
      for (size_t k = 0; k < len / 2; ++k) {
        const std::complex<double> u = a[i + k], v = a[i + k + len / 2] * w;
        a[i + k] = u + v;
        a[i + k + len / 2] = u - v;
        w *= turn;
      }
    }
  }
}

// Magnitude spectrum of x[from, from + n), n a power of two, through a
// four-term Blackman-Harris window (side lobes below -92 dB): a sine of
// amplitude 1 on a bin reads 1.
struct Spectrum {
  std::vector<double> bins;
  double bin_hz = 1.0;

  Spectrum(const std::vector<float>& x, size_t from, size_t n, double rate) : bins(n / 2), bin_hz(rate / n) {
    std::vector<std::complex<double>> a(n);
    double window_sum = 0.0;
    for (size_t i = 0; i < n; ++i) {
      const double t = 2.0 * kPi * static_cast<double>(i) / static_cast<double>(n);
      const double w = 0.35875 - 0.48829 * std::cos(t) + 0.14128 * std::cos(2.0 * t) - 0.01168 * std::cos(3.0 * t);
      window_sum += w;
      a[i] = (from + i < x.size() ? x[from + i] : 0.0f) * w;
    }
    fft(a);
    for (size_t i = 0; i < n / 2; ++i) bins[i] = 2.0 * std::abs(a[i]) / window_sum;
  }

  // The strongest bin within `guard` bins of `hz`.
  double at(double hz, int guard = 4) const {
    const long centre = std::lround(hz / bin_hz);
    double best = 0.0;
    for (long i = centre - guard; i <= centre + guard; ++i) {
      if (i >= 0 && i < static_cast<long>(bins.size())) best = std::max(best, bins[static_cast<size_t>(i)]);
    }
    return best;
  }

  // Energy-weighted mean frequency.
  double centroid() const {
    double weighted = 0.0, total = 0.0;
    for (size_t i = 1; i < bins.size(); ++i) {
      weighted += static_cast<double>(i) * bins[i] * bins[i];
      total += bins[i] * bins[i];
    }
    return total > 0.0 ? weighted / total * bin_hz : 0.0;
  }

  // The strongest component between 30 Hz and `top` that is not within
  // `guard` bins of a harmonic of `f0`.
  double worst_inharmonic(double f0, double top, int guard = 8) const {
    double worst = 0.0;
    for (size_t i = 0; i < bins.size(); ++i) {
      const double hz = static_cast<double>(i) * bin_hz;
      if (hz < 30.0 + guard * bin_hz || hz > top) continue;
      const double k = std::round(hz / f0);
      if (k >= 1.0 && std::fabs(hz - k * f0) <= guard * bin_hz) continue;
      worst = std::max(worst, bins[i]);
    }
    return worst;
  }
};

// A held, fully open, unvarying voice: what the oscillator and the folder
// do, without the gate, chance or drift.
static void steady(float rate) {
  device.init(rate);
  device.set_param(p::kSustain, 1.0f);
  device.set_param(p::kColour, 1.0f);
  device.set_param(p::kChance, 0.0f);
  device.set_param(p::kDrift, 0.0f);
  device.set_param(p::kFm, 0.0f);
  device.set_param(p::kTimbreEnv, 0.0f);
  device.set_param(p::kSymmetry, 0.0f);
}

// The default patch with nothing random in it.
static void plain(float rate) {
  device.init(rate);
  device.set_param(p::kChance, 0.0f);
  device.set_param(p::kDrift, 0.0f);
}

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

// Seconds from the loudest 20 ms of `x` until its level is `drop` dB lower.
static double fall_time(const std::vector<float>& x, double rate, double drop) {
  const size_t window = static_cast<size_t>(0.02 * rate), hop = static_cast<size_t>(0.005 * rate);
  std::vector<double> level;
  for (size_t from = 0; from + window <= x.size(); from += hop) level.push_back(db(rms(x, from, from + window)));
  size_t top = 0;
  for (size_t i = 0; i < level.size(); ++i) {
    if (level[i] > level[top]) top = i;
  }
  for (size_t i = top; i < level.size(); ++i) {
    if (level[i] < level[top] - drop) return static_cast<double>(i - top) * 0.005;
  }
  return -1.0;
}

// --- behaviour ----------------------------------------------------------------------------

// Measured numbers, printed when VERBOSE is set in the environment.
static const bool kVerbose = std::getenv("VERBOSE") != nullptr;
#define NOTE(...)                        \
  do {                                   \
    if (kVerbose) std::printf(__VA_ARGS__); \
  } while (0)

// The note sounds at the pitch asked for, from the bottom of a bass to the
// top of a whistle, with and without FM (at a whole-number ratio the
// sidebands land on harmonics and the pitch must not move).
static void check_tuning() {
  for (float fm : {0.0f, 0.5f}) {
    for (float hz : {55.0f, 110.0f, 220.0f, 440.0f, 880.0f, 1760.0f}) {
      steady(kRate);
      device.set_param(p::kFold, 0.35f);
      device.set_param(p::kFm, fm);
      device.note_on(1, hz, 0.8f);
      const Stereo out = render(device, 2.0f, kRate);
      const double found = dominant_frequency(out.left, kRate, hz * 0.94, hz * 1.06, 24000, 96000);
      NOTE("tuning: %6.0f Hz fm %.1f -> %8.2f Hz (%+.2f cents)\n", hz, fm, found, cents(found, hz));
      EXPECT_NEAR(cents(found, hz), 0.0, 3.0, "a note is in tune within 3 cents");
    }
  }
  // The default patch drifts, but stays within the same 3 cents.
  device.init(kRate);
  device.set_param(p::kSustain, 1.0f);
  device.note_on(1, 440.0f, 0.8f);
  const Stereo out = render(device, 2.0f, kRate);
  const double found = dominant_frequency(out.left, kRate, 415.0, 466.0, 24000, 96000);
  NOTE("tuning: default patch 440 Hz -> %.2f Hz (%+.2f cents)\n", found, cents(found, 440.0));
  EXPECT_NEAR(cents(found, 440.0), 0.0, 3.0, "the default drift keeps a note within 3 cents");
}

// CHECKS

int main() {
  Conformance spec;
  spec.name = "west-coast";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 6.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  check_tuning();
  // BEHAVIOUR

  // Cost with every voice sounding at the heaviest setting: eight held
  // notes, full fold with the timbre envelope and symmetry, deep FM.
  device.init(kRate);
  device.set_param(p::kSustain, 1.0f);
  device.set_param(p::kFold, 1.0f);
  device.set_param(p::kSymmetry, 1.0f);
  device.set_param(p::kFm, 1.0f);
  device.set_param(p::kTimbreEnv, 1.0f);
  device.set_param(p::kChance, 1.0f);
  device.set_param(p::kDrift, 1.0f);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
  report_cost("west-coast (8 held notes, full fold and FM)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("west-coast");
}
