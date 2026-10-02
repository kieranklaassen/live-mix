#pragma once

// Re-amp: the sound played out through an amplifier and a loudspeaker in a
// room, and recorded again with a microphone.
//
//   in ─► bass, treble ─►(+)─► × drive ─► [ 4x: valve curve ] ─► make-up ─► speaker ─┬─► off-axis, proximity ─► × direct ─┐
//                         ▲     (sags when hit hard)                (one of five,    │                                     │
//                    hiss, hum                                       per channel)    └─► L+R ─► early reflections ─────────┤
//                                                                                              └─► diffusers ─► 8-line FDN ─┤
//                                                                                                                           ▼
//   in ─► delay (kLatency) ───────────────────────────────────────────────────────────────────────── Mix ◄── Output ◄── limit
//
// - The amplifier is one valve-like stage: s(u) = u / sqrt(1 + u²) around a
//   bias that grows with Drive (so it makes even harmonics as well as odd),
//   run at four times the sample rate (kit::Halfband2x around a shorter
//   second stage) and averaged over each step by its antiderivative
//   (Parker, Zavalishin and Le Bivic, "Reducing the aliasing of nonlinear
//   waveshaping using continuous-time convolution", DAFx 2016). For this
//   curve the antiderivative is sqrt(1 + u²), so the average is exact in
//   single precision and costs one square root.
// - Drive runs from half gain into the curve (clean, a decibel of give at
//   full scale) to 30 dB more. The make-up holds a signal around -15 dBFS at
//   the level it came in, so Drive changes the texture and the dynamics, not
//   the volume.
// - Sag: the supply droops when the amplifier is hit hard. A follower on the
//   driven signal (30 ms up, 120 ms down) takes up to 3.7 dB off the gain and
//   1.9 dB off the ceiling, so a struck chord gives a little over its first
//   tenth of a second and the amplifier has recovered by the next one.
// - Each speaker's motor weakens as its cone travels (gain 1 / (1 + k·e²),
//   e the signal under the cone's resonance), so loud lows modulate the
//   highs: a lot in the small speaker, hardly at all in the monitor.
// - Output is followed by a limiter that is exactly linear up to ±2 and
//   lands on ±4 (kit::soft_clip scaled), so no setting can run away.
// - Bass and Treble are shelves ahead of the curve, as in an amplifier: they
//   change what breaks up, not only the balance.
// - The speakers are in speakers.h. Each channel has its own amplifier and
//   speaker, so a stereo source stays stereo at the cone.
// - The microphone. Distance 0 is on the cone: only the direct sound, with a
//   3 dB proximity lift under 180 Hz. Pulling back trades direct sound for
//   the room at constant power: six early reflections a side (a seeded
//   pattern, different left and right, closing up on the direct sound as the
//   microphone nears the walls) and the tail of an eight-line feedback delay
//   network with a Hadamard matrix (Jot and Chaigne, "Digital delay networks
//   for designing artificial reverberators", AES 1991), fed through two
//   allpass diffusers. Room scales every length in it and the decay together,
//   from a cupboard (0.12 s) to a hall (1.2 s). Angle turns the microphone
//   off the axis: a shelf from where the cone starts to beam and a low-pass
//   that closes on the direct sound; the room hears the speaker's power
//   response whatever the angle.
// - Noise is hiss and a 50 Hz mains hum (with its second and third
//   harmonics) at the amplifier's input, so Drive brings it up and the
//   speaker colours it. It is made only while signal is passing and for a
//   second after; then it fades, the room rings out, and the device sleeps.
// - The dry path is delayed by the oversampler's 39 samples, so Mix (a linear
//   crossfade) blends the direct sound in time with it.

#include "../../kit/kit.h"
#include "halfband.h"
#include "params.gen.h"
#include "speakers.h"

