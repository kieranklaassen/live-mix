// Native harness for Tierce Bells (cpp/devices/tierce-bells). The conformance
// pass covers silence, stealing, parameter abuse and other sample rates; the
// rest measures what makes it a bell with a movable third: the thirds a scale
// gives, the named thirds and their deciems, the suspension inside a strike,
// the hum's ratios, the beat of the doublets, the decay laws, one bell to a
// pitch, the four kinds of bell, and the faults instruments have had before.

#include "../devices/tierce-bells/tierce_bells.h"
#include <limits>

#include "support/test_kit.h"

using namespace testkit;
using livemix::TierceBells;
namespace p = livemix::tierce_bells;

static TierceBells device;
static const float kRate = 48000.0f;
static char label[240];

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }
static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }
static double loudest(const Stereo& s) { return std::max(peak(s.left), peak(s.right)); }
static float note_hz(float midi) { return 440.0f * std::exp2((midi - 69.0f) / 12.0f); }

// A bell that is easy to read: no beats, no spread, no choke, third by hand.
static void plain(TierceBells& d, int bell = TierceBells::kTower, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kBell, static_cast<float>(bell));
  d.set_param(p::kFollow, 0.0f);
  d.set_param(p::kDoublet, 0.0f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kRelease, 0.0f);
  d.set_param(p::kVolume, 0.0f);
}

// Level of the `hz` component over n samples from `from`: a Hann-windowed DFT
// bin by a rotating phasor (no trig per sample).
static double bin_level(const std::vector<float>& x, double rate, double hz, size_t from, size_t n) {
  const double w = 2.0 * kPi * hz / rate, ww = 2.0 * kPi / static_cast<double>(n);
  const double cr = std::cos(w), ci = std::sin(w), wr = std::cos(ww), wi = std::sin(ww);
  double pr = 1.0, pi = 0.0, hr = 1.0, hi = 0.0, re = 0.0, im = 0.0, sum = 0.0;
  for (size_t i = 0; i < n && from + i < x.size(); ++i) {
    const double window = 0.5 - 0.5 * hr;
    re += window * x[from + i] * pr;
    im -= window * x[from + i] * pi;
    sum += window;
    double t = pr * cr - pi * ci;
    pi = pr * ci + pi * cr;
    pr = t;
    t = hr * wr - hi * wi;
    hi = hr * wi + hi * wr;
    hr = t;
  }
  return 2.0 * std::sqrt(re * re + im * im) / sum;
}

// The strongest component within `reach` (a share) of `guess`.
static double fine_pitch(const std::vector<float>& x, double rate, double guess, size_t from, size_t to,
                         double reach = 0.02) {
  to = std::min(to, x.size());
  const size_t total = to - from;
  double f = guess, span = guess * reach;
  for (int stage = 0; stage < 12 && span > guess * 2.0e-6; ++stage) {
    const size_t n = std::min(total, static_cast<size_t>(3.0 * rate / span));
    double best = -1.0, best_f = f;
    for (int i = -10; i <= 10; ++i) {
      const double hz = f + span * i / 10.0;
      const double level = bin_level(x, rate, hz, from, n);
      if (level > best) {
        best = level;
        best_f = hz;
      }
    }
    f = best_f;
    span *= n == total ? 0.2 : 0.3;
  }
  return f;
}

// Ring time (to -60 dB) of the `hz` component between two moments.
static double ring_time(const std::vector<float>& x, double rate, double hz, double t0, double t1, double window) {
  const size_t n = at(window, rate);
  const double a = bin_level(x, rate, hz, at(t0, rate), n), b = bin_level(x, rate, hz, at(t1, rate), n);
  return b < a ? 60.0 * (t1 - t0) / (db(a) - db(b)) : 1.0e9;
}

// How sudden an event is: the render with it against the render without it,
// the share of the largest change in 20 ms that is there after 8 samples. The
// worst of eight moments a little apart.
template <typename Setup, typename Event>
static double suddenness(Setup setup, Event event) {
  double worst = 0.0;
  for (int trial = 0; trial < 8; ++trial) {
    Stereo with, without;
    for (int pass = 0; pass < 2; ++pass) {
      setup(device);
      render(device, 0.4f, kRate);
      device.process(64 + trial * 13);
      if (pass == 1) event(device);
      (pass == 1 ? with : without) = render(device, 0.02f, kRate);
    }
    double early = 0.0, all = 0.0;
    for (size_t i = 0; i < with.size(); ++i) {
      const double d = std::fabs(static_cast<double>(with.left[i]) - without.left[i]);
      if (i < 8) early = std::max(early, d);
      all = std::max(all, d);
    }
    if (all > 1.0e-7) worst = std::max(worst, early / all);
  }
  return worst;
}

static double worst_difference(const Stereo& a, const Stereo& b) {
  double worst = 0.0;
  for (size_t i = 0; i < std::min(a.size(), b.size()); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

// --- thirds ---------------------------------------------------------------------------------

static const double kMinor = 1200.0 * std::log2(6.0 / 5.0), kMajor = 1200.0 * std::log2(5.0 / 4.0);

// Where the third of a ringing bell of `hz` is, in cents above the prime.
static double measured_third(const std::vector<float>& x, double hz, double guess, double from, double to) {
  return cents(fine_pitch(x, kRate, hz * std::exp2(guess / 1200.0), at(from), at(to), 0.03), hz);
}

static void test_follow() {
  // C major, the keys C F A D G E C: the degrees' own thirds.
  const int keys[7] = {60, 65, 69, 62, 67, 64, 72};
  const double want[7] = {kMajor, kMajor, kMinor, kMinor, kMajor, kMinor, kMajor};
  for (float sharp : {0.0f, 0.3f, -0.3f}) {
    double worst = 0.0;
    std::printf("C major, %+.0f ct:", 100.0 * sharp);
    for (int k = 0; k < 7; ++k) {
      device.init(kRate);  // the default patch, Follow as it ships
      device.set_param(p::kDoublet, 0.0f);
      device.set_param(p::kRelease, 0.0f);
      const double hz = note_hz(static_cast<float>(keys[k]) + sharp);
      device.note_on(1, static_cast<float>(hz), 0.8f);
      Stereo out = render(device, 1.5f, kRate);
      const double third = measured_third(out.left, hz, 350.0, 0.1, 1.5);
      std::printf(" %.2f", third);
      worst = std::max(worst, std::fabs(third - want[k]));
    }
    std::printf(" (worst %.2f ct off)\n", worst);
    std::snprintf(label, sizeof label, "Follow in C major, keys %+.0f ct: thirds within 2 ct of the degrees'", 100.0 * sharp);
    EXPECT(worst < 2.0, label);
  }
  // The same with the doublets as they ship: the pair's mean by level.
  {
    device.init(kRate);
    device.set_param(p::kSpread, 0.0f);
    device.set_param(p::kRelease, 0.0f);
    device.set_param(p::kDamping, 0.0f);
    device.set_param(p::kDecay, 60.0f);
    device.note_on(1, note_hz(69.0f), 0.8f);
    Stereo out = render(device, 12.0f, kRate);
    const double centre = 440.0 * 1.2;
    const double hi = bin_level(out.left, kRate, centre + 0.2, at(0.1), at(11.0));
    const double lo = bin_level(out.left, kRate, centre - 0.3, at(0.1), at(11.0));
    const double mean = (hi * (centre + 0.2) + lo * (centre - 0.3)) / (hi + lo);
    std::printf("A4 at the default Doublet: halves %.1f and %.1f dB, mean %.2f ct\n", db(hi), db(lo), cents(mean, 440.0));
    EXPECT(std::fabs(cents(mean, 440.0) - kMinor) < 1.0, "a pair's mean stands on the third");
  }
  // Every key in every scale on every root, against the rule written out
  // again here, read off the meter.
  {
    const int scales[7][12] = {
        {1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1}, {1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0}, {1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0},
        {1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0}, {1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1}, {1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0},
        {1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1}};
    int wrong = 0, both = 0, outside = 0;
    for (float knob : {340.0f, 365.0f}) {
      for (int scale = 0; scale < 7; ++scale) {
        for (int root = 0; root < 12; ++root) {
          device.init(kRate);
          device.set_param(p::kFollow, 1.0f);
          device.set_param(p::kTierce, knob);
          device.set_param(p::kScale, static_cast<float>(scale));
          device.set_param(p::kRoot, static_cast<float>(root));
          for (int key = 0; key < 12; ++key) {
            device.note_on(key, note_hz(48.0f + key), 0.5f);
            device.process(64);
            const int degree = (key - root + 12) % 12;
            const bool in = scales[scale][degree];
            const bool minor = in && scales[scale][(degree + 3) % 12], major = in && scales[scale][(degree + 4) % 12];
            double want = knob;
            if (minor && major) {
              want = std::fabs(knob - kMinor) < std::fabs(knob - kMajor) ? kMinor : kMajor;
              ++both;
            } else if (minor || major) {
              want = minor ? kMinor : kMajor;
            } else {
              ++outside;
            }
            if (std::fabs(device.meter(TierceBells::kMeterTierce) - want) > 0.05) ++wrong;
          }
        }
      }
    }
    std::printf("2016 keys over 7 scales and 12 roots: %d wrong (%d with both thirds in the scale, %d outside)\n", wrong, both, outside);
    EXPECT(wrong == 0, "every key of every scale takes the third the rule gives it");
    EXPECT(both > 0 && outside > 0, "both the case with two thirds and the case with none were met");
  }
  // Off: the knob, whatever the key.
  {
    double worst = 0.0;
    for (int key : {60, 62, 64, 66}) {
      plain(device);
      device.set_param(p::kTierce, 350.0f);
      device.note_on(1, note_hz(static_cast<float>(key)), 0.8f);
      Stereo out = render(device, 1.5f, kRate);
      worst = std::max(worst, std::fabs(measured_third(out.left, note_hz(static_cast<float>(key)), 350.0, 0.1, 1.5) - 350.0));
    }
    EXPECT_NEAR(worst, 0.0, 1.0, "Follow off: every bell takes the Tierce knob");
  }
}

static void test_named_thirds() {
  // Each named third, and its deciem an octave above it, on every bell.
  const double named[5] = {1200.0 * std::log2(7.0 / 6.0), kMinor, 1200.0 * std::log2(11.0 / 9.0), kMajor, 1200.0 * std::log2(4.0 / 3.0)};
  for (int bell = 0; bell < TierceBells::kNumBells; ++bell) {
    double worst = 0.0, worst_deciem = 0.0;
    for (double third : named) {
      plain(device, bell);
      device.set_param(p::kTierce, static_cast<float>(third));
      device.set_param(p::kQuint, 0.0f);
      device.set_param(p::kDecay, 30.0f);
      device.set_param(p::kDamping, 0.0f);
      device.set_param(p::kHardness, 0.8f);
      device.note_on(1, 440.0f, 0.8f);
      Stereo out = render(device, 2.0f, kRate);
      worst = std::max(worst, std::fabs(measured_third(out.left, 440.0, third, 0.3, 2.0) - third));
      const double deciem = fine_pitch(out.left, kRate, 880.0 * std::exp2(third / 1200.0), at(0.3), at(2.0), 0.02);
      worst_deciem = std::max(worst_deciem, std::fabs(cents(deciem, 440.0) - 1200.0 - third));
    }
    std::printf("bell %d: the five named thirds, worst %.3f ct; their deciems, worst %.3f ct\n", bell, worst, worst_deciem);
    EXPECT(worst < 1.0, "each named third is where it says");
    EXPECT(worst_deciem < 1.0, "the deciem is an octave above its third");
  }
}

// Pitch at a moment, from a window around it (for a partial that moves).
static double pitch_at(const std::vector<float>& x, double guess, double seconds, double window = 0.25, double reach = 0.03) {
  return fine_pitch(x, kRate, guess, at(seconds - 0.5 * window), at(seconds + 0.5 * window), reach);
}

// Third difference: a band-limited tone leaves little in it, a jump its size.
static double kink(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  double worst = 0.0;
  for (size_t i = from + 3; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 3.0 * x[i - 1] + 3.0 * x[i - 2] - x[i - 3]));
  }
  return worst;
}

