// Native harness for Melt (cpp/devices/melt). The conformance pass covers
// stability, silence when idle, block-size independence on continuous sound
// and parameter abuse; the rest asserts what makes it a melt: the tail's
// pitch, level and colour are functions of how long the sound has rung.

#include "../devices/melt/melt.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Melt;
namespace p = livemix::melt;

static Melt device;

static const float kRate = 48000.0f;

// From melt.h: the shortest line at Size's middle scale and its allpass,
// the scales at the two ends of Size, and where that line's head starts (a
// share of its travel, itself a share of the line).
static const float kShortestLine = 0.0437f;
static const float kShortestAllpass = 0.0071f;
static const float kMinScale = 0.45f;
static const float kMaxScale = 4.5f;
static const float kStartShare = 0.15f * 0.4f;

// When the first repeat of a click comes out, in frames: the shortest line
// at that Size with its head where it starts, and its allpass.
static double first_repeat(float size) {
  const double scale = kMinScale * std::pow(kMaxScale / kMinScale, size);
  return (kShortestLine * scale * (1.0 + kStartShare) + kShortestAllpass) * kRate;
}

// A tone under a Hann window, then silence up to `total` seconds.
static std::vector<float> burst(float hz, float seconds, float total, float gain) {
  std::vector<float> x = sine(hz, seconds, kRate, gain);
  const size_t half = x.size() / 2;
  for (size_t i = 0; i < half; ++i) {
    const float w = 0.5f - 0.5f * static_cast<float>(std::cos(kPi * static_cast<double>(i) / half));
    x[i] *= w;
    x[x.size() - 1 - i] *= w;
  }
  x.resize(static_cast<size_t>(total * kRate), 0.0f);
  return x;
}

// Where the sound is, in cents from `f0`: the power-weighted mean over
// [lo, hi] cents, and (optionally) how far it spreads round that mean.
static double centre_cents(const std::vector<float>& x, double f0, double lo, double hi, size_t from,
                           size_t to, double* spread = nullptr) {
  double sum = 0.0, weight = 0.0, squares = 0.0;
  for (double c = lo; c <= hi; c += 2.0) {
    const double level = tone_level(x, f0 * std::pow(2.0, c / 1200.0), kRate, from, to);
    sum += c * level * level;
    squares += c * c * level * level;
    weight += level * level;
  }
  if (!(weight > 0.0)) return 0.0;
  const double centre = sum / weight;
  if (spread) *spread = std::sqrt(std::max(0.0, squares / weight - centre * centre));
  return centre;
}

struct Slide {
  double slope;   // cents a second, by least squares over the windows
  double offset;  // cents at age 0 on that line
  double worst;   // furthest a window lies from Sag x (age - Solid)
};

// The tail of a short 880 Hz tone, all wet: where its pitch is at each age,
// in half-second windows from half a second after Solid, both sides. (The
// four lines ring a short tone a few cents to either side of its pitch,
// differently at every frequency and Size: a still tail reads up to 10
// cents off, and so does each window here.)
static Slide slide_of(Melt& d, float sag, float solid_ms, bool print = false) {
  const float f0 = 880.0f;
  const float length = 0.2f;
  const float solid = solid_ms * 0.001f;
  Stereo out = run(d, burst(f0, length, 6.5f + solid, 0.5f));
  double n = 0, st = 0, sc = 0, stt = 0, stc = 0, worst = 0;
  for (float age = solid + 0.5f; age <= solid + 4.6f; age += 0.5f) {
    const float mid = length / 2 + age;
    const size_t from = static_cast<size_t>((mid - 0.25f) * kRate);
    const size_t to = static_cast<size_t>((mid + 0.25f) * kRate);
    const double want = sag * (age - solid);
    const double cents = 0.5 * (centre_cents(out.left, f0, want - 150.0, want + 150.0, from, to) +
                                centre_cents(out.right, f0, want - 150.0, want + 150.0, from, to));
    if (print) std::printf("    age %.1f s: %7.1f ct (Sag says %7.1f)\n", age, cents, want);
    worst = std::max(worst, std::fabs(cents - want));
    n += 1;
    st += age;
    sc += cents;
    stt += age * age;
    stc += age * cents;
  }
  Slide s;
  s.slope = (n * stc - st * sc) / (n * stt - st * st);
  s.offset = (sc - s.slope * st) / n;
  s.worst = worst;
  return s;
}

