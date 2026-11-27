// Spun Wire: the wheel (its passes, its coast, its gears), the six wires, the
// seam between plucks and rub, and what every device is held to.

#include <algorithm>
#include <array>
#include <cmath>
#include <ctime>
#include <limits>

#include "../devices/spun-wire/spun_wire.h"
#include "support/test_kit.h"

using namespace testkit;
namespace p = livemix::spun_wire;

namespace {

constexpr float kRate = 48000.0f;
livemix::SpunWire device;

using Settings = std::vector<std::pair<int, float>>;

// One thing done at a sample: 'n' note on, 'f' note off, 'p' a knob.
struct Event {
  size_t at;
  char kind;
  int id;
  float x, y;
};

Stereo play(const std::vector<Event>& events, size_t total, int block, const Settings& settings = {}, float rate = kRate) {
  device.init(rate);
  for (const auto& s : settings) device.set_param(s.first, s.second);
  Stereo out{std::vector<float>(total), std::vector<float>(total)};
  size_t done = 0, next = 0;
  while (done < total) {
    while (next < events.size() && events[next].at <= done) {
      const Event& e = events[next++];
      if (e.kind == 'n') device.note_on(e.id, e.x, e.y);
      if (e.kind == 'f') device.note_off(e.id);
      if (e.kind == 'p') device.set_param(e.id, e.x);
    }
    size_t n = std::min<size_t>(static_cast<size_t>(block), total - done);
    if (next < events.size()) n = std::min(n, events[next].at - done);
    device.process(static_cast<int>(n));
    std::copy_n(device.out_left(), n, out.left.begin() + static_cast<long>(done));
    std::copy_n(device.out_right(), n, out.right.begin() + static_cast<long>(done));
    done += n;
  }
  return out;
}

Stereo note(float hz, float gain, float held, float total, const Settings& settings = {}, float rate = kRate) {
  return play({{0, 'n', 1, hz, gain}, {static_cast<size_t>(held * rate) / 128 * 128, 'f', 1, 0, 0}},
              static_cast<size_t>(total * rate), 128, settings, rate);
}

std::vector<float> mono(const Stereo& s) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (s.left[i] + s.right[i]);
  return out;
}

size_t at(double seconds) { return static_cast<size_t>(seconds * kRate); }
double seconds_db(const std::vector<float>& x, double from, double to) { return db(rms(x, at(from), at(to))); }

struct Range {
  double lo = 1e9, hi = -1e9;
  void add(double v) { lo = std::min(lo, v), hi = std::max(hi, v); }
  double size() const { return hi - lo; }
};

// How far the level moves, in dB, in windows of `step`.
double swing(const std::vector<float>& x, double from, double to, double step) {
  Range found;
  for (double t = from; t < to; t += step) found.add(db(rms(x, at(t), at(t + step))));
  return found.size();
}

// A dry, plain wheel: short wires, nothing that moves by itself.
Settings plain(Settings more) {
  Settings s = {{p::kTuning, 0}, {p::kWobble, 0},  {p::kWidth, 0},   {p::kBeat, 0}, {p::kLacing, 0}, {p::kHub, 0},
                {p::kRim, 0},    {p::kRise, 0.02f}, {p::kGauge, 0}, {p::kMelt, 40}, {p::kRing, 0.15f}};
  s.insert(s.end(), more.begin(), more.end());
  return s;
}

// Where plucks begin: the level of 4 ms jumps over the 12 ms before by 6 dB.
std::vector<double> onsets(const std::vector<float>& x, double floor = 1.0e-3) {
  std::vector<double> out;
  std::vector<double> level;
  const size_t hop = at(0.004);
  for (size_t i = 0; i + hop <= x.size(); i += hop) level.push_back(peak(x, i, i + hop));
  double last = -1.0;
  for (size_t i = 3; i < level.size(); ++i) {
    const double before = std::max(level[i - 2], level[i - 3]), t = static_cast<double>(i * hop) / kRate;
    if (level[i] > floor && level[i] > 1.7 * before && t - last > 0.03) out.push_back(last = t);
  }
  return out;
}