namespace livemix {

class ReAmp : public kit::DeviceBase<re_amp::kNumParams> {
 public:
  // As reported in device.json (latencySamples): 31 for the outer half-band
  // pair, 8 for the inner pair with its sample of padding.
  static constexpr int kLatency = 39;
  static constexpr float kMinDecaySeconds = 0.12f;
  static constexpr float kMaxDecaySeconds = 1.2f;

  void init(float sample_rate) {
    using namespace re_amp;
    kit::SineTable::init();
    init_base(sample_rate, kParamMin, kParamMax, kParamDefault);
    const float sr = this->sample_rate();

    for (int c = 0; c < 2; ++c) {
      outer_[c].init(kOuterBeta);
      inner_[c].init(kInnerBeta);
      held_[c] = 0.0f;
      last_u_[c] = 0.0f;
      last_root_[c] = 1.0f;
      bass_[c].reset();
      treble_[c].reset();
      shelf_[c].reset();
      air_[c].reset();
      proximity_[c].reset();
      dry_[c].clear();
      hiss_low_[c].reset();
      hiss_low_[c].set_cutoff(kHissTiltHz, sr);
    }
    hiss_rng_[0].seed(0x3C6EF372u);
    hiss_rng_[1].seed(0xA54FF53Au);
    hum_cos_ = 1.0f;
    hum_sin_ = 0.0f;
    hum_turn_cos_ = std::cos(kit::kTwoPi * kHumHz / sr);
    hum_turn_sin_ = std::sin(kit::kTwoPi * kHumHz / sr);
    sag_.reset();
    sag_.set(kSagAttackSeconds, kSagReleaseSeconds, sr);

    for (re_amp_dsp::SpeakerBank& bank : bank_) bank.reset();
    wanted_speaker_ = kit::clamp_int(static_cast<int>(param(kSpeaker) + 0.5f), 0,
                                     re_amp_dsp::kNumSpeakers - 1);
    active_ = 0;
    for (int model = 0; model < re_amp_dsp::kNumSpeakers; ++model) {
      bank_[0].design(model, sr);
      speaker_gain_[model] = bank_[0].gain();
    }
    bank_[0].design(wanted_speaker_, sr, speaker_gain_[wanted_speaker_]);
    bank_[1].design(wanted_speaker_, sr, speaker_gain_[wanted_speaker_]);
    fading_ = false;
    fade_position_ = 0;
    fade_length_ = static_cast<int>(kSpeakerFadeSeconds * sr);
    if (fade_length_ < 1) fade_length_ = 1;

    // The room. Tap times and line lengths are in seconds at the size of the
    // hall; Room scales them.
    send_low_.reset();
    send_low_.set_cutoff(kSendHz, sr);
    early_line_.clear();
    kit::Rng rng;
    rng.seed(0x1F83D9ABu);
    for (int side = 0; side < 2; ++side) {
      float seconds = kFirstReflectionSeconds[side];
      float energy = 0.0f;
      for (int k = 0; k < kNumTaps; ++k) {
        tap_seconds_[side][k] = seconds * (1.0f + 0.12f * rng.bipolar());
        tap_gain_[side][k] = kTapSign[side][k] *
                             std::pow(kFirstReflectionSeconds[side] / tap_seconds_[side][k], 0.8f);
        energy += tap_gain_[side][k] * tap_gain_[side][k];
        seconds *= kTapSpacing;
      }
      const float scale = 1.0f / std::sqrt(energy);
      for (int k = 0; k < kNumTaps; ++k) tap_gain_[side][k] *= scale;
    }
    for (int i = 0; i < kNumLines; ++i) {
      line_[i].clear();
      damp_[i].reset();
      damp_[i].set_cutoff(kDampHz, sr);
      // Lengths and decay scale together, so the gain of a pass does not
      // depend on Room.
      line_gain_[i] = std::pow(10.0f, -3.0f * kLineRatio[i] * kLineSeconds / (kDecayTrim * kMaxDecaySeconds));
    }
    for (int k = 0; k < 2; ++k) {
      diffuse_[k].clear();
      diffuse_samples_[k] = kit::clamp_int(static_cast<int>(kDiffuseSeconds[k] * sr), 1, 1000);
    }

    kit::Smoother* fast[] = {&drive_, &hiss_, &hum_, &output_, &mix_, &direct_, &early_, &tail_, &air_mix_};
    for (kit::Smoother* smoother : fast) smoother->set_time(kSmoothingSeconds, sr);
    size_.set_time(kSizeLagSeconds, sr);
    early_scale_.set_time(kSizeLagSeconds, sr);
    glide_ = 1.0f - std::exp(-static_cast<float>(kControlPeriod) / (kGlideSeconds * sr));

    gate_ = 0.0f;
    gate_rise_ = 1.0f / (kNoiseRiseSeconds * sr);
    gate_fall_ = 1.0f / (kNoiseFallSeconds * sr);
    hold_samples_ = static_cast<long>(kNoiseHoldSeconds * sr);
    drain_samples_ = hold_samples_ + static_cast<long>((kNoiseFallSeconds + 0.05f) * sr);
    quiet_ = drain_samples_;

    bass_db_ = treble_db_ = angle_ = beam_hz_ = proximity_db_ = -1000.0f;
    started_ = false;
    refresh_ = true;
    dirty_ = true;
    clock_.reset(kControlPeriod);
    // The longest silent gap is the last early reflection, under 80 ms.
    idle_.reset(sr, 0.3f);
    for (int id = 0; id < kNumParams; ++id) apply(id);
  }

