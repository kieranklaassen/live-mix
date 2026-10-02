#pragma once

// Patina: a sound put on a medium, as an insert. Reel tape, cassette, vinyl,
// radio, an early sampler or a hot valve preamp, each with its saturation,
// its unsteadiness, its narrowed band and its own noise.
//
//   in ─► × drive ─► [ 2x: emphasis ─► saturate ─► de-emphasis ─► transport ] ─► medium ─►(+)─►
//                                       (the medium's curve)       (wobble)               ▲
//                                                                                       noise
//        ─► low cut ─► high cut ─► tone ─► medium ─► × output ─► mix ─► out
//             (wear, tone)                                         ▲
//   in ─► delay (kLatency) ────────────────────────────────────────┘
//
// - Zero is clean. With Drive, Wobble, Wear and Noise at 0 and Tone in the
//   middle, every medium passes the signal delayed by kLatency and otherwise
//   untouched (within half a decibel from 40 Hz to 16 kHz). The medium only
//   chooses the character of what the four amounts add, so a host can fade
//   one in from nothing.
// - The record stage is Tape's: twice the sample rate (kit::Halfband2x), an
//   emphasis before the saturator and its exact inverse after, and the
//   transport as a delay read inside the 2x stage so its interpolation costs
//   no treble. The saturator and its curves are in patina_saturator.h.
// - Drive is the gain into the curve, -12 dB at 0 (where a signal sits in
//   the straight part) up to the medium's most. The make-up after it holds a
//   steady signal at -12 dBFS RMS where it came in: the output of the curve
//   for a sine at that level is measured on the control clock and divided
//   out. Quieter material comes up, louder is held back.
// - The transport's base is 240 samples, the largest excursion at 96 kHz;
//   with the oversampler's 31 that is the fixed latency, and the dry path is
//   delayed to match. Both channels ride the same transport.
// - Noise (patina_noise.h) is only made while the device is awake: it
//   carries on for three seconds after the signal has gone, fades over half
//   a second, and then the device sleeps and its output is exactly zero.
//   Drive does not touch it; Output and Mix do.
// - Changing Medium fades the worn signal into the clean, delayed one over
//   30 ms, changes everything while only the clean one sounds, and fades
//   back. Because zero is clean on every medium, that is a short moment
//   without character and not a gap.
//
// What the four amounts do on each medium (at 1 unless it says otherwise):
//
//   Reel      Drive: the tape curve around a growing bias, +18 dB into it,
//             treble emphasised so loud highs dull first. Wobble: wow of
//             ±0.6 % around 0.4 Hz that never repeats (kit::Drift) and
//             flutter of ±0.15 % near 7 Hz. Wear: 40 Hz to 7 kHz, a head
//             bump at 70 Hz, deeper treble loss.
//   Cassette  Drive: a knee and a lower ceiling, more emphasis: it squashes.
//             Wobble: wow of ±1.2 % around 0.8 Hz, flutter of ±0.4 % near
//             11 Hz. Wear: 60 Hz to 4.5 kHz, and dropouts, two or three a
//             second, that take the treble further down than the bass.
//   Vinyl     Drive: a gentle symmetrical curve behind a strong emphasis, so
//             the highs distort and the lows do not. Wobble: the off-centre
//             hole, a 0.556 Hz sine of ±0.5 % with a little second harmonic.
//             Wear: 50 Hz to 9 kHz, and the stereo below 150 Hz folded in.
//   Radio     Drive: a clip with one side much lower than the other, a
//             detector. Wobble: fading, the level drifting down by up to
//             9 dB and a shallow comb of 0.3 to 1.2 ms moving through it; no
//             pitch. Wear: 300 Hz to 3.2 kHz, four poles a side, and mono.
//   Sampler   Drive: bit depth, 18 bits down to 6 on a square-root law, so
//             a quiet tail crumbles before it is cut off. Wear: the sample
//             rate, held down to 6 kHz with no filter either side of the
//             hold; the images are the sound. Wobble: the hold clock's
//             period jitters by up to ±30 %. Tone below the middle is the
//             output filter, down to 1.5 kHz.
//   Valve     Drive: a soft side and a clipped side around a bias, +30 dB
//             into it. Wobble: sag, a slow follower of the input that turns
//             the output down by up to 5 dB when it is loud and up as much
//             when it is quiet, and pushes the bias: a loud passage starts
//             whole and gives way, a tail blooms. Wear: the transformer, a
//             bass emphasis so the low end saturates first, and 80 Hz to
//             6 kHz.
//
// Tone turns a shelf above 2.5 kHz by up to 6 dB either way and moves the
// high cut an octave with it. Output is the level of the worn signal; Mix is
// a linear crossfade against the delayed dry signal, since the two are
// coherent.