double second_step(const std::vector<float>& x, size_t from, size_t to) {
  double worst = 0.0;
  to = std::min(to, x.size());
  for (size_t i = std::max<size_t>(2, from); i < to; ++i) worst = std::max(worst, std::fabs(1.0 * x[i] - 2.0 * x[i - 1] + x[i - 2]));
  return worst;
}

void test_tuning() {
  double worst = 0.0;
  for (float midi : {36.0f, 48.0f, 60.0f, 72.0f, 84.0f}) {
    for (float gauge : {0.0f, 0.6f}) {
      const float hz = 440.0f * std::pow(2.0f, (midi - 69.0f) / 12.0f);
      const Stereo s = note(hz, 0.7f, 6, 6, plain({{p::kGauge, gauge}, {p::kRing, 5}, {p::kSpin, 20}, {p::kMelt, 8}}));
      const double found = dominant_frequency(s.left, kRate, hz * 0.97, hz * 1.03, at(3), at(5));
      worst = std::max(worst, std::fabs(1200.0 * std::log2(found / hz)));
    }
  }
  std::printf("tuning: within %.2f cents, C2 to C6, fine wire and heavy\n", worst);
  EXPECT(worst < 3.0, "the wires are in tune");
}

void test_passes() {
  for (float spin : {2.0f, 5.0f}) {
    const std::vector<float> x = mono(note(220, 0.8f, 8, 8, plain({{p::kSpin, spin}})));
    const auto hits = onsets(x);
    double count = 0;
    for (double t : hits) count += t > 2.0 && t < 7.0 ? 1 : 0;
    std::printf("passes: Spin %.0f gives %.1f plucks a second\n", spin, count / 5.0);
    EXPECT(std::fabs(count / 5.0 - spin) < 0.14 * spin + 0.1, "Spin is the passes a second");
  }
  // Spin up: the first gaps are longer than the last.
  const auto hits = onsets(mono(note(220, 0.8f, 8, 8, plain({{p::kSpin, 6}, {p::kRise, 4}}))));
  EXPECT(hits.size() > 12 && hits[1] - hits[0] > 1.8 * (hits[hits.size() - 1] - hits[hits.size() - 2]), "the passes draw together as the wheel spins up");
}

void test_coast() {
  double rests[2];
  int k = 0;
  for (float coast : {3.0f, 8.0f}) {
    const std::vector<float> x = mono(note(220, 0.9f, 2, 14, plain({{p::kSpin, 10}, {p::kCoast, coast}, {p::kRelease, 5}})));
    auto hits = onsets(x, 4.0e-4);
    hits.erase(std::remove_if(hits.begin(), hits.end(), [](double t) { return t < 2.1; }), hits.end());
    EXPECT(hits.size() > 6, "a key let go still plucks");
    if (hits.size() < 7) return;
    const size_t n = hits.size();
    const double first = hits[1] - hits[0], last = hits[n - 1] - hits[n - 2];
    std::printf("coast %.0f s: %zu plucks after the key, gaps %.2f to %.2f s, the last at %.2f s\n", coast, n, first, last, hits[n - 1] - 2.0);
    EXPECT(last > 3.0 * first, "the last plucks stand apart");
    int wider = 0;
    for (size_t i = n - 4; i < n; ++i) wider += hits[i] - hits[i - 1] > hits[i - 1] - hits[i - 2] ? 1 : 0;
    EXPECT(wider >= 3, "each gap is longer than the one before");
    EXPECT(hits[n - 1] - 2.0 < coast, "and the wheel stands by the time Coast says");
    EXPECT(static_cast<double>(n) < 1.25 * 10 * coast / 3 && static_cast<double>(n) > 0.6 * 10 * coast / 3, "it turns a third as far as it would undriven");
    rests[k++] = hits[n - 1] - 2.0;
  }
  EXPECT(rests[1] > 1.8 * rests[0], "Coast says how long it runs on");
}

