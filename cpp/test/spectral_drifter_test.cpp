// Native parity harness for the SpectralDrifter device (Bloom extraction).
// Covers the input-bus contract and mix law, the fixed intervals (octave,
// fifth, down, scatter) and Atonal drift measured as the dominant output
// frequency of a 440 Hz tone, bloom 0 leaving pitch alone, Bloom's activity
// age tracker (rising drift, decay in silence) against manual age, every
// season/seed combination, stability under a loud multi-tone input, denormal
// flushing, sample-rate independence of the shift, and the per-block CPU cost.
// Compiled with the system C++ compiler by scripts/test-native.sh.

#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdio>
#include <vector>

#include "../devices/spectral-drifter/spectral_drifter_device.h"

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

using livemix::SpectralDrifterDevice;
using livemix::SpectralDrifterParam;

SpectralDrifterDevice g_test_device;

// 100 % wet, full bloom, manual age 1: the shift under test unless a test
// says otherwise.
void init_wet(SpectralDrifterDevice& device, float sample_rate = kSampleRate) {
  device.init(sample_rate);
  device.set_param(SpectralDrifterParam::kMix, 1.0f);
  device.set_param(SpectralDrifterParam::kBloom, 1.0f);
  device.set_param(SpectralDrifterParam::kAgeMode, 1.0f);
  device.set_param(SpectralDrifterParam::kAge, 1.0f);
}

struct Tone {
  float phase = 0.0f;
  float increment = 0.0f;
  float gain = 0.0f;

  Tone(float frequency, float amplitude, float sample_rate = kSampleRate)
      : increment(kTwoPi * frequency / sample_rate), gain(amplitude) {}

  float next() {
    const float value = gain * std::sin(phase);
    phase += increment;
    if (phase >= kTwoPi) phase -= kTwoPi;
    return value;
  }
};

// Runs `seconds` of the tone (or silence when tone is null) through both
// inputs; appends the left output to `capture` when given. Returns the peak
// across both outputs; NaN/inf poison it.
float run(SpectralDrifterDevice& device, Tone* tone, float seconds, float sample_rate,
          std::vector<float>* capture = nullptr) {
  const int total = static_cast<int>(seconds * sample_rate);
  float peak = 0.0f;
  int rendered = 0;
  while (rendered < total) {
    const int frames = std::min(kBlock, total - rendered);
    if (tone != nullptr) {
      for (int i = 0; i < frames; ++i) {
        const float value = tone->next();
        device.in_left()[i] = value;
        device.in_right()[i] = value;
      }
    }
    device.process(frames);
    for (int i = 0; i < frames; ++i) {
      const float l = device.out_left()[i];
      const float r = device.out_right()[i];
      if (std::isnan(l) || std::isinf(l) || std::isnan(r) || std::isinf(r)) return 1.0e9f;
      peak = std::max(peak, std::max(std::fabs(l), std::fabs(r)));
      if (capture != nullptr) capture->push_back(l);
    }
    rendered += frames;
  }
  return peak;
}

