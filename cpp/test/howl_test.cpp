// Native harness for Howl (cpp/devices/howl). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it a feedback loop: it sings on the overtones
// of the note Distance tunes, over a threshold Gain sets, at a level it holds
// and never passes, for as long as Hold says, and then it stops.

#include "../devices/howl/howl.h"
#include "support/test_kit.h"

#include <cstdlib>

using namespace testkit;
using livemix::Howl;
namespace p = livemix::howl;

static Howl device;

static const float kRate = 48000.0f;

// EXPECT, and with HOWL_VERBOSE set every measurement is printed as it is made.
static const bool kVerbose = std::getenv("HOWL_VERBOSE") != nullptr;
#define CHECK(condition, message)                                             \
  do {                                                                        \
    const bool held_ = (condition);                                           \
    if (kVerbose) std::printf("  %s %s\n", held_ ? "ok  " : "FAIL", message); \
    EXPECT(held_, message);                                                   \
  } while (0)

// A struck note: eight harmonics, the upper ones dying sooner.
static std::vector<float> note(float hz, float seconds, float gain, float rate = kRate) {
  std::vector<float> out(static_cast<size_t>(seconds * rate));
  for (size_t i = 0; i < out.size(); ++i) {
    const double t = static_cast<double>(i) / rate;
    double v = 0.0;
    for (int h = 1; h <= 8; ++h) {
      v += std::sin(2.0 * kPi * hz * h * t) / h * std::exp(-t * h / 0.6);
    }
    out[i] = gain * static_cast<float>(v * (1.0 - std::exp(-t * 400.0)));
  }
  return out;
}

// A held chord of sines, each `gain` high, rising over 5 ms.
static std::vector<float> chord(std::initializer_list<float> hz, float seconds, float gain,
                                float rate = kRate) {
  std::vector<float> out(static_cast<size_t>(seconds * rate), 0.0f);
  for (float f : hz) {
    for (size_t i = 0; i < out.size(); ++i) {
      const double t = static_cast<double>(i) / rate;
      out[i] += gain * static_cast<float>(std::sin(2.0 * kPi * f * t) * (1.0 - std::exp(-t * 200.0)));
    }
  }
  return out;
}

