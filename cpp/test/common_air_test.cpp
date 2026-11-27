// Native harness of Common Air: conformance, then what makes it what it is
// (a single lung for all keys, order, sag, turning over, locking, the keys heard in
// each other), then the faults a reed instrument can have.

#include "../devices/common-air/common_air.h"
#include <initializer_list>
#include <utility>

#include "support/test_kit.h"

using namespace testkit;
using namespace livemix::common_air;

namespace {

constexpr float kRate = 48000.0f;
livemix::CommonAir device;

float hz(float note) { return 440.0f * std::pow(2.0f, (note - 69.0f) / 12.0f); }
size_t at(double seconds) { return static_cast<size_t>(seconds * kRate); }

// Nothing that bends a note or hides it: one reed, dry of breath.
void plain(std::initializer_list<std::pair<int, float>> sets = {}) {
  device.init(kRate);
  for (int off : {int(kSecond), int(kSag), int(kLock), int(kLeak), int(kChiff), int(kCup), int(kShare)}) device.set_param(off, 0);
  device.set_param(kAttack, 0.02f);
  for (const auto& set : sets) device.set_param(set.first, set.second);
}

std::vector<float> mono(const Stereo& x) {
  std::vector<float> out(x.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (x.left[i] + x.right[i]);
  return out;
}
double top_of(const Stereo& x) { return std::max(peak(x.left), peak(x.right)); }
double range(const std::vector<double>& x) { return *std::max_element(x.begin(), x.end()) - *std::min_element(x.begin(), x.end()); }
double cents(double a, double b) { return 1200.0 * std::log2(a / b); }

// What a tone near `guess` turns at, by its phase from window to window.
double pitch(const std::vector<float>& x, double guess, double from, double to) {
  const size_t size = at(0.1), hop = at(0.02);
  double before = 0.0, total = 0.0, count = 0.0;
  for (size_t start = at(from); start + size <= at(to); start += hop, count += 1.0) {
    double re = 0.0, im = 0.0;
    for (size_t i = 0; i < size; ++i) {
      const double w = x[start + i] * (0.5 - 0.5 * std::cos(2.0 * M_PI * i / size)), phase = 2.0 * M_PI * guess * (start + i) / kRate;
      re += w * std::cos(phase);
      im -= w * std::sin(phase);
    }
    const double angle = std::atan2(im, re);
    if (count > 0.0) total += std::remainder(angle - before, 2.0 * M_PI);
    before = angle;
  }
  return guess + total / (2.0 * M_PI * (count - 1.0) * hop / kRate);
}

// The largest second difference, which a click stands out in.
double kink(const std::vector<float>& x) {
  double worst = 0.0;
  for (size_t i = 2; i < x.size(); ++i) worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 2.0 * x[i - 1] + x[i - 2]));
  return worst;
}

// What one key sounds like for a while.
std::vector<float> lone(float note, float gain, float seconds) {
  device.note_on(1, hz(note), gain);
  return mono(render(device, seconds, kRate));
}

void chord(float gain = 0.7f) {
  for (int note : {50, 57, 65, 72, 76}) device.note_on(note - 49, hz(float(note)), gain);
}

void tuning_and_level() {
  for (int pipe = 0; pipe < 4; ++pipe) {
    for (float note : {36.0f, 48.0f, 60.0f, 72.0f, 84.0f}) {
      plain({{kPipe, float(pipe)}, {kLung, 30.0f}});
      EXPECT_NEAR(cents(pitch(lone(note, 0.7f, 1.4f), hz(note), 0.4, 1.4), hz(note)), 0.0, 3.0, "a lone key is in tune in every pipe");
    }
  }
  std::vector<double> levels;
  for (float note : {36.0f, 48.0f, 60.0f, 72.0f, 84.0f}) {
    device.init(kRate);
    device.note_on(1, hz(note), 0.7f);
    const Stereo x = render(device, 1.5f, kRate);
    levels.push_back(db(rms(mono(x), at(0.4), at(1.4))));
    EXPECT(top_of(x) > 0.063 && top_of(x) < 0.316, "one note at 0.7 peaks between -24 and -10 dBFS");
  }
  EXPECT(range(levels) < 7.0, "the level is roughly even over C2 to C6");
  for (float apart : {5.0f, 3.0f, 1.0f, 0.0f}) {
    device.init(kRate);
    for (int n = 0; n < 10; ++n) device.note_on(n, hz(38.0f + apart * float(n)), 1.0f);
    EXPECT(top_of(render(device, 4.0f, kRate)) < 0.4, "ten keys at full gain stay under the knee, on one pitch too");
  }
}

