#pragma once

// The vowels of Vowel Reverb: the formant table, the morph between its
// entries, and the two filter banks built from it (the one that colours the
// reverb's output and the gentler one that sits inside its feedback loop).

#include "../../kit/filters.h"
#include "../../kit/math.h"

namespace livemix {
namespace vowel_dsp {

constexpr int kFormants = 5;
constexpr int kVowels = 5;
constexpr int kVoices = 4;

struct Formants {
  float hz[kFormants];
  float db[kFormants];
  float bandwidth[kFormants];
};

// Centre frequency (Hz), level (dB under the first formant) and bandwidth
// (Hz) of the five formants of the sung vowels a, e, i, o, u, for bass,
// tenor, alto and soprano: the table of the Csound manual's appendix
// "Formant Values" (after the CHANT synthesis work of Rodet, Potard and
// Barrière at IRCAM), which leaves out only its countertenor rows.
inline constexpr Formants kTable[kVoices][kVowels] = {
    {  // bass
        {{600, 1040, 2250, 2450, 2750}, {0, -7, -9, -9, -20}, {60, 70, 110, 120, 130}},
        {{400, 1620, 2400, 2800, 3100}, {0, -12, -9, -12, -18}, {40, 80, 100, 120, 120}},
        {{250, 1750, 2600, 3050, 3340}, {0, -30, -16, -22, -28}, {60, 90, 100, 120, 120}},
        {{400, 750, 2400, 2600, 2900}, {0, -11, -21, -20, -40}, {40, 80, 100, 120, 120}},
        {{350, 600, 2400, 2675, 2950}, {0, -20, -32, -28, -36}, {40, 80, 100, 120, 120}},
    },
    {  // tenor
        {{650, 1080, 2650, 2900, 3250}, {0, -6, -7, -8, -22}, {80, 90, 120, 130, 140}},
        {{400, 1700, 2600, 3200, 3580}, {0, -14, -12, -14, -20}, {70, 80, 100, 120, 120}},
        {{290, 1870, 2800, 3250, 3540}, {0, -15, -18, -20, -30}, {40, 90, 100, 120, 120}},
        {{400, 800, 2600, 2800, 3000}, {0, -10, -12, -12, -26}, {40, 80, 100, 120, 120}},
        {{350, 600, 2700, 2900, 3300}, {0, -20, -17, -14, -26}, {40, 60, 100, 120, 120}},
    },
    {  // alto
        {{800, 1150, 2800, 3500, 4950}, {0, -4, -20, -36, -60}, {80, 90, 120, 130, 140}},
        {{400, 1600, 2700, 3300, 4950}, {0, -24, -30, -35, -60}, {60, 80, 120, 150, 200}},
        {{350, 1700, 2700, 3700, 4950}, {0, -20, -30, -36, -60}, {50, 100, 120, 150, 200}},
        {{450, 800, 2830, 3500, 4950}, {0, -9, -16, -28, -55}, {70, 80, 100, 130, 135}},
        {{325, 700, 2530, 3500, 4950}, {0, -12, -30, -40, -64}, {50, 60, 170, 180, 200}},
    },
    {  // soprano
        {{800, 1150, 2900, 3900, 4950}, {0, -6, -32, -20, -50}, {80, 90, 120, 130, 140}},
        {{350, 2000, 2800, 3600, 4950}, {0, -20, -15, -40, -56}, {60, 100, 120, 150, 200}},
        {{270, 2140, 2950, 3900, 4950}, {0, -12, -26, -26, -44}, {60, 90, 100, 120, 120}},
        {{450, 800, 2830, 3800, 4950}, {0, -11, -22, -22, -50}, {70, 80, 100, 130, 135}},
        {{325, 700, 2700, 3800, 4950}, {0, -16, -35, -40, -60}, {50, 60, 170, 180, 200}},
    },
};

// The formants at `vowel` in [0, 4] (a, e, i, o, u; in between is a mouth on
// its way from one to the next) for `voice` in [0, 1] (bass, tenor, alto and
// soprano a third apart). Frequencies and bandwidths are interpolated in Hz,
// levels in dB.
inline void formants_at(float vowel, float voice, Formants* out) {
  const float v = kit::clamp(vowel, 0.0f, static_cast<float>(kVowels - 1));
  int vi = static_cast<int>(v);
  if (vi > kVowels - 2) vi = kVowels - 2;
  const float vt = v - static_cast<float>(vi);
  const float s = kit::clamp(voice, 0.0f, 1.0f) * static_cast<float>(kVoices - 1);
  int si = static_cast<int>(s);
  if (si > kVoices - 2) si = kVoices - 2;
  const float st = s - static_cast<float>(si);
  const Formants& a = kTable[si][vi];
  const Formants& b = kTable[si][vi + 1];
  const Formants& c = kTable[si + 1][vi];
  const Formants& d = kTable[si + 1][vi + 1];
  for (int k = 0; k < kFormants; ++k) {
    out->hz[k] = kit::lerp(kit::lerp(a.hz[k], b.hz[k], vt), kit::lerp(c.hz[k], d.hz[k], vt), st);
    out->db[k] = kit::lerp(kit::lerp(a.db[k], b.db[k], vt), kit::lerp(c.db[k], d.db[k], vt), st);
    out->bandwidth[k] = kit::lerp(kit::lerp(a.bandwidth[k], b.bandwidth[k], vt),
                                  kit::lerp(c.bandwidth[k], d.bandwidth[k], vt), st);
  }
}

// 10^(dB/20) for levels from 0 down to -72 dB, from a table: the banks ask
// for thirteen of these every time the vowel moves, and std::pow is slow in
// WASM. Linear interpolation between half-decibel steps is within 0.05 %.
class LevelTable {
 public:
  static constexpr int kSize = 144;

