#pragma once

// Orbits: two to five sound-on-sound loops of unequal lengths that all hear
// the same playing. One note comes back at each loop's own period, so the
// copies slide against each other: a fraction of a percent apart it is the
// slow phasing of one figure against itself, far apart it is long loops that
// do not line up again for hours.
//
//                    ┌─► loop 1 ─► play head ─► place 1 ─┐
//   in ─► mono ─► listen ─► loop 2 ─► play head ─► place 2 ─┼─► wet
//                    └─► ...                              ┘
//
//   one loop:   x ─(+)─► level hold ─► limit ─► tape ─┬─► play head (Drift) ─► out
//                   ▲                                │
//                   └──────── Feedback ◄─ Wear ◄─────┘  tap, one period back
//
// - Loop k (0 for the first) is `Length x (1 + Offset)^k` long, to the whole
//   sample. Its feedback tap sits exactly one period behind its record head,
//   so with Wear at 0 a pass is a bit-exact copy scaled by Feedback: at
//   Feedback 1 (or with Hold on) a loop keeps what it has for ever.
// - Feedback is what is kept per pass, so the first return is at the level
//   played and the m-th is Feedback^(m-1) of it.
// - Wear is in the feedback path only: a one-pole low-pass (16 kHz down to
//   2 kHz) and soft saturation, so the first return is clean and every later
//   pass has one more generation of it.
// - The level hold keeps a loop from building: a follower (1 ms up, 250 ms
//   down) watches what the record head is given, the new playing and the
//   kept pass together, and while that stands over -7 dBFS both are turned
//   down by the excess. Playing into a full loop presses the old layers down
//   instead of piling up; under the ceiling it does nothing and the copy
//   stays exact. After it the record head has a limiter that is exactly
//   linear below -6 dBFS and never has gain, for what the follower is too
//   slow to catch.
// - Drift moves each loop's play head (not its tap) a few milliseconds either
//   way, slowly and differently per loop: the copies shift against each other
//   and float in pitch (3 Hz on a 1 kHz tone at most), and nothing of it is
//   recorded, so it does not build up over passes.
// - Hold stops the loops listening and sets what they keep per pass to all of
//   it, unworn, over 20 ms. The loops keep turning against each other.
// - The loops are mono (the two inputs are summed) and each has its place
//   across the stereo field: Spread lays them out from the middle outward,
//   alternating sides. Their sum is scaled by 1/sqrt(loops), so the first
//   return of a note is about as loud as the note whatever the count.
// - Length, Offset and Loops move the taps: a tap glides to its new period
//   (a 0.25 s lag, at most three samples of tape per sample, picking up
//   speed over 15 ms), bending what that loop holds while it moves. A loop
//   that is switched off fades out over 20 ms and starts blank when it is
//   switched on again.
// - Storage: five rings of 1,440,000 samples (30 s at 48 kHz, 15 s at
//   96 kHz), 27.5 MB. Where Length and Offset ask the longest loop for more
//   than a ring holds, the ratio between neighbouring loops is brought down
//   until the longest fits: the loops stay evenly spaced and the first one
//   keeps Length. At 48 kHz that only happens with five loops, Length over
//   10 s and Offset over 25 %.
// - Rest. When every loop has been blank (under -140 dBFS) for a whole
//   period and the input sample is zero, the device is at rest: it puts out
//   exact zeros and nothing in it moves. The first input sample that is not
//   zero starts it again from the same state every time (blank loops, the
//   drifts at their starting phases, every knob where it is set), so what
//   comes out does not depend on the host's block size. A loop that holds
//   sound keeps the device awake.

#include "../../kit/kit.h"
#include "params.gen.h"
#include "ring.h"

namespace livemix {

class Orbits : public kit::DeviceBase<orbits::kNumParams> {
 public:
  static constexpr int kMaxLoops = 5;
  // 30 s at 48 kHz, 15 s at 96 kHz.
  static constexpr int kRingFrames = 1440000;

