// Native harness for Binaural (cpp/devices/binaural): conformance, then what
// makes the device what it is. Every figure is a measurement of a render:
// the pair's two frequencies by their zero crossings, the beat by the line
// in the power envelope, levels by peaks and by single lines, the bed by the
// difference of two renders, clicks by how much of an event is there at
// once, and sleep by the same phrase at four block sizes.
//
// BINAURAL_REPORT=1 prints every measurement, passing or not.

#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <ctime>
#include <vector>

#include "../devices/binaural/binaural.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Binaural;
namespace p = livemix::binaural;

static Binaural device;
static constexpr float kRate = 48000.0f;
static const float kRates[3] = {44100.0f, 48000.0f, 96000.0f};

static bool report() {
  static const bool on = std::getenv("BINAURAL_REPORT") != nullptr;
  return on;
}
#define MEASURED(...)              \
  do {                             \
    if (report()) {                \
      std::printf("  measured: "); \
      std::printf(__VA_ARGS__);    \
      std::printf("\n");           \
    }                              \
  } while (0)

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate + 0.5); }

static std::vector<float> mid(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (s.left[i] + s.right[i]);
  return out;
}
static std::vector<float> side(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (s.left[i] - s.right[i]);
  return out;
}

// The largest difference between two renders, either side.
static double apart(const Stereo& a, const Stereo& b, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, std::min(a.size(), b.size()));
  double worst = 0.0;
  for (size_t i = from; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

// Amplitude of the line at `hz` over [from, to), Hann window: what
// testkit::tone_level gives, with the sines made by turning (no trig a
// sample), so that a search over many frequencies stays quick.
static double level_at(const std::vector<float>& x, double hz, double rate, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  if (to <= from) return 0.0;
  const size_t n = to - from;
  const double w = 2.0 * kPi * hz / rate, wr = std::cos(w), wi = std::sin(w);
  const double u = 2.0 * kPi / static_cast<double>(n), ur = std::cos(u), ui = std::sin(u);
  double pr = 1.0, pi = 0.0, qr = 1.0, qi = 0.0, re = 0.0, im = 0.0, sum = 0.0;
  for (size_t i = 0; i < n; ++i) {
    const double window = 0.5 - 0.5 * qr;
    re += window * x[from + i] * pr;
    im -= window * x[from + i] * pi;
    sum += window;
    const double t = pr * wr - pi * wi;
    pi = pr * wi + pi * wr;
    pr = t;
    const double s = qr * ur - qi * ui;
    qi = qr * ui + qi * ur;
    qr = s;
  }
  return 2.0 * std::sqrt(re * re + im * im) / sum;
}

// The frequency of the strongest line between lo and hi: forty-eight steps
// across, then the best one narrowed down.
static double line_hz(const std::vector<float>& x, double rate, double lo, double hi, size_t from = 0,
                      size_t to = SIZE_MAX) {
  const int steps = 48;
  double best = lo, best_level = -1.0;
  for (int i = 0; i <= steps; ++i) {
    const double hz = lo + (hi - lo) * i / steps;
    const double level = level_at(x, hz, rate, from, to);
    if (level > best_level) {
      best_level = level;
      best = hz;
    }
  }
  double a = std::max(lo, best - (hi - lo) / steps), b = std::min(hi, best + (hi - lo) / steps);
  for (int pass = 0; pass < 40; ++pass) {
    const double m1 = a + (b - a) / 3.0, m2 = b - (b - a) / 3.0;
    if (level_at(x, m1, rate, from, to) < level_at(x, m2, rate, from, to)) {
      a = m1;
    } else {
      b = m2;
    }
  }
  return 0.5 * (a + b);
}

// Frequency by upward zero crossings over [from, to): whole cycles between
// the first and the last, each placed between its two samples. For a tone
// that glides it is the mean frequency between those two crossings.
static double crossing_hz(const std::vector<float>& x, double rate, size_t from, size_t to) {
  to = std::min(to, x.size());
  double first = -1.0, last = -1.0;
  long count = 0;
  for (size_t i = from + 1; i < to; ++i) {
    if (x[i - 1] < 0.0f && x[i] >= 0.0f) {
      const double where = static_cast<double>(i - 1) + x[i - 1] / (x[i - 1] - x[i]);
      if (first < 0.0) first = where;
      last = where;
      ++count;
    }
  }
  return count > 1 ? static_cast<double>(count - 1) * rate / (last - first) : 0.0;
}

// The power of x in steps of 5 ms, mean taken out: its lines are the beats.
static constexpr double kPowerHop = 0.005;
static std::vector<float> power_track(const std::vector<float>& x, double rate, size_t from, size_t to) {
  to = std::min(to, x.size());
  const size_t hop = static_cast<size_t>(kPowerHop * rate + 0.5);
  std::vector<float> out;
  double total = 0.0;
  for (size_t start = from; start + hop <= to; start += hop) {
    double sum = 0.0;
    for (size_t i = start; i < start + hop; ++i) sum += static_cast<double>(x[i]) * x[i];
    out.push_back(static_cast<float>(sum / static_cast<double>(hop)));
    total += out.back();
  }
  const float mean = out.empty() ? 0.0f : static_cast<float>(total / static_cast<double>(out.size()));
  for (float& v : out) v -= mean;
  return out;
}

// RMS of x between about lo and hi hertz over [from, to): two one-pole high passes at lo and two
// one-pole low passes at hi, worked out for the rate, so the figure means the same at every rate.
static double band_rms(const std::vector<float>& x, double lo, double hi, double rate, size_t from, size_t to) {
  to = std::min(to, x.size());
  const double a = std::exp(-2.0 * kPi * lo / rate), b = std::exp(-2.0 * kPi * hi / rate);
  double h1 = 0.0, h2 = 0.0, l1 = 0.0, l2 = 0.0, sum = 0.0;
  for (size_t i = 0; i < to; ++i) {
    h1 = x[i] + (h1 - x[i]) * a;
    const double high1 = x[i] - h1;
    h2 = high1 + (h2 - high1) * a;
    const double high2 = high1 - h2;
    l1 = high2 + (l1 - high2) * b;
    l2 = l1 + (l2 - l1) * b;
    if (i >= from) sum += l2 * l2;
  }
  return to > from ? std::sqrt(sum / static_cast<double>(to - from)) : 0.0;
}

// The rate of the beat in x: the strongest line of its power between lo and hi.
static double beat_hz(const std::vector<float>& x, double rate, double lo, double hi, size_t from, size_t to) {
  const std::vector<float> track = power_track(x, rate, from, to);
  const size_t hop = static_cast<size_t>(kPowerHop * rate + 0.5);
  return line_hz(track, rate / static_cast<double>(hop), lo, hi);
}

// Render with no input in blocks of `block` frames; 0 is a ragged mix.
static Stereo render_blocks(Binaural& d, double seconds, double rate, int block) {
  const int sizes[] = {1, 7, 64, 128, 33, 512, 2048, 5};
  Stereo out;
  const size_t total = static_cast<size_t>(seconds * rate + 0.5);
  out.left.resize(total);
  out.right.resize(total);
  size_t done = 0;
  int which = 0;
  while (done < total) {
    const int want = block > 0 ? block : sizes[which++ % 8];
    const int frames = static_cast<int>(std::min(static_cast<size_t>(want), total - done));
    d.process(frames);
    for (int i = 0; i < frames; ++i) {
      out.left[done + i] = d.out_left()[i];
      out.right[done + i] = d.out_right()[i];
    }
    done += frames;
  }
  return out;
}

// A device at `rate` with pure tones that start and stop at once: the patch
// most measurements want. Everything else is at its default.
static void plain(float rate = kRate) {
  device.init(rate);
  device.set_param(p::kWarmth, 0.0f);
  device.set_param(p::kAttack, 0.01f);
  device.set_param(p::kRelease, 0.05f);
}

static void test_pair();
static void test_ears();
static void test_cross();
static void test_fold();
static void test_warmth();
static void test_glide();
static void test_levels();
static void test_envelope();
static void test_together();
static void test_bed();
static void test_voices();
static void test_silences();
static void test_clicks();
static void test_init();

int main() {
  Conformance spec;
  spec.name = "binaural";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 8.0f;  // the default release is 60 dB in 3 s, and the voice ends at 100 dB
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  test_pair();
  test_ears();
  test_cross();
  test_fold();
  test_warmth();
  test_glide();
  test_levels();
  test_envelope();
  test_together();
  test_bed();
  test_voices();
  test_silences();
  test_clicks();
  test_init();

  // Cost with every voice sounding and everything on: Cross, Warmth at the
  // top, the bed up and a glide running.
  for (float rate : {48000.0f, 96000.0f}) {
    device.init(rate);
    device.set_param(p::kLayout, 1.0f);
    device.set_param(p::kWarmth, 1.0f);
    device.set_param(p::kBed, 0.5f);
    device.set_param(p::kTarget, 12.0f);
    device.set_param(p::kGlide, 5.0f);
    for (int n = 0; n < Binaural::kVoices; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    // report_cost reads the wall clock, which on a shared machine says little: the CPU time of the
    // same render is printed beside it and is the figure to quote.
    const char* label = rate > 50000.0f ? "binaural (8 keys, Cross, bed, 96 kHz)" : "binaural (8 keys, Cross, bed)";
    double cpu_seconds = 0.0;
    report_cost(label, 10.0f, rate, [&] {
      const std::clock_t start = std::clock();
      render(device, 10.0f, rate);
      cpu_seconds = static_cast<double>(std::clock() - start) / CLOCKS_PER_SEC;
    });
    std::printf("%s cost by CPU time: %.1f us per 128-frame stereo block, %.2f%% of real time at %.0f kHz (native)\n", label,
                cpu_seconds * 1.0e6 / (10.0 * rate / 128.0), 100.0 * cpu_seconds / 10.0, rate / 1000.0);
  }

  return finish("binaural");
}

// --- the pair --------------------------------------------------------------------------------

// A4 at Ears 1: the left ear's tone is Beat hertz above the right's, the
// pair is centred on the key, and that is so at every sample rate.
static void test_pair() {
  char label[200];
  for (float rate : kRates) {
    for (float beat : {0.5f, 6.0f, 40.0f}) {
      if (beat != 6.0f && rate != kRate) continue;
      plain(rate);
      device.set_param(p::kBeat, beat);
      device.note_on(1, 440.0f, 0.7f);
      Stereo out = render(device, 12.0f, rate);
      const double left = crossing_hz(out.left, rate, at(1.0, rate), at(11.0, rate));
      const double right = crossing_hz(out.right, rate, at(1.0, rate), at(11.0, rate));
      MEASURED("pair at %.0f Hz, Beat %.1f: left %.5f Hz, right %.5f Hz, apart %.5f", rate, beat, left, right,
               left - right);
      std::snprintf(label, sizeof label, "at %.0f Hz and Beat %.1f the left ear is Beat hertz above the right", rate, beat);
      EXPECT_NEAR(left - right, beat, 0.002, label);
      std::snprintf(label, sizeof label, "at %.0f Hz and Beat %.1f the pair is centred on the key", rate, beat);
      EXPECT_NEAR(0.5 * (left + right), 440.0, 0.002, label);
      EXPECT(left > right, "the left ear is the higher one");
    }
  }
  // With the default Warmth the partials ride on the tone and its crossings
  // wander a little; the rate is still the pair's.
  device.init(kRate);
  device.set_param(p::kAttack, 0.01f);
  device.note_on(1, 440.0f, 0.7f);
  Stereo warm = render(device, 12.0f, kRate);
  const double apart_hz = crossing_hz(warm.left, kRate, at(1.0), at(11.0)) - crossing_hz(warm.right, kRate, at(1.0), at(11.0));
  MEASURED("pair at the default Warmth: apart %.4f Hz", apart_hz);
  EXPECT_NEAR(apart_hz, 6.0, 0.03, "at the default Warmth the ears are still Beat apart");
}

// --- the Ears law ----------------------------------------------------------------------------

static void test_ears() {
  char label[200];
  // Ears 0: the two sides are the same sample for sample, and the beat is in
  // the air: the power of the sound has its line at Beat.
  for (float beat : {0.5f, 6.0f, 40.0f}) {
    const float seconds = beat < 1.0f ? 42.0f : 12.0f;
    plain();
    device.set_param(p::kEars, 0.0f);
    device.set_param(p::kBeat, beat);
    device.note_on(1, 440.0f, 0.7f);
    Stereo out = render(device, seconds, kRate);
    EXPECT(out.left == out.right && peak(out.left) > 0.05, "at Ears 0 the two sides are the same to the sample");
    const double line = beat_hz(mid(out), kRate, 0.6 * beat, 1.6 * beat, at(1.0), at(seconds - 1.0));
    MEASURED("Ears 0, Beat %.1f: the power of the mono sum has its line at %.4f Hz", beat, line);
    std::snprintf(label, sizeof label, "at Ears 0 the mono sum beats at Beat %.1f", beat);
    EXPECT_NEAR(line, beat, 0.01, label);
  }

  // Ears 1: each ear has one tone alone. Ears 0.5: side is 6.0 dB under mid.
  // The mid is the same whatever Ears says.
  Stereo by_ears[3];
  const float settings[3] = {0.0f, 0.5f, 1.0f};
  for (int n = 0; n < 3; ++n) {
    plain();
    device.set_param(p::kEars, settings[n]);
    device.note_on(1, 440.0f, 0.7f);
    by_ears[n] = render(device, 6.0f, kRate);
  }
  {
    const Stereo& out = by_ears[2];
    const double own = level_at(out.left, 443.0, kRate, at(1.0), at(5.0));
    const double other = level_at(out.left, 437.0, kRate, at(1.0), at(5.0));
    const double right_own = level_at(out.right, 437.0, kRate, at(1.0), at(5.0));
    const double right_other = level_at(out.right, 443.0, kRate, at(1.0), at(5.0));
    MEASURED("Ears 1: left 443 Hz %.5f, 437 Hz %.2e; right 437 Hz %.5f, 443 Hz %.2e", own, other, right_own, right_other);
    EXPECT(own > 0.1 && other < 1.0e-4 * own, "at Ears 1 the left ear has the higher tone alone");
    EXPECT(right_own > 0.1 && right_other < 1.0e-4 * right_own, "at Ears 1 the right ear has the lower tone alone");
    const double ripple = db(rms(out.left, at(1.0), at(1.02)) / rms(out.left, at(1.08), at(1.10)));
    EXPECT(std::fabs(ripple) < 0.2, "at Ears 1 nothing beats inside one ear");
  }
  {
    const Stereo& out = by_ears[1];
    const double ratio = db(rms(side(out), at(1.0), at(5.0)) / rms(mid(out), at(1.0), at(5.0)));
    MEASURED("Ears 0.5: side over mid %.2f dB", ratio);
    EXPECT_NEAR(ratio, -6.02, 0.1, "at Ears 0.5 the side is 6.0 dB under the mid");
  }
  {
    const std::vector<float> m0 = mid(by_ears[0]), m1 = mid(by_ears[1]), m2 = mid(by_ears[2]);
    double worst = 0.0;
    for (size_t i = 0; i < m0.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(m0[i]) - m1[i]));
      worst = std::max(worst, std::fabs(static_cast<double>(m0[i]) - m2[i]));
    }
    MEASURED("the mid at Ears 0, 0.5 and 1 differs by %.2e at most", worst);
    EXPECT(worst < 1.0e-6 && peak(m0) > 0.05, "the mono sum does not move with Ears");
    const double line = beat_hz(m2, kRate, 3.6, 9.6, at(1.0), at(5.0));
    EXPECT_NEAR(line, 6.0, 0.05, "the mono fold of Ears 1 beats at Beat");
  }
}

