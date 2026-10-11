// Native harness for Howl (cpp/devices/howl). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it a feedback loop: it sings on the overtones
// of the note Distance tunes, every one of them in tune; Gain is how fast
// that grows or dies, with the threshold at the middle; it is held to the
// level of the playing, for as long as Hold says, and then it stops.
//
// The laws are written out here as howl.h has them, so that the checks read
// what comes out and nothing of the device's own.

#include "../devices/howl/howl.h"
#include "support/test_kit.h"

#include <cstdlib>

using namespace testkit;
using livemix::Howl;
namespace p = livemix::howl;

static Howl device;

static const float kRate = 48000.0f;
static const double kNote = 1000.0 / 7.645;  // the note the default Distance tunes, Hz

// EXPECT, and with HOWL_VERBOSE set every measurement is printed as it is made.
static const bool kVerbose = std::getenv("HOWL_VERBOSE") != nullptr;
#define CHECK(condition, message)                                             \
  do {                                                                        \
    const bool held_ = (condition);                                           \
    if (kVerbose) std::printf("  %s %s\n", held_ ? "ok  " : "FAIL", message); \
    EXPECT(held_, message);                                                   \
  } while (0)

// Gain as howl.h has it: the rate the singing overtone grows at, dB a second.
static double rate_of(double gain) {
  const double u = 2.0 * gain - 1.0;
  const double size = 240.0 * (std::exp(3.5 * std::fabs(u)) - 1.0) / (std::exp(3.5) - 1.0);
  return u < 0.0 ? -size : size;
}

// And how far under the playing's RMS the howl is held: 12 dB at Gain 0, level at 1.
static double level_db_of(double gain) { return -12.0 * (1.0 - gain); }

