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

  return finish("west-coast");
}
