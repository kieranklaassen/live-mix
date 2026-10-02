#pragma once

// The Chords mode: two phase vocoders (PeakShifter.h) that share the work by
// frequency, because a chord needs a long look and an attack a short one.
//
//   ring ────────────────► frames of 43 ms ─► partials above the split ─┐
//   ring ─► low-pass ─► every 4th sample                                (+)─► voice
//             └─► frames of 171 ms ─► partials below the split ─► x4 ───┘
//
// - Notes of a chord lie closer together than a 43 ms window can tell apart
//   below about 700 Hz, and a shifter that cannot tell two partials apart
//   moves them as one, to the wrong places. So everything below the split is
//   shifted from a window four times as long, taken from the same sound at a
//   quarter of the rate (an eighth at 88.2 kHz and above), which costs no
//   more than the short one. The price is time: what is below the split
//   comes out about 190 ms late, what is above it about 48 ms late.
// - Both read the ring `Delay` back like the other modes, so Delay, Feedback
//   and the rest of the device work unchanged.
// - The work is spread: within one hop of the short window come its analysis,
//   voice A, voice B and one step of the long window, a quarter hop apart,
//   so no block of 128 carries more than one transform.

#include "../../kit/kit.h"
#include "PeakShifter.h"
#include "ShiftVoice.h"

namespace livemix {
namespace pitch_shifter_dsp {

class ChordEngine {
 public:
  static constexpr int kLowSize = 2048;
  static constexpr int kMaxHighSize = 4096;
  static constexpr int kTaps = 12;      // of the x4 / x8 interpolator, per phase
  static constexpr int kMaxDown = 8;
  static constexpr float kSplitHz = 718.9f;  // between two notes (F5 and F#5), where few partials sit

  void init(float sample_rate) {
    sample_rate_ = sample_rate;
    large_ = sample_rate > 66000.0f;
    size_ = large_ ? 4096 : 2048;
    hop_ = size_ / 4;
    down_ = large_ ? 8 : 4;
    small_.init();
    big_.init();
    low_.init();
    for (int c = 0; c < 2; ++c) {
      lowpass_[0][c].set(2000.0f, 0.5412f, sample_rate);
      lowpass_[1][c].set(2000.0f, 1.3066f, sample_rate);
    }
    design_interpolator();
    clear_history();
    reset();
  }

  // Everything the mode has heard and made so far is dropped; what the ring
  // and the slow copy of it hold stays.
  void reset() {
    small_.reset();
    big_.reset();
    low_.reset();
    for (int v = 0; v < 2; ++v) {
      for (int c = 0; c < 2; ++c) {
        for (int n = 0; n < 2 * kMaxHighSize; ++n) high_sum_[v][c][n] = 0.0f;
        for (int n = 0; n < 2 * kLowSize; ++n) low_sum_[v][c][n] = 0.0f;
        for (int k = 0; k < kTaps; ++k) held_[v][c][k] = 0.0f;
      }
    }
    step_ = 0;
    high_time_ = 0;
    high_base_ = low_base_ = -1;
  }

  // How long after a sound the part of it above the split comes out, and the
  // part below it, in samples.
  int latency() const { return size_ + hop_ / 2; }
  int low_latency() const { return (kLowSize + kLowWait) * down_ + (kTaps * down_) / 2; }

  // Every sample the ring records, in every mode, so the slow copy is there
  // when the mode is chosen.
  void record(float left, float right) {
    const float l = lowpass_[1][0].lowpass(lowpass_[0][0].lowpass(left));
    const float r = lowpass_[1][1].lowpass(lowpass_[0][1].lowpass(right));
    if (++tick_ >= down_) {
      tick_ = 0;
      slow_[0].write(l);
      slow_[1].write(r);
      ++low_time_;
    }
  }

 private:
  static constexpr int kLowHop = kLowSize / 4;
  static constexpr int kLowWait = kLowHop / 2 + 2;  // low-rate samples until voice B's frame is in

  // A windowed-sinc low-pass at half the reduced rate, laid out by phase;
  // each phase passes steady sound at exactly unity.
  void design_interpolator() {
    const int length = kTaps * down_;
    const double pi = 3.14159265358979323846;
    for (int p = 0; p < down_; ++p) {
      double sum = 0.0;
      double row[kTaps];
      for (int k = 0; k < kTaps; ++k) {
        const int n = p + k * down_;
        const double t = n - 0.5 * (length - 1);
        const double x = pi * t / down_;
        const double sinc = x == 0.0 ? 1.0 : std::sin(x) / x;
        const double w = 2.0 * pi * n / (length - 1);
        row[k] = sinc * (0.42 - 0.5 * std::cos(w) + 0.08 * std::cos(2.0 * w));
        sum += row[k];
      }
      for (int k = 0; k < kTaps; ++k) taps_[p][k] = static_cast<float>(row[k] / sum);
    }
  }

  // How far the new frame lies after the one before, given where each was
  // read; 0 when Delay jumped and the two have nothing to do with each other.
  static int spacing(int hop, int base, int* last) {
    const int advance = *last < 0 ? 0 : hop - (base - *last);
    *last = base;
    return advance >= hop / 2 && advance <= 2 * hop ? advance : 0;
  }

  void clear_history() {
    for (int c = 0; c < 2; ++c) {
      slow_[c].clear();
      lowpass_[0][c].reset();
      lowpass_[1][c].reset();
    }
    tick_ = 0;
    low_time_ = 0;
  }

  float sample_rate_ = 48000.0f;
  bool large_ = false;
  int size_ = 2048, hop_ = 512, down_ = 4;
  PeakShifter<2048> small_;            // above the split, up to 48 kHz
  PeakShifter<kMaxHighSize> big_;      // above the split, from 88.2 kHz
  PeakShifter<kLowSize> low_;          // below the split, at the reduced rate
  kit::Svf lowpass_[2][2];             // [stage][channel], before reducing the rate
  kit::DelayLine<16384> slow_[2];      // the ring again at the reduced rate
  float frame_[2][kMaxHighSize];       // a frame on its way in
  float high_sum_[2][2][2 * kMaxHighSize];  // [voice][channel] overlapped frames, circular
  float low_sum_[2][2][2 * kLowSize];
  float held_[2][2][kTaps];            // newest first, for the interpolator
  float taps_[kMaxDown][kTaps];
  int step_ = 0;                       // position in four hops of the short window
  unsigned high_time_ = 0, high_frame_ = 0;
  unsigned low_time_ = 0, low_frame_ = 0;
  int tick_ = 0;                       // position between two reduced-rate samples
  int high_base_ = -1, low_base_ = -1; // where the last frames were read, to know their spacing
};

}  // namespace pitch_shifter_dsp
}  // namespace livemix
