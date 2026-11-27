// Native harness for Chord Clock (cpp/devices/chord-clock). The conformance
// pass covers silence, stealing, parameter abuse and other sample rates; the
// rest measures the idea: pitch and pulse are one clock, ratios are exact, the
// pattern returns, a key quickens, stairs double, and a key let go runs down.

#include "../devices/chord-clock/chord_clock.h"

#include <ctime>
#include <limits>

#include "support/test_kit.h"

using namespace testkit;
using livemix::ChordClock;
namespace p = livemix::chord_clock;

static ChordClock device;
static const float kRate = 48000.0f;
static char label[240];

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }
static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }
static float note_hz(float midi) { return 440.0f * std::exp2((midi - 69.0f) / 12.0f); }
static double loudest(const Stereo& s) { return std::max(peak(s.left), peak(s.right)); }
static const int kChord[5] = {50, 57, 65, 72, 76};

struct Knob {
  int id;
  float value;
};
static void patch(const std::vector<Knob>& knobs, float rate = kRate) {
  device.init(rate);
  for (const Knob& knob : knobs) device.set_param(knob.id, knob.value);
}
static std::vector<Knob> with(std::vector<Knob> knobs, std::initializer_list<Knob> more) {
  knobs.insert(knobs.end(), more);
  return knobs;
}
static void hold_chord(float gain = 0.7f) {
  for (int i = 0; i < 5; ++i) device.note_on(i + 1, note_hz(static_cast<float>(kChord[i])), gain);
}
static Stereo played(const std::vector<Knob>& knobs, std::initializer_list<int> keys, float gain, float seconds) {
  patch(knobs);
  int id = 0;
  for (int key : keys) device.note_on(++id, note_hz(static_cast<float>(key)), gain);
  return render(device, seconds, kRate);
}
static Stereo chord(const std::vector<Knob>& knobs, float seconds, float rate = kRate) {
  patch(knobs, rate); hold_chord();
  return render(device, seconds, rate);
}
// Only pulses: dry narrow taps, nothing that quickens after half a second.
static std::vector<Knob> taps(float slowness) {
  return {{p::kTone, 0.0f},  {p::kRhythm, 1.0f},  {p::kSlowness, slowness}, {p::kQuicken, 0.3f},
          {p::kDamping, 1.0f}, {p::kPulseWidth, 0.3f}, {p::kAccent, 0.0f},     {p::kWidth, 0.0f}};
}

// Where pulses start: the level of 2 ms windows rising past half of the loudest.
static std::vector<double> onsets(const std::vector<float>& x, double rate, double share = 0.3) {
  const size_t hop = static_cast<size_t>(0.002 * rate);
  std::vector<double> level, out;
  for (size_t i = 0; i + hop <= x.size(); i += hop) level.push_back(rms(x, i, i + hop));
  const double top = *std::max_element(level.begin(), level.end());
  bool armed = true;
  for (size_t i = 0; i < level.size(); ++i) {
    if (armed && level[i] > share * top) {
      out.push_back(static_cast<double>(i * hop) / rate);
      armed = false;
    } else if (level[i] < 0.5 * share * top) {
      armed = true;
    }
  }
  return out;
}
static std::vector<double> after(std::vector<double> times, double from) {
  times.erase(std::remove_if(times.begin(), times.end(), [from](double t) { return t < from; }), times.end());
  return times;
}
static int between(const std::vector<double>& times, double from, double to) {
  int count = 0;
  for (double t : times) count += t >= from && t < to ? 1 : 0;
  return count;
}

