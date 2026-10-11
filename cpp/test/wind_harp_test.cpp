// Native harness for Wind Harp (cpp/devices/wind-harp). The conformance pass
// covers silence before and after notes, voice stealing under a pile of keys,
// parameter abuse and other sample rates. The rest measures what makes it a
// wind harp: strings nobody plucks, whose harmonics the wind lights one after
// another. Nobody has listened to it: every claim below is a number.

#include <functional>

#include "../devices/wind-harp/wind_harp.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::WindHarp;
namespace p = livemix::wind_harp;

static WindHarp device;
static WindHarp other;

static const float kRate = 48000.0f;
static const double kA3 = 220.0;

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }
static double cents(double hz, double wanted) { return 1200.0 * std::log2(hz / wanted); }
static double both_peak(const Stereo& x, size_t from = 0, size_t to = SIZE_MAX) {
  return std::max(peak(x.left, from, to), peak(x.right, from, to));
}

// One string a key in a steady wind and nothing else: no gusts, lulls, hum,
// air or pluck, and every harmonic allowed. The register trim is still
// there: the checks read levels against each other on the same key.
static void steady(WindHarp& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kGust, 0.0f);
  d.set_param(p::kLull, 0.0f);
  d.set_param(p::kStrings, 1.0f);
  d.set_param(p::kGlint, 1.0f);
  d.set_param(p::kHum, 0.0f);
  d.set_param(p::kAir, 0.0f);
  d.set_param(p::kTouch, 0.0f);
}

// The strongest line within `span` cents of `hz` (a Goertzel search that
// narrows four times).
static double partial_near(const std::vector<float>& x, double hz, double rate, size_t from, size_t to,
                           double span = 30.0) {
  double best_hz = hz, best = -1.0;
  for (int pass = 0; pass < 4; ++pass) {
    const double centre = best_hz;
    for (int i = -10; i <= 10; ++i) {
      const double candidate = centre * std::pow(2.0, span * i / 12000.0);
      const double level = tone_level(x, candidate, rate, from, to);
      if (level > best) {
        best = level;
        best_hz = candidate;
      }
    }
    span /= 8.0;
  }
  return best_hz;
}

// The harmonic of `hz` (1 to 16) with the most energy in [from, to).
static int strongest_harmonic(const std::vector<float>& x, double hz, double rate, size_t from, size_t to) {
  int best = 1;
  double most = -1.0;
  for (int n = 1; n <= 16; ++n) {
    if (hz * n > 0.45 * rate) break;
    const double level = tone_level(x, hz * n, rate, from, to);
    if (level > most) {
      most = level;
      best = n;
    }
  }
  return best;
}

// Level of both channels together, second by second, in dB.
static std::vector<double> by_second(const Stereo& x, double rate = kRate, double window = 1.0) {
  std::vector<double> out;
  const size_t n = at(window, rate);
  for (size_t from = 0; from + n <= x.size(); from += n) {
    const double l = rms(x.left, from, from + n), r = rms(x.right, from, from + n);
    out.push_back(db(std::sqrt(0.5 * (l * l + r * r))));
  }
  return out;
}

static double swing(const std::vector<double>& levels, size_t from = 0) {
  double lo = 1.0e9, hi = -1.0e9;
  for (size_t i = from; i < levels.size(); ++i) {
    lo = std::min(lo, levels[i]);
    hi = std::max(hi, levels[i]);
  }
  return hi - lo;
}

// How much of what an event changes is there at once: the same passage is
// rendered with and without the event, and the largest difference in the
// first 8 samples is held against the largest over the next 20 ms. A faded or
// followed change has hardly begun after 8 samples; a jump is all there. The
// worst of eight moments, so a jump cannot hide in a zero crossing.
static double suddenness(const std::function<void(WindHarp&)>& setup, const std::function<void(WindHarp&)>& event) {
  double worst = 0.0;
  for (int trial = 0; trial < 8; ++trial) {
    const float lead = 1.0f + 0.0137f * static_cast<float>(trial);
    setup(device);
    render(device, lead, kRate);
    event(device);
    Stereo with = render(device, 0.02f, kRate);
    setup(other);
    render(other, lead, kRate);
    Stereo without = render(other, 0.02f, kRate);
    double early = 0.0, whole = 0.0;
    for (size_t i = 0; i < with.size(); ++i) {
      const double d = std::max(std::fabs(static_cast<double>(with.left[i]) - without.left[i]),
                                std::fabs(static_cast<double>(with.right[i]) - without.right[i]));
      if (i < 8) early = std::max(early, d);
      whole = std::max(whole, d);
    }
    // (A change 80 dB down is no click whatever its shape.)
    if (whole > 1.0e-4) worst = std::max(worst, early / whole);
  }
  return worst;
}

// Events at sample positions, rendered in blocks of `block` frames. Events
// sit on multiples of 2048 so every block size can place them exactly.
struct Event {
  size_t when;
  std::function<void(WindHarp&)> what;
};

static Stereo play(WindHarp& d, const std::vector<Event>& events, size_t total, int block) {
  Stereo out;
  out.left.resize(total);
  out.right.resize(total);
  size_t done = 0, next = 0;
  while (done < total) {
    while (next < events.size() && events[next].when <= done) events[next++].what(d);
    size_t frames = std::min(static_cast<size_t>(block), total - done);
    if (next < events.size()) frames = std::min(frames, events[next].when - done);
    d.process(static_cast<int>(frames));
    for (size_t i = 0; i < frames; ++i) {
      out.left[done + i] = d.out_left()[i];
      out.right[done + i] = d.out_right()[i];
    }
    done += frames;
  }
  return out;
}

static double worst_difference(const Stereo& a, const Stereo& b) {
  double worst = 0.0;
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

// --- what the strings are -----------------------------------------------------------------

// The played pitch, at three sample rates and across the keyboard; and every
// harmonic the wind lights is a whole multiple of it.
static void test_tuning() {
  double worst = 0.0;
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    for (double hz : {27.5, 55.0, 130.81, 220.0, 440.0, 1046.5, 2093.0, 4186.0}) {
      // One string, the fundamental held by Hum: the pitch of the instrument.
      steady(device, rate);
      device.set_param(p::kWind, 0.0f);
      device.set_param(p::kHum, 1.0f);
      device.note_on(1, static_cast<float>(hz), 0.8f);
      Stereo out = render(device, 3.0f, rate);
      const double found = partial_near(out.left, hz, rate, at(1.0, rate), at(3.0, rate));
      worst = std::max(worst, std::fabs(cents(found, hz)));
    }
  }
  std::printf("tuning: worst %.3f cents over 8 notes at 44.1, 48 and 96 kHz (one string)\n", worst);
  EXPECT(worst < 1.0, "one string is within a cent of the played note at every rate");

  // The default course of two strings: the pair straddles the played note.
  double pair = 0.0;
  for (double hz : {55.0, 220.0, 880.0, 3520.0}) {
    device.init(kRate);
    device.set_param(p::kGust, 0.0f);
    device.set_param(p::kLull, 0.0f);
    device.set_param(p::kWind, 0.0f);
    device.set_param(p::kHum, 1.0f);
    device.set_param(p::kWidth, 0.0f);
    device.note_on(1, static_cast<float>(hz), 0.8f);
    Stereo out = render(device, 6.0f, kRate);
    pair = std::max(pair, std::fabs(cents(partial_near(out.left, hz, kRate, at(1.0), at(6.0)), hz)));
  }
  std::printf("tuning: a course of two reads within %.2f cents of the played note\n", pair);
  EXPECT(pair < 5.0, "the default course is within 5 cents of the played note");

  // Harmonics: light them a few at a time with the wind and read each.
  // (The wind sits higher on low keys and lower on high ones, so A1 is not
  // lit below its second harmonic and C6 not above its ninth: Hum is what
  // gives a low key its fundamental.)
  double off = 0.0;
  int read = 0, read_a3 = 0;
  for (double hz : {55.0, 220.0, 1046.5}) {
    bool seen[17] = {};
    for (float wind : {0.0f, 0.25f, 0.45f, 0.6f, 0.75f, 0.88f, 1.0f}) {
      steady(device);
      device.set_param(p::kWind, wind);
      device.note_on(1, static_cast<float>(hz), 0.8f);
      Stereo out = render(device, 4.0f, kRate);
      for (int n = 1; n <= 16 && hz * n < 0.42 * kRate; ++n) {
        if (tone_level(out.left, hz * n, kRate, at(2.0), at(4.0)) < 1.0e-3) continue;  // not lit
        off = std::max(off, std::fabs(cents(partial_near(out.left, hz * n, kRate, at(2.0), at(4.0)), hz * n)));
        if (!seen[n]) {
          ++read;
          if (hz == 220.0) ++read_a3;
        }
        seen[n] = true;
      }
    }
  }
  std::printf("harmonics: %d read on 3 keys (%d of 16 on A3), the worst %.3f cents from a whole multiple\n", read, read_a3,
              off);
  EXPECT(read_a3 == 16, "from Wind 0 to 1 the wind lights every one of A3's sixteen harmonics");
  EXPECT(read >= 36, "and 36 or more of the 48 on A1, A3 and C6");
  EXPECT(off < 3.0, "every harmonic is within 3 cents of a whole multiple of the key");
}

