// Native harness for Ear Shift (cpp/devices/ear-shift). The conformance pass
// covers stability, silence when idle, block-size independence on steady
// noise and parameter abuse. The rest measures what the device is: which ear
// goes up and by how much, how far down the other sideband is, what Ears
// does, what passes outside the band and at what level, where the clock
// stands after a silence, and that nothing clicks or depends on the block
// size.
//
// Nobody listens here: every figure below is read off a render.

#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <ctime>
#include <vector>

#include "../devices/ear-shift/ear_shift.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::EarShift;
namespace p = livemix::ear_shift;
namespace kit = livemix::kit;

static EarShift device;
static EarShift twin;

static const float kRate = 48000.0f;
static const float kRates[3] = {44100.0f, 48000.0f, 96000.0f};

static size_t at(double seconds, double rate) { return static_cast<size_t>(seconds * rate + 0.5); }

static void set(EarShift& d, float beat, float ears, float low, float high) {
  d.set_param(p::kBeat, beat);
  d.set_param(p::kEars, ears);
  d.set_param(p::kLow, low);
  d.set_param(p::kHigh, high);
}

// Amplitude of the `hz` component over [from, to) under a Hann window: 1 for
// a full-scale sine on `hz`. Three turning phasors in place of a cosine a
// sample, so that a search over many frequencies stays quick.
static double level_at(const std::vector<float>& x, double hz, double rate, size_t from, size_t to) {
  to = std::min(to, x.size());
  if (to <= from) return 0.0;
  const size_t n = to - from;
  const double bin = 2.0 * kPi / static_cast<double>(n);
  const double w = 2.0 * kPi * hz / rate;
  double re[3] = {0.0, 0.0, 0.0}, im[3] = {0.0, 0.0, 0.0};
  double cr[3], ci[3], sr[3], si[3];
  for (int k = 0; k < 3; ++k) {
    const double wk = w + bin * (k - 1);
    cr[k] = 1.0;
    ci[k] = 0.0;
    sr[k] = std::cos(wk);
    si[k] = -std::sin(wk);
  }
  for (size_t i = 0; i < n; ++i) {
    const double v = x[from + i];
    for (int k = 0; k < 3; ++k) {
      re[k] += v * cr[k];
      im[k] += v * ci[k];
      const double next = cr[k] * sr[k] - ci[k] * si[k];
      ci[k] = cr[k] * si[k] + ci[k] * sr[k];
      cr[k] = next;
    }
  }
  const double sum_re = 0.5 * re[1] - 0.25 * (re[0] + re[2]);
  const double sum_im = 0.5 * im[1] - 0.25 * (im[0] + im[2]);
  return 4.0 * std::sqrt(sum_re * sum_re + sum_im * sum_im) / static_cast<double>(n);
}

// The strongest frequency in [lo, hi]: a scan a quarter of the window's
// resolution apart, then three finer passes round the best.
static double strongest(const std::vector<float>& x, double rate, double lo, double hi, size_t from,
                        size_t to) {
  const double seconds = static_cast<double>(to - from) / rate;
  double step = 0.25 / seconds;
  double best_hz = lo, best = -1.0;
  for (double hz = lo; hz <= hi; hz += step) {
    const double level = level_at(x, hz, rate, from, to);
    if (level > best) {
      best = level;
      best_hz = hz;
    }
  }
  for (int pass = 0; pass < 3; ++pass) {
    const double centre = best_hz;
    for (int i = -10; i <= 10; ++i) {
      const double hz = centre + step * i / 10.0;
      const double level = level_at(x, hz, rate, from, to);
      if (level > best) {
        best = level;
        best_hz = hz;
      }
    }
    step /= 10.0;
  }
  return best_hz;
}

// Phase in radians of the `hz` component over [from, to), no window, counted
// from the first sample of the window.
static double phase_at(const std::vector<float>& x, double hz, double rate, size_t from, size_t to) {
  double re = 0.0, im = 0.0;
  for (size_t i = from; i < to && i < x.size(); ++i) {
    const double turn = 2.0 * kPi * hz * static_cast<double>(i - from) / rate;
    re += x[i] * std::cos(turn);
    im -= x[i] * std::sin(turn);
  }
  return std::atan2(im, re);
}

// The lowest and the highest level a sound takes over [from, to), read in
// stretches of `window` samples a quarter of a stretch apart.
static void swing(const std::vector<float>& x, size_t from, size_t to, size_t window, double* least,
                  double* most) {
  *least = 1.0e9;
  *most = 0.0;
  for (size_t start = from; start + window <= to; start += std::max<size_t>(1, window / 4)) {
    const double level = rms(x, start, start + window);
    *least = std::min(*least, level);
    *most = std::max(*most, level);
  }
}

static double worst_difference(const std::vector<float>& a, const std::vector<float>& b, size_t from = 0) {
  double worst = 0.0;
  const size_t n = std::min(a.size(), b.size());
  for (size_t i = from; i < n; ++i) {
    const double d = std::fabs(static_cast<double>(a[i]) - b[i]);
    if (!(d <= worst)) worst = d;  // a difference that is not a number counts as the worst
  }
  return worst;
}

static double worst_difference(const Stereo& a, const Stereo& b, size_t from = 0) {
  return std::max(worst_difference(a.left, b.left, from), worst_difference(a.right, b.right, from));
}

static std::vector<float> mid_of(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (s.left[i] + s.right[i]);
  return out;
}

static std::vector<float> side_of(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (s.left[i] - s.right[i]);
  return out;
}