// The rub grows out of the plucks: no step in level as the wheel goes through
// Melt, up and down, and a pluck's rhythm is gone above it.
void test_seam() {
  for (float ring : {1.2f, 4.5f}) {
    const std::vector<float> x =
        mono(note(262, 0.7f, 10, 18, plain({{p::kSpin, 50}, {p::kMelt, 14}, {p::kRise, 6}, {p::kRing, ring}, {p::kCoast, 9}})));
    double jump = 0.0, last = seconds_db(x, 1.0, 1.5);
    const double whole = swing(x, 1, 14, 0.5);
    for (double t = 1.0; t < 14.0; t += 0.5) {
      const double level = seconds_db(x, t, t + 0.5);
      jump = std::max(jump, std::fabs(level - last));
      last = level;
    }
    std::printf("seam: ring %.1f s, level within %.1f dB from 4 to 50 passes a second and back, steps under %.1f dB\n", ring, whole, jump);
    EXPECT(whole < 3.0 && jump < 2.0, "plucks melt into the rub with no step in level");
  }
  const auto ripple = [](float melt) { return swing(mono(note(262, 0.7f, 5, 5, plain({{p::kSpin, 12}, {p::kMelt, melt}, {p::kRing, 0.4f}}))), 3, 4.8, 0.01); };
  const double plucked = ripple(40), rubbed = ripple(3);
  std::printf("seam: level moves %.1f dB plucked and %.1f dB rubbed, at 12 passes a second\n", plucked, rubbed);
  EXPECT(plucked > 5.0 && rubbed < 0.4 * plucked, "Melt turns passes into one tone");
}

void test_six_wires() {
  const double want[6] = {1, 3, 5, 7, 9, 6};
  const Stereo s = note(110, 0.8f, 4, 4, plain({{p::kTuning, 2}, {p::kSpin, 2}, {p::kRing, 0.3f}, {p::kEdge, 0.8f}, {p::kRise, 0.02f}}));
  int right = 0;
  const auto hits = onsets(mono(s));
  for (size_t k = 0; k < 6 && k < hits.size(); ++k) {
    // The lowest partial this pluck has: the first harmonic of 110 within 14 dB of its strongest.
    double most = 0, level[10];
    for (int n = 1; n <= 9; ++n) {
      level[n] = tone_level(s.left, 110.0 * n, kRate, at(hits[k] + 0.02), at(hits[k] + 0.2));
      most = std::max(most, level[n]);
    }
    int lowest = 1;
    while (lowest < 9 && level[lowest] < 0.2 * most) ++lowest;
    right += std::fabs(lowest - want[k]) < 0.5 ? 1 : 0;
  }
  std::printf("six wires: %d of 6 plucks speak the overtone of their wire\n", right);
  EXPECT(right == 6, "each pass plucks the next of six wires");
}

void test_gestures() {
  const auto once = onsets(mono(note(220, 0.8f, 6, 6, plain({{p::kGesture, 1 + 1}, {p::kSpin, 6}}))));
  std::printf("gestures: one turn makes %zu plucks\n", once.size() + 1);
  EXPECT(once.size() + 1 == 6 || once.size() == 6, "one turn plucks each of the six wires once");
  const auto three = onsets(mono(note(220, 0.8f, 6, 6, plain({{p::kGesture, 2}, {p::kSpin, 6}, {p::kStrung, 3}}))));
  EXPECT(three.size() + 3 == once.size(), "and each of three when three are strung");
  const std::vector<float> thrown = mono(note(220, 0.8f, 9, 9, plain({{p::kGesture, 1}, {p::kSpin, 12}, {p::kCoast, 3}})));
  EXPECT(seconds_db(thrown, 1, 2) > -60 && peak(thrown, at(7.5), at(9)) == 0.0, "a wheel thrown once comes to rest while its key is down");
  const double falls = swing(mono(note(220, 0.8f, 8, 8, plain({{p::kGesture, 3}, {p::kSpin, 12}, {p::kRing, 1}, {p::kCoast, 2}}))), 3, 7.5, 0.1);
  std::printf("gestures: rocked, the level falls %.0f dB at the turning points\n", falls);
  EXPECT(falls > 20 && falls < 46, "a rocked wheel falls silent where it turns");
}

