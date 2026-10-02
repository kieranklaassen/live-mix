#pragma once

// One pitch-shifted voice of the Pitch Shifter: a small pool of read heads
// on a ring of recent input shared with the other voice. A head reads the
// ring at `ratio` samples per sample under a window, so its delay shrinks
// (shifting up) or grows (shifting down) while it sounds; before it runs out
// of room another head takes over further back or further forward. How the
// next head is placed and windowed is the mode:
//
//   Smooth   one head at a time with short raised-cosine joins. Each new
//            head starts where the ring best matches what the old head is
//            playing (normalised cross-correlation over one search range),
//            the de-glitched splice of the studio harmonizers. The join
//            gains keep the power constant for the match that was found.
//   Grain    four-fold overlapping Hann grains at regular intervals; Jitter
//            scatters their spacing, their place in time, their pitch and
//            their pan.
//   Vintage  two Hann heads half a window apart on a fixed grid with no
//            alignment: the plain delay-line shifter and its flutter.
//
// A change of mode starts a new generation of heads, already in full swing,
// and crossfades the generations with equal power.

#include "../../kit/kit.h"

namespace livemix {
namespace pitch_shifter_dsp {

constexpr int kRingSize = 1 << 18;  // 2.7 s at 96 kHz
constexpr int kRingMask = kRingSize - 1;

enum Mode : int { kSmooth = 0, kGrain, kVintage, kNumModes };

// The recent input (plus feedback), left, right and their mean (what the
// splice search listens to, so both channels splice at the same place and
// the stereo image holds).
struct Ring {
  kit::DelayLine<kRingSize> left, right, mono;

  void clear() {
    left.clear();
    right.clear();
    mono.clear();
  }
  void write(float l, float r) {
    left.write(l);
    right.write(r);
    mono.write(0.5f * (l + r));
  }
  // Index of the next sample to be written; the newest sample is now() - 1.
  int now() const { return left.write_position(); }
};

// What a voice needs to know when it starts a head, refreshed by the device
// on its control clock.
struct VoiceSetup {
  int mode = kSmooth;
  float size = 3840.0f;         // samples
  float jitter = 0.0f;          // 0..1
  float sample_rate = 48000.0f;
  float target_ratio = 1.0f;    // where the ratio is heading (head room for a sweep)
  float grain_gain = 0.5f;      // per-grain gain in Grain mode
};

class ShiftVoice {
 public:
  void reset(uint32_t seed, float sample_rate) {
    for (Head& head : heads_) head.active = false;
    rng_.seed(seed);
    generation_ = 0;
    blend_ = 1.0f;
    blend_step_ = 1.0f / (kModeFadeSeconds * sample_rate);
    until_spawn_ = 0.0f;
    match_ = 1.0f;
    newest_ = -1;
    started_ = false;
    mode_ = -1;
  }

  // Drop every head; the next render starts the mode again in full swing.
  void restart() {
    for (Head& head : heads_) head.active = false;
    blend_ = 1.0f;
    started_ = false;
    newest_ = -1;
  }

  // One output frame. `base` is the extra delay (the Delay control) in
  // samples, `ratio` the smoothed pitch ratio.
  void render(const Ring& ring, const VoiceSetup& setup, double base, float ratio, float* left,
              float* right) {
    if (!started_ || (setup.mode != mode_ && blend_ >= 1.0f)) begin_mode(ring, setup, base, ratio);
    if (until_spawn_ <= 0.0f) spawn(ring, setup, base, ratio, 0.0f);
    until_spawn_ -= 1.0f;

    float gain[2] = {1.0f, 0.0f};  // this generation, the one before
    if (blend_ < 1.0f) {
      blend_ += blend_step_;
      if (blend_ >= 1.0f) {
        blend_ = 1.0f;
        for (Head& head : heads_) {
          if (head.generation != generation_) head.active = false;
        }
      }
      gain[0] = kit::SineTable::lookup(0.25f * blend_);
      gain[1] = kit::SineTable::cos_lookup(0.25f * blend_);
    }

    const double origin = static_cast<double>(ring.now()) - base;
    const double limit = static_cast<double>(kMaxDelay) - base;
    float sum_left = 0.0f, sum_right = 0.0f;
    float join_left = 0.0f, join_right = 0.0f;  // the Smooth heads, normalised below
    float product = 1.0f;
    int joined = 0;
    for (Head& head : heads_) {
      if (!head.active) continue;
      const float window = window_at(head.phase, head.edge);
      const double position = origin - head.delay;
      const double floored = std::floor(position);
      const int index = static_cast<int>(static_cast<long long>(floored) & kRingMask);
      const float t = static_cast<float>(position - floored);
      const float l = kit::hermite(ring.left.at(index - 1), ring.left.at(index),
                                   ring.left.at(index + 1), ring.left.at(index + 2), t);
      const float r = kit::hermite(ring.right.at(index - 1), ring.right.at(index),
                                   ring.right.at(index + 1), ring.right.at(index + 2), t);
      const float g = window * gain[head.generation == generation_ ? 0 : 1];
      if (head.mode == kSmooth && head.generation == generation_) {
        join_left += window * l;
        join_right += window * r;
        product *= window;
        ++joined;
      } else {
        sum_left += g * head.gain_left * l;
        sum_right += g * head.gain_right * r;
      }
      head.delay += 1.0 - static_cast<double>(ratio * head.detune);
      if (head.delay < kMinDelay) head.delay = kMinDelay;
      if (head.delay > limit) head.delay = limit;
      head.phase += head.phase_step;
      if (head.phase >= 1.0f) head.active = false;
    }
    if (joined > 0) {
      // Two heads in a join add to 1 in amplitude; when they do not agree
      // (match < 1) that dips in power, so lift it back.
      float lift = gain[0];
      if (joined == 2 && match_ < 0.999f) {
        lift /= std::sqrt(kit::max(0.25f, 1.0f - 2.0f * product * (1.0f - match_)));
      }
      sum_left += lift * join_left;
      sum_right += lift * join_right;
    }
    *left = sum_left;
    *right = sum_right;
  }

  static constexpr float kMinDelay = 4.0f;
  static constexpr float kMaxDelay = static_cast<float>(kRingSize - 8);

 private:
  static constexpr int kMaxHeads = 12;
  static constexpr float kModeFadeSeconds = 0.04f;

  struct Head {
    bool active = false;
    int generation = 0;
    int mode = kSmooth;
    double delay = 0.0;       // behind the write point, less the base delay
    float detune = 1.0f;      // this head's own factor on the ratio (Jitter)
    float phase = 0.0f;       // 0..1 over its life
    float phase_step = 0.0f;
    float edge = 0.5f;        // share of the life each fade takes (0.5 = Hann)
    float gain_left = 1.0f, gain_right = 1.0f;
  };

  static float window_at(float phase, float edge) {
    if (phase < edge) return 0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * phase / edge);
    if (phase > 1.0f - edge) return 0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * (1.0f - phase) / edge);
    return 1.0f;
  }

  Head heads_[kMaxHeads];
  kit::Rng rng_;
  int generation_ = 0;
  int mode_ = -1;
  int newest_ = -1;
  float blend_ = 1.0f, blend_step_ = 0.0f;
  float until_spawn_ = 0.0f;
  float match_ = 1.0f;
  bool started_ = false;
};

}  // namespace pitch_shifter_dsp
}  // namespace livemix
