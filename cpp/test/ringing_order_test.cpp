// Native harness for Ringing Order (cpp/devices/ringing-order). Conformance
// first; the rest measures what makes it a ring: overtones that take turns in
// an order, neighbours that change places, keys that share one clock, blows
// that overlap. Nobody has listened to it: every claim below is a number.

#include <cfloat>
#include <limits>
#include <utility>

#include "../kit/kit.h"
#define private public  // the denormal check reads the state of every ringer
#include "../devices/ringing-order/ringing_order.h"
#undef private
#include "support/test_kit.h"

using namespace testkit;
using livemix::RingingOrder;
namespace p = livemix::ringing_order;

static RingingOrder device;
static const float kRate = 48000.0f;

using Set = std::vector<std::pair<int, float>>;

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }
static float key(double midi) { return static_cast<float>(440.0 * std::pow(2.0, (midi - 69.0) / 12.0)); }
static double both_peak(const Stereo& x) { return std::max(peak(x.left), peak(x.right)); }
static void open(const Set& set, float rate = kRate) {
  device.init(rate);
  for (const auto& knob : set) device.set_param(knob.first, knob.second);
}
static void keys(int count, double lowest, double step, float gain) {
  for (int k = 0; k < count; ++k) device.note_on(k, key(lowest + step * k), gain);
}
static void off(int count) {
  for (int k = 0; k < count; ++k) device.note_off(k);
}
static Stereo wait(double seconds) { return render(device, static_cast<float>(seconds), kRate); }
static Stereo play(int id, double midi, float gain, double seconds) {
  device.note_on(id, key(midi), gain);
  return wait(seconds);
}
static bool gone() { return both_peak(wait(3.0)) < 1.0 && both_peak(wait(0.5)) == 0.0; }
static Stereo chord(const Set& set, float seconds, std::vector<double> notes = {50, 57, 65, 72, 76}, float gain = 0.6f, float rate = kRate) {
  open(set, rate);
  int id = 1;
  for (double note : notes) device.note_on(id++, key(note), gain);
  return render(device, seconds, rate);
}
static std::vector<float> mono(Stereo x) {
  for (size_t i = 0; i < x.size(); ++i) x.left[i] = 0.5f * (x.left[i] + x.right[i]);
  return x.left;
}
// The lowest and the highest of a level read every `step` seconds.
template <typename Level>
static std::pair<double, double> range(double from, double to, double step, Level level) {
  std::pair<double, double> out{1.0e9, 0.0};
  for (double t = from; t < to; t += step) {
    out.first = std::min(out.first, level(t));
    out.second = std::max(out.second, level(t));
  }
  return out;
}
static double moves(std::pair<double, double> r) { return db(r.second / r.first); }
// The largest second difference: a click stands out of it.
static double bend(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  double most = 0.0;
  for (size_t i = std::max<size_t>(from, 2); i < to; ++i) {
    most = std::max(most, std::fabs(static_cast<double>(x[i]) - 2.0 * x[i - 1] + x[i - 2]));
  }
  return most;
}

// A key whose ringers can be told apart: plain tones, dry and even.
static const Set kBare = {{p::kMethod, 0.0f}, {p::kOverlap, 0.35f}, {p::kRow, 2.0f},  {p::kCover, 0.0f},
                          {p::kMuffle, 0.0f}, {p::kBite, 0.0f},     {p::kBody, 0.0f}, {p::kBeat, 0.0f},
                          {p::kTilt, 0.0f},   {p::kGap, 0.0f},      {p::kSwing, 0.0f}, {p::kAttack, 0.003f},
                          {p::kPlace, 0.0f},  {p::kRingers, 5.0f},  {p::kWeight, 0.0f}};
static Set bare(const Set& more) {
  Set set = kBare;
  for (const auto& knob : more) set.push_back(knob);
  return set;
}

