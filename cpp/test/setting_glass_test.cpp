// Native harness for Setting Glass (cpp/devices/setting-glass). The
// conformance pass covers silence, stealing, parameter abuse and other sample
// rates; the rest measures what makes it glass that sets: a key clears from
// its highest tone down, a chord's high notes are clear before its low ones,
// a struck soft tone dies where a set one rings, its ratios stay where they
// are, heat is shared, the three ways of letting go, and the faults
// instruments have had before.

#include "../devices/setting-glass/setting_glass.h"
#include <limits>

#include "support/test_kit.h"

using namespace testkit;
using livemix::SettingGlass;
namespace p = livemix::setting_glass;

static SettingGlass device;
static const float kRate = 48000.0f;
static char label[240];
static const bool kTell = false;  // prints what every knob measures
#define CHECK(condition, ...)                          \
  do {                                                 \
    std::snprintf(label, sizeof label, __VA_ARGS__);   \
    EXPECT(condition, label);                          \
  } while (0)
struct Set {
  int id;
  float value;
};
static void set(std::initializer_list<Set> knobs) {
  for (const Set& knob : knobs) device.set_param(knob.id, knob.value);
}
static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }
static double loudest(const Stereo& s) { return std::max(peak(s.left), peak(s.right)); }
static float note_hz(float midi) { return 440.0f * std::exp2((midi - 69.0f) / 12.0f); }
static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }
static Stereo play(float hz, float gain, float seconds) {
  device.note_on(1, hz, gain);
  return render(device, seconds, kRate);
}
static std::vector<float> mono(const Stereo& s) {
  std::vector<float> m(s.size());
  for (size_t i = 0; i < m.size(); ++i) m[i] = 0.5f * (s.left[i] + s.right[i]);
  return m;
}

// Glass with nothing at work but its breath: what it does is its heat.
static void plain(SettingGlass& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kOrder, 1.0f);
  d.set_param(p::kBlows, 0.0f);
  d.set_param(p::kTicks, 0.0f);
  d.set_param(p::kRemelt, 0.0f);
  d.set_param(p::kNeighbours, 0.0f);
  d.set_param(p::kWidth, 0.0f);
  d.set_param(p::kStrike, SettingGlass::kDrop);
}

// When a partial has cleared: the first time, in windows of 0.2 s, its tone
// stands 16 dB over what lies beside it, and does in the next window too.
static double clear_time(const std::vector<float>& x, double hz, double beside) {
  const size_t window = at(0.2);
  int row = 0;
  for (size_t from = 0; from + window <= x.size(); from += at(0.1)) {
    const double tone = tone_level(x, hz, kRate, from, from + window);
    const double air = 0.5 * (tone_level(x, hz + beside, kRate, from, from + window) +
                              tone_level(x, hz - beside, kRate, from, from + window));
    row = tone > 6.3 * air && tone > 1.0e-5 ? row + 1 : 0;
    if (row == 3) return static_cast<double>(from) / kRate - 0.2;
  }
  return 99.0;
}

// Two keys held for `seconds` and struck as they are let go: how many dB the
// high (0) or the low (1) one's own note then loses in half a second.
static double loss_at(double seconds, int which) {
  plain(device);
  set({{p::kBreath, 0.0f}, {p::kCooling, 5.0f}, {p::kWhen, float(SettingGlass::kLetGo)}, {p::kTail, 20.0f}, {p::kRing, 20.0f}});
  device.note_on(1, 590.0f, which ? 0.0f : 0.8f);
  device.note_on(2, 110.0f, which ? 0.8f : 0.0f);
  render(device, static_cast<float>(seconds), kRate);
  device.note_off(1);
  device.note_off(2);
  const std::vector<float> x = mono(render(device, 0.7f, kRate));
  const double hz = which ? 110.0 : 590.0;
  return db(tone_level(x, hz, kRate, at(0.02), at(0.12))) - db(tone_level(x, hz, kRate, at(0.52), at(0.62)));
}

