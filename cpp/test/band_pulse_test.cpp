// Native harness for Band Pulse (cpp/devices/band-pulse). The conformance pass
// covers stability, silence when idle, block-size independence on steady
// noise and parameter abuse. The rest measures what the device is: an even
// pulse on the band between Low and High and on nothing else, by the pulse
// law of cpp/kit/beat.h, on a clock that never stops.
//
// The measuring signal for the pulse itself is a pair of renders: one device
// hears a sine and its twin the cosine of the same tone, so the root of the
// two outputs squared is the gain at every sample, with no window to blur an
// edge. The split turns phase and the gain comes after it, so this is exact
// but for what the other two parts leak at the tone (under -60 dB with the
// band's edges three octaves away).
//
// Nobody listens here: every figure printed is a measurement of a render.

#include <ctime>

#include "../devices/band-pulse/band_pulse.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::BandPulse;
namespace p = livemix::band_pulse;
namespace kit = livemix::kit;

static BandPulse device;
static BandPulse twin;

static size_t at(double seconds, double sr) { return static_cast<size_t>(seconds * sr + 0.5); }

// --- signals ------------------------------------------------------------------------------------

static std::vector<float> cosine(float hz, float seconds, float sr, float gain) {
  std::vector<float> out(static_cast<size_t>(seconds * sr));
  for (size_t i = 0; i < out.size(); ++i) {
    out[i] = gain * static_cast<float>(std::cos(2.0 * kPi * hz * static_cast<double>(i) / sr));
  }
  return out;
}

// Noise that falls about 3 dB an octave (three poles and a little white).
// Only its shape matters here: every reading is a ratio of two renders of
// the same noise.
static std::vector<float> pink(float seconds, float sr, float gain, uint32_t seed) {
  rng_state() = seed;
  std::vector<float> out(static_cast<size_t>(seconds * sr));
  double b0 = 0.0, b1 = 0.0, b2 = 0.0;
  for (float& v : out) {
    const double w = white();
    b0 = 0.99765 * b0 + w * 0.0990460;
    b1 = 0.96300 * b1 + w * 0.2965164;
    b2 = 0.57000 * b2 + w * 1.0526913;
    v = gain * static_cast<float>(0.25 * (b0 + b1 + b2 + w * 0.1848));
  }
  return out;
}

// A chord of bare sawtooth waves, peaking at `peak`.
static std::vector<float> saws(float seconds, float sr, float peak_at) {
  const double notes[4] = {110.0, 220.0, 329.63, 440.0};
  std::vector<float> out(static_cast<size_t>(seconds * sr), 0.0f);
  for (double hz : notes) {
    for (size_t i = 0; i < out.size(); ++i) {
      const double turn = hz * static_cast<double>(i) / sr;
      out[i] += static_cast<float>(2.0 * (turn - std::floor(turn)) - 1.0);
    }
  }
  const double top = peak(out);
  for (float& v : out) v = static_cast<float>(v * peak_at / top);
  return out;
}

// Three struck notes of six partials each, dying away, peaking at `peak`.
static std::vector<float> struck(float seconds, float sr, float peak_at) {
  const double notes[3] = {220.0, 277.18, 329.63};
  std::vector<float> out(static_cast<size_t>(seconds * sr), 0.0f);
  for (int n = 0; n < 3; ++n) {
    const size_t from = at(0.3 * n, sr);
    for (size_t i = from; i < out.size(); ++i) {
      const double t = static_cast<double>(i - from) / sr;
      double v = 0.0;
      for (int k = 1; k <= 6; ++k) v += std::sin(2.0 * kPi * notes[n] * k * t) / k * std::exp(-t * (1.5 + k));
      out[i] += static_cast<float>(v);
    }
  }
  const double top = peak(out);
  for (float& v : out) v = static_cast<float>(v * peak_at / top);
  return out;
}

// --- driving the device -------------------------------------------------------------------------

// A render in blocks of `block` frames; 0 is a ragged mix of sizes.
static Stereo render_in(BandPulse& d, const std::vector<float>& left, const std::vector<float>& right,
                        int block) {
  if (block > 0) return run(d, left, right, block);
  Stereo out;
  out.left.resize(left.size());
  out.right.resize(left.size());
  const int sizes[] = {1, 7, 64, 128, 33, 512, 2048, 5};
  size_t done = 0;
  int which = 0;
  while (done < left.size()) {
    const int frames =
        static_cast<int>(std::min(static_cast<size_t>(sizes[which++ % 8]), left.size() - done));
    for (int i = 0; i < frames; ++i) {
      d.in_left()[i] = left[done + i];
      d.in_right()[i] = right[done + i];
    }
    d.process(frames);
    for (int i = 0; i < frames; ++i) {
      out.left[done + i] = d.out_left()[i];
      out.right[done + i] = d.out_right()[i];
    }
    done += frames;
  }
  return out;
}

static Stereo render_in(BandPulse& d, const std::vector<float>& mono, int block) {
  return render_in(d, mono, mono, block);
}

static void append(Stereo* all, const Stereo& part) {
  all->left.insert(all->left.end(), part.left.begin(), part.left.end());
  all->right.insert(all->right.end(), part.right.begin(), part.right.end());
}

static double worst_difference(const std::vector<float>& a, const std::vector<float>& b,
                               size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, std::min(a.size(), b.size()));
  double worst = 0.0;
  for (size_t i = from; i < to; ++i) {
    const double d = std::fabs(static_cast<double>(a[i]) - b[i]);
    worst = d == d ? std::max(worst, d) : 1.0e30;  // not a number is the worst there is
  }
  return worst;
}

static double worst_difference(const Stereo& a, const Stereo& b, size_t from = 0, size_t to = SIZE_MAX) {
  return std::max(worst_difference(a.left, b.left, from, to),
                  worst_difference(a.right, b.right, from, to));
}

// The band's edges three octaves either side of 500 Hz, so a 500 Hz tone is
// all band, and the pulse at its deepest.
static void wide(BandPulse& d) {
  d.set_param(p::kLow, 60.0f);
  d.set_param(p::kHigh, 4000.0f);
  d.set_param(p::kDepth, 1.0f);
}

// The gain at every sample, for each side and for the mono sum: the device
// hears a sine, its twin the cosine, and the two outputs are squared and
// summed. `setup` is run on both after init.
struct Curve {
  std::vector<float> left, right, mid;
};

static const float kProbeHz = 500.0f;

template <typename Setup>
static Curve gain_curve(Setup setup, float seconds, float sr, float hz = kProbeHz, int block = kBlock) {
  device.init(sr);
  setup(device);
  const Stereo a = render_in(device, sine(hz, seconds, sr, 0.5f), block);
  twin.init(sr);
  setup(twin);
  const Stereo b = render_in(twin, cosine(hz, seconds, sr, 0.5f), block);
  Curve out;
  out.left.resize(a.size());
  out.right.resize(a.size());
  out.mid.resize(a.size());
  for (size_t i = 0; i < a.size(); ++i) {
    out.left[i] = 2.0f * std::hypot(a.left[i], b.left[i]);
    out.right[i] = 2.0f * std::hypot(a.right[i], b.right[i]);
    out.mid[i] = std::hypot(a.left[i] + a.right[i], b.left[i] + b.right[i]);
  }
  return out;
}

// --- measures -----------------------------------------------------------------------------------

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

