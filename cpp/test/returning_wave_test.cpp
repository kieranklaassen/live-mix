// Native harness of Returning Wave: conformance, what makes it a wave that
// returns, and the faults a polyphonic instrument can have.

#include <functional>

#include "../devices/returning-wave/returning_wave.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::ReturningWave;
namespace rw = livemix::returning_wave;

namespace {

constexpr float kRate = 48000.0f;
ReturningWave device;

size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }

// The defaults with the breath and the splash off: what is left is harmonic.
void fresh(std::initializer_list<std::pair<int, float>> settings = {}, float rate = kRate) {
  device.init(rate);
  for (int id : {rw::kHaze, rw::kSplash}) device.set_param(id, 0.0f);
  for (const auto& setting : settings) device.set_param(setting.first, setting.second);
}

Stereo played(float hz, float seconds, float gain = 0.7f) {
  device.note_on(1, hz, gain);
  return render(device, seconds, device.sample_rate());
}

std::vector<float> mixed(const Stereo& s, float sign) {
  std::vector<float> out(s.size());
  for (size_t i = 0; i < out.size(); ++i) out[i] = 0.5f * (s.left[i] + sign * s.right[i]);
  return out;
}
std::vector<float> mid(const Stereo& s) { return mixed(s, 1.0f); }
std::vector<float> side(const Stereo& s) { return mixed(s, -1.0f); }

double harmonic(const std::vector<float>& x, double hz, int k, double from, double to, double rate = kRate) {
  return db(tone_level(x, hz * k, rate, at(from, rate), at(to, rate)));
}

// The share of a change that is there after 8 samples, of what it is in 20 ms.
double suddenness(const std::function<void()>& setup, const std::function<void()>& event) {
  double worst = 0.0;
  for (int moment = 0; moment < 6; ++moment) {
    const float lead = 0.45f + 0.0137f * static_cast<float>(moment);
    Stereo plain, moved;
    for (int pass = 0; pass < 2; ++pass) {
      setup();
      render(device, lead, kRate);
      if (pass == 1) event();
      (pass == 0 ? plain : moved) = render(device, 0.02f, kRate);
    }
    double early = 0.0, whole = 1.0e-9;
    for (size_t i = 0; i < plain.size(); ++i) {
      const double d = std::max(std::fabs(static_cast<double>(moved.left[i]) - plain.left[i]),
                                std::fabs(static_cast<double>(moved.right[i]) - plain.right[i]));
      if (i < 8) early = std::max(early, d);
      whole = std::max(whole, d);
    }
    if (whole > 1.0e-4) worst = std::max(worst, early / whole);
  }
  return worst;
}

void test_fractions() {
  const double f = 220.0;
  // Held at a half of the way the ring stands in two copies: the octave and
  // what lies over it. At a third it is the twelfth, at a quarter two octaves.
  const struct { float start; int lift; } stops[] = {{0.5f, 2}, {1.0f / 3.0f, 3}, {0.25f, 4}, {0.2f, 5}};
  for (const auto& stop : stops) {
    fresh({{rw::kWalls, 1.0f}, {rw::kStart, stop.start}, {rw::kFreeze, 1.0f}, {rw::kAnchor, 0.0f}, {rw::kPlace, 0.0f},
           {rw::kSecond, 0.0f}, {rw::kWidth, 0.1f}, {rw::kThrow, 0.0f}, {rw::kReturn, 60.0f}, {rw::kBlur, 0.0f}});
    const std::vector<float> x = mid(played(220.0f, 1.0f));
    const double lifted = harmonic(x, f, stop.lift, 0.4, 0.9);
    for (int k = 1; k < 7; ++k) EXPECT(k % stop.lift == 0 || harmonic(x, f, k, 0.4, 0.9) < lifted - 24.0, "a fraction of the return lifts its harmonic clean of the rest");
  }
}

