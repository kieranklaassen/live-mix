// Native harness for Pitch Shifter (cpp/devices/pitch-shifter). The
// conformance pass covers stability, silence when idle, block-size
// independence and parameter abuse; the rest asserts what makes it a pitch
// shifter.

#include "../devices/pitch-shifter/pitch_shifter.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::PitchShifter;
namespace p = livemix::pitch_shifter;

static PitchShifter device;

static const float kRate = 48000.0f;

int main() {
  Conformance spec;
  spec.name = "pitch-shifter";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 6.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("pitch-shifter", 10.0f, kRate, [&] { run(device, input); });

  return finish("pitch-shifter");
}
