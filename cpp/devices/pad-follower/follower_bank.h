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
#include "../../kit/oversample.h"

namespace livemix {
namespace pad_follower {

class FollowerBank {
 public:
  static constexpr int kBands = 64;
  static constexpr int kGroups = 8;
  // Samples per control tick; a multiple of four (see analyse).
  static constexpr int kTick = 24;
  static constexpr float kLowestHz = 60.0f;
  static constexpr float kHighestHz = 6000.0f;

  // `rate` is the rate the bank is ticked at. Clears all state.
  void prepare(float rate) {
    rate_ = rate;
    const double two_pi = 6.283185307179586;
    const double top = kHighestHz < 0.27f * rate ? kHighestHz : 0.27f * rate;
    const double span = std::log((top + kMapOffsetHz) / (kLowestHz + kMapOffsetHz));
    slow_end_ = 0;
    mid_end_ = 0;
    for (int b = 0; b < kBands; ++b) {
      const double position = static_cast<double>(b) / (kBands - 1);
      const double hz = (kLowestHz + kMapOffsetHz) * std::exp(span * position) - kMapOffsetHz;
      const double spacing = (hz + kMapOffsetHz) * span / (kBands - 1);
      const double w = two_pi * hz / rate;
      // The resonators of the lower bands run on every second or fourth
      // sample (see analyse), so their poles are laid out for that rate.
      int divisor = 1;
      if (hz + spacing <= kHalfbandFlat * rate / 4.0) {
        divisor = 4;
        slow_end_ = b + 1;
      }
      if (divisor == 1 && hz + spacing <= kHalfbandFlat * rate / 2.0) {
        divisor = 2;
        mid_end_ = b + 1;
      }
      const double r = std::exp(-3.141592653589793 * kBandwidthFactor * spacing * divisor / rate);
      hz_[b] = static_cast<float>(hz);
      omega_[b] = static_cast<float>(w);
      pole_r_[b] = static_cast<float>(r * std::cos(w * divisor));
      pole_i_[b] = static_cast<float>(r * std::sin(w * divisor));
      // A real sine of amplitude A is two phasors of A/2; the band keeps one.
      in_gain_[b] = static_cast<float>(2.0 * (1.0 - r) * (1.0 - r));
      centre_r_[b] = static_cast<float>(std::cos(w));
      centre_i_[b] = static_cast<float>(std::sin(w));
      half_r_[b] = static_cast<float>(std::cos(0.5 * w));
      half_i_[b] = static_cast<float>(std::sin(0.5 * w));
      unlag_r_[b] = static_cast<float>(std::cos(kTick * w));
      unlag_i_[b] = static_cast<float>(-std::sin(kTick * w));
      // The lock pulls in over about a third of the band's own width, and
      // the tracked frequency may leave the centre by two band spacings.
      lock_[b] = static_cast<float>(two_pi * kLockFactor * spacing / rate);
      // (and no further than the phase step between two ticks can tell apart).
      max_dev_[b] = kit::min(static_cast<float>(two_pi * 2.0 * spacing / rate), 2.8f / kTick);
      detune_scale_[b] = static_cast<float>(divisor * r / (1.0 - r));
      stage_scale_[b] = static_cast<float>(1.0 / ((1.0 - r) * (1.0 - r)));
      share_scale_[b] = static_cast<float>(rate / (two_pi * spacing));
      // Times, in ticks. The resonator pair settles in about three of its
      // time constants; the reading is averaged over a beat against a
      // partial one band away; a stopped partial is noticed once the ring
      // has fallen to kGoneRatio, about two and a half time constants.
      const double ticks = rate / kTick;
      const double ring = 1.0 / (3.141592653589793 * kBandwidthFactor * spacing);
      const double average = kit::clamp(static_cast<float>(1.0 / spacing), 0.012f, 0.08f);
      estimate_coeff_[b] = static_cast<float>(1.0 - std::exp(-1.0 / (average * ticks)));
      warm_[b] = 2 + static_cast<int>(3.0 * ring * ticks);
      settle_[b] = warm_[b] + 2 + static_cast<int>(average * ticks);
      keep_[b] = 2 + static_cast<int>((2.5 * ring + 0.012) * ticks);
      // The octave above fades out before it would reach the internal Nyquist.
      const double doubled = 2.0 * hz / rate;
      up_taper_[b] = kit::clamp(static_cast<float>((0.44 - doubled) / 0.10), 0.0f, 1.0f);
    }
    if (mid_end_ < slow_end_) mid_end_ = slow_end_;
    halve_[0].init();
    halve_[1].init();
    fast_ = 1.0f - kit::time_to_coeff(kFastSeconds, rate / kTick);
    octave_coeff_ = 1.0f - kit::time_to_coeff(kOctaveSeconds, rate / kTick);
    trust_rise_ = 1.0f - kit::time_to_coeff(kTrustRiseSeconds, rate / kTick);
    trust_fall_ = 1.0f - kit::time_to_coeff(kTrustFallSeconds, rate / kTick);
    peak_decay_ = kit::time_to_coeff(kPeakSeconds, rate / kTick);
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
      dev_[b] = 0.0f;
      trust_[b] = estimate_[b] = average_[b] = peak_[b] = jitter_[b] = first_[b] = 0.0f;
      kept_[b] = kept_older_[b] = 0.0f;
      age_[b] = 0;
      doubt_[b] = 0;
    }
    halve_[0].reset();
    halve_[1].reset();
    for (float& v : wait_full_) v = 0.0f;
    for (float& v : wait_half_) v = 0.0f;
    pair_[0] = pair_[1] = quad_[0] = quad_[1] = 0.0f;
    write_full_ = write_half_ = 0;
    step_ = 0;
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
    // The follower starts once a band has settled on its partial, which
    // takes about 70 ms in the middle of the range; that is part of the rise.
    const float swell = kit::max(0.3f * rise_seconds, rise_seconds - 0.07f);
    attack_ = 1.0f - kit::time_to_coeff(swell / 3.89f, ticks);
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
  // The resonators, in three tiers. Nothing below a quarter of the rate can
  // be in a band under an eighth of it, so the lower bands are fed a
  // half-band-filtered copy of the input at half or a quarter of the rate
  // and run only when it has a new sample: about a third of the work for
  // the same bands. The copies arrive late by the filters' delay (32 and 96
  // samples), so the faster tiers wait for them and every band hears the
  // same instant; the oscillators of neighbouring bands in different tiers
  // then lock to the same phase.
  void analyse(float x) {
    wait_full_[write_full_] = x;
    resonate(mid_end_, kBands, wait_full_[(write_full_ - kWaitFull) & (kWaitSize - 1)]);
    write_full_ = (write_full_ + 1) & (kWaitSize - 1);
    pair_[step_ & 1] = x;
    if (step_ & 1) {
      const float half = halve_[0].down(pair_[0], pair_[1]);
      wait_half_[write_half_] = half;
      resonate(slow_end_, mid_end_, wait_half_[(write_half_ - kWaitHalf) & (kWaitSize - 1)]);
      write_half_ = (write_half_ + 1) & (kWaitSize - 1);
      quad_[step_ >> 1] = half;
      if (step_ == 3) resonate(0, slow_end_, halve_[1].down(quad_[0], quad_[1]));
    }
    step_ = (step_ + 1) & 3;
  }

