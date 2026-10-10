// Native harness for Sub Bass (cpp/devices/sub-bass). The conformance pass
// covers silence before and after notes, a pile of keys, parameter abuse and
// other sample rates; the rest measures what makes it this instrument: a pure
// sine with nothing else in it, harmonics added by known amounts and locked
// to it, a pitch that starts high and lands exactly on the key, a loudness
// with long times and a hold, a drive that changes the tone and not the
// level, one voice that glides, and a strike from silence that is always the
// same samples.
//
// Nobody has listened to this instrument: every claim below is a number.

#include "../devices/sub-bass/sub_bass.h"

#include <algorithm>
#include <cctype>
#include <complex>
#include <cstdlib>
#include <string>
#include <utility>

#include "support/test_kit.h"

using namespace testkit;
using livemix::SubBass;
namespace p = livemix::sub_bass;

static SubBass device;
static SubBass other;  // a second instrument, for renders that must match the first

static const float kRate = 48000.0f;
static const double kE0 = 20.60172, kA0 = 27.5, kA1 = 55.0, kA2 = 110.0, kA3 = 220.0, kC6 = 1046.502,
                    kC8 = 4186.009;

static double cents(double hz, double reference) { return 1200.0 * std::log2(hz / reference); }

// A plain held sine: nothing added, no drop, no drive, a quick start, the
// hold, and the default volume, which keeps every setting under the knee of
// the soft clip (a clip makes harmonics of its own). Each check changes only
// what it is about.
static void plain(SubBass& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kShape, 0.0f);
  d.set_param(p::kHarmonics, 0.0f);
  d.set_param(p::kDrop, 0.0f);
  d.set_param(p::kFall, 40.0f);
  d.set_param(p::kAttack, 0.002f);
  d.set_param(p::kDecay, 20.0f);  // hold
  d.set_param(p::kRelease, 0.05f);
  d.set_param(p::kDrive, 0.0f);
  d.set_param(p::kGlide, 0.0f);
}

// The strongest frequency in [lo, hi] over [from, to): the same idea as
// dominant_frequency, with a first pass that steps by half the window's
// resolution, which is what a narrow band around a known pitch needs.
static double peak_frequency(const std::vector<float>& x, double rate, double lo, double hi, size_t from,
                             size_t to) {
  double span = 0.5 * rate / static_cast<double>(to - from);
  double best_hz = lo, best = -1.0;
  for (double hz = lo; hz <= hi; hz += span) {
    const double level = tone_level(x, hz, rate, from, to);
    if (level > best) {
      best = level;
      best_hz = hz;
    }
  }
  for (int pass = 0; pass < 5; ++pass) {
    const double centre = best_hz;
    for (int i = -5; i <= 5; ++i) {
      const double hz = centre + span * i / 5.0;
      const double level = tone_level(x, hz, rate, from, to);
      if (level > best) {
        best = level;
        best_hz = hz;
      }
    }
    span /= 5.0;
  }
  return best_hz;
}

// Level of harmonic `n` of `f0` against the fundamental, in dB.
static double harmonic_db(const std::vector<float>& x, double f0, int n, size_t from, double rate = kRate) {
  return db(tone_level(x, n * f0, rate, from) / tone_level(x, f0, rate, from));
}

// Hann-weighted mean: the DC a window that is not a whole number of cycles
// would otherwise invent.
static double dc_offset(const std::vector<float>& x, size_t from, size_t to) {
  double sum = 0.0, weights = 0.0;
  const size_t n = to - from;
  for (size_t i = 0; i < n; ++i) {
    const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n));
    sum += w * x[from + i];
    weights += w;
  }
  return sum / weights;
}

// Magnitude spectrum of `n` samples (a power of two) from `from`, under a
// four-term Blackman-Harris window whose own skirt is 92 dB down: amplitude
// 1.0 for a full-scale sine on a bin.
static std::vector<double> spectrum(const std::vector<float>& x, size_t from, size_t n) {
  std::vector<std::complex<double>> a(n);
  double sum = 0.0;
  for (size_t i = 0; i < n; ++i) {
    const double t = 2.0 * kPi * static_cast<double>(i) / static_cast<double>(n);
    const double w = 0.35875 - 0.48829 * std::cos(t) + 0.14128 * std::cos(2.0 * t) - 0.01168 * std::cos(3.0 * t);
    a[i] = w * x[from + i];
    sum += w;
  }
  for (size_t i = 1, j = 0; i < n; ++i) {
    size_t bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) std::swap(a[i], a[j]);
  }
  for (size_t len = 2; len <= n; len <<= 1) {
    const std::complex<double> turn = std::polar(1.0, -2.0 * kPi / static_cast<double>(len));
    for (size_t i = 0; i < n; i += len) {
      std::complex<double> w = 1.0;
      for (size_t k = 0; k < len / 2; ++k) {
        const std::complex<double> u = a[i + k], v = a[i + k + len / 2] * w;
        a[i + k] = u + v;
        a[i + k + len / 2] = u - v;
        w *= turn;
      }
    }
  }
  std::vector<double> magnitude(n / 2);
  for (size_t i = 0; i < n / 2; ++i) magnitude[i] = 2.0 * std::abs(a[i]) / sum;
  return magnitude;
}

// The loudest component of `x` over the whole band, 0 Hz to half the sample
// rate, that is not the note: further than `guard` bins from every harmonic
// of `f0` up to `harmonics` (1 = everything but the fundamental counts), as
// a ratio to the fundamental. `*at` is where it is.
static double loudest_other(const std::vector<float>& x, double f0, double rate, size_t from, int harmonics,
                            double* at) {
  const size_t n = 32768;
  const std::vector<double> magnitude = spectrum(x, from, n);
  const double bin = rate / static_cast<double>(n);
  const double guard = 6.0;
  double worst = 0.0, fundamental = 0.0;
  for (size_t i = 0; i < n / 2; ++i) {
    const double hz = static_cast<double>(i) * bin;
    if (std::fabs(hz - f0) < guard * bin) fundamental = std::max(fundamental, magnitude[i]);
    const double nearest = std::max(1.0, std::min(static_cast<double>(harmonics), std::round(hz / f0)));
    if (std::fabs(hz - nearest * f0) < guard * bin) continue;
    if (magnitude[i] > worst) {
      worst = magnitude[i];
      *at = hz;
    }
  }
  return worst / fundamental;
}

// Where the wave crosses zero going up, in samples (fractional), from `from`.
static std::vector<double> rising(const std::vector<float>& x, size_t from, size_t to) {
  std::vector<double> at;
  to = std::min(to, x.size());
  for (size_t i = from + 1; i < to; ++i) {
    if (x[i - 1] < 0.0f && x[i] >= 0.0f) {
      at.push_back(static_cast<double>(i - 1) + static_cast<double>(-x[i - 1]) / (static_cast<double>(x[i]) - x[i - 1]));
    }
  }
  return at;
}

// The frequency of a plain sine around `seconds`, from the `periods` whole
// cycles that start at the first rising crossing at or after it. Reads a
// pitch that is moving, which a window several cycles long would smear.
static double pitch_at(const std::vector<float>& x, double seconds, int periods = 1, double rate = kRate) {
  const std::vector<double> at = rising(x, static_cast<size_t>(seconds * rate), x.size());
  if (static_cast<int>(at.size()) <= periods) return 0.0;
  return periods * rate / (at[periods] - at[0]);
}

// How abruptly an event arrives: the same passage is rendered with and
// without it, and the largest sample-to-sample step of the difference is
// held against the largest value the difference reaches in 20 ms. A fade or
// a slide moves a small part of the way per sample; a jump is all there at
// once (0.5 or more: the decimators spread a step over two or three
// samples). Eight moments a little apart, so a jump cannot hide in a zero
// crossing; the worst counts. `*corner` is the same for the difference's
// slope: the largest change of its step from one sample to the next, which
// is what a loudness or a pitch that turns a corner leaves in a low sine
// that has no step at all.
template <typename Setup, typename Event>
static double abruptness(Setup setup, Event event, double* corner = nullptr) {
  double worst = 0.0;
  if (corner) *corner = 0.0;
  for (int trial = 0; trial < 8; ++trial) {
    const float lead = 0.3f + 0.0023f * static_cast<float>(trial);
    setup(device);
    render(device, lead, kRate);
    Stereo quiet = render(device, 0.02f, kRate);
    setup(device);
    render(device, lead, kRate);
    event(device);
    Stereo moved = render(device, 0.02f, kRate);
    // Up to the event the two renders are the same: the difference starts
    // with that zero, so a change that is all there in the event's own first
    // sample counts as the jump it is.
    std::vector<float> difference(moved.size() + 2, 0.0f);
    for (size_t i = 0; i < moved.size(); ++i) difference[i + 2] = moved.left[i] - quiet.left[i];
    const double size = peak(difference);
    if (size > 0.0) worst = std::max(worst, max_step(difference) / size);
    if (size > 0.0 && corner) {
      for (size_t i = 2; i < difference.size(); ++i) {
        const double turn = std::fabs(static_cast<double>(difference[i]) - 2.0 * difference[i - 1] + difference[i - 2]);
        *corner = std::max(*corner, turn / size);
      }
    }
  }
  return worst;
}

// Largest difference between two renders.
static double furthest(const Stereo& a, const Stereo& b) {
  double worst = 0.0;
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return a.size() == b.size() ? worst : 1.0e9;
}

// --- the manifest's presets -------------------------------------------------------------------

struct Preset {
  std::string name;
  std::vector<std::pair<int, float>> values;
};

// A reader for exactly what device.json holds: the parameter keys in order,
// then "presets": { "Name": { "key": number, ... }, ... }. The harness is run
// from the repository root (scripts/dev-device.sh).
static std::vector<Preset> load_presets() {
  std::vector<Preset> presets;
  std::vector<std::string> keys;
  std::string text;
  if (std::FILE* file = std::fopen("cpp/devices/sub-bass/device.json", "rb")) {
    char buffer[4096];
    size_t got;
    while ((got = std::fread(buffer, 1, sizeof buffer, file)) > 0) text.append(buffer, got);
    std::fclose(file);
  }
  const size_t params_at = text.find("\"params\"");
  const size_t presets_at = text.find("\"presets\"");
  const size_t origin_at = text.find("\"origin\"");
  if (params_at == std::string::npos || presets_at == std::string::npos || origin_at == std::string::npos) {
    return presets;
  }
  const auto quoted = [&](size_t from, size_t* end) {
    const size_t open = text.find('"', from);
    const size_t close = text.find('"', open + 1);
    *end = close + 1;
    return text.substr(open + 1, close - open - 1);
  };
  for (size_t pos = text.find("\"key\"", params_at); pos != std::string::npos && pos < presets_at;
       pos = text.find("\"key\"", pos + 1)) {
    size_t end;
    keys.push_back(quoted(pos + 5, &end));
  }
  size_t pos = text.find('{', presets_at) + 1;
  while (true) {
    const size_t name_at = text.find('"', pos);
    const size_t close_at = text.find('}', pos);
    if (name_at == std::string::npos || name_at > origin_at || close_at < name_at) break;
    Preset preset;
    size_t end;
    preset.name = quoted(name_at, &end);
    const size_t open = text.find('{', end);
    const size_t close = text.find('}', open);
    pos = open + 1;
    while (true) {
      const size_t key_at = text.find('"', pos);
      if (key_at == std::string::npos || key_at > close) break;
      const std::string key = quoted(key_at, &end);
      const size_t colon = text.find(':', end);
      const float value = std::strtof(text.c_str() + colon + 1, nullptr);
      int id = -1;
      for (size_t k = 0; k < keys.size(); ++k) {
        if (keys[k] == key) id = static_cast<int>(k);
      }
      preset.values.push_back({id, value});
      pos = text.find_first_of(",}", colon);
    }
    presets.push_back(preset);
    pos = close + 1;
  }
  return presets;
}

