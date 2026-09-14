// Native parity harness for the StereoWidener device: the width semantics of
// kkfonie's StereoWidener (0-50 % mono -> normal, 50-75 % normal -> wide,
// 75-100 % allpass decorrelation + micro Haas, bass kept narrow) checked
// through the device's stereo bus, plus the input-bus contract, stability and
// the silence flush that guards the source's denormal-prone bass filter.
// Compiled with the system C++ compiler by scripts/test-native.sh.

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstdio>

#include "../devices/stereo-widener/stereo_widener_device.h"

namespace {

int g_failures = 0;

#define EXPECT(condition, message)                                    \
  do {                                                                \
    if (!(condition)) {                                               \
      std::printf("FAIL: %s (%s:%d)\n", message, __FILE__, __LINE__); \
      ++g_failures;                                                   \
    }                                                                 \
  } while (0)

constexpr float kSampleRate = 48000.0f;
constexpr int kBlock = 128;
constexpr float kTwoPi = 6.28318530717958647692f;

livemix::StereoWidenerDevice g_test_device;

struct Tone {
  float phase = 0.0f;
  float increment = 0.0f;
  float gain = 0.0f;

  Tone(float frequency, float amplitude)
      : increment(kTwoPi * frequency / kSampleRate), gain(amplitude) {}

  float next() {
    const float value = gain * std::sin(phase);
    phase += increment;
    if (phase >= kTwoPi) phase -= kTwoPi;
    return value;
  }
};

// Deterministic white noise in [-gain, gain).
struct Noise {
  std::uint32_t state;
  float gain;

  Noise(std::uint32_t seed, float amplitude) : state(seed), gain(amplitude) {}

  float next() {
    state = state * 1664525u + 1013904223u;
    return gain * (static_cast<float>(state >> 8) / 8388608.0f - 1.0f);
  }
};

// Stereo statistics over the frames that were not discarded. Mid/side are
// (L +/- R) / 2, the same split the widener uses; `correlation` is Pearson's
// between L and R; `max_delta` is the largest |out - in| per channel.
struct Stats {
  double sum_ll = 0.0;
  double sum_rr = 0.0;
  double sum_lr = 0.0;
  double sum_mid_sq = 0.0;
  double sum_side_sq = 0.0;
  double sum_delta_l_sq = 0.0;
  double sum_delta_r_sq = 0.0;
  double sum_in_l_sq = 0.0;
  float max_delta_l = 0.0f;
  float max_delta_r = 0.0f;
  float peak = 0.0f;
  bool finite = true;
  long count = 0;

  void add(float in_l, float in_r, float out_l, float out_r) {
    if (std::isnan(out_l) || std::isinf(out_l) || std::isnan(out_r) || std::isinf(out_r)) {
      finite = false;
      return;
    }
    sum_ll += static_cast<double>(out_l) * out_l;
    sum_rr += static_cast<double>(out_r) * out_r;
    sum_lr += static_cast<double>(out_l) * out_r;
    const double mid = (static_cast<double>(out_l) + out_r) * 0.5;
    const double side = (static_cast<double>(out_l) - out_r) * 0.5;
    sum_mid_sq += mid * mid;
    sum_side_sq += side * side;
    const float dl = std::fabs(out_l - in_l);
    const float dr = std::fabs(out_r - in_r);
    sum_delta_l_sq += static_cast<double>(dl) * dl;
    sum_delta_r_sq += static_cast<double>(dr) * dr;
    sum_in_l_sq += static_cast<double>(in_l) * in_l;
    max_delta_l = std::max(max_delta_l, dl);
    max_delta_r = std::max(max_delta_r, dr);
    peak = std::max(peak, std::max(std::fabs(out_l), std::fabs(out_r)));
    ++count;
  }

