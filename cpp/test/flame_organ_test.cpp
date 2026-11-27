// Native harness for Flame Organ: conformance, then what the instrument
// claims: one lag gives one harmonic on every key, jumps land on harmonics, tubes and fuels are far apart, two flames lock or beat.

#include "../devices/flame-organ/flame_organ.h"
#include "support/test_kit.h"

using namespace testkit;
using namespace livemix::flame_organ;
using livemix::FlameOrgan;

static void say(bool ok, const char* words, double a = 0.0, double b = 0.0, double c = 0.0, double d = 0.0, double e = 0.0) {
  char said[160];
  std::snprintf(said, sizeof said, words, a, b, c, d, e);
  EXPECT(ok, said);
}

static FlameOrgan device;

struct Setting { int id; float value; };

// A quiet patch: nothing moves by itself, so what is measured is the law asked about.
static void plain(std::initializer_list<Setting> settings, float rate = 48000.0f) {
  device.init(rate);
  for (int id : {kFlicker, kDraught, kLift, kGlass, kSecondFlame}) device.set_param(id, 0.0f);
  device.set_param(kRoar, 0.05f);
  for (const Setting& s : settings) device.set_param(s.id, s.value);
}

static std::vector<float> mid(const Stereo& s) {
  std::vector<float> m(s.size());
  for (size_t i = 0; i < m.size(); ++i) m[i] = 0.5f * (s.left[i] + s.right[i]);
  return m;
}

static std::vector<float> note(std::initializer_list<Setting> settings, float hz, float seconds, float gain = 0.7f,
                               float rate = 48000.0f) {
  plain(settings, rate);
  device.note_on(1, hz, gain);
  return mid(render(device, seconds, rate));
}

static double harmonic(const std::vector<float>& x, double hz, int n, size_t from, double rate = 48000.0) { return db(tone_level(x, hz * n, rate, from)); }

// The loudest of the first eight harmonics.
static int loudest(const std::vector<float>& x, double hz, size_t from) {
  int best = 1;
  double most = -999.0;
  for (int n = 1; n <= 8; ++n) {
    const double level = harmonic(x, hz, n, from);
    if (level > most) most = level, best = n;
  }
  return best;
}

// The pitch of the line near `hz`, from how far its phase turns in a fifth of a second.
static double pitch_near(const std::vector<float>& x, double hz, size_t from, double rate = 48000.0) {
  const size_t n = static_cast<size_t>(0.4 * rate), gap = static_cast<size_t>(0.2 * rate);
  double phase[2];
  for (int w = 0; w < 2; ++w) {
    double re = 0.0, im = 0.0;
    const size_t at = from + gap * static_cast<size_t>(w);
    for (size_t i = 0; i < n && at + i < x.size(); ++i) {
      const double h = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n));
      const double p = 2.0 * kPi * hz * static_cast<double>(at + i) / rate;
      re += h * x[at + i] * std::cos(p);
      im -= h * x[at + i] * std::sin(p);
    }
    phase[w] = std::atan2(im, re);
  }
  return hz + std::remainder(phase[1] - phase[0], 2.0 * kPi) / (2.0 * kPi * 0.2);
}

static double cents(double hz, double of) { return 1200.0 * std::log2(hz / of); }
// Level in dB in eleven bands from 60 Hz to 12 kHz, of the whole, floored.
static std::vector<double> bands(const std::vector<float>& x, size_t from) {
  std::vector<double> out;
  double total = 1.0e-20;
  for (int b = 0; b < 11; ++b) {
    livemix::kit::Svf f;
    f.set(60.0f * std::pow(1.65f, static_cast<float>(b)), 3.0f, 48000.0f);
    livemix::kit::Svf g = f;
    double sum = 0.0;
    for (size_t i = from; i < x.size(); ++i) {
      const double y = g.bandpass(f.bandpass(x[i]));
      sum += y * y;
    }
    out.push_back(sum), total += sum;
  }
  for (double& v : out) v = std::max(-50.0, 10.0 * std::log10(v / total + 1.0e-9));
  return out;
}

static double apart(const std::vector<double>& a, const std::vector<double>& b) {
  double sum = 0.0;
  for (size_t i = 0; i < a.size(); ++i) sum += std::fabs(a[i] - b[i]);
  return sum / static_cast<double>(a.size());
}

