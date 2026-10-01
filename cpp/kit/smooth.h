#pragma once

#include "math.h"

namespace livemix {
namespace kit {

// One-pole parameter smoother. The house rule is a 5 ms time constant: the
// host sends bare values over the MessagePort, so every audible parameter
// ramps inside the device. `snap` until the first block has run, so the
// initial parameters do not glide in from the defaults.
struct Smoother {
  float value = 0.0f;
  float target = 0.0f;
  float coeff = 0.0f;

  void set_time(float seconds, float sample_rate) { coeff = time_to_coeff(seconds, sample_rate); }

  void snap(float v) {
    value = v;
    target = v;
  }

  void set_target(float v) { target = v; }

  // Ramp when `primed`, snap otherwise (parameters set before the first block).
  void set(float v, bool primed) {
    if (primed) {
      target = v;
    } else {
      snap(v);
    }
  }

  float next() {
    const float delta = value - target;
    // Land exactly. Close to the target the step falls under half a float
    // step and the value would stall there (or, towards zero, shrink into
    // denormals); either way the remaining distance is inaudible.
    const float epsilon = 1.0e-6f * (target < 0.0f ? -target : target) + 1.0e-9f;
    const float stepped = target + delta * coeff;
    if ((delta > -epsilon && delta < epsilon) || stepped == value) {
      value = target;
    } else {
      value = stepped;
    }
    return value;
  }

  bool settled() const { return value == target; }
};

// Linear ramp over a fixed number of samples; reaches the target exactly.
struct LinearRamp {
  float value = 0.0f;
  float target = 0.0f;
  float step = 0.0f;
  int remaining = 0;
  int length = 1;

  void set_time(float seconds, float sample_rate) {
    length = static_cast<int>(seconds * sample_rate);
    if (length < 1) length = 1;
  }

  void snap(float v) {
    value = v;
    target = v;
    remaining = 0;
  }

  void set_target(float v) {
    if (v == target) return;
    target = v;
    remaining = length;
    step = (target - value) / static_cast<float>(length);
  }

  void set(float v, bool primed) {
    if (primed) {
      set_target(v);
    } else {
      snap(v);
    }
  }

  float next() {
    if (remaining > 0) {
      value += step;
      if (--remaining == 0) value = target;
    }
    return value;
  }
};

// Fires once every `period` samples whatever the host's block size, so
// control-rate work (LFOs, coefficient updates, grain scheduling) lands on
// the same samples for a 128-frame block, a 1-frame block and an offline
// render. Devices tick it per sample:
//
//   if (clock_.tick()) update_coefficients();
struct ControlClock {
  int period = 32;
  int counter = 0;

  void reset(int samples = 32) {
    period = samples < 1 ? 1 : samples;
    counter = 0;
  }
  // True on the first sample and every `period` samples after it.
  bool tick() {
    const bool fire = counter == 0;
    if (++counter >= period) counter = 0;
    return fire;
  }
};

}  // namespace kit
}  // namespace livemix