void test_gear() {
  const auto speed = [](float gear, int keys) {
    device.init(kRate);
    for (const auto& [id, value] : Settings{{p::kGear, gear}, {p::kSpin, 8}, {p::kRise, 0.05f}, {p::kWobble, 0}}) device.set_param(id, value);
    for (int n = 0; n < keys; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 4 / 12.0f), 0.7f);
    render(device, 3.0f, kRate);
    return static_cast<double>(device.meter(1));
  };
  std::printf("gear: third key of a chord turns %.2f %.2f %.2f times as fast (3:4:5, 1:2:3, and from the top)\n", speed(2, 3) / speed(2, 1), speed(3, 3) / speed(3, 1), speed(4, 3) / speed(4, 1));
  EXPECT_NEAR(speed(2, 3) / speed(2, 1), 5.0 / 3.0, 0.05, "3:4:5");
  EXPECT_NEAR(speed(3, 3) / speed(3, 1), 3.0, 0.08, "1:2:3");
  EXPECT_NEAR(speed(4, 3) / speed(4, 1), 1.0 / 3.0, 0.03, "1:2:3 from the top key down");
  EXPECT_NEAR(speed(1, 3) / speed(1, 1), 1.0, 0.03, "together");
}

void test_wires() {
  // Ring is the time to -60 dB of a wire; Damp takes the top sooner.
  for (float ring : {1.0f, 4.0f}) {
    const Stereo held = note(330, 0.8f, 8, 8, plain({{p::kGesture, 2}, {p::kStrung, 1}, {p::kRing, ring / 1.6f / 1.1f}, {p::kDamp, 0.2f}}));
    const double found = rt60(held.left, kRate, 0.3, 0.1, -85);
    std::printf("wires: asked to ring %.1f s, rings %.2f s\n", ring, found);
    EXPECT(std::fabs(found / ring - 1.0) < 0.35, "Ring is the ring time of a wire");
  }
  const auto top = [](float damp) {
    const Stereo s = note(220, 0.8f, 4, 4, plain({{p::kGesture, 2}, {p::kPlucker, 2}, {p::kRing, 4}, {p::kDamp, damp}}));
    const double all = rms(s.left, at(1), at(2));
    return all * all * energy_above(s.left, 1500, kRate, at(1), at(2));
  };
  EXPECT(top(0.0f) > 10.0 * top(1.0f), "Damp takes the overtones");
  // Lacing: more wires are heard after one pluck of a slow wheel.
  const auto after = [](float lacing) {
    const Stereo s = note(220, 0.8f, 3, 3, plain({{p::kTuning, 2}, {p::kSpin, 0.5f}, {p::kRing, 2}, {p::kDamp, 0.3f}, {p::kLacing, lacing}}));
    return tone_level(s.left, 220 * 7, kRate, at(0.25), at(0.5)) / tone_level(s.left, 220, kRate, at(0.25), at(0.5));
  };
  std::printf("lacing: the fourth wire answers at %.2f, alone at %.2f of the plucked one\n", after(1.0f), after(0.0f));
  EXPECT(after(1.0f) > 1.8 * after(0.0f), "a laced wheel hands a pluck on");
  // Gauge stretches the third partial.
  const Stereo heavy = note(220, 0.8f, 3, 3, plain({{p::kGesture, 2}, {p::kStrung, 1}, {p::kRing, 8}, {p::kGauge, 0.6f}, {p::kDamp, 0}}));
  const double third = dominant_frequency(heavy.left, kRate, 640, 760, at(0.2), at(1.2));
  std::printf("gauge: third partial %.0f cents sharp at 0.6\n", 1200 * std::log2(third / 660));
  EXPECT(third > 663.0, "heavy wire stretches its overtones");
  // Beat moves the level of wires at one pitch; Edge opens the plucker.
  const auto swings = [](float beat) {
    return swing(mono(note(220, 0.8f, 5, 5, plain({{p::kSpin, 40}, {p::kMelt, 3}, {p::kRing, 8}, {p::kLacing, 1}, {p::kBeat, beat}}))), 2, 4.8, 0.05);
  };
  const auto open = [](float edge) { return energy_above(note(220, 0.7f, 3, 3, plain({{p::kEdge, edge}})).left, 1000, kRate); };
  std::printf("beat: the level moves %.1f dB, and %.1f without; edge: %.4f and %.4f above 1 kHz\n", swings(1), swings(0), open(0.2f), open(0.8f));
  EXPECT(swings(1) > swings(0) + 3.0, "wires at one pitch beat");
  EXPECT(open(0.8f) > 2.0 * open(0.2f), "Edge opens the plucker");
  // However fast, plucks do not pile up.
  const auto loud = [](float spin) { return peak(note(220, 1, 5, 5, plain({{p::kSpin, spin}, {p::kStrung, 1}, {p::kRing, 15}})).left, at(0.1)); };
  std::printf("refill: peak %.3f at 2 and %.3f at 40 passes a second on one long wire\n", loud(2), loud(40));
  EXPECT(loud(40) < 2.0 * loud(2), "a wire that still rings takes only what it has lost");
}