#include "../../kit/kit.h"
#include "params.gen.h"
#include "patina_noise.h"
#include "patina_saturator.h"

namespace livemix {

class Patina : public kit::DeviceBase<patina::kNumParams> {
 public:
  static constexpr int kBaseDelay = 240;
  // As reported in device.json (latencySamples).
  static constexpr int kLatency = kit::Halfband2x::kLatency + kBaseDelay;

  enum Medium : int { kReel = 0, kCassette, kVinyl, kRadio, kSampler, kValve, kNumMedia };

  void init(float sample_rate) {
    using namespace patina;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();
    for (int c = 0; c < 2; ++c) {
      oversample_[c].init();
      line_[c].clear();
      dry_[c].clear();
      drop_low_[c].set_cutoff(kDropoutSplitHz, sr);
    }
    side_low_.set_cutoff(kBassMonoHz, sr);
    noise_.init(sr);
    drop_rng_.seed(0x510E527Fu);
    jitter_rng_.seed(0x9B05688Cu);

    noise_level_.set_time(kSmoothingSeconds, sr);
    output_.set_time(kSmoothingSeconds, sr);
    mix_.set_time(kSmoothingSeconds, sr);
    // A change of depth moves the read point, so these two go slowly. They
    // are stepped on the control clock.
    wow_depth_.set_time(0.06f, sr / kControlPeriod);
    flutter_depth_.set_time(0.06f, sr / kControlPeriod);
    kit::LinearRamp* const ramps[] = {&gain_,        &level_, &bias_,   &fading_, &comb_time_,
                                      &comb_amount_, &sag_,   &narrow_, &fold_};
    for (kit::LinearRamp* ramp : ramps) {
      ramp->length = kControlPeriod;
      ramp->snap(0.0f);
    }
    glide_ = 1.0f - std::exp(-static_cast<float>(kControlPeriod) / (kGlideSeconds * sr));

    wow_drift_.seed(0x51ED270Bu);
    flutter_rate_wander_.seed(0x9E3779B9u);
    flutter_rate_wander_.set_rate(0.7f, sr);
    flutter_depth_wander_.seed(0x7F4A7C15u);
    flutter_depth_wander_.set_rate(1.3f, sr);
    fade_drift_.seed(0x2B992DDFu);
    fade_drift_.set_rate(kFadingHz, sr);
    comb_drift_.seed(0x6A09E667u);
    comb_drift_.set_rate(kCombHz, sr);
    flutter_phase_ = 0.0f;
    turn_phase_ = 0.0f;
    wobble_ = 0.0f;
    wobble_step_ = 0.0f;

    sag_attack_ = 1.0f - std::exp(-1.0f / (kSagAttackSeconds * sr));
    sag_release_ = 1.0f - std::exp(-1.0f / (kSagReleaseSeconds * sr));
    sag_env_ = 0.0f;
    swap_ = 0;
    fade_ = 1.0f;
    fade_step_ = 1.0f / (kSwapSeconds * sr);

    hiss_gate_ = 0.0f;
    hiss_rise_ = 1.0f / (kNoiseRiseSeconds * sr);
    hiss_fall_ = 1.0f / (kNoiseFallSeconds * sr);
    hold_samples_ = static_cast<long>(kNoiseHoldSeconds * sr);
    // Hold, fade, and a little for the filters to empty.
    drain_samples_ = hold_samples_ + static_cast<long>((kNoiseFallSeconds + 0.3f) * sr);
    quiet_ = drain_samples_;

    started_ = false;
    clock_.reset(kControlPeriod);
    idle_.reset(sr, 0.05f);
    medium_ = wanted_ = kReel;
    for (int id = 0; id < kNumParams; ++id) apply(id);
    enter_medium();
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) apply(id);
  }

