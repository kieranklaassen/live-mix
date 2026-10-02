// Native harness for Analog Delay (cpp/devices/analog-delay). The conformance
// pass covers stability, silence when idle, block-size independence and
// parameter abuse; the rest asserts what makes it a bucket-brigade delay.

#include "../devices/analog-delay/analog_delay.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::AnalogDelay;
namespace p = livemix::analog_delay;

static AnalogDelay device;

static const float kRate = 48000.0f;

int main() {
  Conformance spec;
  spec.name = "analog-delay";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 16.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("analog-delay", 10.0f, kRate, [&] { run(device, input); });

  return finish("analog-delay");
}