void lung_and_ways() {
  double lasts[3];
  for (int n = 0; n < 3; ++n) {
    plain({{kShare, n == 2 ? 1.0f : 0.0f}});
    n == 0 ? device.note_on(1, hz(57), 0.7f) : chord();
    for (lasts[n] = 0.0; lasts[n] < 8.0 && device.meter(0) > 0.0f; lasts[n] += 0.01) render(device, 0.01f, kRate);
  }
  EXPECT(lasts[0] > 1.12 * lasts[1] && lasts[1] > 1.1 * lasts[2], "more keys and more Share empty the lung sooner");

  // The turn: both ways in Both (in step as well), never in Circular.
  device.init(kRate), chord();
  float in = 0.0f, out = 0.0f, early = 0.0f, stood = 0.0f;
  for (int i = 0; i < 80; ++i) {
    render(device, 0.1f, kRate);
    in = std::min(in, device.meter(2));
    out = std::max(out, device.meter(2));
    if (i == 1) early = device.meter(3);
    if (i < 26) stood = std::max(stood, device.meter(3));
  }
  EXPECT(in < -0.5f && out > 0.5f, "the breath goes both ways");
  EXPECT(early < 0.3f && stood > 0.55f, "the chord at the defaults falls into step");
  const std::vector<float> round = (plain({{kBreath, 3.0f}, {kStarve, 0.0f}}), lone(57, 0.7f, 0.5f), mono(render(device, 12.0f, kRate)));
  std::vector<double> levels;
  for (size_t i = 0; i + at(0.25) <= round.size(); i += at(0.25)) levels.push_back(db(rms(round, i, i + at(0.25))));
  EXPECT(range(levels) < 4.0, "circular breathing never stops");
  // Out falls, in swells.
  for (int mode = 0; mode < 2; ++mode) {
    const std::vector<float> x = (plain({{kBreath, float(mode)}}), lone(57, 0.7f, 3.0f));
    EXPECT((mode == 0 ? -1 : 1) * db(rms(x, at(2.6), at(2.9)) / rms(x, at(0.6), at(0.9))) > 5.0, "out falls and in swells through a breath");
  }
  // Once: dies away under a held key; a new key is a new breath for all.
  plain({{kBreath, 4.0f}, {kLung, 1.0f}}), lone(57, 0.7f, 2.0f);
  EXPECT(rms(mono(render(device, 0.4f, kRate))) < 1.0e-4, "once is one breath");
  device.note_on(2, hz(64), 0.7f);
  EXPECT(tone_level(mono(render(device, 0.4f, kRate)), hz(57), kRate, at(0.05)) > 0.003, "the next key takes one for every reed");
}

