// Native harness for Rose Window (cpp/devices/rose-window). The conformance
// pass covers silence, stealing, parameter abuse and other sample rates; the
// rest measures what makes it a rose: the family of harmonics a number of
// petals gives, which Fold and Curl keep; two channels that lose nothing when
// summed; rings that open and close in their order; planes that turn; bells
// where the rose does not close; and the faults instruments have had before.

#include "../devices/rose-window/rose_window.h"

#include <limits>
#include "support/test_kit.h"

using namespace testkit;
using livemix::RoseWindow;
namespace p = livemix::rose_window;

static RoseWindow device;
static const float kRate = 48000.0f;
static char label[240];
#define CHECK(ok, ...) do { std::snprintf(label, sizeof label, __VA_ARGS__); EXPECT(ok, label); } while (0)

typedef std::vector<std::pair<int, float>> Patch;

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }
static double loudest(const Stereo& s) { return std::max(peak(s.left), peak(s.right)); }
static void press(int id, float hz, float seconds, float gain = 0.8f) { device.note_on(id, hz, gain); render(device, seconds, kRate); }
static float note_hz(float midi) { return 440.0f * std::exp2((midi - 69.0f) / 12.0f); }

static std::vector<float> mono(const Stereo& s) {
  std::vector<float> out(s.left);
  for (size_t i = 0; i < s.size(); ++i) out[i] = 0.5f * (out[i] + s.right[i]);
  return out;
}

static Patch with(Patch base, const Patch& more) { return base.insert(base.end(), more.begin(), more.end()), base; }
static void set(const Patch& patch) { for (const auto& entry : patch) device.set_param(entry.first, entry.second); }

// A still, plain, open figure: nothing turns, breathes, strikes or rings on.
static void plain(const Patch& patch = {}, float rate = kRate) {
  device.init(rate);
  set({{p::kTurn, 0.0f}, {p::kTilt, 0.0f}, {p::kBreath, 0.0f}, {p::kStrike, 0.0f}, {p::kStone, 0.0f}, {p::kFold, 0.0f},
       {p::kCurl, 0.0f}, {p::kBloom, 0.3f}, {p::kAttack, 0.05f}, {p::kLight, 8000.0f}, {p::kWidth, 1.0f}, {p::kRelease, 1.0f}});
  set(patch);
}

static Stereo hold(const Patch& patch, float hz, float seconds, float gain = 0.8f, float rate = kRate) {
  plain(patch, rate);
  device.note_on(1, hz, gain);
  return render(device, seconds, rate);
}

// Level of harmonic `n` of `hz` around `seconds`, dB.
static double harmonic(const std::vector<float>& x, double hz, double n, double seconds, double length = 0.5, double rate = kRate) {
  return db(tone_level(x, hz * n, rate, at(seconds - 0.5 * length, rate), at(seconds + 0.5 * length, rate)));
}

// The most the fourth difference is: a dark tone has next to none of it, a click all of its own.
static double bend(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  double worst = 0.0;
  for (size_t i = from + 4; i < to; ++i) worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 4.0 * x[i - 1] + 6.0 * x[i - 2] - 4.0 * x[i - 3] + x[i - 4]));
  return worst;
}

// --- the figure
static void test_families() {
  for (int petals : {3, 4, 5, 8}) {
    for (int folded = 0; folded < 2; ++folded) {
      const Patch patch = {{p::kPetals, static_cast<float>(petals)}, {p::kRings, 6.0f}, {p::kReach, 0.8f}, {p::kFold, folded ? 0.7f : 0.0f},
                           {p::kCurl, folded ? 0.6f : 0.0f}};
      const std::vector<float> x = hold(patch, 110.0f, 3.0f).left;
      double in_family = -200.0, out_of_family = -200.0, higher = -200.0;
      for (int n = 1; n <= 24; ++n) {
        const double level = harmonic(x, 110.0, n, 2.4, 1.0);
        const bool own = n % petals == 1 || n % petals == petals - 1;
        (own ? in_family : out_of_family) = std::max(own ? in_family : out_of_family, level);
        if (own && n > 6 * petals + 1) higher = std::max(higher, level);
      }
      CHECK(out_of_family < in_family - 55.0, "%d petals, fold %d: only its own harmonics (%.1f dB in, %.1f dB out)", petals, folded, in_family, out_of_family);
      // The fold makes harmonics past the last ring, in the same family.
      if (petals == 3) EXPECT(folded ? higher > in_family - 30.0 : higher < in_family - 70.0, "fold reaches past the rings");
    }
  }
}