  void process(int frames) {
    using namespace patina;
    frames = begin_block(frames);
    // Awake while there is input, and until the transport, the noise fade
    // and the filters have emptied, whatever Mix lets through.
    if (!idle_.wake(input_present(frames) || quiet_ < drain_samples_)) {
      silence_output(frames);
      return;
    }
    const float sr = sample_rate();
    const float max_delay = static_cast<float>(4 * kBaseDelay - 4);
    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      if (clock_.tick() || snap_) control(sr);
      const float worn = swap_ == 0 ? 1.0f : step_swap();

      // The transport: where the playback head is, in 2x samples. The
      // wobble is worked out on the control clock and ramped between ticks;
      // the fraction of a sample is the saturator's averaging, taken back out.
      wobble_ += wobble_step_;
      const float delay = kit::clamp(2.0f * (static_cast<float>(kBaseDelay) + wobble_ * sr) -
                                         patina_parts::Saturator::kAveragingDelay,
                                     2.0f, max_delay);
      // Both 2x samples of this frame are read at the same fraction, so the
      // Hermite weights are worked out once.
      const int whole = static_cast<int>(delay);
      const float t = delay - static_cast<float>(whole);
      const float t2 = t * t, t3 = t2 * t;
      const float weights[4] = {-0.5f * t + t2 - 0.5f * t3, 1.0f - 2.5f * t2 + 1.5f * t3,
                                0.5f * t + 2.0f * t2 - 1.5f * t3, -0.5f * t2 + 0.5f * t3};

      // The saturator's working point, ramped between control ticks.
      const float gain = gain_.next();
      float level = level_.next();
      // A slow follower of the input, kept running on every medium so the
      // valve finds it settled.
      const float left = in[0] < 0.0f ? -in[0] : in[0];
      const float right = in[1] < 0.0f ? -in[1] : in[1];
      const float loud = left > right ? left : right;
      sag_env_ = flush_denormal(sag_env_ +
                                (loud > sag_env_ ? sag_attack_ : sag_release_) * (loud - sag_env_));
      if (medium_ == kValve) {
        // Sag: the follower turns the output down and pushes the bias, more
        // the louder it has been. It is measured from where the follower
        // sits for the reference level, so that level stays where it was:
        // louder gives way, quieter comes up.
        const float depth = kSagDepth * sag_.next();
        level *= (1.0f + depth * kSagReference) / (1.0f + depth * sag_env_);
        settings_.bias = bias_.next() + kSagBias * depth * sag_env_;
        settings_.bias_out = settings_.curve.value(settings_.bias);
      } else if (bias_.remaining > 0) {
        settings_.bias = bias_.next();
        settings_.bias_out = settings_.curve.value(settings_.bias);
      }
      const float hiss =
          (noise_level_.settled() ? noise_level_.value : noise_level_.next()) * hiss_gate_;
      const float output = output_.settled() ? output_.value : output_.next();
      const float mix = mix_.settled() ? mix_.value : mix_.next();

      float noise[2] = {0.0f, 0.0f};
      if (hiss > 0.0f) {
        noise_.next(&noise[0], &noise[1]);
        noise[0] *= hiss;
        noise[1] *= hiss;
      }

      // The sampler's converter clock: one for both channels. It ticks
      // between two samples as a rule; `since` is how long ago, in samples,
      // and the converter takes the signal as it was then.
      bool latch = false;
      float since = 0.0f;
      if (medium_ == kSampler) {
        hold_phase_ += 1.0f;
        if (hold_phase_ >= hold_now_) {
          latch = true;
          since = kit::min(hold_phase_ - hold_now_, 1.0f);
          hold_phase_ -= hold_now_;
          hold_now_ = hold_period_ * (1.0f + jitter_ * jitter_rng_.bipolar());
          if (hold_phase_ >= hold_now_) hold_phase_ = 0.0f;
        }
      }
      // Radio: fading, and the short echo that combs it.
      float fading = 1.0f, comb_time = 1.0f, comb_amount = 0.0f;
      if (medium_ == kRadio) {
        fading = fading_.next();
        comb_time = comb_time_.next();
        comb_amount = comb_amount_.next();
      }
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
        first = record(c, first * gain, level, whole, weights);
        second = record(c, second * gain, level, whole, weights);
        float x = oversample_[c].down(first, second);
        sounding = sounding || x > kQuiet || x < -kQuiet;

        if (medium_ == kSampler) {
          if (latch) held_[c] = quantise(x - since * (x - before_[c])) + noise[c];
          before_[c] = x;
          x = held_[c];
        } else {
          if (medium_ == kRadio) {
            x *= fading;
            const float echo = comb_[c].read_linear(comb_time);
            comb_[c].write(x);
            x += comb_amount * echo;
          }
          x += noise[c];
        }

        x = low_cut_[c].process(x);
        if (medium_ == kRadio) x = low_cut_steep_[c].process(x);
        if (medium_ == kReel) x = bump_[c].process(x);
        x = high_cut_[c].lowpass(x);
        if (medium_ == kRadio) x = high_cut_steep_[c].lowpass(x);
        x = shelf_[c].process(x);

        if (medium_ == kCassette) {
          // The treble dips twice as far (in dB) as the bass.
          const float keep = 1.0f - dip * drop_weight_[c];
          const float low = drop_low_[c].lowpass(x);
          x = keep * (low + keep * (x - low));
        }
        wet[c] = x;
      }