// When each key of the chord falls 10 dB under what it was, and when it is back.
void order() {
  const float notes[5] = {50, 57, 65, 72, 76};
  double gone[2][5] = {}, back[2][5] = {};
  for (int way = 0; way < 2; ++way) {
    plain({{kStarve, way == 0 ? 0.9f : -0.9f}});
    const std::vector<float> x = (chord(), mono(render(device, 6.0f, kRate)));
    for (int n = 0; n < 5; ++n) {
      const double start = tone_level(x, hz(notes[n]), kRate, at(0.4), at(0.7));
      for (double t = 0.7; t < 5.6; t += 0.04) {
        const double level = tone_level(x, hz(notes[n]), kRate, at(t), at(t + 0.15));
        if (gone[way][n] == 0.0 && level < 0.32 * start) gone[way][n] = t;
        if (gone[way][n] > 0.0 && back[way][n] == 0.0 && level > 0.5 * start) back[way][n] = t;
      }
    }
    EXPECT(range(std::vector<double>(back[way], back[way] + 5)) > 0.3, "the reeds open again one by one");
  }
  EXPECT(gone[0][4] + 0.3 < gone[0][0], "to the right the high key starves before the low one");
  EXPECT(gone[1][0] + 0.3 < gone[1][4], "to the left the low key starves before the high one");
  EXPECT(back[0][4] < back[0][0], "and on the way in the order runs the other way round");
  double phrase[2][5], level[2], apart = 0.0;  // every phrase draws the order anew
  for (int n = (plain({{kStarve, 0.9f}}), 0); n < 2; ++n) {
    const std::vector<float> x = (chord(), mono(render(device, 4.0f, kRate)));
    for (int k = 0; k < 5; ++k) phrase[n][k] = db(tone_level(x, hz(notes[k]), kRate, at(3.0), at(3.4)));
    for (int id = 1; id < 28; ++id) device.note_off(id);
    render(device, 6.0f, kRate);
  }
  for (int n = 0; n < 2; ++n) level[n] = (plain({{kStarve, float(n)}}), rms(lone(64, 0.7f, 1.5f), at(0.5)));
  for (int k = 0; k < 5; ++k) apart = std::max(apart, std::fabs(phrase[0][k] - phrase[1][k]));
  EXPECT(apart > 1.5, "the order is drawn anew");
  EXPECT_NEAR(db(level[1] / level[0]), 0.0, 0.5, "a lone key is never starved");
}

void sag_and_lock() {
  double low[2];
  for (int deep = 0; deep < 2; ++deep) {
    plain({{kSag, 80.0f * deep}});
    low[deep] = cents(pitch(lone(57, 0.7f, 3.3f), hz(57), 2.7, 3.2), hz(57));
  }
  EXPECT(std::fabs(low[0]) < 3.0 && low[1] < -8.0, "Sag bends a reed as its air runs thin, and Sag 0 does not");

  // A tempered fifth and a tempered major third, loose and locked.
  const float upper[2] = {64, 61};
  const double pure[2] = {1.5, 1.25};
  for (int pair = 0; pair < 2; ++pair) {
    double off[2], level[2];
    for (int locked = 0; locked < 2; ++locked) {
      plain({{kStarve, 0.0f}, {kLung, 30.0f}, {kLock, float(locked)}});
      device.note_on(2, hz(upper[pair]), 0.7f);
      const std::vector<float> x = lone(57, 0.7f, 3.2f);
      level[locked] = tone_level(x, pitch(x, hz(57), 1.2, 3.2), kRate, at(1.2), at(3.2));
      off[locked] = cents(pitch(x, hz(upper[pair]), 1.2, 3.2) / pitch(x, hz(57), 1.2, 3.2), pure[pair]);
    }
    std::printf("pair %d: %.2f ct off pure loose, %.2f locked, %.1f dB up\n", pair, off[0], off[1], db(level[1] / level[0]));
    EXPECT(std::fabs(off[0]) > 1.2, "Lock 0 leaves the keys where they are tuned");
    EXPECT(std::fabs(off[1]) < 0.35, "Lock pulls the pair pure");
    EXPECT(db(level[1] / level[0]) > 0.7, "and the two swing the further for standing in step");
  }
}

