// Native harness for Cascade (cpp/devices/cascade). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest asserts what makes it a cascade of loops.

#include "../devices/cascade/cascade.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Cascade;
namespace p = livemix::cascade;

static Cascade device;

static const float kRate = 48000.0f;

// CASCADE-TEST-HELPERS

int main() {
  Conformance spec;
  spec.name = "cascade";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 6.0f;
  spec.max_peak = 3.0f;
  check_effect(device, spec, kRate);

  // CASCADE-TEST-CHECKS

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("cascade", 10.0f, kRate, [&] { run(device, input); });

  return finish("cascade");
}