static void test_pitch() {
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    double worst = 0.0;
    for (int midi : {36, 60, 76, 84}) {
      patch({{p::kRhythm, 0.0f}, {p::kQuicken, 0.3f}, {p::kLift, 0.0f}}, rate);
      const double hz = note_hz(static_cast<float>(midi));
      device.note_on(1, static_cast<float>(hz), 0.7f);
      Stereo out = render(device, 2.0f, rate);
      worst = std::max(worst, std::fabs(cents(dominant_frequency(out.left, rate, hz * 0.99, hz * 1.01, at(1.2, rate)), hz)));
    }
    std::snprintf(label, sizeof label, "a lone key is in tune at %.0f Hz (worst %.2f ct)", rate, worst);
    EXPECT(worst < 3.0, label);
  }
  // F above D is 12/5 drawn all the way, and tempered when not drawn.
  for (float agree : {0.0f, 0.5f, 1.0f}) {
    Stereo out = played({{p::kRhythm, 0.0f}, {p::kQuicken, 0.3f}, {p::kLift, 0.0f}, {p::kAgree, agree}}, {65, 50}, 0.7f, 2.5f);
    const double tempered = note_hz(65), exact = note_hz(50) * 2.4;
    const double want = tempered * std::pow(exact / tempered, agree);
    const double got = dominant_frequency(out.left, kRate, tempered * 0.985, tempered * 1.025, at(1.0));
    std::snprintf(label, sizeof label, "Agree %.1f puts the key on its place", agree);
    EXPECT_NEAR(cents(got, want), 0.0, 1.5, label);
  }
  double last = 0.0;
  for (int family = 1; family <= 5; ++family) {
    Stereo out = played({{p::kRhythm, 0.0f}, {p::kQuicken, 0.3f}, {p::kRatios, static_cast<float>(family)}}, {50, 65}, 0.7f, 2.5f);
    const double got = cents(dominant_frequency(out.left, kRate, note_hz(65) * 0.96, note_hz(65) * 1.04, at(1.0)), note_hz(50));
    if (family != 4) EXPECT(std::fabs(got - last) > 10.0, "each family of ratios moves the third");
    EXPECT(std::fabs(got - 1500.0) < 52.0, "no family moves a key further than half a step");
    last = got;
  }
}

static void test_clock() {
  Stereo slow = played(taps(9.0f), {50}, 0.8f, 12.0f);
  const std::vector<double> single = after(onsets(slow.left, kRate), 1.0);
  EXPECT(single.size() == 3, "at Slowness 9 a D falls three more times in twelve seconds");
  const double period = 512.0 / note_hz(50);
  for (size_t i = 1; i < single.size(); ++i) EXPECT_NEAR(single[i] - single[i - 1], period, 0.005, "each a period after the last");
  // Twelve to five, twelve pulses against five: the pattern returns.
  for (float agree : {1.0f, 0.0f}) {
    Stereo out = played(with(taps(6.0f), {{p::kAgree, agree}}), {50, 65}, 0.8f, 34.0f);
    const std::vector<double> times = onsets(out.left, kRate, 0.15);
    const double pattern = 5.0 * 64.0 / note_hz(50);
    double worst = 0.0;
    for (double t : times) {
      if (t < 4.0 || t > 6.2) continue;
      double best = 1.0;
      for (double u : times) best = std::min(best, std::fabs(u - t - 12.0 * pattern));
      worst = std::max(worst, best);
    }
    if (agree > 0.5f) EXPECT(worst < 0.005, "with Agree up the pattern returns");
    if (agree < 0.5f) EXPECT(worst > 0.008, "with Agree down it drifts");
  }
  // A key struck late falls in with the pattern: its pulses come to the grid.
  patch(taps(6.0f)); device.note_on(1, note_hz(50), 0.8f); render(device, 0.53f, kRate);
  device.note_on(2, note_hz(62), 0.8f);
  Stereo late = render(device, 14.0f, kRate);
  const double grid = 64.0 / note_hz(50);
  double off = 0.0;
  for (double t : onsets(late.left, kRate, 0.35)) {
    if (t < 9.0) continue;
    const double phase = (t + 0.53) / (0.5 * grid);
    off = std::max(off, std::fabs(phase - std::floor(phase + 0.5)));
  }
  std::snprintf(label, sizeof label, "a late octave falls in with the bass (%.3f of a pulse off)", off);
  EXPECT(off < 0.08, label);
}

