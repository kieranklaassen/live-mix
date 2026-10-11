#pragma once

// Lift: an upward compressor made for sustained sound. What is quiet (the last
// seconds of a tail, the breath between notes, the room) is carried up towards
// a line; what is louder than the line is left exactly as it is.
//
//   in ─┬─► middle and sides ─► split in three ─► delay (kLatency) ─► × gain per part ─┐
//       │                           │                                     ▲           (+)─► Hear ─► Mix ─► out
//       │                           └─► level of each part ─┐             │            │
//       └─► level of the whole ─────────────────────────────┴─► curve ─► Focus, Sides ─► rise / fall
//                                                                                      │
//       in, kLatency late ─────────────────────────────────────────────────────────────┘
//
// - The curve, in dB, for a level L, Threshold T, Floor F and Amount a:
//     L >= T            lift = 0                      (unity, to the sample)
//     F <= L < T        lift = min(Limit, a (T - L))  (carried a of the way up)
//     L < F             lift = lift(F) (1 - (F - L) / 12), never under 0
//   so the lift is greatest at the Floor and gone 12 dB (kLetGoDb) under it:
//   hiss and silence stay where they are. A Floor above the Threshold leaves
//   nothing between the two and there is no lift at all.
// - Level. Stereo linked: one detector hears the mean power of the two
//   channels, so the image never moves and a sound on one side or in opposite
//   phase reads as it should (one side alone reads 3 dB under its own level).
//   A level is the higher of two readings: the RMS (two 12 ms one-poles in
//   cascade on the power) and the peak power less 9 dB (instant up, 20 ms
//   down). Whatever is steady reads its RMS: a tone's peak reading is 6 dB
//   under it, a chord's and noise's about level with it. On an attack the RMS
//   is tens of ms late and the peak reading is there at once, 6 dB short for
//   a tone. So a new sound is read higher by what it is short: where the peak
//   reading has jumped more than 4 dB (kJumpDb) over its own mean of the last
//   50 ms, the ceilings below add twice the rest of the jump, up to the 6 dB.
//   A tone that starts at the Threshold is read as at it within one tick.
// - Split. The sound is cut in three with two first-order low passes of the
//   input, at 250 Hz and 2.5 kHz: the lows are the first, the middle is the
//   second less the first, the highs are the input less the second. The three
//   add up to the input exactly and equal gains on all three are one gain on
//   the whole: no phase is turned and nothing rings. Each part has a level of
//   its own. The lift of a part is (1 - Split) of what the whole sound's
//   level asks for plus Split of what its own level asks for. With Split at 0
//   this is a plain wide-band upward compressor. Further up a quiet top is
//   lifted under a loud bottom.
// - The whole is bounded. A loud tone's skirts in the other parts are under
//   the Threshold and would be lifted with it, and they add to the tone. So
//   the lifts are held to a budget: what the three add, each (gain - 1) times
//   its part's size, may be no more than would carry the whole to the
//   Threshold plus 0.3 dB (kOverDb), or 0.3 dB over its own level when it is
//   louder than the Threshold. Over the budget all three lifts are scaled
//   back alike. A sound over the Threshold therefore leaves at most 0.3 dB
//   louder at any Split (tones measure 0.26 dB, noise 0.22 dB RMS), and a
//   quiet top under a loud bottom still rises, by as much as fits.
// - Focus scales the lift (in dB) of each part: to the right the lows get
//   (1 - Focus) of it and the middle (1 - Focus / 2), to the left the highs
//   and the middle likewise.
// - Sides. The lift is worked on the middle (left plus right) and the sides
//   (left less right) apart. The sides always take the whole lift; the
//   middle takes (1 - Sides) of it, in dB. At 0 both get the same gain and
//   the image stays where it is; at 1 only the sides rise, so a tail opens
//   outward as it is lifted and a sound with nothing at the sides is left
//   alone. (A sound on one side only then grows an opposite on the other.)
// - Rise and Hold. Each part's lift moves, in dB, with one pole. When the
//   curve asks for less it follows in 20 ms (kFallSeconds): that is sound
//   swelling under the Threshold. When it asks for more the lift first waits:
//   it may only rise once Hold has passed since the sound last got louder
//   (the curve asked for nothing, or for 0.5 dB less than there was). Then
//   it comes in over Rise, the time to cover all but a hundredth of the way.
//   Short Hold fills the gaps between notes; long keeps the lift for real
//   pauses and the ends of tails.
// - The ceiling. A lift is never more than what would carry the level now,
//   read as a new sound is read, all the way to the Threshold (the curve with
//   Amount at 1): one that lingers over that is put down to it at once.
// - Lookahead and the shaper. The sound is delayed by kLatency samples and
//   the levels are read ahead of it. The gain that is applied is not the one
//   asked for but the least asked for in the last kShape ticks, averaged over
//   kShape ticks with a raised cosine. So the gain never steps: it comes down
//   as a raised cosine and is fully down (kShape + 1) ticks = 272 + 16 = 288
//   samples after the tick that asked, which is the tick that first saw the
//   attack: the lift is gone, to the sample, when the attack arrives. It is a
//   sample count at every rate (a manifest's latency is one number): 6.5 ms
//   at 44.1 kHz, 6 ms at 48 kHz, 3 ms at 96 kHz, where the same fade is half
//   as long. Coming back up, the same shaper delays and rounds the Rise.
// - Hear "Lift only" plays the lifted sound less the input: what was added.
// - Wet and dry are the same sound at different gains, so Mix is a linear
//   crossfade against the input delayed by the same kLatency samples. At Mix
//   0 the output is the input kLatency late, sample for sample.
// - Everything from the dB conversion on runs every 16 samples on a control
//   clock and the linear gains are ramped between ticks. Threshold, Amount,
//   Floor, Limit, Split and Focus are smoothed there (20 ms); Mix and Hear per
//   sample (5 ms).
// - After half a second of exact silence going in the device rests: lifts go
//   back to 0 dB, the detectors and the delay are cleared (nothing is
//   sounding, so nothing can click). The half second is counted in samples.
// - Storage: six delay lines of 512 samples (left, right, and the lows and
//   the middle band of the middle and of the sides), 12 KB.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Lift : public kit::DeviceBase<lift::kNumParams> {
 public:
  // The fixed delay, as reported in device.json (latencySamples).
  static constexpr int kLatency = 288;
  static constexpr int kParts = 3;  // lows, middle, highs
  static constexpr float kLowHz = 250.0f;
  static constexpr float kHighHz = 2500.0f;
  static constexpr float kLetGoDb = 12.0f;
  static constexpr float kRmsSeconds = 0.012f;
  // The peak power counts for an eighth: 9 dB under, 6 dB under a tone's RMS.
  static constexpr float kPeakShare = 0.125f;
  static constexpr float kPeakFallSeconds = 0.02f;
  // Rise is the time to cover 99 %: ln(100) time constants.
  static constexpr float kTimeConstants = 4.605170f;
  static constexpr float kRestDb = -120.0f;
  // How fast the lift follows sound that swells under the Threshold: 99 % in 20 ms.
  static constexpr float kFallSeconds = 0.02f;
  // A sound that gets louder by less than this (in lift) does not restart the Hold.
  static constexpr float kHoldSlackDb = 0.5f;
  // The most the parts together may carry the whole past the Threshold, or
  // past its own level when it is louder than that.
  static constexpr float kOverDb = 0.3f;
  // A new sound. The peak reading is 6 dB short of a tone's level, which a
  // steady sound's RMS makes good and a new sound's cannot yet. So where the
  // peak has jumped over its own recent run (a mean over kRunSeconds) the
  // ceilings read it higher: by twice what the jump is over kJumpDb, up to
  // the whole 6 dB (kJumpMostDb), where a tone reads true at once.
  static constexpr float kRunSeconds = 0.05f;
  static constexpr float kJumpDb = 4.0f;
  static constexpr float kJumpMostDb = 6.0f;
  // The shaper: every gain is the least of its last kShape ticks, weighted
  // by a raised cosine of the same length. (kShape + 1) ticks fit in kLatency.
  static constexpr int kShape = 17;

  // The lift in dB the curve asks for at a level, all in dB.
  static float curve(float level, float threshold, float amount, float floor, float limit) {
    if (level >= threshold) return 0.0f;
    const float foot = floor < threshold ? floor : threshold;
    float lift = amount * (threshold - (level > foot ? level : foot));
    if (lift > limit) lift = limit;
    if (level < foot) lift *= 1.0f - (foot - level) * (1.0f / kLetGoDb);
    return lift > 0.0f ? lift : 0.0f;
  }

  // How much of the lift each part takes at a Focus setting.
  static float weight(int part, float focus) {
    if (part == 0) return focus > 0.0f ? 1.0f - focus : 1.0f;
    if (part == 2) return focus < 0.0f ? 1.0f + focus : 1.0f;
    return 1.0f - 0.5f * (focus < 0.0f ? -focus : focus);
  }

  void init(float sample_rate) {
    using namespace lift;
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    tick_rate_ = sr / static_cast<float>(kControlPeriod);
    for (int c = 0; c < 2; ++c) {
      split_low_[c].set_cutoff(kLowHz, sr);
      split_mid_[c].set_cutoff(kHighHz, sr);
    }
    for (Detector& detector : detectors_) {
      detector.mean[0].set_cutoff(1.0f / (kit::kTwoPi * kRmsSeconds), sr);
      detector.mean[1].set_cutoff(1.0f / (kit::kTwoPi * kRmsSeconds), sr);
    }
    heard_.mean[0].set_cutoff(1.0f / (kit::kTwoPi * kRmsSeconds), sr);
    heard_.mean[1].set_cutoff(1.0f / (kit::kTwoPi * kRmsSeconds), sr);
    peak_fall_ = kit::time_to_coeff(kPeakFallSeconds, sr);
    run_coeff_ = kit::time_to_coeff(kRunSeconds, tick_rate_);
    threshold_.set_time(kControlSmoothingSeconds, tick_rate_);
    amount_.set_time(kControlSmoothingSeconds, tick_rate_);
    floor_.set_time(kControlSmoothingSeconds, tick_rate_);
    limit_.set_time(kControlSmoothingSeconds, tick_rate_);
    split_.set_time(kControlSmoothingSeconds, tick_rate_);
    focus_.set_time(kControlSmoothingSeconds, tick_rate_);
    sides_.set_time(kControlSmoothingSeconds, tick_rate_);
    whole_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    fall_coeff_ = time_coeff(kFallSeconds);
    double sum = 0.0;
    for (int j = 0; j < kShape; ++j) {
      const double w = std::sin(3.14159265358979323846 * (j + 0.5) / kShape);
      shape_[j] = static_cast<float>(w * w);
      sum += w * w;
    }
    for (int j = 0; j < kShape; ++j) shape_[j] = static_cast<float>(shape_[j] / sum);
    rest_samples_ = static_cast<int>(kRestSeconds * sr);
    idle_.reset(sr, kRestSeconds);
    rest();
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json: 0, the most lift on any
  // part now, in dB (0 at rest); 1 to 3, the lift on the lows, the middle and
  // the highs; 4, the level of the whole sound as the detector reads it, in
  // dB (kRestDb at rest); 5, the level of what comes out, read the same way
  // (both sides' mean power, after Hear and Mix). The lift is what the sides
  // are given (the middle gets 1 - Sides of it), before Hear and Mix.
  float meter(int index) const {
    if (index == 0) {
      const double most = lift_[0] > lift_[1] ? lift_[0] : lift_[1];
      return static_cast<float>(most > lift_[2] ? most : lift_[2]);
    }
    if (index >= 1 && index <= kParts) return static_cast<float>(lift_[index - 1]);
    if (index == 4) return level_seen_;
    if (index == 5) return out_seen_;
    return 0.0f;
  }

  void process(int frames) {
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      // A sample that is not a number, or far out of any range, is taken as silence.
      if (!(in[0] > -kWild && in[0] < kWild)) in[0] = 0.0f;
      if (!(in[1] > -kWild && in[1] < kWild)) in[1] = 0.0f;
      if (in[0] == 0.0f && in[1] == 0.0f) {
        if (!resting_ && ++silent_ >= rest_samples_) rest();
        if (resting_) {
          out_left_[i] = 0.0f;
          out_right_[i] = 0.0f;
          continue;
        }
      } else {
        silent_ = 0;
        resting_ = false;
      }

      // The middle and the sides, and the three parts of each: they add up to it.
      const float both[2] = {0.5f * (in[0] + in[1]), 0.5f * (in[0] - in[1])};
      float part[2][kParts];
      for (int c = 0; c < 2; ++c) {
        part[c][0] = split_low_[c].lowpass(both[c]);
        const float under = split_mid_[c].lowpass(both[c]);
        part[c][1] = under - part[c][0];
        part[c][2] = both[c] - under;
      }
      // The mean power of left and right is the middle's plus the sides'.
      for (int b = 0; b < kParts; ++b) {
        detectors_[b].hear(part[0][b] * part[0][b] + part[1][b] * part[1][b], peak_fall_);
      }
      detectors_[kParts].hear(both[0] * both[0] + both[1] * both[1], peak_fall_);

      if (clock_.tick()) step_gains();
      for (int c = 0; c < 2; ++c) {
        for (int b = 0; b < kParts; ++b) gain_[c][b] += gain_step_[c][b];
      }

      const float dry[2] = {dry_[0].read(kLatency), dry_[1].read(kLatency)};
      dry_[0].write(in[0]);
      dry_[1].write(in[1]);
      const float late[2] = {0.5f * (dry[0] + dry[1]), 0.5f * (dry[0] - dry[1])};
      // What the lift adds to the middle and to the sides: nothing at all
      // while every gain is one.
      float added[2];
      for (int c = 0; c < 2; ++c) {
        const float low = low_[c].read(kLatency);
        const float mid = mid_[c].read(kLatency);
        low_[c].write(part[c][0]);
        mid_[c].write(part[c][1]);
        added[c] = (gain_[c][2] - 1.0f) * late[c] + (gain_[c][0] - gain_[c][2]) * low +
                   (gain_[c][1] - gain_[c][2]) * mid;
      }
      // Hear: 1 keeps the input in the lifted sound, 0 leaves what was added.
      const float less = whole_.next() - 1.0f;
      const float mix = mix_.next();
      out_left_[i] = dry[0] + mix * (less * dry[0] + added[0] + added[1]);
      out_right_[i] = dry[1] + mix * (less * dry[1] + added[0] - added[1]);
      // For the display alone: what comes out, read as what goes in is read.
      heard_.hear(0.5f * (out_left_[i] * out_left_[i] + out_right_[i] * out_right_[i]), peak_fall_);
    }
    idle_.settle(output_peak(frames), frames);
    // Only when the input was under the gate's floor without being zero.
    if (idle_.asleep() && !resting_) rest();
  }

 private:
  static constexpr int kControlPeriod = 16;
  static constexpr int kLineSize = 512;
  static constexpr float kControlSmoothingSeconds = 0.02f;
  static constexpr float kRestSeconds = 0.5f;
  static constexpr float kFloorPower = 1.0e-12f;  // kRestDb
  // 60 dB over full scale: past it a sample is not sound.
  static constexpr float kWild = 1.0e3f;
  static constexpr int kLongWait = 1 << 30;

  // The level of one part, or of the whole: its mean power and its peak power.
  struct Detector {
    kit::OnePole mean[2];  // in cascade, on the power
    float peak = 0.0f;
    float run = kRestDb;  // the peak's recent run, in dB, moved once a tick

    void reset() {
      mean[0].reset();
      mean[1].reset();
      peak = 0.0f;
      run = kRestDb;
    }
    // Once a tick: how many dB higher the ceilings read this level than
    // power() does, because the sound is new (0 for anything steady).
    float fresh(float run_coeff) {
      const float now = peak > kFloorPower ? 10.0f * std::log10(peak) : kRestDb;
      const float jump = now - run;
      run = now + (run - now) * run_coeff;
      const float more = 2.0f * (jump - kJumpDb);
      return more < 0.0f ? 0.0f : (more > kJumpMostDb ? kJumpMostDb : more);
    }
    void hear(float power, float peak_fall) {
      mean[1].lowpass(mean[0].lowpass(power));
      peak = power > peak ? power : flush_denormal(power + (peak - power) * peak_fall);
    }
    // The RMS, or the peak less 9 dB where that is higher: as a power.
    float power() const {
      return mean[1].state > kPeakShare * peak ? mean[1].state : kPeakShare * peak;
    }
  };

  static float to_db(float power) {
    return power > kFloorPower ? 10.0f * std::log10(power) : kRestDb;
  }

  // One control tick: read the levels, ask the curve, move each part's lift
  // towards what it asks for, hold it under the ceilings, and hand the gains
  // to the shaper.
  void step_gains() {
    const float threshold = threshold_.next();
    const float amount = amount_.next();
    const float floor = floor_.next();
    const float limit = limit_.next();
    const float split = split_.next();
    const float focus = focus_.next();
    const float middle = 1.0f - sides_.next();
    const float whole_power = detectors_[kParts].power();
    level_seen_ = to_db(whole_power);
    out_seen_ = to_db(heard_.power());
    const float together = curve(level_seen_, threshold, amount, floor, limit);
    // The level the ceilings read: no lower, and higher while the sound is new.
    const float whole_fresh = level_seen_ + detectors_[kParts].fresh(run_coeff_);
    const float together_most = curve(whole_fresh, threshold, 1.0f, floor, limit);
    float gain[kParts];
    float size[kParts];
    float asked = 0.0f;
    float sizes = 0.0f;
    for (int b = 0; b < kParts; ++b) {
      const float power = detectors_[b].power();
      const float level = to_db(power);
      const float apart = curve(level, threshold, amount, floor, limit);
      const float apart_most = curve(level + detectors_[b].fresh(run_coeff_), threshold, 1.0f, floor, limit);
      const double target = weight(b, focus) * (together + split * (apart - together));
      // Hold: the lift waits before it rises again, counted from when the
      // sound last asked for no lift at all (it was over the Threshold, or
      // gone) or for clearly less than there was (it got louder).
      if (target <= 0.0 || target < lift_[b] - kHoldSlackDb) waited_[b] = 0;
      if (target < lift_[b]) {
        lift_[b] = target + (lift_[b] - target) * fall_coeff_;
      } else if (waited_[b] >= hold_ticks_) {
        lift_[b] = target + (lift_[b] - target) * rise_coeff_;
      }
      if (waited_[b] < kLongWait) ++waited_[b];
      // The ceiling: what would carry the sound all the way to the Threshold.
      const double ceiling = weight(b, focus) * (together_most + split * (apart_most - together_most));
      if (lift_[b] > ceiling) lift_[b] = ceiling;
      if (lift_[b] < 1.0e-9) lift_[b] = 0.0;
      gain[b] = lift_[b] > 0.0 ? kit::db_to_gain(static_cast<float>(lift_[b])) : 1.0f;
      size[b] = std::sqrt(power);
      asked += (gain[b] - 1.0f) * size[b];
      sizes += size[b];
    }
    // The parts together: their gains, weighed by their sizes, may not pass
    // the gain that carries the whole to the Threshold (one, when it is over
    // it) by more than kOverDb. What is over is taken off every part alike.
    const float room = whole_fresh < threshold ? threshold - whole_fresh : 0.0f;
    const float most = kit::db_to_gain((room < 60.0f ? room : 60.0f) + kOverDb);
    const float allowed = (most - 1.0f) * sizes;
    if (asked > allowed) {
      const float keep = allowed / asked;
      for (int b = 0; b < kParts; ++b) {
        gain[b] = 1.0f + (gain[b] - 1.0f) * keep;
        lift_[b] = kit::gain_to_db(gain[b]);
      }
    }
    // The shaper. Whatever had to come down came down at once above; the
    // gain that is heard is the least of the last kShape ticks, weighted by a
    // raised cosine, so it is down in full (kShape + 1) ticks after the tick
    // that asked, which is inside kLatency, and it never steps.
    at_ = (at_ + 1) % kShape;
    for (int b = 0; b < kParts; ++b) {
      // The sides take the whole lift, the middle what Sides leaves it.
      const float lift = static_cast<float>(lift_[b]);
      const float to[2] = {lift * middle > 0.0f ? kit::db_to_gain(lift * middle) : 1.0f, gain[b]};
      for (int c = 0; c < 2; ++c) {
        asked_[c][b][at_] = to[c];
        float least = to[c];
        for (int j = 0; j < kShape; ++j) {
          if (asked_[c][b][j] < least) least = asked_[c][b][j];
        }
        least_[c][b][at_] = least;
        float shaped = 0.0f;
        int from = at_;
        for (int j = 0; j < kShape; ++j) {
          shaped += shape_[j] * least_[c][b][from];
          from = from == 0 ? kShape - 1 : from - 1;
        }
        // Rounding in the weights must not leave a gain of one a hair off it.
        if (least == 1.0f && shaped > 0.999999f && shaped < 1.000001f) shaped = 1.0f;
        // Land on the last tick's value exactly, then ramp to this one.
        gain_[c][b] = gain_target_[c][b];
        gain_target_[c][b] = shaped;
        gain_step_[c][b] = (shaped - gain_[c][b]) * (1.0f / static_cast<float>(kControlPeriod));
      }
    }
  }

  // Nothing is sounding: forget the lift and let pending values land.
  void rest() {
    for (int c = 0; c < 2; ++c) {
      split_low_[c].reset();
      split_mid_[c].reset();
      dry_[c].clear();
      low_[c].clear();
      mid_[c].clear();
      for (int b = 0; b < kParts; ++b) {
        gain_[c][b] = 1.0f;
        gain_target_[c][b] = 1.0f;
        gain_step_[c][b] = 0.0f;
      }
    }
    for (Detector& detector : detectors_) detector.reset();
    heard_.reset();
    out_seen_ = kRestDb;
    for (int b = 0; b < kParts; ++b) {
      lift_[b] = 0.0;
      waited_[b] = kLongWait;  // the silence was the wait
      for (int c = 0; c < 2; ++c) {
        for (int j = 0; j < kShape; ++j) {
          asked_[c][b][j] = 1.0f;
          least_[c][b][j] = 1.0f;
        }
      }
    }
    at_ = 0;
    level_seen_ = kRestDb;
    clock_.reset(kControlPeriod);
    threshold_.snap(threshold_.target);
    amount_.snap(amount_.target);
    floor_.snap(floor_.target);
    limit_.snap(limit_.target);
    split_.snap(split_.target);
    focus_.snap(focus_.target);
    sides_.snap(sides_.target);
    whole_.snap(whole_.target);
    mix_.snap(mix_.target);
    silent_ = 0;
    resting_ = true;
  }

  double time_coeff(float seconds) const {
    return std::exp(-static_cast<double>(kTimeConstants) /
                    (static_cast<double>(seconds) * static_cast<double>(tick_rate_)));
  }

  void apply(int id) {
    using namespace lift;
    const float value = param(id);
    // At rest there is nothing to glide under, so values snap.
    const bool glide = primed() && !resting_;
    switch (id) {
      case kThreshold:
        threshold_.set(value, glide);
        break;
      case kAmount:
        amount_.set(value, glide);
        break;
      case kFloor:
        floor_.set(value, glide);
        break;
      case kRise:
        rise_coeff_ = time_coeff(value);
        break;
      case kHold:
        hold_ticks_ = static_cast<int>(value * tick_rate_ + 0.5f);
        break;
      case kSplit:
        split_.set(value, glide);
        break;
      case kFocus:
        focus_.set(value, glide);
        break;
      case kSides:
        sides_.set(value, glide);
        break;
      case kLimit:
        limit_.set(value, glide);
        break;
      case kHear:
        whole_.set(value < 0.5f ? 1.0f : 0.0f, glide);
        break;
      case kMix:
        mix_.set(value, glide);
        break;
      default:
        break;
    }
  }

  kit::DelayLine<kLineSize> dry_[2];             // left and right
  kit::DelayLine<kLineSize> low_[2], mid_[2];    // of the middle [0] and of the sides [1]
  kit::OnePole split_low_[2], split_mid_[2];     // likewise
  Detector detectors_[kParts + 1];  // lows, middle band, highs, the whole
  Detector heard_;                  // what comes out, for meter() only
  kit::Smoother threshold_, amount_, floor_, limit_, split_, focus_, sides_;  // read once a tick
  kit::Smoother whole_, mix_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float tick_rate_ = 3000.0f;
  float peak_fall_ = 0.0f;
  float run_coeff_ = 0.0f;
  double rise_coeff_ = 0.0;
  double fall_coeff_ = 0.0;
  int hold_ticks_ = 0;
  // Ticks since each part's sound last got louder; it stops counting at kLongWait.
  int waited_[kParts] = {kLongWait, kLongWait, kLongWait};
  // The shaper: the gains asked for over the last kShape ticks, the least of
  // them at each tick, and the raised cosine they are weighted by.
  float asked_[2][kParts][kShape] = {};
  float least_[2][kParts][kShape] = {};
  float shape_[kShape] = {};
  int at_ = 0;
  // dB, 0 or above. Doubles: at the slowest Rise one tick moves a lift by
  // less than a float can add to 20 dB, and it would stop short.
  double lift_[kParts] = {0.0, 0.0, 0.0};
  // The gain of each part of the middle [0] and of the sides [1].
  float gain_[2][kParts] = {{1.0f, 1.0f, 1.0f}, {1.0f, 1.0f, 1.0f}};
  float gain_target_[2][kParts] = {{1.0f, 1.0f, 1.0f}, {1.0f, 1.0f, 1.0f}};
  float gain_step_[2][kParts] = {{0.0f, 0.0f, 0.0f}, {0.0f, 0.0f, 0.0f}};
  float level_seen_ = kRestDb;  // for meter() only
  float out_seen_ = kRestDb;    // likewise
  int rest_samples_ = 24000;
  int silent_ = 0;  // input samples of exact zero in a row
  bool resting_ = true;
};

}  // namespace livemix
