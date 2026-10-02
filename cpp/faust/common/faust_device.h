#pragma once

#include <cmath>

#include "../../common/dsp_util.h"
#include "../../kit/idle.h"
#include "faust_runtime.h"

namespace livemix::faust {

// Hosts one generated Faust DSP behind the same stereo bus contract as the
// hand-written devices (cpp/devices/dattorro/dattorro_device.h): fixed
// buffers, input consumed once, allocation-free process(). The ABI shim
// (cpp/faust/<device>.device.cpp) holds one static instance of this.
//
// Parameters are the DSP's active widgets in declaration order (see UI in
// faust_runtime.h). set_param() clamps to the declared range so a stray value
// from the message port can never push a Faust slider out of its domain.
//
// Sleep: with no input and the output under -140 dBFS for IdleHoldSeconds,
// process() only clears its output and the DSP's state stays as it is. The
// generated code cannot be asked what it is still doing, so the hold is the
// device's to state: longer than anything the DSP goes on doing in silence
// that the output does not show (sound in a delay line, an envelope coming
// back, a tail under a wet gain of 0). A new instance and a parameter that
// moves are awake for one hold: the DSP's own smoothers start from 0 and only
// advance while it runs.
template <typename Dsp, int IdleHoldSeconds>
class FaustDevice {
 public:
  static constexpr int kMaxBlockFrames = 2048;

  static_assert(Dsp::getStaticNumInputs() == 2 && Dsp::getStaticNumOutputs() == 2,
                "live-mix Faust devices are stereo in, stereo out");

  void init(float sample_rate) {
    // Faust's init() resets constants, slider defaults and state.
    dsp_.init(static_cast<int>(sample_rate));
    ui_ = UI{};
    dsp_.buildUserInterface(&ui_);
    for (int i = 0; i < kMaxBlockFrames; ++i) {
      in_left_[i] = 0.0f;
      in_right_[i] = 0.0f;
      out_left_[i] = 0.0f;
      out_right_[i] = 0.0f;
    }
    idle_.reset(sample_rate, static_cast<float>(IdleHoldSeconds));
    idle_.wake(true);
  }

  int param_count() const { return ui_.count(); }
  const FaustParam& param(int id) const { return ui_.param(id); }

  void set_param(int id, float value) {
    if (id < 0 || id >= ui_.count()) return;
    const FaustParam& spec = ui_.param(id);
    if (std::isnan(value)) value = spec.init;
    if (value < spec.min) value = spec.min;
    if (value > spec.max) value = spec.max;
    if (*spec.zone != value) idle_.wake(true);
    *spec.zone = value;
  }

  float param_value(int id) const {
    if (id < 0 || id >= ui_.count()) return 0.0f;
    return *ui_.param(id).zone;
  }

  // Write up to kMaxBlockFrames of input here before each process() call;
  // process() consumes and clears it.
  float* in_left() { return in_left_; }
  float* in_right() { return in_right_; }

  void process(int frames) {
    if (frames > kMaxBlockFrames) frames = kMaxBlockFrames;
    if (frames <= 0) return;
    const bool excited = block_present(in_left_, in_right_, frames);
    if (!idle_.wake(excited)) {
      for (int i = 0; i < frames; ++i) {
        out_left_[i] = 0.0f;
        out_right_[i] = 0.0f;
      }
      return;
    }
    FAUSTFLOAT* inputs[2] = {in_left_, in_right_};
    FAUSTFLOAT* outputs[2] = {out_left_, out_right_};
    dsp_.compute(frames, inputs, outputs);
    // Consumed once: the host writes the next block from scratch.
    for (int i = 0; i < frames; ++i) {
      in_left_[i] = 0.0f;
      in_right_[i] = 0.0f;
    }
    // While excited the gate is awake whatever comes out: no need to look.
    if (!excited) idle_.settle(block_peak(out_left_, out_right_, frames), frames);
  }

  const float* out_left() const { return out_left_; }
  const float* out_right() const { return out_right_; }

  // Test hook: true while process() only clears the output.
  bool asleep() const { return idle_.asleep(); }

 private:
  Dsp dsp_;
  UI ui_;
  kit::IdleGate idle_;

  float in_left_[kMaxBlockFrames] = {};
  float in_right_[kMaxBlockFrames] = {};
  float out_left_[kMaxBlockFrames] = {};
  float out_right_[kMaxBlockFrames] = {};
};

}  // namespace livemix::faust
