// Native harness for Re-amp (cpp/devices/re-amp).

#include "../devices/re-amp/re_amp.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::ReAmp;
namespace p = livemix::re_amp;

static ReAmp device;

static const float kRate = 48000.0f;

int main() {
  Conformance spec;
  spec.name = "re-amp";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 6.0f;
  spec.max_peak = 4.5f;
  check_effect(device, spec, kRate);
  return finish("re-amp");
}
