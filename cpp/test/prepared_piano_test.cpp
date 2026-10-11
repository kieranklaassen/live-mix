// Native harness for Prepared Piano (cpp/devices/prepared-piano). The
// conformance pass covers silence, voice stealing under a pile of keys,
// parameter abuse and other sample rates; the rest measures what makes it a
// piano with things between its strings: the plain stretched string at
// Amount 0, what each object does to it (the bolt's moved partials and
// clang, the rubber's thunk, the felt's mute, the paper's buzz), the Mixed
// table, the thud, the hammer and the half-down pedal, then levels, clicks,
// the block size, sleep and cost. Nobody has listened to it: every claim
// here is a number.

#include "../devices/prepared-piano/prepared_piano.h"
#include "support/test_kit.h"

#include <cstring>

using namespace testkit;
using livemix::PreparedPiano;
namespace p = livemix::prepared_piano;

static PreparedPiano device;
static PreparedPiano other;

static const float kRate = 48000.0f;
static const double kC2 = 65.40639, kC3 = 130.8128, kA3 = 220.0, kC4 = 261.6256, kD4 = 293.6648, kA4 = 440.0,
                    kC5 = 523.2511, kC6 = 1046.502;
static char label[320];

// One preparation at one Amount, everything else at its default.
static void fresh(PreparedPiano& d, int preparation, float amount, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kPreparation, static_cast<float>(preparation));
  d.set_param(p::kAmount, amount);
}

// The strings alone: no thud, no rattle, both strings on one pitch, in the
// middle, the tone filter open, unity volume.
static void bare(PreparedPiano& d, int preparation, float amount, float rate = kRate) {
  fresh(d, preparation, amount, rate);
  d.set_param(p::kRattle, 0.0f);
  d.set_param(p::kThud, 0.0f);
  d.set_param(p::kDetune, 0.0f);
  d.set_param(p::kWidth, 0.0f);
  d.set_param(p::kTone, 1.0f);
  d.set_param(p::kVolume, 0.0f);
}

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }
static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }
static double both_peak(const Stereo& s, size_t from = 0, size_t to = SIZE_MAX) {
  return std::max(peak(s.left, from, to), peak(s.right, from, to));
}

// The piano's stretch, stated here on its own: the inharmonicity of the
// string on a key (nearly flat through the bass, rising above middle C) and
// partial n of a stiff string as a multiple of its fundamental.
static double stiffness_of(int key) {
  if (key >= 60) return 3.1e-4 * std::exp(0.075 * (key - 60));
  return std::max(2.0e-4, 2.6e-4 + 0.5e-4 * (key - 21) / 39.0);
}
static double plain_partial(int n, int key) {
  const double b = stiffness_of(key);
  return n * std::sqrt((1.0 + b * n * n) / (1.0 + b));
}
static int key_of(double hz) { return static_cast<int>(std::floor(69.0 + 12.0 * std::log2(hz / 440.0) + 0.5)); }
// How much partial n moves at `position`, and where a bolt of `load` puts it.
static double moves_at(int n, double position) {
  const double s = std::sin(kPi * n * position);
  return s * s;
}
static double bolted(int n, double load, double position) {
  return std::sqrt((1.0 + load * moves_at(1, position)) / (1.0 + load * moves_at(n, position)));
}

// Level of the `hz` component over n samples from `from`: a Hann-windowed
// DFT bin by a rotating phasor (no trig per sample, so scans stay fast).
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

// The frequency of the strongest component within `reach` (a share) of
// `guess`: scan, then narrow the span as the window grows.
static double fine_pitch(const std::vector<float>& x, double rate, double guess, size_t from, size_t to,
                         double reach = 0.01) {
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

// The strongest component between `lo` and `hi` over the whole window, by a
// scan in steps of 2 cents and a fine search around the best.
static double strongest(const std::vector<float>& x, double rate, double lo, double hi, size_t from, size_t to) {
  to = std::min(to, x.size());
  double best = -1.0, best_f = lo;
  for (double hz = lo; hz <= hi; hz *= 1.0011559) {
    const double level = bin_level(x, rate, hz, from, to - from);
    if (level > best) {
      best = level;
      best_f = hz;
    }
  }
  return fine_pitch(x, rate, best_f, from, to, 0.0012);
}

// Ring time (to -60 dB) of the `hz` component between two moments.
static double ring_time(const std::vector<float>& x, double rate, double hz, double t0, double t1, double window) {
  const size_t n = static_cast<size_t>(window * rate);
  const double a = bin_level(x, rate, hz, at(t0, rate), n);
  const double b = bin_level(x, rate, hz, at(t1, rate), n);
  return b < a ? 60.0 * (t1 - t0) / (db(a) - db(b)) : 1.0e9;
}

// RMS of what lies between `lo` and `hi` Hz: four one-pole high-passes and
// four one-pole low-passes (24 dB an octave either side).
static double band_rms(const std::vector<float>& x, double rate, double lo, double hi, size_t from = 0,
                       size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  const double a = std::exp(-2.0 * kPi * lo / rate), b = std::exp(-2.0 * kPi * std::min(hi, 0.45 * rate) / rate);
  double low[4] = {0, 0, 0, 0}, top[4] = {0, 0, 0, 0}, sum = 0.0;
  for (size_t i = 0; i < to; ++i) {
    double v = x[i];
    for (double& stage : low) {
      stage = v + (stage - v) * a;
      v -= stage;
    }
    for (double& stage : top) {
      stage = v + (stage - v) * b;
      v = stage;
    }
    if (i >= from) sum += v * v;
  }
  return to > from ? std::sqrt(sum / static_cast<double>(to - from)) : 0.0;
}

// RMS of what lies between `lo` and `hi` Hz by a spectrum, which reads the
// same at every sample rate: Hann-windowed frames of about 85 ms, half
// overlapped, over [from, to).
static double spectrum_rms(const std::vector<float>& x, double rate, double lo, double hi, size_t from, size_t to) {
  to = std::min(to, x.size());
  size_t n = 1;
  while (static_cast<double>(n) < 0.085 * rate) n <<= 1;
  std::vector<double> re(n), im(n);
  double power = 0.0;
  int frames = 0;
  for (size_t start = from; start + n <= to; start += n / 2) {
    for (size_t i = 0; i < n; ++i) {
      re[i] = x[start + i] * (0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n)));
      im[i] = 0.0;
    }
    for (size_t i = 1, j = 0; i < n; ++i) {  // bit reversal
      size_t bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        std::swap(re[i], re[j]);
        std::swap(im[i], im[j]);
      }
    }
    for (size_t len = 2; len <= n; len <<= 1) {
      const double angle = -2.0 * kPi / static_cast<double>(len);
      for (size_t i = 0; i < n; i += len) {
        for (size_t k = 0; k < len / 2; ++k) {
          const double wr = std::cos(angle * static_cast<double>(k)), wi = std::sin(angle * static_cast<double>(k));
          const double ur = re[i + k], ui = im[i + k];
          const double vr = re[i + k + len / 2] * wr - im[i + k + len / 2] * wi;
          const double vi = re[i + k + len / 2] * wi + im[i + k + len / 2] * wr;
          re[i + k] = ur + vr;
          im[i + k] = ui + vi;
          re[i + k + len / 2] = ur - vr;
          im[i + k + len / 2] = ui - vi;
        }
      }
    }
    for (size_t k = static_cast<size_t>(lo * n / rate); k <= static_cast<size_t>(hi * n / rate) && k < n / 2; ++k) {
      power += 2.0 * (re[k] * re[k] + im[k] * im[k]);
    }
    ++frames;
  }
  // A Hann window passes 3/8 of the power.
  return frames > 0 ? std::sqrt(power / (0.375 * static_cast<double>(n) * static_cast<double>(n) * frames)) : 0.0;
}

static std::vector<float> minus(const std::vector<float>& a, const std::vector<float>& b) {
  std::vector<float> out(std::min(a.size(), b.size()));
  for (size_t i = 0; i < out.size(); ++i) out[i] = a[i] - b[i];
  return out;
}

