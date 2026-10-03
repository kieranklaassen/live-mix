// Native harness for the hall reverb Faust device: the parameter contract the
// TypeScript table relies on, the stereo bus contract shared with every
// device, and the reverb's behaviour (tail, decay tracking, sample-rate
// independence, stability). Compiled with the system C++ compiler by
// scripts/test-native.sh.

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstdio>
#include <cstring>

#include "../faust/common/faust_device.h"
#include "../faust/generated/hall-reverb.h"

namespace {

int g_failures = 0;

#define EXPECT(condition, message)                                    \
  do {                                                                \
    if (!(condition)) {                                               \
      std::printf("FAIL: %s (%s:%d)\n", message, __FILE__, __LINE__); \
      ++g_failures;                                                   \
    }                                                                 \
  } while (0)

using Device = livemix::faust::FaustDevice<livemix::faust::HallReverb, 20>;

constexpr float kSampleRate = 48000.0f;
constexpr int kBlock = 128;
constexpr float kTwoPi = 6.28318530717958647692f;

// Ids as src/dsp/devices/faust/hall-reverb.ts declares them.
enum Param : int { kPreDelay = 0, kCrossover, kLowDecay, kMidDecay, kDamping, kMix };

Device g_test_device;
// The same DSP behind an hour's hold: it runs every block, as the wrapper did
// before it could sleep.
using AwakeDevice = livemix::faust::FaustDevice<livemix::faust::HallReverb, 3600>;
AwakeDevice g_awake_device;

// Renders `seconds` of silence, returning the peak absolute output and
// optionally the left-channel RMS. NaN/inf poison the peak so callers notice.
float render_seconds(Device& device, float seconds, float sample_rate = kSampleRate,
                     float* rms_out = nullptr) {
  const int total_frames = static_cast<int>(seconds * sample_rate);
  float peak = 0.0f;
  double sum_squares = 0.0;
  int rendered = 0;
  while (rendered < total_frames) {
    const int frames = std::min(kBlock, total_frames - rendered);
    device.process(frames);
    const float* left = device.out_left();
    const float* right = device.out_right();
    for (int i = 0; i < frames; ++i) {
      if (std::isnan(left[i]) || std::isinf(left[i]) || std::isnan(right[i]) ||
          std::isinf(right[i])) {
        return 1.0e9f;
      }
      peak = std::max(peak, std::max(std::fabs(left[i]), std::fabs(right[i])));
      sum_squares += static_cast<double>(left[i]) * left[i];
    }
    rendered += frames;
  }
  if (rms_out != nullptr) {
    *rms_out = static_cast<float>(std::sqrt(sum_squares / std::max(1, total_frames)));
  }
  return peak;
}

// Feeds `seconds` of a sine tone into both input channels; returns the output peak.
float feed_tone(Device& device, float seconds, float frequency, float gain,
                float sample_rate = kSampleRate) {
  const int total_frames = static_cast<int>(seconds * sample_rate);
  float phase = 0.0f;
  const float increment = kTwoPi * frequency / sample_rate;
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

void test_param_table_matches_typescript() {
  Device& device = g_test_device;
  device.init(kSampleRate);
  EXPECT(device.param_count() == 6, "hall-reverb exposes six parameters");

  struct Expected {
    const char* label;
    float init, min, max;
  };
  const Expected expected[] = {
      {"Pre-delay", 60.0f, 20.0f, 100.0f}, {"Crossover", 200.0f, 50.0f, 1000.0f},
      {"Low decay", 3.0f, 1.0f, 8.0f},     {"Mid decay", 2.0f, 1.0f, 8.0f},
      {"Damping", 6000.0f, 1500.0f, 23520.0f}, {"Mix", 0.35f, 0.0f, 1.0f},
  };
  for (int id = 0; id < 6; ++id) {
    const livemix::faust::FaustParam& param = device.param(id);
    EXPECT(std::strcmp(param.label, expected[id].label) == 0, "param label order matches ids");
    EXPECT(std::fabs(param.init - expected[id].init) < 1.0e-6f, "param default matches .dsp");
    EXPECT(std::fabs(param.min - expected[id].min) < 1.0e-6f, "param min matches .dsp");
    EXPECT(std::fabs(param.max - expected[id].max) < 1.0e-6f, "param max matches .dsp");
    EXPECT(std::fabs(device.param_value(id) - expected[id].init) < 1.0e-6f,
           "init() resets every param to its default");
  }
}

void test_set_param_clamps_to_declared_range() {
  Device& device = g_test_device;
  device.init(kSampleRate);
  device.set_param(kMix, 2.0f);
  EXPECT(device.param_value(kMix) == 1.0f, "mix clamps to its max");
  device.set_param(kMix, -1.0f);
  EXPECT(device.param_value(kMix) == 0.0f, "mix clamps to its min");
  device.set_param(kPreDelay, 5.0f);
  EXPECT(device.param_value(kPreDelay) == 20.0f, "pre-delay clamps to 20 ms");
  device.set_param(kMidDecay, std::nanf(""));
  EXPECT(device.param_value(kMidDecay) == 2.0f, "NaN falls back to the default");
  device.set_param(42, 1.0f);
  device.set_param(-1, 1.0f);
  EXPECT(device.param_count() == 6, "unknown ids are ignored");
}

void test_input_bus_passthrough_and_clear() {
  Device& device = g_test_device;
  device.init(kSampleRate);
  device.set_param(kMix, 0.0f);
  render_seconds(device, 0.1f);  // let the 5 ms mix smoother settle from its default

  for (int i = 0; i < kBlock; ++i) {
    device.in_left()[i] = 0.25f;
    device.in_right()[i] = -0.25f;
  }
  device.process(kBlock);
  bool passthrough = true;
  for (int i = 0; i < kBlock; ++i) {
    if (std::fabs(device.out_left()[i] - 0.25f) > 1.0e-5f ||
        std::fabs(device.out_right()[i] + 0.25f) > 1.0e-5f) {
      passthrough = false;
      break;
    }
  }
  EXPECT(passthrough, "dry input should pass through unchanged at mix 0");

  device.process(kBlock);
  float residual = 0.0f;
  for (int i = 0; i < kBlock; ++i) residual = std::max(residual, std::fabs(device.out_left()[i]));
  EXPECT(residual < 1.0e-5f, "input bus should clear between blocks");
}

// The balance is the plate reverb's (dry*(1-mix) + wet*mix); the sum is
// then divided by sqrt((1-mix)^2 + 0.2*mix^2), what dry and a wet signal 7 dB
// under it add up to in power, so the level does not fall as Mix rises.
float levelled(float mix) {
  return 1.0f / std::sqrt((1.0f - mix) * (1.0f - mix) + 0.2f * mix * mix);
}

void test_mix_law_is_a_levelled_balance() {
  // Before the pre-delay elapses the wet path is silent, so a settled mix of
  // 0.35 leaves (1 - mix) * level of the dry signal.
  Device& device = g_test_device;
  device.init(kSampleRate);
  render_seconds(device, 0.1f);
  device.in_left()[0] = 1.0f;
  device.in_right()[0] = 0.5f;
  device.process(1);
  const float dry = 0.65f * levelled(0.35f);
  EXPECT(std::fabs(dry - 0.9722f) < 1.0e-3f, "0.65 of the dry signal is levelled up to 0.972");
  EXPECT(std::fabs(device.out_left()[0] - dry) < 1.0e-4f, "left dry scaled by (1 - mix) * level");
  EXPECT(std::fabs(device.out_right()[0] - 0.5f * dry) < 1.0e-4f, "right dry scaled by (1 - mix) * level");
}

// What the levelling is for: a steady sound comes out about as loud wherever
// Mix stands. Without it the output fell 4 dB by 0.35 and 7 dB fully wet.
void test_level_holds_as_mix_rises() {
  const auto rms_at = [](float mix) {
    Device& device = g_test_device;
    device.init(kSampleRate);
    device.set_param(kMix, mix);
    // Pink-ish noise: white noise through a one-pole, the same on both sides.
    uint32_t seed = 0x2545F491u;
    float low = 0.0f;
    double sum = 0.0;
    int counted = 0;
    const int total = static_cast<int>(6.0f * kSampleRate);
    for (int rendered = 0; rendered < total; rendered += kBlock) {
      for (int i = 0; i < kBlock; ++i) {
        seed = seed * 1664525u + 1013904223u;
        const float white = static_cast<float>(static_cast<int32_t>(seed)) / 2147483648.0f;
        low += 0.1f * (white - low);
        device.in_left()[i] = 0.5f * low;
        device.in_right()[i] = 0.5f * low;
      }
      device.process(kBlock);
      if (rendered >= static_cast<int>(3.0f * kSampleRate)) {  // the room is full
        for (int i = 0; i < kBlock; ++i) {
          const double l = device.out_left()[i], r = device.out_right()[i];
          sum += 0.5 * (l * l + r * r);
          ++counted;
        }
      }
    }
    return static_cast<float>(std::sqrt(sum / counted));
  };
  const float dry = rms_at(0.0f);
  std::printf("hall-reverb level against the dry signal (steady noise):");
  for (float mix : {0.25f, 0.35f, 0.5f, 0.75f, 1.0f}) {
    const float db = 20.0f * std::log10(rms_at(mix) / dry);
    std::printf(" mix %.2f %+.1f dB", mix, db);
    EXPECT(std::fabs(db) < 2.5f, "the output stays within 2.5 dB of the dry level at every mix");
  }
  std::printf("\n");
}

void test_impulse_produces_decaying_tail() {
  Device& device = g_test_device;
  device.init(kSampleRate);
  device.set_param(kMix, 1.0f);
  device.set_param(kPreDelay, 20.0f);
  render_seconds(device, 0.1f);

  feed_tone(device, 0.05f, 880.0f, 1.0f);

  float rms_early = 0.0f;
  render_seconds(device, 0.5f, kSampleRate, &rms_early);
  render_seconds(device, 2.0f);
  float rms_late = 0.0f;
  render_seconds(device, 0.5f, kSampleRate, &rms_late);

  EXPECT(rms_early > 1.0e-4f, "reverb tail should carry energy in the first half second");
  EXPECT(rms_late < rms_early * 0.5f, "reverb tail should decay over time");
  EXPECT(rms_late > 0.0f, "a 2 s mid decay is still audible after 2.5 s");
}

void test_decay_parameters_track_rt60() {
  const auto tail_rms_at = [](float mid_decay, float seconds) {
    Device& device = g_test_device;
    device.init(kSampleRate);
    device.set_param(kMix, 1.0f);
    device.set_param(kPreDelay, 20.0f);
    device.set_param(kLowDecay, mid_decay);
    device.set_param(kMidDecay, mid_decay);
    render_seconds(device, 0.1f);
    feed_tone(device, 0.05f, 440.0f, 1.0f);
    render_seconds(device, seconds);
    float rms = 0.0f;
    render_seconds(device, 0.25f, kSampleRate, &rms);
    return rms;
  };

  const float long_tail = tail_rms_at(8.0f, 2.0f);
  const float short_tail = tail_rms_at(1.0f, 2.0f);
  EXPECT(long_tail > short_tail * 8.0f, "decay 8 s leaves far more tail at 2 s than decay 1 s");

  // A 1 s T60 is 60 dB down after one second; measured against the level right
  // after the burst this must be at least 40 dB, allowing for the early field.
  const float short_early = tail_rms_at(1.0f, 0.0f);
  const float short_after_1s = tail_rms_at(1.0f, 1.0f);
  EXPECT(short_after_1s < short_early * 0.01f, "decay 1 s drops at least 40 dB in one second");
}

void test_sample_rate_independence() {
  // The delay lines are sized for fsmax = 96 kHz; the device must run and
  // decay at every rate a browser hands it.
  for (float sample_rate : {44100.0f, 48000.0f, 96000.0f}) {
    Device& device = g_test_device;
    device.init(sample_rate);
    device.set_param(kMix, 1.0f);
    device.set_param(kPreDelay, 20.0f);
    render_seconds(device, 0.1f, sample_rate);
    feed_tone(device, 0.05f, 440.0f, 1.0f, sample_rate);
    float rms_early = 0.0f;
    const float peak = render_seconds(device, 0.5f, sample_rate, &rms_early);
    render_seconds(device, 2.0f, sample_rate);
    float rms_late = 0.0f;
    render_seconds(device, 0.5f, sample_rate, &rms_late);
    EXPECT(peak < 1.0e8f, "no NaN/inf at this sample rate");
    EXPECT(rms_early > 1.0e-4f, "tail exists at this sample rate");
    EXPECT(rms_late < rms_early * 0.5f, "tail decays at this sample rate");
  }
}

void test_stability_under_load() {
  Device& device = g_test_device;
  device.init(kSampleRate);
  device.set_param(kMix, 0.5f);
  device.set_param(kLowDecay, 8.0f);
  device.set_param(kMidDecay, 8.0f);
  device.set_param(kDamping, 23520.0f);

  // Eight stacked partials at 0.4 each for ten seconds, then a long tail.
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
          phases[v] += kTwoPi * 110.0f * static_cast<float>(v + 1) / kSampleRate;
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
  peak = std::max(peak, render_seconds(device, 20.0f));

  EXPECT(peak < 8.0f, "30 s of processing at maximum decay stays bounded");
  EXPECT(peak < 1.0e8f, "no NaN/inf during sustained processing");
}

void test_frames_are_clamped_to_max_block() {
  Device& device = g_test_device;
  device.init(kSampleRate);
  device.process(0);
  device.process(-1);
  device.process(Device::kMaxBlockFrames + 1000);
  EXPECT(Device::kMaxBlockFrames == 2048, "max block matches the hand-written devices");
  EXPECT(std::fabs(device.out_left()[Device::kMaxBlockFrames - 1]) < 1.0f,
         "oversized frame counts are clamped, never read past the buffers");
}

void test_sleeps_after_the_hold_and_wakes_unchanged() {
  Device& device = g_test_device;
  AwakeDevice& awake = g_awake_device;
  device.init(kSampleRate);
  awake.init(kSampleRate);
  EXPECT(!device.asleep(), "a new device is awake: the DSP's smoothers start from 0");

  // Feeds both `seconds` of the same tone (silence at gain 0). Where the
  // device ran the block, counts the samples that differ and keeps the
  // largest difference; where it slept through it, keeps what the reference
  // put out and anything the device did.
  float phase = 0.0f;
  int mismatches = 0;
  float difference = 0.0f;
  float left_out = 0.0f;
  float asleep_peak = 0.0f;
  float peak = 0.0f;
  const auto run = [&](float seconds, float gain) {
    const int total_frames = static_cast<int>(seconds * kSampleRate);
    peak = 0.0f;
    for (int rendered = 0; rendered < total_frames; rendered += kBlock) {
      for (int i = 0; i < kBlock; ++i) {
        const float value = gain * std::sin(phase);
        phase += kTwoPi * 330.0f / kSampleRate;
        if (phase >= kTwoPi) phase -= kTwoPi;
        device.in_left()[i] = value;
        device.in_right()[i] = value;
        awake.in_left()[i] = value;
        awake.in_right()[i] = value;
      }
      const bool slept = device.asleep() && gain == 0.0f;
      device.process(kBlock);
      awake.process(kBlock);
      for (int i = 0; i < kBlock; ++i) {
        const float level =
            std::max(std::fabs(device.out_left()[i]), std::fabs(device.out_right()[i]));
        peak = std::max(peak, level);
        if (slept) {
          asleep_peak = std::max(asleep_peak, level);
          left_out = std::max(left_out, std::max(std::fabs(awake.out_left()[i]),
                                                 std::fabs(awake.out_right()[i])));
          continue;
        }
        if (device.out_left()[i] != awake.out_left()[i] ||
            device.out_right()[i] != awake.out_right()[i]) {
          ++mismatches;
        }
        difference = std::max(difference, std::fabs(device.out_left()[i] - awake.out_left()[i]));
        difference = std::max(difference, std::fabs(device.out_right()[i] - awake.out_right()[i]));
      }
    }
  };

  run(0.25f, 0.5f);
  run(10.0f, 0.0f);
  EXPECT(!device.asleep(), "ten seconds after the sound the hold has not run out");
  run(25.0f, 0.0f);
  EXPECT(device.asleep(), "asleep once the output has been under the floor for the hold");
  run(5.0f, 0.0f);
  EXPECT(device.asleep() && asleep_peak == 0.0f, "asleep it writes exact zeros");
  EXPECT(left_out <= livemix::kit::IdleGate::kFloor,
         "what the sleep leaves out is under the gate's floor");
  EXPECT(mismatches == 0,
         "until it sleeps, every sample is the one a device that never sleeps puts out");

  // The tail's last residue stays where it was instead of fading on: the
  // next sound is the same to well under the floor.
  run(0.25f, 0.5f);
  EXPECT(!device.asleep() && peak > 0.01f, "input wakes it");
  run(2.0f, 0.0f);
  EXPECT(difference <= livemix::kit::IdleGate::kFloor,
         "after a sleep the output is the one a device that never slept puts out");

  run(30.0f, 0.0f);
  EXPECT(device.asleep(), "asleep again after the second sound");
  device.set_param(kMix, device.param_value(kMix));
  EXPECT(device.asleep(), "a parameter set to the value it has leaves it asleep");
  device.set_param(kMix, 0.8f);
  EXPECT(!device.asleep(), "a parameter that moves wakes it");
}

}  // namespace

int main() {
  test_param_table_matches_typescript();
  test_set_param_clamps_to_declared_range();
  test_input_bus_passthrough_and_clear();
  test_mix_law_is_a_levelled_balance();
  test_level_holds_as_mix_rises();
  test_impulse_produces_decaying_tail();
  test_decay_parameters_track_rt60();
  test_sample_rate_independence();
  test_stability_under_load();
  test_frames_are_clamped_to_max_block();
  test_sleeps_after_the_hold_and_wakes_unchanged();

  if (g_failures == 0) {
    std::printf("hall-reverb device tests: all passed\n");
    return 0;
  }
  std::printf("hall-reverb device tests: %d failure(s)\n", g_failures);
  return 1;
}
