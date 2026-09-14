// Native parity harness for the FDN reverb device (Tides extraction). Covers
// the Tides law and feedback formula, RT60 tracking the decay parameter at
// three sample rates, size and pre-delay onset scaling, stability at maximum
// feedback, no DC drift, bounded breath modulation, denormal flushing and the
// input-bus contract. Compiled with the system C++ compiler by
// scripts/test-native.sh.

#include <algorithm>
#include <cmath>
#include <cstdio>

#include "../devices/fdn-reverb/fdn_reverb_device.h"

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

livemix::FdnReverbDevice g_test_device;

// 100 % wet, no breathing: the plain FDN under test unless a test says so.
void init_wet(livemix::FdnReverbDevice& device, float sample_rate = kSampleRate) {
  device.init(sample_rate);
  device.set_param(livemix::FdnReverbParam::kMix, 1.0f);
  device.set_param(livemix::FdnReverbParam::kBreathDepth, 0.0f);
}

// Renders `seconds` of silence input, returning the peak absolute output and
// optionally the left-channel RMS and mean. NaN/inf poison the peak.
float render_seconds(livemix::FdnReverbDevice& device, float seconds, float sample_rate,
                     float* rms_out = nullptr, float* mean_out = nullptr) {
  const int total_frames = static_cast<int>(seconds * sample_rate);
  float peak = 0.0f;
  double sum_squares = 0.0;
  double sum = 0.0;
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
      sum += left[i];
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
  if (mean_out != nullptr) *mean_out = static_cast<float>(sum / total_frames);
  return peak;
}

