// Native harness for the true-peak limiter device: the parameter contract the
// TypeScript table relies on, the brickwall guarantee (no sample and no
// oversampled peak above the ceiling for sines, hot squares, impulses and a
// quarter-rate sine the samples miss), exact latency, unity below the
// ceiling, attack/release shape, and stability. Compiled with the system C++
// compiler by scripts/test-native.sh.

#include <algorithm>
#include <cmath>
#include <cstdio>
#include <functional>
#include <vector>

#include "../devices/true-peak-limiter/true_peak_limiter_device.h"

namespace {

int g_failures = 0;

#define EXPECT(condition, message)                                    \
  do {                                                                \
    if (!(condition)) {                                               \
      std::printf("FAIL: %s (%s:%d)\n", message, __FILE__, __LINE__); \
      ++g_failures;                                                   \
    }                                                                 \
  } while (0)

using livemix::TruePeakLimiter;
using livemix::TruePeakLimiterDevice;
using livemix::TruePeakLimiterParam;

constexpr float kSampleRate = 48000.0f;
constexpr int kBlock = 128;
constexpr float kTwoPi = 6.28318530717958647692f;
constexpr float kDefaultCeiling = 0.891250938f;  // -1 dBTP

TruePeakLimiterDevice g_test_device;

float db_to_gain(float db) { return std::pow(10.0f, db / 20.0f); }
float gain_to_db(float gain) { return 20.0f * std::log10(gain); }

struct Stereo {
  float left;
  float right;
};

// Signal generators take the sample index.
using Generator = std::function<Stereo(int)>;

Generator sine(float frequency, float gain, float phase = 0.0f) {
  return [=](int n) {
    const float v = gain * std::sin(kTwoPi * frequency * n / kSampleRate + phase);
    return Stereo{v, v};
  };
}

Generator square(float frequency, float gain) {
  return [=](int n) {
    const float v = std::sin(kTwoPi * frequency * n / kSampleRate) >= 0.0f ? gain : -gain;
    return Stereo{v, v};
  };
}

Generator silence() {
  return [](int) { return Stereo{0.0f, 0.0f}; };
}

// Impulses of alternating sign every 480 samples (100 Hz), the right channel offset.
Generator impulses(float gain) {
  return [=](int n) {
    const float l = n % 480 == 0 ? ((n / 480) % 2 == 0 ? gain : -gain) : 0.0f;
    const float r = (n + 240) % 480 == 0 ? gain : 0.0f;
    return Stereo{l, r};
  };
}

// Deterministic white noise (xorshift), the same on every run.
Generator noise(float gain) {
  return [=](int n) {
    unsigned int s = static_cast<unsigned int>(n) * 2654435761u + 12345u;
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    const float l = gain * (static_cast<float>(s & 0xFFFFFF) / 8388608.0f - 1.0f);
    s = s * 1664525u + 1013904223u;
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    const float r = gain * (static_cast<float>(s & 0xFFFFFF) / 8388608.0f - 1.0f);
    return Stereo{l, r};
  };
}

struct Rendered {
  std::vector<float> in_left, in_right, out_left, out_right, envelope;

  float peak(int skip = 0) const {
    float peak = 0.0f;
    for (size_t i = static_cast<size_t>(skip); i < out_left.size(); ++i) {
      peak = std::max(peak, std::max(std::fabs(out_left[i]), std::fabs(out_right[i])));
    }
    return peak;
  }