// The largest third difference: what a click leaves and a band-limited tone
// does not. A step of size s gives about s.
static double kink(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  double worst = 0.0;
  for (size_t i = from + 3; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 3.0 * x[i - 1] + 3.0 * x[i - 2] - x[i - 3]));
  }
  return worst;
}

// One second-order section in double, for the analysis filters below.
struct Section {
  double b0, b1, b2, a1, a2, z1 = 0.0, z2 = 0.0;
  double run(double x) {
    const double y = b0 * x + z1;
    z1 = b1 * x - a1 * y + z2;
    z2 = b2 * x - a2 * y;
    return y;
  }
};

static Section pass(bool high, double hz, double q, double sr) {
  const double w = 2.0 * kPi * hz / sr, c = std::cos(w), alpha = std::sin(w) / (2.0 * q);
  const double a0 = 1.0 + alpha;
  Section s;
  s.b1 = (high ? -(1.0 + c) : (1.0 - c)) / a0;
  s.b0 = s.b2 = std::fabs(s.b1) * 0.5;
  s.a1 = -2.0 * c / a0;
  s.a2 = (1.0 - alpha) / a0;
  return s;
}

// What of `x` lies between `lo` and `hi` hertz: a fourth-order high pass and
// a fourth-order low pass.
static std::vector<float> band_of(const std::vector<float>& x, double lo, double hi, double sr) {
  Section sections[4] = {pass(true, lo, 0.5412, sr), pass(true, lo, 1.3066, sr),
                         pass(false, hi, 0.5412, sr), pass(false, hi, 1.3066, sr)};
  std::vector<float> out(x.size());
  for (size_t i = 0; i < x.size(); ++i) {
    double v = x[i];
    for (Section& s : sections) v = s.run(v);
    out[i] = static_cast<float>(v);
  }
  return out;
}

// The power of `x` in each of `bins` equal parts of the pulse's cycle, from
// sample `from` on. The clock stands at phase 0 on the first sample after
// init and never stops, so sample i is at phase i x rate / sr.
static std::vector<double> folded_power(const std::vector<float>& x, double rate, double sr, int bins,
                                        size_t from) {
  std::vector<double> sum(static_cast<size_t>(bins), 0.0);
  std::vector<double> count(static_cast<size_t>(bins), 0.0);
  for (size_t i = from; i < x.size(); ++i) {
    const double turn = static_cast<double>(i) * rate / sr;
    const size_t bin = static_cast<size_t>((turn - std::floor(turn)) * bins) % static_cast<size_t>(bins);
    sum[bin] += static_cast<double>(x[i]) * x[i];
    count[bin] += 1.0;
  }
  for (size_t b = 0; b < sum.size(); ++b) sum[b] /= std::max(1.0, count[b]);
  return sum;
}

// Cost by CPU time, never wall time: the machine is shared.
template <typename Work>
static double cpu_cost(const char* label, float seconds, float sr, Work work) {
  const std::clock_t start = std::clock();
  work();
  const double micros = 1.0e6 * static_cast<double>(std::clock() - start) / CLOCKS_PER_SEC;
  const double share = 100.0 * micros / (seconds * 1.0e6);
  std::printf("%s cost: %.1f us per 128-frame stereo block, %.2f%% of real time at %.0f kHz (native, CPU time)\n",
              label, micros / (seconds * sr / 128.0), share, sr / 1000.0);
  return share;
}

static void measures(float sr);
static void clicks();
static void silences();
static void bad_input();
static void levels();

int main() {
  Conformance spec;
  spec.name = "band-pulse";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 0.5f;
  // A pulse only turns down, but the split turns phase: flat noise at 0.9
  // comes out with the same power and the peaks of bell-shaped noise, about
  // four times its root mean square of 0.52 (2.01 was read here).
  spec.max_peak = 3.0f;
  check_effect(device, spec, 48000.0f);

  for (float sr : {44100.0f, 48000.0f, 96000.0f}) measures(sr);
  clicks();
  silences();
  bad_input();
  levels();

  return finish("band-pulse");
}

// The rise and the fall as a part of the period: Edge in seconds, held to
// half of the shorter of the on and off times (the kit's law).
static double edge_part(double rate, double duty, double edge_seconds) {
  return std::min(edge_seconds * rate, 0.5 * std::min(duty, 1.0 - duty));
}

// --- the pulse, the band and the level, at one sample rate --------------------------------------

