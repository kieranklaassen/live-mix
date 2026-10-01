#pragma once

// Shared helpers for the native device harnesses (cpp/test/*_test.cpp):
// the EXPECT macro, signal generators, measurements, and the conformance
// checks every generated device runs before its own assertions. Header-only;
// each harness is one translation unit.

#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <cstdio>
#include <vector>

namespace testkit {

inline int& failures() {
  static int count = 0;
  return count;
}

#define EXPECT(condition, message)                                    \
  do {                                                                \
    if (!(condition)) {                                               \
      std::printf("FAIL: %s (%s:%d)\n", message, __FILE__, __LINE__); \
      ++testkit::failures();                                          \
    }                                                                 \
  } while (0)

#define EXPECT_NEAR(actual, expected, tolerance, message)                              \
  do {                                                                                 \
    const double a_ = static_cast<double>(actual);                                     \
    const double e_ = static_cast<double>(expected);                                   \
    if (!(std::fabs(a_ - e_) <= static_cast<double>(tolerance))) {                     \
      std::printf("FAIL: %s: got %g, expected %g ± %g (%s:%d)\n", message, a_, e_,     \
                  static_cast<double>(tolerance), __FILE__, __LINE__);                 \
      ++testkit::failures();                                                           \
    }                                                                                  \
  } while (0)

constexpr double kPi = 3.14159265358979323846;
constexpr int kBlock = 128;

struct Stereo {
  std::vector<float> left;
  std::vector<float> right;
  size_t size() const { return left.size(); }
};

inline uint32_t& rng_state() {
  static uint32_t state = 0x1234567u;
  return state;
}
inline float white() {
  uint32_t& s = rng_state();
  s ^= s << 13;
  s ^= s >> 17;
  s ^= s << 5;
  return static_cast<float>(s >> 8) * (2.0f / 16777216.0f) - 1.0f;
}

inline std::vector<float> sine(float hz, float seconds, float sample_rate, float gain = 1.0f) {
  std::vector<float> out(static_cast<size_t>(seconds * sample_rate));
  for (size_t i = 0; i < out.size(); ++i) {
    out[i] = gain * static_cast<float>(std::sin(2.0 * kPi * hz * static_cast<double>(i) / sample_rate));
  }
  return out;
}

inline std::vector<float> noise(float seconds, float sample_rate, float gain = 1.0f) {
  std::vector<float> out(static_cast<size_t>(seconds * sample_rate));
  for (float& v : out) v = gain * white();
  return out;
}

inline std::vector<float> silence(float seconds, float sample_rate) {
  return std::vector<float>(static_cast<size_t>(seconds * sample_rate), 0.0f);
}

inline std::vector<float> impulse(float seconds, float sample_rate, float gain = 1.0f) {
  std::vector<float> out(static_cast<size_t>(seconds * sample_rate), 0.0f);
  if (!out.empty()) out[0] = gain;
  return out;
}

inline double rms(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  if (to <= from) return 0.0;
  double sum = 0.0;
  for (size_t i = from; i < to; ++i) sum += static_cast<double>(x[i]) * x[i];
  return std::sqrt(sum / static_cast<double>(to - from));
}

inline double peak(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  double p = 0.0;
  for (size_t i = from; i < to; ++i) p = std::max(p, std::fabs(static_cast<double>(x[i])));
  return p;
}

inline bool finite(const std::vector<float>& x) {
  for (float v : x) {
    if (std::isnan(v) || std::isinf(v)) return false;
  }
  return true;
}

inline double mean(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  if (to <= from) return 0.0;
  double sum = 0.0;
  for (size_t i = from; i < to; ++i) sum += x[i];
  return sum / static_cast<double>(to - from);
}

inline double db(double linear) { return 20.0 * std::log10(std::max(linear, 1.0e-12)); }

// Amplitude of the `hz` component (Goertzel over [from, to), Hann-windowed):
// 1.0 for a full-scale sine exactly on `hz`.
inline double tone_level(const std::vector<float>& x, double hz, double sample_rate, size_t from = 0,
                         size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  if (to <= from) return 0.0;
  const size_t n = to - from;
  double re = 0.0, im = 0.0, window_sum = 0.0;
  for (size_t i = 0; i < n; ++i) {
    const double w = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n));
    const double phase = 2.0 * kPi * hz * static_cast<double>(i) / sample_rate;
    re += w * x[from + i] * std::cos(phase);
    im -= w * x[from + i] * std::sin(phase);
    window_sum += w;
  }
  return 2.0 * std::sqrt(re * re + im * im) / window_sum;
}

