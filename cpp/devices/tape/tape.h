#pragma once

// Tape: what a tape machine does to a sound, as an insert.
//
//   in ─► × drive ─► [ 2x: emphasis ─► saturate ─► de-emphasis ─► transport ] ─►(+)─► low cut ─►
//                                                     (wow, flutter)             ▲
//                                                                              hiss
//        ─► head bump ─► playback roll-off ─► dropouts ─► × output ─► mix ─► out
//                          (speed, tone, age)                           ▲
//   in ─► delay (kLatency) ─────────────────────────────────────────────┘
//
// - The record stage runs at twice the sample rate (kit::Halfband2x). Highs
//   are boosted before the saturator and cut by the exact inverse after it:
//   quiet material passes flat, loud material loses treble first, the way tape
//   does. The saturator is u / sqrt(1 + u²) around a bias that grows with
//   Drive (so it makes even harmonics too, more when pushed), averaged over
//   each step by its antiderivative, which on top of the oversampling keeps
//   the fold-back of hard drive far under a bare shaper's. That averaging is
//   a two-point mean, which would cost 1.6 dB at 18 kHz; one pole lifts it
//   back to within 0.3 dB.
// - The make-up after the saturator holds a signal at -12 dBFS at the level
//   it came in for any Drive: quieter material comes up, louder is held back.
// - The transport is a delay read inside the 2x stage, so its interpolation
//   costs no treble. Its base is 384 samples, the largest excursion at
//   96 kHz; with the oversampler's 31 that is the fixed latency, and the dry
//   path is delayed to match. Both channels ride the same tape.
// - Wow at 1 is ±0.8 % of pitch (kit::Drift, so it never repeats); Flutter at
//   1 is ±0.3 %, a sine whose rate and depth wander. Age adds up to half
//   again. Each speed has its own rates: slower tape, slower wobble.
// - Speed picks the machine: head bump at 60, 70, 85 or 100 Hz and a
//   playback bandwidth of 18, 13, 8 or 5.5 kHz. Tone moves that bandwidth an
//   octave either way; Age takes up to an octave off and deepens the
//   level-dependent treble loss.
// - Dropouts are brief dips in level that take the treble further down than
//   the bass. Age 0 has none; at 1 there are two or three a second.
// - Hiss is only made while the device is awake: it carries on for a second
//   after the signal has gone, fades over 0.4 s, and then the device sleeps
//   and its output is exactly zero. A track with nothing on it stays silent.

#include "../../kit/kit.h"
#include "params.gen.h"

namespace livemix {

class Tape : public kit::DeviceBase<tape::kNumParams> {
 public:
  static constexpr int kBaseDelay = 384;
  // As reported in device.json (latencySamples).
  static constexpr int kLatency = kit::Halfband2x::kLatency + kBaseDelay;

  void init(float sample_rate) {
    using namespace tape;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int c = 0; c < 2; ++c) {
      oversample_[c].init();
      line_[c].clear();
      dry_[c].clear();
      boost_low_[c] = 0.0f;
      cut_low_[c] = 0.0f;
      last_e_[c] = 0.0f;
      last_root_[c] = 1.0f;
      tilt_[c] = 0.0f;
      low_cut_[c].reset();
      bump_[c].reset();
      roll_off_[c].reset();
      drop_low_[c].reset();
      drop_low_[c].set_cutoff(kDropoutSplitHz, sr);
      hiss_low_[c].reset();
      hiss_low_[c].set_cutoff(kHissTiltHz, sr);
    }
    hiss_rng_[0].seed(0x3C6EF372u);
    hiss_rng_[1].seed(0xA54FF53Au);
    drop_rng_.seed(0x510E527Fu);
    emphasis_alpha_ = 1.0f - std::exp(-kit::kTwoPi * kEmphasisHz / (2.0f * sr));

