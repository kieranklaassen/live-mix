// Native harness for Turned Time (cpp/devices/turned-time). The conformance
// pass covers silence, stealing, parameter abuse and other sample rates; the
// rest measures what makes it time that is turned: the palindrome, the turn
// by a key, by emptiness and by letting go, the four necks, the split, the
// pitch that stays true all the while, and the faults instruments have had.

#include "../devices/turned-time/turned_time.h"
#include <limits>

#include "support/test_kit.h"

using namespace testkit;
using livemix::TurnedTime;
namespace p = livemix::turned_time;

static TurnedTime device;
static const float kRate = 48000.0f;
static char label[200];

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }
static double loudest(const Stereo& s) { return std::max(peak(s.left), peak(s.right)); }
static float note_hz(float midi) { return 440.0f * std::exp2((midi - 69.0f) / 12.0f); }
static std::vector<float> mid(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (s.left[i] + s.right[i]);
  return out;
}
static double level(const std::vector<float>& x, double hz, double seconds, double window = 0.1) {
  return db(tone_level(x, hz, kRate, at(seconds - 0.5 * window), at(seconds + 0.5 * window)));
}

// A glass that is easy to read: no beat, no grains, no wandering levels.
static void plain(float sand = 2.0f) {
  device.init(kRate);
  device.set_param(p::kBeat, 0.0f);
  device.set_param(p::kGrains, 0.0f);
  device.set_param(p::kExchange, 0.0f);
  device.set_param(p::kEars, 0.0f);
  device.set_param(p::kStagger, 0.0f);
  device.set_param(p::kInertia, 0.0f);
  device.set_param(p::kMemory, 1.0f);
  device.set_param(p::kStrike, 0.0f);
  device.set_param(p::kSettling, 0.0f);
  device.set_param(p::kFrame, 120.0f);
  device.set_param(p::kSand, sand);
}

static void test_palindrome() {
  // With Exchange and the overtones' own fading at work, the levels on the
  // way back are the levels on the way out, met in the opposite order.
  plain(2.0f);
  device.set_param(p::kExchange, 0.6f);
  device.note_on(1, 440.0f, 0.8f);
  const auto x = mid(render(device, 5.0f, kRate));
  double worst = 0.0;
  for (double partial : {1.0, 2.0, 3.0}) {
    for (double t : {0.4, 0.7, 1.0, 1.3}) {
      worst = std::max(worst, std::fabs(level(x, 440.0 * partial, t) - level(x, 440.0 * partial, 4.0 - t)));
    }
  }
  std::printf("palindrome: levels out and back differ by at most %.2f dB\n", worst);
  EXPECT(worst < 2.5, "the way back is the way out, walked backwards");
  EXPECT(level(x, 440.0, 2.0) < level(x, 440.0, 0.2) - 12.0, "and it did fade in between");

  // The pitch is true in both directions, and the phases always advance.
  for (int body = 0; body < TurnedTime::kNumBodies; ++body) {
    plain(2.0f);
    device.set_param(p::kBody, static_cast<float>(body));
    device.set_param(p::kDepth, 0.2f);
    device.note_on(1, 440.0f, 0.8f);
    const auto y = mid(render(device, 4.0f, kRate));
    const double out = dominant_frequency(y, kRate, 425.0, 455.0, at(0.2), at(1.6));
    const double back = dominant_frequency(y, kRate, 425.0, 455.0, at(2.4), at(3.8));
    std::snprintf(label, sizeof label, "body %d is in tune out (%.2f Hz) and back (%.2f Hz)", body, out, back);
    EXPECT(std::fabs(1200.0 * std::log2(out / 440.0)) < 2.0 && std::fabs(1200.0 * std::log2(back / 440.0)) < 2.0, label);
  }
}

