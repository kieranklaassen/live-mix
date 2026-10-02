// Native harness for Guitar (cpp/devices/guitar): what makes it an electric
// guitar and not a plucked synth, each as a measurement.
#include "../devices/guitar/guitar.h"

#include <algorithm>
#include <complex>

#include "support/test_kit.h"

using namespace testkit;
using livemix::Guitar;
namespace p = livemix::guitar;

static Guitar device;
static const float kRate = 48000.0f;

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }
static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

// A guitar with nothing left to chance: no strum, every pluck exact.
static void bare(float rate = kRate) {
  device.init(rate);
  device.set_param(p::kStrum, 0.0f);
  device.set_variation(0.0f);
}

// One note on a bare guitar, rendered for `seconds`.
static std::vector<float> note(float hz, float gain, float seconds, float rate = kRate) {
  device.note_on(1, hz, gain);
  return render(device, seconds, rate).left;
}

// The strongest frequency within `span` cents of `hz`, to a hundredth of a
// cent: a coarse scan and three finer ones.
static double partial_near(const std::vector<float>& x, double hz, double rate, size_t from, size_t to,
                           double span = 50.0) {
  double best_hz = hz, best = -1.0;
  for (int pass = 0; pass < 4; ++pass) {
    const double centre = best_hz;
    for (int i = -10; i <= 10; ++i) {
      const double candidate = centre * std::pow(2.0, span * i / 12000.0);
      const double level = tone_level(x, candidate, rate, from, to);
      if (level > best) {
        best = level;
        best_hz = candidate;
      }
    }
    span /= 8.0;
  }
  return best_hz;
}

// Level in dB of harmonic `k` of `hz` over [from, to).
static double harmonic_db(const std::vector<float>& x, double hz, int k, size_t from, size_t to) {
  return db(tone_level(x, hz * k, kRate, from, to));
}

// Seconds for the component at `hz` to fall 60 dB, from its level in two
// windows of `window` seconds starting at `first` and `second`.
static double t60_of(const std::vector<float>& x, double hz, double first, double second, double window) {
  const double early = db(tone_level(x, hz, kRate, at(first), at(first + window)));
  const double late = db(tone_level(x, hz, kRate, at(second), at(second + window)));
  return early > late ? 60.0 * (second - first) / (early - late) : 1.0e9;
}

// Power spectrum (Hann) of n samples from `from`; n is a power of two.
static std::vector<double> power_spectrum(const std::vector<float>& x, size_t from, size_t n) {
  std::vector<std::complex<double>> a(n);
  for (size_t i = 0; i < n; ++i) {
    const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n));
    a[i] = from + i < x.size() ? w * x[from + i] : 0.0;
  }
  for (size_t i = 1, j = 0; i < n; ++i) {
    size_t bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) std::swap(a[i], a[j]);
  }
  for (size_t len = 2; len <= n; len <<= 1) {
    const std::complex<double> step = std::polar(1.0, -2.0 * kPi / static_cast<double>(len));
    for (size_t i = 0; i < n; i += len) {
      std::complex<double> w = 1.0;
      for (size_t k = 0; k < len / 2; ++k) {
        const std::complex<double> u = a[i + k], v = a[i + k + len / 2] * w;
        a[i + k] = u + v;
        a[i + k + len / 2] = u - v;
        w *= step;
      }
    }
  }
  std::vector<double> power(n / 2);
  for (size_t i = 0; i < n / 2; ++i) power[i] = std::norm(a[i]);
  return power;
}

// Energy in dB between two frequencies of a power spectrum of size 2 * |power|.
static double band_db(const std::vector<double>& power, double rate, double lo, double hi) {
  const double bin = rate / (2.0 * static_cast<double>(power.size()));
  double sum = 0.0;
  for (size_t i = 1; i < power.size(); ++i) {
    const double f = static_cast<double>(i) * bin;
    if (f >= lo && f < hi) sum += power[i];
  }
  return 10.0 * std::log10(std::max(sum, 1.0e-30));
}

static void test_conformance() {
  Conformance spec;
  spec.name = "guitar";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 1.5f;  // a damped string, not a release envelope
  spec.max_peak = 1.01f;     // the soft clip's ceiling
  check_instrument(device, spec, kRate);
}

// In tune from C2 to C6 at every rate, whatever the pick, and the two
// polarisations sit either side of the note.
static void test_tuning() {
  double worst = 0.0;
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    for (float hardness : {0.0f, 1.0f}) {
      for (float hz : {65.406f, 82.407f, 220.0f, 329.628f, 523.251f, 1046.502f}) {
        bare(rate);
        device.set_param(p::kShimmer, 0.0f);
        device.set_param(p::kHardness, hardness);
        const std::vector<float> out = note(hz, 0.7f, 0.65f, rate);
        const double got = partial_near(out, hz, rate, at(0.05, rate), out.size());
        worst = std::max(worst, std::fabs(cents(got, hz)));
      }
    }
  }
  std::printf("  tuning: worst error %.2f cents (C2 to C6, 44.1/48/96 kHz, soft and hard pick)\n", worst);
  EXPECT(worst < 3.0, "in tune within 3 cents from C2 to C6 at every sample rate");

  // The two polarisations of A2, as far apart as Shimmer goes and ringing
  // long enough to tell them apart.
  bare();
  device.set_param(p::kShimmer, 1.5f);
  device.set_param(p::kSustain, 30.0f);
  const std::vector<float> wide = note(110.0f, 0.7f, 10.0f);
  const double low = partial_near(wide, 109.25, kRate, at(0.5), wide.size(), 8.0);
  const double high = partial_near(wide, 110.75, kRate, at(0.5), wide.size(), 8.0);
  std::printf("  A2 at Shimmer 1.5 Hz: polarisations at %.3f and %.3f Hz, centre %.2f cents from the note\n", low,
              high, cents(0.5 * (low + high), 110.0));
  EXPECT_NEAR(high - low, 1.5, 0.15, "the polarisations are a Shimmer apart");
  EXPECT(std::fabs(cents(0.5 * (low + high), 110.0)) < 3.0, "and the note is their centre");

  // At the default Shimmer the pitch heard stays on the note.
  bare();
  const std::vector<float> plain = note(110.0f, 0.7f, 1.0f);
  const double heard = partial_near(plain, 110.0, kRate, at(0.05), plain.size());
  std::printf("  A2 at the default Shimmer: %.2f cents from the note\n", cents(heard, 110.0));
  EXPECT(std::fabs(cents(heard, 110.0)) < 3.0, "the default patch is in tune");
}