// The time a lone key's front, as the meter tells it, takes to pass hz.
static double front_passes(SettingGlass& d, float hz, float limit = 30.0f) {
  for (float t = 0.0f; t < limit; t += 0.02f) {
    d.process(960);
    if (d.meter(SettingGlass::kMeterFront) < hz) return t;
  }
  return limit;
}
static void clearing() {
  plain(device);
  set({{p::kHeat, 0.9f}, {p::kCooling, 4.0f}, {p::kBreath, 1.0f}});
  const std::vector<float> x = mono(play(147.0f, 0.8f, 6.0f));
  double last = -1.0;
  const int partials[] = {32, 16, 8, 4};
  for (int i = 0; i < 4; ++i) {
    const double t = clear_time(x, 147.0 * partials[i], 45.0);
    CHECK(t > last + 0.15 && t < 5.5, "partial %d clears after those above it (%.2f s after %.2f s)", partials[i], t, last);
    last = t;
  }
  // Two keys together: the upper one's own note rings well before the lower one's.
  double rings[2] = {99.0, 99.0};
  for (double t = 0.5; t < 7.0; t += 1.0) {
    for (int k = 0; k < 2; ++k) {
      if (rings[k] > 90.0 && loss_at(t, k) < 14.0) rings[k] = t;
    }
  }
  CHECK(rings[0] > 0.6 && rings[0] + 0.9 < rings[1] && rings[1] < 6.5, "a chord's high note rings from %.1f s, its low one from %.1f s", rings[0], rings[1]);
  // Cooling is the time it takes.
  double took[2];
  for (int i = 0; i < 2; ++i) {
    plain(device);
    set({{p::kHeat, 0.85f}, {p::kWhen, float(SettingGlass::kLetGo)}, {p::kCooling, i ? 6.0f : 2.0f}});
    device.note_on(1, 220.0f, 0.7f);
    took[i] = front_passes(device, 220.0f);
  }
  CHECK(took[0] > 0.5 && took[0] < 2.5 && took[1] / took[0] > 2.7 && took[1] / took[0] < 3.3, "three times the Cooling takes three times as long (%.2f s, %.2f s)", took[0], took[1]);
  // Rest stops it partway: the top has cleared and the note has not.
  plain(device);
  set({{p::kRest, 0.5f}, {p::kCooling, 0.5f}, {p::kBreath, 1.0f}});
  play(147.0f, 0.8f, 6.0f);
  const float front = device.meter(SettingGlass::kMeterFront);
  CHECK(front > 400.0f && front < 4000.0f, "Rest holds the front above the note (%.0f Hz)", front);
  const std::vector<float> held = mono(render(device, 2.0f, kRate));
  EXPECT(tone_level(held, 147.0, kRate, 0, at(2.0)) < 4.0 * tone_level(held, 150.5, kRate, 0, at(2.0)), "Rest keeps the note itself soft");
  EXPECT(clear_time(held, 147.0 * 32, 60.0) < 0.5, "and the top is set");
}

// The quietest quarter of a stretch, in windows of 50 ms.
static double between(const std::vector<float>& x, double from, double to) {
  std::vector<double> level;
  for (double t = from; t < to; t += 0.05) level.push_back(rms(x, at(t), at(t + 0.05)));
  std::sort(level.begin(), level.end());
  return level[level.size() / 4];
}
static void ringing() {
  // Set glass rings for its Ring; soft glass is dead in a third of a second.
  for (int pass = 0; pass < 2; ++pass) {
    plain(device);
    set({{p::kHeat, pass ? 1.0f : 0.0f}, {p::kRest, pass ? 1.0f : 0.0f}, {p::kBreath, 0.0f}, {p::kRing, 7.0f}});
    const std::vector<float> x = mono(play(400.0f, 0.8f, 4.0f));
    const double early = tone_level(x, 400.0, kRate, at(0.02), at(0.1));
    const double later = tone_level(x, 400.0, kRate, at(0.5), at(0.6));
    const double drop = db(early) - db(later);
    CHECK(pass ? drop > 35.0 : drop < 14.0, "a struck tone loses %.1f dB in half a second, %s", drop, pass ? "soft" : "set");
  }
  // Struck again while it sets: each blow rings longer than the one before.
  plain(device);
  set({{p::kBreath, 0.0f}, {p::kBlows, 1.0f}, {p::kTurn, 1.0f}, {p::kCooling, 5.0f}});
  const std::vector<float> x = mono(play(147.0f, 0.8f, 7.0f));
  const double first = between(x, 0.5, 2.5), then = between(x, 4.5, 6.5);
  CHECK(db(then) > db(first) + 8.0, "the blows fill the time between them as it sets (%.1f dB then %.1f dB)", db(first), db(then));
  // Ring.
  double t60[2];
  for (int i = 0; i < 2; ++i) {
    plain(device);
    set({{p::kHeat, 0.0f}, {p::kBreath, 0.0f}, {p::kStrike, float(SettingGlass::kDrop)}, {p::kRing, i ? 8.0f : 2.0f}});
    device.note_on(1, 200.0f, 0.8f);
    t60[i] = rt60(render(device, 4.0f, kRate).left, kRate, 0.8);
  }
  CHECK(t60[0] > 1.4 && t60[0] < 2.6 && t60[1] > 5.5 && t60[1] < 10.0, "Ring is the ring (%.2f s, %.2f s)", t60[0], t60[1]);
}

