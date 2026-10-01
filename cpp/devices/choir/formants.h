#pragma once

// The vocal tract of the choir: vowel tables and one bank of five formant
// resonators in parallel, shared by every note.

#include "../../kit/filters.h"
#include "../../kit/math.h"

namespace livemix {
namespace choir_dsp {

constexpr int kFormants = 5;
constexpr int kVowels = 5;

struct FormantSet {
  float hz[kFormants];
  float bandwidth[kFormants];
};

// Ah, Eh, Ee, Oh, Oo for an adult male speaker; Voice scales them.
//
// F1 to F3 are the averages for 33 men in Peterson and Barney, "Control
// methods used in a study of the vowels", JASA 24 (1952): the vowels of
// "hod" /ɑ/, "head" /ɛ/, "heed" /i/, "hawed" /ɔ/ and "who'd" /u/. They did
// not report F4 and F5; those are the fourth and fifth resonances of a
// uniform 17.5 cm tract (Fant), 3500 and 4500 Hz, for every vowel. Their
// averages for women are about 1.1 to 1.2 times the men's and for children
// about 1.25 to 1.4 times, which is what Voice is scaled in.
//
// Bandwidths are those commonly tabulated for a tenor singing the same five
// vowels (the formant table of the Csound manual, after Rodet's CHANT): 80
// to 140 Hz on Ah, a little less on the others. One departure: that table
// gives Ee, Oh and Oo a first formant 40 Hz wide, which is a closed glottis;
// here they are 60 to 70 Hz. A soft sung voice damps its first formant, and
// a narrower one whistles whenever a harmonic lands on it.
inline constexpr FormantSet kVowelTable[kVowels] = {
    {{730.0f, 1090.0f, 2440.0f, 3500.0f, 4500.0f}, {80.0f, 90.0f, 120.0f, 130.0f, 140.0f}},  // Ah
    {{530.0f, 1840.0f, 2480.0f, 3500.0f, 4500.0f}, {70.0f, 80.0f, 100.0f, 120.0f, 120.0f}},  // Eh
    {{270.0f, 2290.0f, 3010.0f, 3500.0f, 4500.0f}, {60.0f, 90.0f, 100.0f, 120.0f, 120.0f}},  // Ee
    {{570.0f, 840.0f, 2410.0f, 3500.0f, 4500.0f}, {70.0f, 80.0f, 100.0f, 120.0f, 120.0f}},   // Oh
    {{300.0f, 870.0f, 2240.0f, 3500.0f, 4500.0f}, {60.0f, 70.0f, 100.0f, 120.0f, 120.0f}},   // Oo
};

// The formants at `position` in [0, 1] along Ah, Eh, Ee, Oh, Oo (a vowel
// every 0.25), interpolated linearly in Hz and scaled by `scale`. The
// bandwidths scale too, so a smaller tract keeps its resonances as sharp.
inline void vowel_at(float position, float scale, FormantSet* out) {
  const float scaled = kit::clamp(position, 0.0f, 1.0f) * static_cast<float>(kVowels - 1);
  int index = static_cast<int>(scaled);
  if (index > kVowels - 2) index = kVowels - 2;
  const float t = scaled - static_cast<float>(index);
  const FormantSet& a = kVowelTable[index];
  const FormantSet& b = kVowelTable[index + 1];
  for (int k = 0; k < kFormants; ++k) {
    out->hz[k] = kit::lerp(a.hz[k], b.hz[k], t) * scale;
    out->bandwidth[k] = kit::lerp(a.bandwidth[k], b.bandwidth[k], t) * scale;
  }
}

// Five formant resonators in parallel, in stereo, on one set of coefficients.
//
// Each is a two-pole resonant low-pass: unity gain at DC, gain F/B at its
// formant, 12 dB per octave above it (Klatt's formant resonator), here in
// the trapezoidal state-variable form so it can be retuned while it rings.
// A vocal tract is those resonators in series. In parallel they give the
// same response when each is weighted by what all the others do at its own
// frequency,
//
//   g_k = Π_{j≠k} F_j² / (F_j² - F_k²)
//
// (the partial fractions of the cascade; the weights alternate in sign). So
// the heights of the formants are the acoustic ones for any vowel and any
// point of a morph, with no amplitude table, and the fundamental of a low
// note is not thinned out the way a bank of band-passes would thin it.
//
// Five pole pairs stop at 5 kHz; a tract has a resonance about every
// kilohertz above that, and their skirts lift F3 by about 7 dB, F4 by 15 dB
// and F5 by more. Without them the upper formants sit far too low and every
// vowel is dull (Klatt's "higher-pole correction"). The next eight, the 5.5
// to 12.5 kHz resonances of a uniform tract, are in the product above as
// poles with no resonator of their own; with them Ah's third formant comes
// out about 30 dB under its first, where Peterson and Barney measured it
// (28 dB). What those poles would add above 5 kHz is lumped into one broad
// band-pass, the air band, well under the formants: it is what lets the
// breath hiss.
class FormantBank {
 public:
  static constexpr int kHigherPoles = 8;
  static constexpr float kAirHz = 8000.0f;
  static constexpr float kAirQ = 1.5f;
  static constexpr float kAirGain = 0.35f;
  // Neighbouring formants are kept this far apart so the weights stay
  // bounded whatever drifts them.
  static constexpr float kMinSpacing = 1.1f;

