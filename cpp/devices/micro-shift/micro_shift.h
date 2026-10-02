#pragma once

// Micro Shift: one copy of the sound a few cents sharp on the left, one a few
// cents flat on the right, each a few milliseconds late. The studio way of
// making a single source wide and thick without the sweep of a chorus: the
// detune is static, so nothing cycles.
//
//   in L ─┬─ low-pass (Focus) ─────────────────────────────────────┐ fills the dry
//         │                                                         │ lows back in
//   L + R ┼─ high-pass (Focus) ─(+)─► shifter UP ─► tone ─┬─► pan ──┼─┐
//         │                      ▲                        │         │ ├─ mix ─► out L
//         │                      └─ limit ◄─ smear ◄─ fb ─┘         │ │
//         └─────────────────────────────────────────────────────────┴─┘ dry
//   out R: the same from in R, with shifter DOWN at 1.4 times the delay.
//   Both shifters read the mono sum, so every source gets a sharp copy on
//   the left and a flat one on the right wherever it sits in the input.
//
//   out = dry · cos(mix) + low-passed dry · (1 − cos(mix)) + wet · sin(mix)
//
// - The shifters are SpliceShifter.h: a single read head that drifts at the
//   detune ratio and is spliced back, in time with the waveform and away from
//   attacks, every few seconds. A held note comes back as a steady note at
//   the new pitch, not a tremolo.
// - Delay is where each head lives; the head sweeps a few milliseconds either
//   side of it as it drifts. The right side sits 1.4 times as far back as
//   the left so the two never comb alike.
// - Focus splits the sound: only what is above it is shifted, and the dry
//   sound below it is kept at full level whatever Mix says (the second term
//   above), so the bass stays where it was, in the centre and in phase.
// - Drift wanders each side's detune (up to ±8 cents) and delay (up to
//   ±1.5 ms) on its own slow, seeded, sine-sum curve.
// - Feedback sends each side back into its own shifter, so every pass is
//   detuned again: the left spirals up, the right down. Two short allpasses
//   in that path smear each pass a little more, so the repeats of an attack
//   blur into a wash rather than a flutter; the first copy is never smeared.
//   The loop is linear up to 0 dBFS and lands on ±2 above it.
// - Mix is equal power: the copies differ from the dry sound in time and in
//   pitch, so they add in power, not in amplitude.

#include "../../kit/kit.h"
#include "SpliceShifter.h"
#include "params.gen.h"

