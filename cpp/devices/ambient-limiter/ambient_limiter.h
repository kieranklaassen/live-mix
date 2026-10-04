#pragma once

// Ambient Limiter: a true-peak ceiling for the master with a slow stage in
// front of it, so a sustained over is ridden down and the brickwall is left
// with the moments.
//
//   in × gain ──┬──────────────────────────► × ride ──► brickwall ──► out
//               │                               ▲       (77 samples)
//               └──► peak hold ──► target ──► slow gain
//
// - A limiter with one release fails a drone twice: short, its gain recovers
//   between the peaks of a low note and is pushed down again every half
//   cycle, which is distortion; long, one stray peak ducks the mix for
//   seconds. Here the ride takes the sustained part with a gain that ends up
//   standing still, and the brickwall (80 ms release) only meets what the
//   ride has not reached yet.
// - The detector is the larger of |left| and |right| after Gain, into a peak
//   hold: the largest magnitude of the last 40 ms. That is longer than half a
//   cycle of 12.5 Hz, so the peaks of any audible drone read as one level,
//   also when the samples catch each peak a little differently.
// - The target is min(0, Ceiling − 0.5 dB − held peak) times Ride, in dB. When
//   the held peak drops, the target rises no faster than a follower falling
//   with a 150 ms time constant would let it (58 dB a second), so a release
//   starts gently.
// - The ride follows the target in dB with one pole each way: 250 ms towards
//   more reduction, Release towards less. A level that stays over the ceiling
//   settles 0.5 dB under it and the brickwall has nothing left to do. The
//   0.5 dB covers what a true-peak reading adds to the sample peak the hold
//   sees on sustained material.
// - That fall starts from where the gain is, never from below it. A peak the
//   gain had not caught up with when the hold let go is over: what is left of
//   it must not go on pulling the gain down. So a 3 ms burst costs what 43 ms
//   of the 250 ms pole can do, and the release starts there.
// - The dB conversions and the ballistics run every 16 samples on a control
//   clock and the linear gain is ramped between ticks; the peak hold runs per
//   sample. Output does not depend on the host's block size.
// - The brickwall is livemix::TruePeakLimiter with a fixed 72-frame lookahead:
//   77 samples of delay at every sample rate, no sample and no BS.1770
//   four-times-oversampled peak above Ceiling. It smooths its own ceiling.
// - Both stages are stereo-linked: one gain for both channels.
// - A sample that is not a number, infinite, or beyond +40 dBFS is a fault
//   upstream and is read as silence. An infinite peak would otherwise leave
//   the ride at minus infinity, which is a master that never comes back.
// - meter(0) is the total reduction now in dB (0 or less): ride plus
//   brickwall, as they stood at the end of the last block. TruePeakLimiter's
//   release stops a float step short of unity once it has worked (0.001 dB
//   at 48 kHz, 0.002 dB at 96 kHz); the meter reads that as rest, 0 dB.
// - The ride keeps releasing through silence, so the device stays awake until
//   it is home (0 dB) and the output has been silent for 100 ms. Asleep, the
//   peak hold, the brickwall and the smoothers are cleared, so the next sound
//   starts from the settings as they are then, with no glide.

#include "../../kit/kit.h"
#include "../true-peak-limiter/true_peak_limiter.h"
#include "params.gen.h"

namespace livemix {

class AmbientLimiter : public kit::DeviceBase<ambient_limiter::kNumParams> {
 public:
  // The brickwall's lookahead in frames, the same at every sample rate.
  static constexpr int kLookahead = 72;
  // The fixed audio delay, as reported in device.json (latencySamples).
  static constexpr int kLatency = kLookahead + TruePeakLimiter::kInterpolatorDelay - 1;
  static_assert(kLatency == 77, "device.json reports 77 samples of latency");

