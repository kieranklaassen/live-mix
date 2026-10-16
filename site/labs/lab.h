#pragma once

// The lab: what a lesson's C++ file is written against.
//
// A lab is one file in site/labs/ that includes the engine's own headers (the
// kit and the devices), runs a loop through them, and keeps the signal at
// every stage as a "tap". The page reads the taps, draws them and plays them.
// A lab declares three kinds of thing, each once, as file-level objects:
//
//   lab::Control threshold{"threshold", "Threshold", "dB", -60, 0, -24};
//   lab::Tap     out{"out", "Output", lab::kAudio, lab::kDevice, 2};
//   lab::Check   null{"null", "Rebuilt against the device", "dB"};
//
// and defines one function, `void lab_render(int frames)`, which reads the
// controls (`threshold.value`), reads the source (`lab::in(channel)`), and
// writes the taps. Everything a page needs to know about a lab it asks the
// module itself (the exports at the foot of this file), so a name, a range or
// an origin lives in one place: here, beside the code it describes.
//
// Where a stage comes from is part of its declaration, and the page shows it:
//   kDevice  read from the running device (its output, or its own state)
//   kKit     computed by a kit class the device is built from
//   kLesson  written for the lesson
//   kSource  the sound that goes in, before anything is done to it
//   kEngine  made by the engine's own code outside a device: its TypeScript,
//            run by the page and handed to the lab (lab::aux below)
//
// Labs are built by site/scripts/build-labs.sh with the flags the library's
// own devices are built with, plus -fno-access-control so a lab can read a
// device's state without the device being changed for it. Like the devices,
// a lab is raw WebAssembly with no imports, no heap and no exceptions.

#include <cmath>
#include <cstdint>

#include "../../cpp/kit/kit.h"

namespace lab {

constexpr float kSampleRate = 48000.0f;
constexpr int kMaxFrames = 8 * 48000;
constexpr int kFadeFrames = 960;       // 20 ms: the crossfade across a loop's wrap
constexpr int kControlPeriod = 16;     // samples per point of a control tap
constexpr int kMaxControls = 32;       // the most a lab may declare of each of the three
constexpr int kMaxTaps = 48;
constexpr int kMaxChecks = 16;

// Pi as a double, for the lab's own sums. The kit's kPi is a float.
constexpr double kPi = 3.14159265358979323846;

enum Kind : int {
  kAudio = 0,     // sound: drawn as a wave, and heard
  kControl = 1,   // a value over time, one point every kControlPeriod samples
  kCurve = 2,     // y against x, x running evenly from x0 to x1 (or in even ratios: Tap::scale)
  kSpectrum = 3,  // level in dB against frequency, from x0 Hz to x1 Hz
  kFrames = 4,    // a picture: `columns` columns of `length / columns` rows
};

enum Origin : int { kDevice = 0, kKit = 1, kLesson = 2, kSource = 3, kEngine = 4 };

enum Scale : int { kLinear = 0, kLog = 1 };

// ---------------------------------------------------------------------------
// Memory: one static arena, handed out from the start on every render.

#ifndef LAB_ARENA_MB
#define LAB_ARENA_MB 40
#endif
constexpr int kArenaFloats = LAB_ARENA_MB * 1024 * 1024 / 4;

inline float g_arena[kArenaFloats];
inline int g_arena_used = 0;

// Zeroed floats that live until the next render. Null when the arena is full:
// a tap that got no room has length 0 and the page says so.
inline float* take(int count) {
  if (count <= 0 || g_arena_used + count > kArenaFloats) return nullptr;
  float* block = g_arena + g_arena_used;
  g_arena_used += count;
  for (int i = 0; i < count; ++i) block[i] = 0.0f;
  return block;
}

// ---------------------------------------------------------------------------
// The source the page wrote, and the loop being rendered.

inline float g_input[2][kMaxFrames];
inline int g_frames = 0;

inline const float* in(int channel) { return g_input[channel & 1]; }
inline int frames() { return g_frames; }

// A loop is rendered twice and a little more, and only the second pass is
// kept: a tail from the end is already sounding at the start, as it would be
// on the tenth time round. The little more (kFadeFrames) is crossfaded into
// the start of what is kept, so a device whose oscillator or grains do not
// come round with the loop still wraps without a step.
//
//   for (int i = 0; i < lab::total(); ++i) { x = lab::in_at(0, i); ... tap.put(i, y); }
inline int total() { return 2 * g_frames + kFadeFrames; }
inline float in_at(int channel, int i) { return g_frames > 0 ? g_input[channel & 1][i % g_frames] : 0.0f; }

// ---------------------------------------------------------------------------
// A second signal, for the lab that asks for one with `#define LAB_AUX` ahead
// of this file: something the page makes with the engine's TypeScript and
// hands over beside the source, such as a room's impulse response
// (site/src/lab/room.ts). Its taps are kEngine.

#ifdef LAB_AUX
inline float g_aux[2][kMaxFrames];
inline int g_aux_frames = 0;

inline const float* aux(int channel) { return g_aux[channel & 1]; }
inline int aux_frames() { return g_aux_frames; }
#endif

// ---------------------------------------------------------------------------
// Controls

struct Control;
inline Control* g_controls[kMaxControls];
inline int g_control_count = 0;

struct Control {
  const char* id;
  const char* name;
  const char* unit;
  float min;
  float max;
  float initial;
  int scale = kLinear;
  // "Hold|Release": the names of a switch's positions, which are 0, 1, 2...
  const char* choices = "";
  float value;