// The pickup is fixed to the body, so the partial it cannot hear changes with
// the fret: this is what no fixed equaliser does.
static void test_pickup() {
  struct Case {
    float hz;
    int missing;
    const char* name;
  };
  // The high E string under the neck pickup, a quarter of the open string
  // from the bridge: open, fifth fret, twelfth fret.
  const Case cases[] = {{329.628f, 4, "open E4"}, {440.0f, 3, "A4, fret 5"}, {659.255f, 2, "E5, fret 12"}};
  for (const Case& c : cases) {
    bare();
    device.set_param(p::kPickup, 1.0f);
    device.set_param(p::kPosition, 0.07f);  // the pick's own comb out of the way
    device.set_param(p::kShimmer, 0.0f);
    const std::vector<float> out = note(c.hz, 0.4f, 0.3f);
    const double below = harmonic_db(out, c.hz, c.missing - 1, at(0.01), at(0.11));
    const double null = harmonic_db(out, c.hz, c.missing, at(0.01), at(0.11));
    const double above = harmonic_db(out, c.hz, c.missing + 1, at(0.01), at(0.11));
    std::printf("  neck pickup, %s: harmonic %d is %.1f dB under %d and %.1f dB under %d\n", c.name, c.missing,
                below - null, c.missing - 1, above - null, c.missing + 1);
    char label[120];
    std::snprintf(label, sizeof label, "neck pickup, %s: harmonic %d is missing", c.name, c.missing);
    EXPECT(below - null > 12.0 && above - null > 12.0, label);
  }
  // The same harmonic of the same note comes back under the bridge pickup.
  bare();
  device.set_param(p::kPickup, 0.0f);
  device.set_param(p::kShimmer, 0.0f);
  const std::vector<float> bridge = note(329.628f, 0.4f, 0.5f);
  const double third = harmonic_db(bridge, 329.628, 3, at(0.05), at(0.45));
  const double fourth = harmonic_db(bridge, 329.628, 4, at(0.05), at(0.45));
  const double fifth = harmonic_db(bridge, 329.628, 5, at(0.05), at(0.45));
  std::printf("  bridge pickup, open E4: harmonic 4 is %.1f dB against 3 and %.1f dB against 5\n", fourth - third,
              fourth - fifth);
  EXPECT(fourth > std::min(third, fifth) - 6.0, "the bridge pickup hears the harmonic the neck pickup cannot");

  // Another string, another comb: under the same pickup the open low E
  // loses 330 Hz and the open A loses 440 Hz.
  bare();
  device.set_param(p::kPickup, 1.0f);
  const std::vector<float> low_e = note(82.407f, 0.4f, 0.6f);
  bare();
  device.set_param(p::kPickup, 1.0f);
  const std::vector<float> a2 = note(110.0f, 0.4f, 0.6f);
  const double e_null =
      harmonic_db(low_e, 82.407, 3, at(0.05), at(0.55)) - harmonic_db(low_e, 82.407, 4, at(0.05), at(0.55));
  const double a_null =
      harmonic_db(a2, 110.0, 3, at(0.05), at(0.55)) - harmonic_db(a2, 110.0, 4, at(0.05), at(0.55));
  std::printf("  neck pickup: harmonic 4 is %.1f dB under 3 on the open low E, %.1f dB on the open A\n", e_null,
              a_null);
  EXPECT(e_null > 12.0 && a_null > 12.0, "each string has its own comb, at its own frequencies");

  // The bridge pickup is thinner and brighter than the neck pickup.
  double bright[2];
  for (int i = 0; i < 2; ++i) {
    bare();
    device.set_param(p::kPickup, static_cast<float>(i));
    const std::vector<float> out = note(146.832f, 0.7f, 0.5f);
    bright[i] = energy_above(out, 1000.0, kRate, at(0.02), at(0.4));
  }
  std::printf("  share of energy over 1 kHz, open D: bridge %.3f, neck %.3f\n", bright[0], bright[1]);
  EXPECT(bright[0] > 2.0 * bright[1], "the bridge pickup is brighter than the neck pickup");
}

// Picked a fifth of the way along, the string has no fifth harmonic.
static void test_pick() {
  bare();
  device.set_param(p::kPickup, 0.0f);
  device.set_param(p::kPosition, 0.2f);
  device.set_param(p::kShimmer, 0.0f);
  const std::vector<float> out = note(82.407f, 0.4f, 0.3f);
  for (int missing : {5, 10}) {
    const double below = harmonic_db(out, 82.407, missing - 1, at(0.005), at(0.105));
    const double null = harmonic_db(out, 82.407, missing, at(0.005), at(0.105));
    const double above = harmonic_db(out, 82.407, missing + 1, at(0.005), at(0.105));
    std::printf("  picked at a fifth of the open low E: harmonic %d is %.1f dB under %d and %.1f dB under %d\n",
                missing, below - null, missing - 1, above - null, missing + 1);
    EXPECT(below - null > 15.0 && above - null > 15.0,
           "the pick's place takes out the harmonics with a node there");
  }

  // The pick stays over the body: at the fifth fret the same Position is a
  // larger share of the string, and the missing harmonic moves down.
  bare();
  device.set_param(p::kPickup, 0.0f);
  device.set_param(p::kPosition, 0.25f);
  device.set_param(p::kShimmer, 0.0f);
  const std::vector<float> open = note(329.628f, 0.4f, 0.3f);
  bare();
  device.set_param(p::kPickup, 0.0f);
  device.set_param(p::kPosition, 0.25f);
  device.set_param(p::kShimmer, 0.0f);
  const std::vector<float> fretted = note(440.0f, 0.4f, 0.3f);
  const double open_null =
      harmonic_db(open, 329.628, 3, at(0.005), at(0.105)) - harmonic_db(open, 329.628, 4, at(0.005), at(0.105));
  const double fret_null =
      harmonic_db(fretted, 440.0, 2, at(0.005), at(0.105)) - harmonic_db(fretted, 440.0, 3, at(0.005), at(0.105));
  std::printf(
      "  picked at a quarter of the open string: harmonic 4 of E4 is %.1f dB under 3, harmonic 3 of A4 %.1f dB "
      "under 2\n",
      open_null, fret_null);
  EXPECT(open_null > 15.0 && fret_null > 15.0, "the pick's place follows the fret");

  // A harder pick is brighter; a softer stroke is quieter and darker.
  double bright[2];
  for (int i = 0; i < 2; ++i) {
    bare();
    device.set_param(p::kHardness, static_cast<float>(i));
    const std::vector<float> hard = note(146.832f, 0.7f, 0.3f);
    bright[i] = energy_above(hard, 1500.0, kRate, 0, at(0.06));
  }
  std::printf("  share of energy over 1.5 kHz: soft pick %.4f, hard pick %.4f\n", bright[0], bright[1]);
  EXPECT(bright[1] > 2.5 * bright[0], "Hardness brightens the attack");
  bare();
  const std::vector<float> soft = note(220.0f, 0.3f, 0.3f);
  bare();
  const std::vector<float> loud = note(220.0f, 0.9f, 0.3f);
  const double soft_bright = energy_above(soft, 1500.0, kRate, 0, at(0.2));
  const double loud_bright = energy_above(loud, 1500.0, kRate, 0, at(0.2));
  std::printf("  soft stroke: %.1f dB under a hard one, %.4f of its energy over 1.5 kHz against %.4f\n",
              db(rms(loud, 0, at(0.2))) - db(rms(soft, 0, at(0.2))), soft_bright, loud_bright);
  EXPECT(rms(soft, 0, at(0.2)) < 0.6 * rms(loud, 0, at(0.2)), "a soft stroke is quieter");
  EXPECT(soft_bright < 0.8 * loud_bright, "and darker");

  // No two strokes are the same, but they are the same loudness.
  device.init(kRate);
  device.set_param(p::kStrum, 0.0f);
  device.note_on(1, 220.0f, 0.7f);
  const std::vector<float> first = render(device, 0.4f, kRate).left;
  device.note_off(1);
  render(device, 1.5f, kRate);
  device.note_on(1, 220.0f, 0.7f);
  const std::vector<float> second = render(device, 0.4f, kRate).left;
  double difference = 0.0;
  for (size_t i = 0; i < first.size(); ++i) difference += std::pow(static_cast<double>(first[i]) - second[i], 2.0);
  difference = std::sqrt(difference / static_cast<double>(first.size())) / rms(first);
  const double level = db(rms(second)) - db(rms(first));
  std::printf("  two strokes of one note: they differ by %.1f%% of their level, %.2f dB apart in loudness\n",
              100.0 * difference, level);
  EXPECT(difference > 0.02, "repeated notes are not copies");
  EXPECT(std::fabs(level) < 3.0, "but they are as loud as each other");
}