static char label[400];

// Everything added that a setting can add, for the checks that must hold "at any settings".
static void everything(SubBass& d) {
  d.set_param(p::kShape, 1.0f);
  d.set_param(p::kHarmonics, 1.0f);
  d.set_param(p::kDrive, 1.0f);
}

// In tune: within 3 cents at A0, A1, A2 and A3 at every sample rate, as a
// plain sine and with shape, harmonics, drive and a two-octave drop up (read
// once the fall is over).
static void test_pitch() {
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    double worst_plain = 0.0, worst_full = 0.0;
    for (double hz : {kA0, kA1, kA2, kA3}) {
      for (int full = 0; full < 2; ++full) {
        plain(device, rate);
        if (full) {
          everything(device);
          device.set_param(p::kDrop, 24.0f);
          device.set_param(p::kFall, 300.0f);
        }
        device.note_on(1, static_cast<float>(hz), 0.8f);
        Stereo out = render(device, 3.5f, rate);
        const double found =
            peak_frequency(out.left, rate, hz * 0.99, hz * 1.01, static_cast<size_t>(rate * 0.5f), out.size());
        const double off = cents(found, hz);
        (full ? worst_full : worst_plain) = std::max(full ? worst_full : worst_plain, std::fabs(off));
        std::snprintf(label, sizeof label, "%.1f Hz at %.0f Hz sample rate%s is %.3f cents off", hz, rate,
                      full ? ", everything up after a drop" : "", off);
        EXPECT(std::fabs(off) < 3.0, label);
      }
    }
    std::printf("pitch at %.0f Hz, A0 to A3: plain within %.3f cents, everything up within %.3f cents\n", rate,
                worst_plain, worst_full);
  }
}

// With shape, harmonics and drive at 0 it is a sine: over the whole band
// nothing but the fundamental reaches -60 dB against it.
static void test_pure() {
  for (double hz : {kA0, kA1, kA3}) {
    for (float gain : {0.2f, 1.0f}) {
      plain(device);
      device.note_on(1, static_cast<float>(hz), gain);
      Stereo out = render(device, 2.0f, kRate);
      double at = 0.0;
      const double other_db = db(loudest_other(out.left, hz, kRate, 48000, 1, &at));
      std::snprintf(label, sizeof label,
                    "a plain %.1f Hz note at gain %.1f: the loudest thing that is not the fundamental is %.1f dB "
                    "under it, at %.0f Hz (60 at least)",
                    hz, gain, -other_db, at);
      EXPECT(other_db < -60.0, label);
      if (hz == kA1 && gain == 1.0f) std::printf("%s\n", label);
    }
  }
}

// Harmonics adds the second 6 dB and the third 10 dB under the fundamental
// at full (half of that in amplitude at half), locked to it, and leaves the
// fundamental where it was.
static void test_harmonics() {
  plain(device);
  device.note_on(1, static_cast<float>(kA1), 0.8f);
  Stereo sine = render(device, 2.0f, kRate);
  const double fundamental = tone_level(sine.left, kA1, kRate, 48000);

  const float settings[2] = {1.0f, 0.5f};
  const double second_db[2] = {-6.02, -12.04}, third_db[2] = {-10.0, -16.02};
  for (int i = 0; i < 2; ++i) {
    plain(device);
    device.set_param(p::kHarmonics, settings[i]);
    device.note_on(1, static_cast<float>(kA1), 0.8f);
    Stereo out = render(device, 3.0f, kRate);
    const double second = harmonic_db(out.left, kA1, 2, 48000), third = harmonic_db(out.left, kA1, 3, 48000);
    const double moved = db(tone_level(out.left, kA1, kRate, 48000) / fundamental);
    std::snprintf(label, sizeof label,
                  "Harmonics %.1f: second at %.2f dB (%.2f), third at %.2f dB (%.2f), fundamental moved %.3f dB",
                  settings[i], second, second_db[i], third, third_db[i], moved);
    std::printf("%s\n", label);
    EXPECT(std::fabs(second - second_db[i]) < 0.3 && std::fabs(third - third_db[i]) < 0.3, label);
    EXPECT(std::fabs(moved) < 0.05, "Harmonics leaves the fundamental's level where it was");
    if (i == 0) {
      double worst = -200.0;
      for (int n = 4; n <= 9; ++n) worst = std::max(worst, harmonic_db(out.left, kA1, n, 48000));
      std::snprintf(label, sizeof label, "Harmonics adds nothing above the third (loudest of 4 to 9: %.1f dB)", worst);
      EXPECT(worst < -70.0, label);
      // Locked: the second and third cross zero going up where the
      // fundamental does. Phases are read against the sample clock, so a
      // harmonic n in step with the fundamental has phase n times its phase,
      // plus a quarter turn per harmonic above the first (tone_phase reads a
      // sine as -90 degrees); and it is the same a second later.
      for (int n = 2; n <= 3; ++n) {
        double lock[2];
        for (int w = 0; w < 2; ++w) {
          const size_t from = 24000 + static_cast<size_t>(w) * 48000;
          const size_t to = from + 48000;  // one second: a whole number of cycles of 55 Hz and of its harmonics
          const double one = tone_phase(out.left, kA1, kRate, from, to);
          const double nth = tone_phase(out.left, n * kA1, kRate, from, to);
          lock[w] = std::remainder(nth - n * one - (n - 1) * 0.5 * kPi, 2.0 * kPi);
        }
        std::snprintf(label, sizeof label,
                      "harmonic %d is locked to the fundamental: %.5f rad from in step, %.5f rad a second later", n,
                      lock[0], lock[1]);
        std::printf("%s\n", label);
        EXPECT(std::fabs(lock[0]) < 0.005 && std::fabs(lock[1]) < 0.005, label);
      }
    }
  }
}

// Shape raises the odd harmonics (third, fifth, seventh: a square wave with
// its corners rounded) and nothing even; the fundamental stays, the level
// stays, and the peak comes down as the wave gets squarer.
static void test_shape() {
  plain(device);
  device.note_on(1, static_cast<float>(kA1), 0.8f);
  Stereo sine = render(device, 2.0f, kRate);
  plain(device);
  device.set_param(p::kShape, 1.0f);
  device.note_on(1, static_cast<float>(kA1), 0.8f);
  Stereo square = render(device, 2.0f, kRate);
  const double third = harmonic_db(square.left, kA1, 3, 48000), fifth = harmonic_db(square.left, kA1, 5, 48000),
               seventh = harmonic_db(square.left, kA1, 7, 48000);
  std::snprintf(label, sizeof label, "Shape 1: third %.2f dB (-11.43), fifth %.2f dB (-20.30), seventh %.2f dB (-33.81)",
                third, fifth, seventh);
  std::printf("%s\n", label);
  EXPECT(std::fabs(third + 11.43) < 0.3 && std::fabs(fifth + 20.30) < 0.3 && std::fabs(seventh + 33.81) < 0.5, label);
  double even = -200.0;
  for (int n = 2; n <= 8; n += 2) even = std::max(even, harmonic_db(square.left, kA1, n, 48000));
  const double ninth = std::max(harmonic_db(square.left, kA1, 9, 48000), harmonic_db(square.left, kA1, 11, 48000));
  std::snprintf(label, sizeof label, "Shape 1: even harmonics stay down (loudest %.1f dB), and so does the ninth on (%.1f dB)",
                even, ninth);
  EXPECT(even < -70.0 && ninth < -70.0, label);
  EXPECT(harmonic_db(sine.left, kA1, 3, 48000) < -70.0, "Shape 0 has no third harmonic");

  const double moved = db(tone_level(square.left, kA1, kRate, 48000) / tone_level(sine.left, kA1, kRate, 48000));
  const double louder = db(rms(square.left, 48000) / rms(sine.left, 48000));
  const double crest_sine = peak(sine.left, 48000) / rms(sine.left, 48000);
  const double crest_square = peak(square.left, 48000) / rms(square.left, 48000);
  std::snprintf(label, sizeof label,
                "Shape 1: fundamental moved %.3f dB, level %.2f dB, peak over rms %.3f (a sine: %.3f)", moved,
                louder, crest_square, crest_sine);
  std::printf("%s\n", label);
  EXPECT(std::fabs(moved) < 0.05 && std::fabs(louder) < 0.5, label);
  EXPECT(crest_square < 1.2 && crest_sine > 1.4, "Shape makes the wave squarer: its peak comes down against its level");

  // Half way it is a rounder wave: the third is there, the fifth and
  // seventh have hardly started.
  plain(device);
  device.set_param(p::kShape, 0.5f);
  device.note_on(1, static_cast<float>(kA1), 0.8f);
  Stereo half = render(device, 2.0f, kRate);
  std::snprintf(label, sizeof label, "Shape 0.5: third %.1f dB (-17.5), fifth %.1f dB (-32.3), seventh %.1f dB (-51.9)",
                harmonic_db(half.left, kA1, 3, 48000), harmonic_db(half.left, kA1, 5, 48000),
                harmonic_db(half.left, kA1, 7, 48000));
  EXPECT(std::fabs(harmonic_db(half.left, kA1, 3, 48000) + 17.45) < 0.5 &&
             std::fabs(harmonic_db(half.left, kA1, 5, 48000) + 32.34) < 0.8 &&
             std::fabs(harmonic_db(half.left, kA1, 7, 48000) + 51.87) < 1.5,
         label);
}

// The pitch a strike has `t` seconds in: Drop semitones up at first, along
// an exponential that reaches a hundredth at Fall and is cut off there.
static double falling(double key, double drop, double fall, double t) {
  if (t >= fall) return key;
  const double left = (std::exp(-4.6051702 * t / fall) - 0.01) / 0.99;
  return key * std::pow(2.0, drop * left / 12.0);
}

// The 4x chain delays the sound by 18.25 samples (2.75 and 15.5).
static const double kLatency = 18.25 / 48000.0;

