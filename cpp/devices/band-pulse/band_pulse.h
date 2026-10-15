#pragma once

// Band Pulse: an even pulse on the middle of a sound. The band between Low
// and High is turned down and up again Rate times a second; what lies under
// Low and over High is not pulsed.
//
//                  +--> low ---------------------+
//   in --> guard --+--> band --> x gain ---------+--> sum --> out
//                  +--> high --------------------+
//                                  ^
//   clock --> pulse --> gate ------+      gain = floor + (1 - floor) x open
//                                         floor = (1 - Depth) squared
//
// - The split is kit::ThreeBand (cpp/kit/band.h): fourth-order crossovers at
//   Low and High whose three parts add up to the input's level at every
//   frequency, turned in phase. There is no dry path beside it and no Mix:
//   the true input mixed back would notch at the crossovers. With Depth at 0
//   the gain is exactly 1 and the output is that all-pass of the input.
// - The pulse is the kit's (cpp/kit/beat.h): on from the clock's phase 0 for
//   Duty of the period between the half heights of two half-cosine edges of
//   Edge milliseconds, the edge held to half of the shorter of the on and off
//   times. A pulse only turns down, and nothing is made up for it: what comes
//   out is under what came in by what the gaps take away.
// - The right side reads the same clock Offset degrees later. At 180 with
//   Duty at a half the two gains add up to a constant, so the mono sum has no
//   pulse left in it.
// - Rate, Duty and Offset are not smoothed: kit::PulseGate lets the gain
//   move no faster than a quarter over the steepest part of the edge the
//   pulse has now, so a control thrown in the middle of a pulse is one more
//   edge. Depth, Low and High are smoothed over 5 ms, and the split is tuned
//   again on every sample while its edges glide. Edge is smoothed on its way
//   down only: thrown shorter it glides, or a rise under way would finish at
//   the short edge's speed; thrown longer it is there at once, so the gate
//   slows down at once.
// - The clock never stops and is never set by the sound. Awake or asleep it
//   and the two gates run on a sample at a time, by the very same sums, so
//   where a pulse stands follows from the count of samples since init and
//   from when Rate was moved, never from the sound or the block size.
// - What is smoothed arrives at once when sound comes back after
//   kArriveSeconds of exact silence at the input: the smoothers land, the
//   split is tuned where they landed and the gates are put where the pulse
//   stands. Nothing is sounding then (with Low at 60 Hz the split's ring
//   reads -238 dB a tenth of a second after loud noise stops). That moment is
//   counted in samples, so it does not depend on the block size the way
//   falling asleep does, and the idle hold is one block longer than it.
// - A sample that is not a number, or is past kSane, is taken as silence
//   before it reaches the split, which would keep it.
//
// Storage: no delay line. Fourteen filter sections, four smoothers, one
// clock and two gates; the device fits in the default 4 MB.

#include "../../kit/kit.h"
#include "../../kit/beat.h"
#include "../../kit/band.h"
#include "params.gen.h"

namespace livemix {

class BandPulse : public kit::DeviceBase<band_pulse::kNumParams> {
 public:
  // How long the input has to be exact silence before sound counts as new.
  static constexpr float kArriveSeconds = 0.1f;
  // Past this a sample is no sound at all (36 dB over full scale).
  static constexpr float kSane = 64.0f;

  static float guard(float x) { return (x > -kSane && x < kSane) ? x : 0.0f; }

