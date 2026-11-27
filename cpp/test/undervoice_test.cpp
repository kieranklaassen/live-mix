// Native harness for Undervoice (cpp/devices/undervoice): the conformance pass,
// then what makes it a throat that sings under itself, measured: undertones on
// the key divided, drips that count a power of two, one pulse under a chord, the
// door, the formants, the cap on close low keys, and the old faults.

#include "../devices/undervoice/undervoice.h"
#include <initializer_list>
#include <limits>
#include <utility>
#include "support/test_kit.h"
#include "undervoice_measure.h"

using namespace testkit;
using namespace undervoice_measure;
using livemix::Undervoice;
namespace p = livemix::undervoice;

static Undervoice device;
static char label[240];
#define SAY(condition, ...) EXPECT((std::snprintf(label, sizeof label, __VA_ARGS__), (condition)), label)

enum Division { kOne, kTwo, kThree, kFour, kEight, kDrips, kShared };

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }
static double loudest(const Stereo& s) { return std::max(peak(s.left), peak(s.right)); }
static float note_hz(float midi) { return 440.0f * std::exp2((midi - 69.0f) / 12.0f); }
static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

// One singer who stands still: no air, no turning, no chance, in the middle.
static void plain(Division division, std::initializer_list<std::pair<int, float>> more = {}, float rate = kRate) {
  device.init(rate);
  for (int id : {p::kTurn, p::kBreath, p::kDrift, p::kRoughness, p::kWhisper, p::kWidth}) device.set_param(id, 0.0f);
  device.set_param(p::kDivision, static_cast<float>(division));
  device.set_param(p::kSingers, 1.0f);
  device.set_param(p::kAttack, 0.01f);
  device.set_param(p::kVolume, 0.0f);
  for (const auto& knob : more) device.set_param(knob.first, knob.second);
}

static Stereo sing(float hz, float seconds, float gain = 0.7f, float rate = kRate) { return device.note_on(1, hz, gain), render(device, seconds, rate); }
static Stereo voice(Division division, std::initializer_list<std::pair<int, float>> more, float hz, float seconds, float gain = 0.7f) { return plain(division, more), sing(hz, seconds, gain); }

static void undertones() {
  // Exactly on the key divided, and gone when the false folds stay open.
  const int n[] = {1, 2, 3, 4, 8};
  for (int d = kTwo; d <= kEight; ++d) {
    const float hz = note_hz(62.0f), under = hz / static_cast<float>(n[d]);
    double line[2];
    for (int k = 0; k < 2; ++k) {
      const Stereo s = voice(static_cast<Division>(d), {{p::kDepth, k == 0 ? 0.8f : 0.0f}}, hz, 3.0f);
      line[k] = db(bin(s.left, hz + under, at(0.5), at(2.0)) / bin(s.left, hz, at(0.5), at(2.0)));
      if (k == 1) continue;
      const double found = pitch(s.left, under, at(0.5), at(2.4)), sum = pitch(s.left, hz + under, at(0.5), at(2.4));
      SAY(std::fabs(cents(found, under)) < 3.0 && std::fabs(cents(sum, hz + under)) < 1.0, "division %d: undertone %.3f against %.3f, sideband off by %.2f cents", n[d], found, under, cents(sum, hz + under));
    }
    SAY(line[0] > -24.0 && line[1] < -55.0, "division %d: the sideband is at %.1f dB with the folds in play and %.1f dB without", n[d], line[0], line[1]);
  }
  double last = -200.0;
  for (float depth : {0.1f, 0.3f, 0.5f, 0.7f, 1.0f}) {
    const Stereo s = voice(kTwo, {{p::kDepth, depth}}, 220.0f, 2.0f);
    const double level = db(bin(s.left, 330.0, at(0.5), at(1.2)) / bin(s.left, 220.0, at(0.5), at(1.2)));
    SAY(level > last + 0.8, "depth %.1f puts the undertone's line at %.1f dB", depth, level);
    last = level;
  }
}