  Control(const char* id_, const char* name_, const char* unit_, float min_, float max_, float initial_,
          int scale_ = kLinear, const char* choices_ = "")
      : id(id_), name(name_), unit(unit_), min(min_), max(max_), initial(initial_), scale(scale_),
        choices(choices_), value(initial_) {
    if (g_control_count < kMaxControls) g_controls[g_control_count++] = this;
  }

  void set(float v) {
    if (std::isnan(v) || std::isinf(v)) v = initial;
    value = v < min ? min : (v > max ? max : v);
  }
  int choice() const { return static_cast<int>(value + 0.5f); }
  bool on() const { return value >= 0.5f; }
};

// ---------------------------------------------------------------------------
// Taps

struct Tap;
inline Tap* g_taps[kMaxTaps];
inline int g_tap_count = 0;

struct Tap {
  const char* id;
  const char* name;
  int kind;
  int origin;
  int channels;
  const char* unit;
  float* data = nullptr;  // planar: channel 0, then channel 1
  int length = 0;         // points per channel
  float x0 = 0.0f;        // kCurve, kSpectrum and kFrames: what the first and last point stand at
  float x1 = 1.0f;
  int columns = 0;       // kFrames
  int scale = kLinear;   // kCurve and kSpectrum: kLog when the points stand evenly in ratio, not in difference

  Tap(const char* id_, const char* name_, int kind_, int origin_, int channels_ = 1, const char* unit_ = "")
      : id(id_), name(name_), kind(kind_), origin(origin_), channels(channels_ == 2 ? 2 : 1), unit(unit_) {
    if (g_tap_count < kMaxTaps) g_taps[g_tap_count++] = this;
  }

  void clear() {
    data = nullptr;
    length = 0;
    columns = 0;
    scale = kLinear;
  }

  // Room for `points` per channel. False when the arena is full.
  bool open(int points) {
    data = take(points * channels);
    length = data ? points : 0;
    return data != nullptr;
  }

  float* channel(int c) { return data ? data + (c ? length : 0) : nullptr; }

  // One point of a looped render, by its place `i` in lab::total(): the first
  // pass is dropped, the second kept, the rest crossfaded into the start.
  void put(int i, float left, float right) {
    const int period = kind == kControl ? kControlPeriod : 1;
    const int kept = g_frames / period;
    const int fade = kFadeFrames / period;
    if (!data && !open(kept)) return;
    if (i % period != 0) return;
    const int k = i / period;
    if (k < kept) return;
    if (k < 2 * kept) {
      data[k - kept] = left;
      if (channels == 2) data[length + k - kept] = right;
    } else if (k - 2 * kept < fade && k - 2 * kept < kept) {
      const int j = k - 2 * kept;
      const float own = static_cast<float>(j) / static_cast<float>(fade);
      data[j] = left + (data[j] - left) * own;
      if (channels == 2) data[length + j] = right + (data[length + j] - right) * own;
    }
  }
  void put(int i, float value) { put(i, value, value); }