static double share_above(const std::vector<float>& x, double hz) { return energy_above(x, hz, kRate, at(1.5), at(3.0)); }
static void test_fold_is_timbre_in_mono() {
  const Patch open = {{p::kPetals, 3.0f}, {p::kHeart, 0.45f}};
  const std::vector<float> a = mono(hold(open, 110.0f, 3.0f)), b = mono(hold(with(open, {{p::kFold, 0.7f}}), 110.0f, 3.0f)),
                           c = mono(hold(with(open, {{p::kCurl, 0.7f}}), 110.0f, 3.0f));
  CHECK(share_above(b, 900) > 1.5 * share_above(a, 900) && share_above(c, 900) > 1.25 * share_above(a, 900), "fold and curl brighten in mono (%.3f to %.3f and %.3f)", share_above(a, 900), share_above(b, 900), share_above(c, 900));
  double apart = 0.0;
  for (int n : {1, 2, 4, 5, 7, 8, 10, 11}) apart += std::fabs(harmonic(b, 110, n, 2.4, 1.0) - harmonic(c, 110, n, 2.4, 1.0)) / 8.0;
  CHECK(apart > 3.0, "fold and curl are two different things (%.1f dB apart)", apart);
  const auto near_circle = [](float fold) { return share_above(mono(hold({{p::kPetals, 3.0f}, {p::kHeart, 0.8f}, {p::kFold, fold}}, 110.0f, 3.0f)), 500); };
  CHECK(near_circle(0.6f) > 1.8 * near_circle(0.0f), "a rose that is nearly a circle folds too (%.4f to %.4f)", near_circle(0.0f), near_circle(0.6f));
  // A plain circle has nothing to fold.
  const Patch one = {{p::kHeart, 1.0f}, {p::kRings, 1.0f}, {p::kReach, 0.0f}};
  const double circle = db(rms(hold(one, 220.0f, 2.0f).left, at(1.0))), bent = db(rms(hold(with(one, {{p::kFold, 1.0f}}), 220.0f, 2.0f).left, at(1.0)));
  CHECK(std::fabs(bent - circle) < 3.0, "folding leaves a circle its level (%.1f, %.1f dB)", circle, bent);
}

static void test_channels() {
  const Stereo s = hold({{p::kPetals, 4.0f}, {p::kReach, 0.8f}}, 110.0f, 3.0f);
  const std::vector<float> m = mono(s);
  CHECK(std::fabs(correlation(s.left, s.right, at(1.0), at(2.0))) < 0.06, "left and right are a quarter turn apart (correlation %.3f)", correlation(s.left, s.right, at(1.0)));
  for (int n : {1, 3, 5, 7, 9}) {
    const double lost = harmonic(m, 110, n, 2.4, 1.0) - harmonic(s.left, 110, n, 2.4, 1.0);
    CHECK(lost > -4.5 && lost < -1.5, "harmonic %d is whole in mono (%.2f dB)", n, lost);
  }
  const Stereo narrow = hold({{p::kWidth, 0.0f}}, 330.0f, 1.0f);
  EXPECT(correlation(narrow.left, narrow.right, at(0.3)) > 0.999, "width at nothing is one point");
}

static void test_pitch() {
  for (float midi : {36.0f, 50.0f, 60.0f, 76.0f, 84.0f}) {
    for (float turn : {0.3f, -1.0f}) {
      const double hz = note_hz(midi);
      const std::vector<float> x = hold({{p::kTurn, turn}, {p::kHeart, 0.7f}}, static_cast<float>(hz), 4.0f).left;
      const double found = dominant_frequency(x, kRate, hz * 0.98, hz * 1.02, at(1.0), at(4.0));
      CHECK(std::fabs(1200.0 * std::log2(found / hz)) < 1.0, "note %.0f keeps its pitch at turn %.1f (%.2f ct)", midi, turn, 1200.0 * std::log2(found / hz));
    }
  }
  // Ring tuning: the first harmonic out (3 of 4 petals), 60 cents an octave sharp.
  const std::vector<float> x = hold({{p::kPetals, 4.0f}, {p::kBend, 60.0f}, {p::kReach, 0.7f}}, 220.0f, 3.0f).left;
  const double wanted = 3.0 * std::exp2(60.0 * std::log2(3.0) / 1200.0);
  EXPECT_NEAR(dominant_frequency(x, kRate, 640.0, 740.0, at(1.0), at(3.0)) / 220.0, wanted, 0.004, "ring tuning stretches the rings");
}