// How far the level swings over windows of `seconds`, dB.
static double swing(const std::vector<float>& x, double from, double seconds, double rate = 48000.0) {
  const size_t w = static_cast<size_t>(seconds * rate);
  double low = 1.0e9, high = -1.0e9;
  for (size_t i = static_cast<size_t>(from * rate); i + w <= x.size(); i += w) {
    const double level = db(rms(x, i, i + w));
    low = std::min(low, level), high = std::max(high, level);
  }
  return high - low;
}

static double furthest(const std::vector<float>& a, const std::vector<float>& b) {
  double most = 0.0;
  for (size_t i = 0; i < a.size(); ++i) most = std::max(most, std::fabs(static_cast<double>(a[i]) - b[i]));
  return most;
}

// The largest bend in the wave: what a click is.
static double bend(const std::vector<float>& x, size_t from, size_t to) {
  double worst = 0.0;
  for (size_t i = std::max<size_t>(from, 2); i < std::min(to, x.size()); ++i)
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 2.0 * x[i - 1] + x[i - 2]));
  return worst;
}

static void check_modes() {
  // The lag is a share of the period: one setting gives one harmonic on every key.
  struct Case { float lag, place; int harmonic; };
  for (const Case& c : {Case{0.21f, 0.17f, 1}, Case{0.07f, 0.15f, 2}, Case{0.05f, 0.05f, 3}, Case{0.05f, 0.03f, 4}}) {
    for (float hz : {110.0f, 330.0f, 880.0f}) {
      const std::vector<float> x = note({{kLag, c.lag}, {kPlace, c.place}}, hz, 1.6f);
      const int n = loudest(x, hz, 38400);
      say(n == c.harmonic, "lag %.2f place %.2f sings harmonic %.0f on %.0f Hz (got %.0f)", c.lag, c.place, c.harmonic, hz, n);
    }
  }
  // Whatever Lag and Place say, what sings is a harmonic up to the fifth, in tune.
  for (float tube : {0.0f, 1.0f}) {
    for (float lag : {0.05f, 0.13f, 0.29f, 0.37f, 0.45f}) {
      for (float place : {0.03f, 0.11f, 0.28f, 0.45f}) {
        const std::vector<float> x = note({{kLag, lag}, {kPlace, place}, {kTube, tube}}, 220.0f, 1.8f);
        const int n = loudest(x, 220.0, 43200);
        const double off = cents(pitch_near(x, 220.0 * n, 43200), 220.0 * n);
        say(n <= 5 && harmonic(x, 220.0, n, 43200) > -45.0 && std::fabs(off) < 3.0,
            "tube %.0f lag %.2f place %.2f: harmonic %.0f, %.1f cents", tube, lag, place, n, off);
      }
    }
  }
  // Moved while it sounds, the note jumps from its first harmonic to its second.
  const std::vector<float> before = note({}, 220.0f, 1.5f);
  device.set_param(kLag, 0.07f), device.set_param(kPlace, 0.14f);
  const std::vector<float> after = mid(render(device, 2.5f, 48000.0f));
  EXPECT(loudest(before, 220.0, 24000) == 1 && loudest(after, 220.0, 72000) == 2, "Lag moves a held note to its octave");
}

// How far a wave is from itself some samples on, dB of the whole.
static double unlike(const std::vector<float>& x, size_t gap, size_t from) {
  double all = 1.0e-20, off = 0.0;
  for (size_t i = from; i < x.size(); ++i) {
    all += static_cast<double>(x[i]) * x[i];
    off += std::pow(static_cast<double>(x[i]) - x[i - gap], 2.0);
  }
  return 10.0 * std::log10(off / all + 1.0e-12);
}