// When the fundamental is strongest after it has gone.
double time_of_return(float seconds, float hz = 220.0f, float clock = 0.0f) {
  fresh({{rw::kWalls, 1.0f}, {rw::kReturn, seconds}, {rw::kAnchor, 0.0f}, {rw::kClock, clock}, {rw::kPlace, 0.0f}, {rw::kSecond, 0.0f}});
  const std::vector<float> x = mid(played(hz, 1.4f * seconds));
  double best = -200.0, when = 0.0;
  for (double t = 0.5 * seconds; t < 1.3 * seconds; t += 0.02 * seconds) {
    const double level = harmonic(x, hz, 1, t - 0.1, t + 0.1);
    if (level > best) best = level, when = t;
  }
  return when;
}

void test_return() {
  fresh({{rw::kReturn, 5.0f}, {rw::kAnchor, 0.0f}});
  const std::vector<float> x = mid(played(220.0f, 6.0f));
  const double opening = harmonic(x, 220.0, 1, 0.05, 0.3);
  double lowest = 0.0, back = -200.0;
  for (double t = 0.8; t < 4.2; t += 0.1) lowest = std::min(lowest, harmonic(x, 220.0, 1, t, t + 0.2));
  for (double t = 4.4; t < 5.8; t += 0.05) back = std::max(back, harmonic(x, 220.0, 1, t, t + 0.2));
  EXPECT(lowest < opening - 18.0, "with no anchor the pitch itself dissolves");
  EXPECT(back > opening - 8.0, "and comes back whole at the return");
  EXPECT_NEAR(time_of_return(4.0f), 4.0, 0.45, "the return comes when Return says");
  EXPECT_NEAR(time_of_return(8.0f), 8.0, 0.9, "and twice as late when it says twice as late");
  EXPECT_NEAR(time_of_return(3.0f, 220.0f, 1.0f), 3.0 * std::pow(200.0 / 220.0, 1.1), 0.5, "By pitch leaves a middle key near its time");
}

// The middle of the spectrum, over the first forty harmonics.
double middle_hz(const std::vector<float>& x, double hz, double from, double to) {
  double sum = 0.0, moment = 0.0;
  for (int k = 1; k <= 40; ++k) {
    const double a = tone_level(x, hz * k, kRate, at(from), at(to));
    sum += a * a, moment += a * a * hz * k;
  }
  return moment / (sum + 1.0e-20);
}

void test_journey() {
  // At the defaults, as a key is played: bright, then haze, the twelfth a
  // third of the way and the octave half way, then whole and bright again.
  fresh();
  const std::vector<float> x = mid(played(220.0f, 13.0f));
  const double open = middle_hz(x, 220.0, 0.1, 0.4);
  double haze = 0.0;
  for (double t = 1.2; t < 2.5; t += 0.2) haze += middle_hz(x, 220.0, t, t + 0.4) / 7.0;
  EXPECT(open > 2.0 * haze, "a key opens brighter than its haze");
  double back = 0.0;
  for (double t = 11.4; t < 12.4; t += 0.1) back = std::max(back, middle_hz(x, 220.0, t, t + 0.3));
  EXPECT(back > 2.0 * haze, "and is as bright again at its return");
  EXPECT(harmonic(x, 220.0, 3, 3.8, 4.1) > harmonic(x, 220.0, 3, 1.8, 2.4) + 6.0, "the twelfth passes");
  EXPECT(harmonic(x, 220.0, 2, 5.8, 6.1) > harmonic(x, 220.0, 2, 2.0, 2.4) + 6.0, "and the octave");
  double lowest = 200.0, highest = -200.0;
  for (double t = 0.4; t < 12.4; t += 0.25) {
    const double level = db(rms(x, at(t), at(t + 0.25)));
    lowest = std::min(lowest, level), highest = std::max(highest, level);
  }
  EXPECT(highest - lowest < 11.0, "its level does not pump");
  // Every wall keeps the pitch at the defaults.
  for (int walls = 0; walls < 5; ++walls) {
    fresh({{rw::kWalls, static_cast<float>(walls)}});
    const std::vector<float> y = mid(played(220.0f, 8.0f));
    double least = 0.0;
    for (double t = 0.2; t < 7.5; t += 0.2) least = std::min(least, harmonic(y, 220.0, 1, t, t + 0.3));
    EXPECT(least > (walls == 4 ? -66.0 : -56.0), "the fundamental never vanishes");
  }
  // A fading well comes back, and a long hold is not a silence.
  fresh({{rw::kWalls, 4.0f}, {rw::kReturn, 2.0f}, {rw::kHaze, 0.3f}});
  const std::vector<float> w = mid(played(220.0f, 10.0f));
  EXPECT(db(rms(w, at(3.7), at(4.2))) > db(rms(w, at(1.7), at(2.2))) + 8.0, "a fading well sinks and rises again");
  for (int each = 0; each < 10; ++each) {
    fresh({{rw::kWalls, static_cast<float>(each / 2)}, {rw::kReading, static_cast<float>(each % 2)}, {rw::kTilt, 1.0f}, {rw::kBody, 0.8f}, {rw::kWidth, 0.0f}, {rw::kThrow, 0.6f}});
    EXPECT(middle_hz(mid(played(146.8f, 2.0f)), 146.8, 0.2, 1.9) < 2400.0, "a bright setting is not all edge");
  }
}

