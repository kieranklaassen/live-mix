#pragma once

// OctaveBank: the polyphonic octave generator behind Octaves (octaves.h has
// the signal path around it). One real input at the bank's own rate, four
// octave voices out.
//
// The method is filter-bank phase scaling (Thuillier 2016, see octaves.h):
// each channel is a narrow complex band-pass giving z = a·e^(jφ); the voices
// are a·e^(j2φ), a·e^(j4φ), a·e^(jφ/2), a·e^(jφ/4) summed over the channels.
// What is done here beyond that:
//
// - Channel shape: three complex one-pole resonators in a third-order
//   Butterworth pattern around the centre: flat on top, 18 dB per octave of
//   offset, and no ringing to speak of.
// - Phase equaliser: a partial off the centre of its channel comes out with
//   the channel's phase shift, which the phase scaling would multiply, so
//   two channels sharing a partial would disagree. Where the partial sits is
//   read from the phase between the last two stages, and the shift and the
//   level it lost are put back before the scaling.
// - Sharpened weights: a channel counts by the square of its power against
//   its neighbours', so a partial is carried by the channel it is in and not
//   smeared over three.
// - Adaptive width: settled channels are narrow (a chord's notes fall in
//   different channels and do not intermodulate) and so slow to rise. At an
//   onset every few channels (the "grid") open to about one ERB, carry the
//   note for the few milliseconds the narrow ones need, and close again,
//   with their states moved so the partial does not notice.
// - Sub octaves: the half-angle phasor is the principal square root with a
//   sign that flips each time the phase passes half a turn: exact, with no
//   memory to drift. Neighbouring channels that hold one partial are made to
//   agree on the sign.
// - Rates: the lower channels run at a half and a quarter of the bank's
//   rate (they are far below the fold there), which is where the cost goes.
//   Their voices come back through short halfband interpolators; the delay
//   that costs (0.5 ms and 1.2 ms) is taken out of each voice's phase, so a
//   partial shared across the boundary still adds.
// - Per channel, per voice, everything slow (weight, equaliser, the phase
//   for the delay, detune) is one complex number, set at the control rate
//   and ramped: a voice costs a square or a square root and one product.

#include <cmath>

#include "Halfband.h"

namespace livemix {
namespace octaves {

class OctaveBank {
 public:
  static constexpr int kMaxBands = 64;
  static constexpr int kStages = 3;
  static constexpr int kGroups = 3;
  static constexpr int kVoices = 4;  // sub2, sub1, up1, up2
  static constexpr int kBuses = 6;

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
  int group_of(int band) const { return band >= first_[0] ? 0 : (band >= first_[1] ? 1 : 2); }

  // Time for a new note's voices to reach nine tenths of their level; 0 is off.
  void set_attack(float seconds) {
    if (!(seconds > 0.0005f)) {
      attack_coeff_ = 0.0f;
      return;
    }
    attack_coeff_ = 1.0f - std::exp(-tick_seconds_ * 2.3026f / seconds);
  }

  // amount 0..1: voice offsets of up to kDetuneCents, each voice its own way.
  void set_detune(float amount) {
    detune_ = amount;
    for (int v = 0; v < kVoices; ++v) {
      // Radians per tick, per Hz of the partial.
      const double ratio = std::exp2(kDetuneCents[v] * amount / 1200.0) - 1.0;
      det_rate_[v] = static_cast<float>(2.0 * kPiD * ratio * kVoiceRatio[v] * tick_seconds_);
    }
  }

  void process(float x, const Want& want, Frame* out);