// The loop alone and still: no wander, both sides the same, nothing ducked,
// no harmonics added, and only the feedback at the output.
static void still(Howl& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kMove, 0.0f);
  d.set_param(p::kWidth, 0.0f);
  d.set_param(p::kFollow, 0.0f);
  d.set_param(p::kEdge, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

// The frequency of a nearly pure tone from its upward zero crossings.
static double crossing_hz(const std::vector<float>& x, double rate, size_t from, size_t to) {
  double first = -1.0, last = -1.0;
  int count = 0;
  for (size_t i = from + 1; i < to && i < x.size(); ++i) {
    if (x[i - 1] < 0.0f && x[i] >= 0.0f) {
      const double at = static_cast<double>(i - 1) + (0.0 - x[i - 1]) / (x[i] - x[i - 1]);
      if (first < 0.0) first = at;
      last = at;
      ++count;
    }
  }
  return count > 1 ? (count - 1) * rate / (last - first) : 0.0;
}

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

static bool same(const Stereo& a, const Stereo& b, double tolerance, double* worst = nullptr) {
  double w = 0.0;
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) {
    w = std::max(w, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    w = std::max(w, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  if (worst) *worst = w;
  return a.size() == b.size() && w <= tolerance;
}

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }

// With a short note in, the loop goes on at a whole multiple of 1 / Distance:
// the one the body passes best.
static void check_tuning() {
  char label[200];
  struct Case {
    float rate, distance, body;
  };
  const Case cases[] = {{48000.0f, 4.0f, 520.0f},   {48000.0f, 7.645f, 520.0f}, {48000.0f, 15.0f, 520.0f},
                        {48000.0f, 7.645f, 1700.0f}, {48000.0f, 25.0f, 150.0f},  {44100.0f, 7.645f, 520.0f},
                        {96000.0f, 7.645f, 520.0f}};
  for (const Case& c : cases) {
    still(device, c.rate);
    device.set_param(p::kDistance, c.distance);
    device.set_param(p::kBody, c.body);
    device.set_param(p::kGain, 0.8f);
    device.set_param(p::kHold, 8.0f);
    run(device, note(196.0f, 0.5f, 0.4f, c.rate));
    Stereo tail = render(device, 2.0f, c.rate);
    const double f0 = 1000.0 / c.distance;
    const double sung = crossing_hz(tail.left, c.rate, at(1.0, c.rate), at(2.0, c.rate));
    const int overtone = static_cast<int>(std::lround(sung / f0));
    int best = 1;
    for (int k = 1; k < 200; ++k) {
      if (std::fabs(std::log(k * f0 / c.body)) < std::fabs(std::log(best * f0 / c.body))) best = k;
    }
    const double off = overtone > 0 ? cents(sung, overtone * f0) : 1.0e9;
    std::snprintf(label, sizeof label,
                  "%.0f Hz, Distance %.3f ms, Body %.0f Hz: sings %.2f Hz, overtone %d (want %d), %.2f cents off it",
                  c.rate, c.distance, c.body, sung, overtone, best, off);
    CHECK(overtone == best && std::fabs(off) < 3.0, label);
    // And it is one tone: nearly all of the tail is at that frequency.
    const size_t from = at(1.0, c.rate), to = at(1.5, c.rate);
    const double tone = tone_level(tail.left, sung, c.rate, from, to) / std::sqrt(2.0);
    std::snprintf(label, sizeof label, "Distance %.3f ms: the tail is one tone (%.4f of %.4f rms)",
                  c.distance, tone, rms(tail.left, from, to));
    CHECK(tone > 0.97 * rms(tail.left, from, to), label);
  }
}

// Gain is the loop's gain at the body's centre: under 0 dB the loop rings and
// dies at the rate that gain gives, over it the loop sustains.
static void check_threshold() {
  char label[200];
  // Distance 5 ms tunes 200 Hz; the body stands on its fourth multiple.
  const auto tail_of = [&](float gain) {
    still(device);
    device.set_param(p::kDistance, 5.0f);
    device.set_param(p::kBody, 800.0f);
    device.set_param(p::kGain, gain);
    device.set_param(p::kHold, 30.0f);
    run(device, note(200.0f, 0.5f, 0.4f));
    return render(device, 3.0f, kRate);
  };
  {
    Stereo under = tail_of(0.55f);  // -1.5 dB a turn, a turn every 5 ms: 300 dB a second
    const double early = rms(under.left, at(0.0), at(0.02));
    const double later = rms(under.left, at(0.1), at(0.12));
    const double fall = db(early) - db(later);
    std::snprintf(label, sizeof label, "Gain 0.55 (-1.5 dB): the loop dies away, %.1f dB in 100 ms (30 by its gain)", fall);
    CHECK(fall > 24.0 && fall < 36.0, label);
    // What is left is the loop's own seed, rung up by a loop 1.5 dB short of
    // sustaining: a hiss far under the note (which stood at 0.35 rms).
    const double left_over = rms(under.left, at(1.0), at(3.0));
    std::snprintf(label, sizeof label, "under the threshold a second later only the seed is left: %.1f dB",
                  db(left_over));
    CHECK(left_over < 1.0e-4, label);
  }
  {
    Stereo over = tail_of(0.65f);
    const double early = rms(over.left, at(0.1), at(0.3));
    const double late = rms(over.left, at(2.6), at(2.8));
    // The ceiling falls 60 dB in Hold, 30 s: 5 dB over these 2.5 s.
    const double fall = db(early) - db(late);
    std::snprintf(label, sizeof label, "Gain 0.65 (+1.5 dB): the loop sustains, falling %.2f dB in 2.5 s (5 by Hold)", fall);
    CHECK(fall > 4.5 && fall < 5.5, label);
  }
}

// The loop sings at the ceiling, whatever the gain over the threshold: the
// playing's RMS times kLevel, falling by Hold once the playing stops.
static void check_level_hold() {
  char label[200];
  const float amplitude = 0.5f;
  const double ceiling = Howl::kLevel * amplitude / std::sqrt(2.0);
  double levels[3];
  int n = 0;
  for (float gain : {0.7f, 0.85f, 1.0f}) {
    still(device);
    device.set_param(p::kDistance, 5.0f);
    device.set_param(p::kBody, 800.0f);
    device.set_param(p::kGain, gain);
    device.set_param(p::kHold, 30.0f);
    Stereo during = run(device, sine(330.0f, 2.0f, kRate, amplitude));
    Stereo tail = render(device, 1.0f, kRate);
    // 0.25 s after the playing stops the ceiling has fallen 0.5 dB.
    const double level = peak(tail.left, at(0.2), at(0.3));
    const double expected = ceiling * std::pow(10.0, -3.0 * 0.25 / 30.0);
    levels[n++] = level;
    std::snprintf(label, sizeof label, "Gain %.2f: the loop sings at %.4f, the ceiling is %.4f (%.2f dB off)",
                  gain, level, expected, db(level / expected));
    CHECK(std::fabs(db(level / expected)) < 0.5, label);
    const double most = std::max(peak(during.left), peak(tail.left));
    std::snprintf(label, sizeof label, "Gain %.2f: nothing passes twice the ceiling (peak %.4f, ceiling %.4f)",
                  gain, most, ceiling);
    CHECK(most < 2.0 * ceiling * 1.02, label);
  }
  CHECK(std::fabs(db(levels[0] / levels[2])) < 0.3, "the level does not follow Gain over the threshold");
  // Half as loud in, half as loud a howl.
  still(device);
  device.set_param(p::kDistance, 5.0f);
  device.set_param(p::kBody, 800.0f);
  device.set_param(p::kHold, 30.0f);
  run(device, sine(330.0f, 2.0f, kRate, 0.5f * amplitude));
  Stereo quiet = render(device, 1.0f, kRate);
  const double half = peak(quiet.left, at(0.2), at(0.3));
  std::snprintf(label, sizeof label, "half the level in is %.2f dB less howl (6.02)", db(levels[0] / half));
  CHECK(std::fabs(db(levels[0] / half) - 6.02) < 0.3, label);
}

// Hold is the time the howl takes to fall 60 dB once the playing stops, and
// then it stops: the loop is cleared and the device sleeps.
static void check_hold() {
  char label[200];
  for (float rate : {48000.0f, 96000.0f}) {
    for (float hold : {0.5f, 2.0f, 6.0f}) {
      if (rate != 48000.0f && hold != 2.0f) continue;
      still(device, rate);
      device.set_param(p::kGain, 0.8f);
      device.set_param(p::kHold, hold);
      run(device, note(196.0f, 0.5f, 0.4f, rate));
      Stereo tail = render(device, 2.2f * hold, rate);
      const double measured = rt60(tail.left, rate, 0.05, hold / 20.0, -70.0);
      std::snprintf(label, sizeof label, "%.0f Hz, Hold %.1f s: the howl falls 60 dB in %.3f s", rate, hold,
                    measured);
      CHECK(std::fabs(measured - hold) < 0.05 * hold, label);
      size_t last = tail.size();
      while (last > 0 && tail.left[last - 1] == 0.0f && tail.right[last - 1] == 0.0f) --last;
      std::snprintf(label, sizeof label, "Hold %.1f s: exact silence from %.2f s on", hold, last / rate);
      CHECK(last < at(2.0 * hold, rate) && last > at(1.2 * hold, rate), label);
      CHECK(device.meter(0) == 0.0f && device.meter(1) == 0.0f && device.meter(6) == 0.0f,
             "at rest the readings are at rest");
    }
  }
}

// Follow: a new note knocks the loop back, and it blooms again as the note rings.
static void check_follow() {
  char label[200];
  // A howl is held by a first chord; a second one, louder, comes in over it.
  // What is measured is the howl's own tone, 800 Hz, which neither chord has.
  const auto howl_under = [&](float follow, double* before, double* under, double* after) {
    still(device);
    device.set_param(p::kDistance, 5.0f);
    device.set_param(p::kBody, 800.0f);
    device.set_param(p::kGain, 0.75f);
    device.set_param(p::kHold, 30.0f);
    device.set_param(p::kFollow, follow);
    std::vector<float> first = chord({330.0f}, 2.0f, 0.2f);
    std::vector<float> second = chord({330.0f, 440.0f}, 2.0f, 0.3f);
    Stereo a = run(device, first);
    Stereo b = run(device, second);
    *before = tone_level(a.left, 800.0, kRate, at(1.7), at(2.0));
    *under = tone_level(b.left, 800.0, kRate, at(0.05), at(0.25));
    *after = tone_level(b.left, 800.0, kRate, at(1.5), at(2.0));
  };
  double before0, under0, after0, before1, under1, after1;
  howl_under(0.0f, &before0, &under0, &after0);
  howl_under(1.0f, &before1, &under1, &after1);
  std::snprintf(label, sizeof label, "Follow 0: the howl sings through a new note (%.4f before, %.4f under it)",
                before0, under0);
  CHECK(under0 > 0.5 * before0, label);
  std::snprintf(label, sizeof label,
                "Follow 1: a new note knocks the howl back (%.4f before, %.5f under it, %.1f dB down on Follow 0)",
                before1, under1, db(under0 / under1));
  CHECK(under1 < 0.1 * under0, label);
  std::snprintf(label, sizeof label, "Follow 1: it blooms again as the note rings (%.4f, %.4f with Follow 0)",
                after1, after0);
  CHECK(after1 > 0.7 * after0, label);
  // On a held sound nothing is new: after its first moment Follow leaves the howl alone.
  double held[2];
  int n = 0;
  for (float follow : {0.0f, 1.0f}) {
    still(device);
    device.set_param(p::kFollow, follow);
    Stereo out = run(device, chord({196.0f, 246.94f}, 4.0f, 0.2f));
    held[n++] = rms(out.left, at(3.0), at(4.0));
  }
  std::snprintf(label, sizeof label, "on a held chord Follow changes nothing after the start (%.4f, %.4f)",
                held[0], held[1]);
  CHECK(std::fabs(db(held[0] / held[1])) < 0.5, label);
}

// Edge adds the third, fifth and seventh harmonics of the tone, a third, a
// fifth and a seventh as strong, and changes neither its level nor the threshold.
static void check_edge() {
  char label[200];
  double fundamental[2] = {0.0, 0.0};
  int n = 0;
  for (float edge : {0.0f, 1.0f}) {
    still(device);
    device.set_param(p::kDistance, 5.0f);
    device.set_param(p::kBody, 800.0f);
    device.set_param(p::kGain, 0.8f);
    device.set_param(p::kHold, 30.0f);
    device.set_param(p::kEdge, edge);
    run(device, note(200.0f, 0.5f, 0.4f));
    Stereo tail = render(device, 1.5f, kRate);
    const size_t from = at(1.0), to = at(1.5);
    const double one = tone_level(tail.left, 800.0, kRate, from, to);
    const double third = tone_level(tail.left, 2400.0, kRate, from, to) / one;
    const double fifth = tone_level(tail.left, 4000.0, kRate, from, to) / one;
    const double seventh = tone_level(tail.left, 5600.0, kRate, from, to) / one;
    fundamental[n++] = one;
    std::snprintf(label, sizeof label, "Edge %.0f: harmonics at %.1f, %.1f and %.1f dB of the tone", edge,
                  db(third), db(fifth), db(seventh));
    if (edge == 0.0f) {
      CHECK(third < 0.01 && fifth < 0.01 && seventh < 0.01, label);
    } else {
      CHECK(std::fabs(db(third) - db(1.0 / 3.0)) < 1.5 && std::fabs(db(fifth) - db(0.2)) < 1.5 &&
                 std::fabs(db(seventh) - db(1.0 / 7.0)) < 1.5,
             label);
    }
  }
  std::snprintf(label, sizeof label, "Edge leaves the tone's level alone (%.4f, %.4f)", fundamental[0],
                fundamental[1]);
  CHECK(std::fabs(db(fundamental[0] / fundamental[1])) < 0.5, label);
  // Under the threshold Edge does not make the loop sing.
  still(device);
  device.set_param(p::kDistance, 5.0f);
  device.set_param(p::kBody, 800.0f);
  device.set_param(p::kGain, 0.55f);
  device.set_param(p::kHold, 30.0f);
  device.set_param(p::kEdge, 1.0f);
  run(device, note(200.0f, 0.5f, 0.4f));
  Stereo tail = render(device, 1.5f, kRate);
  CHECK(peak(tail.left, at(1.0), at(1.5)) < 1.0e-4, "Edge does not move the threshold");
}

// The wander as howl.h has it: two sines read off the sample count.
static double wander_at(double seconds, double pace, double lead = 0.0) {
  return Howl::kWanderWeights[0] * std::sin(2.0 * kPi * (pace * seconds + lead)) +
         Howl::kWanderWeights[1] * std::sin(2.0 * kPi * (pace * Howl::kWanderRatio * seconds + lead));
}

// Move: the body wanders and the howl goes from overtone to overtone, always
// on one; at Move 0 it holds the one it has.
static void check_move() {
  char label[240];
  const double f0 = 1000.0 / 7.645;
  for (float move : {0.0f, 1.0f}) {
    still(device);
    device.set_param(p::kGain, 0.85f);
    device.set_param(p::kHold, 30.0f);
    device.set_param(p::kMove, move);
    device.set_param(p::kPace, 0.25f);
    run(device, note(196.0f, 0.5f, 0.4f));
    bool seen[64] = {};
    int clean = 0, windows = 0, distinct = 0, near = 0;
    char trail[160] = "";
    size_t used = 0;
    for (int w = 0; w < 40; ++w) {
      Stereo out = render(device, 0.25f, kRate);
      const float centre = device.meter(4);
      const double sung = crossing_hz(out.left, kRate, at(0.05), at(0.25));
      const int k = static_cast<int>(std::lround(sung / f0));
      ++windows;
      if (k < 1 || k > 63 || std::fabs(cents(sung, k * f0)) > 5.0) continue;
      ++clean;
      if (!seen[k]) {
        seen[k] = true;
        ++distinct;
      }
      if (std::fabs(std::log2(k * f0 / centre)) < 0.5) ++near;
      if (used + 4 < sizeof trail) used += std::snprintf(trail + used, sizeof trail - used, "%d ", k);
    }
    std::snprintf(label, sizeof label,
                  "Move %.0f: %d of %d quarter seconds sing one overtone to 5 cents, %d different ones: %s", move,
                  clean, windows, distinct, trail);
    if (move == 0.0f) {
      CHECK(clean == windows && distinct == 1, label);
    } else {
      CHECK(clean >= windows * 6 / 10 && distinct >= 3, label);
      std::snprintf(label, sizeof label, "Move 1: %d of %d of them within half an octave of the body", near, clean);
      CHECK(near >= clean * 8 / 10, label);
    }
  }
}

// The wander runs by the clock: where the body stands depends on the time
// since init and on nothing else, asleep or awake, whatever the block size.
static void check_clock() {
  char label[200];
  float centres[3];
  int n = 0;
  for (int block : {1, 128, 2048}) {
    device.init(kRate);
    device.set_param(p::kMove, 0.8f);
    device.set_param(p::kPace, 0.37f);
    device.set_param(p::kWidth, 0.0f);
    device.set_param(p::kBody, 500.0f);
    run(device, silence(3.3f, kRate), block);  // asleep throughout
    run(device, note(196.0f, 0.5f, 0.4f), block);
    centres[n++] = device.meter(4);
  }
  // The reading is of the last control tick: up to 32 samples before 3.8 s.
  const double expected = 500.0 * std::pow(2.0, 0.8 * Howl::kMoveOctaves * wander_at(3.8, 0.37));
  std::snprintf(label, sizeof label, "after 3.3 s asleep and 0.5 s awake the body stands at %.2f Hz (%.2f by the clock)",
                centres[1], expected);
  CHECK(std::fabs(centres[1] / expected - 1.0) < 0.003, label);
  CHECK(centres[0] == centres[1] && centres[1] == centres[2], "the same at block sizes 1, 128 and 2048");
  // The right side runs a quarter of a cycle ahead at Width 1.
  device.init(kRate);
  device.set_param(p::kMove, 0.8f);
  device.set_param(p::kPace, 0.37f);
  device.set_param(p::kWidth, 1.0f);
  device.set_param(p::kBody, 500.0f);
  run(device, note(196.0f, 2.0f, 0.4f));
  const double right = 500.0 * std::pow(2.0, 0.8 * wander_at(2.0, 0.37, Howl::kWanderLead) + Howl::kWidthOctaves);
  const double left = 500.0 * std::pow(2.0, 0.8 * wander_at(2.0, 0.37) - Howl::kWidthOctaves);
  std::snprintf(label, sizeof label, "Width 1: the bodies stand at %.1f and %.1f Hz (%.1f and %.1f)",
                device.meter(4), device.meter(5), left, right);
  CHECK(std::fabs(device.meter(4) / left - 1.0) < 0.003 && std::fabs(device.meter(5) / right - 1.0) < 0.003, label);
}

// Width: at 0 the two sides are one; at 1 each sings an overtone of its own.
// The wet path sums nothing, so sides in opposite phase howl as loud as one.
static void check_width() {
  char label[200];
  const double f0 = 1000.0 / 7.645;
  still(device);
  device.set_param(p::kGain, 0.8f);
  device.set_param(p::kHold, 30.0f);
  run(device, note(196.0f, 0.5f, 0.4f));
  Stereo mono = render(device, 2.0f, kRate);
  // Only the air noise differs, 80 dB under the tone.
  double worst = 0.0;
  same(mono, Stereo{mono.right, mono.left}, 0.0, &worst);
  std::snprintf(label, sizeof label, "Width 0: the sides differ by %.2g at most", worst);
  CHECK(worst < 1.0e-3, label);

  still(device);
  device.set_param(p::kGain, 0.8f);
  device.set_param(p::kHold, 30.0f);
  device.set_param(p::kWidth, 1.0f);
  run(device, note(196.0f, 0.5f, 0.4f));
  Stereo wide = render(device, 2.0f, kRate);
  const double left = crossing_hz(wide.left, kRate, at(1.0), at(2.0));
  const double right = crossing_hz(wide.right, kRate, at(1.0), at(2.0));
  std::snprintf(label, sizeof label, "Width 1: the left sings %.2f Hz (overtone %.3f), the right %.2f Hz (%.3f)",
                left, left / f0, right, right / f0);
  CHECK(std::lround(left / f0) == 3 && std::lround(right / f0) == 5 &&
             std::fabs(cents(left, 3 * f0)) < 3.0 && std::fabs(cents(right, 5 * f0)) < 3.0,
         label);
  CHECK(std::fabs(correlation(wide.left, wide.right, at(1.0), at(2.0))) < 0.1, "Width 1: the sides are unrelated");

  std::vector<float> in = note(196.0f, 0.5f, 0.4f);
  std::vector<float> flipped(in.size());
  for (size_t i = 0; i < in.size(); ++i) flipped[i] = -in[i];
  still(device);
  device.set_param(p::kGain, 0.8f);
  device.set_param(p::kHold, 30.0f);
  run(device, in, flipped);
  Stereo opposed = render(device, 2.0f, kRate);
  const double level = rms(opposed.left, at(1.0), at(2.0));
  std::snprintf(label, sizeof label, "sides in opposite phase howl as loud as one (%.4f, %.4f)", level,
                rms(mono.left, at(1.0), at(2.0)));
  CHECK(std::fabs(db(level / rms(mono.left, at(1.0), at(2.0)))) < 0.5 &&
             std::fabs(db(rms(opposed.right, at(1.0), at(2.0)) / level)) < 0.5,
         label);
}

// How far a held tone falls at the output against the input, in dB, over the
// piano's range, with the device set by `setup`: the worst of them.
template <typename Setup>
static double worst_dip(Setup setup, double* at_hz, bool whole = false) {
  double worst = 1.0e9;
  for (int midi = 21; midi <= 108; midi += 3) {
    const float hz = 440.0f * std::pow(2.0f, (midi - 69) / 12.0f);
    device.init(kRate);
    setup();
    Stereo out = run(device, sine(hz, 3.0f, kRate, 0.25f));
    // `whole`: all that comes out, whatever its frequency, against the tone's
    // level; else only what is left at the tone's own frequency.
    const double left = whole ? rms(out.left, at(2.0), at(3.0)) * std::sqrt(2.0) / 0.25
                              : tone_level(out.left, hz, kRate, at(2.0), at(3.0)) / 0.25;
    const double right = whole ? rms(out.right, at(2.0), at(3.0)) * std::sqrt(2.0) / 0.25
                               : tone_level(out.right, hz, kRate, at(2.0), at(3.0)) / 0.25;
    const double level = db(std::min(left, right));
    if (level < worst) {
      worst = level;
      *at_hz = hz;
    }
  }
  return worst;
}

// Mix 0 is the input, sample for sample; part way, a held tone anywhere on
// the piano keeps its level to within what the equal-power dry gain takes.
static void check_mix() {
  char label[200];
  device.init(kRate);
  device.set_param(p::kMix, 0.0f);
  std::vector<float> in = note(196.0f, 1.0f, 0.4f);
  rng_state() = 0xFEEDu;
  std::vector<float> hiss = noise(1.0f, kRate, 0.1f);
  for (size_t i = 0; i < in.size(); ++i) in[i] += hiss[i];
  Stereo out = run(device, in, hiss);
  double worst = 0.0;
  for (size_t i = 0; i < in.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - in[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(out.right[i]) - hiss[i]));
  }
  CHECK(worst == 0.0, "Mix 0 is the input, sample for sample");

  for (float mix : {0.4f, 0.5f, 0.75f}) {
    double hz = 0.0;
    const double dip = worst_dip([&] { device.set_param(p::kMix, mix); }, &hz);
    const double dry = db(std::cos(mix * kPi / 2.0));
    std::snprintf(label, sizeof label,
                  "Mix %.2f: the tone that loses most, %.1f Hz, comes out at %.2f dB (the dry gain alone is %.2f)",
                  mix, hz, dip, dry);
    CHECK(dip > dry - 3.0, label);
  }
}

// NaN, infinity and 1e30 in the loop: it is a feedback loop, so one bad
// sample kept would be there for ever. Good input after them finds the
// device as it was: finite, singing, at the level and the pitch it should.
static void check_bad_input() {
  char label[200];
  const float bad[] = {std::nanf(""), INFINITY, -INFINITY, 1.0e30f, -1.0e30f, 3.0e38f};
  const auto sung = [&](bool poison, double* level, double* hz, bool* finite_after, double* during) {
    still(device);
    device.set_param(p::kGain, 0.85f);
    device.set_param(p::kHold, 30.0f);
    run(device, note(196.0f, 0.5f, 0.4f));
    if (poison) {
      std::vector<float> left(at(0.2)), right(at(0.2));
      for (size_t i = 0; i < left.size(); ++i) {
        left[i] = bad[(i / 7) % 6];
        right[i] = (i % 3 == 0) ? bad[(i / 5) % 6] : 0.1f;
      }
      Stereo out = run(device, left, right);
      // What the loop itself put out while it was fed them: the right side's
      // output where its input was good.
      double most = 0.0;
      for (size_t i = 0; i < right.size(); ++i) {
        if (i % 3 != 0) most = std::max(most, std::fabs(static_cast<double>(out.right[i])));
      }
      *during = most;
    } else {
      run(device, silence(0.2f, kRate));
    }
    Stereo a = run(device, note(196.0f, 0.5f, 0.4f));
    Stereo b = render(device, 1.5f, kRate);
    *finite_after = finite(a.left) && finite(a.right) && finite(b.left) && finite(b.right);
    *level = rms(b.left, at(1.0), at(1.5));
    *hz = crossing_hz(b.left, kRate, at(1.0), at(1.5));
  };
  double clean_level, clean_hz, level, hz, during = 0.0, unused = 0.0;
  bool ok_clean, ok;
  sung(false, &clean_level, &clean_hz, &ok_clean, &unused);
  sung(true, &level, &hz, &ok, &during);
  CHECK(ok, "after NaN, infinite and 1e30 samples the output is finite as soon as the input is");
  std::snprintf(label, sizeof label, "while it is fed them the loop itself stays finite and bounded (%.3g)", during);
  CHECK(std::isfinite(during) && during < 2.0, label);
  std::snprintf(label, sizeof label, "and it sings as before: %.4f at %.2f Hz, %.4f at %.2f Hz without them",
                level, hz, clean_level, clean_hz);
  CHECK(std::fabs(db(level / clean_level)) < 1.0 && std::fabs(cents(hz, clean_hz)) < 3.0, label);
  // And it still stops.
  device.set_param(p::kHold, 0.5f);
  render(device, 3.0f, kRate);
  Stereo rest = render(device, 0.5f, kRate);
  CHECK(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "and it still comes to rest");
}

// Every control moved while the howl sounds: no click. The reference is the
// same passage with nothing moved.
static void check_clicks() {
  char label[200];
  const auto passage = [&](int param, float to) {
    device.init(kRate);
    device.set_param(p::kHold, 30.0f);
    device.set_param(p::kGain, 0.8f);
    device.set_param(p::kMix, 0.6f);
    std::vector<float> in = chord({196.0f, 246.94f, 293.66f}, 3.0f, 0.15f);
    std::vector<float> first(in.begin(), in.begin() + at(2.0));
    std::vector<float> rest(in.begin() + at(2.0), in.end());
    run(device, first);
    if (param >= 0) device.set_param(param, to);
    return run(device, rest);
  };
  const double reference = max_step(passage(-1, 0.0f).left);
  for (int id = 0; id < p::kNumParams; ++id) {
    for (float to : {p::kParamMin[id], p::kParamMax[id]}) {
      // The passage with the control there from the start: what the sound's
      // own slope is at that setting (a higher overtone, Edge's harmonics).
      device.init(kRate);
      device.set_param(p::kHold, 30.0f);
      device.set_param(p::kGain, 0.8f);
      device.set_param(p::kMix, 0.6f);
      device.set_param(id, to);
      Stereo there = run(device, chord({196.0f, 246.94f, 293.66f}, 3.0f, 0.15f));
      const double settled = std::max(max_step(there.left, at(2.0)), max_step(there.right, at(2.0)));
      Stereo out = passage(id, to);
      const double step = std::max(max_step(out.left), max_step(out.right));
      std::snprintf(label, sizeof label,
                    "param %d to %g while sounding: largest step %.4f (%.4f with nothing moved, %.4f there already)",
                    id, to, step, reference, settled);
      CHECK(step < 1.5 * std::max(reference, settled) + 0.004, label);
    }
  }
}

// The same audio at block sizes 1, 128 and 2048 across a sleep, with the
// wander running and knobs moved while asleep (they snap; nothing glides in).
static void check_sleep() {
  char label[200];
  const auto passage = [&](int block) {
    device.init(kRate);
    device.set_param(p::kMove, 1.0f);
    device.set_param(p::kPace, 1.0f);
    device.set_param(p::kHold, 0.6f);
    device.set_param(p::kGain, 0.85f);
    Stereo out = run(device, note(196.0f, 0.5f, 0.4f), block);
    out = concat(out, run(device, silence(2.5f, kRate), block));  // dies at about 0.9 s, then sleeps
    device.set_param(p::kBody, 900.0f);
    device.set_param(p::kGain, 0.7f);
    device.set_param(p::kMix, 0.8f);
    device.set_param(p::kDistance, 5.0f);
    out = concat(out, run(device, silence(1.3f, kRate), block));
    out = concat(out, run(device, note(220.0f, 0.5f, 0.4f), block));
    return concat(out, run(device, silence(1.0f, kRate), block));
  };
  Stereo reference = passage(128);
  CHECK(peak(reference.left, at(2.0), at(4.3)) == 0.0, "the passage sleeps in its silence");
  CHECK(rms(reference.left, at(4.8), at(5.3)) > 0.01, "and sounds again after it");
  for (int block : {1, 2048}) {
    double worst = 0.0;
    const bool equal = same(passage(block), reference, 1.0e-6, &worst);
    std::snprintf(label, sizeof label, "block size %d across a sleep: differs from 128 by %.3g", block, worst);
    CHECK(equal, label);
  }
  // A knob moved while asleep is there on waking: the first samples already at the new Mix.
  device.init(kRate);
  run(device, note(196.0f, 0.2f, 0.4f));
  device.set_param(p::kHold, 0.2f);
  render(device, 2.0f, kRate);
  device.set_param(p::kMix, 0.0f);
  std::vector<float> in = note(220.0f, 0.1f, 0.4f);
  Stereo woken = run(device, in);
  double worst = 0.0;
  for (size_t i = 0; i < in.size(); ++i) worst = std::max(worst, std::fabs(static_cast<double>(woken.left[i]) - in[i]));
  CHECK(worst == 0.0, "Mix moved while asleep has snapped on waking");
}

// After any control is moved the device still comes to rest: exact zeros, and it stays there.
static void check_rest() {
  char label[200];
  for (int id = 0; id < p::kNumParams; ++id) {
    for (float to : {p::kParamMin[id], p::kParamMax[id]}) {
      device.init(kRate);
      device.set_param(p::kHold, 0.5f);
      run(device, note(196.0f, 0.5f, 0.4f));
      device.set_param(id, to);
      if (id == p::kHold) device.set_param(p::kHold, 0.5f);
      render(device, 2.0f, kRate);
      Stereo rest = render(device, 0.5f, kRate);
      std::snprintf(label, sizeof label, "param %d moved to %g: at rest 2 s after the playing stops (peak %g)", id,
                    to, std::max(peak(rest.left), peak(rest.right)));
      CHECK(peak(rest.left) == 0.0 && peak(rest.right) == 0.0 && device.meter(0) == 0.0f, label);
    }
  }
}

// A full-scale chord held for a minute: no more than 6 dB over the input at
// any moment, and no louder at the end than near the start.
static bool held_minute(const char* what) {
  char label[200];
  std::vector<float> in = chord({220.0f, 277.18f, 329.63f}, 60.0f, 1.0f / 3.0f);
  Stereo out = run(device, in);
  const double most = std::max(peak(out.left), peak(out.right));
  const double early = std::max(rms(out.left, at(5.0), at(15.0)), rms(out.right, at(5.0), at(15.0)));
  const double late = std::max(rms(out.left, at(50.0), at(60.0)), rms(out.right, at(50.0), at(60.0)));
  const bool ok = finite(out.left) && finite(out.right) && most < 2.0 * peak(in) && late < 1.12 * early;
  std::snprintf(label, sizeof label, "%s, a full-scale chord for a minute: peak %.3f (input %.3f), rms %.3f then %.3f",
                what, most, peak(in), early, late);
  CHECK(ok, label);
  return ok;
}

static void check_minute() {
  char what[80];
  device.init(kRate);
  held_minute("defaults");
  for (int id = 0; id < p::kNumParams; ++id) {
    for (float to : {p::kParamMin[id], p::kParamMax[id]}) {
      device.init(kRate);
      device.set_param(id, to);
      std::snprintf(what, sizeof what, "param %d at %g", id, to);
      held_minute(what);
    }
  }
  device.init(kRate);
  for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, p::kParamMax[id]);
  held_minute("everything up");
}

