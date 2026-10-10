// Native harness for Murmuration (cpp/devices/murmuration). The conformance
// pass covers stability, silence when idle, block-size independence on
// steady input and parameter abuse; the rest asserts what makes it a flock:
// where the birds are (flock.h) is what is heard, as delay, bend in pitch,
// level, tone and side.

#include "../devices/murmuration/murmuration.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Murmuration;
namespace p = livemix::murmuration;
namespace flock = livemix::flock;

static Murmuration device;
static Murmuration other;

static const float kRate = 48000.0f;

struct Settings {
  float birds = 8.0f, range = 10.0f, speed = 1.0f, together = 0.6f, turns = 0.3f;
  float air = 0.5f, spread = 0.8f, lift = 0.3f, ground = 200.0f, mix = 0.4f;
};

static void set(Murmuration& d, const Settings& s) {
  d.set_param(p::kBirds, s.birds);
  d.set_param(p::kRange, s.range);
  d.set_param(p::kSpeed, s.speed);
  d.set_param(p::kTogether, s.together);
  d.set_param(p::kTurns, s.turns);
  d.set_param(p::kAir, s.air);
  d.set_param(p::kSpread, s.spread);
  d.set_param(p::kLift, s.lift);
  d.set_param(p::kGround, s.ground);
  d.set_param(p::kMix, s.mix);
}

static void start(Murmuration& d, const Settings& s, float rate = kRate) {
  d.init(rate);
  set(d, s);
}

// The birds alone, each as clear and as loud as the next, in the middle, and
// nothing kept on the ground.
static Settings bare() {
  Settings s;
  s.ground = p::kParamMin[p::kGround];
  s.air = 0.0f;
  s.lift = 0.0f;
  s.spread = 0.0f;
  s.turns = 0.0f;
  s.mix = 1.0f;
  return s;
}

// The flight time at sample `n` of a device that has run since init.
static double flight_at(double n, const Settings& s, float rate = kRate) {
  return n * static_cast<double>(flock::flight_rate(s.speed, s.range)) / rate;
}

static flock::Place place_at(int bird, double n, const Settings& s, float rate = kRate) {
  const double tau = flight_at(n, s, rate);
  return flock::place(bird, tau, flock::flight(tau, s.together, s.turns));
}

// A bird's delay in samples, read at sample `n`.
static double delay_at(int bird, double n, const Settings& s, float rate = kRate) {
  return static_cast<double>(flock::delay_seconds(s.range, place_at(bird, n, s, rate).u)) * rate;
}

// When an impulse sent at sample `at` comes back from a bird: n = at + delay(n).
static double return_of(int bird, double at, const Settings& s) {
  double n = at;
  for (int pass = 0; pass < 6; ++pass) n = at + delay_at(bird, n, s);
  return n;
}

// The returns of an impulse: runs of samples over `floor`, each with the
// energy-weighted middle of its samples and what it carries on each side.
struct Return {
  double at;
  double left;
  double right;
};

static std::vector<Return> returns_in(const Stereo& out, size_t from, double floor) {
  std::vector<Return> found;
  size_t i = from;
  while (i < out.size()) {
    if (std::fabs(out.left[i]) + std::fabs(out.right[i]) < floor) {
      ++i;
      continue;
    }
    // One return is an interpolation kernel a few samples long (and the tail of its one-pole).
    size_t end = i;
    for (size_t k = i; k < out.size() && k < end + 4; ++k) {
      if (std::fabs(out.left[k]) + std::fabs(out.right[k]) >= floor) end = k;
    }
    double weight = 0.0, moment = 0.0, left = 0.0, right = 0.0;
    for (size_t k = i > 2 ? i - 2 : 0; k <= end + 2 && k < out.size(); ++k) {
      const double e = static_cast<double>(out.left[k]) * out.left[k] +
                       static_cast<double>(out.right[k]) * out.right[k];
      weight += e;
      moment += e * static_cast<double>(k);
      left += out.left[k];
      right += out.right[k];
    }
    found.push_back({moment / weight, left, right});
    i = end + 3;
  }
  return found;
}

// A sine's frequency over time, as its deviation from `hz` in Hz, one value
// per sample: the turn of its phase against a steady `hz`, averaged over two
// whole cycles (which is blind to the image at twice `hz`).
static std::vector<double> deviation_hz(const std::vector<float>& x, double hz, double rate) {
  const size_t span = static_cast<size_t>(std::llround(2.0 * rate / hz));
  std::vector<double> re(x.size() + 1, 0.0), im(x.size() + 1, 0.0);
  for (size_t i = 0; i < x.size(); ++i) {
    const double w = 2.0 * kPi * hz * static_cast<double>(i) / rate;
    re[i + 1] = re[i] + x[i] * std::cos(w);
    im[i + 1] = im[i] - x[i] * std::sin(w);
  }
  std::vector<double> phase(x.size(), 0.0);
  for (size_t i = span; i < x.size(); ++i) {
    phase[i] = std::atan2(im[i] - im[i - span], re[i] - re[i - span]);
  }
  const size_t step = 240;
  std::vector<double> out(x.size(), 0.0);
  for (size_t i = span + step; i + step < x.size(); ++i) {
    double turn = phase[i + step] - phase[i - step];
    while (turn > kPi) turn -= 2.0 * kPi;
    while (turn < -kPi) turn += 2.0 * kPi;
    out[i] = turn * rate / (2.0 * kPi * 2.0 * static_cast<double>(step));
  }
  return out;
}

static double power(const Stereo& s, size_t from, size_t to) {
  const double l = rms(s.left, from, to), r = rms(s.right, from, to);
  return l * l + r * r;
}

// Noise between two frequencies, by four one-pole cuts each way.
static std::vector<float> band_noise(float seconds, float lo, float hi, float gain) {
  std::vector<float> x = noise(seconds, kRate, 1.0f);
  for (int pass = 0; pass < 4; ++pass) {
    const double a = std::exp(-2.0 * kPi * hi / kRate), b = std::exp(-2.0 * kPi * lo / kRate);
    double low = 0.0, slow = 0.0;
    for (float& v : x) {
      low = v + (low - v) * a;
      slow = low + (slow - low) * b;
      v = static_cast<float>(low - slow);
    }
  }
  const double level = rms(x);
  for (float& v : x) v = static_cast<float>(v * gain / level);
  return x;
}

