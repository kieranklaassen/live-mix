// Native harness for Wire Lantern (cpp/devices/wire-lantern). The conformance
// pass covers silence, stealing, parameter abuse and other sample rates; the
// rest measures what makes it wire on a solid: the tones each solid has and
// what True bends them to, the touched corner and the lossy ones, the four
// exciters, the ears that walk round it, the frame that rings along, and the
// faults instruments have had before.

#include "../devices/wire-lantern/wire_lantern.h"

#include <cstdio>
#include <ctime>
#include <limits>

#include "support/test_kit.h"

using namespace testkit;
using livemix::WireLantern;
namespace p = livemix::wire_lantern;
using WL = WireLantern;

static WireLantern device;
static const float kRate = 48000.0f;
static char label[240];

// An expectation that says what it measured.
#define CHECK(condition, ...)                        \
  do {                                               \
    std::snprintf(label, sizeof label, __VA_ARGS__); \
    EXPECT(condition, label);                        \
  } while (0)

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }
static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }
static double loudest(const Stereo& s) { return std::max(peak(s.left), peak(s.right)); }
static float note_hz(float midi) { return 440.0f * std::exp2((midi - 69.0f) / 12.0f); }

static std::vector<float> mono(const Stereo& s) {
  std::vector<float> m(s.left);
  for (size_t i = 0; i < m.size(); ++i) m[i] = 0.5f * (m[i] + s.right[i]);
  return m;
}

// Level of `hz` over a window, a rotating phasor in place of trig per sample.
static double line(const std::vector<float>& x, double rate, double hz, size_t from, size_t n) {
  const double w = 2.0 * kPi * hz / rate, ww = 2.0 * kPi / static_cast<double>(n);
  const double cr = std::cos(w), ci = std::sin(w), wr = std::cos(ww), wi = std::sin(ww);
  double pr = 1.0, pi = 0.0, hr = 1.0, hi = 0.0, re = 0.0, im = 0.0, sum = 0.0;
  for (size_t i = 0; i < n && from + i < x.size(); ++i) {
    const double h = 0.5 - 0.5 * hr; re += h * x[from + i] * pr; im += h * x[from + i] * pi; sum += h;
    const double t = pr * cr - pi * ci; pi = pr * ci + pi * cr; pr = t; const double u = hr * wr - hi * wi;
    hi = hr * wi + hi * wr; hr = u;
  }
  return 2.0 * std::sqrt(re * re + im * im) / sum;
}

// The strongest place within a little of `hz`.
static double find(const std::vector<float>& x, double hz, double span, size_t from, size_t n) {
  double best = hz, level = -1.0;
  for (int pass = 0; pass < 2; ++pass) {
    const double centre = best, reach = pass == 0 ? span : span * 0.06;
    for (int i = -20; i <= 20; ++i) {
      const double c = centre * std::exp2(reach * i / 20.0 / 1200.0);
      const double l = line(x, kRate, c, from, n);
      if (l > level) level = l, best = c;
    }
  }
  return best;
}

// Easy to read: no contact noise, no halo, no touch, ears together and still.
static void plain(WireLantern& d, int solid = WL::kOctahedron, int exciter = WL::kFinger, float rate = kRate) {
  d.init(rate); d.set_param(p::kSolid, static_cast<float>(solid)); d.set_param(p::kExciter, static_cast<float>(exciter));
  d.set_param(p::kContact, 0.0f); d.set_param(p::kSympathy, 0.0f); d.set_param(p::kTouch, 0.0f);
  d.set_param(p::kCornerLoss, 0.0f); d.set_param(p::kShell, 0.0f); d.set_param(p::kTurn, 0.01f); d.set_param(p::kWidth, 0.0f);
  d.set_param(p::kTrue, 1.0f);
}

// The default sound with one exciter.
static void fresh(int exciter) { device.init(kRate); device.set_param(p::kExciter, static_cast<float>(exciter)); }

static Stereo note(WireLantern& d, float hz, float seconds, float gain = 0.7f, float rate = kRate) {
  d.note_on(1, hz, gain);
  return render(d, seconds, rate);
}