// --- tracery
static void test_tracery() {
  // Smooth falls ring by ring; Pointed has a ring that stands out; Golden
  // bells sit at golden ratios and die while held; Broken comes and goes.
  const Patch base = {{p::kPetals, 3.0f}, {p::kRings, 6.0f}, {p::kReach, 0.6f}};
  const Patch pointed = with(base, {{p::kTracery, RoseWindow::kPointed}}), broken = with(base, {{p::kTracery, RoseWindow::kBroken}}),
              golden = with(base, {{p::kTracery, RoseWindow::kGoldenBells}, {p::kDecay, 4.0f}});
  const std::vector<float> a = hold(base, 220.0f, 3.0f).left, b = hold(pointed, 220.0f, 3.0f).left;
  EXPECT(harmonic(a, 220, 1, 2.4) > harmonic(a, 220, 4, 2.4) && harmonic(a, 220, 4, 2.4) > harmonic(a, 220, 10, 2.4), "smooth falls ring by ring");
  CHECK(harmonic(b, 220, 7, 2.4) > harmonic(b, 220, 1, 2.4) + 6.0, "pointed stands out past the heart (%.1f over %.1f dB)", harmonic(b, 220, 7, 2.4), harmonic(b, 220, 1, 2.4));
  const std::vector<float> c = hold(golden, 220.0f, 9.0f).left;
  CHECK(harmonic(c, 220, 1.618034, 1.0) > harmonic(c, 220, 2, 1.0) + 25.0 && harmonic(c, 220, 3.618034, 1.0) > harmonic(c, 220, 4, 1.0) + 25.0, "golden partials (%.1f %.1f, whole ones %.1f)", harmonic(c, 220, 1.618034, 1.0), harmonic(c, 220, 3.618034, 1.0), harmonic(c, 220, 2, 1.0));
  const double died = db(rms(c, at(1.0), at(1.5))) - db(rms(c, at(8.0), at(8.5)));
  CHECK(died > 20.0, "golden bells die while held (%.1f dB in 7 s)", died);
  const std::vector<float> d = mono(hold(broken, 220.0f, 12.0f));
  double low = 0.0, high = -200.0;
  for (double t = 1.0; t < 11.8; t += 0.1) low = std::min(low, db(rms(d, at(t), at(t + 0.1)))), high = std::max(high, db(rms(d, at(t), at(t + 0.1))));
  CHECK(high - low > 12.0, "broken comes and goes (%.1f to %.1f dB)", low, high);
}

// --- opening, closing, turning
static void test_bloom() {
  const Patch base = {{p::kPetals, 4.0f}, {p::kBloom, 4.0f}, {p::kRings, 5.0f}, {p::kReach, 0.9f}, {p::kRelease, 4.0f}};
  const Patch rim = with(base, {{p::kOrder, RoseWindow::kRimFirst}}), passing = with(base, {{p::kOrder, RoseWindow::kPassing}});
  const std::vector<float> a = hold(base, 220.0f, 6.0f).left, b = hold(rim, 220.0f, 6.0f).left, c = hold(passing, 220.0f, 11.0f).left;
  CHECK(harmonic(a, 220, 1, 0.8) > -50.0 && harmonic(a, 220, 19, 5.0) > harmonic(a, 220, 19, 0.8) + 25.0, "heart first: the far ring comes late (%.1f then %.1f dB)", harmonic(a, 220, 19, 0.8), harmonic(a, 220, 19, 5.0));
  CHECK(harmonic(b, 220, 1, 5.0) > harmonic(b, 220, 1, 0.8) + 25.0 && harmonic(b, 220, 19, 0.8) > harmonic(b, 220, 1, 0.8), "rim first: the heart comes late (%.1f then %.1f dB)", harmonic(b, 220, 1, 0.8), harmonic(b, 220, 1, 5.0));
  // Passing: ring 1 (3) and ring 4 (15) are each brightest at another time, again and again.
  double best3 = -200, best15 = -200, t3 = 0, t15 = 0, least3 = 0.0;
  for (double t = 0.8; t < 5.4; t += 0.1) {
    const double l3 = harmonic(c, 220, 3, t, 0.2), l15 = harmonic(c, 220, 15, t, 0.2);
    if (l3 > best3) best3 = l3, t3 = t;
    if (l15 > best15) best15 = l15, t15 = t;
    least3 = std::min(least3, l3);
  }
  const double again = harmonic(c, 220, 3, t3 + 5.6, 0.2);
  CHECK(t15 > t3 + 1.0 && best3 - least3 > 15.0 && std::fabs(again - best3) < 5.0, "passing: ring 1 at %.1f s, ring 4 at %.1f s (ring 1 %.1f to %.1f, again %.1f)", t3, t15, best3, least3, again);
  // Closing goes backwards: what opened last is gone first.
  for (int order = 0; order < 2; ++order) {
    plain(order ? rim : base);
    press(1, 220.0f, 6.0f), device.note_off(1);
    const std::vector<float> tail = render(device, 1.6f, kRate).left;
    const double heart = harmonic(tail, 220, 1, 0.3) - harmonic(tail, 220, 1, 1.3), far = harmonic(tail, 220, 19, 0.3) - harmonic(tail, 220, 19, 1.3);
    CHECK(order ? heart > far + 8.0 : far > heart + 8.0, "closing in order %d (heart falls %.1f dB, the rim %.1f)", order, heart, far);
  }
}

