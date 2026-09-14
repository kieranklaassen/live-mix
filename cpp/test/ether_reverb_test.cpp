// Native parity harness for the Ether reverb device (Freeverb as juce::Reverb
// runs it, plus Ether's pre-delay, decay law and freeze). Covers Freeverb's
// line lengths at three sample rates, Ether's decay -> roomSize/damping law,
// the linear mix law and input-bus contract, onset at the shortest comb and
// with pre-delay, a tail that decays and whose RT60 grows with decay and size
// and is sample-rate independent, damping darkening the tail, freeze holding
// energy and muting the input and dry, stability under loud input, the tail
// flushing to exact zero, 5 ms host ramps and the CPU cost.
// Compiled with the system C++ compiler by scripts/test-native.sh.

#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdio>

#include "../devices/ether-reverb/ether_reverb_device.h"

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

using livemix::EtherReverbDevice;
using livemix::EtherReverbParam;
using livemix::Freeverb;

EtherReverbDevice g_test_device;

void init_wet(EtherReverbDevice& device, float sample_rate = kSampleRate) {
  device.init(sample_rate);
  device.set_param(EtherReverbParam::kMix, 1.0f);
}

// Renders `seconds` of silence; returns the peak across both outputs and the
// left RMS/mean when asked. NaN/inf poison the peak.
float render_seconds(EtherReverbDevice& device, float seconds, float sample_rate,
                     float* rms_out = nullptr, float* mean_out = nullptr) {
  const int total = static_cast<int>(seconds * sample_rate);
  float peak = 0.0f;
  double sum_squares = 0.0;
  double sum = 0.0;
  int rendered = 0;
  while (rendered < total) {
    const int frames = std::min(kBlock, total - rendered);
    device.process(frames);
    for (int i = 0; i < frames; ++i) {
      const float l = device.out_left()[i];
      const float r = device.out_right()[i];
      if (std::isnan(l) || std::isinf(l) || std::isnan(r) || std::isinf(r)) return 1.0e9f;
      peak = std::max(peak, std::max(std::fabs(l), std::fabs(r)));
      sum_squares += static_cast<double>(l) * l;
      sum += l;
    }
    rendered += frames;
  }
  if (rms_out != nullptr) *rms_out = static_cast<float>(std::sqrt(sum_squares / total));
  if (mean_out != nullptr) *mean_out = static_cast<float>(sum / total);
  return peak;
}

float feed_tone(EtherReverbDevice& device, float seconds, float frequency, float gain,
                float sample_rate = kSampleRate) {
  const int total = static_cast<int>(seconds * sample_rate);
  float phase = 0.0f;
  const float increment = kTwoPi * frequency / sample_rate;
  float peak = 0.0f;
  int rendered = 0;
  while (rendered < total) {
    const int frames = std::min(kBlock, total - rendered);
    for (int i = 0; i < frames; ++i) {
      const float value = gain * std::sin(phase);
      phase += increment;
      if (phase >= kTwoPi) phase -= kTwoPi;
      device.in_left()[i] = value;
      device.in_right()[i] = value;
    }
    device.process(frames);
    for (int i = 0; i < frames; ++i) {
      const float l = device.out_left()[i];
      if (std::isnan(l) || std::isinf(l)) return 1.0e9f;
      peak = std::max(peak, std::fabs(l));
    }
    rendered += frames;
  }
  return peak;
}

// Schroeder-style RT60: a 200 Hz burst, then a least-squares fit of the
// tail's RMS in dB over 250 ms windows after 0.3 s.
float measure_rt60(float decay_seconds, float sample_rate, float size = 0.6f,
                   float damping = 0.0f) {
  EtherReverbDevice& device = g_test_device;
  init_wet(device, sample_rate);
  device.set_param(EtherReverbParam::kDamping, damping);
  device.set_param(EtherReverbParam::kDecay, decay_seconds);
  device.set_param(EtherReverbParam::kSize, size);
  feed_tone(device, 0.05f, 200.0f, 1.0f, sample_rate);
  render_seconds(device, 0.3f, sample_rate);

  const float window = 0.25f;
  const int windows = 8;
  double n = 0.0, sum_t = 0.0, sum_db = 0.0, sum_tt = 0.0, sum_tdb = 0.0;
  for (int w = 0; w < windows; ++w) {
    float rms = 0.0f;
    render_seconds(device, window, sample_rate, &rms);
    const double t = w * window;
    const double db = 20.0 * std::log10(static_cast<double>(rms) + 1.0e-30);
    n += 1.0;
    sum_t += t;
    sum_db += db;
    sum_tt += t * t;
    sum_tdb += t * db;
  }
  const double slope = (n * sum_tdb - sum_t * sum_db) / (n * sum_tt - sum_t * sum_t);
  return static_cast<float>(-60.0 / slope);
}

