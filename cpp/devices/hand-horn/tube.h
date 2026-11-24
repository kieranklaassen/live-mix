#pragma once

// The sound of the tube: the bell every note goes through, the level a
// harmonic series has at its far side (so that a note is as loud whatever
// its pitch and colour), and the hand, which each note has to itself.

#include "../../kit/kit.h"
#include "ladder.h"

namespace livemix {
namespace hand_horn {

// The bell keeps the low partials in and loses the very high ones: a shelf,
// a mild peak and a low-pass, fixed in hertz. Before them three allpasses put
// the harmonics out of step: in step, as the series makes them, a low note
// would peak 13 to 15 dB over its level, and 4 to 5 dB less as they are.
class Bell {
 public:
  static constexpr int kStages = 3;

  void set(float sample_rate) {
    for (int side = 0; side < 2; ++side) {
      stage_[0][side].set_low_shelf(350.0f, -9.0f, sample_rate);
      stage_[1][side].set_peak(650.0f, 0.9f, 3.0f, sample_rate);
      stage_[2][side].set_lowpass(4200.0f, 0.62f, sample_rate);
    }
    for (int k = 0; k < kAllpasses; ++k) {
      static const float kHz[kAllpasses] = {200.0f, 500.0f, 1200.0f};
      const float w = kit::kTwoPi * kit::min(kHz[k], 0.45f * sample_rate) / sample_rate;
      const float alpha = 0.5f * std::sin(w), cosine = std::cos(w);
      const float inverse = 1.0f / (1.0f + alpha);
      for (int side = 0; side < 2; ++side) {
        kit::Biquad& q = allpass_[k][side];
        q.b0 = q.a2 = (1.0f - alpha) * inverse;
        q.b1 = q.a1 = -2.0f * cosine * inverse;
        q.b2 = 1.0f;
      }
    }
    reset();
  }
  void reset() {
    for (int side = 0; side < 2; ++side) {
      for (int k = 0; k < kStages; ++k) stage_[k][side].reset();
      for (int k = 0; k < kAllpasses; ++k) allpass_[k][side].reset();
    }
  }
  float process(int side, float x) {
    for (int k = 0; k < kAllpasses; ++k) x = allpass_[k][side].process(x);
    for (int k = 0; k < kStages; ++k) x = stage_[k][side].process(x);
    return x;
  }
  // Power gain at an angle per sample, from 1 - cos(angle): in double, and
  // from that difference, since the poles lie close to z = 1.
  double power_at(double u1) const {
    const double u2 = 2.0 * u1 * (2.0 - u1);
    double power = 1.0;
    for (int k = 0; k < kStages; ++k) {
      const kit::Biquad& q = stage_[k][0];
      const double b0 = q.b0, b1 = q.b1, b2 = q.b2, a1 = q.a1, a2 = q.a2;
      const double up = (b0 + b1 + b2) * (b0 + b1 + b2) - 2.0 * (b0 * b1 + b1 * b2) * u1 - 2.0 * b0 * b2 * u2;
      const double down = (1.0 + a1 + a2) * (1.0 + a1 + a2) - 2.0 * (a1 + a1 * a2) * u1 - 2.0 * a2 * u2;
      power *= (up > 0.0 ? up : 0.0) / (down > 1.0e-18 ? down : 1.0e-18);
    }
    return power;
  }

 private:
  static constexpr int kAllpasses = 3;
  kit::Biquad stage_[kStages][2];
  kit::Biquad allpass_[kAllpasses][2];
};

// Sine and cosine of one phase, for a phase that is already in [0, 1): the
// kit's table without its wrap, which is most of what a lookup costs.
class Waves {
 public:
  void init() {
    for (int i = 0; i < kLength; ++i) {
      table_[i] = static_cast<float>(std::sin(6.283185307179586 * static_cast<double>(i) / kTurn));
    }
  }
  void read(float phase, float* sine, float* cosine) const {
    const float position = phase * static_cast<float>(kTurn);
    const int index = static_cast<int>(position) & (kTurn - 1);
    const float t = position - static_cast<float>(static_cast<int>(position));
    const float* s = table_ + index;
    const float* c = s + kTurn / 4;
    *sine = s[0] + (s[1] - s[0]) * t;
    *cosine = c[0] + (c[1] - c[0]) * t;
  }

 private:
  static constexpr int kTurn = 4096;
  static constexpr int kLength = kTurn + kTurn / 4 + 1;
  float table_[kLength] = {};
};

// The level of the series sin x / (1 - 2a·cos x + a²) past the bell, against
// pitch and brightness a, as the logarithm of its power. Read by bilinear
// interpolation, which is what the logarithm is nearly straight for.
class LevelTable {
 public:
  static constexpr int kPerOctave = 4;
  static constexpr int kRows = 10 * kPerOctave + 1;  // 16 Hz and ten octaves up
  static constexpr int kColumns = 20;
  static constexpr float kLowest = 16.0f;
  static constexpr float kMaxBrightness = 0.95f;

