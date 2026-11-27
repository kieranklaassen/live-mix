#pragma once

// The throat, the mouth and the chest that every key shares.
//
// - Six resonances of the throat in parallel, each a two-pole low-pass of
//   gain 1 at the bottom, weighted so that their sum equals the six in
//   series (the partial fractions of the series): the formants then stand
//   at the heights a throat gives them for any vowel, with no table of
//   levels. Eight further poles of a straight tube weigh in as poles with no
//   resonator of their own, and one broad band carries what air there is.
// - Six modes of a chest, fixed in hertz, fed through a high-pass so that a
//   close low chord cannot pile up under them. They are tuned a little apart
//   left and right as the image widens.
//
// Both run four lanes at a time on one set of coefficients for each side.

#include "../../kit/filters.h"
#include "folds.h"

namespace livemix {
namespace undervoice_dsp {

// Eight trapezoidal state-variable filters side by side.
struct Eight {
  F4 k[2], a1[2], a2[2], a3[2];
  F4 ic1[2], ic2[2];

  void reset() {
    for (int b = 0; b < 2; ++b) {
      ic1[b] = splat(0.0f);
      ic2[b] = splat(0.0f);
    }
  }
  void tune(int lane, float hz, float damping, float rate) {
    const float g = kit::tan_prewarp(kit::kPi * kit::clamp(hz, 5.0f, rate * 0.46f) / rate);
    const float one = 1.0f / (1.0f + g * (g + damping));
    const int b = lane >> 2, n = lane & 3;
    k[b][n] = damping;
    a1[b][n] = one;
    a2[b][n] = g * one;
    a3[b][n] = g * g * one;
  }
  // One sample in, the low and band responses of the four lanes of `b`.
  void tick(int b, F4 x, F4* low, F4* band) {
    const F4 v3 = x - ic2[b];
    const F4 v1 = a1[b] * ic1[b] + a2[b] * v3;
    const F4 v2 = ic2[b] + a2[b] * ic1[b] + a3[b] * v3;
    ic1[b] = 2.0f * v1 - ic1[b];
    ic2[b] = 2.0f * v2 - ic2[b];
    *low = v2;
    *band = v1;
  }
  // Called on the control clock: what has died away is let go.
  void settle() {
    for (int b = 0; b < 2; ++b) {
      for (int n = 0; n < 4; ++n) {
        ic1[b][n] = flush_denormal(ic1[b][n]);
        ic2[b][n] = flush_denormal(ic2[b][n]);
      }
    }
  }
};

constexpr int kFormants = 6;
constexpr int kVowels = 6;

// Hum-dark Oo, Oh, Ah, Eh, Ee, and Ue: the first three formants of each, in
// hertz, for a long low throat. The places are the ones commonly measured for
// men's sung vowels; the fourth to sixth are those of a straight tube.
inline constexpr float kVowelHz[kVowels][3] = {
    {290.0f, 720.0f, 2250.0f},   // Oo
    {430.0f, 800.0f, 2400.0f},   // Oh
    {690.0f, 1120.0f, 2500.0f},  // Ah
    {530.0f, 1720.0f, 2480.0f},  // Eh
    {285.0f, 2200.0f, 2950.0f},  // Ee
    {280.0f, 1540.0f, 2080.0f},  // Ue
};
inline constexpr float kUpperHz[3] = {3350.0f, 4150.0f, 4900.0f};
inline constexpr float kBandwidth[kFormants] = {135.0f, 120.0f, 115.0f, 150.0f, 190.0f, 240.0f};

class Tract {
 public:
  static constexpr int kPeriod = 32;
  static constexpr int kHigher = 8;
  static constexpr float kSpacing = 1.12f;
  static constexpr float kAirHz = 6200.0f;
  static constexpr float kAirQ = 1.1f;
  static constexpr float kAirGain = 0.22f;
  static constexpr int kModes = 6;
  static constexpr float kModeHz[kModes] = {96.0f, 139.0f, 187.0f, 258.0f, 344.0f, 463.0f};
  static constexpr float kModeGain[kModes] = {0.9f, 1.0f, 0.95f, 0.8f, 0.6f, 0.45f};
  static constexpr float kModeQ = 3.2f;
  static constexpr float kModeSplit = 0.06f;

