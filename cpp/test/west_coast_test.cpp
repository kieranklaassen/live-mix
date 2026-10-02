// Native harness for West Coast (cpp/devices/west-coast).

#include <algorithm>
#include <complex>
#include <cstdlib>

#include "../devices/west-coast/west_coast.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::WestCoast;
namespace p = livemix::west_coast;

static WestCoast device;

static const float kRate = 48000.0f;

// --- measuring ----------------------------------------------------------------------------

static void fft(std::vector<std::complex<double>>& a) {
  const size_t n = a.size();
  for (size_t i = 1, j = 0; i < n; ++i) {
    size_t bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) std::swap(a[i], a[j]);
  }
  for (size_t len = 2; len <= n; len <<= 1) {
    const double angle = -2.0 * kPi / static_cast<double>(len);
    const std::complex<double> turn(std::cos(angle), std::sin(angle));
    for (size_t i = 0; i < n; i += len) {
      std::complex<double> w(1.0, 0.0);
      for (size_t k = 0; k < len / 2; ++k) {
        const std::complex<double> u = a[i + k], v = a[i + k + len / 2] * w;
        a[i + k] = u + v;
        a[i + k + len / 2] = u - v;
        w *= turn;
      }
    }
  }
}

// Magnitude spectrum of x[from, from + n), n a power of two, through a
// four-term Blackman-Harris window (side lobes below -92 dB): a sine of
// amplitude 1 on a bin reads 1.
struct Spectrum {
  std::vector<double> bins;
  double bin_hz = 1.0;

  Spectrum(const std::vector<float>& x, size_t from, size_t n, double rate) : bins(n / 2), bin_hz(rate / n) {
    std::vector<std::complex<double>> a(n);
    double window_sum = 0.0;
    for (size_t i = 0; i < n; ++i) {
      const double t = 2.0 * kPi * static_cast<double>(i) / static_cast<double>(n);
      const double w = 0.35875 - 0.48829 * std::cos(t) + 0.14128 * std::cos(2.0 * t) - 0.01168 * std::cos(3.0 * t);
      window_sum += w;
      a[i] = (from + i < x.size() ? x[from + i] : 0.0f) * w;
    }
    fft(a);
    for (size_t i = 0; i < n / 2; ++i) bins[i] = 2.0 * std::abs(a[i]) / window_sum;
  }

  // The strongest bin within `guard` bins of `hz`.
  double at(double hz, int guard = 4) const {
    const long centre = std::lround(hz / bin_hz);
    double best = 0.0;
    for (long i = centre - guard; i <= centre + guard; ++i) {
      if (i >= 0 && i < static_cast<long>(bins.size())) best = std::max(best, bins[static_cast<size_t>(i)]);
    }
    return best;
  }

  // Energy-weighted mean frequency.
  double centroid() const {
    double weighted = 0.0, total = 0.0;
    for (size_t i = 1; i < bins.size(); ++i) {
      weighted += static_cast<double>(i) * bins[i] * bins[i];
      total += bins[i] * bins[i];
    }
    return total > 0.0 ? weighted / total * bin_hz : 0.0;
  }

  // The strongest component between 30 Hz and `top` that is not within
  // `guard` bins of a harmonic of `f0`.
  double worst_inharmonic(double f0, double top, int guard = 8) const {
    double worst = 0.0;
    for (size_t i = 0; i < bins.size(); ++i) {
      const double hz = static_cast<double>(i) * bin_hz;
      if (hz < 30.0 + guard * bin_hz || hz > top) continue;
      const double k = std::round(hz / f0);
      if (k >= 1.0 && std::fabs(hz - k * f0) <= guard * bin_hz) continue;
      worst = std::max(worst, bins[i]);
    }
    return worst;
  }
};

// A held, fully open, unvarying voice: what the oscillator and the folder
// do, without the gate, chance or drift.
static void steady(float rate) {
  device.init(rate);
  device.set_param(p::kSustain, 1.0f);
  device.set_param(p::kColour, 1.0f);
  device.set_param(p::kChance, 0.0f);
  device.set_param(p::kDrift, 0.0f);
  device.set_param(p::kFm, 0.0f);
  device.set_param(p::kTimbreEnv, 0.0f);
  device.set_param(p::kSymmetry, 0.0f);
}

