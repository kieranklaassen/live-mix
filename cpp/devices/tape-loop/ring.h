#pragma once

#include "../../kit/math.h"

namespace livemix {
namespace tape_loop {

// Stereo ring of any length (kit::DelayLine wants a power of two: 32 MB for
// a 30 s loop at 96 kHz instead of 23). Positions are absolute sample counts
// held in a double, so a read stays exact however long the session runs.
// `forget()` makes everything written so far read as silence without
// touching the memory: a blank tape when the device wakes from sleep.
template <int Frames>
class StereoRing {
 public:
  static constexpr int kFrames = Frames;

  void clear() {
    for (int i = 0; i < 2 * Frames; ++i) buffer_[i] = 0.0f;
    written_ = 0;
    valid_from_ = 0;
    head_ = 0;
  }

  void forget() { valid_from_ = written_; }

  void write(float left, float right) {
    buffer_[2 * head_] = left;
    buffer_[2 * head_ + 1] = right;
    if (++head_ == Frames) head_ = 0;
    ++written_;
  }

  // Number of frames written so far: the position the next write lands on.
  double written() const { return static_cast<double>(written_); }

  // Hermite read of both channels at `position`. On a whole position it
  // returns the stored frame exactly. Frames from before forget(), not yet
  // written, or already overwritten read as silence.
  void read(double position, float* left, float* right) const {
    const double floored = std::floor(position);
    const long long whole = static_cast<long long>(floored);
    const float t = static_cast<float>(position - floored);
    if (whole - 1 >= valid_from_ && whole + 2 < written_ && written_ - whole < Frames - 2) {
      int i0 = slot(whole - 1);
      int i1 = i0 + 1 == Frames ? 0 : i0 + 1;
      int i2 = i1 + 1 == Frames ? 0 : i1 + 1;
      int i3 = i2 + 1 == Frames ? 0 : i2 + 1;
      i0 *= 2;
      i1 *= 2;
      i2 *= 2;
      i3 *= 2;
      *left = kit::hermite(buffer_[i0], buffer_[i1], buffer_[i2], buffer_[i3], t);
      *right = kit::hermite(buffer_[i0 + 1], buffer_[i1 + 1], buffer_[i2 + 1], buffer_[i3 + 1], t);
      return;
    }
    // At an edge of what the ring holds: frame by frame.
    float l[4], r[4];
    for (int k = 0; k < 4; ++k) {
      const long long index = whole - 1 + k;
      if (index < valid_from_ || index >= written_ || written_ - index > Frames) {
        l[k] = 0.0f;
        r[k] = 0.0f;
      } else {
        const int at = slot(index) * 2;
        l[k] = buffer_[at];
        r[k] = buffer_[at + 1];
      }
    }
    *left = kit::hermite(l[0], l[1], l[2], l[3], t);
    *right = kit::hermite(r[0], r[1], r[2], r[3], t);
  }

 private:
  // Where frame `index` (one of the last Frames written) is stored. Worked
  // from the write slot: a 64-bit remainder per read is slow in WASM.
  int slot(long long index) const {
    const int at = head_ - static_cast<int>(written_ - index);
    return at < 0 ? at + Frames : at;
  }

  float buffer_[2 * Frames] = {};
  long long written_ = 0;
  long long valid_from_ = 0;
  int head_ = 0;
};

}  // namespace tape_loop
}  // namespace livemix