// --- Cross -----------------------------------------------------------------------------------

// Cross at Ears 1: each ear holds two tones Beat apart, so each ear beats in
// the air at Beat; the left pair is half of Beat above the right pair; the
// four are centred on the key.
static void test_cross() {
  const double beat = 8.0, key = 440.0;
  plain();
  device.set_param(p::kLayout, 1.0f);
  device.set_param(p::kBeat, static_cast<float>(beat));
  device.note_on(1, static_cast<float>(key), 0.7f);
  Stereo out = render(device, 12.0f, kRate);
  const size_t from = at(1.0), to = at(11.0);
  const double left_beat = beat_hz(out.left, kRate, 0.6 * beat, 1.6 * beat, from, to);
  const double right_beat = beat_hz(out.right, kRate, 0.6 * beat, 1.6 * beat, from, to);
  MEASURED("Cross, Beat 8: the left ear beats at %.4f Hz, the right at %.4f Hz", left_beat, right_beat);
  EXPECT_NEAR(left_beat, beat, 0.01, "in Cross the left ear beats in the air at Beat");
  EXPECT_NEAR(right_beat, beat, 0.01, "in Cross the right ear beats in the air at Beat");

  // The four lines: the left ear has key - B/4 and key + 3B/4, the right ear
  // key - 3B/4 and key + B/4 (the left ear is the higher one, as everywhere).
  const double left_low = line_hz(out.left, kRate, key - 4.0, key, from, to);
  const double left_high = line_hz(out.left, kRate, key + 4.0, key + 8.0, from, to);
  const double right_low = line_hz(out.right, kRate, key - 8.0, key - 4.0, from, to);
  const double right_high = line_hz(out.right, kRate, key, key + 4.0, from, to);
  MEASURED("Cross lines: left %.3f and %.3f Hz, right %.3f and %.3f Hz", left_low, left_high, right_low, right_high);
  EXPECT_NEAR(left_low, key - 0.25 * beat, 0.02, "Cross: the left ear's lower tone is a quarter of Beat under the key");
  EXPECT_NEAR(left_high, key + 0.75 * beat, 0.02, "Cross: the left ear's upper tone is three quarters of Beat over the key");
  EXPECT_NEAR(right_low, key - 0.75 * beat, 0.02, "Cross: the right ear's lower tone is three quarters of Beat under the key");
  EXPECT_NEAR(right_high, key + 0.25 * beat, 0.02, "Cross: the right ear's upper tone is a quarter of Beat over the key");
  EXPECT_NEAR(0.25 * (left_low + left_high + right_low + right_high), key, 0.1, "Cross: the four tones are centred on the key");
  EXPECT_NEAR(0.5 * (left_low + left_high) - 0.5 * (right_low + right_high), 0.5 * beat, 0.03,
              "Cross: the left ear's pair is half of Beat above the right ear's");
  // Nothing of the other ear's pair leaks across at Ears 1, and the four are
  // equally loud.
  const double own = level_at(out.left, key + 0.75 * beat, kRate, from, to);
  const double leak = level_at(out.left, key - 0.75 * beat, kRate, from, to);
  const double twin = level_at(out.left, key - 0.25 * beat, kRate, from, to);
  const double far = level_at(out.right, key - 0.75 * beat, kRate, from, to);
  MEASURED("Cross levels: left upper %.5f, left lower %.5f, right lower %.5f, leak %.2e", own, twin, far, leak);
  EXPECT(own > 0.02 && leak < 1.0e-3 * own, "Cross at Ears 1 keeps each ear's pair to that ear");
  EXPECT(std::fabs(db(own / twin)) < 0.1 && std::fabs(db(own / far)) < 0.1, "the four tones of Cross are equally loud");

  // Ears crosses the two pairs by the same law: at 0 both sides are one.
  plain();
  device.set_param(p::kLayout, 1.0f);
  device.set_param(p::kEars, 0.0f);
  device.note_on(1, 440.0f, 0.7f);
  Stereo both = render(device, 2.0f, kRate);
  EXPECT(both.left == both.right && peak(both.left) > 0.05, "Cross at Ears 0 gives the same sound to both sides");
}