static void in_tune() {
  for (float midi : {36.0f, 45.0f, 53.0f, 60.0f, 72.0f, 84.0f, 96.0f}) {
    for (float rate : {44100.0f, 96000.0f}) {
      plain(kTwo, {}, rate);
      const Stereo s = sing(note_hz(midi), 1.6f, 0.7f, rate);
      const double off = cents(pitch(s.left, note_hz(midi), at(0.4, rate), at(1.1, rate), 0.012, rate), note_hz(midi));
      SAY(std::fabs(off) < 2.0, "key %.0f at %.0f Hz is off by %.2f cents", midi, rate, off);
    }
  }
  const Stereo s = voice(kTwo, {{p::kDrift, p::kParamDefault[p::kDrift]}, {p::kTurn, 0.85f}, {p::kWhisper, 0.14f}}, note_hz(62.0f), 5.0f);
  const double off = cents(pitch(s.left, note_hz(62.0f), at(0.5), at(4.0)), note_hz(62.0f));
  SAY(std::fabs(off) < 5.0, "the default voice is off by %.2f cents", off);
}

static void drips() {
  for (float midi : {38.0f, 57.0f, 76.0f}) {
    plain(kDrips, {{p::kRing, 0.05f}, {p::kDepth, 1.0f}});
    const float hz = note_hz(midi);
    const Stereo s = sing(hz, 6.0f);
    const double rate = beat(s.left, at(0.2), 1.2, 4.4), turns = std::log2(hz / rate);
    SAY(std::fabs(turns - std::round(turns)) < 0.02 && turns > 4.9 && rate < 4.0, "key %.0f drips %.3f times a second: its 2 to the %.3f th part", midi, rate, turns);
  }
  double gap[2];
  for (int k = 0; k < 2; ++k) {
    const Stereo s = voice(kDrips, {{p::kDepth, 1.0f}, {p::kRing, k == 0 ? 0.0f : 0.9f}}, 220.0f, 4.0f);
    std::vector<float> e = envelope(s.left, at(1.0), 480);
    std::sort(e.begin(), e.end());
    gap[k] = db(e[e.size() / 10] / e[e.size() - 2]);
  }
  SAY(gap[0] < -30.0 && gap[1] > gap[0] + 15.0, "between drips it is %.1f dB down dry and %.1f dB down ringing", gap[0], gap[1]);
  // Skew: a struck group is loudest early, a swelling one late.
  double when[2];
  for (int k = 0; k < 2; ++k) {
    const Stereo s = voice(kDrips, {{p::kRing, 0.0f}, {p::kSkew, k == 0 ? 0.0f : 1.0f}}, note_hz(50.0f), 4.0f);
    const double period = std::exp2(std::ceil(std::log2(note_hz(50.0f) / Undervoice::kDripMost))) / note_hz(50.0f);
    const std::vector<float> e = envelope(s.left, at(2.0 * period), 240);
    size_t top = 0;
    for (size_t i = 0; i < static_cast<size_t>(period * 200.0); ++i) if (e[i] > e[top]) top = i;
    when[k] = static_cast<double>(top) / (period * 200.0);
  }
  SAY((when[0] < 0.25 || when[0] > 0.97) && when[1] > 0.6 && when[1] < 0.99, "a struck group is loudest at %.2f of its time, a swelling one at %.2f", when[0], when[1]);
}

static void shared() {
  plain(kShared, {{p::kDepth, 1.0f}});
  const double a = note_hz(57.0f), b = note_hz(61.0f), c = note_hz(64.0f);
  for (double key : {a, b, c}) device.note_on(static_cast<int>(key), static_cast<float>(key), 0.7f);
  const Stereo s = render(device, 5.0f, kRate);
  const double pulse = beat(s.left, at(0.6), 9.0, 35.0);
  for (double key : {a, b, c}) {
    const double turns = key / pulse, whole = std::round(turns);
    SAY(std::fabs(turns - whole) / whole < 0.02, "a pulse of %.2f goes %.3f times into %.2f", pulse, turns, key);
    const double off = cents(pitch(s.left, key, at(0.6), at(4.0), 0.004), key);
    SAY(std::fabs(off) < 2.0, "a shared pulse leaves its key in tune: %.2f cents", off);
  }
}