// The strongest pitch within `span` cents of hz over n samples from `from`.
static double pitch_near(const std::vector<float>& x, double hz, double span, size_t from, size_t n) {
  double best = -1.0, found = hz;
  for (double c = -span; c <= span; c += span / 24.0) {
    const double level = tone_level(x, hz * std::exp2(c / 1200.0), kRate, from, from + n);
    if (level > best) found = hz * std::exp2(c / 1200.0);
    best = std::max(best, level);
  }
  return found;
}
static void tuning() {
  for (float midi : {36.0f, 50.0f, 62.0f, 74.0f, 84.0f}) {
    plain(device);
    device.set_param(p::kHeat, 0.0f);
    const std::vector<float> x = mono(play(note_hz(midi), 0.7f, 5.0f));
    const double hz = note_hz(midi);
    for (int h = 1; h <= 3; ++h) {
      const double found = pitch_near(x, h * hz, 12.0, at(1.0), at(2.0));
      CHECK(std::fabs(cents(found, h * hz)) < 3.0, "key %.0f partial %d is %.2f cents off", midi, h, cents(found, h * hz));
    }
  }
  // Ratios do not move: the twelfth, cleared halfway through, stays put.
  plain(device);
  set({{p::kOrder, 0.5f}, {p::kCooling, 4.0f}});
  const std::vector<float> x = mono(play(220.0f, 0.8f, 9.0f));
  const double early = pitch_near(x, 660.0, 72.0, at(2.5), at(2.0));
  const double late = pitch_near(x, 660.0, 72.0, at(6.5), at(2.0));
  CHECK(std::fabs(cents(early, late)) < 4.0, "a partial keeps its pitch while the rest sets (%.2f Hz, %.2f Hz)", early, late);
  CHECK(std::fabs(cents(late, 660.0)) > 8.0, "Order scatters it (%.1f cents)", cents(late, 660.0));
}
static void moments() {
  // Where the strike falls, by the level just after each moment.
  double level[4][3];
  for (int when = 0; when < 4; ++when) {
    plain(device);
    set({{p::kWhen, static_cast<float>(when)}, {p::kBreath, 0.0f}, {p::kHeat, 0.6f}, {p::kCooling, 1.5f}, {p::kRing, 2.0f},
         {p::kEdge, 0.9f}});
    const std::vector<float> x = mono(play(220.0f, 0.8f, 4.0f));
    device.note_off(1);
    const std::vector<float> y = mono(render(device, 1.0f, kRate));
    level[when][0] = peak(x, 0, at(0.1));
    level[when][1] = peak(x, at(0.3), at(3.0));
    level[when][2] = peak(y, 0, at(0.1));
  }
  EXPECT(level[0][0] > 4.0 * level[1][0] && level[0][0] > 4.0 * level[2][0], "Press strikes at the press and the others do not");
  EXPECT(level[3][0] > 0.9 * level[0][0], "Both strikes at the press");
  EXPECT(level[1][1] > 3.0 * level[2][1], "Set strikes when it has set");
  EXPECT(level[2][2] > 4.0 * level[0][2] && level[3][2] > 2.0 * level[0][2], "Release and Both strike at the end");
}
static void shared_heat() {
  // Several keys hold their heat longer with Neighbours, and a lone key is as it was.
  double took[2][2];
  for (int n = 0; n < 2; ++n) {
    for (int many = 0; many < 2; ++many) {
      plain(device);
      device.set_param(p::kNeighbours, n ? 1.0f : 0.0f);
      if (many) {
        for (int k = 0; k < 4; ++k) device.note_on(10 + k, 330.0f + 50.0f * k, 0.5f);
      }
      device.note_on(1, 220.0f, 0.7f);
      took[n][many] = front_passes(device, 220.0f);
    }
  }
  CHECK(took[1][1] > 1.5 * took[1][0] && std::fabs(took[1][0] - took[0][0]) < 0.03, "Neighbours: a chord sets in %.2f s, a key in %.2f s", took[1][1], took[1][0]);
  EXPECT(std::fabs(took[0][1] - took[0][0]) < 0.03, "without it each key sets by itself");
  // Visits to the fire bring the front back up.
  plain(device);
  set({{p::kRemelt, 0.8f}, {p::kEvery, 2.0f}, {p::kCooling, 0.6f}});
  device.note_on(1, 220.0f, 0.7f);
  int visits = 0;
  bool up = true;
  for (int i = 0; i < 600; ++i) {
    device.process(960);
    const bool hot = device.meter(SettingGlass::kMeterFront) > 300.0f;
    visits += hot && !up ? 1 : 0;
    up = hot;
  }
  CHECK(visits >= 4 && visits <= 7, "twelve seconds hold five or six visits to the fire (%d)", visits);
  // The same key struck again is warmed and is the same piece of glass.
  plain(device);
  device.set_param(p::kCooling, 1.0f);
  play(220.0f, 0.7f, 3.0f);
  const float cold = device.meter(SettingGlass::kMeterHeat);
  play(220.0f, 0.7f, 0.15f);
  EXPECT(cold < 0.05f && device.meter(SettingGlass::kMeterHeat) > 0.3f, "a key struck again warms its glass");
}
static void letting_go() {
  // Quench is soon over, Anneal rings evenly, Remelt leaves the top till last.
  double low[3], high[3];
  for (int way = 0; way < 3; ++way) {
    plain(device);
    set({{p::kRelease, static_cast<float>(way)}, {p::kHeat, 0.0f}, {p::kTail, 4.0f}, {p::kBright, 0.7f}});
    const std::vector<float> x = mono(play(220.0f, 0.8f, 3.0f));
    device.note_off(1);
    const std::vector<float> y = mono(render(device, 1.6f, kRate));
    low[way] = db(tone_level(y, 220.0, kRate, at(1.0), at(1.5))) - db(tone_level(x, 220.0, kRate, at(2.0), at(2.9)));
    high[way] = db(tone_level(y, 220.0 * 16, kRate, at(1.0), at(1.5))) - db(tone_level(x, 220.0 * 16, kRate, at(2.0), at(2.9)));
  }
  CHECK(low[0] < low[1] - 15.0, "Quench %.1f dB, Anneal %.1f dB after a second", low[0], low[1]);
  CHECK(high[2] > low[2] + 15.0 && high[2] > high[1] + 6.0, "Remelt: the note is down %.1f dB, the top %.1f dB", low[2], high[2]);
}
static void touch_and_level() {
  double centre[2];
  for (int hard = 0; hard < 2; ++hard) {
    device.init(kRate);
    device.set_param(p::kHeat, 0.0f);
    device.note_on(1, 220.0f, hard ? 1.0f : 0.3f);
    centre[hard] = energy_above(render(device, 1.5f, kRate).left, 1200.0, kRate);
  }
  CHECK(centre[1] > 1.4 * centre[0], "a hard touch is brighter (%.4f, %.4f)", centre[0], centre[1]);
  double least = 99.0, most = -99.0;
  for (float midi : {36.0f, 48.0f, 60.0f, 72.0f, 84.0f}) {
    device.init(kRate);
    device.note_on(1, note_hz(midi), 0.7f);
    const double top = db(loudest(render(device, 4.0f, kRate)));
    CHECK(top > -24.0 && top < -10.0, "key %.0f peaks at %.1f dBFS", midi, top);
    least = std::min(least, top);
    most = std::max(most, top);
  }
  EXPECT(most - least < 5.0, "one level from C2 to C6");
  device.init(kRate);
  int id = 1;
  for (float midi : {45.0f, 48.0f, 52.0f, 55.0f, 59.0f, 62.0f, 65.0f, 69.0f, 72.0f, 76.0f}) device.note_on(id++, note_hz(midi), 1.0f);
  const double ten = loudest(render(device, 5.0f, kRate));
  CHECK(ten < 0.5, "ten hard keys stay under the clip's knee (%.3f)", ten);
  // Level and spectrum hold across sample rates.
  double at_rate[3];
  int r = 0;
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    device.init(rate);
    device.note_on(1, 147.0f, 0.7f);
    device.note_on(2, 440.0f, 0.7f);
    at_rate[r++] = db(rms(render(device, 8.0f, rate).left));
  }
  CHECK(std::fabs(at_rate[0] - at_rate[1]) < 2.0 && std::fabs(at_rate[2] - at_rate[1]) < 2.0, "one level at every rate (%.1f, %.1f, %.1f dB)", at_rate[0], at_rate[1], at_rate[2]);
  device.init(kRate);
  set({{p::kWidth, 0.0f}, {p::kBreath, 0.0f}});
  const Stereo narrow = play(220.0f, 0.7f, 1.0f);
  EXPECT(narrow.left == narrow.right, "Width at zero is mono");
}

