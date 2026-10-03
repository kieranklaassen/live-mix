// Native harness for the FET limiter Faust device: the parameter contract
// the TypeScript table relies on, and the compressor law of
// co.limiter_1176_R4_stereo (4:1 above -6 dB on |L|+|R|, 0.8 ms attack,
// 0.5 s release). Compiled with the system C++ compiler by
// scripts/test-native.sh.

#include <algorithm>
#include <cmath>
#include <cstdio>
#include <cstring>

#include "../faust/common/faust_device.h"
#include "../faust/generated/fet-limiter.h"

namespace {

int g_failures = 0;

#define EXPECT(condition, message)                                    \
  do {                                                                \
    if (!(condition)) {                                               \
      std::printf("FAIL: %s (%s:%d)\n", message, __FILE__, __LINE__); \
      ++g_failures;                                                   \
    }                                                                 \
  } while (0)

using Device = livemix::faust::FaustDevice<livemix::faust::FetLimiter, 8>;

constexpr float kSampleRate = 48000.0f;
constexpr int kBlock = 128;
constexpr float kTwoPi = 6.28318530717958647692f;

// Ids as src/dsp/devices/faust/fet-limiter.ts declares them.
enum Param : int { kInputGain = 0, kOutputGain };

Device g_test_device;
// The same DSP behind an hour's hold: it runs every block, as the wrapper did
// before it could sleep.
using AwakeDevice = livemix::faust::FaustDevice<livemix::faust::FetLimiter, 3600>;
AwakeDevice g_awake_device;

float db_to_gain(float db) { return std::pow(10.0f, db / 20.0f); }
float gain_to_db(float gain) { return 20.0f * std::log10(gain); }

// Feeds `seconds` of a sine into both channels and returns the output peak,
// ignoring the first `skip_seconds` so attack and smoothing have settled.
float feed_tone(Device& device, float seconds, float frequency, float gain,
                float skip_seconds = 0.0f) {
  const int total_frames = static_cast<int>(seconds * kSampleRate);
  const int skip_frames = static_cast<int>(skip_seconds * kSampleRate);
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
    if (rendered >= skip_frames) {
      for (int i = 0; i < frames; ++i) {
        const float left = device.out_left()[i];
        const float right = device.out_right()[i];
        if (std::isnan(left) || std::isinf(left) || std::isnan(right) || std::isinf(right)) {
          return 1.0e9f;
        }
        peak = std::max(peak, std::max(std::fabs(left), std::fabs(right)));
      }
    }
    rendered += frames;
  }
  return peak;
}

// Steady-state output peak for a sine of amplitude `gain` in both channels.
float settled_peak(float gain, float input_gain_db = 0.0f, float output_gain_db = 0.0f) {
  Device& device = g_test_device;
  device.init(kSampleRate);
  device.set_param(kInputGain, input_gain_db);
  device.set_param(kOutputGain, output_gain_db);
  return feed_tone(device, 1.0f, 440.0f, gain, 0.5f);
}

// The library law: level = |L|+|R| in dB, gain reduction = (level + 6) * 3/4 above -6 dB.
float expected_peak(float gain) {
  const float level_db = gain_to_db(2.0f * gain);
  const float over_db = std::max(0.0f, level_db + 6.0f);
  return gain * db_to_gain(-over_db * 0.75f);
}

void test_param_table_matches_typescript() {
  Device& device = g_test_device;
  device.init(kSampleRate);
  EXPECT(device.param_count() == 2, "fet-limiter exposes two parameters");
  EXPECT(std::strcmp(device.param(kInputGain).label, "Input gain") == 0, "id 0 is input gain");
  EXPECT(device.param(kInputGain).min == 0.0f && device.param(kInputGain).max == 40.0f,
         "input gain spans 0..40 dB");
  EXPECT(device.param(kInputGain).init == 0.0f, "input gain defaults to 0 dB");
  EXPECT(std::strcmp(device.param(kOutputGain).label, "Output gain") == 0,
         "id 1 is output gain");
  EXPECT(device.param(kOutputGain).min == -24.0f && device.param(kOutputGain).max == 24.0f,
         "output gain spans -24..24 dB");
  EXPECT(device.param(kOutputGain).init == 0.0f, "output gain defaults to 0 dB");

  device.set_param(kInputGain, 100.0f);
  EXPECT(device.param_value(kInputGain) == 40.0f, "input gain clamps to 40 dB");
  device.set_param(kOutputGain, -100.0f);
  EXPECT(device.param_value(kOutputGain) == -24.0f, "output gain clamps to -24 dB");
}