// --- the fold --------------------------------------------------------------------------------

// Keys fold by octaves into 80 Hz to 1 kHz: C1 and C7 sound inside it at the
// same pitch class.
static void test_fold() {
  EXPECT_NEAR(Binaural::fold(32.703f), 130.81, 0.01, "C1 folds up two octaves");
  EXPECT_NEAR(Binaural::fold(2093.0f), 523.25, 0.01, "C7 folds down two octaves");
  EXPECT(Binaural::fold(80.0f) == 80.0f && Binaural::fold(1000.0f) == 1000.0f, "the ends of the range stay where they are");
  EXPECT_NEAR(Binaural::fold(79.0f), 158.0, 0.001, "a key just under the range goes up an octave");
  EXPECT_NEAR(Binaural::fold(1001.0f), 500.5, 0.001, "a key just over the range goes down an octave");
  EXPECT(Binaural::fold(8.0f) >= 80.0f && Binaural::fold(12000.0f) <= 1000.0f, "the extremes land inside the range");
  const double keys[2] = {32.703, 2093.0};
  const double sounds[2] = {130.81, 523.25};
  for (int n = 0; n < 2; ++n) {
    plain();
    device.note_on(1, static_cast<float>(keys[n]), 0.7f);
    Stereo out = render(device, 5.0f, kRate);
    const double left = crossing_hz(out.left, kRate, at(0.5), at(4.5));
    const double right = crossing_hz(out.right, kRate, at(0.5), at(4.5));
    MEASURED("key %.1f Hz sounds at %.3f Hz (left %.3f, right %.3f)", keys[n], 0.5 * (left + right), left, right);
    EXPECT_NEAR(0.5 * (left + right), sounds[n], 0.05, "a key outside 80 Hz to 1 kHz sounds inside it at its pitch class");
    EXPECT_NEAR(left - right, 6.0, 0.01, "and its pair is Beat apart like any other");
  }
}

// --- Warmth ----------------------------------------------------------------------------------

// Warmth adds the second and third partials at falling level. A partial
// under 1 kHz is split by Beat as the key is; one above is the same in both
// ears.
static void test_warmth() {
  const size_t from = at(1.0), to = at(7.0);
  // A2: partials at 220 and 330 Hz, both split.
  plain();
  device.set_param(p::kWarmth, 1.0f);
  device.note_on(1, 110.0f, 0.7f);
  Stereo low = render(device, 8.0f, kRate);
  const double first = level_at(low.left, 113.0, kRate, from, to);
  for (int n = 2; n <= 3; ++n) {
    const double centre = 110.0 * n;
    const double left_up = level_at(low.left, centre + 3.0, kRate, from, to);
    const double left_down = level_at(low.left, centre - 3.0, kRate, from, to);
    const double right_up = level_at(low.right, centre + 3.0, kRate, from, to);
    const double right_down = level_at(low.right, centre - 3.0, kRate, from, to);
    MEASURED("Warmth 1 on A2, partial %d: left %.5f above and %.2e below, right %.2e above and %.5f below; %.2f dB under the first",
             n, left_up, left_down, right_up, right_down, db(left_up / first));
    EXPECT(left_up > 0.005 && left_down < 1.0e-3 * left_up, "a partial under 1 kHz is half of Beat up in the left ear");
    EXPECT(right_down > 0.005 && right_up < 1.0e-3 * right_down, "and half of Beat down in the right ear");
    EXPECT_NEAR(db(left_up / first), n == 2 ? -6.02 : -12.04, 0.2, "the partials fall by 6 dB each at Warmth 1");
  }
  // A4: the second partial (880 Hz) is split, the third (1320 Hz) is not.
  plain();
  device.set_param(p::kWarmth, 1.0f);
  device.note_on(1, 440.0f, 0.7f);
  Stereo high = render(device, 8.0f, kRate);
  const double second_up = level_at(high.left, 883.0, kRate, from, to);
  const double second_down = level_at(high.left, 877.0, kRate, from, to);
  const double third_left = level_at(high.left, 1320.0, kRate, from, to);
  const double third_right = level_at(high.right, 1320.0, kRate, from, to);
  const double third_split = std::max(level_at(high.left, 1323.0, kRate, from, to), level_at(high.left, 1317.0, kRate, from, to));
  MEASURED("Warmth 1 on A4: 883 Hz %.5f, 877 Hz %.2e in the left; 1320 Hz %.5f left, %.5f right, %.2e beside it", second_up,
           second_down, third_left, third_right, third_split);
  EXPECT(second_up > 0.005 && second_down < 1.0e-3 * second_up, "on A4 the second partial is split by Beat");
  EXPECT(third_left > 0.003 && std::fabs(db(third_left / third_right)) < 0.05 && third_split < 1.0e-3 * third_left,
         "on A4 the third partial, above 1 kHz, is the same in both ears");
  {
    // The same in both ears means the same samples: take the split parts away
    // and what is left at 1320 Hz is in step on the two sides.
    const std::vector<float> s = side(high);
    EXPECT(level_at(s, 1320.0, kRate, from, to) < 1.0e-3 * third_left, "the unsplit partial has no side signal");
  }
  // Warmth 0 is the bare pair.
  plain();
  device.note_on(1, 220.0f, 0.7f);
  Stereo bare = render(device, 4.0f, kRate);
  const double tone = level_at(bare.left, 223.0, kRate, at(1.0), at(3.0));
  const double over = std::max(level_at(bare.left, 443.0, kRate, at(1.0), at(3.0)), level_at(bare.left, 663.0, kRate, at(1.0), at(3.0)));
  MEASURED("Warmth 0: tone %.5f, partials %.2e", tone, over);
  EXPECT(over < 1.0e-4 * tone, "at Warmth 0 there are no partials");
}