int measure_onset(EtherReverbDevice& device, int channel = 0) {
  device.in_left()[0] = 1.0f;
  device.in_right()[0] = 1.0f;
  int position = 0;
  while (position < static_cast<int>(kSampleRate)) {
    device.process(kBlock);
    const float* out = channel == 0 ? device.out_left() : device.out_right();
    for (int i = 0; i < kBlock; ++i) {
      if (std::fabs(out[i]) > 1.0e-7f) return position + i;
    }
    position += kBlock;
  }
  return -1;
}

void test_freeverb_line_lengths() {
  EtherReverbDevice& device = g_test_device;
  const int comb_44k[8] = {1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617};
  const int allpass_44k[4] = {556, 441, 341, 225};

  device.init(44100.0f);
  bool ok = true;
  for (int i = 0; i < 8; ++i) {
    ok = ok && device.reverb().comb_size(0, i) == comb_44k[i];
    ok = ok && device.reverb().comb_size(1, i) == comb_44k[i] + 23;
  }
  for (int i = 0; i < 4; ++i) {
    ok = ok && device.reverb().allpass_size(0, i) == allpass_44k[i];
    ok = ok && device.reverb().allpass_size(1, i) == allpass_44k[i] + 23;
  }
  EXPECT(ok, "at 44.1 kHz the lines are Freeverb's tunings, right channel +23");

  device.init(48000.0f);
  EXPECT(device.reverb().comb_size(0, 0) == (48000 * 1116) / 44100,
         "48 kHz comb lengths use juce::Reverb's integer scaling");
  EXPECT(device.reverb().comb_size(1, 7) == (48000 * (1617 + 23)) / 44100,
         "48 kHz right-channel comb lengths include the spread before scaling");
  device.init(96000.0f);
  EXPECT(device.reverb().comb_size(1, 7) == (96000 * 1640) / 44100 &&
             device.reverb().comb_size(1, 7) < Freeverb::kMaxCombSamples,
         "96 kHz longest comb fits its buffer");
  EXPECT(device.reverb().allpass_size(1, 0) == (96000 * 579) / 44100 &&
             device.reverb().allpass_size(1, 0) < Freeverb::kMaxAllpassSamples,
         "96 kHz longest allpass fits its buffer");
}

void test_ether_parameter_law() {
  // decayFactor = (decay - 0.5) / 29.5; roomSize = min(1, size + 0.3 f);
  // damping = max(0, damping - 0.2 f); Freeverb: feedback = room*0.28+0.7.
  const auto defaults = EtherReverbDevice::reverb_parameters_for(5.0f, 0.6f, 0.4f, false);
  const float f = (5.0f - 0.5f) / 29.5f;
  EXPECT(std::fabs(defaults.room_size - (0.6f + 0.3f * f)) < 1.0e-6f, "default roomSize follows decay");
  EXPECT(std::fabs(defaults.damping - (0.4f - 0.2f * f)) < 1.0e-6f, "default damping follows decay");
  EXPECT(defaults.wet_level == 1.0f && defaults.dry_level == 0.0f && defaults.width == 1.0f,
         "Ether runs the reverb fully wet and mixes itself");
  EXPECT(defaults.freeze_mode == 0.0f, "not frozen by default");

  const auto long_decay = EtherReverbDevice::reverb_parameters_for(30.0f, 0.9f, 0.1f, false);
  EXPECT(long_decay.room_size == 1.0f, "roomSize clamps at 1");
  EXPECT(long_decay.damping == 0.0f, "damping clamps at 0");

  const auto frozen = EtherReverbDevice::reverb_parameters_for(5.0f, 0.6f, 0.4f, true);
  EXPECT(frozen.room_size == 0.999f && frozen.damping == 0.0f && frozen.freeze_mode == 1.0f,
         "freeze forces roomSize 0.999, damping 0, freezeMode 1");

  EtherReverbDevice& device = g_test_device;
  device.init(kSampleRate);
  EXPECT(std::fabs(device.reverb().current_feedback() - (defaults.room_size * 0.28f + 0.7f)) < 1.0e-6f,
         "Freeverb feedback is roomSize * 0.28 + 0.7");
  EXPECT(std::fabs(device.reverb().current_damping() - defaults.damping * 0.4f) < 1.0e-6f,
         "Freeverb damping is damping * 0.4");
  EXPECT(device.reverb().input_gain() == 0.015f, "Freeverb fixed input gain 0.015");
  EXPECT(std::fabs(device.mix() - 0.3f) < 1.0e-6f && std::fabs(device.decay_seconds() - 5.0f) < 1.0e-6f &&
             std::fabs(device.size() - 0.6f) < 1.0e-6f && std::fabs(device.damping() - 0.4f) < 1.0e-6f &&
             device.predelay_ms() == 0.0f && !device.frozen(),
         "device defaults are Ether's (decay 5, size 0.6, damping 0.4, mix 0.3, pre-delay 0)");
}