// The effect as it starts: plain at once on a played note and on a held
// chord, and never a drop or a jump when it is put on a sounding channel.
static void check_default() {
  char label[240];
  const double dry_gain = std::cos(p::kParamDefault[p::kMix] * kPi / 2.0);
  const auto wet_of = [&](const std::vector<float>& in, const Stereo& out) {
    std::vector<float> wet(in.size());
    for (size_t i = 0; i < in.size(); ++i) wet[i] = out.left[i] - static_cast<float>(in[i] * dry_gain);
    return wet;
  };
  {
    device.init(kRate);
    std::vector<float> in = note(220.0f, 2.0f, 0.4f);
    Stereo out = run(device, in);
    std::vector<float> wet = wet_of(in, out);
    const double early = rms(wet, at(0.0), at(0.25)), bloomed = rms(wet, at(0.75), at(1.0));
    const double played = rms(in, at(0.0), at(0.25));
    std::snprintf(label, sizeof label,
                  "defaults, a struck note: the feedback is %.1f dB under the note at first and %.1f dB under it by 1 s",
                  db(played / early), db(played / bloomed));
    CHECK(bloomed > 0.2 * played && bloomed > early, label);
    const double level = db(rms(out.left) / rms(in));
    std::snprintf(label, sizeof label, "defaults, a struck note: %.2f dB against the dry note over 2 s", level);
    CHECK(level > -2.5 && level < 3.0, label);
  }
  {
    device.init(kRate);
    std::vector<float> in = chord({196.0f, 246.94f, 293.66f}, 4.0f, 0.15f);
    Stereo out = run(device, in);
    std::vector<float> wet = wet_of(in, out);
    const double full = rms(wet, at(3.0), at(4.0));
    double reached = 4.0;
    for (double t = 0.0; t < 3.9; t += 0.05) {
      if (rms(wet, at(t), at(t + 0.1)) > 0.5 * full) {
        reached = t;
        break;
      }
    }
    std::snprintf(label, sizeof label,
                  "defaults, a held chord: the feedback is half way there %.2f s in, and ends %.1f dB under the chord",
                  reached, db(rms(in, at(3.0), at(4.0)) / full));
    CHECK(reached < 1.0 && full > 0.2 * rms(in, at(3.0), at(4.0)), label);
    // Put on a channel that is already sounding: the level neither drops nor jumps.
    double low = 1.0e9, high = 0.0;
    for (double t = 0.0; t < 3.9; t += 0.1) {
      const double ratio = rms(out.left, at(t), at(t + 0.1)) / rms(in, at(t), at(t + 0.1));
      low = std::min(low, ratio);
      high = std::max(high, ratio);
    }
    std::snprintf(label, sizeof label, "defaults, put on a sounding chord: every tenth of a second is %.2f to %.2f dB of the dry",
                  db(low), db(high));
    CHECK(db(low) > -2.5 && db(high) < 3.5, label);
  }
}

