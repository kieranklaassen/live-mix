#pragma once

// The Chords mode: two phase vocoders (PeakShifter.h) that share the work by
// frequency, because a chord needs a long look and an attack a short one.
//
//   ring ─► 145 ms back ─► frames of 43 ms ─► partials above the split ─┐
//   ring ─► low-pass ─► every 4th sample                                (+)─► voice
//             └─► frames of 171 ms ─► partials below the split ─► x4 ───┘
//
// - Partials a semitone apart (the notes of a close chord, and their
//   overtones against each other) lie closer than a 43 ms window can tell
//   apart below about 1.3 kHz, and a shifter that cannot tell two partials
//   apart moves them as one, to the wrong places. So everything below the split is
//   shifted from a window four times as long, taken from the same sound at a
//   quarter of the rate (an eighth at 88.2 kHz and above), which costs no
//   more than the short one. The price is time: the mode answers about
//   190 ms late. The short window could answer in 48 ms, but a note's body
//   would then follow its overtones like a second attack, so it is read
//   late enough for the two to arrive together.
// - Both read the ring `Delay` back like the other modes, so Delay, Feedback
//   and the rest of the device work unchanged.
// - The work is spread: within one hop of the short window come its analysis,
//   voice A, voice B and one step of the long window, a quarter hop apart,
//   so no block of 128 carries more than one transform. At 88.2 kHz and
//   above, where the short window is 4096 points, each of those is cut in
//   two again (see spread), so no block carries more than half of one.

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
  static constexpr float kSplitHz = 1357.0f;  // between two notes (E6 and F6), where few partials sit
  static constexpr float kLowTopHz = 3000.0f; // the highest the reduced rate carries cleanly

  void init(float sample_rate) {
    sample_rate_ = sample_rate;
    large_ = sample_rate > 66000.0f;
    size_ = large_ ? 4096 : 2048;
    hop_ = size_ / 4;
    // How long after its frame was taken a voice's output is first read:
    // by then the frame must be added in (see render and spread).
    margin_ = large_ ? 3 * hop_ / 4 : hop_ / 2;
    down_ = large_ ? 8 : 4;
    small_.init();
    big_.init();
    low_.init();
    for (int c = 0; c < 2; ++c) {
      lowpass_[0][c].set(2400.0f, 0.5412f, sample_rate);
      lowpass_[1][c].set(2400.0f, 1.3066f, sample_rate);
    }
    design_interpolator();
    reset();
  }

  // A fresh start, for when the mode is chosen. The slow copy of the ring
  // starts empty too, so what is below the split is whole only once
  // latency() and the Delay have gone by.
  void reset() {
    for (int c = 0; c < 2; ++c) {
      slow_[c].clear();
      lowpass_[0][c].reset();
      lowpass_[1][c].reset();
    }
    tick_ = 0;
    low_time_ = 0;
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
    spread_advance_ = 0;
    high_time_ = 0;
    high_base_ = low_base_ = -1;
  }

  // How long after a sound its shifted copy comes out, in samples: the long
  // window, the wait for its second voice, the interpolator and the low-pass
  // before it. The short window is read that much later to arrive with it.
  int latency() const {
    return (kLowSize + kLowWait) * down_ + (kTaps * down_) / 2 + static_cast<int>(0.00017f * sample_rate_);
  }

  // One sample of each voice (`out[voice][channel]`), read `base` samples
  // back in the ring; call before the ring and record() take the sample.
  void render(const Ring& ring, double base, const float* ratio, bool second, float (*out)[2]) {
    const int phase = step_ & (hop_ - 1);
    if (large_) {
      if ((phase & (hop_ / 8 - 1)) == 0) spread(phase / (hop_ / 8), ring, base, ratio, second);
    } else if (phase == 0) {
      hear(small_, ring, base);
    } else if (phase == hop_ / 4 || (phase == hop_ / 2 && second)) {
      const int v = phase == hop_ / 4 ? 0 : 1;
      voice_high(small_, v, ratio[v]);
    } else if (phase == 3 * hop_ / 4) {
      low_step(base, ratio, second);
    }
    step_ = (step_ + 1) & (4 * hop_ - 1);

    const unsigned at = (high_time_ - static_cast<unsigned>(size_ + margin_)) & kHighMask;
    const unsigned low_at = (low_time_ - static_cast<unsigned>(kLowSize + kLowWait)) & kLowMask;
    const float* taps = taps_[tick_];
    for (int v = 0; v < 2; ++v) {
      for (int c = 0; c < 2; ++c) {
        float* held = held_[v][c];
        if (tick_ == 0) {  // a new reduced-rate sample is due
          for (int k = kTaps - 1; k > 0; --k) held[k] = held[k - 1];
          held[0] = low_sum_[v][c][low_at];
          low_sum_[v][c][low_at] = 0.0f;
        }
        float sum = high_sum_[v][c][at];
        high_sum_[v][c][at] = 0.0f;
        if (v == 0 || second) {
          for (int k = 0; k < kTaps; ++k) sum += taps[k] * held[k];
        }
        out[v][c] = sum;
      }
    }
    ++high_time_;
  }

  // Every sample the ring records while the mode is on.
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

  // The short window: a frame off the ring, and a voice's shifted frame
  // added to its running sum.
  template <class Shifter>
  void hear(Shifter& shifter, const Ring& ring, double base) {
    const int size = Shifter::kSize;
    shifter.analyse(frame_[0], frame_[1], fetch(ring, base, size));
  }

  // A frame of the short window off the ring; returns its spacing from the last.
  int fetch(const Ring& ring, double base, int size) {
    const int back = static_cast<int>(base + 0.5) + latency() - (size_ + margin_);
    for (int n = 0; n < size; ++n) {
      frame_[0][n] = ring.left.read(back + size - n);
      frame_[1][n] = ring.right.read(back + size - n);
    }
    high_frame_ = high_time_;
    return spacing(size / 4, back, &high_base_);
  }

  template <class Shifter>
  void voice_high(Shifter& shifter, int v, float ratio) {
    shifter.synthesise(v, ratio, kit::kTwoPi * split(ratio) / sample_rate_, 4.0f);
    add_high(shifter, v);
  }

  template <class Shifter>
  void add_high(const Shifter& shifter, int v) {
    const int size = Shifter::kSize;
    const float* left = shifter.frame_left();
    const float* right = shifter.frame_right();
    const unsigned from = high_frame_ - static_cast<unsigned>(size);
    for (int n = 0; n < size; ++n) {
      const unsigned at = (from + static_cast<unsigned>(n)) & kHighMask;
      high_sum_[v][0][at] += left[n];
      high_sum_[v][1][at] += right[n];
    }
  }

  // The hop's work at 88.2 kHz and above, where a frame is 4096 points and
  // one transform of it alone would be most of what a block of 128 frames
  // may cost: eight pieces an eighth of a hop (128 samples) apart, each
  // about the same amount of work, the transforms cut in two.
  void spread(int piece, const Ring& ring, double base, const float* ratio, bool second) {
    const int all = 12;      // passes of a 4096-point transform
    const float from0 = kit::kTwoPi * split(ratio[0]) / sample_rate_;
    const float from1 = kit::kTwoPi * split(ratio[1]) / sample_rate_;
    switch (piece) {
      case 0:
        spread_advance_ = fetch(ring, base, kMaxHighSize);
        big_.analyse_begin(frame_[0], frame_[1], spread_advance_, all / 2);
        break;
      case 1:
        big_.analyse_middle();
        break;
      case 2:
        big_.analyse_end();
        big_.shape(0, ratio[0], from0, 4.0f);
        break;
      case 3:
        big_.turn(2 * all / 3);
        break;
      case 4:
        big_.finish();
        add_high(big_, 0);
        if (second) big_.shape(1, ratio[1], from1, 4.0f);
        break;
      case 5:
        if (second) big_.turn(2 * all / 3);
        break;
      case 6:
        if (second) {
          big_.finish();
          add_high(big_, 1);
        }
        break;
      default:
        low_step(base, ratio, second);
        break;
    }
  }

  // One step of the long window: its frame, then a voice a hop of the
  // short window later, the other one after that.
  void low_step(double base, const float* ratio, bool second) {
    const int turn = step_ / hop_;
    if (turn == 0) hear_low(base);
    if (turn == 1) voice_low(0, ratio[0]);
    if (turn == 2 && second) voice_low(1, ratio[1]);
  }

  // Where the two windows divide the work, for a voice: lower when it
  // shifts far up, so what the long window makes stays within what the
  // reduced rate can carry.
  static float split(float ratio) { return kit::min(kSplitHz, kLowTopHz / ratio); }

  // The long window, at the reduced rate.
  void hear_low(double base) {
    const int back = static_cast<int>(base / down_ + 0.5);
    for (int n = 0; n < kLowSize; ++n) {
      frame_[0][n] = slow_[0].read(back + kLowSize - n);
      frame_[1][n] = slow_[1].read(back + kLowSize - n);
    }
    low_.analyse(frame_[0], frame_[1], spacing(kLowHop, back, &low_base_));
    low_frame_ = low_time_;
  }

  void voice_low(int v, float ratio) {
    low_.synthesise(v, ratio, 0.0f, kit::kTwoPi * split(ratio) * down_ / sample_rate_);
    const float* left = low_.frame_left();
    const float* right = low_.frame_right();
    const unsigned from = low_frame_ - static_cast<unsigned>(kLowSize);
    for (int n = 0; n < kLowSize; ++n) {
      const unsigned at = (from + static_cast<unsigned>(n)) & kLowMask;
      low_sum_[v][0][at] += left[n];
      low_sum_[v][1][at] += right[n];
    }
  }

  static constexpr unsigned kHighMask = 2 * kMaxHighSize - 1;
  static constexpr unsigned kLowMask = 2 * kLowSize - 1;

  float sample_rate_ = 48000.0f;
  bool large_ = false;
  int size_ = 2048, hop_ = 512, down_ = 4, margin_ = 256;
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
  int spread_advance_ = 0;
};

}  // namespace pitch_shifter_dsp
}  // namespace livemix