  static void init() {
    if (ready()) return;
    float* table = data();
    for (int i = 0; i <= kSize; ++i) {
      table[i] = static_cast<float>(std::pow(10.0, -0.5 * static_cast<double>(i) / 20.0));
    }
    ready() = true;
  }

  static float lookup(float db) {
    const float position = kit::clamp(-2.0f * db, 0.0f, static_cast<float>(kSize) - 0.001f);
    const int index = static_cast<int>(position);
    const float fraction = position - static_cast<float>(index);
    const float* table = data();
    return table[index] + (table[index + 1] - table[index]) * fraction;
  }

 private:
  static float* data() {
    static float table[kSize + 1];
    return table;
  }
  static bool& ready() {
    static bool is_ready = false;
    return is_ready;
  }
};

// A trapezoidal state-variable band-pass (as kit::Svf), split into
// coefficients and state so many channels can share one tuning. Unity gain
// and zero phase at the centre.
struct BandCoeff {
  float g = 0.1f, k = 1.0f, a1 = 0.0f, a2 = 0.0f, a3 = 0.0f;

  void set(float hz, float bandwidth, float sample_rate) {
    hz = kit::clamp(hz, 20.0f, sample_rate * 0.45f);
    g = kit::tan_prewarp(kit::kPi * hz / sample_rate);
    k = kit::clamp(bandwidth / hz, 0.02f, 2.0f);
    a1 = 1.0f / (1.0f + g * (g + k));
    a2 = g * a1;
    a3 = g * a2;
  }

  // The filter's response at the frequency whose warped value is `gf`
  // (tan(pi f / sample rate)): exact for the digital filter.
  void response(float gf, float* re, float* im) const {
    const float x = gf / g;
    const float p = 1.0f - x * x;
    const float q = x * k;
    const float scale = q / (p * p + q * q);
    *re = q * scale;
    *im = p * scale;
  }
};

struct BandState {
  float ic1 = 0.0f, ic2 = 0.0f;

  void reset() { ic1 = ic2 = 0.0f; }
  float process(float x, const BandCoeff& c) {
    const float v3 = x - ic2;
    const float v1 = c.a1 * ic1 + c.a2 * v3;
    const float v2 = ic2 + c.a2 * ic1 + c.a3 * v3;
    ic1 = flush_denormal(2.0f * v1 - ic1);
    ic2 = flush_denormal(2.0f * v2 - ic2);
    return v1 * c.k;
  }
};

// The vowel as it is heard: five band-passes in parallel, one per formant, at
// the table's frequencies, levels and bandwidths. All five add with the same
// sign, so the real part of the sum is never negative and blending it with
// the unfiltered signal cannot dig a notch.
class OutputBank {
 public:
  // The table's narrowest first formants (40 Hz) are a closed throat; a
  // resonance that sharp picks single notes out of a chord and whistles.
  static constexpr float kMinBandwidth = 70.0f;
  static constexpr float kReferenceHz = 400.0f;
  // The table's levels are those of the formants in a sung voice, so they
  // include the fall of the voice's own source towards the highs. What goes
  // through a reverb has a falling spectrum of its own; with the full
  // figures the upper formants, which tell the vowels apart, would be
  // counted down twice. This share of each level (in dB) is used.
  static constexpr float kLevelScale = 0.7f;

  void reset() {
    for (int k = 0; k < kFormants; ++k) {
      state_[k].reset();
      gain_[k] = 0.0f;
      step_[k] = 0.0f;
    }
    remaining_ = 0;
    tuned_ = false;
    power_ = 1.0f;
  }