static double worst_difference(const Stereo& a, const Stereo& b, size_t from = 0) {
  double worst = 0.0;
  for (size_t i = from; i < a.size() && i < b.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

// --- The flight itself ------------------------------------------------------

static void test_flight() {
  livemix::kit::SineTable::init();
  double fastest = 0.0, nearest = 9.0;
  bool inside = true;
  for (float together : {0.0f, 0.6f, 1.0f}) {
    for (float turns : {0.0f, 0.3f, 1.0f}) {
      flock::Place last[flock::kMaxBirds];
      const double dt = 0.01;
      for (double tau = 0.0; tau < flock::kPeriod; tau += dt) {
        const flock::Flight f = flock::flight(tau, together, turns);
        flock::Place now[flock::kMaxBirds];
        for (int b = 0; b < flock::kMaxBirds; ++b) {
          now[b] = flock::place(b, tau, f);
          inside = inside && now[b].u >= 0.0f && now[b].u <= 1.0f && now[b].v >= -1.0f &&
                   now[b].v <= 1.0f && now[b].h >= 0.0f && now[b].h <= 1.0f;
          if (tau > 0.0) fastest = std::max(fastest, std::fabs(now[b].u - last[b].u) / dt);
        }
        for (int a = 0; a < flock::kMaxBirds; ++a) {
          for (int b = a + 1; b < flock::kMaxBirds; ++b) {
            // In the flock's own measure: 1 is its half-size.
            const double du = 2.0 * (now[a].u - now[b].u) / f.size;
            const double dv = (now[a].v - now[b].v) / f.size;
            nearest = std::min(nearest, std::sqrt(du * du + dv * dv));
          }
        }
        for (int b = 0; b < flock::kMaxBirds; ++b) last[b] = now[b];
      }
    }
  }
  EXPECT(inside, "every bird stays inside the range, between the sides, at every moment");
  EXPECT(fastest <= flock::kMaxDepthRate, "no bird's depth changes faster than kMaxDepthRate");
  EXPECT(fastest > 0.3 * flock::kMaxDepthRate, "kMaxDepthRate is within three times the fastest");
  EXPECT(nearest > 0.03, "no two birds ever fly in the same place");
  std::printf("flight: fastest change of depth %.3f per second of flight (bound %.2f), two birds "
              "never nearer than %.3f of the flock's half-size\n",
              fastest, flock::kMaxDepthRate, nearest);
  // The whole flight comes round at kPeriod, so the flight time may wrap there.
  double seam = 0.0;
  for (int b = 0; b < flock::kMaxBirds; ++b) {
    const flock::Place a = flock::place(b, 3.25, flock::flight(3.25, 0.4f, 1.0f));
    const flock::Place z = flock::place(b, 3.25 + flock::kPeriod,
                                        flock::flight(3.25 + flock::kPeriod, 0.4f, 1.0f));
    const flock::Place n = flock::place(b, 3.25 - flock::kPeriod,
                                        flock::flight(3.25 - flock::kPeriod, 0.4f, 1.0f));
    for (double d : {a.u - z.u, a.v - z.v, a.h - z.h, a.u - n.u, a.v - n.v}) {
      seam = std::max(seam, std::fabs(d));
    }
  }
  EXPECT(seam < 1.0e-4, "the flight repeats after kPeriod");
  // A wheel: in a slot Turns picks, the flock is under half its size at the middle.
  int slot = 0;
  while (flock::chance(slot, 0x51u) > 0.2f) ++slot;
  const double middle = (slot + 0.5) * flock::kSlotSeconds;
  const flock::Flight calm = flock::flight(middle, 0.5f, 0.0f);
  const flock::Flight wheeling = flock::flight(middle, 0.5f, 1.0f);
  EXPECT_NEAR(wheeling.size / calm.size, 1.0f - flock::kBunch, 0.01, "a wheel bunches the flock");
  EXPECT_NEAR(std::fabs(wheeling.twist - calm.twist), flock::kSwing, 0.01,
              "a wheel swings the formation half a turn round");
  const flock::Flight edge = flock::flight(slot * flock::kSlotSeconds + 1.0e-4, 0.5f, 1.0f);
  const flock::Flight plain = flock::flight(slot * flock::kSlotSeconds + 1.0e-4, 0.5f, 0.0f);
  EXPECT(std::fabs(edge.u - plain.u) < 1.0e-3 && std::fabs(edge.size - plain.size) < 1.0e-3,
         "a wheel starts and ends on the flock's own path");
}

// --- An impulse comes back once from every bird -----------------------------

static void test_returns() {
  for (int birds : {1, 3, 8, 16}) {
    Settings s = bare();
    s.birds = static_cast<float>(birds);
    s.together = 0.0f;
    s.speed = 0.05f;
    s.range = 60.0f;  // far enough apart that no two of eight returns touch
    start(device, s);
    Stereo out = run(device, impulse(0.25f, kRate, 0.5f));
    // What the flight says: one return per bird, those under six samples apart read as one.
    std::vector<double> expected;
    for (int b = 0; b < birds; ++b) expected.push_back(return_of(b, 0.0, s));
    std::sort(expected.begin(), expected.end());
    std::vector<double> groups;
    for (double at : expected) {
      if (groups.empty() || at - groups.back() > 8.0) groups.push_back(at);
    }
    const double floor = 0.02 / std::sqrt(static_cast<double>(birds));
    std::vector<Return> found = returns_in(out, 1, floor);
    char label[160];
    std::snprintf(label, sizeof label, "%d birds: an impulse returns %zu times, heard %zu", birds,
                  groups.size(), found.size());
    EXPECT(found.size() == groups.size(), label);
    const double near = flock::near_metres(s.range) / flock::kSoundSpeed * kRate;
    const double far = s.range / flock::kSoundSpeed * kRate;
    bool inside = true;
    for (const Return& r : found) inside = inside && r.at >= near - 2.0 && r.at <= far + 2.0;
    std::snprintf(label, sizeof label, "%d birds: every return lies inside Range", birds);
    EXPECT(inside, label);
    if (birds <= 8) {
      std::snprintf(label, sizeof label, "%d birds: no two returns touch", birds);
      EXPECT(found.size() == expected.size(), label);
    }
    if (birds <= 8 && found.size() == expected.size()) {
      double worst = 0.0;
      for (size_t i = 0; i < found.size(); ++i) {
        worst = std::max(worst, std::fabs(found[i].at - expected[i]));
      }
      std::snprintf(label, sizeof label,
                    "%d birds: each return is where the flight has its bird (worst %.2f samples)",
                    birds, worst);
      EXPECT(worst < 1.5, label);
    }
  }

  // One bird in a flock held together is one delayed copy, as loud as the voice.
  {
    Settings s = bare();
    s.birds = 1.0f;
    s.together = 1.0f;
    start(device, s);
    Stereo out = run(device, impulse(0.25f, kRate, 0.5f));
    std::vector<Return> found = returns_in(out, 1, 0.02);
    EXPECT(found.size() == 1, "one bird, held together: one return");
    if (found.size() == 1) {
      EXPECT_NEAR(found[0].at, return_of(0, 0.0, s), 1.0, "one bird: at the bird's own delay");
      // The whole of the impulse, split evenly between the sides.
      EXPECT_NEAR(found[0].left, 0.5, 0.01, "one bird: the whole impulse returns on each side");
    }
    start(device, s);
    std::vector<float> tone = sine(220.0f, 2.0f, kRate, 0.25f);
    Stereo held = run(device, tone);
    const double level = db(std::sqrt(power(held, 24000, 96000) / 2.0) / rms(tone));
    EXPECT_NEAR(level, 0.0, 0.2, "one bird at Air 0 is as loud as the voice");
  }

  // Range sets how late: the last return is no later than Range over the speed of sound.
  for (float range : {2.0f, 30.0f, 60.0f}) {
    Settings s = bare();
    s.range = range;
    s.together = 0.0f;
    s.speed = 0.05f;
    start(device, s);
    Stereo out = run(device, impulse(0.4f, kRate, 0.5f));
    // The first and the last sample that carries anything of a return.
    size_t first = 0, last = 0;
    for (size_t i = 1; i < out.size(); ++i) {
      if (std::fabs(out.left[i]) < 0.01f) continue;
      if (first == 0) first = i;
      last = i;
    }
    const double near = flock::near_metres(range) / flock::kSoundSpeed * kRate;
    const double far = range / flock::kSoundSpeed * kRate;
    char label[160];
    std::snprintf(label, sizeof label,
                  "Range %.0f m: returns from sample %zu to %zu, inside %.0f to %.0f", range, first,
                  last, near, far);
    EXPECT(first > 0 && first >= near - 2.0 && last <= far + 3.0, label);
    std::snprintf(label, sizeof label, "Range %.0f m: a scattered flock fills most of the range",
                  range);
    EXPECT(static_cast<double>(last - first) > 0.4 * (far - near), label);
  }
}

// --- Flying bends the pitch -------------------------------------------------

static double worst_bend(const Settings& s, double hz, double* off_model) {
  start(device, s);
  const float seconds = 24.0f;
  Stereo out = run(device, sine(static_cast<float>(hz), seconds, kRate, 0.5f));
  std::vector<double> bend = deviation_hz(out.left, hz, kRate);
  double worst = 0.0;
  *off_model = 0.0;
  for (size_t n = 24000; n + 24000 < out.size(); n += 97) {
    worst = std::max(worst, std::fabs(bend[n]) / hz);
    // The flight's own answer: minus the rate at which the delay grows.
    const double rate = (delay_at(0, n + 240.0, s) - delay_at(0, n - 240.0, s)) / 480.0;
    *off_model = std::max(*off_model, std::fabs(bend[n] / hz + rate));
  }
  return worst;
}

static void test_bend() {
  Settings s = bare();
  s.birds = 1.0f;
  s.together = 0.3f;
  s.turns = 1.0f;
  s.range = 20.0f;
  s.speed = 2.0f;
  double off = 0.0;
  const double bend = worst_bend(s, 1000.0, &off);
  const double bound = Murmuration::max_bend(s.range, s.speed);
  std::printf("bend: Range 20 m at Speed 2 bends a tone by up to %.2f %% (bound %.2f %%), "
              "within %.3f %% of the flight's own\n",
              100.0 * bend, 100.0 * bound, 100.0 * off);
  EXPECT(bend <= bound, "a tone bends by no more than the bound for Speed and Range");
  EXPECT(bend > 0.004, "a flying bird does bend the tone");
  EXPECT(off < 0.0006, "the bend is the bird's speed towards the listener over the speed of sound");

  // Half the speed is half the bend; half the range too.
  Settings slow = s;
  slow.speed = 1.0f;
  const double slow_bend = worst_bend(slow, 1000.0, &off);
  EXPECT(slow_bend <= Murmuration::max_bend(slow.range, slow.speed), "bound at Speed 1");
  Settings close = s;
  close.range = 10.0f;
  const double close_bend = worst_bend(close, 1000.0, &off);
  EXPECT(close_bend <= Murmuration::max_bend(close.range, close.speed), "bound at Range 10");
  EXPECT_NEAR(close_bend / bend, 0.5, 0.02, "half the range is half the bend");
  EXPECT(slow_bend < 0.75 * bend && slow_bend > 0.3 * bend, "a slower flock bends less");

  // A long range is held to a safe speed: the bound never passes half the speed of sound.
  EXPECT_NEAR(Murmuration::max_bend(60.0f, 4.0f), 0.5, 1.0e-4, "the bound stops at half");
  EXPECT(flock::flight_rate(4.0f, 60.0f) < 4.0f && flock::flight_rate(4.0f, 10.0f) == 4.0f,
         "only a long range holds the speed back");
  Settings wild = s;
  wild.range = 60.0f;
  wild.speed = 4.0f;
  const double wild_bend = worst_bend(wild, 1000.0, &off);
  std::printf("bend: Range 60 m at Speed 4 bends a tone by up to %.1f %%\n", 100.0 * wild_bend);
  EXPECT(wild_bend < 0.3, "the fastest, farthest flock still reads forward through the line");
}

// --- Air: distance quietens and dulls ---------------------------------------

// What a one-pole at `corner` does to `hz`, as the device builds it.
static double one_pole_db(double corner, double hz) {
  const double a = std::exp(-2.0 * kPi * corner / kRate);
  const double w = 2.0 * kPi * hz / kRate;
  return db((1.0 - a) / std::sqrt(1.0 - 2.0 * a * std::cos(w) + a * a));
}

// What one bird alone carries of the voice at depth `u`: the distance law
// under the flock's ceiling (a flock of one has its own power to hold).
static double one_bird_level(float u, float air) {
  const float loud = flock::loudness(u, air);
  return static_cast<double>(loud) * flock::ceiling(loud * loud);
}

// One bird on a steady tone: how loud it is over each 50 ms, against the voice.
static std::vector<double> levels_of(const Settings& s, float hz, float seconds, size_t window) {
  start(device, s);
  Stereo out = run(device, sine(hz, seconds, kRate, 0.25f));
  std::vector<double> levels;
  for (size_t from = 24000; from + window < out.size(); from += window) {
    levels.push_back(db(std::sqrt(power(out, from, from + window) / 2.0) / 0.25 * std::sqrt(2.0)));
  }
  return levels;
}

static void test_air() {
  const size_t window = 2400;
  Settings s = bare();
  s.birds = 1.0f;
  s.together = 0.3f;
  s.turns = 0.6f;
  s.speed = 2.0f;
  s.air = 1.0f;
  std::vector<double> low = levels_of(s, 220.0f, 30.0f, window);
  double worst = 0.0, loudest = -99.0, quietest = 99.0;
  for (size_t i = 0; i < low.size(); ++i) {
    const double middle = 24000.0 + (i + 0.5) * window;
    const double said = db(one_bird_level(place_at(0, middle, s).u, 1.0f));
    worst = std::max(worst, std::fabs(low[i] - said));
    loudest = std::max(loudest, low[i]);
    quietest = std::min(quietest, low[i]);
  }
  std::printf("air: at Air 1 one bird runs from %.1f to %.1f dB against the voice, within %.2f dB "
              "of the distance law\n",
              quietest, loudest, worst);
  EXPECT(worst < 0.5, "at Air 1 a bird's level is the inverse of its distance, under the ceiling");
  EXPECT(loudest < 3.2, "one bird at its nearest is 3 dB over the voice and no more");
  EXPECT(loudest - quietest > 6.0, "a bird that flies in and out crosses 6 dB at Air 1");

  // The same flight at Air 0: one level throughout.
  s.air = 0.0f;
  low = levels_of(s, 220.0f, 30.0f, window);
  double swing = 0.0;
  for (double level : low) swing = std::max(swing, std::fabs(level));
  EXPECT(swing < 0.2, "at Air 0 distance does not change a bird's level");

  // The high end: at 6 kHz a bird is duller by the one-pole whose corner its distance sets.
  for (float air : {1.0f, 0.5f}) {
    s.air = air;
    std::vector<double> high = levels_of(s, 6000.0f, 30.0f, window);
    double off = 0.0, most = -99.0, least = 99.0;
    for (size_t i = 0; i < high.size(); ++i) {
      const flock::Place place = place_at(0, 24000.0 + (i + 0.5) * window, s);
      const double dull = one_pole_db(flock::cutoff_hz(place.u, place.h, air, 0.0f), 6000.0);
      off = std::max(off, std::fabs(high[i] - (db(one_bird_level(place.u, air)) + dull)));
      most = std::max(most, dull);
      least = std::min(least, dull);
    }
    std::printf("air: at Air %.1f the bird's 6 kHz is dulled by %.1f to %.1f dB as it flies, "
                "within %.2f dB of the law\n",
                air, -most, -least, off);
    EXPECT(off < 0.6, "a bird's high end falls with its distance by Air");
    EXPECT(most - least > (air > 0.75f ? 5.0 : 1.0), "a far bird is duller than a near one");
  }
  EXPECT_NEAR(flock::cutoff_hz(1.0f, 1.0f, 1.0f, 0.0f),
              flock::kOpenHz * std::pow(2.0, -flock::kAirOctaves), 1.0, "the farthest corner");
  EXPECT_NEAR(flock::cutoff_hz(0.0f, 1.0f, 1.0f, 1.0f), flock::kOpenHz, 1.0, "the nearest is open");

  // A bird kLevelRatio times the nearest distance away is as loud as the voice, and over
  // the whole flight the birds' mean power stays near one at any setting.
  EXPECT_NEAR(flock::loudness(3.0f / 7.0f, 1.0f), 1.0, 1.0e-4, "the level distance");
  double high_mean = -99.0, low_mean = 99.0;
  for (float together : {0.0f, 0.6f, 1.0f}) {
    for (float turns : {0.0f, 1.0f}) {
      for (float air : {0.5f, 1.0f}) {
        double mean = 0.0;
        long count = 0;
        for (double tau = 0.0; tau < flock::kPeriod; tau += 0.05) {
          const flock::Flight f = flock::flight(tau, together, turns);
          for (int b = 0; b < flock::kMaxBirds; ++b) {
            const float l = flock::loudness(flock::place(b, tau, f).u, air);
            mean += static_cast<double>(l) * l;
            ++count;
          }
        }
        const double level = 10.0 * std::log10(mean / static_cast<double>(count));
        high_mean = std::max(high_mean, level);
        low_mean = std::min(low_mean, level);
      }
    }
  }
  std::printf("air: over the whole flight the birds' mean power is %+.2f to %+.2f dB\n", low_mean,
              high_mean);
  EXPECT(low_mean > -1.0 && high_mean < 1.6, "the distance law keeps the flock's mean level");
}

// --- Lift: the low birds are duller -----------------------------------------

static void test_lift() {
  const size_t window = 2400;
  Settings s = bare();
  s.birds = 1.0f;
  s.lift = 1.0f;
  std::vector<double> high = levels_of(s, 6000.0f, 40.0f, window);
  double off = 0.0, most = -99.0, least = 99.0;
  for (size_t i = 0; i < high.size(); ++i) {
    const flock::Place place = place_at(0, 24000.0 + (i + 0.5) * window, s);
    const double dull = one_pole_db(flock::cutoff_hz(place.u, place.h, 0.0f, 1.0f), 6000.0);
    off = std::max(off, std::fabs(high[i] - dull));
    most = std::max(most, dull);
    least = std::min(least, dull);
  }
  std::printf("lift: at Lift 1 the bird's 6 kHz is dulled by %.1f dB when high and %.1f when low, "
              "within %.2f dB of the law\n",
              -most, -least, off);
  EXPECT(off < 0.6, "at Lift 1 a bird's high end follows its height");
  EXPECT(most - least > 4.0, "at Lift 1 a low bird is duller than a high one");

  s.lift = 0.0f;
  high = levels_of(s, 6000.0f, 40.0f, window);
  double swing = 0.0;
  for (double level : high) swing = std::max(swing, std::fabs(level - high[0]));
  EXPECT(swing < 0.3, "at Lift 0 height does not change a bird's tone");
}

// --- The level holds as Birds rises -----------------------------------------

static void test_level() {
  // Broad noise, the flock as it starts but for Air: every count as loud as one bird.
  rng_state() = 0x7E57u;
  const std::vector<float> hiss = noise(12.0f, kRate, 0.25f);
  double one = 0.0;
  std::printf("level: wet against one bird, broad noise:");
  for (int birds : {1, 2, 3, 4, 8, 12, 16}) {
    Settings s;
    s.birds = static_cast<float>(birds);
    s.air = 0.0f;
    s.mix = 1.0f;
    start(device, s);
    Stereo out = run(device, hiss);
    const double level = db(std::sqrt(power(out, 24000, out.size()) / 2.0) / rms(hiss));
    if (birds == 1) one = level;
    std::printf(" %d: %+.2f dB", birds, level - one);
    char label[120];
    std::snprintf(label, sizeof label, "%d birds are as loud as one on broad noise (%+.2f dB)", birds,
                  level - one);
    EXPECT(std::fabs(level - one) < 1.0, label);
  }
  std::printf("\n");
  // White noise loses its top octave to the interpolated read and the open one-pole.
  EXPECT(one > -3.0 && one < 0.5, "one bird carries the voice's level (less the top octave)");

  // The lows of a tight flock add in phase; the hold takes down what they add.
  std::printf("level: wet against the voice, 40 to 160 Hz, a tight flock:");
  for (int birds : {1, 4, 16}) {
    for (float together : {1.0f, 0.8f, 0.4f}) {
      Settings s;
      s.birds = static_cast<float>(birds);
      s.together = together;
      s.air = 0.0f;
      s.mix = 1.0f;
      start(device, s);
      rng_state() = 0xB055u;
      const std::vector<float> rumble = band_noise(20.0f, 40.0f, 160.0f, 0.2f);
      Stereo out = run(device, rumble);
      const double level = db(std::sqrt(power(out, 24000, out.size()) / 2.0) / rms(rumble));
      std::printf(" %d at %.1f: %+.2f dB", birds, together, level);
      char label[140];
      std::snprintf(label, sizeof label,
                    "%d birds, Together %.1f: the lows stay within 3 dB of the voice (%+.2f dB)",
                    birds, together, level);
      EXPECT(std::fabs(level) < 3.0, label);
    }
  }
  std::printf("\n");

  // At its defaults the device is about as loud as what goes in.
  {
    Settings s;
    start(device, s);
    rng_state() = 0xD3Fu;
    const std::vector<float> body = band_noise(20.0f, 100.0f, 4000.0f, 0.2f);
    Stereo out = run(device, body);
    const double level = db(std::sqrt(power(out, 24000, out.size()) / 2.0) / rms(body));
    std::printf("level: at the defaults %.2f dB against the input\n", level);
    EXPECT(std::fabs(level) < 1.0, "the defaults are as loud as the input, within a decibel");
  }
}

// --- The sides --------------------------------------------------------------

static void test_sides() {
  // Each return sits where its bird is: the pan law on the flight's own side.
  Settings s = bare();
  s.together = 0.0f;
  s.speed = 0.05f;
  s.spread = 1.0f;
  s.range = 60.0f;
  start(device, s);
  Stereo out = run(device, impulse(0.25f, kRate, 0.5f));
  std::vector<Return> found = returns_in(out, 1, 0.01);
  std::vector<std::pair<double, double>> expected;  // return time, side
  for (int b = 0; b < 8; ++b) {
    const double at = return_of(b, 0.0, s);
    expected.push_back({at, flock::pan(place_at(b, at, s).v, s.spread)});
  }
  std::sort(expected.begin(), expected.end());
  EXPECT(found.size() == expected.size(), "Spread 1: every bird returns");
  double worst = 0.0, widest = 0.0;
  if (found.size() == expected.size()) {
    for (size_t i = 0; i < found.size(); ++i) {
      const double heard = std::atan2(found[i].right, found[i].left);
      const double said = (expected[i].second + 1.0) * kPi / 4.0;
      worst = std::max(worst, std::fabs(heard - said));
      widest = std::max(widest, std::fabs(heard - kPi / 4.0));
    }
  }
  EXPECT(worst < 0.02, "Spread 1: each bird is heard at the side the flight has it");
  EXPECT(widest > 0.4, "Spread 1: birds are heard well off the middle");

  // Spread 0: the two sides are the same sample for sample.
  s.spread = 0.0f;
  start(device, s);
  rng_state() = 0x51DEu;
  const std::vector<float> hiss = noise(4.0f, kRate, 0.25f);
  out = run(device, hiss);
  EXPECT(out.left == out.right, "Spread 0: both sides are the same");

  // Folded to mono the flock loses 3 dB at the most: panned by level, never by time.
  double least = 9.0;
  for (float spread : {0.0f, 0.5f, 1.0f}) {
    for (float together : {0.0f, 0.6f, 1.0f}) {
      Settings w = bare();
      w.spread = spread;
      w.together = together;
      w.birds = 16.0f;
      start(device, w);
      out = run(device, hiss);
      double mono = 0.0;
      for (size_t i = 24000; i < out.size(); ++i) {
        const double m = 0.5 * (static_cast<double>(out.left[i]) + out.right[i]);
        mono += m * m;
      }
      mono /= static_cast<double>(out.size() - 24000);
      const double fold = db(std::sqrt(2.0 * mono / power(out, 24000, out.size())));
      least = std::min(least, fold);
      char label[140];
      std::snprintf(label, sizeof label,
                    "Spread %.1f, Together %.1f: the mono fold is %.2f dB against the two sides",
                    spread, together, fold);
      EXPECT(fold > -3.02 && fold < 0.01, label);
    }
  }
  std::printf("sides: the mono fold is never more than %.2f dB under the stereo sum\n", -least);

  // A wide flock is wide: the sides of a scattered flock at Spread 1 are far from alike.
  Settings wide = bare();
  wide.spread = 1.0f;
  wide.together = 0.0f;
  wide.birds = 16.0f;
  start(device, wide);
  out = run(device, hiss);
  // Each bird is one place between the sides, so the sides stay partly alike: wide, not hollow.
  const double alike = correlation(out.left, out.right, 24000);
  std::printf("sides: a scattered flock of sixteen at Spread 1 has its sides %.2f alike\n", alike);
  EXPECT(alike < 0.85 && alike > 0.3, "a scattered flock at Spread 1 sets the sides apart");
}

// --- Wheels -----------------------------------------------------------------

static void test_wheel() {
  // Fly in silence to the middle of a slot Turns picks, then send an impulse:
  // the returns of a wheeling flock lie closer together than a calm one's.
  int slot = 1;
  while (flock::chance(slot, 0x51u) > 0.2f) ++slot;
  const double at = (slot + 0.5) * flock::kSlotSeconds * kRate;
  double spans[2] = {0.0, 0.0};
  for (int wheeling = 0; wheeling < 2; ++wheeling) {
    Settings s = bare();
    s.together = 0.3f;
    s.turns = wheeling ? 1.0f : 0.0f;
    start(device, s);
    render(device, static_cast<float>(at / kRate), kRate);
    Stereo out = run(device, impulse(0.25f, kRate, 0.5f));
    std::vector<Return> found = returns_in(out, 1, 0.014);
    std::vector<double> expected;
    for (int b = 0; b < 8; ++b) expected.push_back(return_of(b, at, s) - at);
    std::sort(expected.begin(), expected.end());
    double worst = 9.0;
    if (!found.empty()) {
      worst = std::max(std::fabs(found.front().at - expected.front()),
                       std::fabs(found.back().at - expected.back()));
      spans[wheeling] = found.back().at - found.front().at;
    }
    char label[160];
    std::snprintf(label, sizeof label,
                  "%s: the first and last returns are the flight's (off by %.2f samples)",
                  wheeling ? "mid wheel" : "no wheel", worst);
    EXPECT(worst < 1.5, label);
  }
  std::printf("wheel: the returns span %.0f samples in a calm flock and %.0f mid wheel\n", spans[0],
              spans[1]);
  EXPECT(spans[1] < 0.55 * spans[0] && spans[1] > 0.0, "a wheeling flock is bunched up");
}

// --- Mix --------------------------------------------------------------------

static void test_mix() {
  Settings s;
  s.mix = 0.0f;
  start(device, s);
  rng_state() = 0x0D17u;
  const std::vector<float> left = noise(1.0f, kRate, 0.5f);
  const std::vector<float> right = sine(330.0f, 1.0f, kRate, 0.4f);
  Stereo out = run(device, left, right);
  EXPECT(out.left == left && out.right == right, "Mix 0 is the input, sample for sample");

  // Mix 1 has none of the dry sound: nothing comes out before the nearest bird.
  s = bare();
  start(device, s);
  out = run(device, impulse(0.1f, kRate, 0.5f));
  const size_t nearest = static_cast<size_t>(flock::near_metres(s.range) / flock::kSoundSpeed * kRate);
  EXPECT(peak(out.left, 0, nearest - 3) == 0.0, "Mix 1 has no dry sound in it");
}

// --- No clicks --------------------------------------------------------------

static void test_clicks() {
  const std::vector<float> tone = sine(220.0f, 0.5f, kRate, 0.5f);
  struct Move {
    const char* what;
    int param;
    float to;
  };
  const Move moves[] = {
      {"Birds 8 to 16", p::kBirds, 16.0f},     {"Birds 8 to 1", p::kBirds, 1.0f},
      {"Range 10 to 40", p::kRange, 40.0f},    {"Range 10 to 1", p::kRange, 1.0f},
      {"Together 0.6 to 0", p::kTogether, 0.0f}, {"Together 0.6 to 1", p::kTogether, 1.0f},
      {"Turns 0.3 to 1", p::kTurns, 1.0f},     {"Air 0.5 to 1", p::kAir, 1.0f},
      {"Spread 0.8 to 0", p::kSpread, 0.0f},   {"Lift 0.3 to 1", p::kLift, 1.0f},
      {"Speed 1 to 4", p::kSpeed, 4.0f},       {"Mix 1 to 0", p::kMix, 0.0f},
  };
  Settings s;
  s.mix = 1.0f;
  s.ground = p::kParamMin[p::kGround];
  // No event: the steepest the flock makes a 220 Hz tone on its own.
  start(device, s);
  run(device, tone);
  Stereo calm = concat(run(device, tone), run(device, tone));
  const double steady = std::max(max_step(calm.left), max_step(calm.right));
  for (const Move& move : moves) {
    start(device, s);
    run(device, tone);
    device.set_param(move.param, move.to);
    Stereo moved = run(device, tone);
    device.set_param(move.param, p::kParamDefault[move.param]);
    if (move.param == p::kMix) device.set_param(p::kMix, 1.0f);
    Stereo back = run(device, tone);
    const double step = std::max({max_step(moved.left), max_step(moved.right), max_step(back.left),
                                  max_step(back.right)});
    char label[160];
    std::snprintf(label, sizeof label, "%s and back while sounding: no click (step %.4f, steady %.4f)",
                  move.what, step, steady);
    EXPECT(step < 1.6 * steady + 0.004, label);
  }
  std::printf("clicks: the steepest step of a 220 Hz tone through the flock is %.4f\n", steady);
}

// --- Rest, and the flight through it ----------------------------------------

static void test_rest() {
  Settings s;
  start(device, s);
  rng_state() = 0x5EE9u;
  run(device, noise(0.2f, kRate, 0.5f));
  Stereo tail = render(device, 0.5f, kRate);
  Stereo rest = render(device, 1.0f, kRate);
  EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "at rest after the tail");
  EXPECT(peak(tail.left, 0, 1200) > 0.001, "the birds still sound after the input stops");
  Stereo woken = run(device, impulse(0.2f, kRate, 0.5f));
  EXPECT(peak(woken.left, 100, 2000) > 0.01, "wakes on new input");

  // The flight time runs at Speed, sound or no sound, and input does not reset it.
  s.speed = 2.0f;
  start(device, s);
  render(device, 3.0f, kRate);
  EXPECT_NEAR(device.meter(0), 6.0, 0.0003, "the flight time runs at Speed in silence");
  run(device, noise(2.0f, kRate, 0.3f));
  EXPECT_NEAR(device.meter(0), 10.0, 0.0003, "and runs on at Speed through sound");
  s.speed = 4.0f;
  s.range = 60.0f;
  start(device, s);
  render(device, 2.0f, kRate);
  EXPECT_NEAR(device.meter(0), 2.0 * flock::flight_rate(4.0f, 60.0f), 0.0003,
              "a long range flies at the speed it is held to");
  // The reading wraps at kPeriod.
  s = Settings();
  s.speed = 4.0f;
  start(device, s);
  for (int i = 0; i < 26; ++i) render(device, 10.0f, kRate);
  EXPECT_NEAR(device.meter(0), 1040.0 - flock::kPeriod, 0.01, "the flight time wraps at kPeriod");
  run(device, noise(0.3f, kRate, 0.3f));
  Stereo after = run(device, noise(0.3f, kRate, 0.3f));
  EXPECT(finite(after.left) && rms(after.left) > 0.01, "and the flock sounds on past the wrap");
}

// A phrase with a silence and knobs moved in it, at one block size.
static Stereo phrase(Murmuration& d, float gap_seconds, int block, bool ragged) {
  Settings s;
  start(d, s);
  rng_state() = 0xFACEu;
  const std::vector<float> first = noise(0.31f, kRate, 0.4f);
  const std::vector<float> second = sine(330.0f, 0.4f, kRate, 0.4f);
  auto play = [&](const std::vector<float>& x) {
    if (!ragged) return run(d, x, block);
    Stereo out;
    out.left.resize(x.size());
    out.right.resize(x.size());
    const int sizes[] = {1, 7, 64, 128, 33, 512, 2048, 5};
    size_t done = 0;
    int which = 0;
    while (done < x.size()) {
      const int frames =
          static_cast<int>(std::min(static_cast<size_t>(sizes[which++ % 8]), x.size() - done));
      for (int i = 0; i < frames; ++i) {
        d.in_left()[i] = x[done + i];
        d.in_right()[i] = x[done + i];
      }
      d.process(frames);
      for (int i = 0; i < frames; ++i) {
        out.left[done + i] = d.out_left()[i];
        out.right[done + i] = d.out_right()[i];
      }
      done += frames;
    }
    return out;
  };
  Stereo out = play(first);
  out = concat(out, play(silence(gap_seconds - 0.004f, kRate)));
  // Knobs moved in the silence, 4 ms before the sound returns.
  d.set_param(p::kBirds, 13.0f);
  d.set_param(p::kRange, 24.0f);
  d.set_param(p::kTogether, 0.2f);
  d.set_param(p::kMix, 0.8f);
  out = concat(out, play(silence(0.004f, kRate)));
  out = concat(out, play(second));
  return out;
}

static void test_blocks() {
  double worst = 0.0;
  for (float gap : {0.30f, 0.32f, 0.34f, 0.36f, 0.38f, 0.40f, 0.42f, 0.44f, 1.3f}) {
    Stereo reference = phrase(device, gap, 128, false);
    for (int block : {1, 2048, 0}) {
      Stereo out = phrase(other, gap, block == 0 ? 128 : block, block == 0);
      worst = std::max(worst, worst_difference(reference, out));
    }
  }
  char label[160];
  std::snprintf(label, sizeof label,
                "the same at blocks of 1, 128, 2048 and ragged across a silence with knobs moved "
                "in it (max diff %g)",
                worst);
  EXPECT(worst < 1.0e-6, label);

  // A knob moved at rest has arrived when sound returns: the same as a device
  // that had it there all along and flew through the same silence.
  Settings s;
  start(device, s);
  rng_state() = 0xA5A5u;
  const std::vector<float> first = noise(0.25f, kRate, 0.4f);
  const std::vector<float> second = sine(440.0f, 0.5f, kRate, 0.4f);
  run(device, first);
  device.process(13);  // off the beat of the control clock
  render(device, 0.75f, kRate);
  Settings moved = s;
  moved.birds = 3.0f;
  moved.range = 30.0f;
  moved.together = 0.1f;
  moved.air = 1.0f;
  moved.spread = 0.2f;
  moved.lift = 0.9f;
  moved.turns = 0.9f;
  moved.ground = 60.0f;
  moved.mix = 0.9f;
  set(device, moved);
  Stereo late = run(device, second);
  start(other, moved);
  render(other, 0.25f, kRate);
  other.process(13);
  render(other, 0.75f, kRate);
  Stereo always = run(other, second);
  const double off = worst_difference(late, always);
  std::snprintf(label, sizeof label,
                "knobs moved at rest snap: the next sound is that of a device set so from the start "
                "(max diff %g)",
                off);
  EXPECT(off < 1.0e-6, label);
}

// --- Bad input --------------------------------------------------------------

static void test_bad_input() {
  for (float bad : {std::nanf(""), INFINITY, -INFINITY, 1.0e30f, -1.0e30f}) {
    Settings s;
    start(device, s);
    start(other, s);
    rng_state() = 0xBADu;
    const std::vector<float> good = noise(1.0f, kRate, 0.3f);
    std::vector<float> dirty(480, 0.0f);
    for (size_t i = 100; i < 140; ++i) dirty[i] = bad;
    run(device, good);
    run(other, good);
    Stereo during = run(device, dirty);
    run(other, std::vector<float>(480, 0.0f));
    Stereo after = run(device, good);
    Stereo clean = run(other, good);
    char label[160];
    // The birds only ever read what the line was fed, which is never worse than ±16.
    const size_t reach = static_cast<size_t>(0.06f * kRate);
    std::snprintf(label, sizeof label, "input of %g: finite again once the bad samples have gone by",
                  static_cast<double>(bad));
    EXPECT(finite(after.left) && finite(after.right), label);
    const double off = worst_difference(after, clean, reach);
    std::snprintf(label, sizeof label,
                  "input of %g: 60 ms on, the same as a device that heard silence instead (diff %g)",
                  static_cast<double>(bad), off);
    EXPECT(off < 1.0e-5, label);
    bool wet_finite = true;
    for (size_t i = 0; i < during.size(); ++i) {
      if (i >= 100 && i < 140) continue;  // the dry path is a wire
      wet_finite = wet_finite && std::isfinite(during.left[i]) && std::isfinite(during.right[i]) &&
                   std::fabs(during.left[i]) < 64.0f;
    }
    std::snprintf(label, sizeof label, "input of %g: the birds stay finite and bounded",
                  static_cast<double>(bad));
    EXPECT(wet_finite, label);
  }
}

// --- Full scale at every extreme, and the other rates ------------------------

static void test_bounds() {
  rng_state() = 0xF00Du;
  const std::vector<float> loud = noise(4.0f, kRate, 1.0f);
  double worst = 0.0;
  for (float birds : {1.0f, 16.0f}) {
    for (float together : {0.0f, 1.0f}) {
      for (float air : {0.0f, 1.0f}) {
        for (float range : {1.0f, 60.0f}) {
          Settings s;
          s.birds = birds;
          s.together = together;
          s.air = air;
          s.range = range;
          s.turns = 1.0f;
          s.speed = 4.0f;
          s.mix = 1.0f;
          start(device, s);
          Stereo out = run(device, loud);
          EXPECT(finite(out.left) && finite(out.right), "finite at full scale");
          worst = std::max({worst, peak(out.left), peak(out.right)});
        }
      }
    }
  }
  std::printf("bounds: full-scale noise through every corner peaks at %.2f\n", worst);
  EXPECT(worst < 8.0, "bounded at every corner with full-scale input");

  // The delays are in seconds: the same flock at 96 kHz returns at the same times.
  Settings s = bare();
  s.together = 0.0f;
  s.speed = 0.05f;
  s.range = 60.0f;
  start(device, s, 96000.0f);
  Stereo out = run(device, impulse(0.25f, 96000.0f, 0.5f));
  std::vector<Return> found = returns_in(out, 1, 0.01);
  EXPECT(found.size() == 8, "96 kHz: eight returns");
  if (!found.empty()) {
    const double last = found.back().at / 96000.0;
    EXPECT(last > 0.1 && last <= 60.0 / flock::kSoundSpeed + 1.0e-4,
           "96 kHz: the farthest bird of a 60 m range is inside the line");
  }
}

// --- What the second check found --------------------------------------------
//
// Each group below fails on the device as it was first built.

// A held note through the device: its level over stretches of whole periods
// (60 ms or more), in dB against the note that went in.
static std::vector<double> held_levels(const Settings& s, float hz, float seconds) {
  const float amp = 0.25f;
  start(device, s);
  Stereo out = run(device, sine(hz, seconds, kRate, amp));
  const double periods = std::max(4.0, std::ceil(0.06 * hz));
  const size_t window = static_cast<size_t>(std::llround(periods * kRate / hz));
  std::vector<double> levels;
  for (size_t from = 48000; from + window < out.size(); from += window) {
    levels.push_back(10.0 * std::log10(std::max(power(out, from, from + window), 1.0e-20) /
                                       (static_cast<double>(amp) * amp)));
  }
  return levels;
}

// A control stepped at sample `at` while `in` runs, against the same sound
// with the control at its old and at its new value throughout (the flight
// does not listen, so those two bound what the flock does on its own): the
// jump from one sample to the next that the step adds, in dB against `amp`,
// and how much sharper the worst corner is than either steady run's.
struct Stepped {
  double step_db;
  double kink;
  double peak;
  double steady_peak;
};

static double corner(const std::vector<float>& x, size_t from, size_t to) {
  double worst = 0.0;
  for (size_t i = from + 2; i < to && i < x.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - 2.0 * x[i - 1] + x[i - 2]));
  }
  return worst;
}