static void measures(float sr) {
  char label[240];
  const double tenth_to_ninth = (std::acos(-0.8) - std::acos(0.8)) / kPi;  // of a half cosine
  const size_t settled = at(0.25, sr);  // the split has forgotten the tone's first sample

  // 1. The pulse at Rate 8, Depth 1, Duty 0.5, Edge 12 ms: eight a second,
  // each beginning on its period, on for half of it between half heights,
  // whole on top and under -40 dB in the gap.
  {
    const Curve g = gain_curve(wide, 3.0f, sr);
    const double period = sr / 8.0, edge = 0.012 * sr;
    const std::vector<double> up = crossings(g.left, 0.5, true, settled);
    const std::vector<double> down = crossings(g.left, 0.5, false, settled);
    std::snprintf(label, sizeof label, "%.0f Hz: Rate 8 gives 22 pulses from 0.25 s to 3 s (%zu up, %zu down)",
                  sr, up.size(), down.size());
    EXPECT(up.size() == 22 && down.size() == 22, label);
    double worst_up = 0.0, worst_down = 0.0;
    for (size_t n = 0; n < up.size() && n < down.size(); ++n) {
      const double begins = static_cast<double>(n + 2) * period;
      worst_up = std::max(worst_up, std::fabs(up[n] - (begins + 0.5 * edge)));
      worst_down = std::max(worst_down, std::fabs(down[n] - (begins + 0.5 * period + 0.5 * edge)));
    }
    std::snprintf(label, sizeof label, "%.0f Hz: every pulse begins on its period (worst %.2f samples out)",
                  sr, worst_up);
    EXPECT(!up.empty() && worst_up < 1.5, label);
    std::snprintf(label, sizeof label, "%.0f Hz: and falls half a period later (worst %.2f samples out)",
                  sr, worst_down);
    EXPECT(!down.empty() && worst_down < 1.5, label);
    const double top = g.left[static_cast<size_t>(4.3 * period)];
    const double gap = peak(g.left, static_cast<size_t>(4.7 * period), static_cast<size_t>(4.95 * period));
    std::snprintf(label, sizeof label, "%.0f Hz: the top of a pulse is the whole sound (%.5f)", sr, top);
    EXPECT_NEAR(top, 1.0, 2.0e-3, label);
    std::snprintf(label, sizeof label, "%.0f Hz: Depth 1 leaves the gap at %.1f dB, under -40", sr, db(gap));
    EXPECT(gap < 0.01, label);
    std::printf("  measured at %.0f Hz: gap %.1f dB under the top (500 Hz tone, edges 60 Hz and 4 kHz)\n", sr,
                db(gap / top));
    EXPECT(g.left == g.right, "Offset 0: both sides carry one pulse");
  }

  // 2. Rate is exact: the last pulse of twenty seconds begins where the
  // closed form puts it, at 0.5, 8 and 40 a second. The clock is a double
  // counted in samples; a float clock is a sample out within seconds.
  for (double rate : {0.5, 8.0, 40.0}) {
    const float seconds = 20.0f;
    const Curve g = gain_curve(
        [rate](BandPulse& d) {
          wide(d);
          d.set_param(p::kRate, static_cast<float>(rate));
        },
        seconds, sr);
    const double period = sr / rate;
    const double half = 0.5 * edge_part(rate, 0.5, 0.012) * period;
    const std::vector<double> up = crossings(g.left, 0.5, true, settled);
    size_t expected = 0;
    double last = 0.0;
    for (int k = 0; k * period + half < seconds * sr - 1.0; ++k) {
      if (k * period + half < static_cast<double>(settled)) continue;
      ++expected;
      last = k * period + half;
    }
    std::snprintf(label, sizeof label, "%.0f Hz: Rate %.1f gives %zu pulses in twenty seconds (counted %zu)",
                  sr, rate, expected, up.size());
    EXPECT(up.size() == expected, label);
    std::snprintf(label, sizeof label, "%.0f Hz: Rate %.1f: the last pulse is %.3f samples from the closed form",
                  sr, rate, up.empty() ? 1.0e9 : up.back() - last);
    EXPECT(!up.empty() && std::fabs(up.back() - last) < 1.0, label);
  }

  // 3. Depth d leaves (1 - d)^2 in the gap and the whole sound on top. At 0
  // the gain is 1 at every sample.
  for (float depth : {0.0f, 0.25f, 0.6f, 1.0f}) {
    const Curve g = gain_curve(
        [depth](BandPulse& d) {
          wide(d);
          d.set_param(p::kDepth, depth);
        },
        0.75f, sr);
    const double period = sr / 8.0;
    const double gap = lowest(g.left, static_cast<size_t>(4.7 * period), static_cast<size_t>(4.95 * period));
    const double top = g.left[static_cast<size_t>(4.3 * period)];
    std::snprintf(label, sizeof label, "%.0f Hz: Depth %.2f leaves %.4f in the gap", sr, depth,
                  (1.0 - depth) * (1.0 - depth));
    EXPECT_NEAR(gap, (1.0 - depth) * (1.0 - depth), 1.5e-3, label);
    EXPECT_NEAR(top, 1.0, 1.5e-3, "and the top is the whole sound");
    if (depth == 0.0f) {
      double away = 0.0;
      for (size_t i = settled; i < g.left.size(); ++i) away = std::max(away, std::fabs(g.left[i] - 1.0));
      std::snprintf(label, sizeof label, "%.0f Hz: Depth 0 pulses nothing (gain within %g of 1)", sr, away);
      EXPECT(away < 1.0e-4, label);
    }
  }

  // 4. Duty is the part of the period between the half heights, and the mean
  // of the gain; Edge is the rise and the fall, half a cosine each (10 % to
  // 90 % of one is 0.5903 of its length), held to half of the shorter of the
  // on and off times.
  for (double duty : {0.1, 0.3, 0.9}) {
    const Curve g = gain_curve(
        [duty](BandPulse& d) {
          wide(d);
          d.set_param(p::kDuty, static_cast<float>(duty));
        },
        1.0f, sr);
    const double period = sr / 8.0;
    const std::vector<double> up = crossings(g.left, 0.5, true, settled);
    const std::vector<double> down = crossings(g.left, 0.5, false, static_cast<size_t>(up.empty() ? 0 : up[0]));
    const double on = up.empty() || down.empty() ? 0.0 : down[0] - up[0];
    std::snprintf(label, sizeof label, "%.0f Hz: Duty %.1f is on for that part of the period (%.2f of %.2f samples)",
                  sr, duty, on, duty * period);
    EXPECT_NEAR(on, duty * period, 1.5, label);
    const double average = mean(g.left, static_cast<size_t>(2 * period), static_cast<size_t>(7 * period));
    std::snprintf(label, sizeof label, "%.0f Hz: Duty %.1f is the mean of the gain at Depth 1", sr, duty);
    EXPECT_NEAR(average, duty, 2.0e-3, label);
  }
  struct EdgeCase {
    float rate, edge_ms;
    double expected_ms;
  };
  for (const EdgeCase& c : {EdgeCase{4.0f, 2.0f, 2.0}, EdgeCase{4.0f, 12.0f, 12.0}, EdgeCase{4.0f, 50.0f, 50.0},
                            EdgeCase{8.0f, 50.0f, 31.25}, EdgeCase{40.0f, 50.0f, 6.25}}) {
    const Curve g = gain_curve(
        [c](BandPulse& d) {
          wide(d);
          d.set_param(p::kRate, c.rate);
          d.set_param(p::kEdge, c.edge_ms);
        },
        1.0f, sr);
    const size_t from = at(0.5, sr) - 4;  // a pulse begins at 0.5 s at each of these rates
    const std::vector<double> low_up = crossings(g.left, 0.1, true, from);
    const std::vector<double> high_up = crossings(g.left, 0.9, true, from);
    const std::vector<double> high_down = crossings(g.left, 0.9, false, from);
    const std::vector<double> low_down = crossings(g.left, 0.1, false, from);
    const double rise = low_up.empty() || high_up.empty() ? 0.0 : high_up[0] - low_up[0];
    const double fall = high_down.empty() || low_down.empty() ? 0.0 : low_down[0] - high_down[0];
    const double expected = tenth_to_ninth * c.expected_ms * 0.001 * sr;
    std::snprintf(label, sizeof label,
                  "%.0f Hz: Rate %.0f, Edge %.0f ms: the rise is a %.2f ms half cosine (%.2f of %.2f samples)", sr,
                  c.rate, c.edge_ms, c.expected_ms, rise, expected);
    EXPECT_NEAR(rise, expected, 0.01 * expected + 0.6, label);
    EXPECT_NEAR(fall, rise, 0.6, "and the fall is as long as the rise");
  }

  // 5. Offset: at 0 the two sides are one to the sample; otherwise the right
  // side's pulse begins Offset of a turn after the left's. At 180 and half
  // Duty the two gains add to a constant, so the mono sum does not pulse; at
  // a quarter Duty it pulses twice a period.
  {
    device.init(sr);
    wide(device);
    const std::vector<float> noisy = pink(2.0f, sr, 0.5f, 0xB0B0u);
    Stereo both = run(device, noisy);
    EXPECT(both.left == both.right && rms(both.left) > 0.01, "Offset 0: mono in, the sides are equal to the sample");
    device.init(sr);
    wide(device);
    device.set_param(p::kOffset, 180.0f);
    Stereo one = run(device, noisy, silence(2.0f, sr));
    EXPECT(peak(one.right) == 0.0 && rms(one.left) > 0.01, "a sound on the left alone leaves the right silent");
  }
  for (float offset : {45.0f, 90.0f, 180.0f}) {
    const Curve g = gain_curve(
        [offset](BandPulse& d) {
          wide(d);
          d.set_param(p::kOffset, offset);
        },
        1.5f, sr);
    const double period = sr / 8.0;
    const std::vector<double> left = crossings(g.left, 0.5, true, at(0.5, sr) - 4);
    const std::vector<double> right = crossings(g.right, 0.5, true, at(0.5, sr) - 4);
    const double behind = left.empty() || right.empty() ? -1.0 : right[0] - left[0];
    std::snprintf(label, sizeof label, "%.0f Hz: Offset %.0f puts the right pulse %.2f samples behind (law: %.2f)",
                  sr, offset, behind, offset / 360.0 * period);
    EXPECT_NEAR(behind, offset / 360.0 * period, 1.5, label);
    if (offset == 180.0f) {
      const double high = peak(g.mid, settled), low = lowest(g.mid, settled, g.mid.size());
      std::snprintf(label, sizeof label,
                    "%.0f Hz: Offset 180 at half Duty: the mono sum ripples %.3f dB, under 1", sr, db(high / low));
      EXPECT(db(high / low) < 1.0, label);
      EXPECT_NEAR(low, 0.5, 2.0e-3, "and stands at half: one side or the other is always open");
    }
  }
  {
    const Curve plain = gain_curve(wide, 1.0f, sr);
    const double ripple = db(peak(plain.mid, settled) / std::max(1.0e-9, lowest(plain.mid, settled, plain.mid.size())));
    std::snprintf(label, sizeof label, "%.0f Hz: Offset 0: the mono sum pulses as each side does (%.1f dB)", sr,
                  ripple);
    EXPECT(ripple > 40.0, label);
    const Curve quarter = gain_curve(
        [](BandPulse& d) {
          wide(d);
          d.set_param(p::kOffset, 180.0f);
          d.set_param(p::kDuty, 0.25f);
        },
        1.5f, sr);
    const size_t pulses = crossings(quarter.mid, 0.25, true, at(0.5, sr) - 4, at(1.5, sr) - 4).size();
    std::snprintf(label, sizeof label,
                  "%.0f Hz: Offset 180 at a quarter Duty: the mono sum pulses twice a period (%zu a second)", sr,
                  pulses);
    EXPECT(pulses == 16, label);
  }

  // 6. Pink noise in, Rate 8, Depth 1. Each reading is the power in a band
  // of the output, folded over the pulse's cycle in sixteen parts, against
  // the same noise through the device at Depth 0: the noise's own wander is
  // in both and divides out, and what is left is the pulse. The band pulses
  // to under -40 dB (edges at 60 Hz and 4 kHz, read from 250 Hz to 1 kHz);
  // at the edges as they start, what lies an octave and more below Low and
  // above High ripples under 1 dB.
  {
    const std::vector<float> noisy = pink(20.0f, sr, 0.5f, 0x51DEu);
    auto folded = [&](bool wide_edges, float depth, double lo, double hi) {
      device.init(sr);
      if (wide_edges) wide(device);
      device.set_param(p::kDepth, depth);
      const Stereo out = run(device, noisy);
      return folded_power(band_of(out.left, lo, hi, sr), 8.0, sr, 16, at(1.0, sr));
    };
    // Parts 2 to 6 are the pulse's top, 11 to 14 its gap (it is on from 0 to
    // a half, with edges of a tenth of the period).
    auto read = [&](bool wide_edges, double lo, double hi, double* top_db, double* gap_db, double* ripple_db) {
      const std::vector<double> pulsed = folded(wide_edges, 1.0f, lo, hi);
      const std::vector<double> flat = folded(wide_edges, 0.0f, lo, hi);
      double high = -1.0e9, low = 1.0e9;
      *top_db = -1.0e9;
      *gap_db = -1.0e9;
      for (size_t b = 0; b < 16; ++b) {
        const double ratio = 10.0 * std::log10(pulsed[b] / flat[b] + 1.0e-30);
        high = std::max(high, ratio);
        low = std::min(low, ratio);
        if (b >= 2 && b <= 6) *top_db = std::max(*top_db, std::fabs(ratio));
        if (b >= 11 && b <= 14) *gap_db = std::max(*gap_db, ratio);
      }
      *ripple_db = high - low;
    };
    double top = 0.0, gap = 0.0, ripple = 0.0;
    read(true, 250.0, 1000.0, &top, &gap, &ripple);
    std::snprintf(label, sizeof label,
                  "%.0f Hz: pink noise, the band's gap is %.1f dB under the unpulsed band, under -40", sr, gap);
    EXPECT(gap < -40.0, label);
    std::snprintf(label, sizeof label, "%.0f Hz: and its top is within %.2f dB of the unpulsed band", sr, top);
    EXPECT(top < 0.2, label);
    read(false, 20.0, 100.0, &top, &gap, &ripple);
    std::snprintf(label, sizeof label, "%.0f Hz: pink noise under 100 Hz ripples %.2f dB (Low 200), under 1", sr,
                  ripple);
    EXPECT(ripple < 1.0, label);
    const double below = ripple;
    read(false, 2000.0, 8000.0, &top, &gap, &ripple);
    std::snprintf(label, sizeof label, "%.0f Hz: pink noise over 2 kHz ripples %.2f dB (High 1000), under 1", sr,
                  ripple);
    EXPECT(ripple < 1.0, label);
    const double above = ripple;
    read(false, 400.0, 500.0, &top, &gap, &ripple);
    std::printf("  measured at %.0f Hz, edges as they start: 400 to 500 Hz falls %.1f dB in the gap; ripple %.2f dB "
                "under 100 Hz, %.2f dB over 2 kHz\n",
                sr, gap, below, above);
    // The band's middle does pulse at the default edges: not as deep as the
    // tone above, because the two parts beside it overlap it.
    EXPECT(gap < -15.0, "at the edges as they start the band's middle still falls 15 dB and more");
  }

  // 7. Depth 0: the level of every frequency is as it came in. A tone at each
  // third of an octave from 25 Hz to 16 kHz, and at both crossovers, at three
  // settings of the edges; then pink noise as a whole.
  {
    struct Edges {
      float low, high;
    };
    double worst = 0.0;
    for (const Edges& e : {Edges{200.0f, 1000.0f}, Edges{60.0f, 400.0f}, Edges{400.0f, 4000.0f}}) {
      std::vector<double> tones;
      for (int n = 0; n <= 28; ++n) tones.push_back(25.0 * std::pow(2.0, n / 3.0));
      tones.push_back(e.low);
      tones.push_back(e.high);
      for (double hz : tones) {
        device.init(sr);
        device.set_param(p::kDepth, 0.0f);
        device.set_param(p::kLow, e.low);
        device.set_param(p::kHigh, e.high);
        const Stereo out = run(device, sine(static_cast<float>(hz), 0.7f, sr, 0.5f));
        const double level = db(tone_level(out.left, hz, sr, at(0.3, sr), at(0.7, sr)) / 0.5);
        worst = std::max(worst, std::fabs(level));
      }
    }
    std::snprintf(label, sizeof label,
                  "%.0f Hz: Depth 0: every third of an octave is within %.4f dB of the input, under 0.1", sr, worst);
    EXPECT(worst < 0.1, label);
    const std::vector<float> noisy = pink(8.0f, sr, 0.5f, 0xF1A7u);
    device.init(sr);
    device.set_param(p::kDepth, 0.0f);
    const Stereo out = run(device, noisy);
    const double moved = db(rms(out.left) / rms(noisy));
    std::snprintf(label, sizeof label, "%.0f Hz: Depth 0: pink noise comes out %.4f dB from its level", sr, moved);
    EXPECT(std::fabs(moved) < 0.02, label);
    EXPECT(worst_difference(out.left, noisy) > 0.01, "though not as the same samples: the split turns phase");
  }

  // 8. The level law across Rate at Depth 0.6: the loudness of what comes
  // out moves by under 1 dB from 0.5 to 40 a second, on pink noise and on a
  // tone that is all band. (At 40 the edge is held to a quarter of the
  // period, which takes 0.4 dB off the tone.)
  {
    const std::vector<float> noisy = pink(8.0f, sr, 0.5f, 0x1E7Eu);
    const std::vector<float> tone = sine(kProbeHz, 8.0f, sr, 0.5f);
    double noise_low = 1.0e9, noise_high = -1.0e9, tone_low = 1.0e9, tone_high = -1.0e9;
    for (float rate : {0.5f, 1.0f, 2.0f, 4.0f, 8.0f, 16.0f, 32.0f, 40.0f}) {
      device.init(sr);
      device.set_param(p::kRate, rate);
      const double on_noise = db(rms(run(device, noisy).left) / rms(noisy));
      device.init(sr);
      device.set_param(p::kRate, rate);
      const double on_tone = db(rms(run(device, tone).left) / rms(tone));
      noise_low = std::min(noise_low, on_noise);
      noise_high = std::max(noise_high, on_noise);
      tone_low = std::min(tone_low, on_tone);
      tone_high = std::max(tone_high, on_tone);
    }
    std::snprintf(label, sizeof label,
                  "%.0f Hz: Depth 0.6 across Rate: pink noise sits %.2f to %.2f dB under its input, a spread under 1",
                  sr, -noise_high, -noise_low);
    EXPECT(noise_high - noise_low < 1.0 && noise_high < 0.0, label);
    std::snprintf(label, sizeof label,
                  "%.0f Hz: Depth 0.6 across Rate: a 500 Hz tone sits %.2f to %.2f dB under its input, a spread under 1",
                  sr, -tone_high, -tone_low);
    EXPECT(tone_high - tone_low < 1.0 && tone_high < 0.0, label);
    std::printf("  measured at %.0f Hz, Depth 0.6: noise %.2f to %.2f dB, 500 Hz tone %.2f to %.2f dB against the input\n",
                sr, noise_low, noise_high, tone_low, tone_high);
  }
}