static void test_turning() {
  // A lone key turns by itself, under every rule.
  for (int rule = 0; rule < 3; ++rule) {
    plain(1.0f);
    device.set_param(p::kTurn, static_cast<float>(rule));
    device.note_on(1, 330.0f, 0.8f);
    const auto x = mid(render(device, 5.0f, kRate));
    const double period = rule == TurnedTime::kNewKey ? 2.0 : (rule == TurnedTime::kEmptyGlass ? 3.6 : 4.0);
    const double trough = level(x, 330.0, 0.5 * period), crest = level(x, 330.0, period), begin = level(x, 330.0, 0.1);
    std::printf("rule %d: begins %.1f, trough %.1f, returns to %.1f dB after %.1f s\n", rule, begin, trough, crest, period);
    EXPECT(trough < begin - 12.0 && crest > begin - 3.0, "a lone key fades and comes back by itself");
  }
  // A new key turns what was fading; the other rules leave it to fade.
  for (int rule = 0; rule < 3; ++rule) {
    for (float apart : {0.0f, 1.0f}) {
      plain(8.0f);
      device.set_param(p::kTurn, static_cast<float>(rule));
      device.set_param(p::kApart, apart);
      device.note_on(1, 220.0f, 0.8f);
      Stereo before = render(device, 4.0f, kRate);
      device.note_on(2, note_hz(81.3f), 0.8f);
      Stereo after = render(device, 2.5f, kRate);
      const auto x = mid(concat(before, after));
      const double change = level(x, 220.0, 6.2) - level(x, 220.0, 4.0);
      std::printf("rule %d, Apart %.0f: the first key moves %.1f dB in 2.2 s after a far new key\n", rule, apart, change);
      if (rule == TurnedTime::kNewKey && apart == 0.0f) {
        EXPECT(change > 3.0, "a new key sends what was fading back to its beginning");
      } else {
        EXPECT(change < -1.0, "a glass that is not turned goes on fading");
      }
    }
  }
  // With Apart up a key near the new one is turned all the same.
  plain(8.0f);
  device.set_param(p::kApart, 1.0f);
  device.note_on(1, 220.0f, 0.8f);
  Stereo before = render(device, 4.0f, kRate);
  device.note_on(2, note_hz(59.0f), 0.8f);
  const auto x = mid(concat(before, render(device, 2.5f, kRate)));
  EXPECT(level(x, 220.0, 6.2) > level(x, 220.0, 4.0) + 3.0, "a near key is turned with Apart up");

  // Let go: the key comes back to its beginning and ends there.
  plain(4.0f);
  device.set_param(p::kTurn, TurnedTime::kLetGo);
  device.set_param(p::kRelease, 2.0f);
  device.note_on(1, 220.0f, 0.8f);
  Stereo held = render(device, 5.0f, kRate);
  device.note_off(1);
  const auto y = mid(concat(held, render(device, 5.0f, kRate)));
  std::printf("let go: %.1f at the release, %.1f a second later, %.1f after three\n", level(y, 220.0, 4.9), level(y, 220.0, 6.1), level(y, 220.0, 8.0));
  EXPECT(level(y, 220.0, 6.1) > level(y, 220.0, 4.9) + 5.0, "letting go turns the key back");
  EXPECT(level(y, 220.0, 8.0) < -90.0, "and then it ends");
}

static void test_necks() {
  Stereo out[4];
  for (int neck = 0; neck < 4; ++neck) {
    plain(1.0f);
    device.set_param(p::kNeck, static_cast<float>(neck));
    device.set_param(p::kStrike, 0.6f);
    if (neck == TurnedTime::kHover) device.set_param(p::kExchange, 0.5f);
    device.note_on(1, 220.0f, 0.8f);
    out[neck] = render(device, 8.0f, kRate);
  }
  const auto soft = mid(out[0]), struck = mid(out[1]), hover = mid(out[2]), pass = mid(out[3]);
  const double bright = energy_above(struck, 2500.0, kRate, at(1.98), at(2.1)), round = energy_above(soft, 2500.0, kRate, at(2.7), at(3.1));
  std::printf("landing: share over 2.5 kHz %.5f struck, %.5f softened\n", bright, round);
  EXPECT(bright > 2.0 * round, "Strike lands brighter than Soften");
  EXPECT(level(hover, 220.0, 1.0) - level(hover, 220.0, 0.1) > level(struck, 220.0, 1.0) - level(struck, 220.0, 0.1) + 6.0, "Hover lingers near the beginning");
  double least = 1e9, most = -1e9, step = 0.0, was = level(hover, 660.0, 0.3);
  for (double t = 0.4; t < 1.4; t += 0.1) {
    const double now = level(hover, 660.0, t);
    least = std::min(least, now);
    most = std::max(most, now);
    step = std::max(step, std::fabs(now - was));
    was = now;
  }
  std::printf("hovering for a second: its third partial moves over %.1f dB\n", most - least);
  EXPECT(most - least > 0.8, "hovering never freezes");
  const double here = level(pass, 440.0, 0.3) - level(pass, 220.0, 0.3), there = level(pass, 440.0, 2.6) - level(pass, 220.0, 2.6);
  std::printf("pass: the octave stands %.1f dB over the note on this side, %.1f on the other\n", here, there);
  EXPECT(there > here + 10.0, "Pass comes out in another colour");
}

