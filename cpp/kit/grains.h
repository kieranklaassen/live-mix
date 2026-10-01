#pragma once

#include "math.h"

namespace livemix {
namespace kit {

// A pool of overlapping grains over any sample source. Each grain reads the
// source at its own position and rate under a window whose edges are
// raised-cosine fades (`shape` 1 = a full Hann bell, towards 0 = a flat top
// with short fades), panned by constant power. The engine neither owns the
// audio nor decides when grains start: a device spawns them (density, spray
// and pitch scatter are its policy) and renders the pool once per sample.
//
// Source contract: `float read(int channel, double position) const`, with
// position in the source's own sample units and any bounds handling (wrap
// for a ring buffer, clamp or silence for a sample) done there.
template <int MaxGrains>
class GrainPool {
 public:
  static constexpr int kMaxGrains = MaxGrains;

  void reset() {
    for (Grain& grain : grains_) grain.active = false;
    active_ = 0;
  }

  int active() const { return active_; }

  // Start a grain; false when the pool is full. `rate` is source samples per
  // output sample (negative plays backwards), `length` its duration in
  // output samples.
  bool spawn(double position, float rate, float length, float pan, float gain, float shape) {
    if (length < 8.0f) length = 8.0f;
    for (Grain& grain : grains_) {
      if (grain.active) continue;
      grain.active = true;
      grain.position = position;
      grain.rate = rate;
      grain.phase = 0.0f;
      grain.phase_step = 1.0f / length;
      grain.edge = clamp(shape, 0.02f, 1.0f) * 0.5f;
      pan_gains(pan, &grain.gain_left, &grain.gain_right);
      grain.gain_left *= gain;
      grain.gain_right *= gain;
      ++active_;
      return true;
    }
    return false;
  }

  // Add one output frame of every active grain to *left / *right.
  template <typename Source>
  void render(const Source& source, float* left, float* right) {
    if (active_ == 0) return;
    float sum_left = 0.0f;
    float sum_right = 0.0f;
    for (Grain& grain : grains_) {
      if (!grain.active) continue;
      const float window = window_at(grain.phase, grain.edge);
      sum_left += source.read(0, grain.position) * window * grain.gain_left;
      sum_right += source.read(1, grain.position) * window * grain.gain_right;
      grain.position += grain.rate;
      grain.phase += grain.phase_step;
      if (grain.phase >= 1.0f) {
        grain.active = false;
        --active_;
      }
    }
    *left += sum_left;
    *right += sum_right;
  }

 private:
  struct Grain {
    bool active = false;
    double position = 0.0;
    float rate = 1.0f;
    float phase = 0.0f;
    float phase_step = 0.0f;
    float edge = 0.5f;
    float gain_left = 0.0f;
    float gain_right = 0.0f;
  };

  static float window_at(float phase, float edge) {
    if (phase < edge) return 0.5f - 0.5f * SineTable::cos_lookup(0.5f * phase / edge);
    if (phase > 1.0f - edge) return 0.5f - 0.5f * SineTable::cos_lookup(0.5f * (1.0f - phase) / edge);
    return 1.0f;
  }

  Grain grains_[MaxGrains];
  int active_ = 0;
};

}  // namespace kit
}  // namespace livemix
