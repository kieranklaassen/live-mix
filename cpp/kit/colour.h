#pragma once

// Noise for the beat and breath devices: a generator whose streams are
// independent of one another, and a filter that colours white noise from
// white through pink to brown at one level, the same in hertz at every
// sample rate. Not part of kit.h: a device that needs them includes this
// beside the kit.
//
//   #include "../../kit/kit.h"
//   #include "../../kit/colour.h"
//
//   kit::StreamRng rng_[2];                  // one stream a channel
//   kit::ColourFilter colour_[2];            // one filter a channel
//
//   // init:  rng_[c].seed(kSeed + c);  colour_[c].init(sample_rate());
//   //        colour_[c].set_colour(param(kColour));
//   // a control, or every 32 samples while Colour is smoothed:
//   //        colour_[c].set_colour(colour);
//   // each sample:
//   const float noise = colour_[c].process(rng_[c].bipolar());   // RMS kColourRms
//
// Seed in init, with fixed seeds, so two init calls give the same render.
// Two channels made this way are unlike noises: at full Width they are side
// equal to mid, and the Ears law of beat.h (kit::ear_gains) narrows them.
//
// White noise a device filters itself (a band at a key, say) is one value a
// sample, so its level in each hertz falls by 3 dB when the sample rate
// doubles. Scale it by white_gain(sample_rate) first. ColourFilter needs no
// such scaling: its level is set for the rate it was given.

#include <cmath>
#include <cstdint>

#include "math.h"

namespace livemix {
namespace kit {

// --- the generator -----------------------------------------------------------------------------

// splitmix64, the seeding function published beside the generator below: a
// 64-bit counter put through two multiplies and three shifts. Each call
// moves `state` on and returns the next value.
inline uint64_t splitmix64(uint64_t* state) {
  uint64_t z = (*state += 0x9E3779B97F4A7C15ull);
  z = (z ^ (z >> 30)) * 0xBF58476D1CE4E5B9ull;
  z = (z ^ (z >> 27)) * 0x94D049BB133111EBull;
  return z ^ (z >> 31);
}

// xoroshiro128+ (the published generator of that name, with its 2018
// constants 24, 16 and 37): 128 bits of state, one sequence of 2^128 - 1
// values. kit::Rng is xorshift32, one sequence of 2^32 - 1: two of those are
// the same noise at two places, so one ear can be a late copy of the other.
// Here a seed is put through splitmix64 twice to make the state, so seeds 1
// and 2 start at unrelated places on a sequence no render comes to the end
// of, and two streams have nothing in common (cpp/test/colour_test.cpp reads
// under 0.02 between them at every lag to 128 samples over ten seconds).
// Never allocates; deterministic per seed.
struct StreamRng {
  // What seed(0) leaves, so one that was never seeded still makes noise.
  uint64_t s0 = 0xE220A8397B1DCDAFull;
  uint64_t s1 = 0x6E789E6AA1B965F4ull;

  // Any value will do, 0 too; give each stream of a device its own.
  void seed(uint64_t stream) {
    uint64_t state = stream;
    s0 = splitmix64(&state);
    s1 = splitmix64(&state);
    if ((s0 | s1) == 0) s0 = 1;  // the one state the generator cannot leave
  }

  uint64_t next_u64() {
    const uint64_t a = s0;
    uint64_t b = s1;
    const uint64_t result = a + b;
    b ^= a;
    s0 = rotl(a, 24) ^ b ^ (b << 16);
    s1 = rotl(b, 37);
    return result;
  }

  // Uniform in [0, 1), from the top 24 bits, which are the generator's best.
  float uniform() { return static_cast<float>(next_u64() >> 40) * (1.0f / 16777216.0f); }
  // White noise: uniform in [-1, 1), RMS 0.577.
  float bipolar() { return uniform() * 2.0f - 1.0f; }