// The default patch with nothing random in it.
static void plain(float rate) {
  device.init(rate);
  device.set_param(p::kChance, 0.0f);
  device.set_param(p::kDrift, 0.0f);
}

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

// Seconds from the loudest 20 ms of `x` until its level is `drop` dB lower.
static double fall_time(const std::vector<float>& x, double rate, double drop) {
  const size_t window = static_cast<size_t>(0.02 * rate), hop = static_cast<size_t>(0.005 * rate);
  std::vector<double> level;
  for (size_t from = 0; from + window <= x.size(); from += hop) level.push_back(db(rms(x, from, from + window)));
  size_t top = 0;
  for (size_t i = 0; i < level.size(); ++i) {
    if (level[i] > level[top]) top = i;
  }
  for (size_t i = top; i < level.size(); ++i) {
    if (level[i] < level[top] - drop) return static_cast<double>(i - top) * 0.005;
  }
  return -1.0;
}

// --- behaviour ----------------------------------------------------------------------------

// Measured numbers, printed when VERBOSE is set in the environment.
static const bool kVerbose = std::getenv("VERBOSE") != nullptr;
#define NOTE(...)                        \
  do {                                   \
    if (kVerbose) std::printf(__VA_ARGS__); \
  } while (0)

// The note sounds at the pitch asked for, from the bottom of a bass to the
// top of a whistle, with and without FM (at a whole-number ratio the
// sidebands land on harmonics and the pitch must not move).
static void check_tuning() {
  for (float fm : {0.0f, 0.5f}) {
    for (float hz : {55.0f, 110.0f, 220.0f, 440.0f, 880.0f, 1760.0f}) {
      steady(kRate);
      device.set_param(p::kFold, 0.35f);
      device.set_param(p::kFm, fm);
      device.note_on(1, hz, 0.8f);
      const Stereo out = render(device, 2.0f, kRate);
      const double found = dominant_frequency(out.left, kRate, hz * 0.94, hz * 1.06, 24000, 96000);
      NOTE("tuning: %6.0f Hz fm %.1f -> %8.2f Hz (%+.2f cents)\n", hz, fm, found, cents(found, hz));
      EXPECT_NEAR(cents(found, hz), 0.0, 3.0, "a note is in tune within 3 cents");
    }
  }
  // The default patch drifts, but stays within the same 3 cents.
  device.init(kRate);
  device.set_param(p::kSustain, 1.0f);
  device.note_on(1, 440.0f, 0.8f);
  const Stereo out = render(device, 2.0f, kRate);
  const double found = dominant_frequency(out.left, kRate, 415.0, 466.0, 24000, 96000);
  NOTE("tuning: default patch 440 Hz -> %.2f Hz (%+.2f cents)\n", found, cents(found, 440.0));
  EXPECT_NEAR(cents(found, 440.0), 0.0, 3.0, "the default drift keeps a note within 3 cents");
}