// --- controls thrown while sounding -------------------------------------------------------------

static const float kMain = 48000.0f;

static std::vector<float> tone(double hz, size_t count, double sr, float gain, bool quarter = false,
                               size_t first = 0) {
  std::vector<float> out(count);
  for (size_t i = 0; i < count; ++i) {
    const double angle = 2.0 * kPi * hz * static_cast<double>(first + i) / sr;
    out[i] = gain * static_cast<float>(quarter ? std::cos(angle) : std::sin(angle));
  }
  return out;
}

struct Throw {
  const char* what;
  int param;
  float from, to;
  float rate;        // the pulse's rate while the control is thrown (Rate's own: where it starts)
  float edge_ms;     // Edge while it is thrown (Edge's own: where it starts)
  double tone_hz;    // what is sounding
  bool gate;         // the pulse gate carries the change (Rate, Duty, Edge, Offset); else a smoother
  double edge_after_ms;  // the edge the pulse has after the throw, as held by the law
};

static void set_throw(BandPulse& d, const Throw& t) {
  d.set_param(p::kLow, 60.0f);
  d.set_param(p::kHigh, 4000.0f);
  d.set_param(p::kDepth, 1.0f);
  d.set_param(p::kRate, t.rate);
  d.set_param(p::kEdge, t.edge_ms);
  d.set_param(t.param, t.from);
}