 private:
  static uint64_t rotl(uint64_t x, int k) { return (x << k) | (x >> (64 - k)); }
};

// What white noise is scaled by so that its level in each hertz does not
// fall with the sample rate: the root of the rate over 48 kHz.
inline float white_gain(float sample_rate) {
  return (sample_rate > 0.0f) ? std::sqrt(sample_rate * (1.0f / 48000.0f)) : 1.0f;
}

// --- the colour filter -------------------------------------------------------------------------

// The RMS of what ColourFilter gives for white noise from StreamRng, at
// every Colour and every sample rate: -14 dBFS. Its peaks stand about 12 dB
// over that in ten seconds (the largest seen in the test is 0.9); a rare one
// goes further, which is the device's soft clip's to hold.
constexpr float kColourRms = 0.2f;

// White noise in, coloured noise out. Colour 0 is white (flat), 0.5 pink
// (-3 dB an octave), 1 brown (-6 dB an octave), and every slope between: the
// level falls by 6 dB times Colour an octave from 20 Hz to 20 kHz, within
// 0.2 dB an octave from 100 Hz to 8 kHz at 44.1, 48 and 96 kHz.
//
// How. Seven first-order sections in series, each a pole and a zero. The
// poles stand two to a decade from 20 Hz to 20 kHz (20, 63, 200, 632 Hz,
// 2, 6.3 and 20 kHz) and never move. Each zero stands above its pole by the
// spacing (the root of ten) to the power Colour: at 0 it is on its pole and
// the section passes its input untouched, at 1 it is on the next pole and
// the seven are one pole at 20 Hz. Poles and zeros are placed in hertz and
// mapped with the bilinear transform's own warping, so the response is the
// same in hertz at any rate. After them come a second-order high pass at
// 20 Hz, so brown has no offset and nothing below hearing, and a
// second-order low pass at 20 kHz, so the band is the same at every rate
// and the RMS does not grow with it.
//
// Level. The output is scaled so that its RMS is kColourRms. The scale is
// worked out in init, not measured: the filter's gain is written out from
// its poles, zeros and the two end filters, squared and summed over 256
// frequencies from 1 Hz to half the rate, for 17 Colours a sixteenth apart;
// set_colour reads between them. The result is within 0.04 dB of what the
// filter's own impulse response gives, at every Colour and from 22.05 to
// 192 kHz (cpp/test/colour_test.cpp). Because the band is fixed in hertz,
// one RMS at every rate is also one level in each hertz: no further scaling
// by the rate.
//
// Moving Colour only moves the zeros and the scale; the state belongs to the
// poles, so set_colour is safe at any moment. Smooth Colour in the device
// and call it every 32 samples or so while it moves (it costs one exp and
// seven divides). All state is double and flushed to zero when it falls
// under 1e-20, so silence in gives exact silence out within a second, with
// nothing left inside and no denormal to slow WASM down. (The two end
// filters are the kit's Svf written again in double with one flush for both
// of a section's states. Svf flushes each alone, and at 20 Hz the second can
// then hold a last 1e-13 for half a minute.)
class ColourFilter {
 public:
  static constexpr int kSections = 7;
  static constexpr float kLowHz = 20.0f;
  static constexpr float kHighHz = 20000.0f;

  // Works out the poles and the level table for `sample_rate`, clears the
  // state and sets Colour to 0 (white). About 20 µs natively.
  void init(float sample_rate) {
    rate_ = (sample_rate > 1000.0f && sample_rate < 1.0e7f) ? static_cast<double>(sample_rate) : 48000.0;
    spacing_log_ = std::log(static_cast<double>(kHighHz) / kLowHz) / (kSections - 1);
    for (int i = 0; i < kSections; ++i) {
      const double hz = static_cast<double>(kLowHz) * std::exp(spacing_log_ * i);
      // A pole past 0.49 of the rate is held there (rates under 41 kHz).
      warped_[i] = std::tan(kPiD * (hz < 0.49 * rate_ ? hz : 0.49 * rate_) / rate_);
      pole_[i] = (1.0 - warped_[i]) / (1.0 + warped_[i]);
    }
    high_pass_.set(kLowHz, rate_);
    low_pass_.set(kHighHz, rate_);
    build_level_table();
    reset();
    set_colour(0.0f);
  }

  // Clears the state; the Colour stays.
  void reset() {
    for (double& state : state_) state = 0.0;
    high_pass_.reset();
    low_pass_.reset();
  }

  // 0 white, 0.5 pink, 1 brown; held to 0..1.
  void set_colour(float colour) {
    colour_ = colour > 0.0f ? (colour < 1.0f ? colour : 1.0f) : 0.0f;
    double zero[kSections];
    zeros_for(colour_, zero);
    for (int i = 0; i < kSections; ++i) lift_[i] = pole_[i] - zero[i];
    const float place = colour_ * (kLevels - 1);
    const int index = place < static_cast<float>(kLevels - 2) ? static_cast<int>(place) : kLevels - 2;
    const float between = place - static_cast<float>(index);
    gain_ = std::exp(level_log_[index] + (level_log_[index + 1] - level_log_[index]) * between);
  }

  float colour() const { return colour_; }

  // True when nothing is left inside: every state is exactly zero, as after
  // reset() and within a second of silence at the input.
  bool at_rest() const {
    for (double state : state_) {
      if (state != 0.0) return false;
    }
    return high_pass_.ic1 == 0.0 && high_pass_.ic2 == 0.0 && low_pass_.ic1 == 0.0 && low_pass_.ic2 == 0.0;
  }

  // One sample of white noise in (StreamRng::bipolar), one of coloured out.
  float process(float white) {
    double x = white;
    for (int i = 0; i < kSections; ++i) {
      // (1 - zero/z) / (1 - pole/z) with the pole's state alone:
      // w = x + pole·w', y = w - zero·w' = x + (pole - zero)·w'.
      const double held = state_[i];
      const double next = x + pole_[i] * held;
      x += lift_[i] * held;
      state_[i] = (next > -kTiny && next < kTiny) ? 0.0 : next;
    }
    double low, high;
    high_pass_.tick(x, &low, &high);
    low_pass_.tick(high, &low, &high);
    return gain_ * static_cast<float>(low);
  }

