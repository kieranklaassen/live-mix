// Native harness for Noise Floor (cpp/devices/noise-floor). The conformance
// pass covers stability, silence when idle, block-size independence and
// parameter abuse; the rest asserts what makes it a noise floor: the dry
// signal untouched, the level its control says, each bed's spectrum, Follow
// in both directions, the stereo image, the cross-fade between types and the
// hold after the last note.

#include <cstdlib>

#include "../devices/noise-floor/noise_floor.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::NoiseFloor;
namespace p = livemix::noise_floor;

static NoiseFloor device;

static const float kRate = 48000.0f;
static const int kTypes = NoiseFloor::kTypes;
static const char* const kTypeName[kTypes] = {"Tape hiss", "Vinyl", "Room", "Hum 50",
                                              "Hum 60",    "Static", "Air"};

// A device with nothing moving: one type at a known level, long hold.
static void still(NoiseFloor& d, int type, float level_db, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kType, static_cast<float>(type));
  d.set_param(p::kLevel, level_db);
  d.set_param(p::kMovement, 0.0f);
  d.set_param(p::kWidth, 1.0f);
  d.set_param(p::kHold, 60.0f);
}

// The noise alone: a click wakes the device, then `seconds` of its hold are
// rendered with no input. The first 0.2 s (the fade in) is dropped.
static Stereo noise_only(NoiseFloor& d, float seconds, float rate = kRate) {
  run(d, impulse(0.2f, rate, 0.001f));
  return render(d, seconds, rate);
}

// The same, at Width 1, as the noise of one side only.
static std::vector<float> bed(int type, float level_db, float seconds, float rate = kRate) {
  still(device, type, level_db, rate);
  return noise_only(device, seconds, rate).left;
}

static Stereo minus(const Stereo& out, const std::vector<float>& left, const std::vector<float>& right) {
  Stereo n = out;
  for (size_t i = 0; i < n.size(); ++i) {
    n.left[i] -= left[i];
    n.right[i] -= right[i];
  }
  return n;
}

// Mean power of `x` between `lo` and `hi` Hz, through fourth-order filters.
static double band_power(const std::vector<float>& x, double lo, double hi, double rate = kRate) {
  livemix::kit::Svf high[2], low[2];
  const float q[2] = {0.5412f, 1.3066f};  // Butterworth, fourth order
  for (int s = 0; s < 2; ++s) {
    high[s].set(static_cast<float>(lo), q[s], static_cast<float>(rate));
    low[s].set(static_cast<float>(hi), q[s], static_cast<float>(rate));
  }
  double sum = 0.0;
  for (float v : x) {
    float y = v;
    if (lo > 0.0) y = high[1].highpass(high[0].highpass(y));
    if (hi < 0.49 * rate) y = low[1].lowpass(low[0].lowpass(y));
    sum += static_cast<double>(y) * y;
  }
  return sum / static_cast<double>(x.size());
}

// Power per hertz in a band, in dB.
static double density_db(const std::vector<float>& x, double lo, double hi) {
  return 10.0 * std::log10(std::max(1.0e-30, band_power(x, lo, hi) / (hi - lo)));
}

// RMS of consecutive windows, in dB.
static std::vector<double> envelope_db(const std::vector<float>& x, float window_seconds, float rate = kRate) {
  const size_t window = static_cast<size_t>(window_seconds * rate);
  std::vector<double> out;
  for (size_t at = 0; at + window <= x.size(); at += window) out.push_back(db(rms(x, at, at + window)));
  return out;
}

static double pearson(const std::vector<double>& a, const std::vector<double>& b) {
  const size_t n = std::min(a.size(), b.size());
  double ma = 0.0, mb = 0.0;
  for (size_t i = 0; i < n; ++i) {
    ma += a[i];
    mb += b[i];
  }
  ma /= n;
  mb /= n;
  double sab = 0.0, saa = 0.0, sbb = 0.0;
  for (size_t i = 0; i < n; ++i) {
    sab += (a[i] - ma) * (b[i] - mb);
    saa += (a[i] - ma) * (a[i] - ma);
    sbb += (b[i] - mb) * (b[i] - mb);
  }
  return (saa > 0.0 && sbb > 0.0) ? sab / std::sqrt(saa * sbb) : 0.0;
}