// All wet, nothing that colours or wanders: the settings most checks start from.
static void plain(Melt& d) {
  d.init(kRate);
  d.set_param(p::kSag, 0.0f);
  d.set_param(p::kSolid, 0.0f);
  d.set_param(p::kDim, 0.0f);
  d.set_param(p::kDrip, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

static size_t first_above(const std::vector<float>& x, double level) {
  for (size_t i = 0; i < x.size(); ++i) {
    if (std::fabs(x[i]) > level) return i;
  }
  return x.size();
}

// The share of the signal's energy under `hz`: four one-pole low-passes in a row.
static double energy_below(const std::vector<float>& x, double hz, size_t from, size_t to) {
  const double a = std::exp(-2.0 * kPi * hz / kRate);
  double s[4] = {0.0, 0.0, 0.0, 0.0}, low = 0.0, total = 0.0;
  for (size_t i = 0; i < to && i < x.size(); ++i) {
    double v = x[i];
    for (double& state : s) {
      state = v + (state - v) * a;
      v = state;
    }
    if (i < from) continue;
    low += v * v;
    total += static_cast<double>(x[i]) * x[i];
  }
  return total > 0.0 ? low / total : 0.0;
}

// How much of [from, to) has sound in it: the share of 2 ms windows within
// 40 dB of the loudest one. A few separate repeats leave most of them empty.
static double filled(const std::vector<float>& x, size_t from, size_t to) {
  const size_t window = 96;
  double loudest = 0.0;
  for (size_t at = from; at + window <= to; at += window) loudest = std::max(loudest, rms(x, at, at + window));
  size_t count = 0, all = 0;
  for (size_t at = from; at + window <= to; at += window) {
    ++all;
    if (rms(x, at, at + window) > 0.01 * loudest) ++count;
  }
  return all ? static_cast<double>(count) / static_cast<double>(all) : 0.0;
}

// The largest second difference: a break in a smooth wave stands out here
// far more than in the step from one sample to the next.
static double max_bend(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  double worst = 0.0;
  for (size_t i = from + 2; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 2.0 * x[i - 1] + x[i - 2]));
  }
  return worst;
}

// Noise with its top taken off (a one-pole low-pass near 1.7 kHz), so that
// what the interpolated reads take off the very top is not in it.
static std::vector<float> soft_noise(float seconds, float gain, uint32_t seed) {
  rng_state() = seed;
  std::vector<float> x = noise(seconds, kRate, gain);
  double low = 0.0;
  for (float& v : x) {
    low += 0.2 * (v - low);
    v = static_cast<float>(low);
  }
  return x;
}

static double level_db(const Stereo& s, size_t from, size_t to) {
  const double l = rms(s.left, from, to), r = rms(s.right, from, to);
  return db(std::sqrt(0.5 * (l * l + r * r)));
}