static double swing(const std::vector<float>& x, double hz, int n, std::vector<double>* levels = nullptr) {
  std::vector<double> found;
  for (double t = 2.0; t < 9.8; t += 0.25) found.push_back(harmonic(x, hz, n, t, 0.25));
  if (levels) *levels = found;
  return *std::max_element(found.begin(), found.end()) - *std::min_element(found.begin(), found.end());
}

static void test_turning() {
  const Patch base = {{p::kPetals, 4.0f}, {p::kReach, 0.8f}};
  const std::vector<float> a = mono(hold(with(base, {{p::kTilt, 1.0f}}), 220.0f, 10.0f)),
                           b = mono(hold(with(base, {{p::kTilt, 1.0f}, {p::kTurn, 0.35f}}), 220.0f, 10.0f)),
                           c = mono(hold(with(base, {{p::kTilt, 1.0f}, {p::kTurn, -0.35f}}), 220.0f, 10.0f));
  CHECK(swing(a, 220, 3) < 0.3, "a window that does not turn is still (%.2f dB)", swing(a, 220, 3));
  // No two keys turn together: the ring of one is at its dimmest when that of another is not.
  const std::vector<float> d = mono(hold(with(base, {{p::kTilt, 1.0f}, {p::kTurn, 0.35f}}), note_hz(58.0f), 10.0f));
  std::vector<double> b1, b2, c1, c2, d1;
  swing(d, note_hz(58.0f), 5, &d1);
  CHECK(swing(b, 220, 5, &b1) > 10.0 && swing(b, 220, 9, &b2) > 10.0, "turning is heard in mono (%.1f dB)", swing(b, 220, 3));
  swing(c, 220, 5, &c1), swing(c, 220, 9, &c2);
  const auto alike = [](const std::vector<double>& x, const std::vector<double>& y) {
    std::vector<float> u(x.begin(), x.end()), v(y.begin(), y.end());
    const float mu = static_cast<float>(mean(u)), mv = static_cast<float>(mean(v));
    for (size_t i = 0; i < u.size(); ++i) u[i] -= mu, v[i] -= mv;
    return correlation(u, v);
  };
  CHECK(alike(b1, d1) < 0.75, "two keys turn at their own pace (%.2f)", alike(b1, d1));
  CHECK(alike(b1, b2) > 0.5 && alike(c1, c2) < 0.1, "rings turn together, or against each other (%.2f, %.2f)", alike(b1, b2), alike(c1, c2));
}

// --- the touch
static void test_strike_and_touch() {
  for (float seconds : {1.0f, 4.0f}) {
    const double found = rt60(hold({{p::kStrike, 1.0f}, {p::kDecay, seconds}, {p::kDamping, 0.0f}, {p::kHeart, 1.0f}}, 220.0f, seconds * 1.2f).left, kRate, 0.1 * seconds, 0.05 * seconds, -90.0);
    CHECK(found > 0.75 * seconds && found < 1.25 * seconds, "struck: decay %.0f s rings for %.2f s", seconds, found);
  }
  const auto fall = [](float damping) {
    const std::vector<float> x = hold({{p::kStrike, 1.0f}, {p::kDecay, 6.0f}, {p::kDamping, damping}, {p::kPetals, 4.0f}, {p::kReach, 0.8f}}, 220.0f, 2.2f).left;
    return harmonic(x, 220, 9, 0.2, 0.2) - harmonic(x, 220, 9, 1.4, 0.2);
  };
  CHECK(fall(0.6f) > fall(0.0f) + 15.0, "damping stops the far rings (%.1f, %.1f dB)", fall(0.0f), fall(0.6f));
  const std::vector<float> soft = hold({{p::kLight, 1500.0f}, {p::kFold, 0.3f}}, 220.0f, 2.0f, 0.25f).left, hard = hold({{p::kLight, 1500.0f}, {p::kFold, 0.3f}}, 220.0f, 2.0f, 1.0f).left;
  CHECK(energy_above(hard, 900, kRate, at(1.0)) > 1.6 * energy_above(soft, 900, kRate, at(1.0)) && rms(hard) > 1.8 * rms(soft), "a harder key is brighter (%.3f to %.3f)", energy_above(soft, 900, kRate, at(1.0)), energy_above(hard, 900, kRate, at(1.0)));
  const auto bright = [](float gain) {
    const std::vector<float> x = hold({{p::kLight, 1000.0f}}, 220.0f, 3.0f, gain).left;
    return harmonic(x, 220, 9, 2.4, 1.0) - harmonic(x, 220, 1, 2.4, 1.0);
  };
  CHECK(bright(1.0f) > bright(0.25f) + 3.0, "a harder key lets light in (%.1f to %.1f dB)", bright(0.25f), bright(1.0f));
  // A struck rose darkens no ring by Bloom itself: what differs is the light its opening lets in.
  const auto lit = [](float bloom) {
    const std::vector<float> x = hold({{p::kStrike, 1.0f}, {p::kDecay, 30.0f}, {p::kDamping, 0.0f}, {p::kLight, 1200.0f}, {p::kBloom, bloom}}, 220.0f, 2.6f).left;
    return harmonic(x, 220, 7, 2.2) - harmonic(x, 220, 1, 2.2);
  };
  CHECK(lit(1.5f) > lit(30.0f) + 2.5, "a rose that has opened lets light in (%.1f and %.1f dB)", lit(30.0f), lit(1.5f));
  const std::vector<float> dry = hold({{p::kPetals, 4.0f}}, 330.0f, 3.0f).left, airy = hold({{p::kPetals, 4.0f}, {p::kBreath, 0.8f}}, 330.0f, 3.0f).left;
  CHECK(harmonic(airy, 330, 1.22, 2.0, 1.0) > harmonic(dry, 330, 1.22, 2.0, 1.0) + 30.0, "breath is air round the harmonics (%.1f to %.1f dB)", harmonic(dry, 330, 1.22, 2.0, 1.0), harmonic(airy, 330, 1.22, 2.0, 1.0));
  const auto over = [](float stone) { return harmonic(hold({{p::kStone, stone}}, 1187.0f, 2.0f).left, 1187, 1, 1.5) - harmonic(hold({{p::kStone, stone}}, 820.0f, 2.0f).left, 820, 1, 1.5); };
  const double bare = over(0.0f), framed = over(1.0f);
  CHECK(framed > bare + 6.0, "stone rings where it rings (%.1f to %.1f dB)", bare, framed);
}