// The harmonic with the most energy climbs with Wind, and low keys sing
// higher harmonics than high keys in the same wind.
static void test_wind() {
  int strongest[3];
  const float winds[3] = {0.1f, 0.5f, 0.9f};
  for (int i = 0; i < 3; ++i) {
    steady(device);
    device.set_param(p::kWind, winds[i]);
    device.note_on(1, static_cast<float>(kA3), 0.8f);
    Stereo out = render(device, 4.0f, kRate);
    strongest[i] = strongest_harmonic(out.left, kA3, kRate, at(2.0), at(4.0));
  }
  std::printf("wind: the strongest harmonic of A3 is %d, %d and %d at Wind 0.1, 0.5 and 0.9\n", strongest[0],
              strongest[1], strongest[2]);
  EXPECT(strongest[0] == 1, "a light wind sings the fundamental");
  EXPECT(strongest[1] >= 3 && strongest[1] <= 5, "a middling wind sings the third to fifth harmonic");
  EXPECT(strongest[2] >= 8, "a strong wind sings the eighth harmonic or above");
  EXPECT(strongest[0] < strongest[1] && strongest[1] < strongest[2], "the strongest harmonic rises with Wind");

  // The wind holds its power as it moves from harmonic to harmonic: only the
  // tilt of the harmonics (3 dB an octave) is left in the level.
  double lo = 1.0e9, hi = -1.0e9;
  for (float wind = 0.3f; wind <= 0.5001f; wind += 0.02f) {
    steady(device);
    device.set_param(p::kWind, wind);
    device.note_on(1, static_cast<float>(kA3), 0.8f);
    Stereo out = render(device, 3.0f, kRate);
    const double level = db(rms(out.left, at(2.0), at(3.0)));
    lo = std::min(lo, level);
    hi = std::max(hi, level);
  }
  std::printf("wind: level over Wind 0.3 to 0.5 in steps of 0.02 stays within %.2f dB\n", hi - lo);
  EXPECT(hi - lo < 3.0, "no hole between two harmonics: the level moves by under 3 dB across them");

  int low_key = 0, high_key = 0;
  steady(device);
  device.set_param(p::kWind, 0.5f);
  device.note_on(1, 55.0f, 0.8f);
  Stereo low = render(device, 4.0f, kRate);
  low_key = strongest_harmonic(low.left, 55.0, kRate, at(2.0), at(4.0));
  steady(device);
  device.set_param(p::kWind, 0.5f);
  device.note_on(1, 880.0f, 0.8f);
  Stereo high = render(device, 4.0f, kRate);
  high_key = strongest_harmonic(high.left, 880.0, kRate, at(2.0), at(4.0));
  std::printf("wind: at Wind 0.5 A1 sings its harmonic %d and A5 its harmonic %d\n", low_key, high_key);
  EXPECT(low_key > strongest[1] && high_key < strongest[1], "low keys sing higher harmonics than high keys");
}

// Nothing above the band: a high key has fewer harmonics, not folded ones,
// and a key above the keyboard is brought down to it.
static void test_band() {
  double folded = 0.0;
  int lit = 0;
  for (float rate : {44100.0f, 48000.0f}) {
    for (double hz : {1760.0, 3520.0, 4186.0}) {
      steady(device, rate);
      device.set_param(p::kWind, 1.0f);
      device.set_param(p::kGust, 1.0f);
      device.set_param(p::kTouch, 1.0f);
      device.note_on(1, static_cast<float>(hz), 1.0f);
      Stereo out = render(device, 4.0f, rate);
      for (int n = 1; n <= 16; ++n) {
        double f = std::fmod(hz * n, static_cast<double>(rate));
        if (f > 0.5 * rate) f = rate - f;  // where it would land if it were made
        const double level = tone_level(out.left, f, rate, at(0.5, rate), at(4.0, rate));
        if (hz * n < 0.42 * rate) {
          if (level > 1.0e-4) ++lit;
        } else {
          // (skip a fold that lands within 30 Hz of a real harmonic)
          const double nearest = std::fabs(f / hz - std::round(f / hz)) * hz;
          if (nearest > 30.0 || f > 0.42 * rate) folded = std::max(folded, level);
        }
      }
    }
  }
  std::printf("band: %d harmonics lit on A6, A7 and C8 at 44.1 and 48 kHz; the strongest fold of one above the band %.1f dB\n",
              lit, db(folded));
  EXPECT(lit >= 12, "high keys keep the harmonics that fit under the band limit");
  EXPECT(folded < 1.0e-6, "and none above it is made or folds back");

  steady(device);
  device.set_param(p::kHum, 1.0f);
  device.note_on(1, 30000.0f, 0.8f);
  Stereo top = render(device, 1.0f, kRate);
  const double hz = dominant_frequency(top.left, kRate, 2000.0, 23000.0, at(0.5));
  EXPECT_NEAR(hz, 12000.0, 20.0, "a key above the keyboard is played at 12 kHz");
  steady(device);
  device.set_param(p::kHum, 1.0f);
  device.note_on(1, 1.0f, 0.8f);
  Stereo bottom = render(device, 3.0f, kRate);
  EXPECT_NEAR(partial_near(bottom.left, 8.0, kRate, at(1.0), at(3.0), 600.0), 8.0, 0.3, "and one below it at 8 Hz");
}

// Glint is a ceiling: in a full wind nothing above it lights.
static void test_glint() {
  steady(device);
  device.set_param(p::kWind, 1.0f);
  device.note_on(1, static_cast<float>(kA3), 0.8f);
  Stereo open = render(device, 4.0f, kRate);
  steady(device);
  device.set_param(p::kWind, 1.0f);
  device.set_param(p::kGlint, 0.5f);  // a ceiling at the fourth harmonic
  device.note_on(1, static_cast<float>(kA3), 0.8f);
  Stereo capped = render(device, 4.0f, kRate);
  const int top_open = strongest_harmonic(open.left, kA3, kRate, at(2.0), at(4.0));
  const int top_capped = strongest_harmonic(capped.left, kA3, kRate, at(2.0), at(4.0));
  double above = 0.0;
  for (int n = 6; n <= 16; ++n) above = std::max(above, tone_level(capped.left, kA3 * n, kRate, at(2.0), at(4.0)));
  std::printf("glint: in a full wind the strongest harmonic is %d open and %d at Glint 0.5; above the fifth %.1f dB\n",
              top_open, top_capped, db(above));
  EXPECT(top_open >= 10, "with Glint open a full wind sings the top harmonics");
  EXPECT(top_capped >= 3 && top_capped <= 5, "Glint 0.5 holds it at the fourth");
  EXPECT(above < 1.0e-6, "and nothing from the sixth harmonic up is lit");

  steady(device);
  device.set_param(p::kWind, 1.0f);
  device.set_param(p::kGlint, 0.0f);
  device.note_on(1, static_cast<float>(kA3), 0.8f);
  Stereo bare = render(device, 4.0f, kRate);
  double overtones = 0.0;
  for (int n = 2; n <= 16; ++n) overtones = std::max(overtones, tone_level(bare.left, kA3 * n, kRate, at(2.0), at(4.0)));
  EXPECT(tone_level(bare.left, kA3, kRate, at(2.0), at(4.0)) > 0.01 && overtones < 1.0e-6,
         "Glint 0 leaves the fundamental alone");
}

// --- the wind -----------------------------------------------------------------------------