static void check_purity() {
  // With nothing asked to shake it, a note repeats and is steady, whatever burns and however tall.
  for (int kind = 0; kind < 3 * kTubes; ++kind) {
    for (float flame : {0.45f, 0.9f, 1.0f}) {
      const bool corner = flame == 0.9f;  // where the most harmonics are fed at once
      const float fuel = 1.0f * (kind / kTubes), tube = 1.0f * (kind % kTubes);
      const std::vector<float> x = note({{kFuel, fuel}, {kTube, tube}, {kFlame, flame}, {kRoar, 0.0f}, {kCatch, 0.1f},
                                         {kLag, corner ? 0.08f : 0.21f}, {kPlace, corner ? 0.06f : 0.17f}}, 200.0f, 2.0f);
      const double off = unlike(x, 480, 48000), moves = swing(x, 1.0, 0.04);
      say(off < (corner ? -20.0 : -14.0) && moves < 2.5, "fuel %.0f tube %.0f flame %.2f: %.1f dB shaken, moves %.1f dB", fuel, tube, flame, off, moves);
    }
  }
  // The hardest pulses of the highest key do not fold back.
  for (int tube : {0, 2}) {
    const std::vector<float> x = note({{kTube, 1.0f * tube}, {kFlame, 1.0f}, {kMouth, 0.9f}, {kRoar, 0.0f}}, 4186.0f, 3.0f);
    double on = 0.0;
    for (int n = 1; n <= 5; ++n) on += 0.5 * std::pow(tone_level(x, 4186.0 * n, 48000.0, 48000), 2.0);
    const double all = std::pow(rms(x, 48000), 2.0), back = 10.0 * std::log10(std::max(all - on, 1.0e-9 * all) / all);
    say(back < (tube == 0 ? -46.0 : -32.0), "tube %.0f folds back %.1f dB on the top C", tube, back);
  }
  // Level: tube, fuel, lag and place are colours. None is silent and none shouts.
  for (int kind = 0; kind < kFuels * kTubes; ++kind) {
    const float fuel = 1.0f * (kind / kTubes), tube = 1.0f * (kind % kTubes);
    for (int corner = 0; corner < 5; ++corner) {
      const float lag = corner == 4 ? 0.21f : corner & 1 ? 0.43f : 0.08f, place = corner == 4 ? 0.17f : corner & 2 ? 0.42f : 0.06f;
      plain({{kTube, tube}, {kFuel, fuel}, {kLag, lag}, {kPlace, place}, {kCatch, 0.05f}});
      for (int k = 0; k < 3; ++k) device.note_on(k, 147.0f * std::pow(1.5f, 1.0f * k), 0.7f);
      const double level = db(rms(mid(render(device, 1.2f, 48000.0f)), 24000));
      say(level > -47.0 && level < -17.0, "tube %.0f fuel %.0f lag %.2f place %.2f is heard (%.1f dB)", tube, fuel, lag, place, level);
    }
  }
  // A device that has been another instrument, with all its keys down, is the same after init.
  const std::vector<float> one = note({}, 220.0f, 0.5f);
  for (int i = 0; i < 10; ++i) device.note_on(i, 150.0f + 40.0f * i, 1.0f);
  for (int p = 0; p < kNumParams; ++p) device.set_param(p, p & 1 ? kParamMax[p] : kParamMin[p]);
  render(device, 0.5f, 48000.0f);
  EXPECT(note({}, 220.0f, 0.5f) == one, "init forgets what the knobs were");
}

static void check_tuning() {
  for (int kind = 0; kind < kFuels * kTubes; ++kind) {
    const int fuel = kind / kTubes, tube = kind % kTubes;
    for (float hz : {130.81f, 880.0f}) {
      const std::vector<float> x = note({{kFuel, 1.0f * fuel}, {kTube, 1.0f * tube}}, hz, 2.6f);
      // The octave tells the cents of a low key more finely, where the tube has one.
      const int m = hz < 200.0f && tube != 1 && tube != 3 ? 2 : 1;
      const double off = cents(pitch_near(x, hz * m, 48000), hz * m);
      say(std::fabs(off) < 3.0, "fuel %.0f tube %.0f at %.0f Hz is %.1f cents off", fuel, tube, hz, off);
    }
  }
}

