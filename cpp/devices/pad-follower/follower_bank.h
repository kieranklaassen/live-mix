#pragma once

// The voice of Pad Follower: a bank of narrow complex band-pass channels,
// each steering one sine oscillator.
//
//   x ─► [complex resonator ×2] ─► z_b ─┬─► |z_b| ─► gate ─► slow follower ─► level_b
//                                       ├─► phase step per tick ─► frequency_b
//                                       └─► phase ─► lock ─┐
//                                                          ▼
//        pad = Σ level_b · ( cos φ_b  +  up · cos 2φ_b  +  down · cos φ_b/2 )
//
// - Analysis. Channel b is two cascaded one-pole filters with a complex pole
//   at its centre frequency, so its output z_b is already analytic: |z_b| is
//   the envelope and arg z_b the phase of whatever partial sits in the band.
//   Centres follow an auditory-style map (roughly a semitone apart in the
//   middle of the range, wider in Hz terms at the bottom).
// - Level. The pad's level in a band is |z_b| through a soft gate
//   (Sensitivity), a spectral peak pick (bands that only hear their
//   neighbours' leakage stay silent) and a slow follower: two poles on the
//   way up (Rise, an S-shaped swell) and one on the way down (Fall).
// - Pitch. The oscillator of a band turns at the band's measured frequency:
//   the phase z_b advanced between two control ticks, averaged without power
//   weighting so a band holding two partials settles on the stronger one.
//   While the input is present the oscillator is also pulled into phase with
//   z_b (a first-order lock), so neighbouring bands that hear the same
//   partial add coherently. When the input stops, tracking stops with it and
//   the oscillator keeps the pitch it had: the pad hangs on in tune instead
//   of sliding to the band centre as a ringing filter would.
// - Octaves. The band's oscillator is a unit phasor u, so the octave above
//   is Re(u²) exactly, and the octave below is a second phasor turned at half
//   the rate. No pitch detection and no division by a small envelope.
//
// The bank runs at the device's internal rate (the host rate divided by 2 or
// 4, near 24 kHz), with control-rate work every kTick samples.

#include "../../kit/math.h"

namespace livemix {
namespace pad_follower {

class FollowerBank {
 public:
  static constexpr int kBands = 64;
  static constexpr int kGroups = 8;
  static constexpr int kTick = 16;
  static constexpr float kLowestHz = 60.0f;
  static constexpr float kHighestHz = 6000.0f;

  // `rate` is the rate the bank is ticked at. Clears all state.
  void prepare(float rate) {
    rate_ = rate;
    const double two_pi = 6.283185307179586;
    const double top = kHighestHz < 0.27f * rate ? kHighestHz : 0.27f * rate;
    const double span = std::log((top + kMapOffsetHz) / (kLowestHz + kMapOffsetHz));
    for (int b = 0; b < kBands; ++b) {
      const double position = static_cast<double>(b) / (kBands - 1);
      const double hz = (kLowestHz + kMapOffsetHz) * std::exp(span * position) - kMapOffsetHz;
      const double spacing = (hz + kMapOffsetHz) * span / (kBands - 1);
      const double w = two_pi * hz / rate;
      const double r = std::exp(-3.141592653589793 * kBandwidthFactor * spacing / rate);
      hz_[b] = static_cast<float>(hz);
      pole_r_[b] = static_cast<float>(r * std::cos(w));
      pole_i_[b] = static_cast<float>(r * std::sin(w));
      in_gain_[b] = static_cast<float>((1.0 - r) * (1.0 - r));
      centre_r_[b] = static_cast<float>(std::cos(w));
      centre_i_[b] = static_cast<float>(std::sin(w));
      half_r_[b] = static_cast<float>(std::cos(0.5 * w));
      half_i_[b] = static_cast<float>(std::sin(0.5 * w));
      unlag_r_[b] = static_cast<float>(std::cos(kTick * w));
      unlag_i_[b] = static_cast<float>(-std::sin(kTick * w));
      // The lock pulls in over about a third of the band's own width, and
      // the tracked frequency may leave the centre by two band spacings.
      lock_[b] = static_cast<float>(two_pi * kLockFactor * spacing / rate);
      max_dev_[b] = static_cast<float>(two_pi * 2.0 * spacing / rate);
      detune_scale_[b] = static_cast<float>(r / (1.0 - r));
      stage_norm_[b] = static_cast<float>((1.0 - r) * (1.0 - r));
      share_scale_[b] = static_cast<float>(rate / (two_pi * spacing));
      // The octave above fades out before it would reach the internal Nyquist.
      const double doubled = 2.0 * hz / rate;
      up_taper_[b] = kit::clamp(static_cast<float>((0.44 - doubled) / 0.10), 0.0f, 1.0f);
    }
    fast_ = 1.0f - kit::time_to_coeff(kFastSeconds, rate / kTick);
    octave_coeff_ = 1.0f - kit::time_to_coeff(kOctaveSeconds, rate / kTick);
    estimate_ = 1.0f - kit::time_to_coeff(kEstimateSeconds, rate / kTick);
    commit_ = 1.0f - kit::time_to_coeff(kCommitSeconds, rate / kTick);
    reset();
  }

