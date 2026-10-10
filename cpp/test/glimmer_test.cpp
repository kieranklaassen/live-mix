// Native harness for Glimmer (cpp/devices/glimmer). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest measures the flicker: that each partial of a comb moves at
// about Rate and by Depth, apart from its neighbours on Scatter and in order
// on the waves, that the level of the whole holds, and that the clock keeps
// its place through silence.

#include "../devices/glimmer/glimmer.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Glimmer;
namespace p = livemix::glimmer;

static Glimmer device;

static const float kRate = 48000.0f;
enum { kScatter = 0, kUpward, kDownward, kOutward };
static const int kLatency = Glimmer::kLatency;

int main() {
  Conformance spec;
  spec.name = "glimmer";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 1.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  device.init(kRate);
  rng_state() = 5;
  const std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("glimmer", 10.0f, kRate, [&] { run(device, input); });
  return finish("glimmer");
}