// The largest second difference of both sides over a stretch.
static double bend(const Stereo& s, size_t from, size_t to) {
  double worst = 0.0;
  for (const std::vector<float>* x : {&s.left, &s.right}) {
    for (size_t i = from + 2; i < to && i < x->size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>((*x)[i]) - 2.0 * (*x)[i - 1] + (*x)[i - 2]));
    }
  }
  return worst;
}

// The same over a stretch with the last of what was before it, so that a step on its first sample counts.
static double bend_into(const Stereo& before, const Stereo& after) {
  return bend(concat(before, after), before.size() - 2, before.size() + after.size());
}

static void no_clicks() {
  // Every knob thrown from end to end under a chord that only sings.
  for (int knob = 0; knob < p::kNumParams; ++knob) {
    if (knob == p::kVolume) continue;
    for (int way = 0; way < 2; ++way) {
      plain(device);
      set({{p::kHeat, 0.0f}, {p::kWidth, 0.6f}, {p::kStrike, float(SettingGlass::kDrop)}});
      device.set_param(knob, way ? p::kParamMax[knob] : p::kParamMin[knob]);
      if (knob != p::kBlows && knob != p::kTurn) device.set_param(p::kTurn, 0.2f);
      for (int k = 0; k < 3; ++k) device.note_on(k + 1, 147.0f * (1.0f + 0.5f * k), 0.6f);
      render(device, 0.9f, kRate);
      const Stereo before = render(device, 0.4f, kRate);
      device.set_param(knob, way ? p::kParamMin[knob] : p::kParamMax[knob]);
      const Stereo after = render(device, 0.05f, kRate);
      render(device, 0.3f, kRate);
      const Stereo settled = render(device, 0.4f, kRate);
      const double reference = std::max(std::max(bend(before, 0, before.size()), bend(settled, 0, settled.size())), 2.0e-4);
      const double seen = bend_into(before, after);
      CHECK(seen < 2.6 * reference, "knob %d thrown %s is no click (%.5f against %.5f)", knob, way ? "down" : "up", seen, reference);
    }
  }
  // Low pure tones show a corner that bright ones hide: a steal's fade and the knobs that only scale or place.
  const auto dark = [](int keys) {
    plain(device);
    set({{p::kHeat, 0.0f}, {p::kBreath, 0.0f}, {p::kBright, 0.0f}, {p::kRing, 30.0f}, {p::kWidth, 0.5f}});
    for (int k = 0; k < keys; ++k) device.note_on(k + 1, note_hz(33.0f + 2.0f * k), 0.7f);
    return render(device, 2.5f, kRate);
  };
  const Stereo full = dark(SettingGlass::kMaxVoices);
  device.note_on(99, 50.0f, 0.0f);
  const Stereo stolen = render(device, 0.05f, kRate);
  CHECK(bend_into(full, stolen) < 0.004 * loudest(stolen), "a steal is a fade (%.6f of %.3f)", bend_into(full, stolen), loudest(stolen));
  for (int knob : {static_cast<int>(p::kWidth), static_cast<int>(p::kVolume), static_cast<int>(p::kEdge), static_cast<int>(p::kRing), static_cast<int>(p::kRelease)}) {
    for (int way = 0; way < 2; ++way) {
      dark(4);
      device.set_param(knob, way ? p::kParamMax[knob] : p::kParamMin[knob]);
      render(device, 0.5f, kRate);
      const Stereo early = render(device, 0.2f, kRate);
      const double before = bend(early, 0, early.size());
      device.set_param(knob, way ? p::kParamMin[knob] : p::kParamMax[knob]);
      const double seen = bend_into(early, render(device, 0.1f, kRate));
      const double after = bend(render(device, 0.2f, kRate), 0, at(0.2));
      CHECK(seen < 2.0 * std::max(before, after) + 2.0e-4, "knob %d thrown on low tones is no click (%.6f against %.6f)", knob, seen, std::max(before, after));
    }
  }
}