static void test_path() {
  int counts[4][2] = {};
  for (int path = 0; path < 4; ++path) {
    Stereo out = played(with(taps(8.0f), {{p::kPath, static_cast<float>(path)}, {p::kQuicken, 8.0f}, {p::kBloom, 0.0f}}), {50}, 0.8f, 8.0f);
    const std::vector<double> times = onsets(out.left, kRate, 0.1);
    counts[path][0] = between(times, path == 2 ? 3.0 : 0.1, path == 2 ? 5.0 : 3.0);
    counts[path][1] = between(times, path == 2 ? 5.5 : 3.0, path == 2 ? 7.5 : 5.0);
  }
  EXPECT(counts[0][1] > 2 * counts[0][0], "Glide quickens");
  EXPECT(counts[1][1] > 2 * counts[1][0], "Steps quicken");
  EXPECT(counts[2][0] > 2 * counts[2][1], "Slowing slows");
  for (int path : {0, 2}) {
    Stereo out = chord({{p::kRhythm, 0.0f}, {p::kPath, static_cast<float>(path)}, {p::kQuicken, 3.0f}, {p::kLift, 0.0f}}, 4.5f);
    const double early = db(rms(out.left, at(0.3), at(1.0))), end = db(rms(out.left, at(3.6), at(4.4)));
    const double dull = energy_above(out.left, 900.0, kRate, at(0.3), at(1.0)), bright = energy_above(out.left, 900.0, kRate, at(3.6), at(4.4));
    if (path == 0) EXPECT(end > early + 3.0 && bright > 1.2 * dull, "a gliding key blooms into its tone");
    if (path == 2) EXPECT(end < early - 6.0 && bright < dull, "a slowing key comes apart");
  }
  Stereo climb = played({{p::kRhythm, 0.0f}, {p::kPath, 1.0f}, {p::kQuicken, 3.0f}, {p::kLower, 0.25f}}, {62}, 0.8f, 4.5f);
  const double under = tone_level(climb.left, note_hz(50), kRate, at(0.1), at(0.6)), over = tone_level(climb.left, note_hz(62), kRate, at(0.1), at(0.6));
  const double gone = tone_level(climb.left, note_hz(50), kRate, at(3.6), at(4.4)), there = tone_level(climb.left, note_hz(62), kRate, at(3.6), at(4.4));
  EXPECT(under > 0.2 * over && gone < 0.02 * there, "stairs start below the note and end on it");
}

static void test_touch() {
  Stereo spoken = played({}, {60}, 0.7f, 1.0f);
  EXPECT(db(rms(spoken.left, 0, at(0.05))) > -55.0, "a note speaks in its first 50 ms");
  double levels[2];
  for (int only = 0; only < 2; ++only) {
    Stereo out = chord({{only == 0 ? p::kRhythm : p::kTone, 0.0f}}, 4.5f);
    levels[only] = db(rms(out.left, at(0.2), at(4.4)));
  }
  EXPECT(levels[0] > levels[1] + 3.0, "the tone leads");
  EXPECT(levels[0] < levels[1] + 18.0, "the pulses are heard");
  double level[2], colour[2];
  for (int hard = 0; hard < 2; ++hard) {
    Stereo out = played({{p::kQuicken, 0.3f}}, {60}, hard ? 1.0f : 0.3f, 2.0f);
    level[hard] = db(rms(out.left));
    colour[hard] = energy_above(out.left, 1000.0, kRate);
  }
  EXPECT(level[1] > level[0] + 6.0 && colour[1] > 1.4 * colour[0], "harder is louder and brighter");
  double depth[2];
  for (int full = 0; full < 2; ++full) {
    Stereo out = played({{p::kRhythm, 0.0f}, {p::kQuicken, 0.3f}, {p::kBloom, 0.0f}, {p::kSlowness, 7.0f}, {p::kLift, full ? 1.0f : 0.0f}, {p::kAccent, 0.0f}}, {62}, 0.7f, 4.0f);
    double low = 1.0, high = 0.0;
    for (double t = 1.5; t < 3.5; t += 0.02) {
      const double v = rms(out.left, at(t), at(t + 0.02));
      low = std::min(low, v); high = std::max(high, v);
    }
    depth[full] = db(high / low);
  }
  EXPECT(depth[1] > 9.0 && depth[0] < 4.0, "Lift makes the tone follow its pulses");
  Stereo out = played(with(taps(6.0f), {{p::kAccent, 1.0f}}), {50}, 0.6f, 4.2f);
  const double step = 64.0 / note_hz(50);
  const double home = peak(out.left, at(4 * step - 0.01), at(4 * step + 0.1)), away = peak(out.left, at(5 * step - 0.01), at(5 * step + 0.1));
  EXPECT(db(home / away) > 8.0, "Accent stresses the return");
}

