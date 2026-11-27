// Native harness for Dry Brush (cpp/devices/dry-brush). The conformance pass
// covers silence, stealing, abuse and other sample rates. The rest measures
// what makes it a brush: ink that runs out, hairs that skip with rounded edges
// and never all at once, a stain that outlives the stroke, six scripts, pitch
// that moves at the two ends only. Nobody has listened to it.

#include "../devices/dry-brush/dry_brush.h"
#include "support/test_kit.h"

#include <ctime>
#include <initializer_list>
#include <utility>

using namespace testkit;
using livemix::DryBrush;
namespace p = livemix::dry_brush;

static DryBrush device;
static const float kRate = 48000.0f;

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }
static double cents(double hz, double wanted) { return 1200.0 * std::log2(hz / wanted); }
static double both_peak(const Stereo& x, size_t from = 0, size_t to = SIZE_MAX) {
  return std::max(peak(x.left, from, to), peak(x.right, from, to));
}
static double level(const Stereo& x, double from, double to, double rate = kRate) {
  return db(std::hypot(rms(x.left, at(from, rate), at(to, rate)), rms(x.right, at(from, rate), at(to, rate))) * std::sqrt(0.5));
}
struct Range {
  double low = 1.0e9, high = -1.0e9;
  void take(double x) { low = std::min(low, x), high = std::max(high, x); }
  double span() const { return high - low; }
};
// A fresh device with some knobs turned.
static void fresh(std::initializer_list<std::pair<int, float>> knobs, float rate = kRate) {
  device.init(rate);
  for (const auto& k : knobs) device.set_param(k.first, k.second);
}
static Stereo play(int note, float seconds, float rate = kRate, float gain = 0.7f) {
  device.note_on(1, 440.0f * std::pow(2.0f, (static_cast<float>(note) - 69.0f) / 12.0f), gain);
  return render(device, seconds, rate);
}
// A stroke with nothing under it or after it: hairs alone.
static void bare(std::initializer_list<std::pair<int, float>> knobs = {}, float rate = kRate) {
  fresh({{p::kString, 0.0f}, {p::kBleed, 0.0f}, {p::kGrain, 0.0f}, {p::kDryness, 0.0f}, {p::kLean, 0.0f}, {p::kSpread, 0.0f}}, rate);
  for (const auto& k : knobs) device.set_param(k.first, k.second);
}
static Stereo stroke(int note, float seconds, std::initializer_list<std::pair<int, float>> knobs = {}) {
  bare(knobs);
  return play(note, seconds);
}
// Energy above `hz`, in dB under the whole of it.
static double top(const Stereo& x, double hz, double from, double to) {
  return 0.5 * db(energy_above(x.left, hz, kRate, at(from), at(to)));
}
// Worst second difference in a stretch: a click sticks out of it.
static double worst_bend(const Stereo& x, size_t from, size_t to) {
  double worst = 0.0;
  for (size_t i = from + 2; i < std::min(to, x.left.size()); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(x.left[i]) - 2.0 * x.left[i - 1] + x.left[i - 2]));
  }
  return worst;
}
static void chord(float gain = 0.8f) {
  const float keys[5] = {146.83f, 220.0f, 349.23f, 523.25f, 659.26f};
  for (int i = 0; i < 5; ++i) device.note_on(10 + i, keys[i], gain);
}