static void check_characters() {
  for (int knob : {static_cast<int>(kTube), static_cast<int>(kFuel)}) {
    std::vector<std::vector<double>> set;
    for (int c = 0; c < (knob == kTube ? kTubes : kFuels); ++c)
      set.push_back(bands(note({{knob, static_cast<float>(c)}, {kRoar, 0.25f}}, 174.6f, 2.0f), 24000));
    for (size_t i = 1; i < set.size(); ++i) {
      for (size_t j = 0; j < i; ++j) {
        const double far = apart(set[i], set[j]);
        say(far > 4.0, knob == kTube ? "tubes %.0f and %.0f are %.1f dB apart" : "fuels %.0f and %.0f are %.1f dB apart", i, j, far);
      }
    }
  }
  const std::vector<float> half = note({{kTube, 1.0f}}, 220.0f, 2.0f);
  EXPECT(harmonic(half, 220.0, 1, 48000) - harmonic(half, 220.0, 2, 48000) > 20.0, "a half closed tube has no second harmonic");
  const std::vector<float> open = note({}, 220.0f, 2.0f);
  EXPECT(harmonic(open, 220.0, 1, 48000) - harmonic(open, 220.0, 2, 48000) < 14.0, "an open one has");
  const std::vector<float> twin = note({{kTube, 4.0f}}, 220.0f, 2.0f);
  EXPECT(db(tone_level(twin, 110.0, 48000.0, 48000)) > harmonic(twin, 220.0, 1, 48000) - 8.0, "a double tube sounds an octave below");
  const std::vector<float> coal = note({{kFuel, 3.0f}, {kFlicker, 0.6f}}, 220.0f, 3.0f);
  double rough[2] = {0.0, 0.0}, *into = rough;
  for (const std::vector<float>* x : {&coal, &open}) {
    std::vector<float> high(x->size());
    livemix::kit::Svf f;
    f.set(5000.0f, 0.7f, 48000.0f);
    for (size_t i = 0; i < x->size(); ++i) high[i] = f.highpass((*x)[i]);
    *into++ = peak(high, 24000) / std::max(1.0e-9, rms(high, 24000));
  }
  EXPECT(rough[0] > 1.5 * rough[1], "coal crackles");
}

static void check_two_flames() {
  const std::vector<float> lone = note({{kBetween, 0.8f}}, 220.0f, 4.0f);
  const std::vector<float> lock = note({{kSecondFlame, 1.0f}, {kBetween, 0.05f}}, 220.0f, 4.0f);
  const std::vector<float> beat = note({{kSecondFlame, 1.0f}, {kBetween, 0.8f}}, 220.0f, 4.0f);
  EXPECT(swing(lone, 1.5, 0.05) < 1.0, "one flame is steady");
  EXPECT(swing(lock, 1.5, 0.05) < 1.5, "two flames close together lock");
  EXPECT(swing(beat, 1.5, 0.02) > 6.0, "two flames far apart beat");
  EXPECT_NEAR(db(rms(lock, 96000)), db(rms(lone, 96000)), 4.0, "locked flames are about as loud as one");
  EXPECT_NEAR(cents(pitch_near(lock, 220.0, 96000), 220.0), 0.0, 3.0, "locked flames are in tune");
  // Two lines, a beat apart, and the middle of them on the key.
  double low = 0.0, high = 0.0, most_low = 0.0, most_high = 0.0;
  for (double d = 0.6; d < 6.0; d += 0.1) {
    const double a = tone_level(beat, 220.0 - d, 48000.0, 72000), b = tone_level(beat, 220.0 + d, 48000.0, 72000);
    if (a > most_low) most_low = a, low = 220.0 - d;
    if (b > most_high) most_high = b, high = 220.0 + d;
  }
  EXPECT(high - low > 2.5 && high - low < 9.0, "they beat a few times a second");
  EXPECT_NEAR(cents(0.5 * (low + high), 220.0), 0.0, 4.0, "around the key");
  // Between lock and free beat they slip: slower than the two alone would.
  const std::vector<float> slip = note({{kSecondFlame, 1.0f}, {kBetween, 0.45f}}, 220.0f, 5.0f);
  EXPECT(swing(slip, 1.5, 0.05) > 3.0, "in between they slip");
}