void test_input_bus_passthrough_and_clear() {
  EtherReverbDevice& device = g_test_device;
  device.init(kSampleRate);
  device.set_param(EtherReverbParam::kMix, 0.0f);

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

void test_mix_law_is_linear() {
  // Ether: out = dry * (1 - mix) + wet * mix, and no wet before the shortest
  // comb has delivered a sample.
  EtherReverbDevice& device = g_test_device;
  device.init(kSampleRate);
  device.in_left()[0] = 1.0f;
  device.in_right()[0] = 0.5f;
  device.process(1);
  EXPECT(std::fabs(device.out_left()[0] - 0.7f) < 1.0e-6f, "left dry scaled by 1 - mix (0.3)");
  EXPECT(std::fabs(device.out_right()[0] - 0.35f) < 1.0e-6f, "right dry scaled by 1 - mix (0.3)");
}

void test_onset_is_shortest_comb_plus_predelay() {
  EtherReverbDevice& device = g_test_device;
  init_wet(device);
  const int left_onset = measure_onset(device, 0);
  EXPECT(left_onset == (48000 * 1116) / 44100, "left wet onset is the shortest comb (1214 at 48 kHz)");
  init_wet(device);
  const int right_onset = measure_onset(device, 1);
  EXPECT(right_onset == (48000 * 1139) / 44100, "right wet onset is 23 spread samples later (1239)");

  init_wet(device);
  device.set_param(EtherReverbParam::kPredelayMs, 100.0f);
  EXPECT(measure_onset(device, 0) == left_onset + 4800, "100 ms pre-delay shifts the onset by 4800 samples");

  // Fractional pre-delay interpolates linearly: 0.5 samples of delay on an
  // impulse yields two half-height samples.
  init_wet(device);
  device.set_param(EtherReverbParam::kPredelayMs, 0.5f / 48.0f);  // 0.5 samples
  const int onset_half = measure_onset(device, 0);
  EXPECT(onset_half == left_onset, "half a sample of pre-delay keeps the first onset sample");
}

void test_tail_decays_and_rt60_tracks_decay() {
  EtherReverbDevice& device = g_test_device;
  init_wet(device);
  feed_tone(device, 0.05f, 880.0f, 1.0f);
  float early = 0.0f, late = 0.0f;
  render_seconds(device, 0.5f, kSampleRate, &early);
  render_seconds(device, 2.0f, kSampleRate);
  render_seconds(device, 0.5f, kSampleRate, &late);
  EXPECT(early > 1.0e-4f, "the tail carries energy at 0.5 s");
  EXPECT(late < early, "the tail decays");

  // Freeverb's RT60 is not the decay knob in seconds: decay raises roomSize
  // (feedback 0.7..0.98) and lowers damping. Monotonic, and size adds to it.
  const float rt60_1 = measure_rt60(1.0f, kSampleRate);
  const float rt60_5 = measure_rt60(5.0f, kSampleRate);
  const float rt60_30 = measure_rt60(30.0f, kSampleRate);
  EXPECT(rt60_1 < rt60_5 && rt60_5 < rt60_30, "RT60 grows monotonically with decay");
  EXPECT(rt60_1 > 0.2f && rt60_1 < 2.0f, "decay 1 s at size 0.6 is a short room");
  EXPECT(rt60_30 > 2.0f && rt60_30 < 20.0f, "decay 30 s (roomSize 0.9, feedback 0.952) is a long hall");

  const float rt60_small = measure_rt60(5.0f, kSampleRate, 0.2f);
  const float rt60_large = measure_rt60(5.0f, kSampleRate, 1.0f);
  EXPECT(rt60_small < rt60_5 && rt60_5 < rt60_large, "size lengthens the tail");

  const float rt60_44k = measure_rt60(5.0f, 44100.0f);
  const float rt60_96k = measure_rt60(5.0f, 96000.0f);
  EXPECT(std::fabs(rt60_44k - rt60_5) < 0.15f * rt60_5, "RT60 is sample-rate independent (44.1 vs 48 kHz)");
  EXPECT(std::fabs(rt60_96k - rt60_5) < 0.15f * rt60_5, "RT60 is sample-rate independent (96 vs 48 kHz)");
}

void test_damping_darkens_tail() {
  const auto tail_rms = [](float damping) {
    EtherReverbDevice& device = g_test_device;
    init_wet(device);
    device.set_param(EtherReverbParam::kDamping, damping);
    device.in_left()[0] = 1.0f;
    device.in_right()[0] = 1.0f;
    device.process(1);
    render_seconds(device, 0.5f, kSampleRate);
    float rms = 0.0f;
    render_seconds(device, 1.0f, kSampleRate, &rms);
    return rms;
  };
  const float bright = tail_rms(0.0f);
  const float ether = tail_rms(0.4f);
  const float dark = tail_rms(1.0f);
  EXPECT(bright > ether && ether > dark, "more damping removes more tail energy");
  EXPECT(dark < bright * 0.5f, "full damping at least halves the impulse tail RMS");
}

void test_freeze_holds_energy_and_mutes_input() {
  EtherReverbDevice& device = g_test_device;
  device.init(kSampleRate);
  device.set_param(EtherReverbParam::kMix, 0.5f);
  feed_tone(device, 0.5f, 440.0f, 0.5f);
  device.set_param(EtherReverbParam::kFreeze, 1.0f);
  EXPECT(device.frozen(), "freeze engages at >= 0.5");
  render_seconds(device, 0.1f, kSampleRate);  // ramps settle
  EXPECT(device.reverb().current_feedback() == 1.0f && device.reverb().current_damping() == 0.0f &&
             device.reverb().input_gain() == 0.0f,
         "frozen Freeverb: feedback 1, damping 0, input gain 0");

  float rms_a = 0.0f, rms_b = 0.0f;
  render_seconds(device, 2.0f, kSampleRate, &rms_a);
  render_seconds(device, 4.0f, kSampleRate);
  render_seconds(device, 2.0f, kSampleRate, &rms_b);
  EXPECT(rms_a > 1.0e-3f, "frozen tail is audible");
  EXPECT(std::fabs(rms_b - rms_a) < 0.1f * rms_a, "frozen tail holds its level over 8 s (lossless combs)");

  device.set_param(EtherReverbParam::kFreeze, 0.0f);
  render_seconds(device, 6.0f, kSampleRate);
  float rms_d = 0.0f;
  render_seconds(device, 2.0f, kSampleRate, &rms_d);
  EXPECT(rms_d < 0.5f * rms_a, "unfreezing lets the tail decay again");

  // Frozen from the start: input reaches neither the reverb nor the dry path,
  // so a loud block produces exact silence once the 5 ms dry ramp is done.
  device.init(kSampleRate);
  device.set_param(EtherReverbParam::kFreeze, 1.0f);
  float peak = 0.0f;
  for (int block = 0; block < 40; ++block) {
    for (int i = 0; i < kBlock; ++i) {
      device.in_left()[i] = 0.9f;
      device.in_right()[i] = 0.9f;
    }
    device.process(kBlock);
    if (block >= 4) {
      for (int i = 0; i < kBlock; ++i) peak = std::max(peak, std::fabs(device.out_left()[i]));
    }
  }
  EXPECT(peak == 0.0f, "while frozen neither the input nor the dry reaches the output");
  EXPECT(device.reverb().is_silent_state(), "input while frozen never enters the combs");
}

void test_stability_under_loud_input() {
  EtherReverbDevice& device = g_test_device;
  device.init(kSampleRate);
  device.set_param(EtherReverbParam::kDecay, 30.0f);
  device.set_param(EtherReverbParam::kSize, 1.0f);
  device.set_param(EtherReverbParam::kDamping, 0.0f);
  device.set_param(EtherReverbParam::kMix, 1.0f);
  // Eight stacked partials at 0.4 for 10 s (peaks above 1.0 into the combs).
  float phases[8] = {};
  float peak = 0.0f;
  const int total = static_cast<int>(10.0f * kSampleRate);
  int rendered = 0;
  while (rendered < total) {
    const int frames = std::min(kBlock, total - rendered);
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
      const float l = device.out_left()[i];
      if (std::isnan(l) || std::isinf(l)) peak = 1.0e9f;
      peak = std::max(peak, std::fabs(l));
    }
    rendered += frames;
  }
  EXPECT(peak < 1.0e8f, "no NaN/inf during 10 s of loud input at maximum feedback");
  // Freeverb has no limiter (nor does Ether): at feedback 0.98 a resonant comb
  // gains up to 50x on 0.015 * (L + R); the wet scale is 3.
  EXPECT(peak < 8.0f, "wet output stays within Freeverb's linear gain bound");
  std::printf("ether-reverb loud-input wet peak (feedback 0.98, mix 1): %.2f\n", peak);
}

