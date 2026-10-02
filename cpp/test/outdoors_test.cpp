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

  // Cost with eight keys held at full Density, per type.
  for (int type = 0; type < Outdoors::kKinds; ++type) {
    device.init(kRate);
    device.set_param(p::kType, static_cast<float>(type));
    device.set_param(p::kDensity, 1.0f);
    for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
    render(device, 2.0f, kRate);
    char label[64];
    std::snprintf(label, sizeof label, "outdoors (8 keys, full Density, %s)", kNames[type]);
    report_cost(label, 10.0f, kRate, [&] { render(device, 10.0f, kRate); });
  }

  return finish("outdoors");
}
