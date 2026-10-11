#pragma once

// Around: a sound as a source that travels round the listener's head, heard
// by two ears. Each ear hears its own channel of the input through what the
// source's place makes of that ear, so a mono sound moves whole and a stereo
// one leans and darkens with it, and nothing of it is lost.
//
//   in L ─► thin ─► front/back ─► split ─► low + tilt L · high ─► · gain L ─┐
//           (bass)  (shelf, band)                                           ├─► wet
//   in R ─► thin ─► front/back ─► split ─► low + tilt R · high ─► · gain R ─┤
//   (L + R) / 2 ─► room line ─► eight fixed echoes, four an ear ────────────┘
//
// The source is a point (x, y) in a disc of radius 1 seen from above: x to the
// right, y to the front, the head at the centre. Everything an ear hears is a
// function of that point, so a source at the centre is the input untouched
// and Radius is how far the cues go.
//
// - Level. gain = (1 ± kPan·x) / sqrt(1 + kPan²·x²): the two ears keep their
//   summed power, 12 dB apart at the full side.
// - Shadow and time. One one-pole split at kShadeHz an ear. The far ear's
//   band over it is turned down by up to kShade times Head, and the near
//   ear's is turned up by just what the far ear lost (lift = shade · far gain
//   / near gain), so the two ears summed are flat at every place. A shelf is
//   a lag: the far ear's bass is late by shade / (2π·kShadeHz) and the near
//   ear's early by lift / (2π·kShadeHz), kItdSeconds between them at the full
//   side, and that lateness fades out above the split of itself. There is no
//   delay line: a delay held to higher pitches puts the ears in opposite
//   phase there and leaves a hole when they are summed, and a delay cut off
//   at a split combs the far ear. The ears are never more than about 47
//   degrees apart in phase.
// - Front and back. In front (y > 0) both ears gain a little top over kTopHz
//   and a narrow band at kNotchHz; behind they lose the same, times Head.
//   That colour is all that tells the back from the front.
// - Near. The source is louder by up to kNearUpDb at the near point (the
//   direction Turn sets) and quieter by the rest of kNearDb opposite it,
//   where it also loses bass under kThinHz. The room follows that level.
// - Speed. Where the path would move the far ear's lateness faster than
//   kBend (ten cents of pitch on its bass), the shadow is made shallower:
//   shade is scaled by kBend·2π·kShadeHz over the path's top speed.
// - Blur. Eight echoes of the middle of the input between 7 and 38 ms, four
//   to each ear, band-limited to kThinHz..kRoomHz, that do not move with the
//   source: a small room around the head.
// - Mix is a linear crossfade: wet and dry are coherent, and never more than
//   a quarter turn apart in phase.
//
// The path runs by a clock of its own from init(): a count of samples, kept
// through silence and sleep, never reset by the sound; Direction is the sign
// of its step, and a new Rate or Direction is reached over kGlideSeconds. Sleep is decided per sample (kHoldSeconds of exact silence in
// and under the floor out), so the output is the same at any block size.
//
// Storage: a room line of 4096 samples (38 ms at 96 kHz), about 17 KB. No
// latency.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Around : public kit::DeviceBase<around::kNumParams> {
 public:
  enum Path : int { kCircle = 0, kEight, kPendulum, kWander, kNumPaths };

  static constexpr float kItdSeconds = 0.00066f;
  static constexpr float kPan = 0.6f;
  static constexpr float kShade = 0.8f;
  // The split that makes the ears kItdSeconds apart in the bass at the full
  // side: (kShade + lift) / (2π·kItdSeconds), lift = kShade·(1−kPan)/(1+kPan).
  // 241 Hz.
  static constexpr float kShadeHz =
      kShade * 2.0f / ((1.0f + kPan) * kit::kTwoPi * kItdSeconds);
  // The most the far ear's lateness may change in a second of sound, as a
  // share: ten cents.
  static constexpr float kBend = 0.0057929f;
  static constexpr float kShadeSpeed = kBend * kit::kTwoPi * kShadeHz;
  // The fastest a path's point moves, in disc radii a turn.
  static constexpr float kPathSpeed[kNumPaths] = {6.2832f, 8.8858f, 9.8696f, 6.4f};
  static constexpr float kTopShelf = 0.15f;
  static constexpr float kTopHz = 5000.0f;
  static constexpr float kNotchHz = 7500.0f;
  static constexpr float kNotchQ = 3.0f;
  static constexpr float kNotchDepth = 0.2f;
  static constexpr float kNearDb = 12.0f;
  static constexpr float kNearUpDb = 2.5f;
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

  // What Near makes of the source's level, in dB: `reach` is how far the
  // source is from the head and `away` how far it is from the near point.
  static float near_db(float nearness, float reach, float away) {
    return nearness * (kNearUpDb * reach - kNearDb * away);
  }

  // How much of the shadow a path keeps at its speed: all of it until the
  // far ear's lateness would change faster than kBend.
  static float shade_kept(float speed, float head) {
    const float wanted = head * kShade * speed;
    return wanted > kShadeSpeed ? kShadeSpeed / wanted : 1.0f;
  }

  void init(float sample_rate) {
    using namespace around;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    const float control_rate = sr / static_cast<float>(kControlPeriod);
    for (Ear& ear : ear_) {
      ear.thin_lp.set_cutoff(kThinHz, sr);
      ear.top_lp.set_cutoff(kTopHz, sr);
      ear.notch.set(kNotchHz, kNotchQ, sr);
      ear.shade_lp.set_cutoff(kShadeHz, sr);
    }
    room_lp_.set_cutoff(kRoomHz, sr);
    clear_sound();
    for (int e = 0; e < 2; ++e) {
      for (int t = 0; t < kRoomTaps; ++t) {
        room_delay_[e][t] = static_cast<int>(kRoomMs[e][t] * 0.001f * sr + 0.5f);
      }
    }
    radius_.set_time(kGlideSeconds, control_rate);
    head_.set_time(kGlideSeconds, control_rate);
    near_.set_time(kGlideSeconds, control_rate);
    speed_.set_time(kGlideSeconds, control_rate);
    turn_coeff_ = kit::time_to_coeff(kGlideSeconds, control_rate);
    for (kit::Smoother& weight : weight_) weight.set_time(kPathSeconds, control_rate);
    blur_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    phase_ = 0.0;
    increment_ = 0.0;
    glide_left_ = 0;
    glide_samples_ = static_cast<long>(kGlideSeconds * sr);
    if (glide_samples_ < 1) glide_samples_ = 1;
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
      // Nothing to do but keep the clock, a sample at a time as when awake,
      // so the place is the same to the bit whatever the block size.
      silence_output(frames);
      for (int i = 0; i < frames; ++i) advance();
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
          advance();
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
      advance();

      // Each ear hears its own channel: thinner away from the near point,
      // coloured by front or back, and the band over the split turned down
      // for the far ear and up for the near one.
      const float thin = ramp(thin_);
      const float colour = ramp(colour_);
      float wet[2];
      float bass_sum = 0.0f;
      for (int e = 0; e < 2; ++e) {
        Ear& ear = ear_[e];
        const float bass = ear.thin_lp.lowpass(in[e]);
        bass_sum += bass;
        float source = in[e] - thin * bass;
        source += colour * kTopShelf * (source - ear.top_lp.lowpass(source));
        source += colour * kNotchDepth * ear.notch.bandpass(source);
        const float low = ear.shade_lp.lowpass(source);
        wet[e] = (low + ramp(tilt_[e]) * (source - low)) * ramp(gain_[e]);
      }
      // The room hears the middle of the input without its bass (so a held
      // low note does not sit on the echoes' comb), and is as loud against
      // the source wherever the source is: left at its own level it would
      // meet a far source as an equal and could cancel a held note.
      room_line_.write(room_lp_.lowpass(0.5f * (in[0] + in[1] - bass_sum)));
      const float blur = blur_.next() * kRoomGain * ramp(room_);
      for (int e = 0; e < 2; ++e) {
        float room = 0.0f;
        for (int t = 0; t < kRoomTaps; ++t) {
          room += kRoomTap[e][t] * room_line_.read(room_delay_[e][t]);
        }
        wet[e] += blur * room;
      }

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

  // What one ear's channel goes through.
  struct Ear {
    kit::OnePole thin_lp, top_lp, shade_lp;
    kit::Svf notch;
    void reset() {
      thin_lp.reset();
      top_lp.reset();
      shade_lp.reset();
      notch.reset();
    }
  };

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

  // One sample of the clock, either way round. A new Rate or Direction is
  // reached in a straight line over kGlideSeconds, so a source turned back
  // slows, stops and returns: no corner in what the ears get.
  void advance() {
    if (glide_left_ > 0) {
      increment_ += glide_step_;
      if (--glide_left_ == 0) increment_ = increment_target_;
    }
    phase_ += increment_;
    if (phase_ >= kPathTurns) {
      phase_ -= kPathTurns;
    } else if (phase_ < 0.0) {
      phase_ += kPathTurns;
    }
  }

  void clear_sound() {
    room_line_.clear();
    room_lp_.reset();
    for (Ear& ear : ear_) ear.reset();
  }

  // Knobs go to where they were put at once: before the first sound and on
  // waking.
  void snap_controls() {
    radius_.snap(radius_.target);
    head_.snap(head_.target);
    near_.snap(near_.target);
    speed_.snap(speed_.target);
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
    const float rate = speed_.next();
    float turn_gap = turn_target_ - turn_;
    turn_gap -= std::floor(turn_gap + 0.5f);  // the short way round
    if (turn_gap > -1.0e-5f && turn_gap < 1.0e-5f) {
      turn_ = turn_target_;
    } else {
      turn_ += turn_gap * (1.0f - turn_coeff_);
      turn_ -= std::floor(turn_ + 0.5f);
    }

    float px = 0.0f, py = 0.0f, top_speed = 0.0f;
    for (int k = 0; k < kNumPaths; ++k) {
      const float weight = weight_[k].next();
      if (weight <= 0.0f) continue;
      float x, y;
      path_point(k, phase_, &x, &y);
      px += weight * x;
      py += weight * y;
      top_speed += weight * kPathSpeed[k];
    }
    px *= radius;
    py *= radius;
    // How far the source is from the head, and from the near point: 0 on the
    // way to it, the distance from the head on the opposite side.
    const float reach = std::sqrt(px * px + py * py);
    const float away = kit::max(0.0f, 0.5f * (reach - py));
    const float turn_sin = kit::SineTable::lookup(turn_);
    const float turn_cos = kit::SineTable::cos_lookup(turn_);
    const float x = px * turn_cos + py * turn_sin;
    const float y = py * turn_cos - px * turn_sin;

    const float near_gain = std::exp(near_db(nearness, reach, away) * 0.115129255f);
    const float level = near_gain / std::sqrt(1.0f + kPan * kPan * x * x);
    const float depth = head * kShade * shade_kept(rate * radius * top_speed, head);
    float gain[2], shade[2];
    for (int e = 0; e < 2; ++e) {
      const float towards = e == 0 ? -x : x;  // 1 when the source is at this ear
      gain[e] = level * (1.0f + kPan * towards);
      shade[e] = depth * kit::max(0.0f, -towards);
    }
    for (int e = 0; e < 2; ++e) {
      // What this ear loses over the split, and what it is given of the
      // other's loss, so that the two summed stay flat.
      const float lift = shade[1 - e] * gain[1 - e] / gain[e];
      gain_[e].to(gain[e], snap_);
      tilt_[e].to(1.0f - shade[e] + lift, snap_);
    }
    room_.to(near_gain, snap_);
    colour_.to(head * y, snap_);
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
      case kDirection: {
        const double way = param(kDirection) >= 0.5f ? -1.0 : 1.0;
        increment_target_ = way * static_cast<double>(param(kRate)) / static_cast<double>(sample_rate());
        if (primed()) {
          glide_left_ = glide_samples_;
          glide_step_ = (increment_target_ - increment_) / static_cast<double>(glide_samples_);
        } else {
          glide_left_ = 0;
          increment_ = increment_target_;
        }
        speed_.set_target(param(kRate));
        break;
      }
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

  Ear ear_[2];
  kit::DelayLine<4096> room_line_;  // 37.3 ms at 96 kHz
  kit::OnePole room_lp_;
  kit::Smoother radius_, head_, near_, speed_;  // on the control clock
  kit::Smoother weight_[kNumPaths];             // on the control clock
  kit::Smoother blur_, mix_;                    // per sample
  Ramp gain_[2], tilt_[2], colour_, thin_, room_;
  int room_delay_[2][kRoomTaps] = {};
  double phase_ = 0.0;      // turns, 0..kPathTurns
  double increment_ = 0.0;  // turns per sample, signed by Direction
  double increment_target_ = 0.0;
  double glide_step_ = 0.0;
  long glide_left_ = 0;
  long glide_samples_ = 1;
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
