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
//       └─► low pass ──► × d ───────┴─► × g ─► × make-up ─► mix ─► out
//           g = Floor² + (1 − Floor²)·e        d = Shade·(1 − e)
//
// - The pattern is Fill steps out of Steps, spread as evenly as they go: step
//   i sounds when (i·Fill) mod Steps < Fill. Step 0 always sounds, and it is
//   the one Accent leaves at full while it turns the others down.
// - A pulse lasts Length of its step. It rises and falls on half a cosine;
//   Edge sets how much of the pulse those two take, from all of it (a swell)
//   down to kMinEdgeSeconds each (a chop). Five milliseconds is the shortest:
//   at two, a chopped 55 Hz note carried its sidebands 20 dB higher between
//   500 Hz and 2 kHz, where a low note has nothing of its own to cover them.
// - The second gate runs at Rate × (1 + drift), where drift is kMaxDrift ×
//   Drift³: nothing at zero, an eighth at full. So it gains one whole pattern
//   on the first every 1 / drift repeats, and the two are together again.
//   With Drift at zero it is the first gate, Shift steps ahead, exactly: what
//   it had gained is dropped.
// - A gate only turns down, so the pulsed sound is made up: by what its gain
//   loses over a long time as a root mean square (worked out from Steps, Fill,
//   Length, Edge, Floor, Accent and Apart, see mean_square), and by no more
//   than kMaxMakeup. A steady sound comes out as loud as it went in wherever
//   the gates take less than that away, and no sample is ever more than
//   kMaxMakeup over the loudest that came in. The low pass is one pole, so the
//   darkened part never overshoots.
// - Wet and dry are the same signal at different gains, so Mix is a linear
//   crossfade; at Mix 0 the output is the input, sample for sample.
// - The clocks never stop and are never set by the sound: through a silence,
//   asleep or awake, they run on sample by sample, by the very same sums. What
//   is smoothed (the knobs, the make-up, the slew) is put where it is going
//   when sound comes back after kArriveSeconds of exact silence, which is a
//   moment that does not depend on the block size the way falling asleep does.
// - The slew is a limit on how fast a gate may move: a quarter steeper than
//   the edge the pulse has now. It leaves every pulse as it is and turns what
//   would be a jump (Steps, Fill or Shift changed in the middle of a pulse,
//   Drift brought to zero) into one more edge like the pulse's own: a swell
//   where the pulses swell, a chop where they chop.
//
// Storage: no delay line. Two low-pass states, two slew states, eight
// smoothers and two clocks; the device fits in the default 4 MB.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Pulses : public kit::DeviceBase<pulses::kNumParams> {
 public:
  // How much faster the second gate runs with Drift at full.
  static constexpr float kMaxDrift = 0.125f;
  // The shortest rise and fall of a pulse, at the hardest Edge.
  static constexpr float kMinEdgeSeconds = 0.005f;
  // How far the slew's limit stands above the slope of the pulse's own edge.
  static constexpr float kSlewHeadroom = 1.25f;
  // What Accent at full takes off every step but the first.
  static constexpr float kAccentDrop = 0.7f;
  // The corner of the low pass Shade fades to.
  static constexpr float kShadeHz = 400.0f;
  // How long the input has to be exact silence before sound counts as new.
  static constexpr float kArriveSeconds = 0.1f;
  // The most the pulsed sound is made up by: 4 dB.
  static constexpr float kMaxMakeup = 1.5848932f;
  // How fast the make-up follows a pattern that has changed.
  static constexpr float kMakeupSeconds = 0.05f;

  // The part of Rate the second gate adds for a Drift setting.
  static float drift_fraction(float drift) { return kMaxDrift * drift * drift * drift; }

  // Whether step `index` of the pattern sounds.
  static bool sounds(int index, int fill, int steps) { return (index * fill) % steps < fill; }

  // How long a pulse rises and falls, as a part of its step: Edge takes it
  // from half the pulse down to `least`.
  static float ramp_of(float edge, float length, float least) {
    const float half = 0.5f * length;
    float ramp = (1.0f - edge) * half;
    if (ramp < least) ramp = least;
    if (ramp > half) ramp = half;
    return ramp;
  }

  // One pulse over its step: `along` is 0 at the step's start and 1 at its
  // end, `ramp` the length of the rise and of the fall in the same measure.
  static float pulse_shape(float along, float length, float ramp) {
    if (along >= length) return 0.0f;
    const float half = 0.5f * length;
    const float from_end = along < half ? along : length - along;
    if (from_end >= ramp) return 1.0f;
    return 0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * from_end / ramp);
  }

  // The mean square of the gain one side gets, g = floor + (1 − floor)·e,
  // over a long time. A pulse's mean over its step is Length − ramp and its
  // mean square Length − 1.25·ramp (half a cosine has a mean of a half and a
  // mean square of three eighths). `floor_gain` is Floor squared, `others`
  // the height of every step but the first, `same` the share of a side that
  // is its own gate. Where a side hears both gates, what the two have in
  // common is taken over one whole turn of the drift (the product of their
  // means), or, with no drift, as they stand: `shift` steps apart.
  static float mean_square(int steps, int fill, int shift, bool drifting, float length, float ramp,
                           float floor_gain, float others, float same) {
    const float count = static_cast<float>(steps);
    const float rest = static_cast<float>(fill - 1);
    const float mean = (1.0f + rest * others) * (length - ramp) / count;
    const float square = (1.0f + rest * others * others) * (length - 1.25f * ramp) / count;
    float both = mean * mean;
    if (!drifting) {
      float sum = 0.0f;
      for (int i = 0; i < steps; ++i) {
        const int j = (i + shift) % steps;
        if (!sounds(i, fill, steps) || !sounds(j, fill, steps)) continue;
        sum += (i == 0 ? 1.0f : others) * (j == 0 ? 1.0f : others);
      }
      both = sum * (length - 1.25f * ramp) / count;
    }
    const float open = (same * same + (1.0f - same) * (1.0f - same)) * square +
                       2.0f * same * (1.0f - same) * both;
    const float up = 1.0f - floor_gain;
    return floor_gain * floor_gain + 2.0f * floor_gain * up * mean + up * up * open;
  }

  // What the pulsed sound is made up by: back to the level it came in at, and
  // by kMaxMakeup at the most.
  static float makeup_for(float mean_square_of_gain) {
    if (!(mean_square_of_gain * kMaxMakeup * kMaxMakeup > 1.0f)) return kMaxMakeup;
    return 1.0f / std::sqrt(mean_square_of_gain);
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
    smooth_[kMakeupNow].set_time(kMakeupSeconds, sr);
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
      // Asleep the clocks go on as they do awake, a sample at a time, so that
      // where they stand afterwards is the same to the last bit.
      for (int i = 0; i < frames; ++i) run_clocks();
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
      const float ramp[2] = {ramp_of(edge, length, least_ramp_[0]),
                             ramp_of(edge, length, least_ramp_[1])};
      const float raw[2] = {pulse(place_, length, ramp[0], others),
                            pulse(second_place(), length, ramp[1], others)};
      for (int k = 0; k < 2; ++k) {
        // No faster than a quarter over the steepest part of this gate's own
        // edge, half a cosine `ramp` of a step long.
        const float limit = slew_per_step_[k] / ramp[k];
        const float move = raw[k] - gate_[k];
        gate_[k] += move > limit ? limit : (move < -limit ? -limit : move);
      }
      run_clocks();

      const float same = 0.5f + 0.5f * smooth_[kApartNow].next();
      const float open[2] = {same * gate_[0] + (1.0f - same) * gate_[1],
                             same * gate_[1] + (1.0f - same) * gate_[0]};
      const float floor = smooth_[kFloorNow].next();
      const float shade = smooth_[kShadeNow].next();
      const float makeup = smooth_[kMakeupNow].next();
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
        const float gain = makeup * (floor + (1.0f - floor) * open[c]);
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
  float pulse(double place, float length, float ramp, float others) const {
    int index = static_cast<int>(place);
    if (index >= step_count_) index = step_count_ - 1;
    if (!sounds(index, fill_, step_count_)) return 0.0f;
    const float along = static_cast<float>(place - static_cast<double>(index));
    return (index == 0 ? 1.0f : others) * pulse_shape(along, length, ramp);
  }

  // Both clocks on by one sample.
  void run_clocks() {
    place_ += step_per_sample_;
    if (place_ >= steps_) place_ = std::fmod(place_, steps_);
    if (lead_per_sample_ > 0.0) {
      lead_ += lead_per_sample_;
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
    gate_[0] = pulse(place_, length, ramp_of(edge, length, least_ramp_[0]), others);
    gate_[1] = pulse(second_place(), length, ramp_of(edge, length, least_ramp_[1]), others);
  }

  // The make-up for the knobs as they are set (where they are going, not
  // where their smoothers are): it has a smoother of its own.
  void set_makeup() {
    using namespace pulses;
    const float floor = param(kFloor);
    const float square = mean_square(
        step_count_, fill_, shift_, lead_per_sample_ > 0.0, param(kLength),
        ramp_of(param(kEdge), param(kLength), least_ramp_[0]), floor * floor,
        1.0f - kAccentDrop * param(kAccent), 0.5f + 0.5f * param(kApart));
    smooth_[kMakeupNow].set(makeup_for(square), primed());
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
        const float steepest = kSlewHeadroom * 0.5f * kit::kPi * rate / sample_rate();
        slew_per_step_[0] = steepest;
        slew_per_step_[1] = steepest * (1.0f + drift);
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
    // Everything but Shade and Mix is in what the gates take away.
    if (id != kShade && id != kMix) set_makeup();
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
    kMakeupNow,
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
  // The two gates after the slew, and for each the slope of half a cosine one
  // step long, with the slew's headroom: divided by the rise it is the limit.
  float gate_[2] = {0.0f, 0.0f};
  float slew_per_step_[2] = {0.0f, 0.0f};
  // The shortest rise of each gate, as a part of its own step.
  float least_ramp_[2] = {0.0f, 0.0f};
  // Samples of exact silence at the input, up to arrive_after_.
  long silent_ = 0;
  long arrive_after_ = 0;
};

}  // namespace livemix
