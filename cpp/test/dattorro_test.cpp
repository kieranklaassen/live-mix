// Native parity harness for the Dattorro device. These are the reverb,
// stability and denormal tests from ambient-live's engine_test.cpp, driven
// through the device's stereo input bus instead of the old sine voice, plus
// the input-bus contract (pass-through at mix 0, cleared between blocks).
// Compiled with the system C++ compiler by scripts/test-native.sh.

#include <algorithm>
#include <cmath>
#include <cstdio>

#include "../devices/dattorro/dattorro_device.h"

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

livemix::DattorroDevice g_test_device;

// Renders `seconds` of silence input, returning the peak absolute output and
// optionally the left-channel RMS. NaN/inf poison the peak so callers notice.
float render_seconds(livemix::DattorroDevice& device, float seconds,
                     float* rms_out = nullptr) {
  const int total_frames = static_cast<int>(seconds * kSampleRate);
  float peak = 0.0f;
  double sum_squares = 0.0;
  int rendered = 0;
  while (rendered < total_frames) {
    const int frames = std::min(kBlock, total_frames - rendered);
    device.process(frames);
    const float* left = device.out_left();
    const float* right = device.out_right();
    for (int i = 0; i < frames; ++i) {
      const float al = std::fabs(left[i]);
      const float ar = std::fabs(right[i]);
      if (al > peak) peak = al;
      if (ar > peak) peak = ar;
      sum_squares += static_cast<double>(left[i]) * left[i];
      if (std::isnan(left[i]) || std::isinf(left[i]) || std::isnan(right[i]) ||
          std::isinf(right[i])) {
        return 1.0e9f;
      }
    }
    rendered += frames;
  }
  if (rms_out != nullptr) {
    *rms_out = static_cast<float>(std::sqrt(sum_squares / total_frames));
  }
  return peak;
}

// Feeds `seconds` of a sine tone into both input channels.
float feed_tone(livemix::DattorroDevice& device, float seconds, float frequency,
                float gain) {
  const int total_frames = static_cast<int>(seconds * kSampleRate);
  float phase = 0.0f;
  const float increment = kTwoPi * frequency / kSampleRate;
  float peak = 0.0f;
  int rendered = 0;
  while (rendered < total_frames) {
    const int frames = std::min(kBlock, total_frames - rendered);
    for (int i = 0; i < frames; ++i) {
      const float value = gain * std::sin(phase);
      phase += increment;
      if (phase >= kTwoPi) phase -= kTwoPi;
      device.in_left()[i] = value;
      device.in_right()[i] = value;
    }
    device.process(frames);
    for (int i = 0; i < frames; ++i) {
      peak = std::max(peak, std::fabs(device.out_left()[i]));
    }
    rendered += frames;
  }
  return peak;
}

void test_reverb_tail_exists_and_decays() {
  livemix::DattorroDevice& device = g_test_device;
  device.init(kSampleRate);
  device.set_param(livemix::DattorroParam::kMix, 1.0f);
  device.set_param(livemix::DattorroParam::kDecay, 0.7f);
  device.set_param(livemix::DattorroParam::kPredelayMs, 1.0f);

  feed_tone(device, 0.05f, 880.0f, 1.0f);

  float rms_early = 0.0f;
  render_seconds(device, 0.5f, &rms_early);
  float rms_mid = 0.0f;
  render_seconds(device, 0.5f, &rms_mid);
  render_seconds(device, 1.5f);
  float rms_late = 0.0f;
  render_seconds(device, 0.5f, &rms_late);

  EXPECT(rms_early > 1.0e-5f, "reverb tail should carry energy at 0.5s");
  EXPECT(rms_mid > 0.0f, "reverb tail should still be audible after 1s");
  EXPECT(rms_late < rms_early, "reverb tail should decay over time");
}

