// Native harness for Zither (cpp/devices/zither). The conformance pass covers
// silence before and after notes, a pile of keys, parameter abuse and other
// sample rates; the rest asserts what makes it a box of strings.

#include "../devices/zither/zither.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Zither;
namespace p = livemix::zither;

static Zither device;

static const float kRate = 48000.0f;

int main() {
  Conformance spec;
  spec.name = "zither";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 30.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  // CHECKS

  return finish("zither");
}
