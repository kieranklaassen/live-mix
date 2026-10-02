#pragma once

// OctaveBank: the polyphonic octave generator behind Octaves. One real input
// at the bank's own rate (about 24 kHz), four octave voices out.
//
// The method is the filter-bank phase scaling of Etienne Thuillier,
// "Real-Time Polyphonic Octave Doubling for the Guitar" (Aalto University
// MSc thesis, 2016): the input is split into narrow complex band-pass
// channels on an ERB-like scale, each giving an analytic signal
// z = a·e^(jφ), and in each channel the phase is scaled while the amplitude
// is kept:
//
//   one octave up     a·e^(j2φ)   = z²/|z|
//   two octaves up    a·e^(j4φ)   = z⁴/|z|³
//   one octave down   a·e^(jφ/2)    a square root of the unit phasor
//   two octaves down  a·e^(jφ/4)    a square root of that
//
// A channel that holds one partial gives an exact octave of it at once, with
// no window to wait for and no splice to warble. What this file adds to the
// thesis method:
//
// - Each channel is three complex one-pole resonators in series (a complex
//   gammatone of order 3). Its phase shift depends on where in the channel a
//   partial sits, and a multiplied phase multiplies that shift, so a partial
//   between two channels would come out of them with opposite phases and
//   cancel. The ratio of the last two stages is the phase shift of one stage
//   at whatever frequency is in the channel, so a slowly averaged rotor made
//   from it (EQ rotor below) takes the whole shift out again: every channel
//   that holds a partial reports the same phase for it, and their octaves add.
// - Channels are weighted by how much they stand out from their neighbours
//   (their smoothed power against the sum of theirs and the two beside
//   them). A partial is then carried by the one or two channels on top of it
//   and not by the skirts of a dozen, which is where most intermodulation
//   between the notes of a chord would otherwise come from.
// - A square root has two signs. Each channel follows its own phase through
//   the wraps (continuity in time), and a channel beside a stronger one that
//   holds the same partial takes that neighbour's sign (and quarter turn for
//   the second octave down), so the sub octaves of one partial never cancel
//   between channels. Whether two channels hold the same partial is read from
//   the averaged agreement of their phases.
// - Attack is per channel: the level a channel is allowed rises at the set
//   rate and falls at once, so a new note swells in while notes already
//   sounding stay where they are.
// - Detune turns each voice in each channel at a rate proportional to the
//   channel's frequency: a true constant pitch offset in cents, per voice.
//
// Work that does not need to happen every sample (weights, the EQ rotor, sign
// agreement, denormal flush) runs every kTick samples, counted in samples.

#include <cmath>

namespace livemix {
namespace octaves {

class OctaveBank {
 public:
  static constexpr int kBands = 64;
  static constexpr int kStages = 3;

  // Voice outputs for one sample. The up voices come out on two buses
  // (alternate channels) so the device can spread them across the stereo
  // field; their sum is the voice.
  struct Frame {
    float sub2 = 0.0f;
    float sub1 = 0.0f;
    float up1[2] = {0.0f, 0.0f};
    float up2[2] = {0.0f, 0.0f};
  };

  // Which voices to compute (the others cost nothing).
  struct Want {
    bool sub2 = true;
    bool sub1 = true;
    bool up1 = true;
    bool up2 = true;
  };

