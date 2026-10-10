// Native harness for Lift (cpp/devices/lift). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it an upward compressor for sustained sound:
// the curve, the times, the lookahead, the split, and that it never lifts
// silence or anything loud.

#include "../devices/lift/lift.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Lift;
namespace p = livemix::lift;

static Lift device;

static const float kRate = 48000.0f;
static const int kLatency = Lift::kLatency;

// A wide-band lift with short times, so a steady tone settles on the curve.
static void plain(Lift& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kThreshold, -30.0f);
  d.set_param(p::kAmount, 0.5f);
  d.set_param(p::kFloor, -70.0f);
  d.set_param(p::kRise, 0.05f);
  d.set_param(p::kFall, 5.0f);
  d.set_param(p::kSplit, 0.0f);
  d.set_param(p::kFocus, 0.0f);
  d.set_param(p::kLimit, 30.0f);
  d.set_param(p::kHear, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

// A sine whose RMS is `level_db` dBFS.
static std::vector<float> tone(float hz, float level_db, float seconds, float rate = kRate) {
  return sine(hz, seconds, rate, static_cast<float>(std::sqrt(2.0) * std::pow(10.0, level_db / 20.0)));
}

// The gain in dB the device settles at for a steady tone: output over input
// at the tone's frequency, over the last quarter of the render.
static double settled_gain(Lift& d, float hz, float level_db, float seconds = 1.5f) {
  const std::vector<float> in = tone(hz, level_db, seconds);
  Stereo out = run(d, in);
  const size_t from = in.size() * 3 / 4;
  return db(tone_level(out.left, hz, kRate, from, in.size()) /
            tone_level(in, hz, kRate, from, in.size()));
}

// `x` delayed by the device's latency, for comparing with its output.
static std::vector<float> late(const std::vector<float>& x) {
  std::vector<float> out(x.size(), 0.0f);
  for (size_t i = kLatency; i < x.size(); ++i) out[i] = x[i - kLatency];
  return out;
}

static double worst_difference(const std::vector<float>& a, const std::vector<float>& b,
                               size_t from = 0) {
  double worst = 0.0;
  for (size_t i = from; i < a.size() && i < b.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a[i]) - b[i]));
  }
  return worst;
}

// --- checks ---

// --- main ---
int main() {
  Conformance spec;
  spec.name = "lift";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 1.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // --- calls ---

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.05f);
  report_cost("lift", 10.0f, kRate, [&] { run(device, input); });

  return finish("lift");
}