  void set_param(int id, float value) {
    if (store_param(id, value)) {
      dirty_ = true;
      apply(id);
    }
  }

  void process(int frames) {
    using namespace re_amp;
    frames = begin_block(frames);
    const bool was_asleep = idle_.asleep();
    if (!idle_.wake(input_present(frames) || quiet_ < drain_samples_)) {
      silence_output(frames);
      return;
    }
    const float sr = sample_rate();
    if (was_asleep) settle(sr);

    for (int i = 0; i < frames; ++i) {
      float in[2];
      take_input(i, &in[0], &in[1]);
      if (clock_.tick()) control(sr);

      // The amplifier's working point.
      if (!drive_.settled() || refresh_) {
        const float drive = drive_.next();
        gain_ = kMinGain * std::exp2(kGainOctaves * drive);
        bias_ = kBias + kDriveBias * drive;
        const float bias_root = std::sqrt(1.0f + bias_ * bias_);
        bias_out_ = bias_ / bias_root;
        level_ = makeup(drive) * std::sqrt(1.0f + kReferenceLevel * kReferenceLevel * gain_ * gain_) *
                 bias_root * bias_root * bias_root / gain_;
        if (refresh_) {
          // Nothing is sounding: the curve's memory rests on the bias, so the
          // first sample is not a step from somewhere else.
          for (int c = 0; c < 2; ++c) {
            last_u_[c] = bias_;
            last_root_[c] = bias_root;
          }
        }
      }
      if (!size_.settled() || !early_scale_.settled() || refresh_) {
        const float size = size_.next() * sr;
        const float early = early_scale_.next() * sr;
        for (int side = 0; side < 2; ++side) {
          for (int k = 0; k < kNumTaps; ++k) tap_[side][k].set(tap_seconds_[side][k] * early);
        }
        pre_tap_.set(kFirstReflectionSeconds[0] * early);
        for (int k = 0; k < kNumLines; ++k) line_tap_[k].set(kLineRatio[k] * kLineSeconds * size);
      }
      refresh_ = false;
      const float hiss = glide(hiss_);
      const float hum = glide(hum_);
      const float direct = glide(direct_);
      const float early = glide(early_);
      const float tail = glide(tail_);
      const float air_mix = glide(air_mix_);
      const float output = glide(output_);
      const float mix = glide(mix_);

      // Noise at the amplifier's input, while there is signal and a moment after.
      const bool sounding = in[0] > kQuiet || in[0] < -kQuiet || in[1] > kQuiet || in[1] < -kQuiet;
      if (sounding) {
        quiet_ = 0;
      } else if (quiet_ < drain_samples_) {
        ++quiet_;
      }
      if (quiet_ < hold_samples_) {
        gate_ = kit::min(1.0f, gate_ + gate_rise_);
      } else {
        gate_ = kit::max(0.0f, gate_ - gate_fall_);
      }
      float hum_now = 0.0f;
      if (gate_ > 0.0f) {
        // One phasor turning at the mains frequency; its second and third
        // harmonics come from the double and triple angle.
        const float c = hum_cos_ * hum_turn_cos_ - hum_sin_ * hum_turn_sin_;
        const float s = hum_sin_ * hum_turn_cos_ + hum_cos_ * hum_turn_sin_;
        hum_cos_ = c;
        hum_sin_ = s;
        hum_now = hum * gate_ * (0.5f * s + 2.0f * s * c + 0.3f * s * (3.0f - 4.0f * s * s));
      }

      float toned[2];
      for (int c = 0; c < 2; ++c) {
        float x = treble_[c].process(bass_[c].process(in[c]));
        if (gate_ > 0.0f && hiss > 0.0f) {
          const float white = hiss_rng_[c].bipolar();
          x += hiss * gate_ * (white - kHissTilt * hiss_low_[c].lowpass(white));
        }
        toned[c] = x + hum_now;
      }

      // Sag: both amplifiers hang off one supply.
      const float hit = sag_.process(gain_ * kit::max(kit::max(toned[0], -toned[0]),
                                                      kit::max(toned[1], -toned[1])));
      const float droop = hit * hit / (hit * hit + kSagKnee);
      const float drive_gain = gain_ * (1.0f - kSagGain * droop);
      const float ceiling = level_ * (1.0f - kSagCeiling * droop);

      // Speaker change: the new one fades in beside the old.
      if (!fading_ && wanted_speaker_ != bank_[active_].model()) {
        bank_[1 - active_].reset();
        bank_[1 - active_].design(wanted_speaker_, sr, speaker_gain_[wanted_speaker_]);
        fading_ = true;
        fade_position_ = 0;
      }
      float fade = 0.0f;
      if (fading_) {
        const float t = static_cast<float>(fade_position_) / static_cast<float>(fade_length_);
        fade = t * t * (3.0f - 2.0f * t);
      }

      float speaker[2];
      float mic[2];
      for (int c = 0; c < 2; ++c) {
        const float amp = amplify(c, toned[c] * drive_gain) * ceiling;
        float y = bank_[active_].process(c, amp);
        if (fading_) y += (bank_[1 - active_].process(c, amp) - y) * fade;
        speaker[c] = y;
        // The microphone on the direct sound: off-axis loss, then proximity.
        float d = shelf_[c].process(y);
        d += (air_[c].lowpass(d) - d) * air_mix;
        mic[c] = proximity_[c].process(d);
      }
      if (fading_ && ++fade_position_ >= fade_length_) {
        active_ = 1 - active_;
        fading_ = false;
      }

      // The room hears both speakers.
      const float send = send_low_.lowpass(0.5f * (speaker[0] + speaker[1]));
      float reflections[2] = {0.0f, 0.0f};
      for (int side = 0; side < 2; ++side) {
        for (int k = 0; k < kNumTaps; ++k) {
          reflections[side] += tap_gain_[side][k] * tap_[side][k].read(early_line_);
        }
      }
      float feed = pre_tap_.read(early_line_);
      early_line_.write(send);
      feed = diffuse_[1].process(diffuse_[0].process(feed, diffuse_samples_[0], kDiffusion),
                                 diffuse_samples_[1], kDiffusion);

      float v[kNumLines];
      float room[2] = {0.0f, 0.0f};
      for (int k = 0; k < kNumLines; ++k) {
        v[k] = line_tap_[k].read(line_[k]);
        room[0] += kOutLeft[k] * v[k];
        room[1] += kOutRight[k] * v[k];
        v[k] = damp_[k].lowpass(v[k]) * line_gain_[k];
      }
      kit::hadamard<kNumLines>(v);
      for (int k = 0; k < kNumLines; ++k) {
        line_[k].write(flush_denormal(v[k] + kInSign[k] * feed));
      }

      for (int c = 0; c < 2; ++c) {
        const float wet = output * (direct * mic[c] + early * reflections[c] + tail * kTailGain * room[c]);
        // Nothing reaches this knee at sensible settings: it only bounds
        // +12 dB of Output on top of a speaker's resonance.
        const float limited = kLimit * kit::soft_clip(wet * (1.0f / kLimit));
        const float dry = dry_[c].read(kLatency);
        dry_[c].write(in[c]);
        (c == 0 ? out_left_ : out_right_)[i] = dry + (limited - dry) * mix;
      }
    }
    idle_.settle(output_peak(frames), frames);
  }