static void conformance() {
  Conformance spec; spec.name = "wire-lantern"; spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin; spec.maxs = p::kParamMax; spec.defaults = p::kParamDefault; spec.tail_seconds = 34.0f; spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);
}

// The octahedron's tones are an open chord by themselves, and the second tone
// of every solid is its own: where the walk matrix puts it at True 0, and on
// an open interval at True 1.
static void tones() {
  plain(device); device.set_param(p::kHardness, 0.8f); std::vector<float> m = mono(note(device, 220.0f, 3.0f));
  for (double ratio : {1.0, 4.0 / 3.0, 2.0, 8.0 / 3.0, 3.0}) {
    const double f = find(m, 220.0 * ratio, 40.0, at(0.3), at(2.0));
    CHECK(std::fabs(cents(f, 220.0 * ratio)) < 3.0, "octahedron tone %.3f is in tune (%.2f cents)", ratio, cents(f, 220.0 * ratio));
    const double there = line(m, kRate, f, at(0.3), at(2.0)), root = line(m, kRate, 220.0, at(0.3), at(2.0));
    CHECK(there > 0.01 * root, "octahedron tone %.3f is heard (%.1f dB of the root)", ratio, db(there / root));
  }
  struct Second { int solid; double natural, just; };
  const Second second[5] = {{WL::kRing, 2.0, 2.0}, {WL::kTetrahedron, 1.6443, 5.0 / 3.0}, {WL::kCube, 1.5522, 1.5},
                            {WL::kPrism, 1.2761, 4.0 / 3.0}, {WL::kWeb, 1.5, 1.5}};
  for (const Second& s : second) {
    for (int bent = 0; bent < 2; ++bent) {
      plain(device, s.solid, WL::kBow); device.set_param(p::kTrue, static_cast<float>(bent)); m = mono(note(device, 220.0f, 5.0f));
      const double want = 220.0 * (bent ? s.just : s.natural); const double f = find(m, want, 30.0, at(1.0), at(3.9));
      CHECK(std::fabs(cents(f, want)) < (bent ? 3.0 : 28.0),
            "solid %d: second tone at True %d is %.2f cents from %.1f Hz", s.solid, bent, cents(f, want), want);  // at 0 a hand-built net is uneven
      const double root = find(m, 220.0, 12.0, at(1.0), at(3.9));
      CHECK(std::fabs(cents(root, 220.0)) < (bent ? 1.0 : 8.0), "solid %d: root at True %d is %.2f cents off", s.solid, bent, cents(root, 220.0));
    }
  }
  for (int exciter = 0; exciter < 4; ++exciter) {
    for (float key : {36.0f, 60.0f, 84.0f}) {
      fresh(exciter);
      // A breath wanders round its pitch: it is measured for longer.
      const float seconds = exciter == WL::kBreath ? 12.0f : 4.0f; m = mono(note(device, note_hz(key), seconds));
      const double f = find(m, note_hz(key), 25.0, at(0.5), at(seconds - 0.6));
      CHECK(std::fabs(cents(f, note_hz(key))) < 3.0, "default, exciter %d, key %.0f: %.2f cents", exciter, key, cents(f, note_hz(key)));
    }
  }
}

// How fast one tone dies, dB a second.
static double fall(const std::vector<float>& m, double hz) {
  const double early = line(m, kRate, hz, at(0.1), at(0.5)), late = line(m, kRate, hz, at(1.1), at(0.5));
  return db(early) - db(late);
}