static void test_bodies() {
  double ring[4], bright[4];
  for (int body = 0; body < 4; ++body) {
    Stereo out = played(with(taps(9.0f), {{p::kBody, static_cast<float>(body)}, {p::kDamping, 0.5f}, {p::kQuicken, 30.0f}}), {62}, 0.8f, 1.7f);
    ring[body] = rt60(out.left, kRate, 0.08, 0.03, -80.0);
    Stereo tone = chord({{p::kRhythm, 0.0f}, {p::kQuicken, 0.3f}, {p::kBody, static_cast<float>(body)}}, 2.5f);
    bright[body] = energy_above(tone.left, 1000.0, kRate, at(1.0));
  }
  EXPECT(ring[1] > 2.0 * ring[0] && ring[3] < 0.5 * ring[0], "glass rings, wood knocks, air stops");
  EXPECT(bright[2] < 0.6 * bright[0] && bright[1] > 1.4 * bright[0] && bright[3] > 1.4 * bright[0], "skin is dark, glass and air are bright");
}

static void test_release() {
  double gaps[2];
  for (int runs = 0; runs < 2; ++runs) {
    patch(with(taps(5.0f), {{p::kSlowAgain, runs ? 1.0f : 0.0f}, {p::kRelease, 4.0f}}));
    device.note_on(1, note_hz(50), 0.8f); render(device, 2.0f, kRate); device.note_off(1);
    Stereo out = render(device, 3.0f, kRate);
    const std::vector<double> times = onsets(out.left, kRate, 0.02);
    gaps[runs] = times.size() > 2 ? times.back() - times[times.size() - 2] : 0.0;
  }
  EXPECT(gaps[1] > 2.5 * gaps[0], "Slow again runs the clock down");
}

static void test_levels() {
  double low = 0.0, high = -100.0;
  for (int midi : {36, 48, 60, 72, 84}) {
    Stereo out = played({}, {midi}, 0.7f, 4.0f);
    const double top = db(loudest(out)), level = db(std::sqrt(0.5 * (std::pow(rms(out.left, at(1.0)), 2) + std::pow(rms(out.right, at(1.0)), 2))));
    EXPECT(top > -24.0 && top < -10.0, "one note peaks between -24 and -10 dBFS");
    low = std::min(low, level); high = std::max(high, level);
  }
  EXPECT(high - low < 5.0, "level is even over the keyboard");
  // The same at every rate.
  double at_rate[3];
  int i = 0;
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    Stereo out = chord({{p::kPulse, 3.0f}, {p::kRhythm, 0.8f}}, 3.0f, rate);
    at_rate[i++] = db(rms(out.left));
  }
  EXPECT(std::fabs(at_rate[0] - at_rate[1]) < 1.0 && std::fabs(at_rate[2] - at_rate[1]) < 1.0, "breath is as loud at every sample rate");
}

// How much of the largest change in 20 ms is there 8 samples after it starts.
template <typename Event>
static double suddenness(const std::vector<Knob>& knobs, Event event) {
  double worst = 0.0;
  for (int trial = 0; trial < 4; ++trial) {
    Stereo runs[2];
    for (int pass = 0; pass < 2; ++pass) {
      patch(knobs); hold_chord(); render(device, 0.7f, kRate);
      device.process(64 + trial * 19);
      if (pass == 1) event();
      runs[pass] = render(device, 0.02f, kRate);
    }
    size_t begin = 0;
    double early = 0.0, all = 0.0;
    for (size_t i = 0; i < runs[0].size(); ++i) {
      const double d = std::fabs(static_cast<double>(runs[0].left[i]) - runs[1].left[i]);
      if (begin == 0 && d > 1.0e-6) begin = i + 1;
      if (begin > 0 && i < begin + 8) early = std::max(early, d);
      all = std::max(all, d);
    }
    if (all > 1.0e-5) worst = std::max(worst, early / all);
  }
  return worst;
}