  void init(float rate) {
    rate_ = rate;
    tick_period_ = static_cast<int>(rate / kTickHz + 0.5f);
    if (tick_period_ < 1) tick_period_ = 1;
    tick_counter_ = 0;
    inv_period_ = 1.0f / static_cast<float>(tick_period_);
    const float tick_seconds = static_cast<float>(tick_period_) / rate;
    power_coeff_ = 1.0f - std::exp(-tick_seconds / kPowerSeconds);
    rotor_coeff_ = 1.0f - std::exp(-tick_seconds / kRotorSeconds);
    agree_coeff_ = 1.0f - std::exp(-tick_seconds / kAgreeSeconds);
    attack_coeff_ = 0.0f;
    detune_ = 0.0f;

    const double lo = erb_number(kLowHz);
    const double hi = erb_number(kHighHz);
    for (int k = 0; k < kBands; ++k) {
      const double hz = erb_hz(lo + (hi - lo) * k / (kBands - 1));
      centre_[k] = static_cast<float>(hz);
      const double width = kWidth * (kWidthBaseHz + kWidthSlope * hz);
      const double r = std::exp(-2.0 * kPiD * width / rate);
      const double w = 2.0 * kPiD * hz / rate;
      pole_re_[k] = static_cast<float>(r * std::cos(w));
      pole_im_[k] = static_cast<float>(r * std::sin(w));
      // Unity for the analytic half of a real sine at the centre: (1-r) per
      // stage, times two.
      gain_[k] = static_cast<float>(2.0 * (1.0 - r) * (1.0 - r) * (1.0 - r));
      limit_sub1_[k] = fade_in(hz, kSub1LowHz, kSub1LowHz * 1.4);
      limit_sub2_[k] = fade_in(hz, kSub2LowHz, kSub2LowHz * 1.4);
      limit_up1_[k] = 1.0f - fade_in(hz, kUp1HighHz * 0.8, kUp1HighHz);
      limit_up2_[k] = 1.0f - fade_in(hz, kUp2HighHz * 0.8, kUp2HighHz);
      for (int s = 0; s < kStages; ++s) {
        yr_[s][k] = 0.0f;
        yi_[s][k] = 0.0f;
      }
      rot_re_[k] = 1.0f;
      rot_im_[k] = 0.0f;
      rot_step_re_[k] = 0.0f;
      rot_step_im_[k] = 0.0f;
      rot_target_re_[k] = 1.0f;
      rot_target_im_[k] = 0.0f;
      avg_re_[k] = 0.0f;
      avg_im_[k] = 0.0f;
      power_[k] = 0.0f;
      slow_[k] = 0.0f;
      weight_[k] = 0.0f;
      weight_step_[k] = 0.0f;
      weight_target_[k] = 0.0f;
      agree_[k] = 0.0f;
      prev_sin_[k] = 0.0f;
      sign_[k] = 1.0f;
      turn_re_[k] = 1.0f;
      turn_im_[k] = 0.0f;
      for (int v = 0; v < 4; ++v) {
        det_re_[v][k] = 1.0f;
        det_im_[v][k] = 0.0f;
        det_cos_[v][k] = 1.0f;
        det_sin_[v][k] = 0.0f;
      }
    }
    up1_bands_ = count_bands(limit_up1_);
    up2_bands_ = count_bands(limit_up2_);
  }

  int tick_period() const { return tick_period_; }
  float centre(int band) const { return centre_[band]; }

  // Time for a new note's voices to reach nine tenths of their level; 0 is off.
  void set_attack(float seconds) {
    if (!(seconds > 0.0005f)) {
      attack_coeff_ = 0.0f;
      return;
    }
    const float tick_seconds = static_cast<float>(tick_period_) / rate_;
    attack_coeff_ = 1.0f - std::exp(-tick_seconds * 2.3026f / seconds);
  }

  // amount 0..1: voice offsets of up to kDetuneCents, each voice its own way.
  void set_detune(float amount) {
    if (amount == detune_) return;
    detune_ = amount;
    for (int v = 0; v < 4; ++v) {
      const double ratio = std::exp2(kDetuneCents[v] * amount / 1200.0) - 1.0;
      for (int k = 0; k < kBands; ++k) {
        const double angle = 2.0 * kPiD * ratio * kVoiceRatio[v] * centre_[k] / rate_;
        det_cos_[v][k] = static_cast<float>(std::cos(angle));
        det_sin_[v][k] = static_cast<float>(std::sin(angle));
      }
    }
  }

  bool detuned() const { return detune_ > 0.0f; }