  // Retune (on the control clock). Bandwidths are the table's times `widen`.
  // The levels ramp over the `period` samples to the next call.
  void set(const Formants& formants, float widen, float sample_rate, int period) {
    float power = 0.0f;
    for (int k = 0; k < kFormants; ++k) {
      const float bandwidth = kit::max(formants.bandwidth[k] * widen, kMinBandwidth);
      coeff_[k].set(formants.hz[k], bandwidth, sample_rate);
      const float level = LevelTable::lookup(formants.db[k] * kLevelScale);
      // What music comes out with, roughly: level² times the band's width
      // in octaves (a resonator of width B passes a band pi/2·B wide), for
      // an input that falls 3 dB per octave faster than pink noise.
      power += level * level * kit::kHalfPi * bandwidth * kReferenceHz / (formants.hz[k] * formants.hz[k]);
      if (tuned_) {
        step_[k] = (level - gain_[k]) / static_cast<float>(period);
      } else {
        gain_[k] = level;
        step_[k] = 0.0f;
      }
    }
    power_ = power;
    remaining_ = tuned_ ? period : 0;
    tuned_ = true;
  }

  // The power of that input through the bank (arbitrary unit).
  float pink_power() const { return power_; }

  float process(float x) {
    if (remaining_ > 0) {
      --remaining_;
      for (int k = 0; k < kFormants; ++k) gain_[k] += step_[k];
    }
    float sum = 0.0f;
    for (int k = 0; k < kFormants; ++k) sum += gain_[k] * state_[k].process(x, coeff_[k]);
    return sum;
  }

 private:
  BandCoeff coeff_[kFormants];
  BandState state_[kFormants];
  float gain_[kFormants] = {};
  float step_[kFormants] = {};
  float power_ = 1.0f;
  int remaining_ = 0;
  bool tuned_ = false;
};

// The vowel as the room remembers it: the first three formants as broad
// band-passes, for use inside a feedback loop as
//
//   y = x + amount · (bank(x) - x),   0 <= amount <= 1.
//
// Its gain is at most 1 at every frequency and exactly the wanted height at
// each formant, so the loop decays slowest there and can never grow:
// - the bands are wide (at least three times the table's width, and a Q of 4
//   at most). A loop multiplies its filter by itself on every pass, so a
//   narrow one would whittle the tail down to a whistle on each formant.
// - the weights are solved so that the summed response (magnitude, with the
//   neighbours' skirts and phases counted) is level^0.05 at each centre: the
//   first formant rings for the whole decay, weaker ones for a little less.
// - then the whole bank is scaled so its largest magnitude, searched over a
//   grid around and between the centres, is under 1. The real part of the
//   sum is never negative, so the blend with x is at least 1 - amount: the
//   valleys have a floor and decay at a known rate.
template <int Lines>
class LoopBank {
 public:
  static constexpr int kBands = 3;
  static constexpr float kWiden = 3.0f;
  static constexpr float kMaxQ = 4.0f;
  static constexpr float kLevelPower = 0.05f;
  static constexpr float kCeiling = 0.997f;

  void reset() {
    for (int n = 0; n < Lines; ++n) {
      for (int k = 0; k < kBands; ++k) state_[n][k].reset();
    }
    for (int k = 0; k < kBands; ++k) {
      weight_[k] = 0.0f;
      target_[k] = 0.0f;
      step_[k] = 0.0f;
    }
    remaining_ = 0;
    points_ = 0;
    tuned_ = false;
  }