  void init(float rate) {
    rate_ = rate;
    for (int side = 0; side < 2; ++side) {
      for (int lane = 0; lane < 8; ++lane) {
        formant_[side].tune(lane, 1000.0f, 1.0f, rate);
        chest_[side].tune(lane, 1000.0f, 1.0f, rate);
      }
      for (int m = 0; m < kModes; ++m) {
        chest_gain_[m >> 2][m & 3] = kModeGain[m] / kModeQ * ((m & 1) ? -1.0f : 1.0f);
      }
      high_[side].set_cutoff(85.0f, rate);
      high_again_[side].set_cutoff(85.0f, rate);
    }
    for (int lane = kModes; lane < 8; ++lane) chest_gain_[1][lane & 3] = 0.0f;
    split_ = -1.0f;
    spread(1.0f);
    reset();
  }

  void reset() {
    for (int side = 0; side < 2; ++side) {
      formant_[side].reset();
      chest_[side].reset();
      high_[side].reset();
      high_again_[side].reset();
      lips_[side].reset();
    }
    tuned_ = false;
  }

  // How far apart the modes of the two sides stand, 0 .. 1.
  void spread(float width) {
    if (width == split_) return;
    split_ = width;
    for (int side = 0; side < 2; ++side) {
      for (int m = 0; m < kModes; ++m) {
        const float part = ((m + side) & 1) ? kModeSplit * width : -kModeSplit * width;
        chest_[side].tune(m, kModeHz[m] * (1.0f + part), 1.0f / kModeQ, rate_);
      }
    }
  }

  // On the control clock: the vowel (0 .. 1 over the six), the size of the
  // throat as a factor on every formant, how far the mouth is open, and the
  // corner its lips leave.
  void set(float vowel, float scale, float open, float lips_hz) {
    const float at = kit::clamp(vowel, 0.0f, 1.0f) * static_cast<float>(kVowels - 1);
    const int from = kit::clamp_int(static_cast<int>(at), 0, kVowels - 2);
    const float part = at - static_cast<float>(from);
    float hz[kFormants], squared[kFormants];
    for (int f = 0; f < 3; ++f) hz[f] = kit::lerp(kVowelHz[from][f], kVowelHz[from + 1][f], part);
    for (int f = 3; f < kFormants; ++f) hz[f] = kUpperHz[f - 3];
    // Closed lips pull the first formant down, an open jaw lifts it.
    hz[0] *= 0.72f + 0.42f * open;
    float before = 0.0f;
    for (int f = 0; f < kFormants; ++f) {
      float place = kit::clamp(hz[f] * scale, 60.0f, rate_ * 0.43f);
      if (place < before * kSpacing) place = before * kSpacing;
      before = place;
      // Bright vowels are covered: where the second and third formants come
      // together they are broad, and ring no louder than the rest.
      const float wide = f == 1 || f == 2 ? 1.0f + 1.5f * kit::clamp((hz[1] - 1100.0f) * (1.0f / 1000.0f), 0.0f, 1.0f) : 1.0f;
      const float damping = kit::clamp(kBandwidth[f] * wide * scale / place, 0.02f, 1.0f);
      formant_[0].tune(f, place, damping, rate_);
      squared[f] = place * place;
      inverse_[f] = 1.0f / squared[f];
      damping_[f] = damping * damping;
      noise_weight_[f] = place / damping;
    }
    formant_[0].tune(kFormants, kAirHz * scale, 1.0f / kAirQ, rate_);
    for (int b = 0; b < 2; ++b) {
      formant_[1].k[b] = formant_[0].k[b];
      formant_[1].a1[b] = formant_[0].a1[b];
      formant_[1].a2[b] = formant_[0].a2[b];
      formant_[1].a3[b] = formant_[0].a3[b];
    }
    for (int n = 0; n < kHigher; ++n) {
      const float place = (5700.0f + 1000.0f * static_cast<float>(n)) * scale;
      higher_[n] = 1.0f / (place * place);
    }
    F4 target[2] = {splat(0.0f), splat(0.0f)};
    for (int f = 0; f < kFormants; ++f) {
      float weight = 1.0f;
      for (int j = 0; j < kFormants; ++j) {
        if (j != f) weight *= squared[j] / (squared[j] - squared[f]);
      }
      for (int n = 0; n < kHigher; ++n) weight /= kit::max(1.0f - squared[f] * higher_[n], 0.25f);
      target[f >> 2][f & 3] = weight;
    }
    air_noise_ = kAirGain * kAirGain * kit::min(kAirHz * scale, rate_ * 0.45f) / kAirQ;
    lips_inverse_ = 1.0f / (lips_hz * lips_hz);
    for (int side = 0; side < 2; ++side) lips_[side].set(lips_hz, kit::kSqrtHalf, rate_);
    for (int b = 0; b < 2; ++b) {
      if (!tuned_) weight_[b] = target[b];
      step_[b] = (target[b] - weight_[b]) * (1.0f / static_cast<float>(kPeriod));
    }
    tuned_ = true;
    for (int side = 0; side < 2; ++side) {
      formant_[side].settle();
      chest_[side].settle();
    }
  }

