// Native harness for Night Drum: conformance, then what makes it this drum (a
// weighted skin in tune, a low key with overtones, a bend that comes back,
// hands that hold and differ in kind), then the faults instruments have had.

#include "../devices/night-drum/night_drum.h"
#include <limits>

#include "support/test_kit.h"

using namespace testkit;
using livemix::NightDrum;
namespace p = livemix::night_drum;
static NightDrum device;
static const float kRate = 48000.0f;
static char label[240];

#define HOLDS(condition, ...)                                                   \
  do { std::snprintf(label, sizeof label, __VA_ARGS__); EXPECT(condition, label); } while (0)

enum { kFinger = 0, kThumb, kPalm, kStick, kBrush, kRub, kHum };
enum { kShallow = 0, kPot, kKettle, kTube, kNone };

using Set = std::pair<int, float>;
using Sets = std::vector<Set>;

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }
static double loudest(const Stereo& s) { return std::max(peak(s.left), peak(s.right)); }
static float note_hz(float midi) { return 440.0f * std::exp2((midi - 69.0f) / 12.0f); }
static void apply(const Sets& sets) {
  for (const Set& s : sets) device.set_param(s.first, s.second);
}
static std::vector<float> mono(const Stereo& s) {
  std::vector<float> m(s.size());
  for (size_t i = 0; i < m.size(); ++i) m[i] = 0.5f * (s.left[i] + s.right[i]);
  return m;
}
static Stereo note(const Sets& sets, float midi, float gain, float hold, float rest = 0.0f, float rate = kRate) {
  device.init(rate);
  apply(sets);
  device.note_on(1, note_hz(midi), gain);
  Stereo s = render(device, hold, rate);
  device.note_off(1);
  return rest > 0.0f ? concat(s, render(device, rest, rate)) : s;
}
// One stroke, nothing loose, quick to land.
static Sets single(int hand, Sets more = {}) {
  Sets s = {{p::kHand, static_cast<float>(hand)}, {p::kRoll, 0.0f}, {p::kScatter, 0.0f}, {p::kSwell, 0.01f},
            {p::kOtherSkin, 0.0f}, {p::kBend, 0.0f}, {p::kOffCentre, 0.0f}, {p::kGrain, 0.0f}};
  s.insert(s.end(), more.begin(), more.end());
  return s;
}
static double level_db(const std::vector<float>& x, double from, double to) { return db(rms(x, at(from), at(to))); }
static double tone_db(const std::vector<float>& x, double hz, double from, double to) {
  return db(tone_level(x, hz, kRate, at(from), at(to)));
}
// Cents of the strongest tone near `hz`.
static double off_key(const std::vector<float>& x, double hz, double from, double to, double rate = kRate, double reach = 60.0) {
  double best = -1.0, best_cents = 0.0, centre = 0.0, span = reach;
  for (int pass = 0; pass < 4; ++pass) {
    for (int i = -10; i <= 10; ++i) {
      const double c = centre + span * i / 10.0;
      const double level = tone_level(x, hz * std::exp2(c / 1200.0), rate, at(from, rate), at(to, rate));
      if (level > best) {
        best = level;
        best_cents = c;
      }
    }
    centre = best_cents;
    span /= 5.0;
  }
  return best_cents;
}
// What lies between a tone's harmonics: near 0 for a pure tone.
static double between(const std::vector<float>& x, double hz, double from, double to) {
  double on = 0.0, off = 0.0;
  for (int h = 1; h <= 6; ++h) {
    const double a = tone_level(x, hz * h, kRate, at(from), at(to));
    const double b = tone_level(x, hz * (h + 0.37), kRate, at(from), at(to));
    on += a * a;
    off += b * b;
  }
  return off / (on + off + 1.0e-20);
}
// A coarse print: twelve bands in three stretches and the level as it goes, in dB.
static std::vector<float> print_of(const Stereo& s) {
  const std::vector<float> x = mono(s);
  std::vector<float> out;
  for (int stretch = 0; stretch < 3; ++stretch) {
    const size_t from = x.size() * stretch / 3, to = x.size() * (stretch + 1) / 3;
    for (int b = 0; b < 12; ++b) {
      livemix::kit::Svf band;
      band.set(90.0f * std::exp2(0.55f * b), 2.5f, kRate);
      double sum = 0.0;
      for (size_t i = from; i < to; ++i) {
        const float y = band.bandpass(x[i]);
        sum += static_cast<double>(y) * y;
      }
      out.push_back(static_cast<float>(db(std::sqrt(sum / static_cast<double>(to - from)) + 1.0e-4)));
    }
  }
  for (size_t hop = at(0.08), from = 0; from + hop <= x.size(); from += hop) out.push_back(static_cast<float>(db(rms(x, from, from + hop) + 1.0e-4)));
  return out;
}
static double apart(const std::vector<float>& a, const std::vector<float>& b) {
  const double shift = mean(a) - mean(b);
  double sum = 0.0;
  for (size_t i = 0; i < a.size(); ++i) sum += std::fabs(a[i] - b[i] - shift);
  return sum / a.size();
}
static const float kChord[5] = {50, 57, 65, 72, 76};
static Stereo chord(const Sets& sets, float hold, float rest) {
  device.init(kRate);
  apply(sets);
  for (int i = 0; i < 5; ++i) device.note_on(i, note_hz(kChord[i]), 0.8f);
  Stereo s = render(device, hold, kRate);
  for (int i = 0; i < 5; ++i) device.note_off(i);
  return concat(s, render(device, rest, kRate));
}
// The sharpest corner in the sound: its largest second difference.
static double corner(const Stereo& s, double from, double to) {
  double worst = 0.0;
  for (const auto* x : {&s.left, &s.right}) {
    for (size_t i = std::max<size_t>(at(from), 2); i < std::min(at(to), x->size()); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>((*x)[i]) - 2.0 * (*x)[i - 1] + (*x)[i - 2]));
    }
  }
  return worst;
}