static void test_suspension() {
  // Tierce 5/4, Lean +111.73, Glide 8: the third is struck as a fourth and
  // resolves inside the one strike; the deciem an octave above it all the way.
  Stereo leaning, still;
  for (int pass = 0; pass < 2; ++pass) {
    plain(device);
    device.set_param(p::kTierce, 386.31f);
    device.set_param(p::kLean, pass == 0 ? 111.73f : 0.0f);
    device.set_param(p::kGlide, 8.0f);
    device.set_param(p::kQuint, 0.0f);
    device.set_param(p::kDecay, 40.0f);
    device.set_param(p::kDamping, 0.0f);
    device.note_on(1, 440.0f, 0.8f);
    (pass == 0 ? leaning : still) = render(device, 10.0f, kRate);
  }
  const double times[7] = {0.15, 1.0, 2.0, 4.0, 6.0, 7.0, 8.3};
  double worst_path = 0.0, worst_octave = 0.0;
  std::printf("a suspension of 8 s, third (deciem less an octave):");
  for (double t : times) {
    const double u = std::min(t / 8.0, 1.0), want = 498.04 - 111.73 * u * u * (3.0 - 2.0 * u);
    const double third = cents(pitch_at(leaning.left, 440.0 * std::exp2(want / 1200.0), t), 440.0);
    const double deciem = cents(pitch_at(leaning.left, 880.0 * std::exp2(want / 1200.0), t), 880.0);
    std::printf(" %.1fs %.1f (%.1f)", t, third, deciem);
    worst_path = std::max(worst_path, std::fabs(third - want));
    worst_octave = std::max(worst_octave, std::fabs(third - deciem));
  }
  std::printf("\n");
  EXPECT(worst_path < 2.0, "the third goes from the fourth to its place along the cubic");
  EXPECT(worst_octave < 2.0, "the deciem stays an octave above it");
  EXPECT_NEAR(cents(pitch_at(leaning.left, 440.0 * 4.0 / 3.0, 0.15), 440.0), 498.04, 1.0, "struck as a fourth");
  EXPECT_NEAR(cents(pitch_at(leaning.left, 550.0, 9.0, 1.5), 440.0), 386.31, 0.2, "resolved to 5/4");
  const double moving = kink(leaning.left, at(0.05)), at_rest = kink(still.left, at(0.05));
  std::printf("largest third difference: %.6f gliding, %.6f at rest\n", moving, at_rest);
  EXPECT(moving < 1.15 * at_rest, "a glide adds no click");

  // Lean the other way, and the shortest Glide.
  plain(device);
  device.set_param(p::kTierce, 400.0f);
  device.set_param(p::kLean, -200.0f);
  device.set_param(p::kGlide, 4.0f);
  device.note_on(1, 440.0f, 0.8f);
  Stereo under = render(device, 5.0f, kRate);
  EXPECT_NEAR(cents(pitch_at(under.left, 440.0 * std::exp2(205.0 / 1200.0), 0.15), 440.0), 202.0, 4.0, "a lean below starts below");
  EXPECT_NEAR(cents(pitch_at(under.left, 440.0 * std::exp2(400.0 / 1200.0), 4.5), 440.0), 400.0, 1.0, "and rises to its place");
}

static void test_moving_thirds() {
  // Tierce moved under a ringing bell glides there over Glide; so do ringing
  // bells when Root or Scale moves, each to its own.
  plain(device);
  device.set_param(p::kTierce, 315.64f);
  device.set_param(p::kGlide, 4.0f);
  device.set_param(p::kDecay, 40.0f);
  device.note_on(1, 440.0f, 0.8f);
  Stereo before = render(device, 1.0f, kRate);
  device.set_param(p::kTierce, 386.31f);
  Stereo after = render(device, 5.0f, kRate);
  const double start = cents(pitch_at(after.left, 440.0 * 1.2, 0.15), 440.0), half = cents(pitch_at(after.left, 440.0 * 1.225, 2.0), 440.0),
               end = cents(pitch_at(after.left, 550.0, 4.5), 440.0);
  std::printf("Tierce moved under a bell, Glide 4 s: %.1f ct at 0.15 s, %.1f at 2 s, %.1f at 4.5 s\n", start, half, end);
  EXPECT_NEAR(start, 315.9, 1.5, "it has hardly left");
  EXPECT_NEAR(half, 351.0, 2.0, "it is half way at half time");
  EXPECT_NEAR(end, 386.31, 0.5, "and arrives");

  device.init(kRate);
  device.set_param(p::kGlide, 1.0f);
  device.set_param(p::kRelease, 0.0f);
  device.note_on(1, note_hz(60.0f), 0.8f);
  device.note_on(2, note_hz(69.0f), 0.8f);  // the meter reads the newest, A
  render(device, 0.5f, kRate);
  EXPECT_NEAR(device.meter(TierceBells::kMeterTierce), kMinor, 0.1, "A rings minor in C major");
  device.set_param(p::kRoot, 9.0f);
  render(device, 0.5f, kRate);
  const double mid = device.meter(TierceBells::kMeterTierce);
  render(device, 0.6f, kRate);
  EXPECT(mid > kMinor + 20.0 && mid < kMajor - 20.0, "Root to A: the ringing A is on its way");
  EXPECT_NEAR(device.meter(TierceBells::kMeterTierce), kMajor, 0.1, "and arrives at major");
  device.set_param(p::kScale, 1.0f);
  render(device, 1.2f, kRate);
  EXPECT_NEAR(device.meter(TierceBells::kMeterTierce), kMinor, 0.1, "Scale to minor brings it back");

  // Sent somewhere else on the way, it turns with the speed it has.
  plain(device);
  device.set_param(p::kTierce, 270.0f);
  device.set_param(p::kGlide, 2.0f);
  device.note_on(1, 440.0f, 0.8f);
  render(device, 0.2f, kRate);
  device.set_param(p::kTierce, 490.0f);
  render(device, 1.0f, kRate);
  double was = device.meter(TierceBells::kMeterTierce);
  render(device, 0.02f, kRate);
  const double speed = (device.meter(TierceBells::kMeterTierce) - was) / 0.02;
  device.set_param(p::kTierce, 300.0f);
  was = device.meter(TierceBells::kMeterTierce);
  render(device, 0.02f, kRate);
  const double after_turn = (device.meter(TierceBells::kMeterTierce) - was) / 0.02;
  std::printf("a third at %.0f ct a second sent back: %.0f ct a second\n", speed, after_turn);
  EXPECT(speed > 120.0 && after_turn > 0.8 * speed, "a third sent back turns round, it does not stop dead");

  // A target moved again and again on the way: no jump in pitch, no runaway.
  plain(device);
  device.set_param(p::kGlide, 2.0f);
  device.note_on(1, 440.0f, 0.8f);
  render(device, 0.2f, kRate);
  double last = device.meter(TierceBells::kMeterTierce), jump = 0.0, low = last, high = last;
  for (int i = 0; i < 600; ++i) {
    if (i % 5 == 0) device.set_param(p::kTierce, (i / 5) % 7 < 3 ? 270.0f : 495.0f);
    device.process(128);
    const double now = device.meter(TierceBells::kMeterTierce);
    jump = std::max(jump, std::fabs(now - last));
    low = std::min(low, now);
    high = std::max(high, now);
    last = now;
  }
  std::printf("Tierce thrown about 120 times: largest step %.2f ct in 128 samples, between %.0f and %.0f ct\n", jump, low, high);
  EXPECT(jump < 5.0 && low > 200.0 && high < 560.0, "a target thrown about stays smooth and bounded");
}

