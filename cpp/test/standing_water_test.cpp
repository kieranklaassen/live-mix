// Native harness for Standing Water (cpp/devices/standing-water). The
// conformance pass covers silence, piles of keys, parameter abuse and other
// sample rates; the rest measures what makes it this instrument: a figure
// whose overtones follow its symmetry, a threshold that a key has to cross, a
// lag, a splash that answers every key, and a second halving under the pitch.

#include "../devices/standing-water/standing_water.h"
#include "support/test_kit.h"

#include <initializer_list>
#include <utility>

using namespace testkit;
using livemix::StandingWater;
namespace p = livemix::standing_water;

static StandingWater device;

static const float kRate = 48000.0f;
typedef std::pair<int, float> Knob;

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }

static void fresh(std::initializer_list<Knob> knobs = {}, float rate = kRate) {
  device.init(rate);
  for (const Knob& k : knobs) device.set_param(k.first, k.second);
}

static Stereo note(std::initializer_list<Knob> knobs, float hz, float gain, float seconds, float rate = kRate) {
  fresh(knobs, rate);
  device.note_on(1, hz, gain);
  return render(device, seconds, rate);
}

static double level(const Stereo& s, double from, double to, double rate = kRate) {
  const double l = rms(s.left, at(from, rate), at(to, rate)), r = rms(s.right, at(from, rate), at(to, rate));
  return db(std::sqrt(0.5 * (l * l + r * r)) + 1.0e-12);
}

static double harmonic(const Stereo& s, double hz, double from, double to) {
  const double l = tone_level(s.left, hz, kRate, at(from), at(to)), r = tone_level(s.right, hz, kRate, at(from), at(to));
  return db(std::sqrt(0.5 * (l * l + r * r)) + 1.0e-12);
}

// Where the energy sits, by bins of 50 Hz.
static double centroid(const Stereo& s, double from, double to) {
  double weighted = 0.0, total = 0.0;
  for (double hz = 100.0; hz < 8000.0; hz *= 1.0293) {
    const double a = tone_level(s.left, hz, kRate, at(from), at(to));
    weighted += a * a * hz;
    total += a * a;
  }
  return total > 0.0 ? weighted / total : 0.0;
}

// Frequency of the partial near `hz`, from how far its phase turns.
static double partial(const std::vector<float>& x, double hz, double from, double gap) {
  const size_t a = at(from), n = at(0.5), b = a + at(gap);
  double turned = tone_phase(x, hz, kRate, b, b + n) - tone_phase(x, hz, kRate, a, a + n);
  // tone_phase reads from the start of the recording, so a steady tone on hz turns by nothing.
  while (turned > kPi) turned -= 2.0 * kPi;
  while (turned < -kPi) turned += 2.0 * kPi;
  return hz + turned / (2.0 * kPi * static_cast<double>(b - a) / kRate);
}

// The largest second difference: what a click is and a tone is not.
static double corner(const std::vector<float>& x, size_t from, size_t to) {
  double worst = 0.0;
  for (size_t i = from + 2; i < std::min(to, x.size()); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 2.0 * x[i - 1] + x[i - 2]));
  }
  return worst;
}

