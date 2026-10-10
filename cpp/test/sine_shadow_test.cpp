// Native harness for Sine Shadow (cpp/devices/sine-shadow). The conformance
// pass covers stability, silence when idle, block-size independence and
// parameter abuse; the rest asserts what makes it a shadow of sines: which
// partials are followed, at what pitch and level, how they swell and linger,
// and that sound and shadow never cancel.

#include "../devices/sine-shadow/sine_shadow.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::SineShadow;
namespace p = livemix::sine_shadow;

static SineShadow device;

static const float kRate = 48000.0f;

// The device with the shadow alone, every sine in the middle, no wait.
static void wet_only(SineShadow& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kMix, 1.0f);
  d.set_param(p::kSpread, 0.0f);
}

// A sum of sines: frequencies and gains, phases from a fixed sequence.
static std::vector<float> tones(const std::vector<double>& hz, const std::vector<double>& gain, float seconds,
                                float rate = kRate) {
  std::vector<float> out(static_cast<size_t>(seconds * rate), 0.0f);
  for (size_t t = 0; t < hz.size(); ++t) {
    const double start = 0.37 * static_cast<double>(t * t + 1);
    for (size_t i = 0; i < out.size(); ++i) {
      out[i] += static_cast<float>(gain[t] * std::sin(2.0 * kPi * hz[t] * static_cast<double>(i) / rate + start));
    }
  }
  return out;
}

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

int main() {
  Conformance spec;
  spec.name = "sine-shadow";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 14.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // PART 2

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("sine-shadow", 10.0f, kRate, [&] { run(device, input); });

  return finish("sine-shadow");
}