static void test_level() {
  Range keys;
  for (int note = 36; note <= 84; note += 6) {
    fresh({});
    const Stereo x = play(note, 3.0f);
    const double pk = db(both_peak(x));
    EXPECT(pk > -24.0 && pk < -10.0, "one note peaks between -24 and -10 dBFS");
    keys.take(level(x, 0.2, 2.2));
  }
  std::printf("  keys from C2 to C6: level %.1f to %.1f\n", keys.low, keys.high);
  EXPECT(keys.span() < 6.0, "the keys are within 6 dB of each other from C2 to C6");
  device.init(kRate);
  for (int i = 0; i < 10; ++i) device.note_on(i, 82.4f * std::pow(2.0f, i * 4.0f / 12.0f), 1.0f);
  const double ten = both_peak(render(device, 5.0f, kRate));
  EXPECT(ten < 0.5, "ten held keys stay under the knee of the clip");
  // Velocity is timbre and not level alone.
  device.init(kRate);
  const Stereo soft = play(57, 1.5f, kRate, 0.2f);
  device.init(kRate);
  const Stereo hard = play(57, 1.5f, kRate, 1.0f);
  std::printf("  velocity 0.2 to 1: level %.1f to %.1f, above 700 Hz %.1f to %.1f\n", level(soft, 0.2, 1.4),
              level(hard, 0.2, 1.4), top(soft, 700.0, 0.2, 1.4), top(hard, 700.0, 0.2, 1.4));
  EXPECT(level(hard, 0.2, 1.4) - level(soft, 0.2, 1.4) > 4.0, "a harder key is louder");
  EXPECT(top(hard, 700.0, 0.2, 1.4) - top(soft, 700.0, 0.2, 1.4) > 1.0, "and brighter");
}

static void test_tune() {
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    for (int brush : {0, 1, 2, 4}) {  // a feather is air
      for (int note : {40, 57, 76}) {
        if (rate != kRate && (brush != 0 || note == 40)) continue;
        bare({{p::kBrush, static_cast<float>(brush)}, {p::kInk, 1.0f}}, rate);
        const double want = 440.0 * std::pow(2.0, (note - 69) / 12.0);
        const Stereo x = play(note, 2.0f, rate);
        const double hz = dominant_frequency(x.left, rate, want * 0.97, want * 1.03, at(0.7, rate), at(1.9, rate));
        EXPECT(std::fabs(cents(hz, want)) < 3.0, "a bare stroke is in tune within 3 cents");
      }
    }
  }
  // The string under the paper too, under a dot: it is plucked, and the hairs have no such partial.
  const Stereo x = stroke(57, 3.0f, {{p::kString, 1.0f}, {p::kAttack, 0.004f}, {p::kScript, 1.0f}});
  const double hz = dominant_frequency(x.left, kRate, 1080.0, 1120.0, at(0.3), at(2.0));
  EXPECT(std::fabs(cents(hz, 1100.0)) < 3.0, "the string is in tune within 3 cents");
}

static void test_lean() {
  bare({{p::kLean, 400.0f}, {p::kAttack, 0.004f}, {p::kTailLean, -500.0f}, {p::kRelease, 1.5f}, {p::kInk, 1.0f}});
  Stereo x = play(69, 3.0f);
  const double first = dominant_frequency(x.left, kRate, 400.0, 600.0, at(0.02), at(0.1));
  const double held = dominant_frequency(x.left, kRate, 400.0, 600.0, at(2.2), at(2.9));
  device.note_off(1);
  x = render(device, 2.0f, kRate);
  const double last = dominant_frequency(x.left, kRate, 300.0, 600.0, at(1.2), at(1.7));
  std::printf("  lean: enters %.0f, stands %.1f, leaves %.0f cents\n", cents(first, 440.0), cents(held, 440.0), cents(last, 440.0));
  EXPECT(cents(first, 440.0) > 200.0, "the entry leans above the note");
  EXPECT(std::fabs(cents(held, 440.0)) < 3.0, "in between the stroke stands on its note");
  EXPECT(cents(last, 440.0) < -380.0, "the tail leans down as it leaves");
}

