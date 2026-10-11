#pragma once

#include "../../kit/math.h"

namespace livemix {
namespace canon_dsp {

// The line the followers read: a stereo ring of any length (kit::DelayLine
// wants a power of two, which here would be 33 MB in place of 29). Reads are
// on whole frames only, so what comes out is what went in, bit for bit.
//
//   line.read(d, &l, &r);   // the frame written d writes ago, d >= 1
//   line.write(l, r);
//
// `forget()` makes everything written so far read as silence without
// touching the memory: what the device does when it wakes from sleep.
template <int Frames>
class Line {
 public:
  void clear() {
    for (int i = 0; i < 2 * Frames; ++i) buffer_[i] = 0.0f;
    head_ = 0;
    held_ = 0;
  }

  void forget() { held_ = 0; }

  void write(float left, float right) {
    buffer_[2 * head_] = left;
    buffer_[2 * head_ + 1] = right;
    if (++head_ == Frames) head_ = 0;
    if (held_ < Frames) ++held_;
  }

  // How many frames back can be read.
  int held() const { return held_; }

  void read(int delay, float* left, float* right) const {
    if (delay < 1 || delay > held_) {
      *left = 0.0f;
      *right = 0.0f;
      return;
    }
    int at = head_ - delay;
    if (at < 0) at += Frames;
    *left = buffer_[2 * at];
    *right = buffer_[2 * at + 1];
  }

 private:
  float buffer_[2 * Frames] = {};
  int head_ = 0;
  int held_ = 0;
};

}  // namespace canon_dsp
}  // namespace livemix
