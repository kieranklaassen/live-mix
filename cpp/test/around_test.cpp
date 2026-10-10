// Native harness for Around (cpp/devices/around). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it a source moving round a head.

#include "../devices/around/around.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Around;
namespace p = livemix::around;

static Around device;
static Around other;

static const float kRate = 48000.0f;

int main() {
  Conformance spec;
  spec.name = "around";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 1.0f;
  spec.max_peak = 2.0f;
  check_effect(device, spec, kRate);

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("around", 10.0f, kRate, [&] { run(device, input); });

  return finish("around");
}