static void test_levels() {
  for (float midi = 36.0f; midi <= 84.0f; midi += 6.0f) {
    device.init(kRate), device.note_on(1, note_hz(midi), 0.7f);
    const Stereo s = render(device, 5.0f, kRate);
    CHECK(db(loudest(s)) > -24.3 && db(loudest(s)) < -10.0, "note %.0f at gain 0.7 peaks at %.1f dBFS", midi, db(loudest(s)));
    EXPECT(std::fabs(mean(s.left, at(1.0))) < 2.0e-4, "no offset");
  }
  // Ten hard keys: every order, a loud volume, the three own presets nearest to it.
  const Patch ten[] = {{}, {{p::kOrder, 1.0f}}, {{p::kOrder, 2.0f}}, {{p::kVolume, -2.0f}},
                       {{p::kPetals, 8.0f}, {p::kHeart, 0.42f}, {p::kRings, 3.0f}, {p::kReach, 0.75f}, {p::kLight, 7000.0f}, {p::kStone, 0.0f}, {p::kFold, 0.1f}, {p::kCurl, 0.0f}, {p::kTilt, 0.4f}, {p::kStrike, 1.0f}, {p::kDecay, 3.0f}, {p::kDamping, 0.25f}, {p::kBreath, 0.0f}, {p::kAttack, 0.1f}, {p::kRelease, 2.5f}, {p::kBloom, 1.5f}, {p::kVolume, -8.5f}},
                       {{p::kPetals, 3.0f}, {p::kTracery, 3.0f}, {p::kHeart, 0.45f}, {p::kRings, 5.0f}, {p::kReach, 0.75f}, {p::kLight, 6000.0f}, {p::kStone, 0.1f}, {p::kFold, 0.0f}, {p::kCurl, 0.0f}, {p::kTurn, 0.48f}, {p::kTilt, 0.8f}, {p::kStrike, 0.8f}, {p::kDecay, 12.0f}, {p::kDamping, 0.25f}, {p::kBreath, 0.05f}, {p::kAttack, 0.1f}, {p::kRelease, 6.0f}, {p::kVolume, -12.2f}},
                       {{p::kPetals, 7.0f}, {p::kTracery, 1.0f}, {p::kHeart, 0.2f}, {p::kRings, 4.0f}, {p::kLight, 4000.0f}, {p::kStone, 0.0f}, {p::kFold, 0.1f}, {p::kCurl, 0.1f}, {p::kTurn, 0.35f}, {p::kTilt, 0.7f}, {p::kBreath, 0.85f}, {p::kStrike, 0.0f}, {p::kAttack, 2.0f}, {p::kRelease, 5.0f}, {p::kVolume, -11.2f}}};
  for (size_t which = 0; which < sizeof ten / sizeof ten[0]; ++which) {
    device.init(kRate), set(ten[which]);
    const float keys[10] = {38, 45, 50, 53, 57, 60, 64, 65, 69, 72};
    for (int i = 0; i < 10; ++i) device.note_on(i, note_hz(keys[i]), 1.0f);
    const Stereo s = render(device, 7.0f, kRate);
    CHECK(loudest(s) < 0.5, "ten keys, patch %d, stay under the knee (%.3f)", static_cast<int>(which), loudest(s));
  }
  // Where every ring is past Light or past hearing the heart still speaks.
  const Patch far = {{p::kTracery, RoseWindow::kPointed}, {p::kPetals, 11.0f}, {p::kReach, 1.0f}, {p::kRings, 9.0f}};
  for (const Patch& patch : {with(far, {{p::kLight, 250.0f}}), with(far, {{p::kHeart, 0.0f}}), Patch{{p::kTracery, 1.0f}, {p::kHeart, 0.7f}, {p::kLight, 270.0f}, {p::kOrder, RoseWindow::kRimFirst}, {p::kBloom, 25.0f}}}) {
    const double level = db(rms(hold(patch, 440.0f, 4.0f).left, at(2.5)));
    CHECK(level > -42.0, "a dark window keeps its note (%.1f dB)", level);
  }
  // What rings already is not cut by a softer stroke on the same key.
  plain({{p::kStrike, 1.0f}, {p::kDecay, 8.0f}, {p::kDamping, 0.0f}, {p::kHeart, 0.8f}});
  press(1, 220.0f, 0.5f, 1.0f);
  const double before = db(rms(render(device, 0.1f, kRate).left));
  press(1, 220.0f, 0.1f, 0.2f);
  const double after = db(rms(render(device, 0.1f, kRate).left));
  CHECK(std::fabs(after - before) < 4.0, "a soft stroke on a loud key leaves it ringing (%.1f to %.1f dB)", before, after);
}