  // One point of a render that is not a loop: kept as it is.
  void set(int i, float left, float right) {
    if (!data || i < 0 || i >= length) return;
    data[i] = left;
    if (channels == 2) data[length + i] = right;
  }
  void set(int i, float value) { set(i, value, value); }
};

// ---------------------------------------------------------------------------
// Checks: numbers the lab works out about its own render, such as how far a
// rebuilt stage is from the device. The page shows them and the tests hold them.

struct Check;
inline Check* g_checks[kMaxChecks];
inline int g_check_count = 0;

struct Check {
  const char* id;
  const char* name;
  const char* unit;
  float value = 0.0f;
  Check(const char* id_, const char* name_, const char* unit_) : id(id_), name(name_), unit(unit_) {
    if (g_check_count < kMaxChecks) g_checks[g_check_count++] = this;
  }
};

// ---------------------------------------------------------------------------
// Measurements labs share. All of the spectra on the site come from the kit's
// own transform (cpp/kit/fft.h), so a picture of a spectrum is itself the
// engine at work.

constexpr float kFloorDb = -140.0f;

inline float to_db(float gain) { return gain > 1.0e-7f ? 20.0f * std::log10(gain) : kFloorDb; }
inline float power_to_db(float power) { return power > 1.0e-14f ? 10.0f * std::log10(power) : kFloorDb; }

// A sum of squared differences against the sum of squares it is held to, in
// dB: for the lab that adds the two up as its loop runs. -140 when nothing
// differs; 0 when there is a difference and nothing to hold it to.
inline float ratio_db(double diff, double ref) {
  if (ref <= 0.0) return diff <= 0.0 ? kFloorDb : 0.0f;
  const double ratio = diff / ref;
  return ratio > 1.0e-14 ? static_cast<float>(10.0 * std::log10(ratio)) : kFloorDb;
}

// The level of `x - y` against the level of `y`, in dB: how well a rebuilt
// signal matches the one it claims to equal. -140 when they are the same.
inline float difference_db(const float* x, const float* y, int count) {
  double diff = 0.0, ref = 0.0;
  for (int i = 0; i < count; ++i) {
    const double d = static_cast<double>(x[i]) - static_cast<double>(y[i]);
    diff += d * d;
    ref += static_cast<double>(y[i]) * static_cast<double>(y[i]);
  }
  return ratio_db(diff, ref);
}

inline float peak(const float* x, int count) {
  float top = 0.0f;
  for (int i = 0; i < count; ++i) {
    const float a = x[i] < 0.0f ? -x[i] : x[i];
    if (a > top) top = a;
  }
  return top;
}

inline float rms(const float* x, int count) {
  double sum = 0.0;
  for (int i = 0; i < count; ++i) sum += static_cast<double>(x[i]) * static_cast<double>(x[i]);
  return count > 0 ? static_cast<float>(std::sqrt(sum / count)) : 0.0f;
}

constexpr int kSpectrumSize = 4096;
constexpr int kSpectrumBins = kSpectrumSize / 2 + 1;

inline livemix::kit::Fft<kSpectrumSize> g_spectrum_fft;
inline float g_spectrum_window[kSpectrumSize];
inline float g_spectrum_re[kSpectrumSize];
inline float g_spectrum_im[kSpectrumSize];
inline float g_spectrum_out[kSpectrumBins];
inline bool g_spectrum_ready = false;

inline void spectrum_init() {
  if (g_spectrum_ready) return;
  g_spectrum_fft.init();
  for (int n = 0; n < kSpectrumSize; ++n) {
    g_spectrum_window[n] = static_cast<float>(0.5 - 0.5 * std::cos(2.0 * kPi * n / kSpectrumSize));
  }
  g_spectrum_ready = true;
}

// The average spectrum of `count` samples: Hann-windowed frames of 4096 half
// overlapped, their powers averaged, in dB where a full-scale sine reads 0.
// `out` takes kSpectrumBins values, bin k standing at k * 48000 / 4096 Hz.
inline void spectrum(const float* x, int count, float* out) {
  spectrum_init();
  static double power[kSpectrumBins];
  for (int k = 0; k < kSpectrumBins; ++k) power[k] = 0.0;
  int frames_done = 0;
  const int hop = kSpectrumSize / 2;
  for (int start = 0; start == 0 || start + kSpectrumSize <= count; start += hop) {
    for (int n = 0; n < kSpectrumSize; ++n) {
      const int i = start + n;
      g_spectrum_re[n] = i < count ? x[i] * g_spectrum_window[n] : 0.0f;
      g_spectrum_im[n] = 0.0f;
    }
    g_spectrum_fft.forward(g_spectrum_re, g_spectrum_im);
    for (int k = 0; k < kSpectrumBins; ++k) {
      power[k] += static_cast<double>(g_spectrum_re[k]) * g_spectrum_re[k] +
                  static_cast<double>(g_spectrum_im[k]) * g_spectrum_im[k];
    }
    ++frames_done;
  }
  // A Hann window passes half of a sine's amplitude, and the sine's energy
  // lands half in bin k and half in its mirror: N / 4 in bin k for amplitude 1.
  const double full = (kSpectrumSize / 4.0) * (kSpectrumSize / 4.0);
  for (int k = 0; k < kSpectrumBins; ++k) {
    out[k] = power_to_db(static_cast<float>(power[k] / (frames_done * full)));
  }
}

// Fill a kSpectrum tap from a signal.
inline void spectrum_tap(Tap& tap, const float* x, int count) {
  if (!tap.open(kSpectrumBins)) return;
  tap.x0 = 0.0f;
  tap.x1 = kSampleRate * 0.5f;
  spectrum(x, count, tap.data);
}

// The sum the Fourier transform is (the lesson on it), of `count` samples at
// one frequency in hertz: what an impulse response `h` does to that frequency.
// The angle of (re, im) is the phase, power() the level squared.
struct Bin {
  double re;
  double im;
  double power() const { return re * re + im * im; }
};

inline Bin fourier_at(const float* h, int count, double hz) {
  const double w = 2.0 * kPi * hz / kSampleRate;
  // One turn of a unit vector per sample, by recurrence: no sine per term.
  const double cw = std::cos(w), sw = std::sin(w);
  double c = 1.0, s = 0.0;
  Bin sum{0.0, 0.0};
  for (int n = 0; n < count; ++n) {
    sum.re += h[n] * c;
    sum.im -= h[n] * s;
    const double next = c * cw - s * sw;
    s = s * cw + c * sw;
    c = next;
  }
  return sum;
}

// The response of something to frequency, from its impulse response `h`: the
// level in dB at `points` frequencies standing in even ratios from `f0` to
// `f1` hertz, each worked out by fourier_at, at exactly that frequency. For
// a filter's curve: put one unit sample through it, keep what comes out, and
// hand it here.
inline void response_tap(Tap& tap, const float* h, int count, int points = 241, float f0 = 20.0f,
                         float f1 = 20000.0f) {
  if (!tap.open(points)) return;
  tap.x0 = f0;
  tap.x1 = f1;
  tap.scale = kLog;
  for (int p = 0; p < points; ++p) {
    const double hz = f0 * std::pow(static_cast<double>(f1) / f0, static_cast<double>(p) / (points - 1));
    tap.data[p] = power_to_db(static_cast<float>(fourier_at(h, count, hz).power()));
  }
}

// A picture of how a sound's spectrum changes: `columns` Hann-windowed frames
// of 1024 samples spread evenly over `count` samples, each transformed by the
// kit, in dB where a full-scale sine reads 0. Rows are the 513 bins from 0 Hz
// to half the sample rate, 46.9 Hz apart; point (column, row) is at
// data[column * 513 + row]. With `loops`, a frame near the end reads on from
// the start, as the loop does.
constexpr int kPictureSize = 1024;
constexpr int kPictureRows = kPictureSize / 2 + 1;

inline void spectrogram_tap(Tap& tap, const float* x, int count, int columns = 200, bool loops = true) {
  static livemix::kit::Fft<kPictureSize> fft;
  static float window[kPictureSize];
  static float re[kPictureSize];
  static float im[kPictureSize];
  static bool ready = false;
  if (!ready) {
    fft.init();
    for (int n = 0; n < kPictureSize; ++n) {
      window[n] = static_cast<float>(0.5 - 0.5 * std::cos(2.0 * kPi * n / kPictureSize));
    }
    ready = true;
  }
  if (count <= 0 || !tap.open(columns * kPictureRows)) return;
  tap.columns = columns;
  tap.x0 = 0.0f;
  tap.x1 = static_cast<float>(count) / kSampleRate;
  const double full = (kPictureSize / 4.0) * (kPictureSize / 4.0);
  for (int c = 0; c < columns; ++c) {
    const int start = static_cast<int>(static_cast<long long>(c) * count / columns);
    for (int n = 0; n < kPictureSize; ++n) {
      int i = start + n;
      if (i >= count) i = loops ? i % count : -1;
      re[n] = i >= 0 ? x[i] * window[n] : 0.0f;
      im[n] = 0.0f;
    }
    fft.forward(re, im);
    float* column = tap.data + c * kPictureRows;
    for (int k = 0; k < kPictureRows; ++k) {
      const double power = static_cast<double>(re[k]) * re[k] + static_cast<double>(im[k]) * im[k];
      column[k] = power_to_db(static_cast<float>(power / full));
    }
  }
}

// How the energy of a response dies away: at each of `points` instants, the
// energy still to come, in dB against the whole (Schroeder's integral, summed
// from the end backwards). A reverb's decay time is read off this curve: the
// time it takes to fall 60 dB.
inline void energy_decay_tap(Tap& tap, const float* x, int count, int points = 400) {
  if (count <= 0 || !tap.open(points)) return;
  tap.x0 = 0.0f;
  tap.x1 = static_cast<float>(count) / kSampleRate;
  double total = 0.0;
  for (int i = 0; i < count; ++i) total += static_cast<double>(x[i]) * x[i];
  double ahead = 0.0;
  int p = points - 1;
  for (int i = count - 1; i >= 0; --i) {
    ahead += static_cast<double>(x[i]) * x[i];
    while (p >= 0 && i <= static_cast<int>(static_cast<long long>(p) * (count - 1) / (points - 1))) {
      tap.data[p] = total > 0.0 ? power_to_db(static_cast<float>(ahead / total)) : kFloorDb;
      --p;
    }
  }
  for (; p >= 0; --p) tap.data[p] = 0.0f;
}

}  // namespace lab

