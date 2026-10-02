// Native harness for West Coast (cpp/devices/west-coast).

#include "../devices/west-coast/west_coast.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::WestCoast;
namespace p = livemix::west_coast;

static WestCoast device;

static const float kRate = 48000.0f;

int main() {
  Conformance spec;
  spec.name = "west-coast";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 6.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  // BEHAVIOUR

  // Cost with every voice sounding at the heaviest setting: eight held
  // notes, full fold with the timbre envelope and symmetry, deep FM.
  device.init(kRate);
  device.set_param(p::kSustain, 1.0f);
  device.set_param(p::kFold, 1.0f);
  device.set_param(p::kSymmetry, 1.0f);
  device.set_param(p::kFm, 1.0f);
  device.set_param(p::kTimbreEnv, 1.0f);
  device.set_param(p::kChance, 1.0f);
  device.set_param(p::kDrift, 1.0f);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
  report_cost("west-coast (8 held notes, full fold and FM)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("west-coast");
}