  void init(float sample_rate) {
    using namespace ambient_limiter;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    gain_.set_time(kSmoothingSeconds, sr);
    hold_.set(kHoldSeconds, sr);
    down_coeff_ = kit::time_to_coeff(kDownSeconds, sr / kControlPeriod);
    // A level falling with time constant T loses 20 / (T ln 10) dB a second.
    fall_step_ = 8.685889638f / kFallSeconds * kControlPeriod / sr;
    wall_.setInputGainDb(0.0f);
    wall_.setReleaseMs(kWallReleaseMs);
    wall_.prepare(sr, kLookahead);
    // The delay has to pass before the gate can call the output silent.
    idle_.reset(sr, kIdleHoldSeconds);
    rest();
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by meters[index] in device.json; 0 for an unknown one.
  // 0 is the total reduction, 1 the ride's own share of it, for a display that
  // draws the slow stage and the brickwall apart.
  float meter(int index) const { return index == 0 ? meter_ : index == 1 ? ride_db_ : 0.0f; }

  // The ride's own share of the reduction in dB (0 or less), for the harness.
  float ride_db() const { return ride_db_; }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames) || ride_db_ < 0.0f)) {
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float left, right;
      take_input(i, &left, &right);
      const float gain = gain_.next();
      left = sane(left) * gain;
      right = sane(right) * gain;

      hold_.process(kit::max(std::fabs(left), std::fabs(right)));
      if (clock_.tick()) step_ride();
      ride_gain_ += ride_step_;
      left *= ride_gain_;
      right *= ride_gain_;

      wall_.process(left, right);
      out_left_[i] = left;
      out_right_[i] = right;
    }
    idle_.settle(output_peak(frames), frames);
    const float wall_db = wall_.gainReductionDb();
    meter_ = ride_db_ + (wall_db < -kWallRestDb ? wall_db : 0.0f);
    if (idle_.asleep() && ride_db_ == 0.0f) rest();
  }

 private:
  static constexpr int kControlPeriod = 16;
  static constexpr float kHoldSeconds = 0.04f;
  static constexpr float kFallSeconds = 0.15f;
  static constexpr float kDownSeconds = 0.25f;
  static constexpr float kMarginDb = 0.5f;
  static constexpr float kWallReleaseMs = 80.0f;
  static constexpr float kIdleHoldSeconds = 0.1f;
  // Closer to 0 dB than this the release lands, so the device can sleep.
  static constexpr float kHomeDb = 0.001f;
  // Closer to 0 dB than this the brickwall is at rest (see meter above).
  static constexpr float kWallRestDb = 0.005f;
  // No bus carries more than this (+40 dBFS); beyond it a sample is a fault.
  static constexpr float kInputLimit = 100.0f;

  // The sample, or silence for a fault (the comparison is false for NaN too).
  static float sane(float x) { return std::fabs(x) <= kInputLimit ? x : 0.0f; }

  // Peak hold: the largest magnitude of the last `seconds`, so a peak reads
  // at once and for that long after it. The window is kept as the maxima of
  // kSlices consecutive slices, which makes the hold between the set time and
  // one slice more (40 to 41.25 ms at 48 kHz). kit::Follower has an attack
  // and a release but no hold, and a hold that only a higher peak renews
  // lets go of a steady tone whenever its sample peaks differ by a hair.
  struct PeakHold {
    static constexpr int kSlices = 32;

    float slices[kSlices] = {};
    float filling = 0.0f;  // the largest of the slice being filled
    float older = 0.0f;    // the largest of the finished slices
    int length = 1;        // samples in a slice
    int count = 0;
    int index = 0;

    void set(float seconds, float sample_rate) {
      length = static_cast<int>(std::ceil(seconds * sample_rate / kSlices));
      if (length < 1) length = 1;
    }
    void reset() {
      for (float& slice : slices) slice = 0.0f;
      filling = 0.0f;
      older = 0.0f;
      count = 0;
      index = 0;
    }
    void process(float magnitude) {
      if (magnitude > filling) filling = magnitude;
      if (++count < length) return;
      slices[index] = filling;
      index = index + 1 == kSlices ? 0 : index + 1;
      filling = 0.0f;
      count = 0;
      older = 0.0f;
      for (float slice : slices) older = kit::max(older, slice);
    }
    float level() const { return kit::max(filling, older); }
  };

  // One control tick of the ride: the target for the level the hold reads,
  // one pole towards it, and the ramp that takes the linear gain there.
  void step_ride() {
    using namespace ambient_limiter;
    const float over = kit::gain_to_db(hold_.level()) + kMarginDb - param(kCeiling);
    const float wanted = over > 0.0f ? -over * param(kRide) : 0.0f;
    // Down at once, up no faster than the fall, and the fall starts from the
    // gain when the gain never got as far as the target had.
    target_ = kit::min(wanted, kit::max(target_, ride_db_) + fall_step_);
    const float coeff = target_ < ride_db_ ? down_coeff_ : up_coeff_;
    ride_db_ = target_ + (ride_db_ - target_) * coeff;
    if (target_ == 0.0f && ride_db_ > -kHomeDb) ride_db_ = 0.0f;
    ride_gain_ = ride_next_;
    ride_next_ = kit::db_to_gain(ride_db_);
    ride_step_ = (ride_next_ - ride_gain_) * (1.0f / kControlPeriod);
  }

  // Nothing is sounding: clear what remembers the last sound, and let values
  // that were moving arrive.
  void rest() {
    hold_.reset();
    clock_.reset(kControlPeriod);
    target_ = 0.0f;
    ride_db_ = 0.0f;
    ride_gain_ = 1.0f;
    ride_next_ = 1.0f;
    ride_step_ = 0.0f;
    gain_.snap(gain_.target);
    wall_.reset();
    meter_ = 0.0f;
  }

  void apply(int id) {
    using namespace ambient_limiter;
    const float value = param(id);
    switch (id) {
      case kCeiling:
        wall_.setCeilingDb(value);  // snaps until its first sample, then ramps over 5 ms
        break;
      case kGain:
        gain_.set(kit::db_to_gain(value), primed() && !idle_.asleep());
        break;
      case kRelease:
        up_coeff_ = kit::time_to_coeff(value, sample_rate() / kControlPeriod);
        break;
      default:
        break;  // Ride is read on the control clock; the two poles smooth it
    }
  }

  TruePeakLimiter wall_;
  PeakHold hold_;
  kit::Smoother gain_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float down_coeff_ = 0.0f;
  float up_coeff_ = 0.0f;
  float fall_step_ = 0.0f;  // dB the target may rise in one control tick
  float target_ = 0.0f;     // where the ride is heading, in dB
  float ride_db_ = 0.0f;    // the ride's gain in dB, 0 or less
  float ride_gain_ = 1.0f;  // the same, linear, as applied to this sample
  float ride_next_ = 1.0f;  // where the ramp lands at the next tick
  float ride_step_ = 0.0f;
  float meter_ = 0.0f;
};

}  // namespace livemix