// Each lab defines these two.
void lab_setup();             // once: init devices and tables
void lab_render(int frames);  // every render: read controls and the source, write taps and checks

extern "C" {

inline bool g_lab_ready = false;

void lab_init(void) {
  if (g_lab_ready) return;
  lab::spectrum_init();
  lab_setup();
  g_lab_ready = true;
}

float lab_sample_rate(void) { return lab::kSampleRate; }
int lab_max_frames(void) { return lab::kMaxFrames; }
float* lab_input(int channel) { return lab::g_input[channel & 1]; }

#ifdef LAB_AUX
// Exported by name here, so only a lab that takes a second signal has them.
__attribute__((export_name("lab_aux"))) float* lab_aux(int channel) { return lab::g_aux[channel & 1]; }
__attribute__((export_name("lab_aux_set"))) void lab_aux_set(int frames) {
  lab::g_aux_frames = frames < 0 ? 0 : (frames > lab::kMaxFrames ? lab::kMaxFrames : frames);
}
#endif

int lab_control_count(void) { return lab::g_control_count; }
static lab::Control* lab_control_at(int i) {
  return i >= 0 && i < lab::g_control_count ? lab::g_controls[i] : nullptr;
}
const char* lab_control_id(int i) { return lab_control_at(i) ? lab_control_at(i)->id : ""; }
const char* lab_control_name(int i) { return lab_control_at(i) ? lab_control_at(i)->name : ""; }
const char* lab_control_unit(int i) { return lab_control_at(i) ? lab_control_at(i)->unit : ""; }
const char* lab_control_choices(int i) { return lab_control_at(i) ? lab_control_at(i)->choices : ""; }
float lab_control_min(int i) { return lab_control_at(i) ? lab_control_at(i)->min : 0.0f; }
float lab_control_max(int i) { return lab_control_at(i) ? lab_control_at(i)->max : 0.0f; }
float lab_control_default(int i) { return lab_control_at(i) ? lab_control_at(i)->initial : 0.0f; }
int lab_control_scale(int i) { return lab_control_at(i) ? lab_control_at(i)->scale : 0; }
void lab_set(int i, float value) {
  if (lab_control_at(i)) lab_control_at(i)->set(value);
}

void lab_run(int frames) {
  lab_init();
  if (frames < 0) frames = 0;
  if (frames > lab::kMaxFrames) frames = lab::kMaxFrames;
  frames -= frames % lab::kControlPeriod;
  lab::g_frames = frames;
  lab::g_arena_used = 0;
  for (int i = 0; i < lab::g_tap_count; ++i) lab::g_taps[i]->clear();
  for (int i = 0; i < lab::g_check_count; ++i) lab::g_checks[i]->value = 0.0f;
  if (frames > 0) lab_render(frames);
}

int lab_tap_count(void) { return lab::g_tap_count; }
static lab::Tap* lab_tap_at(int i) { return i >= 0 && i < lab::g_tap_count ? lab::g_taps[i] : nullptr; }
const char* lab_tap_id(int i) { return lab_tap_at(i) ? lab_tap_at(i)->id : ""; }
const char* lab_tap_name(int i) { return lab_tap_at(i) ? lab_tap_at(i)->name : ""; }
const char* lab_tap_unit(int i) { return lab_tap_at(i) ? lab_tap_at(i)->unit : ""; }
int lab_tap_kind(int i) { return lab_tap_at(i) ? lab_tap_at(i)->kind : 0; }
int lab_tap_origin(int i) { return lab_tap_at(i) ? lab_tap_at(i)->origin : 0; }
int lab_tap_channels(int i) { return lab_tap_at(i) ? lab_tap_at(i)->channels : 0; }
float* lab_tap_data(int i) { return lab_tap_at(i) ? lab_tap_at(i)->data : nullptr; }
int lab_tap_length(int i) { return lab_tap_at(i) ? lab_tap_at(i)->length : 0; }
float lab_tap_x0(int i) { return lab_tap_at(i) ? lab_tap_at(i)->x0 : 0.0f; }
float lab_tap_x1(int i) { return lab_tap_at(i) ? lab_tap_at(i)->x1 : 0.0f; }
int lab_tap_columns(int i) { return lab_tap_at(i) ? lab_tap_at(i)->columns : 0; }
int lab_tap_scale(int i) { return lab_tap_at(i) ? lab_tap_at(i)->scale : 0; }

int lab_check_count(void) { return lab::g_check_count; }
static lab::Check* lab_check_at(int i) { return i >= 0 && i < lab::g_check_count ? lab::g_checks[i] : nullptr; }
const char* lab_check_id(int i) { return lab_check_at(i) ? lab_check_at(i)->id : ""; }
const char* lab_check_name(int i) { return lab_check_at(i) ? lab_check_at(i)->name : ""; }
const char* lab_check_unit(int i) { return lab_check_at(i) ? lab_check_at(i)->unit : ""; }
float lab_check_value(int i) { return lab_check_at(i) ? lab_check_at(i)->value : 0.0f; }

// The spectrum of an audio tap's channel, or of `count` samples of it from
// `start`: for the page's own looks at a stage (a spectrum of any stage, a
// spectrum of the part of the loop under the cursor). kSpectrumBins values.
float* lab_spectrum(int tap, int channel, int start, int count) {
  lab::Tap* t = lab_tap_at(tap);
  for (int k = 0; k < lab::kSpectrumBins; ++k) lab::g_spectrum_out[k] = lab::kFloorDb;
  if (!t || !t->data || t->kind != lab::kAudio) return lab::g_spectrum_out;
  if (start < 0) start = 0;
  if (start > t->length) start = t->length;
  if (count <= 0 || start + count > t->length) count = t->length - start;
  lab::spectrum(t->channel(channel == 1 && t->channels == 2 ? 1 : 0) + start, count, lab::g_spectrum_out);
  return lab::g_spectrum_out;
}
int lab_spectrum_bins(void) { return lab::kSpectrumBins; }

}  // extern "C"