static void in_tune_and_even() {
  double most = -200.0, least = 200.0;
  for (float midi : {36.0f, 48.0f, 60.0f, 72.0f, 84.0f}) {
    const Stereo s = note({}, midi, 0.7f, 4.0f);
    const double c = off_key(mono(s), note_hz(midi), 1.0, 4.0);
    HOLDS(std::fabs(c) < 3.0, "a roll plays on the key (%.0f is off by %.2f cents)", midi, c);
    const double top = db(loudest(s)), body = level_db(mono(s), 0.5, 4.0);
    HOLDS(top > -24.0 && top < -10.0, "one note of %.0f peaks between -24 and -10 dB (%.1f)", midi, top);
    most = std::max(most, body);
    least = std::min(least, body);
  }
  HOLDS(most - least < 6.0, "the keys are even from C2 to C6 (%.1f dB apart)", most - least);
  for (int hand = 0; hand < 7; ++hand) {
    const Stereo s = note({{p::kHand, static_cast<float>(hand)}, {p::kScatter, 0.0f}, {p::kRing, 5.0f}, {p::kOffCentre, 0.0f}}, 50.0f, 0.7f, 4.0f);
    const double c = off_key(mono(s), note_hz(50.0f), 1.0, 4.0, kRate, 40.0);
    HOLDS(std::fabs(c) < (hand == kBrush ? 12.0 : 3.0), "hand %d is in tune (%.2f cents)", hand, c);  // bristles are noise, and stray
  }
}

static void a_low_key_speaks() {
  const std::vector<float> x = mono(note({}, 38.0f, 0.7f, 3.0f));
  const double hz = note_hz(38.0f);
  double upper = 0.0;
  for (int h = 2; h <= 8; ++h) {
    const double a = tone_level(x, hz * h, kRate, at(0.5), at(3.0));
    upper += a * a;
  }
  const double share = 10.0 * std::log10(upper) - tone_db(x, hz, 0.5, 3.0);
  HOLDS(share > -8.0, "D2 is heard through its overtones (%.1f dB of its fundamental)", share);
}