// What one throw reads, the worst of eight places in the pulse's cycle and
// four moments at each (37 samples apart, so a jump cannot hide in a zero
// crossing of the tone).
struct Thrown {
  double sudden = -1.0;      // largest difference in the first 8 samples over the largest in 20 ms
  double kink = 0.0;         // largest third difference in the 20 ms after the throw
  double kink_without = 0.0; // the same passage with nothing thrown
  double step = 0.0;         // largest move of the gain itself in one sample
  double travel = 0.0;       // how far the gain went in 20 ms, at the most
};

static Thrown throw_control(const Throw& t) {
  Thrown read;
  const double period = kMain / t.rate;
  const size_t after = at(0.02, kMain);
  for (int place = 0; place < 8; ++place) {
    for (int moment = 0; moment < 4; ++moment) {
      // Whole cycles first, so the split has settled, then the place.
      const double cycles = std::ceil(0.3 * t.rate) + place / 8.0;
      const size_t before = static_cast<size_t>(cycles * period) + static_cast<size_t>(moment) * 37;
      // The sound as it is heard: the same passage with the throw and without.
      Stereo heard[2];
      Stereo joined[2];  // with the three samples before the throw, for the third difference
      for (int which = 0; which < 2; ++which) {
        device.init(kMain);
        set_throw(device, t);
        const Stereo head = run(device, tone(t.tone_hz, before, kMain, 0.5f));
        if (which == 1) device.set_param(t.param, t.to);
        heard[which] = run(device, tone(t.tone_hz, after, kMain, 0.5f, false, before));
        joined[which].left.assign(head.left.end() - 3, head.left.end());
        joined[which].right.assign(head.right.end() - 3, head.right.end());
        append(&joined[which], heard[which]);
      }
      double early = 0.0, all = 0.0;
      for (size_t i = 0; i < after; ++i) {
        const double d = std::max(std::fabs(static_cast<double>(heard[1].left[i]) - heard[0].left[i]),
                                  std::fabs(static_cast<double>(heard[1].right[i]) - heard[0].right[i]));
        all = std::max(all, d);
        if (i < 8) early = std::max(early, d);
      }
      // Only where the throw is heard at all (-54 dB under the tone).
      if (all > 1.0e-3) read.sudden = std::max(read.sudden, early / all);
      read.kink = std::max(read.kink, std::max(kink(joined[1].left), kink(joined[1].right)));
      read.kink_without = std::max(read.kink_without, std::max(kink(joined[0].left), kink(joined[0].right)));
      // The gain itself, by the sine and cosine pair, across the throw.
      Stereo pair[2];
      BandPulse* both[2] = {&device, &twin};
      for (int which = 0; which < 2; ++which) {
        BandPulse& d = *both[which];
        d.init(kMain);
        set_throw(d, t);
        const Stereo head = run(d, tone(t.tone_hz, before, kMain, 0.5f, which == 1));
        d.set_param(t.param, t.to);
        pair[which] = run(d, tone(t.tone_hz, after, kMain, 0.5f, which == 1, before));
        // One sample from before the throw, to measure the first step from.
        pair[which].left.insert(pair[which].left.begin(), head.left.back());
        pair[which].right.insert(pair[which].right.begin(), head.right.back());
      }
      double first[2] = {0.0, 0.0}, last[2] = {0.0, 0.0}, lowest_seen[2] = {1.0e9, 1.0e9},
             highest_seen[2] = {0.0, 0.0};
      for (size_t i = 0; i < pair[0].size(); ++i) {
        const double g[2] = {2.0 * std::hypot(pair[0].left[i], pair[1].left[i]),
                             2.0 * std::hypot(pair[0].right[i], pair[1].right[i])};
        for (int c = 0; c < 2; ++c) {
          if (i == 0) first[c] = g[c];
          if (i > 0) read.step = std::max(read.step, std::fabs(g[c] - last[c]));
          last[c] = g[c];
          lowest_seen[c] = std::min(lowest_seen[c], g[c]);
          highest_seen[c] = std::max(highest_seen[c], g[c]);
        }
      }
      (void)first;
      for (int c = 0; c < 2; ++c) read.travel = std::max(read.travel, highest_seen[c] - lowest_seen[c]);
    }
  }
  return read;
}