static void test_hum_and_quint() {
  for (float ratio : {0.4f, 0.445f, 0.5f, 0.561f, 0.6f}) {
    plain(device);
    device.set_param(p::kHumPitch, ratio);
    device.note_on(1, 440.0f, 0.8f);
    Stereo out = render(device, 2.0f, kRate);
    const double hum = fine_pitch(out.left, kRate, 440.0 * ratio, at(0.1), at(2.0), 0.02);
    std::snprintf(label, sizeof label, "Hum pitch %.3f: the hum at %.2f ct (%.2f)", ratio, cents(hum, 440.0), 1200.0 * std::log2(ratio));
    std::printf("%s\n", label);
    EXPECT_NEAR(cents(hum, 440.0), 1200.0 * std::log2(static_cast<double>(ratio)), 1.0, label);
  }
  double level[4][3];
  const int ids[3] = {p::kQuint, p::kHumLevel, p::kUpper};
  const double partial[3] = {660.0, 220.0, 880.0};
  for (int which = 0; which < 3; ++which) {
    for (int step = 0; step < 3; ++step) {
      plain(device);
      device.set_param(ids[which], 0.5f * static_cast<float>(step));
      device.note_on(1, 440.0f, 0.8f);
      Stereo out = render(device, 1.5f, kRate);
      level[which][step] = bin_level(out.left, kRate, partial[which], at(0.1), at(1.0));
    }
    std::printf("knob %d at 0, half, full: its partial at %.1f, %.1f, %.1f dB\n", ids[which], db(level[which][0]), db(level[which][1]), db(level[which][2]));
    EXPECT(level[which][0] < 0.001 * level[which][1], "at 0 the partial is 60 dB down or more");
    EXPECT_NEAR(db(level[which][2] / level[which][1]), 6.02, 0.1, "at full it is twice what it is in the middle");
  }
}

static void test_doublets() {
  // 11/9 with the hum at an octave, Decay 24, Doublet 0.7: hum, prime and
  // third all beat at 0.7 Hz, not all at once.
  double rates[4], peaks[4];
  plain(device);
  device.set_param(p::kTierce, 347.41f);
  device.set_param(p::kHumPitch, 0.5f);
  device.set_param(p::kDecay, 24.0f);
  device.set_param(p::kDoublet, 0.7f);
  device.set_param(p::kDamping, 0.0f);
  device.note_on(1, 440.0f, 0.8f);
  Stereo out = render(device, 14.0f, kRate);
  const double third = 440.0 * std::exp2(347.41 / 1200.0);
  const double hz[4] = {220.0, 440.0, third, 2.0 * third};
  for (int which = 0; which < 4; ++which) {
    // The partial's level every 20 ms, its decay fitted out.
    std::vector<float> level;
    for (size_t from = 2400; from + 4800 <= out.left.size(); from += 960) {
      level.push_back(static_cast<float>(db(bin_level(out.left, kRate, hz[which], from, 4800))));
    }
    double sx = 0, sy = 0, sxx = 0, sxy = 0;
    const double n = static_cast<double>(level.size());
    for (size_t i = 0; i < level.size(); ++i) {
      sx += i;
      sy += level[i];
      sxx += static_cast<double>(i) * i;
      sxy += static_cast<double>(i) * level[i];
    }
    const double slope = (n * sxy - sx * sy) / (n * sxx - sx * sx), base = (sy - slope * sx) / n;
    for (size_t i = 0; i < level.size(); ++i) level[i] -= static_cast<float>(base + slope * static_cast<double>(i));
    rates[which] = dominant_frequency(level, 50.0, 0.3, 4.0);
    peaks[which] = (std::max_element(level.begin(), level.begin() + 72) - level.begin()) * 0.02;
  }
  std::printf("11/9, Doublet 0.7: hum, prime, third, deciem beat at %.3f %.3f %.3f %.3f Hz; first swell at %.2f %.2f %.2f %.2f s\n",
              rates[0], rates[1], rates[2], rates[3], peaks[0], peaks[1], peaks[2], peaks[3]);
  for (double rate : rates) EXPECT_NEAR(rate, 0.7, 0.02, "a pair beats at Doublet");
  double spread = 0.0;
  for (int i = 1; i < 4; ++i) spread = std::max(spread, std::fabs(std::remainder(peaks[i] - peaks[0], 1.0 / 0.7)));
  EXPECT(spread > 0.15, "the partials do not all swell together");

  double swing[2];
  for (int which = 0; which < 2; ++which) {
    plain(device);
    device.set_param(p::kDoublet, which == 0 ? 0.0f : 2.0f);
    device.set_param(p::kDecay, 60.0f);
    device.note_on(1, 440.0f, 0.8f);
    Stereo x = render(device, 3.0f, kRate);
    double low = 1.0e9, high = 0.0;
    for (size_t from = 4800; from + 4800 <= x.left.size(); from += 960) {
      const double v = bin_level(x.left, kRate, 220.0, from, 4800);
      low = std::min(low, v);
      high = std::max(high, v);
    }
    swing[which] = db(high / low);
  }
  std::printf("the hum's level moves %.1f dB at Doublet 0 (its decay) and %.1f dB at 2 Hz\n", swing[0], swing[1]);
  EXPECT(swing[0] < 3.5 && swing[1] > 10.0, "no doublet, no beat");
}

static void test_decay() {
  // Decay is the hum's ring time, at every rate, up to its longest.
  for (float rate : {44100.0f, 48000.0f, 96000.0f, 192000.0f}) {
    std::printf("hum's ring time at %.1f kHz:", rate / 1000.0);
    double worst = 0.0;
    for (float seconds : {0.5f, 3.0f, 14.0f, 60.0f}) {
      plain(device, TierceBells::kTower, rate);
      device.set_param(p::kDecay, seconds);
      device.note_on(1, 220.0f, 0.8f);
      const double length = std::min(0.15 + 0.5 * seconds, 8.0);
      Stereo out = render(device, static_cast<float>(length + 0.3), rate);
      const double ring = ring_time(out.left, rate, 110.0, 0.05, length, 0.15);
      std::printf(" %.2f (%.1f)", ring, seconds);
      worst = std::max(worst, std::fabs(ring / seconds - 1.0));
    }
    std::printf(" worst %.1f %%\n", 100.0 * worst);
    std::snprintf(label, sizeof label, "Decay is the hum's ring time at %.1f kHz", rate / 1000.0);
    EXPECT(worst < 0.004, label);
  }
  // The other partials keep their share of it, to a power Damping sets.
  double third[3], nominal[3];
  for (int which = 0; which < 3; ++which) {
    const float damping = which == 0 ? 0.0f : (which == 1 ? 0.4f : 1.0f);
    plain(device);
    device.set_param(p::kDecay, 10.0f);
    device.set_param(p::kDamping, damping);
    device.note_on(1, 440.0f, 0.8f);
    Stereo out = render(device, 4.0f, kRate);
    third[which] = ring_time(out.left, kRate, 528.0, 0.05, 2.0, 0.2);
    nominal[which] = ring_time(out.left, kRate, 880.0, 0.05, which == 2 ? 0.6 : 2.0, 0.2);
    const double power = 0.1 + 1.4 * damping + 1.1 * damping * damping;
    EXPECT(std::fabs(third[which] / (10.0 * std::pow(0.80, power)) - 1.0) < 0.03, "the third rings its share of Decay");
    EXPECT(std::fabs(nominal[which] / (10.0 * std::pow(0.40, power)) - 1.0) < 0.05, "and the nominal its own");
  }
  std::printf("Decay 10, Damping 0, 0.4, 1: third rings %.2f, %.2f, %.2f s; nominal %.2f, %.2f, %.2f s\n", third[0], third[1], third[2],
              nominal[0], nominal[1], nominal[2]);

  // Release: how long a bell rings once its key is up; every step shortens it.
  double last = 1.0e9;
  std::printf("Decay 10, let go: the hum rings");
  for (float release : {0.0f, 0.1f, 0.25f, 0.5f, 0.75f, 1.0f}) {
    plain(device);
    device.set_param(p::kDecay, 10.0f);
    device.set_param(p::kRelease, release);
    device.note_on(1, 220.0f, 0.8f);
    Stereo held = render(device, 1.0f, kRate);
    device.note_off(1);
    Stereo out = render(device, 2.0f, kRate);
    const double want = 10.0 * std::pow(0.008, static_cast<double>(release));
    const double ring = ring_time(out.left, kRate, 110.0, 0.005, std::min(0.3 * want, 1.5), 0.04);
    std::printf(" %.2f", ring);
    EXPECT(std::fabs(ring / want - 1.0) < 0.08, "a bell let go rings as long as Release says");
    EXPECT(ring < 0.9 * last, "more Release, shorter");
    last = ring;
    if (release == 1.0f) EXPECT(std::fabs(ring_time(held.left, kRate, 110.0, 0.05, 0.8, 0.15) / 10.0 - 1.0) < 0.05, "a held bell rings whatever Release says");
  }
  std::printf(" s\n");
}

// --- one pitch is one bell --------------------------------------------------------------------

static double loud_after(double seconds, double window = 0.1) {
  Stereo out = render(device, static_cast<float>(seconds), kRate);
  return rms(out.left, out.size() - at(window));
}