static double largest_difference(const Stereo& a, const Stereo& b) {
  double worst = 0.0;
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

// Render an exact number of samples in blocks of `block`.
static Stereo render_samples(PreparedPiano& d, size_t count, int block = kBlock) {
  return run(d, std::vector<float>(count, 0.0f), block);
}

// How much of an event is heard in its first 8 samples: the largest
// difference from the same render without the event over those samples,
// against the largest over 20 ms. Something smoothed or faded has gone a
// small part of the way; a jump is there at once. The worst of eight
// moments a little apart, so a jump cannot hide in a zero crossing.
template <typename Setup, typename Event>
static double suddenness(Setup setup, Event event) {
  double worst = 0.0;
  for (int trial = 0; trial < 8; ++trial) {
    Stereo out[2];
    for (int pass = 0; pass < 2; ++pass) {
      setup(device);
      render_samples(device, 14400 + 61 * static_cast<size_t>(trial));
      if (pass == 0) event(device);
      out[pass] = render_samples(device, 960);
    }
    double early = 0.0, whole = 0.0;
    for (size_t i = 0; i < out[0].size(); ++i) {
      const double difference = std::max(std::fabs(static_cast<double>(out[0].left[i]) - out[1].left[i]),
                                         std::fabs(static_cast<double>(out[0].right[i]) - out[1].right[i]));
      if (i < 8) early = std::max(early, difference);
      whole = std::max(whole, difference);
    }
    if (whole > 0.0) worst = std::max(worst, early / whole);
  }
  return worst;
}

// --- The plain string ---------------------------------------------------------------------

// Amount 0 is a piano string whatever the preparation says: every partial
// within 5 cents of the stretched series, and the stretch is really there.
static void test_plain_string() {
  for (int preparation : {PreparedPiano::kMixed, PreparedPiano::kBolts, PreparedPiano::kRubber, PreparedPiano::kFelt, PreparedPiano::kPaper}) {
    double worst = 0.0;
    int counted = 0;
    bool present = true;
    for (double f0 : {110.0, kC4, kC5}) {
      bare(device, preparation, 0.0f);
      device.set_param(p::kHammer, 1.0f);
      device.set_param(p::kDecay, 4.0f);
      device.note_on(1, static_cast<float>(f0), 0.9f);
      Stereo out = render(device, 1.2f, kRate);
      const int key = key_of(f0);
      for (int n = 1; n <= 10; ++n) {
        const double hz = f0 * plain_partial(n, key);
        const double found = fine_pitch(out.left, kRate, hz, 480, out.left.size(), 0.006);
        worst = std::max(worst, std::fabs(cents(found, hz)));
        const double here = bin_level(out.left, kRate, found, 480, out.left.size() - 480);
        const double beside = std::max(bin_level(out.left, kRate, found * 1.03, 480, out.left.size() - 480),
                                       bin_level(out.left, kRate, found / 1.03, 480, out.left.size() - 480));
        present = present && here > 5.0 * beside;
        ++counted;
      }
    }
    std::snprintf(label, sizeof label, "preparation %d at Amount 0: %d partials, worst %.2f cents from the plain stretched string (5)",
                  preparation, counted, worst);
    std::printf("%s\n", label);
    EXPECT(worst < 5.0, label);
    EXPECT(present, "at Amount 0 every one of the first ten partials is there");
  }
  // And the same string: at Amount 0 no object is heard at all, in the
  // partials, the buzz or the level.
  bool same = true;
  Stereo plain;
  for (int preparation = 0; preparation < PreparedPiano::kNumPreparations; ++preparation) {
    fresh(device, preparation, 0.0f);
    device.set_param(p::kRattle, 1.0f);
    device.note_on(1, static_cast<float>(kC4), 1.0f);
    Stereo out = render(device, 1.0f, kRate);
    if (preparation == 0) plain = out;
    same = same && out.left == plain.left && out.right == plain.right;
  }
  EXPECT(same, "at Amount 0 every preparation is the same samples");
  // The stretch itself: partial 8 of middle C sits 16 cents over eight times the fundamental.
  bare(device, PreparedPiano::kBolts, 0.0f);
  device.set_param(p::kHammer, 1.0f);
  device.note_on(1, static_cast<float>(kC4), 0.9f);
  Stereo out = render(device, 1.2f, kRate);
  const double eighth = cents(fine_pitch(out.left, kRate, 8.0 * kC4 * 1.0097, 480, out.left.size(), 0.006), 8.0 * kC4);
  std::snprintf(label, sizeof label, "partial 8 of middle C is %.1f cents over eight times the fundamental (12 to 22)", eighth);
  std::printf("%s\n", label);
  EXPECT(eighth > 12.0 && eighth < 22.0, label);
}

// Tuning: the fundamental is where the key says from 28 Hz to 4.2 kHz at
// three sample rates, at the defaults and under every object.
static void test_tuning() {
  const float rates[3] = {44100.0f, 48000.0f, 96000.0f};
  double worst = 0.0;
  for (float rate : rates) {
    for (double hz : {27.5, 55.0, 110.0, kC4, 880.0, 2093.005, 4186.009}) {
      device.init(rate);  // the default patch
      device.set_param(p::kThud, 0.0f);  // its noise sits on the low fundamentals of the short notes
      device.note_on(1, static_cast<float>(hz), 0.8f);
      Stereo out = render(device, 1.5f, rate);
      const double found = fine_pitch(out.left, rate, hz, at(0.02, rate), out.left.size());
      worst = std::max(worst, std::fabs(cents(found, hz)));
    }
  }
  std::snprintf(label, sizeof label, "the default patch, 27.5 Hz to 4.2 kHz at three rates: fundamental worst %.3f cents off (5)", worst);
  std::printf("%s\n", label);
  EXPECT(worst < 5.0, label);

  worst = 0.0;
  for (float rate : rates) {
    for (int preparation = PreparedPiano::kBolts; preparation <= PreparedPiano::kPaper; ++preparation) {
      for (double hz : {55.0, kC4, 1760.0}) {
        bare(device, preparation, 1.0f, rate);
        device.note_on(1, static_cast<float>(hz), 0.8f);
        Stereo out = render(device, 0.6f, rate);
        const double found = fine_pitch(out.left, rate, hz, at(0.01, rate), out.left.size());
        worst = std::max(worst, std::fabs(cents(found, hz)));
      }
    }
  }
  std::snprintf(label, sizeof label, "every object at Amount 1, three keys at three rates: fundamental worst %.3f cents off (5)", worst);
  std::printf("%s\n", label);
  EXPECT(worst < 5.0, label);

  // Bolts at Amount 0.5 with the strings at their default detune: within 8 cents.
  worst = 0.0;
  for (double hz : {55.0, kA3, kC4, kC5, kC6}) {
    fresh(device, PreparedPiano::kBolts, 0.5f);
    device.note_on(1, static_cast<float>(hz), 0.8f);
    Stereo out = render(device, 1.5f, kRate);
    worst = std::max(worst, std::fabs(cents(fine_pitch(out.left, kRate, hz, at(0.02), out.left.size()), hz)));
  }
  std::snprintf(label, sizeof label, "Bolts at Amount 0.5: fundamental worst %.3f cents off (8)", worst);
  std::printf("%s\n", label);
  EXPECT(worst < 8.0, label);
}

// --- The objects --------------------------------------------------------------------------

// How far the strongest component near partial n of `f0` sits from where the
// plain string has it, in cents (within 320 cents either way).
static double partial_shift(const std::vector<float>& x, double f0, int n, size_t from, size_t to) {
  const double plain = f0 * plain_partial(n, key_of(f0));
  return cents(strongest(x, kRate, plain / 1.2, plain * 1.2, from, to), plain);
}

// Bolts: the prepared string's partials leave the series by how much each
// moves where the bolt sits, the free string stays underneath, and two short
// modes under the note are the clang.
static void test_bolts() {
  const double f0 = kA3;
  auto bolt = [&](float amount, float position) {
    bare(device, PreparedPiano::kBolts, amount);
    device.set_param(p::kPosition, position);
    device.set_param(p::kHammer, 0.8f);
    device.note_on(1, static_cast<float>(f0), 0.9f);
    return render(device, 2.0f, kRate);
  };
  // The second partial at Amount 1: where a load of 0.6 puts it.
  Stereo full = bolt(1.0f, 0.2f);
  const size_t until = at(0.8);  // the bolted partials die sooner than the free string's: measure the start
  const double second = partial_shift(full.left, f0, 2, 4800, until);
  const double expected = cents(bolted(2, 0.6, 0.2), 1.0);
  std::snprintf(label, sizeof label, "Bolts, Amount 1, Position 0.2: the second partial moves %.1f cents (a load of 0.6 gives %.1f; at least 30)",
                second, expected);
  std::printf("%s\n", label);
  EXPECT(std::fabs(second) >= 30.0 && std::fabs(second - expected) < 4.0, label);

  // The piano underneath: the free string's second partial is still where it was.
  const double plain_hz = f0 * plain_partial(2, key_of(f0));
  const double under = db(bin_level(full.left, kRate, plain_hz, 4800, until - 4800) /
                          bin_level(full.left, kRate, plain_hz * bolted(2, 0.6, 0.2), 4800, until - 4800));
  std::snprintf(label, sizeof label, "the free string's second partial is still there, %.1f dB re the bolted one (-12 to 0)", under);
  std::printf("%s\n", label);
  EXPECT(under > -12.0 && under < 0.0, label);

  // A clear pitch at low Amount: the second partial has moved less than 30 cents at 0.25.
  Stereo light = bolt(0.25f, 0.2f);
  const double light_second = partial_shift(light.left, f0, 2, 4800, until);
  std::snprintf(label, sizeof label, "Bolts at Amount 0.25: the second partial is %.1f cents from the plain string (under 30)", light_second);
  std::printf("%s\n", label);
  EXPECT(std::fabs(light_second) < 30.0, label);

  // Position decides which partial moves: at 0.2 the third (an antinode
  // there) and not the fourth; at 0.25 the fourth and not the third.
  const double third_a = partial_shift(full.left, f0, 3, 4800, until);
  const double fourth_a = partial_shift(full.left, f0, 4, 4800, until);
  Stereo quarter = bolt(1.0f, 0.25f);
  const double third_b = partial_shift(quarter.left, f0, 3, 4800, until);
  const double fourth_b = partial_shift(quarter.left, f0, 4, 4800, until);
  std::snprintf(label, sizeof label, "Position 0.2: partial 3 moves %.1f cents, partial 4 %.1f; Position 0.25: partial 3 %.1f, partial 4 %.1f",
                third_a, fourth_a, third_b, fourth_b);
  std::printf("%s\n", label);
  EXPECT(std::fabs(third_a) > 150.0 && std::fabs(fourth_a) < 15.0 && std::fabs(third_b) < 15.0 && std::fabs(fourth_b) > 150.0, label);
  EXPECT(std::fabs(third_a - cents(bolted(3, 0.6, 0.2), 1.0)) < 4.0 && std::fabs(fourth_b - cents(bolted(4, 0.6, 0.25), 1.0)) < 4.0,
         "and each sits where the load puts it");

  // The clang: a mode at 0.58 of the fundamental, there at the strike, gone
  // within a second, and not there without the bolt.
  const double clang_hz = f0 * 0.58;
  const double early = bin_level(full.left, kRate, clang_hz, 0, 4800);
  const double late = bin_level(full.left, kRate, clang_hz, 38400, 4800);
  Stereo none = bolt(0.0f, 0.2f);
  const double without = bin_level(none.left, kRate, clang_hz, 0, 4800);
  const double fundamental = bin_level(full.left, kRate, f0, 0, 4800);
  std::snprintf(label, sizeof label, "the clang at 0.58 f: %.1f dB re the fundamental at the strike, %.1f dB lower 0.8 s on, %.1f dB lower with no bolt",
                db(early / fundamental), db(early / late), db(early / without));
  std::printf("%s\n", label);
  EXPECT(db(early / fundamental) > -20.0 && db(early / late) > 40.0 && db(early / without) > 20.0, label);
}

// Rubber: a pitched thunk. It is over in half a second where the plain
// string rings for seconds, and the partials that move at the rubber go first.
static void test_rubber() {
  auto strike = [&](int preparation, float amount, float position) {
    bare(device, preparation, amount);
    device.set_param(p::kPosition, position);
    device.set_param(p::kHammer, 0.8f);
    device.note_on(1, static_cast<float>(kC4), 0.9f);
    return render(device, 2.5f, kRate);
  };
  Stereo plain = strike(PreparedPiano::kRubber, 0.0f, 0.2f);
  Stereo rubber = strike(PreparedPiano::kRubber, 1.0f, 0.2f);
  const double plain_ring = ring_time(plain.left, kRate, kC4, 0.1, 1.6, 0.2);
  const double rubber_ring = ring_time(rubber.left, kRate, kC4, 0.02, 0.2, 0.05);
  // The whole sound, not only the fundamental: how far it has fallen half a second on.
  const double plain_drop = db(rms(plain.left, 0, 2400) / rms(plain.left, 24000, 26400));
  const double rubber_drop = db(rms(rubber.left, 0, 2400) / rms(rubber.left, 24000, 26400));
  std::snprintf(label, sizeof label, "middle C: plain rings %.2f s (over 2), under rubber %.2f s (under 0.5); after half a second the sound is %.1f dB down plain, %.1f dB under rubber",
                plain_ring, rubber_ring, plain_drop, rubber_drop);
  std::printf("%s\n", label);
  EXPECT(plain_ring > 2.0 && rubber_ring < 0.5 && rubber_ring > 0.08, label);
  EXPECT(plain_drop < 20.0 && rubber_drop > 60.0, "the whole sound is 60 dB down in half a second under rubber and not 20 without");

  // With the rubber a quarter of the way along, partial 2 moves most there
  // and partial 4 not at all: the second dies about four times sooner.
  Stereo quarter = strike(PreparedPiano::kRubber, 1.0f, 0.25f);
  const double f2 = kC4 * plain_partial(2, 60), f4 = kC4 * plain_partial(4, 60);
  const double two = ring_time(quarter.left, kRate, f2, 0.01, 0.06, 0.03);
  const double four = ring_time(quarter.left, kRate, f4, 0.01, 0.16, 0.03);
  std::snprintf(label, sizeof label, "rubber at 0.25: partial 2 rings %.3f s (0.07 to 0.13), partial 4 %.3f s (0.3 to 0.45)", two, four);
  std::printf("%s\n", label);
  EXPECT(two > 0.07 && two < 0.13 && four > 0.3 && four < 0.45, label);
}

// Felt: fewer highs, a softer start, a shorter ring.
static void test_felt() {
  auto strike = [&](float amount) {
    bare(device, PreparedPiano::kFelt, amount);
    device.set_param(p::kHammer, 0.7f);
    device.note_on(1, static_cast<float>(kA3), 0.9f);
    return render(device, 2.5f, kRate);
  };
  Stereo plain = strike(0.0f);
  Stereo felt = strike(1.0f);
  const double highs = db(band_rms(felt.left, kRate, 3000.0, 20000.0, 0, 9600) / band_rms(plain.left, kRate, 3000.0, 20000.0, 0, 9600));
  const double whole = db(rms(felt.left, 0, 9600) / rms(plain.left, 0, 9600));
  std::snprintf(label, sizeof label, "felt: %.1f dB above 3 kHz in the first 200 ms (under -15), the whole sound %.1f dB (-5 to 2)", highs, whole);
  std::printf("%s\n", label);
  EXPECT(highs < -15.0 && whole > -5.0 && whole < 2.0, label);
  // A softer start: the steepest slope of the wave against its peak.
  const double plain_slope = max_step(plain.left, 0, 4800) / peak(plain.left, 0, 4800);
  const double felt_slope = max_step(felt.left, 0, 4800) / peak(felt.left, 0, 4800);
  std::snprintf(label, sizeof label, "felt: steepest step over peak %.3f, %.3f without (under half)", felt_slope, plain_slope);
  std::printf("%s\n", label);
  EXPECT(felt_slope < 0.5 * plain_slope, label);
  const double plain_ring = ring_time(plain.left, kRate, kA3, 0.1, 1.6, 0.2);
  const double felt_ring = ring_time(felt.left, kRate, kA3, 0.1, 1.1, 0.2);
  std::snprintf(label, sizeof label, "felt: the fundamental rings %.2f s, %.2f s without (under a third)", felt_ring, plain_ring);
  std::printf("%s\n", label);
  EXPECT(felt_ring < 0.34 * plain_ring && felt_ring > 0.5, label);
}

// The buzz. What Rattle adds is the difference between the same strike with
// and without it (every random source is seeded from the key, so the two
// renders are the same strings).
static void test_buzz() {
  auto strike = [&](int preparation, float amount, float rattle, float gain, float rate, float seconds) {
    bare(device, preparation, amount, rate);
    device.set_param(p::kRattle, rattle);
    device.note_on(1, static_cast<float>(kC3), gain);
    return render(device, seconds, rate);
  };
  // Energy above 4 kHz, and more of it per decibel of key.
  double note[3], buzz[3];
  const float gains[3] = {0.4f, 0.7f, 1.0f};
  for (int g = 0; g < 3; ++g) {
    Stereo dry = strike(PreparedPiano::kBolts, 0.7f, 0.0f, gains[g], kRate, 0.5f);
    Stereo wet = strike(PreparedPiano::kBolts, 0.7f, 0.6f, gains[g], kRate, 0.5f);
    note[g] = rms(dry.left, 0, 14400);
    buzz[g] = band_rms(minus(wet.left, dry.left), kRate, 4000.0, 16000.0, 0, 14400);
    std::printf("bolt on C3 at gain %.1f: note %.1f dBFS, what Rattle 0.6 adds above 4 kHz %.1f dBFS (the note has %.1f there)\n", gains[g],
                db(note[g]), db(buzz[g]), db(band_rms(dry.left, kRate, 4000.0, 16000.0, 0, 14400)));
  }
  const double note_up = db(note[2] / note[1]), buzz_up = db(buzz[2] / buzz[1]);
  const double note_lower = db(note[1] / note[0]), buzz_lower = db(buzz[1] / buzz[0]);
  std::snprintf(label, sizeof label, "gain 0.7 to 1: the note rises %.1f dB and the buzz %.1f dB; 0.4 to 0.7: %.1f and %.1f dB", note_up, buzz_up,
                note_lower, buzz_lower);
  std::printf("%s\n", label);
  // (A buzz that only followed the note would rise exactly as much as the
  // note does. Near the gap it rises far faster; well past it, a little.)
  EXPECT(buzz_up > note_up + 1.5 && buzz_lower > note_lower + 6.0, "the buzz grows faster than the note");
  // And it is heard: at the default Rattle a firm key on a bolt buzzes within
  // 30 dB of its note (the whole of what Rattle adds, against the whole
  // note, over the first 0.4 s), a soft one not at all, and no key buzzes
  // as loud as it rings.
  {
    const float usual = p::kParamDefault[p::kRattle];
    double heard[3];
    const float keys[3] = {0.3f, 0.8f, 1.0f};
    for (int g = 0; g < 3; ++g) {
      Stereo dry = strike(PreparedPiano::kBolts, 0.7f, 0.0f, keys[g], kRate, 0.5f);
      Stereo wet = strike(PreparedPiano::kBolts, 0.7f, usual, keys[g], kRate, 0.5f);
      heard[g] = db(rms(minus(wet.left, dry.left), 0, 19200) / rms(dry.left, 0, 19200));
    }
    std::snprintf(label, sizeof label, "a bolt at the default Rattle buzzes %.1f dB re its note at gain 0.8 (-28 to -14), %.1f dB at gain 1 (louder, under -10), %.1f dB at gain 0.3 (under -80)",
                  heard[1], heard[2], heard[0]);
    std::printf("%s\n", label);
    EXPECT(heard[1] > -28.0 && heard[1] < -14.0 && heard[2] > heard[1] && heard[2] < -10.0 && heard[0] < -80.0, label);
    // Paper buzzes without the knob; the reference is the same strike with no paper's buzz, which only Amount 0 gives,
    // so this one is read above 4 kHz, where the plain string has next to nothing.
    Stereo plain = strike(PreparedPiano::kPaper, 0.0f, usual, 0.8f, kRate, 0.5f);
    Stereo paper = strike(PreparedPiano::kPaper, 0.8f, usual, 0.8f, kRate, 0.5f);
    const double sizzle = db(band_rms(paper.left, kRate, 4000.0, 16000.0, 0, 19200) / rms(plain.left, 0, 19200));
    std::snprintf(label, sizeof label, "paper at Amount 0.8 and the default Rattle: %.1f dB above 4 kHz re the plain note at gain 0.8 (-30 to -12)", sizzle);
    std::printf("%s\n", label);
    EXPECT(sizzle > -30.0 && sizzle < -12.0, label);
  }
  {
    Stereo dry = strike(PreparedPiano::kBolts, 0.7f, 0.0f, 1.0f, kRate, 0.5f);
    Stereo wet = strike(PreparedPiano::kBolts, 0.7f, 0.6f, 1.0f, kRate, 0.5f);
    const double added = db(band_rms(wet.left, kRate, 4000.0, 16000.0, 0, 14400) / band_rms(dry.left, kRate, 4000.0, 16000.0, 0, 14400));
    std::snprintf(label, sizeof label, "Rattle 0.6 on a hard key: %.1f dB more above 4 kHz (at least 10)", added);
    std::printf("%s\n", label);
    EXPECT(added > 10.0, label);
  }
  // A soft key under a barely loose object does not reach it at all.
  {
    Stereo dry = strike(PreparedPiano::kBolts, 0.7f, 0.0f, 0.2f, kRate, 0.5f);
    Stereo wet = strike(PreparedPiano::kBolts, 0.7f, 0.3f, 0.2f, kRate, 0.5f);
    std::snprintf(label, sizeof label, "a soft key at Rattle 0.3 is the same samples as at Rattle 0 (largest difference %g)", largest_difference(dry, wet));
    EXPECT(largest_difference(dry, wet) == 0.0, label);
  }
  // Bursts, not hiss: the buzz ends while the note still rings.
  {
    Stereo dry = strike(PreparedPiano::kBolts, 0.7f, 0.0f, 1.0f, kRate, 6.0f);
    Stereo wet = strike(PreparedPiano::kBolts, 0.7f, 0.6f, 1.0f, kRate, 6.0f);
    const std::vector<float> added = minus(wet.left, dry.left);
    // The last 10 ms in which Rattle adds anything above 4 kHz worth hearing.
    double last = 0.0;
    for (size_t from = 0; from + 480 <= added.size(); from += 480) {
      if (band_rms(added, kRate, 4000.0, 16000.0, from > 4800 ? from - 4800 : 0, from + 480) > 1.0e-5 * 0.3) last = (from + 480) / kRate;
    }
    const double note_fall = db(rms(dry.left, 0, 4800) / rms(dry.left, at(last), at(last) + 4800));
    std::snprintf(label, sizeof label, "the buzz is over %.2f s after the strike (0.3 to 4), when the note is only %.1f dB down (under 25)", last, note_fall);
    std::printf("%s\n", label);
    EXPECT(last > 0.3 && last < 4.0 && note_fall < 25.0, label);
    // Each burst is a moment of the string's swing: the buzz is far peakier than hiss.
    const double crest = peak(added, 480, 9600) / rms(added, 480, 9600);
    std::snprintf(label, sizeof label, "the buzz comes in bursts: peak over rms %.1f (hiss is about 3; at least 5)", crest);
    std::printf("%s\n", label);
    EXPECT(crest > 5.0, label);
  }
  // Paper buzzes by itself, with Rattle at 0.
  {
    Stereo plain = strike(PreparedPiano::kPaper, 0.0f, 0.0f, 0.9f, kRate, 0.5f);
    Stereo paper = strike(PreparedPiano::kPaper, 0.8f, 0.0f, 0.9f, kRate, 0.5f);
    const double added = db(band_rms(paper.left, kRate, 4000.0, 16000.0, 0, 14400) / band_rms(plain.left, kRate, 4000.0, 16000.0, 0, 14400));
    std::snprintf(label, sizeof label, "Paper at Amount 0.8 with Rattle 0: %.1f dB more above 4 kHz than the plain string (at least 10)", added);
    std::printf("%s\n", label);
    EXPECT(added > 10.0, label);
  }
  // The rustle is noise: it holds its level against the note at 96 kHz.
  {
    double share[2];
    const float rates[2] = {48000.0f, 96000.0f};
    for (int r = 0; r < 2; ++r) {
      Stereo dry = strike(PreparedPiano::kPaper, 0.0f, 0.0f, 0.9f, rates[r], 0.5f);
      Stereo wet = strike(PreparedPiano::kPaper, 1.0f, 1.0f, 0.9f, rates[r], 0.5f);
      share[r] = db(spectrum_rms(wet.left, rates[r], 4000.0, 12000.0, 0, at(0.4, rates[r])) / rms(dry.left, 0, at(0.4, rates[r])));
    }
    std::snprintf(label, sizeof label, "paper buzz against the note: %.1f dB at 48 kHz, %.1f dB at 96 kHz (within 1.5)", share[0], share[1]);
    std::printf("%s\n", label);
    EXPECT(std::fabs(share[0] - share[1]) < 1.5, label);
  }
}

// What the bursts leave in the strings: at a low Rattle the buzz is over in
// a fraction of a second, and from then on the only thing Rattle changes is
// what went back into the partials.
static void test_buzz_goes_back() {
  Stereo out[2];
  for (int pass = 0; pass < 2; ++pass) {
    bare(device, PreparedPiano::kBolts, 0.7f);
    device.set_param(p::kRattle, pass == 0 ? 0.0f : 0.35f);
    device.note_on(1, static_cast<float>(kC3), 1.0f);
    out[pass] = render(device, 1.2f, kRate);
  }
  // Partials 14 to 22 of the free string (1.9 to 3.1 kHz), between 0.6 and 1 s.
  double with = 0.0, without = 0.0;
  for (int n = 14; n <= 22; ++n) {
    const double hz = kC3 * plain_partial(n, 48);
    with += std::pow(bin_level(out[1].left, kRate, hz, at(0.6), at(0.4)), 2.0);
    without += std::pow(bin_level(out[0].left, kRate, hz, at(0.6), at(0.4)), 2.0);
  }
  const double between = bin_level(out[1].left, kRate, kC3 * 17.5, at(0.6), at(0.4));
  std::snprintf(label, sizeof label, "after the buzz has stopped, partials 14 to 22 are %.1f dB stronger for it (at least 3), and %.1f dB over what lies between them",
                db(std::sqrt(with / without)), db(std::sqrt(with / 9.0) / between));
  std::printf("%s\n", label);
  EXPECT(db(std::sqrt(with / without)) > 3.0 && db(std::sqrt(with / 9.0) / between) > 8.0, label);
}

// --- Mixed --------------------------------------------------------------------------------

// Every key has its own object, the same one every time: middle C is a
// bolt (0.6 of Amount, 0.1 further along), the D above it rubber (all of
// Amount, 0.06 nearer the end).
static void test_mixed() {
  auto mixed = [&](PreparedPiano& d, double hz) {
    bare(d, PreparedPiano::kMixed, 1.0f);
    d.set_param(p::kRattle, 0.5f);
    d.set_param(p::kThud, 0.5f);
    d.set_param(p::kPosition, 0.2f);
    d.note_on(1, static_cast<float>(hz), 0.9f);
    return render(d, 2.0f, kRate);
  };
  Stereo c = mixed(device, kC4);
  Stereo d = mixed(device, kD4);
  const double c_ring = ring_time(c.left, kRate, kC4, 0.1, 1.1, 0.2), d_ring = ring_time(d.left, kRate, kD4, 0.02, 0.2, 0.05);
  const double c_second = partial_shift(c.left, kC4, 2, 4800, at(0.8)), d_second = partial_shift(d.left, kD4, 2, 480, at(0.3));
  std::snprintf(label, sizeof label, "Mixed: middle C rings %.2f s with its second partial %.1f cents off; the D above rings %.2f s with it %.1f cents off",
                c_ring, c_second, d_ring, d_second);
  std::printf("%s\n", label);
  EXPECT(c_ring > 2.0 && std::fabs(c_second) > 30.0, "Mixed: middle C is a bolt (rings on, second partial moved)");
  EXPECT(d_ring < 0.5 && std::fabs(d_second) < 15.0, "Mixed: the D above it is rubber (a thunk, second partial in place)");

  // The table says what it means: the same key under the one object, set by hand.
  bare(other, PreparedPiano::kBolts, 0.6f);
  other.set_param(p::kRattle, 0.5f);
  other.set_param(p::kThud, 0.5f);
  other.set_param(p::kPosition, 0.3f);
  other.note_on(1, static_cast<float>(kC4), 0.9f);
  Stereo bolt = render(other, 2.0f, kRate);
  EXPECT(c.left == bolt.left && c.right == bolt.right, "Mixed middle C is Bolts at 0.6 of Amount and Position + 0.1, sample for sample");
  bare(other, PreparedPiano::kRubber, 1.0f);
  other.set_param(p::kRattle, 0.5f);
  other.set_param(p::kThud, 0.5f);
  other.set_param(p::kPosition, 0.14f);
  other.note_on(1, static_cast<float>(kD4), 0.9f);
  Stereo rubber = render(other, 2.0f, kRate);
  EXPECT(d.left == rubber.left && d.right == rubber.right, "Mixed D4 is Rubber at Amount 1 and Position - 0.06, sample for sample");

  // Neighbours differ: over an octave and a half of white and black keys,
  // every key is away from the key below it by 6 dB in how far it has fallen
  // after 0.4 s, by 4 dB in its share above 2.5 kHz, or by 30 cents in where
  // its second partial sits.
  int alike = 0;
  double fall[19], bright[19], second[19];
  for (int k = 0; k < 19; ++k) {
    const double hz = 440.0 * std::pow(2.0, (52 + k - 69) / 12.0);
    Stereo out = mixed(device, hz);
    fall[k] = db(rms(out.left, 480, 2880) / std::max(rms(out.left, at(0.4), at(0.45)), 1.0e-9));
    bright[k] = db(band_rms(out.left, kRate, 2500.0, 16000.0, 0, 9600) / rms(out.left, 0, 9600));
    second[k] = partial_shift(out.left, hz, 2, 480, at(0.3));
    if (k > 0 && std::fabs(fall[k] - fall[k - 1]) < 6.0 && std::fabs(bright[k] - bright[k - 1]) < 4.0 &&
        std::fabs(second[k] - second[k - 1]) < 30.0) {
      ++alike;
      std::printf("keys %d and %d are alike: fall %.1f / %.1f dB, bright %.1f / %.1f dB, second partial %.1f / %.1f cents\n", 51 + k,
                  52 + k, fall[k - 1], fall[k], bright[k - 1], bright[k], second[k - 1], second[k]);
    }
  }
  std::snprintf(label, sizeof label, "Mixed, keys 52 to 70: %d neighbouring pairs sound alike (none)", alike);
  std::printf("%s\n", label);
  EXPECT(alike == 0, label);

  // One key repeated is one sound: after it has rung out, the same key is
  // the same samples, rustle and thud included, whichever voice plays it.
  bare(device, PreparedPiano::kMixed, 1.0f);
  device.set_param(p::kRattle, 1.0f);
  device.set_param(p::kThud, 1.0f);
  device.set_param(p::kWidth, 1.0f);
  // (Thirty strikes, so every voice comes round again with what the last
  // note left in it.)
  Stereo first, between;
  bool same = true, quiet = true;
  double apart = 0.0;
  for (int n = 0; n < 30; ++n) {
    const double hz = n % 2 == 0 ? kC4 : kA3;  // middle C, another key between, middle C again
    device.note_on(10 + n, static_cast<float>(hz), 1.0f);
    Stereo strike = render(device, 0.5f, kRate);
    device.note_off(10 + n);
    render(device, 3.0f, kRate);
    quiet = quiet && both_peak(render(device, 0.1f, kRate)) == 0.0;
    if (n == 0) first = strike;
    if (n == 1) between = strike;
    if (n % 2 == 0) {
      apart = std::max(apart, largest_difference(first, strike));
      same = same && strike.left == first.left && strike.right == first.right;
    }
  }
  EXPECT(quiet, "a released key comes to exact silence");
  const double rustle = band_rms(first.left, kRate, 4000.0, 16000.0, 0, 9600);
  std::snprintf(label, sizeof label, "middle C struck fifteen times, each after silence: largest difference %g (0), with %.1f dBFS of buzz and a thud in it",
                apart, db(rustle));
  std::printf("%s\n", label);
  EXPECT(same, label);
  EXPECT(db(rustle) > -70.0, "and the strike that was compared does buzz");
  EXPECT(!(first.left == between.left), "another key is other samples");
}

// The default patch as it is first heard (Mixed, the default Amount and
// Rattle, a key at the app's gain of 0.8): each of the four objects is
// plainly itself against the plain string on the same key. The keys are four
// of the preview phrase: A3 a bolt, C5 rubber, F4 felt, D3 paper.
static void test_defaults_show_the_objects() {
  auto key = [&](int number, bool prepared) {
    device.init(kRate);
    if (!prepared) device.set_param(p::kAmount, 0.0f);
    device.note_on(1, 440.0f * std::pow(2.0f, static_cast<float>(number - 69) / 12.0f), 0.8f);
    return render(device, 2.0f, kRate);
  };
  auto hz_of = [](int number) { return 440.0 * std::pow(2.0, (number - 69) / 12.0); };
  EXPECT(PreparedPiano::mixed(57).preparation == PreparedPiano::kBolts && PreparedPiano::mixed(72).preparation == PreparedPiano::kRubber &&
             PreparedPiano::mixed(65).preparation == PreparedPiano::kFelt && PreparedPiano::mixed(50).preparation == PreparedPiano::kPaper,
         "the table has a bolt on A3, rubber on C5, felt on F4 and paper on D3");
  // The bolt: a clang under the note, and a second partial that has left the series.
  {
    Stereo with = key(57, true), plain = key(57, false);
    const double f0 = hz_of(57);
    double clang = 0.0, bare_there = 0.0;
    for (double ratio = 0.5; ratio <= 0.72; ratio += 0.01) {
      clang = std::max(clang, bin_level(with.left, kRate, f0 * ratio, 0, 4800));
      bare_there = std::max(bare_there, bin_level(plain.left, kRate, f0 * ratio, 0, 4800));
    }
    const double second = 2.0 * f0 * plain_partial(2, 57) / 2.0;
    double moved = 0.0, moved_cents = 0.0;
    for (double c = -300.0; c <= -30.0; c += 2.0) {
      const double level = bin_level(with.left, kRate, second * std::pow(2.0, c / 1200.0), 4800, 33600);
      if (level > moved) moved = level, moved_cents = c;
    }
    const double stayed = bin_level(with.left, kRate, second, 4800, 33600);
    std::snprintf(label, sizeof label, "defaults, the bolt on A3: a clang %.1f dB over what the plain string has there (at least 20), and a second partial %.0f cents off, %.1f dB re the one that stayed (30 cents or more, within 10 dB)",
                  db(clang / bare_there), moved_cents, db(moved / stayed));
    std::printf("%s\n", label);
    EXPECT(db(clang / bare_there) > 20.0 && moved_cents <= -30.0 && db(moved / stayed) > -10.0, label);
  }
  // Rubber: a thunk where the plain string rings on.
  {
    Stereo with = key(72, true), plain = key(72, false);
    const double fall = db(rms(with.left, 0, 2400) / rms(with.left, at(0.4), at(0.45)));
    const double plain_fall = db(rms(plain.left, 0, 2400) / rms(plain.left, at(0.4), at(0.45)));
    std::snprintf(label, sizeof label, "defaults, rubber on C5: %.1f dB down after 0.4 s, the plain string %.1f dB (at least 15 dB more)", fall, plain_fall);
    std::printf("%s\n", label);
    EXPECT(fall > plain_fall + 15.0, label);
  }
  // Felt: darker and shorter.
  {
    Stereo with = key(65, true), plain = key(65, false);
    const double highs = db(band_rms(with.left, kRate, 3000.0, 20000.0, 0, 9600) / rms(with.left, 0, 9600)) -
                         db(band_rms(plain.left, kRate, 3000.0, 20000.0, 0, 9600) / rms(plain.left, 0, 9600));
    const double ring = ring_time(with.left, kRate, hz_of(65), 0.1, 1.1, 0.2), plain_ring = ring_time(plain.left, kRate, hz_of(65), 0.1, 1.1, 0.2);
    std::snprintf(label, sizeof label, "defaults, felt on F4: %.1f dB above 3 kHz re the plain string (under -5), ringing %.2f s against %.2f s (under 0.7 of it)",
                  highs, ring, plain_ring);
    std::printf("%s\n", label);
    EXPECT(highs < -5.0 && ring < 0.7 * plain_ring, label);
  }
  // Paper: a buzz where the plain string has next to nothing.
  {
    Stereo with = key(50, true), plain = key(50, false);
    const double buzz = db(band_rms(with.left, kRate, 4000.0, 16000.0, 0, 19200) / rms(plain.left, 0, 19200));
    const double plain_there = db(band_rms(plain.left, kRate, 4000.0, 16000.0, 0, 19200) / rms(plain.left, 0, 19200));
    std::snprintf(label, sizeof label, "defaults, paper on D3: %.1f dB above 4 kHz re the note, the plain string %.1f dB (at least 15 dB more, and over -36)", buzz,
                  plain_there);
    std::printf("%s\n", label);
    EXPECT(buzz > plain_there + 15.0 && buzz > -36.0, label);
  }
}

// --- The thud -----------------------------------------------------------------------------

// The knock is there, it has no pitch (the same samples on every key, spread
// over the low band, no line in it), and it is over in a tenth of a second.
static void test_thud() {
  auto knock = [&](double hz, float gain, float rate) {
    std::vector<float> each[2];
    for (int pass = 0; pass < 2; ++pass) {
      bare(device, PreparedPiano::kRubber, 0.5f, rate);
      device.set_param(p::kThud, pass == 0 ? 0.0f : 1.0f);
      device.note_on(1, static_cast<float>(hz), gain);
      each[pass] = render(device, 0.5f, rate).left;
    }
    return minus(each[1], each[0]);
  };
  const std::vector<float> low = knock(kC3, 0.8f, kRate);
  const std::vector<float> high = knock(783.99, 0.8f, kRate);
  double apart = 0.0;
  for (size_t i = 0; i < low.size(); ++i) apart = std::max(apart, std::fabs(static_cast<double>(low[i]) - high[i]));
  const double size = peak(low);
  std::snprintf(label, sizeof label, "the thud peaks at %.1f dBFS at Thud 1 and is the same on C3 and G5 to %.1f dB of itself", db(size), db(apart / size));
  std::printf("%s\n", label);
  EXPECT(size > 0.02 && apart < 1.0e-4 * size, label);

  // Where it sits: most of it under 800 Hz, a good share either side of 250 Hz.
  // (Read from a spectrum, with the knock moved into the middle of a frame.)
  std::vector<float> framed(2048, 0.0f);
  framed.insert(framed.end(), low.begin(), low.begin() + 2048);
  const double all = spectrum_rms(framed, kRate, 0.0, 24000.0, 0, 4096);
  const double under = spectrum_rms(framed, kRate, 20.0, 250.0, 0, 4096), over = spectrum_rms(framed, kRate, 250.0, 800.0, 0, 4096);
  const double above = spectrum_rms(framed, kRate, 1500.0, 24000.0, 0, 4096);
  // No line: the strongest single frequency holds little of it.
  double line = 0.0;
  for (double hz = 40.0; hz < 1500.0; hz *= 1.02) line = std::max(line, bin_level(low, kRate, hz, 0, 4800));
  std::snprintf(label, sizeof label, "the thud: %.1f dB under 250 Hz, %.1f dB from 250 to 800 Hz, %.1f dB over 1.5 kHz; its strongest line is %.1f dB re its peak",
                db(under / all), db(over / all), db(above / all), db(line / size));
  std::printf("%s\n", label);
  EXPECT(db(under / all) > -8.0 && db(over / all) > -10.0 && db(above / all) < -15.0 && db(line / size) < -12.0, label);

  // Short: 30 dB down within 60 ms, and exactly over after a quarter of a second.
  const double start = rms(low, 0, 480), later = rms(low, at(0.06), at(0.07));
  std::snprintf(label, sizeof label, "the thud is %.1f dB down 60 ms on and %g after 0.3 s", db(start / later), peak(low, at(0.3), low.size()));
  std::printf("%s\n", label);
  EXPECT(db(start / later) > 30.0 && peak(low, at(0.3), low.size()) < 1.0e-7, label);

  // It follows the key's velocity, and holds its level at 96 kHz.
  const double soft = rms(knock(kC3, 0.3f, kRate), 0, 4800), loud = rms(low, 0, 4800);
  const double at_96 = rms(knock(kC3, 0.8f, 96000.0f), 0, 9600), at_44 = rms(knock(kC3, 0.8f, 44100.0f), 0, 4410);
  std::snprintf(label, sizeof label, "the thud: gain 0.8 is %.1f dB over gain 0.3 (8 to 20); at 44.1 and 96 kHz it is %.2f and %.2f dB from 48 kHz (within 0.5)",
                db(loud / soft), db(at_44 / loud), db(at_96 / loud));
  std::printf("%s\n", label);
  EXPECT(db(loud / soft) > 8.0 && db(loud / soft) < 20.0 && std::fabs(db(at_96 / loud)) < 0.5 && std::fabs(db(at_44 / loud)) < 0.5, label);

  // At the default it sits under the note, not over it.
  device.init(kRate);
  device.set_param(p::kPreparation, static_cast<float>(PreparedPiano::kBolts));
  device.note_on(1, static_cast<float>(kC4), 0.8f);
  const std::vector<float> with = render(device, 0.3f, kRate).left;
  device.init(kRate);
  device.set_param(p::kPreparation, static_cast<float>(PreparedPiano::kBolts));
  device.set_param(p::kThud, 0.0f);
  device.note_on(1, static_cast<float>(kC4), 0.8f);
  const std::vector<float> bare_note = render(device, 0.3f, kRate).left;
  const double share = db(rms(minus(with, bare_note), 0, 1440) / rms(bare_note, 0, 1440));
  std::snprintf(label, sizeof label, "at the default Thud the knock is %.1f dB re the note in the first 30 ms (-30 to -6)", share);
  std::printf("%s\n", label);
  EXPECT(share > -30.0 && share < -6.0, label);
}

// --- Hammer, decay, the strings of a note, tone, width -----------------------------------------

static void test_hammer() {
  Stereo out[3];
  const float hardness[3] = {0.0f, 0.5f, 1.0f};
  for (int h = 0; h < 3; ++h) {
    bare(device, PreparedPiano::kBolts, 0.0f);
    device.set_param(p::kHammer, hardness[h]);
    device.note_on(1, static_cast<float>(kA3), 0.8f);
    out[h] = render(device, 0.5f, kRate);
  }
  const double soft = band_rms(out[0].left, kRate, 2000.0, 20000.0, 0, 9600), hard = band_rms(out[2].left, kRate, 2000.0, 20000.0, 0, 9600);
  const double level = db(rms(out[2].left, 0, 9600) / rms(out[0].left, 0, 9600));
  std::snprintf(label, sizeof label, "a hard hammer has %.1f dB more above 2 kHz than a soft one (at least 20) and is %.1f dB louder in all (within 2)",
                db(hard / soft), level);
  std::printf("%s\n", label);
  EXPECT(db(hard / soft) > 20.0 && std::fabs(level) < 2.0, label);
  const double middle = band_rms(out[1].left, kRate, 2000.0, 20000.0, 0, 9600);
  EXPECT(middle > 2.0 * soft && hard > 2.0 * middle, "and the middle of the knob is between them");
}

// Decay stretches the ring; a released key is damped in under a second, as
// under a pedal half down, and a key struck again stops its old note.
static void test_decay_and_pedal() {
  double ring[3];
  const float decays[3] = {0.5f, 1.0f, 2.0f};
  for (int n = 0; n < 3; ++n) {
    bare(device, PreparedPiano::kBolts, 0.0f);
    device.set_param(p::kDecay, decays[n]);
    device.note_on(1, static_cast<float>(kC4), 0.8f);
    Stereo out = render(device, 2.0f, kRate);
    ring[n] = ring_time(out.left, kRate, kC4, 0.1, 1.6, 0.2);
  }
  std::snprintf(label, sizeof label, "middle C held: its fundamental rings %.2f s at Decay 0.5, %.2f s at 1, %.2f s at 2 (3.5, 7, 14 s)", ring[0], ring[1], ring[2]);
  std::printf("%s\n", label);
  EXPECT_NEAR(ring[0], 3.5, 0.4, "Decay 0.5 halves the ring");
  EXPECT_NEAR(ring[1], 7.0, 0.7, "middle C rings 7 s at Decay 1");
  EXPECT_NEAR(ring[2], 14.0, 1.5, "Decay 2 doubles the ring");
  // Low notes ring longer than high ones.
  double by_key[3];
  const double keys[3] = {kC2, kC4, kC6};
  for (int n = 0; n < 3; ++n) {
    bare(device, PreparedPiano::kBolts, 0.0f);
    device.note_on(1, static_cast<float>(keys[n]), 0.8f);
    Stereo out = render(device, 1.2f, kRate);
    by_key[n] = ring_time(out.left, kRate, keys[n], 0.1, 0.9, 0.2);
  }
  std::snprintf(label, sizeof label, "the fundamental rings %.1f s at C2, %.1f s at C4, %.1f s at C6", by_key[0], by_key[1], by_key[2]);
  std::printf("%s\n", label);
  EXPECT(by_key[0] > 1.8 * by_key[1] && by_key[1] > 1.8 * by_key[2], label);

  // Held against released, 0.35 s after the key comes up (half the release time).
  double held = 0.0, let_go[2] = {0.0, 0.0};
  for (int pass = 0; pass < 3; ++pass) {
    bare(device, PreparedPiano::kBolts, 0.0f);
    if (pass == 2) device.set_param(p::kDecay, 2.0f);
    device.note_on(1, static_cast<float>(kC4), 0.8f);
    Stereo before = render(device, 0.3f, kRate);
    if (pass > 0) device.note_off(1);
    Stereo after = render(device, 1.2f, kRate);
    const double fall = db(bin_level(before.left, kRate, kC4, at(0.2), 4800) / bin_level(after.left, kRate, kC4, at(0.3), 4800));
    if (pass == 0) held = fall; else let_go[pass - 1] = fall;
  }
  std::snprintf(label, sizeof label, "0.35 s after the key comes up the fundamental is %.1f dB down (%.1f held); at Decay 2, %.1f dB", let_go[0], held, let_go[1]);
  std::printf("%s\n", label);
  EXPECT(held < 6.0, "a held key rings on");
  EXPECT_NEAR(let_go[0], 34.0, 4.0, "a released key is damped over 0.7 s");
  EXPECT_NEAR(let_go[1], 12.0, 3.0, "and over 2 s at Decay 2");

  // A key struck again (silently here, so only the old note is heard) is
  // stopped in a tenth of a second, and takes no second voice for good.
  bare(device, PreparedPiano::kBolts, 0.0f);
  device.note_on(1, static_cast<float>(kC4), 0.8f);
  Stereo before = render(device, 0.3f, kRate);
  device.note_on(1, static_cast<float>(kC4), 0.0f);
  Stereo after = render(device, 0.3f, kRate);
  const double stopped = db(bin_level(before.left, kRate, kC4, at(0.2), 4800) / bin_level(after.left, kRate, kC4, at(0.05), 2400));
  std::snprintf(label, sizeof label, "a key struck again: its old note is %.1f dB down 75 ms on (35 to 60)", stopped);
  std::printf("%s\n", label);
  EXPECT(stopped > 35.0 && stopped < 60.0, label);
}

// Detune puts the two strings of a note either side of the key, and they beat.
static void test_detune() {
  auto strings = [&](float detune) {
    bare(device, PreparedPiano::kBolts, 0.0f);
    device.set_param(p::kDetune, detune);
    device.set_param(p::kDecay, 4.0f);
    device.note_on(1, static_cast<float>(kA4), 0.8f);
    return render(device, 3.0f, kRate);
  };
  Stereo wide = strings(1.0f);
  const size_t from = at(0.3), n = at(2.6);
  auto swing = [&](const std::vector<float>& x) {  // of the fundamental, over two beats
    double lowest = 1.0e9, highest = 0.0;
    for (size_t start = at(0.5); start + 1920 <= at(1.06); start += 240) {
      const double level = bin_level(x, kRate, kA4, start, 1920);
      lowest = std::min(lowest, level);
      highest = std::max(highest, level);
    }
    return db(highest / lowest);
  };
  const double flat = cents(fine_pitch(wide.left, kRate, kA4 * 0.996, from, from + n, 0.003), kA4);
  const double sharp = cents(fine_pitch(wide.left, kRate, kA4 * 1.004, from, from + n, 0.003), kA4);
  const double dip = db(bin_level(wide.left, kRate, kA4, from, n) / bin_level(wide.left, kRate, kA4 * std::pow(2.0, 7.0 / 1200.0), from, n));
  std::snprintf(label, sizeof label, "Detune 1: the strings sit %.1f and %.1f cents from the key (-7 and 7), with %.1f dB between them", flat, sharp, dip);
  std::printf("%s\n", label);
  EXPECT(std::fabs(flat + 7.0) < 0.7 && std::fabs(sharp - 7.0) < 0.7 && dip < -10.0, label);
  // The beat: the fundamental swells and falls 3.6 times a second.
  Stereo none = strings(0.0f);
  const double beating = swing(wide.left), steady = swing(none.left);
  std::snprintf(label, sizeof label, "over two beats the fundamental swings %.1f dB at Detune 1 and %.1f dB at Detune 0", beating, steady);
  std::printf("%s\n", label);
  EXPECT(beating > 8.0 && steady < 2.0, label);

  // The knob is live: turned under a held note, the strings of that note
  // move apart (and back) without waiting for the next key.
  bare(device, PreparedPiano::kBolts, 0.0f);
  device.set_param(p::kDetune, 0.0f);
  device.set_param(p::kDecay, 4.0f);
  device.note_on(1, static_cast<float>(kA4), 0.8f);
  render(device, 0.2f, kRate);
  device.set_param(p::kDetune, 1.0f);
  Stereo moved = render(device, 3.0f, kRate);
  const double moved_flat = cents(fine_pitch(moved.left, kRate, kA4 * 0.996, from, from + n, 0.003), kA4);
  const double moved_sharp = cents(fine_pitch(moved.left, kRate, kA4 * 1.004, from, from + n, 0.003), kA4);
  device.set_param(p::kDetune, 0.0f);
  render(device, 0.1f, kRate);
  Stereo back = render(device, 1.2f, kRate);
  const double together = swing(back.left);
  std::snprintf(label, sizeof label, "Detune turned to 1 under a held note: its strings sit %.1f and %.1f cents from the key (-7 and 7); turned back, the fundamental swings %.1f dB (under 2)",
                moved_flat, moved_sharp, together);
  std::printf("%s\n", label);
  EXPECT(std::fabs(moved_flat + 7.0) < 0.7 && std::fabs(moved_sharp - 7.0) < 0.7 && together < 2.0, label);
}

static void test_tone_and_width() {
  Stereo out[2];
  for (int pass = 0; pass < 2; ++pass) {
    bare(device, PreparedPiano::kBolts, 0.5f);
    device.set_param(p::kHammer, 0.9f);
    device.set_param(p::kTone, pass == 0 ? 1.0f : 0.0f);
    device.note_on(1, static_cast<float>(kA3), 0.8f);
    out[pass] = render(device, 0.5f, kRate);
  }
  const double highs = db(band_rms(out[1].left, kRate, 3000.0, 20000.0, 0, 9600) / band_rms(out[0].left, kRate, 3000.0, 20000.0, 0, 9600));
  const double low = db(bin_level(out[1].left, kRate, kA3, 2400, 19200) / bin_level(out[0].left, kRate, kA3, 2400, 19200));
  std::snprintf(label, sizeof label, "Tone at 0: %.1f dB above 3 kHz (under -24), the fundamental %.2f dB (within 1)", highs, low);
  std::printf("%s\n", label);
  EXPECT(highs < -24.0 && std::fabs(low) < 1.0, label);

  // Width 0 is mono; at 1 the low keys are on the left and the high on the right.
  device.init(kRate);
  device.set_param(p::kWidth, 0.0f);
  device.set_param(p::kRattle, 1.0f);
  device.note_on(1, static_cast<float>(kC2), 0.9f);
  device.note_on(2, static_cast<float>(kC6), 0.9f);
  Stereo mono = render(device, 0.5f, kRate);
  EXPECT(mono.left == mono.right, "Width 0 is mono, sample for sample");
  double lean[2];
  const double keys[2] = {kC2, kC6};
  for (int n = 0; n < 2; ++n) {
    device.init(kRate);
    device.set_param(p::kWidth, 1.0f);
    device.note_on(1, static_cast<float>(keys[n]), 0.8f);
    Stereo out = render(device, 0.5f, kRate);
    lean[n] = db(rms(out.right) / rms(out.left));
  }
  std::snprintf(label, sizeof label, "Width 1: C2 leans %.1f dB to the right and C6 %.1f dB (under -4, over 4)", lean[0], lean[1]);
  std::printf("%s\n", label);
  EXPECT(lean[0] < -4.0 && lean[1] > 4.0, label);
  // At the default Width the ends of the keyboard are placed, not thrown to one side.
  const double ends[2] = {27.5, 4186.0};
  for (int n = 0; n < 2; ++n) {
    device.init(kRate);
    device.note_on(1, static_cast<float>(ends[n]), 0.8f);
    Stereo out = render(device, 0.5f, kRate);
    lean[n] = db(rms(out.right) / rms(out.left));
  }
  std::snprintf(label, sizeof label, "the default Width: the lowest key leans %.1f dB to the right and the highest %.1f dB (-6 to -2, 2 to 6)", lean[0],
                lean[1]);
  std::printf("%s\n", label);
  EXPECT(lean[0] > -6.0 && lean[0] < -2.0 && lean[1] > 2.0 && lean[1] < 6.0, label);
  // The two strings of a note stand a little apart: the prepared one to the right.
  bare(device, PreparedPiano::kBolts, 1.0f);
  device.set_param(p::kWidth, 1.0f);
  device.note_on(1, static_cast<float>(kC4), 0.8f);
  Stereo note = render(device, 1.0f, kRate);
  const double moved = kC4 * plain_partial(2, 60) * bolted(2, 0.6, 0.2), plain = kC4 * plain_partial(2, 60);
  const double bolted_lean = db(bin_level(note.right, kRate, moved, 4800, 38400) / bin_level(note.left, kRate, moved, 4800, 38400));
  const double free_lean = db(bin_level(note.right, kRate, plain, 4800, 38400) / bin_level(note.left, kRate, plain, 4800, 38400));
  std::snprintf(label, sizeof label, "middle C at Width 1: the bolted string leans %.1f dB right, the free string %.1f dB", bolted_lean, free_lean);
  std::printf("%s\n", label);
  EXPECT(bolted_lean > 1.0 && free_lean < -1.0, label);
}

// --- Velocity and level -------------------------------------------------------------------

static void test_velocity() {
  Stereo out[2];
  const float gains[2] = {0.3f, 1.0f};
  for (int n = 0; n < 2; ++n) {
    bare(device, PreparedPiano::kBolts, 0.0f);
    device.note_on(1, static_cast<float>(kA3), gains[n]);
    out[n] = render(device, 0.5f, kRate);
  }
  const double louder = db(rms(out[1].left, 0, 9600) / rms(out[0].left, 0, 9600));
  const double soft = band_rms(out[0].left, kRate, 2000.0, 20000.0, 0, 9600) / rms(out[0].left, 0, 9600);
  const double hard = band_rms(out[1].left, kRate, 2000.0, 20000.0, 0, 9600) / rms(out[1].left, 0, 9600);
  std::snprintf(label, sizeof label, "gain 1 is %.1f dB over gain 0.3 (12 to 22) and its share above 2 kHz is %.1f dB higher (at least 4)",
                louder, db(hard / soft));
  std::printf("%s\n", label);
  EXPECT(louder > 12.0 && louder < 22.0 && db(hard / soft) > 4.0, label);
  // A key at gain 0 makes no sound at all.
  device.init(kRate);
  device.note_on(1, static_cast<float>(kA3), 0.0f);
  EXPECT(both_peak(render(device, 0.5f, kRate)) == 0.0, "a key at gain 0 is silent");
}

static void test_level() {
  // The rule: one note at gain 0.7, default volume, peaks between -24 and -10 dBFS.
  device.init(kRate);
  device.note_on(1, static_cast<float>(kC4), 0.7f);
  const double rule = db(both_peak(render(device, 2.0f, kRate)));
  std::snprintf(label, sizeof label, "the default patch, middle C at gain 0.7, peaks at %.1f dBFS (-24 to -10)", rule);
  std::printf("%s\n", label);
  EXPECT(rule > -24.0 && rule < -10.0, label);

  // Volume is in dB: 12 dB down is 12 dB down.
  double at_volume[2];
  for (int pass = 0; pass < 2; ++pass) {
    device.init(kRate);
    device.set_param(p::kVolume, pass == 0 ? 0.0f : -12.0f);
    device.note_on(1, static_cast<float>(kC4), 0.7f);
    at_volume[pass] = rms(render(device, 0.5f, kRate).left);
  }
  EXPECT_NEAR(db(at_volume[0] / at_volume[1]), 12.0, 0.05, "Volume at -12 dB is 12 dB under Volume at 0 dB");

  // The same over the keyboard and under every object, each at the default Amount.
  double lowest = 0.0, highest = -200.0, slowest = 1.0;
  for (int preparation = 0; preparation < PreparedPiano::kNumPreparations; ++preparation) {
    for (double hz : {28.0, 55.0, 110.0, 220.0, kC4, 440.0, 880.0, 1760.0, 4200.0}) {
      device.init(kRate);
      device.set_param(p::kPreparation, static_cast<float>(preparation));
      device.note_on(1, static_cast<float>(hz), 0.7f);
      Stereo out = render(device, 1.0f, kRate);
      const double level = db(both_peak(out));
      lowest = std::min(lowest, level);
      highest = std::max(highest, level);
      // How much of the note's peak is there within 30 ms of the key.
      slowest = std::min(slowest, both_peak(out, 0, 1440) / both_peak(out));
    }
  }
  std::snprintf(label, sizeof label, "28 Hz to 4.2 kHz under every object: one note at gain 0.7 peaks between %.1f and %.1f dBFS (-24 to -10)", lowest, highest);
  std::printf("%s\n", label);
  EXPECT(lowest > -24.0 && highest < -10.0, label);
  std::snprintf(label, sizeof label, "within 30 ms of the key every one of them has reached %.0f%% of its peak or more (at least 50)", 100.0 * slowest);
  std::printf("%s\n", label);
  EXPECT(slowest > 0.5, label);

  // Ten keys held at once stay under the knee of the output clip (0.5).
  const char* names[5] = {"Mixed", "Bolts", "Rubber", "Felt", "Paper"};
  char line[200] = "ten keys held at gain 0.7 peak at";
  double worst = 0.0;
  for (int preparation = 0; preparation < PreparedPiano::kNumPreparations; ++preparation) {
    device.init(kRate);
    device.set_param(p::kPreparation, static_cast<float>(preparation));
    for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n) * 3.0f / 12.0f), 0.7f);
    const double level = both_peak(render(device, 3.0f, kRate));
    worst = std::max(worst, level);
    std::snprintf(line + std::strlen(line), sizeof line - std::strlen(line), " %.3f %s,", level, names[preparation]);
  }
  std::printf("%s all under 0.5\n", line);
  EXPECT(worst < 0.5, "ten held keys stay under the clip knee under every object");

  // Past the knee the output is rounded off, never over full scale.
  device.init(kRate);
  device.set_param(p::kVolume, 6.0f);
  device.set_param(p::kThud, 1.0f);
  device.set_param(p::kRattle, 1.0f);
  for (int n = 0; n < 12; ++n) device.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n) * 2.0f / 12.0f), 1.0f);
  const double loud = both_peak(render(device, 1.0f, kRate));
  std::snprintf(label, sizeof label, "twelve keys at full gain and +6 dB peak at %.3f (over 0.9, never over 1)", loud);
  std::printf("%s\n", label);
  EXPECT(loud > 0.9 && loud <= 1.0, label);
}