// How far two renders are apart: the levels of six bands in quarter seconds, dB.
static std::vector<double> print(const Stereo& s) {
  std::vector<double> out;
  std::vector<float> rest = mono(s);
  for (double hz : {200.0, 500.0, 1200.0, 3000.0, 6000.0}) {
    const float a = static_cast<float>(1.0 - std::exp(-6.2832 * hz / kRate));
    float y = 0.0f, z = 0.0f;
    std::vector<float> low(rest.size());
    for (size_t i = 0; i < rest.size(); ++i) {
      y += a * (rest[i] - y);
      z += a * (y - z);
      low[i] = z;
      rest[i] -= z;
    }
    for (size_t from = 0; from + at(0.25) <= low.size(); from += at(0.25)) out.push_back(std::max(db(rms(low, from, from + at(0.25))), -80.0));
  }
  for (size_t i = 0; i < s.size(); ++i) rest[i] = s.left[i] - s.right[i];
  for (size_t from = 0; from + at(0.5) <= rest.size(); from += at(0.5)) out.push_back(std::max(db(rms(rest, from, from + at(0.5))), -80.0));
  return out;
}
static double apart(const std::vector<double>& a, const std::vector<double>& b) {
  double sum = 0.0;
  for (size_t i = 0; i < a.size(); ++i) sum += std::fabs(a[i] - b[i]);
  return sum / static_cast<double>(a.size());
}
static void every_knob() {
  // On one chord, held and let go: each knob's ends and each two choices are different sounds.
  const auto sound = [](int knob, float value) {
    device.init(kRate);
    set({{p::kCooling, 1.2f}, {knob, value}});
    for (int k = 0; k < 3; ++k) device.note_on(k + 1, note_hz(50.0f + 7.0f * k), 0.7f);
    Stereo x = render(device, 3.0f, kRate);
    for (int k = 0; k < 3; ++k) device.note_off(k + 1);
    return print(concat(x, render(device, 2.0f, kRate)));
  };
  for (int knob = 0; knob < p::kVolume; ++knob) {
    const int choices = knob == p::kMatter ? 6 : (knob == p::kStrike || knob == p::kWhen ? 4 : (knob == p::kRelease ? 3 : 0));
    std::vector<std::vector<double>> prints;
    for (int i = 0; i < (choices ? choices : 2); ++i) prints.push_back(sound(knob, choices ? static_cast<float>(i) : (i ? p::kParamMax[knob] : p::kParamMin[knob])));
    for (size_t a = 0; a < prints.size(); ++a) {
      for (size_t b = 0; b < a; ++b) {
        const double far = apart(prints[a], prints[b]);
        CHECK(far > (choices ? 2.5 : 1.4), "knob %d, %d and %d are %.2f dB apart", knob, int(a), int(b), far);
        if (kTell) std::printf("knob %d, %d and %d: %.2f\n", knob, int(a), int(b), far);
      }
    }
  }
  // Turn is how often the blows come: ten seconds of short dull ones, counted.
  int came[2];
  for (int fast = 0; fast < 2; ++fast) {
    plain(device);
    set({{p::kHeat, 0.0f}, {p::kBreath, 0.0f}, {p::kRing, 0.3f}, {p::kBlows, 1.0f}, {p::kTurn, fast ? 2.0f : 0.8f}, {p::kStrike, float(SettingGlass::kTap)}});
    const std::vector<float> x = mono(play(330.0f, 0.8f, 10.0f));
    came[fast] = 0;
    double last = 0.0;
    for (size_t from = 0; from + at(0.05) <= x.size(); from += at(0.05)) {
      const double now = rms(x, from, from + at(0.05));
      came[fast] += now > 3.0 * last && now > 2.0e-3 ? 1 : 0;
      last = now;
    }
  }
  CHECK(came[0] >= 6 && came[0] <= 11 && came[1] >= 16 && came[1] <= 25, "blows come %d and %d times in ten seconds", came[0], came[1]);
  // Order at the bottom leaves tones out.
  double whole = 0.0, less = 0.0;
  for (int i = 0; i < 2; ++i) {
    plain(device);
    set({{p::kHeat, 0.0f}, {p::kOrder, i ? 0.0f : 1.0f}, {p::kBreath, 0.0f}, {p::kBright, 1.0f}});
    const Stereo x = play(220.0f, 0.8f, 1.0f);
    (i ? less : whole) = energy_above(x.left, 600.0, kRate);
  }
  CHECK(less < 0.88 * whole, "Order leaves tones out (%.4f of %.4f)", less, whole);
}