static void clicks() {
  char label[260];
  // Rate, Duty, Edge and Depth thrown end to end in the middle of a pulse on
  // a 110 Hz drone, with the band's edges at 60 Hz and 4 kHz so the drone is
  // band; Offset the same; Low on the drone and High on a 600 Hz tone, which
  // each takes in and out of the band.
  const Throw throws[] = {
      {"Rate 0.5 to 40", p::kRate, 0.5f, 40.0f, 0.5f, 12.0f, 110.0, true, 6.25},
      {"Rate 40 to 0.5", p::kRate, 40.0f, 0.5f, 40.0f, 12.0f, 110.0, true, 12.0},
      {"Rate 4 to 40", p::kRate, 4.0f, 40.0f, 4.0f, 12.0f, 110.0, true, 6.25},
      {"Duty 0.1 to 0.9", p::kDuty, 0.1f, 0.9f, 4.0f, 12.0f, 110.0, true, 12.0},
      {"Duty 0.9 to 0.1", p::kDuty, 0.9f, 0.1f, 4.0f, 12.0f, 110.0, true, 12.0},
      {"Edge 2 to 50", p::kEdge, 2.0f, 50.0f, 4.0f, 2.0f, 110.0, true, 50.0},
      {"Edge 50 to 12", p::kEdge, 50.0f, 12.0f, 4.0f, 50.0f, 110.0, true, 12.0},
      {"Edge 50 to 2", p::kEdge, 50.0f, 2.0f, 4.0f, 50.0f, 110.0, true, 2.0},
      {"Offset 0 to 180", p::kOffset, 0.0f, 180.0f, 4.0f, 12.0f, 110.0, true, 12.0},
      {"Offset 180 to 0", p::kOffset, 180.0f, 0.0f, 4.0f, 12.0f, 110.0, true, 12.0},
      {"Duty 0.9 to 0.1 at Edge 2", p::kDuty, 0.9f, 0.1f, 4.0f, 2.0f, 110.0, true, 2.0},
      {"Depth 0 to 1", p::kDepth, 0.0f, 1.0f, 4.0f, 12.0f, 110.0, false, 12.0},
      {"Depth 1 to 0", p::kDepth, 1.0f, 0.0f, 4.0f, 12.0f, 110.0, false, 12.0},
      {"Low 60 to 400", p::kLow, 60.0f, 400.0f, 4.0f, 12.0f, 110.0, false, 12.0},
      {"Low 400 to 60", p::kLow, 400.0f, 60.0f, 4.0f, 12.0f, 110.0, false, 12.0},
      {"High 400 to 4000", p::kHigh, 400.0f, 4000.0f, 4.0f, 12.0f, 600.0, false, 12.0},
      {"High 4000 to 400", p::kHigh, 4000.0f, 400.0f, 4.0f, 12.0f, 600.0, false, 12.0},
  };
  // What a 5 ms smoother moves in its first sample, as a part of its way.
  const double smoother_start = 1.0 - std::exp(-1.0 / (0.005 * kMain));
  for (const Throw& t : throws) {
    const Thrown read = throw_control(t);
    // The law for the gate: no faster than a quarter over the steepest part
    // of the edge the pulse has after the throw, half a cosine that long.
    const double edge_samples = t.edge_after_ms * 0.001 * kMain;
    const double gate_limit = kit::PulseGate::kHeadroom * 0.5 * kPi / edge_samples;
    // The edge the pulse had before it, held to a quarter of the period.
    const double edge_before = std::min(static_cast<double>(t.edge_ms), 250.0 / t.rate) * 0.001 * kMain;
    std::printf("  thrown: %-26s suddenness %.3f  kink %.5f (%.5f with nothing thrown)  largest gain step %.5f  "
                "travel %.2f\n",
                t.what, read.sudden, read.kink, read.kink_without, read.step, read.travel);
    std::snprintf(label, sizeof label, "%s is heard", t.what);
    EXPECT(read.sudden >= 0.0, label);
    if (t.gate) {
      // (Edge thrown longer is the one throw that slows the gain down: the
      // edge it is on may still be the steeper one for a moment.)
      const double fastest = std::max(gate_limit, t.param == p::kEdge ? 0.5 * kPi / edge_before : 0.0);
      std::snprintf(label, sizeof label,
                    "%s: the gain moves no faster than a quarter over its own edge (%.5f a sample, limit %.5f)",
                    t.what, read.step, fastest);
      EXPECT(read.step < 1.03 * fastest, label);
      // The corner where the edge the pulse was on gives way to that ramp,
      // under a tone of 0.5, leaves a third difference of the two slopes
      // together times the tone; a jump of the gain leaves the jump times
      // the tone, twenty times as much and more.
      const double corner = 0.5 * 1.3 * (0.5 * kPi / edge_before + gate_limit) + 0.001;
      std::snprintf(label, sizeof label, "%s: no kink past the corner of one more edge (%.5f, limit %.5f)", t.what,
                    read.kink, corner);
      EXPECT(read.kink < corner, label);
    } else {
      std::snprintf(label, sizeof label, "%s: no kink past a 5 ms smoother's first step (%.5f)", t.what,
                    read.kink);
      EXPECT(read.kink < 0.5 * 1.3 * smoother_start + 0.001, label);
    }
    // Under 0.15 of the change is there in the first 8 samples. The one
    // case let off is the pulse gate at the shortest Edge: an edge of 2 ms is
    // 96 samples long and one more edge like it, at the gate's limit, is 49,
    // so 8 of them are 0.163 of the way by the law itself. It is printed.
    if (!(t.gate && t.param != p::kEdge && t.edge_after_ms < 2.5)) {
      std::snprintf(label, sizeof label, "%s: suddenness %.3f, under 0.15", t.what, read.sudden);
      EXPECT(read.sudden < 0.15, label);
    }
  }
}

// --- silence, sleep and the clock ---------------------------------------------------------------

static void moved_in_silence(BandPulse& d) {
  d.set_param(p::kDepth, 0.9f);
  d.set_param(p::kDuty, 0.25f);
  d.set_param(p::kEdge, 30.0f);
  d.set_param(p::kOffset, 120.0f);
  d.set_param(p::kLow, 100.0f);
  d.set_param(p::kHigh, 3000.0f);
}

