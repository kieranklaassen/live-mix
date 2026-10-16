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
static void test_notes();
static void test_same_pitch();
static void test_more_voices();
static void test_smoothing_rates();
static void test_other_rates();

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
  test_notes();
  test_same_pitch();
  test_more_voices();
  test_smoothing_rates();
  test_other_rates();

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
      // (A carrier phase kept in float reads 3e-4 Hz out here; in double, under 1e-7.)
      EXPECT_NEAR(0.5 * (left + right), 440.0, 0.00005, label);
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
  // At every rate: the builder's run was at 48 kHz only.
  for (float rate : kRates) {
    plain(rate);
    device.set_param(p::kLayout, 1.0f);
    device.set_param(p::kBeat, static_cast<float>(beat));
    device.note_on(1, static_cast<float>(key), 0.7f);
    Stereo out = render(device, 12.0f, rate);
    const size_t from = at(1.0, rate), to = at(11.0, rate);
    const double left_beat = beat_hz(out.left, rate, 0.6 * beat, 1.6 * beat, from, to);
    const double right_beat = beat_hz(out.right, rate, 0.6 * beat, 1.6 * beat, from, to);
    MEASURED("Cross at %.0f Hz, Beat 8: the left ear beats at %.4f Hz, the right at %.4f Hz", rate, left_beat, right_beat);
    EXPECT_NEAR(left_beat, beat, 0.01, "in Cross the left ear beats in the air at Beat");
    EXPECT_NEAR(right_beat, beat, 0.01, "in Cross the right ear beats in the air at Beat");

    // The four lines: the left ear has key - B/4 and key + 3B/4, the right ear
    // key - 3B/4 and key + B/4 (the left ear is the higher one, as everywhere).
    const double left_low = line_hz(out.left, rate, key - 4.0, key, from, to);
    const double left_high = line_hz(out.left, rate, key + 4.0, key + 8.0, from, to);
    const double right_low = line_hz(out.right, rate, key - 8.0, key - 4.0, from, to);
    const double right_high = line_hz(out.right, rate, key, key + 4.0, from, to);
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
    const double own = level_at(out.left, key + 0.75 * beat, rate, from, to);
    const double leak = level_at(out.left, key - 0.75 * beat, rate, from, to);
    const double twin = level_at(out.left, key - 0.25 * beat, rate, from, to);
    const double far = level_at(out.right, key - 0.75 * beat, rate, from, to);
    MEASURED("Cross levels: left upper %.5f, left lower %.5f, right lower %.5f, leak %.2e", own, twin, far, leak);
    EXPECT(own > 0.02 && leak < 1.0e-3 * own, "Cross at Ears 1 keeps each ear's pair to that ear");
    EXPECT(std::fabs(db(own / twin)) < 0.1 && std::fabs(db(own / far)) < 0.1, "the four tones of Cross are equally loud");
  }

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
  for (int n = 0; n < 6; ++n) {
    const float rate = kRates[n / 2];
    plain(rate);
    device.note_on(1, static_cast<float>(keys[n % 2]), 0.7f);
    Stereo out = render(device, 5.0f, rate);
    const double left = crossing_hz(out.left, rate, at(0.5, rate), at(4.5, rate));
    const double right = crossing_hz(out.right, rate, at(0.5, rate), at(4.5, rate));
    MEASURED("%.0f Hz: key %.1f Hz sounds at %.3f Hz (left %.3f, right %.3f)", rate, keys[n % 2], 0.5 * (left + right), left, right);
    EXPECT_NEAR(0.5 * (left + right), sounds[n % 2], 0.05, "a key outside 80 Hz to 1 kHz sounds inside it at its pitch class");
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
  // The glide's time is in seconds at every sample rate: half way after half
  // of it, and at Target once it is over.
  for (float rate : kRates) {
    plain(rate);
    device.set_param(p::kBeat, 10.0f);
    device.set_param(p::kTarget, 4.0f);
    device.set_param(p::kGlide, 0.1f);
    device.note_on(1, 440.0f, 0.7f);
    render(device, 3.0f, rate);
    const float half_way = device.meter(0);
    Stereo rest = render(device, 5.0f, rate);
    const double landed = crossing_hz(rest.left, rate, at(3.5, rate), at(4.9, rate)) -
                          crossing_hz(rest.right, rate, at(3.5, rate), at(4.9, rate));
    MEASURED("%.0f Hz: a glide of 6 s is %.4f of the way after 3 s and beats at %.4f Hz after it", rate, half_way, landed);
    EXPECT_NEAR(half_way, 0.5, 0.001, "a glide's time is the same at every sample rate");
    EXPECT_NEAR(landed, 4.0, 0.004, "and it lands on Target at every sample rate");
  }
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
      // The clip itself: 0.990 before it, 0.876 after. Without it the peak is 0.990.
      const float before_clip = 8.0f / std::sqrt(8.0f) * Binaural::kVoiceAmp * livemix::kit::db_to_gain(6.0f);
      EXPECT_NEAR(in_step, livemix::kit::soft_clip(before_clip), 0.002, "the output passes through the soft clip");
      EXPECT(in_step < 0.9, "and the clip bends a peak of 0.99 to under 0.9");
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
  // The scale counts the keys' envelopes, not their gains: two soft keys share
  // the level just as two loud ones do.
  plain();
  device.note_on(1, 220.0f, 0.5f);
  Stereo soft_one = render(device, 3.0f, kRate);
  device.note_on(2, 330.0f, 0.5f);
  Stereo soft_two = render(device, 3.0f, kRate);
  const double soft_drop = db(level_at(soft_two.left, 223.0, kRate, at(1.0), at(3.0)) / level_at(soft_one.left, 223.0, kRate, at(1.0), at(3.0)));
  MEASURED("a key at gain 0.5 beside a second at gain 0.5: %.2f dB", soft_drop);
  EXPECT_NEAR(soft_drop, -3.01, 0.1, "a second key takes 3 dB off the first at a soft touch too");

  // What the descriptions say of level. Warmth holds the peak, so the level
  // (RMS) drops: 3.7 dB at 1. Cross halves each tone: 3.0 dB under Pair, in
  // each ear and in the mono sum.
  double ear_rms[3], mid_rms[3];
  for (int n = 0; n < 3; ++n) {
    plain();
    if (n == 1) device.set_param(p::kWarmth, 1.0f);
    if (n == 2) device.set_param(p::kLayout, 1.0f);
    device.note_on(1, 220.0f, 0.7f);
    Stereo out = render(device, 6.0f, kRate);
    ear_rms[n] = rms(out.left, at(1.0), at(6.0));
    mid_rms[n] = rms(mid(out), at(1.0), at(6.0));
  }
  MEASURED("level of one key: Warmth 1 %.2f dB against Warmth 0; Cross %.2f dB in the ear and %.2f dB in the mono sum against Pair",
           db(ear_rms[1] / ear_rms[0]), db(ear_rms[2] / ear_rms[0]), db(mid_rms[2] / mid_rms[0]));
  EXPECT_NEAR(db(ear_rms[1] / ear_rms[0]), -3.68, 0.2, "Warmth at 1 holds the peak and drops the level by 3.7 dB");
  EXPECT_NEAR(db(ear_rms[2] / ear_rms[0]), -3.01, 0.1, "Cross is 3 dB under Pair in each ear");
  EXPECT_NEAR(db(mid_rms[2] / mid_rms[0]), -3.01, 0.1, "and 3 dB under Pair in the mono sum");

  // The bed rides on top of the tones and is not counted in the scale: near
  // the top of Bed its peaks pass the knee (one key at full gain, Bed 1), and
  // at Bed 0.3 a full chord at full gain stays under it for a minute (at 0.5
  // it touches it: 0.509).
  device.init(kRate);
  device.set_param(p::kBed, 1.0f);
  device.note_on(1, 220.0f, 1.0f);
  const double bed_top = hold_peak(30.0, kRate);
  device.init(kRate);
  device.set_param(p::kBed, 0.3f);
  for (int n = 0; n < Binaural::kVoices; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 5 / 12.0f), 1.0f);
  const double bed_half = hold_peak(60.0, kRate);
  MEASURED("peaks with the bed: one key at Bed 1 %.3f, eight keys at Bed 0.3 %.3f", bed_top, bed_half);
  EXPECT(bed_top > 0.5 && bed_top < 1.0, "at Bed 1 the bed's peaks reach the clip, as Volume's description says");
  EXPECT(bed_half < 0.5, "at Bed 0.3 a full chord at full gain stays under the knee");

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
  // Release moved while a key is held is the release that key gets.
  plain();
  device.set_param(p::kRelease, 10.0f);
  device.note_on(1, 440.0f, 0.7f);
  render(device, 0.5f, kRate);
  device.set_param(p::kRelease, 0.05f);
  device.note_off(1);
  Stereo short_tail = render(device, 0.5f, kRate);
  EXPECT(peak(short_tail.left, 0, at(0.01)) > 0.05 && peak(short_tail.left, at(0.2)) == 0.0,
         "Release moved under a held key is the release it gets");
}