static void test_clicks() {
  const std::vector<Knob> soft = {{p::kPulse, 1.0f}, {p::kRhythm, 0.0f}, {p::kQuicken, 0.5f}};
  for (int id : {p::kPulse, p::kBody, p::kPath, p::kTone, p::kWidth, p::kVolume, p::kSlowness}) {
    const double s = suddenness(soft, [id] { device.set_param(id, id == p::kPulse ? 2.0f : (id == p::kVolume ? -20.0f : (p::kParamMax[id] + p::kParamMin[id]) * 0.5f)); });
    std::snprintf(label, sizeof label, "moving param %d under a chord does not click (%.2f)", id, s);
    EXPECT(s < 0.12, label);
  }
  EXPECT(suddenness(soft, [] { device.note_on(3, note_hz(65), 1.0f); }) < 0.05, "a restrike does not click");
  EXPECT(suddenness(soft, [] { device.note_off(2); }) < 0.12, "a release does not click");
  patch(soft);
  for (int i = 0; i < 12; ++i) device.note_on(i, note_hz(40.0f + i), 0.9f);
  render(device, 2.0f, kRate);
  double bend[2] = {};
  for (int taken = 0; taken < 2; ++taken) {
    if (taken == 1) for (int i = 0; i < 4; ++i) device.note_on(50 + i, note_hz(28.0f + i), 0.1f);
    Stereo out = render(device, 0.03f, kRate);
    for (size_t i = 2; i < out.size(); ++i) bend[taken] = std::max(bend[taken], std::fabs(static_cast<double>(out.left[i]) - 2.0 * out.left[i - 1] + out.left[i - 2]));
  }
  EXPECT(bend[1] < 10.0 * bend[0], "a steal does not click");
  // Every knob swept while a chord sounds.
  double top = 0.0;
  bool fine = true;
  for (int id = 0; id < p::kNumParams; ++id) {
    patch({{p::kRhythm, 0.5f}}); hold_chord();
    for (int i = 0; i < 30; ++i) {
      const float u = 0.5f + 0.5f * static_cast<float>(std::sin(i * 0.42));
      device.set_param(id, p::kParamMin[id] + u * (p::kParamMax[id] - p::kParamMin[id]));
      Stereo out = render(device, 0.03f, kRate);
      fine = fine && finite(out.left) && finite(out.right); top = std::max(top, loudest(out));
    }
  }
  std::printf("loudest in every sweep: %.2f\n", top);
  EXPECT(fine && top < 0.95, "every knob can be swept under a chord");
}

static void test_keys() {
  for (int round = 0; round < 2; ++round) {
    patch({{p::kRelease, 0.3f}, {p::kSlowAgain, 0.0f}}); device.note_on(7, 220.0f, 0.7f);
    render(device, round ? 0.001f : 0.4f, kRate); device.note_on(7, 330.0f, 0.7f);
    render(device, round ? 0.001f : 0.4f, kRate); device.note_on(7, 220.0f, 0.7f); render(device, 0.4f, kRate);
    device.note_off(7); render(device, 4.0f, kRate);
    EXPECT(loudest(render(device, 0.2f, kRate)) == 0.0, "one id at A, B and A again is let go by one off");
  }
  patch({{p::kRhythm, 0.0f}, {p::kQuicken, 0.5f}, {p::kRelease, 0.3f}}); device.note_on(7, 220.0f, 0.7f);
  device.note_on(7, 311.1f, 0.7f);
  Stereo moved = render(device, 4.0f, kRate);
  EXPECT(tone_level(moved.left, 220.0, kRate, at(3.0)) < 0.001, "an id that moves to another key lets go of the first");
  device.note_off(7); render(device, 5.0f, kRate);
  Stereo woken[2];
  for (Stereo& out : woken) {  // asleep the first time, new the second
    for (int id : {p::kTone, p::kWidth, p::kSlowness}) device.set_param(id, p::kParamMax[id]);
    hold_chord();
    out = render(device, 0.4f, kRate);
    patch({{p::kRhythm, 0.0f}, {p::kQuicken, 0.5f}, {p::kRelease, 0.3f}});
  }
  EXPECT(woken[0].left == woken[1].left, "a key after a silence is a key on a new instrument");
  patch({}); device.note_on(1, std::nanf(""), 0.7f);
  EXPECT(loudest(render(device, 0.2f, kRate)) == 0.0, "a note that is no number is no note");
  for (float hz : {0.0f, -5.0f, 1.0e9f, std::numeric_limits<float>::infinity()}) device.note_on(2, hz, std::nanf(""));
  Stereo odd = render(device, 0.5f, kRate);
  EXPECT(finite(odd.left) && loudest(odd) < 1.0, "absurd notes are survived");
  // Block sizes, across a silence.
  Stereo runs[3];
  const int sizes[3] = {1, 128, 2048};
  for (int r = 0; r < 3; ++r) {
    patch({{p::kPulse, 3.0f}, {p::kRelease, 0.2f}, {p::kSlowAgain, 0.0f}, {p::kRhythm, 0.6f}}); hold_chord();
    Stereo out = render(device, 24.0f * 2048.0f / kRate, kRate, sizes[r]);
    for (int i = 0; i < 5; ++i) device.note_off(i + 1);
    out = concat(out, render(device, 70.0f * 2048.0f / kRate, kRate, sizes[r]));
    EXPECT(peak(out.left, out.size() - 2048) == 0.0, "silent in between");
    device.set_param(p::kPulseWidth, 0.3f); hold_chord();
    runs[r] = concat(out, render(device, 24.0f * 2048.0f / kRate, kRate, sizes[r]));
  }
  EXPECT(runs[0].left == runs[1].left && runs[1].left == runs[2].left && runs[0].right == runs[2].right, "block sizes change nothing");
}
static double pitch_at(const std::vector<float>& x, double hz, double from, double to) {
  return cents(dominant_frequency(std::vector<float>(x.begin() + static_cast<long>(at(from)), x.begin() + static_cast<long>(at(to))), kRate, hz * 0.985, hz * 1.015), hz);
}
static double held(const std::vector<Knob>& knobs, double from, double to, double above, double* level) {
  patch(knobs); hold_chord();
  Stereo out = render(device, static_cast<float>(to), kRate);
  *level = db(rms(out.left, at(from), at(to)));
  return energy_above(out.left, above, kRate, at(from), at(to));
}