void test_tail_flushes_to_exact_zero() {
  // Where juce::Reverb's JUCE_UNDENORMALISE leaves a -116 dBFS limit cycle,
  // flush_denormal lets the loop decay below 1e-15 and snap to zero.
  EtherReverbDevice& device = g_test_device;
  init_wet(device);
  device.set_param(EtherReverbParam::kDecay, 0.5f);
  device.set_param(EtherReverbParam::kSize, 0.0f);
  feed_tone(device, 0.05f, 440.0f, 1.0f);
  render_seconds(device, 3.0f, kSampleRate);
  float rms = 0.0f;
  render_seconds(device, 1.0f, kSampleRate, &rms);
  EXPECT(rms < 1.0e-9f, "after 4 s a 0.5 s decay is below -180 dBFS, not idling at -116");
  render_seconds(device, 12.0f, kSampleRate);
  EXPECT(device.reverb().is_silent_state(), "every comb and allpass sample is exact zero after the tail");
  const float peak = render_seconds(device, 0.1f, kSampleRate);
  EXPECT(peak == 0.0f, "a flushed reverb outputs exact zeros");
}

void test_host_gains_ramp() {
  // DC input at mix 0, then mix jumps to 1: the dry gain ramps down over 5 ms
  // rather than stepping (Ether steps; live-mix smooths).
  EtherReverbDevice& device = g_test_device;
  device.init(kSampleRate);
  device.set_param(EtherReverbParam::kMix, 0.0f);
  for (int i = 0; i < kBlock; ++i) {
    device.in_left()[i] = 0.5f;
    device.in_right()[i] = 0.5f;
  }
  device.process(kBlock);
  device.set_param(EtherReverbParam::kMix, 1.0f);
  float previous = 0.5f;
  float max_step = 0.0f;
  for (int block = 0; block < 4; ++block) {
    for (int i = 0; i < kBlock; ++i) {
      device.in_left()[i] = 0.5f;
      device.in_right()[i] = 0.5f;
    }
    device.process(kBlock);
    for (int i = 0; i < kBlock; ++i) {
      max_step = std::max(max_step, std::fabs(device.out_left()[i] - previous));
      previous = device.out_left()[i];
    }
  }
  EXPECT(max_step < 0.02f, "a mix jump ramps over 5 ms (no per-sample step above 0.02)");
  EXPECT(std::fabs(previous) < 0.01f, "after 10 ms the dry is gone (wet has not arrived yet)");
}