  void reset() {
    for (int b = 0; b < kBands; ++b) {
      s1r_[b] = s1i_[b] = s2r_[b] = s2i_[b] = 0.0f;
      ur_[b] = 1.0f;
      ui_[b] = 0.0f;
      hr_[b] = 1.0f;
      hi_[b] = 0.0f;
      rot_r_[b] = centre_r_[b];
      rot_i_[b] = centre_i_[b];
      hrot_r_[b] = half_r_[b];
      hrot_i_[b] = half_i_[b];
      gain_[b] = gain_step_[b] = 0.0f;
      up_[b] = down_[b] = 0.0f;
      last_r_[b] = last_i_[b] = 0.0f;
      mag_[b] = level_[b] = 0.0f;
      env1_[b] = env2_[b] = 0.0f;
      dev_est_[b] = dev_[b] = 0.0f;
    }
    counter_ = 0;
    sounding_ = false;
    down_active_ = false;
    octaves_ = octaves_target_;
  }

  float band_hz(int b) const { return hz_[b]; }
  // True while any band's oscillator is audible.
  bool sounding() const { return sounding_; }

  // Rise is the time a swell takes to reach 90 %; Fall the time the pad takes
  // to fall 60 dB once its input has gone.
  void set_times(float rise_seconds, float fall_seconds) {
    const float ticks = rate_ / kTick;
    // Two equal poles in a row reach 90 % after 3.89 time constants.
    attack_ = 1.0f - kit::time_to_coeff(rise_seconds / 3.89f, ticks);
    const float fall_tau = fall_seconds / 6.908f;
    release_ = 1.0f - kit::time_to_coeff(fall_tau, ticks);
    release_follow_ = 1.0f - kit::time_to_coeff(kit::min(0.03f, fall_tau * 0.25f), ticks);
  }

  // The partial amplitude at which the gate is half open.
  void set_threshold(float amplitude) { threshold2_ = amplitude * amplitude; }

  // -1 adds the octave below, +1 the octave above. Glides inside the bank.
  void set_octaves(float octaves, bool glide) {
    octaves_target_ = octaves;
    if (!glide) octaves_ = octaves;
  }

  // One sample in; each band's oscillator is added to its group bus
  // (`groups` holds kGroups sums, which the caller clears).
  void process(float x, float* groups) {
    if (counter_ == 0) tick();
    if (++counter_ >= kTick) counter_ = 0;
    analyse(x);
    if (sounding_) synthesise(groups);
  }

 private:
  // The resonators: s1 = s1·p + g·x, s2 = s2·p + s1, unity gain at the centre.
  void analyse(float x) {
    for (int b = 0; b < kBands; ++b) {
      const float pr = pole_r_[b], pi = pole_i_[b];
      const float a_r = s1r_[b] * pr - s1i_[b] * pi + x * in_gain_[b];
      const float a_i = s1r_[b] * pi + s1i_[b] * pr;
      const float b_r = s2r_[b] * pr - s2i_[b] * pi + a_r;
      const float b_i = s2r_[b] * pi + s2i_[b] * pr + a_i;
      s1r_[b] = a_r;
      s1i_[b] = a_i;
      s2r_[b] = b_r;
      s2i_[b] = b_i;
    }
  }

  // Control rate: measure every band and steer its oscillator.
  void tick() {
    octaves_ += (octaves_target_ - octaves_) * octave_coeff_;
    if (std::fabs(octaves_target_ - octaves_) < 1.0e-4f) octaves_ = octaves_target_;
    const float up = octaves_ > 0.0f ? octaves_ * kOctaveLevel : 0.0f;
    const float down = octaves_ < 0.0f ? -octaves_ * kOctaveLevel : 0.0f;
    // Keep the pad's power about level as the second section comes in.
    const float trim = 1.0f / std::sqrt(1.0f + up * up + down * down);
    down_active_ = down > 0.0f;
    bool any = false;
    for (int b = 0; b < kBands; ++b) any = steer(b, up, down, trim) || any;
    sounding_ = any;
  }

