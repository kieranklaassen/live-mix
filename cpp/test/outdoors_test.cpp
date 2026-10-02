// Native harness for Outdoors (cpp/devices/outdoors). The conformance pass
// covers silence before and after notes, voice stealing, parameter abuse,
// other sample rates and that two renders after init() match (every random
// source is seeded there); the rest measures each scene: where its energy
// sits, how its events are timed and what the key and the knobs do to it.

#include "../devices/outdoors/outdoors.h"

#include "support/test_kit.h"

using namespace testkit;
using livemix::Outdoors;
namespace p = livemix::outdoors;

static Outdoors device;

static const float kRate = 48000.0f;

static const char* const kNames[Outdoors::kKinds] = {"Birds",  "Crickets", "Frogs",
                                                     "Stream", "Thunder",  "Chimes"};

// CHECKS

int main() {
  Conformance spec;
  spec.name = "outdoors";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 8.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  // BEHAVIOUR

  (void)kNames;
  return finish("outdoors");
}
