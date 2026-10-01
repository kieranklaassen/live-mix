// Native harness for Drone (cpp/devices/drone). The conformance pass covers
// silence before and after notes, voice stealing, parameter abuse and other
// sample rates; the rest asserts what makes it a drone: the ratios of each
// shape, partials that wander without ever repeating, the wave morph, the
// tuned air, the latch, and envelopes that last half a minute.

#include "../devices/drone/drone.h"

#include "support/test_kit.h"

using namespace testkit;
using livemix::Drone;
namespace p = livemix::drone;

static Drone device;

static const float kRate = 48000.0f;

enum Shape { kUnison = 0, kOctaves, kFifths, kHarmonic, kMajor, kMinor, kCluster };

// A static, dry drone: sine partials, nothing wandering, no sub or air, the
// filter out of the way, fast envelopes.
static void still(Drone& d, int shape) {
  d.init(kRate);
  d.set_param(p::kShape, static_cast<float>(shape));
  d.set_param(p::kPartials, 1.0f);
  d.set_param(p::kWave, 0.0f);
  d.set_param(p::kMovement, 0.0f);
  d.set_param(p::kSub, 0.0f);
  d.set_param(p::kAir, 0.0f);
  d.set_param(p::kCutoff, 16000.0f);
  d.set_param(p::kAttack, 0.01f);
  d.set_param(p::kRelease, 0.05f);
  d.set_param(p::kWidth, 0.0f);
  d.set_param(p::kVolume, 0.0f);
}

static Stereo note(Drone& d, float hz, float seconds) {
  d.note_on(1, hz, 1.0f);
  return render(d, seconds, kRate);
}

static double cents(double measured, double expected) { return 1200.0 * std::log2(measured / expected); }

// Level of the `hz` component per second of `x`, from `from_s` to `to_s`.
// Each second is the RMS of ten 100 ms measurements, wide enough in
// frequency that a partial wandering by a few cents stays inside.
static std::vector<double> track(const std::vector<float>& x, double hz, int from_s, int to_s) {
  std::vector<double> levels;
  for (int s = from_s; s < to_s; ++s) {
    double sum = 0.0;
    for (int w = 0; w < 10; ++w) {
      const size_t at = static_cast<size_t>(s) * 48000 + static_cast<size_t>(w) * 4800;
      const double level = tone_level(x, hz, kRate, at, at + 4800);
      sum += level * level;
    }
    levels.push_back(std::sqrt(sum / 10.0));
  }
  return levels;
}

static double spread(const std::vector<double>& x) {
  return *std::max_element(x.begin(), x.end()) /
         std::max(1.0e-12, *std::min_element(x.begin(), x.end()));
}

