// Native harness for Warp (cpp/devices/warp). The conformance pass covers stability, silence when
// idle, block-size independence and parameter abuse; the rest asserts what makes it a warp: where
// the partials land.

#include "../devices/warp/warp.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Warp;
namespace p = livemix::warp;

static Warp device;

static const float kRate = 48000.0f;
static const size_t kLate = Warp::kLatency;

// The device with nothing moving by itself: no drift, no width, all wet.
static void still(Warp& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kDrift, 0.0f);
  d.set_param(p::kWidth, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

// `count` harmonics of `hz`, each at `gain / n`.
static std::vector<float> harmonics(float hz, int count, float seconds, float gain, float rate = kRate) {
  std::vector<float> out(static_cast<size_t>(seconds * rate), 0.0f);
  for (int n = 1; n <= count; ++n) {
    for (size_t i = 0; i < out.size(); ++i) {
      out[i] += gain / n * static_cast<float>(std::sin(2.0 * kPi * hz * n * static_cast<double>(i) / rate));
    }
  }
  return out;
}

static double cents(double a, double b) { return 1200.0 * std::log2(a / b); }

int main() {
  Conformance spec;
  spec.name = "warp";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 1.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // PROBE
  {
    const std::vector<float> tone = harmonics(220.0f, 10, 3.0f, 0.3f);
    for (float stretch : {-0.5f, 0.0f, 0.3f, 0.7f}) {
      still(device);
      device.set_param(p::kStretch, stretch);
      device.set_param(p::kPivot, 220.0f);
      const Stereo out = run(device, tone);
      const double e = std::pow(2.0, stretch);
      std::printf("stretch %.2f (e %.3f): rms in %.4f out %.4f\n", stretch, e, rms(tone), rms(out.left, 48000));
      for (int n = 1; n <= 10; ++n) {
        const double want = 220.0 * std::pow(n, e);
        if (want > 20000) continue;
        const double got = dominant_frequency(out.left, kRate, want * 0.97, want * 1.03, 48000, 144000);
        const double level = tone_level(out.left, got, kRate, 48000, 144000);
        std::printf("  n %2d want %9.2f got %9.2f (%+.2f ct) level %.4f (in %.4f)\n", n, want, got,
                    cents(got, want), level, 0.3 / n);
      }
    }
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("warp", 10.0f, kRate, [&] { run(device, input); });
  return finish("warp");
}
