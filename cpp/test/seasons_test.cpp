// Native harness for Seasons (cpp/devices/seasons). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest asserts what makes it a year: each season's signature at
// its centre, a blend with no step in it anywhere round the dial, a clock
// that turns the year at the stated speed whatever the sound does, and a
// level that holds.

#include "../devices/seasons/seasons.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Seasons;
namespace p = livemix::seasons;

static Seasons device;

static const float kRate = 48000.0f;

// SEASONS_TEST_HELPERS

int main() {
  Conformance spec;
  spec.name = "seasons";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 12.0f;
  spec.max_peak = 2.01f;
  check_effect(device, spec, kRate);

  // SEASONS_TEST_BODY

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("seasons", 10.0f, kRate, [&] { run(device, input); });

  return finish("seasons");
}