// Fold 0 is a pure sine; turning it up puts more and more energy above the
// fifth harmonic while the loudness and the fundamental stay put. Symmetry
// brings in the even harmonics, which are absent at zero.
static void check_fold() {
  const float hz = 220.0f;
  double last_above = -200.0, reference_rms = 0.0, reference_fund = 0.0;
  for (float fold : {0.0f, 0.2f, 0.4f, 0.6f, 0.8f, 1.0f}) {
    steady(kRate);
    device.set_param(p::kFold, fold);
    device.note_on(1, hz, 0.8f);
    const Stereo out = render(device, 2.0f, kRate);
    const Spectrum spectrum(out.left, 16384, 65536, kRate);
    const double fundamental = spectrum.at(hz);
    double above = 0.0, overtones = 0.0;
    for (int k = 2; k * hz < 20000.0f; ++k) {
      const double level = spectrum.at(k * hz) / fundamental;
      overtones += level * level;
      if (k > 5) above += level * level;
    }
    const double above_db = 10.0 * std::log10(above + 1.0e-20);
    const double level_db = db(rms(out.left, 16384));
    NOTE("fold %.1f: rms %6.2f dB, fundamental %6.2f dB, overtones %6.1f dB, above 5th %6.1f dB\n", fold, level_db,
         db(fundamental), 10.0 * std::log10(overtones + 1.0e-20), above_db);
    if (fold == 0.0f) {
      reference_rms = level_db;
      reference_fund = db(fundamental);
      EXPECT(overtones < 1.0e-8, "Fold 0 is a pure sine (overtones below -80 dB)");
    } else {
      EXPECT(above_db > last_above + 0.5, "more Fold puts more energy above the fifth harmonic");
      EXPECT_NEAR(level_db, reference_rms, 1.0, "Fold does not change the loudness");
      EXPECT_NEAR(db(fundamental), reference_fund, 4.0, "the fundamental stays solid under the folds");
    }
    last_above = above_db;
  }
  double even_db[3] = {};
  int n = 0;
  for (float symmetry : {0.0f, 0.5f, 1.0f}) {
    steady(kRate);
    device.set_param(p::kFold, 0.5f);
    device.set_param(p::kSymmetry, symmetry);
    device.note_on(1, hz, 0.8f);
    const Stereo out = render(device, 2.0f, kRate);
    const Spectrum spectrum(out.left, 16384, 65536, kRate);
    double even = 0.0;
    for (int k = 2; k <= 16; k += 2) even += std::pow(spectrum.at(k * hz) / spectrum.at(hz), 2.0);
    even_db[n++] = 10.0 * std::log10(even + 1.0e-20);
    EXPECT(std::fabs(mean(out.left, 16384)) < 1.0e-3, "Symmetry leaves no DC at the output");
  }
  NOTE("symmetry 0 / 0.5 / 1: even harmonics %.1f / %.1f / %.1f dB re fundamental\n", even_db[0], even_db[1], even_db[2]);
  EXPECT(even_db[0] < -80.0, "no even harmonics without Symmetry");
  EXPECT(even_db[1] > -30.0 && even_db[2] > even_db[1] + 2.0, "Symmetry raises the even harmonics");
}

// The folder stays clean at high notes at 44.1 kHz: with everything it
// folds, nothing that is not a harmonic stands above -60 dB.
static void check_aliasing() {
  const float rate = 44100.0f;
  for (float hz : {1760.0f, 2637.0f, 3520.0f}) {
    for (float symmetry : {0.0f, 1.0f}) {
      steady(rate);
      device.set_param(p::kFold, 1.0f);
      device.set_param(p::kSymmetry, symmetry);
      device.note_on(1, hz, 1.0f);
      const Stereo out = render(device, 2.0f, rate);
      const Spectrum spectrum(out.left, 16384, 65536, rate);
      const double worst = db(spectrum.worst_inharmonic(hz, 20000.0) / spectrum.at(hz));
      NOTE("aliasing: %4.0f Hz, Fold 1, Symmetry %.0f at 44.1 kHz: worst inharmonic %.1f dB re fundamental\n", hz,
           symmetry, worst);
      EXPECT(worst < -60.0, "no inharmonic component above -60 dB at a high note with Fold 1");
    }
  }
}

