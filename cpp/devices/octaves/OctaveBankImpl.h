#pragma once

// Definitions for OctaveBank (included at the end of OctaveBank.h).

namespace livemix {
namespace octaves {

namespace layout {
// Channel density in channels per octave: sparse at the bottom, densest
// where chords are played (about a semitone and a quarter per channel, so
// the notes of a close chord fall in different channels), a little sparser
// above, where the partials of a chord interleave whatever the spacing.
constexpr double kEdgeHz[2] = {80.0, 900.0};
constexpr double kPerOctave[3] = {5.0, 9.5, 7.5};

// Position on the channel scale (channels from 1 Hz) and its inverse.
inline double position(double hz) {
  const double a = std::log2(kEdgeHz[0]), b = std::log2(kEdgeHz[1]);
  const double x = std::log2(hz);
  if (x <= a) return kPerOctave[0] * x;
  if (x <= b) return kPerOctave[0] * a + kPerOctave[1] * (x - a);
  return kPerOctave[0] * a + kPerOctave[1] * (b - a) + kPerOctave[2] * (x - b);
}
inline double frequency(double pos) {
  const double a = std::log2(kEdgeHz[0]), b = std::log2(kEdgeHz[1]);
  const double pa = kPerOctave[0] * a, pb = pa + kPerOctave[1] * (b - a);
  if (pos <= pa) return std::exp2(pos / kPerOctave[0]);
  if (pos <= pb) return std::exp2(a + (pos - pa) / kPerOctave[1]);
  return std::exp2(b + (pos - pb) / kPerOctave[2]);
}
}  // namespace layout

inline void OctaveBank::init(float rate, float low_hz, float high_hz, int count) {
  rate_ = rate;
  bands_ = count < 2 ? 2 : (count > kMaxBands ? kMaxBands : count);
  tick_period_ = static_cast<int>(rate / kTickHz + 0.5f);
  if (tick_period_ < 1) tick_period_ = 1;
  tick_counter_ = 0;
  inv_period_ = 1.0f / static_cast<float>(tick_period_);
  tick_seconds_ = static_cast<float>(tick_period_) / rate;
  power_coeff_ = 1.0f - std::exp(-tick_seconds_ / kPowerSeconds);
  rotor_coeff_ = 1.0f - std::exp(-tick_seconds_ / kRotorSeconds);
  agree_coeff_ = 1.0f - std::exp(-tick_seconds_ / kAgreeSeconds);
  rise_coeff_ = 1.0f - std::exp(-tick_seconds_ / 0.03f);
  attack_coeff_ = 0.0f;
  detune_ = 0.0f;

  const double lo = layout::position(low_hz);
  const double hi = layout::position(high_hz);
  const double step = (hi - lo) / (bands_ - 1);
  const double up1_high = 0.21 * rate, up2_high = 0.105 * rate;
  for (int k = 0; k < bands_; ++k) {
    const double hz = layout::frequency(lo + step * k);
    const double spacing =
        0.5 * (layout::frequency(lo + step * (k + 1)) - layout::frequency(lo + step * (k - 1)));
    const double w = 2.0 * kPiD * hz / rate;
    centre_[k] = static_cast<float>(hz);
    carrier_re_[k] = static_cast<float>(std::cos(w));
    carrier_im_[k] = static_cast<float>(std::sin(w));
    const double narrow = kNarrow * spacing;
    double wide = kWideErb * (24.7 + 0.108 * hz);
    if (wide < narrow) wide = narrow;
    narrow_hz_[k] = static_cast<float>(narrow);
    wide_hz_[k] = static_cast<float>(wide);
    for (int s = 0; s < kStages; ++s) {
      for (int which = 0; which < 2; ++which) {
        const double cutoff = 2.0 * kPiD * (which == 0 ? narrow : wide) / rate;
        const double r = std::exp(-kSigma[s] * cutoff);
        const double angle = w + kNu[s] * cutoff;
        (which == 0 ? narrow_re_ : wide_re_)[s][k] = static_cast<float>(r * std::cos(angle));
        (which == 0 ? narrow_im_ : wide_im_)[s][k] = static_cast<float>(r * std::sin(angle));
      }
      yr_[s][k] = 0.0f;
      yi_[s][k] = 0.0f;
    }
    limit_sub1_[k] = fade_in(hz, kSub1LowHz, kSub1LowHz * 1.4);
    limit_sub2_[k] = fade_in(hz, kSub2LowHz, kSub2LowHz * 1.4);
    limit_up1_[k] = 1.0f - fade_in(hz, up1_high * 0.8, up1_high);
    limit_up2_[k] = 1.0f - fade_in(hz, up2_high * 0.8, up2_high);
    int zone = static_cast<int>(std::floor(std::log2(hz / 80.0) + 0.5));
    zone_of_[k] = zone < 0 ? 0 : (zone >= kZones ? kZones - 1 : zone);

    open_[k] = 0.0f;
    age_[k] = 1.0f;
    rise_slow_[k] = 0.0f;
    rot_re_[k] = rot_target_re_[k] = 1.0f;
    rot_im_[k] = rot_target_im_[k] = 0.0f;
    rot_step_re_[k] = rot_step_im_[k] = 0.0f;
    avg_re_[k] = avg_im_[k] = 0.0f;
    power_[k] = 0.0f;
    slow_[k] = 0.0f;
    weight_[k] = weight_step_[k] = weight_target_[k] = 0.0f;
    agree_[k] = 0.0f;
    half_re_[k] = quarter_re_[k] = 1.0f;
    half_im_[k] = quarter_im_[k] = 0.0f;
    half_norm_[k] = quarter_norm_[k] = 0.5f;
    for (int v = 0; v < 4; ++v) {
      det_re_[v][k] = 1.0f;
      det_im_[v][k] = 0.0f;
      det_cos_[v][k] = 1.0f;
      det_sin_[v][k] = 0.0f;
    }
    set_width(k, 0.0f, false);
  }
  up1_bands_ = bands_;
  while (up1_bands_ > 0 && limit_up1_[up1_bands_ - 1] == 0.0f) --up1_bands_;
  up2_bands_ = bands_;
  while (up2_bands_ > 0 && limit_up2_[up2_bands_ - 1] == 0.0f) --up2_bands_;

  for (int z = 0; z < kZones; ++z) {
    zone_filter_[z].reset();
    zone_filter_[z].set(80.0f * std::exp2(static_cast<float>(z)), 1.2f, rate);
    zone_fast_[z] = 0.0f;
    zone_slow_[z] = 0.0f;
    zone_armed_[z] = true;
    zone_fired_[z] = false;
  }
  zone_attack_ = std::exp(-1.0f / (0.0005f * rate));
  zone_release_ = std::exp(-1.0f / (0.004f * rate));
  zone_slow_coeff_ = 1.0f - std::exp(-1.0f / (0.025f * rate));
}

// Move channel k's poles to `open` (0 settled .. 1 just after an onset). The
// input gain keeps a centred partial at unity; the two inner states are
// rescaled so that partial does not notice the move.
inline void OctaveBank::set_width(int k, float open, bool rescale) {
  const float cr = carrier_re_[k], ci = carrier_im_[k];
  float old_re[kStages], old_im[kStages], new_re[kStages], new_im[kStages];
  float product = 1.0f;
  for (int s = 0; s < kStages; ++s) {
    // d = 1 - pole × conj(carrier): the stage's inverse gain at the centre.
    old_re[s] = 1.0f - (pole_re_[s][k] * cr + pole_im_[s][k] * ci);
    old_im[s] = -(pole_im_[s][k] * cr - pole_re_[s][k] * ci);
    const float pr = narrow_re_[s][k] + open * (wide_re_[s][k] - narrow_re_[s][k]);
    const float pi = narrow_im_[s][k] + open * (wide_im_[s][k] - narrow_im_[s][k]);
    pole_re_[s][k] = pr;
    pole_im_[s][k] = pi;
    new_re[s] = 1.0f - (pr * cr + pi * ci);
    new_im[s] = -(pi * cr - pr * ci);
    product *= new_re[s] * new_re[s] + new_im[s] * new_im[s];
  }
  const float gain = 2.0f * std::sqrt(product);
  if (rescale && gain_[k] > 0.0f) {
    // Stage s settles at (gain × input) / (d0 … ds): scale each by new / old.
    float fr = gain / gain_[k], fi = 0.0f;
    for (int s = 0; s < kStages - 1; ++s) {
      // f *= old_d / new_d
      const float inv = 1.0f / (new_re[s] * new_re[s] + new_im[s] * new_im[s]);
      const float qr = (old_re[s] * new_re[s] + old_im[s] * new_im[s]) * inv;
      const float qi = (old_im[s] * new_re[s] - old_re[s] * new_im[s]) * inv;
      const float tr = fr * qr - fi * qi;
      fi = fr * qi + fi * qr;
      fr = tr;
      const float yr = yr_[s][k], yi = yi_[s][k];
      yr_[s][k] = yr * fr - yi * fi;
      yi_[s][k] = yr * fi + yi * fr;
      if (s == 0) rise_slow_[k] *= fr * fr + fi * fi;
      if (s == kStages - 2) {
        // The equaliser's average is stage 2 × conj(stage 3).
        const float ar = avg_re_[k], ai = avg_im_[k];
        avg_re_[k] = ar * fr - ai * fi;
        avg_im_[k] = ar * fi + ai * fr;
      }
    }
  }
  gain_[k] = gain;
  open_[k] = open;
}

inline void OctaveBank::process(float x, const Want& want, Frame* out) {
  // Onset zones: a fast envelope against a slow one, per octave.
  for (int z = 0; z < kZones; ++z) {
    const float band = zone_filter_[z].bandpass(x);
    const float magnitude = band < 0.0f ? -band : band;
    const float coeff = magnitude > zone_fast_[z] ? zone_attack_ : zone_release_;
    zone_fast_[z] = magnitude + (zone_fast_[z] - magnitude) * coeff;
    zone_slow_[z] += zone_slow_coeff_ * (zone_fast_[z] - zone_slow_[z]);
    const float slow = zone_slow_[z] + 1.0e-4f;
    if (zone_armed_[z]) {
      if (zone_fast_[z] > 1.8f * slow) {
        zone_fired_[z] = true;
        zone_armed_[z] = false;
      }
    } else if (zone_fast_[z] < 1.3f * slow) {
      zone_armed_[z] = true;
    }
  }

  float sub1 = 0.0f, sub2 = 0.0f;
  float up1[2] = {0.0f, 0.0f};
  float up2[2] = {0.0f, 0.0f};
  const bool detune = detune_ > 0.0f;
  const bool subs = want.sub1 || want.sub2;
  const bool ups = want.up1 || want.up2;
  for (int k = 0; k < bands_; ++k) {
    // Three complex one-pole resonators in series.
    float ar = yr_[0][k], ai = yi_[0][k];
    float pr = pole_re_[0][k], pi = pole_im_[0][k];
    float t = pr * ar - pi * ai + gain_[k] * x;
    ai = pr * ai + pi * ar;
    ar = t;
    yr_[0][k] = ar;
    yi_[0][k] = ai;
    float br = yr_[1][k], bi = yi_[1][k];
    pr = pole_re_[1][k];
    pi = pole_im_[1][k];
    t = pr * br - pi * bi + ar;
    bi = pr * bi + pi * br + ai;
    br = t;
    yr_[1][k] = br;
    yi_[1][k] = bi;
    float cr = yr_[2][k], ci = yi_[2][k];
    pr = pole_re_[2][k];
    pi = pole_im_[2][k];
    t = pr * cr - pi * ci + br;
    ci = pr * ci + pi * cr + bi;
    cr = t;
    yr_[2][k] = cr;
    yi_[2][k] = ci;

    // Take the channel's own phase shift out.
    const float rr = rot_re_[k], ri = rot_im_[k];
    rot_re_[k] = rr + rot_step_re_[k];
    rot_im_[k] = ri + rot_step_im_[k];
    const float zr = cr * rr - ci * ri;
    const float zi = cr * ri + ci * rr;
    const float power = zr * zr + zi * zi + 1.0e-30f;
    const float inv = 1.0f / std::sqrt(power);
    const float w = weight_[k];
    weight_[k] = w + weight_step_[k];
    const float amp = power * inv * w;
    const float c = zr * inv, s = zi * inv;
    const int bus = k & 1;

    if (ups) {
      const float c2 = c * c - s * s;
      const float s2 = 2.0f * c * s;
      if (want.up1 && k < up1_bands_) {
        const float g = amp * limit_up1_[k];
        if (detune) {
          float dr, di;
          turn(2, k, &dr, &di);
          up1[bus] += g * (c2 * dr - s2 * di);
        } else {
          up1[bus] += g * c2;
        }
      }
      if (want.up2 && k < up2_bands_) {
        const float g = amp * limit_up2_[k];
        const float c4 = c2 * c2 - s2 * s2;
        if (detune) {
          float dr, di;
          turn(3, k, &dr, &di);
          up2[bus ^ 1] += g * (c4 * dr - 2.0f * c2 * s2 * di);
        } else {
          up2[bus ^ 1] += g * c4;
        }
      }
    }

    if (subs) {
      // The half-angle phasor h (h² = unit phasor) lies midway between its
      // last value and unit × conj(last value): exact, and continuous
      // through the wraps of the phase. Its length is 2·cos(half the phase
      // step), nearly constant, so one Newton step keeps the normaliser.
      float hr = half_re_[k], hi = half_im_[k];
      float vr = hr + (c * hr + s * hi);
      float vi = hi + (s * hr - c * hi);
      float m2 = vr * vr + vi * vi;
      float n = half_norm_[k];
      n *= 1.5f - 0.5f * m2 * n * n;
      float check = m2 * n * n;
      if (!(check > 0.98f && check < 1.02f)) n = m2 > 1.0e-6f ? 1.0f / std::sqrt(m2) : 0.0f;
      if (n > 0.0f) {
        half_norm_[k] = n;
        hr = vr * n;
        hi = vi * n;
        half_re_[k] = hr;
        half_im_[k] = hi;
      }
      if (want.sub1) {
        const float g = amp * limit_sub1_[k];
        if (detune) {
          float dr, di;
          turn(1, k, &dr, &di);
          sub1 += g * (hr * dr - hi * di);
        } else {
          sub1 += g * hr;
        }
      }
      if (want.sub2) {
        float qr = quarter_re_[k], qi = quarter_im_[k];
        vr = qr + (hr * qr + hi * qi);
        vi = qi + (hi * qr - hr * qi);
        m2 = vr * vr + vi * vi;
        n = quarter_norm_[k];
        n *= 1.5f - 0.5f * m2 * n * n;
        check = m2 * n * n;
        if (!(check > 0.98f && check < 1.02f)) n = m2 > 1.0e-6f ? 1.0f / std::sqrt(m2) : 0.0f;
        if (n > 0.0f) {
          quarter_norm_[k] = n;
          qr = vr * n;
          qi = vi * n;
          quarter_re_[k] = qr;
          quarter_im_[k] = qi;
        }
        const float g = amp * limit_sub2_[k];
        if (detune) {
          float dr, di;
          turn(0, k, &dr, &di);
          sub2 += g * (qr * dr - qi * di);
        } else {
          sub2 += g * qr;
        }
      }
    }
  }
  out->sub2 = sub2;
  out->sub1 = sub1;
  out->up1[0] = up1[0];
  out->up1[1] = up1[1];
  out->up2[0] = up2[0];
  out->up2[1] = up2[1];

  if (++tick_counter_ >= tick_period_) {
    tick_counter_ = 0;
    tick();
  }
}

}  // namespace octaves
}  // namespace livemix
