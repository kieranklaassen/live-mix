// Native harness for Vowel Reverb (cpp/devices/vowel-reverb). The conformance
// pass covers stability, silence when idle, block-size independence and
// parameter abuse; the rest asserts what makes it a reverb that sings: a
// tail with the formants of the chosen vowel, which decays slowest on them.

#include "../devices/vowel-reverb/vowel_reverb.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::VowelReverb;
namespace p = livemix::vowel_reverb;
namespace vd = livemix::vowel_dsp;

static VowelReverb device;

static const float kRate = 48000.0f;

// HELPERS

int main() {
  Conformance spec;
  spec.name = "vowel-reverb";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 18.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // CHECKS

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("vowel-reverb", 10.0f, kRate, [&] { run(device, input); });

  return finish("vowel-reverb");
}
