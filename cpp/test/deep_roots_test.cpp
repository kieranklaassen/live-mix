// Native harness for Deep Roots (cpp/devices/deep-roots).

#include <initializer_list>
#include <utility>

#include "../devices/deep-roots/deep_roots.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::DeepRoots;
namespace p = livemix::deep_roots;

static DeepRoots device;
static const float kRate = 48000.0f;
static const float kChord[5] = {146.832f, 220.0f, 349.228f, 523.251f, 659.255f};

static float key(float midi) { return 440.0f * std::pow(2.0f, (midi - 69.0f) / 12.0f); }
static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

using Knobs = std::initializer_list<std::pair<int, float>>;
static void with(Knobs knobs) {
  for (const auto& knob : knobs) device.set_param(knob.first, knob.second);
}
static void fresh(Knobs knobs = {}) {
  device.init(kRate);
  with(knobs);
}
static void still(Knobs knobs = {}) {
  fresh({{p::kSway, 0.0f}, {p::kGrowth, 0.02f}, {p::kAttack, 0.02f}});
  with(knobs);
}
static void halves(Knobs knobs = {}) {
  still({{p::kBalance, 1.0f}, {p::kSeries, 0.0f}, {p::kReach, 1.0f}, {p::kMeeting, 0.0f}});
  with(knobs);
}
static std::vector<float> mid(const Stereo& s) {
  std::vector<float> m(s.size());
  for (size_t i = 0; i < m.size(); ++i) m[i] = 0.5f * (s.left[i] + s.right[i]);
  return m;
}
static std::vector<float> take(float seconds) { return mid(render(device, seconds, kRate)); }
static void wait(float seconds) { render(device, seconds, kRate); }
static double level(float seconds) { return db(rms(take(seconds)) + 1.0e-6); }
// How far the level moves, in dB, from one window to another.
static double wander(int windows, float seconds) {
  double low = 99.0, high = -999.0;
  for (int n = 0; n < windows; ++n) {
    const double at = level(seconds);
    low = std::min(low, at);
    high = std::max(high, at);
  }
  return high - low;
}
static void chord(float seconds) {
  for (int i = 0; i < 5; ++i) device.note_on(i, kChord[i], 0.7f);
  wait(seconds);
}
static void one(float hz, float seconds, float gain = 0.7f) {
  device.note_on(1, hz, gain);
  wait(seconds);
}
static std::vector<float> held(Knobs knobs, float hz, float before, float seconds) {
  still(knobs);
  one(hz, before);
  return take(seconds);
}
static void let_go(int keys) {
  for (int i = 0; i < keys; ++i) device.note_off(i);
}
static double top(const Stereo& s) { return std::max(peak(s.left), peak(s.right)); }

// One finger has roots: whole divisions of the key, exactly in tune, each with
// three partials or more.
static void check_one_finger() {
  for (float midi : {60.0f, 72.0f, 81.0f}) {
    halves();
    one(key(midi), 1.0f);
    const double half = key(midi) / 2.0;
    const std::vector<float> x = take(2.0f);
    EXPECT_NEAR(cents(dominant_frequency(x, kRate, half * 0.9, half * 1.1), half), 0.0, 1.0, "the first root is half the key");
    EXPECT(tone_level(x, half, kRate) > 0.01, "one finger has a root that is heard");
  }
  for (int soil = 0; soil < p::kSoils; ++soil) {
    halves({{p::kSoil, static_cast<float>(soil)}, {p::kRootTone, 0.0f}});
    one(220.0f, 0.25f);
    const std::vector<float> x = take(0.4f);
    const float* ratio = p::kSoilTable[soil].ratio;
    int heard = 0;
    for (int k = 0; k < p::kLane; ++k) {
      double level = 0.0;
      for (int o = -10; o <= 10; ++o) level = std::max(level, tone_level(x, 110.0 * ratio[k] + 2.0 * o, kRate));
      if ((k == 0 || ratio[k] != ratio[k - 1]) && level > rms(x) * 0.02) ++heard;
    }
    EXPECT(heard >= 3, "three partials in every soil with the tone closed");
  }
}

