// Native harness for Clock Room (cpp/devices/clock-room). The conformance pass
// covers silence, stealing, parameter abuse and other sample rates; the rest
// measures the idea: a key is struck as it goes down, each clock keeps time,
// the wall brings the clocks together in four ways, and a spring runs down.

#include "../devices/clock-room/clock_room.h"

#include <limits>

#include "support/test_kit.h"

using namespace testkit;
using livemix::ClockRoom;
namespace p = livemix::clock_room;

static ClockRoom device;
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
static void hold_chord(float gain = 0.7f) {
  for (int i = 0; i < 5; ++i) device.note_on(i + 1, note_hz(static_cast<float>(kChord[i])), gain);
}
static Stereo played(const std::vector<Knob>& knobs, const std::vector<int>& keys, float gain, float seconds, float rate = kRate) {
  patch(knobs, rate);
  int id = 0;
  for (int key : keys) device.note_on(++id, note_hz(static_cast<float>(key)), gain);
  return render(device, seconds, rate);
}
static Stereo chord(const std::vector<Knob>& knobs, float seconds) { return played(knobs, {50, 57, 65, 72, 76}, 0.7f, seconds); }
static std::vector<float> mid_of(const Stereo& s) {
  std::vector<float> out(s.left.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (s.left[i] + s.right[i]);
  return out;
}
static double centroid(const std::vector<float>& x, size_t from, size_t to) {
  double sum = 0.0, weighed = 0.0;
  for (double hz = 100.0; hz < 8000.0; hz *= 1.12) {
    const double share = energy_above(x, hz, kRate, from, to) - energy_above(x, hz * 1.12, kRate, from, to);
    sum += share;
    weighed += share * hz;
  }
  return weighed / std::max(sum, 1.0e-12);
}
// Nothing but plain strikes: no rub, no swing, no late rise, no second rod.
static const std::vector<Knob> kPlain = {{p::kGlow, 0.0f}, {p::kSwing, 0.0f}, {p::kBloom, 0.0f}, {p::kSecond, 0.0f},
                                         {p::kTick, 0.0f}, {p::kUnlike, 0.0f}, {p::kTrue, 1.0f}};
static std::vector<Knob> plain(std::initializer_list<Knob> more) {
  std::vector<Knob> knobs = kPlain;
  knobs.insert(knobs.end(), more);
  return knobs;
}

// Where strikes start: 10 ms windows that rise past the one 30 ms before.
static std::vector<double> onsets(const std::vector<float>& x, double rise = 1.4) {
  const size_t hop = at(0.005), size = at(0.01);
  std::vector<double> level, out;
  for (size_t i = 0; i + size <= x.size(); i += hop) level.push_back(rms(x, i, i + size) + 1.0e-5);
  double last = -1.0;
  for (size_t i = 6; i < level.size(); ++i) {
    const double t = static_cast<double>(i * hop) / kRate;
    if (level[i] > rise * level[i - 6] && level[i] > 1.0e-3 && t - last > 0.12) out.push_back(last = t);
  }
  return out;
}

static void test_pitch() {
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    double worst = 0.0;
    for (int key : {38, 60, 84}) {
      if (rate != kRate && key != 60) continue;
      for (float gong : {0.0f, 1.0f, 4.0f}) {
        if (gong > 0.0f && key != 60) continue;
        const double hz = note_hz(static_cast<float>(key));
        Stereo out = played(plain({{p::kStrikes, 0.0f}, {p::kGong, gong}, {p::kGlow, 0.3f}}), {key}, 0.7f, 1.8f, rate);
        worst = std::max(worst, std::fabs(cents(dominant_frequency(out.left, rate, hz * 0.985, hz * 1.015, at(0.6, rate)), hz)));
      }
    }
    std::snprintf(label, sizeof label, "a key is in tune at %.0f Hz (worst %.2f ct)", rate, worst);
    std::printf("%s\n", label);
    EXPECT(worst < 3.0, label);
  }
  // True: the upper tones lie on whole ratios, or where raw metal has them.
  Stereo just = played(plain({{p::kTrue, 1.0f}, {p::kHammer, 0.7f}}), {57}, 0.7f, 1.2f);
  Stereo raw = played(plain({{p::kTrue, 0.0f}, {p::kHammer, 0.7f}}), {57}, 0.7f, 1.2f);
  const double third = 660.0;
  EXPECT(tone_level(just.left, third, kRate, at(0.1), at(1.0)) > 4.0 * tone_level(raw.left, third, kRate, at(0.1), at(1.0)), "True puts the twelfth on the note");
  EXPECT(tone_level(raw.left, 220.0 * 3.31, kRate, at(0.1), at(1.0)) > 4.0 * tone_level(just.left, 220.0 * 3.31, kRate, at(0.1), at(1.0)),
         "raw metal has it higher");
  // Interval moves the second rod, gliding.
  std::vector<Knob> two = plain({{p::kSecond, 1.0f}, {p::kInterval, 7.0f}, {p::kHammer, 0.1f}});
  Stereo fifth = played(two, {57}, 0.7f, 1.0f);
  EXPECT(tone_level(fifth.left, 330.0 * std::exp2(-1.955 / 1200.0) * 0.99999, kRate, at(0.1), at(1.0)) > 0.002, "the second rod stands a fifth up");
}