static void the_door() {
  // Turn: the undertone comes and goes, in the first three seconds already.
  double swing[2];
  for (int k = 0; k < 2; ++k) {
    const Stereo s = voice(kTwo, {{p::kTurn, static_cast<float>(k)}}, note_hz(62.0f), 3.6f);
    double least = 1.0, most = 0.0;
    for (double t = 0.3; t < 3.2; t += 0.1) {
      const double level = bin(s.left, 1.5 * note_hz(62.0f), at(t), at(0.2));
      least = std::min(least, level), most = std::max(most, level);
    }
    swing[k] = db(most / least);
  }
  SAY(swing[1] > 14.0 && swing[0] < 2.0, "the undertone's line swings %.1f dB with Turn and %.1f dB without", swing[1], swing[0]);
  // At Turn zero nothing is heard of the second division.
  const Stereo one = voice(kTwo, {{p::kSecond, 1.0f}}, 220.0f, 1.0f), four = voice(kTwo, {{p::kSecond, 4.0f}}, 220.0f, 1.0f);
  double apart = 0.0;
  for (size_t i = 0; i < one.size(); ++i) apart = std::max(apart, static_cast<double>(std::fabs(one.left[i] - four.left[i])));
  SAY(apart < 1.0e-4, "with Turn at zero the second division changes the sound by %g", apart);
  for (float breath : {0.0f, 1.0f}) {
    const Stereo s = voice(kTwo, {{p::kBreath, breath}}, note_hz(62.0f), 7.0f);
    const std::vector<float> e = envelope(s.left, at(0.4), 9600);
    const double range = db(peak(e) / *std::min_element(e.begin(), e.end()));
    SAY(breath == 0.0f ? range < 1.5 : range > 10.0, "with Breath at %.0f the level moves by %.1f dB", breath, range);
  }
}

static double share_above(float hz, int id, float value, float gain = 0.7f) {
  return db(energy_above(voice(kTwo, {{id, value}}, hz, 1.5f, gain).left, 1000.0, kRate, at(0.5)));
}

static void the_voice() {
  const double soft = share_above(147.0f, p::kClosure, 0.05f), hard = share_above(147.0f, p::kClosure, 0.95f);
  const double light = share_above(147.0f, p::kClosure, 0.5f, 0.2f), heavy = share_above(147.0f, p::kClosure, 0.5f, 1.0f);
  SAY(hard > soft + 6.0 && heavy > light + 8.0, "Closure takes what lies above 1 kHz from %.1f to %.1f dB, touch from %.1f to %.1f", soft, hard, light, heavy);
  // The vowel moves the formants: Ah has its energy near 1 kHz, Ee near 2 to 3.
  double ah[2] = {}, ee[2] = {};
  for (int k = 0; k < 2; ++k) {
    // 0.13 of the vowel is the division's own.
    const Stereo s = voice(kOne, {{p::kVowel, k == 0 ? 0.27f : 0.67f}, {p::kMouth, 1.0f}}, 100.0f, 1.5f);
    for (int h = 7; h <= 13; ++h) ah[k] += bin(s.left, 100.0 * h, at(0.5), at(0.8));
    for (int h = 20; h <= 32; ++h) ee[k] += bin(s.left, 100.0 * h, at(0.5), at(0.8));
  }
  SAY(db((ee[1] / ah[1]) / (ee[0] / ah[0])) > 12.0, "between Ah and Ee the balance of the formants turns by %.1f dB", db((ee[1] / ah[1]) / (ee[0] / ah[0])));
  double between[2];
  for (int k = 0; k < 2; ++k) {
    const Stereo s = voice(kOne, {{p::kWhisper, static_cast<float>(k)}}, 400.0f, 2.0f);
    double gaps = 0.0, lines = 0.0;
    for (int h = 1; h <= 6; ++h)
      gaps += bin(s.left, 400.0 * h + 190.0, at(0.4), at(1.5)), lines += bin(s.left, 400.0 * h, at(0.4), at(1.5));
    between[k] = db(gaps / lines);
  }
  SAY(between[0] < -60.0 && between[1] > -35.0, "between the harmonics lie %.1f dB with no air and %.1f dB in a whisper", between[0], between[1]);
  Stereo s = voice(kTwo, {{p::kSingers, 4.0f}}, 220.0f, 2.0f);
  double side = 0.0;
  for (size_t i = 0; i < s.size(); ++i) side = std::max(side, std::fabs(static_cast<double>(s.left[i]) - s.right[i]));
  SAY(side < 1.0e-5, "with Width at zero the sides differ by %g", side);
  s = voice(kOne, {{p::kSingers, 4.0f}, {p::kWidth, 1.0f}}, 220.0f, 2.0f);
  const double same = correlation(s.left, s.right, at(0.5));
  SAY(same < 0.9 && same > -0.3, "at full Width the sides agree to %.2f", same);
}