 private:
  static constexpr int kControlPeriod = 16;
  // Kaiser betas of the two half-band stages: the outer is the kit's 63-tap
  // design (kit::Halfband2x), the inner 31 taps.
  static constexpr double kOuterBeta = 8.0;
  static constexpr double kInnerBeta = 10.0;

  // The amplifier.
  static constexpr float kMinGain = 0.5f;
  static constexpr float kGainOctaves = 5.0f;  // 30 dB of Drive
  static constexpr float kBias = 0.12f;
  static constexpr float kDriveBias = 0.2f;
  static constexpr float kReferenceLevel = 0.18f;
  static constexpr float kSagAttackSeconds = 0.03f;
  static constexpr float kSagReleaseSeconds = 0.12f;
  static constexpr float kSagKnee = 4.0f;
  static constexpr float kSagGain = 0.35f;
  static constexpr float kSagCeiling = 0.2f;
  static constexpr float kBassHz = 160.0f;
  static constexpr float kTrebleHz = 2800.0f;
  static constexpr float kToneDb = 10.0f;

  // Noise, as peak values at Noise 1 referred to the amplifier's input.
  static constexpr float kHissLevel = 0.012f;
  static constexpr float kHumLevel = 0.004f;
  static constexpr float kHissTiltHz = 1500.0f;
  static constexpr float kHissTilt = 0.6f;
  static constexpr float kHumHz = 50.0f;
  static constexpr float kNoiseHoldSeconds = 1.0f;
  static constexpr float kNoiseRiseSeconds = 0.03f;
  static constexpr float kNoiseFallSeconds = 0.4f;
  static constexpr float kQuiet = 1.0e-6f;

