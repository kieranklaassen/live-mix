#pragma once

// What the beat and breath devices share: a slow clock, the pair of tones a
// few hertz apart, the law that splits a pair between the ears, a glide of a
// rate over minutes and the shape of an even pulse. Not part of kit.h: a
// device that needs them includes this beside the kit.
//
//   #include "../../kit/kit.h"
//   #include "../../kit/beat.h"
//
// Everything that keeps time here is a double counted in samples. The kit's
// own oscillators and smoothers are float: two float phases a few hertz apart
// drift by about a beat an hour, and a float smoother cannot make a glide of
// minutes at all.
//
// A pair of tones, one to an ear (docs/recipes/beat-and-breath-family.md has
// the whole of it):
//
//   kit::SlowClock half_beat_;               // one for the device: half of Beat
//   kit::RateGlide glide_;                   // Beat on its way to Target
//   double carrier_[kVoices];                // one phase a voice, in cycles
//
//   // init:        kit::SineTable::init(); half_beat_.reset(); glide_.reset(sr);
//   // a control:   glide_.set(beat, target, glide_seconds, pool_.count_active() > 0);
//   // note on:     if (pool_.count_active() == 0) half_beat_.reset();
//   //              glide_.key();
//   // asleep:      glide_.advance(frames);
//   // each sample:
//   const kit::SinCos beat = kit::sin_cos(half_beat_.phase);
//   half_beat_.step(kit::SlowClock::increment(0.5 * glide_.step(), sr));
//   const kit::EarGains ears = kit::ear_gains(ears_.next());
//   for each voice:
//     const kit::SinCos turn = kit::sin_cos(carrier_[v]);
//     carrier_[v] = kit::wrap_phase(carrier_[v] + hz / sr);
//     const kit::TonePair pair = kit::tone_pair(turn, beat);
//     hi += level * pair.hi;
//     lo += level * pair.lo;
//   kit::to_ears(ears, hi, lo, &left, &right);     // the left ear is the higher
//
// An even pulse, the right ear Offset behind the left:
//
//   kit::SlowClock pulse_;  kit::PulseGate gate_[2];
//   const kit::PulseShape shape = kit::pulse_shape(rate, duty, edge_seconds);
//   const double step = kit::SlowClock::increment(rate, sr);
//   const float open_l = gate_[0].next(pulse_.phase, shape, step);
//   const float open_r = gate_[1].next(kit::wrap_phase(pulse_.phase - offset_turns), shape, step);
//   pulse_.step(step);
//   out_l = in_l * kit::pulse_gain(open_l, kit::pulse_floor(depth));
//
// Asleep, an effect runs those same lines for every frame of the block and
// leaves the sound out: its clocks never stop and nothing restarts on waking.

#include <cmath>
#include <cstdint>

#include "math.h"

namespace livemix {
namespace kit {

// --- the slow clock ----------------------------------------------------------------------------

// A phase in cycles brought into [0, 1). Never 1 itself (a phase a hair under
// zero rounds up to it) and never anything that is not a number.
inline double wrap_phase(double phase) {
  phase -= std::floor(phase);
  return (phase >= 0.0 && phase < 1.0) ? phase : 0.0;
}

// A phase in cycles, in [0, 1), moved on a sample at a time by hz over the
// sample rate. Each step's rounding is kept and given back at the next (a
// compensated sum), so an hour of steps at 2 Hz ends within 1e-12 of a cycle
// of where it should; the bare double sum rounds the same way at every step
// and is 4e-9 out by then, and a float phase is half a cycle out
// (cpp/test/beat_test.cpp steps the hour). The device owns when it restarts:
// an instrument resets it at the sample where a key arrives with no voice
// sounding, an effect never does.
struct SlowClock {
  double phase = 0.0;
  double carry = 0.0;  // what the last step's sum rounded away

  // Cycles a sample for a rate in hertz. Nonsense gives 0: the clock stands.
  static double increment(double hz, double sample_rate) {
    const double step = hz / sample_rate;
    return (step > -1.0e6 && step < 1.0e6) ? step : 0.0;
  }

  void reset(double start = 0.0) {
    phase = wrap_phase(start);
    carry = 0.0;
  }

  // On by one sample. Read `phase` first: it is this sample's.
  void step(double increment) {
    const double add = increment - carry;
    const double sum = phase + add;
    carry = (sum - phase) - add;
    phase = wrap_phase(sum);
    if (!(carry > -1.0 && carry < 1.0)) carry = 0.0;
  }

