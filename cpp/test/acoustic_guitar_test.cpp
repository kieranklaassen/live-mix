// Native harness for Acoustic Guitar (cpp/devices/acoustic-guitar). The
// conformance pass covers silence before and after notes, voice stealing
// under a pile of keys, parameter abuse and other sample rates; the rest
// measures what makes it a guitar: the pitch, the pluck, the two-stage ring,
// the wooden body, the three types, and the way notes start and stop.

#include "../devices/acoustic-guitar/acoustic_guitar.h"

#include <complex>

#include "support/test_kit.h"

using namespace testkit;
using livemix::AcousticGuitar;
namespace p = livemix::acoustic_guitar;

static AcousticGuitar device;

static const float kRate = 48000.0f;

static size_t at(double seconds, double rate = kRate) { return static_cast<size_t>(seconds * rate); }

static std::vector<float> mid(const Stereo& s) {
  std::vector<float> m(s.size());
  for (size_t i = 0; i < m.size(); ++i) m[i] = 0.5f * (s.left[i] + s.right[i]);
  return m;
}

static std::vector<float> side(const Stereo& s) {
  std::vector<float> m(s.size());
  for (size_t i = 0; i < m.size(); ++i) m[i] = 0.5f * (s.left[i] - s.right[i]);
  return m;
}

static double cents_off(double hz, double wanted) { return 1200.0 * std::log2(hz / wanted); }

// The frequency of the partial nearest `hz`, searched `span` cents either side.
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

// Power per bin of `n` samples (a power of two) from `from`, Hann windowed.
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

// Power between `lo` and `hi` hertz.
static double band_power(const std::vector<float>& x, size_t from, size_t n, double lo, double hi,
                         double rate = kRate) {
  const std::vector<double> power = power_spectrum(x, from, n);
  double sum = 0.0;
  for (size_t i = 1; i < power.size(); ++i) {
    const double hz = static_cast<double>(i) * rate / static_cast<double>(n);
    if (hz >= lo && hz < hi) sum += power[i];
  }
  return sum;
}

static double band_db(const std::vector<float>& x, size_t from, size_t n, double lo, double hi) {
  return 10.0 * std::log10(std::max(band_power(x, from, n, lo, hi), 1.0e-30));
}

// Where the weight of the spectrum sits, in hertz.
static double centroid(const std::vector<float>& x, size_t from, size_t n) {
  const std::vector<double> power = power_spectrum(x, from, n);
  double weighted = 0.0, total = 0.0;
  for (size_t i = 1; i < power.size(); ++i) {
    weighted += static_cast<double>(i) * kRate / static_cast<double>(n) * power[i];
    total += power[i];
  }
  return total > 0.0 ? weighted / total : 0.0;
}

// Seconds to fall 60 dB, from the fall of the partial at `hz` between two moments.
static double partial_t60(const std::vector<float>& x, double hz, double t0, double t1, double window = 0.1) {
  const double a = tone_level(x, hz, kRate, at(t0), at(t0 + window));
  const double b = tone_level(x, hz, kRate, at(t1), at(t1 + window));
  return 60.0 * (t1 - t0) / (db(a) - db(b));
}

// The share of the power that is not on a partial of the note at `hz`. The
// partials are followed up the spectrum one by one, since the loop's own
// filters pull the top ones a little off the harmonic grid.
static double between_partials_share(const std::vector<float>& x, double hz, size_t from, size_t n = 16384) {
  const std::vector<double> power = power_spectrum(x, from, n);
  const double bin = kRate / static_cast<double>(n);
  std::vector<bool> on_partial(power.size(), false);
  double last = 0.0, spacing = hz;
  for (;;) {
    const double expected = last + spacing;
    if (expected + 0.3 * hz >= 0.5 * kRate) break;
    size_t best = 0;
    for (size_t i = static_cast<size_t>((expected - 0.3 * hz) / bin);
         i <= static_cast<size_t>((expected + 0.3 * hz) / bin); ++i) {
      if (best == 0 || power[i] > power[best]) best = i;
    }
    for (size_t i = best - 16; i <= best + 16 && i < power.size(); ++i) on_partial[i] = true;
    const double found = static_cast<double>(best) * bin;
    spacing = found - last;
    last = found;
  }
  double off = 0.0, total = 0.0;
  for (size_t i = 8; i < power.size(); ++i) {
    total += power[i];
    if (!on_partial[i] && static_cast<double>(i) * bin < last + 0.5 * hz) off += power[i];
  }
  return total > 0.0 ? off / total : 0.0;
}

// How fast the partial at `hz` beats, in hertz, and how far it swings in dB
// either side of its decay.
static double beat_rate(const std::vector<float>& x, double hz, size_t from, double* swing_db) {
  const size_t hop = 960;
  std::vector<float> envelope;
  for (size_t start = from; start + 2 * hop <= x.size(); start += hop) {
    envelope.push_back(static_cast<float>(db(tone_level(x, hz, kRate, start, start + 2 * hop))));
  }
  // Take out the decay: the beat is what is left round the fitted line.
  double st = 0.0, sv = 0.0, stt = 0.0, stv = 0.0;
  const double n = static_cast<double>(envelope.size());
  for (size_t i = 0; i < envelope.size(); ++i) {
    st += static_cast<double>(i);
    sv += envelope[i];
    stt += static_cast<double>(i) * static_cast<double>(i);
    stv += static_cast<double>(i) * envelope[i];
  }
  const double slope = (n * stv - st * sv) / (n * stt - st * st), base = (sv - slope * st) / n;
  *swing_db = 0.0;
  for (size_t i = 0; i < envelope.size(); ++i) {
    envelope[i] -= static_cast<float>(base + slope * static_cast<double>(i));
    *swing_db = std::max(*swing_db, std::fabs(static_cast<double>(envelope[i])));
  }
  return dominant_frequency(envelope, kRate / static_cast<double>(hop), 0.3, 5.0);
}

// Seconds until the level has fallen `by_db` from its loudest 50 ms.
static double seconds_to_fall(const std::vector<float>& x, double by_db) {
  const size_t window = 2400;
  double loudest = 0.0;
  for (size_t from = 0; from + window <= x.size(); from += window)
    loudest = std::max(loudest, rms(x, from, from + window));
  for (size_t from = 0; from + window <= x.size(); from += window) {
    if (db(rms(x, from, from + window)) < db(loudest) - by_db) return static_cast<double>(from) / kRate;
  }
  return static_cast<double>(x.size()) / kRate;
}