// Every partial has its own decay time, so a note darkens as it dies; and
// the note is two polarisations, so it falls fast, then slowly, and beats.
static void test_decay() {
  // The tail of the fundamental takes the time the law gives, to the top of
  // the neck. Measured once the faster polarisation is out of the way. At A2
  // the law is the Sustain time itself.
  EXPECT_NEAR(Guitar::sustain_seconds(110.0f, 3.0f), 3.0, 1.0e-4, "at A2 the law is Sustain itself");
  for (float hz : {82.407f, 110.0f, 220.0f, 659.255f, 1318.51f, 2093.005f}) {
    bare();
    device.set_param(p::kSustain, 3.0f);
    device.set_param(p::kShimmer, 0.0f);
    const double law = Guitar::sustain_seconds(hz, 3.0f);
    const std::vector<float> out = note(hz, 0.8f, static_cast<float>(law) + 0.2f);
    const double window = std::max(0.08, 12.0 / hz);
    const double got = t60_of(out, hz, 0.68 * law, 0.92 * law - window, window);
    std::printf("  tail of %.0f Hz at Sustain 3 s: %.2f s to fall 60 dB, the law gives %.2f s\n", hz, got, law);
    EXPECT_NEAR(got / law, 1.0, 0.15, "the fundamental's tail lasts as long as Sustain says, scaled by pitch");
  }

  // Sustain all the way up: a low note is still there a quarter of a minute on.
  bare();
  device.set_param(p::kSustain, 30.0f);
  device.set_param(p::kShimmer, 0.0f);
  const std::vector<float> long_note = note(82.407f, 0.8f, 16.0f);
  const double start = db(tone_level(long_note, 82.407, kRate, at(0.1), at(0.6)));
  const double late = db(tone_level(long_note, 82.407, kRate, at(15.0), at(16.0)));
  const double long_t60 = t60_of(long_note, 82.407, 8.0, 15.0, 1.0);
  std::printf("  low E at Sustain 30 s: %.1f dB down after 15 s, falling 60 dB in %.1f s\n", start - late,
              long_t60);
  EXPECT(start - late < 45.0 && long_t60 > 15.0, "a long Sustain rings for well over 15 s");

  // The eighth partial of the low E dies several times sooner than its
  // fundamental, but is no click: it rings for seconds.
  bare();
  device.set_param(p::kShimmer, 0.0f);
  const std::vector<float> low = note(82.407f, 0.8f, 2.2f);
  const double eighth_hz = partial_near(low, 8.0 * 82.407, kRate, at(0.05), at(0.55), 30.0);
  const double fundamental = t60_of(low, 82.407, 0.1, 1.6, 0.5);
  const double eighth = t60_of(low, eighth_hz, 0.1, 1.6, 0.5);
  std::printf("  low E: fundamental %.1f s, partial 8 %.1f s to fall 60 dB (%.0f%%)\n", fundamental, eighth,
              100.0 * eighth / fundamental);
  EXPECT(eighth > 0.15 * fundamental && eighth < 0.6 * fundamental,
         "a high partial rings for a fraction of the fundamental's time");

  // So the note darkens: the centre of its spectrum falls window by window.
  double centroid[4];
  double top[4];
  for (int w = 0; w < 4; ++w) {
    const std::vector<double> power = power_spectrum(low, at(0.02 + 0.25 * w), 8192);
    top[w] = band_db(power, kRate, 1000.0, 6000.0) - band_db(power, kRate, 20.0, 1000.0);
    double weighted = 0.0, total = 0.0;
    for (size_t i = 1; i < power.size(); ++i) {
      weighted += power[i] * static_cast<double>(i) * kRate / 8192.0;
      total += power[i];
    }
    centroid[w] = weighted / total;
  }
  std::printf("  low E: spectral centroid %.0f, %.0f, %.0f, %.0f Hz over four 250 ms steps\n", centroid[0],
              centroid[1], centroid[2], centroid[3]);
  EXPECT(centroid[0] > centroid[1] && centroid[1] > centroid[2] && centroid[2] > centroid[3],
         "the note darkens as it dies");
  std::printf("  low E: 1 to 6 kHz against everything under 1 kHz: %.1f, %.1f, %.1f, %.1f dB\n", top[0], top[1],
              top[2], top[3]);
  EXPECT(top[0] > top[3] + 10.0, "its top falls 10 dB further than the rest in the first second");

  // Two stages: steeper in the first second than in the fourth.
  bare();
  device.set_param(p::kShimmer, 0.0f);
  const std::vector<float> a2 = note(110.0f, 0.8f, 4.6f);
  const double first =
      db(tone_level(a2, 110.0, kRate, at(0.1), at(0.5))) - db(tone_level(a2, 110.0, kRate, at(1.1), at(1.5)));
  const double fourth =
      db(tone_level(a2, 110.0, kRate, at(3.1), at(3.5))) - db(tone_level(a2, 110.0, kRate, at(4.1), at(4.5)));
  std::printf("  A2: falls %.1f dB in its first second, %.1f dB in its fourth\n", first, fourth);
  EXPECT(first > 1.25 * fourth, "the note falls fast at first, then slowly");

  // The polarisations beat at the Shimmer rate, and not at all at zero.
  double ripple[2] = {0.0, 0.0};
  double period = 0.0;
  for (int pass = 0; pass < 2; ++pass) {
    bare();
    device.set_param(p::kShimmer, pass == 0 ? 0.0f : 1.0f);
    const std::vector<float> out = note(110.0f, 0.8f, 5.2f);
    const double hop = 0.025;
    std::vector<double> level;
    for (double t = 0.1; t + 0.1 <= 5.1; t += hop)
      level.push_back(db(tone_level(out, 110.0, kRate, at(t), at(t + 0.1))));
    // Against the same curve half a second either side: a beat of a second
    // shows whole, a plain decay not at all.
    const size_t half = 20;
    std::vector<double> wobble(level.size(), 0.0);
    for (size_t k = half; k + half < level.size(); ++k) {
      wobble[k] = level[k] - 0.5 * (level[k - half] + level[k + half]);
      ripple[pass] = std::max(ripple[pass], std::fabs(wobble[k]));
    }
    if (pass == 1) {
      // Troughs: the lowest point within a third of a second either way.
      std::vector<double> troughs;
      const size_t reach = 13;
      for (size_t k = reach; k + reach < level.size(); ++k) {
        bool lowest = true;
        for (size_t j = k - reach; j <= k + reach; ++j) {
          if (j != k && level[j] <= level[k]) lowest = false;
        }
        if (lowest) troughs.push_back(static_cast<double>(k) * hop);
      }
      if (troughs.size() >= 2)
        period = (troughs.back() - troughs.front()) / static_cast<double>(troughs.size() - 1);
      std::printf("  A2 at Shimmer 1 Hz: %zu troughs, %.3f s apart; the level swings %.1f dB\n", troughs.size(),
                  period, ripple[1]);
    }
  }
  std::printf("  A2 at Shimmer 0: the level swings %.2f dB\n", ripple[0]);
  EXPECT_NEAR(period, 1.0, 0.2, "the string beats against itself at the Shimmer rate");
  EXPECT(ripple[1] > 3.0, "and the beat is deep enough to hear");
  EXPECT(ripple[0] < 0.5, "with Shimmer at zero there is no beat");

  // A stiff string: its partials run sharp, as the wound low E's do.
  const double stretch = cents(eighth_hz, 8.0 * 82.407);
  const double b = Guitar::stiffness(82.407f);
  const double law = cents(std::sqrt((1.0 + 64.0 * b) / (1.0 + b)), 1.0);
  std::printf("  low E: partial 8 is %.2f cents sharp of eight times the fundamental, the law gives %.2f\n",
              stretch, law);
  EXPECT(stretch > 3.0, "the partials of the low E run sharp");
  EXPECT_NEAR(stretch, law, 3.0, "by what a stiff string's law gives");
}

