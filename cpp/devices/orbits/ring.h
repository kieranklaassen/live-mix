#pragma once

#include "../../kit/math.h"

namespace livemix {
namespace orbits {

// One channel of tape of any length (kit::DelayLine wants a power of two,
// which would cost a third more memory here). What is asked for is how far
// behind the write head a sample lies: `back(d)` is the sample written d
// writes ago, d >= 1. `forget()` makes everything written so far read as
// silence without touching the memory: a blank loop when the device starts
// again from rest.
template <int Frames>
class Ring {
 public:
  static constexpr int kFrames = Frames;

  void clear() {
    for (int i = 0; i < Frames; ++i) buffer_[i] = 0.0f;
    head_ = 0;
    held_ = 0;
  }

  void forget() { held_ = 0; }

  void write(float x) {
    buffer_[head_] = x;
    if (++head_ == Frames) head_ = 0;
    if (held_ < Frames) ++held_;
  }

  // The sample written `delay` writes ago, exactly; silence for one that was
  // never written, was forgotten or has been written over.
  float back(int delay) const {
    if (delay < 1 || delay > held_) return 0.0f;
    const int at = head_ - delay;
    return buffer_[at < 0 ? at + Frames : at];
  }

  // Hermite read between samples, `delay` >= 2 writes behind the head. On a
  // whole delay it returns the stored sample exactly.
  float read(double delay) const {
    const int whole = static_cast<int>(delay);
    const float t = static_cast<float>(delay - static_cast<double>(whole));
    if (t == 0.0f) return back(whole);
    return kit::hermite(back(whole - 1), back(whole), back(whole + 1), back(whole + 2), t);
  }

 private:
  float buffer_[Frames] = {};
  int head_ = 0;
  // How many of the newest samples are there to be read.
  int held_ = 0;
};

}  // namespace orbits
}  // namespace livemix