// The gate. Struck, it opens within 5 ms; it then takes about Decay to fall
// 60 dB, quickly at first and slowly at the end, and the tone darkens as
// it goes (the cutoff closes faster than the level).
static void check_gate() {
  plain(kRate);
  device.note_on(1, 880.0f, 1.0f);
  Stereo out = render(device, 0.5f, kRate);
  const size_t window = 48;  // 1 ms
  double top = 0.0;
  for (size_t from = 0; from + window <= out.size(); from += 12) top = std::max(top, rms(out.left, from, from + window));
  double opened_ms = -1.0;
  for (size_t from = 0; from + window <= out.size(); from += 12) {
    if (rms(out.left, from, from + window) >= 0.9 * top) {
      opened_ms = (from + window) * 1000.0 / kRate;
      break;
    }
  }
  NOTE("gate: a strike reaches 90 %% of its level %.2f ms after the key\n", opened_ms);
  EXPECT(opened_ms > 0.0 && opened_ms < 5.0, "a strike opens the gate within 5 ms");

  for (float decay : {0.15f, 0.6f, 2.5f}) {
    plain(kRate);
    device.set_param(p::kDecay, decay);
    device.note_on(1, 220.0f, 0.8f);
    out = render(device, decay * 3.0f + 0.5f, kRate);
    const double t20 = fall_time(out.left, kRate, 20.0), t60 = fall_time(out.left, kRate, 60.0);
    NOTE("gate: Decay %.2f s -> -20 dB after %.3f s, -60 dB after %.3f s\n", decay, t20, t60);
    EXPECT(t60 > 0.75 * decay && t60 < 1.25 * decay, "a note takes about Decay to fall 60 dB");
    // A plain exponential spends a third of the time on the first 20 dB;
    // the vactrol lets go fast and then lingers.
    EXPECT(t20 > 0.0 && t20 < 0.3 * t60, "the decay starts fast and ends slow");
    EXPECT(peak(out.left, out.size() - 4800) == 0.0, "the voice ends in true silence");
  }

  plain(kRate);
  device.set_param(p::kDecay, 0.6f);
  device.note_on(1, 220.0f, 0.8f);
  out = render(device, 0.5f, kRate);
  double centroid[4] = {};
  const size_t starts[4] = {0, 1536, 4096, 12288};
  for (int i = 0; i < 4; ++i) centroid[i] = Spectrum(out.left, starts[i], 1024, kRate).centroid();
  NOTE("gate: centroid %.0f Hz at the strike, %.0f Hz after 32 ms, %.0f Hz after 85 ms, %.0f Hz after 256 ms\n",
       centroid[0], centroid[1], centroid[2], centroid[3]);
  EXPECT(centroid[0] > 1.3 * centroid[1] && centroid[1] > 1.3 * centroid[2], "the tone darkens as the gate closes");
  EXPECT_NEAR(centroid[3], 220.0, 30.0, "the tail of a note is its bare fundamental");
}

// FM puts sidebands at the note plus and minus multiples of the modulator:
// on the harmonics at 2:1, between them at 7:2. (Fold 0, so the folder adds
// nothing of its own.)
static void check_fm() {
  const float hz = 220.0f;
  double levels[3][4] = {};  // [off, 2:1, 7:2][3f, 5f, 2.5f, 4.5f] re the carrier
  const float fm[3] = {0.0f, 0.5f, 0.5f};
  const float ratio[3] = {3.0f, 3.0f, 5.0f};
  for (int n = 0; n < 3; ++n) {
    steady(kRate);
    device.set_param(p::kFold, 0.0f);
    device.set_param(p::kFm, fm[n]);
    device.set_param(p::kRatio, ratio[n]);
    device.note_on(1, hz, 0.8f);
    const Stereo out = render(device, 2.0f, kRate);
    const Spectrum spectrum(out.left, 16384, 65536, kRate);
    const double carrier = spectrum.at(hz);
    const float partials[4] = {3.0f, 5.0f, 2.5f, 4.5f};
    for (int k = 0; k < 4; ++k) levels[n][k] = db(spectrum.at(partials[k] * hz) / carrier);
    NOTE("fm %.1f ratio %s: 3f %6.1f dB, 5f %6.1f dB, 2.5f %6.1f dB, 4.5f %6.1f dB re carrier\n", fm[n],
         ratio[n] == 3.0f ? "2:1" : "7:2", levels[n][0], levels[n][1], levels[n][2], levels[n][3]);
  }
  EXPECT(levels[0][0] < -80.0 && levels[0][2] < -80.0, "no sidebands without FM");
  EXPECT(levels[1][0] > -20.0 && levels[1][1] > -40.0, "FM at 2:1 adds the third and fifth harmonics");
  EXPECT(levels[1][2] < -80.0 && levels[1][3] < -80.0, "FM at 2:1 stays harmonic");
  EXPECT(levels[2][2] > -20.0 && levels[2][3] > -20.0, "FM at 7:2 adds partials between the harmonics");
  EXPECT(levels[2][0] < -60.0, "FM at 7:2 leaves the third harmonic alone");
}