// The bass of a chord: in tune with the chord when it is fitted, and it was not there before.
static void check_meeting() {
  double level[3];
  for (int pass = 0; pass < 3; ++pass) {
    still({{p::kBalance, 1.0f}, {p::kSeries, 0.0f}, {p::kReach, 1.0f}, {p::kMeeting, pass == 0 ? 0.0f : (pass == 1 ? 1.0f : -1.0f)}});
    if (pass == 2) with({{p::kReach, 2.4f}, {p::kSeries, 0.33f}});
    chord(3.0f);
    const std::vector<float> x = take(3.0f);
    level[pass] = tone_level(x, 73.416, kRate) / rms(x);
    if (pass == 1) {
      EXPECT_NEAR(cents(dominant_frequency(x, kRate, 70.0, 77.0), 73.416), 0.0, 3.0, "the fitted bass is in tune with the D above it");
      EXPECT(device.meter(1) > 0.5f, "the meter says the chord has met");
    }
  }
  EXPECT(level[1] > level[0] * 1.3 && level[2] > 0.02, "third tones make the chord's bass, and so do divisions that meet");
  // The true difference, where it lies.
  for (float fit : {0.0f, 1.0f}) {
    still({{p::kBalance, 1.0f}, {p::kMeeting, 1.0f}, {p::kTolerance, 120.0f}, {p::kFit, fit}});
    device.note_on(2, key(64), 0.7f);
    one(key(60), 3.0f);
    const double found = dominant_frequency(take(2.0f), kRate, 60.0, 75.0);
    EXPECT_NEAR(cents(found, fit > 0.5f ? key(36) : key(64) - key(60)), 0.0, 4.0, fit > 0.5f ? "fitted to the chord" : "the true difference");
  }
}

// Below 100 Hz nothing is closer than a fifth, whatever is played and however it is set.
static void check_spacing() {
  uint32_t state = 77;
  auto next = [&] { return static_cast<float>((state = state * 1664525u + 1013904223u) >> 8) / 16777216.0f; };
  int worst = 0;
  for (int round = 0; round < 40; ++round) {
    fresh({{p::kGrowth, 0.05f}});
    for (int id : {p::kSeries, p::kReach, p::kBranching, p::kMeeting, p::kFit, p::kTolerance, p::kFloor}) {
      device.set_param(id, p::kParamMin[id] + (p::kParamMax[id] - p::kParamMin[id]) * next());
    }
    const int keys = 1 + static_cast<int>(next() * 8.0f);
    for (int k = 0; k < keys; ++k) device.note_on(k, key(43.0f + std::floor(next() * 40.0f)), 0.7f);
    wait(2.5f);
    float hz[DeepRoots::kRoots];
    int count = 0;
    for (int r = 0; r < DeepRoots::kRoots; ++r) {
      float at, goal, power;
      if (device.root_at(r, &at, &goal, &power) && power > 0.02f) hz[count++] = at;
    }
    for (int i = 0; i < count * count; ++i) {
      const float a = hz[i / count], b = hz[i % count];
      if (a < 99.0f && b > a * 1.004f && b < a * 1.47f) ++worst;
    }
    EXPECT(count >= 1, "there is always a root");
  }
  EXPECT(worst == 0, "nothing closer than a fifth below 100 Hz");
}

// Roots come down one after another; Stagger makes the keys wait; Floor holds.
static void check_growth() {
  halves({{p::kReach, 3.0f}, {p::kBranching, 1.0f}, {p::kGrowth, 1.0f}});
  one(880.0f, 0.0f);
  const std::vector<float> x = take(5.0f);
  auto arrives = [&](double hz) {
    const size_t step = 4800;
    const double full = tone_level(x, hz, kRate, 4 * 48000, 5 * 48000);
    for (size_t at = 0; at + step <= x.size(); at += step / 2) {
      if (tone_level(x, hz, kRate, at, at + step) > 0.5 * full) return static_cast<double>(at) / kRate;
    }
    return 99.0;
  };
  EXPECT(arrives(440) + 0.5 < arrives(220) && arrives(220) + 0.5 < arrives(110), "the wavefront goes down the series");
  EXPECT(arrives(440) > 0.8, "the first root takes the time Growth says");
  still({{p::kStagger, 1.0f}});
  chord(0.6f);
  const float early = device.meter(2);
  wait(6.0f);
  EXPECT(device.meter(2) > early + 2.0f, "with Stagger the keys send their roots one after another");
  still({{p::kFloor, 120.0f}, {p::kReach, 3.6f}});
  chord(2.0f);
  EXPECT(device.meter(0) > 117.0f, "no root under the floor");
}

