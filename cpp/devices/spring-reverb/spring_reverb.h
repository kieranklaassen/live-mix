#pragma once

// Spring: a tank of one to three springs.
//
//   in ─► pre-delay ─► 60 Hz high-pass ─► drip emphasis ─► drive ─► low-pass ─► ÷K
//
//   each spring, at the reduced rate:
//
//        x ─►(+)─► 100 allpasses ─► delay line ─┬─ half way ─────────────────► pickup
//             ▲                                 └─ end, slowly modulated ─┐
//             └──────────── x (-gain) ◄── damping ◄────────────────────────┘
//
//   pickups ─► pan ─► ×K ─► low-pass ─► tone ─► limit ─► width ─► wet
//
// - After Välimäki, Parker and Abel's parametric spring model. A helical
//   spring is dispersive: below a transition frequency the higher a
//   component is, the slower it travels, so every echo is a chirp that
//   starts low and drags its top end out behind it, and the chirp gets
//   longer on every trip. A cascade of first-order allpasses stretched by K
//   (z^-K for z^-1) has that delay curve, running out at fs / 2K.
// - Stretching by K is the same as running plain allpasses at fs / K, which
//   costs a K-th as much: the tank runs at the reduced rate between a steep
//   low-pass down and another up. K is picked so that the
//   transition frequency, the reduced Nyquist, lands near 4.6 kHz (4.8 kHz
//   at 48 and 96 kHz, 4.41 kHz at 44.1 kHz); nothing above it comes back,
//   as from a real tank's pickup.
// - Tension is the allpass coefficient, which shapes the delay curve. Slack
//   (0.45) spreads the dispersion over the whole band: every echo is a long
//   audible sweep. Taut (0.8) squeezes it up against the transition
//   frequency: tight slaps with a short whip at the top. The line length is
//   corrected for it so the echo spacing, the spring's round-trip time,
//   does not move.
// - The reflection inverts (negative loop gain), the pickup sits half way
//   round, and the loop is damped a little more in the treble than Decay
//   asks, as steel is.
// - Drip is the treble-heavy feed of the classic outboard units: more of the
//   band where the chirp is longest goes into the springs, so attacks
//   splash. Drive saturates what the input transformer would.
// - The end of each line is read through an allpass interpolator whose
//   fraction drifts by a third of a sample: no two trips are quite alike,
//   which keeps the tail from ringing like a comb.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class SpringReverb : public kit::DeviceBase<spring_reverb::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace spring_reverb;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    factor_ = kit::clamp_int(static_cast<int>(sr / (2.0f * kTransitionHz) + 0.5f), 1, 32);
    low_rate_ = sr / static_cast<float>(factor_);
    phase_ = 0;

    predelay_.clear();
    rumble_.reset();
    rumble_.set_cutoff(60.0f, sr);
    emphasis_.reset();
    emphasis_.set_cutoff(kDripHz, sr);
    // Butterworth low-passes 0.8 of the way to the reduced Nyquist. Going
    // down, sixteenth order: whatever is left above the reduced Nyquist
    // folds back as tones that were never played, and at 1.2 times the
    // Nyquist (which lands on the corner) it is 56 dB down. Coming up,
    // twelfth order per side removes the images of the zero-stuffing.
    const float corner = 0.8f * 0.5f * low_rate_;
    for (int k = 0; k < kDownSections; ++k) {
      down_[k].set_lowpass(corner, butterworth_q(k, kDownSections), sr);
      down_[k].reset();
    }
    for (int c = 0; c < 2; ++c) {
      for (int k = 0; k < kUpSections; ++k) {
        up_[c][k].set_lowpass(corner, butterworth_q(k, kUpSections), sr);
        up_[c][k].reset();
      }
    }
    for (int c = 0; c < 2; ++c) tone_[c].reset();

    for (int n = 0; n < kSprings; ++n) {
      Spring& spring = spring_[n];
      spring.line.clear();
      for (int m = 0; m < kStages; ++m) stage_[m][n] = 0.0f;
      spring.damping.reset();
      spring.interpolator = 0.0f;
      spring.drift.seed(0x243F6A88u + 0x9E3779B9u * static_cast<uint32_t>(n));
      spring.drift.set_rate(kDriftHz[n], low_rate_);
      spring.half = kit::clamp_int(static_cast<int>(0.5f * kRoundTrip[n] * low_rate_ + 0.5f), 1,
                                   kLineSize - 8);
      spring.feed.set_time(0.02f, low_rate_);
      spring.pan.set_time(0.02f, low_rate_);
    }

    dry_.set_time(kSmoothingSeconds, sr);
    wet_.set_time(kSmoothingSeconds, sr);
    width_.set_time(kSmoothingSeconds, sr);
    drip_.set_time(kSmoothingSeconds, sr);
    drive_.set_time(kSmoothingSeconds, sr);
    predelay_time_.set_time(0.06f, sr);
    const float control_rate = sr / kControlPeriod;
    decay_.set_time(0.03f, control_rate);
    tension_.set_time(0.05f, control_rate);
    level_.set_time(0.03f, control_rate);
    clock_.reset(kControlPeriod);
    // The longest silent gap: the pre-delay plus half a round trip.
    idle_.reset(sr, kParamMax[kPredelay] * 0.001f + 0.3f);
    started_ = false;
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    using namespace spring_reverb;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    const float max_predelay = kit::DelayLine<kPredelaySize>::max_delay() - 2.0f;
    const float up_gain = static_cast<float>(factor_);
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      if (clock_.tick()) {
        control();
        started_ = true;
      }

      // The drive circuit: mono, no bass below the transformer's corner,
      // treble pushed by Drip, then the core saturating.
      predelay_.write(0.5f * (in[0] + in[1]));
      float x = predelay_.read_linear(kit::min(1.0f + glide(predelay_time_), max_predelay));
      x = rumble_.highpass(x);
      x += glide(drip_) * kDripGain * emphasis_.highpass(x);
      const float drive = glide(drive_);
      x = kit::fast_tanh(x * drive) / drive;
      for (int k = 0; k < kDownSections; ++k) x = down_[k].process(x);

      // One tank sample every K input samples; zeros between them are what
      // the low-pass back up interpolates across.
      float left = 0.0f;
      float right = 0.0f;
      if (phase_ == 0) {
        tank(x, &left, &right);
        left *= up_gain;
        right *= up_gain;
      }
      if (++phase_ >= factor_) phase_ = 0;
      for (int k = 0; k < kUpSections; ++k) {
        left = up_[0][k].process(left);
        right = up_[1][k].process(right);
      }

      const float level = level_.value;
      // Exact up to ±1 and landing on ±2: a tone held on one of a spring's
      // resonances rings far above its input.
      left = 2.0f * kit::soft_clip(0.5f * tone_[0].lowpass(left) * level);
      right = 2.0f * kit::soft_clip(0.5f * tone_[1].lowpass(right) * level);
      const float width = glide(width_);
      const float mid = 0.5f * (left + right);
      const float side = 0.5f * (left - right) * width;
      const float wet = glide(wet_);
      const float dry = glide(dry_);
      out_left_[i] = in[0] * dry + (mid + side) * wet;
      out_right_[i] = in[1] * dry + (mid - side) * wet;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kSprings = 3;
  static constexpr int kStages = 100;
  static constexpr int kDownSections = 8;
  static constexpr int kUpSections = 6;
  static constexpr int kLineSize = 1024;       // 48 ms at any reduced rate
  static constexpr int kPredelaySize = 32768;  // 200 ms at 96 kHz
  static constexpr int kControlPeriod = 32;

  static constexpr float kTransitionHz = 4600.0f;
  // Round-trip times: the spacing of each spring's echoes.
  static constexpr float kRoundTrip[kSprings] = {0.0412f, 0.0356f, 0.0479f};
  // Allpass coefficient: Tension 0 (slack) to 1 (taut), and each spring's
  // offset from it so their chirps do not line up.
  static constexpr float kSlack = 0.45f;
  static constexpr float kTaut = 0.80f;
  static constexpr float kCoefficientOffset[kSprings] = {0.0f, 0.02f, -0.02f};
  static constexpr float kDriftHz[kSprings] = {0.31f, 0.43f, 0.37f};
  static constexpr float kDriftSamples = 0.33f;
  // How much faster than Decay asks the top of the band falls (in dB per
  // trip, as a share of the loss Decay sets).
  static constexpr float kTrebleLoss = 0.6f;
  static constexpr float kDripHz = 2200.0f;
  static constexpr float kDripGain = 4.0f;
  static constexpr float kMaxDrive = 7.0f;
  static constexpr float kWetGain = 1.5f;
  // Per mode: what each spring is fed, and where it sits (-1 left, 1 right).
  static constexpr float kFeed[3][kSprings] = {{1.0f, 0.0f, 0.0f},
                                               {0.75f, 0.75f, 0.0f},
                                               {0.62f, 0.62f, 0.62f}};
  static constexpr float kPan[3][kSprings] = {{0.0f, 0.0f, 0.0f},
                                              {-1.0f, 1.0f, 0.0f},
                                              {-1.0f, 1.0f, 0.0f}};

  struct Spring {
    kit::DelayLine<kLineSize> line;
    kit::OnePole damping;
    kit::Drift drift;
    kit::Smoother feed, pan;
    float interpolator = 0.0f;  // state of the fractional-delay allpass
    float coefficient = 0.6f;
    float length = 256.0f;      // feedback delay in reduced-rate samples
    float gain = 0.0f;
    int half = 128;
  };

  static float glide(kit::Smoother& s) { return s.value == s.target ? s.value : s.next(); }

  // Q of section k of a Butterworth low-pass made of `sections` biquads.
  static float butterworth_q(int k, int sections) {
    return 0.5f / std::cos(kit::kPi * static_cast<float>(2 * k + 1) / static_cast<float>(4 * sections));
  }

  // One sample of all three springs at the reduced rate.
  void tank(float x, float* left, float* right) {
    float y[kSprings];
    float a[kSprings];
    float c[kSprings];
    for (int n = 0; n < kSprings; ++n) {
      Spring& spring = spring_[n];
      // The far end of the line, read through a first-order allpass whose
      // delay is the fraction (kept between 0.2 and 1.2 samples).
      const float delay = spring.length + kDriftSamples * spring.drift.next();
      const int whole = static_cast<int>(delay - 0.2f);
      const float fraction = delay - static_cast<float>(whole);
      const float eta = (1.0f - fraction) / (1.0f + fraction);
      const float back = spring.line.read(whole + 1) +
                         eta * (spring.line.read(whole) - spring.interpolator);
      spring.interpolator = flush_denormal(back);
      y[n] = x * glide(spring.feed) - spring.gain * spring.damping.lowpass(back);
      a[n] = spring.coefficient;
      c[n] = 1.0f - a[n] * a[n];
    }
    // The dispersion: (a + z^-1) / (1 + a z^-1), a hundred times, as
    // y' = a y + (1 - a^2) s and s' = y - a s. That form puts one multiply
    // and one add between a stage's input and its output, and the three
    // springs run abreast, so the chains overlap instead of queueing: this
    // loop is most of the device's cost.
    for (int m = 0; m < kStages; ++m) {
      float* state = stage_[m];
      for (int n = 0; n < kSprings; ++n) {
        const float s = state[n];
        state[n] = y[n] - a[n] * s;
        y[n] = a[n] * y[n] + c[n] * s;
      }
    }
    for (int n = 0; n < kSprings; ++n) {
      Spring& spring = spring_[n];
      spring.line.write(flush_denormal(y[n]));
      const float pickup = spring.line.read(spring.half);
      const float pan = glide(spring.pan);
      *left += pickup * (1.0f - pan);
      *right += pickup * (1.0f + pan);
    }
    *left *= 0.5f;
    *right *= 0.5f;
  }

  // Every 32 samples: each spring's coefficient, length and loop gain, the
  // tone filter and the wet level.
  void control() {
    using namespace spring_reverb;
    const float sr = sample_rate();
    tension_.set(param(kTension), started_);
    const float tension = tension_.next();
    const float decay = decay_.next();
    for (int n = 0; n < kSprings; ++n) {
      Spring& spring = spring_[n];
      const float a = kit::lerp(kSlack, kTaut, tension) + kCoefficientOffset[n];
      spring.coefficient = a;
      // The cascade delays the bottom of the band by (1 - a) / (1 + a) per
      // stage; the line makes up the rest of the round trip.
      const float cascade = static_cast<float>(kStages) * (1.0f - a) / (1.0f + a);
      spring.length = kit::clamp(kRoundTrip[n] * low_rate_ - cascade, 4.0f,
                                 static_cast<float>(kLineSize - 8));
      spring.gain = kit::rt60_gain(kRoundTrip[n] * low_rate_, decay, low_rate_);
      // One-pole damping whose loss at half the reduced Nyquist is
      // kTrebleLoss of the loop's own.
      spring.damping.a = kit::clamp(1.0f - std::pow(spring.gain, kTrebleLoss), 0.0f, 0.5f);
    }
    for (int c = 0; c < 2; ++c) tone_[c].set(param(kTone), kit::kSqrtHalf, sr);
    // A long decay stores more energy for the same input; take half of that
    // back (in dB) so the Decay knob is not also a volume knob.
    const float kept = spring_[0].gain * spring_[0].gain;
    level_.set(kWetGain * std::sqrt(std::sqrt(kit::max(1.0f - kept, 1.0e-3f))), started_);
    level_.next();
  }

  void apply(int id) {
    using namespace spring_reverb;
    const float value = param(id);
    switch (id) {
      case kMix: {
        float dry, wet;
        kit::equal_power(value, &dry, &wet);
        if (value >= 1.0f) dry = 0.0f;  // cos(pi/2) in floats is -4e-8, not 0
        dry_.set(dry, primed());
        wet_.set(wet, primed());
        break;
      }
      case kDecay:
        if (primed()) {
          decay_.set_target(value);
        } else {
          decay_.snap(value);
        }
        break;
      case kSprings: {
        const int mode = kit::clamp_int(static_cast<int>(value + 0.5f), 0, 2);
        for (int n = 0; n < kSprings; ++n) {
          spring_[n].feed.set(kFeed[mode][n], primed());
          spring_[n].pan.set(kPan[mode][n], primed());
        }
        break;
      }
      case kDrip:
        drip_.set(value, primed());
        break;
      case kPredelay:
        predelay_time_.set(value * 0.001f * sample_rate(), primed());
        break;
      case kDrive:
        drive_.set(1.0f + (kMaxDrive - 1.0f) * value, primed());
        break;
      case kWidth:
        width_.set(value, primed());
        break;
      default:
        break;  // Tension and Tone are read on the control clock
    }
  }

  kit::DelayLine<kPredelaySize> predelay_;
  kit::OnePole rumble_, emphasis_;
  kit::Biquad down_[kDownSections];
  kit::Biquad up_[2][kUpSections];
  kit::Svf tone_[2];
  Spring spring_[kSprings];
  float stage_[kStages][kSprings] = {};  // allpass states, springs side by side
  int factor_ = 5;
  int phase_ = 0;
  float low_rate_ = 9600.0f;

  kit::Smoother dry_, wet_, width_, drip_, drive_, predelay_time_;
  kit::Smoother decay_, tension_, level_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  bool started_ = false;  // the first control tick snaps what later ones glide
};

}  // namespace livemix