// Six-string behaviour: a note struck again is the same string picked again,
// key up is a finger laid on the string, and a taken string does not click.
static void test_playing() {
  // One strike, for reference.
  bare();
  const std::vector<float> once = note(220.0f, 0.8f, 0.7f);
  const double once_peak = peak(once);
  const double once_step = max_step(once);

  // The same key again, and another key at the same pitch.
  for (int other = 0; other < 2; ++other) {
    bare();
    device.note_on(1, 220.0f, 0.8f);
    Stereo out = render(device, 0.2f, kRate);
    device.note_on(other == 0 ? 1 : 2, 220.0f, 0.8f);
    out = concat(out, render(device, 0.5f, kRate));
    const double again_peak = peak(out.left, at(0.2), out.left.size());
    const double again_step = max_step(out.left, at(0.2) - 1, out.left.size());
    // 8 ms for the pick to land, then the same 0.25 to 0.5 s of the note.
    const size_t shift = at(0.2) + at(0.008);
    const double again_level = rms(out.left, shift + at(0.25), shift + at(0.5) - at(0.21));
    const double once_same = rms(once, at(0.25), at(0.5) - at(0.21));
    std::printf("  %s: peak %+.2f dB, largest step %.2f of a first strike's, level %+.2f dB\n",
                other == 0 ? "the same key again" : "another key at the same pitch",
                db(again_peak) - db(once_peak), again_step / once_step, db(again_level) - db(once_same));
    EXPECT(db(again_peak) - db(once_peak) < 3.0, "a note struck again does not double");
    EXPECT(std::fabs(db(again_level) - db(once_same)) < 1.0, "it is one string, picked again");
    EXPECT(again_step <= 1.02 * once_step, "the pick lands on a moving string without a click");
    device.note_off(other == 0 ? 1 : 2);
    render(device, 1.5f, kRate);
    EXPECT(peak(render(device, 0.25f, kRate).left) == 0.0, "and one key up silences it");
  }

  // Key up: 40 dB in 200 ms, the top first, no click, then nothing at all.
  bare();
  device.set_param(p::kHardness, 0.8f);
  device.note_on(1, 110.0f, 0.8f);
  Stereo held = render(device, 0.25f, kRate);
  device.note_off(1);
  Stereo all = concat(held, render(device, 1.5f, kRate));
  const size_t up = held.left.size();
  const double before = db(rms(all.left, up - at(0.02), up));
  const double after = db(rms(all.left, up + at(0.2), up + at(0.22)));
  // The same signal over 2 kHz.
  livemix::kit::Biquad highpass[2];
  std::vector<float> high(all.left.size());
  for (livemix::kit::Biquad& stage : highpass) {
    stage.reset();
    stage.set_highpass(2000.0f, 0.707f, kRate);
  }
  for (size_t i = 0; i < high.size(); ++i) high[i] = highpass[1].process(highpass[0].process(all.left[i]));
  auto fall_time = [&](const std::vector<float>& x, double drop) {
    const double start = db(rms(x, up - at(0.01), up));
    for (size_t i = up; i + at(0.005) < x.size(); i += at(0.001)) {
      if (db(rms(x, i, i + at(0.005))) < start - drop) return static_cast<double>(i - up) / kRate;
    }
    return 1.0e9;
  };
  const double high_fall = fall_time(high, 20.0);
  const double all_fall = fall_time(all.left, 20.0);
  const double up_step = max_step(all.left, up - 1, all.left.size());
  const double held_step = max_step(all.left, up - at(0.1), up);
  size_t last = all.left.size();
  while (last > up && all.left[last - 1] == 0.0f) --last;
  std::printf("  key up: %.1f dB down after 200 ms; 20 dB down in %.0f ms over 2 kHz, %.0f ms in all\n",
              before - after, 1000.0 * high_fall, 1000.0 * all_fall);
  std::printf("  key up: largest step %.2f of the held note's; exact silence %.0f ms after\n", up_step / held_step,
              1000.0 * static_cast<double>(last - up) / kRate);
  EXPECT(before - after > 40.0, "key up damps the string 40 dB within 200 ms");
  EXPECT(high_fall < all_fall, "the top goes first, as under a finger");
  EXPECT(up_step <= held_step, "the damp does not click");
  EXPECT(last < all.left.size() - at(0.25), "the output is exactly zero soon after");

  // The thirteenth note takes the quietest string, and that makes no click.
  auto pile = [&](bool thirteenth, bool ringing) {
    bare();
    Stereo out;
    for (int n = 0; n < 12; ++n) {
      if (ringing) device.note_on(n, 98.0f * std::pow(2.0f, static_cast<float>(n) * 3.0f / 12.0f), 0.7f);
      out = render(device, 0.05f, kRate);
    }
    if (thirteenth) device.note_on(12, 185.0f, 0.7f);
    return render(device, 0.1f, kRate).left;
  };
  const double both = max_step(pile(true, true));
  const double ring = max_step(pile(false, true));
  const double alone = max_step(pile(true, false));
  std::printf("  a 13th note: largest step %.4f; the 12 ringing %.4f, the new note alone %.4f\n", both, ring,
              alone);
  EXPECT(both < 1.1 * (ring + alone), "taking a string for a 13th note adds no click of its own");

  // With every string in use and one of them let go, the next note takes
  // that one: the eleven still held ring on as if nothing had been played.
  auto full = [&](bool another) {
    bare();
    device.set_param(p::kShimmer, 0.0f);
    for (int n = 0; n < 12; ++n) {
      device.note_on(n, 98.0f * std::pow(2.0f, static_cast<float>(n) * 3.0f / 12.0f), 0.7f);
      render(device, 0.05f, kRate);
    }
    device.note_off(11);
    if (another) device.note_on(12, 1479.978f, 0.7f);
    return render(device, 0.3f, kRate).left;
  };
  const std::vector<float> taken = full(true);
  const std::vector<float> untaken = full(false);
  double disturbed = 0.0;
  for (int n = 0; n < 11; ++n) {
    const double hz = 98.0 * std::pow(2.0, static_cast<double>(n) * 3.0 / 12.0);
    disturbed = std::max(disturbed, std::fabs(db(tone_level(taken, hz, kRate, at(0.05), at(0.25))) -
                                              db(tone_level(untaken, hz, kRate, at(0.05), at(0.25)))));
  }
  std::printf("  a 13th note with one string let go: the 11 held notes move by at most %.2f dB\n", disturbed);
  EXPECT(disturbed < 1.0, "a new note takes a string that was let go before one still held");

  // A held note that has rung out lets go of its string by itself.
  bare();
  device.set_param(p::kSustain, 1.0f);
  device.note_on(1, 1046.502f, 0.8f);
  render(device, 2.0f, kRate);
  EXPECT(peak(render(device, 0.25f, kRate).left) == 0.0,
         "a note held until it has died leaves exact silence, key still down");

  // The same performance in blocks of 1, of 128 and of ragged sizes.
  auto perform = [&](int pattern) {
    static const int ragged[] = {1, 7, 128, 33, 64, 2, 19};
    bare();
    device.set_param(p::kStrum, 40.0f);
    std::vector<float> out;
    int step = 0;
    for (int stage = 0; stage < 3; ++stage) {
      if (stage == 0) {
        device.note_on(1, 329.628f, 0.8f);
        device.note_on(2, 110.0f, 0.7f);
        device.note_on(3, 220.0f, 0.6f);
      } else if (stage == 1) {
        device.note_on(3, 220.0f, 0.9f);
        device.note_off(2);
      } else {
        device.note_off(1);
        device.note_off(3);
      }
      int left = 9600;
      while (left > 0) {
        int frames = pattern == 0 ? 1 : pattern == 1 ? 128 : ragged[step++ % 7];
        frames = std::min(frames, left);
        device.process(frames);
        out.insert(out.end(), device.out_left(), device.out_left() + frames);
        left -= frames;
      }
    }
    return out;
  };
  const std::vector<float> by_one = perform(0);
  const std::vector<float> by_block = perform(1);
  const std::vector<float> by_ragged = perform(2);
  double apart = 0.0;
  for (size_t i = 0; i < by_one.size(); ++i) {
    apart = std::max(apart, std::fabs(static_cast<double>(by_one[i]) - by_block[i]));
    apart = std::max(apart, std::fabs(static_cast<double>(by_one[i]) - by_ragged[i]));
  }
  std::printf("  blocks of 1, 128 and ragged sizes: outputs differ by at most %g\n", apart);
  EXPECT(apart < 1.0e-6, "the sound does not depend on the block size");
}