// --- faults
static void test_clicks() {
  // Two low rings and nothing over the click they would hide; nothing is filtered.
  const Patch warm = {{p::kPetals, 3.0f}, {p::kHeart, 0.4f}, {p::kRings, 1.0f}};
  const std::vector<float> calm = hold(warm, 220.0f, 3.0f).left;
  const double reference = bend(calm, at(1.0));
  const auto clean = [&](const char* what, double found, double most) {
    CHECK(found < most * reference + 3.0e-4, "%s does not click (%.2g against %.2g)", what, found, reference);
  };
  // A key struck again inside its release, with nothing struck in it.
  plain(warm), press(1, 220.0f, 1.5f), device.note_off(1);
  const Stereo fading = render(device, 0.25f, kRate);
  device.note_on(2, 220.0f, 0.8f);
  clean("a restrike in the release", bend(concat(fading, render(device, 0.5f, kRate)).left, at(0.1)), 1.6);
  // Choices and knobs moved under a held key.
  const std::pair<int, float> moves[] = {{p::kPetals, 4.0f}, {p::kPetals, 11.0f}, {p::kTracery, 1.0f}, {p::kTracery, 2.0f}, {p::kTracery, 3.0f},
                                         {p::kOrder, 1.0f}, {p::kOrder, 2.0f}, {p::kHeart, 0.1f}, {p::kRings, 4.0f}, {p::kReach, 1.0f},
                                         {p::kTilt, 1.0f}, {p::kTurn, 1.0f}, {p::kFold, 1.0f}, {p::kCurl, 1.0f}, {p::kStone, 1.0f},
                                         {p::kWidth, 0.0f}, {p::kBend, 100.0f}, {p::kStrike, 0.9f}, {p::kVolume, -20.0f}};
  for (const auto& move : moves) {
    plain(warm), press(1, 220.0f, 1.5f);
    const Stereo before = render(device, 0.0137f, kRate);  // not after a whole number of turns
    device.set_param(move.first, move.second);
    const Stereo jumped = concat(before, render(device, 0.12f, kRate));
    const double settled = bend(render(device, 1.5f, kRate).left);
    CHECK(bend(jumped.left) < 1.8 * std::max(reference, settled) + 3.0e-4, "param %d to %g under a key does not click (%.2g, %.2g before, %.2g after)", move.first, move.second, bend(jumped.left), reference, settled);
  }
  // Steals: more keys than voices.
  plain(with(warm, {{p::kVolume, -14.0f}}));
  for (int i = 0; i < RoseWindow::kMaxVoices; ++i) device.note_on(i, note_hz(45.0f + 2.0f * i), 0.5f);
  render(device, 1.5f, kRate);
  Stereo steals = render(device, 0.5f, kRate);
  const double full = bend(steals.left);
  for (int i = 0; i < 6; ++i) device.note_on(100 + i, note_hz(46.0f + 2.0f * i), 0.5f), steals = concat(steals, render(device, 0.2137f, kRate));
  const double stolen = bend(steals.left);
  CHECK(stolen < 1.8 * full + 3.0e-4, "a steal does not click (%.2g against %.2g)", stolen, full);
}