// What a second pair of ears found, and what was mended.
static void test_mended() {
  double level[6], share[6];
  const std::vector<std::vector<Knob>> loud = {
      {}, {{p::kSlowness, 5.5f}, {p::kQuicken, 0.5f}, {p::kLift, 1.0f}, {p::kBloom, 0.1f}, {p::kTone, 0.8f}, {p::kAttack, 0.25f}, {p::kVolume, -9.0f}},
      {{p::kPulse, 4.0f}, {p::kPath, 1.0f}, {p::kSlowness, 5.0f}, {p::kQuicken, 1.6f}, {p::kAttack, 0.01f}, {p::kVolume, -15.0f}}};
  for (const std::vector<Knob>& knobs : loud) {
    patch(knobs);
    for (int i = 0; i < 10; ++i) device.note_on(i, note_hz(static_cast<float>(60 + (i * 12 + 3) / 7)), 1.0f);
    EXPECT(loudest(render(device, 3.0f, kRate)) < 0.5, "ten keys at full force have room");
  }
  Stereo taps_only = played({{p::kTone, 0.0f}, {p::kRhythm, 1.0f}, {p::kPulse, 1.0f}, {p::kPulseWidth, 1.0f}, {p::kSlowness, 4.0f}}, {57}, 0.8f, 4.0f);
  EXPECT(std::fabs(mean(taps_only.left)) < 2.0e-5 && energy_above(taps_only.left, 45.0, kRate) > 0.82, "pulses have no offset and no thump");
  patch({{p::kRhythm, 0.0f}, {p::kQuicken, 0.5f}, {p::kLift, 0.0f}}); device.note_on(1, note_hz(50), 0.7f);
  device.note_on(2, note_hz(65), 0.7f); render(device, 1.5f, kRate);
  device.note_off(1);
  Stereo alone = render(device, 2.5f, kRate);
  EXPECT_NEAR(pitch_at(alone.left, note_hz(50) * 2.4, 1.0, 2.5), 0.0, 1.0, "a key keeps its ratio when the lowest is let go");
  double round[3];
  Stereo turn = played({{p::kPath, 3.0f}, {p::kQuicken, 4.0f}, {p::kRhythm, 0.0f}, {p::kBloom, 0.6f}, {p::kLift, 0.0f}, {p::kAttack, 0.05f}}, {60}, 0.7f, 6.5f);
  for (int i = 0; i < 3; ++i) round[i] = db(rms(turn.left, at(1.8 + i * 2.0), at(2.2 + i * 2.0)));
  EXPECT(round[0] > round[1] + 6.0 && std::fabs(round[0] - round[2]) < 2.0, "There and back takes Quicken for a round");
  for (int i = 0; i < 2; ++i) share[i] = held({{p::kRhythm, 0.0f}, {p::kBloom, 0.0f}, {p::kQuicken, 0.5f}, {p::kAttack, i ? 1.0f : 0.005f}}, 0.0, 0.5, 900.0, &level[i]);
  EXPECT(level[0] > level[1] + 6.0 && share[0] > 1.15 * share[1], "a short attack starts loud and bright");
  for (int i = 0; i < 2; ++i) held({{p::kPulse, 3.0f}, {p::kBody, 3.0f}, {p::kRhythm, 0.0f}, {p::kBloom, 0.0f}, {p::kQuicken, 0.5f}, {p::kAttack, i ? 0.05f : 0.6f}}, 2.8, 3.8, 900.0, &level[i]);
  EXPECT(level[0] > level[1] - 4.5, "breath in air arrives within its first seconds");
  for (int i = 0; i < 4; ++i) held({{i < 2 ? p::kPulse : p::kBody, i < 2 ? 4.0f - i * 4.0f : i * 1.0f - 1.0f}, {p::kRhythm, 0.0f}, {p::kQuicken, 0.5f}}, 0.05, 0.4, 900.0, &level[i]);
  EXPECT(level[0] > level[1] + 1.0 && level[0] < level[1] + 5.0 && std::fabs(level[2] - level[3]) < 8.0, "materials are as loud as each other");
  for (int i = 0; i < 2; ++i) {
    share[i] = held({{p::kRhythm, 0.0f}, {p::kQuicken, 0.5f}, {p::kDamping, i ? 1.0f : 0.0f}}, 1.0, 2.0, 1500.0, &level[i]);
    for (int k = 0; k < 5; ++k) device.note_off(k + 1);
    level[2 + i] = db(rms(render(device, 1.5f, kRate).left, at(1.0))) - level[i];
  }
  EXPECT(level[2] > level[3] + 12.0, "Damping ends a key sooner");
  for (int i = 0; i < 2; ++i) {
    Stereo out = played({{p::kRhythm, 0.0f}, {p::kQuicken, 0.5f}, {p::kLower, i ? 1.0f : 0.2f}}, {69}, 0.7f, 2.5f);
    level[i] = db(tone_level(out.left, 220.0, kRate, at(1.0)) / tone_level(out.left, 440.0, kRate, at(1.0)));
  }
  EXPECT(level[0] < -35.0 && level[1] > -9.0, "Lower stays");
  for (int i = 0; i < 2; ++i) held({{p::kPulse, 2.0f}, {p::kTone, 0.0f}, {p::kRhythm, 0.6f}, {p::kQuicken, 30.0f}, {p::kSlowness, i ? 2.0f : 6.0f}}, 0.5, 3.0, 900.0, &level[i]);
  EXPECT(level[1] > level[0] - 9.0, "strokes that run together are heard");
  patch({{p::kRhythm, 0.0f}});
  hold_chord();
  const double before = loudest(render(device, 3.0f, kRate));
  device.set_param(p::kPulse, 4.0f);
  EXPECT(loudest(render(device, 0.5f, kRate)) < 2.5 * before, "a choice under a chord makes no burst");
  for (int i = 0; i < 2; ++i) {
    patch({{p::kRhythm, 0.0f}, {p::kQuicken, 0.5f}, {p::kRatios, i ? 1.0f : 2.0f}});
    device.note_on(1, note_hz(50), 0.1f);
    device.note_on(2, note_hz(54), 0.9f);
    Stereo out = render(device, 2.5f, kRate);
    share[i] = energy_above(out.left, 700.0, kRate, at(1.0));
  }
  EXPECT(share[0] > 1.1 * share[1], "a plain third is brighter than a far one");
}

int main() {
  Conformance spec;
  spec.name = "chord-clock";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 14.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec);
  test_pitch();
  test_clock();
  test_path();
  test_touch();
  test_bodies();
  test_release();
  test_levels();
  test_clicks();
  test_keys();
  test_mended();
  patch({});
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::exp2(n * 3 / 12.0f), 0.7f);
  report_cost("chord-clock, 8 held notes", 5.0f, kRate, [] { render(device, 5.0f, kRate); });
  return finish("chord-clock");
}