// Gust 0 is a steady wind; Gust 1 comes and goes. Lull opens gaps.
static void test_gust_and_lull() {
  // The default sound but for the gusts and lulls; the first second (the
  // pluck and the wind finding the string) is left out.
  device.init(kRate);
  device.set_param(p::kGust, 0.0f);
  device.set_param(p::kLull, 0.0f);
  device.note_on(1, static_cast<float>(kA3), 0.8f);
  const double still = swing(by_second(render(device, 13.0f, kRate)), 1);
  device.init(kRate);
  device.set_param(p::kGust, 1.0f);
  device.set_param(p::kLull, 0.0f);
  device.note_on(1, static_cast<float>(kA3), 0.8f);
  const double gusty = swing(by_second(render(device, 13.0f, kRate)), 1);
  std::printf("gust: over 12 s the level moves by %.2f dB at Gust 0 and %.2f dB at Gust 1\n", still, gusty);
  EXPECT(still < 1.5, "Gust 0 holds the level within 1.5 dB over 12 s");
  EXPECT(gusty > 6.0, "Gust 1 swings the level by 6 dB or more over 12 s");

  // The harmonics move with the gusts: the strongest one is not always the same.
  steady(device);
  device.set_param(p::kGust, 1.0f);
  device.set_param(p::kWind, 0.5f);
  device.set_param(p::kRing, 1.0f);
  device.note_on(1, static_cast<float>(kA3), 0.8f);
  Stereo moving = render(device, 13.0f, kRate);
  int lowest = 99, highest = 0;
  for (int second = 1; second < 13; ++second) {
    const int n = strongest_harmonic(moving.left, kA3, kRate, at(second), at(second + 1));
    lowest = std::min(lowest, n);
    highest = std::max(highest, n);
  }
  std::printf("gust: at Gust 1 the strongest harmonic runs from %d to %d in 12 s\n", lowest, highest);
  EXPECT(highest >= 4 * lowest, "gusts move the lit harmonic over two octaves or more");

  // The weathers after the first swing too (each key into silence starts one).
  double least = 1.0e9;
  device.init(kRate);
  device.set_param(p::kGust, 1.0f);
  device.set_param(p::kLull, 0.0f);
  for (int weather = 0; weather < 6; ++weather) {
    device.note_on(1, static_cast<float>(kA3), 0.8f);
    least = std::min(least, swing(by_second(render(device, 13.0f, kRate)), 1));
    device.note_off(1);
    render(device, 6.0f, kRate);
  }
  std::printf("gust: the least swing of the first six weathers is %.2f dB\n", least);
  EXPECT(least > 6.0, "every one of the first six weathers swings by 6 dB or more at Gust 1");

  // Lulls: none at Lull 0, gaps at Lull 1.
  device.init(kRate);
  device.set_param(p::kGust, 0.0f);
  device.set_param(p::kLull, 0.0f);
  device.note_on(1, static_cast<float>(kA3), 0.8f);
  const double none = swing(by_second(render(device, 31.0f, kRate)), 1);
  device.init(kRate);
  device.set_param(p::kGust, 0.0f);
  device.set_param(p::kLull, 1.0f);
  device.note_on(1, static_cast<float>(kA3), 0.8f);
  std::vector<double> seconds = by_second(render(device, 31.0f, kRate));
  const double gaps = swing(seconds, 1);
  // Count the lulls: runs of seconds 8 dB or more under the loudest.
  double loudest = -1.0e9;
  for (size_t i = 1; i < seconds.size(); ++i) loudest = std::max(loudest, seconds[i]);
  int lulls = 0;
  bool in_gap = false;
  for (size_t i = 1; i < seconds.size(); ++i) {
    const bool low = seconds[i] < loudest - 8.0;
    if (low && !in_gap) ++lulls;
    in_gap = low;
  }
  std::printf("lull: quietest second %.1f dB under the loudest at Lull 1 (%d lulls in 30 s), %.2f dB at Lull 0\n",
              gaps, lulls, none);
  EXPECT(none < 1.5, "Lull 0 never drops");
  EXPECT(gaps > 12.0, "Lull 1 opens gaps: the quietest second is 12 dB or more under the loudest");
  EXPECT(lulls >= 3 && lulls <= 8, "three to eight lulls in half a minute at Lull 1");

  // Hum is there through a lull.
  device.init(kRate);
  device.set_param(p::kGust, 0.0f);
  device.set_param(p::kLull, 1.0f);
  device.set_param(p::kHum, 1.0f);
  device.set_param(p::kAir, 0.0f);
  device.set_param(p::kStrings, 1.0f);
  device.set_param(p::kWind, 0.6f);
  device.note_on(1, static_cast<float>(kA3), 0.8f);
  Stereo hummed = render(device, 31.0f, kRate);
  double lo = 1.0e9, hi = 0.0;
  for (int second = 1; second < 31; ++second) {
    const double level = tone_level(hummed.left, kA3, kRate, at(second), at(second + 1));
    lo = std::min(lo, level);
    hi = std::max(hi, level);
  }
  std::printf("lull: with Hum 1 the fundamental stays within %.2f dB through the lulls\n", db(hi / lo));
  EXPECT(db(hi / lo) < 1.0, "the hum does not drop with the wind");
}

// One wind for every key: two keys rendered apart swell at the same moments.
static void test_one_wind() {
  auto level_curve = [](float hz) {
    steady(device);
    device.set_param(p::kGust, 1.0f);
    device.set_param(p::kWind, 0.4f);
    device.note_on(1, hz, 0.8f);
    return by_second(render(device, 20.0f, kRate), kRate, 0.25);
  };
  const std::vector<double> a = level_curve(146.83f), b = level_curve(392.0f);
  double ma = 0.0, mb = 0.0;
  const size_t from = 4, n = a.size() - from;
  for (size_t i = from; i < a.size(); ++i) {
    ma += a[i] / n;
    mb += b[i] / n;
  }
  double sab = 0.0, saa = 0.0, sbb = 0.0;
  for (size_t i = from; i < a.size(); ++i) {
    sab += (a[i] - ma) * (b[i] - mb);
    saa += (a[i] - ma) * (a[i] - ma);
    sbb += (b[i] - mb) * (b[i] - mb);
  }
  const double together = sab / std::sqrt(saa * sbb);
  std::printf("one wind: the level curves of D3 and G4 correlate %.2f over 19 s\n", together);
  EXPECT(together > 0.7, "two keys swell together");

  // But the strings of a course do not hear it alike: at Gust 1 the two
  // strings of a key (one on each side at full Width) part in level.
  device.init(kRate);
  device.set_param(p::kGust, 1.0f);
  device.set_param(p::kLull, 0.0f);
  device.set_param(p::kAir, 0.0f);
  device.set_param(p::kHum, 0.0f);
  device.set_param(p::kTouch, 0.0f);
  device.set_param(p::kRing, 1.0f);
  device.set_param(p::kWind, 0.5f);
  device.set_param(p::kWidth, 1.0f);
  device.note_on(1, static_cast<float>(kA3), 0.8f);
  Stereo course = render(device, 20.0f, kRate);
  // The same harmonic, second by second, on the side of one string and of
  // the other (each side has 0.95 of its own string and 0.31 of the other).
  double apart = 0.0;
  for (int second = 1; second < 20; ++second) {
    for (int n = 1; n <= 8; ++n) {
      const double l = tone_level(course.left, kA3 * n, kRate, at(second), at(second + 1));
      const double r = tone_level(course.right, kA3 * n, kRate, at(second), at(second + 1));
      if (l > 1.0e-3 && r > 1.0e-3) apart = std::max(apart, std::fabs(db(l / r)));
    }
  }
  std::printf("one wind: a harmonic is up to %.1f dB louder on one string of a course than on the other\n", apart);
  EXPECT(apart > 4.0, "each string of a course hears the wind a little differently");

  // A new weather for each phrase, the same weathers after each init().
  device.init(kRate);
  device.set_param(p::kGust, 1.0f);
  device.note_on(1, static_cast<float>(kA3), 0.8f);
  Stereo first = render(device, 6.0f, kRate);
  device.note_off(1);
  render(device, 8.0f, kRate);
  device.note_on(1, static_cast<float>(kA3), 0.8f);
  Stereo second = render(device, 6.0f, kRate);
  const std::vector<double> c = by_second(first), d = by_second(second);
  double differ = 0.0;
  for (size_t i = 1; i < c.size(); ++i) differ = std::max(differ, std::fabs(c[i] - d[i]));
  std::printf("one wind: the second phrase is up to %.1f dB from the first in a second\n", differ);
  EXPECT(differ > 2.0, "a phrase played again after a silence gets other weather");

  // A key that goes down while another sounds joins the wind that is
  // blowing: it neither starts the weather again nor moves it. The held key
  // (A3, one string) is the same with and without the second (E♭4, whose
  // harmonics lie elsewhere), and the second swells and fades at the moments
  // the first does, not as the first did from its own start.
  auto pair = [](bool second, bool first = true) {
    steady(device);
    device.set_param(p::kGust, 1.0f);
    device.set_param(p::kWind, 0.4f);
    device.set_param(p::kRing, 1.0f);
    device.set_param(p::kVolume, -20.0f);  // under the knee: the two keys add exactly
    if (first) device.note_on(1, static_cast<float>(kA3), 0.8f);
    Stereo out = render(device, 5.0f, kRate);
    if (second) device.note_on(2, 311.13f, 0.8f);
    return concat(out, render(device, 15.0f, kRate));
  };
  const Stereo alone = pair(false), joined = pair(true);
  double moved = 0.0, own = 0.0;
  for (int n = 1; n <= 8; ++n) {
    for (int second = 5; second < 20; ++second) {
      const double a = tone_level(alone.left, kA3 * n, kRate, at(second), at(second + 1));
      const double b = tone_level(joined.left, kA3 * n, kRate, at(second), at(second + 1));
      own = std::max(own, a);
      moved = std::max(moved, std::fabs(a - b));
    }
  }
  std::printf("one wind: a second key going down moves the held key's harmonics by %.1f dB under the held key's loudest\n",
              -db(moved / own));
  EXPECT(moved < 1.0e-3 * own, "a key going down while another sounds does not restart or move the wind");
  // The second key alone is the difference of the two renders.
  Stereo second_key = joined;
  for (size_t i = 0; i < second_key.size(); ++i) second_key.left[i] -= alone.left[i];
  std::vector<double> first_curve, second_curve;
  for (double t = 0.0; t + 0.25 <= 20.0; t += 0.25) {
    first_curve.push_back(db(rms(alone.left, at(t), at(t + 0.25))));
    second_curve.push_back(db(rms(second_key.left, at(t), at(t + 0.25))));
  }
  // From 1 s after the second key went down, for 13 s: against the first
  // key at the same moments, and against the first key from its own start.
  auto likeness = [&](size_t first_from) {
    const size_t n = 52, second_from = 24;
    double ma = 0.0, mb = 0.0;
    for (size_t i = 0; i < n; ++i) {
      ma += first_curve[first_from + i] / n;
      mb += second_curve[second_from + i] / n;
    }
    double sab = 0.0, saa = 0.0, sbb = 0.0;
    for (size_t i = 0; i < n; ++i) {
      const double da = first_curve[first_from + i] - ma, d2 = second_curve[second_from + i] - mb;
      sab += da * d2;
      saa += da * da;
      sbb += d2 * d2;
    }
    return sab / std::sqrt(saa * sbb);
  };
  const double same_moment = likeness(24), own_start = likeness(4);
  std::printf("one wind: a key that joins 5 s later follows the first key at the same moments %.2f, and the first key's "
              "own beginning %.2f\n",
              same_moment, own_start);
  EXPECT(same_moment > 0.85, "two keys played apart in time swell at the same moments");
  EXPECT(own_start < 0.5, "a later key does not get the first key's gusts over again from its own start");

  // Every weather begins as a steady wind: the first 150 ms of six phrases
  // at Gust 1 are as loud as each other and as a phrase at Gust 0, whatever
  // the gusts do afterwards.
  auto beginning = [](float gust, int phrases, double* lowest, double* highest) {
    steady(device);
    device.set_param(p::kGust, gust);
    device.set_param(p::kRing, 0.3f);
    device.set_param(p::kRelease, 0.05f);
    *lowest = 1.0e9;
    *highest = -1.0e9;
    for (int phrase = 0; phrase < phrases; ++phrase) {
      device.note_on(1, static_cast<float>(kA3), 0.8f);
      Stereo out = render(device, 3.0f, kRate);
      const double level = db(rms(out.left, at(0.1), at(0.2)));
      *lowest = std::min(*lowest, level);
      *highest = std::max(*highest, level);
      device.note_off(1);
      render(device, 0.5f, kRate);
    }
  };
  double calm_lo, calm_hi, gusty_lo, gusty_hi;
  beginning(0.0f, 1, &calm_lo, &calm_hi);
  beginning(1.0f, 6, &gusty_lo, &gusty_hi);
  std::printf("one wind: 100 to 200 ms into six phrases at Gust 1 the level is %.1f to %.1f dB from a steady wind's\n",
              gusty_lo - calm_lo, gusty_hi - calm_lo);
  EXPECT(gusty_lo > calm_lo - 3.0 && gusty_hi < calm_lo + 3.0, "every phrase begins at the steady wind's level");
}

