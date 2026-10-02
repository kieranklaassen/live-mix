#pragma once

#include "../../kit/math.h"

namespace livemix {
namespace half_speed {

// Fractional-delay read kernels: an 8-tap Kaiser-windowed sinc at 128
// sub-sample positions, joined by straight lines. A head that plays slower
// than the input was recorded is an upsampler, and what a short interpolator
// leaves of the spectral images lands in the audible band (at quarter speed
// from 6 kHz up). Against the kit's 4-point Hermite this takes the image of
// a 9 kHz partial from -31 dB to under -50 dB.
class SincTable {
 public:
  static constexpr int kTaps = 8;
  static constexpr int kPhases = 128;

  static void init() {
    if (ready()) return;
    float* table = data();
    const double beta = 6.5;
    for (int phase = 0; phase <= kPhases; ++phase) {
      const double fraction = static_cast<double>(phase) / kPhases;
      double row[kTaps];
      double sum = 0.0;
      for (int k = 0; k < kTaps; ++k) {
        const double x = static_cast<double>(k - (kTaps / 2 - 1)) - fraction;
        const double r = x / (kTaps / 2);
        const double window = r * r < 1.0 ? bessel_i0(beta * std::sqrt(1.0 - r * r)) / bessel_i0(beta) : 0.0;
        const double pix = 3.14159265358979323846 * x;
        row[k] = (x > -1.0e-9 && x < 1.0e-9 ? 1.0 : std::sin(pix) / pix) * window;
        sum += row[k];
      }
      for (int k = 0; k < kTaps; ++k) table[phase * kTaps + k] = static_cast<float>(row[k] / sum);
    }
    ready() = true;
  }

  // The eight gains for a point `fraction` of the way from tap 3 to tap 4.
  static void at(float fraction, float* gains) {
    const float position = fraction * kPhases;
    int phase = static_cast<int>(position);
    if (phase >= kPhases) phase = kPhases - 1;
    const float between = position - static_cast<float>(phase);
    const float* row = data() + phase * kTaps;
    for (int k = 0; k < kTaps; ++k) gains[k] = row[k] + (row[k + kTaps] - row[k]) * between;
  }

 private:
  static float* data() {
    static float table[(kPhases + 1) * kTaps];
    return table;
  }
  static bool& ready() {
    static bool is_ready = false;
    return is_ready;
  }
  static double bessel_i0(double x) {
    double sum = 1.0, term = 1.0;
    for (int k = 1; k < 32; ++k) {
      term *= (x / (2.0 * k)) * (x / (2.0 * k));
      sum += term;
    }
    return sum;
  }
};

// Stereo ring of any length, interleaved (kit::DelayLine wants a power of
// two, which here would nearly double the memory). Reads are by delay behind
// the write point, held in a double so a slow head's place stays exact. The
// first frames are kept a second time past the end, so the eight frames a
// read needs are always next to each other.
template <int Frames>
class StereoRing {
 public:
  static constexpr int kFrames = Frames;
  // The shortest delay a fractional read may ask for.
  static constexpr double kMinDelay = 5.0;

  void clear() {
    for (int i = 0; i < 2 * (Frames + kGuard); ++i) buffer_[i] = 0.0f;
    head_ = 0;
  }

  void write(float left, float right) {
    buffer_[2 * head_] = left;
    buffer_[2 * head_ + 1] = right;
    if (head_ < kGuard) {
      buffer_[2 * (head_ + Frames)] = left;
      buffer_[2 * (head_ + Frames) + 1] = right;
    }
    if (++head_ == Frames) head_ = 0;
  }

  // The longest delay a read may ask for.
  static constexpr double max_delay() { return static_cast<double>(Frames - 16); }

  // Both channels `delay` frames behind the next write.
  void read(double delay, float* left, float* right) const {
    float gains[SincTable::kTaps];
    const float* frame = locate(delay, gains);
    float l = 0.0f, r = 0.0f;
    for (int k = 0; k < SincTable::kTaps; ++k) {
      l += gains[k] * frame[2 * k];
      r += gains[k] * frame[2 * k + 1];
    }
    *left = l;
    *right = r;
  }

  // One channel only (0 left, 1 right).
  float read_one(double delay, int channel) const {
    float gains[SincTable::kTaps];
    const float* frame = locate(delay, gains) + channel;
    float sum = 0.0f;
    for (int k = 0; k < SincTable::kTaps; ++k) sum += gains[k] * frame[2 * k];
    return sum;
  }

  // The mean of both channels a whole number of frames back.
  float mono(int delay) const {
    int at = head_ - delay;
    if (at < 0) at += Frames;
    return 0.5f * (buffer_[2 * at] + buffer_[2 * at + 1]);
  }

 private:
  static constexpr int kGuard = SincTable::kTaps;

  // The first of the eight frames around the read point (oldest first) and
  // their gains.
  const float* locate(double delay, float* gains) const {
    const int whole = static_cast<int>(delay);
    const float behind = static_cast<float>(delay - static_cast<double>(whole));
    // The read point lies between the frames (whole + 1) and whole behind
    // the write point, (1 - behind) of the way from the older to the newer.
    SincTable::at(1.0f - behind, gains);
    int at = head_ - whole - 1 - (SincTable::kTaps / 2 - 1);
    if (at < 0) at += Frames;
    return buffer_ + 2 * at;
  }

  float buffer_[2 * (Frames + kGuard)] = {};
  int head_ = 0;
};

}  // namespace half_speed
}  // namespace livemix