static void corners() {
  // Lossy corners: what stands on them goes, what runs round the loops stays.
  double fourth[2], octave[2];
  for (int lossy = 0; lossy < 2; ++lossy) {
    plain(device); device.set_param(p::kWire, 1.0f); device.set_param(p::kHardness, 0.7f); device.set_param(p::kCornerLoss, lossy ? 0.6f : 0.0f);
    const std::vector<float> m = mono(note(device, 220.0f, 2.0f)); fourth[lossy] = fall(m, 220.0 * 4.0 / 3.0); octave[lossy] = fall(m, 440.0);
  }
  CHECK(fourth[1] > fourth[0] + 20.0 && octave[1] < octave[0] + 10.0,
        "Corner Loss: the fourth falls %.1f to %.1f dB/s, the loops %.1f to %.1f", fourth[0], fourth[1], octave[0], octave[1]);
  // The touched corner: takes its share, leaves the rest, mutes when pressed.
  double level[3];
  for (int i = 0; i < 3; ++i) {
    plain(device); device.set_param(p::kTouch, i == 1 ? 0.45f : 0.5f * i); level[i] = db(rms(note(device, 220.0f, 2.0f).left, at(1.2), at(2.0)));
  }
  CHECK(level[0] > level[1] + 2.0 && level[1] > level[0] - 30.0 && level[2] < level[1] - 25.0,
        "Touched Corner: %.1f, %.1f, %.1f dB after a second", level[0], level[1], level[2]);
  // Under a bow a knob of it jumps down and up and never swells past where it was; and what
  // rings under it costs no more than what rings free: no line is left to go denormal.
  plain(device, WL::kOctahedron, WL::kBow); device.note_on(1, 220.0f, 0.8f); render(device, 3.0f, kRate);
  double before = loudest(render(device, 1.0f, kRate)), bump = 0.0, spent[2];
  for (int i = 0; i < 6; ++i) device.set_param(p::kTouch, i & 1 ? 0.0f : 1.0f), bump = std::max(bump, loudest(render(device, 0.4f, kRate)));
  CHECK(bump < 1.35 * before, "Touched Corner jumped under a bow: %.1f dB above", db(bump / before));
  for (int i = 0; i < 2; ++i) {
    device.init(kRate); device.set_param(p::kTouch, i ? 0.45f : 0.0f); device.set_param(p::kEdge, 3.0f); device.set_param(p::kHardness, 0.75f);
    device.set_param(p::kWire, 0.85f); device.set_param(p::kDecay, 16.0f); device.set_param(p::kPluck, 0.15f);
    for (int n = 0; n < 8; ++n) device.note_on(n, note_hz(45.0f + 4.0f * n), 0.7f);
    render(device, 3.5f, kRate); const clock_t from = clock(); render(device, 8.0f, kRate); spent[i] = static_cast<double>(clock() - from);
  }
  CHECK(spent[1] < 4.0 * spent[0] + 2.0e4, "a muted chord costs %.2f of a free one", spent[1] / spent[0]);
  // It takes the shape that moves there: in the prism the note, and not the fourth.
  plain(device, WL::kPrism); device.set_param(p::kTouch, 0.3f); device.set_param(p::kDecay, 40.0f);
  const std::vector<float> prism = mono(note(device, 220.0f, 2.0f));
  CHECK(fall(prism, 220.0) > 3.0 * fall(prism, 293.33), "Touched Corner: %.1f dB/s at the note, %.1f at the fourth", fall(prism, 220.0), fall(prism, 293.33));
  // What it takes depends on the edge.
  double share[2];
  for (int i = 0; i < 2; ++i) {
    plain(device); device.set_param(p::kTouch, 0.5f); device.set_param(p::kEdge, i ? 2.0f : 1.0f);
    const std::vector<float> m = mono(note(device, 220.0f, 2.0f)); share[i] = line(m, kRate, 220.0, at(1.0), at(0.9));
  }
  CHECK(std::fabs(db(share[0]) - db(share[1])) > 3.0, "Edge: the root left is %.1f or %.1f dB", db(share[0]), db(share[1]));
  // The knots: no two of the six edges give the first tones of a ring at the same strengths.
  double tone[6][4], nearest = 99.0; for (int e = 0; e < 6; ++e) {
    plain(device, WL::kRing); device.set_param(p::kEdge, 1.0f + e); device.set_param(p::kHardness, 0.7f);
    const std::vector<float> m = mono(note(device, 220.0f, 1.0f));
    for (int k = 0; k < 4; ++k) tone[e][k] = db(line(m, kRate, 220.0 * (k + 2), at(0.1), at(0.8)));
    for (int o = 0; o < e; ++o) {
      double most = 0.0;
      for (int k = 0; k < 4; ++k) most = std::max(most, std::fabs(tone[e][k] - tone[o][k]));
      nearest = std::min(nearest, most);
    }
  }
  CHECK(nearest > 4.0, "Edge: the nearest two differ by %.1f dB in one tone", nearest);
  // True lets the octave lead the fourth.
  double lead[2]; for (int i = 0; i < 2; ++i) {
    plain(device); device.set_param(p::kTrue, static_cast<float>(i)); device.set_param(p::kDecay, 40.0f);
    const std::vector<float> m = mono(note(device, 220.0f, 1.0f));
    lead[i] = db(line(m, kRate, find(m, 440.0, 40.0, at(0.1), at(0.8)), at(0.1), at(0.8)) /
                 line(m, kRate, find(m, 293.3, 60.0, at(0.1), at(0.8)), at(0.1), at(0.8)));
  }
  CHECK(lead[1] > lead[0] + 4.0, "True: the octave stands %.1f and then %.1f dB over the fourth", lead[0], lead[1]);
}

