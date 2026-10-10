// Native harness for Pulses (cpp/devices/pulses). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest measures the two gates: which steps sound and where, how fast the
// second gate runs and when it is back with the first, the shape of a pulse,
// what is left between pulses, where the gates sit, and that nothing clicks,
// sticks or depends on the block size.
//
// A constant input of 1 is the measuring signal for most of it: with Mix at 1
// and Shade at 0 the output is then the gain itself.

#include "../devices/pulses/pulses.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Pulses;
namespace p = livemix::pulses;

static Pulses device;
static Pulses twin;

static const float kRate = 48000.0f;

static std::vector<float> dc(float seconds, float level = 1.0f) {
  return std::vector<float>(static_cast<size_t>(seconds * kRate + 0.5f), level);
}

// One gate, bare: no drift, both in the middle, no accent, no shade, silent
// gaps, the hardest edge, half a step long.
static void bare(Pulses& d, float rate, int steps, int fill) {
  d.init(kRate);
  d.set_param(p::kRate, rate);
  d.set_param(p::kSteps, static_cast<float>(steps));
  d.set_param(p::kFill, static_cast<float>(fill));
  d.set_param(p::kDrift, 0.0f);
  d.set_param(p::kShift, 0.0f);
  d.set_param(p::kEdge, 1.0f);
  d.set_param(p::kLength, 0.5f);
  d.set_param(p::kFloor, 0.0f);
  d.set_param(p::kShade, 0.0f);
  d.set_param(p::kApart, 0.0f);
  d.set_param(p::kAccent, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

// Samples (with the fraction between two) at which `x` goes up, or down,
// through `level`.
static std::vector<double> crossings(const std::vector<float>& x, double level, bool rising,
                                     size_t from = 0, size_t to = SIZE_MAX) {
  std::vector<double> out;
  to = std::min(to, x.size());
  for (size_t i = from + 1; i < to; ++i) {
    const bool through =
        rising ? (x[i - 1] < level && x[i] >= level) : (x[i - 1] > level && x[i] <= level);
    if (!through) continue;
    const double fraction = (level - x[i - 1]) / (static_cast<double>(x[i]) - x[i - 1]);
    out.push_back(static_cast<double>(i - 1) + fraction);
  }
  return out;
}

static double lowest(const std::vector<float>& x, size_t from, size_t to) {
  double v = 1.0e9;
  for (size_t i = from; i < to && i < x.size(); ++i) v = std::min(v, static_cast<double>(x[i]));
  return v;
}

static double worst_difference(const std::vector<float>& a, const std::vector<float>& b,
                               size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, std::min(a.size(), b.size()));
  double worst = 0.0;
  for (size_t i = from; i < to; ++i) {
    const double d = std::fabs(static_cast<double>(a[i]) - b[i]);
    // A difference that is not a number counts as the worst there is.
    worst = d == d ? std::max(worst, d) : 1.0e30;
  }
  return worst;
}

// What one pole at `corner` Hz does to `hz`, as the kit's OnePole computes it.
static double one_pole_gain(double corner, double hz, double sample_rate, double* phase) {
  const double a = std::exp(-2.0 * kPi * corner / sample_rate);
  const double w = 2.0 * kPi * hz / sample_rate;
  const double re = 1.0 - a * std::cos(w);
  const double im = a * std::sin(w);
  *phase = -std::atan2(im, re);
  return (1.0 - a) / std::sqrt(re * re + im * im);
}

// How suddenly an event is heard: the same passage is rendered with it and
// without it, and the largest difference in the first 8 samples after it is
// taken as a share of the largest in the first 20 ms. Eight moments a little
// apart, the worst of them, so a jump cannot hide in a zero crossing. `hz` 0
// is a constant input. -1 when the event changed nothing.
template <typename Setup, typename Event>
static double suddenness(Setup setup, Event event, float hz, float into) {
  double worst = -1.0;
  for (int moment = 0; moment < 8; ++moment) {
    const size_t before = static_cast<size_t>(into * kRate) + static_cast<size_t>(moment) * 37;
    const size_t after = 960;
    std::vector<float> in(before + after, 1.0f);
    if (hz > 0.0f) {
      for (size_t i = 0; i < in.size(); ++i) {
        in[i] = 0.5f * static_cast<float>(std::sin(2.0 * kPi * hz * static_cast<double>(i) / kRate));
      }
    }
    const std::vector<float> head(in.begin(), in.begin() + static_cast<long>(before));
    const std::vector<float> tail(in.begin() + static_cast<long>(before), in.end());
    Stereo heard[2];
    for (int which = 0; which < 2; ++which) {
      setup(device);
      run(device, head);
      if (which == 1) event(device);
      heard[which] = run(device, tail);
    }
    double early = 0.0, all = 0.0;
    for (size_t i = 0; i < after; ++i) {
      const double d = std::max(std::fabs(static_cast<double>(heard[1].left[i]) - heard[0].left[i]),
                                std::fabs(static_cast<double>(heard[1].right[i]) - heard[0].right[i]));
      all = std::max(all, d);
      if (i < 8) early = std::max(early, d);
    }
    if (all > 0.01) worst = std::max(worst, early / all);
  }
  return worst;
}

int main() {
  Conformance spec;
  spec.name = "pulses";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 0.5f;
  spec.max_peak = 1.0f;  // a gate only turns down
  check_effect(device, spec, kRate);

  const double step = kRate / 10.0;                              // samples, at Rate 10
  const double edge_samples = Pulses::kMinEdgeSeconds * kRate;   // the hardest rise

  // 1. The pattern: Fill steps of Steps sound, spread evenly, and each pulse
  // starts on its step. Evenly spread is taken here from its other
  // definition, pulse k at step ceil(k * Steps / Fill).
  {
    const int pairs[4][2] = {{8, 3}, {8, 5}, {16, 7}, {5, 2}};
    for (const int* pair : pairs) {
      const int steps = pair[0], fill = pair[1];
      bare(device, 10.0f, steps, fill);
      Stereo out = run(device, dc(static_cast<float>(2 * steps) / 10.0f));
      const std::vector<double> onsets = crossings(out.left, 0.5, true);
      char label[120];
      std::snprintf(label, sizeof label, "%d in %d: two rounds of the pattern have %d pulses",
                    fill, steps, 2 * fill);
      EXPECT(onsets.size() == static_cast<size_t>(2 * fill), label);
      bool placed = onsets.size() == static_cast<size_t>(2 * fill);
      for (size_t n = 0; placed && n < onsets.size(); ++n) {
        const int k = static_cast<int>(n) % fill;
        const int round = static_cast<int>(n) / fill;
        const int at = (k * steps + fill - 1) / fill + round * steps;
        // Half way up the rise is half the edge after the step begins.
        placed = std::fabs(onsets[n] - (at * step + 0.5 * edge_samples)) < 1.0;
      }
      std::snprintf(label, sizeof label, "%d in %d: every pulse starts on its step", fill, steps);
      EXPECT(placed, label);
      EXPECT(out.left == out.right, "no drift and no shift: both sides are one gate");
    }
    // More Fill than Steps is every step.
    bare(device, 10.0f, 4, 16);
    Stereo all = run(device, dc(0.8f));
    EXPECT(crossings(all.left, 0.5, true).size() == 8, "Fill past Steps sounds every step");
  }

  // 2. The second gate runs at Rate x (1 + drift), drift an eighth of Drift
  // cubed; the first runs at Rate whatever Drift says.
  {
    const float drifts[3] = {1.0f, 0.5f, 0.2f};
    for (float drift : drifts) {
      bare(device, 10.0f, 2, 2);
      device.set_param(p::kApart, 1.0f);
      device.set_param(p::kDrift, drift);
      Stereo out = run(device, dc(30.0f));
      const std::vector<double> first = crossings(out.left, 0.5, true);
      const std::vector<double> second = crossings(out.right, 0.5, true);
      const double first_rate = (first.size() - 1) * kRate / (first.back() - first.front());
      const double second_rate = (second.size() - 1) * kRate / (second.back() - second.front());
      const double expected = 10.0 * (1.0 + 0.125 * drift * drift * drift);
      char label[120];
      std::snprintf(label, sizeof label, "Drift %.1f: the first gate keeps Rate", drift);
      EXPECT_NEAR(first_rate, 10.0, 1.0e-5, label);
      std::snprintf(label, sizeof label, "Drift %.1f: the second gate runs at Rate x (1 + drift)",
                    drift);
      EXPECT_NEAR(second_rate, expected, 1.0e-5, label);
    }
    EXPECT_NEAR(Pulses::drift_fraction(1.0f), 0.125, 1.0e-9, "Drift at full is an eighth faster");
    EXPECT(Pulses::drift_fraction(0.0f) == 0.0f, "Drift at zero is no faster");
  }

  // 3. The two are together again after Steps / (Rate x drift) seconds: four
  // steps at 16 a second and a sixty-fourth faster is 16 s. The pattern (x.xx
  // with its first step accented) fits itself in one place only, so how far
  // apart the two sides are, over one round of it, falls to nothing there.
  {
    bare(device, 16.0f, 4, 3);
    device.set_param(p::kApart, 1.0f);
    device.set_param(p::kAccent, 0.5f);
    device.set_param(p::kDrift, 0.5f);
    Stereo out = run(device, dc(33.0f));
    const size_t window = 12000;  // one round of the pattern
    const size_t hop = 240;       // 5 ms
    std::vector<double> apart;
    for (size_t at = 0; at + window <= out.size(); at += hop) {
      double sum = 0.0;
      for (size_t i = at; i < at + window; ++i) sum += std::fabs(out.left[i] - out.right[i]);
      apart.push_back(sum / window);
    }
    auto at_time = [&](double seconds) {
      return apart[(static_cast<size_t>(seconds * kRate) - window / 2) / hop];
    };
    auto nearest_meeting = [&](double from_s, double to_s) {
      size_t best = static_cast<size_t>(from_s * kRate / hop);
      for (size_t n = best; n < apart.size() && n * hop < to_s * kRate; ++n) {
        if (apart[n] < apart[best]) best = n;
      }
      return (best * hop + window / 2) / static_cast<double>(kRate);
    };
    EXPECT_NEAR(nearest_meeting(8.0, 24.0), 16.0, 0.1, "the gates meet again after the predicted 16 s");
    EXPECT_NEAR(nearest_meeting(24.0, 32.5), 32.0, 0.1, "and again 16 s after that");
    const double far = *std::max_element(apart.begin(), apart.end());
    EXPECT(at_time(16.0) < 0.06 * far, "at the meeting the two sides are all but one");
    EXPECT(at_time(8.0) > 0.3 * far, "half way round they are far apart");
    // One step apart (4 s) the patterns do not fit, though their steps line up.
    EXPECT(at_time(4.0) > 0.3 * far, "a whole step apart is not together");
    // The reading a display counts down from says the same.
    bare(device, 8.0f, 4, 3);
    device.set_param(p::kDrift, 1.0f);
    run(device, dc(1.0f));
    EXPECT_NEAR(device.meter(1), 0.25, 1.0e-4, "the lead reads a quarter after a quarter of the time");
    run(device, dc(2.5f));
    EXPECT_NEAR(device.meter(1), 0.875, 1.0e-4, "and seven eighths after 3.5 s");
    EXPECT_NEAR(device.meter(0), 0.0, 1.0e-4, "the first gate is back at its first step after 28 steps");
  }

  // 4. Edge sets the rise: half a cosine as long as (1 - Edge) of half the
  // pulse, and never shorter than 2 ms. From 10 % to 90 % of a half cosine is
  // 0.5903 of its length.
  {
    const double tenth_to_ninth = (std::acos(-0.8) - std::acos(0.8)) / kPi;
    const float edges[3] = {1.0f, 0.5f, 0.0f};
    const double ramps[3] = {edge_samples, 0.5 * 0.4 * 12000.0, 0.4 * 12000.0};
    for (int which = 0; which < 3; ++which) {
      bare(device, 4.0f, 2, 2);
      device.set_param(p::kLength, 0.8f);
      device.set_param(p::kEdge, edges[which]);
      Stereo out = run(device, dc(1.0f));
      // The second pulse, from 12000.
      const std::vector<double> low = crossings(out.left, 0.1, true, 11990);
      const std::vector<double> high = crossings(out.left, 0.9, true, 11990);
      const double rise = low.empty() || high.empty() ? 0.0 : high[0] - low[0];
      char label[120];
      std::snprintf(label, sizeof label, "Edge %.1f: the pulse rises in %.2f ms", edges[which],
                    1000.0 * tenth_to_ninth * ramps[which] / kRate);
      EXPECT_NEAR(rise, tenth_to_ninth * ramps[which], 0.01 * tenth_to_ninth * ramps[which] + 0.6,
                  label);
      // And falls the same way: the pulse is its own mirror.
      const std::vector<double> down_high = crossings(out.left, 0.9, false, 11990);
      const std::vector<double> down_low = crossings(out.left, 0.1, false, 11990);
      const double fall = down_high.empty() || down_low.empty() ? 0.0 : down_low[0] - down_high[0];
      EXPECT_NEAR(fall, rise, 0.6, "the fall is as long as the rise");
    }
    // The second gate's steps are shorter, and its hardest edge is still 2 ms.
    bare(device, 4.0f, 2, 2);
    device.set_param(p::kApart, 1.0f);
    device.set_param(p::kDrift, 1.0f);
    Stereo out = run(device, dc(1.0f));
    const std::vector<double> low = crossings(out.right, 0.1, true, 10000);
    const std::vector<double> high = crossings(out.right, 0.9, true, 10000);
    EXPECT_NEAR(low.empty() || high.empty() ? 0.0 : high[0] - low[0], tenth_to_ninth * edge_samples,
                0.6, "the faster gate's hardest edge is the same 2 ms");
  }

  // 5. Length is the pulse's share of its step: at half height it is that
  // long less one edge.
  {
    const float lengths[3] = {0.25f, 0.5f, 1.0f};
    for (float length : lengths) {
      bare(device, 4.0f, 2, 2);
      device.set_param(p::kLength, length);
      Stereo out = run(device, dc(1.0f));
      const std::vector<double> up = crossings(out.left, 0.5, true, 11990);
      const std::vector<double> down = crossings(out.left, 0.5, false, 11990);
      const double width = up.empty() || down.empty() ? 0.0 : down[0] - up[0];
      char label[120];
      std::snprintf(label, sizeof label, "Length %.2f: the pulse lasts that share of its step",
                    length);
      EXPECT_NEAR(width, length * 12000.0 - edge_samples, 1.0, label);
    }
  }

  // 6. Floor is what is left between pulses, as the square of the knob, and
  // the pulses still reach unity.
  {
    const float floors[4] = {0.0f, 0.25f, 0.5f, 1.0f};
    for (float floor : floors) {
      bare(device, 4.0f, 2, 2);
      device.set_param(p::kFloor, floor);
      Stereo out = run(device, dc(1.0f));
      char label[120];
      std::snprintf(label, sizeof label, "Floor %.2f: the gaps hold %.4f of the sound", floor,
                    floor * floor);
      EXPECT_NEAR(lowest(out.left, 8000, 11000), floor * floor, 1.0e-6, label);
      EXPECT_NEAR(peak(out.left, 12000, 18000), 1.0, 1.0e-6, "and a pulse is the whole of it");
    }
  }

  // 7. Accent turns down every step but the first, by up to 0.7.
  {
    const float accents[3] = {0.0f, 0.5f, 1.0f};
    for (float accent : accents) {
      bare(device, 10.0f, 4, 4);
      device.set_param(p::kAccent, accent);
      Stereo out = run(device, dc(0.8f));
      char label[120];
      std::snprintf(label, sizeof label, "Accent %.1f: the first step stays whole", accent);
      EXPECT_NEAR(peak(out.left, 0, 4800), 1.0, 1.0e-6, label);
      EXPECT_NEAR(peak(out.left, 19200, 24000), 1.0, 1.0e-6, label);
      std::snprintf(label, sizeof label, "Accent %.1f: the other steps reach %.2f", accent,
                    1.0 - 0.7 * accent);
      for (int n = 1; n < 4; ++n) {
        EXPECT_NEAR(peak(out.left, n * 4800, (n + 1) * 4800), 1.0 - 0.7 * accent, 1.0e-6, label);
      }
    }
  }

  // 8. Shade dulls what is between pulses and leaves the pulse itself alone:
  // in a gap the sound is (1 - Shade) of itself and Shade of one pole at
  // 400 Hz, at the floor's gain. One step of two sounds, half a step long, so
  // 0.3 to 0.9 s is gap and 0.05 to 0.2 s is pulse.
  {
    const float shades[3] = {0.0f, 0.5f, 1.0f};
    const double tones[2] = {6000.0, 100.0};
    for (float shade : shades) {
      for (double hz : tones) {
        bare(device, 2.0f, 2, 1);
        device.set_param(p::kFloor, 0.5f);
        device.set_param(p::kShade, shade);
        Stereo out = run(device, sine(static_cast<float>(hz), 1.0f, kRate, 0.5f));
        double phase = 0.0;
        const double pole = one_pole_gain(400.0, hz, kRate, &phase);
        const double re = (1.0 - shade) + shade * pole * std::cos(phase);
        const double im = shade * pole * std::sin(phase);
        const double expected = 0.25 * std::sqrt(re * re + im * im);
        char label[140];
        std::snprintf(label, sizeof label,
                      "Shade %.1f: %.0f Hz between pulses is %.4f of what came in", shade, hz,
                      expected);
        EXPECT_NEAR(tone_level(out.left, hz, kRate, 14400, 43200) / 0.5, expected, 0.003, label);
        std::snprintf(label, sizeof label, "Shade %.1f: %.0f Hz on the pulse is untouched", shade,
                      hz);
        EXPECT_NEAR(tone_level(out.left, hz, kRate, 2400, 9600) / 0.5, 1.0, 0.003, label);
      }
    }
  }

  // 9. Apart places the gates: with one step of two sounding and the second
  // gate a step ahead, the first sounds while the second is silent.
  {
    const float aparts[3] = {1.0f, 0.5f, 0.0f};
    for (float apart : aparts) {
      bare(device, 10.0f, 2, 1);
      device.set_param(p::kShift, 1.0f);
      device.set_param(p::kApart, apart);
      Stereo out = run(device, dc(0.4f));
      // The top of the first gate's pulse, and then of the second's.
      const double near = 0.5 + 0.5 * apart, other = 0.5 - 0.5 * apart;
      char label[120];
      std::snprintf(label, sizeof label, "Apart %.1f: the first gate is %.2f left and %.2f right",
                    apart, near, other);
      EXPECT_NEAR(out.left[1200], near, 1.0e-6, label);
      EXPECT_NEAR(out.right[1200], other, 1.0e-6, label);
      std::snprintf(label, sizeof label, "Apart %.1f: the second gate is %.2f left and %.2f right",
                    apart, other, near);
      EXPECT_NEAR(out.left[6000], other, 1.0e-6, label);
      EXPECT_NEAR(out.right[6000], near, 1.0e-6, label);
    }
    // Both in the middle is one sound on both sides, drifting or not.
    device.init(kRate);
    device.set_param(p::kApart, 0.0f);
    device.set_param(p::kDrift, 0.8f);
    rng_state() = 0xA11CEu;
    Stereo middle = run(device, noise(3.0f, kRate, 0.5f));
    EXPECT(middle.left == middle.right, "Apart 0: both sides are equal while the gates drift");
    // And with no drift the two gates are one, wherever they sit.
    device.init(kRate);
    device.set_param(p::kApart, 1.0f);
    device.set_param(p::kDrift, 0.0f);
    rng_state() = 0xA11CEu;
    Stereo one = run(device, noise(3.0f, kRate, 0.5f));
    EXPECT(one.left == one.right, "Drift 0: both sides are equal with the gates apart");
  }

  // 10. Shift is a canon: the second gate plays now what the first plays that
  // many steps later.
  {
    bare(device, 10.0f, 8, 3);
    device.set_param(p::kApart, 1.0f);
    device.set_param(p::kAccent, 0.5f);
    device.set_param(p::kShift, 3.0f);
    Stereo out = run(device, dc(2.0f));
    double worst = 0.0;
    const size_t ahead = static_cast<size_t>(3 * step);
    for (size_t i = 0; i + ahead < out.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(out.right[i]) - out.left[i + ahead]));
    }
    EXPECT(worst < 1.0e-5, "Shift 3: the right side is the left side three steps on");
    EXPECT(worst_difference(out.left, out.right) > 0.5, "and not the left side as it is");
    // More Shift than Steps comes round.
    bare(device, 10.0f, 4, 1);
    device.set_param(p::kApart, 1.0f);
    device.set_param(p::kShift, 9.0f);
    Stereo round = run(device, dc(0.8f));
    bare(device, 10.0f, 4, 1);
    device.set_param(p::kApart, 1.0f);
    device.set_param(p::kShift, 1.0f);
    Stereo once = run(device, dc(0.8f));
    EXPECT(round.right == once.right, "Shift 9 of 4 steps is Shift 1");
  }

  // 11. Mix 0 is the input, sample for sample; half way is half the depth.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    rng_state() = 0xC0FFEEu;
    const std::vector<float> in = noise(2.0f, kRate, 0.9f);
    Stereo out = run(device, in);
    EXPECT(out.left == in && out.right == in, "Mix 0 is the input, sample for sample");
    bare(device, 4.0f, 2, 2);
    device.set_param(p::kMix, 0.5f);
    Stereo half = run(device, dc(1.0f));
    EXPECT_NEAR(lowest(half.left, 8000, 11000), 0.5, 1.0e-6, "Mix 0.5: a silent gap is half");
    EXPECT_NEAR(peak(half.left), 1.0, 1.0e-6, "Mix 0.5: a pulse is whole");
  }

  // 12. Nothing is louder than what came in, at the defaults or anywhere.
  {
    rng_state() = 0xFACEu;
    const std::vector<float> in = noise(2.0f, kRate, 1.0f);
    const double in_peak = peak(in);
    device.init(kRate);
    Stereo out = run(device, in);
    EXPECT(peak(out.left) <= in_peak && peak(out.right) <= in_peak,
           "defaults: no sample is louder than the loudest that came in");
    EXPECT(rms(out.left) < rms(in), "defaults: quieter than the input on the whole");
    device.init(kRate);
    device.set_param(p::kShade, 1.0f);
    device.set_param(p::kFloor, 0.7f);
    device.set_param(p::kRate, 20.0f);
    device.set_param(p::kDrift, 1.0f);
    out = run(device, in);
    EXPECT(peak(out.left) <= in_peak && peak(out.right) <= in_peak,
           "all Shade on a high Floor: still no louder than the input");
  }

  // 13. The hardest Edge does not click. On a constant the largest step is
  // the edge's own slope, half a cosine over 2 ms; on a tone it is that and
  // the tone's own.
  {
    const double edge_slope = 0.5 * kPi / edge_samples;
    bare(device, 16.0f, 8, 8);
    Stereo flat = run(device, dc(2.0f));
    EXPECT(max_step(flat.left) < 1.01 * edge_slope,
           "hardest Edge on a constant: no step past the edge's own slope");
    EXPECT(max_step(flat.left) > 0.95 * edge_slope, "and the edge is as steep as it says");
    bare(device, 16.0f, 8, 8);
    Stereo tone = run(device, sine(100.0f, 2.0f, kRate, 0.5f));
    const double tone_slope = 0.5 * 2.0 * kPi * 100.0 / kRate;
    EXPECT(max_step(tone.left) < 1.01 * (0.5 * edge_slope + tone_slope),
           "hardest Edge on a tone: no step past the edge's slope and the tone's");
  }

  // 14. A pattern changed in the middle of a pulse is a ramp, not a jump:
  // the slew's limit, a quarter over the edge's slope. The same render with
  // nothing changed never moves faster than the edge.
  {
    const double edge_slope = 0.5 * kPi / edge_samples;
    const double limit = Pulses::kSlewHeadroom * edge_slope;
    struct Event {
      const char* what;
      int param;
      float value;
      float into;  // seconds before the change
    };
    // Four steps at 4 a second, every other one sounding, long pulses, the
    // second gate three steps ahead and gaining a step every two seconds.
    // 0.55 s in, the first gate is on its third step's pulse and the second
    // in the gap before it; 0.7 s in, both are on that pulse.
    //   Fill 1 silences the first gate's step; Steps 2 and Shift 0 put the
    //   second gate on a pulse; Drift 0 takes back what it had gained, which
    //   had carried it over a step's edge.
    const Event events[4] = {{"Fill", p::kFill, 1.0f, 0.55f},
                             {"Steps", p::kSteps, 2.0f, 0.55f},
                             {"Shift", p::kShift, 0.0f, 0.55f},
                             {"Drift to zero", p::kDrift, 0.0f, 0.7f}};
    for (const Event& event : events) {
      for (int moved = 0; moved < 2; ++moved) {
        bare(device, 4.0f, 4, 2);
        device.set_param(p::kLength, 0.9f);
        device.set_param(p::kApart, 1.0f);
        device.set_param(p::kShift, 3.0f);
        device.set_param(p::kDrift, 1.0f);
        Stereo out = run(device, dc(event.into));
        if (moved == 1) device.set_param(event.param, event.value);
        Stereo after = run(device, dc(0.02f));
        const double worst = std::max(max_step(after.left), max_step(after.right));
        const double travel = std::max(std::fabs(after.left.back() - out.left.back()),
                                       std::fabs(after.right.back() - out.right.back()));
        char label[120];
        if (moved == 0) {
          EXPECT(worst < 1.0e-9 && travel < 1.0e-9, "with nothing changed both gates hold still here");
        } else {
          std::snprintf(label, sizeof label, "%s changed inside a pulse moves a gate all the way",
                        event.what);
          EXPECT(travel > 0.99, label);
          std::snprintf(label, sizeof label, "%s changed inside a pulse: a ramp at the slew's limit",
                        event.what);
          EXPECT(worst < 1.001 * limit && worst > 0.99 * limit, label);
        }
      }
    }
  }

  // 15. The smoothed knobs glide: thrown from one end to the other on a
  // constant, the output moves no faster than a 5 ms smoother starts.
  {
    const double start = 1.0 - std::exp(-1.0 / (0.005 * kRate));
    struct Throw {
      const char* what;
      int param;
      float from, to;
      double swing;  // how far the output can go
    };
    const Throw throws[6] = {{"Floor", p::kFloor, 0.0f, 1.0f, 1.0}, {"Mix", p::kMix, 1.0f, 0.0f, 1.0},
                             {"Apart", p::kApart, 1.0f, 0.0f, 0.5}, {"Accent", p::kAccent, 0.0f, 1.0f, 0.7},
                             {"Floor", p::kFloor, 1.0f, 0.0f, 1.0}, {"Mix", p::kMix, 0.0f, 1.0f, 1.0}};
    for (const Throw& t : throws) {
      // Two steps at 2 a second, the first sounding, the second gate a step
      // ahead: 0.3 s in, the first gate is on its pulse and the second in its
      // gap. Accent is heard on the second step, so there every step sounds
      // and the moment is 0.7 s in.
      bare(device, 2.0f, 2, t.param == p::kAccent ? 2 : 1);
      device.set_param(p::kLength, 0.9f);
      device.set_param(p::kShift, t.param == p::kAccent ? 0.0f : 1.0f);
      device.set_param(p::kApart, 1.0f);
      device.set_param(t.param, t.from);
      const float into = t.param == p::kAccent ? 0.7f : 0.3f;
      Stereo before = run(device, dc(into));
      device.set_param(t.param, t.to);
      Stereo after = run(device, dc(0.05f));
      const double worst = std::max(max_step(after.left), max_step(after.right));
      const double travel = std::max(std::fabs(after.left.back() - before.left.back()),
                                     std::fabs(after.right.back() - before.right.back()));
      char label[120];
      std::snprintf(label, sizeof label, "%s thrown %.0f to %.0f is heard", t.what, t.from, t.to);
      EXPECT(travel > 0.98 * t.swing, label);
      std::snprintf(label, sizeof label, "%s thrown %.0f to %.0f glides in 5 ms", t.what, t.from,
                    t.to);
      EXPECT(worst < 1.02 * start * t.swing && worst > 0.9 * start * t.swing, label);
    }
    // Shade, Length and Edge shape the pulse, and the slew would hide a jump
    // of theirs from a bound on the step. So each is thrown while it matters
    // and held against the same passage with nothing thrown: how much of the
    // difference is there after 8 samples, at eight moments a little apart.
    // A knob that glides has gone a thirtieth of its way by then.
    //
    // Shade, in a gap, under a 3 kHz tone on a floor of 0.36.
    auto gap = [](Pulses& d) {
      bare(d, 2.0f, 2, 1);
      d.set_param(p::kFloor, 0.6f);
    };
    const double shade_on =
        suddenness(gap, [](Pulses& d) { d.set_param(p::kShade, 1.0f); }, 3000.0f, 0.4f);
    EXPECT(shade_on >= 0.0 && shade_on < 0.1, "Shade thrown up between pulses comes in gradually");
    auto shaded_gap = [](Pulses& d) {
      bare(d, 2.0f, 2, 1);
      d.set_param(p::kFloor, 0.6f);
      d.set_param(p::kShade, 1.0f);
    };
    const double shade_off =
        suddenness(shaded_gap, [](Pulses& d) { d.set_param(p::kShade, 0.0f); }, 3000.0f, 0.4f);
    EXPECT(shade_off >= 0.0 && shade_off < 0.1, "Shade thrown down between pulses leaves gradually");
    // Length, cut from 0.9 to 0.1 half way along a pulse: the pulse's end has
    // to come back past this place before anything moves.
    auto long_pulse = [](Pulses& d) {
      bare(d, 2.0f, 2, 2);
      d.set_param(p::kLength, 0.9f);
    };
    const double shortened =
        suddenness(long_pulse, [](Pulses& d) { d.set_param(p::kLength, 0.1f); }, 0.0f, 0.25f);
    EXPECT(shortened >= 0.0 && shortened < 0.05, "Length cut short inside a pulse does not drop it at once");
    // Edge, from the softest to the hardest a seventh of the way up a rise.
    auto soft_rise = [](Pulses& d) {
      bare(d, 2.0f, 2, 2);
      d.set_param(p::kLength, 1.0f);
      d.set_param(p::kEdge, 0.0f);
    };
    const double hardened =
        suddenness(soft_rise, [](Pulses& d) { d.set_param(p::kEdge, 1.0f); }, 0.0f, 0.07f);
    EXPECT(hardened >= 0.0 && hardened < 0.1, "Edge thrown hard inside a rise does not lift it at once");
  }

  // 16. Bad input passes: after a stretch of samples that are not numbers,
  // infinite or absurd, the output is what a device that never heard them
  // puts out, to the sample.
  {
    rng_state() = 0xBADu;
    const std::vector<float> good = noise(1.0f, kRate, 0.5f);
    const float bads[4] = {std::nanf(""), INFINITY, -INFINITY, 1.0e30f};
    for (float bad : bads) {
      for (float shade : {0.5f, 1.0f}) {
        device.init(kRate);
        twin.init(kRate);
        device.set_param(p::kShade, shade);
        twin.set_param(p::kShade, shade);
        device.set_param(p::kMix, 0.7f);
        twin.set_param(p::kMix, 0.7f);
        Stereo a = run(device, good);
        Stereo b = run(twin, good);
        std::vector<float> spoiled(4800, bad);
        run(device, spoiled);
        run(twin, std::vector<float>(4800, 0.25f));
        a = run(device, good);
        b = run(twin, good);
        char label[120];
        std::snprintf(label, sizeof label, "after %g at the input the output is finite again", bad);
        EXPECT(finite(a.left) && finite(a.right), label);
        std::snprintf(label, sizeof label,
                      "after %g at the input the device is where it would have been (Shade %.1f)",
                      bad, shade);
        // The filter of the one that heard good samples has their tail in it
        // for a few milliseconds; after that the two are one.
        EXPECT(worst_difference(a.left, b.left, 2400) < 1.0e-6 &&
                   worst_difference(a.right, b.right, 2400) < 1.0e-6,
               label);
        EXPECT(rms(a.left, 2400) > 0.05, "and it still sounds");
      }
    }
  }

  // 17. The clocks run free: the gain at a moment is the same whether sound
  // has been coming all along or began after a silence, long or short, and
  // whatever the block size. A knob moved in the silence is there when sound
  // comes back.
  {
    const float gaps[8] = {0.003f, 0.05f, 0.09f, 0.11f, 0.14f, 0.19f, 0.4f, 1.3f};
    const int blocks[4] = {128, 1, 2048, 0};  // 0 is a ragged mix
    auto render = [&](Pulses& d, const std::vector<float>& x, int block) {
      if (block > 0) return run(d, x, x, block);
      Stereo out;
      out.left.resize(x.size());
      out.right.resize(x.size());
      const int sizes[] = {1, 7, 64, 128, 33, 512, 2048, 5};
      size_t done = 0;
      int which = 0;
      while (done < x.size()) {
        const int frames =
            static_cast<int>(std::min(static_cast<size_t>(sizes[which++ % 8]), x.size() - done));
        for (int i = 0; i < frames; ++i) d.in_left()[i] = d.in_right()[i] = x[done + i];
        d.process(frames);
        for (int i = 0; i < frames; ++i) {
          out.left[done + i] = d.out_left()[i];
          out.right[done + i] = d.out_right()[i];
        }
        done += frames;
      }
      return out;
    };
    double worst_block = 0.0, worst_free = 0.0, worst_knob = 0.0;
    for (float gap : gaps) {
      // What a device that never rested puts out over the same stretch: the
      // tone all the way, with the knobs where they end up.
      const std::vector<float> first = sine(220.0f, 0.3f, kRate, 0.5f);
      const std::vector<float> rest = silence(gap, kRate);
      const std::vector<float> second = sine(330.0f, 0.4f, kRate, 0.5f);
      Stereo reference;
      for (int block : blocks) {
        device.init(kRate);
        device.set_param(p::kDrift, 0.9f);
        // Off the beat of anything that counts in blocks.
        device.in_left()[0] = device.in_right()[0] = 0.25f;
        device.process(13);
        Stereo a = render(device, first, block);
        Stereo quiet = render(device, rest, block);
        device.set_param(p::kFloor, 0.8f);
        device.set_param(p::kLength, 0.9f);
        device.set_param(p::kApart, 0.2f);
        device.set_param(p::kMix, 0.6f);
        Stereo b = render(device, second, block);
        Stereo all = concat(concat(a, quiet), b);
        if (block == 128) {
          reference = all;
        } else {
          worst_block = std::max(worst_block, std::max(worst_difference(all.left, reference.left),
                                                       worst_difference(all.right, reference.right)));
        }
      }
      // The same second note on a device that had the knobs there from the
      // start and heard a constant through the gap, so it never rested: a
      // tenth of a second on (its filter has forgotten the constant, and a
      // knob moved in a short gap has glided in), the two are one.
      twin.init(kRate);
      twin.set_param(p::kDrift, 0.9f);
      twin.set_param(p::kFloor, 0.8f);
      twin.set_param(p::kLength, 0.9f);
      twin.set_param(p::kApart, 0.2f);
      twin.set_param(p::kMix, 0.6f);
      twin.in_left()[0] = twin.in_right()[0] = 0.25f;
      twin.process(13);
      run(twin, first);
      run(twin, std::vector<float>(rest.size(), 0.25f));
      Stereo b = run(twin, second);
      const size_t from = first.size() + rest.size();
      double free_running = 0.0;
      for (size_t i = 4800; i < second.size(); ++i) {
        free_running = std::max(free_running, std::fabs(static_cast<double>(b.left[i]) - reference.left[from + i]));
        free_running = std::max(free_running, std::fabs(static_cast<double>(b.right[i]) - reference.right[from + i]));
      }
      if (gap >= 0.1f) {
        // Past the silence that counts as new sound the knobs have arrived.
        worst_knob = std::max(worst_knob, free_running);
      } else {
        // A shorter gap leaves them gliding, as they would under sound.
        worst_free = std::max(worst_free, free_running);
      }
    }
    char label[160];
    std::snprintf(label, sizeof label,
                  "across a silence the output does not depend on the block size (worst %g)",
                  worst_block);
    EXPECT(worst_block < 1.0e-6, label);
    std::snprintf(label, sizeof label,
                  "after a silence the gates are where a device that never rested has them (worst %g)",
                  worst_knob);
    EXPECT(worst_knob < 1.0e-6, label);
    std::snprintf(label, sizeof label,
                  "after a short gap too, once the knobs moved in it have glided in (worst %g)",
                  worst_free);
    EXPECT(worst_free < 1.0e-6, label);
  }

  // 18. The device sleeps and wakes, and its clock has run on meanwhile.
  {
    device.init(kRate);
    device.set_param(p::kRate, 8.0f);
    device.set_param(p::kSteps, 16.0f);
    device.set_param(p::kDrift, 1.0f);
    run(device, sine(440.0f, 0.5f, kRate, 0.5f));
    render(device, 0.5f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the input stops");
    // 2 s in: 16 steps gone by, and the second gate two steps on.
    EXPECT_NEAR(device.meter(0), 0.0, 1.0e-4, "asleep, the first gate has gone on round its pattern");
    EXPECT_NEAR(device.meter(1), 0.125, 1.0e-4, "and the second has gone on gaining");
    Stereo woken = run(device, sine(440.0f, 0.5f, kRate, 0.5f));
    EXPECT(peak(woken.left) > 0.4, "wakes on new input");
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  const std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("pulses (defaults)", 10.0f, kRate, [&] { run(device, input); });
  device.init(kRate);
  device.set_param(p::kRate, 20.0f);
  device.set_param(p::kSteps, 16.0f);
  device.set_param(p::kFill, 16.0f);
  device.set_param(p::kDrift, 1.0f);
  device.set_param(p::kShade, 1.0f);
  device.set_param(p::kEdge, 0.0f);
  device.set_param(p::kLength, 1.0f);
  device.set_param(p::kMix, 0.5f);
  report_cost("pulses (every step, all edge, fastest)", 10.0f, kRate, [&] { run(device, input); });

  return finish("pulses");
}