  double rms_l() const { return std::sqrt(sum_ll / count); }
  double rms_r() const { return std::sqrt(sum_rr / count); }
  double mid_rms() const { return std::sqrt(sum_mid_sq / count); }
  double side_rms() const { return std::sqrt(sum_side_sq / count); }
  double side_to_mid() const { return side_rms() / mid_rms(); }
  double correlation() const { return sum_lr / std::sqrt(sum_ll * sum_rr); }
  double delta_l_rms() const { return std::sqrt(sum_delta_l_sq / count); }
  double delta_r_rms() const { return std::sqrt(sum_delta_r_sq / count); }
  double in_l_rms() const { return std::sqrt(sum_in_l_sq / count); }
};

// Feeds `seconds` of a generated stereo signal through the device in
// kBlock-frame blocks, accumulating statistics after `discard_seconds`.
template <typename GenL, typename GenR>
Stats run(livemix::StereoWidenerDevice& device, float seconds, float discard_seconds,
          GenL& gen_l, GenR& gen_r) {
  Stats stats;
  const int total_frames = static_cast<int>(seconds * kSampleRate);
  const int discard_frames = static_cast<int>(discard_seconds * kSampleRate);
  float in_l[kBlock];
  float in_r[kBlock];
  int rendered = 0;
  while (rendered < total_frames) {
    const int frames = std::min(kBlock, total_frames - rendered);
    for (int i = 0; i < frames; ++i) {
      in_l[i] = gen_l.next();
      in_r[i] = gen_r.next();
      device.in_left()[i] = in_l[i];
      device.in_right()[i] = in_r[i];
    }
    device.process(frames);
    for (int i = 0; i < frames; ++i) {
      if (rendered + i >= discard_frames) {
        stats.add(in_l[i], in_r[i], device.out_left()[i], device.out_right()[i]);
      }
    }
    rendered += frames;
  }
  return stats;
}

struct Silence {
  float next() { return 0.0f; }
};

Stats run_silence(livemix::StereoWidenerDevice& device, float seconds) {
  Silence left;
  Silence right;
  return run(device, seconds, 0.0f, left, right);
}

// Init, set width and let the 5 ms ramp settle on silence so every
// measurement below sees a fixed width.
livemix::StereoWidenerDevice& device_at_width(float width) {
  livemix::StereoWidenerDevice& device = g_test_device;
  device.init(kSampleRate);
  device.set_param(livemix::StereoWidenerParam::kWidth, width);
  run_silence(device, 0.01f);
  return device;
}

void test_default_width_is_normal_stereo() {
  livemix::StereoWidenerDevice& device = g_test_device;
  device.init(kSampleRate);
  EXPECT(std::fabs(device.width() - 0.5f) < 1.0e-6f, "default width is 0.5 (normal stereo)");
}

void test_width_zero_folds_highs_to_mono() {
  // Two unrelated tones, both well above the 200 Hz bass crossover, so the
  // input has as much side as mid energy.
  livemix::StereoWidenerDevice& device = device_at_width(0.0f);
  Tone left(3000.0f, 0.5f);
  Tone right(7000.0f, 0.5f);
  const Stats out = run(device, 0.4f, 0.2f, left, right);
  std::printf("  width 0: side/mid %.4f corr %.5f\n", out.side_to_mid(), out.correlation());
  EXPECT(out.finite, "width 0 output is finite");
  EXPECT(out.side_to_mid() < 0.1, "width 0 collapses the side channel (> 20 dB down)");
  EXPECT(out.correlation() > 0.98, "width 0 output channels are near-identical");
}

void test_width_half_passes_mono_unchanged() {
  livemix::StereoWidenerDevice& device = device_at_width(0.5f);
  Noise left(1u, 0.5f);
  Noise right(1u, 0.5f);
  const Stats out = run(device, 0.2f, 0.0f, left, right);
  std::printf("  width 0.5 mono: max delta %.3g\n", static_cast<double>(out.max_delta_l));
  EXPECT(out.finite, "width 0.5 output is finite");
  EXPECT(out.max_delta_l < 1.0e-6f, "mono input passes through unchanged at width 0.5 (L)");
  EXPECT(out.max_delta_r < 1.0e-6f, "mono input passes through unchanged at width 0.5 (R)");
}

void test_width_half_keeps_hard_panned_highs() {
  // A hard-left 8 kHz tone: only the ~2.6 % that leaks into the bass path is
  // touched at width 0.5, so both channels stay within 1 % of the input.
  livemix::StereoWidenerDevice& device = device_at_width(0.5f);
  Tone left(8000.0f, 0.5f);
  Silence right;
  const Stats out = run(device, 0.4f, 0.2f, left, right);
  const double in_rms = out.in_l_rms();
  std::printf("  width 0.5 panned: dL %.4f dR %.4f (rel to %.4f)\n", out.delta_l_rms(),
              out.delta_r_rms(), in_rms);
  EXPECT(out.finite, "width 0.5 panned output is finite");
  EXPECT(out.delta_l_rms() < 0.01 * in_rms, "hard-panned highs keep their level at width 0.5");
  EXPECT(out.delta_r_rms() < 0.01 * in_rms, "hard-panned highs do not bleed at width 0.5");
}

void test_side_energy_grows_with_width() {
  // The M/S stages (0 -> 0.75): independent L/R noise gains side energy
  // monotonically and is untouched (side == mid) at 0.5. Above 0.75 the
  // allpass stage decorrelates rather than anti-phases, so that range is
  // measured by correlation in the next test.
  const float widths[] = {0.0f, 0.25f, 0.5f, 0.625f, 0.75f};
  constexpr int kCount = 5;
  double ratios[kCount] = {};
  for (int i = 0; i < kCount; ++i) {
    livemix::StereoWidenerDevice& device = device_at_width(widths[i]);
    Noise left(7u, 0.5f);
    Noise right(99u, 0.5f);
    const Stats out = run(device, 0.4f, 0.2f, left, right);
    EXPECT(out.finite, "stereo noise output is finite");
    ratios[i] = out.side_to_mid();
    std::printf("  width %.3f: side/mid %.4f\n", static_cast<double>(widths[i]), ratios[i]);
  }
  for (int i = 1; i < kCount; ++i) {
    EXPECT(ratios[i] > ratios[i - 1] * 1.2, "side/mid ratio grows with width up to 0.75");
  }
  EXPECT(ratios[0] < 0.1, "width 0 leaves only the bass side (> 20 dB down)");
  EXPECT(std::fabs(ratios[2] - 1.0) < 0.05,
         "independent L/R noise keeps side == mid at width 0.5");
  EXPECT(ratios[4] > 2.0, "width 0.75 boosts side to +75 % against a reduced mid");
}

void test_decorrelation_grows_above_three_quarters() {
  // Mono input has no side for M/S to boost, so anything it gains above 0.75
  // comes from the allpass decorrelation (from 0.75) and the Haas delay (from
  // 0.85): channel correlation falls monotonically towards 0.
  const float widths[] = {0.75f, 0.8f, 0.85f, 0.9f, 0.95f, 1.0f};
  constexpr int kCount = 6;
  double correlations[kCount] = {};
  for (int i = 0; i < kCount; ++i) {
    livemix::StereoWidenerDevice& device = device_at_width(widths[i]);
    Noise left(3u, 0.5f);
    Noise right(3u, 0.5f);
    const Stats out = run(device, 0.4f, 0.2f, left, right);
    EXPECT(out.finite, "mono noise output is finite");
    correlations[i] = out.correlation();
    std::printf("  width %.2f: mono corr %.5f side/mid %.4f\n", static_cast<double>(widths[i]),
                correlations[i], out.side_to_mid());
  }
  EXPECT(correlations[0] > 0.9999, "mono input is still mono at width 0.75");
  for (int i = 1; i < kCount; ++i) {
    EXPECT(correlations[i] < correlations[i - 1] - 0.01,
           "mono correlation falls monotonically above width 0.75");
  }
  EXPECT(correlations[kCount - 1] < 0.5, "allpass decorrelation + Haas spread mono at width 1.0");
}

void test_bass_stays_narrow() {
  // Hard-left 40 Hz versus hard-left 6 kHz. At 0.75 (pure M/S) the highs come
  // out anti-phase wide while the bass keeps under half of its side; at 1.0
  // the highs are decorrelated (correlation near 0) while the bass channels
  // stay in phase with only 30 % of their side.
  Tone bass_ms_l(40.0f, 0.5f);
  Silence bass_ms_r;
  const Stats bass_ms = run(device_at_width(0.75f), 1.0f, 0.5f, bass_ms_l, bass_ms_r);
  Tone high_ms_l(6000.0f, 0.5f);
  Silence high_ms_r;
  const Stats high_ms = run(device_at_width(0.75f), 0.4f, 0.2f, high_ms_l, high_ms_r);
  Tone bass_l(40.0f, 0.5f);
  Silence bass_r;
  const Stats bass = run(device_at_width(1.0f), 1.0f, 0.5f, bass_l, bass_r);
  Tone high_l(6000.0f, 0.5f);
  Silence high_r;
  const Stats high = run(device_at_width(1.0f), 0.4f, 0.2f, high_l, high_r);
  std::printf("  width 0.75 panned: bass side/mid %.4f corr %.4f; highs side/mid %.4f corr %.4f\n",
              bass_ms.side_to_mid(), bass_ms.correlation(), high_ms.side_to_mid(),
              high_ms.correlation());
  std::printf("  width 1.00 panned: bass side/mid %.4f corr %.4f; highs side/mid %.4f corr %.4f\n",
              bass.side_to_mid(), bass.correlation(), high.side_to_mid(), high.correlation());
  EXPECT(bass_ms.finite && high_ms.finite && bass.finite && high.finite,
         "panned output is finite");
  EXPECT(high_ms.side_to_mid() > 2.0, "hard-panned highs are pushed past anti-phase at 0.75");
  EXPECT(bass_ms.side_to_mid() < high_ms.side_to_mid() * 0.3,
         "hard-panned bass stays far narrower than the highs at 0.75");
  EXPECT(bass_ms.correlation() > 0.5, "bass channels stay in phase at 0.75");
  EXPECT(high.correlation() < 0.5, "hard-panned highs are decorrelated at 1.0");
  EXPECT(bass.side_to_mid() < 0.6, "hard-panned bass keeps under 60 % side at 1.0");
  EXPECT(bass.correlation() > high.correlation() + 0.5,
         "bass stays far more mono-compatible than the highs at 1.0");
}

void test_stability_under_load() {
  // 10 s of full-scale independent noise while the width sweeps 0 -> 1 -> 0
  // every block, then 1 s of silence.
  livemix::StereoWidenerDevice& device = g_test_device;
  device.init(kSampleRate);
  Noise left(11u, 1.0f);
  Noise right(13u, 1.0f);
  float peak = 0.0f;
  bool finite = true;
  const int total_frames = static_cast<int>(10.0f * kSampleRate);
  int rendered = 0;
  int block_index = 0;
  while (rendered < total_frames) {
    const int frames = std::min(kBlock, total_frames - rendered);
    const float sweep = static_cast<float>(block_index % 400) / 200.0f;
    device.set_param(livemix::StereoWidenerParam::kWidth, sweep <= 1.0f ? sweep : 2.0f - sweep);
    for (int i = 0; i < frames; ++i) {
      device.in_left()[i] = left.next();
      device.in_right()[i] = right.next();
    }
    device.process(frames);
    for (int i = 0; i < frames; ++i) {
      const float l = device.out_left()[i];
      const float r = device.out_right()[i];
      if (std::isnan(l) || std::isinf(l) || std::isnan(r) || std::isinf(r)) finite = false;
      peak = std::max(peak, std::max(std::fabs(l), std::fabs(r)));
    }
    rendered += frames;
    ++block_index;
  }
  const Stats decay = run_silence(device, 0.5f);
  const Stats settled = run_silence(device, 0.5f);
  std::printf("  stability: peak %.3f\n", static_cast<double>(peak));
  EXPECT(finite && decay.finite && settled.finite, "no NaN/inf during sustained processing");
  EXPECT(peak < 24.0f, "10 s of full-scale noise with width sweeps stays bounded");
  EXPECT(settled.peak == 0.0f, "output returns to exact silence after the load");
}

void test_input_bus_clears_between_blocks() {
  livemix::StereoWidenerDevice& device = g_test_device;
  device.init(kSampleRate);
  for (int i = 0; i < kBlock; ++i) {
    device.in_left()[i] = 0.25f;
    device.in_right()[i] = 0.25f;
  }
  device.process(kBlock);
  bool passthrough = true;
  for (int i = 0; i < kBlock; ++i) {
    if (std::fabs(device.out_left()[i] - 0.25f) > 1.0e-6f ||
        std::fabs(device.out_right()[i] - 0.25f) > 1.0e-6f) {
      passthrough = false;
      break;
    }
  }
  EXPECT(passthrough, "mono input passes through at the default width");

  device.process(kBlock);
  float residual = 0.0f;
  for (int i = 0; i < kBlock; ++i) {
    residual += std::fabs(device.out_left()[i]) + std::fabs(device.out_right()[i]);
  }
  EXPECT(residual == 0.0f, "input bus should clear between blocks");
}

void test_silence_flushes_denormal_state() {
  // At width 1.0 the mid gain is 0.525, so any residue left in the bass
  // filters shows up as out = state - fl(0.525 * state) != 0. Without the
  // device's silence reset the untouched source parks that state at
  // 19 * 2^-149 for good; with it, 1 s of silence must be bit-exact zero.
  livemix::StereoWidenerDevice& device = device_at_width(1.0f);
  Tone left(220.0f, 1.0f);
  Tone right(330.0f, 0.3f);
  run(device, 0.05f, 0.0f, left, right);

  const Stats decay = run_silence(device, 0.5f);
  EXPECT(decay.finite, "silence decay is finite");
  const Stats settled = run_silence(device, 0.5f);
  EXPECT(settled.finite, "settled silence is finite");
  EXPECT(settled.peak == 0.0f, "output is bit-exact zero after 0.5 s of silence");
}

}  // namespace

int main() {
  test_default_width_is_normal_stereo();
  test_width_zero_folds_highs_to_mono();
  test_width_half_passes_mono_unchanged();
  test_width_half_keeps_hard_panned_highs();
  test_side_energy_grows_with_width();
  test_decorrelation_grows_above_three_quarters();
  test_bass_stays_narrow();
  test_stability_under_load();
  test_input_bus_clears_between_blocks();
  test_silence_flushes_denormal_state();

  if (g_failures == 0) {
    std::printf("stereo widener device tests: all passed\n");
    return 0;
  }
  std::printf("stereo widener device tests: %d failure(s)\n", g_failures);
  return 1;
}