static void test_strikes() {
  Stereo one = played({}, {57}, 0.7f, 0.5f);
  EXPECT(rms(one.left, 0, at(0.05)) > 0.004, "a key sounds as it goes down");
  // A lone clock keeps its own time.
  Stereo alone = played(plain({{p::kEscapement, 2.0f}, {p::kBeat, 2.0f}, {p::kStrikes, 1.0f}, {p::kDecay, 0.8f}}), {60}, 0.8f, 5.0f);
  const std::vector<double> times = onsets(mid_of(alone));
  EXPECT(times.size() >= 8 && times.size() <= 11, "two strikes a second");
  for (size_t i = 2; i < times.size(); ++i) EXPECT_NEAR(times[i] - times[i - 1], 0.5, 0.02, "each half a second after the last");
  Stereo none = played(plain({{p::kStrikes, 0.0f}, {p::kDecay, 0.8f}, {p::kBeat, 2.0f}}), {60}, 0.8f, 3.0f);
  EXPECT(rms(none.left, at(2.0)) < 1.0e-4, "with Strikes at zero only the key strikes");
  // Harder is louder and brighter.
  Stereo soft = played({{p::kStrikes, 0.0f}}, {57}, 0.2f, 1.0f), hard = played({{p::kStrikes, 0.0f}}, {57}, 1.0f, 1.0f);
  EXPECT(loudest(hard) > 5.0 * loudest(soft), "velocity is level");
  const double dull = centroid(soft.left, 0, at(0.8)), bright = centroid(hard.left, 0, at(0.8));
  std::printf("centroid at 0.2: %.0f, at 1: %.0f\n", dull, bright);
  EXPECT(bright > 1.12 * dull, "and colour");
  Stereo felt = chord({{p::kHammer, 0.0f}, {p::kCase, 1.0f}}, 1.0f), brass = chord({{p::kHammer, 1.0f}, {p::kCase, 1.0f}}, 1.0f);
  EXPECT(centroid(brass.left, 0, at(0.8)) > 1.25 * centroid(felt.left, 0, at(0.8)), "Hammer goes from dull to bright");
  // Bloom: the upper part is stronger half a second on than at the strike.
  double late[2];
  for (int i = 0; i < 2; ++i) {
    Stereo out = played({{p::kStrikes, 0.0f}, {p::kGlow, 0.0f}, {p::kSwing, 0.0f}, {p::kGong, 4.0f}, {p::kCase, 1.0f}, {p::kBloom, i ? 0.9f : 0.0f}}, {50}, 0.9f, 2.5f);
    late[i] = energy_above(out.left, 700.0, kRate, at(0.8), at(1.6)) / (energy_above(out.left, 700.0, kRate, 0, at(0.15)) + 1.0e-9);
  }
  std::printf("late over early: %.2f without Bloom, %.2f with\n", late[0], late[1]);
  EXPECT(late[1] > 2.2 * late[0], "Bloom brings the upper tones late");
  // Rub: nothing much at first, then it swells and is held.
  Stereo rubbed = played({{p::kEscapement, 4.0f}, {p::kGlow, 0.6f}, {p::kSwing, 0.0f}}, {57}, 0.8f, 5.0f);
  EXPECT(rms(rubbed.left, at(3.0), at(5.0)) > 1.6 * rms(rubbed.left, 0, at(0.2)) && rms(rubbed.left, 0, at(0.1)) > 5.0e-4, "a rub swells");
}

