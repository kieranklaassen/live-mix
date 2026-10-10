#pragma once

// Pulses: two soft gates on one pattern, the second a little faster, so the
// two patterns slide against each other and come back together.
//
//   clock ─► first gate  ─► pattern ─► pulse ─► slew ─► a ─┐
//     └─(× 1 + drift, + Shift)─► second gate ─► ... ─► b ─┤
//                                                          ▼
//   left  hears  e = a·(1 + Apart)/2 + b·(1 − Apart)/2     (right: a and b swapped)
//
//   in ─┬──────────────► × (1 − d) ─┐
//       └─► low pass ──► × d ───────┴─► × g ─► mix ─► out
//           g = floor + (1 − floor)·e        d = Shade·(1 − e)
//
// - The pattern is Fill steps out of Steps, spread as evenly as they go: step
//   i sounds when (i·Fill) mod Steps < Fill. Step 0 always sounds, and it is
//   the one Accent leaves at full while it turns the others down.
// - A pulse lasts Length of its step. It rises and falls on half a cosine;
//   Edge sets how much of the pulse those two take, from all of it (a swell)
//   down to kMinEdgeSeconds each (a chop).
// - The second gate runs at Rate × (1 + drift), where drift is kMaxDrift ×
//   Drift³: nothing at zero, an eighth at full. So it gains one whole pattern
//   on the first every 1 / drift repeats, and the two are together again.
//   With Drift at zero it is the first gate, Shift steps ahead, exactly: what
//   it had gained is dropped.
// - Nothing here is louder than what comes in. A gate only turns down, and
//   the low pass is one pole, so the darkened part never overshoots.
// - Wet and dry are the same signal at different gains, so Mix is a linear
//   crossfade; at Mix 0 the output is the input, sample for sample.
// - The clocks never stop and are never set by the sound: through a silence,
//   asleep or awake, they run on by the same count of samples. What is
//   smoothed (the knobs, the slew) is put where it is going when sound comes
//   back after kArriveSeconds of exact silence, which is a moment that does
//   not depend on the block size the way falling asleep does.
// - The slew is a limit on how fast a gate may move, a quarter steeper than
//   the steepest edge, so it leaves every pulse as it is and turns what would
//   be a jump (Steps, Fill or Shift changed in the middle of a pulse, Drift
//   brought to zero) into a ramp of under a millisecond.
//
// Storage: no delay line. Two low-pass states, two slew states, seven
// smoothers and two clocks; the device fits in the default 4 MB.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Pulses : public kit::DeviceBase<pulses::kNumParams> {
 public:
  // How much faster the second gate runs with Drift at full.
  static constexpr float kMaxDrift = 0.125f;
  // The shortest rise and fall of a pulse, at the hardest Edge.
  static constexpr float kMinEdgeSeconds = 0.002f;
  // How far the slew's limit stands above the steepest edge's own slope.
  static constexpr float kSlewHeadroom = 1.25f;
  // What Accent at full takes off every step but the first.
  static constexpr float kAccentDrop = 0.7f;
  // The corner of the low pass Shade fades to.
  static constexpr float kShadeHz = 400.0f;
  // How long the input has to be exact silence before sound counts as new.
  static constexpr float kArriveSeconds = 0.1f;

  // The part of Rate the second gate adds for a Drift setting.
  static float drift_fraction(float drift) { return kMaxDrift * drift * drift * drift; }

  // Whether step `index` of the pattern sounds.
  static bool sounds(int index, int fill, int steps) { return (index * fill) % steps < fill; }

  // One pulse over its step: `along` is 0 at the step's start and 1 at its
  // end, `ramp` the length of the rise and of the fall in the same measure.
  static float pulse_shape(float along, float length, float ramp) {
    if (along >= length) return 0.0f;
    const float half = 0.5f * length;
    const float from_end = along < half ? along : length - along;
    if (from_end >= ramp) return 1.0f;
    return 0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * from_end / ramp);
  }

  void init(float sample_rate) {
    using namespace pulses;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int c = 0; c < 2; ++c) {
      shade_filter_[c].reset();
      shade_filter_[c].set_cutoff(kShadeHz, sr);
      gate_[c] = 0.0f;
    }
    for (kit::Smoother& smoother : smooth_) smoother.set_time(kSmoothingSeconds, sr);
    slew_step_ = kSlewHeadroom * (0.5f * kit::kPi / kMinEdgeSeconds) / sr;
    place_ = 0.0;
    lead_ = 0.0;
    arrive_after_ = static_cast<long>(kArriveSeconds * sr);
    silent_ = arrive_after_;
    // One whole block more than the silence that counts as new sound, so the
    // device is never asleep before that silence is over.
    idle_.reset(sr, kArriveSeconds + static_cast<float>(kMaxBlockFrames + 1) / sr);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for a display to draw:
  // 0, where the first gate is in its pattern (0 at the first step, 1 at the
  // end of the last); 1, how much of a whole pattern the second gate has
  // gained on the first since they were last together (Shift apart).
  float meter(int index) const {
    if (index == 0) return static_cast<float>(place_ / steps_);
    if (index == 1) return static_cast<float>(lead_ / steps_);
    return 0.0f;
  }

  void process(int frames) {
    using namespace pulses;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      run_clocks(frames);
      if (silent_ < arrive_after_) silent_ += frames;
      silence_output(frames);
      return;
    }
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      if (in[0] == 0.0f && in[1] == 0.0f) {
        if (silent_ < arrive_after_) ++silent_;
      } else {
        if (silent_ >= arrive_after_) arrive();
        silent_ = 0;
      }

      const float length = smooth_[kLengthNow].next();
      const float edge = smooth_[kEdgeNow].next();
      const float others = smooth_[kOthersNow].next();
      const double second = second_place();
      const float raw[2] = {pulse(place_, length, edge, least_ramp_[0], others),
                            pulse(second, length, edge, least_ramp_[1], others)};
      for (int k = 0; k < 2; ++k) {
        const float move = raw[k] - gate_[k];
        gate_[k] += move > slew_step_ ? slew_step_ : (move < -slew_step_ ? -slew_step_ : move);
      }
      run_clocks(1);

      const float same = 0.5f + 0.5f * smooth_[kApartNow].next();
      const float open[2] = {same * gate_[0] + (1.0f - same) * gate_[1],
                             same * gate_[1] + (1.0f - same) * gate_[0]};
      const float floor = smooth_[kFloorNow].next();
      const float shade = smooth_[kShadeNow].next();
      const float mix = smooth_[kMixNow].next();
      float out[2];
      for (int c = 0; c < 2; ++c) {
        float low = shade_filter_[c].lowpass(in[c]);
        // A sample that is not a number, or far outside any sound, must not
        // stay in the filter after it has passed.
        if (!(low > -kSane && low < kSane)) {
          shade_filter_[c].reset();
          low = 0.0f;
        }
        const float gain = floor + (1.0f - floor) * open[c];
        const float dull = shade * (1.0f - open[c]);
        const float wet = gain * (in[c] + dull * (low - in[c]));
        out[c] = in[c] + mix * (wet - in[c]);
      }
      out_left_[i] = out[0];
      out_right_[i] = out[1];
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr float kSane = 1.0e6f;

  // Where the second gate is in its pattern: the first gate's place, Shift
  // steps on, and what it has gained.
  double second_place() const {
    double place = place_ + static_cast<double>(shift_) + lead_;
    while (place >= steps_) place -= steps_;
    return place;
  }

  // One gate before the slew: 0 between pulses, up to 1 (the first step) or
  // `others` (the rest) on a pulse.
  float pulse(double place, float length, float edge, float least_ramp, float others) const {
    int index = static_cast<int>(place);
    if (index >= step_count_) index = step_count_ - 1;
    if (!sounds(index, fill_, step_count_)) return 0.0f;
    const float along = static_cast<float>(place - static_cast<double>(index));
    const float half = 0.5f * length;
    float ramp = (1.0f - edge) * half;
    if (ramp < least_ramp) ramp = least_ramp;
    if (ramp > half) ramp = half;
    return (index == 0 ? 1.0f : others) * pulse_shape(along, length, ramp);
  }

  // Both clocks on by `frames` samples; the same sum whether it is taken a
  // sample at a time or a block at a time.
  void run_clocks(int frames) {
    place_ += step_per_sample_ * frames;
    if (place_ >= steps_) place_ = std::fmod(place_, steps_);
    if (lead_per_sample_ > 0.0) {
      lead_ += lead_per_sample_ * frames;
      if (lead_ >= steps_) lead_ = std::fmod(lead_, steps_);
    }
  }

  // Sound after a silence: nothing is sounding, so every knob moved in the
  // silence has arrived and the gates stand where their patterns put them.
  // (The low pass needs nothing: its state fell under the denormal threshold
  // and was flushed to zero a few milliseconds into the silence.)
  void arrive() {
    for (kit::Smoother& smoother : smooth_) smoother.snap(smoother.target);
    const float length = smooth_[kLengthNow].value;
    const float edge = smooth_[kEdgeNow].value;
    const float others = smooth_[kOthersNow].value;
    gate_[0] = pulse(place_, length, edge, least_ramp_[0], others);
    gate_[1] = pulse(second_place(), length, edge, least_ramp_[1], others);
  }

  static int whole(float value) { return static_cast<int>(value + 0.5f); }

  void apply(int id) {
    using namespace pulses;
    const float value = param(id);
    switch (id) {
      case kRate:
      case kDrift: {
        const float rate = param(kRate);
        const float drift = drift_fraction(param(kDrift));
        step_per_sample_ = static_cast<double>(rate) / sample_rate();
        lead_per_sample_ = step_per_sample_ * drift;
        // With no drift the second gate is the first, Shift ahead, exactly.
        if (!(drift > 0.0f)) lead_ = 0.0;
        least_ramp_[0] = kMinEdgeSeconds * rate;
        least_ramp_[1] = kMinEdgeSeconds * rate * (1.0f + drift);
        break;
      }
      case kSteps:
      case kFill:
      case kShift:
        step_count_ = kit::clamp_int(whole(param(kSteps)), 2, 16);
        steps_ = static_cast<double>(step_count_);
        fill_ = kit::clamp_int(whole(param(kFill)), 1, step_count_);
        shift_ = whole(param(kShift)) % step_count_;
        if (place_ >= steps_) place_ = std::fmod(place_, steps_);
        if (lead_ >= steps_) lead_ = std::fmod(lead_, steps_);
        break;
      case kEdge:
        smooth_[kEdgeNow].set(value, primed());
        break;
      case kLength:
        smooth_[kLengthNow].set(value, primed());
        break;
      case kFloor:
        // Half way is -12 dB, a quarter -24 dB.
        smooth_[kFloorNow].set(value * value, primed());
        break;
      case kShade:
        smooth_[kShadeNow].set(value, primed());
        break;
      case kApart:
        smooth_[kApartNow].set(value, primed());
        break;
      case kAccent:
        smooth_[kOthersNow].set(1.0f - kAccentDrop * value, primed());
        break;
      case kMix:
        smooth_[kMixNow].set(value, primed());
        break;
      default:
        break;
    }
  }

  kit::OnePole shade_filter_[2];
  // The smoothed knobs: Floor as the gain it leaves, Accent as the level of
  // every step but the first.
  enum Smoothed : int {
    kEdgeNow = 0,
    kLengthNow,
    kFloorNow,
    kShadeNow,
    kApartNow,
    kOthersNow,
    kMixNow,
    kNumSmoothed
  };
  kit::Smoother smooth_[kNumSmoothed];
  kit::IdleGate idle_;
  // The first gate's place in its pattern and what the second has gained on
  // it, both in steps, 0 up to Steps.
  double place_ = 0.0;
  double lead_ = 0.0;
  double step_per_sample_ = 0.0;
  double lead_per_sample_ = 0.0;
  double steps_ = 8.0;
  int step_count_ = 8;
  int fill_ = 5;
  int shift_ = 0;
  // The two gates after the slew.
  float gate_[2] = {0.0f, 0.0f};
  float slew_step_ = 0.0f;
  // The shortest rise of each gate, as a part of its own step.
  float least_ramp_[2] = {0.0f, 0.0f};
  // Samples of exact silence at the input, up to arrive_after_.
  long silent_ = 0;
  long arrive_after_ = 0;
};

}  // namespace livemix