static void test_pitch_and_level() {
  double lowest = 1.0e9, highest = -1.0e9;
  for (float hz : {65.406f, 130.813f, 261.626f, 523.251f, 1046.502f}) {
    for (float reading : {0.0f, 2.0f}) {
      Stereo s = note({{p::kReading, reading}}, hz, 0.7f, 4.5f);
      const double cents = 1200.0 * std::log2(partial(s.left, hz, 1.5, 1.0) / hz);
      EXPECT(std::fabs(cents) < 3.0, "a key is in tune within three cents");
      if (reading == 0.0f) continue;
      const double l = level(s, 1.5, 4.0);
      lowest = std::min(lowest, l);
      highest = std::max(highest, l);
      const double top = db(std::max(peak(s.left), peak(s.right)));
      EXPECT(top > -24.0 && top < -10.0, "one key peaks between -24 and -10 dBFS");
      EXPECT(std::fabs(mean(s.left, at(1), at(4))) < 1.0e-3, "no steady offset");
    }
  }
  EXPECT(highest - lowest < 4.0, "C2 to C6 sound within 4 dB of each other");
  Stereo top_key = note({{p::kSplash, 0.0f}, {p::kFoam, 0.0f}}, 11175.3f, 0.7f, 3.0f);
  EXPECT(harmonic(top_key, 11175.3, 1.5, 3.0) > level(top_key, 1.5, 3.0) - 6.0, "the top key of the keyboard is itself");
  // Nothing off the harmonics of the key or of half of it.
  Stereo s = note({{p::kFoam, 0.0f}, {p::kUnrest, 0.0f}, {p::kStray, 0.0f}, {p::kSplash, 0.0f}}, 1046.5f, 0.7f, 4.0f);
  for (double ratio : {0.73, 1.27, 1.71, 2.31, 3.37, 5.21}) {
    EXPECT(harmonic(s, 1046.5 * ratio, 2.0, 4.0) < harmonic(s, 1046.5, 2.0, 4.0) - 60.0, "what folds over folds onto the key");
  }
}

static void test_figures() {
  // At the middle of a figure only the overtones its symmetry allows are there.
  struct { float pattern; float circle; int loud; int quiet[3]; } figures[] = {
      {0.0f, 0.6f, 3, {2, 4, 6}}, {1.0f, 0.5f, 4, {3, 5, 6}}, {2.0f, 0.4f, 3, {2, 4, 5}}, {3.0f, 0.3f, 8, {5, 6, 10}}};
  for (const auto& figure : figures) {
    Stereo s = note({{p::kPattern, figure.pattern}, {p::kReading, 0.0f}, {p::kDepth, 0.0f}, {p::kCircle, figure.circle},
                     {p::kStray, 0.0f}, {p::kWidth, 0.0f}, {p::kUnrest, 0.0f}, {p::kLayers, 0.0f}, {p::kSplash, 0.0f},
                     {p::kFoam, 0.0f}, {p::kThickness, 0.0f}, {p::kDrift, 0.02f}},
                    110.0f, 0.7f, 5.0f);
    // The squares trade their energy, so the list is of what stays under both.
    for (int quiet : figure.quiet) {
      EXPECT(harmonic(s, 110.0 * figure.loud, 3.0, 5.0) > harmonic(s, 110.0 * quiet, 3.0, 5.0) + 10.0,
             "a figure's own overtone stands over the ones its symmetry leaves out");
    }
  }
  // The plain tone hides a figure neither at a low Depth nor at a high one.
  for (float reading : {0.0f, 2.0f}) {
    for (float depth : {0.0f, 1.0f}) {
      Stereo s = note({{p::kPattern, 2.0f}, {p::kReading, reading}, {p::kDepth, depth}, {p::kCircle, 0.6f}, {p::kFoam, 0.0f}}, 110.0f, 0.7f, 4.0f);
      EXPECT(harmonic(s, 330.0, 2.0, 4.0) > harmonic(s, 110.0, 2.0, 4.0) - 12.0, "the figure stands beside the plain tone at any depth");
    }
  }
  // Away from the middle the others come in.
  Stereo far = note({{p::kPattern, 2.0f}, {p::kReading, 0.0f}, {p::kStray, 1.0f}, {p::kDrift, 1.0f}, {p::kUnrest, 0.0f}}, 110.0f, 0.7f, 5.0f);
  Stereo near = note({{p::kPattern, 2.0f}, {p::kReading, 0.0f}, {p::kStray, 0.0f}, {p::kDrift, 1.0f}, {p::kUnrest, 0.0f}, {p::kWidth, 0.0f}}, 110.0f, 0.7f, 5.0f);
  EXPECT(harmonic(far, 550.0, 2.0, 5.0) > harmonic(near, 550.0, 2.0, 5.0) + 4.0, "Stray brings the other overtones in");
  // Free water never settles: its second harmonic comes and goes.
  double least = 1.0e9, most = -1.0e9;
  Stereo free = note({{p::kPattern, 4.0f}, {p::kDrift, 1.0f}}, 220.0f, 0.7f, 8.0f);
  for (double t = 2.0; t < 7.5; t += 0.25) {
    const double l = level(free, t, t + 0.25);
    least = std::min(least, l);
    most = std::max(most, l);
  }
  EXPECT(most - least > 6.0, "Free swells and sinks");
}