// Sustain 0 is a pluck that dies under a held key; Sustain 1 holds until the
// key goes up and then closes like any other note, without a click. A long
// Attack swells in.
static void check_envelope() {
  plain(kRate);
  device.note_on(1, 220.0f, 0.8f);
  Stereo out = render(device, 3.0f, kRate);
  EXPECT(peak(out.left, 0, 4800) > 0.1, "a pluck sounds");
  EXPECT(peak(out.left, 96000) == 0.0, "with Sustain 0 a held note dies away on its own");

  plain(kRate);
  device.set_param(p::kSustain, 1.0f);
  device.note_on(1, 220.0f, 0.8f);
  out = render(device, 3.0f, kRate);
  const double held_early = db(rms(out.left, 9600, 19200)), held_late = db(rms(out.left, 134400));
  NOTE("envelope: Sustain 1 holds %.2f dB at 0.2 s and %.2f dB at 2.8 s\n", held_early, held_late);
  EXPECT_NEAR(held_late, held_early, 0.5, "with Sustain 1 a held note keeps its level");
  // The steepest step of the held tone is the yardstick for a click.
  const double held_step = max_step(out.left, 96000);
  device.note_off(1);
  const Stereo tail = render(device, 2.0f, kRate);
  const double release_step = max_step(tail.left);
  const double t60 = fall_time(tail.left, kRate, 60.0);
  NOTE("envelope: release step %.5f against %.5f held, -60 dB after %.3f s\n", release_step, held_step, t60);
  EXPECT(release_step <= 1.05 * held_step, "a released note closes without a click");
  EXPECT(t60 > 0.3 && t60 < 0.9, "a released note closes over Decay");
  EXPECT(peak(tail.left, 72000) == 0.0, "a released note ends in silence");

  plain(kRate);
  device.set_param(p::kSustain, 0.5f);
  device.note_on(1, 220.0f, 0.8f);
  out = render(device, 3.0f, kRate);
  const double half = db(rms(out.left, 134400));
  NOTE("envelope: Sustain 0.5 holds %.2f dB\n", half);
  EXPECT(half < held_late - 4.0 && half > held_late - 20.0, "Sustain 0.5 holds a quieter, darker note");

  plain(kRate);
  device.set_param(p::kSustain, 1.0f);
  device.set_param(p::kAttack, 1.0f);
  device.note_on(1, 220.0f, 0.8f);
  out = render(device, 2.0f, kRate);
  const double start = db(rms(out.left, 2400, 7200)), half_way = db(rms(out.left, 21600, 26400));
  const double arrived = db(rms(out.left, 57600, 62400));
  NOTE("envelope: Attack 1 s: %.1f dB at 0.1 s, %.1f dB at 0.5 s, %.1f dB at 1.25 s\n", start, half_way, arrived);
  EXPECT(start < arrived - 12.0 && half_way < arrived - 3.0 && half_way > start + 6.0, "a long Attack swells in");
  EXPECT_NEAR(arrived, held_late, 0.5, "a swell arrives at the held level");
}

// The steepest sample-to-sample step of a held 110 Hz note at one setting.
static double held_step(int id, float value) {
  steady(kRate);
  device.set_param(p::kFold, 0.3f);
  device.set_param(id, value);
  device.note_on(1, 110.0f, 0.8f);
  const Stereo out = render(device, 1.0f, kRate);
  return std::max(max_step(out.left, 24000), max_step(out.right, 24000));
}

