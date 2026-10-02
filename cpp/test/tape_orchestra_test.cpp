// Native harness for Tape Orchestra (cpp/devices/tape-orchestra).

#include "../devices/tape-orchestra/tape_orchestra.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::TapeOrchestra;
namespace p = livemix::tape_orchestra;

static TapeOrchestra device;

static const float kRate = 48000.0f;

int main() {
  Conformance spec;
  spec.name = "tape-orchestra";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 3.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  report_cost("tape-orchestra (8 keys)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("tape-orchestra");
}