static Stepped stepped(const Settings& before, int param, float to, const std::vector<float>& in,
                       size_t at, double amp) {
  const std::vector<float> head(in.begin(), in.begin() + static_cast<long>(at));
  const std::vector<float> rest(in.begin() + static_cast<long>(at), in.end());
  const size_t from = at - 64, until = std::min(in.size(), at + 28800);
  double step[3], kink[3], top[3];
  for (int pass = 0; pass < 3; ++pass) {  // old value, new value, stepped
    start(device, before);
    if (pass == 1) device.set_param(param, to);
    Stereo out = run(device, head);
    if (pass == 2) device.set_param(param, to);
    out = concat(out, run(device, rest));
    step[pass] = std::max(max_step(out.left, from, until), max_step(out.right, from, until));
    kink[pass] = std::max(corner(out.left, from, until), corner(out.right, from, until));
    top[pass] = std::max(peak(out.left, from, until), peak(out.right, from, until));
  }
  const double steady = std::max(step[0], step[1]);
  return {db(std::max(step[2] - steady, 1.0e-9) / amp), kink[2] / std::max(kink[0], kink[1]), top[2],
          std::max(top[0], top[1])};
}

// --- Ground: the low end does not fly ----------------------------------------

static void test_ground() {
  // A flock that is tight against the wavelength is one late copy of a low
  // note, and against the dry note that is a comb: without Ground the lowest
  // notes went 10 dB down for seconds on end. At the defaults none does.
  double lowest = 0.0;
  for (float hz : {32.70f, 55.0f, 82.41f, 110.0f, 146.83f}) {
    for (double level : held_levels(Settings(), hz, 40.0f)) lowest = std::min(lowest, level);
  }
  Settings flown;
  flown.ground = p::kParamMin[p::kGround];
  flown.mix = 0.5f;
  double lost = 0.0;
  for (double level : held_levels(flown, 32.70f, 40.0f)) lost = std::min(lost, level);
  std::printf("ground: held notes of 33 to 147 Hz at the defaults dip to %.1f dB at worst; with "
              "Ground fully down 33 Hz dips to %.1f dB\n",
              lowest, lost);
  EXPECT(lowest > -8.0, "at the defaults no low note is lost to the comb");
  EXPECT(lost < -15.0, "with Ground fully down the low end flies, and the comb reaches it");

  // Fully wet, what is under Ground still comes straight through, at once.
  Settings wet;
  wet.mix = 1.0f;
  start(device, wet);
  Stereo out = run(device, impulse(0.05f, kRate, 0.5f));
  EXPECT(std::fabs(out.left[0]) > 0.005, "fully wet, the low end under Ground is there at once");
  double swing = 0.0;
  for (double level : held_levels(wet, 40.0f, 20.0f)) swing = std::max(swing, std::fabs(level));
  std::printf("ground: fully wet, a 40 Hz note stays within %.2f dB of what went in\n", swing);
  EXPECT(swing < 2.5, "fully wet, a note well under Ground passes at its own level");

  // Ground turned from end to end while a flown tone runs: no click, no burst.
  Settings s;
  s.mix = 1.0f;
  const std::vector<float> tone = sine(220.0f, 3.0f, kRate, 0.5f);
  double worst = -200.0, sharpest = 0.0, burst = 0.0;
  for (float to : {p::kParamMin[p::kGround], p::kParamMax[p::kGround]}) {
    for (size_t at : {size_t{96000}, size_t{100047}}) {
      const Stepped r = stepped(s, p::kGround, to, tone, at, 0.5);
      worst = std::max(worst, r.step_db);
      sharpest = std::max(sharpest, r.kink);
      burst = std::max(burst, r.peak / r.steady_peak);
    }
  }
  std::printf("ground: stepped to either end on a 220 Hz tone: step %.1f dB against the tone, "
              "corner x%.1f, peak x%.2f\n",
              worst, sharpest, burst);
  EXPECT(worst < -50.0 && sharpest < 30.0, "Ground stepped to either end does not click");
  EXPECT(burst < 1.3, "Ground stepped to either end does not burst");
}