// When the harmonic's level rises most within [from, to): its blow.
static double blow_time(const std::vector<float>& x, double hz, double from, double to) {
  double best = -1.0, best_at = from, before = 1.0;
  for (double t = from; t < to; t += 0.02) {
    const double level = tone_level(x, hz, kRate, at(t), at(t + 0.05));
    if (level - before > best) best_at = t + 0.025;
    best = std::max(best, level - before);
    before = level;
  }
  return best_at;
}

static std::vector<int> order_of_row(const std::vector<float>& x, double f0, double from, double to) {
  std::vector<std::pair<double, int>> blows;
  for (int h = 1; h <= 5; ++h) blows.push_back({blow_time(x, f0 * h, from, to), h});
  std::sort(blows.begin(), blows.end());
  return {blows[0].second, blows[1].second, blows[2].second, blows[3].second, blows[4].second};
}

static void test_conformance() {
  Conformance spec;
  spec.name = "ringing-order", spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin, spec.maxs = p::kParamMax, spec.defaults = p::kParamDefault;
  spec.tail_seconds = 6.0f, spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);
}

// The order is the matter: what rings when.
static void test_orders() {
  const double f0 = 220.0;
  const std::vector<float> hunt = mono(chord(bare({{p::kMethod, 1.0f}}), 8.0f, {57}, 0.7f));
  const std::vector<int> first = order_of_row(hunt, f0, 2.0 - 0.06, 3.95);
  const std::vector<int> second = order_of_row(hunt, f0, 4.0 - 0.06, 5.95);
  EXPECT(first == (std::vector<int>{2, 1, 4, 3, 5}), "the second row of Hunt is the first with its pairs swapped");
  EXPECT(second == (std::vector<int>{2, 4, 1, 5, 3}), "and the third goes on from there by the other pairs");

  const std::vector<float> rounds = mono(chord(bare({{p::kMethod, 0.0f}, {p::kRow, 4.0f}}), 9.0f, {57}, 0.7f));
  EXPECT(order_of_row(rounds, f0, 4.0 - 0.06, 6.0) == (std::vector<int>{5, 4, 3, 2, 1}), "Rounds fall from the highest");
  EXPECT(db(rms(rounds, at(4.0), at(5.4)) / rms(rounds, at(6.6), at(8.0))) > 12.0, "and are left to ring out for the rest of the row");

  const std::vector<float> lines = mono(chord(bare({{p::kMethod, 4.0f}}), 5.0f, {57}, 0.7f));
  auto near = [&](double hz, double from) { return tone_level(lines, hz, kRate, at(from), at(from + 0.4)); };
  const double low_early = near(f0, 1.95), high_early = near(f0 * 5, 1.95), middle = near(f0 * 3, 2.65);
  EXPECT(low_early > 4e-4 && high_early > 2e-4 && middle > 3.0 * low_early,
         "Contrary begins with the lowest and the highest and grows to where they cross");
}

// Overlap: by default most ringers sound at any moment, so it is no arpeggio.
static void test_overlap() {
  const Set plain = {{p::kCover, 0.0f}, {p::kBody, 0.0f}, {p::kBite, 0.0f}, {p::kBeat, 0.0f}, {p::kVoice, 0.0f}};
  const std::vector<float> x = mono(chord(plain, 10.0f, {57}, 0.7f));
  const int harmonics[7] = {1, 2, 3, 4, 5, 6, 8};
  double sounding = 0.0, frames = 0.0;
  for (int h : harmonics) {
    const auto level = [&](double t) { return tone_level(x, 220.0 * h, kRate, at(t), at(t + 0.15)); };
    const double most = range(3.2, 9.8, 0.1, level).second;
    for (double t = 3.2; t < 9.8; t += 0.1, frames += 1.0) sounding += level(t) > most * 0.063 ? 1.0 : 0.0;  // within 24 dB
  }
  std::printf("overlap: %.0f%% of the ringers sound at a time\n", 100.0 * sounding / frames);
  EXPECT(sounding / frames > 0.6, "at the defaults over 60 % of the ringers sound at any moment");

  auto hollow = [](float overlap) {
    const std::vector<float> y = mono(chord(bare({{p::kMethod, 1.0f}, {p::kOverlap, overlap}}), 6.0f, {57}, 0.7f));
    return moves(range(2.2, 5.9, 0.05, [&](double t) { return rms(y, at(t), at(t + 0.05)); }));
  };
  const double parted = hollow(0.0f), fused = hollow(1.0f);
  std::printf("overlap: level moves %.1f dB at 0 and %.1f dB at 1\n", parted, fused);
  EXPECT(parted > 20.0 && fused < 12.0, "Overlap goes from separate blows to one swell");
}