void shared_air() {
  // The difference tone of two keys, with and without Share.
  double tone[2];
  for (int shared = 0; shared < 2; ++shared) {
    plain({{kPipe, 0.0f}, {kBody, 0.0f}, {kShare, float(shared)}});
    device.note_on(1, 400.0f, 0.8f), device.note_on(2, 523.0f, 0.8f);
    const std::vector<float> x = mono(render(device, 1.4f, kRate));
    tone[shared] = db(tone_level(x, 123.0, kRate, at(0.4), at(1.4)) / tone_level(x, 400.0, kRate, at(0.4), at(1.4)));
  }
  EXPECT(tone[1] > tone[0] + 20.0 && tone[1] > -40.0, "the keys are heard in each other through the root");
  double dip[2];  // a new key takes breath from the one that stands
  for (int shared = 0; shared < 2; ++shared) {
    plain({{kStarve, 0.0f}, {kLung, 30.0f}, {kShare, float(shared)}}), lone(57, 0.8f, 1.0f);
    const double before = tone_level(mono(render(device, 0.2f, kRate)), hz(57), kRate);
    device.note_on(2, hz(66), 1.0f), render(device, 0.08f, kRate);
    dip[shared] = db(tone_level(mono(render(device, 0.2f, kRate)), hz(57), kRate) / before);
  }
  EXPECT(std::fabs(dip[0]) < 0.8 && dip[1] < -1.5, "a new key takes air from the rest");
}

void timbre() {
  double bright[2];
  for (int hard = 0; hard < 2; ++hard) {
    const std::vector<float> x = (plain(), lone(57, hard ? 1.0f : 0.25f, 1.0f));
    bright[hard] = tone_level(x, 4 * hz(57), kRate, at(0.3)) / tone_level(x, hz(57), kRate, at(0.3));
  }
  EXPECT(db(bright[1] / bright[0]) > 4.0, "velocity is brightness as well as level");
  // The second reed beats as many times a second as Beat says, high or low.
  for (float note : {45.0f, 69.0f}) {
    plain({{kSecond, 1.0f}, {kInterval, 0.0f}, {kBeat, 3.0f}, {kSpread, 0.0f}, {kLung, 30.0f}});
    const std::vector<float> x = lone(note, 0.7f, 5.0f);
    EXPECT(std::fabs(db(tone_level(x, hz(note) + 3.0, kRate, at(1), at(5)) / tone_level(x, hz(note), kRate, at(1), at(5)))) < 10.0, "two reeds stand Beat apart");
  }
  device.init(kRate), chord();
  const std::vector<float> x = mono(render(device, 5.0f, kRate));
  EXPECT(std::fabs(db(energy_above(x, 1500, kRate, at(4), at(4.4)) / energy_above(x, 1500, kRate, at(1.8), at(2.2)))) > 1.5,
         "the way in opens brighter than the way out ended");
}

double centre(const std::vector<float>& x) {
  double weighted = 0.0, all = 0.0;
  for (int h = 1; h <= 30; ++h) {
    const double e = std::pow(tone_level(x, h * hz(57), kRate, at(0.5), at(1.5)), 2.0);
    weighted += h * e, all += e;
  }
  return weighted / all;
}