static void test_one_bell() {
  // Struck again and again, whoever strikes it: bounded, for every bell and
  // clapper, at any speed.
  for (int bell = 0; bell < TierceBells::kNumBells; ++bell) {
    double worst = 0.0;
    for (float hardness : {0.0f, 0.5f, 1.0f}) {
      for (double gap : {0.004, 0.05, 0.31}) {
        for (bool many : {false, true}) {
          double once = 0.0, piled = 0.0;
          for (int pass = 0; pass < 2; ++pass) {
            plain(device, bell);
            device.set_param(p::kHardness, hardness);
            device.set_param(p::kDecay, 60.0f);
            device.set_param(p::kDamping, 0.0f);
            device.set_param(p::kVolume, -24.0f);
            for (int hit = 0; hit < (pass == 0 ? 1 : 60); ++hit) {
              device.note_on(many ? hit : 1, 220.0f, 1.0f);
              Stereo out = render(device, pass == 0 && bell == TierceBells::kRubbed ? 4.0f : static_cast<float>(std::max(gap, pass == 0 ? 0.5 : 0.0)), kRate);
              (pass == 0 ? once : piled) = std::max(pass == 0 ? once : piled, loudest(out));
            }
          }
          worst = std::max(worst, db(piled / once));
        }
      }
    }
    std::printf("bell %d struck 60 times (4, 50 or 310 ms apart, one id or sixty): at most %+.1f dB over one strike\n", bell, worst);
    EXPECT(worst < 2.5, "strikes on a ringing bell do not stack without limit");
  }
  // A second equal strike never cancels and never doubles, whatever the
  // moment; a soft one leaves a loud bell as loud as it was.
  double least = 1.0e9, most = 0.0, soft_least = 1.0e9;
  for (int n = 0; n < 8; ++n) {
    double level[3];
    for (int pass = 0; pass < 3; ++pass) {
      plain(device);
      device.set_param(p::kDecay, 60.0f);
      device.set_param(p::kDamping, 0.0f);
      device.note_on(1, 220.0f, 0.7f);
      render(device, 0.5f, kRate);
      device.process(n * 27 + 1);
      if (pass == 1) device.note_on(2, 220.0f, 0.7f);
      if (pass == 2) device.note_on(2, 220.0f, 0.1f);
      render(device, 0.1f, kRate);
      level[pass] = loud_after(0.5, 0.4);
    }
    least = std::min(least, level[1] / level[0]);
    most = std::max(most, level[1] / level[0]);
    soft_least = std::min(soft_least, level[2] / level[0]);
  }
  std::printf("a second equal strike: between %.2fx and %.2fx; a soft one: %.2fx at the least\n", least, most, soft_least);
  EXPECT(least > 0.95 && most < 1.55, "a second strike adds as power (what rang has decayed a little)");
  EXPECT(soft_least > 0.97, "a soft strike does not duck a ringing bell");
  // Two ids on one pitch in one block: not cancelled, not doubled.
  double level[2];
  for (int pass = 0; pass < 2; ++pass) {
    plain(device);
    device.note_on(1, 220.0f, 0.5f);
    if (pass == 1) device.note_on(2, 220.0f, 0.5f);
    level[pass] = loud_after(0.5, 0.4);
  }
  std::printf("two ids on one pitch at once: %+.2f dB on one\n", db(level[1] / level[0]));
  EXPECT(db(level[1] / level[0]) > 1.0 && db(level[1] / level[0]) < 5.0, "two ids on one pitch are one bell struck harder");
  // A soft strike in the middle of a hard one follows it and takes nothing
  // from it.
  for (int pass = 0; pass < 2; ++pass) {
    plain(device);
    device.set_param(p::kHardness, 0.0f);
    device.note_on(1, 110.0f, 1.0f);
    device.process(130);
    if (pass == 1) device.note_on(2, 110.0f, 0.1f);
    level[pass] = loud_after(0.5, 0.4);
  }
  EXPECT_NEAR(db(level[1] / level[0]), 0.0, 0.5, "a soft strike in the middle of a hard one takes nothing from it");
  // The same id at another pitch lets the first bell go.
  plain(device);
  device.set_param(p::kRelease, 1.0f);
  device.note_on(1, 220.0f, 0.8f);
  render(device, 0.3f, kRate);
  device.note_on(1, 1317.0f, 0.8f);
  render(device, 0.4f, kRate);
  Stereo moved = render(device, 0.4f, kRate);
  EXPECT(bin_level(moved.left, kRate, 110.0, 0, at(0.4)) < 1.0e-5, "an id at a new pitch lets its first bell go");
  EXPECT(bin_level(moved.left, kRate, 1317.0, 0, at(0.4)) > 0.003, "and holds the new one");
  // Held by two, let go by the last.
  plain(device);
  device.set_param(p::kRelease, 1.0f);
  device.note_on(1, 220.0f, 0.7f);
  device.note_on(2, 220.0f, 0.7f);
  render(device, 0.3f, kRate);
  device.note_off(1);
  const double held = loud_after(0.4);
  device.note_off(2);
  const double gone = loud_after(0.4);
  EXPECT(held > 0.01 && gone < 1.0e-4 * held, "a bell two ids hold is let go with the second");
  // A, B and A again on one id, then one note off: nothing left held.
  for (int variant = 0; variant < 4; ++variant) {
    for (int bell : {static_cast<int>(TierceBells::kTower), static_cast<int>(TierceBells::kRubbed)}) {
      plain(device, bell);
      device.set_param(p::kRelease, 1.0f);
      device.set_param(p::kDecay, 60.0f);
      if (variant == 2) {
        for (int n = 0; n < 12; ++n) device.note_on(100 + n, 300.0f + 31.0f * n, 0.8f);
        render(device, 1.0f, kRate);
      }
      device.note_on(1, 220.0f, 0.8f);
      if (variant == 1) render(device, 0.5f, kRate);
      if (variant == 3) device.note_off(1);
      device.note_on(1, 330.0f, 0.8f);
      if (variant == 1) device.process(480);
      device.note_on(1, 220.0f, 0.8f);
      render(device, 0.3f, kRate);
      device.note_off(1);
      for (int n = 0; n < 12; ++n) device.note_off(100 + n);
      render(device, 0.6f, kRate);
      Stereo rest = render(device, 0.2f, kRate);
      std::snprintf(label, sizeof label, "A, B, A on one id (variant %d, bell %d), one note off: silence", variant, bell);
      EXPECT(loudest(rest) == 0.0, label);
    }
  }
}

// --- voices ---------------------------------------------------------------------------------

