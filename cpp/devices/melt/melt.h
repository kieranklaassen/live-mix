#pragma once

// Melt: a tail in which sound ages. The longer a sound has been ringing, the
// further it has slid in pitch, the darker (or thinner) and the more smeared
// it is.
//
//   in ─┬──────────────────────────────────────────────────────── dry ─┐
//       └─► Solid (delay) ─┬────────────────┐                          (+)─► out
//                          ▼                │                          │
//                  ┌─────►(+)─► 4 lines ────┼─► per line:              │
//                  │                        │   sliding head (pitch)   │
//                  │                        │   Hold gain              │
//               Hadamard                    │   dark and thin shelves  │
//                  │                        │   allpass (Blur)         │
//                  └────────────────────────┴──────────┬───────────────┘
//                                                      └─► width ─► level ─► wet
//
// - Everything a line does to the sound it does in proportion to its own
//   length. A line `a` seconds long (its delay, where its head stands and its
//   allpass together) moves the pitch by Sag x a cents, takes 60 dB x a / Hold
//   off the level and Dim's decibels a second x a off the highs or the lows.
//   So whatever way a sound took through the four lines, after `t` seconds in
//   them it is Sag x t cents from where it was, 60 t / Hold dB down, and that
//   much darker: pitch, level and colour are functions of age alone, and
//   because the lines differ in length the ages run together into a
//   continuous droop instead of steps.
// - The pitch moves without a splice for as long as it can. A line's read
//   head slides away from the write point (to sink) or towards it (to rise)
//   at 1 - ratio samples a sample, which is a pure change of pitch. Only when
//   it has used up its travel (0.4 of the line) does a second head start at
//   the other end and take over in a 30 ms fade. At 30 cents a second that is
//   once in 23 seconds per line. The usual two heads under one moving window
//   are always half way through a fade, and in a loop that costs a decibel or
//   two on every pass, which no Hold setting would survive.
// - Drip makes the slide run fast and slow: one free-running drift shared by
//   the four lines (never reset by the sound) and a smaller one of each
//   line's own scale the rate between none and twice what Sag says. The
//   lines mix on every pass, so it is mostly the fall as a whole that
//   wanders, in fits and stalls; the lines' own drifts spread it a little.
// - Dim is a shelf per line: highs above 1 kHz when the tail sinks, lows
//   below 400 Hz when it rises, cross-faded over +-10 cents a second round
//   Sag 0 so that turning Sag through zero does not switch the tone.
// - The sliding heads read with Hermite interpolation, which takes a little
//   off the very top on each pass (about 0.25 dB at 10 kHz): with Dim at 0 a
//   long tail still loses its top octave slowly.
// - The loop cannot gain: the mixing matrix is orthogonal, the fade between
//   heads is linear, the shelves only cut and Hold is below 1. What is written
//   to a line passes a soft clip that is linear to +-1.5, for what a full-scale
//   drone piles up at the longest Hold.
// - The wet tail is another stretch of time and another pitch than the dry
//   sound, so Mix is equal power. At Mix 0 the output is the input.
// - Storage: four lines of 65536 samples (0.33 s at 96 kHz at the largest
//   Size, plus travel), two delays of 131072 for Solid (1 s at 96 kHz) and
//   four allpasses of 2048: 2.1 MB.
// - Sleep is decided frame by frame, so that the moment the device stops and
//   the moment it starts again do not depend on the host's block size. A
//   knob moved while it sleeps is where it was put when sound returns.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Melt : public kit::DeviceBase<melt::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace melt;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int c = 0; c < 2; ++c) pre_[c].clear();
    for (int n = 0; n < kLines; ++n) {
      line_[n].clear();
      allpass_[n].clear();
      dark_[n].reset();
      thin_[n].reset();
      dark_[n].set_cutoff(kDarkHz, sr);
      thin_[n].set_cutoff(kThinHz, sr);
      base_[n] = kLineSeconds[n] * sr;
      allpass_length_[n] =
          kit::clamp_int(static_cast<int>(kAllpassSeconds[n] * sr + 0.5f), 1, kAllpassSize - 1);
      rate_[n] = 0.0f;
      gain_[n] = 0.0f;
      dark_cut_[n] = 0.0f;
      thin_cut_[n] = 0.0f;
    }
    dry_.set_time(kSmoothingSeconds, sr);
    wet_.set_time(kSmoothingSeconds, sr);
    width_.set_time(kSmoothingSeconds, sr);
    blur_.set_time(kSmoothingSeconds, sr);
    // Solid and Size move read points: slow enough to bend, not to zip.
    solid_.set_time(kSolidGlideSeconds, sr);
    scale_.set_time(kSizeGlideSeconds, sr);
    // Stepped on the control clock.
    const float control_rate = sr / kControlPeriod;
    sag_.set_time(kControlGlideSeconds, control_rate);
    hold_.set_time(kControlGlideSeconds, control_rate);
    dim_.set_time(kControlGlideSeconds, control_rate);
    drip_.set_time(kControlGlideSeconds, control_rate);
    level_.set_time(kControlGlideSeconds, control_rate);
    fade_step_ = 1.0f / (kFadeSeconds * sr);
    // The longest silence the device can make on its own: Solid, then the
    // longest line with all its travel.
    quiet_frames_ = static_cast<long>(
        (kParamMax[kSolid] * 0.001f + kLineSeconds[kLines - 1] * kMaxScale * (1.0f + kTravelShare) +
         0.1f) *
        sr);
    quiet_ = 0;
    asleep_ = true;
    wander_seen_ = 0.0f;
    for (int id = 0; id < kNumParams; ++id) apply(id);
    restart();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The reading named by "meters" in device.json, for the display: how much
  // faster (above 0) or slower (below it) than Sag says the tail is sliding
  // now, as a share of Sag and the mean of the four lines. Drip moves it
  // between -1 (the slide has stopped) and 1 (twice as fast); with no Drip,
  // and asleep, it rests at 0.
  float meter(int index) const {
    if (index == 0) return asleep_ ? 0.0f : wander_seen_;
    return 0.0f;
  }

  void process(int frames) {
    frames = begin_block(frames);
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      in[0] = tidy(in[0]);
      in[1] = tidy(in[1]);
      const bool excited = in[0] != 0.0f || in[1] != 0.0f;
      // Asleep and awake are decided on the frame, not on the block: what
      // runs freely (the heads, the drifts, the control clock) then stands
      // still for the same frames at every block size.
      if (asleep_) {
        if (!excited) {
          out_left_[i] = 0.0f;
          out_right_[i] = 0.0f;
          continue;
        }
        asleep_ = false;
        restart();
      }
      const bool sounding = render_frame(in, &out_left_[i], &out_right_[i]);
      if (excited || sounding) {
        quiet_ = 0;
      } else if (++quiet_ > quiet_frames_) {
        asleep_ = true;
      }
    }
  }

 private:
  static constexpr int kLines = 4;
  static constexpr int kLineSize = 65536;
  static constexpr int kPreSize = 131072;
  static constexpr int kAllpassSize = 2048;
  static constexpr int kControlPeriod = 32;

  // Line lengths at Size's middle scale (1.0); Size runs them from 0.45 to
  // 4.5 times that: 20..32 ms up to 197..324 ms.
  static constexpr float kLineSeconds[kLines] = {0.0437f, 0.0539f, 0.0613f, 0.0719f};
  static constexpr float kMinScale = 0.45f;
  static constexpr float kMaxScale = 4.5f;
  // A head's travel as a share of its line, and where each line's head
  // starts in it, so the four never hand over together.
  static constexpr float kTravelShare = 0.4f;
  static constexpr float kStartShare[kLines] = {0.15f, 0.65f, 0.4f, 0.9f};
  static constexpr float kFadeSeconds = 0.03f;
  // The allpass in each line, and its gain at Blur 1.
  static constexpr float kAllpassSeconds[kLines] = {0.0071f, 0.0097f, 0.0119f, 0.0137f};
  static constexpr float kBlurGain = 0.7f;
  // Dim at 1 takes this many dB a second off its side of the spectrum, and
  // grows as the square of the knob.
  static constexpr float kDimDbPerSecond = 36.0f;
  static constexpr float kDarkHz = 1000.0f;
  static constexpr float kThinHz = 400.0f;
  // Sag from -kTurn to +kTurn cents a second cross-fades Dim from the highs
  // to the lows.
  static constexpr float kTurnCents = 10.0f;
  // Drip: the drift all four lines share and each line's own, in Hz, and
  // how much of the rate each moves at Drip 1 (a drift seldom leaves +-0.7).
  static constexpr float kTideHz = 0.31f;
  static constexpr float kDripHz[kLines] = {0.113f, 0.171f, 0.139f, 0.197f};
  static constexpr float kTideShare = 1.4f;
  static constexpr float kOwnShare = 0.5f;
  static constexpr float kSolidGlideSeconds = 0.08f;
  static constexpr float kSizeGlideSeconds = 0.4f;
  static constexpr float kControlGlideSeconds = 0.02f;
  // What the two inputs put into each line, and the tail's level before
  // the make-up for Hold (see control()).
  static constexpr float kFeedGain = 0.5f;
  static constexpr float kWetGain = 1.3f;
  // No input sample is taken to be larger than this (12 dB over full scale).
  static constexpr float kInputBound = 4.0f;

  // What comes in is kept as it is unless it is not a number (then it is
  // silence) or absurdly large (then it is held to the bound): one such
  // sample would otherwise go round the loop for good.
  static float tidy(float x) {
    if (!(x == x)) return 0.0f;
    return x > kInputBound ? kInputBound : (x < -kInputBound ? -kInputBound : x);
  }

  // A smoother that has arrived costs one compare.
  static float glide(kit::Smoother& s) { return s.value == s.target ? s.value : s.next(); }

  // Linear to +-1.5, landing on +-3.
  static float bound(float x) { return 3.0f * kit::soft_clip(x * (1.0f / 3.0f)); }

  static void hadamard4(float* v) {
    const float a0 = v[0] + v[1], a1 = v[0] - v[1], a2 = v[2] + v[3], a3 = v[2] - v[3];
    v[0] = 0.5f * (a0 + a2);
    v[1] = 0.5f * (a1 + a3);
    v[2] = 0.5f * (a0 - a2);
    v[3] = 0.5f * (a1 - a3);
  }

  // Everything that runs on its own back where it starts, and every knob
  // where it was put: init, and the first sound after a sleep. Nothing is
  // sounding then (what is left in the lines is under the idle floor).
  void restart() {
    using namespace melt;
    clock_.reset(kControlPeriod);
    dry_.snap(dry_.target);
    wet_.snap(wet_.target);
    width_.snap(width_.target);
    blur_.snap(blur_.target);
    solid_.snap(solid_.target);
    scale_.snap(scale_.target);
    sag_.snap(param(kSag));
    hold_.snap(param(kHold));
    dim_.snap(param(kDim));
    drip_.snap(param(kDrip));
    started_ = false;
    tide_.seed(0x2F6E2B1Du);
    tide_.set_rate(kTideHz, sample_rate() / kControlPeriod);
    for (int n = 0; n < kLines; ++n) {
      wander_[n].seed(0x6D2B79F5u + 0x9E3779B9u * static_cast<uint32_t>(n + 1));
      wander_[n].set_rate(kDripHz[n], sample_rate() / kControlPeriod);
      lead_[n] = 0;
      fade_[n] = 1.0f;
      position_[n][0] = kStartShare[n] * kTravelShare * base_[n] * scale_.value;
      position_[n][1] = 0.0f;
    }
    quiet_ = 0;
  }

  // Every 32 samples: what each line does to the sound for its length now.
  void control() {
    using namespace melt;
    const float sr = sample_rate();
    const float sag = sag_.next();
    const float hold = hold_.next();
    const float dim = dim_.next();
    const float drip = drip_.next();
    const float scale = scale_.value;
    const float colour = kDimDbPerSecond * dim * dim;
    const float down = kit::clamp(0.5f - sag / (2.0f * kTurnCents), 0.0f, 1.0f);
    const float dark = colour * down;
    const float thin = colour * (1.0f - down);
    float factors = 0.0f;
    float ages = 0.0f;
    const float tide = kTideShare * tide_.next();
    for (int n = 0; n < kLines; ++n) {
      const float age = (base_[n] * scale + position_[n][lead_[n]] +
                         static_cast<float>(allpass_length_[n])) /
                        sr;
      const float factor =
          kit::clamp(1.0f + drip * (tide + kOwnShare * wander_[n].next()), 0.0f, 2.0f);
      // The head moves away from the write point by what the pitch gives up.
      rate_[n] = 1.0f - std::exp2(sag * age * factor * (1.0f / 1200.0f));
      gain_[n] = std::pow(10.0f, -3.0f * age / hold);
      dark_cut_[n] = 1.0f - std::pow(10.0f, -0.05f * dark * age);
      thin_cut_[n] = 1.0f - std::pow(10.0f, -0.05f * thin * age);
      factors += factor;
      ages += age;
    }
    wander_seen_ = factors * (1.0f / kLines) - 1.0f;
    // A long Hold stores more of the same input; half of that (in dB) is
    // taken back, so that Hold is not also a volume knob.
    const float middle = std::pow(10.0f, -3.0f * ages * (1.0f / kLines) / hold);
    level_.set(kWetGain * std::sqrt(std::sqrt(kit::max(1.0f - middle * middle, 1.0e-4f))), started_);
    level_.next();
    started_ = true;
  }

  // One frame. True while the tail is above the idle floor.
  bool render_frame(const float* in, float* out_left, float* out_right) {
    if (clock_.tick()) control();
    const float max_line = kit::DelayLine<kLineSize>::max_delay() - 2.0f;
    const float max_pre = kit::DelayLine<kPreSize>::max_delay() - 2.0f;

    // Solid: the sound waits this long before it enters the lines.
    const float solid = kit::min(2.0f + glide(solid_), max_pre);
    float feed[2];
    for (int c = 0; c < 2; ++c) {
      pre_[c].write(in[c]);
      feed[c] = kFeedGain * pre_[c].read_hermite(solid);
    }

    const float scale = glide(scale_);
    const float blur = glide(blur_);
    float u[kLines];
    for (int n = 0; n < kLines; ++n) {
      const float length = base_[n] * scale;
      const int lead = lead_[n];
      position_[n][lead] += rate_[n];
      float v;
      if (fade_[n] < 1.0f) {
        // The head that used up its travel hands over to the one that
        // started at the other end.
        const int old = 1 - lead;
        position_[n][old] += rate_[n];
        fade_[n] += fade_step_;
        if (fade_[n] > 1.0f) fade_[n] = 1.0f;
        const float in_gain = 0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * fade_[n]);
        const float a = line_[n].read_hermite(kit::clamp(length + position_[n][lead], 4.0f, max_line));
        const float b = line_[n].read_hermite(kit::clamp(length + position_[n][old], 4.0f, max_line));
        v = b + (a - b) * in_gain;
      } else {
        v = line_[n].read_hermite(kit::clamp(length + position_[n][lead], 4.0f, max_line));
        const float travel = kTravelShare * length;
        const float at = position_[n][lead];
        if (at > travel || at < 0.0f) {
          const int next = 1 - lead;
          position_[n][next] = at > travel ? 0.0f : travel;
          lead_[n] = next;
          fade_[n] = 0.0f;
        }
      }
      // What the line's length costs: level, colour, and a smear.
      float x = v * gain_[n];
      x -= dark_cut_[n] * (x - dark_[n].lowpass(x));
      x -= thin_cut_[n] * thin_[n].lowpass(x);
      u[n] = allpass_[n].process(x, allpass_length_[n], kBlurGain * blur);
    }

    const float wet_left = u[0] + u[2];
    const float wet_right = u[1] + u[3];
    hadamard4(u);
    for (int n = 0; n < kLines; ++n) {
      line_[n].write(flush_denormal(bound(u[n] + feed[n & 1])));
    }

    const float width = glide(width_);
    const float mid = 0.5f * (wet_left + wet_right);
    const float side = 0.5f * (wet_left - wet_right) * width;
    const float wet = glide(wet_) * level_.value;
    const float dry = glide(dry_);
    *out_left = in[0] * dry + (mid + side) * wet;
    *out_right = in[1] * dry + (mid - side) * wet;

    const float floor = kit::IdleGate::kFloor * 0.25f;
    return wet_left > floor || wet_left < -floor || wet_right > floor || wet_right < -floor;
  }

  void apply(int id) {
    using namespace melt;
    const float value = param(id);
    // A knob moved while nothing sounds is there when sound returns.
    const bool ramp = primed() && !asleep_;
    switch (id) {
      case kMix: {
        float dry, wet;
        kit::equal_power(value, &dry, &wet);
        if (value >= 1.0f) dry = 0.0f;  // cos(pi/2) in floats is -4e-8, not 0
        dry_.set(dry, ramp);
        wet_.set(wet, ramp);
        break;
      }
      case kWidth:
        width_.set(value, ramp);
        break;
      case kBlur:
        blur_.set(value, ramp);
        break;
      case kSolid:
        solid_.set(value * 0.001f * sample_rate(), ramp);
        break;
      case kSize:
        scale_.set(kMinScale * std::pow(kMaxScale / kMinScale, value), ramp);
        break;
      case kSag:
        sag_.set(value, ramp);
        break;
      case kHold:
        hold_.set(value, ramp);
        break;
      case kDim:
        dim_.set(value, ramp);
        break;
      case kDrip:
        drip_.set(value, ramp);
        break;
      default:
        break;
    }
  }

  kit::DelayLine<kPreSize> pre_[2];
  kit::DelayLine<kLineSize> line_[kLines];
  kit::AllpassDelay<kAllpassSize> allpass_[kLines];
  kit::OnePole dark_[kLines], thin_[kLines];
  kit::Drift tide_;
  kit::Drift wander_[kLines];
  float base_[kLines] = {};
  int allpass_length_[kLines] = {};
  // The two heads of each line: how far past the line's length each reads
  // (samples), which of them leads, and how far its fade in has got (1: done).
  float position_[kLines][2] = {};
  int lead_[kLines] = {};
  float fade_[kLines] = {};
  float fade_step_ = 0.0f;
  // Set on the control clock.
  float rate_[kLines] = {};
  float gain_[kLines] = {};
  float dark_cut_[kLines] = {};
  float thin_cut_[kLines] = {};

  kit::Smoother dry_, wet_, width_, blur_, solid_, scale_;
  kit::Smoother sag_, hold_, dim_, drip_, level_;
  kit::ControlClock clock_;
  bool started_ = false;  // the first control tick snaps what later ones glide
  long quiet_ = 0;
  long quiet_frames_ = 1;
  bool asleep_ = true;
  // For meter() only: never read by the sound.
  float wander_seen_ = 0.0f;
};

}  // namespace livemix