// What comes after the strings: the pickup's resonance, a clean amplifier
// and a speaker.
static void test_amplifier() {
  // The resonance: a soft note's partial near each of five frequencies is
  // loudest when Tone is set there. The strings do not change, so the ratio
  // of two renders is the ratio of the two filters.
  const double tones[5] = {1500.0, 2100.0, 3000.0, 4100.0, 5500.0};
  double band[5][5];
  for (int t = 0; t < 5; ++t) {
    bare();
    device.set_param(p::kPickup, 0.0f);
    device.set_param(p::kPosition, 0.05f);
    device.set_param(p::kHardness, 1.0f);
    device.set_param(p::kWarmth, 0.0f);
    device.set_param(p::kTone, static_cast<float>(tones[t]));
    const std::vector<float> out = note(82.407f, 0.2f, 0.25f);
    const std::vector<double> power = power_spectrum(out, at(0.005), 8192);
    for (int f = 0; f < 5; ++f) band[t][f] = band_db(power, kRate, tones[f] / 1.1, tones[f] * 1.1);
  }
  bool follows = true;
  for (int f = 0; f < 5; ++f) {
    int best = 0;
    for (int t = 1; t < 5; ++t) {
      if (band[t][f] > band[best][f]) best = t;
    }
    if (best != f) follows = false;
    std::printf("  the band at %.0f Hz is loudest with Tone at %.0f Hz\n", tones[f], tones[best]);
  }
  const double height = band[0][0] - band[4][0];
  const double above = band[0][2] - band[4][2];
  std::printf("  Tone at 1.5 kHz against 5.5 kHz: %+.1f dB at 1.5 kHz, %+.1f dB at 3 kHz\n", height, above);
  EXPECT(follows, "the pickup's resonant peak is where Tone puts it, from 1.5 to 5.5 kHz");
  EXPECT(height > 2.0 && height < 6.0, "the peak stands 2 to 6 dB proud");
  EXPECT(above < -9.0, "and above it the pickup falls away");

  // The speaker: the brightest setting there is, a hard chord.
  bare();
  device.set_param(p::kPickup, 0.0f);
  device.set_param(p::kPosition, 0.05f);
  device.set_param(p::kHardness, 1.0f);
  device.set_param(p::kTone, 5500.0f);
  for (int n = 0; n < 6; ++n) device.note_on(n, Guitar::kOpenHz[n], 1.0f);
  const std::vector<float> chord = render(device, 0.75f, kRate).left;
  const std::vector<double> power = power_spectrum(chord, 0, 32768);
  const double slope = band_db(power, kRate, 6000.0, 7000.0) - band_db(power, kRate, 12000.0, 14000.0);
  const double top = band_db(power, kRate, 10000.0, 24000.0) - band_db(power, kRate, 1000.0, 2000.0);
  std::printf(
      "  speaker: %.1f dB per octave down from 6 kHz; everything over 10 kHz is %.1f dB under 1 to 2 kHz\n", slope,
      -top);
  EXPECT(slope > 18.0, "the speaker rolls off at 18 dB per octave or more above 6 kHz");
  EXPECT(top < -40.0, "almost nothing is left above 10 kHz");
  bare();
  const std::vector<float> c2 = note(65.406f, 0.7f, 0.6f);
  bare();
  const std::vector<float> c3 = note(130.813f, 0.7f, 0.6f);
  const double bottom = db(tone_level(c2, 65.406, kRate, at(0.05), at(0.55))) -
                        db(tone_level(c3, 130.813, kRate, at(0.05), at(0.55)));
  std::printf("  the fundamental of C2 is %+.1f dB against that of C3\n", bottom);
  EXPECT(bottom > -12.0, "the speaker thins the bottom but keeps the low notes' fundamentals");

  // Clean. A note just past the twelfth fret of the high E, with the pickup
  // under the middle of what is left of the string and the pick a third of
  // the way along it: the string gives the pickup no second harmonic and no
  // third, so what is there was made by the pickup's curve and the amplifier.
  // (The pitch is the one whose period is 72 samples, so that the kit's pick
  // comb, which works in whole samples, falls exactly on the third.)
  const float probe_hz = kRate / 72.0f;
  const float probe_ratio = Guitar::fret_ratio(probe_hz);
  const float probe_pickup =
      (0.5f / probe_ratio - Guitar::kBridgePickup) / (Guitar::kNeckPickup - Guitar::kBridgePickup);
  auto distortion = [&](float gain, float warmth, double* second, double* third) {
    bare();
    device.set_param(p::kPickup, probe_pickup);
    device.set_param(p::kPosition, 1.0f / (3.0f * probe_ratio));
    device.set_param(p::kShimmer, 0.0f);
    device.set_param(p::kWarmth, warmth);
    const std::vector<float> out = note(probe_hz, gain, 0.2f);
    const double first = tone_level(out, probe_hz, kRate, at(0.01), at(0.11));
    *second = tone_level(out, 2.0 * probe_hz, kRate, at(0.01), at(0.11)) / first;
    *third = tone_level(out, 3.0 * probe_hz, kRate, at(0.01), at(0.11)) / first;
  };
  double second = 0.0, third = 0.0, soft_second = 0.0, soft_third = 0.0, hot_second = 0.0, hot_third = 0.0;
  distortion(0.8f, p::kParamDefault[p::kWarmth], &second, &third);
  distortion(0.3f, p::kParamDefault[p::kWarmth], &soft_second, &soft_third);
  distortion(0.8f, 1.0f, &hot_second, &hot_third);
  const double thd = std::sqrt(second * second + third * third);
  std::printf("  distortion at the default Warmth: second %.2f%%, third %.2f%% (soft stroke %.2f%% and %.2f%%)\n",
              100.0 * second, 100.0 * third, 100.0 * soft_second, 100.0 * soft_third);
  std::printf("  distortion at full Warmth: second %.2f%%, third %.2f%%\n", 100.0 * hot_second, 100.0 * hot_third);
  EXPECT(thd < 0.03, "a single note is clean: under 3% distortion at the default Warmth");
  EXPECT(second > third, "the second harmonic leads, from the pickup's lopsided curve");
  EXPECT(soft_second < second, "a soft stroke is cleaner than a hard one");
  EXPECT(hot_third > 3.0 * third, "Warmth pushes the amplifier: the third harmonic grows");

  // Room for a chord: two notes at once, and what the amplifier makes of
  // them that belongs to neither (twice the upper less the lower).
  bare();
  device.set_param(p::kShimmer, 0.0f);
  device.note_on(1, 110.0f, 0.8f);
  device.note_on(2, 138.591f, 0.8f);
  const std::vector<float> dyad = render(device, 0.7f, kRate).left;
  const double lower = db(tone_level(dyad, 110.0, kRate, at(0.2), at(0.6)));
  const double between = db(tone_level(dyad, 2.0 * 138.591 - 110.0, kRate, at(0.2), at(0.6)));
  std::printf("  two notes at once: what the amplifier adds between them is %.1f dB under the lower note\n",
              lower - between);
  EXPECT(lower - between > 40.0, "two notes at once stay clean: 40 dB or more over what the amplifier adds");

  // Nothing folds back. C6 at 44.1 kHz, the hardest pick, the hottest amp:
  // the harmonics made above half the sample rate would land 147 Hz from a
  // harmonic, well clear of the string's own (slightly sharp) partials.
  device.init(44100.0f);
  device.set_param(p::kStrum, 0.0f);
  device.set_variation(0.0f);
  device.set_param(p::kHardness, 1.0f);
  device.set_param(p::kWarmth, 1.0f);
  device.set_param(p::kShimmer, 0.0f);
  const std::vector<float> c6 = note(1046.502f, 1.0f, 0.5f, 44100.0f);
  const std::vector<double> fold = power_spectrum(c6, 882, 16384);
  const double bin = 44100.0 / 16384.0;
  double carrier = 0.0, stray = 0.0;
  for (size_t i = 8; i < fold.size(); ++i) {
    const double f = static_cast<double>(i) * bin;
    if (f > 8000.0) break;
    const double k = std::round(f / 1046.502);
    const double clear = 30.0 + 0.008 * f;
    if (k >= 1.0 && std::fabs(f - k * 1046.502) < clear) {
      if (k == 1.0) carrier = std::max(carrier, fold[i]);
    } else {
      stray = std::max(stray, fold[i]);
    }
  }
  std::printf("  C6 at 44.1 kHz, hardest and hottest: strongest stray component %.1f dB under the fundamental\n",
              10.0 * std::log10(carrier / std::max(stray, 1.0e-30)));
  EXPECT(stray < carrier * 1.0e-5, "fold-back is 50 dB or more under the fundamental");
}