// Feeds `seconds` of a sine tone into both input channels; returns the peak
// left output during the tone.
float feed_tone(livemix::FdnReverbDevice& device, float seconds, float frequency, float gain,
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

// Schroeder-style RT60: 200 Hz burst, then a least-squares fit of the tail's
// RMS in dB over 250 ms windows from 0.5 s onward. Low tone and no damping so
// the loop's only intended loss is the RT60 feedback gain.
float measure_rt60(float decay_seconds, float sample_rate, float size = 1.0f) {
  livemix::FdnReverbDevice& device = g_test_device;
  init_wet(device, sample_rate);
  device.set_param(livemix::FdnReverbParam::kDamping, 0.0f);
  device.set_param(livemix::FdnReverbParam::kDecay, decay_seconds);
  device.set_param(livemix::FdnReverbParam::kSize, size);
  feed_tone(device, 0.05f, 200.0f, 1.0f, sample_rate);
  render_seconds(device, 0.5f, sample_rate);

  const float window = 0.25f;
  int windows = static_cast<int>(2.0f * decay_seconds / window);
  windows = std::max(6, std::min(windows, 24));
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

// First output sample index with wet energy after a unit impulse.
int measure_onset(livemix::FdnReverbDevice& device) {
  device.in_left()[0] = 1.0f;
  device.in_right()[0] = 1.0f;
  int position = 0;
  while (position < static_cast<int>(kSampleRate)) {
    device.process(kBlock);
    for (int i = 0; i < kBlock; ++i) {
      if (std::fabs(device.out_left()[i]) > 1.0e-6f) return position + i;
    }
    position += kBlock;
  }
  return -1;
}

void test_breath_law_matches_tides() {
  using livemix::FdnReverb;
  // sin(2*pi*0.25) = 1 -> breathMod 1 -> no attenuation; 0.75 -> full depth.
  EXPECT(std::fabs(FdnReverb::breath_law(0.25f, 0.6f) - 1.0f) < 1.0e-6f,
         "breath law is 1 at the LFO peak");
  EXPECT(std::fabs(FdnReverb::breath_law(0.75f, 0.6f) - 0.4f) < 1.0e-6f,
         "breath law is 1 - depth at the LFO trough");
  bool bounded = true;
  for (int i = 0; i < 1000; ++i) {
    const float value = FdnReverb::breath_law(i / 1000.0f, 1.0f);
    if (value < -1.0e-6f || value > 1.0f + 1.0e-6f) bounded = false;
  }
  EXPECT(bounded, "breath law stays within [1 - depth, 1] over a full cycle");

  EXPECT(std::fabs(FdnReverb::feedback_gain_for(0.3f, 0.1f) - 0.1f) < 1.0e-6f,
         "RT60 of three loop times gives -20 dB per pass");
  EXPECT(FdnReverb::feedback_gain_for(20.0f, 0.001f) == 0.98f,
         "feedback gain clamps at Tides' 0.98");
}

void test_reverb_tail_exists_and_decays() {
  livemix::FdnReverbDevice& device = g_test_device;
  init_wet(device);

  feed_tone(device, 0.05f, 880.0f, 1.0f);

  float rms_early = 0.0f;
  render_seconds(device, 0.5f, kSampleRate, &rms_early);
  float rms_mid = 0.0f;
  render_seconds(device, 0.5f, kSampleRate, &rms_mid);
  render_seconds(device, 1.5f, kSampleRate);
  float rms_late = 0.0f;
  render_seconds(device, 0.5f, kSampleRate, &rms_late);

  EXPECT(rms_early > 1.0e-5f, "reverb tail should carry energy at 0.5s");
  EXPECT(rms_mid > 0.0f, "reverb tail should still be audible after 1s");
  EXPECT(rms_late < rms_early, "reverb tail should decay over time");
}

void test_rt60_tracks_decay_parameter() {
  // Measured RT60 runs a little short of nominal (DC blocker and tanh add
  // loss per pass; the fit spans the mixed early modes), so accept 0.7..1.15.
  const float rt60_1 = measure_rt60(1.0f, kSampleRate);
  const float rt60_2 = measure_rt60(2.0f, kSampleRate);
  const float rt60_5 = measure_rt60(5.0f, kSampleRate);
  EXPECT(rt60_1 > 0.7f && rt60_1 < 1.15f, "decay=1s measures an RT60 near 1s");
  EXPECT(rt60_2 > 1.4f && rt60_2 < 2.3f, "decay=2s measures an RT60 near 2s");
  EXPECT(rt60_5 > 3.5f && rt60_5 < 5.75f, "decay=5s measures an RT60 near 5s");
  EXPECT(rt60_1 < rt60_2 && rt60_2 < rt60_5, "RT60 grows monotonically with decay");

  const float rt60_44k = measure_rt60(2.0f, 44100.0f);
  const float rt60_96k = measure_rt60(2.0f, 96000.0f);
  EXPECT(std::fabs(rt60_44k - rt60_2) < 0.2f * rt60_2,
         "RT60 is sample-rate independent (44.1 kHz vs 48 kHz)");
  EXPECT(std::fabs(rt60_96k - rt60_2) < 0.2f * rt60_2,
         "RT60 is sample-rate independent (96 kHz vs 48 kHz)");

  const float rt60_small = measure_rt60(2.0f, kSampleRate, 0.5f);
  const float rt60_large = measure_rt60(2.0f, kSampleRate, 2.0f);
  EXPECT(std::fabs(rt60_small - rt60_2) < 0.15f * rt60_2,
         "size 0.5 keeps the RT60 (feedback gain follows the scaled delays)");
  EXPECT(std::fabs(rt60_large - rt60_2) < 0.15f * rt60_2,
         "size 2 keeps the RT60 (feedback gain follows the scaled delays)");
}

void test_size_and_predelay_scale_onset() {
  livemix::FdnReverbDevice& device = g_test_device;
  // Shortest line is 4799 samples at 44.1 kHz -> 5223 at 48 kHz, +/-12 mod.
  const int expected_base = static_cast<int>(4799 * kSampleRate / 44100.0f);

  init_wet(device);
  const int onset_1 = measure_onset(device);
  EXPECT(std::abs(onset_1 - expected_base) <= 16, "size 1 onset is the shortest coprime delay");

  init_wet(device);
  device.set_param(livemix::FdnReverbParam::kSize, 0.5f);
  const int onset_half = measure_onset(device);
  EXPECT(std::abs(onset_half * 2 - onset_1) <= 32, "size 0.5 halves the onset");

  init_wet(device);
  device.set_param(livemix::FdnReverbParam::kSize, 2.0f);
  const int onset_double = measure_onset(device);
  EXPECT(std::abs(onset_double - onset_1 * 2) <= 32, "size 2 doubles the onset");

  init_wet(device);
  device.set_param(livemix::FdnReverbParam::kPredelayMs, 100.0f);
  const int onset_predelayed = measure_onset(device);
  EXPECT(std::abs(onset_predelayed - onset_1 - 4800) <= 16, "100 ms pre-delay shifts the onset by 4800 samples");
}

void test_damping_darkens_tail() {
  const auto tail_rms = [](float damping) {
    livemix::FdnReverbDevice& device = g_test_device;
    init_wet(device);
    device.set_param(livemix::FdnReverbParam::kDecay, 3.0f);
    device.set_param(livemix::FdnReverbParam::kDamping, damping);
    device.in_left()[0] = 1.0f;
    device.in_right()[0] = 1.0f;
    device.process(1);
    render_seconds(device, 0.5f, kSampleRate);
    float rms = 0.0f;
    render_seconds(device, 1.0f, kSampleRate, &rms);
    return rms;
  };
  const float bright = tail_rms(0.0f);
  const float tides = tail_rms(0.4f);
  const float dark = tail_rms(1.0f);
  EXPECT(bright > tides && tides > dark, "more damping removes more broadband tail energy");
  EXPECT(dark < bright * 0.5f, "full damping at least halves the impulse tail RMS");
}

void test_stability_at_max_feedback() {
  livemix::FdnReverbDevice& device = g_test_device;
  init_wet(device);
  device.set_param(livemix::FdnReverbParam::kDecay, livemix::FdnReverb::kMaxDecaySeconds);
  device.set_param(livemix::FdnReverbParam::kSize, livemix::FdnReverb::kMaxSize);

  // Eight stacked partials at 0.4 each for 10 s (peaks above 1.0 into the loop).
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
  float tail_rms = 0.0f;
  const float peak_tail = render_seconds(device, 20.0f, kSampleRate, &tail_rms);
  if (peak_tail > peak) peak = peak_tail;

  EXPECT(peak < 1.0f, "tanh in the loop and on the wet path keeps 30 s under 0 dBFS");
  EXPECT(peak < 1.0e8f, "no NaN/inf during sustained processing");
  EXPECT(tail_rms > 1.0e-4f, "a 20 s decay still rings 20 s after the input stops");
}

void test_no_dc_drift() {
  livemix::FdnReverbDevice& device = g_test_device;
  init_wet(device);

  const auto feed_dc = [&device](float seconds) {
    const int total_frames = static_cast<int>(seconds * kSampleRate);
    double sum = 0.0;
    float peak = 0.0f;
    int rendered = 0;
    while (rendered < total_frames) {
      const int frames = std::min(kBlock, total_frames - rendered);
      for (int i = 0; i < frames; ++i) {
        device.in_left()[i] = 0.5f;
        device.in_right()[i] = 0.5f;
      }
      device.process(frames);
      for (int i = 0; i < frames; ++i) {
        sum += device.out_left()[i];
        peak = std::max(peak, std::fabs(device.out_left()[i]));
      }
      rendered += frames;
    }
    return std::make_pair(static_cast<float>(sum / total_frames), peak);
  };

  feed_dc(3.0f);
  const auto [mean, peak] = feed_dc(1.0f);
  EXPECT(std::fabs(mean) < 1.0e-3f, "wet output of a DC input has no DC after the blocker settles");
  EXPECT(peak < 0.05f, "a DC input does not accumulate in the loop");
}

void test_breath_modulation_is_bounded() {
  // Steady 440 Hz tone through a short tail; the 10 ms RMS envelope over one
  // second shows the 2 Hz gate at depth 1 and only the FDN's own chorusing
  // beat at depth 0. Gating can only attenuate: depth 1 never exceeds depth 0.
  const auto envelope = [](float depth, float* min_out, float* max_out) {
    livemix::FdnReverbDevice& device = g_test_device;
    init_wet(device);
    device.set_param(livemix::FdnReverbParam::kDecay, 0.5f);
    device.set_param(livemix::FdnReverbParam::kBreathRate, 2.0f);
    device.set_param(livemix::FdnReverbParam::kBreathDepth, depth);
    feed_tone(device, 1.0f, 440.0f, 0.5f);

    const int window = 480;
    float phase = 0.0f;
    float low = 1.0e9f;
    float high = 0.0f;
    for (int w = 0; w < 200; ++w) {
      double sum_squares = 0.0;
      int done = 0;
      while (done < window) {
        const int frames = std::min(kBlock, window - done);
        for (int i = 0; i < frames; ++i) {
          const float value = 0.5f * std::sin(phase);
          phase += kTwoPi * 440.0f / kSampleRate;
          if (phase >= kTwoPi) phase -= kTwoPi;
          device.in_left()[i] = value;
          device.in_right()[i] = value;
        }
        device.process(frames);
        for (int i = 0; i < frames; ++i) {
          sum_squares += static_cast<double>(device.out_left()[i]) * device.out_left()[i];
        }
        done += frames;
      }
      const float rms = static_cast<float>(std::sqrt(sum_squares / window));
      low = std::min(low, rms);
      high = std::max(high, rms);
    }
    *min_out = low;
    *max_out = high;
    const float breath_phase = device.reverb().breath_phase();
    EXPECT(breath_phase >= 0.0f && breath_phase < 1.0f, "breath phase stays in [0, 1)");
  };

  float flat_min = 0.0f, flat_max = 0.0f, gated_min = 0.0f, gated_max = 0.0f;
  envelope(0.0f, &flat_min, &flat_max);
  envelope(1.0f, &gated_min, &gated_max);

  EXPECT(flat_min > 0.5f * flat_max, "depth 0 leaves the envelope essentially flat");
  EXPECT(gated_min < 0.2f * gated_max, "depth 1 gates the envelope by more than 14 dB");
  EXPECT(gated_max <= flat_max * 1.05f, "breathing only attenuates; it never boosts");
}

void test_denormals_flush_to_silence() {
  livemix::FdnReverbDevice& device = g_test_device;
  init_wet(device);
  device.set_param(livemix::FdnReverbParam::kDecay, 1.0f);
  feed_tone(device, 0.05f, 440.0f, 1.0f);

  render_seconds(device, 5.0f, kSampleRate);
  EXPECT(!device.reverb().has_denormal_state(),
         "no reverb state should linger in the denormal range");
  render_seconds(device, 7.0f, kSampleRate);
  EXPECT(device.reverb().is_silent_state(),
         "reverb state should flush to exact zero after a long silence");
}

void test_input_bus_passthrough_and_clear() {
  livemix::FdnReverbDevice& device = g_test_device;
  device.init(kSampleRate);
  device.set_param(livemix::FdnReverbParam::kMix, 0.0f);

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

void test_mix_law_matches_tides() {
  // Equal-power: at the default mix 0.5 the dry gain is cos(pi/4) before the
  // shortest line delivers any wet signal.
  livemix::FdnReverbDevice& device = g_test_device;
  device.init(kSampleRate);
  EXPECT(std::fabs(device.mix() - 0.5f) < 1.0e-6f, "default mix is 0.5");
  device.in_left()[0] = 1.0f;
  device.in_right()[0] = 0.5f;
  device.process(1);
  EXPECT(std::fabs(device.out_left()[0] - 0.70710678f) < 1.0e-5f,
         "left dry scaled by cos(mix * pi/2) before the tail arrives");
  EXPECT(std::fabs(device.out_right()[0] - 0.35355339f) < 1.0e-5f,
         "right dry scaled by cos(mix * pi/2) before the tail arrives");
}

}  // namespace

int main() {
  test_breath_law_matches_tides();
  test_reverb_tail_exists_and_decays();
  test_rt60_tracks_decay_parameter();
  test_size_and_predelay_scale_onset();
  test_damping_darkens_tail();
  test_stability_at_max_feedback();
  test_no_dc_drift();
  test_breath_modulation_is_bounded();
  test_denormals_flush_to_silence();
  test_input_bus_passthrough_and_clear();
  test_mix_law_matches_tides();

  if (g_failures == 0) {
    std::printf("fdn-reverb device tests: all passed\n");
    return 0;
  }
  std::printf("fdn-reverb device tests: %d failure(s)\n", g_failures);
  return 1;
}
