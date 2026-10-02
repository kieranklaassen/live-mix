// Native harness for Half Speed (cpp/devices/half-speed). The conformance
// pass covers stability, silence when idle, block-size independence and
// parameter abuse; the rest asserts what makes it a live half-speed player.

#include "../devices/half-speed/half_speed.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::HalfSpeed;
namespace p = livemix::half_speed;

static HalfSpeed device;

static const float kRate = 48000.0f;

// The plain machine: one steady cycle length, both sides together, full wet.
static void plain(HalfSpeed& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kJitter, 0.0f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

int main() {
  Conformance spec;
  spec.name = "half-speed";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 3.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // BEHAVIOUR CHECKS

  plain(device);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("half-speed", 10.0f, kRate, [&] { run(device, input); });

  return finish("half-speed");
}