// The drop: each strike starts Drop semitones above the key, is where the
// curve says half way down, and is exactly on the key from Fall on. A key
// slid to does not drop; a key played apart does, even over a ringing note.
static void test_drop() {
  struct Case {
    double key, drop, fall;
  };
  for (const Case& c : {Case{kA3, 12.0, 0.8}, Case{kA1, 36.0, 0.8}, Case{kA2, 24.0, 0.06}, Case{kA1, 7.0, 0.04}}) {
    plain(device);
    device.set_param(p::kDrop, static_cast<float>(c.drop));
    device.set_param(p::kFall, static_cast<float>(c.fall * 1000.0));
    device.note_on(1, static_cast<float>(c.key), 0.8f);
    Stereo out = render(device, static_cast<float>(c.fall) + 0.5f, kRate);

    // The first whole cycle that can be timed, a millisecond or two in.
    const std::vector<double> at = rising(out.left, 48, out.size());
    const double first = kRate / (at[1] - at[0]);
    const double first_at = 0.5 * (at[0] + at[1]) / kRate - kLatency;
    const double up = cents(first, c.key);
    const double wanted = cents(falling(c.key, c.drop, c.fall, first_at), c.key);
    std::snprintf(label, sizeof label,
                  "Drop %.0f st, Fall %.0f ms: %.1f ms in the pitch is %.0f cents above the key (the curve: %.0f)",
                  c.drop, c.fall * 1000.0, first_at * 1000.0, up, wanted);
    std::printf("%s\n", label);
    EXPECT(std::fabs(up - wanted) < 0.01 * c.drop * 100.0 + 5.0, label);
    if (c.fall > 0.5) {
      // With a long fall those first milliseconds are still at the top.
      EXPECT(up > 0.96 * c.drop * 100.0 && up <= c.drop * 100.0, "the first milliseconds are Drop semitones up");
    }

    // Half way through the fall.
    const std::vector<double> mid = rising(out.left, static_cast<size_t>((0.5 * c.fall + kLatency) * kRate), out.size());
    const double half = kRate / (mid[1] - mid[0]);
    const double half_at = 0.5 * (mid[0] + mid[1]) / kRate - kLatency;
    const double half_wanted = cents(falling(c.key, c.drop, c.fall, half_at), c.key);
    std::snprintf(label, sizeof label, "  %.0f ms in it is %.0f cents above the key (the curve: %.0f)",
                  half_at * 1000.0, cents(half, c.key), half_wanted);
    std::printf("%s\n", label);
    EXPECT(std::fabs(cents(half, c.key) - half_wanted) < 0.01 * c.drop * 100.0 + 5.0, label);

    // On the key from Fall on: the first cycles after it, and the long run.
    const double landed = pitch_at(out.left, c.fall + kLatency + 0.0005, 3);
    const double settled = peak_frequency(out.left, kRate, c.key * 0.99, c.key * 1.01,
                                          static_cast<size_t>((c.fall + 0.05) * kRate), out.size());
    std::snprintf(label, sizeof label, "  after Fall: the next three cycles are %.2f cents from the key, the note %.3f cents",
                  cents(landed, c.key), cents(settled, c.key));
    std::printf("%s\n", label);
    EXPECT(std::fabs(cents(landed, c.key)) < 2.0 && std::fabs(cents(settled, c.key)) < 3.0, label);
  }

  // Landed is on the key itself, not the last step of the fall short of it:
  // from the largest Drop in the shortest Fall that step is 0.7 cents, and a
  // note left there stays that sharp for as long as it is held.
  plain(device);
  device.set_param(p::kDrop, 36.0f);
  device.set_param(p::kFall, 5.0f);
  device.note_on(1, static_cast<float>(kA3), 0.8f);
  Stereo short_fall = render(device, 2.5f, kRate);
  const double rests =
      cents(peak_frequency(short_fall.left, kRate, kA3 * 0.999, kA3 * 1.001, 4800, short_fall.size()), kA3);
  std::snprintf(label, sizeof label, "Drop 36 st, Fall 5 ms: the held note rests %.4f cents from the key (0.05 at most)", rests);
  std::printf("%s\n", label);
  EXPECT(std::fabs(rests) < 0.05, label);

  // Drop 0 starts on the key.
  plain(device);
  device.note_on(1, static_cast<float>(kA2), 0.8f);
  Stereo flat = render(device, 0.2f, kRate);
  EXPECT(std::fabs(cents(pitch_at(flat.left, 0.001, 2), kA2)) < 2.0, "Drop 0: the note starts on the key");

  // A key slid to does not drop again; letting it go slides back without one.
  plain(device);
  device.set_param(p::kDrop, 24.0f);
  device.set_param(p::kFall, 400.0f);
  device.set_param(p::kRelease, 1.0f);
  device.note_on(1, static_cast<float>(kA1), 0.8f);
  render(device, 1.0f, kRate);
  device.note_on(2, static_cast<float>(kA2), 0.8f);
  Stereo slid = render(device, 0.2f, kRate);
  const double after_slide = cents(pitch_at(slid.left, 0.006, 2), kA2);
  device.note_off(2);
  Stereo back = render(device, 0.2f, kRate);
  const double after_back = cents(pitch_at(back.left, 0.006, 2), kA1);
  std::snprintf(label, sizeof label,
                "a key slid to does not drop: 6 ms on it is %.1f cents from the new key; back on the old one %.1f cents",
                after_slide, after_back);
  std::printf("%s\n", label);
  EXPECT(std::fabs(after_slide) < 5.0 && std::fabs(after_back) < 5.0, label);

  // A key played apart drops again, over the tail of the last note too.
  device.note_off(1);
  render(device, 0.1f, kRate);
  device.note_on(3, static_cast<float>(kA1), 0.8f);
  Stereo again = render(device, 0.6f, kRate);
  const std::vector<double> at = rising(again.left, 240, again.size());
  const double restruck = cents(kRate / (at[1] - at[0]), kA1);
  const double restruck_at = 0.5 * (at[0] + at[1]) / kRate - kLatency;
  const double wanted = cents(falling(kA1, 24.0, 0.4, restruck_at), kA1);
  std::snprintf(label, sizeof label,
                "a key played apart over a ringing note drops again: %.1f ms in it is %.0f cents up (the curve: %.0f)",
                restruck_at * 1000.0, restruck, wanted);
  std::printf("%s\n", label);
  EXPECT(std::fabs(restruck - wanted) < 30.0, label);
  EXPECT(std::fabs(cents(pitch_at(again.left, 0.41, 3), kA1)) < 2.0, "and lands on the key after Fall");
}

// Amplitude around `seconds`: the largest sample within one period of it.
static double amplitude_at(const std::vector<float>& x, double seconds, double hz) {
  const size_t from = static_cast<size_t>((seconds + kLatency) * kRate);
  return peak(x, from, from + static_cast<size_t>(kRate / hz) + 1);
}

// Loudness: Attack is the time of the rise, Decay the time to 60 dB down
// while the key is held (the top of Decay holds), Release the time to 60 dB
// down once it is let go; each ends in exact silence.
static void test_loudness() {
  // Attack: an S-shaped rise that is half way at half its time.
  plain(device);
  device.set_param(p::kAttack, 1.0f);
  device.note_on(1, static_cast<float>(kA3), 0.8f);
  Stereo rise = render(device, 2.0f, kRate);
  const double full = amplitude_at(rise.left, 1.5, kA3);
  std::snprintf(label, sizeof label, "Attack 1 s: %.3f of full at 0.1 s, %.3f at 0.5 s, %.3f at 0.9 s, %.4f at 1.01 s",
                amplitude_at(rise.left, 0.1, kA3) / full, amplitude_at(rise.left, 0.5, kA3) / full,
                amplitude_at(rise.left, 0.9, kA3) / full, amplitude_at(rise.left, 1.01, kA3) / full);
  std::printf("%s\n", label);
  EXPECT(amplitude_at(rise.left, 0.1, kA3) < 0.05 * full && std::fabs(amplitude_at(rise.left, 0.5, kA3) / full - 0.5) < 0.03 &&
             amplitude_at(rise.left, 0.9, kA3) > 0.95 * full && amplitude_at(rise.left, 1.01, kA3) > 0.995 * full,
         label);

  // The fastest attack is fast and not instant: on a high key (many peaks
  // per millisecond to read it from) nine tenths are reached between one and
  // two and a half milliseconds in.
  plain(device);
  device.set_param(p::kAttack, 0.001f);
  device.note_on(1, 2093.0f, 0.8f);
  Stereo fast = render(device, 0.1f, kRate);
  const double top = peak(fast.left, 2400);
  size_t reached = 0;
  while (reached < fast.size() && std::fabs(fast.left[reached]) < 0.9 * top) ++reached;
  const double reached_ms = (static_cast<double>(reached) / kRate - kLatency) * 1000.0;
  std::snprintf(label, sizeof label, "Attack at its shortest: nine tenths of the level after %.2f ms (1 to 2.5)", reached_ms);
  std::printf("%s\n", label);
  EXPECT(reached_ms > 1.0 && reached_ms < 2.5, label);

  // Decay.
  for (float decay : {0.05f, 0.5f, 5.0f, 19.0f}) {
    plain(device);
    device.set_param(p::kDecay, decay);
    device.note_on(1, static_cast<float>(kA3), 0.8f);
    Stereo out = render(device, decay * 1.1f + 0.1f, kRate);
    const double measured = rt60(out.left, kRate, 0.01, decay / 25.0, -85.0);
    std::snprintf(label, sizeof label, "Decay %.2f s with the key held: 60 dB down after %.3f s", decay, measured);
    std::printf("%s\n", label);
    EXPECT(std::fabs(measured - decay) < 0.06 * decay, label);
    if (decay < 1.0f) {
      // 120 dB down it is exact silence, with the key still held.
      render(device, decay * 1.2f, kRate);
      Stereo spent = render(device, 0.2f, kRate);
      EXPECT(peak(spent.left) == 0.0, "a note that has decayed is exact silence while its key is held");
    }
  }

  // The top of Decay holds, for as long as the key is down.
  plain(device);
  device.note_on(1, static_cast<float>(kA1), 0.8f);
  Stereo held = render(device, 61.0f, kRate);
  const double start = rms(held.left, 24000, 72000), end = rms(held.left, 60 * 48000 - 24000, 60 * 48000 + 24000);
  std::snprintf(label, sizeof label, "Decay at the top: a held note is %.4f dB from where it started after 60 s",
                db(end / start));
  std::printf("%s\n", label);
  EXPECT(std::fabs(db(end / start)) < 0.01, label);

  // Release.
  for (float release : {0.02f, 0.3f, 8.0f}) {
    plain(device);
    device.set_param(p::kRelease, release);
    device.note_on(1, static_cast<float>(kA3), 0.8f);
    Stereo before = render(device, 0.5f, kRate);
    device.note_off(1);
    Stereo out = render(device, release * 1.1f + 0.1f, kRate);
    const double measured = rt60(out.left, kRate, 0.002, release / 25.0, -85.0);
    std::snprintf(label, sizeof label, "Release %.2f s: 60 dB down %.3f s after the key is let go", release, measured);
    std::printf("%s\n", label);
    EXPECT(std::fabs(measured - release) < 0.06 * release, label);
    EXPECT(rms(out.left, 0, static_cast<size_t>(0.1f * release * kRate)) > 0.5 * rms(before.left, 12000),
           "the release is a fade, not a cut");
    render(device, release * 1.2f, kRate);
    Stereo after = render(device, 0.2f, kRate);
    EXPECT(peak(after.left) == 0.0, "and it ends in exact silence");
  }

  // A key let go during a slow rise fades from where the rise had got to.
  plain(device);
  device.set_param(p::kAttack, 2.0f);
  device.set_param(p::kRelease, 0.5f);
  device.note_on(1, static_cast<float>(kA3), 0.8f);
  Stereo partial = render(device, 1.0f, kRate);
  device.note_off(1);
  Stereo fade = render(device, 1.5f, kRate);
  const double got = amplitude_at(partial.left, 0.99, kA3);
  std::snprintf(label, sizeof label,
                "let go half way up a 2 s rise: the fade starts at %.3f of the level reached and never goes above it",
                amplitude_at(fade.left, 0.0, kA3) / got);
  EXPECT(peak(fade.left) < 1.02 * got && amplitude_at(fade.left, 0.0, kA3) > 0.9 * got &&
             peak(fade.left, 60000) == 0.0,
         label);
}