static void load_draws_the_ratios() {
  const double hz = note_hz(50.0f);
  const std::vector<float> bare = mono(note(single(kStick, {{p::kLoad, 0.0f}, {p::kRing, 4.0f}}), 50.0f, 0.9f, 1.0f));
  const std::vector<float> loaded = mono(note(single(kStick, {{p::kLoad, 1.0f}, {p::kRing, 4.0f}}), 50.0f, 0.9f, 1.0f));
  const double a = tone_db(loaded, 2.0 * hz, 0.05, 0.6) - tone_db(loaded, 1.594 * hz, 0.05, 0.6);
  const double b = tone_db(bare, 1.594 * hz, 0.05, 0.6) - tone_db(bare, 2.0 * hz, 0.05, 0.6);
  HOLDS(a > 15.0 && b > 6.0, "a loaded skin has its octave, a bare one 1.594 (%.1f and %.1f dB)", a, b);
  const std::vector<float> kettle = mono(note(single(kStick, {{p::kLoad, 1.0f}, {p::kRing, 4.0f}, {p::kCavity, kKettle}}), 50.0f, 0.9f, 1.0f));
  const double fifth = tone_db(kettle, 1.5 * hz, 0.05, 0.6) - tone_db(loaded, 1.5 * hz, 0.05, 0.6);
  HOLDS(fifth > 12.0, "a kettle rings in fifths (%.1f dB over the pot)", fifth);
}

static void the_bend_falls_back() {
  for (float bend : {7.0f, -7.0f}) {
    const std::vector<float> x = mono(note(single(kFinger, {{p::kBend, bend}, {p::kFall, 0.12f}, {p::kRing, 8.0f}, {p::kDamp, 0.0f}}), 50.0f, 0.9f, 2.5f));
    const double early = 50.0 * bend + off_key(x, note_hz(50.0f + 0.5f * bend), 0.01, 0.07, kRate, 340.0);
    const double late = off_key(x, note_hz(50.0f), 1.5, 2.5);
    const std::vector<float> slow = mono(note(single(kFinger, {{p::kBend, bend}, {p::kFall, 2.0f}, {p::kRing, 8.0f}, {p::kDamp, 0.0f}}), 50.0f, 0.9f, 0.6f));
    const double still = 50.0 * bend + off_key(slow, note_hz(50.0f + 0.5f * bend), 0.4, 0.6, kRate, 340.0);
    HOLDS(still * bend > 0.0 && std::fabs(still) > 200.0, "a slow Fall is still away after half a second (%.0f cents)", still);
    HOLDS(early * bend > 0.0 && std::fabs(early) > 120.0 && std::fabs(late) < 3.0,
          "a bend of %.0f starts away (%.0f cents) and ends on the key (%.2f)", bend, early, late);
  }
}

static void hands_that_hold() {
  for (int hand : {kFinger, kBrush, kRub, kHum}) {
    const std::vector<float> x = mono(note({{p::kHand, static_cast<float>(hand)}, {p::kScatter, 0.1f}}, 57.0f, 0.8f, 8.0f, 6.0f));
    const double early = level_db(x, 1.5, 4.0), late = level_db(x, 5.0, 8.0), gone = level_db(x, 12.0, 14.0);
    HOLDS(std::fabs(late - early) < 3.0 && early > -45.0 && gone < -90.0,
          "hand %d holds a note (%.1f then %.1f dB) and lets it go (%.1f)", hand, early, late, gone);
  }
  // A roll neither piles up on a long ring nor starves on a short one.
  const auto rolled = [](float ring) { return level_db(mono(note({{p::kRing, ring}}, 50.0f, 0.8f, 5.0f)), 1.0, 5.0); };
  const double small = rolled(0.5f), large = rolled(12.0f);
  HOLDS(large - small < 12.0 && large - small > -3.0, "a roll keeps its level on any ring (%.1f and %.1f dB)", small, large);
}

static void hands_and_bodies_differ() {
  std::vector<std::vector<float>> prints;
  for (int hand = 0; hand < 7; ++hand) prints.push_back(print_of(chord({{p::kHand, static_cast<float>(hand)}}, 2.4f, 0.6f)));
  std::vector<std::vector<float>> bodies;
  for (int body = 0; body < 5; ++body) bodies.push_back(print_of(chord({{p::kCavity, static_cast<float>(body)}}, 2.4f, 0.6f)));
  for (const auto* set : {&prints, &bodies}) {
    for (size_t a = 0; a < set->size(); ++a) {
      for (size_t b = a + 1; b < set->size(); ++b) {
        const double d = apart((*set)[a], (*set)[b]);
        HOLDS(d > (set == &prints ? 2.2 : 1.5),
              "%s %d and %d are far apart (%.1f dB)", set == &prints ? "hands" : "bodies", static_cast<int>(a), static_cast<int>(b), d);
      }
    }
  }
  const double brush = between(mono(note({{p::kHand, kBrush}, {p::kGrain, 0.7f}}, 57.0f, 0.8f, 4.0f)), note_hz(57.0f), 1.0, 4.0);
  const double hum = between(mono(note({{p::kHand, kHum}}, 57.0f, 0.8f, 4.0f)), note_hz(57.0f), 1.0, 4.0);
  HOLDS(brush > 20.0 * hum, "a brush is noise and a hum is tone (%.4f and %.6f)", brush, hum);
}