// What makes it a wind harp and not a stop being drawn, at the defaults: one
// key held for 40 s. The lit harmonic wanders, harmonics overlap and cross
// over, the strings of the course sing different harmonics, the level
// breathes, and it is never a fixed tone for long.
static void test_idea() {
  const double win = 0.5;
  const int windows = 80;
  auto held = [&](float hz, bool wide) {
    device.init(kRate);
    device.set_param(p::kAir, 0.0f);  // the strings alone
    if (wide) device.set_param(p::kWidth, 1.0f);  // a string to each side, 10 dB apart
    device.note_on(1, hz, 0.8f);
    return render(device, 2.0f + static_cast<float>(windows * win), kRate);
  };
  auto level_of = [&](const Stereo& x, double hz, int w) {
    const size_t from = at(2.0 + w * win), to = at(2.0 + (w + 1) * win);
    const double l = tone_level(x.left, hz, kRate, from, to), r = tone_level(x.right, hz, kRate, from, to);
    return std::sqrt(0.5 * (l * l + r * r));
  };
  double least_octaves = 1.0e9, longest_still = 0.0;
  int least_places = 99;
  for (float hz : {146.83f, 220.0f, 349.23f}) {
    const Stereo out = held(hz, false);
    std::vector<std::vector<double>> h(windows, std::vector<double>(17, 0.0));
    bool seen[17] = {};
    int places = 0;
    double lo = 1.0e9, hi = 0.0;
    for (int w = 0; w < windows; ++w) {
      int best = 1;
      double power = 0.0, moment = 0.0;
      for (int n = 1; n <= 16; ++n) {
        h[w][n] = level_of(out, hz * n, w);
        power += h[w][n] * h[w][n];
        moment += h[w][n] * h[w][n] * std::log2(static_cast<double>(n));
        if (h[w][n] > h[w][best]) best = n;
      }
      if (!seen[best]) seen[best] = true, ++places;
      lo = std::min(lo, moment / power);
      hi = std::max(hi, moment / power);
    }
    least_places = std::min(least_places, places);
    least_octaves = std::min(least_octaves, hi - lo);
    // The longest stretch over which no harmonic within 20 dB of the
    // loudest has moved by 1.5 dB from where the stretch began.
    for (int a = 0; a < windows; ++a) {
      double most = 0.0;
      for (int n = 1; n <= 16; ++n) most = std::max(most, h[a][n]);
      int b = a + 1;
      for (; b < windows; ++b) {
        bool moved = false;
        for (int n = 1; n <= 16; ++n) {
          if (h[a][n] < 0.1 * most && h[b][n] < 0.1 * most) continue;
          if (std::fabs(db(h[b][n] / std::max(h[a][n], 1.0e-9))) > 1.5) moved = true;
        }
        if (moved) break;
      }
      longest_still = std::max(longest_still, (b - a) * win);
    }
  }
  std::printf("idea: at the defaults the strongest harmonic takes %d places or more in 40 s on D3, A3 and F4, the centre of the "
              "spectrum moves %.2f octaves or more, the longest still stretch is %.1f s\n",
              least_places, least_octaves, longest_still);
  EXPECT(least_places >= 3, "a held key at the defaults sings three or more harmonics in turn");
  EXPECT(least_octaves > 1.2, "and the centre of its spectrum moves by more than 1.2 octaves");
  EXPECT(longest_still <= 2.5, "it is never a fixed tone for more than 2.5 s");

  // The two strings of the course: the strongest harmonic on the left is
  // not the one on the right, most of the time; and the level breathes.
  const Stereo wide = held(220.0f, true);
  int apart = 0;
  double overlap = 0.0;
  std::vector<double> levels;
  for (int w = 0; w < windows; ++w) {
    const size_t from = at(2.0 + w * win), to = at(2.0 + (w + 1) * win);
    int left = 1, right = 1, near = 0;
    double most_left = 0.0, most_right = 0.0, most = 0.0;
    double both[17];
    for (int n = 1; n <= 16; ++n) {
      const double l = tone_level(wide.left, kA3 * n, kRate, from, to), r = tone_level(wide.right, kA3 * n, kRate, from, to);
      if (l > most_left) most_left = l, left = n;
      if (r > most_right) most_right = r, right = n;
      both[n] = std::sqrt(0.5 * (l * l + r * r));
      most = std::max(most, both[n]);
    }
    for (int n = 1; n <= 16; ++n) near += both[n] > 0.25 * most ? 1 : 0;
    overlap += static_cast<double>(near) / windows;
    if (left != right) ++apart;
    const double l = rms(wide.left, from, to), r = rms(wide.right, from, to);
    levels.push_back(db(std::sqrt(0.5 * (l * l + r * r))));
  }
  std::sort(levels.begin(), levels.end());
  const double breath = levels[levels.size() * 19 / 20] - levels[levels.size() / 20];
  std::printf("idea: the two strings of A3 have a different strongest harmonic in %d of %d half seconds; %.1f harmonics are "
              "within 12 dB of the loudest at once; the level breathes by %.1f dB\n",
              apart, windows, overlap, breath);
  EXPECT(apart >= windows / 2, "the two strings of a key sing different harmonics more than half the time");
  EXPECT(overlap >= 2.5, "harmonics overlap: two or three sound at once");
  EXPECT(breath > 3.0 && breath < 12.0, "the level breathes with the gusts, by 3 to 12 dB");

  // Harmonics cross-fade, they do not switch: on one string in a full gust,
  // no harmonic moves by more than a third of the loudest in 50 ms.
  steady(device);
  device.set_param(p::kGust, 1.0f);
  device.set_param(p::kWind, 0.5f);
  device.note_on(1, static_cast<float>(kA3), 0.8f);
  const Stereo gusty = render(device, 20.0f, kRate);
  double fastest = 0.0;
  for (int n = 1; n <= 12; ++n) {
    double before = -1.0;
    for (size_t from = at(1.0); from + at(0.05) <= gusty.size(); from += at(0.05)) {
      const double now = tone_level(gusty.left, kA3 * n, kRate, from, from + at(0.05));
      if (before >= 0.0) fastest = std::max(fastest, std::fabs(now - before));
      before = now;
    }
  }
  double loudest = 0.0;
  for (int n = 1; n <= 12; ++n) loudest = std::max(loudest, tone_level(gusty.left, kA3 * n, kRate, at(1.0)));
  std::printf("idea: at Gust 1 the fastest any harmonic moves in 50 ms is %.2f of the loudest harmonic's mean level\n",
              fastest / loudest);
  EXPECT(fastest < 0.6 * loudest, "harmonics cross-fade and do not switch");
}