// Drive changes the tone and not the level: within 2 dB of the clean note
// at every loudness and under every wave, odd harmonics only on a sine,
// more of them the louder the note, and none left in the tail.
static void test_drive() {
  double worst = 0.0;
  for (int tone = 0; tone < 3; ++tone) {
    for (float gain : {0.2f, 0.7f, 1.0f}) {
      double level[3];
      const float drives[3] = {0.0f, 0.5f, 1.0f};
      for (int i = 0; i < 3; ++i) {
        plain(device);
        if (tone == 1) device.set_param(p::kShape, 1.0f);
        if (tone == 2) device.set_param(p::kHarmonics, 1.0f);
        device.set_param(p::kDrive, drives[i]);
        device.note_on(1, static_cast<float>(kA1), gain);
        Stereo out = render(device, 1.5f, kRate);
        level[i] = db(rms(out.left, 24000));
      }
      for (int i = 1; i < 3; ++i) {
        const double moved = level[i] - level[0];
        if (std::fabs(moved) > std::fabs(worst)) worst = moved;
        std::snprintf(label, sizeof label, "Drive %.1f on %s at gain %.1f moves the level by %.2f dB (2 at most)",
                      drives[i], tone == 0 ? "a sine" : (tone == 1 ? "Shape 1" : "Harmonics 1"), gain, moved);
        EXPECT(std::fabs(moved) < 2.0, label);
      }
    }
  }
  std::printf("Drive at 0.5 and 1 against 0, three waves, gains 0.2 to 1: the level moves by %.2f dB at most\n", worst);

  // What it adds to a sine, by loudness.
  double third[3], fifth[3];
  const float gains[3] = {0.2f, 0.7f, 1.0f};
  for (int i = 0; i < 3; ++i) {
    plain(device);
    device.set_param(p::kDrive, 1.0f);
    device.note_on(1, static_cast<float>(kA1), gains[i]);
    Stereo out = render(device, 1.5f, kRate);
    third[i] = harmonic_db(out.left, kA1, 3, 24000);
    fifth[i] = harmonic_db(out.left, kA1, 5, 24000);
    if (i == 1) {
      double even = -200.0;
      for (int n = 2; n <= 8; n += 2) even = std::max(even, harmonic_db(out.left, kA1, n, 24000));
      std::snprintf(label, sizeof label, "a driven sine has odd harmonics only (loudest even one %.1f dB)", even);
      EXPECT(even < -70.0, label);
    }
  }
  std::snprintf(label, sizeof label,
                "full Drive on a sine: third harmonic at %.1f / %.1f / %.1f dB and fifth at %.1f / %.1f / %.1f dB for "
                "gain 0.2 / 0.7 / 1",
                third[0], third[1], third[2], fifth[0], fifth[1], fifth[2]);
  std::printf("%s\n", label);
  EXPECT(third[1] > -20.0 && third[2] > third[1] + 1.0 && third[1] > third[0] + 6.0 && fifth[2] > fifth[0] + 10.0, label);

  plain(device);
  device.set_param(p::kDrive, 0.3f);
  device.note_on(1, static_cast<float>(kA1), 0.7f);
  Stereo mild = render(device, 1.5f, kRate);
  std::snprintf(label, sizeof label, "Drive 0.3 on a sine at gain 0.7: third harmonic at %.1f dB (-40 to -25)",
                harmonic_db(mild.left, kA1, 3, 24000));
  std::printf("%s\n", label);
  EXPECT(harmonic_db(mild.left, kA1, 3, 24000) > -40.0 && harmonic_db(mild.left, kA1, 3, 24000) < -25.0, label);

  // The tail goes clean, and the decay keeps its time.
  plain(device);
  device.set_param(p::kDrive, 1.0f);
  device.set_param(p::kDecay, 2.0f);
  device.note_on(1, static_cast<float>(kA2), 1.0f);
  Stereo dying = render(device, 2.4f, kRate);
  std::vector<float> begin(dying.left.begin() + 480, dying.left.begin() + 5280);  // the first 0.1 s
  const double early = harmonic_db(begin, kA2, 3, 0);
  std::vector<float> late(dying.left.begin() + 62400, dying.left.begin() + 76800);  // 1.3 to 1.6 s: 39 to 48 dB down
  const double late_db = harmonic_db(late, kA2, 3, 0);
  const double measured = rt60(dying.left, kRate, 0.01, 0.08, -85.0);
  std::snprintf(label, sizeof label,
                "a driven note that decays: third harmonic %.1f dB at its start, %.1f dB 40 dB down; 60 dB down after "
                "%.3f s (Decay 2 s)",
                early, late_db, measured);
  std::printf("%s\n", label);
  EXPECT(late_db < early - 30.0 && std::fabs(measured - 2.0) < 0.12, label);
}

// One voice: the newest key plays, letting it go returns to the one under
// it, and the pitch glides between overlapping keys in the Glide time.
static void test_keys() {
  plain(device);
  device.set_param(p::kGlide, 0.4f);
  device.note_on(1, static_cast<float>(kA2), 0.8f);
  Stereo first = render(device, 0.5f, kRate);
  EXPECT(std::fabs(cents(pitch_at(first.left, 0.001, 2), kA2)) < 2.0, "a key struck from silence starts on pitch, Glide or not");

  device.note_on(2, static_cast<float>(kA3), 0.8f);
  Stereo slide = render(device, 1.0f, kRate);
  const double quarter = cents(pitch_at(slide.left, 0.1 + kLatency - 0.0035, 1), kA2);
  const double middle = cents(pitch_at(slide.left, 0.2 + kLatency - 0.003, 1), kA2);
  const double late = cents(pitch_at(slide.left, 0.36 + kLatency - 0.0025, 1), kA2);
  const double arrived = cents(pitch_at(slide.left, 0.4 + kLatency, 3), kA3);
  std::snprintf(label, sizeof label,
                "Glide 0.4 s over an octave: %.0f cents up at 0.1 s, %.0f at 0.2 s, %.0f at 0.36 s; at 0.4 s it is "
                "%.2f cents from the new key",
                quarter, middle, late, arrived);
  std::printf("%s\n", label);
  EXPECT(std::fabs(quarter - 300.0) < 25.0 && std::fabs(middle - 600.0) < 25.0 && std::fabs(late - 1080.0) < 25.0 &&
             std::fabs(arrived) < 2.0,
         label);
  EXPECT(tone_level(slide.left, kA2, kRate, 28800) < 0.001 * tone_level(slide.left, kA3, kRate, 28800),
         "two keys held: only the newer one sounds");
  double lo = 1.0e9, hi = 0.0;
  for (size_t from = 0; from + 960 <= 24000; from += 480) {
    const double value = peak(slide.left, from, from + 960);
    lo = std::min(lo, value);
    hi = std::max(hi, value);
  }
  const double level = peak(first.left, 12000);
  std::snprintf(label, sizeof label, "a key slid to on a held note keeps the level within %.3f..%.3f of it", lo / level,
                hi / level);
  EXPECT(lo > 0.98 * level && hi < 1.02 * level, label);

  // Letting the newer key go returns to the one still held, in the Glide
  // time and without a new strike; letting an older key go changes nothing.
  device.note_off(2);
  Stereo back = render(device, 1.0f, kRate);
  const double back_middle = cents(pitch_at(back.left, 0.2 + kLatency - 0.004, 1), kA2);
  std::snprintf(label, sizeof label, "releasing the newer key glides back: %.0f cents up at 0.2 s, %.2f cents off at 0.4 s",
                back_middle, cents(pitch_at(back.left, 0.4 + kLatency, 3), kA2));
  EXPECT(std::fabs(back_middle - 600.0) < 25.0 && std::fabs(cents(pitch_at(back.left, 0.4 + kLatency, 3), kA2)) < 2.0, label);
  EXPECT(peak(back.left, 28800) > 0.98 * level, "and the older key is still sounding at full level");
  device.note_on(3, static_cast<float>(kA3), 0.8f);
  render(device, 1.0f, kRate);
  device.note_off(1);
  Stereo kept = render(device, 0.5f, kRate);
  EXPECT(std::fabs(cents(pitch_at(kept.left, 0.01, 4), kA3)) < 2.0, "releasing an older key leaves the playing one alone");
  device.note_off(3);
  render(device, 0.2f, kRate);
  Stereo silent = render(device, 0.25f, kRate);
  EXPECT(peak(silent.left) == 0.0, "the last key up ends the note");

  // A slow glide over a small interval keeps its time, on a low key and a
  // high one and at any sample rate: a semitone in 2 s is half way after 1 s.
  // (With the pitch kept in single precision each step of such a glide is
  // about a unit in the last place: it ran a tenth fast at 48 kHz, and at
  // 96 kHz above 256 Hz it stood still and jumped at the end.)
  for (float rate : {48000.0f, 96000.0f}) {
    for (double hz : {kA1, 2.0 * kA3}) {
      plain(device, rate);
      device.set_param(p::kGlide, 2.0f);
      device.note_on(1, static_cast<float>(hz), 0.8f);
      render(device, 0.3f, rate);
      device.note_on(2, static_cast<float>(hz * std::exp2(1.0 / 12.0)), 0.8f);
      Stereo slow = render(device, 2.3f, rate);
      // Four cycles centred on the moment, so their mean pitch is the pitch there.
      auto up_at = [&](double seconds) { return cents(pitch_at(slow.left, seconds - 2.0 / hz, 4, rate), hz); };
      const double quarter_way = up_at(0.5 + kLatency), half_way = up_at(1.0 + kLatency), most = up_at(1.8 + kLatency);
      const double landed = up_at(2.15);
      std::snprintf(label, sizeof label,
                    "a semitone in 2 s from %.0f Hz at %.0f Hz: %.1f cents up at 0.5 s (25), %.1f at 1 s (50), %.1f at 1.8 s "
                    "(90), %.2f after it (100)",
                    hz, rate, quarter_way, half_way, most, landed);
      std::printf("%s\n", label);
      EXPECT(std::fabs(quarter_way - 25.0) < 1.5 && std::fabs(half_way - 50.0) < 1.5 && std::fabs(most - 90.0) < 1.5 &&
                 std::fabs(landed - 100.0) < 0.5,
             label);
      device.note_off(1);
      device.note_off(2);
    }
  }
  plain(device);
  device.set_param(p::kGlide, 0.4f);

  // Keys played apart do not slide, and neither do keys that land together
  // (a chord in a score): nothing has sounded yet to slide from.
  device.note_on(4, static_cast<float>(kA3), 0.8f);
  Stereo apart = render(device, 0.2f, kRate);
  EXPECT(std::fabs(cents(pitch_at(apart.left, 0.001, 3), kA3)) < 2.0, "a key played after the last was released starts on pitch");
  device.note_off(4);
  render(device, 0.5f, kRate);
  device.note_on(5, static_cast<float>(kA2), 0.8f);
  device.note_on(6, static_cast<float>(kA3), 0.8f);
  Stereo chord = render(device, 0.2f, kRate);
  EXPECT(std::fabs(cents(pitch_at(chord.left, 0.001, 3), kA3)) < 2.0,
         "two keys in the same instant: the newer one sounds at once, without a slide");

  // A held key that has died away is still a key to slide from: whether a
  // step of a sequence slides must not depend on how far the last had faded.
  device.note_off(5);
  device.note_off(6);
  render(device, 0.5f, kRate);
  device.set_param(p::kDecay, 0.3f);
  device.note_on(7, static_cast<float>(kA2), 0.8f);
  render(device, 1.0f, kRate);
  Stereo faded = render(device, 0.1f, kRate);
  EXPECT(peak(faded.left) == 0.0, "a held key with a 0.3 s Decay is silent after a second");
  device.note_on(8, static_cast<float>(kA3), 0.8f);
  Stereo sequence = render(device, 0.2f, kRate);
  const double early = cents(pitch_at(sequence.left, 0.03, 1), kA3);
  std::snprintf(label, sizeof label, "a key over a held, faded one still slides: %.0f cents below it 35 ms in", -early);
  EXPECT(early < -1000.0 && early > -1150.0, label);
  EXPECT(peak(sequence.left, 0, 4800) > 0.3 * level, "and it is struck: an overlapping step of a sequence is not silent");

  // Seventeen keys on a stack of sixteen: still one voice, and every key up ends it.
  plain(device);
  for (int n = 0; n < 17; ++n) device.note_on(n, static_cast<float>(kA1 * std::pow(2.0, n / 12.0)), 0.8f);
  Stereo pile = render(device, 0.5f, kRate);
  const double top = kA1 * std::pow(2.0, 16.0 / 12.0);
  EXPECT(std::fabs(cents(pitch_at(pile.left, 0.1, 4), top)) < 2.0 && peak(pile.left) < 1.05 * level,
         "seventeen keys held: the newest plays, at the level of one");
  for (int n = 0; n < 17; ++n) device.note_off(n);
  render(device, 0.3f, kRate);
  Stereo emptied = render(device, 0.1f, kRate);
  EXPECT(peak(emptied.left) == 0.0, "and all of them up is silence");
}