void report_cpu_cost() {
  EtherReverbDevice& device = g_test_device;
  device.init(kSampleRate);
  feed_tone(device, 1.0f, 220.0f, 0.5f);
  const float seconds = 10.0f;
  const auto start = std::chrono::steady_clock::now();
  feed_tone(device, seconds, 220.0f, 0.5f);
  const auto end = std::chrono::steady_clock::now();
  const double elapsed = std::chrono::duration<double>(end - start).count();
  const double blocks = seconds * kSampleRate / kBlock;
  std::printf("ether-reverb cost: %.1f us per 128-frame stereo block, %.2f%% of real time at 48 kHz (native)\n",
              elapsed / blocks * 1.0e6, elapsed / seconds * 100.0);
}

}  // namespace

int main() {
  test_freeverb_line_lengths();
  test_ether_parameter_law();
  test_input_bus_passthrough_and_clear();
  test_mix_law_is_linear();
  test_onset_is_shortest_comb_plus_predelay();
  test_tail_decays_and_rt60_tracks_decay();
  test_damping_darkens_tail();
  test_freeze_holds_energy_and_mutes_input();
  test_stability_under_loud_input();
  test_tail_flushes_to_exact_zero();
  test_host_gains_ramp();
  report_cpu_cost();

  if (g_failures == 0) {
    std::printf("ether-reverb device tests: all passed\n");
    return 0;
  }
  std::printf("ether-reverb device tests: %d failure(s)\n", g_failures);
  return 1;
}