// The first sample from which `hz` is heard: where its level in short
// windows first passes a quarter of the most it reaches.
static size_t onset_of(const std::vector<float>& x, double hz) {
  const size_t window = 144, hop = 12;
  std::vector<double> level;
  double most = 0.0;
  for (size_t from = 0; from + window <= x.size(); from += hop) {
    level.push_back(tone_level(x, hz, kRate, from, from + window));
    most = std::max(most, level.back());
  }
  for (size_t i = 0; i < level.size(); ++i) {
    if (level[i] > 0.25 * most) return i * hop;
  }
  return x.size();
}

static double worst_difference(const Stereo& a, const Stereo& b) {
  double worst = 0.0;
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

// The bare string: no body, no beating, no strum.
static void bare(AcousticGuitar& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kBody, 0.0f);
  d.set_param(p::kShimmer, 0.0f);
  d.set_param(p::kStrum, 0.0f);
}

static float midi_hz(int note) { return 440.0f * std::pow(2.0f, static_cast<float>(note - 69) / 12.0f); }

int main() {
  Conformance spec;
  spec.name = "acoustic-guitar";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 8.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  // In tune from E1 to C6, on every type, at every rate the app runs at.
  {
    double worst = 0.0;
    for (int type = 0; type < 3; ++type) {
      for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
        for (int note = 28; note <= 84; note += 4) {
          bare(device, rate);
          device.set_param(p::kType, static_cast<float>(type));
          const float hz = midi_hz(note);
          device.note_on(1, hz, 0.8f);
          const std::vector<float> out = mid(render(device, 1.3f, rate));
          const double found = partial_near(out, hz, rate, at(0.1, rate), at(1.2, rate));
          worst = std::max(worst, std::fabs(cents_off(found, hz)));
        }
      }
    }
    std::printf("  worst tuning error, E1 to C6, three types, 44.1/48/96 kHz: %.2f cents\n", worst);
    EXPECT(worst < 3.0, "every note is within 3 cents of the pitch asked for");
  }

  // Steel strings are stiff: their partials run sharp by the stiff-string
  // law. Nylon's stay harmonic.
  {
    const double hz = 110.0, b = 8.0e-5;
    auto stretch = [&](int type, int n) {
      bare(device);
      device.set_param(p::kType, static_cast<float>(type));
      device.set_param(p::kNail, 1.0f);
      device.set_param(p::kPosition, 0.07f);
      device.note_on(1, static_cast<float>(hz), 1.0f);
      const std::vector<float> out = mid(render(device, 1.2f, kRate));
      const double base = partial_near(out, hz, kRate, at(0.1), at(1.1));
      return cents_off(partial_near(out, n * base, kRate, at(0.1), at(1.1)), n * base);
    };
    for (int n : {4, 8}) {
      const double law = cents_off(std::sqrt((1.0 + b * n * n) / (1.0 + b)), 1.0);
      const double steel = stretch(AcousticGuitar::kSteel, n);
      std::printf("  steel partial %d of A2: %.2f cents sharp (the law says %.2f)\n", n, steel, law);
      EXPECT_NEAR(steel, law, 1.5, "steel partials are stretched as a stiff string's are");
      EXPECT(std::fabs(stretch(AcousticGuitar::kNylon, n)) < 1.0, "nylon partials are harmonic");
    }
    const double far = stretch(AcousticGuitar::kSteel, 12);
    std::printf("  steel partial 12 of A2: %.2f cents sharp\n", far);
    EXPECT(far > 5.0 && far < 16.0, "the stretch keeps growing up the partials");
  }

  // Where the string is plucked decides which partials are missing.
  {
    auto partials = [&](float position, double* level) {
      bare(device);
      device.set_param(p::kType, static_cast<float>(AcousticGuitar::kNylon));
      device.set_param(p::kNail, 1.0f);
      device.set_param(p::kPosition, position);
      device.note_on(1, 110.0f, 1.0f);
      const std::vector<float> out = mid(render(device, 0.4f, kRate));
      for (int n = 1; n <= 9; ++n) level[n] = db(tone_level(out, 110.0 * n, kRate, at(0.02), at(0.32)));
    };
    double fifth[10], quarter[10];
    partials(0.2f, fifth);
    partials(0.25f, quarter);
    const double null5 = 0.5 * (fifth[4] + fifth[6]) - fifth[5];
    const double null4 = 0.5 * (quarter[3] + quarter[5]) - quarter[4];
    std::printf("  pluck at 1/5: partial 5 is %.1f dB under its neighbours; at 1/4: partial 4 is %.1f dB under\n",
                null5, null4);
    EXPECT(null5 > 15.0, "a pluck a fifth of the way along has no fifth partial");
    EXPECT(null4 > 15.0, "a pluck a quarter of the way along has no fourth partial");
    EXPECT(0.5 * (quarter[4] + quarter[6]) - quarter[5] < 6.0, "moving the pluck moves the hole");
    for (int n = 2; n <= 8; ++n) {
      if (n == 5) continue;
      EXPECT(0.5 * (fifth[n - 1] + fifth[n + 1]) - fifth[n] < 8.0, "a pluck at 1/5 has no other hole below partial 9");
    }
  }

  // The pluck: Nail goes from the pad of a finger to a pick, and a soft
  // pluck is darker as well as quieter.
  {
    auto attack = [&](float nail, float gain) {
      bare(device);
      device.set_param(p::kNail, nail);
      device.note_on(1, 110.0f, gain);
      return mid(render(device, 0.3f, kRate));
    };
    const std::vector<float> flesh = attack(0.0f, 0.8f), pick = attack(1.0f, 0.8f);
    const double rise = band_db(pick, 0, 1024, 3000.0, 20000.0) - band_db(flesh, 0, 1024, 3000.0, 20000.0);
    std::printf("  Nail 0 to 1 adds %.1f dB above 3 kHz in the first 20 ms\n", rise);
    EXPECT(rise > 10.0, "a pick is at least 10 dB brighter than a fingertip at the attack");
    EXPECT(std::fabs(db(tone_level(pick, 110.0, kRate, at(0.05), at(0.25))) -
                     db(tone_level(flesh, 110.0, kRate, at(0.05), at(0.25)))) < 2.0,
           "Nail leaves the note itself as loud");
    const std::vector<float> soft = attack(0.5f, 0.25f), hard = attack(0.5f, 1.0f);
    auto tilt = [&](const std::vector<float>& out) {
      return band_db(out, 0, 4096, 4000.0, 20000.0) - band_db(out, 0, 4096, 50.0, 500.0);
    };
    const double softer =
        db(tone_level(hard, 110.0, kRate, at(0.05), at(0.25))) - db(tone_level(soft, 110.0, kRate, at(0.05), at(0.25)));
    std::printf("  gain 0.25 against 1: %.1f dB quieter, and %.1f dB less above 4 kHz for its level\n", softer,
                tilt(hard) - tilt(soft));
    EXPECT(softer > 6.0 && softer < 16.0, "velocity sets the level");
    EXPECT(tilt(hard) - tilt(soft) > 3.0, "a soft pluck is darker as well as quieter");
  }

  // No two plucks alike, and the same plucks every time.
  {
    auto strikes = [&](std::vector<double>* peaks) {
      bare(device);
      device.set_param(p::kRelease, 0.05f);
      Stereo all;
      for (int n = 0; n < 8; ++n) {
        device.note_on(n, 330.0f, 0.8f);
        Stereo hit = render(device, 0.3f, kRate);
        if (peaks) peaks->push_back(db(peak(mid(hit))));
        device.note_off(n);
        all = concat(all, concat(hit, render(device, 0.5f, kRate)));
      }
      return all;
    };
    std::vector<double> peaks;
    const Stereo first = strikes(&peaks);
    const Stereo second = strikes(nullptr);
    const double spread = *std::max_element(peaks.begin(), peaks.end()) - *std::min_element(peaks.begin(), peaks.end());
    std::printf("  eight plucks of one note differ by %.2f dB at most\n", spread);
    EXPECT(spread > 0.1 && spread < 2.0, "each pluck differs a little, by less than 2 dB");
    EXPECT(worst_difference(first, second) == 0.0, "the same notes after init are the same audio");
  }

  // A note rings Sustain x sqrt(110 Hz / f), in two stages: the loud
  // polarisation first, then the quiet one that rings twice as long.
  {
    struct Ring {
      double early, late, law;
    };
    auto ring = [&](int type, float hz, float sustain) {
      bare(device);
      device.set_param(p::kType, static_cast<float>(type));
      device.set_param(p::kSustain, sustain);
      const double law = AcousticGuitar::ring_seconds(hz, sustain, type);
      device.note_on(1, hz, 1.0f);
      const std::vector<float> out = mid(render(device, static_cast<float>(1.75 * law + 0.3), kRate));
      Ring r;
      r.law = law;
      r.early = partial_t60(out, hz, 0.03 * law, 0.15 * law, 0.05);
      r.late = partial_t60(out, hz, 1.0 * law, 1.6 * law);
      return r;
    };
    const Ring two = ring(AcousticGuitar::kSteel, 146.83f, 2.0f);
    const Ring eight = ring(AcousticGuitar::kSteel, 146.83f, 8.0f);
    std::printf("  D3, Sustain 2: early T60 %.2f s, late T60 %.2f s (law %.2f s); Sustain 8: %.2f s and %.2f s\n",
                two.early, two.late, two.law, eight.early, eight.late);
    EXPECT_NEAR(two.late / two.law, 1.5, 0.15, "the second stage rings 1.5 times the law");
    EXPECT_NEAR(eight.late / two.late, 4.0, 0.4, "four times the Sustain rings four times as long");
    EXPECT(two.early < 0.75 * two.late && two.early > 0.45 * two.late, "the first stage dies about twice as fast");
    EXPECT(eight.early < 0.75 * eight.late && eight.early > 0.45 * eight.late, "two stages at any Sustain");

    // The knob in seconds, with no help from the device's own law: at A2
    // the first stage takes about Sustain seconds and the second 1.5 times it.
    bare(device);
    device.set_param(p::kSustain, 4.0f);
    device.note_on(1, 110.0f, 1.0f);
    const std::vector<float> a2 = mid(render(device, 7.0f, kRate));
    const double a2_early = partial_t60(a2, 110.0, 0.12, 0.6, 0.05), a2_late = partial_t60(a2, 110.0, 4.0, 6.4);
    std::printf("  A2, Sustain 4: early T60 %.2f s, late T60 %.2f s\n", a2_early, a2_late);
    EXPECT_NEAR(a2_late, 6.0, 0.6, "at A2 the second stage rings 1.5 times the Sustain time");
    EXPECT(a2_early > 2.4 && a2_early < 4.4, "at A2 the first stage rings about the Sustain time");

    const Ring low = ring(AcousticGuitar::kSteel, 82.41f, 3.0f), high = ring(AcousticGuitar::kSteel, 329.63f, 3.0f);
    std::printf("  Sustain 3: E2 late T60 %.2f s, E4 late T60 %.2f s\n", low.late, high.late);
    EXPECT_NEAR(low.late / high.late, 2.0, 0.3, "two octaves up rings half as long");

    const Ring nylon = ring(AcousticGuitar::kNylon, 146.83f, 2.0f);
    EXPECT_NEAR(nylon.late / two.late, 0.7, 0.07, "nylon rings 0.7 times as long as steel");

    // A note on the body's air mode gives its energy to the body sooner.
    const Ring on_mode = ring(AcousticGuitar::kSteel, 98.0f, 3.0f);
    const Ring off_mode = ring(AcousticGuitar::kSteel, 130.81f, 3.0f);
    std::printf("  first stage over the law: %.2f at G2 (on the air mode), %.2f at C3 and %.2f at E2 (off it)\n",
                on_mode.early / on_mode.law, off_mode.early / off_mode.law, low.early / low.law);
    EXPECT(on_mode.early / on_mode.law < 0.8 * off_mode.early / off_mode.law &&
               on_mode.early / on_mode.law < 0.8 * low.early / low.law,
           "a note on the air mode loses its first stage sooner than its neighbours");
    EXPECT_NEAR(on_mode.late / on_mode.law, 1.5, 0.15, "its second stage is untouched");
  }

  // Nylon against steel: the highs of a nylon string are gone in a moment.
  {
    auto note = [&](int type, float hz) {
      bare(device);
      device.set_param(p::kType, static_cast<float>(type));
      device.note_on(1, hz, 0.8f);
      return mid(render(device, 0.6f, kRate));
    };
    auto high_t60 = [&](const std::vector<float>& out) {
      const double fall = band_db(out, at(0.02), 4096, 2000.0, 4000.0) - band_db(out, at(0.17), 4096, 2000.0, 4000.0);
      return 60.0 * 0.15 / fall;
    };
    const std::vector<float> steel = note(AcousticGuitar::kSteel, 110.0f), nylon = note(AcousticGuitar::kNylon, 110.0f);
    const double steel_t60 = high_t60(steel), nylon_t60 = high_t60(nylon);
    std::printf("  2 to 4 kHz of A2 falls 60 dB in %.2f s on steel, %.2f s on nylon\n", steel_t60, nylon_t60);
    EXPECT(steel_t60 > 3.0 * nylon_t60, "nylon loses its highs at least three times sooner than steel");
    // Where the weight of the spectrum sits, 10, 50, 100 and 300 ms in.
    for (float hz : {82.41f, 110.0f, 196.0f, 329.63f}) {
      const std::vector<float> wire = note(AcousticGuitar::kSteel, hz), gut = note(AcousticGuitar::kNylon, hz);
      double steel_hz[4], nylon_hz[4];
      const double moments[4] = {0.01, 0.05, 0.1, 0.3};
      for (int m = 0; m < 4; ++m) {
        steel_hz[m] = centroid(wire, at(moments[m]), 1024);
        nylon_hz[m] = centroid(gut, at(moments[m]), 1024);
      }
      std::printf(
          "  centre of the spectrum of a %.0f Hz note at 10 and 300 ms: nylon %.0f and %.0f Hz, steel %.0f and %.0f "
          "Hz\n",
          hz, nylon_hz[0], nylon_hz[3], steel_hz[0], steel_hz[3]);
      EXPECT(nylon_hz[1] < nylon_hz[0] && nylon_hz[2] < nylon_hz[1] && nylon_hz[3] < nylon_hz[2],
             "a nylon note gets rounder from the first moment on");
      EXPECT(nylon_hz[3] < 0.75 * nylon_hz[0], "a nylon note has lost a quarter of its brightness after 300 ms");
      EXPECT(steel_hz[0] > 1.2 * nylon_hz[0], "steel starts brighter than nylon");
      EXPECT(steel_hz[3] > 1.25 * nylon_hz[3], "steel stays brighter than nylon");
    }
    device.init(kRate);
    device.set_param(p::kType, static_cast<float>(AcousticGuitar::kNylon));
    device.note_on(1, 82.41f, 0.8f);
    const std::vector<float> low = mid(render(device, 0.6f, kRate));
    const double nylon_fall = centroid(low, at(0.3), 1024) / centroid(low, at(0.01), 1024);
    std::printf("  the nylon low E through the body: %.2f of its first brightness after 300 ms\n", nylon_fall);
    EXPECT(nylon_fall < 0.55, "through the body a nylon low E is about half as bright after 300 ms");

    // The open low E at the default Sustain.
    auto low_e = [&](int type) {
      bare(device);
      device.set_param(p::kType, static_cast<float>(type));
      device.note_on(1, 82.41f, 0.8f);
      return seconds_to_fall(mid(render(device, 10.0f, kRate)), 60.0);
    };
    const double steel_e = low_e(AcousticGuitar::kSteel), nylon_e = low_e(AcousticGuitar::kNylon);
    std::printf("  the low E falls 60 dB in %.1f s on steel, %.1f s on nylon\n", steel_e, nylon_e);
    EXPECT(steel_e > 3.0 && steel_e < 8.0, "a steel low E rings between 3 and 8 seconds at the default Sustain");
    EXPECT(nylon_e < 5.0 && nylon_e < steel_e, "a nylon low E is gone in under 5 seconds");
  }

  // Shimmer: the two polarisations beat at the rate on the knob, and the
  // louder one sits nearer the note so the pair is in tune.
  {
    bare(device);
    device.set_param(p::kShimmer, 1.0f);
    device.set_param(p::kSustain, 12.0f);
    device.note_on(1, 220.0f, 0.8f);
    const std::vector<float> out = mid(render(device, 8.5f, kRate));
    double swing = 0.0;
    const double beat = beat_rate(out, 220.0, at(0.3), &swing);
    std::printf("  Shimmer 1 Hz: the fundamental of A3 beats at %.2f Hz, swinging %.1f dB\n", beat, swing);
    EXPECT_NEAR(beat, 1.0, 0.2, "the note beats at the Shimmer rate");
    EXPECT(swing > 1.5, "the beat is deep enough to hear");
    const double loud = partial_near(out, 219.75, kRate, at(0.3), at(8.3), 2.0);
    EXPECT_NEAR(loud, 219.75, 0.08, "the louder polarisation sits a quarter of the beat below the note");

    bare(device);
    device.note_on(1, 220.0f, 0.8f);
    const std::vector<float> still = mid(render(device, 4.5f, kRate));
    double least = 1.0e9, most = -1.0e9;
    const size_t hop = 960;
    for (size_t from = at(0.5); from + 2 * hop <= at(1.5); from += hop) {
      const double level = db(tone_level(still, 220.0, kRate, from, from + 2 * hop));
      const double next = db(tone_level(still, 220.0, kRate, from + hop, from + 3 * hop));
      least = std::min(least, level - next);
      most = std::max(most, level - next);
    }
    EXPECT(least > 0.0 && most - least < 0.5, "with Shimmer at 0 the note falls smoothly, with no beat");
  }

  // Twelve string: octave pairs on the low courses, unison pairs from B3 up.
  {
    // Plucked a quarter of the way along, a string has no fourth partial:
    // what is heard two octaves over a low note is the octave string.
    auto two_octaves_over = [&](int type, float hz) {
      bare(device);
      device.set_param(p::kType, static_cast<float>(type));
      device.set_param(p::kPosition, 0.25f);
      device.note_on(1, hz, 0.8f);
      const std::vector<float> out = mid(render(device, 0.5f, kRate));
      return db(tone_level(out, 4.0 * hz, kRate, at(0.05), at(0.35))) -
             db(tone_level(out, hz, kRate, at(0.05), at(0.35)));
    };
    const double steel_low = two_octaves_over(AcousticGuitar::kSteel, 110.0f);
    const double twelve_low = two_octaves_over(AcousticGuitar::kTwelve, 110.0f);
    const double steel_high = two_octaves_over(AcousticGuitar::kSteel, 329.63f);
    const double twelve_high = two_octaves_over(AcousticGuitar::kTwelve, 329.63f);
    std::printf(
        "  two octaves over the note, plucked at 1/4: A2 %.1f dB on steel, %.1f dB on twelve string; E4 %.1f and %.1f "
        "dB\n",
        steel_low, twelve_low, steel_high, twelve_high);
    EXPECT(twelve_low > steel_low + 15.0, "a low course carries a string an octave up");
    EXPECT(std::fabs(twelve_high - steel_high) < 6.0 && twelve_high < -20.0,
           "a course from B3 up is a unison, with no octave string");

    // The pair is Shimmer apart. Two unison strings as loud as each other
    // nearly cancel once a beat; an octave pair beats where the low string's
    // second partial meets the high string.
    auto course = [&](float hz) {
      bare(device);
      device.set_param(p::kType, static_cast<float>(AcousticGuitar::kTwelve));
      device.set_param(p::kShimmer, 1.0f);
      device.set_param(p::kSustain, 12.0f);
      device.note_on(1, hz, 0.8f);
      return mid(render(device, 6.5f, kRate));
    };
    double unison_swing = 0.0, octave_swing = 0.0;
    const double unison_beat = beat_rate(course(329.63f), 329.63, at(0.3), &unison_swing);
    const double octave_beat = beat_rate(course(110.0f), 220.0, at(0.3), &octave_swing);
    std::printf("  Shimmer 1 Hz: a unison course beats at %.2f Hz (%.1f dB), an octave course at %.2f Hz (%.1f dB)\n",
                unison_beat, unison_swing, octave_beat, octave_swing);
    EXPECT_NEAR(unison_beat, 1.0, 0.2, "a unison course beats at the Shimmer rate");
    EXPECT(unison_swing > 10.0, "a unison course beats deeply");
    EXPECT_NEAR(octave_beat, 1.0, 0.2, "an octave course beats at the Shimmer rate");
    EXPECT(octave_swing > 1.5, "the octave beat is deep enough to hear");
  }

  // The body: fixed resonances near 100 and 200 Hz, whatever is played, and
  // a low knock at every pluck.
  {
    auto first = [&](float body, float hz, float rate) {
      device.init(rate);
      device.set_param(p::kBody, body);
      device.set_param(p::kShimmer, 0.0f);
      device.note_on(1, hz, 0.8f);
      return mid(render(device, 0.4f, rate));
    };
    for (float hz : {523.25f, 1046.5f}) {
      const std::vector<float> full = first(1.0f, hz, kRate), none = first(0.0f, hz, kRate);
      const double air = dominant_frequency(full, kRate, 70.0, 140.0, 0, 8192);
      const double top = dominant_frequency(full, kRate, 150.0, 240.0, 0, 8192);
      std::printf("  body peaks under a %.0f Hz note: %.1f Hz and %.1f Hz\n", hz, air, top);
      EXPECT_NEAR(air, 100.0, 4.0, "the air resonance is at 100 Hz whatever the note");
      EXPECT_NEAR(top, 200.0, 6.0, "the top resonance is at 200 Hz whatever the note");
      const double on_mode = db(tone_level(full, 100.0, kRate, 0, 8192));
      EXPECT(on_mode > db(tone_level(full, 141.0, kRate, 0, 8192)) + 10.0,
             "the air mode stands out of its surroundings");
      EXPECT(db(tone_level(full, 200.0, kRate, 0, 8192)) > db(tone_level(full, 240.0, kRate, 0, 8192)) + 8.0,
             "the top mode stands out of its surroundings");
      const double knock = band_db(full, 0, 4096, 60.0, 400.0) - band_db(none, 0, 4096, 60.0, 400.0);
      const double under = band_db(full, 0, 4096, 60.0, 400.0) - band_db(full, 0, 4096, 400.0, 20000.0);
      std::printf("    the knock: %.1f dB more below 400 Hz than the bare string, %.1f dB under the note\n", knock,
                  under);
      EXPECT(knock > 15.0, "with the body off there is no knock");
      EXPECT(under > -26.0 && under < -6.0, "the knock sits under the note, not over it");
      EXPECT(on_mode - db(tone_level(none, 100.0, kRate, 0, 8192)) > 20.0, "Body at 0 is the bare string");
    }
    const std::vector<float> at_48 = first(1.0f, 1046.5f, 48000.0f), at_96 = first(1.0f, 1046.5f, 96000.0f);
    EXPECT_NEAR(db(tone_level(at_96, 100.0, 96000.0, 0, 16384)), db(tone_level(at_48, 100.0, 48000.0, 0, 8192)), 1.5,
                "the knock is as loud at 96 kHz");

    // A harder pluck knocks harder.
    auto knock_at = [&](float gain) {
      device.init(kRate);
      device.set_param(p::kBody, 1.0f);
      device.note_on(1, 1046.5f, gain);
      return db(tone_level(mid(render(device, 0.4f, kRate)), 100.0, kRate, 0, 8192));
    };
    const double harder = knock_at(1.0f) - knock_at(0.3f);
    std::printf("  the knock at gain 1 is %.1f dB over the knock at gain 0.3\n", harder);
    EXPECT(harder > 6.0 && harder < 14.0, "the knock follows the velocity");

    // A note on a body mode is louder for it.
    auto lift = [&](float hz) {
      const std::vector<float> full = first(1.0f, hz, kRate), none = first(0.0f, hz, kRate);
      return db(tone_level(full, hz, kRate, at(0.1), at(0.4))) - db(tone_level(none, hz, kRate, at(0.1), at(0.4)));
    };
    const double on = lift(98.0f), off = lift(138.59f);
    std::printf("  the body lifts the fundamental of G2 by %.1f dB and of C#3 by %.1f dB\n", on, off);
    EXPECT(on > off + 3.0, "a note on the air mode is louder than one between the modes");

    // The balance across the range: no note more than a few dB from the rest.
    double quietest = 1.0e9, loudest = -1.0e9;
    for (int note = 36; note <= 84; note += 6) {
      const std::vector<float> out = first(0.75f, midi_hz(note), kRate);
      const double level = db(rms(out, 0, at(0.3)));
      quietest = std::min(quietest, level);
      loudest = std::max(loudest, level);
    }
    std::printf("  loudness from C2 to C6 at the default body: within %.1f dB\n", loudest - quietest);
    EXPECT(loudest - quietest < 8.0, "the range is even: C2 to C6 within 8 dB");
  }

  // Tone is a shelf: it moves the top and leaves the note alone.
  {
    auto note = [&](float tone) {
      bare(device);
      device.set_param(p::kNail, 1.0f);
      device.set_param(p::kTone, tone);
      device.note_on(1, 110.0f, 0.8f);
      return mid(render(device, 0.3f, kRate));
    };
    const std::vector<float> dark = note(0.0f), bright = note(1.0f);
    const double top = band_db(bright, 0, 8192, 6000.0, 12000.0) - band_db(dark, 0, 8192, 6000.0, 12000.0);
    const double bottom = db(tone_level(bright, 110.0, kRate, 0, 8192)) - db(tone_level(dark, 110.0, kRate, 0, 8192));
    std::printf("  Tone 0 to 1: %.1f dB at 6 to 12 kHz, %.2f dB at the fundamental\n", top, bottom);
    EXPECT_NEAR(top, 20.0, 2.5, "Tone has 20 dB of travel in the highs");
    EXPECT(std::fabs(bottom) < 1.0, "Tone leaves the fundamental alone");
  }

  // Levels: what one note and a full chord reach at the default settings.
  {
    for (int type = 0; type < 3; ++type) {
      double least_7 = 1.0e9, most_7 = -1.0e9, least_8 = 1.0e9, most_8 = -1.0e9;
      for (int note = 36; note <= 84; note += 4) {
        for (float gain : {0.7f, 0.8f}) {
          device.init(kRate);
          device.set_param(p::kType, static_cast<float>(type));
          device.note_on(1, midi_hz(note), gain);
          const Stereo out = render(device, 0.5f, kRate);
          const double level = db(std::max(peak(out.left), peak(out.right)));
          if (gain < 0.75f) {
            least_7 = std::min(least_7, level);
            most_7 = std::max(most_7, level);
          } else {
            least_8 = std::min(least_8, level);
            most_8 = std::max(most_8, level);
          }
        }
      }
      std::printf("  type %d, one note, C2 to C6: %.1f to %.1f dBFS at gain 0.7, %.1f to %.1f dBFS at gain 0.8\n", type,
                  least_7, most_7, least_8, most_8);
      EXPECT(least_7 > -24.0 && most_7 < -10.0, "one note at gain 0.7 peaks between -24 and -10 dBFS");
      EXPECT(least_8 > -22.0 && most_8 < -16.0, "one note at gain 0.8 peaks between -22 and -16 dBFS");
    }
    const int chord[10] = {40, 45, 50, 55, 59, 64, 67, 71, 74, 76};
    for (int type = 0; type < 3; ++type) {
      device.init(kRate);
      device.set_param(p::kType, static_cast<float>(type));
      for (int n = 0; n < 10; ++n) device.note_on(n, midi_hz(chord[n]), 0.8f);
      const Stereo out = render(device, 2.0f, kRate);
      const double level = std::max(peak(out.left), peak(out.right));
      std::printf("  type %d, ten notes at gain 0.8: %.1f dBFS\n", type, db(level));
      EXPECT(level < 0.5, "ten held notes stay under the clip knee");
    }
  }

  // Volume is in decibels.
  {
    auto peak_at = [&](float volume) {
      device.init(kRate);
      device.set_param(p::kVolume, volume);
      device.note_on(1, 220.0f, 0.8f);
      return db(peak(mid(render(device, 0.3f, kRate))));
    };
    EXPECT_NEAR(peak_at(-9.0f) - peak_at(-21.0f), 12.0, 0.1, "12 dB on the Volume knob is 12 dB at the output");
  }

  // Stereo: low strings a little left, high ones a little right, and
  // nothing that a mono sum would lose.
  {
    auto lean = [&](float hz) {
      device.init(kRate);
      device.note_on(1, hz, 0.8f);
      const Stereo out = render(device, 0.5f, kRate);
      return db(rms(out.right)) - db(rms(out.left));
    };
    const double low = lean(65.41f), high = lean(1046.5f);
    std::printf("  right over left: %.1f dB at C2, %.1f dB at C6\n", low, high);
    EXPECT(low < -0.5 && low > -6.0, "a low string leans left, gently");
    EXPECT(high > 0.5 && high < 6.0, "a high string leans right, gently");
    device.init(kRate);
    const int chord[6] = {40, 47, 52, 56, 59, 64};
    for (int n = 0; n < 6; ++n) device.note_on(n, midi_hz(chord[n]), 0.8f);
    const Stereo out = render(device, 2.0f, kRate);
    const double together = correlation(out.left, out.right);
    const double mono_loss = db(0.5 * (rms(out.left) + rms(out.right))) - db(rms(mid(out)));
    std::printf(
        "  a six-string chord: left and right correlate %.2f, a mono sum loses %.2f dB, side is %.1f dB under mid\n",
        together, mono_loss, db(rms(mid(out))) - db(rms(side(out))));
    EXPECT(together > 0.7, "left and right are mostly the same signal");
    EXPECT(mono_loss < 1.0, "a mono sum loses under 1 dB");
    EXPECT(rms(side(out)) < 0.5 * rms(mid(out)), "the side stays at least 6 dB under the mid");
    EXPECT(rms(side(out)) > 0.02 * rms(mid(out)), "it is not mono either");
  }

  // Nothing folds back: between the partials of a top note there is nothing.
  {
    double worst = 0.0;
    for (float hz : {1046.5f, 1567.98f, 2093.0f, 2959.96f, 3951.07f}) {
      for (float nail : {0.5f, 1.0f}) {
        bare(device);
        device.set_param(p::kNail, nail);
        device.set_param(p::kTone, 1.0f);
        device.set_param(p::kSustain, 12.0f);
        device.note_on(1, hz, 1.0f);
        const std::vector<float> out = mid(render(device, 0.6f, kRate));
        const double found = partial_near(out, hz, kRate, at(0.05), at(0.4));
        worst = std::max(worst, between_partials_share(out, found, at(0.03)));
      }
    }
    std::printf("  worst energy between the partials, C6 to B7: %.1f dB\n",
                10.0 * std::log10(std::max(worst, 1.0e-20)));
    EXPECT(worst < 1.0e-5, "top notes do not alias: under -50 dB between the partials");
  }

  // Strum spreads a chord low to high, a fifth of the knob between notes,
  // whatever order the keys arrive in.
  {
    const float chord[4] = {164.81f, 220.0f, 277.18f, 329.63f};
    const int order[4] = {2, 0, 3, 1};
    auto setup = [&](float strum) {
      device.init(kRate);
      device.set_param(p::kNail, 0.0f);
      device.set_param(p::kStrum, strum);
    };
    for (float rate : {48000.0f, 96000.0f}) {
      device.init(rate);
      device.set_param(p::kNail, 0.0f);
      device.set_param(p::kStrum, 100.0f);
      for (int n : order) device.note_on(n, chord[n], 0.8f);
      const Stereo strummed = render(device, 0.5f, rate);
      device.init(rate);
      device.set_param(p::kNail, 0.0f);
      device.set_param(p::kStrum, 0.0f);
      Stereo by_hand;
      for (int n = 0; n < 4; ++n) {
        device.note_on(n, chord[n], 0.8f);
        by_hand = concat(by_hand, render(device, n < 3 ? 0.02f : 0.44f, rate));
      }
      const double apart = worst_difference(strummed, by_hand);
      std::printf("  a 100 ms strum against the same notes played 20 ms apart by hand, at %.0f kHz: differs by %.2g\n",
                  rate / 1000.0, apart);
      EXPECT(apart < 1.0e-5, "a strummed chord is its notes 20 ms apart, lowest first");
    }

    // The same by the clock: the top note of a pair arrives one step late.
    auto top_onset = [&](float strum, bool with_low) {
      setup(strum);
      // Silence first, so the note's start is inside the picture.
      const Stereo before = render(device, 0.01f, kRate);
      device.note_on(1, 3900.0f, 0.8f);
      if (with_low) device.note_on(2, 600.0f, 0.8f);
      return static_cast<double>(onset_of(mid(concat(before, render(device, 0.2f, kRate))), 3900.0));
    };
    const double alone = top_onset(120.0f, false);
    const double late = (top_onset(120.0f, true) - alone) * 1000.0 / kRate;
    const double together = (top_onset(0.0f, true) - alone) * 1000.0 / kRate;
    std::printf("  Strum 120 ms: the upper of two notes starts %.2f ms after the lower (%.2f ms with Strum at 0)\n",
                late, together);
    EXPECT_NEAR(late, 24.0, 1.0, "the next string is a fifth of the Strum time later");
    EXPECT(std::fabs(together) < 0.5, "with Strum at 0 a chord starts together");

    // One note is never delayed, and neither is a note that is not part of a chord.
    setup(120.0f);
    device.note_on(1, 220.0f, 0.8f);
    const Stereo single = render(device, 0.05f, kRate);
    size_t first = 0;
    while (first < single.size() && single.left[first] == 0.0f) ++first;
    EXPECT(first < 4, "a single note starts at once whatever Strum says");
    auto melody = [&](float strum) {
      setup(strum);
      Stereo out;
      for (int n = 0; n < 4; ++n) {
        device.note_on(n, chord[3 - n], 0.8f);
        out = concat(out, render(device, 0.05f, kRate));
      }
      return out;
    };
    EXPECT(worst_difference(melody(120.0f), melody(0.0f)) == 0.0,
           "notes 50 ms apart are a melody: Strum leaves them alone");
  }

  // Playing a ringing string again stops it first: no click, no pile-up.
  {
    auto strikes = [&](int count, bool same_key) {
      device.init(kRate);
      Stereo out;
      for (int n = 0; n < count; ++n) {
        device.note_on(same_key ? 1 : n, 220.0f, 0.8f);
        out = concat(out, render(device, 0.25f, kRate));
      }
      return mid(out);
    };
    for (bool same_key : {false, true}) {
      const std::vector<float> out = strikes(12, same_key);
      const double first_peak = peak(out, 0, at(0.1));
      // A pluck starts with a step of its own: the first sample out of silence.
      const double first_step = std::max(max_step(out, 0, at(0.1)), std::fabs(static_cast<double>(out[0])));
      double worst_step = 0.0, loudest = 0.0, quietest = 1.0e9;
      for (int n = 1; n < 12; ++n) {
        const size_t from = at(0.25 * n);
        worst_step = std::max(worst_step, max_step(out, from - 48, from + at(0.1)));
        loudest = std::max(loudest, peak(out, from, from + at(0.1)));
        quietest = std::min(quietest, peak(out, from, from + at(0.1)));
      }
      std::printf(
          "  twelve strikes of one string (%s): peaks %.1f to %.1f dB of the first, largest step %.2f of the first "
          "pluck's\n",
          same_key ? "one key" : "twelve keys", db(quietest / first_peak), db(loudest / first_peak),
          worst_step / first_step);
      EXPECT(db(loudest / first_peak) < 3.0 && db(quietest / first_peak) > -3.0,
             "each strike is as loud as the first: nothing piles up");
      EXPECT(worst_step < 1.5 * first_step, "striking a ringing string makes no step larger than a pluck's own");
    }
  }

  // One string per pitch: the same note sent twice, or hammered faster than
  // a finger can stop the string, is still one string.
  {
    auto level = [&](int mode) {
      device.init(kRate);
      device.set_param(p::kStrum, mode == 3 ? 100.0f : 0.0f);
      device.note_on(1, 220.0f, 0.8f);
      Stereo out;
      if (mode == 1) device.note_on(2, 220.0f, 0.8f);
      if (mode == 2) {
        for (int n = 0; n < 8; ++n) {
          out = concat(out, render(device, 0.001f, kRate));
          device.note_on(10 + n, 220.0f, 0.8f);
        }
      }
      if (mode == 3) {
        // A chord sent again while its strum is still on the way.
        device.note_on(2, 330.0f, 0.8f);
        device.note_on(3, 440.0f, 0.8f);
        out = concat(out, render(device, 0.005f, kRate));
        device.note_on(4, 220.0f, 0.8f);
        device.note_on(5, 330.0f, 0.8f);
        device.note_on(6, 440.0f, 0.8f);
      }
      out = concat(out, render(device, 0.6f, kRate));
      const std::vector<float> all = mid(out);
      const size_t end = all.size();
      return db(tone_level(all, mode == 3 ? 330.0 : 220.0, kRate, end - at(0.5), end - at(0.2)));
    };
    const double one = level(0), twice = level(1), hammered = level(2);
    std::printf("  one string per pitch: sent twice %.1f dB, hammered eight times in 8 ms %.1f dB over a single note\n",
                twice - one, hammered - one);
    EXPECT(std::fabs(twice - one) < 1.5, "the same note sent twice at once is one string");
    EXPECT(std::fabs(hammered - one) < 2.5, "a note hammered every millisecond does not pile up");
    device.init(kRate);
    device.set_param(p::kStrum, 100.0f);
    device.note_on(1, 220.0f, 0.8f);
    device.note_on(2, 330.0f, 0.8f);
    device.note_on(3, 440.0f, 0.8f);
    const std::vector<float> chord_once = mid(render(device, 0.605f, kRate));
    const double once =
        db(tone_level(chord_once, 330.0, kRate, chord_once.size() - at(0.5), chord_once.size() - at(0.2)));
    EXPECT(std::fabs(level(3) - once) < 2.0, "a chord sent again during its own strum does not double its strings");
  }

  // Stealing a voice fades it first.
  {
    auto pile = [&](int held) {
      device.init(kRate);
      device.set_param(p::kNail, 0.0f);
      device.set_param(p::kStrum, 0.0f);
      for (int n = 0; n < held; ++n) device.note_on(n, midi_hz(40 + 3 * n), 1.0f);
      Stereo out = render(device, 0.1f, kRate);
      device.note_on(100, midi_hz(43), 0.3f);
      return mid(concat(out, render(device, 0.1f, kRate)));
    };
    const std::vector<float> stolen = pile(AcousticGuitar::kMaxVoices), spare = pile(AcousticGuitar::kMaxVoices - 1);
    const double before = max_step(stolen, at(0.05), at(0.1));
    const double with_steal = max_step(stolen, at(0.1), at(0.115)), without = max_step(spare, at(0.1), at(0.115));
    std::printf("  a thirteenth note: largest step %.4f (%.4f in the 50 ms before; %.4f when a voice was free)\n",
                with_steal, before, without);
    EXPECT(with_steal < 1.3 * std::max(before, without), "a stolen voice goes without a click");
  }

  // Key up: the note fades over Release, highs first, and never clicks.
  {
    auto let_go = [&](float release, float seconds) {
      bare(device);
      device.set_param(p::kNail, 1.0f);
      device.set_param(p::kRelease, release);
      device.note_on(1, 146.83f, 0.8f);
      Stereo out = render(device, 0.2f, kRate);
      device.note_off(1);
      return mid(concat(out, render(device, seconds, kRate)));
    };
    const std::vector<float> out = let_go(0.4f, 1.2f);
    const double start = db(rms(out, at(0.15), at(0.2)));
    const double half = db(rms(out, at(0.375), at(0.425))) - start, whole = db(rms(out, at(0.575), at(0.625))) - start;
    std::printf("  Release 0.4 s: %.1f dB after 0.2 s, %.1f dB after 0.4 s\n", half, whole);
    EXPECT(half < -24.0 && half > -45.0, "half the Release time is about half the way down");
    EXPECT(whole < -55.0, "the note is gone after the Release time");
    const double highs = band_db(out, at(0.3), 2048, 2000.0, 20000.0) - band_db(out, at(0.15), 2048, 2000.0, 20000.0);
    const double lows = band_db(out, at(0.3), 2048, 50.0, 400.0) - band_db(out, at(0.15), 2048, 50.0, 400.0);
    std::printf("    0.12 s after key-up: above 2 kHz %.1f dB, below 400 Hz %.1f dB\n", highs, lows);
    EXPECT(highs < lows - 12.0, "the highs go first, like a finger on the string");
    EXPECT(max_step(out, at(0.2) - 8, at(0.3)) <= 1.05 * max_step(out, at(0.1), at(0.2) - 8), "key-up makes no click");
    bool silent = true;
    for (size_t i = at(1.2); i < out.size(); ++i) silent = silent && out[i] == 0.0f;
    EXPECT(silent, "a released note ends in exact silence");

    const std::vector<float> fast = let_go(0.05f, 0.5f);
    EXPECT(db(rms(fast, at(0.26), at(0.28))) - db(rms(fast, at(0.18), at(0.2))) < -50.0,
           "the shortest Release is a stopped string");
    EXPECT(max_step(fast, at(0.2) - 8, at(0.3)) <= 1.05 * max_step(fast, at(0.1), at(0.2) - 8),
           "even the shortest Release makes no click");

    // The longest Release lets the string ring on.
    const std::vector<float> rung = let_go(10.0f, 1.3f);
    bare(device);
    device.set_param(p::kNail, 1.0f);
    device.note_on(1, 146.83f, 0.8f);
    const std::vector<float> held = mid(render(device, 1.5f, kRate));
    const double gap =
        db(tone_level(held, 146.83, kRate, at(1.2), at(1.4))) - db(tone_level(rung, 146.83, kRate, at(1.2), at(1.4)));
    std::printf("    Release 10 s: one second after key-up the note is %.1f dB under a held one\n", gap);
    EXPECT(gap > 3.0 && gap < 9.0, "a long Release lets the note ring on, fading slowly");

    // A key let go before its string is plucked still sounds, then stops.
    device.init(kRate);
    device.set_param(p::kStrum, 120.0f);
    device.set_param(p::kRelease, 0.1f);
    device.note_on(1, 100.0f, 0.8f);
    device.note_on(2, 450.0f, 0.8f);
    device.note_off(2);
    const std::vector<float> tapped = mid(render(device, 1.0f, kRate));
    const double sounded = tone_level(tapped, 450.0, kRate, at(0.024), at(0.064));
    std::printf("    a key let go during the strum: its note reaches %.4f, then %.6f\n", sounded,
                tone_level(tapped, 450.0, kRate, at(0.3), at(0.4)));
    EXPECT(sounded > 0.004, "a key let go during the strum is still plucked");
    EXPECT(tone_level(tapped, 450.0, kRate, at(0.3), at(0.4)) < 0.003 * sounded, "and is then released");
  }

  // Type, Position, Nail, Sustain and Shimmer belong to the pluck: a ringing
  // note keeps the ones it was plucked with. Body, Tone and Volume are live
  // and move without a step.
  {
    auto chord = [&](int change) {
      device.init(kRate);
      const int notes[4] = {45, 52, 57, 61};
      for (int n = 0; n < 4; ++n) device.note_on(n, midi_hz(notes[n]), 0.8f);
      Stereo out = render(device, 0.3f, kRate);
      if (change == 1) {
        device.set_param(p::kType, 1.0f);
        device.set_param(p::kPosition, 0.4f);
        device.set_param(p::kNail, 1.0f);
        device.set_param(p::kSustain, 0.5f);
        device.set_param(p::kShimmer, 1.5f);
        device.set_param(p::kStrum, 120.0f);
        device.set_param(p::kRelease, 0.05f);
      }
      for (int block = 0; block < 300; ++block) {
        const float along = static_cast<float>(block % 100) / 99.0f;
        if (change == 2) {
          device.set_param(p::kBody, along);
          device.set_param(p::kTone, 1.0f - along);
          device.set_param(p::kVolume, -30.0f + 30.0f * along);
        }
        out = concat(out, render(device, 128.0f / kRate, kRate));
      }
      return out;
    };
    const Stereo plain = chord(0), per_note = chord(1), swept = chord(2);
    EXPECT(worst_difference(plain, per_note) == 0.0, "a ringing note keeps the settings it was plucked with");
    const double still = max_step(plain.left, at(0.3)), moving = max_step(swept.left, at(0.3));
    std::printf("  Body, Tone and Volume swept end to end every 0.27 s: largest step %.4f (%.4f unswept)\n", moving,
                still);
    EXPECT(moving < 1.5 * still, "sweeping Body, Tone and Volume makes no click");
  }

  // The same audio whatever the block size.
  {
    auto played = [&](int block) {
      device.init(kRate);
      device.set_param(p::kStrum, 60.0f);
      const int notes[5] = {40, 47, 52, 56, 59};
      for (int n = 0; n < 5; ++n) device.note_on(n, midi_hz(notes[n]), 0.8f);
      Stereo out = render(device, 0.4f, kRate, block);
      device.note_on(9, midi_hz(47), 0.6f);
      for (int n = 0; n < 3; ++n) device.note_off(n);
      device.set_param(p::kTone, 0.2f);
      return concat(out, render(device, 0.6f, kRate, block));
    };
    const Stereo whole = played(128);
    EXPECT(worst_difference(whole, played(1)) == 0.0, "blocks of one sample give the same audio as blocks of 128");
    EXPECT(worst_difference(whole, played(37)) == 0.0, "odd blocks give the same audio as blocks of 128");
  }

  device.init(kRate);
  for (int n = 0; n < AcousticGuitar::kMaxVoices; ++n) device.note_on(n, midi_hz(40 + 3 * n), 0.8f);
  report_cost("acoustic-guitar (12 strings)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("acoustic-guitar");
}