static void test_ids() {
  // One id at one pitch, at another and at the first again, then one off.
  for (float gap : {0.0f, 0.002f, 0.2f}) {
    plain({{p::kRelease, 0.1f}});
    for (float hz : {220.0f, 330.0f, 220.0f}) {
      device.note_on(7, hz, 0.8f);
      if (gap > 0.0f) render(device, gap, kRate);
    }
    device.note_off(7), render(device, 1.6f, kRate);
    EXPECT(loudest(render(device, 0.3f, kRate)) == 0.0, "an id back at its first pitch leaves nothing held");
  }
  // Two ids on one pitch: the sound goes on until both are up, as loud as one.
  const auto level = [] { return rms(render(device, 1.0f, kRate).left, at(0.6)); };
  plain(), device.note_on(1, 220.0f, 0.8f);
  const double one = level();
  device.note_on(2, 220.0f, 0.8f);
  const double two = level();
  device.note_off(1);
  const double left = level();
  EXPECT(std::fabs(db(two / one)) < 1.0 && std::fabs(db(left / one)) < 1.0, "two ids of one pitch are one rose");
  // An id that goes to another pitch leaves the first.
  plain({{p::kRelease, 0.1f}});
  press(7, 220.0f, 0.5f), press(7, 330.0f, 1.5f);
  EXPECT(harmonic(render(device, 1.0f, kRate).left, 220, 1, 0.5) < -90.0, "an id holds one pitch at a time");
  // Twice struck inside a steal's fade.
  plain({{p::kRelease, 0.1f}});
  for (int i = 0; i < RoseWindow::kMaxVoices; ++i) device.note_on(i, note_hz(45.0f + 2.0f * i), 0.5f);
  render(device, 0.3f, kRate);
  press(50, 700.0f, 0.001f);
  device.note_on(50, 800.0f, 0.8f), device.note_on(50, 700.0f, 0.8f);
  for (int i = 0; i < 60; ++i) device.note_off(i);
  render(device, 1.8f, kRate);
  EXPECT(loudest(render(device, 0.3f, kRate)) == 0.0, "nothing stays after a key is struck twice in a steal");
  device.init(kRate);
  for (float hz : {0.0f, -5.0f, 5.0f, 20000.0f, std::nanf(""), std::numeric_limits<float>::infinity()}) {
    for (float gain : {0.0f, 2.0f, -1.0f, std::nanf("")}) device.note_on(static_cast<int>(hz) & 1023, hz, gain);
  }
  EXPECT(finite(render(device, 0.5f, kRate).left), "absurd notes are survived");
}

static Stereo phrase(int block) {
  device.init(kRate), set({{p::kTurn, 0.5f}, {p::kStone, 0.6f}, {p::kTracery, 2.0f}, {p::kRelease, 0.2f}, {p::kBreath, 0.4f}, {p::kStrike, 0.5f}});
  Stereo out;
  const int pieces[4] = {8192, 8192, 4 * 8192 + 4096, 8192};  // a sound, its release, a long silence, a sound
  for (int round = 0; round < 2; ++round) {
    for (int i = 0; i < 4; ++i) {
      if (i == 0 || i == 3) device.note_on(1 + i, i ? 330.0f : 220.0f, 0.8f);
      if (i == 1) device.note_off(1);
      if (i == 2) device.note_off(4);
      out = concat(out, run(device, std::vector<float>(static_cast<size_t>(pieces[i]), 0.0f), block));
      if (i == 3) device.set_param(p::kHeart, 0.8f);
    }
  }
  return out;
}

static void test_blocks() {
  const Stereo whole = phrase(128);
  for (int block : {1, 7, 2048}) {
    const Stereo other = phrase(block);
    double worst = 0.0;
    for (size_t i = 0; i < whole.size(); ++i) worst = std::max(worst, std::fabs(static_cast<double>(whole.left[i]) - other.left[i]) + std::fabs(static_cast<double>(whole.right[i]) - other.right[i]));
    CHECK(worst == 0.0, "blocks of %d give the same sound across a silence (%g)", block, worst);
  }
}