// --- what the knobs do to a string --------------------------------------------------------

// Ring: how long a harmonic sings on once the wind has left it.
static void test_ring() {
  double measured[2];
  const float rings[2] = {1.0f, 6.0f};
  for (int i = 0; i < 2; ++i) {
    steady(device);
    device.set_param(p::kRing, rings[i]);
    device.set_param(p::kWind, 0.7f);  // lights the fifth to seventh harmonic
    device.note_on(1, static_cast<float>(kA3), 0.8f);
    render(device, 6.0f, kRate);
    device.set_param(p::kWind, 0.0f);  // the wind leaves them
    Stereo out = render(device, rings[i] + 1.0f, kRate);
    // The sixth harmonic, in windows of 50 ms: time to fall 40 dB, as 60.
    const double start = tone_level(out.left, kA3 * 6.0, kRate, 0, at(0.05));
    double fell = 0.0;
    for (size_t from = 0; from + at(0.05) <= out.size(); from += at(0.01)) {
      if (tone_level(out.left, kA3 * 6.0, kRate, from, from + at(0.05)) < 0.01 * start) {
        fell = static_cast<double>(from) / kRate;
        break;
      }
    }
    measured[i] = fell * 1.5;
  }
  // Harmonic n rings 1 / (1 + 0.08 (n - 1)) as long as Ring says.
  std::printf("ring: the sixth harmonic falls 60 dB in %.2f s at Ring 1 s and %.2f s at Ring 6 s (%.2f and %.2f s wanted)\n",
              measured[0], measured[1], 1.0 / 1.4, 6.0 / 1.4);
  EXPECT_NEAR(measured[0], 1.0 / 1.4, 0.08, "Ring 1 s: the sixth harmonic is gone in 0.71 s");
  EXPECT_NEAR(measured[1], 6.0 / 1.4, 0.4, "Ring 6 s: the sixth harmonic is gone in 4.3 s");

  // And how slowly it wakes: a longer Ring is a slower start.
  double woke[2];
  for (int i = 0; i < 2; ++i) {
    steady(device);
    device.set_param(p::kRing, i == 0 ? 0.5f : 12.0f);
    device.set_param(p::kWind, 0.3f);
    device.note_on(1, static_cast<float>(kA3), 0.8f);
    Stereo out = render(device, 6.0f, kRate);
    const double full = rms(out.left, at(5.0), at(6.0));
    woke[i] = 0.0;
    for (size_t from = 0; from + at(0.02) <= out.size(); from += at(0.005)) {
      if (rms(out.left, from, from + at(0.02)) > 0.5 * full) {
        woke[i] = static_cast<double>(from) / kRate;
        break;
      }
    }
  }
  std::printf("ring: with no pluck the string reaches half level after %.3f s at Ring 0.5 s and %.3f s at Ring 12 s\n",
              woke[0], woke[1]);
  EXPECT(woke[1] > 3.0 * woke[0] && woke[1] > 0.2, "a long Ring wakes slowly");
}

// Touch: a pluck that sounds at once; without it the wind finds the string.
static void test_touch() {
  auto start = [](float touch, float hz, double* early, double* later) {
    device.init(kRate);
    device.set_param(p::kGust, 0.0f);
    device.set_param(p::kLull, 0.0f);
    device.set_param(p::kAir, 0.0f);
    device.set_param(p::kHum, 0.0f);
    device.set_param(p::kTouch, touch);
    device.note_on(1, hz, 0.8f);
    Stereo out = render(device, 3.0f, kRate);
    *early = both_peak(out, 0, at(0.03));
    *later = both_peak(out, at(2.0), at(3.0));
  };
  double early, later;
  start(1.0f, 220.0f, &early, &later);
  std::printf("touch: Touch 1 peaks at %.1f dBFS in the first 30 ms (%.1f dBFS after 2 s)\n", db(early), db(later));
  EXPECT(db(early) > -30.0, "a plucked key is heard within 30 ms");
  const double plucked = early;
  start(0.0f, 220.0f, &early, &later);
  std::printf("touch: Touch 0 peaks at %.1f dBFS in the first 30 ms, %.1f dB under the level after 2 s\n", db(early),
              db(later / early));
  EXPECT(db(later / early) > 12.0, "with Touch 0 the first 30 ms are 12 dB or more under the settled level");
  EXPECT(plucked > 8.0 * early, "the pluck is 18 dB or more over the bare start");

  // The default touch at both ends of the keyboard, and a note of 100 ms.
  for (float hz : {28.0f, 220.0f, 4186.0f}) {
    device.init(kRate);
    device.note_on(1, hz, 0.8f);
    Stereo out = render(device, 0.1f, kRate);
    device.note_off(1);
    Stereo tail = render(device, 0.5f, kRate);
    const double within = both_peak(out, 0, at(0.03));
    char label[120];
    std::snprintf(label, sizeof label, "%.0f Hz at the default Touch is heard within 30 ms (%.1f dBFS)", hz, db(within));
    EXPECT(db(within) > -45.0, label);
    EXPECT(db(std::max(both_peak(out), both_peak(tail))) > -40.0, "a 100 ms note makes sound");
  }

  // The pluck is a pluck: it has the fundamental most and falls away upwards.
  steady(device);
  device.set_param(p::kWind, 1.0f);
  device.set_param(p::kGlint, 0.0f);  // the wind may only hold the fundamental
  device.set_param(p::kTouch, 1.0f);
  device.set_param(p::kRing, 6.0f);
  device.note_on(1, 110.0f, 0.8f);
  Stereo pluck = render(device, 0.5f, kRate);
  const double h2 = tone_level(pluck.left, 220.0, kRate, at(0.05), at(0.25));
  const double h4 = tone_level(pluck.left, 440.0, kRate, at(0.05), at(0.25));
  const double h8 = tone_level(pluck.left, 880.0, kRate, at(0.05), at(0.25));
  std::printf("touch: the pluck's harmonics 2, 4 and 8 are at %.1f, %.1f and %.1f dB\n", db(h2), db(h4), db(h8));
  EXPECT(h2 > 1.0e-3 && h2 > 2.0 * h4 && h4 > 2.0 * h8, "the pluck falls by about 9 dB an octave");
}

// Hum: the string's own note under whatever the wind sings.
static void test_hum() {
  double level[3];
  const float hums[3] = {0.0f, 0.5f, 1.0f};
  for (int i = 0; i < 3; ++i) {
    steady(device);
    device.set_param(p::kWind, 0.7f);  // the wind is far above the fundamental
    device.set_param(p::kHum, hums[i]);
    device.note_on(1, static_cast<float>(kA3), 0.8f);
    Stereo out = render(device, 3.0f, kRate);
    level[i] = tone_level(out.left, kA3, kRate, at(2.0), at(3.0));
  }
  std::printf("hum: the fundamental under a strong wind is at %.1f, %.1f and %.1f dB for Hum 0, 0.5 and 1\n", db(level[0]),
              db(level[1]), db(level[2]));
  EXPECT(level[0] < 1.0e-6, "without Hum a strong wind leaves the fundamental dark");
  EXPECT(level[1] > 0.003 && level[2] > 1.8 * level[1], "Hum raises the fundamental, twice the knob is twice the level");
}

