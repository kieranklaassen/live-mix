#pragma once

// Radio: a sound sent over a radio link and received at night.
//
//   in (L+R) ─► transmitter low-pass ─► limiter ─► modulate ─► two-path sky wave ─►(+)─►
//                                        (AM: carrier + programme;                  ▲
//                                         Sideband: analytic programme)     static, neighbours
//
//   ─► tuning (× e^jθ) ─► IF filter ─┬─► detector ─► audio high-pass ─► × AGC ─► speaker ─► out
//                                    └─► level ─► AGC law
//
// Everything between the modulator and the detector is the complex envelope
// of the radio signal around the station's carrier, so each stage is the
// physical one at audio rate.
//
// - Medium wave and Shortwave are amplitude modulation: a carrier of 1 with
//   the programme on it at a depth of 0.8, after the station's limiter. The
//   receiver's filter is a low-pass on that envelope (eighth-order
//   Butterworth each on the real and imaginary parts), so its half-width is
//   the audio bandwidth. The detector is the magnitude.
// - Tuning turns the signal before the filter. Off-tune, one sideband runs
//   out of the filter before the other and, far enough off, the carrier
//   slides down the skirt: the programme thins, sinks and breaks up, and
//   what is left is noise and the neighbours. The detector also sees a
//   little of the receiver's own frequency (as an oscillating detector
//   does), which beats with the carrier: a whistle at exactly the offset,
//   down to zero beat when tuned in. The dial is square-law, ±5.5 kHz.
// - Sideband has no carrier. The station sends the analytic programme (the
//   upper sideband, kit::Hilbert); the filter sits beside where the carrier
//   would be, from the low edge to the high edge; the detector multiplies by
//   the receiver's own oscillator. Tuning (±400 Hz, linear) moves that
//   oscillator, so every frequency comes out shifted by the same number of
//   hertz and the other sideband is rejected by the filter, as in a real
//   set.
// - The sky wave is two paths (radio_parts::Propagation): a flat fade over
//   seconds on both, and a late path 0.5 to 2 ms behind whose carrier phase
//   keeps turning, which walks a comb of notches through the audio. The late
//   path is strongest when the flat fade is deepest: a strong signal is
//   clean, a sinking one hollows.
// - Static and the neighbours are added at the aerial, before the filter and
//   the gain. The automatic gain follows the signal strength after the
//   filter with a square-root law (a 20 dB fade leaves the programme 10 dB
//   down and brings the noise 10 dB up), up to +15 dB with a carrier and
//   +12 dB on Sideband, where it follows the programme itself (fast attack,
//   1.4 s release) and so lets the noise rush up in the gaps.
// - The loudspeaker is a resonant high-pass (40 to 380 Hz), a presence peak
//   at 1.9 kHz, a soft off-centre overload and a low-pass (16 to 2.6 kHz).
//   The programme is band-limited before it, so the overload's harmonics
//   stay under the low-pass and no oversampling is needed.
// - Output is mono, as one loudspeaker is; Mix is a linear crossfade against
//   the stereo input.
// - The receiver is only on while the device is awake: it stays on for 4 s
//   after the input stops (carrier, static, neighbours), fades over 1.5 s,
//   and the device then sleeps with exactly zero output. Changing Band dips
//   the output for a few milliseconds around the switch.
// - Every random source is seeded in init().

#include "../../kit/kit.h"
#include "params.gen.h"
#include "radio_parts.h"

namespace livemix {

class Radio : public kit::DeviceBase<radio::kNumParams> {
 public:
  enum Band : int { kMediumWave = 0, kShortwave, kSideband, kBands };
  // Seconds the receiver stays on after the input stops, and its fade.
  static constexpr float kHoldSeconds = 4.0f;
  static constexpr float kFallSeconds = 1.5f;

