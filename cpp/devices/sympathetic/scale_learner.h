#pragma once

// Learn mode's memory, ported from the part of kkfonie's MarkovScaleLearner
// that reaches the sound: a pitch-class histogram that forgets, and the
// strongest classes in it as the scale. The key detection (Krumhansl-
// Schmuckler) only fed the plugin's display and is not here; neither is
// saving the histogram with the plugin state.

namespace livemix {
namespace sympathetic {

class ScaleLearner {
 public:
  // Each observation fades the rest by this much: about 200 observations
  // (nine seconds of held notes) of memory.
  static constexpr float kDecay = 0.995f;
  // A class counts once it holds this share of the strongest one, so a
  // single stray detection does not earn a string.
  static constexpr float kFloor = 0.02f;

  void reset() {
    for (float& weight : profile_) weight = 0.0f;
    count_ = 0;
  }

  void record(int midi_note, float seconds, float confidence) {
    const int pitch_class = ((midi_note % 12) + 12) % 12;
    for (float& weight : profile_) weight *= kDecay;
    profile_[pitch_class] += seconds * confidence;
    ++count_;
  }

  int count() const { return count_; }
  float weight(int pitch_class) const { return profile_[pitch_class]; }

  // The strongest pitch classes heard (at most `max_notes`) as intervals
  // above `root`, ascending; returns how many. The source always returned
  // seven classes and filled up with ones never played.
  int learned_scale(int root, int max_notes, int* out_intervals) const {
    float strongest = 0.0f;
    for (float weight : profile_) strongest = weight > strongest ? weight : strongest;
    if (!(strongest > 0.0f)) return 0;
    bool chosen[12] = {};
    int found = 0;
    for (; found < max_notes && found < 12; ++found) {
      int best = -1;
      for (int pc = 0; pc < 12; ++pc) {
        if (chosen[pc] || profile_[pc] < strongest * kFloor) continue;
        if (best < 0 || profile_[pc] > profile_[best]) best = pc;
      }
      if (best < 0) break;
      chosen[best] = true;
    }
    int size = 0;
    for (int interval = 0; interval < 12; ++interval) {
      if (chosen[(root + interval) % 12]) out_intervals[size++] = interval;
    }
    return size;
  }

 private:
  float profile_[12] = {};
  int count_ = 0;
};

}  // namespace sympathetic
}  // namespace livemix