void test_quiet_signal_passes_unchanged() {
  // 0.1 in both channels is |L|+|R| = 0.2 = -14 dB, well under the -6 dB threshold.
  const float peak = settled_peak(0.1f);
  EXPECT(std::fabs(peak - 0.1f) < 2.0e-3f, "below threshold the limiter is unity gain");
}

void test_hot_signal_is_capped() {
  // Full-scale in both channels is +6 dB on the detector: 12 dB over, 9 dB of reduction.
  const float peak = settled_peak(1.0f);
  EXPECT(peak < 0.5f, "a full-scale sine comes out well under half scale");
  EXPECT(std::fabs(peak - expected_peak(1.0f)) < 0.03f, "9 dB of gain reduction at 0 dBFS");

  // +12 dB in (amplitude 4) still leaves a peak near half scale.
  const float hot_peak = settled_peak(4.0f);
  EXPECT(hot_peak < 0.6f, "+12 dBFS input stays capped near half scale");
  EXPECT(std::fabs(hot_peak - expected_peak(4.0f)) < 0.05f, "18 dB of gain reduction at +12 dBFS");
}

void test_four_to_one_ratio() {
  // 12 dB more input yields 3 dB more output.
  const float ratio_db = gain_to_db(settled_peak(4.0f) / settled_peak(1.0f));
  EXPECT(std::fabs(ratio_db - 3.0f) < 0.4f, "output grows 3 dB per 12 dB of input (4:1)");
}

void test_input_gain_drives_the_threshold() {
  // 0.1 with +20 dB of input gain hits the detector like 1.0 does.
  const float driven = settled_peak(0.1f, 20.0f);
  const float direct = settled_peak(1.0f);
  EXPECT(std::fabs(driven - direct) < 0.02f, "+20 dB input gain equals a 20 dB hotter signal");
}

void test_output_gain_is_make_up() {
  const float unity = settled_peak(1.0f);
  const float lifted = settled_peak(1.0f, 0.0f, 6.0f);
  const float lowered = settled_peak(1.0f, 0.0f, -6.0f);
  EXPECT(std::fabs(gain_to_db(lifted / unity) - 6.0f) < 0.1f, "+6 dB output gain lifts 6 dB");
  EXPECT(std::fabs(gain_to_db(lowered / unity) + 6.0f) < 0.1f, "-6 dB output gain drops 6 dB");
}

void test_attack_and_release_shape() {
  Device& device = g_test_device;
  device.init(kSampleRate);
  feed_tone(device, 0.5f, 440.0f, 0.1f);  // settle the gain smoothers below threshold

  // The 0.8 ms attack lets the first cycle through hotter than the settled level.
  const float onset_peak = feed_tone(device, 0.002f, 440.0f, 1.0f);
  const float settled = feed_tone(device, 0.5f, 440.0f, 1.0f, 0.25f);
  EXPECT(onset_peak > settled, "attack lets the onset through before clamping");

  // Back to quiet: the 0.5 s release recovers unity gain within a couple of seconds.
  const float recovered = feed_tone(device, 2.0f, 440.0f, 0.1f, 1.5f);
  EXPECT(std::fabs(recovered - 0.1f) < 2.0e-3f, "release returns to unity after the hot passage");
}

