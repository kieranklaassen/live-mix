#pragma once

// Lift: an upward compressor made for sustained sound. What is quiet (the last
// seconds of a tail, the breath between notes, the room) is carried up towards
// a line; what is louder than the line is left exactly as it is.
//
//   in ─┬─► split ─► lows, middle, highs ─► delay (kLatency) ─► × gain per part ─┐
//       │      │                                                    ▲           (+)─► Hear ─► Mix ─► out
//       │      └─► level of each part ─┐                            │            │
//       └─► level of the whole ────────┴─► curve ─► Focus ─► rise / fall         └── in, kLatency late
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
//   phase reads as it should. A level is the higher of two readings: the RMS
//   (two 12 ms one-poles in cascade on the power) and the peak power less
//   9 dB (instant up, 20 ms down). Whatever is steady reads its RMS: a tone's
//   peak reading is 6 dB under it, a chord's and noise's about level with it.
//   On an attack the RMS is tens of ms late and the peak reading is there at
//   once, 6 dB short for a tone: a new sound 6 dB or more over the Threshold
//   is read as over it within one control tick, which is what lets the lift
//   get out of its way in time. One nearer the Threshold keeps up to
//   Amount x 6 dB of lift for the 20 ms the RMS takes to arrive.
// - Split. The sound is cut in three with two first-order low passes of the
//   input, at 250 Hz and 2.5 kHz: the lows are the first, the middle is the
//   second less the first, the highs are the input less the second. The three
//   add up to the input exactly and equal gains on all three are one gain on
//   the whole: no phase is turned and nothing rings. Each part has a level of
//   its own. The lift of a part is (1 - Split) of what the whole sound's
//   level asks for plus Split of what its own level asks for. With Split at 0
//   this is a plain wide-band upward compressor. Further up a quiet top is
//   lifted under a loud bottom. A loud tone's skirt in the other parts is
//   then under the Threshold too and is lifted with it; every skirt is a
//   quarter turn from the tone, so this can only add to it, never cancel:
//   by under 0.1 dB at the defaults, and by up to 2.6 dB for a low tone
//   6 dB over the Threshold with Split, Amount and Limit all the way up (the
//   harness measures both).
// - Focus scales the lift (in dB) of each part: to the right the lows get
//   (1 - Focus) of it and the middle (1 - Focus / 2), to the left the highs
//   and the middle likewise.
// - Rise and Fall move each part's lift, in dB, with one pole each: Rise when
//   the curve asks for more, Fall when it asks for less. Both are the time to
//   cover all but a hundredth of the way (4.6 time constants).
// - Lookahead. The sound is delayed by kLatency samples (6 ms at 48 kHz) and
//   the levels are read ahead of it, so at the default Fall (3 ms) the lift
//   is gone before an attack arrives: a tick to see it, a tick to ramp, and
//   the fall. It is a sample count: at 96 kHz the lookahead is 3 ms and a
//   fiftieth of the lift (in dB) is still there when the attack lands.
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
// - Storage: six delay lines of 512 samples (the input and two of its parts,
//   per channel), 12 KB.

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
  // Rise and Fall are times to cover 99 %: ln(100) time constants.
  static constexpr float kTimeConstants = 4.605170f;
  static constexpr float kRestDb = -120.0f;

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
    peak_fall_ = kit::time_to_coeff(kPeakFallSeconds, sr);
    threshold_.set_time(kControlSmoothingSeconds, tick_rate_);
    amount_.set_time(kControlSmoothingSeconds, tick_rate_);
    floor_.set_time(kControlSmoothingSeconds, tick_rate_);
    limit_.set_time(kControlSmoothingSeconds, tick_rate_);
    split_.set_time(kControlSmoothingSeconds, tick_rate_);
    focus_.set_time(kControlSmoothingSeconds, tick_rate_);
    whole_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
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
  // dB (kRestDb at rest). The lift is what the gain stage is given, before
  // Hear and Mix.
  float meter(int index) const {
    if (index == 0) {
      const double most = lift_[0] > lift_[1] ? lift_[0] : lift_[1];
      return static_cast<float>(most > lift_[2] ? most : lift_[2]);
    }
    if (index >= 1 && index <= kParts) return static_cast<float>(lift_[index - 1]);
    if (index == 4) return level_seen_;
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

      // The three parts of each channel: they add up to the input.
      float part[2][kParts];
      for (int c = 0; c < 2; ++c) {
        part[c][0] = split_low_[c].lowpass(in[c]);
        const float under = split_mid_[c].lowpass(in[c]);
        part[c][1] = under - part[c][0];
        part[c][2] = in[c] - under;
      }
      for (int b = 0; b < kParts; ++b) {
        detectors_[b].hear(0.5f * (part[0][b] * part[0][b] + part[1][b] * part[1][b]), peak_fall_);
      }
      detectors_[kParts].hear(0.5f * (in[0] * in[0] + in[1] * in[1]), peak_fall_);

      if (clock_.tick()) step_gains();
      for (int b = 0; b < kParts; ++b) gain_[b] += gain_step_[b];

      // Hear: 1 keeps the input in the lifted sound, 0 leaves what was added.
      const float whole = whole_.next();
      const float mix = mix_.next();
      const float out_gain = gain_[2];
      const float low_gain = gain_[0] - gain_[2];
      const float mid_gain = gain_[1] - gain_[2];
      float out[2];
      for (int c = 0; c < 2; ++c) {
        const float dry = line_[c][0].read(kLatency);
        const float low = line_[c][1].read(kLatency);
        const float mid = line_[c][2].read(kLatency);
        line_[c][0].write(in[c]);
        line_[c][1].write(part[c][0]);
        line_[c][2].write(part[c][1]);
        const float lifted = out_gain * dry + low_gain * low + mid_gain * mid;
        const float wet = lifted - (1.0f - whole) * dry;
        out[c] = dry + mix * (wet - dry);
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];
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

  // The level of one part, or of the whole: its mean power and its peak power.
  struct Detector {
    kit::OnePole mean[2];  // in cascade, on the power
    float peak = 0.0f;

    void reset() {
      mean[0].reset();
      mean[1].reset();
      peak = 0.0f;
    }
    void hear(float power, float peak_fall) {
      mean[1].lowpass(mean[0].lowpass(power));
      peak = power > peak ? power : flush_denormal(power + (peak - power) * peak_fall);
    }
    // In dB: the RMS, or the peak less 9 dB where that is higher.
    float level() const {
      const float power = mean[1].state > kPeakShare * peak ? mean[1].state : kPeakShare * peak;
      return power > kFloorPower ? 10.0f * std::log10(power) : kRestDb;
    }
  };

  // One control tick: read the levels, ask the curve, move each part's lift
  // towards what it asks for, and aim the gain ramps at the result.
  void step_gains() {
    const float threshold = threshold_.next();
    const float amount = amount_.next();
    const float floor = floor_.next();
    const float limit = limit_.next();
    const float split = split_.next();
    const float focus = focus_.next();
    level_seen_ = detectors_[kParts].level();
    const float together = curve(level_seen_, threshold, amount, floor, limit);
    for (int b = 0; b < kParts; ++b) {
      const float apart = curve(detectors_[b].level(), threshold, amount, floor, limit);
      const double target = weight(b, focus) * (together + split * (apart - together));
      const double coeff = target < lift_[b] ? fall_coeff_ : rise_coeff_;
      lift_[b] = target + (lift_[b] - target) * coeff;
      if (lift_[b] < 1.0e-9) lift_[b] = 0.0;
      // Land on the last tick's value exactly, then ramp to this one.
      gain_[b] = gain_target_[b];
      gain_target_[b] = lift_[b] > 0.0 ? kit::db_to_gain(static_cast<float>(lift_[b])) : 1.0f;
      gain_step_[b] = (gain_target_[b] - gain_[b]) * (1.0f / static_cast<float>(kControlPeriod));
    }
  }

  // Nothing is sounding: forget the lift and let pending values land.
  void rest() {
    for (int c = 0; c < 2; ++c) {
      split_low_[c].reset();
      split_mid_[c].reset();
      for (int line = 0; line < kParts; ++line) line_[c][line].clear();
    }
    for (Detector& detector : detectors_) detector.reset();
    for (int b = 0; b < kParts; ++b) {
      lift_[b] = 0.0;
      gain_[b] = 1.0f;
      gain_target_[b] = 1.0f;
      gain_step_[b] = 0.0f;
    }
    level_seen_ = kRestDb;
    clock_.reset(kControlPeriod);
    threshold_.snap(threshold_.target);
    amount_.snap(amount_.target);
    floor_.snap(floor_.target);
    limit_.snap(limit_.target);
    split_.snap(split_.target);
    focus_.snap(focus_.target);
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
      case kFall:
        fall_coeff_ = time_coeff(value * 0.001f);
        break;
      case kSplit:
        split_.set(value, glide);
        break;
      case kFocus:
        focus_.set(value, glide);
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

  kit::DelayLine<kLineSize> line_[2][kParts];  // per channel: the input, its lows, its middle
  kit::OnePole split_low_[2], split_mid_[2];
  Detector detectors_[kParts + 1];  // lows, middle, highs, the whole
  kit::Smoother threshold_, amount_, floor_, limit_, split_, focus_;  // read once a tick
  kit::Smoother whole_, mix_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float tick_rate_ = 3000.0f;
  float peak_fall_ = 0.0f;
  double rise_coeff_ = 0.0;
  double fall_coeff_ = 0.0;
  // dB, 0 or above. Doubles: at the slowest Rise one tick moves a lift by
  // less than a float can add to 20 dB, and it would stop short.
  double lift_[kParts] = {0.0, 0.0, 0.0};
  float gain_[kParts] = {1.0f, 1.0f, 1.0f};
  float gain_target_[kParts] = {1.0f, 1.0f, 1.0f};
  float gain_step_[kParts] = {0.0f, 0.0f, 0.0f};
  float level_seen_ = kRestDb;  // for meter() only
  int rest_samples_ = 24000;
  int silent_ = 0;  // input samples of exact zero in a row
  bool resting_ = true;
};

}  // namespace livemix