  // One band, one tick. Returns whether its oscillator is audible.
  bool steer(int b, float up, float down, float trim) {
    const float zr = s2r_[b], zi = s2i_[b];
    const float m2 = zr * zr + zi * zi;
    const float first2 = s1r_[b] * s1r_[b] + s1i_[b] * s1i_[b];
    float m = 0.0f;
    if (m2 < 1.0e-24f && first2 < 1.0e-24f) {
      // Rung out: stop before the states turn denormal.
      s1r_[b] = s1i_[b] = s2r_[b] = s2i_[b] = 0.0f;
    } else {
      m = std::sqrt(m2);
    }
    float mag = mag_[b] + (m - mag_[b]) * fast_;
    if (mag < 1.0e-10f) mag = 0.0f;
    mag_[b] = mag;

    // The resonator's own response at the tracked detune d is 1/(1 + jt)²
    // with t = d·r/(1 − r): dividing it out gives the partial itself.
    const float t = detune_scale_[b] * dev_[b];
    const float boost = 1.0f + t * t;

    // Is the band hearing a steady partial? Compare the two stages: in a
    // steady state |s2|·(1 + t²) equals |s1|/(1 − r); the second stage lags
    // behind on an onset and rings on after the input stops, which shows
    // here long before the level itself has moved.
    float confidence = 0.0f;
    if (m > 1.0e-7f && first2 > 0.0f) {
      const float ratio2 = m2 * boost * stage_norm_[b] / first2;
      const float steady = kit::clamp((ratio2 - 0.45f) * 5.0f, 0.0f, 1.0f) *
                           kit::clamp((1.7f - ratio2) * 2.5f, 0.0f, 1.0f);
      const float mag2 = mag * mag;
      confidence = steady * mag2 / (mag2 + 0.0625f * threshold2_);
    }

    float pull = 0.0f;
    if (confidence > 0.0f) {
      // Phase advanced since the last tick, less what the centre would turn.
      const float dr = zr * last_r_[b] + zi * last_i_[b];
      const float di = zi * last_r_[b] - zr * last_i_[b];
      const float er = dr * unlag_r_[b] - di * unlag_i_[b];
      const float ei = dr * unlag_i_[b] + di * unlag_r_[b];
      float angle;
      if (er > 2.5f * std::fabs(ei)) {
        const float q = ei / er;
        const float q2 = q * q;
        angle = q * (1.0f - q2 * ((1.0f / 3.0f) - q2 * (0.2f - q2 * (1.0f / 7.0f))));
      } else {
        angle = std::atan2(ei, er);
      }
      const float measured = kit::clamp(angle * (1.0f / kTick), -max_dev_[b], max_dev_[b]);
      dev_est_[b] += estimate_ * confidence * (measured - dev_est_[b]);
      dev_[b] += commit_ * confidence * (dev_est_[b] - dev_[b]);
      // Lock: the partial's phase (z with the resonator's shift undone)
      // against the oscillator's.
      const float cr = 1.0f - t * t, ci = 2.0f * t;
      const float pr = zr * cr - zi * ci;
      const float pi = zr * ci + zi * cr;
      const float error = (pi * ur_[b] - pr * ui_[b]) / (m * boost);
      pull = lock_[b] * confidence * error;
    }
    last_r_[b] = zr;
    last_i_[b] = zi;
    set_rotation(b, dev_[b] + pull);

    // Level: the partial's amplitude, shared between the two bands it lies
    // between, through the gate and the slow follower.
    const float share = kit::max(0.0f, 1.0f - std::fabs(dev_[b]) * share_scale_[b]);
    const float partial = mag * boost * share;
    const float partial2 = partial * partial;
    const float target = partial2 > 0.0f ? partial * partial2 / (partial2 + threshold2_) : 0.0f;
    float e1 = env1_[b], e2 = env2_[b];
    e1 += (target - e1) * (target > e1 ? attack_ : release_);
    e2 += (e1 - e2) * (e1 > e2 ? attack_ : release_follow_);
    if (e2 < 1.0e-8f && target < 1.0e-8f) e1 = e2 = 0.0f;
    env1_[b] = e1;
    env2_[b] = e2;
    const float level = e2 * trim;
    gain_[b] = level_[b];
    gain_step_[b] = (level - level_[b]) * (1.0f / kTick);
    level_[b] = level;
    up_[b] = up * up_taper_[b];
    down_[b] = down;
    return level > 0.0f || gain_[b] > 0.0f;
  }