// Second differences: the wrong pitch or a corner stands out in them.
double bend(const std::vector<float>& x, size_t from, size_t to) {
  double most = 0.0;
  for (size_t i = from + 2; i < to; ++i) most = std::max(most, std::fabs(static_cast<double>(x[i]) - 2.0 * x[i - 1] + x[i - 2]));
  return most;
}

void test_choices() {
  for (int id : {int(rw::kWalls), int(rw::kReading), int(rw::kClock)}) {
    const int count = static_cast<int>(rw::kParamMax[id]) + 1;
    for (int change = 0; change < count * count; ++change) {
      const int from = change / count, to = change % count;
      if (from == to) continue;
      double bends[3];
      for (int pass = 0; pass < 3; ++pass) {  // as it was, as it will be, as it changes
        fresh({{rw::kTilt, -0.4f}, {id, static_cast<float>(pass == 1 ? to : from)}});
        device.note_on(1, 196.0f, 0.8f);
        Stereo run = render(device, 0.5f, kRate);
        if (pass == 2) device.set_param(id, static_cast<float>(to));
        run = concat(run, render(device, 0.06f, kRate));
        bends[pass] = bend(run.left, at(0.5) - 2, run.size());
      }
      const double usual = std::max(bends[0], bends[1]) + 1.0e-5;
      if (bends[2] >= 1.6 * usual) std::printf("choice %d from %d to %d: %g\n", id, from, to, bends[2] / usual);
      EXPECT(bends[2] < 1.6 * usual, "a choice changes under a held key with no chirp and no corner");
    }
  }
}

void test_clean() {
  // Nothing between the harmonics, whatever the tables do.
  fresh({{rw::kReturn, 6.0f}, {rw::kWidth, 0.0f}, {rw::kTilt, 1.0f}, {rw::kThrow, 0.6f}, {rw::kEars, 1.0f}});
  const Stereo s = played(1000.0f, 3.0f);
  double own = -200.0, between = -200.0;
  for (int k = 1; k < 12; ++k) own = std::max(own, harmonic(s.left, 1000.0, k, 0.5, 2.5));
  for (double hz = 430.0; hz < 12000.0; hz += 500.0) {
    if (std::fmod(hz + 250.0, 1000.0) < 240.0) continue;
    between = std::max(between, db(tone_level(s.left, hz, kRate, at(0.5), at(2.5))));
  }
  EXPECT(between < own - 62.0, "steps of the tables and folded harmonics are not heard");
  // A key at the top keeps its pitch and folds nothing down.
  fresh();
  const std::vector<float> high = mid(played(4186.0f, 1.0f));
  EXPECT(db(tone_level(high, 1500.0, kRate, at(0.3), at(0.9))) < harmonic(high, 4186.0, 1, 0.3, 0.9) - 62.0, "nothing folds down at the top");
  for (float hz : {65.406f, 220.0f, 1046.5f}) {
    fresh({{rw::kReturn, 20.0f}});
    const std::vector<float> x = mid(played(hz, 5.0f));
    const double found = dominant_frequency(x, kRate, hz * 0.97, hz * 1.03, at(1.0), at(5.0));
    EXPECT_NEAR(1200.0 * std::log2(found / hz), 0.0, 3.0, "in tune within three cents");
  }
}