// A control thrown from one end to the other while a note sounds must not
// click: no step in the output steeper than the steepest the tone has
// anyway on the way (give or take a quarter).
static void check_clicks() {
  const int ids[6] = {p::kFold, p::kSymmetry, p::kFm, p::kTimbreEnv, p::kColour, p::kVolume};
  const char* names[6] = {"Fold", "Symmetry", "FM", "Timbre Env", "Colour", "Volume"};
  for (int n = 0; n < 6; ++n) {
    const float low = p::kParamMin[ids[n]], high = ids[n] == p::kVolume ? 0.0f : p::kParamMax[ids[n]];
    double yardstick = 0.0;
    for (int k = 0; k <= 4; ++k) yardstick = std::max(yardstick, held_step(ids[n], low + (high - low) * 0.25f * k));
    for (int direction = 0; direction < 2; ++direction) {
      steady(kRate);
      device.set_param(p::kFold, 0.3f);
      device.set_param(ids[n], direction == 0 ? low : high);
      device.note_on(1, 110.0f, 0.8f);
      render(device, 0.5f, kRate);
      device.set_param(ids[n], direction == 0 ? high : low);
      const Stereo out = render(device, 0.5f, kRate);
      const double step = std::max(max_step(out.left), max_step(out.right));
      NOTE("clicks: %s %s: step %.5f against %.5f held\n", names[n], direction == 0 ? "up" : "down", step, yardstick);
      EXPECT(step <= 1.25 * yardstick, "a control thrown across its range does not click");
    }
  }

  // The same key struck again while it rings, and a ninth note that has to
  // take a sounding voice.
  plain(kRate);
  device.set_param(p::kSustain, 1.0f);
  device.note_on(1, 220.0f, 1.0f);
  Stereo out = render(device, 0.5f, kRate);
  const double single = max_step(out.left, 12000);
  plain(kRate);
  device.set_param(p::kSustain, 1.0f);
  device.note_on(1, 220.0f, 0.4f);
  render(device, 0.3f, kRate);
  device.note_on(1, 220.0f, 1.0f);
  out = render(device, 0.3f, kRate);
  NOTE("clicks: second strike on a ringing key: step %.5f against %.5f held\n", max_step(out.left), single);
  EXPECT(max_step(out.left) <= 1.25 * single, "striking a ringing key again does not click");

  plain(kRate);
  device.set_param(p::kSustain, 1.0f);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 4 / 12.0f), 0.7f);
  out = render(device, 0.5f, kRate);
  const double chord = max_step(out.left, 12000);
  device.note_on(8, 311.0f, 0.7f);
  out = render(device, 0.5f, kRate);
  NOTE("clicks: ninth note: step %.5f against %.5f for the chord\n", max_step(out.left), chord);
  EXPECT(max_step(out.left) <= 1.25 * chord, "a ninth note takes a voice without a click");
}

// Four notes on one key, each left to die before the next.
static Stereo four_notes(float chance) {
  plain(kRate);
  device.set_param(p::kChance, chance);
  device.set_param(p::kDecay, 0.3f);
  Stereo out;
  for (int n = 0; n < 4; ++n) {
    device.note_on(1, 220.0f, 0.8f);
    out = n == 0 ? render(device, 1.0f, kRate) : concat(out, render(device, 1.0f, kRate));
    device.note_off(1);
  }
  return out;
}

// Chance makes every note a little different (brightness, edge, length,
// place) from a seeded source: the same notes after init come out the same
// every time. At zero all notes are alike and dead centre.
static void check_chance() {
  const Stereo fixed = four_notes(0.0f);
  double difference = 0.0;
  for (size_t i = 0; i < 48000; ++i) {
    for (size_t n = 1; n < 4; ++n) {
      difference = std::max(difference, std::fabs(static_cast<double>(fixed.left[i] - fixed.left[n * 48000 + i])));
    }
  }
  EXPECT(difference == 0.0, "with Chance 0 every note is the same");
  bool centred = true;
  for (size_t i = 0; i < fixed.size(); ++i) centred = centred && fixed.left[i] == fixed.right[i];
  EXPECT(centred, "with Chance 0 the output is mono (left equals right)");

  const Stereo varied = four_notes(1.0f);
  double brightness[4] = {}, balance[4] = {}, length[4] = {};
  for (size_t n = 0; n < 4; ++n) {
    const std::vector<float> left(varied.left.begin() + n * 48000, varied.left.begin() + (n + 1) * 48000);
    const std::vector<float> right(varied.right.begin() + n * 48000, varied.right.begin() + (n + 1) * 48000);
    brightness[n] = Spectrum(left, 0, 2048, kRate).centroid();
    balance[n] = db(rms(left)) - db(rms(right));
    length[n] = fall_time(left, kRate, 60.0);
    NOTE("chance 1, note %zu: centroid %.0f Hz, left-right %+.1f dB, -60 dB after %.3f s\n", n + 1, brightness[n],
         balance[n], length[n]);
  }
  const auto spread = [](const double* v) { return *std::max_element(v, v + 4) - *std::min_element(v, v + 4); };
  EXPECT(spread(brightness) > 60.0, "Chance varies the brightness from note to note");
  EXPECT(spread(balance) > 3.0, "Chance places notes apart between the speakers");
  EXPECT(spread(length) > 0.05, "Chance varies the length from note to note");
  const double together = correlation(varied.left, varied.right);
  NOTE("chance 1: left/right correlation %.2f\n", together);
  EXPECT(together > 0.3, "a varied sequence still sums to mono without holes");

  const Stereo again = four_notes(1.0f);
  bool same = again.size() == varied.size();
  for (size_t i = 0; same && i < again.size(); ++i) same = again.left[i] == varied.left[i] && again.right[i] == varied.right[i];
  EXPECT(same, "the same notes after init give the same sound, sample for sample");
}