// Strings: a course of four beats and is wide; one string does neither.
static void test_strings() {
  auto course = [](float strings, double* beat, double* side) {
    steady(device);
    device.set_param(p::kWind, 0.0f);
    device.set_param(p::kHum, 1.0f);
    device.set_param(p::kStrings, strings);
    device.set_param(p::kWidth, 1.0f);
    device.note_on(1, 440.0f, 0.8f);
    Stereo out = render(device, 9.0f, kRate);
    double lo = 1.0e9, hi = 0.0;
    for (size_t from = at(3.0); from + at(0.1) <= out.size(); from += at(0.05)) {
      const double level = tone_level(out.left, 440.0, kRate, from, from + at(0.1));
      lo = std::min(lo, level);
      hi = std::max(hi, level);
    }
    *beat = db(hi / lo);
    *side = correlation(out.left, out.right, at(3.0));
  };
  double beat1, side1, beat4, side4;
  course(1.0f, &beat1, &side1);
  course(4.0f, &beat4, &side4);
  std::printf("strings: one string moves by %.3f dB and correlates %.4f; four beat by %.1f dB and correlate %.2f\n", beat1,
              side1, beat4, side4);
  EXPECT(beat1 < 0.05 && side1 > 0.9999, "one string neither beats nor widens");
  EXPECT(beat4 > 3.0, "four strings beat against each other");
  EXPECT(side4 < 0.9, "and sit apart in the stereo field");

  // The course keeps its level whatever its size (1/sqrt(n) a string).
  double level[4];
  for (int n = 1; n <= 4; ++n) {
    steady(device);
    device.set_param(p::kWind, 0.5f);
    device.set_param(p::kStrings, static_cast<float>(n));
    device.note_on(1, static_cast<float>(kA3), 0.8f);
    Stereo out = render(device, 12.0f, kRate);
    const double l = rms(out.left, at(2.0)), r = rms(out.right, at(2.0));
    level[n - 1] = db(std::sqrt(l * l + r * r));
  }
  std::printf("strings: the course is at %.1f, %.1f, %.1f and %.1f dB for 1 to 4 strings\n", level[0], level[1], level[2],
              level[3]);
  for (int n = 1; n < 4; ++n) EXPECT_NEAR(level[n], level[0], 1.5, "a larger course is as loud as one string");

  // Width 0 is mono with any course and with the air.
  device.init(kRate);
  device.set_param(p::kStrings, 4.0f);
  device.set_param(p::kAir, 1.0f);
  device.set_param(p::kWidth, 0.0f);
  device.note_on(1, static_cast<float>(kA3), 0.8f);
  Stereo mono = render(device, 2.0f, kRate);
  EXPECT(worst_difference(mono, Stereo{mono.right, mono.left}) < 1.0e-6, "Width 0 is mono");
}

// Air: the wind itself, following the gusts, as loud at any sample rate.
static void test_air() {
  // The strings are the same with and without Air, so the difference of the
  // two renders is the air alone.
  auto air_alone = [](float rate, float gust, float wind) {
    Stereo with, without;
    for (int pass = 0; pass < 2; ++pass) {
      device.init(rate);
      device.set_param(p::kGust, gust);
      device.set_param(p::kLull, 0.0f);
      device.set_param(p::kWind, wind);
      device.set_param(p::kAir, pass == 0 ? 1.0f : 0.0f);
      device.note_on(1, static_cast<float>(kA3), 0.8f);
      (pass == 0 ? with : without) = render(device, 13.0f, rate);
    }
    for (size_t i = 0; i < with.size(); ++i) {
      with.left[i] -= without.left[i];
      with.right[i] -= without.right[i];
    }
    return with;
  };
  Stereo air48 = air_alone(48000.0f, 0.0f, 0.35f);
  Stereo air96 = air_alone(96000.0f, 0.0f, 0.35f);
  Stereo air44 = air_alone(44100.0f, 0.0f, 0.35f);
  const double l48 = db(rms(air48.left, at(1.0))), l96 = db(rms(air96.left, at(1.0, 96000.0))),
               l44 = db(rms(air44.left, at(1.0, 44100.0)));
  std::printf("air: %.1f dBFS at 48 kHz, %.1f at 96 kHz, %.1f at 44.1 kHz; left and right correlate %.2f\n", l48, l96, l44,
              correlation(air48.left, air48.right, at(1.0)));
  EXPECT(l48 > -50.0, "Air 1 is heard");
  EXPECT_NEAR(l96, l48, 1.0, "the air is as loud at 96 kHz as at 48 kHz");
  EXPECT_NEAR(l44, l48, 1.0, "and at 44.1 kHz");
  // Width folds two noises together at constant power: 1 - Width² of them is shared.
  EXPECT_NEAR(correlation(air48.left, air48.right, at(1.0)), 1.0 - 0.7 * 0.7, 0.1, "the air is as wide as Width says");
  EXPECT(std::fabs(mean(air48.left)) < 1.0e-4, "and carries no DC");

  // It brightens with the wind and follows the gusts.
  Stereo light = air_alone(48000.0f, 0.0f, 0.1f), strong = air_alone(48000.0f, 0.0f, 0.9f);
  const double dull = energy_above(light.left, 1500.0, kRate, at(1.0)), bright = energy_above(strong.left, 1500.0, kRate, at(1.0));
  std::printf("air: share of energy above 1.5 kHz %.2f in a light wind, %.2f in a strong one\n", dull, bright);
  EXPECT(bright > 2.0 * dull, "a strong wind is a brighter air");
  Stereo gusty = air_alone(48000.0f, 1.0f, 0.35f);
  const double steady_air = swing(by_second(air48), 1), moving_air = swing(by_second(gusty), 1);
  std::printf("air: its level moves by %.2f dB in a steady wind and %.1f dB at Gust 1\n", steady_air, moving_air);
  EXPECT(steady_air < 2.0 && moving_air > 6.0, "the air follows the gusts");

  // The air sits around the loudest key. When that key's voice is taken for
  // a soft one the air comes down to the new key over a few milliseconds and
  // not in one sample: the air with the steal over the air without it.
  auto air_around = [](bool steal) {
    Stereo with, without;
    for (int pass = 0; pass < 2; ++pass) {
      device.init(kRate);
      device.set_param(p::kGust, 0.0f);
      device.set_param(p::kLull, 0.0f);
      device.set_param(p::kVolume, -20.0f);  // under the soft clip's knee, so the renders subtract exactly
      device.set_param(p::kAir, pass == 0 ? 1.0f : 0.0f);
      device.note_on(0, 110.0f, 1.0f);  // the oldest key and the loudest
      for (int n = 1; n < 12; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n / 12.0f), 0.0f);
      render(device, 1.0f, kRate);
      if (steal) device.note_on(20, 440.0f, 0.0f);
      (pass == 0 ? with : without) = render(device, 0.1f, kRate);
    }
    for (size_t i = 0; i < with.size(); ++i) with.left[i] -= without.left[i];
    return with.left;
  };
  const std::vector<float> taken = air_around(true), kept = air_around(false);
  const double enough = 0.25 * rms(kept);
  std::vector<double> share(kept.size(), 1.0);
  for (size_t i = 1; i < kept.size(); ++i) {
    share[i] = std::fabs(kept[i]) > enough ? static_cast<double>(taken[i]) / kept[i] : share[i - 1];
  }
  double fall = 0.0;
  for (size_t i = 0; i + 8 < share.size(); ++i) fall = std::max(fall, share[i] - share[i + 8]);
  const double settled = share[at(0.08)];
  std::printf("air: when the loudest key is taken for a soft one it falls to %.2f of itself, %.3f of that fall in the worst 8 samples\n",
              settled, fall / (1.0 - settled));
  EXPECT_NEAR(settled, 0.2, 0.02, "the air follows the loudest key that is down");
  EXPECT(fall < 0.15 * (1.0 - settled), "and moves to it gradually when a voice is taken");
}

// --- playing it ---------------------------------------------------------------------------