// What the remaining knobs do, each measured.
static void check_characters() {
  // Soils: chalk dies away, the others stand; sand is the brightest, peat the darkest.
  double later[p::kSoils], bright[p::kSoils];
  for (int soil = 0; soil < p::kSoils; ++soil) {
    still({{p::kBalance, 1.0f}, {p::kSoil, static_cast<float>(soil)}});
    chord(0.0f);
    const std::vector<float> a = take(1.0f), between = take(3.0f), b = take(1.0f);
    later[soil] = db(rms(b) / rms(a));
    bright[soil] = energy_above(a, 900.0, kRate);
  }
  EXPECT(later[3] < -12.0 && later[0] > -4.0 && later[1] > -5.0 && later[4] > -4.0, "chalk is struck, the others are held");
  EXPECT(bright[1] > bright[0] * 3.0 && bright[4] > bright[0] * 3.0 && bright[2] < bright[0], "the soils lie in their order");
  still({{p::kBalance, 1.0f}, {p::kDecay, 2.0f}});
  chord(0.5f);
  const double first = level(0.3f);
  wait(1.2f);
  EXPECT_NEAR(level(0.3f) - first, -42.0, 9.0, "a root falls 60 dB in the time Decay says");
  for (float on : {0.0f, 1.0f}) {
    halves({{p::kPulse, 0.6f * on}});  // 2 Hz
    one(220.0f, 1.0f);
    std::vector<float> seen;
    for (int n = 0; n < 500; ++n) seen.push_back(static_cast<float>(rms(take(0.01f))));
    EXPECT((tone_level(seen, 2.0, 100.0) > (on > 0.0f ? 0.4 : 0.05) * mean(seen)) == (on > 0.0f), "a root pulses at its own pitch, halved");
    halves({{p::kGrain, on}});
    one(330.0f, 0.5f);
    EXPECT((wander(100, 0.05f) > (on > 0.0f ? 15.0 : 2.0)) == (on > 0.0f), "grain breaks a root into pebbles");
    halves({{p::kSway, on}});
    one(330.0f, 0.5f);
    EXPECT((wander(8, 0.6f) > (on > 0.0f ? 2.0 : 0.5)) == (on > 0.0f), "sway is what moves a held root");
    halves({{p::kBranching, on}, {p::kReach, 3.4f}});
    one(880.0f, 1.0f);
    EXPECT(device.meter(2) == (on > 0.0f ? 3.0f : 1.0f), "branching is how many roots a key has");
    still({{p::kAttack, on > 0.0f ? 4.0f : 0.05f}, {p::kBalance, 0.0f}});
    one(330.0f, 0.2f);
    const double start = level(0.2f);
    wait(4.0f);
    EXPECT((std::fabs(level(0.2f) - start) > 1.0) == (on > 0.0f), "attack is how slowly the leaf opens");
    still({{p::kMeeting, -1.0f}, {p::kTolerance, on > 0.0f ? 120.0f : 4.0f}});
    device.note_on(2, 220.0f, 0.7f);
    one(334.0f, 2.0f);
    EXPECT((device.meter(1) > 0.5f) == (on > 0.0f), "tolerance is how far away a root is still drawn in");
    const double leaf_tone = energy_above(held({{p::kBalance, 0.3f}, {p::kLeaf, 1.0f}, {p::kLeafTone, on}}, 220.0f, 1.0f, 1.0f), 900.0, kRate);
    const double root_tone = energy_above(held({{p::kBalance, 1.0f}, {p::kRootTone, on}}, 220.0f, 1.0f, 1.0f), 900.0, kRate);
    EXPECT((leaf_tone > 0.2) == (on > 0.0f) && (root_tone > 0.02) == (on > 0.0f), "both tones brighten");
    still({{p::kWidth, on}});
    chord(1.0f);
    const Stereo out = render(device, 1.0f, kRate);
    EXPECT(on > 0.0f ? correlation(out.left, out.right) < 0.97 : out.left == out.right, "width opens what stands in the middle");
  }
  const std::vector<float> leaf = held({{p::kBalance, 0.0f}}, 440.0f, 1.0f, 1.0f);
  EXPECT(tone_level(leaf, 220.0, kRate) < 1.0e-4 && tone_level(leaf, 440.0, kRate) > 0.01, "Balance takes the roots away");
}