  // On by `samples` samples at one rate, in one sum: the phase that many
  // single steps give, to 1e-12 of a cycle (the product rounds once, by a
  // part in 1e16 of the cycles it spans). For a clock that runs on while the
  // device is asleep, at a rate that is not moving. Where the rate moves (a
  // glide), step it in a loop instead.
  void advance(double increment, int64_t samples) {
    if (samples <= 0) return;
    phase = wrap_phase(phase + (increment * static_cast<double>(samples) - carry));
    carry = 0.0;
  }
};

// --- the tone pair -----------------------------------------------------------------------------

// The sine and the cosine of one phase.
struct SinCos {
  float s;
  float c;
};

// The sine to use for a pair: the kit's table, read at a double phase in
// [0, 1). Call kit::SineTable::init() in the device's init first. The beat's
// rate is carried by the phases, which are double; the sine of a phase only
// has to be clean, and the table is, to 7e-7 (-123 dB). Take the phase from a
// SlowClock or through wrap_phase: the table reads one past its end for a
// phase a hair under zero, and a wrapped double never is.
inline SinCos sin_cos(double phase) {
  const float p = static_cast<float>(phase);
  return {SineTable::lookup(p), SineTable::cos_lookup(p)};
}

// Two tones Beat hertz apart, centred on the carrier:
//
//   hi = sin(2π(c + h))      lo = sin(2π(c - h))
//
// `c` is a voice's carrier phase and `h` the device's half-beat phase, which
// turns at half of Beat, so hi is Beat hertz above lo on every key and all
// the pairs turn together. Summed they are the carrier beating to nothing at
// Beat; h = 0 is the beat's crest. Give it the sine and cosine of each
// (sin_cos), the half-beat's worked out once a sample for the whole device:
// the pair is then four multiplies a voice, by the angle sums.
struct TonePair {
  float hi;
  float lo;
};

inline TonePair tone_pair(SinCos carrier, SinCos half_beat) {
  const float together = carrier.s * half_beat.c;
  const float apart = carrier.c * half_beat.s;
  return {together + apart, together - apart};
}

// The carrier's second and third partials from its sine and cosine, with no
// further sine: tone_pair(second_partial(turn), beat) is the pair an octave
// up, still Beat hertz apart.
inline SinCos second_partial(SinCos turn) {
  return {2.0f * turn.s * turn.c, turn.c * turn.c - turn.s * turn.s};
}
inline SinCos third_partial(SinCos turn) {
  return {turn.s * (3.0f - 4.0f * turn.s * turn.s), turn.c * (4.0f * turn.c * turn.c - 3.0f)};
}

// --- the Ears law ------------------------------------------------------------------------------

// How a pair is split between the ears. With Ears e in 0..1:
//
//   same = (1 + e) / 2      other = (1 - e) / 2
//   left  = same·hi + other·lo
//   right = other·hi + same·lo
//
// The left ear carries the higher tone, on every device. At 0 the two gains
// are exactly a half and the two sides are the same to the sample; at 1 each
// ear has one tone alone. The mid is (hi + lo) / 2 at every setting, so the
// mono sum is a full beat whatever Ears says and its level never moves with
// the knob; side over mid is 20·log10(e) dB (-6.0 at 0.5, -1.9 at 0.8).
// Width on two unlike noises is the same law. Ears outside 0..1 is held to
// it; smooth e in the device and ask for the gains each sample.
struct EarGains {
  float same;
  float other;
};

inline EarGains ear_gains(float ears) {
  const float e = ears > 0.0f ? (ears < 1.0f ? ears : 1.0f) : 0.0f;
  return {0.5f + 0.5f * e, 0.5f - 0.5f * e};
}

inline void to_ears(EarGains gains, float hi, float lo, float* left, float* right) {
  *left = gains.same * hi + gains.other * lo;
  *right = gains.other * hi + gains.same * lo;
}

// --- the rate glide ----------------------------------------------------------------------------

// A rate on its way from Beat to Target over minutes, by ratio and in closed
// form:
//
//   rate(t) = Beat · (Target / Beat)^min(t / T, 1)       t in samples since it started
//
// so it is half way in pitch at half time, lands on Target exactly and has no
// sum that could drift. It has three states:
//
//   armed    by reset() and by any change of Beat, Target or the time. The
//            rate is Beat and nothing counts.
//   gliding  from the sample it starts: at once if a voice was open when it
//            was armed, otherwise at the first key. It counts on through
//            releases, new keys and idle blocks.
//   holding  at Target, once its time is up, until something arms it again.
//
// A time of 0 is off: it stays armed and the rate is Beat. Moving a control
// is the only way to run it again; a fresh device starts at Beat.
//
// The device tells it three things: set() whenever Beat, Target or the time
// may have changed (with whether a voice is open at that moment; the same
// values sent again change nothing), key() at every note on, and one of
// step() or advance() for every sample, awake or asleep. step() returns the
// rate for the sample it leaves. The rate is worked out afresh on multiples
// of 32 of the glide's own count, never on a block's edge, so advance(n) is
// n single steps to the bit and the output cannot depend on the block size.
// Integrate the rate in a double: clock.step(kit::SlowClock::increment(rate,
// sr)). Holding each value for 32 samples puts the phase 16 samples' worth of
// the whole change out by the end, two thousandths of a cycle for 10 Hz to
// 4 Hz, however long the glide.
//
// Anything else that follows the same law can use it: a cycle that lengthens
// by a ratio is a glide from 1 to that ratio.
class RateGlide {
 public:
  enum State { kArmed = 0, kGliding = 1, kHolding = 2 };