// Phase in radians of the `hz` component over [from, to), rectangular window.
inline double tone_phase(const std::vector<float>& x, double hz, double sample_rate, size_t from,
                         size_t to) {
  double re = 0.0, im = 0.0;
  for (size_t i = from; i < to && i < x.size(); ++i) {
    const double phase = 2.0 * kPi * hz * static_cast<double>(i) / sample_rate;
    re += x[i] * std::cos(phase);
    im -= x[i] * std::sin(phase);
  }
  return std::atan2(im, re);
}

// The strongest frequency in [lo, hi] Hz by a coarse-then-fine Goertzel scan.
inline double dominant_frequency(const std::vector<float>& x, double sample_rate, double lo, double hi,
                                 size_t from = 0, size_t to = SIZE_MAX) {
  double best_hz = lo, best = -1.0;
  const int steps = 600;
  for (int i = 0; i <= steps; ++i) {
    const double hz = lo * std::pow(hi / lo, static_cast<double>(i) / steps);
    const double level = tone_level(x, hz, sample_rate, from, to);
    if (level > best) {
      best = level;
      best_hz = hz;
    }
  }
  double span = best_hz * (std::pow(hi / lo, 1.0 / steps) - 1.0);
  for (int pass = 0; pass < 3; ++pass) {
    double centre = best_hz;
    for (int i = -10; i <= 10; ++i) {
      const double hz = centre + span * i / 10.0;
      if (hz <= 0.0) continue;
      const double level = tone_level(x, hz, sample_rate, from, to);
      if (level > best) {
        best = level;
        best_hz = hz;
      }
    }
    span /= 10.0;
  }
  return best_hz;
}

// Share of the signal's energy above `hz`, by a one-pole split (a brightness
// proxy: only compare values taken the same way).
inline double energy_above(const std::vector<float>& x, double hz, double sample_rate, size_t from = 0,
                           size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  const double a = std::exp(-2.0 * kPi * hz / sample_rate);
  double low = 0.0, high_energy = 0.0, total = 0.0;
  for (size_t i = from; i < to; ++i) {
    low = x[i] + (low - x[i]) * a;
    const double high = x[i] - low;
    high_energy += high * high;
    total += static_cast<double>(x[i]) * x[i];
  }
  return total > 0.0 ? high_energy / total : 0.0;
}

// Pearson correlation of two channels over [from, to).
inline double correlation(const std::vector<float>& a, const std::vector<float>& b, size_t from = 0,
                          size_t to = SIZE_MAX) {
  to = std::min(to, std::min(a.size(), b.size()));
  double sab = 0.0, saa = 0.0, sbb = 0.0;
  for (size_t i = from; i < to; ++i) {
    sab += static_cast<double>(a[i]) * b[i];
    saa += static_cast<double>(a[i]) * a[i];
    sbb += static_cast<double>(b[i]) * b[i];
  }
  return (saa > 0.0 && sbb > 0.0) ? sab / std::sqrt(saa * sbb) : 0.0;
}

// Decay time to -60 dB from a least-squares line through the RMS (in dB) of
// consecutive windows of `x` starting at `from_seconds`; windows below
// `floor_db` are ignored. Returns 0 when there is no usable decay.
inline double rt60(const std::vector<float>& x, double sample_rate, double from_seconds,
                   double window_seconds = 0.1, double floor_db = -90.0) {
  const size_t window = static_cast<size_t>(window_seconds * sample_rate);
  const size_t start = static_cast<size_t>(from_seconds * sample_rate);
  double n = 0, st = 0, sd = 0, stt = 0, std_ = 0;
  for (size_t w = 0; start + (w + 1) * window <= x.size(); ++w) {
    const double level = db(rms(x, start + w * window, start + (w + 1) * window));
    if (level < floor_db) break;
    const double t = static_cast<double>(w) * window_seconds;
    n += 1;
    st += t;
    sd += level;
    stt += t * t;
    std_ += t * level;
  }
  if (n < 3) return 0.0;
  const double slope = (n * std_ - st * sd) / (n * stt - st * st);
  return slope < 0.0 ? -60.0 / slope : 0.0;
}

