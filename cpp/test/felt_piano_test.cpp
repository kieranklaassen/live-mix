// Native parity harness for the Felt piano instrument (kkfonie Felt behind the
// device ABI + note entry points). Covers frequency -> key mapping, pitch of
// rendered notes at three sample rates, velocity level and brightness, the
// felt control, release vs held decay, sustain and half-pedal, sostenuto,
// same-note retrigger, 32-voice stealing through the ghost pool, the soft
// limiter bound, output gain, width, room mix, the input-bus contract, the
// idle flush to exact zero, and the per-block CPU cost for a typical and a
// worst-case load. Compiled with the system C++ compiler by
// scripts/test-native.sh.

#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdio>
#include <vector>

#include "../devices/felt-piano/felt_piano_device.h"

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

using livemix::FeltPianoDevice;
using livemix::FeltPianoParam;

FeltPianoDevice g_test_device;

float note_hz(int midi) { return 440.0f * std::pow(2.0f, static_cast<float>(midi - 69) / 12.0f); }

// Renders `seconds`; returns the peak across both outputs (NaN/inf poison it)
// and optionally the left RMS and a capture of the left channel.
float render(FeltPianoDevice& device, float seconds, float sample_rate, float* rms_out = nullptr,
             std::vector<float>* capture = nullptr, float* right_rms_out = nullptr) {
  const int total = static_cast<int>(seconds * sample_rate);
  float peak = 0.0f;
  double sum_squares = 0.0;
  double right_sum_squares = 0.0;
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
      right_sum_squares += static_cast<double>(r) * r;
      if (capture != nullptr) capture->push_back(l);
    }
    rendered += frames;
  }
  if (rms_out != nullptr) *rms_out = static_cast<float>(std::sqrt(sum_squares / std::max(1, total)));
  if (right_rms_out != nullptr) {
    *right_rms_out = static_cast<float>(std::sqrt(right_sum_squares / std::max(1, total)));
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

// Strongest of a quarter-tone grid half an octave either side of `center`
// (the second partial sits a whole octave up, outside the grid).
float dominant_frequency(const std::vector<float>& x, float sample_rate, float center) {
  float best = 0.0f;
  double best_power = -1.0;
  for (int k = -12; k <= 12; ++k) {
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
  return std::fabs(std::log2(measured / expected)) < 1.0f / 24.0f;
}

// Inharmonic partial n of a key (ModeTable's law at stiffness 1).
float partial_hz(int midi, int n) {
  const float f0 = note_hz(midi);
  const float B = ModeTable::inharmonicityForNote(midi);
  return static_cast<float>(n) * f0 * std::sqrt(1.0f + B * static_cast<float>(n * n));
}

// Share of energy above ~1.5 kHz (two cascaded one-poles), a brightness
// reading that is robust to the unison beating of individual partials.
double brightness(const std::vector<float>& x, float sample_rate) {
  const float c = 1.0f - std::exp(-2.0f * 3.14159265f * 1500.0f / sample_rate);
  float lp1 = 0.0f, lp2 = 0.0f;
  double high = 0.0, total = 0.0;
  for (float v : x) {
    lp1 += c * (v - lp1);
    lp2 += c * (lp1 - lp2);
    const float h = v - lp2;
    high += static_cast<double>(h) * h;
    total += static_cast<double>(v) * v;
  }
  return high / (total + 1.0e-30);
}

// Plays one key for `hold` seconds, then captures `analyse` seconds (still
// held) of the left channel.
std::vector<float> play_and_capture(FeltPianoDevice& device, int midi, float velocity, float hold,
                                    float analyse, float sample_rate = kSampleRate) {
  device.note_on(1, note_hz(midi), velocity);
  render(device, hold, sample_rate);
  std::vector<float> capture;
  render(device, analyse, sample_rate, nullptr, &capture);
  return capture;
}

void test_frequency_to_key() {
  EXPECT(FeltPianoDevice::midi_note_for(440.0f) == 69, "440 Hz is A4 (69)");
  EXPECT(FeltPianoDevice::midi_note_for(261.6256f) == 60, "261.63 Hz is C4 (60)");
  EXPECT(FeltPianoDevice::midi_note_for(27.5f) == 21, "27.5 Hz is A0 (21)");
  EXPECT(FeltPianoDevice::midi_note_for(4186.01f) == 108, "4186 Hz is C8 (108)");
  EXPECT(FeltPianoDevice::midi_note_for(10.0f) == 21, "below the keyboard clamps to A0");
  EXPECT(FeltPianoDevice::midi_note_for(9000.0f) == 108, "above the keyboard clamps to C8");
  EXPECT(FeltPianoDevice::midi_note_for(452.0f) == 69, "+47 cents rounds to the nearest key");
  EXPECT(FeltPianoDevice::midi_note_for(466.16f) == 70, "a semitone up is the next key");
  EXPECT(FeltPianoDevice::midi_note_for(0.0f) == 21 && FeltPianoDevice::midi_note_for(-5.0f) == 21,
         "non-positive frequencies are clamped, not NaN");
}

void test_defaults_are_felts() {
  FeltPianoDevice& device = g_test_device;
  device.init(kSampleRate);
  EXPECT(std::fabs(device.param(FeltPianoParam::kFelt) - 0.65f) < 1.0e-6f, "felt 65 %");
  EXPECT(std::fabs(device.param(FeltPianoParam::kHardness) - 0.35f) < 1.0e-6f, "hammer 35 %");
  EXPECT(std::fabs(device.param(FeltPianoParam::kStiffness) - 1.0f) < 1.0e-6f, "stiffness 100 %");
  EXPECT(std::fabs(device.param(FeltPianoParam::kGrit) - 0.12f) < 1.0e-6f, "grit 12 %");
  EXPECT(std::fabs(device.param(FeltPianoParam::kReverbMix) - 0.25f) < 1.0e-6f, "reverb 25 %");
  EXPECT(std::fabs(device.param(FeltPianoParam::kReverbSize) - 0.3f) < 1.0e-6f, "room 30 %");
  EXPECT(device.param(FeltPianoParam::kOutputDb) == 0.0f, "output 0 dB");
  EXPECT(!device.sustain_down() && !device.sostenuto_down() && !device.soft_down(), "pedals up");
  EXPECT(device.active_voices() == 0 && device.idle(), "no voices, idle");
  EXPECT(std::fabs(device.reverb().getRt60Seconds() - (0.2f + 2.8f * 0.3f)) < 1.0e-5f,
         "room size 0.3 is Felt's RT60 1.04 s");
}

void test_silence_without_notes() {
  FeltPianoDevice& device = g_test_device;
  device.init(kSampleRate);
  for (int i = 0; i < kBlock; ++i) {
    device.in_left()[i] = 0.5f;
    device.in_right()[i] = -0.5f;
  }
  device.process(kBlock);
  float residual = 0.0f;
  for (int i = 0; i < kBlock; ++i) residual += std::fabs(device.out_left()[i]) + std::fabs(device.in_left()[i]);
  EXPECT(residual == 0.0f, "an instrument ignores and clears the ABI input bus");
  EXPECT(render(device, 1.0f, kSampleRate) == 0.0f, "no notes: exact digital silence (grit floor is gated)");
}

void test_pitch_of_rendered_notes() {
  FeltPianoDevice& device = g_test_device;
  const int keys[3] = {69, 45, 84};  // A4, A2, C6
  for (int key : keys) {
    device.init(kSampleRate);
    const std::vector<float> capture = play_and_capture(device, key, 0.6f, 0.3f, 1.0f);
    const float measured = dominant_frequency(capture, kSampleRate, partial_hz(key, 1));
    EXPECT(near_frequency(measured, partial_hz(key, 1)), "a held key rings at its (inharmonic) fundamental");
  }
}

void test_velocity_level_and_brightness() {
  FeltPianoDevice& device = g_test_device;
  // C3: low enough that the mechanical noise does not dominate the high band
  // at pp, so the hammer's contact-time brightening reads cleanly.
  const auto measure = [&device](float velocity, float* peak_out, double* bright_out) {
    device.init(kSampleRate);
    device.set_param(FeltPianoParam::kReverbMix, 0.0f);
    device.note_on(1, note_hz(48), velocity);
    std::vector<float> capture;
    *peak_out = render(device, 0.3f, kSampleRate, nullptr, &capture);
    *bright_out = brightness(capture, kSampleRate);
  };
  float peak_pp = 0.0f, peak_mf = 0.0f, peak_ff = 0.0f;
  double bright_pp = 0.0, bright_mf = 0.0, bright_ff = 0.0;
  measure(0.2f, &peak_pp, &bright_pp);
  measure(0.5f, &peak_mf, &bright_mf);
  measure(0.95f, &peak_ff, &bright_ff);
  EXPECT(peak_pp < peak_mf && peak_mf < peak_ff, "louder velocity is louder");
  EXPECT(peak_ff > 4.0f * peak_pp, "pp -> ff spans well over 12 dB (Felt: ~35 dB compressed by the felt)");
  EXPECT(bright_pp < bright_mf && bright_mf < bright_ff, "louder velocity is brighter (shorter hammer contact)");
  EXPECT(bright_ff > 2.0 * bright_pp, "ff carries at least twice pp's share above 1.5 kHz");
  EXPECT(peak_ff <= 1.0f, "the soft limiter bounds the output at |x| <= 1");
}

void test_felt_darkens_and_shortens() {
  FeltPianoDevice& device = g_test_device;
  const auto measure = [&device](float felt, double* bright_out, float* tail_out) {
    device.init(kSampleRate);
    device.set_param(FeltPianoParam::kReverbMix, 0.0f);
    device.set_param(FeltPianoParam::kFelt, felt);
    device.note_on(1, note_hz(60), 0.7f);
    std::vector<float> capture;
    render(device, 0.3f, kSampleRate, nullptr, &capture);
    *bright_out = brightness(capture, kSampleRate);
    render(device, 3.0f, kSampleRate);
    render(device, 1.0f, kSampleRate, tail_out);
  };
  double bright_bare = 0.0, bright_felt = 0.0;
  float tail_bare = 0.0f, tail_felt = 0.0f;
  measure(0.0f, &bright_bare, &tail_bare);
  measure(1.0f, &bright_felt, &tail_felt);
  EXPECT(bright_felt < 0.5 * bright_bare, "the felt strip darkens the attack (longer hammer contact)");
  EXPECT(tail_felt < tail_bare, "the felt strip shortens the sustain (28 % shorter T60)");
}

// Dry (no room) so the string's own decay is what is measured.
void init_dry(FeltPianoDevice& device) {
  device.init(kSampleRate);
  device.set_param(FeltPianoParam::kReverbMix, 0.0f);
}

void test_release_and_sustain_pedal() {
  FeltPianoDevice& device = g_test_device;

  // Held: RMS over 1.0..1.5 s.
  init_dry(device);
  device.note_on(1, note_hz(57), 0.7f);
  render(device, 1.0f, kSampleRate);
  float rms_held = 0.0f;
  render(device, 0.5f, kSampleRate, &rms_held);

  // Released at 0.5 s: the damper (T60 0.32 s at damper 0.5) has killed it by 1.0 s.
  init_dry(device);
  device.note_on(1, note_hz(57), 0.7f);
  render(device, 0.5f, kSampleRate);
  device.note_off(1);
  render(device, 0.5f, kSampleRate);
  float rms_released = 0.0f;
  render(device, 0.5f, kSampleRate, &rms_released);
  EXPECT(rms_released < 0.05f * rms_held, "half a second after release the key is over 26 dB down");

  // Released with the sustain pedal down: keeps ringing like a held key.
  init_dry(device);
  device.note_on(1, note_hz(57), 0.7f);
  render(device, 0.5f, kSampleRate);
  device.set_param(FeltPianoParam::kSustain, 1.0f);
  device.note_off(1);
  render(device, 0.5f, kSampleRate);
  float rms_sustained = 0.0f;
  render(device, 0.5f, kSampleRate, &rms_sustained);
  EXPECT(device.sustain_down(), "sustain >= 0.5 is down");
  EXPECT(rms_sustained > 0.5f * rms_held, "the sustain pedal holds a released key");
  EXPECT(device.active_voices() == 1, "the sustained voice stays active");

  // Pedal up: releases it.
  device.set_param(FeltPianoParam::kSustain, 0.0f);
  render(device, 0.5f, kSampleRate);
  float rms_after_pedal = 0.0f;
  render(device, 0.5f, kSampleRate, &rms_after_pedal);
  EXPECT(rms_after_pedal < 0.05f * rms_sustained, "lifting the pedal releases the held key");

  // Notes started while the pedal is down inherit it.
  init_dry(device);
  device.set_param(FeltPianoParam::kSustain, 1.0f);
  device.note_on(1, note_hz(57), 0.7f);
  render(device, 0.5f, kSampleRate);
  device.note_off(1);
  render(device, 0.5f, kSampleRate);
  float rms_inherited = 0.0f;
  render(device, 0.5f, kSampleRate, &rms_inherited);
  EXPECT(rms_inherited > 0.5f * rms_held, "a note started under the pedal is held by it");
}

void test_half_pedal_scales_damping() {
  FeltPianoDevice& device = g_test_device;
  const auto tail = [&device](float cc64) {
    device.init(kSampleRate);
    device.set_param(FeltPianoParam::kSustain, cc64);  // below 0.5: pedal "up" for the synth
    device.note_on(1, note_hz(57), 0.7f);
    render(device, 0.5f, kSampleRate);
    device.note_off(1);
    render(device, 0.2f, kSampleRate);
    float rms = 0.0f;
    render(device, 0.3f, kSampleRate, &rms);
    return rms;
  };
  const float full = tail(0.0f);
  const float quarter = tail(0.25f);
  const float almost = tail(0.45f);
  EXPECT(full < quarter && quarter < almost, "continuous CC64 below 0.5 slows the damper progressively");
}

void test_sostenuto_holds_only_captured_notes() {
  FeltPianoDevice& device = g_test_device;
  init_dry(device);
  device.note_on(1, note_hz(57), 0.7f);  // A3
  render(device, 0.2f, kSampleRate);
  device.set_param(FeltPianoParam::kSostenuto, 1.0f);
  device.note_on(2, note_hz(64), 0.7f);  // E4, after the pedal
  render(device, 0.2f, kSampleRate);
  device.note_off(1);
  device.note_off(2);
  render(device, 0.6f, kSampleRate);
  std::vector<float> capture;
  render(device, 1.0f, kSampleRate, nullptr, &capture);
  const double a3 = goertzel_power(capture, partial_hz(57, 1), kSampleRate);
  const double e4 = goertzel_power(capture, partial_hz(64, 1), kSampleRate);
  EXPECT(device.sostenuto_down(), "sostenuto >= 0.5 is down");
  EXPECT(a3 > 20.0 * e4, "sostenuto holds the note that was sounding when pressed, not the later one");
  float rms_held = 0.0f;
  render(device, 0.5f, kSampleRate, &rms_held);
  device.set_param(FeltPianoParam::kSostenuto, 0.0f);
  render(device, 0.5f, kSampleRate);
  float rms = 0.0f;
  render(device, 0.5f, kSampleRate, &rms);
  EXPECT(rms < 0.05f * rms_held, "lifting sostenuto releases the captured note");
}

void test_same_note_retrigger_and_stealing() {
  FeltPianoDevice& device = g_test_device;
  device.init(kSampleRate);
  device.note_on(1, note_hz(60), 0.7f);
  render(device, 0.1f, kSampleRate);
  device.note_on(2, note_hz(60), 0.7f);
  EXPECT(device.active_voices() == 2, "retriggering a sounding key releases it and starts a new voice");
  render(device, 1.5f, kSampleRate);
  EXPECT(device.active_voices() == 1, "the released duplicate dies, the new one rings on");

  // 48 keys under the pedal: 32 voices, 16 steals through the ghost pool.
  device.init(kSampleRate);
  device.set_param(FeltPianoParam::kSustain, 1.0f);
  for (int n = 0; n < 48; ++n) {
    device.note_on(100 + n, note_hz(30 + n), 0.9f);
    if (n % 8 == 7) render(device, 0.05f, kSampleRate);
  }
  EXPECT(device.active_voices() <= FeltPianoDevice::kMaxPolyphony, "polyphony is capped at 32");
  EXPECT(device.active_voices() >= 24, "stealing keeps the newest notes sounding");
  const float peak = render(device, 2.0f, kSampleRate);
  EXPECT(peak < 1.0e8f, "no NaN/inf while stealing");
  EXPECT(peak <= 1.0f, "48 ff keys stay within the soft limiter");
  for (int n = 0; n < 48; ++n) device.note_off(100 + n);
  device.set_param(FeltPianoParam::kSustain, 0.0f);
  render(device, 2.0f, kSampleRate);
  EXPECT(device.active_voices() == 0, "every voice is freed after release");

  // A polyphony cap bounds the pool new notes may use (the CPU budget knob).
  device.init(kSampleRate);
  device.set_param(FeltPianoParam::kPolyphony, 8.4f);  // rounds to 8
  device.set_param(FeltPianoParam::kSustain, 1.0f);
  for (int n = 0; n < 20; ++n) device.note_on(200 + n, note_hz(40 + n), 0.8f);
  EXPECT(device.synth().polyphony() == 8, "polyphony rounds to the nearest voice count");
  EXPECT(device.active_voices() == 8, "with polyphony 8, twenty keys leave eight voices sounding");
  EXPECT(render(device, 0.5f, kSampleRate) <= 1.0f, "capped stealing stays bounded");
}

void test_output_gain_width_and_room() {
  FeltPianoDevice& device = g_test_device;

  const auto peak_for_output = [&device](float db) {
    device.init(kSampleRate);
    device.set_param(FeltPianoParam::kOutputDb, db);
    device.set_param(FeltPianoParam::kGrit, 0.0f);
    device.note_on(1, note_hz(60), 0.4f);
    return render(device, 0.5f, kSampleRate);
  };
  const float unity = peak_for_output(0.0f);
  const float quiet = peak_for_output(-24.0f);
  EXPECT(std::fabs(quiet / unity - 0.0631f) < 0.005f, "-24 dB output scales the (unlimited) peak by 0.063");

  // Width 0 folds the highs to mono (the widener keeps bass below 200 Hz
  // stereo): a treble key that width 0.5 pans right reads nearly equal L/R.
  const auto imbalance = [&device](float width) {
    device.init(kSampleRate);
    device.set_param(FeltPianoParam::kWidth, width);
    device.set_param(FeltPianoParam::kReverbMix, 0.0f);
    device.note_on(1, note_hz(96), 0.7f);
    render(device, 0.1f, kSampleRate);
    float l = 0.0f, r = 0.0f;
    render(device, 0.3f, kSampleRate, &l, nullptr, &r);
    return (r - l) / (r + l);
  };
  const float centred = imbalance(0.0f);
  const float panned = imbalance(0.5f);
  EXPECT(panned > 0.2f, "at width 0.5 a treble key sits right of centre (key-tracked pan)");
  EXPECT(std::fabs(centred) < 0.25f * panned, "width 0 folds the image towards mono");

  // Room mix lengthens the tail after the string is damped.
  const auto tail_for_mix = [&device](float mix) {
    device.init(kSampleRate);
    device.set_param(FeltPianoParam::kReverbMix, mix);
    device.set_param(FeltPianoParam::kReverbSize, 1.0f);
    device.note_on(1, note_hz(60), 0.7f);
    render(device, 0.3f, kSampleRate);
    device.note_off(1);
    render(device, 1.0f, kSampleRate);
    float rms = 0.0f;
    render(device, 0.5f, kSampleRate, &rms);
    return rms;
  };
  EXPECT(tail_for_mix(0.5f) > 5.0f * tail_for_mix(0.0f), "the room carries the tail after the damper falls");
}

void test_idle_flush_reaches_exact_zero() {
  FeltPianoDevice& device = g_test_device;
  device.init(kSampleRate);
  device.set_param(FeltPianoParam::kSustain, 1.0f);
  device.note_on(1, note_hz(48), 0.8f);
  device.note_on(2, note_hz(55), 0.8f);
  render(device, 0.5f, kSampleRate);
  device.note_off(1);
  device.note_off(2);
  device.set_param(FeltPianoParam::kSustain, 0.0f);  // damper-felt burst, sympathetic ring-out
  EXPECT(!device.idle(), "sounding: not idle");
  render(device, 8.0f, kSampleRate);
  EXPECT(device.idle(), "after the room and strings fall below -180 dBFS the device flushes");
  EXPECT(render(device, 1.0f, kSampleRate) == 0.0f, "flushed: exact zeros");

  // The pedal alone (no notes) makes a burst, rings out and flushes too.
  device.set_param(FeltPianoParam::kSustain, 1.0f);
  render(device, 0.1f, kSampleRate);
  EXPECT(!device.idle(), "a pedal-noise burst wakes the device");
  render(device, 8.0f, kSampleRate);  // the room's tail of the burst needs ~7 s to reach -180 dBFS
  EXPECT(device.idle() && render(device, 0.5f, kSampleRate) == 0.0f, "pedal noise rings out to exact zero");
}

void test_sample_rate_independence() {
  FeltPianoDevice& device = g_test_device;
  const float rates[3] = {44100.0f, 48000.0f, 96000.0f};
  float peaks[3] = {};
  for (int i = 0; i < 3; ++i) {
    device.init(rates[i]);
    device.note_on(1, note_hz(69), 0.6f);
    std::vector<float> capture;
    peaks[i] = render(device, 0.3f, rates[i]);
    render(device, 1.0f, rates[i], nullptr, &capture);
    EXPECT(near_frequency(dominant_frequency(capture, rates[i], partial_hz(69, 1)), partial_hz(69, 1)),
           "A4 rings at its fundamental at 44.1/48/96 kHz");
  }
  EXPECT(std::fabs(20.0f * std::log10(peaks[0] / peaks[1])) < 3.0f, "attack level within 3 dB at 44.1 vs 48 kHz");
  EXPECT(std::fabs(20.0f * std::log10(peaks[2] / peaks[1])) < 3.0f, "attack level within 3 dB at 96 vs 48 kHz");
}

void report_cpu_cost() {
  FeltPianoDevice& device = g_test_device;
  const float seconds = 10.0f;
  const double blocks = seconds * kSampleRate / kBlock;

  // Typical: a six-note chord under the pedal, restruck every two seconds.
  device.init(kSampleRate);
  device.set_param(FeltPianoParam::kSustain, 1.0f);
  const int chord[6] = {36, 43, 52, 55, 59, 64};
  auto start = std::chrono::steady_clock::now();
  int id = 1;
  for (int second = 0; second < 10; ++second) {
    if (second % 2 == 0) {
      for (int k : chord) device.note_on(id++, note_hz(k), 0.7f);
    }
    render(device, 1.0f, kSampleRate);
  }
  double elapsed = std::chrono::duration<double>(std::chrono::steady_clock::now() - start).count();
  std::printf("felt-piano cost (typical: 6-note chord, pedal, restruck every 2 s): %.1f us per 128-frame block, %.2f%% of real time at 48 kHz (native)\n",
              elapsed / blocks * 1.0e6, elapsed / seconds * 100.0);

  // Worst case (Felt README): pedal down, 32 keys across the keyboard restruck
  // every second at ff, all voices alive with fresh mode banks.
  device.init(kSampleRate);
  device.set_param(FeltPianoParam::kSustain, 1.0f);
  start = std::chrono::steady_clock::now();
  for (int second = 0; second < 10; ++second) {
    for (int v = 0; v < 32; ++v) device.note_on(id++, note_hz(24 + v * 2), 0.9f);
    render(device, 1.0f, kSampleRate);
  }
  elapsed = std::chrono::duration<double>(std::chrono::steady_clock::now() - start).count();
  std::printf("felt-piano cost (worst: 32 voices ff, pedal, restruck every 1 s): %.1f us per 128-frame block, %.2f%% of real time at 48 kHz (native)\n",
              elapsed / blocks * 1.0e6, elapsed / seconds * 100.0);
}

}  // namespace

int main() {
  test_frequency_to_key();
  test_defaults_are_felts();
  test_silence_without_notes();
  test_pitch_of_rendered_notes();
  test_velocity_level_and_brightness();
  test_felt_darkens_and_shortens();
  test_release_and_sustain_pedal();
  test_half_pedal_scales_damping();
  test_sostenuto_holds_only_captured_notes();
  test_same_note_retrigger_and_stealing();
  test_output_gain_width_and_room();
  test_idle_flush_reaches_exact_zero();
  test_sample_rate_independence();
  report_cpu_cost();

  if (g_failures == 0) {
    std::printf("felt-piano device tests: all passed\n");
    return 0;
  }
  std::printf("felt-piano device tests: %d failure(s)\n", g_failures);
  return 1;
}
