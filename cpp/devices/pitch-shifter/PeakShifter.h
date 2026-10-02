#pragma once

// The frequency-domain heart of the Chords mode: a phase vocoder that moves
// each spectral peak, together with the bins around it, to its shifted
// frequency (after the approach of Laroche and Dolson, "New phase-vocoder
// techniques for pitch-shifting, harmonizing and other exotic effects").
//
// One analysis per frame serves every voice:
//   - the stereo frame is windowed and transformed in one complex FFT
//     (left in the real part, right in the imaginary part);
//   - peaks of the combined power are found;
//   - each peak's true frequency is read from how far its phase moved since
//     the previous frame;
//   - every bin is given to the peak it lies nearer to.
// A voice then copies every region to where `ratio` times the peak's
// frequency lies: by a whole number of bins, with one rotation for the whole
// region that carries the rest of the move and runs on from frame to frame.
// The phase relations inside a region, and between left and right, are kept,
// so a shifted partial stays one clean sinusoid in its place in the stereo
// picture.

#include "../../kit/kit.h"

namespace livemix {
namespace pitch_shifter_dsp {

// The kit's radix-2 transform (same tables, same arithmetic, same result),
// able to stop between two passes and go on later: at 4096 points one
// transform is more work than a block of 128 frames should carry at once.
template <int N>
class StagedFft {
 public:
  void init() {
    passes_ = 0;
    while ((1 << passes_) < N) ++passes_;
    for (int i = 0; i < N; ++i) {
      int reversed = 0;
      for (int b = 0; b < passes_; ++b) {
        if (i & (1 << b)) reversed |= 1 << (passes_ - 1 - b);
      }
      reverse_[i] = reversed;
    }
    for (int i = 0; i < N / 2; ++i) {
      const double angle = -2.0 * 3.14159265358979323846 * i / N;
      cos_[i] = static_cast<float>(std::cos(angle));
      sin_[i] = static_cast<float>(std::sin(angle));
    }
  }

  int passes() const { return passes_; }

  // Passes [from, to) of the transform; the reordering comes with pass 0.
  // run(re, im, inverse, 0, passes()) is the whole transform, unscaled.
  void run(float* re, float* im, bool inverse, int from, int to) const {
    if (from == 0) {
      for (int i = 0; i < N; ++i) {
        const int j = reverse_[i];
        if (j > i) {
          const float tr = re[i];
          re[i] = re[j];
          re[j] = tr;
          const float ti = im[i];
          im[i] = im[j];
          im[j] = ti;
        }
      }
    }
    for (int pass = from; pass < to; ++pass) {
      const int size = 2 << pass;
      const int half = size >> 1;
      const int stride = N / size;
      for (int start = 0; start < N; start += size) {
        for (int k = 0; k < half; ++k) {
          const float wr = cos_[k * stride];
          const float wi = inverse ? -sin_[k * stride] : sin_[k * stride];
          const int a = start + k;
          const int b = a + half;
          const float xr = re[b] * wr - im[b] * wi;
          const float xi = re[b] * wi + im[b] * wr;
          re[b] = re[a] - xr;
          im[b] = im[a] - xi;
          re[a] += xr;
          im[a] += xi;
        }
      }
    }
  }

 private:
  int passes_ = 0;
  int reverse_[N] = {};
  float cos_[N / 2] = {};
  float sin_[N / 2] = {};
};

template <int N>
class PeakShifter {
 public:
  static constexpr int kSize = N;
  static constexpr int kHalf = N / 2;
  static constexpr int kHop = N / 4;
  static constexpr int kVoices = 2;
  static constexpr int kMaxPeaks = N / 6;

  void init() {
    fft_.init();
    for (int n = 0; n < N; ++n) {
      window_[n] = 0.5f - 0.5f * static_cast<float>(std::cos(2.0 * 3.14159265358979323846 * n / N));
    }
    reset();
  }

  void reset() {
    for (int k = 0; k <= kHalf; ++k) {
      for (int part = 0; part < 4; ++part) spectrum_[0][part][k] = spectrum_[1][part][k] = 0.0f;
      theta_[0][k] = theta_[1][k] = 0.0f;
      shift_[0][k] = shift_[1][k] = 0;
    }
    current_ = 0;
    num_peaks_ = 0;
    advance_ = kHop;
    last_ratio_[0] = last_ratio_[1] = 0.0f;
  }

  int peaks() const { return num_peaks_; }

