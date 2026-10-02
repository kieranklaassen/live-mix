#pragma once

// OctaveBank: the polyphonic octave generator behind Octaves (see octaves.h
// for the method and the signal path). One real input at the bank's own
// rate, four octave voices out.

#include <cmath>

namespace livemix {
namespace octaves {

class OctaveBank {
 public:
  static constexpr int kMaxBands = 64;
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

  // `count` channels centred from low_hz to high_hz at `rate`.
  void init(float rate, float low_hz, float high_hz, int count);

  int bands() const { return bands_; }
  int tick_period() const { return tick_period_; }
  float centre(int band) const { return centre_[band]; }
  bool is_grid(int band) const { return grid_[band]; }

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
      for (int k = 0; k < bands_; ++k) {
        const double angle = 2.0 * kPiD * ratio * kVoiceRatio[v] * centre_[k] / rate_;
        det_cos_[v][k] = static_cast<float>(std::cos(angle));
        det_sin_[v][k] = static_cast<float>(std::sin(angle));
      }
    }
  }

  void process(float x, const Want& want, Frame* out);

  // For the harness: channel k's state.
  struct Probe {
    float open, power, weight, offset, age;
  };
  Probe probe(int k) const {
    return {open_[k], power_[k], weight_target_[k], avg_re_[k] > 0.0f ? avg_im_[k] / avg_re_[k] : 99.0f,
            age_[k]};
  }

 private:
  // --- design ---------------------------------------------------------------
  static constexpr double kPiD = 3.14159265358979323846;
  // Third-order Butterworth pole pattern around the channel centre, in units
  // of the channel's cutoff: real part (decay) and offset. The centred pole
  // is last because the phase equaliser reads the last stage.
  static constexpr double kSigma[kStages] = {0.5, 0.5, 1.0};
  static constexpr double kNu[kStages] = {0.8660254037844386, -0.8660254037844386, 0.0};
  // Settled cutoff as a share of the channel spacing (crossover near -2 dB).
  static constexpr double kNarrow = 0.55;
  // Cutoff just after an onset: this many ERB at the channel centre.
  static constexpr double kWideErb = 1.0;
  // Only every few channels open (the "grid": about one per open
  // bandwidth). The ones between stay narrow and sit out the kSettle[0] to
  // kSettle[1] cycles of their cutoff that their own rise takes; the open
  // grid channel carries the note meanwhile. It stays open for kHold cycles
  // of its settled cutoff, then closes with a time constant of kClose cycles.
  static constexpr float kSettle[2] = {0.25f, 0.6f};
  static constexpr float kHold = 0.6f;
  static constexpr float kClose = 0.25f;
  // An onset: first-stage power this many times its highest level of the
  // recent past (a peak hold that falls in kJumpFall seconds and is fed
  // kJumpDelay ticks late, so it does not yet know about the jump). The beat
  // between two steady notes never passes: its last peak is still held.
  static constexpr float kJump = 1.3f;
  static constexpr int kJumpDelay = 8;
  static constexpr float kJumpFall = 0.4f;
  // ... and it must exceed what the open channel would collect from the
  // settled notes in the other channels. Opening lets those in; a channel
  // that would mostly hear them stays narrow.
  // What the voices leave out: sub octaves that would land under about
  // 30 Hz, and upper octaves that would pass the bank's Nyquist frequency.
  static constexpr double kSub1LowHz = 55.0;
  static constexpr double kSub2LowHz = 110.0;
  static constexpr float kTickHz = 1500.0f;
  // The power and equaliser averages follow at these multiples of the
  // channel's present cutoff: fast while it is open, slow once settled, so
  // the beat of a neighbouring note against the channel's own is averaged
  // out instead of modulating the voice.
  static constexpr float kPowerFollow = 1.0f;
  static constexpr float kRotorFollow = 0.4f;
  static constexpr float kAgreeSeconds = 0.010f;
  static constexpr float kAgreeThreshold = 0.7f;
  static constexpr float kMaxCorrection = 2.5f;
  // Voice order here: sub2, sub1, up1, up2.
  static constexpr double kDetuneCents[4] = {5.0, -8.0, 11.0, -15.0};
  static constexpr double kVoiceRatio[4] = {0.25, 0.5, 2.0, 4.0};

  static float pos(float x) { return x > 0.0f ? x : 0.0f; }

  static float fade_in(double hz, double from, double to) {
    if (hz <= from) return 0.0f;
    if (hz >= to) return 1.0f;
    const double t = (hz - from) / (to - from);
    return static_cast<float>(t * t * (3.0 - 2.0 * t));
  }