  void set(const Formants& formants, float sample_rate, int period) {
    float wanted[kBands];
    for (int k = 0; k < kBands; ++k) {
      const float bandwidth =
          kit::max(formants.bandwidth[k] * kWiden, formants.hz[k] * (1.0f / kMaxQ));
      coeff_[k].set(formants.hz[k], bandwidth, sample_rate);
      wanted[k] = LevelTable::lookup(formants.db[k] * kLevelPower);
      target_[k] = wanted[k];
    }
    // Each band's weight is corrected by what the sum reads at its centre;
    // three rounds settle to a fraction of a percent.
    for (int round = 0; round < 3; ++round) {
      for (int j = 0; j < kBands; ++j) {
        const float magnitude = evaluate(target_, coeff_[j].g);
        target_[j] *= wanted[j] / kit::max(magnitude, 1.0e-6f);
      }
    }
    // The highest point of the sum sits a little to one side of a centre
    // (the neighbours' skirts lean on it) or between two close ones: sample
    // it around each centre and between neighbours, and add the top of the
    // parabola through the best point of each centre and the two beside it.
    points_ = 0;
    for (int j = 0; j < kBands; ++j) {
      const float g = coeff_[j].g;
      const float k = coeff_[j].k;
      static constexpr int kAround = 13;
      static constexpr float kOffsets[kAround] = {-0.36f, -0.24f, -0.16f, -0.10f, -0.06f, -0.03f, 0.0f,
                                                  0.03f,  0.06f,  0.10f,  0.16f,  0.24f,  0.36f};
      const int first = points_;
      int best = first;
      for (int i = 0; i < kAround; ++i) {
        sample(g * (1.0f + kOffsets[i] * k));
        if (square_[points_ - 1] > square_[best]) best = points_ - 1;
      }
      if (best > first && best < points_ - 1) {
        // Unevenly spaced points: Lagrange's parabola, at its vertex.
        const float x0 = kOffsets[best - first - 1], x1 = kOffsets[best - first], x2 = kOffsets[best - first + 1];
        const float d0 = square_[best - 1] / ((x0 - x1) * (x0 - x2));
        const float d1 = square_[best] / ((x1 - x0) * (x1 - x2));
        const float d2 = square_[best + 1] / ((x2 - x0) * (x2 - x1));
        const float a = d0 + d1 + d2;
        const float b = -(d0 * (x1 + x2) + d1 * (x0 + x2) + d2 * (x0 + x1));
        if (a < -1.0e-9f) sample(g * (1.0f + kit::clamp(-0.5f * b / a, x0, x2) * k));
      }
      if (j + 1 < kBands) {
        const float middle = std::sqrt(g * coeff_[j + 1].g);
        sample(middle);
        sample(std::sqrt(g * middle));
        sample(std::sqrt(middle * coeff_[j + 1].g));
      }
    }
    float highest = 0.0f;
    for (int i = 0; i < points_; ++i) highest = kit::max(highest, square_[i]);
    highest = std::sqrt(highest);
    const float scale = kCeiling / kit::max(highest, 1.0f);
    for (int i = 0; i < points_; ++i) {
      real_[i] *= scale;
      square_[i] *= scale * scale;
    }
    for (int k = 0; k < kBands; ++k) {
      target_[k] *= scale;
      if (tuned_) {
        step_[k] = (target_[k] - weight_[k]) / static_cast<float>(period);
      } else {
        weight_[k] = target_[k];
        step_[k] = 0.0f;
      }
    }
    remaining_ = tuned_ ? period : 0;
    tuned_ = true;
  }

  // Once per sample, before the lines are processed.
  void tick() {
    if (remaining_ > 0) {
      --remaining_;
      for (int k = 0; k < kBands; ++k) weight_[k] += step_[k];
    }
  }

  float process(int line, float x) {
    float sum = 0.0f;
    for (int k = 0; k < kBands; ++k) sum += weight_[k] * state_[line][k].process(x, coeff_[k]);
    return sum;
  }

  // The largest gain of x + amount · (bank(x) - x) over frequency, as last
  // tuned: what the loop has to be divided by for its slowest-decaying
  // frequency to decay at exactly the wanted rate. (At that frequency the
  // bank's phase is not quite zero, so this is a little under the ceiling.)
  float peak_gain(float amount) const {
    const float through = 1.0f - amount;
    float highest = through * through;
    for (int i = 0; i < points_; ++i) {
      highest = kit::max(highest, through * through + 2.0f * amount * through * real_[i] +
                                      amount * amount * square_[i]);
    }
    return std::sqrt(highest);
  }

  // Magnitude of the bank at `hz` as last tuned (for the harness).
  float magnitude(float hz, float sample_rate) const {
    return evaluate(target_, kit::tan_prewarp(kit::kPi * hz / sample_rate));
  }

 private:
  void respond(const float* weights, float gf, float* re, float* im) const {
    *re = 0.0f;
    *im = 0.0f;
    for (int k = 0; k < kBands; ++k) {
      float r, i;
      coeff_[k].response(gf, &r, &i);
      *re += weights[k] * r;
      *im += weights[k] * i;
    }
  }

  float evaluate(const float* weights, float gf) const {
    float re, im;
    respond(weights, gf, &re, &im);
    return std::sqrt(re * re + im * im);
  }

  // Keep the bank's response at `gf` among the points peak_gain looks at.
  void sample(float gf) {
    float re, im;
    respond(target_, gf, &re, &im);
    real_[points_] = re;
    square_[points_] = re * re + im * im;
    ++points_;
  }

  static constexpr int kMaxPoints = kBands * 17;
  float real_[kMaxPoints] = {};
  float square_[kMaxPoints] = {};
  int points_ = 0;
  BandCoeff coeff_[kBands];
  BandState state_[Lines][kBands];
  float weight_[kBands] = {};
  float target_[kBands] = {};
  float step_[kBands] = {};
  int remaining_ = 0;
  bool tuned_ = false;
};

}  // namespace vowel_dsp
}  // namespace livemix