// At the defaults each overtone has its turn, and the chord does not pump.
static void test_turns() {
  const std::vector<float> x = mono(chord({{p::kBite, 0.0f}, {p::kBody, 0.0f}}, 14.0f, {57}, 0.7f));
  int moving = 0;
  for (int h : {1, 2, 3, 4, 5, 6, 8}) {
    const auto level = [&](double t) { return tone_level(x, 220.0 * h, kRate, at(t), at(t + 0.2)); };
    moving += moves(range(3.0, 13.7, 0.2, level)) > 8.0 ? 1 : 0;
  }
  EXPECT(moving >= 6, "each overtone comes forward and goes back by 8 dB and more");
  const std::vector<float> y = mono(chord({}, 13.5f));
  const double pumps = moves(range(0.1, 13.0, 0.5, [&](double t) { return rms(y, at(t), at(t + 0.5)); }));
  std::printf("turns: %d of 7 overtones move; the chord's level moves %.1f dB\n", moving, pumps);
  EXPECT(pumps < 8.5, "and the chord's level moves by less than 8.5 dB");
  // A key that comes in anywhere in the row speaks at once.
  std::vector<double> first;
  for (int q = 0; q < 8; ++q) {
    open({{p::kCover, 0.0f}});
    play(1, 38, 0.02f, 3.0 + 0.4 * q);
    first.push_back(rms(mono(play(2, 74, 0.8f, 0.3))));
  }
  const auto speaks = range(0.0, 8.0, 1.0, [&](double q) { return first[static_cast<size_t>(q)]; });
  std::printf("turns: a key's first 0.3 s varies by %.1f dB over the row\n", moves(speaks));
  EXPECT(moves(speaks) < 5.0 && db(speaks.first) > -42.0, "a key speaks at once wherever the row is");
}

// Tower: one clock for all keys.
static void test_tower() {
  auto shares = [](float tower) {  // how much the two keys' levels move against each other, dB
    const std::vector<float> x =
        mono(chord(bare({{p::kMethod, 0.0f}, {p::kTower, tower}, {p::kRow, 1.0f}, {p::kRingers, 3.0f}}), 8.0f, {57, 64}, 0.7f));
    double same = 0.0, swing = 0.0, count = 0.0;
    for (double t = 2.0; t < 7.8; t += 0.5, count += 1.0) {
      const auto level = [&](double hz) { return db(tone_level(x, hz, kRate, at(t), at(t + 0.5)) + 1e-5); };
      same += level(220.0) - level(329.63);
      swing += std::fabs(level(220.0) - level(329.63));
    }
    return swing / count - std::fabs(same) / count;
  };
  const double together = shares(0.0f), opposed = shares(2.0f), turns = shares(3.0f);
  std::printf("tower: keys part by %.1f dB together, %.1f opposed, %.1f in turn\n", together, opposed, turns);
  EXPECT(together < 2.5 && opposed > together + 4.0 && turns > together + 4.0, "Opposed and In turn part the keys, Together does not");

  const auto side = [](const Stereo& x, double t) { return db(rms(x.left, at(t), at(t + 0.9)) / rms(x.right, at(t), at(t + 0.9))); };
  // A lone key under Opposed answers itself: it rings every row, side after side.
  const Stereo lone = chord(bare({{p::kTower, 2.0f}, {p::kPlace, 1.0f}, {p::kRow, 1.0f}, {p::kMethod, 1.0f}}), 8.0f, {69}, 0.7f);
  for (double t = 2.0; t < 5.5; t += 1.0) {
    EXPECT(std::fabs(side(lone, t) - side(lone, t + 1.0)) > 4.0, "a lone Opposed key goes from side to side");
  }

  const Stereo sides = chord({{p::kTower, 2.0f}, {p::kPlace, 1.0f}, {p::kCover, 0.0f}, {p::kGap, 0.0f}, {p::kRow, 1.0f}, {p::kOverlap, 0.4f}}, 8.0f, {57, 64}, 0.7f);
  double left = 0.0;
  for (double t = 2.0; t < 7.5; t += 1.0) left = std::max(left, std::fabs(side(sides, t)));
  EXPECT(left > 4.0, "Opposed keys answer from two sides");
}

