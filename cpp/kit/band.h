#pragma once

// A three-way split of one channel into low, band and high whose parts add
// up to flat level, for an effect that works on the middle of a sound and
// leaves the rest alone. Not part of kit.h: a device that needs it includes
// this beside the kit.
//
//   #include "../../kit/kit.h"
//   #include "../../kit/band.h"
//
//   kit::ThreeBand split_[2];                // one a channel
//
//   // init:        split_[c].set(low_hz, high_hz, sample_rate());  split_[c].reset();
//   // a control:   split_[c].set(low_hz, high_hz, sample_rate());  // any time; clears nothing
//   // each sample:
//   const kit::Bands parts = split_[c].process(in[c]);
//   out[c] = parts.low + work_on(parts.band) + parts.high;
//
// With the band untouched, out is the input at its own level at every
// frequency, turned in phase: an all-pass of the input, not the input. So an
// effect built on it has no dry path beside it (mixing the true input back
// would notch at the crossovers); "off" is the three parts summed.
//
// It guards nothing: a sample that is not a number stays in its state. An
// effect guards its input before the split and calls reset() if one got by.
//
// After the input stops the parts are under 1e-9 within half a second, far
// under the idle gate's floor, and no state is ever a denormal. Exact zero
// can take longer: the kit's Svf flushes its two states one at a time, and
// at a crossover of 60 Hz the second can hold a last 1e-13 for some seconds
// (4.3 s is the longest the test sees at 48 kHz; twice that at 96 kHz). A
// device goes idle on kit::IdleGate as usual.

#include "filters.h"
#include "math.h"

namespace livemix {
namespace kit {

struct Bands {
  float low;
  float band;
  float high;
};

// Two crossovers, at `low_hz` and `high_hz`. Each is a fourth-order pair: a
// low pass and a high pass that are each two second-order sections of Q
// 0.7071 in series, so at the crossover both are 6 dB down and in phase,
// they fall away at 24 dB an octave, and their sum is flat in level with the
// phase of one second-order all-pass.
//
//   in --+-- low pass 4 at low_hz ------ all-pass 2 at high_hz ----> low
//        +-- high pass 4 at low_hz --+-- low pass 4 at high_hz ----> band
//                                    +-- high pass 4 at high_hz ---> high
//
// The low part skips the upper crossover, so it is passed through the
// all-pass that the upper pair sums to. That keeps all three in phase with
// their neighbours at every frequency, and low + band + high flat within
// 0.001 dB from 20 Hz to 20 kHz (cpp/test/band_test.cpp, at 44.1, 48 and
// 96 kHz).
//
// The sections are the kit's Svf, which keeps its accuracy at 60 Hz and
// 96 kHz where a plain biquad in float does not, flushes its own denormals
// and can be retuned at any sample: smooth Low and High in the device and
// call set() as they move. Coefficients come from the sample rate, so the
// crossovers are the same in hertz at any rate.
//
// The edges are held in range: low_hz from kLeastHz up, high_hz at least
// half an octave over it (kMargin; at that least width the band's centre
// still passes at -7 dB), and both under 0.45 of the sample rate. low_hz()
// and high_hz() say where they ended up.
//
// Seven Svf a channel: about 0.5 % of real time for two channels at 48 kHz,
// natively.
class ThreeBand {
 public:
  static constexpr float kLeastHz = 20.0f;
  static constexpr float kMargin = 1.41421356f;
  static constexpr float kMostOfRate = 0.45f;

  // Tunes both crossovers. Clears nothing.
  void set(float low_hz, float high_hz, float sample_rate) {
    const float rate = (sample_rate > 1000.0f && sample_rate < 1.0e7f) ? sample_rate : 48000.0f;
    const float top = kMostOfRate * rate;
    const float low_most = top * (1.0f / kMargin);
    low_hz_ = low_hz > kLeastHz ? (low_hz < low_most ? low_hz : low_most) : kLeastHz;
    const float high_least = low_hz_ * kMargin;
    high_hz_ = high_hz > high_least ? (high_hz < top ? high_hz : top) : high_least;
    // One section worked out for each crossover; the rest are copies.
    low_split_.set(low_hz_, kSqrtHalf, rate);
    tune(&low_again_, low_split_);
    tune(&high_of_low_, low_split_);
    high_split_.set(high_hz_, kSqrtHalf, rate);
    tune(&band_again_, high_split_);
    tune(&high_again_, high_split_);
    tune(&low_turn_, high_split_);
  }

  void reset() {
    low_split_.reset();
    low_again_.reset();
    high_of_low_.reset();
    high_split_.reset();
    band_again_.reset();
    high_again_.reset();
    low_turn_.reset();
  }

  Bands process(float x) {
    // The lower crossover: one section gives both halves of the first
    // stage, a second section each finishes them.
    low_split_.process(x);
    const float low = low_again_.lowpass(low_split_.low);
    const float rest = high_of_low_.highpass(low_split_.high);
    // The upper crossover, on what the lower one passed up.
    high_split_.process(rest);
    const float band = band_again_.lowpass(high_split_.low);
    const float high = high_again_.highpass(high_split_.high);
    // The low part through the upper pair's all-pass: low - k·band + high of
    // one section, which is its input less twice k·band.
    low_turn_.process(low);
    const float turned = low - 2.0f * low_turn_.k * low_turn_.band;
    return {turned, band, high};
  }

  float low_hz() const { return low_hz_; }
  float high_hz() const { return high_hz_; }

 private:
  // The coefficients of `from`, with the state left as it is.
  static void tune(Svf* section, const Svf& from) {
    section->g = from.g;
    section->k = from.k;
    section->a1 = from.a1;
    section->a2 = from.a2;
    section->a3 = from.a3;
  }

  Svf low_split_;    // lower crossover, first stage: both halves
  Svf low_again_;    // its low pass, second stage
  Svf high_of_low_;  // its high pass, second stage
  Svf high_split_;   // upper crossover, first stage
  Svf band_again_;   // its low pass, second stage: the band
  Svf high_again_;   // its high pass, second stage: the high part
  Svf low_turn_;     // the all-pass the low part takes in place of the upper crossover
  float low_hz_ = 150.0f;
  float high_hz_ = 1000.0f;
};

}  // namespace kit
}  // namespace livemix