static void test_shape_of_the_sand() {
  // Split: the octave grows while the note fades.
  plain(2.0f);
  device.set_param(p::kBody, TurnedTime::kString);
  device.set_param(p::kSplit, 1.0f);
  device.note_on(1, 220.0f, 0.8f);
  const auto x = mid(render(device, 2.2f, kRate));
  EXPECT(level(x, 220.0, 1.7) < level(x, 220.0, 0.3) - 8.0 && level(x, 440.0, 1.7) > level(x, 440.0, 0.3) + 8.0,
         "Split lets every second partial run the other way");

  // Depth: how far it has faded at the end. Pour: where that happens.
  double fall[3];
  int i = 0;
  for (float depth : {0.0f, 0.5f, 1.0f}) {
    plain(2.0f);
    device.set_param(p::kDepth, depth);
    device.note_on(1, 220.0f, 0.8f);
    const auto y = mid(render(device, 2.2f, kRate));
    fall[i++] = level(y, 220.0, 0.06) - level(y, 220.0, 1.95);
  }
  std::printf("Depth 0, half, 1: %.1f, %.1f, %.1f dB fall in one Sand\n", fall[0], fall[1], fall[2]);
  EXPECT(fall[0] > 2.5 && fall[0] < 6.0 && fall[1] > 10.0 && fall[2] > 35.0, "Depth sets how far a sound fades");
  double half[2];
  for (int pass = 0; pass < 2; ++pass) {
    plain(2.0f);
    device.set_param(p::kPour, pass ? 0.9f : 0.1f);
    device.note_on(1, 220.0f, 0.8f);
    const auto y = mid(render(device, 2.2f, kRate));
    half[pass] = level(y, 220.0, 0.6) - level(y, 220.0, 1.95);
  }
  EXPECT(half[1] > half[0] + 5.0, "Pour sets where in the sand the fading happens");

  // Memory: a forgetful glass comes back softer.
  plain(1.0f);
  device.set_param(p::kMemory, 0.0f);
  device.note_on(1, 220.0f, 0.8f);
  const auto y = mid(render(device, 5.0f, kRate));
  EXPECT(level(y, 220.0, 2.0) < level(y, 220.0, 0.1) - 4.0 && level(y, 220.0, 4.0) < level(y, 220.0, 2.0) - 2.0, "Memory down, each return is softer");

  // Settling bends the beginning and not the end; Beat and Ears; velocity.
  plain(2.0f);
  device.set_param(p::kSettling, 150.0f);
  device.set_param(p::kDepth, 0.3f);
  device.note_on(1, 440.0f, 0.8f);
  const auto z = mid(render(device, 2.5f, kRate));
  const double early = dominant_frequency(z, kRate, 425.0, 465.0, at(0.01), at(0.15)), late = dominant_frequency(z, kRate, 425.0, 465.0, at(1.4), at(2.2));
  std::printf("Settling 150: %.1f ct sharp at the beginning, %.2f at the end\n", 1200 * std::log2(early / 440.0), 1200 * std::log2(late / 440.0));
  EXPECT(early > 446.0 && std::fabs(1200.0 * std::log2(late / 440.0)) < 3.0, "Settling bends the beginning and settles");
  double share[2], size[2];
  for (int pass = 0; pass < 2; ++pass) {
    plain(2.0f);
    device.set_param(p::kStrike, 0.4f);
    device.note_on(1, 220.0f, pass ? 1.0f : 0.25f);
    Stereo v = render(device, 0.6f, kRate);
    share[pass] = energy_above(mid(v), 800.0, kRate);
    size[pass] = rms(v.left);
  }
  EXPECT(size[1] > 3.0 * size[0] && share[1] > 1.5 * share[0], "a harder touch is louder and brighter");
  double wide[2], sand_heard[2];
  for (int pass = 0; pass < 2; ++pass) {
    plain(2.0f);
    device.set_param(p::kEars, pass ? 1.0f : 0.0f);
    device.set_param(p::kGrains, pass ? 1.0f : 0.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo v = render(device, 2.0f, kRate);
    wide[pass] = correlation(v.left, v.right, at(0.5));
    sand_heard[pass] = rms(v.left, at(1.2), at(1.8)) * std::sqrt(energy_above(v.left, 1500.0, kRate, at(1.2), at(1.8)));
  }
  EXPECT(wide[1] < wide[0] - 0.2, "Ears sets the two ears apart");
  EXPECT(sand_heard[1] > 3.0 * sand_heard[0], "Grains lets the sand be heard");
}

// Third difference: a band-limited tone leaves little in it, a jump its size.
static double kink(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  double worst = 0.0;
  for (size_t i = from + 3; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 3.0 * x[i - 1] + 3.0 * x[i - 2] - x[i - 3]));
  }
  return worst;
}