    gain_.set_time(kSmoothingSeconds, sr);
    bias_.set_time(kSmoothingSeconds, sr);
    hiss_.set_time(kSmoothingSeconds, sr);
    output_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    // A change of depth moves the read point, so these two go slowly. They
    // are stepped on the control clock.
    wow_depth_.set_time(0.06f, sr / kControlPeriod);
    flutter_depth_.set_time(0.06f, sr / kControlPeriod);

    wow_drift_.seed(0x51ED270Bu);
    flutter_rate_wander_.seed(0x9E3779B9u);
    flutter_rate_wander_.set_rate(0.7f, sr);
    flutter_depth_wander_.seed(0x7F4A7C15u);
    flutter_depth_wander_.set_rate(1.3f, sr);
    flutter_phase_ = 0.0f;
    wobble_ = 0.0f;
    wobble_step_ = 0.0f;
    bias_out_ = 0.0f;
    level_ = 1.0f;
    dry_gain_ = 0.0f;
    wet_gain_ = 1.0f;

    emphasis_ = -1.0f;
    bump_hz_ = -1.0f;
    bump_db_ = -1.0f;
    cutoff_ = -1.0f;
    drop_left_ = 0;
    drop_length_ = 1;
    drop_depth_ = 0.0f;
    drop_weight_[0] = drop_weight_[1] = 1.0f;

    hiss_gate_ = 0.0f;
    hiss_rise_ = 1.0f / (kHissRiseSeconds * sr);
    hiss_fall_ = 1.0f / (kHissFallSeconds * sr);
    hold_samples_ = static_cast<long>(kHissHoldSeconds * sr);
    // Hold, fade, and a little for the filters to empty.
    drain_samples_ = hold_samples_ + static_cast<long>((kHissFallSeconds + 0.3f) * sr);
    quiet_ = drain_samples_;