namespace livemix {

class MicroShift : public kit::DeviceBase<micro_shift::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace micro_shift;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    control_period_ = kit::clamp_int(static_cast<int>(sr / 3000.0f + 0.5f), 8, 64);
    clock_.reset(control_period_);
    const float control_rate = sr / static_cast<float>(control_period_);
    for (int c = 0; c < 2; ++c) {
      shifter_[c].prepare(sr);
      low_[c].reset();
      diffuser_a_[c].clear();
      diffuser_b_[c].clear();
      diffusion_a_[c] =
          kit::clamp_int(static_cast<int>(kDiffusionSeconds[c][0] * sr), 1, kDiffuserSize - 1);
      diffusion_b_[c] =
          kit::clamp_int(static_cast<int>(kDiffusionSeconds[c][1] * sr), 1, kDiffuserSize - 1);
      tone_filter_[c].reset();
      last_wet_[c] = 0.0f;
      for (int k = 0; k < 3; ++k) {
        hold_fast_[c][k] = 0.0f;
        for (float& stage : hold_slow_[c][k]) stage = 0.0f;
      }
      hold_gain_[c].set_time(kHoldGlideSeconds, sr);
      hold_gain_[c].snap(1.0f);
      increment_[c].set_time(kDetuneGlideSeconds, sr);
      wander_[c].set_time(kSmoothingSeconds, sr);
      detune_drift_[c].seed(c == 0 ? 0x3C6EF372u : 0xA54FF53Au);
      delay_drift_[c].seed(c == 0 ? 0x510E527Fu : 0x9B05688Cu);
    }
    high_a_.reset();
    high_b_.reset();
    feedback_.set_time(kSmoothingSeconds, sr);
    width_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    // Filter corners glide in pitch on the control clock.
    focus_.set_time(0.02f, control_rate);
    tone_.set_time(0.02f, control_rate);
    drift_.set_time(0.05f, control_rate);
    filters_focus_ = -1.0f;
    filters_tone_ = -1.0f;
    // The longest silent gap is the longest head position, under 100 ms.
    hold_coeff_ = kit::time_to_coeff(kHoldFastSeconds, sr);
    hold_control_coeff_ = kit::time_to_coeff(kHoldSeconds, control_rate);
    idle_.reset(sr, 0.3f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
    control(true);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    using namespace micro_shift;
    if (!primed()) control(true);  // parameters set since init() snap
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    float wet_peak = 0.0f;
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      // A non-finite or absurd sample would stay in the feedback loop for good.
      for (float& sample : in) {
        if (!(sample > -64.0f && sample < 64.0f)) sample = 0.0f;
      }

      if (clock_.tick()) control(false);

      const float feedback = feedback_.next();
      // Both copies are made from the mono sum, so every source gets one of
      // each wherever it sits in the input's stereo field.
      const float high = high_b_.highpass(high_a_.highpass(0.5f * (in[0] + in[1])));
      float wet[2];
      float low[2];
      for (int c = 0; c < 2; ++c) {
        low[c] = low_[c].lowpass(in[c]);
        // What goes round again is smeared a little more on every pass, so
        // the repeats of an attack melt into a wash instead of a flutter.
        float back = last_wet_[c];
        back = diffuser_a_[c].process(back, diffusion_a_[c], kDiffusionGain);
        back = diffuser_b_[c].process(back, diffusion_b_[c], kDiffusionGain);
        shifter_[c].write(flush_denormal(high + loop_limit(feedback * back)));
        const float shifted = shifter_[c].read(increment_[c].next(), wander_[c].next());
        wet[c] = tone_filter_[c].lowpass(shifted);
        last_wet_[c] = wet[c];
        const float magnitude = wet[c] < 0.0f ? -wet[c] : wet[c];
        if (magnitude > wet_peak) wet_peak = magnitude;
      }

      // Width: the sharp copy pans left, the flat copy right, equal power.
      // An eighth of a turn is the centre.
      const float turn = 0.125f * (1.0f - width_.next());
      const float near = kit::SineTable::cos_lookup(turn);
      const float far = kit::SineTable::lookup(turn);
      const float wet_left = wet[0] * near + wet[1] * far;
      const float wet_right = wet[1] * near + wet[0] * far;

      const float quarter = 0.25f * mix_.next();
      const float dry_gain = kit::SineTable::cos_lookup(quarter);
      const float wet_gain = kit::SineTable::lookup(quarter);
      const float fill = 1.0f - dry_gain;
      const float copies[2] = {wet_left * wet_gain, wet_right * wet_gain};
      float out[2];
      for (int c = 0; c < 2; ++c) {
        const float dry = in[c] * dry_gain + low[c] * fill;
        const float copy = copies[c];
        // Level hold: follow how much the copy is adding to or cancelling the
        // dry sound on this side right now.
        track(hold_fast_[c][0], dry * copy, hold_coeff_);
        track(hold_fast_[c][1], copy * copy, hold_coeff_);
        track(hold_fast_[c][2], dry * dry, hold_coeff_);
        out[c] = dry + copy * hold_gain_[c].next();
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];
    }
    // The wet path counts too: at Mix 0 the loop still rings out of earshot.
    idle_.settle(kit::max(output_peak(frames), wet_peak), frames);
  }

  // For the harness: the shifters themselves.
  const micro_shift_parts::SpliceShifter& shifter(int side) const { return shifter_[side & 1]; }

 private:
  // The right side's delay as a multiple of the left's.
  static constexpr float kRightDelayRatio = 1.4f;
  // What Drift at full adds: ± this many cents and milliseconds per side.
  static constexpr float kDriftCents = 8.0f;
  static constexpr float kDriftDelayMs = 1.5f;
  // Detune changes glide for 20 ms so a knob turn bends rather than steps.
  static constexpr float kDetuneGlideSeconds = 0.02f;