static double agreement_after(int wall, float learn, float seconds) {
  patch({{p::kWall, static_cast<float>(wall)}, {p::kLearn, learn}, {p::kUnlike, 0.5f}, {p::kBeat, 1.0f}});
  hold_chord();
  render(device, seconds, kRate);
  double sum = 0.0;
  for (int i = 0; i < 20; ++i) {
    render(device, 0.1f, kRate);
    sum += device.meter(ClockRoom::kMeterAgreement) / 20.0;
  }
  return sum;
}
// The level of a chord's strikes as it swings: how deep the troughs are.
static double unevenness(const std::vector<float>& x, double from, double to) {
  double top = 0.0, sum = 0.0;
  int count = 0;
  for (double t = from; t + 0.05 < to; t += 0.05, ++count) {
    const double now = rms(x, at(t), at(t + 0.05));
    top = std::max(top, now);
    sum += now;
  }
  return top / (sum / count);
}

static void test_wall() {
  for (int wall = 0; wall < 4; ++wall) {
    const double learnt = agreement_after(wall, 1.0f, 3.0f), apart = agreement_after(wall, 0.0f, 3.0f);
    std::snprintf(label, sizeof label, "wall %d: agreement %.2f with Learn, %.2f without", wall, learnt, apart);
    std::printf("%s\n", label);
    EXPECT(learnt > 0.85 && learnt > apart + 0.15, label);
  }
  // A clock hung late falls in.
  patch({{p::kLearn, 0.8f}, {p::kUnlike, 0.0f}});
  device.note_on(1, note_hz(50), 0.7f);
  render(device, 1.37f, kRate);
  device.note_on(2, note_hz(64), 0.7f);
  render(device, 3.0f, kRate);
  EXPECT(device.meter(ClockRoom::kMeterAgreement) > 0.95f, "a clock hung late falls in within three seconds");
  // In step a chord strikes as one, splayed it spreads the swing.
  const std::vector<int> keys = {57, 60, 64, 67};
  std::vector<Knob> knobs = plain({{p::kEscapement, 2.0f}, {p::kLearn, 1.0f}, {p::kStrikes, 1.0f}, {p::kDecay, 0.5f}, {p::kBeat, 1.0f}, {p::kGong, 1.0f}});
  double uneven[4];
  for (int wall = 0; wall < 4; ++wall) {
    knobs.push_back({p::kWall, static_cast<float>(wall)});
    uneven[wall] = unevenness(mid_of(played(knobs, keys, 0.8f, 8.0f)), 4.0, 8.0);
  }
  std::printf("peak over mean: step %.2f opposed %.2f splayed %.2f chain %.2f\n", uneven[0], uneven[1], uneven[2], uneven[3]);
  EXPECT(uneven[0] > 1.25 * uneven[2], "in step the strikes fall together, splayed they share the swing");
  EXPECT(uneven[1] < 0.75 * uneven[0] && uneven[3] < 0.75 * uneven[0], "opposed they fall in two halves, chained one after another");
  // Splayed, a clock is struck at a place of its own, where some of its tones hardly move.
  livemix::ClockVoice clock;
  livemix::ClockWall::Manner manner;
  manner.comb = 1.0f;
  clock.slot = 0.4f;
  double least = 9.0, most = 0.0;
  for (float ratio = 2.0f; ratio < 9.0f; ratio += 1.0f) {
    const double wakes = livemix::ClockWall::struck_at(clock, manner, ratio);
    least = std::min(least, wakes);
    most = std::max(most, wakes);
  }
  EXPECT(most > 4.0 * least, "splayed clocks are struck at places of their own");
  // Opposed, the halves stand to the sides.
  Stereo step = chord({{p::kWidth, 1.0f}}, 4.0f), opposed = chord({{p::kWidth, 1.0f}, {p::kWall, 1.0f}}, 4.0f);
  EXPECT(correlation(step.left, step.right, at(2.0)) > correlation(opposed.left, opposed.right, at(2.0)) + 0.15, "opposed is wider than in step");
  Stereo mono = chord({{p::kWidth, 0.0f}, {p::kWall, 1.0f}}, 1.0f);
  bool same = true;
  for (size_t i = 0; i < mono.left.size(); ++i) same = same && std::fabs(mono.left[i] - mono.right[i]) < 1.0e-5f;
  EXPECT(same, "with Width at zero all is in the middle");
}