// The knobs that were weak or untrue once: each division keeps its width and
// its air of darkness, the open voice has folds of its own, what is rough is
// uneven by groups, and ten keys struck hard on one pitch stay under the knee.
static void every_division() {
  for (int d = 0; d < Undervoice::kDivisions; ++d) {
    double ratio[2];
    for (int k = 0; k < 2; ++k) {
      device.init(kRate);
      device.set_param(p::kDivision, static_cast<float>(d));
      device.set_param(p::kWidth, static_cast<float>(k));
      for (float key : {50.0f, 57.0f, 65.0f, 72.0f, 76.0f}) device.note_on(static_cast<int>(key), note_hz(key), 0.7f);
      const Stereo s = render(device, 3.0f, kRate);
      double side = 0.0, mid = 0.0;
      for (size_t i = at(0.5); i < s.size(); ++i) side += std::pow(s.left[i] - s.right[i], 2.0), mid += std::pow(s.left[i] + s.right[i], 2.0);
      ratio[k] = 10.0 * std::log10(side / mid + 1.0e-12);
      const double hard = db(energy_above(s.left, 2000.0, kRate, at(0.5)));
      SAY(hard < -7.0, "division %d holds %.1f dB above 2 kHz", d, hard);
    }
    SAY(ratio[1] > -14.0 && ratio[0] < -60.0, "division %d: the sides are at %.1f dB wide open and at %.1f dB shut", d, ratio[1], ratio[0]);
    for (float step : {0.0f, 4.0f}) {
      device.init(kRate);
      device.set_param(p::kDivision, static_cast<float>(d));
      for (int k = 0; k < 10; ++k) device.note_on(k, note_hz(57.0f + step * static_cast<float>(k - 3)), 1.0f);
      const double top = loudest(render(device, 3.0f, kRate));
      SAY(top < 0.5, "ten hard keys %.0f semitones apart peak at %.2f on division %d", step, top, d);
    }
  }
  double bright[2], uneven[2];
  for (int k = 0; k < 2; ++k) {
    Stereo s = voice(kOne, {{p::kDepth, static_cast<float>(k)}, {p::kRing, 0.0f}}, 147.0f, 1.5f);
    bright[k] = db(energy_above(s.left, 1000.0, kRate, at(0.5)));
    s = voice(kDrips, {{p::kDepth, 1.0f}, {p::kRing, 0.0f}, {p::kRoughness, static_cast<float>(k)}}, 220.0f, 8.0f);
    double hz = 220.0, least = 1.0, most = 0.0;
    while (hz > Undervoice::kDripMost) hz *= 0.5;
    for (int drop = 1; drop < 20; ++drop) {
      const double level = rms(s.left, at(drop / hz), at((drop + 0.9) / hz));
      least = std::min(least, level), most = std::max(most, level);
    }
    uneven[k] = db(most / least);
  }
  SAY(std::fabs(bright[1] - bright[0]) > 3.0, "Depth takes what the open voice has above 1 kHz from %.1f to %.1f dB", bright[0], bright[1]);
  SAY(uneven[0] < 1.5 && uneven[1] > 14.0, "drops differ by %.1f dB clean and by %.1f dB rough", uneven[0], uneven[1]);
  // The floor of a slow division is a tone and not a flutter.
  double floor[2];
  for (int k = 0; k < 2; ++k) {
    const Stereo s = voice(kShared, {{p::kChest, static_cast<float>(k)}, {p::kDepth, 1.0f}}, 147.0f, 3.0f);
    floor[k] = 0.0;
    for (double hz = 42.0; hz < 84.0; hz += 0.5) floor[k] = std::max(floor[k], bin(s.left, hz, at(0.6), at(2.0)));
  }
  SAY(db(floor[1] / floor[0]) > 12.0, "Chest lifts the floor of a purr by %.1f dB", db(floor[1] / floor[0]));
}