int main() {
  Conformance spec;
  spec.name = "drone";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 11.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  // Each shape puts its partials on its ratios, within 2 cents, and nowhere else.
  {
    struct Case {
      int shape;
      const char* name;
      int count;
      double ratios[8];
      double absent[2];
    };
    const Case cases[] = {
        {kMajor, "Just major", 8, {1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0}, {1.2, 1.2599}},
        {kMinor, "Just minor", 8, {1.0, 1.2, 1.5, 2.0, 2.4, 3.0, 4.0, 4.8}, {1.25, 1.1892}},
        {kFifths, "Fifths", 8, {1.0, 1.5, 2.0, 3.0, 4.0, 6.0, 8.0, 12.0}, {1.25, 4.0 / 3.0}},
        {kHarmonic, "Harmonic series", 8, {1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0}, {1.5, 2.5}},
        {kOctaves, "Octaves", 5, {1.0, 2.0, 4.0, 8.0, 16.0, 0, 0, 0}, {1.5, 3.0}},
        {kCluster,
         "Cluster",
         8,
         {1.0, 16.0 / 15.0, 1.125, 1.2, 4.0 / 3.0, 1.5, 5.0 / 3.0, 2.0},
         {1.25, 1.8}},
    };
    const double root = 164.81;
    for (const Case& c : cases) {
      still(device, c.shape);
      Stereo out = note(device, static_cast<float>(root), 9.0f);
      const size_t from = 48000;
      double weakest = 1.0e9;
      double worst = 0.0;
      for (int k = 0; k < c.count; ++k) {
        const double hz = root * c.ratios[k];
        const double found = dominant_frequency(out.left, kRate, hz * 0.985, hz * 1.015, from);
        worst = std::max(worst, std::fabs(cents(found, hz)));
        weakest = std::min(weakest, tone_level(out.left, hz, kRate, from));
      }
      char label[120];
      std::snprintf(label, sizeof label, "%s: every partial is on its ratio (worst %.2f cents)", c.name,
                    worst);
      EXPECT(worst < 2.0, label);
      std::snprintf(label, sizeof label, "%s: every partial is present", c.name);
      EXPECT(weakest > 0.01, label);
      std::snprintf(label, sizeof label, "%s: nothing sounds on ratios the shape does not have", c.name);
      EXPECT(tone_level(out.left, root * c.absent[0], kRate, from) < 0.02 * weakest &&
                 tone_level(out.left, root * c.absent[1], kRate, from) < 0.02 * weakest,
             label);
    }
    // Just, not tempered: the major third is 5/4 (386 cents), 14 cents under equal temperament.
    still(device, kMajor);
    Stereo major = note(device, 220.0f, 9.0f);
    const double third = dominant_frequency(major.left, kRate, 265.0, 285.0, 48000);
    EXPECT_NEAR(cents(third, 220.0), 386.31, 1.5, "Just major's third is 5/4");
    const double fifth = dominant_frequency(major.left, kRate, 320.0, 340.0, 48000);
    EXPECT_NEAR(cents(fifth, 220.0), 701.96, 1.5, "and its fifth 3/2");

    // Unison is one pitch.
    still(device, kUnison);
    Stereo unison = note(device, 220.0f, 2.0f);
    EXPECT_NEAR(dominant_frequency(unison.left, kRate, 100.0, 4000.0, 48000), 220.0, 0.3,
                "Unison is the root");
    EXPECT(tone_level(unison.left, 440.0, kRate, 48000) <
               0.001 * tone_level(unison.left, 220.0, kRate, 48000),
           "and nothing else");
  }

  // Partials brings the upper ones in, at constant power.
  {
    still(device, kHarmonic);
    device.set_param(p::kPartials, 0.0f);
    Stereo one = note(device, 110.0f, 2.0f);
    still(device, kHarmonic);
    device.set_param(p::kPartials, 3.0f / 7.0f);
    Stereo four = note(device, 110.0f, 2.0f);
    still(device, kHarmonic);
    Stereo eight = note(device, 110.0f, 2.0f);
    const double root_level = tone_level(one.left, 110.0, kRate, 48000);
    EXPECT(tone_level(one.left, 220.0, kRate, 48000) < 0.001 * root_level,
           "Partials 0 is the root alone");
    EXPECT(tone_level(four.left, 440.0, kRate, 48000) > 0.1 * root_level &&
               tone_level(four.left, 550.0, kRate, 48000) < 0.001 * root_level,
           "Partials at 3/7 sounds four of them");
    EXPECT(tone_level(eight.left, 880.0, kRate, 48000) > 0.05 * root_level,
           "Partials 1 sounds all eight");
    EXPECT_NEAR(rms(eight.left, 48000) / rms(one.left, 48000), 1.0, 0.05, "at the same power as one");
  }

  // Movement: every partial's level wanders over tens of seconds and the
  // spectrum never comes back; with Movement at 0 nothing moves at all.
  {
    const double ratios[8] = {1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0};
    still(device, kMajor);
    device.set_param(p::kMovement, 1.0f);
    device.set_param(p::kRate, 0.1f);
    Stereo moving = note(device, 220.0f, 121.0f);
    double least = 1.0e9;
    std::vector<std::vector<double>> levels;
    for (double ratio : ratios) {
      levels.push_back(track(moving.left, 220.0 * ratio, 1, 121));
      least = std::min(least, spread(levels.back()));
    }
    std::printf(
        "drone: with Movement 1 the steadiest partial swings by a factor of %.2f over two minutes\n",
        least);
    EXPECT(least > 2.0,
           "with Movement up, every partial's level wanders (at least 6 dB over two minutes)");

    // Slow: within one second no partial moves by more than two thirds of
    // its average level, and it takes each of them 4 to 40 s to come round.
    double fastest = 0.0, shortest = 1.0e9, longest = 0.0;
    for (const std::vector<double>& level : levels) {
      double average = 0.0;
      for (double v : level) average += v / static_cast<double>(level.size());
      std::vector<float> centred;
      for (double v : level) centred.push_back(static_cast<float>(v - average));
      for (size_t s = 1; s < level.size(); ++s)
        fastest = std::max(fastest, std::fabs(level[s] - level[s - 1]) / average);
      const double period = 1.0 / dominant_frequency(centred, 1.0, 0.01, 0.5);
      shortest = std::min(shortest, period);
      longest = std::max(longest, period);
    }
    std::printf("drone: at Rate 0.1 Hz the partials' levels come round every %.0f to %.0f s\n", shortest,
                longest);
    EXPECT(fastest < 0.67, "and slowly: no partial moves by two thirds of its level within a second");
    EXPECT(shortest > 4.0 && longest < 40.0, "each on a path that takes 4 to 40 s to come round");

    // Never periodic: the eight-partial spectrum of any second differs from
    // that of every second at least 15 s away.
    double closest = 1.0e9;
    for (size_t a = 0; a < 120; a += 3) {
      for (size_t b = a + 15; b < 120; b += 3) {
        double distance = 0.0, size = 0.0;
        for (size_t k = 0; k < 8; ++k) {
          distance += (levels[k][a] - levels[k][b]) * (levels[k][a] - levels[k][b]);
          size += levels[k][a] * levels[k][a] + levels[k][b] * levels[k][b];
        }
        closest = std::min(closest, std::sqrt(distance / (0.5 * size)));
      }
    }
    std::printf("drone: the two most alike seconds (15 s or more apart) differ by %.1f %%\n",
                100.0 * closest);
    EXPECT(closest > 0.05, "the spectrum never returns to where it was");

    // The pitch of a partial wanders by cents, not more.
    double low = 1.0e9, high = 0.0;
    for (int s = 1; s < 121; s += 4) {
      const double hz =
          dominant_frequency(moving.left, kRate, 324.0, 336.0, static_cast<size_t>(s) * 48000,
                             static_cast<size_t>(s + 2) * 48000);
      low = std::min(low, hz);
      high = std::max(high, hz);
    }
    EXPECT(cents(high, low) > 1.0 && cents(high, 330.0) < 8.0 && cents(low, 330.0) > -8.0,
           "the fifth's pitch wanders by a few cents and stays within 8 of 3/2");

    still(device, kMajor);
    Stereo steady = note(device, 220.0f, 31.0f);
    double most = 0.0;
    for (double ratio : ratios) most = std::max(most, spread(track(steady.left, 220.0 * ratio, 1, 31)));
    EXPECT(most < 1.005, "with Movement at 0 every partial is steady");

    // Rate is the speed of the wandering.
    auto turns = [&](float rate) {
      still(device, kMajor);
      device.set_param(p::kMovement, 1.0f);
      device.set_param(p::kRate, rate);
      Stereo out = note(device, 220.0f, 61.0f);
      std::vector<float> level;
      for (size_t at = 48000; at + 12000 <= out.left.size(); at += 12000) {
        level.push_back(static_cast<float>(tone_level(out.left, 330.0, kRate, at, at + 12000)));
      }
      const double m = mean(level);
      int crossings = 0;
      for (size_t i = 1; i < level.size(); ++i)
        crossings += (level[i] > m) != (level[i - 1] > m) ? 1 : 0;
      return crossings;
    };
    const int slow = turns(0.03f);
    const int fast = turns(0.5f);
    std::printf("drone: the fifth crosses its mean level %d times a minute at 0.03 Hz, %d at 0.5 Hz\n",
                slow, fast);
    EXPECT(fast > 4 * std::max(slow, 1) && fast > 20, "Rate sets how fast the partials wander");
  }

  // Wave: sine, then triangle, then sawtooth.
  {
    still(device, kUnison);
    device.set_param(p::kPartials, 0.0f);
    Stereo sine = note(device, 220.0f, 2.0f);
    still(device, kUnison);
    device.set_param(p::kPartials, 0.0f);
    device.set_param(p::kWave, 0.5f);
    Stereo triangle = note(device, 220.0f, 2.0f);
    still(device, kUnison);
    device.set_param(p::kPartials, 0.0f);
    device.set_param(p::kWave, 1.0f);
    Stereo saw = note(device, 220.0f, 2.0f);
    auto h = [&](const Stereo& out, int n) { return tone_level(out.left, 220.0 * n, kRate, 48000); };
    EXPECT(h(sine, 2) < 0.001 * h(sine, 1) && h(sine, 3) < 0.001 * h(sine, 1), "Wave 0 is a sine");
    EXPECT_NEAR(h(triangle, 3) / h(triangle, 1), 1.0 / 9.0, 0.004,
                "Wave 0.5 is a triangle: 3rd harmonic 1/9");
    EXPECT(h(triangle, 2) < 0.001 * h(triangle, 1), "with no even harmonics");
    EXPECT_NEAR(h(saw, 2) / h(saw, 1), 0.5, 0.01, "Wave 1 is a sawtooth: 2nd harmonic 1/2");
    EXPECT_NEAR(h(saw, 7) / h(saw, 1), 1.0 / 7.0, 0.005, "and 7th 1/7");
    // Power in harmonics 2..20 against the fundamental: 0, then 1.5 %, then 60 %.
    auto overtones = [&](const Stereo& out) {
      double sum = 0.0;
      for (int n = 2; n <= 20; ++n) sum += h(out, n) * h(out, n);
      return sum / (h(out, 1) * h(out, 1));
    };
    EXPECT(overtones(sine) < 1.0e-5 && overtones(triangle) > 0.012 && overtones(triangle) < 0.02 &&
               overtones(saw) > 0.5,
           "harmonic content rises along Wave");
    still(device, kUnison);
    device.set_param(p::kPartials, 0.0f);
    device.set_param(p::kWave, 0.75f);
    Stereo between = note(device, 220.0f, 2.0f);
    EXPECT(overtones(between) > 3.0 * overtones(triangle) && overtones(between) < 0.6 * overtones(saw),
           "and in between the shapes it is in between");

    // Moving Wave while a note sounds does not click.
    still(device, kUnison);
    device.set_param(p::kPartials, 0.0f);
    device.note_on(1, 220.0f, 1.0f);
    render(device, 0.5f, kRate);
    device.set_param(p::kWave, 0.5f);
    Stereo jump = render(device, 0.5f, kRate);
    EXPECT(max_step(jump.left) < 1.3 * max_step(triangle.left, 48000), "a jump of Wave does not click");

    // A high partial of a sawtooth drone does not alias: a 2.2 kHz root with
    // the harmonic series reaches 17.6 kHz.
    still(device, kHarmonic);
    device.set_param(p::kWave, 1.0f);
    Stereo high = note(device, 2217.46f, 2.0f);
    double stray = 0.0;
    for (double hz = 300.0; hz < 2000.0; hz += 37.0)
      stray = std::max(stray, tone_level(high.left, hz, kRate, 48000));
    EXPECT(stray < 0.003 * tone_level(high.left, 2217.46, kRate, 48000),
           "nothing folds back under a 2.2 kHz sawtooth root (50 dB down)");
  }

  // Sub is a sine an octave under the root.
  {
    still(device, kFifths);
    Stereo plain = note(device, 220.0f, 2.0f);
    still(device, kFifths);
    device.set_param(p::kSub, 1.0f);
    Stereo sub = note(device, 220.0f, 2.0f);
    EXPECT(tone_level(plain.left, 110.0, kRate, 48000) < 0.0005, "no octave below with Sub at 0");
    EXPECT(tone_level(sub.left, 110.0, kRate, 48000) > 0.5 * tone_level(sub.left, 220.0, kRate, 48000),
           "Sub adds the octave below the root");
  }

  // Air: noise in a band on the note, for low and high roots alike.
  {
    for (float root : {110.0f, 880.0f}) {
      still(device, kUnison);
      device.set_param(p::kWidth, 1.0f);
      Stereo dry = note(device, root, 9.0f);
      still(device, kUnison);
      device.set_param(p::kWidth, 1.0f);
      device.set_param(p::kAir, 1.0f);
      Stereo wet = note(device, root, 9.0f);
      std::vector<float> air(wet.left.size());
      for (size_t i = 0; i < air.size(); ++i) air[i] = wet.left[i] - dry.left[i];
      char label[120];
      std::snprintf(label, sizeof label, "Air adds sound at a %.0f Hz root (rms %.4f)", root,
                    rms(air, 48000));
      EXPECT(rms(air, 48000) > 0.02, label);
      // Noise, not a tone: its level in a narrow band changes from second to second.
      std::vector<double> band = track(air, root, 1, 9);
      EXPECT(spread(band) > 1.2, "it is noise: its level at the root is different every second");
      // Centred on the note: stronger there than an octave either side.
      auto band_level = [&](double hz) {
        double sum = 0.0;
        for (int k = -3; k <= 3; ++k) {
          const double level = tone_level(air, hz * std::pow(2.0, k / 36.0), kRate, 48000);
          sum += level * level;
        }
        return std::sqrt(sum);
      };
      const double on = band_level(root);
      std::snprintf(label, sizeof label,
                    "Air is centred on the %.0f Hz root (octave below %.1f dB, above %.1f dB)", root,
                    db(band_level(root * 0.5) / on), db(band_level(root * 2.0) / on));
      EXPECT(band_level(root * 0.5) < 0.35 * on && band_level(root * 2.0) < 0.35 * on, label);
      std::snprintf(label, sizeof label, "Air is as loud at %.0f Hz as anywhere (rms %.4f)", root,
                    rms(air, 48000));
      EXPECT(rms(air, 48000) > 0.04 && rms(air, 48000) < 0.16, label);
    }
  }

  // Hold is the latch.
  {
    still(device, kFifths);
    device.set_param(p::kHold, 1.0f);
    device.note_on(7, 220.0f, 1.0f);
    Stereo down = render(device, 1.0f, kRate);
    device.note_off(7);
    Stereo latched = render(device, 5.0f, kRate);
    EXPECT_NEAR(rms(latched.left, 192000) / rms(down.left, 24000), 1.0, 0.02,
                "with Hold On a released key keeps sounding at full level");
    device.note_on(7, 220.0f, 1.0f);
    Stereo second = render(device, 1.0f, kRate);
    EXPECT(peak(second.left, 24000) == 0.0 && peak(second.right, 24000) == 0.0,
           "pressing the same key again releases it to exact silence");
    device.note_off(7);
    Stereo after = render(device, 0.5f, kRate);
    EXPECT(peak(after.left) == 0.0, "and the second press starts nothing new");

    // A third press starts it again; a host that numbers every note afresh
    // is recognised by pitch.
    device.note_on(8, 220.0f, 1.0f);
    device.note_off(8);
    Stereo again = render(device, 1.0f, kRate);
    EXPECT(rms(again.left, 24000) > 0.5 * rms(down.left, 24000), "a third press starts the drone again");
    device.note_on(9, 220.0f, 1.0f);
    device.note_off(9);
    Stereo by_pitch = render(device, 1.0f, kRate);
    EXPECT(peak(by_pitch.left, 24000) == 0.0, "the same pitch under a new note id also releases it");

    // Hold Off releases what is latched, but not a key that is still down.
    still(device, kFifths);
    device.set_param(p::kHold, 1.0f);
    device.note_on(1, 220.0f, 1.0f);
    device.note_on(2, 330.0f, 1.0f);
    render(device, 0.5f, kRate);
    device.note_off(1);
    Stereo both = render(device, 2.0f, kRate);
    EXPECT(tone_level(both.left, 220.0, kRate, 48000) > 0.05 &&
               tone_level(both.left, 495.0, kRate, 48000) > 0.02,
           "two drones: one latched, one with its key down");
    device.set_param(p::kHold, 0.0f);
    Stereo off = render(device, 1.0f, kRate);
    EXPECT(tone_level(off.left, 220.0, kRate, 24000) < 1.0e-6, "Hold Off releases the latched drone");
    EXPECT(tone_level(off.left, 495.0, kRate, 24000) > 0.02, "and leaves the key that is still down");
    device.note_off(2);
    Stereo silent = render(device, 1.0f, kRate);
    EXPECT(peak(silent.left, 24000) == 0.0 && peak(silent.right, 24000) == 0.0,
           "which then releases to exact silence");

    // With Hold Off a key is a key.
    still(device, kFifths);
    device.note_on(1, 220.0f, 1.0f);
    render(device, 0.5f, kRate);
    device.note_off(1);
    Stereo plain = render(device, 1.0f, kRate);
    EXPECT(peak(plain.left, 24000) == 0.0, "with Hold Off a released key stops");
  }

  // Attack and release at long settings.
  {
    still(device, kFifths);
    device.set_param(p::kAttack, 20.0f);
    device.set_param(p::kRelease, 20.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo rise = render(device, 30.0f, kRate);
    auto second = [&](const Stereo& out, int s) {
      return rms(out.left, static_cast<size_t>(s) * 48000, static_cast<size_t>(s + 1) * 48000);
    };
    const double full = second(rise, 28);
    EXPECT(second(rise, 1) < 0.2 * full, "a 20 s attack is still quiet after 2 s");
    EXPECT(second(rise, 9) > 0.45 * full && second(rise, 9) < 0.8 * full, "about two thirds up at 10 s");
    EXPECT(second(rise, 20) > 0.98 * full, "and has arrived at 20 s");
    device.note_off(1);
    Stereo fall = render(device, 40.0f, kRate);
    EXPECT_NEAR(db(second(fall, 10) / full), -31.5, 2.0, "a 20 s release is 30 dB down at 10 s");
    EXPECT_NEAR(db(second(fall, 20) / full), -61.5, 2.0, "60 dB down at 20 s");
    EXPECT(peak(fall.left, 36 * 48000) == 0.0 && peak(fall.right, 36 * 48000) == 0.0,
           "and exactly silent once it has ended");

    still(device, kFifths);
    device.set_param(p::kAttack, 30.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo longest = render(device, 34.0f, kRate);
    EXPECT(second(longest, 14) < 0.85 * second(longest, 32) &&
               second(longest, 30) > 0.98 * second(longest, 32),
           "the 30 s attack takes its 30 s");
  }

  // Width: mono at 0, partials and air spread at 1.
  {
    device.init(kRate);
    device.set_param(p::kWidth, 0.0f);
    device.set_param(p::kAir, 0.5f);
    device.note_on(1, 110.0f, 0.8f);
    Stereo mono = render(device, 6.0f, kRate);
    EXPECT(mono.left == mono.right, "Width 0 is mono, air included");

    device.init(kRate);
    device.set_param(p::kWidth, 1.0f);
    device.set_param(p::kAir, 0.5f);
    device.note_on(1, 110.0f, 0.8f);
    Stereo wide = render(device, 30.0f, kRate);
    const double side = correlation(wide.left, wide.right, 6 * 48000);
    std::printf("drone: left/right correlation at Width 1 is %.2f\n", side);
    EXPECT(side < 0.75, "Width 1 decorrelates left and right");
    EXPECT_NEAR(rms(wide.left, 6 * 48000) / rms(wide.right, 6 * 48000), 1.0, 0.25,
                "and keeps the sides balanced");

    // Each partial has its own place, and Movement shifts it.
    still(device, kFifths);
    device.set_param(p::kWidth, 1.0f);
    Stereo placed = note(device, 110.0f, 3.0f);
    const double lean_fifth =
        tone_level(placed.left, 165.0, kRate, 48000) / tone_level(placed.right, 165.0, kRate, 48000);
    const double lean_octave =
        tone_level(placed.left, 220.0, kRate, 48000) / tone_level(placed.right, 220.0, kRate, 48000);
    EXPECT(lean_fifth > 1.5 && lean_octave < 0.67, "partials sit on different sides");
    EXPECT_NEAR(
        tone_level(placed.left, 110.0, kRate, 48000) / tone_level(placed.right, 110.0, kRate, 48000),
        1.0, 0.01, "with the root in the centre");
  }

  // Cutoff is a low-pass over everything, and wanders a little with Movement.
  {
    still(device, kHarmonic);
    device.set_param(p::kWave, 1.0f);
    Stereo open = note(device, 110.0f, 2.0f);
    still(device, kHarmonic);
    device.set_param(p::kWave, 1.0f);
    device.set_param(p::kCutoff, 300.0f);
    Stereo dark = note(device, 110.0f, 2.0f);
    EXPECT(
        tone_level(dark.left, 2200.0, kRate, 48000) < 0.03 * tone_level(open.left, 2200.0, kRate, 48000),
        "Cutoff at 300 Hz removes 2.2 kHz");
    EXPECT(tone_level(dark.left, 110.0, kRate, 48000) > 0.9 * tone_level(open.left, 110.0, kRate, 48000),
           "and leaves the root");

    // One sawtooth partial: Movement changes its level but not its shape, so
    // the 8th harmonic against the 1st shows the filter alone.
    auto tilt = [&](float movement) {
      still(device, kUnison);
      device.set_param(p::kPartials, 0.0f);
      device.set_param(p::kWave, 1.0f);
      device.set_param(p::kCutoff, 600.0f);
      device.set_param(p::kMovement, movement);
      device.set_param(p::kRate, 0.5f);
      Stereo out = note(device, 110.0f, 41.0f);
      double lo = 1.0e9, hi = 0.0;
      for (int s = 1; s < 41; ++s) {
        const size_t at = static_cast<size_t>(s) * 48000;
        const double ratio = tone_level(out.left, 880.0, kRate, at, at + 12000) /
                             tone_level(out.left, 110.0, kRate, at, at + 12000);
        lo = std::min(lo, ratio);
        hi = std::max(hi, ratio);
      }
      return hi / lo;
    };
    const double wandering = tilt(1.0f);
    std::printf("drone: the low-pass moves the 8th harmonic by a factor of %.2f with Movement 1\n",
                wandering);
    EXPECT(wandering > 1.5 && wandering < 3.0,
           "the low-pass wanders by a fraction of an octave with Movement");
    EXPECT(tilt(0.0f) < 1.01, "and stands still without it");
  }

  // Levels: one key sits at a sane level, six held keys stay under the clip
  // knee over a minute of wandering, and loudness follows velocity.
  {
    device.init(kRate);
    device.note_on(1, 220.0f, 0.7f);
    Stereo one = render(device, 40.0f, kRate);
    const double level_db = db(std::max(peak(one.left, 5 * 48000), peak(one.right, 5 * 48000)));
    std::printf("drone: one key at the default patch peaks at %.1f dBFS\n", level_db);
    EXPECT(level_db > -24.0 && level_db < -10.0,
           "one key at velocity 0.7 peaks between -24 and -10 dBFS");

    device.init(kRate);
    const float chord[6] = {55.0f, 82.41f, 110.0f, 164.81f, 220.0f, 277.18f};
    for (int n = 0; n < 6; ++n) device.note_on(n, chord[n], 0.8f);
    Stereo six = render(device, 60.0f, kRate);
    std::printf("drone: six keys peak at %.2f\n", std::max(peak(six.left), peak(six.right)));
    EXPECT(peak(six.left) < 0.5 && peak(six.right) < 0.5, "six held keys stay under the clip knee");

    still(device, kFifths);
    device.note_on(1, 220.0f, 1.0f);
    Stereo loud = render(device, 1.0f, kRate);
    still(device, kFifths);
    device.note_on(1, 220.0f, 0.1f);
    Stereo soft = render(device, 1.0f, kRate);
    EXPECT(rms(soft.left, 24000) < 0.6 * rms(loud.left, 24000), "soft keys are quieter");

    still(device, kFifths);
    device.set_param(p::kVolume, -20.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo quiet = render(device, 1.0f, kRate);
    EXPECT_NEAR(rms(quiet.left, 24000) / rms(loud.left, 24000), 0.1, 0.002, "Volume is in decibels");
  }

  // Cost: the default patch with eight keys, then the heaviest setting.
  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  report_cost("drone (8 keys, default patch)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });
  device.init(kRate);
  device.set_param(p::kPartials, 1.0f);
  device.set_param(p::kWave, 0.75f);
  device.set_param(p::kAir, 1.0f);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  report_cost("drone (8 keys, all 64 partials, air)", 10.0f, kRate,
              [&] { render(device, 10.0f, kRate); });

  return finish("drone");
}
