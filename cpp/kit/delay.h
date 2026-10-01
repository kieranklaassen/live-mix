#pragma once

#include "math.h"

namespace livemix {
namespace kit {

// Circular delay line with a power-of-two capacity held in the object (so in
// the device's static storage). The convention every block here follows:
//
//   y = line.read(d);      // x[n - d], d >= 1
//   line.write(x);         // stores x[n]
//
// Fractional reads interpolate between neighbouring samples: linear for
// modulated chorus-type taps (cheap, slight high-frequency loss that suits
// them), Hermite for pitch-critical reads.
template <int Size>
class DelayLine {
 public:
  static constexpr int kSize = Size;
  static constexpr int kMask = Size - 1;
  static_assert((Size & (Size - 1)) == 0, "DelayLine size must be a power of two");

  void clear() {
    for (int i = 0; i < Size; ++i) buffer_[i] = 0.0f;
    write_ = 0;
  }

  void write(float x) {
    buffer_[write_] = x;
    write_ = (write_ + 1) & kMask;
  }

  // The longest delay a fractional read can ask for.
  static constexpr float max_delay() { return static_cast<float>(Size - 4); }

  float read(int delay) const { return buffer_[(write_ - delay) & kMask]; }

  float read_linear(float delay) const {
    const int whole = static_cast<int>(delay);
    const float fraction = delay - static_cast<float>(whole);
    const float a = buffer_[(write_ - whole) & kMask];
    const float b = buffer_[(write_ - whole - 1) & kMask];
    return a + (b - a) * fraction;
  }

  float read_hermite(float delay) const {
    const int whole = static_cast<int>(delay);
    const float fraction = delay - static_cast<float>(whole);
    const float ym1 = buffer_[(write_ - whole + 1) & kMask];
    const float y0 = buffer_[(write_ - whole) & kMask];
    const float y1 = buffer_[(write_ - whole - 1) & kMask];
    const float y2 = buffer_[(write_ - whole - 2) & kMask];
    return hermite(ym1, y0, y1, y2, fraction);
  }

  // Absolute access for grain and reverse readers: `position` counts written
  // samples (see write_position), fractional, anywhere in the last Size.
  int write_position() const { return write_; }
  float at(int index) const { return buffer_[index & kMask]; }
  float at_linear(float position) const {
    const float floored = std::floor(position);
    const int index = static_cast<int>(floored);
    const float fraction = position - floored;
    const float a = buffer_[index & kMask];
    const float b = buffer_[(index + 1) & kMask];
    return a + (b - a) * fraction;
  }
  float at_hermite(float position) const {
    const float floored = std::floor(position);
    const int index = static_cast<int>(floored);
    const float fraction = position - floored;
    return hermite(buffer_[(index - 1) & kMask], buffer_[index & kMask],
                   buffer_[(index + 1) & kMask], buffer_[(index + 2) & kMask], fraction);
  }

 private:
  float buffer_[Size] = {};
  int write_ = 0;
};

// Schroeder allpass on a delay line: flat magnitude, smeared phase. The
// diffusion stage of every reverb and the smear in the cloud delays here.
// `read_delay` may be fractional and modulated.
template <int Size>
class AllpassDelay {
 public:
  void clear() { line_.clear(); }

  float process(float x, int delay, float gain) {
    const float delayed = line_.read(delay);
    const float v = flush_denormal(x + gain * delayed);
    line_.write(v);
    return delayed - gain * v;
  }

  float process_modulated(float x, float delay, float gain) {
    const float delayed = line_.read_linear(delay);
    const float v = flush_denormal(x + gain * delayed);
    line_.write(v);
    return delayed - gain * v;
  }

 private:
  DelayLine<Size> line_;
};

}  // namespace kit
}  // namespace livemix