static void test_voices() {
  // Twelve held, two more in one block: both sound, and so does the one that
  // is struck twice while it waits; one note off ends each.
  plain(device, TierceBells::kRubbed);
  device.set_param(p::kRelease, 1.0f);
  device.set_param(p::kUpper, 0.0f);
  for (int n = 0; n < 12; ++n) device.note_on(n, 100.0f + 7.0f * n, 0.8f);
  render(device, 3.0f, kRate);
  device.note_on(50, 2000.0f, 0.8f);
  device.note_on(51, 2900.0f, 0.8f);
  device.note_on(50, 2000.0f, 0.8f);
  Stereo two = render(device, 2.0f, kRate);
  const double a = bin_level(two.left, kRate, 2000.0, at(1.0), at(0.5)), b = bin_level(two.left, kRate, 2900.0, at(1.0), at(0.5));
  std::printf("a full pool, two more in a block: %.1f and %.1f dB\n", db(a), db(b));
  EXPECT(a > 0.005 && b > 0.005, "both notes of a chord on a full pool sound");
  int left = 0;
  for (int n = 0; n < 12; ++n) left += bin_level(two.left, kRate, 100.0 + 7.0 * n, at(0.5), at(1.5)) > 0.005 ? 1 : 0;
  EXPECT(left == 10, "and each took one voice");
  for (int n = 0; n < 12; ++n) device.note_off(n);
  device.note_off(50);
  device.note_off(51);
  render(device, 0.6f, kRate);
  EXPECT(loudest(render(device, 0.2f, kRate)) == 0.0, "every one of them is let go");
  // One voice free and two notes in a block: the first is not the quiet one
  // the second takes. A soft note that waits is not taken by a loud one. An
  // id struck at two pitches while it waits takes one voice.
  for (int variant = 0; variant < 3; ++variant) {
    plain(device);
    device.set_param(p::kUpper, 0.0f);
    device.set_param(p::kHumLevel, 0.0f);
    device.set_param(p::kQuint, 0.0f);
    device.set_param(p::kDecay, 30.0f);
    const int held = variant == 0 ? 11 : 12;
    for (int n = 0; n < held; ++n) device.note_on(n, 100.0f + 1.6f * n, 0.8f);
    render(device, 0.5f, kRate);
    device.note_on(50, 2000.0f, variant == 1 ? 0.15f : 0.8f);
    device.note_on(variant == 2 ? 50 : 51, 2900.0f, 0.8f);
    Stereo out = render(device, 4.0f, kRate);
    const double first = bin_level(out.left, kRate, 2000.0, at(0.1), at(0.5)), second = bin_level(out.left, kRate, 2900.0, at(0.1), at(0.5));
    int kept = 0;
    for (int n = 0; n < held; ++n) kept += bin_level(out.left, kRate, 100.0 + 1.6 * n, at(0.1), at(3.8)) > 0.003 ? 1 : 0;
    std::printf("two notes in a block, variant %d: %.1f and %.1f dB, %d of %d kept\n", variant, db(first), db(second), kept, held);
    EXPECT(second > 0.005, "the second sounds");
    if (variant < 2) EXPECT(first > (variant == 1 ? 0.0005 : 0.005), "and so does the first");
    EXPECT(kept == (variant == 1 ? 10 : (variant == 2 ? 11 : 10)), "and no voice more than they need is taken");
  }
  // Let go before it could start: it still sounds (a bell struck), and ends.
  plain(device);
  device.set_param(p::kDecay, 20.0f);
  for (int n = 0; n < 12; ++n) device.note_on(n, 100.0f + 11.0f * n, 0.8f);
  render(device, 0.5f, kRate);
  device.note_on(40, 1500.0f, 0.9f);
  device.note_off(40);
  Stereo grace = render(device, 0.6f, kRate);
  EXPECT(bin_level(grace.left, kRate, 1500.0, at(0.1), at(0.4)) > 0.003, "a strike let go while it waits still rings");
  device.set_param(p::kRelease, 1.0f);
  for (int n = 0; n < 12; ++n) device.note_off(n);
  render(device, 0.6f, kRate);
  EXPECT(loudest(render(device, 0.2f, kRate)) == 0.0, "and nothing is left held");
  // Another note does not move one that is held.
  double before[2];
  for (int pass = 0; pass < 2; ++pass) {
    plain(device);
    device.set_param(p::kDecay, 30.0f);
    device.note_on(1, 220.0f, 0.4f);
    render(device, 0.3f, kRate);
    if (pass == 1) {
      for (int n = 0; n < 10; ++n) device.note_on(10 + n, 1015.0f + 170.0f * n, 0.5f);
    }
    Stereo out = render(device, 1.5f, kRate);
    before[pass] = bin_level(out.left, kRate, 110.0, at(0.3), at(1.0));
  }
  EXPECT_NEAR(db(before[1] / before[0]), 0.0, 0.1, "a held bell does not duck under ten more");
  // Odd notes.
  device.init(kRate);
  device.note_on(1, std::nanf(""), 0.5f);
  EXPECT(loudest(render(device, 0.1f, kRate)) == 0.0, "a note with no pitch is no note");
  device.note_on(2, std::numeric_limits<float>::infinity(), 0.5f);
  device.note_on(3, -5.0f, 7.0f);
  device.note_on(4, 220.0f, std::nanf(""));
  device.note_on(-7, 330.0f, 0.5f);
  device.note_off(12345);
  Stereo odd = render(device, 0.5f, kRate);
  EXPECT(finite(odd.left) && finite(odd.right) && loudest(odd) < 1.0, "absurd pitches and gains are survived");
  device.init(kRate);
  device.set_param(p::kBell, TierceBells::kRubbed);
  device.note_on(1, 220.0f, 0.0f);
  EXPECT(loudest(render(device, 2.0f, kRate)) < 1.0e-4, "gain 0 is silent");
  // No click: a steal, a second strike, a choke, a knob thrown.
  const auto twelve = [](TierceBells& d) {
    plain(d);
    d.set_param(p::kHardness, 0.3f);
    d.set_param(p::kDecay, 40.0f);
    for (int n = 0; n < 11; ++n) d.note_on(n, 60.0f + 5.0f * n, 0.9f);
    d.note_on(11, 1200.0f, 0.5f);
  };
  const auto one = [](TierceBells& d) {
    plain(d);
    d.set_param(p::kHardness, 0.3f);
    d.set_param(p::kDecay, 40.0f);
    d.note_on(1, 220.0f, 0.9f);
  };
  const double steal = suddenness(twelve, [](TierceBells& d) { d.note_on(30, 82.0f, 0.2f); });
  const double again = suddenness(one, [](TierceBells& d) { d.note_on(1, 220.0f, 0.9f); });
  const double choke = suddenness(one, [](TierceBells& d) {
    d.set_param(p::kRelease, 1.0f);
    d.note_off(1);
  });
  std::printf("suddenness: steal %.3f, second strike %.3f, choke %.3f", steal, again, choke);
  EXPECT(steal < 0.2, "a steal starts gradually");
  EXPECT(again < 0.2, "a second strike starts gradually");
  EXPECT(choke < 0.2, "a choke starts gradually");
  const int ids[9] = {p::kTierce, p::kHumPitch, p::kHumLevel, p::kQuint, p::kUpper, p::kSpread, p::kDoublet, p::kDamping, p::kVolume};
  for (int id : ids) {
    double worst = 0.0;
    for (bool up : {false, true}) {
      worst = std::max(worst, suddenness(
                                  [&](TierceBells& d) {
                                    plain(d);
                                    d.set_param(p::kGlide, 0.02f);
                                    d.set_param(p::kHardness, 0.3f);
                                    d.set_param(id, up ? p::kParamMin[id] : p::kParamMax[id]);
                                    d.note_on(1, 220.0f, 0.9f);
                                  },
                                  [&](TierceBells& d) { d.set_param(id, up ? p::kParamMax[id] : p::kParamMin[id]); }));
    }
    std::printf(", %s%.3f", id == p::kTierce ? "knobs thrown: " : "", worst);
    std::snprintf(label, sizeof label, "knob %d thrown from end to end moves gradually", id);
    EXPECT(worst < 0.2, label);
  }
  std::printf("\n");
}

// --- the engine's rules ------------------------------------------------------------------------

// A phrase with a silence of `gap` seconds in it, a knob moved in the silence.
static Stereo phrase(int bell, double gap, int mode) {
  const int ragged[8] = {1, 7, 64, 128, 33, 512, 2048, 5};
  device.init(kRate);
  device.set_param(p::kBell, static_cast<float>(bell));
  device.set_param(p::kDecay, 0.6f);
  device.set_param(p::kRelease, 0.6f);
  device.set_param(p::kLean, 80.0f);
  device.set_param(p::kGlide, 0.3f);
  Stereo out;
  int which = 0;
  const auto play = [&](double seconds) {
    size_t left = at(seconds);
    while (left > 0) {
      const int size = mode == 0 ? 128 : (mode == 1 ? 1 : (mode == 2 ? 2048 : ragged[which++ % 8]));
      const int n = static_cast<int>(std::min(static_cast<size_t>(size), left));
      device.process(n);
      for (int i = 0; i < n; ++i) {
        out.left.push_back(device.out_left()[i]);
        out.right.push_back(device.out_right()[i]);
      }
      left -= static_cast<size_t>(n);
    }
  };
  for (int n = 0; n < 13; ++n) device.note_on(n, 110.0f * std::exp2(n * 5 / 12.0f), 0.8f);
  play(0.1003);
  device.note_on(40, 247.0f, 0.6f);
  device.note_on(1, 110.0f * std::exp2(5 / 12.0f), 0.4f);
  device.set_param(p::kQuint, 1.0f);
  play(0.05);
  device.note_off(40);
  for (int n = 0; n < 13; ++n) device.note_off(n);
  play(gap);
  device.set_param(p::kHumPitch, 0.561f);
  device.set_param(p::kVolume, -12.0f);
  device.set_param(p::kUpper, 0.2f);
  play(0.004);
  device.note_on(1, 220.0f, 0.9f);
  play(0.2);
  return out;
}

static void test_rules() {
  double worst = 0.0;
  for (int bell : {static_cast<int>(TierceBells::kTower), static_cast<int>(TierceBells::kRubbed)}) {
    for (double gap : {0.30, 0.46, 0.48, 0.50, 0.52, 0.54, 0.56, 0.58, 0.60, 0.62, 0.64, 0.66, 0.68, 0.70, 0.72, 0.74, 0.76, 0.80, 2.0}) {
      const Stereo base = phrase(bell, gap, 0);
      for (int mode = 1; mode < 4; ++mode) worst = std::max(worst, worst_difference(base, phrase(bell, gap, mode)));
    }
  }
  std::printf("block sizes 1, 2048 and ragged against 128 over nineteen silences: worst %g\n", worst);
  EXPECT(worst < 1.0e-6, "output does not depend on the block size, across a silence or not");

  // Knobs moved while it sleeps are there for the next note, exactly; off the
  // control clock's beat too.
  double moved = 0.0;
  for (int id = 0; id < p::kNumParams; ++id) {
    for (float value : {p::kParamMin[id], p::kParamMax[id]}) {
      Stereo fresh, slept;
      for (int pass = 0; pass < 2; ++pass) {
        device.init(kRate);
        device.set_param(p::kLean, 60.0f);
        if (pass == 1) {
          device.set_param(p::kRelease, 1.0f);
          device.note_on(1, 300.0f, 0.8f);
          device.process(13);
          device.note_off(1);
          render(device, 1.0f, kRate);
          device.set_param(p::kRelease, p::kParamDefault[p::kRelease]);
        }
        device.set_param(id, value);
        device.note_on(2, 220.0f, 0.8f);
        (pass == 0 ? fresh : slept) = render(device, 0.3f, kRate);
      }
      moved = std::max(moved, worst_difference(fresh, slept));
    }
  }
  std::printf("each knob moved in its sleep against a device set so from the start: worst %g\n", moved);
  EXPECT(moved < 1.0e-6, "a knob moved in the silence does not glide under the next note");

  // The level does not move with the sample rate.
  double level_spread = 0.0;
  for (int bell = 0; bell < TierceBells::kNumBells; ++bell) {
    for (float hz : {82.4f, 440.0f, 2093.0f, 6000.0f}) {
      double low = 1.0e9, high = -1.0e9;
      for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
        device.init(rate);
        device.set_param(p::kBell, static_cast<float>(bell));
        device.note_on(1, hz, 0.8f);
        Stereo out = render(device, 1.5f, rate);
        const double level = db(rms(out.left, 0, at(0.5, rate)) + rms(out.right, at(0.5, rate)));
        low = std::min(low, level);
        high = std::max(high, level);
      }
      level_spread = std::max(level_spread, high - low);
    }
  }
  std::printf("44.1, 48 and 96 kHz, four bells and four notes: levels within %.2f dB\n", level_spread);
  EXPECT(level_spread < 0.2, "the level is the same at every sample rate");

  // Meters at rest, sounding, and at rest again.
  device.init(kRate);
  device.set_param(p::kTierce, 300.0f);
  EXPECT(device.meter(0) == 300.0f && device.meter(1) == 300.0f && device.meter(2) == 0.0f && device.meter(3) == 0.0f, "meters at rest");
  EXPECT(device.meter(99) == 0.0f && device.meter(-1) == 0.0f, "a meter that is not there");
  device.set_param(p::kRelease, 1.0f);
  device.set_param(p::kLean, 100.0f);
  device.note_on(1, note_hz(60.0f), 0.8f);
  render(device, 0.1f, kRate);
  EXPECT(device.meter(0) > 400.0f && std::fabs(device.meter(1) - kMajor) < 0.1 && device.meter(2) > 0.01f, "meters of a leaning bell");
  EXPECT_NEAR(device.meter(3), note_hz(60.0f), 0.01, "and its note");
  device.note_off(1);
  render(device, 1.0f, kRate);
  EXPECT(device.meter(0) == 300.0f && device.meter(2) == 0.0f, "asleep they rest");
}