double goertzel_power(const std::vector<float>& x, float frequency, float sample_rate) {
  const double w = 2.0 * 3.14159265358979323846 * frequency / sample_rate;
  const double coefficient = 2.0 * std::cos(w);
  double s0 = 0.0, s1 = 0.0, s2 = 0.0;
  for (float v : x) {
    s0 = v + coefficient * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  return s1 * s1 + s2 * s2 - coefficient * s1 * s2;
}

// Strongest of the quarter-tone grid from an octave below `center` to an
// octave above it.
float dominant_frequency(const std::vector<float>& x, float sample_rate, float center) {
  float best = 0.0f;
  double best_power = -1.0;
  for (int k = -24; k <= 24; ++k) {
    const float frequency = center * std::pow(2.0f, static_cast<float>(k) / 24.0f);
    const double power = goertzel_power(x, frequency, sample_rate);
    if (power > best_power) {
      best_power = power;
      best = frequency;
    }
  }
  return best;
}

bool near_frequency(float measured, float expected) {
  // Within a quarter tone (the grid spacing).
  return std::fabs(std::log2(measured / expected)) < 1.0f / 24.0f;
}

// Test tone for pitch measurements. Grain g restarts every 6144 samples at
// offset g * 768 and reads the buffer backwards at `ratio`, so its output is
// sin(w (1 + ratio) t_g - w ratio t): the eight overlapping grains add
// coherently only when (1 + ratio) * f * 768 / fs is an integer. This f makes
// that 6, 4 and 3 for ratios 2, 1 and 0.5 (and 4.9966 for the fifth); with an
// arbitrary tone, consecutive grains can sit in anti-phase and the fundamental
// cancels into sidebands. A reverb tail has no such alignment and needs none;
// the harness only needs a clean reading of the ratio.
float coherent_tone_hz(float sample_rate) { return sample_rate * 6.0f / 2304.0f; }  // 125 at 48 kHz

// Dominant frequency of the left output over `analyse` seconds after
// `settle` seconds of the coherent tone at 0.5.
float shifted_frequency(SpectralDrifterDevice& device, float settle, float analyse,
                        float sample_rate = kSampleRate) {
  Tone tone(coherent_tone_hz(sample_rate), 0.5f, sample_rate);
  run(device, &tone, settle, sample_rate);
  std::vector<float> capture;
  run(device, &tone, analyse, sample_rate, &capture);
  return dominant_frequency(capture, sample_rate, coherent_tone_hz(sample_rate));
}

void test_input_bus_passthrough_and_clear() {
  SpectralDrifterDevice& device = g_test_device;
  device.init(kSampleRate);
  device.set_param(SpectralDrifterParam::kMix, 0.0f);

  for (int i = 0; i < kBlock; ++i) {
    device.in_left()[i] = 0.25f;
    device.in_right()[i] = -0.25f;
  }
  device.process(kBlock);
  bool passthrough = true;
  for (int i = 0; i < kBlock; ++i) {
    if (std::fabs(device.out_left()[i] - 0.25f) > 1.0e-6f ||
        std::fabs(device.out_right()[i] + 0.25f) > 1.0e-6f) {
      passthrough = false;
      break;
    }
  }
  EXPECT(passthrough, "dry input should pass through unchanged at mix 0");

  device.process(kBlock);
  float residual = 0.0f;
  for (int i = 0; i < kBlock; ++i) residual += std::fabs(device.out_left()[i]);
  EXPECT(residual == 0.0f, "input bus should clear between blocks");
}

void test_mix_law_matches_bloom() {
  // Equal-power: at the default mix 0.5 the dry gain is cos(pi/4). The grains
  // start reading an empty buffer, so the first sample carries no wet.
  SpectralDrifterDevice& device = g_test_device;
  device.init(kSampleRate);
  EXPECT(std::fabs(device.mix() - 0.5f) < 1.0e-6f, "default mix is 0.5");
  EXPECT(std::fabs(device.bloom() - 0.5f) < 1.0e-6f, "default bloom is 0.5");
  device.in_left()[0] = 1.0f;
  device.in_right()[0] = 0.5f;
  device.process(1);
  EXPECT(std::fabs(device.out_left()[0] - 0.70710678f) < 1.0e-5f,
         "left dry scaled by cos(mix * pi/2) before any grain reads");
  EXPECT(std::fabs(device.out_right()[0] - 0.35355339f) < 1.0e-5f,
         "right dry scaled by cos(mix * pi/2) before any grain reads");
}

void test_fixed_intervals_shift_pitch() {
  SpectralDrifterDevice& device = g_test_device;
  const float f = coherent_tone_hz(kSampleRate);

  init_wet(device);  // defaults: Octave, Up
  EXPECT(near_frequency(shifted_frequency(device, 2.0f, 1.0f), 2.0f * f),
         "Octave/Up at full bloom and age doubles the tone");

  init_wet(device);
  device.set_param(SpectralDrifterParam::kDirection, 1.0f);
  EXPECT(near_frequency(shifted_frequency(device, 2.0f, 1.0f), 0.5f * f),
         "Octave/Down halves the tone");

  init_wet(device);
  device.set_param(SpectralDrifterParam::kInterval, 0.0f);
  EXPECT(near_frequency(shifted_frequency(device, 2.0f, 1.0f), 1.4983071f * f),
         "Fifth/Up shifts the tone by seven semitones");

  init_wet(device);
  device.set_param(SpectralDrifterParam::kInterval, 3.0f);
  EXPECT(near_frequency(shifted_frequency(device, 2.0f, 1.0f), 2.0f * f),
         "Atonal/Up at full intensity is a whole octave");

  init_wet(device);
  device.set_param(SpectralDrifterParam::kDirection, 0.6f);  // rounds to Down
  EXPECT(near_frequency(shifted_frequency(device, 2.0f, 1.0f), 0.5f * f),
         "choice params round to the nearest index");
}

void test_scatter_splits_grains_both_ways() {
  SpectralDrifterDevice& device = g_test_device;
  const float f = coherent_tone_hz(kSampleRate);
  init_wet(device);
  device.set_param(SpectralDrifterParam::kDirection, 2.0f);
  Tone tone(f, 0.5f);
  run(device, &tone, 2.0f, kSampleRate);
  std::vector<float> capture;
  run(device, &tone, 1.0f, kSampleRate, &capture);
  const double up = goertzel_power(capture, 2.0f * f, kSampleRate);
  const double down = goertzel_power(capture, 0.5f * f, kSampleRate);
  const double unison = goertzel_power(capture, f, kSampleRate);
  EXPECT(up > 4.0 * unison, "Scatter: grains 1,2,4,5,7 (five of eight) go up an octave");
  EXPECT(down > 4.0 * unison, "Scatter: grains 0,3,6 (three of eight) go down an octave");
  EXPECT(up > down, "Scatter: more energy up than down");
}

void test_bloom_zero_leaves_pitch_alone() {
  SpectralDrifterDevice& device = g_test_device;
  init_wet(device);
  device.set_param(SpectralDrifterParam::kBloom, 0.0f);
  EXPECT(near_frequency(shifted_frequency(device, 2.0f, 1.0f), coherent_tone_hz(kSampleRate)),
         "bloom 0 blends every grain to unison");
  EXPECT(std::fabs(device.drifter_left().getCurrentDrift()) < 1.0e-6f,
         "bloom 0 reports zero drift");
}

void test_auto_age_tracks_input_activity() {
  // decay 1 s -> maxAge 2 s. The drifter's intensity (getCurrentDrift) is
  // bloom * (0.3 + 0.7 * age): 0.3 for a fresh input, 1 once the input has
  // been active for two seconds; Octave/Up then reads ratio 1 + intensity.
  SpectralDrifterDevice& device = g_test_device;
  const float f = coherent_tone_hz(kSampleRate);
  device.init(kSampleRate);
  device.set_param(SpectralDrifterParam::kMix, 1.0f);
  device.set_param(SpectralDrifterParam::kBloom, 1.0f);
  device.set_param(SpectralDrifterParam::kDecay, 1.0f);
  EXPECT(!device.manual_age(), "age defaults to Bloom's activity tracker");
  EXPECT(device.age_left() == 0.0f, "age starts at zero");

  const float early = shifted_frequency(device, 0.5f, 0.5f);
  EXPECT(early > 1.2f * f && early < 1.9f * f, "young input drifts part of the way (0.5..1 s)");
  EXPECT(device.age_left() > 0.45f && device.age_left() < 0.55f,
         "one second of activity is age 0.5 of a 2 s ceiling");
  EXPECT(std::fabs(device.drifter_left().getCurrentDrift() - 0.65f) < 0.02f,
         "intensity is 0.3 + 0.7 * age at age 0.5");

  const float late = shifted_frequency(device, 2.0f, 1.0f);
  EXPECT(near_frequency(late, 2.0f * f), "after the age ceiling the full octave is reached");
  EXPECT(std::fabs(device.age_left() - 1.0f) < 1.0e-5f, "age clamps at the ceiling");
  EXPECT(std::fabs(device.drifter_left().getCurrentDrift() - 1.0f) < 1.0e-5f,
         "intensity reaches bloom at the age ceiling");
  EXPECT(std::fabs(device.age_right() - device.age_left()) < 1.0e-5f,
         "identical inputs age identically on both channels");

  run(device, nullptr, 3.0f, kSampleRate);
  EXPECT(device.age_left() < 0.01f, "three seconds of silence decay the age to nothing");
  Tone tone(f, 0.5f);
  run(device, &tone, 0.01f, kSampleRate);
  EXPECT(device.drifter_left().getCurrentDrift() < 0.31f,
         "a new onset starts drifting from young again");

  device.set_param(SpectralDrifterParam::kAgeMode, 1.0f);
  device.set_param(SpectralDrifterParam::kAge, 0.0f);
  run(device, &tone, 0.01f, kSampleRate);
  EXPECT(device.manual_age(), "age mode 1 is manual");
  EXPECT(std::fabs(device.drifter_left().getCurrentDrift() - 0.3f) < 1.0e-5f,
         "manual age 0 holds intensity at 0.3");
  device.set_param(SpectralDrifterParam::kAge, 0.5f);
  run(device, &tone, 0.01f, kSampleRate);
  EXPECT(std::fabs(device.drifter_left().getCurrentDrift() - 0.65f) < 1.0e-5f,
         "manual age 0.5 gives intensity 0.65");
}

void test_every_season_and_seed_is_bounded() {
  SpectralDrifterDevice& device = g_test_device;
  for (int season = 0; season < 4; ++season) {
    for (int seed = 0; seed < 3; ++seed) {
      init_wet(device);
      device.set_param(SpectralDrifterParam::kSeason, static_cast<float>(season));
      device.set_param(SpectralDrifterParam::kSeed, static_cast<float>(seed));
      Tone tone(440.0f, 0.5f);
      const float peak = run(device, &tone, 1.0f, kSampleRate);
      EXPECT(peak < 1.0e8f, "no NaN/inf for any season/seed");
      EXPECT(peak < 1.2f, "tanh(0.8x) * 1.1 bounds the wet path for any season/seed");
      EXPECT(peak > 0.05f, "every season/seed passes signal");
    }
  }
}

void test_stability_under_loud_input() {
  SpectralDrifterDevice& device = g_test_device;
  device.init(kSampleRate);
  device.set_param(SpectralDrifterParam::kBloom, 1.0f);
  device.set_param(SpectralDrifterParam::kInterval, 3.0f);
  device.set_param(SpectralDrifterParam::kDirection, 2.0f);
  device.set_param(SpectralDrifterParam::kSeason, 3.0f);
  device.set_param(SpectralDrifterParam::kSeed, 2.0f);

  // Eight stacked partials at 0.25 (peaks near 2.0) for 20 s at mix 0.5.
  float phases[8] = {};
  float peak = 0.0f;
  const int total = static_cast<int>(20.0f * kSampleRate);
  int rendered = 0;
  while (rendered < total) {
    const int frames = std::min(kBlock, total - rendered);
    for (int i = 0; i < frames; ++i) {
      float sum = 0.0f;
      for (int v = 0; v < 8; ++v) {
        sum += 0.25f * std::sin(phases[v]);
        phases[v] += kTwoPi * 110.0f * (v + 1) / kSampleRate;
        if (phases[v] >= kTwoPi) phases[v] -= kTwoPi;
      }
      device.in_left()[i] = sum;
      device.in_right()[i] = sum;
    }
    device.process(frames);
    for (int i = 0; i < frames; ++i) {
      const float l = device.out_left()[i];
      if (std::isnan(l) || std::isinf(l)) peak = 1.0e9f;
      peak = std::max(peak, std::fabs(l));
    }
    rendered += frames;
  }
  EXPECT(peak < 1.0e8f, "no NaN/inf during 20 s of loud input");
  EXPECT(peak < 2.5f, "output stays near the dry peak plus the bounded wet path");
}

void test_denormals_flush_to_silence() {
  SpectralDrifterDevice& device = g_test_device;
  init_wet(device);
  device.set_param(SpectralDrifterParam::kAgeMode, 0.0f);
  Tone tone(440.0f, 0.5f);
  run(device, &tone, 0.5f, kSampleRate);

  run(device, nullptr, 3.0f, kSampleRate);
  EXPECT(!device.drifter_left().hasDenormalState() && !device.drifter_right().hasDenormalState(),
         "no filter state should linger in the denormal range");
  run(device, nullptr, 2.0f, kSampleRate);
  EXPECT(device.drifter_left().isSilentState() && device.drifter_right().isSilentState(),
         "states and the 88200-sample buffer flush to exact zero after silence");
  EXPECT(device.age_left() < 1.0e-6f, "the age decays towards zero in silence");
  // 0.9999^(44100/fs) per sample: 0.5 s of age is below the flush threshold
  // after ~8 s of silence and is then snapped to exact zero.
  run(device, nullptr, 6.0f, kSampleRate);
  EXPECT(device.age_left() == 0.0f, "the age tracker flushes to exact zero too");
}

void test_shift_is_sample_rate_independent() {
  SpectralDrifterDevice& device = g_test_device;
  init_wet(device, 44100.0f);
  EXPECT(near_frequency(shifted_frequency(device, 2.0f, 1.0f, 44100.0f),
                        2.0f * coherent_tone_hz(44100.0f)),
         "octave up at 44.1 kHz");
  init_wet(device, 96000.0f);
  EXPECT(near_frequency(shifted_frequency(device, 2.0f, 1.0f, 96000.0f),
                        2.0f * coherent_tone_hz(96000.0f)),
         "octave up at 96 kHz");
}

void report_cpu_cost() {
  SpectralDrifterDevice& device = g_test_device;
  init_wet(device);
  device.set_param(SpectralDrifterParam::kInterval, 3.0f);
  device.set_param(SpectralDrifterParam::kDirection, 2.0f);
  Tone tone(440.0f, 0.5f);
  run(device, &tone, 1.0f, kSampleRate);
  const float seconds = 10.0f;
  const auto start = std::chrono::steady_clock::now();
  run(device, &tone, seconds, kSampleRate);
  const auto end = std::chrono::steady_clock::now();
  const double elapsed = std::chrono::duration<double>(end - start).count();
  const double blocks = seconds * kSampleRate / kBlock;
  std::printf("spectral-drifter cost: %.1f us per 128-frame stereo block, %.2f%% of real time at 48 kHz (native)\n",
              elapsed / blocks * 1.0e6, elapsed / seconds * 100.0);
}

}  // namespace

int main() {
  test_input_bus_passthrough_and_clear();
  test_mix_law_matches_bloom();
  test_fixed_intervals_shift_pitch();
  test_scatter_splits_grains_both_ways();
  test_bloom_zero_leaves_pitch_alone();
  test_auto_age_tracks_input_activity();
  test_every_season_and_seed_is_bounded();
  test_stability_under_loud_input();
  test_denormals_flush_to_silence();
  test_shift_is_sample_rate_independent();
  report_cpu_cost();

  if (g_failures == 0) {
    std::printf("spectral-drifter device tests: all passed\n");
    return 0;
  }
  std::printf("spectral-drifter device tests: %d failure(s)\n", g_failures);
  return 1;
}