// --- The two sides of the input ----------------------------------------------

static void test_stereo_input() {
  // Each bird carries both sides of what it copies. The birds were fed the
  // sum of the sides: a sound that is opposite on the two sides had no flock.
  Settings s;
  s.mix = 1.0f;
  s.ground = p::kParamMin[p::kGround];
  rng_state() = 0x57E0u;
  const std::vector<float> one = band_noise(6.0f, 100.0f, 4000.0f, 0.2f);
  std::vector<float> flipped(one.size()), nothing(one.size(), 0.0f);
  for (size_t i = 0; i < one.size(); ++i) flipped[i] = -one[i];
  start(device, s);
  Stereo alike = run(device, one, one);
  start(device, s);
  Stereo opposed = run(device, one, flipped);
  const double kept = 10.0 * std::log10(std::max(power(opposed, 24000, opposed.size()), 1.0e-24) /
                                        power(alike, 24000, alike.size()));
  std::printf("stereo: a sound opposite on the two sides comes back %.2f dB against the same sound "
              "alike on both\n",
              kept);
  EXPECT(std::fabs(kept) < 0.5, "a sound that is opposite on the two sides has its flock");
  double off = 0.0;
  for (size_t i = 0; i < alike.size(); ++i) {
    off = std::max(off, std::fabs(static_cast<double>(alike.right[i]) + opposed.right[i]));
    off = std::max(off, std::fabs(static_cast<double>(alike.left[i]) - opposed.left[i]));
  }
  EXPECT(off < 1.0e-6, "each side of the flock is that side of the input, flown");

  // A sound on one side stays on its side.
  start(device, s);
  Stereo left_only = run(device, one, nothing);
  EXPECT(peak(left_only.right) == 0.0, "a sound on the left alone puts nothing on the right");
  EXPECT(rms(left_only.left, 24000) > 0.02, "and is flown on the left");
  s = Settings();
  start(device, s);
  left_only = run(device, one, nothing);
  EXPECT(peak(left_only.right) == 0.0, "at the defaults too");
}

