#pragma once

// Rotary: a Leslie cabinet heard through two microphones.
//
//   in (summed to mono) ─► tube drive ─► split 800 Hz ─┬─► horn  (highs) ─┐
//                                                      └─► drum  (lows) ──┴─► left, right
//
//   horn, per microphone:   delay swung by the path length (Doppler)
//                           ─► darker when facing away ─► louder when facing
//                           + two cabinet reflections that see the horn at
//                             other angles (Distance brings them up)
//   drum, per microphone:   mostly louder and quieter, a little Doppler
//
// - The two rotors are separate bodies. The horn is light: it follows a speed
//   change with a time constant of 0.25 s (0.5 s slowing down). The drum is
//   heavy: 1.5 s and 1.9 s. Switching between Slow and Fast is the sound of
//   the two catching up at their own pace; Acceleration divides all four.
//   Brake adds friction, so they come to rest wherever they happen to be.
// - Slow is 0.8 Hz for the horn and 0.67 Hz for the drum, Fast 6.7 and
//   5.8 Hz; they turn in opposite directions.
// - Horn Depth 1 swings the horn's path by ±0.55 ms, the mouth of a 19 cm
//   horn, which at Fast is ±2.3 % of pitch. The amplitude and tone swing scale
//   with it; the drum's own depth does the same for the lows (±0.2 ms).
// - A microphone further away hears less of the direct beam (less amplitude
//   swing) and more of the cabinet: the reflections carry their own Doppler
//   at other phases, which is the smoother, more chorused far sound.
// - Spread is the angle between the microphones, up to 144°. At 0 they are
//   one microphone and the two outputs are identical.
// - The drive is a biased soft clipper, u / sqrt(1 + u²) (odd and even
//   harmonics), with first-order antiderivative anti-aliasing. That curve's
//   antiderivative is sqrt(1 + u²), so the anti-aliased form is exact in
//   single precision and costs one square root: no oversampling, no
//   latency. Its make-up (gain to the power 0.3 over unity slope) keeps
//   playing that peaks around -12 dBFS at the level it came in; quieter
//   playing comes up by as much as 4.7 dB and louder playing is held back.
// - The split is a second-order Linkwitz-Riley pair (one Svf at Q 0.5, high
//   band inverted), so the bands sum flat when nothing moves.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Rotary : public kit::DeviceBase<rotary::kNumParams> {
 public:
  void init(float sample_rate) {
    using namespace rotary;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    horn_line_.clear();
    drum_line_.clear();
    split_.reset();
    split_.set(kCrossoverHz, 0.5f, sr);
    dc_.reset();
    dc_.set_cutoff(15.0f, sr);
    for (kit::OnePole& filter : shade_) {
      filter.reset();
      filter.set_cutoff(kShadeHz, sr);
    }
    for (kit::Smoother* smoother : smoothers()) smoother->set_time(kSmoothingSeconds, sr);
    horn_angle_ = 0.0;
    drum_angle_ = 0.37;
    last_u_ = kBias;
    last_root_ = std::sqrt(1.0f + kBias * kBias);
    started_ = false;
    clock_.reset(kControlPeriod);
    idle_.reset(sr, 0.1f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    using namespace rotary;
    frames = begin_block(frames);
    if (!idle_.wake(input_present(frames))) {
      silence_output(frames);
      return;
    }
    const float sr = sample_rate();
    const double per_sample = 1.0 / static_cast<double>(sr);
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      if (clock_.tick()) control(sr);

      horn_angle_ += horn_speed_ * per_sample;
      if (horn_angle_ >= 1.0) horn_angle_ -= 1.0;
      drum_angle_ -= drum_speed_ * per_sample;
      if (drum_angle_ < 0.0) drum_angle_ += 1.0;

      const float driven =
          dc_.process(tube(0.5f * (in[0] + in[1]), glide(drive_), glide(drive_level_)));
      split_.process(driven);
      // Written first, so a read at 1 is the current sample.
      horn_line_.write(-split_.high);
      drum_line_.write(split_.low);

      const float horn_radius = glide(horn_radius_) * sr;
      const float horn_am = glide(horn_am_);
      const float horn_shade = glide(horn_shade_);
      const float horn_makeup = glide(horn_makeup_);
      const float drum_radius = glide(drum_radius_) * sr;
      const float drum_am = glide(drum_am_);
      const float drum_makeup = glide(drum_makeup_);
      const float direct = glide(direct_);
      const float reflect = glide(reflect_);
      const float mic = glide(mic_);
      const float horn_gain = glide(horn_gain_);
      const float drum_gain = glide(drum_gain_);
      const float horn_angle = static_cast<float>(horn_angle_);
      const float drum_angle = static_cast<float>(drum_angle_);

      float wet[2];
      for (int k = 0; k < 2; ++k) {
        const float side = k == 0 ? -mic : mic;

        const float angle = horn_angle - side + 1.0f;
        const float towards = kit::SineTable::cos_lookup(angle);
        const float facing = 0.5f + 0.5f * towards;
        float beam = horn_line_.read_hermite(2.0f + horn_radius * (1.0f - towards));
        const float dark = shade_[k].lowpass(beam);
        beam += (dark - beam) * horn_shade * (1.0f - facing * facing);
        beam *= (1.0f - horn_am * (1.0f - facing)) * horn_makeup;
        float horn = direct * beam;
        if (reflect > 0.0f) {
          for (int j = 0; j < kNumReflections; ++j) {
            const float bounce = kit::SineTable::cos_lookup(angle + kReflectAngle[j]);
            horn += reflect * kReflectGain[j] *
                    horn_line_.read_linear(2.0f + kReflectSeconds[j] * sr +
                                           horn_radius * (1.0f - bounce));
          }
        }

        const float drum_towards = kit::SineTable::cos_lookup(drum_angle - 0.5f * side + 1.0f);
        const float drum = drum_line_.read_linear(2.0f + drum_radius * (1.0f - drum_towards)) *
                           (1.0f - drum_am * (0.5f - 0.5f * drum_towards)) * drum_makeup;

        wet[k] = horn * horn_gain + drum * drum_gain;
      }

      // Equal power from the sine table (exact at both ends).
      const float mix = 0.25f * glide(mix_);
      const float dry_gain = kit::SineTable::cos_lookup(mix);
      const float wet_gain = kit::SineTable::lookup(mix);
      out_left_[i] = in[0] * dry_gain + wet[0] * wet_gain;
      out_right_[i] = in[1] * dry_gain + wet[1] * wet_gain;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  enum Speed : int { kSlow = 0, kFast, kBrake };

  static constexpr int kControlPeriod = 16;
  static constexpr float kCrossoverHz = 800.0f;
  static constexpr float kHornHz[2] = {0.8f, 6.7f};
  static constexpr float kDrumHz[2] = {0.67f, 5.8f};
  // Time constants of each rotor speeding up and slowing down, and the
  // friction (Hz per second) that brings a braked rotor to rest.
  static constexpr float kHornUpSeconds = 0.25f;
  static constexpr float kHornDownSeconds = 0.5f;
  static constexpr float kDrumUpSeconds = 1.5f;
  static constexpr float kDrumDownSeconds = 1.9f;
  static constexpr float kBrakeFriction = 0.15f;
  static constexpr float kHornRadiusSeconds = 0.00055f;
  static constexpr float kDrumRadiusSeconds = 0.0002f;
  static constexpr float kHornAm = 0.75f;
  static constexpr float kDrumAm = 0.5f;
  static constexpr float kHornShade = 0.8f;
  static constexpr float kShadeHz = 2200.0f;
  static constexpr float kMaxMicCycles = 0.4f;
  static constexpr int kNumReflections = 2;
  static constexpr float kReflectAngle[kNumReflections] = {0.31f, 0.64f};
  static constexpr float kReflectSeconds[kNumReflections] = {0.0019f, 0.0037f};
  static constexpr float kReflectGain[kNumReflections] = {1.0f, -1.0f};
  static constexpr float kBias = 0.2f;
  static constexpr float kBiasOut = 0.196116135f;    // s(0.2)
  static constexpr float kBiasSlope = 0.942866035f;  // s'(0.2)

  // The amplifier: s(u) = u / sqrt(1 + u²) at u = gain·x + bias, averaged
  // over the step from the last sample. With S(u) = sqrt(1 + u²) that mean is
  // (S(u) - S(v)) / (u - v) = (u + v) / (S(u) + S(v)), which needs no special
  // case for a small step. Drive 0 is the input untouched.
  float tube(float x, float drive, float level) {
    if (drive <= 0.0f) return x;
    const float u = (1.0f + 5.0f * drive) * x + kBias;
    const float root = std::sqrt(1.0f + u * u);
    const float shaped = (u + last_u_) / (root + last_root_);
    last_u_ = u;
    last_root_ = root;
    const float amount = kit::min(1.0f, 4.0f * drive);
    return x + ((shaped - kBiasOut) * level - x) * amount;
  }

  static float approach(float speed, float target, float up_seconds, float down_seconds,
                        float acceleration, float dt, bool braking) {
    const float seconds = (target > speed ? up_seconds : down_seconds) / acceleration;
    speed += (target - speed) * kit::min(1.0f, dt / seconds);
    if (braking) {
      speed -= kBrakeFriction * acceleration * dt;
      if (speed < 0.0f) speed = 0.0f;
    }
    return speed;
  }

  // Every 16 samples: rotor speeds, and everything derived from the controls.
  void control(float sr) {
    using namespace rotary;
    const float dt = static_cast<float>(kControlPeriod) / sr;
    const float acceleration = param(kAcceleration);
    const bool braking = speed_ == kBrake;
    const float horn_target = braking ? 0.0f : kHornHz[speed_];
    const float drum_target = braking ? 0.0f : kDrumHz[speed_];
    if (!started_) {
      horn_speed_ = horn_target;
      drum_speed_ = drum_target;
    } else {
      horn_speed_ = approach(horn_speed_, horn_target, kHornUpSeconds, kHornDownSeconds,
                             acceleration, dt, braking);
      drum_speed_ = approach(drum_speed_, drum_target, kDrumUpSeconds, kDrumDownSeconds,
                             acceleration, dt, braking);
    }

    const float horn_depth = param(kHornDepth);
    const float drum_depth = param(kDrumDepth);
    const float distance = param(kDistance);
    const float horn_am = horn_depth * kHornAm * (1.0f - 0.6f * distance);
    const float drum_am = drum_depth * kDrumAm * (1.0f - 0.5f * distance);
    horn_radius_.set(horn_depth * kHornRadiusSeconds, started_);
    horn_am_.set(horn_am, started_);
    horn_shade_.set(horn_depth * kHornShade * (1.0f - 0.5f * distance), started_);
    horn_makeup_.set(swing_makeup(horn_am), started_);
    drum_radius_.set(drum_depth * kDrumRadiusSeconds, started_);
    drum_am_.set(drum_am, started_);
    drum_makeup_.set(swing_makeup(drum_am), started_);
    // Direct and two reflections keep about the same power at any distance.
    direct_.set(1.0f - 0.2f * distance, started_);
    reflect_.set(0.4f * distance, started_);
    // Unity slope at rest (the bias flattens it a little), then the make-up.
    const float gain = 1.0f + 5.0f * param(kDrive);
    drive_level_.set(std::pow(gain, 0.3f) / (gain * kBiasSlope), started_);
    mic_.set(0.5f * kMaxMicCycles * param(kSpread), started_);
    const float balance = param(kBalance);
    horn_gain_.set(1.41421356f * kit::SineTable::lookup(0.25f * balance), started_);
    drum_gain_.set(1.41421356f * kit::SineTable::cos_lookup(0.25f * balance), started_);
    started_ = true;
  }

  // A settled smoother costs one comparison.
  static float glide(kit::Smoother& smoother) {
    return smoother.value == smoother.target ? smoother.value : smoother.next();
  }

  // Keeps the mean power of a gain that swings between 1 and 1 - am at unity.
  static float swing_makeup(float am) {
    const float mean = 1.0f - 0.5f * am;
    return 1.0f / std::sqrt(mean * mean + 0.125f * am * am);
  }

  void apply(int id) {
    using namespace rotary;
    const float value = param(id);
    switch (id) {
      case kSpeed:
        speed_ = kit::clamp_int(static_cast<int>(value + 0.5f), 0, 2);
        break;
      case kDrive:
        drive_.set(value, primed());
        break;
      case kMix:
        mix_.set(value, primed());
        break;
      default:
        break;  // the rest is read on the control clock
    }
  }

  struct SmootherList {
    kit::Smoother* items[15];
    kit::Smoother** begin() { return items; }
    kit::Smoother** end() { return items + 15; }
  };
  SmootherList smoothers() {
    return {{&drive_, &drive_level_, &mix_, &horn_radius_, &horn_am_, &horn_shade_, &horn_makeup_,
             &drum_radius_, &drum_am_, &drum_makeup_, &direct_, &reflect_, &mic_, &horn_gain_,
             &drum_gain_}};
  }

  kit::DelayLine<1024> horn_line_;  // 3.7 ms of reflection and the swing, at 96 kHz
  kit::DelayLine<128> drum_line_;
  kit::Svf split_;
  kit::DcBlocker dc_;
  kit::OnePole shade_[2];
  kit::Smoother drive_, drive_level_, mix_;
  kit::Smoother horn_radius_, horn_am_, horn_shade_, horn_makeup_;
  kit::Smoother drum_radius_, drum_am_, drum_makeup_;
  kit::Smoother direct_, reflect_, mic_, horn_gain_, drum_gain_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  double horn_angle_ = 0.0;  // cycles
  double drum_angle_ = 0.0;
  float horn_speed_ = 0.0f;  // Hz
  float drum_speed_ = 0.0f;
  float last_u_ = 0.0f;
  float last_root_ = 1.0f;
  int speed_ = kSlow;
  bool started_ = false;
};

}  // namespace livemix