static void quiet_chord() {
  plain(6.0f);
  device.set_param(p::kDepth, 0.1f);
  device.set_param(p::kTilt, -0.6f);
  for (int i = 0; i < 4; ++i) device.note_on(i, note_hz(50.0f + 5.0f * i), 0.9f);
  render(device, 1.0f, kRate);
}

static void test_clicks() {
  quiet_chord();
  const double reference = kink(render(device, 1.0f, kRate).left);
  // Every knob, jumped under a sounding chord.
  for (int id = 0; id < p::kNumParams; ++id) {
    if (id == p::kGrains || id == p::kStrike) continue;  // noise of their own
    quiet_chord();
    double worst = 0.0;
    for (int jump = 0; jump < 6; ++jump) {
      device.set_param(id, (jump & 1) ? p::kParamMin[id] : p::kParamMax[id]);
      worst = std::max(worst, kink(render(device, 0.15f, kRate).left));
    }
    const double louder = id == p::kVolume ? 4.0 : 1.0;
    std::snprintf(label, sizeof label, "knob %d jumped under a chord does not click (kink %.5f, at rest %.5f)", id, worst, reference);
    // Brighter settings have more of a third difference by themselves: the room is for them.
    EXPECT(worst < louder * 14.0 * reference + 2.0e-3, label);
  }
  // A turn by a key, a key struck again, a key let go, voices taken.
  quiet_chord();
  device.note_on(0, note_hz(50.0f), 0.9f);
  const double again = kink(render(device, 0.3f, kRate).left);
  device.note_off(1);
  const double off = kink(render(device, 0.3f, kRate).left);
  double taken = 0.0;
  for (int i = 0; i < 20; ++i) {
    device.note_on(20 + i, note_hz(40.0f + i), 0.9f);
    taken = std::max(taken, kink(render(device, 0.05f, kRate).left));
  }
  std::printf("kinks: at rest %.5f, struck again %.5f, let go %.5f, voices taken %.5f\n", reference, again, off, taken);
  EXPECT(again < 5.0 * reference && off < 2.0 * reference && taken < 12.0 * reference, "strikes, releases and steals do not click");
}

