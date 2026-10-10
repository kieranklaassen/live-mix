#pragma once

// Orbits: two to five sound-on-sound loops of unequal lengths that all hear
// the same playing. One note comes back at each loop's own period, so the
// copies slide against each other: a fraction of a percent apart it is the
// slow phasing of one figure against itself, far apart it is long loops that
// do not line up again for hours.
//
//                ┌─► loop 1 ─► play head ─► place 1 ─┐
//   in ─► listen ─┼─► loop 2 ─► play head ─► place 2 ─┼─► wet
//                └─► ...                              ┘
//
//   one loop:   x ─(+)─► limit ─► tape ─┬─► play head (Drift) ─► out
//                   ▲                  │
//                   └─ level hold ◄─ Feedback ◄─ Wear ◄─┘  tap, one period back
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
// - The level hold keeps a loop from building, at whatever level it is
//   played: a place on a loop may hold up to twice the power of the loudest
//   playing of the last seconds (3 dB over it, what Feedback 0.71 comes to
//   by itself), and where the kept pass and the new playing together would
//   come to more than that, the kept pass is turned down until they do
//   not. So new playing presses old layers down, there where it lands, and
//   is itself recorded as played. A loop that already holds more (it was
//   played louder a while ago) is not pulled down to that at once: new
//   playing takes out of it twice what it puts in, pass by pass. The powers
//   are averages over a tenth of a second and the gain is eased over 30 ms,
//   so it follows how loud the playing is and not its waveform. With
//   nothing played nothing is pressed and a pass is exact, from about a
//   second after the playing stops; for that second the gain is still on
//   its way back. After it the record head has a limiter that is exactly
//   linear up to full scale and never has gain, for peaks the averages
//   cannot see.
// - Drift moves each loop's play head (not its tap) a few milliseconds either
//   way, slowly and differently per loop: the copies shift against each other
//   and float in pitch (3 Hz on a 1 kHz tone at most), and nothing of it is
//   recorded, so it does not build up over passes.
// - Hold stops the loops listening and, once it is fully on (20 ms), makes
//   every pass a copy of the one before, sample for sample: no fading, no
//   wear, no level hold, no limiter. The loops keep turning against each
//   other for as long as they are left.
// - The loops are mono and each has its place across the stereo field:
//   Spread lays them out from the middle outward, alternating sides. Each
//   hears the middle of the input and half of its sides, the left of it for a
//   loop whose place is left and the right for one on the right (the loop in
//   the middle hears the middle alone), so a wide or out-of-phase input comes
//   back and a mono one is the same in every loop. Their sum is scaled by
//   1/sqrt(loops), so the first return of a note is about as loud as the
//   note whatever the count.
// - Length, Offset and Loops move the taps. A tap that has less than a
//   quarter of a second to go is wound there like tape (a 0.25 s lag, the
//   tape under it never slower or faster than half an octave, picking up
//   speed over 15 ms), which bends what that loop holds while it moves. One
//   that has further to go cuts over: the loop crossfades to its new length
//   in 40 ms, with no bend. A loop that is switched off fades out over 20 ms
//   and starts blank when it is switched on again.
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
    ease_ = 1.0f - kit::time_to_coeff(kEaseSeconds, sr);
    far_ = static_cast<double>(kFarSeconds) * sr;
    cut_step_ = 1.0f / (kCutSeconds * sr);
    balance_ = 1.0f - kit::time_to_coeff(kBalanceSeconds, sr);
    forget_ = kit::time_to_coeff(kPlayedSeconds, sr);
    for (int k = 0; k < kMaxLoops; ++k) {
      Loop& o = loops_[k];
      o.ring.clear();
      o.on.set_time(kSwitchSeconds, sr);
      o.left.set_time(kSmoothingSeconds, sr);
      o.right.set_time(kSmoothingSeconds, sr);
      o.lean.set_time(kSmoothingSeconds, sr);
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
  // 10 to 14: the highest level anywhere on that loop: the highest sample
  // its record head wrote in the turn before this one and in this one so
  // far. It says what a loop holds to someone who has not watched it turn.
  float meter(int index) const {
    if (index < 0 || index >= 3 * kMaxLoops) return 0.0f;
    const Loop& o = loops_[index % kMaxLoops];
    const bool turning = !rest_ && (o.on.value > 0.0f || o.on.target > 0.0f);
    if (index < kMaxLoops) return turning ? static_cast<float>(o.turn / o.length) : -1.0f;
    if (!turning) return 0.0f;
    if (index < 2 * kMaxLoops) return o.heard;
    return o.most > o.most_before ? o.most : o.most_before;
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
      const float listen = 1.0f - hold;
      const float middle = 0.5f * (in_left + in_right);
      const float sides = 0.5f * (in_left - in_right);

      float wet_left = 0.0f;
      float wet_right = 0.0f;
      for (Loop& o : loops_) {
        const float on = o.on.next();
        if (on == 0.0f && o.on.target == 0.0f) continue;
        const bool cutting = o.cut < 1.0f;
        if (cutting) {
          o.cut += cut_step_;
        } else if (o.length != o.target) {
          const double away = o.target - o.length;
          if (away > far_ || away < -far_) {
            // Too far to wind: the loop cuts over to its new length.
            o.from = o.length;
            o.length = o.target;
            o.speed = 0.0f;
            o.cut = 0.0f;
            if (o.turn >= o.length) o.turn = std::fmod(o.turn, o.length);
          } else {
            // The tap is moved by a motor: it picks up speed and it lands.
            const float asked =
                kit::clamp(static_cast<float>(away * glide_), -kSlewShorter, kSlewLonger);
            o.speed += (asked - o.speed) * motor_;
            o.length += o.speed;
            if (std::fabs(o.target - o.length) < 1.0e-3 && std::fabs(o.speed) < 1.0e-3f) {
              o.length = o.target;
              o.speed = 0.0f;
            }
          }
        }

        // The feedback tap, one period behind the record head.
        float old = o.ring.read(o.length);
        // The play head: on the tap, or wandering around it with Drift.
        const float wobble = o.wobble.next();
        float play = depth > 0.0f ? o.ring.read(o.length + depth * wobble) : old;
        if (o.cut < 1.0f) {
          // Cutting over: from the length it had to the one it has, both at tape speed.
          const float share = 0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * kit::clamp(o.cut, 0.0f, 1.0f));
          const float gone = o.ring.read(o.from);
          const float gone_play = depth > 0.0f ? o.ring.read(o.from + depth * wobble) : gone;
          old = gone + share * (old - gone);
          play = gone_play + share * (play - gone_play);
        }
        // What a pass costs: at Wear 0 the filter's pole is 0 and the
        // saturation's share is 0, and `back` is `old` to the bit.
        float back = o.dull.lowpass(old);
        back += wear * (kit::fast_tanh(back * kDrive) * (1.0f / kDrive) - back);
        if (hold > 0.0f) back = hold >= 1.0f ? old : back + hold * (old - back);
        // What this loop hears: the middle, and the sides from where it stands.
        const float fresh = listen * (middle + o.lean.next() * sides);
        const float kept = keep * back;

        // Level hold. Averages of the power of the new playing, of the kept
        // pass and of the two against each other say what the two together
        // come to; where that is more than the loop may hold here, the kept
        // pass is turned down by just enough.
        const float fresh_power = fresh * fresh;
        o.played = flush_denormal(o.played + (fresh_power - o.played) * balance_);
        o.stays = flush_denormal(o.stays + (kept * kept - o.stays) * balance_);
        o.both = flush_denormal(o.both + (fresh * kept - o.both) * balance_);
        // How loud the playing is at its loudest, kept through the gaps
        // between notes: the highest that average has been, let fall slowly.
        const float remembered = flush_denormal(o.loudest * forget_);
        o.loudest = o.played > remembered ? o.played : remembered;
        float share = 1.0f;
        if (o.stays > 0.0f && o.played > kNegligible * o.stays) {
          const float may = kit::max(kHoldOver * o.loudest, o.stays - kTakeOut * o.played);
          if (o.stays + 2.0f * o.both + o.played > may) {
            // stays p^2 + 2 both p + played = may, for the share p of the kept pass.
            const float root = o.both * o.both + o.stays * (may - o.played);
            share = kit::clamp((std::sqrt(root > 0.0f ? root : 0.0f) - o.both) / o.stays, 0.0f, 1.0f);
          }
        }
        // Eased, so the averages' ripple is not on the layer; and all of the
        // pass, to the bit, once nothing asks for less.
        o.press += (share - o.press) * ease_;
        if (share == 1.0f && o.press > kNearlyAll) o.press = 1.0f;
        // Hold fully on: a copy of the pass before and nothing else.
        const float written = hold >= 1.0f ? old : guard(limit(fresh + o.press * kept));
        const float size = written < 0.0f ? -written : written;

        o.ring.write(written);
        const float fallen = flush_denormal(o.heard * heard_decay_);
        o.heard = size > fallen ? size : fallen;
        if (size > o.most) o.most = size;
        if (size > kit::IdleGate::kFloor) {
          o.blank = 0;
        } else if (o.blank < kLongEnough) {
          ++o.blank;
        }
        o.turn += 1.0;
        if (o.turn >= o.length) {
          o.turn -= o.length;
          o.most_before = o.most;
          o.most = 0.0f;
        }

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
  // Fastest a tap is wound, in samples of tape per sample: the tape under it
  // runs at 1 less this, half an octave down while a loop grows longer and
  // half an octave up while it grows shorter.
  static constexpr float kSlewLonger = 0.2929f;
  static constexpr float kSlewShorter = 0.4142f;
  // A tap with further than this to go is not wound there: the loop cuts
  // over to its new length, with a crossfade this long.
  static constexpr float kFarSeconds = 0.25f;
  static constexpr float kCutSeconds = 0.04f;
  static constexpr float kDrive = 1.5f;
  // Level hold: a loop may hold this many times the power of the playing.
  static constexpr float kHoldOver = 2.0f;
  // Where it holds more, new playing takes out this much more than it puts
  // in (its own power again), until the loop is down to that.
  static constexpr float kTakeOut = 1.0f;
  // The averages it works on, and how long the playing's level is remembered.
  static constexpr float kBalanceSeconds = 0.1f;
  static constexpr float kPlayedSeconds = 4.0f;
  // Playing this far under what a loop holds (-40 dB) presses nothing down.
  static constexpr float kNegligible = 1.0e-4f;
  // How fast the share of the kept pass moves, and from where it is all of
  // it (a last step of a hundredth of a dB, so that a pass can be exact).
  static constexpr float kEaseSeconds = 0.03f;
  static constexpr float kNearlyAll = 0.999f;
  // The record limiter: exactly linear up to full scale, and never over this.
  static constexpr float kKnee = 1.0f;
  static constexpr float kTop = 1.5f;
  // How much of the input's sides a loop hears, from the side it stands on.
  static constexpr float kLean = 0.5f;
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
    double from = 96000.0;     // the distance it had before it cut over
    double turn = 0.0;         // the head's place in its turn, in samples
    float speed = 0.0f;        // how fast the tap is moving, in samples per sample
    float cut = 1.0f;          // how far a cut-over has got, 0 to 1
    long blank = 0;            // how long the record head has written nothing
    float heard = 0.0f;        // for meter() only: never read by the sound
    float most = 0.0f;         // for meter() only: the highest sample written this turn
    float most_before = 0.0f;  // and in the turn before
    // Level hold: mean squares of the new playing, of the kept pass, of the
    // two multiplied, and the playing's level as it is remembered.
    float played = 0.0f, stays = 0.0f, both = 0.0f, loudest = 0.0f;
    float press = 1.0f;        // the share of the kept pass that is written
    kit::OnePole dull;
    kit::Smoother on, left, right, lean;
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

  // The record limiter: what goes on the tape is what it is given up to full
  // scale, to the bit, and bends over to kTop above that.
  static float limit(float x) {
    const float size = x < 0.0f ? -x : x;
    if (size <= kKnee) return x;
    const float bent = kKnee + (kTop - kKnee) * kit::fast_tanh((size - kKnee) * (1.0f / (kTop - kKnee)));
    return x < 0.0f ? -bent : bent;
  }

  // The loop forgets everything but its place and its period.
  static void wipe(Loop& o) {
    o.ring.forget();
    o.dull.reset();
    o.length = o.target;
    o.from = o.target;
    o.speed = 0.0f;
    o.cut = 1.0f;
    o.turn = 0.0;
    o.blank = 0;
    o.heard = 0.0f;
    o.most = 0.0f;
    o.most_before = 0.0f;
    o.played = 0.0f;
    o.stays = 0.0f;
    o.both = 0.0f;
    o.loudest = 0.0f;
    o.press = 1.0f;
    o.left.snap(o.left.target);
    o.right.snap(o.right.target);
    o.lean.snap(o.lean.target);
  }

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
      double period = o.length > o.target ? o.length : o.target;
      if (o.cut < 1.0f && o.from > period) period = o.from;
      if (static_cast<double>(o.blank) <= period + reach) return false;
    }
    return true;
  }

  // Everything where it stands when sound comes to a device at rest: init,
  // and the first sample that is not zero after a rest.
  void restart() {
    for (int k = 0; k < kMaxLoops; ++k) {
      Loop& o = loops_[k];
      wipe(o);
      o.on.snap(o.on.target);
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
        // It hears the sides of the input from the side it stands on,
        // however far Spread has moved it there.
        const int stands = 2 * place(k, count) - (count - 1);
        o.lean.set_target(stands < 0 ? kLean : stands > 0 ? -kLean : 0.0f);
        // Switched on: a blank loop, at its period, in its place.
        if (o.on.value == 0.0f && o.on.target == 0.0f) wipe(o);
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
  double far_ = 12000.0;
  float motor_ = 0.0f;
  float cut_step_ = 0.0f;
  float balance_ = 0.0f;
  float forget_ = 0.0f;
  float heard_decay_ = 0.0f;
  float ease_ = 0.0f;
  float wear_seen_ = -1.0f;
  float mix_seen_ = -1.0f, dry_gain_ = 1.0f, wet_gain_ = 0.0f;
  bool moving_ = false;
  bool rest_ = true;
};

}  // namespace livemix