static void close_low_keys() {
  double under[2];
  for (int k = 0; k < 2; ++k) {
    plain(kTwo);
    if (k == 1) device.note_on(2, note_hz(47.0f), 0.7f), device.note_on(3, note_hz(43.0f), 0.7f);
    const Stereo s = sing(note_hz(45.0f), 4.0f);
    under[k] = db(bin(s.left, 0.5 * note_hz(45.0f), at(0.6), at(3.2)) / bin(s.left, note_hz(45.0f), at(0.6), at(3.2)));
  }
  SAY(under[1] < under[0] - 2.5, "a low key's floor is at %.1f dB alone and %.1f dB in a close chord", under[0], under[1]);
}

static void nothing_folds_back() {
  for (float midi : {88.0f, 97.0f, 105.0f}) {
    plain(kOne, {{p::kClosure, 1.0f}});
    const double hz = 1.0037 * note_hz(midi);
    const Stereo s = sing(static_cast<float>(hz), 1.5f);
    double worst = 0.0;
    for (int h = 1; h < 60; ++h) {
      double f = std::fmod(hz * h, kRate);
      if (f > 0.5 * kRate) f = kRate - f;
      const double off = std::fabs(f - hz * std::round(f / hz));
      if (hz * h < 0.5 * kRate || f < 60.0 || off < 12.0 || f > 9000.0) continue;
      worst = std::max(worst, bin(s.left, f, at(0.4), at(1.0)));
    }
    const double level = db(worst / bin(s.left, hz, at(0.4), at(1.0)));
    SAY(level < -46.0, "what folds back on key %.0f is at %.1f dB", midi, level);
  }
}

static void levels() {
  double least = 0.0, most = -200.0;
  for (float midi = 36.0f; midi <= 84.0f; midi += 4.0f) {
    device.init(kRate);
    const Stereo s = sing(note_hz(midi), 2.5f);
    const double level = db(std::sqrt(0.5 * (std::pow(rms(s.left, at(0.5)), 2.0) + std::pow(rms(s.right, at(0.5)), 2.0))));
    least = std::min(least, level), most = std::max(most, level);
    SAY(db(loudest(s)) > -25.0 && db(loudest(s)) < -10.0, "key %.0f peaks at %.1f dB", midi, db(loudest(s)));
  }
  SAY(most - least < 5.0, "from C2 to C6 the level lies between %.1f and %.1f dB", least, most);
}

// A soft round voice, under which a click has nowhere to hide.
static void gentle(Division division, int id, float value) {
  plain(division, {{p::kClosure, 0.08f}, {p::kMouth, 1.0f}, {p::kSingers, 2.0f}, {p::kAttack, 0.05f}, {id, value}});
}