// A patch with everything in it that has a state: drop, glide, drive, added harmonics, a decay.
static void busy(SubBass& d) {
  d.init(kRate);
  d.set_param(p::kShape, 0.4f);
  d.set_param(p::kHarmonics, 0.5f);
  d.set_param(p::kDrop, 19.0f);
  d.set_param(p::kFall, 120.0f);
  d.set_param(p::kAttack, 0.003f);
  d.set_param(p::kDecay, 0.9f);
  d.set_param(p::kRelease, 0.12f);
  d.set_param(p::kDrive, 0.6f);
  d.set_param(p::kGlide, 0.05f);
}

// A strike from silence is the same hit every time, sample for sample:
// whatever was played before it, wherever the knobs were while it slept,
// whatever the block size. A strike while the last note still sounds carries
// the wave on instead.
static void test_strikes() {
  busy(device);
  device.note_on(1, static_cast<float>(kA1), 0.8f);
  Stereo first = render(device, 0.4f, kRate);
  device.note_off(1);
  Stereo gap = render(device, 0.6f, kRate);
  EXPECT(peak(gap.left, 24000) == 0.0, "0.5 s after a 0.12 s release there is exact silence");
  device.note_on(2, static_cast<float>(kA1), 0.8f);
  Stereo second = render(device, 0.4f, kRate);
  EXPECT(first.left == second.left && first.right == second.right, "two strikes from silence are the same samples");
  device.note_off(2);

  // After a history that leaves every moving part somewhere else: other
  // keys, a glide and a fall cut off half way, knobs moved in the silence,
  // and odd block sizes that put the control clock off its beat.
  for (int n = 0; n < 5; ++n) {
    device.note_on(10 + n, static_cast<float>(kA2 * (1.0 + 0.31 * n)), 0.3f + 0.15f * static_cast<float>(n));
    render(device, 0.013f + 0.021f * static_cast<float>(n), kRate, 37);
  }
  for (int n = 0; n < 5; ++n) device.note_off(10 + n);
  device.set_param(p::kShape, 1.0f);
  device.set_param(p::kDrive, 0.0f);
  device.set_param(p::kVolume, 0.0f);
  render(device, 0.31f, kRate, 61);
  device.process(13);
  Stereo rest = render(device, 0.3f, kRate, 61);
  EXPECT(peak(rest.left) == 0.0, "the instrument has come to rest");
  device.set_param(p::kShape, 0.4f);
  device.set_param(p::kDrive, 0.6f);
  device.set_param(p::kVolume, p::kParamDefault[p::kVolume]);
  device.note_on(3, static_cast<float>(kA1), 0.8f);
  Stereo third = render(device, 0.4f, kRate);
  std::snprintf(label, sizeof label,
                "a strike from rest after other notes and knobs moved in the silence differs from the first by %g",
                furthest(first, third));
  EXPECT(first.left == third.left, label);

  // The same for knobs that are still where the silence left them: the
  // note is the one an instrument set that way from the start plays.
  device.note_off(3);
  render(device, 0.5f, kRate);
  device.process(7);
  device.set_param(p::kShape, 0.0f);
  device.set_param(p::kHarmonics, 1.0f);
  device.set_param(p::kDrive, 1.0f);
  device.set_param(p::kVolume, -3.0f);
  device.set_param(p::kDecay, 3.0f);
  device.set_param(p::kAttack, 0.02f);
  device.note_on(4, static_cast<float>(kA1), 0.6f);
  Stereo moved = render(device, 0.4f, kRate);
  busy(other);
  other.set_param(p::kShape, 0.0f);
  other.set_param(p::kHarmonics, 1.0f);
  other.set_param(p::kDrive, 1.0f);
  other.set_param(p::kVolume, -3.0f);
  other.set_param(p::kDecay, 3.0f);
  other.set_param(p::kAttack, 0.02f);
  other.note_on(4, static_cast<float>(kA1), 0.6f);
  Stereo fresh = render(other, 0.4f, kRate);
  std::snprintf(label, sizeof label, "knobs moved while it sleeps are there on the next note: it differs from a fresh one by %g",
                furthest(moved, fresh));
  EXPECT(moved.left == fresh.left, label);

  // Rest is exact. The end of a release is stepped through one sample at a
  // time and a copy of the instrument is struck at each: up to some sample
  // the strike carries the old wave on, and from that sample on it is the
  // strike from silence, bit for bit. That sample comes well before the
  // output itself has gone quiet (the end of the note is still on its way
  // through the decimators, and a strike from rest starts those afresh too).
  busy(device);
  device.note_on(1, static_cast<float>(kA1), 0.8f);
  render(device, 0.2f, kRate);
  device.note_off(1);
  render(device, 0.19f, kRate);
  int first_same = -1, last_other = -1, last_sound = -1;
  for (int n = 0; n < 2400; ++n) {
    device.process(1);
    if (device.out_left()[0] != 0.0f) last_sound = n;
    other = device;
    other.note_on(2, static_cast<float>(kA1), 0.8f);
    Stereo struck = render(other, 0.01f, kRate);
    bool same = true;
    for (size_t i = 0; i < struck.size(); ++i) same = same && struck.left[i] == first.left[i];
    if (same && first_same < 0) first_same = n;
    if (!same) last_other = n;
  }
  std::snprintf(label, sizeof label,
                "the end of a release, sample by sample: a strike is the strike from silence from sample %d on (the last "
                "that was not: %d), and the output goes quiet at sample %d",
                first_same, last_other, last_sound);
  std::printf("%s\n", label);
  EXPECT(first_same > 0 && last_other == first_same - 1 && last_sound >= first_same + 20 && last_sound < 2399, label);

  // The first sample of a strike is the start of the wave: it rises from
  // zero (phase zero), so the first 2 ms are positive.
  plain(device);
  device.note_on(1, static_cast<float>(kA1), 0.8f);
  Stereo start = render(device, 0.01f, kRate);
  bool positive = true;
  for (size_t i = 48; i < 144; ++i) positive = positive && start.left[i] > 0.0f;
  EXPECT(positive && std::fabs(start.left[8]) < 1.0e-6, "a strike from silence starts at the wave's rising zero");

  // Struck while still sounding, the wave carries on: the second strike is
  // not the first one again, and nothing steps (the click checks below).
  busy(device);
  device.note_on(1, static_cast<float>(kA1), 0.8f);
  render(device, 0.137f, kRate);
  device.note_off(1);
  render(device, 0.02f, kRate);
  device.note_on(2, static_cast<float>(kA1), 0.8f);
  Stereo carried = render(device, 0.4f, kRate);
  EXPECT(furthest(first, carried) > 0.01, "a strike over a sounding note carries its wave on");
}

