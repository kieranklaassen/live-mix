#pragma once

// Falling: a grain cloud whose grains bend in pitch while they play. Each
// grain starts at the pitch it was caught at and glides down (or up) by Fall
// over its own length, so a cloud of them sinks like leaves or sighs.
//
//   in ──┬───────────────────────────────────────────────────────────────► dry ─┐
//        └─(+)─► guard ─► ring (10.5 s) ─► grains ─► 30 Hz ─► tone ─► hold ─► limit ─┬─► wet ─┴─► out
//           ▲                                                                        │
//           └────────────────────── Again × room ◄──────────────────────────────────┘
//
// - A grain's read speed is 2^(fall / 12 × bend(phase)) source samples per
//   output sample: 1 when it starts, 2^(fall / 12) when it ends. bend() runs
//   from 0 to 1 over the grain; Curve chooses how. At 0 it is the phase (a
//   straight slide in pitch); towards 1 it is phase^4 (the grain holds its
//   pitch and lets go late); towards -1 the same turned round (it drops at
//   once and settles on where it lands). kit::GrainPool plays at one speed, so
//   the grain is this file's own: it works its speed and its window out every
//   16 samples of its own life and ramps between, which is the same on every
//   block size because the count is the grain's, not the host's.
// - Grains start on a sample counter at Density per second, each interval
//   jittered ±50 % (a cloud must not buzz at its grain rate). A grain copies
//   Fall, Curve, Size, Shape, Vary and its pan when it starts and keeps them,
//   so none of those can click. Spread pans each grain to one side by a
//   random amount that is mostly large, at constant power.
// - Where a grain reads. It starts 10 to 40 ms behind the record head (never
//   two grains on the same samples), further back by up to Scatter² × 2 s,
//   and a rising grain further back again by what it will read beyond the
//   head's own travel, so that no grain reaches the head: the head is the one
//   discontinuity in the ring. A falling grain lags the head more as it
//   slows.
// - Vary gives every grain its own Fall: Fall × (1 - 1.5 × Vary × u), u
//   uniform in 0..1, so at full some barely move and a third go the other way
//   by up to half of Fall.
// - Shape is the grain's window: two raised-cosine halves that meet at the
//   attack share, half the grain at 0 (a bell) down to 4 % at 1 (a quick
//   start and a long fade), never under 3 ms. Its mean square is 3/8 whatever
//   the share, so the level below holds for every Shape.
// - Level: grains are summed with gain 1/√(overlap × 3/8), the gain that keeps
//   the power of a sum of unrelated grains at the source's, capped at 1 so
//   sparse grains play at the source's level. More than 16 at once add CPU,
//   not density: past that the grain rate is held back.
// - Again writes the cloud (after the Tone filter, the hold and the limiter)
//   back into the ring, so a grain can be made of fallen grains and falls
//   further, and darker, each time round. Three things keep that loop in
//   hand, because grains are only unrelated on the average:
//   - Room. Grains that read at the speed the sound was written at are fixed
//     taps of one delay, and such taps come into step at some pitch or other:
//     sixteen of them can give back 3.3 times what they read there, and with
//     Again at its most the cloud then rang for ever (measured: +3 dBFS two
//     minutes after the input had stopped). So the sum of window × gain of the grains
//     within 6 % of that speed (each counted less the further off it is) is
//     worked out every 16 samples, and Again is scaled down so that all of
//     them together, in step, give back no more than 0.95. Grains that are
//     moving in pitch are not counted: what they give back is at another
//     pitch each time round and cannot ring.
//   - Hold. The cloud's level (mean square over 30 ms, both sides) is held to
//     1.5 times (+3.5 dB) the level of what was caught, at its loudest for as
//     long as a grain can still read it and then let go at 3 dB a second.
//     Without it a held chord at Again 0.8 came back 6 to 14 dB over itself,
//     swinging by 15 dB, pinned on the limiter. With Again at 0 the hold does
//     nothing (the cloud's own swell stays under it).
//   - The limiter (linear to ±1, never past ±2) is the last bound, for a
//     full-scale input.
// - Guard: what is recorded is low-passed, six poles, at 18 kHz (3/8 of the
//   sample rate, if that is lower) over the fastest speed a grain can be
//   given now. A grain reads without oversampling, so what it would carry
//   past half the sample rate folds back; the guard takes that away before
//   it is recorded (a partial that would fold to 16 kHz comes back 38 dB
//   down, one that would fold to 8 kHz 49 dB down). The price is that the
//   caught sound is duller the further Fall rises: 4.5 kHz at Fall +24.
// - Silence. The device follows how long nothing above -140 dBFS has been
//   written. Once that is longer than any grain started since it last woke
//   could reach back, the cloud is over: on that sample the grains are let go
//   and what the ring holds is marked as never to be read again. The next
//   sample of sound restarts everything that runs on (the random numbers, the
//   grain counter, the smoothers, the filters and the levels) on that sample,
//   so what follows a silence is the same whatever the block size and whether
//   or not the device slept in between, and a knob moved in the silence is
//   already there.
//
// Storage: the ring, 2^20 stereo frames (8 MB), 10.9 s at 96 kHz of which
// 10.5 s are used; "memoryMb" is 10.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Falling : public kit::DeviceBase<falling::kNumParams> {
 public:
  static constexpr int kMaxGrains = 24;
  // More grains than this at once are not started (see Level above).
  static constexpr float kMaxOverlap = 16.0f;
  // A grain sets its speed and its window again this often, in samples of its own life.
  static constexpr int kGrainTick = 16;
  // Where a grain starts behind the head: at least this, plus up to the
  // jitter, plus up to Scatter² × the scatter time.
  static constexpr float kMinDelaySeconds = 0.01f;
  static constexpr float kJitterSeconds = 0.03f;
  static constexpr float kScatterSeconds = 2.0f;
  // Vary: how much of Fall the most varied grain gives up (1.5: it goes half as far the other way).
  static constexpr float kVaryReach = 1.5f;
  // Shape 1: the share of the grain its attack takes, and the shortest attack.
  static constexpr float kQuickShare = 0.04f;
  static constexpr float kMinAttackSeconds = 0.003f;
  // The mean square of the window, whatever its attack share.
  static constexpr float kWindowPower = 0.375f;
  static constexpr float kBufferSeconds = 10.5f;
  static constexpr float kRumbleHz = 30.0f;
  static constexpr float kToneQ = 0.6f;
  // The guard: six poles, -3 dB at this (or 3/8 of the sample rate, if that
  // is lower) over the fastest speed a grain can be given now.
  static constexpr float kGuardHz = 18000.0f;
  static constexpr float kGuardOfRate = 0.375f;
  // The level hold: the cloud's level and the caught sound's are taken over
  // this long; the cloud is held to this much over the level it caught, which
  // is kept for as long as a grain can still read it and then let go at this
  // many dB a second.
  static constexpr float kLevelSeconds = 0.03f;
  static constexpr float kHoldOver = 1.5f;
  static constexpr float kHoldLetGo = 3.0f;
  // Grains that stand still: one within this of the speed it was caught at
  // counts in full at that speed and not at all past it, and all of them at
  // once, in step, are given back at no more than this.
  static constexpr float kStillWithin = 0.06f;
  static constexpr float kStillMost = 0.95f;
  // For a display (see meter): where the clock goes round, and how much of
  // the newest sound the level is taken from.
  static constexpr float kClockSeconds = 64.0f;
  static constexpr float kMeterSeconds = 0.04f;

  // How far along its bend a grain is at `phase` (0..1) of its life.
  static float bend(float phase, float curve) {
    const float amount = curve < 0.0f ? -curve : curve;
    const float p = curve < 0.0f ? 1.0f - phase : phase;
    const float p2 = p * p;
    const float late = p + amount * (p2 * p2 - p);
    return curve < 0.0f ? 1.0f - late : late;
  }

  // The mean of bend() over the grain.
  static float mean_bend(float curve) {
    const float late = 0.5f - 0.3f * (curve < 0.0f ? -curve : curve);
    return curve < 0.0f ? 1.0f - late : late;
  }

  // The share of a grain its attack takes at a Shape, for a grain so long.
  static float attack_share(float shape, float size_seconds) {
    const float wanted = kit::lerp(0.5f, kQuickShare, shape);
    return kit::clamp(kit::max(wanted, kMinAttackSeconds / size_seconds), 0.0f, 0.5f);
  }

  // A grain's window at `phase` of its life: a raised cosine up over the
  // attack share and another down over the rest.
  static float window(float phase, float attack) {
    if (phase < attack) return 0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * phase / attack);
    return 0.5f + 0.5f * kit::SineTable::cos_lookup(0.5f * (phase - attack) / (1.0f - attack));
  }

  void init(float sample_rate) {
    using namespace falling;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int i = 0; i < kBufferSize; ++i) tape_[i][0] = tape_[i][1] = 0.0f;
    // The head's count starts one buffer up, so no position is ever negative.
    head_ = kBufferSize;
    span_ = static_cast<long long>(kBufferSeconds * sr);
    if (span_ > kBufferSize - 64) span_ = kBufferSize - 64;
    mix_.set_time(kSmoothingSeconds, sr);
    again_.set_time(kSmoothingSeconds, sr);
    tone_hz_.set_time(kSmoothingSeconds, sr);
    guard_hz_.set_time(kSmoothingSeconds, sr);
    level_coeff_ = 1.0f - kit::time_to_coeff(kLevelSeconds, sr);
    room_coeff_ = 1.0f - kit::time_to_coeff(kSmoothingSeconds, sr);
    let_go_ = std::pow(10.0f, -0.1f * kHoldLetGo / sr);
    idle_.reset(sr, 0.05f);
    spawned_ = 0;
    live_ = false;
    until_next_ = 0.0f;
    for (int id = 0; id < kNumParams; ++id) apply(id);
    restart();
    live_ = false;
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for a display to draw the
  // grains: 0, how long the device has run since it last woke, in seconds,
  // going round at 64, and -1 while no cloud is sounding; 1, the level being
  // caught (the highest sample of the newest 40 ms on the ring, read back when
  // it is asked for; every fourth sample is enough for a level); 2, how many
  // grains have started; and for the newest grain (3..6) and the one before
  // it (7..10): when it started, on the clock of reading 0 (-1 for none since
  // the device woke), its own fall in semitones, its length in seconds, and
  // how far behind the head it started, in seconds.
  float meter(int index) const {
    const float sr = sample_rate();
    switch (index) {
      case 0:
        return live_ ? on_clock(head_) : -1.0f;
      case 1: {
        if (!live_) return 0.0f;
        long long count = static_cast<long long>(kMeterSeconds * sr);
        if (count > head_ - valid_from_) count = head_ - valid_from_;
        float high = 0.0f;
        for (long long back = 1; back <= count; back += 4) {
          const float* written = tape_[(head_ - back) & kMask];
          const float left = written[0] < 0.0f ? -written[0] : written[0];
          const float right = written[1] < 0.0f ? -written[1] : written[1];
          high = kit::max(high, kit::max(left, right));
        }
        return high;
      }
      case 2:
        return static_cast<float>(spawned_ & 0xFFFFFF);
      case 3:
      case 7:
        return told(index).at < 0 ? -1.0f : on_clock(told(index).at);
      case 4:
      case 8:
        return told(index).fall;
      case 5:
      case 9:
        return told(index).length;
      case 6:
      case 10:
        return told(index).behind;
      default:
        return 0.0f;
    }
  }

  void process(int frames) {
    using namespace falling;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames) || live_)) {
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      // What is caught: a NaN, an infinity or an absurd sample is not.
      float caught[2];
      bool sound = false;
      for (int c = 0; c < 2; ++c) {
        caught[c] = in[c] > -kCeiling && in[c] < kCeiling ? in[c] : 0.0f;
        // The dry path passes any number through; what is not one is silence.
        if (!(in[c] - in[c] == 0.0f)) in[c] = 0.0f;
        if (caught[c] > kit::IdleGate::kFloor || caught[c] < -kit::IdleGate::kFloor) sound = true;
      }
      if (sound && !live_) restart();

      float cloud[2] = {0.0f, 0.0f};
      if (live_) {
        until_next_ -= 1.0f;
        if (until_next_ <= 0.0f) {
          spawn();
          until_next_ += interval_ * (0.5f + rng_.uniform());
        }
        if (active_ > 0) render(&cloud[0], &cloud[1]);
      }

      const float tone = tone_hz_.next();
      const float guard = guard_hz_.next();
      if (tone != tone_seen_ || guard != guard_seen_) {
        tone_seen_ = tone;
        guard_seen_ = guard;
        for (int c = 0; c < 2; ++c) {
          tone_[c].set(tone, kToneQ, sample_rate());
          for (int k = 0; k < kGuardStages; ++k) guard_[c][k].set(guard, kGuardQ[k], sample_rate());
        }
      }

      // The level hold. What was caught, at its loudest for as long as a
      // grain can still read it; then it is let go.
      caught_level_ += (caught[0] * caught[0] + caught[1] * caught[1] - caught_level_) * level_coeff_;
      if (caught_level_ >= held_level_) {
        held_level_ = caught_level_;
        held_for_ = hold_reach_;
      } else if (held_for_ > 0) {
        --held_for_;
      } else {
        held_level_ = flush_denormal(held_level_ * let_go_);
      }
      float shaped[2];
      for (int c = 0; c < 2; ++c) shaped[c] = tone_[c].lowpass(rumble_[c].highpass(cloud[c]));
      cloud_level_ = flush_denormal(cloud_level_ + (shaped[0] * shaped[0] + shaped[1] * shaped[1] - cloud_level_) * level_coeff_);
      const float most = kHoldOver * kHoldOver * held_level_;
      const float hold = cloud_level_ > most ? std::sqrt(most / cloud_level_) : 1.0f;

      // Grains that stand still add up in step with what they read: all of
      // them together are never given back above kStillMost.
      if (live_ && --until_room_ <= 0) {
        until_room_ = kGrainTick;
        const float still = standing();
        room_to_ = still > kStillMost ? kStillMost / still : 1.0f;
      }
      room_ += (room_to_ - room_) * room_coeff_;

      const float again = again_.next() * room_;
      float wet[2];
      float loudest = 0.0f;
      for (int c = 0; c < 2; ++c) {
        // Linear up to ±1, never past ±2: only a pile-up of grains is held.
        wet[c] = 2.0f * kit::soft_clip(0.5f * hold * shaped[c]);
        float written = caught[c] + again * wet[c];
        for (int k = 0; k < kGuardStages; ++k) written = guard_[c][k].lowpass(written);
        written = flush_denormal(written);
        if (!(written > -kCeiling && written < kCeiling)) written = 0.0f;
        tape_[head_ & kMask][c] = written;
        loudest = kit::max(loudest, written < 0.0f ? -written : written);
      }
      ++head_;
      if (loudest > kit::IdleGate::kFloor) {
        quiet_written_ = 0;
      } else if (live_ && ++quiet_written_ >= hold_reach_) {
        finish();
      }

      const float mix = mix_.next();
      if (mix != mix_seen_) {
        mix_seen_ = mix;
        kit::equal_power(mix, &dry_gain_, &wet_gain_);
      }
      out_left_[i] = in[0] * dry_gain_ + wet[0] * wet_gain_;
      out_right_[i] = in[1] * dry_gain_ + wet[1] * wet_gain_;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kBufferSize = 1 << 20;  // stereo frames; 10.5 s at 96 kHz is 1008000
  static constexpr int kMask = kBufferSize - 1;
  static constexpr float kMargin = 16.0f;   // samples kept clear of the record head
  static constexpr float kCeiling = 8.0f;   // nothing larger is caught or kept
  static constexpr float kSqrtTwo = 1.41421356f;
  // The guard is a Butterworth low-pass of six poles: three stages of these Q.
  static constexpr int kGuardStages = 3;
  static constexpr float kGuardQ[kGuardStages] = {0.51763809f, 0.70710678f, 1.93185165f};

  struct Grain {
    bool active = false;
    double position = 0.0;   // where it reads, in recorded samples
    float rate = 1.0f;       // its speed now, and what it gains per sample
    float rate_step = 0.0f;
    float rate_to = 1.0f;    // its speed at the next tick
    float amp = 0.0f;        // its window (times its gain) now, likewise
    float amp_step = 0.0f;
    float amp_to = 0.0f;
    float gain_left = 0.0f;
    float gain_right = 0.0f;
    float octaves = 0.0f;    // its whole fall
    float curve = 0.0f;
    float attack = 0.5f;     // the share of its life its window rises over
    float gain = 1.0f;
    float per_sample = 0.0f; // phase per sample: 1 / length
    int age = 0;             // samples played
    int length = 0;
    int until_tick = 0;
  };

  // What the display is told of a grain (see meter); nothing that sounds reads it.
  struct Told {
    long long at = -1;       // the head's count when it started; -1 for none
    float fall = 0.0f;
    float length = 0.0f;
    float behind = 0.0f;
  };

  // Readings 3..6 are of the newest grain, 7..10 of the one before it.
  const Told& told(int index) const { return told_[index >= 7 ? 1 : 0]; }

  float on_clock(long long at) const {
    const long long lap = static_cast<long long>(kClockSeconds * sample_rate());
    return static_cast<float>(static_cast<double>((at - epoch_) % lap) / sample_rate());
  }

  // Where the guard is set: what the fastest grain there can be now carries
  // without folding back under 16 kHz.
  float guard_corner() const {
    const float open = kit::min(kGuardHz, kGuardOfRate * sample_rate());
    return open / std::exp2(highest_octaves());
  }

  // How much the grains that stand still give back together, were they all in
  // step: the larger of the two sides' sums of window times gain, each grain
  // counted by how near it is to the speed it was caught at.
  float standing() const {
    float left = 0.0f;
    float right = 0.0f;
    for (const Grain& grain : grains_) {
      if (!grain.active) continue;
      const float off = grain.rate < 1.0f ? 1.0f - grain.rate : grain.rate - 1.0f;
      if (off >= kStillWithin) continue;
      const float counted = grain.amp * (1.0f - off * (1.0f / kStillWithin));
      left += counted * grain.gain_left;
      right += counted * grain.gain_right;
    }
    return kit::max(left, right);
  }

  // The highest fall a grain can be given now, in octaves (0 when none rises).
  float highest_octaves() const {
    using namespace falling;
    const float fall = param(kFall);
    const float other = fall * (1.0f - kVaryReach * param(kVary));
    return kit::max(0.0f, kit::max(fall, other)) * (1.0f / 12.0f);
  }

  // The oldest sound a grain started at these settings can still be reading,
  // in samples behind the head: where it starts at the furthest, and its
  // length again for how far a falling grain drops behind.
  long long reach() const {
    using namespace falling;
    const float sr = sample_rate();
    const float length = param(kSize) * 0.001f * sr;
    const float lead = (std::exp2(highest_octaves()) - 1.0f) * mean_bend(param(kCurve)) * length;
    const float scatter = param(kScatter) * param(kScatter) * kScatterSeconds;
    const float far = lead + length + (kMinDelaySeconds + kJitterSeconds + scatter) * sr + 4.0f * kMargin;
    return static_cast<long long>(kit::min(far, static_cast<float>(span_)));
  }

  // Everything that runs on, back where it starts: init, and the first sample
  // of sound after the cloud has ended.
  void restart() {
    using namespace falling;
    const float sr = sample_rate();
    rng_.seed(0xFA11E4F5u);
    for (Grain& grain : grains_) grain.active = false;
    active_ = 0;
    for (int c = 0; c < 2; ++c) {
      tone_[c].reset();
      for (kit::Svf& stage : guard_[c]) stage.reset();
      rumble_[c].reset();
      rumble_[c].set_cutoff(kRumbleHz, sr);
    }
    caught_level_ = 0.0f;
    held_level_ = 0.0f;
    held_for_ = 0;
    cloud_level_ = 0.0f;
    room_ = 1.0f;
    room_to_ = 1.0f;
    until_room_ = 0;
    mix_.snap(mix_.target);
    again_.snap(again_.target);
    tone_hz_.snap(tone_hz_.target);
    guard_hz_.snap(guard_hz_.target);
    mix_seen_ = -1.0f;
    tone_seen_ = -1.0f;
    guard_seen_ = -1.0f;
    // The first grain as soon as there is sound for it to start on.
    until_next_ = (kMinDelaySeconds + kJitterSeconds) * sr + 2.0f * kMargin;
    valid_from_ = head_;
    epoch_ = head_;
    quiet_written_ = 0;
    hold_reach_ = reach();
    told_[0] = Told();
    told_[1] = Told();
    live_ = true;
  }

  // The cloud is over: nothing a grain could read is above the floor.
  void finish() {
    for (Grain& grain : grains_) grain.active = false;
    active_ = 0;
    valid_from_ = head_;
    live_ = false;
  }

  // Grains per second after the overlap ceiling, and a countdown that follows
  // Density at once instead of finishing a long wait first.
  void schedule() {
    using namespace falling;
    const float seconds = param(kSize) * 0.001f;
    rate_ = kit::min(param(kDensity), kMaxOverlap / seconds);
    interval_ = sample_rate() / rate_;
    if (until_next_ > interval_ * 1.5f) until_next_ = interval_ * 1.5f;
  }

  void apply(int id) {
    using namespace falling;
    const float value = param(id);
    // While no cloud sounds a value has nothing to glide from.
    const bool glide = primed() && live_;
    switch (id) {
      case kMix:
        mix_.set(value, glide);
        break;
      case kAgain:
        again_.set(value, glide);
        break;
      case kTone:
        tone_hz_.set(value, glide);
        break;
      case kSize:
      case kDensity:
        schedule();
        break;
      default:
        break;  // the rest is read when a grain starts
    }
    if (id == kFall || id == kVary) {
      guard_hz_.set(guard_corner(), glide);
    }
    // Grains may now reach further back than any started so far.
    if (id == kFall || id == kVary || id == kCurve || id == kSize || id == kScatter) {
      const long long far = reach();
      if (far > hold_reach_) hold_reach_ = far;
    }
  }

  // Set a grain's ramps to where it will be at its next tick.
  void aim(Grain& grain) {
    int steps = grain.length - grain.age;
    if (steps > kGrainTick) steps = kGrainTick;
    const float phase = static_cast<float>(grain.age + steps) * grain.per_sample;
    grain.rate_to = std::exp2(grain.octaves * bend(phase, grain.curve));
    grain.amp_to = grain.gain * window(kit::min(phase, 1.0f), grain.attack);
    const float per_step = 1.0f / static_cast<float>(steps);
    grain.rate_step = (grain.rate_to - grain.rate) * per_step;
    grain.amp_step = (grain.amp_to - grain.amp) * per_step;
    grain.until_tick = steps;
  }

  void spawn() {
    using namespace falling;
    const float sr = sample_rate();
    // The same draws in the same order whatever the settings.
    const float varied = rng_.uniform();
    const float jitter = rng_.uniform();
    const float scattered = rng_.uniform();
    const float side = rng_.bipolar();
    const float depth = rng_.uniform();

    const float fall = param(kFall) * (1.0f - kVaryReach * param(kVary) * varied);
    const float curve = param(kCurve);
    const float octaves = fall * (1.0f / 12.0f);
    const float size_seconds = param(kSize) * 0.001f;
    float length = size_seconds * sr;

    // A rising grain reads more than the head writes while it plays: at most
    // (2^octaves - 1) × mean bend × length more (the chord of 2^x lies above
    // it), and it starts that much further back. A falling grain drops behind
    // by up to its length. Either way it must stay on the ring.
    const float nearest = kMinDelaySeconds * sr + kMargin;
    const float top = std::exp2(octaves);
    float lead = 0.0f;
    float limit = static_cast<float>(span_) - kMargin - length;
    if (top > 1.0f) {
      limit = static_cast<float>(span_) - kMargin;
      lead = (top - 1.0f) * mean_bend(curve) * length;
      const float room = limit - nearest - kJitterSeconds * sr;
      if (lead > room) {
        length *= room / lead;
        lead = room;
      }
    }
    if (length < 64.0f) return;
    const float scatter = param(kScatter) * param(kScatter) * kScatterSeconds;
    float delay = lead + nearest + (kJitterSeconds * jitter + scatter * scattered) * sr;
    if (delay > limit) delay = limit;
    // Only what was caught since the device woke: a grain that would reach
    // further back takes the oldest there is, or is not started yet.
    const float have = static_cast<float>(head_ - valid_from_);
    if (delay > have) delay = have;
    if (delay < lead + nearest) return;

    for (Grain& grain : grains_) {
      if (grain.active) continue;
      grain.active = true;
      grain.position = static_cast<double>(head_) - static_cast<double>(delay);
      grain.length = static_cast<int>(length);
      grain.per_sample = 1.0f / static_cast<float>(grain.length);
      grain.octaves = octaves;
      grain.curve = curve;
      grain.attack = attack_share(param(kShape), length / sr);
      const float overlap = rate_ * length / sr;
      // √2 undoes the centre attenuation of the pan law: Spread 0 is unity.
      grain.gain = kit::min(1.0f, 1.0f / std::sqrt(overlap * kWindowPower)) * kSqrtTwo;
      // Most grains away from the centre, so Spread 1 is wide and not a smear.
      const float pan = param(kSpread) * (side < 0.0f ? -1.0f : 1.0f) * (1.0f - depth * depth * depth);
      kit::pan_gains(pan, &grain.gain_left, &grain.gain_right);
      grain.age = 0;
      grain.rate = 1.0f;
      grain.amp = 0.0f;
      aim(grain);
      ++active_;
      // For the display only.
      ++spawned_;
      told_[1] = told_[0];
      told_[0].at = head_;
      told_[0].fall = fall;
      told_[0].length = length / sr;
      told_[0].behind = delay / sr;
      return;
    }
  }

  // Add one output frame of every sounding grain.
  void render(float* left, float* right) {
    float sum_left = 0.0f;
    float sum_right = 0.0f;
    for (Grain& grain : grains_) {
      if (!grain.active) continue;
      const long long index = static_cast<long long>(grain.position);
      const float t = static_cast<float>(grain.position - static_cast<double>(index));
      const float* a = tape_[(index - 1) & kMask];
      const float* b = tape_[index & kMask];
      const float* c = tape_[(index + 1) & kMask];
      const float* d = tape_[(index + 2) & kMask];
      sum_left += kit::hermite(a[0], b[0], c[0], d[0], t) * grain.amp * grain.gain_left;
      sum_right += kit::hermite(a[1], b[1], c[1], d[1], t) * grain.amp * grain.gain_right;
      grain.position += static_cast<double>(grain.rate);
      grain.rate += grain.rate_step;
      grain.amp += grain.amp_step;
      ++grain.age;
      if (--grain.until_tick == 0) {
        if (grain.age >= grain.length) {
          grain.active = false;
          --active_;
        } else {
          // Land on the tick's own values: the ramps do not carry rounding on.
          grain.rate = grain.rate_to;
          grain.amp = grain.amp_to;
          aim(grain);
        }
      }
    }
    *left = sum_left;
    *right = sum_right;
  }

  float tape_[kBufferSize][2];
  Grain grains_[kMaxGrains];
  int active_ = 0;
  kit::Rng rng_;
  kit::Svf tone_[2];
  kit::Svf guard_[2][kGuardStages];
  kit::OnePole rumble_[2];
  kit::Smoother mix_, again_, tone_hz_, guard_hz_;
  kit::IdleGate idle_;
  // Gains and filter settings, worked out again only when a control moves.
  float mix_seen_ = -1.0f, dry_gain_ = 1.0f, wet_gain_ = 0.0f;
  float tone_seen_ = -1.0f, guard_seen_ = -1.0f;
  long long head_ = 0;          // samples recorded since init, plus kBufferSize
  long long span_ = 0;          // samples of the ring in use
  long long valid_from_ = 0;    // nothing recorded before this is read
  long long epoch_ = 0;         // the head's count when the device last woke
  long long quiet_written_ = 0; // samples recorded since the last one above the floor
  long long hold_reach_ = 0;    // the furthest back a grain started since waking could read
  // The level hold: mean squares of what is caught and of the cloud (both
  // sides summed), the caught one at its loudest, and how long that is kept.
  float caught_level_ = 0.0f, held_level_ = 0.0f, cloud_level_ = 0.0f;
  long long held_for_ = 0;
  float level_coeff_ = 0.0f, let_go_ = 1.0f;
  // How much of Again the grains that stand still leave, and where it is going.
  float room_ = 1.0f, room_to_ = 1.0f, room_coeff_ = 0.0f;
  int until_room_ = 0;
  float until_next_ = 0.0f;     // samples until the next grain starts
  float interval_ = 48000.0f;
  float rate_ = 1.0f;           // grains per second after the overlap ceiling
  bool live_ = false;           // a cloud is sounding, or sound it could read is on the ring
  // Kept for the display (meter()); nothing that sounds reads them.
  long long spawned_ = 0;
  Told told_[2];
};

}  // namespace livemix