// --- one beat for every key ------------------------------------------------------------------

// The largest sample within two samples of each null of a beat of `beat`
// hertz that began at its crest at sample `origin`, between from and to.
static double worst_null(const std::vector<float>& x, size_t origin, double beat, size_t from, size_t to, double rate = kRate) {
  double worst = 0.0;
  int found = 0;
  for (int k = 0; k < 1000; ++k) {
    const size_t n = origin + static_cast<size_t>((k + 0.5) * rate / beat + 0.5);
    if (n < from + 2) continue;
    if (n + 3 > to || n + 3 > x.size()) break;
    worst = std::max(worst, peak(x, n - 2, n + 3));
    ++found;
  }
  return found >= 3 ? worst : 1.0e9;
}

static void test_together() {
  const double beat = 6.0;
  char label[200];
  // At every rate, in Pair and in Cross (whose mono sum has the same nulls and more).
  for (float rate : kRates) {
    for (int layout = 0; layout < 2; ++layout) {
      if (layout == 1 && rate != kRate) continue;
      const char* name = layout == 1 ? "Cross" : "Pair";
      auto patch = [&] {
        plain(rate);
        device.set_param(p::kEars, 0.0f);
        device.set_param(p::kLayout, static_cast<float>(layout));
      };
      // One key from silence: the beat starts at its crest, so its nulls are a
      // half, one and a half, two and a half beats after the key.
      patch();
      device.note_on(1, 220.0f, 0.7f);
      Stereo one = render(device, 3.0f, rate);
      const double full = peak(one.left);
      const double one_null = worst_null(one.left, 0, beat, at(0.3, rate), at(3.0, rate), rate);
      MEASURED("one key at Ears 0, %s, %.0f Hz: peak %.4f, at the nulls %.2e", name, rate, full, one_null);
      std::snprintf(label, sizeof label, "a key from silence starts on the beat's crest (%s, %.0f Hz)", name, rate);
      EXPECT(peak(one.left, at(0.012, rate), at(0.03, rate)) > 0.7 * full, label);
      std::snprintf(label, sizeof label, "one key's nulls fall where the half-beat clock says (%s, %.0f Hz)", name, rate);
      EXPECT(one_null < 0.005 * full, label);

      // Three keys struck 100 ms apart beat together: the nulls of their sum
      // fall on the same samples as one key's.
      patch();
      device.note_on(1, 220.0f, 0.7f);
      Stereo three = render(device, 0.1f, rate);
      device.note_on(2, 277.18f, 0.7f);
      three = concat(three, render(device, 0.1f, rate));
      device.note_on(3, 329.63f, 0.7f);
      three = concat(three, render(device, 2.8f, rate));
      const double three_null = worst_null(three.left, 0, beat, at(0.5, rate), at(3.0, rate), rate);
      MEASURED("three keys 100 ms apart at Ears 0, %s, %.0f Hz: peak %.4f, at one key's nulls %.2e", name, rate, peak(three.left),
               three_null);
      std::snprintf(label, sizeof label, "three keys struck 100 ms apart share one beat (%s, %.0f Hz)", name, rate);
      EXPECT(three_null < 0.005 * peak(three.left), label);

      // A key after a silence starts the beat again at its crest, wherever the
      // old beat would have been (20.2 beats on).
      device.note_off(1);
      device.note_off(2);
      device.note_off(3);
      Stereo gap = render(device, 0.37f, rate);
      device.process(13);
      EXPECT(peak(gap.left, at(0.2, rate)) == 0.0, "the gap is silent");
      device.note_on(4, 220.0f, 0.7f);
      Stereo after = render(device, 2.0f, rate);
      const double after_null = worst_null(after.left, 0, beat, at(0.3, rate), at(2.0, rate), rate);
      MEASURED("a key after a silence, %s, %.0f Hz: at the nulls counted from that key %.2e", name, rate, after_null);
      std::snprintf(label, sizeof label, "a key from silence restarts the beat at its crest (%s, %.0f Hz)", name, rate);
      EXPECT(peak(after.left, at(0.012, rate), at(0.03, rate)) > 0.7 * full && after_null < 0.005 * full, label);
    }
  }
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

  // Ears does not narrow the bed (its description says so): at Ears 0 the
  // tones are one in both ears and the bed is still two unlike noises.
  {
    Stereo tones;
    Stereo bed = bed_alone(
        kRate, 1.0f, 0.6f,
        [&] {
          device.set_param(p::kEars, 0.0f);
          device.note_on(1, 220.0f, 0.5f);
          return render(device, 10.0f, kRate);
        },
        &tones);
    const double width = db(rms(side(bed), at(2.0)) / rms(mid(bed), at(2.0)));
    MEASURED("at Ears 0 the bed's side over mid is %.2f dB and its sides correlate %.3f", width, correlation(bed.left, bed.right, at(2.0)));
    EXPECT(tones.left == tones.right && std::fabs(width) < 1.0 && std::fabs(correlation(bed.left, bed.right, at(2.0))) < 0.05,
           "Ears at 0 leaves the bed as wide as it was");
  }

  // Volume turns the bed down with the tones: at -12 dB the whole output,
  // half of it bed, is 12 dB down.
  {
    double whole[2];
    for (int n = 0; n < 2; ++n) {
      plain();
      device.set_param(p::kBed, 1.0f);
      device.set_param(p::kVolume, n == 0 ? 0.0f : -12.0f);
      device.note_on(1, 220.0f, 0.5f);
      Stereo out = render(device, 6.0f, kRate);
      whole[n] = rms(out.left, at(1.0), at(6.0));
    }
    MEASURED("tone and bed at Volume -12 dB: %.2f dB against Volume 0", db(whole[1] / whole[0]));
    EXPECT_NEAR(db(whole[1] / whole[0]), -12.0, 0.1, "Volume turns the bed down with the tones");
  }

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

  // A full pool whose first key is far softer than the rest, and two more
  // keys in one block: the first takes the soft voice and waits in it, and
  // the second must take another, not the one a key already waits in.
  plain();
  device.set_param(p::kRelease, 3.0f);
  for (int n = 0; n < 8; ++n) device.note_on(n, kChord[n], n == 0 ? 0.1f : 0.8f);
  render(device, 1.0f, kRate);
  device.note_on(98, 620.0f, 0.8f);
  device.note_on(99, 790.0f, 0.8f);
  Stereo uneven = render(device, 0.6f, kRate);
  const double waited = level_at(uneven.left, 623.0, kRate, at(0.2), at(0.6));
  const double other = level_at(uneven.left, 793.0, kRate, at(0.2), at(0.6));
  MEASURED("two keys into a full pool with one soft voice: %.4f and %.4f", waited, other);
  EXPECT(waited > 0.02 && other > 0.02, "a voice a key waits in is not stolen again");

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

  // A key struck twice while the voice it took still fades for it, first
  // soft at one pitch, then loud at another: the note that waits is the
  // second strike, its pitch and its level, as a key struck once plays it.
  {
    double level[2], other = 0.0;
    for (int pass = 0; pass < 2; ++pass) {
      hold_chord(8, 0.05f);
      render(device, 1.0f, kRate);
      if (pass == 1) device.note_on(99, 790.0f, 0.2f);
      device.note_on(99, 620.0f, 0.8f);
      Stereo out = render(device, 0.6f, kRate);
      level[pass] = level_at(out.left, 623.0, kRate, at(0.2), at(0.6));
      if (pass == 1) other = level_at(out.left, 793.0, kRate, at(0.2), at(0.6));
    }
    MEASURED("a key struck twice into a full pool, soft at 790 Hz and then loud at 620 Hz: %.4f of one strike at 620 Hz, %.5f of it left at 790 Hz",
             level[1] / level[0], other / level[0]);
    EXPECT(level[0] > 0.02 && std::fabs(level[1] / level[0] - 1.0) < 0.02 && other < 0.02 * level[0],
           "a key struck twice into a full pool plays as its second strike says, its pitch and its level");
  }

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

// The phrase of the block-size check: two keys, a silence with every control moved 10 ms before
// its end, a third key, more controls moved while it sounds; a glide runs through all of it.
static Stereo silence_phrase(float rate, int block, float silence) {
  device.init(rate);
  device.set_param(p::kRelease, 0.05f);
  device.set_param(p::kAttack, 0.01f);
  device.set_param(p::kBed, 0.4f);
  device.set_param(p::kBeat, 5.0f);
  device.set_param(p::kTarget, 9.0f);
  device.set_param(p::kGlide, 0.05f);
  Stereo out;
  auto run_for = [&](float seconds) { out = concat(out, render_blocks(device, seconds, rate, block)); };
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
}

static void test_silences() {
  // The output does not depend on the block size, across silences of every
  // length around the moment the device falls idle (which block that is
  // depends on the block size) and one long after it. Controls are moved in
  // the silence, 10 ms before the next key; a glide runs through all of it.
  auto phrase = [](int block, float silence) { return silence_phrase(kRate, block, silence); };
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
static double suddenness(Setup setup, Event event, float rate = kRate) {
  double worst = -1.0;
  // "8 samples" is a sixth of a millisecond: as many samples as that is at this rate.
  const size_t first = static_cast<size_t>(8.0f * rate / 48000.0f + 0.5f);
  for (int trial = 0; trial < 8; ++trial) {
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      device.init(rate);
      device.set_param(p::kAttack, 0.01f);
      setup();
      render(device, 0.6f + 0.0237f * static_cast<float>(trial), rate);
      if (pass == 0) event();
      out[pass] = render(device, 0.02f, rate);
    }
    double early = 0.0, whole = 0.0;
    for (size_t i = 0; i < out[0].size(); ++i) {
      const double difference = std::max(std::fabs(static_cast<double>(out[0].left[i]) - out[1].left[i]),
                                         std::fabs(static_cast<double>(out[0].right[i]) - out[1].right[i]));
      if (i < first) early = std::max(early, difference);
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
  auto expect_soft = [&](const char* what, double value, double limit = 0.15) {
    MEASURED("suddenness of %s: %.4f", what, value);
    std::snprintf(label, sizeof label, "%s does not click (%.4f of it is there within 8 samples, limit %.3f)", what, value, limit);
    EXPECT(value >= 0.0 && value < limit, label);
  };
  // A steal is held far tighter than the rest: the raised-cosine fade of 5 ms reads 0.002 here, one
  // of 2 ms 0.009, a straight line of 5 ms 0.017 and one of 1 ms 0.035.
  const double steal_limit = 0.006;
  auto full_pool = [] {
    for (int n = 0; n < Binaural::kVoices; ++n) device.note_on(n, kChord[n], 0.8f);
  };
  expect_soft("a steal", suddenness(full_pool, [] { device.note_on(99, 620.0f, 0.8f); }), steal_limit);
  expect_soft("a steal at Ears 0", suddenness(
                                       [&] {
                                         device.set_param(p::kEars, 0.0f);
                                         full_pool();
                                       },
                                       [] { device.note_on(99, 620.0f, 0.8f); }),
              steal_limit);
  expect_soft("a steal in Cross", suddenness(
                                      [&] {
                                        device.set_param(p::kLayout, 1.0f);
                                        full_pool();
                                      },
                                      [] { device.note_on(99, 620.0f, 0.8f); }),
              steal_limit);
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

// --- what a key may be -----------------------------------------------------------------------

// The note clamp and the gain clamp, asserted directly: the conformance pass
// only asks that absurd notes stay finite.
static void test_notes() {
  // A frequency that is not a number is not a key.
  plain();
  device.note_on(1, std::nanf(""), 0.8f);
  Stereo none = render(device, 0.3f, kRate);
  EXPECT(peak(none.left) == 0.0 && peak(none.right) == 0.0, "a key whose frequency is not a number makes no sound");
  // An infinite one is held to the top of the keyboard before it is folded
  // (unheld, the fold would never come back), and so are 1e30 and a negative.
  const float absurd[4] = {INFINITY, 1.0e30f, -INFINITY, -440.0f};
  const double sounds[4] = {750.0, 750.0, 128.0, 128.0};  // 12 kHz and 8 Hz, folded
  for (int n = 0; n < 4; ++n) {
    plain();
    device.note_on(1, absurd[n], 0.7f);
    Stereo out = render(device, 3.0f, kRate);
    const double centre = 0.5 * (crossing_hz(out.left, kRate, at(0.5), at(2.5)) + crossing_hz(out.right, kRate, at(0.5), at(2.5)));
    MEASURED("a key of %g Hz sounds at %.3f Hz", static_cast<double>(absurd[n]), centre);
    EXPECT_NEAR(centre, sounds[n], 0.01, "an absurd frequency is held to 8 Hz to 12 kHz and folded like any key");
  }
  // Gain is held to 0..1: 5 is as loud as 1, and under 0 is silent.
  double levels[3];
  const float gains[3] = {1.0f, 5.0f, -1.0f};
  for (int n = 0; n < 3; ++n) {
    plain();
    device.note_on(1, 220.0f, gains[n]);
    Stereo out = render(device, 1.0f, kRate);
    levels[n] = level_at(out.left, 223.0, kRate, at(0.3), at(1.0));
  }
  MEASURED("a key at gain 1 %.5f, at gain 5 %.5f, at gain -1 %.2e", levels[0], levels[1], levels[2]);
  EXPECT_NEAR(levels[1], levels[0], 1.0e-5, "a gain over 1 is held to 1");
  EXPECT(levels[2] == 0.0, "a gain under 0 is silent");
  // A gain that is not a number is a key at half gain, and nothing breaks.
  plain();
  device.note_on(1, 220.0f, std::nanf(""));
  Stereo odd = render(device, 1.0f, kRate);
  bool finite = true;
  for (size_t i = 0; i < odd.size(); ++i) finite = finite && std::isfinite(odd.left[i]) && std::isfinite(odd.right[i]);
  const double odd_level = finite ? level_at(odd.left, 223.0, kRate, at(0.3), at(1.0)) : -1.0;
  MEASURED("a key whose gain is not a number: %.5f (half gain is %.5f)", odd_level, 0.5 * levels[0]);
  EXPECT(finite, "a key whose gain is not a number leaves the output finite");
  EXPECT_NEAR(odd_level, 0.5 * levels[0], 1.0e-4, "and sounds at half gain");
}

// --- two keys on one pitch -------------------------------------------------------------------

// Keys an octave apart can fold onto one pitch (A1 and A2 both sound 110 Hz).
// The second joins the first's carrier, so the two add in step whenever they
// are struck: 3.0 dB over one key (two in step, scaled by the root of two).
// Started at phase 0 instead, a second key half a cycle late cancels the
// first by 54 dB.
static void test_same_pitch() {
  char label[200];
  plain();
  device.note_on(1, 110.0f, 0.8f);
  Stereo alone = render(device, 3.2f, kRate);
  const double one = rms(alone.left, at(1.0), at(3.0));
  double low = 1.0e9, high = -1.0e9;
  for (int step = 0; step <= 8; ++step) {
    plain();
    device.note_on(1, 110.0f, 0.8f);
    // 100 ms on, then the other key from 0 to 1 cycle of 110 Hz later.
    device.process(static_cast<int>(step * kRate / 110.0f / 8.0f + 0.5f));
    render(device, 0.1f, kRate);
    device.note_on(2, 55.0f, 0.8f);
    Stereo two = render(device, 3.0f, kRate);
    const double level = db(rms(two.left, at(1.0), at(3.0)) / one);
    low = std::min(low, level);
    high = std::max(high, level);
  }
  MEASURED("A1 struck over A2, an eighth of a cycle apart each time: from %.2f to %.2f dB against one key", low, high);
  std::snprintf(label, sizeof label, "two keys on one pitch add in step whenever they are struck (%.2f to %.2f dB over one)", low, high);
  EXPECT(low > 2.9 && high < 3.1, label);

  // The same when the second key has to wait in a stolen voice: it joins the
  // carrier at the sample it starts, in the middle of a block.
  low = 1.0e9, high = -1.0e9;
  for (int step = 0; step <= 8; ++step) {
    plain();
    device.set_param(p::kRelease, 3.0f);
    for (int n = 0; n < Binaural::kVoices; ++n) device.note_on(n, n == 7 ? 110.0f : 300.0f + 41.0f * static_cast<float>(n), 0.8f);
    device.process(static_cast<int>(step * kRate / 110.0f / 8.0f + 0.5f));
    render(device, 0.5f, kRate);
    Stereo before = render(device, 1.0f, kRate);
    device.note_on(99, 55.0f, 0.8f);  // steals the oldest voice (300 Hz) and waits 5 ms in it
    Stereo after = render(device, 1.5f, kRate);
    // The line at 113 Hz (the left ear's tone): two in step, one of eight voices
    // before and two of eight after, so twice the amplitude.
    const double level = db(level_at(after.left, 113.0, kRate, at(0.5), at(1.5)) / level_at(before.left, 113.0, kRate, 0, at(1.0)));
    low = std::min(low, level);
    high = std::max(high, level);
  }
  MEASURED("the same through a stolen voice: from %.2f to %.2f dB against the one key", low, high);
  std::snprintf(label, sizeof label, "a key that waited in a stolen voice joins the carrier of its pitch too (%.2f to %.2f dB)", low, high);
  EXPECT(low > 5.9 && high < 6.1, label);

  // Only one pitch is one pitch. Keys a hertz apart, and a semitone apart,
  // keep their own: the left ear has a line 3 Hz over each, at the level of
  // one of two keys.
  const float near_keys[2] = {441.0f, 466.16f};
  for (float other : near_keys) {
    plain();
    device.note_on(1, 440.0f, 0.8f);
    device.note_on(2, other, 0.8f);
    Stereo both = render(device, 9.0f, kRate);
    const double first = level_at(both.left, 443.0, kRate, at(1.0), at(9.0));
    const double second = level_at(both.left, static_cast<double>(other) + 3.0, kRate, at(1.0), at(9.0));
    const double want = 0.8 * Binaural::kVoiceAmp / std::sqrt(2.0);
    MEASURED("keys at 440 and %.2f Hz: lines of %.5f and %.5f (one of two keys is %.5f)", static_cast<double>(other), first, second, want);
    std::snprintf(label, sizeof label, "keys at 440 and %.2f Hz each keep their own pitch (%.5f and %.5f, want %.5f)",
                  static_cast<double>(other), first, second, want);
    EXPECT(std::fabs(first - want) < 0.02 * want && std::fabs(second - want) < 0.02 * want, label);
  }
}

// --- more of the voices ----------------------------------------------------------------------

static void test_more_voices() {
  // Stealing goes by level, and level counts the key's gain: the soft key is
  // the fifth of the chord, not the oldest, and it is the one taken first.
  plain();
  device.set_param(p::kRelease, 3.0f);
  for (int n = 0; n < 8; ++n) device.note_on(n, kChord[n], n == 4 ? 0.1f : 0.8f);
  render(device, 1.0f, kRate);
  device.note_on(98, 620.0f, 0.8f);
  Stereo taken = render(device, 0.6f, kRate);
  const double oldest = level_at(taken.left, kChord[0] + 3.0, kRate, at(0.2), at(0.6));
  const double soft = level_at(taken.left, kChord[4] + 3.0, kRate, at(0.2), at(0.6));
  MEASURED("a ninth key with one soft voice in the pool: the oldest key reads %.4f, the soft one %.2e", oldest, soft);
  EXPECT(oldest > 0.02 && soft < 1.0e-4, "the softest held key is the one stolen, not the oldest");

  // A held key struck again plays on: with a slow attack its level does not
  // fall away and swell again (a second voice would start from nothing).
  plain();
  device.set_param(p::kAttack, 2.0f);
  device.note_on(1, 220.0f, 0.7f);
  Stereo swell = render(device, 3.0137f, kRate);
  device.note_on(1, 220.0f, 0.7f);
  Stereo on = render(device, 0.4f, kRate);
  const double was = level_at(swell.left, 223.0, kRate, at(2.6), at(3.0));
  const double is = level_at(on.left, 223.0, kRate, at(0.05), at(0.35));
  MEASURED("a held key struck again at Attack 2 s: %.2f dB against before", db(is / was));
  EXPECT_NEAR(db(is / was), 0.0, 0.1, "a held key struck again keeps sounding in its own voice");

  // A note id struck again at another pitch lets the old voice go: one note
  // off ends everything (an old voice left held would sound for ever).
  plain();
  device.note_on(1, 220.0f, 0.7f);
  render(device, 0.5f, kRate);
  device.note_on(1, 330.0f, 0.7f);
  Stereo moved = render(device, 0.5f, kRate);
  const double old_pitch = level_at(moved.left, 223.0, kRate, at(0.2), at(0.5));
  const double new_pitch = level_at(moved.left, 333.0, kRate, at(0.2), at(0.5));
  MEASURED("a note id moved from 220 to 330 Hz: %.2e at the old pitch, %.4f at the new", old_pitch, new_pitch);
  EXPECT(old_pitch < 1.0e-4 && new_pitch > 0.05, "a note id struck again at another pitch plays the new pitch alone");
  device.note_off(1);
  Stereo over = render(device, 0.5f, kRate);
  EXPECT(peak(over.left, at(0.25)) == 0.0 && peak(over.right, at(0.25)) == 0.0, "and one note off leaves exact silence");

  // The same id at 220, 330 and 220 again inside one block: the third strike
  // must not be handed to the first voice, which is already on its way out.
  plain();
  device.note_on(1, 220.0f, 0.7f);
  render(device, 0.5f, kRate);
  device.note_on(1, 330.0f, 0.7f);
  device.note_on(1, 220.0f, 0.7f);
  Stereo back = render(device, 0.5f, kRate);
  const double first = level_at(back.left, 223.0, kRate, at(0.2), at(0.5));
  const double second = level_at(back.left, 333.0, kRate, at(0.2), at(0.5));
  MEASURED("a note id at 220, 330 and 220 Hz in one block: %.4f at 220 Hz, %.2e at 330 Hz", first, second);
  EXPECT(first > 0.05 && second < 1.0e-4, "a note id that comes back to its first pitch at once sounds that pitch");
  device.note_off(1);
  Stereo done = render(device, 0.5f, kRate);
  EXPECT(peak(done.left, at(0.25)) == 0.0 && peak(done.right, at(0.25)) == 0.0, "and one note off ends it");

  // Nothing of a voice's last key is left in its next: a loud key, a sleep,
  // then a soft key in the same voice is the soft key a fresh device plays.
  auto soft_key = [] {
    device.note_on(7, 330.0f, 0.2f);
    return render(device, 0.5f, kRate);
  };
  plain();
  const Stereo fresh = soft_key();
  plain();
  device.note_on(3, 247.0f, 1.0f);
  render(device, 0.3f, kRate);
  device.note_off(3);
  render(device, 0.6f, kRate);
  const Stereo used = soft_key();
  MEASURED("a soft key in a voice that played a loud one differs from a fresh device's by %.2e", apart(used, fresh));
  EXPECT(apart(used, fresh) < 1.0e-6 && peak(fresh.left) > 0.01, "a voice keeps nothing of its last key");
}

// --- smoothing in seconds --------------------------------------------------------------------

// How far an event has come 5 ms after it: the difference from the same
// render without it over the first 5 ms against the difference over 60 ms.
// With `by_rms` the two are read as RMS over 3 to 7 ms and 40 to 60 ms, for
// an event that brings noise in. The tones are the same wave at every rate
// and the event falls at the same moment, so the figure is one number for
// the device whatever the rate, if its smoothers are timed in seconds: one
// timed in samples covers 0.86 of its way in 5 ms at 96 kHz where 5 ms of
// smoothing covers 0.63.
template <typename Setup, typename Event>
static double covered(float rate, Setup setup, Event event, bool by_rms = false) {
  Stereo out[2];
  for (int pass = 0; pass < 2; ++pass) {
    device.init(rate);
    device.set_param(p::kAttack, 0.01f);
    setup();
    render(device, 0.7f, rate);
    if (pass == 0) event();
    out[pass] = render(device, 0.06f, rate);
  }
  std::vector<float> difference(out[0].size());
  for (size_t i = 0; i < difference.size(); ++i) difference[i] = out[0].left[i] - out[1].left[i];
  if (by_rms) return rms(difference, at(0.003, rate), at(0.007, rate)) / rms(difference, at(0.04, rate), at(0.06, rate));
  return peak(difference, 0, at(0.005, rate)) / peak(difference);
}

static void test_smoothing_rates() {
  char label[200];
  struct Move {
    const char* what;
    int param;
    float from, to;
    bool by_rms;
  };
  const Move moves[] = {{"Ears", p::kEars, 1.0f, 0.0f, false},   {"Layout", p::kLayout, 0.0f, 1.0f, false},
                        {"Warmth", p::kWarmth, 0.0f, 1.0f, false}, {"Volume", p::kVolume, -12.0f, 0.0f, false},
                        {"Bed", p::kBed, 0.0f, 1.0f, true}};
  for (const Move& move : moves) {
    double at_rate[3];
    for (int n = 0; n < 3; ++n) {
      at_rate[n] = covered(
          kRates[n],
          [&] {
            device.set_param(p::kColour, 0.0f);
            device.set_param(move.param, move.from);
            three_keys();
          },
          [&] { device.set_param(move.param, move.to); }, move.by_rms);
    }
    MEASURED("%s thrown: %.3f, %.3f and %.3f of the way after 5 ms at 44.1, 48 and 96 kHz", move.what, at_rate[0], at_rate[1], at_rate[2]);
    std::snprintf(label, sizeof label, "%s is smoothed over the same time at every rate (%.3f, %.3f and %.3f of the way after 5 ms)",
                  move.what, at_rate[0], at_rate[1], at_rate[2]);
    const double limit = move.by_rms ? 0.12 : 0.05;
    EXPECT(std::fabs(at_rate[2] - at_rate[1]) < limit && std::fabs(at_rate[0] - at_rate[1]) < limit && at_rate[1] > 0.08 && at_rate[1] < 0.8, label);
  }
  // Colour follows its knob on the control clock with a time constant of
  // 20 ms: how far the bed has moved 5 to 15 ms after the knob against 80 to
  // 120 ms after it, over eight throws at different moments (one throw reads
  // 0.35 to 0.66, the eight together 0.47 to 0.53). Timed in control ticks
  // of 48 kHz the eight read 0.75 at 96 kHz.
  double colour_at[3];
  for (int n = 0; n < 3; ++n) {
    const float rate = kRates[n];
    double early = 0.0, late = 0.0;
    for (int throw_at = 0; throw_at < 8; ++throw_at) {
      Stereo out[2];
      for (int pass = 0; pass < 2; ++pass) {
        device.init(rate);
        device.set_param(p::kAttack, 0.01f);
        device.set_param(p::kBed, 1.0f);
        device.set_param(p::kColour, 0.0f);
        device.note_on(1, 220.0f, 1.0f);
        render(device, 0.5f + 0.13f * static_cast<float>(throw_at), rate);
        if (pass == 0) device.set_param(p::kColour, 1.0f);
        out[pass] = render(device, 0.12f, rate);
      }
      std::vector<float> difference(out[0].size());
      for (size_t i = 0; i < difference.size(); ++i) difference[i] = out[0].left[i] - out[1].left[i];
      const double a = rms(difference, at(0.005, rate), at(0.015, rate));
      const double b = rms(difference, at(0.08, rate), at(0.12, rate));
      early += a * a;
      late += b * b;
    }
    colour_at[n] = std::sqrt(early / late);
  }
  MEASURED("Colour thrown: %.3f, %.3f and %.3f of the way 5 to 15 ms after it", colour_at[0], colour_at[1], colour_at[2]);
  std::snprintf(label, sizeof label, "Colour follows its knob over the same time at every rate (%.3f, %.3f and %.3f of the way after 10 ms)",
                colour_at[0], colour_at[1], colour_at[2]);
  EXPECT(std::fabs(colour_at[2] - colour_at[1]) < 0.13 && std::fabs(colour_at[0] - colour_at[1]) < 0.13 && colour_at[1] > 0.2 && colour_at[1] < 0.8, label);

  // A key's gain, moved by striking it again, is smoothed the same way.
  double gain_at[3];
  for (int n = 0; n < 3; ++n) {
    gain_at[n] = covered(kRates[n], [] { device.note_on(1, 220.0f, 1.0f); }, [] { device.note_on(1, 220.0f, 0.2f); });
  }
  MEASURED("a key struck again softer: %.3f, %.3f and %.3f of the way after 5 ms", gain_at[0], gain_at[1], gain_at[2]);
  EXPECT(std::fabs(gain_at[2] - gain_at[1]) < 0.05 && std::fabs(gain_at[0] - gain_at[1]) < 0.05 && gain_at[1] > 0.3 && gain_at[1] < 0.8,
         "a key's gain is smoothed over the same time at every rate");
}

// --- sleep, voices and clicks at 44.1 and 96 kHz ---------------------------------------------

static void test_other_rates() {
  char label[200];
  for (float rate : {44100.0f, 96000.0f}) {
    // Block size across silences on both sides of falling idle, and a long one.
    double worst = 0.0;
    for (float silence : {0.12f, 0.20f, 0.26f, 1.3f}) {
      const Stereo reference = silence_phrase(rate, 128, silence);
      for (int block : {0, 2048}) worst = std::max(worst, apart(silence_phrase(rate, block, silence), reference));
    }
    std::snprintf(label, sizeof label, "at %.0f Hz the output does not depend on block size across a silence (worst %g)", rate, worst);
    EXPECT(worst < 1.0e-6, label);

    // Knobs moved while it sleeps, asleep off the beat of its control clock.
    auto moved = [] {
      device.set_param(p::kEars, 0.6f);
      device.set_param(p::kWarmth, 0.5f);
      device.set_param(p::kBed, 0.9f);
      device.set_param(p::kColour, 0.8f);
      device.set_param(p::kLayout, 1.0f);
      device.set_param(p::kVolume, 3.0f);
      device.set_param(p::kBeat, 11.0f);
    };
    device.init(rate);
    device.set_param(p::kAttack, 0.01f);
    device.set_param(p::kRelease, 0.05f);
    device.set_param(p::kBed, 0.3f);
    for (int n = 0; n < Binaural::kVoices; ++n) device.note_on(n, kChord[n] * 1.17f, 0.9f);
    render(device, 0.3f, rate);
    device.process(7);
    for (int n = 0; n < Binaural::kVoices; ++n) device.note_off(n);
    Stereo quiet = render(device, 1.0f, rate);
    moved();
    device.note_on(2, 330.0f, 0.4f);
    Stereo after_sleep = render(device, 1.0f, rate);
    device.init(rate);
    device.set_param(p::kAttack, 0.01f);
    device.set_param(p::kRelease, 0.05f);
    moved();
    device.note_on(2, 330.0f, 0.4f);
    Stereo from_start = render(device, 1.0f, rate);
    std::snprintf(label, sizeof label, "at %.0f Hz knobs moved while the device sleeps are there at the next key (differs by %g)", rate,
                  apart(after_sleep, from_start));
    EXPECT(peak(quiet.left, at(0.5, rate)) == 0.0 && apart(after_sleep, from_start) < 1.0e-6 && peak(from_start.left) > 0.02, label);

    // Voices: two keys into a full pool, and a key struck twice with tied levels.
    plain(rate);
    for (int n = 0; n < 8; ++n) device.note_on(n, kChord[n], 0.8f);
    render(device, 3.0f, rate);
    device.note_on(98, 620.0f, 0.8f);
    device.note_on(99, 790.0f, 0.8f);
    device.note_on(99, 790.0f, 0.8f);
    Stereo both = render(device, 0.6f, rate);
    const double first = level_at(both.left, 623.0, rate, at(0.2, rate), at(0.6, rate));
    const double second = level_at(both.left, 793.0, rate, at(0.2, rate), at(0.6, rate));
    const double third_of_chord = level_at(both.left, kChord[2] + 3.0, rate, at(0.2, rate), at(0.6, rate));
    for (int n = 0; n < 8; ++n) device.note_off(n);
    device.note_off(98);
    device.note_off(99);
    Stereo rest = render(device, 1.0f, rate);
    std::snprintf(label, sizeof label, "at %.0f Hz two keys into a full pool, one of them struck twice, take two voices and end (%.4f, %.4f, %.4f)",
                  rate, first, second, third_of_chord);
    EXPECT(first > 0.02 && second > 0.02 && third_of_chord > 0.02 && peak(rest.left, at(0.3, rate)) == 0.0 &&
               peak(rest.right, at(0.3, rate)) == 0.0,
           label);

    // Clicks, with the first sixth of a millisecond counted in this rate's samples.
    auto full_pool = [] {
      for (int n = 0; n < Binaural::kVoices; ++n) device.note_on(n, kChord[n], 0.8f);
    };
    struct Case {
      const char* what;
      double value, limit;
    };
    const Case cases[] = {
        {"a steal", suddenness(full_pool, [] { device.note_on(99, 620.0f, 0.8f); }, rate), 0.006},
        {"a note off at the shortest release", suddenness(
                                                   [] {
                                                     device.set_param(p::kRelease, 0.05f);
                                                     three_keys();
                                                   },
                                                   [] { device.note_off(2); }, rate),
         0.15},
        {"a note id struck again at another pitch",
         suddenness([] { device.note_on(1, 220.0f, 0.8f); }, [] { device.note_on(1, 330.0f, 0.8f); }, rate), 0.15},
        {"Ears thrown to 0", suddenness(three_keys, [] { device.set_param(p::kEars, 0.0f); }, rate), 0.15},
        {"Layout thrown to Cross", suddenness(three_keys, [] { device.set_param(p::kLayout, 1.0f); }, rate), 0.15},
        {"Volume thrown to its top", suddenness(
                                         [] {
                                           device.set_param(p::kVolume, -48.0f);
                                           three_keys();
                                         },
                                         [] { device.set_param(p::kVolume, 6.0f); }, rate),
         0.15},
    };
    for (const Case& c : cases) {
      MEASURED("%.0f Hz: suddenness of %s %.4f", rate, c.what, c.value);
      std::snprintf(label, sizeof label, "at %.0f Hz %s does not click (%.4f, limit %.3f)", rate, c.what, c.value, c.limit);
      EXPECT(c.value >= 0.0 && c.value < c.limit, label);
    }
  }
}