static void test_threshold_lag_splash() {
  const float hz = 220.0f;
  Stereo over = note({{p::kSplash, 0.0f}}, hz, 0.7f, 5.0f);
  Stereo under = note({{p::kSplash, 0.0f}, {p::kThreshold, 1.0f}}, hz, 0.7f, 5.0f);
  EXPECT(level(over, 3.0, 5.0) > level(under, 3.0, 5.0) + 6.0, "under the threshold the figure does not rise");
  EXPECT(harmonic(over, hz, 3.0, 5.0) > harmonic(over, 2 * hz, 3.0, 5.0), "past it the pitch stands");
  EXPECT(harmonic(under, 2 * hz, 3.0, 5.0) > harmonic(under, hz, 3.0, 5.0) + 3.0, "under it the octave of the shaking is heard");
  // The hand can cross it.
  Stereo soft = note({{p::kThreshold, 0.5f}}, hz, 0.2f, 4.0f), hard = note({{p::kThreshold, 0.5f}}, hz, 1.0f, 4.0f);
  EXPECT(level(hard, 2.5, 4.0) > level(soft, 2.5, 4.0) + 8.0, "a hard key crosses the threshold and a soft one does not");
  Stereo soft2 = note({}, hz, 0.15f, 4.0f), hard2 = note({}, hz, 1.0f, 4.0f);
  EXPECT(centroid(hard2, 2.0, 4.0) > 1.08 * centroid(soft2, 2.0, 4.0), "a hard key is brighter");

  double times[2];
  int k = 0;
  for (float lag : {0.3f, 3.0f}) {
    Stereo s = note({{p::kSplash, 0.0f}, {p::kLag, lag}, {p::kUnrest, 0.0f}}, hz, 0.7f, 8.0f);
    const double settled = level(s, 6.5, 8.0);
    double t = 0.0;
    while (t < 7.0 && level(s, t, t + 0.05) < settled - 6.0) t += 0.05;
    times[k++] = t;
  }
  EXPECT(times[0] < 0.5 && times[1] > 2.5 * times[0] && times[1] < 4.0, "Lag is how long the figure takes to grow");

  // The splash answers every key, whatever the threshold.
  for (float key : {65.4f, 220.0f, 880.0f, 1760.0f}) {
    for (float gain : {0.2f, 0.9f}) {
      Stereo dry = note({{p::kSplash, 0.0f}, {p::kThreshold, 1.0f}}, key, gain, 0.3f);
      Stereo wet = note({{p::kThreshold, 1.0f}}, key, gain, 0.3f);
      EXPECT(level(wet, 0.0, 0.2) > level(dry, 0.0, 0.2) + 4.0, "the splash answers the key");
      EXPECT(level(wet, 0.0, 0.2) > -52.0, "and is heard");
    }
  }
  // With Splash at nothing a key under its threshold keeps a little of it.
  Stereo least = note({{p::kSplash, 0.0f}, {p::kShake, 0.0f}, {p::kThreshold, 1.0f}}, hz, 0.7f, 1.0f);
  EXPECT(level(least, 0.0, 0.2) > -50.0, "no key is left without an answer");
  Stereo none = note({{p::kSplash, 0.0f}, {p::kFoam, 0.0f}}, hz, 0.7f, 1.0f);
  EXPECT(level(none, 0.0, 0.05) < level(none, 0.7, 1.0) - 18.0, "past it Splash at nothing is a plain swell");
  // Beads fall back after the drop, and thick water lets go of none: what is
  // above the drop's own note comes again after the first quarter of a second.
  double beads = 0.0, oily = 0.0;
  Stereo rain = note({{p::kSplash, 1.0f}, {p::kShake, 0.0f}, {p::kThreshold, 1.0f}, {p::kStone, 0.2f}, {p::kThickness, 0.5f}, {p::kFoam, 0.0f}}, hz, 0.9f, 2.0f);
  Stereo mud = note({{p::kSplash, 1.0f}, {p::kShake, 0.0f}, {p::kThreshold, 1.0f}, {p::kStone, 0.2f}, {p::kThickness, 1.0f}, {p::kFoam, 0.0f}}, hz, 0.9f, 2.0f);
  for (double t = 0.15; t < 1.3; t += 0.02) {
    beads = std::max(beads, rms(rain.left, at(t), at(t + 0.02)) / (rms(rain.left, at(t - 0.04), at(t - 0.02)) + 1.0e-7));
    oily = std::max(oily, rms(mud.left, at(t), at(t + 0.02)) / (rms(mud.left, at(t - 0.04), at(t - 0.02)) + 1.0e-7));
  }
  EXPECT(beads > 6.0 && oily < 3.0, "beads fall back into the water, and oil lets go of none");
  // A struck figure is the pattern's own and not only a drop.
  double struck[2];
  int q = 0;
  for (float pattern : {0.0f, 1.0f}) {
    Stereo s = note({{p::kPattern, pattern}, {p::kShake, 0.0f}, {p::kThreshold, 1.0f}, {p::kSplash, 0.9f}, {p::kStone, 0.0f}, {p::kThickness, 0.0f}}, hz, 0.8f, 1.5f);
    struck[q++] = harmonic(s, 4 * hz, 0.3, 1.0) - harmonic(s, hz, 0.3, 1.0);
  }
  EXPECT(struck[1] > struck[0] + 10.0, "a struck key rings with its figure");
  // The splash of a key let go rests with the water.
  fresh({{p::kSplash, 1.0f}, {p::kStone, 1.0f}, {p::kThickness, 0.0f}, {p::kShake, 0.0f}, {p::kCalm, 0.1f}});
  device.note_on(1, hz, 1.0f);
  Stereo hit = render(device, 0.2f, kRate);
  device.note_off(1);
  Stereo gone = render(device, 1.2f, kRate);
  EXPECT(level(gone, 0.5, 0.8) < level(hit, 0.1, 0.2) - 35.0, "Calm rests the splash as well");
  // A figure that grows in an instant does not overshoot.
  for (float reading : {0.0f, 1.0f, 2.0f}) {
    Stereo s = note({{p::kReading, reading}, {p::kDepth, 0.9f}, {p::kLag, 0.15f}, {p::kSplash, 0.0f}, {p::kUnrest, 0.0f}}, hz, 0.9f, 4.0f);
    double top = -200.0;
    for (double t = 0.0; t < 1.0; t += 0.05) top = std::max(top, level(s, t, t + 0.05));
    EXPECT(top < level(s, 2.0, 4.0) + 5.0, "a figure rises to its level and not over it");
  }
  // A pin is high and short, a boulder low and long; thick water stops both sooner.
  Stereo pin = note({{p::kShake, 0.0f}, {p::kSplash, 1.0f}, {p::kStone, 0.0f}}, hz, 0.9f, 3.0f);
  Stereo rock = note({{p::kShake, 0.0f}, {p::kSplash, 1.0f}, {p::kStone, 1.0f}}, hz, 0.9f, 3.0f);
  EXPECT(centroid(pin, 0.0, 0.08) > 1.2 * centroid(rock, 0.0, 0.08), "a pin splashes higher than a boulder");
  EXPECT(level(rock, 0.6, 1.0) - level(rock, 0.0, 0.2) > level(pin, 0.6, 1.0) - level(pin, 0.0, 0.2) + 3.0, "and shorter");
  Stereo oil = note({{p::kShake, 0.0f}, {p::kSplash, 1.0f}, {p::kStone, 1.0f}, {p::kThickness, 1.0f}}, hz, 0.9f, 3.0f);
  EXPECT(level(oil, 0.4, 0.9) < level(rock, 0.4, 0.9) - 6.0, "thick water stops a splash");
}