static void times() {
  // Decay, Release and Swell do what they say.
  for (float seconds : {3.0f, 10.0f}) {
    plain(device); device.set_param(p::kDecay, seconds); const std::vector<float> m = mono(note(device, 220.0f, 2.2f));
    const double measured = 60.0 / fall(m, 220.0);
    CHECK(measured > 0.6 * seconds && measured < 1.3 * seconds, "Decay %.0f s: the root rings %.1f s", seconds, measured);
  }
  // The web rings with its Decay, and is not its own dust.
  double web[2]; for (int i = 0; i < 2; ++i) {
    device.init(kRate); device.set_param(p::kSolid, WL::kWeb); device.set_param(p::kContact, 0.5f); device.set_param(p::kDecay, i ? 30.0f : 2.0f);
    web[i] = db(rms(note(device, 220.0f, 3.0f).left, at(2.0), at(3.0)));
  }
  CHECK(web[1] > web[0] + 20.0, "a web of Decay 2 s and 30 s: %.1f, %.1f dB", web[0], web[1]);
  for (float seconds : {0.2f, 2.0f}) {
    plain(device, WL::kOctahedron, WL::kBow); device.set_param(p::kRelease, seconds); device.note_on(1, 220.0f, 0.7f);
    const double held = db(rms(render(device, 2.0f, kRate).left, at(1.5))); device.note_off(1); const Stereo tail = render(device, 2.0f, kRate);
    const double after = db(rms(tail.left, at(seconds * 0.5 - 0.03), at(seconds * 0.5 + 0.03)));
    CHECK(held - after > 20.0 && held - after < 45.0, "Release %.1f s: %.1f dB down half way", seconds, held - after);
  }
  for (int exciter = 0; exciter < 4; ++exciter) {
    plain(device, WL::kOctahedron, exciter); device.set_param(p::kSwell, 2.0f); const Stereo s = note(device, 220.0f, 3.0f);
    const double early = rms(s.left, at(0.2), at(0.4)), open = rms(s.left, at(1.9), at(2.4));
    CHECK(open > 5.0 * early, "Swell 2 s opens exciter %d (%.1f dB to %.1f)", exciter, db(early), db(open));
    plain(device, WL::kRing, exciter); device.set_param(p::kSwell, 4.5f); device.set_param(p::kTouch, 0.45f);
    const double there = db(loudest(note(device, 220.0f, 6.0f, 0.8f)));
    CHECK(there > -46.0, "a touched note that opens over 4.5 s is heard (exciter %d, %.1f dB)", exciter, there);
  }
}

