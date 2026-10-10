// Native harness for Size (cpp/devices/size): the conformance pass, then what makes it what it is. A harmonic
// tone with a known body (a hill at 1 kHz) keeps its partials to the cent while the hill moves by Size's ratio;
// Pitch moves the partials and the hill stays; the level holds at every preset and at the ends of every knob;
// nothing bursts when a knob is moved; the drift runs by the clock through sleep, the same at any block size;
// bad samples are got over; the dry path is a latency late and in step.

#include "../devices/size/size.h"
#include "support/test_kit.h"

#include <algorithm>
#include <cstring>
#include <limits>

using namespace testkit;
using livemix::Size;
namespace p = livemix::size;

static Size device;

static const float kRate = 48000.0f;
static const int kLate = Size::kLatency;

// --- signals ------------------------------------------------------------------------------

// The body the test tone is given: a hill `lift_db` high and `wide` octaves wide (a Gaussian's sigma) at
// `centre` Hz, as a gain.
static double hill(double hz, double centre, double lift_db, double wide) {
  const double octaves = std::log2(hz / centre);
  return std::pow(10.0, lift_db * std::exp(-0.5 * octaves * octaves / (wide * wide)) / 20.0);
}

// A harmonic tone on `f0`: every partial up to `top` Hz at the level the hill gives it, the phases scattered so
// the wave has no spike in it. Peak about `gain`.
static std::vector<float> tone_with_body(double f0, float seconds, double centre, double lift_db, double wide,
                                         float gain, double top = 9000.0) {
  const size_t n = static_cast<size_t>(seconds * kRate);
  std::vector<double> sum(n, 0.0);
  uint32_t seed = 0x1234567u;
  for (int h = 1; h * f0 < top; ++h) {
    seed = seed * 1664525u + 1013904223u;
    const double phase = 2.0 * kPi * (seed >> 8) / 16777216.0;
    const double level = hill(h * f0, centre, lift_db, wide);
    const double step = 2.0 * kPi * h * f0 / kRate;
    for (size_t i = 0; i < n; ++i) sum[i] += level * std::sin(step * static_cast<double>(i) + phase);
  }
  double most = 0.0;
  for (double v : sum) most = std::max(most, std::fabs(v));
  std::vector<float> out(n);
  for (size_t i = 0; i < n; ++i) out[i] = static_cast<float>(gain * sum[i] / most);
  return out;
}

// Where the body of a harmonic tone on `f0` peaks, in Hz: the partial levels between `lo` and `hi`, and a
// parabola through the highest and the two beside it, in dB over octaves.
static double body_peak(const std::vector<float>& x, double f0, double lo, double hi, size_t from, size_t to) {
  int best = 0;
  double best_db = -1.0e9;
  std::vector<double> levels;
  const int first = static_cast<int>(std::ceil(lo / f0));
  const int last = static_cast<int>(std::floor(hi / f0));
  for (int h = first; h <= last; ++h) {
    levels.push_back(db(tone_level(x, h * f0, kRate, from, to)));
    if (levels.back() > best_db) {
      best_db = levels.back();
      best = h;
    }
  }
  if (best == first || best == last) return best * f0;
  const double x0 = std::log2((best - 1) * f0), x1 = std::log2(best * f0), x2 = std::log2((best + 1) * f0);
  const double y0 = levels[best - 1 - first], y1 = levels[best - first], y2 = levels[best + 1 - first];
  // The parabola through three points that are not evenly spaced.
  const double d0 = (y1 - y0) / (x1 - x0), d1 = (y2 - y1) / (x2 - x1);
  const double curve = (d1 - d0) / (x2 - x0);
  if (!(curve < 0.0)) return best * f0;
  const double top = 0.5 * (x0 + x1) - d0 / (2.0 * curve);
  return std::pow(2.0, top);
}

// The frequency of the partial near `hz`: how far its phase (Hann window, `length` samples) turns over `step`
// samples. Right while the partial is within kRate / (2 step) of `hz`: 5 Hz for a step of 4800.
static double partial_hz(const std::vector<float>& x, double hz, size_t from, size_t length = 24000, size_t step = 4800) {
  double phase[2];
  for (int n = 0; n < 2; ++n) {
    double re = 0.0, im = 0.0;
    const size_t start = from + n * step;
    for (size_t i = 0; i < length && start + i < x.size(); ++i) {
      const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(length));
      const double angle = 2.0 * kPi * hz * static_cast<double>(start + i) / kRate;
      re += w * x[start + i] * std::cos(angle);
      im -= w * x[start + i] * std::sin(angle);
    }
    phase[n] = std::atan2(im, re);
  }
  double turned = phase[1] - phase[0];
  turned -= 2.0 * kPi * std::floor(turned / (2.0 * kPi) + 0.5);
  return hz + turned * kRate / (2.0 * kPi * static_cast<double>(step));
}

static const char* const kKnobName[p::kNumParams] = {"size", "pitch", "fine", "detail", "wander",
                                                      "rate", "width", "tone", "mix"};

// A fresh device with some knobs set.
struct Knob {
  int id;
  float value;
};
static void fresh(std::initializer_list<Knob> knobs, float rate = kRate) {
  device.init(rate);
  for (const Knob& knob : knobs) device.set_param(knob.id, knob.value);
}