  // Armed, at the defaults (a rate of 1 and no glide) until set() says
  // otherwise. Call from the device's init, before set().
  void reset(double sample_rate) {
    sample_rate_ = (sample_rate > 1.0 && sample_rate < 1.0e7) ? sample_rate : 48000.0;
    base_ = 1.0;
    target_ = 1.0;
    seconds_ = 0.0;
    arm(false);
  }

  // Beat and Target in hertz (or any unit, both held above kLeast), the time
  // in seconds (held to 0..kMostSeconds). A change of any of them arms the
  // glide; with `voice_open` it starts at this sample.
  void set(double base, double target, double seconds, bool voice_open) {
    const double b = positive(base);
    const double t = positive(target);
    const double s = seconds > 0.0 ? (seconds < kMostSeconds ? seconds : kMostSeconds) : 0.0;
    if (b == base_ && t == target_ && s == seconds_) return;
    base_ = b;
    target_ = t;
    seconds_ = s;
    arm(voice_open);
  }

  // A key arrived: an armed glide starts at this sample. One that is gliding
  // or holding carries on as it was.
  void key() {
    if (state_ == kArmed) begin();
  }

  // The rate for this sample; the glide moves on by one.
  double step() {
    const double now = rate_;
    if (state_ == kGliding) {
      ++count_;
      if (count_ >= end_) {
        hold();
      } else if ((count_ & 31) == 0) {
        rate_ = rate_at(count_);
      }
    }
    return now;
  }

  // On by `samples` samples: exactly what that many calls of step() leave.
  void advance(int64_t samples) {
    if (state_ != kGliding || samples <= 0) return;
    if (samples >= end_ - count_) {
      hold();
      return;
    }
    count_ += samples;
    rate_ = rate_at(count_ & ~static_cast<int64_t>(31));
  }

  // The rate the next step() will return.
  double rate() const { return rate_; }
  // How far through it is: 0 while armed, rising to 1, 1 while holding.
  float place() const {
    if (state_ == kHolding) return 1.0f;
    if (state_ == kArmed) return 0.0f;
    return static_cast<float>(static_cast<double>(count_) / length_);
  }
  State state() const { return state_; }

  static constexpr double kLeast = 1.0e-3;
  static constexpr double kMostSeconds = 86400.0;

 private:
  static double positive(double value) { return value > kLeast ? (value < 1.0e6 ? value : 1.0e6) : kLeast; }

  void arm(bool voice_open) {
    state_ = kArmed;
    count_ = 0;
    rate_ = base_;
    length_ = seconds_ * sample_rate_;
    end_ = static_cast<int64_t>(std::ceil(length_));
    log_ratio_ = std::log(target_ / base_);
    if (voice_open) begin();
  }

  void begin() {
    if (!(length_ > 0.0)) return;  // a time of 0 is off
    state_ = kGliding;
    count_ = 0;
    rate_ = base_;
  }

  void hold() {
    state_ = kHolding;
    count_ = end_;
    rate_ = target_;
  }

  double rate_at(int64_t count) const {
    return base_ * std::exp(log_ratio_ * (static_cast<double>(count) / length_));
  }