static void test_crossing() {
  // D4 and A4 share A5: with Crossing the two owners take turns and do not stack.
  auto shared = [](float crossing) {
    double most = 0.0;
    const std::vector<float> x = mono(chord(bare({{p::kMethod, 1.0f}, {p::kOverlap, 0.9f}, {p::kTower, 1.0f}, {p::kCrossing, crossing}, {p::kRow, 1.0f}}), 8.0f, {62, 69}, 0.7f));
    for (double t = 2.0; t < 7.5; t += 0.2) most += tone_level(x, 880.6, kRate, at(t), at(t + 0.4));
    return most;
  };
  const double off = shared(0.0f), on = shared(1.0f);
  std::printf("crossing: shared overtone %.1f dB lower\n", db(off / on));
  EXPECT(off > 1.1 * on, "Crossing keeps a shared overtone to one owner");
}

static void test_muffle_cover_touch() {
  // Half muffled: every second row is an echo of the first.
  const std::vector<float> half = mono(chord(bare({{p::kMuffle, 0.5f}, {p::kMethod, 1.0f}, {p::kBody, 0.5f}}), 9.0f, {57}, 0.7f));
  const auto top = [](const std::vector<float>& x, double from) {
    return energy_above(x, 1500.0, kRate, at(from), at(from + 1.8)) * std::pow(rms(x, at(from), at(from + 1.8)), 2);
  };
  const double open_row = top(half, 4.1), back_row = top(half, 2.1);
  std::printf("muffle: back row %.1f dB under above 1.5 kHz\n", 10.0 * std::log10(open_row / back_row));
  EXPECT(open_row > 4.0 * back_row, "half muffled, every second row is dull");
  const std::vector<float> full = mono(chord(bare({{p::kMuffle, 1.0f}, {p::kMethod, 1.0f}, {p::kBody, 0.5f}}), 6.0f, {57}, 0.7f));
  EXPECT(top(full, 4.1) < 0.3 * open_row, "full muffled, both are");

  const std::vector<float> covered = mono(chord(bare({{p::kCover, 1.0f}, {p::kRingers, 3.0f}, {p::kSeries, 3.0f}}), 6.0f, {57}, 0.7f));
  const auto tone = range(1.0, 5.5, 0.25, [&](double t) { return tone_level(covered, 220.0, kRate, at(t), at(t + 0.5)); });
  EXPECT(tone.first > 0.004 && moves(tone) < 8.0, "the covering tone stays under the ring");

  const std::vector<float> soft = mono(chord({}, 4.0f, {57}, 0.25f)), hard = mono(chord({}, 4.0f, {57}, 1.0f));
  std::printf("touch: share above 1 kHz %.3f soft, %.3f hard\n", energy_above(soft, 1000.0, kRate), energy_above(hard, 1000.0, kRate));
  EXPECT(energy_above(hard, 1000.0, kRate) > 1.8 * energy_above(soft, 1000.0, kRate), "a hard touch is brighter");
  EXPECT(rms(hard) > 2.5 * rms(soft), "and louder");
}