// --- Clicks -------------------------------------------------------------------------------

// A chord that is still buzzing, off centre, a third of a second old.
static void chord(PreparedPiano& d) {
  d.init(kRate);
  d.set_param(p::kPreparation, static_cast<float>(PreparedPiano::kBolts));
  d.set_param(p::kAmount, 0.7f);
  d.set_param(p::kRattle, 0.6f);
  d.note_on(1, static_cast<float>(kC2), 1.0f);
  d.note_on(2, static_cast<float>(kC3), 1.0f);
  d.note_on(3, 392.0f, 0.9f);
  d.note_on(4, static_cast<float>(kC6), 0.8f);
}
static void full_pool(PreparedPiano& d) {
  d.init(kRate);
  for (int n = 0; n < PreparedPiano::kMaxVoices; ++n) d.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n) * 3.0f / 12.0f), 0.8f);
}

static void test_clicks() {
  struct Case {
    const char* what;
    double share;
  };
  const Case cases[] = {
      {"Volume to -30 dB", suddenness(chord, [](PreparedPiano& d) { d.set_param(p::kVolume, -30.0f); })},
      {"Volume to +6 dB", suddenness(chord, [](PreparedPiano& d) { d.set_param(p::kVolume, 6.0f); })},
      {"Tone to 0", suddenness(chord, [](PreparedPiano& d) { d.set_param(p::kTone, 0.0f); })},
      {"Width to 0", suddenness(chord, [](PreparedPiano& d) { d.set_param(p::kWidth, 0.0f); })},
      {"Width to 1", suddenness(chord, [](PreparedPiano& d) { d.set_param(p::kWidth, 1.0f); })},
      {"Rattle to 0", suddenness(chord, [](PreparedPiano& d) { d.set_param(p::kRattle, 0.0f); })},
      {"Rattle to 1", suddenness(chord, [](PreparedPiano& d) { d.set_param(p::kRattle, 1.0f); })},
      {"Decay to its shortest", suddenness(chord, [](PreparedPiano& d) { d.set_param(p::kDecay, 0.25f); })},
      {"Detune to 1", suddenness(chord, [](PreparedPiano& d) { d.set_param(p::kDetune, 1.0f); })},
      {"Detune to 0", suddenness(chord, [](PreparedPiano& d) { d.set_param(p::kDetune, 0.0f); })},
      {"every key released", suddenness(chord, [](PreparedPiano& d) { for (int id = 1; id <= 4; ++id) d.note_off(id); })},
      {"a key struck again (silently)", suddenness(chord, [](PreparedPiano& d) { d.note_on(2, static_cast<float>(kC3), 0.0f); })},
      {"a voice stolen (by a silent key)", suddenness(full_pool, [](PreparedPiano& d) { d.note_on(99, 500.0f, 0.0f); })},
  };
  double worst = 0.0;
  for (const Case& c : cases) {
    std::printf("  %s: %.1f%% of the change is there in the first 8 samples\n", c.what, 100.0 * c.share);
    worst = std::max(worst, c.share);
    std::snprintf(label, sizeof label, "%s does not click (%.1f%% of the change in 8 samples; under 15)", c.what, 100.0 * c.share);
    EXPECT(c.share < 0.15, label);
  }
  // The measure does see a jump: cutting the sound dead is all there at once.
  const double cut = suddenness(chord, [](PreparedPiano& d) { d.init(kRate); });
  std::snprintf(label, sizeof label, "no change clicks: the worst is %.1f%% in 8 samples, where a dead cut reads %.0f%%", 100.0 * worst, 100.0 * cut);
  std::printf("%s\n", label);
  EXPECT(cut > 0.5, label);

  // The knobs that wait for the next note leave a sounding one alone.
  Stereo out[2];
  for (int pass = 0; pass < 2; ++pass) {
    chord(device);
    render_samples(device, 5000);
    if (pass == 1) {
      device.set_param(p::kPreparation, static_cast<float>(PreparedPiano::kPaper));
      device.set_param(p::kAmount, 0.1f);
      device.set_param(p::kPosition, 0.5f);
      device.set_param(p::kHammer, 1.0f);
      device.set_param(p::kThud, 1.0f);
    }
    out[pass] = render_samples(device, 9600);
  }
  EXPECT(out[0].left == out[1].left && out[0].right == out[1].right,
         "Preparation, Amount, Position, Hammer and Thud leave a sounding note alone");
}