  bool finite() const {
    for (size_t i = 0; i < out_left.size(); ++i) {
      if (!std::isfinite(out_left[i]) || !std::isfinite(out_right[i])) return false;
    }
    return true;
  }
};

// Feeds `seconds` of `generate` (sample indices continue from `start`) through
// the device in 128-frame blocks, appending to `out`.
void render(TruePeakLimiterDevice& device, Rendered& out, float seconds, const Generator& generate,
            int start = 0) {
  const int total = static_cast<int>(seconds * kSampleRate);
  int rendered = 0;
  while (rendered < total) {
    const int frames = std::min(kBlock, total - rendered);
    for (int i = 0; i < frames; ++i) {
      const Stereo s = generate(start + rendered + i);
      device.in_left()[i] = s.left;
      device.in_right()[i] = s.right;
      out.in_left.push_back(s.left);
      out.in_right.push_back(s.right);
    }
    device.process(frames);
    for (int i = 0; i < frames; ++i) {
      out.out_left.push_back(device.out_left()[i]);
      out.out_right.push_back(device.out_right()[i]);
    }
    out.envelope.push_back(device.limiter().envelope());
    rendered += frames;
  }
}

Rendered render_fresh(float seconds, const Generator& generate) {
  TruePeakLimiterDevice& device = g_test_device;
  device.init(kSampleRate);
  Rendered out;
  render(device, out, seconds, generate);
  return out;
}

// Independent true-peak reference: 16x oversampling with a 32-tap
// Blackman-windowed sinc, unrelated to the limiter's own BS.1770 FIR.
float reference_true_peak(const std::vector<float>& x, int skip = 0) {
  constexpr int kOversample = 16;
  constexpr int kHalf = 16;
  static std::vector<std::vector<double>> kernel;
  if (kernel.empty()) {
    kernel.assign(kOversample, std::vector<double>(2 * kHalf, 0.0));
    for (int f = 0; f < kOversample; ++f) {
      double sum = 0.0;
      for (int i = -kHalf; i < kHalf; ++i) {
        const double u = static_cast<double>(f) / kOversample - i;
        const double sinc = u == 0.0 ? 1.0 : std::sin(M_PI * u) / (M_PI * u);
        const double w = 0.42 + 0.5 * std::cos(M_PI * u / kHalf) + 0.08 * std::cos(2 * M_PI * u / kHalf);
        kernel[f][i + kHalf] = sinc * w;
        sum += sinc * w;
      }
      for (double& k : kernel[f]) k /= sum;
    }
  }
  double peak = 0.0;
  const int n = static_cast<int>(x.size());
  for (int k = std::max(skip, kHalf); k < n - kHalf; ++k) {
    for (int f = 0; f < kOversample; ++f) {
      double y = 0.0;
      for (int i = -kHalf; i < kHalf; ++i) y += kernel[f][i + kHalf] * x[k + i];
      peak = std::max(peak, std::fabs(y));
    }
  }
  return static_cast<float>(peak);
}

// The meter's own measure: BS.1770-4 Annex 2 four-phase FIR (the same table
// src/core/analysis/loudness.ts uses), applied independently of the limiter.
float bs1770_true_peak(const std::vector<float>& x, int skip = 0) {
  static const float phases[4][12] = {
      {0.001708984375f, 0.010986328125f, -0.0196533203125f, 0.033203125f, -0.0594482421875f,
       0.1373291015625f, 0.97216796875f, -0.102294921875f, 0.047607421875f, -0.026611328125f,
       0.014892578125f, -0.00830078125f},
      {-0.0291748046875f, 0.029296875f, -0.0517578125f, 0.089111328125f, -0.16650390625f,
       0.465087890625f, 0.77978515625f, -0.2003173828125f, 0.1015625f, -0.0582275390625f,
       0.0330810546875f, -0.0189208984375f},
      {-0.0189208984375f, 0.0330810546875f, -0.0582275390625f, 0.1015625f, -0.2003173828125f,
       0.77978515625f, 0.465087890625f, -0.16650390625f, 0.089111328125f, -0.0517578125f,
       0.029296875f, -0.0291748046875f},
      {-0.00830078125f, 0.014892578125f, -0.026611328125f, 0.047607421875f, -0.102294921875f,
       0.97216796875f, 0.1373291015625f, -0.0594482421875f, 0.033203125f, -0.0196533203125f,
       0.010986328125f, 0.001708984375f},
  };
  float peak = 0.0f;
  const int n = static_cast<int>(x.size());
  for (int k = std::max(skip, 11); k < n; ++k) {
    peak = std::max(peak, std::fabs(x[k]));
    for (const float* h : phases) {
      float y = 0.0f;
      for (int i = 0; i < 12; ++i) y += h[i] * x[k - i];
      peak = std::max(peak, std::fabs(y));
    }
  }
  return peak;
}

void test_param_table_matches_typescript() {
  TruePeakLimiterDevice& device = g_test_device;
  device.init(kSampleRate);
  EXPECT(device.param_value(TruePeakLimiterParam::kCeilingDb) == -1.0f, "ceiling defaults to -1 dBTP");
  EXPECT(device.param_value(TruePeakLimiterParam::kReleaseMs) == 100.0f, "release defaults to 100 ms");
  EXPECT(device.param_value(TruePeakLimiterParam::kInputGainDb) == 0.0f, "input gain defaults to 0 dB");

  device.set_param(TruePeakLimiterParam::kCeilingDb, 5.0f);
  EXPECT(device.param_value(TruePeakLimiterParam::kCeilingDb) == 0.0f, "ceiling clamps to 0 dBTP");
  device.set_param(TruePeakLimiterParam::kCeilingDb, -50.0f);
  EXPECT(device.param_value(TruePeakLimiterParam::kCeilingDb) == -20.0f, "ceiling clamps to -20 dBTP");
  device.set_param(TruePeakLimiterParam::kReleaseMs, 1.0f);
  EXPECT(device.param_value(TruePeakLimiterParam::kReleaseMs) == 10.0f, "release clamps to 10 ms");
  device.set_param(TruePeakLimiterParam::kReleaseMs, 9999.0f);
  EXPECT(device.param_value(TruePeakLimiterParam::kReleaseMs) == 2000.0f, "release clamps to 2 s");
  device.set_param(TruePeakLimiterParam::kInputGainDb, 100.0f);
  EXPECT(device.param_value(TruePeakLimiterParam::kInputGainDb) == 24.0f, "input gain clamps to +24 dB");
  device.set_param(TruePeakLimiterParam::kInputGainDb, -100.0f);
  EXPECT(device.param_value(TruePeakLimiterParam::kInputGainDb) == -24.0f, "input gain clamps to -24 dB");
  device.set_param(TruePeakLimiterParam::kCeilingDb, std::nanf(""));
  EXPECT(device.param_value(TruePeakLimiterParam::kCeilingDb) == -1.0f, "NaN restores the default");
}

void test_latency_is_exact_and_reported() {
  TruePeakLimiterDevice& device = g_test_device;
  device.init(kSampleRate);
  const int latency = device.limiter().latencyFrames();
  EXPECT(latency == 77, "1.5 ms lookahead at 48 kHz plus the interpolator: 77 samples");
  EXPECT(std::fabs(device.limiter().latencySeconds() - 77.0f / kSampleRate) < 1.0e-9f,
         "latencySeconds is latencyFrames / sample rate");

  Rendered out;
  render(device, out, 0.05f, [](int n) {
    const float v = n == 100 ? 0.5f : 0.0f;
    return Stereo{v, -v};
  });
  int first_nonzero = -1;
  for (size_t i = 0; i < out.out_left.size(); ++i) {
    if (out.out_left[i] != 0.0f) {
      first_nonzero = static_cast<int>(i);
      break;
    }
  }
  EXPECT(first_nonzero == 100 + latency, "an impulse comes out exactly latencyFrames later");
  EXPECT(out.out_left[100 + latency] == 0.5f && out.out_right[100 + latency] == -0.5f,
         "a quiet impulse passes bit-exact");
  EXPECT(out.peak() == 0.5f, "nothing else leaks around the impulse");
}

void test_unity_below_ceiling() {
  Rendered out = render_fresh(1.0f, sine(440.0f, db_to_gain(-6.0f)));
  const int latency = g_test_device.limiter().latencyFrames();
  float worst = 0.0f;
  for (size_t i = 4800 + latency; i < out.out_left.size(); ++i) {
    worst = std::max(worst, std::fabs(out.out_left[i] - out.in_left[i - latency]));
    worst = std::max(worst, std::fabs(out.out_right[i] - out.in_right[i - latency]));
  }
  EXPECT(worst < 1.0e-6f, "a -6 dBFS sine passes as a pure delay");
  EXPECT(g_test_device.limiter().envelope() == 1.0f, "no gain reduction below the ceiling");
}

// The guarantee: no sample over the ceiling and no BS.1770 true peak over it
// (dBTP is defined by that 4× measure, so a compliance meter never reads an
// over). The independent 16× sinc reference then sits within
// `reference_margin_db` of the ceiling: ~0 for tones, impulses and anything
// band-limited, a few tenths for a digital square's Gibbs ringing, and up to
// ~1 dB for full-band white noise, the 4× detector's documented weak spot —
// which the −1 dBTP default ceiling still absorbs below 0 dBTP.
void expect_brickwall(const Rendered& out, const char* what, float ceiling = kDefaultCeiling,
                      float reference_margin_db = 0.3f) {
  const int skip = 4800;
  EXPECT(out.finite(), what);
  EXPECT(out.peak() <= ceiling + 1.0e-6f, what);
  const float own = std::max(bs1770_true_peak(out.out_left, skip), bs1770_true_peak(out.out_right, skip));
  EXPECT(gain_to_db(own / ceiling) < 0.05f, what);
  const float reference =
      std::max(reference_true_peak(out.out_left, skip), reference_true_peak(out.out_right, skip));
  EXPECT(gain_to_db(reference / ceiling) < reference_margin_db, what);
  // The acceptance line for the default ceiling: nothing above −0.1 dBTP.
  if (ceiling == kDefaultCeiling && reference_margin_db <= 0.9f) EXPECT(gain_to_db(reference) < -0.1f, what);
}

void test_full_scale_sine_is_capped_at_the_ceiling() {
  Rendered out = render_fresh(1.0f, sine(440.0f, 1.0f));
  expect_brickwall(out, "0 dBFS sine: brickwall");
  EXPECT(out.peak(4800) > kDefaultCeiling * db_to_gain(-0.5f),
         "the limited sine sits just under the ceiling, not far below it");
}

void test_hot_material_stays_under_the_ceiling() {
  expect_brickwall(render_fresh(1.0f, square(1000.0f, 4.0f)), "+12 dBFS square: brickwall");
  expect_brickwall(render_fresh(1.0f, impulses(4.0f)), "+12 dBFS impulses: brickwall");
  expect_brickwall(render_fresh(1.0f, noise(2.0f)), "+6 dBFS full-band noise: brickwall",
                   kDefaultCeiling, 1.0f);
  // fs/4 with a 45° offset: samples reach only 0.707 of the waveform's peak.
  expect_brickwall(render_fresh(1.0f, sine(12000.0f, 1.5f, 0.785398163f)),
                   "quarter-rate sine the samples miss: brickwall");
  // Tones right up to Nyquist: the samples miss most of the waveform.
  expect_brickwall(render_fresh(1.0f, sine(20000.0f, 2.0f)), "+6 dBFS 20 kHz sine: brickwall");
  expect_brickwall(render_fresh(1.0f, sine(23000.0f, 2.0f)), "+6 dBFS 23 kHz sine: brickwall");
  // A hard onset from silence: the lookahead has to see it coming.
  TruePeakLimiterDevice& device = g_test_device;
  device.init(kSampleRate);
  Rendered onset;
  render(device, onset, 0.2f, silence());
  render(device, onset, 0.3f, square(500.0f, 2.0f), 9600);
  EXPECT(onset.peak() <= kDefaultCeiling + 1.0e-6f, "square onset from silence: no sample over the ceiling");
  EXPECT(gain_to_db(std::max(bs1770_true_peak(onset.out_left), bs1770_true_peak(onset.out_right)) /
                    kDefaultCeiling) < 0.05f,
         "square onset from silence: no true peak over the ceiling");
}

void test_attack_is_a_lookahead_ramp() {
  TruePeakLimiterDevice& device = g_test_device;
  device.init(kSampleRate);
  const int lookahead = device.limiter().latencyFrames() - TruePeakLimiter::kInterpolatorDelay + 1;
  Rendered out;
  render(device, out, 0.1f, sine(440.0f, db_to_gain(-6.0f)));
  // Switch to +6 dBFS sample by sample so the envelope can be watched per frame.
  std::vector<float> envelope;
  for (int n = 0; n < 2000; ++n) {
    device.in_left()[0] = 2.0f * std::sin(kTwoPi * 440.0f * n / kSampleRate);
    device.in_right()[0] = device.in_left()[0];
    device.process(1);
    envelope.push_back(device.limiter().envelope());
  }
  int first_drop = -1;
  int reached_min = -1;
  const float minimum = *std::min_element(envelope.begin(), envelope.end());
  for (size_t i = 0; i < envelope.size(); ++i) {
    if (first_drop < 0 && envelope[i] < 0.999f) first_drop = static_cast<int>(i);
    if (reached_min < 0 && envelope[i] < minimum + 1.0e-4f) reached_min = static_cast<int>(i);
  }
  EXPECT(first_drop > 0, "the envelope starts falling before the hot signal reaches the output");
  // A step would ramp over exactly the lookahead; a sine's required gain keeps
  // growing for a quarter period (27 samples at 440 Hz) after it crosses the ceiling.
  const int ramp = reached_min - first_drop;
  EXPECT(ramp >= lookahead - 2, "the attack ramp spans the lookahead");
  EXPECT(ramp <= lookahead + 40, "the attack ramp is not much longer than the lookahead");
  EXPECT(std::fabs(minimum - kDefaultCeiling / 2.0f) < 0.01f, "+6 dBFS is pulled down to the ceiling");
  bool monotonic = true;
  for (int i = first_drop + 1; i <= reached_min; ++i) {
    if (envelope[i] > envelope[i - 1] + 1.0e-6f) monotonic = false;
  }
  EXPECT(monotonic, "the attack ramp never steps back up");
}

void test_release_recovers_unity_at_the_configured_rate() {
  auto recovered_peak = [](float release_ms) {
    TruePeakLimiterDevice& device = g_test_device;
    device.init(kSampleRate);
    device.set_param(TruePeakLimiterParam::kReleaseMs, release_ms);
    Rendered out;
    render(device, out, 0.3f, sine(440.0f, 2.0f));
    render(device, out, 0.5f, sine(440.0f, 0.5f), 14400);
    return out.peak(static_cast<int>(0.75f * kSampleRate));
  };
  const float fast = recovered_peak(100.0f);
  const float slow = recovered_peak(1000.0f);
  // 100 ms: within 0.5 s the gain is back to ~1 (the tail is 0.45 s after the burst's own lookahead).
  EXPECT(fast > 0.5f * 0.98f && fast <= 0.5f + 1.0e-4f, "100 ms release: unity restored within half a second");
  // 1000 ms: after 0.45 s only ~36 % of the reduction has released.
  EXPECT(slow < fast - 0.02f, "a longer release recovers more slowly");
  EXPECT(slow > 0.5f * 0.6f, "the slow release still recovers a meaningful part");
}

void test_input_gain_drives_the_detector() {
  TruePeakLimiterDevice& device = g_test_device;
  device.init(kSampleRate);
  device.set_param(TruePeakLimiterParam::kInputGainDb, 12.0f);
  Rendered driven;
  render(device, driven, 1.0f, sine(440.0f, db_to_gain(-12.0f)));
  const Rendered direct = render_fresh(1.0f, sine(440.0f, 1.0f));
  EXPECT(std::fabs(driven.peak(4800) - direct.peak(4800)) < 1.0e-3f,
         "+12 dB input gain behaves like a 12 dB hotter signal");

  device.init(kSampleRate);
  device.set_param(TruePeakLimiterParam::kInputGainDb, -6.0f);
  Rendered attenuated;
  render(device, attenuated, 1.0f, sine(440.0f, 1.0f));
  EXPECT(std::fabs(attenuated.peak(4800) - db_to_gain(-6.0f)) < 1.0e-3f,
         "-6 dB input gain takes a full-scale sine under the ceiling untouched");
}

void test_ceiling_parameter() {
  TruePeakLimiterDevice& device = g_test_device;
  device.init(kSampleRate);
  device.set_param(TruePeakLimiterParam::kCeilingDb, -6.0f);
  Rendered low;
  render(device, low, 1.0f, sine(440.0f, 1.0f));
  expect_brickwall(low, "-6 dBTP ceiling: brickwall", db_to_gain(-6.0f));
  EXPECT(low.peak(4800) > db_to_gain(-6.5f), "-6 dBTP ceiling: output sits at the ceiling");

  device.init(kSampleRate);
  device.set_param(TruePeakLimiterParam::kCeilingDb, 0.0f);
  Rendered full;
  render(device, full, 1.0f, square(1000.0f, 4.0f));
  EXPECT(full.finite() && full.peak() <= 1.0f + 1.0e-6f, "0 dBTP ceiling: never above full scale");
}

void test_input_bus_clears_between_blocks() {
  TruePeakLimiterDevice& device = g_test_device;
  device.init(kSampleRate);
  for (int i = 0; i < kBlock; ++i) {
    device.in_left()[i] = 0.1f;
    device.in_right()[i] = 0.1f;
  }
  device.process(kBlock);
  device.process(kBlock);  // flushes the delay line
  device.process(kBlock);
  float residual = 0.0f;
  for (int i = 0; i < kBlock; ++i) residual = std::max(residual, std::fabs(device.out_left()[i]));
  EXPECT(residual == 0.0f, "input bus clears between blocks");
}

void test_silence_and_stability() {
  const Rendered quiet = render_fresh(0.5f, silence());
  EXPECT(quiet.peak() == 0.0f, "silence in, silence out");

  TruePeakLimiterDevice& device = g_test_device;
  device.init(kSampleRate);
  device.set_param(TruePeakLimiterParam::kInputGainDb, 24.0f);
  device.set_param(TruePeakLimiterParam::kReleaseMs, 10.0f);
  Rendered loud;
  render(device, loud, 10.0f, noise(1.0f));
  EXPECT(loud.finite(), "+24 dB of noise for 10 s stays finite");
  EXPECT(loud.peak() <= kDefaultCeiling + 1.0e-6f, "+24 dB of noise for 10 s stays under the ceiling");
  // Noise keeps a new peak inside every lookahead window, so the averaged gain
  // sits ~1 dB under the ceiling; anything far lower would mean it is muting.
  EXPECT(loud.peak(4800) > kDefaultCeiling * 0.7f, "the limiter is working, not muting");
}

}  // namespace

int main() {
  test_param_table_matches_typescript();
  test_latency_is_exact_and_reported();
  test_unity_below_ceiling();
  test_full_scale_sine_is_capped_at_the_ceiling();
  test_hot_material_stays_under_the_ceiling();
  test_attack_is_a_lookahead_ramp();
  test_release_recovers_unity_at_the_configured_rate();
  test_input_gain_drives_the_detector();
  test_ceiling_parameter();
  test_input_bus_clears_between_blocks();
  test_silence_and_stability();

  if (g_failures == 0) {
    std::printf("true-peak-limiter device tests: all passed\n");
    return 0;
  }
  std::printf("true-peak-limiter device tests: %d failure(s)\n", g_failures);
  return 1;
}
