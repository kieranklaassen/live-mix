// Native harness for Haze (cpp/devices/haze). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it a reverb into a fuzz into a reverb.

#include "../devices/haze/haze.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Haze;
namespace p = livemix::haze;

static Haze device;

static const float kRate = 48000.0f;

// The wall alone, with nothing fed back and no fold, so one stage can be
// measured at a time.
static void plain(Haze& d) {
  d.init(kRate);
  d.set_param(p::kMix, 1.0f);
  d.set_param(p::kFeed, 0.0f);
  d.set_param(p::kOctave, 0.0f);
}

// A chord of three sines, each at `gain`.
static std::vector<float> chord(float seconds, float gain, float a = 220.0f, float b = 277.18f,
                                float c = 329.63f) {
  std::vector<float> out = sine(a, seconds, kRate, gain);
  const std::vector<float> second = sine(b, seconds, kRate, gain);
  const std::vector<float> third = sine(c, seconds, kRate, gain);
  for (size_t i = 0; i < out.size(); ++i) out[i] += second[i] + third[i];
  return out;
}

int main() {
  Conformance spec;
  spec.name = "haze";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 24.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // BEHAVIOUR CHECKS GO HERE

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("haze", 10.0f, kRate, [&] { run(device, input); });

  return finish("haze");
}