void test_image() {
  fresh({{rw::kReturn, 10.0f}});
  Stereo s = played(440.0f, 6.0f);
  const std::vector<float> m = mid(s), d = side(s);
  const double open = db(rms(d, at(0.02), at(0.12))) - db(rms(m, at(0.02), at(0.12)));
  double widest = -200.0;
  for (double t = 0.4; t < 5.5; t += 0.1) widest = std::max(widest, db(rms(d, at(t), at(t + 0.2))) - db(rms(m, at(t), at(t + 0.2))));
  EXPECT(open < widest - 5.0, "a key opens in the middle and widens as it flows");
  EXPECT(widest < 3.0, "and is never wider than it is loud");
  for (int walls = 0; walls < 5; ++walls) {
    for (int reading = 0; reading < 3; ++reading) {
      fresh({{rw::kWalls, static_cast<float>(walls)}, {rw::kReading, static_cast<float>(reading)}, {rw::kEars, 1.0f}, {rw::kReturn, 40.0f}, {rw::kThrow, 0.8f}});
      s = played(220.0f, 4.0f);
      EXPECT(rms(side(s), at(0.1)) < 1.05 * rms(mid(s), at(0.1)), "one speaker does not lose it");
    }
  }
  fresh({{rw::kEars, 0.0f}});
  s = played(440.0f, 1.0f);
  EXPECT(peak(side(s)) < 1.0e-6, "with Ears at zero it is one point");
}

void test_readings() {
  fresh({{rw::kReading, 1.0f}, {rw::kAnchor, 0.0f}});
  std::vector<float> x = mid(played(220.0f, 2.0f));
  for (int k = 2; k < 9; k += 2) {
    EXPECT(harmonic(x, 220.0, k, 0.5, 1.8) < harmonic(x, 220.0, 3, 0.5, 1.8) - 40.0, "the wave itself is hollow: no even harmonics");
  }
  fresh({{rw::kReading, 2.0f}});
  const double flow = db(tone_level(mid(played(220.0f, 2.0f)), 300.0, kRate, at(0.4), at(1.8)));
  fresh();
  const double still = db(tone_level(mid(played(220.0f, 2.0f)), 300.0, kRate, at(0.4), at(1.8)));
  EXPECT(flow > still + 15.0, "the flow is made of breath");
  fresh({{rw::kWalls, 3.0f}});
  x = mid(played(220.0f, 2.0f));
  EXPECT(db(tone_level(x, 110.0, kRate, at(0.1), at(1.0))) > harmonic(x, 220.0, 1, 0.1, 1.0) - 20.0, "two rooms sound the octave under the key");
  fresh();
  x = mid(played(220.0f, 2.0f));
  EXPECT(db(tone_level(x, 110.0, kRate, at(0.1), at(1.0))) < harmonic(x, 220.0, 1, 0.1, 1.0) - 50.0, "one box does not");
}