static void place_touch_and_key_weight() {
  const auto bright = [](const Sets& more, float gain) {
    return energy_above(mono(note(single(kFinger, more), 50.0f, gain, 1.0f)), 900.0, kRate, 0, at(0.3));
  };
  const double centre = bright({{p::kPlace, 0.0f}}, 0.8f), rim = bright({{p::kPlace, 1.0f}}, 0.8f);
  const double soft = bright({{p::kTouch, 0.0f}}, 0.8f), hard = bright({{p::kTouch, 1.0f}}, 0.8f);
  const double light = bright({}, 0.2f), heavy = bright({}, 1.0f);
  HOLDS(rim > 1.5 * centre && hard > 2.0 * soft,
        "Place and Touch are colour (%.4f to %.4f, %.4f to %.4f)", centre, rim, soft, hard);
  HOLDS(heavy > 1.3 * light, "a harder key is brighter (%.4f to %.4f)", light, heavy);
  const auto loud = [](const Sets& more, float gain) { return level_db(mono(note(single(kFinger, more), 50.0f, gain, 1.0f)), 0.0, 0.5); };
  const double a = loud({}, 0.2f), b = loud({}, 1.0f);
  HOLDS(b - a > 12.0, "and louder (%.1f dB)", b - a);
  const double c = loud({{p::kPlace, 0.0f}}, 0.8f), d = loud({{p::kPlace, 1.0f}}, 0.8f);
  HOLDS(std::fabs(d - c) < 7.0, "Place keeps the level (%.1f dB)", d - c);
}