static void test_readings_and_colour() {
  const float hz = 146.83f;
  Stereo height = note({{p::kReading, 0.0f}}, hz, 0.7f, 4.0f), slope = note({{p::kReading, 1.0f}}, hz, 0.7f, 4.0f),
         light = note({{p::kReading, 2.0f}}, hz, 0.7f, 4.0f);
  EXPECT(centroid(light, 2.0, 4.0) > 1.3 * centroid(height, 2.0, 4.0), "the caustic is brighter than the height");
  EXPECT(harmonic(slope, hz, 2.0, 4.0) - level(slope, 2.0, 4.0) < harmonic(light, hz, 2.0, 4.0) - level(light, 2.0, 4.0) - 2.0,
         "the slope leaves the pitch itself thin");
  for (int knob : {static_cast<int>(p::kCircle), static_cast<int>(p::kDepth), static_cast<int>(p::kLayers)}) {
    Stereo low = note({{knob, 0.0f}}, hz, 0.7f, 7.0f), high = note({{knob, 1.0f}}, hz, 0.7f, 7.0f);
    EXPECT(centroid(high, 2.0, 7.0) > 1.15 * centroid(low, 2.0, 7.0), "Circle, Depth and Layers each brighten");
  }
  Stereo thin = note({{p::kThickness, 0.0f}}, hz, 0.7f, 4.0f), thick = note({{p::kThickness, 1.0f}}, hz, 0.7f, 4.0f);
  EXPECT(centroid(thick, 2.0, 4.0) < 0.75 * centroid(thin, 2.0, 4.0), "thick water is darker");
  Stereo open = note({{p::kPool, 2.0f}}, hz, 0.7f, 4.0f), narrow = note({{p::kPool, 1.0f}}, hz, 0.7f, 4.0f);
  EXPECT(centroid(narrow, 2.0, 4.0) > 1.6 * centroid(open, 2.0, 4.0), "a long pool is hollow and a sea is dark");
  // Never static: the spectrum of one second is not the spectrum of another.
  double moved = 0.0;
  for (int n = 1; n <= 8; ++n) moved += std::fabs(harmonic(light, hz * n, 2.0, 2.6) - harmonic(light, hz * n, 3.2, 3.8)) / 8.0;
  EXPECT(moved > 1.0, "the default key goes on moving after two seconds");
  // Below.
  Stereo without = note({}, hz, 0.7f, 4.0f), with = note({{p::kBelow, 1.0f}}, hz, 0.7f, 4.0f);
  EXPECT(harmonic(with, 0.5 * hz, 2.0, 4.0) > harmonic(without, 0.5 * hz, 2.0, 4.0) + 25.0, "Below puts a tone an octave under");
  EXPECT(harmonic(with, 0.5 * hz, 2.0, 4.0) > harmonic(with, 0.5 * hz, 0.0, 0.5) + 6.0, "and it wakes after the figure");
  // Foam is air between the harmonics.
  Stereo air = note({{p::kFoam, 1.0f}}, hz, 0.7f, 4.0f), still = note({{p::kFoam, 0.0f}}, hz, 0.7f, 4.0f);
  EXPECT(harmonic(air, 1.5 * hz, 2.0, 4.0) > harmonic(still, 1.5 * hz, 2.0, 4.0) + 12.0, "Foam fills the gaps between the overtones");
  // Width.
  Stereo mono = note({{p::kWidth, 0.0f}, {p::kFoam, 0.0f}, {p::kSplash, 0.0f}}, hz, 0.7f, 3.0f), wide = note({{p::kWidth, 1.0f}}, hz, 0.7f, 3.0f);
  EXPECT(correlation(mono.left, mono.right, at(1), at(3)) > 0.999, "Width at nothing is one point");
  const double apart = correlation(wide.left, wide.right, at(1), at(3));
  EXPECT(apart < 0.97 && apart > 0.0, "Width sets the ears apart and they still add up");
  // Calm.
  double ring[2];
  int k = 0;
  for (float calm : {0.5f, 5.0f}) {
    fresh({{p::kCalm, calm}, {p::kSplash, 0.0f}, {p::kUnrest, 0.0f}, {p::kStray, 0.0f}});
    device.note_on(1, hz, 0.7f);
    render(device, 2.0f, kRate);
    device.note_off(1);
    Stereo tail = render(device, 6.0f, kRate);
    ring[k++] = rt60(tail.left, kRate, 0.1 * calm, 0.05, -85.0);
  }
  EXPECT(ring[0] > 0.25 && ring[0] < 1.0 && ring[1] > 3.0 && ring[1] < 8.0, "Calm is how long the water takes to rest");
}