static void test_springs() {
  Stereo wound = chord({{p::kRunDown, 0.0f}}, 8.0f), spent = chord({{p::kRunDown, 1.0f}, {p::kDecay, 2.0f}}, 8.0f);
  EXPECT(rms(spent.left, at(6.0)) < 0.05 * rms(wound.left, at(6.0)), "a spring runs down");
  device.note_on(1, note_hz(50), 0.7f);
  EXPECT(rms(render(device, 0.5f, kRate).left) > 0.003, "the key winds it again");
  double left[2];
  for (int i = 0; i < 2; ++i) {
    chord({{p::kHush, i ? 1.0f : 0.0f}}, 1.0f);
    for (int k = 0; k < 5; ++k) device.note_off(k + 1);
    left[i] = rms(render(device, 1.5f, kRate).left, at(0.8));
  }
  EXPECT(left[0] > 0.002 && left[1] < 0.02 * left[0], "Hush stills a gong that is let go");
  double ticks[2];
  for (int i = 0; i < 2; ++i) ticks[i] = energy_above(chord({{p::kTick, i ? 1.0f : 0.0f}, {p::kGlow, 0.0f}}, 3.0f).left, 1000.0, kRate, at(1.0));
  EXPECT(ticks[1] > 1.5 * ticks[0], "Tick brings the clockwork up");
  // The pendulum is heard in the level of what it rubs.
  double swung[2];
  for (int i = 0; i < 2; ++i) {
    swung[i] = unevenness(mid_of(played({{p::kEscapement, 4.0f}, {p::kSwing, i ? 1.0f : 0.0f}, {p::kBeat, 0.8f}, {p::kGlow, 0.5f}}, {57}, 0.8f, 7.0f)), 3.0, 7.0);
  }
  EXPECT(swung[1] > 1.2 * swung[0], "Swing makes a rub breathe");
}

static void test_levels() {
  double low = 0.0, high = -100.0;
  for (int key = 36; key <= 84; key += 6) {
    const double level = db(loudest(played({}, {key}, 0.7f, 2.0f)));
    low = std::min(low, level);
    high = std::max(high, level);
  }
  std::printf("a key at 0.7 peaks from %.1f to %.1f dB\n", low, high);
  EXPECT(low > -24.5 && high < -10.0, "one level over the keyboard");
  for (float gong : {0.0f, 4.0f}) {
    patch({{p::kGong, gong}});
    const int keys[10] = {45, 52, 57, 60, 64, 67, 71, 74, 76, 81};
    for (int i = 0; i < 10; ++i) device.note_on(i, note_hz(static_cast<float>(keys[i])), 1.0f);
    const double top = loudest(render(device, 6.0f, kRate));
    std::printf("ten keys at 1: %.1f dB\n", db(top));
    EXPECT(top < 0.5, "ten keys at full force have room");
  }
  // However bright the metal, the hammer and the case: no burst.
  for (float gong = 0.0f; gong < 5.0f; gong += 1.0f) {
    for (float where = 0.0f; where < 4.0f; where += 1.0f) {
      for (float kind : {0.0f, 4.0f}) {
        const double top = loudest(chord({{p::kGong, gong}, {p::kCase, where}, {p::kEscapement, kind}, {p::kHammer, 1.0f}, {p::kGlow, 1.0f}, {p::kBloom, 1.0f}}, 1.6f));
        std::snprintf(label, sizeof label, "gong %.0f case %.0f escapement %.0f peaks at %.2f", gong, where, kind, top);
        EXPECT(top < 0.8, label);
      }
    }
  }
  // Held for a long time it comes to one level.
  patch({{p::kGlow, 1.0f}, {p::kBeat, 5.0f}, {p::kDecay, 30.0f}, {p::kStrikes, 1.0f}});
  hold_chord();
  render(device, 20.0f, kRate);
  const double first = rms(render(device, 5.0f, kRate).left);
  render(device, 20.0f, kRate);
  const double later = rms(render(device, 5.0f, kRate).left);
  EXPECT(later < 1.3 * first && later > 0.7 * first, "a wall that strikes forever comes to one level");
}