void test_touch_and_level() {
  const Stereo soft = note(220, 0.3f, 3, 3), hard = note(220, 1.0f, 3, 3);
  const double b0 = energy_above(soft.left, 800, kRate), b1 = energy_above(hard.left, 800, kRate);
  std::printf("touch: %.1f dB between 0.3 and 1, share above 800 Hz %.4f and %.4f\n", db(rms(hard.left) / rms(soft.left)), b0, b1);
  EXPECT(rms(hard.left) > 2.0 * rms(soft.left) && b1 > 1.15 * b0, "a hard touch is louder and brighter");
  Range even;
  for (float hz : {65.4f, 130.8f, 261.6f, 523.2f, 1046.5f}) {
    const Stereo s = note(hz, 0.7f, 3, 3);
    const double level = std::max(db(peak(s.left)), db(peak(s.right)));
    EXPECT(level < -10 && level > -24.5, "one note peaks where it should");
    even.add(level);
  }
  std::printf("levels: peaks %.1f to %.1f dBFS from C2 to C6\n", even.lo, even.hi);
  EXPECT(even.size() < 5.0, "level is even over the keyboard");
  std::vector<Event> ten;
  for (int n = 0; n < 10; ++n) ten.push_back({0, 'n', n, 82.4f * std::pow(2.0f, n * 4 / 12.0f), 1.0f});
  const Stereo chord = play(ten, at(6), 128);
  std::printf("levels: ten keys at full gain peak at %.3f\n", std::max(peak(chord.left), peak(chord.right)));
  EXPECT(std::max(peak(chord.left), peak(chord.right)) < 0.5, "ten keys stay under the knee");
  EXPECT(std::fabs(mean(hard.left)) < 1e-4 && correlation(hard.left, hard.right) < 0.97, "no offset, and the wires travel");
}