  // For the harness: channel k's state.
  struct Probe {
    float open, power, weight, offset, age;
    bool live;
  };
  Probe probe(int k) const {
    return {open_[k], power_[k], weight_[k], avg_re_[k] > 0.0f ? avg_im_[k] / avg_re_[k] : 99.0f,
            age_[k], live_[k]};
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

  // The lower channels run at lower rates: those centred under these shares
  // of the bank's rate at a half and at a quarter of it. The highest voice a
  // channel makes is four times its centre, a fifth of its own rate at most.
  static constexpr double kGroupBelow[kGroups] = {1.0, 0.0375, 0.00625};
  // Kaiser beta of the rate changers (Halfband.h): 7 taps down each time,
  // 19 and 11 taps up, all better than 54 dB where they have to be.
  static constexpr double kDownBeta = 4.0;
  static constexpr double kUpBeta[2] = {5.0, 4.5};
  static constexpr int kDownHalf = 2;
  static constexpr int kUpHalf[2] = {5, 3};
  // A channel whose voices would come out under this level is switched off.
  static constexpr float kFloor = 3.0e-6f;
  // After an onset a channel's weights are worked out on every tick for
  // this long, then on every other one.
  static constexpr float kFresh = 0.03f;
  // Power under which a channel is not worth the control rate's attention.
  static constexpr float kQuiet = 1.0e-22f;

  static float fade_in(double hz, double from, double to) {
    if (hz <= from) return 0.0f;
    if (hz >= to) return 1.0f;
    const double t = (hz - from) / (to - from);
    return static_cast<float>(t * t * (3.0 - 2.0 * t));
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

  // The square root of (re, im) with a positive real part, same length.
  static void principal_root(float re, float im, float* out_re, float* out_im) {
    const float a = std::sqrt(re * re + im * im);
    *out_re = std::sqrt(0.5f * std::fabs(a + re));
    const float other = std::sqrt(0.5f * std::fabs(a - re));
    *out_im = im < 0.0f ? -other : other;
    const float scale = std::sqrt(a);
    *out_re *= scale;
    *out_im *= scale;
  }

  // The same for a phasor of length 1.
  static void unit_root(float re, float im, float* out_re, float* out_im) {
    *out_re = std::sqrt(0.5f * std::fabs(1.0f + re));
    const float other = std::sqrt(0.5f * std::fabs(1.0f - re));
    *out_im = im < 0.0f ? -other : other;
  }

  void set_width(int k, float open, bool rescale);
  void run_group(int g, float x, const Want& want, float* bus);
  void sub_phasors(int k, float* half, float* quarter) const;
  void sub_outputs(int k, float* out) const;
  void tick();

  float rate_ = 24000.0f;
  int bands_ = 0;
  int first_[kGroups + 1] = {};  // group g holds channels first_[g] .. first_[g - 1] (first_[-1] = bands_)
  int tick_period_ = 16;
  int tick_counter_ = 0;
  int call_ = 0;
  int slow_count_ = 0;
  int parity_ = 0;
  float tick_seconds_ = 0.0f;
  float inv_steps_[kGroups] = {};
  float agree_coeff_ = 0.0f;
  float jump_fall_ = 0.0f;
  float attack_coeff_ = 0.0f;
  float detune_ = 0.0f;
  int up1_bands_ = 0;
  int up2_bands_ = 0;

  // Rate changers and what they hold between calls.
  HalfbandDown<kDownHalf> down_[2];
  HalfbandUp<5> up_half_[kBuses];
  HalfbandUp<3> up_quarter_[kBuses];
  float x_prev_ = 0.0f;
  float half_prev_ = 0.0f;
  float late_half_[kBuses] = {};
  float late_quarter_[kBuses] = {};

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
  float first_unit_[kMaxBands] = {};
  // Voice v's share of this channel (what the voice leaves out at the ends
  // of the range) times the phase that undoes the group's delay at the
  // channel's centre; delay_slope_ is that phase per Hz off the centre for
  // the lowest voice; unskew_ is the same for the channel signal itself.
  float comp_re_[kVoices][kMaxBands] = {};
  float comp_im_[kVoices][kMaxBands] = {};
  float delay_slope_[kMaxBands] = {};
  float ahead_re_[2][kMaxBands] = {};
  float ahead_im_[2][kMaxBands] = {};
  float unskew_re_[kMaxBands] = {};
  float unskew_im_[kMaxBands] = {};
  // Per channel: the resonators.
  float pole_re_[kStages][kMaxBands] = {};
  float pole_im_[kStages][kMaxBands] = {};
  float gain_[kMaxBands] = {};
  float yr_[kStages][kMaxBands] = {};
  float yi_[kStages][kMaxBands] = {};
  // Per channel: width, equaliser, weight.
  float open_[kMaxBands] = {};
  float age_[kMaxBands] = {};
  float power_coeff_[kMaxBands] = {};
  float rotor_coeff_[kMaxBands] = {};
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
  float root1_re_[kMaxBands] = {};
  float root1_im_[kMaxBands] = {};
  float root2_re_[kMaxBands] = {};
  float root2_im_[kMaxBands] = {};
  float avg_re_[kMaxBands] = {};
  float avg_im_[kMaxBands] = {};
  float power_[kMaxBands] = {};
  float slow_[kMaxBands] = {};
  float weight_[kMaxBands] = {};
  float agree_[kMaxBands] = {};
  // Per channel, per voice: the complex weight, ramped between ticks.
  bool live_[kMaxBands] = {};
  int since_[kMaxBands] = {};
  float w_re_[kVoices][kMaxBands] = {};
  float w_im_[kVoices][kMaxBands] = {};
  float w_step_re_[kVoices][kMaxBands] = {};
  float w_step_im_[kVoices][kMaxBands] = {};
  float w_target_re_[kVoices][kMaxBands] = {};
  float w_target_im_[kVoices][kMaxBands] = {};
  // Per channel: the signs of the two square roots, and the half-angle
  // phasor's last imaginary part (to see it pass half a turn).
  float sign1_[kMaxBands] = {};
  float sign2_[kMaxBands] = {};
  float half_im_[kMaxBands] = {};
  float det_re_[kVoices][kMaxBands] = {};
  float det_im_[kVoices][kMaxBands] = {};
  float det_rate_[kVoices] = {};
};

}  // namespace octaves
}  // namespace livemix

#include "OctaveBankImpl.h"