static void test_levels() {
  // Velocity.
  device.init(kRate);
  device.note_on(1, static_cast<float>(kA3), 1.0f);
  Stereo loud = render(device, 4.0f, kRate);
  device.init(kRate);
  device.note_on(1, static_cast<float>(kA3), 0.2f);
  Stereo soft = render(device, 4.0f, kRate);
  const double by_velocity = db(rms(loud.left) / rms(soft.left));
  std::printf("velocity: gain 1.0 is %.1f dB over gain 0.2\n", by_velocity);
  EXPECT(by_velocity > 6.0 && by_velocity < 14.0, "a hard key is 6 to 14 dB louder than a soft one");
  const double touch_loud = both_peak(loud, 0, at(0.03)), touch_soft = both_peak(soft, 0, at(0.03));
  EXPECT(db(touch_loud / touch_soft) > by_velocity + 2.0, "and its pluck grows more than its level");

  // One key at gain 0.7 at the default volume, across the keyboard.
  double lowest = 0.0, highest = -200.0;
  for (float hz : {28.0f, 55.0f, 110.0f, 220.0f, 440.0f, 880.0f, 1760.0f, 4186.0f}) {
    device.init(kRate);
    device.note_on(1, hz, 0.7f);
    Stereo out = render(device, 12.0f, kRate);
    const double level = db(both_peak(out));
    lowest = std::min(lowest, level);
    highest = std::max(highest, level);
    EXPECT(finite(out.left) && rms(out.left, at(1.0)) > 1.0e-3, "every key from 28 Hz to 4.2 kHz sounds");
  }
  std::printf("level: one key at gain 0.7 peaks between %.1f and %.1f dBFS from 28 Hz to 4186 Hz\n", lowest, highest);
  EXPECT(lowest > -24.0 && highest < -10.0, "one key peaks between -24 and -10 dBFS at the default volume");

  // Ten held keys through three weathers stay under the knee of the clip.
  double most = 0.0;
  device.init(kRate);
  for (int weather = 0; weather < 3; ++weather) {
    for (int n = 0; n < 10; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
    most = std::max(most, both_peak(render(device, 20.0f, kRate)));
    for (int n = 0; n < 10; ++n) device.note_off(n);
    render(device, 6.0f, kRate);
  }
  std::printf("level: ten held keys peak at %.3f over three weathers of 20 s\n", most);
  EXPECT(most < 0.5, "ten held keys stay under the clip knee");

  // The clip is there: everything loud at once lands on, not over, full scale.
  device.init(kRate);
  device.set_param(p::kVolume, 6.0f);
  device.set_param(p::kHum, 1.0f);
  device.set_param(p::kTouch, 1.0f);
  device.set_param(p::kAir, 1.0f);
  for (int n = 0; n < 12; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 1.0f);
  Stereo hot = render(device, 4.0f, kRate);
  std::printf("level: twelve keys at full volume peak at %.3f\n", both_peak(hot));
  EXPECT(both_peak(hot) > 0.7 && both_peak(hot) <= 1.0, "the output ends in the soft clip");
}

// Nothing a player does arrives as a step.
static void test_clicks() {
  auto chord = [](WindHarp& d) {
    d.init(kRate);
    d.set_param(p::kWind, 0.3f);
    d.set_param(p::kGust, 0.3f);
    d.set_param(p::kStrings, 4.0f);
    d.set_param(p::kAir, 0.3f);
    d.note_on(1, 110.0f, 0.8f);
    d.note_on(2, 164.81f, 0.8f);
    d.note_on(3, 220.0f, 0.8f);
  };
  struct Move {
    const char* name;
    int id;
    float to;
  };
  // Each knob thrown from where the chord has it to an end of its range.
  const Move moves[] = {
      {"Wind to 1", p::kWind, 1.0f},     {"Wind to 0", p::kWind, 0.0f},       {"Gust to 1", p::kGust, 1.0f},
      {"Lull to 1", p::kLull, 1.0f},     {"Strings to 1", p::kStrings, 1.0f}, {"Glint to 0", p::kGlint, 0.0f},
      {"Ring to 0.3", p::kRing, 0.3f},   {"Hum to 1", p::kHum, 1.0f},         {"Air to 1", p::kAir, 1.0f},
      {"Air to 0", p::kAir, 0.0f},       {"Width to 0", p::kWidth, 0.0f},     {"Width to 1", p::kWidth, 1.0f},
      {"Volume to -48", p::kVolume, -48.0f}, {"Volume to 6", p::kVolume, 6.0f},
      {"Gust to 0", p::kGust, 0.0f},     {"Lull to 0", p::kLull, 0.0f},       {"Strings to 2", p::kStrings, 2.0f},
      {"Glint to 1", p::kGlint, 1.0f},   {"Ring to 20", p::kRing, 20.0f},     {"Hum to 0", p::kHum, 0.0f},
      {"Touch to 1", p::kTouch, 1.0f},   {"Touch to 0", p::kTouch, 0.0f},     {"Release to 0.05", p::kRelease, 0.05f},
      {"Release to 12", p::kRelease, 12.0f},
  };
  double worst = 0.0;
  const char* worst_name = "";
  for (const Move& move : moves) {
    const double sudden = suddenness(chord, [&](WindHarp& d) { d.set_param(move.id, move.to); });
    if (sudden > worst) {
      worst = sudden;
      worst_name = move.name;
    }
    char label[120];
    std::snprintf(label, sizeof label, "%s under a chord arrives gradually (%.3f of it in 8 samples)", move.name, sudden);
    EXPECT(sudden < 0.12, label);
  }
  std::printf("clicks: of 24 knob throws (all twelve knobs) the most sudden is %s, %.3f of the change in 8 samples\n",
              worst_name, worst);

  // Wind is the knob most likely to be turned while sounding. Thrown from
  // one end to the other under a soft low chord, at eight moments: in the
  // 2 ms that follow, the largest sample step is that of the same 2 ms with
  // the knob left alone (later the sound is brighter, as it should be).
  auto low_chord = [](WindHarp& d) {
    d.init(kRate);
    d.set_param(p::kWind, 0.0f);
    d.set_param(p::kGust, 0.0f);
    d.set_param(p::kAir, 0.0f);
    d.note_on(1, 110.0f, 0.5f);
    d.note_on(2, 164.81f, 0.5f);
  };
  double step_ratio = 0.0;
  for (int trial = 0; trial < 8; ++trial) {
    low_chord(device);
    low_chord(other);
    render(device, 2.0f + 0.0113f * trial, kRate);
    render(other, 2.0f + 0.0113f * trial, kRate);
    device.set_param(p::kWind, 1.0f);
    Stereo thrown = render(device, 0.002f, kRate), alone = render(other, 0.002f, kRate);
    step_ratio = std::max(step_ratio, std::max(max_step(thrown.left), max_step(thrown.right)) /
                                          std::max(max_step(alone.left), max_step(alone.right)));
  }
  std::printf("clicks: Wind thrown from 0 to 1: the largest step in the next 2 ms is %.3f of the untouched passage's\n",
              step_ratio);
  EXPECT(step_ratio < 1.1, "throwing Wind adds no step to the passage");

  // A key let go at the shortest Release, a key struck again, a thirteenth
  // key that takes a sounding voice.
  auto short_release = [&](WindHarp& d) {
    chord(d);
    d.set_param(p::kRelease, 0.05f);
  };
  const double off = suddenness(short_release, [](WindHarp& d) { d.note_off(2); });
  const double again = suddenness(chord, [](WindHarp& d) { d.note_on(2, 164.81f, 0.8f); });
  auto full = [](WindHarp& d) {
    d.init(kRate);
    d.set_param(p::kGust, 0.3f);
    for (int n = 0; n < 12; ++n) d.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 0.6f);
  };
  const double steal = suddenness(full, [](WindHarp& d) { d.note_on(40, 1396.9f, 0.8f); });
  std::printf("clicks: note off at Release 0.05 s %.3f, a key struck again %.3f, a stolen voice %.3f\n", off, again, steal);
  EXPECT(off < 0.12, "a key let go at the shortest Release fades");
  EXPECT(again < 0.12, "a key struck again starts gradually");
  EXPECT(steal < 0.12, "a stolen voice fades before its new note begins");
}

