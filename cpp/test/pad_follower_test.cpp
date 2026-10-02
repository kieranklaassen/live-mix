// Native harness for Pad Follower (cpp/devices/pad-follower). The conformance
// pass covers stability, silence when idle, block-size independence and
// parameter abuse; the rest asserts what makes it a pad that follows.

#include "../devices/pad-follower/pad_follower.h"
#include "support/test_kit.h"

#include <cstdlib>

using namespace testkit;
using livemix::PadFollower;
namespace p = livemix::pad_follower;

static PadFollower device;

static const float kRate = 48000.0f;

// Measured numbers, printed with PAD_FOLLOWER_VERBOSE=1 (quiet otherwise).
static bool verbose() {
  static const bool on = std::getenv("PAD_FOLLOWER_VERBOSE") != nullptr;
  return on;
}
#define NOTE(...)                        \
  do {                                   \
    if (verbose()) std::printf(__VA_ARGS__); \
  } while (0)

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }
static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

// The pad alone, with nothing that moves: no ensemble, no drift, no octave,
// no tone shaping, summed to the centre.
static void plain(PadFollower& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kMix, 1.0f);
  d.set_param(p::kEnsemble, 0.0f);
  d.set_param(p::kMovement, 0.0f);
  d.set_param(p::kOctaves, 0.0f);
  d.set_param(p::kBrightness, 12000.0f);
  d.set_param(p::kLowCut, 40.0f);
  d.set_param(p::kWidth, 0.0f);
  d.set_param(p::kRise, 0.6f);
  d.set_param(p::kFall, 3.0f);
}

// A sine that stops: `on` seconds of tone, silence up to `total`.
static std::vector<float> burst(float hz, float on, float total, float rate, float gain) {
  std::vector<float> x = sine(hz, on, rate, gain);
  x.resize(static_cast<size_t>(total * rate), 0.0f);
  return x;
}

static std::vector<float> chord(const std::vector<double>& notes, float seconds, float gain,
                                float rate = kRate) {
  std::vector<float> x(static_cast<size_t>(seconds * rate), 0.0f);
  for (size_t i = 0; i < x.size(); ++i) {
    double v = 0.0;
    for (double hz : notes) v += std::sin(2.0 * kPi * hz * static_cast<double>(i) / rate);
    x[i] = gain * static_cast<float>(v);
  }
  return x;
}

// Time after `from` at which the 20 ms RMS first reaches `share` of `level`.
static double time_to_reach(const std::vector<float>& x, double from, double until, double level,
                            double share) {
  for (double t = from; t < until; t += 0.005) {
    if (rms(x, at(t), at(t + 0.02)) >= share * level) return t + 0.01 - from;
  }
  return -1.0;
}

int main() {
  Conformance spec;
  spec.name = "pad-follower";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 12.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // CHECKS

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("pad-follower", 10.0f, kRate, [&] { run(device, input); });

  return finish("pad-follower");
}