  // The microphone.
  static constexpr float kSpeakerFadeSeconds = 0.04f;
  static constexpr float kAngleShelfDb = 9.0f;
  static constexpr float kAngleClosedRatio = 2.2f;  // low-pass at this many times the beam corner
  static constexpr float kProximityHz = 180.0f;
  static constexpr float kProximityDb = 3.0f;
  static constexpr float kFarAngle = 1.44f;         // radians: the room is 18 dB over the direct sound
  static constexpr float kDistanceCurve = 1.3f;
  static constexpr float kEarlyShare = 0.45f;       // of the room's power
  static constexpr float kGlideSeconds = 0.008f;

  // The room, at the size of the hall.
  static constexpr int kNumTaps = 6;
  static constexpr int kNumLines = 8;
  static constexpr float kSendHz = 6500.0f;
  static constexpr float kFirstReflectionSeconds[2] = {0.0070f, 0.0086f};
  static constexpr float kTapSpacing = 1.5f;
  static constexpr float kTapSign[2][kNumTaps] = {{1.0f, 1.0f, -1.0f, 1.0f, -1.0f, 1.0f},
                                                 {1.0f, 1.0f, -1.0f, 1.0f, -1.0f, 1.0f}};
  static constexpr float kEarlyClosing = 0.35f;  // how far the reflections close up at Distance 1
  static constexpr float kLineSeconds = 0.026f;
  static constexpr float kLineRatio[kNumLines] = {1.0f,   1.153f, 1.327f, 1.511f,
                                                  1.733f, 2.011f, 2.357f, 2.741f};
  static constexpr float kOutLeft[kNumLines] = {1.0f, -1.0f, 1.0f, -1.0f, 1.0f, -1.0f, 1.0f, -1.0f};
  static constexpr float kOutRight[kNumLines] = {1.0f, 1.0f, -1.0f, -1.0f, 1.0f, 1.0f, -1.0f, -1.0f};
  static constexpr float kInSign[kNumLines] = {1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f, 1.0f};
  static constexpr float kDampHz = 5500.0f;
  // The damping shortens what a broadband burst measures; this puts it back.
  static constexpr float kDecayTrim = 1.1f;
  static constexpr float kDiffuseSeconds[2] = {0.0021f, 0.0034f};
  static constexpr float kDiffusion = 0.55f;
  static constexpr float kTailGain = 0.267f;   // the tail as loud as its feed, on pink noise
  static constexpr float kEarlyGain = 1.12f;  // and the reflections
  static constexpr float kSizeLagSeconds = 0.12f;
  static constexpr float kLimit = 4.0f;