// --- the four bells, the clapper, levels ----------------------------------------------------------

static double partial_at(const std::vector<float>& x, double hz, double from = 0.05, double window = 0.2) {
  return bin_level(x, kRate, hz, at(from), at(window));
}

static void test_bells() {
  double hum[4], prime[4], third[4], nominal[4], twelfth[4], gone[4];
  for (int bell = 0; bell < 4; ++bell) {
    plain(device, bell);
    device.set_param(p::kQuint, 0.0f);
    device.set_param(p::kTierce, 386.31f);
    device.note_on(1, 440.0f, 0.8f);
    Stereo out = render(device, 4.0f, kRate);
    const double from = bell == TierceBells::kRubbed ? 3.0 : 0.05;
    hum[bell] = db(partial_at(out.left, 220.0, from));
    prime[bell] = db(partial_at(out.left, 440.0, from));
    third[bell] = db(partial_at(out.left, 550.0, from));
    nominal[bell] = db(partial_at(out.left, 880.0, from));
    twelfth[bell] = db(partial_at(out.left, 1320.0, from));
    gone[bell] = db(rms(out.left, at(3.0), at(3.5)) / rms(out.left, at(0.02), at(0.5)));
    std::printf("bell %d: hum %.1f, prime %.1f, third %.1f, nominal %.1f, twelfth %.1f dB; 3 s later %.1f dB\n", bell, hum[bell], prime[bell],
                third[bell], nominal[bell], twelfth[bell], gone[bell]);
  }
  EXPECT(third[0] > prime[0] && third[0] > hum[0] - 3.0, "tower: the third stands over the prime");
  EXPECT(prime[1] > third[1] + 4.0 && twelfth[1] > third[1] + 1.0 && hum[1] < prime[1] - 15.0, "handbell: the note and its twelfth");
  EXPECT(nominal[2] > prime[2] && gone[2] < gone[0] - 12.0, "small clock: bright and soon over");
  EXPECT(gone[3] > 3.0, "rubbed: louder after three seconds than in the first half");
  for (int bell = 0; bell < 4; ++bell) EXPECT(third[bell] > prime[bell] - 8.0, "the third is heard in every bell");

  // Rubbed: swells, holds as long as the key is down, rings out after.
  plain(device, TierceBells::kRubbed);
  device.set_param(p::kDecay, 3.0f);
  device.note_on(1, 220.0f, 0.8f);
  Stereo held = render(device, 12.0f, kRate);
  device.note_off(1);
  Stereo after = render(device, 4.0f, kRate);
  const double early = rms(held.left, 0, at(0.1)), at3 = rms(held.left, at(3.0), at(4.0)), at11 = rms(held.left, at(11.0), at(12.0));
  std::printf("rubbed: %.1f dB in the first 0.1 s, %.1f at 3 s, %.1f at 11 s; rings %.2f s after\n", db(early), db(at3), db(at11),
              ring_time(after.left, kRate, 110.0, 0.1, 1.5, 0.15));
  EXPECT(early < 0.4 * at3, "a rubbed bell swells");
  EXPECT(std::fabs(at11 / at3 - 1.0) < 0.02, "and holds far past Decay");
  EXPECT(std::fabs(ring_time(after.left, kRate, 110.0, 0.1, 1.5, 0.15) / 3.0 - 1.0) < 0.05, "let go, it rings out at Decay");
  double top[3];
  for (int which = 0; which < 3; ++which) {
    plain(device, TierceBells::kRubbed);
    device.set_param(p::kHardness, 0.5f * which);
    device.note_on(1, 220.0f, 0.8f);
    Stereo out = render(device, 4.0f, kRate);
    top[which] = db(partial_at(out.left, 440.0, 3.0) / partial_at(out.left, 220.0, 3.0));
  }
  std::printf("rubbed, Hardness 0, half, full: nominal %.1f, %.1f, %.1f dB on the prime\n", top[0], top[1], top[2]);
  EXPECT(top[2] > top[1] + 3.0 && top[1] > top[0] + 3.0, "rubbing harder brings up the upper partials");
}

static void test_clapper_and_levels() {
  double high[5], low[5];
  for (int which = 0; which < 5; ++which) {
    plain(device);
    device.set_param(p::kHardness, 0.25f * which);
    device.note_on(1, 220.0f, 0.8f);
    Stereo out = render(device, 0.5f, kRate);
    high[which] = partial_at(out.left, 880.0, 0.02, 0.1) + partial_at(out.left, 220.0 * 5.1, 0.02, 0.1);
    low[which] = partial_at(out.left, 220.0, 0.02, 0.1);
  }
  std::printf("Hardness in quarters, upper partials on the prime:");
  for (int which = 0; which < 5; ++which) std::printf(" %.1f", db(high[which] / low[which]));
  std::printf(" dB; the prime %.1f to %.1f dB\n", db(low[0]), db(low[4]));
  for (int which = 1; which < 5; ++which) EXPECT(db(high[which] / low[which]) > db(high[which - 1] / low[which - 1]) + 1.5, "each step harder is brighter");
  EXPECT(std::fabs(db(low[4] / low[0])) < 5.0, "and the note about as loud");

  double at02 = 0.0, at10 = 0.0;
  for (float gain : {0.2f, 0.7f, 1.0f}) {
    device.init(kRate);
    device.note_on(1, 220.0f, gain);
    Stereo out = render(device, 2.0f, kRate);
    const double level = db(loudest(out));
    std::printf("default patch, one note at gain %.1f: peak %.1f dBFS\n", gain, level);
    if (gain == 0.7f) EXPECT(level > -24.0 && level < -10.0, "one note at 0.7 peaks between -24 and -10 dBFS");
    if (gain == 0.2f) at02 = rms(out.left);
    if (gain == 1.0f) at10 = rms(out.left);
  }
  EXPECT(db(at10 / at02) > 12.0 && db(at10 / at02) < 36.0, "velocity gives 12 to 36 dB");

  // A full pool at gain 1, on chords and on one pitch, under the clip's knee
  // at the default patch on every bell. Rendered 30 dB down, where the clip
  // is a straight line, and scaled back.
  const int sets[6][12] = {{0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33}, {0, 4, 7, 12, 16, 19, 24, 28, 31, 36, 40, 43},
                           {0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19},   {0, 7, 14, 16, 17, 21, 24, 26, 28, 31, 33, 36},
                           {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11},       {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0}};
  for (int bell = 0; bell < 4; ++bell) {
    double worst = 0.0;
    for (const auto& set : sets) {
      for (float base : {65.4f, 92.5f, 130.8f, 220.0f}) {
        device.init(kRate);
        device.set_param(p::kBell, static_cast<float>(bell));
        device.set_param(p::kVolume, p::kParamDefault[p::kVolume] - 30.0f);
        for (int n = 0; n < 12; ++n) device.note_on(n, base * std::exp2(set[n] / 12.0f), 1.0f);
        Stereo out = render(device, bell == TierceBells::kRubbed ? 4.0f : 1.0f, kRate);
        worst = std::max(worst, loudest(out) * std::pow(10.0, 1.5));
      }
    }
    std::snprintf(label, sizeof label, "bell %d: twelve at full gain, six sets on four keys, reach %.3f (knee 0.5)", bell, worst);
    std::printf("%s\n", label);
    EXPECT(worst < 0.5, label);
  }
  // Struck again and again they hold: the same sets, four strikes of each.
  for (int bell = 0; bell < 4; ++bell) {
    double worst = 0.0;
    for (const auto& set : sets) {
      for (float base : {65.4f, 130.8f, 220.0f}) {
        device.init(kRate);
        device.set_param(p::kBell, static_cast<float>(bell));
        device.set_param(p::kVolume, p::kParamDefault[p::kVolume] - 30.0f);
        for (int hit = 0; hit < 4; ++hit) {
          for (int n = 0; n < 12; ++n) device.note_on(n, base * std::exp2(set[n] / 12.0f), 1.0f);
          worst = std::max(worst, loudest(render(device, bell == TierceBells::kRubbed ? 2.0f : 0.4f, kRate)) * std::pow(10.0, 1.5));
        }
      }
    }
    std::printf("bell %d: the same struck four times, %.3f\n", bell, worst);
    EXPECT(worst < 0.72, "a full pool struck four times is at most 3 dB over the knee");
  }
  // The clip is there.
  device.init(kRate);
  device.set_param(p::kVolume, 6.0f);
  device.set_param(p::kUpper, 1.0f);
  device.set_param(p::kHumLevel, 1.0f);
  device.set_param(p::kQuint, 1.0f);
  device.set_param(p::kHardness, 1.0f);
  for (int n = 0; n < 12; ++n) device.note_on(n, 110.0f * std::exp2(n / 4.0f), 1.0f);
  Stereo loud = render(device, 2.0f, kRate);
  EXPECT(loudest(loud) <= 1.0 && loudest(loud) > 0.8, "everything up is held by the soft clip");

  // Spread: none is mono; with it the sides differ and the beat turns.
  plain(device);
  device.set_param(p::kDoublet, 2.0f);
  device.note_on(1, 220.0f, 0.8f);
  Stereo mono = render(device, 1.0f, kRate);
  EXPECT(mono.left == mono.right, "no spread: left and right are the same");
  double last = 1.0;
  for (float spread : {0.25f, 0.5f, 0.75f, 1.0f}) {
    plain(device);
    device.set_param(p::kDoublet, 0.5f);
    device.set_param(p::kSpread, spread);
    device.note_on(1, 220.0f, 0.8f);
    Stereo wide = render(device, 4.0f, kRate);
    const double sides = correlation(wide.left, wide.right);
    std::printf("Spread %.2f: sides correlate %.2f, %.1f against %.1f dB\n", spread, sides, db(rms(wide.left)), db(rms(wide.right)));
    EXPECT(sides < last - 0.02, "more Spread, less alike");
    EXPECT(std::fabs(db(rms(wide.left) / rms(wide.right))) < 3.0, "and neither side is lost");
    last = sides;
  }

  // Single partials lean to a side.
  plain(device);
  device.set_param(p::kSpread, 1.0f);
  device.note_on(1, 440.0f, 0.8f);
  Stereo single = render(device, 1.0f, kRate);
  const double quint_side = db(bin_level(single.left, kRate, 660.0, at(0.1), at(0.5)) / bin_level(single.right, kRate, 660.0, at(0.1), at(0.5)));
  std::printf("the quint at full Spread: %.1f dB left against right\n", quint_side);
  EXPECT(std::fabs(quint_side) > 8.0, "a single partial leans to a side");
  // A level knob thrown under a low soft bell moves with no steps in it.
  double zipper = 0.0;
  for (int id : {p::kHumLevel, p::kUpper, p::kSpread}) {
    double moved = 0.0, still = 0.0;
    for (int pass = 0; pass < 3; ++pass) {
      plain(device);
      device.set_param(p::kHardness, 0.2f);
      device.set_param(id, pass == 2 ? 1.0f : 0.0f);
      device.note_on(1, 220.0f, 0.8f);
      render(device, 0.6f, kRate);
      if (pass == 0) device.set_param(id, 1.0f);
      const double k = kink(render(device, 0.05f, kRate).left);
      (pass == 0 ? moved : still) = std::max(pass == 0 ? moved : still, k);
    }
    zipper = std::max(zipper, moved / still);
  }
  std::printf("level knobs thrown: third difference at most %.1fx of the sound's own\n", zipper);
  EXPECT(zipper < 4.0, "level knobs move with no steps");

  // Everything at its extremes, at the ends of the keyboard, at 44.1 kHz.
  for (int bell = 0; bell < 4; ++bell) {
    device.init(44100.0f);
    device.set_param(p::kBell, static_cast<float>(bell));
    for (int id : {p::kDecay, p::kHardness, p::kDoublet, p::kUpper, p::kHumLevel, p::kQuint, p::kVolume, p::kLean, p::kTierce}) {
      device.set_param(id, p::kParamMax[id]);
    }
    device.set_param(p::kDamping, 0.0f);
    for (int round = 0; round < 3; ++round) {
      for (int n = 0; n < 14; ++n) device.note_on(n, n < 7 ? 20.0f + 3.0f * n : 4000.0f + 700.0f * (n - 7), 1.0f);
      Stereo out = render(device, 1.5f, 44100.0f);
      EXPECT(finite(out.left) && finite(out.right) && loudest(out) <= 1.0, "everything at its end stays finite and bounded");
    }
  }
}

