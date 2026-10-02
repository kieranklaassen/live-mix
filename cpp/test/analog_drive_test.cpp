// Native harness for Analog Drive (cpp/devices/analog-drive). The conformance
// pass covers stability, silence when idle, block-size independence and
// parameter abuse; the rest asserts what makes it five circuits.

#include <complex>

#include "../devices/analog-drive/analog_drive.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::AnalogDrive;
namespace p = livemix::analog_drive;

static AnalogDrive device;

static const float kRate = 48000.0f;
static const int kLatency = AnalogDrive::kLatency;

int main() {
  Conformance spec;
  spec.name = "analog-drive";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 1.0f;
  spec.max_peak = 8.0f;
  check_effect(device, spec, kRate);

  // CHECKS

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("analog-drive", 10.0f, kRate, [&] { run(device, input); });

  return finish("analog-drive");
}