// --- The ceiling --------------------------------------------------------------

static void test_ceiling() {
  // The law itself: no flock is passed at more than kCeilingPower, and one
  // at the voice's own level is left alone.
  double most = 0.0;
  for (float power_in = 0.01f; power_in < 400.0f; power_in *= 1.1f) {
    const double held = static_cast<double>(power_in) * flock::ceiling(power_in) * flock::ceiling(power_in);
    most = std::max(most, held);
  }
  EXPECT(most <= flock::kCeilingPower * 1.0001, "the ceiling holds any flock to twice the voice's power");
  EXPECT(flock::ceiling(1.0f) > 0.99f, "a flock as loud as the voice is left alone");

  // A tight flock close by at Air 1 was 12 dB over the sound it copied.
  double worst = -99.0;
  for (int birds : {1, 16}) {
    Settings s = bare();
    s.birds = static_cast<float>(birds);
    s.range = 3.0f;
    s.together = 1.0f;
    s.turns = 1.0f;
    s.speed = 2.0f;
    s.air = 1.0f;
    for (double level : held_levels(s, 110.0f, 60.0f)) worst = std::max(worst, level);
  }
  std::printf("ceiling: a tight flock close by at Air 1, a 110 Hz note fully wet: %.2f dB against "
              "the note at its loudest\n",
              worst);
  EXPECT(worst < 3.3, "a tight flock passing close at Air 1 is 3 dB over the voice and no more");
  EXPECT(worst > 1.0, "and is still louder than the voice when it is near");
}