static void silences() {
  const float sr = kMain;
  char label[260];
  const int blocks[4] = {128, 1, 2048, 0};  // 0 is a ragged mix

  // 1. Silences stepped in 20 ms across the time the device takes to fall
  // idle (the split's ring, a tenth of a second and a block), and one of
  // half a minute, at blocks of 1, 128, 2048 and a ragged mix, each against
  // the 128-frame render. Every control is moved inside the silence, 4 ms
  // before the next tone, Rate among them. The device is first put off the
  // beat of anything that might count in blocks.
  {
    std::vector<float> gaps;
    for (int n = 1; n <= 20; ++n) gaps.push_back(0.02f * static_cast<float>(n));
    gaps.push_back(30.0f);
    const std::vector<float> first = sine(220.0f, 0.3f, sr, 0.5f);
    const std::vector<float> second = sine(330.0f, 1.2f, sr, 0.5f);
    double worst = 0.0;
    int slept = 0;
    for (float gap : gaps) {
      Stereo reference;
      for (int block : blocks) {
        device.init(sr);
        device.set_param(p::kRate, 7.0f);
        device.set_param(p::kDepth, 1.0f);
        device.set_param(p::kOffset, 90.0f);
        device.set_param(p::kLow, 60.0f);
        device.in_left()[0] = device.in_right()[0] = 0.25f;
        device.process(13);
        Stereo all = render_in(device, first, block);
        const Stereo quiet = render_in(device, silence(gap - 0.004f, sr), block);
        append(&all, quiet);
        device.set_param(p::kRate, 11.0f);
        moved_in_silence(device);
        append(&all, render_in(device, silence(0.004f, sr), block));
        append(&all, render_in(device, second, block));
        if (block == 128) {
          reference = all;
          if (!quiet.left.empty() && quiet.left.back() == 0.0f && quiet.right.back() == 0.0f) ++slept;
        } else {
          worst = std::max(worst, worst_difference(all, reference));
        }
      }
    }
    std::snprintf(label, sizeof label,
                  "across 21 silences the output does not depend on the block size (worst %g, under 1e-6)", worst);
    EXPECT(worst < 1.0e-6, label);
    std::printf("  measured: worst difference between block sizes across the stepped silences %g; the 128-frame "
                "render ended %d of 21 silences on exact zeros\n",
                worst, slept);
    EXPECT(slept >= 5 && slept <= 20, "the steps cross the moment the device falls idle");
  }

  // 2. A knob moved in silence is there when sound comes back: the tone
  // after the silence is, to the sample, what a device set that way from
  // init puts out. The device is asleep by then, put there off any block's
  // beat, and the tone begins at four places in the pulse's cycle.
  {
    const std::vector<float> first = sine(220.0f, 0.3f, sr, 0.5f);
    const std::vector<float> second = sine(330.0f, 0.6f, sr, 0.5f);
    double worst = 0.0;
    bool asleep = true;
    for (float gap : {0.5f, 0.537f, 0.61f, 0.73f}) {
      device.init(sr);
      device.in_left()[0] = device.in_right()[0] = 0.25f;
      device.process(13);
      run(device, first);
      const Stereo quiet = run(device, silence(gap, sr));
      asleep = asleep && peak(quiet.left, quiet.size() - 4800) == 0.0;
      moved_in_silence(device);
      run(device, silence(0.003f, sr));
      const Stereo heard = run(device, second);

      twin.init(sr);
      moved_in_silence(twin);
      twin.in_left()[0] = twin.in_right()[0] = 0.25f;
      twin.process(13);
      run(twin, first);
      run(twin, silence(gap, sr));
      run(twin, silence(0.003f, sr));
      const Stereo wanted = run(twin, second);
      worst = std::max(worst, worst_difference(heard, wanted));
      EXPECT(rms(heard.left) > 0.05, "the tone after the silence sounds");
    }
    EXPECT(asleep, "the device is asleep before the knobs are moved");
    std::snprintf(label, sizeof label,
                  "knobs moved while asleep have arrived at the next sound's first sample (worst %g, under 1e-6)",
                  worst);
    EXPECT(worst < 1.0e-6, label);
    // The check can tell: after a gap too short to count as new sound the
    // knobs are still on their way, as they would be under sound.
    device.init(sr);
    run(device, first);
    run(device, silence(0.05f, sr));
    moved_in_silence(device);
    const Stereo gliding = run(device, second);
    twin.init(sr);
    moved_in_silence(twin);
    run(twin, first);
    run(twin, silence(0.05f, sr));
    const Stereo there = run(twin, second);
    EXPECT(worst_difference(gliding, there, 0, 48) > 1.0e-3,
           "after a 50 ms gap nothing has been put in place: the two are not yet one");
  }

  // 3. The clock never stops: a tone after a silence of 0.3 s and of 30 s
  // finds the pulse where the count of samples since init puts it, at blocks
  // of 1, 128 and 2048.
  for (float gap : {0.3f, 30.0f}) {
    for (int block : {1, 128, 2048}) {
      const size_t lead = at(0.3, sr), rest = at(gap, sr), length = at(1.0, sr);
      Stereo pair[2];
      BandPulse* both[2] = {&device, &twin};
      for (int which = 0; which < 2; ++which) {
        BandPulse& d = *both[which];
        d.init(sr);
        wide(d);
        render_in(d, tone(kProbeHz, lead, sr, 0.5f, which == 1), block);
        render_in(d, std::vector<float>(rest, 0.0f), block);
        pair[which] = render_in(d, tone(kProbeHz, length, sr, 0.5f, which == 1), block);
      }
      std::vector<float> gain(length);
      for (size_t i = 0; i < length; ++i) gain[i] = 2.0f * std::hypot(pair[0].left[i], pair[1].left[i]);
      // The first pulse to begin 150 ms or more into the tone.
      const size_t start = lead + rest;
      const double period = sr / 8.0, half = 0.5 * 0.012 * sr;
      const double k = std::ceil((static_cast<double>(start) + 0.15 * sr - half) / period);
      const double wanted = k * period + half - static_cast<double>(start);
      const std::vector<double> up = crossings(gain, 0.5, true, at(0.15, sr) - 2);
      std::snprintf(label, sizeof label,
                    "after %.1f s of silence in blocks of %d the pulse begins %.3f samples from where the clock says",
                    gap, block, up.empty() ? 1.0e9 : up[0] - wanted);
      EXPECT(!up.empty() && std::fabs(up[0] - wanted) < 1.0, label);
    }
  }

  // 4. Silence in gives exact silence out: from init, and half a second
  // after a loud sound stops with the lower crossover at its slowest.
  {
    device.init(sr);
    const Stereo never = render(device, 1.0f, sr);
    EXPECT(peak(never.left) == 0.0 && peak(never.right) == 0.0, "silence in from init: exact silence out");
    device.init(sr);
    device.set_param(p::kLow, 60.0f);
    rng_state() = 0x5EEDu;
    run(device, noise(1.0f, sr, 0.9f));
    // What the split still rings a tenth of a second after the sound stops,
    // which is where it is cleared if sound comes back then.
    const Stereo ring = render(device, 0.1f, sr);
    const double left_over = std::max(peak(ring.left, ring.size() - 48), peak(ring.right, ring.size() - 48));
    std::printf("  measured: Low 60, a tenth of a second after loud noise stops the output is at %g (%.0f dB)\n",
                left_over, db(left_over));
    EXPECT(left_over < 1.0e-7, "a tenth of a second after the sound the split's ring is under -140 dB");
    render(device, 0.4f, sr);
    const Stereo after = render(device, 1.0f, sr);
    EXPECT(peak(after.left) == 0.0 && peak(after.right) == 0.0, "Low 60: exact silence half a second after the sound");
  }

  // 5. A second init equals the first, after the device has been used hard.
  {
    rng_state() = 0xD1CEu;
    const std::vector<float> noisy = noise(1.0f, sr, 0.5f);
    device.init(sr);
    for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, p::kParamMax[id]);
    run(device, noisy);
    for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, p::kParamMin[id]);
    run(device, noisy);
    render(device, 2.0f, sr);
    device.init(sr);
    const Stereo again = run(device, noisy);
    twin.init(sr);
    const Stereo fresh = run(twin, noisy);
    EXPECT(again.left == fresh.left && again.right == fresh.right, "a second init equals the first, to the bit");
  }
}

// --- bad input ----------------------------------------------------------------------------------