static void exciters() {
  for (int exciter = 0; exciter < 4; ++exciter) {
    fresh(exciter); const std::vector<float> m = mono(note(device, 220.0f, 11.0f));
    const double early = db(rms(m, at(2.0), at(5.0))), late = db(rms(m, at(8.0), at(11.0)));
    CHECK(exciter >= WL::kBow ? std::fabs(early - late) < 4.0 : early - late > 8.0, "exciter %d: %.1f dB at 3 s, %.1f at 9 s", exciter, early, late);
  }
  // Velocity and Hardness are colour; velocity is level too.
  double bright[3], loud[2];
  for (int i = 0; i < 2; ++i) {
    plain(device); const Stereo s = note(device, 220.0f, 1.0f, i ? 1.0f : 0.3f); bright[i] = energy_above(s.left, 1200.0, kRate, 0, at(0.4));
    loud[i] = db(rms(s.left, 0, at(0.4)));
  }
  CHECK(bright[1] > 1.5 * bright[0] && loud[1] > loud[0] + 9.0,
        "velocity: %.4f to %.4f above 1.2 kHz, %.1f to %.1f dB", bright[0], bright[1], loud[0], loud[1]);  auto above = [](int id, float value) {
    plain(device); device.set_param(id, value);
    return energy_above(note(device, 220.0f, 1.0f).left, 1200.0, kRate, 0, at(0.4));
  };
  for (int i = 0; i < 3; ++i) bright[i] = above(p::kHardness, 0.5f * static_cast<float>(i));
  CHECK(bright[1] > 1.5 * bright[0] && bright[2] > 1.5 * bright[1], "Hardness: %.4f, %.4f, %.4f above 1.2 kHz", bright[0], bright[1], bright[2]);
  for (int i = 0; i < 2; ++i) bright[i] = above(p::kPluck, static_cast<float>(i));
  CHECK(bright[0] > 1.6 * bright[1], "Pluck Point: %.4f at the corner, %.4f in the middle", bright[0], bright[1]);
  // The contact is an onset and nothing after it.
  double onset[2], rest[2];
  for (int i = 0; i < 2; ++i) {
    plain(device, WL::kOctahedron, WL::kHammer); device.set_param(p::kContact, static_cast<float>(i)); const Stereo s = note(device, 220.0f, 1.0f);
    onset[i] = rms(s.left, 0, at(0.03)); rest[i] = rms(s.left, at(0.5), at(1.0));
  }
  CHECK(onset[1] > 1.2 * onset[0] && std::fabs(db(rest[0]) - db(rest[1]) - 3.52) < 0.3,
        "Contact is heard at the onset only and takes the tone back (%.2f of it, %.2f dB)", onset[1] / onset[0], db(rest[0]) - db(rest[1]));
}

static void space() {
  // Width 0 is mono; above it the fold keeps the level.
  for (int exciter : {WL::kFinger, WL::kBreath}) {
    fresh(exciter); device.set_param(p::kWidth, 0.0f); Stereo s = note(device, 220.0f, 2.0f);
    CHECK(correlation(s.left, s.right) > 0.9999, "Width 0 is mono (exciter %d, correlation %.6f)", exciter, correlation(s.left, s.right));
    fresh(exciter); device.set_param(p::kWidth, 1.0f); s = note(device, 220.0f, 4.0f);
    const double side = db(rms(mono(s))) - 0.5 * (db(rms(s.left)) + db(rms(s.right)));
    CHECK(correlation(s.left, s.right) < 0.93 && side > -3.0,
          "Width 1 is wide and folds (%.2f, %.1f dB, exciter %d)", correlation(s.left, s.right), side, exciter);
  }
  // Turn: one tone comes and goes, and after a whole turn it is where it was, less its decay.
  double moves[2], back[2];
  for (int i = 0; i < 2; ++i) {
    plain(device); device.set_param(p::kDecay, 40.0f); device.set_param(p::kWire, 1.0f); device.set_param(p::kTurn, i ? 0.5f : 0.01f);
    const std::vector<float> m = mono(note(device, 220.0f, 5.5f)); double l[32], low = 1.0e9, high = -1.0e9, least = 1.0e9, most = -1.0e9;
    for (int t = 0; t < 32; ++t) l[t] = db(line(m, kRate, 440.0, at(1.0 + 0.125 * t), at(0.12)));
    for (int t = 0; t < 16; ++t) {
      low = std::min(low, l[t]); high = std::max(high, l[t]); least = std::min(least, l[t + 16] - l[t]); most = std::max(most, l[t + 16] - l[t]);
    }
    moves[i] = high - low; back[i] = most - least;
  }
  CHECK(moves[1] > moves[0] + 3.0 && back[1] < 1.0, "Turn moves the octave by %.1f dB, standing %.1f, and comes round to %.2f", moves[1], moves[0], back[1]);
  // Sympathy: a halo that outlives a short note under its key, none without it, and Release stops it.
  double halo[3]; for (int i = 0; i < 3; ++i) {
    device.init(kRate); device.set_param(p::kTouch, 1.0f); device.set_param(p::kRelease, 0.1f); device.set_param(p::kSympathy, i ? 0.7f : 0.0f);
    note(device, 220.0f, 0.5f); if (i == 2) device.note_off(1); render(device, 0.5f, kRate); halo[i] = db(rms(render(device, 0.3f, kRate).left));
  }
  CHECK(halo[1] > -80.0 && halo[1] > halo[0] + 10.0 && halo[2] < halo[1] - 15.0, "Sympathy: %.1f dB without, %.1f with, %.1f let go", halo[0], halo[1], halo[2]);
  // Ear walks from the bright face to the dark; Shade darkens and gives the level back.
  double face[2], drawn[2], keeps[2]; for (int i = 0; i < 2; ++i) {
    plain(device); device.set_param(p::kHardness, 0.7f); device.set_param(p::kEar, static_cast<float>(i));
    face[i] = energy_above(note(device, 220.0f, 1.0f).left, 1200.0, kRate, 0, at(0.8));
    plain(device); device.set_param(p::kHardness, 0.7f); device.set_param(p::kShade, 0.8f * i); const Stereo s = note(device, 220.0f, 1.0f);
    drawn[i] = energy_above(s.left, 1200.0, kRate, 0, at(0.8)); keeps[i] = db(rms(s.left));
  }
  CHECK(std::fabs(db(face[0] / face[1])) > 3.0 && drawn[1] < 0.2 * drawn[0] && keeps[1] > keeps[0] - 7.0,
        "Ear: %.4f to %.4f above 1.2 kHz; Shade: %.4f to %.4f, %.1f to %.1f dB", face[0], face[1], drawn[0], drawn[1], keeps[0], keeps[1]);
}

