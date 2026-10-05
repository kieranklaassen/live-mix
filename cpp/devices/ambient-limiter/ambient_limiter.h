#pragma once

// Ambient Limiter: a true-peak ceiling for the master with a slow stage in
// front of it, so a sustained over is ridden down and the brickwall is left
// with the moments.
//
//   in × gain ──┬──────────────────────────► × ride ──► brickwall ──► out
//               │                               ▲       (77 samples)
//               └──► peak hold ──► target ──► slow gain
//                        └──────► auto gain ──────┘
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
// - Auto gain (off at 0, where the device is what it was before it had one,
//   sample for sample) turns a quiet mix up the way a level is set once for a
//   whole piece: by its loudest sustained part. It is one more gain in dB
//   under the ride, between 0 and the setting, and it works to the line the
//   ride works to, Ceiling − 0.5 dB, read on the level before Gain. So with
//   it on, Gain is how far the levelled mix is pushed into the ceiling.
// - It starts at the setting and gives way to what stands over the line: the
//   ride holds an over down at once, and is given back each dB as the auto
//   gain gives it up, so the output does not dip while a loud passage moves
//   from the one to the other.
// - For the first 3 s of sound (after init, and after the setting is turned)
//   it is finding the level, and gives way with a 50 ms time constant: the
//   first note sets it, with the brickwall on that note's first moment and
//   no fade up. From then on it gives way with a 3 s time constant, so a
//   moment is over before much of it has moved (3 ms take 1.4 % of their
//   over, and the ride lets the rest back), and it rises 1.2 dB a minute: a
//   quieter passage stays quieter, a tail dies away as it would, and a level
//   given up to one loud passage comes back over minutes, which nobody hears
//   as a pump.
// - Once found it does not rise on what is under −45 dBFS: silence, the end
//   of a tail and a microphone's hiss are not the piece.
// - It is kept through a sleep, so the silence between two plays of a piece
//   does not make it listen again. meter(2) is where it stands, in dB.

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
    absorb_ = 1.0f - kit::time_to_coeff(kAbsorbSeconds, sr / kControlPeriod);
    find_absorb_ = 1.0f - kit::time_to_coeff(kFindAbsorbSeconds, sr / kControlPeriod);
    keep_step_ = kKeepDbPerSecond * kControlPeriod / sr;
    trim_step_ = kTrimDbPerSecond * kControlPeriod / sr;
    find_ticks_ = static_cast<int>(kFindSeconds * sr / kControlPeriod);
    finding_ = find_ticks_;
    auto_db_ = 0.0f;
    owed_db_ = 0.0f;
    // The delay has to pass before the gate can call the output silent.
    idle_.reset(sr, kIdleHoldSeconds);
    rest();
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    const bool is_auto = id == ambient_limiter::kAutoGain;
    const float before = is_auto ? param(id) : 0.0f;
    if (!store_param(id, value)) return;
    apply(id);
    // Auto gain turned: it finds the level again. The same value sent twice is not a turn.
    if (is_auto && param(id) != before) {
      finding_ = find_ticks_;
      owed_db_ = kit::max(0.0f, param(id) - auto_db_);
      if (!primed() || idle_.asleep()) settle_gain();
    }
  }

  // The readings named by meters[index] in device.json; 0 for an unknown one.
  // 0 is the total reduction, 1 the ride's own share of it, for a display that
  // draws the slow stage and the brickwall apart, 2 the auto gain (0 or more).
  float meter(int index) const {
    return index == 0 ? meter_ : index == 1 ? ride_db_ : index == 2 ? auto_db_ : 0.0f;
  }

  // The ride's own share of the reduction in dB (0 or less), for the harness.
  float ride_db() const { return ride_db_; }
  // The auto gain in dB (0 or more), and whether it has found the level.
  float auto_db() const { return auto_db_; }
  bool found() const { return finding_ == 0; }

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
  // The auto gain: how much sound it takes to find the level and how fast it
  // gives way to an over meanwhile, how fast it gives way and rises once it
  // has, how fast it follows the setting when that is turned, and the level
  // under which nothing is the piece.
  static constexpr float kFindSeconds = 3.0f;
  static constexpr float kFindAbsorbSeconds = 0.05f;
  static constexpr float kAbsorbSeconds = 3.0f;
  static constexpr float kKeepDbPerSecond = 0.02f;
  static constexpr float kTrimDbPerSecond = 40.0f;
  static constexpr float kAutoFloorDb = -45.0f;

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

  // One control tick of the auto gain, for the held level before Gain in dB.
  void step_auto(float level) {
    using namespace ambient_limiter;
    const float most = param(kAutoGain);
    if (auto_db_ > most) {
      auto_db_ = kit::max(most, auto_db_ - trim_step_);
      return;
    }
    if (most <= 0.0f) return;
    const bool finding = finding_ > 0;
    // How far the sound stands under the line with the gain as it is.
    const float room = param(kCeiling) - kMarginDb - level - auto_db_;
    if (room < 0.0f) {
      const float given = kit::min(auto_db_, -room * (finding ? find_absorb_ : absorb_));
      auto_db_ -= given;
      // The ride was holding these dB down, and hands them over.
      const float back = given * param(kRide);
      target_ = kit::min(0.0f, target_ + back);
      ride_db_ = kit::min(0.0f, ride_db_ + back);
    } else if (owed_db_ > 0.0f) {
      // The setting was turned up while something sounds: up to it, or to the line.
      const float rise = kit::min(trim_step_, kit::min(owed_db_, kit::min(room, most - auto_db_)));
      auto_db_ += rise;
      owed_db_ = rise < trim_step_ ? 0.0f : owed_db_ - rise;
    } else if (!finding && level > kAutoFloorDb) {
      auto_db_ += kit::min(keep_step_, kit::min(room, most - auto_db_));
    }
    if (finding && level > kAutoFloorDb) --finding_;
  }

  // One control tick of the ride: the target for the level the hold reads,
  // one pole towards it, and the ramp that takes the linear gain there.
  void step_ride() {
    using namespace ambient_limiter;
    const float level = kit::gain_to_db(hold_.level());
    step_auto(level - param(kGain));
    const float over = level + auto_db_ + kMarginDb - param(kCeiling);
    const float wanted = over > 0.0f ? -over * param(kRide) : 0.0f;
    // Down at once, up no faster than the fall, and the fall starts from the
    // gain when the gain never got as far as the target had.
    target_ = kit::min(wanted, kit::max(target_, ride_db_) + fall_step_);
    const float coeff = target_ < ride_db_ ? down_coeff_ : up_coeff_;
    ride_db_ = target_ + (ride_db_ - target_) * coeff;
    if (target_ == 0.0f && ride_db_ > -kHomeDb) ride_db_ = 0.0f;
    ride_gain_ = ride_next_;
    ride_next_ = kit::db_to_gain(ride_db_ + auto_db_);
    ride_step_ = (ride_next_ - ride_gain_) * (1.0f / kControlPeriod);
  }

  // The gain the next sound starts on, with no ramp: the auto gain as it
  // stands, or the setting while it has heard nothing to find a level by.
  void settle_gain() {
    const float most = param(ambient_limiter::kAutoGain);
    auto_db_ = finding_ == find_ticks_ ? most : kit::min(auto_db_, most);
    owed_db_ = 0.0f;
    ride_gain_ = kit::db_to_gain(auto_db_);
    ride_next_ = ride_gain_;
    ride_step_ = 0.0f;
  }

  // Nothing is sounding: clear what remembers the last sound, and let values
  // that were moving arrive. The auto gain is not of the last sound but of
  // the piece, and stays.
  void rest() {
    hold_.reset();
    clock_.reset(kControlPeriod);
    target_ = 0.0f;
    ride_db_ = 0.0f;
    settle_gain();
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
      case kAutoGain:
        // Sounding, it follows the setting on the control clock.
        if (!primed() || idle_.asleep()) settle_gain();
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
  float ride_gain_ = 1.0f;  // ride and auto gain, linear, as applied to this sample
  float ride_next_ = 1.0f;  // where the ramp lands at the next tick
  float ride_step_ = 0.0f;
  float absorb_ = 0.0f;       // the share of an over the auto gain gives up in one tick
  float find_absorb_ = 0.0f;  // the same while it finds the level
  float keep_step_ = 0.0f;    // dB it may rise in one tick once it has
  float trim_step_ = 0.0f;    // dB it moves in one tick towards a setting that was turned
  float auto_db_ = 0.0f;      // the auto gain in dB, 0 or more
  float owed_db_ = 0.0f;      // dB it has yet to rise after the setting was turned up
  int find_ticks_ = 0;        // control ticks of sound it takes to find the level
  int finding_ = 0;           // how many of them it has yet to hear; 0 once found
  float meter_ = 0.0f;
};

}  // namespace livemix