  void reset() {
    for (int k = 0; k <= kFormants; ++k) {
      left_[k] = State();
      right_[k] = State();
    }
    for (int k = 0; k < kFormants; ++k) {
      gain_[k] = 0.0f;
      step_[k] = 0.0f;
    }
    remaining_ = 0;
    tuned_ = false;
  }

  // Retune to `formants` (with the air band at kAirHz·scale). Called on the
  // control clock; the weights ramp over the `period` samples to the next
  // call so they never step.
  void set(const FormantSet& formants, float scale, float sample_rate, int period) {
    float squared[kFormants];
    float previous = 0.0f;
    for (int k = 0; k < kFormants; ++k) {
      float hz = kit::clamp(formants.hz[k], 60.0f, sample_rate * 0.45f);
      if (hz < previous * kMinSpacing) hz = previous * kMinSpacing;
      previous = hz;
      const float damping = kit::clamp(formants.bandwidth[k] / hz, 0.005f, 1.0f);
      coeff_[k].set(hz, damping, sample_rate);
      squared[k] = hz * hz;
      inverse_squared_[k] = 1.0f / squared[k];
      damping_squared_[k] = damping * damping;
      noise_weight_[k] = hz / damping;
    }
    coeff_[kFormants].set(kAirHz * scale, 1.0f / kAirQ, sample_rate);
    air_noise_ = kAirGain * kAirGain * kit::min(kAirHz * scale, sample_rate * 0.45f) / kAirQ;
    for (int n = 0; n < kHigherPoles; ++n) {
      const float hz = (5500.0f + 1000.0f * static_cast<float>(n)) * scale;
      higher_inverse_squared_[n] = 1.0f / (hz * hz);
    }
    for (int k = 0; k < kFormants; ++k) {
      float weight = 1.0f;
      for (int j = 0; j < kFormants; ++j) {
        if (j != k) weight *= squared[j] / (squared[j] - squared[k]);
      }
      for (int n = 0; n < kHigherPoles; ++n) {
        weight /= kit::max(1.0f - squared[k] * higher_inverse_squared_[n], 0.2f);
      }
      if (tuned_) {
        step_[k] = (weight - gain_[k]) / static_cast<float>(period);
      } else {
        gain_[k] = weight;
        step_[k] = 0.0f;
      }
    }
    remaining_ = tuned_ ? period : 0;
    tuned_ = true;
  }

  void process(float in_left, float in_right, float* out_left, float* out_right) {
    if (remaining_ > 0) {
      --remaining_;
      for (int k = 0; k < kFormants; ++k) gain_[k] += step_[k];
    }
    float left = 0.0f, right = 0.0f;
    for (int k = 0; k < kFormants; ++k) {
      left += gain_[k] * left_[k].lowpass(in_left, coeff_[k]);
      right += gain_[k] * right_[k].lowpass(in_right, coeff_[k]);
    }
    left += kAirGain * left_[kFormants].bandpass(in_left, coeff_[kFormants]);
    right += kAirGain * right_[kFormants].bandpass(in_right, coeff_[kFormants]);
    *out_left = left;
    *out_right = right;
  }