// --- the glide -------------------------------------------------------------------------------

// The mean of Beat · (Target / Beat)^(t / T) between a and b seconds.
static double glide_mean(double base, double target, double time, double a, double b) {
  const double log_ratio = std::log(target / base);
  auto power = [&](double t) { return std::exp(log_ratio * std::min(t, time) / time); };
  if (a >= time) return target;
  const double end = std::min(b, time);
  const double gliding = base * time / log_ratio * (power(end) - power(a));
  return (gliding + target * (b - end)) / (b - a);
}

// The beat between the ears over [a, b) seconds of a render that began `offset` seconds in.
static double ears_apart(const Stereo& out, double a, double b, double offset = 0.0) {
  return crossing_hz(out.left, kRate, at(a - offset), at(b - offset)) - crossing_hz(out.right, kRate, at(a - offset), at(b - offset));
}

static void test_glide() {
  const double base = 10.0, target = 4.0, time = 120.0;
  plain();
  device.set_param(p::kBeat, static_cast<float>(base));
  device.set_param(p::kTarget, static_cast<float>(target));
  device.set_param(p::kGlide, static_cast<float>(time / 60.0));
  // Armed with no key: nothing counts, however long the wait.
  Stereo wait = render(device, 3.0f, kRate);
  EXPECT(peak(wait.left) == 0.0 && device.meter(0) == 0.0f, "an armed glide waits for the first key");
  device.note_on(1, 440.0f, 0.7f);
  Stereo first = render(device, 30.0f, kRate);
  const float place_30 = device.meter(0);
  // Let go and strike again: the silence between is long enough to fall idle.
  device.note_off(1);
  Stereo gap = render(device, 0.5f, kRate);
  EXPECT(peak(gap.left, at(0.3)) == 0.0, "the glide test holds a silence in which the device is idle");
  device.note_on(1, 440.0f, 0.7f);
  Stereo second = render(device, 125.0f, kRate);
  const double offset = 30.5;

  struct Window {
    double from, to;
    const Stereo* out;
    double offset;
    const char* what;
  };
  const Window windows[] = {
      {0.5, 4.5, &first, 0.0, "at the start the beat is Beat"},
      {24.0, 28.0, &first, 0.0, "after 26 s the beat follows the closed form"},
      {58.0, 62.0, &second, offset, "at 60 s, after a release and a new key, the glide has not started again"},
      {115.5, 119.5, &second, offset, "just before its time is up the beat is nearly at Target"},
      {120.5, 124.5, &second, offset, "once its time is up the beat is Target"},
      {148.0, 152.0, &second, offset, "at 150 s the beat holds at Target"},
  };
  for (const Window& w : windows) {
    const double measured = ears_apart(*w.out, w.from, w.to, w.offset);
    const double expected = glide_mean(base, target, time, w.from, w.to);
    MEASURED("glide 10 to 4 Hz in 120 s, %.1f to %.1f s: %.4f Hz, closed form %.4f Hz", w.from, w.to, measured, expected);
    EXPECT_NEAR(measured, expected, 0.001 * expected + 0.002, w.what);
  }
  MEASURED("glide place after 30 s %.4f, after 155.5 s %.4f", place_30, device.meter(0));
  EXPECT_NEAR(place_30, 0.25, 0.001, "the reading says how far the glide has come");
  EXPECT(device.meter(0) == 1.0f, "the reading is 1 once the glide holds");

  // Moving Glide runs it again, at once while a key is held.
  device.set_param(p::kGlide, 1.0f);
  EXPECT(device.meter(0) == 0.0f, "moving Glide starts the glide again");
  Stereo again = render(device, 32.0f, kRate);
  const double restarted = ears_apart(again, 28.0, 32.0);
  MEASURED("glide run again over 60 s: %.4f Hz at 28 to 32 s, closed form %.4f Hz", restarted, glide_mean(base, target, 60.0, 28.0, 32.0));
  EXPECT_NEAR(restarted, glide_mean(base, target, 60.0, 28.0, 32.0), 0.01, "and it leaves Beat again at that sample");
  // It counts on while the device sleeps with no key held.
  device.note_off(1);
  render(device, 20.0f, kRate);
  EXPECT_NEAR(device.meter(0), (32.0 + 20.0) / 60.0, 0.001, "the glide counts on through a silence");
  // Glide at 0 is off: the beat is Beat whatever Target says.
  plain();
  device.set_param(p::kBeat, 10.0f);
  device.set_param(p::kTarget, 4.0f);
  device.note_on(1, 440.0f, 0.7f);
  Stereo off = render(device, 6.0f, kRate);
  EXPECT_NEAR(ears_apart(off, 1.0, 5.0), 10.0, 0.002, "with Glide at 0 the beat stays at Beat");
  EXPECT(device.meter(0) == 0.0f, "and the reading stays at 0");
}

// --- levels ----------------------------------------------------------------------------------

// The largest sample of either ear over `seconds`, nothing kept.
static double hold_peak(double seconds, double rate) {
  double worst = 0.0;
  size_t left = static_cast<size_t>(seconds * rate);
  while (left > 0) {
    const int frames = static_cast<int>(std::min<size_t>(left, 512));
    device.process(frames);
    for (int i = 0; i < frames; ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(device.out_left()[i])));
      worst = std::max(worst, std::fabs(static_cast<double>(device.out_right()[i])));
    }
    left -= static_cast<size_t>(frames);
  }
  return worst;
}

