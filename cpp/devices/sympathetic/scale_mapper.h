#pragma once

// Which notes the strings are tuned to, ported from kkfonie's ScaleMapper
// with fixed storage in place of std::vector.
//
// Before a note has been heard the strings climb the scale from the root at
// C3. Once the detector has a note they move to that note's octave in order
// of consonance: root, root an octave up, fifth, third, then the remaining
// degrees, and octave doublings of the lot for the higher strings.

#include <cmath>

namespace livemix {
namespace sympathetic {

class ScaleMapper {
 public:
  enum Mode { kMajor = 0, kMinor = 1, kLearn = 2 };

  static constexpr int kMaxScale = 12;
  // Notes stay inside C1..B7. B7 (3951 Hz) is the highest note under the
  // strings' 4 kHz ceiling.
  static constexpr int kLowestNote = 24;
  static constexpr int kHighestNote = 107;

  void reset() {
    root_ = 0;
    mode_ = kMajor;
    learned_size_ = 0;
  }

  void set_root(int root) { root_ = ((root % 12) + 12) % 12; }
  void set_mode(int mode) { mode_ = mode == kMinor ? kMinor : (mode == kLearn ? kLearn : kMajor); }
  int root() const { return root_; }
  int mode() const { return mode_; }

  // Learn mode: the intervals above the root to use, ascending. An empty
  // set falls back to major.
  void set_learned_scale(const int* intervals, int count) {
    learned_size_ = count < 0 ? 0 : (count > kMaxScale ? kMaxScale : count);
    for (int i = 0; i < learned_size_; ++i) learned_[i] = intervals[i];
  }

  // The current scale as semitones above the root; returns its size.
  int current_scale(int* out) const {
    static constexpr int kMajorIntervals[7] = {0, 2, 4, 5, 7, 9, 11};
    static constexpr int kMinorIntervals[7] = {0, 2, 3, 5, 7, 8, 10};
    if (mode_ == kLearn && learned_size_ > 0) {
      for (int i = 0; i < learned_size_; ++i) out[i] = learned_[i];
      return learned_size_;
    }
    const int* intervals = mode_ == kMinor ? kMinorIntervals : kMajorIntervals;
    for (int i = 0; i < 7; ++i) out[i] = intervals[i];
    return 7;
  }

  static float midi_to_frequency(int note) {
    return 440.0f * std::exp2((static_cast<float>(note) - 69.0f) * (1.0f / 12.0f));
  }

  // MIDI notes for `count` strings. `detected_note` is the last note the
  // pitch detector settled on, or negative when there has been none.
  void resonator_notes(int count, int detected_note, int* out_notes) const {
    int scale[kMaxScale];
    const int size = current_scale(scale);

    if (detected_note < 0) {
      const int base = 48 + root_;  // C3 plus the root
      for (int i = 0; i < count; ++i) {
        out_notes[i] = fold(base + scale[i % size] + 12 * (i / size));
      }
      return;
    }

    const int base = (detected_note / 12) * 12 + root_;
    int order[kMaxScale + 2];
    int order_size = 0;
    order[order_size++] = 0;   // root
    order[order_size++] = 12;  // root, an octave up
    for (int i = 0; i < size; ++i) {
      if (scale[i] == 7) order[order_size++] = 7;  // perfect fifth, when the scale has one
    }
    // The third degree (a learned scale may already have it as the fifth),
    // then whatever is left, in scale order.
    if (size > 2 && !holds(order, order_size, scale[2])) order[order_size++] = scale[2];
    for (int i = 0; i < size; ++i) {
      if (!holds(order, order_size, scale[i])) order[order_size++] = scale[i];
    }
    for (int i = 0; i < count; ++i) {
      out_notes[i] = fold(base + order[i % order_size] + 12 * (i / order_size));
    }
  }

  void resonator_frequencies(int count, int detected_note, float* out_hz) const {
    int notes[32];
    if (count > 32) count = 32;
    resonator_notes(count, detected_note, notes);
    for (int i = 0; i < count; ++i) out_hz[i] = midi_to_frequency(notes[i]);
  }

 private:
  static bool holds(const int* order, int size, int interval) {
    for (int i = 0; i < size; ++i) {
      if (order[i] % 12 == interval) return true;
    }
    return false;
  }

  // Bring a note into range by octaves. The source clamped instead, which
  // stacked every string that ran off the top on C8 whatever the scale.
  static int fold(int note) {
    while (note > kHighestNote) note -= 12;
    while (note < kLowestNote) note += 12;
    return note;
  }

  int root_ = 0;
  int mode_ = kMajor;
  int learned_[kMaxScale] = {};
  int learned_size_ = 0;
};

}  // namespace sympathetic
}  // namespace livemix