// Loud enough, never clipped, no clicks from the knobs, and the same in
// both ears.
static void test_levels() {
  double low = 0.0, high = -200.0;
  for (float hz : {65.406f, 130.813f, 261.626f, 523.251f, 1046.502f}) {
    bare();
    const double soft = db(peak(note(hz, 0.7f, 1.0f)));
    bare();
    const double loud = db(peak(note(hz, 0.8f, 1.0f)));
    std::printf("  %.0f Hz: peak %.1f dBFS at gain 0.7, %.1f dBFS at gain 0.8\n", hz, soft, loud);
    char label[120];
    std::snprintf(label, sizeof label, "%.0f Hz at gain 0.7 peaks between -24 and -10 dBFS", hz);
    EXPECT(soft > -24.0 && soft < -10.0, label);
    if (hz > 100.0f && hz < 600.0f) {
      low = std::min(low, loud);
      high = std::max(high, loud);
    }
  }
  EXPECT(low > -22.0 && high < -16.0, "C3, C4 and C5 at gain 0.8 peak between -22 and -16 dBFS");

  // A pickup near the bridge hears less of the string; the knob should
  // change the colour of a note, not how loud its body is.
  double quietest = 0.0, loudest = -200.0;
  for (float hz : {82.407f, 261.626f, 523.251f}) {
    for (float pickup : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) {
      bare();
      device.set_param(p::kPickup, pickup);
      const std::vector<float> out = note(hz, 0.8f, 0.5f);
      const double body = db(rms(out, at(0.1), at(0.5)));
      quietest = std::min(quietest, body);
      loudest = std::max(loudest, body);
    }
  }
  std::printf("  the body of a note (0.1 to 0.5 s) from bridge to neck, E2 to C5: %.1f to %.1f dBFS\n", quietest,
              loudest);
  EXPECT(loudest - quietest < 3.0, "a note is about as loud wherever the pickup is");

  // Ten held notes, as shipped and with no strum to spread them.
  double stacked[2];
  for (int pass = 0; pass < 2; ++pass) {
    device.init(kRate);
    if (pass == 1) device.set_param(p::kStrum, 0.0f);
    for (int n = 0; n < 10; ++n)
      device.note_on(n, 82.407f * std::pow(2.0f, static_cast<float>(n) * 4.0f / 12.0f), 0.8f);
    stacked[pass] = peak(render(device, 2.0f, kRate).left);
  }
  std::printf("  ten held notes peak at %.2f as shipped, %.2f with Strum at zero\n", stacked[0], stacked[1]);
  EXPECT(stacked[0] < 0.5 && stacked[1] < 0.5, "ten held notes stay under the soft clip's knee");

  // Knobs that move while a chord rings: swept across their range and
  // thrown from end to end, against the same chord with the knob at rest.
  const int swept[3] = {p::kPickup, p::kTone, p::kVolume};
  const char* names[3] = {"Pickup", "Tone", "Volume"};
  for (int k = 0; k < 3; ++k) {
    const int id = swept[k];
    auto chord = [&](int motion) {
      bare();
      if (motion == 0) device.set_param(id, p::kParamMin[id]);
      if (motion == 1) device.set_param(id, p::kParamMax[id]);
      device.note_on(1, 110.0f, 0.8f);
      device.note_on(2, 164.814f, 0.8f);
      device.note_on(3, 277.183f, 0.8f);
      std::vector<float> out = render(device, 0.1f, kRate).left;
      for (int block = 0; block < 300; ++block) {
        const float phase = static_cast<float>(block) / 75.0f;
        const float triangle = std::fabs(2.0f * (phase - std::floor(phase + 0.5f)));
        if (motion == 2) device.set_param(id, livemix::kit::lerp(p::kParamMin[id], p::kParamMax[id], triangle));
        if (motion == 3 && block % 40 == 0)
          device.set_param(id, (block / 40) % 2 == 0 ? p::kParamMax[id] : p::kParamMin[id]);
        device.process(128);
        out.insert(out.end(), device.out_left(), device.out_left() + 128);
      }
      return max_step(out, at(0.1), out.size());
    };
    const double rest = std::max(chord(0), chord(1));
    const double sweep = chord(2);
    const double jump = chord(3);
    std::printf("  %s: largest step %.4f swept, %.4f thrown end to end, %.4f at rest\n", names[k], sweep, jump,
                rest);
    char label[120];
    std::snprintf(label, sizeof label, "moving %s under a ringing chord makes no click", names[k]);
    EXPECT(sweep < 1.5 * rest && jump < 1.5 * rest, label);
  }

  // One channel, twice.
  device.init(kRate);
  for (int n = 0; n < 4; ++n) device.note_on(n, 110.0f * static_cast<float>(n + 1), 0.8f);
  const Stereo both = render(device, 0.5f, kRate);
  EXPECT(both.left == both.right, "the output is mono: left and right are the same");
}