// No clicks: every event is held against the same passage without it.
static void test_clicks() {
  // The yardstick: an event that does jump. A plain low note cut off in one
  // sample would read 0.5 or more; a 55 Hz wave itself moves 0.007 of its
  // height per sample.
  const auto low = [](SubBass& d) {
    plain(d);
    d.set_param(p::kHarmonics, 0.3f);
    d.set_param(p::kDecay, 3.0f);
    d.set_param(p::kRelease, 0.02f);  // the shortest
    d.set_param(p::kDrive, 0.5f);
    d.note_on(1, static_cast<float>(kA1), 0.8f);
  };
  // `turn` is the most the difference's slope may change in one sample, as
  // a share of its size, where the device rounds the corner itself (the lag
  // on the loudness, the line that joins a sounding note to a new pitch); 0
  // where the corner is the 5 ms smoother's own and nothing is claimed.
  struct Event {
    const char* name;
    void (*apply)(SubBass&);
    double turn;
  };
  const Event events[] = {
      {"note off at the shortest release", [](SubBass& d) { d.note_off(1); }, 0.001},
      {"the same key struck again, louder", [](SubBass& d) { d.note_on(1, 55.0f, 1.0f); }, 0.0},
      {"the same key struck again, softer", [](SubBass& d) { d.note_on(1, 55.0f, 0.1f); }, 0.0},
      {"another key over the held one, Glide 0", [](SubBass& d) { d.note_on(2, 82.41f, 0.8f); }, 0.0007},
      {"a key played apart, an octave up",
       [](SubBass& d) {
         d.note_off(1);
         d.note_on(2, 110.0f, 0.4f);
       },
       0.0013},
      {"the same key apart with a 24 st drop",
       [](SubBass& d) {
         d.set_param(p::kDrop, 24.0f);
         d.note_off(1);
         d.note_on(2, 55.0f, 0.8f);
       },
       0.0025},
      {"Volume from -9 to -30 dB", [](SubBass& d) { d.set_param(p::kVolume, -30.0f); }, 0.0},
      {"Drive from 0.5 to 1", [](SubBass& d) { d.set_param(p::kDrive, 1.0f); }, 0.0},
      {"Drive from 0.5 to 0", [](SubBass& d) { d.set_param(p::kDrive, 0.0f); }, 0.0},
      {"Shape from 0 to 1", [](SubBass& d) { d.set_param(p::kShape, 1.0f); }, 0.0},
      {"Harmonics from 0.3 to 1", [](SubBass& d) { d.set_param(p::kHarmonics, 1.0f); }, 0.0},
      {"Harmonics from 0.3 to 0", [](SubBass& d) { d.set_param(p::kHarmonics, 0.0f); }, 0.0},
  };
  for (const Event& event : events) {
    double corner = 0.0;
    const double value = abruptness(low, event.apply, &corner);
    std::snprintf(label, sizeof label,
                  "%s: the change moves %.3f of its size in one sample at most (under 0.1), its slope turns by %.5f",
                  event.name, value, corner);
    std::printf("%s\n", label);
    EXPECT(value > 0.0 && value < 0.1, label);
    if (event.turn > 0.0) {
      std::snprintf(label, sizeof label, "%s: the slope of the change turns by %.5f of its size in one sample (under %.4f)",
                    event.name, corner, event.turn);
      EXPECT(corner < event.turn, label);
    }
  }
  // Slid back to the held key when the newer one is let go.
  const auto two = [](SubBass& d) {
    plain(d);
    d.set_param(p::kHarmonics, 0.3f);
    d.note_on(1, static_cast<float>(kA1), 0.8f);
    d.note_on(2, 82.41f, 0.5f);
  };
  const double back = abruptness(two, [](SubBass& d) { d.note_off(2); });
  std::snprintf(label, sizeof label, "back to the held key: the change moves %.3f of its size in one sample at most", back);
  std::printf("%s\n", label);
  EXPECT(back > 0.0 && back < 0.1, label);

  // The start of a note against silence: at the shortest Attack a low note
  // has no step larger than the held wave makes anyway.
  plain(device);
  device.set_param(p::kAttack, 0.001f);
  device.set_param(p::kHarmonics, 1.0f);
  device.set_param(p::kShape, 1.0f);
  device.set_param(p::kDrive, 1.0f);
  device.note_on(1, static_cast<float>(kA1), 1.0f);
  Stereo onset = render(device, 1.0f, kRate);
  std::snprintf(label, sizeof label, "note on at the shortest Attack, everything up: largest step %.5f against %.5f held",
                max_step(onset.left, 0, 2400), max_step(onset.left, 24000));
  std::printf("%s\n", label);
  EXPECT(max_step(onset.left, 0, 2400) < 1.2 * max_step(onset.left, 24000), label);

  // A dying note struck again at the shortest Attack, from 30 dB down.
  const auto dying = [](SubBass& d) {
    plain(d);
    d.set_param(p::kAttack, 0.001f);
    d.set_param(p::kDecay, 0.6f);
    d.set_param(p::kShape, 0.5f);
    d.note_on(1, static_cast<float>(kA1), 0.8f);
  };
  const double again = abruptness(dying, [](SubBass& d) { d.note_on(2, 55.0f, 0.9f); });
  std::snprintf(label, sizeof label,
                "a dying note struck again at the shortest Attack: the change moves %.3f of its size in one sample at most",
                again);
  std::printf("%s\n", label);
  EXPECT(again > 0.0 && again < 0.1, label);
}

// What does not belong. Fold-back: on C6 (and four keys above it) with shape, drive and
// harmonics full, over the whole band up to half the sample rate, the
// loudest component that is not a harmonic of the note is 60 dB under it.
// DC: none, with no DC blocker in the instrument.
static void test_strays() {
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    for (double hz : {kC6, 2093.005, 3135.963, kC8, 7040.0}) {
      for (float harmonics : {0.0f, 1.0f}) {
        plain(device, rate);
        device.set_param(p::kShape, 1.0f);
        device.set_param(p::kDrive, 1.0f);
        device.set_param(p::kHarmonics, harmonics);
        device.note_on(1, static_cast<float>(hz), 1.0f);
        Stereo out = render(device, 1.0f, rate);
        double at = 0.0;
        const double down = -db(loudest_other(out.left, hz, rate, static_cast<size_t>(rate * 0.25f), 1000, &at));
        std::snprintf(label, sizeof label,
                      "%.0f Hz, Shape and Drive full, Harmonics %.0f, at %.0f Hz: the loudest component off the note's "
                      "harmonics is %.1f dB down, at %.0f Hz (60 at least)",
                      hz, harmonics, rate, down, at);
        if (hz == kC6) std::printf("%s\n", label);
        EXPECT(down > 60.0, label);
      }
    }
  }
  // The harmonics that would lie above the band are not made: on C8 the
  // fifth (20.9 kHz) and the seventh are gone and the fundamental is whole.
  plain(device);
  device.set_param(p::kShape, 1.0f);
  device.note_on(1, static_cast<float>(kC8), 1.0f);
  Stereo top = render(device, 0.5f, kRate);
  plain(device);
  device.note_on(1, static_cast<float>(kC8), 1.0f);
  Stereo top_plain = render(device, 0.5f, kRate);
  std::snprintf(label, sizeof label, "Shape 1 on C8: third %.1f dB, fifth %.1f dB, fundamental moved %.3f dB",
                harmonic_db(top.left, kC8, 3, 12000), harmonic_db(top.left, kC8, 5, 12000),
                db(tone_level(top.left, kC8, kRate, 12000) / tone_level(top_plain.left, kC8, kRate, 12000)));
  EXPECT(harmonic_db(top.left, kC8, 5, 12000) < -80.0 && harmonic_db(top.left, kC8, 3, 12000) > -30.0 &&
             std::fabs(db(tone_level(top.left, kC8, kRate, 12000) / tone_level(top_plain.left, kC8, kRate, 12000))) < 0.1,
         label);

  double worst = 0.0;
  for (double hz : {kE0, kA1, kA3}) {
    for (int setting = 0; setting < 5; ++setting) {
      plain(device);
      if (setting == 1 || setting == 4) device.set_param(p::kHarmonics, 1.0f);
      if (setting == 2 || setting == 4) device.set_param(p::kShape, 1.0f);
      if (setting >= 3) device.set_param(p::kDrive, 1.0f);
      if (setting == 3) device.set_param(p::kHarmonics, 0.4f);
      device.note_on(1, static_cast<float>(hz), 0.9f);
      Stereo out = render(device, 4.0f, kRate);
      const double dc = dc_offset(out.left, 48000, 192000) / rms(out.left, 48000);
      worst = std::max(worst, std::fabs(dc));
      std::snprintf(label, sizeof label, "%.1f Hz, setting %d: DC is %.2e of the note's level", hz, setting, dc);
      EXPECT(std::fabs(dc) < 1.0e-4, label);
    }
  }
  std::printf("DC over 3 s at E0, A1 and A3, five settings: at most %.1e of the note's level (%.0f dB)\n", worst, db(worst));
}

// Level: one note sits where the mixer expects it, velocity is loudness,
// the bottom octave is as loud as the rest, ten keys are still one voice,
// and the output ends in the soft clip.
static void test_level() {
  device.init(kRate);
  device.note_on(1, static_cast<float>(kA1), 0.7f);
  Stereo usual = render(device, 1.0f, kRate);
  std::snprintf(label, sizeof label, "one default note at gain 0.7 peaks at %.1f dBFS (-24 to -10)", db(peak(usual.left)));
  std::printf("%s\n", label);
  EXPECT(db(peak(usual.left)) > -24.0 && db(peak(usual.left)) < -10.0, label);

  double level[3];
  const float gains[3] = {0.0f, 0.5f, 1.0f};
  for (int i = 0; i < 3; ++i) {
    device.init(kRate);
    device.note_on(1, static_cast<float>(kA1), gains[i]);
    Stereo out = render(device, 1.0f, kRate);
    level[i] = db(rms(out.left, 24000));
  }
  std::snprintf(label, sizeof label, "gain 0 / 0.5 / 1 play at %.1f / %.1f / %.1f dB", level[0], level[1], level[2]);
  std::printf("%s\n", label);
  EXPECT(level[2] - level[1] > 3.0 && level[1] - level[0] > 5.0 && level[2] - level[0] < 12.0, label);

  // Nothing thins the bottom: E0 and the C under it are as loud as A2.
  plain(device);
  device.note_on(1, static_cast<float>(kA2), 0.8f);
  Stereo middle = render(device, 4.0f, kRate);
  for (double hz : {16.3516, kE0, kA0}) {
    plain(device);
    device.note_on(1, static_cast<float>(hz), 0.8f);
    Stereo low = render(device, 4.0f, kRate);
    const double moved = db(tone_level(low.left, hz, kRate, 48000) / tone_level(middle.left, kA2, kRate, 48000));
    std::snprintf(label, sizeof label, "a %.1f Hz note is %.3f dB from the level of A2", hz, moved);
    if (hz == kE0) std::printf("%s\n", label);
    EXPECT(std::fabs(moved) < 0.05, label);
  }

  device.init(kRate);
  for (int n = 0; n < 10; ++n) device.note_on(n, 55.0f * std::pow(2.0f, n * 3 / 12.0f), 0.8f);
  Stereo ten = render(device, 3.0f, kRate);
  device.init(kRate);
  device.note_on(1, 55.0f, 0.8f);
  Stereo one = render(device, 3.0f, kRate);
  std::snprintf(label, sizeof label, "ten held keys peak at %.3f, one at %.3f (the knee is at 0.5)", peak(ten.left), peak(one.left));
  EXPECT(peak(ten.left) < 0.5 && peak(ten.left) < 1.5 * peak(one.left), label);

  // The loudest it gets at the default volume, over every corner of Shape,
  // Harmonics and Drive, stays under the knee.
  double loudest = 0.0;
  for (int corner = 0; corner < 8; ++corner) {
    device.init(kRate);
    device.set_param(p::kShape, (corner & 1) ? 1.0f : 0.0f);
    device.set_param(p::kHarmonics, (corner & 2) ? 1.0f : 0.0f);
    device.set_param(p::kDrive, (corner & 4) ? 1.0f : 0.0f);
    device.note_on(1, static_cast<float>(kA1), 1.0f);
    Stereo out = render(device, 1.0f, kRate);
    loudest = std::max(loudest, peak(out.left));
  }
  std::snprintf(label, sizeof label, "the loudest patch peaks at %.3f at the default volume (knee at 0.5)", loudest);
  std::printf("%s\n", label);
  EXPECT(loudest < 0.5, label);

  // Past the knee the soft clip takes over: at full Volume the same wave
  // would reach 2.3 and comes out under 1.
  device.init(kRate);
  device.set_param(p::kHarmonics, 1.0f);
  device.set_param(p::kShape, 1.0f);
  device.set_param(p::kVolume, 6.0f);
  device.note_on(1, static_cast<float>(kA1), 1.0f);
  Stereo hot = render(device, 1.0f, kRate);
  std::snprintf(label, sizeof label, "at full Volume the loudest wave peaks at %.3f (the clip holds it between 0.9 and 1)",
                peak(hot.left));
  EXPECT(peak(hot.left) > 0.9 && peak(hot.left) <= 1.0, label);
}