// A harder strike is louder and brighter.
static void check_velocity() {
  double level[3] = {}, brightness[3] = {};
  const float gains[3] = {0.25f, 0.7f, 1.0f};
  for (int n = 0; n < 3; ++n) {
    plain(kRate);
    device.note_on(1, 220.0f, gains[n]);
    const Stereo out = render(device, 1.0f, kRate);
    level[n] = db(peak(out.left));
    brightness[n] = Spectrum(out.left, 0, 2048, kRate).centroid();
    NOTE("velocity %.2f: peak %.1f dBFS, centroid of the strike %.0f Hz\n", gains[n], level[n], brightness[n]);
  }
  EXPECT(level[1] > level[0] + 3.0 && level[2] > level[1] + 1.0, "a harder strike is louder");
  EXPECT(brightness[1] > 1.15 * brightness[0] && brightness[2] > 1.05 * brightness[1], "a harder strike is brighter");
  // One note at gain 0.7 sits where the house level wants it.
  EXPECT(level[1] > -24.0 && level[1] < -10.0, "one note peaks between -24 and -10 dBFS at the default volume");
}

// Eight notes held at once, at the default volume and as hard as they go,
// stay under the knee of the output clip (0.5), and the output is the same
// whatever block size the host uses.
static void check_headroom_and_blocks() {
  double worst = 0.0;
  for (float fold : {0.0f, 0.35f, 1.0f}) {
    device.init(kRate);
    device.set_param(p::kSustain, 1.0f);
    device.set_param(p::kFold, fold);
    for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 4 / 12.0f), 1.0f);
    const Stereo out = render(device, 3.0f, kRate);
    worst = std::max(worst, std::max(peak(out.left), peak(out.right)));
  }
  NOTE("headroom: eight held notes at full velocity peak at %.1f dBFS\n", db(worst));
  EXPECT(worst < 0.5, "eight held notes stay under the clip knee");

  Stereo reference;
  for (int block : {128, 1, 37, 2048}) {
    device.init(kRate);
    device.note_on(1, 220.0f, 0.8f);
    device.note_on(2, 330.0f, 0.6f);
    Stereo out = render(device, 0.4f, kRate, block);
    device.set_param(p::kFold, 0.9f);
    device.note_on(3, 440.0f, 0.7f);
    out = concat(out, render(device, 0.4f, kRate, block));
    if (block == 128) {
      reference = out;
      continue;
    }
    double difference = 0.0;
    for (size_t i = 0; i < out.size(); ++i) {
      difference = std::max(difference, std::fabs(static_cast<double>(out.left[i] - reference.left[i])));
    }
    NOTE("blocks of %d against 128: largest difference %.2e\n", block, difference);
    EXPECT(difference < 1.0e-6, "the sound does not depend on the block size");
  }
}

// CHECKS

int main() {
  Conformance spec;
  spec.name = "west-coast";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 6.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  check_tuning();
  check_fold();
  check_aliasing();
  check_gate();
  check_fm();
  check_envelope();
  check_clicks();
  check_chance();
  check_velocity();
  check_headroom_and_blocks();
  // BEHAVIOUR

  // Cost with every voice sounding at the heaviest setting: eight held
  // notes, full fold with the timbre envelope and symmetry, deep FM.
  device.init(kRate);
  device.set_param(p::kSustain, 1.0f);
  device.set_param(p::kFold, 1.0f);
  device.set_param(p::kSymmetry, 1.0f);
  device.set_param(p::kFm, 1.0f);
  device.set_param(p::kTimbreEnv, 1.0f);
  device.set_param(p::kChance, 1.0f);
  device.set_param(p::kDrift, 1.0f);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
  report_cost("west-coast (8 held notes, full fold and FM)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });

  return finish("west-coast");
}