static void test_ink() {
  double fall[2], stays[2];
  for (int much = 0; much < 2; ++much) {
    const Stereo x = stroke(57, 6.0f, {{p::kInk, much ? 1.0f : 0.1f}});
    fall[much] = level(x, 4.5, 5.5) - level(x, 0.15, 0.35);
    stays[much] = level(x, 4.5, 5.5);
  }
  std::printf("  ink: little falls %.1f dB in five seconds, much %.1f\n", fall[0], fall[1]);
  EXPECT(fall[0] < fall[1] - 4.0, "a brush with little ink runs short first");
  EXPECT(stays[0] > -60.0, "a stroke without ink is thin and not gone");
  // Dipped again, it comes back.
  const Stereo never = stroke(57, 6.0f, {{p::kInk, 0.2f}});
  EXPECT(level(stroke(57, 2.0f, {{p::kInk, 0.1f}, {p::kRedip, 1.0f}}), 1.0, 2.0) > level(stroke(57, 2.0f, {{p::kInk, 0.1f}}), 1.0, 2.0) + 8.0,
         "at the top it is dipped within the second");
  for (float redip : {0.1f, 0.7f}) {
    const Stereo dipped = stroke(57, 6.0f, {{p::kInk, 0.2f}, {p::kRedip, redip}});
    std::printf("  redip %.1f: %.1f against %.1f\n", redip, level(dipped, 3.0, 6.0), level(never, 3.0, 6.0));
    EXPECT(level(dipped, 3.0, 6.0) > level(never, 3.0, 6.0) + 2.0, "a stroke that is dipped again stays fuller");
  }
}

// Gaps: every hair has its own, with edges of 8 ms and more, and what is left
// of the key never drops out.
static void test_gaps() {
  const Stereo x = stroke(45, 8.0f, {{p::kDryness, 1.0f}, {p::kInk, 0.15f}, {p::kShade, 0.7f}});
  const double whole = level(x, 2.0, 8.0);
  Range any;
  for (double t = 2.0; t < 7.9; t += 0.02) any.take(level(x, t, t + 0.05));
  std::printf("  dry stroke: mean %.1f, from %.1f to %.1f in any 50 ms\n", whole, any.low, any.high);
  EXPECT(any.low > whole - 12.0, "a dry stroke never drops out");
  EXPECT(any.span() > 3.0, "but it is alive with skips");
  // The edges, on the darkest brush: cut off within a tick its gaps bend by 0.00055.
  bare({{p::kBrush, 4.0f}, {p::kDryness, 1.0f}, {p::kInk, 0.15f}, {p::kShade, 0.7f}});
  const double rough = worst_bend(play(45, 8.0f), at(2.0), at(8.0));
  std::printf("  a finger's gaps: second difference %.5f\n", rough);
  EXPECT(rough < 0.00032, "a gap has rounded edges");
  // On rough paper the hairs are caught while there is ink.
  double moves[2];
  for (int rough_paper = 0; rough_paper < 2; ++rough_paper) {
    const Stereo y = stroke(57, 3.0f, {{p::kPaper, rough_paper ? 2.0f : 0.0f}, {p::kInk, 1.0f}, {p::kGrain, 0.5f}});
    moves[rough_paper] = 0.0;
    double before = db(tone_level(y.left, 1100.0, kRate, at(0.45), at(0.5)));
    for (int i = 0; i < 48; ++i) {
      const double now = db(tone_level(y.left, 1100.0, kRate, at(0.5 + 0.05 * i), at(0.55 + 0.05 * i)));
      moves[rough_paper] += std::fabs(now - before) / 48.0;
      before = now;
    }
  }
  std::printf("  a partial moves %.1f dB in 50 ms on silk and %.1f on rough paper\n", moves[0], moves[1]);
  EXPECT(moves[1] > 1.5 * moves[0], "rough paper catches the hairs");
}

static void test_stain() {
  double after[2];
  for (int much = 0; much < 2; ++much) {
    bare({{p::kPaper, 1.0f}, {p::kBleed, much ? 1.0f : 0.0f}, {p::kSoak, 6.0f}, {p::kRelease, 0.2f}, {p::kTail, 0.0f}});
    play(57, 2.5f);
    device.note_off(1);
    const Stereo x = render(device, 3.0f, kRate);
    after[much] = level(x, 0.8, 1.6);
  }
  std::printf("  a second after the lift: %.1f without a stain, %.1f with one\n", after[0], after[1]);
  EXPECT(after[1] > -50.0 && after[1] > after[0] + 20.0, "the stain outlives the stroke");
}