// Largest sample-to-sample jump: a click detector for parameter sweeps.
inline double max_step(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  double worst = 0.0;
  for (size_t i = from + 1; i < to; ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(x[i]) - x[i - 1]));
  }
  return worst;
}

// 16-bit PCM WAV, for listening to what a harness rendered (never in CI).
inline void write_wav(const char* path, const Stereo& audio, int sample_rate) {
  std::FILE* file = std::fopen(path, "wb");
  if (!file) return;
  const uint32_t frames = static_cast<uint32_t>(audio.size());
  const uint32_t data_bytes = frames * 4;
  auto u32 = [&](uint32_t v) { std::fwrite(&v, 4, 1, file); };
  auto u16 = [&](uint16_t v) { std::fwrite(&v, 2, 1, file); };
  std::fwrite("RIFF", 1, 4, file);
  u32(36 + data_bytes);
  std::fwrite("WAVEfmt ", 1, 8, file);
  u32(16);
  u16(1);
  u16(2);
  u32(static_cast<uint32_t>(sample_rate));
  u32(static_cast<uint32_t>(sample_rate) * 4);
  u16(4);
  u16(16);
  std::fwrite("data", 1, 4, file);
  u32(data_bytes);
  for (uint32_t i = 0; i < frames; ++i) {
    const float l = std::max(-1.0f, std::min(1.0f, audio.left[i]));
    const float r = std::max(-1.0f, std::min(1.0f, audio.right[i]));
    u16(static_cast<uint16_t>(static_cast<int16_t>(l * 32767.0f)));
    u16(static_cast<uint16_t>(static_cast<int16_t>(r * 32767.0f)));
  }
  std::fclose(file);
}

// --- driving a device ---------------------------------------------------------------------

// Run `left`/`right` through a device in blocks of `block` frames.
template <typename Device>
Stereo run(Device& device, const std::vector<float>& left, const std::vector<float>& right,
           int block = kBlock) {
  Stereo out;
  const size_t total = left.size();
  out.left.resize(total);
  out.right.resize(total);
  size_t done = 0;
  while (done < total) {
    const int frames = static_cast<int>(std::min(static_cast<size_t>(block), total - done));
    for (int i = 0; i < frames; ++i) {
      device.in_left()[i] = left[done + i];
      device.in_right()[i] = right[done + i];
    }
    device.process(frames);
    for (int i = 0; i < frames; ++i) {
      out.left[done + i] = device.out_left()[i];
      out.right[done + i] = device.out_right()[i];
    }
    done += frames;
  }
  return out;
}

template <typename Device>
Stereo run(Device& device, const std::vector<float>& mono, int block = kBlock) {
  return run(device, mono, mono, block);
}

// Render `seconds` with no input (instruments, tails).
template <typename Device>
Stereo render(Device& device, float seconds, float sample_rate, int block = kBlock) {
  return run(device, silence(seconds, sample_rate), block);
}

inline Stereo concat(const Stereo& a, const Stereo& b) {
  Stereo out = a;
  out.left.insert(out.left.end(), b.left.begin(), b.left.end());
  out.right.insert(out.right.end(), b.right.begin(), b.right.end());
  return out;
}

// Microseconds per 128-frame block and the share of real time at
// `sample_rate`, timing `work()` which must render `seconds` of audio.
template <typename Work>
void report_cost(const char* label, float seconds, float sample_rate, Work work) {
  const auto start = std::chrono::steady_clock::now();
  work();
  const auto elapsed = std::chrono::steady_clock::now() - start;
  const double micros = std::chrono::duration<double, std::micro>(elapsed).count();
  const double blocks = seconds * sample_rate / 128.0;
  std::printf("%s cost: %.1f us per 128-frame stereo block, %.2f%% of real time at %.0f kHz (native)\n",
              label, micros / blocks, 100.0 * micros / (seconds * 1.0e6), sample_rate / 1000.0);
}