static void no_clicks() {
  // Every knob and every choice, jumped from end to end while a note sounds.
  for (int id = 0; id < p::kVolume; ++id) {
    double still = 0.0;
    for (float part : {0.0f, 0.2f, 0.4f, 0.6f, 0.8f, 1.0f}) {
      gentle(kTwo, id, p::kParamMin[id] + part * (p::kParamMax[id] - p::kParamMin[id]));
      still = std::max(still, tick(sing(220.0f, 1.5f).left, at(0.3), at(1.5)));
    }
    gentle(kTwo, id, p::kParamMin[id]);
    Stereo s = sing(220.0f, 0.5f);
    for (int k = 0; k < 8; ++k) {
      device.set_param(id, (k & 1) == 0 ? p::kParamMax[id] : p::kParamMin[id]);
      s = concat(s, render(device, 0.111f, kRate));
    }
    const double moved = tick(s.left, at(0.3), s.size());
    SAY(finite(s.left) && moved < 2.0 * still + 0.00002, "param %d jumped ticks at %.6f against %.6f held still", id, moved, still);
  }
  double still = 0.0;
  // A change passes through each division with its folds wide open.
  for (int d = 0; d < 8; ++d) {
    gentle(static_cast<Division>(d / 2), (d & 1) == 0 ? p::kVolume : p::kDepth, 0.0f);
    still = std::max(still, tick(sing(220.0f, 1.5f).left, at(0.3), at(1.5)));
  }
  gentle(kOne, p::kVolume, 0.0f);
  Stereo s = sing(220.0f, 0.5f);
  for (int d : {3, 1, 0, 2, 0, 1, 3, 2, 1, 2, 3, 0}) {
    device.set_param(p::kDivision, static_cast<float>(d));
    s = concat(s, render(device, 0.17f, kRate));
  }
  SAY(tick(s.left, at(0.3), s.size()) < 1.25 * still, "changing the division ticks at %.6f against %.6f", tick(s.left, at(0.3), s.size()), still);
  gentle(kOne, p::kVolume, 0.0f);
  for (int k = 0; k < 12; ++k) device.note_on(k, note_hz(40.0f + 2.0f * static_cast<float>(k)), 0.8f);
  const double before = tick(render(device, 1.0f, kRate).left, at(0.3), at(1.0));
  Stereo held;
  for (int k = 0; k < 30; ++k) {
    device.note_on(k % 3 == 0 ? 5 : 50 + k, note_hz(41.0f + static_cast<float>((k * 7) % 24)), 0.8f);
    held = concat(held, render(device, 0.037f, kRate));
  }
  SAY(tick(held.left, 0, held.size()) < 1.2 * before, "stolen keys tick at %.6f against %.6f before", tick(held.left, 0, held.size()), before);
}

static void swept_while_sounding() {
  plain(kTwo);
  for (int k = 0; k < 5; ++k) device.note_on(k, note_hz(45.0f + 7.0f * static_cast<float>(k)), 0.9f);
  bool fine = true;
  double top = 0.0;
  for (int id = 0; id < p::kNumParams; ++id) {
    for (int k = 0; k <= 12; ++k) {
      device.set_param(id, p::kParamMin[id] + static_cast<float>(k) / 12.0f * (p::kParamMax[id] - p::kParamMin[id]));
      const Stereo s = render(device, 0.02f, kRate);
      fine = fine && finite(s.left) && finite(s.right), top = std::max(top, loudest(s));
    }
    device.set_param(id, p::kParamDefault[id]);
  }
  SAY(fine && top < 1.0, "every knob swept under a chord: finite %d, peak %.2f", fine, top);
}

static void keys_end() {
  const float bad = std::nanf(""), big = std::numeric_limits<float>::infinity();
  device.init(kRate);
  const float absurd[4][2] = {{bad, 0.7f}, {big, 0.7f}, {-5.0f, bad}, {1.0e9f, -3.0f}};
  for (int k = 0; k < 4; ++k) device.note_on(k + 1, absurd[k][0], absurd[k][1]);
  Stereo s = render(device, 1.0f, kRate);
  EXPECT(finite(s.left) && finite(s.right) && loudest(s) < 1.0, "absurd notes stay finite and bounded");
  for (int k = 1; k < 5; ++k) device.note_off(k);
  // One id struck on A, on B and on A again, then let go once; and a pile that
  // is restruck in the very moment its keys are stolen.
  for (int pass = 0; pass < 2; ++pass) {
    device.init(kRate);
    device.set_param(p::kRelease, 0.2f);
    if (pass == 1) {
      for (int k = 0; k < 20; ++k) device.note_on(20 + k, 110.0f + 11.0f * static_cast<float>(k), 0.8f);
      render(device, 0.1f, kRate);
    }
    for (float hz : {220.0f, 330.0f, 220.0f}) {
      device.note_on(7, hz, 0.8f);
      render(device, pass == 0 ? 0.2f : 0.002f, kRate);
    }
    device.note_off(7);
    for (int k = 0; k < 20; ++k) device.note_off(20 + k);
    render(device, 3.0f, kRate);
    s = render(device, 0.5f, kRate);
    SAY(loudest(s) == 0.0, "nothing is left after one note off, pass %d (peak %g)", pass, loudest(s));
  }
  for (float fade : {0.5f, 30.0f}) {
    s = voice(kTwo, {{p::kFade, fade}}, 220.0f, 4.0f);
    const double left = db(rms(s.left, at(3.5)) / rms(s.left, at(0.1), at(0.3)));
    SAY(fade < 1.0f ? left < -60.0 : left > -3.0, "with Fade at %.1f s a held key is at %.1f dB after four", fade, left);
  }
}

