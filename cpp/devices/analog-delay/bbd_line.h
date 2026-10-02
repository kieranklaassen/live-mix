#pragma once

// A bucket-brigade line: a fixed number of charge samples moved along by a
// clock whose rate sets the delay (delay = kSamples / clock rate). Unlike a
// delay line with a moving read point it has no interpolated read: what was
// written comes out exactly kSamples ticks later, so
//
//   - a faster clock plays the stored signal back higher, a slower one lower,
//     for exactly one line length, and then the pitch is back to normal;
//   - the audio bandwidth is half the clock rate, so long delays are dark.
//
// The clock runs as a phase accumulator at the host rate. A host sample may
// hold no tick, one, or several:
//
//   in  : on each tick the input is read at the tick's instant inside the
//         host sample (linear between the last two host samples; the caller
//         band-limits the input below half the clock rate first);
//   out : the emerging stage is held until the next tick, as the sample and
//         hold at the end of a real line does, and the host sample is the
//         mean of that staircase over the sample period (a box integral, so
//         a tick between two host samples lands as the right fraction on
//         each instead of snapping to one).
//
// The staircase images a real line leaves around multiples of its clock are
// kept (the output filter after this block treats them as the analogue one
// does); the box integral only keeps them from folding at the host rate.

#include "../../kit/math.h"

namespace livemix {
namespace analog_delay {

class BbdLine {
 public:
  // 8192 stages on a two-phase clock hold 4096 samples.
  static constexpr int kSamples = 4096;
  static constexpr int kMask = kSamples - 1;
  // More ticks than this in one host sample are not needed for any setting
  // (20 ms an octave up at 44.1 kHz is 9.3); the clamp is a safety net.
  static constexpr float kMaxTicksPerSample = 16.0f;

  void reset(uint32_t seed) {
    for (float& stage : stages_) stage = 0.0f;
    index_ = 0;
    phase_ = 0.0f;
    held_ = 0.0f;
    previous_in_ = 0.0f;
    rng_.seed(seed);
  }

  // Clock phase in cycles, for the clock bleed.
  float phase() const { return phase_; }
  // The stage value now at the output, before the box integral.
  float held() const { return held_; }

  // One host sample. `ticks` is clock ticks per host sample, `headroom` the
  // level the stages saturate towards, `noise` the peak of the noise each
  // stage adds.
  float process(float in, float ticks, float headroom, float noise) {
    ticks = kit::clamp(ticks, 1.0e-4f, kMaxTicksPerSample);
    float end = phase_ + ticks;
    if (end < 1.0f) {
      // No tick in this sample: the held stage covers all of it.
      phase_ = end;
      previous_in_ = in;
      return held_;
    }
    const float inverse = 1.0f / ticks;
    const float inverse_headroom = 1.0f / headroom;
    float elapsed = 0.0f;  // share of this host sample already covered
    float sum = 0.0f;
    float start = phase_;
    while (end >= 1.0f) {
      const float span = (1.0f - start) * inverse;
      sum += held_ * span;
      elapsed += span;
      const float at = elapsed > 1.0f ? 1.0f : elapsed;
      const float sampled = previous_in_ + (in - previous_in_) * at;
      held_ = stages_[index_];
      const float charge =
          headroom * kit::fast_tanh(sampled * inverse_headroom) + noise * rng_.bipolar();
      stages_[index_] = flush_denormal(charge);
      index_ = (index_ + 1) & kMask;
      start = 0.0f;
      end -= 1.0f;
    }
    if (elapsed < 1.0f) sum += held_ * (1.0f - elapsed);
    phase_ = end;
    previous_in_ = in;
    return sum;
  }

 private:
  float stages_[kSamples] = {};
  int index_ = 0;
  float phase_ = 0.0f;
  float held_ = 0.0f;
  float previous_in_ = 0.0f;
  kit::Rng rng_;
};

}  // namespace analog_delay
}  // namespace livemix
