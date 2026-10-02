#pragma once

// Analog Delay: a companded bucket-brigade delay, one line per channel.
//
//   in ─(+)─► low-pass ─► compress 2:1 ─► line (saturates, hisses) ─► low-pass
//        ▲                                                               │
//        └──── feedback ◄──── low cut ◄──── expand 1:2 ◄─────────────────┘──► wet
//
// - The line holds a fixed 4096 samples and its clock sets the delay
//   (bbd_line.h), so Time is a clock rate: what is in the line changes pitch
//   with the clock for one line length, and the bandwidth is half the clock.
//   The two fourth-order low-passes sit at Tone, or lower when the clock
//   requires it, which is why long times are dark.
// - The compander (compander.h) rounds attacks and makes the hiss breathe.
// - Mod Depth wobbles the clock by up to 3 % with a sine and a slow drift.
//   An echo's pitch is the clock now over the clock when it was written, so
//   its vibrato is 2 x deviation x sin(pi x rate x time).
// - The step sequence moves the clock between the base rate and two
//   interval ratios: base, A, base, B, one slot every Step repeats. A step
//   up plays the line higher by the interval until it has emptied, and the
//   step back plays what the faster clock wrote lower by the same interval.
// - Spread runs the right line's wobble out of phase with the left's (half
//   a cycle at 1) and gives it its own drift. At 0 the two lines are one.
// - Age lowers the line's headroom, raises its noise, lets the clock bleed
//   through at long times and pulls the two rectifiers' speeds apart.

#include "../../kit/kit.h"
#include "bbd_line.h"
#include "compander.h"
#include "params.gen.h"