// The bass carries the chord, a leaf and the roots in its own pitch add up, and what an older key left makes room.
static void check_bass() {
  still({{p::kBalance, 1.0f}, {p::kMeeting, 1.0f}});
  for (float midi : {62.0f, 66.0f, 69.0f, 73.0f}) device.note_on(static_cast<int>(midi), key(midi), 0.7f);
  wait(2.0f);
  const std::vector<float> x = take(2.0f);
  EXPECT(tone_level(x, key(38), kRate) > 4.0 * tone_level(x, key(37), kRate), "the bass carries the chord");
  for (float midi : {28.0f, 36.0f, 40.0f, 60.0f, 84.0f}) {
    still({{p::kMeeting, midi == 36.0f || midi == 60.0f ? 1.0f : 0.0f}, {p::kRelease, 0.2f}});
    double first = -25.0;
    for (int n = 0; n < 4; ++n) {
      one(key(midi), 1.0f);
      const double at = level(0.5f);
      EXPECT_NEAR(at, first, n ? 1.0 : 2.7, "a key is as loud wherever it lies and each time it is struck");
      if (n == 0) first = at;
      device.note_off(1);
      wait(1.0f);
    }
  }
  still({{p::kBalance, 1.0f}, {p::kMeeting, 0.0f}, {p::kRelease, 12.0f}, {p::kSeries, 0.0f}, {p::kReach, 2.0f}});
  one(key(62), 1.5f);
  device.note_off(1);
  device.note_on(2, key(63), 0.7f);
  wait(0.5f);
  const std::vector<float> after = take(2.0f);
  EXPECT(tone_level(after, key(38), kRate) < 0.01 * tone_level(after, key(39), kRate), "the roots of a key let go make room below 100 Hz");
  still({{p::kBalance, 1.0f}, {p::kMeeting, 1.0f}, {p::kRelease, 15.0f}});
  chord(2.0f);
  const double before = level(0.5f);
  let_go(5);
  wait(6.0f);
  EXPECT_NEAR(level(0.5f) - before, -25.0, 4.0, "the bass dies away in the time Release says");
  for (float balance : {0.0f, 1.0f}) {
    double loud[2], colour[2];
    for (int hard = 0; hard < 2; ++hard) {
      still({{p::kBalance, balance}, {p::kLeaf, 1.0f}});
      one(220.0f, 1.5f, hard ? 1.0f : 0.3f);
      const std::vector<float> y = take(1.0f);
      loud[hard] = db(rms(y));
      colour[hard] = energy_above(y, 900.0, kRate);
    }
    EXPECT(loud[1] - loud[0] > 8.0 && colour[1] > colour[0] * 1.1, "a hard touch is stronger and brighter");
  }
  still({{p::kBalance, 1.0f}, {p::kMeeting, 0.0f}, {p::kGrowth, 1.5f}, {p::kDecay, 0.5f}, {p::kReach, 1.0f}});
  device.note_on(1, 220.0f, 0.7f);
  EXPECT(db(top(render(device, 4.0f, kRate))) > -26.0, "a slow root with a short Decay is heard");
  still({{p::kBalance, 1.0f}, {p::kMeeting, 0.0f}, {p::kStagger, 2.0f}, {p::kRelease, 0.2f}});
  for (int n = 0; n < 8; ++n) {
    one(300.0f + 20.0f * static_cast<float>(n), 0.2f);
    device.note_off(1);
  }
  one(220.0f, 0.4f);
  EXPECT(tone_level(take(0.4f), 110.0, kRate) > 0.01, "a line under Stagger has its roots");
}