// What each control is for, over the whole of its range.
void ranges() {
  for (int reed = 0; reed < 4; ++reed) {
    double before = 0.0, loud[2], between[2];
    for (float bite : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) {
      plain({{kReed, float(reed)}, {kBite, bite}, {kPipe, 0.0f}, {kBody, 0.0f}, {kLung, 30.0f}});
      const double last = before;
      EXPECT((before = centre(lone(57, 0.7f, 1.5f))) > 1.002 * last, "Bite brightens over its whole range");
    }
    for (int leak = 0; leak < 2; ++leak) {
      plain({{kReed, float(reed)}, {kLeak, float(leak)}, {kLung, 30.0f}});
      const std::vector<float> x = lone(69, 0.7f, 2.0f);
      loud[leak] = db(rms(x, at(0.5)));
      between[leak] = tone_level(x, 660.0, kRate, at(0.5), at(1.9)) + tone_level(x, 1110.0, kRate, at(0.5), at(1.9));
      EXPECT(tone_level(x, 60.0, kRate, at(0.5), at(1.9)) < 0.0012, "breath has no rumble");
    }
    EXPECT(std::fabs(loud[1] - loud[0]) < 5.0 && between[1] > 2.0 * between[0], "Leak is breath in the place of tone");
  }
  double rings[3];
  for (int reed = 0; reed < 3; ++reed) {
    const double held = (plain({{kReed, float(reed)}, {kRelease, 1.0f}}), rms(lone(57, 0.7f, 0.8f), at(0.5)));
    device.note_off(1), render(device, 0.4f, kRate);
    rings[reed] = db(rms(mono(render(device, 0.2f, kRate))) / held);
  }
  EXPECT(rings[2] > rings[0] + 8.0 && rings[0] > rings[1] + 8.0, "steel rings longest and cane stops soonest");
  plain({{kReed, 2.0f}, {kPipe, 0.0f}, {kBite, 0.0f}, {kChiff, 1.0f}});
  const std::vector<float> hit = lone(57, 0.8f, 0.5f);
  double tap[2];
  for (int n = 0; n < 2; ++n) tap[n] = tone_level(hit, (n ? 6.267 : 5.55) * hz(57), kRate, at(0.02), at(0.3));
  std::printf("the bar stands %.1f dB over the puff\n", db(tap[1] / tap[0]));
  EXPECT(db(tap[1] / tap[0]) > 8.0, "steel is plucked by the tongue");
  const double soft = (plain(), rms(lone(57, 0.1f, 1.0f), at(0.4))), hard = (plain(), rms(lone(57, 1.0f, 1.0f), at(0.4)));
  EXPECT(db(hard / soft) > 10.0 && (plain(), peak(lone(57, 0.0f, 0.5f))) < 1.0e-6, "a touch goes down to nothing");
  // Turn in the breaths that do not turn: a sniff, and a hold before the fall.
  double least[2] = {9.0, 9.0}, after[2];
  for (int slow = 0; slow < 2; ++slow) {
    plain({{kBreath, 3.0f}, {kTurn, slow ? 2.0f : 0.03f}, {kLung, 4.0f}}), lone(57, 0.7f, 0.5f);
    for (int i = 0; i < 400; ++i) render(device, 0.01f, kRate), least[slow] = std::min<double>(least[slow], device.meter(1));
    plain({{kBreath, 4.0f}, {kTurn, slow ? 2.0f : 0.03f}, {kLung, 4.0f}});
    after[slow] = rms(lone(57, 0.7f, 1.2f), at(0.9));
  }
  EXPECT(least[1] < 0.93 * least[0] && least[0] > 0.7, "circular breath sniffs for as long as Turn says");
  EXPECT(db(after[1] / after[0]) > 1.5, "once holds before it falls");
  device.init(kRate), lone(57, 0.7f, 0.5f);  // a phrase out, the next one in
  device.note_off(1), render(device, 0.05f, kRate), lone(60, 0.7f, 0.4f);
  EXPECT(device.meter(2) < -0.3f, "both takes the next phrase the other way");
}

// Sixteen keys on a long breath, a second in.
void held() {
  plain({{kLung, 30.0f}});
  for (int n = 0; n < 16; ++n) device.note_on(n, hz(45.0f + 2.0f * float(n)), 0.8f);
  render(device, 1.0f, kRate);
}