namespace livemix {

class AnalogDelay : public kit::DeviceBase<analog_delay::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace analog_delay;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int c = 0; c < 2; ++c) {
      Channel& ch = channel_[c];
      ch.line.reset(kNoiseSeed);
      for (kit::Svf& f : ch.in_filter) f.reset();
      for (kit::Svf& f : ch.out_filter) f.reset();
      ch.compressor.reset();
      ch.expander.reset();
      ch.low_cut.reset();
      ch.low_cut.set_cutoff(kLowCutHz, sr);
      ch.wet = 0.0f;
    }
    clock_.set_time(kClockLagSeconds, sr);
    feedback_.set_time(kSmoothingSeconds, sr);
    depth_.set_time(kSmoothingSeconds, sr);
    age_.set_time(kSmoothingSeconds, sr);
    spread_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    lfo_phase_ = 0.0f;
    mix_applied_ = -1.0f;
    step_gain_ = 1.0f;
    step_target_ = 1.0f;
    step_slot_ = 0;
    step_elapsed_ = 0.0f;
    whine_ = 0.0f;
    drift_value_[0] = 0.0f;
    drift_value_[1] = 0.0f;
    drift_[0].seed(0x3C6EF372u);
    drift_[1].seed(0xA54FF53Au);
    drift_[0].set_rate(kDriftHz, sr);
    drift_[1].set_rate(kDriftHz * 1.13f, sr);
    activity_.reset();
    activity_.set(0.001f, 0.2f, sr);
    control_clock_.reset(kControlPeriod);
    tone_coeff_ = 1.0f - kit::time_to_coeff(0.02f, sr / static_cast<float>(kControlPeriod));
    // The longest silent gap is the longest delay an octave down.
    idle_.reset(sr, 2.0f * kParamMax[kTime] * 0.001f + 0.6f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    using namespace analog_delay;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    float wet_peak = 0.0f;
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);

      // The clock: the Time knob's rate, times the sequenced step. The step
      // moves at the Glide rate (at once when Glide is zero).
      advance_steps();
      step_gain_ = step_target_ + (step_gain_ - step_target_) * glide_coeff_;
      const float clock = clock_.next() * step_gain_;
      if (control_clock_.tick()) update_control(clock);

      const float depth = depth_.next();
      const float spread = spread_.next();
      const float age = age_.next();
      const float feedback = feedback_.next();
      const float headroom = 1.0f - kHeadroomLoss * age;

      lfo_phase_ += lfo_increment_;
      if (lfo_phase_ >= 1.0f) lfo_phase_ -= 1.0f;
      const float drift_left = drift_value_[0];
      const float drift_right = kit::lerp(drift_left, drift_value_[1], spread);
      const float wobble = kMaxClockDeviation * depth * depth;
      const float wander = kDriftShare * wobble + kDriftFloor * spread;
      float ticks[2];
      ticks[0] = clock * (1.0f + wobble * kit::SineTable::lookup(lfo_phase_) + wander * drift_left);
      ticks[1] = clock * (1.0f + wobble * kit::SineTable::lookup(lfo_phase_ + 0.5f * spread) +
                          wander * drift_right);

      const float back[2] = {channel_[0].wet, channel_[1].wet};
      const float level = activity_.process(kit::max(std::fabs(in[0] + feedback * back[0]),
                                                     std::fabs(in[1] + feedback * back[1])));
      const float gate = kit::clamp((level - kGateFloor) * kGateSlope, 0.0f, 1.0f);
      const float noise = noise_level_ * gate;
      const float bleed = whine_ * gate;

      // The pan law costs a sine and a cosine: only while Mix is moving.
      const float mix = mix_.next();
      if (mix != mix_applied_) {
        mix_applied_ = mix;
        kit::equal_power(mix, &dry_gain_, &wet_gain_);
      }
      for (int c = 0; c < 2; ++c) {
        Channel& ch = channel_[c];
        float x = in[c] + feedback * back[c];
        x = ch.in_filter[1].lowpass(ch.in_filter[0].lowpass(x));
        x = ch.compressor.process(x);
        float y = ch.line.process(x, ticks[c], headroom, noise);
        // Clock bleed: a trace of the clock itself, heard as a faint whistle
        // once a long Time brings the clock down into the audible range.
        if (bleed > 0.0f) y += bleed * kit::SineTable::lookup(ch.line.phase());
        y = ch.out_filter[1].lowpass(ch.out_filter[0].lowpass(y));
        y = ch.expander.process(y);
        y = ch.low_cut.highpass(y);
        // Linear to ±1, never past ±2: only a runaway loop reaches the knee.
        ch.wet = flush_denormal(2.0f * kit::soft_clip(0.5f * y));
        wet_peak = kit::max(wet_peak, std::fabs(ch.wet));
      }
      out_left_[i] = in[0] * dry_gain_ + channel_[0].wet * wet_gain_;
      out_right_[i] = in[1] * dry_gain_ + channel_[1].wet * wet_gain_;
    }
    // The echoes keep the device awake even when Mix hides them, so a line
    // that is still ringing is never frozen and replayed later.
    idle_.settle(kit::max(output_peak(frames), wet_peak), frames);
  }

 private:
  static constexpr uint32_t kNoiseSeed = 0x6A09E667u;
  static constexpr int kControlPeriod = 16;
  // The clock oscillator follows the Time knob with this lag.
  static constexpr float kClockLagSeconds = 0.02f;
  // Corners of the input and output filters as a share of the clock rate,
  // when Tone is above them. The input one sits lower: what it lets past
  // half the clock rate folds back as tones that belong to no harmonic.
  static constexpr float kInputShare = 0.36f;
  static constexpr float kOutputShare = 0.42f;
  // Coupling capacitors: each pass round the loop loses a little bass.
  static constexpr float kLowCutHz = 45.0f;
  // Time constant of the compander's rectifiers when the circuit is new.
  static constexpr float kRectifierSeconds = 0.010f;
  // Mod Depth 1 moves the clock by this share either way.
  static constexpr float kMaxClockDeviation = 0.03f;
  // The clock also wanders slowly: by this share of the wobble, plus a
  // little of its own per channel as Spread opens.
  static constexpr float kDriftHz = 0.23f;
  static constexpr float kDriftShare = 0.3f;
  static constexpr float kDriftFloor = 0.0012f;
  // The line's headroom is 1 when new (a full-scale sine reaches half of it
  // after the compressor) and falls by this much at Age 1.
  static constexpr float kHeadroomLoss = 0.6f;
  // The line's hiss is switched off under -100 dBFS so the device can sleep.
  static constexpr float kGateFloor = 1.0e-5f;
  static constexpr float kGateSlope = 1.0e4f;
  // Peak of the noise each stage adds, against a headroom of 1: about 80 dB
  // under it when new, 50 dB when worn.
  static constexpr float kNoiseNew = 0.0001f;
  static constexpr float kNoiseWorn = 0.004f;
  // Glide 1: the clock covers 63 % of a step in this time.
  static constexpr float kMaxGlideSeconds = 0.7f;
  // Clock bleed into the line's output at Age 1, and the clock rates between
  // which it fades in (none above the first, all of it below the second).
  static constexpr float kWhineLevel = 0.05f;
  static constexpr float kWhineAboveHz = 9000.0f;
  static constexpr float kWhineFullHz = 5000.0f;
  // Clock rate for each interval choice: what is already in the line plays
  // back at this ratio when the clock steps to it (Off, octave, fifth and
  // fourth down, fourth, fifth and octave up).
  static constexpr float kIntervalClock[7] = {1.0f,        0.5f,        2.0f / 3.0f, 0.75f,
                                              4.0f / 3.0f, 1.5f,        2.0f};
  // Butterworth, fourth order, as two sections.
  static constexpr float kSectionQ[2] = {0.5411961f, 1.3065630f};

  struct Channel {
    analog_delay::BbdLine line;
    kit::Svf in_filter[2];
    kit::Svf out_filter[2];
    analog_delay::Compressor compressor;
    analog_delay::Expander expander;
    kit::OnePole low_cut;
    float wet = 0.0f;
  };

  // Control-rate work: the filters follow Tone and the clock.
  void update_control(float clock) {
    using namespace analog_delay;
    const float sr = sample_rate();
    const float rate = clock * sr;
    // Tone glides to its setting (20 ms) so a turned knob does not step the
    // filters.
    tone_ += (param(kTone) - tone_) * tone_coeff_;
    const float in_corner = kit::min(tone_, kInputShare * rate);
    const float out_corner = kit::min(tone_, kOutputShare * rate);
    const float age = age_.value;
    // The drift moves so slowly that a value every few samples is a smooth
    // curve; a step in clock rate is not a step in the signal.
    drift_value_[0] = drift_[0].next(kControlPeriod);
    drift_value_[1] = drift_[1].next(kControlPeriod);
    for (int c = 0; c < 2; ++c) {
      Channel& ch = channel_[c];
      for (int s = 0; s < 2; ++s) {
        ch.in_filter[s].set(in_corner, kSectionQ[s], sr);
        ch.out_filter[s].set(out_corner, kSectionQ[s], sr);
      }
      ch.compressor.rectifier.set_time(kRectifierSeconds * (1.0f - 0.3f * age), sr);
      ch.expander.rectifier.set_time(kRectifierSeconds * (1.0f + 1.5f * age), sr);
    }
    noise_level_ = kNoiseNew + kNoiseWorn * age * age;
    whine_ = kWhineLevel * age * age *
             kit::clamp((kWhineAboveHz - rate) / (kWhineAboveHz - kWhineFullHz), 0.0f, 1.0f);
  }

  // The step sequence: base, Interval A, base, Interval B, one slot every
  // Step repeats of the base time. It runs freely whenever an interval is on.
  int choice(int id) const { return kit::clamp_int(static_cast<int>(param(id) + 0.5f), 0, 6); }
  bool stepping() const {
    return choice(analog_delay::kIntervalA) != 0 || choice(analog_delay::kIntervalB) != 0;
  }
  // Clock rate of a slot relative to the base clock. An interval that is off
  // hands its slot to the other one.
  float slot_gain(int slot) const {
    using namespace analog_delay;
    if ((slot & 1) == 0) return 1.0f;
    const int a = choice(kIntervalA);
    const int b = choice(kIntervalB);
    const int first = slot == 1 ? a : b;
    return kIntervalClock[first != 0 ? first : (slot == 1 ? b : a)];
  }
  void advance_steps() {
    if (!stepping()) return;
    step_elapsed_ += 1.0f;
    if (step_elapsed_ >= step_length_ * step_repeats_) {
      step_elapsed_ = 0.0f;
      step_slot_ = (step_slot_ + 1) & 3;
      step_target_ = slot_gain(step_slot_);
    }
  }

  // Clock ticks per host sample that give a delay of `seconds` end to end.
  float ticks_for(float seconds) const {
    using namespace analog_delay;
    const float sr = sample_rate();
    const float rate = static_cast<float>(BbdLine::kSamples) / seconds;
    const float in_corner = kit::min(param(kTone), kInputShare * rate);
    const float out_corner = kit::min(param(kTone), kOutputShare * rate);
    // What the rest of the path adds: the low-frequency delay of the two
    // fourth-order low-passes and the half sample of the box integral.
    const float extra =
        2.6131f / kit::kTwoPi * (1.0f / in_corner + 1.0f / out_corner) + 0.5f / sr;
    const float line = kit::max(seconds - extra, 0.25f * seconds);
    return (static_cast<float>(BbdLine::kSamples) + 0.5f) / (line * sr);
  }

  void apply(int id) {
    using namespace analog_delay;
    const float value = param(id);
    switch (id) {
      case kTime:
      case kTone:
        if (!primed()) tone_ = param(kTone);
        clock_.set(ticks_for(param(kTime) * 0.001f), primed());
        step_length_ = param(kTime) * 0.001f * sample_rate();
        break;
      case kIntervalA:
      case kIntervalB:
        if (!stepping()) {
          // Both off: rest on the base clock and start the next sequence
          // from its first step.
          step_slot_ = 0;
          step_elapsed_ = 0.0f;
        }
        step_target_ = slot_gain(step_slot_);
        break;
      case kStep:
        step_repeats_ = static_cast<float>(1 << kit::clamp_int(static_cast<int>(value + 0.5f), 0, 3));
        break;
      case kGlide:
        // Up to 0.7 s to cover 63 % of the way, on a square-law knob.
        glide_coeff_ = kit::time_to_coeff(kMaxGlideSeconds * value * value, sample_rate());
        break;
      case kFeedback:
        feedback_.set(value, primed());
        break;
      case kModDepth:
        depth_.set(value, primed());
        break;
      case kModRate:
        lfo_increment_ = value / sample_rate();
        break;
      case kAge:
        age_.set(value, primed());
        break;
      case kSpread:
        spread_.set(value, primed());
        break;
      case kMix:
        mix_.set(value, primed());
        break;
      default:
        break;
    }
  }

  Channel channel_[2];
  kit::Smoother clock_, feedback_, depth_, age_, spread_, mix_;
  kit::Drift drift_[2];
  kit::Follower activity_;
  kit::ControlClock control_clock_;
  kit::IdleGate idle_;
  float drift_value_[2] = {0.0f, 0.0f};
  float lfo_phase_ = 0.0f;
  float lfo_increment_ = 0.0f;
  float noise_level_ = 0.0f;
  float mix_applied_ = -1.0f;
  float dry_gain_ = 1.0f;
  float wet_gain_ = 0.0f;
  float tone_ = 3200.0f;
  float tone_coeff_ = 1.0f;
  float whine_ = 0.0f;
  float step_gain_ = 1.0f;
  float step_target_ = 1.0f;
  float step_length_ = 1.0f;
  float step_repeats_ = 2.0f;
  float step_elapsed_ = 0.0f;
  float glide_coeff_ = 0.0f;
  int step_slot_ = 0;
};

}  // namespace livemix