static void test_bad_notes() {
  device.init(kRate);
  const float nan = std::nanf(""), inf = std::numeric_limits<float>::infinity();
  device.note_on(1, nan, 0.5f);
  EXPECT(loudest(render(device, 0.1f, kRate)) == 0.0, "a note with no pitch is ignored");
  for (float hz : {0.0f, -5.0f, 5.0f, 20000.0f, inf, -inf}) device.note_on(2, hz, 0.7f);
  for (float gain : {nan, inf, -1.0f, 0.0f, 3.0f}) device.note_on(3, 300.0f, gain);
  Stereo out = render(device, 1.0f, kRate);
  EXPECT(finite(out.left) && finite(out.right) && loudest(out) < 1.0, "absurd notes are survived");

  // One id at A, at B and at A again, then one note off: nothing is left.
  for (float gap : {0.0f, 0.001f, 0.3f}) {
    device.init(kRate);
    for (float note : {60.0f, 67.0f, 60.0f}) {
      device.note_on(7, note_hz(note), 0.8f);
      if (gap > 0.0f) render(device, gap, kRate);
    }
    device.note_off(7);
    render(device, 9.0f, kRate);
    EXPECT(loudest(render(device, 0.2f, kRate)) == 0.0, "one id, A, B, A and one note off end in silence");
  }
  // Struck again inside a steal, then let go.
  device.init(kRate);
  for (int i = 0; i < 12; ++i) device.note_on(i, note_hz(40.0f + 3.0f * i), 0.8f);
  render(device, 0.5f, kRate);
  device.note_on(50, 1000.0f, 0.8f);
  render(device, 0.001f, kRate);
  device.note_on(50, 1000.0f, 0.8f);
  for (int i = 0; i < 12; ++i) device.note_off(i);
  device.note_off(50);
  render(device, 9.0f, kRate);
  EXPECT(loudest(render(device, 0.2f, kRate)) == 0.0, "a key struck twice inside a steal does not stay");
}

static std::vector<float> blocks(int block) {
  device.init(kRate);
  device.set_param(p::kGrains, 0.7f);
  device.set_param(p::kRelease, 0.4f);
  std::vector<float> out;
  auto add = [&](float seconds) {
    Stereo s = render(device, seconds, kRate, block);
    out.insert(out.end(), s.left.begin(), s.left.end());
  };
  device.note_on(1, 220.0f, 0.8f);
  add(0.512f);
  device.note_on(2, 330.0f, 0.8f);
  add(0.512f);
  device.note_off(1);
  device.note_off(2);
  add(3.072f);
  device.set_param(p::kTilt, 0.8f);  // moved while asleep
  add(0.128f);
  device.note_on(3, 262.0f, 0.8f);
  add(0.512f);
  return out;
}

static void test_blocks_and_rates() {
  const auto a = blocks(128), b = blocks(1), c = blocks(2048);
  double worst = 0.0;
  for (size_t i = 0; i < a.size(); ++i) {
    worst = std::max(worst, std::max(std::fabs(static_cast<double>(a[i]) - b[i]), std::fabs(static_cast<double>(a[i]) - c[i])));
  }
  std::printf("blocks of 1, 128 and 2048 across a silence differ by %g\n", worst);
  EXPECT(worst < 1.0e-6, "the output does not depend on the block size, across a silence too");

  double level_at[3];
  int i = 0;
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    device.init(rate);
    device.set_param(p::kGrains, 0.0f);
    device.note_on(1, 220.0f, 0.8f);
    Stereo s = render(device, 2.4f, rate);
    level_at[i++] = db(rms(s.left, at(2.0, rate), at(2.4, rate)));
  }
  EXPECT(std::fabs(level_at[0] - level_at[1]) < 1.0 && std::fabs(level_at[2] - level_at[1]) < 1.0, "the same at every sample rate");
}