void test_knobs() {
  auto bright = [](std::initializer_list<std::pair<int, float>> settings, float gain = 0.7f) {
    fresh(settings);
    return energy_above(mid(played(220.0f, 1.5f, gain)), 900.0, kRate, at(0.1));
  };
  EXPECT(bright({{rw::kWidth, 0.0f}}) > 2.0 * bright({{rw::kWidth, 1.0f}}), "a narrow wave is bright, a wide one dark");
  EXPECT(bright({}, 1.0f) > 1.4 * bright({}, 0.3f), "a harder touch is brighter");
  EXPECT(bright({{rw::kTilt, 1.0f}}) > 3.0 * bright({{rw::kTilt, -1.0f}}), "Tilt leans the spectrum");
  fresh();
  const double soft = rms(played(220.0f, 1.0f, 0.3f).left);
  fresh();
  EXPECT(rms(played(220.0f, 1.0f, 1.0f).left) > 1.8 * soft, "and louder");
  // Leak: it dies while held, its upper part first.
  fresh({{rw::kLeak, 0.4f}, {rw::kAttack, 0.02f}});
  const std::vector<float> x = mid(played(220.0f, 3.0f));
  EXPECT(db(rms(x, at(1.5), at(1.7))) < db(rms(x, at(0.1), at(0.3))) - 12.0, "a leak lets a held key die away");
  fresh({{rw::kLeak, 0.6f}, {rw::kAttack, 0.02f}, {rw::kAnchor, 0.0f}, {rw::kWidth, 0.0f}});
  const std::vector<float> leaky = mid(played(220.0f, 3.0f));
  fresh({{rw::kLeak, 0.0f}, {rw::kAttack, 0.02f}, {rw::kAnchor, 0.0f}, {rw::kWidth, 0.0f}});
  const std::vector<float> whole = mid(played(220.0f, 3.0f));
  EXPECT(energy_above(leaky, 900.0, kRate, at(0.6), at(1.4)) < 0.7 * energy_above(whole, 900.0, kRate, at(0.6), at(1.4)), "its upper part first");
  fresh({{rw::kLeak, 1.0f}});
  played(220.0f, 20.0f);
  EXPECT(peak(render(device, 0.2f, kRate).left) == 0.0, "until it is exact silence, the key still down");
  // Round a ring the quick parts are the far ones on either side.
  fresh({{rw::kWalls, 1.0f}, {rw::kLeak, 0.3f}, {rw::kAttack, 0.02f}, {rw::kAnchor, 0.0f}});
  const std::vector<float> round = mid(played(220.0f, 5.0f));
  EXPECT(db(rms(round, at(3.8), at(4.4))) > db(rms(round, at(0.1), at(0.4))) - 24.0, "a ring that leaks still comes round");
  // The splash is thrown with the key and not with a slow attack.
  fresh({{rw::kSplash, 0.8f}, {rw::kAttack, 4.0f}});
  const std::vector<float> thrown = mid(played(220.0f, 0.3f));
  fresh({{rw::kAttack, 4.0f}});
  EXPECT(rms(thrown, at(0.02), at(0.2)) > 4.0 * rms(mid(played(220.0f, 0.3f)), at(0.02), at(0.2)), "a splash does not wait for the attack");
  // On the shared clock a second key stands as far along whoever was first.
  auto second = [](float first_hz) {
    fresh({{rw::kClock, 2.0f}, {rw::kReturn, 3.0f}, {rw::kAnchor, 0.0f}, {rw::kEars, 0.0f}});
    device.note_on(1, first_hz, 0.001f);
    render(device, 0.02f, kRate);
    return mid(played(880.0f, 1.5f, 1.0f));
  };
  EXPECT(std::fabs(harmonic(second(110.0f), 880.0, 1, 0.8, 1.4) - harmonic(second(880.0f), 880.0, 1, 0.8, 1.4)) > 1.0, "keys of a shared clock stand apart by their pitch");
  // Haze gathers as the wave dissolves.
  fresh({{rw::kHaze, 0.8f}, {rw::kAttack, 0.02f}, {rw::kSecond, 0.0f}});
  const std::vector<float> misty = mid(played(440.0f, 3.0f));
  const double early = db(tone_level(misty, 590.0, kRate, at(0.02), at(0.3))) - db(rms(misty, at(0.02), at(0.3)));
  double late = 0.0;
  for (int i = 0; i < 6; ++i) late += (db(tone_level(misty, 570.0 + 7.0 * i, kRate, at(1.5), at(2.5))) - db(rms(misty, at(1.5), at(2.5)))) / 6.0;
  EXPECT(late > early - 6.0, "breath is there when the wave is spent");
  // Freeze holds a colour; with it off the colour goes by.
  auto walk = [](float freeze) {
    fresh({{rw::kFreeze, freeze}, {rw::kReturn, 6.0f}, {rw::kStart, 0.1f}, {rw::kAnchor, 0.0f}});
    const std::vector<float> y = mid(played(220.0f, 4.0f));
    double moved = 0.0;
    for (int k = 1; k < 8; ++k) moved += std::fabs(std::max(-72.0, harmonic(y, 220.0, k, 0.6, 1.0)) - std::max(-72.0, harmonic(y, 220.0, k, 3.2, 3.6)));
    return moved / 7.0;
  };
  EXPECT(walk(1.0f) < 0.5 * walk(0.0f), "Freeze holds the wave where it began");
  // Second and Gap: stripes far up.
  EXPECT(bright({{rw::kSecond, 1.0f}, {rw::kGap, 1.0f}}) > 1.2 * bright({{rw::kSecond, 1.0f}, {rw::kGap, 0.0f}}), "a far second wave is brighter");
}