// A knob that moves reaches the notes: the ones picked next and, for
// Sustain and Shimmer, the ones already ringing.
static void test_settings() {
  // Moved while nothing sounds, a knob has arrived by the next note: that
  // note is the one a guitar set that way from the start plays.
  struct Move {
    int id;
    float from, to;
    const char* name;
  };
  const Move moves[4] = {{p::kPickup, 0.0f, 1.0f, "Pickup"},
                         {p::kTone, 1500.0f, 5500.0f, "Tone"},
                         {p::kWarmth, 0.0f, 1.0f, "Warmth"},
                         {p::kVolume, -30.0f, 0.0f, "Volume"}};
  for (const Move& move : moves) {
    bare();
    device.set_param(move.id, move.to);
    render(device, 0.3f, kRate);
    const std::vector<float> set = note(220.0f, 0.7f, 0.5f);
    // An earlier note, let go and left to die; then the move, in the silence.
    bare();
    device.set_param(move.id, move.from);
    device.note_on(2, 329.628f, 0.7f);
    render(device, 0.2f, kRate);
    device.process(13);  // so that it falls asleep off the beat of its control clock
    device.note_off(2);
    render(device, 2.0f, kRate);
    device.set_param(move.id, move.to);
    const std::vector<float> moved = note(220.0f, 0.7f, 0.5f);
    double apart = 0.0;
    for (size_t i = 0; i < set.size(); ++i) {
      apart = std::max(apart, std::fabs(static_cast<double>(moved[i]) - set[i]));
    }
    std::printf("  %s moved in silence: the next note is within %.1e of the note with it set from the start\n",
                move.name, apart);
    char label[120];
    std::snprintf(label, sizeof label, "%s moved in silence has arrived by the next note", move.name);
    EXPECT(apart < 1.0e-6, label);
  }

  // Pickup thrown from the bridge to the neck under a ringing note, and the
  // next note picked 5 ms later, with the pickup still on its way.
  double settled[2];
  for (int pass = 0; pass < 2; ++pass) {
    bare();
    device.set_param(p::kShimmer, 0.0f);
    device.set_param(p::kPickup, pass == 0 ? 1.0f : 0.0f);
    device.note_on(2, 98.0f, 0.5f);
    render(device, 0.3f, kRate);
    device.set_param(p::kPickup, 1.0f);
    render(device, 0.005f, kRate);
    const std::vector<float> out = note(329.628f, 0.7f, 0.8f);
    settled[pass] = db(tone_level(out, 329.628, kRate, at(0.5), at(0.8)));
  }
  std::printf("  a note picked 5 ms into a throw of Pickup: %+.2f dB against the same note at the neck\n",
              settled[1] - settled[0]);
  EXPECT(std::fabs(settled[1] - settled[0]) < 0.5,
         "a note picked while Pickup moves ends at the new setting's level");

  // Sustain turned down under a ringing note: it dies at the new rate.
  bare();
  device.set_param(p::kShimmer, 0.0f);
  device.set_param(p::kSustain, 30.0f);
  device.note_on(1, 110.0f, 0.8f);
  Stereo ringing = render(device, 1.5f, kRate);
  device.set_param(p::kSustain, 1.0f);
  ringing = concat(ringing, render(device, 0.6f, kRate));
  auto fall = [&](double from, double to) {
    return (db(tone_level(ringing.left, 110.0, kRate, at(from), at(from + 0.1))) -
            db(tone_level(ringing.left, 110.0, kRate, at(to), at(to + 0.1)))) /
           (to - from);
  };
  const double slow = fall(0.5, 1.3);
  const double fast = fall(1.6, 1.9);
  const double turn = max_step(ringing.left, at(1.5) - 1, at(1.55)) / max_step(ringing.left, at(1.4), at(1.5));
  std::printf("  Sustain from 30 s to 1 s under a ringing A2: %.1f dB a second before, %.1f after, step %.2f\n",
              slow, fast, turn);
  EXPECT(slow < 10.0 && fast > 50.0, "Sustain reaches a note that is already ringing");
  EXPECT(turn < 1.05, "and makes no click doing it");

  // Shimmer turned up under a ringing note: it begins to beat.
  bare();
  device.set_param(p::kShimmer, 0.0f);
  device.note_on(1, 110.0f, 0.8f);
  Stereo still = render(device, 1.2f, kRate);
  device.set_param(p::kShimmer, 1.5f);
  still = concat(still, render(device, 2.4f, kRate));
  // The level against itself a third of a second either side: half a beat.
  auto swing = [&](double from, double to) {
    double most = 0.0;
    for (double t = from + 0.325; t + 0.425 <= to; t += 0.025) {
      auto level = [&](double when) { return db(tone_level(still.left, 110.0, kRate, at(when), at(when + 0.1))); };
      most = std::max(most, std::fabs(level(t) - 0.5 * (level(t - 0.325) + level(t + 0.325))));
    }
    return most;
  };
  const double before = swing(0.1, 1.2);
  const double after = swing(1.2, 3.6);
  const double start = max_step(still.left, at(1.2) - 1, at(1.25)) / max_step(still.left, at(1.1), at(1.2));
  std::printf(
      "  Shimmer from 0 to 1.5 Hz under a ringing A2: the level swings %.2f dB before, %.1f after, step %.2f\n",
      before, after, start);
  EXPECT(before < 0.5 && after > 3.0, "Shimmer reaches a note that is already ringing");
  EXPECT(start < 1.05, "and makes no click doing it");
}