void test_clicks() {
  // Second differences against the same chord with nothing done to it.
  const auto chord = [](std::vector<Event> more, const Settings& settings = {}) {
    std::vector<Event> e = {{0, 'n', 1, 146.8f, 0.7f}, {0, 'n', 2, 220.0f, 0.7f}, {0, 'n', 3, 349.2f, 0.7f}};
    e.insert(e.end(), more.begin(), more.end());
    const Stereo s = play(e, at(4), 128, settings);
    return second_step(s.left, at(2) - 200, at(2) + 9000);
  };
  const Settings calm = {{p::kMelt, 3}, {p::kSpin, 14}};  // all rub: no pluck to hide behind
  const double quiet = chord({}, calm);
  const size_t t = at(2) / 128 * 128;
  const Settings changes = {{p::kTuning, 2}, {p::kPlucker, 2}, {p::kHub, 2}, {p::kHub, 0}, {p::kStrung, 1}, {p::kGauge, 1}, {p::kRing, 0.2f},
                            {p::kDamp, 1}, {p::kBeat, 5}, {p::kRim, 0}, {p::kWidth, 0}, {p::kVolume, -20}, {p::kLacing, 1}, {p::kSpin, 50},
                            {p::kPoint, 0.5f}, {p::kMelt, 9}, {p::kEdge, 1}, {p::kWobble, 1}, {p::kGear, 3}, {p::kGesture, 3}};
  for (const auto& [id, value] : changes) {
    const double jump = chord({{t, 'p', id, value, 0}}, calm);
    char label[96];
    std::snprintf(label, sizeof label, "knob %d moved while sounding does not click (%.5f against %.5f)", id, jump, quiet);
    Settings there = calm;  // a brighter tone steps more by itself
    there.push_back({id, value});
    EXPECT(jump < 2.0 * std::max(quiet, chord({}, there)), label);
  }
  // A steal: thirteen keys on twelve wheels, all of them dark.
  const Settings dark = plain({{p::kMelt, 3}, {p::kSpin, 40}, {p::kEdge, 0}, {p::kDamp, 1}, {p::kRing, 6}});
  std::vector<Event> many;
  for (int n = 0; n < 12; ++n) many.push_back({0, 'n', n, 130.8f * std::pow(2.0f, n / 12.0f), 0.6f});
  const double steady = second_step(play(many, at(3), 128, dark).left, at(1), at(2.2));
  many.push_back({t, 'n', 50, 196.1f, 0.01f});
  const double stolen = second_step(play(many, at(3), 128, dark).left, at(2) - 200, at(2.2));
  std::printf("steal: steps %.1f times the steady chord\n", stolen / steady);
  EXPECT(stolen < 1.7 * steady, "a stolen wheel fades");
}