// A tune with a long silence in it, in blocks of the given size.
static std::vector<float> tune(int block, Division next = kFour) {
  device.init(kRate);
  device.set_param(p::kRelease, 0.1f);
  std::vector<float> out;
  const auto go = [&](int frames) {
    for (int n; frames > 0; frames -= n) {
      device.process(n = std::min(frames, block));
      for (int i = 0; i < n; ++i) out.push_back(device.out_left()[i] + 0.5f * device.out_right()[i]);
    }
  };
  device.note_on(1, 220.0f, 0.8f);
  go(8192);
  device.set_param(p::kDivision, static_cast<float>(next));
  device.note_on(2, 277.2f, 0.6f);
  go(12288);
  for (int k = 1; k < 3; ++k) device.note_off(k);
  go(6 * 8192 + 8192 * 16);
  device.note_on(3, 165.0f, 0.8f);
  go(8192);
  return out;
}

static void same_everywhere() {
  const std::vector<float> one = tune(1), many = tune(128), most = tune(2048);
  double worst = 0.0;
  for (size_t i = 0; i < one.size(); ++i)
    worst = std::max(worst, static_cast<double>(std::max(std::fabs(one[i] - many[i]), std::fabs(one[i] - most[i]))));
  SAY(worst < 1.0e-6 && peak(one, one.size() - 8192) > 0.01, "blocks of 1, 128 and 2048 differ by %g", worst);
  EXPECT(tune(128) == many, "the same notes give the same sound");
  const std::vector<float> fresh = tune(128, kShared);
  plain(kShared);
  sing(1000.0f, 1.0f);
  EXPECT(tune(128, kShared) == fresh, "a shared pulse starts the same whatever was played before");
  double level[3][5];
  const float rates[3] = {44100.0f, 48000.0f, 96000.0f};
  for (int r = 0; r < 3; ++r) {
    const float rate = rates[r];
    plain(kTwo, {}, rate);
    const Stereo s = sing(220.0f, 2.0f, 0.7f, rate);
    int k = 0;
    for (double hz : {110.0, 220.0, 330.0, 880.0, 2200.0}) level[r][k++] = db(bin(s.left, hz, at(0.5, rate), at(1.4, rate), rate));
  }
  for (int k = 0; k < 5; ++k)
    SAY(std::fabs(level[0][k] - level[1][k]) < 1.2 && std::fabs(level[2][k] - level[1][k]) < 1.2, "partial %d at 44.1, 48 and 96 kHz: %.1f %.1f %.1f dB", k, level[0][k], level[1][k], level[2][k]);
}

int main() {
  Conformance spec;
  spec.name = "undervoice";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin, spec.maxs = p::kParamMax, spec.defaults = p::kParamDefault;
  spec.tail_seconds = 8.0f, spec.max_peak = 1.0f;
  check_instrument(device, spec);
  for (void (*part)() : {undertones, in_tune, drips, shared, the_door, the_voice, every_division, close_low_keys, nothing_folds_back, levels, no_clicks,
                         swept_while_sounding, keys_end, same_everywhere}) {
    part();
  }
  device.init(kRate);
  for (int k = 0; k < 8; ++k) device.note_on(k, note_hz(48.0f + 4.0f * static_cast<float>(k)), 0.8f);
  report_cost("eight held keys", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });
  return finish("undervoice");
}