static void test_levels() {
  char label[200];
  // One key at gain 0.7, at the default volume: near -18 dBFS in each ear,
  // whatever Ears, Layout and Warmth say, at every rate.
  struct Patch {
    const char* name;
    int param;
    float value;
  };
  const Patch patches[] = {{"the defaults", -1, 0.0f}, {"Ears 0", p::kEars, 0.0f}, {"Cross", p::kLayout, 1.0f},
                           {"Warmth 0", p::kWarmth, 0.0f}, {"Warmth 1", p::kWarmth, 1.0f}};
  for (float rate : kRates) {
    for (const Patch& patch : patches) {
      if (rate != kRate && patch.param != -1) continue;
      device.init(rate);
      if (patch.param >= 0) device.set_param(patch.param, patch.value);
      device.note_on(1, 220.0f, 0.7f);
      Stereo out = render(device, 8.0f, rate);
      const double left = db(peak(out.left)), right = db(peak(out.right));
      MEASURED("one key at gain 0.7, %s, %.0f Hz: peaks %.2f and %.2f dBFS", patch.name, rate, left, right);
      std::snprintf(label, sizeof label, "one key at gain 0.7 peaks near -18 dBFS (%s, %.0f Hz: %.2f and %.2f)", patch.name, rate,
                    left, right);
      // The bound is 20·log10(0.7 · kVoiceAmp) = -18.24 dBFS, met when a tone and its partials crest
      // together. At Ears 0 the two tones' partials stay in step with their carrier and never do: 1.7 dB under.
      EXPECT(left > -20.5 && left < -18.2 && right > -20.5 && right < -18.2, label);
      if (patch.param != p::kEars) EXPECT_NEAR(left, -18.24, 0.05, "with one tone an ear the peak is the stated bound");
    }
  }

  // Eight keys at full gain, held for ten minutes: neither ear reaches the
  // knee of the clip at 0.5.
  device.init(kRate);
  for (int n = 0; n < Binaural::kVoices; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 5 / 12.0f), 1.0f);
  const double ten_minutes = hold_peak(600.0, kRate);
  MEASURED("eight keys at full gain for ten minutes: peak %.4f", ten_minutes);
  EXPECT(ten_minutes < 0.5 && ten_minutes > 0.25, "eight keys at full gain stay under the knee for ten minutes");
  // The worst there is: eight keys on one pitch, struck together, so that
  // every voice is in step. They reach the knee's edge and no further.
  const Patch worst_patches[] = {{"the defaults", -1, 0.0f}, {"Ears 0", p::kEars, 0.0f}, {"Cross", p::kLayout, 1.0f},
                                 {"Warmth 1", p::kWarmth, 1.0f}, {"Volume at its top", p::kVolume, 6.0f}};
  for (const Patch& patch : worst_patches) {
    device.init(kRate);
    if (patch.param >= 0) device.set_param(patch.param, patch.value);
    for (int n = 0; n < Binaural::kVoices; ++n) device.note_on(n, 220.0f, 1.0f);
    const double in_step = hold_peak(20.0, kRate);
    MEASURED("eight keys on one pitch, %s: peak %.4f", patch.name, in_step);
    std::snprintf(label, sizeof label, "eight keys in step reach the knee's edge and no further (%s: %.4f)", patch.name, in_step);
    if (patch.param == p::kVolume) {
      EXPECT(in_step > 0.5 && in_step < 1.0, "above 0 dB of Volume a full chord in step does reach the clip, which holds it");
    } else {
      // (At Ears 0 the partials never crest together with the tone: 0.405.)
      EXPECT(in_step < 0.5 && in_step > (patch.param == p::kEars ? 0.38 : 0.49), label);
    }
  }

  // The sum is scaled by the root of the keys: a held key drops 3 dB when a
  // second one is held beside it.
  plain();
  device.note_on(1, 220.0f, 1.0f);
  Stereo one = render(device, 3.0f, kRate);
  device.note_on(2, 330.0f, 1.0f);
  Stereo two = render(device, 3.0f, kRate);
  const double alone = level_at(one.left, 223.0, kRate, at(1.0), at(3.0));
  const double shared = level_at(two.left, 223.0, kRate, at(1.0), at(3.0));
  MEASURED("a held key alone %.5f, beside a second %.5f (%.2f dB)", alone, shared, db(shared / alone));
  EXPECT_NEAR(alone, Binaural::kVoiceAmp, 0.002, "one key at full gain has the stated amplitude");
  EXPECT_NEAR(db(shared / alone), -3.01, 0.1, "a second key takes 3 dB off the first");

  // Four keys held, three let go at a long Release: the held key comes up
  // slowly as the tails fall, with no step when they end.
  plain();
  device.set_param(p::kRelease, 10.0f);
  const float chord[4] = {220.0f, 330.0f, 495.0f, 742.5f};
  for (int n = 0; n < 4; ++n) device.note_on(n, chord[n], 1.0f);
  Stereo held = render(device, 2.0f, kRate);
  for (int n = 1; n < 4; ++n) device.note_off(n);
  Stereo falling = render(device, 19.0f, kRate);
  const double before = level_at(held.left, 223.0, kRate, at(1.0), at(2.0));
  double worst_move = 0.0, last = 0.0;
  std::vector<double> track;
  for (size_t start = 0; start + at(0.1) <= falling.size(); start += at(0.05)) {
    track.push_back(db(level_at(falling.left, 223.0, kRate, start, start + at(0.1))));
  }
  for (size_t i = 2; i < track.size(); ++i) worst_move = std::max(worst_move, std::fabs(track[i] - track[i - 2]));
  last = track.back();
  MEASURED("four keys, three let go: the held key moves %.3f dB in 100 ms at most, and ends %.2f dB over where it was", worst_move,
           last - db(before));
  EXPECT(worst_move < 1.0, "the held key's level moves by under 1 dB in any 100 ms while the tails fall and after");
  EXPECT_NEAR(last - db(before), 6.02, 0.2, "and it ends 6 dB up, alone");
  EXPECT(std::max(peak(falling.left), peak(falling.right)) < 0.5, "and neither ear reaches the knee on the way");
}

// --- attack and release ----------------------------------------------------------------------

// The times mean the same at every sample rate: half level a third of the
// way through the attack, 30 dB down half way through the release, and
// exact silence once the tail is 100 dB down.
static void test_envelope() {
  char label[200];
  for (float rate : kRates) {
    device.init(rate);
    device.set_param(p::kWarmth, 0.0f);
    device.set_param(p::kAttack, 2.0f);
    device.set_param(p::kRelease, 3.0f);
    device.note_on(1, 440.0f, 0.7f);
    Stereo up = render(device, 4.0f, rate);
    const double full = peak(up.left, at(3.0, rate));
    double half_at = 0.0;
    for (size_t i = 0; i < up.size(); ++i) {
      if (std::fabs(up.left[i]) >= 0.5 * full) {
        half_at = static_cast<double>(i) / rate;
        break;
      }
    }
    device.note_off(1);
    Stereo down = render(device, 7.0f, rate);
    const double half_way = db(peak(down.left, at(1.5, rate), at(1.52, rate)) / full);
    MEASURED("%.0f Hz: half level %.3f s into an attack of 2 s; %.2f dB down 1.5 s into a release of 3 s", rate, half_at, half_way);
    std::snprintf(label, sizeof label, "at %.0f Hz the attack takes its time (half level at %.3f s)", rate, half_at);
    EXPECT_NEAR(half_at, 0.662, 0.02, label);
    std::snprintf(label, sizeof label, "at %.0f Hz the release takes its time (%.2f dB at half time)", rate, half_way);
    EXPECT_NEAR(half_way, -30.0, 1.0, label);
    EXPECT(peak(down.left, at(4.8, rate), at(4.9, rate)) > 0.0 && peak(down.left, at(5.3, rate)) == 0.0 &&
               peak(down.right, at(5.3, rate)) == 0.0,
           "the tail ends in exact silence when it is 100 dB down");
  }
}

// --- one beat for every key ------------------------------------------------------------------

// The largest sample within two samples of each null of a beat of `beat`
// hertz that began at its crest at sample `origin`, between from and to.
static double worst_null(const std::vector<float>& x, size_t origin, double beat, size_t from, size_t to) {
  double worst = 0.0;
  int found = 0;
  for (int k = 0; k < 1000; ++k) {
    const size_t n = origin + static_cast<size_t>((k + 0.5) * kRate / beat + 0.5);
    if (n < from + 2) continue;
    if (n + 3 > to || n + 3 > x.size()) break;
    worst = std::max(worst, peak(x, n - 2, n + 3));
    ++found;
  }
  return found >= 3 ? worst : 1.0e9;
}

static void test_together() {
  const double beat = 6.0;
  // One key from silence: the beat starts at its crest, so its nulls are a
  // half, one and a half, two and a half beats after the key.
  plain();
  device.set_param(p::kEars, 0.0f);
  device.note_on(1, 220.0f, 0.7f);
  Stereo one = render(device, 3.0f, kRate);
  const double full = peak(one.left);
  const double one_null = worst_null(one.left, 0, beat, at(0.3), at(3.0));
  MEASURED("one key at Ears 0: peak %.4f, at the nulls %.2e", full, one_null);
  EXPECT(peak(one.left, at(0.012), at(0.03)) > 0.7 * full, "a key from silence starts on the beat's crest");
  EXPECT(one_null < 0.005 * full, "one key's nulls fall where the half-beat clock says");

  // Three keys struck 100 ms apart beat together: the nulls of their sum
  // fall on the same samples as one key's.
  plain();
  device.set_param(p::kEars, 0.0f);
  device.note_on(1, 220.0f, 0.7f);
  Stereo three = render(device, 0.1f, kRate);
  device.note_on(2, 277.18f, 0.7f);
  three = concat(three, render(device, 0.1f, kRate));
  device.note_on(3, 329.63f, 0.7f);
  three = concat(three, render(device, 2.8f, kRate));
  const double three_null = worst_null(three.left, 0, beat, at(0.5), at(3.0));
  MEASURED("three keys 100 ms apart at Ears 0: peak %.4f, at one key's nulls %.2e", peak(three.left), three_null);
  EXPECT(three_null < 0.005 * peak(three.left), "three keys struck 100 ms apart share one beat");

  // A key after a silence starts the beat again at its crest, wherever the
  // old beat would have been (20.2 beats on).
  device.note_off(1);
  device.note_off(2);
  device.note_off(3);
  Stereo gap = render(device, 0.37f, kRate);
  device.process(13);
  EXPECT(peak(gap.left, at(0.2)) == 0.0, "the gap is silent");
  device.note_on(4, 220.0f, 0.7f);
  Stereo after = render(device, 2.0f, kRate);
  const double after_null = worst_null(after.left, 0, beat, at(0.3), at(2.0));
  MEASURED("a key after a silence: at the nulls counted from that key %.2e", after_null);
  EXPECT(peak(after.left, at(0.012), at(0.03)) > 0.7 * full && after_null < 0.005 * full,
         "a key from silence restarts the beat at its crest");
}