// --- strikes on a bell that rings ----------------------------------------------------------------

static void test_restrikes() {
  // Struck again as hard as before, or at full gain, no partial comes out
  // quieter than one strike left it, whatever the clapper; half a second on
  // the two have added as power, up to what a bell may hold.
  double least = 1.0e9, most = 0.0;
  for (int bell = 0; bell < TierceBells::kNumBells; ++bell) {
    for (float hardness : {0.0f, 0.5f, 1.0f}) {
      for (float gain : {0.5f, 0.9f, 1.0f}) {
        double level[2][3];
        for (int pass = 0; pass < 2; ++pass) {
          plain(device, bell);
          device.set_param(p::kHardness, hardness);
          device.set_param(p::kDecay, 60.0f);
          device.set_param(p::kDamping, 0.0f);
          device.note_on(1, 220.0f, gain);
          render(device, 0.3f, kRate);
          if (pass == 1) device.note_on(1, 220.0f, gain);
          Stereo out = render(device, 0.5f, kRate);
          const double hz[3] = {110.0, 220.0, 440.0};
          for (int k = 0; k < 3; ++k) level[pass][k] = bin_level(out.left, kRate, hz[k], at(0.05), at(0.4));
        }
        for (int k = 0; k < 3; ++k) {
          if (bell == TierceBells::kRubbed) continue;  // the rub brings it to its own level
          least = std::min(least, level[1][k] / level[0][k]);
          most = std::max(most, level[1][k] / level[0][k]);
        }
      }
    }
  }
  std::printf("a bell struck twice alike, three bells, clappers and strengths: partials between %.2fx and %.2fx of one strike's\n", least, most);
  EXPECT(least > 1.02 && most < 1.55, "a second strike as strong adds to every partial, at full gain too");
  // A quarter turn at every pitch: two equal strikes add alike at the bottom
  // of the keyboard and at the top.
  double low = 1.0e9, high = 0.0;
  for (float hz : {110.0f, 880.0f, 3520.0f, 7000.0f}) {
    double level[2];
    for (int pass = 0; pass < 2; ++pass) {
      plain(device);
      device.set_param(p::kDecay, 60.0f);
      device.set_param(p::kDamping, 0.0f);
      device.note_on(1, hz, 0.6f);
      render(device, 0.3f, kRate);
      if (pass == 1) device.note_on(1, hz, 0.6f);
      Stereo out = render(device, 0.6f, kRate);
      level[pass] = bin_level(out.left, kRate, 1.2005 * hz, at(0.05), at(0.5)) + bin_level(out.left, kRate, hz, at(0.05), at(0.5));
    }
    low = std::min(low, level[1] / level[0]);
    high = std::max(high, level[1] / level[0]);
  }
  std::printf("the same from 110 to 7000 Hz: %.3fx to %.3fx\n", low, high);
  EXPECT(high - low < 0.03, "the second strike is a quarter turn from the first at every pitch");
  // A soft clapper on what a hard one left does not damp it.
  plain(device);
  device.set_param(p::kHardness, 1.0f);
  device.set_param(p::kDecay, 60.0f);
  device.set_param(p::kDamping, 0.0f);
  device.note_on(1, 220.0f, 1.0f);
  Stereo hard = render(device, 0.5f, kRate);
  device.set_param(p::kHardness, 0.0f);
  device.note_on(1, 220.0f, 0.3f);
  Stereo soft = render(device, 0.5f, kRate);
  const double kept = db(bin_level(soft.left, kRate, 880.0, at(0.05), at(0.3)) / bin_level(hard.left, kRate, 880.0, at(0.15), at(0.3)));
  std::printf("a soft touch after a hard strike: the fourth partial at %+.1f dB\n", kept);
  EXPECT(kept > -2.5, "a soft clapper leaves what a hard one rang");

  // A strike that leans, on a bell whose third has come to rest: what rings
  // glides to the new place, it does not jump, and is as loud there as the
  // two add up to.
  double before_deciem = 0.0;
  const auto third_after = [&before_deciem](float hz, float gain, float lean, Stereo* out, double* before) {
    plain(device);
    device.set_param(p::kTierce, 386.31f);
    device.set_param(p::kLean, lean);
    device.set_param(p::kGlide, 8.0f);
    device.set_param(p::kQuint, 0.0f);
    device.set_param(p::kDecay, 60.0f);
    device.set_param(p::kDamping, 0.0f);
    device.note_on(1, hz, 0.8f);
    Stereo first = render(device, 8.2f, kRate);
    device.process(5);  // off the control clock's beat
    *before = bin_level(first.left, kRate, hz * std::exp2(386.31 / 1200.0), at(8.0), at(0.2));
    before_deciem = bin_level(first.left, kRate, 2.0 * hz * std::exp2(386.31 / 1200.0), at(8.0), at(0.2));
    if (gain > 0.0f) device.note_on(1, hz, gain);
    *out = render(device, 1.0f, kRate);
  };
  Stereo out;
  double before = 0.0;
  third_after(440.0f, 0.1f, 111.73f, &out, &before);
  const double early = cents(pitch_at(out.left, 440.0 * std::exp2(395.0 / 1200.0), 0.02, 0.04, 0.06), 440.0);
  const double later = cents(pitch_at(out.left, 440.0 * std::exp2(497.0 / 1200.0), 0.4, 0.25), 440.0);
  std::printf("a soft strike with Lean on a third at rest: it is at %.0f ct after 20 ms and %.1f after 0.4 s\n", early, later);
  EXPECT(early < 425.0, "what rings does not jump to the lean");
  EXPECT_NEAR(later, 497.5, 1.5, "and has joined it");
  const double moving = kink(out.left, 0, at(0.3));
  third_after(440.0f, 0.1f, 0.0f, &out, &before);
  const double resting = kink(out.left, 0, at(0.3));
  EXPECT(moving < 1.6 * resting, "with no click on the way");
  for (bool deciem : {false, true}) {
    low = 1.0e9;
    high = 0.0;
    for (float hz : {164.8f, 440.0f, 1760.0f, 3520.0f, 5500.0f}) {
      third_after(hz, 0.5f, 111.73f, &out, &before);
      const double octave = deciem ? 2.0 : 1.0;
      const double loud = deciem ? before_deciem : before;
      const double joined = bin_level(out.left, kRate, octave * hz * std::exp2(497.9 / 1200.0), at(0.14), at(0.08));
      low = std::min(low, joined / loud);
      high = std::max(high, joined / loud);
    }
    std::printf("and its %s is %.3fx to %.3fx as loud there as it was, 165 to 5500 Hz\n", deciem ? "deciem" : "third", low, high);
    EXPECT(high / low < 1.05, "the two add as power whatever the pitch");
    EXPECT(low > 1.6 && high < 1.85, "and as much as they would at rest");
  }
  // A rubbed bell the same, with no swell or hole when they meet.
  plain(device, TierceBells::kRubbed);
  device.set_param(p::kTierce, 386.31f);
  device.set_param(p::kLean, 111.73f);
  device.set_param(p::kGlide, 2.0f);
  device.note_on(1, 220.0f, 0.8f);
  Stereo rub = render(device, 4.0f, kRate);
  device.note_on(1, 220.0f, 0.8f);
  const double held = rms(rub.left, at(3.5));
  rub = render(device, 1.0f, kRate);
  double worst = 0.0;
  for (double t = 0.0; t < 0.85; t += 0.05) worst = std::max(worst, std::fabs(db(rms(rub.left, at(t), at(t + 0.1)) / held)));
  std::printf("a rubbed bell rubbed again with Lean: within %.2f dB of its level\n", worst);
  EXPECT(worst < 0.5, "a rubbed bell keeps its level when it leans again");
  // Rubbed again harder it grows, softer it sinks to the softer level.
  double rubbed[3];
  plain(device, TierceBells::kRubbed);
  device.set_param(p::kDecay, 2.0f);
  for (int which = 0; which < 3; ++which) {
    device.note_on(1, 220.0f, which == 1 ? 0.9f : 0.4f);
    render(device, 4.0f, kRate);
    rubbed[which] = loud_after(0.5, 0.4);
  }
  std::printf("rubbed at 0.4, 0.9 and 0.4 again: %.1f %.1f %.1f dB\n", db(rubbed[0]), db(rubbed[1]), db(rubbed[2]));
  EXPECT(db(rubbed[1] / rubbed[0]) > 5.0 && std::fabs(db(rubbed[2] / rubbed[0])) < 0.5, "a bell rubbed again takes the new strength");
  // A strike in the middle of a strike follows it and is not lost.
  double follow[2];
  for (int pass = 0; pass < 2; ++pass) {
    plain(device);
    device.set_param(p::kHardness, 0.0f);
    device.note_on(1, 110.0f, 0.4f);
    device.process(130);
    if (pass == 1) device.note_on(2, 110.0f, 0.8f);
    follow[pass] = loud_after(0.5, 0.4);
  }
  std::printf("a hard strike in the middle of a soft one: %+.1f dB\n", db(follow[1] / follow[0]));
  EXPECT(db(follow[1] / follow[0]) > 5.0, "a strike in the middle of a strike is not lost");
  // Leaning or not, quick or slow, strikes do not pile up.
  double pile = 0.0;
  for (float lean : {-231.0f, 20.0f, 111.0f}) {
    for (float glide : {0.02f, 0.3f, 5.0f}) {
      for (double gap : {0.004, 0.031, 0.09, 0.125}) {
        double loud[2] = {0.0, 0.0};
        for (int pass = 0; pass < 2; ++pass) {
          plain(device);
          device.set_param(p::kLean, lean);
          device.set_param(p::kGlide, glide);
          device.set_param(p::kDecay, 60.0f);
          device.set_param(p::kDamping, 0.0f);
          device.set_param(p::kVolume, -24.0f);
          for (int hit = 0; hit < (pass == 0 ? 1 : 40); ++hit) {
            device.note_on(1, 220.0f, 1.0f);
            loud[pass] = std::max(loud[pass], loudest(render(device, static_cast<float>(pass == 0 ? 0.5 : gap), kRate)));
          }
        }
        pile = std::max(pile, db(loud[1] / loud[0]));
      }
    }
  }
  std::printf("struck 40 times with Lean: at most %+.1f dB over one strike\n", pile);
  EXPECT(pile < 4.0, "strikes that lean do not stack without limit");
  // Block sizes, with strikes that lean falling anywhere.
  double block_worst = 0.0;
  Stereo base;
  for (int mode = 0; mode < 4; ++mode) {
    const int sizes[4] = {128, 1, 2048, 37};
    plain(device);
    device.set_param(p::kLean, 111.0f);
    device.set_param(p::kGlide, 0.2f);
    device.set_param(p::kHardness, 0.9f);
    Stereo all;
    for (int hit = 0; hit < 12; ++hit) {
      device.note_on(1, 220.0f, 0.3f + 0.05f * hit);
      all = concat(all, render(device, 0.0173f * (1 + hit), kRate, sizes[mode]));
    }
    if (mode == 0) base = all;
    block_worst = std::max(block_worst, worst_difference(base, all));
  }
  EXPECT(block_worst == 0.0, "strikes that lean do not depend on the block size");
}