// What each of the other knobs is for, in one figure.
static void every_knob_does_its_work() {
  const auto shine = [](const Sets& sets, float midi, double from, double to) {
    const std::vector<float> x = mono(note(sets, midi, 0.8f, static_cast<float>(to)));
    return energy_above(x, 900.0, kRate, at(from), at(to));
  };
  const auto more = [](double low, double high, double times, const char* what) { HOLDS(high > times * low, "%s (%.4f to %.4f)", what, low, high); };
  more(shine({{p::kHand, kHum}, {p::kTouch, 0.0f}}, 57, 1, 3), shine({{p::kHand, kHum}, {p::kTouch, 1.0f}}, 57, 1, 3), 2.0, "a hard hum is bright");
  more(shine({{p::kHand, kHum}, {p::kPlace, 0.0f}}, 57, 1, 3), shine({{p::kHand, kHum}, {p::kPlace, 1.0f}}, 57, 1, 3), 2.0, "Place turns a hum");
  more(shine({{p::kCavityTune, -18.0f}}, 57, 1, 3), shine({{p::kCavityTune, 18.0f}}, 57, 1, 3), 1.5, "a small body is brighter than a large one");
  more(shine({{p::kSkin, 0.0f}}, 57, 1, 3), shine({{p::kSkin, 1.0f}}, 57, 1, 3), 2.0, "a thin skin is brighter than a thick one");
  more(shine(single(kFinger, {{p::kRing, 5.0f}}), 57, 0.3, 1.0), shine(single(kStick, {{p::kRing, 5.0f}}), 57, 0.3, 1.0), 1.5, "a stick leaves the overtones ringing");
  for (int hand : {kFinger, kPalm, kStick}) {
    more(shine(single(hand, {{p::kGrain, 0.0f}}), 38, 0.0, 0.05), shine(single(hand, {{p::kGrain, 1.0f}}), 38, 0.0, 0.05), 1.5, "Grain is the hand itself");
  }
  const auto level = [](const Sets& sets, double from, double to) { return level_db(mono(note(sets, 57.0f, 0.8f, static_cast<float>(to))), from, to); };
  const double slow = level({{p::kSwell, 4.0f}}, 0.0, 0.5), quick = level({{p::kSwell, 0.01f}}, 0.0, 0.5);
  HOLDS(quick - slow > 8.0, "a long Swell comes up out of nothing (%.1f and %.1f dB)", slow, quick);
  const auto restless = [&](float scatter) {
    const std::vector<float> x = mono(note({{p::kScatter, scatter}, {p::kRoll, 8.0f}}, 57.0f, 0.8f, 5.0f));
    double sum = 0.0;
    for (int i = 10; i < 49; ++i) sum += std::fabs(level_db(x, 0.1 * i, 0.1 * i + 0.1) - level_db(x, 0.1 * i + 0.1, 0.1 * i + 0.2));
    return sum / 39.0;
  };
  const double even = restless(0.0f), loose = restless(1.0f);
  HOLDS(loose > 1.5 * even && even < 1.5, "Scatter is how far the strokes stray (%.2f to %.2f dB)", even, loose);
  device.init(kRate);
  device.set_param(p::kBend, 6.0f);
  EXPECT(device.meter(0) == 0.0f && device.meter(1) == 0.0f && device.meter(2) == 0.0f, "the meters rest at zero");
  device.note_on(1, 220.0f, 1.0f);
  render(device, 0.03f, kRate);
  EXPECT(device.meter(0) > 0.5f && device.meter(1) > 0.1f && device.meter(2) > 0.3f, "and show the tension, the level and the stroke");
  // The air of a body far too low for a drum is no rumble.
  const std::vector<float> low = mono(note({{p::kHand, kPalm}, {p::kRoll, 0.0f}, {p::kCavity, kKettle}, {p::kCavityTune, -18.0f}}, 50.0f, 0.8f, 1.0f));
  HOLDS(energy_above(low, 60.0, kRate) > 0.8, "a large kettle does not rumble (%.2f above 60 Hz)", energy_above(low, 60.0, kRate));
  // No ring is without end, wherever the knobs stand.
  device.init(kRate);
  apply(single(kStick, {{p::kRing, 12.0f}, {p::kCavity, kKettle}, {p::kDamp, 0.0f}}));
  device.note_on(1, 73.4f, 0.8f);
  render(device, 0.2f, kRate);
  device.note_off(1);
  const double first = db(rms(render(device, 1.0f, kRate).left));
  render(device, 18.0f, kRate);
  HOLDS(db(rms(render(device, 1.0f, kRate).left)) < first - 40.0, "the longest ring ends (%.1f dB at first)", first);
}

static void the_rest_of_the_drum() {
  const double hz = note_hz(57.0f);
  // The second skin sounds its own note, and blooms after the first.
  const Sets other = single(kHum, {{p::kOtherSkin, 1.0f}, {p::kOtherTune, 7.0f}, {p::kRing, 6.0f}});
  const std::vector<float> with = mono(note(other, 57.0f, 0.8f, 4.0f));
  const std::vector<float> without = mono(note(single(kHum, {{p::kRing, 6.0f}}), 57.0f, 0.8f, 4.0f));
  const double there = tone_db(with, 1.4983 * hz, 2.0, 4.0) - tone_db(without, 1.4983 * hz, 2.0, 4.0);
  const double bloom = tone_db(with, 1.4983 * hz, 2.0, 4.0) - tone_db(with, 1.4983 * hz, 0.2, 0.6);
  HOLDS(there > 15.0 && bloom > 1.0, "the second skin answers (%.1f dB) and blooms (%.1f dB)", there, bloom);
  // The thread buzzes.
  const std::vector<float> plain = mono(note(single(kHum), 57.0f, 0.8f, 3.0f));
  const std::vector<float> buzz = mono(note(single(kHum, {{p::kThread, 1.0f}}), 57.0f, 0.8f, 3.0f));
  const double a = energy_above(plain, 3000.0, kRate, at(1.0)), b = energy_above(buzz, 3000.0, kRate, at(1.0));
  HOLDS(b > 2.0 * a, "the thread buzzes (%.5f to %.5f)", a, b);
  // Off the centre the pairs beat: the octave of a held stroke swells and sinks.
  const auto beat = [&](float off) {
    const std::vector<float> x = mono(note(single(kStick, {{p::kOffCentre, off}, {p::kRing, 8.0f}, {p::kSkin, 1.0f}, {p::kDamp, 0.0f}}), 57.0f, 0.9f, 2.0f));
    double worst = 0.0, last = tone_db(x, 3.0 * hz, 0.1, 0.2);
    for (int i = 1; i < 18; ++i) {
      const double level = tone_db(x, 3.0 * hz, 0.1 + 0.1 * i, 0.2 + 0.1 * i);
      worst = std::max(worst, std::fabs(level - last));
      last = level;
    }
    return worst;
  };
  const double still = beat(0.0f), beating = beat(0.4f);
  HOLDS(beating > still + 3.0, "off the centre the pairs beat (%.1f to %.1f dB)", still, beating);
  // Damp stops the drum at the key's end, Ring rings on.
  const std::vector<float> open = mono(note(single(kFinger, {{p::kDamp, 0.0f}, {p::kRing, 8.0f}}), 57.0f, 0.8f, 0.3f, 1.0f));
  const std::vector<float> shut = mono(note(single(kFinger, {{p::kDamp, 1.0f}, {p::kRing, 8.0f}}), 57.0f, 0.8f, 0.3f, 1.0f));
  const double gone = level_db(open, 0.6, 1.2) - level_db(shut, 0.6, 1.2);
  HOLDS(gone > 30.0, "Damp stops the drum (%.0f dB)", gone);
  const Stereo wide = chord({{p::kWidth, 1.0f}}, 2.0f, 0.0f), narrow = chord({{p::kWidth, 0.0f}}, 2.0f, 0.0f);
  const double cw = correlation(wide.left, wide.right), cn = correlation(narrow.left, narrow.right);
  HOLDS(cn > 0.995 && cw < 0.9 && cw > 0.0, "Width opens the field (%.2f from %.2f)", cw, cn);
}