// PRESETS-BEGIN: the sixteen presets of device.json, every parameter filled in (tmp/presets-table.mjs).
static const int kPresetCount = 16;
static const char* const kPresetNames[16] = {
    "Room howl",
    "Faint sustain",
    "Slow bloom",
    "Low drone",
    "Bright wire",
    "Takes over",
    "In the gaps",
    "Wandering",
    "Flicker",
    "One pure tone",
    "Reed buzz",
    "High whistle",
    "Wide pair",
    "Long hang",
    "Ring, no howl",
    "Howl alone",
};
// gain, distance, body, hold, move, pace, edge, follow, width, mix
static const float kPresets[16][p::kNumParams] = {
    {0.7f, 7.645f, 520.0f, 6.0f, 0.35f, 0.12f, 0.2f, 0.5f, 0.5f, 0.5f},
    {0.63f, 7.645f, 520.0f, 2.0f, 0.1f, 0.12f, 0.0f, 0.3f, 0.3f, 0.22f},
    {0.64f, 7.645f, 520.0f, 10.0f, 0.2f, 0.05f, 0.1f, 0.9f, 0.5f, 0.5f},
    {0.75f, 15.29f, 196.0f, 20.0f, 0.25f, 0.05f, 0.15f, 0.2f, 0.4f, 0.45f},
    {0.72f, 7.645f, 1570.0f, 5.0f, 0.3f, 0.12f, 0.35f, 0.5f, 0.7f, 0.4f},
    {1.0f, 7.645f, 520.0f, 12.0f, 0.35f, 0.12f, 0.4f, 0.0f, 0.5f, 0.7f},
    {0.8f, 7.645f, 520.0f, 3.0f, 0.35f, 0.12f, 0.2f, 1.0f, 0.5f, 0.55f},
    {0.8f, 7.645f, 520.0f, 10.0f, 1.0f, 0.3f, 0.2f, 0.5f, 0.8f, 0.5f},
    {0.95f, 7.645f, 520.0f, 6.0f, 1.0f, 2.0f, 0.5f, 0.5f, 1.0f, 0.5f},
    {0.75f, 7.645f, 520.0f, 15.0f, 0.0f, 0.12f, 0.0f, 0.5f, 0.0f, 0.5f},
    {0.8f, 10.2f, 330.0f, 5.0f, 0.15f, 0.12f, 1.0f, 0.5f, 0.5f, 0.5f},
    {0.85f, 1.911f, 1050.0f, 4.0f, 0.3f, 0.12f, 0.0f, 0.5f, 0.5f, 0.35f},
    {0.8f, 7.645f, 440.0f, 12.0f, 0.15f, 0.12f, 0.2f, 0.5f, 1.0f, 0.5f},
    {0.75f, 7.645f, 520.0f, 30.0f, 0.4f, 0.04f, 0.2f, 0.3f, 0.5f, 0.5f},
    {0.5f, 4.545f, 660.0f, 1.0f, 0.0f, 0.12f, 0.2f, 0.0f, 0.5f, 0.5f},
    {0.9f, 7.645f, 520.0f, 15.0f, 0.35f, 0.12f, 0.2f, 0.2f, 0.5f, 1.0f},
};
// PRESETS-END