static void test_series_and_tune() {
  // Chord tones: a D rings the A that is held with it, an octave of which is in no series of D alone here.
  const Set chords = bare({{p::kSeries, 4.0f}, {p::kRingers, 8.0f}, {p::kMethod, 1.0f}, {p::kOverlap, 0.8f}});
  open(chords);
  const Stereo lone = play(1, 62, 0.7f, 4.0);
  const Stereo two = play(2, 65, 0.02f, 4.0);  // F, played so softly that only D's ringers are heard
  const auto heard = [](const Stereo& x, double note) { return tone_level(x.left, key(note), kRate, at(2), at(4)); };
  const double before = heard(lone, 77) + heard(lone, 65), after = heard(two, 77) + heard(two, 65);
  EXPECT(after > 8.0 * before && after > 1e-3, "Chord tones: a key rings the other keys that are held");

  for (int voice = 0; voice < RingingOrder::kNumKinds; ++voice) {
    if (voice == RingingOrder::kBreath) continue;  // a band of air has no line to measure
    const Stereo x = chord({{p::kVoice, static_cast<float>(voice)}, {p::kBeat, 0.0f}}, 5.0f, {57}, 0.7f);
    EXPECT_NEAR(1200.0 * std::log2(dominant_frequency(x.left, kRate, 212.0, 228.0) / 220.0), 0.0, 2.0, "in tune in every voice");
  }
  std::vector<double> levels;
  for (double note = 36; note <= 84; note += 6) {
    const Stereo x = chord({}, 5.0f, {note}, 0.7f);
    levels.push_back(db(rms(x.left)));
    EXPECT(db(both_peak(x)) > -24.0 && db(both_peak(x)) < -10.0, "one note at 0.7 peaks between -24 and -10 dBFS");
  }
  EXPECT(*std::max_element(levels.begin(), levels.end()) - *std::min_element(levels.begin(), levels.end()) < 4.0, "level even from C2 to C6");
  const Stereo ten = chord({}, 6.0f, {41, 48, 52, 57, 60, 64, 67, 71, 74, 79}, 1.0f);
  EXPECT(both_peak(ten) < 0.56, "ten keys stay about the clip's knee");
}