  // oscillator rotation of band b for a detune of `angle` radians per sample
  // from the band centre (small-angle series, far below float noise here).
  void set_rotation(int b, float angle) {
    const float a2 = angle * angle;
    const float c = 1.0f - a2 * (0.5f - a2 * (1.0f / 24.0f));
    const float s = angle * (1.0f - a2 * ((1.0f / 6.0f) - a2 * (1.0f / 120.0f)));
    rot_r_[b] = centre_r_[b] * c - centre_i_[b] * s;
    rot_i_[b] = centre_r_[b] * s + centre_i_[b] * c;
    const float h = 0.5f * angle;
    const float h2 = h * h;
    const float hc = 1.0f - h2 * (0.5f - h2 * (1.0f / 24.0f));
    const float hs = h * (1.0f - h2 * ((1.0f / 6.0f) - h2 * (1.0f / 120.0f)));
    hrot_r_[b] = half_r_[b] * hc - half_i_[b] * hs;
    hrot_i_[b] = half_r_[b] * hs + half_i_[b] * hc;
    // One Newton step back to unit length undoes the rounding of a tick.
    const float fix = 1.5f - 0.5f * (ur_[b] * ur_[b] + ui_[b] * ui_[b]);
    ur_[b] *= fix;
    ui_[b] *= fix;
    const float half_fix = 1.5f - 0.5f * (hr_[b] * hr_[b] + hi_[b] * hi_[b]);
    hr_[b] *= half_fix;
    hi_[b] *= half_fix;
  }

  // The oscillators: turn each sounding band's phasor and add it to its bus.
  void synthesise(float* groups) {
    for (int b = 0; b < kBands; ++b) {
      if (gain_[b] == 0.0f && gain_step_[b] == 0.0f) continue;
      const float re = ur_[b] * rot_r_[b] - ui_[b] * rot_i_[b];
      const float im = ur_[b] * rot_i_[b] + ui_[b] * rot_r_[b];
      ur_[b] = re;
      ui_[b] = im;
      gain_[b] += gain_step_[b];
      float voice = re + up_[b] * (re * re - im * im);
      if (down_active_) {
        const float half_re = hr_[b] * hrot_r_[b] - hi_[b] * hrot_i_[b];
        const float half_im = hr_[b] * hrot_i_[b] + hi_[b] * hrot_r_[b];
        hr_[b] = half_re;
        hi_[b] = half_im;
        voice += down_[b] * half_re;
      }
      groups[b & (kGroups - 1)] += gain_[b] * voice;
    }
  }

  // Centre map: f(p) = (lo + c)·e^{kp} − c. The offset c widens the bands (in
  // octaves) towards the bottom, as the ear's own filters do.
  static constexpr float kMapOffsetHz = 60.0f;
  // Per-stage -3 dB width of a resonator as a multiple of the band spacing.
  static constexpr float kBandwidthFactor = 1.55f;
  static constexpr float kLockFactor = 0.3f;
  static constexpr float kFastSeconds = 0.008f;
  static constexpr float kOctaveSeconds = 0.06f;
  // The second section at full Octaves, against the unshifted pad.
  static constexpr float kOctaveLevel = 0.9f;
  static constexpr float kEstimateSeconds = 0.008f;
  static constexpr float kCommitSeconds = 0.025f;

  float rate_ = 24000.0f;
  int counter_ = 0;
  bool sounding_ = false;
  bool down_active_ = false;
  float fast_ = 0.0f, estimate_ = 0.0f, commit_ = 0.0f, octave_coeff_ = 0.0f;
  float attack_ = 0.01f, release_ = 0.001f, release_follow_ = 0.01f;
  float threshold2_ = 1.0e-6f;
  float octaves_ = 0.0f, octaves_target_ = 0.0f;

  // Fixed per band.
  float hz_[kBands] = {};
  float pole_r_[kBands] = {}, pole_i_[kBands] = {}, in_gain_[kBands] = {};
  float centre_r_[kBands] = {}, centre_i_[kBands] = {};
  float half_r_[kBands] = {}, half_i_[kBands] = {};
  float unlag_r_[kBands] = {}, unlag_i_[kBands] = {};
  float lock_[kBands] = {}, max_dev_[kBands] = {}, up_taper_[kBands] = {};
  float detune_scale_[kBands] = {}, stage_norm_[kBands] = {}, share_scale_[kBands] = {};
  // Audio-rate state.
  float s1r_[kBands] = {}, s1i_[kBands] = {}, s2r_[kBands] = {}, s2i_[kBands] = {};
  float ur_[kBands] = {}, ui_[kBands] = {}, hr_[kBands] = {}, hi_[kBands] = {};
  float rot_r_[kBands] = {}, rot_i_[kBands] = {}, hrot_r_[kBands] = {}, hrot_i_[kBands] = {};
  float gain_[kBands] = {}, gain_step_[kBands] = {};
  float up_[kBands] = {}, down_[kBands] = {};
  // Control-rate state.
  float last_r_[kBands] = {}, last_i_[kBands] = {};
  float mag_[kBands] = {}, level_[kBands] = {};
  float env1_[kBands] = {}, env2_[kBands] = {};
  float dev_est_[kBands] = {}, dev_[kBands] = {};
};

}  // namespace pad_follower
}  // namespace livemix