static void test_scripts() {
  Stereo x[6];
  for (int s = 0; s < 6; ++s) x[s] = stroke(57, 4.0f, {{p::kScript, static_cast<float>(s)}, {p::kAttack, 0.01f}, {p::kInk, 1.0f}});
  EXPECT(level(x[0], 3.0, 4.0) > level(x[0], 0.1, 1.0) - 6.0, "the level stroke holds");
  EXPECT(level(x[1], 1.5, 2.0) < level(x[1], 0.02, 0.1) - 20.0, "a dot is over soon");
  EXPECT(level(x[2], 1.1, 1.4) > level(x[2], 0.1, 0.4) + 9.0, "the hook swells");
  EXPECT(level(x[2], 3.6, 4.0) > level(x[2], 1.1, 1.4) - 18.0 && level(x[2], 3.6, 4.0) < level(x[2], 1.1, 1.4) - 5.0,
         "and holds after its accent");
  EXPECT(level(x[3], 3.5, 4.0) < level(x[3], 0.1, 0.4) - 9.0, "the sweep thins");
  Range shake;
  for (double t = 1.0; t < 3.0; t += 0.02) shake.take(level(x[4], t, t + 0.03));
  EXPECT(shake.span() > 9.0, "the trembling stroke trembles");
  EXPECT(level(x[5], 2.5, 2.8) < level(x[5], 0.05, 0.15) - 5.0 && level(x[5], 1.0, 1.2) > level(x[1], 1.0, 1.2) + 10.0,
         "a seal rings longer than a dot");
}

static void test_matter() {
  // Five brushes and four papers, by where their energy is.
  const auto tone = [](const Stereo& x, double hz) { return db(tone_level(x.left, hz, kRate, at(0.3), at(1.4))); };
  double bright[5], hollow[5];
  for (int b = 0; b < 5; ++b) {
    const Stereo x = stroke(57, 2.0f, {{p::kBrush, static_cast<float>(b)}});
    bright[b] = top(x, 2000.0, 0.5, 1.9);
    hollow[b] = tone(x, 440.0) - tone(x, 220.0);
  }
  std::printf("  above 2 kHz: hair %.1f, reed %.1f, edge %.1f, feather %.1f, finger %.1f dB\n", bright[0], bright[1], bright[2], bright[3], bright[4]);
  EXPECT(bright[1] > bright[0] + 5.0 && bright[3] > bright[2] + 8.0 && bright[0] > bright[4] + 3.0, "brushes differ in brightness");
  EXPECT(hollow[1] < -30.0 && hollow[0] > -20.0, "a reed pen is hollow");
  const Stereo edge = stroke(57, 2.0f, {{p::kBrush, 2.0f}});
  EXPECT(tone(edge, 110.0) > tone(edge, 220.0) - 10.0, "a broad edge sounds an octave below as well");
  const Stereo stone = stroke(57, 1.5f, {{p::kPaper, 3.0f}, {p::kAttack, 0.004f}});
  const Stereo silk = stroke(57, 1.5f, {{p::kAttack, 0.004f}});
  EXPECT(tone(stone, 606.3) > tone(silk, 606.3) + 20.0, "stone rings at its own ratio");
  const Stereo rice = stroke(57, 1.5f, {{p::kPaper, 1.0f}});
  EXPECT(tone(rice, 2200.0) - tone(rice, 220.0) < tone(silk, 2200.0) - tone(silk, 220.0) - 6.0, "rice paper drinks the top");
  // Width: none is mono, all is wide; mono loses little.
  for (int wide = 0; wide < 2; ++wide) {
    fresh({{p::kWidth, static_cast<float>(wide)}});
    chord();
    const Stereo x = render(device, 3.0f, kRate);
    const double c = correlation(x.left, x.right, at(0.5), at(3.0));
    Stereo both = x;
    for (size_t i = 0; i < x.left.size(); ++i) both.left[i] = both.right[i] = 0.5f * (x.left[i] + x.right[i]);
    const double kept = level(both, 0.5, 3.0) - level(x, 0.5, 3.0);
    std::printf("  width %d: correlation %.2f, mono %.1f dB\n", wide, c, kept);
    EXPECT(wide ? c < 0.75 : c > 0.999, "width goes from mono to wide");
    EXPECT(kept > -5.0, "mono keeps the stroke");
  }
}

