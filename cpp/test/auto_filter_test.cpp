// Native harness for Auto Filter (cpp/devices/auto-filter). The conformance
// pass covers stability, silence when idle, block-size independence and
// parameter abuse; the rest asserts what makes it a swept resonant filter,
// including the quality bars of the kkfonie tests it was ported with
// (Tests/Effects/FilterTests.cpp).

#include <complex>

#include "../devices/auto-filter/auto_filter.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::AutoFilter;
using tatami::dsp::SvfMode;
using tatami::dsp::SvfTptTone;
namespace p = livemix::auto_filter;

static AutoFilter device;

static const float kRate = 48000.0f;
static const int kLatency = AutoFilter::kLatency;

enum Type : int { kLowpass = 0, kHighpass, kBandpass, kNotch, kPeak };
enum Slope : int { k12 = 0, k24 };

static void setup(int type, int slope, float cutoff, float q, float rate = kRate) {
  device.init(rate);
  device.set_param(p::kType, static_cast<float>(type));
  device.set_param(p::kSlope, static_cast<float>(slope));
  device.set_param(p::kCutoffHz, cutoff);
  device.set_param(p::kResonance, q);
}

static void fft(std::vector<std::complex<double>>& a) {
  const size_t n = a.size();
  for (size_t i = 1, j = 0; i < n; ++i) {
    size_t bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) std::swap(a[i], a[j]);
  }
  for (size_t length = 2; length <= n; length <<= 1) {
    const double angle = -2.0 * kPi / static_cast<double>(length);
    const std::complex<double> step(std::cos(angle), std::sin(angle));
    for (size_t i = 0; i < n; i += length) {
      std::complex<double> w(1.0, 0.0);
      for (size_t k = 0; k < length / 2; ++k) {
        const std::complex<double> u = a[i + k];
        const std::complex<double> v = a[i + k + length / 2] * w;
        a[i + k] = u + v;
        a[i + k + length / 2] = u - v;
        w *= step;
      }
    }
  }
}

static const size_t kIrSize = 65536;
static const double kBin = kRate / static_cast<double>(kIrSize);

// Magnitude response in dB of the device as set up, from its impulse response.
static std::vector<double> response_db() {
  std::vector<float> click(kIrSize, 0.0f);
  click[0] = 1.0f;
  Stereo ir = run(device, click);
  std::vector<std::complex<double>> a(kIrSize);
  for (size_t i = 0; i < kIrSize; ++i) a[i] = ir.left[i];
  fft(a);
  std::vector<double> out(kIrSize / 2);
  for (size_t i = 0; i < out.size(); ++i) out[i] = db(std::abs(a[i]));
  return out;
}

static double at(const std::vector<double>& response, double hz) {
  return response[std::min(response.size() - 1, static_cast<size_t>(std::llround(hz / kBin)))];
}

// Where the response crosses -3.01 dB, scanning up (low-pass) or down
// (high-pass). The downward scan starts at 20 kHz: above that the halfband
// that brings the filter back to the sample rate has its own corner.
static double minus_3db_point(const std::vector<double>& response, bool lowpass) {
  const int n = static_cast<int>(std::llround(20000.0 / kBin));
  if (lowpass) {
    for (int i = 1; i < n; ++i) {
      if (response[i] < -3.0103) {
        const double t = (-3.0103 - response[i - 1]) / (response[i] - response[i - 1]);
        return (i - 1 + t) * kBin;
      }
    }
  } else {
    for (int i = n - 2; i > 0; --i) {
      if (response[i] < -3.0103) {
        const double t = (-3.0103 - response[i + 1]) / (response[i] - response[i + 1]);
        return (i + 1 - t) * kBin;
      }
    }
  }
  return -1.0;
}

// What the filter should do at `hz`: the analog prototype at the prewarped
// frequency, once for 12 dB and twice at √Q for 24 dB.
static double model_db(int type, int slope, double hz, double cutoff, double q) {
  const SvfMode mode = tatami::dsp::svfModeFromIndex(type);
  if (slope == k12) return db(SvfTptTone::magnitude(mode, hz, cutoff, q, 2.0 * kRate));
  return 2.0 * db(SvfTptTone::magnitude(mode, hz, cutoff, std::sqrt(q), 2.0 * kRate));
}