// --- the bed ---------------------------------------------------------------------------------

// The bed alone: the same phrase with Bed at `bed` and at 0, one taken from
// the other. `keys` plays the phrase and returns the render.
template <typename Keys>
static Stereo bed_alone(float rate, float bed, float colour, Keys keys, Stereo* tones = nullptr) {
  Stereo out[2];
  for (int pass = 0; pass < 2; ++pass) {
    plain(rate);
    device.set_param(p::kColour, colour);
    device.set_param(p::kBed, pass == 0 ? 0.0f : bed);
    out[pass] = keys();
  }
  if (tones) *tones = out[0];
  for (size_t i = 0; i < out[1].size(); ++i) {
    out[1].left[i] -= out[0].left[i];
    out[1].right[i] -= out[0].right[i];
  }
  return out[1];
}

static void test_bed() {
  char label[200];
  // Bed against tone: the same at every sample rate. At Bed 1 the bed is as
  // loud as one bare key; the knob is a square law, so half is 12 dB under.
  double balance[3] = {0.0, 0.0, 0.0}, bright[3] = {0.0, 0.0, 0.0};
  for (int n = 0; n < 3; ++n) {
    const float rate = kRates[n];
    Stereo tones;
    Stereo bed = bed_alone(
        rate, 1.0f, 0.6f,
        [&] {
          device.note_on(1, 220.0f, 0.5f);
          return render(device, 10.0f, rate);
        },
        &tones);
    const size_t from = at(2.0, rate), to = at(10.0, rate);
    balance[n] = db(rms(bed.left, from, to) / rms(tones.left, from, to));
    const double right = db(rms(bed.right, from, to) / rms(tones.right, from, to));
    const double together = correlation(bed.left, bed.right, from, to);
    bright[n] = db(band_rms(bed.left, 300.0, 3000.0, rate, from, to) / rms(tones.left, from, to));
    MEASURED("%.0f Hz: bed against tone %.2f dB left, %.2f dB right; the two sides correlate %.3f; its 300 Hz to 3 kHz band %.2f dB",
             rate, balance[n], right, together, bright[n]);
    std::snprintf(label, sizeof label, "at %.0f Hz the bed at 1 is as loud as one bare key (%.2f dB)", rate, balance[n]);
    EXPECT_NEAR(balance[n], 0.0, 1.0, label);
    EXPECT_NEAR(right, balance[n], 0.7, "the bed is as loud in the right ear as in the left");
    EXPECT(std::fabs(together) < 0.05, "the bed's two sides are unlike noises");
  }
  EXPECT(std::fabs(balance[0] - balance[1]) < 1.0 && std::fabs(balance[2] - balance[1]) < 1.0,
         "bed against tone is within 1 dB across 44.1, 48 and 96 kHz");
  // One level over all is one level in each hertz only if the colour holds too: the bed's band from
  // 300 Hz to 3 kHz stands the same against the tone at every rate (white noise a sample would lose
  // 3 dB there at 96 kHz).
  EXPECT(std::fabs(bright[0] - bright[1]) < 0.5 && std::fabs(bright[2] - bright[1]) < 0.5,
         "the bed's level in each hertz is the same at 44.1, 48 and 96 kHz");

  auto one_key = [] {
    device.note_on(1, 220.0f, 0.5f);
    return render(device, 10.0f, kRate);
  };
  const Stereo full = bed_alone(kRate, 1.0f, 0.6f, one_key);
  const Stereo half = bed_alone(kRate, 0.5f, 0.6f, one_key);
  const double law = db(rms(half.left, at(2.0)) / rms(full.left, at(2.0)));
  MEASURED("Bed 0.5 against Bed 1: %.2f dB", law);
  EXPECT_NEAR(law, -12.04, 0.2, "Bed is a square law: half is 12 dB under");

  // Colour: white, pink, brown, one loudness.
  double share[3], loud[3];
  const float colours[3] = {0.0f, 0.5f, 1.0f};
  for (int n = 0; n < 3; ++n) {
    const Stereo bed = bed_alone(kRate, 1.0f, colours[n], one_key);
    share[n] = energy_above(bed.left, 1000.0, kRate, at(2.0));
    loud[n] = db(rms(bed.left, at(2.0)));
    MEASURED("Colour %.1f: %.3f of the bed's power above 1 kHz, level %.2f dBFS", colours[n], share[n], loud[n]);
  }
  EXPECT(share[0] > 0.7 && share[1] < share[0] - 0.2 && share[1] > 0.2 && share[2] < 0.1,
         "Colour runs from white through pink to brown");
  EXPECT(std::fabs(loud[0] - loud[1]) < 1.0 && std::fabs(loud[2] - loud[1]) < 1.5, "the colours are one loudness");

  // No bed before a key, the bed falls with the release, and none after it.
  plain();
  device.set_param(p::kBed, 1.0f);
  Stereo before = render(device, 0.5f, kRate);
  EXPECT(peak(before.left) == 0.0 && peak(before.right) == 0.0, "there is no bed before a key");
  auto let_go = [] {
    device.set_param(p::kRelease, 3.0f);
    device.note_on(1, 220.0f, 0.5f);
    Stereo out = render(device, 2.0f, kRate);
    device.note_off(1);
    return concat(out, render(device, 6.0f, kRate));
  };
  const Stereo fading = bed_alone(kRate, 1.0f, 0.3f, let_go);
  const double held_level = rms(fading.left, at(1.0), at(2.0));
  const double falling = db(rms(fading.left, at(3.4), at(3.6)) / held_level);
  MEASURED("the bed 1.5 s into a release of 3 s: %.2f dB", falling);
  EXPECT_NEAR(falling, -30.0, 2.5, "the bed falls with the key's release");
  EXPECT(peak(fading.left, at(7.3)) == 0.0 && peak(fading.right, at(7.3)) == 0.0, "there is no bed after the release");

  // It follows the loudest key: a softer second key does not move it.
  const Stereo with_soft = bed_alone(kRate, 1.0f, 0.6f, [] {
    device.note_on(1, 220.0f, 0.5f);
    device.note_on(2, 330.0f, 0.15f);
    return render(device, 3.0f, kRate);
  });
  const double moved = apart(with_soft, full, at(0.5), at(3.0));
  MEASURED("the bed with a softer second key differs by %.2e", moved);
  EXPECT(moved < 1.0e-6 && rms(with_soft.left, at(0.5)) > 0.01, "the bed is gated by the loudest key alone");
  // And it follows that key's gain, so the balance holds at any touch.
  const Stereo soft = bed_alone(kRate, 1.0f, 0.6f, [] {
    device.note_on(1, 220.0f, 0.25f);
    return render(device, 10.0f, kRate);
  });
  EXPECT_NEAR(db(rms(soft.left, at(2.0)) / rms(full.left, at(2.0))), -6.02, 0.1, "a key half as loud has a bed half as loud");
}

// --- voices ----------------------------------------------------------------------------------

// Eight held keys whose tones stand clear of 620 and 790 Hz, the two probes.
static const float kChord[8] = {100.0f, 125.0f, 150.0f, 175.0f, 200.0f, 225.0f, 250.0f, 275.0f};

static void hold_chord(int keys, float release = 3.0f) {
  plain();
  device.set_param(p::kRelease, release);
  for (int n = 0; n < keys; ++n) device.note_on(n, kChord[n], 0.8f);
}