    started_ = false;
    refresh_ = true;
    clock_.reset(kControlPeriod);
    idle_.reset(sr, 0.05f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  // The readings named by "meters" in device.json, for a display to draw:
  // the pitch the wow has it at now (per cent off true), where the flutter
  // is in its cycle (0..1) and how far it bends the pitch at its peaks (per
  // cent), how many dropouts there have been (wraps at 2^20) and how deep
  // the latest is (0..1), and how far the hiss is up (0..1).
  float meter(int index) const {
    switch (index) {
      case 0:
        return -100.0f * wow_rate_;
      case 1:
        return flutter_phase_;
      case 2:
        return 100.0f * flutter_depth_.value * flutter_scale_ * kit::kTwoPi * kFlutterHz[speed_];
      case 3:
        return static_cast<float>(drop_count_ & 0xFFFFF);
      case 4:
        return drop_depth_;
      case 5:
        return hiss_gate_;
      default:
        return 0.0f;
    }
  }

  void process(int frames) {
    using namespace tape;
    frames = begin_block(frames);
    // Awake while there is input, and until the transport, the hiss fade and
    // the filters have emptied, whatever Mix lets through.
    if (!idle_.wake(input_present(frames) || quiet_ < drain_samples_)) {
      silence_output(frames);
      return;
    }
    const float sr = sample_rate();
    const float max_delay = static_cast<float>(4 * kBaseDelay - 4);
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      if (clock_.tick()) control(sr);

      // The transport: where the playback head is, in 2x samples. The
      // wobble is worked out on the control clock and ramped between ticks;
      // the fraction of a sample is the saturator's averaging, taken back out.
      wobble_ += wobble_step_;
      const float delay =
          kit::clamp(2.0f * (static_cast<float>(kBaseDelay) + wobble_ * sr) - kAveragingDelay, 2.0f,
                     max_delay);
      // Both 2x samples of this frame are read at the same fraction, so the
      // Hermite weights are worked out once.
      const int whole = static_cast<int>(delay);
      const float t = delay - static_cast<float>(whole);
      const float t2 = t * t, t3 = t2 * t;
      const float weights[4] = {-0.5f * t + t2 - 0.5f * t3, 1.0f - 2.5f * t2 + 1.5f * t3,
                                0.5f * t + 2.0f * t2 - 1.5f * t3, -0.5f * t2 + 0.5f * t3};

      // The saturator's working point. The bias moves the curve off centre;
      // its output at rest and its slope there are taken back out, and the
      // make-up holds a -12 dBFS signal where it was.
      if (!gain_.settled() || !bias_.settled() || refresh_) {
        const float gain = gain_.next();
        const float bias = bias_.next();
        const float bias_root = std::sqrt(1.0f + bias * bias);
        bias_out_ = bias / bias_root;
        level_ = std::sqrt(1.0f + kReferenceLevel * kReferenceLevel * gain * gain) * bias_root *
                 bias_root * bias_root / gain;
      }
      if (!mix_.settled() || refresh_) {
        const float mix = 0.25f * mix_.next();
        dry_gain_ = kit::SineTable::cos_lookup(mix);  // equal power, exact at both ends
        wet_gain_ = kit::SineTable::lookup(mix);
      }
      refresh_ = false;
      const float gain = gain_.value;
      const float bias = bias_.value;
      const float hiss = hiss_.settled() ? hiss_.value : hiss_.next();
      const float output = output_.settled() ? output_.value : output_.next();

      // A dropout in progress: a smooth dip, sin² over its length.
      float dip = 0.0f;
      if (drop_left_ > 0) {
        const float along =
            static_cast<float>(drop_length_ - drop_left_) / static_cast<float>(drop_length_);
        const float half_sine = kit::SineTable::lookup(0.5f * along);
        dip = drop_depth_ * half_sine * half_sine;
        --drop_left_;
      }

      float wet[2];
      bool sounding = in[0] > kQuiet || in[0] < -kQuiet || in[1] > kQuiet || in[1] < -kQuiet;
      for (int c = 0; c < 2; ++c) {
        float first, second;
        oversample_[c].up(in[c], &first, &second);
        first = record(c, first * gain, bias, whole, weights);
        second = record(c, second * gain, bias, whole, weights);
        float x = oversample_[c].down(first, second);
        sounding = sounding || x > kQuiet || x < -kQuiet;

        const float hiss_now = hiss * hiss_gate_;
        if (hiss_now > 0.0f) {
          const float white = hiss_rng_[c].bipolar();
          x += hiss_now * (white - kHissTilt * hiss_low_[c].lowpass(white));
        }
        x = roll_off_[c].lowpass(bump_[c].process(low_cut_[c].process(x)));

        // The treble dips twice as far (in dB) as the bass.
        const float keep = 1.0f - dip * drop_weight_[c];
        const float low = drop_low_[c].lowpass(x);
        wet[c] = keep * (low + keep * (x - low)) * output;
      }

      // Hiss runs while there is signal on the tape and for a moment after.
      if (sounding) {
        quiet_ = 0;
      } else if (quiet_ < drain_samples_) {
        ++quiet_;
      }
      if (quiet_ < hold_samples_) {
        hiss_gate_ = kit::min(1.0f, hiss_gate_ + hiss_rise_);
      } else {
        hiss_gate_ = kit::max(0.0f, hiss_gate_ - hiss_fall_);
      }

      out_left_[i] = dry_[0].read(kLatency) * dry_gain_ + wet[0] * wet_gain_;
      out_right_[i] = dry_[1].read(kLatency) * dry_gain_ + wet[1] * wet_gain_;
      dry_[0].write(in[0]);
      dry_[1].write(in[1]);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kControlPeriod = 16;
  static constexpr int kNumSpeeds = 4;
  // Per speed: 15 ips, 7.5 ips, 3.75 ips, Cassette.
  static constexpr float kWowHz[kNumSpeeds] = {1.0f, 0.8f, 0.65f, 0.5f};
  static constexpr float kFlutterHz[kNumSpeeds] = {9.5f, 8.0f, 6.5f, 5.5f};
  static constexpr float kBumpHz[kNumSpeeds] = {60.0f, 70.0f, 85.0f, 100.0f};
  static constexpr float kBandwidthHz[kNumSpeeds] = {18000.0f, 13000.0f, 8000.0f, 5500.0f};
  static constexpr float kHissDb[kNumSpeeds] = {0.0f, 3.0f, 6.0f, 9.0f};
  // Peak pitch deviation at Wow 1 and Flutter 1 on new tape.
  static constexpr float kWowDeviation = 0.008f;
  static constexpr float kFlutterDeviation = 0.003f;
  // kit::Drift's three sines have a combined peak slope of 1.032 x 2π·rate.
  static constexpr float kDriftSlope = 1.032f;
  static constexpr float kFlutterRateWander = 0.12f;
  static constexpr float kFlutterDepthWander = 0.25f;
  static constexpr float kAgeWobble = 0.5f;
  // Record emphasis: highs above 3.5 kHz up by 1 + k before the saturator.
  static constexpr float kEmphasisHz = 3500.0f;
  static constexpr float kEmphasis = 2.0f;
  static constexpr float kAgeEmphasis = 1.5f;
  static constexpr float kBias = 0.05f;
  static constexpr float kDriveBias = 0.25f;
  static constexpr float kReferenceLevel = 0.25f;  // -12 dBFS
  // The one pole that undoes most of the averaging's treble loss, and the
  // delay (in 2x samples) the pair leaves behind: 0.5 - a / (1 + a).
  static constexpr float kTilt = 0.45f;
  static constexpr float kAveragingDelay = 0.5f - kTilt / (1.0f + kTilt);
  static constexpr float kBumpDb = 5.0f;
  static constexpr float kBumpQ = 1.2f;
  static constexpr float kLowCutRatio = 0.4f;
  static constexpr float kDropoutsPerSecond = 2.5f;
  static constexpr float kDropoutSplitHz = 1500.0f;
  // Peak of the white noise that, tilted and played back at 15 ips, measures
  // -40 dBFS RMS at Hiss 1.
  static constexpr float kHissLevel = 0.0229f;
  static constexpr float kHissTiltHz = 1500.0f;
  static constexpr float kHissTilt = 0.7f;
  static constexpr float kHissHoldSeconds = 1.0f;
  static constexpr float kHissRiseSeconds = 0.03f;
  static constexpr float kHissFallSeconds = 0.4f;
  static constexpr float kQuiet = 1.0e-6f;

  // One 2x sample onto the tape, and the one under the playback head off it.
  float record(int c, float x, float bias, int whole, const float* weights) {
    // Emphasis: x + k·(x - lowpass(x)), written out so the inverse is exact.
    boost_low_[c] = flush_denormal(boost_low_[c] + emphasis_alpha_ * (x - boost_low_[c]));
    const float e = x + emphasis_ * (x - boost_low_[c]) + bias;
    // s(u) = u / sqrt(1 + u²) averaged over the step from the last sample:
    // (S(e) - S(e')) / (e - e') with S = sqrt(1 + u²) is (e + e') / (S + S').
    const float root = std::sqrt(1.0f + e * e);
    const float mean = (e + last_e_[c]) / (root + last_root_[c]) - bias_out_;
    last_e_[c] = e;
    last_root_[c] = root;
    tilt_[c] = flush_denormal((1.0f + kTilt) * mean - kTilt * tilt_[c]);
    const float shaped = tilt_[c];
    // De-emphasis: solve the boost for its input.
    const float held = emphasis_ * (1.0f - emphasis_alpha_);
    const float flat = (shaped + held * cut_low_[c]) * emphasis_inverse_;
    cut_low_[c] = flush_denormal(cut_low_[c] + emphasis_alpha_ * (flat - cut_low_[c]));

    const float played =
        weights[0] * line_[c].read(whole - 1) + weights[1] * line_[c].read(whole) +
        weights[2] * line_[c].read(whole + 1) + weights[3] * line_[c].read(whole + 2);
    line_[c].write(flat * level_);
    return played;
  }

  // Move towards a target a twentieth of the way per control tick.
  static bool glide(float* value, float target, bool snap) {
    if (*value == target) return false;
    const float step = (target - *value) * 0.05f;
    const float close = 1.0e-4f * (target < 0.0f ? -target : target) + 1.0e-6f;
    if (snap || (step < close && step > -close)) {
      *value = target;
    } else {
      *value += step;
    }
    return true;
  }

  // Every 16 samples: everything derived from the controls, and the dice
  // for the next dropout.
  void control(float sr) {
    using namespace tape;
    const bool snap = !started_;
    const float dt = static_cast<float>(kControlPeriod) / sr;
    const float age = param(kAge);
    const float worn = 1.0f + kAgeWobble * age;

    // Depths as seconds of read-point travel that give the stated pitch
    // deviation at this speed's rates.
    wow_depth_.set(
        param(kWow) * kWowDeviation * worn / (kit::kTwoPi * kWowHz[speed_] * kDriftSlope),
        started_);
    flutter_depth_.set(
        param(kFlutter) * kFlutterDeviation * worn / (kit::kTwoPi * kFlutterHz[speed_]), started_);
    // Flutter's rate wanders by ±12 %; its depth too, scaled so the wander
    // only ever takes depth away and Flutter 1 peaks at ±0.3 %.
    flutter_phase_ += static_cast<float>(kControlPeriod) * kFlutterHz[speed_] *
                      (1.0f + kFlutterRateWander * flutter_rate_wander_.next(kControlPeriod)) / sr;
    flutter_phase_ -= std::floor(flutter_phase_);
    const float flutter_scale =
        (1.0f + kFlutterDepthWander * flutter_depth_wander_.next(kControlPeriod)) /
        (1.0f + kFlutterDepthWander);
    const float wow = wow_depth_.next() * wow_drift_.next(kControlPeriod);
    const float wobble =
        wow + flutter_depth_.next() * flutter_scale * kit::SineTable::lookup(flutter_phase_);
    // For the display: how fast the wow moves the read point, and the
    // flutter's depth as it wanders.
    wow_rate_ = snap ? 0.0f : (wow - wow_seen_) / dt;
    wow_seen_ = wow;
    flutter_scale_ = flutter_scale;
    if (snap) wobble_ = wobble;
    wobble_step_ = (wobble - wobble_) * (1.0f / kControlPeriod);

    // Record level: -6 dB of drive at 0, +18 dB at 1.
    gain_.set(std::exp2(4.0f * param(kDrive) - 1.0f), started_);
    bias_.set(kBias + kDriveBias * param(kDrive), started_);
    if (snap) {
      // The saturator's memory starts at rest on the bias, not at zero.
      for (int c = 0; c < 2; ++c) {
        last_e_[c] = bias_.value;
        last_root_[c] = std::sqrt(1.0f + bias_.value * bias_.value);
      }
    }
    if (glide(&emphasis_, kEmphasis + kAgeEmphasis * age, snap)) {
      emphasis_inverse_ = 1.0f / (1.0f + emphasis_ * (1.0f - emphasis_alpha_));
    }

    // Playback equalisation.
    const bool bump_moved = glide(&bump_hz_, kBumpHz[speed_], snap);
    const bool gain_moved = glide(&bump_db_, kBumpDb * param(kBump), snap);
    if (bump_moved || gain_moved) {
      for (int c = 0; c < 2; ++c) {
        bump_[c].set_peak(bump_hz_, kBumpQ, bump_db_, sr);
        if (bump_moved) low_cut_[c].set_highpass(kLowCutRatio * bump_hz_, 0.6f, sr);
      }
    }
    const float bandwidth = kBandwidthHz[speed_] * std::exp2(2.0f * param(kTone) - 1.0f - age);
    if (glide(&cutoff_, kit::clamp(bandwidth, 300.0f, 0.45f * sr), snap)) {
      for (int c = 0; c < 2; ++c) roll_off_[c].set(cutoff_, kit::kSqrtHalf, sr);
    }

    const float hiss = param(kHiss);
    hiss_.set(hiss * hiss * kHissLevel * kit::db_to_gain(kHissDb[speed_]), started_);
    output_.set(kit::db_to_gain(param(kOutput)), started_);

    // Dropouts arrive at random: none on new tape, 2.5 a second at Age 1.
    // The dice are thrown every tick so the sequence does not depend on Age.
    const float chance = drop_rng_.uniform();
    const float size = drop_rng_.uniform();
    const float length = drop_rng_.uniform();
    const float left = drop_rng_.uniform();
    const float right = drop_rng_.uniform();
    if (drop_left_ <= 0 && chance < age * age * kDropoutsPerSecond * dt) {
      drop_depth_ = (0.25f + 0.65f * age) * (0.4f + 0.6f * size);
      drop_length_ = static_cast<int>((0.02f + (0.04f + 0.14f * age) * length) * sr);
      drop_left_ = drop_length_;
      ++drop_count_;
      // Each channel takes at least half of it: the tape lifts at one edge.
      drop_weight_[0] = 0.5f + 0.5f * left;
      drop_weight_[1] = 0.5f + 0.5f * right;
    }
    started_ = true;
  }

  void apply(int id) {
    using namespace tape;
    switch (id) {
      case kSpeed:
        speed_ = kit::clamp_int(static_cast<int>(param(id) + 0.5f), 0, kNumSpeeds - 1);
        wow_drift_.set_rate(kWowHz[speed_], sample_rate());
        break;
      case kMix:
        mix_.set(param(id), primed());
        break;
      default:
        break;  // the rest is read on the control clock
    }
  }

  kit::Halfband2x oversample_[2];
  kit::DelayLine<2048> line_[2];  // at 2x: twice the base delay and its excursion
  kit::DelayLine<512> dry_[2];
  kit::Biquad low_cut_[2], bump_[2];
  kit::Svf roll_off_[2];
  kit::OnePole drop_low_[2], hiss_low_[2];
  kit::Rng hiss_rng_[2], drop_rng_;
  kit::Smoother gain_, bias_, hiss_, output_, mix_, wow_depth_, flutter_depth_;
  kit::Drift wow_drift_, flutter_rate_wander_, flutter_depth_wander_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float boost_low_[2] = {0.0f, 0.0f};
  float cut_low_[2] = {0.0f, 0.0f};
  float last_e_[2] = {0.0f, 0.0f};
  float last_root_[2] = {1.0f, 1.0f};
  float tilt_[2] = {0.0f, 0.0f};
  float emphasis_alpha_ = 0.1f;
  float emphasis_ = 0.0f;
  float emphasis_inverse_ = 1.0f;
  float flutter_phase_ = 0.0f;
  float wobble_ = 0.0f;  // seconds the read point is off its base
  float wobble_step_ = 0.0f;
  float bias_out_ = 0.0f;
  float level_ = 1.0f;
  float dry_gain_ = 0.0f;
  float wet_gain_ = 1.0f;
  bool refresh_ = true;
  float bump_hz_ = 70.0f;
  float bump_db_ = 0.0f;
  float cutoff_ = 13000.0f;
  int drop_left_ = 0;
  int drop_length_ = 1;
  float drop_depth_ = 0.0f;
  float drop_weight_[2] = {1.0f, 1.0f};
  float hiss_gate_ = 0.0f;
  float hiss_rise_ = 0.0f;
  float hiss_fall_ = 0.0f;
  long hold_samples_ = 1;
  long drain_samples_ = 1;
  long quiet_ = 1;
  int speed_ = 1;
  bool started_ = false;
  // Kept for the display's readings only.
  float wow_seen_ = 0.0f;
  float wow_rate_ = 0.0f;
  float flutter_scale_ = 1.0f;
  int drop_count_ = 0;
};

}  // namespace livemix