// A struck note: eight harmonics, the upper ones dying sooner.
static std::vector<float> note(float hz, float seconds, float gain, float rate = kRate, double tau = 0.6) {
  std::vector<float> out(static_cast<size_t>(seconds * rate));
  for (size_t i = 0; i < out.size(); ++i) {
    const double t = static_cast<double>(i) / rate;
    double v = 0.0;
    for (int h = 1; h <= 8; ++h) {
      v += std::sin(2.0 * kPi * hz * h * t) / h * std::exp(-t * h / tau);
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

// A phrase: eight struck notes `gap` seconds apart, each dying in about a third of a second.
static std::vector<float> phrase(float gap, float gain, float rate = kRate) {
  const float hz[8] = {196.0f, 246.94f, 293.66f, 220.0f, 261.63f, 329.63f, 293.66f, 196.0f};
  std::vector<float> out;
  for (float f : hz) {
    std::vector<float> one = note(f, gap, gain, rate, 0.35);
    out.insert(out.end(), one.begin(), one.end());
  }
  return out;
}

// A full-scale square wave.
static std::vector<float> square(float hz, float seconds, float rate = kRate) {
  std::vector<float> out(static_cast<size_t>(seconds * rate));
  for (size_t i = 0; i < out.size(); ++i) {
    out[i] = std::fmod(static_cast<double>(i) * hz / rate, 1.0) < 0.5 ? 1.0f : -1.0f;
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

// Where a tone near `hz` really stands: the strongest reading within 2 %
// of it, searched four times over, each eight times finer.
static double tone_near(const std::vector<float>& x, double hz, double rate, size_t from, size_t to,
                        double* level = nullptr) {
  double best = 0.0, best_hz = hz, span = hz * 0.02, centre = hz;
  for (int pass = 0; pass < 4; ++pass) {
    for (int i = -10; i <= 10; ++i) {
      const double f = centre + span * i / 10.0;
      const double v = tone_level(x, f, rate, from, to);
      if (v > best) {
        best = v;
        best_hz = f;
      }
    }
    centre = best_hz;
    span /= 8.0;
  }
  if (level) *level = best;
  return best_hz;
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

// The level of x in 20 ms steps, dB.
static std::vector<double> levels(const std::vector<float>& x, double rate = kRate) {
  std::vector<double> out;
  const size_t hop = at(0.02, rate);
  for (size_t from = 0; from + hop <= x.size(); from += hop) out.push_back(db(rms(x, from, from + hop)));
  return out;
}

// Every overtone the loop rings on stands on a whole multiple of 1 /
// Distance: a burst of noise into a loop just under its threshold, and then
// each overtone's own frequency in what rings on. The body turns no phase, so
// not only the one it passes best is in tune.
static void check_tuning() {
  char label[240];
  struct Case {
    float rate, distance, body;
  };
  // Each body stands between two overtones, so that more than one rings on.
  const Case cases[] = {{48000.0f, 7.645f, 460.0f}, {48000.0f, 7.645f, 590.0f}, {44100.0f, 7.645f, 590.0f},
                        {96000.0f, 15.29f, 229.0f}, {44100.0f, 15.29f, 229.0f}, {48000.0f, 25.0f, 150.0f}};
  for (const Case& c : cases) {
    still(device, c.rate);
    device.set_param(p::kGain, 0.47f);
    device.set_param(p::kDistance, c.distance);
    device.set_param(p::kBody, c.body);
    device.set_param(p::kHold, 30.0f);
    rng_state() = 4242u;
    run(device, noise(0.4f, c.rate, 0.3f));
    Stereo tail = render(device, 2.5f, c.rate);
    const double f0 = 1000.0 / c.distance;
    double top = 0.0, worst = 0.0;
    int rang = 0;
    std::vector<std::pair<double, double>> found;
    for (int k = 1; k * f0 < 0.4 * c.rate && k <= 40; ++k) {
      double level = 0.0;
      const double hz = tone_near(tail.left, k * f0, c.rate, at(0.5, c.rate), at(2.5, c.rate), &level);
      found.push_back({cents(hz, k * f0), level});
      top = std::max(top, level);
    }
    for (const auto& one : found) {
      if (one.second < 0.02 * top) continue;  // within 34 dB of the strongest
      ++rang;
      worst = std::max(worst, std::fabs(one.first));
    }
    std::snprintf(label, sizeof label,
                  "%.0f Hz, Distance %.3f ms, Body %.0f Hz: %d overtones ring within 34 dB of the strongest, the worst %.2f cents off",
                  c.rate, c.distance, c.body, rang, worst);
    CHECK(rang >= 2 && worst < 2.0, label);
  }
  // And the one that sings on: the body's own, to a tenth of a cent.
  still(device);
  device.set_param(p::kGain, 0.85f);
  device.set_param(p::kHold, 30.0f);
  run(device, note(196.0f, 0.5f, 0.4f));
  Stereo tail = render(device, 3.0f, kRate);
  const double sung = crossing_hz(tail.left, kRate, at(1.0), at(3.0));
  std::snprintf(label, sizeof label, "the howl stands at %.4f Hz, %.3f cents from four times the note", sung,
                cents(sung, 4.0 * kNote));
  CHECK(std::fabs(cents(sung, 4.0 * kNote)) < 0.1, label);
}

// The time a tail takes to fall `by` dB from where it stands 0.1 s in.
static double fall_time(const std::vector<float>& tail, double by) {
  const std::vector<double> lv = levels(tail);
  for (size_t i = 5; i < lv.size(); ++i) {
    if (lv[i] <= lv[5] - by) return (i - 5) * 0.02;
  }
  return 1.0e9;
}

// Gain is the whole knob. Under the middle each note leaves a ring, longer
// the nearer the middle; the threshold is at the middle; over it a held sound
// blooms into the howl, sooner the higher; and the rate is the law's.
static void check_gain() {
  char label[240];
  // The ring: the time it takes to fall 20 dB, against 20 / (the law's rate + Hold's 2 dB a second).
  double before = 0.0;
  for (float gain : {0.1f, 0.2f, 0.3f, 0.4f}) {
    still(device);
    device.set_param(p::kGain, gain);
    device.set_param(p::kHold, 30.0f);
    run(device, chord({392.4f, 523.2f}, 1.0f, 0.15f));
    Stereo tail = render(device, 6.0f, kRate);
    const double took = fall_time(tail.left, 20.0), law = 20.0 / (2.0 - rate_of(gain));
    std::snprintf(label, sizeof label, "Gain %.1f: the ring falls 20 dB in %.2f s (%.2f s by the law)", gain, took, law);
    CHECK(took > 0.7 * law && took < 1.3 * law && took > 1.5 * before, label);
    before = took;
  }
  // The threshold: just under the middle a tail dies, just over it it holds.
  for (float gain : {0.45f, 0.55f}) {
    still(device);
    device.set_param(p::kGain, gain);
    device.set_param(p::kHold, 30.0f);
    run(device, chord({392.4f, 523.2f}, 1.0f, 0.15f));
    Stereo tail = render(device, 10.0f, kRate);
    const double fell = db(rms(tail.left, at(3.9), at(4.1)) / rms(tail.left, at(9.8), at(10.0)));
    std::snprintf(label, sizeof label, "Gain %.2f: from 4 s to 10 s after the note the tail falls %.1f dB (Hold alone takes 12)",
                  gain, fell);
    if (gain < 0.5f) {
      CHECK(fell > 16.0, label);
    } else {
      CHECK(fell < 13.0, label);
    }
  }
  // The bloom, on a held tone that lies on no overtone: nothing to ring, so
  // the howl grows from the air in the loop.
  double half[3];
  int n = 0;
  for (float gain : {0.7f, 0.85f, 1.0f}) {
    still(device);
    device.set_param(p::kGain, gain);
    Stereo out = run(device, sine(300.0f, 10.0f, kRate, 0.25f));
    const double full = tone_level(out.left, 4.0 * kNote, kRate, at(9.0), at(10.0));
    half[n] = 10.0;
    for (double t = 0.0; t < 9.9; t += 0.05) {
      if (tone_level(out.left, 4.0 * kNote, kRate, at(t), at(t + 0.05)) > 0.5 * full) {
        half[n] = t + 0.05;
        break;
      }
    }
    std::snprintf(label, sizeof label, "Gain %.2f, a held tone off the overtones: the howl is half way up %.2f s in, and ends %.1f dB under the tone",
                  gain, half[n], db(0.25 / full));
    CHECK(full > 0.05, label);
    ++n;
  }
  CHECK(half[0] > 1.8 * half[1] && half[1] > 1.5 * half[2] && half[1] < 1.2 && half[2] < 0.6,
        "the higher the Gain the sooner it blooms: more than 1.8 and 1.5 times sooner each step, within 1.2 s at 0.85");
  // The rate: the overtone the body passes best, low under the ceiling, in dB a second.
  struct Case {
    float rate, distance, body, gain;
  };
  const Case cases[] = {{48000.0f, 7.645f, 520.0f, 0.35f}, {48000.0f, 7.645f, 520.0f, 0.45f},
                        {48000.0f, 7.645f, 520.0f, 0.5f},  {48000.0f, 7.645f, 520.0f, 0.55f},
                        {48000.0f, 7.645f, 520.0f, 0.65f}, {48000.0f, 7.645f, 520.0f, 0.8f},
                        {96000.0f, 15.29f, 196.0f, 0.65f}, {44100.0f, 1.911f, 1050.0f, 0.65f},
                        {48000.0f, 7.645f, 640.0f, 0.65f}};
  for (const Case& c : cases) {
    still(device, c.rate);
    device.set_param(p::kGain, 0.0f);
    device.set_param(p::kDistance, c.distance);
    device.set_param(p::kBody, c.body);
    device.set_param(p::kHold, 30.0f);
    rng_state() = 4242u;
    // A loud burst at Gain 0 sets the ceiling and leaves nothing in the loop;
    // then Gain is set, and a far quieter burst leaves the overtones low.
    run(device, noise(0.5f, c.rate, 0.5f));
    run(device, silence(0.5f, c.rate));
    device.set_param(p::kGain, c.gain);
    run(device, noise(0.1f, c.rate, 0.004f));
    Stereo tail = render(device, 3.0f, c.rate);
    const double hz = std::round(c.body * c.distance / 1000.0) * 1000.0 / c.distance;
    const double ceiling = db(0.5 / std::sqrt(3.0) * std::sqrt(2.0)) + level_db_of(c.gain);
    double count = 0.0, st = 0.0, sv = 0.0, stt = 0.0, stv = 0.0;
    for (int i = 0; i < 30; ++i) {
      const double v = db(tone_level(tail.left, hz, c.rate, at(i * 0.1, c.rate), at(i * 0.1 + 0.1, c.rate)));
      if (v > ceiling - 2.0 * (0.6 + i * 0.1) - 8.0 || v < ceiling - 80.0) continue;
      const double t = i * 0.1;
      count += 1.0, st += t, sv += v, stt += t * t, stv += t * v;
    }
    const double slope = count >= 4.0 ? (count * stv - st * sv) / (count * stt - st * st) : 1.0e9;
    std::snprintf(label, sizeof label, "%.0f Hz, Distance %.3f ms, Body %.0f Hz, Gain %.2f: the overtone at %.1f Hz goes at %+.2f dB a second (%+.2f by the law)",
                  c.rate, c.distance, c.body, c.gain, hz, slope, rate_of(c.gain));
    CHECK(std::fabs(slope - rate_of(c.gain)) < 0.5 + 0.05 * std::fabs(rate_of(c.gain)), label);
  }
}

// The level hold: the howl stands as loud as the playing was, less what Gain
// keeps it under; and whatever is played, at full Gain, the loop passes no
// more than a tone of that level would.
static void check_level_hold() {
  char label[240];
  for (float gain : {0.6f, 0.8f, 1.0f}) {
    still(device);
    device.set_param(p::kGain, gain);
    device.set_param(p::kHold, 30.0f);
    std::vector<float> in = chord({261.6f, 392.4f, 523.2f}, 6.0f, 0.1f);
    run(device, in);
    // Two seconds on the playing is out of the loop and the howl has it to itself.
    Stereo tail = render(device, 2.5f, kRate);
    const double under = db(rms(tail.left, at(2.0), at(2.2)) / rms(in, at(5.0), at(6.0)));
    std::snprintf(label, sizeof label, "Gain %.1f: 2 s on, the howl stands %.2f dB against the playing's RMS (%.2f by the law, less Hold's 4.2)",
                  gain, under, level_db_of(gain));
    CHECK(std::fabs(under - (level_db_of(gain) - 4.2)) < 1.0, label);
  }
  struct Loud {
    const char* name;
    std::vector<float> in;
  };
  rng_state() = 777u;
  std::vector<Loud> louds;
  louds.push_back({"noise", noise(5.0f, kRate, 1.0f)});
  louds.push_back({"a square at 110 Hz", square(110.0f, 5.0f)});
  louds.push_back({"a square at 2093 Hz", square(2093.0f, 5.0f)});
  louds.push_back({"DC", std::vector<float>(at(5.0), 1.0f)});
  for (const Loud& loud : louds) {
    for (float body : {120.0f, 2400.0f}) {
      still(device);
      device.set_param(p::kGain, 1.0f);
      device.set_param(p::kBody, body);
      device.set_param(p::kMove, 1.0f);
      device.set_param(p::kPace, 2.0f);
      Stereo out = run(device, loud.in);
      const double most = std::max(peak(out.left), peak(out.right));
      std::snprintf(label, sizeof label, "full scale, Gain 1, Body %.0f Hz, %s: the feedback alone peaks at %.3f, its DC %.4f",
                    body, loud.name, most, mean(out.left, at(2.0), at(5.0)));
      CHECK(finite(out.left) && most < 1.51 && std::fabs(mean(out.left, at(2.0), at(5.0))) < 0.01, label);
    }
  }
  // With Edge up and the playing beside it: no more than 5 dB over the input.
  device.init(kRate);
  device.set_param(p::kGain, 1.0f);
  device.set_param(p::kEdge, 1.0f);
  Stereo out = run(device, square(110.0f, 5.0f));
  std::snprintf(label, sizeof label, "full scale square, Gain 1, Edge 1, Mix 0.5: the output peaks at %.3f",
                std::max(peak(out.left), peak(out.right)));
  CHECK(std::max(peak(out.left), peak(out.right)) < 1.78, label);
  // A burst far past full scale: finite, and the howl after it no higher than the playing.
  still(device);
  device.set_param(p::kGain, 1.0f);
  std::vector<float> in = sine(523.25f, 3.0f, kRate, 0.1f);
  for (size_t i = at(1.0); i < at(1.02); ++i) in[i] = (i & 1) ? 7.9f : -7.9f;
  out = run(device, in);
  std::snprintf(label, sizeof label, "a 20 ms burst at 7.9: the feedback peaks at %.3f during it and %.3f from 0.5 s after",
                peak(out.left, at(1.0), at(1.1)), peak(out.left, at(1.52), at(3.0)));
  CHECK(finite(out.left) && peak(out.left, at(1.0), at(1.1)) < 4.3 && peak(out.left, at(1.52), at(3.0)) < 0.6, label);
}

// The ceiling is each side's own playing, and a click does not set it.
static void check_ceiling() {
  char label[240];
  const double dry_gain = std::cos(p::kParamDefault[p::kMix] * kPi / 2.0);
  // A 10 ms full-scale click over a quiet chord: a second later the feedback
  // is hardly louder than in the same passage without it.
  double wet[2];
  for (int click = 0; click < 2; ++click) {
    device.init(kRate);
    std::vector<float> in = chord({196.2f, 261.6f, 392.4f}, 6.0f, 0.02f);
    rng_state() = 99u;
    if (click) {
      for (size_t i = at(3.0); i < at(3.01); ++i) in[i] += white();
    }
    Stereo out = run(device, in);
    std::vector<float> fed(in.size());
    for (size_t i = 0; i < in.size(); ++i) fed[i] = out.left[i] - static_cast<float>(in[i] * dry_gain);
    wet[click] = rms(fed, at(3.8), at(4.2));
  }
  std::snprintf(label, sizeof label, "a 10 ms full-scale click over a quiet chord: a second on the feedback is %.1f dB louder than without it",
                db(wet[1] / wet[0]));
  CHECK(db(wet[1] / wet[0]) < 6.0, label);
  // One side played: the other side is silent.
  device.init(kRate);
  std::vector<float> in = chord({196.2f, 261.6f, 392.4f}, 4.0f, 0.15f);
  Stereo out = run(device, in, silence(4.0f, kRate));
  std::snprintf(label, sizeof label, "only the left side played: the right side's output peaks at %g (the left's feedback at %.3f)",
                peak(out.right), peak(out.left) - peak(in) * dry_gain);
  CHECK(peak(out.right) == 0.0 && rms(out.left, at(3.0), at(4.0)) > 0.05, label);
  // Sides in opposite phase get as loud a howl as sides in phase: nothing is summed.
  still(device);
  device.set_param(p::kGain, 0.85f);
  std::vector<float> minus(in.size());
  for (size_t i = 0; i < in.size(); ++i) minus[i] = -in[i];
  out = run(device, in, minus);
  still(device);
  device.set_param(p::kGain, 0.85f);
  Stereo both = run(device, in, in);
  const double ratio = db(rms(out.left, at(3.0), at(4.0)) / rms(both.left, at(3.0), at(4.0)));
  const double corr = correlation(out.left, out.right, at(3.0), at(4.0));
  std::snprintf(label, sizeof label, "sides in opposite phase: the feedback is %.2f dB of what in-phase sides get, the two sides' correlation %.3f",
                ratio, corr);
  CHECK(std::fabs(ratio) < 0.5 && corr < 0.0, label);
}

// When the playing stops the howl falls 60 dB in Hold, and then is silent.
static void check_hold() {
  char label[200];
  for (float hold : {0.5f, 2.0f, 6.0f}) {
    still(device);
    device.set_param(p::kGain, 0.85f);
    device.set_param(p::kHold, hold);
    run(device, note(196.0f, 1.0f, 0.4f));
    Stereo tail = render(device, hold * 2.2f + 0.5f, kRate);
    const double took = rt60(tail.left, kRate, 0.1 * hold, 0.1 * hold, -80.0);
    std::snprintf(label, sizeof label, "Hold %.1f s: the howl falls 60 dB in %.2f s", hold, took);
    CHECK(std::fabs(took / hold - 1.0) < 0.08, label);
    Stereo rest = render(device, 0.3f, kRate);
    CHECK(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "and after it the output is exact silence");
  }
}

// Follow turns the howl down at a new note and lets it back between notes.
// The loop is left alone, so at Follow 0 the same howl is there throughout.
static void check_follow() {
  char label[240];
  const float gap = 0.75f;
  std::vector<float> in = phrase(gap, 0.4f);
  std::vector<double> howl[3];
  int n = 0;
  for (float follow : {0.0f, 0.5f, 1.0f}) {
    still(device);
    device.set_param(p::kFollow, follow);
    run(device, in);  // once through, so the howl is up
    Stereo out = run(device, in);
    // The howl by itself: what comes out at four times the note, in 50 ms steps over the 5th note.
    for (int i = 0; i < 15; ++i) {
      const size_t from = at(4 * gap + i * 0.05);
      howl[n].push_back(db(tone_level(out.left, 4.0 * kNote, kRate, from, from + at(0.05))));
    }
    ++n;
  }
  for (int which = 1; which < 3; ++which) {
    int lowest = 0;
    double deepest = 0.0;
    for (int i = 0; i < 15; ++i) {
      const double under = howl[0][i] - howl[which][i];
      if (under > deepest) {
        deepest = under;
        lowest = i;
      }
    }
    const double back = howl[0][14] - howl[which][14];
    std::snprintf(label, sizeof label, "Follow %.1f, a note every 0.75 s: the howl is turned down %.1f dB at the most, %d ms after the attack, and is %.1f dB down at the end of the gap",
                  which * 0.5, deepest, lowest * 50 + 25, back);
    const double depth = 24.0 * which * 0.5;
    CHECK(deepest > depth - 4.0 && deepest < depth + 1.5 && lowest <= 3 && back < 3.0, label);
  }
  // Follow never makes silence of it, and soft playing with no attack is left alone.
  std::vector<float> soft(at(4.0));
  for (size_t i = 0; i < soft.size(); ++i) {
    const double t = static_cast<double>(i) / kRate;
    soft[i] = static_cast<float>(0.15 * std::sin(2.0 * kPi * 261.6 * t) * (0.85 + 0.15 * std::sin(2.0 * kPi * 0.5 * t)) *
                                 std::min(1.0, t / 0.5));
  }
  double level[2];
  for (int which = 0; which < 2; ++which) {
    still(device);
    device.set_param(p::kFollow, which ? 1.0f : 0.0f);
    Stereo out = run(device, soft);
    level[which] = rms(out.left, at(2.0), at(4.0));
  }
  std::snprintf(label, sizeof label, "soft playing with no attacks: Follow 1 leaves the feedback at %.2f dB of what Follow 0 gives",
                db(level[1] / level[0]));
  CHECK(std::fabs(db(level[1] / level[0])) < 0.5, label);
}

// The spectrum of a steady tail: the tone, each harmonic and the rest, as powers.
struct Spectrum {
  double tone, third, fifth, seventh, second, rest;
};

static Spectrum harmonics_of(const std::vector<float>& x, double hz, double rate, size_t from, size_t to) {
  Spectrum s{};
  const auto power = [&](double f) {
    const double v = f < 0.5 * rate ? tone_level(x, f, rate, from, to) : 0.0;
    return 0.5 * v * v;
  };
  s.tone = power(hz);
  s.second = power(2.0 * hz);
  s.third = power(3.0 * hz);
  s.fifth = power(5.0 * hz);
  s.seventh = power(7.0 * hz);
  const double all = rms(x, from, to);
  s.rest = std::max(all * all - s.tone - s.third - s.fifth - s.seventh, 0.0);
  return s;
}

// Edge adds the third, fifth and seventh harmonics of the tone that sings, a
// third, a fifth and a seventh as high, and nothing else: the tone itself is
// the same tone at the same level, and nothing folds back from past half the
// sample rate.
static void check_edge() {
  char label[260];
  struct Case {
    float rate, distance, body;
    bool right;  // Width 1 and the right side, whose body stands a quarter octave higher
  };
  const Case cases[] = {{48000.0f, 7.645f, 520.0f, false}, {44100.0f, 2.0f, 2400.0f, false},
                        {96000.0f, 1.0f, 2400.0f, false}, {44100.0f, 1.0f, 2400.0f, true}};
  for (const Case& c : cases) {
    Spectrum got[2];
    double sung[2];
    for (int edge = 0; edge < 2; ++edge) {
      still(device, c.rate);
      device.set_param(p::kGain, 0.85f);
      device.set_param(p::kDistance, c.distance);
      device.set_param(p::kBody, c.body);
      device.set_param(p::kHold, 30.0f);
      device.set_param(p::kWidth, c.right ? 1.0f : 0.0f);
      device.set_param(p::kEdge, edge ? 1.0f : 0.0f);
      rng_state() = 99u;
      run(device, noise(0.3f, c.rate, 0.3f));
      Stereo tail = render(device, 2.5f, c.rate);
      const std::vector<float>& side = c.right ? tail.right : tail.left;
      const double f0 = 1000.0 / c.distance;
      const double centre = c.right ? c.body * std::pow(2.0, 0.25) : c.body;
      sung[edge] = tone_near(side, std::max(1.0, std::round(centre / f0)) * f0, c.rate, at(1.5, c.rate),
                             at(2.5, c.rate));
      got[edge] = harmonics_of(side, sung[edge], c.rate, at(1.5, c.rate), at(2.5, c.rate));
    }
    const auto rel = [&](double v, int edge) { return 10.0 * std::log10(v / got[edge].tone + 1.0e-30); };
    std::snprintf(label, sizeof label,
                  "%.0f Hz, the tone at %.1f Hz: Edge 1 leaves it at %+.2f dB and %+.2f cents; harmonics 3, 5, 7 at %.1f, %.1f, %.1f dB, the 2nd %.0f, all else %.1f (%.1f at Edge 0)",
                  c.rate, sung[0], rel(got[1].tone, 0), cents(sung[1], sung[0]), rel(got[1].third, 1),
                  rel(got[1].fifth, 1), rel(got[1].seventh, 1), rel(got[1].second, 1), rel(got[1].rest, 1),
                  rel(got[0].rest, 0));
    // A harmonic is whole under 0.4 of the rate and absent past 0.45 of it.
    const auto right = [&](double harmonic, double power, double expected) {
      if (harmonic * sung[0] < 0.4 * c.rate) return std::fabs(rel(power, 1) - expected) < 0.5;
      return harmonic * sung[0] < 0.45 * c.rate || rel(power, 1) < -60.0;
    };
    CHECK(std::fabs(rel(got[1].tone, 0)) < 0.3 && std::fabs(cents(sung[1], sung[0])) < 0.5 &&
              right(3.0, got[1].third, -9.54) && right(5.0, got[1].fifth, -13.98) &&
              right(7.0, got[1].seventh, -16.9) && rel(got[1].second, 1) < -60.0 &&
              rel(got[1].rest, 1) < rel(got[0].rest, 0) + 1.0 && rel(got[0].third, 0) < -70.0,
          label);
  }
}

// The wander as howl.h has it: two sines read off the sample count.
static double wander_at(double seconds, double pace, double lead = 0.0) {
  return Howl::kWanderWeights[0] * std::sin(2.0 * kPi * (pace * seconds + lead)) +
         Howl::kWanderWeights[1] * std::sin(2.0 * kPi * (pace * Howl::kWanderRatio * seconds + lead));
}

// Move: the body wanders and the howl is handed from overtone to overtone,
// always on one, and is not let die on the way; at Move 0 it holds the one
// it has.
static void check_move() {
  char label[260];
  struct Case {
    float move, pace, gain;
    double span;  // how far the howl's level may range, dB
  };
  const Case cases[] = {{0.0f, 0.25f, 0.85f, 1.0}, {0.35f, 0.12f, 0.7f, 4.0}, {0.35f, 0.12f, 0.85f, 4.0},
                        {1.0f, 0.25f, 0.85f, 9.0}, {1.0f, 2.0f, 0.85f, 18.0}};
  for (const Case& c : cases) {
    still(device);
    device.set_param(p::kGain, c.gain);
    device.set_param(p::kHold, 30.0f);
    device.set_param(p::kMove, c.move);
    device.set_param(p::kPace, c.pace);
    run(device, note(196.0f, 0.5f, 0.4f));
    render(device, 6.0f, kRate);  // the howl comes up
    bool seen[64] = {};
    int clean = 0, windows = 0, distinct = 0, near = 0;
    double low = 1.0e9, high = -1.0e9, jump = 0.0, before = 0.0, step = 0.0, most = 0.0;
    for (int w = 0; w < 80; ++w) {
      Stereo out = render(device, 0.25f, kRate);
      const float centre = device.meter(4);
      for (int part = 0; part < 5; ++part) {
        // Hold's own fall (2 dB a second) put back.
        const double level = db(rms(out.left, at(part * 0.05), at(part * 0.05 + 0.05))) + 2.0 * (w * 0.25 + part * 0.05);
        low = std::min(low, level);
        high = std::max(high, level);
        if (w + part > 0) jump = std::max(jump, std::fabs(level - before));
        before = level;
      }
      step = std::max(step, max_step(out.left));
      most = std::max(most, peak(out.left));
      const double sung = crossing_hz(out.left, kRate, at(0.05), at(0.25));
      const int k = static_cast<int>(std::lround(sung / kNote));
      ++windows;
      if (k < 1 || k > 63 || std::fabs(cents(sung, k * kNote)) > 5.0) continue;
      ++clean;
      if (!seen[k]) {
        seen[k] = true;
        ++distinct;
      }
      if (std::fabs(std::log2(k * kNote / centre)) < 0.5) ++near;
    }
    std::snprintf(label, sizeof label,
                  "Move %.2f, Pace %.2f Hz, Gain %.2f, 20 s of a tail: the howl's level ranges %.1f dB, %.1f dB at the most in 50 ms; %d of %d quarter seconds sing one overtone to 5 cents, %d different ones",
                  c.move, c.pace, c.gain, high - low, jump, clean, windows, distinct);
    CHECK(high - low < c.span, label);
    if (c.move == 0.0f) {
      CHECK(clean == windows && distinct == 1, "at Move 0 one overtone holds");
    } else if (c.pace < 1.0f) {
      CHECK(clean >= windows / 2 && distinct >= 2 && near >= clean * 8 / 10,
            "more than one overtone is sung, each within half an octave of the body");
    }
    // No click at a hand-over: the largest step is what a tone at 12 times the note and this peak would make.
    std::snprintf(label, sizeof label, "and the largest sample step is %.4f, the peak %.3f", step, most);
    CHECK(step < most * 2.0 * kPi * 12.0 * kNote / kRate, label);
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
  // Loud playing does not set the wander back: the same place with and without it.
  device.init(kRate);
  device.set_param(p::kMove, 0.8f);
  device.set_param(p::kPace, 0.37f);
  device.set_param(p::kWidth, 0.0f);
  device.set_param(p::kBody, 500.0f);
  run(device, phrase(0.475f, 0.9f));  // 3.8 s of loud attacks
  CHECK(device.meter(4) == centres[1], "and the same after 3.8 s of loud attacks: the sound does not set it back");
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

// Width: at 0 the two sides are one; at 1 each sings an overtone of its own,
// both in tune; and the two never drift into a pair that cancels in mono.
static void check_width() {
  char label[240];
  still(device);
  device.set_param(p::kGain, 0.85f);
  std::vector<float> in = note(196.0f, 2.0f, 0.4f);
  Stereo out = run(device, in);
  double worst = 0.0;
  for (size_t i = 0; i < out.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - out.right[i]));
  }
  CHECK(worst == 0.0, "Width 0: the two sides are the same, sample for sample");

  still(device);
  device.set_param(p::kGain, 0.85f);
  device.set_param(p::kWidth, 1.0f);
  device.set_param(p::kHold, 30.0f);
  run(device, in);
  Stereo tail = render(device, 3.0f, kRate);
  const double left = crossing_hz(tail.left, kRate, at(2.0), at(3.0));
  const double right = crossing_hz(tail.right, kRate, at(2.0), at(3.0));
  const double kl = std::round(left / kNote), kr = std::round(right / kNote);
  std::snprintf(label, sizeof label, "Width 1: the left sings %.2f Hz (overtone %.0f, %+.2f cents), the right %.2f Hz (overtone %.0f, %+.2f cents)",
                left, kl, cents(left, kl * kNote), right, kr, cents(right, kr * kNote));
  CHECK(kr > kl && std::fabs(cents(left, kl * kNote)) < 1.0 && std::fabs(cents(right, kr * kNote)) < 1.0, label);

  // The mono sum of the feedback against the sides, a quarter second at a time, with the wander on.
  for (float width : {0.5f, 1.0f}) {
    device.init(kRate);
    device.set_param(p::kWidth, width);
    device.set_param(p::kFollow, 0.0f);
    device.set_param(p::kMix, 1.0f);
    std::vector<float> a = chord({130.81f, 196.0f, 311.13f}, 30.0f, 0.1f);
    std::vector<float> b = chord({130.81f, 164.81f, 246.94f}, 30.0f, 0.1f);
    Stereo held = run(device, a, b);
    std::vector<float> sum(held.size());
    for (size_t i = 0; i < sum.size(); ++i) sum[i] = 0.5f * (held.left[i] + held.right[i]);
    double least = 1.0e9;
    for (double t = 2.0; t < 29.9; t += 0.25) {
      const double l = rms(held.left, at(t), at(t + 0.25)), r = rms(held.right, at(t), at(t + 0.25));
      least = std::min(least, db(rms(sum, at(t), at(t + 0.25)) / std::sqrt(0.5 * (l * l + r * r))));
    }
    std::snprintf(label, sizeof label, "Width %.1f, the wander on, a chord for 30 s: the mono sum of the feedback is never more than %.1f dB under the sides",
                  width, -least);
    CHECK(least > -5.0, label);
  }
}

// The readings the display is drawn from are of the tone that sings, with
// the playing left out: its size, and its pitch to a few cents even while a
// loud note stands close beside it.
static void check_readings() {
  char label[240];
  // A loud tone 23 Hz under the overtone, held: the reading is the loop's own tone.
  still(device);
  device.set_param(p::kGain, 0.9f);
  Stereo out = run(device, sine(500.22f, 6.0f, kRate, 0.25f));
  double level = 0.0;
  const double own = tone_near(out.left, 4.0 * kNote, kRate, at(4.0), at(6.0), &level);
  std::snprintf(label, sizeof label, "a loud tone at 500.2 Hz held: the loop sings %.2f Hz, %.3f high; the readings say %.2f Hz, %.3f",
                own, level, device.meter(1), device.meter(0));
  CHECK(std::fabs(cents(device.meter(1), own)) < 8.0 && std::fabs(cents(own, 4.0 * kNote)) < 8.0 &&
            std::fabs(device.meter(0) / level - 1.0) < 0.2,
        label);
  // A phrase at the defaults: the pitch reading stays on an overtone.
  device.init(kRate);
  device.set_param(p::kMove, 0.0f);
  device.set_param(p::kWidth, 0.0f);
  std::vector<float> in = phrase(0.5f, 0.4f);
  in.insert(in.end(), in.begin(), in.end());
  int readings = 0, off = 0;
  double worst = 0.0;
  for (size_t from = 0; from + 480 <= in.size(); from += 480) {
    std::vector<float> piece(in.begin() + from, in.begin() + from + 480);
    run(device, piece);
    if (device.meter(0) < 0.01f) continue;
    const double hz = device.meter(1);
    const double away = std::fabs(cents(hz, std::max(1.0, std::round(hz / kNote)) * kNote));
    ++readings;
    worst = std::max(worst, away);
    if (away > 10.0) ++off;
  }
  std::snprintf(label, sizeof label, "a phrase at the defaults: of %d pitch readings %d are more than 10 cents from an overtone, the worst %.1f",
                readings, off, worst);
  CHECK(readings > 300 && off * 20 <= readings, label);
  // Follow's reading: nothing at Follow 0, nearly all of it just after an attack at Follow 1.
  for (float follow : {0.0f, 1.0f}) {
    device.init(kRate);
    device.set_param(p::kFollow, follow);
    run(device, note(196.0f, 1.0f, 0.3f));
    run(device, note(261.63f, 0.03f, 0.5f));
    std::snprintf(label, sizeof label, "Follow %.0f, 30 ms into a new note: the reading of what it took off is %.2f", follow,
                  device.meter(6));
    CHECK(follow == 0.0f ? device.meter(6) == 0.0f : device.meter(6) > 0.8f, label);
  }
}

// What is left of a held tone at each of thirty keys across the piano's
// range, with the device set by `setup`: the worst of them.
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
// the piano keeps its level to within what the equal-power dry gain takes;
// and with only the feedback left, what comes out is within 3 dB of the tone.
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
  double hz = 0.0;
  const double dip = worst_dip(
      [&] {
        device.set_param(p::kMix, 1.0f);
        device.set_param(p::kGain, 0.9f);
      },
      &hz, true);
  std::snprintf(label, sizeof label, "Mix 1, Gain 0.9: the key that gets least, %.1f Hz, gets %.2f dB of its own level", hz, dip);
  CHECK(dip > -3.0, label);
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

// Every control thrown to each end while the howl sounds, on a low tone and
// on a chord: the largest sample step is no more than in the same passage
// with nothing moved, or with the control there from the start.
static void check_clicks() {
  char label[240];
  struct Mat {
    const char* name;
    float rate;
    std::vector<float> in;
  };
  std::vector<Mat> mats;
  mats.push_back({"a low tone", 48000.0f, sine(82.41f, 3.0f, 48000.0f, 0.3f)});
  mats.push_back({"a chord", 48000.0f, chord({130.81f, 196.0f, 311.13f}, 3.0f, 0.1f)});
  mats.push_back({"a low tone at 96 kHz", 96000.0f, sine(82.41f, 3.0f, 96000.0f, 0.3f)});
  for (const Mat& m : mats) {
    const size_t thrown_at = at(2.0, m.rate), end = at(2.6, m.rate);
    const auto pass = [&](int id, float to, bool from_start) {
      device.init(m.rate);
      device.set_param(p::kGain, 1.0f);
      device.set_param(p::kHold, 30.0f);
      device.set_param(p::kMix, 0.6f);
      if (from_start && id >= 0) device.set_param(id, to);
      std::vector<float> a(m.in.begin(), m.in.begin() + thrown_at), b(m.in.begin() + thrown_at, m.in.end());
      Stereo first = run(device, a);
      if (!from_start && id >= 0) device.set_param(id, to);
      Stereo out = concat(first, run(device, b));
      return std::max(max_step(out.left, thrown_at, end), max_step(out.right, thrown_at, end));
    };
    const double reference = pass(-1, 0.0f, false);
    double worst = 0.0;
    int worst_id = 0;
    float worst_to = 0.0f;
    for (int id = 0; id < p::kNumParams; ++id) {
      for (float to : {p::kParamMin[id], p::kParamMax[id]}) {
        const double ratio = pass(id, to, false) / std::max(reference, pass(id, to, true));
        if (ratio > worst) {
          worst = ratio;
          worst_id = id;
          worst_to = to;
        }
      }
    }
    std::snprintf(label, sizeof label, "%s, each control thrown to each end: the worst step is %.2f times the passage's own (param %d to %g)",
                  m.name, worst, worst_id, worst_to);
    CHECK(worst < 1.3, label);
  }
}

// One passage at mixed block sizes.
static Stereo run_mixed(Howl& d, const std::vector<float>& in) {
  const int sizes[] = {1, 7, 64, 128, 33, 512, 2048, 5, 31, 257};
  Stereo out;
  out.left.resize(in.size());
  out.right.resize(in.size());
  size_t done = 0;
  int which = 0;
  while (done < in.size()) {
    const int frames = static_cast<int>(std::min(static_cast<size_t>(sizes[which++ % 10]), in.size() - done));
    for (int i = 0; i < frames; ++i) d.in_left()[i] = d.in_right()[i] = in[done + i];
    d.process(frames);
    for (int i = 0; i < frames; ++i) {
      out.left[done + i] = d.out_left()[i];
      out.right[done + i] = d.out_right()[i];
    }
    done += frames;
  }
  return out;
}

// The same audio at block sizes 1, 32, 128, 512, 2048 and mixed, across a
// sleep, with the wander running and knobs moved while asleep (they snap;
// nothing glides in).
static void check_sleep() {
  char label[200];
  const auto passage = [&](int block) {
    const auto go = [&](const std::vector<float>& in) {
      return block > 0 ? run(device, in, block) : run_mixed(device, in);
    };
    device.init(kRate);
    device.set_param(p::kMove, 1.0f);
    device.set_param(p::kPace, 1.0f);
    device.set_param(p::kHold, 0.6f);
    device.set_param(p::kGain, 0.85f);
    Stereo out = go(note(196.0f, 0.5f, 0.4f));
    out = concat(out, go(silence(2.713f, kRate)));  // dies, then sleeps; wakes off the block grid
    device.set_param(p::kBody, 900.0f);
    device.set_param(p::kGain, 0.7f);
    device.set_param(p::kMix, 0.8f);
    device.set_param(p::kDistance, 5.0f);
    out = concat(out, go(silence(1.337f, kRate)));
    out = concat(out, go(note(220.0f, 0.5f, 0.4f)));
    return concat(out, go(silence(1.0f, kRate)));
  };
  Stereo reference = passage(128);
  CHECK(peak(reference.left, at(2.2), at(4.5)) == 0.0, "the passage sleeps in its silence");
  CHECK(rms(reference.left, at(4.8), at(5.3)) > 0.01, "and sounds again after it");
  for (int block : {1, 32, 512, 2048, 0}) {
    double worst = 0.0;
    const bool equal = same(passage(block), reference, 0.0, &worst);
    std::snprintf(label, sizeof label, "block size %d%s across a sleep: differs from 128 by %.3g", block,
                  block ? "" : " (mixed)", worst);
    CHECK(equal, label);
  }
  // A second init gives the same again, bit for bit.
  CHECK(same(passage(128), reference, 0.0), "a second init renders the same, bit for bit");
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

// A full-scale chord held: no more than 6 dB over the input at any moment,
// and no louder at the end than near the start.
static bool held_long(const char* what, float seconds, float rate = kRate) {
  char label[200];
  std::vector<float> in = chord({220.0f, 277.18f, 329.63f}, seconds, 1.0f / 3.0f, rate);
  Stereo out = run(device, in);
  const double most = std::max(peak(out.left), peak(out.right));
  const double third = seconds / 3.0;
  const double early = std::max(rms(out.left, at(third * 0.5, rate), at(third, rate)),
                                rms(out.right, at(third * 0.5, rate), at(third, rate)));
  const double late = std::max(rms(out.left, at(seconds - third * 0.5, rate), at(seconds, rate)),
                               rms(out.right, at(seconds - third * 0.5, rate), at(seconds, rate)));
  const bool ok = finite(out.left) && finite(out.right) && most < 2.0 * peak(in) && late < 1.12 * early;
  std::snprintf(label, sizeof label, "%s, a full-scale chord for %.0f s: peak %.3f (input %.3f), rms %.3f then %.3f",
                what, seconds, most, peak(in), early, late);
  CHECK(ok, label);
  return ok;
}

static void check_long() {
  char what[80];
  device.init(kRate);
  held_long("defaults", 60.0f);
  for (int id = 0; id < p::kNumParams; ++id) {
    for (float to : {p::kParamMin[id], p::kParamMax[id]}) {
      device.init(kRate);
      device.set_param(p::kGain, 1.0f);
      device.set_param(id, to);
      std::snprintf(what, sizeof what, "Gain 1 and param %d at %g", id, to);
      held_long(what, 20.0f);
    }
  }
  for (float rate : {44100.0f, 96000.0f}) {
    device.init(rate);
    for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, p::kParamMax[id]);
    std::snprintf(what, sizeof what, "everything up at %.0f Hz", rate);
    held_long(what, 20.0f, rate);
  }
  device.init(kRate);
  for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, p::kParamMax[id]);
  held_long("everything up", 60.0f);
}

// The effect as it starts: plain within about a second on a held sound, a
// played phrase not drowned, and never a drop or a jump when it is put on a
// sounding channel.
static void check_default() {
  char label[260];
  const double dry_gain = std::cos(p::kParamDefault[p::kMix] * kPi / 2.0);
  const auto wet_of = [&](const std::vector<float>& in, const Stereo& out) {
    std::vector<float> wet(in.size());
    for (size_t i = 0; i < in.size(); ++i) wet[i] = out.left[i] - static_cast<float>(in[i] * dry_gain);
    return wet;
  };
  struct Held {
    const char* name;
    std::vector<float> in;
  };
  const Held helds[] = {{"a chord in tune with Distance", chord({196.2f, 261.6f, 392.4f}, 4.0f, 0.15f)},
                        {"a chord out of tune with it", chord({138.59f, 207.65f, 277.18f}, 4.0f, 0.15f)},
                        {"one tone off every overtone", sine(300.0f, 4.0f, kRate, 0.25f)}};
  for (const Held& held : helds) {
    device.init(kRate);
    Stereo out = run(device, held.in);
    std::vector<float> wet = wet_of(held.in, out);
    const double full = rms(wet, at(3.0), at(4.0));
    double reached = 4.0;
    for (double t = 0.0; t < 3.9; t += 0.05) {
      if (rms(wet, at(t), at(t + 0.1)) > 0.5 * full) {
        reached = t + 0.05;
        break;
      }
    }
    double low = 1.0e9, high = 0.0;
    for (double t = 0.0; t < 3.9; t += 0.1) {
      const double ratio = rms(out.left, at(t), at(t + 0.1)) / rms(held.in, at(t), at(t + 0.1));
      low = std::min(low, ratio);
      high = std::max(high, ratio);
    }
    std::snprintf(label, sizeof label,
                  "defaults, %s: the feedback is half way there %.2f s in and ends %.1f dB under the playing; every tenth of a second is %.2f to %.2f dB of the dry",
                  held.name, reached, db(rms(held.in, at(3.0), at(4.0)) / full), db(low), db(high));
    CHECK(reached < 1.2 && full > 0.3 * rms(held.in, at(3.0), at(4.0)) && db(low) > -3.2 && db(high) < 3.5, label);
  }
  // A phrase: the feedback sings between the notes and stands under each new one.
  device.init(kRate);
  const float gap = 0.75f;
  std::vector<float> in = phrase(gap, 0.4f);
  run(device, in);
  Stereo out = run(device, in);
  std::vector<float> wet = wet_of(in, out);
  double least_under = 1.0e9, least_gap = 1.0e9;
  for (int n = 0; n < 8; ++n) {
    const size_t from = at(n * gap + 0.1), to = at(n * gap + 0.2);
    least_under = std::min(least_under, db(rms(in, from, to) / rms(wet, from, to)));
    const size_t late = at(n * gap + gap - 0.1), end = at(n * gap + gap);
    least_gap = std::min(least_gap, db(rms(wet, late, end) / rms(in, late, end)));
  }
  const double level = db(rms(out.left) / rms(in));
  std::snprintf(label, sizeof label,
                "defaults, a phrase: 100 to 200 ms into each note the feedback is at least %.1f dB under it, at the end of each gap at least %.1f dB over what is left of it; %.2f dB against the dry over all",
                least_under, least_gap, level);
  CHECK(least_under > 6.0 && least_gap > -3.0 && level > -3.0 && level < 3.0, label);
}

// The same effect at 44.1, 48 and 96 kHz.
static void check_rates() {
  char label[240];
  double wet[3], tail_db[3], sung[3];
  int n = 0;
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    still(device, rate);
    device.set_param(p::kGain, 0.85f);
    std::vector<float> in = chord({130.81f, 196.0f, 311.13f}, 4.0f, 0.1f, rate);
    Stereo out = run(device, in);
    Stereo tail = render(device, 2.0f, rate);
    wet[n] = db(rms(out.left, at(3.0, rate), at(4.0, rate)));
    tail_db[n] = db(rms(tail.left, at(1.0, rate), at(2.0, rate)));
    sung[n] = crossing_hz(tail.left, rate, at(1.0, rate), at(2.0, rate));
    ++n;
  }
  std::snprintf(label, sizeof label,
                "44.1, 48 and 96 kHz: the feedback under a chord at %.2f, %.2f, %.2f dB; its tail at %.2f, %.2f, %.2f dB and %.3f, %.3f, %.3f Hz",
                wet[0], wet[1], wet[2], tail_db[0], tail_db[1], tail_db[2], sung[0], sung[1], sung[2]);
  CHECK(std::fabs(wet[0] - wet[1]) < 0.3 && std::fabs(wet[2] - wet[1]) < 0.3 && std::fabs(tail_db[0] - tail_db[1]) < 0.3 &&
            std::fabs(tail_db[2] - tail_db[1]) < 0.3 && std::fabs(cents(sung[0], sung[1])) < 0.5 &&
            std::fabs(cents(sung[2], sung[1])) < 0.5,
        label);
}

// PRESETS-BEGIN: the sixteen presets of device.json, every parameter filled in.
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
// gain, distance, body, hold, move, pace, edge, follow, width, mix: which
// control each column of the table is, by key, so the table stands in this
// order whatever the order of the controls in device.json.
static const int kColumns[p::kNumParams] = {p::kGain, p::kDistance, p::kBody,   p::kHold,  p::kMove,
                                            p::kPace, p::kEdge,     p::kFollow, p::kWidth, p::kMix};
static const float kPresets[16][p::kNumParams] = {
    {0.85f, 7.645f, 520.0f, 6.0f, 0.35f, 0.12f, 0.2f, 0.5f, 0.5f, 0.5f},  // Room howl
    {0.62f, 7.645f, 520.0f, 2.0f, 0.1f, 0.12f, 0.0f, 0.3f, 0.3f, 0.22f},  // Faint sustain
    {0.67f, 7.645f, 520.0f, 10.0f, 0.2f, 0.05f, 0.1f, 0.9f, 0.5f, 0.5f},  // Slow bloom
    {0.76f, 15.29f, 196.0f, 20.0f, 0.25f, 0.05f, 0.15f, 0.2f, 0.4f, 0.45f},  // Low drone
    {0.78f, 7.645f, 1570.0f, 5.0f, 0.3f, 0.12f, 0.35f, 0.5f, 0.7f, 0.4f},  // Bright wire
    {1.0f, 7.645f, 520.0f, 12.0f, 0.35f, 0.12f, 0.4f, 0.0f, 0.5f, 0.7f},  // Takes over
    {0.88f, 7.645f, 520.0f, 3.0f, 0.35f, 0.12f, 0.2f, 1.0f, 0.5f, 0.5f},  // In the gaps
    {0.84f, 7.645f, 520.0f, 10.0f, 1.0f, 0.3f, 0.2f, 0.5f, 0.8f, 0.5f},  // Wandering
    {0.94f, 7.645f, 520.0f, 6.0f, 1.0f, 2.0f, 0.5f, 0.5f, 1.0f, 0.5f},  // Flicker
    {0.85f, 7.645f, 520.0f, 15.0f, 0.0f, 0.12f, 0.0f, 0.5f, 0.0f, 0.5f},  // One pure tone
    {0.84f, 10.2f, 330.0f, 5.0f, 0.15f, 0.12f, 1.0f, 0.5f, 0.5f, 0.5f},  // Reed buzz
    {0.88f, 1.911f, 1050.0f, 4.0f, 0.3f, 0.12f, 0.0f, 0.5f, 0.5f, 0.35f},  // High whistle
    {0.84f, 7.645f, 440.0f, 12.0f, 0.15f, 0.12f, 0.2f, 0.5f, 1.0f, 0.5f},  // Wide pair
    {0.85f, 7.645f, 520.0f, 30.0f, 0.4f, 0.04f, 0.2f, 0.3f, 0.5f, 0.5f},  // Long hang
    {0.42f, 7.645f, 520.0f, 8.0f, 0.0f, 0.12f, 0.2f, 0.0f, 0.5f, 0.4f},  // Ring, no howl
    {0.88f, 7.645f, 520.0f, 15.0f, 0.35f, 0.12f, 0.2f, 0.2f, 0.5f, 1.0f},  // Howl alone
};
// PRESETS-END

static float preset_value(int n, int id) {
  for (int column = 0; column < p::kNumParams; ++column) {
    if (kColumns[column] == id) return kPresets[n][column];
  }
  std::abort();
}

// Every preset: bounded and steady under a full-scale chord, and no held
// tone on the piano lost by more than 3 dB beyond the dry gain.
static void check_presets() {
  char label[240];
  for (int n = 0; n < kPresetCount; ++n) {
    const auto load = [&] {
      for (int column = 0; column < p::kNumParams; ++column) device.set_param(kColumns[column], kPresets[n][column]);
    };
    device.init(kRate);
    load();
    held_long(kPresetNames[n], 20.0f);
    double hz = 0.0;
    // With no dry sound left (Mix 1) the held tone itself is gone by design:
    // what must not be lost then is the level of what comes out in its place.
    const bool alone = preset_value(n, p::kMix) > 0.95f;
    const double dip = worst_dip(load, &hz, alone);
    const double dry = alone ? 0.0 : db(std::cos(preset_value(n, p::kMix) * kPi / 2.0));
    std::snprintf(label, sizeof label, "%s: the tone that loses most, %.1f Hz, comes out at %.2f dB (%s %.2f)",
                  kPresetNames[n], hz, dip, alone ? "all that comes out; against" : "dry gain", dry);
    CHECK(dip > dry - 3.0, label);
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
  check_gain();
  check_level_hold();
  check_ceiling();
  check_hold();
  check_follow();
  check_edge();
  check_move();
  check_clock();
  check_width();
  check_readings();
  check_mix();
  check_bad_input();
  check_clicks();
  check_sleep();
  check_rest();
  check_long();
  check_default();
  check_rates();
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