static void test_clicks() {
  // The reference: the same chord with no event in it.
  fresh({});
  chord();
  const double quiet = worst_bend(render(device, 3.0f, kRate), at(1.0), at(3.0));
  for (int id = 0; id < p::kNumParams; ++id) {
    fresh({});
    chord();
    render(device, 1.0f, kRate);
    // To whichever end is the farther.
    const float middle = 0.5f * (p::kParamMin[id] + p::kParamMax[id]);
    device.set_param(id, id == p::kVolume ? -12.0f : p::kParamDefault[id] < middle ? p::kParamMax[id] : p::kParamMin[id]);
    const Stereo x = render(device, 0.5f, kRate);
    const double now = worst_bend(x, 0, at(0.06)), around = std::max(quiet, worst_bend(x, at(0.1), at(0.5)));
    if (now > 1.5 * around) std::printf("  knob %d: %.2f of what stands\n", id, now / around);
    EXPECT(now < 2.0 * around, "a knob thrown to its far end does not click");
  }
  // A dark stroke, where nothing hides a click: knobs jumped end to end, and a stolen stroke.
  const auto dark = [] {
    fresh({{p::kBrush, 4.0f}, {p::kShade, 0.15f}, {p::kAttack, 0.1f}, {p::kGrain, 0.0f}, {p::kString, 0.0f}, {p::kLean, 0.0f}});
  };
  const struct { int id; float value; double when; const char* name; } jumps[] = {
      {p::kAttack, 4.0f, 0.06, "attack while it lands"}, {p::kAttack, 4.0f, 1.0, "attack while it stands"},
      {p::kSpread, 60.0f, 0.06, "spread while it lands"}, {p::kSpread, 0.0f, 1.0, "spread while it stands"},
      {p::kInk, 1.0f, 1.0, "ink in the dark"}, {p::kLean, -1200.0f, 0.06, "lean as it enters"},
      {p::kPaper, 2.0f, 1.0, "paper in the dark"}, {p::kPressure, 1.0f, 1.0, "pressure in the dark"}};
  for (const auto& jump : jumps) {
    dark();
    device.note_on(1, 110.0f, 0.8f);
    device.note_on(2, 165.0f, 0.8f);
    const Stereo first = render(device, static_cast<float>(jump.when), kRate);
    device.set_param(jump.id, jump.value);
    const Stereo x = render(device, 0.4f, kRate);
    const double around = std::max(worst_bend(first, 100, first.left.size()), worst_bend(x, at(0.03), at(0.4)));
    const double now = worst_bend(x, 0, at(0.012));
    EXPECT(now < 2.0 * around, jump.name);
  }
  dark();
  for (int i = 0; i < 12; ++i) device.note_on(i, 82.0f + 4.0f * static_cast<float>(i), 0.8f);
  const Stereo many = render(device, 1.0f, kRate);
  for (int i = 0; i < 4; ++i) device.note_on(40 + i, 98.0f + static_cast<float>(i), 0.8f);
  const Stereo fewer = render(device, 0.05f, kRate);
  std::printf("  dark pool: second difference %.6f, taken %.6f\n", worst_bend(many, at(0.8), at(1.0)), worst_bend(fewer, 0, at(0.05)));
  EXPECT(worst_bend(fewer, 0, at(0.05)) < 4.5 * worst_bend(many, at(0.8), at(1.0)), "a stroke is taken with rounded edges");
}