  double sample_rate_ = 48000.0;
  double base_ = 1.0;
  double target_ = 1.0;
  double seconds_ = 0.0;
  double length_ = 0.0;      // the glide's time in samples
  double log_ratio_ = 0.0;   // ln(Target / Beat)
  double rate_ = 1.0;        // the rate of the sample the count stands on
  int64_t count_ = 0;        // samples since it started
  int64_t end_ = 0;          // the first sample that holds
  State state_ = kArmed;
};

// --- the pulse ---------------------------------------------------------------------------------

// One even pulse a period, read from a clock's phase p in [0, 1):
//
//   open     0 ... rising ... 1 ......... falling ... 0 ..........
//   p        0            e               d           d + e        1
//
// It begins to rise at phase 0, so a clock that restarts begins with sound.
// The rise and the fall are half cosines `e` of a period long, and the fall
// begins at Duty `d`, so the pulse is on for Duty of the period between the
// half heights of its two edges and its mean is Duty. Edge is asked for in
// seconds and held to half of the shorter of the on and off times: at 40 Hz
// and Duty 0.5 no edge is longer than 6.25 ms, and every pulse keeps a top
// and a gap. The right ear reads the same clock Offset later:
// pulse_open(wrap_phase(phase - offset_in_turns), shape).
//
// Depth is apart from the shape. With Depth d the gap's level is (1 - d)²:
//
//   gain = floor + (1 - floor)·open        floor = pulse_floor(d)
//
// exactly 0 in the gap at Depth 1, exactly 1 everywhere at Depth 0, and never
// over 1: a pulse only turns down. Smooth Depth in the device as any gain.
//
// A display draws pulse_open from the same numbers; it reads no state.
struct PulseShape {
  float duty;  // the part of the period the pulse is on, 0.01 to 0.99
  float edge;  // the rise, and the fall, as a part of the period
};

// The shape for a rate in hertz, Duty (the device's range is 0.1 to 0.9) and
// Edge in seconds. Call kit::SineTable::init() before the first pulse_open.
inline PulseShape pulse_shape(float hz, float duty, float edge_seconds) {
  const float d = duty > 0.01f ? (duty < 0.99f ? duty : 0.99f) : 0.01f;
  const float most = 0.5f * (d < 0.5f ? d : 1.0f - d);
  const float asked = edge_seconds * hz;
  // (An edge of nothing would be a divide by zero; no device asks for one.)
  const float e = asked > 1.0e-6f ? (asked < most ? asked : most) : 1.0e-6f;
  return {d, e};
}

// How far open the pulse is at `phase`: 0 in the gap, 1 on the top. A phase
// outside [0, 1) reads as the gap.
inline float pulse_open(double phase, PulseShape shape) {
  const float p = static_cast<float>(phase);
  if (!(p > 0.0f)) return 0.0f;
  if (p < shape.edge) return 0.5f - 0.5f * SineTable::cos_lookup(0.5f * p / shape.edge);
  if (p < shape.duty) return 1.0f;
  const float down = p - shape.duty;
  if (down < shape.edge) return 0.5f + 0.5f * SineTable::cos_lookup(0.5f * down / shape.edge);
  return 0.0f;
}

// The gap's level for a Depth in 0..1: (1 - Depth)².
inline float pulse_floor(float depth) {
  const float d = depth > 0.0f ? (depth < 1.0f ? depth : 1.0f) : 0.0f;
  return (1.0f - d) * (1.0f - d);
}

inline float pulse_gain(float open, float floor) { return floor + (1.0f - floor) * open; }

// A pulse that cannot jump. It follows pulse_open but moves no faster than a
// quarter over the steepest part of the edge the shape has now, so a change
// of Rate, Duty or Edge in the middle of a pulse becomes one more edge like
// the pulse's own. With nothing changing the limit is never met and the gate
// is pulse_open to the bit. One a channel; call next() for every sample,
// awake or asleep, with the phase, the shape and the clock's step as they
// stand (asleep it is the same sums, and in the gap a few compares).
struct PulseGate {
  // How far the limit stands above the edge's own steepest slope.
  static constexpr float kHeadroom = 1.25f;

  float open = 0.0f;

  // Put the gate where the pulse stands: at the gap by default, which is
  // where a clock at phase 0 begins.
  void reset(float value = 0.0f) { open = value; }

  // `increment` is what the clock moves on by each sample, in cycles.
  float next(double phase, PulseShape shape, double increment) {
    const float goal = pulse_open(phase, shape);
    // A half cosine `edge` of a period long climbs π/2 over `edge` for each
    // period, at its steepest.
    const float limit = kHeadroom * kHalfPi * static_cast<float>(increment) / shape.edge;
    const float move = goal - open;
    if (move > limit) {
      open += limit;
    } else if (move < -limit) {
      open -= limit;
    } else {
      open = goal;  // also where the limit is not a number
    }
    return open;
  }
};

}  // namespace kit
}  // namespace livemix
