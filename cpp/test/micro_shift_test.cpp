// Native harness for Micro Shift (cpp/devices/micro-shift).

#include "../devices/micro-shift/micro_shift.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::MicroShift;
namespace p = livemix::micro_shift;

static MicroShift device;

static const float kRate = 48000.0f;

int main() {
  Conformance spec;
  spec.name = "micro-shift";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 2.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("micro-shift", 10.0f, kRate, [&] { run(device, input); });

  return finish("micro-shift");
}