static void levels() {
  for (int solid = 0; solid < WL::kNumSolids; ++solid) {
    for (int exciter = 0; exciter < 4; ++exciter) {
      for (int pile = 0; pile < 2; ++pile) {
        device.init(kRate); device.set_param(p::kSolid, static_cast<float>(solid)); device.set_param(p::kExciter, static_cast<float>(exciter));
        const int keys = pile ? WL::kMaxVoices : 10;
        for (int i = 0; i < keys; ++i) device.note_on(i, pile ? 220.0f : note_hz(48.0f + 3.5f * i), 0.7f);
        const double most = loudest(render(device, 3.0f, kRate));
        CHECK(most < (pile ? 0.75 : 0.5),
              "solid %d, exciter %d: %s peak at %.1f dBFS", solid, exciter, pile ? "twelve ids on one pitch" : "ten keys", db(most));
      }
    }
  }
  device.init(kRate);
  for (int i = 0; i < 10; ++i) device.note_on(i, note_hz(48.0f + 3.5f * i), 1.0f);
  CHECK(loudest(render(device, 3.0f, kRate)) < 0.5, "ten hard keys stay under the knee of the clip");
  for (float key : {36.0f, 48.0f, 60.0f, 72.0f, 84.0f}) {
    device.init(kRate); const double level = db(loudest(note(device, note_hz(key), 1.5f)));
    CHECK(level > -24.0 && level < -10.0, "key %.0f peaks at %.1f dBFS", key, level);
  }
}