// The worst difference between two renders, both channels, from `from` on.
static double worst_difference(const Stereo& a, const Stereo& b, size_t from = 0) {
  double worst = 0.0;
  for (size_t i = from; i < a.size() && i < b.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

static void test_conformance() {
  Conformance spec;
  spec.name = "size";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 3.0f;
  spec.max_peak = 2.0f;
  check_effect(device, spec, kRate);
}

// The dry path: at Mix 0 the output is the input a latency late, bit for bit, whatever the other knobs do; with
// Size, Pitch and Tone at nothing the wet sound is the input too, within the transform's own error; and a mono
// input stays mono while the size drifts, as long as Width is 0.
static void test_latency_and_identity() {
  rng_state() = 77;
  const std::vector<float> in = noise(1.5f, kRate, 0.5f);
  fresh({{p::kMix, 0.0f}, {p::kSize, -0.8f}, {p::kPitch, 7.0f}, {p::kWander, 1.0f}, {p::kWidth, 1.0f}});
  Stereo out = run(device, in);
  bool same = true;
  for (size_t i = 0; i + kLate < in.size(); ++i) same = same && out.left[i + kLate] == in[i] && out.right[i + kLate] == in[i];
  bool nothing_before = true;
  for (int i = 0; i < kLate; ++i) nothing_before = nothing_before && out.left[i] == 0.0f;
  EXPECT(same && nothing_before, "mix 0 is the input, 2304 samples late, bit for bit");

  fresh({{p::kSize, 0.0f}});
  out = run(device, in);
  double off = 0.0;
  for (size_t i = 0; i + kLate < in.size(); ++i) off = std::max(off, std::fabs(static_cast<double>(out.left[i + kLate]) - in[i]));
  std::printf("size 0, pitch 0, mix 1: worst difference from the input %.3g\n", off);
  EXPECT(off < 2.0e-6, "size 0 with pitch 0 is the input, a latency late, within 2e-6");

  fresh({{p::kSize, 0.5f}, {p::kWander, 1.0f}, {p::kRate, 2.0f}, {p::kPitch, -5.0f}});
  out = run(device, in);
  EXPECT(out.left == out.right, "mono in is mono out, bit for bit, while the size drifts");
  EXPECT(rms(out.left, 24000) > 0.05, "and it sounds");
}

// What the effect is. A harmonic tone on 110 Hz whose body is a hill at 1 kHz: after Size the partials are
// where they were, to the cent, and the hill has moved by 2^-size.
static void test_size_moves_the_body() {
  const double f0 = 110.0;
  const std::vector<float> in = tone_with_body(f0, 3.0f, 1000.0, 24.0, 0.6, 0.5f);
  const size_t from = 48000, to = 96000;
  EXPECT_NEAR(body_peak(in, f0, 200.0, 5000.0, from, to), 1000.0, 30.0, "the test tone's body peaks at 1 kHz");
  for (float size : {-1.0f, -0.5f, 0.4f, 1.0f}) {
    fresh({{p::kSize, size}});
    const Stereo out = run(device, in);
    const double wanted = 1000.0 * std::pow(2.0, -size);
    const double found = body_peak(out.left, f0, 150.0, 6000.0, from, to);
    // The strongest partials, each within two cents of where it was played.
    double worst_cents = 0.0;
    for (int h = 1; h * f0 < 5000.0; ++h) {
      if (tone_level(out.left, h * f0, kRate, from, to) < 0.003) continue;
      const double hz = partial_hz(out.left, h * f0, from);
      worst_cents = std::max(worst_cents, std::fabs(1200.0 * std::log2(hz / (h * f0))));
    }
    const double level = db(rms(out.left, from, to) / rms(in, from, to));
    std::printf("size %+.2f: the body peaks at %.0f Hz (wanted %.0f, %+.2f octaves off), partials within %.2f cents, level %+.2f dB\n",
                size, found, wanted, std::log2(found / wanted), worst_cents, level);
    char label[120];
    std::snprintf(label, sizeof label, "size %+.2f moves the body's peak by 2^-size, within a sixth of an octave", size);
    EXPECT(std::fabs(std::log2(found / wanted)) < 1.0 / 6.0, label);
    std::snprintf(label, sizeof label, "size %+.2f leaves every partial within 2 cents", size);
    EXPECT(worst_cents < 2.0, label);
    std::snprintf(label, sizeof label, "size %+.2f holds the level within 1 dB", size);
    EXPECT(std::fabs(level) < 1.0, label);
  }
}

// Pitch moves the notes and the body stays: every partial lands on its new frequency within a few cents, and
// the hill is still at 1 kHz.
static void test_pitch_moves_the_notes() {
  const double f0 = 220.0;
  const std::vector<float> in = tone_with_body(f0, 3.0f, 1000.0, 24.0, 0.6, 0.5f);
  const size_t from = 48000, to = 96000;
  for (float pitch : {-12.0f, -5.0f, 3.0f, 7.0f, 12.0f}) {
    fresh({{p::kSize, 0.0f}, {p::kPitch, pitch}});
    const Stereo out = run(device, in);
    const double ratio = std::pow(2.0, pitch / 12.0);
    double worst_cents = 0.0;
    for (int h = 1; h * f0 * ratio < 4000.0; ++h) {
      const double want = h * f0 * ratio;
      if (tone_level(out.left, want, kRate, from, to) < 0.003) continue;
      const double hz = partial_hz(out.left, want, from);
      worst_cents = std::max(worst_cents, std::fabs(1200.0 * std::log2(hz / want)));
    }
    const double found = body_peak(out.left, f0 * ratio, 150.0, 6000.0, from, to);
    const double level = db(rms(out.left, from, to) / rms(in, from, to));
    std::printf("pitch %+.0f: partials within %.2f cents of the new notes, the body peaks at %.0f Hz, level %+.2f dB\n", pitch,
                worst_cents, found, level);
    char label[120];
    std::snprintf(label, sizeof label, "pitch %+.0f puts every partial within 3 cents of its new note", pitch);
    EXPECT(worst_cents < 3.0, label);
    std::snprintf(label, sizeof label, "pitch %+.0f leaves the body's peak within a quarter octave of 1 kHz", pitch);
    EXPECT(std::fabs(std::log2(found / 1000.0)) < 0.25, label);
    std::snprintf(label, sizeof label, "pitch %+.0f holds the level within 2 dB", pitch);
    EXPECT(std::fabs(level) < 2.0, label);
  }
}

// Sines that add up to a peak of about `gain`.
static std::vector<float> chord(float seconds, float gain, std::initializer_list<double> notes, float rate = kRate) {
  std::vector<float> out(static_cast<size_t>(seconds * rate), 0.0f);
  int n = 0;
  for (double hz : notes) {
    for (size_t i = 0; i < out.size(); ++i) {
      out[i] += gain / static_cast<float>(notes.size()) *
                static_cast<float>(std::sin(2.0 * kPi * hz * static_cast<double>(i) / rate + 1.3 * n));
    }
    ++n;
  }
  return out;
}

// Mix. Part way, a held tone is never lost: the wet sound is in phase with the dry one while the notes are not
// moved (a straight fade), and beside it at equal power when they are. Tones over the piano's range.
static void test_mix_part_way() {
  double worst = 0.0, best = 0.0;
  for (double note = 27.5; note < 4200.0; note *= std::pow(2.0, 5.0 / 12.0)) {
    const std::vector<float> in = sine(static_cast<float>(note), 1.5f, kRate, 0.5f);
    fresh({{p::kMix, 0.5f}});
    const Stereo out = run(device, in);
    const double level = db(tone_level(out.left, note, kRate, 36000, 70000) / 0.5);
    worst = std::min(worst, level);
    best = std::max(best, level);
  }
  std::printf("mix 0.5 at the defaults, held tones from A0 to C8: %+.2f to %+.2f dB of the dry tone\n", worst, best);
  EXPECT(worst > -1.0 && best < 1.0, "mix 0.5 keeps every held tone within 1 dB");

  // Notes moved: the played tone at cos(45°), the moved one beside it at about the same.
  const std::vector<float> in = sine(440.0f, 2.0f, kRate, 0.5f);
  fresh({{p::kMix, 0.5f}, {p::kPitch, 7.0f}, {p::kSize, 0.0f}});
  const Stereo out = run(device, in);
  const double dry = db(tone_level(out.left, 440.0, kRate, 48000, 90000) / 0.5);
  const double wet = db(tone_level(out.left, 440.0 * std::pow(2.0, 7.0 / 12.0), kRate, 48000, 90000) / 0.5);
  std::printf("mix 0.5, pitch +7: the played tone at %+.2f dB, the moved one at %+.2f dB\n", dry, wet);
  EXPECT_NEAR(dry, -3.01, 0.1, "with the notes moved, mix 0.5 leaves the played tone at -3 dB");
  EXPECT_NEAR(wet, -3.01, 1.2, "and puts the moved one beside it at about -3 dB");
}

// Fine tunes the notes by cents.
static void test_fine() {
  const std::vector<float> in = sine(440.0f, 2.0f, kRate, 0.5f);
  for (float fine : {-50.0f, 12.0f, 50.0f}) {
    fresh({{p::kSize, 0.0f}, {p::kFine, fine}});
    const Stereo out = run(device, in);
    const double want = 440.0 * std::pow(2.0, fine / 1200.0);
    const double hz = partial_hz(out.left, want, 48000);
    const double level = db(rms(out.left, 48000, 90000) / rms(in, 48000, 90000));
    std::printf("fine %+.0f ct: 440 Hz comes out at %.3f Hz (%+.2f ct off), level %+.2f dB\n", fine, hz,
                1200.0 * std::log2(hz / want), level);
    EXPECT(std::fabs(1200.0 * std::log2(hz / want)) < 1.0, "fine moves a tone by its cents, within one");
    EXPECT(std::fabs(level) < 1.0, "fine holds the level within 1 dB");
  }
}

// Tone tilts the result and leaves its level.
static void test_tone() {
  rng_state() = 5;
  const std::vector<float> in = noise(2.0f, kRate, 0.25f);
  double bright[3];
  int n = 0;
  for (float tone : {-1.0f, 0.0f, 1.0f}) {
    fresh({{p::kSize, 0.0f}, {p::kTone, tone}});
    const Stereo out = run(device, in);
    bright[n++] = energy_above(out.left, 2000.0, kRate, 48000);
    const double level = db(rms(out.left, 48000) / rms(in, 48000));
    std::printf("tone %+.0f: %.3f of the energy above 2 kHz, level %+.2f dB\n", tone, bright[n - 1], level);
    EXPECT(std::fabs(level) < 0.5, "tone leaves the level within 0.5 dB");
  }
  EXPECT(bright[0] < 0.6 * bright[1] && bright[2] > bright[1] + 0.05, "tone down darkens and tone up brightens");

  // The tilt itself, on three tones two octaves apart round its pivot: kTiltDbPerOctave a side, by Tone.
  const std::vector<float> three = chord(2.0f, 0.6f, {250.0, 1000.0, 4000.0});
  for (float tone : {-1.0f, -0.4f, 0.5f, 1.0f}) {
    fresh({{p::kSize, 0.0f}, {p::kTone, tone}});
    const Stereo out = run(device, three);
    const double low = db(tone_level(out.left, 250.0, kRate, 48000, 90000) / tone_level(three, 250.0, kRate, 48000, 90000));
    const double high = db(tone_level(out.left, 4000.0, kRate, 48000, 90000) / tone_level(three, 4000.0, kRate, 48000, 90000));
    std::printf("tone %+.1f: 4 kHz against 250 Hz %+.2f dB (the tilt says %+.2f)\n", tone, high - low,
                4.0 * Size::kTiltDbPerOctave * tone);
    EXPECT_NEAR(high - low, 4.0 * Size::kTiltDbPerOctave * tone, 0.5, "tone tilts by its dB an octave round 1 kHz");
  }
}

// Width: the left side smaller, the right larger, by a quarter octave each; nothing is summed to mono, so an
// input with its sides out of phase comes out as loud and still out of phase.
static void test_width() {
  const double f0 = 110.0;
  const std::vector<float> in = tone_with_body(f0, 2.5f, 1000.0, 24.0, 0.6, 0.5f);
  const size_t from = 48000, to = 96000;
  fresh({{p::kSize, 0.0f}, {p::kWidth, 1.0f}});
  Stereo out = run(device, in);
  const double left = body_peak(out.left, f0, 150.0, 6000.0, from, to);
  const double right = body_peak(out.right, f0, 150.0, 6000.0, from, to);
  std::printf("width 1 at size 0: the body peaks at %.0f Hz on the left and %.0f Hz on the right (%.2f octaves apart)\n",
              left, right, std::log2(left / right));
  EXPECT(left > 1000.0 && right < 1000.0, "width makes the left side smaller and the right larger");
  EXPECT_NEAR(std::log2(left / right), 2.0 * Size::kWidthOctaves, 0.2, "by a quarter octave each");
  EXPECT(correlation(out.left, out.right, from, to) < 0.98, "and the two sides are no longer the same");
  std::vector<float> sum(out.size());
  for (size_t i = 0; i < sum.size(); ++i) sum[i] = 0.5f * (out.left[i] + out.right[i]);
  EXPECT_NEAR(db(rms(sum, from, to) / rms(in, from, to)), 0.0, 1.0, "summed to mono it is as loud as the input");

  std::vector<float> flipped(in.size());
  for (size_t i = 0; i < in.size(); ++i) flipped[i] = -in[i];
  fresh({});
  out = run(device, in, flipped);
  EXPECT_NEAR(db(rms(out.left, from, to) / rms(in, from, to)), 0.0, 0.5, "sides out of phase: the left is as loud as it came");
  EXPECT(correlation(out.left, out.right, from, to) < -0.999, "and the sides are still out of phase");
}

// --- a body that is known --------------------------------------------------------------------------------
//
// To judge the move on more than one hill the test gives the notes a body it knows: hills on a tilt, in dB over
// octaves. After Size by s octaves every partial at f should have the gain body(f 2^s) - body(f), less what the
// level make-up takes off the lot. The fit says how much of that came out: the slope of the gains found against
// the gains wanted (1 is the whole move, 0 is none of it), and the rms of what is left over, in dB.

struct Hill {
  double centre, lift_db, wide;
};
struct Body {
  double tilt_db;  // an octave, about 1 kHz
  std::vector<Hill> hills;
  double at(double hz) const {
    double sum = tilt_db * std::log2(hz / 1000.0);
    for (const Hill& h : hills) {
      const double octaves = std::log2(hz / h.centre);
      sum += h.lift_db * std::exp(-0.5 * octaves * octaves / (h.wide * h.wide));
    }
    return sum;
  }
};

// Notes on `f0s`, every one with the same body: each partial up to `top` Hz at the level the body gives its
// frequency, the phases scattered. Peak about `gain`. `odd_only` leaves the even partials out, as a stopped
// pipe does.
static std::vector<float> notes_with_body(const std::vector<double>& f0s, float seconds, const Body& body, float gain,
                                          double top = 8000.0, bool odd_only = false) {
  const size_t n = static_cast<size_t>(seconds * kRate);
  std::vector<double> sum(n, 0.0);
  uint32_t seed = 0x2468aceu;
  for (double f0 : f0s) {
    for (int h = 1; h * f0 < top; h += odd_only ? 2 : 1) {
      seed = seed * 1664525u + 1013904223u;
      const double phase = 2.0 * kPi * (seed >> 8) / 16777216.0;
      const double level = std::pow(10.0, body.at(h * f0) / 20.0);
      const double step = 2.0 * kPi * h * f0 / kRate;
      for (size_t i = 0; i < n; ++i) sum[i] += level * std::sin(step * static_cast<double>(i) + phase);
    }
  }
  double most = 0.0;
  for (double v : sum) most = std::max(most, std::fabs(v));
  std::vector<float> out(n);
  for (size_t i = 0; i < n; ++i) out[i] = static_cast<float>(gain * sum[i] / most);
  return out;
}

struct Fit {
  double slope = 0.0, miss = 0.0;
  int count = 0;
};
// `in` is the dry sound and `out` the device's, a latency late. Only partials that stand clear of every other
// by 40 Hz are read, only where the body is known on both sides of the move (between the lowest note and
// `top`), and only those within 40 dB of the loudest afterwards.
static Fit fit_of_move(const std::vector<float>& in, const std::vector<float>& out, const std::vector<double>& f0s,
                       const Body& body, double octaves, size_t from, size_t to, double top = 8000.0,
                       bool odd_only = false) {
  std::vector<double> all;
  for (double f0 : f0s) {
    for (int h = 1; h * f0 < top; h += odd_only ? 2 : 1) all.push_back(h * f0);
  }
  const double lowest = *std::min_element(f0s.begin(), f0s.end());
  std::vector<double> want, got, before;
  double loudest = -1.0e9;
  for (double hz : all) {
    bool clear = true;
    for (double other : all) clear = clear && (other == hz || std::fabs(other - hz) > 40.0);
    const double came = hz * std::pow(2.0, octaves);
    if (!clear || came < lowest || came > top) continue;
    const double was = db(tone_level(in, hz, kRate, from, to));
    const double is = db(tone_level(out, hz, kRate, from + kLate, to + kLate));
    want.push_back(std::min(18.0, std::max(-24.0, body.at(came) - body.at(hz))));
    got.push_back(is - was);
    before.push_back(was);
    loudest = std::max(loudest, was + want.back());
  }
  double mean_want = 0.0, mean_got = 0.0;
  Fit fit;
  for (size_t i = 0; i < want.size(); ++i) {
    if (before[i] + want[i] < loudest - 40.0) continue;
    mean_want += want[i];
    mean_got += got[i];
    ++fit.count;
  }
  if (fit.count < 3) return fit;
  mean_want /= fit.count;
  mean_got /= fit.count;
  double sxx = 0.0, sxy = 0.0, see = 0.0;
  for (size_t i = 0; i < want.size(); ++i) {
    if (before[i] + want[i] < loudest - 40.0) continue;
    const double x = want[i] - mean_want, y = got[i] - mean_got;
    sxx += x * x;
    sxy += x * y;
    see += (y - x) * (y - x);
  }
  fit.slope = sxx > 0.0 ? sxy / sxx : 0.0;
  fit.miss = std::sqrt(see / fit.count);
  return fit;
}

// Two hills on a falling tilt, as a struck or bowed thing has, and three narrow ones, as a voice has.
static const Body& plain_body() {
  static const Body body = {-6.0, {{700.0, 14.0, 0.3}, {2400.0, 12.0, 0.25}}};
  return body;
}
static const Body& voice_body() {
  static const Body body = {-9.0, {{600.0, 18.0, 0.2}, {1300.0, 15.0, 0.17}, {2800.0, 14.0, 0.15}}};
  return body;
}

// The body is moved whatever is played, at the knobs as they come: single notes from 110 to 880 Hz and a chord,
// and a voice with Detail turned up for its narrow hills. (A check on one low tone with one hill missed that from 440 Hz up the outline ran over the partials:
// the hill landed up to 0.4 octaves off, and on 880 Hz the gains were 6 dB rms from what was wanted.)
static void test_body_moves_whatever_is_played() {
  struct Played {
    const char* name;
    std::vector<double> f0s;
    const Body* body;
    float detail;
    double least_slope, most_miss;
  };
  const Played played[] = {
      {"a note on 110 Hz", {110.0}, &plain_body(), 0.5f, 0.8, 2.5},
      {"a note on 220 Hz", {220.0}, &plain_body(), 0.5f, 0.8, 2.5},
      {"a note on 440 Hz", {440.0}, &plain_body(), 0.5f, 0.75, 2.5},
      {"a note on 880 Hz", {880.0}, &plain_body(), 0.5f, 0.5, 4.5},
      {"a chord on C4", {261.63, 329.63, 392.0}, &plain_body(), 0.5f, 0.75, 2.5},
      {"a voice on 140 Hz, detail 0.85", {140.0}, &voice_body(), 0.85f, 0.7, 3.5},
  };
  const size_t from = 72000, to = 120000;
  for (const Played& what : played) {
    const std::vector<float> in = notes_with_body(what.f0s, 3.0f, *what.body, 0.5f);
    double slope = 0.0, least = 1.0e9, miss = 0.0;
    for (float size : {-1.0f, -0.5f, 0.5f, 1.0f}) {
      fresh({{p::kSize, size}, {p::kDetail, what.detail}});
      const Stereo out = run(device, in);
      const Fit fit = fit_of_move(in, out.left, what.f0s, *what.body, size, from, to);
      slope += 0.25 * fit.slope;
      least = std::min(least, fit.slope);
      miss = std::max(miss, fit.miss);
    }
    std::printf("%s: of the move wanted, %.2f comes out (least %.2f over four sizes), worst %.1f dB rms off\n", what.name,
                slope, least, miss);
    char label[160];
    std::snprintf(label, sizeof label, "%s: at least %.2f of the body's move comes out", what.name, what.least_slope);
    EXPECT(slope >= what.least_slope, label);
    std::snprintf(label, sizeof label, "%s: the partials land within %.1f dB rms of where the body puts them", what.name,
                  what.most_miss);
    EXPECT(miss <= what.most_miss, label);
  }
}

// Detail is how steep a side of the body the outline will follow: 18 dB an octave at 0, 36 at the middle, 72 at
// 1. Low, only the broad shape is moved, and less of the move comes out on anything. Higher up it is narrow
// hills that tell (a voice's): every quarter of the knob brings them nearer to where the body puts them.
static void test_detail() {
  const size_t from = 72000, to = 120000;
  const std::vector<double> low = {220.0}, voice = {140.0};
  const std::vector<float> note = notes_with_body(low, 3.0f, plain_body(), 0.5f);
  const std::vector<float> sung = notes_with_body(voice, 3.0f, voice_body(), 0.5f);
  double slopes[5], misses[5];
  int n = 0;
  for (float detail : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) {
    fresh({{p::kSize, -0.7f}, {p::kDetail, detail}});
    Stereo out = run(device, note);
    slopes[n] = fit_of_move(note, out.left, low, plain_body(), -0.7, from, to).slope;
    fresh({{p::kSize, -0.7f}, {p::kDetail, detail}});
    out = run(device, sung);
    const Fit fit = fit_of_move(sung, out.left, voice, voice_body(), -0.7, from, to);
    misses[n] = fit.miss;
    std::printf("detail %.2f at size -0.7: %.2f of the move on a 220 Hz note; a voice %.2f of it, %.1f dB rms off\n", detail,
                slopes[n], fit.slope, misses[n]);
    ++n;
  }
  EXPECT(slopes[0] < slopes[2] - 0.15, "low Detail moves the broad shape only: less of the move comes out");
  EXPECT(slopes[1] > slopes[0] + 0.05, "the first quarter of Detail tells on a plain note");
  EXPECT(misses[2] < misses[1] - 0.5, "the second quarter tells on a voice's narrow hills");
  EXPECT(misses[3] < misses[2] - 0.5, "and the third");
  EXPECT(misses[4] < misses[3] - 0.2, "and the last");
  EXPECT(slopes[2] > 0.8, "the middle moves a plain note's body whole");
}

// The level of whatever lies between `lo` and `hi` Hz, read at 40 frequencies through Hann windows a third of a
// second long, so that partials a few hundred Hz below do not leak into it.
static double band_level(const std::vector<float>& x, double lo, double hi, size_t from) {
  double power = 0.0;
  for (int n = 0; n < 40; ++n) {
    const double hz = lo + (hi - lo) * (n + 0.5) / 40.0;
    for (int w = 0; w < 3; ++w) {
      const double level = tone_level(x, hz, kRate, from + w * 16000, from + (w + 1) * 16000);
      power += level * level;
    }
  }
  return std::sqrt(power / 120.0);
}

// Hiss above a dull source. A note whose partials stop at 2.8 kHz, with hiss 60 dB under it: made smaller, the
// body's top comes to stand where only hiss is, and the gain there was the whole 18 dB the outline asked for
// (the hiss between 3.6 and 5.9 kHz came out 15 to 19 dB up). A bin is now lifted in full only where it holds
// something itself, within 42 dB of the loudest: the hiss stays where it was and the note is still moved.
static void test_hiss_is_left_where_it_is() {
  const std::vector<double> f0s = {110.0};
  const std::vector<float> clean = notes_with_body(f0s, 3.0f, plain_body(), 0.25f, 2800.0);
  rng_state() = 4242;
  const std::vector<float> hiss = noise(3.0f, kRate, 3.0e-4f);
  std::vector<float> in = clean;
  for (size_t i = 0; i < in.size(); ++i) in[i] += hiss[i];
  const size_t from = 60000;
  const double before = band_level(in, 3600.0, 5900.0, from);
  struct Setting {
    const char* name;
    float size, detail;
  };
  const Setting settings[] = {{"size -0.4", -0.4f, 0.5f}, {"size -1", -1.0f, 0.5f}, {"size -1, detail 1", -1.0f, 1.0f}};
  for (const Setting& s : settings) {
    fresh({{p::kSize, s.size}, {p::kDetail, s.detail}});
    const Stereo out = run(device, in);
    const double lifted = db(band_level(out.left, 3600.0, 5900.0, from + kLate) / before);
    const Fit fit = fit_of_move(in, out.left, f0s, plain_body(), s.size, from, from + 48000, 2800.0);
    std::printf("%s on a dull note over hiss: the hiss from 3.6 to 5.9 kHz comes out %+.1f dB, %.2f of the note's move\n",
                s.name, lifted, fit.slope);
    char label[120];
    std::snprintf(label, sizeof label, "%s: hiss above the last partial is not lifted by more than 6 dB", s.name);
    EXPECT(lifted < 6.0, label);
    std::snprintf(label, sizeof label, "%s: and the note's own body is still moved", s.name);
    EXPECT(fit.slope > 0.6, label);
  }
}

// A single partial has no body to move: where the moved body is not, it is cut, and the level is made up
// again, so it comes out as it went in. The hiss beside it used to be made up with it: 21 to 24 dB under a
// 3.7 kHz sine made smaller. The make-up is now held back where a bin holds nothing that stands near the
// outline's top, as the lift is.
static void test_hiss_beside_a_single_partial() {
  for (float hz : {1000.0f, 3729.0f}) {
    std::vector<float> in = sine(hz, 3.0f, kRate, 0.25f);
    rng_state() = 99;
    const std::vector<float> hiss = noise(3.0f, kRate, 3.0e-4f);
    for (size_t i = 0; i < in.size(); ++i) in[i] += hiss[i];
    const size_t from = 60000;
    const double low = band_level(in, 200.0, 600.0, from), high = band_level(in, 5000.0, 9000.0, from);
    for (float size : {-1.0f, 1.0f}) {
      fresh({{p::kSize, size}});
      const Stereo out = run(device, in);
      const double tone = db(tone_level(out.left, hz, kRate, from + kLate, from + kLate + 48000) /
                             tone_level(in, hz, kRate, from, from + 48000));
      const double below = db(band_level(out.left, 200.0, 600.0, from + kLate) / low);
      const double above = db(band_level(out.left, 5000.0, 9000.0, from + kLate) / high);
      std::printf("a lone %.0f Hz sine over hiss, size %+.0f: the sine %+.2f dB, the hiss %+.1f dB from 200 to 600 Hz and %+.1f dB "
                  "from 5 to 9 kHz\n", hz, size, tone, below, above);
      char label[120];
      std::snprintf(label, sizeof label, "a lone %.0f Hz sine, size %+.0f: it comes out as it went in, within 0.5 dB", hz, size);
      EXPECT(std::fabs(tone) < 0.5, label);
      std::snprintf(label, sizeof label, "a lone %.0f Hz sine, size %+.0f: the hiss beside it is raised less than 6 dB", hz, size);
      EXPECT(below < 6.0 && above < 6.0, label);
    }
  }
}

// A quiet note is held and a louder one starts over it. The held note's partial is given a new gain, since the
// body is now the two together, and it must come to it without flying past: with a fine outline it used to
// overshoot by 8 dB within 60 ms. The gains are eased over 60 ms now.
static void test_a_held_note_when_another_starts() {
  const Body body = {0.0, {{1000.0, 18.0, 0.35}}};
  std::vector<float> in = notes_with_body({220.0}, 5.0f, body, 0.125f);
  const std::vector<float> loud = notes_with_body({587.33}, 1.0f, body, 0.5f);
  const size_t on = 96000;
  for (size_t i = 0; i < loud.size(); ++i) {
    const float ramp = std::min(1.0f, static_cast<float>(std::min(i, loud.size() - i)) / 240.0f);
    in[on + i] += ramp * loud[i];
  }
  for (float detail : {0.5f, 1.0f}) {
    fresh({{p::kSize, 0.4f}, {p::kDetail, detail}});
    const Stereo out = run(device, in);
    const auto gain_at = [&](int ms) {
      const size_t at = on + static_cast<size_t>(ms * 48);
      return db(tone_level(out.left, 880.0, kRate, at + kLate - 1440, at + kLate + 1440) /
                tone_level(in, 880.0, kRate, at - 1440, at + 1440));
    };
    double most = -1.0e9, settled = 0.0, step = 0.0;
    for (int ms = 0; ms <= 300; ms += 20) {
      most = std::max(most, gain_at(ms));
      step = std::max(step, std::fabs(gain_at(ms) - gain_at(ms - 20)));
    }
    for (int ms = 500; ms <= 700; ms += 20) settled += gain_at(ms) / 11.0;
    std::printf("detail %.1f, a louder note starts: the held 880 Hz partial goes from %+.1f dB to %+.1f, by way of %+.1f; "
                "at most %.1f dB in 20 ms\n", detail, gain_at(-60), settled, most, step);
    char label[120];
    std::snprintf(label, sizeof label, "detail %.1f: the held partial overshoots its new gain by less than 5 dB", detail);
    EXPECT(most - settled < 5.0, label);
    std::snprintf(label, sizeof label, "detail %.1f: and moves by less than 6 dB in 20 ms", detail);
    EXPECT(step < 6.0, label);
    // The quiet note's partials stand under the loud one's, and a fine outline takes that for a valley of the
    // body: it lifts them 15 dB. At the middle of Detail the valley is bridged and they move with the rest.
    if (detail == 0.5f) EXPECT(settled - gain_at(-60) < 10.0, "detail 0.5: the held partial is moved less than 10 dB by the other note");
  }
}

// What comes before a hard start. The work is done in frames 43 ms long, so some of a note is put out before
// it begins: read here in 4 ms windows against the note's own level, so that it is known and does not grow.
static void test_before_a_hard_start() {
  const std::vector<double> f0s = {220.0};
  const std::vector<float> note = notes_with_body(f0s, 1.0f, plain_body(), 0.5f);
  std::vector<float> in(72000, 0.0f);
  const size_t on = 24000;
  for (size_t i = 0; i < note.size(); ++i) in[on + i] = note[i];
  struct Setting {
    const char* name;
    float size, pitch;
    double most_10, most_4;
  };
  const Setting settings[] = {{"size +1", 1.0f, 0.0f, -30.0, -18.0}, {"size -1", -1.0f, 0.0f, -30.0, -18.0},
                              {"pitch -12", 0.0f, -12.0f, -30.0, -18.0}, {"pitch +7", 0.0f, 7.0f, -30.0, -18.0},
                              {"pitch +12", 0.0f, 12.0f, -30.0, -18.0}};
  for (const Setting& s : settings) {
    fresh({{p::kSize, s.size}, {p::kPitch, s.pitch}});
    const Stereo out = run(device, in);
    const size_t at = on + kLate;
    const double held = rms(out.left, at + 9600, at + 33600);
    const double far = db(rms(out.left, at - 576, at - 384) / held);
    const double near = db(rms(out.left, at - 288, at - 96) / held);
    const double first = db(rms(out.left, at, at + 192) / held);
    std::printf("%s, a note with a hard start: %+.1f dB of the note 12 to 8 ms before it, %+.1f dB 6 to 2 ms before, "
                "%+.1f dB in its first 4 ms\n", s.name, far, near, first);
    char label[120];
    std::snprintf(label, sizeof label, "%s: what comes 10 ms before a hard start is under %.0f dB", s.name, s.most_10);
    EXPECT(far < s.most_10, label);
    std::snprintf(label, sizeof label, "%s: and under %.0f dB 4 ms before", s.name, s.most_4);
    EXPECT(near < s.most_4, label);
  }
}

// One block of 64 at a time, with `move(seconds)` called before each: a render while knobs are moved.
template <typename Move>
static Stereo run_moving(const std::vector<float>& in, Move move) {
  Stereo out;
  out.left.resize(in.size());
  out.right.resize(in.size());
  for (size_t done = 0; done < in.size(); done += 64) {
    move(static_cast<double>(done) / kRate);
    const int frames = static_cast<int>(std::min<size_t>(64, in.size() - done));
    for (int i = 0; i < frames; ++i) device.in_left()[i] = device.in_right()[i] = in[done + i];
    device.process(frames);
    for (int i = 0; i < frames; ++i) {
      out.left[done + i] = device.out_left()[i];
      out.right[done + i] = device.out_right()[i];
    }
  }
  return out;
}

// No burst and no click when a knob is moved while a chord sounds. The reference has no event in it: the same
// chord with the knob held at each end and in the middle, and the largest step and peak among those.
static void test_moves_without_clicks() {
  const std::vector<float> in = chord(4.0f, 0.8f, {110.0, 164.81, 220.0, 277.18, 415.3, 659.26, 1318.5});
  struct Sweep {
    const char* name;
    int id;
    float low, middle, high;
    bool jumps;  // a jump from end to end twice a second; else a glide there and back in a second
    float mix = 1.0f;
  };
  const Sweep sweeps[] = {
      {"size swept", p::kSize, -1.0f, 0.0f, 1.0f, false}, {"size jumping", p::kSize, -1.0f, 0.0f, 1.0f, true},
      {"pitch jumping", p::kPitch, -12.0f, 0.0f, 12.0f, true}, {"fine swept", p::kFine, -50.0f, 0.0f, 50.0f, false},
      {"detail jumping", p::kDetail, 0.0f, 0.5f, 1.0f, true}, {"wander jumping", p::kWander, 0.0f, 0.5f, 1.0f, true},
      {"width jumping", p::kWidth, 0.0f, 0.5f, 1.0f, true}, {"tone swept", p::kTone, -1.0f, 0.0f, 1.0f, false},
      {"mix swept", p::kMix, 0.0f, 0.5f, 1.0f, false}, {"mix jumping", p::kMix, 0.0f, 0.5f, 1.0f, true},
      // Part way, the mix changes its law as the notes leave where they were played.
      {"pitch jumping at mix 0.5", p::kPitch, -12.0f, 0.0f, 12.0f, true, 0.5f},
      {"fine swept at mix 0.5", p::kFine, -50.0f, 0.0f, 50.0f, false, 0.5f},
  };
  for (const Sweep& sweep : sweeps) {
    double quiet_step = 0.0, quiet_peak = 0.0;
    for (float held : {sweep.low, sweep.middle, sweep.high}) {
      fresh({{p::kMix, sweep.mix}, {sweep.id, held}});
      const Stereo out = run(device, in);
      quiet_step = std::max(quiet_step, max_step(out.left, 48000));
      quiet_peak = std::max(quiet_peak, peak(out.left, 48000));
    }
    fresh({{p::kMix, sweep.mix}, {sweep.id, sweep.low}});
    const Stereo out = run_moving(in, [&](double t) {
      if (t < 1.0 || t > 3.0) return;
      const double turn = (t - 1.0) - std::floor(t - 1.0);
      const double at = sweep.jumps ? (turn < 0.5 ? 1.0 : 0.0) : 1.0 - std::fabs(2.0 * turn - 1.0);
      device.set_param(sweep.id, sweep.low + static_cast<float>(at) * (sweep.high - sweep.low));
    });
    const double step = max_step(out.left, 48000), top = peak(out.left, 48000);
    char label[160];
    std::snprintf(label, sizeof label, "%s: largest step %.3f against %.3f held still, peak %.2f against %.2f", sweep.name,
                  step, quiet_step, top, quiet_peak);
    std::printf("%s\n", label);
    EXPECT(step < 1.35 * quiet_step && top < 1.35 * quiet_peak, label);
  }
}

// What the display is told of the outline: its readings no lower than its floor, and the floor itself, 60 dB
// under its highest point. On a sine at half of full scale the highest point is the sine, at -6 dB less what
// the window takes off a sine between two bins and the rounding off its top.
static void test_the_outline_reported() {
  fresh({});
  run(device, sine(1000.0f, 1.0f, kRate, 0.5f));
  const float floor = device.meter(3 + Size::kBodyPoints);
  float least = 1.0e9f, most = -1.0e9f;
  for (int point = 0; point < Size::kBodyPoints; ++point) {
    least = std::min(least, device.meter(3 + point));
    most = std::max(most, device.meter(3 + point));
  }
  std::printf("a 1 kHz sine at -6 dB: the outline reads from %.1f to %.1f dB, its floor %.1f dB\n", least, most, floor);
  EXPECT(floor >= most - 60.01f && floor < -65.0f && floor > -70.0f,
         "the floor is reported 60 dB under the outline's highest point");
  EXPECT(least >= floor - 0.01f, "no reading of the outline is lower than its floor");
  EXPECT(most > -14.0f && most <= -5.0f, "and the sine stands in the readings beside it");
}

// The drift runs by the sample clock: the size the device reports is the formula's at every moment, awake or
// asleep and at any block size, and the body is heard where it says.
static void test_wander_runs_by_the_clock() {
  const float rate = 0.5f, size = 0.2f, width = 0.6f;
  auto expected = [&](int side, double seconds, float hz) {
    const double turn = side == 1 ? width * Size::kWidthTurn : 0.0;
    const double drift = Size::kWanderFirst * std::sin(2.0 * kPi * (hz * seconds + turn)) +
                         Size::kWanderSecond * std::sin(2.0 * kPi * (Size::kWanderSlow * hz * seconds + turn));
    const double at = size * Size::kSizeOctaves + Size::kWanderOctaves * drift +
                      (side == 1 ? 1.0 : -1.0) * width * Size::kWidthOctaves;
    return std::max(-1.5, std::min(1.5, at));
  };
  fresh({{p::kWander, 1.0f}, {p::kRate, rate}, {p::kSize, size}, {p::kWidth, width}});
  rng_state() = 3;
  double seconds = 0.0, worst = 0.0;
  auto check = [&] {
    for (int side = 0; side < 2; ++side) worst = std::max(worst, std::fabs(device.meter(side) - expected(side, seconds, rate)));
  };
  run(device, noise(1.7f, kRate, 0.3f));
  seconds += static_cast<size_t>(1.7f * kRate) / kRate;
  check();
  render(device, 7.3f, kRate, 2048);  // it falls asleep in here
  seconds += static_cast<size_t>(7.3f * kRate) / kRate;
  check();
  EXPECT(device.meter(3) == Size::kMeterFloorDb && device.meter(2) == 0.0f, "asleep, the outline reads nothing and the level 0 dB");
  EXPECT(device.meter(3 + Size::kBodyPoints) == Size::kMeterFloorDb, "and its floor reads nothing");
  render(device, 0.31f, kRate, 1);
  seconds += static_cast<size_t>(0.31f * kRate) / kRate;
  check();
  run(device, noise(0.9f, kRate, 0.3f), 37);
  seconds += static_cast<size_t>(0.9f * kRate) / kRate;
  check();
  std::printf("the drift against the clock, awake and asleep, four block sizes: worst %.2g octaves off\n", worst);
  EXPECT(worst < 2.0e-3, "the size reported is the formula's by the sample clock, through silence and sleep");

  // And heard: Rate 0.05 Hz, Wander 1 at Size 0. At 5 s the body is 0.70 octaves larger, at 15 s 0.43 smaller.
  const double f0 = 110.0;
  const std::vector<float> in = tone_with_body(f0, 16.0f, 1000.0, 24.0, 0.6, 0.5f);
  fresh({{p::kWander, 1.0f}, {p::kRate, 0.05f}, {p::kSize, 0.0f}});
  const Stereo out = run(device, in);
  const size_t late = Size::kLatency;
  const double first = body_peak(out.left, f0, 150.0, 6000.0, 5 * 48000 - 12000 + late, 5 * 48000 + 12000 + late);
  const double second = body_peak(out.left, f0, 150.0, 6000.0, 15 * 48000 - 12000 + late, 15 * 48000 + 12000 + late);
  const double want_first = 1000.0 * std::pow(2.0, -Size::kWanderOctaves * (0.65 + 0.35 * std::sin(2.0 * kPi * 0.618034 * 0.25)));
  const double want_second = 1000.0 * std::pow(2.0, -Size::kWanderOctaves * (-0.65 + 0.35 * std::sin(2.0 * kPi * 0.618034 * 0.75)));
  std::printf("wander: the body peaks at %.0f Hz after 5 s (the clock says %.0f) and at %.0f Hz after 15 s (%.0f)\n", first,
              want_first, second, want_second);
  EXPECT(std::fabs(std::log2(first / want_first)) < 0.2 && std::fabs(std::log2(second / want_second)) < 0.2,
         "the body is heard where the drift's clock puts it, within a fifth of an octave");
}

// The same sound at block sizes 1, 37, 128 and 2048 across a silence, with everything that keeps state at
// work (the drift, moved notes, two sides). The silence is stepped across the moment the device falls asleep.
static void test_block_sizes_across_a_silence() {
  double worst = 0.0;
  for (float gap = 0.0f; gap < 0.62f; gap += 0.05f) {
    rng_state() = 99;
    std::vector<float> phrase = noise(0.2f, kRate, 0.5f);
    const std::vector<float> quiet = silence(0.3f + gap, kRate);
    const std::vector<float> again = noise(0.3f, kRate, 0.5f);
    phrase.insert(phrase.end(), quiet.begin(), quiet.end());
    phrase.insert(phrase.end(), again.begin(), again.end());
    Stereo reference;
    for (int block : {128, 1, 2048, 37}) {
      fresh({{p::kWander, 1.0f}, {p::kRate, 2.0f}, {p::kPitch, 3.0f}, {p::kWidth, 0.5f}, {p::kMix, 0.7f}});
      const Stereo render = run(device, phrase, block);
      if (block == 128) {
        reference = render;
        continue;
      }
      worst = std::max(worst, worst_difference(render, reference));
    }
  }
  std::printf("block sizes across a silence: worst difference %.3g\n", worst);
  EXPECT(worst < 1.0e-6, "the same at block sizes 1, 37, 128 and 2048 across a sleep");
}

// The presets of device.json, copied here: keep the two in step.
struct Preset {
  const char* name;
  std::vector<Knob> knobs;
};
static const std::vector<Preset>& presets() {
  static const std::vector<Preset> table = {
      // presets-begin
      {"Larger", {}},
      {"Smaller", {{p::kSize, -0.4f}}},
      {"Giant", {{p::kSize, 1.0f}, {p::kDetail, 0.4f}, {p::kTone, 0.2f}}},
      {"Music box", {{p::kSize, -1.0f}, {p::kDetail, 0.6f}, {p::kTone, -0.15f}}},
      {"Breathing", {{p::kSize, -0.15f}, {p::kWander, 0.7f}, {p::kRate, 0.12f}}},
      {"Slow tide", {{p::kSize, 0.0f}, {p::kWander, 1.0f}, {p::kRate, 0.03f}, {p::kWidth, 0.4f}}},
      {"Wide open", {{p::kSize, 0.15f}, {p::kWidth, 1.0f}, {p::kWander, 0.2f}, {p::kRate, 0.15f}}},
      {"A shade larger", {{p::kSize, 0.3f}, {p::kMix, 0.5f}}},
      {"Octave below", {{p::kSize, 0.0f}, {p::kPitch, -12.0f}}},
      {"Octave above", {{p::kSize, 0.0f}, {p::kPitch, 12.0f}}},
      {"Fifth beside", {{p::kSize, 0.0f}, {p::kPitch, 7.0f}, {p::kMix, 0.5f}}},
      {"Fourth under", {{p::kSize, 0.2f}, {p::kPitch, -5.0f}, {p::kMix, 0.45f}}},
      {"Second player", {{p::kSize, 0.1f}, {p::kFine, 7.0f}, {p::kWidth, 0.5f}, {p::kMix, 0.25f}}},
      {"Wobble", {{p::kSize, 0.0f}, {p::kWander, 0.5f}, {p::kRate, 1.6f}}},
      {"Small and low", {{p::kSize, -0.8f}, {p::kPitch, -12.0f}, {p::kDetail, 0.7f}}},
      {"Large and high", {{p::kSize, 0.8f}, {p::kPitch, 12.0f}, {p::kTone, 0.3f}}},
      // presets-end
  };
  return table;
}
static void load(const std::vector<Knob>& knobs, float rate = kRate) {
  device.init(rate);
  for (const Knob& knob : knobs) device.set_param(knob.id, knob.value);
}

// "Second player" is the dry sound with a copy a few cents sharp beside it. At equal shares the two cancelled
// once a beat on anything that came in mono: a 440 Hz sine fell 20 dB in level every half second. The copy now
// sits 7.7 dB under the dry sound, so a beat is a swell of some 8 dB and never a gap.
static void test_second_player_does_not_cancel() {
  const Preset* preset = nullptr;
  for (const Preset& each : presets()) {
    if (std::strcmp(each.name, "Second player") == 0) preset = &each;
  }
  EXPECT(preset != nullptr, "there is a preset called Second player");
  if (preset == nullptr) return;
  const std::vector<float> in = sine(440.0f, 6.0f, kRate, 0.5f);
  load(preset->knobs);
  const Stereo out = run(device, in);
  double low = 1.0e9, high = -1.0e9;
  for (size_t at = 48000; at + 2400 <= out.size(); at += 600) {
    for (const std::vector<float>* side : {&out.left, &out.right}) {
      const double level = db(rms(*side, at, at + 2400) / rms(in, 0, 48000));
      low = std::min(low, level);
      high = std::max(high, level);
    }
  }
  std::printf("Second player on a 440 Hz sine: the level in 50 ms windows runs from %+.1f to %+.1f dB of the input\n", low,
              high);
  EXPECT(high - low < 9.0, "Second player: a beat is less than 9 dB deep on a mono sine");
  EXPECT(high - low > 3.0, "Second player: and the copy is there, more than 3 dB of beat");
  EXPECT(high < 3.0, "Second player: no more than 3 dB over the input at a beat's top");
}

// Level. A full-scale chord held for a minute at every preset and at both ends of every control: the peak stays
// within 6 dB of the input's, the level within 3 dB of it, and the last ten seconds are no louder than the
// first ten.
static void test_level_holds() {
  const std::vector<float> in = chord(60.0f, 1.0f, {65.41, 98.0, 130.81, 196.0, 261.63, 329.63, 392.0, 523.25, 783.99});
  const double in_peak = peak(in), in_rms = rms(in, 48000);
  std::vector<Preset> cases = presets();
  static char names[2 * p::kNumParams][48];
  for (int id = 0; id < p::kNumParams; ++id) {
    std::snprintf(names[2 * id], sizeof names[0], "%s at its least", kKnobName[id]);
    std::snprintf(names[2 * id + 1], sizeof names[0], "%s at its most", kKnobName[id]);
    cases.push_back({names[2 * id], {{id, p::kParamMin[id]}}});
    cases.push_back({names[2 * id + 1], {{id, p::kParamMax[id]}}});
  }
  cases.push_back({"everything at its most", {}});
  for (int id = 0; id < p::kNumParams; ++id) cases.back().knobs.push_back({id, p::kParamMax[id]});
  cases.push_back({"everything at its least but mix", {{p::kMix, 1.0f}}});
  for (int id = 0; id < p::kNumParams; ++id) {
    if (id != p::kMix) cases.back().knobs.push_back({id, p::kParamMin[id]});
  }
  double highest = -1.0e9, loudest = -1.0e9, quietest = 1.0e9, most_grown = -1.0e9;
  for (const Preset& one : cases) {
    load(one.knobs);
    const Stereo out = run(device, in);
    const double top = db(std::max(peak(out.left), peak(out.right)) / in_peak);
    const double level = db(std::max(rms(out.left, 48000), rms(out.right, 48000)) / in_rms);
    const double low = db(std::min(rms(out.left, 48000), rms(out.right, 48000)) / in_rms);
    const double grown = db(rms(out.left, 50 * 48000, 60 * 48000) / rms(out.left, 48000, 11 * 48000));
    highest = std::max(highest, top);
    loudest = std::max(loudest, level);
    quietest = std::min(quietest, low);
    most_grown = std::max(most_grown, grown);
    char label[200];
    std::snprintf(label, sizeof label, "%s: a full-scale chord for a minute peaks %+.2f dB, level %+.2f/%+.2f dB, grows %+.2f dB",
                  one.name, top, level, low, grown);
    if (top > 3.0 || level > 1.5 || low < -1.5) std::printf("%s\n", label);
    EXPECT(top < 6.0 && level < 3.0 && low > -3.0 && grown < 1.0, label);
  }
  std::printf("a full-scale chord for a minute, %zu settings: peak at most %+.2f dB, level %+.2f to %+.2f dB, grows at most %+.2f dB\n",
              cases.size(), highest, quietest, loudest, most_grown);
}

// Part-way Mix and the presets: held tones over the piano's range through every preset. None is lost. A preset
// that tunes the notes against the dry ones beats, as two players do: it is measured over whole beats.
static void test_held_tones_through_presets() {
  double worst = 0.0, best = 0.0;
  const char* worst_name = "";
  double worst_note = 0.0;
  for (const Preset& one : presets()) {
    double fine = 0.0, mix = 1.0;
    for (const Knob& knob : one.knobs) {
      if (knob.id == p::kFine) fine = knob.value;
      if (knob.id == p::kMix) mix = knob.value;
    }
    for (double note = 27.5; note < 4200.0; note *= std::pow(2.0, 7.0 / 12.0)) {
      double window = 2.0;
      if (fine != 0.0 && mix < 1.0) {
        const double beat = note * std::fabs(std::pow(2.0, fine / 1200.0) - 1.0);
        window = std::ceil(2.0 * beat) / beat;
      }
      const size_t from = 48000, to = from + static_cast<size_t>(window * kRate);
      const std::vector<float> in = sine(static_cast<float>(note), static_cast<float>(window) + 1.1f, kRate, 0.5f);
      load(one.knobs);
      const Stereo out = run(device, in);
      for (const std::vector<float>* side : {&out.left, &out.right}) {
        const double level = db(rms(*side, from, to) / rms(in, from, to));
        if (level < worst) {
          worst = level;
          worst_name = one.name;
          worst_note = note;
        }
        best = std::max(best, level);
      }
    }
  }
  std::printf("held tones from A0 to C8 through every preset: %+.2f to %+.2f dB of the tone played (the lowest: %s at %.1f Hz)\n",
              worst, best, worst_name, worst_note);
  // The lowest key an octave down is 13.75 Hz, under the first bin, where half of it is lost: that is the -3.
  EXPECT(worst > -3.5 && best < 3.0, "no preset loses a held tone by more than 3.5 dB or lifts one by 3, either side");
}

// Bad input: NaN, infinity and 1e30 in the middle of a sound. The output stays finite and in range. With the
// notes where they are, a second later it is the output of a device that never saw them; with the notes moved
// the turned phases keep no memory of where they would have been (they add up frame by frame from whatever
// came), so there it is as loud and as bright as that device, not the same samples.
static void test_bad_input() {
  rng_state() = 41;
  std::vector<float> in = noise(4.0f, kRate, 0.3f);
  const std::vector<float> good = in;
  for (int i = 0; i < 300; ++i) {
    in[60000 + 7 * i] = i % 3 == 0 ? std::nanf("") : i % 3 == 1 ? std::numeric_limits<float>::infinity() : -1.0e30f;
  }
  const size_t after = 60000 + 2100 + 48000;
  for (float pitch : {0.0f, 5.0f}) {
    const std::initializer_list<Knob> knobs = {
        {p::kPitch, pitch}, {p::kWander, 0.5f}, {p::kRate, 1.0f}, {p::kWidth, 0.5f}, {p::kMix, 0.6f}};
    fresh(knobs);
    const Stereo bad = run(device, in);
    fresh(knobs);
    const Stereo clean = run(device, good);
    EXPECT(finite(bad.left) && finite(bad.right), "NaN, infinity and 1e30 samples: the output stays finite");
    EXPECT(peak(bad.left) < 4.0 && peak(bad.right) < 4.0, "and stays in range");
    const double off = worst_difference(bad, clean, after);
    const double level = db(rms(bad.left, after) / rms(clean.left, after));
    const double bright = energy_above(bad.left, 2000.0, kRate, after) - energy_above(clean.left, 2000.0, kRate, after);
    std::printf("bad input, pitch %+.0f: a second after the last bad sample the output is %.3g from a device that never "
                "saw them, level %+.3f dB, the share above 2 kHz %+.4f\n",
                pitch, off, level, bright);
    if (pitch == 0.0f) {
      EXPECT(off < 1.0e-4, "a second after bad input the device sounds as if it had not happened");
    } else {
      EXPECT(std::fabs(level) < 0.3 && std::fabs(bright) < 0.02, "with the notes moved it is as loud and as bright again");
    }
    EXPECT(rms(bad.left, after) > 0.05, "and it is not stuck silent");
  }
}

// It comes to rest. After a sound and a knob moved in the silence that follows, whichever knob and whichever
// way, the device is asleep within its tail and writes zeros; a knob moved while it sleeps does not wake it.
static void test_comes_to_rest() {
  rng_state() = 17;
  const std::vector<float> burst = noise(0.5f, kRate, 0.5f);
  for (int id = 0; id < p::kNumParams; ++id) {
    for (int way = 0; way < 2; ++way) {
      fresh({{p::kWander, 1.0f}, {p::kPitch, 2.0f}, {id, way == 0 ? p::kParamMin[id] : p::kParamMax[id]}});
      run(device, burst);
      render(device, 0.02f, kRate);
      device.set_param(id, way == 0 ? p::kParamMax[id] : p::kParamMin[id]);
      const Stereo tail = render(device, 1.0f, kRate);
      char label[120];
      std::snprintf(label, sizeof label, "%s moved %s in the tail: asleep a second after the sound, writing zeros", kKnobName[id],
                    way == 0 ? "up" : "down");
      EXPECT(device.asleep() && peak(tail.left, 40000) == 0.0 && peak(tail.right, 40000) == 0.0, label);
      device.set_param(id, p::kParamDefault[id]);
      render(device, 0.1f, kRate);
      EXPECT(device.asleep(), "a knob moved while asleep does not wake it");
    }
  }
  // The tail itself: what is in flight when the input stops is a latency and a frame, and then nothing.
  fresh({});
  run(device, burst);
  const Stereo tail = render(device, 1.0f, kRate);
  size_t last = 0;
  for (size_t i = 0; i < tail.size(); ++i) {
    if (tail.left[i] != 0.0f) last = i;
  }
  std::printf("after the input stops the output is silent from sample %zu (a frame and a hop are %d)\n", last + 1,
              Size::Stft::kFrame + Size::Stft::kHop);
  EXPECT(last < 6000, "the tail is over within an eighth of a second");
}

// At 44.1 and 96 kHz the device does the same thing: the same latency in samples, the body moved by the same
// ratio, the notes moved by the same interval, the drift at the same rate in seconds.
static void test_other_rates() {
  for (float rate : {44100.0f, 96000.0f}) {
    const double f0 = 110.0;
    const size_t n = static_cast<size_t>(2.5f * rate);
    std::vector<double> sum(n, 0.0);
    for (int h = 1; h * f0 < 9000.0; ++h) {
      const double level = hill(h * f0, 1000.0, 24.0, 0.6);
      for (size_t i = 0; i < n; ++i) sum[i] += level * std::sin(2.0 * kPi * h * f0 * static_cast<double>(i) / rate + 1.7 * h * h);
    }
    double most = 0.0;
    for (double v : sum) most = std::max(most, std::fabs(v));
    std::vector<float> in(n);
    for (size_t i = 0; i < n; ++i) in[i] = static_cast<float>(0.5 * sum[i] / most);
    const size_t from = static_cast<size_t>(rate), to = static_cast<size_t>(2.0f * rate);

    fresh({{p::kSize, -1.0f}}, rate);
    Stereo out = run(device, in);
    // body_peak and tone_level take kRate: measure by hand at this rate.
    int best = 0;
    double best_level = 0.0;
    for (int h = 2; h * f0 < 6000.0; ++h) {
      const double level = tone_level(out.left, h * f0, rate, from, to);
      if (level > best_level) {
        best_level = level;
        best = h;
      }
    }
    const double level = db(rms(out.left, from, to) / rms(in, from, to));
    std::printf("at %.1f kHz, size -1: the strongest partial is at %.0f Hz (the hill was at 1000), level %+.2f dB\n",
                rate / 1000.0f, best * f0, level);
    EXPECT(best * f0 > 1700.0 && best * f0 < 2300.0, "the body moves an octave at this rate too");
    EXPECT(std::fabs(level) < 1.0, "and the level holds");

    const std::vector<float> tone = sine(440.0f, 2.0f, rate, 0.5f);
    fresh({{p::kSize, 0.0f}, {p::kPitch, 7.0f}}, rate);
    out = run(device, tone);
    const double want = 440.0 * std::pow(2.0, 7.0 / 12.0);
    const double there = db(tone_level(out.left, want, rate, from, to) / 0.5);
    const double left_behind = db(tone_level(out.left, 440.0, rate, from, to) / 0.5);
    std::printf("at %.1f kHz, pitch +7: %+.2f dB at %.1f Hz, %+.1f dB left at 440 Hz\n", rate / 1000.0f, there, want, left_behind);
    EXPECT(there > -1.5 && left_behind < -40.0, "the notes move by the same interval at this rate");

    fresh({{p::kMix, 0.0f}}, rate);
    out = run(device, tone);
    // Bit for bit, but for a sample the kit's transform takes as zero (under its denormal floor: the sine's
    // own zero crossing, -4.95e-16).
    bool same = true;
    for (size_t i = Size::kLatency; i < out.size(); ++i) {
      const float played = tone[i - Size::kLatency];
      same = same && (out.left[i] == played || (std::fabs(played) < 1.0e-15f && out.left[i] == 0.0f));
    }
    EXPECT(same, "mix 0 is the input, a latency late, at this rate");

    fresh({{p::kWander, 1.0f}, {p::kRate, 1.0f}, {p::kSize, 0.0f}}, rate);
    run(device, std::vector<float>(static_cast<size_t>(0.25f * rate), 0.1f));
    EXPECT_NEAR(device.meter(0), Size::kWanderOctaves * (Size::kWanderFirst + Size::kWanderSecond * std::sin(2.0 * kPi * 0.25 * Size::kWanderSlow)),
                0.01, "the drift keeps its rate in seconds at this rate");
  }
}

// Cost. The work comes a frame at a time, every fourth block of 128 on each side (the sides are a block and a
// half apart), so the worst block is told beside the average. The machine is shared, and a block that the
// system interrupts reads as the device's: the same 10 s are timed five times and each block is given the least
// it took, which is the device's own work.
static void cost_of(const char* name, std::initializer_list<Knob> knobs) {
  rng_state() = 123;
  std::vector<float> in = noise(10.0f, kRate, 0.2f);
  const std::vector<float> notes = chord(10.0f, 0.5f, {110.0, 164.81, 220.0, 329.63, 554.37, 880.0});
  for (size_t i = 0; i < in.size(); ++i) in[i] += notes[i];
  std::vector<double> micros(in.size() / 128, 1.0e9);
  for (int pass = 0; pass < 5; ++pass) {
    fresh(knobs);
    for (size_t block = 0; block < micros.size(); ++block) {
      const size_t done = block * 128;
      for (int i = 0; i < 128; ++i) {
        device.in_left()[i] = in[done + i];
        device.in_right()[i] = in[in.size() - 128 - done + i];
      }
      const auto start = std::chrono::steady_clock::now();
      device.process(128);
      const double took = std::chrono::duration<double, std::micro>(std::chrono::steady_clock::now() - start).count();
      micros[block] = std::min(micros[block], took);
    }
  }
  double all = 0.0;
  for (double took : micros) all += took;
  std::sort(micros.begin(), micros.end());
  const double block = 128.0e6 / kRate;  // a block's own length in microseconds
  const double mean = all / static_cast<double>(micros.size());
  const double high = micros[micros.size() * 95 / 100], most = micros.back();
  std::printf("size cost, %s: %.1f us per 128-frame stereo block (%.2f%% of real time); 95th percentile %.1f us (%.2f%%), "
              "the worst block %.1f us (%.2f%%) (native)\n",
              name, mean, 100.0 * mean / block, high, 100.0 * high / block, most, 100.0 * most / block);
}

static void test_cost() {
  cost_of("as it starts", {});
  cost_of("notes moved, drifting, wide, fine detail", {{p::kPitch, 7.0f}, {p::kFine, 20.0f}, {p::kWander, 1.0f},
                                                        {p::kRate, 2.0f}, {p::kWidth, 1.0f}, {p::kDetail, 1.0f},
                                                        {p::kTone, 0.5f}, {p::kMix, 0.5f}});
}

int main() {
  test_conformance();
  test_latency_and_identity();
  test_size_moves_the_body();
  test_body_moves_whatever_is_played();
  test_pitch_moves_the_notes();
  test_mix_part_way();
  test_fine();
  test_tone();
  test_width();
  test_detail();
  test_hiss_is_left_where_it_is();
  test_hiss_beside_a_single_partial();
  test_a_held_note_when_another_starts();
  test_before_a_hard_start();
  test_moves_without_clicks();
  test_the_outline_reported();
  test_wander_runs_by_the_clock();
  test_block_sizes_across_a_silence();
  test_second_player_does_not_cancel();
  test_level_holds();
  test_held_tones_through_presets();
  test_bad_input();
  test_comes_to_rest();
  test_other_rates();
  test_cost();
  return finish("size");
}