  // Takes one frame (N samples a channel, oldest first) that starts
  // `advance` samples after the previous one; 0 says the two are unrelated
  // and the frequencies are then read off the bin centres.
  void analyse(const float* left, const float* right, int advance) {
    for (int n = 0; n < N; ++n) {
      re_[n] = left[n] * window_[n];
      im_[n] = right[n] * window_[n];
    }
    fft_.forward(re_, im_);
    current_ ^= 1;
    advance_ = advance;
    float* lr = spectrum_[current_][0];
    float* li = spectrum_[current_][1];
    float* rr = spectrum_[current_][2];
    float* ri = spectrum_[current_][3];
    float loudest = 0.0f;
    for (int k = 0; k <= kHalf; ++k) {
      const int m = (N - k) & (N - 1);
      lr[k] = 0.5f * (re_[k] + re_[m]);
      li[k] = 0.5f * (im_[k] - im_[m]);
      rr[k] = 0.5f * (im_[k] + im_[m]);
      ri[k] = 0.5f * (re_[m] - re_[k]);
      power_[k] = lr[k] * lr[k] + li[k] * li[k] + rr[k] * rr[k] + ri[k] * ri[k];
      if (power_[k] > loudest) loudest = power_[k];
    }
    num_peaks_ = 0;
    const float quiet = 1.0e-6f * static_cast<float>(N / 4);
    if (loudest < quiet * quiet) {  // silence: start afresh so nothing drifts
      for (int k = 0; k <= kHalf; ++k) theta_[0][k] = theta_[1][k] = 0.0f;
      return;
    }
    find_peaks(loudest * kFloor);
    measure();
    divide();
  }

  // Makes voice `v`'s frame for the last analysis, shifted by `ratio` and
  // windowed for overlapping at a hop of N/4. Only peaks whose
  // frequency (radians per sample) lies in [from, to) are moved; the rest
  // are left out, for another shifter to take.
  void synthesise(int v, float ratio, float from, float to) {
    for (int n = 0; n < N; ++n) re_[n] = im_[n] = 0.0f;
    const float* lr = spectrum_[current_][0];
    const float* li = spectrum_[current_][1];
    const float* rr = spectrum_[current_][2];
    const float* ri = spectrum_[current_][3];
    float* theta = theta_[v];
    const int came = advance_ > 0 ? advance_ : kHop;
    // While the ratio moves, the phase runs on at the mean of this frame's
    // and the last one's, so the two agree halfway between them.
    const double run = 0.5 * (ratio + (last_ratio_[v] > 0.0f ? last_ratio_[v] : ratio));
    last_ratio_[v] = ratio;
    const float level = 1.0f / (1.5f * N);  // inverse FFT and the squared window at this overlap
    for (int i = 0; i < num_peaks_; ++i) {
      const double omega = peak_omega_[i];
      if (omega < from || omega >= to) continue;
      const double target = omega * ratio;
      if (target >= 0.98 * kPi) continue;
      // Whole bins, and the part of a bin left over as a rotation: `theta`
      // is the turn at the middle of the frame, and runs on at the target
      // frequency from frame to frame, so each frame is exactly right at
      // its middle whatever whole number of bins it moved by.
      const double move = (target - omega) * N / (2.0 * kPi);
      // The whole part stays what it was last frame while that is within
      // 0.6 of a bin, so a move that sits between two bins does not flicker.
      const int bin = peak_bin_[i];
      double whole = shift_[v][bin];
      if (move - whole > kHold || whole - move > kHold) whole = std::floor(move + 0.5);
      const float rest = static_cast<float>(move - whole);
      const int shift = static_cast<int>(whole);
      const double turned = wrap(theta[bin] + omega * run * kHop - omega * came);
      const float angle = static_cast<float>(turned);
      // Moving by whole bins turns the middle of the frame by half a turn a
      // bin, taken out here; and a move that ends off a bin's centre comes
      // out a little low, made up here.
      const float gain = ((shift & 1) ? -level : level) / (1.0f - 0.38f * rest * rest);
      const float c = gain * std::cos(angle);
      const float s = gain * std::sin(angle);
      const float kept = static_cast<float>(turned);
      for (int k = peak_from_[i]; k < peak_to_[i]; ++k) {
        theta[k] = kept;
        shift_[v][k] = static_cast<short>(shift);
        const int j = k + shift;
        if (j < 1 || j >= kHalf) continue;
        const float a = lr[k] * c - li[k] * s;
        const float b = lr[k] * s + li[k] * c;
        const float p = rr[k] * c - ri[k] * s;
        const float q = rr[k] * s + ri[k] * c;
        re_[j] += a - q;
        im_[j] += b + p;
        re_[N - j] += a + q;
        im_[N - j] += p - b;
      }
    }
    fft_.inverse(re_, im_);
    for (int n = 0; n < N; ++n) {
      re_[n] *= window_[n];
      im_[n] *= window_[n];
    }
  }
  // The frame just made, until the next call.
  const float* frame_left() const { return re_; }
  const float* frame_right() const { return im_; }