      if (medium_ == kVinyl) {
        // What is out of phase in the bass cannot be cut: fold it in.
        const float low = side_low_.lowpass(0.5f * (wet[0] - wet[1]));
        const float folded = fold_.next() * low;
        wet[0] -= folded;
        wet[1] += folded;
      } else if (medium_ == kRadio) {
        const float narrow = narrow_.next();
        const float mid = 0.5f * (wet[0] + wet[1]);
        wet[0] = mid + narrow * (wet[0] - mid);
        wet[1] = mid + narrow * (wet[1] - mid);
      }

      // Noise runs while there is signal on the medium and for a while after.
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

      const float dry[2] = {dry_[0].read(kLatency), dry_[1].read(kLatency)};
      if (worn < 1.0f) {
        wet[0] = dry[0] + worn * (wet[0] - dry[0]);
        wet[1] = dry[1] + worn * (wet[1] - dry[1]);
      }
      const float wet_gain = output * mix;
      out_left_[i] = dry[0] * (1.0f - mix) + wet[0] * wet_gain;
      out_right_[i] = dry[1] * (1.0f - mix) + wet[1] * wet_gain;
      dry_[0].write(in[0]);
      dry_[1].write(in[1]);
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kControlPeriod = 16;

  // What a medium is, in numbers.
  struct Spec {
    bool hard_up, hard_down;         // each side of the curve: a knee and a clip, or soft
    float ceiling_up, ceiling_down;  // where each side ends
    float bias;                      // at Drive 1; it grows with the root of the gain
    float drive_octaves;             // Drive 1 is this many octaves over Drive 0
    bool bass_emphasis;              // the emphasis lifts the lows (a transformer), not the highs
    float emphasis_hz;               // 0: none
    float emphasis, emphasis_wear;   // its amount, and what Wear adds
    float wow_hz, wow_deviation;     // 0: the pitch does not move
    float flutter_hz, flutter_deviation;
    float low_hz, high_hz;  // the band at Wear 1
    float noise_db;         // the steady noise at Noise 1, dBFS RMS
  };
  static constexpr Spec kMedia[kNumMedia] = {
      // Reel
      {false, false, 1.0f, 1.0f, 0.3f, 5.0f, false, 3500.0f, 2.0f, 1.5f, 0.4f, 0.006f, 7.0f,
       0.0015f, 40.0f, 7000.0f, -43.0f},
      // Cassette
      {true, true, 0.7f, 0.7f, 0.12f, 5.0f, false, 3000.0f, 2.0f, 1.5f, 0.8f, 0.012f, 11.0f, 0.004f,
       60.0f, 4500.0f, -37.0f},
      // Vinyl
      {false, false, 1.0f, 1.0f, 0.0f, 3.32f, false, 3000.0f, 3.0f, 1.5f, 0.556f, 0.005f, 0.0f,
       0.0f, 50.0f, 9000.0f, -42.0f},
      // Radio
      {true, true, 1.0f, 0.4f, 0.8f, 5.0f, false, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 300.0f,
       3200.0f, -40.0f},
      // Sampler: the curve is left in its straight part, the band open
      {false, false, 1.0f, 1.0f, 0.0f, 0.0f, false, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 6.0f,
       40000.0f, -42.0f},
      // Valve
      {false, true, 1.2f, 0.6f, 1.7f, 6.98f, true, 150.0f, 0.0f, 3.0f, 0.0f, 0.0f, 0.0f, 0.0f,
       80.0f, 6000.0f, -40.0f},
  };

