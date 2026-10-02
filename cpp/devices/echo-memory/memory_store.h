#pragma once

#include <cstdint>

#include "../../kit/math.h"

namespace livemix {
namespace echo_memory {

// The long memory: a stereo ring of 16-bit frames with a coarse map of how
// loud each 100 ms of it was.
//
// - Frames are stored with TPDF dither of one step, so what comes back has a
//   steady noise floor near -96 dBFS instead of distortion that follows the
//   signal. Positions are absolute frame counts (64-bit), so a read stays
//   exact however long the session runs.
// - Reads are on a quarter-frame grid. The memory voice only ever plays at a
//   quarter, a half, one or two frames per output sample, from a whole frame,
//   so four fixed polyphase kernels (a 24-tap Kaiser-windowed sinc at each
//   quarter) reconstruct every position it can ask for: images are more than
//   70 dB down. The two-frames-per-sample read goes through a 47-tap
//   half-band low-pass instead (stopband from 0.3 of the rate), so only
//   what was recorded between 0.25 and 0.3 of the rate can fold, and it
//   lands above 0.4. A whole position at one frame per sample is the stored
//   frame itself.
// - `forget()` makes everything written so far unrecallable without touching
//   the memory: a blank memory when the device wakes from sleep.
template <int Frames>
class Memory {
 public:
  static constexpr int kFrames = Frames;
  static constexpr int kTaps = 24;
  static constexpr int kBefore = 11;    // taps before the frame a read sits on
  static constexpr int kHalfPairs = 12;   // the half-band's non-zero taps each side
  static constexpr int kHalfReach = 2 * kHalfPairs - 1;
  static constexpr int kGuard = 2 * kHalfReach + 2;  // frames mirrored past the end
  static constexpr int kMapBlocks = 720;  // 72 s of 100 ms blocks
  static constexpr float kScale = 32767.0f;

  // Build the kernels. Call once per init; cheap.
  void prepare(float store_rate) {
    block_frames_ = static_cast<int>(store_rate * 0.1f);
    if (block_frames_ < 1) block_frames_ = 1;
    const double pi = 3.14159265358979323846;
    const double beta = 7.0;
    const double i0_beta = bessel_i0(beta);
    // The half-band low-pass: 0.5 at the centre, zero at the other even
    // offsets, these at the odd ones.
    {
      double sum = 0.0;
      double taps[kHalfPairs];
      for (int k = 0; k < kHalfPairs; ++k) {
        const double n = 2.0 * k + 1.0;
        const double r = n / (kHalfReach + 1.0);
        taps[k] = std::sin(pi * n / 2.0) / (pi * n) * bessel_i0(beta * std::sqrt(1.0 - r * r)) / i0_beta;
        sum += taps[k];
      }
      // Unity at DC: 0.5 + 2 x the sum of the odd taps.
      for (int k = 0; k < kHalfPairs; ++k) half_[k] = static_cast<float>(taps[k] * 0.25 / sum / kScale);
    }
    for (int phase = 0; phase < 4; ++phase) {
      // Interpolation at phase/4, cutoff at Nyquist.
      const double offset = phase * 0.25;
      const double cutoff = 1.0;
      double sum = 0.0;
      double taps[kTaps];
      for (int k = 0; k < kTaps; ++k) {
        const double t = static_cast<double>(k - kBefore) - offset;
        const double r = t / 12.0;
        double value = 0.0;
        if (r > -1.0 && r < 1.0) {
          const double x = pi * cutoff * t;
          const double sinc = (x > -1.0e-9 && x < 1.0e-9) ? 1.0 : std::sin(x) / x;
          value = cutoff * sinc * bessel_i0(beta * std::sqrt(1.0 - r * r)) / i0_beta;
        }
        taps[k] = value;
        sum += value;
      }
      for (int k = 0; k < kTaps; ++k) kernel_[phase][k] = static_cast<float>(taps[k] / sum / kScale);
    }
  }

  void clear() {
    for (int i = 0; i < 2 * (Frames + kGuard); ++i) buffer_[i] = 0;
    for (float& level : map_) level = 0.0f;
    written_ = 0;
    valid_from_ = 0;
    head_ = 0;
    block_fill_ = 0;
    block_peak_ = 0.0f;
    rng_.seed(0x6D2B79F5u);
  }

  void forget() {
    valid_from_ = written_;
    for (float& level : map_) level = 0.0f;
    // Blocks stay aligned to absolute frame numbers; the one in progress
    // starts before valid_from_ and so never counts.
    block_fill_ = static_cast<int>(written_ % block_frames_);
    block_peak_ = 0.0f;
  }

  long long written() const { return written_; }
  long long valid_from() const { return valid_from_; }
  int block_frames() const { return block_frames_; }

