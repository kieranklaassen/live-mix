// Native harness for Breath (cpp/devices/breath). The conformance pass covers
// stability, silence when idle, block-size independence on steady input and
// parameter abuse; the rest measures the breath: that the level follows the
// four parts with the lengths set, how far it falls, what the colour, the
// width and the air do over the cycle, that the cycle runs by the clock and
// never by the sound, and that nothing steps.

#include "../devices/breath/breath.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Breath;
namespace p = livemix::breath;

static Breath device;
static Breath other;

static const float kRate = 48000.0f;

static std::vector<float> dc(float seconds, float level, float rate = kRate) {
  return std::vector<float>(static_cast<size_t>(seconds * rate), level);
}

struct Shape {
  double in, hold, out, rest, depth, ease;
  double total() const { return in + hold + out + rest; }
};

// The breath (0 empty, 1 full) `seconds` after init, worked out here from the
// header's description and not from its code. The device starts full, at the
// top of Hold: In lies behind it.
static double model_breath(const Shape& s, double seconds) {
  const double x = std::fmod(seconds + s.in, s.total());
  const auto rise = [&](double t) { return t + s.ease * (0.5 - 0.5 * std::cos(kPi * t) - t); };
  if (x < s.in) return rise(x / s.in);
  if (x < s.in + s.hold) return 1.0;
  if (x < s.in + s.hold + s.out) return 1.0 - rise((x - s.in - s.hold) / s.out);
  return 0.0;
}

// The floor in the header's words: (1 − Depth^1.5)².
static double model_floor(double depth) {
  const double open = 1.0 - std::pow(depth, 1.5);
  return open * open;
}

static double model_gain(const Shape& s, double seconds) {
  const double floor = model_floor(s.depth);
  return floor + (1.0 - floor) * model_breath(s, seconds);
}

// The shortest a Hold or a Rest goes: the bottom of its knob.
static const double kShortest = 0.02;

// Only the level moves: no colour, no width, no air, every breath the same.
static void level_only(Breath& d, const Shape& s, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kIn, static_cast<float>(s.in));
  d.set_param(p::kHold, static_cast<float>(s.hold));
  d.set_param(p::kOut, static_cast<float>(s.out));
  d.set_param(p::kRest, static_cast<float>(s.rest));
  d.set_param(p::kDepth, static_cast<float>(s.depth));
  d.set_param(p::kEase, static_cast<float>(s.ease));
  d.set_param(p::kColour, 0.0f);
  d.set_param(p::kWidth, 0.0f);
  d.set_param(p::kAir, 0.0f);
  d.set_param(p::kVary, 0.0f);
}

// Times (seconds) at which `x` crosses `level`, going up or going down.
static std::vector<double> crossings(const std::vector<float>& x, double level, bool rising) {
  std::vector<double> out;
  for (size_t i = 1; i < x.size(); ++i) {
    const bool crossed = rising ? (x[i - 1] < level && x[i] >= level) : (x[i - 1] > level && x[i] <= level);
    if (!crossed) continue;
    const double fraction = (level - x[i - 1]) / (static_cast<double>(x[i]) - x[i - 1]);
    out.push_back((static_cast<double>(i - 1) + fraction) / kRate);
  }
  return out;
}

static double worst_difference(const std::vector<float>& a, const std::vector<float>& b, size_t from = 0,
                               size_t to = SIZE_MAX) {
  to = std::min(to, std::min(a.size(), b.size()));
  double worst = 0.0;
  for (size_t i = from; i < to; ++i) worst = std::max(worst, std::fabs(static_cast<double>(a[i]) - b[i]));
  return worst;
}

static std::vector<float> minus(const std::vector<float>& a, const std::vector<float>& b) {
  std::vector<float> out(a.size());
  for (size_t i = 0; i < a.size(); ++i) out[i] = a[i] - b[i];
  return out;
}

static size_t at(double seconds, float rate = kRate) { return static_cast<size_t>(seconds * rate); }

// How much of a change is there at once: the same passage with and without
// `event`, at eight moments, and the largest difference in the first 8
// samples after it against the largest in the next 20 ms. A smoothed change
// has barely begun after 8 samples; a step is all there.
template <typename Setup, typename Event>
static double suddenness(Setup setup, Event event, double* size = nullptr) {
  // Two notes with some top to them, another pair on the other side.
  std::vector<float> left = sine(220.0f, 1.2f, kRate, 0.3f), right = sine(277.0f, 1.2f, kRate, 0.3f);
  const std::vector<float> left_top = sine(3300.0f, 1.2f, kRate, 0.1f), right_top = sine(4150.0f, 1.2f, kRate, 0.1f);
  for (size_t i = 0; i < left.size(); ++i) {
    left[i] += left_top[i];
    right[i] += right_top[i];
  }
  const auto part = [](const std::vector<float>& x, size_t from, size_t to) {
    return std::vector<float>(x.begin() + static_cast<long>(from), x.begin() + static_cast<long>(to));
  };
  double worst = 0.0;
  double largest = 0.0;
  for (int k = 0; k < 8; ++k) {
    const size_t moment = at(0.31 + 0.0137 * k);
    setup(device);
    run(device, part(left, 0, moment), part(right, 0, moment));
    event(device);
    const Stereo with = run(device, part(left, moment, moment + 960), part(right, moment, moment + 960));
    setup(other);
    run(other, part(left, 0, moment), part(right, 0, moment));
    const Stereo without = run(other, part(left, moment, moment + 960), part(right, moment, moment + 960));
    double early = 0.0, whole = 0.0;
    for (size_t i = 0; i < 960; ++i) {
      const double d = std::max(std::fabs(static_cast<double>(with.left[i]) - without.left[i]),
                                std::fabs(static_cast<double>(with.right[i]) - without.right[i]));
      if (i < 8) early = std::max(early, d);
      whole = std::max(whole, d);
    }
    largest = std::max(largest, whole);
    if (whole > 1.0e-6) worst = std::max(worst, early / whole);
  }
  if (size) *size = largest;
  return worst;
}