// --- Birds and Turns stepped while a low note is flown -------------------------

static void test_steps() {
  // Sixteen scattered birds to one and back on a 55 Hz note: the level hold
  // used to jump to a corner of its own at one bird, 43 dB under the note.
  Settings s = bare();
  s.range = 60.0f;
  s.together = 0.0f;
  s.air = 1.0f;
  s.spread = 0.8f;
  const std::vector<float> low = sine(55.0f, 3.6f, kRate, 0.5f);
  double worst = -200.0, sharpest = 0.0, burst = 0.0;
  for (int from : {16, 1}) {
    s.birds = static_cast<float>(from);
    for (size_t at : {size_t{96000}, size_t{100047}, size_t{134013}}) {
      const Stepped r = stepped(s, p::kBirds, from == 16 ? 1.0f : 16.0f, low, at, 0.5);
      worst = std::max(worst, r.step_db);
      sharpest = std::max(sharpest, r.kink);
      burst = std::max(burst, r.peak / r.steady_peak);
    }
  }
  std::printf("steps: Birds 16 to 1 and 1 to 16 on a flown 55 Hz note: step %.1f dB against the "
              "note, corner x%.1f, peak x%.2f\n",
              worst, sharpest, burst);
  EXPECT(worst < -50.0, "Birds stepped between 1 and 16 adds no step to a low note");
  EXPECT(sharpest < 30.0, "Birds stepped between 1 and 16 adds no corner to a low note");
  EXPECT(burst < 1.25, "Birds stepped between 1 and 16 does not burst");

  // Turns brought up in the middle of a slot it picks: the whole flock used
  // to be thrown to the wheel's place in 50 ms, 32 dB under the note.
  int slot = 1;
  while (flock::chance(slot, 0x51u) > 0.2f) ++slot;
  Settings calm = bare();
  calm.together = 0.3f;
  const double rate = flock::flight_rate(calm.speed, calm.range);
  const size_t at = static_cast<size_t>((slot + 0.5) * flock::kSlotSeconds / rate * kRate);
  const std::vector<float> note = sine(110.0f, static_cast<float>(at) / kRate + 1.0f, kRate, 0.5f);
  const Stepped up = stepped(calm, p::kTurns, 1.0f, note, at, 0.5);
  calm.turns = 1.0f;
  const Stepped down = stepped(calm, p::kTurns, 0.0f, note, at, 0.5);
  std::printf("steps: Turns 0 to 1 and 1 to 0 mid wheel on a flown 110 Hz note: step %.1f dB, "
              "corner x%.1f\n",
              std::max(up.step_db, down.step_db), std::max(up.kink, down.kink));
  EXPECT(up.step_db < -50.0 && down.step_db < -50.0, "Turns stepped mid wheel adds no step");
  EXPECT(up.kink < 10.0 && down.kink < 10.0, "Turns stepped mid wheel adds no corner");

  // The flight follows Turns at kTurnsSlew per second of flight, the second
  // meter reads what is flown, and at rest the knob is simply there.
  Settings t;
  t.speed = 2.0f;
  start(device, t);
  rng_state() = 0x7A5u;
  run(device, noise(0.5f, kRate, 0.3f));
  EXPECT_NEAR(device.meter(1), 0.3, 1.0e-6, "the second meter reads Turns as flown");
  device.set_param(p::kTurns, 1.0f);
  run(device, noise(2.0f, kRate, 0.3f));
  const double flown = 0.3 + flock::kTurnsSlew * flock::flight_rate(2.0f, t.range) * 2.0;
  EXPECT_NEAR(device.meter(1), flown, 0.002, "Turns is followed at kTurnsSlew per second of flight");
  render(device, 1.0f, kRate);
  device.set_param(p::kTurns, 0.0f);
  EXPECT_NEAR(device.meter(1), 0.0, 1.0e-6, "at rest the second meter reads the control");
  run(device, noise(0.01f, kRate, 0.3f));
  EXPECT_NEAR(device.meter(1), 0.0, 1.0e-6, "a Turns set at rest is there when sound returns");
}

