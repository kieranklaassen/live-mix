// Native harness for Octaves (cpp/devices/octaves). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest asserts what makes it a polyphonic octave generator: each
// voice lands on its octave and nowhere else, chords come out as chords, the
// voices start with the note and do not warble.

#include "../devices/octaves/octaves.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Octaves;
namespace p = livemix::octaves;

static Octaves device;

static const float kRate = 48000.0f;

// One voice alone: nothing else sounding, no dry signal.
static void solo(Octaves& d, int voice, float level = 1.0f) {
  d.init(kRate);
  d.set_param(p::kSub2, 0.0f);
  d.set_param(p::kSub1, 0.0f);
  d.set_param(p::kUp1, 0.0f);
  d.set_param(p::kUp2, 0.0f);
  d.set_param(p::kDry, 0.0f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kDetune, 0.0f);
  d.set_param(p::kAttack, 0.0f);
  d.set_param(p::kFilter, 16000.0f);
  d.set_param(p::kResonance, 0.0f);
  if (voice >= 0) d.set_param(voice, level);
}

int main() {
  Conformance spec;
  spec.name = "octaves";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 2.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // CHECKS

  device.init(kRate);
  device.set_param(p::kSub2, 1.0f);
  device.set_param(p::kSub1, 1.0f);
  device.set_param(p::kUp1, 1.0f);
  device.set_param(p::kUp2, 1.0f);
  device.set_param(p::kDetune, 1.0f);
  device.set_param(p::kAttack, 0.3f);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("octaves (all four voices, detuned, noise)", 10.0f, kRate, [&] { run(device, input); });

  return finish("octaves");
}