// Render `frames` in blocks whose sizes cycle through `sizes`.
static Stereo play(SubBass& d, size_t frames, const int* sizes, int count, int* which) {
  Stereo out;
  out.left.resize(frames);
  out.right.resize(frames);
  size_t done = 0;
  while (done < frames) {
    const int block = static_cast<int>(std::min(static_cast<size_t>(sizes[(*which)++ % count]), frames - done));
    d.process(block);
    for (int i = 0; i < block; ++i) {
      out.left[done + i] = d.out_left()[i];
      out.right[done + i] = d.out_right()[i];
    }
    done += block;
  }
  return out;
}

// A phrase with everything that has a state in it, a silence of `gap`
// seconds in the middle and a knob moved inside that silence.
static Stereo phrase(const int* sizes, int count, float gap) {
  int which = 0;
  busy(device);
  device.note_on(1, static_cast<float>(kA1), 0.8f);
  Stereo out = play(device, 7001, sizes, count, &which);
  device.note_on(2, 82.41f, 0.6f);
  out = concat(out, play(device, 5003, sizes, count, &which));
  device.note_off(2);
  out = concat(out, play(device, 3001, sizes, count, &which));
  device.note_off(1);
  const size_t silence = static_cast<size_t>(gap * kRate);
  out = concat(out, play(device, silence - 144, sizes, count, &which));
  device.set_param(p::kShape, 0.9f);
  device.set_param(p::kDrive, 0.2f);
  device.set_param(p::kVolume, -14.0f);
  out = concat(out, play(device, 144, sizes, count, &which));
  device.note_on(3, 73.42f, 0.9f);
  out = concat(out, play(device, 1013, sizes, count, &which));
  device.set_param(p::kAttack, 0.5f);  // times are read on the control clock
  device.set_param(p::kDecay, 0.2f);
  out = concat(out, play(device, 7988, sizes, count, &which));
  device.set_param(p::kHarmonics, 0.0f);
  device.note_on(4, static_cast<float>(kA1), 0.9f);
  out = concat(out, play(device, 9001, sizes, count, &which));
  return out;
}

// Both outputs are one signal, and the audio does not depend on the block
// size: 1, 128 and 2048 frames and a ragged mix, with the silence stepped
// across the moment the instrument falls asleep (0.24 s of release to
// silence, then the 20 ms hold).
static void test_blocks() {
  const int usual[] = {128}, single[] = {1}, large[] = {2048}, ragged[] = {1, 7, 64, 128, 33, 512, 2048, 5};
  double worst = 0.0;
  for (float gap : {0.2f, 0.22f, 0.24f, 0.26f, 0.28f, 0.3f, 0.32f, 0.34f, 0.36f, 1.0f}) {
    Stereo reference = phrase(usual, 1, gap);
    EXPECT(reference.left == reference.right, "left and right are the same signal");
    const double one = furthest(reference, phrase(single, 1, gap));
    const double big = furthest(reference, phrase(large, 1, gap));
    const double mixed = furthest(reference, phrase(ragged, 8, gap));
    worst = std::max(worst, std::max(one, std::max(big, mixed)));
    std::snprintf(label, sizeof label,
                  "a %.2f s silence: blocks of 1, of 2048 and ragged differ from blocks of 128 by %g, %g and %g", gap,
                  one, big, mixed);
    EXPECT(one < 1.0e-6 && big < 1.0e-6 && mixed < 1.0e-6, label);
  }
  std::printf("block sizes 1, 2048 and ragged against 128, ten silences: the renders differ by %g at most\n", worst);
}

static void load(SubBass& d, const Preset& preset) {
  d.init(kRate);
  for (const auto& value : preset.values) d.set_param(value.first, value.second);
}

// Eight seconds of a bass line between A1 and A2, gains 0.6 to 1: short and
// long notes, one repeated key, two keys that overlap, a second of nothing
// before the last two.
struct LineNote {
  double at, hz, gain, length;
};
static const LineNote kLine[] = {
    {0.0, 55.0, 0.8, 0.4},  {0.5, 55.0, 0.6, 0.2},  {1.0, 65.41, 0.9, 0.4}, {1.5, 82.41, 0.7, 0.4},
    {2.0, 110.0, 1.0, 0.8}, {3.0, 98.0, 0.6, 0.4},  {3.5, 82.41, 0.8, 0.6}, {4.0, 73.42, 0.7, 0.4},
    {4.5, 55.0, 1.0, 1.0},  {6.0, 82.41, 0.6, 0.3}, {6.5, 110.0, 0.9, 0.5},
};

static std::vector<float> bass_line(SubBass& d) {
  struct Event {
    size_t at;
    int id;
    bool on;
    double hz, gain;
  };
  std::vector<Event> events;
  int id = 1;
  for (const LineNote& note : kLine) {
    events.push_back({static_cast<size_t>(note.at * kRate + 0.5), id, true, note.hz, note.gain});
    events.push_back({static_cast<size_t>((note.at + note.length) * kRate + 0.5), id, false, 0.0, 0.0});
    ++id;
  }
  std::sort(events.begin(), events.end(), [](const Event& a, const Event& b) { return a.at < b.at; });
  const size_t total = static_cast<size_t>(8.0f * kRate);
  std::vector<float> out;
  size_t next = 0;
  while (out.size() < total) {
    while (next < events.size() && events[next].at <= out.size()) {
      const Event& event = events[next++];
      if (event.on) {
        d.note_on(event.id, static_cast<float>(event.hz), static_cast<float>(event.gain));
      } else {
        d.note_off(event.id);
      }
    }
    const size_t until = next < events.size() ? std::min(events[next].at, total) : total;
    const Stereo part = render(d, static_cast<float>(until - out.size()) / kRate, kRate);
    out.insert(out.end(), part.left.begin(), part.left.end());
  }
  return out;
}

// The loudest 400 ms of a render, as an rms level in dBFS.
static double loudest_400ms(const std::vector<float>& x) {
  const size_t window = static_cast<size_t>(0.4f * kRate);
  double best = 0.0;
  for (size_t from = 0; from + window <= x.size(); from += 2400) best = std::max(best, rms(x, from, from + window));
  return db(best);
}

// A picture of a render as sound: the level in each third of an octave from
// 20 Hz to 10 kHz, every 43 ms, in dB under the render's loudest cell and
// floored 60 dB under it. Two renders are held against each other by the
// mean difference over the cells either of them fills.
static const int kPictureBands = 28;
static std::vector<double> picture(const std::vector<float>& x) {
  std::vector<double> cells;
  for (size_t from = 0; from + 4096 <= x.size(); from += 2048) {
    const std::vector<double> magnitude = spectrum(x, from, 4096);
    std::vector<double> band(kPictureBands, 0.0);
    for (size_t k = 1; k < magnitude.size(); ++k) {
      const double hz = static_cast<double>(k) * kRate / 4096.0;
      const int b = std::max(0, static_cast<int>(std::floor(3.0 * std::log2(hz / 20.0) + 0.5)));
      if (b < kPictureBands) band[b] += magnitude[k] * magnitude[k];
    }
    cells.insert(cells.end(), band.begin(), band.end());
  }
  double top = 0.0;
  for (double cell : cells) top = std::max(top, cell);
  for (double& cell : cells) cell = std::max(-60.0, 10.0 * std::log10(std::max(cell / std::max(top, 1.0e-30), 1.0e-30)));
  return cells;
}

static double picture_distance(const std::vector<double>& a, const std::vector<double>& b) {
  double sum = 0.0;
  size_t count = 0;
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) {
    if (a[i] <= -60.0 && b[i] <= -60.0) continue;
    sum += std::fabs(a[i] - b[i]);
    ++count;
  }
  return count > 0 ? sum / static_cast<double>(count) : 0.0;
}

// Median of a list, and how far under and over it the list reaches.
static double middle(std::vector<double> values) {
  std::sort(values.begin(), values.end());
  return 0.5 * (values[(values.size() - 1) / 2] + values[values.size() / 2]);
}