static void test_voices() {
  // Two keys into a full pool in one block: both are there.
  hold_chord(8);
  render(device, 1.0f, kRate);
  device.note_on(98, 620.0f, 0.8f);
  device.note_on(99, 790.0f, 0.8f);
  Stereo both = render(device, 0.6f, kRate);
  const double first = level_at(both.left, 623.0, kRate, at(0.2), at(0.6));
  const double second = level_at(both.left, 793.0, kRate, at(0.2), at(0.6));
  MEASURED("two keys into a full pool: %.4f and %.4f", first, second);
  EXPECT(first > 0.02 && second > 0.02, "two keys into a full pool in one block are both present");

  // Seven held and two more in one block: the eighth takes the free voice,
  // and the ninth must not take it back while its envelope is still at zero.
  hold_chord(7);
  render(device, 1.0f, kRate);
  device.note_on(98, 620.0f, 0.8f);
  device.note_on(99, 790.0f, 0.8f);
  Stereo fresh = render(device, 0.6f, kRate);
  const double eighth = level_at(fresh.left, 623.0, kRate, at(0.2), at(0.6));
  const double ninth = level_at(fresh.left, 793.0, kRate, at(0.2), at(0.6));
  MEASURED("an eighth and a ninth key in one block: %.4f and %.4f", eighth, ninth);
  EXPECT(eighth > 0.02 && ninth > 0.02, "a voice just taken is not the next one stolen");

  // A key struck twice in one block with every level tied: it takes one
  // voice, the chord's second note stays, and one note off ends it.
  hold_chord(8, 0.05f);
  render(device, 1.0f, kRate);
  device.note_on(99, 620.0f, 0.8f);
  device.note_on(99, 620.0f, 0.8f);
  Stereo twice = render(device, 0.6f, kRate);
  const double second_note = level_at(twice.left, 128.0, kRate, at(0.2), at(0.6));
  const double struck = level_at(twice.left, 623.0, kRate, at(0.2), at(0.6));
  MEASURED("a key struck twice into a full pool: the key %.4f, the chord's second note %.4f", struck, second_note);
  EXPECT(struck > 0.02 && second_note > 0.02, "a key struck twice with tied levels takes one voice only");
  device.note_off(99);
  for (int n = 0; n < 8; ++n) device.note_off(n);
  Stereo rest = render(device, 1.0f, kRate);
  EXPECT(peak(rest.left, at(0.3)) == 0.0 && peak(rest.right, at(0.3)) == 0.0,
         "and it leaves exact silence after one release of each key");

  // A key let go before its stolen voice was free never sounds.
  hold_chord(8, 0.05f);
  render(device, 1.0f, kRate);
  device.note_on(99, 620.0f, 0.8f);
  device.note_off(99);
  Stereo never = render(device, 0.4f, kRate);
  EXPECT(level_at(never.left, 623.0, kRate, at(0.05), at(0.4)) < 1.0e-4, "a key let go before it could start stays silent");
  for (int n = 0; n < 8; ++n) device.note_off(n);
  Stereo drained = render(device, 1.0f, kRate);
  EXPECT(peak(drained.left, at(0.3)) == 0.0, "and every voice ends");

  // A held key struck again plays on in its own voice: no second voice piles
  // up on it, and one note off ends it.
  plain();
  device.note_on(1, 220.0f, 0.7f);
  Stereo once = render(device, 1.0137f, kRate);  // not a whole number of cycles of either tone
  device.note_on(1, 220.0f, 0.7f);
  Stereo again = render(device, 1.0f, kRate);
  const double level_once = level_at(once.left, 223.0, kRate, at(0.5), at(1.0));
  const double level_again = level_at(again.left, 223.0, kRate, at(0.5), at(1.0));
  MEASURED("a held key struck again: %.5f before, %.5f after", level_once, level_again);
  EXPECT_NEAR(db(level_again / level_once), 0.0, 0.05, "a held key struck again stays one voice at one level");
  EXPECT(apart(once, again, at(0.5), at(0.6)) > 0.01, "(the two stretches are not one render)");
  device.note_off(1);
  Stereo ended = render(device, 0.5f, kRate);
  EXPECT(peak(ended.left, at(0.2)) == 0.0, "and one note off ends it");

  // A key struck again while its release still sounds takes its own voice up
  // again: the tone neither doubles nor cancels.
  plain();
  device.set_param(p::kRelease, 2.0f);
  device.note_on(1, 220.0f, 0.7f);
  render(device, 1.0f, kRate);
  device.note_off(1);
  render(device, 0.3137f, kRate);
  device.note_on(1, 220.0f, 0.7f);
  Stereo back = render(device, 1.0f, kRate);
  const double level_back = level_at(back.left, 223.0, kRate, at(0.5), at(1.0));
  MEASURED("a key struck again in its release: %.5f against %.5f held", level_back, level_once);
  EXPECT_NEAR(db(level_back / level_once), 0.0, 0.05, "a key struck again in its release is one voice at its level");
  device.note_off(1);
  Stereo gone = render(device, 4.5f, kRate);
  EXPECT(peak(gone.left, at(3.6)) == 0.0, "and it ends with its one release");

  // A key struck again with every voice busy keeps its release: a quarter of
  // the release time after it is let go its envelope is 15 dB down, not gone
  // (and the sum's scale has come up 0.5 dB, with seven keys left).
  hold_chord(8, 8.0f);
  render(device, 1.0f, kRate);
  device.note_on(3, kChord[3], 0.8f);
  Stereo busy = render(device, 0.5f, kRate);
  const double held_level = level_at(busy.left, kChord[3] + 3.0, kRate, at(0.1), at(0.5));
  device.note_off(3);
  Stereo quarter = render(device, 2.5f, kRate);
  const double later = level_at(quarter.left, kChord[3] + 3.0, kRate, at(1.8), at(2.2));
  MEASURED("struck again with the pool full, then let go: %.2f dB a quarter of the release later", db(later / held_level));
  EXPECT_NEAR(db(later / held_level), -14.5, 1.0, "a key struck again with every voice busy keeps its release");
}

// --- sleep and block size --------------------------------------------------------------------

static void test_silences() {
  // The output does not depend on the block size, across silences of every
  // length around the moment the device falls idle (which block that is
  // depends on the block size) and one long after it. Controls are moved in
  // the silence, 10 ms before the next key; a glide runs through all of it.
  auto phrase = [](int block, float silence) {
    device.init(kRate);
    device.set_param(p::kRelease, 0.05f);
    device.set_param(p::kAttack, 0.01f);
    device.set_param(p::kBed, 0.4f);
    device.set_param(p::kBeat, 5.0f);
    device.set_param(p::kTarget, 9.0f);
    device.set_param(p::kGlide, 0.05f);
    Stereo out;
    auto run_for = [&](float seconds) { out = concat(out, render_blocks(device, seconds, kRate, block)); };
    device.note_on(1, 220.0f, 0.8f);
    device.note_on(2, 329.63f, 0.8f);
    run_for(0.7f);
    device.note_off(1);
    device.note_off(2);
    run_for(silence - 0.01f);
    device.set_param(p::kEars, 0.4f);
    device.set_param(p::kWarmth, 0.9f);
    device.set_param(p::kBed, 0.8f);
    device.set_param(p::kColour, 0.1f);
    device.set_param(p::kLayout, 1.0f);
    device.set_param(p::kVolume, -3.0f);
    run_for(0.01f);
    device.note_on(3, 277.18f, 0.8f);
    run_for(0.6f);
    device.set_param(p::kLayout, 0.0f);
    device.set_param(p::kEars, 1.0f);
    device.set_param(p::kColour, 0.9f);
    run_for(0.3f);
    return out;
  };
  {
    Stereo asleep = phrase(128, 1.3f);
    EXPECT(peak(asleep.left, at(1.0), at(1.95)) == 0.0, "the phrase holds a silence in which the device sleeps");
    EXPECT(rms(asleep.left, at(2.2)) > 1.0e-3, "and a note after it");
  }
  double worst = 0.0;
  float worst_silence = 0.0f;
  const char* worst_block = "none";
  for (float silence : {0.10f, 0.12f, 0.14f, 0.16f, 0.18f, 0.20f, 0.22f, 0.24f, 0.26f, 0.28f, 0.30f, 1.3f}) {
    Stereo reference = phrase(128, silence);
    for (int block : {1, 0, 2048}) {
      Stereo other = phrase(block, silence);
      const double diff = apart(other, reference);
      if (diff > worst) {
        worst = diff;
        worst_silence = silence;
        worst_block = block == 0 ? "ragged" : block == 1 ? "1 frame" : "2048 frames";
      }
    }
  }
  char label[200];
  std::snprintf(label, sizeof label, "output does not depend on block size across a silence (worst %g, %s blocks, %.2f s silence)", worst,
                worst_block, worst_silence);
  EXPECT(worst < 1.0e-6, label);

  // Knobs moved while the device sleeps are simply there at the next key:
  // the note is the one a device set that way from the start plays. Every
  // voice has played before, so nothing a voice keeps may leak into it, and
  // the device is put to sleep off the beat of its control clock (13 frames).
  auto moved = [] {
    device.set_param(p::kEars, 0.3f);
    device.set_param(p::kWarmth, 0.8f);
    device.set_param(p::kBed, 0.7f);
    device.set_param(p::kColour, 0.2f);
    device.set_param(p::kLayout, 1.0f);
    device.set_param(p::kVolume, -6.0f);
    device.set_param(p::kAttack, 0.02f);
    device.set_param(p::kRelease, 0.1f);
    device.set_param(p::kBeat, 3.0f);
  };
  device.init(kRate);
  device.set_param(p::kAttack, 0.01f);
  device.set_param(p::kRelease, 0.05f);
  device.set_param(p::kBed, 0.3f);
  for (int n = 0; n < Binaural::kVoices; ++n) device.note_on(n, kChord[n] * 1.31f, 0.8f);
  render(device, 0.3f, kRate);
  device.process(13);
  for (int n = 0; n < Binaural::kVoices; ++n) device.note_off(n);
  Stereo quiet = render(device, 1.0f, kRate);
  EXPECT(peak(quiet.left, at(0.4)) == 0.0, "the device sleeps before the knobs are moved");
  moved();
  device.note_on(2, 330.0f, 0.8f);
  Stereo after_sleep = render(device, 1.0f, kRate);
  device.init(kRate);
  moved();
  device.note_on(2, 330.0f, 0.8f);
  Stereo from_start = render(device, 1.0f, kRate);
  const double differs = apart(after_sleep, from_start);
  MEASURED("knobs moved in a silence: the next note differs from a fresh device's by %.2e", differs);
  EXPECT(differs < 1.0e-6 && peak(from_start.left) > 0.02, "knobs moved while the device sleeps are there at the next key");
}