static void test_levels() {
  for (int body = 0; body < TurnedTime::kNumBodies; ++body) {
    double least = 0.0, most = -100.0;
    for (float note : {36.0f, 48.0f, 60.0f, 72.0f, 84.0f}) {
      device.init(kRate);
      device.set_param(p::kBody, static_cast<float>(body));
      device.note_on(1, note_hz(note), 0.7f);
      const double top = db(loudest(render(device, 3.0f, kRate)));
      least = std::min(least, top);
      most = std::max(most, top);
    }
    std::printf("body %d: a note at 0.7 peaks from %.1f to %.1f dBFS over C2 to C6\n", body, least, most);
    EXPECT(least > -30.0 && most < -10.0, "one note is neither lost nor loud");
    if (body == TurnedTime::kBell) EXPECT(least > -25.0, "the default is in its place");
  }
  device.init(kRate);
  const float keys[10] = {38, 45, 50, 57, 60, 65, 69, 72, 76, 81};
  for (int i = 0; i < 10; ++i) device.note_on(i, note_hz(keys[i]), 1.0f);
  const double ten = loudest(render(device, 8.0f, kRate));
  std::printf("ten keys at full gain peak at %.3f\n", ten);
  EXPECT(ten < 0.5, "ten keys stay under the knee");
  // Five minutes held: no creep, no denormals, no drift of the phases' lengths.
  device.init(kRate);
  device.set_param(p::kSand, 0.5f);
  device.set_param(p::kMemory, 1.0f);
  device.note_on(1, 220.0f, 0.7f);
  const double early = loudest(render(device, 4.0f, kRate));
  for (int i = 0; i < 18; ++i) render(device, 5.0f, kRate, 2048);
  const double late = loudest(render(device, 4.0f, kRate));
  EXPECT(late < 1.5 * early && late > 0.6 * early, "a long hold keeps its level");
}

// What a check of the builder's work found, held.
static void test_one_loudness() {
  // Whatever the body, the neck, Depth, Pour and Split, a chord is about as loud.
  double least = 0.0, most = -200.0;
  for (int body = 0; body < TurnedTime::kNumBodies; ++body) {
    for (int neck = 0; neck < 4; ++neck) {
      for (int way = 0; way < 4; ++way) {
        device.init(kRate);
        device.set_param(p::kBody, static_cast<float>(body));
        device.set_param(p::kNeck, static_cast<float>(neck));
        device.set_param(p::kDepth, way & 1 ? 0.85f : 0.2f);
        device.set_param(p::kPour, way & 1 ? 0.3f : 0.8f);
        device.set_param(p::kSplit, way == 2 ? -1.0f : (way == 3 ? 0.8f : 0.0f));
        for (int i = 0; i < 3; ++i) device.note_on(i, note_hz(50.0f + 8.0f * i), 0.8f);
        const auto x = mid(render(device, 4.0f, kRate));
        double loud = -200.0;
        for (int w = 0; w < 10; ++w) loud = std::max(loud, db(rms(x, at(0.4 * w), at(0.4 * (w + 1)))));
        least = std::min(least, loud);
        most = std::max(most, loud);
      }
    }
  }
  std::printf("96 patches of body, neck, depth, pour and split: the loudest 0.4 s from %.1f to %.1f dBFS\n", least, most);
  EXPECT(least > -43.0 && most < -22.0 && most - least < 19.0, "a walk is brought to one loudness");
}

