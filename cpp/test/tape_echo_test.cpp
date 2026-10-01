// Native harness for Tape Echo (cpp/devices/tape-echo). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest asserts what makes it a tape echo.

#include "../devices/tape-echo/tape_echo.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::TapeEcho;
namespace p = livemix::tape_echo;

static TapeEcho device;

static const float kRate = 48000.0f;

// Sample index of the largest magnitude in [from, to).
static size_t peak_index(const std::vector<float>& x, size_t from, size_t to) {
  size_t best = from;
  for (size_t i = from; i < to && i < x.size(); ++i) {
    if (std::fabs(x[i]) > std::fabs(x[best])) best = i;
  }
  return best;
}

static void clean(TapeEcho& d) {
  d.init(kRate);
  d.set_param(p::kWow, 0.0f);
  d.set_param(p::kFlutter, 0.0f);
  d.set_param(p::kDrive, 0.0f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kLowCut, 20.0f);
  d.set_param(p::kHighCut, 16000.0f);
  d.set_param(p::kMix, 1.0f);
}

int main() {
  Conformance spec;
  spec.name = "tape-echo";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 14.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // The first repeat lands at Time, the second at twice Time, scaled by Feedback.
  {
    clean(device);
    device.set_param(p::kTime, 250.0f);
    device.set_param(p::kFeedback, 0.5f);
    Stereo out = run(device, impulse(1.0f, kRate, 0.25f));
    const size_t first = peak_index(out.left, 6000, 18000);
    const size_t second = peak_index(out.left, 18000, 30000);
    EXPECT(std::llabs(static_cast<long long>(first) - 12000) <= 2, "first repeat lands at Time");
    EXPECT(std::llabs(static_cast<long long>(second) - 24000) <= 3, "second repeat lands at 2x Time");
    const double ratio = std::fabs(out.left[second]) / std::fabs(out.left[first]);
    EXPECT(ratio > 0.3 && ratio < 0.55, "each repeat is scaled by Feedback (and softened by the loop filter)");
  }

  // Mix 0 is the dry signal untouched.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    std::vector<float> tone = sine(440.0f, 0.5f, kRate, 0.5f);
    Stereo out = run(device, tone);
    double worst = 0.0;
    for (size_t i = 0; i < tone.size(); ++i) worst = std::max(worst, std::fabs(out.left[i] - (double)tone[i]));
    EXPECT(worst < 1.0e-6, "Mix 0 passes the input through");
  }

  // Three heads give three repeats inside one Time.
  {
    clean(device);
    device.set_param(p::kTime, 600.0f);
    device.set_param(p::kFeedback, 0.0f);
    device.set_param(p::kHeads, 2.0f);
    Stereo out = run(device, impulse(1.0f, kRate, 0.25f));
    const double a = peak(out.left, 9000, 10200);    // 200 ms
    const double b = peak(out.left, 18600, 19800);   // 400 ms
    const double c = peak(out.left, 28200, 29400);   // 600 ms
    const double gap = peak(out.left, 12000, 17000);
    EXPECT(a > 0.03 && b > 0.03 && c > 0.03, "Three heads: repeats at 1/3, 2/3 and 1x Time");
    EXPECT(gap < 0.002, "Three heads: quiet between the heads");
  }

  // The loop darkens: each pass through High Cut removes more treble.
  {
    clean(device);
    device.set_param(p::kTime, 200.0f);
    device.set_param(p::kFeedback, 0.8f);
    device.set_param(p::kHighCut, 2000.0f);
    rng_state() = 0xC0FFEEu;
    std::vector<float> burst = noise(0.05f, kRate, 0.3f);
    burst.resize(static_cast<size_t>(kRate * 2.0f), 0.0f);
    Stereo out = run(device, burst);
    const size_t n = static_cast<size_t>(0.2f * kRate);
    const double early = energy_above(out.left, 4000.0, kRate, n, 2 * n) /
                         std::max(1.0e-12, rms(out.left, n, 2 * n));
    const double late = energy_above(out.left, 4000.0, kRate, 6 * n, 7 * n) /
                        std::max(1.0e-12, rms(out.left, 6 * n, 7 * n));
    EXPECT(late < early * 0.6, "repeats lose treble on every pass");
  }

  // Feedback past 1 runs away but stays bounded by the tape saturation.
  {
    device.init(kRate);
    device.set_param(p::kFeedback, 1.1f);
    device.set_param(p::kTime, 120.0f);
    device.set_param(p::kMix, 1.0f);
    run(device, sine(330.0f, 0.5f, kRate, 0.5f));
    Stereo late = render(device, 20.0f, kRate);
    const size_t n = late.left.size();
    EXPECT(finite(late.left) && peak(late.left) < 1.5, "runaway feedback is bounded");
    EXPECT(rms(late.left, n - 48000, n) > 0.01, "runaway feedback sustains");
  }

  // Wow bends pitch: a steady tone comes back frequency-modulated.
  {
    clean(device);
    device.set_param(p::kTime, 300.0f);
    device.set_param(p::kFeedback, 0.0f);
    Stereo steady = run(device, sine(1000.0f, 4.0f, kRate, 0.25f));
    clean(device);
    device.set_param(p::kTime, 300.0f);
    device.set_param(p::kFeedback, 0.0f);
    device.set_param(p::kWow, 1.0f);
    Stereo wobbly = run(device, sine(1000.0f, 4.0f, kRate, 0.25f));
    const size_t from = 48000, to = 4 * 48000;
    const double still = tone_level(steady.left, 1000.0, kRate, from, to);
    const double moved = tone_level(wobbly.left, 1000.0, kRate, from, to);
    EXPECT(still > 0.2, "without wow the echo of a tone is that tone");
    EXPECT(moved < still * 0.9, "wow spreads the tone's energy away from its frequency");
  }

  // Ping Pong alternates sides from a centred source.
  {
    clean(device);
    device.set_param(p::kTime, 250.0f);
    device.set_param(p::kFeedback, 0.7f);
    device.set_param(p::kSpread, 1.0f);
    Stereo out = run(device, impulse(1.0f, kRate, 0.25f));
    const double l1 = peak(out.left, 11000, 13000), r1 = peak(out.right, 11000, 13000);
    const double l2 = peak(out.left, 23000, 25000), r2 = peak(out.right, 23000, 25000);
    EXPECT(l1 > 10.0 * r1, "Ping Pong: first repeat on the left");
    EXPECT(r2 > 10.0 * l2, "Ping Pong: second repeat on the right");
  }

  // Changing Time while sounding glides instead of clicking.
  {
    clean(device);
    device.set_param(p::kTime, 400.0f);
    device.set_param(p::kFeedback, 0.6f);
    run(device, sine(220.0f, 1.0f, kRate, 0.25f));
    device.set_param(p::kTime, 150.0f);
    Stereo out = run(device, sine(220.0f, 1.0f, kRate, 0.25f));
    EXPECT(max_step(out.left) < 0.12, "a Time change glides without a click");
  }

  // The device sleeps: after the tail it does no work and returns exact zero.
  {
    device.init(kRate);
    run(device, noise(0.2f, kRate, 0.5f));
    render(device, 14.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail");
    Stereo woken = run(device, impulse(1.0f, kRate, 0.5f));
    EXPECT(peak(woken.left, 16000, 20000) > 0.01, "wakes on new input");
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("tape-echo", 10.0f, kRate, [&] { run(device, input); });

  return finish("tape-echo");
}