static void bad_input() {
  const float sr = kMain;
  char label[200];
  rng_state() = 0xBADu;
  const std::vector<float> good = noise(1.0f, sr, 0.5f);
  const float bads[4] = {std::nanf(""), INFINITY, -INFINITY, 1.0e30f};
  for (float bad : bads) {
    for (size_t count : {size_t{1}, size_t{480}, size_t{4800}}) {
      // The device hears the bad samples, its twin silence in their place.
      device.init(sr);
      twin.init(sr);
      device.set_param(p::kOffset, 90.0f);
      twin.set_param(p::kOffset, 90.0f);
      run(device, good);
      run(twin, good);
      const Stereo during = run(device, std::vector<float>(count, bad));
      run(twin, std::vector<float>(count, 0.0f));
      const Stereo a = run(device, good);
      const Stereo b = run(twin, good);
      std::snprintf(label, sizeof label, "%zu samples of %g at the input: the output stays finite and bounded",
                    count, bad);
      EXPECT(finite(during.left) && finite(during.right) && peak(during.left) < 2.0 && finite(a.left) &&
                 finite(a.right),
             label);
      std::snprintf(label, sizeof label,
                    "%zu samples of %g at the input: the next sound is what silence in their place leaves", count,
                    bad);
      EXPECT(a.left == b.left && a.right == b.right && rms(a.left) > 0.05, label);
    }
  }
  // One bad side does not spoil the other.
  device.init(sr);
  twin.init(sr);
  const Stereo a = run(device, good, std::vector<float>(good.size(), std::nanf("")));
  const Stereo b = run(twin, good, silence(1.0f, sr));
  EXPECT(a.left == b.left && peak(a.right) == 0.0, "a right side that is not a number is silence; the left is untouched");
}

// --- levels, peaks and cost ---------------------------------------------------------------------

static void levels() {
  const float sr = kMain;
  char label[260];

  // 1. As it starts the device only takes away: pink noise comes out a
  // little under its level, and never over it.
  {
    const std::vector<float> noisy = pink(8.0f, sr, 0.5f, 0x7E57u);
    device.init(sr);
    const Stereo out = run(device, noisy);
    const double moved = db(rms(out.left) / rms(noisy));
    std::snprintf(label, sizeof label, "defaults: pink noise comes out %.2f dB from its level (0 to 4 under)", moved);
    EXPECT(moved < 0.0 && moved > -4.0, label);
    std::printf("  measured: defaults on pink noise %.2f dB against the input\n", moved);
  }

  // 2. No make-up gain, so nothing is trimmed. A pulse only turns down, but
  // the split turns phase, which by itself moves the peaks of a sound whose
  // partials were lined up, and a peak the band was holding down can rise
  // when the band is turned down. A chord of bare saws and three struck
  // notes, each peaking at -1 dBFS, from twenty starts in the pulse's cycle
  // (the clock runs through the silence before each). Each setting is read
  // beside the same edges at Depth 0, the split alone: the figures are
  // printed, and what the pulse adds to the split's own is held under 1 dB.
  {
    struct Setting {
      const char* what;
      float depth, duty, offset, low, high, rate;
    };
    const Setting settings[5] = {
        {"as it starts", 0.6f, 0.5f, 0.0f, 200.0f, 1000.0f, 8.0f},
        {"Depth 1", 1.0f, 0.5f, 0.0f, 200.0f, 1000.0f, 8.0f},
        {"Depth 1, widest band", 1.0f, 0.5f, 0.0f, 60.0f, 4000.0f, 8.0f},
        {"Depth 1, short ticks, sides apart", 1.0f, 0.1f, 180.0f, 100.0f, 2000.0f, 3.0f},
        {"Depth 1, narrow band, fast", 1.0f, 0.5f, 0.0f, 400.0f, 400.0f, 40.0f},
    };
    const float in_peak = 0.8913f;  // -1 dBFS
    const char* names[2] = {"saws", "struck notes"};
    const std::vector<float> phrases[2] = {saws(1.5f, sr, in_peak), struck(1.5f, sr, in_peak)};
    double most_added = -1.0e9;
    for (const Setting& s : settings) {
      for (int which = 0; which < 2; ++which) {
        double worst[2] = {0.0, 0.0};  // pulsed, and the split alone
        for (int flat = 0; flat < 2; ++flat) {
          for (int start = 0; start < 20; ++start) {
            device.init(sr);
            device.set_param(p::kDepth, flat == 1 ? 0.0f : s.depth);
            device.set_param(p::kDuty, s.duty);
            device.set_param(p::kOffset, s.offset);
            device.set_param(p::kLow, s.low);
            device.set_param(p::kHigh, s.high);
            device.set_param(p::kRate, s.rate);
            run(device, std::vector<float>(static_cast<size_t>(start * sr / s.rate / 20.0), 0.0f));
            const Stereo out = run(device, phrases[which]);
            worst[flat] = std::max(worst[flat], std::max(peak(out.left), peak(out.right)));
          }
        }
        const double rise = db(worst[0] / in_peak), alone = db(worst[1] / in_peak);
        std::printf("  measured: %-34s %-12s worst peak %+.2f dB against the input's (%.2f dBFS%s); the split "
                    "alone %+.2f dB\n",
                    s.what, names[which], rise, db(worst[0]), worst[0] > 1.0 ? ", over full scale" : "", alone);
        most_added = std::max(most_added, rise - alone);
      }
    }
    std::snprintf(label, sizeof label,
                  "the pulse lifts no peak more than 1 dB over what the split alone leaves (most %.2f dB)", most_added);
    EXPECT(most_added < 1.0, label);
  }

  // 3. Cost, by CPU time: as it starts, at the fastest rate with the edges
  // moved every block (the split is retuned on every sample of the glide),
  // and asleep, where only the clock and the gates run.
  {
    rng_state() = 0xBEEFu;
    const std::vector<float> input = noise(20.0f, sr, 0.25f);
    device.init(sr);
    const double plain = cpu_cost("band-pulse (as it starts)", 20.0f, sr, [&] { run(device, input); });
    EXPECT(plain < 5.0, "as it starts: under 5 % of real time at 48 kHz, natively");
    device.init(sr);
    device.set_param(p::kRate, 40.0f);
    device.set_param(p::kOffset, 180.0f);
    device.set_param(p::kEdge, 50.0f);
    const double moving = cpu_cost("band-pulse (Rate 40, both edges moved every block)", 20.0f, sr, [&] {
      size_t done = 0;
      int n = 0;
      while (done < input.size()) {
        const int frames = static_cast<int>(std::min<size_t>(128, input.size() - done));
        device.set_param(p::kLow, 60.0f + 340.0f * static_cast<float>(n % 64) / 63.0f);
        device.set_param(p::kHigh, 400.0f + 3600.0f * static_cast<float>(n % 48) / 47.0f);
        ++n;
        for (int i = 0; i < frames; ++i) device.in_left()[i] = device.in_right()[i] = input[done + i];
        device.process(frames);
        done += frames;
      }
    });
    EXPECT(moving < 5.0, "with both edges moving: under 5 % of real time at 48 kHz, natively");
    device.init(sr);
    cpu_cost("band-pulse (asleep)", 20.0f, sr, [&] { render(device, 20.0f, sr); });
    const std::vector<float> faster = noise(20.0f, 96000.0f, 0.25f);
    device.init(96000.0f);
    cpu_cost("band-pulse (as it starts)", 20.0f, 96000.0f, [&] { run(device, faster); });
  }
}
