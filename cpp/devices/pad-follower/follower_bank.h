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
      // The octave above fades out before it would reach the internal Nyquist.
      const double doubled = 2.0 * hz / rate;
      up_taper_[b] = kit::clamp(static_cast<float>((0.44 - doubled) / 0.10), 0.0f, 1.0f);
    }
    fast_ = 1.0f - kit::time_to_coeff(kFastSeconds, rate / kTick);
    peak_decay_ = kit::time_to_coeff(kPeakSeconds, rate / kTick);
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
      mag_[b] = peak_[b] = 0.0f;
      env1_[b] = env2_[b] = 0.0f;
      dev_est_[b] = dev_[b] = 0.0f;
    }
    counter_ = 0;
    sounding_ = false;
  }

  float band_hz(int b) const { return hz_[b]; }
  // True while any band's oscillator is audible.
  bool sounding() const { return sounding_; }

 private:
  // Centre map: f(p) = (lo + c)·e^{kp} − c. The offset c widens the bands (in
  // octaves) towards the bottom, as the ear's own filters do.
  static constexpr float kMapOffsetHz = 60.0f;
  // Per-stage -3 dB width of a resonator as a multiple of the band spacing.
  static constexpr float kBandwidthFactor = 1.55f;
  static constexpr float kLockFactor = 0.3f;
  static constexpr float kFastSeconds = 0.008f;
  static constexpr float kPeakSeconds = 0.08f;
  static constexpr float kEstimateSeconds = 0.008f;
  static constexpr float kCommitSeconds = 0.03f;

  float rate_ = 24000.0f;
  int counter_ = 0;
  bool sounding_ = false;
  float fast_ = 0.0f, peak_decay_ = 0.0f, estimate_ = 0.0f, commit_ = 0.0f;

  // Fixed per band.
  float hz_[kBands] = {};
  float pole_r_[kBands] = {}, pole_i_[kBands] = {}, in_gain_[kBands] = {};
  float centre_r_[kBands] = {}, centre_i_[kBands] = {};
  float half_r_[kBands] = {}, half_i_[kBands] = {};
  float unlag_r_[kBands] = {}, unlag_i_[kBands] = {};
  float lock_[kBands] = {}, max_dev_[kBands] = {}, up_taper_[kBands] = {};
  // Audio-rate state.
  float s1r_[kBands] = {}, s1i_[kBands] = {}, s2r_[kBands] = {}, s2i_[kBands] = {};
  float ur_[kBands] = {}, ui_[kBands] = {}, hr_[kBands] = {}, hi_[kBands] = {};
  float rot_r_[kBands] = {}, rot_i_[kBands] = {}, hrot_r_[kBands] = {}, hrot_i_[kBands] = {};
  float gain_[kBands] = {}, gain_step_[kBands] = {};
  float up_[kBands] = {}, down_[kBands] = {};
  // Control-rate state.
  float last_r_[kBands] = {}, last_i_[kBands] = {};
  float mag_[kBands] = {}, peak_[kBands] = {};
  float env1_[kBands] = {}, env2_[kBands] = {};
  float dev_est_[kBands] = {}, dev_[kBands] = {};
};

}  // namespace pad_follower
}  // namespace livemix