void test_levels() {
  for (float hz : {65.4f, 130.8f, 261.6f, 523.3f, 1046.5f}) {
    device.init(kRate);
    const Stereo s = played(hz, 3.0f);
    const double top = db(std::max(peak(s.left), peak(s.right)));
    EXPECT(top < -10.0 && top > -25.5, "one note peaks between the limits");
  }
  device.init(kRate);
  const int keys[] = {36, 43, 48, 52, 55, 60, 64, 67, 72, 76};
  for (int n = 0; n < 10; ++n) device.note_on(n, 440.0f * std::pow(2.0f, (keys[n] - 69) / 12.0f), 1.0f);
  const Stereo s = render(device, 4.0f, kRate);
  EXPECT(std::max(peak(s.left), peak(s.right)) < 0.5, "ten keys stay under the clip's knee");
  std::vector<double> level;
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    device.init(rate);
    level.push_back(db(rms(played(220.0f, 2.5f).left)));
  }
  EXPECT(std::fabs(level[0] - level[1]) < 0.8 && std::fabs(level[2] - level[1]) < 0.8, "as loud at every sample rate");
}

void test_clicks() {
  auto chord = [] {
    device.init(kRate);
    device.set_param(rw::kAttack, 0.02f);
    for (int n = 0; n < 12; ++n) device.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n) / 6.0f), 0.6f);
  };
  auto note = [] { fresh({{rw::kHaze, 0.25f}, {rw::kSplash, 0.2f}}); device.note_on(1, 196.0f, 0.8f); };
  EXPECT(suddenness(chord, [] { device.note_on(50, 330.0f, 0.8f); }) < 0.2, "a stolen key fades");
  EXPECT(suddenness(note, [] { device.note_on(1, 196.0f, 0.8f); }) < 0.2, "a key struck again does not click");
  EXPECT(suddenness(note, [] { device.note_off(1); }) < 0.2, "nor one let go");
  double bends[2];
  for (int pass = 0; pass < 2; ++pass) {  // and what is taken is not cut off
    fresh({{rw::kAttack, 0.02f}, {rw::kTilt, -0.6f}});
    for (int n = 0; n < 12; ++n) device.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n) / 12.0f), 0.6f);
    render(device, 0.5f, kRate);
    if (pass == 1) for (int n = 20; n < 23; ++n) device.note_on(n, 98.0f, 0.1f);
    const std::vector<float> x = render(device, 0.03f, kRate).left;
    bends[pass] = bend(x, 0, x.size());
  }
  EXPECT(bends[1] < 1.4 * bends[0], "a stolen key leaves no corner");
  for (int id = 0; id < rw::kNumParams; ++id) {
    for (int pass = 0; pass < 2; ++pass) {
      const float to = pass == 0 ? rw::kParamMax[id] : rw::kParamMin[id];
      const double sudden = suddenness(note, [&] { device.set_param(id, to); });
      if (sudden >= 0.2) std::printf("param %d to %g: %g\n", id, static_cast<double>(to), sudden);
      EXPECT(sudden < 0.2, "a knob or a choice that jumps does not click");
    }
  }
}

void test_sweeps() {
  for (int id = 0; id < rw::kNumParams; ++id) {
    device.init(kRate);
    for (int n = 0; n < 4; ++n) device.note_on(n, 98.0f * static_cast<float>(n + 1), 0.8f);
    double most = 0.0, fine = 1.0;
    for (int step = 0; step <= 60; ++step) {
      const float x = 0.5f - 0.5f * std::cos(static_cast<float>(step) * 0.21f);
      device.set_param(id, rw::kParamMin[id] + (rw::kParamMax[id] - rw::kParamMin[id]) * x);
      const Stereo s = render(device, 0.02f, kRate);
      if (!finite(s.left) || !finite(s.right)) fine = 0.0;
      most = std::max(most, std::max(peak(s.left), peak(s.right)));
    }
    EXPECT(fine == 1.0 && most < 1.01, "every knob can be swept while keys sound");
  }
}