  // s1 = s1·p + g·x, s2 = s2·p + s1: unity gain at the band centre.
  void resonate(int from, int to, float x) {
    for (int b = from; b < to; ++b) {
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

  // atan2 to about 1e-5 rad (a minimax polynomial on the first octant), for
  // the readings too wild for the series in steer().
  static float fast_atan2(float y, float x) {
    const float ax = std::fabs(x), ay = std::fabs(y);
    const float hi = ax > ay ? ax : ay;
    if (!(hi > 0.0f)) return 0.0f;
    const float q = (ax > ay ? ay : ax) / hi;
    const float q2 = q * q;
    float a = q * (0.99997726f +
                   q2 * (-0.33262347f +
                         q2 * (0.19354346f + q2 * (-0.11643287f + q2 * (0.05265332f - 0.01172120f * q2)))));
    if (ay > ax) a = kit::kHalfPi - a;
    if (x < 0.0f) a = kit::kPi - a;
    return y < 0.0f ? -a : a;
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

    // What the band hears: the phase z advanced since the last tick, less
    // what the centre frequency turns in that time, is the detune of the
    // partial in it. Averaged as an angle, without weighting by power, the
    // reading of a band that holds two partials settles on the stronger one
    // (the weaker only makes the phase wobble around it).
    float measured = 0.0f;
    if (m > 1.0e-7f) {
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
        angle = fast_atan2(ei, er);
      }
      measured = angle * (1.0f / kTick);
    }

    // Is the partial still being played? Its level against the recent peak:
    // a band rings on at its own centre once the input stops, so readings
    // taken after that are worthless.
    float recent = kit::max(mag, peak_[b] * peak_decay_);
    if (recent < 1.0e-12f) recent = 0.0f;
    peak_[b] = recent;
    const float mag2 = mag * mag;
    float presence = 0.0f;
    if (mag > 1.0e-7f) {
      presence = kit::clamp((mag / recent - kGoneRatio) * 5.0f, 0.0f, 1.0f) * mag2 /
                 (mag2 + 0.0625f * threshold2_);
    }
    // How far off is the partial? The phase step between two ticks cannot
    // tell a partial inside the band from one a whole tick rate away, but the
    // two stages can: the first is the less selective, so far-off sound is
    // stronger there (|s1|²/|s2|² is 1 + t² in a steady state). Past about
    // one and a quarter band spacings the band is only hearing a neighbour.
    const float first = first_[b] + (first2 * stage_scale_[b] - first_[b]) * fast_;
    first_[b] = first < 1.0e-20f ? 0.0f : first;
    presence *= kit::clamp((kFarMute * mag2 - first) / ((kFarMute - kFarFull) * mag2 + 1.0e-30f), 0.0f, 1.0f);
    bool settled = false;
    if (presence > 0.0f) {
      doubt_[b] = 0;
      if (age_[b] < 30000) ++age_[b];
      if (age_[b] <= warm_[b]) {
        // The resonators are still settling on the new sound.
        estimate_[b] = 0.0f;
      } else if (age_[b] < settle_[b]) {
        // First reading: a plain mean over one averaging time.
        estimate_[b] += measured;
      } else if (age_[b] == settle_[b]) {
        const float first = kit::clamp(
            (estimate_[b] + measured) / static_cast<float>(settle_[b] - warm_[b]), -max_dev_[b],
            max_dev_[b]);
        estimate_[b] = average_[b] = kept_[b] = kept_older_[b] = first;
        jitter_[b] = 0.0f;
        // A band whose oscillator is silent takes it as it is.
        if (level_[b] < 1.0e-4f) dev_[b] = first;
      } else {
        // From then on two poles, so the beat against a neighbouring partial
        // does not reach the oscillator.
        const float off = kit::min(std::fabs(measured - estimate_[b]) * share_scale_[b], 4.0f);
        jitter_[b] += estimate_coeff_[b] * (off - jitter_[b]);
        estimate_[b] += estimate_coeff_[b] * (measured - estimate_[b]);
        estimate_[b] = kit::clamp(estimate_[b], -max_dev_[b], max_dev_[b]);
        average_[b] += estimate_coeff_[b] * (estimate_[b] - average_[b]);
        if ((age_[b] - settle_[b]) % keep_[b] == 0) {
          kept_older_[b] = kept_[b];
          kept_[b] = average_[b];
        }
      }
      settled = age_[b] >= settle_[b];
    } else if (age_[b] > settle_[b] && mag > 1.0e-7f && doubt_[b] < keep_[b]) {
      // Fallen away, but perhaps only for the trough of a beat between two
      // partials: keep reading (the wild readings of a trough are what marks
      // such a band as impure) and note nothing until it is back.
      ++doubt_[b];
      const float off = kit::min(std::fabs(measured - estimate_[b]) * share_scale_[b], 4.0f);
      jitter_[b] += estimate_coeff_[b] * (off - jitter_[b]);
      estimate_[b] += estimate_coeff_[b] * (measured - estimate_[b]);
      estimate_[b] = kit::clamp(estimate_[b], -max_dev_[b], max_dev_[b]);
      average_[b] += estimate_coeff_[b] * (estimate_[b] - average_[b]);
    } else {
      // Gone. The newer note of the reading may already be bent by the ring.
      age_[b] = 0;
      doubt_[b] = 0;
      kept_[b] = kept_older_[b];
    }
    // The oscillator follows the reading as it stood one to two notes ago:
    // by the time a ring is noticed it has not been heard.
    dev_[b] += commit_ * (kept_older_[b] - dev_[b]);
    // A band in which two partials are about equally strong has no pitch of
    // its own: its reading swings by bands at a time. So does noise. Neither
    // gets a voice (each of the two partials has nearer bands that do).
    const float purity = kit::clamp((kJitterMute - jitter_[b]) * (1.0f / (kJitterMute - kJitterFull)), 0.0f, 1.0f);
    const float follow = settled ? presence * purity : 0.0f;
    const float trust = trust_[b] + (follow - trust_[b]) * (follow > trust_[b] ? trust_rise_ : trust_fall_);
    trust_[b] = trust < 1.0e-6f ? 0.0f : trust;

    // The resonator's own response at a detune d is 1/(1 + jt)² with
    // t = d·r/(1 − r); dividing it out gives the partial itself.
    const float t = detune_scale_[b] * dev_[b];
    const float boost = 1.0f + t * t;
    float pull = 0.0f;
    if (follow > 0.0f) {
      // Lock: the partial's phase (z with the resonator's shift undone)
      // against the oscillator's.
      const float cr = 1.0f - t * t, ci = 2.0f * t;
      const float pr = zr * cr - zi * ci;
      const float pi = zr * ci + zi * cr;
      const float error = (pi * ur_[b] - pr * ui_[b]) / (m * boost + 1.0e-12f);
      pull = lock_[b] * follow * error;
    }
    last_r_[b] = zr;
    last_i_[b] = zi;
    // The octave below has a phase of its own. Where two neighbouring bands
    // follow the same partial, the upper one's is pulled to the lower one's
    // (if that one is sounding: a silent oscillator stands still), or the
    // two halves of that note could cancel.
    float half_pull = 0.0f;
    if (down_active_ && b > 0 && follow > 0.0f && trust_[b - 1] > 0.5f && level_[b - 1] > 0.0f) {
      const float apart = (omega_[b] + dev_[b]) - (omega_[b - 1] + dev_[b - 1]);
      if (std::fabs(apart) * share_scale_[b] < 0.15f) {
        half_pull = lock_[b] * follow * (hi_[b - 1] * hr_[b] - hr_[b - 1] * hi_[b]);
      }
    }
    set_rotation(b, dev_[b] + pull, half_pull);

    // Level: the partial's amplitude, shared between the two bands it lies
    // between, through the gate and the slow follower.
    const float share = kit::max(0.0f, 1.0f - std::fabs(dev_[b]) * share_scale_[b]);
    const float partial = mag * boost * share * trust_[b];
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
  void set_rotation(int b, float angle, float half_extra) {
    const float a2 = angle * angle;
    const float c = 1.0f - a2 * (0.5f - a2 * (1.0f / 24.0f));
    const float s = angle * (1.0f - a2 * ((1.0f / 6.0f) - a2 * (1.0f / 120.0f)));
    rot_r_[b] = centre_r_[b] * c - centre_i_[b] * s;
    rot_i_[b] = centre_r_[b] * s + centre_i_[b] * c;
    // One Newton step back to unit length undoes the rounding of a tick.
    const float fix = 1.5f - 0.5f * (ur_[b] * ur_[b] + ui_[b] * ui_[b]);
    ur_[b] *= fix;
    ui_[b] *= fix;
    if (!down_active_) return;
    const float h = 0.5f * angle + half_extra;
    const float h2 = h * h;
    const float hc = 1.0f - h2 * (0.5f - h2 * (1.0f / 24.0f));
    const float hs = h * (1.0f - h2 * ((1.0f / 6.0f) - h2 * (1.0f / 120.0f)));
    hrot_r_[b] = half_r_[b] * hc - half_i_[b] * hs;
    hrot_i_[b] = half_r_[b] * hs + half_i_[b] * hc;
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
  static constexpr float kTrustRiseSeconds = 0.012f;
  static constexpr float kTrustFallSeconds = 0.06f;
  // A partial counts as gone once its band has fallen to this share of its
  // recent peak (a peak that itself decays with kPeakSeconds).
  static constexpr float kGoneRatio = 0.3f;
  static constexpr float kPeakSeconds = 0.15f;
  // Mean swing of the reading, in band spacings: a full voice up to the
  // first, none from the second.
  // |s1|²/|s2|² (normalised): a full voice up to the first, none from the second.
  static constexpr float kFarFull = 3.2f;
  static constexpr float kFarMute = 4.8f;
  static constexpr float kJitterFull = 0.6f;
  static constexpr float kJitterMute = 1.1f;
  // The second section at full Octaves, against the unshifted pad.
  static constexpr float kOctaveLevel = 0.9f;
  static constexpr float kCommitSeconds = 0.025f;

  // The kit's half-band filter is flat to 0.42 of its output rate.
  static constexpr float kHalfbandFlat = 0.42f;
  static constexpr int kWaitSize = 128;
  static constexpr int kWaitFull = 96;  // samples
  static constexpr int kWaitHalf = 32;  // samples at half the rate

  kit::Halfband2x halve_[2];
  float wait_full_[kWaitSize] = {}, wait_half_[kWaitSize] = {};
  float pair_[2] = {}, quad_[2] = {};
  int write_full_ = 0, write_half_ = 0, step_ = 0;
  int slow_end_ = 0, mid_end_ = 0;
  float rate_ = 24000.0f;
  int counter_ = 0;
  bool sounding_ = false;
  bool down_active_ = false;
  float fast_ = 0.0f, peak_decay_ = 0.0f, commit_ = 0.0f, octave_coeff_ = 0.0f;
  float trust_rise_ = 0.0f, trust_fall_ = 0.0f;
  float attack_ = 0.01f, release_ = 0.001f, release_follow_ = 0.01f;
  float threshold2_ = 1.0e-6f;
  float octaves_ = 0.0f, octaves_target_ = 0.0f;

  // Fixed per band.
  float hz_[kBands] = {}, omega_[kBands] = {};
  float pole_r_[kBands] = {}, pole_i_[kBands] = {}, in_gain_[kBands] = {};
  float centre_r_[kBands] = {}, centre_i_[kBands] = {};
  float half_r_[kBands] = {}, half_i_[kBands] = {};
  float unlag_r_[kBands] = {}, unlag_i_[kBands] = {};
  float lock_[kBands] = {}, max_dev_[kBands] = {}, up_taper_[kBands] = {};
  float detune_scale_[kBands] = {}, share_scale_[kBands] = {}, estimate_coeff_[kBands] = {};
  float stage_scale_[kBands] = {};
  int warm_[kBands] = {}, settle_[kBands] = {}, keep_[kBands] = {};
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
  float estimate_[kBands] = {}, average_[kBands] = {}, dev_[kBands] = {}, trust_[kBands] = {}, peak_[kBands] = {};
  float kept_[kBands] = {}, kept_older_[kBands] = {}, jitter_[kBands] = {}, first_[kBands] = {};
  int age_[kBands] = {}, doubt_[kBands] = {};
};

}  // namespace pad_follower
}  // namespace livemix