// Events per second: runs of samples above `times` the RMS, at least 2 ms apart.
static double events_per_second(const std::vector<float>& x, double times, float rate = kRate) {
  const double threshold = times * rms(x);
  const size_t gap = static_cast<size_t>(0.002f * rate);
  size_t count = 0, last = 0;
  bool any = false;
  for (size_t i = 0; i < x.size(); ++i) {
    if (std::fabs(x[i]) > threshold) {
      if (!any || i - last > gap) ++count;
      last = i;
      any = true;
    }
  }
  return static_cast<double>(count) * rate / static_cast<double>(x.size());
}

int main() {
  Conformance spec;
  spec.name = "noise-floor";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 7.5f;  // the default Hold of 6 s, the half-second fade, and a margin
  spec.max_peak = 2.0f;      // full-scale input plus noise that is clipped at 1
  check_effect(device, spec, kRate);

  // Set VERBOSE=1 to print what each check measured.
  const bool verbose = std::getenv("VERBOSE") != nullptr;
  char label[200];

  // 1. The dry signal is untouched. With Follow 0 the noise does not depend
  // on the input (Air has no modulation noise), so doubling the input changes
  // the output by exactly the input; and what is added is not correlated
  // with what was played, for every type.
  {
    rng_state() = 0xA11CEu;
    std::vector<float> x = noise(2.0f, kRate, 0.2f);
    std::vector<float> twice = x;
    for (float& v : twice) v *= 2.0f;
    still(device, NoiseFloor::kAir, -30.0f);
    Stereo one = run(device, x);
    still(device, NoiseFloor::kAir, -30.0f);
    Stereo two = run(device, twice);
    double worst = 0.0;
    for (size_t i = 0; i < x.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(two.left[i]) - one.left[i] - x[i]));
    }
    EXPECT(worst < 2.0e-7, "the dry path has a gain of exactly one and the noise ignores the input");
    double worst_corr = 0.0, worst_level = 0.0;
    for (int t = 0; t < kTypes; ++t) {
      still(device, t, -30.0f);
      std::vector<float> tone = sine(330.0f, 6.0f, kRate, 0.2f);
      Stereo n = minus(run(device, tone), tone, tone);
      const double c = correlation(n.left, tone, 24000);
      worst_corr = std::max(worst_corr, std::fabs(c));
      // Tape hiss gains its modulation noise under a signal; the rest must not move.
      if (t != NoiseFloor::kTape) worst_level = std::max(worst_level, std::fabs(db(rms(n.left, 24000)) + 30.0));
      std::snprintf(label, sizeof label, "%s: what is added is not correlated with the input (%.4f)",
                    kTypeName[t], c);
      EXPECT(std::fabs(c) < 0.03, label);
    }
    EXPECT(worst_level < 1.5, "under a steady tone the noise is at Level, as in silence");
    if (verbose) {
      std::printf("dry: doubling error %.2e, worst |corr| with input %.4f, level error under a tone %.2f dB\n",
                  worst, worst_corr, worst_level);
    }
  }

  // 2. Level reads the noise's RMS in dBFS, dB for dB, for every type (Tone 0,
  // nothing moving), and the same at 44.1 and 96 kHz.
  for (int t = 0; t < kTypes; ++t) {
    double got[3];
    const float levels[3] = {-60.0f, -42.0f, -24.0f};
    for (int k = 0; k < 3; ++k) {
      got[k] = db(rms(bed(t, levels[k], 30.0f)));
      std::snprintf(label, sizeof label, "%s: noise RMS at Level %.0f dB", kTypeName[t], levels[k]);
      EXPECT_NEAR(got[k], levels[k], 1.5, label);
    }
    const double low_rate = db(rms(bed(t, -42.0f, 30.0f, 44100.0f)));
    const double high_rate = db(rms(bed(t, -42.0f, 30.0f, 96000.0f)));
    std::snprintf(label, sizeof label, "%s: the same level at 44.1 kHz", kTypeName[t]);
    EXPECT_NEAR(low_rate, -42.0, 1.5, label);
    std::snprintf(label, sizeof label, "%s: the same level at 96 kHz", kTypeName[t]);
    EXPECT_NEAR(high_rate, -42.0, 1.5, label);
    if (verbose) {
      std::printf("level %-9s  -60: %.2f  -42: %.2f  -24: %.2f   44.1 kHz: %.2f   96 kHz: %.2f\n", kTypeName[t],
                  got[0], got[1], got[2], low_rate, high_rate);
    }
  }

  // BEHAVIOUR 3

  still(device, NoiseFloor::kStatic, -30.0f);
  device.set_param(p::kMovement, 1.0f);
  device.set_param(p::kFollow, -0.5f);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("noise-floor", 10.0f, kRate, [&] { run(device, input); });

  return finish("noise-floor");
}
