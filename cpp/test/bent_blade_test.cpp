// Native harness for Bent Blade (cpp/devices/bent-blade). The conformance pass
// covers silence, stealing, parameter abuse and other sample rates; the rest
// measures what makes it a bent blade: the pitch of the trapped note, the
// places of the upper ones, what Bend traps, the tunnelling between two wells,
// the four touches, the slides and their laws, and the faults instruments have
// had before.

#include "../devices/bent-blade/bent_blade.h"

#include <initializer_list>

#include "support/test_kit.h"

using namespace testkit;
using livemix::BentBlade;
namespace p = livemix::bent_blade;
static BentBlade device;
static const float kRate = 48000.0f;
static char label[240];

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }
static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }
static double loudest(const Stereo& s) { return std::max(peak(s.left), peak(s.right)); }
static float note_hz(float midi) { return 440.0f * std::exp2((midi - 69.0f) / 12.0f); }
static std::vector<float> mono(const Stereo& s) {
  std::vector<float> out(s.left.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (s.left[i] + s.right[i]);
  return out;
}
static float num(int choice) { return static_cast<float>(choice); }
struct Setting { int id; float value; };
struct Range {
  double low = 1.0e9, high = -1.0e9;
  void take(double v) { low = std::min(low, v), high = std::max(high, v); }
};
static void set(std::initializer_list<Setting> settings) {
  for (const Setting& s : settings) device.set_param(s.id, s.value);
}
template <typename... Values>
static void check(bool good, const char* format, Values... values) {
  std::snprintf(label, sizeof label, format, values...);
  EXPECT(good, label);
}
static std::vector<float> play(float hz, float gain, float seconds) {
  device.note_on(1, hz, gain);
  return mono(render(device, seconds, kRate));
}
// A blade that is easy to read: one well, still hands, no slide.
static void plain(int exciter = BentBlade::kBow, float rate = kRate) {
  device.init(rate);
  set({{p::kExciter, num(exciter)}, {p::kSecondWell, 0.0f}, {p::kTremble, 0.0f}, {p::kWander, 0.0f},
       {p::kRasp, 0.0f}, {p::kSwell, 0.05f}, {p::kGlide, 0.01f}, {p::kVolume, 0.0f}});
}
// Level of the `hz` component (a Hann-windowed DFT bin by a rotating phasor).
static double bin_level(const std::vector<float>& x, double rate, double hz, size_t from, size_t n) {
  const double w = 2.0 * kPi * hz / rate, ww = 2.0 * kPi / static_cast<double>(n);
  const double cr = std::cos(w), ci = std::sin(w), wr = std::cos(ww), wi = std::sin(ww);
  double pr = 1.0, pi = 0.0, hr = 1.0, hi = 0.0, re = 0.0, im = 0.0;
  for (size_t i = 0; i < n && from + i < x.size(); ++i) {
    const double v = x[from + i] * (0.5 - 0.5 * hr);
    re += v * pr;
    im -= v * pi;
    double t = pr * cr - pi * ci;
    pi = pr * ci + pi * cr;
    pr = t;
    t = hr * wr - hi * wi;
    hi = hr * wi + hi * wr;
    hr = t;
  }
  return 4.0 * std::sqrt(re * re + im * im) / static_cast<double>(n);
}
// Where the strongest line near `hz` is, from the phase of two windows.
static double pitch_near(const std::vector<float>& x, double rate, double hz, size_t from, size_t n) {
  double best = hz, most = -1.0;
  const double step = 0.25 * rate / static_cast<double>(n);
  for (int k = -80; k <= 80; ++k) {
    const double level = bin_level(x, rate, hz + k * step, from, n);
    if (level > most) {
      most = level;
      best = hz + k * step;
    }
  }
  const double a = bin_level(x, rate, best - step, from, n), b = bin_level(x, rate, best + step, from, n);
  const double bend = std::log(a) - 2.0 * std::log(most) + std::log(b);
  return best + (bend < 0.0 ? 0.5 * step * (std::log(a) - std::log(b)) / bend : 0.0);
}
static double centroid(const std::vector<float>& x, size_t from, size_t to) {
  // From the energy of the slope: sqrt(E[x'^2] / E[x^2]) as a frequency.
  double slope = 0.0, power = 0.0;
  for (size_t i = from + 1; i < to; ++i) {
    const double d = x[i] - x[i - 1];
    slope += d * d;
    power += static_cast<double>(x[i]) * x[i];
  }
  return power > 0.0 ? std::sqrt(slope / power) * kRate / (2.0 * kPi) : 0.0;
}
// RMS of windows of `seconds`.
static std::vector<double> envelope(const std::vector<float>& x, double seconds) {
  std::vector<double> out;
  const size_t n = at(seconds);
  for (size_t i = 0; i + n <= x.size(); i += n) out.push_back(rms(x, i, i + n));
  return out;
}
// The largest second difference: what a click is made of.
static double corner(const std::vector<float>& x, size_t from, size_t to) {
  double worst = 0.0;
  for (size_t i = from + 2; i < to && i < x.size(); ++i)
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 2.0 * x[i - 1] + x[i - 2]));
  return worst;
}
static void test_pitch() {
  for (int exciter = 0; exciter < 4; ++exciter) {
    for (float midi : {36.0f, 50.0f, 60.0f, 72.0f, 84.0f}) {
      plain(exciter);
      device.set_param(p::kLeak, 0.1f);
      const std::vector<float> x = play(note_hz(midi), 0.7f, 2.5f);
      const double off = cents(pitch_near(x, kRate, note_hz(midi), at(0.5), at(2.0)), note_hz(midi));
      check(std::fabs(off) < (exciter == BentBlade::kBreath ? 5.0 : 2.0), "exciter %d at key %.0f is in tune (%.2f cents)", exciter, midi, off);
    }
  }
  for (float rate : {44100.0f, 96000.0f}) {
    plain(BentBlade::kMallet, rate);
    device.note_on(1, note_hz(79.0f), 0.7f);
    const std::vector<float> x = mono(render(device, 1.5f, rate));
    const double off = cents(pitch_near(x, rate, note_hz(79.0f), at(0.2, rate), at(1.2, rate)), note_hz(79.0f));
    check(std::fabs(off) < 2.0, "in tune at %.0f Hz (%.2f cents)", rate, off);
  }
  // With a twin the middle of the split stays on the note.
  plain();
  set({{p::kSecondWell, 1.0f}, {p::kTunnel, 6.0f}, {p::kFarWell, 0.0f}});
  const std::vector<float> x = play(220.0f, 0.7f, 6.0f);
  double sum = 0.0, power = 0.0;
  for (double hz = 214.0; hz < 226.0; hz += 0.25) {
    const double level = bin_level(x, kRate, hz, at(1.5), at(4.0));
    sum += hz * level * level, power += level * level;
  }
  const double middle = sum / power;
  check(std::fabs(cents(middle, 220.0)) < 6.0, "a fast twin keeps its middle on the note (%.2f cents)", cents(middle, 220.0));
}
static void test_well() {
  // The second trapped note stands where the well puts it.
  for (float width : {0.0f, 0.37f, 0.7f}) {
    plain(BentBlade::kMallet);
    set({{p::kWellWidth, width}, {p::kConcord, 0.0f}, {p::kEdge, 0.9f}, {p::kSteel, 0.0f}, {p::kLeak, 0.0f}});
    const std::vector<float> x = play(220.0f, 0.9f, 2.5f);
    const double floor = -0.8 + 0.1 * std::exp(4.6 * width);
    const double ratio = std::sqrt((3.7997 + floor) / (1.0604 + floor));
    const double there = bin_level(x, kRate, 220.0 * ratio, at(0.4), at(2.0));
    const double beside = bin_level(x, kRate, 220.0 * ratio * 1.03, at(0.4), at(2.0));
    check(there > 1.0e-3 && there > 10.0 * beside, "width %.2f: a note at %.3f (%.1f dB, beside it %.1f)", width, ratio, db(there), db(beside));
  }
  // Concord moves it to the octave.
  plain(BentBlade::kMallet);
  set({{p::kWellWidth, 0.33f}, {p::kConcord, 1.0f}, {p::kLeak, 0.0f}});
  const std::vector<float> x = play(220.0f, 0.9f, 2.5f);
  EXPECT(bin_level(x, kRate, 440.0, at(0.4), at(2.0)) > 10.0 * bin_level(x, kRate, 448.0, at(0.4), at(2.0)), "concord's octave");
  // A deep bend rings longer and holds more notes than a shallow one.
  double ring[2], bright[2];
  for (int deep = 0; deep < 2; ++deep) {
    plain(BentBlade::kMallet);
    set({{p::kBend, deep ? 1.0f : 0.05f}, {p::kEdge, 0.8f}, {p::kSteel, 0.0f}});
    const std::vector<float> y = play(220.0f, 0.9f, 4.0f);
    ring[deep] = rt60(y, kRate, 0.5, 0.1, -80.0);
    bright[deep] = centroid(y, at(0.2), at(0.6));
  }
  check(ring[1] > 2.5 * ring[0] && bright[1] > 1.25 * bright[0], "bend: ring %.2f to %.2f s, %.0f to %.0f Hz", ring[0], ring[1], bright[0], bright[1]);
  // Leak and Damp.
  double tail[3];
  const float leaks[3] = {0.2f, 0.45f, 0.7f};
  for (int i = 0; i < 3; ++i) {
    plain(BentBlade::kMallet);
    device.set_param(p::kLeak, leaks[i]);
    tail[i] = rt60(play(220.0f, 0.8f, 3.0f), kRate, 0.3, 0.05, -90.0);
  }
  check(tail[0] > 2.5 * tail[1] && tail[1] > 2.5 * tail[2], "leak: %.2f, %.2f, %.2f s", tail[0], tail[1], tail[2]);
  double after[2];
  for (int i = 0; i < 2; ++i) {
    plain();
    device.set_param(p::kDamp, i ? 1.0f : 0.0f);
    play(220.0f, 0.8f, 1.0f);
    device.note_off(1);
    after[i] = db(rms(render(device, 0.6f, kRate).left, at(0.3), at(0.4)));
  }
  check(after[0] > -50.0 && after[1] < after[0] - 40.0, "damp: 0.3 s after the key %.1f and %.1f dB", after[0], after[1]);
}
static void test_tunnel() {
  // One ear on the first well alone: the note goes away and comes back, as
  // often as Tunnel says.
  for (float hz : {0.5f, 2.0f}) {
    plain();
    set({{p::kSecondWell, 1.0f}, {p::kFarWell, 0.0f}, {p::kEdge, 0.1f}, {p::kPressure, 0.0f}, {p::kTunnel, hz}});
    device.note_on(1, 220.0f, 0.8f);
    const std::vector<double> e = envelope(mono(render(device, 8.0f, kRate)), 0.02);
    const double half = 0.5 * *std::max_element(e.begin() + 50, e.end());
    int dips = 0;
    for (size_t i = 51; i < e.size(); ++i) dips += e[i] < half && e[i - 1] >= half ? 1 : 0;
    Range level;
    for (size_t i = 60; i < e.size(); ++i) level.take(e[i]);
    check(std::fabs(dips - 7.0 * hz) <= 0.16 * 7.0 * hz + 1.0 && level.high > 2.5 * level.low, "tunnel %.1f Hz: %d dips in 7 s, %.1f dB deep", hz, dips, db(level.high / level.low));
  }
  // A well a fifth or an octave up gets the sound and gives it back.
  for (int well = 2; well <= 3; ++well) {
    plain();
    set({{p::kSecondWell, num(well)}, {p::kFarWell, 1.0f}, {p::kTunnel, 0.5f}, {p::kWellWidth, 0.0f},
         {p::kPressure, 0.0f}});
    const std::vector<float> x = play(220.0f, 0.8f, 8.0f);
    const double up = well == 2 ? 330.0 : 110.0;
    Range share;
    for (double t = 1.0; t < 7.0; t += 0.1)
      share.take(bin_level(x, kRate, up, at(t), at(0.2)) / (bin_level(x, kRate, 220.0, at(t), at(0.2)) + 1e-6));
    check(share.high > 4.0 * share.low && share.high > 1.2, "well %d: the other note is %.2f to %.2f of the first", well,
          share.low, share.high);
  }
}
static void test_touch() {
  // What is heard 0.3 s and 2.5 s into a held key: drawn ones hold, struck ones die.
  double early[4], late[4], rough[4];
  for (int exciter = 0; exciter < 4; ++exciter) {
    plain(exciter);
    set({{p::kRasp, 0.5f}, {p::kLeak, 0.5f}});
    const std::vector<float> x = play(220.0f, 0.8f, 3.0f);
    early[exciter] = db(rms(x, at(0.3), at(0.6)));
    late[exciter] = db(rms(x, at(2.3), at(2.9)));
    const std::vector<double> e = envelope(std::vector<float>(x.begin() + at(0.8), x.end()), 0.05);
    double moved = 0.0;
    for (size_t i = 1; i < e.size(); ++i) moved += std::fabs(db(e[i]) - db(e[i - 1]));
    rough[exciter] = moved / static_cast<double>(e.size());
  }
  check(std::fabs(early[0] - late[0]) < 3.0 && std::fabs(early[3] - late[3]) < 9.0, "bow and breath hold (%.1f to %.1f, %.1f to %.1f dB)", early[0], late[0], early[3], late[3]);
  check(early[1] - late[1] > 12.0 && early[2] - late[2] > early[1] - late[1] + 10.0, "mallet and thumb die (%.1f to %.1f, %.1f to %.1f dB)", early[1], late[1], early[2], late[2]);
  check(rough[3] > 1.4 * rough[0], "a breath is unsteadier than a bow (%.2f against %.2f dB)", rough[3], rough[0]);
  // Soft and hard: level and colour.
  for (int exciter = 0; exciter < 4; ++exciter) {
    double level[2], colour[2];
    for (int hard = 0; hard < 2; ++hard) {
      plain(exciter);
      const std::vector<float> x = play(220.0f, hard ? 1.0f : 0.3f, 1.0f);
      level[hard] = db(rms(x, at(0.05), at(0.9)));
      colour[hard] = centroid(x, at(0.05), at(0.9));
    }
    check(level[1] - level[0] > 6.0 && colour[1] > 1.06 * colour[0], "exciter %d: hard is louder by %.1f dB and brighter, %.0f to %.0f Hz", exciter, level[1] - level[0], colour[0], colour[1]);
  }
  // Pressure and Edge each brighten a bow.
  for (int id : {int(p::kPressure), int(p::kEdge)}) {
    double colour[2];
    for (int up = 0; up < 2; ++up) {
      plain();
      device.set_param(id, up ? 0.9f : 0.1f);
      colour[up] = centroid(play(220.0f, 0.8f, 1.5f), at(0.5), at(1.4));
    }
    check(colour[1] > 1.3 * colour[0], "param %d brightens: %.0f to %.0f Hz", id, colour[0], colour[1]);
  }
  // Level over the keyboard, one note at gain 0.7, at the default patch.
  Range tops;
  for (float midi : {36.0f, 48.0f, 60.0f, 72.0f, 84.0f}) {
    device.init(kRate);
    device.note_on(1, note_hz(midi), 0.7f);
    tops.take(db(loudest(render(device, 3.0f, kRate))));
  }
  check(tops.low > -24.0 && tops.high < -10.0, "one note peaks between %.1f and %.1f dB", tops.low, tops.high);
  // Ten keys at full gain, and twelve on one pitch, under the clip's knee.
  for (int same = 0; same < 2; ++same) {
    for (int exciter = 0; exciter < 4; ++exciter) {
      device.init(kRate);
      device.set_param(p::kExciter, num(exciter));
      const float keys[10] = {38, 45, 50, 53, 57, 60, 64, 67, 72, 76};
      for (int i = 0; i < (same ? 12 : 10); ++i) device.note_on(i, note_hz(same ? 57.0f : keys[i]), 1.0f);
      const double top = loudest(render(device, 4.0f, kRate));
      check(top < 0.5, "exciter %d: %s peak %.3f", exciter, same ? "twelve keys on one pitch" : "ten keys", top);
    }
  }
  // Tremble moves the pitch by a few cents to some tens, and no knob up leaves it still.
  for (int up = 0; up < 2; ++up) {
    plain();
    set({{p::kTremble, up ? 1.0f : 0.0f}, {p::kRate, 1.0f}, {p::kPressure, 0.0f}});
    const std::vector<float> x = play(440.0f, 0.8f, 4.0f);
    Range hz;
    for (double t = 2.0; t < 3.8; t += 0.1) hz.take(pitch_near(x, kRate, 440.0, at(t), at(0.12)));
    const double moved = cents(hz.high, hz.low);
    check(up ? moved > 25.0 && moved < 90.0 : moved < 1.0, "tremble %d moves the pitch over %.1f cents", up, moved);
  }
}
static double pitch_at(const std::vector<float>& x, double seconds) {
  const auto from = x.begin() + at(seconds);
  return dominant_frequency(std::vector<float>(from, from + at(0.08)), kRate, 150.0, 900.0);
}
static void test_slides() {
  for (int law = 0; law < 3; ++law) {
    plain();
    set({{p::kPressure, 0.0f}, {p::kSwell, 0.003f}, {p::kGlide, 0.4f}, {p::kGlideLaw, num(law)},
         {p::kDamp, 1.0f}});
    // A chord of two, then one more key: 220 and 330, then 550 after 330.
    device.note_on(1, 220.0f, 0.5f);
    device.note_on(2, 330.0f, 0.5f);
    render(device, 2.0f, kRate);
    device.note_on(3, 247.0f, 0.01f);  // the note before, hardly heard
    render(device, 1.5f, kRate);
    for (int id : {1, 2, 3}) device.note_off(id);
    device.note_on(4, 370.0f, 0.9f);
    const std::vector<float> x = mono(render(device, 2.0f, kRate));
    const double begin = pitch_at(x, 0.06), end = pitch_at(x, 1.6);
    check(std::fabs(cents(end, 370.0)) < 12.0, "law %d: a slide from %.0f ends at %.1f", law, begin, end);
    EXPECT(law == BentBlade::kNearest ? begin > 333.0 && begin < 356.0 : begin > 243.0 && begin < 282.0, label);
  }
  // A chord from one: every key waits on the first, then opens.
  plain();
  set({{p::kPressure, 0.0f}, {p::kSwell, 0.003f}, {p::kGlide, 0.7f}, {p::kGlideLaw, 2.0f}});
  device.note_on(2, 220.0f, 0.4f);
  device.note_on(3, 370.0f, 0.9f);
  const std::vector<float> x = play(580.0f, 0.9f, 4.0f);
  const double together = bin_level(x, kRate, 220.0, at(0.15), at(0.25)), not_yet = bin_level(x, kRate, 370.0, at(0.15), at(0.25));
  const double open = bin_level(x, kRate, 370.0, at(3.0), at(0.5)), open_too = bin_level(x, kRate, 580.0, at(3.0), at(0.5));
  check(together > 10.0 * not_yet && open > 0.01 && open_too > 0.01, "from one: %.1f dB against %.1f, then %.1f and %.1f", db(together), db(not_yet), db(open), db(open_too));
}
static Stereo chord(float gain, float seconds, float rate = kRate, int keys = 5) {
  const float midi[10] = {50, 57, 65, 72, 76, 38, 45, 53, 60, 67};
  for (int i = 0; i < keys; ++i) device.note_on(i, note_hz(midi[i]), gain);
  return render(device, seconds, rate);
}
static void test_voicing() {
  // The default chord: in the middle, in tune, not piercing.
  device.init(kRate);
  const Stereo out = chord(0.8f, 4.0f);
  const double lean = db(rms(out.left)) - db(rms(out.right));
  check(std::fabs(lean) < 4.0, "the default chord leans %.1f dB", lean);
  for (float midi : {48.0f, 60.0f}) {
    device.init(kRate);
    device.set_param(p::kExciter, 1.0f);
    const double off = cents(pitch_near(play(note_hz(midi), 0.7f, 5.0f), kRate, 2.0 * note_hz(midi), at(1.5), at(3.0)), 2.0 * note_hz(midi));
    check(std::fabs(off) < 6.0, "key %.0f: the octave above is %.1f cents off", midi, off);
  }
  device.init(kRate);
  const double colour = centroid(play(note_hz(84.0f), 0.7f, 3.0f), at(0.5), at(2.5));
  check(colour < 1.75 * note_hz(84.0f), "C6 has its middle at %.0f Hz", colour);
  // Each touch speaks at the default patch; steel and air neither blast nor hiss.
  for (int exciter = 0; exciter < 4; ++exciter) {
    device.init(kRate);
    device.set_param(p::kExciter, num(exciter));
    const double top = db(peak(play(220.0f, 0.7f, 3.0f)));
    check(top > -24.0 && top < -9.0, "exciter %d: one note peaks at %.1f dB", exciter, top);
    const double steel[2] = {0.0, 1.0};
    double level[2];
    for (int i = 0; i < 2; ++i) {
      device.init(kRate);
      set({{p::kExciter, num(exciter)}, {p::kSteel, num(int(steel[i]))}, {p::kConcord, 1.0f}, {p::kPressure, 0.7f}});
      level[i] = db(rms(chord(0.8f, 4.0f).left));
    }
    check(std::fabs(level[1] - level[0]) < 7.0, "exciter %d: all of Steel moves the level from %.1f to %.1f dB", exciter, level[0], level[1]);
  }
  device.init(kRate);
  set({{p::kExciter, 3.0f}, {p::kEdge, 0.8f}, {p::kRasp, 0.8f}});
  const std::vector<float> air = mono(chord(0.8f, 4.0f));
  const double hiss = 10.0 * std::log10(energy_above(air, 6000.0, kRate) + 1e-12);
  check(hiss < -14.0, "a bright breath has %.1f dB over 6 kHz", hiss);
  // Loud patches stay under the knee with ten keys at full gain.
  const Setting loud[6][3] = {{{p::kExciter, 2.0f}, {p::kLeak, 0.0f}, {p::kSwell, 0.02f}}, {{p::kExciter, 1.0f}, {p::kSteel, 1.0f}, {p::kPressure, 1.0f}},
                              {{p::kExciter, 3.0f}, {p::kRasp, 1.0f}, {p::kSwell, 0.02f}}, {{p::kEdge, 1.0f}, {p::kPressure, 1.0f}, {p::kVolume, 0.0f}},
                              {{p::kSecondWell, 3.0f}, {p::kSteel, 1.0f}, {p::kWander, 1.0f}}, {{p::kExciter, 1.0f}, {p::kSecondWell, 2.0f}, {p::kVolume, 0.0f}}};
  for (int i = 0; i < 6; ++i) {
    device.init(kRate);
    for (const Setting& s : loud[i]) device.set_param(s.id, s.value);
    const double top = loudest(chord(1.0f, 4.0f, kRate, 10));
    check(top < 0.54, "loud patch %d: ten keys peak %.3f", i, top);
  }
  // Steel and grain are as loud at every sample rate.
  double level[2];
  for (int i = 0; i < 2; ++i) {
    const float rate = i ? 96000.0f : 44100.0f;
    device.init(rate);
    set({{p::kSecondWell, 0.0f}, {p::kSteel, 1.0f}, {p::kBend, 0.0f}, {p::kRasp, 0.0f},
         {p::kWander, 0.0f}, {p::kConcord, 0.0f}, {p::kPressure, 0.0f}, {p::kEdge, 0.4f}, {p::kLeak, 1.0f}});
    const std::vector<float> x = mono(chord(0.8f, 6.0f, rate, 3));
    level[i] = db(rms(x)) + 10.0 * std::log10(energy_above(x, 2500.0, rate));
  }
  check(std::fabs(level[1] - level[0]) < 2.4, "steel and grain: %.2f and %.2f dB at 44.1 and 96 kHz", level[0], level[1]);
  // A hand at the top of Damp stops the steel as well.
  plain(BentBlade::kMallet);
  set({{p::kSteel, 1.0f}, {p::kBend, 0.1f}, {p::kPressure, 1.0f}, {p::kDamp, 1.0f}});
  play(220.0f, 0.9f, 0.1f);
  device.note_off(1);
  const double after = db(rms(render(device, 0.4f, kRate).left, at(0.25), at(0.35)));
  check(after < -75.0, "steel %.1f dB 0.25 s after a damped key", after);
  // Straight: the keys of a chord leave one after another.
  plain();
  set({{p::kPressure, 0.0f}, {p::kSwell, 0.003f}, {p::kGlide, 0.5f}, {p::kGlideLaw, 0.0f}});
  device.note_on(2, 220.0f, 0.4f);
  device.note_on(3, 330.0f, 0.7f);
  const std::vector<float> x = play(550.0f, 0.7f, 3.0f);
  const double waits = bin_level(x, kRate, 330.0, at(0.15), at(0.25)), gone = bin_level(x, kRate, 550.0, at(0.15), at(0.25)), came = bin_level(x, kRate, 550.0, at(2.2), at(0.5));
  check(waits > 5.0 * gone && came > 5.0 * gone, "the third key waits (%.1f against %.1f dB) and comes (%.1f)", db(waits), db(gone), db(came));
}
// The largest corner of `x` in a window against the largest before it.
static void test_clicks() {
  const int ids[] = {p::kBend, p::kWellWidth, p::kConcord, p::kFarWell, p::kTunnel, p::kPressure, p::kLeak,
                     p::kSteel, p::kEdge, p::kTremble, p::kWander, p::kWidth, p::kVolume};
  for (int id : ids) {
    for (int well : {1, 2}) {
      device.init(kRate);
      set({{p::kSecondWell, num(well)}, {p::kRasp, 0.0f}});
      const float low = p::kParamMin[id], high = id == p::kVolume ? 0.0f : p::kParamMax[id];
      device.set_param(id, high);
      device.note_on(1, 220.0f, 0.8f);
      device.note_on(2, 330.0f, 0.8f);
      const std::vector<float> a = mono(render(device, 2.0f, kRate));
      device.set_param(id, low);
      const std::vector<float> b = mono(render(device, 1.2f, kRate));
      device.set_param(id, high);
      const std::vector<float> c = mono(render(device, 1.5f, kRate));
      // The turns are heard across the seams, against stretches with no turn in them.
      std::vector<float> all = a;
      all.insert(all.end(), b.begin(), b.end());
      all.insert(all.end(), c.begin(), c.end());
      const double before = std::max({corner(all, at(1.0), at(1.99)), corner(all, at(2.5), at(3.19)), corner(all, at(4.0), at(4.7))});
      const double after = std::max(corner(all, at(1.99), at(2.3)), corner(all, at(3.19), at(3.5)));
      check(after < 2.0 * before + 0.0006, "param %d jumped makes no click (%.5f against %.5f)", id, after, before);
    }
  }
  // A choice turned while a note sounds is for the next note.
  for (int id : {int(p::kExciter), int(p::kSecondWell), int(p::kGlideLaw)}) {
    std::vector<float> out[2];
    for (int turned = 0; turned < 2; ++turned) {
      device.init(kRate);
      play(220.0f, 0.8f, 0.5f);
      if (turned) device.set_param(id, 2.0f);
      out[turned] = render(device, 0.5f, kRate).left;
    }
    EXPECT(out[0] == out[1], "a choice waits for the next note");
  }
  // Steals and restrikes of drawn notes: the whole pool taken, then taken again.
  for (int exciter : {0, 1}) {
    plain(exciter);
    set({{p::kSwell, 0.2f}, {p::kSteel, 0.0f}});
    for (int i = 0; i < 12; ++i) device.note_on(i, note_hz(48.0f + num(i)), 0.6f);
    const std::vector<float> a = mono(render(device, 1.5f, kRate));
    for (int i = 0; i < 12; ++i) device.note_on(20 + i, note_hz(47.5f + num(i)), 0.6f);
    const std::vector<float> b = mono(render(device, 1.0f, kRate));
    const double before = exciter ? corner(a, 0, at(1.0)) : corner(a, at(0.6), at(1.5));
    check(corner(b, 0, at(0.2)) < 2.0 * before + 0.0006, "exciter %d: a stolen pool makes no click (%.5f against %.5f)", exciter, corner(b, 0, at(0.2)), before);
  }
}
static void test_faults() {
  // One id at one pitch, at another, at the first again, then one note off.
  for (int block : {0, 3}) {
    plain();
    for (float hz : {220.0f, 330.0f, 220.0f}) {
      device.note_on(7, hz, 0.8f);
      if (block) render(device, 0.001f * num(block), kRate);
    }
    render(device, 0.5f, kRate);
    device.note_off(7);
    render(device, 12.0f, kRate);
    EXPECT(loudest(render(device, 0.3f, kRate)) == 0.0, "an id struck A, B, A and let go once is silent");
  }
  // A key struck again without being let go first is one note and not five.
  double once[2];
  for (int again = 0; again < 2; ++again) {
    plain();
    for (int i = 0; i < (again ? 5 : 1); ++i) {
      device.note_on(7, 220.0f, 0.8f);
      render(device, 0.2f, kRate);
    }
    once[again] = db(rms(render(device, 1.0f, kRate).left, at(0.6)));
  }
  check(std::fabs(once[1] - once[0]) < 1.5, "one key struck five times: %.1f against %.1f dB", once[1], once[0]);
  // A note in a stolen voice, let go before it begins.
  plain();
  for (int i = 0; i < 12; ++i) device.note_on(i, 220.0f + 9.0f * num(i), 0.8f);
  render(device, 0.2f, kRate);
  for (int i = 20; i < 40; ++i) device.note_on(i, 300.0f + num(i), 0.8f);
  for (int i = 0; i < 40; ++i) device.note_off(i);
  render(device, 14.0f, kRate);
  EXPECT(loudest(render(device, 0.3f, kRate)) == 0.0, "notes let go inside a steal are silent");
  // Every knob swept while notes sound.
  for (int exciter = 0; exciter < 4; ++exciter) {
    device.init(kRate);
    device.set_param(p::kExciter, num(exciter));
    double top = 0.0;
    bool whole = true;
    for (int id = 0; id < p::kNumParams; ++id) {
      if (id == p::kExciter) continue;
      device.note_on(id, note_hz(40.0f + 2.0f * num(id)), 0.8f);
      for (int step = 0; step <= 8; ++step) {
        device.set_param(id, p::kParamMin[id] + (p::kParamMax[id] - p::kParamMin[id]) * num(step) / 8.0f);
        const Stereo out = render(device, 0.03f, kRate);
        whole = whole && finite(out.left) && finite(out.right);
        top = std::max(top, loudest(out));
      }
      device.set_param(id, p::kParamDefault[id]);
    }
    check(whole && top <= 1.0 && top > 0.02, "exciter %d: every knob swept, peak %.3f", exciter, top);
  }
  // The same at every block size, over a silence, with knobs turned in the silence.
  Stereo first;
  for (int block : {128, 1, 7, 2048}) {
    device.init(kRate);
    device.note_on(1, 220.0f, 0.8f);
    Stereo out = render(device, 0.512f, kRate, block);
    device.note_off(1);
    device.set_param(p::kDamp, 1.0f);
    out = concat(out, render(device, 3.072f, kRate, block));
    set({{p::kEdge, 0.8f}, {p::kExciter, 1.0f}});
    for (int id : {2, 3}) device.note_on(id, 110.0f * num(id) + 110.0f, 0.8f);
    out = concat(out, render(device, 1.024f, kRate, block));
    if (block == 128) {
      first = out;
      EXPECT(peak(out.left, at(3.3), at(3.584)) == 0.0, "asleep to exact zero between the notes");
    } else {
      check(out.left == first.left && out.right == first.right, "block size %d gives the same samples", block);
    }
  }
  // Level and brightness do not depend on the sample rate.
  for (int exciter = 0; exciter < 4; ++exciter) {
    double level[3];
    const float rates[3] = {44100.0f, 48000.0f, 96000.0f};
    for (int i = 0; i < 3; ++i) {
      device.init(rates[i]);
      device.set_param(p::kExciter, num(exciter));
      device.note_on(1, 220.0f, 0.8f);
      level[i] = db(rms(mono(render(device, 4.0f, rates[i]))));
    }
    check(std::fabs(level[0] - level[1]) < 2.2 && std::fabs(level[2] - level[1]) < 2.2, "exciter %d: %.2f, %.2f, %.2f dB at 44.1, 48 and 96 kHz", exciter, level[0], level[1], level[2]);
  }
}
int main() {
  Conformance spec;
  spec.name = "bent-blade";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin, spec.maxs = p::kParamMax, spec.defaults = p::kParamDefault;
  spec.tail_seconds = 9.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec);
  for (auto test : {test_pitch, test_well, test_tunnel, test_touch, test_voicing, test_slides, test_clicks, test_faults}) test();
  device.init(kRate);
  for (int i = 0; i < 8; ++i) device.note_on(i, 110.0f * std::exp2(num(i) * 0.25f), 0.7f);
  render(device, 1.0f, kRate);
  report_cost("bent-blade, 8 notes", 8.0f, kRate, [] { render(device, 8.0f, kRate); });
  return finish("bent-blade");
}