// What a sound is like: its level in twelve bands over four stretches, in dB of the whole.
static std::vector<double> print_of(const Stereo& s) {
  const std::vector<float> x = mid_of(s);
  std::vector<double> out(48, 0.0);
  double whole = 0.0;
  for (int b = 0; b < 12; ++b) {
    livemix::kit::Svf filter[2];
    for (auto& one : filter) one.set(60.0f * std::exp2(0.6f * static_cast<float>(b)), 2.5f, kRate);
    for (size_t i = 0; i < x.size(); ++i) {
      const double y = filter[1].bandpass(filter[0].bandpass(x[i]));
      out[static_cast<size_t>(b) + 12 * (i * 4 / x.size())] += y * y;
      whole += y * y;
    }
  }
  for (double& v : out) v = std::max(10.0 * std::log10(v / whole + 1.0e-12), -50.0);
  return out;
}
static double apart(const std::vector<double>& a, const std::vector<double>& b) {
  double sum = 0.0;
  for (size_t i = 0; i < a.size(); ++i) sum += std::fabs(a[i] - b[i]);
  return sum / static_cast<double>(a.size());
}

static void test_characters() {
  // Every choice is a character of its own, and about as loud as the others.
  const struct { int id, count; double least, spread; } kinds[4] = {
      {p::kEscapement, 5, 3.0, 7.0}, {p::kWall, 4, 3.0, 5.0}, {p::kGong, 5, 3.0, 10.0}, {p::kCase, 4, 3.0, 7.0}};
  for (const auto& kind : kinds) {
    std::vector<std::vector<double>> prints;
    double low = 100.0, high = -100.0, nearest = 100.0;
    for (int c = 0; c < kind.count; ++c) {
      Stereo out = chord({{kind.id, static_cast<float>(c)}}, 4.0f);
      prints.push_back(print_of(out));
      const double level = db(rms(mid_of(out)));
      low = std::min(low, level);
      high = std::max(high, level);
    }
    for (size_t a = 0; a < prints.size(); ++a) {
      for (size_t b = 0; b < a; ++b) nearest = std::min(nearest, apart(prints[a], prints[b]));
    }
    std::snprintf(label, sizeof label, "knob %d: nearest two choices %.1f dB apart, levels over %.1f dB", kind.id, nearest, high - low);
    std::printf("%s\n", label);
    EXPECT(nearest > kind.least && high - low < kind.spread, label);
  }
  // One sound at every rate.
  const std::vector<Knob> sharp = {{p::kEscapement, 2.0f}, {p::kWall, 2.0f}, {p::kLearn, 1.0f}, {p::kGong, 1.0f}, {p::kHammer, 0.5f}, {p::kBloom, 0.2f}, {p::kTick, 0.0f}};
  double levels[3], peaks[3];
  const float rates[3] = {24000.0f, 48000.0f, 96000.0f};
  for (int r = 0; r < 3; ++r) {
    Stereo out = played(sharp, {50, 57, 65, 72, 76}, 0.7f, 1.0f, rates[r]);
    levels[r] = db(rms(out.left));
    peaks[r] = db(loudest(out));
  }
  std::printf("at 24, 48 and 96 kHz: %.1f %.1f %.1f dB, peaks %.1f %.1f %.1f\n", levels[0], levels[1], levels[2], peaks[0], peaks[1], peaks[2]);
  EXPECT(std::fabs(levels[0] - levels[1]) < 0.8 && std::fabs(levels[2] - levels[1]) < 0.5, "a strike is as loud at every rate");
  EXPECT(peaks[1] - levels[1] < 22.0, "and is no bare crack");
  // Velocity turns the hammer, whatever the level: the fifth's upper tones against the note.
  double colour[2];
  for (int i = 0; i < 2; ++i) {
    Stereo out = played(plain({{p::kStrikes, 0.0f}, {p::kCase, 1.0f}}), {57}, i ? 1.0f : 0.25f, 0.6f);
    colour[i] = tone_level(out.left, 880.0, kRate, at(0.05), at(0.5)) / tone_level(out.left, 220.0, kRate, at(0.05), at(0.5));
  }
  EXPECT(colour[1] > 1.5 * colour[0], "a harder touch wakes more of the fourth tone");
  // A key let go before the chime's answer has none.
  patch(plain({{p::kEscapement, 3.0f}, {p::kStrikes, 1.0f}, {p::kBeat, 0.5f}, {p::kHush, 1.0f}, {p::kSecond, 1.0f}}));
  device.note_on(1, 220.0f, 0.8f);
  render(device, 0.4f, kRate);
  device.note_off(1);
  EXPECT(rms(render(device, 1.5f, kRate).left, at(0.5)) < 1.0e-4, "a key that is let go does not answer");
  Stereo answered = played(plain({{p::kEscapement, 3.0f}, {p::kStrikes, 1.0f}, {p::kBeat, 0.5f}, {p::kDecay, 1.0f}, {p::kSecond, 1.0f}}), {57}, 0.8f, 1.5f);
  EXPECT(rms(answered.left, at(1.0), at(1.2)) > 3.0 * rms(answered.left, at(0.8), at(0.95)), "a key that is held does");
  // Deadbeat's brake: the same depth in every swing, slow or fast.
  double falls[2];
  for (float beat : {0.5f, 2.0f}) {
    double fall[2];
    for (int kind = 1; kind < 3; ++kind) {
      Stereo out = played(plain({{p::kEscapement, static_cast<float>(kind)}, {p::kStrikes, 1.0f}, {p::kBeat, beat}, {p::kDecay, 20.0f}, {p::kGong, 1.0f}, {p::kHammer, 0.1f}}), {57}, 0.8f, 4.0f);
      double top = 0.0, bottom = 1.0;
      for (double t = 2.0; t < 3.95; t += 0.02) {
        const double now = rms(out.left, at(t), at(t + 0.03));
        top = std::max(top, now);
        bottom = std::min(bottom, now);
      }
      fall[kind - 1] = db(top / bottom);
    }
    std::snprintf(label, sizeof label, "at %.1f swings a second deadbeat falls %.0f dB, anchor %.0f", beat, fall[1], fall[0]);
    std::printf("%s\n", label);
    EXPECT(fall[1] > fall[0] + 12.0 && fall[1] < 85.0, label);
    falls[beat > 1.0f ? 1 : 0] = fall[1];
  }
  EXPECT(std::fabs(falls[0] - falls[1]) < 25.0, "whatever the beat");
  // Unlike sets their own rates apart: with no wall, the swing of a pair drifts.
  double drift[2];
  for (int i = 0; i < 2; ++i) {
    patch({{p::kLearn, 0.0f}, {p::kUnlike, i ? 1.0f : 0.0f}, {p::kBeat, 2.0f}});
    hold_chord();
    double least = 1.0, most = 0.0;
    for (int t = 0; t < 60; ++t) {
      render(device, 0.1f, kRate);
      const double now = device.meter(ClockRoom::kMeterAgreement);
      least = std::min(least, now);
      most = std::max(most, now);
    }
    drift[i] = most - least;
  }
  EXPECT(drift[0] < 0.02 && drift[1] > 0.3, "Unlike lets clocks drift");
  // A clock that strikes for long stays in tune.
  Stereo struck = played(plain({{p::kBeat, 5.0f}, {p::kStrikes, 1.0f}, {p::kHammer, 0.05f}, {p::kDecay, 10.0f}}), {69}, 0.8f, 6.0f);
  const double off = cents(dominant_frequency(struck.left, kRate, 432.0, 448.0, at(3.0)), 440.0);
  std::printf("struck ten times a second: %.2f ct\n", off);
  EXPECT(std::fabs(off) < 2.0, "a clock that strikes for long stays in tune");
  // Ten keys hold their level: a full wall is not ten times one.
  const double one = rms(played({}, {60}, 0.7f, 2.0f).left), ten = rms(played({}, {45, 52, 57, 60, 64, 67, 71, 74, 76, 81}, 0.7f, 2.0f).left);
  std::printf("ten keys against one: %.1f dB\n", db(ten / one));
  EXPECT(db(ten / one) < 11.5, "a full wall makes room");
  // The rub's tones come and go by themselves.
  Stereo rubbed = played({{p::kEscapement, 4.0f}, {p::kSwing, 0.0f}, {p::kStrikes, 0.0f}, {p::kSecond, 0.0f}, {p::kGlow, 0.7f}, {p::kLearn, 0.0f}, {p::kBloom, 0.0f}}, {57}, 0.8f, 10.0f);
  double lowest = 1.0, highest = 0.0;
  for (double t = 3.0; t < 9.5; t += 0.25) {
    const double now = tone_level(rubbed.left, 440.0, kRate, at(t), at(t + 0.4));
    lowest = std::min(lowest, now);
    highest = std::max(highest, now);
  }
  EXPECT(highest > 1.6 * lowest, "each tone of a rub comes and goes");
  Stereo wide = chord({}, 3.0f);
  std::vector<float> side(wide.left.size());
  for (size_t i = 0; i < side.size(); ++i) side[i] = 0.5f * (wide.left[i] - wide.right[i]);
  const double width = db(rms(side) / rms(mid_of(wide)));
  std::printf("side under middle: %.1f dB\n", width);
  EXPECT(width > -14.0 && width < -4.0, "a chord stands across the wall");
}