  // Drive 0: -12 dB into the curve.
  static constexpr float kDriveFloor = 0.25f;
  // The level the make-up holds: a sine of -12 dBFS RMS.
  static constexpr float kReferencePeak = 0.3548f;
  static constexpr int kReferencePoints = 32;
  // The band with Wear at 0: under and over anything that is heard.
  static constexpr float kOpenLowHz = 6.0f;
  static constexpr float kOpenHighHz = 40000.0f;
  static constexpr float kShelfHz = 2500.0f;
  static constexpr float kShelfDb = 12.0f;  // from one end of Tone to the other
  static constexpr float kGlideSeconds = 0.008f;
  static constexpr float kSwapSeconds = 0.03f;
  // kit::Drift's three sines have a combined peak slope of 1.032 x 2π·rate.
  static constexpr float kDriftSlope = 1.032f;
  static constexpr float kFlutterRateWander = 0.12f;
  static constexpr float kFlutterDepthWander = 0.25f;
  static constexpr float kWarp = 0.1f;  // second harmonic of the record's turn
  static constexpr float kBumpHz = 70.0f;
  static constexpr float kBumpQ = 1.2f;
  static constexpr float kBumpDb = 3.0f;
  static constexpr float kDropoutsPerSecond = 2.5f;
  static constexpr float kDropoutSplitHz = 1500.0f;
  static constexpr float kBassMonoHz = 150.0f;
  static constexpr float kFadingHz = 0.13f;
  static constexpr float kFadingDb = 9.0f;
  static constexpr float kCombHz = 0.09f;
  static constexpr float kCombAmount = 0.3f;
  static constexpr float kSamplerGain = 0.03125f;
  static constexpr float kSamplerBits = 18.0f;
  static constexpr float kSamplerBitsLost = 12.0f;
  static constexpr float kSamplerLowRateHz = 6000.0f;
  static constexpr float kSamplerJitter = 0.3f;
  static constexpr float kSagAttackSeconds = 0.1f;
  static constexpr float kSagReleaseSeconds = 0.7f;
  static constexpr float kSagDepth = 3.0f;
  static constexpr float kSagBias = 0.2f;
  // Where the follower settles for a sine at the reference level.
  static constexpr float kSagReference = 0.3228f;
  // Noise 0.3 is 24 dB under Noise 1.
  static constexpr float kNoiseCurve = 2.295f;
  static constexpr float kNoiseHoldSeconds = 3.0f;
  static constexpr float kNoiseRiseSeconds = 0.03f;
  static constexpr float kNoiseFallSeconds = 0.5f;
  static constexpr float kQuiet = 1.0e-6f;

  // One 2x sample onto the medium, and the one under the playback head off it.
  float record(int c, float x, float level, int whole, const float* weights) {
    const float flat = saturator_[c].process(x, settings_);
    const float played = weights[0] * line_[c].read(whole - 1) + weights[1] * line_[c].read(whole) +
                         weights[2] * line_[c].read(whole + 1) +
                         weights[3] * line_[c].read(whole + 2);
    line_[c].write(flat * level);
    return played;
  }

  // The sampler's converter: rounded on a square-root law, so the steps are
  // fine near zero and coarse at the top.
  float quantise(float x) const {
    const float magnitude = kit::min(x < 0.0f ? -x : x, 4.0f);
    const float step = std::floor(std::sqrt(magnitude) * steps_ + 0.5f) * steps_inverse_;
    return x < 0.0f ? -step * step : step * step;
  }

  // One sample of a medium change: down to the clean signal, change, back up.
  float step_swap() {
    if (swap_ < 0) {
      fade_ -= fade_step_;
      if (fade_ <= 0.0f) {
        fade_ = 0.0f;
        medium_ = wanted_;
        enter_medium();
        swap_ = 1;
      }
    } else {
      fade_ += fade_step_;
      if (fade_ >= 1.0f) {
        fade_ = 1.0f;
        swap_ = wanted_ == medium_ ? 0 : -1;
      }
    }
    return 0.5f - 0.5f * kit::SineTable::cos_lookup(0.5f * fade_);
  }

  // Set up for medium_ from rest. The next control tick snaps every value.
  void enter_medium() {
    const Spec& spec = kMedia[medium_];
    const float sr = sample_rate();
    settings_.curve.hard_up = spec.hard_up;
    settings_.curve.hard_down = spec.hard_down;
    settings_.curve.ceiling_up = spec.ceiling_up;
    settings_.curve.ceiling_down = spec.ceiling_down;
    settings_.alpha = 1.0f - std::exp(-kit::kTwoPi * spec.emphasis_hz / (2.0f * sr));
    wow_drift_.set_rate(spec.wow_hz, sr);
    noise_.set_medium(medium_);
    for (int c = 0; c < 2; ++c) {
      low_cut_[c].reset();
      low_cut_steep_[c].reset();
      bump_[c].reset();
      high_cut_[c].reset();
      high_cut_steep_[c].reset();
      shelf_[c].reset();
      drop_low_[c].reset();
      comb_[c].clear();
      held_[c] = 0.0f;
      before_[c] = 0.0f;
    }
    // The saturator's memory is in the old curve's terms.
    saturator_[0].reset(settings_);
    saturator_[1].reset(settings_);
    side_low_.reset();
    hold_phase_ = 0.0f;
    hold_now_ = 1.0f;
    drop_left_ = 0;
    drop_length_ = 1;
    drop_depth_ = 0.0f;
    drop_weight_[0] = drop_weight_[1] = 1.0f;
    snap_ = true;
  }