static void test_rates() {
  const Patch patch = {{p::kPetals, 3.0f}, {p::kFold, 0.5f}, {p::kCurl, 0.3f}, {p::kLight, 4000.0f}};
  const std::vector<float> a = hold(patch, 220.0f, 3.0f).left;
  for (float rate : {44100.0f, 96000.0f}) {
    const std::vector<float> b = hold(patch, 220.0f, 3.0f, 0.8f, rate).left;
    for (int n : {1, 2, 4, 7}) {
      const double apart = harmonic(b, 220, n, 2.4, 0.5, rate) - harmonic(a, 220, n, 2.4);
      CHECK(std::fabs(apart) < 1.2, "harmonic %d at %.0f Hz is %.2f dB off", n, rate, apart);
    }
  }
  // Breath is as loud against the tone at every rate.
  const auto air = [](float rate) {
    const std::vector<float> x = hold({{p::kBreath, 0.9f}, {p::kHeart, 1.0f}, {p::kRings, 1.0f}}, 220.0f, 6.0f, 0.8f, rate).left;
    return 10.0 * std::log10(energy_above(x, 3000, rate, at(1.0, rate)));
  };
  CHECK(std::fabs(air(96000.0f) - air(48000.0f)) < 1.0, "air at 48 and 96 kHz (%.2f and %.2f dB)", air(48000.0f), air(96000.0f));
  // What folds past the top does not come back.
  for (float midi : {72.0f, 84.0f}) {
    const double hz = note_hz(midi);
    const std::vector<float> x = hold({{p::kPetals, 4.0f}, {p::kFold, 0.6f}, {p::kCurl, 0.4f}, {p::kReach, 0.8f}}, static_cast<float>(hz), 2.0f).left;
    double off = -200.0;
    for (double f = 300.0; f < 12000.0; f += 37.0) {
      const double n = f / hz;
      if (std::fabs(n - std::round(n)) > 0.06) off = std::max(off, harmonic(x, 1.0, f, 1.4, 0.8));
    }
    CHECK(off < harmonic(x, hz, 1, 1.4, 0.8) - 46.0, "note %.0f folded hard: nothing comes back (%.1f dB under)", midi, harmonic(x, hz, 1, 1.4, 0.8) - off);
  }
}

static void test_sweeps() {
  // Every knob walked from end to end and jumped, with a chord held.
  for (int id = 0; id < p::kNumParams; ++id) {
    device.init(kRate);
    for (int i = 0; i < 5; ++i) device.note_on(i, note_hz(50.0f + 5.0f * i), 0.8f);
    bool good = finite(render(device, 0.5f, kRate).left);
    double most = 0.0;
    for (int step = 0; step <= 24; ++step) {
      const float t = static_cast<float>(step % 5 == 4 ? 24 - step : step) / 24.0f;
      device.set_param(id, p::kParamMin[id] + t * (p::kParamMax[id] - p::kParamMin[id]));
      if (step == 12) device.note_on(1, note_hz(55.0f), 0.8f);
      const Stereo s = render(device, 0.04f, kRate);
      good = good && finite(s.left) && finite(s.right), most = std::max(most, loudest(s));
    }
    CHECK(good && most < 0.9, "param %d swept under a chord (peak %.2f)", id, most);
  }
  // A long hold stays where it is.
  plain({{p::kTurn, 0.4f}, {p::kFold, 0.5f}});
  device.note_on(1, 220.0f, 0.8f);
  const double early = rms(render(device, 4.0f, kRate).left, at(2.0)), later = rms(render(device, 60.0f, kRate, 2048).left, at(58.0));
  CHECK(std::fabs(db(later / early)) < 1.5, "a minute held keeps its level (%.2f dB)", db(later / early));
  // A knob moved in silence is where it points when the next key comes.
  plain();
  press(1, 220.0f, 0.5f), device.note_off(1), render(device, 4.0f, kRate);
  device.set_param(p::kVolume, -30.0f), device.note_on(2, 220.0f, 0.8f);
  const Stereo moved = render(device, 0.5f, kRate), fresh = hold({{p::kVolume, -30.0f}}, 220.0f, 0.5f);
  EXPECT(std::fabs(db(peak(moved.left) / peak(fresh.left))) < 0.1 && peak(moved.left, 0, at(0.05)) < 1.05 * peak(fresh.left, 0, at(0.05)), "a knob moved asleep does not glide under the next key");
}

int main() {
  Conformance spec;
  spec.name = "rose-window", spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin, spec.maxs = p::kParamMax, spec.defaults = p::kParamDefault;
  spec.tail_seconds = 7.5f, spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);
  for (auto test : {test_families, test_fold_is_timbre_in_mono, test_channels, test_pitch, test_tracery, test_bloom, test_turning,
                    test_strike_and_touch, test_levels, test_clicks, test_ids, test_blocks, test_rates, test_sweeps}) {
    test();
  }
  device.init(kRate);
  for (int i = 0; i < 8; ++i) device.note_on(i, note_hz(45.0f + 3.0f * i), 0.7f);
  render(device, 2.0f, kRate);
  report_cost("rose-window (8 keys)", 6.0f, kRate, [] { render(device, 6.0f, kRate); });
  return finish("rose-window");
}