static void test_clicks() {
  // The reference is the brightest patch, held: none of its events may be rougher.
  Stereo plain = note({}, 220.0f, 0.8f, 3.0f);
  const double reference = std::max(corner(plain.left, at(1), at(3)), corner(plain.right, at(1), at(3)));
  for (int knob = 0; knob < p::kNumParams; ++knob) {
    fresh();
    device.note_on(1, 220.0f, 0.8f);
    Stereo last = render(device, 1.0f, kRate);
    double worst = 0.0;
    for (int jump = 0; jump < 8; ++jump) {
      device.set_param(knob, (jump & 1) ? p::kParamMin[knob] : p::kParamMax[knob]);
      Stereo s = render(device, 0.12f, kRate);
      EXPECT(finite(s.left) && finite(s.right) && peak(s.left) < 1.0, "a knob jumped while sounding stays bounded");
      last = concat(last, s);  // a click falls on the join
      worst = std::max(worst, std::max(corner(last.left, last.size() - s.size() - 4, last.size()), corner(last.right, last.size() - s.size() - 4, last.size())));
    }
    char label[96];
    std::snprintf(label, sizeof label, "param %d jumps without a click (%.4f against %.4f)", knob, worst, reference);
    EXPECT(worst < 5.0 * reference, label);
  }
  // A step across a block join would be as tall as the wave.
  fresh({{p::kSplash, 0.0f}, {p::kReading, 0.0f}, {p::kDepth, 0.0f}, {p::kCircle, 0.0f}, {p::kFoam, 0.0f}, {p::kThickness, 1.0f}});
  for (int n = 0; n < StandingWater::kMaxVoices; ++n) device.note_on(n, 110.0f * std::exp2(static_cast<float>(n) / 12.0f), 0.6f);
  Stereo before = render(device, 1.0f, kRate);
  const double steady = corner(before.left, at(0.5), at(1.0));
  // Each is read with what came before it: a click falls on the join.
  for (int n = 0; n < 12; ++n) {
    if (n < 6) device.note_on(50 + n, 130.0f + 10.0f * static_cast<float>(n), 0.6f);
    else device.note_on(50, 180.0f, 0.6f);
    before = concat(before, render(device, 0.03f, kRate));
  }
  EXPECT(corner(before.left, at(1.0) - 4, before.size()) < 3.0 * steady + 1.0e-4, "a stolen key and one struck again go without a click");
  // A bead comes out of the water in a round, and not in a corner.
  Stereo rain = note({{p::kSplash, 1.0f}, {p::kShake, 0.0f}, {p::kThreshold, 1.0f}, {p::kStone, 0.2f}, {p::kThickness, 0.5f}, {p::kFoam, 0.0f}}, 220.0f, 0.9f, 2.0f);
  EXPECT(corner(rain.left, at(0.4), at(2)) < 0.12 * peak(rain.left, at(0.4), at(2)), "a bead starts without a click");
  // The first samples of a key come from nothing.
  Stereo start = note({{p::kSplash, 1.0f}, {p::kStone, 0.0f}}, 440.0f, 1.0f, 0.05f);
  EXPECT(std::fabs(start.left[0]) < 1.0e-3 && std::fabs(start.right[0]) < 1.0e-3, "a key starts from silence");
}