static void test_slow_attack() {
  for (int body : {0, 5}) {
    for (int neck = 0; neck < 4; ++neck) {
      plain(10.0f);
      device.set_param(p::kBody, static_cast<float>(body));
      device.set_param(p::kNeck, static_cast<float>(neck));
      device.set_param(p::kAttack, 2.0f);
      device.set_param(p::kGrains, 0.8f);
      device.set_param(p::kDepth, 0.2f);
      device.note_on(1, 293.0f, 0.8f);
      Stereo s = render(device, 3.0f, kRate);
      std::snprintf(label, sizeof label, "body %d neck %d: a slow key's air and grains come with it and not before", body, neck);
      EXPECT(db(rms(s.left, 0, at(0.1))) < db(rms(s.left, at(2.5), at(3.0))) - 32.0, label);
    }
  }
  double changed[2];
  for (int pass = 0; pass < 2; ++pass) {
    plain(12.0f);
    device.set_param(p::kAttack, 4.0f);
    device.note_on(1, 220.0f, 0.8f);
    render(device, 0.5f, kRate);
    if (pass) device.set_param(p::kTurn, 1.0f);
    Stereo s = render(device, 0.6f, kRate);
    changed[pass] = db(rms(s.left, at(0.5), at(0.6)));
  }
  std::printf("a choice changed inside an attack of 4 s: %.1f dB, %.1f without\n", changed[1], changed[0]);
  EXPECT(changed[1] < changed[0] + 4.0, "a choice does not cut a slow attack short");
  // A slow key is rounder: its strike is taken off with it.
  double bright[2];
  for (int pass = 0; pass < 2; ++pass) {
    plain(2.0f);
    device.set_param(p::kBody, TurnedTime::kString);
    device.set_param(p::kStrike, 0.8f);
    device.set_param(p::kAttack, pass ? 0.06f : 0.01f);
    device.note_on(1, 220.0f, 0.9f);
    const auto x = mid(render(device, 0.4f, kRate));
    bright[pass] = energy_above(x, 2000.0, kRate, at(0.06), at(0.2));
  }
  std::printf("share over 2 kHz of a struck string: %.4f with no attack, %.4f with 60 ms\n", bright[0], bright[1]);
  EXPECT(bright[0] > 1.5 * bright[1], "Attack is heard from its first steps");
}

static void test_touch_and_landing() {
  // The touch reaches the strike's brightness, over what it does to the tone.
  double gain[2];
  for (int pass = 0; pass < 2; ++pass) {
    double share[2];
    for (int hard = 0; hard < 2; ++hard) {
      plain(3.0f);
      device.set_param(p::kStrike, pass ? 0.9f : 0.0f);
      device.note_on(1, 220.0f, hard ? 1.0f : 0.3f);
      const auto x = mid(render(device, 0.2f, kRate));
      share[hard] = energy_above(x, 1200.0, kRate, at(0.01), at(0.12));
    }
    gain[pass] = 10.0 * std::log10(share[1] / share[0]);
  }
  std::printf("a hard touch against a soft one, over 1.2 kHz: %.1f dB with no strike, %.1f with\n", gain[0], gain[1]);
  EXPECT(gain[1] > 5.5 && gain[1] > gain[0] + 3.0, "a hard touch strikes brighter");
  // A struck landing is brighter than the same place on the way there, and Soften's is not.
  double more[2];
  for (int neck = 0; neck < 2; ++neck) {
    plain(1.0f);
    device.set_param(p::kNeck, static_cast<float>(neck));
    device.note_on(1, 220.0f, 0.8f);
    const auto x = mid(render(device, 4.0f, kRate));
    const double t = neck ? 2.02 : 2.89;  // where it lands
    more[neck] = level(x, 880.0, t + 0.07, 0.08) - level(x, 220.0, t + 0.07, 0.08) - level(x, 880.0, t - 0.07, 0.08) + level(x, 220.0, t - 0.07, 0.08);
  }
  std::printf("landing: the fourth partial rises %.1f dB against the note, %.1f at a softened one\n", more[1], more[0]);
  EXPECT(more[1] > 2.5 && more[0] < 1.5, "a landing is heard even with Strike down");
}

// The newest key's place in the sand after some seconds, with one knob set.
static float place(float note, double seconds, int knob, float value) {
  plain(2.0f);
  device.set_param(knob, value);
  device.note_on(1, note_hz(note), 0.8f);
  render(device, static_cast<float>(seconds), kRate);
  return device.meter(TurnedTime::kMeterPlace);
}