static void check_levels() {
  for (float midi : {36.0f, 48.0f, 60.0f, 72.0f, 84.0f}) {
    fresh();
    one(key(midi), 0.0f);
    EXPECT_NEAR(db(top(render(device, 3.0f, kRate))), -17.0, 7.0, "one note peaks between -24 and -10 dBFS");
  }
  for (int leaf = 0; leaf < p::kLeaves; ++leaf) {
    for (int soil = 0; soil < p::kSoils; ++soil) {
      fresh({{p::kLeaf, static_cast<float>(leaf)}, {p::kSoil, static_cast<float>(soil)}});
      for (int i = 0; i < 10; ++i) device.note_on(i, key(45.0f + 3.7f * static_cast<float>(i)), 1.0f);
      const Stereo s = render(device, 3.0f, kRate);
      EXPECT(top(s) < 0.5 && std::fabs(mean(s.left)) < 0.002, "ten hard keys stay under the knee, with no offset");
    }
  }
  double level[2];
  for (int pass = 0; pass < 2; ++pass) {
    device.init(pass ? 96000.0f : 44100.0f);
    chord(0.0f);
    level[pass] = db(rms(render(device, 3.0f, pass ? 96000.0f : 44100.0f).left));
  }
  EXPECT_NEAR(level[0], level[1], 1.0, "as loud at 96 kHz as at 44.1");
}

// The largest second difference: a click stands out of what the sound does by itself.
static double bend(const std::vector<float>& x) {
  double worst = 0.0;
  for (size_t i = 2; i < x.size(); ++i) worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 2.0 * x[i - 1] + x[i - 2]));
  return worst;
}

static void check_clicks() {
  // A soft dark patch whose own bends are small.
  auto soft = [] { still({{p::kAttack, 0.3f}, {p::kGrowth, 0.3f}, {p::kRootTone, 0.2f}, {p::kLeafTone, 0.2f}}); };
  soft();
  chord(1.0f);
  const double quiet = bend(render(device, 2.0f, kRate).left);
  // Every knob jumped while a chord sounds (the choices bring brighter sounds of their own).
  for (int id = 0; id < p::kNumParams; ++id) {
    if (id == p::kLeaf || id == p::kSoil || id == p::kGrain || id == p::kRootTone || id == p::kLeafTone || id == p::kVolume) continue;
    soft();
    chord(1.0f);
    double worst = 0.0;
    for (float value : {p::kParamMin[id], p::kParamMax[id], p::kParamDefault[id]}) {
      device.set_param(id, value);
      worst = std::max(worst, bend(render(device, 0.3f, kRate).left));
    }
    EXPECT(worst < quiet * 2.5, "a knob jumped while a chord sounds does not click");
  }
  soft();
  chord(1.0f);
  std::vector<float> x;
  auto strike = [&](int id, float hz, float seconds) {
    device.note_on(id, hz, 0.7f);
    const Stereo s = render(device, seconds, kRate);
    x.insert(x.end(), s.left.begin(), s.left.end());
  };
  for (int n = 0; n < 20; ++n) strike(n % 5, kChord[n % 5], 0.04f);
  for (int n = 0; n < 24; ++n) {
    device.note_off(n % 5);
    strike(n % 5, kChord[n % 5], 0.02f);
  }
  EXPECT(bend(x) < quiet * 4.0, "restrikes do not click");
  // Twelve long keys stand; six of them are stolen by keys that open slowly.
  soft();
  for (int n = 0; n < 12; ++n) device.note_on(n, key(40.0f + 2.0f * n), 0.7f);
  wait(2.0f);
  const double stand = bend(take(0.5f));
  x.clear();
  for (int n = 0; n < 6; ++n) strike(20 + n, key(52.0f + n), 0.03f);
  EXPECT(bend(x) < stand * 2.0, "a stolen key does not click");
  for (int id : {p::kLeaf, p::kSoil}) {
    soft();
    chord(2.0f);
    device.set_param(id, id == p::kLeaf ? 1.0f : 2.0f);
    const double changed = bend(take(0.1f));
    wait(1.0f);
    const double own = std::max(quiet, bend(take(1.0f)));
    EXPECT(changed < own * 1.6, "a choice changed under a chord does not click");
  }
}

