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
  agree_coeff_ = 1.0f - std::exp(-tick_seconds_ / kAgreeSeconds);
  jump_index_ = 0;
  // A centred partial leaves stage 1 at (cutoff × 2π / rate)² times its level.
  first_unit_ = static_cast<float>(std::pow(2.0 * kPiD / rate, 4.0));
  jump_fall_ = std::exp(-tick_seconds_ / kJumpFall);
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

    open_[k] = 0.0f;
    age_[k] = 1.0f;
    jump_ref_[k] = 0.0f;
    for (int i = 0; i < kJumpDelay; ++i) jump_ring_[i][k] = 0.0f;
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
  // The grid: the next grid channel is the first one most of an open
  // bandwidth above the last. The others belong to the nearest grid channel.
  int last = 0;
  for (int k = 0; k < bands_; ++k) {
    grid_[k] = k == 0 || centre_[k] >= centre_[last] + 0.9f * wide_hz_[last];
    if (grid_[k]) last = k;
  }
  for (int k = 0; k < bands_; ++k) {
    int best = 0;
    for (int g = 0; g < bands_; ++g) {
      if (!grid_[g]) continue;
      if (std::fabs(centre_[g] - centre_[k]) < std::fabs(centre_[best] - centre_[k])) best = g;
    }
    grid_of_[k] = best;
    grid_below_[k] = -1;
    grid_above_[k] = -1;
    for (int g = k - 1; g >= 0 && grid_below_[k] < 0; --g) {
      if (grid_[g]) grid_below_[k] = g;
    }
    for (int g = k + 1; g < bands_ && grid_above_[k] < 0; ++g) {
      if (grid_[g]) grid_above_[k] = g;
    }
  }
  up1_bands_ = bands_;
  while (up1_bands_ > 0 && limit_up1_[up1_bands_ - 1] == 0.0f) --up1_bands_;
  up2_bands_ = bands_;
  while (up2_bands_ > 0 && limit_up2_[up2_bands_ - 1] == 0.0f) --up2_bands_;

}