// The steepest step above what the sound has by itself.
static void clicks() {
  // Knobs swept while a bowed chord sounds, choices changed among them.
  auto chord = [] { for (int i = 0; i < 4; ++i) device.note_on(i, note_hz(45.0f + 7.0f * i), 0.7f); };
  auto setup = [&] {
    fresh(WL::kBow); device.set_param(p::kContact, 0.0f); device.set_param(p::kShade, 0.5f); chord(); render(device, 1.5f, kRate);
  };
  setup(); const double still = max_step(render(device, 1.0f, kRate).left);
  for (int id = 0; id < p::kNumParams; ++id) {
    if (id == p::kVolume || id == p::kShell || id == p::kShade || id == p::kContact) continue;  // these make it louder or brighter
    setup(); double worst = 0.0; bool sound = true;
    for (int i = 0; i < 24; ++i) {
      device.set_param(id, (i & 1) ? p::kParamMax[id] : p::kParamMin[id]); const Stereo s = render(device, 0.04f, kRate);
      worst = std::max(worst, std::max(max_step(s.left), max_step(s.right))); sound = sound && finite(s.left) && loudest(s) < 1.01;
    }
    CHECK(sound && worst < 2.6 * still, "param %d jumps without a click (%.4f, still %.4f)", id, worst, still);
  }
  // Steals and restrikes: a soft dark note on a full pool, the same id struck again.
  auto busy = [](bool events) {
    device.init(kRate); device.set_param(p::kHardness, 0.0f); device.set_param(p::kContact, 0.0f);
    device.set_param(p::kDecay, 40.0f); device.set_param(p::kSwell, 0.02f);
    for (int i = 0; i < WL::kMaxVoices; ++i) device.note_on(i, note_hz(40.0f + 2.0f * i), 0.8f);
    render(device, 0.3f, kRate); double worst = 0.0;
    for (int i = 0; i < 12; ++i) {
      if (events) device.note_on(i % 3 ? 50 + i : 3, note_hz(44.0f + 2.0f * i), 0.4f);
      const Stereo s = render(device, 0.031f, kRate); worst = std::max(worst, std::max(max_step(s.left), max_step(s.right)));
    }
    return worst;
  };
  const double quiet = busy(false), events = busy(true);
  CHECK(events < 1.6 * quiet + 0.004, "steals and restrikes step %.4f, without them %.4f", events, quiet);
}

static void sweeps() {
  // Every knob through its range under struck and blown notes.
  for (int exciter : {WL::kHammer, WL::kBreath}) {
    for (int id = 0; id < p::kNumParams; ++id) {
      fresh(exciter); device.note_on(1, 110.0f, 1.0f); device.note_on(2, 392.0f, 1.0f); double most = 0.0; bool sound = true;
      for (int i = 0; i <= 20; ++i) {
        device.set_param(id, p::kParamMin[id] + (p::kParamMax[id] - p::kParamMin[id]) * static_cast<float>(i) / 20.0f);
        if (i % 7 == 3) device.note_on(3, 523.25f, 0.8f);
        const Stereo s = render(device, 0.03f, kRate); most = std::max(most, loudest(s)); sound = sound && finite(s.left) && finite(s.right);
      }
      CHECK(sound && most < 1.0, "param %d swept under exciter %d (peak %.2f)", id, exciter, most);
    }
  }
}

static void faults() {
  const float inf = std::numeric_limits<float>::infinity(), nan = std::nanf("");
  device.init(kRate); device.note_on(1, nan, 0.5f); device.note_on(2, inf, 0.5f); device.note_on(3, -5.0f, nan);
  device.note_on(4, 1.0e9f, inf); device.note_on(5, 220.0f, -inf); device.note_off(99); const Stereo odd = render(device, 0.5f, kRate);
  EXPECT(finite(odd.left) && loudest(odd) < 1.0, "absurd notes are survived");

  // One id at A, at B and at A again, then one note off: silence.
  for (int exciter = 0; exciter < 4; ++exciter) {
    fresh(exciter); device.set_param(p::kSympathy, 0.0f); device.set_param(p::kRelease, 0.1f);
    for (float hz : {220.0f, 330.0f, 220.0f}) { device.note_on(7, hz, 0.8f); render(device, 0.1f, kRate); }
    device.note_off(7); render(device, 1.5f, kRate);
    CHECK(loudest(render(device, 0.3f, kRate)) == 0.0, "an id back at its first pitch leaves nothing held (exciter %d)", exciter);
    // Twice inside a steal fade, then let go.
    fresh(exciter); device.set_param(p::kSympathy, 0.0f); device.set_param(p::kRelease, 0.1f);
    for (int i = 0; i < WL::kMaxVoices; ++i) device.note_on(i, note_hz(40.0f + i), 0.8f);
    render(device, 0.05f, kRate); device.note_on(70, 500.0f, 0.8f); device.note_on(70, 500.0f, 0.8f);
    render(device, 0.001f, kRate); device.note_off(70);
    for (int i = 0; i < WL::kMaxVoices; ++i) device.note_off(i);
    render(device, 1.5f, kRate);
    CHECK(loudest(render(device, 0.3f, kRate)) == 0.0, "a key struck twice in a fade is let go (exciter %d)", exciter);
  }
}