static void check_gestures() {
  // Catch: how long until it is within 6 dB of where it goes.
  double last = -1.0;
  for (float seconds : {0.03f, 0.4f, 2.5f}) {
    const std::vector<float> x = note({{kCatch, seconds}}, 220.0f, 8.0f);
    const double full = rms(x, 48000 * 7);
    size_t i = 0;
    while (i + 480 < x.size() && rms(x, i, i + 480) < 0.5 * full) i += 480;
    const double at = static_cast<double>(i) / 48000.0;
    say(at > last * 1.5 && at < seconds * 2.0 + 0.1, "Catch %.2f s: it speaks after %.2f s", seconds, at);
    last = std::max(at, 0.01);
  }
  // Burn: a held flame runs out, and a held one at the top does not.
  const std::vector<float> brief = note({{kBurn, 1.0f}, {kCatch, 0.03f}}, 220.0f, 3.0f);
  EXPECT(rms(brief, 96000, 120000) < 0.003 * rms(brief, 2400, 9600), "a flame burns out");
  const std::vector<float> held = note({}, 220.0f, 12.0f);
  EXPECT_NEAR(db(rms(held, 48000 * 11)) - db(rms(held, 96000, 144000)), 0.0, 1.0, "a full one burns on");
  // Embers: the tail's length, and it ends in silence.
  for (float seconds : {0.5f, 3.0f}) {
    plain({{kEmbers, seconds}});
    device.note_on(1, 220.0f, 0.7f);
    render(device, 1.5f, 48000.0f);
    device.note_off(1);
    const std::vector<float> tail = mid(render(device, seconds * 2.0f + 1.0f, 48000.0f));
    EXPECT_NEAR(rt60(tail, 48000.0, 0.05, 0.05), seconds, seconds * 0.35, "Embers is the length of the tail");
    EXPECT(peak(tail, tail.size() - 4800) == 0.0, "and the tail ends");
  }
  // Lift: none stays, all goes up.
  const std::vector<float> down = note({{kLift, 0.0f}}, 220.0f, 4.0f), up = note({{kLift, 1.0f}}, 220.0f, 4.0f);
  EXPECT(loudest(down, 220.0, 96000) == 1 && loudest(up, 220.0, 96000) == 2, "Lift takes the note to its octave");
  EXPECT(harmonic(up, 220.0, 2, 96000) - harmonic(up, 220.0, 1, 96000) > 10.0, "and leaves the first harmonic");
  // Flame and velocity: more of the upper harmonics.
  const std::vector<float> small = note({{kFlame, 0.1f}}, 220.0f, 2.0f), tall = note({{kFlame, 1.0f}}, 220.0f, 2.0f);
  EXPECT(energy_above(tall, 1500.0, 48000.0, 48000) > 2.0 * energy_above(small, 1500.0, 48000.0, 48000), "a tall flame is brighter");
  const std::vector<float> soft = note({{kRoar, 0.0f}}, 220.0f, 2.0f, 0.2f), hard = note({{kRoar, 0.0f}}, 220.0f, 2.0f, 1.0f);
  EXPECT(energy_above(hard, 1500.0, 48000.0, 48000) > 1.3 * energy_above(soft, 1500.0, 48000.0, 48000), "a hard key too");
  EXPECT(rms(hard, 48000) > 2.0 * rms(soft, 48000), "and louder");
  // Glass: its second ring is no harmonic, so only the tap is in it.
  const std::vector<float> tap = note({{kGlass, 1.0f}, {kTube, 1.0f}, {kCatch, 1.0f}}, 220.0f, 4.0f);
  EXPECT(db(tone_level(tap, 1244.5, 48000.0, 0, 12000)) - db(tone_level(tap, 1244.5, 48000.0, 144000)) > 20.0, "the glass rings and fades");
  // Roar: what lies between the harmonics.
  const std::vector<float> still = note({{kRoar, 0.0f}}, 220.0f, 2.0f), roar = note({{kRoar, 1.0f}}, 220.0f, 2.0f);
  double gap[2] = {0.0, 0.0};
  for (double hz : {2530.0, 2970.0, 3410.0}) gap[0] += tone_level(still, hz, 48000.0, 48000), gap[1] += tone_level(roar, hz, 48000.0, 48000);
  EXPECT(gap[1] > 10.0 * gap[0], "Roar is heard between the harmonics");
  EXPECT(loudest(roar, 220.0, 48000) == 1, "and the note still sings in it");
  // Flicker and Draught move the level; the second moves all keys together.
  EXPECT(swing(note({{kFlicker, 1.0f}}, 220.0f, 5.0f), 1.0, 0.1) > 8.0, "a flame flickers");
  plain({{kDraught, 1.0f}, {kWidth, 1.0f}});
  device.note_on(1, 220.0f, 0.7f), device.note_on(2, 331.0f, 0.7f);
  const std::vector<float> gust = mid(render(device, 8.0f, 48000.0f));
  std::vector<float> a, b;
  for (size_t i = 24000; i + 9600 <= gust.size(); i += 9600) {
    a.push_back(static_cast<float>(db(tone_level(gust, 220.0, 48000.0, i, i + 9600))));
    b.push_back(static_cast<float>(db(tone_level(gust, 331.0, 48000.0, i, i + 9600))));
  }
  const float ma = static_cast<float>(mean(a)), mb = static_cast<float>(mean(b));
  for (size_t i = 0; i < a.size(); ++i) a[i] -= ma, b[i] -= mb;
  EXPECT(correlation(a, b) > 0.6, "a draught moves all keys together");
}

