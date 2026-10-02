#pragma once

#include "../../kit/math.h"

namespace livemix {
namespace half_speed {

// Stereo ring of any length, interleaved (kit::DelayLine wants a power of
// two, which here would nearly double the memory). Reads are by delay behind
// the write point, held in a double so a slow head's place stays exact.
template <int Frames>
class StereoRing {
 public:
  static constexpr int kFrames = Frames;

  void clear() {
    for (int i = 0; i < 2 * Frames; ++i) buffer_[i] = 0.0f;
    head_ = 0;
  }

  void write(float left, float right) {
    buffer_[2 * head_] = left;
    buffer_[2 * head_ + 1] = right;
    if (++head_ == Frames) head_ = 0;
  }

  // The longest delay a read may ask for.
  static constexpr double max_delay() { return static_cast<double>(Frames - 8); }

  // Both channels `delay` frames behind the next write (delay >= 3),
  // Hermite-interpolated.
  void read(double delay, float* left, float* right) const {
    int i[4];
    const float t = locate(delay, i);
    *left = kit::hermite(buffer_[i[0]], buffer_[i[1]], buffer_[i[2]], buffer_[i[3]], t);
    *right = kit::hermite(buffer_[i[0] + 1], buffer_[i[1] + 1], buffer_[i[2] + 1],
                          buffer_[i[3] + 1], t);
  }

  // The mean of both channels a whole number of frames back.
  float mono(int delay) const {
    int at = head_ - delay;
    if (at < 0) at += Frames;
    return 0.5f * (buffer_[2 * at] + buffer_[2 * at + 1]);
  }

  // One channel only (0 left, 1 right).
  float read_one(double delay, int channel) const {
    int i[4];
    const float t = locate(delay, i);
    return kit::hermite(buffer_[i[0] + channel], buffer_[i[1] + channel], buffer_[i[2] + channel],
                        buffer_[i[3] + channel], t);
  }

 private:
  // Buffer offsets of the four frames around the read point (older to newer
  // is index 0 to 3 in time) and the fraction between the middle two.
  float locate(double delay, int* i) const {
    const int whole = static_cast<int>(delay);
    const float behind = static_cast<float>(delay - static_cast<double>(whole));
    // The read point lies between frames (whole + 1) and whole behind the
    // write point, a fraction (1 - behind) of the way from the older one.
    int at = head_ - whole - 2;
    if (at < 0) at += Frames;
    for (int k = 0; k < 4; ++k) {
      i[k] = 2 * at;
      if (++at == Frames) at = 0;
    }
    return 1.0f - behind;
  }

  float buffer_[2 * Frames] = {};
  int head_ = 0;
};

}  // namespace half_speed
}  // namespace livemix