// The manifest's presets: sixteen, the default patch first, each sounding at
// a sane level, no two rendering or sounding alike, none jumping in level
// against the others, and at least five of them slow, long or dark by
// measurement.
static void test_presets() {
  const std::vector<Preset> presets = load_presets();
  std::snprintf(label, sizeof label, "the manifest has sixteen presets (found %zu)", presets.size());
  EXPECT(presets.size() == 16, label);
  if (presets.empty()) return;
  bool is_default = presets[0].values.size() == static_cast<size_t>(p::kNumParams - 1);
  for (const auto& value : presets[0].values) {
    is_default = is_default && value.first >= 0 && value.first < p::kNumParams &&
                 value.second == p::kParamDefault[value.first];
  }
  EXPECT(is_default, "the first preset is the default patch");

  std::vector<std::vector<float>> renders;
  std::vector<double> loudest;       // the peak of an A1 at gain 0.7 held one second, per preset
  std::vector<double> loudest_held;  // its loudest 400 ms
  std::vector<double> loudest_line;  // the loudest 400 ms of the bass line
  std::vector<double> peak_line;
  std::vector<std::vector<double>> pictures;
  int gentle = 0;
  for (const Preset& preset : presets) {
    const char last = preset.name.empty() ? '0' : preset.name.back();
    std::snprintf(label, sizeof label,
                  "preset \"%s\": a name of 20 characters at most with no space at either end that does not end in a digit",
                  preset.name.c_str());
    EXPECT(!preset.name.empty() && preset.name.size() <= 20 && !(last >= '0' && last <= '9') && last != ' ' &&
               preset.name.front() != ' ',
           label);
    int same_name = 0;
    for (const Preset& twin : presets) {
      bool same = twin.name.size() == preset.name.size();
      for (size_t i = 0; same && i < twin.name.size(); ++i) {
        same = std::tolower(static_cast<unsigned char>(twin.name[i])) == std::tolower(static_cast<unsigned char>(preset.name[i]));
      }
      if (same) ++same_name;
    }
    std::snprintf(label, sizeof label, "preset \"%s\": no other preset has its name, whatever the case", preset.name.c_str());
    EXPECT(same_name == 1, label);
    bool known = true;
    for (const auto& value : preset.values) known = known && value.first >= 0 && value.first < p::kNumParams;
    std::snprintf(label, sizeof label, "preset \"%s\" names parameters the device has", preset.name.c_str());
    EXPECT(known, label);
    if (!known) continue;

    // One A1 at gain 0.7, held 3.5 s (longer than the longest Attack) and
    // let go: its level, how slowly it comes up, how much of its first
    // 0.7 s lies above 150 Hz (the third harmonic and up, or a pitch still
    // falling), and how long it rings once let go.
    load(device, preset);
    device.note_on(1, static_cast<float>(kA1), 0.7f);
    Stereo held = render(device, 3.5f, kRate);
    device.note_off(1);
    Stereo tail = render(device, 9.0f, kRate);
    const double top = peak(held.left);
    size_t half = 0;
    while (half < held.size() && std::fabs(held.left[half]) < 0.5 * top) ++half;
    const double rise_ms = 1000.0 * static_cast<double>(half) / kRate;
    const std::vector<double> magnitude = spectrum(held.left, 0, 32768);
    double above = 0.0, all = 0.0;
    for (size_t i = 0; i < magnitude.size(); ++i) {
      all += magnitude[i] * magnitude[i];
      if (static_cast<double>(i) * kRate / 32768.0 > 150.0) above += magnitude[i] * magnitude[i];
    }
    const double bright = 10.0 * std::log10(std::max(above / all, 1.0e-20));
    const double at_release = rms(held.left, held.size() - 2400, held.size());
    size_t rings = 0;
    for (size_t i = 0; i + 2400 <= tail.size(); i += 2400) {
      if (at_release > 0.0 && rms(tail.left, i, i + 2400) > 0.001 * at_release) rings = i + 2400;
    }
    const double ring_s = static_cast<double>(rings) / kRate;
    const bool slow = rise_ms >= 50.0, lasting = ring_s >= 2.0, dark = bright < -20.0;
    if (slow || lasting || dark) ++gentle;
    std::printf("preset \"%s\": peak %.1f dBFS, half level after %.1f ms, %.1f dB of it above 150 Hz, rings %.2f s%s%s%s\n",
                preset.name.c_str(), db(top), rise_ms, bright, ring_s, slow ? " [slow]" : "", lasting ? " [long]" : "",
                dark ? " [dark]" : "");
    std::snprintf(label, sizeof label, "preset \"%s\" at gain 0.7 peaks at %.1f dBFS (-24 to -10)", preset.name.c_str(), db(top));
    EXPECT(db(top) > -24.0 && db(top) < -10.0, label);

    // The same note held for one second only, as someone stepping through
    // the presets plays it: its loudest moment, tail included.
    load(device, preset);
    device.note_on(1, static_cast<float>(kA1), 0.7f);
    Stereo brief = render(device, 1.0f, kRate);
    device.note_off(1);
    brief = concat(brief, render(device, 2.0f, kRate));
    loudest.push_back(db(peak(brief.left)));
    loudest_held.push_back(loudest_400ms(brief.left));

    // The bass line, as a test of every preset alone renders it: it is
    // heard, it stays under -3 dBFS, and it carries no DC.
    load(device, preset);
    const std::vector<float> line = bass_line(device);
    loudest_line.push_back(loudest_400ms(line));
    peak_line.push_back(db(peak(line)));
    pictures.push_back(picture(line));
    const double line_dc = dc_offset(line, 0, line.size());
    std::snprintf(label, sizeof label,
                  "preset \"%s\" on the bass line: loudest 400 ms %.1f dBFS (over -50), peak %.1f dBFS (-3 at most), DC %.1e "
                  "(under 0.01)",
                  preset.name.c_str(), loudest_line.back(), peak_line.back(), line_dc);
    EXPECT(finite(line) && loudest_line.back() > -50.0 && peak_line.back() <= -3.0 && std::fabs(line_dc) < 0.01, label);

    // A phrase that uses everything: a key, a second over it (glide), both
    // let go, and a loud key played apart.
    load(device, preset);
    device.note_on(1, static_cast<float>(kA1), 0.7f);
    Stereo out = render(device, 0.6f, kRate);
    device.note_on(2, 82.41f, 0.7f);
    out = concat(out, render(device, 0.5f, kRate));
    device.note_off(1);
    out = concat(out, render(device, 0.2f, kRate));
    device.note_off(2);
    out = concat(out, render(device, 0.7f, kRate));
    device.note_on(3, static_cast<float>(kA1), 1.0f);
    out = concat(out, render(device, 0.6f, kRate));
    device.note_off(3);
    out = concat(out, render(device, 1.4f, kRate));
    std::snprintf(label, sizeof label, "preset \"%s\" sounds and stays under the clip knee (peak %.3f)", preset.name.c_str(),
                  peak(out.left));
    EXPECT(finite(out.left) && rms(out.left) > 1.0e-3 && peak(out.left) < 0.5, label);
    renders.push_back(out.left);
  }
  std::snprintf(label, sizeof label, "%d of the presets are slow, long or dark (five at least)", gentle);
  std::printf("%s\n", label);
  EXPECT(gentle >= 5, label);

  // Stepping through the presets does not jump in level: on that one-second
  // note every preset's loudest moment is within 6 dB of the middle one's.
  if (loudest.size() == presets.size()) {
    std::vector<double> sorted = loudest;
    std::sort(sorted.begin(), sorted.end());
    const double median = 0.5 * (sorted[(sorted.size() - 1) / 2] + sorted[sorted.size() / 2]);
    std::printf("an A1 at gain 0.7 held 1 s: the presets' loudest moments run from %.1f to %.1f dBFS, the middle one %.1f "
                "(%.1f dB under it to %.1f dB over)\n",
                sorted.front(), sorted.back(), median, median - sorted.front(), sorted.back() - median);
    for (size_t i = 0; i < loudest.size(); ++i) {
      std::snprintf(label, sizeof label, "preset \"%s\" held 1 s peaks %.1f dB from the middle preset (6 at most)",
                    presets[i].name.c_str(), loudest[i] - median);
      EXPECT(std::fabs(loudest[i] - median) < 6.0, label);
    }
  }

  // The same on the loudest 400 ms, of that note and of the bass line.
  if (loudest_line.size() == presets.size()) {
    const struct {
      const char* what;
      const std::vector<double>* levels;
    } spreads[] = {{"an A1 at gain 0.7 held 1 s", &loudest_held}, {"the bass line", &loudest_line}};
    for (const auto& spread : spreads) {
      const std::vector<double>& levels = *spread.levels;
      const double median = middle(levels);
      size_t low = 0, high = 0;
      for (size_t i = 0; i < levels.size(); ++i) {
        if (levels[i] < levels[low]) low = i;
        if (levels[i] > levels[high]) high = i;
        std::snprintf(label, sizeof label, "preset \"%s\", %s: its loudest 400 ms is %.1f dB from the middle preset's (6 at most)",
                      presets[i].name.c_str(), spread.what, levels[i] - median);
        EXPECT(std::fabs(levels[i] - median) < 6.0, label);
      }
      std::printf("%s: the presets' loudest 400 ms run from %.1f dBFS (\"%s\") to %.1f (\"%s\"), the middle one %.1f "
                  "(%.1f dB under it to %.1f over)\n",
                  spread.what, levels[low], presets[low].name.c_str(), levels[high], presets[high].name.c_str(), median,
                  median - levels[low], levels[high] - median);
    }
    const double top = *std::max_element(peak_line.begin(), peak_line.end());
    std::printf("the bass line peaks at %.1f dBFS at most over the presets\n", top);

    // No two sound alike: the pictures of the bass line, pair by pair.
    struct Pair {
      double apart;
      size_t a, b;
    };
    std::vector<Pair> pairs;
    for (size_t a = 0; a < pictures.size(); ++a) {
      for (size_t b = a + 1; b < pictures.size(); ++b) pairs.push_back({picture_distance(pictures[a], pictures[b]), a, b});
    }
    std::sort(pairs.begin(), pairs.end(), [](const Pair& x, const Pair& y) { return x.apart < y.apart; });
    for (size_t i = 0; i < 4 && i < pairs.size(); ++i) {
      std::snprintf(label, sizeof label, "%s presets in sound on the bass line: \"%s\" and \"%s\", %.1f dB apart on average (4 at least)",
                    i == 0 ? "the closest" : "the next closest", presets[pairs[i].a].name.c_str(),
                    presets[pairs[i].b].name.c_str(), pairs[i].apart);
      std::printf("%s\n", label);
      EXPECT(pairs[i].apart > 4.0, label);
    }
  }

  // No two alike: each phrase is brought to the same level and the pair's
  // difference is held against it (0 for the same render, 1.4 for unrelated ones).
  double closest = 1.0e9;
  size_t closest_a = 0, closest_b = 0;
  for (size_t a = 0; a < renders.size(); ++a) {
    for (size_t b = a + 1; b < renders.size(); ++b) {
      const double level_a = rms(renders[a]), level_b = rms(renders[b]);
      double sum = 0.0;
      for (size_t i = 0; i < renders[a].size(); ++i) {
        const double d = renders[a][i] / level_a - renders[b][i] / level_b;
        sum += d * d;
      }
      const double distance = std::sqrt(sum / static_cast<double>(renders[a].size()));
      if (distance < closest) {
        closest = distance;
        closest_a = a;
        closest_b = b;
      }
    }
  }
  if (renders.size() == presets.size() && renders.size() > 1) {
    std::snprintf(label, sizeof label, "the two presets closest to each other, \"%s\" and \"%s\", differ by %.2f of their level",
                  presets[closest_a].name.c_str(), presets[closest_b].name.c_str(), closest);
    std::printf("%s\n", label);
    EXPECT(closest > 0.2, label);
  }
}

int main() {
  Conformance spec;
  spec.name = "sub-bass";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 2.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);

  test_pitch();
  test_pure();
  test_harmonics();
  test_shape();
  test_drop();
  test_loudness();
  test_drive();
  test_keys();
  test_strikes();
  test_clicks();
  test_strays();
  test_level();
  test_blocks();
  test_presets();

  // Cost of the one voice: the default patch held (it sleeps once let go),
  // and the most it does, a new key every 100 ms with everything up, so the
  // pitch is always falling or gliding.
  device.init(kRate);
  device.note_on(1, static_cast<float>(kA1), 0.8f);
  report_cost("sub-bass (default patch, held)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });
  device.init(kRate);
  everything(device);
  device.set_param(p::kDrop, 36.0f);
  device.set_param(p::kFall, 800.0f);
  device.set_param(p::kGlide, 2.0f);
  report_cost("sub-bass (everything up, a key every 100 ms)", 10.0f, kRate, [&] {
    for (int n = 0; n < 100; ++n) {
      device.note_on(n, static_cast<float>(kA1 * (1.0 + 0.1 * (n % 7))), 0.8f);
      render(device, 0.1f, kRate);
      if (n % 2 == 1) {
        device.note_off(n);
        device.note_off(n - 1);
      }
    }
  });

  return finish("sub-bass");
}