static void check_levels() {
  double low = 99.0, high = -99.0;
  for (float hz : {65.41f, 130.81f, 261.63f, 523.25f, 1046.5f}) {
    device.init(48000.0f);
    device.note_on(1, hz, 0.7f);
    const Stereo s = render(device, 4.0f, 48000.0f);
    const double top = db(std::max(peak(s.left), peak(s.right))), level = db(rms(s.left, 48000));
    EXPECT(top > -24.0 && top < -10.0, "one note peaks between -24 and -10 dBFS");
    low = std::min(low, level), high = std::max(high, level);
  }
  EXPECT(high - low < 5.0, "level is even from C2 to C6");
  for (int patch = 0; patch < 4; ++patch) {  // the default, a horn, coal in two pipes, a tap
    device.init(48000.0f);
    if (patch > 0) device.set_param(kTube, patch == 1 ? 2.0f : patch == 2 ? 4.0f : 0.0f);
    if (patch == 2) device.set_param(kFuel, 3.0f);
    if (patch == 3) device.set_param(kCatch, 0.03f);
    for (int i = 0; i < 10; ++i) device.note_on(i, 98.0f * std::pow(2.0f, static_cast<float>(i) * 5.0f / 12.0f), 1.0f);
    const Stereo ten = render(device, 5.0f, 48000.0f);
    say(peak(ten.left) < 0.5 && peak(ten.right) < 0.5, "patch %.0f: ten keys stay under the knee (%.2f)", patch, peak(ten.left));
  }
  const auto spread = [](float width) {
    device.init(48000.0f), device.set_param(kWidth, width), device.note_on(1, 220.0f, 0.7f);
    return render(device, 3.0f, 48000.0f);
  };
  const Stereo narrow = spread(0.0f), wide = spread(kParamDefault[kWidth]);
  EXPECT(narrow.left == narrow.right, "Width 0 is mono");
  EXPECT(correlation(wide.left, wide.right, 48000) < 0.995, "the default is stereo");
  EXPECT(rms(mid(wide), 48000) > 0.7 * rms(wide.left, 48000), "and folds down");
  // Other rates: the same sound.
  for (float rate : {44100.0f, 96000.0f}) {
    const std::vector<float> ref = note({{kRoar, 0.8f}}, 220.0f, 3.0f), x = note({{kRoar, 0.8f}}, 220.0f, 3.0f, 0.7f, rate);
    EXPECT_NEAR(db(rms(x, static_cast<size_t>(rate))), db(rms(ref, 48000)), 1.5, "the level is the same at another rate");
    const std::vector<float> c = note({}, 220.0f, 3.0f), y = note({}, 220.0f, 3.0f, 0.7f, rate);
    for (int n : {1, 2, 4})  // the third is in a hollow of Place
      EXPECT_NEAR(harmonic(y, 220.0, n, static_cast<size_t>(rate), rate), harmonic(c, 220.0, n, 48000), 2.5, "and the harmonics");
  }
}

static void fifth() { device.note_on(1, 110.0f, 0.8f), device.note_on(2, 164.8f, 0.8f); }