// RMS in consecutive windows from `from`: the level of a probe tone over time.
static std::vector<double> envelope(const std::vector<float>& x, size_t from, size_t window) {
  std::vector<double> out;
  for (size_t start = from; start + window <= x.size(); start += window) {
    out.push_back(rms(x, start, start + window));
  }
  return out;
}

// Rate of a periodic envelope, from its upward crossings of its own mean.
static double modulation_rate(const std::vector<double>& env, double windows_per_second) {
  double centre = 0.0;
  for (double v : env) centre += v;
  centre /= static_cast<double>(env.size());
  int first = -1, last = -1, crossings = 0;
  for (size_t i = 1; i < env.size(); ++i) {
    if (env[i - 1] < centre && env[i] >= centre) {
      if (first < 0) first = static_cast<int>(i);
      last = static_cast<int>(i);
      ++crossings;
    }
  }
  if (crossings < 2) return 0.0;
  return (crossings - 1) * windows_per_second / static_cast<double>(last - first);
}

static double thd_percent(const std::vector<float>& x, double hz, size_t from, size_t to) {
  const double fundamental = tone_level(x, hz, kRate, from, to);
  double harmonics = 0.0;
  for (int h = 2; h <= 10; ++h) {
    const double level = tone_level(x, hz * h, kRate, from, to);
    harmonics += level * level;
  }
  return fundamental > 0.0 ? 100.0 * std::sqrt(harmonics) / fundamental : 0.0;
}

static std::vector<float> add(std::vector<float> a, const std::vector<float>& b, size_t at_sample = 0) {
  for (size_t i = 0; i < b.size() && at_sample + i < a.size(); ++i) a[at_sample + i] += b[i];
  return a;
}

