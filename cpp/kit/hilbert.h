#pragma once

#include "math.h"

namespace livemix {
namespace kit {

// A 90° phase-difference network: two chains of four second-order allpasses
// (Olli Niemitalo's coefficients) whose outputs stay in quadrature from about
// 0.002 to 0.498 of the sample rate. `process` returns the pair (in-phase,
// quadrature); both have unity magnitude. The basis of the frequency shifter
// and of single-sideband modulation.
class Hilbert {
 public:
  void reset() {
    for (Section& section : a_) section = Section();
    for (Section& section : b_) section = Section();
    delayed_ = 0.0f;
  }

  void process(float x, float* in_phase, float* quadrature) {
    float a = x;
    for (int i = 0; i < 4; ++i) a = a_[i].process(a, kCoeffA[i] * kCoeffA[i]);
    float b = x;
    for (int i = 0; i < 4; ++i) b = b_[i].process(b, kCoeffB[i] * kCoeffB[i]);
    *in_phase = delayed_;
    delayed_ = a;
    *quadrature = b;
  }

 private:
  struct Section {
    float x1 = 0.0f, x2 = 0.0f, y1 = 0.0f, y2 = 0.0f;
    // y[n] = c·(x[n] + y[n-2]) - x[n-2], with c = a² of the published a
    float process(float x, float c) {
      const float y = flush_denormal(c * (x + y2) - x2);
      x2 = x1;
      x1 = x;
      y2 = y1;
      y1 = y;
      return y;
    }
  };

  static constexpr float kCoeffA[4] = {0.6923878f, 0.9360654322959f, 0.9882295226860f,
                                       0.9987488452737f};
  static constexpr float kCoeffB[4] = {0.4021921162426f, 0.8561710882420f, 0.9722909545651f,
                                       0.9952884791278f};

  Section a_[4];
  Section b_[4];
  float delayed_ = 0.0f;
};

}  // namespace kit
}  // namespace livemix