  void process(float* left, float* right, float chest) {
    weight_[0] += step_[0];
    weight_[1] += step_[1];
    float* bus[2] = {left, right};
    for (int side = 0; side < 2; ++side) {
      const float in = *bus[side];
      F4 low, band, low2, band2;
      formant_[side].tick(0, splat(in), &low, &band);
      formant_[side].tick(1, splat(in), &low2, &band2);
      float out = sum_of(weight_[0] * low + weight_[1] * low2) + kAirGain * band2[2] * formant_[side].k[1][2];
      const float deep = high_again_[side].highpass(high_[side].highpass(in)) * chest;
      chest_[side].tick(0, splat(deep), &low, &band);
      chest_[side].tick(1, splat(deep), &low2, &band2);
      out += sum_of(chest_gain_[0] * band + chest_gain_[1] * band2);
      *bus[side] = lips_[side].lowpass(out);
    }
  }

  // The power a voice on `f0` comes out with, its harmonics falling 6 dB an
  // octave, another 6 over `tilt_hz` and another 6 over `again` times that,
  // and weighed as `drip` weighs its rings: what a key is levelled by, so
  // that a harmonic that meets a formant does not jump out of a chord.
  template <typename Weigh>
  float power(float f0, float tilt_hz, float again, Weigh weigh) const {
    constexpr int kHarmonics = 16;
    const float top = kit::min(rate_ * 0.45f, 9000.0f);
    const float tilt = 1.0f / (tilt_hz * tilt_hz), more = tilt / (again * again);
    float sum = 0.0f;
    for (int h = 1; h <= kHarmonics; ++h) {
      const float hz = f0 * static_cast<float>(h), w = hz * hz;
      if (hz > top && h > 1) break;
      sum += weigh(h) * power_at(hz) / (static_cast<float>(h * h) * (1.0f + w * tilt) * (1.0f + w * more));
    }
    return sum;
  }

  // The power one tone at `hz` comes out with.
  float power_at(float hz) const {
    const float w = hz * hz;
    const float lips = w * lips_inverse_;
    float under = 1.0f + lips * lips;
    for (int f = 0; f < kFormants; ++f) {
      const float r = w * inverse_[f];
      under *= (1.0f - r) * (1.0f - r) + r * kit::max(damping_[f], 0.01f);
    }
    for (int n = 0; n < kHigher; ++n) {
      const float r = w * higher_[n];
      under *= (1.0f - r) * (1.0f - r) + r * 0.05f;
    }
    return 1.0f / kit::max(under, 1.0e-9f);
  }

  // The power white noise comes out with, in the unit its level is set in.
  float noise_power() const {
    float sum = air_noise_;
    for (int f = 0; f < kFormants; ++f) {
      const float w = weight_[f >> 2][f & 3];
      const float place = 1.0f / inverse_[f];
      const float lips = place * lips_inverse_;
      sum += w * w * noise_weight_[f] / (1.0f + lips * lips);
    }
    return sum;
  }

 private:
  Eight formant_[2];
  Eight chest_[2];
  F4 weight_[2] = {splat(0.0f), splat(0.0f)};
  F4 step_[2] = {splat(0.0f), splat(0.0f)};
  F4 chest_gain_[2] = {splat(0.0f), splat(0.0f)};
  kit::OnePole high_[2], high_again_[2];
  kit::Svf lips_[2];
  float inverse_[kFormants] = {};
  float damping_[kFormants] = {};
  float noise_weight_[kFormants] = {};
  float higher_[kHigher] = {};
  float lips_inverse_ = 1.0e-8f;
  float air_noise_ = 0.0f;
  float rate_ = 48000.0f;
  float split_ = -1.0f;
  bool tuned_ = false;
};

}  // namespace undervoice_dsp
}  // namespace livemix