  void process(float x, const Want& want, Frame* out) {
    float sub1 = 0.0f, sub2 = 0.0f;
    float up1[2] = {0.0f, 0.0f};
    float up2[2] = {0.0f, 0.0f};
    const bool detune = detune_ > 0.0f;
    const bool subs = want.sub1 || want.sub2;
    for (int k = 0; k < kBands; ++k) {
      // Three complex one-pole resonators in series.
      const float pr = pole_re_[k], pi = pole_im_[k];
      float ar = yr_[0][k], ai = yi_[0][k];
      float t = pr * ar - pi * ai + gain_[k] * x;
      ai = pr * ai + pi * ar;
      ar = t;
      yr_[0][k] = ar;
      yi_[0][k] = ai;
      float br = yr_[1][k], bi = yi_[1][k];
      t = pr * br - pi * bi + ar;
      bi = pr * bi + pi * br + ai;
      br = t;
      yr_[1][k] = br;
      yi_[1][k] = bi;
      float cr = yr_[2][k], ci = yi_[2][k];
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

      if (want.up1 || want.up2) {
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
        // Principal half angle: cosine >= 0, sine with the sign of s.
        const float hc = std::sqrt(0.5f * pos(1.0f + c));
        const float hs_mag = std::sqrt(0.5f * pos(1.0f - c));
        const float hs = s < 0.0f ? -hs_mag : hs_mag;
        // Crossing the negative real axis: the principal half angle jumps by
        // a half turn, so the sign flips and the quarter phasor turns.
        const float before = prev_sin_[k];
        prev_sin_[k] = s;
        if (c < 0.0f && ((s < 0.0f) != (before < 0.0f))) {
          sign_[k] = -sign_[k];
          const float tr = turn_re_[k], ti = turn_im_[k];
          if (s < 0.0f) {  // forwards: a quarter turn on
            turn_re_[k] = -ti;
            turn_im_[k] = tr;
          } else {
            turn_re_[k] = ti;
            turn_im_[k] = -tr;
          }
        }
        if (want.sub1) {
          const float g = amp * limit_sub1_[k] * sign_[k];
          if (detune) {
            float dr, di;
            turn(1, k, &dr, &di);
            sub1 += g * (hc * dr - hs * di);
          } else {
            sub1 += g * hc;
          }
        }
        if (want.sub2) {
          const float qc = std::sqrt(0.5f * (1.0f + hc));
          const float qs_mag = std::sqrt(0.5f * pos(1.0f - hc));
          const float qs = hs < 0.0f ? -qs_mag : qs_mag;
          const float tr = turn_re_[k], ti = turn_im_[k];
          const float g = amp * limit_sub2_[k];
          const float er = qc * tr - qs * ti;
          if (detune) {
            const float ei = qc * ti + qs * tr;
            float dr, di;
            turn(0, k, &dr, &di);
            sub2 += g * (er * dr - ei * di);
          } else {
            sub2 += g * er;
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

 private:
  // --- design ---------------------------------------------------------------
  static constexpr double kPiD = 3.14159265358979323846;
  static constexpr double kLowHz = 40.0;
  static constexpr double kHighHz = 6000.0;
  // One-pole half bandwidth of a stage: kWidth × (base + slope × centre) Hz.
  static constexpr double kWidth = 0.5;
  static constexpr double kWidthBaseHz = 24.7;
  static constexpr double kWidthSlope = 0.108;
  // What the voices leave out: sub octaves that would land under about
  // 30 Hz, and upper octaves that would pass the bank's Nyquist frequency.
  static constexpr double kSub1LowHz = 55.0;
  static constexpr double kSub2LowHz = 110.0;
  static constexpr double kUp1HighHz = 5000.0;
  static constexpr double kUp2HighHz = 2500.0;
  static constexpr float kTickHz = 1500.0f;
  static constexpr float kPowerSeconds = 0.004f;
  static constexpr float kRotorSeconds = 0.004f;
  static constexpr float kAgreeSeconds = 0.010f;
  static constexpr float kAgreeThreshold = 0.7f;
  // Coherent sum of a centred partial's channels, measured (see the harness).
  static constexpr float kNorm = 1.0f;
  // Voice order here: sub2, sub1, up1, up2.
  static constexpr double kDetuneCents[4] = {5.0, -8.0, 11.0, -15.0};
  static constexpr double kVoiceRatio[4] = {0.25, 0.5, 2.0, 4.0};

  static float pos(float x) { return x > 0.0f ? x : 0.0f; }

  static double erb_number(double hz) { return 21.4 * std::log10(1.0 + 0.00437 * hz); }
  static double erb_hz(double number) { return (std::pow(10.0, number / 21.4) - 1.0) / 0.00437; }

  static float fade_in(double hz, double from, double to) {
    if (hz <= from) return 0.0f;
    if (hz >= to) return 1.0f;
    const double t = (hz - from) / (to - from);
    return static_cast<float>(t * t * (3.0 - 2.0 * t));
  }

  static int count_bands(const float* limit) {
    int count = kBands;
    while (count > 0 && limit[count - 1] == 0.0f) --count;
    return count;
  }

  // Advance voice v's detune rotor in channel k and return it.
  void turn(int v, int k, float* re, float* im) {
    const float dr = det_re_[v][k], di = det_im_[v][k];
    const float cs = det_cos_[v][k], sn = det_sin_[v][k];
    *re = dr;
    *im = di;
    det_re_[v][k] = dr * cs - di * sn;
    det_im_[v][k] = dr * sn + di * cs;
  }

  void tick() {
    float unit_re[kBands], unit_im[kBands];
    float sharp[kBands];
    for (int k = 0; k < kBands; ++k) {
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
      } else {
        power_[k] += power_coeff_ * (now - power_[k]);
        // stage 2 × conj(stage 3): minus the phase shift of one stage.
        avg_re_[k] += rotor_coeff_ * (br * cr + bi * ci - avg_re_[k]);
        avg_im_[k] += rotor_coeff_ * (bi * cr - br * ci - avg_im_[k]);
      }
      // The EQ rotor: that shift, three times over.
      rot_re_[k] = rot_target_re_[k];
      rot_im_[k] = rot_target_im_[k];
      const float size = avg_re_[k] * avg_re_[k] + avg_im_[k] * avg_im_[k];
      float er = 1.0f, ei = 0.0f;
      if (size > 1.0e-36f) {
        const float inv = 1.0f / std::sqrt(size);
        const float ur = avg_re_[k] * inv, ui = avg_im_[k] * inv;
        const float sr = ur * ur - ui * ui, si = 2.0f * ur * ui;
        er = sr * ur - si * ui;
        ei = sr * ui + si * ur;
      }
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

    for (int k = 0; k < kBands; ++k) {
      // How far the channel stands out from its neighbours.
      const float below = k > 0 ? sharp[k - 1] : 0.0f;
      const float above = k < kBands - 1 ? sharp[k + 1] : 0.0f;
      const float total = below + sharp[k] + above;
      float target = total > 0.0f ? kNorm * sharp[k] / total : 0.0f;
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
      // Renormalise the detune rotors (they are multiplied 24 000 times a second).
      if (detune_ > 0.0f) {
        for (int v = 0; v < 4; ++v) {
          const float dr = det_re_[v][k], di = det_im_[v][k];
          const float fix = 1.5f - 0.5f * (dr * dr + di * di);
          det_re_[v][k] = dr * fix;
          det_im_[v][k] = di * fix;
        }
      }
    }

    // Phase agreement of each channel with the one above it: near 1 when
    // both hold the same partial, near 0 when they hold different ones.
    for (int k = 0; k < kBands - 1; ++k) {
      const float dot = unit_re[k] * unit_re[k + 1] + unit_im[k] * unit_im[k + 1];
      agree_[k] += agree_coeff_ * (dot - agree_[k]);
    }
    // A channel beside a stronger one with the same partial takes its sign
    // (sub 1) and its quarter turn (sub 2).
    for (int k = 0; k < kBands; ++k) {
      int j = -1;
      float best = power_[k];
      if (k > 0 && power_[k - 1] > best && agree_[k - 1] > kAgreeThreshold) {
        j = k - 1;
        best = power_[k - 1];
      }
      if (k < kBands - 1 && power_[k + 1] > best && agree_[k] > kAgreeThreshold) j = k + 1;
      if (j < 0) continue;
      float hkr, hki, hjr, hji;
      half(unit_re[k], unit_im[k], &hkr, &hki);
      half(unit_re[j], unit_im[j], &hjr, &hji);
      // Principal halves agree unless one phase has wrapped and the other has
      // not; the signs must make the signed halves agree.
      const float dot = (hkr * hjr + hki * hji) * sign_[k] * sign_[j];
      if (dot < -0.2f) sign_[k] = -sign_[k];
      float qkr, qki, qjr, qji;
      half(hkr, hki, &qkr, &qki);
      half(hjr, hji, &qjr, &qji);
      const float ar = qkr * turn_re_[k] - qki * turn_im_[k];
      const float ai = qkr * turn_im_[k] + qki * turn_re_[k];
      const float br = qjr * turn_re_[j] - qji * turn_im_[j];
      const float bi = qjr * turn_im_[j] + qji * turn_re_[j];
      // a × conj(b): where k's quarter phasor sits against j's.
      const float xr = ar * br + ai * bi;
      const float xi = ai * br - ar * bi;
      const float tr = turn_re_[k], ti = turn_im_[k];
      if (xr < -0.8f) {
        turn_re_[k] = -tr;
        turn_im_[k] = -ti;
      } else if (xi > 0.8f) {  // a quarter turn ahead: turn back
        turn_re_[k] = ti;
        turn_im_[k] = -tr;
      } else if (xi < -0.8f) {
        turn_re_[k] = -ti;
        turn_im_[k] = tr;
      }
    }
  }

  // Principal square root of a unit phasor.
  static void half(float c, float s, float* hc, float* hs) {
    *hc = std::sqrt(0.5f * pos(1.0f + c));
    const float magnitude = std::sqrt(0.5f * pos(1.0f - c));
    *hs = s < 0.0f ? -magnitude : magnitude;
  }

  float rate_ = 24000.0f;
  int tick_period_ = 16;
  int tick_counter_ = 0;
  float inv_period_ = 1.0f / 16.0f;
  float power_coeff_ = 0.0f;
  float rotor_coeff_ = 0.0f;
  float agree_coeff_ = 0.0f;
  float attack_coeff_ = 0.0f;
  float detune_ = 0.0f;
  int up1_bands_ = kBands;
  int up2_bands_ = kBands;

  float centre_[kBands] = {};
  float pole_re_[kBands] = {};
  float pole_im_[kBands] = {};
  float gain_[kBands] = {};
  float limit_sub1_[kBands] = {};
  float limit_sub2_[kBands] = {};
  float limit_up1_[kBands] = {};
  float limit_up2_[kBands] = {};
  float yr_[kStages][kBands] = {};
  float yi_[kStages][kBands] = {};
  float rot_re_[kBands] = {};
  float rot_im_[kBands] = {};
  float rot_step_re_[kBands] = {};
  float rot_step_im_[kBands] = {};
  float rot_target_re_[kBands] = {};
  float rot_target_im_[kBands] = {};
  float avg_re_[kBands] = {};
  float avg_im_[kBands] = {};
  float power_[kBands] = {};
  float slow_[kBands] = {};
  float weight_[kBands] = {};
  float weight_step_[kBands] = {};
  float weight_target_[kBands] = {};
  float agree_[kBands] = {};
  float prev_sin_[kBands] = {};
  float sign_[kBands] = {};
  float turn_re_[kBands] = {};
  float turn_im_[kBands] = {};
  float det_re_[4][kBands] = {};
  float det_im_[4][kBands] = {};
  float det_cos_[4][kBands] = {};
  float det_sin_[4][kBands] = {};
};

}  // namespace octaves
}  // namespace livemix