// --- clicks ----------------------------------------------------------------------------------

// How much of an event is heard in its first 8 samples: the largest
// difference from the same render without the event over those samples,
// against the largest over 20 ms. Something smoothed or faded has gone a
// small part of the way; a jump is there at once. The worst of eight
// moments spread over more than one beat of the default 6 Hz, so the event
// is tried at the crest, in the null and between. -1 when the event changed
// nothing at all.
template <typename Setup, typename Event>
static double suddenness(Setup setup, Event event) {
  double worst = -1.0;
  for (int trial = 0; trial < 8; ++trial) {
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      device.init(kRate);
      device.set_param(p::kAttack, 0.01f);
      setup();
      render(device, 0.6f + 0.0237f * static_cast<float>(trial), kRate);
      if (pass == 0) event();
      out[pass] = render(device, 0.02f, kRate);
    }
    double early = 0.0, whole = 0.0;
    for (size_t i = 0; i < out[0].size(); ++i) {
      const double difference = std::max(std::fabs(static_cast<double>(out[0].left[i]) - out[1].left[i]),
                                         std::fabs(static_cast<double>(out[0].right[i]) - out[1].right[i]));
      if (i < 8) early = std::max(early, difference);
      whole = std::max(whole, difference);
    }
    if (whole > 1.0e-7) worst = std::max(worst, early / whole);
  }
  return worst;
}

static void three_keys() {
  device.note_on(1, 146.83f, 0.8f);
  device.note_on(2, 220.0f, 0.8f);
  device.note_on(3, 349.23f, 0.8f);
}

static void test_clicks() {
  char label[200];
  auto expect_soft = [&](const char* what, double value) {
    MEASURED("suddenness of %s: %.4f", what, value);
    std::snprintf(label, sizeof label, "%s does not click (%.3f of it is there within 8 samples)", what, value);
    EXPECT(value >= 0.0 && value < 0.15, label);
  };
  auto full_pool = [] {
    for (int n = 0; n < Binaural::kVoices; ++n) device.note_on(n, kChord[n], 0.8f);
  };
  expect_soft("a steal", suddenness(full_pool, [] { device.note_on(99, 620.0f, 0.8f); }));
  expect_soft("a steal at Ears 0", suddenness(
                                       [&] {
                                         device.set_param(p::kEars, 0.0f);
                                         full_pool();
                                       },
                                       [] { device.note_on(99, 620.0f, 0.8f); }));
  expect_soft("a steal in Cross", suddenness(
                                      [&] {
                                        device.set_param(p::kLayout, 1.0f);
                                        full_pool();
                                      },
                                      [] { device.note_on(99, 620.0f, 0.8f); }));
  expect_soft("a key struck again harder", suddenness([] { device.note_on(1, 220.0f, 0.2f); }, [] { device.note_on(1, 220.0f, 1.0f); }));
  expect_soft("a key struck again softer", suddenness([] { device.note_on(1, 220.0f, 1.0f); }, [] { device.note_on(1, 220.0f, 0.2f); }));
  expect_soft("a note id struck again at another pitch",
              suddenness([] { device.note_on(1, 220.0f, 0.8f); }, [] { device.note_on(1, 330.0f, 0.8f); }));
  expect_soft("a note off at the shortest release", suddenness(
                                                        [] {
                                                          device.set_param(p::kRelease, 0.05f);
                                                          three_keys();
                                                        },
                                                        [] { device.note_off(2); }));
  expect_soft("a new key at the shortest attack", suddenness(three_keys, [] { device.note_on(4, 440.0f, 1.0f); }));

  // Every smoothed control thrown from one end to the other, both ways, with
  // three keys and the bed sounding.
  struct Throw {
    const char* what;
    int param;
    float from, to;
  };
  const Throw throws[] = {
      {"Ears thrown to 0", p::kEars, 1.0f, 0.0f},        {"Ears thrown to 1", p::kEars, 0.0f, 1.0f},
      {"Layout thrown to Cross", p::kLayout, 0.0f, 1.0f}, {"Layout thrown to Pair", p::kLayout, 1.0f, 0.0f},
      {"Warmth thrown to 1", p::kWarmth, 0.0f, 1.0f},     {"Warmth thrown to 0", p::kWarmth, 1.0f, 0.0f},
      {"Bed thrown to 1", p::kBed, 0.0f, 1.0f},           {"Bed thrown to 0", p::kBed, 1.0f, 0.0f},
      {"Colour thrown to 1", p::kColour, 0.0f, 1.0f},     {"Colour thrown to 0", p::kColour, 1.0f, 0.0f},
      {"Volume thrown to its top", p::kVolume, -48.0f, 6.0f}, {"Volume thrown to its bottom", p::kVolume, 6.0f, -48.0f},
      {"Beat thrown to 40", p::kBeat, 0.5f, 40.0f},       {"Beat thrown to 0.5", p::kBeat, 40.0f, 0.5f},
  };
  for (const Throw& t : throws) {
    const double value = suddenness(
        [&] {
          device.set_param(p::kBed, 0.5f);
          device.set_param(t.param, t.from);
          three_keys();
        },
        [&] { device.set_param(t.param, t.to); });
    expect_soft(t.what, value);
  }
  // Target and Glide moved while keys sound start the glide at Beat: nothing
  // jumps, because nothing has moved yet.
  const double armed = suddenness(
      [] {
        device.set_param(p::kTarget, 20.0f);
        three_keys();
      },
      [] { device.set_param(p::kGlide, 0.5f); });
  MEASURED("suddenness of Glide moved under held keys: %.4f", armed);
  EXPECT(armed < 0.15, "starting a glide under held keys does not click");
}

// --- a second init ---------------------------------------------------------------------------

// With everything on (Cross, the bed, a glide, steals), init() brings back
// the very same render, whatever was played before it.
static void test_init() {
  auto run = [] {
    device.init(kRate);
    device.set_param(p::kLayout, 1.0f);
    device.set_param(p::kWarmth, 1.0f);
    device.set_param(p::kBed, 0.6f);
    device.set_param(p::kColour, 0.9f);
    device.set_param(p::kTarget, 12.0f);
    device.set_param(p::kGlide, 0.5f);
    device.set_param(p::kAttack, 0.05f);
    for (int n = 0; n < 10; ++n) device.note_on(n, 90.0f + 37.0f * static_cast<float>(n), 0.6f);
    Stereo out = render(device, 1.0f, kRate);
    for (int n = 0; n < 5; ++n) device.note_off(n);
    return concat(out, render(device, 1.0f, kRate));
  };
  const Stereo first = run();
  device.set_param(p::kEars, 0.2f);
  device.set_param(p::kBeat, 17.0f);
  device.note_on(40, 512.0f, 1.0f);
  render(device, 0.371f, kRate);
  const Stereo second = run();
  EXPECT(first.left == second.left && first.right == second.right && peak(first.left) > 0.02,
         "a second init gives the first render again, bit for bit");
}