static void chords_stay_under_the_knee() {
  const int keys[10] = {38, 45, 50, 53, 57, 60, 62, 65, 69, 72};
  const Sets patches[] = {{},
                          {{p::kHand, kRub}, {p::kCavity, kNone}, {p::kRing, 1.0f}, {p::kDamp, 0.7f}},
                          {{p::kHand, kHum}, {p::kCavity, kKettle}, {p::kTouch, 0.95f}},
                          {{p::kOtherSkin, 1.0f}, {p::kRing, 5.0f}}};
  for (int n = 0; n < 4; ++n) {
    device.init(kRate);
    apply(patches[n]);
    double top = 0.0;
    for (int i = 0; i < 20; ++i) {  // and every key once more while it rings
      device.note_on(i, note_hz(static_cast<float>(keys[i % 10])), 1.0f);
      top = std::max(top, loudest(render(device, i == 9 ? 2.0f : 0.04f, kRate)));
    }
    top = db(std::max(top, loudest(render(device, 2.0f, kRate))));
    HOLDS(top < -6.02, "ten keys stay under the clip's knee, patch %d (%.1f dB)", n, top);
  }
}

static void no_clicks() {
  // A hum with no grain is smooth, so a corner in it is a fault.
  const Sets smooth = {{p::kHand, kHum}, {p::kRoll, 0.0f}, {p::kGrain, 0.0f}, {p::kScatter, 0.0f}, {p::kSwell, 0.3f}};
  device.init(kRate);
  apply(smooth);
  for (int i = 0; i < 12; ++i) device.note_on(i, note_hz(45.0f + 2.0f * i), 0.8f);
  render(device, 2.0f, kRate);
  const double held = corner(render(device, 0.5f, kRate), 0.0, 0.5);
  device.note_on(20, note_hz(46.0f), 0.8f);  // takes a voice that sounds
  device.note_on(21, note_hz(48.0f), 0.8f);
  const double taken = corner(render(device, 0.3f, kRate), 0.0, 0.3);
  HOLDS(taken < 1.5 * held, "taking a voice does not click (%.6f against %.6f)", taken, held);
  // Choices and knobs thrown while it sounds.
  for (int id = 0; id < p::kNumParams; ++id) {
    if (id == p::kThread || id == p::kGrain) continue;  // these are noise by what they are
    device.init(kRate);
    apply(smooth);
    device.note_on(1, note_hz(57.0f), 0.8f);
    render(device, 2.0f, kRate);
    const double before = corner(render(device, 0.3f, kRate), 0.0, 0.3);
    device.set_param(id, p::kParamMax[id]);
    const double up = corner(render(device, 0.3f, kRate), 0.0, 0.05);
    const double settled = corner(render(device, 1.0f, kRate), 0.7, 1.0);
    device.set_param(id, p::kParamMin[id]);
    const double down = corner(render(device, 0.3f, kRate), 0.0, 0.05);
    const double after = corner(render(device, 1.0f, kRate), 0.7, 1.0);
    const double normal = std::max(before, std::max(settled, after));
    HOLDS(up < 1.6 * normal && down < 1.6 * normal,
          "param %d thrown does not click (%.6f, %.6f against %.6f)", id, up, down, normal);
  }
  // A hand changed while a key is held is heard from the next key.
  device.init(kRate);
  apply(smooth);
  device.note_on(1, note_hz(57.0f), 0.8f);
  render(device, 2.0f, kRate);
  const double hum = corner(render(device, 0.3f, kRate), 0.0, 0.3);
  device.set_param(p::kHand, kRub);
  const double same = corner(render(device, 0.3f, kRate), 0.0, 0.3);
  device.note_off(1);
  render(device, 0.1f, kRate);
  device.set_param(p::kHand, kHum);
  device.note_on(2, note_hz(57.0f), 0.8f);  // in the release
  const double again = corner(render(device, 0.5f, kRate), 0.0, 0.5);
  HOLDS(same < 1.3 * hum && again < 1.6 * hum,
        "another hand, and a restrike in a release, do not click (%.6f %.6f against %.6f)", same, again, hum);
}

