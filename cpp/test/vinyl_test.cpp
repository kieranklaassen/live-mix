// Native harness for Vinyl (cpp/devices/vinyl).

#include "../devices/vinyl/vinyl.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Vinyl;
namespace p = livemix::vinyl;

static Vinyl device;

static const float kRate = 48000.0f;

int main() {
  Conformance spec;
  spec.name = "vinyl";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 7.0f;  // four seconds of surface noise, its fade, and the filters
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // [[CHECKS]]

  return finish("vinyl");
}