static void test_clicks() {
  const int moved[] = {p::kMethod, p::kVoice, p::kSeries, p::kTower, p::kRingers, p::kTilt, p::kBody, p::kCover,
                       p::kPlace,  p::kBeat,  p::kCrossing, p::kMuffle, p::kOverlap, p::kGap, p::kRow, p::kVolume};
  for (int id : moved) {
    double worst = 0.0;
    for (int way = 0; way < 2; ++way) {
      open({{p::kBite, 0.0f}, {id, way ? p::kParamMax[id] : p::kParamMin[id]}});
      keys(4, 50, 7, 0.6f);
      const Stereo before = wait(2.5);
      device.set_param(id, way ? p::kParamMin[id] : p::kParamMax[id]);
      // Voice and Series change a ringer when it is next rung: the jump is watched over a row.
      const Stereo jump = concat(before, render(device, id == p::kVoice || id == p::kSeries ? 1.8f : 0.06f, kRate));
      const Stereo after = wait(2.5);
      const double still = std::max(bend(before.left, at(0.2)), bend(after.left));
      worst = std::max(worst, bend(jump.left, before.size()) / still);
    }
    EXPECT(worst < 1.7, "a knob jumped while sounding does not click");
  }
  // A restrike, held and let go, is no harder than the first strike.
  open({{p::kBite, 0.0f}});
  const Stereo first = play(1, 57, 0.8f, 1.0), again = play(1, 57, 0.8f, 1.0);
  device.note_off(1);
  wait(0.3);
  const Stereo back = play(1, 57, 0.8f, 1.0);
  EXPECT(bend(again.left) < 1.6 * bend(first.left) && bend(back.left) < 1.6 * bend(first.left), "restrikes do not click");
  // Keys taken from a full pool.
  open({{p::kBite, 0.0f}});
  Stereo run;
  for (int i = 0; i < 40; ++i) run = concat(run, play(i, 45 + (i * 7) % 36, 0.8f, 0.08));
  EXPECT(bend(run.left, at(1.0)) < 3.0 * bend(run.left, 0, at(0.9)), "keys taken from others do not click");
  // A stolen key is down to nothing before it is turned into another, at every rate.
  for (float rate : {44100.0f, 96000.0f}) {
    for (bool released : {false, true}) {
      double worst = 0.0;
      for (int turn = 0; turn < 8; ++turn) {
        open({{p::kBite, 0.0f}, {p::kAttack, 0.05f}, {p::kRelease, 3.0f}}, rate);
        keys(12, 40, 3, 0.8f);
        render(device, 1.0f + 0.013f * static_cast<float>(turn), rate);
        off(released ? 12 : 0);
        const Stereo still = render(device, 0.3f + 0.0037f * static_cast<float>(turn), rate);
        device.note_on(99, key(45), 0.8f);
        worst = std::max(worst, bend(render(device, 0.03f, rate).left) / bend(still.left, still.size() / 2));
      }
      EXPECT(worst < 1.35, "a steal does not step");
    }
  }
  // A key struck again takes the new touch, in its sound as well.
  open({});
  play(1, 57, 0.2f, 3.0);
  device.note_off(1);
  const double bright = energy_above(play(1, 57, 1.0f, 5.0).left, 1000.0, kRate);
  EXPECT(bright > 0.75 * energy_above(chord({}, 5.0f, {57}, 1.0f).left, 1000.0, kRate), "a soft key struck hard again is as bright as a hard one");
}

static void test_every_knob_sweeps() {
  double most = 0.0;
  for (int id = 0; id < p::kNumParams; ++id) {
    open({});
    keys(3, 45, 12, 0.8f);
    for (int step = 0; step <= 40; ++step) {
      const float t = static_cast<float>(step) / 40.0f;
      device.set_param(id, p::kParamMin[id] + (p::kParamMax[id] - p::kParamMin[id]) * t);
      const Stereo x = wait(0.05);
      most = std::max(most, finite(x.left) && finite(x.right) ? both_peak(x) : 99.0);
    }
  }
  EXPECT(most < 1.0, "every knob swept while sounding stays a sound");
}

static void test_notes() {
  open({});
  const float nan = std::nanf(""), inf = std::numeric_limits<float>::infinity();
  for (float hz : {nan, inf, -inf, 0.0f, 5.0f, 20000.0f, -3.0f}) {
    for (float gain : {nan, inf, 0.0f, 2.0f, -1.0f}) device.note_on(7, hz, gain);
  }
  const Stereo odd = wait(0.5);
  EXPECT(finite(odd.left) && both_peak(odd) <= 1.0, "absurd notes are survived");
  // One id at A, at E and at A again, then off once: nothing stays.
  open({{p::kRelease, 0.3f}});
  for (double note : {57, 64, 57}) play(1, note, 0.8f, 0.15);
  device.note_off(1);
  EXPECT(gone(), "A, B and A again with one off leave nothing");
  // The same inside a steal.
  keys(12, 48, 1, 0.8f);
  wait(0.1);
  for (float hz : {700.0f, 800.0f, 700.0f}) device.note_on(99, hz, 0.9f);
  wait(0.2);
  off(12);
  device.note_off(99);
  EXPECT(gone(), "and inside a steal");
  keys(12, 48, 1, 0.8f);
  wait(0.1);
  off(12);
  device.note_on(99, 700.0f, 0.9f);
  keys(12, 48, 1, 0.8f);
  device.note_on(98, 900.0f, 0.9f);
  device.note_off(98);  // before it has begun
  device.note_off(99);
  off(12);
  EXPECT(gone(), "a key let go while it waits for a voice is let go");
}