static void test_each_knob_of_time() {
  const float low = place(36.0f, 1.5, p::kStagger, 1.0f), high = place(84.0f, 1.2, p::kStagger, 1.0f);
  std::printf("Stagger: a low key is at %.2f after 1.5 s, a high one at %.2f after 1.2\n", low, high);
  EXPECT(low < 0.6f && high > low + 0.25f, "Stagger lets high keys run quicker");
  const float quick = place(60.0f, 2.8, p::kInertia, 0.0f), slow = place(60.0f, 2.8, p::kInertia, 1.0f);
  std::printf("Inertia: 0.8 s after the turn at %.2f on the spot, at %.2f with Inertia\n", quick, slow);
  EXPECT(slow > quick + 0.15f, "Inertia makes a turn hesitate");
  // Hovering moves, and comes out again.
  plain(1.5f);
  device.set_param(p::kNeck, TurnedTime::kHover);
  device.note_on(1, 220.0f, 0.8f);
  float least = 9.0f, most = -9.0f;
  for (int i = 0; i < 40; ++i) {
    render(device, 0.25f, kRate);
    least = std::min(least, device.meter(TurnedTime::kMeterPlace));
    most = std::max(most, device.meter(TurnedTime::kMeterPlace));
  }
  EXPECT(most > 0.9f && least < -0.2f, "a hovering key's time is never at a stand");
  // Apart: the second key of a chord starts on its way to the neck.
  plain(3.0f);
  device.set_param(p::kApart, 1.0f);
  device.note_on(1, 220.0f, 0.8f);
  device.note_on(2, 330.0f, 0.8f);
  render(device, 0.1f, kRate);
  EXPECT(device.meter(TurnedTime::kMeterPlace) < -0.6f, "Apart spreads a chord along the sand");
  // Exchange moves an overtone, Beat makes the mono sum shimmer.
  double overtone[2], moved[2];
  for (int pass = 0; pass < 2; ++pass) {
    plain(2.0f);
    device.set_param(p::kExchange, pass ? 1.0f : 0.0f);
    device.note_on(1, 220.0f, 0.8f);
    const auto x = mid(render(device, 2.0f, kRate));
    overtone[pass] = level(x, 660.0, 1.2) - level(x, 220.0, 1.2);
    plain(20.0f);
    device.set_param(p::kDepth, 0.0f);
    device.set_param(p::kBeat, pass ? 2.0f : 0.0f);
    device.note_on(1, 220.0f, 0.8f);
    const auto y = mid(render(device, 2.0f, kRate));
    double least_level = 0.0, most_level = -200.0;
    for (double t = 0.5; t < 1.9; t += 0.1) {
      least_level = std::min(least_level, level(y, 220.0, t));
      most_level = std::max(most_level, level(y, 220.0, t));
    }
    moved[pass] = most_level - least_level;
  }
  std::printf("Exchange moves the third partial by %.1f dB; Beat moves the note by %.1f dB, %.1f without\n", overtone[1] - overtone[0], moved[1], moved[0]);
  EXPECT(std::fabs(overtone[1] - overtone[0]) > 5.0, "Exchange hands the overtones' strength about");
  EXPECT(moved[1] > 3.0 && moved[0] < 1.0, "Beat makes a held tone shimmer");
  // A key that took another's glass is let go by its own name alone.
  plain(8.0f);
  for (int i = 0; i < 12; ++i) device.note_on(i, note_hz(40.0f + i), 0.8f);
  render(device, 0.3f, kRate);
  device.note_on(50, note_hz(96.0f), 0.8f);
  render(device, 0.3f, kRate);
  device.note_off(50);
  render(device, 5.0f, kRate);
  const auto z = mid(render(device, 0.4f, kRate));
  EXPECT(level(z, note_hz(96.0f), 0.2, 0.3) < -85.0, "a key that took a glass ends when it is let go");
}

int main() {
  Conformance spec;
  spec.name = "turned-time";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 8.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);
  test_palindrome();
  test_turning();
  test_necks();
  test_shape_of_the_sand();
  test_clicks();
  test_bad_notes();
  test_blocks_and_rates();
  test_levels();
  test_one_loudness();
  test_slow_attack();
  test_touch_and_landing();
  test_each_knob_of_time();
  device.init(kRate);
  for (int i = 0; i < 8; ++i) device.note_on(i, 110.0f * std::exp2(i * 3.0f / 12.0f), 0.7f);
  report_cost("turned-time (8 held)", 8.0f, kRate, [] { render(device, 8.0f, kRate); });
  return finish("turned-time");
}