static double worst_difference(const Stereo& a, const Stereo& b) {
  double worst = 0.0;
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

// A phrase with a silence in it at one block size. With `move`, knobs are
// moved in the silence, which puts a block boundary there; without, the
// phrase is one stretch of blocks and the second note starts inside one, as
// it does in a host.
static Stereo phrase(Melt& d, float gap_seconds, int block, bool move) {
  d.init(kRate);
  d.set_param(p::kHold, 0.4f);
  d.set_param(p::kSolid, 30.0f);
  d.set_param(p::kDrip, 1.0f);
  d.set_param(p::kSag, -80.0f);
  std::vector<float> first = burst(330.0f, 0.3f, 0.3f + gap_seconds, 0.5f);
  std::vector<float> second = burst(440.0f, 0.3f, 1.0f, 0.5f);
  if (!move) {
    first.insert(first.end(), second.begin(), second.end());
    return run(d, first, block);
  }
  Stereo a = run(d, first, block);
  // Moved in the silence: asleep, they are there at once; awake, they glide.
  d.set_param(p::kMix, 0.9f);
  d.set_param(p::kSize, 0.6f);
  d.set_param(p::kSag, 60.0f);
  Stereo b = run(d, second, block);
  return concat(a, b);
}

int main() {
  Conformance spec;
  spec.name = "melt";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 18.0f;
  spec.max_peak = 5.0f;
  check_effect(device, spec, kRate);

  // Mix 0 is the input, sample for sample, while the tail rings on unheard.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    rng_state() = 0xD1CEu;
    std::vector<float> left = noise(1.0f, kRate, 0.7f);
    std::vector<float> right = sine(311.0f, 1.0f, kRate, 0.9f);
    Stereo out = run(device, left, right);
    EXPECT(out.left == left && out.right == right, "Mix 0 is the input, sample for sample");
  }

  // Sag 0 leaves the pitch still.
  {
    plain(device);
    Slide still = slide_of(device, 0.0f, 0.0f);
    std::printf("  Sag 0: %.2f ct/s, worst window %.1f ct off\n", still.slope, still.worst);
    EXPECT(std::fabs(still.slope) < 1.5, "Sag 0 leaves the pitch of the tail where it was");
    EXPECT(still.worst < 10.0, "Sag 0: the tail is at the pitch that was played");
  }

  // The tail falls in pitch with age at the rate Sag says, and rises for the other sign.
  {
    plain(device);
    device.set_param(p::kSag, -60.0f);
    Slide down = slide_of(device, -60.0f, 0.0f, true);
    std::printf("  Sag -60: %.2f ct/s, worst window %.1f ct off\n", down.slope, down.worst);
    EXPECT_NEAR(down.slope, -60.0, 4.0, "the tail sinks at the rate Sag says");
    EXPECT(down.worst < 16.0, "Sag -60: every window lies on Sag x age");

    plain(device);
    device.set_param(p::kSag, 60.0f);
    Slide up = slide_of(device, 60.0f, 0.0f);
    std::printf("  Sag +60: %.2f ct/s, worst window %.1f ct off\n", up.slope, up.worst);
    EXPECT_NEAR(up.slope, 60.0, 4.0, "the tail rises at the rate Sag says");
    EXPECT(up.worst < 16.0, "Sag +60: every window lies on Sag x age");

    plain(device);
    device.set_param(p::kSag, -15.0f);
    Slide slow = slide_of(device, -15.0f, 0.0f);
    std::printf("  Sag -15: %.2f ct/s\n", slow.slope);
    EXPECT_NEAR(slow.slope, -15.0, 2.0, "a slow Sag is a slow slide");
  }

  // The slide is a function of age at every Size: the lines differ sixfold
  // in length and the rate does not move.
  for (float size : {0.0f, 1.0f}) {
    plain(device);
    device.set_param(p::kSag, -100.0f);
    device.set_param(p::kSize, size);
    Slide s = slide_of(device, -100.0f, 0.0f);
    std::printf("  Sag -100 at Size %.0f: %.2f ct/s\n", size, s.slope);
    EXPECT_NEAR(s.slope, -100.0, 6.0, "Sag is cents a second whatever the Size");
  }

  // Solid: nothing of the tail is heard, and nothing slides, until it has passed.
  {
    size_t onset[2];
    int k = 0;
    for (float solid : {0.0f, 500.0f}) {
      plain(device);
      device.set_param(p::kSolid, solid);
      device.set_param(p::kBlur, 0.0f);
      Stereo out = run(device, impulse(1.5f, kRate, 0.5f));
      onset[k++] = first_above(out.left, 1.0e-3);
    }
    std::printf("  onset %zu and %zu frames\n", onset[0], onset[1]);
    EXPECT_NEAR(static_cast<double>(onset[0]), first_repeat(0.35f), 4.0, "Solid 0: the tail starts one line after the sound");
    EXPECT_NEAR(static_cast<double>(onset[1]) - static_cast<double>(onset[0]), 0.5 * kRate, 4.0,
                "Solid delays the onset of the tail by its time");

    plain(device);
    device.set_param(p::kSag, -60.0f);
    device.set_param(p::kSolid, 1000.0f);
    Slide late = slide_of(device, -60.0f, 1000.0f);
    std::printf("  Sag -60 after Solid 1000: %.2f ct/s, worst window %.1f ct off\n", late.slope, late.worst);
    EXPECT_NEAR(late.slope, -60.0, 4.0, "after Solid the tail sinks at the rate Sag says");
    EXPECT(late.worst < 16.0, "the slide starts where Solid ends");
  }

  // Hold is the time the tail takes to fall 60 dB, sliding or not.
  {
    for (float hold : {1.5f, 6.0f}) {
      for (float sag : {0.0f, -60.0f, 60.0f}) {
        plain(device);
        device.set_param(p::kHold, hold);
        device.set_param(p::kSag, sag);
        rng_state() = 0xC0FFEEu;
        std::vector<float> in = noise(0.1f, kRate, 0.5f);
        // Band-limited so that what Hermite takes off the top is not in it.
        double low = 0.0;
        for (float& v : in) {
          low += 0.2 * (v - low);
          v = static_cast<float>(low);
        }
        in.resize(static_cast<size_t>((hold * 0.9f + 0.5f) * kRate), 0.0f);
        Stereo out = run(device, in);
        const double measured = rt60(out.left, kRate, 0.3, 0.1, -80.0);
        std::printf("  Hold %.1f s at Sag %+.0f: %.2f s\n", hold, sag, measured);
        EXPECT_NEAR(measured, hold, 0.2 * hold, "Hold is the tail's time to -60 dB");
      }
    }
  }

  // Dim: a sinking tail loses its highs with age, a rising one its lows.
  {
    double high_late[2], low_late[2];
    int k = 0;
    for (float dim : {0.0f, 0.8f}) {
      plain(device);
      device.set_param(p::kSag, -40.0f);
      device.set_param(p::kDim, dim);
      rng_state() = 0xFACEu;
      std::vector<float> in = noise(0.1f, kRate, 0.5f);
      in.resize(static_cast<size_t>(3.0f * kRate), 0.0f);
      Stereo out = run(device, in);
      const double early = energy_above(out.left, 3000.0, kRate, 4800, 24000);
      const double late = energy_above(out.left, 3000.0, kRate, 72000, 120000);
      std::printf("  sinking, Dim %.1f: share above 3 kHz %.3f early, %.4f late\n", dim, early, late);
      high_late[k++] = late / early;
    }
    EXPECT(high_late[1] < 0.2 * high_late[0], "Dim darkens a sinking tail as it ages");

    k = 0;
    for (float dim : {0.0f, 0.8f}) {
      plain(device);
      device.set_param(p::kSag, 40.0f);
      device.set_param(p::kDim, dim);
      rng_state() = 0xFACEu;
      std::vector<float> in = noise(0.1f, kRate, 0.5f);
      in.resize(static_cast<size_t>(3.0f * kRate), 0.0f);
      Stereo out = run(device, in);
      const double early = energy_below(out.left, 150.0, 4800, 24000);
      const double late = energy_below(out.left, 150.0, 72000, 120000);
      std::printf("  rising, Dim %.1f: share below 150 Hz %.5f early, %.6f late\n", dim, early, late);
      low_late[k++] = late / early;
    }
    EXPECT(low_late[1] < 0.2 * low_late[0], "Dim thins a rising tail as it ages");
  }

  // Blur: the repeats of a click stay distinct at 0 and run together at 1.
  {
    double share[2];
    int k = 0;
    for (float blur : {0.0f, 1.0f}) {
      plain(device);
      device.set_param(p::kBlur, blur);
      Stereo out = run(device, impulse(1.0f, kRate, 0.5f));
      share[k] = filled(out.left, 2400, 14400);
      std::printf("  Blur %.0f: %.2f of the first 300 ms has sound in it\n", blur, share[k]);
      ++k;
    }
    EXPECT(share[0] < 0.35, "Blur 0: the repeats of a click stay apart");
    EXPECT(share[1] > 0.75, "Blur 1: the repeats run together");
  }

  // Drip: the slide runs fast and slow, and the device says how fast it runs
  // now. The pitch of the tail at any age is Sag times the rate it reported,
  // added up since the sound came in: what the display draws from the meter
  // is what is heard.
  {
    for (float drip : {0.0f, 1.0f}) {
      plain(device);
      device.set_param(p::kSag, -60.0f);
      device.set_param(p::kDrip, drip);
      const float f0 = 880.0f;
      const float length = 0.2f;
      std::vector<float> in = burst(f0, length, 5.0f, 0.5f);
      Stereo out;
      out.left.resize(in.size());
      out.right.resize(in.size());
      std::vector<double> fallen;  // rate added up over the blocks, in seconds
      double sum = 0.0;
      float low = 10.0f, high = -10.0f;
      for (size_t done = 0; done < in.size(); done += kBlock) {
        for (int i = 0; i < kBlock; ++i) device.in_left()[i] = device.in_right()[i] = in[done + i];
        device.process(kBlock);
        for (int i = 0; i < kBlock; ++i) {
          out.left[done + i] = device.out_left()[i];
          out.right[done + i] = device.out_right()[i];
        }
        const float rate = 1.0f + device.meter(0);
        EXPECT(rate == 1.0f + device.meter(0), "meter() reads and changes nothing");
        low = std::min(low, rate);
        high = std::max(high, rate);
        sum += rate * kBlock / kRate;
        fallen.push_back(sum);
      }
      double worst = 0.0, straight = 0.0;
      for (float age = 0.5f; age <= 4.1f; age += 0.5f) {
        const float mid = length / 2 + age;
        const size_t from = static_cast<size_t>((mid - 0.25f) * kRate);
        const size_t to = static_cast<size_t>((mid + 0.25f) * kRate);
        // The rate added up from the middle of the tone to the middle of the window.
        const double told = -60.0 * (fallen[static_cast<size_t>(mid * kRate) / kBlock] -
                                     fallen[static_cast<size_t>(length / 2 * kRate) / kBlock]);
        const double cents = 0.5 * (centre_cents(out.left, f0, told - 150.0, told + 150.0, from, to) +
                                    centre_cents(out.right, f0, told - 150.0, told + 150.0, from, to));
        worst = std::max(worst, std::fabs(cents - told));
        straight = std::max(straight, std::fabs(told - (-60.0 * age)));
      }
      std::printf("  Drip %.0f: rate %.2f..%.2f; the tail is within %.1f ct of the rate added up, which strays %.1f ct from a straight fall\n",
                  drip, low, high, worst, straight);
      EXPECT(worst < 20.0, "the tail's pitch is Sag times the rate the device reports, added up");
      if (drip == 0.0f) {
        EXPECT(low == 1.0f && high == 1.0f, "Drip 0: the tail slides at the rate set");
      } else {
        EXPECT(low < 0.6f && high > 1.4f && low >= 0.0f && high <= 2.0f, "Drip 1: the rate wanders between none and twice");
        EXPECT(straight > 40.0, "Drip 1: the fall strays from a straight line");
      }
    }
  }

  // Width: the tail is the same on both sides at 0 and apart at 1.
  {
    plain(device);
    device.set_param(p::kWidth, 0.0f);
    rng_state() = 0xABCDu;
    Stereo narrow = run(device, noise(2.0f, kRate, 0.3f));
    EXPECT(narrow.left == narrow.right, "Width 0: the tail is in the centre");
    plain(device);
    device.set_param(p::kWidth, 1.0f);
    rng_state() = 0xABCDu;
    Stereo wide = run(device, noise(2.0f, kRate, 0.3f));
    const double alike = correlation(wide.left, wide.right, 24000, 96000);
    std::printf("  Width 1: sides alike by %.2f\n", alike);
    EXPECT(std::fabs(alike) < 0.35, "Width 1: the two sides are not alike");
  }

  // Size: the first repeat comes a line after the sound, and the lines grow tenfold.
  {
    size_t onset[2];
    int k = 0;
    for (float size : {0.0f, 1.0f}) {
      plain(device);
      device.set_param(p::kSize, size);
      device.set_param(p::kBlur, 0.0f);
      Stereo out = run(device, impulse(1.0f, kRate, 0.5f));
      onset[k++] = first_above(out.left, 1.0e-3);
    }
    std::printf("  Size 0 and 1: first repeat at %zu and %zu frames\n", onset[0], onset[1]);
    EXPECT_NEAR(static_cast<double>(onset[0]), first_repeat(0.0f), 4.0, "Size 0: the first repeat comes 28 ms after the sound");
    EXPECT_NEAR(static_cast<double>(onset[1]), first_repeat(1.0f), 4.0, "Size 1: the first repeat comes 216 ms after the sound");
  }

  // Level: unity for the dry path, and the mix as it starts is not louder than what goes in.
  {
    device.init(kRate);
    rng_state() = 0xBEEFu;
    std::vector<float> in = noise(8.0f, kRate, 0.25f);
    Stereo out = run(device, in);
    const double gain_noise = db(rms(out.left, 96000, in.size())) - db(rms(in, 96000, in.size()));
    device.init(kRate);
    std::vector<float> tone = sine(220.0f, 8.0f, kRate, 0.25f);
    out = run(device, tone);
    const double gain_tone = db(rms(out.left, 96000, tone.size())) - db(rms(tone, 96000, tone.size()));
    std::printf("  at defaults: noise %+.1f dB, a held tone %+.1f dB\n", gain_noise, gain_tone);
    EXPECT(gain_noise > -3.0 && gain_noise < 3.0, "defaults: noise comes out as loud as it went in");
    EXPECT(gain_tone > -3.0 && gain_tone < 3.5, "defaults: a held tone is not made louder by more than a few dB");
  }

  // Bounded at every Hold: a full-scale tone held for longer than the longest tail.
  for (float hold : {0.4f, 5.0f, 20.0f}) {
    for (float sag : {-100.0f, 0.0f, 100.0f}) {
      device.init(kRate);
      device.set_param(p::kHold, hold);
      device.set_param(p::kSag, sag);
      device.set_param(p::kMix, 1.0f);
      Stereo out = run(device, sine(110.0f, 24.0f, kRate, 1.0f));
      Stereo square = run(device, std::vector<float>(48000, 1.0f));
      const double top = std::max(std::max(peak(out.left), peak(out.right)), std::max(peak(square.left), peak(square.right)));
      if (hold == 20.0f) std::printf("  Hold 20 at Sag %+.0f, full scale: peak %.2f\n", sag, top);
      EXPECT(finite(out.left) && finite(out.right) && finite(square.left) && top < 5.0, "the loop is bounded at every Hold");
    }
  }

  // Bad input: not a number, infinite and absurd samples leave no trace once good input returns.
  {
    device.init(kRate);
    device.set_param(p::kHold, 20.0f);
    std::vector<float> bad = sine(220.0f, 0.5f, kRate, 0.5f);
    for (size_t i = 1000; i < 1400; ++i) bad[i] = std::nanf("");
    for (size_t i = 3000; i < 3400; ++i) bad[i] = i % 2 ? INFINITY : -INFINITY;
    for (size_t i = 6000; i < 6400; ++i) bad[i] = i % 3 ? 1.0e30f : -1.0e30f;
    Stereo during = run(device, bad);
    Stereo after = run(device, sine(220.0f, 2.0f, kRate, 0.5f));
    EXPECT(finite(during.left) && finite(during.right), "bad input never leaves the device as a bad sample");
    EXPECT(finite(after.left) && finite(after.right) && peak(after.left) < 2.0, "bad input: finite and in range once good input returns");
    device.set_param(p::kHold, 0.4f);
    render(device, 6.0f, kRate);
    Stereo rest = render(device, 0.5f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "bad input: the tail it left dies away and the device sleeps");
    device.init(kRate);
    Stereo clean = run(device, sine(220.0f, 0.5f, kRate, 0.5f));
    device.init(kRate);
    run(device, std::vector<float>(64, std::nanf("")));
    render(device, 20.0f, kRate);
    Stereo again = run(device, sine(220.0f, 0.5f, kRate, 0.5f));
    EXPECT(worst_difference(clean, again) < 1.0e-6, "bad input: nothing is stuck afterwards");
  }

  // Moving a knob while a tone sounds does not click: the largest step is
  // held against the same render with no knob moved, at the setting it left
  // and at the one it went to.
  {
    struct Move {
      int id;
      float from, to;
      const char* name;
    };
    const Move moves[] = {
        {p::kSag, -30.0f, 100.0f, "Sag"},  {p::kHold, 5.0f, 0.4f, "Hold"},   {p::kSolid, 120.0f, 400.0f, "Solid"},
        {p::kSize, 0.35f, 0.8f, "Size"},   {p::kBlur, 0.0f, 1.0f, "Blur"},   {p::kDim, 0.0f, 1.0f, "Dim"},
        {p::kDrip, 0.0f, 1.0f, "Drip"},    {p::kWidth, 1.0f, 0.0f, "Width"}, {p::kMix, 0.4f, 1.0f, "Mix"},
        {p::kMix, 1.0f, 0.0f, "Mix to 0"},
    };
    for (const Move& move : moves) {
      // 0: stays at `from`; 1: at `to` from the start; 2: moved while sounding.
      double step[3];
      for (int which = 0; which < 3; ++which) {
        device.init(kRate);
        device.set_param(move.id, which == 1 ? move.to : move.from);
        run(device, sine(220.0f, 1.5f, kRate, 0.5f));
        if (which == 2) device.set_param(move.id, move.to);
        // 220 Hz at 48 kHz: the tone carries on in phase after 1.5 s.
        Stereo out = run(device, sine(220.0f, 1.0f, kRate, 0.5f));
        step[which] = std::max(max_step(out.left), max_step(out.right));
      }
      const double reference = std::max(step[0], step[1]);
      std::printf("  %s moved: largest step %.4f (unmoved %.4f)\n", move.name, step[2], reference);
      char label[96];
      std::snprintf(label, sizeof label, "moving %s while sounding does not click", move.name);
      // Solid and Size move the read points, which bends the pitch for a
      // moment: a steeper wave, not a break in it.
      const bool bends = move.id == p::kSolid || move.id == p::kSize;
      EXPECT(step[2] < reference * (bends ? 1.6 : 1.3) + 0.002, label);
    }
  }

  // The same at block sizes 1, 128 and 2048, also across a silence long
  // enough to sleep, short enough not to, and every length between: the gap
  // is stepped across the moment the device falls asleep, with and without
  // knobs moved in it.
  {
    double worst = 0.0;
    // Hold 0.4 s reaches the idle floor after about a second; the device
    // then waits out its longest silence (1.55 s) before it sleeps.
    for (const bool move : {false, true}) {
      int step = 0;
      for (float gap = 2.0f; gap < 3.1f; gap += 0.011f, ++step) {
        Stereo reference = phrase(device, gap, 128, move);
        worst = std::max(worst, worst_difference(reference, phrase(device, gap, 2048, move)));
        if (step % 9 == 0) worst = std::max(worst, worst_difference(reference, phrase(device, gap, 1, move)));
      }
      for (float gap : {0.05f, 0.4f, 1.3f, 6.0f}) {
        Stereo reference = phrase(device, gap, 128, move);
        worst = std::max(worst, worst_difference(reference, phrase(device, gap, 2048, move)));
        worst = std::max(worst, worst_difference(reference, phrase(device, gap, 1, move)));
        worst = std::max(worst, worst_difference(reference, phrase(device, gap, 37, move)));
      }
    }
    std::printf("  block sizes across a silence: largest difference %g\n", worst);
    EXPECT(worst < 1.0e-6, "the same at every block size, also across a sleep");
  }

  // A knob moved while the device sleeps is there when sound returns: no glide.
  {
    device.init(kRate);
    device.set_param(p::kHold, 0.4f);
    run(device, burst(330.0f, 0.2f, 0.2f, 0.5f));
    render(device, 6.0f, kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kSolid, 0.0f);
    device.set_param(p::kHold, 5.0f);
    device.set_param(p::kSize, 0.7f);
    Stereo moved = run(device, burst(440.0f, 0.2f, 1.0f, 0.5f));
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kSolid, 0.0f);
    device.set_param(p::kHold, 5.0f);
    device.set_param(p::kSize, 0.7f);
    Stereo fresh = run(device, burst(440.0f, 0.2f, 1.0f, 0.5f));
    const double apart = worst_difference(moved, fresh);
    std::printf("  knobs moved asleep against set from the start: %g apart\n", apart);
    EXPECT(apart < 1.0e-5, "knobs moved while asleep snap on wake");
  }

  // The device sleeps: after the tail it does no work and returns exact zero.
  {
    device.init(kRate);
    run(device, noise(0.2f, kRate, 0.5f));
    render(device, 18.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail");
    EXPECT(device.meter(0) == 0.0f, "asleep, the wander meter rests at 0");
    Stereo woken = run(device, impulse(1.0f, kRate, 0.5f));
    EXPECT(peak(woken.left, 6000, 24000) > 0.003, "wakes on new input");
  }


  // ---- What the second check found, each as a check that failed before ----

  // Hold and Size are not volume knobs: steady sound comes out of the tail
  // as loud as it went in at every Hold and Size. (As built the tail ran
  // from 42 dB under to 9 dB over.)
  {
    double low = 1.0e9, high = -1.0e9;
    for (float hold : {0.4f, 2.5f, 20.0f}) {
      for (float size : {0.0f, 0.35f, 1.0f}) {
        plain(device);
        device.set_param(p::kSag, -30.0f);
        device.set_param(p::kHold, hold);
        device.set_param(p::kSize, size);
        std::vector<float> in = soft_noise(9.0f, 0.3f, 0xA11CEu);
        Stereo out = run(device, in);
        const double gain = level_db(out, 6 * 48000, 9 * 48000) - db(rms(in, 6 * 48000, 9 * 48000));
        low = std::min(low, gain);
        high = std::max(high, gain);
      }
    }
    std::printf("  steady noise through the tail alone, Hold 0.4..20 x Size 0..1: %+.2f..%+.2f dB\n", low, high);
    EXPECT(low > -1.5 && high < 1.5, "the tail is as loud as what went in at every Hold and Size");
  }

  // The same sound on both inputs comes out as loud on the left as on the
  // right (as built the tail leant left, by 3 dB at a short Hold and a
  // large Size), and Width does not turn the tail up or down.
  {
    plain(device);
    device.set_param(p::kSag, -30.0f);
    device.set_param(p::kHold, 0.4f);
    device.set_param(p::kSize, 1.0f);
    std::vector<float> in = soft_noise(8.0f, 0.3f, 0xB0B0u);
    Stereo out = run(device, in);
    const double lean = db(rms(out.left, 96000, in.size())) - db(rms(out.right, 96000, in.size()));
    std::printf("  one sound on both inputs, Hold 0.4 Size 1: left %+.2f dB against right\n", lean);
    EXPECT(std::fabs(lean) < 1.0, "the tail does not lean to one side");

    double level[2];
    int k = 0;
    for (float width : {0.0f, 1.0f}) {
      plain(device);
      device.set_param(p::kSag, -30.0f);
      device.set_param(p::kWidth, width);
      Stereo wide = run(device, in);
      level[k++] = level_db(wide, 96000, in.size());
    }
    std::printf("  Width 0 against Width 1: %+.2f dB\n", level[0] - level[1]);
    EXPECT(std::fabs(level[0] - level[1]) < 1.0, "Width does not change how loud the tail is");
  }

  // A head that has used up its travel hands over without a click: each
  // head brings its own level into the fade. (As built the line's level
  // stepped with the head: 4 to 13 times the wave's own steepest step.)
  {
    struct Case {
      float sag, hold, size;
    };
    for (const Case& c : {Case{-100.0f, 0.4f, 0.0f}, Case{100.0f, 0.4f, 0.0f}, Case{100.0f, 2.5f, 1.0f}}) {
      plain(device);
      device.set_param(p::kSag, c.sag);
      device.set_param(p::kHold, c.hold);
      device.set_param(p::kSize, c.size);
      device.set_param(p::kBlur, 0.0f);
      Stereo out = run(device, sine(220.0f, 20.0f, kRate, 0.5f));
      // A tone of this height and size bends by (2 pi f / rate)^2 of its
      // peak from sample to sample to sample, and no more.
      const double own = std::pow(2.0 * kPi * 220.0 * 1.06 / kRate, 2.0);
      const double bend = std::max(max_bend(out.left, 48000), max_bend(out.right, 48000)) /
                          std::max(peak(out.left, 48000), peak(out.right, 48000));
      std::printf("  Sag %+.0f Hold %.1f Size %.0f, 20 s of a tone: largest bend %.1f times the tone's own\n", c.sag, c.hold, c.size, bend / own);
      EXPECT(bend < 6.0 * own, "the handover from one head to the next does not click");
    }
  }

  // With Sag at 0 a held note that falls on one of the network's own
  // pitches does not pile up over its neighbours. (As built the loudest of
  // these notes came out 10 dB over their mean and 7 dB over the note.)
  {
    double sum = 0.0, loudest = -1.0e9;
    int count = 0;
    for (int note = 45; note < 69; ++note) {
      device.init(kRate);
      device.set_param(p::kSag, 0.0f);
      device.set_param(p::kHold, 4.0f);
      device.set_param(p::kSolid, 40.0f);
      device.set_param(p::kBlur, 0.8f);
      device.set_param(p::kDim, 0.2f);
      device.set_param(p::kDrip, 0.0f);
      device.set_param(p::kMix, 1.0f);
      const float hz = 440.0f * std::pow(2.0f, (note - 69) / 12.0f);
      std::vector<float> tone = sine(hz, 6.0f, kRate, 0.5f);
      Stereo out = run(device, tone);
      const double gain = level_db(out, 3 * 48000, 6 * 48000) - db(rms(tone, 3 * 48000, 6 * 48000));
      sum += std::pow(10.0, gain / 10.0);
      loudest = std::max(loudest, gain);
      ++count;
    }
    const double mean_db = 10.0 * std::log10(sum / count);
    std::printf("  Sag 0, two octaves of held notes through the tail alone: mean %+.2f dB, loudest %+.2f dB\n", mean_db, loudest);
    EXPECT(loudest < 1.6, "a held note on one of the network's pitches is held to the level of what went in");
    EXPECT(loudest - mean_db < 4.5, "no held note stands far out of its neighbours");
  }

  // A steady offset on the input does not gather in the tail. (As built
  // 0.02 of it came out as 0.55 at the longest Hold.)
  {
    plain(device);
    device.set_param(p::kHold, 20.0f);
    std::vector<float> in = sine(220.0f, 14.0f, kRate, 0.3f);
    for (float& v : in) v += 0.02f;
    Stereo out = run(device, in);
    const double offset = std::max(std::fabs(mean(out.left, 8 * 48000, 14 * 48000)), std::fabs(mean(out.right, 8 * 48000, 14 * 48000)));
    std::printf("  0.02 of offset into Hold 20: %.5f comes out\n", offset);
    EXPECT(offset < 0.004, "a steady offset does not pile up in the tail");
  }

  // Hold and Solid moved while a tone sounds: no steps on the control clock,
  // no burst of sped-up sound. (As built a move of Hold bent the wave 5
  // times as sharply as the tone itself and a move of Solid 14 to 26 times.)
  {
    struct Move {
      int id;
      float from, to;
      const char* name;
    };
    for (const Move& move : {Move{p::kHold, 0.4f, 20.0f, "Hold"}, Move{p::kSolid, 0.0f, 1000.0f, "Solid"}, Move{p::kSolid, 1000.0f, 0.0f, "Solid back"}}) {
      double bend[3], top[3];
      for (int which = 0; which < 3; ++which) {
        device.init(kRate);
        device.set_param(move.id, which == 1 ? move.to : move.from);
        run(device, sine(220.0f, 2.5f, kRate, 0.5f));
        if (which == 2) device.set_param(move.id, move.to);
        Stereo out = run(device, sine(220.0f, 1.5f, kRate, 0.5f));
        bend[which] = std::max(max_bend(out.left), max_bend(out.right));
        top[which] = std::max(peak(out.left), peak(out.right));
      }
      const double reference = std::max(bend[0], bend[1]);
      std::printf("  %s moved: largest bend %.5f (unmoved %.5f)\n", move.name, bend[2], reference);
      char label[96];
      std::snprintf(label, sizeof label, "moving %s while sounding leaves the wave smooth", move.name);
      // (The glide starts with a change of slope, which is a bend of a few
      // times the tone's own and no step.)
      EXPECT(bend[2] < 4.0 * reference, label);
      EXPECT(top[2] < 1.5 * std::max(top[0], top[1]), "and makes nothing louder than it was");
    }
  }

  // Hold turned from the longest to the shortest while a loud chord sounds:
  // the level follows what the lines hold, so the sound that piled up for
  // 20 s is not turned up at once; and whatever the knobs do, the tail is
  // bounded.
  {
    double top[2];
    for (int which = 0; which < 2; ++which) {
      device.init(kRate);
      device.set_param(p::kMix, 1.0f);
      device.set_param(p::kHold, 20.0f);
      run(device, sine(220.0f, 6.0f, kRate, 0.9f), sine(277.0f, 6.0f, kRate, 0.9f));
      if (which == 1) device.set_param(p::kHold, 0.4f);
      Stereo out = run(device, sine(220.0f, 1.0f, kRate, 0.9f), sine(277.0f, 1.0f, kRate, 0.9f));
      top[which] = std::max(peak(out.left), peak(out.right));
    }
    std::printf("  Hold 20 to 0.4 under a loud tone: peak %.2f (unmoved %.2f)\n", top[1], top[0]);
    EXPECT(top[1] < 1.4 * top[0] + 0.1, "shortening Hold does not turn up what has piled up");

    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    rng_state() = 0x1002u;
    double worst = 0.0;
    bool all_finite = true;
    for (int step = 0; step < 60; ++step) {
      for (int id = 0; id < p::kNumParams; ++id) {
        if (id == p::kMix) continue;
        const float u = 0.5f * (white() + 1.0f);
        const float place = white() > 0.0f ? (u > 0.5f ? 1.0f : 0.0f) : u;
        device.set_param(id, p::kParamMin[id] + (p::kParamMax[id] - p::kParamMin[id]) * place);
      }
      Stereo out = run(device, sine(110.0f, 0.3f, kRate, 1.0f), sine(165.0f, 0.3f, kRate, 1.0f));
      worst = std::max(worst, std::max(peak(out.left), peak(out.right)));
      all_finite = all_finite && finite(out.left) && finite(out.right);
    }
    std::printf("  every knob thrown about under a full-scale tone: peak %.2f\n", worst);
    EXPECT(all_finite && worst <= 3.0 * 1.3, "the tail is bounded whatever the knobs do");
  }

  // Input too small to be sound is silence: the device sleeps, and does no
  // work on it. (As built such input kept it awake for good, at eight times
  // the cost.)
  {
    device.init(kRate);
    device.set_param(p::kHold, 0.4f);
    run(device, soft_noise(0.2f, 0.5f, 0x5EEDu));
    std::vector<float> tiny(static_cast<size_t>(8.0f * kRate));
    for (size_t i = 0; i < tiny.size(); ++i) tiny[i] = i % 2 ? 1.0e-30f : -1.0e-30f;
    Stereo out = run(device, tiny);
    EXPECT(peak(out.left, 7 * 48000) == 0.0 && peak(out.right, 7 * 48000) == 0.0, "input under the floor is silence: the device sleeps on it");
    EXPECT(device.meter(0) == 0.0f, "asleep on input under the floor");
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("melt (defaults)", 10.0f, kRate, [&] { run(device, input); });
  device.init(kRate);
  // The dearest setting found: the shortest lines at the fastest slide, where
  // a head runs out of travel soonest and two heads read at once most often.
  device.set_param(p::kSag, -100.0f);
  device.set_param(p::kSize, 0.0f);
  device.set_param(p::kDrip, 1.0f);
  device.set_param(p::kBlur, 1.0f);
  device.set_param(p::kDim, 1.0f);
  device.set_param(p::kHold, 20.0f);
  report_cost("melt (worst: Sag -100, Size 0, Drip 1)", 10.0f, kRate, [&] { run(device, input); });

  return finish("melt");
}