// The volume pedal and the strum.
static void test_swell_and_strum() {
  // Swell against the same note without it: the ratio is the pedal alone.
  bare();
  device.set_param(p::kWarmth, 0.0f);
  const std::vector<float> plain = note(220.0f, 0.7f, 2.2f);
  bare();
  device.set_param(p::kWarmth, 0.0f);
  device.set_param(p::kSwell, 1.0f);
  const std::vector<float> swelled = note(220.0f, 0.7f, 2.2f);
  double tenth = -1.0, ninety = -1.0;
  for (double t = 0.0; t + 0.02 < 2.2; t += 0.005) {
    const double ratio = rms(swelled, at(t), at(t + 0.02)) / rms(plain, at(t), at(t + 0.02));
    if (tenth < 0.0 && ratio >= 0.1) tenth = t;
    if (ninety < 0.0 && ratio >= 0.9) ninety = t;
  }
  const double early = db(peak(swelled, 0, at(0.02))) - db(peak(swelled));
  std::printf(
      "  Swell at 1 s: the pedal opens from 10%% to 90%% in %.2f s; the first 20 ms are %.1f dB under the peak\n",
      ninety - tenth, -early);
  EXPECT_NEAR(ninety - tenth, 1.0, 0.2, "Swell is the time the pedal takes to open");
  EXPECT(early < -30.0, "and it hides the pick");
  size_t loudest = 0;
  for (size_t i = 0; i < plain.size(); ++i) {
    if (std::fabs(plain[i]) > std::fabs(plain[loudest])) loudest = i;
  }
  std::printf("  Swell at zero: the note peaks %.1f ms in\n", 1000.0 * static_cast<double>(loudest) / kRate);
  EXPECT(loudest < at(0.02), "with Swell at zero the pick is the loudest thing in the note");

  // Strum: six notes sent from the top down in one block come out from the
  // bottom up, a fifth of the Strum time apart. Each note's place is found
  // by taking the other five out of the chord and sliding the note alone
  // along what is left.
  const float chord_hz[6] = {82.407f, 123.471f, 164.814f, 207.652f, 246.942f, 329.628f};
  for (float strum : {60.0f, 0.0f}) {
    std::vector<float> alone[6];
    for (int n = 0; n < 6; ++n) {
      bare();
      device.set_param(p::kStrum, strum);
      device.set_param(p::kWarmth, 0.0f);  // soft and clean, so the chord is the sum of its notes
      alone[n] = note(chord_hz[n], 0.3f, 0.25f);
    }
    bare();
    device.set_param(p::kStrum, strum);
    device.set_param(p::kWarmth, 0.0f);
    for (int n = 5; n >= 0; --n) device.note_on(n, chord_hz[n], 0.3f);
    const std::vector<float> chord = render(device, 0.25f, kRate).left;
    double worst = 0.0;
    double places[6];
    for (int n = 0; n < 6; ++n) {
      std::vector<double> rest(chord.begin(), chord.end());
      for (int m = 0; m < 6; ++m) {
        if (m == n) continue;
        const size_t shift = at(static_cast<double>(m) * strum * 0.001 / 5.0);
        for (size_t i = shift; i < rest.size(); ++i) rest[i] -= alone[m][i - shift];
      }
      const size_t length = at(0.1);
      double best = -1.0e30;
      size_t best_lag = 0;
      for (size_t lag = 0; lag + length <= rest.size(); ++lag) {
        double sum = 0.0;
        for (size_t i = 0; i < length; ++i) sum += static_cast<double>(alone[n][i]) * rest[lag + i];
        if (sum > best) {
          best = sum;
          best_lag = lag;
        }
      }
      places[n] = 1000.0 * static_cast<double>(best_lag) / kRate;
      worst = std::max(worst, std::fabs(places[n] - static_cast<double>(n) * strum / 5.0));
    }
    std::printf("  Strum at %.0f ms: strings picked at %.1f, %.1f, %.1f, %.1f, %.1f, %.1f ms, lowest first\n",
                strum, places[0], places[1], places[2], places[3], places[4], places[5]);
    if (strum > 0.0f) {
      EXPECT(worst < 2.0, "a chord is strummed lowest string first, a fifth of the Strum time apart");
    } else {
      EXPECT(worst < 1.0, "with Strum at zero the strings are picked together");
    }
  }

  // The same chord strummed again while it rings: every string is picked
  // afresh, so once the last one has gone the second strum is the first one
  // over again, late by the few milliseconds the old notes took to fade.
  bare();
  device.set_param(p::kStrum, 60.0f);
  device.set_param(p::kWarmth, 0.0f);
  for (int n = 5; n >= 0; --n) device.note_on(n, chord_hz[n], 0.3f);
  const std::vector<float> strummed = render(device, 0.3f, kRate).left;
  for (int n = 5; n >= 0; --n) device.note_on(n, chord_hz[n], 0.3f);
  const std::vector<float> again = render(device, 0.3f, kRate).left;
  const size_t from = at(0.07), span = at(0.18);
  double closest = 1.0e30;
  size_t late = 0;
  for (size_t lag = 0; lag < at(0.03); ++lag) {
    double error = 0.0;
    for (size_t i = 0; i < span; ++i) {
      error += std::pow(static_cast<double>(again[from + lag + i]) - strummed[from + i], 2.0);
    }
    if (error < closest) {
      closest = error;
      late = lag;
    }
  }
  const double mismatch = std::sqrt(closest / static_cast<double>(span)) / rms(strummed, from, from + span);
  std::printf("  a ringing chord strummed again: the same strum %.1f ms late, %.2f%% apart\n",
              1000.0 * static_cast<double>(late) / kRate, 100.0 * mismatch);
  EXPECT(mismatch < 0.02, "strumming a ringing chord keeps the spacing of its strings");
  EXPECT(late <= at(0.01), "and costs no more than the fade of the old notes");

  // A key let go before its string is reached: a short, muted pluck.
  bare();
  device.set_param(p::kStrum, 60.0f);
  device.note_on(1, 220.0f, 0.8f);
  device.process(32);
  device.note_off(1);
  const std::vector<float> muted = render(device, 1.5f, kRate).left;
  const double start = db(peak(muted, 0, at(0.03)));
  const double later = db(peak(muted, at(0.2), at(0.25)));
  std::printf("  let go before it was picked: a pluck peaking at %.1f dBFS, %.1f dB down 200 ms on\n", start,
              start - later);
  EXPECT(start > -40.0, "a key let go before its turn still sounds");
  EXPECT(start - later > 40.0, "as a short muted pluck");
  EXPECT(peak(render(device, 0.25f, kRate).left) == 0.0, "and then silence");
}

int main() {
  test_conformance();
  test_tuning();
  test_pickup();
  test_pick();
  test_decay();
  test_playing();
  test_amplifier();
  test_levels();
  test_settings();
  test_swell_and_strum();

  device.init(kRate);
  for (int n = 0; n < 12; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 0.8f);
  report_cost("guitar (12 notes)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });
  return finish("guitar");
}