 private:
  static constexpr double kPi = 3.14159265358979323846;
  static constexpr double kHold = 0.6;
  static constexpr float kFloor = 1.0e-10f;  // peaks this far under the loudest bin are left alone

  static double wrap(double phase) { return phase - 2.0 * kPi * std::floor(phase / (2.0 * kPi) + 0.5); }

  // A peak is a bin above its two neighbours on either side.
  void find_peaks(float floor) {
    for (int k = 2; k <= kHalf - 2 && num_peaks_ < kMaxPeaks; ++k) {
      const float p = power_[k];
      if (p > floor && p > power_[k - 1] && p > power_[k - 2] && p >= power_[k + 1] &&
          p >= power_[k + 2]) {
        peak_bin_[num_peaks_++] = k;
        k += 2;
      }
    }
  }

  // Every bin goes with the nearer peak, by the frequencies just measured.
  void divide() {
    for (int i = 0; i < num_peaks_; ++i) {
      if (i == 0) peak_from_[i] = 0;
      if (i == num_peaks_ - 1) {
        peak_to_[i] = kHalf + 1;
        break;
      }
      const float middle = 0.5f * (peak_omega_[i] + peak_omega_[i + 1]) * (N / static_cast<float>(2.0 * kPi));
      int edge = static_cast<int>(middle) + 1;
      if (edge <= peak_bin_[i]) edge = peak_bin_[i] + 1;
      if (edge > peak_bin_[i + 1]) edge = peak_bin_[i + 1];
      peak_to_[i] = edge;
      peak_from_[i + 1] = edge;
    }
  }

  // The frequency of each peak, from the phase it gained since last frame
  // (left and right together, weighted by their power).
  void measure() {
    const int was = current_ ^ 1;
    for (int i = 0; i < num_peaks_; ++i) {
      const int k = peak_bin_[i];
      const double centre = 2.0 * kPi * k / N;
      if (advance_ <= 0) {
        peak_omega_[i] = static_cast<float>(centre);
        continue;
      }
      const float lr = spectrum_[current_][0][k], li = spectrum_[current_][1][k];
      const float rr = spectrum_[current_][2][k], ri = spectrum_[current_][3][k];
      const float plr = spectrum_[was][0][k], pli = spectrum_[was][1][k];
      const float prr = spectrum_[was][2][k], pri = spectrum_[was][3][k];
      const float real = lr * plr + li * pli + rr * prr + ri * pri;
      const float imag = li * plr - lr * pli + ri * prr - rr * pri;
      const double gained = std::atan2(static_cast<double>(imag), static_cast<double>(real));
      // One steady partial lies within half a bin of its peak. A reading
      // further out comes from two partials too close to tell apart,
      // beating in one peak, and is held to the edge of the bin.
      const double edge = 0.55 * 2.0 * kPi / N;
      double off = wrap(gained - centre * advance_) / advance_;
      if (off > edge) off = edge;
      if (off < -edge) off = -edge;
      peak_omega_[i] = static_cast<float>(centre + off);
    }
  }

  kit::Fft<N> fft_;
  float window_[N];
  float re_[N], im_[N];                  // work
  float spectrum_[2][4][kHalf + 1];      // [frame][left re, left im, right re, right im]
  float power_[kHalf + 1];
  float theta_[kVoices][kHalf + 1];      // rotation each bin's region had last frame
  short shift_[kVoices][kHalf + 1];      // whole bins each bin's region moved last frame
  int peak_bin_[kMaxPeaks], peak_from_[kMaxPeaks], peak_to_[kMaxPeaks];
  float peak_omega_[kMaxPeaks];          // radians per sample
  float last_ratio_[kVoices] = {0.0f, 0.0f};
  int current_ = 0;
  int num_peaks_ = 0;
  int advance_ = kHop;
};

}  // namespace pitch_shifter_dsp
}  // namespace livemix
