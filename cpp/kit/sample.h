#pragma once

#include "math.h"

namespace livemix {
namespace kit {

// Fixed storage for one loaded sound, for devices that play a sample the host
// hands them (granular synth, sampler). The device exposes three extra ABI
// entry points (cpp/common/device_api.h, "sample devices") that forward here:
//
//   int    sample_capacity()               frames per channel that fit
//   float* sample_buffer()                 where the host writes: channel 0,
//                                          then channel 1 at +capacity frames
//   void   sample_commit(frames, ch, rate) what was written
//
// The host runs on the audio thread between blocks, so a commit never tears a
// block; the device still has to drop or fade voices that were reading the
// old sound (it owns that policy). Reads are Hermite-interpolated and return
// silence outside [0, frames).
template <int MaxFrames>
class SampleStore {
 public:
  static constexpr int kMaxFrames = MaxFrames;

  int capacity() const { return MaxFrames; }
  float* buffer() { return data_; }

  void commit(int frames, int channels, float sample_rate) {
    frames_ = clamp_int(frames, 0, MaxFrames);
    channels_ = channels >= 2 ? 2 : 1;
    sample_rate_ = sample_rate > 1.0f ? sample_rate : 48000.0f;
    for (int i = 0; i < frames_; ++i) {
      if (!(data_[i] == data_[i]) || data_[i] > 8.0f || data_[i] < -8.0f) data_[i] = 0.0f;
      float& right = data_[MaxFrames + i];
      if (channels_ == 1) {
        right = data_[i];
      } else if (!(right == right) || right > 8.0f || right < -8.0f) {
        right = 0.0f;
      }
    }
  }

  void clear() { frames_ = 0; }

  int frames() const { return frames_; }
  bool loaded() const { return frames_ > 0; }
  float sample_rate() const { return sample_rate_; }
  float seconds() const { return static_cast<float>(frames_) / sample_rate_; }

  // For devices that synthesise a built-in sound at init so they play before
  // anything is loaded: write channel(c)[i], then commit().
  float* channel(int c) { return data_ + (c == 0 ? 0 : MaxFrames); }

  float at(int channel, int index) const {
    if (index < 0 || index >= frames_) return 0.0f;
    return data_[(channel == 0 ? 0 : MaxFrames) + index];
  }

  float read(int channel, double position) const {
    if (position < -1.0 || position >= static_cast<double>(frames_)) return 0.0f;
    const double floored = std::floor(position);
    const int index = static_cast<int>(floored);
    const float t = static_cast<float>(position - floored);
    return hermite(at(channel, index - 1), at(channel, index), at(channel, index + 1),
                   at(channel, index + 2), t);
  }

  // As read(), with the position wrapped into [start, end): for loops.
  float read_wrapped(int channel, double position, int start, int end) const {
    const int length = end - start;
    if (length <= 0) return 0.0f;
    const double floored = std::floor(position);
    const int index = static_cast<int>(floored);
    const float t = static_cast<float>(position - floored);
    return hermite(at(channel, wrap(index - 1, start, length)), at(channel, wrap(index, start, length)),
                   at(channel, wrap(index + 1, start, length)),
                   at(channel, wrap(index + 2, start, length)), t);
  }

 private:
  static int wrap(int index, int start, int length) {
    int offset = (index - start) % length;
    if (offset < 0) offset += length;
    return start + offset;
  }

  float data_[MaxFrames * 2] = {};
  int frames_ = 0;
  int channels_ = 1;
  float sample_rate_ = 48000.0f;
};

}  // namespace kit
}  // namespace livemix