// The compressor's attack lets a transient through at the height the input
// gain gave it; the ceiling after it is what limits. One sample at -6 dBFS
// used to leave at +6 dBFS with 12 dB of input gain and +18 dBFS with 24.
void test_transients_stop_at_full_scale() {
  Device& device = g_test_device;
  for (float input_gain_db : {12.0f, 24.0f, 40.0f}) {
    device.init(kSampleRate);
    device.set_param(kInputGain, input_gain_db);
    feed_tone(device, 0.1f, 440.0f, 0.0f);  // let the gain smoothers settle
    float peak = 0.0f;
    for (int block = 0; block < 8; ++block) {
      for (int i = 0; i < kBlock; ++i) {
        const float click = (block == 1 && i == 7) ? 0.5f : 0.0f;
        device.in_left()[i] = click;
        device.in_right()[i] = -click;
      }
      device.process(kBlock);
      for (int i = 0; i < kBlock; ++i) {
        peak = std::max(peak, std::max(std::fabs(device.out_left()[i]), std::fabs(device.out_right()[i])));
      }
    }
    EXPECT(peak <= 1.0f, "a click never leaves above full scale, whatever the input gain");
    EXPECT(peak > 0.9f, "and is not held any lower than the ceiling");

    // A burst too short for the attack: the same ceiling.
    device.init(kSampleRate);
    device.set_param(kInputGain, input_gain_db);
    feed_tone(device, 0.1f, 440.0f, 0.0f);
    EXPECT(feed_tone(device, 0.001f, 1000.0f, 0.5f) <= 1.0f, "a 1 ms burst stays under full scale");
  }

  // Up to half scale the ceiling is a wire, which is where the compressor
  // holds a steady signal: the law tests above all sit there. Driven as hard
  // as it goes, a full-scale tone settles under the ceiling.
  device.init(kSampleRate);
  device.set_param(kInputGain, 40.0f);
  const float flat_out = feed_tone(device, 1.0f, 440.0f, 1.0f, 0.5f);
  EXPECT(flat_out < 1.0f && flat_out > 0.8f, "40 dB of drive on a full-scale tone settles just under full scale");
}

void test_input_bus_clears_between_blocks() {
  Device& device = g_test_device;
  device.init(kSampleRate);
  feed_tone(device, 0.2f, 440.0f, 0.1f);
  for (int i = 0; i < kBlock; ++i) {
    device.in_left()[i] = 0.1f;
    device.in_right()[i] = 0.1f;
  }
  device.process(kBlock);
  device.process(kBlock);
  float residual = 0.0f;
  for (int i = 0; i < kBlock; ++i) residual = std::max(residual, std::fabs(device.out_left()[i]));
  EXPECT(residual == 0.0f, "input bus should clear between blocks");
}

void test_stability_under_load() {
  Device& device = g_test_device;
  device.init(kSampleRate);
  device.set_param(kInputGain, 40.0f);
  const float peak = feed_tone(device, 10.0f, 55.0f, 4.0f);
  EXPECT(peak <= 1.0f, "40 dB of drive into +12 dBFS stays under full scale");
  EXPECT(peak < 1.0e8f, "no NaN/inf during sustained processing");
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

  run(0.5f, 1.0f);
  run(4.0f, 0.0f);
  EXPECT(!device.asleep() && peak == 0.0f,
         "silent at once, but up for the hold while the detector releases");
  run(6.0f, 0.0f);
  EXPECT(device.asleep(), "asleep once the hold has run out");
  run(5.0f, 0.0f);
  EXPECT(device.asleep() && asleep_peak == 0.0f && left_out == 0.0f,
         "asleep it writes the exact zeros the limiter itself would");
  EXPECT(mismatches == 0,
         "until it sleeps, every sample is the one a device that never sleeps puts out");

  // The detector's last 139 dB stay where they were instead of fading on:
  // the next sound is the same to a millionth.
  run(0.5f, 1.0f);
  EXPECT(!device.asleep() && peak > 0.1f, "input wakes it");
  EXPECT(difference < 1.0e-6f,
         "after a sleep the output is the one a device that never slept puts out");

  run(10.0f, 0.0f);
  EXPECT(device.asleep(), "asleep again after the second sound");
  device.set_param(kOutputGain, device.param_value(kOutputGain));
  EXPECT(device.asleep(), "a parameter set to the value it has leaves it asleep");
  device.set_param(kOutputGain, 6.0f);
  EXPECT(!device.asleep(), "a parameter that moves wakes it");
}

}  // namespace

int main() {
  test_param_table_matches_typescript();
  test_quiet_signal_passes_unchanged();
  test_hot_signal_is_capped();
  test_four_to_one_ratio();
  test_input_gain_drives_the_threshold();
  test_output_gain_is_make_up();
  test_attack_and_release_shape();
  test_transients_stop_at_full_scale();
  test_input_bus_clears_between_blocks();
  test_stability_under_load();
  test_sleeps_after_the_hold_and_wakes_unchanged();

  if (g_failures == 0) {
    std::printf("fet-limiter device tests: all passed\n");
    return 0;
  }
  std::printf("fet-limiter device tests: %d failure(s)\n", g_failures);
  return 1;
}