// `left` and `right` through the device in blocks of `block` frames; 0 is a
// ragged mix of sizes.
static Stereo run_blocks(EarShift& d, const std::vector<float>& left, const std::vector<float>& right,
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

static Stereo run_blocks(EarShift& d, const std::vector<float>& mono, int block) {
  return run_blocks(d, mono, mono, block);
}

// Three tones at once: one under the default band, one in it, one over it.
static std::vector<float> three_tones(float seconds, float rate) {
  std::vector<float> out(at(seconds, rate));
  for (size_t i = 0; i < out.size(); ++i) {
    const double t = static_cast<double>(i) / rate;
    out[i] = 0.25f * static_cast<float>(std::sin(2.0 * kPi * 100.0 * t) + std::sin(2.0 * kPi * 330.0 * t) +
                                        std::sin(2.0 * kPi * 1500.0 * t));
  }
  return out;
}

// How suddenly an event is heard: the same passage is rendered with it and
// without it, and the largest difference in the first 8 samples after it is
// taken as a share of the largest in the first 20 ms. Six places a twelfth of
// a second apart (the default beat's own turn takes a third of a second) and
// four moments a little apart at each, the worst of them, so that a jump
// cannot hide in a zero crossing or in a null of the beat. -1 when the event
// changed nothing.
template <typename Setup, typename Event>
static double suddenness(Setup setup, Event event, bool pure) {
  double worst = -1.0;
  for (int place = 0; place < 6; ++place) {
    for (int moment = 0; moment < 4; ++moment) {
      const size_t before =
          at(0.6 + static_cast<double>(place) / 18.0, kRate) + static_cast<size_t>(moment) * 37;
      const size_t after = 960;
      const std::vector<float> in =
          pure ? sine(220.0f, static_cast<float>(before + after) / kRate, kRate, 0.5f)
               : three_tones(static_cast<float>(before + after) / kRate, kRate);
      const std::vector<float> head(in.begin(), in.begin() + static_cast<long>(before));
      const std::vector<float> tail(in.begin() + static_cast<long>(before), in.end());
      Stereo heard[2];
      for (int which = 0; which < 2; ++which) {
        device.init(kRate);
        setup(device);
        run(device, head);
        if (which == 1) event(device);
        heard[which] = run(device, tail);
      }
      double early = 0.0, all = 0.0;
      for (size_t i = 0; i < std::min(after, heard[0].size()); ++i) {
        const double d = std::max(std::fabs(static_cast<double>(heard[1].left[i]) - heard[0].left[i]),
                                  std::fabs(static_cast<double>(heard[1].right[i]) - heard[0].right[i]));
        all = std::max(all, d);
        if (i < 8) early = std::max(early, d);
      }
      if (all > 1.0e-3) worst = std::max(worst, early / all);
    }
  }
  return worst;
}

// CPU time, not wall time: the machine is shared.
template <typename Work>
static void report_cpu(const char* label, float seconds, Work work) {
  const std::clock_t start = std::clock();
  work();
  const double used = static_cast<double>(std::clock() - start) / CLOCKS_PER_SEC;
  std::printf("%s CPU: %.2f%% of real time\n", label, 100.0 * used / seconds);
}

// With EAR_SHIFT_SAY set in the environment every check prints what it read,
// passed or not: the margins are then there to be seen.
static bool say() {
  static const bool on = std::getenv("EAR_SHIFT_SAY") != nullptr;
  return on;
}

#define CHECK(condition, message)                  \
  do {                                             \
    if (say()) std::printf("  read: %s\n", message); \
    EXPECT(condition, message);                    \
  } while (0)

#define CHECK_NEAR(actual, expected, tolerance, message)                                          \
  do {                                                                                            \
    if (say()) std::printf("  read: %s: %g (expected %g)\n", message, static_cast<double>(actual), \
                           static_cast<double>(expected));                                        \
    EXPECT_NEAR(actual, expected, tolerance, message);                                            \
  } while (0)

int main() {
  char label[200];

  Conformance spec;
  spec.name = "ear-shift";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 1.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // 1. The left ear goes up and the right goes down, each by half of Beat,
  // and the other sideband is 40 dB under. At the defaults on 440 Hz, and at
  // the bottom of the band at its lowest (a 60 Hz tone with Low at 60, where
  // the phase pair is nearest its own limit), at 44.1, 48 and 96 kHz.
  for (float rate : kRates) {
    device.init(rate);
    Stereo out = run(device, sine(440.0f, 5.0f, rate, 0.5f));
    // Four seconds: whole turns of 3 Hz and of 6 Hz, whole cycles of each tone.
    const size_t from = at(1.0, rate), to = at(5.0, rate);
    const double left_hz = strongest(out.left, rate, 432.0, 448.0, from, at(3.0, rate));
    const double right_hz = strongest(out.right, rate, 432.0, 448.0, from, at(3.0, rate));
    std::snprintf(label, sizeof label, "%.0f Hz: 440 Hz at Beat 6 reads 443 Hz in the left ear (%.3f)", rate,
                  left_hz);
    CHECK(std::fabs(left_hz - 443.0) < 0.02, label);
    std::snprintf(label, sizeof label, "%.0f Hz: and 437 Hz in the right ear (%.3f)", rate, right_hz);
    CHECK(std::fabs(right_hz - 437.0) < 0.02, label);
    const double up_left = level_at(out.left, 443.0, rate, from, to);
    const double down_left = level_at(out.left, 437.0, rate, from, to);
    const double up_right = level_at(out.right, 443.0, rate, from, to);
    const double down_right = level_at(out.right, 437.0, rate, from, to);
    std::snprintf(label, sizeof label,
                  "%.0f Hz: the other sideband is 40 dB under (left %.1f dB, right %.1f dB)", rate,
                  db(down_left / up_left), db(up_right / down_right));
    CHECK(db(down_left / up_left) < -40.0 && db(up_right / down_right) < -40.0, label);
    // The shifted tone is the band's share of the input: both crossovers are
    // well away from 440 Hz, so it is within half a dB of what came in.
    std::snprintf(label, sizeof label, "%.0f Hz: the shifted tone keeps its level (left %.2f dB, right %.2f dB)",
                  rate, db(up_left / 0.5), db(down_right / 0.5));
    CHECK(std::fabs(db(up_left / 0.5)) < 0.5 && std::fabs(db(down_right / 0.5)) < 0.5, label);
    std::printf("  %.0f Hz: what is left unshifted at 440 Hz: %.1f dB (left), %.1f dB (right)\n", rate,
                db(level_at(out.left, 440.0, rate, from, to) / 0.5),
                db(level_at(out.right, 440.0, rate, from, to) / 0.5));

    device.init(rate);
    set(device, 6.0f, 1.0f, 60.0f, 1000.0f);
    out = run(device, sine(60.0f, 5.0f, rate, 0.5f));
    const double low_up = level_at(out.left, 63.0, rate, from, to);
    const double low_down = level_at(out.left, 57.0, rate, from, to);
    const double low_up_right = level_at(out.right, 63.0, rate, from, to);
    const double low_down_right = level_at(out.right, 57.0, rate, from, to);
    std::snprintf(label, sizeof label,
                  "%.0f Hz: at the band's lowest edge the other sideband is 40 dB under (left %.1f, right %.1f)",
                  rate, db(low_down / low_up), db(low_up_right / low_down_right));
    CHECK(db(low_down / low_up) < -40.0 && db(low_up_right / low_down_right) < -40.0, label);
    // On the crossover itself half of the tone is in the band.
    std::snprintf(label, sizeof label, "%.0f Hz: a tone on the edge is half shifted (%.2f dB)", rate,
                  db(low_up / 0.5));
    CHECK_NEAR(db(low_up / 0.5), -6.02, 0.1, label);
  }

  // 2. Ears at 0: the two sides are one, a pulse at Beat, and that pulse is
  // the mid of the two-ear sound. Ears follows the family's law, the kit's
  // own gains: left = same·up + other·down.
  {
    const std::vector<float> in = sine(440.0f, 3.0f, kRate, 0.5f);
    device.init(kRate);
    Stereo two = run(device, in);
    device.init(kRate);
    device.set_param(p::kEars, 0.0f);
    Stereo one = run(device, in);
    CHECK(one.left == one.right, "Ears 0: the two sides are the same to the sample");
    const std::vector<float> mid = mid_of(two);
    std::snprintf(label, sizeof label, "Ears 0 is the mid of Ears 1 (worst %g)",
                  worst_difference(one.left, mid));
    CHECK(worst_difference(one.left, mid) < 1.0e-6, label);
    const size_t from = at(1.0, kRate), to = at(3.0, kRate);
    const double up = level_at(one.left, 443.0, kRate, from, to);
    const double down = level_at(one.left, 437.0, kRate, from, to);
    std::snprintf(label, sizeof label, "Ears 0: both sidebands at half height (%.2f dB, %.2f dB)",
                  db(up / 0.25), db(down / 0.25));
    CHECK(std::fabs(db(up / 0.25)) < 0.5 && std::fabs(db(down / 0.25)) < 0.5, label);
    // The pulse comes round Beat times a second: read off the level in
    // stretches of one cycle of the tone, it falls to nearly nothing six
    // times in a second and comes back.
    double least = 0.0, most = 0.0;
    swing(one.left, from, to, at(1.0 / 440.0, kRate) * 2, &least, &most);
    std::snprintf(label, sizeof label, "Ears 0: the pulse goes down %.1f dB in each ear", db(least / most));
    CHECK(db(least / most) < -20.0, label);
    int dips = 0;
    {
      const size_t window = at(0.01, kRate);
      bool under = false;
      for (size_t start = from; start + window <= from + at(1.0, kRate); start += window / 4) {
        const bool now = rms(one.left, start, start + window) < 0.3 * most;
        if (now && !under) ++dips;
        under = now;
      }
    }
    std::snprintf(label, sizeof label, "Ears 0: six pulses a second at Beat 6 (%d)", dips);
    CHECK(dips == 6, label);

    device.init(kRate);
    device.set_param(p::kEars, 0.5f);
    Stereo half = run(device, in);
    const kit::EarGains gains = kit::ear_gains(0.5f);
    Stereo law = two;
    for (size_t i = 0; i < law.size(); ++i) {
      kit::to_ears(gains, two.left[i], two.right[i], &law.left[i], &law.right[i]);
    }
    std::snprintf(label, sizeof label, "Ears 0.5 is the kit's law on the two-ear sound (worst %g)",
                  worst_difference(half, law));
    CHECK(worst_difference(half, law) < 1.0e-6, label);
    std::snprintf(label, sizeof label, "the mid does not move with Ears (worst %g)",
                  worst_difference(mid_of(half), mid));
    CHECK(worst_difference(mid_of(half), mid) < 1.0e-6, label);
    // Side over mid is 20·log10(Ears), on a tone well inside a wide band.
    for (float ears : {1.0f, 0.5f, 0.25f}) {
      device.init(kRate);
      set(device, 6.0f, ears, 60.0f, 2000.0f);
      Stereo out = run(device, sine(350.0f, 3.0f, kRate, 0.5f));
      const double ratio = db(rms(side_of(out), from, to) / rms(mid_of(out), from, to));
      std::snprintf(label, sizeof label, "Ears %.2f: side over mid", ears);
      CHECK_NEAR(ratio, 20.0 * std::log10(ears), 0.2, label);
    }
  }

  // 3. What is outside the band passes at its own level and where it was.
  // The split is fourth order, so a tone a factor of three from an edge has
  // 1/82 of itself in the band: it comes out 0.106 dB under, of which 0.107
  // is the unshifted tone and the rest the shifted trace.
  for (float rate : kRates) {
    for (float hz : {50.0f, 3000.0f, 30.0f, 8000.0f}) {
      device.init(rate);
      Stereo out = run(device, sine(hz, 4.0f, rate, 0.5f));
      const size_t from = at(1.0, rate), to = at(4.0, rate);
      const double left_hz = strongest(out.left, rate, hz - 8.0, hz + 8.0, from, at(2.0, rate));
      const double right_hz = strongest(out.right, rate, hz - 8.0, hz + 8.0, from, at(2.0, rate));
      std::snprintf(label, sizeof label, "%.0f Hz: %.0f Hz passes unshifted (left %.3f, right %.3f)", rate, hz,
                    left_hz, right_hz);
      CHECK(std::fabs(left_hz - hz) < 0.02 && std::fabs(right_hz - hz) < 0.02, label);
      const double whole_left = db(rms(out.left, from, to) / rms(sine(hz, 4.0f, rate, 0.5f), from, to));
      const double whole_right = db(rms(out.right, from, to) / rms(sine(hz, 4.0f, rate, 0.5f), from, to));
      const double tone = db(level_at(out.left, hz, rate, from, to) / 0.5);
      const double trace = db(level_at(out.left, hz + 3.0, rate, from, to) / 0.5);
      const bool far = hz < 40.0f || hz > 4000.0f;
      std::snprintf(label, sizeof label,
                    "%.0f Hz: %.0f Hz passes at its level (left %.3f dB, right %.3f dB, the tone itself %.3f dB)",
                    rate, hz, whole_left, whole_right, tone);
      CHECK(std::fabs(whole_left) < (far ? 0.03 : 0.12) && std::fabs(whole_right) < (far ? 0.03 : 0.12), label);
      std::snprintf(label, sizeof label, "%.0f Hz: the shifted trace of %.0f Hz is 37 dB under (%.1f dB)", rate,
                    hz, trace);
      CHECK(trace < -37.0, label);
    }
  }

  // 4. Up the whole range in steps of a sixth of an octave, and on the two
  // edges themselves, each tone read over whole turns of the beat: each
  // ear's level is flat within 1 dB more than an octave from either edge and
  // is 3 dB down on an edge, never more than 3.5. On an edge the tone is in
  // each ear both shifted and not, so it wavers there at half of Beat, to
  // silence: that is measured and printed, not held.
  {
    std::vector<double> tones;
    for (int i = 0; i <= 60; ++i) tones.push_back(20.0 * std::pow(2.0, static_cast<double>(i) / 6.0));
    tones.push_back(150.0);
    tones.push_back(1000.0);
    double worst_far = 0.0, worst_near = 0.0, edge_low = 0.0, edge_high = 0.0;
    double waver_low = 0.0, waver_high = 0.0;
    for (double hz : tones) {
      if (hz > 20000.0) continue;
      device.init(kRate);
      const std::vector<float> in = sine(static_cast<float>(hz), 2.0f, kRate, 0.5f);
      Stereo out = run(device, in);
      // One second: three turns of the half beat, six of the beat.
      const size_t from = at(1.0, kRate), to = at(2.0, kRate);
      const double base = rms(in, from, to);
      const double left = db(rms(out.left, from, to) / base);
      const double right = db(rms(out.right, from, to) / base);
      const double off = std::max(std::fabs(left), std::fabs(right));
      const bool far = hz < 75.0 || (hz > 300.0 && hz < 500.0) || hz > 2000.0;
      if (far) worst_far = std::max(worst_far, off);
      worst_near = std::max(worst_near, off);
      if (hz == 150.0 || hz == 1000.0) {
        double least = 0.0, most = 0.0;
        swing(out.left, from, to, at(2.0 / hz, kRate), &least, &most);
        (hz == 150.0 ? edge_low : edge_high) = std::min(left, right);
        (hz == 150.0 ? waver_low : waver_high) = db(least / most);
      }
    }
    std::snprintf(label, sizeof label, "more than an octave from an edge each ear is flat within 1 dB (worst %.2f)",
                  worst_far);
    CHECK(worst_far < 1.0, label);
    std::snprintf(label, sizeof label, "nowhere is an ear more than 3.5 dB off (worst %.2f)", worst_near);
    CHECK(worst_near < 3.5, label);
    std::snprintf(label, sizeof label, "on an edge an ear is 3 dB down (low %.2f dB, high %.2f dB)", edge_low,
                  edge_high);
    CHECK(std::fabs(edge_low + 3.01) < 0.3 && std::fabs(edge_high + 3.01) < 0.3, label);
    std::printf("  a tone on an edge wavers in each ear at half of Beat: low edge %.1f dB, high edge %.1f dB\n",
                waver_low, waver_high);
    CHECK(waver_low < -20.0 && waver_high < -20.0, "and that waver is deep, as the split's overlap makes it");
  }

  // 4b. On the crest of the beat (θ a whole number of turns) nothing is
  // shifted, and the device is then a plain turn of phase: a tone comes out
  // at the height it went in, on an edge and either side of it, at any Ears.
  // That holds only while the parts that pass round the shifter are turned as
  // the band is; were they not, the joins would notch here. Beat 0.5, read
  // over 40 ms round the crest at 4 s.
  for (float ears : {0.0f, 1.0f}) {
    double worst = 0.0;
    for (float hz : {150.0f, 1000.0f, 106.0f, 212.0f, 707.0f, 1414.0f, 61.0f, 2777.0f}) {
      device.init(kRate);
      set(device, 0.5f, ears, 150.0f, 1000.0f);
      Stereo out = run(device, sine(hz, 4.1f, kRate, 0.5f));
      const size_t from = at(3.98, kRate), to = at(4.02, kRate);
      worst = std::max(worst, std::fabs(db(peak(out.left, from, to) / 0.5)));
      worst = std::max(worst, std::fabs(db(peak(out.right, from, to) / 0.5)));
    }
    std::snprintf(label, sizeof label,
                  "Ears %.0f: on the crest of the beat every tone is at the height it came in (worst %.3f dB)", ears,
                  worst);
    // (17 dB was read here with the low and high parts passed round the pair.)
    CHECK(worst < 0.2, label);
  }

  // 5. The mono fold at Ears 1 pulses to silence at Beat: what speakers, one
  // speaker or a reverb fed from both sides make of the two-ear sound.
  {
    device.init(kRate);
    set(device, 6.0f, 1.0f, 60.0f, 2000.0f);
    Stereo out = run(device, sine(350.0f, 3.0f, kRate, 0.5f));
    const std::vector<float> mid = mid_of(out);
    double least = 0.0, most = 0.0;
    swing(mid, at(1.0, kRate), at(3.0, kRate), at(2.0 / 350.0, kRate), &least, &most);
    std::printf("  the mono fold at Ears 1 goes down %.1f dB at each pulse (350 Hz, band 60 to 2000 Hz)\n",
                db(least / most));
    CHECK(db(least / most) < -30.0, "folded to mono the two ears pulse to silence");
    // Each ear on its own is steady: the beat is only between them.
    swing(out.left, at(1.0, kRate), at(3.0, kRate), at(2.0 / 350.0, kRate), &least, &most);
    std::snprintf(label, sizeof label, "at Ears 1 each ear is steady on its own (ripple %.2f dB)",
                  db(most / least));
    CHECK(db(most / least) < 0.5, label);
  }

  // 6. Each channel is its own: what comes in on one side is never heard on
  // the other.
  {
    device.init(kRate);
    device.set_param(p::kEars, 0.5f);
    const std::vector<float> in = sine(440.0f, 1.0f, kRate, 0.5f);
    Stereo out = run(device, in, silence(1.0f, kRate));
    CHECK(peak(out.right) == 0.0 && rms(out.left) > 0.2, "a sound on the left stays on the left");
    device.init(kRate);
    out = run(device, silence(1.0f, kRate), in);
    CHECK(peak(out.left) == 0.0 && rms(out.right) > 0.2, "a sound on the right stays on the right");
    // And a side is the same whatever the other is doing: silence on one
    // side alone is not silence. One side stops after 0.3 s and the other
    // goes on for longer than the silence that empties the filters.
    const std::vector<float> longer = sine(440.0f, 1.5f, kRate, 0.5f);
    std::vector<float> stops = longer;
    for (size_t i = at(0.3, kRate); i < stops.size(); ++i) stops[i] = 0.0f;
    device.init(kRate);
    device.set_param(p::kEars, 0.5f);
    Stereo both = run(device, longer, longer);
    device.init(kRate);
    device.set_param(p::kEars, 0.5f);
    Stereo right_stops = run(device, longer, stops);
    device.init(kRate);
    device.set_param(p::kEars, 0.5f);
    Stereo left_stops = run(device, stops, longer);
    CHECK(right_stops.left == both.left, "the left is the same when the right falls silent");
    CHECK(left_stops.right == both.right, "the right is the same when the left falls silent");
  }

  // 7. Low and High move the band. A 200 Hz tone is shifted with Low under
  // it and passes with Low over it; a 1500 Hz tone likewise with High.
  {
    const size_t from = at(1.0, kRate), to = at(3.0, kRate);
    device.init(kRate);
    set(device, 6.0f, 1.0f, 60.0f, 1000.0f);
    Stereo out = run(device, sine(200.0f, 3.0f, kRate, 0.5f));
    CHECK_NEAR(strongest(out.left, kRate, 190.0, 210.0, from, to), 203.0, 0.02, "Low 60: 200 Hz is shifted");
    device.init(kRate);
    set(device, 6.0f, 1.0f, 400.0f, 1000.0f);
    out = run(device, sine(200.0f, 3.0f, kRate, 0.5f));
    CHECK_NEAR(strongest(out.left, kRate, 190.0, 210.0, from, to), 200.0, 0.02, "Low 400: 200 Hz passes");
    device.init(kRate);
    set(device, 6.0f, 1.0f, 150.0f, 2000.0f);
    out = run(device, sine(1500.0f, 3.0f, kRate, 0.5f));
    CHECK_NEAR(strongest(out.right, kRate, 1490.0, 1510.0, from, to), 1497.0, 0.02,
                "High 2000: 1500 Hz is shifted");
    device.init(kRate);
    set(device, 6.0f, 1.0f, 150.0f, 400.0f);
    out = run(device, sine(1500.0f, 3.0f, kRate, 0.5f));
    CHECK_NEAR(strongest(out.right, kRate, 1490.0, 1510.0, from, to), 1500.0, 0.02, "High 400: 1500 Hz passes");
    // With both at 400 the top is held half an octave over the bottom (the
    // kit's rule), so a band is still there: at its centre, 476 Hz, the
    // shifted tone is 7 dB under the input.
    device.init(kRate);
    set(device, 6.0f, 1.0f, 400.0f, 400.0f);
    out = run(device, sine(476.0f, 3.0f, kRate, 0.5f));
    CHECK_NEAR(db(level_at(out.left, 479.0, kRate, from, to) / 0.5), -7.0, 1.0,
                "Low and High both at 400: a band half an octave wide is left");
  }

  // 8. Beat is the difference between the ears, across its range and at
  // every rate.
  for (float rate : kRates) {
    for (float beat : {0.5f, 2.0f, 10.0f, 40.0f}) {
      device.init(rate);
      device.set_param(p::kBeat, beat);
      // Eight seconds read at the slow rates: 0.5 Hz apart is 0.25 Hz either
      // side of the tone. The left ear is looked for above the tone and the
      // right below it, each as far as Beat away.
      const float read = beat < 5.0f ? 8.0f : 1.0f;
      Stereo out = run(device, sine(440.0f, 1.0f + read, rate, 0.5f));
      const size_t from = at(1.0, rate), to = at(1.0 + read, rate);
      const double left_hz = strongest(out.left, rate, 440.0, 440.0 + beat, from, to);
      const double right_hz = strongest(out.right, rate, 440.0 - beat, 440.0, from, to);
      std::snprintf(label, sizeof label, "%.0f Hz: Beat %.1f puts the ears %.1f Hz apart (%.4f)", rate, beat, beat,
                    left_hz - right_hz);
      CHECK(std::fabs(left_hz - right_hz - beat) < 0.01 && left_hz > 440.0 && right_hz < 440.0, label);
    }
  }

  // 9. Silence in gives exact silence out, from the sample kArriveSeconds
  // after the last one that sounded, at every rate and block size; and what
  // that cuts off is far under anything heard.
  for (float rate : kRates) {
    const size_t hush = static_cast<size_t>(EarShift::kArriveSeconds * rate);
    for (int block : {128, 1, 2048, 0}) {
      device.init(rate);
      set(device, 6.0f, 0.7f, 60.0f, 2000.0f);
      rng_state() = 0xC0FFEEu;
      run_blocks(device, noise(0.5f, rate, 0.9f), block);
      Stereo rest = run_blocks(device, silence(2.0f, rate), block);
      size_t last = 0;
      for (size_t i = 0; i < rest.size(); ++i) {
        if (rest.left[i] != 0.0f || rest.right[i] != 0.0f) last = i + 1;
      }
      std::snprintf(label, sizeof label,
                    "%.0f Hz, blocks of %d: exact silence from %zu samples after the input (last sound at %zu)", rate,
                    block, hush, last);
      CHECK(last <= hush && last > hush / 2, label);
      const double cut = std::max(peak(rest.left, hush - at(0.01, rate), hush),
                                  peak(rest.right, hush - at(0.01, rate), hush));
      std::snprintf(label, sizeof label, "%.0f Hz: the last 10 ms before the silence are under -160 dBFS (%g)",
                    rate, cut);
      CHECK(cut < 1.0e-8, label);
    }
  }

  // 10. The clock never stops. Two tones with a silence between them: the
  // second finds the beat where a count of samples from init says it is,
  // whether the silence was 0.3 s (awake all through) or 30 s (asleep), at
  // blocks of 1, 128 and 2048 and a ragged mix. The up tone in the left ear
  // and the down tone in the right are 2θ apart, θ = π · Beat · t.
  for (float gap : {0.3f, 30.0f}) {
    Stereo reference;
    for (int block : {128, 1, 2048, 0}) {
      device.init(kRate);
      // Off the beat of anything that counts in blocks.
      device.in_left()[0] = device.in_right()[0] = 0.25f;
      device.process(13);
      const std::vector<float> first = sine(220.0f, 0.3f, kRate, 0.5f);
      const std::vector<float> rest(at(gap, kRate), 0.0f);
      run_blocks(device, first, block);
      run_blocks(device, rest, block);
      Stereo after = run_blocks(device, sine(440.0f, 1.5f, kRate, 0.5f), block);
      if (block == 128) {
        reference = after;
        const size_t before = 13 + first.size() + rest.size();
        const size_t from = at(0.5, kRate), to = at(1.5, kRate);
        const double turn = phase_at(after.left, 443.0, kRate, from, to) -
                            phase_at(after.right, 437.0, kRate, from, to);
        const double expected = 2.0 * kPi * 6.0 * static_cast<double>(before + from) / kRate;
        const double off = std::remainder(turn - expected, 2.0 * kPi);
        std::snprintf(label, sizeof label,
                      "after %.1f s of silence the beat is where the clock says (%.5f rad off)", gap, off);
        CHECK(std::fabs(off) < 0.01, label);
      } else {
        std::snprintf(label, sizeof label, "after %.1f s of silence, blocks of %d give what blocks of 128 give (%g)",
                      gap, block, worst_difference(after, reference));
        CHECK(worst_difference(after, reference) < 1.0e-6, label);
      }
    }
    // And it is what a device that never rested puts out: one that heard a
    // steady offset through the gap, once its filters have forgotten it. Two
    // histories in float sections agree to about -118 dBFS and no closer
    // (1.2e-6 was read here, for good); a clock one sample out reads 1e-4.
    twin.init(kRate);
    twin.in_left()[0] = twin.in_right()[0] = 0.25f;
    twin.process(13);
    run(twin, sine(220.0f, 0.3f, kRate, 0.5f));
    run(twin, std::vector<float>(at(gap, kRate), 0.25f));
    Stereo never = run(twin, sine(440.0f, 1.5f, kRate, 0.5f));
    std::snprintf(label, sizeof label, "after %.1f s of silence the sound is that of a device that never rested (%g)",
                  gap, worst_difference(never, reference, at(0.5, kRate)));
    CHECK(worst_difference(never, reference, at(0.5, kRate)) < 1.0e-5, label);
  }

  // 11. A phrase with a silence in it, the silence stepped 20 ms at a time
  // across the stretch where the device hushes and then falls idle, with a
  // few short ones and one long one, and every control moved inside the
  // silence 5 ms before the next note: blocks of 1, of 2048 and a ragged mix
  // give what blocks of 128 give.
  {
    std::vector<float> gaps = {0.003f, 0.05f, 0.3f, 5.0f};
    for (int i = 0; i <= 45; ++i) gaps.push_back(0.4f + 0.02f * static_cast<float>(i));
    double worst = 0.0;
    float worst_gap = 0.0f;
    for (float gap : gaps) {
      const std::vector<float> first = sine(220.0f, 0.3f, kRate, 0.5f);
      const std::vector<float> second = three_tones(0.6f, kRate);
      Stereo reference;
      for (int block : {128, 1, 2048, 0}) {
        device.init(kRate);
        device.in_left()[0] = device.in_right()[0] = 0.25f;
        device.process(13);
        Stereo all = run_blocks(device, first, block);
        const float moved = gap > 0.005f ? gap - 0.005f : 0.0f;
        all = concat(all, run_blocks(device, silence(moved, kRate), block));
        set(device, 9.0f, 0.4f, 250.0f, 600.0f);
        all = concat(all, run_blocks(device, silence(gap - moved, kRate), block));
        all = concat(all, run_blocks(device, second, block));
        if (block == 128) {
          reference = all;
        } else {
          const double d = worst_difference(all, reference);
          if (d > worst) {
            worst = d;
            worst_gap = gap;
          }
        }
      }
      CHECK(rms(reference.left, reference.size() - at(0.3, kRate)) > 0.05, "and the second note sounds");
    }
    std::snprintf(label, sizeof label,
                  "across %zu silences the output does not depend on the block size (worst %g, at %.3f s)",
                  gaps.size(), worst, worst_gap);
    CHECK(worst < 1.0e-6, label);
  }

  // 12. A knob moved while the device is idle is there when sound comes
  // back: the next note is, to the sample, that of a device set that way from
  // the start. The device is put to rest off the beat of anything that counts
  // in blocks. Beat is left alone: it sets how fast the clock runs, so a
  // change of it is in where the clock stands, and that is check 10's.
  {
    const std::vector<float> first = sine(220.0f, 0.3f, kRate, 0.5f);
    const std::vector<float> second = three_tones(1.0f, kRate);
    device.init(kRate);
    device.in_left()[0] = device.in_right()[0] = 0.25f;
    device.process(13);
    run(device, first);
    // The silences are counted in samples: one sample more or less on one of
    // the two devices and their clocks are apart (that reads 1e-4 here).
    Stereo rest = run(device, std::vector<float>(96000, 0.0f));
    CHECK(peak(rest.left, at(1.5, kRate)) == 0.0 && peak(rest.right, at(1.5, kRate)) == 0.0,
           "idle 1.5 s after the note");
    set(device, 6.0f, 0.3f, 300.0f, 1500.0f);
    run(device, std::vector<float>(4811, 0.0f));
    Stereo woken = run(device, second);

    twin.init(kRate);
    set(twin, 6.0f, 0.3f, 300.0f, 1500.0f);
    twin.in_left()[0] = twin.in_right()[0] = 0.25f;
    twin.process(13);
    run(twin, first);
    run(twin, std::vector<float>(96000 + 4811, 0.0f));
    Stereo set_from_start = run(twin, second);
    std::snprintf(label, sizeof label, "knobs moved in silence are there on the next note (worst %g)",
                  worst_difference(woken, set_from_start));
    CHECK(worst_difference(woken, set_from_start) < 1.0e-6, label);
    CHECK(rms(woken.left) > 0.1, "and that note sounds");
    // The settings did arrive: 330 Hz is in the new band, 100 and 1500 Hz are
    // on its edges or outside, and the side is at Ears 0.3.
    device.init(kRate);
    Stereo defaults = run(device, second);
    CHECK(worst_difference(woken, defaults) > 0.05, "and it is not the note the defaults give");
  }

  // 13. No control clicks when it is thrown from one end to the other while
  // sound is passing, wherever the beat stands.
  {
    // The limit for each control stands between what the device reads and
    // what it read with that control's smoothing taken out: Ears 0.05 against
    // 1.0; Low and High 0.003 at the most against 0.15 to 0.32 (a crossover
    // that jumps still leaves its filters' states where they were, so the
    // jump is small at first). Beat has no smoother: it sets the rate of a
    // phase that is summed, so a throw bends the turn (0.01).
    struct Throw {
      const char* name;
      int id;
      float from;
      float to;
      double limit;
    };
    const Throw throws[8] = {
        {"Ears 1 to 0", p::kEars, 1.0f, 0.0f, 0.15},          {"Ears 0 to 1", p::kEars, 0.0f, 1.0f, 0.15},
        {"Low 60 to 400", p::kLow, 60.0f, 400.0f, 0.03},      {"Low 400 to 60", p::kLow, 400.0f, 60.0f, 0.03},
        {"High 400 to 2000", p::kHigh, 400.0f, 2000.0f, 0.03}, {"High 2000 to 400", p::kHigh, 2000.0f, 400.0f, 0.03},
        {"Beat 0.5 to 40", p::kBeat, 0.5f, 40.0f, 0.05},      {"Beat 40 to 0.5", p::kBeat, 40.0f, 0.5f, 0.05},
    };
    for (const Throw& t : throws) {
      for (bool pure : {true, false}) {
        const double sudden = suddenness([&](EarShift& d) { d.set_param(t.id, t.from); },
                                         [&](EarShift& d) { d.set_param(t.id, t.to); }, pure);
        std::snprintf(label, sizeof label, "%s on %s is not sudden (%.3f of the change in 8 samples)", t.name,
                      pure ? "a 220 Hz tone" : "three tones", sudden);
        CHECK(sudden >= 0.0 && sudden < t.limit, label);
      }
    }
  }

  // 14. Bad input: a sample that is not a number, an infinite one and 1e30 do
  // not stay in the device. The next block is finite, the sound after it is
  // the sound of a device that never saw them, and silence returns.
  for (float rate : kRates) {
    const float bad[4] = {std::nanf(""), INFINITY, -INFINITY, 1.0e30f};
    for (float value : bad) {
      device.init(rate);
      run(device, sine(440.0f, 0.2f, rate, 0.5f));
      for (int i = 0; i < kBlock; ++i) {
        device.in_left()[i] = (i % 3 == 0) ? value : 0.1f;
        device.in_right()[i] = (i % 5 == 0) ? -value : 0.1f;
      }
      device.process(kBlock);
      bool finite_block = true;
      for (int i = 0; i < kBlock; ++i) {
        finite_block = finite_block && std::isfinite(device.out_left()[i]) && std::isfinite(device.out_right()[i]);
      }
      Stereo next = run(device, sine(440.0f, 1.5f, rate, 0.5f));
      std::snprintf(label, sizeof label, "%.0f Hz: %g at the input leaves finite sound (peak %g)", rate,
                    static_cast<double>(value), std::max(peak(next.left), peak(next.right)));
      CHECK(finite_block && finite(next.left) && finite(next.right), label);
      // The same 1.7 s on a device that heard silence in place of the bad block.
      twin.init(rate);
      run(twin, sine(440.0f, 0.2f, rate, 0.5f));
      render(twin, static_cast<float>(kBlock) / rate, rate);
      Stereo clean = run(twin, sine(440.0f, 1.5f, rate, 0.5f));
      std::snprintf(label, sizeof label, "%.0f Hz: a second after %g the sound is as if it never came (%g)", rate,
                    static_cast<double>(value), worst_difference(next, clean, at(1.0, rate)));
      CHECK(worst_difference(next, clean, at(1.0, rate)) < 1.0e-5, label);
      Stereo rest = render(device, 1.5f, rate);
      CHECK(peak(rest.left, at(1.0, rate)) == 0.0 && peak(rest.right, at(1.0, rate)) == 0.0,
             "and silence follows it");
    }
    // A whole second of them is silence, not a stuck state.
    device.init(rate);
    Stereo stuck = run(device, std::vector<float>(at(1.0, rate), std::nanf("")));
    CHECK(peak(stuck.left) == 0.0 && peak(stuck.right) == 0.0 && finite(stuck.left),
           "a stream that is not a number gives silence");
  }

  // 15. Levels. The device turns phase and shifts a band; it has no gain.
  // What is in the band and what is outside it no longer add as one sound in
  // an ear, so each ear's level over a whole turn of the beat is the sum of
  // the two powers: the input's level away from the edges, 3 dB under on an
  // edge, never over. Noise loses what lies near the two edges, a tone loses
  // by the split's own law, and no setting of Ears makes anything louder. The
  // peaks of a sound do rise, since its phases are turned: measured, printed
  // and held under 9 dB.
  for (float rate : kRates) {
    rng_state() = 0xFACEu;
    const std::vector<float> in = noise(6.0f, rate, 0.5f);
    const size_t from = at(1.0, rate);
    for (float ears : {1.0f, 0.5f, 0.0f}) {
      device.init(rate);
      device.set_param(p::kEars, ears);
      Stereo out = run(device, in);
      const double left = db(rms(out.left, from) / rms(in, from));
      const double right = db(rms(out.right, from) / rms(in, from));
      std::snprintf(label, sizeof label,
                    "%.0f Hz, Ears %.1f: noise is no louder than it came and little quieter (left %.3f dB, right %.3f dB)",
                    rate, ears, left, right);
      CHECK(left < 0.02 && right < 0.02 && left > -0.4 && right > -0.4, label);
      if (ears == 1.0f) {
        std::printf("  %.0f Hz: noise at the defaults %.3f dB, its peak %.2f dB over the input's\n", rate, left,
                    db(std::max(peak(out.left, from), peak(out.right, from)) / peak(in, from)));
      }
    }
    // A 220 Hz tone, half an octave over the default Low: 1/(1 + x) of it
    // passes unshifted and x/(1 + x) is shifted, x = (220/150)^4.
    const double x = std::pow(220.0 / 150.0, 4.0);
    const double y = std::pow(220.0 / 1000.0, 4.0);
    const double shifted = x / (1.0 + x) / (1.0 + y);
    const double passed = 1.0 - shifted;
    const std::vector<float> tone = sine(220.0f, 4.0f, rate, 0.5f);
    device.init(rate);
    Stereo out = run(device, tone);
    const double level = db(rms(out.left, from) / rms(tone, from));
    std::snprintf(label, sizeof label, "%.0f Hz: a 220 Hz tone at the defaults is the split's two powers", rate);
    CHECK_NEAR(level, db(std::sqrt(shifted * shifted + passed * passed)), 0.1, label);
    // A tone well inside a wide band, the same pulse in both ears.
    device.init(rate);
    set(device, 6.0f, 0.0f, 60.0f, 2000.0f);
    out = run(device, sine(350.0f, 6.0f, rate, 0.5f));
    const double pulsed = db(rms(out.left, from) / rms(sine(350.0f, 6.0f, rate, 0.5f), from));
    std::snprintf(label, sizeof label, "%.0f Hz: at Ears 0 a tone in the band loses 3 dB to the pulse (%.2f dB)",
                  rate, pulsed);
    CHECK_NEAR(pulsed, -3.01, 0.15, label);
  }
  {
    // A square wave is the hard case for peaks: its edges are spread out.
    std::vector<float> square(at(3.0, kRate));
    for (size_t i = 0; i < square.size(); ++i) square[i] = (i / 109) % 2 == 0 ? 0.5f : -0.5f;
    device.init(kRate);
    Stereo out = run(device, square);
    const double rise = db(std::max(peak(out.left), peak(out.right)) / 0.5);
    const double level = db(rms(out.left, at(1.0, kRate)) / 0.5);
    std::printf("  a 220 Hz square wave peaks %.2f dB over itself; its level in an ear is %.3f dB\n", rise, level);
    CHECK(rise < 9.0, "the peaks of a square wave rise by less than 9 dB");
    CHECK(level < 0.02 && level > -3.1, "and its level in an ear is between the input's and 3 dB under");
  }

  // 16. A second init is the first: after a long run with every control
  // moved, init gives the render of a new device, clock and all.
  {
    const std::vector<float> in = three_tones(1.0f, kRate);
    twin.init(kRate);
    Stereo fresh = run(twin, in);
    device.init(kRate);
    set(device, 31.0f, 0.2f, 333.0f, 777.0f);
    rng_state() = 0xABCDu;
    run(device, noise(1.7f, kRate, 0.8f));
    render(device, 0.31f, kRate);
    device.init(kRate);
    Stereo again = run(device, in);
    CHECK(again.left == fresh.left && again.right == fresh.right, "a second init is the first, to the bit");
  }

  // 17. Cost, as CPU time: the defaults, and with Low and High never still
  // (the crossovers are worked out again at every sample while they move).
  {
    rng_state() = 0xBEEFu;
    const std::vector<float> input = noise(20.0f, kRate, 0.25f);
    device.init(kRate);
    report_cost("ear-shift (defaults)", 20.0f, kRate, [&] { run(device, input); });
    device.init(kRate);
    report_cpu("ear-shift (defaults)", 20.0f, [&] { run(device, input); });
    device.init(kRate);
    report_cpu("ear-shift (Low and High moved every block)", 20.0f, [&] {
      size_t done = 0;
      int turn = 0;
      while (done < input.size()) {
        const int frames = static_cast<int>(std::min<size_t>(kBlock, input.size() - done));
        device.set_param(p::kLow, (turn & 1) ? 60.0f : 400.0f);
        device.set_param(p::kHigh, (turn & 1) ? 2000.0f : 400.0f);
        ++turn;
        for (int i = 0; i < frames; ++i) device.in_left()[i] = device.in_right()[i] = input[done + i];
        device.process(frames);
        done += frames;
      }
    });
    rng_state() = 0xBEEFu;
    const std::vector<float> input96 = noise(20.0f, 96000.0f, 0.25f);
    device.init(96000.0f);
    report_cpu("ear-shift (defaults, 96 kHz)", 20.0f, [&] { run(device, input96); });
    device.init(kRate);
    report_cpu("ear-shift (idle)", 20.0f, [&] { render(device, 20.0f, kRate); });
  }

  return finish("ear-shift");
}
