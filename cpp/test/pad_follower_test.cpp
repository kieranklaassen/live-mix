// Native harness for Pad Follower (cpp/devices/pad-follower). The conformance
// pass covers stability, silence when idle, block-size independence and
// parameter abuse; the rest asserts what makes it a pad that follows.

#include "../devices/pad-follower/pad_follower.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::PadFollower;
namespace p = livemix::pad_follower;

static PadFollower device;

static const float kRate = 48000.0f;

// The pad alone, with nothing that moves: no ensemble, no drift, no octave.
static void plain(PadFollower& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kMix, 1.0f);
  d.set_param(p::kEnsemble, 0.0f);
  d.set_param(p::kMovement, 0.0f);
  d.set_param(p::kOctaves, 0.0f);
  d.set_param(p::kBrightness, 12000.0f);
  d.set_param(p::kLowCut, 40.0f);
  d.set_param(p::kWidth, 0.0f);
}

int main() {
  Conformance spec;
  spec.name = "pad-follower";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 12.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  (void)plain;

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("pad-follower", 10.0f, kRate, [&] { run(device, input); });

  return finish("pad-follower");
}
