// Native harness for Ember (cpp/devices/ember), the Tatami poly synth. The
// conformance pass covers silence before and after notes, a pile of keys,
// parameter abuse and other sample rates. The rest measures what the port
// has to keep: pitch, waveforms, sync, the filter, both envelopes, the LFO
// routings, unison, glide, the voice modes, stealing, aliasing, and the
// thresholds of the original Tatami tests where they still apply.
//
// Build with -DEMBER_TEST_VERBOSE to print every measured value.

#include "../devices/ember/ember.h"

#include <complex>
#include <cstdlib>
#include <string>
#include <utility>

#include "support/test_kit.h"

using namespace testkit;
using livemix::Ember;
namespace p = livemix::ember;

static Ember device;

static const float kRate = 48000.0f;

#ifdef EMBER_TEST_VERBOSE
#include <ctime>
#define SHOW(...) std::printf(__VA_ARGS__)
#define TIME(what) \
  std::printf("[%s: %.1f s so far]\n", what, static_cast<double>(std::clock()) / CLOCKS_PER_SEC)
#else
#define SHOW(...) \
  do {            \
  } while (0)
#define TIME(what) \
  do {             \
  } while (0)
#endif

// One clean oscillator: no velocity scaling, a fast attack, Volume at 0 dB
// and the filter wide open on its 12 dB slope, so nothing but the oscillator
// shapes the measurement.
static void clean(int shape) {
  device.init(kRate);
  device.set_param(p::kOsc1Shape, static_cast<float>(shape));
  device.set_param(p::kVelToAmp, 0.0f);
  device.set_param(p::kAmpAttack, 0.001f);
  device.set_param(p::kFilterSlope, 0.0f);
  device.set_param(p::kVolume, 0.0f);
}

static size_t at(double seconds) { return static_cast<size_t>(seconds * kRate + 0.5); }

// Peak per window of `window` samples.
static std::vector<float> envelope(const std::vector<float>& x, int window) {
  std::vector<float> env;
  for (size_t from = 0; from + window <= x.size(); from += window) {
    env.push_back(static_cast<float>(peak(x, from, from + window)));
  }
  return env;
}

// Frequency of every cycle between rising zero crossings.
struct Track {
  std::vector<double> time, hz;
};
static Track track(const std::vector<float>& x, size_t from, size_t to) {
  Track out;
  double last = -1.0;
  for (size_t i = from + 1; i < to && i < x.size(); ++i) {
    if (x[i - 1] < 0.0f && x[i] >= 0.0f) {
      const double cross = static_cast<double>(i - 1) + (-x[i - 1]) / (static_cast<double>(x[i]) - x[i - 1]);
      if (last >= 0.0) {
        out.time.push_back(0.5 * (cross + last) / kRate);
        out.hz.push_back(kRate / (cross - last));
      }
      last = cross;
    }
  }
  return out;
}

// Frequency of a steady periodic signal: the whole cycles between the first
// and the last rising zero crossing in [from, to). Exact to a fraction of a
// sample over the whole span, and far cheaper than scanning with Goertzel.
static double cycle_frequency(const std::vector<float>& x, size_t from, size_t to, double rate = kRate) {
  double first = -1.0, last = -1.0;
  int cycles = -1;
  for (size_t i = from + 1; i < to && i < x.size(); ++i) {
    if (x[i - 1] < 0.0f && x[i] >= 0.0f) {
      last = static_cast<double>(i - 1) + (-x[i - 1]) / (static_cast<double>(x[i]) - x[i - 1]);
      if (first < 0.0) first = last;
      ++cycles;
    }
  }
  return cycles > 0 ? rate * cycles / (last - first) : 0.0;
}

// How often a slow series swings through its middle, in Hz.
static double swing_rate(const std::vector<double>& time, const std::vector<double>& value) {
  double lo = 1.0e30, hi = -1.0e30;
  for (double v : value) {
    lo = std::min(lo, v);
    hi = std::max(hi, v);
  }
  const double mid = 0.5 * (lo + hi);
  double first = -1.0, last = -1.0;
  int crossings = 0;
  for (size_t i = 1; i < value.size(); ++i) {
    if (value[i - 1] < mid && value[i] >= mid) {
      if (first < 0.0) first = time[i];
      last = time[i];
      ++crossings;
    }
  }
  return crossings > 1 ? (crossings - 1) / (last - first) : 0.0;
}
static double swing_rate(const std::vector<float>& series, double rate, size_t from = 0) {
  std::vector<double> time, value;
  for (size_t i = from; i < series.size(); ++i) {
    time.push_back(static_cast<double>(i) / rate);
    value.push_back(series[i]);
  }
  return swing_rate(time, value);
}

// Hann-windowed magnitude spectrum in dBFS (a full-scale sine reads 0 dB).
static std::vector<double> spectrum_db(const std::vector<float>& x, size_t from, int order) {
  const size_t n = static_cast<size_t>(1) << order;
  std::vector<std::complex<double>> a(n);
  for (size_t i = 0; i < n; ++i) {
    a[i] = (0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n))) * x[from + i];
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
  std::vector<double> out(n / 2);
  for (size_t i = 0; i < n / 2; ++i) out[i] = db(std::abs(a[i]) * 4.0 / static_cast<double>(n));
  return out;
}

// Strongest component above `from_hz` that is not a harmonic of f0, in dBFS.
static double worst_alias_db(const std::vector<float>& x, double f0, double from_hz, double to_hz) {
  const int order = 15;
  const std::vector<double> spectrum = spectrum_db(x, at(0.5), order);
  const double bin_hz = kRate / static_cast<double>(1 << order);
  double worst = -300.0;
  for (size_t bin = static_cast<size_t>(from_hz / bin_hz); bin < static_cast<size_t>(to_hz / bin_hz); ++bin) {
    const double hz = static_cast<double>(bin) * bin_hz;
    if (std::fabs(hz - std::round(hz / f0) * f0) < 30.0) continue;
    worst = std::max(worst, spectrum[bin]);
  }
  return worst;
}

// One stage of the voice filter as the trapezoidal SVF realises it at the 2x
// rate: `type` 0 low-pass, 1 high-pass, 2 band-pass; k = 2 - 1.9 * resonance.
static double svf_gain(double hz, double cutoff, double resonance, int type, int stages) {
  const double rate2 = 2.0 * kRate;
  const double x = std::tan(kPi * hz / rate2) / std::tan(kPi * cutoff / rate2);
  const double k = 2.0 - 1.9 * resonance;
  const double denominator = std::sqrt((1.0 - x * x) * (1.0 - x * x) + k * k * x * x);
  const double numerator = type == 0 ? 1.0 : (type == 1 ? x * x : k * x);
  return std::pow(numerator / denominator, stages);
}

// --- the manifest's presets -------------------------------------------------------------------

struct Preset {
  std::string name;
  std::vector<std::pair<int, float>> values;
  float get(int id) const {
    for (const auto& value : values) {
      if (value.first == id) return value.second;
    }
    return p::kParamDefault[id];
  }
};

// A reader for exactly what device.json holds: the parameter keys in order,
// then "presets": { "Name": { "key": number, ... }, ... }.
static std::vector<Preset> load_presets(std::vector<std::string>* keys) {
  std::vector<Preset> presets;
  std::string text;
  if (std::FILE* file = std::fopen("cpp/devices/ember/device.json", "rb")) {
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
    keys->push_back(quoted(pos + 5, &end));
  }
  size_t pos = text.find('{', presets_at) + 1;
  while (true) {
    const size_t name_at = text.find('"', pos);
    const size_t close_at = text.find('}', pos);
    if (name_at == std::string::npos || name_at > origin_at || close_at < name_at) break;
    Preset preset;
    size_t end;
    preset.name = quoted(name_at, &end);
    const size_t body = text.find('{', end);
    const size_t body_end = text.find('}', body);
    pos = body + 1;
    while (true) {
      const size_t key_at = text.find('"', pos);
      if (key_at == std::string::npos || key_at > body_end) break;
      const std::string key = quoted(key_at, &end);
      const size_t colon = text.find(':', end);
      const float value = std::strtof(text.c_str() + colon + 1, nullptr);
      int id = -1;
      for (size_t k = 0; k < keys->size(); ++k) {
        if ((*keys)[k] == key) id = static_cast<int>(k);
      }
      preset.values.push_back({id, value});
      pos = text.find_first_of(",}", colon);
    }
    presets.push_back(preset);
    pos = body_end + 1;
  }
  return presets;
}

static void load(const Preset& preset) {
  device.init(kRate);
  for (const auto& value : preset.values) device.set_param(value.first, value.second);
}

// --- checks -----------------------------------------------------------------------------------

static void check_oscillators();
static void check_filter();
static void check_envelopes();
static void check_lfos();
static void check_unison_and_glide();
static void check_voices();
static void check_quality();
static void check_presets();

int main() {
  Conformance spec;
  spec.name = "ember";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  // The default release is 0.2 s to -60 dB; the voice is freed at -100 dB.
  spec.tail_seconds = 1.0f;
  spec.max_peak = 1.01f;
  check_instrument(device, spec, kRate);
  TIME("conformance");

  check_oscillators();
  TIME("oscillators");
  check_filter();
  TIME("filter");
  check_envelopes();
  TIME("envelopes");
  check_lfos();
  TIME("lfos");
  check_unison_and_glide();
  TIME("unison and glide");
  check_voices();
  TIME("voices");
  check_quality();
  TIME("quality");
  check_presets();
  TIME("presets");

  // Cost: the budget case (8 notes of the default patch), then the first
  // preset as a six-note pad, then the worst case the engine allows.
  device.init(kRate);
  for (int n = 0; n < 8; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 3 / 12.0f), 0.7f);
  render(device, 1.0f, kRate);
  report_cost("ember (8 notes, default patch)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });
  {
    std::vector<std::string> keys;
    const std::vector<Preset> presets = load_presets(&keys);
    if (!presets.empty()) {
      load(presets[0]);
      for (int n = 0; n < 6; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 4 / 12.0f), 0.7f);
      render(device, 1.0f, kRate);
      report_cost("ember (6 notes, first preset)", 10.0f, kRate, [&] { render(device, 10.0f, kRate); });
    }
  }
  device.init(kRate);
  device.set_param(p::kUnisonVoices, 8.0f);
  device.set_param(p::kOscMix, 0.5f);
  for (int n = 0; n < 16; ++n) device.note_on(n, 110.0f * std::pow(2.0f, n * 2 / 12.0f), 0.7f);
  render(device, 1.0f, kRate);
  report_cost("ember (16 notes x 8 unison, both oscillators)", 4.0f, kRate,
              [&] { render(device, 4.0f, kRate); });

  return finish("ember");
}

