// Native harness for Radio (cpp/devices/radio). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it a radio link.

#include "../devices/radio/radio.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Radio;
namespace p = livemix::radio;

static Radio device;

static const float kRate = 48000.0f;

// A steady link: no fading, static, neighbours or drift, line output.
static void clean(Radio& d, int band, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kBand, static_cast<float>(band));
  d.set_param(p::kTuning, 0.0f);
  d.set_param(p::kDrift, 0.0f);
  d.set_param(p::kFading, 0.0f);
  d.set_param(p::kStatic, 0.0f);
  d.set_param(p::kInterference, 0.0f);
  d.set_param(p::kSpeaker, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

int main() {
  Conformance spec;
  spec.name = "radio";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 7.0f;
  spec.max_peak = 2.0f;
  check_effect(device, spec, kRate);

  // BEHAVIOUR

  return finish("radio");
}