// Every setting is there to be heard: no corner of a knob is a silence.
static void test_levels() {
  const auto chord_level = [](std::initializer_list<std::pair<int, float>> patch) {
    fresh(patch);
    chord();
    return level(render(device, 2.0f, kRate), 0.0, 2.0);
  };
  const double usual = chord_level({});
  Range scripts, sheets;
  for (int each = 0; each < 24; ++each) {
    const float s = static_cast<float>(each / 4), attack = each & 1 ? 4.0f : 0.004f;
    if (attack > 1.0f && (s == 0.0f || s == 4.0f)) continue;
    scripts.take(chord_level({{p::kScript, s}, {p::kPressure, each & 2 ? 1.0f : 0.0f}, {p::kAttack, attack}}));
  }
  std::printf("  scripts at both ends of Pressure and Attack: %.1f to %.1f, usually %.1f\n", scripts.low, scripts.high, usual);
  EXPECT(scripts.low > usual - 16.0 && scripts.high < usual + 7.0, "no script is lost at an end of Pressure or Attack");
  for (int each = 0; each < 20; ++each) {
    sheets.take(chord_level({{p::kBrush, static_cast<float>(each / 4)}, {p::kPaper, static_cast<float>(each % 4)}}));
  }
  std::printf("  brushes on papers: %.1f to %.1f\n", sheets.low, sheets.high);
  EXPECT(sheets.span() < 12.0, "every brush on every paper is about as loud");
  EXPECT(chord_level({{p::kString, 1.0f}}) > usual - 6.0, "the string alone is as loud as the hairs");
  // Rice paper is soft and loses no key.
  const double middle = level(stroke(60, 2.0f, {{p::kPaper, 1.0f}}), 0.2, 2.0);
  EXPECT(level(stroke(84, 2.0f, {{p::kPaper, 1.0f}}), 0.2, 2.0) > middle - 9.0, "a high key on rice paper is heard");
  // Bleed goes from none of it to a cloud, while a key is held.
  const Stereo dry = stroke(57, 3.0f);
  const Stereo wet = stroke(57, 3.0f, {{p::kBleed, 1.0f}});
  EXPECT(std::fabs(level(wet, 1.0, 3.0) - level(dry, 1.0, 3.0)) < 5.0, "bleed is a cloud and not a fader");
  // Spread hairs land one after the other.
  const auto landed = [](float spread) { return level(stroke(57, 1.0f, {{p::kSpread, spread}, {p::kAttack, 0.06f}}), 0.0, 0.06); };
  EXPECT(landed(60.0f) < landed(0.0f) - 8.0, "spread hairs land raggedly");
  // Dry hairs part from each other: what sounds farther off than Spread itself goes.
  const Stereo parted = stroke(84, 4.0f, {{p::kSpread, 30.0f}, {p::kInk, 0.0f}, {p::kDryness, 0.3f}, {p::kBrush, 4.0f}});
  double in = 0.0, out = 0.0;
  for (int c = -60; c <= 60; c += 4) {
    const double a = tone_level(parted.left, 1046.5 * std::pow(2.0, c / 1200.0), kRate, at(2.0), at(4.0));
    (std::abs(c) > 33 ? out : in) += a * a;
  }
  std::printf("  dry hairs out of their places: %.1f dB\n", 10.0 * std::log10(out / in));
  EXPECT(10.0 * std::log10(out / in) > -13.0, "a dry hair leaves the others");
}

static void test_keys() {
  // One id at A, B and A again, then let go once: nothing is left sounding, nor when it took the place of others.
  for (int others : {0, 12}) {
    fresh({});
    for (int i = 0; i < others; ++i) device.note_on(20 + i, 110.0f + static_cast<float>(i), 0.8f);
    for (float hz : {220.0f, 330.0f, 220.0f}) {
      render(device, others ? 0.002f : 0.1f, kRate);
      device.note_on(7, hz, 0.8f);
    }
    device.note_off(7);
    for (int i = 0; i < others; ++i) device.note_off(20 + i);
    device.set_param(p::kSoak, 0.8f);
    render(device, 6.0f, kRate);
    EXPECT(both_peak(render(device, 0.5f, kRate)) == 0.0, "an id struck three times ends with one let go");
  }
  // Absurd notes and values.
  fresh({});
  const float odd[] = {0.0f, -5.0f, 5.0f, 20000.0f, 1.0e30f, std::nanf(""), INFINITY, -INFINITY};
  int id = 0;
  for (float f : odd) for (float g : {0.0f, 2.0f, std::nanf(""), -INFINITY}) device.note_on(id++, f, g);
  EXPECT(finite(render(device, 1.0f, kRate).left), "absurd notes are survived");
  // Every knob swept while a chord sounds.
  double worst = 0.0;
  bool fine = true;
  for (int param = 0; param < p::kNumParams; ++param) {
    device.init(kRate);
    chord(1.0f);
    for (int step = 0; step <= 40; ++step) {
      device.set_param(param, p::kParamMin[param] + (p::kParamMax[param] - p::kParamMin[param]) * static_cast<float>((step * 7) % 41) / 40.0f);
      const Stereo x = render(device, 0.02f, kRate);
      fine = fine && finite(x.left) && finite(x.right);
      worst = std::max(worst, both_peak(x));
    }
  }
  std::printf("  swept: worst peak %.3f\n", worst);
  EXPECT(fine && worst < 1.0, "every knob can be swept while a chord sounds");
}