// Notes, a silence long enough to sleep in, knobs moved in it, notes again.
static Stereo passage(int block) {
  device.init(kRate); device.set_param(p::kRelease, 0.08f); device.set_param(p::kDecay, 0.4f); device.set_param(p::kSympathy, 0.5f);
  auto run_for = [block](double seconds) {
    const int total = static_cast<int>(seconds * 48000.0) / 2048 * 2048; Stereo s;
    for (int done = 0; done < total; done += block) {
      device.process(block); s.left.insert(s.left.end(), device.out_left(), device.out_left() + block);
      s.right.insert(s.right.end(), device.out_right(), device.out_right() + block);
    }
    return s;
  };
  Stereo all;
  for (int exciter : {WL::kFinger, WL::kBreath, WL::kBow}) {
    device.set_param(p::kExciter, static_cast<float>(exciter)); device.set_param(p::kShade, exciter == WL::kBow ? 0.8f : 0.1f);
    device.set_param(p::kTrue, exciter == WL::kBow ? 0.0f : 1.0f); device.note_on(1, 220.0f, 0.7f); device.note_on(2, 331.0f, 0.5f);
    all = concat(all, run_for(0.5)); device.note_off(1); device.note_off(2); all = concat(all, run_for(9.0));
  }
  return all;
}

static void blocks() {
  const Stereo reference = passage(128);
  for (int block : {1, 2048}) {
    const Stereo other = passage(block); double worst = 0.0;
    for (size_t i = 0; i < reference.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(reference.left[i]) - other.left[i]));
      worst = std::max(worst, std::fabs(static_cast<double>(reference.right[i]) - other.right[i]));
    }
    CHECK(reference.size() == other.size() && worst == 0.0, "blocks of %d give the same sound across a silence (%g)", block, worst);
  }
  // A knob moved in the silence is where it points when the next note starts.
  device.init(kRate); device.set_param(p::kTrue, 0.0f); device.set_param(p::kShade, 1.0f); render(device, 0.2f, kRate);
  device.set_param(p::kTrue, 0.5f); device.set_param(p::kShade, p::kParamDefault[p::kShade]); render(device, 0.2f, kRate);
  const Stereo woken = note(device, 220.0f, 0.5f); device.init(kRate); const Stereo first = note(device, 220.0f, 0.5f);
  EXPECT(woken.left == first.left, "a knob moved asleep does not glide under the first note");
}

static void rates() {
  for (int exciter = 0; exciter < 4; ++exciter) {
    double level[3], high[3];
    const float rate[3] = {44100.0f, 48000.0f, 96000.0f};
    for (int i = 0; i < 3; ++i) {
      device.init(rate[i]); device.set_param(p::kExciter, static_cast<float>(exciter)); const Stereo s = note(device, 220.0f, 4.0f, 0.7f, rate[i]);
      level[i] = db(rms(s.left, at(0.5, rate[i]))); high[i] = db(rms(s.left) * std::sqrt(energy_above(s.left, 1000.0, rate[i])));
    }
    const double loose = exciter >= WL::kBow ? 1.6 : 0.5;
    auto close = [](const double* x, double by) { return std::fabs(x[0] - x[2]) < by && std::fabs(x[1] - x[2]) < by; };
    CHECK(close(level, loose) && close(high, loose + 1.0), "exciter %d at three rates: %.2f, %.2f, %.2f dB, %.2f, %.2f, %.2f above 1 kHz",
          exciter, level[0], level[1], level[2], high[0], high[1], high[2]);
  }
}

int main() {
  conformance(); tones(); corners(); times(); exciters(); space(); levels(); clicks(); sweeps(); faults(); blocks(); rates();
  for (int exciter : {WL::kFinger, WL::kBow, WL::kBreath}) {
    fresh(exciter);
    for (int n = 0; n < 8; ++n) device.note_on(n, note_hz(45.0f + 4.0f * n), 0.7f);
    std::snprintf(label, sizeof label, "wire-lantern, 8 notes, exciter %d", exciter);
    report_cost(label, 4.0f, kRate, [] { render(device, 4.0f, kRate); });
  }
  return finish("wire-lantern");
}