// --- Block size, sleep, a second init -------------------------------------------------------

// Render `count` samples in blocks of `block` (0: ragged sizes) onto `out`.
static void advance(PreparedPiano& d, size_t count, int block, Stereo& out) {
  static const int sizes[] = {1, 7, 64, 128, 33, 512, 2048, 5};
  static int which = 0;
  size_t done = 0;
  while (done < count) {
    const int want = block > 0 ? block : sizes[which++ % 8];
    const int frames = static_cast<int>(std::min(static_cast<size_t>(want), count - done));
    d.process(frames);
    out.left.insert(out.left.end(), d.out_left(), d.out_left() + frames);
    out.right.insert(out.right.end(), d.out_right(), d.out_right() + frames);
    done += static_cast<size_t>(frames);
  }
}

// A story with everything in it: buzz and thud, knobs turned under held
// notes, a key struck again, more keys than voices, a silence long enough
// (or not) to fall asleep in, knobs moved in the silence, and a wake.
static Stereo story(PreparedPiano& d, int block, size_t rest, size_t* silent_from = nullptr) {
  Stereo out;
  d.init(kRate);
  d.set_param(p::kAmount, 0.8f);
  d.set_param(p::kRattle, 0.8f);
  d.set_param(p::kThud, 0.6f);
  d.set_param(p::kDetune, 0.5f);
  d.note_on(1, static_cast<float>(kC3), 0.9f);
  d.note_on(2, 329.63f, 0.7f);
  advance(d, 1000, block, out);
  d.note_on(3, 392.0f, 0.8f);
  advance(d, 4801, block, out);
  d.set_param(p::kVolume, -12.0f);
  d.set_param(p::kTone, 0.3f);
  d.set_param(p::kWidth, 1.0f);
  d.set_param(p::kRattle, 0.2f);
  d.set_param(p::kDecay, 0.5f);
  advance(d, 3333, block, out);
  d.note_on(1, static_cast<float>(kC3), 1.0f);
  advance(d, 2000, block, out);
  for (int n = 0; n < 14; ++n) {
    d.note_on(20 + n, 98.0f * std::pow(2.0f, static_cast<float>(n) * 5.0f / 12.0f), 0.8f);
    advance(d, 37, block, out);
  }
  advance(d, 5000, block, out);
  for (int id = 1; id <= 3; ++id) d.note_off(id);
  for (int n = 0; n < 14; ++n) d.note_off(20 + n);
  advance(d, 96000, block, out);
  if (silent_from) *silent_from = out.size() - 4800;
  advance(d, rest, block, out);
  d.set_param(p::kTone, 0.9f);
  d.set_param(p::kWidth, 0.2f);
  d.set_param(p::kVolume, -3.0f);
  d.set_param(p::kDecay, 2.0f);
  advance(d, 77, block, out);
  d.note_on(50, static_cast<float>(kD4), 0.8f);
  d.note_on(51, static_cast<float>(kC2), 1.0f);
  advance(d, 9600, block, out);
  return out;
}