  // Move towards a target on the control clock, and land on it.
  bool glide(float* value, float target) const {
    if (*value == target) return false;
    const float step = (target - *value) * glide_;
    if (snap_ || (step < 1.0e-5f && step > -1.0e-5f)) {
      *value = target;
    } else {
      *value += step;
    }
    return true;
  }

  // Every 16 samples: everything derived from the controls, and the dice.
  void control(float sr) {
    using namespace patina;
    const Spec& spec = kMedia[medium_];
    const bool snap = snap_;
    const bool ramp = !snap;
    const float dt = static_cast<float>(kControlPeriod) / sr;
    const bool drive_moved = glide(&drive_, param(kDrive));
    const bool wear_moved = glide(&wear_, param(kWear));
    const bool tone_moved = glide(&tone_, param(kTone));
    glide(&sway_, param(kWobble));
    // The transport's depths have a slower smoother of their own.
    const float wobble_knob = param(kWobble);

    // The transport. Depths are seconds of read-point travel that give the
    // stated pitch deviation at this medium's rates.
    const float drift = wow_drift_.next(kControlPeriod);
    turn_phase_ += static_cast<float>(kControlPeriod) * spec.wow_hz / sr;
    turn_phase_ -= std::floor(turn_phase_);
    // Flutter's rate wanders by ±12 %; its depth too, scaled so the wander
    // only ever takes depth away.
    flutter_phase_ += static_cast<float>(kControlPeriod) * spec.flutter_hz *
                      (1.0f + kFlutterRateWander * flutter_rate_wander_.next(kControlPeriod)) / sr;
    flutter_phase_ -= std::floor(flutter_phase_);
    const float flutter_scale =
        (1.0f + kFlutterDepthWander * flutter_depth_wander_.next(kControlPeriod)) /
        (1.0f + kFlutterDepthWander);
    float wow_shape = 0.0f, wow_depth = 0.0f, flutter_depth = 0.0f;
    if (medium_ == kVinyl) {
      // An off-centre hole is a sine at the speed of the platter; a warp
      // adds its second harmonic.
      wow_shape = kit::SineTable::lookup(turn_phase_) +
                  kWarp * kit::SineTable::lookup(2.0f * turn_phase_ + 0.15f);
      wow_depth =
          wobble_knob * spec.wow_deviation / (kit::kTwoPi * spec.wow_hz * (1.0f + 2.0f * kWarp));
    } else if (spec.wow_hz > 0.0f) {
      wow_shape = drift;
      wow_depth = wobble_knob * spec.wow_deviation / (kit::kTwoPi * spec.wow_hz * kDriftSlope);
    }
    if (spec.flutter_hz > 0.0f) {
      flutter_depth = wobble_knob * spec.flutter_deviation / (kit::kTwoPi * spec.flutter_hz);
    }
    wow_depth_.set(wow_depth, ramp);
    flutter_depth_.set(flutter_depth, ramp);
    const float wobble = wow_depth_.next() * wow_shape + flutter_depth_.next() * flutter_scale *
                                                             kit::SineTable::lookup(flutter_phase_);
    if (snap) wobble_ = wobble;
    wobble_step_ = (wobble - wobble_) * (1.0f / kControlPeriod);

    // What Wobble is where the pitch does not move.
    const float fade_drift = fade_drift_.next(kControlPeriod);
    const float comb_drift = comb_drift_.next(kControlPeriod);
    if (medium_ == kRadio) {
      const float amount = kCombAmount * sway_;
      const float down = kit::clamp(0.5f + 0.55f * fade_drift, 0.0f, 1.0f);
      // The comb adds what its echo carries; that is taken out of the level.
      fading_.set(std::exp2(-kFadingDb * (1.0f / 6.0206f) * sway_ * down) /
                      std::sqrt(1.0f + amount * amount),
                  ramp);
      comb_amount_.set(amount, ramp);
      comb_time_.set(kit::clamp(0.00075f + 0.00045f * comb_drift, 0.0003f, 0.0012f) * sr, ramp);
      narrow_.set(1.0f - wear_, ramp);
    } else if (medium_ == kSampler) {
      jitter_ = kSamplerJitter * sway_;
    } else if (medium_ == kValve) {
      sag_.set(sway_, ramp);
    } else if (medium_ == kVinyl) {
      fold_.set(wear_, ramp);
    }

    // Drive: the gain into the curve, the bias, and the make-up that holds
    // a sine at the reference level where it was.
    if (drive_moved || snap) {
      // The sampler's Drive is its converter: the curve is kept far out of it.
      const float gain =
          medium_ == kSampler ? kSamplerGain : kDriveFloor * std::exp2(spec.drive_octaves * drive_);
      // The bias grows with the root of the gain, so it stays in proportion
      // to a loud signal and the two halves of a clipped wave are unequal.
      const float bias =
          spec.bias * drive_ * std::exp2(0.5f * spec.drive_octaves * (drive_ - 1.0f));
      const float rest = settings_.curve.value(bias);
      float sum = 0.0f, squares = 0.0f;
      for (int k = 0; k < kReferencePoints; ++k) {
        const float sine = kit::SineTable::lookup(static_cast<float>(k) / kReferencePoints);
        const float y = settings_.curve.value(gain * kReferencePeak * sine + bias) - rest;
        sum += y;
        squares += y * y;
      }
      // Without its mean: the low cut takes that out.
      const float mean = sum / kReferencePoints;
      const float power = kit::max(squares / kReferencePoints - mean * mean, 1.0e-12f);
      gain_.set(gain, ramp);
      bias_.set(bias, ramp);
      level_.set(kReferencePeak * kit::kSqrtHalf / std::sqrt(power), ramp);
      steps_ = std::exp2(kSamplerBits - 1.0f - kSamplerBitsLost * drive_);
      steps_inverse_ = 1.0f / steps_;
    }
    if (snap) {
      settings_.bias = bias_.value;
      settings_.bias_out = settings_.curve.value(bias_.value);
    }

    // Wear and Tone: the emphasis, the band, and each medium's damage.
    if (drive_moved || wear_moved || snap) {
      // The treble emphasis comes in with Drive (most of it by a third of
      // the way), so nothing is pushed into the curve at Drive 0.
      const float cool = (1.0f - drive_) * (1.0f - drive_);
      const float amount =
          spec.emphasis_hz > 0.0f ? spec.emphasis + spec.emphasis_wear * wear_ : 0.0f;
      if (spec.bass_emphasis) {
        settings_.set_emphasis(1.0f, amount);
      } else {
        const float treble = amount * (1.0f - cool * cool);
        settings_.set_emphasis(1.0f + treble, -treble);
      }
    }
    if (wear_moved || snap) {
      const float low = kOpenLowHz * std::pow(spec.low_hz / kOpenLowHz, wear_);
      for (int c = 0; c < 2; ++c) {
        if (medium_ == kRadio) {
          // Two sections make the four-pole Butterworth side.
          low_cut_[c].set_highpass(low, 0.5412f, sr);
          low_cut_steep_[c].set_highpass(low, 1.3066f, sr);
        } else {
          low_cut_[c].set_highpass(low, kit::kSqrtHalf, sr);
        }
        if (medium_ == kReel) bump_[c].set_peak(kBumpHz, kBumpQ, kBumpDb * wear_, sr);
      }
      hold_period_ = std::pow(kit::max(sr / kSamplerLowRateHz, 1.0f), wear_);
    }
    if (wear_moved || tone_moved || snap) {
      float high = kOpenHighHz * std::pow(spec.high_hz / kOpenHighHz, wear_) *
                   std::exp2(2.0f * tone_ - 1.0f);
      // The sampler has no band of its own: Tone below the middle closes
      // its output filter, down to 1.5 kHz at the bottom.
      if (medium_ == kSampler) high = kOpenHighHz * std::exp2(-9.5f * kit::max(0.5f - tone_, 0.0f));
      high = kit::clamp(high, 200.0f, 0.49f * sr);
      for (int c = 0; c < 2; ++c) {
        if (medium_ == kRadio) {
          high_cut_[c].set(high, 0.5412f, sr);
          high_cut_steep_[c].set(high, 1.3066f, sr);
        } else {
          high_cut_[c].set(high, kit::kSqrtHalf, sr);
        }
        if (tone_moved || snap) {
          shelf_[c].set_high_shelf(kShelfHz, kShelfDb * (tone_ - 0.5f), sr);
        }
      }
    }
    if (snap) {
      for (int c = 0; c < 2; ++c) saturator_[c].reset(settings_);
    }

    const float noise_knob = param(kNoise);
    noise_level_.set(std::pow(noise_knob, kNoiseCurve) * kit::db_to_gain(spec.noise_db), ramp);
    noise_.control(noise_knob, dt);
    output_.set(kit::db_to_gain(param(kOutput)), started_);

    // Dropouts arrive at random: none on a new cassette, 2.5 a second at
    // Wear 1. The dice are thrown every tick so the sequence does not
    // depend on Wear.
    const float chance = drop_rng_.uniform();
    const float size = drop_rng_.uniform();
    const float length = drop_rng_.uniform();
    const float left = drop_rng_.uniform();
    const float right = drop_rng_.uniform();
    if (medium_ == kCassette && drop_left_ <= 0 &&
        chance < wear_ * wear_ * kDropoutsPerSecond * dt) {
      drop_depth_ = 0.9f * std::sqrt(wear_) * (0.4f + 0.6f * size);
      drop_length_ = static_cast<int>((0.02f + (0.04f + 0.14f * wear_) * length) * sr);
      drop_left_ = drop_length_;
      // Each channel takes at least half of it: the tape lifts at one edge.
      drop_weight_[0] = 0.5f + 0.5f * left;
      drop_weight_[1] = 0.5f + 0.5f * right;
    }
    started_ = true;
    snap_ = false;
  }

