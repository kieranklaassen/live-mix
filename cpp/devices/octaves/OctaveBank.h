#pragma once

// OctaveBank: the polyphonic octave generator behind Octaves (see octaves.h
// for the method and the signal path). One real input at the bank's own
// rate, four octave voices out.

#include <cmath>

#include "../../kit/filters.h"

namespace livemix {
namespace octaves {

class OctaveBank {
 public:
  static constexpr int kMaxBands = 64;
  static constexpr int kStages = 3;
  static constexpr int kZones = 7;

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
  // After an onset the cutoff follows kOpenProduct / age down to the settled one.
  static constexpr float kOpenProduct = 0.35f;
  // What the voices leave out: sub octaves that would land under about
  // 30 Hz, and upper octaves that would pass the bank's Nyquist frequency.
  static constexpr double kSub1LowHz = 55.0;
  static constexpr double kSub2LowHz = 110.0;
  static constexpr float kTickHz = 1500.0f;
  static constexpr float kPowerSeconds = 0.004f;
  static constexpr float kRotorSeconds = 0.004f;
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
  float power_coeff_ = 0.0f;
  float rotor_coeff_ = 0.0f;
  float agree_coeff_ = 0.0f;
  float rise_coeff_ = 0.0f;
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
  int zone_of_[kMaxBands] = {};
  // Per channel: the resonators.
  float pole_re_[kStages][kMaxBands] = {};
  float pole_im_[kStages][kMaxBands] = {};
  float gain_[kMaxBands] = {};
  float yr_[kStages][kMaxBands] = {};
  float yi_[kStages][kMaxBands] = {};
  // Per channel: width, equaliser, weight.
  float open_[kMaxBands] = {};
  float age_[kMaxBands] = {};
  float rise_slow_[kMaxBands] = {};
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
  // Onset zones: an octave-wide detector each.
  kit::Svf zone_filter_[kZones];
  float zone_fast_[kZones] = {};
  float zone_slow_[kZones] = {};
  bool zone_armed_[kZones] = {};
  bool zone_fired_[kZones] = {};
  float zone_attack_ = 0.0f;
  float zone_release_ = 0.0f;
  float zone_slow_coeff_ = 0.0f;
};

}  // namespace octaves
}  // namespace livemix

#include "OctaveBankImpl.h"