  // What Drive would otherwise still do to the loudness of noise at -18 dBFS,
  // taken back out: measured at five settings, read with linear interpolation.
  static constexpr float kMakeup[5] = {1.0f, 1.0f, 1.005f, 0.978f, 0.875f};

  static float makeup(float drive) {
    const float position = kit::clamp(drive, 0.0f, 1.0f) * 4.0f;
    const int index = kit::clamp_int(static_cast<int>(position), 0, 3);
    return kit::lerp(kMakeup[index], kMakeup[index + 1], position - static_cast<float>(index));
  }

  // A Hermite read whose weights are worked out when the delay moves, not on
  // every sample: the room's lengths stand still unless Room or Distance is
  // being turned. The same four-point, third-order read as
  // kit::DelayLine::read_hermite.
  struct Tap {
    int whole = 2;
    float w[4] = {0.0f, 1.0f, 0.0f, 0.0f};

    void set(float delay) {
      whole = static_cast<int>(delay);
      if (whole < 2) whole = 2;
      const float t = kit::clamp(delay - static_cast<float>(whole), 0.0f, 1.0f);
      const float t2 = t * t, t3 = t2 * t;
      w[0] = -0.5f * t + t2 - 0.5f * t3;
      w[1] = 1.0f - 2.5f * t2 + 1.5f * t3;
      w[2] = 0.5f * t + 2.0f * t2 - 1.5f * t3;
      w[3] = -0.5f * t2 + 0.5f * t3;
    }
    template <int Size>
    float read(const kit::DelayLine<Size>& line) const {
      return w[0] * line.read(whole - 1) + w[1] * line.read(whole) + w[2] * line.read(whole + 1) +
             w[3] * line.read(whole + 2);
    }
  };

  // A settled smoother costs one comparison.
  static float glide(kit::Smoother& smoother) {
    return smoother.value == smoother.target ? smoother.value : smoother.next();
  }