// Knobs against a plain rub, with no pluck to hide behind; what the key let go
// does; levels over every plucker and hub; what Air hears of Ring and Point.
void test_seams_between_settings() {
  const Settings rub = {{p::kTuning, 0}, {p::kSpin, 38}, {p::kMelt, 4}, {p::kRing, 7}, {p::kWobble, 0}, {p::kBeat, 0}};
  const auto held = [&](const std::vector<Event>& more, Settings with) {
    std::vector<Event> e = {{0, 'n', 1, 146.8f, 0.7f}, {0, 'n', 2, 220, 0.7f}};
    e.insert(e.end(), more.begin(), more.end());
    with.insert(with.begin(), rub.begin(), rub.end());
    return play(e, at(5), 128, with).left;
  };
  for (const auto& c : std::vector<std::array<float, 3>>{{p::kHub, 1, 0}, {p::kHub, 1, 2}, {p::kHub, 2, 0}, {p::kHub, 0, 2},
                                                         {p::kRim, 1, 0}, {p::kRim, 0, 1}, {p::kPlucker, 0, 3}}) {
    const int id = static_cast<int>(c[0]);
    const auto x = held({{at(2.5) / 128 * 128, 'p', id, c[2], 0}}, {{id, c[1]}});
    const double jump = second_step(x, at(2.49), at(2.7));
    const double calm = std::max(second_step(x, at(1.5), at(2.4)), second_step(x, at(3.5), at(5)));
    std::printf("seams: knob %d from %.0f to %.0f steps %.1f times a steady tone\n", id, c[1], c[2], jump / calm);
    EXPECT(jump < 2.2 * calm, "a hub, rim or plucker slides in with no step");
    EXPECT(db(rms(x, at(2.5), at(2.56)) / std::max(rms(x, at(2.2), at(2.5)), rms(x, at(4), at(5)))) < 2.5, "and no burst");
  }
  // Release damps the wires of a key let go while its wheel still turns.
  const auto between = [](float release) { return seconds_db(mono(note(220, 0.8f, 2, 6, plain({{p::kSpin, 6}, {p::kRing, 6}, {p::kCoast, 8}, {p::kRelease, release}}))), 3, 5); };
  std::printf("release: %.1f dB between plucks of a coasting wheel, 0.1 s against 10\n", between(10) - between(0.1f));
  EXPECT(between(10) - between(0.1f) > 6.0, "a short release makes the last plucks dry");
  Range levels;
  for (float plucker : {0.0f, 1.0f, 2.0f, 3.0f}) {
    for (float hub : {0.0f, 1.0f, 2.0f}) {
      for (float hz : {130.8f, 1046.5f}) levels.add(seconds_db(note(hz, 0.7f, 3, 3, {{p::kPlucker, plucker}, {p::kHub, hub}}).left, 0.3, 3));
    }
  }
  std::printf("levels: every plucker on every hub, C3 and C6, within %.1f dB\n", levels.size());
  EXPECT(levels.size() < 20.0, "no plucker is lost on a hub");
  const auto air = [](int id, float value) {
    const Stereo s = note(220, 0.7f, 4, 4, {{p::kTuning, 0}, {p::kPlucker, 3}, {p::kMelt, 4}, {p::kHub, 0}, {p::kBeat, 0}, {id, value}});
    double same = 0, whole = 0;  // how like itself it is ten periods on
    for (size_t i = at(1); i < at(3); ++i) {
      same += s.left[i] * s.left[i + 2182];
      whole += s.left[i] * s.left[i];
    }
    return std::array<double, 2>{db(tone_level(s.left, 440, kRate, at(1), at(4)) / tone_level(s.left, 220, kRate, at(1), at(4))), same / whole};
  };
  EXPECT(air(p::kPoint, 0.17f)[0] - air(p::kPoint, 0.5f)[0] > 6.0, "air blows at Point too");
  EXPECT(air(p::kRing, 20)[1] > 0.3 + air(p::kRing, 0.15f)[1], "and Ring is heard under it");
  std::printf("air: like itself %.2f at Ring 20 and %.2f at 0.15\n", air(p::kRing, 20)[1], air(p::kRing, 0.15f)[1]);
  const auto puffs = mono(note(220, 0.7f, 8, 8, {{p::kPlucker, 3}, {p::kMelt, 40}, {p::kSpin, 14}, {p::kGear, 1}}));
  EXPECT(seconds_db(puffs, 6, 8) - seconds_db(puffs, 1, 2) < 3.0, "puffs do not pile up");
  const Stereo low = note(30, 0.8f, 3, 3, {{p::kTuning, 3}, {p::kRim, 0}});
  EXPECT(tone_level(low.left, 22.5, kRate, at(0.5), at(3)) < 0.2 * tone_level(low.left, 30, kRate, at(0.5), at(3)), "no wire is strung below hearing");
}