  void init(float sample_rate) {
    using namespace radio;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    transmit_.reset();
    hilbert_.reset();
    path_re_.clear();
    path_im_.clear();
    if_re_.reset();
    if_im_.reset();
    audio_high_.reset();
    audio_low_.reset();
    cone_high_.reset();
    cone_peak_.reset();
    cone_peak_.set_identity();
    cone_low_.reset();
    dc_.reset();
    dc_.set_cutoff(15.0f, sr);
    propagation_.reset(sr);
    atmospherics_.reset(sr);
    neighbour_[0].reset(0x452821E6u, 0.25f, sr);
    neighbour_[1].reset(0x38D01377u, 1.1f, sr);
    wander_.seed(0xBE5466CFu);
    wander_.set_rate(0.07f, sr);

    shift_.set_time(0.02f, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    fade_.set_time(0.004f, sr);
    fade_.snap(1.0f);
    tune_phase_ = 0.0;
    centre_phase_ = 0.0;
    level_ = 1.0f;
    low_hz_ = high_hz_ = cone_ = fading_ = width_ = -1.0f;
    gate_ = 0.0f;
    gate_rise_ = 1.0f / (0.003f * sr);
    gate_fall_ = 1.0f / (kFallSeconds * sr);
    hold_samples_ = static_cast<long>(kHoldSeconds * sr);
    drain_samples_ = hold_samples_ + static_cast<long>((kFallSeconds + 0.1f) * sr);
    quiet_ = drain_samples_;
    started_ = false;
    clock_.reset(kControlPeriod);
    idle_.reset(sr, 0.05f);
    band_ = kit::clamp_int(static_cast<int>(param(kBand) + 0.5f), 0, kBands - 1);
    pending_band_ = band_;
    load_band();
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    using namespace radio;
    frames = begin_block(frames);
    // Awake while there is input and until the receiver has faded out after it.
    if (!idle_.wake(input_present(frames) || quiet_ < drain_samples_)) {
      silence_output(frames);
      return;
    }
    const float sr = sample_rate();
    const double inverse_sr = 1.0 / static_cast<double>(sr);
    for (int i = 0; i < frames; ++i) {
      float left, right;
      take_input(i, &left, &right);
      if (clock_.tick()) control(sr);
      const BandSpec& band = kBandSpec[band_];

      // The station: band-limited, limited, and put on its carrier.
      float programme = 0.5f * (left + right);
      if (!(programme > -64.0f && programme < 64.0f)) programme = 0.0f;
      programme = kit::soft_clip(transmit_.lowpass(programme));
      // With a carrier the programme rides on it, in phase. Without one the
      // station sends the upper sideband alone: kit::Hilbert's quadrature
      // output leads, so that is I - jQ.
      float sent_re, sent_im;
      if (band.carrier > 0.0f) {
        sent_re = band.carrier + band.depth * programme;
        sent_im = 0.0f;
      } else {
        float in_phase, quadrature;
        hilbert_.process(programme, &in_phase, &quadrature);
        sent_re = band.depth * in_phase;
        sent_im = -band.depth * quadrature;
      }

      // The sky wave: the direct path and a late one with a turning phase.
      const float delay = delay_.next();
      const float echo_re = path_re_.read_hermite(delay);
      const float echo_im = path_im_.read_hermite(delay);
      path_re_.write(sent_re);
      path_im_.write(sent_im);
      const float direct = direct_.next();
      const float late_re = late_re_.next();
      const float late_im = late_im_.next();
      float re = direct * sent_re + late_re * echo_re - late_im * echo_im;
      float im = direct * sent_im + late_re * echo_im + late_im * echo_re;

      // What else is on the air.
      float noise_re, noise_im;
      atmospherics_.sample(noise_gain_.next(), &noise_re, &noise_im);
      re += noise_re;
      im += noise_im;
      for (radio_parts::Interferer& neighbour : neighbour_) {
        if (neighbour.active()) neighbour.sample(&re, &im);
      }

      // Tuning: turn the signal so the receiver's filter sits where the dial
      // says. With a carrier, off-tune moves the station off the centre of
      // the filter; on Sideband the filter's centre is beside the (missing)
      // carrier and the dial slides the audio along.
      const float centre = centre_.next();
      const float offset = shift_.next();
      const float turn = band.carrier > 0.0f ? -offset : offset - centre;
      tune_phase_ += static_cast<double>(turn) * inverse_sr;
      tune_phase_ -= std::floor(tune_phase_);
      const float tune = static_cast<float>(tune_phase_);
      const float cosine = kit::SineTable::cos_lookup(tune);
      const float sine = kit::SineTable::lookup(tune);
      const float if_re = if_re_.lowpass(re * cosine - im * sine);
      const float if_im = if_im_.lowpass(re * sine + im * cosine);

      // Signal strength for the automatic gain.
      const float strength = std::sqrt(if_re * if_re + if_im * if_im);
      level_ = flush_denormal(strength + (level_ - strength) * (strength > level_ ? attack_ : release_));

      // The detector: the envelope where there is a carrier, a product with
      // the receiver's own oscillator where there is none.
      float audio;
      if (band.carrier > 0.0f) {
        const float with_own = if_re + kRegeneration;
        audio = std::sqrt(with_own * with_own + if_im * if_im) / band.depth;
      } else {
        centre_phase_ += static_cast<double>(centre) * inverse_sr;
        centre_phase_ -= std::floor(centre_phase_);
        const float beat = static_cast<float>(centre_phase_);
        audio = if_re * kit::SineTable::cos_lookup(beat) - if_im * kit::SineTable::lookup(beat);
      }
      // The detector's own filter: an envelope has corners where the carrier
      // is lost, and they are not programme.
      audio = audio_high_.highpass(audio_low_.lowpass(audio)) * agc_gain_.next();

      // The loudspeaker.
      float cone = cone_peak_.process(cone_high_.highpass(audio));
      const float drive = drive_.next();
      const float pushed =
          (kit::fast_tanh(cone * drive + kConeBias) - kConeBiasOut) * kConeSlope / drive;
      cone += blend_.next() * (pushed - cone);
      cone = cone_low_.lowpass(cone) * band.trim;
      // The audio amplifier's rails; the off-centre cone leaves a little DC.
      float wet = kit::soft_clip(dc_.process(cone));

      // The set stays on for a few seconds after the input stops, then fades.
      if (left > kQuiet || left < -kQuiet || right > kQuiet || right < -kQuiet) {
        quiet_ = 0;
      } else if (quiet_ < drain_samples_) {
        ++quiet_;
      }
      if (quiet_ < hold_samples_) {
        gate_ = kit::min(1.0f, gate_ + gate_rise_);
      } else {
        gate_ = kit::max(0.0f, gate_ - gate_fall_);
      }
      wet *= gate_ * gate_ * fade_.next();

      const float mix = mix_.next();
      out_left_[i] = left * (1.0f - mix) + wet * mix;
      out_right_[i] = right * (1.0f - mix) + wet * mix;
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kControlPeriod = 32;
  static constexpr float kQuiet = 1.0e-6f;
  // The oscillating detector of a simple set: a little of the receiver's own
  // frequency at the detector, which beats with an off-tune carrier.
  static constexpr float kRegeneration = 0.05f;
  // The cone's soft overload sits off centre; these take its output at rest
  // and its slope there back out (kit::fast_tanh at 0.2).
  static constexpr float kConeBias = 0.2f;
  static constexpr float kConeBiasOut = 0.197661f;
  static constexpr float kConeSlope = 1.036030f;

  struct BandSpec {
    float low_narrow, low_wide;    // audio low edge at Bandwidth 0 and 1, Hz
    float high_narrow, high_wide;  // audio high edge
    float transmit_hz;             // what the station sends
    float carrier, depth;          // carrier level and modulation depth
    float tune_hz;                 // Tuning at ±1
    bool tune_square;              // square-law dial (fine near the station)
    float drift_hz;                // Drift at 1
    radio_parts::Propagation::Style path;
    float agc_max, agc_reference, agc_attack, agc_release;
    float trim;
  };
  static constexpr BandSpec kBandSpec[kBands] = {
      {110.0f, 60.0f, 2800.0f, 6000.0f, 6500.0f, 1.0f, 0.8f, 5500.0f, true, 250.0f,
       {24.0f, 0.06f, 0.14f, 0.3f, 0.12f, 0.0005f}, 6.0f, 1.0f, 0.04f, 0.3f, 1.12f},
      {330.0f, 155.0f, 2400.0f, 5000.0f, 5500.0f, 1.0f, 0.8f, 5500.0f, true, 250.0f,
       {40.0f, 0.13f, 0.31f, 0.7f, 0.35f, 0.001f}, 6.0f, 1.0f, 0.04f, 0.3f, 1.26f},
      {350.0f, 180.0f, 2200.0f, 3200.0f, 3400.0f, 0.0f, 1.0f, 400.0f, false, 50.0f,
       {40.0f, 0.13f, 0.31f, 0.7f, 0.35f, 0.001f}, 4.0f, 0.3f, 0.006f, 1.4f, 1.41f},
  };

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

  void load_band() {
    const BandSpec& band = kBandSpec[band_];
    const float sr = sample_rate();
    propagation_.set_style(band.path, sr);
    transmit_.set(kit::min(band.transmit_hz, 0.45f * sr), sr, radio_parts::kButter4);
    attack_ = kit::time_to_coeff(band.agc_attack, sr);
    release_ = kit::time_to_coeff(band.agc_release, sr);
    level_ = band.agc_reference;
    hilbert_.reset();
    low_hz_ = high_hz_ = -1.0f;  // the filters jump to the new band
  }

  // Every 32 samples: everything derived from the controls, the slow
  // movements, and the dice for static and neighbours.
  void control(float sr) {
    using namespace radio;
    const bool snap = !started_;
    const float inverse = 1.0f / static_cast<float>(kControlPeriod);

    // A change of band dips the output for a few milliseconds around it.
    if (pending_band_ != band_) {
      fade_.set_target(0.0f);
      if (fade_.value < 0.002f) {
        band_ = pending_band_;
        load_band();
      }
    } else {
      fade_.set_target(1.0f);
    }
    const BandSpec& band = kBandSpec[band_];
    const bool jump = snap || low_hz_ < 0.0f;
    const bool carrier = band.carrier > 0.0f;

    // The receiver's filter. With a carrier the IF passes both sidebands,
    // so its half-width is the top of the audio; without one it sits beside
    // the missing carrier and passes low edge to high edge.
    const float width = param(kBandwidth);
    if (width != width_ || jump) {
      width_ = width;
      low_target_ = band.low_narrow * std::pow(band.low_wide / band.low_narrow, width);
      high_target_ =
          kit::min(band.high_narrow * std::pow(band.high_wide / band.high_narrow, width), 0.45f * sr);
    }
    const bool low_moved = glide(&low_hz_, low_target_, jump);
    const bool high_moved = glide(&high_hz_, high_target_, jump);
    if (low_moved || high_moved) {
      const float half = carrier ? high_hz_ : 0.5f * (high_hz_ - low_hz_);
      if_re_.set(half, sr, radio_parts::kButter8);
      if_im_.set(half, sr, radio_parts::kButter8);
      audio_high_.set(low_hz_, sr, radio_parts::kButter6);
      audio_low_.set(kit::min(1.1f * high_hz_, 0.45f * sr), sr, radio_parts::kButter4);
    }
    centre_.aim(carrier ? 0.0f : 0.5f * (high_hz_ + low_hz_), inverse, jump);

    // The loudspeaker: from a line output to a small cone in a box.
    if (glide(&cone_, param(kSpeaker), jump)) {
      cone_high_.set(40.0f * std::pow(9.5f, cone_), 0.7f + 0.7f * cone_, sr);
      cone_peak_.set_peak(1900.0f, 1.2f, 7.0f * cone_, sr);
      cone_low_.set(16000.0f * std::pow(0.1625f, cone_), 0.8f, sr);
    }
    drive_.aim(1.0f + 1.8f * cone_, inverse, jump);
    blend_.aim(cone_, inverse, jump);

    float direct, late_re, late_im, delay_s;
    glide(&fading_, param(kFading), snap);
    propagation_.tick(fading_, kControlPeriod, sr, &direct, &late_re, &late_im, &delay_s);
    direct_.aim(direct, inverse, jump);
    late_re_.aim(late_re, inverse, jump);
    late_im_.aim(late_im, inverse, jump);
    delay_.aim(kit::clamp(delay_s * sr, 2.0f, 500.0f), inverse, jump);

    // The dial: where it is set, and where it has wandered to.
    const float dial = param(kTuning);
    const float off = band.tune_square ? dial * (dial < 0.0f ? -dial : dial) : dial;
    shift_.set(band.tune_hz * off + band.drift_hz * param(kDrift) * wander_.next(kControlPeriod),
               started_ && !jump);

    noise_gain_.aim(atmospherics_.tick(param(kStatic), kControlPeriod, sr), inverse, snap);
    for (radio_parts::Interferer& neighbour : neighbour_) {
      neighbour.tick(param(kInterference), !carrier, high_hz_, kControlPeriod, sr, inverse, snap);
    }

    // Automatic gain: weak signals are pulled most of the way back up, and
    // the noise that came in with them comes up too.
    // A square-root law: a fade of 20 dB leaves the programme 10 dB down
    // and the noise 10 dB up.
    const float wanted = std::sqrt(band.agc_reference / (level_ + 1.0e-4f));
    agc_gain_.aim(kit::min(wanted, band.agc_max), inverse, jump);
    started_ = true;
  }

  void apply(int id) {
    using namespace radio;
    switch (id) {
      case kBand:
        pending_band_ = kit::clamp_int(static_cast<int>(param(id) + 0.5f), 0, kBands - 1);
        if (!primed()) {
          band_ = pending_band_;
          load_band();
        }
        break;
      case kMix:
        mix_.set(param(id), primed());
        break;
      default:
        break;  // the rest is read on the control clock
    }
  }

  radio_parts::Cascade<2> transmit_;
  kit::Hilbert hilbert_;
  kit::DelayLine<512> path_re_, path_im_;  // 2.2 ms at 96 kHz and room for the read
  radio_parts::Cascade<4> if_re_, if_im_;
  radio_parts::Cascade<3> audio_high_;
  radio_parts::Cascade<2> audio_low_;
  kit::Svf cone_high_, cone_low_;
  kit::Biquad cone_peak_;
  kit::DcBlocker dc_;
  radio_parts::Propagation propagation_;
  radio_parts::Atmospherics atmospherics_;
  radio_parts::Interferer neighbour_[2];
  kit::Drift wander_;
  kit::Smoother shift_, mix_, fade_;
  radio_parts::Glide direct_, late_re_, late_im_, delay_, noise_gain_, agc_gain_, centre_, drive_,
      blend_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  double tune_phase_ = 0.0;
  double centre_phase_ = 0.0;
  float level_ = 1.0f;
  float low_hz_ = -1.0f, high_hz_ = -1.0f, cone_ = -1.0f, fading_ = 0.0f;
  float width_ = -1.0f, low_target_ = 0.0f, high_target_ = 0.0f;
  float gate_ = 0.0f, gate_rise_ = 0.0f, gate_fall_ = 0.0f;
  long hold_samples_ = 1, drain_samples_ = 1, quiet_ = 1;
  float attack_ = 0.0f, release_ = 0.0f;
  int band_ = kShortwave;
  int pending_band_ = kShortwave;
  bool started_ = false;
};

}  // namespace livemix
