// Native harness for Currents (cpp/devices/currents). The conformance pass
// covers stability, silence when idle, block-size independence on a steady
// sound and parameter abuse; the rest measures what makes it Currents: that
// nothing is changed until a band moves, that each band's level and side turn
// at their own speeds, how far they go, that the whole stays as loud, that
// the waves run on through a silence, and that the output is the same at
// every block size across one.

#include <cstdlib>

#include "../devices/currents/currents.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Currents;
namespace p = livemix::currents;

static Currents device;
static Currents other;

static const float kRate = 48000.0f;
static const float kTop = Currents::kTopHz;

// Steady, exact settings: every cycle alike, even rise and fall, narrow
// bands, no side movement.
static void exact(Currents& d, int bands, float rate, float tide, float depth, float sway,
                  float sample_rate = kRate) {
  d.init(sample_rate);
  d.set_param(p::kBands, static_cast<float>(bands));
  d.set_param(p::kRate, rate);
  d.set_param(p::kTide, tide);
  d.set_param(p::kDepth, depth);
  d.set_param(p::kSway, sway);
  d.set_param(p::kShape, 0.0f);
  d.set_param(p::kChance, 0.0f);
  d.set_param(p::kFocus, 1.0f);
}

static float centre(int bands, int band, float low_hold = 120.0f) {
  return Currents::centre_hz(low_hold, bands, band, kTop);
}

// How fast band `band` of `bands` turns.
static double speed(float rate, float tide, int bands, int band) {
  return rate * std::pow(static_cast<double>(Currents::kSpread),
                         tide * static_cast<double>(band) / (bands - 1));
}

static std::vector<float> tones(const std::vector<float>& hz, float seconds, float gain,
                                float sample_rate = kRate) {
  std::vector<float> out(static_cast<size_t>(seconds * sample_rate), 0.0f);
  for (float f : hz) {
    const std::vector<float> one = sine(f, seconds, sample_rate, gain);
    for (size_t i = 0; i < out.size(); ++i) out[i] += one[i];
  }
  return out;
}

static const size_t kWindow = 2048;
static const size_t kHop = 240;  // 200 readings a second at 48 kHz

// The level of the `hz` part of `x` over time, one reading every kHop samples.
static std::vector<float> level_of(const std::vector<float>& x, double hz, double sample_rate = kRate,
                                   size_t from = 0) {
  std::vector<float> out;
  for (size_t i = from; i + kWindow <= x.size(); i += kHop) {
    out.push_back(static_cast<float>(tone_level(x, hz, sample_rate, i, i + kWindow)));
  }
  return out;
}

static double lowest(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  double v = 1.0e9;
  for (size_t i = from; i < std::min(to, x.size()); ++i) v = std::min(v, static_cast<double>(x[i]));
  return v;
}
static double highest(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  double v = -1.0e9;
  for (size_t i = from; i < std::min(to, x.size()); ++i) v = std::max(v, static_cast<double>(x[i]));
  return v;
}
static std::vector<float> centred(const std::vector<float>& x) {
  const double m = mean(x);
  std::vector<float> out(x.size());
  for (size_t i = 0; i < x.size(); ++i) out[i] = static_cast<float>(x[i] - m);
  return out;
}

// How alike `x` is to itself `lag` readings later.
static double repeats(const std::vector<float>& x, size_t lag) {
  const std::vector<float> c = centred(x);
  double sab = 0.0, saa = 0.0, sbb = 0.0;
  for (size_t i = 0; i + lag < c.size(); ++i) {
    sab += static_cast<double>(c[i]) * c[i + lag];
    saa += static_cast<double>(c[i]) * c[i];
    sbb += static_cast<double>(c[i + lag]) * c[i + lag];
  }
  return (saa > 0.0 && sbb > 0.0) ? sab / std::sqrt(saa * sbb) : 0.0;
}