static void test_faults() {
  // One id, three pitches, one note off: nothing is left.
  fresh();
  device.note_on(5, 220.0f, 0.7f);
  render(device, 0.1f, kRate);
  device.note_on(5, 330.0f, 0.7f);
  render(device, 0.1f, kRate);
  device.note_on(5, 220.0f, 0.7f);
  render(device, 0.1f, kRate);
  device.note_off(5);
  render(device, 9.0f, kRate);
  Stereo left = render(device, 0.5f, kRate);
  EXPECT(peak(left.left) == 0.0 && peak(left.right) == 0.0, "A, B, A and one note off leaves silence");
  // The same inside a steal.
  fresh({{p::kCalm, 0.1f}});
  for (int n = 0; n < 20; ++n) device.note_on(n, 110.0f + 20.0f * static_cast<float>(n), 0.7f);
  device.note_on(19, 500.0f, 0.7f);
  device.process(32);
  device.note_on(19, 600.0f, 0.7f);
  for (int n = 0; n < 20; ++n) device.note_off(n);
  render(device, 4.0f, kRate);
  left = render(device, 0.5f, kRate);
  EXPECT(peak(left.left) == 0.0 && peak(left.right) == 0.0, "keys stolen and let go leave silence");
  // Absurd keys.
  for (float hz : {0.0f, -5.0f, 5.0f, 20000.0f, 1.0e30f, std::nanf(""), INFINITY}) {
    for (float gain : {0.0f, 2.0f, -1.0f, std::nanf("")}) {
      Stereo s = note({}, hz, gain, 0.1f);
      EXPECT(finite(s.left) && finite(s.right) && peak(s.left) < 0.6, "an absurd key is bounded");
    }
  }
  // Every knob end while a chord sounds, one after another in one held chord.
  fresh();
  for (int n = 0; n < 5; ++n) device.note_on(n, 98.0f * std::pow(1.5f, static_cast<float>(n)), 0.8f);
  for (int pass = 0; pass < 2; ++pass) {
    for (int knob = 0; knob < p::kNumParams; ++knob) {
      for (float value : {p::kParamMin[knob], p::kParamMax[knob], p::kParamDefault[knob]}) {
        device.set_param(knob, value);
        Stereo s = render(device, 0.05f, kRate);
        EXPECT(finite(s.left) && finite(s.right) && peak(s.left) <= 1.0, "a sweep of every knob stays bounded");
      }
    }
  }
  // Patches drawn by chance, each played and let go: all of it finite.
  livemix::kit::Rng chance;
  chance.seed(77);
  for (int patch = 0; patch < 40; ++patch) {
    fresh();
    for (int knob = 0; knob < p::kVolume; ++knob) {
      device.set_param(knob, p::kParamMin[knob] + chance.uniform() * (p::kParamMax[knob] - p::kParamMin[knob]));
    }
    for (int n = 0; n < 4; ++n) device.note_on(n, 82.0f * std::pow(1.6f, static_cast<float>(n)), chance.uniform());
    Stereo held = render(device, 1.0f, kRate);
    for (int n = 0; n < 4; ++n) device.note_off(n);
    Stereo gone = render(device, 0.5f, kRate);
    EXPECT(finite(held.left) && finite(held.right) && finite(gone.left) && finite(gone.right) && peak(held.left) <= 1.0, "a patch drawn by chance is finite");
  }
  // Ten keys stay under the knee of the clip.
  for (float splash : {0.5f, 1.0f}) {
    fresh({{p::kSplash, splash}});
    int id = 0;
    for (int key : {38, 45, 50, 57, 60, 65, 69, 72, 76, 81}) device.note_on(id++, livemix::kit::midi_to_hz(static_cast<float>(key)), 0.7f);
    Stereo s = render(device, 3.0f, kRate);
    EXPECT(peak(s.left) < 0.5 && peak(s.right) < 0.5, "ten keys are under the knee");
    fresh({{p::kVolume, -6.0f}});
    for (int n = 0; n < 10; ++n) device.note_on(n, livemix::kit::midi_to_hz(static_cast<float>(60 + 4 * n)), 1.0f);
    s = render(device, 3.0f, kRate);
    EXPECT(peak(s.left) < 0.5 && peak(s.right) < 0.5, "and so are ten hard ones high up");
  }
}