  void init(float sample_rate) {
    using namespace band_pulse;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    clock_.reset();
    for (int c = 0; c < 2; ++c) {
      gate_[c].reset();
      split_[c].reset();
    }
    floor_.set_time(kSmoothingSeconds, sr);
    edge_.set_time(kSmoothingSeconds, sr);
    low_.set_time(kSmoothingSeconds, sr);
    high_.set_time(kSmoothingSeconds, sr);
    arrive_after_ = static_cast<long>(kArriveSeconds * sr);
    if (arrive_after_ < 1) arrive_after_ = 1;
    silent_ = arrive_after_;
    // One whole block more than the silence that counts as new sound, so the
    // device is never asleep before that silence is over.
    idle_.reset(sr, kArriveSeconds + static_cast<float>(kMaxBlockFrames + 1) / sr);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    tune();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      // Asleep the clock and the gates go on as they do awake, a sample at a
      // time, so that where they stand afterwards is the same to the last bit.
      for (int i = 0; i < frames; ++i) {
        float open[2];
        run_clock(open);
      }
      silent_ = arrive_after_;
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      in[0] = guard(in[0]);
      in[1] = guard(in[1]);
      if (in[0] == 0.0f && in[1] == 0.0f) {
        if (silent_ < arrive_after_) ++silent_;
      } else {
        if (silent_ >= arrive_after_) arrive();
        silent_ = 0;
      }

      if (!low_.settled() || !high_.settled()) {
        low_.next();
        high_.next();
        tune();
      }
      if (!edge_.settled()) {
        edge_.next();
        shape();
      }
      const float floor = floor_.next();
      float open[2];
      run_clock(open);
      float out[2];
      for (int c = 0; c < 2; ++c) {
        const kit::Bands parts = split_[c].process(in[c]);
        out[c] = parts.low + parts.band * kit::pulse_gain(open[c], floor) + parts.high;
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  // The two gates for this sample, the right one Offset behind, and the
  // clock on by one.
  void run_clock(float* open) {
    open[0] = gate_[0].next(clock_.phase, shape_, step_);
    open[1] = gate_[1].next(kit::wrap_phase(clock_.phase - offset_turns_), shape_, step_);
    clock_.step(step_);
  }

  // The pulse's shape from Rate, Duty and the smoothed Edge.
  void shape() {
    using namespace band_pulse;
    shape_ = kit::pulse_shape(param(kRate), param(kDuty), edge_.value);
  }

  // Both channels' crossovers where the smoothed edges stand. (Edges set
  // before the first block land in their smoothers and are tuned here by
  // arrive(), at the first sample of sound.)
  void tune() {
    for (int c = 0; c < 2; ++c) split_[c].set(low_.value, high_.value, sample_rate());
  }

  // Sound after a silence: nothing is sounding, so every knob moved in the
  // silence has arrived and the gates stand where the pulse puts them.
  void arrive() {
    floor_.snap(floor_.target);
    edge_.snap(edge_.target);
    shape();
    low_.snap(low_.target);
    high_.snap(high_.target);
    tune();
    gate_[0].reset(kit::pulse_open(clock_.phase, shape_));
    gate_[1].reset(kit::pulse_open(kit::wrap_phase(clock_.phase - offset_turns_), shape_));
  }

  void apply(int id) {
    using namespace band_pulse;
    switch (id) {
      case kRate:
        step_ = kit::SlowClock::increment(param(kRate), sample_rate());
        shape();
        break;
      case kDuty:
        shape();
        break;
      case kEdge: {
        const float seconds = 0.001f * param(kEdge);
        if (seconds >= edge_.value) {
          edge_.snap(seconds);  // longer: at once
        } else {
          edge_.set(seconds, primed());
        }
        shape();
        break;
      }
      case kDepth:
        floor_.set(kit::pulse_floor(param(kDepth)), primed());
        break;
      case kOffset:
        offset_turns_ = static_cast<double>(param(kOffset)) / 360.0;
        break;
      case kLow:
        low_.set(param(kLow), primed());
        break;
      case kHigh:
        high_.set(param(kHigh), primed());
        break;
      default:
        break;
    }
  }

  kit::ThreeBand split_[2];
  kit::PulseGate gate_[2];
  kit::SlowClock clock_;
  kit::PulseShape shape_ = {0.5f, 0.1f};
  // Depth as the level it leaves in the gap, Edge in seconds, and the
  // band's two edges.
  kit::Smoother floor_;
  kit::Smoother edge_;
  kit::Smoother low_;
  kit::Smoother high_;
  kit::IdleGate idle_;
  double step_ = 0.0;          // what the clock moves on by each sample, in cycles
  double offset_turns_ = 0.0;  // how far the right side's pulse is behind
  // Samples of exact silence at the input, up to arrive_after_.
  long silent_ = 0;
  long arrive_after_ = 0;
};

}  // namespace livemix
