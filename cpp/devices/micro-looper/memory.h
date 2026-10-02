#pragma once

#include <cstring>

#include "../../kit/math.h"

namespace livemix {
namespace micro_looper {

// What the looper remembers, in two parts.
//
// Ring: the always-listening memory, a stereo ring the record stage writes
// at the looper's clock. Positions are absolute counts of frames written,
// held in a double, so a loop is addressed the same way however long the
// session runs. The count starts one ring length up, so no position a loop
// can ask for is negative and truncation is floor. `forget()` makes
// everything written so far read as silence (waking from sleep: the gap was
// silent).
//
// Store: where a loop is kept once it is held, so that the ring can go on
// listening. The device copies a capture into it a few frames per sample
// (never a block copy on the audio thread) and plays from the ring until the
// copy is complete; both hold the same frames, so the change is inaudible.
// Six weights for one read that interpolates (Catmull-Rom, as kit::hermite)
// and low-passes at once: the Hermite kernel at fraction `t` convolved with
// (a, 1 - 2a, a) one frame apart. They apply to frames whole - 2 .. whole + 3.
// a = 0 is the plain Hermite read; a = 1/4 is a raised cosine with its zero
// on Nyquist.
inline void wide_weights(float t, float a, float* w) {
  const float t2 = t * t;
  const float t3 = t2 * t;
  const float c0 = -0.5f * t3 + t2 - 0.5f * t;
  const float c1 = 1.5f * t3 - 2.5f * t2 + 1.0f;
  const float c2 = -1.5f * t3 + 2.0f * t2 + 0.5f * t;
  const float c3 = 0.5f * t3 - 0.5f * t2;
  const float b = 1.0f - 2.0f * a;
  w[0] = a * c0;
  w[1] = b * c0 + a * c1;
  w[2] = a * c0 + b * c1 + a * c2;
  w[3] = a * c1 + b * c2 + a * c3;
  w[4] = a * c2 + b * c3;
  w[5] = a * c3;
}

template <int Frames>
class Ring {
 public:
  static constexpr int kFrames = Frames;
  static constexpr int kMask = Frames - 1;
  static_assert((Frames & (Frames - 1)) == 0, "Ring size must be a power of two");

  void clear() {
    for (int i = 0; i < 2 * Frames; ++i) buffer_[i] = 0.0f;
    written_ = Frames;
    valid_from_ = Frames;
  }

  void forget() { valid_from_ = written_; }

  void write(float left, float right) {
    const int at = static_cast<int>(written_ & kMask) * 2;
    buffer_[at] = left;
    buffer_[at + 1] = right;
    ++written_;
  }

  long long written() const { return written_; }

  // One stored frame; silence when it is from before forget(), not written
  // yet, or already overwritten.
  void frame(long long index, float* left, float* right) const {
    if (index < valid_from_ || index >= written_ || written_ - index > Frames) {
      *left = 0.0f;
      *right = 0.0f;
      return;
    }
    const int at = static_cast<int>(index & kMask) * 2;
    *left = buffer_[at];
    *right = buffer_[at + 1];
  }

  // `count` frames from `from` into `dest`, interleaved.
  void copy(long long from, int count, float* dest) const {
    const int at = static_cast<int>(from & kMask);
    if (from >= valid_from_ && from + count <= written_ && written_ - from <= Frames &&
        at + count <= Frames) {
      std::memcpy(dest, buffer_ + 2 * at, sizeof(float) * 2 * static_cast<size_t>(count));
      return;
    }
    for (int k = 0; k < count; ++k) frame(from + k, &dest[2 * k], &dest[2 * k + 1]);
  }

  // The sum of both channels, Hermite on the summed frames: what the side
  // signal is made from, at half the work of reading each channel.
  float read_sum(double position) const {
    const long long whole = static_cast<long long>(position);
    const float t = static_cast<float>(position - static_cast<double>(whole));
    if (whole - 1 >= valid_from_ && whole + 2 < written_ && written_ - whole < Frames - 2) {
      const int i0 = static_cast<int>((whole - 1) & kMask) * 2;
      const int i1 = static_cast<int>(whole & kMask) * 2;
      const int i2 = static_cast<int>((whole + 1) & kMask) * 2;
      const int i3 = static_cast<int>((whole + 2) & kMask) * 2;
      return kit::hermite(buffer_[i0] + buffer_[i0 + 1], buffer_[i1] + buffer_[i1 + 1],
                          buffer_[i2] + buffer_[i2 + 1], buffer_[i3] + buffer_[i3 + 1], t);
    }
    float sum[4];
    for (int k = 0; k < 4; ++k) {
      float left, right;
      frame(whole - 1 + k, &left, &right);
      sum[k] = left + right;
    }
    return kit::hermite(sum[0], sum[1], sum[2], sum[3], t);
  }

  // Both channels through wide_weights: the read for speeds above 1.
  void read_wide(double position, float a, float* left, float* right) const {
    const long long whole = static_cast<long long>(position);
    float w[6];
    wide_weights(static_cast<float>(position - static_cast<double>(whole)), a, w);
    float l = 0.0f, r = 0.0f;
    if (whole - 2 >= valid_from_ && whole + 3 < written_ && written_ - whole < Frames - 3) {
      for (int k = 0; k < 6; ++k) {
        const int at = static_cast<int>((whole - 2 + k) & kMask) * 2;
        l += w[k] * buffer_[at];
        r += w[k] * buffer_[at + 1];
      }
    } else {
      for (int k = 0; k < 6; ++k) {
        float fl, fr;
        frame(whole - 2 + k, &fl, &fr);
        l += w[k] * fl;
        r += w[k] * fr;
      }
    }
    *left = l;
    *right = r;
  }

