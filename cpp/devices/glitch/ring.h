#pragma once

#include "../../kit/math.h"

namespace livemix {
namespace glitch {

// Stereo ring with a power-of-two length, both channels side by side so a
// read touches one stretch of memory. Positions are absolute frame counts
// (the index of the first frame written is 0), so a reader's place stays
// exact however long the session runs. `forget()` makes everything written
// so far read as silence without touching the memory: what the device does
// when it wakes from sleep. Frames not yet written, forgotten or already
// overwritten read as silence.
template <int Frames>
class StereoRing {
 public:
  static constexpr int kFrames = Frames;
  static constexpr int kMask = Frames - 1;
  static_assert((Frames & (Frames - 1)) == 0, "StereoRing length must be a power of two");

  // Taps on each side of the centre of the half-band filter in read_halved.
  static constexpr int kHalfTaps = 6;
  static constexpr int kHalfReach = 2 * kHalfTaps - 1;

  void clear() {
    for (int i = 0; i < 2 * Frames; ++i) buffer_[i] = 0.0f;
    written_ = 0;
    valid_from_ = 0;
  }

  void forget() { valid_from_ = written_; }

  void write(float left, float right) {
    const int at = static_cast<int>(written_ & kMask) * 2;
    buffer_[at] = left;
    buffer_[at + 1] = right;
    ++written_;
  }

  // Number of frames written so far: the newest frame is written() - 1.
  long long written() const { return written_; }

  // The stored frame at a whole position, exactly.
  void read_at(long long index, float* left, float* right) const {
    if (index >= valid_from_ && index < written_ && written_ - index <= Frames) {
      const int at = static_cast<int>(index & kMask) * 2;
      *left = buffer_[at];
      *right = buffer_[at + 1];
    } else {
      *left = 0.0f;
      *right = 0.0f;
    }
  }

  // Hermite read at any position; a whole position returns the stored frame.
  void read(double position, float* left, float* right) const {
    const double floored = std::floor(position);
    const long long whole = static_cast<long long>(floored);
    const float t = static_cast<float>(position - floored);
    if (t == 0.0f) {
      read_at(whole, left, right);
      return;
    }
    float l[4], r[4];
    if (whole - 1 >= valid_from_ && whole + 2 < written_ && written_ - whole < Frames - 2) {
      for (int k = 0; k < 4; ++k) {
        const int at = static_cast<int>((whole - 1 + k) & kMask) * 2;
        l[k] = buffer_[at];
        r[k] = buffer_[at + 1];
      }
    } else {
      for (int k = 0; k < 4; ++k) read_at(whole - 1 + k, &l[k], &r[k]);
    }
    *left = kit::hermite(l[0], l[1], l[2], l[3], t);
    *right = kit::hermite(r[0], r[1], r[2], r[3], t);
  }

  // The frame at a whole position after a half-band low-pass (`taps` are the
  // kHalfTaps odd-offset coefficients, the centre is 0.5): what a reader
  // moving two frames per sample takes, so that the top octave of the
  // recording is removed instead of folding down into the audible band.
  void read_halved(long long index, const float* taps, float* left, float* right) const {
    float l, r;
    read_at(index, &l, &r);
    float sum_left = 0.5f * l;
    float sum_right = 0.5f * r;
    if (index - kHalfReach >= valid_from_ && index + kHalfReach < written_ &&
        written_ - index < Frames - kHalfReach) {
      for (int k = 0; k < kHalfTaps; ++k) {
        const int before = static_cast<int>((index - (2 * k + 1)) & kMask) * 2;
        const int after = static_cast<int>((index + (2 * k + 1)) & kMask) * 2;
        sum_left += taps[k] * (buffer_[before] + buffer_[after]);
        sum_right += taps[k] * (buffer_[before + 1] + buffer_[after + 1]);
      }
    } else {
      for (int k = 0; k < kHalfTaps; ++k) {
        float bl, br, al, ar;
        read_at(index - (2 * k + 1), &bl, &br);
        read_at(index + (2 * k + 1), &al, &ar);
        sum_left += taps[k] * (bl + al);
        sum_right += taps[k] * (br + ar);
      }
    }
    *left = sum_left;
    *right = sum_right;
  }

  // Kaiser-windowed half-band taps for read_halved, scaled to unity gain at DC.
  static void design_half_band(float* taps) {
    const double pi = 3.14159265358979323846;
    const double beta = 6.5;
    double sum = 0.0;
    double raw[kHalfTaps];
    for (int k = 0; k < kHalfTaps; ++k) {
      const int n = 2 * k + 1;
      const double ideal = std::sin(pi * n / 2.0) / (pi * n);
      const double ratio = static_cast<double>(n) / (kHalfReach + 1);
      raw[k] = ideal * bessel_i0(beta * std::sqrt(1.0 - ratio * ratio)) / bessel_i0(beta);
      sum += raw[k];
    }
    for (int k = 0; k < kHalfTaps; ++k) taps[k] = static_cast<float>(raw[k] * 0.25 / sum);
  }

 private:
  static double bessel_i0(double x) {
    double sum = 1.0;
    double term = 1.0;
    for (int k = 1; k < 32; ++k) {
      term *= (x / (2.0 * k)) * (x / (2.0 * k));
      sum += term;
    }
    return sum;
  }

  float buffer_[2 * Frames] = {};
  long long written_ = 0;
  long long valid_from_ = 0;
};

}  // namespace glitch
}  // namespace livemix