static void test_block_size() {
  // Rests that end before the device sleeps (0.1 s of silence), on the
  // sample it sleeps, and after.
  const size_t rests[] = {0, 1, 4799, 4800, 4801, 5321, 12345};
  const int blocks[] = {1, 2048, 0};
  double worst = 0.0;
  bool same = true, quiet = true;
  for (size_t rest : rests) {
    size_t silent_from = 0;
    Stereo reference = story(device, 128, rest, &silent_from);
    quiet = quiet && both_peak(reference, silent_from, silent_from + 4800 + rest + 77) == 0.0;
    for (int block : blocks) {
      Stereo out = story(other, block, rest);
      worst = std::max(worst, largest_difference(reference, out));
      same = same && out.left == reference.left && out.right == reference.right;
    }
  }
  std::snprintf(label, sizeof label, "blocks of 1, 128, 2048 and ragged sizes, through seven silences either side of sleep: largest difference %g (0)", worst);
  std::printf("%s\n", label);
  EXPECT(same, label);
  EXPECT(quiet, "and the silence in the story is exact silence");

  // A second init, and another device with another past, play the same samples.
  Stereo first = story(device, 128, 5000);
  Stereo second = story(device, 128, 5000);
  chord(other);
  render(other, 0.3f, kRate);
  Stereo third = story(other, 128, 5000);
  std::snprintf(label, sizeof label, "a second init plays the same %zu samples (largest difference %g), and so does a device with another past (%g)",
                first.size(), largest_difference(first, second), largest_difference(first, third));
  std::printf("%s\n", label);
  EXPECT(first.left == second.left && first.right == second.right && first.left == third.left && first.right == third.right, label);
  EXPECT(rms(first.left) > 1.0e-3, "and the story is not silence");
}