// --- How far a held note swells -----------------------------------------------

static void test_swell() {
  // Eight copies of a note line up now and then: at the defaults the note
  // never stands more than 7.5 dB over what went in, and 19 times in 20 it
  // is within 5 dB.
  double most = -99.0, often = -99.0;
  for (float hz : {440.0f, 739.99f, 1244.51f}) {
    std::vector<double> levels = held_levels(Settings(), hz, 60.0f);
    std::sort(levels.begin(), levels.end());
    most = std::max(most, levels.back());
    often = std::max(often, levels[levels.size() * 95 / 100]);
  }
  std::printf("swell: held notes of 440, 740 and 1245 Hz at the defaults over a minute: %.1f dB "
              "over the note at most, %.1f dB at the 95th part in 100\n",
              most, often);
  EXPECT(most < 7.5, "a held note at the defaults swells by less than 7.5 dB");
  EXPECT(often < 5.0, "and is within 5 dB of itself 19 times in 20");
}

int main() {
  Conformance spec;
  spec.name = "murmuration";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 1.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  test_flight();
  test_returns();
  test_bend();
  test_air();
  test_lift();
  test_level();
  test_sides();
  test_wheel();
  test_mix();
  test_clicks();
  test_rest();
  test_blocks();
  test_bad_input();
  test_bounds();
  test_ground();
  test_stereo_input();
  test_ceiling();
  test_steps();
  test_swell();

  // Cost: the flock as it starts, and the most it can be asked for.
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  device.init(kRate);
  report_cost("murmuration (defaults, 8 birds)", 10.0f, kRate, [&] { run(device, input); });
  Settings most;
  most.birds = 16.0f;
  most.turns = 1.0f;
  most.speed = 4.0f;
  most.air = 1.0f;
  most.lift = 1.0f;
  start(device, most);
  report_cost("murmuration (16 birds, everything moving)", 10.0f, kRate, [&] { run(device, input); });

  return finish("murmuration");
}