static void check_keys() {
  // One id at one pitch, another and the first again, then one note off.
  for (float gap : {0.0f, 0.02f, 0.5f}) {
    fresh({{p::kRelease, 0.4f}});
    for (float hz : {220.0f, 330.0f, 220.0f}) one(hz, gap);
    device.note_off(1);
    wait(4.0f);
    EXPECT(top(render(device, 0.5f, kRate)) == 0.0, "one note off ends an id sent at three pitches");
  }
  fresh({{p::kRelease, 0.4f}});
  for (int n = 0; n < 12; ++n) device.note_on(n, key(50.0f + 2.0f * n), 0.7f);
  wait(2.0f);
  for (int n : {40, 40, 41}) device.note_on(n, n == 40 ? 1000.0f : 1300.0f, 0.7f);
  const Stereo s = render(device, 0.6f, kRate);
  EXPECT(tone_level(s.left, 1000.0, kRate, 9600) > 0.002 && tone_level(s.left, 1300.0, kRate, 9600) > 0.002, "two keys that steal both sound");
  let_go(42);
  wait(4.0f);
  EXPECT(top(render(device, 0.5f, kRate)) == 0.0, "nothing is left after a steal");
  for (float hz : {0.0f, -5.0f, 5.0f, 20000.0f, 1.0e30f, std::nanf("")}) {
    for (float gain : {0.0f, 2.0f, -1.0f, std::nanf("")}) device.note_on(3, hz, gain);
  }
  const Stereo odd = render(device, 1.0f, kRate);
  EXPECT(finite(odd.left) && finite(odd.right) && top(odd) < 1.0, "absurd notes are survived");
}

// The same audio at any block size, across a silence, and a knob moved while asleep.
static void check_blocks() {
  auto run = [](int block) {
    fresh({{p::kRelease, 0.3f}, {p::kGrain, 0.4f}, {p::kSoil, 1.0f}});
    std::vector<float> all;
    auto more = [&](float seconds) {
      const std::vector<float> x = render(device, seconds, kRate, block).left;
      all.insert(all.end(), x.begin(), x.end());
    };
    chord(0.0f);
    more(0.5f);
    let_go(5);
    more(2.5f);
    with({{p::kSoil, 4.0f}, {p::kBalance, 0.9f}});
    device.note_on(1, 246.9f, 0.7f);
    more(0.5f);
    return all;
  };
  const std::vector<float> a = run(128);
  for (int block : {1, 7, 2048}) {
    const std::vector<float> b = run(block);
    EXPECT(a == b, "the block size is not heard, across a silence either");
  }
  for (int id = 0; id < p::kNumParams; ++id) {
    std::vector<float> heard[2];
    for (int pass = 0; pass < 2; ++pass) {
      fresh({{p::kSway, 0.0f}});
      const float value = p::kParamDefault[id] == p::kParamMax[id] ? p::kParamMin[id] : 0.5f * (p::kParamDefault[id] + p::kParamMax[id]);
      if (pass == 0) device.set_param(id, value);
      wait(0.2f);
      device.set_param(id, value);
      device.note_on(1, 220.0f, 0.7f);
      heard[pass] = take(0.3f);
    }
    EXPECT(heard[0] == heard[1], "a knob moved while asleep does not glide under the first note");
  }
}

int main() {
  Conformance spec;
  spec.name = "deep-roots";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 8.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);
  for (auto* check : {check_one_finger, check_meeting, check_spacing, check_growth, check_characters, check_bass,
                      check_levels, check_clicks, check_keys, check_blocks}) {
    check();
  }
  report_cost("deep-roots (8 keys, all divisions)", 10.0f, kRate, [] {
    fresh({{p::kSeries, 0.66f}, {p::kBranching, 1.0f}, {p::kReach, 3.6f}, {p::kMeeting, 0.2f}});
    for (int i = 0; i < 8; ++i) device.note_on(i, key(48.0f + 3.4f * static_cast<float>(i)), 0.7f);
    wait(10.0f);
  });
  return finish("deep-roots");
}
