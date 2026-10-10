#pragma once

// Distance: one control moves the sound away from the listener, the way air
// and a room do it.
//
//   in ─► air (2 poles) ─┬─► line L, R ─► read at the travel time ─► narrow (mid/side) ─► × direct ──────┐
//                        │                                                                               │
//                        ├─► line L, R ─► read a wall's lag later ─► low cut ─► narrow ─► 4 allpasses ───┤
//                        │                 a side ─► the diffuse room: one allpass loop a side           ▼
//                        └─► line M ────► 8 reads: the first reflections, each panned and scaled ──────► out
//
// - The place of the source is a number p from 0 (close) to 1 (far), and its
//   distance is d = 32^p metres: 1 m at 0 and 32 m at 1, a doubling for every
//   fifth of the control. Everything below is a function of d.
// - Level: against the room the direct sound falls as 1/d, 6 dB for each
//   doubling. What tames it is the room: its share of the sound is 1 - 1/d,
//   none at 1 m (the source is at the ear) and nearly all of it far away, so
//   the sound sinks into the room instead of into silence. A room is as loud
//   at its back as at its front, so that alone would stop getting quieter a
//   few metres out: on top of it the whole (direct sound, reflections and
//   room alike) falls as d^-0.35, 2 dB for each doubling, about what a hall
//   loses towards its back. Farther is always quieter.
// - Time: the sound arrives (d - 1) / 343 seconds late, up to 90 ms. The
//   delay is real, so a source that moves is bent in pitch by its speed
//   (Doppler). Doppler scales the travel time, and with it the bend.
// - Air: two one-pole low-passes whose -3 dB point is
//   1500 Hz / sqrt(Air² · (d - 1) / 31). Air 0.2 is about what real air takes
//   over these distances; the rest of the control is thicker air than there
//   is. At 1 m the filter is the wire.
// - Width: a source one metre to each side of its middle is seen under
//   atan(1 / d), and the sides are turned down by that against what they are
//   at 1 m. Width is how much of the distance the angles take: they follow
//   d^Width, so 0 never narrows and 1 narrows as geometry has it. What is
//   sent to the diffuse room is narrowed the same, so a source off to one
//   side comes to the middle whole, with its room; the first reflections are
//   of the middle of the input to begin with. The diffuse room draws in
//   too: its two sides are two loops with nothing in common, as wide as
//   sound gets, and its sides are turned down against its middle by the
//   root of the direct sound's gain (half as many dB: 6.5 dB at 32 m with
//   Width at its middle, 14 dB at the top), with the whole room made up for
//   what that takes so it stays as loud. So far away, where the room is
//   nearly all there is, a sound in the middle stays in the middle and the
//   whole sums to one channel without the room dropping out.
// - The room: listener and source stand on one line down a room W wide
//   (4 m to 40 m with Room), 7 % of W off its middle. Eight image sources
//   (floor, ceiling, each side wall, two of second order, the far left wall
//   twice and the right wall three times) give the first reflections: each
//   is as late as its path is longer than the direct one, as loud as 1 / path
//   times what its walls keep, and comes from where its image stands, so as
//   the source recedes they close up on the direct sound in time, in level
//   and in angle. After the first side wall's lag the diffuse room begins.
// - The diffuse room is, a side, four allpass diffusers and then one allpass
//   whose delay is itself a short delay and eight allpasses in a row (a
//   nested allpass). It loses nothing and adds nothing: every frequency
//   comes out as loud as it went in, so a held note is as loud at one pitch
//   as at the next, which a network of delay lines with a gain in each (the
//   usual late reverb, and what this device first had) is not: there a held
//   note that falls on one of the room's modes stands 5 to 14 dB over the
//   others. The loop is as long as sound takes to cross the room three
//   times; Decay sets how much of the sound leaves it on each round,
//   g = 10^(-3 · loop / Decay), so it rings for Decay. What does not go
//   round (g² of the power: a seventh at the defaults, more when a small
//   room is asked to ring long) comes out at once, through the diffusers,
//   as the room's first answer. The highs go round a little less than the
//   rest, by a gain that depends on frequency but not on phase (three taps
//   with their middle on the loop), so they ring shorter and the whole is
//   still exactly flat. The two sides have loops of different lengths: the
//   same level on both, a different phase.
//   Nothing in the room moves by itself: with Wander at 0 the whole device
//   is a fixed filter, and a held note keeps its level.
// - Level: 0 leaves the drop in loudness that distance makes; 1 lifts the
//   whole by one over the root of the power the model puts out (direct,
//   reflections and room), so a far sound is as loud as a near one and only
//   its place has changed.
// - Wander: the source walks nearer and farther by itself, on three sines at
//   incommensurate rates around Rate, between Distance - Wander / 2 and
//   Distance + Wander / 2 (kept inside 0..1). The walk never stops and is
//   never reset: its phases are whole-number counts of an absolute sample
//   clock that keeps running while the device sleeps, so it is where it would
//   have been whatever the block size. No walk may move the source faster
//   than about half the speed of sound: past that the travel time is scaled
//   back.
// - Moving a knob moves the source: Distance, Wander, Doppler and Room glide
//   over two poles of 150 ms, so the pitch bends and settles as a real move
//   does. The glide arrives (it is kept in double): once it has, the travel
//   time is a whole number of samples again and nothing is read between two.
// - At Distance 0 with Wander 0 nothing is done at all: the delay is zero
//   samples, the filter passes, the sides are whole, the room has no share,
//   and the output is the input, sample for sample.
// - Storage (sized for 96 kHz): two lines of 32768 samples (travel time plus
//   the lag of the room), one of 65536 (travel time plus the latest
//   reflection, 331 ms), eighteen of 8192 for the two loops and eight
//   allpasses of 2048: about 1.2 MB.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Distance : public kit::DeviceBase<distance::kNumParams> {
 public:
  // The model's constants, as the harness and the display read them.
  static constexpr float kFarMetres = 32.0f;
  static constexpr float kOctaves = 5.0f;  // log2(kFarMetres / 1 m)
  static constexpr float kSoundSpeed = 343.0f;
  static constexpr float kAirHz = 1500.0f;
  // Two equal poles are 3 dB down together where each is 1.5 dB down.
  static constexpr float kAirPoleRatio = 1.5571f;
  static constexpr float kGlideSeconds = 0.15f;
  static constexpr float kMostBend = 0.45f;
  static constexpr int kTaps = 8;
  static constexpr int kPeriod = 32;
  static constexpr float kNarrowestRoom = 4.0f;
  static constexpr float kEarHeight = 1.5f;
  // How loud the diffuse room is against the direct sound at 1 m: from a
  // small live room to a large hall.
  static constexpr float kRoomLevelSmall = 0.5f;
  static constexpr float kRoomLevelLarge = 0.25f;
  // How the whole falls with distance, on top of the direct sound's 1/d
  // against the room: d to the power of minus this.
  static constexpr float kFall = 0.35f;
  // The diffuse room: a loop a side, of a short delay and kInner allpasses,
  // as long as sound takes to cross the room so many times.
  static constexpr int kInner = 8;
  static constexpr float kLoopCrossings = 3.0f;
  static constexpr float kInnerGain = 0.5f;
  // The loop is never longer than this much of Decay: a room cannot be asked
  // to ring shorter than sound takes to go round it, so a short Decay makes
  // a large room smaller.
  static constexpr float kLoopOfDecay = 0.4f;
  // What goes to the room is cut below kSendCutHz, so nothing that is not
  // sound goes round in it. Of pink noise that leaves 0.8835 of the power
  // (the integral of f² / (f² + cut²) over the octaves from 20 Hz to
  // 20 kHz), and the room is made up by the root of it. The cut is low:
  // far away nearly all of the sound is the room, and a far sound has its
  // bass.
  static constexpr float kSendCutHz = 40.0f;
  static constexpr float kSendMakeup = 1.0639f;
  // The walk: three sines at these multiples of Rate, weighted so.
  static constexpr float kWalkRatio[3] = {1.0f, 0.6180340f, 1.7320508f};
  static constexpr float kWalkWeight[3] = {0.5f, 0.3f, 0.2f};
  static constexpr float kWalkStart[3] = {0.0f, 0.33f, 0.71f};
  // The eight image sources. Across, in room widths (left is negative): the
  // line stands 7 % of the width right of the middle, so the left wall's
  // image is 1.14 widths off and the right wall's 0.86. Up: 0 on the level,
  // 1 the floor's image (twice the ear's height down), 2 the ceiling's. What
  // is kept: 0.7 for each wall met and 0.35 for the floor.
  static constexpr float kImageAcross[kTaps] = {0.0f, 0.0f, -1.14f, 0.86f, -1.14f, 0.86f, -2.0f, 2.86f};
  static constexpr int kImageUp[kTaps] = {1, 2, 0, 0, 2, 1, 0, 0};
  static constexpr float kImageKeeps[kTaps] = {0.35f, 0.7f, 0.7f, 0.7f, 0.49f, 0.245f, 0.49f, 0.343f};
  static constexpr float kCeilingBase = 2.4f;
  static constexpr float kCeilingSlope = 0.3f;
  // The time sound takes to cross the room, as the loop counts it: this, and
  // so much of the width over the speed of sound, so the smallest room still
  // is a room and not a pipe (39 ms to 117 ms).
  static constexpr float kShortestCrossing = 0.03f;
  static constexpr float kCrossingShare = 0.75f;
  // The room rings for Decay with this in the exponent of the round gain:
  // the allpasses inside the loop hold the sound longer than their delays
  // are (measured, see the harness).
  static constexpr float kDecayTrim = 1.25f;

  void init(float sample_rate) {
    using namespace distance;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    const float control_rate = sr / kPeriod;

    for (int c = 0; c < 2; ++c) {
      travel_[c].clear();
      air_state_[c][0] = air_state_[c][1] = 0.0f;
      send_cut_[c].reset();
      send_cut_[c].set_cutoff(kSendCutHz, sr);
      for (int a = 0; a < kDiffusers; ++a) {
        diffuser_[c][a].clear();
        diffuser_length_[c][a] = kit::clamp_int(
            static_cast<int>(kDiffuserSeconds[c][a] * sr), 1, kDiffuserSize - 1);
      }
    }
    early_.clear();
    for (int c = 0; c < 2; ++c) {
      bulk_[c].clear();
      for (int k = 0; k < kInner; ++k) inner_[c][k].clear();
      for (int n = 0; n < 4; ++n) loop_past_[c][n] = 0.0f;
    }
    for (int n = 0; n < 3; ++n) {
      walk_[n] = FreePhase();
      walk_[n].phase = to_phase(kWalkStart[n]);
    }
    clock_ = 0;

    centre_.set_time(kGlideSeconds, control_rate);
    half_.set_time(kGlideSeconds, control_rate);
    doppler_.set_time(kGlideSeconds, control_rate);
    room_.set_time(kGlideSeconds, control_rate);
    air_.set_time(kSmoothingSeconds, control_rate);
    width_.set_time(kSmoothingSeconds, control_rate);
    level_.set_time(kSmoothingSeconds, control_rate);
    decay_.set_time(0.03f, control_rate);

    // The longest silent gap: the travel time and the latest reflection.
    idle_.reset(sr, 0.75f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    snap();
    aim(0);
    land();
    position_ = place_at(0);
    bend_ = 1.0f;
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for the display:
  // 0, where the source is now, 0 (1 m) to 1 (32 m), with the walk in it and
  //    the glide of a knob that was just moved (asleep, where the walk has it);
  // 1, the pitch the sound is bent to by the source's movement, as a ratio:
  //    one less the rate at which the travel time grows (1 at rest and asleep).
  float meter(int index) const {
    if (index == 0) return position_;
    if (index == 1) return bend_;
    return 0.0f;
  }

  void process(int frames) {
    frames = begin_block(frames);
    const bool was_asleep = idle_.asleep();
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      // The walk carries on: the clock counts what was not rendered.
      clock_ += static_cast<uint64_t>(frames);
      position_ = place_at(clock_);
      bend_ = 1.0f;
      return;
    }
    if (was_asleep) wake();
    float ringing = 0.0f;
    for (int i = 0; i < frames; ++i) {
      if ((clock_ & (kPeriod - 1)) == 0) tick();
      ++clock_;

      float in[2];
      take_input(i, &in[0], &in[1]);
      // What the air takes, before the lines: a reflection has come through
      // at least as much air as the direct sound.
      const float keep = air_keep_.next();
      float aired[2];
      for (int c = 0; c < 2; ++c) {
        const float x = clean(in[c]);
        if (keep == 0.0f) {
          air_state_[c][0] = x;
          air_state_[c][1] = x;
        } else {
          air_state_[c][0] = flush_denormal(x + (air_state_[c][0] - x) * keep);
          air_state_[c][1] =
              flush_denormal(air_state_[c][0] + (air_state_[c][1] - air_state_[c][0]) * keep);
        }
        aired[c] = air_state_[c][1];
        travel_[c].write(aired[c]);
      }
      early_.write(0.5f * (aired[0] + aired[1]));

      // The direct sound, as late as it has to travel.
      delay_.value += delay_.step;
      const double delay = delay_.value;
      const float direct_left = read_at(travel_[0], delay);
      const float direct_right = read_at(travel_[1], delay);
      const float same = same_.next();
      const float cross = cross_.next();

      // The first reflections: each later than the direct sound by its lag.
      float room_left = 0.0f;
      float room_right = 0.0f;
      for (int k = 0; k < kTaps; ++k) {
        tap_lag_[k].value += tap_lag_[k].step;
        const float tap = read_linear(early_, delay + tap_lag_[k].value);
        room_left += tap * tap_left_[k].next();
        room_right += tap * tap_right_[k].next();
      }

      // The diffuse room, from when the first side wall answers. What goes
      // to it is as narrow as the direct sound is: a source off to one side
      // comes to the middle with its room, and the room is still wide, since
      // its two sides are two different loops.
      send_lag_.value += send_lag_.step;
      const float heard_left =
          send_cut_[0].highpass(read_linear(travel_[0], delay + send_lag_.value));
      const float heard_right =
          send_cut_[1].highpass(read_linear(travel_[1], delay + send_lag_.value));
      const float feed_same = feed_same_.next();
      const float feed_cross = feed_cross_.next();
      const float send[2] = {feed_same * heard_left + feed_cross * heard_right,
                             feed_same * heard_right + feed_cross * heard_left};
      const float round = loop_gain_.next();
      const float tilt = loop_tilt_.next();
      const float late = late_.next();
      float ring[2];
      for (int c = 0; c < 2; ++c) {
        float x = send[c];
        for (int a = 0; a < kDiffusers; ++a) {
          x = diffuser_[c][a].process(x, diffuser_length_[c][a], kDiffusion);
        }
        // The loop's delay: a short line and the allpasses in a row, fed by
        // what went into the loop up to the sample before this one.
        bulk_length_[c].value += bulk_length_[c].step;
        float u = read_before(bulk_[c], bulk_length_[c].value);
        for (int k = 0; k < kInner; ++k) {
          inner_length_[c][k].value += inner_length_[c][k].step;
          const float delayed = read_before(inner_[c][k], inner_length_[c][k].value);
          const float into = flush_denormal(u + kInnerGain * delayed);
          inner_[c][k].write(into);
          u = delayed - kInnerGain * into;
        }
        // One allpass round all of it, y = (S - g F) x / (1 - g F S'), with
        // S' the delay above and S the same two samples later. F is three
        // taps, a, 1 - 2a, a: one sample of delay and a gain that only
        // depends on frequency, so g F is a round gain that falls towards
        // the top and the whole is still an allpass.
        float* past = loop_past_[c];  // u[n-1], u[n-2], w[n-1], w[n-2]
        const float into_loop = flush_denormal(
            x + round * (tilt * (u + past[1]) + (1.0f - 2.0f * tilt) * past[0]));
        bulk_[c].write(into_loop);
        const float out = past[1] - round * (tilt * (into_loop + past[3]) +
                                             (1.0f - 2.0f * tilt) * past[2]);
        past[1] = past[0];
        past[0] = u;
        past[3] = past[2];
        past[2] = into_loop;
        ringing = kit::max(ringing, std::fabs(out));
        ring[c] = out;
      }
      // The room draws in with the source: its sides are turned down
      // against its middle, and the whole made up so that it stays as loud.
      const float room_same = late * room_same_.next();
      const float room_cross = late * room_cross_.next();
      room_left += room_same * ring[0] + room_cross * ring[1];
      room_right += room_same * ring[1] + room_cross * ring[0];

      // The room is exact up to ±1 and lands on ±2: nothing that comes in
      // hot can go out hotter than that. The direct sound is never louder
      // than it came in.
      out_left_[i] = same * direct_left + cross * direct_right +
                     2.0f * kit::soft_clip(0.5f * room_left);
      out_right_[i] = same * direct_right + cross * direct_left +
                      2.0f * kit::soft_clip(0.5f * room_right);
    }
    bend_ = 1.0f - static_cast<float>(delay_.step);
    // Asleep only once the room has rung out, heard or not: close by, where
    // the room has no share, it is still ringing, and a room put to sleep
    // while it rang would be heard later, from wherever the block size
    // happened to stop it.
    idle_.settle(kit::max(output_peak(frames), ringing), frames);
  }

  // --- The model, as plain functions of the place: the harness and the
  // display's test hold the device to these. ---

  // The distance of a place, metres.
  static float metres(float place) { return std::exp2(kOctaves * place); }

  // The -3 dB point of the air, Hz; infinite where the air takes nothing.
  static float air_corner(float air, float metres_away) {
    const float amount = air * air * (metres_away - 1.0f) / (kFarMetres - 1.0f);
    return amount > 0.0f ? kAirHz / std::sqrt(amount) : INFINITY;
  }

  // How much of the power of pink noise (20 Hz to 20 kHz) the air leaves:
  // the integral of the two poles' response over the octaves, in closed form.
  static float air_kept(float corner) {
    if (std::isinf(corner)) return 1.0f;
    const float pole = kAirPoleRatio * corner;
    const float low = (20.0f / pole) * (20.0f / pole);
    const float high = (20000.0f / pole) * (20000.0f / pole);
    const float span = std::log(high / low);  // 2 ln(1000)
    return (std::log(high / (1.0f + high)) + 1.0f / (1.0f + high) - std::log(low / (1.0f + low)) -
            1.0f / (1.0f + low)) /
           span;
  }

  // The gain on the sides against the middle.
  static float side_gain(float place, float width) {
    const float seen = std::exp2(kOctaves * place * width);
    if (!(seen > 1.0f)) return 1.0f;
    return kit::min(1.0f, std::atan(1.0f / seen) * (4.0f / kit::kPi));
  }

  // The gain on the sides of the diffuse room against its middle: the
  // root of the direct sound's, so in dB the room closes half as fast.
  static float room_side(float place, float width) { return std::sqrt(side_gain(place, width)); }

  // The width of the room, metres, and the level of its diffuse sound.
  static float room_width(float room) { return kNarrowestRoom * std::pow(10.0f, room); }
  static float room_level(float room) {
    return kRoomLevelSmall * std::pow(kRoomLevelLarge / kRoomLevelSmall, room);
  }

  // Where image source `k` stands off the line from listener to source:
  // across (left is negative) and up or down, metres, and what its walls keep.
  static void image(int k, float room, float* across, float* up, float* keeps) {
    const float w = room_width(room);
    *across = kImageAcross[k] * w;
    *up = kImageUp[k] == 0   ? 0.0f
          : kImageUp[k] == 1 ? 2.0f * kEarHeight
                             : 2.0f * (kCeilingBase + kCeilingSlope * w - kEarHeight);
    *keeps = kImageKeeps[k];
  }

  // What the whole loses to the distance, as a gain.
  static float fall(float place) { return std::exp2(-kFall * kOctaves * place); }

  // The level of the diffuse room at a place before the fall: its level and
  // its share. The room itself is an allpass, so this is all there is to
  // how loud it is.
  static float late_gain(float place, float room) {
    return room_level(room) * (1.0f - 1.0f / metres(place));
  }

  // How long the room's loop is, seconds.
  static float loop_seconds(float room, float decay) {
    const float crossing = kShortestCrossing + kCrossingShare * room_width(room) / kSoundSpeed;
    return kit::min(kLoopCrossings * crossing, kLoopOfDecay * decay);
  }

  // What comes back from one round of the loop.
  static float round_gain(float room, float decay) {
    return std::pow(10.0f, -3.0f * kDecayTrim * loop_seconds(room, decay) / decay);
  }

  // The make-up the model takes at Level 1: one over the root of the power
  // of the direct sound, the reflections and the room at a place. Level L
  // gives the whole hold^L · fall^(1 - L).
  static float hold_gain(float place, float room, float air) {
    const float d = metres(place);
    const float direct = 1.0f / d;
    const float share = 1.0f - direct;
    float early = 0.0f;
    for (int k = 0; k < kTaps; ++k) {
      float across, up, keeps;
      image(k, room, &across, &up, &keeps);
      const float gain = share * keeps / std::sqrt(d * d + across * across + up * up);
      early += gain * gain;
    }
    const float late = late_gain(place, room);
    return 1.0f / std::sqrt(air_kept(air_corner(air, d)) *
                            (direct * direct + kEarlyPower * early + late * late));
  }

 private:
  static constexpr int kTravelSize = 32768;
  static constexpr int kEarlySize = 65536;
  static constexpr int kLoopSize = 8192;
  static constexpr int kDiffuserSize = 2048;
  static constexpr int kDiffusers = 4;
  // The longest reads, in samples, whatever the sample rate.
  static constexpr double kMostTravel = 0.45 * kTravelSize;
  static constexpr float kMostSendLag = 0.5f * kTravelSize - 8.0f;
  static constexpr float kMostTapLag = kEarlySize - 0.45f * kTravelSize - 8.0f;
  static constexpr float kInputLimit = 16.0f;
  static constexpr float kDiffusion = 0.6f;
  static constexpr float kDiffuserSeconds[2][kDiffusers] = {
      {0.00431f, 0.00673f, 0.01031f, 0.01511f}, {0.00487f, 0.00727f, 0.01129f, 0.01669f}};
  // The loop, a side: how much of it is the plain delay, and how the rest
  // is shared among the allpasses. No two lengths are a simple ratio, and
  // the two sides share none.
  static constexpr float kBulkShare[2] = {0.1f, 0.115f};
  static constexpr float kInnerRatio[2][kInner] = {
      {1.0f, 0.871f, 0.769f, 0.677f, 0.593f, 0.517f, 0.431f, 0.353f},
      {0.953f, 0.907f, 0.733f, 0.701f, 0.571f, 0.541f, 0.409f, 0.371f}};
  // How much less of the highs goes round the loop than of the rest: the
  // outer taps of the three, at 48 kHz, from Air 0 to Air 1. At 10 kHz that
  // is 3 % and 9 % less each round.
  static constexpr float kTiltOpen = 0.02f;
  static constexpr float kTiltClosed = 0.0625f;
  // How much of the reflections' summed power a side hears.
  static constexpr float kEarlyPower = 0.5f;

  // A value on its way to where it is aimed, in a straight line between two
  // control ticks.
  struct Ramp {
    float value = 0.0f;
    float target = 0.0f;
    float step = 0.0f;
    float next() {
      value += step;
      return value;
    }
    void land() {
      value = target;
      step = 0.0f;
    }
    void aim(float to) {
      target = to;
      step = (to - value) * (1.0f / kPeriod);
    }
  };
  // The same for a delay in samples: a float cannot hold 30,000 samples and
  // a thousandth of one.
  struct Reach {
    double value = 0.0;
    double target = 0.0;
    double step = 0.0;
    void land() {
      value = target;
      step = 0.0;
    }
    void aim(double to) {
      target = to;
      step = (to - value) * (1.0 / kPeriod);
    }
    // The same, but never faster than `most` samples a sample: it gets
    // there over as many periods as that takes.
    void aim_within(double to, double most) {
      aim(to);
      if (step > most) step = most;
      if (step < -most) step = -most;
    }
  };
  // Two poles, one after the other: a knob that was moved arrives without a
  // corner in its speed, so the pitch it bends has no step in it. In double:
  // a float this slow stops a hundred-thousandth short of where it is going
  // (its step falls under the float's grain) and would never arrive, and the
  // source is at rest only once it has.
  struct Glide {
    double first = 0.0;
    double value = 0.0;
    double target = 0.0;
    double coeff = 0.0;
    void set_time(float seconds, float rate) {
      coeff = seconds > 0.0f
                  ? std::exp(-1.0 / (static_cast<double>(seconds) * static_cast<double>(rate)))
                  : 0.0;
    }
    void snap() { first = value = target; }
    void next() {
      first = target + (first - target) * coeff;
      value = first + (value - first) * coeff;
      const double off = value - target;
      const double behind = first - target;
      if (off > -kArrived && off < kArrived && behind > -kArrived && behind < kArrived) snap();
    }
    static constexpr double kArrived = 1.0e-7;
  };
  // A phase that is a whole number of 2^-64 cycles and moves by a whole
  // number of them each sample: where it stands at a time is exact, so it is
  // the same after any number of samples however they were counted.
  struct FreePhase {
    uint64_t phase = 0;
    uint64_t step = 0;
    uint64_t seen = 0;
    void set_rate(double cycles_per_sample) {
      step = static_cast<uint64_t>(cycles_per_sample * 18446744073709551616.0);
    }
    void advance_to(uint64_t clock) {
      phase += step * (clock - seen);
      seen = clock;
    }
    // In cycles, 0..1; `clock` may lie before `seen`.
    float at(uint64_t clock) const {
      const uint64_t now = phase + step * (clock - seen);
      return static_cast<float>(now >> 40) * (1.0f / 16777216.0f);
    }
  };

  static uint64_t to_phase(float cycles) {
    return static_cast<uint64_t>(static_cast<double>(cycles) * 18446744073709551616.0);
  }

  // A sample that is not a number is nothing; one past the limit is the
  // limit. Anything a mixer hands over passes untouched.
  static float clean(float x) {
    if (x > -kInputLimit && x < kInputLimit) return x;
    if (x >= kInputLimit) return kInputLimit;
    if (x <= -kInputLimit) return -kInputLimit;
    return 0.0f;
  }

  // x[n - delay] after this sample's write, delay >= 0: a whole delay is the
  // stored sample itself, and no delay is the sample just written.
  template <int Size>
  static float read_at(const kit::DelayLine<Size>& line, double delay) {
    const int whole = static_cast<int>(delay);
    const float t = static_cast<float>(delay - static_cast<double>(whole));
    const float y0 = line.read(whole + 1);
    if (t == 0.0f) return y0;
    const float y1 = line.read(whole + 2);
    const float y2 = line.read(whole + 3);
    const float ym1 = whole > 0 ? line.read(whole) : 2.0f * y0 - y1;
    return kit::hermite(ym1, y0, y1, y2, t);
  }

  template <int Size>
  static float read_linear(const kit::DelayLine<Size>& line, double delay) {
    const int whole = static_cast<int>(delay);
    const float t = static_cast<float>(delay - static_cast<double>(whole));
    const float a = line.read(whole + 1);
    const float b = line.read(whole + 2);
    return a + (b - a) * t;
  }

  // x[n - delay] before this sample's write, as the kit's lines are read in
  // a feedback loop: delay >= 1.
  template <int Size>
  static float read_before(const kit::DelayLine<Size>& line, double delay) {
    const int whole = static_cast<int>(delay);
    const float t = static_cast<float>(delay - static_cast<double>(whole));
    const float a = line.read(whole);
    const float b = line.read(whole + 1);
    return a + (b - a) * t;
  }

  // The walk at a time, -1..1.
  float walk_at(uint64_t clock) const {
    float sum = 0.0f;
    for (int n = 0; n < 3; ++n) sum += kWalkWeight[n] * kit::SineTable::lookup(walk_[n].at(clock));
    return sum;
  }

  // The middle of the walk and how far it goes either way, from the knobs:
  // Wander's half either side of Distance, kept inside 0..1.
  void span(float* centre, float* half) const {
    using namespace distance;
    const float reach = 0.5f * param(kWander);
    const float near = kit::max(0.0f, param(kDistance) - reach);
    const float far = kit::min(1.0f, param(kDistance) + reach);
    *centre = 0.5f * (near + far);
    *half = 0.5f * (far - near);
  }

  // Where the knobs and the walk put the source at a time.
  float place_at(uint64_t clock) const {
    float centre, half;
    span(&centre, &half);
    return kit::clamp(centre + half * walk_at(clock), 0.0f, 1.0f);
  }

  // How much of the travel time a walk may take before its fastest moment
  // would pass the limit on the bend.
  float travel_share() const {
    using namespace distance;
    float centre, half;
    span(&centre, &half);
    const float fastest =
        half * kit::kTwoPi * param(kRate) *
        (kWalkWeight[0] * kWalkRatio[0] + kWalkWeight[1] * kWalkRatio[1] +
         kWalkWeight[2] * kWalkRatio[2]);
    // d(delay)/dt = ln(32) · d / c · dp/dt, fastest at the far end of the walk.
    const float slope = 0.6931472f * kOctaves * metres(centre + half) / kSoundSpeed;
    const float bend = slope * fastest;
    const float most = bend > kMostBend ? kMostBend / bend : 1.0f;
    return kit::min(param(kDoppler), most);
  }

  void apply(int id) {
    using namespace distance;
    switch (id) {
      case kDistance:
      case kWander:
      case kRate:
      case kDoppler: {
        if (id == kRate) {
          for (int n = 0; n < 3; ++n) {
            walk_[n].advance_to(clock_);
            walk_[n].set_rate(static_cast<double>(param(kRate)) * kWalkRatio[n] / sample_rate());
          }
        }
        float centre, half;
        span(&centre, &half);
        centre_.target = centre;
        half_.target = half;
        doppler_.target = travel_share();
        break;
      }
      case kRoom:
        room_.target = param(kRoom);
        break;
      case kAir:
        air_.set_target(param(kAir));
        break;
      case kWidth:
        width_.set_target(param(kWidth));
        break;
      case kLevel:
        level_.set_target(param(kLevel));
        break;
      case kDecay:
        decay_.set_target(param(kDecay));
        break;
      default:
        break;
    }
  }

  // Every knob where it is set: before the first block, and on waking.
  void snap() {
    centre_.snap();
    half_.snap();
    doppler_.snap();
    room_.snap();
    air_.snap(air_.target);
    width_.snap(width_.target);
    level_.snap(level_.target);
    decay_.snap(decay_.target);
  }

  // Waking: the knobs are where they were set while it slept, and every
  // moving value is where it would have been had the device never slept.
  // Ticks fall on whole multiples of the period of the absolute clock, and
  // between two of them a value runs straight from what it is at the first
  // to what it is at the second, so it is rebuilt from the tick before now.
  void wake() {
    snap();
    const uint64_t before = clock_ & ~static_cast<uint64_t>(kPeriod - 1);
    aim(before);
    land();
    if (clock_ == before) return;  // the loop's tick takes it from here
    aim(before + kPeriod);
    const float done = static_cast<float>(clock_ - before);
    advance(done);
  }

  // Once every kPeriod samples: every value lands where it was aimed, the
  // knobs glide a step, and everything is aimed at where it stands one
  // period on.
  void tick() {
    land_gains();
    centre_.next();
    half_.next();
    doppler_.next();
    room_.next();
    air_.next();
    width_.next();
    level_.next();
    decay_.next();
    aim(clock_ + kPeriod);
  }

  // The gains land exactly; the delays carry on from where they are, so a
  // travel time held back by the limit on its speed is not let go at once.
  void land_gains() {
    air_keep_.land();
    same_.land();
    cross_.land();
    late_.land();
    feed_same_.land();
    feed_cross_.land();
    room_same_.land();
    room_cross_.land();
    loop_gain_.land();
    loop_tilt_.land();
    for (int k = 0; k < kTaps; ++k) {
      tap_left_[k].land();
      tap_right_[k].land();
    }
  }

  void land() {
    land_gains();
    delay_.land();
    send_lag_.land();
    for (int k = 0; k < kTaps; ++k) tap_lag_[k].land();
    for (int c = 0; c < 2; ++c) {
      bulk_length_[c].land();
      for (int k = 0; k < kInner; ++k) inner_length_[c][k].land();
    }
  }

  void advance(float samples) {
    air_keep_.value += air_keep_.step * samples;
    same_.value += same_.step * samples;
    cross_.value += cross_.step * samples;
    late_.value += late_.step * samples;
    feed_same_.value += feed_same_.step * samples;
    feed_cross_.value += feed_cross_.step * samples;
    room_same_.value += room_same_.step * samples;
    room_cross_.value += room_cross_.step * samples;
    loop_gain_.value += loop_gain_.step * samples;
    loop_tilt_.value += loop_tilt_.step * samples;
    for (int k = 0; k < kTaps; ++k) {
      tap_left_[k].value += tap_left_[k].step * samples;
      tap_right_[k].value += tap_right_[k].step * samples;
      tap_lag_[k].value += tap_lag_[k].step * samples;
    }
    delay_.value += delay_.step * samples;
    send_lag_.value += send_lag_.step * samples;
    for (int c = 0; c < 2; ++c) {
      bulk_length_[c].value += bulk_length_[c].step * samples;
      for (int k = 0; k < kInner; ++k) {
        inner_length_[c][k].value += inner_length_[c][k].step * samples;
      }
    }
  }

  // Aim everything at what the model says for the time `at`.
  void aim(uint64_t at) {
    const float sr = sample_rate();
    const float place = kit::clamp(
        static_cast<float>(centre_.value) + static_cast<float>(half_.value) * walk_at(at), 0.0f,
        1.0f);
    position_ = place;
    const float d = metres(place);
    const float direct = 1.0f / d;
    const float share = 1.0f - direct;
    const float room = static_cast<float>(room_.value);
    const float air = air_.value;

    // The travel time, never faster than the bend may be.
    double delay = doppler_.value * (d - 1.0f) / kSoundSpeed * sr;
    if (delay > kMostTravel) delay = kMostTravel;
    // At rest the travel time is a whole number of samples: the read is then
    // the stored sample itself.
    if (half_.value == 0.0 && centre_.value == centre_.target &&
        doppler_.value == doppler_.target) {
      delay = std::floor(delay + 0.5);
    }
    delay_.target = delay;
    delay_.step = (delay - delay_.value) * (1.0 / kPeriod);
    if (delay_.step > kFastest) delay_.step = kFastest;
    if (delay_.step < -kFastest) delay_.step = -kFastest;

    const float corner = air_corner(air, d);
    air_keep_.aim(std::isinf(corner) ? 0.0f
                                     : std::exp(-kit::kTwoPi * kAirPoleRatio * corner / sr));

    // The first reflections, and their power for the level hold.
    const float seen = std::exp2(kOctaves * place * width_.value);
    float early = 0.0f;
    float gains[kTaps][2];
    for (int k = 0; k < kTaps; ++k) {
      float across, up, keeps;
      image(k, room, &across, &up, &keeps);
      const float off = across * across + up * up;
      const float path = std::sqrt(d * d + off);
      // path - d, without losing it in the difference of two large numbers.
      tap_lag_[k].aim(static_cast<double>(
          kit::min(off / (path + d) / kSoundSpeed * sr, k == 3 ? kMostSendLag : kMostTapLag)));
      const float gain = share * keeps / path;
      early += gain * gain;
      const float bearing = across / std::sqrt(seen * seen + off);
      gains[k][0] = gain * std::sqrt(0.5f * (1.0f - bearing));
      gains[k][1] = gain * std::sqrt(0.5f * (1.0f + bearing));
      if (k == 3) send_lag_.aim(tap_lag_[k].target);
    }

    // The diffuse room: its level, how long its loop is and what comes back
    // from a round of it.
    const float late = late_gain(place, room);
    const float decay = decay_.value;
    const float loop = loop_seconds(room, decay) * sr;
    loop_gain_.aim(round_gain(room, decay));
    const float per_rate = sr * (1.0f / 48000.0f);
    loop_tilt_.aim(
        kit::min(0.25f, (kTiltOpen + (kTiltClosed - kTiltOpen) * air) * per_rate * per_rate));
    for (int c = 0; c < 2; ++c) {
      // Whole samples: at rest a line is read where a sample is stored, and
      // loses nothing between two of them.
      // A loop that is made longer or shorter (Decay turned in a large
      // room, or Room itself) is read a quarter faster or slower at most
      // while it changes, never backwards and never in a jump.
      bulk_length_[c].aim_within(
          static_cast<double>(
              kit::clamp(std::floor(kBulkShare[c] * loop + 0.5f), 1.0f, kLoopSize - 8.0f)),
          kLoopFastest);
      float parts = 0.0f;
      for (int k = 0; k < kInner; ++k) parts += kInnerRatio[c][k];
      const float part = (1.0f - kBulkShare[c]) * loop / parts;
      for (int k = 0; k < kInner; ++k) {
        inner_length_[c][k].aim_within(
            static_cast<double>(
                kit::clamp(std::floor(kInnerRatio[c][k] * part + 0.5f), 2.0f, kLoopSize - 8.0f)),
            kLoopFastest);
      }
    }

    // Level: the whole lifted towards the loudness it came in with.
    const float hold = 1.0f / std::sqrt(air_kept(corner) *
                                        (direct * direct + kEarlyPower * early + late * late));
    // Level 0 has the fall whole, Level 1 none of it.
    const float lift = std::pow(hold, level_.value) * std::pow(fall(place), 1.0f - level_.value);
    const float side = side_gain(place, width_.value);
    same_.aim(0.5f * (1.0f + side) * direct * lift);
    cross_.aim(0.5f * (1.0f - side) * direct * lift);
    feed_same_.aim(0.5f * (1.0f + side));
    feed_cross_.aim(0.5f * (1.0f - side));
    // The room's two sides are two loops with nothing in common, so its
    // middle and its sides are as loud as each other until the sides are
    // turned down; what that takes of its power is made up.
    const float narrow = room_side(place, width_.value);
    const float kept = std::sqrt(2.0f / (1.0f + narrow * narrow));
    room_same_.aim(kept * 0.5f * (1.0f + narrow));
    room_cross_.aim(kept * 0.5f * (1.0f - narrow));
    late_.aim(kSendMakeup * late * lift);
    for (int k = 0; k < kTaps; ++k) {
      tap_left_[k].aim(gains[k][0] * lift);
      tap_right_[k].aim(gains[k][1] * lift);
    }
  }

  // The fastest the travel time may change, samples a sample: it never runs
  // backwards.
  static constexpr double kFastest = 0.9;
  // And the fastest a line of the room's loop may change its length.
  static constexpr double kLoopFastest = 0.25;

  kit::DelayLine<kTravelSize> travel_[2];
  kit::DelayLine<kEarlySize> early_;
  kit::DelayLine<kLoopSize> bulk_[2];
  kit::DelayLine<kLoopSize> inner_[2][kInner];
  float loop_past_[2][4] = {};
  kit::AllpassDelay<kDiffuserSize> diffuser_[2][kDiffusers];
  int diffuser_length_[2][kDiffusers] = {};
  kit::OnePole send_cut_[2];
  float air_state_[2][2] = {};

  Glide centre_, half_, doppler_, room_;
  kit::Smoother air_, width_, level_, decay_;
  Ramp air_keep_, same_, cross_, late_;
  Ramp feed_same_, feed_cross_, room_same_, room_cross_, loop_gain_, loop_tilt_;
  Ramp tap_left_[kTaps], tap_right_[kTaps];
  Reach delay_, send_lag_;
  Reach tap_lag_[kTaps];
  Reach bulk_length_[2];
  Reach inner_length_[2][kInner];

  FreePhase walk_[3];
  uint64_t clock_ = 0;
  kit::IdleGate idle_;
  // For meter() only: never read by the sound.
  float position_ = 0.0f;
  float bend_ = 1.0f;
};

}  // namespace livemix