static void faults() {
  // Keys A, B, A under one id, then one release.
  device.init(kRate);
  device.set_param(p::kTail, 0.3f);
  for (float hz : {220.0f, 330.0f, 220.0f}) {
    device.note_on(7, hz, 0.7f);
    render(device, 0.2f, kRate);
  }
  device.note_off(7);
  render(device, 6.0f, kRate);
  EXPECT(loudest(render(device, 0.5f, kRate)) == 0.0, "A, B, A and one release leaves nothing held");
  // A full pool, a key struck twice inside the steal's fade, everything let go.
  device.init(kRate);
  device.set_param(p::kTail, 0.3f);
  for (int k = 0; k < SettingGlass::kMaxVoices; ++k) device.note_on(k + 1, note_hz(40.0f + 3.0f * k), 0.7f);
  render(device, 0.3f, kRate);
  for (float hz : {1000.0f, 1000.0f, 1100.0f}) device.note_on(50, hz, 0.7f);
  device.note_off(50);
  for (int k = 0; k < SettingGlass::kMaxVoices; ++k) device.note_off(k + 1);
  render(device, 6.0f, kRate);
  EXPECT(loudest(render(device, 0.5f, kRate)) == 0.0, "a press inside a steal leaves nothing held");
  // Absurd notes.
  const float kInf = std::numeric_limits<float>::infinity();
  device.init(kRate);
  for (float hz : {0.0f, 5.0f, -100.0f, 20000.0f, kInf, -kInf, std::nanf("")}) {
    for (float gain : {0.0f, 2.0f, -1.0f, kInf, std::nanf("")}) {
      device.note_on(3, hz, gain);
      const Stereo x = render(device, 0.05f, kRate);
      EXPECT(finite(x.left) && finite(x.right) && loudest(x) < 1.01, "absurd notes stay finite and bounded");
    }
  }
  // Block sizes across a silence that is slept through.
  Stereo reference;
  for (int block : {128, 1, 2048}) {
    device.init(kRate);
    set({{p::kTail, 0.3f}, {p::kTurn, 5.0f}});
    Stereo out;
    for (int pass = 0; pass < 2; ++pass) {
      device.note_on(1, 220.0f, 0.8f);
      device.note_on(2, 277.0f, 0.8f);
      out = pass ? concat(out, run(device, std::vector<float>(61411, 0.0f), block)) : run(device, std::vector<float>(61411, 0.0f), block);
      device.note_off(1);
      device.note_off(2);
      out = concat(out, run(device, std::vector<float>(204793, 0.0f), block));
      set({{p::kBright, 0.8f}, {p::kWidth, 1.0f}});
    }
    if (block == 128) reference = out;
    CHECK(out.left == reference.left && out.right == reference.right, "blocks of %d give the same sound across a silence", block);
  }
  // Held long, the level neither creeps nor fades.
  device.init(kRate);
  device.set_param(p::kRing, 30.0f);
  for (int k = 0; k < 4; ++k) device.note_on(k + 1, 147.0f + 60.0f * k, 0.8f);
  render(device, 12.0f, kRate);
  const double early = rms(render(device, 8.0f, kRate).left);
  render(device, 20.0f, kRate, 2048);
  const double late = rms(render(device, 8.0f, kRate).left);
  CHECK(std::fabs(db(early) - db(late)) < 4.0, "a long hold keeps its level (%.1f dB, %.1f dB)", db(early), db(late));
  // Everything thrown about while it sounds.
  device.init(kRate);
  rng_state() = 0x77u;
  bool good = true;
  for (int i = 0; i < 400; ++i) {
    const int knob = (i * 7) % p::kNumParams;
    device.set_param(knob, p::kParamMin[knob] + (0.5f + 0.5f * white()) * (p::kParamMax[knob] - p::kParamMin[knob]));
    if (i % 5 == 0) device.note_on(i % 17, note_hz(36.0f + static_cast<float>((i * 11) % 60)), 0.8f);
    if (i % 5 == 3) device.note_off(i % 17);
    const Stereo x = render(device, 0.03f, kRate);
    good = good && finite(x.left) && finite(x.right) && loudest(x) < 1.01;
  }
  EXPECT(good, "every knob thrown while keys come and go stays finite and bounded");
}