  // The normaliser from scratch, for the rare sample where the running one
  // is off (an onset, noise). Kept out of line so the common path does not
  // pay for a square root and a division it does not use.
#if defined(__GNUC__)
  __attribute__((noinline))
#endif
  static float exact_norm(float m2) {
#ifdef OCT_COUNT
    ++g_norm;
#endif
    return m2 > 1.0e-6f ? 1.0f / std::sqrt(m2) : 0.0f;
  }

  // How much of a partial at channel j's centre channel k passes at its
  // present width (power).
  float reach(int k, int j) const {
    const float x = (centre_[j] - centre_[k]) / (narrow_hz_[k] + open_[k] * (wide_hz_[k] - narrow_hz_[k]));
    const float x2 = x * x;
    return 1.0f / (1.0f + x2 * x2 * x2);
  }

  // How much of a shared partial a channel that sees it `mine` from its
  // centre gives up to a neighbour that sees it `theirs` away (0..1).
  static float yield(float mine, float theirs) {
    float a = mine * mine, b = theirs * theirs;
    a *= a * a;
    b *= b * b;
    return a / (a + b + 1.0e-20f);
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

  void set_width(int k, float open, bool rescale);
  void tick();

  float rate_ = 24000.0f;
  int bands_ = 0;
  int tick_period_ = 16;
  int tick_counter_ = 0;
  float tick_seconds_ = 0.0f;
  float inv_period_ = 1.0f / 16.0f;
  float agree_coeff_ = 0.0f;
  float jump_fall_ = 0.0f;
  float first_unit_ = 1.0f;
  float attack_coeff_ = 0.0f;
  float detune_ = 0.0f;
  int up1_bands_ = 0;
  int up2_bands_ = 0;

  // Per channel: layout.
  float centre_[kMaxBands] = {};
  float carrier_re_[kMaxBands] = {};
  float carrier_im_[kMaxBands] = {};
  float narrow_hz_[kMaxBands] = {};
  float wide_hz_[kMaxBands] = {};
  float narrow_re_[kStages][kMaxBands] = {};
  float narrow_im_[kStages][kMaxBands] = {};
  float wide_re_[kStages][kMaxBands] = {};
  float wide_im_[kStages][kMaxBands] = {};
  float limit_sub1_[kMaxBands] = {};
  float limit_sub2_[kMaxBands] = {};
  float limit_up1_[kMaxBands] = {};
  float limit_up2_[kMaxBands] = {};
  // Per channel: the resonators.
  float pole_re_[kStages][kMaxBands] = {};
  float pole_im_[kStages][kMaxBands] = {};
  float gain_[kMaxBands] = {};
  float yr_[kStages][kMaxBands] = {};
  float yi_[kStages][kMaxBands] = {};
  // Per channel: width, equaliser, weight.
  float open_[kMaxBands] = {};
  float age_[kMaxBands] = {};
  float follow_[kMaxBands] = {};
  float jump_ref_[kMaxBands] = {};
  float jump_ring_[kJumpDelay][kMaxBands] = {};
  int jump_index_ = 0;
  float first_scale_[kMaxBands] = {};
  bool grid_[kMaxBands] = {};
  int grid_of_[kMaxBands] = {};
  int grid_below_[kMaxBands] = {};
  int grid_above_[kMaxBands] = {};
  float rot_re_[kMaxBands] = {};
  float rot_im_[kMaxBands] = {};
  float rot_step_re_[kMaxBands] = {};
  float rot_step_im_[kMaxBands] = {};
  float rot_target_re_[kMaxBands] = {};
  float rot_target_im_[kMaxBands] = {};
  float avg_re_[kMaxBands] = {};
  float avg_im_[kMaxBands] = {};
  float power_[kMaxBands] = {};
  float slow_[kMaxBands] = {};
  float weight_[kMaxBands] = {};
  float weight_step_[kMaxBands] = {};
  float weight_target_[kMaxBands] = {};
  float agree_[kMaxBands] = {};
  // Per channel: the sub-octave phasors and their running normalisers.
  float half_re_[kMaxBands] = {};
  float half_im_[kMaxBands] = {};
  float half_norm_[kMaxBands] = {};
  float quarter_re_[kMaxBands] = {};
  float quarter_im_[kMaxBands] = {};
  float quarter_norm_[kMaxBands] = {};
  float det_re_[4][kMaxBands] = {};
  float det_im_[4][kMaxBands] = {};
  float det_cos_[4][kMaxBands] = {};
  float det_sin_[4][kMaxBands] = {};
};

}  // namespace octaves
}  // namespace livemix

#include "OctaveBankImpl.h"
