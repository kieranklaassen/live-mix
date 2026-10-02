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

  for (int& size : zone_size_) size = 0;
  for (int k = 0; k < bands_; ++k) ++zone_size_[zone_of_[k]];
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

inline void OctaveBank::tick() {
  static_assert(kStages == 3, "the equaliser below is written for three stages");
  float unit_re[kMaxBands], unit_im[kMaxBands], sharp[kMaxBands], correction[kMaxBands];
  // Onsets. A channel whose first stage jumps has new energy in it. When a
  // good share of an octave's channels jump together it is a struck or
  // picked attack (its click reaches the channels between the partials too),
  // and the whole octave opens, including channels that already hold a note.
  bool jumped[kMaxBands];
  int votes[kZones] = {};
  for (int k = 0; k < bands_; ++k) {
    const float first = yr_[0][k] * yr_[0][k] + yi_[0][k] * yi_[0][k];
    jumped[k] = first > kJump * rise_slow_[k] + 1.0e-30f;
    if (jumped[k]) ++votes[zone_of_[k]];
    rise_slow_[k] += rise_coeff_ * (first - rise_slow_[k]);
  }
  for (int k = 0; k < bands_; ++k) {
    // Width: after an onset the channel opens, then narrows as 1 / age.
    const int zone = zone_of_[k];
    if (jumped[k] || votes[zone] * 5 >= zone_size_[zone] * 2) age_[k] = 0.0f;
    age_[k] += tick_seconds_;
    float cutoff = kOpenProduct / age_[k];
    if (cutoff > wide_hz_[k]) cutoff = wide_hz_[k];
    float open = 0.0f;
    if (cutoff > narrow_hz_[k]) open = (cutoff - narrow_hz_[k]) / (wide_hz_[k] - narrow_hz_[k]);
    if (open != open_[k]) set_width(k, open, true);

    const float br = yr_[1][k], bi = yi_[1][k];
    const float cr = yr_[2][k], ci = yi_[2][k];
    const float now = cr * cr + ci * ci;
    // Denormals: a channel that has rung out is put to rest.
    if (now < 1.0e-28f && power_[k] < 1.0e-28f) {
      for (int s = 0; s < kStages; ++s) {
        yr_[s][k] = 0.0f;
        yi_[s][k] = 0.0f;
      }
      avg_re_[k] = 0.0f;
      avg_im_[k] = 0.0f;
      power_[k] = 0.0f;
      slow_[k] = 0.0f;
      rise_slow_[k] = 0.0f;
    } else {
      power_[k] += power_coeff_ * (now - power_[k]);
      // stage 2 × conj(stage 3) points along 1 + j·x, where x is how far the
      // partial sits from the centre in units of the cutoff.
      avg_re_[k] += rotor_coeff_ * (br * cr + bi * ci - avg_re_[k]);
      avg_im_[k] += rotor_coeff_ * (bi * cr - br * ci - avg_im_[k]);
    }

    // The equaliser: the phase of all three stages at x, and what they took
    // off the partial's level there.
    rot_re_[k] = rot_target_re_[k];
    rot_im_[k] = rot_target_im_[k];
    float er = 1.0f, ei = 0.0f, gain = 1.0f;
    const float ar = avg_re_[k], ai = avg_im_[k];
    if (ar * ar + ai * ai > 1.0e-36f) {
      float x = ai < 0.0f ? -3.0f : 3.0f;
      if (ar > 0.0f && ai > -3.0f * ar && ai < 3.0f * ar) x = ai / ar;
      const float t0 = 2.0f * (x - 0.8660254f), t1 = 2.0f * (x + 0.8660254f);
      const float pr = 1.0f - t0 * t1, pi = t0 + t1;
      const float nr = pr - pi * x, ni = pi + pr * x;
      const float size = std::sqrt(nr * nr + ni * ni);
      er = nr / size;
      ei = ni / size;
      gain = size * 0.25f;
      if (gain > kMaxCorrection) gain = kMaxCorrection;
    }
    correction[k] = gain;
    rot_target_re_[k] = er;
    rot_target_im_[k] = ei;
    rot_step_re_[k] = (er - rot_re_[k]) * inv_period_;
    rot_step_im_[k] = (ei - rot_im_[k]) * inv_period_;
    // This sample's equalised unit phasor, for the agreement below.
    const float zr = cr * rot_re_[k] - ci * rot_im_[k];
    const float zi = cr * rot_im_[k] + ci * rot_re_[k];
    const float inv = 1.0f / std::sqrt(zr * zr + zi * zi + 1.0e-30f);
    unit_re[k] = zr * inv;
    unit_im[k] = zi * inv;
    sharp[k] = power_[k] * power_[k];
  }

  for (int k = 0; k < bands_; ++k) {
    // How far the channel stands out from its neighbours.
    const float below = k > 0 ? sharp[k - 1] : 0.0f;
    const float above = k < bands_ - 1 ? sharp[k + 1] : 0.0f;
    const float total = below + sharp[k] + above;
    float target = total > 0.0f ? correction[k] * sharp[k] / total : 0.0f;
    // Attack: the allowed level rises at the set rate and falls at once.
    const float level = std::sqrt(power_[k]);
    if (attack_coeff_ > 0.0f && level > slow_[k]) {
      slow_[k] += attack_coeff_ * (level - slow_[k]);
      target *= slow_[k] / level;
    } else {
      slow_[k] = level;
    }
    weight_[k] = weight_target_[k];
    weight_target_[k] = target;
    weight_step_[k] = (target - weight_[k]) * inv_period_;
    // The detune rotors are multiplied every sample: keep them at length 1.
    if (detune_ > 0.0f) {
      for (int v = 0; v < 4; ++v) {
        const float dr = det_re_[v][k], di = det_im_[v][k];
        const float fix = 1.5f - 0.5f * (dr * dr + di * di);
        det_re_[v][k] = dr * fix;
        det_im_[v][k] = di * fix;
      }
    }
  }

  // Phase agreement of each channel with the one above it: near 1 when both
  // hold the same partial, near 0 when they hold different ones.
  for (int k = 0; k < bands_ - 1; ++k) {
    const float dot = unit_re[k] * unit_re[k + 1] + unit_im[k] * unit_im[k + 1];
    agree_[k] += agree_coeff_ * (dot - agree_[k]);
  }
  // A square root has two signs. A channel beside a stronger one that holds
  // the same partial takes that neighbour's, so the sub octaves of one
  // partial add between channels instead of cancelling.
  for (int k = 0; k < bands_; ++k) {
    int j = -1;
    float best = power_[k];
    if (k > 0 && power_[k - 1] > best && agree_[k - 1] > kAgreeThreshold) {
      j = k - 1;
      best = power_[k - 1];
    }
    if (k < bands_ - 1 && power_[k + 1] > best && agree_[k] > kAgreeThreshold) j = k + 1;
    if (j < 0) continue;
    const float quarter_dot = quarter_re_[k] * quarter_re_[j] + quarter_im_[k] * quarter_im_[j];
    if (half_re_[k] * half_re_[j] + half_im_[k] * half_im_[j] < -0.2f) {
      half_re_[k] = -half_re_[k];
      half_im_[k] = -half_im_[k];
      // The quarter phasor is a root of the half phasor: a quarter turn,
      // towards the neighbour's.
      const float cross = quarter_im_[k] * quarter_re_[j] - quarter_re_[k] * quarter_im_[j];
      const float qr = quarter_re_[k], qi = quarter_im_[k];
      if (cross > 0.0f) {  // ahead of the neighbour: turn back
        quarter_re_[k] = qi;
        quarter_im_[k] = -qr;
      } else {
        quarter_re_[k] = -qi;
        quarter_im_[k] = qr;
      }
    } else if (quarter_dot < -0.2f) {
      quarter_re_[k] = -quarter_re_[k];
      quarter_im_[k] = -quarter_im_[k];
    }
  }
}

}  // namespace octaves
}  // namespace livemix