// Voices: a chord into a full pool, a key struck again, and the pool emptied.
static void test_voices() {
  // Twelve held keys, then two more before any audio: both sound.
  device.init(kRate);
  device.set_param(p::kGust, 0.0f);
  device.set_param(p::kWind, 0.0f);
  device.set_param(p::kAir, 0.0f);
  device.set_param(p::kStrings, 1.0f);
  device.set_param(p::kRelease, 0.1f);
  for (int n = 0; n < 12; ++n) device.note_on(n, 98.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
  render(device, 3.0f, kRate);
  device.note_on(20, 1500.0f, 0.8f);
  device.note_on(21, 1900.0f, 0.8f);
  Stereo out = render(device, 2.0f, kRate);
  const double first = tone_level(out.left, 1500.0, kRate, at(1.0)), second = tone_level(out.left, 1900.0, kRate, at(1.0));
  std::printf("voices: two keys into a full pool sound at %.1f and %.1f dB\n", db(first), db(second));
  EXPECT(db(first) > -35.0 && db(second) > -35.0, "both keys of a chord sound when the pool is full");
  // And only two voices were taken: ten of the twelve held keys still sound.
  int left_sounding = 0;
  for (int n = 0; n < 12; ++n) {
    if (tone_level(out.left, 98.0 * std::pow(2.0, n * 2 / 12.0), kRate, at(1.0)) > 1.0e-3) ++left_sounding;
  }
  EXPECT(left_sounding == 10, "two new keys take two voices and no more");

  // Eleven held keys and two more at once: the first takes the last free
  // voice, and the second does not take it back because it has only begun.
  device.init(kRate);
  device.set_param(p::kGust, 0.0f);
  device.set_param(p::kWind, 0.0f);
  device.set_param(p::kAir, 0.0f);
  device.set_param(p::kStrings, 1.0f);
  device.set_param(p::kRelease, 0.1f);
  for (int n = 0; n < 11; ++n) device.note_on(n, 98.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
  render(device, 3.0f, kRate);
  device.note_on(20, 1500.0f, 0.8f);
  device.note_on(21, 1900.0f, 0.8f);
  Stereo last = render(device, 2.0f, kRate);
  int still = 0;
  for (int n = 0; n < 11; ++n) {
    if (tone_level(last.left, 98.0 * std::pow(2.0, n * 2 / 12.0), kRate, at(1.0)) > 1.0e-3) ++still;
  }
  EXPECT(db(tone_level(last.left, 1500.0, kRate, at(1.0))) > -35.0 &&
             db(tone_level(last.left, 1900.0, kRate, at(1.0))) > -35.0 && still == 10,
         "a key that has just taken the last free voice is not taken by the next");

  // A key struck twice inside the fade of the voice it stole is one note:
  // the other held keys stay, and one note off ends it.
  device.init(kRate);
  device.set_param(p::kGust, 0.0f);
  device.set_param(p::kWind, 0.0f);
  device.set_param(p::kAir, 0.0f);
  device.set_param(p::kStrings, 1.0f);
  device.set_param(p::kRelease, 0.1f);
  for (int n = 0; n < 12; ++n) device.note_on(n, 98.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
  render(device, 3.0f, kRate);
  device.note_on(30, 1500.0f, 0.8f);
  device.note_on(30, 1500.0f, 0.8f);
  Stereo twice = render(device, 2.0f, kRate);
  int kept = 0;
  for (int n = 0; n < 12; ++n) {
    if (tone_level(twice.left, 98.0 * std::pow(2.0, n * 2 / 12.0), kRate, at(1.0)) > 1.0e-3) ++kept;
  }
  EXPECT(kept == 11, "a key struck twice during a steal takes one voice");
  device.note_off(30);
  render(device, 1.0f, kRate);
  Stereo gone = render(device, 1.0f, kRate);
  EXPECT(tone_level(gone.left, 1500.0, kRate) < 1.0e-5, "and its one note off ends it");
  for (int n = 0; n < 12; ++n) device.note_off(n);

  // A stolen key let go before its note has begun still ends.
  device.init(kRate);
  for (int n = 0; n < 12; ++n) device.note_on(n, 98.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
  render(device, 1.0f, kRate);
  device.note_on(31, 1500.0f, 0.8f);
  device.process(16);
  device.note_off(31);
  for (int n = 0; n < 12; ++n) device.note_off(n);
  render(device, 6.0f, kRate);
  EXPECT(both_peak(render(device, 0.5f, kRate)) == 0.0, "a stolen key let go at once leaves nothing sounding");

  device.init(kRate);
  device.set_param(p::kGust, 0.0f);
  device.set_param(p::kWind, 0.0f);
  device.set_param(p::kAir, 0.0f);
  device.set_param(p::kStrings, 1.0f);
  device.set_param(p::kRelease, 0.1f);
  for (int n = 0; n < 12; ++n) device.note_on(n, 98.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
  render(device, 3.0f, kRate);
  device.note_on(20, 1500.0f, 0.8f);
  device.note_on(21, 1900.0f, 0.8f);
  render(device, 2.0f, kRate);
  for (int n = 0; n < 12; ++n) device.note_off(n);
  device.note_off(20);
  device.note_off(21);
  render(device, 6.0f, kRate);
  Stereo drained = render(device, 0.5f, kRate);
  EXPECT(both_peak(drained) == 0.0, "and every voice is silent once the keys are let go");

  // A key struck again and again leaves one note that its note off ends.
  device.init(kRate);
  for (int i = 0; i < 20; ++i) {
    device.note_on(7, 220.0f, 0.8f);
    render(device, 0.013f, kRate);
  }
  device.note_off(7);
  render(device, 6.0f, kRate);
  EXPECT(both_peak(render(device, 0.5f, kRate)) == 0.0, "a key struck twenty times is ended by one note off");

  // Release is the time it says, and the end is exact silence.
  steady(device);
  device.set_param(p::kRelease, 1.0f);
  device.set_param(p::kWind, 0.0f);
  device.note_on(1, 220.0f, 0.8f);
  Stereo held = render(device, 2.0f, kRate);
  device.note_off(1);
  Stereo fall = render(device, 3.0f, kRate);
  const double full = rms(held.left, at(1.5));
  std::printf("release: Release 1 s is %.1f dB down after 0.5 s and %.1f dB after 1 s\n",
              -db(rms(fall.left, at(0.49), at(0.51)) / full), -db(rms(fall.left, at(0.99), at(1.01)) / full));
  EXPECT_NEAR(-db(rms(fall.left, at(0.49), at(0.51)) / full), 30.0, 2.0, "a 1 s release is 30 dB down at half its time");
  EXPECT_NEAR(-db(rms(fall.left, at(0.99), at(1.01)) / full), 60.0, 3.0, "and 60 dB down after it");
  EXPECT(peak(fall.left, at(2.0)) == 0.0, "then exactly silent");
}

// A knob moved while the instrument sleeps has arrived when the next key
// goes down; and the same notes give the same audio at any block size,
// through silences that end around the moment it falls asleep.
static void test_sleep_and_blocks() {
  const size_t k = 2048;
  auto phrase = [&](size_t gap, bool move_late) {
    std::vector<Event> events;
    events.push_back({0, [](WindHarp& d) {
                        d.set_param(p::kRelease, 0.05f);
                        d.note_on(1, 220.0f, 0.8f);
                        d.note_on(2, 330.0f, 0.6f);
                      }});
    events.push_back({8 * k, [](WindHarp& d) {
                        d.note_off(1);
                        d.note_off(2);
                      }});
    auto move = [](WindHarp& d) {
      d.set_param(p::kVolume, -20.0f);
      d.set_param(p::kWidth, 0.1f);
      d.set_param(p::kAir, 0.9f);
      d.set_param(p::kStrings, 3.0f);
      d.set_param(p::kTouch, 1.0f);
    };
    // Moved in the last block of the silence, or (the reference) while the
    // first chord is still fading.
    events.push_back({move_late ? (8 + gap - 1) * k : 9 * k, move});
    events.push_back({(8 + gap) * k, [](WindHarp& d) { d.note_on(3, 261.63f, 0.8f); }});
    events.push_back({(8 + gap + 12) * k, [](WindHarp& d) { d.note_off(3); }});
    return events;
  };
  double by_block = 0.0, by_move = 0.0;
  // The chord has faded 2 blocks (4000 samples) after its keys are let go
  // and the instrument sleeps 2400 samples later: gaps of 3 to 8 blocks walk
  // across that moment, 16 is a long sleep.
  for (size_t gap : {size_t(3), size_t(4), size_t(5), size_t(6), size_t(8), size_t(16)}) {
    const size_t total = (8 + gap + 16) * k;
    device.init(kRate);
    const Stereo reference = play(device, phrase(gap, true), total, 128);
    for (int block : {1, 2048, 77}) {
      device.init(kRate);
      by_block = std::max(by_block, worst_difference(play(device, phrase(gap, true), total, block), reference));
    }
    if (gap >= 4) {
      device.init(kRate);
      const Stereo early = play(device, phrase(gap, false), total, 128);
      double worst = 0.0;
      for (size_t i = (8 + gap) * k; i < total; ++i) {
        worst = std::max(worst, std::fabs(static_cast<double>(early.left[i]) - reference.left[i]));
        worst = std::max(worst, std::fabs(static_cast<double>(early.right[i]) - reference.right[i]));
      }
      by_move = std::max(by_move, worst);
    }
    EXPECT(both_peak(reference, (8 + gap) * k) > 0.01, "the key after the silence sounds");
  }
  std::printf("blocks: 1, 77 and 2048 frames differ from 128 by %g over six silences\n", by_block);
  EXPECT(by_block == 0.0, "the output does not depend on the block size, through a silence and a wake");
  std::printf("sleep: knobs moved in the last 43 ms of a silence differ from knobs moved long before by %g\n", by_move);
  EXPECT(by_move == 0.0, "a knob moved while it sleeps has arrived when the next key goes down");

  // Two inits, the same notes: the same audio, bit for bit.
  const size_t total = 40 * k;
  device.init(kRate);
  const Stereo once = play(device, phrase(6, true), total, 128);
  device.init(kRate);
  const Stereo twice = play(device, phrase(6, true), total, 128);
  other.init(kRate);
  const Stereo elsewhere = play(other, phrase(6, true), total, 128);
  EXPECT(once.left == twice.left && once.right == twice.right, "a second init gives bit-identical audio");
  EXPECT(once.left == elsewhere.left && once.right == elsewhere.right, "and so does another instance");
}

int main() {
  Conformance spec;
  spec.name = "wind-harp";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 6.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  test_tuning();
  test_wind();
  test_band();
  test_glint();
  test_gust_and_lull();
  test_one_wind();
  test_idea();
  test_ring();
  test_touch();
  test_hum();
  test_strings();
  test_air();
  test_levels();
  test_clicks();
  test_voices();
  test_sleep_and_blocks();

  // Cost with eight keys held at the defaults, and with everything lit.
  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  render(device, 1.0f, kRate);
  report_cost("wind-harp (8 keys, defaults)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });
  device.init(kRate);
  device.set_param(p::kStrings, 4.0f);
  device.set_param(p::kGust, 1.0f);
  device.set_param(p::kGlint, 1.0f);
  device.set_param(p::kRing, 20.0f);
  device.set_param(p::kWind, 0.6f);
  for (int n = 0; n < 8; ++n) device.note_on(n, 55.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  render(device, 10.0f, kRate);
  report_cost("wind-harp (8 keys, 4 strings, Ring 20 s, Gust 1)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("wind-harp");
}