  void build(const Bell& bell, float sample_rate) {
    for (int row = 0; row < kRows; ++row) {
      const double hz = kLowest * std::exp2(static_cast<double>(row) / kPerOctave);
      double power[kColumns], weight[kColumns], ratio[kColumns];
      for (int c = 0; c < kColumns; ++c) {
        const double a = kMaxBrightness * c / (kColumns - 1);
        ratio[c] = a * a;
        weight[c] = 0.5;
        power[c] = 1.0e-9;
      }
      int harmonics = static_cast<int>(0.5 * sample_rate / hz);
      harmonics = kit::clamp_int(harmonics, 0, kHarmonics);
      const double first = std::cos(6.283185307179586 * hz / sample_rate);
      double before = 1.0, cosine = first;
      for (int h = 1; h <= harmonics; ++h) {
        const double through = bell.power_at(1.0 - cosine);
        for (int c = 0; c < kColumns; ++c) {
          power[c] += weight[c] * through;
          weight[c] *= ratio[c];
        }
        const double next = 2.0 * first * cosine - before;
        before = cosine;
        cosine = next;
      }
      for (int c = 0; c < kColumns; ++c) log_power_[row][c] = static_cast<float>(std::log(power[c]));
    }
  }

  // Root mean square of the series at `hz` and brightness `a`.
  float level(float hz, float a) const {
    const float y = kit::clamp(static_cast<float>(kPerOctave) * std::log2(kit::max(hz, kLowest) / kLowest), 0.0f,
                               static_cast<float>(kRows - 1) - 0.001f);
    const float x = kit::clamp(a * (static_cast<float>(kColumns - 1) / kMaxBrightness), 0.0f,
                               static_cast<float>(kColumns - 1) - 0.001f);
    const int row = static_cast<int>(y), column = static_cast<int>(x);
    const float ty = y - static_cast<float>(row), tx = x - static_cast<float>(column);
    const float low = kit::lerp(log_power_[row][column], log_power_[row][column + 1], tx);
    const float high = kit::lerp(log_power_[row + 1][column], log_power_[row + 1][column + 1], tx);
    return std::exp(0.5f * kit::lerp(low, high, ty));
  }

 private:
  static constexpr int kHarmonics = 200;
  float log_power_[kRows][kColumns] = {};
};

// The hand in the bell of one note. Closing it takes the highs away, leaves
// a narrow nasal band standing over what lies either side of it and makes
// the whole smaller. Wide open it is not there at all.
class HandFilter {
 public:
  static constexpr float kOpenHz = 2300.0f;
  static constexpr float kShutHz = 300.0f;
  static constexpr float kLowQ = 0.5f;
  static constexpr float kNasalHz = 1220.0f;
  static constexpr float kNasalQ = 4.0f;
  static constexpr float kNasalLift = 4.2f;
  static constexpr float kSmallerDb = -2.5f;
  // The low-pass comes in over this much of the way.
  static constexpr float kInBy = 1.0f / 6.0f;

  void prepare(float sample_rate) {
    nasal_.set(kNasalHz, kNasalQ, sample_rate);
    low_.set(kOpenHz, kLowQ, sample_rate);
  }
  void reset() {
    low_.reset();
    nasal_.reset();
    wet_step_ = lift_step_ = 0.0f;
  }
  // `shut` 0 (open) to 1, reached over the next `frames` (0: at once).
  void set(float shut, int frames, float sample_rate) {
    const float wet = kit::min(1.0f, shut * (1.0f / kInBy));
    const float lift = kNasalLift * shut * std::sqrt(shut);
    if (frames > 0) {
      wet_step_ = (wet - wet_) / static_cast<float>(frames);
      lift_step_ = (lift - lift_) / static_cast<float>(frames);
    } else {
      wet_ = wet;
      lift_ = lift;
    }
    if (shut == shut_) return;
    shut_ = shut;
    low_.set(kOpenHz * std::exp(shut * kShutLog), kLowQ, sample_rate);
    gain_ = kit::db_to_gain(kSmallerDb * shut);
  }
  float gain() const { return gain_; }

  float process(float x) {
    wet_ += wet_step_;
    lift_ += lift_step_;
    const float body = x + wet_ * (low_.lowpass(x) - x);
    return body + lift_ * nasal_.bandpass(body);
  }

 private:
  static constexpr float kShutLog = -2.0368819f;  // log(kShutHz / kOpenHz)
  kit::Svf low_, nasal_;
  float shut_ = 0.0f;
  float wet_ = 0.0f, lift_ = 0.0f, gain_ = 1.0f;
  float wet_step_ = 0.0f, lift_step_ = 0.0f;
};

}  // namespace hand_horn
}  // namespace livemix