void clicks() {
  const double reference = (held(), kink(mono(render(device, 1.0f, kRate))));
  const auto after = [](auto event) { return held(), event(), kink(mono(render(device, 0.3f, kRate))); };
  const double stolen = after([] { device.note_on(40, hz(52.5f), 0.8f), device.note_on(41, hz(59.5f), 0.8f); });
  const double struck = after([] { device.note_on(3, hz(51.0f), 0.8f); });
  const double let_go = after([] { for (int n = 0; n < 16; ++n) device.note_off(n); });
  std::printf("kinks: still %.5f, stolen %.5f, struck %.5f, let go %.5f\n", reference, stolen, struck, let_go);
  EXPECT(std::max(stolen, struck) < 1.6 * reference, "a steal and a restrike do not click");
  EXPECT(let_go < 1.3 * reference, "letting go does not click");
  held(), device.set_param(kBody, 0.0f), render(device, 0.3f, kRate);
  const double bare = kink(mono(render(device, 0.3f, kRate)));  // what a pipe changes by way of
  for (int id : {int(kReed), int(kPipe), int(kBreath), int(kInterval)}) {
    const double by_way = id == kPipe ? std::max(bare, reference) : reference;
    for (int to = 0; to < 4; ++to) {
      held(), device.set_param(kSecond, 0.6f), render(device, 0.5f, kRate), device.set_param(id, float(to));
      const double change = kink(mono(render(device, 0.05f, kRate)));
      render(device, 0.6f, kRate);
      const double settled = kink(mono(render(device, 0.4f, kRate)));  // steel and the cone come to more
      EXPECT(change < 1.5 * std::max(by_way, settled), "a choice changes without a click");
    }
  }
}

void sweeps() {
  for (int id = 0; id < kNumParams; ++id) {
    device.init(kRate), chord(0.8f);
    render(device, 0.6f, kRate);
    Stereo x;
    for (int i = 0; i < 80; ++i) {
      const float t = 0.5f - 0.5f * std::cos(float(i) * 0.16f);
      device.set_param(id, kParamMin[id] + (kParamMax[id] - kParamMin[id]) * t);
      x = concat(x, render(device, 0.02f, kRate));
    }
    EXPECT(finite(x.left) && finite(x.right) && top_of(x) < 0.9, "a knob swept while sounding stays finite and under 0.9");
  }
  // Both ends of every knob at once, at random, seeded.
  uint32_t dice = 0xC0FFEEu;
  for (int patch = 0; patch < 24; ++patch) {
    device.init(kRate);
    for (int id = 0; id + 1 < kNumParams; ++id) {
      dice = dice * 1664525u + 1013904223u;
      const float t = float(dice >> 8) / 16777216.0f;
      device.set_param(id, kParamMin[id] + (kParamMax[id] - kParamMin[id]) * (patch < 12 ? t : (t < 0.5f ? 0.0f : 1.0f)));
    }
    chord();
    const Stereo x = render(device, 1.2f, kRate);
    EXPECT(finite(x.left) && finite(x.right) && top_of(x) < 1.0, "a random patch is finite and bounded");
  }
}

void bad_notes() {
  // One id sent at A, at B and at A again, then one off; the same inside the
  // fade of a steal, on a full pool.
  for (int full = 0; full < 2; ++full) {
    device.init(kRate);
    for (int n = 0; n < 16 && full; ++n) device.note_on(n, hz(40.0f + float(n)), 0.7f);
    render(device, 0.1f, kRate);
    for (float note : {70.0f, 71.0f, 70.0f}) device.note_on(50, hz(note), 0.7f), render(device, full ? 0.001f : 0.2f, kRate);
    device.note_off(50);
    for (int n = 0; n < 16; ++n) device.note_off(n);
    render(device, 6.0f, kRate);
    EXPECT(peak(render(device, 0.2f, kRate).left) == 0.0, "an id at A, B and A again ends with one note off");
  }
  for (float bad : {std::nanf(""), INFINITY, -INFINITY, 0.0f, -5.0f, 5.0f, 20000.0f, 1.0e30f}) {
    device.init(kRate);
    device.note_on(1, bad, 0.8f), device.note_on(2, hz(57), bad);
    const Stereo x = render(device, 0.4f, kRate);
    EXPECT(finite(x.left) && finite(x.right) && peak(x.left) < 1.0, "absurd notes are survived");
  }
}