  // One base-rate sample through the valve stage at four times the rate.
  // s(u) averaged over the step from the last sample: with S = sqrt(1 + u²),
  // (S(u) - S(v)) / (u - v) = (u + v) / (S(u) + S(v)), which needs no special
  // case for a small step.
  float amplify(int c, float x) {
    float a, b;
    outer_[c].up(x, &a, &b);
    // The inner stage takes 15 samples at the 2x rate; one more makes that a
    // whole number of base-rate samples.
    const float pair[2] = {held_[c], a};
    held_[c] = b;
    float back[2];
    for (int k = 0; k < 2; ++k) {
      float p, q;
      inner_[c].up(pair[k], &p, &q);
      p = shape(c, p);
      q = shape(c, q);
      back[k] = inner_[c].down(p, q);
    }
    return outer_[c].down(back[0], back[1]);
  }

  float shape(int c, float x) {
    const float u = x + bias_;
    const float root = std::sqrt(1.0f + u * u);
    const float mean = (u + last_u_[c]) / (root + last_root_[c]) - bias_out_;
    last_u_[c] = u;
    last_root_[c] = root;
    return mean;
  }

  // Move a control-rate value towards its target; true while it moves.
  bool approach(float* value, float target) const {
    if (*value == target) return false;
    const float step = (target - *value) * glide_;
    const float close = 1.0e-4f * (target < 0.0f ? -target : target) + 1.0e-5f;
    if (!started_ || (step < close && step > -close)) {
      *value = target;
    } else {
      *value += step;
    }
    return true;
  }

  // Every 16 samples: everything derived from the controls.
  void control(float sr) {
    using namespace re_amp;
    const float norm = 1.5f - 0.5f * (hum_cos_ * hum_cos_ + hum_sin_ * hum_sin_);
    hum_cos_ *= norm;
    hum_sin_ *= norm;
    if (approach(&bass_db_, kToneDb * param(kBass))) {
      for (kit::Biquad& filter : bass_) filter.set_low_shelf(kBassHz, bass_db_, sr);
    }
    if (approach(&treble_db_, kToneDb * param(kTreble))) {
      for (kit::Biquad& filter : treble_) filter.set_high_shelf(kTrebleHz, treble_db_, sr);
    }

    const bool turned = approach(&angle_, param(kAngle));
    const bool beam_moved = approach(&beam_hz_, re_amp_dsp::kSpeakers[wanted_speaker_].beam_hz);
    if (turned || beam_moved) {
      const float closed = kit::min(kAngleClosedRatio * beam_hz_, 18000.0f);
      for (int c = 0; c < 2; ++c) {
        shelf_[c].set_high_shelf(beam_hz_, -kAngleShelfDb * angle_, sr);
        air_[c].set_cutoff(18000.0f * std::pow(closed / 18000.0f, angle_), sr);
      }
    }
    air_mix_.set(kit::min(1.0f, 4.0f * param(kAngle)), started_);

    const float distance = param(kDistance);
    const float close_up = 1.0f - kit::min(1.0f, 2.0f * distance);
    if (approach(&proximity_db_, kProximityDb * close_up * close_up)) {
      for (kit::Biquad& filter : proximity_) filter.set_low_shelf(kProximityHz, proximity_db_, sr);
    }
    if (!dirty_ && started_) return;
    dirty_ = false;
    // Direct sound for room at constant power.
    const float theta = kFarAngle * std::pow(distance, kDistanceCurve) * (1.0f / kit::kTwoPi);
    const float room = kit::SineTable::lookup(theta);
    direct_.set(kit::SineTable::cos_lookup(theta), started_);
    early_.set(room * std::sqrt(kEarlyShare) * kEarlyGain, started_);
    tail_.set(room * std::sqrt(1.0f - kEarlyShare), started_);

    const float size = (kMinDecaySeconds / kMaxDecaySeconds) *
                       std::pow(kMaxDecaySeconds / kMinDecaySeconds, param(kRoom));
    size_.set(size, started_);
    early_scale_.set(size * (1.0f - kEarlyClosing * distance), started_);

    const float noise = param(kNoise);
    const float amount = noise * std::sqrt(noise);
    hiss_.set(amount * kHissLevel, started_);
    hum_.set(amount * kHumLevel, started_);
    output_.set(kit::db_to_gain(param(kOutput)), started_);
    if (!started_) refresh_ = true;
    started_ = true;
  }