// The highs of the loudest 2 ms: a click is a burst of them.
static double burst(const std::vector<float>& x) {
  double top = 0.0;
  float a = x[2], b = x[1], c = x[0];
  double sum = 0.0;
  size_t n = 0;
  for (size_t i = 3; i < x.size(); ++i) {  // a third difference, which is steep in the highs
    const float v = x[i];
    const double d = v - 3.0f * a + 3.0f * b - c;
    c = b;
    b = a;
    a = v;
    sum += d * d;
    if (++n == 96) {
      top = std::max(top, std::sqrt(sum / 96.0));
      sum = 0.0;
      n = 0;
    }
  }
  return top;
}
static void test_clicks() {
  const std::vector<Knob> calm = {{p::kHammer, 0.1f}, {p::kGlow, 0.4f}, {p::kTick, 0.0f}, {p::kBloom, 0.2f}};
  patch(calm);
  hold_chord();
  render(device, 2.0f, kRate);
  const double still = burst(render(device, 2.0f, kRate).left);
  double worst = 0.0;
  for (int id : {p::kEscapement, p::kWall, p::kGong, p::kCase, p::kInterval, p::kTrue, p::kDecay, p::kVolume, p::kWidth, p::kSecond, p::kSwing, p::kGlow}) {
    patch(calm);
    hold_chord();
    render(device, 2.0f, kRate);
    double top = 0.0;
    const bool steps = id == p::kEscapement || id == p::kWall || id == p::kGong || id == p::kCase;
    for (int i = 0; i < (steps ? static_cast<int>(p::kParamMax[id]) + 1 : 4); ++i) {
      device.set_param(id, steps ? static_cast<float>(i) : (i % 2 ? p::kParamMax[id] : p::kParamMin[id]));
      top = std::max(top, burst(render(device, 0.11f, kRate).left));
    }
    std::snprintf(label, sizeof label, "knob %d moved under a chord: %.1f dB over stillness", id, db(top / still));
    worst = std::max(worst, top / still);
    EXPECT(top < 0.0024, label);
  }
  std::printf("worst of the moves: %.1f dB over stillness (%.5f)\n", db(worst), still);
  // Steals and restrikes of soft keys: nothing sharper than a strike itself.
  patch(calm);
  const double own = burst(played(calm, {57}, 0.7f, 0.3f).left);
  patch(calm);
  for (int i = 0; i < 12; ++i) device.note_on(i, note_hz(static_cast<float>(40 + 3 * i)), 0.7f);
  render(device, 1.0f, kRate);
  double top = 0.0;
  for (int i = 0; i < 12; ++i) {
    device.note_on(20 + i, note_hz(static_cast<float>(41 + 3 * i)), 0.7f);
    top = std::max(top, burst(render(device, 0.05f, kRate).left));
  }
  EXPECT(top < 6.0 * own + 0.002, "a stolen clock does not click");
  // Nor does one that a key hardly touched takes: there is no strike to hide it.
  patch({{p::kHammer, 0.0f}, {p::kStrikes, 0.0f}, {p::kTick, 0.0f}, {p::kBloom, 0.0f}, {p::kGlow, 0.0f}, {p::kDecay, 20.0f}});
  for (int i = 0; i < 12; ++i) device.note_on(i, note_hz(static_cast<float>(45 + 2 * i)), 0.8f);
  render(device, 1.5f, kRate);
  const double ringing = burst(render(device, 0.5f, kRate).left);
  top = 0.0;
  for (int i = 0; i < 12; ++i) {
    device.note_on(20 + i, note_hz(static_cast<float>(46 + 2 * i)), 0.01f);
    top = std::max(top, burst(render(device, 0.05f, kRate).left));
  }
  std::printf("soft steals: %.1f dB over the ringing\n", db(top / ringing));
  EXPECT(top < 4.0 * ringing + 1.0e-5, "nor one taken by a soft key");
  patch(calm);
  top = 0.0;
  for (int i = 0; i < 30; ++i) {
    device.note_on(1, note_hz(57), 0.7f);
    top = std::max(top, burst(render(device, 0.017f + 0.003f * static_cast<float>(i % 5), kRate).left));
  }
  EXPECT(top < 3.0 * own + 0.001, "nor does a key struck again and again");
}