int main() {
  Conformance spec;
  spec.name = "breath";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 5.0f;
  spec.max_peak = 3.0f;
  check_effect(device, spec, kRate);

  // The level follows the four parts, sample by sample, for three breaths:
  // one with every part, one with the shortest holds and straight lines, one
  // lopsided. Each begins full, at the top of Hold.
  {
    const Shape shapes[3] = {
        {1.0, 0.5, 1.5, 0.25, 0.6, 1.0},
        {0.4, kShortest, 0.6, kShortest, 0.5, 0.0},
        {2.0, kShortest, 0.5, 1.0, 0.8, 0.5},
    };
    for (const Shape& s : shapes) {
      level_only(device, s);
      const float seconds = static_cast<float>(2.5 * s.total());
      Stereo out = run(device, dc(seconds, 0.5f));
      double worst = 0.0;
      for (size_t i = 0; i < out.size(); ++i) {
        worst = std::max(worst, std::fabs(out.left[i] / 0.5 - model_gain(s, static_cast<double>(i) / kRate)));
      }
      char label[160];
      std::snprintf(label, sizeof label,
                    "in %.1f hold %.1f out %.1f rest %.1f: the level is the four-part shape (worst %g)", s.in,
                    s.hold, s.out, s.rest, worst);
      EXPECT(worst < 3.0e-4, label);
      EXPECT(out.left == out.right, "the level moves both sides together");

      // The lengths, read off the output: the half-way crossings up and down.
      const double floor = model_floor(s.depth);
      const double half = 0.5 * (1.0 + floor) * 0.5;
      const std::vector<double> up = crossings(out.left, half, true);
      const std::vector<double> down = crossings(out.left, half, false);
      EXPECT(up.size() >= 2 && down.size() >= 2, "two breaths are in the render");
      if (up.size() >= 2 && down.size() >= 2) {
        std::snprintf(label, sizeof label, "in %.1f hold %.1f out %.1f rest %.1f: one breath takes the four lengths",
                      s.in, s.hold, s.out, s.rest);
        EXPECT_NEAR(up[1] - up[0], s.total(), 0.0005, label);
        // Both curves are their own mirror, so each is half way at half its time.
        EXPECT_NEAR(down[0], s.hold + 0.5 * s.out, 0.0005, "it starts full: all of Hold, then Out is half way at half its length");
        EXPECT_NEAR(up[0] - down[0], 0.5 * s.out + s.rest + 0.5 * s.in, 0.0005,
                    "half of Out, all of Rest and half of In lie between a fall and the next rise");
        EXPECT_NEAR(down[1] - up[0], 0.5 * s.in + s.hold + 0.5 * s.out, 0.0005,
                    "half of In, all of Hold and half of Out lie between the crossings");
      }
      // Full for as long as Hold and empty for as long as Rest (a soft curve
      // lingers a millisecond or two at each end besides).
      size_t full = 0, empty = 0;
      const size_t first = at(s.total()), last = at(2.0 * s.total());
      for (size_t i = first; i < last; ++i) {
        if (out.left[i] > 0.5 * (1.0 - 2.0e-6)) ++full;
        if (out.left[i] < 0.5 * (floor + 2.0e-6)) ++empty;
      }
      EXPECT_NEAR(static_cast<double>(full) / kRate, s.hold, 0.004, "the level stays full for Hold");
      EXPECT_NEAR(static_cast<double>(empty) / kRate, s.rest, 0.004, "the level stays at its floor for Rest");
    }
  }

  // Depth sets the floor: (1 − Depth^1.5)². The lower half of the knob is a
  // few dB (2.3 at a quarter, 7.6 at a half), and only its end is silence.
  // (Hold 0 to 0.2 s, Out to 0.7, Rest to 1.7, In to 2.2.)
  {
    for (float depth : {0.25f, 0.4f, 0.5f, 0.75f, 0.9f}) {
      level_only(device, {0.5, 0.2, 0.5, 1.0, depth, 1.0});
      Stereo out = run(device, sine(440.0f, 2.2f, kRate, 0.5f));
      const double fallen = db(rms(out.left, at(0.9), at(1.5)) / rms(out.left, at(0.02), at(0.18)));
      char label[96];
      std::snprintf(label, sizeof label, "Depth %.2f: the floor in dB", depth);
      EXPECT_NEAR(fallen, 40.0 * std::log10(1.0 - std::pow(depth, 1.5)), 0.05, label);
    }
    EXPECT_NEAR(db(Breath::floor_gain(0.25f)), -2.3, 0.1, "a quarter of Depth is a breath of 2.3 dB");
    EXPECT_NEAR(db(Breath::floor_gain(0.5f)), -7.6, 0.1, "half of Depth is 7.6 dB, not 12");
    EXPECT_NEAR(db(Breath::floor_gain(p::kParamDefault[p::kDepth])), -5.1, 0.1, "the default breath falls 5 dB");
    level_only(device, {0.5, 0.2, 0.5, 1.0, 1.0, 1.0});
    Stereo out = run(device, sine(440.0f, 2.2f, kRate, 0.5f));
    EXPECT(peak(out.left, at(0.75), at(1.65)) == 0.0, "Depth 1: silence while the breath is empty");
    EXPECT_NEAR(peak(out.left, at(0.02), at(0.18)), 0.5, 0.001, "Depth 1: unity while it is full");
  }

  // Colour: the high end follows the breath, and the low pass stands where the header says.
  {
    // Only the colour moves.
    auto colour_only = [](Breath& d, float colour) {
      level_only(d, {1.0, 1.0, 1.0, 1.0, 0.0, 0.0});
      d.set_param(p::kColour, colour);
    };
    colour_only(device, 0.7f);
    rng_state() = 0xC0FFEEu;
    const std::vector<float> hiss = noise(4.0f, kRate, 0.3f);
    Stereo out = run(device, hiss);
    // Hold 0 to 1 s, Out to 2, Rest to 3, In to 4.
    const double full = energy_above(out.left, 3000.0, kRate, at(0.2), at(0.8));
    const double empty = energy_above(out.left, 3000.0, kRate, at(2.2), at(2.8));
    const double dry = energy_above(hiss, 3000.0, kRate, at(0.2), at(0.8));
    EXPECT_NEAR(full, dry, 0.001, "Colour: a full breath has the input's own high end");
    // (The measure splits with one pole, so it leaks: a sharper one follows.)
    EXPECT(empty < 0.15 * full, "Colour: an empty one has lost most of it");
    EXPECT(worst_difference(out.left, hiss, at(0.0), at(0.95)) < 1.0e-6, "Colour: full, the filter is a wire");
    // It opens on the way in and closes on the way out: more of the highs in each quarter than the last.
    double last = 0.0;
    bool opens = true, closes = true;
    for (int q = 0; q < 4; ++q) {
      const double share = energy_above(out.left, 3000.0, kRate, at(3.0 + 0.25 * q), at(3.25 + 0.25 * q));
      opens = opens && share > last;
      last = share;
    }
    // (The first quarter of Out has closed the filter no further than 14 kHz:
    // its share is the full one's, give or take what one stretch of noise
    // differs from another.)
    last = full * 1.02;
    for (int q = 0; q < 4; ++q) {
      const double share = energy_above(out.left, 3000.0, kRate, at(1.0 + 0.25 * q), at(1.25 + 0.25 * q));
      closes = closes && share < last;
      last = share;
    }
    EXPECT(opens, "Colour: the highs come in through In");
    EXPECT(closes, "Colour: and go out through Out");

    // Empty, the low pass is 3 dB down at 200·99/(100^Colour − 1) Hz, and two poles steep above it.
    const float settings[3] = {0.5f, 0.75f, 1.0f};
    for (float colour : settings) {
      const double cutoff = Breath::cutoff_hz(colour);
      const double pole = cutoff * Breath::kPoleScale;
      for (double ratio : {1.0, 2.0, 4.0}) {
        const double hz = cutoff * ratio;
        colour_only(device, colour);
        Stereo tone = run(device, sine(static_cast<float>(hz), 4.0f, kRate, 0.5f));
        const double measured = db(tone_level(tone.left, hz, kRate, at(2.2), at(2.8)) / 0.5);
        // Two poles of exp(−2π·corner/rate) each, as a sampled filter has them.
        const double a = std::exp(-2.0 * kPi * pole / kRate);
        const double w = 2.0 * kPi * hz / kRate;
        const double expected = 20.0 * std::log10((1.0 - a) * (1.0 - a) / (1.0 - 2.0 * a * std::cos(w) + a * a));
        char label[128];
        std::snprintf(label, sizeof label, "Colour %.2f: the empty breath at %.0f Hz (cutoff %.0f Hz)", colour, hz,
                      cutoff);
        EXPECT_NEAR(measured, expected, 0.1, label);
        if (ratio == 1.0) EXPECT_NEAR(measured, -3.01, 0.3, "the cutoff is where the low pass is 3 dB down");
      }
    }
    EXPECT_NEAR(Breath::cutoff_hz(1.0), 200.0, 1.0e-6, "Colour 1 shuts down to 200 Hz");
    EXPECT_NEAR(Breath::cutoff_hz(0.5), 2200.0, 1.0e-6, "Colour 0.5 to 2.2 kHz");
    colour_only(device, 0.0f);
    Stereo flat = run(device, sine(9000.0f, 4.0f, kRate, 0.5f));
    EXPECT_NEAR(tone_level(flat.left, 9000.0, kRate, at(2.2), at(2.8)), 0.5, 1.0e-4, "Colour 0 leaves the highs alone");
  }

  // With nothing following the breath, and with Mix at 0, the output is the input.
  {
    rng_state() = 0xBADA55u;
    const std::vector<float> left = noise(3.0f, kRate, 0.5f);
    const std::vector<float> right = noise(3.0f, kRate, 0.5f);
    device.init(kRate);
    device.set_param(p::kIn, 0.3f);
    device.set_param(p::kOut, 0.4f);
    device.set_param(p::kDepth, 0.0f);
    device.set_param(p::kColour, 0.0f);
    device.set_param(p::kWidth, 0.0f);
    device.set_param(p::kAir, 0.0f);
    Stereo out = run(device, left, right);
    EXPECT(out.left == left && out.right == right, "Depth, Colour, Width and Air at 0: the input, sample for sample");
    device.init(kRate);
    for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, p::kParamMax[id]);
    device.set_param(p::kIn, 0.3f);
    device.set_param(p::kOut, 0.4f);
    device.set_param(p::kHold, 0.1f);
    device.set_param(p::kRest, 0.1f);
    device.set_param(p::kMix, 0.0f);
    out = run(device, left, right);
    EXPECT(out.left == left && out.right == right, "Mix 0: the input, sample for sample, whatever else is set");
    // Half the Mix is half the fall.
    level_only(device, {0.5, 0.2, 0.5, 1.0, 1.0, 1.0});
    device.set_param(p::kMix, 0.5f);
    out = run(device, dc(2.2f, 0.5f));
    EXPECT_NEAR(out.left[at(1.2)], 0.25, 1.0e-5, "Mix 0.5 leaves half the sound where Depth 1 leaves none");
  }

  // Width: the sides give way as the breath empties, and a spread comes in as it fills.
  {
    auto width_only = [](Breath& d, float width) {
      level_only(d, {1.0, 1.0, 1.0, 1.0, 0.0, 0.0});
      d.set_param(p::kWidth, width);
    };
    rng_state() = 0x5EED5u;
    const std::vector<float> left = noise(4.0f, kRate, 0.3f);
    const std::vector<float> right = noise(4.0f, kRate, 0.3f);
    std::vector<float> in_side(left.size()), in_mid(left.size());
    for (size_t i = 0; i < left.size(); ++i) {
      in_side[i] = 0.5f * (left[i] - right[i]);
      in_mid[i] = 0.5f * (left[i] + right[i]);
    }
    width_only(device, 1.0f);
    Stereo wide = run(device, left, right);
    std::vector<float> side(left.size()), mid(left.size());
    for (size_t i = 0; i < left.size(); ++i) {
      side[i] = 0.5f * (wide.left[i] - wide.right[i]);
      mid[i] = 0.5f * (wide.left[i] + wide.right[i]);
    }
    // Hold 0 to 1 s (full), Out to 2, Rest to 3 (empty), In to 4.
    EXPECT(rms(side, at(2.1), at(2.9)) < 1.0e-6, "Width 1: an empty breath is mono");
    EXPECT(worst_difference(mid, in_mid) < 1.0e-6, "Width never touches the mono sum");
    // Two unlike noises are already as wide as two sides get: the spread adds
    // its own square to their sides, 1 + 0.2² of the energy.
    const double grown = rms(side, at(0.2), at(0.8)) / rms(in_side, at(0.2), at(0.8));
    EXPECT(grown > 1.01 && grown < 1.04, "Width 1: a full breath is a little wider than a wide input");
    width_only(device, 0.5f);
    Stereo half = run(device, left, right);
    for (size_t i = 0; i < left.size(); ++i) side[i] = 0.5f * (half.left[i] - half.right[i]);
    EXPECT_NEAR(rms(side, at(2.1), at(2.9)) / rms(in_side, at(2.1), at(2.9)), 0.5, 0.001,
                "Width 0.5: an empty breath keeps half of the sides");

    // A mono sound is spread as the breath fills: the two sides part, by the
    // spread's own gain on the middle above its low cut.
    width_only(device, 1.0f);
    Stereo spread = run(device, left, left);
    EXPECT(correlation(spread.left, spread.right, at(2.1), at(2.9)) > 0.999999, "a mono sound stays mono while empty");
    const double apart = correlation(spread.left, spread.right, at(0.2), at(0.8));
    // Sides of 0.2 of a middle of 1 (less the lows): (1 − 0.04) / (1 + 0.04) = 0.92.
    EXPECT(apart > 0.90 && apart < 0.94, "a mono sound is spread a little while full");
    for (size_t i = 0; i < left.size(); ++i) side[i] = 0.5f * (spread.left[i] - spread.right[i]);
    EXPECT_NEAR(rms(side, at(0.2), at(0.8)) / rms(left, at(0.2), at(0.8)), Breath::kSpread, 0.01,
                "the spread is 0.2 of the middle at full Width");
    // The lows stay in the middle: a bass note is not spread.
    width_only(device, 1.0f);
    const std::vector<float> bass = sine(50.0f, 4.0f, kRate, 0.5f);  // two octaves under the low cut
    Stereo low = run(device, bass, bass);
    for (size_t i = 0; i < bass.size(); ++i) side[i] = 0.5f * (low.left[i] - low.right[i]);
    EXPECT(rms(side, at(0.2), at(0.8)) < 0.1 * Breath::kSpread * rms(bass, at(0.2), at(0.8)),
           "the spread leaves the lows in the middle");
  }

  // Air: noise while the breath moves, as loud as the input, in a band that rises with the breath.
  {
    auto air_only = [](Breath& d, float air, float rate) {
      level_only(d, {1.0, 1.0, 1.0, 1.0, 0.0, 0.0}, rate);
      d.set_param(p::kAir, air);
    };
    const std::vector<float> tone = sine(220.0f, 4.0f, kRate, 0.4f);
    air_only(device, 1.0f, kRate);
    Stereo out = run(device, tone);
    const std::vector<float> air = minus(out.left, tone);
    const std::vector<float> air_right = minus(out.right, tone);
    // Hold 0 to 1 s, Out to 2, Rest to 3, In to 4.
    const double in_air = rms(air, at(3.4), at(3.6));
    const double out_air = rms(air, at(1.4), at(1.6));
    EXPECT(in_air > 0.05 && in_air < 0.4, "Air 1: noise half way through In, under the tone");
    EXPECT(out_air > 0.05 && out_air < 0.4, "Air 1: and half way through Out");
    EXPECT(peak(air, at(0.0), at(0.95)) < 1.0e-6, "no air while the breath is held");
    EXPECT(peak(air, at(2.05), at(2.95)) < 1.0e-6, "no air while it rests");
    EXPECT(rms(air, at(3.0), at(3.05)) < 0.25 * in_air, "the air comes in from nothing at the start of In");
    EXPECT(std::fabs(correlation(air, air_right, at(3.3), at(3.7))) < 0.1, "the air is another noise on each side");
    // The band rises with the breath: early in In it is low, late it is high.
    const double early = energy_above(air, 2000.0, kRate, at(3.1), at(3.3));
    const double late = energy_above(air, 2000.0, kRate, at(3.7), at(3.9));
    EXPECT(late > 1.5 * early, "the air's band rises as the breath fills");
    const double falling_early = energy_above(air, 2000.0, kRate, at(1.1), at(1.3));
    const double falling_late = energy_above(air, 2000.0, kRate, at(1.7), at(1.9));
    EXPECT(falling_early > 1.5 * falling_late, "and falls as it empties");

    // It is as loud as the input: half the tone, half the air.
    const std::vector<float> quiet = sine(220.0f, 4.0f, kRate, 0.2f);
    air_only(device, 1.0f, kRate);
    Stereo soft = run(device, quiet);
    EXPECT_NEAR(rms(minus(soft.left, quiet), at(3.4), at(3.6)) / in_air, 0.5, 0.01, "the air follows the input's level");
    // The knob is a square law: half is 12 dB down.
    air_only(device, 0.5f, kRate);
    Stereo less = run(device, tone);
    EXPECT_NEAR(db(rms(minus(less.left, tone), at(3.4), at(3.6)) / in_air), -12.04, 0.1, "Air 0.5 is 12 dB under Air 1");
    // And it keeps its level against the tone at another sample rate.
    const std::vector<float> tone96 = sine(220.0f, 4.0f, 96000.0f, 0.4f);
    air_only(device, 1.0f, 96000.0f);
    Stereo fast = run(device, tone96);
    const double in_air96 = rms(minus(fast.left, tone96), at(3.4, 96000.0f), at(3.6, 96000.0f));
    EXPECT(std::fabs(db(in_air96 / in_air)) < 1.0, "the air is as loud against the tone at 96 kHz as at 48");
  }

  // The cycle runs by the clock, never by the sound: after any silence, long
  // enough to sleep or not, the breath is where the time has put it.
  {
    const Shape s = {1.0, 0.5, 1.5, 0.25, 0.6, 1.0};
    for (float wait : {0.0f, 0.7f, 2.3f, 3.99f, 4.01f, 7.7f, 31.0f}) {
      level_only(device, s);
      run(device, dc(0.3f, 0.5f));
      render(device, wait, kRate);
      Stereo out = run(device, dc(0.5f, 0.5f));
      double worst = 0.0;
      for (size_t i = 0; i < out.size(); ++i) {
        const double seconds = static_cast<double>(at(0.3) + at(wait) + i) / kRate;
        worst = std::max(worst, std::fabs(out.left[i] / 0.5 - model_gain(s, seconds)));
      }
      char label[120];
      std::snprintf(label, sizeof label, "after %.2f s of silence the breath is where the clock put it (worst %g)", wait,
                    worst);
      EXPECT(worst < 3.0e-4, label);
    }
    // Notes do not restart it: bursts with gaps show pieces of the one cycle.
    level_only(device, s);
    std::vector<float> bursts;
    for (int n = 0; n < 12; ++n) {
      const std::vector<float> on = dc(0.21f, 0.5f), off = silence(0.33f, kRate);
      bursts.insert(bursts.end(), on.begin(), on.end());
      bursts.insert(bursts.end(), off.begin(), off.end());
    }
    Stereo out = run(device, bursts);
    double worst = 0.0;
    for (size_t i = 0; i < out.size(); ++i) {
      if (bursts[i] == 0.0f) continue;
      worst = std::max(worst, std::fabs(out.left[i] / 0.5 - model_gain(s, static_cast<double>(i) / kRate)));
    }
    EXPECT(worst < 3.0e-4, "notes do not restart the breath");
  }

  // The same at every block size, across a silence about as long as it takes
  // to fall asleep, with knobs moved in the silence.
  {
    rng_state() = 0xFACEu;
    const std::vector<float> first_left = noise(0.6f, kRate, 0.4f), first_right = noise(0.6f, kRate, 0.4f);
    const std::vector<float> second_left = noise(0.9f, kRate, 0.4f), second_right = noise(0.9f, kRate, 0.4f);
    std::vector<float> gaps;
    for (int n = 0; n <= 10; ++n) gaps.push_back(3.9f + 0.02f * n);
    gaps.push_back(6.0f);
    double worst = 0.0;
    for (float gap : gaps) {
      Stereo reference;
      for (int which = 0; which < 4; ++which) {
        const int blocks[8] = {1, 7, 64, 128, 33, 512, 2048, 5};
        const int fixed = which == 0 ? 128 : (which == 1 ? 1 : 2048);
        device.init(kRate);
        device.set_param(p::kAir, 0.8f);
        device.set_param(p::kVary, 1.0f);
        device.set_param(p::kIn, 0.5f);
        device.set_param(p::kOut, 0.7f);
        // The phrase, then the silence with four knobs moved 3 ms before it
        // ends, then the phrase again: as one stream cut into blocks.
        std::vector<float> left = first_left, right = first_right;
        const size_t quiet = at(gap);
        left.insert(left.end(), quiet, 0.0f);
        right.insert(right.end(), quiet, 0.0f);
        const size_t moved = left.size() - at(0.003);
        left.insert(left.end(), second_left.begin(), second_left.end());
        right.insert(right.end(), second_right.begin(), second_right.end());
        Stereo out;
        out.left.resize(left.size());
        out.right.resize(left.size());
        size_t done = 0;
        int turn = 0;
        bool turned = false;
        while (done < left.size()) {
          size_t frames = static_cast<size_t>(which == 3 ? blocks[turn++ % 8] : fixed);
          frames = std::min(frames, left.size() - done);
          if (!turned && done + frames > moved) frames = moved - done;
          if (frames == 0) {
            device.set_param(p::kDepth, 0.95f);
            device.set_param(p::kColour, 0.9f);
            device.set_param(p::kEase, 0.1f);
            device.set_param(p::kWidth, 1.0f);
            device.set_param(p::kHold, 0.3f);
            turned = true;
            continue;
          }
          for (size_t i = 0; i < frames; ++i) {
            device.in_left()[i] = left[done + i];
            device.in_right()[i] = right[done + i];
          }
          device.process(static_cast<int>(frames));
          for (size_t i = 0; i < frames; ++i) {
            out.left[done + i] = device.out_left()[i];
            out.right[done + i] = device.out_right()[i];
          }
          done += frames;
        }
        if (which == 0) {
          reference = out;
        } else {
          worst = std::max(worst, worst_difference(out.left, reference.left));
          worst = std::max(worst, worst_difference(out.right, reference.right));
        }
      }
    }
    char label[120];
    std::snprintf(label, sizeof label, "the same at block sizes 1, 128, 2048 and ragged across a sleep (worst %g)", worst);
    EXPECT(worst < 1.0e-6, label);
  }

  // A knob moved while the device rests has arrived when the sound returns.
  {
    rng_state() = 0xD00Du;
    const std::vector<float> phrase = noise(0.5f, kRate, 0.4f);
    auto moved = [](Breath& d) {
      d.set_param(p::kDepth, 0.9f);
      d.set_param(p::kColour, 0.8f);
      d.set_param(p::kWidth, 1.0f);
      d.set_param(p::kAir, 0.7f);
      d.set_param(p::kEase, 0.0f);
      d.set_param(p::kMix, 0.6f);
    };
    device.init(kRate);
    moved(device);
    run(device, phrase);
    render(device, 6.0f, kRate);
    Stereo set_before = run(device, phrase);
    // The same six seconds, with the knobs moved in the fifth, after a block
    // of an odd length has put the device off the beat of the blocks.
    device.init(kRate);
    run(device, phrase);
    render(device, 5.0f, kRate);
    device.process(13);
    moved(device);
    run(device, std::vector<float>(at(6.0) - at(5.0) - 13, 0.0f));
    Stereo moved_asleep = run(device, phrase);
    EXPECT(worst_difference(moved_asleep.left, set_before.left) < 1.0e-6 &&
               worst_difference(moved_asleep.right, set_before.right) < 1.0e-6,
           "knobs moved at rest snap: the next sound is as if they were set from the start");
  }

  // Nothing steps. The corners of a straight breath do not click on a sine or
  // on a steady level, and a knob thrown across its range arrives gradually.
  {
    const Shape fast = {0.2, 0.05, 0.2, 0.05, 1.0, 0.0};
    level_only(device, fast);
    const std::vector<float> tone = sine(110.0f, 3.0f, kRate, 0.5f);
    Stereo out = run(device, tone);
    EXPECT(max_step(out.left) <= max_step(tone) * 1.02, "the corners add no step to a sine");
    level_only(device, fast);
    out = run(device, dc(3.0f, 0.5f));
    // The steepest the level goes is one part's whole travel over its length.
    EXPECT(max_step(out.left) <= 0.5 / (0.2 * kRate) * 1.01, "the level never moves faster than its ramp");

    // The breath starts full and Hold is at its shortest, so the knobs are
    // thrown while it lets go: a third to two thirds of the way through Out.
    auto sounding = [](Breath& d) {
      d.init(kRate);
      d.set_param(p::kIn, 2.0f);
      d.set_param(p::kHold, static_cast<float>(kShortest));
      d.set_param(p::kOut, 0.6f);
      d.set_param(p::kRest, 2.0f);
      d.set_param(p::kDepth, 0.6f);
      d.set_param(p::kColour, 0.6f);
      d.set_param(p::kWidth, 0.6f);
      d.set_param(p::kAir, 0.6f);
      d.set_param(p::kEase, 0.5f);
      d.set_param(p::kVary, 0.0f);
      d.set_param(p::kMix, 0.5f);
    };
    const int smoothed[6] = {p::kDepth, p::kColour, p::kWidth, p::kAir, p::kEase, p::kMix};
    static const char* names[6] = {"Depth", "Colour", "Width", "Air", "Ease", "Mix"};
    for (int n = 0; n < 6; ++n) {
      for (int end = 0; end < 2; ++end) {
        const int id = smoothed[n];
        const float value = end == 0 ? p::kParamMin[id] : p::kParamMax[id];
        double size = 0.0;
        const double sudden = suddenness(sounding, [&](Breath& d) { d.set_param(id, value); }, &size);
        char label[120];
        std::snprintf(label, sizeof label, "%s thrown to its %s arrives gradually (%.3f of it at once)", names[n],
                      end == 0 ? "minimum" : "maximum", sudden);
        EXPECT(sudden < 0.15, label);
        std::snprintf(label, sizeof label, "%s thrown to its %s is heard", names[n], end == 0 ? "minimum" : "maximum");
        // Ease only shows away from a part's middle and ends; the rest move the sound at once.
        EXPECT(size > (id == p::kEase ? 1.0e-3 : 5.0e-3), label);
      }
    }
    // A length changes the speed and not the place: nothing to hear at once.
    const int lengths[5] = {p::kIn, p::kHold, p::kOut, p::kRest, p::kVary};
    for (int id : lengths) {
      for (int end = 0; end < 2; ++end) {
        const float value = end == 0 ? p::kParamMin[id] : p::kParamMax[id];
        const double sudden = suddenness(sounding, [&](Breath& d) { d.set_param(id, value); });
        EXPECT(sudden < 0.05, "a length thrown across its range changes nothing at once");
      }
    }
    // A Hold cut to nothing while the breath is held: Out begins from full, without a step.
    auto held = [](Breath& d) {
      level_only(d, {0.2, 5.0, 2.0, 1.0, 1.0, 0.0});
    };
    const double cut = suddenness(held, [&](Breath& d) { d.set_param(p::kHold, 0.0f); });
    EXPECT(cut < 0.05, "a Hold cut short lets go from where it is");
  }

  // Vary: no two breaths the same length, each within half an octave of the
  // length set; at 0 every breath is the same.
  {
    const Shape s = {0.3, 0.1, 0.4, 0.1, 0.8, 1.0};
    double ratio[2] = {0.0, 0.0}, shortest[2] = {0.0, 0.0}, longest[2] = {0.0, 0.0};
    std::vector<double> lengths_seen;
    for (int which = 0; which < 2; ++which) {
      level_only(device, s);
      device.set_param(p::kVary, static_cast<float>(which));
      Stereo out = run(device, dc(40.0f, 0.5f));
      const std::vector<double> up = crossings(out.left, 0.26, true);
      double low = 1.0e9, high = 0.0;
      for (size_t i = 1; i < up.size(); ++i) {
        low = std::min(low, up[i] - up[i - 1]);
        high = std::max(high, up[i] - up[i - 1]);
        if (which == 1) lengths_seen.push_back(up[i] - up[i - 1]);
      }
      ratio[which] = high / low;
      shortest[which] = low / s.total();
      longest[which] = high / s.total();
    }
    EXPECT(ratio[0] < 1.0005, "Vary 0: every breath is the same length");
    EXPECT_NEAR(shortest[0], 1.0, 0.001, "Vary 0: and it is the length set");
    EXPECT(ratio[1] > 1.4, "Vary 1: breaths differ in length");
    EXPECT(shortest[1] > 0.69 && longest[1] < 1.44, "Vary 1: each within half an octave of the length set");
    // And the same breaths every time.
    level_only(device, s);
    device.set_param(p::kVary, 1.0f);
    Stereo again = run(device, dc(40.0f, 0.5f));
    const std::vector<double> up = crossings(again.left, 0.26, true);
    bool same = up.size() == lengths_seen.size() + 1;
    for (size_t i = 1; same && i < up.size(); ++i) same = up[i] - up[i - 1] == lengths_seen[i - 1];
    EXPECT(same, "Vary draws the same breaths after every init");
  }

  // The readings: where the breath is in the cycle as set, and its pace.
  {
    const Shape s = {1.0, 0.5, 1.5, 0.25, 0.6, 1.0};
    level_only(device, s);
    EXPECT_NEAR(device.meter(0), s.in / s.total(), 1.0e-6, "at init the breath is full: at the end of In, where Hold begins");
    EXPECT(device.meter(1) == 1.0f, "at init the pace is 1");
    double worst = 0.0;
    for (int n = 1; n <= 200; ++n) {
      // Awake for the first second, then at rest: the reading goes on either way.
      if (n <= 20) {
        run(device, dc(0.05f, 0.5f));
      } else {
        render(device, 0.05f, kRate);
      }
      const double seconds = 0.05 * n;
      double expected = std::fmod(seconds + s.in, s.total()) / s.total();
      double d = std::fabs(device.meter(0) - expected);
      d = std::min(d, 1.0 - d);
      worst = std::max(worst, d);
    }
    EXPECT(worst < 1.0e-4, "the phase reading is the time through the cycle, awake and at rest");
    EXPECT(device.meter(2) == 0.0f, "an unknown reading is 0");
    level_only(device, {0.3, 0.1, 0.4, 0.1, 0.8, 1.0});
    device.set_param(p::kVary, 1.0f);
    double low = 1.0e9, high = 0.0;
    for (int n = 0; n < 400; ++n) {
      render(device, 0.1f, kRate);
      low = std::min(low, static_cast<double>(device.meter(1)));
      high = std::max(high, static_cast<double>(device.meter(1)));
    }
    EXPECT(low > 0.70 && low < 0.85 && high > 1.2 && high < 1.42, "the pace reading moves within half an octave");
  }

  // Bad input: samples that are not numbers, infinities and absurd levels
  // leave nothing behind once good input returns.
  {
    const std::vector<float> tone = sine(330.0f, 6.0f, kRate, 0.4f);
    auto bad_run = [&](int kind) {
      std::vector<float> in = tone;
      for (size_t i = at(0.5); i < at(0.5) + 96; ++i) {
        const float bad[4] = {std::nanf(""), INFINITY, -INFINITY, 1.0e30f};
        in[i] = kind == 4 ? bad[i % 4] : bad[kind];
      }
      device.init(kRate);
      device.set_param(p::kAir, 1.0f);
      device.set_param(p::kWidth, 1.0f);
      device.set_param(p::kColour, 1.0f);
      return run(device, in);
    };
    device.init(kRate);
    device.set_param(p::kAir, 1.0f);
    device.set_param(p::kWidth, 1.0f);
    device.set_param(p::kColour, 1.0f);
    Stereo clean = run(device, tone);
    for (int kind = 0; kind < 5; ++kind) {
      Stereo out = bad_run(kind);
      EXPECT(finite(out.left) && finite(out.right), "bad input never reaches the output as anything but a number");
      EXPECT(peak(out.left) <= 3.0 * Breath::kInputLimit, "bad input comes out bounded");
      // The follower lets go of an absurd level in 3.5 s; after that the two renders are one.
      const double apart = std::max(worst_difference(out.left, clean.left, at(5.0)),
                                    worst_difference(out.right, clean.right, at(5.0)));
      char label[120];
      std::snprintf(label, sizeof label, "bad input of kind %d leaves nothing behind (%g apart)", kind, apart);
      EXPECT(apart < 1.0e-4, label);
      EXPECT_NEAR(rms(out.left, at(5.0)), rms(clean.left, at(5.0)), 1.0e-4, "and the sound goes on");
    }
  }

  // Level: at its defaults the device never adds more than a little to a full breath, and takes away the rest.
  {
    device.init(kRate);
    rng_state() = 0xA11CEu;
    const std::vector<float> left = noise(20.0f, kRate, 0.25f), right = noise(20.0f, kRate, 0.25f);
    Stereo out = run(device, left, right);
    const double change = db(rms(out.left) / rms(left));
    EXPECT(change < 0.0 && change > -4.0, "at defaults the output is under the input, by less than 4 dB over two breaths");
    double loudest = -200.0;
    for (size_t i = 0; i + 4800 <= left.size(); i += 4800) {
      loudest = std::max(loudest, db(rms(out.left, i, i + 4800) / rms(left, i, i + 4800)));
    }
    EXPECT(loudest < 1.0, "and no tenth of a second is more than 1 dB over it");
    // Everything up, full scale in: bounded.
    device.init(kRate);
    for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, p::kParamMax[id]);
    device.set_param(p::kIn, 0.3f);
    device.set_param(p::kOut, 0.3f);
    device.set_param(p::kHold, 0.3f);
    device.set_param(p::kRest, 0.3f);
    std::vector<float> square(at(6.0));
    for (size_t i = 0; i < square.size(); ++i) square[i] = (i / 109) % 2 == 0 ? 1.0f : -1.0f;
    out = run(device, square, square);
    EXPECT(finite(out.left) && peak(out.left) < 4.0 && peak(out.right) < 4.0, "everything up on a full-scale square stays bounded");
  }

  // The device rests: exact zero four seconds after the input stops, and it wakes on new input.
  {
    device.init(kRate);
    device.set_param(p::kAir, 1.0f);
    device.set_param(p::kWidth, 1.0f);
    device.set_param(p::kColour, 1.0f);
    rng_state() = 0x1D1Eu;
    run(device, noise(1.0f, kRate, 0.9f));
    Stereo tail = render(device, 4.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(tail.left, at(3.9)) == 0.0 && peak(tail.right, at(3.9)) == 0.0, "everything has rung out before the rest begins");
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "at rest after the tail");
    Stereo woken = run(device, sine(440.0f, 0.5f, kRate, 0.5f));
    EXPECT(peak(woken.left) > 0.05, "wakes on new input");
  }

  // ---- What the second check found, each held by a measurement ----

  // A Breath put on a sound that is already playing begins as that sound:
  // full, at its own level, and without an edge. (It began at its floor.)
  {
    // A chord in mid-flight: its first sample is not a zero.
    std::vector<float> left = sine(220.0f, 20.5f, kRate, 0.2f), right = sine(277.0f, 20.5f, kRate, 0.2f);
    const std::vector<float> left_top = sine(331.0f, 20.5f, kRate, 0.1f), right_top = sine(415.0f, 20.5f, kRate, 0.1f);
    for (size_t i = 0; i < left.size(); ++i) {
      left[i] += left_top[i];
      right[i] += right_top[i];
    }
    left.erase(left.begin(), left.begin() + 777);
    right.erase(right.begin(), right.begin() + 777);
    device.init(kRate);
    Stereo out = run(device, left, right);
    const double first = db(rms(out.left, 0, at(0.05)) / rms(left, 0, at(0.05)));
    char label[160];
    std::snprintf(label, sizeof label, "put on a playing sound, the first 50 ms are at the sound's own level (%.2f dB)", first);
    EXPECT(std::fabs(first) < 0.5, label);
    EXPECT(max_step(out.left, 0, at(0.05)) <= 1.1 * max_step(left, 0, at(0.05)) &&
               max_step(out.right, 0, at(0.05)) <= 1.1 * max_step(right, 0, at(0.05)),
           "and it begins without a step");
    // Hold is 0.5 s and Out 4.5 s, a little longer or shorter with Vary: by 5.4 s it rests.
    const double low = db(rms(out.left, at(5.4), at(5.6)) / rms(left, at(5.4), at(5.6)));
    EXPECT(low < -4.0 && low > -10.5, "by its Rest the default breath has let the sound fall 4 to 10 dB");
    // The default is a breath to leave on: the loudest tenth of a second against the quietest, and the whole.
    double loudest = -200.0, quietest = 200.0;
    for (size_t i = 0; i + 4800 <= left.size(); i += 4800) {
      const double level = db(rms(out.left, i, i + 4800) / rms(left, i, i + 4800));
      loudest = std::max(loudest, level);
      quietest = std::min(quietest, level);
    }
    std::snprintf(label, sizeof label, "the default breath moves a chord's level by 4 to 10 dB (%.1f)", loudest - quietest);
    EXPECT(loudest - quietest > 4.0 && loudest - quietest < 10.5, label);
    EXPECT(loudest < 0.5, "and never lifts it over its own level");
    EXPECT(db(rms(out.left) / rms(left)) > -3.5, "and the chord's average level stays within 3.5 dB of the dry");

    // At full Width the spread is fed in over a few milliseconds, so a tone
    // caught at its crest does not come out of the all-passes as an edge.
    std::vector<float> tone = sine(220.0f, 1.0f, kRate, 0.3f);
    tone.erase(tone.begin(), tone.begin() + 55);
    device.init(kRate);
    device.set_param(p::kWidth, 1.0f);
    out = run(device, tone);
    const double own = max_step(tone, 0, at(0.03));
    const double made = std::max(max_step(out.left, 0, at(0.03)), max_step(out.right, 0, at(0.03)));
    std::snprintf(label, sizeof label, "Width 1 on a tone already sounding: the largest step is the tone's own (%.2f of it)", made / own);
    EXPECT(made <= 1.2 * own, label);
  }

  // The air is as loud as the breathing sound: Depth turns it down with the
  // sound, and it is gone soon after a note stops. (It followed the input
  // alone, and let go in 250 ms: over a deep breath and in a gap it was the
  // loudest thing.)
  {
    // Straight lines, 1 s a part: Hold to 1 s, Out to 2 s, half empty at 1.5 s.
    auto airy = [](Breath& d, float depth, float air) {
      level_only(d, {1.0, 1.0, 1.0, 1.0, depth, 0.0});
      d.set_param(p::kAir, air);
    };
    const std::vector<float> tone = sine(220.0f, 4.0f, kRate, 0.4f);
    auto air_of = [&](float depth) {
      airy(device, depth, 1.0f);
      Stereo with = run(device, tone);
      airy(device, depth, 0.0f);
      Stereo without = run(device, tone);
      return minus(with.left, without.left);
    };
    const std::vector<float> open = air_of(0.0f), deep = air_of(0.7f);
    const double floor = model_floor(0.7);
    EXPECT_NEAR(rms(deep, at(1.45), at(1.55)) / rms(open, at(1.45), at(1.55)), floor + (1.0 - floor) * 0.5, 0.03,
                "half way out, Depth 0.7 has turned the air down as far as the sound");
    // A note that stops dead half way through Out.
    std::vector<float> note = tone;
    for (size_t i = at(1.5); i < note.size(); ++i) note[i] = 0.0f;
    airy(device, 0.0f, 1.0f);
    Stereo out = run(device, note);
    const double before = rms(open, at(1.40), at(1.50));
    const double soon = rms(out.left, at(1.60), at(1.65)) / before;
    char label[160];
    std::snprintf(label, sizeof label, "a tenth of a second after a note stops the air is 10 dB down or more (%.1f dB)", db(soon));
    EXPECT(soon < 0.32, label);
    EXPECT(rms(out.left, at(1.9), at(1.95)) / before < 0.01, "and 40 dB down within 0.4 s");
    EXPECT(peak(out.left, at(3.0)) == 0.0, "and then nothing");
  }

  // The spread tone by tone. It turns each side up or down by frequency; at
  // full Width on a full breath no single tone may stand far to one side.
  // (At 0.6 of the middle it was 12 dB, and a held note swung across with
  // every breath.)
  {
    double worst = 0.0, up = 0.0, down = 0.0;
    for (int note = 45; note <= 96; ++note) {
      const double hz = 440.0 * std::pow(2.0, (note - 69) / 12.0);
      level_only(device, {0.2, 20.0, 0.2, kShortest, 0.0, 1.0});
      device.set_param(p::kWidth, 1.0f);
      Stereo out = run(device, sine(static_cast<float>(hz), 1.0f, kRate, 0.3f));
      const double left = db(tone_level(out.left, hz, kRate, at(0.5), at(1.0)) / 0.3);
      const double right = db(tone_level(out.right, hz, kRate, at(0.5), at(1.0)) / 0.3);
      worst = std::max(worst, std::fabs(left - right));
      up = std::max(up, std::max(left, right));
      down = std::min(down, std::min(left, right));
    }
    char label[160];
    std::snprintf(label, sizeof label, "Width 1, full: no tone from A2 to C7 is more than 3.6 dB apart between the sides (%.2f)", worst);
    EXPECT(worst < 3.6, label);
    EXPECT(worst > 2.0, "and the spread is there to be measured");
    EXPECT(up < 1.7 && down > -2.0, "a side is never more than 1.7 dB up or 2 dB down");
  }

  // The bottom of Hold and of Rest is 20 ms, and a setting under it is that.
  {
    device.init(kRate);
    device.set_param(p::kHold, 0.0f);
    device.set_param(p::kRest, 0.0f);
    EXPECT(device.param(p::kHold) == 0.02f && device.param(p::kRest) == 0.02f, "Hold and Rest stop at 20 ms");
    EXPECT_NEAR(device.meter(0), 3.0 / (3.0 + 0.02 + 4.5 + 0.02), 1.0e-6, "and the breath stands full, at the end of In");
  }

  // A sample too small to be worth the work is silence, and everything
  // else comes through exactly when nothing follows the breath.
  {
    device.init(kRate);
    Stereo out = run(device, dc(1.0f, 1.0e-40f));
    EXPECT(peak(out.left) == 0.0 && peak(out.right) == 0.0, "a steady denormal in is exact silence out");
    device.set_param(p::kMix, 0.0f);
    out = run(device, dc(0.2f, -1.0e-40f));
    EXPECT(peak(out.left) == 0.0 && peak(out.right) == 0.0, "on the dry path too");
    std::vector<float> small = sine(1000.0f, 1.0f, kRate, 0.3f);
    small[100] = 3.0e-16f;
    small[200] = -7.0e-20f;
    small[300] = 2.0e-29f;
    small[400] = -1.0e-15f;
    device.init(kRate);
    device.set_param(p::kDepth, 0.0f);
    device.set_param(p::kColour, 0.0f);
    device.set_param(p::kWidth, 0.0f);
    device.set_param(p::kAir, 0.0f);
    out = run(device, small);
    EXPECT(out.left == small && out.right == small, "with nothing following the breath the smallest samples come through as they are");
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  const std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("breath (defaults)", 10.0f, kRate, [&] { run(device, input); });
  device.init(kRate);
  device.set_param(p::kAir, 1.0f);
  device.set_param(p::kWidth, 1.0f);
  device.set_param(p::kColour, 1.0f);
  device.set_param(p::kIn, 0.2f);
  device.set_param(p::kOut, 0.2f);
  device.set_param(p::kHold, 0.0f);
  device.set_param(p::kRest, 0.0f);
  device.set_param(p::kVary, 1.0f);
  report_cost("breath (everything up, the shortest breath)", 10.0f, kRate, [&] { run(device, input); });

  return finish("breath");
}