  // Waking from sleep: nothing is sounding, so whatever changed meanwhile
  // applies at once.
  void settle(float sr) {
    started_ = false;
    refresh_ = true;
    drive_.snap(drive_.target);
    mix_.snap(mix_.target);
    size_.snap(size_.target);
    early_scale_.snap(early_scale_.target);
    fading_ = false;
    if (wanted_speaker_ != bank_[active_].model()) {
      bank_[active_].reset();
      bank_[active_].design(wanted_speaker_, sr, speaker_gain_[wanted_speaker_]);
    }
    clock_.reset(kControlPeriod);
  }

  void apply(int id) {
    using namespace re_amp;
    switch (id) {
      case kSpeaker:
        wanted_speaker_ = kit::clamp_int(static_cast<int>(param(id) + 0.5f), 0,
                                         re_amp_dsp::kNumSpeakers - 1);
        break;
      case kDrive:
        drive_.set(param(id), primed());
        break;
      case kMix:
        mix_.set(param(id), primed());
        break;
      default:
        break;  // the rest is read on the control clock
    }
  }

  re_amp_dsp::Halfband<16> outer_[2];
  re_amp_dsp::Halfband<8> inner_[2];
  kit::Biquad bass_[2], treble_[2], shelf_[2], proximity_[2];
  kit::OnePole air_[2], hiss_low_[2], send_low_;
  kit::Follower sag_;
  re_amp_dsp::SpeakerBank bank_[2];
  kit::DelayLine<64> dry_[2];
  kit::DelayLine<8192> early_line_;        // 73 ms at 96 kHz
  kit::DelayLine<8192> line_[kNumLines];   // 71 ms at 96 kHz
  kit::OnePole damp_[kNumLines];
  kit::AllpassDelay<1024> diffuse_[2];
  kit::Rng hiss_rng_[2];
  kit::Smoother drive_, hiss_, hum_, output_, mix_, direct_, early_, tail_, air_mix_;
  kit::Smoother size_, early_scale_;
  kit::ControlClock clock_;
  kit::IdleGate idle_;

  float speaker_gain_[re_amp_dsp::kNumSpeakers] = {};
  float held_[2] = {0.0f, 0.0f};
  float last_u_[2] = {0.0f, 0.0f};
  float last_root_[2] = {1.0f, 1.0f};
  float gain_ = 1.0f;
  float bias_ = 0.0f;
  float bias_out_ = 0.0f;
  float level_ = 1.0f;
  float hum_cos_ = 1.0f;
  float hum_sin_ = 0.0f;
  float hum_turn_cos_ = 1.0f;
  float hum_turn_sin_ = 0.0f;
  float tap_seconds_[2][kNumTaps] = {};
  float tap_gain_[2][kNumTaps] = {};
  Tap tap_[2][kNumTaps];
  Tap pre_tap_;
  Tap line_tap_[kNumLines];
  float line_gain_[kNumLines] = {};
  int diffuse_samples_[2] = {1, 1};
  float glide_ = 0.05f;
  float bass_db_ = 0.0f;
  float treble_db_ = 0.0f;
  float angle_ = 0.0f;
  float beam_hz_ = 2000.0f;
  float proximity_db_ = 0.0f;
  float gate_ = 0.0f;
  float gate_rise_ = 0.0f;
  float gate_fall_ = 0.0f;
  long hold_samples_ = 1;
  long drain_samples_ = 1;
  long quiet_ = 1;
  int wanted_speaker_ = 1;
  int active_ = 0;
  int fade_position_ = 0;
  int fade_length_ = 1;
  bool fading_ = false;
  bool started_ = false;
  bool refresh_ = true;
  bool dirty_ = true;
};

}  // namespace livemix