// Knobs moved in a silence are simply there at the next note: the wake is the
// sound of a fresh device with those settings, whether the device had gone
// to sleep or had only just fallen silent, on or off the control beat.
static void test_wake() {
  auto settings = [](PreparedPiano& d) {
    d.set_param(p::kPreparation, static_cast<float>(PreparedPiano::kPaper));
    d.set_param(p::kAmount, 0.9f);
    d.set_param(p::kRattle, 0.9f);
    d.set_param(p::kTone, 0.2f);
    d.set_param(p::kWidth, 0.1f);
    d.set_param(p::kVolume, -12.0f);
    d.set_param(p::kDecay, 2.0f);
    d.set_param(p::kThud, 0.8f);
  };
  other.init(kRate);
  settings(other);
  other.note_on(2, static_cast<float>(kA3), 0.9f);
  Stereo fresh_one = render_samples(other, 9600);
  bool same = true;
  double worst = 0.0;
  for (int wait : {-1, 0, 1, 13, 4800, 4811, 9999}) {  // -1: the block it falls silent in
    device.init(kRate);
    device.set_param(p::kWidth, 1.0f);
    device.note_on(1, static_cast<float>(kC4), 0.8f);
    render_samples(device, 4803);
    device.note_off(1);
    size_t blocks = 0;
    while (both_peak(render_samples(device, 61, 61)) > 0.0 && blocks < 20000) ++blocks;
    EXPECT(blocks > 100 && blocks < 20000, "the released note rings, then falls silent");
    if (wait > 0) render_samples(device, static_cast<size_t>(wait));
    settings(device);
    if (wait > 0) render_samples(device, 1001);
    device.note_on(2, static_cast<float>(kA3), 0.9f);
    Stereo out = render_samples(device, 9600);
    worst = std::max(worst, largest_difference(out, fresh_one));
    same = same && out.left == fresh_one.left && out.right == fresh_one.right;
  }
  std::snprintf(label, sizeof label, "knobs moved in a silence, then a key: the same samples as a fresh device (largest difference %g over seven waits)", worst);
  std::printf("%s\n", label);
  EXPECT(same, label);
}

