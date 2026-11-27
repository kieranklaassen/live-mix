// Native harness for Slow Accord. After the conformance pass it measures the
// idea: a note that never moves, overtones that go from metal to agreement,
// three at once, and the faults instruments have had before.
#include "../devices/slow-accord/slow_accord.h"
#include <limits>
#include <utility>
#include "support/test_kit.h"

using namespace testkit;
using livemix::SlowAccord;
namespace p = livemix::slow_accord;

static SlowAccord device;
static const float kRate = 48000.0f;
static char label[240];
static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }
static double loudest(const Stereo& s) { return std::max(peak(s.left), peak(s.right)); }
static float note_hz(float midi) { return 440.0f * std::exp2((midi - 69.0f) / 12.0f); }
static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }
static double level(Stereo s, double from, double to, double rate = kRate) {  // of both sides together
  for (size_t i = 0; i < s.size(); ++i) s.left[i] = 0.5f * (s.left[i] + s.right[i]);
  return rms(s.left, at(from, rate), at(to, rate));
}
using Knobs = std::initializer_list<std::pair<int, float>>;
static void set(Knobs knobs) { for (const auto& knob : knobs) device.set_param(knob.first, knob.second); }
// A key that is easy to read: no chimes, no breath, no beats, one place.
static void plain(Knobs knobs = {}, float rate = kRate) {
  device.init(rate);
  set({{p::kGlint, 0.0f}, {p::kAir, 0.0f}, {p::kLeftover, 0.0f}, {p::kSwing, 0.0f}, {p::kSpread, 0.0f}, {p::kAgain, 0.0f}});
  set(knobs);
}
static Stereo play(float hz, float gain, float seconds) { return device.note_on(1, hz, gain), render(device, seconds, kRate); }
static void raise(double& most, double value) { most = std::max(most, value); }
struct Range {
  double low = 1.0e9, high = -1.0e9;
  void add(double v) { low = std::min(low, v), high = std::max(high, v); }
};
static double ten_keys(float seconds) {  // all of them struck as hard as can be
  for (int midi : {38, 45, 50, 53, 57, 60, 65, 69, 72, 76}) device.note_on(midi, note_hz(static_cast<float>(midi)), 1.0f);
  return loudest(render(device, seconds, kRate));
}
static bool gone(float seconds) { return render(device, seconds, kRate), loudest(render(device, 0.2f, kRate)) == 0.0; }
static const float kChord[5] = {50.0f, 57.0f, 65.0f, 72.0f, 76.0f};
static void chord(float gain = 0.8f, int first_id = 1) { for (int i = 0; i < 5; ++i) device.note_on(first_id + i, note_hz(kChord[i]), gain); }
// Cents from overtone k of a key to the nearest of these tones in any octave.
static double off_chord(int id, int k, std::initializer_list<float> keys) {
  const double hz = device.overtone_hz(id, k);
  Range off;
  for (float key : keys) {
    const double away = cents(hz, note_hz(key));
    off.add(std::fabs(away - 1200.0 * std::floor(away / 1200.0 + 0.5)));
  }
  return off.low;
}
static int count_overtones(int id, int k = 1) { return device.overtone_hz(id, k) > 0.0f ? count_overtones(id, k + 1) : k - 1; }
static void test_the_note_stays() {
  for (float midi : {38.0f, 57.0f, 81.0f}) {
    plain();
    const double hz = note_hz(midi);
    device.note_on(1, static_cast<float>(hz), 0.7f);
    double worst = 0.0;
    for (int i = 0; i < 1500; ++i) device.process(128), raise(worst, std::fabs(cents(device.overtone_hz(1, 0), hz)));
    Stereo out = render(device, 2.0f, kRate);
    const double heard = dominant_frequency(out.left, kRate, hz * 0.985, hz * 1.015, 0, at(2.0));
    EXPECT(worst < 1.6 && std::fabs(cents(heard, hz)) < 0.5, "the note of a key never moves");
  }
}
static void test_metal_becomes_series() {
  // A bar's first overtone is at 2.756. Bent, its energy goes to whole numbers.
  const double hz = 220.0;
  for (float bend : {1.0f, 0.0f, 0.5f}) {
    plain({{p::kMaterial, p::kBar}, {p::kGoal, p::kOwn}, {p::kBend, bend}, {p::kOvertones, 4.0f}, {p::kTravel, 0.3f}});
    Stereo early = play(static_cast<float>(hz), 0.7f, 0.3f), rest = render(device, 6.0f, kRate);
    auto tone = [&](double ratio) { return tone_level(rest.left, ratio * hz, kRate, at(4), at(6)); };
    const double whole = tone(2.0) + tone(3.0), metal = tone(2.756) + tone(5.404);
    const double struck = tone_level(early.left, 2.756 * hz, kRate, 0, at(0.1));
    EXPECT(struck > 1.0e-3, "a key starts as metal");
    if (bend == 1.0f) EXPECT(whole > 30.0 * metal, "bent all the way its overtones are whole numbers");
    if (bend == 1.0f) EXPECT(std::fabs(cents(device.overtone_hz(1, 1), 2.0 * hz)) < 2.0, "and in tune within 2 cents");
    if (bend == 0.0f) EXPECT(metal > 30.0 * whole, "not bent at all the metal stays");
    if (bend == 0.5f) EXPECT(metal < 0.02 * struck && whole < 0.02 * struck, "half bent it is at neither");
  }
}
static void test_goals() {
  for (int goal = 0; goal < 4; ++goal) {
    plain({{p::kGoal, static_cast<float>(goal)}, {p::kTravel, 0.15f}}), chord();
    render(device, 12.0f, kRate);
    EXPECT(device.moving_now() == 0, "everything has arrived");
    Range away, tones;
    for (int id = 1; id <= 5; ++id) {
      const double hz0 = note_hz(kChord[id - 1]);
      for (int k = 1; k <= count_overtones(id); ++k) {
        const double hz = device.overtone_hz(id, k);
        double off = 0.0;
        if (goal == p::kChord) off = off_chord(id, k, {50, 57, 65, 72, 76});
        if (goal == p::kOwn) off = hz < hz0 ? std::fabs(cents(hz, hz0 / 2)) : std::fabs(cents(hz, hz0 * std::round(hz / hz0)));
        if (goal == p::kOctaves) off = off_chord(id, k, {kChord[id - 1]});
        if (goal == p::kBass) off = std::fabs(cents(hz, note_hz(38) * std::round(hz / note_hz(38))));
        away.add(off), tones.add(hz);
      }
    }
    EXPECT(away.high < 2.0, "every overtone ends on a tone of its goal");
    if (goal == p::kBass) EXPECT(std::fabs(cents(tones.low, note_hz(38))) < 3.0, "the bass series has its own bass");
  }
}
static int most_moving(float seconds) {
  int most = 0;
  for (int i = 0; i < static_cast<int>(seconds * kRate / 64); ++i) device.process(64), most = std::max(most, device.moving_now());
  return most;
}
static void test_three_at_a_time() {
  for (float travel : {0.05f, 0.38f, 4.0f}) {
    for (float again : {-1.0f, 0.0f, 1.0f}) {
      plain({{p::kTravel, travel}, {p::kAgain, again}, {p::kRest, 0.1f}, {p::kOvertones, 19.0f}});
      chord(), chord(0.5f, 20);
      for (int i = 0; i < 4; ++i) device.note_on(40 + i, note_hz(45.0f + 5.0f * i), 0.7f);
      const int most = most_moving(5.0f);
      for (int i = 0; i < 4; ++i) device.note_off(40 + i);
      device.note_on(60, note_hz(62.0f), 0.8f);
      const int after = most_moving(2.0f);
      std::snprintf(label, sizeof label, "never more than three on their way (%d, %d, travel %.2f, again %.0f)", most, after, travel, again);
      EXPECT(most <= 3 && after <= 3 && most >= 2, label);
    }
  }
}
static void test_change_of_chord() {
  plain({{p::kTravel, 0.2f}});
  for (int i = 0; i < 3; ++i) device.note_on(1 + i, note_hz(57.0f + (i == 0 ? 0.0f : i == 1 ? 3.0f : 7.0f)), 0.7f);
  render(device, 8.0f, kRate);
  EXPECT(device.moving_now() == 0, "a held chord comes to rest");
  device.note_off(2), device.note_on(9, note_hz(62.0f), 0.7f);  // A C E becomes A D E
  const int moving = most_moving(0.6f);
  render(device, 9.0f, kRate);
  double worst = 0.0;
  for (int id : {1, 3, 9}) for (int k = 1; k <= count_overtones(id); ++k) raise(worst, off_chord(id, k, {57, 62, 64}));
  EXPECT(moving > 0 && worst < 2.0, "resting overtones leave for the new chord");
}
static void test_again() {
  for (float again : {0.0f, 0.8f, -0.8f}) {
    plain({{p::kTravel, 0.2f}, {p::kRest, 0.25f}, {p::kAgain, again}});
    device.note_on(2, 330.0f, 0.7f), play(220.0f, 0.7f, 25.0f);
    int moving = 0;
    for (int i = 0; i < 3000; ++i) device.process(128), moving += device.moving_now() > 0 ? 1 : 0;
    EXPECT(again == 0.0f ? moving == 0 : moving > 2000, "it rests for good, or never");
  }
  for (float again : {-0.3f, 1.0f, -1.0f}) {
    device.init(kRate), set({{p::kTravel, 0.05f}, {p::kRest, 0.1f}, {p::kAgain, again}, {p::kGlow, 1.0f},
         {p::kForward, 1.0f}, {p::kRing, 60.0f}, {p::kMaterial, p::kPlate}});
    chord();
    Stereo early = render(device, 10.0f, kRate);
    render(device, 40.0f, kRate);
    Stereo late = render(device, 10.0f, kRate);
    const double grew = db(level(late, 0, 10) / level(early, 4, 10));
    EXPECT(grew < 2.5 && loudest(late) < 0.6, "the level does not creep");
  }
}
static void test_order_and_forward() {
  for (float order : {0.0f, 1.0f}) {
    plain({{p::kOrder, order}, {p::kTravel, 1.5f}});
    play(220.0f, 0.7f, 0.05f);
    const int all = count_overtones(1);
    std::vector<float> start;
    for (int k = 1; k <= all; ++k) start.push_back(device.overtone_hz(1, k));
    render(device, 0.9f, kRate);
    int moved = -1;
    for (int k = 1; k <= all; ++k) if (std::fabs(cents(device.overtone_hz(1, k), start[k - 1])) > 1.0 && (moved < 0 || order > 0.5f)) moved = k;
    EXPECT(order < 0.5f ? moved <= 3 && moved > 0 : moved >= all - 1, "low ones first, or high ones first");
  }
  double loud[2];
  for (int i = 0; i < 2; ++i) {
    plain({{p::kForward, static_cast<float>(i)}, {p::kGlow, 0.5f}, {p::kRing, 1.0f}, {p::kTravel, 3.0f}}), chord();
    loud[i] = level(render(device, 3.5f, kRate), 2.0, 3.5);
  }
  EXPECT(db(loud[1] / loud[0]) > 4.0, "a travelling overtone comes forward");
}
static void test_envelopes() {
  double held[2];
  for (int i = 0; i < 2; ++i) {
    plain({{p::kGlow, i == 0 ? 0.3f : 1.0f}});
    held[i] = level(play(220.0f, 0.7f, 10.0f), 8, 10);
  }
  EXPECT(held[0] > 2.0e-4 && db(held[1] / held[0]) > 8.0, "Glow holds a key");
  plain({{p::kGlow, 0.0f}, {p::kRing, 1.0f}});
  Stereo died = play(220.0f, 0.7f, 6.0f);
  EXPECT(loudest(died) > 0.01 && peak(died.left, at(5)) == 0.0, "with no glow the metal dies to exact silence, held or not");
  plain({{p::kAttack, 2.0f}, {p::kRelease, 1.0f}});
  Stereo swell = play(220.0f, 0.7f, 3.0f);
  device.note_off(1);
  Stereo tail = render(device, 3.0f, kRate);
  EXPECT(level(swell, 0, 0.2) < 0.1 * level(swell, 2, 2.4), "a long attack swells");
  EXPECT_NEAR(rt60(tail.left, kRate, 0.0, 0.05), 1.0, 0.25, "Release is the time to -60 dB");
  double bright[4];
  for (int i = 0; i < 4; ++i) {
    plain({{p::kTouch, i == 1 ? 0.9f : 0.2f}});
    bright[i] = energy_above(play(220.0f, i == 3 ? 1.0f : 0.5f, 0.5f).left, 900.0, kRate);
  }
  EXPECT(bright[1] > 1.6 * bright[0] && bright[3] > 1.25 * bright[0], "touch and velocity change the timbre");
}
static double restlessness(const Stereo& s, double from, double to, double hz) {
  Range v;
  for (double t = from; t + 0.05 < to; t += 0.025) v.add(tone_level(s.left, hz, kRate, at(t), at(t + 0.05)));
  return db(v.high / std::max(v.low, 1.0e-7));
}
static void test_residue_and_manner() {
  double moves[4];
  for (int i = 0; i < 4; ++i) {
    plain({{p::kGoal, p::kOwn}, {p::kMaterial, p::kBar}, {p::kTravel, 0.3f}, {p::kSpread, 0.5f}});
    if (i == 1) device.set_param(p::kLeftover, 0.9f);
    if (i == 2) device.set_param(p::kManner, 1.0f);
    if (i == 3) device.set_param(p::kSwing, 1.0f);
    moves[i] = restlessness(play(440.0f, 0.8f, 9.0f), 5.0, 8.5, 1320.0);
  }
  EXPECT(moves[0] < 2.0, "with nothing left over an arrived overtone stands still");
  EXPECT(moves[1] > 6.0 && moves[2] > 12.0 && moves[3] > 6.0, "Leftover beats, Manner strikes, Swing sways");
  double line[2], beside[2];
  for (int i = 0; i < 2; ++i) {
    plain({{p::kAir, static_cast<float>(i)}});
    Stereo out = play(440.0f, 0.8f, 6.0f);
    line[i] = tone_level(out.left, 440.0, kRate, at(2), at(6)), beside[i] = 0.0;
    for (double d = 10.0; d < 40.0; d += 1.0) beside[i] += tone_level(out.left, 440.0 + d, kRate, at(2), at(6));
  }
  EXPECT(line[1] < 0.5 * line[0] && beside[1] > 20.0 * beside[0], "Air turns a tone into breath");
}
static void test_shared_tones_add() {
  // Two keys an octave apart: what they make of a tone is at least their power together.
  Range adds;
  for (float gap : {0.0f, 0.31f, 0.77f, 1.13f}) {
    double alone[2], both = 0.0;
    for (int pass = 0; pass < 3; ++pass) {
      plain({{p::kGoal, p::kOctaves}, {p::kTravel, 0.1f}, {p::kRing, 0.5f}});
      if (pass != 1) device.note_on(1, 220.0f, 0.7f);
      render(device, gap + 0.01f, kRate);
      if (pass != 0) device.note_on(2, 440.0f, 0.7f);
      Stereo out = render(device, 7.0f, kRate);
      (pass < 2 ? alone[pass] : both) = tone_level(out.left, 880.0, kRate, at(5), at(7));
    }
    adds.add(both / std::sqrt(alone[0] * alone[0] + alone[1] * alone[1]));
  }
  EXPECT(adds.low > 1.15, "keys that end on one tone add, and never cancel");
}
static double edge(const std::vector<float>& x, size_t from, size_t to) {
  double worst = 0.0;
  for (size_t i = from + 2; i < std::min(to, x.size()); ++i) raise(worst, std::fabs(static_cast<double>(x[i]) - 2.0 * x[i - 1] + x[i - 2]));
  return worst;
}
// The largest sixth difference: next to nothing of any tone is left in it.
static double click(std::vector<float> x, size_t from, size_t to) {
  for (int order = 0; order < 6; ++order) for (size_t i = to; i-- > from;) x[i] -= i > 0 ? x[i - 1] : 0.0f;
  double worst = 0.0;
  for (size_t i = from + 6; i < to; ++i) raise(worst, static_cast<double>(std::fabs(x[i])));
  return worst;
}
static void test_clicks() {
  // A low key that never rests, for every manner of going: a click would stand out.
  for (float manner : {-1.0f, -0.5f, 0.0f, 0.5f, 1.0f}) {
    plain({{p::kManner, manner}, {p::kTravel, 0.15f}, {p::kRest, 0.1f}, {p::kAgain, 1.0f}, {p::kForward, 1.0f}, {p::kGoal, p::kOwn}});
    Stereo out = play(55.0f, 0.8f, 5.0f);
    const double worst = click(out.left, at(1), at(5));
    out.left[at(3)] += 0.01f * static_cast<float>(loudest(out));  // one sample lifted by a hundredth of the peak
    EXPECT(click(out.left, at(1), at(5)) > 10.0 * worst, "nothing clicks on arriving");
  }
  plain({{p::kAttack, 0.02f}});
  for (int i = 0; i < 12; ++i) device.note_on(i, note_hz(40.0f + 4.0f * i), 0.7f);
  Stereo calm = render(device, 1.0f, kRate);
  for (int i = 0; i < 8; ++i) device.note_on(50 + i, note_hz(42.0f + 4.0f * i), 0.7f);
  device.note_on(3, note_hz(52.0f), 0.7f);
  Stereo taken = render(device, 0.1f, kRate);
  EXPECT(edge(taken.left, 0, at(0.1)) < 1.5 * edge(calm.left, at(0.03), at(1)), "a steal does not click");
  for (int id = 0; id < p::kNumParams; ++id) {
    plain({{p::kAttack, 0.05f}, {p::kGlint, 0.25f}}), chord(0.7f);
    Stereo before = render(device, 0.8f, kRate);
    double worst = 0.0;
    for (int turn = 0; turn < 6; ++turn) {
      device.set_param(id, turn & 1 ? p::kParamMin[id] : p::kParamMax[id]);
      Stereo out = render(device, 0.2f, kRate);
      EXPECT(finite(out.left) && finite(out.right), "finite while a knob is thrown");
      if (id != p::kVolume && id != p::kTilt) raise(worst, edge(out.left, 0, out.size()) / std::max(1.0, loudest(out) / loudest(before)));
    }
    std::snprintf(label, sizeof label, "knob %d thrown does not click (%.5f against %.5f)", id, worst, edge(before.left, at(0.06), at(0.8)));
    EXPECT(worst < 3.5 * edge(before.left, at(0.06), at(0.8)), label);
  }
}
static void test_ids() {
  device.init(kRate);
  device.set_param(p::kRelease, 0.3f);
  for (float hz : {220.0f, 330.0f, 220.0f}) play(hz, 0.7f, 0.1f);
  device.note_off(1);
  EXPECT(gone(4.0f), "one id at A, B and A again is let go by one off");
  device.init(kRate);
  device.note_on(2, 220.0f, 0.7f), play(220.0f, 0.7f, 1.0f);
  device.note_off(1);
  EXPECT(level(render(device, 4.0f, kRate), 3, 4) > 1.0e-3, "a pitch held by two ids stays while one holds it");
  device.note_off(2);
  EXPECT(gone(9.0f), "and goes with the last");
  device.note_on(5, 440.0f, 0.8f), device.note_off(5);
  EXPECT(loudest(render(device, 0.3f, kRate)) > 0.01, "a note let go at once is still struck");
  const float nan = std::numeric_limits<float>::quiet_NaN(), inf = std::numeric_limits<float>::infinity();
  const float absurd[7] = {nan, inf, -inf, 0.0f, -100.0f, 1.0e9f, 1.0e-9f};
  bool sound = true;
  for (int i = 0; i < 700; ++i) {
    const float hz = i % 13 == 0 ? absurd[(i / 13) % 7] : note_hz(static_cast<float>(30 + (i * 7) % 60));
    device.note_on(i % 17, hz, i % 29 == 0 ? absurd[(i / 29) % 7] : 0.3f + 0.01f * (i % 60));
    if (i % 3 == 0) device.note_off((i * 5) % 17);
    sound = sound && loudest(render(device, 0.002f, kRate, 1 + (i * 37) % 200)) < 1.01;
  }
  for (int i = 0; i < 17; ++i) device.note_off(i);
  EXPECT(sound && gone(9.0f), "nothing is left sounding after a storm of keys");
}
static double loud(float seconds) {
  Stereo out = render(device, seconds, kRate);
  Range v;
  for (double t = 0.0; t + 0.4 <= seconds; t += 0.2) v.add(db(level(out, t, t + 0.4)));
  return v.high;
}
static void test_room_and_makeup() {
  Range five, ten;
  for (int i = 0; i < 48; ++i) {
    device.init(kRate);
    const int n = i / 2;
    const float x = (n & 1) ? 1.0f : 0.0f, y = (n & 2) ? 1.0f : 0.0f;
    set({{p::kMaterial, static_cast<float>(n % 6)}, {p::kGoal, static_cast<float>((n / 2) % 4)}, {p::kForward, x}, {p::kGlow, 0.06f + 0.94f * y},
         {p::kRing, n % 3 == 0 ? 60.0f : 2.0f}, {p::kTouch, n % 5 == 0 ? 1.0f : 0.2f * x}, {p::kTilt, n % 4 < 2 ? 0.6f : -0.6f},
         {p::kAttack, n < 8 ? 0.004f : 0.6f}, {p::kTravel, n % 5 == 1 ? 6.0f : 0.15f}, {p::kOvertones, n % 7 < 3 ? 4.0f : 14.0f}});
    if (i & 1) ten.add(ten_keys(4.0f));
    else chord(), five.add(loud(4.0f));
  }
  std::printf("24 patches: chords from %.1f to %.1f dB, ten keys up to %.3f\n", five.low, five.high, ten.high);
  EXPECT(ten.high < 0.5, "ten hard keys are under the knee on every patch");
  EXPECT(five.low > -37.0 && five.high < -14.5, "no patch is faint and none is loud");
}
static void test_low_tones_in_step() {
  // Five keys send an overtone each to one low tone: it is as loud at any rate.
  Range low;
  for (float rate : {22050.0f, 44100.0f, 48000.0f, 96000.0f}) {
    plain({{p::kGoal, p::kBass}, {p::kMaterial, p::kBar}, {p::kOvertones, 3.0f}, {p::kGlow, 0.8f}, {p::kTilt, -0.8f}}, rate), chord();
    low.add(db(tone_level(render(device, 4.0f, rate).left, note_hz(38), rate, at(2, rate), at(4, rate))));
  }
  EXPECT(low.high - low.low < 0.6 && low.low > -40.0, "overtones of several keys arrive in step");
}
static void test_rest_glow_attack() {
  int leaves[2] = {0, 0};
  double struck[2], bright[3];
  for (int i = 0; i < 2; ++i) {
    plain({{p::kTravel, 0.1f}, {p::kAgain, 1.0f}, {p::kRest, i == 0 ? 0.3f : 3.0f}}), chord();
    render(device, 8.0f, kRate);
    for (int n = 0; n < 4000; ++n) device.process(128), leaves[i] += device.moving_now() > 0 ? 1 : 0;
    plain({{p::kGlow, i == 0 ? 0.35f : 1.0f}, {p::kTravel, 5.0f}, {p::kRing, 2.0f}});
    Stereo out = play(220.0f, 0.8f, 9.0f);
    struck[i] = db(level(out, 0.0, 0.3) / level(out, 8.0, 9.0));
  }
  EXPECT(leaves[0] > 4 * leaves[1] && leaves[1] > 20, "Rest is the pause between one that leaves and the next");
  EXPECT(struck[0] > struck[1] + 8.0, "full glow is sung and not struck");
  for (int i = 0; i < 3; ++i) {
    plain({{p::kAttack, i == 0 ? 0.003f : i == 1 ? 0.03f : 0.3f}, {p::kTouch, 0.7f}, {p::kTravel, 5.0f}});
    bright[i] = energy_above(play(220.0f, 0.8f, 0.8f).left, 1000.0, kRate, at(0.35), at(0.8));
  }
  EXPECT(bright[0] > 1.5 * bright[1] && bright[1] > 1.2 * bright[2], "a slower mallet is a softer one");
  plain({{p::kAttack, 1.0f}, {p::kGlow, 0.9f}});
  const double before = level(play(220.0f, 0.7f, 5.0f), 4, 5);
  Stereo again = play(220.0f, 0.7f, 1.2f);
  Range dip;
  for (double t = 0.0; t < 1.1; t += 0.05) dip.add(db(level(again, t, t + 0.05) / before));
  EXPECT(dip.low > -13.0, "a swelling key struck again goes on through it");
}
static double side(const Stereo& s) {  // of the middle
  double wide = 0.0, middle = 0.0;
  for (size_t i = 0; i < s.size(); ++i) wide += std::pow(s.left[i] - s.right[i], 2.0), middle += std::pow(s.left[i] + s.right[i], 2.0);
  return std::sqrt(wide / middle);
}
static void test_every_knob() {
  for (int id = 0; id < p::kNumParams; ++id) {
    Stereo ends[2];
    for (int i = 0; i < 2; ++i) {
      device.init(kRate);
      device.set_param(id, i == 0 ? p::kParamMin[id] : p::kParamMax[id]), chord();
      ends[i] = render(device, 6.0f, kRate);
      for (int key = 1; key <= 5; ++key) device.note_off(key);
      ends[i] = concat(ends[i], render(device, 1.5f, kRate));
    }
    if (id == p::kSpread) EXPECT(side(ends[0]) < 0.02 && side(ends[1]) > 0.3, "Spread goes from the middle to both sides");
    if (id == p::kTilt) EXPECT(energy_above(ends[1].left, 900.0, kRate) > 1.6 * energy_above(ends[0].left, 900.0, kRate), "Tilt goes from dark to bright");
    if (id == p::kGlint) EXPECT(energy_above(ends[1].left, 1500.0, kRate) > 1.3 * energy_above(ends[0].left, 1500.0, kRate), "a glint is bright");
    const double most = level(id == p::kVolume ? ends[1] : ends[0], 0, 7.5);
    for (size_t i = 0; i < ends[0].size(); ++i) ends[0].left[i] -= ends[1].left[i], ends[0].right[i] -= ends[1].right[i];
    std::snprintf(label, sizeof label, "knob %d is heard (%.2f)", id, level(ends[0], 0, 7.5) / most);
    EXPECT(level(ends[0], 0, 7.5) > 0.15 * most, label);
  }
  for (int material = 0; material < 6; ++material) {  // three overtones of 60 Hz end far under what a knock reaches
    plain({{p::kMaterial, static_cast<float>(material)}, {p::kOvertones, 3.0f}, {p::kTouch, 0.9f}, {p::kAttack, 0.003f}});
    Stereo out = play(60.0f, 0.9f, 0.1f);
    double high = 0.0;
    for (double hz = 1500.0; hz < 4000.0; hz += 100.0) high += tone_level(out.left, hz, kRate, 0, at(0.04));
    EXPECT(high > 5.0e-4, "every metal knocks");
  }
}
static Stereo piece(int block) {
  device.init(kRate), set({{p::kAir, 0.5f}, {p::kAgain, 0.5f}, {p::kRelease, 0.4f}});
  Stereo out;
  const size_t events[5] = {0, 24000, 48128, 201728, 249984};
  for (int e = 0; e < 4; ++e) {
    if (e == 0) chord();
    if (e == 1) device.note_on(1, 300.0f, 0.5f);
    for (int i = 1; e == 2 && i <= 5; ++i) device.note_off(i);
    if (e == 2) device.set_param(p::kTilt, 0.4f);
    if (e == 3) device.note_on(9, 180.0f, 0.9f);
    out = concat(out, render(device, static_cast<float>(events[e + 1] - events[e]) / kRate, kRate, block));
  }
  return out;
}
static void test_blocks_rates_levels() {
  const Stereo whole = piece(128), single = piece(1), large = piece(2048);
  EXPECT(whole.left == single.left && whole.right == single.right, "blocks of 1 give the same, across a silence");
  EXPECT(whole.left == large.left && whole.right == large.right, "blocks of 2048 give the same, across a silence");
  EXPECT(peak(whole.left, 196000, 201000) == 0.0, "the silence between is exact");
  double base = 0.0;
  for (float rate : {48000.0f, 44100.0f, 96000.0f}) {
    plain({}, rate), chord(0.7f);
    Stereo out = render(device, 5.0f, rate);
    const double v = db(level(out, 1, 5, rate));
    const double pitch = dominant_frequency(out.left, rate, 145.0, 149.0, at(3, rate), at(5, rate));
    if (rate == 48000.0f) base = v;
    EXPECT(std::fabs(v - base) < 0.7 && std::fabs(cents(pitch, note_hz(50))) < 3.0, "the same level and pitch at every rate");
  }
  Range keys;
  for (int midi = 36; midi <= 84; midi += 6) {
    device.init(kRate);
    Stereo out = play(note_hz(static_cast<float>(midi)), 0.7f, 4.0f);
    const double top = db(loudest(out));
    keys.add(db(level(out, 0, 4)));
    EXPECT(top > -24.0 && top < -10.0, "one note peaks between -24 and -10 dBFS");
  }
  EXPECT(keys.high - keys.low < 4.5, "the keyboard is even");
  device.init(kRate);
  EXPECT(ten_keys(8.0f) < 0.5, "ten keys stay under the knee");
}

int main() {
  Conformance spec;
  spec.name = "slow-accord", spec.num_params = p::kNumParams, spec.tail_seconds = 9.0f, spec.max_peak = 1.01f;
  spec.mins = p::kParamMin, spec.maxs = p::kParamMax, spec.defaults = p::kParamDefault;
  check_instrument(device, spec, kRate);
  for (auto test : {test_the_note_stays, test_metal_becomes_series, test_goals, test_three_at_a_time, test_change_of_chord,
                    test_again, test_order_and_forward, test_envelopes, test_residue_and_manner, test_shared_tones_add,
                    test_clicks, test_ids, test_room_and_makeup, test_low_tones_in_step, test_rest_glow_attack, test_every_knob, test_blocks_rates_levels}) test();
  device.init(kRate);
  for (int i = 0; i < 8; ++i) device.note_on(i, note_hz(45.0f + 4.0f * i), 0.7f);
  report_cost("slow-accord", 10.0f, kRate, [] { render(device, 10.0f, kRate); });
  return finish("slow-accord");
}