static void keys_and_ids() {
  // One id on A, B and A again, then one off: everything is let go.
  device.init(kRate);
  apply({{p::kDamp, 1.0f}, {p::kRing, 0.5f}});
  device.note_on(1, 220.0f, 0.8f);
  render(device, 0.2f, kRate);
  device.note_on(1, 330.0f, 0.8f);
  render(device, 0.2f, kRate);
  device.note_on(1, 220.0f, 0.8f);
  render(device, 0.2f, kRate);
  device.note_off(1);
  render(device, 4.0f, kRate);
  EXPECT(loudest(render(device, 0.5f, kRate)) == 0.0, "one id on A, B and A, then one off: exact silence");
  // An id that moves to another key lets its first drum go.
  device.init(kRate);
  apply({{p::kHand, kHum}, {p::kGrain, 0.0f}, {p::kScatter, 0.0f}, {p::kRoll, 0.0f}, {p::kDamp, 1.0f}, {p::kOtherSkin, 0.0f}});
  device.note_on(1, 220.0f, 0.8f);
  render(device, 0.3f, kRate);
  device.note_on(1, 330.0f, 0.8f);
  render(device, 2.5f, kRate);
  const Stereo moved = render(device, 0.5f, kRate);
  EXPECT(tone_level(moved.left, 330.0, kRate) > 30.0 * tone_level(moved.left, 220.0, kRate), "an id that moves lets its first drum go");
  device.note_off(1);
  render(device, 4.0f, kRate);
  // Two ids on one pitch are one drum, which the last of them lets go.
  device.note_on(1, 220.0f, 0.8f);
  device.note_on(2, 220.0f, 0.8f);
  device.note_off(1);
  render(device, 2.0f, kRate);
  EXPECT(rms(render(device, 0.5f, kRate).left) > 1.0e-3, "a drum two ids hold sounds until both have gone");
  device.note_off(2);
  render(device, 4.0f, kRate);
  EXPECT(loudest(render(device, 0.5f, kRate)) == 0.0, "and then it is silent");
  // Absurd notes.
  const float nan = std::nanf(""), inf = std::numeric_limits<float>::infinity();
  device.init(kRate);
  int id = 0;
  for (float hz : {0.0f, 5.0f, 20000.0f, -100.0f, nan, inf, -inf}) {
    for (float gain : {0.0f, 2.0f, nan, inf, -1.0f}) device.note_on(id++, hz, gain);
  }
  const Stereo absurd = render(device, 1.0f, kRate);
  EXPECT(finite(absurd.left) && finite(absurd.right) && loudest(absurd) <= 1.0, "absurd notes stay finite and bounded");
  for (int i = 0; i < id; ++i) device.note_off(i);
  render(device, 12.0f, kRate);
  EXPECT(loudest(render(device, 0.5f, kRate)) == 0.0, "and they end");
}