void test_bookkeeping() {
  // One id at A, B and A again, then one off: everything falls silent.
  const Settings quick = {{p::kCoast, 0.3f}, {p::kRelease, 0.3f}};
  Stereo s = play({{0, 'n', 1, 220, 0.7f}, {4800, 'n', 1, 330, 0.7f}, {9600, 'n', 1, 220, 0.7f}, {19200, 'f', 1, 0, 0}}, at(8), 128, quick);
  EXPECT(peak(s.left, at(7)) == 0.0, "one id at A, B and A leaves nothing sounding");
  s = play({{0, 'n', 1, 220, 0.7f}, {9600, 'n', 1, 330, 0.7f}}, at(5), 128, {{p::kCoast, 0.3f}, {p::kRelease, 0.3f}, {p::kTuning, 0}});
  EXPECT(tone_level(s.left, 220, kRate, at(3), at(5)) < 0.02 * tone_level(s.left, 330, kRate, at(3), at(5)), "a second pitch under one id lets the first go");
  // The same inside a steal's fade.
  std::vector<Event> e;
  for (int n = 0; n < 12; ++n) e.push_back({0, 'n', 10 + n, 110.0f * std::pow(2.0f, n / 12.0f), 0.6f});
  e.insert(e.end(), {{9600, 'n', 1, 523, 0.7f}, {9632, 'n', 1, 587, 0.7f}, {9664, 'n', 1, 523, 0.7f}, {14400, 'f', 1, 0, 0}});
  for (int n = 0; n < 12; ++n) e.push_back({19200, 'f', 10 + n, 0, 0});
  s = play(e, at(8), 32, quick);
  EXPECT(peak(s.left, at(7)) == 0.0, "and inside a steal's fade");
  // Absurd notes and knobs while a chord sounds.
  const float nan = std::nanf(""), inf = std::numeric_limits<float>::infinity();
  e = {{0, 'n', 1, 220, 0.7f}, {128, 'n', 2, nan, 1}, {256, 'n', 3, inf, inf}, {384, 'n', 4, -5, nan}, {512, 'n', 5, 5, 2}, {640, 'n', 6, 20000, 0}};
  for (int k = 0; k < p::kNumParams; ++k) {
    for (float v : {p::kParamMin[k], p::kParamMax[k], nan, inf, p::kParamDefault[k]}) e.push_back({1280 + 640 * e.size(), 'p', k, v, 0});
  }
  s = play(e, 1280 + 640 * (e.size() + 40), 128);
  EXPECT(finite(s.left) && finite(s.right) && peak(s.left) < 1.0 && peak(s.right) < 1.0, "every knob over its whole range while sounding, and absurd notes");
  // Block sizes across a silence, knobs moved in it.
  const std::vector<Event> phrase = {{0, 'n', 1, 220, 0.7f},      {at(1), 'f', 1, 0, 0},        {at(9), 'p', p::kWidth, 0.2f, 0},
                                     {at(9), 'p', p::kHub, 2, 0}, {at(10), 'n', 2, 277, 0.8f}, {at(10) + 8192, 'n', 3, 110, 0.5f}};
  const Stereo a = play(phrase, at(12), 128, quick), b = play(phrase, at(12), 1, quick), c = play(phrase, at(12), 2048, quick);
  EXPECT(peak(a.left, at(9), at(10)) == 0.0, "it sleeps between");
  EXPECT(a.left == b.left && a.right == b.right && a.left == c.left && a.right == c.right, "block sizes 1, 128 and 2048 give the same audio across a silence");
  // The same sound at other sample rates.
  const auto level = [](float rate) {
    const Stereo x = note(262, 0.7f, 4, 4, plain({{p::kRing, 3}, {p::kSpin, 5}}), rate);
    return db(rms(x.left, static_cast<size_t>(rate), static_cast<size_t>(3.5f * rate)));
  };
  std::printf("rates: level %.2f, %.2f and %.2f dB at 44.1, 48 and 96 kHz\n", level(44100), level(48000), level(96000));
  EXPECT(std::fabs(level(44100) - level(96000)) < 1.2, "the level does not follow the sample rate");
}

}  // namespace

int main() {
  Conformance spec;
  spec.name = "spun-wire";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 15.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);
  for (const auto& run : {test_tuning, test_passes, test_coast, test_seam, test_six_wires, test_gestures, test_gear, test_wires,
                          test_touch_and_level, test_clicks, test_seams_between_settings, test_bookkeeping}) {
    run();
  }
  const auto cost = [](bool down) {
    note(220, 0.7f, 1, 12, {{p::kCoast, 0.3f}, {p::kRelease, 0.2f}});
    if (down) device.note_on(1, 220, 0.7f);
    const auto began = std::clock();
    render(device, 20.0f, kRate);
    return static_cast<double>(std::clock() - began);
  };
  const double asleep = cost(false), awake = cost(true);
  std::printf("sleep: %.4f of what one key costs\n", asleep / awake);
  EXPECT(asleep < 0.2 * awake, "it sleeps when nothing sounds");
  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  render(device, 1.0f, kRate);
  report_cost("spun-wire (8 keys, defaults)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });
  return finish("spun-wire");
}