void test_decay_parameter_lengthens_tail() {
  const auto tail_rms_at_2s = [](float decay) {
    livemix::DattorroDevice& device = g_test_device;
    device.init(kSampleRate);
    device.set_param(livemix::DattorroParam::kMix, 1.0f);
    device.set_param(livemix::DattorroParam::kDecay, decay);
    device.set_param(livemix::DattorroParam::kPredelayMs, 1.0f);
    feed_tone(device, 0.05f, 440.0f, 1.0f);
    render_seconds(device, 2.0f);
    float rms = 0.0f;
    render_seconds(device, 0.25f, &rms);
    return rms;
  };

  const float long_tail = tail_rms_at_2s(0.9f);
  const float short_tail = tail_rms_at_2s(0.3f);
  EXPECT(long_tail > short_tail * 4.0f,
         "decay=0.9 should leave much more tail at 2s than decay=0.3");
}

void test_stability_under_load() {
  livemix::DattorroDevice& device = g_test_device;
  device.init(kSampleRate);
  device.set_param(livemix::DattorroParam::kMix, 0.5f);
  device.set_param(livemix::DattorroParam::kDecay, 0.95f);

  // Eight stacked partials at 0.4 each, like the old eight-voice stress test.
  float peak = 0.0f;
  {
    const int total_frames = static_cast<int>(10.0f * kSampleRate);
    float phases[8] = {};
    int rendered = 0;
    while (rendered < total_frames) {
      const int frames = std::min(kBlock, total_frames - rendered);
      for (int i = 0; i < frames; ++i) {
        float sum = 0.0f;
        for (int v = 0; v < 8; ++v) {
          sum += 0.4f * std::sin(phases[v]);
          phases[v] += kTwoPi * 110.0f * (v + 1) / kSampleRate;
          if (phases[v] >= kTwoPi) phases[v] -= kTwoPi;
        }
        device.in_left()[i] = sum;
        device.in_right()[i] = sum;
      }
      device.process(frames);
      for (int i = 0; i < frames; ++i) {
        peak = std::max(peak, std::fabs(device.out_left()[i]));
      }
      rendered += frames;
    }
  }
  const float peak_tail = render_seconds(device, 20.0f);
  if (peak_tail > peak) peak = peak_tail;

  EXPECT(peak < 4.0f, "30s of processing should stay bounded (no blowup)");
  EXPECT(peak < 1.0e8f, "no NaN/inf during sustained processing");
}

void test_denormals_flush_to_silence() {
  livemix::DattorroDevice& device = g_test_device;
  device.init(kSampleRate);
  device.set_param(livemix::DattorroParam::kMix, 1.0f);
  device.set_param(livemix::DattorroParam::kDecay, 0.5f);
  feed_tone(device, 0.05f, 440.0f, 1.0f);

  render_seconds(device, 10.0f);
  EXPECT(!device.reverb().has_denormal_state(),
         "no reverb state should linger in the denormal range");
  render_seconds(device, 2.0f);
  EXPECT(device.reverb().is_silent_state(),
         "reverb state should flush to exact zero after a long silence");
}

void test_input_bus_passthrough_and_clear() {
  livemix::DattorroDevice& device = g_test_device;
  device.init(kSampleRate);
  device.set_param(livemix::DattorroParam::kMix, 0.0f);

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

void test_mix_law_matches_ambient_live() {
  // dry*(1-mix) + wet*mix: at mix 0.35 with the reverb still silent (first
  // sample, before the pre-delay), the output is exactly 0.65 * dry.
  livemix::DattorroDevice& device = g_test_device;
  device.init(kSampleRate);
  EXPECT(std::fabs(device.mix() - 0.35f) < 1.0e-6f, "default mix is 0.35");
  device.in_left()[0] = 1.0f;
  device.in_right()[0] = 0.5f;
  device.process(1);
  EXPECT(std::fabs(device.out_left()[0] - 0.65f) < 1.0e-6f,
         "left dry scaled by (1 - mix) before the tail arrives");
  EXPECT(std::fabs(device.out_right()[0] - 0.325f) < 1.0e-6f,
         "right dry scaled by (1 - mix) before the tail arrives");
}

}  // namespace

int main() {
  test_reverb_tail_exists_and_decays();
  test_decay_parameter_lengthens_tail();
  test_stability_under_load();
  test_denormals_flush_to_silence();
  test_input_bus_passthrough_and_clear();
  test_mix_law_matches_ambient_live();

  if (g_failures == 0) {
    std::printf("dattorro device tests: all passed\n");
    return 0;
  }
  std::printf("dattorro device tests: %d failure(s)\n", g_failures);
  return 1;
}