static void every_knob_while_sounding() {
  for (int hand = 0; hand < 7; ++hand) {
    device.init(kRate);
    device.set_param(p::kHand, static_cast<float>(hand));
    for (int i = 0; i < 5; ++i) device.note_on(i, note_hz(kChord[i]), 1.0f);
    render(device, 0.3f, kRate);
    for (int id = 1; id < p::kNumParams; ++id) {
      Stereo s;
      for (float share : {0.0f, 1.0f, 0.5f}) {
        device.set_param(id, p::kParamMin[id] + share * (p::kParamMax[id] - p::kParamMin[id]));
        s = concat(s, render(device, 0.06f, kRate));
      }
      device.set_param(id, p::kParamDefault[id]);
      HOLDS(finite(s.left) && finite(s.right) && loudest(s) < 1.0,
            "hand %d: param %d swept while it sounds stays bounded (%.2f)", hand, id, loudest(s));
    }
  }
}

static std::vector<float> score(int block, int hand) {
  device.init(kRate);
  apply({{p::kDamp, 1.0f}, {p::kRing, 0.3f}, {p::kHand, static_cast<float>(hand)}, {p::kThread, 0.6f}});
  std::vector<float> out;
  const auto go = [&](int blocks2048) {
    for (int b = 0; b < blocks2048 * 2048 / block; ++b) {
      device.process(block);
      for (int i = 0; i < block; ++i) out.push_back(device.out_left()[i] + 0.37f * device.out_right()[i]);
    }
  };
  for (int pass = 0; pass < 2; ++pass) {
    device.note_on(1, 220.0f, 0.8f);
    device.note_on(2, 277.0f, 0.6f);
    go(6);
    device.set_param(p::kPlace, 0.9f);
    device.set_param(p::kCavity, pass == 0 ? kKettle : kTube);
    go(6);
    device.note_off(1);
    device.note_off(2);
    go(100);  // long enough to sleep
    device.set_param(p::kTouch, 0.8f);
    go(1);
  }
  return out;
}

static void blocks_and_rates() {
  for (int hand = 0; hand < 7; ++hand) {
    const std::vector<float> one = score(1, hand), normal = score(128, hand), large = score(2048, hand);
    HOLDS(peak(normal, 108 * 2048, 111 * 2048) == 0.0, "hand %d sleeps between the two phrases", hand);
    HOLDS(one == normal && normal == large, "hand %d: blocks of 1, 128 and 2048 give one sound, across a silence", hand);
  }
  double level[3], pitch[3];
  const float rates[3] = {44100.0f, 48000.0f, 96000.0f};
  for (int i = 0; i < 3; ++i) {
    const Stereo s = note({}, 57.0f, 0.8f, 4.0f, 0.0f, rates[i]);
    level[i] = db(rms(s.left, at(0.5, rates[i])));
    pitch[i] = off_key(mono(s), note_hz(57.0f), 1.0, 4.0, rates[i]);
  }
  std::snprintf(label, sizeof label, "one drum at every rate (%.1f %.1f %.1f dB, %.2f %.2f %.2f cents)", level[0], level[1], level[2], pitch[0],
                pitch[1], pitch[2]);
  EXPECT(std::fabs(level[0] - level[1]) < 2.0 && std::fabs(level[2] - level[1]) < 2.0 && std::fabs(pitch[0]) < 3.0 && std::fabs(pitch[2]) < 3.0,
         label);
}

int main() {
  Conformance spec;
  spec.name = "Night Drum";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 12.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);
  in_tune_and_even();
  a_low_key_speaks();
  load_draws_the_ratios();
  the_bend_falls_back();
  hands_that_hold();
  hands_and_bodies_differ();
  place_touch_and_key_weight();
  every_knob_does_its_work();
  the_rest_of_the_drum();
  chords_stay_under_the_knee();
  no_clicks();
  keys_and_ids();
  every_knob_while_sounding();
  blocks_and_rates();
  device.init(kRate);
  for (int i = 0; i < 8; ++i) device.note_on(i, note_hz(45.0f + 4.0f * i), 0.8f);
  report_cost("Night Drum, eight held", 4.0f, kRate, [] { render(device, 4.0f, kRate); });
  return finish("Night Drum");
}