 private:
  static constexpr int kLevels = 17;
  static constexpr int kGrid = 256;
  static constexpr double kTiny = 1.0e-20;
  static constexpr double kPiD = 3.14159265358979323846;

  // A second-order section of Q 0.7071 (the trapezoidal state-variable form
  // of kit::Svf), in double. Both states are flushed together, once the
  // whole of its ringing is under kTiny.
  struct End {
    double g = 0.1, k = 1.41421356237309505, a1 = 0.0, a2 = 0.0, a3 = 0.0;
    double ic1 = 0.0, ic2 = 0.0;

    void set(double hz, double rate) {
      g = std::tan(kPiD * (hz < 0.49 * rate ? hz : 0.49 * rate) / rate);
      a1 = 1.0 / (1.0 + g * (g + k));
      a2 = g * a1;
      a3 = g * a2;
    }
    void reset() {
      ic1 = 0.0;
      ic2 = 0.0;
    }
    void tick(double x, double* low, double* high) {
      const double v3 = x - ic2;
      const double v1 = a1 * ic1 + a2 * v3;
      const double v2 = ic2 + a2 * ic1 + a3 * v3;
      ic1 = 2.0 * v1 - ic1;
      ic2 = 2.0 * v2 - ic2;
      if (ic1 > -kTiny && ic1 < kTiny && ic2 > -kTiny && ic2 < kTiny) {
        ic1 = 0.0;
        ic2 = 0.0;
      }
      *low = v2;
      *high = x - k * v1 - v2;
    }
  };

  // The zeros for a Colour: each pole's warped frequency times the spacing
  // to the power Colour, mapped back.
  void zeros_for(float colour, double* zero) const {
    const double ratio = std::exp(spacing_log_ * static_cast<double>(colour));
    for (int i = 0; i < kSections; ++i) {
      const double warped = warped_[i] * ratio;
      zero[i] = (1.0 - warped) / (1.0 + warped);
    }
  }

  // The scale for each of kLevels Colours, as its logarithm: kColourRms over
  // the RMS that white noise of RMS 1/√3 would leave with. That RMS squared
  // is a third of the mean of the gain squared over all frequencies up to
  // half the rate; the frequencies are spaced by ratio, so each stands for a
  // band as wide as itself.
  void build_level_table() {
    double cosine[kGrid], fixed[kGrid];
    const double lowest = 2.0 * kPiD * 1.0 / rate_;
    const double log_step = std::log(kPiD / lowest) / kGrid;
    const double hp_g = high_pass_.g, hp_k = high_pass_.k, lp_g = low_pass_.g, lp_k = low_pass_.k;
    for (int n = 0; n < kGrid; ++n) {
      // The middle of band n, in radians a sample.
      const double w = lowest * std::exp(log_step * (n + 0.5));
      cosine[n] = std::cos(w);
      const double t = std::tan(0.5 * w);
      // The two end filters: second-order sections at x = t / g.
      const double hx = t / hp_g, lx = t / lp_g;
      const double high = hx * hx * hx * hx / ((1.0 - hx * hx) * (1.0 - hx * hx) + hp_k * hp_k * hx * hx);
      const double low = 1.0 / ((1.0 - lx * lx) * (1.0 - lx * lx) + lp_k * lp_k * lx * lx);
      double poles = 1.0;
      for (int i = 0; i < kSections; ++i) poles *= 1.0 - 2.0 * pole_[i] * cosine[n] + pole_[i] * pole_[i];
      fixed[n] = w * high * low / poles;
    }
    for (int level = 0; level < kLevels; ++level) {
      double zero[kSections];
      zeros_for(static_cast<float>(level) / (kLevels - 1), zero);
      double sum = 0.0;
      for (int n = 0; n < kGrid; ++n) {
        double zeros = 1.0;
        for (int i = 0; i < kSections; ++i) zeros *= 1.0 - 2.0 * zero[i] * cosine[n] + zero[i] * zero[i];
        sum += fixed[n] * zeros;
      }
      const double mean_square = sum * log_step / kPiD / 3.0;
      level_log_[level] = static_cast<float>(std::log(static_cast<double>(kColourRms)) - 0.5 * std::log(mean_square));
    }
  }

  double rate_ = 48000.0;
  double spacing_log_ = 0.0;       // ln of the ratio between one pole and the next
  double warped_[kSections] = {};  // tan(π · pole frequency / rate)
  double pole_[kSections] = {};
  double lift_[kSections] = {};    // pole - zero
  double state_[kSections] = {};
  End high_pass_;
  End low_pass_;
  float level_log_[kLevels] = {};  // ln of the scale at each sixteenth of Colour
  float gain_ = 1.0f;
  float colour_ = 0.0f;
};

}  // namespace kit
}  // namespace livemix
