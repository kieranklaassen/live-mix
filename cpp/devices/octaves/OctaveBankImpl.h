#pragma once

// Definitions for OctaveBank (included at the end of OctaveBank.h).

namespace livemix {
namespace octaves {

namespace layout {
// Channel density in channels per octave: sparse at the bottom, densest
// where chords are played (about a semitone and a quarter per channel, so
// the notes of a close chord fall in different channels), sparser above,
// where the partials of a chord interleave whatever the spacing, and
// sparser again at the top, where the channels cost the most (they run at
// the full rate) and a note's partials are far apart or faint.
constexpr int kEdges = 4;
constexpr double kEdgeHz[kEdges] = {80.0, 180.0, 1100.0, 2200.0};
constexpr double kPerOctave[kEdges + 1] = {5.0, 9.5, 12.0, 7.5, 5.5};

// Position on the channel scale (channels from 1 Hz) and its inverse.
inline double position(double hz) {
  const double x = std::log2(hz);
  double pos = 0.0, from = 0.0;
  for (int e = 0; e < kEdges; ++e) {
    const double edge = std::log2(kEdgeHz[e]);
    if (x <= edge) return pos + kPerOctave[e] * (x - from);
    pos += kPerOctave[e] * (edge - from);
    from = edge;
  }
  return pos + kPerOctave[kEdges] * (x - from);
}
inline double frequency(double pos) {
  double at = 0.0, from = 0.0;
  for (int e = 0; e < kEdges; ++e) {
    const double edge = std::log2(kEdgeHz[e]);
    const double next = at + kPerOctave[e] * (edge - from);
    if (pos <= next) return std::exp2(from + (pos - at) / kPerOctave[e]);
    at = next;
    from = edge;
  }
  return std::exp2(from + (pos - at) / kPerOctave[kEdges]);
}
}  // namespace layout

inline void OctaveBank::init(float rate, float low_hz, float high_hz, int count) {
  rate_ = rate;
  bands_ = count < 2 ? 2 : (count > kMaxBands ? kMaxBands : count);
  // A tick is a whole number of the slowest group's samples.
  tick_period_ = 4 * static_cast<int>(rate / (4.0f * kTickHz) + 0.5f);
  if (tick_period_ < 4) tick_period_ = 4;
  tick_counter_ = 0;
  call_ = 0;
  tick_seconds_ = static_cast<float>(tick_period_) / rate;
  for (int g = 0; g < kGroups; ++g) inv_steps_[g] = static_cast<float>(1 << g) / static_cast<float>(tick_period_);
  agree_coeff_ = 1.0f - std::exp(-4.0f * tick_seconds_ / kAgreeSeconds);
  slow_count_ = 0;
  parity_ = 0;
  beat_ticks_ = static_cast<int>(1.0f / (2.0f * kBeatSlowest * tick_seconds_));
  pure_coeff_ = 1.0f - std::exp(-tick_seconds_ / kPureSeconds);
  tick_peak_ = 0.0f;
  attack_fresh_ = false;
  peak_index_ = 0;
  for (float& v : peak_ring_) v = 0.0f;
  for (float& v : recent_ring_) v = 0.0f;
  recent_index_ = 0;
  strike_left_ = 0;
  strike_ticks_ = static_cast<int>(kStrikeSeconds / tick_seconds_);
  jump_index_ = 0;
  jump_fall_ = std::exp(-tick_seconds_ / kJumpFall);
  jump_hold_ticks_ = static_cast<int>(kJumpHold / tick_seconds_);
  attack_coeff_ = 0.0f;
  set_detune(0.0f);
  for (HalfbandDown<kDownHalf>& d : down_) d.init(kDownBeta);
  for (int b = 0; b < kBuses; ++b) {
    up_half_[b].init(kUpBeta[0]);
    up_quarter_[b].init(kUpBeta[1]);
    late_half_[b] = 0.0f;
    late_quarter_[b] = 0.0f;
    bus_on_[b] = false;
  }
  x_prev_ = 0.0f;
  half_prev_ = 0.0f;
  // What each group's way down and back up costs, in samples at `rate`:
  // to the channel (the decimators alone) and to the output (Halfband.h).
  const double to_output[kGroups] = {
      0.0, 2.0 * (kDownHalf + kUpHalf[0]) - 2.0,
      2.0 * (kDownHalf + kUpHalf[0]) - 2.0 + 4.0 * (kDownHalf + kUpHalf[1]) - 4.0};
  const double to_channel[kGroups] = {0.0, 2.0 * kDownHalf - 1.0,
                                      2.0 * kDownHalf - 1.0 + 2.0 * (2.0 * kDownHalf - 1.0)};

  if (high_hz > 0.23f * rate) high_hz = 0.23f * rate;
  // One channel per step of the scale, placed so that the dense channels
  // lie halfway between the notes of the tempered scale (A = 440 Hz): a note
  // played in tune is then shared by two channels, and each of the two has
  // the notes a semitone and a tone away well down its skirt. (Centred on
  // the notes, a channel would have the next semitone only one channel away.)
  const double hi = layout::position(high_hz);
  const double anchor = layout::position(440.0 * std::exp2(0.5 / 12.0));
  const double lo = anchor - std::floor(anchor - layout::position(low_hz) + 0.5);
  const double step = 1.0;
  if (bands_ > static_cast<int>(hi - lo) + 1) bands_ = static_cast<int>(hi - lo) + 1;
  const double up1_high = 0.21 * rate, up2_high = 0.105 * rate;
  for (int g = 0; g < kGroups; ++g) first_[g] = 0;
  for (int k = 0; k < bands_; ++k) {
    const double hz = layout::frequency(lo + step * k);
    const double spacing =
        0.5 * (layout::frequency(lo + step * (k + 1)) - layout::frequency(lo + step * (k - 1)));
    int group = 0;
    for (int g = 1; g < kGroups; ++g) {
      if (hz < kGroupBelow[g] * rate) group = g;
    }
    for (int g = 0; g < group; ++g) first_[g] = k + 1;
    const double own_rate = rate / (1 << group);
    const double w = 2.0 * kPiD * hz / own_rate;
    centre_[k] = static_cast<float>(hz);
    side_[k] = (k / kSideRun) & 1;
    carrier_re_[k] = static_cast<float>(std::cos(w));
    carrier_im_[k] = static_cast<float>(std::sin(w));
    // A centred partial leaves stage 1 at (cutoff × 2π / rate)² times its level.
    first_unit_[k] = static_cast<float>(std::pow(2.0 * kPiD / own_rate, 4.0));
    const double narrow = kNarrow * spacing;
    double wide = kWideErb * (24.7 + 0.108 * hz);
    if (wide < narrow) wide = narrow;
    narrow_hz_[k] = static_cast<float>(narrow);
    wide_hz_[k] = static_cast<float>(wide);
    for (int s = 0; s < kStages; ++s) {
      for (int which = 0; which < 2; ++which) {
        const double cutoff = 2.0 * kPiD * (which == 0 ? narrow : wide) / own_rate;
        const double r = std::exp(-kSigma[s] * cutoff);
        const double angle = w + kNu[s] * cutoff;
        (which == 0 ? narrow_re_ : wide_re_)[s][k] = static_cast<float>(r * std::cos(angle));
        (which == 0 ? narrow_im_ : wide_im_)[s][k] = static_cast<float>(r * std::sin(angle));
      }
      yr_[s][k] = 0.0f;
      yi_[s][k] = 0.0f;
    }
    const double limit[kVoices] = {
        fade_in(hz, kSub2LowHz, kSub2LowHz * 1.4), fade_in(hz, kSub1LowHz, kSub1LowHz * 1.4),
        1.0 - fade_in(hz, up1_high * 0.8, up1_high), 1.0 - fade_in(hz, up2_high * 0.8, up2_high)};
    for (int v = 0; v < kVoices; ++v) {
      const double angle = 2.0 * kPiD * kVoiceRatio[v] * hz * to_output[group] / rate;
      comp_re_[v][k] = static_cast<float>(limit[v] * std::cos(angle));
      comp_im_[v][k] = static_cast<float>(limit[v] * std::sin(angle));
      det_re_[v][k] = 1.0f;
      det_im_[v][k] = 0.0f;
      w_re_[v][k] = w_im_[v][k] = 0.0f;
      w_step_re_[v][k] = w_step_im_[v][k] = 0.0f;
      w_target_re_[v][k] = w_target_im_[v][k] = 0.0f;
    }
    for (int v = 0; v < 2; ++v) {
      const double angle = -2.0 * kPiD * kVoiceRatio[v] * hz * (to_output[group] - to_channel[group]) / rate;
      ahead_re_[v][k] = static_cast<float>(std::cos(angle));
      ahead_im_[v][k] = static_cast<float>(std::sin(angle));
    }
    delay_slope_[k] = static_cast<float>(2.0 * kPiD * kVoiceRatio[0] * to_output[group] / rate);
    const double skew = 2.0 * kPiD * hz * to_channel[group] / rate;
    unskew_re_[k] = static_cast<float>(std::cos(skew));
    unskew_im_[k] = static_cast<float>(std::sin(skew));

    open_[k] = 0.0f;
    age_[k] = 1.0f;
    jump_ref_[k] = 0.0f;
    jump_hold_[k] = 0;
    jump_fast_[k] = 0.0f;
    for (int i = 0; i < kJumpDelay; ++i) jump_ring_[i][k] = 0.0f;
    rot_re_[k] = root1_re_[k] = root2_re_[k] = 1.0f;
    rot_im_[k] = root1_im_[k] = root2_im_[k] = 0.0f;
    avg_re_[k] = avg_im_[k] = 0.0f;
    power_[k] = 0.0f;
    slow_[k] = 0.0f;
    weight_[k] = 0.0f;
    bare_[k] = 0.0f;
    lock_re_[k] = 1.0f;
    lock_im_[k] = 0.0f;
    paired_[k] = false;
    upper_leads_[k] = false;
    agree_[k] = 0.0f;
    beat_ext_[k] = 0.0f;
    beat_last_[k] = -1.0f;
    beat_dir_[k] = 1.0f;
    beat_since_[k] = 0;
    depth_[k] = 0.0f;
    pure_[k] = 1.0f;
    mute_depth_[k] = 1.0f - fade_in(std::log(hz), std::log(kMuteFullHz), std::log(kMuteNoneHz));
    live_[k] = false;
    leak_[k] = 0.0f;
    since_[k] = 0;
    sign1_[k] = sign2_[k] = 1.0f;
    half_im_[k] = 0.0f;
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
    // The channels its open passband reaches, below and above.
    span_[0][k] = 0;
    span_[1][k] = 0;
    while (k - span_[0][k] > 0 && centre_[k] - centre_[k - span_[0][k] - 1] < 1.5f * wide_hz_[k]) ++span_[0][k];
    while (k + span_[1][k] + 1 < bands_ && centre_[k + span_[1][k] + 1] - centre_[k] < 1.5f * wide_hz_[k]) ++span_[1][k];
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
  while (up1_bands_ > 0 && comp_re_[2][up1_bands_ - 1] == 0.0f && comp_im_[2][up1_bands_ - 1] == 0.0f) --up1_bands_;
  up2_bands_ = bands_;
  while (up2_bands_ > 0 && comp_re_[3][up2_bands_ - 1] == 0.0f && comp_im_[3][up2_bands_ - 1] == 0.0f) --up2_bands_;
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
    jump_fast_[k] *= first;
    for (int i = 0; i < kJumpDelay; ++i) jump_ring_[i][k] *= first;
    power_[k] *= last;
    beat_ext_[k] *= last;
    if (beat_last_[k] > 0.0f) beat_last_[k] *= last;
    slow_[k] *= std::sqrt(last);
    // The equaliser's average is stage 2 × conj(stage 3).
    const float gr = second_re * fr + second_im * fi;
    const float gi = second_im * fr - second_re * fi;
    avg_re_[k] = ar * gr - ai * gi;
    avg_im_[k] = ar * gi + ai * gr;
  }
  open_[k] = open;
  // First-stage power in the units of the last stage's (a centred partial).
  first_scale_[k] = 1.0f / (cutoff * cutoff * cutoff * cutoff * first_unit_[k]);
  // The averages follow at a multiple of the cutoff.
  const float follow = tick_seconds_ * 2.0f * static_cast<float>(kPiD) * cutoff;
  power_coeff_[k] = kPowerFollow * follow / (1.0f + kPowerFollow * follow);
  rotor_coeff_[k] = kRotorFollow * follow / (1.0f + kRotorFollow * follow);
}

// One sample of group g's channels: the filters, then the voices of the
// channels that are sounding. bus: sub2, sub1, up1 ×2, up2 ×2.
inline void OctaveBank::run_group(int g, float x, const Want& want, float* bus) {
  float sub2 = 0.0f, sub1 = 0.0f;
  float up1[2] = {0.0f, 0.0f};
  float up2[2] = {0.0f, 0.0f};
  const bool subs = want.sub1 || want.sub2;
  const bool ups = want.up1 || want.up2;
  const int end = g == 0 ? bands_ : first_[g - 1];
  for (int k = first_[g]; k < end; ++k) {
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
    const float was_re = yr_[2][k], was_im = yi_[2][k];
    pr = pole_re_[2][k];
    pi = pole_im_[2][k];
    const float cr = pr * was_re - pi * was_im + br;
    const float ci = pr * was_im + pi * was_re + bi;
    yr_[2][k] = cr;
    yi_[2][k] = ci;
    if (!live_[k]) continue;

    const float m2 = cr * cr + ci * ci + 1.0e-24f;
    const float inv = 1.0f / std::sqrt(m2);
    const int side = side_[k];
    if (ups) {
      // z² / |z| and z⁴ / |z|³, each against its complex weight.
      const float z2r = cr * cr - ci * ci, z2i = 2.0f * cr * ci;
      if (want.up1 && k < up1_bands_) {
        const float wr = w_re_[2][k], wi = w_im_[2][k];
        w_re_[2][k] = wr + w_step_re_[2][k];
        w_im_[2][k] = wi + w_step_im_[2][k];
        up1[side] += (z2r * wr - z2i * wi) * inv;
      }
      if (want.up2 && k < up2_bands_) {
        const float wr = w_re_[3][k], wi = w_im_[3][k];
        w_re_[3][k] = wr + w_step_re_[3][k];
        w_im_[3][k] = wi + w_step_im_[3][k];
        const float inv2 = inv * inv;
        const float c2 = z2r * inv2, s2 = z2i * inv2;
        up2[side ^ 1] += ((c2 * c2 - s2 * s2) * wr - 2.0f * c2 * s2 * wi) * (m2 * inv);
      }
    }
    if (subs) {
      // The half-angle phasor: the principal square root, times a sign that
      // flips whenever z passes half a turn (its imaginary part changes
      // sign on the far side: turning forwards from above, backwards from
      // below). Written without branches: which way a phase points is as
      // good as random from one channel to the next.
      const float a = m2 * inv;
      const float up_now = std::copysign(1.0f, ci), up_was = std::copysign(1.0f, was_im);
      const float turned = std::copysign(1.0f, was_re * ci - was_im * cr);
      const float crossed = 0.5f * (1.0f - up_now * up_was) * (1.0f + turned * up_was);
      const float sign = sign1_[k] * (1.0f - crossed);
      sign1_[k] = sign;
      const float hr = sign * std::sqrt(0.5f * a * std::fabs(a + cr));
      const float hi = sign * std::copysign(std::sqrt(0.5f * a * std::fabs(a - cr)), ci);
      if (want.sub1) {
        const float wr = w_re_[1][k], wi = w_im_[1][k];
        w_re_[1][k] = wr + w_step_re_[1][k];
        w_im_[1][k] = wi + w_step_im_[1][k];
        sub1 += hr * wr - hi * wi;
      }
      if (want.sub2) {
        // The same again on the half-angle phasor, which turns half as
        // fast: it has passed half a turn when its imaginary part changes
        // sign on the left.
        const float h_now = std::copysign(1.0f, hi), h_was = std::copysign(1.0f, half_im_[k]);
        const float left = 1.0f - std::copysign(1.0f, hr);
        const float sign_q = sign2_[k] * (1.0f - 0.5f * (1.0f - h_now * h_was) * left);
        sign2_[k] = sign_q;
        half_im_[k] = hi;
        const float qr = std::sqrt(0.5f * a * std::fabs(a + hr));
        const float qi = std::copysign(std::sqrt(0.5f * a * std::fabs(a - hr)), hi);
        const float wr = w_re_[0][k], wi = w_im_[0][k];
        w_re_[0][k] = wr + w_step_re_[0][k];
        w_im_[0][k] = wi + w_step_im_[0][k];
        sub2 += sign_q * (qr * wr - qi * wi);
      }
    }
  }
  bus[0] = sub2;
  bus[1] = sub1;
  bus[2] = up1[0];
  bus[3] = up1[1];
  bus[4] = up2[0];
  bus[5] = up2[1];
}

// The top group runs on every call, the middle one on every second with the
// halved input, the bottom one on every fourth; what the lower groups make
// is interpolated back up and joins the faster group's output.
inline void OctaveBank::process(float x, const Want& want, Frame* out) {
  // Only the buses of the voices in use are interpolated; one that goes out
  // of use is emptied, so it comes back clean.
  const bool on[kBuses] = {want.sub2, want.sub1, want.up1, want.up1, want.up2, want.up2};
  for (int b = 0; b < kBuses; ++b) {
    if (bus_on_[b] && !on[b]) {
      up_half_[b].reset();
      up_quarter_[b].reset();
      late_half_[b] = 0.0f;
      late_quarter_[b] = 0.0f;
    }
    bus_on_[b] = on[b];
  }
  const float size = std::fabs(x);
  if (size > tick_peak_) tick_peak_ = size;
  float bus[kBuses];
  run_group(0, x, want, bus);
  if (call_ & 1) {
    const float halved = down_[0].down(x_prev_, x);
    float half[kBuses];
    run_group(1, halved, want, half);
    if (call_ == 3) {
      const float quartered = down_[1].down(half_prev_, halved);
      float quarter[kBuses];
      run_group(2, quartered, want, quarter);
      for (int b = 0; b < kBuses; ++b) {
        if (!on[b]) continue;
        float now;
        up_quarter_[b].up(quarter[b], &now, &late_quarter_[b]);
        half[b] += now;
      }
    } else {
      for (int b = 0; b < kBuses; ++b) half[b] += late_quarter_[b];
      half_prev_ = halved;
    }
    for (int b = 0; b < kBuses; ++b) {
      if (!on[b]) continue;
      float now;
      up_half_[b].up(half[b], &now, &late_half_[b]);
      bus[b] += now;
    }
  } else {
    for (int b = 0; b < kBuses; ++b) bus[b] += late_half_[b];
    x_prev_ = x;
  }
  call_ = (call_ + 1) & 3;
  out->sub2 = bus[0];
  out->sub1 = bus[1];
  out->up1[0] = bus[2];
  out->up1[1] = bus[3];
  out->up2[0] = bus[4];
  out->up2[1] = bus[5];

  if (++tick_counter_ >= tick_period_) {
    tick_counter_ = 0;
    tick();
  }
}

// What the loudest partial in the input leaves in every channel that is not
// its own (power), from the channels' present poles: its tail in a channel
// several octaves away is small but not nothing, and such a channel would
// otherwise play that partial's octaves again, faintly, at full cost.
inline void OctaveBank::leak_floor() {
  int top = 0;
  for (int k = 1; k < bands_; ++k) {
    if (power_[k] > power_[top]) top = k;
  }
  const float peak = power_[top];
  float hz = centre_[top];
  if (avg_re_[top] > 0.0f) {
    float x = avg_im_[top] / avg_re_[top];
    x = x > 3.0f ? 3.0f : (x < -3.0f ? -3.0f : x);
    hz += x * (narrow_hz_[top] + open_[top] * (wide_hz_[top] - narrow_hz_[top]));
  }
  float cs[kGroups], sn[kGroups];
  for (int g = 0; g < kGroups; ++g) {
    const float w = 2.0f * static_cast<float>(kPiD) * hz * static_cast<float>(1 << g) / rate_;
    cs[g] = std::cos(w);
    sn[g] = std::sin(w);
  }
  for (int k = 0; k < bands_; ++k) {
    const float cutoff = narrow_hz_[k] + open_[k] * (wide_hz_[k] - narrow_hz_[k]);
    leak_[k] = 0.0f;
    if (peak < kQuiet || std::fabs(hz - centre_[k]) < 3.0f * cutoff) continue;
    const int g = group_of(k);
    // The three stages at the partial's frequency and at its mirror image
    // (the input is real).
    float there = 1.0f, mirror = 1.0f;
    for (int s = 0; s < kStages; ++s) {
      const float pr = pole_re_[s][k], pi = pole_im_[s][k];
      const float ar = 1.0f - (pr * cs[g] + pi * sn[g]), ai = pi * cs[g] - pr * sn[g];
      const float br = 1.0f - (pr * cs[g] - pi * sn[g]), bi = pi * cs[g] + pr * sn[g];
      there *= ar * ar + ai * ai;
      mirror *= br * br + bi * bi;
    }
    leak_[k] = peak * 0.25f * gain_[k] * gain_[k] * (1.0f / there + 1.0f / mirror);
  }
}

// Channel k's half-angle and quarter-angle phasors as run_group has them now.
inline void OctaveBank::sub_phasors(int k, float* half, float* quarter) const {
  principal_root(yr_[2][k], yi_[2][k], &half[0], &half[1]);
  half[0] *= sign1_[k];
  half[1] *= sign1_[k];
  principal_root(half[0], half[1], &quarter[0], &quarter[1]);
  quarter[0] *= sign2_[k];
  quarter[1] *= sign2_[k];
}

// Where channel k's two sub voices point (sub1 then sub2, as complex
// numbers), on the clock of the output: the ramped weight, less the part of
// the group's delay that the voice has not been through yet.
inline void OctaveBank::sub_outputs(int k, float* out) const {
  float half[2], quarter[2];
  sub_phasors(k, half, quarter);
  const float hr = half[0] * w_target_re_[1][k] - half[1] * w_target_im_[1][k];
  const float hi = half[0] * w_target_im_[1][k] + half[1] * w_target_re_[1][k];
  out[0] = hr * ahead_re_[1][k] - hi * ahead_im_[1][k];
  out[1] = hr * ahead_im_[1][k] + hi * ahead_re_[1][k];
  const float qr = quarter[0] * w_target_re_[0][k] - quarter[1] * w_target_im_[0][k];
  const float qi = quarter[0] * w_target_im_[0][k] + quarter[1] * w_target_re_[0][k];
  out[2] = qr * ahead_re_[0][k] - qi * ahead_im_[0][k];
  out[3] = qr * ahead_im_[0][k] + qi * ahead_re_[0][k];
}

inline void OctaveBank::tick() {
  static_assert(kStages == 3, "the equaliser below is written for three stages");
  float unit_re[kMaxBands], unit_im[kMaxBands], sharp[kMaxBands], correction[kMaxBands];
  float settled[kMaxBands];
  bool moved[kMaxBands];
  float offset[kMaxBands];
  // Where a channel's sub voices pointed before its width was moved.
  float before[kMaxBands][4];
  bool due[kMaxBands];
  float mute[kMaxBands];
  float late[kMaxBands];
  float early[kMaxBands];
  float yield_[2][kMaxBands];
  float freq[kMaxBands], width[kMaxBands];
  parity_ ^= 1;
  jump_index_ = (jump_index_ + 1) % kJumpDelay;
  // The agreement between neighbours and the signs that follow from it are
  // slow matters: every fourth tick.
  slow_count_ = (slow_count_ + 1) & 3;
  const bool slow_tick = slow_count_ == 0;
  if (slow_tick) leak_floor();
  if (attack_fresh_) {
    // Attack has just been turned up: what is sounding stays as it is.
    for (int k = 0; k < bands_; ++k) slow_[k] = std::sqrt(power_[k]);
    attack_fresh_ = false;
  }
  // Release. A narrow channel rings on after its note has stopped, for a
  // third of a second at the bottom of the range; the input itself says
  // when to stop. The voices may hold no more than a few times the input's
  // own recent peak (recent: half a period of the lowest channel, so a low
  // note's zero crossings do not count as silence).
  peak_ring_[peak_index_] = tick_peak_;
  tick_peak_ = 0.0f;
  float recent = 0.0f, held = 0.0f;
  for (int i = 0; i < kPeakTicks; ++i) recent = recent > peak_ring_[i] ? recent : peak_ring_[i];
  // (the two slots hold the peaks of the kPeakTicks that ended kPeakTicks
  // and twice kPeakTicks ago)
  const float before_a = recent_ring_[recent_index_];
  const float before_b = recent_ring_[(recent_index_ + kPeakTicks) % (2 * kPeakTicks)];
  if (recent > kStrike * (before_a > before_b ? before_a : before_b)) {
    strike_left_ = strike_ticks_;
  } else if (strike_left_ > 0) {
    --strike_left_;
  }
  const bool strike = strike_left_ > 0;
  recent_ring_[recent_index_] = recent;
  recent_index_ = (recent_index_ + 1) % (2 * kPeakTicks);
  peak_index_ = (peak_index_ + 1) % kPeakTicks;
  // (what the voices hold: each channel's power at the weight it was last given)
  for (int k = 0; k < bands_; ++k) held += power_[k] * bare_[k] * bare_[k];
  const float allowed = kReleaseMargin * recent * recent;
  const float release = allowed >= held ? 1.0f : std::sqrt(allowed / held);
  float floor2 = kFloorShare * kFloorShare * held;
  if (floor2 < kFloor * kFloor) floor2 = kFloor * kFloor;
  for (int k = 0; k < bands_; ++k) {
    const float first = yr_[0][k] * yr_[0][k] + yi_[0][k] * yi_[0][k];
    if (first < kQuiet && power_[k] < kQuiet && jump_ref_[k] < kQuiet && age_[k] > 1.0f && !live_[k]) {
      // Nothing in the channel and nothing recent: only the onset
      // detector's memory moves on.
      const float last = yr_[2][k] * yr_[2][k] + yi_[2][k] * yi_[2][k];
      if (last < 1.0e-28f && power_[k] < 1.0e-28f && first < 1.0e-28f) {
        for (int s = 0; s < kStages; ++s) {
          yr_[s][k] = 0.0f;
          yi_[s][k] = 0.0f;
        }
        avg_re_[k] = 0.0f;
        avg_im_[k] = 0.0f;
        power_[k] = 0.0f;
        jump_ref_[k] = 0.0f;
        jump_fast_[k] = 0.0f;
      } else {
        power_[k] += power_coeff_[k] * (last - power_[k]);
      }
      const float delayed = jump_ring_[jump_index_][k];
      jump_ring_[jump_index_][k] = first;
      if (delayed > kJumpNear * jump_ref_[k]) jump_hold_[k] = jump_hold_ticks_;
      if (delayed > jump_ref_[k]) {
        jump_ref_[k] = delayed;
      } else if (jump_hold_[k] > 0) {
        --jump_hold_[k];
      } else {
        jump_ref_[k] *= jump_fall_;
      }
      jump_fast_[k] *= jump_fall_;
      if (delayed > jump_fast_[k]) jump_fast_[k] = delayed;
      slow_[k] = 0.0f;
      settled[k] = 1.0f;
      moved[k] = false;
      correction[k] = 1.0f;
      offset[k] = 0.0f;
      unit_re[k] = 0.0f;
      unit_im[k] = 0.0f;
      sharp[k] = 0.0f;
      early[k] = 0.0f;
      bare_[k] = 0.0f;
      mute[k] = 1.0f;
      late[k] = 1.0f;
      freq[k] = centre_[k];
      width[k] = narrow_hz_[k];
      due[k] = false;
      continue;
    }
    // An onset opens the channel: its first stage jumps above its recent
    // level, by more than the settled neighbours could account for.
    if (first > kJump * (strike ? jump_fast_[k] : jump_ref_[k]) + 1.0e-30f) {
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
      if (first * first_scale_[k] > (strike ? 1.0f : kExplained) * around) {
        const int g = grid_of_[k];
        age_[k] = 0.0f;
        age_[g] = 0.0f;
        // The rise of a new note is not half a beat.
        beat_last_[k] = -1.0f;
        beat_last_[g] = -1.0f;
        if (attack_coeff_ > 0.0f) {
          // Attack: what the two channels hold now (the last stage has not
          // heard the new note yet) stays; what the note adds fades in.
          const float mine = std::sqrt(power_[k]), theirs = std::sqrt(power_[g]);
          if (slow_[k] > mine) slow_[k] = mine;
          if (slow_[g] > theirs) slow_[g] = theirs;
        }
      }
    }
    const float delayed = jump_ring_[jump_index_][k];
    jump_ring_[jump_index_][k] = first;
    if (delayed > kJumpNear * jump_ref_[k]) jump_hold_[k] = jump_hold_ticks_;
    if (delayed > jump_ref_[k]) {
      jump_ref_[k] = delayed;
    } else if (jump_hold_[k] > 0) {
      --jump_hold_[k];
    } else {
      jump_ref_[k] *= jump_fall_;
    }
    jump_fast_[k] *= jump_fall_;
    if (delayed > jump_fast_[k]) jump_fast_[k] = delayed;
    age_[k] += tick_seconds_;
    settled[k] = 1.0f;
    moved[k] = false;
    {
      // Wide at the onset, and closing from the first moment.
      float open = 0.0f;
      const float cycles = age_[k] * narrow_hz_[k];
      if (cycles < kClosed * kClose) open = std::exp(-cycles / kClose);
      // (in steps of kCloseStep: the move is exact at any size)
      if (open != open_[k] && (open == 0.0f || open > open_[k] || open < kCloseStep * open_[k])) {
        if (live_[k]) {
          float half[2], quarter[2];
          sub_phasors(k, half, quarter);
          before[k][0] = half[0] * w_target_re_[1][k] - half[1] * w_target_im_[1][k];
          before[k][1] = half[0] * w_target_im_[1][k] + half[1] * w_target_re_[1][k];
          before[k][2] = quarter[0] * w_target_re_[0][k] - quarter[1] * w_target_im_[0][k];
          before[k][3] = quarter[0] * w_target_im_[0][k] + quarter[1] * w_target_re_[0][k];
        }
        set_width(k, open, true);
        moved[k] = true;
      }
      // How far the channel knows what it holds (0..1): see the claims below.
      const float t = (age_[k] * wide_hz_[k] - kSettle[0]) / (kSettle[1] - kSettle[0]);
      late[k] = t <= 0.0f ? 0.0f : (t >= 1.0f ? 1.0f : t * t * (3.0f - 2.0f * t));
      if (!grid_[k]) settled[k] = late[k];
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
      jump_fast_[k] = 0.0f;
    } else {
      const float rotor_coeff = rotor_coeff_[k];
      power_[k] += power_coeff_[k] * (now - power_[k]);
      // stage 2 × conj(stage 3) points along 1 + j·x, where x is how far the
      // partial sits from the centre in units of the cutoff.
      avg_re_[k] += rotor_coeff * (br * cr + bi * ci - avg_re_[k]);
      avg_im_[k] += rotor_coeff * (bi * cr - br * ci - avg_im_[k]);
    }

    // The beat of the envelope: its depth at each turning point, from the
    // peak and the trough on either side.
    {
      float found = -1.0f;
      const float ext = beat_ext_[k], last = beat_last_[k];
      if (beat_since_[k] < 30000) ++beat_since_[k];
      if (beat_dir_[k] > 0.0f) {
        if (now >= ext) {
          beat_ext_[k] = now;
        } else if (now < kBeatTurn * ext) {
          found = last >= 0.0f && beat_since_[k] <= beat_ticks_ ? (ext - last) / (ext + last + 1.0e-30f) : 0.0f;
          beat_last_[k] = ext;
          beat_ext_[k] = now;
          beat_dir_[k] = -1.0f;
          beat_since_[k] = 0;
        }
      } else {
        if (now <= ext) {
          beat_ext_[k] = now;
        } else if (now * kBeatTurn > ext) {
          found = last >= 0.0f && beat_since_[k] <= beat_ticks_ ? (last - ext) / (last + ext + 1.0e-30f) : 0.0f;
          beat_last_[k] = ext;
          beat_ext_[k] = now;
          beat_dir_[k] = 1.0f;
          beat_since_[k] = 0;
        }
      }
      if (found >= 0.0f) {
        depth_[k] = found;
      } else if (beat_since_[k] > beat_ticks_) {
        depth_[k] *= 0.97f;
      }
      float clean = 1.0f;
      if (depth_[k] > kBeatDepth) {
        clean = kBeatDepth / depth_[k];
        clean *= clean;
      }
      pure_[k] += pure_coeff_ * (clean - pure_[k]);
    }

    // The equaliser: the phase of all three stages at x, and what they took
    // off the partial's level there.
    float x = 0.0f, own = 1.0f;
    const float ar = avg_re_[k], ai = avg_im_[k];
    const bool tracking = ar * ar + ai * ai > 1.0e-36f;
    if (tracking) {
      x = ai < 0.0f ? -3.0f : 3.0f;
      if (ar > 0.0f && ai > -3.0f * ar && ai < 3.0f * ar) x = ai / ar;
      // A channel whose strongest partial lies three cutoffs outside it
      // holds nothing of its own (that partial has a channel of its own, two
      // or more away) and is left out.
      const float mag = x < 0.0f ? -x : x;
      if (mag > 2.5f) own = (3.0f - mag) * 2.0f;
      // Far from the loudest partial the estimate above no longer says how
      // far: there the test is whether the channel holds clearly more than
      // that partial leaves in it.
      if (power_[k] < 4.0f * leak_[k]) own *= pos(power_[k] / leak_[k] - 2.0f) * 0.5f;
    }
    offset[k] = x;
    width[k] = narrow_hz_[k] + open_[k] * (wide_hz_[k] - narrow_hz_[k]);
    freq[k] = centre_[k] + x * width[k];
    // A channel's weights are worked out on every other tick (odd and even
    // channels in turn); on every tick just after an onset, and at once
    // when the channel has moved or come on.
    if (since_[k] < 2) ++since_[k];
    due[k] = moved[k] || ((k ^ parity_) & 1) == 0 || !live_[k] || age_[k] < kFresh;
    if (due[k] && own > 0.0f) {
      float er = 1.0f, ei = 0.0f, gain = 1.0f;
      if (tracking) {
        const float t0 = 2.0f * (x - 0.8660254f), t1 = 2.0f * (x + 0.8660254f);
        const float pr = 1.0f - t0 * t1, pi = t0 + t1;
        const float nr = pr - pi * x, ni = pi + pr * x;
        const float size = std::sqrt(nr * nr + ni * ni);
        const float inv_size = 1.0f / size;
        er = nr * inv_size;
        ei = ni * inv_size;
        gain = size * 0.25f;
        if (gain > kMaxCorrection) gain = kMaxCorrection;
      }
      correction[k] = gain * own;
      rot_re_[k] = er;
      rot_im_[k] = ei;
    }
    if (slow_tick) {
      // This sample's equalised unit phasor, at the time the top group is
      // at, for the agreement below.
      const float zr = cr * rot_re_[k] - ci * rot_im_[k];
      const float zi = cr * rot_im_[k] + ci * rot_re_[k];
      const float inv = 1.0f / std::sqrt(zr * zr + zi * zi + 1.0e-30f);
      unit_re[k] = (zr * unskew_re_[k] - zi * unskew_im_[k]) * inv;
      unit_im[k] = (zr * unskew_im_[k] + zi * unskew_re_[k]) * inv;
    }
    if (attack_coeff_ > 0.0f) {
      // Attack: the level a channel's voices are allowed rises at the set
      // rate and is taken down only by a new note (above). It does not
      // follow the level down: two partials beating in one channel would
      // be held to the troughs of their beat.
      const float level = std::sqrt(power_[k]);
      if (settled[k] < 1.0f) {
        // Sitting out behind its grid channel, which carries the note for
        // now: it will take over at the share of its level the grid channel
        // has been allowed so far.
        const int g = grid_of_[k];
        const float theirs = std::sqrt(power_[g]);
        slow_[k] = theirs > slow_[g] ? level * slow_[g] / theirs : level;
      } else if (level > slow_[k]) {
        slow_[k] += attack_coeff_ * (level - slow_[k]);
      }
    }
    // A channel that is sitting out does not compete for weight either.
    // An open channel holds every note near it and is meant to: it is the
    // settled ones that are turned down for beating.
    mute[k] = 1.0f - (1.0f - pure_[k]) * (1.0f - open_[k]) * mute_depth_[k];
    // What counts in the end is what the channel will hold of its partial
    // once it has closed: an open channel holds every partial near it at
    // full level, and the ones that will keep it take it over while all of
    // them are still open and agree about it.
    float keep = 1.0f;
    if (open_[k] > 0.0f) {
      const float xn = x * width[k] / narrow_hz_[k];
      const float x3 = x * x * x, xn3 = xn * xn * xn;
      keep = (1.0f + x3 * x3) / (1.0f + xn3 * xn3);
    }
    // Until then the open grid channel carries what it holds, as it is.
    early[k] = power_[k] * power_[k] * own * mute[k] * mute[k];
    sharp[k] = early[k] * keep * keep;
  }

  // Grid channels that have just opened overlap: two of them hold the same
  // new partial, and for the first cycle of their cutoff they disagree about
  // its phase, so one of the two carries it. Which: the one with more of it
  // (it is the nearer; kLead keeps the choice from going back and forth).
  // Once both know where their partial is, they yield only as far as it is
  // the same one.
  for (int k = 0; k < bands_; ++k) {
    yield_[0][k] = 0.0f;
    yield_[1][k] = 0.0f;
  }
  for (int k = 0; k < bands_; ++k) {
    const int up = grid_above_[k];
    if (!grid_[k] || up < 0) continue;
    if (!(late[k] < 1.0f && late[up] < 1.0f && open_[k] > 0.0f && open_[up] > 0.0f)) {
      paired_[k] = false;
      continue;
    }
    if (!paired_[k]) {
      paired_[k] = true;
      upper_leads_[k] = power_[up] > power_[k];
    } else if (upper_leads_[k]) {
      if (power_[k] > kLead * power_[up]) upper_leads_[k] = false;
    } else if (power_[up] > kLead * power_[k]) {
      upper_leads_[k] = true;
    }
    const float younger = age_[k] * wide_hz_[k] < age_[up] * wide_hz_[up] ? age_[k] * wide_hz_[k] : age_[up] * wide_hz_[up];
    const float t = (younger - kSure[0]) / (kSure[1] - kSure[0]);
    const float sure = t <= 0.0f ? 0.0f : (t >= 1.0f ? 1.0f : t * t * (3.0f - 2.0f * t));
    const float d = (freq[k] - freq[up]) / (kSame * 0.5f * (width[k] + width[up]));
    const float d2 = d * d;
    const float gives = 1.0f - sure * (1.0f - 1.0f / (1.0f + d2 * d2));
    if (upper_leads_[k]) {
      yield_[1][k] = gives;
    } else {
      yield_[0][up] = gives;
    }
  }
  // What each channel claims of its partial: what it will keep, as far as
  // the onset is behind it; a grid channel, before that, all it holds.
  for (int k = 0; k < bands_; ++k) {
    if (late[k] >= 1.0f) continue;
    const float first = grid_[k] ? early[k] * (1.0f - yield_[0][k]) * (1.0f - yield_[1][k]) : 0.0f;
    sharp[k] = late[k] * sharp[k] + (1.0f - late[k]) * first;
  }

  for (int k = 0; k < bands_; ++k) {
    // How far the channel stands out from the ones that claim the same
    // partial: the two beside it, for an open channel every one its
    // passband reaches, and for a settled one the open grid channels on
    // either side.
    if (!due[k] || (sharp[k] == 0.0f && !live_[k])) continue;
    float total = sharp[k];
    const bool wide = open_[k] > 0.0f;
    const int from = k - (wide && span_[0][k] > 1 ? span_[0][k] : 1);
    const int to = k + (wide && span_[1][k] > 1 ? span_[1][k] : 1);
    for (int j = from; j <= to; ++j) {
      if (j < 0 || j >= bands_ || j == k || sharp[j] == 0.0f) continue;
      const float d = (freq[k] - freq[j]) / (kSame * 0.5f * (width[k] + width[j]));
      const float d2 = d * d;
      total += sharp[j] / (1.0f + d2 * d2);
    }
    if (open_[k] == 0.0f) {
      const int below = grid_below_[k], above = grid_above_[k];
      if (below >= 0 && below < k - 1 && open_[below] > 0.0f) total += reach(below, k) * sharp[below];
      if (above >= 0 && above > k + 1 && open_[above] > 0.0f) total += reach(above, k) * sharp[above];
    }
    float target = total > 0.0f ? correction[k] * sharp[k] / total : 0.0f;
    if (attack_coeff_ > 0.0f) {
      const float level2 = slow_[k] * slow_[k];
      if (level2 < power_[k]) target *= std::sqrt(level2 / power_[k]);
    }
    target *= mute[k];
    bare_[k] = target;
    target *= release;
    // Too quiet to hear: the channel's voices are switched off (after one
    // ramp to zero) and run_group skips them.
    if (target * target * power_[k] < floor2) target = 0.0f;
    weight_[k] = target;
    const bool was_live = live_[k];
    // The ramp lasts until the channel is due again.
    const bool next_tick = ((k ^ parity_) & 1) != 0 || age_[k] + tick_seconds_ < kFresh;
    const float steps = inv_steps_[group_of(k)] * (next_tick ? 1.0f : 0.5f);
    const float elapsed = static_cast<float>(since_[k]);
    since_[k] = 0;
    if (target == 0.0f) {
      if (!was_live) continue;
      bool any = false;
      for (int v = 0; v < kVoices; ++v) {
        const float wr = w_target_re_[v][k], wi = w_target_im_[v][k];
        if (wr != 0.0f || wi != 0.0f) any = true;
        w_re_[v][k] = wr;
        w_im_[v][k] = wi;
        w_step_re_[v][k] = -wr * steps;
        w_step_im_[v][k] = -wi * steps;
        w_target_re_[v][k] = 0.0f;
        w_target_im_[v][k] = 0.0f;
      }
      live_[k] = any;
      continue;
    }
    live_[k] = true;
    if (!was_live) {
      // Coming on: its detune phase is that of the stronger sounding
      // neighbour, which may hold the same partial.
      int from = -1;
      if (k > 0 && live_[k - 1]) from = k - 1;
      if (k < bands_ - 1 && live_[k + 1] && (from < 0 || power_[k + 1] > power_[k - 1])) from = k + 1;
      for (int v = 0; v < kVoices; ++v) {
        det_re_[v][k] = from < 0 ? 1.0f : det_re_[v][from];
        det_im_[v][k] = from < 0 ? 0.0f : det_im_[v][from];
      }
    }
    // The voices' phases: the equaliser's rotor squared, to the fourth, and
    // its square roots (the ones nearest the last tick's).
    // Two neighbours that hold one partial have to add, and the equaliser
    // alone does not make them when the partial moves (a bend, vibrato):
    // each knows where it is a little late, and differently late. What is
    // left between their equalised phases is measured and taken out, each
    // turning towards the other by the other's share of the two voices.
    float lr = 1.0f, li = 0.0f;
    for (int j = k - 1; j <= k + 1; j += 2) {
      if (j < 0 || j >= bands_ || !was_live || !live_[j] || bare_[j] == 0.0f) continue;
      const float d = (freq[k] - freq[j]) / (kSame * 0.5f * (width[k] + width[j]));
      const float d2 = d * d;
      if (d2 > 9.0f) continue;
      const float theirs = bare_[j] * bare_[j] * power_[j], mine = bare_[k] * bare_[k] * power_[k];
      const float f = theirs / (theirs + mine + 1.0e-30f) * pure_[k] * pure_[j] / (1.0f + d2 * d2);
      // The neighbour's equalised phase against this channel's (both at the
      // time the top group is at), and that far towards it.
      float ar, ai, br, bi;
      equalised(k, &ar, &ai);
      equalised(j, &br, &bi);
      const float pr2 = br * ar + bi * ai, pi2 = bi * ar - br * ai;
      const float size = std::sqrt(pr2 * pr2 + pi2 * pi2) + 1.0e-30f;
      const float cr2 = size + f * (pr2 - size), ci2 = f * pi2;
      const float t = lr * cr2 - li * ci2;
      li = lr * ci2 + li * cr2;
      lr = t;
    }
    const float turn_inv = 1.0f / std::sqrt(lr * lr + li * li + 1.0e-30f);
    lock_re_[k] += kLockFollow * (lr * turn_inv - lock_re_[k]);
    lock_im_[k] += kLockFollow * (li * turn_inv - lock_im_[k]);
    const float lock_inv = 1.0f / std::sqrt(lock_re_[k] * lock_re_[k] + lock_im_[k] * lock_im_[k] + 1.0e-20f);
    const float er = (rot_re_[k] * lock_re_[k] - rot_im_[k] * lock_im_[k]) * lock_inv;
    const float ei = (rot_re_[k] * lock_im_[k] + rot_im_[k] * lock_re_[k]) * lock_inv;
    float pr[kVoices], pi[kVoices];
    // (the lock is for the upper voices: it doubles and quadruples there,
    // and halves for the lower ones, whose signs are settled below)
    unit_root(rot_re_[k], rot_im_[k], &pr[1], &pi[1]);
    if (pr[1] * root1_re_[k] + pi[1] * root1_im_[k] < 0.0f) {
      pr[1] = -pr[1];
      pi[1] = -pi[1];
    }
    root1_re_[k] = pr[1];
    root1_im_[k] = pi[1];
    unit_root(pr[1], pi[1], &pr[0], &pi[0]);
    if (pr[0] * root2_re_[k] + pi[0] * root2_im_[k] < 0.0f) {
      pr[0] = -pr[0];
      pi[0] = -pi[0];
    }
    root2_re_[k] = pr[0];
    root2_im_[k] = pi[0];
    pr[2] = er * er - ei * ei;
    pi[2] = 2.0f * er * ei;
    pr[3] = pr[2] * pr[2] - pi[2] * pi[2];
    pi[3] = 2.0f * pr[2] * pi[2];
    const float away = offset[k] * (narrow_hz_[k] + open_[k] * (wide_hz_[k] - narrow_hz_[k]));
    if (delay_slope_[k] != 0.0f) {
      // The group's delay, for a partial this far off the centre (the
      // centre's share is in comp_): a small angle for the lowest voice,
      // doubled from voice to voice.
      const float beta = delay_slope_[k] * away, b2 = beta * beta;
      float cr = 1.0f - b2 * (0.5f - b2 * (1.0f / 24.0f));
      float ci = beta * (1.0f - b2 * ((1.0f / 6.0f) - b2 * (1.0f / 120.0f)));
      static const int kDoublings[kVoices] = {0, 1, 2, 1};
      for (int v = 0; v < kVoices; ++v) {
        for (int d = 0; d < kDoublings[v]; ++d) {
          const float t = cr * cr - ci * ci;
          ci = 2.0f * cr * ci;
          cr = t;
        }
        const float t = pr[v] * cr - pi[v] * ci;
        pi[v] = pr[v] * ci + pi[v] * cr;
        pr[v] = t;
      }
    }
    const float hz = centre_[k] + away;
    for (int v = 0; v < kVoices; ++v) {
      float qr = pr[v] * comp_re_[v][k] - pi[v] * comp_im_[v][k];
      float qi = pr[v] * comp_im_[v][k] + pi[v] * comp_re_[v][k];
      if (detune_ > 0.0f) {
        // Detune: the voice's phase runs on at its share of the partial's
        // own frequency, so every channel that holds the partial turns alike.
        const float angle = det_rate_[v] * hz * elapsed, a2 = angle * angle;
        const float cs = 1.0f - a2 * (0.5f - a2 * (1.0f / 24.0f));
        const float sn = angle * (1.0f - a2 * ((1.0f / 6.0f) - a2 * (1.0f / 120.0f)));
        float dr = det_re_[v][k] * cs - det_im_[v][k] * sn;
        float di = det_re_[v][k] * sn + det_im_[v][k] * cs;
        const float fix = 1.5f - 0.5f * (dr * dr + di * di);
        dr *= fix;
        di *= fix;
        det_re_[v][k] = dr;
        det_im_[v][k] = di;
        const float t = qr * dr - qi * di;
        qi = qr * di + qi * dr;
        qr = t;
      }
      qr *= target;
      qi *= target;
      w_re_[v][k] = moved[k] ? qr : w_target_re_[v][k];
      w_im_[v][k] = moved[k] ? qi : w_target_im_[v][k];
      w_target_re_[v][k] = qr;
      w_target_im_[v][k] = qi;
      w_step_re_[v][k] = (qr - w_re_[v][k]) * steps;
      w_step_im_[v][k] = (qi - w_im_[v][k]) * steps;
    }
    if (moved[k] && was_live) {
      // The move turned the channel's phase and the equaliser turned it
      // back; the square roots have to come out where they were.
      float half[2], quarter[2];
      sub_phasors(k, half, quarter);
      const float hr = half[0] * w_target_re_[1][k] - half[1] * w_target_im_[1][k];
      const float hi = half[0] * w_target_im_[1][k] + half[1] * w_target_re_[1][k];
      if (hr * before[k][0] + hi * before[k][1] < 0.0f) {
        sign1_[k] = -sign1_[k];
        half_im_[k] = -half_im_[k];
        sub_phasors(k, half, quarter);
      }
      const float qr = quarter[0] * w_target_re_[0][k] - quarter[1] * w_target_im_[0][k];
      const float qi = quarter[0] * w_target_im_[0][k] + quarter[1] * w_target_re_[0][k];
      if (qr * before[k][2] + qi * before[k][3] < 0.0f) sign2_[k] = -sign2_[k];
    }
  }

  // Phase agreement of each channel with the one above it: near 1 when both
  // hold the same partial, near 0 when they hold different ones.
  if (!slow_tick) return;
  for (int k = 0; k < bands_ - 1; ++k) {
    const float dot = unit_re[k] * unit_re[k + 1] + unit_im[k] * unit_im[k + 1];
    agree_[k] += agree_coeff_ * (dot - agree_[k]);
  }
  // A square root has two signs. A channel beside a stronger one that holds
  // the same partial takes that neighbour's, so the sub octaves of one
  // partial add between channels instead of cancelling.
  for (int k = 0; k < bands_; ++k) {
    if (!live_[k]) continue;
    // (Stronger in what it holds alone: a channel that beats holds two
    // partials, its root slips once a beat, and nothing may follow that.)
    int j = -1;
    float best = power_[k] * pure_[k] * pure_[k];
    const auto same = [&](int a, int b) {
      const float d = (freq[a] - freq[b]) / (kSame * 0.5f * (width[a] + width[b]));
      return d * d < 1.0f;
    };
    if (k > 0 && live_[k - 1] && (agree_[k - 1] > kAgreeThreshold || same(k, k - 1))) {
      const float theirs = power_[k - 1] * pure_[k - 1] * pure_[k - 1];
      if (theirs > best) {
        j = k - 1;
        best = theirs;
      }
    }
    if (k < bands_ - 1 && live_[k + 1] && (agree_[k] > kAgreeThreshold || same(k, k + 1)) &&
        power_[k + 1] * pure_[k + 1] * pure_[k + 1] > best) {
      j = k + 1;
    }
    if (j < 0) continue;
    float mine[4], theirs[4];
    sub_outputs(k, mine);
    sub_outputs(j, theirs);
    const float half_dot = mine[0] * theirs[0] + mine[1] * theirs[1];
    const float half_size = (mine[0] * mine[0] + mine[1] * mine[1]) * (theirs[0] * theirs[0] + theirs[1] * theirs[1]);
    bool turned = false;
    if (half_dot < 0.0f && half_dot * half_dot > 0.04f * half_size) {
      sign1_[k] = -sign1_[k];
      half_im_[k] = -half_im_[k];
      // The quarter phasor is a root of the half phasor: it has just made
      // a quarter turn, and takes the sign nearer the neighbour's.
      sub_outputs(k, mine);
      turned = true;
    }
    const float quarter_dot = mine[2] * theirs[2] + mine[3] * theirs[3];
    const float quarter_size =
        (mine[2] * mine[2] + mine[3] * mine[3]) * (theirs[2] * theirs[2] + theirs[3] * theirs[3]);
    if (quarter_dot < 0.0f && (turned || quarter_dot * quarter_dot > 0.04f * quarter_size)) {
      sign2_[k] = -sign2_[k];
    }
  }
}

}  // namespace octaves
}  // namespace livemix
