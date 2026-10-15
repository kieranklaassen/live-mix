#pragma once

// Ear Shift: skeleton. The input passes as it came; the harness is written
// against this first, so that each of its checks is seen to fail.

#include "../../kit/kit.h"
#include "../../kit/band.h"
#include "../../kit/beat.h"
#include "params.gen.h"

namespace livemix {

class EarShift : public kit::DeviceBase<ear_shift::kNumParams> {
 public:
  static constexpr float kArriveSeconds = 0.5f;

  void init(float sample_rate) {
    using namespace ear_shift;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    idle_.reset(this->sample_rate(), 0.1f);
  }

  void set_param(int id, float value) { store_param(id, value); }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      out_left_[i] = in[0];
      out_right_[i] = in[1];
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  kit::IdleGate idle_;
};

}  // namespace livemix