// What was found wrong in it once, and what its newer laws promise.
static double level_db(const Stereo& s, double from, double to) { return db(rms(s.left, at(from), at(to))); }
static void found_once() {
  // Noise into the glass is as loud at every rate.
  double air[2][2];
  for (int strike = 0; strike < 2; ++strike) {
    for (int fast = 0; fast < 2; ++fast) {
      const float rate = fast ? 176400.0f : 44100.0f;
      plain(device, rate);
      set({{p::kHeat, 1.0f}, {p::kRest, 1.0f}, {p::kBreath, strike ? 0.0f : 1.0f}, {p::kTurn, 1.0f}});
      if (strike) set({{p::kStrike, float(SettingGlass::kPour)}, {p::kBlows, 1.0f}});
      for (int k = 0; k < 6; ++k) device.note_on(k + 1, 150.0f + 60.0f * k, 0.7f);
      air[strike][fast] = db(rms(render(device, 6.0f, rate).left));
    }
    CHECK(std::fabs(air[strike][1] - air[strike][0]) < 1.6, "%s is as loud at four times the rate (%.1f, %.1f dB)", strike ? "a pour" : "the breath", air[strike][0], air[strike][1]);
  }
  // Pours poured over each other do not add up without end.
  plain(device);
  set({{p::kStrike, float(SettingGlass::kPour)}, {p::kWhen, float(SettingGlass::kSet)}, {p::kRemelt, 0.8f}, {p::kEvery, 0.5f}, {p::kHeat, 0.5f}, {p::kCooling, 0.3f}, {p::kMatter, float(p::kObsidian)}, {p::kRing, 1.0f}, {p::kEdge, 0.7f}});
  for (int k = 0; k < 5; ++k) device.note_on(k + 1, note_hz(50.0f + 5.0f * k), 0.7f);
  const Stereo pours = render(device, 12.0f, kRate);
  CHECK(loudest(pours) < 0.6 && level_db(pours, 8.0, 12.0) < level_db(pours, 2.0, 6.0) + 3.0, "pour upon pour stays a pour (%.3f)", loudest(pours));
  // Ticks that come thick are each smaller.
  plain(device);
  set({{p::kTicks, 1.0f}, {p::kRemelt, 0.8f}, {p::kEvery, 0.6f}, {p::kRing, 25.0f}, {p::kBreath, 0.0f}, {p::kCooling, 0.4f}});
  for (int k = 0; k < 5; ++k) device.note_on(k + 1, note_hz(50.0f + 5.0f * k), 0.7f);
  const double thick = loudest(render(device, 8.0f, kRate));
  CHECK(thick < 0.55, "thick ticks stay near the knee (%.3f)", thick);
  // Blows go on after the strike that ends a hold, and die away.
  for (int blows = 0; blows < 2; ++blows) {
    plain(device);
    set({{p::kWhen, float(SettingGlass::kLetGo)}, {p::kHeat, 0.0f}, {p::kBreath, 0.0f}, {p::kTurn, 2.0f}, {p::kTail, 6.0f}, {p::kRing, 0.6f}, {p::kBlows, blows ? 1.0f : 0.0f}});
    play(220.0f, 0.8f, 1.0f);
    device.note_off(1);
    const Stereo x = render(device, 9.0f, kRate);
    const double after = peak(x.left, at(0.9), at(2.5)), late = peak(x.left, at(8.0), at(9.0));
    CHECK(blows ? after > 0.01 && late < 0.02 * after : after < 0.004, "Blows %d after the end: %.4f, later %.5f", blows, after, late);
  }
  // Order takes tones away and moves the rest; Stretch moves them either way.
  double third[3];
  for (int i = 0; i < 3; ++i) {
    plain(device);
    set({{p::kHeat, 0.0f}, {p::kStretch, float(i - 1)}});
    third[i] = pitch_near(mono(play(220.0f, 0.8f, 3.0f)), 660.0 * std::exp2((i - 1) * 0.25 * std::log2(3.0)), 60.0, at(1.0), at(1.5));
  }
  CHECK(third[0] < 520.0 && std::fabs(cents(third[1], 660.0)) < 3.0 && third[2] > 850.0, "Stretch draws the twelfth to %.0f, %.0f and %.0f Hz", third[0], third[1], third[2]);
  // Glass that melts as it is let go: the lowest falls first and the rest after it.
  double falls[2];
  plain(device);
  set({{p::kRelease, float(SettingGlass::kRemelted)}, {p::kHeat, 0.0f}, {p::kBreath, 0.0f}, {p::kTail, 4.0f}, {p::kRing, 0.4f}, {p::kEdge, 0.0f}});
  play(150.0f, 0.8f, 2.5f);
  device.note_off(1);
  const std::vector<float> fall = mono(render(device, 5.0f, kRate));
  for (int i = 0; i < 2; ++i) {
    double best = 0.0;
    for (double t = 0.0; t < 4.8; t += 0.02) {
      const double level = tone_level(fall, 150.0 * (i ? 16 : 1), kRate, at(t), at(t + 0.06));
      if (level > best) falls[i] = t;
      best = std::max(best, level);
    }
    CHECK(best > 2.0e-4, "a tone is heard as it melts (%.5f)", best);
  }
  CHECK(falls[1] > falls[0] + 0.5, "the low tone falls at %.2f s, the high one at %.2f s", falls[0], falls[1]);
  // A strike on one piece shakes a set one beside it, as far as Neighbours says.
  double shaken[2];
  for (int n = 0; n < 2; ++n) {
    plain(device);
    set({{p::kHeat, 0.0f}, {p::kBreath, 0.0f}, {p::kNeighbours, float(n)}, {p::kRing, 0.5f}});
    play(330.0f, 0.8f, 3.0f);
    device.note_on(2, 2000.0f, 0.8f);
    const std::vector<float> x = mono(render(device, 0.3f, kRate));
    shaken[n] = tone_level(x, 330.0, kRate, at(0.02), at(0.2));
  }
  CHECK(shaken[1] > 3.0 * shaken[0], "a strike shakes its neighbour (%.5f against %.5f)", shaken[1], shaken[0]);
  // A narrow edge clears one tone after another, a wide one many together.
  double apart[2];
  for (int wide = 0; wide < 2; ++wide) {
    plain(device);
    set({{p::kHeat, 0.9f}, {p::kCooling, 4.0f}, {p::kBreath, 1.0f}, {p::kEdge, wide ? 1.0f : 0.0f}});
    const std::vector<float> x = mono(play(147.0f, 0.8f, 7.0f));
    apart[wide] = clear_time(x, 147.0 * 4, 45.0) - clear_time(x, 147.0 * 8, 45.0);
  }
  CHECK(apart[0] > 1.4 * apart[1] && apart[1] > 0.0, "a narrow edge keeps two tones %.2f s apart, a wide one %.2f s", apart[0], apart[1]);
}

int main() {
  Conformance spec;
  spec.name = "setting-glass", spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin, spec.maxs = p::kParamMax, spec.defaults = p::kParamDefault;
  spec.tail_seconds = 12.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  for (void (*part)() : {clearing, ringing, tuning, moments, shared_heat, letting_go, touch_and_level, found_once, no_clicks, every_knob, faults}) part();

  device.init(kRate);
  for (int k = 0; k < 8; ++k) device.note_on(k + 1, note_hz(45.0f + 4.0f * k), 0.7f);
  report_cost("setting-glass", 10.0f, kRate, [] { render(device, 10.0f, kRate); });
  return finish("setting-glass");
}