// --- Voices ---------------------------------------------------------------------------------

static void test_voices() {
  // Twelve low keys with nothing of theirs above 3 kHz, so a high key shows.
  auto low_pool = [](PreparedPiano& d) {
    bare(d, PreparedPiano::kBolts, 0.5f);
    for (int n = 0; n < PreparedPiano::kMaxVoices; ++n) d.note_on(n, 55.0f * std::pow(2.0f, static_cast<float>(n) / 12.0f), 0.8f);
    render(d, 0.1f, kRate);
  };
  auto heard = [](const Stereo& out, double hz) { return bin_level(out.left, kRate, hz, 480, 4800) + bin_level(out.right, kRate, hz, 480, 4800); };
  // Two keys in one block over a full pool: both sound.
  low_pool(device);
  device.note_on(100, 3520.0f, 0.8f);
  device.note_on(101, 4186.0f, 0.8f);
  Stereo both = render(device, 0.2f, kRate);
  const double first = heard(both, 3520.0), second = heard(both, 4186.0);
  // A key that came up before its stolen voice was free never sounds.
  low_pool(device);
  device.note_on(100, 3520.0f, 0.8f);
  device.note_off(100);
  const double ghost = heard(render(device, 0.2f, kRate), 3520.0);
  std::snprintf(label, sizeof label, "two keys in one block over a full pool sound at %.1f and %.1f dBFS; one released before its stolen voice was free, at %.1f dBFS",
                db(first), db(second), db(ghost));
  std::printf("%s\n", label);
  EXPECT(db(first) > -40.0 && db(second) > -40.0, "two keys in one block over a full pool both sound");
  EXPECT(db(ghost) < db(first) - 50.0, "a key released before its stolen voice was free never sounds");

  // A key struck three times while a steal fades, then everything released:
  // silence, with nothing left holding a voice (the next note is a fresh device's).
  full_pool(device);
  render(device, 0.1f, kRate);
  device.note_on(200, 700.0f, 0.8f);
  device.note_on(200, 700.0f, 0.9f);
  render_samples(device, 20, 20);
  device.note_on(200, 700.0f, 1.0f);
  render(device, 0.2f, kRate);
  for (int n = 0; n < PreparedPiano::kMaxVoices; ++n) device.note_off(n);
  device.note_off(200);
  render(device, 4.0f, kRate);
  EXPECT(both_peak(render(device, 0.2f, kRate)) == 0.0, "a key struck again and again over a steal: silence after the releases");
  device.note_on(7, static_cast<float>(kC4), 0.8f);
  Stereo next = render(device, 0.2f, kRate);
  other.init(kRate);
  other.note_on(7, static_cast<float>(kC4), 0.8f);
  Stereo clean = render(other, 0.2f, kRate);
  EXPECT(next.left == clean.left && next.right == clean.right, "and the next key is a fresh device's, sample for sample");

  // Forty keys in half a second: bounded, and silent once released.
  device.init(kRate);
  double most = 0.0;
  for (int n = 0; n < 40; ++n) {
    device.note_on(n, 82.4f * std::pow(2.0f, static_cast<float>((n * 7) % 48) / 12.0f), 1.0f);
    most = std::max(most, both_peak(render_samples(device, 600)));
  }
  for (int n = 0; n < 40; ++n) device.note_off(n);
  render(device, 4.0f, kRate);
  std::snprintf(label, sizeof label, "forty keys over twelve voices peak at %.3f (never over 1) and come to silence", most);
  std::printf("%s\n", label);
  EXPECT(most <= 1.0 && both_peak(render(device, 0.2f, kRate)) == 0.0, label);

  // One key is one pair of strings: played forty times, a whole number of
  // its periods apart (so every strike lands in step with the last), it
  // does not pile up, whether each note has a new id or the same one,
  // whether the old note was let go or not. The hammer falling on a string
  // that still rings is worth a few dB at the strike and no more.
  double piled = 0.0;
  for (int mode = 0; mode < 3; ++mode) {
    for (double hz : {kC2, kC4, kC6}) {
      device.init(kRate);
      device.set_param(p::kDecay, 4.0f);
      const float gap = static_cast<float>(std::floor(0.11 * hz + 0.5) / hz);
      double first_peak = 0.0, most_peak = 0.0;
      for (int n = 0; n < 40; ++n) {
        if (mode == 1 && n > 0) device.note_off(n - 1);
        device.note_on(mode == 0 ? 1 : n, static_cast<float>(hz), 0.8f);
        const double level = both_peak(render(device, gap, kRate));
        if (n == 0) first_peak = level;
        most_peak = std::max(most_peak, level);
      }
      piled = std::max(piled, db(most_peak / first_peak));
    }
  }
  std::snprintf(label, sizeof label, "one key struck forty times in step, under one id or forty, let go or held: the loudest strike is %.1f dB over the first (under 5)", piled);
  std::printf("%s\n", label);
  EXPECT(piled < 5.0, label);
  // And another key is left alone: C4 rings on under forty strikes of D4.
  device.init(kRate);
  device.note_on(1, static_cast<float>(kC4), 0.8f);
  for (int n = 0; n < 40; ++n) {
    device.note_on(100 + n, static_cast<float>(kD4), 0.3f);
    render(device, 0.05f, kRate);
  }
  Stereo under = render(device, 0.3f, kRate);
  other.init(kRate);
  other.note_on(1, static_cast<float>(kC4), 0.8f);
  render(other, 2.0f, kRate);
  Stereo alone = render(other, 0.3f, kRate);
  const double kept = db(bin_level(under.left, kRate, kC4, 0, 9600) / bin_level(alone.left, kRate, kC4, 0, 9600));
  std::snprintf(label, sizeof label, "middle C under forty strikes of the D above is %.2f dB from middle C alone (within 0.5)", kept);
  std::printf("%s\n", label);
  EXPECT(std::fabs(kept) < 0.5, label);

  // A key held for ever is not a voice held for ever: the string rings out.
  bare(device, PreparedPiano::kBolts, 0.0f);
  device.note_on(1, static_cast<float>(kC4), 0.8f);
  Stereo long_hold = render(device, 16.0f, kRate);
  size_t last = long_hold.size();
  while (last > 0 && long_hold.left[last - 1] == 0.0f && long_hold.right[last - 1] == 0.0f) --last;
  std::snprintf(label, sizeof label, "middle C held and never released is exact silence after %.1f s (6 to 15)", static_cast<double>(last) / kRate);
  std::printf("%s\n", label);
  EXPECT(last > at(6.0) && last < at(15.0), label);
}