  void write(float left, float right) {
    const float loudest = kit::max(left < 0.0f ? -left : left, right < 0.0f ? -right : right);
    if (loudest > block_peak_) block_peak_ = loudest;
    const int16_t l = quantise(left);
    const int16_t r = quantise(right);
    buffer_[2 * head_] = l;
    buffer_[2 * head_ + 1] = r;
    if (head_ < kGuard) {
      buffer_[2 * (Frames + head_)] = l;
      buffer_[2 * (Frames + head_) + 1] = r;
    }
    if (++head_ == Frames) head_ = 0;
    ++written_;
    if (++block_fill_ == block_frames_) {
      map_[static_cast<int>(((written_ - 1) / block_frames_) % kMapBlocks)] = block_peak_;
      block_fill_ = 0;
      block_peak_ = 0.0f;
    }
  }

  // Peak of the completed block that holds frame `index` (0 when the block
  // is not finished, forgotten or older than the map).
  float level_at_block(long long block) const {
    if (block < 0) return 0.0f;
    const long long first_frame = block * block_frames_;
    if (first_frame < valid_from_ || first_frame + block_frames_ > written_) return 0.0f;
    if (written_ - first_frame > static_cast<long long>(kMapBlocks) * block_frames_) return 0.0f;
    return map_[static_cast<int>(block % kMapBlocks)];
  }

  // The frame at quarter-frame position `position_q` (4 per frame). `decimate`
  // selects the half-band kernel (whole positions only). The caller keeps
  // reads at least kGuard frames inside what the ring holds.
  void read(long long position_q, bool decimate, float* left, float* right) const {
    const long long whole = position_q >> 2;
    if (decimate) {
      const int16_t* centre = buffer_ + 2 * (slot(whole - kHalfReach) + kHalfReach);
      float sum_left = 0.0f;
      float sum_right = 0.0f;
      for (int k = 0; k < kHalfPairs; ++k) {
        const int offset = 2 * (2 * k + 1);
        sum_left += half_[k] * static_cast<float>(centre[-offset] + centre[offset]);
        sum_right += half_[k] * static_cast<float>(centre[1 - offset] + centre[1 + offset]);
      }
      *left = sum_left + static_cast<float>(centre[0]) * (0.5f / kScale);
      *right = sum_right + static_cast<float>(centre[1]) * (0.5f / kScale);
      return;
    }
    const int phase = static_cast<int>(position_q & 3);
    if (phase == 0) {
      const int at = 2 * slot(whole);
      *left = static_cast<float>(buffer_[at]) * (1.0f / kScale);
      *right = static_cast<float>(buffer_[at + 1]) * (1.0f / kScale);
      return;
    }
    const int16_t* frames = buffer_ + 2 * slot(whole - kBefore);
    const float* taps = kernel_[phase];
    float sum_left = 0.0f;
    float sum_right = 0.0f;
    for (int k = 0; k < kTaps; ++k) {
      sum_left += taps[k] * static_cast<float>(frames[2 * k]);
      sum_right += taps[k] * static_cast<float>(frames[2 * k + 1]);
    }
    *left = sum_left;
    *right = sum_right;
  }

 private:
  static double bessel_i0(double x) {
    double sum = 1.0;
    double term = 1.0;
    for (int k = 1; k < 32; ++k) {
      term *= (x / (2.0 * k)) * (x / (2.0 * k));
      sum += term;
    }
    return sum;
  }

  // Where frame `index` (one of the last Frames written) is stored.
  int slot(long long index) const {
    const int at = head_ - static_cast<int>(written_ - index);
    return at < 0 ? at + Frames : at;
  }

  int16_t quantise(float x) {
    // TPDF dither of ±1 step from the two halves of one draw.
    const uint32_t bits = rng_.next_u32();
    const float dither =
        (static_cast<float>(bits & 0xFFFFu) - static_cast<float>(bits >> 16)) * (1.0f / 65536.0f);
    float scaled = x * kScale + dither;
    if (!(scaled == scaled)) scaled = 0.0f;
    if (scaled < -32767.0f) scaled = -32767.0f;
    if (scaled > 32767.0f) scaled = 32767.0f;
    return static_cast<int16_t>(std::lrintf(scaled));
  }

  int16_t buffer_[2 * (Frames + kGuard)] = {};
  float map_[kMapBlocks] = {};
  float kernel_[4][kTaps] = {};
  float half_[kHalfPairs] = {};
  kit::Rng rng_;
  long long written_ = 0;
  long long valid_from_ = 0;
  int head_ = 0;
  int block_frames_ = 4800;
  int block_fill_ = 0;
  float block_peak_ = 0.0f;
};

}  // namespace echo_memory
}  // namespace livemix