static void test_blocks_and_rates() {
  // A silence between two phrases, at three block sizes.
  Stereo runs[3];
  const int sizes[3] = {1, 128, 2048};
  for (int r = 0; r < 3; ++r) {
    fresh({{p::kCalm, 0.2f}, {p::kFoam, 0.5f}, {p::kStone, 0.1f}});
    auto play = [&](int frames) {
      Stereo out;
      for (int done = 0; done < frames;) {
        const int count = std::min(sizes[r], frames - done);
        device.process(count);
        out.left.insert(out.left.end(), device.out_left(), device.out_left() + count);
        out.right.insert(out.right.end(), device.out_right(), device.out_right() + count);
        done += count;
      }
      runs[r] = concat(runs[r], out);
    };
    device.note_on(1, 220.0f, 0.7f);
    device.note_on(2, 277.0f, 0.5f);
    play(16384);
    device.set_param(p::kPattern, 1.0f);
    device.note_off(1);
    device.note_off(2);
    play(4096 * 30);
    device.set_param(p::kCircle, 0.8f);
    device.set_param(p::kVolume, -12.0f);
    device.note_on(1, 330.0f, 0.7f);
    play(16384);
    // Steals that end inside one block of one run and in many of another.
    for (int n = 0; n < 12; ++n) device.note_on(20 + n, 110.0f + 17.0f * static_cast<float>(n), 0.6f);
    play(333);
    for (int n = 0; n < 5; ++n) {
      device.note_on(60 + n, 600.0f - 40.0f * static_cast<float>(n), 0.7f);
      play(11);
    }
    play(8192);
  }
  EXPECT(peak(runs[1].left, 16384 + 4096 * 28, 16384 + 4096 * 30) == 0.0, "the silence between is exact");
  EXPECT(runs[0].left == runs[1].left && runs[1].left == runs[2].left && runs[0].right == runs[2].right,
         "blocks of 1, 128 and 2048 are the same audio across a silence");
  double at48 = 0.0, bright48 = 0.0;
  for (float rate : {48000.0f, 44100.0f, 96000.0f}) {
    Stereo s = note({{p::kFoam, 0.4f}}, 220.0f, 0.7f, 4.0f, rate);
    double l = level(s, 1.5, 4.0, rate), third = db(tone_level(s.left, 660.0, rate, at(1.5, rate), at(4.0, rate)));
    if (rate == 48000.0f) { at48 = l; bright48 = third; }
    EXPECT(std::fabs(l - at48) < 1.5 && std::fabs(third - bright48) < 4.0, "the sound does not depend on the sample rate");
  }
  // A key held for long neither creeps nor dies.
  Stereo s = note({}, 220.0f, 0.7f, 40.0f);
  EXPECT(std::fabs(level(s, 4.0, 12.0) - level(s, 30.0, 40.0)) < 4.0, "a key held for long keeps its level");
}

int main() {
  Conformance spec;
  spec.name = "standing-water";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 9.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);
  test_pitch_and_level();
  test_figures();
  test_threshold_lag_splash();
  test_readings_and_colour();
  test_clicks();
  test_faults();
  test_blocks_and_rates();
  fresh();
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::exp2(static_cast<float>(n * 4) / 12.0f), 0.8f);
  report_cost("standing-water, 8 keys", 4.0f, kRate, [] { render(device, 4.0f, kRate); });
  return finish("standing-water");
}
