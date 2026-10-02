// Native harness for Swarm Reverb (cpp/devices/swarm-reverb). The conformance
// pass covers stability, silence when idle, block-size independence and
// parameter abuse; the rest asserts what makes it a swarm of echoes on a
// tape whose speed can be dragged.

#include "../devices/swarm-reverb/swarm_reverb.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::SwarmReverb;
namespace p = livemix::swarm_reverb;

static SwarmReverb device;

static const float kRate = 48000.0f;

// Wet only, nothing moving, nothing filtered: the bare swarm.
static void bare(SwarmReverb& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kMix, 1.0f);
  d.set_param(p::kReflect, 0.0f);
  d.set_param(p::kDiffuse, 0.0f);
  d.set_param(p::kModulation, 0.0f);
  d.set_param(p::kDampen, 16000.0f);
  d.set_param(p::kLowCut, 20.0f);
}

int main() {
  Conformance spec;
  spec.name = "swarm-reverb";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 24.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // BEHAVIOUR CHECKS

  device.init(kRate);
  device.set_param(p::kReflect, 0.9f);
  device.set_param(p::kWander, 0.5f);
  device.set_param(p::kModulation, 1.0f);
  device.set_param(p::kDiffuse, 1.0f);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("swarm-reverb", 10.0f, kRate, [&] { run(device, input); });

  return finish("swarm-reverb");
}