// Move channel k's poles to `open` (0 settled .. 1 just after an onset) and
// put every state where the partial the channel is tracking would have it at
// the new width, so that partial does not notice the move. In units of the
// cutoff the partial sits x from the centre; stage i then has the response
// 1 / (cutoff · sigma_i · (1 + j·t_i)) with t_i = (x - nu_i) / sigma_i.
inline void OctaveBank::set_width(int k, float open, bool rescale) {
  const float cr = carrier_re_[k], ci = carrier_im_[k];
  float product = 1.0f;
  for (int s = 0; s < kStages; ++s) {
    const float pr = narrow_re_[s][k] + open * (wide_re_[s][k] - narrow_re_[s][k]);
    const float pi = narrow_im_[s][k] + open * (wide_im_[s][k] - narrow_im_[s][k]);
    pole_re_[s][k] = pr;
    pole_im_[s][k] = pi;
    // 1 - pole × conj(carrier): the stage's inverse gain at the centre.
    const float dr = 1.0f - (pr * cr + pi * ci);
    const float di = -(pi * cr - pr * ci);
    product *= dr * dr + di * di;
  }
  // The input gain that keeps a centred partial at unity.
  gain_[k] = 2.0f * std::sqrt(product);
  const float cutoff = narrow_hz_[k] + open * (wide_hz_[k] - narrow_hz_[k]);
  if (rescale) {
    const float q = cutoff / (narrow_hz_[k] + open_[k] * (wide_hz_[k] - narrow_hz_[k]));
    float x = 0.0f;
    const float ar = avg_re_[k], ai = avg_im_[k];
    if (ar > 0.0f) x = ai > 3.0f * ar ? 3.0f : (ai < -3.0f * ar ? -3.0f : ai / ar);
    const float x_new = x / q;
    // f = q^(2 - s) × product over the stages so far of (1 + j·t) / (1 + j·t').
    float fr = q * q, fi = 0.0f;
    float first = 1.0f, second_re = 1.0f, second_im = 0.0f;
    for (int s = 0; s < kStages; ++s) {
      const float nu = static_cast<float>(kNu[s]), inv_sigma = 1.0f / static_cast<float>(kSigma[s]);
      const float t_old = (x - nu) * inv_sigma, t_new = (x_new - nu) * inv_sigma;
      // (1 + j·t_old) / (1 + j·t_new)
      const float inv = 1.0f / (1.0f + t_new * t_new);
      const float qr = (1.0f + t_old * t_new) * inv;
      const float qi = (t_old - t_new) * inv;
      const float tr = fr * qr - fi * qi;
      fi = fr * qi + fi * qr;
      fr = tr;
      const float yr = yr_[s][k], yi = yi_[s][k];
      yr_[s][k] = yr * fr - yi * fi;
      yi_[s][k] = yr * fi + yi * fr;
      if (s == 0) first = fr * fr + fi * fi;
      if (s == kStages - 2) {
        second_re = fr;
        second_im = fi;
      }
      fr /= q;
      fi /= q;
    }
    fr *= q;
    fi *= q;
    // What is derived from the states moves with them.
    const float last = fr * fr + fi * fi;
    jump_ref_[k] *= first;
    for (int i = 0; i < kJumpDelay; ++i) jump_ring_[i][k] *= first;
    power_[k] *= last;
    slow_[k] *= std::sqrt(last);
    // The equaliser's average is stage 2 × conj(stage 3).
    const float gr = second_re * fr + second_im * fi;
    const float gi = second_im * fr - second_re * fi;
    avg_re_[k] = ar * gr - ai * gi;
    avg_im_[k] = ar * gi + ai * gr;
  }
  open_[k] = open;
  // First-stage power in the units of the last stage's (a centred partial).
  first_scale_[k] = 1.0f / (cutoff * cutoff * cutoff * cutoff * first_unit_);
  follow_[k] = tick_seconds_ * 2.0f * static_cast<float>(kPiD) * cutoff;
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
      if (!(check > 0.98f && check < 1.02f)) n = exact_norm(m2);
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
        if (!(check > 0.98f && check < 1.02f)) n = exact_norm(m2);
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
  float settled[kMaxBands];
  bool moved[kMaxBands];
  float offset[kMaxBands];
  jump_index_ = (jump_index_ + 1) % kJumpDelay;
  for (int k = 0; k < bands_; ++k) {
    // An onset opens the channel: its first stage jumps above its recent
    // level, by more than the settled neighbours could account for.
    const float first = yr_[0][k] * yr_[0][k] + yi_[0][k] * yi_[0][k];
    if (first > kJump * jump_ref_[k] + 1.0e-30f) {
      // It has to be more than the notes held in the other channels can
      // explain: more than the open channel would collect from any of them,
      // and more than all of them together can put into this first stage
      // when their beats line up.
      float around = 0.0f, leak = 0.0f;
      const float inv_wide = 1.0f / wide_hz_[k];
      const float half = static_cast<float>(kSigma[0]) * narrow_hz_[k];
      const float offset = static_cast<float>(kNu[0]) * narrow_hz_[k];
      for (int j = 0; j < bands_; ++j) {
        if (j == k) continue;
        const float distance = centre_[j] - centre_[k];
        const float x = distance * inv_wide;
        const float x2 = x * x;
        const float held = power_[j] / (1.0f + x2 * x2 * x2);
        if (held > around) around = held;
        const float away = distance - offset;
        // (the first stage alone: 1 at the centre, 2 on its own pole)
        leak += std::sqrt(power_[j] * 4.0f * half * half / (half * half + away * away));
      }
      if (leak * leak > around) around = leak * leak;
      if (first * first_scale_[k] > around) {
        age_[k] = 0.0f;
        age_[grid_of_[k]] = 0.0f;
      }
    }
    const float delayed = jump_ring_[jump_index_][k];
    jump_ring_[jump_index_][k] = first;
    jump_ref_[k] *= jump_fall_;
    if (delayed > jump_ref_[k]) jump_ref_[k] = delayed;
    age_[k] += tick_seconds_;
    settled[k] = 1.0f;
    moved[k] = false;
    if (grid_[k]) {
      // Open through the hold, then close exponentially.
      float open = 0.0f;
      const float cycles = age_[k] * narrow_hz_[k];
      if (cycles < kHold) {
        open = 1.0f;
      } else if (cycles < kHold + 12.0f * kClose) {
        open = std::exp(-(cycles - kHold) / kClose);
      }
      if (open != open_[k]) {
        set_width(k, open, true);
        moved[k] = true;
      }
    } else {
      const float t = (age_[k] * narrow_hz_[k] - kSettle[0]) / (kSettle[1] - kSettle[0]);
      settled[k] = t <= 0.0f ? 0.0f : (t >= 1.0f ? 1.0f : t * t * (3.0f - 2.0f * t));
    }

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
      jump_ref_[k] = 0.0f;
    } else {
      const float power_step = kPowerFollow * follow_[k], rotor_step = kRotorFollow * follow_[k];
      const float power_coeff = power_step / (1.0f + power_step);
      const float rotor_coeff = rotor_step / (1.0f + rotor_step);
      power_[k] += power_coeff * (now - power_[k]);
      // stage 2 × conj(stage 3) points along 1 + j·x, where x is how far the
      // partial sits from the centre in units of the cutoff.
      avg_re_[k] += rotor_coeff * (br * cr + bi * ci - avg_re_[k]);
      avg_im_[k] += rotor_coeff * (bi * cr - br * ci - avg_im_[k]);
    }

    // The equaliser: the phase of all three stages at x, and what they took
    // off the partial's level there.
    rot_re_[k] = rot_target_re_[k];
    rot_im_[k] = rot_target_im_[k];
    float er = 1.0f, ei = 0.0f, gain = 1.0f, x = 0.0f;
    const float ar = avg_re_[k], ai = avg_im_[k];
    if (ar * ar + ai * ai > 1.0e-36f) {
      x = ai < 0.0f ? -3.0f : 3.0f;
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
    offset[k] = x;
    rot_target_re_[k] = er;
    rot_target_im_[k] = ei;
    if (moved[k]) {
      // The states have just been moved to the new width: so is the rotor.
      rot_re_[k] = er;
      rot_im_[k] = ei;
    }
    rot_step_re_[k] = (er - rot_re_[k]) * inv_period_;
    rot_step_im_[k] = (ei - rot_im_[k]) * inv_period_;
    // This sample's equalised unit phasor, for the agreement below.
    const float zr = cr * rot_re_[k] - ci * rot_im_[k];
    const float zi = cr * rot_im_[k] + ci * rot_re_[k];
    const float inv = 1.0f / std::sqrt(zr * zr + zi * zi + 1.0e-30f);
    unit_re[k] = zr * inv;
    unit_im[k] = zi * inv;
    // A channel that is sitting out does not compete for weight either.
    sharp[k] = power_[k] * power_[k] * settled[k];
  }

  for (int k = 0; k < bands_; ++k) {
    // How far the channel stands out from the ones that hold the same
    // partial: the two beside it, and for an open grid channel the settled
    // ones out to the next grid channels.
    float total = sharp[k];
    if (k > 0) total += sharp[k - 1];
    if (k < bands_ - 1) total += sharp[k + 1];
    const int below = grid_below_[k], above = grid_above_[k];
    float share = 1.0f;
    // A settled channel between grid channels competes with an open one as
    // far as that one's passband reaches it, and the other way round.
    const float closed = 1.0f - open_[k];
    if (below >= 0 && below < k - 1 && open_[below] > 0.0f) {
      total += closed * reach(below, k) * sharp[below];
    }
    if (above >= 0 && above > k + 1 && open_[above] > 0.0f) {
      total += closed * reach(above, k) * sharp[above];
    }
    if (open_[k] > 0.0f) {
      for (int j = (below < 0 ? 0 : below + 1); j < k - 1; ++j) total += reach(k, j) * sharp[j];
      for (int j = k + 2; j < (above < 0 ? bands_ : above); ++j) total += reach(k, j) * sharp[j];
      // Open grid channels overlap, so the one next door on the partial's
      // side holds it too, and until both have settled they disagree about
      // its phase. The one it is nearer to carries it.
      const int other = offset[k] > 0.0f ? above : below;
      if (other >= 0 && open_[other] > 0.0f) {
        const float cutoff = narrow_hz_[other] + open_[other] * (wide_hz_[other] - narrow_hz_[other]);
        const float mine = offset[k] * (narrow_hz_[k] + open_[k] * (wide_hz_[k] - narrow_hz_[k]));
        const float theirs = offset[other] * cutoff;
        // ... as long as the neighbour's passband still takes the partial in.
        const float x = (centre_[k] + mine - centre_[other]) / (1.5f * cutoff);
        const float x2 = x * x;
        share = 1.0f - yield(mine, theirs) / (1.0f + x2 * x2 * x2);
      }
    }
    float target = total > 0.0f ? share * correction[k] * sharp[k] / total : 0.0f;
    // Attack: the allowed level rises at the set rate and falls at once.
    const float level = std::sqrt(power_[k]);
    if (attack_coeff_ > 0.0f && level > slow_[k]) {
      slow_[k] += attack_coeff_ * (level - slow_[k]);
      target *= slow_[k] / level;
    } else {
      slow_[k] = level;
    }
    weight_[k] = moved[k] ? target : weight_target_[k];
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