// Every preset: bounded and steady under a full-scale chord for a minute, and
// no held tone on the piano lost by more than 3 dB beyond the dry gain.
static void check_presets() {
  char label[240];
  for (int n = 0; n < kPresetCount; ++n) {
    const auto load = [&] {
      for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, kPresets[n][id]);
    };
    device.init(kRate);
    load();
    held_minute(kPresetNames[n]);
    double hz = 0.0;
    // With no dry sound left (Mix 1) the held tone itself is gone by design:
    // what must not be lost then is the level of what comes out in its place.
    const bool alone = kPresets[n][p::kMix] > 0.95f;
    const double dip = worst_dip(load, &hz, alone);
    const double dry = alone ? 0.0 : db(std::cos(kPresets[n][p::kMix] * kPi / 2.0));
    std::snprintf(label, sizeof label, "%s: the tone that loses most, %.1f Hz, comes out at %.2f dB (%s %.2f)",
                  kPresetNames[n], hz, dip, alone ? "all that comes out; against" : "dry gain", dry);
    // Alone, the hold keeps the loop's peak at the playing's level: where the
    // played tone and the loop's own beat together the mean lies under that
    // peak, so the floor here is 9 dB under the tone, not 3.
    CHECK(dip > (alone ? -9.0 : std::max(dry, -12.0) - 3.0), label);
  }
}

int main() {
  Conformance spec;
  spec.name = "howl";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 12.0f;
  spec.max_peak = 2.0f;
  check_effect(device, spec, kRate);

  check_tuning();
  check_threshold();
  check_level_hold();
  check_hold();
  check_follow();
  check_edge();
  check_move();
  check_clock();
  check_width();
  check_mix();
  check_bad_input();
  check_clicks();
  check_sleep();
  check_rest();
  check_minute();
  check_default();
  check_presets();

  // The loop costs the same whatever it is set to: it is one path, run while
  // the loop holds sound. A held chord keeps it running throughout.
  std::vector<float> input = chord({196.0f, 246.94f, 293.66f}, 10.0f, 0.2f);
  device.init(kRate);
  report_cost("howl", 10.0f, kRate, [&] { run(device, input); });
  device.init(kRate);
  for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, p::kParamMax[id]);
  report_cost("howl, everything up", 10.0f, kRate, [&] { run(device, input); });

  return finish("howl");
}
