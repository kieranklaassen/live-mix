// Native harness for Imprint (cpp/devices/imprint). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest asserts what makes it an imprint: what is captured is what
// is stamped, and the stamp does what each control says.

#include "../devices/imprint/imprint.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Imprint;
namespace p = livemix::imprint;

static Imprint device;

static const float kRate = 48000.0f;
static const int kLatency = Imprint::kLatency;

int main() {
  Conformance spec;
  spec.name = "imprint";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 1.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("imprint", 10.0f, kRate, [&] { run(device, input); });

  return finish("imprint");
}