  void init(float sample_rate) {
    using namespace orbits;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    feedback_.set_time(kSmoothingSeconds, sr);
    wear_.set_time(kSmoothingSeconds, sr);
    drift_.set_time(kDriftLagSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    hold_.set_time(kSwitchSeconds, sr);
    glide_ = 1.0 - std::exp(-1.0 / (static_cast<double>(kLengthLagSeconds) * sr));
    motor_ = 1.0f - kit::time_to_coeff(kMotorLagSeconds, sr);
    heard_decay_ = kit::time_to_coeff(kHeardSeconds, sr);
    for (int k = 0; k < kMaxLoops; ++k) {
      Loop& o = loops_[k];
      o.ring.clear();
      o.on.set_time(kSwitchSeconds, sr);
      o.left.set_time(kSmoothingSeconds, sr);
      o.right.set_time(kSmoothingSeconds, sr);
      o.level.set(kHoldAttackSeconds, kHoldReleaseSeconds, sr);
      o.drift.set_rate(kDriftHz[k], sr);
      o.on.snap(0.0f);
    }
    for (int id = 0; id < kNumParams; ++id) apply(id);
    rest_ = true;
    restart();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for a display to draw.
  // 0 to 4: where each loop's head is in its turn, 0 to 1; -1 for a loop that
  // is off, and for all of them while the device is at rest.
  // 5 to 9: the level that loop's record head has just written (its highest
  // sample, let fall over 30 ms), which is the new playing and what was kept
  // of the pass before; 0 for a loop that is off and at rest.
  float meter(int index) const {
    if (index < 0 || index >= 2 * kMaxLoops) return 0.0f;
    const Loop& o = loops_[index % kMaxLoops];
    const bool turning = !rest_ && (o.on.value > 0.0f || o.on.target > 0.0f);
    if (index < kMaxLoops) return turning ? static_cast<float>(o.turn / o.length) : -1.0f;
    return turning ? o.heard : 0.0f;
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (rest_ && !input_present(frames)) {
      silence_output(frames);
      return;
    }
    const float depth_scale = kDriftSeconds * sample_rate();
    for (int i = 0; i < frames; ++i) {
      float in_left, in_right;
      take_input(i, &in_left, &in_right);
      in_left = safe(in_left);
      in_right = safe(in_right);
      const bool sound = in_left != 0.0f || in_right != 0.0f;
      if (rest_) {
        if (!sound) {
          out_left_[i] = 0.0f;
          out_right_[i] = 0.0f;
          continue;
        }
        // Started again on this very sample, whatever the block it is in.
        restart();
        rest_ = false;
      }
      if (clock_.tick()) control();

      const float feedback = feedback_.next();
      const float wear = wear_.next();
      const float hold = hold_.next();
      const float depth = drift_.next() * depth_scale;
      // Hold: nothing new goes in, and all of a pass is kept.
      const float keep = feedback + hold * (1.0f - feedback);
      const float heard = (1.0f - hold) * 0.5f * (in_left + in_right);

      float wet_left = 0.0f;
      float wet_right = 0.0f;
      for (Loop& o : loops_) {
        const float on = o.on.next();
        if (on == 0.0f && o.on.target == 0.0f) continue;
        if (o.length != o.target) {
          // The tap is moved by a motor: it picks up speed and it lands.
          const float asked =
              kit::clamp(static_cast<float>((o.target - o.length) * glide_), -kMaxSlew, kMaxSlew);
          o.speed += (asked - o.speed) * motor_;
          o.length += o.speed;
          if (std::fabs(o.target - o.length) < 1.0e-3 && std::fabs(o.speed) < 1.0e-3f) {
            o.length = o.target;
            o.speed = 0.0f;
          }
        }

        // The feedback tap, one period behind the record head.
        const float old = o.ring.read(o.length);
        // What a pass costs: at Wear 0 the filter's pole is 0 and the
        // saturation's share is 0, and `back` is `old` to the bit.
        float back = o.dull.lowpass(old);
        back += wear * (kit::fast_tanh(back * kDrive) * (1.0f / kDrive) - back);
        if (hold > 0.0f) back = hold >= 1.0f ? old : back + hold * (old - back);
        // Level hold: what the record head is given, new and old together,
        // is turned down by as much as it stands over the ceiling.
        const float sum = heard + keep * back;
        const float level = o.level.process(sum);
        const float room = level > kCeiling ? kCeiling / level : 1.0f;
        const float written = guard(kit::soft_clip(room * sum));
        const float size = written < 0.0f ? -written : written;

        // The play head: on the tap, or wandering around it with Drift.
        const float wobble = o.wobble.next();
        const float play = depth > 0.0f ? o.ring.read(o.length + depth * wobble) : old;

        o.ring.write(written);
        const float fallen = o.heard * heard_decay_;
        o.heard = size > fallen ? size : fallen;
        if (size > kit::IdleGate::kFloor) {
          o.blank = 0;
        } else if (o.blank < kLongEnough) {
          ++o.blank;
        }
        o.turn += 1.0;
        if (o.turn >= o.length) o.turn -= o.length;

        wet_left += play * on * o.left.next();
        wet_right += play * on * o.right.next();
      }

      const float mix = mix_.next();
      if (mix != mix_seen_) {
        mix_seen_ = mix;
        dry_gain_ = kit::SineTable::cos_lookup(0.25f * mix);
        wet_gain_ = kit::SineTable::lookup(0.25f * mix);
      }
      out_left_[i] = in_left * dry_gain_ + wet_left * wet_gain_;
      out_right_[i] = in_right * dry_gain_ + wet_right * wet_gain_;

      if (!sound && blank()) rest_ = true;
    }
  }

  // The period of loop `k` of `loops`, in samples, for a Length in seconds
  // and an Offset in percent: Length x (1 + Offset)^k, with the ratio brought
  // down where the longest loop would not fit its ring. (Also what a display
  // and the harness work out.)
  static double period(int k, int loops, double length_seconds, double offset_percent,
                       double sample_rate) {
    const double first = length_seconds * sample_rate;
    double ratio = 1.0 + offset_percent * 0.01;
    if (loops > 1) {
      const double most = longest(sample_rate) / first;
      const double fits = std::pow(most > 1.0 ? most : 1.0, 1.0 / (loops - 1));
      if (ratio > fits) ratio = fits;
    }
    double frames = std::floor(first * std::pow(ratio, k) + 0.5);
    if (frames > longest(sample_rate)) frames = longest(sample_rate);
    return frames < 8.0 ? 8.0 : frames;
  }

  // The longest period a ring holds: its frames less the play head's reach.
  static double longest(double sample_rate) {
    return std::floor(kRingFrames - kDriftSeconds * sample_rate - 8.0);
  }

 private:
  static constexpr long kLongEnough = 1L << 30;
  static constexpr int kControlPeriod = 16;
  static constexpr float kSwitchSeconds = 0.02f;
  static constexpr float kLengthLagSeconds = 0.25f;
  static constexpr float kMotorLagSeconds = 0.015f;
  // A play head is moved to a new distance, not put there: Drift's depth
  // takes this long, so turning it bends the pitch by cents and no more.
  static constexpr float kDriftLagSeconds = 0.5f;
  // Fastest a tap moves, in samples of tape per sample.
  static constexpr float kMaxSlew = 3.0f;
  static constexpr float kDrive = 1.5f;
  // Level hold: -7 dBFS, a little under the record limiter's knee, so that a
  // loop it has levelled is left alone by the limiter.
  static constexpr float kCeiling = 0.45f;
  static constexpr float kHoldAttackSeconds = 0.001f;
  static constexpr float kHoldReleaseSeconds = 0.25f;
  // Drift at full: the play head wanders 12 ms either way, about 7 cents at
  // its fastest. A rate per loop, none a simple multiple of another.
  static constexpr float kDriftSeconds = 0.012f;
  static constexpr float kDriftHz[kMaxLoops] = {0.050f, 0.043f, 0.061f, 0.037f, 0.071f};
  static constexpr uint32_t kDriftSeed[kMaxLoops] = {0x51ED270Bu, 0x9E3779B9u, 0x7F4A7C15u,
                                                    0x2C1B3C6Du, 0xA341316Cu};
  static constexpr float kInputBound = 4.0f;  // +12 dBFS
  // For a display (see meter): how fast a loop's written level falls back.
  static constexpr float kHeardSeconds = 0.03f;

  // A slow modulator worked out on the control clock and joined by lines.
  struct Line {
    float value = 0.0f;
    float step = 0.0f;
    void aim(float target, bool jump) {
      if (jump) value = target;
      step = (target - value) * (1.0f / kControlPeriod);
    }
    float next() {
      const float now = value;
      value += step;
      return now;
    }
  };

  struct Loop {
    orbits::Ring<kRingFrames> ring;
    double length = 96000.0;   // the tap's distance, gliding, in samples
    double target = 96000.0;   // where it is going: a whole number
    double turn = 0.0;         // the head's place in its turn, in samples
    float speed = 0.0f;        // how fast the tap is moving, in samples per sample
    long blank = 0;            // how long the record head has written nothing
    float heard = 0.0f;        // for meter() only: never read by the sound
    kit::OnePole dull;
    kit::Follower level;
    kit::Smoother on, left, right;
    kit::Drift drift;
    Line wobble;
  };

  // A sample that is not a number, or is far over full scale, must not sit
  // in a loop for minutes.
  static float safe(float x) {
    if (x > -kInputBound) return x < kInputBound ? x : kInputBound;
    return x <= -kInputBound ? -kInputBound : 0.0f;
  }
  static float guard(float x) { return (x > -2.0f && x < 2.0f) ? flush_denormal(x) : 0.0f; }

  // Which place loop `k` of `loops` takes across the field, 0 at the far left
  // and loops - 1 at the far right: from the middle outward, a side in turn.
  static int place(int k, int loops) {
    if (loops % 2 == 1) {
      const int middle = (loops - 1) / 2;
      if (k == 0) return middle;
      return k % 2 == 1 ? middle - (k + 1) / 2 : middle + k / 2;
    }
    return k % 2 == 0 ? loops / 2 - 1 - k / 2 : loops / 2 + (k - 1) / 2;
  }

  // A loop that is all the way to one side is not on the other at all.
  static float side(float gain) { return gain < 1.0e-6f ? 0.0f : gain; }

  int loops() const {
    return kit::clamp_int(static_cast<int>(param(orbits::kLoops) + 0.5f), 2, kMaxLoops);
  }

  // Every loop that turns has written nothing for longer than anything can
  // still read: its period, the play head's reach and a glide's way.
  bool blank() const {
    const double reach = kDriftSeconds * sample_rate() + 16.0;
    for (const Loop& o : loops_) {
      if (o.on.value == 0.0f && o.on.target == 0.0f) continue;
      const double period = o.length > o.target ? o.length : o.target;
      if (static_cast<double>(o.blank) <= period + reach) return false;
    }
    return true;
  }

  // Everything where it stands when sound comes to a device at rest: init,
  // and the first sample that is not zero after a rest.
  void restart() {
    for (int k = 0; k < kMaxLoops; ++k) {
      Loop& o = loops_[k];
      o.ring.forget();
      o.dull.reset();
      o.level.reset();
      o.length = o.target;
      o.speed = 0.0f;
      o.turn = 0.0;
      o.blank = 0;
      o.heard = 0.0f;
      o.on.snap(o.on.target);
      o.left.snap(o.left.target);
      o.right.snap(o.right.target);
      o.drift.seed(kDriftSeed[k]);
    }
    feedback_.snap(feedback_.target);
    wear_.snap(wear_.target);
    drift_.snap(drift_.target);
    hold_.snap(hold_.target);
    mix_.snap(mix_.target);
    clock_.reset(kControlPeriod);
    moving_ = false;
    wear_seen_ = -1.0f;
    mix_seen_ = -1.0f;
  }

  void control() {
    if (wear_.value != wear_seen_) {
      wear_seen_ = wear_.value;
      // Wear 0 is no filter at all, so that a pass can be an exact copy.
      const float pole = wear_seen_ > 0.0f
                             ? std::exp(-kit::kTwoPi * kit::min(16000.0f * std::pow(0.125f, wear_seen_),
                                                                 sample_rate() * 0.49f) /
                                        sample_rate())
                             : 0.0f;
      for (Loop& o : loops_) o.dull.a = pole;
    }
    // Where each drift will be one control period from now.
    for (Loop& o : loops_) o.wobble.aim(o.drift.next(kControlPeriod), !moving_);
    moving_ = true;
  }

  // The periods, which loops turn and where each stands across the field.
  void lay_out() {
    using namespace orbits;
    const int count = loops();
    const float spread = param(kSpread);
    const float share = 1.0f / std::sqrt(static_cast<float>(count));
    for (int k = 0; k < kMaxLoops; ++k) {
      Loop& o = loops_[k];
      const bool wanted = k < count;
      if (wanted) {
        o.target = period(k, count, param(kLength), param(kOffset), sample_rate());
        const float across =
            spread * (2.0f * static_cast<float>(place(k, count)) / static_cast<float>(count - 1) - 1.0f);
        // Equal power across the field, and unity in the middle.
        const float angle = (across + 1.0f) * (kit::kHalfPi * 0.5f);
        o.left.set_target(side(share * 1.41421356f * std::cos(angle)));
        o.right.set_target(side(share * 1.41421356f * std::sin(angle)));
        if (o.on.value == 0.0f && o.on.target == 0.0f) {
          // Switched on: a blank loop, at its period, in its place.
          o.ring.forget();
          o.dull.reset();
          o.level.reset();
          o.length = o.target;
          o.speed = 0.0f;
          o.turn = 0.0;
          o.blank = 0;
          o.heard = 0.0f;
          o.left.snap(o.left.target);
          o.right.snap(o.right.target);
        }
      }
      o.on.set_target(wanted ? 1.0f : 0.0f);
    }
  }

  void apply(int id) {
    using namespace orbits;
    const float value = param(id);
    switch (id) {
      case kLoops:
      case kLength:
      case kOffset:
      case kSpread:
        lay_out();
        break;
      case kFeedback:
        feedback_.set_target(value);
        break;
      case kWear:
        wear_.set_target(value);
        break;
      case kDrift:
        drift_.set_target(value);
        break;
      case kHold:
        hold_.set_target(value < 0.5f ? 0.0f : 1.0f);
        break;
      case kMix:
        mix_.set_target(value);
        break;
      default:
        break;
    }
  }

  Loop loops_[kMaxLoops];
  kit::Smoother feedback_, wear_, drift_, hold_, mix_;
  kit::ControlClock clock_;
  double glide_ = 0.0;
  float motor_ = 0.0f;
  float heard_decay_ = 0.0f;
  float wear_seen_ = -1.0f;
  float mix_seen_ = -1.0f, dry_gain_ = 1.0f, wet_gain_ = 0.0f;
  bool moving_ = false;
  bool rest_ = true;
};

}  // namespace livemix