static void check_faults() {
  // Every knob jumped while a chord sounds: no bend beyond what the sound has.
  for (int p = 0; p < kNumParams - 1; ++p) {
    for (int dir = 0; dir < 2; ++dir) {
      plain({{kRoar, 0.0f}});
      device.set_param(p, dir ? kParamMin[p] : kParamMax[p]);
      fifth();
      Stereo s = render(device, 0.8f, 48000.0f);
      device.set_param(p, dir ? kParamMax[p] : kParamMin[p]);
      s = concat(s, render(device, 0.8f, 48000.0f));
      const double reference = std::max(bend(s.left, 14400, 38000), bend(s.left, 57600, 76800)), jump = bend(s.left, 38000, 48000);
      say(jump < 2.0 * reference + 0.004 && finite(s.left) && peak(s.left) < 1.0,
          "param %.0f jumped, up %.0f, does not click (%.4f against %.4f)", p, dir, jump, reference);
    }
  }
  // The flame's eye turns, it does not jump: another harmonic is handed the note without a click.
  plain({{kRoar, 0.0f}, {kFuel, 2.0f}, {kFlame, 0.8f}, {kLag, 0.06f}});
  fifth();
  Stereo held = render(device, 1.2f, 48000.0f);
  device.set_param(kLag, 0.4f);
  held = concat(held, render(device, 0.2f, 48000.0f));
  say(bend(held.left, 57600, 67200) < 5.0 * bend(held.left, 33600, 57000), "Lag jumped on Spirit: %.4f", bend(held.left, 57600, 67200));
  // Restrikes and steals.
  plain({{kRoar, 0.0f}, {kCatch, 0.5f}});
  for (int i = 0; i < 12; ++i) device.note_on(i, 110.0f + 7.0f * static_cast<float>(i), 0.8f);
  Stereo full = render(device, 2.0f, 48000.0f);
  const double calm = bend(full.left, 48000, 96000);
  device.note_on(50, 220.0f, 0.8f), device.note_on(3, 131.0f, 0.8f);
  Stereo taken = render(device, 0.3f, 48000.0f);
  EXPECT(bend(taken.left, 0, 14400) < 2.0 * calm + 0.003, "a steal and a restrike do not click");
  // One id at A, at B, at A again, then off: nothing is left sounding. Nor of a key struck twice while what it stole still fades.
  for (int keys : {0, 12}) {
    device.init(48000.0f);
    device.set_param(kEmbers, 0.1f);
    for (int i = 0; i < keys; ++i) device.note_on(i, 110.0f + 9.0f * static_cast<float>(i), 0.8f);
    render(device, 0.4f, 48000.0f);
    for (float hz : {220.0f, 330.0f, 220.0f}) device.note_on(40, hz, 0.8f), render(device, keys ? 0.0f : 0.05f, 48000.0f);
    for (int i = 0; i < 41; ++i) device.note_off(i);
    render(device, 1.5f, 48000.0f);
    EXPECT(peak(render(device, 0.2f, 48000.0f).left) == 0.0, "nothing is stuck after A-B-A or a steal");
  }
  // Block sizes 1, 128 and 2048 across a silence.
  std::vector<std::vector<float>> runs;
  for (int block : {1, 128, 2048}) {
    device.init(48000.0f);
    device.set_param(kEmbers, 0.1f);
    std::vector<float> all;
    for (float hz : {220.0f, 277.2f}) {
      device.note_on(1, hz, 0.8f);
      const Stereo a = render(device, 24576.0f / 48000.0f, 48000.0f, block);
      device.note_off(1);
      const Stereo b = render(device, 49152.0f / 48000.0f, 48000.0f, block);
      if (hz < 250.0f) device.set_param(kMouth, 0.9f);  // moved in the silence
      for (const Stereo* part : {&a, &b}) all.insert(all.end(), part->left.begin(), part->left.end());
    }
    runs.push_back(all);
  }
  EXPECT(std::max(furthest(runs[0], runs[1]), furthest(runs[2], runs[1])) < 2.0e-6, "block size does not matter across a silence");
  // Set in the silence is set from the first sample: as a device told before.
  std::vector<float> told[2];
  for (int late = 0; late < 2; ++late) {
    device.init(48000.0f);
    if (late) render(device, 0.2f, 48000.0f);
    for (int p : {kFlame, kPlace, kMouth, kWidth, kVolume}) device.set_param(p, kParamMin[p] + 0.7f * (kParamMax[p] - kParamMin[p]));
    device.note_on(1, 220.0f, 0.8f);
    told[late] = render(device, 0.5f, 48000.0f).left;
  }
  EXPECT(furthest(told[0], told[1]) < 1.0e-6, "knobs moved asleep have arrived");
}

int main() {
  Conformance spec;
  spec.name = "flame-organ", spec.num_params = kNumParams, spec.mins = kParamMin, spec.maxs = kParamMax, spec.defaults = kParamDefault;
  spec.tail_seconds = 4.5f, spec.max_peak = 1.01f;
  check_instrument(device, spec, 48000.0f);
  for (auto check : {check_modes, check_purity, check_tuning, check_characters, check_two_flames, check_gestures, check_levels, check_faults}) check();
  device.init(48000.0f);
  for (int i = 0; i < 8; ++i) device.note_on(i, 110.0f * std::pow(2.0f, static_cast<float>(i) / 4.0f), 0.7f);
  report_cost("flame-organ, eight keys", 5.0f, 48000.0f, [] { render(device, 5.0f, 48000.0f); });
  return finish("flame-organ");
}