inline int finish(const char* name) {
  if (failures() == 0) {
    std::printf("%s device tests: all passed\n", name);
    return 0;
  }
  std::printf("%s device tests: %d FAILED\n", name, failures());
  return 1;
}

// --- conformance --------------------------------------------------------------------------
//
// What every generated device must satisfy whatever it does. A harness calls
// one of these first and then asserts the device's own behaviour.

struct ParamRange {
  float min, max, def;
};

struct Conformance {
  const char* name;
  int num_params = 0;
  const float* mins = nullptr;
  const float* maxs = nullptr;
  const float* defaults = nullptr;
  // Longest the device may keep sounding after its input stops (or after the
  // last note is released), in seconds, at default settings.
  float tail_seconds = 10.0f;
  // Output ceiling for a full-scale input at any parameter setting.
  float max_peak = 8.0f;
  // Effects: silence in must give exact silence out once the tail has rung
  // out. Leave false for devices that generate sound on their own.
  bool silent_when_idle = true;
};

// Effects: finite and bounded for loud noise at every parameter extreme,
// silent when idle, block-size independent, same result on a re-init.
template <typename Device>
void check_effect(Device& device, const Conformance& spec, float sample_rate = 48000.0f) {
  char label[160];

  // Default settings, noise burst then silence: finite, bounded, and exactly
  // silent after the tail.
  device.init(sample_rate);
  rng_state() = 0x1234567u;
  Stereo burst = run(device, noise(1.0f, sample_rate, 0.5f));
  Stereo tail = render(device, spec.tail_seconds, sample_rate);
  std::snprintf(label, sizeof label, "%s: finite output at defaults", spec.name);
  EXPECT(finite(burst.left) && finite(burst.right) && finite(tail.left) && finite(tail.right), label);
  std::snprintf(label, sizeof label, "%s: bounded output at defaults", spec.name);
  EXPECT(peak(burst.left) < spec.max_peak && peak(burst.right) < spec.max_peak, label);
  if (spec.silent_when_idle) {
    Stereo after = render(device, 0.5f, sample_rate);
    std::snprintf(label, sizeof label, "%s: exact silence once the tail has rung out (peak %g)",
                  spec.name, std::max(peak(after.left), peak(after.right)));
    EXPECT(peak(after.left) == 0.0 && peak(after.right) == 0.0, label);
  }

  // Determinism: a second init must reproduce the first render bit for bit.
  device.init(sample_rate);
  rng_state() = 0x1234567u;
  Stereo again = run(device, noise(1.0f, sample_rate, 0.5f));
  std::snprintf(label, sizeof label, "%s: init() resets all state", spec.name);
  EXPECT(again.left == burst.left && again.right == burst.right, label);

  // Block-size independence: 128-frame and ragged blocks give the same audio.
  device.init(sample_rate);
  rng_state() = 0x1234567u;
  std::vector<float> input = noise(1.0f, sample_rate, 0.5f);
  Stereo ragged;
  {
    const int sizes[] = {1, 7, 64, 128, 33, 512, 2048, 5};
    size_t done = 0;
    int which = 0;
    ragged.left.resize(input.size());
    ragged.right.resize(input.size());
    while (done < input.size()) {
      const int frames =
          static_cast<int>(std::min(static_cast<size_t>(sizes[which++ % 8]), input.size() - done));
      for (int i = 0; i < frames; ++i) {
        device.in_left()[i] = input[done + i];
        device.in_right()[i] = input[done + i];
      }
      device.process(frames);
      for (int i = 0; i < frames; ++i) {
        ragged.left[done + i] = device.out_left()[i];
        ragged.right[done + i] = device.out_right()[i];
      }
      done += frames;
    }
  }
  double worst = 0.0;
  for (size_t i = 0; i < input.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(ragged.left[i]) - burst.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(ragged.right[i]) - burst.right[i]));
  }
  std::snprintf(label, sizeof label, "%s: output does not depend on block size (max diff %g)",
                spec.name, worst);
  EXPECT(worst < 1.0e-4, label);

  // Every parameter at its minimum, then its maximum, with loud input; then
  // all at once. Out-of-range and non-finite values must be survivable too.
  for (int pass = 0; pass < 2; ++pass) {
    for (int p = 0; p < spec.num_params; ++p) {
      device.init(sample_rate);
      device.set_param(p, pass == 0 ? spec.mins[p] : spec.maxs[p]);
      Stereo out = run(device, noise(0.5f, sample_rate, 0.9f));
      Stereo rest = render(device, 0.5f, sample_rate);
      std::snprintf(label, sizeof label, "%s: param %d at its %s stays finite and bounded (peak %g)",
                    spec.name, p, pass == 0 ? "minimum" : "maximum",
                    std::max(peak(out.left), peak(out.right)));
      EXPECT(finite(out.left) && finite(out.right) && finite(rest.left) && finite(rest.right) &&
                 peak(out.left) < spec.max_peak && peak(out.right) < spec.max_peak,
             label);
    }
    device.init(sample_rate);
    for (int p = 0; p < spec.num_params; ++p) {
      device.set_param(p, pass == 0 ? spec.mins[p] : spec.maxs[p]);
    }
    Stereo out = run(device, noise(1.0f, sample_rate, 0.9f));
    std::snprintf(label, sizeof label, "%s: all params at their %s stay finite and bounded (peak %g)",
                  spec.name, pass == 0 ? "minimum" : "maximum",
                  std::max(peak(out.left), peak(out.right)));
    EXPECT(finite(out.left) && finite(out.right) && peak(out.left) < spec.max_peak &&
               peak(out.right) < spec.max_peak,
           label);
  }
  device.init(sample_rate);
  for (int p = 0; p < spec.num_params; ++p) {
    device.set_param(p, 1.0e30f);
    device.set_param(p, -1.0e30f);
    device.set_param(p, std::nanf(""));
  }
  device.set_param(-1, 0.5f);
  device.set_param(spec.num_params, 0.5f);
  Stereo abused = run(device, noise(0.25f, sample_rate, 0.5f));
  std::snprintf(label, sizeof label, "%s: survives out-of-range, NaN and unknown params", spec.name);
  EXPECT(finite(abused.left) && finite(abused.right), label);

  // Other sample rates.
  for (float rate : {44100.0f, 96000.0f}) {
    device.init(rate);
    Stereo out = run(device, noise(0.5f, rate, 0.5f));
    std::snprintf(label, sizeof label, "%s: finite and bounded at %.0f Hz", spec.name, rate);
    EXPECT(finite(out.left) && finite(out.right) && peak(out.left) < spec.max_peak, label);
  }
  device.init(sample_rate);
}