void test_keys() {
  // One id at a pitch, at another, at the first again; then one note off.
  for (float gap : {0.01f, 0.5f}) {
    device.init(kRate);
    device.set_param(rw::kRelease, 1.0f);
    for (float hz : {220.0f, 330.0f, 220.0f}) played(hz, gap);
    device.note_off(1);
    render(device, 3.0f, kRate);
    EXPECT(peak(render(device, 0.3f, kRate).left) == 0.0, "A B A and one note off end in exact silence");
  }
  // Through a full pool of equal keys, the new one struck twice in one block.
  device.init(kRate);
  device.set_param(rw::kRelease, 0.5f);
  for (int n = 0; n < 12; ++n) device.note_on(n, 110.0f + 20.0f * static_cast<float>(n), 0.7f);
  render(device, 3.0f, kRate);
  device.note_on(40, 500.0f, 0.7f);
  device.note_on(40, 600.0f, 0.7f);
  render(device, 0.5f, kRate);
  for (int n = 0; n <= 40; ++n) device.note_off(n);
  render(device, 2.0f, kRate);
  EXPECT(peak(render(device, 0.3f, kRate).left) == 0.0, "a key struck twice in a steal leaves nothing behind");
  // Absurd notes.
  device.init(kRate);
  const float bad[] = {std::nanf(""), INFINITY, -INFINITY, 0.0f, 5.0f, 20000.0f, -3.0f};
  int id = 0;
  for (float hz : bad) for (float gain : {std::nanf(""), 0.0f, 2.0f, INFINITY}) device.note_on(id++ % 12, hz, gain);
  const Stereo s = render(device, 0.5f, kRate);
  EXPECT(finite(s.left) && finite(s.right) && peak(s.left) <= 1.0, "absurd notes are survived");
  // A knob moved in the silence has arrived at the next note.
  device.init(kRate);
  played(220.0f, 0.5f);
  device.note_off(1);
  render(device, 6.0f, kRate);
  device.set_param(rw::kVolume, -48.0f);
  device.note_on(1, 220.0f, 0.7f);
  EXPECT(peak(render(device, 0.05f, kRate).left) < 0.002, "a knob moved asleep does not glide under the next note");
}

void test_blocks() {
  std::vector<Stereo> runs;
  for (int block : {1, 128, 2048}) {
    device.init(kRate);
    device.set_param(rw::kRelease, 0.3f); device.set_param(rw::kClock, 2.0f);
    Stereo all;
    const float spans[] = {0.512f, 1.024f, 1.536f};
    for (int round = 0; round < 3; ++round) {
      device.note_on(1, 220.0f, 0.7f); device.note_on(2, 331.0f, 0.5f);
      device.set_param(rw::kThrow, 0.2f + 0.2f * static_cast<float>(round));
      all = concat(all, render(device, spans[round], kRate, block));
      device.note_off(1); device.note_off(2);
      all = concat(all, render(device, 2.048f, kRate, block));
    }
    runs.push_back(all);
  }
  EXPECT(runs[0].left == runs[1].left && runs[0].right == runs[1].right && runs[0].left == runs[2].left && runs[0].right == runs[2].right,
         "the same to the last bit in blocks of 1, 128 and 2048, across silences");
}

}  // namespace

int main() {
  Conformance spec;
  spec.name = "returning-wave";
  spec.num_params = rw::kNumParams;
  spec.mins = rw::kParamMin, spec.maxs = rw::kParamMax, spec.defaults = rw::kParamDefault;
  spec.tail_seconds = 6.0f, spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);
  for (auto test : {test_fractions, test_return, test_journey, test_choices, test_clean, test_image, test_readings, test_knobs,
                    test_levels, test_clicks, test_sweeps, test_keys, test_blocks}) test();
  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, static_cast<float>(n * 3) / 12.0f), 0.7f);
  report_cost("returning-wave", 10.0f, kRate, [] { render(device, 10.0f, kRate); });
  return finish("returning-wave");
}