  void apply(int id) {
    using namespace patina;
    switch (id) {
      case kMedium:
        wanted_ = kit::clamp_int(static_cast<int>(param(id) + 0.5f), 0, kNumMedia - 1);
        if (!primed() || idle_.asleep()) {
          // Nothing is sounding: no need to fade.
          if (wanted_ != medium_) {
            medium_ = wanted_;
            enter_medium();
          }
          swap_ = 0;
          fade_ = 1.0f;
        } else if (wanted_ != medium_) {
          swap_ = -1;
        } else if (swap_ < 0) {
          swap_ = 1;  // back to the medium it was leaving
        }
        break;
      case kMix:
        mix_.set(param(id), primed());
        break;
      default:
        break;  // the rest is read on the control clock
    }
  }

  kit::Halfband2x oversample_[2];
  kit::DelayLine<1024> line_[2];  // at 2x: twice the base delay and its excursion
  kit::DelayLine<512> dry_[2];
  kit::DelayLine<256> comb_[2];
  patina_parts::Saturator saturator_[2];
  patina_parts::SaturatorSettings settings_;
  patina_parts::Noise noise_;
  kit::Biquad low_cut_[2], low_cut_steep_[2], bump_[2], shelf_[2];
  kit::Svf high_cut_[2], high_cut_steep_[2];
  kit::OnePole drop_low_[2], side_low_;
  kit::Rng drop_rng_, jitter_rng_;
  kit::Smoother noise_level_, output_, mix_, wow_depth_, flutter_depth_;
  kit::LinearRamp gain_, level_, bias_, fading_, comb_time_, comb_amount_, sag_, narrow_, fold_;
  kit::Drift wow_drift_, flutter_rate_wander_, flutter_depth_wander_, fade_drift_, comb_drift_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;
  float glide_ = 0.05f;
  float drive_ = 0.0f;  // the knobs as they glide
  float wear_ = 0.0f;
  float tone_ = 0.5f;
  float sway_ = 0.0f;  // Wobble, where it is not the transport's
  float flutter_phase_ = 0.0f;
  float turn_phase_ = 0.0f;
  float wobble_ = 0.0f;  // seconds the read point is off its base
  float wobble_step_ = 0.0f;
  float held_[2] = {0.0f, 0.0f};
  float before_[2] = {0.0f, 0.0f};
  float hold_phase_ = 0.0f;
  float hold_now_ = 1.0f;
  float hold_period_ = 1.0f;
  float jitter_ = 0.0f;
  float steps_ = 131072.0f;
  float steps_inverse_ = 1.0f / 131072.0f;
  float sag_env_ = 0.0f;
  float sag_attack_ = 0.0f;
  float sag_release_ = 0.0f;
  int drop_left_ = 0;
  int drop_length_ = 1;
  float drop_depth_ = 0.0f;
  float drop_weight_[2] = {1.0f, 1.0f};
  float fade_ = 1.0f;  // how far the worn signal is in, 0 to 1
  float fade_step_ = 0.0f;
  int swap_ = 0;  // -1 fading to the clean signal, 1 fading back, 0 steady
  float hiss_gate_ = 0.0f;
  float hiss_rise_ = 0.0f;
  float hiss_fall_ = 0.0f;
  long hold_samples_ = 1;
  long drain_samples_ = 1;
  long quiet_ = 1;
  int medium_ = kReel;
  int wanted_ = kReel;
  bool started_ = false;
  bool snap_ = true;
};

}  // namespace livemix