int main() {
  Conformance spec;
  spec.name = "auto-filter";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  // At defaults the filter rings for a millisecond; the rest is the idle hold.
  spec.tail_seconds = 0.5f;
  // Resonance is gain: Q at the cutoff, 2Q in Peak, and 4Q (100 at Q 25) in
  // Peak at 24 dB with a tone sitting exactly there. Checked below.
  spec.max_peak = 110.0f;
  check_effect(device, spec, kRate);

  // Cutoff (kkfonie: "-3 dB point lands within 2 % of the cutoff for LP12 and
  // HP12 across the range").
  {
    for (double cutoff : {100.0, 1000.0, 8000.0}) {
      char label[112];
      setup(kLowpass, k12, static_cast<float>(cutoff), 0.7071f);
      const double low = minus_3db_point(response_db(), true);
      setup(kHighpass, k12, static_cast<float>(cutoff), 0.7071f);
      const double high = minus_3db_point(response_db(), false);
      std::snprintf(label, sizeof label, "cutoff %.0f Hz: -3 dB at %.1f Hz (low-pass) and %.1f Hz (high-pass)",
                    cutoff, low, high);
      EXPECT(std::fabs(low / cutoff - 1.0) < 0.02 && std::fabs(high / cutoff - 1.0) < 0.02, label);
    }
  }

  // Every Type at both Slopes follows the model across the band: pass band,
  // corner, and stop band two octaves out (12 dB/oct gives -24 dB there,
  // 24 dB/oct gives -48 dB).
  {
    const double cutoff = 1000.0, q = 2.0;
    double worst = 0.0;
    for (int type = kLowpass; type <= kPeak; ++type) {
      for (int slope = k12; slope <= k24; ++slope) {
        setup(type, slope, static_cast<float>(cutoff), static_cast<float>(q));
        const std::vector<double> response = response_db();
        for (double hz : {125.0, 250.0, 500.0, 800.0, 1000.0, 1250.0, 2000.0, 4000.0, 8000.0}) {
          if (type == kNotch && hz == 1000.0) continue;  // a null: measured with a tone below
          const double exact = std::llround(hz / kBin) * kBin;  // the bin's own frequency
          worst = std::max(worst, std::fabs(at(response, hz) - model_db(type, slope, exact, cutoff, q)));
        }
      }
    }
    char label[96];
    std::snprintf(label, sizeof label, "all five types at both slopes match the model (off by %.2f dB)", worst);
    EXPECT(worst < 0.5, label);

    // kkfonie: "slopes: 12 dB/oct and 24 dB/oct within 1 dB".
    setup(kLowpass, k12, 1000.0f, 0.7071f);
    const std::vector<double> lp12 = response_db();
    setup(kLowpass, k24, 1000.0f, 0.7071f);
    const std::vector<double> lp24 = response_db();
    setup(kHighpass, k24, 1000.0f, 0.7071f);
    const std::vector<double> hp24 = response_db();
    EXPECT_NEAR(at(lp12, 4000.0) - at(lp12, 8000.0), 12.0, 1.0, "low-pass 12 dB: 12 dB per octave");
    EXPECT_NEAR(at(lp24, 4000.0) - at(lp24, 8000.0), 24.0, 1.0, "low-pass 24 dB: 24 dB per octave");
    EXPECT_NEAR(at(hp24, 250.0) - at(hp24, 125.0), 24.0, 1.0, "high-pass 24 dB: 24 dB per octave");
    EXPECT_NEAR(at(lp24, 1000.0), -3.01, 0.5, "low-pass 24 dB is -3 dB at the cutoff too");
    EXPECT_NEAR(at(lp12, 4000.0), -24.1, 0.5, "low-pass 12 dB: -24 dB two octaves up");
    EXPECT_NEAR(at(lp24, 4000.0), -48.2, 1.0, "low-pass 24 dB: -48 dB two octaves up");

    // The notch is a null: a tone on the cutoff all but disappears.
    setup(kNotch, k12, 1000.0f, 2.0f);
    Stereo nulled = run(device, sine(1000.0f, 1.0f, kRate, 0.5f));
    EXPECT(db(rms(nulled.left, 24000, 48000) / (0.5 / std::sqrt(2.0))) < -60.0, "Notch removes a tone at the cutoff");
  }

  // Resonance (kkfonie: "resonance peak follows the Q model within 1 dB"):
  // the gain at the cutoff is Q for the low-pass at either slope, 0 dB for
  // the band-pass, and 2Q for Peak.
  {
    for (float q : {2.0f, 4.0f, 10.0f}) {
      char label[128];
      const double expected = db(q);
      setup(kLowpass, k12, 1000.0f, q);
      const double lp12 = at(response_db(), 1000.0);
      setup(kLowpass, k24, 1000.0f, q);
      const double lp24 = at(response_db(), 1000.0);
      setup(kBandpass, k12, 1000.0f, q);
      const double bp12 = at(response_db(), 1000.0);
      setup(kPeak, k12, 1000.0f, q);
      const double peak12 = at(response_db(), 1000.0);
      std::snprintf(label, sizeof label, "Q %.0f: low-pass %.2f and %.2f dB (model %.2f), band-pass %.2f dB, peak %.2f dB",
                    q, lp12, lp24, expected, bp12, peak12);
      EXPECT(std::fabs(lp12 - expected) < 1.0 && std::fabs(lp24 - expected) < 1.0 && std::fabs(bp12) < 1.0 &&
                 std::fabs(peak12 - expected - 6.02) < 1.0,
             label);
    }
    setup(kLowpass, k12, 1000.0f, 4.0f);
    const std::vector<double> response = response_db();
    double worst = 0.0;
    for (double hz : {200.0, 700.0, 1000.0, 1500.0, 4000.0, 12000.0}) {
      const double exact = std::llround(hz / kBin) * kBin;
      worst = std::max(worst, std::fabs(at(response, hz) - model_db(kLowpass, k12, exact, 1000.0, 4.0)));
    }
    EXPECT(worst < 0.5, "the resonant low-pass follows the model from 200 Hz to 12 kHz");

    // The loudest the device gets: Peak at 24 dB and Q 25 is 4Q = 100 for a
    // full-scale tone on the cutoff. Loud by design; Drive is what tames it.
    setup(kPeak, k24, 1000.0f, 25.0f);
    Stereo loud = run(device, sine(1000.0f, 1.0f, kRate, 1.0f));
    EXPECT_NEAR(db(peak(loud.left, 24000)), db(100.0), 0.5, "Peak at 24 dB and Q 25: 4Q at the cutoff");
    EXPECT(peak(loud.left) < spec.max_peak, "the loudest setting stays under the ceiling");
  }

  // The LFO (kkfonie: "LFO rate is within 1 %"): a tone on the corner of a
  // low-pass swept three octaves either way rises and falls at the LFO rate.
  {
    for (float rate : {0.5f, 2.0f, 8.0f}) {
      setup(kLowpass, k12, 1000.0f, 0.7071f);
      device.set_param(p::kLfoAmount, 100.0f);
      device.set_param(p::kLfoRateHz, rate);
      const float seconds = rate < 1.0f ? 31.0f : 11.0f;
      const size_t window = rate > 4.0f ? 120 : 480;
      Stereo out = run(device, sine(1000.0f, seconds, kRate, 0.5f));
      const double measured = modulation_rate(envelope(out.left, 48000, window), kRate / static_cast<double>(window));
      char label[96];
      std::snprintf(label, sizeof label, "LFO Rate %.1f Hz sweeps the cutoff at %.3f Hz", rate, measured);
      EXPECT(std::fabs(measured / rate - 1.0) < 0.01, label);
    }

    // Depth: 100 % is three octaves each way. A 4 kHz probe through a 1 kHz
    // low-pass goes from an octave under the cutoff (8 kHz) to five octaves
    // over it (125 Hz); at a third of the amount, from 1 to 3 octaves over.
    auto swing_db = [](float amount) {
      setup(kLowpass, k12, 1000.0f, 0.7071f);
      device.set_param(p::kLfoAmount, amount);
      device.set_param(p::kLfoRateHz, 0.5f);
      Stereo out = run(device, sine(4000.0f, 5.0f, kRate, 0.5f));
      const std::vector<double> env = envelope(out.left, 48000, 480);
      return db(*std::max_element(env.begin(), env.end()) / *std::min_element(env.begin(), env.end()));
    };
    const double full = swing_db(100.0f);
    const double third = swing_db(100.0f / 3.0f);
    const double full_model = model_db(kLowpass, k12, 4000.0, 8000.0, 0.7071) - model_db(kLowpass, k12, 4000.0, 125.0, 0.7071);
    const double third_model = model_db(kLowpass, k12, 4000.0, 2000.0, 0.7071) - model_db(kLowpass, k12, 4000.0, 500.0, 0.7071);
    char label[128];
    std::snprintf(label, sizeof label, "LFO Amount 100 %% swings a 4 kHz probe by %.1f dB (model %.1f), 33 %% by %.1f dB (model %.1f)",
                  full, full_model, third, third_model);
    EXPECT(std::fabs(full - full_model) < 2.0 && std::fabs(third - third_model) < 1.0, label);
  }

  // LFO shapes (kkfonie: "LFO shapes span -1..1"), and Sample & Hold in the
  // audio: the cutoff sits still for a cycle, then jumps somewhere else.
  {
    bool spans = true;
    for (int shape = AutoFilter::kSine; shape < AutoFilter::kSampleHold; ++shape) {
      float lo = 1.0f, hi = -1.0f;
      for (int i = 0; i < 256; ++i) {
        const float v = AutoFilter::lfo_value(shape, static_cast<float>(i) / 256.0f, 0.0f);
        lo = std::min(lo, v);
        hi = std::max(hi, v);
      }
      if (std::fabs(lo + 1.0f) > 0.02f || std::fabs(hi - 1.0f) > 0.02f) spans = false;
    }
    EXPECT(spans, "sine, triangle, both saws and square span -1..1");
    EXPECT(AutoFilter::lfo_value(AutoFilter::kSawUp, 0.75f, 0.0f) > AutoFilter::lfo_value(AutoFilter::kSawUp, 0.25f, 0.0f) &&
               AutoFilter::lfo_value(AutoFilter::kSawDown, 0.75f, 0.0f) < AutoFilter::lfo_value(AutoFilter::kSawDown, 0.25f, 0.0f),
           "Saw Up rises and Saw Down falls");
    EXPECT_NEAR(AutoFilter::lfo_value(AutoFilter::kSampleHold, 0.3f, 0.42f), 0.42, 1.0e-6, "S&H returns the held value");

    setup(kLowpass, k12, 1000.0f, 0.7071f);
    device.set_param(p::kLfoAmount, 100.0f);
    device.set_param(p::kLfoRateHz, 5.0f);
    device.set_param(p::kLfoShape, static_cast<float>(AutoFilter::kSampleHold));
    Stereo out = run(device, sine(3000.0f, 3.0f, kRate, 0.5f));
    // 200 ms per step; compare two windows inside each step.
    bool held = true;
    std::vector<double> levels;
    for (int step = 1; step < 14; ++step) {
      const size_t start = static_cast<size_t>(step) * 9600 + kLatency;
      const double early = db(rms(out.left, start + 2400, start + 4800));
      const double late = db(rms(out.left, start + 6000, start + 8400));
      if (std::fabs(early - late) > 0.2) held = false;
      levels.push_back(early);
    }
    int jumps = 0;
    for (size_t i = 1; i < levels.size(); ++i) {
      if (std::fabs(levels[i] - levels[i - 1]) > 1.0) ++jumps;
    }
    EXPECT(held, "S&H holds the cutoff still within a step");
    EXPECT(jumps >= 8, "S&H jumps to a new cutoff on most steps");
  }

  // The envelope follower (kkfonie: "opens the cutoff with the input level").
  {
    auto level_db = [](float amount) {
      setup(kLowpass, k12, 200.0f, 0.7071f);
      device.set_param(p::kEnvAmount, amount);
      device.set_param(p::kEnvAttackMs, 5.0f);
      device.set_param(p::kEnvReleaseMs, 100.0f);
      Stereo out = run(device, sine(2000.0f, 1.0f, kRate, 0.9f));
      return db(rms(out.left, 12000, 36000));
    };
    EXPECT(level_db(100.0f) > level_db(0.0f) + 20.0, "Env Amount opens a closed filter on a loud tone");

    // The louder the input, the further it opens: 5 octaves per unit of
    // level at 100 %. With a slow release the follower sits at 80 to 100 %
    // of the tone's peak, which brackets the gain a 2 kHz tone gets.
    double previous = -200.0;
    bool rises = true, bracketed = true;
    for (float amplitude : {0.05f, 0.2f, 0.4f, 0.8f}) {
      setup(kLowpass, k12, 200.0f, 0.7071f);
      device.set_param(p::kEnvAmount, 100.0f);
      device.set_param(p::kEnvAttackMs, 1.0f);
      device.set_param(p::kEnvReleaseMs, 2000.0f);
      Stereo out = run(device, sine(2000.0f, 1.0f, kRate, amplitude));
      const double gain = db(rms(out.left, 24000, 48000) / (amplitude / std::sqrt(2.0)));
      const double low = model_db(kLowpass, k12, 2000.0, 200.0 * std::pow(2.0, 5.0 * 0.8 * amplitude), 0.7071);
      const double high = model_db(kLowpass, k12, 2000.0, 200.0 * std::pow(2.0, 5.0 * amplitude), 0.7071);
      if (gain < previous + 3.0) rises = false;
      if (gain < low - 0.5 || gain > high + 0.5) bracketed = false;
      previous = gain;
    }
    EXPECT(rises, "a louder input opens the filter further");
    EXPECT(bracketed, "the cutoff rises by 5 octaves per unit of input level");

    // A negative amount closes it instead.
    auto ducked_gain = [](float amplitude) {
      setup(kLowpass, k12, 4000.0f, 0.7071f);
      device.set_param(p::kEnvAmount, -100.0f);
      Stereo out = run(device, sine(2000.0f, 1.0f, kRate, amplitude));
      return db(rms(out.left, 24000, 48000) / (amplitude / std::sqrt(2.0)));
    };
    EXPECT(ducked_gain(0.8f) < ducked_gain(0.02f) - 20.0, "a negative Env Amount closes the filter on loud input");

    // Attack and release: a quiet 2 kHz probe rides through a loud 60 Hz
    // burst (0.2 s to 0.5 s). Its level shortly after the burst starts shows
    // how fast the filter opened; shortly after it ends, how fast it closed.
    auto probe_db = [](float attack_ms, float release_ms, float from_seconds, float to_seconds) {
      setup(kLowpass, k12, 200.0f, 0.7071f);
      device.set_param(p::kEnvAmount, 100.0f);
      device.set_param(p::kEnvAttackMs, attack_ms);
      device.set_param(p::kEnvReleaseMs, release_ms);
      std::vector<float> input = add(sine(2000.0f, 1.0f, kRate, 0.01f), sine(60.0f, 0.3f, kRate, 0.9f), 9600);
      Stereo out = run(device, input);
      return db(tone_level(out.left, 2000.0, kRate, static_cast<size_t>(from_seconds * kRate),
                           static_cast<size_t>(to_seconds * kRate)) /
                0.01);
    };
    const double fast_attack = probe_db(1.0f, 200.0f, 0.22f, 0.26f);
    const double slow_attack = probe_db(300.0f, 200.0f, 0.22f, 0.26f);
    const double fast_release = probe_db(5.0f, 50.0f, 0.65f, 0.75f);
    const double slow_release = probe_db(5.0f, 1000.0f, 0.65f, 0.75f);
    char label[128];
    std::snprintf(label, sizeof label, "Env Attack: probe at %.1f dB after 20 ms with 1 ms, %.1f dB with 300 ms",
                  fast_attack, slow_attack);
    EXPECT(fast_attack > slow_attack + 20.0, label);
    std::snprintf(label, sizeof label, "Env Release: probe at %.1f dB 150 ms after the burst with 50 ms, %.1f dB with 1 s",
                  fast_release, slow_release);
    EXPECT(slow_release > fast_release + 20.0, label);
  }

  // Drive. With none the filter is linear; driven, the states saturate, which
  // adds odd harmonics, holds the level (half the push is given back) and
  // caps the resonance (kkfonie: "drive at maximum resonance stays bounded").
  {
    setup(kLowpass, k12, 1000.0f, 0.7071f);
    Stereo clean = run(device, sine(200.0f, 1.0f, kRate, 0.25f));
    EXPECT(thd_percent(clean.left, 200.0, 24000, 48000) < 0.01, "no Drive: the filter is linear");

    double previous = 0.0;
    bool rises = true, level_held = true, quiet_law = true;
    for (float drive : {6.0f, 12.0f, 18.0f, 24.0f}) {
      setup(kLowpass, k12, 1000.0f, 0.7071f);
      device.set_param(p::kDriveDb, drive);
      Stereo out = run(device, sine(200.0f, 1.0f, kRate, 0.25f));
      const double thd = thd_percent(out.left, 200.0, 24000, 48000);
      const double gain = db(rms(out.left, 24000, 48000) / (0.25 / std::sqrt(2.0)));
      setup(kLowpass, k12, 1000.0f, 0.7071f);
      device.set_param(p::kDriveDb, drive);
      Stereo quiet = run(device, sine(200.0f, 1.0f, kRate, 0.001f));
      const double quiet_gain = db(rms(quiet.left, 24000, 48000) / (0.001 / std::sqrt(2.0)));
      std::printf("auto-filter drive %+.0f dB: THD %.1f %%, a -12 dBFS tone moves %+.1f dB, a -60 dBFS tone %+.1f dB\n",
                  drive, thd, gain, quiet_gain);
      if (thd < previous) rises = false;
      if (gain < -5.0 || gain > 1.0) level_held = false;
      if (std::fabs(quiet_gain - 0.5 * drive) > 0.5) quiet_law = false;
      previous = thd;
    }
    EXPECT(rises && previous > 5.0, "Drive adds harmonics, more as it rises");
    EXPECT(level_held, "Drive leaves a -12 dBFS tone within -5..+1 dB of where it was");
    EXPECT(quiet_law, "below the saturation Drive is half its dB in level (the other half is given back)");

    setup(kLowpass, k12, 1000.0f, 0.7071f);
    device.set_param(p::kDriveDb, 18.0f);
    Stereo driven = run(device, sine(200.0f, 1.0f, kRate, 0.25f));
    EXPECT(tone_level(driven.left, 600.0, kRate, 24000, 48000) > 30.0 * tone_level(driven.left, 400.0, kRate, 24000, 48000),
           "the saturation is symmetric: odd harmonics");

    setup(kLowpass, k24, 800.0f, 25.0f);
    device.set_param(p::kDriveDb, 24.0f);
    Stereo screaming = run(device, sine(800.0f, 2.0f, kRate, 1.0f));
    std::printf("auto-filter Q 25, Drive +24 dB, full-scale tone on the cutoff: peak %.2f\n", peak(screaming.left));
    EXPECT(finite(screaming.left) && peak(screaming.left) < 4.0 && peak(screaming.left) > 0.01,
           "Drive caps the resonance: Q 25 at +24 dB stays under 4");
    setup(kLowpass, k24, 800.0f, 25.0f);
    Stereo undriven = run(device, sine(800.0f, 2.0f, kRate, 1.0f));
    EXPECT(peak(undriven.left) > 5.0 * peak(screaming.left), "without Drive the same tone rings several times louder");
  }

  // Latency (kkfonie: "latency is exact and the dry path is aligned to it").
  {
    setup(kLowpass, k12, 20000.0f, 0.7071f);
    device.set_param(p::kMix, 0.0f);
    Stereo dry = run(device, impulse(0.05f, kRate, 1.0f));
    size_t first = 0;
    while (first < dry.left.size() && std::fabs(dry.left[first]) <= 0.5f) ++first;
    EXPECT(first == static_cast<size_t>(kLatency), "the dry impulse lands on the reported latency");
    EXPECT_NEAR(dry.left[kLatency], 1.0, 1.0e-6, "Mix 0 passes the input through untouched");

    // Wet: a 20 Hz high-pass leaves a click where the oversampler puts it.
    setup(kHighpass, k12, 20.0f, 0.7071f);
    Stereo wet = run(device, impulse(0.05f, kRate, 1.0f));
    size_t best = 0;
    for (size_t i = 0; i < wet.left.size(); ++i) {
      if (std::fabs(wet.left[i]) > std::fabs(wet.left[best])) best = i;
    }
    EXPECT(best == static_cast<size_t>(kLatency), "the wet impulse lands on the same sample");

    // kkfonie: "wide-open low-pass passes a 1 kHz tone at unity within 0.1 dB".
    setup(kLowpass, k12, 20000.0f, 0.7071f);
    Stereo open = run(device, sine(1000.0f, 0.5f, kRate, 0.25f));
    EXPECT_NEAR(db(rms(open.left, 12000, 24000)), db(0.25 / std::sqrt(2.0)), 0.1, "wide open, 1 kHz passes at unity");

    // At Mix 0.5 dry and wet add up to the input instead of combing: a 5 kHz
    // tone through the 20 Hz high-pass, where the filter itself adds no
    // phase. One sample of misalignment would cost a third of the amplitude.
    setup(kHighpass, k12, 20.0f, 0.7071f);
    device.set_param(p::kMix, 0.5f);
    std::vector<float> tone = sine(5000.0f, 0.2f, kRate, 0.25f);
    Stereo half = run(device, tone);
    double error = 0.0;
    for (size_t i = 2048; i < tone.size(); ++i) {
      error = std::max(error, std::fabs(static_cast<double>(half.left[i]) - tone[i - kLatency]));
    }
    char label[96];
    std::snprintf(label, sizeof label, "Mix 0.5: dry and wet are aligned (error %.2g of 0.25)", error);
    EXPECT(error < 0.25 * 0.01, label);
  }

  // Nothing clicks. A 200 Hz tone through a resonant low-pass; every change
  // is made at a crest, where an unsmoothed Type or Slope switch would jump
  // by most of the tone's amplitude.
  {
    const size_t segment = 60 + 240 * 40;  // a quarter period past 40 cycles
    std::vector<float> tone = sine(200.0f, 12.0f, kRate, 0.25f);
    size_t position = 0;
    std::vector<float> all;
    double steady = 0.0;
    auto play = [&]() {
      std::vector<float> chunk(tone.begin() + position, tone.begin() + position + segment);
      position += segment;
      const std::vector<float> out = run(device, chunk).left;
      steady = std::max(steady, max_step(out, segment - 2400));
      all.insert(all.end(), out.begin(), out.end());
    };
    setup(kLowpass, k12, 300.0f, 4.0f);
    play();
    // The cutoff jumps are made at low resonance: a resonant filter swept
    // five octaves in 5 ms chirps, which is its sound and not a click.
    const float moves[][2] = {
        {p::kType, kHighpass},   {p::kType, kBandpass},  {p::kType, kNotch},       {p::kType, kPeak},
        {p::kType, kLowpass},    {p::kSlope, k24},       {p::kResonance, 0.7f},    {p::kCutoffHz, 60.0f},
        {p::kCutoffHz, 3000.0f}, {p::kSlope, k12},       {p::kCutoffHz, 300.0f},   {p::kResonance, 20.0f},
        {p::kResonance, 4.0f},   {p::kDriveDb, 18.0f},   {p::kMix, 0.3f},          {p::kDriveDb, 0.0f},
        {p::kMix, 1.0f},
    };
    for (const auto& move : moves) {
      device.set_param(static_cast<int>(move[0]), move[1]);
      play();
    }
    char label[128];
    std::snprintf(label, sizeof label, "type, slope, cutoff, resonance, drive and mix changes do not click (step %.4f, tone %.4f)",
                  max_step(all), steady);
    EXPECT(max_step(all) < 1.3 * steady, label);
  }

  // Sleeping is not audible. One device is left to fall asleep between a
  // loud burst and a probe; the other is kept awake by an inaudible input.
  // The slow envelope and the LFO have to arrive at the same place.
  {
    auto render_probe = [](bool keep_awake) {
      setup(kLowpass, k12, 300.0f, 2.0f);
      device.set_param(p::kEnvAmount, 60.0f);
      device.set_param(p::kEnvReleaseMs, 2000.0f);
      device.set_param(p::kLfoAmount, 40.0f);
      device.set_param(p::kLfoRateHz, 0.7f);
      run(device, sine(150.0f, 0.3f, kRate, 0.9f));
      std::vector<float> gap(static_cast<size_t>(1.3f * kRate), keep_awake ? 1.0e-12f : 0.0f);
      Stereo rest = run(device, gap);
      Stereo probe = run(device, sine(1500.0f, 0.5f, kRate, 0.05f));
      probe.right = rest.left;  // carry the gap out for the caller
      return probe;
    };
    Stereo slept = render_probe(false);
    Stereo awake = render_probe(true);
    EXPECT(peak(slept.right, slept.right.size() - 4800) == 0.0, "the device fell asleep in the gap");
    double worst = 0.0;
    for (size_t i = 0; i < slept.left.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(slept.left[i]) - awake.left[i]));
    }
    char label[112];
    std::snprintf(label, sizeof label, "after a sleep the envelope and LFO are where they would have been (diff %.2g)",
                  worst);
    EXPECT(rms(awake.left) > 1.0e-3 && worst < 1.0e-4, label);
  }

  // After the tail the device does no work, and parameters set while it
  // slept are in force from the first sample of the next note.
  {
    device.init(kRate);
    run(device, noise(0.2f, kRate, 0.5f));
    render(device, 0.5f, kRate);
    Stereo rest = render(device, 0.5f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail");
    device.set_param(p::kType, kHighpass);
    device.set_param(p::kCutoffHz, 8000.0f);
    Stereo woken = run(device, sine(200.0f, 0.25f, kRate, 0.5f));
    EXPECT(peak(woken.left) < 0.01, "a Type and Cutoff set while asleep apply at once (200 Hz stays out)");
    device.set_param(p::kType, kLowpass);
    Stereo passed = run(device, sine(200.0f, 0.25f, kRate, 0.5f));
    EXPECT(rms(passed.left, 6000, 12000) > 0.3, "wakes on new input");
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("auto-filter", 10.0f, kRate, [&] { run(device, input); });
  // The most the device does: 24 dB, driven, with the LFO and envelope moving.
  setup(kLowpass, k24, 800.0f, 4.0f);
  device.set_param(p::kDriveDb, 12.0f);
  device.set_param(p::kLfoAmount, 70.0f);
  device.set_param(p::kEnvAmount, 50.0f);
  report_cost("auto-filter (24 dB, driven, swept)", 10.0f, kRate, [&] { run(device, input); });

  return finish("auto-filter");
}