void blocks_and_rates() {
  // The same whatever the block: events between two control ticks, a pipe
  // changed while it sounds, breath that goes round, a silence it sleeps in.
  Stereo first;
  for (int block : {128, 1, 7, 2048}) {
    device.init(kRate);
    device.set_param(kBreath, 3.0f);
    Stereo all;
    const auto run = [&](int frames) { all = concat(all, render(device, float(frames) / kRate, kRate, block)); };
    run(37);
    for (int n = 1; n < 7; ++n) device.note_on(n, hz(43.0f + 5.0f * n), 0.7f), run(1003);
    run(21013);
    device.set_param(kPipe, 3.0f), run(30011);
    for (int n = 1; n < 7; ++n) device.note_off(n);
    run(100003);
    device.set_param(kBite, 0.9f), run(1009);
    device.note_on(9, hz(62), 0.7f), run(40009);
    if (first.size() == 0) first = all;
    double worst = 0.0;
    for (size_t i = 0; i < std::min(first.size(), all.size()); ++i) worst = std::max<double>(worst, std::fabs(first.left[i] - all.left[i]));
    EXPECT(worst < 1.0e-6, "the block size makes no difference");
  }
  // Nothing of what was played before an init is heard after it.
  std::vector<float> fresh;
  for (int played = 0; played < 2; ++played) {
    device.init(kRate);
    for (int n = 0; n < 16 && played; ++n) device.note_on(n, hz(40.0f + n), 0.9f);
    render(device, played ? 0.4171f : 0.0f, kRate, 97);
    device.init(kRate);
    device.note_on(1, hz(52), 0.8f);
    Stereo x = render(device, 17.0f / kRate, kRate);
    for (int n = 2; n < 8; ++n) device.note_on(n, hz(50.0f + n), 0.8f);
    x = concat(x, render(device, 0.5f, kRate));
    if (played == 0) fresh = x.left;
    EXPECT(x.left == fresh, "an init leaves nothing behind");
  }
  double level[2];
  for (int moved = 0; moved < 2; ++moved) {
    plain({{kVolume, moved ? -6.0f : -30.0f}}), lone(57, 0.7f, 0.2f);
    device.note_off(1), render(device, 6.0f, kRate), device.set_param(kVolume, -30.0f);
    level[moved] = peak(lone(57, 0.7f, 0.02f));
  }
  EXPECT_NEAR(level[1] / level[0], 1.0, 0.05, "a knob moved while asleep is where it was put");
  std::vector<double> loud, bright;
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    device.init(rate);
    device.set_param(kLeak, 0.8f), chord();
    const std::vector<float> x = mono(render(device, 2.0f, rate));
    loud.push_back(db(rms(x, static_cast<size_t>(0.5f * rate))));
    bright.push_back(db(energy_above(x, 2000.0, rate, static_cast<size_t>(0.5f * rate))));
  }
  EXPECT(range(loud) < 0.7 && range(bright) < 1.5, "as loud and as bright at every rate");
  device.init(kRate), chord();
  render(device, 18.0f, kRate, 2048);
  const double early = rms(mono(render(device, 12.0f, kRate)));
  render(device, 40.0f, kRate, 2048);
  const double later = rms(mono(render(device, 12.0f, kRate)));
  EXPECT_NEAR(db(later / early), 0.0, 2.0, "a held chord goes on as it began");
}

}  // namespace

int main() {
  Conformance spec;
  spec.name = "common-air";
  spec.num_params = kNumParams;
  spec.mins = kParamMin;
  spec.maxs = kParamMax;
  spec.defaults = kParamDefault;
  spec.tail_seconds = 6.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);
  for (auto part : {tuning_and_level, lung_and_ways, order, sag_and_lock, shared_air, timbre, ranges, clicks, sweeps, bad_notes,
                    blocks_and_rates}) {
    part();
  }
  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, hz(45.0f + 3.0f * float(n)), 0.7f);
  render(device, 0.5f, kRate);
  report_cost("common-air, 8 keys with their second reeds", 10.0f, kRate, [] { render(device, 10.0f, kRate); });
  return finish("common-air");
}