#ifndef HOLD_SECONDS
#define HOLD_SECONDS 0.009f
#endif
#ifndef HOLD_LOW
#define HOLD_LOW 0.63f
#endif
#ifndef HOLD_HIGH
#define HOLD_HIGH 1.41f
#endif
  static constexpr int kHoldStages = 3;
  static constexpr float kHoldFastSeconds = 0.003f;
  static constexpr float kHoldSeconds = HOLD_SECONDS;
  #ifndef HOLD_GLIDE
#define HOLD_GLIDE 0.003f
#endif
#ifndef HOLD_W1
#define HOLD_W1 0.1f
#endif
#ifndef HOLD_W2
#define HOLD_W2 0.3f
#endif
  static constexpr float kHoldGlideSeconds = HOLD_GLIDE;
  static constexpr float kHoldLow = HOLD_LOW;
  static constexpr float kHoldHigh = HOLD_HIGH;
  // The wet high-pass sits a little under the dry low-pass so the two meet
  // level at the Focus frequency (they add in power).
  static constexpr float kWetCornerRatio = 0.85f;
  // Fourth-order Butterworth as two second-order sections.
  static constexpr float kButterworthQ1 = 0.54119610f;
  static constexpr float kButterworthQ2 = 1.30656296f;

  // Two allpasses per side in the feedback path only (the first copy is
  // never smeared), with lengths that share no factor between the sides.
  static constexpr int kDiffuserSize = 1024;
  static constexpr float kDiffusionGain = 0.5f;
  static constexpr float kDiffusionSeconds[2][2] = {{0.00311f, 0.00523f}, {0.00397f, 0.00641f}};

  static void track(float& average, float value, float coeff) {
    average = flush_denormal(value + (average - value) * coeff);
  }

  static float smooth_step(float t) {
    t = kit::clamp(t, 0.0f, 1.0f);
    return t * t * (3.0f - 2.0f * t);
  }

  // Level hold: the gain for the copy on side `c`. The dry sound and the copy
  // add up to more or less than their two levels put together as their
  // partials drift in and out of step. When the whole side would swell past
  // kHoldHigh of that, the copy is turned down until it does not; when the
  // whole side would sag under kHoldLow of it and the dry sound alone is
  // louder than the two together, the copy steps back and lets the dry sound
  // through. Single partials still beat; the whole does not sag.
  float hold_target(int c, bool snap) {
    for (int k = 0; k < 3; ++k) {
      float value = hold_fast_[c][k];
      for (int stage = 0; stage < kHoldStages; ++stage) {
        track(hold_slow_[c][k][stage], value, snap ? 0.0f : hold_control_coeff_);
        value = hold_slow_[c][k][stage];
      }
    }
    const float cross = hold_slow_[c][0][kHoldStages - 1];
    const float copy = hold_slow_[c][1][kHoldStages - 1];
    const float dry = hold_slow_[c][2][kHoldStages - 1];
    if (copy < 1.0e-12f) return 1.0f;
    const float apart = dry + copy;
    const float together = apart + 2.0f * cross;
    if (cross >= 0.0f) {
      const float ceiling = kHoldHigh * apart;
      if (together <= ceiling) return 1.0f;
      // dry + gain^2 * copy + 2 * gain * cross = ceiling
      return (std::sqrt(cross * cross + copy * (ceiling - dry)) - cross) / copy;
    }
    const float sagging = (kHoldLow * apart - together) / (HOLD_W1 * apart);
    const float better_alone = (dry - together) / (HOLD_W2 * copy);
#ifndef HOLD_TURN
#define HOLD_TURN 0.0f
#endif
    const float ratio = -cross / copy;
    const float turned = -HOLD_TURN * (std::sqrt(ratio * ratio + 1.0f) - ratio);
    return 1.0f + (turned - 1.0f) * smooth_step(sagging) * smooth_step(better_alone);
  }

  // Linear up to ±1, a smooth knee to ±2.
  static float loop_limit(float x) { return 2.0f * kit::soft_clip(0.5f * x); }

  // Control-rate work: filter corners, drift curves, pitch ratios, splices.
  void control(bool snap) {
    using namespace micro_shift;
    const float sr = sample_rate();

    if (snap) {
      focus_.snap(focus_.target);
      tone_.snap(tone_.target);
      drift_.snap(drift_.target);
    }
    // Corners move as pitch (the smoothers hold log2 of the frequency).
    const float focus = focus_.next();
    if (focus != filters_focus_) {
      filters_focus_ = focus;
      const float hz = std::exp2(focus);
      for (int c = 0; c < 2; ++c) low_[c].set(hz, kit::kSqrtHalf, sr);
      high_a_.set(hz * kWetCornerRatio, kButterworthQ1, sr);
      high_b_.set(hz * kWetCornerRatio, kButterworthQ2, sr);
    }
    const float tone = tone_.next();
    if (tone != filters_tone_) {
      filters_tone_ = tone;
      const float hz = std::exp2(tone);
      for (int c = 0; c < 2; ++c) tone_filter_[c].set(hz, kit::kSqrtHalf, sr);
    }

    for (int c = 0; c < 2; ++c) hold_gain_[c].set(hold_target(c, snap), !snap);

    const float drift = drift_.next();
    const float detune = param(kDetune);
    for (int c = 0; c < 2; ++c) {
      // Faster curves as Drift rises: 0.1 Hz barely moves, 0.4 Hz sways.
      detune_drift_[c].set_rate((c == 0 ? 0.11f : 0.13f) + 0.3f * drift, sr);
      delay_drift_[c].set_rate((c == 0 ? 0.07f : 0.083f) + 0.15f * drift, sr);
      const float pitch_wander = detune_drift_[c].next(snap ? 0 : control_period_);
      const float delay_wander = delay_drift_[c].next(snap ? 0 : control_period_);

      const float cents = (c == 0 ? detune : -detune) + kDriftCents * drift * pitch_wander;
      const float increment = 1.0f - kit::cents_to_ratio(cents);
      increment_[c].set(increment, !snap);

      // The shifter keeps room under its lowest head position for this.
      wander_[c].set(drift * kDriftDelayMs * delay_wander * 0.001f * sr, !snap);

      if (snap) {
        shifter_[c].snap_to_landing(static_cast<double>(increment));
      } else {
        shifter_[c].tick(control_period_);
      }
    }
  }

  void apply(int id) {
    using namespace micro_shift;
    const bool ramp = primed() && !idle_.asleep();
    const float value = param(id);
    switch (id) {
      case kDelay:
        for (int c = 0; c < 2; ++c) {
          const float ms = value * (c == 0 ? 1.0f : kRightDelayRatio);
          shifter_[c].set_centre(ms * 0.001f * sample_rate(), !ramp);
        }
        break;
      case kDrift:
        drift_.set(value, ramp);
        break;
      case kFeedback:
        feedback_.set(value, ramp);
        break;
      case kFocus:
        focus_.set(std::log2(value), ramp);
        break;
      case kTone:
        tone_.set(std::log2(value), ramp);
        break;
      case kWidth:
        width_.set(value, ramp);
        break;
      case kMix:
        mix_.set(value, ramp);
        break;
      default:
        break;  // Detune is read on the control clock
    }
  }

  micro_shift_parts::SpliceShifter shifter_[2];
  kit::Svf low_[2];
  kit::AllpassDelay<kDiffuserSize> diffuser_a_[2];
  kit::AllpassDelay<kDiffuserSize> diffuser_b_[2];
  int diffusion_a_[2] = {149, 190};
  int diffusion_b_[2] = {251, 307};
  kit::Svf high_a_;
  kit::Svf high_b_;
  kit::Svf tone_filter_[2];
  kit::Smoother increment_[2];
  kit::Smoother wander_[2];
  kit::Smoother feedback_, width_, mix_;
  kit::Smoother focus_, tone_, drift_;
  kit::Drift detune_drift_[2];
  kit::Drift delay_drift_[2];
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float last_wet_[2] = {0.0f, 0.0f};
  // Level hold, per side: dry*copy, copy*copy and dry*dry, averaged per
  // sample and then kHoldStages more times on the control clock.
  float hold_fast_[2][3] = {};
  float hold_slow_[2][3][kHoldStages] = {};
  float hold_coeff_ = 0.0f;
  float hold_control_coeff_ = 0.0f;
  kit::Smoother hold_gain_[2];
  float filters_focus_ = -1.0f;
  float filters_tone_ = -1.0f;
  int control_period_ = 16;
};

}  // namespace livemix