static double worst_difference(const Stereo& a, const Stereo& b, size_t from = 0, size_t to = SIZE_MAX) {
  double worst = 0.0;
  to = std::min(to, std::min(a.size(), b.size()));
  for (size_t i = from; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

// Noise whose power falls 3 dB an octave, as music's does (Paul Kellet's filter).
static std::vector<float> pink(float seconds, float gain) {
  std::vector<float> out(static_cast<size_t>(seconds * kRate));
  double b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (float& v : out) {
    const double w = white();
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.96900 * b2 + w * 0.1538520;
    b3 = 0.86650 * b3 + w * 0.3104856;
    b4 = 0.55000 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.0168980;
    v = static_cast<float>(gain * 0.11 * (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362));
    b6 = w * 0.115926;
  }
  return out;
}

// Run `input` in pieces, calling `between(piece)` before each piece but the
// first, with the block size starting again at every piece: so an event lands
// on the same sample at every block size.
template <typename Between>
static Stereo run_pieces(Currents& d, const std::vector<std::vector<float>>& pieces, int block,
                         Between between) {
  Stereo out;
  for (size_t n = 0; n < pieces.size(); ++n) {
    if (n > 0) between(static_cast<int>(n));
    out = concat(out, run(d, pieces[n], block));
  }
  return out;
}

// A block size that changes all the time.
static Stereo run_ragged(Currents& d, const std::vector<float>& input) {
  Stereo out;
  out.left.resize(input.size());
  out.right.resize(input.size());
  const int sizes[] = {1, 7, 64, 128, 33, 512, 2048, 5, 1999, 300};
  size_t done = 0;
  int which = 0;
  while (done < input.size()) {
    const int frames = static_cast<int>(
        std::min(static_cast<size_t>(sizes[which++ % 10]), input.size() - done));
    for (int i = 0; i < frames; ++i) {
      d.in_left()[i] = input[done + i];
      d.in_right()[i] = input[done + i];
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

// How much of what an event does is there within 8 samples of it: the same
// passage is rendered with and without the event, and the largest difference
// in the first 8 samples is set against the largest over the next 20 ms. A
// glide has barely begun; a step is all there at once. The worst of eight
// moments a little apart, so a step cannot hide in a zero crossing. `moved`
// comes back as the largest difference found, to show the event did something.
template <typename Setup, typename Event>
static double suddenness(Setup setup, Event event, double* moved = nullptr) {
  double worst = 0.0;
  double most = 0.0;
  // Two of the tones turn fast enough to show a step within 8 samples wherever it falls.
  const std::vector<float> bed = tones({589.0f, 2889.0f, 6400.0f}, 1.0f, 0.2f);
  for (int moment = 0; moment < 8; ++moment) {
    const size_t at = 24000 + static_cast<size_t>(moment) * 37;
    const std::vector<float> before(bed.begin(), bed.begin() + static_cast<long>(at));
    const std::vector<float> after(bed.begin() + static_cast<long>(at),
                                   bed.begin() + static_cast<long>(at + 960));
    setup(device);
    run(device, before);
    event(device);
    const Stereo with = run(device, after);
    setup(other);
    run(other, before);
    const Stereo without = run(other, after);
    double early = 0.0, whole = 0.0;
    for (size_t i = 0; i < with.size(); ++i) {
      const double d = std::max(std::fabs(static_cast<double>(with.left[i]) - without.left[i]),
                                std::fabs(static_cast<double>(with.right[i]) - without.right[i]));
      if (i < 8) early = std::max(early, d);
      whole = std::max(whole, d);
    }
    most = std::max(most, whole);
    if (whole > 0.0) worst = std::max(worst, early / whole);
  }
  if (moved) *moved = most;
  return worst;
}

int main() {
  Conformance spec;
  spec.name = "currents";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 1.0f;
  spec.max_peak = 4.0f;  // a crest at full Depth is 4.3 dB up, a side at its furthest 3 dB more
  check_effect(device, spec, kRate);

  // Nothing is changed until a band moves: with Depth 0 and Sway 0 the output
  // is the input, bit for bit, at full Mix, on two sides that differ. And at
  // Mix 0 it is the input whatever the bands do.
  {
    rng_state() = 0xC0FFEEu;
    const std::vector<float> left = noise(1.0f, kRate, 0.5f);
    const std::vector<float> right = noise(1.0f, kRate, 0.5f);
    device.init(kRate);
    device.set_param(p::kDepth, 0.0f);
    device.set_param(p::kSway, 0.0f);
    Stereo out = run(device, left, right);
    EXPECT(out.left == left && out.right == right,
           "Depth 0 and Sway 0: the output is the input exactly, at full Mix");
    device.init(kRate);
    device.set_param(p::kDepth, 1.0f);
    device.set_param(p::kSway, 1.0f);
    device.set_param(p::kRate, 2.0f);
    device.set_param(p::kMix, 0.0f);
    out = run(device, left, right);
    EXPECT(out.left == left && out.right == right, "Mix 0: the output is the input exactly");

    // Mix is a straight crossfade: half Mix is half of what full Mix changes.
    exact(device, 5, 1.0f, 0.5f, 1.0f, 1.0f);
    const Stereo full = run(device, left, right);
    exact(device, 5, 1.0f, 0.5f, 1.0f, 1.0f);
    device.set_param(p::kMix, 0.5f);
    const Stereo half = run(device, left, right);
    double worst = 0.0, changed = 0.0;
    for (size_t i = 0; i < left.size(); ++i) {
      const double all = static_cast<double>(full.left[i]) - left[i];
      worst = std::max(worst, std::fabs((static_cast<double>(half.left[i]) - left[i]) - 0.5 * all));
      changed = std::max(changed, std::fabs(all));
    }
    EXPECT(changed > 0.2, "at full Depth and Sway the bands change the sound");
    EXPECT(worst < 1.0e-5, "Mix 0.5 is half of what Mix 1 changes");
  }

  // Each band's level turns at its own speed, and the speeds follow Rate and
  // Tide: band k of N at Rate · (2π)^(Tide · k/(N − 1)). A tone at each
  // band's centre, all at once; each tone's level is read over time.
  {
    struct Case {
      int bands;
      float rate, tide;
    };
    const Case cases[] = {{5, 0.5f, 0.5f}, {6, 0.25f, 1.0f}, {3, 1.0f, 1.0f}, {4, 0.5f, 0.0f}};
    for (const Case& c : cases) {
      exact(device, c.bands, c.rate, c.tide, 1.0f, 0.0f);
      std::vector<float> at;
      for (int k = 0; k < c.bands; ++k) at.push_back(centre(c.bands, k));
      const float seconds = 12.0f / c.rate;
      const Stereo out = run(device, tones(at, seconds, 0.12f));
      for (int k = 0; k < c.bands; ++k) {
        const std::vector<float> level = level_of(out.left, at[static_cast<size_t>(k)]);
        const double expected = speed(c.rate, c.tide, c.bands, k);
        const double measured =
            dominant_frequency(centred(level), 200.0, expected / 1.8, expected * 1.8);
        char label[128];
        std::snprintf(label, sizeof label, "%d bands, Rate %.2f, Tide %.1f: band %d turns at %.3f Hz",
                      c.bands, c.rate, c.tide, k + 1, expected);
        EXPECT_NEAR(measured, expected, 0.015 * expected, label);
        std::snprintf(label, sizeof label, "%d bands, Tide %.1f: band %d swings deeply (%.2f to %.2f)",
                      c.bands, c.tide, k + 1, lowest(level, 100), highest(level, 100));
        EXPECT(lowest(level, 100) < 0.3 * highest(level, 100), label);
      }
    }
    // The highest band turns 2π times as fast as the lowest at full Tide.
    EXPECT_NEAR(speed(1.0f, 1.0f, 6, 5) / speed(1.0f, 1.0f, 6, 0), 6.2832, 1.0e-3,
                "full Tide spreads the speeds by 2π");
  }

  // Depth: a band falls to c·(1 − Depth) and crests at c, where c keeps the
  // power over a cycle at the input's up to Depth 0.6 and stays there past
  // it. The middle band of three, whose neighbours are two octaves off.
  {
    const float at = centre(3, 1);
    for (float depth : {0.3f, 0.6f, 1.0f}) {
      exact(device, 3, 1.0f, 0.0f, depth, 0.0f);
      const Stereo out = run(device, sine(at, 10.0f, kRate, 0.5f));
      const std::vector<float> level = level_of(out.left, at);
      const double trim = Currents::level_trim(depth);
      char label[128];
      std::snprintf(label, sizeof label, "Depth %.1f: a band crests at %.3f of where it was", depth, trim);
      EXPECT_NEAR(highest(level, 200) / 0.5, trim, 0.03 * trim, label);
      std::snprintf(label, sizeof label, "Depth %.1f: and falls to %.3f", depth, trim * (1.0f - depth));
      EXPECT_NEAR(lowest(level, 200) / 0.5, trim * (1.0 - depth), 0.06, label);
      // Nine whole cycles, from one second in.
      const double power = rms(out.left, 48000, 480000) / (0.5 / std::sqrt(2.0));
      std::snprintf(label, sizeof label, "Depth %.1f: the power over whole cycles is the input's (%.2f dB)",
                    depth, db(power));
      if (depth <= Currents::kTrimDepth) EXPECT(std::fabs(db(power)) < 0.35, label);
      EXPECT(out.left == out.right, "with no Sway both sides are moved alike");
      if (depth > Currents::kTrimDepth) {
        // Past Depth 0.6 the crest goes no higher and the band grows quieter as its trough deepens.
        std::snprintf(label, sizeof label,
                      "Depth %.1f: the crest is the one at Depth 0.6 (%.3f against %.3f)", depth,
                      highest(level, 200) / 0.5, Currents::level_trim(Currents::kTrimDepth));
        EXPECT_NEAR(highest(level, 200) / 0.5, Currents::level_trim(Currents::kTrimDepth), 0.04, label);
        std::snprintf(label, sizeof label,
                      "Depth %.1f: the power over whole cycles is 1.5 dB under the input's (%.2f dB)", depth,
                      db(power));
        EXPECT_NEAR(db(power), -1.54, 0.35, label);
      }
    }
    EXPECT_NEAR(db(Currents::level_trim(0.6f)), 2.72, 0.02, "at Depth 0.6 a crest is 2.7 dB up");
    EXPECT(Currents::level_trim(1.0f) == Currents::level_trim(Currents::kTrimDepth),
           "at full Depth a crest is no higher than at Depth 0.6");
  }

  // Sway: a centred tone in a band travels between the sides at 0.618 of the
  // band's level speed, the power of the two sides together holds, and their
  // sum never loses the band.
  {
    const float at = centre(3, 1);
    exact(device, 3, 1.0f, 0.0f, 0.0f, 1.0f);
    const Stereo out = run(device, sine(at, 16.0f, kRate, 0.5f));
    const std::vector<float> left = level_of(out.left, at);
    const std::vector<float> right = level_of(out.right, at);
    std::vector<float> balance(left.size()), power(left.size());
    for (size_t i = 0; i < left.size(); ++i) {
      balance[i] = right[i] - left[i];
      power[i] = left[i] * left[i] + right[i] * right[i];
    }
    EXPECT_NEAR(dominant_frequency(centred(balance), 200.0, 0.3, 1.2), Currents::kSideRatio,
                0.01, "Sway: the band crosses at 0.618 of its level speed");
    EXPECT_NEAR(highest(left, 200) / 0.5, 1.414, 0.04, "Sway 1: a side at its furthest carries the whole band");
    EXPECT(lowest(left, 200) / 0.5 < 0.12 && lowest(right, 200) / 0.5 < 0.12,
           "Sway 1: and the other side is all but empty");
    EXPECT(highest(power, 200) / lowest(power, 200) < 1.06, "Sway: the power of the two sides together holds");
    EXPECT_NEAR(std::sqrt(mean(power) * 0.5) / 0.5, 1.0, 0.02, "Sway: and it is the input's");
    std::vector<float> sum(out.size());
    for (size_t i = 0; i < out.size(); ++i) sum[i] = 0.5f * (out.left[i] + out.right[i]);
    const std::vector<float> mono = level_of(sum, at);
    EXPECT(lowest(mono, 200) / 0.5 > 0.69 && highest(mono, 200) / 0.5 < 1.02,
           "Sway 1: the sum of the sides never loses the band (3 dB at the most)");

    // Half the Sway is half the way.
    exact(device, 3, 1.0f, 0.0f, 0.0f, 0.5f);
    const Stereo part = run(device, sine(at, 16.0f, kRate, 0.5f));
    const std::vector<float> near_left = level_of(part.left, at);
    // At ±0.5 the equal power law gives √2·cos(π/8) and √2·sin(π/8).
    EXPECT_NEAR(highest(near_left, 200) / 0.5, 1.3066, 0.03, "Sway 0.5: half way to a side at the most");
    EXPECT_NEAR(lowest(near_left, 200) / 0.5, 0.5412, 0.04, "Sway 0.5: and no further");

    // What the two sides do not share is left where it is.
    exact(device, 5, 2.0f, 1.0f, 0.0f, 1.0f);
    rng_state() = 0xFACEu;
    const std::vector<float> wide = noise(2.0f, kRate, 0.4f);
    std::vector<float> inverse(wide.size());
    for (size_t i = 0; i < wide.size(); ++i) inverse[i] = -wide[i];
    const Stereo apart = run(device, wide, inverse);
    double worst = 0.0;
    for (size_t i = 0; i < wide.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(apart.left[i]) - wide[i]));
      worst = std::max(worst, std::fabs(static_cast<double>(apart.right[i]) - inverse[i]));
    }
    EXPECT(worst < 1.0e-5, "Sway moves what the sides share and leaves the rest in place");
  }

  // The whole stays as loud. Twenty minutes of the slowest band at the Rate
  // the device starts at, run at 2 Hz to fit: full Depth and Sway, every
  // cycle different, on noise shaped like music.
  {
    device.init(kRate);
    device.set_param(p::kDepth, 1.0f);
    device.set_param(p::kSway, 1.0f);
    device.set_param(p::kRate, 2.0f);
    device.set_param(p::kChance, 1.0f);
    device.set_param(p::kLowHold, 60.0f);
    rng_state() = 0x5EEDu;
    const std::vector<float> in = pink(60.0f, 0.5f);
    const Stereo out = run(device, in);
    const size_t window = 48000;
    double low = 1.0e9, high = -1.0e9;
    for (size_t i = 0; i + window <= in.size(); i += window / 2) {
      const double l = rms(out.left, i, i + window), r = rms(out.right, i, i + window);
      const double level = db(std::sqrt(0.5 * (l * l + r * r)) / rms(in, i, i + window));
      low = std::min(low, level);
      high = std::max(high, level);
    }
    const double l = rms(out.left), r = rms(out.right);
    const double overall = db(std::sqrt(0.5 * (l * l + r * r)) / rms(in));
    char label[160];
    std::snprintf(label, sizeof label,
                  "full Depth at 2 Hz: every second between the input's level and 3 dB under (%.2f to %.2f dB)",
                  low, high);
    EXPECT(low > -3.0 && high < 0.0, label);
    std::snprintf(label, sizeof label,
                  "at full Depth the whole is a decibel or two under the input, as each band is (%.2f dB)",
                  overall);
    EXPECT(overall > -2.5 && overall < -0.75, label);
    const double crest = std::max(peak(out.left), peak(out.right)) / peak(in);
    std::snprintf(label, sizeof label, "full Depth and Sway: no peak more than 6 dB over the input's (%.2f dB)",
                  db(crest));
    EXPECT(db(crest) < 6.0, label);
  }

  // Low Hold: below it the sound is steady and in the middle; well above it
  // moves. And the bands move up with it.
  {
    auto swing = [&](float low_hold, float hz, double* side) {
      exact(device, 5, 1.0f, 0.5f, 1.0f, 1.0f);
      device.set_param(p::kFocus, 0.25f);
      device.set_param(p::kLowHold, low_hold);
      const Stereo out = run(device, sine(hz, 12.0f, kRate, 0.5f));
      const std::vector<float> left = level_of(out.left, hz);
      const std::vector<float> right = level_of(out.right, hz);
      double off = 0.0;
      for (size_t i = 200; i < left.size(); ++i) {
        off = std::max(off, std::fabs(db(static_cast<double>(right[i]) / left[i])));
      }
      if (side) *side = off;
      return db(highest(left, 200) / lowest(left, 200));
    };
    double side_low = 0.0, side_high = 0.0;
    const double below = swing(120.0f, 40.0f, &side_low);
    const double above = swing(120.0f, 600.0f, &side_high);
    char label[160];
    std::snprintf(label, sizeof label,
                  "Low Hold 120: 40 Hz holds still (%.2f dB of swing, %.2f dB between the sides)", below,
                  side_low);
    EXPECT(below < 1.5 && side_low < 1.5, label);
    std::snprintf(label, sizeof label, "Low Hold 120: 600 Hz moves (%.1f dB of swing, %.1f dB between the sides)",
                  above, side_high);
    EXPECT(above > 10.0 && side_high > 10.0, label);
    const double held = swing(800.0f, 300.0f, nullptr);
    std::snprintf(label, sizeof label, "Low Hold 800: 300 Hz now holds still (%.2f dB of swing)", held);
    EXPECT(held < 1.5, label);
    const double low = swing(20.0f, 40.0f, nullptr);
    std::snprintf(label, sizeof label, "Low Hold 20: 40 Hz now moves (%.1f dB of swing)", low);
    EXPECT(low > 6.0, label);
  }

  // Shape: the share of a cycle the rise takes goes from a half to 0.92.
  {
    const float at = centre(3, 1);
    for (int which = 0; which < 2; ++which) {
      // Half the Depth, so the trough is a level to find and not a silence.
      exact(device, 3, 0.5f, 0.0f, 0.5f, 0.0f);
      device.set_param(p::kShape, static_cast<float>(which));
      const Stereo out = run(device, sine(at, 8.0f, kRate, 0.5f));
      const std::vector<float> level = level_of(out.left, at);
      // One cycle is 400 readings. From the first trough after a second, to the crest after it.
      size_t trough = 200;
      for (size_t i = 200; i < 600; ++i)
        if (level[i] < level[trough]) trough = i;
      size_t crest = trough;
      for (size_t i = trough; i < trough + 400 && i < level.size(); ++i)
        if (level[i] > level[crest]) crest = i;
      const double rise = static_cast<double>(crest - trough) / 400.0;
      EXPECT_NEAR(rise, which == 0 ? Currents::kTurn : Currents::kTurn + Currents::kBreak, 0.03,
                  which == 0 ? "Shape 0: the rise takes half the cycle"
                             : "Shape 1: the rise takes 0.92 of the cycle and the fall the rest");
    }
  }

  // The gains run straight between two workings, not in steps: the highest
  // band of three at 12.6 Hz with the quickest fall there is (5 ms), on a
  // tone at its centre. Gains held for 16 samples would put copies of the
  // modulation 3 kHz either side of the tone (measured at -56 dB with the
  // run between workings taken out); as built they are under -95 dB.
  {
    const float at = centre(3, 2);
    exact(device, 3, 2.0f, 1.0f, 1.0f, 0.0f);
    device.set_param(p::kShape, 1.0f);
    const Stereo out = run(device, sine(at, 4.0f, kRate, 0.5f));
    const double turns = speed(2.0f, 1.0f, 3, 2);
    const double working = kRate / 16.0;
    double worst = -200.0;
    for (double side : {-1.0, 1.0}) {
      for (int m = 1; m <= 3; ++m) {
        for (double way : {-1.0, 1.0}) {
          const double hz = at + side * working + way * m * turns;
          worst = std::max(worst, db(tone_level(out.left, hz, kRate, 48000, 192000) / 0.5));
        }
      }
    }
    // The peak of each millisecond: the tone's level, fast enough for an 80 ms cycle.
    double low = 1.0e9, high = 0.0;
    for (size_t i = 4800; i + 48 <= out.size(); i += 48) {
      low = std::min(low, peak(out.left, i, i + 48));
      high = std::max(high, peak(out.left, i, i + 48));
    }
    EXPECT(low < 0.1 * high && high > 0.62, "the band swings fully at its fastest");
    char label[128];
    std::snprintf(label, sizeof label, "the gains run smoothly between workings (images at %.1f dB)", worst);
    EXPECT(worst < -85.0, label);
  }

  // Chance: without it every cycle is the last one again; with it the crests
  // and troughs differ and no cycle repeats, while the period stays put.
  {
    const float at = centre(3, 1);
    double alike[2], crest_spread[2], trough_most[2];
    for (int which = 0; which < 2; ++which) {
      exact(device, 3, 1.0f, 0.0f, 1.0f, 0.0f);
      device.set_param(p::kChance, static_cast<float>(which));
      const Stereo out = run(device, sine(at, 40.0f, kRate, 0.5f));
      const std::vector<float> level = level_of(out.left, at);
      alike[which] = repeats(level, 200);  // one cycle later
      double low_crest = 1.0e9, high_crest = 0.0, high_trough = 0.0;
      int cycles = 0;
      for (size_t i = 200; i + 200 <= level.size(); i += 200, ++cycles) {
        low_crest = std::min(low_crest, highest(level, i, i + 200));
        high_crest = std::max(high_crest, highest(level, i, i + 200));
        high_trough = std::max(high_trough, lowest(level, i, i + 200));
      }
      crest_spread[which] = low_crest / high_crest;
      trough_most[which] = high_trough / 0.5;
      if (which == 1) {
        const double hz = dominant_frequency(centred(level), 200.0, 0.5, 2.0);
        EXPECT_NEAR(hz, 1.0, 0.02, "Chance 1: the period is still Rate's");
      }
    }
    EXPECT(alike[0] > 0.999 && crest_spread[0] > 0.99 && trough_most[0] < 0.03,
           "Chance 0: every cycle is the same, down to silence and up to the same crest");
    EXPECT(alike[1] < 0.9, "Chance 1: a cycle is not the one before");
    EXPECT(crest_spread[1] < 0.8, "Chance 1: the crests differ in height");
    EXPECT(trough_most[1] > 0.2, "Chance 1: some troughs stop short of silence");
  }

  // Focus: narrow bands leave the sound between two centres alone; broad
  // ones reach it.
  {
    const float between = std::sqrt(centre(3, 0) * centre(3, 1));
    double swing[2];
    for (int which = 0; which < 2; ++which) {
      exact(device, 3, 1.0f, 0.0f, 1.0f, 0.0f);
      device.set_param(p::kFocus, static_cast<float>(which));
      const Stereo out = run(device, sine(between, 8.0f, kRate, 0.5f));
      const std::vector<float> level = level_of(out.left, between);
      swing[which] = db(highest(level, 200) / lowest(level, 200));
    }
    char label[128];
    std::snprintf(label, sizeof label, "Focus: half way between two bands moves %.1f dB broad and %.1f dB narrow",
                  swing[0], swing[1]);
    EXPECT(swing[0] > 2.0 * swing[1] && swing[1] < 3.0, label);
  }

  // The waves run freely: a silence does not start them again. After three
  // seconds without input the bands are where they would have been had the
  // sound never stopped. (Had they restarted, the two would be a cycle's
  // worth apart.)
  {
    const std::vector<float> bed = tones({233.0f, 589.0f, 1304.0f, 2889.0f, 6400.0f}, 8.0f, 0.1f);
    std::vector<float> gapped = bed;
    for (size_t i = 96000; i < 240000; ++i) gapped[i] = 0.0f;
    device.init(kRate);
    device.set_param(p::kRate, 0.37f);
    device.set_param(p::kDepth, 1.0f);
    device.set_param(p::kSway, 1.0f);
    const Stereo straight = run(device, bed);
    device.init(kRate);
    device.set_param(p::kRate, 0.37f);
    device.set_param(p::kDepth, 1.0f);
    device.set_param(p::kSway, 1.0f);
    const Stereo broken = run(device, gapped);
    EXPECT(peak(broken.left, 120000, 240000) == 0.0, "the device sleeps in the silence");
    // The filters ring in again over a few milliseconds; after that it is the same sound.
    const double apart = worst_difference(straight, broken, 240000 + 4800);
    char label[128];
    std::snprintf(label, sizeof label, "after a silence the bands are where they would have been (apart by %g)", apart);
    EXPECT(apart < 2.0e-3, label);
    EXPECT(worst_difference(straight, broken, 0, 96000) == 0.0, "and before it they were the same");
  }

  // The readings a display follows: each wave's place in cycles, running at
  // the band's speed, also while the device sleeps.
  {
    device.init(kRate);
    device.set_param(p::kRate, 0.5f);
    device.set_param(p::kTide, 1.0f);
    device.set_param(p::kBands, 6.0f);
    run(device, sine(440.0f, 3.0f, kRate, 0.2f));
    for (int k = 0; k < 6; ++k) {
      const double hz = speed(0.5f, 1.0f, 6, k);
      const double level_from = Currents::kLevelStart + k * static_cast<double>(Currents::kLevelStep);
      const double side_from = Currents::kSideStart + k * static_cast<double>(Currents::kSideStep);
      const double level = level_from - std::floor(level_from) + hz * 3.0;
      const double side = side_from - std::floor(side_from) + hz * Currents::kSideRatio * 3.0;
      char label[96];
      std::snprintf(label, sizeof label, "band %d reports where its level wave is", k + 1);
      EXPECT_NEAR(device.meter(k), level - std::floor(level / 4096.0) * 4096.0, 2.0e-3, label);
      std::snprintf(label, sizeof label, "band %d reports where its side wave is", k + 1);
      EXPECT_NEAR(device.meter(6 + k), side - std::floor(side / 4096.0) * 4096.0, 2.0e-3, label);
    }
    render(device, 2.0f, kRate);  // asleep for most of it
    const double asleep = Currents::kLevelStart + 0.5 * 5.0;
    EXPECT_NEAR(device.meter(0), asleep, 2.0e-3, "asleep, the reading is where waking would put the wave");
    EXPECT(device.meter(-1) == 0.0f && device.meter(12) == 0.0f, "a reading that is not there is nought");
  }

  // The same sound at every block size across a silence. The silence is
  // stepped across the time the device takes to fall asleep (a fifth of a
  // second and a block), a knob is moved inside it, and speeds are changed
  // while it sleeps.
  {
    rng_state() = 0xABCDu;
    const std::vector<float> first = noise(0.2f, kRate, 0.4f);
    const std::vector<float> second = noise(0.3f, kRate, 0.4f);
    double worst = 0.0;
    float worst_gap = 0.0f;
    std::vector<float> gaps;
    for (float gap = 0.14f; gap < 0.36f; gap += 0.01f) gaps.push_back(gap);
    gaps.push_back(1.3f);
    for (float gap : gaps) {
      // The knobs move 5 ms before the sound comes back.
      const std::vector<std::vector<float>> pieces = {
          first, silence(gap - 0.005f, kRate), silence(0.005f, kRate), second};
      auto between = [&](int piece) {
        if (piece == 2) {
          device.set_param(p::kDepth, 1.0f);
          device.set_param(p::kSway, 0.9f);
          device.set_param(p::kLowHold, 300.0f);
          device.set_param(p::kBands, 3.0f);
          device.set_param(p::kRate, 1.7f);
          device.set_param(p::kTide, 0.9f);
          device.set_param(p::kMix, 0.8f);
          device.set_param(p::kFocus, 0.7f);
        }
      };
      device.init(kRate);
      const Stereo reference = run_pieces(device, pieces, 128, between);
      for (int block : {1, 2048, 0}) {
        device.init(kRate);
        Stereo out;
        if (block == 0) {
          out = run_ragged(device, pieces[0]);
          out = concat(out, run_ragged(device, pieces[1]));
          between(2);
          out = concat(out, run_ragged(device, pieces[2]));
          out = concat(out, run_ragged(device, pieces[3]));
        } else {
          out = run_pieces(device, pieces, block, between);
        }
        const double apart = worst_difference(reference, out);
        if (apart > worst) {
          worst = apart;
          worst_gap = gap;
        }
      }
    }
    char label[160];
    std::snprintf(label, sizeof label,
                  "the same at block sizes 1, 128, 2048 and ragged across a silence (worst %g, at %.2f s)",
                  worst, worst_gap);
    EXPECT(worst < 1.0e-6, label);
  }

  // A knob moved while the device sleeps has arrived when the sound returns:
  // the output is that of a device that had the knob there all along.
  {
    rng_state() = 0x1357u;
    const std::vector<float> burst = noise(0.3f, kRate, 0.4f);
    auto moved = [&](Currents& d, bool late) {
      d.init(kRate);
      d.set_param(p::kRate, 1.0f);
      if (!late) {
        d.set_param(p::kDepth, 1.0f);
        d.set_param(p::kSway, 1.0f);
        d.set_param(p::kShape, 0.9f);
        d.set_param(p::kChance, 0.8f);
        d.set_param(p::kFocus, 0.8f);
        d.set_param(p::kLowHold, 400.0f);
        d.set_param(p::kMix, 0.7f);
      }
      run(d, burst);
      // Off the beat of the control clock, then asleep.
      for (int i = 0; i < 13; ++i) d.in_left()[i] = d.in_right()[i] = 0.1f;
      d.process(13);
      render(d, 1.0f, kRate);
      if (late) {
        d.set_param(p::kDepth, 1.0f);
        d.set_param(p::kSway, 1.0f);
        d.set_param(p::kShape, 0.9f);
        d.set_param(p::kChance, 0.8f);
        d.set_param(p::kFocus, 0.8f);
        d.set_param(p::kLowHold, 400.0f);
        d.set_param(p::kMix, 0.7f);
      }
      return run(d, burst);
    };
    const Stereo all_along = moved(device, false);
    const Stereo in_sleep = moved(other, true);
    const double apart = worst_difference(all_along, in_sleep);
    char label[128];
    std::snprintf(label, sizeof label, "knobs moved in the silence have arrived when sound returns (apart by %g)",
                  apart);
    EXPECT(apart < 1.0e-6, label);
  }

  // Nothing clicks: every control thrown from one end to the other while
  // three tones sound, against the same passage without the throw.
  {
    struct Throw {
      const char* name;
      int id;
      float from, to;
      bool audible;
    };
    const Throw throws[] = {
        {"Depth up", p::kDepth, 0.0f, 1.0f, true},     {"Depth down", p::kDepth, 1.0f, 0.0f, true},
        {"Sway up", p::kSway, 0.0f, 1.0f, true},       {"Sway down", p::kSway, 1.0f, 0.0f, true},
        {"Mix down", p::kMix, 1.0f, 0.0f, true},       {"Mix up", p::kMix, 0.0f, 1.0f, true},
        {"Bands up", p::kBands, 3.0f, 6.0f, true},     {"Bands down", p::kBands, 6.0f, 3.0f, true},
        {"Shape", p::kShape, 0.0f, 1.0f, true},        {"Chance", p::kChance, 0.0f, 1.0f, true},
        {"Focus up", p::kFocus, 0.0f, 1.0f, true},     {"Focus down", p::kFocus, 1.0f, 0.0f, true},
        {"Low Hold up", p::kLowHold, 20.0f, 800.0f, true},
        {"Low Hold down", p::kLowHold, 800.0f, 20.0f, true},
        {"Rate", p::kRate, 0.005f, 2.0f, false},       {"Tide", p::kTide, 0.0f, 1.0f, false},
    };
    for (const Throw& t : throws) {
      double moved = 0.0;
      const double sudden = suddenness(
          [&](Currents& d) {
            d.init(kRate);
            d.set_param(p::kDepth, 0.9f);
            d.set_param(p::kSway, 0.8f);
            d.set_param(p::kRate, 1.3f);
            d.set_param(t.id, t.from);
          },
          [&](Currents& d) { d.set_param(t.id, t.to); }, &moved);
      char label[128];
      std::snprintf(label, sizeof label, "%s thrown end to end starts gradually (%.3f of it in 8 samples)",
                    t.name, sudden);
      EXPECT(sudden < 0.15, label);
      if (t.audible) {
        std::snprintf(label, sizeof label, "%s thrown end to end changes the sound (by %g)", t.name, moved);
        EXPECT(moved > 0.01, label);
      }
    }
  }

  // Bad input: samples that are not numbers, infinite ones and absurd ones
  // do not stay in the filters. A tenth of a second after good input returns
  // the output is that of a device that never saw them.
  {
    const std::vector<float> good = tones({300.0f, 2000.0f}, 1.0f, 0.2f);
    std::vector<float> bad(4800, 0.0f);
    const float values[] = {std::nanf(""), INFINITY, -INFINITY, 1.0e30f, -1.0e30f, 0.3f};
    for (size_t i = 0; i < bad.size(); ++i) bad[i] = values[i % 6];
    device.init(kRate);
    device.set_param(p::kDepth, 1.0f);
    device.set_param(p::kFocus, 1.0f);
    run(device, good);
    const Stereo during = run(device, bad);
    const Stereo after = run(device, good);
    other.init(kRate);
    other.set_param(p::kDepth, 1.0f);
    other.set_param(p::kFocus, 1.0f);
    run(other, good);
    run(other, std::vector<float>(4800, 0.3f));
    const Stereo clean = run(other, good);
    EXPECT(finite(during.left) && finite(during.right), "the output stays finite while the input is not");
    EXPECT(finite(after.left) && finite(after.right), "and after it");
    const double apart = worst_difference(after, clean, 4800);
    char label[128];
    std::snprintf(label, sizeof label, "0.1 s after bad input the output is as if it never came (apart by %g)", apart);
    EXPECT(apart < 1.0e-4, label);
    EXPECT(rms(after.left, 4800) > 0.05, "and the device still passes sound");
  }

  // The device sleeps and wakes, and 96 kHz turns the bands at the same speeds.
  {
    device.init(kRate);
    run(device, sine(440.0f, 0.5f, kRate, 0.5f));
    render(device, 0.5f, kRate);
    Stereo rest = render(device, 0.5f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the input stops");
    Stereo woken = run(device, sine(440.0f, 0.5f, kRate, 0.5f));
    EXPECT(peak(woken.left) > 0.2, "wakes on new input");

    const float at = centre(3, 1);
    exact(device, 3, 1.0f, 1.0f, 1.0f, 0.0f, 96000.0f);
    const Stereo out = run(device, sine(at, 8.0f, 96000.0f, 0.5f));
    std::vector<float> level;
    for (size_t i = 0; i + 4096 <= out.size(); i += 480)
      level.push_back(static_cast<float>(tone_level(out.left, at, 96000.0, i, i + 4096)));
    EXPECT_NEAR(dominant_frequency(centred(level), 200.0, 1.2, 5.0), std::sqrt(6.2831853), 0.03,
                "at 96 kHz the middle band of three turns at Rate · √(2π)");
  }

  // ---- Added by the second check ------------------------------------------

  // Low Hold is where the lowest band is half way in, at the even width: the
  // band's lower half-power point, with the highest band's centre at the top.
  // (As first built the lowest centre stood a whole step above Low Hold, and
  // the notes of the octave above it hardly moved.)
  {
    for (int bands : {3, 5, 6}) {
      for (float low : {20.0f, 120.0f, 800.0f}) {
        const float ratio = Currents::step_ratio(low, bands, kTop);
        char label[128];
        std::snprintf(label, sizeof label, "%d bands, Low Hold %.0f: the lowest band's half-power point is Low Hold",
                      bands, low);
        EXPECT_NEAR(Currents::centre_hz(low, bands, 0, kTop) / std::sqrt(ratio), low, 1.0e-3f * low, label);
        std::snprintf(label, sizeof label, "%d bands, Low Hold %.0f: the highest band is centred at the top",
                      bands, low);
        EXPECT_NEAR(Currents::centre_hz(low, bands, bands - 1, kTop), kTop, 1.0e-3f * kTop, label);
      }
    }
    // Measured: a tone's level over 20 cycles of the lowest band, Depth 1, no Sway, every cycle alike.
    auto range = [&](float hz, float depth, double* low_db) {
      device.init(kRate);
      device.set_param(p::kRate, 1.0f);
      device.set_param(p::kDepth, depth);
      device.set_param(p::kSway, 0.0f);
      device.set_param(p::kChance, 0.0f);
      const Stereo out = run(device, sine(hz, 20.0f, kRate, 0.5f));
      const std::vector<float> level = level_of(out.left, hz);
      if (low_db) *low_db = db(lowest(level, 200) / 0.5);
      return db(highest(level, 200) / lowest(level, 200));
    };
    double at_hold = 0.0;
    range(120.0f, 1.0f, &at_hold);
    char label[160];
    std::snprintf(label, sizeof label,
                  "a tone at Low Hold falls to half its power when the lowest band is silent (%.2f dB)", at_hold);
    EXPECT(at_hold < -2.4 && at_hold > -3.8, label);
    const double octave_below = range(60.0f, 1.0f, nullptr);
    std::snprintf(label, sizeof label, "an octave under Low Hold a tone all but holds still (%.2f dB of swing)",
                  octave_below);
    EXPECT(octave_below < 1.5, label);
    const double third_above = range(160.0f, 0.6f, nullptr);
    const double well_above = range(1000.0f, 0.6f, nullptr);
    std::snprintf(label, sizeof label,
                  "as it starts, a note a fourth over Low Hold moves like any other (%.1f dB at 160 Hz, %.1f dB at 1 kHz)",
                  third_above, well_above);
    EXPECT(third_above > 5.0 && third_above > 0.6 * well_above, label);
    if (std::getenv("CURRENTS_VERBOSE"))
      std::printf("Low Hold: %.2f dB at it, %.2f dB of swing an octave under; %s\n", at_hold, octave_below, label);
  }

  // A dense sound is not lifted far over its input, however the bands fall
  // together: twenty tones a quarter of an octave apart, the level of the
  // whole in windows of 50 ms. First at full Depth with every cycle alike and
  // six bands at 2 to 12.6 Hz, 480 cycles of the lowest band (four minutes),
  // in which the bands crest together many times. (With a crest of 4.3 dB at
  // full Depth, as first built, the whole rose further.) Then as the device
  // starts, sped up to fit: 80 minutes of it at the Rate it starts at, in
  // which all five bands are once down together and once up together.
  {
    std::vector<float> at;
    for (int k = 0; k < 20; ++k) at.push_back(200.0f * std::pow(2.0f, static_cast<float>(k) / 4.0f));
    const float seconds = 240.0f;
    const std::vector<float> dense = tones(at, seconds, 0.04f);
    auto whole = [&](const Stereo& out, double* low, double* high) {
      const size_t window = 2400;
      *low = 1.0e9;
      *high = -1.0e9;
      for (size_t i = 48000; i + window <= dense.size(); i += window / 2) {
        const double l = rms(out.left, i, i + window), r = rms(out.right, i, i + window);
        const double level = db(std::sqrt(0.5 * (l * l + r * r)) / rms(dense, i, i + window));
        *low = std::min(*low, level);
        *high = std::max(*high, level);
      }
    };
    double low = 0.0, high = 0.0;
    device.init(kRate);
    device.set_param(p::kDepth, 1.0f);
    device.set_param(p::kSway, 0.0f);
    device.set_param(p::kRate, 2.0f);
    device.set_param(p::kTide, 1.0f);
    device.set_param(p::kBands, 6.0f);
    device.set_param(p::kChance, 0.0f);
    whole(run(device, dense), &low, &high);
    char label[160];
    std::snprintf(label, sizeof label,
                  "full Depth, six bands: a dense sound is never more than 3 dB over its input (%.2f to %.2f dB)",
                  low, high);
    EXPECT(high < 3.0, label);
    if (std::getenv("CURRENTS_VERBOSE")) std::printf("%s\n", label);
    device.init(kRate);
    device.set_param(p::kRate, 2.0f);
    whole(run(device, dense), &low, &high);
    std::snprintf(label, sizeof label,
                  "as it starts: a dense sound stays within 5.5 dB under and 3.2 dB over its input (%.2f to %.2f dB)",
                  low, high);
    EXPECT(low > -5.5 && high < 3.2, label);
    if (std::getenv("CURRENTS_VERBOSE")) std::printf("%s\n", label);
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  const std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("currents (as it starts)", 10.0f, kRate, [&] { run(device, input); });
  // The most it does: six bands, and Low Hold thrown about so every band is
  // retuned on every working.
  device.init(kRate);
  device.set_param(p::kBands, 6.0f);
  device.set_param(p::kDepth, 1.0f);
  device.set_param(p::kSway, 1.0f);
  device.set_param(p::kRate, 2.0f);
  device.set_param(p::kTide, 1.0f);
  device.set_param(p::kChance, 1.0f);
  report_cost("currents (six bands, Low Hold moving)", 10.0f, kRate, [&] {
    const std::vector<float> piece(input.begin(), input.begin() + 4800);
    for (int n = 0; n < 100; ++n) {
      device.set_param(p::kLowHold, n % 2 ? 40.0f : 700.0f);
      run(device, piece);
    }
  });

  return finish("currents");
}