  // Hermite read of both channels. A whole position returns the stored frame.
  void read(double position, float* left, float* right) const {
    const long long whole = static_cast<long long>(position);
    const float t = static_cast<float>(position - static_cast<double>(whole));
    if (whole - 1 >= valid_from_ && whole + 2 < written_ && written_ - whole < Frames - 2) {
      const int i0 = static_cast<int>((whole - 1) & kMask) * 2;
      const int i1 = static_cast<int>(whole & kMask) * 2;
      const int i2 = static_cast<int>((whole + 1) & kMask) * 2;
      const int i3 = static_cast<int>((whole + 2) & kMask) * 2;
      *left = kit::hermite(buffer_[i0], buffer_[i1], buffer_[i2], buffer_[i3], t);
      *right = kit::hermite(buffer_[i0 + 1], buffer_[i1 + 1], buffer_[i2 + 1], buffer_[i3 + 1], t);
      return;
    }
    float l[4], r[4];
    for (int k = 0; k < 4; ++k) frame(whole - 1 + k, &l[k], &r[k]);
    *left = kit::hermite(l[0], l[1], l[2], l[3], t);
    *right = kit::hermite(r[0], r[1], r[2], r[3], t);
  }

 private:
  float buffer_[2 * Frames] = {};
  long long written_ = Frames;
  long long valid_from_ = Frames;
};

// A stretch of the ring kept aside: frames [base, base + count) of the
// ring's own numbering. Reads outside it are silence.
template <int Frames>
class Store {
 public:
  static constexpr int kFrames = Frames;

  void clear() {
    for (int i = 0; i < 2 * Frames; ++i) buffer_[i] = 0.0f;
    base_ = 0;
    count_ = 0;
  }

  // Start a new stretch at ring frame `base`; what it held is gone.
  void begin(long long base) {
    base_ = base;
    count_ = 0;
  }

  long long base() const { return base_; }
  long long end() const { return base_ + count_; }
  bool full() const { return count_ >= Frames; }

  // Room for up to `wanted` more frames: where to write them (interleaved)
  // and how many fit. They count as held at once.
  float* claim(int wanted, int* granted) {
    const long long room = Frames - count_;
    *granted = wanted < room ? wanted : static_cast<int>(room);
    float* at = buffer_ + 2 * count_;
    count_ += *granted;
    return at;
  }

  float read_sum(double position) const {
    const long long floored = static_cast<long long>(position);
    const long long whole = floored - base_;
    const float t = static_cast<float>(position - static_cast<double>(floored));
    if (whole >= 1 && whole + 2 < count_) {
      const float* p = buffer_ + 2 * (whole - 1);
      return kit::hermite(p[0] + p[1], p[2] + p[3], p[4] + p[5], p[6] + p[7], t);
    }
    float sum[4];
    for (int k = 0; k < 4; ++k) {
      const long long index = whole - 1 + k;
      sum[k] = (index >= 0 && index < count_) ? buffer_[2 * index] + buffer_[2 * index + 1] : 0.0f;
    }
    return kit::hermite(sum[0], sum[1], sum[2], sum[3], t);
  }

  void read_wide(double position, float a, float* left, float* right) const {
    const long long floored = static_cast<long long>(position);
    const long long whole = floored - base_;
    float w[6];
    wide_weights(static_cast<float>(position - static_cast<double>(floored)), a, w);
    float l = 0.0f, r = 0.0f;
    if (whole >= 2 && whole + 3 < count_) {
      const float* p = buffer_ + 2 * (whole - 2);
      for (int k = 0; k < 6; ++k) {
        l += w[k] * p[2 * k];
        r += w[k] * p[2 * k + 1];
      }
    } else {
      for (int k = 0; k < 6; ++k) {
        const long long index = whole - 2 + k;
        if (index < 0 || index >= count_) continue;
        l += w[k] * buffer_[2 * index];
        r += w[k] * buffer_[2 * index + 1];
      }
    }
    *left = l;
    *right = r;
  }

  void read(double position, float* left, float* right) const {
    const long long floored = static_cast<long long>(position);
    const long long whole = floored - base_;
    const float t = static_cast<float>(position - static_cast<double>(floored));
    if (whole >= 1 && whole + 2 < count_) {
      const float* p = buffer_ + 2 * (whole - 1);
      *left = kit::hermite(p[0], p[2], p[4], p[6], t);
      *right = kit::hermite(p[1], p[3], p[5], p[7], t);
      return;
    }
    float l[4], r[4];
    for (int k = 0; k < 4; ++k) {
      const long long index = whole - 1 + k;
      const bool inside = index >= 0 && index < count_;
      l[k] = inside ? buffer_[2 * index] : 0.0f;
      r[k] = inside ? buffer_[2 * index + 1] : 0.0f;
    }
    *left = kit::hermite(l[0], l[1], l[2], l[3], t);
    *right = kit::hermite(r[0], r[1], r[2], r[3], t);
  }

 private:
  float buffer_[2 * Frames] = {};
  long long base_ = 0;
  long long count_ = 0;
};

}  // namespace micro_looper
}  // namespace livemix