// --- Input no instrument should get -------------------------------------------------------------

static void test_bad_input() {
  const float nan = std::nanf(""), inf = HUGE_VALF;
  device.init(kRate);
  device.note_on(1, nan, 0.8f);
  EXPECT(both_peak(render(device, 0.1f, kRate)) == 0.0, "a key with no frequency is ignored");
  device.note_on(2, inf, 0.8f);
  device.note_on(3, -100.0f, 0.8f);
  device.note_on(4, 0.0f, nan);
  device.note_on(5, 1.0e9f, inf);
  device.note_on(6, 440.0f, -3.0f);
  device.note_off(12345);
  Stereo out = render(device, 0.5f, kRate);
  for (int id = 1; id <= 6; ++id) device.note_off(id);
  Stereo tail = render(device, 5.0f, kRate);
  std::snprintf(label, sizeof label, "frequencies and gains that are no numbers: finite, peak %.3f, silent after release", both_peak(out));
  std::printf("%s\n", label);
  EXPECT(finite(out.left) && finite(out.right) && finite(tail.left) && both_peak(out) <= 1.0 && both_peak(out) > 0.0 &&
             both_peak(render(device, 0.2f, kRate)) == 0.0,
         label);
}

// What the buzz puts back into the strings never comes round to feed the
// buzz: at the loosest, longest, hardest setting no key anywhere rings on
// for it. (Both strings on one pitch and in the middle, so nothing beats.)
static void test_feedback_is_safe() {
  double worst = 0.0, most = -200.0;
  int keys = 0;
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    for (int preparation : {PreparedPiano::kBolts, PreparedPiano::kPaper}) {
      for (int key = 24; key <= 108; key += 3) {
        double level[2][8];
        for (int pass = 0; pass < 2; ++pass) {
          bare(device, preparation, 1.0f, rate);
          device.set_param(p::kRattle, static_cast<float>(pass));
          device.set_param(p::kDecay, 4.0f);
          device.set_param(p::kHammer, 1.0f);
          device.note_on(1, 440.0f * std::pow(2.0f, static_cast<float>(key - 69) / 12.0f), 1.0f);
          for (int half = 0; half < 8; ++half) level[pass][half] = rms(render(device, 0.5f, rate).left);
        }
        for (int half = 1; half < 8; ++half) worst = std::max(worst, level[1][half] / level[1][half - 1]);
        most = std::max(most, db(level[1][7] / level[0][7]));
        ++keys;
      }
    }
  }
  std::snprintf(label, sizeof label, "%d held notes at Amount 1, Rattle 1, Decay 4 (bolts and paper, C1 to C8, three rates): no half second is louder than the one before (at most %.3f of it), and 4 s on the note is at most %.2f dB over the same note with no Rattle",
                keys, worst, most);
  std::printf("%s\n", label);
  EXPECT(worst < 1.0 && most < 1.0, label);
}

// Every knob at random three hundred times while keys are held and struck,
// at 96 kHz: nothing blows up, nothing grows, nothing is left behind.
static void test_random_knobs() {
  const float rate = 96000.0f;
  uint32_t state = 0xC0FFEEu;
  auto draw = [&]() {
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    return static_cast<float>(state >> 8) * (1.0f / 16777216.0f);
  };
  device.init(rate);
  double top = 0.0, early = 0.0, loudest = 0.0;
  bool numbers = true;
  for (int step = 0; step < 300; ++step) {
    for (int id = 0; id < p::kNumParams; ++id) {
      if (id == p::kVolume) continue;  // (the level stays, so growth can be read)
      device.set_param(id, p::kParamMin[id] + draw() * (p::kParamMax[id] - p::kParamMin[id]));
    }
    if (step % 8 == 0) device.note_on(step / 8 % 10, 32.7f * std::pow(2.0f, 7.0f * draw()), 0.5f + 0.5f * draw());
    if (step % 50 == 49) device.note_off(static_cast<int>(10.0f * draw()));
    Stereo out = render(device, 0.05f, rate);
    numbers = numbers && finite(out.left) && finite(out.right);
    top = std::max(top, both_peak(out));
    const double level = rms(out.left) + rms(out.right);
    if (step < 20) early = std::max(early, level);
    loudest = std::max(loudest, level);
  }
  for (int id = 0; id < 10; ++id) device.note_off(id);
  for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, p::kParamDefault[id]);
  render(device, 14.0f, rate);
  const double left_over = both_peak(render(device, 0.2f, rate));
  device.note_on(900, static_cast<float>(kA3), 0.8f);
  Stereo next = render(device, 0.5f, rate);
  other.init(rate);
  other.note_on(900, static_cast<float>(kA3), 0.8f);
  Stereo clean = render(other, 0.5f, rate);
  std::snprintf(label, sizeof label, "every knob at random 300 times under held keys at 96 kHz: peak %.3f, the loudest 50 ms %.1f dB over the first second's (under 10), %g left 14 s after the release, the next key %g from a fresh device's",
                top, db(loudest / early), left_over, largest_difference(next, clean));
  std::printf("%s\n", label);
  EXPECT(numbers && top <= 1.0 && db(loudest / early) < 10.0 && left_over == 0.0 && next.left == clean.left && next.right == clean.right, label);
}

static void test_cost() {
  // The same eight notes the wasm smoke test holds.
  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n) * 3.0f / 12.0f), 0.7f);
  render(device, 1.0f, kRate);
  report_cost("prepared-piano, eight notes held", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });
  // The most it can be asked: every voice buzzing, struck again twice a second.
  device.init(kRate);
  device.set_param(p::kPreparation, static_cast<float>(PreparedPiano::kPaper));
  device.set_param(p::kRattle, 1.0f);
  device.set_param(p::kThud, 1.0f);
  report_cost("prepared-piano, twelve keys struck twice a second", 10.0f, kRate, [&] {
    for (int beat = 0; beat < 20; ++beat) {
      for (int n = 0; n < 12; ++n) device.note_on(n, 55.0f * std::pow(2.0f, static_cast<float>(n) * 3.0f / 12.0f), 1.0f);
      render(device, 0.5f, kRate);
    }
  });
}

int main() {
  Conformance spec;
  spec.name = "prepared-piano";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 4.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);
  test_plain_string();
  test_tuning();
  test_bolts();
  test_rubber();
  test_felt();
  test_buzz();
  test_buzz_goes_back();
  test_mixed();
  test_defaults_show_the_objects();
  test_thud();
  test_hammer();
  test_decay_and_pedal();
  test_detune();
  test_tone_and_width();
  test_velocity();
  test_level();
  test_clicks();
  test_block_size();
  test_wake();
  test_voices();
  test_bad_input();
  test_feedback_is_safe();
  test_random_knobs();
  test_cost();
  return finish("prepared-piano");
}