  // The power a voice of fundamental `f0` comes out with: its harmonics
  // (falling 6 dB per octave and more above kReferenceTilt, as the source
  // does) through the cascade. A harmonic that lands on a formant makes a
  // note many times louder than its neighbour, and a soprano note above F1
  // many times weaker; singers even that out, and so does the instrument,
  // by dividing each note by the root of this.
  float harmonic_power(float f0, float sample_rate) const {
    static constexpr int kHarmonics = 16;
    static constexpr float kReferenceTilt = 2500.0f;
    const float top = kit::min(sample_rate * 0.45f, 8000.0f);
    float power = 0.0f;
    for (int h = 1; h <= kHarmonics; ++h) {
      const float hz = f0 * static_cast<float>(h);
      if (hz > top && h > 1) break;
      const float w = hz * hz;
      const float tilt = 1.0f + w / (kReferenceTilt * kReferenceTilt);
      float denominator = static_cast<float>(h * h) * tilt;
      for (int k = 0; k < kFormants; ++k) {
        const float r2 = w * inverse_squared_[k];
        denominator *= (1.0f - r2) * (1.0f - r2) + r2 * damping_squared_[k];
      }
      for (int n = 0; n < kHigherPoles; ++n) {
        const float r2 = w * higher_inverse_squared_[n];
        denominator *= (1.0f - r2) * (1.0f - r2) + r2 * 0.02f;
      }
      power += 1.0f / kit::max(denominator, 1.0e-12f);
    }
    return power;
  }

  // The power white noise comes out with, in the same arbitrary unit for
  // every vowel: each resonator passes its weight² · Q² over a band F/Q wide.
  float noise_power() const {
    float power = air_noise_;
    for (int k = 0; k < kFormants; ++k) power += gain_[k] * gain_[k] * noise_weight_[k];
    return power;
  }

 private:
  // Trapezoidal state-variable filter (as kit::Svf), split so both channels
  // run on one set of coefficients.
  struct Coefficients {
    float k = 1.0f, a1 = 0.0f, a2 = 0.0f, a3 = 0.0f;
    void set(float hz, float damping, float sample_rate) {
      hz = kit::clamp(hz, 5.0f, sample_rate * 0.49f);
      const float g = kit::tan_prewarp(kit::kPi * hz / sample_rate);
      k = damping;
      a1 = 1.0f / (1.0f + g * (g + k));
      a2 = g * a1;
      a3 = g * a2;
    }
  };
  struct State {
    float ic1 = 0.0f, ic2 = 0.0f;
    float lowpass(float x, const Coefficients& c) {
      const float v3 = x - ic2;
      const float v1 = c.a1 * ic1 + c.a2 * v3;
      const float v2 = ic2 + c.a2 * ic1 + c.a3 * v3;
      ic1 = flush_denormal(2.0f * v1 - ic1);
      ic2 = flush_denormal(2.0f * v2 - ic2);
      return v2;
    }
    // Unity gain at the centre.
    float bandpass(float x, const Coefficients& c) {
      const float v3 = x - ic2;
      const float v1 = c.a1 * ic1 + c.a2 * v3;
      const float v2 = ic2 + c.a2 * ic1 + c.a3 * v3;
      ic1 = flush_denormal(2.0f * v1 - ic1);
      ic2 = flush_denormal(2.0f * v2 - ic2);
      return v1 * c.k;
    }
  };

  Coefficients coeff_[kFormants + 1];
  State left_[kFormants + 1];
  State right_[kFormants + 1];
  float gain_[kFormants] = {};
  float step_[kFormants] = {};
  float inverse_squared_[kFormants] = {};
  float damping_squared_[kFormants] = {};
  float noise_weight_[kFormants] = {};
  float higher_inverse_squared_[kHigherPoles] = {};
  float air_noise_ = 0.0f;
  int remaining_ = 0;
  bool tuned_ = false;
};

}  // namespace choir_dsp
}  // namespace livemix