// Nothing closes in on zero for ever: no denormal in the state of a held key or a tail.
static long denormals() {
  long count = 0;
  auto look = [&](float v) { count += v != 0.0f && std::fabs(v) < FLT_MIN ? 1 : 0; };
  for (const auto& voice : device.voices_) {
    if (!voice.sounding) continue;
    for (float v : {voice.env, voice.accent, voice.accent_now, voice.burst_now, voice.front, voice.level_now}) look(v);
    for (float v : voice.cover_live) look(v);
    for (int q = 0; q < 4; ++q) {
      for (const auto& g : voice.groups) for (float v : {g.left[q], g.right[q], g.left_step[q], g.right_step[q]}) look(v);
    }
    for (int q = 0; q < 8; ++q) {
      for (const auto& r : voice.ringers) for (float v : {r.amp[q], r.live[q], r.noise_a[q], r.noise_b[q], r.pan}) look(v);
    }
  }
  return count;
}
static void test_denormals() {
  for (const auto& move : Set{{p::kBody, 0.0f}, {p::kCover, 0.0f}, {p::kVoice, 2.0f}, {p::kPlace, 0.0f}, {p::kTower, 3.0f}}) {
    open({});
    keys(4, 45, 9, 0.7f);
    wait(1.0);
    device.set_param(move.first, move.second);
    long count = 0;
    for (int i = 0; i < 160; ++i) {
      if (i == 120) off(4);
      wait(0.05);
      count += denormals();
    }
    EXPECT(count == 0, "no denormals");
  }
}

// The same audio at blocks of 1, 128 and 2048, with a sleep in the middle and
// knobs moved while asleep.
static void test_blocks() {
  std::vector<Stereo> runs;
  for (int block : {128, 1, 7, 2048}) {
    open({{p::kVoice, 4.0f}, {p::kRelease, 0.2f}});
    keys(2, 57, 7, 0.7f);
    Stereo x = render(device, 0.512f, kRate, block);
    off(2);
    x = concat(x, render(device, 1.024f, kRate, block));
    device.set_param(p::kTilt, 2.0f);
    device.set_param(p::kVoice, 0.0f);
    x = concat(x, render(device, 0.512f, kRate, block));
    device.note_on(3, 440.0f, 0.7f);
    x = concat(x, render(device, 0.512f, kRate, block));
    runs.push_back(x);
  }
  for (int r = 1; r < 4; ++r) EXPECT(runs[0].left == runs[r].left && runs[0].right == runs[r].right, "block size is not heard");
}

static void test_rates_and_hold() {
  const double here = db(rms(chord({{p::kBite, 0.7f}}, 4.0f).left));
  for (float rate : {44100.0f, 96000.0f}) {
    EXPECT_NEAR(db(rms(chord({{p::kBite, 0.7f}}, 4.0f, {50, 57, 65, 72, 76}, 0.6f, rate).left)), here, 0.5, "as loud at every rate");
  }
  open({});
  play(1, 57, 0.8f, 4.0);
  const double early = db(rms(wait(13.0).left));
  wait(100.0);
  const double late = db(rms(wait(13.0).left));
  EXPECT_NEAR(late, early, 2.0, "a key held for two minutes neither creeps nor sinks");
}

int main() {
  for (auto test : {test_conformance, test_orders, test_overlap, test_turns, test_tower, test_crossing, test_muffle_cover_touch,
                    test_series_and_tune, test_clicks, test_every_knob_sweeps, test_notes, test_blocks, test_denormals, test_rates_and_hold}) {
    test();
  }
  open({});
  keys(8, 38, 5, 0.7f);
  report_cost("ringing-order", 10.0f, kRate, [] { wait(10.0); });
  return finish("ringing-order");
}