// Instruments: silent until played, sound while a note is held, return to
// exact silence after release, survive a pile of notes and every parameter
// extreme, and ignore releases of notes that are not playing.
template <typename Device>
void check_instrument(Device& device, const Conformance& spec, float sample_rate = 48000.0f) {
  char label[160];

  device.init(sample_rate);
  Stereo idle = render(device, 0.25f, sample_rate);
  std::snprintf(label, sizeof label, "%s: silent before any note", spec.name);
  EXPECT(peak(idle.left) == 0.0 && peak(idle.right) == 0.0, label);

  device.note_off(42);
  device.note_on(1, 220.0f, 0.7f);
  Stereo held = render(device, 2.0f, sample_rate);
  std::snprintf(label, sizeof label, "%s: a held note sounds (rms %g)", spec.name, rms(held.left));
  EXPECT(finite(held.left) && finite(held.right) && rms(held.left) > 1.0e-4, label);
  std::snprintf(label, sizeof label, "%s: a held note stays bounded (peak %g)", spec.name,
                std::max(peak(held.left), peak(held.right)));
  EXPECT(peak(held.left) < spec.max_peak && peak(held.right) < spec.max_peak, label);

  device.note_off(1);
  Stereo tail = render(device, spec.tail_seconds, sample_rate);
  Stereo after = render(device, 0.5f, sample_rate);
  std::snprintf(label, sizeof label, "%s: exact silence after the release tail (peak %g)", spec.name,
                std::max(peak(after.left), peak(after.right)));
  EXPECT(finite(tail.left) && peak(after.left) == 0.0 && peak(after.right) == 0.0, label);

  // Determinism across init.
  device.init(sample_rate);
  device.note_on(1, 220.0f, 0.7f);
  Stereo again = render(device, 2.0f, sample_rate);
  std::snprintf(label, sizeof label, "%s: init() resets all state", spec.name);
  EXPECT(again.left == held.left && again.right == held.right, label);

  // More notes than any pool holds, restruck, then all released.
  device.init(sample_rate);
  for (int n = 0; n < 96; ++n) {
    device.note_on(100 + n, 55.0f * std::pow(2.0f, static_cast<float>(n % 48) / 12.0f), 1.0f);
    Stereo out = render(device, 0.02f, sample_rate);
    if (!finite(out.left) || peak(out.left) >= spec.max_peak || peak(out.right) >= spec.max_peak) {
      std::snprintf(label, sizeof label, "%s: stays finite and bounded under 96 stacked notes (peak %g)",
                    spec.name, std::max(peak(out.left), peak(out.right)));
      EXPECT(false, label);
      break;
    }
  }
  for (int n = 0; n < 96; ++n) device.note_off(100 + n);
  render(device, spec.tail_seconds, sample_rate);
  Stereo drained = render(device, 0.5f, sample_rate);
  std::snprintf(label, sizeof label, "%s: every voice is freed after the pile is released (peak %g)",
                spec.name, std::max(peak(drained.left), peak(drained.right)));
  EXPECT(peak(drained.left) == 0.0 && peak(drained.right) == 0.0, label);

  // Parameter extremes while a chord is held.
  for (int pass = 0; pass < 2; ++pass) {
    for (int p = 0; p < spec.num_params; ++p) {
      device.init(sample_rate);
      device.set_param(p, pass == 0 ? spec.mins[p] : spec.maxs[p]);
      device.note_on(1, 110.0f, 0.9f);
      device.note_on(2, 329.63f, 0.9f);
      device.note_on(3, 1318.5f, 0.9f);
      Stereo out = render(device, 0.75f, sample_rate);
      std::snprintf(label, sizeof label, "%s: param %d at its %s stays finite and bounded (peak %g)",
                    spec.name, p, pass == 0 ? "minimum" : "maximum",
                    std::max(peak(out.left), peak(out.right)));
      EXPECT(finite(out.left) && finite(out.right) && peak(out.left) < spec.max_peak &&
                 peak(out.right) < spec.max_peak,
             label);
    }
  }
  device.init(sample_rate);
  for (int p = 0; p < spec.num_params; ++p) {
    device.set_param(p, 1.0e30f);
    device.set_param(p, -1.0e30f);
    device.set_param(p, std::nanf(""));
  }
  device.set_param(-1, 0.5f);
  device.set_param(spec.num_params, 0.5f);
  device.note_on(1, 440.0f, 0.8f);
  device.note_on(2, 0.0f, 0.8f);
  device.note_on(3, 30000.0f, 2.0f);
  device.note_on(4, std::nanf(""), std::nanf(""));
  Stereo abused = render(device, 0.5f, sample_rate);
  std::snprintf(label, sizeof label, "%s: survives out-of-range params and absurd notes", spec.name);
  EXPECT(finite(abused.left) && finite(abused.right) && peak(abused.left) < spec.max_peak, label);

  for (float rate : {44100.0f, 96000.0f}) {
    device.init(rate);
    device.note_on(1, 220.0f, 0.7f);
    Stereo out = render(device, 0.5f, rate);
    std::snprintf(label, sizeof label, "%s: sounds, finite and bounded at %.0f Hz", spec.name, rate);
    EXPECT(finite(out.left) && rms(out.left) > 1.0e-4 && peak(out.left) < spec.max_peak, label);
  }
  device.init(sample_rate);
}

}  // namespace testkit