// Pitch, the four waveforms, oscillator 2, hard sync, sub and noise.
static void check_oscillators() {
  // The pitch is the frequency the host asked for, across the keyboard.
  {
    double worst_cents = 0.0;
    for (float hz : {27.5f, 110.0f, 440.0f, 1760.0f, 7040.0f}) {
      clean(3);
      device.note_on(1, hz, 1.0f);
      Stereo out = render(device, 2.5f, kRate);
      const double got = cycle_frequency(out.left, at(0.5), out.size());
      const double cents = 1200.0 * std::log2(got / hz);
      SHOW("pitch %.2f Hz -> %.4f Hz (%+.3f ct)\n", hz, got, cents);
      worst_cents = std::max(worst_cents, std::fabs(cents));
      if (hz == 440.0f) EXPECT_NEAR(got, 440.0, 0.1, "A4 sounds at 440 Hz within 0.1 Hz (Tatami)");
    }
    EXPECT(worst_cents < 0.5, "every note from A0 to A8 is within half a cent");
  }

  // Each waveform has the spectrum of its name.
  {
    double h[4][7] = {};
    for (int shape = 0; shape < 4; ++shape) {
      clean(shape);
      device.note_on(1, 220.0f, 1.0f);
      Stereo out = render(device, 2.0f, kRate);
      for (int k = 1; k <= 6; ++k) h[shape][k] = tone_level(out.left, 220.0 * k, kRate, at(0.5));
      SHOW("shape %d: h1 %.4f h2/h1 %.4f h3/h1 %.4f h4/h1 %.4f h5/h1 %.4f\n", shape, h[shape][1],
           h[shape][2] / h[shape][1], h[shape][3] / h[shape][1], h[shape][4] / h[shape][1],
           h[shape][5] / h[shape][1]);
    }
    EXPECT_NEAR(h[0][2] / h[0][1], 1.0 / 2.0, 0.01, "saw: the second harmonic is half the first");
    EXPECT_NEAR(h[0][3] / h[0][1], 1.0 / 3.0, 0.01, "saw: the third harmonic is a third");
    EXPECT_NEAR(h[0][5] / h[0][1], 1.0 / 5.0, 0.01, "saw: the fifth harmonic is a fifth");
    EXPECT(h[1][2] < 0.002 * h[1][1] && h[1][4] < 0.002 * h[1][1], "square: no even harmonics");
    EXPECT_NEAR(h[1][3] / h[1][1], 1.0 / 3.0, 0.01, "square: odd harmonics fall as 1/n");
    EXPECT(h[2][2] < 0.002 * h[2][1], "triangle: no even harmonics");
    EXPECT_NEAR(h[2][3] / h[2][1], 1.0 / 9.0, 0.005, "triangle: odd harmonics fall as 1/n^2");
    EXPECT_NEAR(h[2][5] / h[2][1], 1.0 / 25.0, 0.005, "triangle: the fifth harmonic is 1/25");
    EXPECT(h[3][2] < 0.0005 * h[3][1] && h[3][3] < 0.0005 * h[3][1], "sine: no harmonics");
    // Same peak level whatever the shape: sine fundamental = 1, saw = 2/pi, square = 4/pi.
    EXPECT_NEAR(h[0][1] / h[3][1], 2.0 / kPi, 0.01, "saw and sine share one peak level");
    EXPECT_NEAR(h[1][1] / h[3][1], 4.0 / kPi, 0.02, "square and sine share one peak level");

    // Width narrows the pulse: at 25 % every fourth harmonic drops out.
    clean(1);
    device.set_param(p::kOsc1Pw, 0.25f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo out = render(device, 2.0f, kRate);
    const double h1 = tone_level(out.left, 220.0, kRate, at(0.5));
    const double h2 = tone_level(out.left, 440.0, kRate, at(0.5));
    const double h4 = tone_level(out.left, 880.0, kRate, at(0.5));
    SHOW("pulse 25%%: h2/h1 %.4f h4/h1 %.5f\n", h2 / h1, h4 / h1);
    EXPECT_NEAR(h2 / h1, 0.7071, 0.01, "a 25 % pulse has a strong second harmonic");
    EXPECT(h4 < 0.003 * h1, "and no fourth");

    // Off centre the pulse is still centred on zero. The source's sits at
    // 2 pw - 1 on average: half the pulse's height of DC at 25 %, more than
    // the fundamental at 10 %.
    const double offset_25 = mean(out.left, at(0.5), at(1.5));
    clean(1);
    device.set_param(p::kOsc1Pw, 0.1f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo thin = render(device, 2.0f, kRate);
    const double thin_h1 = tone_level(thin.left, 220.0, kRate, at(0.5));
    const double offset_10 = mean(thin.left, at(0.5), at(1.5));
    SHOW("pulse DC over the fundamental: %.5f at 25 %%, %.5f at 10 %%\n", offset_25 / h1, offset_10 / thin_h1);
    EXPECT(std::fabs(offset_25) < 0.005 * h1, "a 25 % pulse carries no DC");
    EXPECT(std::fabs(offset_10) < 0.005 * thin_h1, "a 10 % pulse carries no DC");
  }

  // Oscillator 2: Mix crossfades, Coarse and Fine tune it.
  {
    clean(3);
    device.set_param(p::kOsc2Shape, 3.0f);
    device.set_param(p::kOsc2Coarse, 7.0f);
    device.set_param(p::kOscMix, 0.5f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo both = render(device, 2.0f, kRate);
    const double low = tone_level(both.left, 220.0, kRate, at(0.5));
    const double fifth = tone_level(both.left, 220.0 * std::pow(2.0, 7.0 / 12.0), kRate, at(0.5));
    EXPECT_NEAR(fifth / low, 1.0, 0.02, "Mix at 0.5 sounds both oscillators equally");

    clean(3);
    device.set_param(p::kOsc2Shape, 3.0f);
    device.set_param(p::kOsc2Coarse, 12.0f);
    device.set_param(p::kOsc2Fine, 50.0f);
    device.set_param(p::kOscMix, 1.0f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo second = render(device, 2.0f, kRate);
    const double hz = cycle_frequency(second.left, at(0.5), second.size());
    SHOW("osc2 +12 st +50 ct: %.3f Hz, osc1 residue %.6f\n", hz,
         tone_level(second.left, 220.0, kRate, at(0.5)));
    EXPECT_NEAR(hz, 440.0 * std::pow(2.0, 50.0 / 1200.0), 0.1, "Coarse +12 and Fine +50 tune oscillator 2");
    EXPECT(tone_level(second.left, 220.0, kRate, at(0.5)) < 0.001 * low, "Mix at 1 is oscillator 2 alone");

    // Oscillator 1 has its own tuning.
    clean(3);
    device.set_param(p::kOsc1Coarse, -12.0f);
    device.set_param(p::kOsc1Fine, -25.0f);
    device.note_on(1, 440.0f, 1.0f);
    Stereo first = render(device, 2.0f, kRate);
    EXPECT_NEAR(cycle_frequency(first.left, at(0.5), first.size()), 220.0 * std::pow(2.0, -25.0 / 1200.0),
                0.05, "Coarse -12 and Fine -25 tune oscillator 1");
  }

  // Hard sync: oscillator 2 restarts with oscillator 1, so the pitch stays
  // the master's and the slave's tuning only moves the formant.
  {
    const double slave = 220.0 * std::pow(2.0, 7.0 / 12.0);
    auto synced = [&](float sync, float coarse) {
      clean(0);
      device.set_param(p::kOsc2Coarse, coarse);
      device.set_param(p::kOsc2Sync, sync);
      device.set_param(p::kOscMix, 1.0f);
      device.note_on(1, 220.0f, 1.0f);
      return render(device, 2.0f, kRate);
    };
    Stereo free = synced(0.0f, 7.0f);
    Stereo locked = synced(1.0f, 7.0f);
    Stereo higher = synced(1.0f, 19.0f);
    const double free_slave = tone_level(free.left, slave, kRate, at(0.5));
    SHOW("sync off: slave %.4f master %.5f | on: slave %.5f h1 %.4f h2 %.4f h3 %.4f | +19: h1 %.4f h3 %.4f\n",
         free_slave, tone_level(free.left, 220.0, kRate, at(0.5)),
         tone_level(locked.left, slave, kRate, at(0.5)), tone_level(locked.left, 220.0, kRate, at(0.5)),
         tone_level(locked.left, 440.0, kRate, at(0.5)), tone_level(locked.left, 660.0, kRate, at(0.5)),
         tone_level(higher.left, 220.0, kRate, at(0.5)), tone_level(higher.left, 660.0, kRate, at(0.5)));
    EXPECT(tone_level(free.left, 220.0, kRate, at(0.5)) < 0.01 * free_slave,
           "without sync oscillator 2 alone plays its own pitch");
    EXPECT(tone_level(locked.left, slave, kRate, at(0.5)) < 0.01 * free_slave,
           "with sync the slave's own pitch is gone");
    EXPECT(tone_level(locked.left, 220.0, kRate, at(0.5)) > 0.3 * free_slave,
           "and the master's fundamental carries the note");
    const double low_ratio =
        tone_level(locked.left, 660.0, kRate, at(0.5)) / tone_level(locked.left, 220.0, kRate, at(0.5));
    const double high_ratio =
        tone_level(higher.left, 660.0, kRate, at(0.5)) / tone_level(higher.left, 220.0, kRate, at(0.5));
    EXPECT(high_ratio > 3.0 * low_ratio, "tuning the slave up moves the energy up, not the pitch");
    EXPECT(worst_alias_db(locked.left, 220.0, 10000.0, 22000.0) < -60.0,
           "the sync reset is band-limited: nothing but harmonics above 10 kHz");
  }

  // Sub: a sine one octave down, level set by Sub.
  {
    double ratio[3] = {};
    const float levels[3] = {0.0f, 0.5f, 1.0f};
    for (int i = 0; i < 3; ++i) {
      clean(3);
      device.set_param(p::kSubLevel, levels[i]);
      device.note_on(1, 440.0f, 1.0f);
      Stereo out = render(device, 2.0f, kRate);
      ratio[i] = tone_level(out.left, 220.0, kRate, at(0.5)) / tone_level(out.left, 440.0, kRate, at(0.5));
      SHOW("sub %.1f: sub/osc %.4f\n", levels[i], ratio[i]);
    }
    EXPECT(ratio[0] < 1.0e-4, "no sub at Sub 0");
    // The oscillator passes the unison pan law (-3 dB), the sub does not.
    EXPECT_NEAR(ratio[2], std::sqrt(2.0), 0.02,
                "Sub at 1 is a sine an octave down, 3 dB above the oscillator");
    EXPECT_NEAR(ratio[1] / ratio[2], 0.5, 0.01, "and its level follows the control");
  }

  // Noise: white, the same in both channels, level set by Noise.
  {
    auto with_noise = [&](float level) {
      clean(3);
      device.set_param(p::kNoiseLevel, level);
      device.note_on(1, 440.0f, 1.0f);
      return render(device, 2.0f, kRate);
    };
    Stereo none = with_noise(0.0f);
    Stereo half = with_noise(0.5f);
    Stereo full = with_noise(1.0f);
    // Nothing in this patch is nonlinear, so the difference is the noise alone.
    std::vector<float> hiss_half(full.size()), hiss_full(full.size());
    for (size_t i = 0; i < full.size(); ++i) {
      hiss_half[i] = half.left[i] - none.left[i];
      hiss_full[i] = full.left[i] - none.left[i];
    }
    const double tone = tone_level(none.left, 440.0, kRate, at(0.5));
    SHOW("noise: rms %.4f (tone %.4f), half/full %.4f, above 6 kHz %.3f, mean %.5f\n",
         rms(hiss_full, at(0.5)), tone, rms(hiss_half, at(0.5)) / rms(hiss_full, at(0.5)),
         energy_above(hiss_full, 6000.0, kRate, at(0.5)), mean(hiss_full, at(0.5)));
    // Half of the 2x band is removed by the decimator, which costs 3 dB.
    EXPECT(rms(hiss_full, at(0.5)) > 0.35 * tone && rms(hiss_full, at(0.5)) < 0.6 * tone,
           "Noise at 1 is within a few dB of an oscillator");
    EXPECT_NEAR(rms(hiss_half, at(0.5)) / rms(hiss_full, at(0.5)), 0.5, 0.01,
                "its level follows the control");
    // This one-pole split reads 0.29 for white noise; the open filter takes a little off the top.
    EXPECT_NEAR(energy_above(hiss_full, 6000.0, kRate, at(0.5)), 0.26, 0.05, "it is white");
    EXPECT(std::fabs(mean(hiss_full, at(0.5))) < 0.002, "with no offset");
    EXPECT(full.left == full.right, "and it sits in the centre");
  }
}
// Cutoff, slope, resonance, the three types, key tracking, velocity, drive.
static void check_filter() {
  // A 440 Hz saw puts harmonics exactly 0, 1, 2 and 3 octaves above a 440 Hz
  // cutoff. Each is compared with the same harmonic through the open filter,
  // and with what the filter's transfer function says.
  auto harmonics = [&](int type, int slope, float cutoff, float resonance, double* level) {
    clean(0);
    device.set_param(p::kVolume, -24.0f);  // room for a resonant peak under the clip knee
    device.set_param(p::kFilterType, static_cast<float>(type));
    device.set_param(p::kFilterSlope, static_cast<float>(slope));
    device.set_param(p::kCutoff, cutoff);
    device.set_param(p::kResonance, resonance);
    device.note_on(1, 440.0f, 1.0f);
    Stereo out = render(device, 2.0f, kRate);
    for (int k = 0; k < 5; ++k) level[k] = tone_level(out.left, 440.0 * (1 << k), kRate, at(0.5));
  };
  double open[5];
  harmonics(0, 0, 20000.0f, 0.0f, open);
  auto compare = [&](const char* what, int type, int slope, float cutoff, float resonance, int octaves,
                     double tolerance_db, double* measured_db) {
    double level[5];
    harmonics(type, slope, cutoff, resonance, level);
    double worst = 0.0;
    for (int k = 0; k < octaves; ++k) {
      const double hz = 440.0 * (1 << k);
      const double expected =
          db(svf_gain(hz, cutoff, resonance, type, slope + 1) / svf_gain(hz, 20000.0, 0.0, 0, 1));
      measured_db[k] = db(level[k] / open[k]);
      SHOW("%s: %5.0f Hz %8.2f dB (expected %8.2f)\n", what, hz, measured_db[k], expected);
      worst = std::max(worst, std::fabs(measured_db[k] - expected));
    }
    char label[160];
    std::snprintf(label, sizeof label,
                  "%s: the response follows the filter's transfer function (worst %.2f dB)", what, worst);
    EXPECT(worst < tolerance_db, label);
  };

  double two_pole[5], four_pole[5], moved[5], peak_db[5], high[5], band[5];
  compare("low-pass 12 dB at 440 Hz", 0, 0, 440.0f, 0.0f, 4, 0.1, two_pole);
  compare("low-pass 24 dB at 440 Hz", 0, 1, 440.0f, 0.0f, 4, 0.2, four_pole);
  EXPECT_NEAR(two_pole[0], -6.02, 0.2, "12 dB slope: the cutoff is the -6 dB point without resonance");
  EXPECT_NEAR(four_pole[0], -12.04, 0.3, "24 dB slope: two stages, -12 dB at the cutoff");
  EXPECT_NEAR(two_pole[2] - two_pole[3], 11.7, 0.6, "12 dB slope: 12 dB per octave well above the cutoff");
  EXPECT_NEAR(four_pole[2] - four_pole[3], 23.4, 1.2, "24 dB slope: 24 dB per octave well above the cutoff");

  compare("low-pass 12 dB at 1760 Hz", 0, 0, 1760.0f, 0.0f, 5, 0.1, moved);
  EXPECT_NEAR(moved[2], -6.02, 0.2, "Cutoff moves the -6 dB point to 1760 Hz");
  EXPECT(moved[0] > -0.7, "and leaves two octaves below it alone");

  compare("resonance 1", 0, 0, 440.0f, 1.0f, 4, 0.2, peak_db);
  EXPECT_NEAR(peak_db[0], 20.0, 0.5, "full resonance is a 20 dB peak at the cutoff (Q 10)");
  compare("resonance 0.5", 0, 0, 440.0f, 0.5f, 4, 0.1, peak_db);

  compare("high-pass 12 dB at 1760 Hz", 1, 0, 1760.0f, 0.0f, 5, 0.1, high);
  EXPECT(high[0] < -24.0 && high[4] > -0.7, "high-pass removes the fundamental and keeps the top");
  compare("high-pass 24 dB at 1760 Hz", 1, 1, 1760.0f, 0.0f, 5, 0.2, high);
  EXPECT(high[0] < -48.0, "the 24 dB high-pass is twice as steep");

  compare("band-pass at 1760 Hz", 2, 0, 1760.0f, 0.5f, 5, 0.1, band);
  EXPECT_NEAR(band[2], 0.0, 0.2, "band-pass is at unity on the cutoff");
  EXPECT(band[0] < -10.0 && band[4] < -10.0, "and falls away on both sides");

  // Key tracking: at 1 the cutoff follows the keyboard octave for octave
  // around middle C; at 0 it stays put.
  {
    auto fundamental_db = [&](float track, float hz) {
      double level[2];
      for (int pass = 0; pass < 2; ++pass) {
        clean(3);
        device.set_param(p::kCutoff, pass == 0 ? 20000.0f : 261.626f);
        device.set_param(p::kKeyTrack, pass == 0 ? 0.0f : track);
        device.note_on(1, hz, 1.0f);
        Stereo out = render(device, 1.5f, kRate);
        level[pass] = tone_level(out.left, hz, kRate, at(0.5));
      }
      return db(level[1] / level[0]);
    };
    const double c4 = fundamental_db(1.0f, 261.626f);
    const double c6_tracked = fundamental_db(1.0f, 1046.502f);
    const double c6_half = fundamental_db(0.5f, 1046.502f);
    const double c6_fixed = fundamental_db(0.0f, 1046.502f);
    const double c2_tracked = fundamental_db(1.0f, 65.406f);
    SHOW("key track: C4 %.2f, C6 tracked %.2f, half %.2f, fixed %.2f, C2 tracked %.2f dB\n", c4, c6_tracked,
         c6_half, c6_fixed, c2_tracked);
    EXPECT_NEAR(c4, -6.02, 0.2, "cutoff on middle C: the note sits on the -6 dB point");
    EXPECT_NEAR(c6_tracked, -6.02, 0.3, "Key Track 1: two octaves up, the cutoff came along");
    EXPECT_NEAR(c2_tracked, -6.02, 0.3, "Key Track 1: two octaves down too");
    EXPECT_NEAR(c6_half, -13.98, 0.3, "Key Track 0.5: the cutoff moved one octave for two");
    EXPECT_NEAR(c6_fixed, -24.6, 0.4, "Key Track 0: the cutoff stayed two octaves below the note");
  }

  // Velocity to filter: +-2 octaves around the set cutoff at full amount.
  {
    auto fundamental_db = [&](float amount, float velocity) {
      double level[2];
      for (int pass = 0; pass < 2; ++pass) {
        clean(3);
        device.set_param(p::kCutoff, pass == 0 ? 20000.0f : 500.0f);
        device.set_param(p::kVelToFilter, pass == 0 ? 0.0f : amount);
        device.note_on(1, 500.0f, velocity);
        Stereo out = render(device, 1.5f, kRate);
        level[pass] = tone_level(out.left, 500.0, kRate, at(0.5));
      }
      return db(level[1] / level[0]);
    };
    const double soft = fundamental_db(1.0f, 0.0f);
    const double middle = fundamental_db(1.0f, 0.5f);
    const double hard = fundamental_db(1.0f, 1.0f);
    const double off = fundamental_db(0.0f, 1.0f);
    SHOW("vel>filter: soft %.2f middle %.2f hard %.2f off %.2f dB\n", soft, middle, hard, off);
    EXPECT_NEAR(middle, -6.02, 0.2, "velocity 0.5 leaves the cutoff where it is");
    EXPECT_NEAR(hard, -0.53, 0.2, "a hard note opens the filter two octaves");
    EXPECT_NEAR(soft, -24.6, 0.4, "a soft note closes it two octaves");
    EXPECT_NEAR(off, -6.02, 0.2, "and Vel > Filter 0 ignores velocity");
  }

  // Drive: a tanh stage before the filter, level-compensated.
  {
    auto driven = [&](float drive, double* h1, double* h3) {
      clean(3);
      device.set_param(p::kFilterDrive, drive);
      device.note_on(1, 220.0f, 1.0f);
      Stereo out = render(device, 1.5f, kRate);
      *h1 = tone_level(out.left, 220.0, kRate, at(0.5));
      *h3 = tone_level(out.left, 660.0, kRate, at(0.5));
      return worst_alias_db(out.left, 220.0, 2000.0, 22000.0);
    };
    double clean_h1, clean_h3, half_h1, half_h3, full_h1, full_h3;
    driven(0.0f, &clean_h1, &clean_h3);
    driven(0.5f, &half_h1, &half_h3);
    const double alias = driven(1.0f, &full_h1, &full_h3);
    SHOW("drive: h3/h1 clean %.5f half %.4f full %.4f; h1 full/clean %.3f; alias %.1f dBFS\n",
         clean_h3 / clean_h1, half_h3 / half_h1, full_h3 / full_h1, full_h1 / clean_h1, alias);
    EXPECT(clean_h3 < 0.0005 * clean_h1, "no Drive: a sine stays a sine");
    EXPECT(half_h3 > 0.05 * half_h1 && half_h3 < full_h3,
           "Drive adds odd harmonics, more as it is turned up");
    EXPECT(full_h3 > 0.2 * full_h1 && full_h3 < 0.36 * full_h1, "full Drive squares the wave off");
    EXPECT(full_h1 > 0.35 * clean_h1 && full_h1 < 1.1 * clean_h1, "without getting louder");
    EXPECT(alias < -70.0, "and its harmonics do not fold back (2x engine)");
  }
}
// Amp and filter envelope times and levels, velocity to amp.
static void check_envelopes() {
  // The Tatami timing test: attack reaches 99 % and release -60 dB within
  // 10 % of the set times.
  {
    const float attack = 0.2f, release = 0.3f;
    const double off_at = 0.6;
    clean(3);
    device.set_param(p::kAmpAttack, attack);
    device.set_param(p::kAmpDecay, 0.5f);
    device.set_param(p::kAmpSustain, 1.0f);
    device.set_param(p::kAmpRelease, release);
    device.note_on(1, 1760.0f, 1.0f);
    Stereo out = render(device, static_cast<float>(off_at), kRate);
    device.note_off(1);
    out = concat(out, render(device, 0.8f, kRate));
    const int window = 96;  // 2 ms: 3.5 periods of the tone
    const std::vector<float> env = envelope(out.left, window);
    const double seconds_per_window = window / kRate;
    float steady = 0.0f;
    for (size_t i = static_cast<size_t>(0.4 / seconds_per_window);
         i < static_cast<size_t>(off_at / seconds_per_window); ++i) {
      steady = std::max(steady, env[i]);
    }
    size_t reached = 0;
    while (reached < env.size() && env[reached] < 0.99f * steady) ++reached;
    const double attack_measured = static_cast<double>(reached + 1) * seconds_per_window;
    size_t quiet = static_cast<size_t>(off_at / seconds_per_window);
    while (quiet < env.size() && env[quiet] > 0.001f * steady) ++quiet;
    const double release_measured = static_cast<double>(quiet + 1) * seconds_per_window - off_at;
    SHOW("amp env: attack %.3f s (set %.1f), release %.3f s (set %.1f)\n", attack_measured, attack,
         release_measured, release);
    EXPECT(attack_measured > 0.9 * attack && attack_measured < 1.1 * attack,
           "amp attack reaches full level within 10 % of the set time (Tatami)");
    EXPECT(release_measured > 0.9 * release && release_measured < 1.1 * release,
           "amp release reaches -60 dB within 10 % of the set time (Tatami)");
    // Half-way through the attack the curve has covered two thirds (an RC
    // charge aimed 30 % above the peak).
    EXPECT_NEAR(env[static_cast<size_t>(0.1 / seconds_per_window)] / steady, 0.675, 0.03,
                "the attack is the analog-style curve of the source");
  }

  // Decay falls to the sustain level in the decay time.
  {
    clean(3);
    device.set_param(p::kAmpAttack, 0.01f);
    device.set_param(p::kAmpDecay, 0.2f);
    device.set_param(p::kAmpSustain, 0.4f);
    device.note_on(1, 1760.0f, 1.0f);
    Stereo out = render(device, 1.0f, kRate);
    const double top = peak(out.left, 0, at(0.05));
    const double held = peak(out.left, at(0.5), at(1.0));
    // 60 dB of the way from the peak to the sustain level after the decay time.
    const double at_decay = peak(out.left, at(0.21), at(0.215));
    SHOW("decay: sustain/peak %.4f, at decay time %.4f\n", held / top, at_decay / top);
    EXPECT_NEAR(held / top, 0.4, 0.01, "Amp Sustain is the held level");
    EXPECT_NEAR(at_decay / top, 0.4 + 0.6 * 0.001, 0.01, "Amp Decay is the time to get there");
    EXPECT(peak(out.left, at(0.06), at(0.065)) / top > 0.5, "and not sooner");
  }

  // Velocity to amp.
  {
    auto level = [&](float amount, float velocity) {
      device.init(kRate);
      device.set_param(p::kOsc1Shape, 3.0f);
      device.set_param(p::kVelToAmp, amount);
      device.note_on(1, 440.0f, velocity);
      Stereo out = render(device, 1.0f, kRate);
      return tone_level(out.left, 440.0, kRate, at(0.5));
    };
    const double full = level(1.0f, 1.0f);
    SHOW("vel>amp: 1.0 -> %.4f, 0.7 -> %.4f, 0 -> %.4f\n", level(1.0f, 0.25f) / full,
         level(0.7f, 0.25f) / full, level(0.0f, 0.25f) / full);
    EXPECT_NEAR(level(1.0f, 0.25f) / full, 0.25, 0.005, "Vel > Amp 1: the level is the velocity");
    EXPECT_NEAR(level(0.7f, 0.25f) / full, 0.3 + 0.7 * 0.25, 0.005, "Vel > Amp 0.7 (default): 70 % of it");
    EXPECT_NEAR(level(0.0f, 0.25f) / full, 1.0, 0.005, "Vel > Amp 0: every note at full level");
  }

  // The filter envelope moves the cutoff up to six octaves. A 2 kHz sine
  // through a low-pass that starts six octaves below it traces the envelope:
  // the tone is on the -6 dB point exactly when the envelope peaks.
  {
    auto sweep = [&](float amount, float cutoff) {
      clean(3);
      device.set_param(p::kCutoff, cutoff);
      device.set_param(p::kFilterEnvAmount, amount);
      device.set_param(p::kFilterAttack, 0.2f);
      device.set_param(p::kFilterDecay, 0.3f);
      device.set_param(p::kFilterSustain, 0.5f);
      device.set_param(p::kFilterRelease, 0.1f);
      device.set_param(p::kAmpRelease, 2.0f);
      device.note_on(1, 2000.0f, 1.0f);
      Stereo out = render(device, 1.0f, kRate);
      device.note_off(1);
      return concat(out, render(device, 0.3f, kRate));
    };
    clean(3);
    device.note_on(1, 2000.0f, 1.0f);
    const double reference = tone_level(render(device, 0.5f, kRate).left, 2000.0, kRate, at(0.25));

    Stereo up = sweep(1.0f, 31.25f);
    const int window = 96;
    const std::vector<float> env = envelope(up.left, window);
    size_t top = 0;
    for (size_t i = 0; i < env.size(); ++i) {
      if (env[i] > env[top]) top = i;
    }
    const double peak_time = (static_cast<double>(top) + 0.5) * window / kRate;
    const double peak_db = db(env[top] / reference);
    const double half_db = db(tone_level(up.left, 2000.0, kRate, at(0.098), at(0.102)) / reference);
    const double sustain_db = db(tone_level(up.left, 2000.0, kRate, at(0.7), at(0.9)) / reference);
    const double released_db = db(peak(up.left, at(1.1), at(1.12)) / reference);
    SHOW(
        "filter env: peak at %.3f s, %.2f dB; half attack %.2f dB; sustain %.2f dB; 0.1 s after release %.1f "
        "dB\n",
        peak_time, peak_db, half_db, sustain_db, released_db);
    EXPECT(peak_time > 0.18 && peak_time < 0.22, "Filter Attack: the envelope peaks at the set time");
    EXPECT_NEAR(peak_db, -6.02, 0.3, "Filter Env 1 opens the cutoff six octaves at the peak");
    // Envelope 0.675 half-way: cutoff 4.05 octaves up, 1.95 below the tone.
    EXPECT_NEAR(half_db, db(svf_gain(2000.0, 31.25 * std::pow(2.0, 6.0 * 0.6755), 0.0, 0, 1)), 1.0,
                "half-way through the attack the cutoff is where the curve puts it");
    EXPECT_NEAR(sustain_db, db(svf_gain(2000.0, 250.0, 0.0, 0, 1)), 0.5,
                "Filter Decay and Sustain: the cutoff settles three octaves up at sustain 0.5");
    EXPECT(released_db < -60.0, "Filter Release closes it again after note-off, ahead of the amp release");

    // A negative amount closes the filter instead.
    Stereo down = sweep(-1.0f, 2000.0f);
    const double start_db = db(tone_level(down.left, 2000.0, kRate, at(0.002), at(0.006)) / reference);
    const double dip_db = db(tone_level(down.left, 2000.0, kRate, at(0.198), at(0.202)) / reference);
    SHOW("filter env negative: start %.2f dB, at the peak %.1f dB\n", start_db, dip_db);
    EXPECT(start_db > -9.0 && dip_db < -60.0, "a negative Filter Env sweeps the cutoff down");
  }
}
// The value the source's LFO has at `phase` (0..1) for the four periodic shapes.
static double lfo_shape(int shape, double phase) {
  switch (shape) {
    case 0:
      return std::sin(2.0 * kPi * phase);
    case 1:
      return phase < 0.5 ? 4.0 * phase - 1.0 : 3.0 - 4.0 * phase;
    case 2:
      return 1.0 - 2.0 * phase;
    default:
      return phase < 0.5 ? 1.0 : -1.0;
  }
}

// Two LFOs, five shapes, five destinations, at the set rate, never reset by
// notes.
static void check_lfos() {
  // What the output shows of the LFO is late by the decimator and the filter.
  const double lag = 17.0 / kRate;

  // Pitch: +-12 semitones at full amount. LFO 2 goes to pitch by default.
  {
    clean(3);
    device.set_param(p::kLfo2Rate, 5.0f);
    device.set_param(p::kLfo2Amount, 1.0f / 12.0f);
    device.note_on(1, 1000.0f, 1.0f);
    Stereo out = render(device, 2.4f, kRate);
    const Track vibrato = track(out.left, at(0.2), at(2.4));
    double lo = 1.0e9, hi = 0.0;
    for (double hz : vibrato.hz) {
      lo = std::min(lo, hz);
      hi = std::max(hi, hz);
    }
    const double rate = swing_rate(vibrato.time, vibrato.hz);
    SHOW("lfo>pitch: %.2f..%.2f Hz (expected %.2f..%.2f), rate %.3f Hz\n", lo, hi,
         1000.0 * std::pow(2.0, -1.0 / 12.0), 1000.0 * std::pow(2.0, 1.0 / 12.0), rate);
    EXPECT_NEAR(hi, 1000.0 * std::pow(2.0, 1.0 / 12.0), 1.0, "LFO to pitch: amount 1/12 is one semitone up");
    EXPECT_NEAR(lo, 1000.0 * std::pow(2.0, -1.0 / 12.0), 1.0, "and one semitone down");
    EXPECT_NEAR(rate, 5.0, 0.05, "at the set rate");
  }

  // Amp: each periodic shape, read off the tremolo it makes. Amount 1 swings
  // the gain between 0 and 1.
  clean(3);
  device.note_on(1, 1760.0f, 1.0f);
  const double reference = tone_level(render(device, 0.5f, kRate).left, 1760.0, kRate, at(0.25));
  {
    const char* names[4] = {"sine", "triangle", "saw", "square"};
    for (int shape = 0; shape < 4; ++shape) {
      clean(3);
      device.set_param(p::kLfo1Shape, static_cast<float>(shape));
      device.set_param(p::kLfo1Rate, 3.0f);
      device.set_param(p::kLfo1Dest, 2.0f);
      device.set_param(p::kLfo1Amount, 1.0f);
      device.note_on(1, 1760.0f, 1.0f);
      Stereo out = render(device, 2.5f, kRate);
      double worst = 0.0;
      for (double phase : {0.1, 0.25, 0.4, 0.6, 0.75, 0.9}) {
        const size_t centre = at((2.0 + phase) / 3.0 + lag);
        const double gain = tone_level(out.left, 1760.0, kRate, centre - 96, centre + 96) / reference;
        const double expected = 0.5 + 0.5 * lfo_shape(shape, phase);
        SHOW("lfo>amp %s at phase %.2f: gain %.3f (expected %.3f)\n", names[shape], phase, gain, expected);
        worst = std::max(worst, std::fabs(gain - expected));
      }
      const double rate = swing_rate(envelope(out.left, 96), kRate / 96.0, 50);
      SHOW("lfo>amp %s: rate %.3f Hz\n", names[shape], rate);
      char label[120];
      std::snprintf(label, sizeof label, "LFO to amp: the %s shape is the tremolo's shape", names[shape]);
      EXPECT(worst < 0.03, label);
      std::snprintf(label, sizeof label, "LFO to amp: the %s runs at the set rate", names[shape]);
      EXPECT_NEAR(rate, 3.0, 0.05, label);
    }
  }

  // Sample and hold: a new random level every cycle, the source's sequence.
  {
    clean(3);
    device.set_param(p::kLfo1Shape, 4.0f);
    device.set_param(p::kLfo1Rate, 10.0f);
    device.set_param(p::kLfo1Dest, 2.0f);
    device.set_param(p::kLfo1Amount, 1.0f);
    device.note_on(1, 1760.0f, 1.0f);
    Stereo out = render(device, 0.8f, kRate);
    uint32_t seed = 0x9E3779B9u;
    double held = 0.0, worst = 0.0;
    for (int cycle = 0; cycle < 7; ++cycle) {
      const size_t centre = at((cycle + 0.5) / 10.0 + lag);
      const double gain = tone_level(out.left, 1760.0, kRate, centre - 480, centre + 480) / reference;
      SHOW("lfo S&H cycle %d: gain %.3f (expected %.3f)\n", cycle, gain, 0.5 + 0.5 * held);
      worst = std::max(worst, std::fabs(gain - (0.5 + 0.5 * held)));
      seed ^= seed << 13;
      seed ^= seed >> 17;
      seed ^= seed << 5;
      held = static_cast<double>(seed & 0xFFFFFFu) / 8388607.5 - 1.0;
    }
    EXPECT(worst < 0.02, "sample and hold steps to a new level once per cycle, holding in between");
  }

  // Amount scales the depth and its sign flips the direction.
  {
    auto gain_at = [&](float amount, double phase) {
      clean(3);
      device.set_param(p::kLfo1Shape, 3.0f);
      device.set_param(p::kLfo1Rate, 3.0f);
      device.set_param(p::kLfo1Dest, 2.0f);
      device.set_param(p::kLfo1Amount, amount);
      device.note_on(1, 1760.0f, 1.0f);
      Stereo out = render(device, 1.2f, kRate);
      const size_t centre = at((2.0 + phase) / 3.0 + lag);
      return tone_level(out.left, 1760.0, kRate, centre - 96, centre + 96) / reference;
    };
    EXPECT_NEAR(gain_at(0.5f, 0.75), 0.5, 0.02, "LFO to amp at half amount dips to half");
    EXPECT_NEAR(gain_at(0.5f, 0.25), 1.0, 0.02, "and returns to full level");
    EXPECT_NEAR(gain_at(-1.0f, 0.25), 0.0, 0.02, "a negative amount turns the tremolo over");
    EXPECT_NEAR(gain_at(-1.0f, 0.75), 1.0, 0.02, "(loud where it was silent)");
    EXPECT_NEAR(gain_at(0.0f, 0.75), 1.0, 0.005, "amount 0 does nothing");
  }

  // Cutoff: +-5 octaves at full amount. A 1 kHz sine on the cutoff of a
  // 12 dB low-pass, swung two octaves each way by a triangle.
  {
    clean(3);
    device.note_on(1, 1000.0f, 1.0f);
    const double open = tone_level(render(device, 0.5f, kRate).left, 1000.0, kRate, at(0.25));
    clean(3);
    device.set_param(p::kCutoff, 1000.0f);
    device.set_param(p::kLfo1Shape, 1.0f);
    device.set_param(p::kLfo1Rate, 2.0f);
    device.set_param(p::kLfo1Dest, 1.0f);
    device.set_param(p::kLfo1Amount, 0.4f);
    device.note_on(1, 1000.0f, 1.0f);
    Stereo out = render(device, 3.0f, kRate);
    const size_t top = at(1.25 + lag), bottom = at(1.5 + lag), middle = at(1.125 + lag);
    const double top_db = db(tone_level(out.left, 1000.0, kRate, top - 96, top + 96) / open);
    const double bottom_db = db(tone_level(out.left, 1000.0, kRate, bottom - 96, bottom + 96) / open);
    const double middle_db = db(tone_level(out.left, 1000.0, kRate, middle - 96, middle + 96) / open);
    const double rate = swing_rate(envelope(out.left, 96), kRate / 96.0, 50);
    SHOW("lfo>cutoff: top %.2f dB, middle %.2f dB, bottom %.2f dB, rate %.3f Hz\n", top_db, middle_db,
         bottom_db, rate);
    EXPECT_NEAR(top_db, -0.53, 0.3, "LFO to cutoff: amount 0.4 opens the filter two octaves");
    EXPECT_NEAR(bottom_db, -24.6, 0.6, "and closes it two octaves");
    EXPECT_NEAR(middle_db, -6.02, 0.5, "through the set cutoff in the middle");
    EXPECT_NEAR(rate, 2.0, 0.05, "at the set rate");
  }

  // Pan: equal power, hard left to hard right at full amount.
  {
    auto sides = [&](float amount, double phase, double* left, double* right, double* rate) {
      clean(3);
      device.set_param(p::kLfo1Rate, 3.0f);
      device.set_param(p::kLfo1Dest, 3.0f);
      device.set_param(p::kLfo1Amount, amount);
      device.note_on(1, 1760.0f, 1.0f);
      Stereo out = render(device, 2.5f, kRate);
      const size_t centre = at((2.0 + phase) / 3.0 + lag);
      // Against the centred level, which is 3 dB down on each side.
      *left = tone_level(out.left, 1760.0, kRate, centre - 96, centre + 96) / (reference * std::sqrt(2.0));
      *right = tone_level(out.right, 1760.0, kRate, centre - 96, centre + 96) / (reference * std::sqrt(2.0));
      *rate = swing_rate(envelope(out.left, 96), kRate / 96.0, 50);
    };
    double left, right, rate;
    sides(1.0f, 0.25, &left, &right, &rate);
    SHOW("lfo>pan full, LFO high: L %.3f R %.3f, rate %.3f\n", left, right, rate);
    EXPECT(left < 0.03 && std::fabs(right - 1.0) < 0.02, "LFO to pan: hard right at the top of the cycle");
    EXPECT_NEAR(rate, 3.0, 0.05, "at the set rate");
    sides(1.0f, 0.75, &left, &right, &rate);
    EXPECT(right < 0.03 && std::fabs(left - 1.0) < 0.02, "hard left at the bottom");
    sides(0.5f, 0.25, &left, &right, &rate);
    SHOW("lfo>pan half, LFO high: L %.3f R %.3f\n", left, right);
    EXPECT_NEAR(left, 0.5, 0.02, "half amount: half way, equal power (left)");
    EXPECT_NEAR(right, std::sqrt(0.75), 0.02, "half amount: half way, equal power (right)");
  }

  // Pulse width: +-0.45 at full amount. The fundamental of a pulse is
  // sin(pi * width), so it follows the width.
  {
    clean(1);
    device.set_param(p::kOsc1Pw, 0.5f);
    device.note_on(1, 440.0f, 1.0f);
    const double square = tone_level(render(device, 0.5f, kRate).left, 440.0, kRate, at(0.25));
    clean(1);
    device.set_param(p::kOsc1Pw, 0.3f);
    device.set_param(p::kLfo1Rate, 2.0f);
    device.set_param(p::kLfo1Dest, 4.0f);
    device.set_param(p::kLfo1Amount, 0.4f);
    device.note_on(1, 440.0f, 1.0f);
    Stereo out = render(device, 2.5f, kRate);
    const size_t wide = at(1.125 + lag), narrow = at(1.375 + lag);
    const double wide_level = tone_level(out.left, 440.0, kRate, wide - 240, wide + 240) / square;
    const double narrow_level = tone_level(out.left, 440.0, kRate, narrow - 240, narrow + 240) / square;
    std::vector<float> fundamental;
    for (size_t from = at(0.25); from + 480 <= out.size(); from += 240) {
      fundamental.push_back(static_cast<float>(tone_level(out.left, 440.0, kRate, from, from + 480)));
    }
    const double rate = swing_rate(fundamental, kRate / 240.0);
    SHOW("lfo>pw: wide %.3f (expected %.3f), narrow %.3f (expected %.3f), rate %.3f\n", wide_level,
         std::sin(kPi * 0.48), narrow_level, std::sin(kPi * 0.12), rate);
    EXPECT_NEAR(wide_level, std::sin(kPi * 0.48), 0.02, "LFO to PW: width 0.3 + 0.18 at the top");
    EXPECT_NEAR(narrow_level, std::sin(kPi * 0.12), 0.03, "and 0.3 - 0.18 at the bottom");
    EXPECT_NEAR(rate, 2.0, 0.05, "at the set rate");
  }

  // Free-running: a note does not restart the LFO, and neither does the time
  // the instrument spends asleep before it.
  {
    auto tremolo = [&](float wait) {
      clean(3);
      device.set_param(p::kLfo1Shape, 3.0f);
      device.set_param(p::kLfo1Rate, 2.0f);
      device.set_param(p::kLfo1Dest, 2.0f);
      device.set_param(p::kLfo1Amount, 1.0f);
      Stereo before = render(device, wait, kRate);
      device.note_on(1, 1760.0f, 1.0f);
      return concat(before, render(device, 2.0f - wait, kRate));
    };
    Stereo early = tremolo(0.0f);
    Stereo late = tremolo(0.7f);
    bool same = true;
    for (double seconds : {0.875, 1.125, 1.375, 1.625, 1.875}) {
      const double a = peak(early.left, at(seconds - 0.05), at(seconds + 0.05)) / reference;
      const double b = peak(late.left, at(seconds - 0.05), at(seconds + 0.05)) / reference;
      const bool loud = std::fmod(seconds * 2.0, 1.0) < 0.5;
      SHOW("free-running LFO at %.3f s: early %.3f late %.3f (%s)\n", seconds, a, b,
           loud ? "loud" : "silent");
      if (std::fabs(a - (loud ? 1.0 : 0.0)) > 0.03 || std::fabs(b - (loud ? 1.0 : 0.0)) > 0.03) same = false;
    }
    EXPECT(same, "the LFO keeps its own time: notes and sleep do not reset it");
  }
}
// The tracked frequency at `seconds`, between the two nearest cycles.
static double hz_at(const Track& t, double seconds) {
  for (size_t i = 1; i < t.time.size(); ++i) {
    if (t.time[i] >= seconds) {
      const double mix = (seconds - t.time[i - 1]) / (t.time[i] - t.time[i - 1]);
      return t.hz[i - 1] + mix * (t.hz[i] - t.hz[i - 1]);
    }
  }
  return t.hz.empty() ? 0.0 : t.hz.back();
}

// Unison: detuned copies spread across the stereo field. Glide: a straight
// line in semitones that takes the set time.
static void check_unison_and_glide() {
  auto unison = [&](int shape, int voices, float detune, float spread, float seconds) {
    clean(shape);
    device.set_param(p::kUnisonVoices, static_cast<float>(voices));
    device.set_param(p::kUnisonDetune, detune);
    device.set_param(p::kUnisonSpread, spread);
    device.note_on(1, 440.0f, 1.0f);
    return render(device, seconds, kRate);
  };
  const double low = 440.0 * std::pow(2.0, -15.0 / 1200.0);
  const double high = 440.0 * std::pow(2.0, 15.0 / 1200.0);

  clean(3);
  device.note_on(1, 440.0f, 1.0f);
  Stereo single = render(device, 3.0f, kRate);
  const double single_level = tone_level(single.left, 440.0, kRate, at(0.5), at(2.5));

  {
    // Two voices, 15 cents each way, full spread: one voice per side.
    Stereo wide = unison(3, 2, 15.0f, 1.0f, 3.0f);
    const Track left = track(wide.left, at(0.5), at(2.5));
    const Track right = track(wide.right, at(0.5), at(2.5));
    const double left_hz =
        static_cast<double>(left.hz.size()) / (left.time.back() - left.time.front() + 1.0 / low);
    const double right_hz =
        static_cast<double>(right.hz.size()) / (right.time.back() - right.time.front() + 1.0 / high);
    const double link = correlation(wide.left, wide.right, at(0.5), at(2.5));
    SHOW("unison 2 wide: L %.3f Hz (expected %.3f), R %.3f Hz (expected %.3f), correlation %.4f\n", left_hz,
         low, right_hz, high, link);
    EXPECT_NEAR(left_hz, low, 0.05,
                "unison detune: the low voice is 15 cents flat, hard left at full spread");
    EXPECT_NEAR(right_hz, high, 0.05, "and the high voice 15 cents sharp, hard right");
    EXPECT(std::fabs(link) < 0.05, "full spread: left and right are different voices (uncorrelated)");
    EXPECT(tone_level(wide.left, high, kRate, at(0.5), at(2.5)) < 0.002 * single_level,
           "nothing of the right voice on the left");
    // Each of the two carries 1/sqrt(2) of the level, on one side at full gain.
    EXPECT_NEAR(tone_level(wide.left, low, kRate, at(0.5), at(2.5)) / single_level, 1.0, 0.02,
                "two voices at 1/sqrt(2) each, panned hard: the level of one centred voice per side");
  }
  {
    // No spread: the same two voices beat in the centre.
    Stereo narrow = unison(3, 2, 15.0f, 0.0f, 3.0f);
    double differ = 0.0;
    for (size_t i = 0; i < narrow.size(); ++i) {
      differ = std::max(differ, static_cast<double>(std::fabs(narrow.left[i] - narrow.right[i])));
    }
    const std::vector<float> beat = envelope(narrow.left, 96);
    const double rate = swing_rate(beat, kRate / 96.0, 100);
    double deepest = 1.0, highest = 0.0;
    for (size_t i = 250; i < beat.size(); ++i) {
      deepest = std::min(deepest, static_cast<double>(beat[i]));
      highest = std::max(highest, static_cast<double>(beat[i]));
    }
    SHOW("unison 2 centred: beat %.3f Hz (expected %.3f), envelope %.4f..%.4f, L-R %.2g\n", rate, high - low,
         deepest, highest, differ);
    EXPECT(differ == 0.0, "spread 0: left and right are identical");
    EXPECT_NEAR(rate, high - low, 0.08, "detuned voices beat at their difference frequency");
    EXPECT(deepest < 0.15 * highest, "and the beat is deep (two equal voices)");
  }
  {
    // Half spread: equal-power positions half way out.
    Stereo half = unison(3, 2, 15.0f, 0.5f, 3.0f);
    const double near = tone_level(half.left, low, kRate, at(0.5), at(2.5));
    const double far = tone_level(half.right, low, kRate, at(0.5), at(2.5));
    // The source's pan law: sqrt(0.5 * (1 -+ pan)) per side.
    SHOW("unison half spread: far/near %.4f (expected %.4f)\n", far / near, std::sqrt(0.25 / 0.75));
    EXPECT_NEAR(far / near, std::sqrt(0.25 / 0.75), 0.01,
                "spread 0.5 pans the outer voices half way (equal power)");
  }
  {
    // More voices are wider, not louder.
    for (int voices : {4, 8}) {
      Stereo stack = unison(0, voices, 20.0f, 0.0f, 4.0f);
      clean(0);
      device.note_on(1, 440.0f, 1.0f);
      Stereo one = render(device, 4.0f, kRate);
      const double change = db(rms(stack.left, at(0.5)) / rms(one.left, at(0.5)));
      SHOW("unison %d: level %.2f dB against one voice\n", voices, change);
      EXPECT(std::fabs(change) < 1.5, "unison is normalised by 1/sqrt(voices): the level stays");
    }
    Stereo supersaw = unison(0, 8, 30.0f, 1.0f, 4.0f);
    const double link = correlation(supersaw.left, supersaw.right, at(0.5));
    const double balance = db(rms(supersaw.left, at(0.5)) / rms(supersaw.right, at(0.5)));
    SHOW("unison 8 wide saw: correlation %.3f, balance %.2f dB\n", link, balance);
    // Voices at pan +-1, +-5/7, +-3/7, +-1/7 share sqrt(1 - pan^2) between the
    // sides: 0.648 on average. One voice, or no spread, would read 1.
    EXPECT_NEAR(link, 0.648, 0.03, "eight spread voices decorrelate the two sides as their positions say");
    EXPECT(std::fabs(balance) < 1.0, "and stay balanced");
    // Detune 0 is one voice in all but name.
    Stereo flat = unison(3, 8, 0.0f, 1.0f, 1.0f);
    const Track pitch = track(flat.left, at(0.3), at(0.9));
    EXPECT_NEAR(pitch.hz[pitch.hz.size() / 2], 440.0, 0.05, "detune 0: every unison voice on the note");
  }

  // Glide.
  {
    clean(3);
    device.set_param(p::kVoiceMode, 1.0f);
    device.set_param(p::kGlide, 0.4f);
    device.note_on(1, 220.0f, 1.0f);
    Stereo before = render(device, 0.5f, kRate);
    device.note_on(2, 440.0f, 1.0f);
    Stereo after = render(device, 1.0f, kRate);
    const Track settled = track(before.left, at(0.2), at(0.5));
    const Track glide = track(after.left, 0, at(1.0));
    const double quarter = hz_at(glide, 0.1), half = hz_at(glide, 0.2), three = hz_at(glide, 0.3);
    double arrived = 0.0;
    for (size_t i = 0; i < glide.hz.size(); ++i) {
      if (glide.hz[i] > 440.0 * std::pow(2.0, -0.1 / 12.0)) {
        arrived = glide.time[i];
        break;
      }
    }
    SHOW(
        "glide 0.4 s: start %.2f, quarter %.2f (261.63), half %.2f (311.13), three quarters %.2f (369.99), "
        "end %.2f; within 10 cents at %.3f s\n",
        settled.hz.back(), quarter, half, three, hz_at(glide, 0.6), arrived);
    EXPECT_NEAR(settled.hz.back(), 220.0, 0.05, "the first note does not glide in from anywhere");
    EXPECT_NEAR(quarter, 261.63, 0.6, "glide is linear in pitch: three semitones up after a quarter");
    EXPECT_NEAR(half, 311.13, 0.7, "six semitones at half time");
    EXPECT_NEAR(three, 369.99, 0.8, "nine at three quarters");
    EXPECT_NEAR(hz_at(glide, 0.6), 440.0, 0.05, "and it lands on the note");
    EXPECT_NEAR(arrived, 0.4, 0.01, "after the set glide time");
  }
  {
    // Poly: a new note glides in from the last one played.
    clean(3);
    device.set_param(p::kGlide, 0.2f);
    device.set_param(p::kAmpRelease, 0.005f);
    device.note_on(1, 220.0f, 1.0f);
    render(device, 0.2f, kRate);
    device.note_off(1);
    render(device, 0.2f, kRate);
    device.note_on(2, 880.0f, 1.0f);
    Stereo out = render(device, 0.5f, kRate);
    const Track glide = track(out.left, 0, out.size());
    SHOW("poly glide 0.2 s: %.2f Hz at half time (expected 440), %.2f at the end\n", hz_at(glide, 0.1),
         hz_at(glide, 0.4));
    EXPECT_NEAR(hz_at(glide, 0.1), 440.0, 1.5, "poly glide starts from the last note played");
    EXPECT_NEAR(hz_at(glide, 0.4), 880.0, 0.1, "and ends on the new one");
  }
  {
    // No glide: the pitch is there at once.
    clean(3);
    device.set_param(p::kVoiceMode, 1.0f);
    device.note_on(1, 220.0f, 1.0f);
    render(device, 0.3f, kRate);
    device.note_on(2, 440.0f, 1.0f);
    Stereo out = render(device, 0.2f, kRate);
    const Track jump = track(out.left, 0, out.size());
    SHOW("glide 0: second cycle after the note %.2f Hz\n", jump.hz[1]);
    EXPECT_NEAR(jump.hz[1], 440.0, 0.5, "glide 0: the new pitch at once");
  }
}
static float key(double midi) { return static_cast<float>(440.0 * std::pow(2.0, (midi - 69.0) / 12.0)); }

static bool silent(const Stereo& audio, size_t from) {
  return peak(audio.left, from) == 0.0 && peak(audio.right, from) == 0.0;
}

// Poly, mono and legato; the held-note stack; sixteen voices and what happens
// to the seventeenth note.
static void check_voices() {
  // A patch whose envelope shows a retrigger: a peak, then a low sustain.
  auto plucked = [&](int mode) {
    clean(3);
    device.set_param(p::kVoiceMode, static_cast<float>(mode));
    device.set_param(p::kAmpAttack, 0.02f);
    device.set_param(p::kAmpDecay, 0.1f);
    device.set_param(p::kAmpSustain, 0.3f);
    device.set_param(p::kAmpRelease, 0.05f);
  };
  plucked(0);
  device.note_on(1, 440.0f, 1.0f);
  Stereo reference = render(device, 0.6f, kRate);
  const double struck = peak(reference.left, 0, at(0.1));
  const double sustained = peak(reference.left, at(0.5));
  EXPECT_NEAR(sustained / struck, 0.3, 0.01, "(the plucked patch settles at its sustain level)");

  for (int mode : {1, 2}) {
    plucked(mode);
    device.note_on(1, 440.0f, 1.0f);
    render(device, 0.6f, kRate);
    device.note_on(2, 660.0f, 1.0f);
    const int sounding = device.active_voices();
    Stereo second = render(device, 0.6f, kRate);
    const double second_peak = peak(second.left, 0, at(0.2)) / struck;
    const Track pitch = track(second.left, at(0.3), at(0.5));
    // Back to the first note, still held underneath.
    device.note_off(2);
    Stereo back = render(device, 0.6f, kRate);
    const double back_peak = peak(back.left, 0, at(0.2)) / struck;
    const Track back_pitch = track(back.left, at(0.3), at(0.5));
    device.note_off(1);
    Stereo tail = render(device, 0.5f, kRate);
    SHOW("%s: second note peak %.3f of a strike, pitch %.2f; back to the held note: peak %.3f, pitch %.2f\n",
         mode == 1 ? "mono" : "legato", second_peak, pitch.hz.back(), back_peak, back_pitch.hz.back());
    EXPECT(sounding == 1, "mono and legato play one voice");
    EXPECT_NEAR(pitch.hz.back(), 660.0, 0.1, "the new note takes the voice over");
    EXPECT_NEAR(back_pitch.hz.back(), 440.0, 0.1, "releasing it falls back to the note still held");
    if (mode == 1) {
      EXPECT_NEAR(second_peak, 1.0, 0.02, "mono retriggers the envelope on every note");
      EXPECT_NEAR(back_peak, 1.0, 0.02, "and again when it falls back to a held note");
    } else {
      EXPECT_NEAR(second_peak, 0.3, 0.02, "legato does not retrigger: the level stays at the sustain");
      EXPECT_NEAR(back_peak, 0.3, 0.02, "nor when it falls back to a held note");
    }
    EXPECT(device.active_voices() == 0 && silent(tail, at(0.3)), "the last note-off lets the voice go");
  }

  // Legato does strike a note played after everything was released.
  {
    plucked(2);
    device.note_on(1, 440.0f, 1.0f);
    render(device, 0.3f, kRate);
    device.note_off(1);
    render(device, 0.3f, kRate);
    device.note_on(2, 660.0f, 1.0f);
    Stereo out = render(device, 0.3f, kRate);
    EXPECT_NEAR(peak(out.left, 0, at(0.2)) / struck, 1.0, 0.02, "legato strikes a note that follows a gap");
  }

  // The stack: three held notes, released out of order.
  {
    plucked(2);
    device.note_on(1, 220.0f, 1.0f);
    device.note_on(2, 330.0f, 1.0f);
    device.note_on(3, 440.0f, 1.0f);
    render(device, 0.2f, kRate);
    device.note_off(2);  // not the sounding note: nothing changes
    Stereo top = render(device, 0.2f, kRate);
    device.note_off(3);  // 330 is gone, so the voice falls back to 220
    Stereo bottom = render(device, 0.2f, kRate);
    const Track a = track(top.left, at(0.05), at(0.2));
    const Track b = track(bottom.left, at(0.05), at(0.2));
    SHOW("held stack: %.2f Hz, then %.2f Hz\n", a.hz.back(), b.hz.back());
    EXPECT_NEAR(a.hz.back(), 440.0, 0.1, "releasing a note underneath leaves the sounding note alone");
    EXPECT_NEAR(b.hz.back(), 220.0, 0.1, "and it is skipped when the voice falls back");
    EXPECT(device.active_voices() == 1, "still one voice");
    device.note_off(1);
    render(device, 0.4f, kRate);
    EXPECT(device.active_voices() == 0, "no voice left when the stack is empty");
  }

  // Poly: one voice per key, the same key twice lets the first go.
  {
    plucked(0);
    device.note_on(1, key(60), 1.0f);
    device.note_on(2, key(64), 1.0f);
    device.note_on(3, key(67), 1.0f);
    Stereo chord = render(device, 0.4f, kRate);
    EXPECT(device.active_voices() == 3, "poly: three keys, three voices");
    bool all = true;
    for (double midi : {60.0, 64.0, 67.0}) {
      if (tone_level(chord.left, key(midi), kRate, at(0.2)) < 0.25 * sustained) all = false;
    }
    EXPECT(all, "all three pitches sound");
    device.note_on(2, key(64), 1.0f);
    render(device, 0.4f, kRate);
    EXPECT(device.active_voices() == 3, "a key struck again while held does not pile voices up");
    device.note_off(2);
    Stereo two = render(device, 0.4f, kRate);
    EXPECT(device.active_voices() == 2, "a note-off releases its own voice only");
    EXPECT(tone_level(two.left, key(64), kRate, at(0.2)) < 0.001 * sustained &&
               tone_level(two.left, key(60), kRate, at(0.2)) > 0.25 * sustained,
           "the other keys keep sounding");
  }

  // The original's voice tests.
  {
    device.init(kRate);
    device.set_param(p::kAmpRelease, 0.1f);
    for (int n = 0; n < 16; ++n) device.note_on(n, key(48 + n), 0.8f);
    render(device, 0.1f, kRate);
    EXPECT(device.active_voices() == 16, "sixteen notes use sixteen voices");
    device.note_on(80, key(80), 0.8f);
    render(device, 0.05f, kRate);
    EXPECT(device.active_voices() == 16, "a seventeenth steals one");
    for (int n = 0; n < 16; ++n) device.note_off(n);
    device.note_off(80);
    Stereo tail = render(device, 1.0f, kRate);
    EXPECT(device.active_voices() == 0, "and no voice is left after the release");
    EXPECT(silent(tail, at(0.5)), "with exact silence behind it");
  }
  {
    device.init(kRate);
    device.set_param(p::kAmpRelease, 0.05f);
    for (int i = 0; i < 40; ++i) {
      device.note_on(60 + (i % 3), key(60 + (i % 3)), 0.8f);
      device.process(192);
      device.note_off(60 + (i % 3));
      device.process(288);
    }
    render(device, 0.6f, kRate);
    EXPECT(device.active_voices() == 0, "repeated short notes never leave a voice hanging");
    device.set_param(p::kVoiceMode, 2.0f);
    device.note_on(60, key(60), 0.8f);
    render(device, 0.1f, kRate);
    device.note_on(64, key(64), 0.8f);
    render(device, 0.1f, kRate);
    device.note_off(60);
    render(device, 0.1f, kRate);
    device.note_off(64);
    render(device, 0.2f, kRate);
    EXPECT(device.active_voices() == 0, "nor do overlapping legato notes");
  }
  for (int mode : {1, 2}) {
    device.init(kRate);
    device.set_param(p::kAmpRelease, 0.05f);
    int id = 0;
    for (double midi : {60.0, 64.0, 67.0, 71.0}) device.note_on(++id, key(midi), 0.8f);
    render(device, 0.2f, kRate);
    const int chord = device.active_voices();
    device.set_param(p::kVoiceMode, static_cast<float>(mode));
    device.note_on(9, key(48), 0.8f);
    render(device, 0.1f, kRate);
    for (int n = 1; n <= 4; ++n) device.note_off(n);
    render(device, 0.1f, kRate);
    device.note_off(9);
    Stereo tail = render(device, 0.3f, kRate);
    EXPECT(chord == 4 && device.active_voices() == 0 && silent(tail, at(0.2)),
           "a poly chord held across a switch to mono or legato is still released");
  }

  // Stealing: the quietest voice goes, and without a click. Sixteen quiet
  // sines, one quieter than the rest, then a loud seventeenth; the largest
  // sample-to-sample step around the steal is no bigger than the steady
  // signal's own.
  {
    double worst = 0.0;
    bool quietest = true;
    for (int trial = 0; trial < 8; ++trial) {
      clean(3);
      device.set_param(p::kVelToAmp, 1.0f);
      device.set_param(p::kAmpSustain, 1.0f);
      for (int n = 0; n < 16; ++n) device.note_on(n, key(48 + n), n == 5 ? 0.3f : 0.4f);
      Stereo before = render(device, 0.5f + 0.0013f * static_cast<float>(trial), kRate);
      device.note_on(99, key(45), 1.0f);
      Stereo after = render(device, 0.6f, kRate);
      const double steady = std::max(max_step(before.left, at(0.2)), max_step(after.left, at(0.1)));
      const double steal = max_step(concat(before, after).left, before.size() - 64, before.size() + at(0.05));
      worst = std::max(worst, steal / steady);
      const double victim =
          tone_level(after.left, key(53), kRate, at(0.1)) / tone_level(before.left, key(53), kRate, at(0.2));
      const double other =
          tone_level(after.left, key(54), kRate, at(0.1)) / tone_level(before.left, key(54), kRate, at(0.2));
      if (victim > 0.02 || std::fabs(other - 1.0) > 0.02 || device.active_voices() != 16) quietest = false;
      SHOW("steal %d: step %.5f against steady %.5f; victim left at %.4f, neighbour at %.4f\n", trial, steal,
           steady, victim, other);
    }
    EXPECT(quietest, "the seventeenth note steals the quietest voice and no other");
    EXPECT(worst < 1.1, "stealing a sounding voice does not click");
  }
  // The same for a mono retrigger at a different velocity.
  {
    double worst = 0.0;
    for (int trial = 0; trial < 8; ++trial) {
      clean(3);
      device.set_param(p::kVoiceMode, 1.0f);
      device.set_param(p::kVelToAmp, 1.0f);
      device.set_param(p::kAmpSustain, 1.0f);
      device.note_on(1, key(45), 0.2f);
      Stereo before = render(device, 0.3f + 0.0011f * static_cast<float>(trial), kRate);
      device.note_on(2, key(47), 1.0f);
      Stereo after = render(device, 0.3f, kRate);
      const double steady = max_step(after.left, at(0.1));
      const double jump = max_step(concat(before, after).left, before.size() - 64, before.size() + at(0.05));
      SHOW("mono retrigger %d: step %.5f against steady %.5f\n", trial, jump, steady);
      worst = std::max(worst, jump / steady);
    }
    EXPECT(worst < 1.1, "a mono retrigger at another velocity does not click");
  }
}
// Phase delay in samples of a sine at `hz` against one that starts at 0.
static double sine_delay(const std::vector<float>& x, double hz, size_t from, size_t to) {
  double re = 0.0, im = 0.0;
  for (size_t i = from; i < to; ++i) {
    const double angle = 2.0 * kPi * hz * static_cast<double>(i) / kRate;
    re += x[i] * std::cos(angle);
    im -= x[i] * std::sin(angle);
  }
  double phase = std::atan2(-re, -im);
  if (phase < 0.0) phase += 2.0 * kPi;
  return phase * kRate / (2.0 * kPi * hz);
}

// A phrase with notes, parameter moves, a silence long enough to fall asleep
// in and a note after it, rendered in blocks of the given sizes (cycled). The
// events sit on fixed sample positions, wherever the block edges fall.
static Stereo phrase(const std::vector<int>& blocks) {
  struct Event {
    size_t at;
    int kind;  // 0 note on, 1 note off, 2 parameter
    int id;
    float a, b;
  };
  const Event events[] = {
      {0, 0, 1, 220.0f, 0.8f},
      {1000, 0, 2, 277.18f, 0.6f},
      {5003, 2, p::kCutoff, 3000.0f, 0.0f},
      {9111, 0, 3, 330.0f, 1.0f},
      {9111, 2, p::kOsc1Pw, 0.2f, 0.0f},
      {14001, 1, 1, 0.0f, 0.0f},
      {17777, 2, p::kUnisonDetune, 30.0f, 0.0f},
      {20000, 2, p::kVolume, -12.0f, 0.0f},
      {24007, 1, 2, 0.0f, 0.0f},
      {24007, 1, 3, 0.0f, 0.0f},
      // The voices end near 28000 and the sleep starts 2400 samples later,
      // at the next block edge: asleep for some block sizes here, awake for
      // others.
      {30500, 2, p::kLfo2Rate, 3.3f, 0.0f},
      {31000, 2, p::kGlide, 0.2f, 0.0f},
      // Asleep for all of them.
      {44000, 2, p::kLfo1Rate, 7.0f, 0.0f},
      {44000, 2, p::kCutoff, 1500.0f, 0.0f},
      // Changes that arrive together with the note that ends the sleep.
      {48777, 2, p::kOsc1Shape, 0.0f, 0.0f},
      {48777, 2, p::kLfo1Shape, 1.0f, 0.0f},
      {48777, 2, p::kUnisonSpread, 0.2f, 0.0f},
      {48777, 2, p::kSubLevel, 0.6f, 0.0f},
      {48777, 0, 4, 440.0f, 0.9f},
      {52001, 2, p::kResonance, 0.7f, 0.0f},
      {60001, 1, 4, 0.0f, 0.0f},
  };
  device.init(kRate);
  device.set_param(p::kOsc1Shape, 1.0f);
  device.set_param(p::kOscMix, 0.5f);
  device.set_param(p::kOsc2Fine, 9.0f);
  device.set_param(p::kSubLevel, 0.3f);
  device.set_param(p::kNoiseLevel, 0.05f);
  device.set_param(p::kCutoff, 1200.0f);
  device.set_param(p::kResonance, 0.4f);
  device.set_param(p::kFilterEnvAmount, 0.3f);
  device.set_param(p::kUnisonVoices, 3.0f);
  device.set_param(p::kUnisonDetune, 12.0f);
  device.set_param(p::kUnisonSpread, 0.7f);
  device.set_param(p::kLfo1Dest, 1.0f);
  device.set_param(p::kLfo1Rate, 3.0f);
  device.set_param(p::kLfo1Amount, 0.3f);
  device.set_param(p::kLfo2Rate, 5.5f);
  device.set_param(p::kLfo2Amount, 0.02f);
  device.set_param(p::kGlide, 0.05f);
  device.set_param(p::kAmpRelease, 0.05f);
  const size_t total = 72000;
  Stereo out;
  out.left.reserve(total);
  out.right.reserve(total);
  size_t done = 0, next = 0, turn = 0;
  const size_t count = sizeof events / sizeof events[0];
  while (done < total) {
    while (next < count && events[next].at == done) {
      const Event& e = events[next++];
      if (e.kind == 0) device.note_on(e.id, e.a, e.b);
      if (e.kind == 1) device.note_off(e.id);
      if (e.kind == 2) device.set_param(e.id, e.a);
    }
    size_t frames = static_cast<size_t>(blocks[turn++ % blocks.size()]);
    frames = std::min(frames, total - done);
    if (next < count) frames = std::min(frames, events[next].at - done);
    device.process(static_cast<int>(frames));
    out.left.insert(out.left.end(), device.out_left(), device.out_left() + frames);
    out.right.insert(out.right.end(), device.out_right(), device.out_right() + frames);
    done += frames;
  }
  return out;
}

// Aliasing, latency, block-size independence, levels, clicks, sample rates.
static void check_quality() {
  // The original's alias test: a saw at 1006 Hz, nothing between 10 and
  // 22 kHz that is not a harmonic, below -60 dBFS. There the fundamental sat
  // at -22 dBFS and the worst alias measured -90 dBFS: 68 dB under it. Here
  // everything is taken against the fundamental.
  {
    clean(0);
    device.note_on(1, 1006.0f, 1.0f);
    Stereo out = render(device, 1.3f, kRate);
    const double f0 = cycle_frequency(out.left, at(0.5), out.size());
    const double fundamental = db(tone_level(out.left, f0, kRate, at(0.5)));
    const double alias = worst_alias_db(out.left, f0, 10000.0, 22000.0) - fundamental;
    const double low = worst_alias_db(out.left, f0, 300.0, 10000.0) - fundamental;
    SHOW(
        "saw 1006 Hz: f0 %.2f Hz, worst alias %.1f dB under the fundamental at 10..22 kHz, %.1f dB below 10 "
        "kHz\n",
        f0, alias, low);
    EXPECT_NEAR(f0, 1006.0, 1.0, "the alias test's saw sits on 1006 Hz");
    EXPECT(alias - 22.0 < -60.0,
           "a 1 kHz saw keeps aliasing below -60 dBFS above 10 kHz (the original's threshold)");
    EXPECT(alias < -64.0, "and within a few dB of the -68 dB the original measured");
    EXPECT(low < -75.0, "below 10 kHz it is further down still");
  }
  // High notes, every shape with edges, across the audible band.
  for (int shape : {0, 1, 2}) {
    for (double hz : {2093.0, 4186.0}) {
      clean(shape);
      device.set_param(p::kOsc1Pw, 0.3f);
      device.note_on(1, static_cast<float>(hz), 1.0f);
      Stereo out = render(device, 1.3f, kRate);
      const double fundamental = db(tone_level(out.left, hz, kRate, at(0.5)));
      const double alias = worst_alias_db(out.left, hz, 300.0, 20000.0) - fundamental;
      SHOW("shape %d at %.0f Hz: worst alias below 20 kHz %.1f dB under the fundamental\n", shape, hz, alias);
      EXPECT(alias < -55.0, "high notes stay clean: nothing inharmonic within 55 dB of the fundamental");
    }
  }
  {
    // At the base rate harmonic 12 of a C8 saw (50.2 kHz) would fold to
    // 2232 Hz, in the middle of the band. At twice the rate it lands above
    // the half-band's cutoff and is removed.
    clean(0);
    device.note_on(1, 4186.0f, 1.0f);
    Stereo out = render(device, 1.3f, kRate);
    const double folded = db(tone_level(out.left, 12.0 * 4186.0 - 48000.0, kRate, at(0.5)) /
                             tone_level(out.left, 4186.0, kRate, at(0.5)));
    SHOW("saw 4186 Hz: the fold of harmonic 12 at 2232 Hz is %.1f dB under the fundamental\n", folded);
    EXPECT(folded < -70.0, "a C8 saw's twelfth harmonic does not fold back to 2.2 kHz");
  }

  // Latency. A 1500 Hz sine is delayed by the decimator and by the filter;
  // the 24 dB slope has the filter twice, so 2 * d12 - d24 is the decimator
  // alone. The oscillator's first 2x sample is already one step into its
  // cycle (half a sample early), hence 15.5 for a latency of 16.
  {
    double delay[2];
    for (int slope = 0; slope < 2; ++slope) {
      clean(3);
      device.set_param(p::kFilterSlope, static_cast<float>(slope));
      device.note_on(1, 1500.0f, 1.0f);
      Stereo out = render(device, 0.2f, kRate);
      delay[slope] = sine_delay(out.left, 1500.0, 480, 3680);
    }
    SHOW("delay: 12 dB %.4f, 24 dB %.4f, decimator alone %.4f samples\n", delay[0], delay[1],
         2.0 * delay[0] - delay[1]);
    EXPECT_NEAR(2.0 * delay[0] - delay[1], 15.5, 0.02, "the reported latency of 16 samples is the real one");
  }

  // Block-size independence: the same phrase in 128-frame blocks, in ragged
  // blocks and one frame at a time.
  {
    Stereo reference = phrase({128});
    Stereo ragged = phrase({1, 7, 64, 128, 33, 512, 2048, 5});
    Stereo large = phrase({2048});
    Stereo single = phrase({1});
    double before = 0.0, after = 0.0;
    for (const Stereo* other : {&ragged, &large, &single}) {
      for (size_t i = 0; i < reference.size(); ++i) {
        const double d = std::max(std::fabs(static_cast<double>(reference.left[i]) - other->left[i]),
                                  std::fabs(static_cast<double>(reference.right[i]) - other->right[i]));
        if (i < 40000) {
          before = std::max(before, d);
        } else {
          after = std::max(after, d);
        }
      }
    }
    SHOW("block sizes: largest difference %.3g before the sleep, %.3g after it (peak %.3f, last note %.3f)\n",
         before, after, peak(reference.left), peak(reference.left, 49000));
    EXPECT(peak(reference.left, 2000, 24000) > 0.05 && peak(reference.left, 49000, 60000) > 0.05,
           "(the phrase sounds, before and after the silence)");
    EXPECT(peak(reference.left, 40000, 48000) == 0.0, "(and the instrument sleeps in between)");
    EXPECT(before == 0.0, "the block size does not change a single sample");
    // The sleep starts at a block edge, so at a different time for each
    // block size. The clock that runs through it makes that invisible.
    EXPECT(after == 0.0, "nor does it after the instrument has slept");
  }

  // Levels.
  {
    device.init(kRate);
    device.note_on(1, key(60), 0.7f);
    Stereo one = render(device, 1.0f, kRate);
    const double level = db(std::max(peak(one.left), peak(one.right)));
    device.init(kRate);
    for (int n = 0; n < 10; ++n) device.note_on(n, key(48 + 3 * n), 0.7f);
    Stereo ten = render(device, 1.0f, kRate);
    const double stacked = std::max(peak(ten.left), peak(ten.right));
    device.init(kRate);
    device.note_on(1, key(60), 1.0f);
    Stereo loud = render(device, 0.7f, kRate);
    device.note_off(1);
    loud = concat(loud, render(device, 0.3f, kRate));
    SHOW("levels: one note at 0.7 peaks %.1f dBFS, ten notes %.3f, full-scale note %.3f\n", level, stacked,
         peak(loud.left));
    EXPECT(level > -24.0 && level < -10.0, "one default note at gain 0.7 peaks between -24 and -10 dBFS");
    EXPECT(stacked < 0.9, "ten held notes stay under the clip knee region");
    EXPECT(peak(loud.left) <= 1.0 && peak(loud.right) <= 1.0 && peak(loud.left) > 0.05,
           "the default patch at full velocity neither clips nor whispers (the original's bounds)");
  }
  {
    // The master ends in the kit's soft clip: linear to 0.5, then a knee that
    // lands on 1. A resonant peak drives one sine to a known level.
    auto driven = [&](float resonance, double* top, double* third) {
      clean(3);
      device.set_param(p::kCutoff, 1000.0f);
      device.set_param(p::kResonance, resonance);
      device.note_on(1, 1000.0f, 1.0f);
      Stereo out = render(device, 0.6f, kRate);
      *top = peak(out.left, at(0.3));
      *third = tone_level(out.left, 3000.0, kRate, at(0.3)) / tone_level(out.left, 1000.0, kRate, at(0.3));
    };
    clean(3);
    device.note_on(1, 1000.0f, 1.0f);
    const double plain = peak(render(device, 0.6f, kRate).left, at(0.3));
    double top, third;
    // k = 2 - 1.9 * resonance and the peak gain is 1 / k.
    const double under = plain / (2.0 - 1.9 * 0.84);
    driven(0.84f, &top, &third);
    SHOW("master: plain %.4f; resonance 0.84 peaks %.4f (linear %.4f), third harmonic %.5f\n", plain, top,
         under, third);
    EXPECT_NEAR(top, under, 0.01, "under the knee the master is linear");
    EXPECT(under < 0.5 && third < 0.002, "and adds no harmonics");
    const double over = plain / (2.0 - 1.9 * 0.96);
    const double clipped = 0.5 + 0.5 * std::tanh((over - 0.5) * 2.0);
    driven(0.96f, &top, &third);
    SHOW("master: resonance 0.96 would peak %.4f, peaks %.4f (soft clip says %.4f), third harmonic %.4f\n",
         over, top, clipped, third);
    EXPECT(over > 0.9, "(the resonant sine is driven well past the knee)");
    EXPECT_NEAR(top, clipped, 0.02, "past the knee the soft clip rounds the peak off");
    EXPECT(third > 0.01, "which shows as a third harmonic");
  }

  // Moving a control while a note sounds does not click.
  {
    struct Move {
      int id;
      float from, to;
      const char* label;
    };
    const Move moves[] = {
        {p::kVolume, 0.0f, -40.0f, "a Volume jump does not click"},
        {p::kVolume, -40.0f, 0.0f, "nor does the jump back up"},
        {p::kCutoff, 20000.0f, 150.0f, "a Cutoff jump does not click"},
        {p::kSubLevel, 0.0f, 1.0f, "a Sub jump does not click"},
        {p::kOscMix, 0.0f, 1.0f, "an oscillator Mix jump does not click"},
        {p::kFilterDrive, 0.0f, 1.0f, "a Drive jump does not click"},
    };
    for (const Move& move : moves) {
      double worst = 0.0;
      for (int trial = 0; trial < 6; ++trial) {
        clean(3);
        device.set_param(p::kOsc2Shape, 3.0f);
        device.set_param(p::kOsc2Coarse, 7.0f);
        device.set_param(move.id, move.from);
        device.note_on(1, 220.0f, 1.0f);
        Stereo before = render(device, 0.3f + 0.0007f * static_cast<float>(trial), kRate);
        device.set_param(move.id, move.to);
        Stereo after = render(device, 0.3f, kRate);
        const double steady = std::max(max_step(before.left, at(0.1)), max_step(after.left, at(0.1)));
        const double jump =
            max_step(concat(before, after).left, before.size() - 32, before.size() + at(0.05));
        worst = std::max(worst, jump / steady);
      }
      SHOW("%s: worst step %.3f of the steady signal's\n", move.label, worst);
      EXPECT(worst < 1.25, move.label);
    }
  }

  // Other sample rates: the same pitch, the same times.
  for (float rate : {44100.0f, 96000.0f}) {
    device.init(rate);
    device.set_param(p::kOsc1Shape, 3.0f);
    device.set_param(p::kVelToAmp, 0.0f);
    device.set_param(p::kAmpAttack, 0.2f);
    device.set_param(p::kAmpSustain, 1.0f);
    device.set_param(p::kLfo1Dest, 2.0f);
    device.set_param(p::kLfo1Shape, 3.0f);
    device.set_param(p::kLfo1Rate, 4.0f);
    device.set_param(p::kLfo1Amount, 0.5f);
    device.note_on(1, 440.0f, 1.0f);
    Stereo out = render(device, 3.0f, rate);
    const double hz = cycle_frequency(out.left, static_cast<size_t>(rate), out.size(), rate);
    const int window = static_cast<int>(rate / 500.0f);
    const std::vector<float> env = envelope(out.left, window);
    const double tremolo = swing_rate(env, rate / window, 250);
    SHOW("%.0f Hz: A4 at %.3f Hz, tremolo %.3f Hz\n", rate, hz, tremolo);
    EXPECT_NEAR(hz, 440.0, 0.2, "A4 is 440 Hz at 44.1 and 96 kHz too");
    EXPECT_NEAR(tremolo, 4.0, 0.05, "and the LFO keeps its rate");
  }
}
// The manifest: the source's parameter ids, its factory presets, and the pads
// added here, which have to behave like pads.
static void check_presets() {
  std::vector<std::string> keys;
  const std::vector<Preset> presets = load_presets(&keys);
  auto key_at = [&](int id) {
    return id < static_cast<int>(keys.size()) ? keys[static_cast<size_t>(id)] : "";
  };
  EXPECT(static_cast<int>(keys.size()) == p::kNumParams && p::kNumParams == 43,
         "the manifest has the source's parameters less the four tempo-sync ones");
  EXPECT(key_at(p::kOsc1Shape) == "osc1Shape" && key_at(p::kCutoff) == "cutoff" &&
             key_at(p::kFilterEnvAmount) == "filterEnvAmount" && key_at(p::kLfo2Dest) == "lfo2Dest" &&
             key_at(p::kUnisonVoices) == "unisonVoices" && key_at(p::kVolume) == "volume",
         "under the documented ids, in the source's order");
  bool synced = false;
  for (const std::string& name : keys) {
    if (name.find("Sync") != std::string::npos && name != "osc2Sync") synced = true;
    if (name.find("Division") != std::string::npos) synced = true;
  }
  EXPECT(!synced, "no tempo-sync parameter survives (the ABI has no tempo)");

  auto find = [&](const char* name) -> const Preset* {
    for (const Preset& preset : presets) {
      if (preset.name == name) return &preset;
    }
    return nullptr;
  };
  bool factory = true;
  for (const char* name : {"Warm Bass", "Super Saw", "Glass Pluck", "Sync Lead", "Hollow Pad", "Acid Line",
                           "Sub Sine", "Wobble", "Noise Sweep", "Bell", "Brass"}) {
    if (!find(name)) factory = false;
  }
  EXPECT(presets.size() >= 8 && find("Warm Bass") != nullptr, "at least eight presets, Warm Bass among them");
  EXPECT(factory, "every factory preset of the source is in the manifest");
  if (const Preset* bass = find("Warm Bass")) {
    EXPECT(bass->get(p::kCutoff) == 420.0f && bass->get(p::kOsc2Coarse) == -12.0f &&
               bass->get(p::kVoiceMode) == 1.0f && bass->get(p::kGlide) == 0.03f,
           "with the source's values (Warm Bass: 420 Hz, an octave down, mono, 30 ms glide)");
  }
  if (const Preset* wobble = find("Wobble")) {
    EXPECT_NEAR(wobble->get(p::kLfo1Rate), 4.0, 1.0e-3, "Wobble's synced 1/8 note became 4 Hz (120 BPM)");
  }

  bool known = true, in_range = true, bounded = true, sounding = true;
  for (const Preset& preset : presets) {
    for (const auto& value : preset.values) {
      if (value.first < 0) {
        known = false;
      } else if (value.second < p::kParamMin[value.first] || value.second > p::kParamMax[value.first]) {
        in_range = false;
      }
    }
    // The original's bound: a full-scale chord never exceeds 0 dBFS.
    load(preset);
    int id = 0;
    for (double midi : {48.0, 55.0, 60.0, 64.0}) device.note_on(++id, key(midi), 1.0f);
    Stereo out = render(device, 1.0f, kRate);
    const double top = std::max(peak(out.left), peak(out.right));
    SHOW("preset %-13s full-scale chord peaks %.3f\n", preset.name.c_str(), top);
    if (!finite(out.left) || !finite(out.right) || top > 1.0) bounded = false;
    if (top < 0.02) sounding = false;
  }
  EXPECT(known, "every preset value names a parameter");
  EXPECT(in_range, "and lies inside its range");
  EXPECT(bounded, "no preset exceeds 0 dBFS on a full-scale chord (the original's bound)");
  EXPECT(sounding, "and every preset sounds");

  // The pads. First what they are made of, then what comes out when a
  // six-note chord is held for ten seconds and let go.
  const char* pads[] = {"Warm pad", "Slow strings", "Glass pad", "Dark drone", "Airy pad"};
  EXPECT(!presets.empty() && presets[0].name == pads[0], "the first preset is a pad");
  for (const char* name : pads) {
    const Preset* pad = find(name);
    char label[160];
    std::snprintf(label, sizeof label, "%s is in the manifest", name);
    EXPECT(pad != nullptr, label);
    if (!pad) continue;
    const bool filter_moves = (pad->get(p::kLfo1Dest) == 1.0f && pad->get(p::kLfo1Amount) != 0.0f) ||
                              (pad->get(p::kLfo2Dest) == 1.0f && pad->get(p::kLfo2Amount) != 0.0f);
    const bool detuned =
        pad->get(p::kOscMix) > 0.0f && (pad->get(p::kOsc2Fine) != 0.0f || pad->get(p::kOsc2Coarse) != 0.0f);
    std::snprintf(label, sizeof label,
                  "%s: slow attack and release, detuned oscillators, unison, an LFO on the filter", name);
    EXPECT(pad->get(p::kAmpAttack) >= 0.5f && pad->get(p::kAmpRelease) >= 1.5f && detuned &&
               pad->get(p::kUnisonVoices) >= 2.0f && pad->get(p::kUnisonDetune) > 0.0f && filter_moves,
           label);

    load(*pad);
    device.note_on(1, key(60), 0.7f);
    Stereo one = render(device, 6.0f, kRate);
    const double note_db = db(std::max(peak(one.left), peak(one.right)));

    load(*pad);
    int id = 0;
    for (double midi : {48.0, 55.0, 63.0, 67.0, 70.0, 74.0}) device.note_on(++id, key(midi), 0.7f);
    Stereo held = render(device, 10.0f, kRate);
    for (int n = 1; n <= 6; ++n) device.note_off(n);
    // The release time is the time to -60 dB; the voice is freed at -100 dB.
    const float release = pad->get(p::kAmpRelease);
    Stereo tail = render(device, release * (100.0f / 60.0f) + 0.5f, kRate);

    const double top = std::max(peak(held.left), peak(held.right));
    const double body = rms(held.left, at(4.0), at(10.0));
    const double onset = rms(held.left, 0, at(0.1));
    const double width = correlation(held.left, held.right, at(2.0));
    // Brightness: the share of the energy above 800 Hz and above 3 kHz,
    // second by second; whichever band the filter's LFO reaches.
    double movement = 0.0, quiet = 1.0e9, loud = 0.0;
    for (double split : {800.0, 3000.0}) {
      double dull = 1.0, bright = 0.0;
      for (int second = 2; second < 10; ++second) {
        const double share = energy_above(held.left, split, kRate, at(second), at(second + 1));
        dull = std::min(dull, share);
        bright = std::max(bright, share);
      }
      movement = std::max(movement, bright / dull);
    }
    for (int second = 2; second < 10; ++second) {
      const double level =
          rms(held.left, at(second), at(second + 1)) + rms(held.right, at(second), at(second + 1));
      quiet = std::min(quiet, level);
      loud = std::max(loud, level);
    }
    const double lingering = rms(tail.left, at(0.9), at(1.1)) / rms(held.left, at(9.8), at(10.0));
    SHOW(
        "pad %-12s note %.1f dBFS, chord peak %.3f, onset %.3f of the body, L/R correlation %.2f, brightness "
        "moves by a factor %.2f, level swing %.1f dB, %.3f left 1 s after release\n",
        name, note_db, top, onset / body, width, movement, db(loud / quiet), lingering);
    std::snprintf(label, sizeof label, "%s: one note at gain 0.7 peaks between -24 and -10 dBFS", name);
    EXPECT(note_db > -24.0 && note_db < -10.0, label);
    std::snprintf(label, sizeof label, "%s: a six-note chord stays under the clip knee", name);
    EXPECT(top < 0.5, label);
    std::snprintf(label, sizeof label, "%s: fades in (the first 0.1 s is under a third of the held level)",
                  name);
    EXPECT(onset < 0.33 * body, label);
    std::snprintf(label, sizeof label, "%s: is wide (left and right clearly differ)", name);
    EXPECT(width < 0.85, label);
    std::snprintf(label, sizeof label, "%s: the brightness moves while the chord is held", name);
    EXPECT(movement > 1.2, label);
    std::snprintf(label, sizeof label,
                  "%s: holds its level for ten seconds (no dropouts, no swell past 6 dB)", name);
    EXPECT(db(loud / quiet) < 6.0, label);
    std::snprintf(label, sizeof label, "%s: lingers after the release", name);
    EXPECT(lingering > 0.1, label);
    std::snprintf(label, sizeof label, "%s: and is silent once the release has run out", name);
    EXPECT(device.active_voices() == 0 && silent(tail, tail.size() - at(0.2)), label);
  }
}
