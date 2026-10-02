#pragma once

// The frequency-domain heart of the Chords mode: a phase vocoder that moves
// each spectral peak, together with the bins around it, to its shifted
// frequency (after the approach of Laroche and Dolson, "New phase-vocoder
// techniques for pitch-shifting, harmonizing and other exotic effects").
//
// One analysis per frame serves every voice:
//   - the stereo frame is windowed and transformed in one complex FFT
//     (left in the real part, right in the imaginary part);
//   - peaks of the combined power are found, and the bins between two peaks
//     are split at the weakest one, so every bin belongs to one peak;
//   - each peak's true frequency is read from how far its phase moved since
//     the previous frame.
// A voice then copies every region to where `ratio` times the peak's
// frequency lies: by a whole number of bins, with one rotation for the whole
// region that carries the rest of the move and runs on from frame to frame.
// The phase relations inside a region, and between left and right, are kept,
// so a shifted partial stays one clean sinusoid in its place in the stereo
// picture.

#include "../../kit/kit.h"

namespace livemix {
namespace pitch_shifter_dsp {

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
    }
    current_ = 0;
    num_peaks_ = 0;
    advance_ = kHop;
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
  }

 private:
  static constexpr double kPi = 3.14159265358979323846;
  static constexpr float kFloor = 1.0e-10f;  // peaks this far under the loudest bin are left alone

  static double wrap(double phase) { return phase - 2.0 * kPi * std::floor(phase / (2.0 * kPi) + 0.5); }

  // A peak is a bin above its two neighbours on either side; the bins
  // between two peaks are divided at the weakest of them.
  void find_peaks(float floor) {
    for (int k = 2; k <= kHalf - 2 && num_peaks_ < kMaxPeaks; ++k) {
      const float p = power_[k];
      if (p > floor && p > power_[k - 1] && p > power_[k - 2] && p >= power_[k + 1] &&
          p >= power_[k + 2]) {
        peak_bin_[num_peaks_++] = k;
        k += 2;
      }
    }
    for (int i = 0; i < num_peaks_; ++i) {
      if (i == 0) peak_from_[i] = 0;
      if (i == num_peaks_ - 1) {
        peak_to_[i] = kHalf + 1;
        break;
      }
      int lowest = peak_bin_[i] + 1;
      for (int k = lowest + 1; k < peak_bin_[i + 1]; ++k) {
        if (power_[k] < power_[lowest]) lowest = k;
      }
      peak_to_[i] = lowest;
      peak_from_[i + 1] = lowest;
    }
  }

  // The frequency of each peak, from the phase it gained since last frame
  // (left and right together, weighted by their power).
  void measure() {
    const float* const* none = nullptr;
    (void)none;
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
      const double off = wrap(gained - centre * advance_);
      peak_omega_[i] = static_cast<float>(centre + off / advance_);
    }
  }

  kit::Fft<N> fft_;
  float window_[N];
  float re_[N], im_[N];                  // work
  float spectrum_[2][4][kHalf + 1];      // [frame][left re, left im, right re, right im]
  float power_[kHalf + 1];
  float theta_[kVoices][kHalf + 1];      // rotation each bin's region had last frame
  int peak_bin_[kMaxPeaks], peak_from_[kMaxPeaks], peak_to_[kMaxPeaks];
  float peak_omega_[kMaxPeaks];          // radians per sample
  int current_ = 0;
  int num_peaks_ = 0;
  int advance_ = kHop;
};

}  // namespace pitch_shifter_dsp
}  // namespace livemix