// A mark held long after it has faded costs no more than one that sounds:
// nothing is left to dwindle through numbers too small to reckon with.
static void test_rest() {
  const auto cost = [] {
    const std::clock_t start = std::clock();
    render(device, 0.5f, kRate);
    return static_cast<double>(std::clock() - start);
  };
  fresh({{p::kScript, 1.0f}, {p::kSpeed, 1.0f}, {p::kBleed, 0.0f}});
  for (int i = 0; i < 8; ++i) device.note_on(i, 110.0f * std::pow(2.0f, i / 4.0f), 0.8f);
  const double fresh = cost();
  render(device, 20.0f, kRate);
  const double faded = cost();
  std::printf("  faded marks cost %.2f of fresh ones\n", faded / fresh);
  EXPECT(faded < 2.5 * fresh, "marks that have faded cost no more than fresh ones");
}

static Stereo phrase(int block) {
  fresh({{p::kRedip, 0.8f}, {p::kSoak, 0.8f}});
  Stereo out;
  const struct { double at; bool on; int id; float hz; } events[] = {
      {0.0, true, 1, 220.0f}, {0.3, true, 2, 331.0f}, {0.8, false, 1, 0.0f}, {1.0, false, 2, 0.0f},
      {7.0, true, 3, 147.0f}, {7.6, false, 3, 0.0f}, {8.2, true, 4, 440.0f}};
  size_t now = 0;
  for (const auto& e : events) {
    const size_t then = static_cast<size_t>(e.at * kRate) / 2048 * 2048;
    if (then > now) out = concat(out, render(device, static_cast<float>(then - now) / kRate, kRate, block));
    now = then;
    if (e.on) device.note_on(e.id, e.hz, 0.8f); else device.note_off(e.id);
    if (e.id == 2 && !e.on) device.set_param(p::kShade, 0.8f);
  }
  return concat(out, render(device, 1.0f, kRate, block));
}

static void test_blocks() {
  const Stereo a = phrase(128), b = phrase(1), c = phrase(2048);
  double worst = 0.0;
  for (size_t i = 0; i < std::min(a.left.size(), std::min(b.left.size(), c.left.size())); ++i) {
    worst = std::max({worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]), std::fabs(static_cast<double>(a.right[i]) - c.right[i])});
  }
  std::printf("  block sizes 1, 128 and 2048 differ by %g\n", worst);
  EXPECT(worst < 1.0e-6, "the sound does not depend on the block size, across a silence too");
  // Other rates keep level and colour.
  double at48 = 0.0;
  for (float rate : {48000.0f, 44100.0f, 96000.0f}) {
    fresh({{p::kGrain, 0.7f}}, rate);
    const Stereo x = play(57, 2.5f, rate);
    if (rate == 48000.0f) at48 = level(x, 0.3, 2.3, rate);
    EXPECT(std::fabs(level(x, 0.3, 2.3, rate) - at48) < 1.5, "the level is the same at every rate");
  }
}

int main() {
  Conformance spec;
  spec.name = "dry-brush";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 14.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);
  test_level();
  test_tune();
  test_lean();
  test_ink();
  test_gaps();
  test_stain();
  test_scripts();
  test_matter();
  test_clicks();
  test_levels();
  test_rest();
  test_keys();
  test_blocks();
  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n * 3) / 12.0f), 0.7f);
  report_cost("dry-brush", 5.0f, kRate, [] { render(device, 5.0f, kRate); });
  return finish("dry-brush");
}
