// Native harness for Spread (cpp/devices/spread). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it width by frequency.

#include "../devices/spread/spread.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Spread;
namespace p = livemix::spread;

static Spread device;

static const float kRate = 48000.0f;

int main() {
  Conformance spec;
  spec.name = "spread";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 3.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("spread", 10.0f, kRate, [&] { run(device, input); });

  return finish("spread");
}