static void test_sweeps() {
  double top = 0.0;
  bool fine = true;
  for (int id = 0; id < p::kNumParams; ++id) {
    patch({{p::kGlow, 0.5f}, {p::kTick, 0.4f}});
    hold_chord();
    for (int i = 0; i < 30; ++i) {
      const float u = 0.5f + 0.5f * static_cast<float>(std::sin(i * 0.42));
      device.set_param(id, p::kParamMin[id] + u * (p::kParamMax[id] - p::kParamMin[id]));
      Stereo out = render(device, 0.03f, kRate);
      fine = fine && finite(out.left) && finite(out.right);
      top = std::max(top, loudest(out));
    }
  }
  std::printf("loudest in every sweep: %.2f\n", top);
  EXPECT(fine && top < 0.95, "every knob can be swept under a chord");
}

static void test_keys() {
  for (int round = 0; round < 2; ++round) {
    patch({{p::kHush, 0.9f}, {p::kDecay, 1.0f}});
    device.note_on(7, 220.0f, 0.7f);
    render(device, round ? 0.001f : 0.4f, kRate);
    device.note_on(7, 330.0f, 0.7f);
    render(device, round ? 0.001f : 0.4f, kRate);
    device.note_on(7, 220.0f, 0.7f);
    render(device, 0.4f, kRate);
    device.note_off(7);
    render(device, 5.0f, kRate);
    EXPECT(loudest(render(device, 0.2f, kRate)) == 0.0, "one id at A, B and A again is let go by one off");
  }
  patch({{p::kHush, 1.0f}, {p::kDecay, 1.0f}, {p::kHammer, 0.2f}});
  device.note_on(1, 220.0f, 0.7f);
  device.note_off(1);
  EXPECT(rms(render(device, 0.1f, kRate).left) > 1.0e-3, "a key let go before it was heard is heard");
  render(device, 4.0f, kRate);
  EXPECT(loudest(render(device, 0.2f, kRate)) == 0.0, "and ends");
  Stereo woken[2];
  for (Stereo& out : woken) {  // asleep the first time, new the second
    for (int id : {p::kGlow, p::kWidth, p::kTick}) device.set_param(id, p::kParamMax[id]);
    hold_chord();
    out = render(device, 0.4f, kRate);
    patch({{p::kHush, 1.0f}, {p::kDecay, 1.0f}, {p::kHammer, 0.2f}});
  }
  EXPECT(woken[0].left == woken[1].left, "a key after a silence is a key on a new instrument");
  patch({});
  device.note_on(1, std::nanf(""), 0.7f);
  EXPECT(loudest(render(device, 0.2f, kRate)) == 0.0, "a note that is no number is no note");
  for (float hz : {0.0f, -5.0f, 1.0e9f, std::numeric_limits<float>::infinity()}) device.note_on(2, hz, std::nanf(""));
  Stereo odd = render(device, 0.5f, kRate);
  EXPECT(finite(odd.left) && loudest(odd) < 1.0, "absurd notes are survived");
  // Block sizes, across a silence.
  Stereo runs[3];
  const int sizes[3] = {1, 128, 2048};
  for (int r = 0; r < 3; ++r) {
    patch({{p::kHush, 1.0f}, {p::kDecay, 0.6f}, {p::kTick, 0.5f}, {p::kEscapement, 0.0f}});
    hold_chord();
    Stereo out = render(device, 24.0f * 2048.0f / kRate, kRate, sizes[r]);
    for (int i = 0; i < 5; ++i) device.note_off(i + 1);
    out = concat(out, render(device, 100.0f * 2048.0f / kRate, kRate, sizes[r]));
    EXPECT(peak(out.left, out.size() - 2048) == 0.0, "silent in between");
    device.set_param(p::kGong, 2.0f);
    device.set_param(p::kWall, 2.0f);
    hold_chord();
    runs[r] = concat(out, render(device, 24.0f * 2048.0f / kRate, kRate, sizes[r]));
  }
  EXPECT(runs[0].left == runs[1].left && runs[1].left == runs[2].left && runs[0].right == runs[2].right, "block sizes change nothing");
}

int main() {
  Conformance spec;
  spec.name = "clock-room";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 16.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec);
  test_pitch();
  test_strikes();
  test_wall();
  test_springs();
  test_levels();
  test_characters();
  test_clicks();
  test_sweeps();
  test_keys();
  patch({});
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::exp2(static_cast<float>(n) * 3 / 12.0f), 0.7f);
  report_cost("clock-room, 8 held notes", 5.0f, kRate, [] { render(device, 5.0f, kRate); });
  return finish("clock-room");
}