// What is heard of the clapper itself: between 2 and 5 kHz, where an A2 has
// no partial.
static double clack_level(int bell, float hardness, float gain, float rate, double from, double to) {
  plain(device, bell, rate);
  device.set_param(p::kHardness, hardness);
  device.note_on(1, 110.0f, gain);
  Stereo out = render(device, 0.1f, rate);
  double power = 0.0;
  for (double hz = 2000.0; hz <= 5000.0; hz += 100.0) power += std::pow(bin_level(out.left, rate, hz, at(from, rate), at(to - from, rate)), 2.0);
  return std::sqrt(power);
}

static void test_clack() {
  double level[5];
  for (int which = 0; which < 5; ++which) level[which] = db(clack_level(0, 0.25f * which, 0.9f, kRate, 0.0005, 0.0125));
  std::printf("the clapper itself, Hardness in quarters: %.1f %.1f %.1f %.1f %.1f dB", level[0], level[1], level[2], level[3], level[4]);
  for (int which = 2; which < 5; ++which) EXPECT(level[which] > level[which - 1] + 2.5, "a harder clapper is heard more");
  EXPECT(level[4] > level[0] + 25.0 && level[4] > -52.0 && level[4] < -34.0, "hard it is heard, soft it is not");
  const double late = db(clack_level(0, 1.0f, 0.9f, kRate, 0.06, 0.072)), soft = db(clack_level(0, 1.0f, 0.3f, kRate, 0.0005, 0.0125));
  const double rubbed = db(clack_level(3, 1.0f, 0.9f, kRate, 0.0005, 0.0125)), hand = db(clack_level(1, 1.0f, 0.9f, kRate, 0.0005, 0.0125));
  std::printf("; 60 ms on %.1f; a light strike %.1f; handbell %.1f, rubbed %.1f\n", late, soft, hand, rubbed);
  EXPECT(late < level[4] - 35.0, "and is over at once");
  EXPECT(soft < level[4] - 12.0, "a light strike has little of it");
  EXPECT(hand < level[4] - 2.0 && rubbed < level[4] - 20.0, "a handbell's is softer and a rubbed bell has none");
  double least = 1.0e9, most = -1.0e9;
  for (float rate : {44100.0f, 48000.0f, 96000.0f, 192000.0f}) {
    double power = 0.0;
    for (int n = 0; n < 24; ++n) {  // noise: over several notes' seeds
      plain(device, 0, rate);
      device.set_param(p::kHardness, 1.0f);
      device.note_on(1, 100.0f + 0.7f * n, 1.0f);
      Stereo out = render(device, 0.02f, rate);
      for (double hz = 2000.0; hz <= 5000.0; hz += 150.0) power += std::pow(bin_level(out.left, rate, hz, at(0.0005, rate), at(0.012, rate)), 2.0);
    }
    least = std::min(least, 0.5 * db(power));
    most = std::max(most, 0.5 * db(power));
  }
  std::printf("44.1 to 192 kHz it is within %.2f dB\n", most - least);
  EXPECT(most - least < 1.2, "and as loud at every sample rate");
  // The same bell twice from silence is the same sound.
  Stereo first, second;
  for (int pass = 0; pass < 2; ++pass) {
    if (pass == 0) plain(device);
    device.set_param(p::kHardness, 1.0f);
    device.set_param(p::kRelease, 1.0f);
    device.set_param(p::kDecay, 0.5f);
    device.note_on(1, 220.0f, 0.9f);
    (pass == 0 ? first : second) = render(device, 0.3f, kRate);
    device.note_off(1);
    render(device, 1.0f, kRate);
  }
  EXPECT(worst_difference(first, second) == 0.0, "a bell struck again from silence is the same bell");
}

int main() {
  Conformance spec;
  spec.name = "tierce-bells";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  // A bell let go at the defaults rings 8.3 s to -60 dB and is retired at
  // -120 dB.
  spec.tail_seconds = 22.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  test_follow();
  test_named_thirds();
  test_suspension();
  test_moving_thirds();
  test_hum_and_quint();
  test_doublets();
  test_decay();
  test_one_bell();
  test_restrikes();
  test_clack();
  test_voices();
  test_rules();
  test_bells();
  test_clapper_and_levels();

  device.init(kRate);
  for (int n = 0; n < 12; ++n) device.note_on(n, 55.0f * std::exp2(n / 4.0f), 0.8f);
  render(device, 0.5f, kRate);
  report_cost("tierce-bells (tower, 12 notes)", 5.0f, kRate, [] { render(device, 5.0f, kRate); });
  return finish("tierce-bells");
}
