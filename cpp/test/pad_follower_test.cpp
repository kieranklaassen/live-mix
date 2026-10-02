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

  // The pad plays the pitch that was played, at about its level, and keeps
  // that pitch while it hangs on after the tone has stopped.
  {
    plain(device);
    std::vector<float> x = burst(220.0f, 3.0f, 5.0f, kRate, 0.1f);
    Stereo out = run(device, x);
    const double held = dominant_frequency(out.left, kRate, 200.0, 240.0, at(1.5), at(2.9));
    const double hanging = dominant_frequency(out.left, kRate, 200.0, 240.0, at(3.2), at(4.2));
    const double level = db(tone_level(out.left, 220.0, kRate, at(2.0), at(2.9)) / 0.1);
    NOTE("220 Hz tone: pad %+.3f ct while held, %+.3f ct while hanging on, level %+.2f dB re input\n",
         cents(held, 220.0), cents(hanging, 220.0), level);
    EXPECT(std::fabs(cents(held, 220.0)) < 2.0, "the pad of a 220 Hz tone is at 220 Hz");
    EXPECT(std::fabs(cents(hanging, 220.0)) < 2.0, "the pad keeps its pitch after the tone stops");
    EXPECT(std::fabs(level) < 2.0, "the pad of a steady tone is at the tone's level");
  }

  // Octaves adds the same pitch an octave up or down, the unshifted pad stays.
  {
    for (float octaves : {1.0f, -1.0f}) {
      plain(device);
      device.set_param(p::kOctaves, octaves);
      Stereo out = run(device, sine(220.0f, 2.5f, kRate, 0.1f));
      const double target = octaves > 0.0f ? 440.0 : 110.0;
      const double other = octaves > 0.0f ? 110.0 : 440.0;
      const double found =
          dominant_frequency(out.left, kRate, target * 0.9, target * 1.1, at(1.5), at(2.4));
      const double added = db(tone_level(out.left, target, kRate, at(1.5), at(2.4)) / 0.1);
      const double base = db(tone_level(out.left, 220.0, kRate, at(1.5), at(2.4)) / 0.1);
      const double absent = db(tone_level(out.left, other, kRate, at(1.5), at(2.4)) / 0.1);
      NOTE("Octaves %+.0f: %.0f Hz at %+.3f ct, %.1f dB; 220 Hz %.1f dB; %.0f Hz %.1f dB\n", octaves,
           target, cents(found, target), added, base, other, absent);
      EXPECT(std::fabs(cents(found, target)) < 2.0, "the added octave is in tune");
      EXPECT(added > -8.0 && added < 0.0, "the added octave is nearly as loud as the pad");
      EXPECT(base > -6.0, "the unshifted pad stays under the added octave");
      EXPECT(absent < -50.0, "only the chosen octave is added");
    }
  }

  // Rise is the time to 90 % of the swell; Fall the time to fall 60 dB.
  {
    for (float rise : {0.6f, 3.0f}) {
      plain(device);
      device.set_param(p::kRise, rise);
      Stereo out = run(device, sine(330.0f, rise * 3.0f + 1.0f, kRate, 0.1f));
      const double steady = rms(out.left, at(rise * 3.0), at(rise * 3.0 + 0.9));
      const double t90 = time_to_reach(out.left, 0.0, rise * 3.0, steady, 0.9);
      NOTE("Rise %.1f s: 90 %% after %.2f s\n", rise, t90);
      EXPECT(t90 > 0.75 * rise && t90 < 1.25 * rise, "the pad swells to 90 % in about Rise");
    }
    for (float fall : {1.0f, 4.0f, 12.0f}) {
      plain(device);
      device.set_param(p::kFall, fall);
      Stereo out = run(device, burst(330.0f, 1.5f, 1.7f + fall, kRate, 0.1f));
      const double measured = rt60(out.left, kRate, 1.6, 0.05, -100.0);
      NOTE("Fall %.0f s: falls 60 dB in %.2f s\n", fall, measured);
      EXPECT(measured > 0.85 * fall && measured < 1.15 * fall, "the pad falls 60 dB in about Fall");
    }
  }

  // CHECKS

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("pad-follower", 10.0f, kRate, [&] { run(device, input); });

  return finish("pad-follower");
}
