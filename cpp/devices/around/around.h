#pragma once

// Around: the middle of the sound as one source that travels round the
// listener's head, heard by two ears.
//
//   in ─► mid = (L + R) / 2 ─┬─► thin ─► from behind ─► ear line ─┬─► left ear  ─┐
//                            │   (bass)  (shelf, notch)           └─► right ear ─┤
//                            └─► room line ─► eight fixed echoes ───────────────┼─► wet
//         side = (L − R) / 2 ───────────────────────────────────────────────────┘
//
//   an ear:  (low band, delayed for the far ear) + (high band, turned
//            down for the far ear), times its level
//
// The source is a point (x, y) in a disc of radius 1 seen from above: x to the
// right, y to the front, the head at the centre. Everything an ear hears is a
// function of that point, so a source at the centre is the input untouched
// and Radius is how far the cues go.
//
// - Time. The ear tells direction from arrival time in the low band and from
//   level in the high band, so only the band under kShadeHz (one pole) is
//   delayed: the far ear hears the bass later by the sine law for a sphere,
//   kItdSeconds at the full side, times Head (kLineSeconds of it from the
//   line, the rest from the shadow's own lag). Only the far ear is delayed, so
//   a source in front is in time with the dry sound; the delay leaves zero
//   with no slope (kItdKnee), so crossing the middle is no step in pitch.
//   Keeping the delay out of the high band is what keeps the two ears from
//   combing when they are folded to mono.
// - Level. gain = (1 ± kPan·x) / sqrt(1 + kPan²·x²): the two ears keep their
//   summed power, 12 dB apart at the full side.
// - Shadow. The far ear's high band (what is left over the same pole) is
//   turned down by up to kShade times Head.
// - Behind (y < 0) both ears lose top above kRearHz and gain a notch at
//   kNotchHz, as the outer ear does, times Head.
// - Near. Away from the near point (the direction Turn sets) the source is
//   quieter by up to kNearDb and thinner under kThinHz.
// - Blur. Eight echoes of the plain middle between 7 and 38 ms, four to each
//   ear, band-limited to kThinHz..kRoomHz, that do not move with the source:
//   a small room around the head.
// - The side of a stereo input is passed as it is, so a sound that is all
//   side (left against right) is not lost; only the middle moves.
// - Mix is a linear crossfade: wet and dry are coherent.
//
// The path runs by a clock of its own from init(): a count of samples, kept
// through silence and sleep, never reset by the sound. Sleep is decided per
// sample (kHoldSeconds of exact silence in and under the floor out), so the
// output is the same at any block size.
//
// Storage: an ear line of 128 samples and a room line of 4096 (38 ms at
// 96 kHz), about 17 KB. No latency.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Around : public kit::DeviceBase<around::kNumParams> {
 public:
  enum Path : int { kCircle = 0, kEight, kPendulum, kWander, kNumPaths };

  static constexpr float kItdSeconds = 0.00066f;
  static constexpr float kItdKnee = 0.1f;
  static constexpr float kPan = 0.6f;
  static constexpr float kShade = 0.8f;
  static constexpr float kShadeHz = 1000.0f;
  // Turning the far ear's high band down by kShade makes its bass late by
  // kShade / (2π·kShadeHz), 0.127 ms, of itself (the split's own lag); the
  // line gives the rest of kItdSeconds.
  static constexpr float kLineSeconds = kItdSeconds - kShade / (kit::kTwoPi * kShadeHz);
  static constexpr float kRearShelf = 0.45f;
  static constexpr float kRearHz = 5000.0f;
  static constexpr float kNotchHz = 7500.0f;
  static constexpr float kNotchQ = 3.0f;
  static constexpr float kNotchDepth = 0.5f;
  static constexpr float kNearDb = 12.0f;
  static constexpr float kThin = 0.5f;
  static constexpr float kThinHz = 250.0f;
  static constexpr float kRoomGain = 0.4f;
  static constexpr float kRoomHz = 4000.0f;
  static constexpr int kRoomTaps = 4;
  // Echo times in milliseconds and their gains, left ear then right.
  static constexpr float kRoomMs[2][kRoomTaps] = {{7.3f, 13.1f, 21.7f, 33.1f},
                                                  {8.9f, 15.7f, 24.9f, 37.3f}};
  static constexpr float kRoomTap[2][kRoomTaps] = {{0.5f, -0.4f, 0.32f, -0.25f},
                                                   {-0.5f, 0.4f, -0.32f, 0.25f}};
  // The path's clock wraps after this many turns: Wander repeats then.
  static constexpr double kPathTurns = 16.0;
  static constexpr int kControlPeriod = 16;
  static constexpr float kGlideSeconds = 0.03f;   // Radius, Head, Near, Turn
  static constexpr float kPathSeconds = 0.05f;    // one path giving way to another
  static constexpr float kHoldSeconds = 0.1f;
  static constexpr float kInputCeiling = 8.0f;

  // Where a path has its source after `turns` turns, before Radius and Turn:
  // x to the right, y to the front, inside the unit disc.
  static void path_point(int path, double turns, float* x, float* y) {
    const float p = static_cast<float>(turns - std::floor(turns));
    switch (path) {
      case kEight:
        // A loop at each side through the middle: right and to the front first.
        *x = kit::SineTable::lookup(p);
        *y = 0.5f * kit::SineTable::lookup(2.0f * p);
        return;
      case kPendulum: {
        // A quarter turn to each side of the front, slow at the ends.
        const float swing = 0.25f * kit::SineTable::lookup(p);
        *x = kit::SineTable::lookup(swing);
        *y = kit::SineTable::cos_lookup(swing);
        return;
      }
      case kWander: {
        // Three turnings each way at sixteenths of the rate that share no
        // period shorter than kPathTurns; held to the disc.
        const float t = static_cast<float>(turns * (1.0 / kPathTurns) -
                                           std::floor(turns * (1.0 / kPathTurns)));
        float wx = 0.5f * kit::SineTable::lookup(16.0f * t) +
                   0.3f * kit::SineTable::lookup(9.0f * t) +
                   0.2f * kit::SineTable::lookup(27.0f * t);
        float wy = 0.5f * kit::SineTable::cos_lookup(13.0f * t) +
                   0.3f * kit::SineTable::cos_lookup(7.0f * t) +
                   0.2f * kit::SineTable::cos_lookup(23.0f * t);
        const float reach = std::sqrt(wx * wx + wy * wy);
        if (reach > 1.0f) {
          wx /= reach;
          wy /= reach;
        }
        *x = wx;
        *y = wy;
        return;
      }
      case kCircle:
      default:
        // From the front, to the right first.
        *x = kit::SineTable::lookup(p);
        *y = kit::SineTable::cos_lookup(p);
        return;
    }
  }

  // The far ear's delay as a share of kItdSeconds, for a source `across` of
  // the way to the other side (0..1): zero with no slope at 0, 1 at 1.
  static float far_delay(float across) {
    if (across <= 0.0f) return 0.0f;
    return across * across * (1.0f + kItdKnee) / (across + kItdKnee);
  }

  void init(float sample_rate) {
    using namespace around;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    const float control_rate = sr / static_cast<float>(kControlPeriod);
    clear_sound();
    thin_lp_.set_cutoff(kThinHz, sr);
    rear_lp_.set_cutoff(kRearHz, sr);
    notch_.set(kNotchHz, kNotchQ, sr);
    room_lp_.set_cutoff(kRoomHz, sr);
    shade_lp_.set_cutoff(kShadeHz, sr);
    for (int e = 0; e < 2; ++e) {
      for (int t = 0; t < kRoomTaps; ++t) {
        room_delay_[e][t] = static_cast<int>(kRoomMs[e][t] * 0.001f * sr + 0.5f);
      }
    }
    radius_.set_time(kGlideSeconds, control_rate);
    head_.set_time(kGlideSeconds, control_rate);
    near_.set_time(kGlideSeconds, control_rate);
    turn_coeff_ = kit::time_to_coeff(kGlideSeconds, control_rate);
    for (kit::Smoother& weight : weight_) weight.set_time(kPathSeconds, control_rate);
    blur_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    phase_ = 0.0;
    hold_ = static_cast<long>(kHoldSeconds * sr);
    if (hold_ < 1) hold_ = 1;
    quiet_ = hold_;
    asleep_ = true;
    tick_ = 0;
    for (int id = 0; id < kNumParams; ++id) apply(id);
    snap_controls();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The reading named by "meters" in device.json, for the display: where the
  // source is on its path, as a share of the clock's kPathTurns turns (0..1).
  // It runs on through silence and sleep.
  float meter(int index) const {
    return index == 0 ? static_cast<float>(phase_ * (1.0 / kPathTurns)) : 0.0f;
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (asleep_ && !input_present(frames)) {
      // Nothing to do but keep the clock.
      silence_output(frames);
      advance(static_cast<double>(frames) * increment_);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      in[0] = sane(in[0]);
      in[1] = sane(in[1]);
      const bool silent_in = in[0] == 0.0f && in[1] == 0.0f;
      if (asleep_) {
        if (silent_in) {
          out_left_[i] = 0.0f;
          out_right_[i] = 0.0f;
          advance(increment_);
          continue;
        }
        // Woken: knobs moved in the sleep are where they were put.
        asleep_ = false;
        quiet_ = 0;
        tick_ = 0;
        snap_controls();
      }
      if (tick_ == 0) control();
      if (++tick_ >= kControlPeriod) tick_ = 0;
      advance(increment_);

      const float mid = 0.5f * (in[0] + in[1]);
      const float side = 0.5f * (in[0] - in[1]);
      // The bass under kThinHz is split off once: the room does without it
      // (so a held low note does not sit on the echoes' comb), and the
      // source loses some of it away from the near point.
      const float bass = thin_lp_.lowpass(mid);
      room_line_.write(room_lp_.lowpass(mid - bass));

      // What both ears hear alike: thinner away from the near point, and the
      // outer ear's colour from behind.
      float source = mid - ramp(thin_) * bass;
      const float rear = ramp(rear_);
      source -= rear * kRearShelf * (source - rear_lp_.lowpass(source));
      source -= rear * kNotchDepth * notch_.bandpass(source);
      // The ears share one split: the low band goes down the line to be
      // delayed, the high band is only turned down (the shadow).
      const float low = shade_lp_.lowpass(source);
      const float high = source - low;
      ear_line_.write(low);

      const float blur = blur_.next() * kRoomGain;
      float wet[2];
      for (int e = 0; e < 2; ++e) {
        const float ear = (read_ear(ramp(delay_[e])) + high * (1.0f - ramp(shade_[e]))) * ramp(gain_[e]);
        float room = 0.0f;
        for (int t = 0; t < kRoomTaps; ++t) {
          room += kRoomTap[e][t] * room_line_.read(room_delay_[e][t]);
        }
        wet[e] = ear + blur * room;
      }
      wet[0] += side;
      wet[1] -= side;

      const float mix = mix_.next();
      const float left = in[0] + (wet[0] - in[0]) * mix;
      const float right = in[1] + (wet[1] - in[1]) * mix;
      out_left_[i] = left;
      out_right_[i] = right;

      const bool silent_out = left > -kFloor && left < kFloor && right > -kFloor && right < kFloor;
      if (silent_in && silent_out) {
        if (++quiet_ >= hold_) {
          // Asleep from the next sample: what is left is under the floor.
          asleep_ = true;
          clear_sound();
        }
      } else {
        quiet_ = 0;
      }
    }
  }

 private:
  static constexpr float kFloor = kit::IdleGate::kFloor;

  // A value that goes to its next target in a straight line over one control
  // period and lands on it exactly.
  struct Ramp {
    float value = 0.0f;
    float target = 0.0f;
    float step = 0.0f;
    void to(float next, bool snap) {
      value = snap ? next : target;
      target = next;
      step = (next - value) * (1.0f / static_cast<float>(kControlPeriod));
    }
  };
  static float ramp(Ramp& r) {
    r.value += r.step;
    return r.value;
  }

  // Not a number is silence; anything absurd is held to a bound.
  static float sane(float x) {
    if (!(x == x)) return 0.0f;
    return kit::clamp(x, -kInputCeiling, kInputCeiling);
  }

  void advance(double turns) {
    phase_ += turns;
    if (phase_ >= kPathTurns) phase_ -= kPathTurns * std::floor(phase_ / kPathTurns);
  }

  // The ear line read `delay` samples back from the sample just written
  // (0 is that sample): Hermite, with the point ahead of the newest sample
  // taken on the line through the last two, so a delay of nothing is exact.
  float read_ear(float delay) const {
    const float position = 1.0f + (delay > 0.0f ? delay : 0.0f);
    const int whole = static_cast<int>(position);
    const float fraction = position - static_cast<float>(whole);
    const float y0 = ear_line_.read(whole);
    if (fraction == 0.0f) return y0;
    const float y1 = ear_line_.read(whole + 1);
    const float y2 = ear_line_.read(whole + 2);
    const float ym1 = whole >= 2 ? ear_line_.read(whole - 1) : 2.0f * y0 - y1;
    return kit::hermite(ym1, y0, y1, y2, fraction);
  }

  void clear_sound() {
    ear_line_.clear();
    room_line_.clear();
    thin_lp_.reset();
    rear_lp_.reset();
    room_lp_.reset();
    notch_.reset();
    shade_lp_.reset();
  }

  // Knobs go to where they were put at once: before the first sound and on
  // waking.
  void snap_controls() {
    radius_.snap(radius_.target);
    head_.snap(head_.target);
    near_.snap(near_.target);
    turn_ = turn_target_;
    for (kit::Smoother& weight : weight_) weight.snap(weight.target);
    blur_.snap(blur_.target);
    mix_.snap(mix_.target);
    snap_ = true;
  }

  // Every 16 samples: where the source is, and what each ear hears of it.
  void control() {
    const float radius = radius_.next();
    const float head = head_.next();
    const float nearness = near_.next();
    float turn_gap = turn_target_ - turn_;
    turn_gap -= std::floor(turn_gap + 0.5f);  // the short way round
    if (turn_gap > -1.0e-5f && turn_gap < 1.0e-5f) {
      turn_ = turn_target_;
    } else {
      turn_ += turn_gap * (1.0f - turn_coeff_);
      turn_ -= std::floor(turn_ + 0.5f);
    }

    float px = 0.0f, py = 0.0f;
    for (int k = 0; k < kNumPaths; ++k) {
      const float weight = weight_[k].next();
      if (weight <= 0.0f) continue;
      float x, y;
      path_point(k, phase_, &x, &y);
      px += weight * x;
      py += weight * y;
    }
    px *= radius;
    py *= radius;
    // How far the source is from the near point: 0 on the way to it, the
    // distance from the head on the opposite side.
    const float reach = std::sqrt(px * px + py * py);
    const float away = kit::max(0.0f, 0.5f * (reach - py));
    const float turn_sin = kit::SineTable::lookup(turn_);
    const float turn_cos = kit::SineTable::cos_lookup(turn_);
    const float x = px * turn_cos + py * turn_sin;
    const float y = py * turn_cos - px * turn_sin;

    const float near_gain = std::exp(-nearness * away * kNearDb * 0.115129255f);
    const float level = near_gain / std::sqrt(1.0f + kPan * kPan * x * x);
    const float itd = kit::min(kLineSeconds * sample_rate() * head, 120.0f);
    for (int e = 0; e < 2; ++e) {
      const float towards = e == 0 ? -x : x;  // 1 when the source is at this ear
      const float across = kit::max(0.0f, -towards);
      gain_[e].to(level * (1.0f + kPan * towards), snap_);
      delay_[e].to(itd * far_delay(across), snap_);
      shade_[e].to(head * kShade * across, snap_);
    }
    rear_.to(head * kit::max(0.0f, -y), snap_);
    thin_.to(nearness * away * kThin, snap_);
    snap_ = false;
  }

  void apply(int id) {
    using namespace around;
    const float value = param(id);
    switch (id) {
      case kPath: {
        const int path = kit::clamp_int(static_cast<int>(value + 0.5f), 0, kNumPaths - 1);
        for (int k = 0; k < kNumPaths; ++k) weight_[k].set_target(k == path ? 1.0f : 0.0f);
        break;
      }
      case kRate:
        increment_ = static_cast<double>(value) / static_cast<double>(sample_rate());
        break;
      case kRadius:
        radius_.set_target(value);
        break;
      case kHead:
        head_.set_target(value);
        break;
      case kNear:
        near_.set_target(value);
        break;
      case kTurn:
        turn_target_ = value * (1.0f / 360.0f);
        break;
      case kBlur:
        blur_.set_target(value);
        break;
      case kMix:
        mix_.set_target(value);
        break;
      default:
        break;
    }
  }

  kit::DelayLine<128> ear_line_;    // 0.66 ms at 96 kHz and the interpolator's margin
  kit::DelayLine<4096> room_line_;  // 37.3 ms at 96 kHz
  kit::OnePole thin_lp_, rear_lp_, room_lp_, shade_lp_;
  kit::Svf notch_;
  kit::Smoother radius_, head_, near_;  // on the control clock
  kit::Smoother weight_[kNumPaths];     // on the control clock
  kit::Smoother blur_, mix_;            // per sample
  Ramp gain_[2], delay_[2], shade_[2], rear_, thin_;
  int room_delay_[2][kRoomTaps] = {};
  double phase_ = 0.0;      // turns, 0..kPathTurns
  double increment_ = 0.0;  // turns per sample
  float turn_ = 0.0f;       // cycles
  float turn_target_ = 0.0f;
  float turn_coeff_ = 0.0f;
  long hold_ = 1;
  long quiet_ = 1;
  int tick_ = 0;
  bool asleep_ = true;
  bool snap_ = true;
};

}  // namespace livemix
