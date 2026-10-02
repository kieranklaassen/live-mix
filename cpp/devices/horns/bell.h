#pragma once

// The brass voicings of Horns: what the bell of each instrument does to the
// sound, and how its player's lips answer the breath.
//
// A bell keeps low partials in the tube and lets those above its cutoff
// out, so the radiated spectrum has a broad hump that does not move with
// the note. Each type is three filters in series, fixed in hertz:
//
//   open bells   a first-order rise of 6 dB per octave up to the cutoff,
//                a mild peak at the formant, a low-pass above
//   the mute     a high-pass, a second high-pass whose resonant corner is
//                the nasal peak, a low-pass
//
// The French horn, trumpet and low brass formants follow Meyer's figures as
// the research recalls them; the flugelhorn's and everything about the mute
// are choices (see the manifest's origin note).

#include "../../kit/kit.h"

namespace livemix {
namespace horns {

constexpr int kNumTypes = 5;

struct Voicing {
  // The bell.
  bool mute;            // two high-passes instead of the rise and the peak
  float rise_from_hz;   // open bells: the rise starts here
  float cutoff_hz;      // ... and ends here; the mute: the first high-pass
  // Open bells: a peak of formant_db. The mute: the second high-pass, whose
  // corner stands up by its Q.
  float formant_hz, formant_q, formant_db;
  float lowpass_hz, lowpass_q;
  // The lips: brightness (the series' ratio) with no pressure and at full
  // blow, how long the brightness takes to follow a rising pressure, and
  // how many periods a note takes to speak.
  float soft, hard;
  float lag_seconds;
  float speech_periods;
};

inline const Voicing& voicing(int type) {
  static const Voicing kVoicings[kNumTypes] = {
      // French horn: dark, the hand in the bell takes the top off.
      {false, 85.0f, 340.0f, 340.0f, 1.1f, 5.0f, 1400.0f, 0.6f, 0.03f, 0.9f, 0.050f, 8.0f},
      // Flugelhorn: a conical, darker trumpet.
      {false, 130.0f, 800.0f, 800.0f, 1.0f, 5.0f, 2400.0f, 0.6f, 0.06f, 0.86f, 0.040f, 6.0f},
      // Trumpet.
      {false, 165.0f, 1300.0f, 1300.0f, 1.2f, 6.0f, 4200.0f, 0.6f, 0.06f, 0.88f, 0.030f, 5.0f},
      // Muted trumpet: no low end, a nasal band, and a source that is
      // bright even when soft (the band is only reached by high harmonics).
      {true, 0.0f, 1000.0f, 1800.0f, 2.5f, 0.0f, 5200.0f, 0.7f, 0.6f, 0.88f, 0.025f, 5.0f},
      // Low brass: trombones over a tuba.
      {false, 100.0f, 480.0f, 480.0f, 1.2f, 6.0f, 2000.0f, 0.6f, 0.06f, 0.88f, 0.055f, 8.0f},
  };
  return kVoicings[kit::clamp_int(type, 0, kNumTypes - 1)];
}

// One bell: the three filters for left and right, and what they do to a
// partial at a given frequency (so a note can be levelled against them).
class BellBank {
 public:
  static constexpr int kStages = 3;

  void set(const Voicing& v, float sample_rate) {
    kit::Biquad& first = stage_[0][0];
    if (v.mute) {
      first.set_highpass(v.cutoff_hz, kit::kSqrtHalf, sample_rate);
      stage_[1][0].set_highpass(v.formant_hz, v.formant_q, sample_rate);
    } else {
      // (s + w_low) / (s + w_high) by the bilinear transform: unity at the
      // top, down by w_low / w_high at the bottom, 6 dB per octave between.
      const float low = std::tan(kit::kPi * kit::min(v.rise_from_hz, 0.45f * sample_rate) / sample_rate);
      const float high = std::tan(kit::kPi * kit::min(v.cutoff_hz, 0.45f * sample_rate) / sample_rate);
      const float norm = 1.0f / (1.0f + high);
      first.b0 = (1.0f + low) * norm;
      first.b1 = (low - 1.0f) * norm;
      first.b2 = 0.0f;
      first.a1 = (high - 1.0f) * norm;
      first.a2 = 0.0f;
      stage_[1][0].set_peak(v.formant_hz, v.formant_q, v.formant_db, sample_rate);
    }
    stage_[2][0].set_lowpass(v.lowpass_hz, v.lowpass_q, sample_rate);
    for (int k = 0; k < kStages; ++k) {
      kit::Biquad& right = stage_[k][1];
      const kit::Biquad& left = stage_[k][0];
      right.b0 = left.b0;
      right.b1 = left.b1;
      right.b2 = left.b2;
      right.a1 = left.a1;
      right.a2 = left.a2;
    }
    // The strongest any partial comes out, and what white noise comes out
    // with, from a sweep of the band.
    peak_power_ = 0.0f;
    float sum = 0.0f;
    for (int i = 0; i < kSweep; ++i) {
      const double w = 3.141592653589793 * (static_cast<double>(i) + 0.5) / static_cast<double>(kSweep);
      const float power = power_at(1.0 - std::cos(w));
      peak_power_ = kit::max(peak_power_, power);
      sum += power;
    }
    noise_power_ = sum / static_cast<float>(kSweep);
  }

  void reset() {
    for (int k = 0; k < kStages; ++k) {
      stage_[k][0].reset();
      stage_[k][1].reset();
    }
  }

  void process(float left, float right, float* out_left, float* out_right) {
    for (int k = 0; k < kStages; ++k) {
      left = stage_[k][0].process(left);
      right = stage_[k][1].process(right);
    }
    *out_left = left;
    *out_right = right;
  }

  // Power gain for a partial at angle w per sample, given 1 - cos(w). Worked
  // in double from that difference: with poles this close to z = 1 the sums
  // of cosines cancel to nothing in single precision.
  float power_at(double one_minus_cosine) const {
    const double u1 = one_minus_cosine;
    const double u2 = 2.0 * u1 * (2.0 - u1);  // 1 - cos(2w)
    double power = 1.0;
    for (int k = 0; k < kStages; ++k) {
      const kit::Biquad& q = stage_[k][0];
      const double b0 = q.b0, b1 = q.b1, b2 = q.b2, a1 = q.a1, a2 = q.a2;
      const double up = (b0 + b1 + b2) * (b0 + b1 + b2) - 2.0 * (b0 * b1 + b1 * b2) * u1 - 2.0 * b0 * b2 * u2;
      const double down = (1.0 + a1 + a2) * (1.0 + a1 + a2) - 2.0 * (a1 + a1 * a2) * u1 - 2.0 * a2 * u2;
      power *= (up > 0.0 ? up : 0.0) / (down > 1.0e-18 ? down : 1.0e-18);
    }
    return static_cast<float>(power);
  }

  float peak_power() const { return peak_power_; }
  float noise_power() const { return noise_power_; }

 private:
  static constexpr int kSweep = 128;

  kit::Biquad stage_[kStages][2];
  float peak_power_ = 1.0f;
  float noise_power_ = 1.0f;
};

}  // namespace horns
}  // namespace livemix
