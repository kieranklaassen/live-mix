#pragma once

// The short-time Fourier block the spectral devices are built on, and the
// phase arithmetic a phase vocoder needs. Not part of kit.h: a device that
// works on the spectrum includes it beside the kit.
//
//   #include "../../kit/kit.h"
//   #include "../../kit/stft.h"

#include "fft.h"
#include "math.h"

namespace livemix {
namespace kit {

// atan2 in radians without the libm call: one division and a polynomial of
// five terms (Abramowitz and Stegun 4.4.47), within 1.2e-5 rad of atan2
// everywhere. (0, 0) gives 0.
inline float fast_atan2(float y, float x) {
  const float ax = std::fabs(x);
  const float ay = std::fabs(y);
  const float longer = ax > ay ? ax : ay;
  if (!(longer > 0.0f)) return 0.0f;
  // The angle to the nearer axis, in [0, π/4], then unfolded. Written as
  // choices and not as branches: which octant a bin's phase lies in is a
  // coin toss, and a mispredicted branch costs more than the polynomial.
  const float t = (ax > ay ? ay : ax) / longer;
  const float t2 = t * t;
  float angle = t * (0.9998660f + t2 * (-0.3302995f + t2 * (0.1801410f + t2 * (-0.0851330f + t2 * 0.0208351f))));
  angle = ay > ax ? kHalfPi - angle : angle;
  angle = x < 0.0f ? kPi - angle : angle;
  return std::copysign(angle, y);
}

// A phase in radians brought back into [-π, π): the principal argument.
inline float princarg(float phase) { return phase - kTwoPi * std::floor(phase * (1.0f / kTwoPi) + 0.5f); }

// sin(x) for x in [-π/2, π/2] within 7e-7: the minimax polynomial of four
// terms.
inline float quarter_sine(float x) {
  const float x2 = x * x;
  return x * (0.9999966159f + x2 * (-0.1666482838f + x2 * (0.008306325227f + x2 * -0.0001836365398f)));
}

// A bin as magnitude and phase (radians, by fast_atan2), and back again:
// the phase is folded into the first quarter turn, where quarter_sine gives
// the sine and, from the complement, the cosine. The way back is good to
// 1e-6 of the magnitude for a phase within a turn of zero; a phase left to
// grow loses the float's own digits (3e-6 at 30 rad), so keep one that
// accumulates wrapped (princarg). Neither way calls libm or reads a table:
// in WASM the way there costs about 8 ns a bin and the way back 4, a third
// of what std::atan2 and a std::sin and std::cos cost. Where a device only
// has to turn a bin, a rotator does it for 1 ns and without either: multiply
// the bin by the unit vector of the turn, as cpp/devices/spectral-blur does.
inline void to_polar(float re, float im, float* magnitude, float* phase) {
  *magnitude = std::sqrt(re * re + im * im);
  *phase = fast_atan2(im, re);
}

inline void from_polar(float magnitude, float phase, float* re, float* im) {
  // The phase in turns, in [-0.5, 0.5); past a quarter turn either way it
  // lies in the left half plane, where the cosine is negative and the angle
  // is measured back from the half turn. `angle` is in [0, π/2].
  float turns = phase * (1.0f / kTwoPi);
  turns -= std::floor(turns + 0.5f);
  const float size = std::fabs(turns);
  const bool back = size > 0.25f;
  const float angle = kTwoPi * (back ? 0.5f - size : size);
  const float cosine = quarter_sine(kHalfPi - angle);
  *re = magnitude * (back ? -cosine : cosine);
  *im = magnitude * std::copysign(quarter_sine(angle), turns);
}

// One channel of streaming short-time Fourier analysis and resynthesis:
// frames of `Frame` samples every `Hop`, Hann on the way in and Hann on the
// way out, overlap-added. `Frame` is a power of two (1024, 2048 and 4096 are
// the sizes in use), `Hop` a quarter of it or an eighth. Hann² frames a
// quarter apart add up to exactly 1.5 (an eighth apart, 3), which is the
// normalisation: with a callable that changes nothing, what comes out is
// what went in kLatency samples before, to within 1e-6.
//
//   kit::Stft<2048, 512> stft_[2];
//   stft_[0].init();                              // in the device's init
//   stft_[1].init(stft_[1].kMaxStagger);
//   ...
//   const float wet = stft_[c].process(in[c], [&](float* re, float* im) {
//     for (int k = 0; k < stft_[c].kBins; ++k) { re[k] *= gain_[k]; im[k] *= gain_[k]; }
//   });
//   const float dry = stft_[c].dry();             // in step with `wet`
//
// The callable is called once every `Hop` samples, from inside process(),
// with the spectrum of the newest whole frame: bins 0 to Frame/2 (kBins of
// them), real and imaginary parts in two arrays, to change in place. Bin k
// lies at k × rate / Frame Hz, and phases count from the frame's first
// sample. A sine of amplitude 1 exactly on a bin reads kFullScale (Frame/4)
// there and half that in each neighbour, which is the Hann window: a partial
// is three or four bins wide, never one. Bins 0 and Frame/2 are real; what
// the callable leaves in their imaginary parts is ignored.
//
// A gain per bin is a filter, and its response is the gains smoothed by the
// window: at the centre of bin k it is 2/3 of gain k and 1/6 of each
// neighbour's. One bin set to zero takes a sine on it down by 9.5 dB, not to
// silence, and a step in the gains comes out as a slope three bins wide.
//
// Stagger. A frame is two transforms, and a stereo device has two channels.
// init(stagger) does this channel's work `stagger` samples later (0 to
// kMaxStagger, half a hop) on the very same frames: with one channel at 0
// and the other at kMaxStagger, a 128-sample block never holds the
// transforms of both (for a hop of 256 or more). The frames lie where they
// lay and the output is the same floats; only the moment of the work moves.
// The room for that is the half hop in the latency, which every channel has
// whatever its stagger, so two channels are always in step:
//
//   kLatency = Frame + Hop / 2        (1152, 2304 and 4608 at a quarter hop)
//
// A device gives that number in its manifest ("latencySamples") and delays
// its dry path by as much: dry() is the input of kLatency samples ago, read
// from the ring the frames are taken from, so it costs nothing.
//
// What goes in. A sample that is not a number, or is at ±64 or beyond, goes
// in as zero: it would otherwise sit in every frame that overlaps it and in
// whatever the device keeps per bin. So does one under 1e-15, because WASM
// has no flush-to-zero. dry() returns the sample as it was taken. Silence in
// is exact silence out once the last frame has played out, kLatency + Frame
// after the last sample (as long as the callable makes nothing of nothing).
//
// Sleep. The frame clock counts samples, so a device that sleeps
// (kit::IdleGate) says how many it slept through: skip(frames) in the branch
// that writes silence. The frames then fall on the same samples whatever the
// block size, which decides when sleep begins. frame() numbers them: the
// same number for both channels of a staggered pair, and for a frame at the
// same place in time whatever was slept through. Seed per-frame randomness
// from it and not from a count of calls.
//
// Analysis only. A device that measures and does not resynthesise calls
// analyse() in place of process(): the forward transform alone, under half
// the cost, and no latency to report. One object does one or the other.
//
// Cost. The forward transform is the kit's real one (Fft::forward_real).
// The inverse is a complex transform of half the frame (the even samples in
// the real parts, the odd ones in the imaginary), so the pair costs about
// what one complex transform of the frame would. In WASM (Node, a 2.1 GHz
// Xeon) a frame, both transforms and the overlap-add, takes about 8 µs at
// 1024, 17 µs at 2048 and 38 µs at 4096: at a quarter hop under 0.2 % of
// real time a channel at 48 kHz whatever the size (twice that at an eighth),
// before the callable does anything. The samples between frames cost a ring
// write and a ring read. Storage is 43 bytes per sample of frame: 88 KB a
// channel at 2048, 176 KB at 4096.
template <int Frame, int Hop = Frame / 4>
class Stft {
 public:
  static_assert((Frame & (Frame - 1)) == 0 && Frame >= 64 && Frame <= 65536,
                "Stft frame must be a power of two, 64 to 65536");
  static_assert((Hop & (Hop - 1)) == 0 && Hop >= 2 && Hop * 4 <= Frame,
                "Stft hop must be a quarter of the frame, or a power of two under that");

  static constexpr int kFrame = Frame;
  static constexpr int kHop = Hop;
  static constexpr int kBins = Frame / 2 + 1;
  static constexpr int kOverlap = Frame / Hop;  // frames that cover any one sample
  static constexpr int kMaxStagger = Hop / 2;
  static constexpr int kLatency = Frame + kMaxStagger;
  // What a sine of amplitude 1 on a bin's centre reads in that bin.
  static constexpr float kFullScale = 0.25f * Frame;

  // Builds the tables and clears. `stagger` is fixed from here on.
  void init(int stagger = 0) {
    fft_.init();
    const double step = 2.0 * 3.14159265358979323846 / Frame;
    for (int n = 0; n < Frame; ++n) window_[n] = static_cast<float>(0.5 - 0.5 * std::cos(step * n));
    for (int i = 0; i < kHalf; ++i) {
      cos_[i] = static_cast<float>(std::cos(step * i));
      sin_[i] = static_cast<float>(std::sin(step * i));
    }
    int bits = 0;
    while ((1 << bits) < kHalf) ++bits;
    for (int i = 0; i < kHalf; ++i) {
      int reversed = 0;
      for (int b = 0; b < bits; ++b) {
        if (i & (1 << b)) reversed |= 1 << (bits - 1 - b);
      }
      reverse_[i] = static_cast<uint16_t>(reversed);
    }
    stagger_ = static_cast<uint32_t>(clamp_int(stagger, 0, kMaxStagger));
    clear();
  }

  // Empties both rings and starts the frame clock again; the tables and the
  // stagger stay.
  void clear() {
    for (int i = 0; i < kRing; ++i) {
      input_[i] = 0.0f;
      output_[i] = 0.0f;
    }
    position_ = 0;
    frame_ = 0;
    swept_ = kRing;
  }

  int latency() const { return kLatency; }
  int stagger() const { return static_cast<int>(stagger_); }

  // One sample in, one out. `on_frame(float* re, float* im)` is called first
  // when a frame is due.
  template <typename OnFrame>
  float process(float x, OnFrame&& on_frame) {
    if ((position_ & (Hop - 1)) == stagger_) {
      analyse_frame();
      on_frame(static_cast<float*>(re_), static_cast<float*>(im_));
      synthesise_frame();
    }
    input_[position_ & kMask] = guarded(x);
    float& slot = output_[position_ & kMask];
    const float y = slot;
    slot = 0.0f;
    ++position_;
    swept_ = 0;
    return y;
  }

  // The dry signal in step with what process() just returned: its input of
  // kLatency samples before.
  float dry() const { return input_[(position_ - 1 - kLatency) & kMask]; }

  // One sample in and nothing out: `on_frame(const float* re, const float*
  // im)` sees the same frames process() would hand over, and no frame is
  // resynthesised.
  template <typename OnFrame>
  void analyse(float x, OnFrame&& on_frame) {
    if ((position_ & (Hop - 1)) == stagger_) {
      analyse_frame();
      on_frame(static_cast<const float*>(re_), static_cast<const float*>(im_));
    }
    input_[position_ & kMask] = guarded(x);
    ++position_;
    swept_ = 0;
  }

  // The device slept through `samples` of silence: the clock moves on as if
  // they had been processed, and what they would have passed in the rings is
  // emptied (once round at most, so a long sleep costs nothing more).
  void skip(int samples) {
    if (samples <= 0) return;
    for (int i = 0; i < samples && swept_ < kRing; ++i, ++swept_) {
      input_[(position_ + static_cast<uint32_t>(i)) & kMask] = 0.0f;
      output_[(position_ + static_cast<uint32_t>(i)) & kMask] = 0.0f;
    }
    position_ += static_cast<uint32_t>(samples);
  }

  // The number of the frame last handed to the callable: frame n ends n
  // hops after init() or clear(), samples slept through included. It wraps
  // with the sample count, after a day at 48 kHz.
  uint32_t frame() const { return frame_; }

  // --- bins and frequencies --------------------------------------------------------------

  // The frequency of a bin (whole or between two), the place of a frequency
  // among the bins, which is rarely whole, and the bin nearest to it (0 to
  // Frame/2 whatever is asked). All follow the sample rate, so anything per
  // bin that is meant in hertz is worked out again in init.
  static float bin_to_hz(float bin, float sample_rate) { return bin * sample_rate * (1.0f / Frame); }
  static float hz_to_bin(float hz, float sample_rate) { return hz * static_cast<float>(Frame) / sample_rate; }
  static int nearest_bin(float hz, float sample_rate) {
    const float bin = hz_to_bin(hz, sample_rate);
    if (!(bin > 0.0f)) return 0;
    return bin < static_cast<float>(kHalf) ? static_cast<int>(bin + 0.5f) : kHalf;
  }

  // The true frequency of what sounds in a bin, from how far its phase
  // turned between two successive frames. A partial at b bins (not a whole
  // number) turns by 2π b Hop / Frame from one frame to the next. Bin k's
  // own share of that is 2π k Hop / Frame; what is left over, brought into
  // ±π, is the partial's distance from the bin's centre:
  //
  //   deviation = princarg(advance - 2π k Hop / Frame)
  //   b         = k + deviation × Frame / (2π Hop)
  //
  // `advance` is the phase now minus the phase one frame before, in radians;
  // whole turns in it do not matter. The answer is right for the bin a
  // partial peaks in and its neighbours (a deviation of ±π is ±2 bins at a
  // quarter hop), and noise where no partial is.
  static float advance_to_bin(int bin, float advance) {
    // The bin's own share modulo a whole turn, exactly: k mod (Frame / Hop).
    const float own = kTwoPi * static_cast<float>(bin & (kOverlap - 1)) * (1.0f / kOverlap);
    return static_cast<float>(bin) + princarg(advance - own) * (kOverlap / kTwoPi);
  }
  static float advance_to_hz(int bin, float advance, float sample_rate) {
    return bin_to_hz(advance_to_bin(bin, advance), sample_rate);
  }

  // And back: the phase to advance a bin by each frame for it to sound at a
  // frequency, 2π b Hop / Frame, brought into [-π, π).
  static float bin_to_advance(float bin) {
    const float cycles = bin * (1.0f / kOverlap);
    return kTwoPi * (cycles - std::floor(cycles + 0.5f));
  }
  static float hz_to_advance(float hz, float sample_rate) { return bin_to_advance(hz_to_bin(hz, sample_rate)); }

 private:
  static constexpr int kHalf = Frame / 2;
  static constexpr int kRing = 2 * Frame;  // a frame and the stagger, in and out
  static constexpr uint32_t kMask = kRing - 1;
  static constexpr float kInputLimit = 64.0f;
  // Hann² frames `Hop` apart add up to 3/8 of their number per frame; the
  // inverse transform is unscaled.
  static constexpr float kOutputScale = 8.0f / (3.0f * kOverlap * Frame);

  static float guarded(float x) { return (x > -kInputLimit && x < kInputLimit) ? flush_denormal(x) : 0.0f; }

  // The frame that ended `stagger` samples ago, windowed, into re_ and im_.
  void analyse_frame() {
    frame_ = (position_ - stagger_) / Hop;
    const uint32_t start = position_ - stagger_ - Frame;
    const float* input = input_;
    const float* window = window_;
    // Bins 0..Frame/2 in re_, the imaginary parts packed from its top down.
    fft_.forward_real([input, window, start](int n) { return input[(start + n) & kMask] * window[n]; }, re_);
    im_[0] = 0.0f;
    im_[kHalf] = 0.0f;
    for (int k = 1; k < kHalf; ++k) im_[k] = re_[Frame - k];
  }

  // The inverse transform of re_ and im_, windowed and added to the output
  // where the frame came from, kLatency later.
  //
  // The frame is real, so a complex transform of half its size does: with
  // z[m] = x[2m] + j x[2m+1], and E and O the transforms of the even and the
  // odd samples, X[k] = E[k] + w^k O[k] and X[k + Frame/2] = E[k] - w^k O[k]
  // (w one step of the frame's circle), so
  //
  //   Z[k] = E[k] + j O[k] = (X[k] + X*[h-k]) / 2 + j (X[k] - X*[h-k]) / (2 w^k),   h = Frame/2
  //
  // (X[k + h] is the conjugate of X[h - k]). Bins k and h-k share their sums
  // and differences, so they are made together, straight into the places
  // the bit reversal would move them to. The halves are left out: the
  // unscaled half-size transform then gives Frame times the frame, as the
  // unscaled whole one would.
  void synthesise_frame() {
    float* zr = zr_;
    float* zi = zi_;
    {
      const float sum = re_[0] + re_[kHalf];
      const float difference = re_[0] - re_[kHalf];
      zr[0] = sum;
      zi[0] = difference;
      zr[reverse_[kHalf / 2]] = 2.0f * re_[kHalf / 2];
      zi[reverse_[kHalf / 2]] = -2.0f * im_[kHalf / 2];
    }
    for (int k = 1; k < kHalf / 2; ++k) {
      const float sum_r = re_[k] + re_[kHalf - k];
      const float dr = re_[k] - re_[kHalf - k];
      const float di = im_[k] + im_[kHalf - k];
      const float sum_i = im_[k] - im_[kHalf - k];
      const float p = dr * sin_[k] + di * cos_[k];
      const float q = dr * cos_[k] - di * sin_[k];
      const int low = reverse_[k];
      const int high = reverse_[kHalf - k];
      zr[low] = sum_r - p;
      zi[low] = q + sum_i;
      zr[high] = sum_r + p;
      zi[high] = q - sum_i;
    }

    // Sizes 2 and 4 in one pass: their twiddles are 1 and j.
    for (int i = 0; i < kHalf; i += 4) {
      const float ar = zr[i] + zr[i + 1], ai = zi[i] + zi[i + 1];
      const float br = zr[i] - zr[i + 1], bi = zi[i] - zi[i + 1];
      const float cr = zr[i + 2] + zr[i + 3], ci = zi[i + 2] + zi[i + 3];
      const float dr = zr[i + 2] - zr[i + 3], di = zi[i + 2] - zi[i + 3];
      zr[i] = ar + cr;
      zi[i] = ai + ci;
      zr[i + 2] = ar - cr;
      zi[i + 2] = ai - ci;
      zr[i + 1] = br - di;
      zi[i + 1] = bi + dr;
      zr[i + 3] = br + di;
      zi[i + 3] = bi - dr;
    }
    // The sizes from 8 up two at a time, after one on its own when their
    // number is odd.
    int size = 8;
    int sizes = 0;
    for (int s = 8; s <= kHalf; s <<= 1) ++sizes;
    if (sizes & 1) {
      inverse_stage(size);
      size <<= 1;
    }
    for (; size < kHalf; size <<= 2) inverse_stage_pair(size);

    // Even samples in the real parts, odd ones in the imaginary.
    const uint32_t out_start = position_ - stagger_ + kMaxStagger;
    for (int m = 0; m < kHalf; ++m) {
      const uint32_t at = out_start + 2 * static_cast<uint32_t>(m);
      output_[at & kMask] += zr[m] * kOutputScale * window_[2 * m];
      output_[(at + 1) & kMask] += zi[m] * kOutputScale * window_[2 * m + 1];
    }
  }

  // One stage of the inverse: every two transforms of size/2 points side by
  // side become one of `size`.
  void inverse_stage(int size) {
    const int half = size >> 1;
    const int stride = Frame / size;
    for (int start = 0; start < kHalf; start += size) {
      float* ar = zr_ + start;
      float* ai = zi_ + start;
      float* br = ar + half;
      float* bi = ai + half;
      for (int k = 0; k < half; ++k) {
        const float wr = cos_[k * stride];
        const float wi = sin_[k * stride];
        const float xr = br[k] * wr - bi[k] * wi;
        const float xi = br[k] * wi + bi[k] * wr;
        br[k] = ar[k] - xr;
        bi[k] = ai[k] - xi;
        ar[k] += xr;
        ai[k] += xi;
      }
    }
  }

  // inverse_stage for `size` and then for twice `size` in one pass over the
  // data: the four points the two butterflies of the first touch are the
  // four the second's two touch.
  void inverse_stage_pair(int size) {
    const int half = size >> 1;
    const int stride = Frame / size;  // of the first stage's twiddles
    const int stride2 = stride >> 1;  // of the second's
    for (int start = 0; start < kHalf; start += 2 * size) {
      float* ar = zr_ + start;
      float* ai = zi_ + start;
      float* br = ar + half;
      float* bi = ai + half;
      float* cr = ar + size;
      float* ci = ai + size;
      float* dr = cr + half;
      float* di = ci + half;
      for (int k = 0; k < half; ++k) {
        const float wr = cos_[k * stride];
        const float wi = sin_[k * stride];
        const float tr = br[k] * wr - bi[k] * wi;
        const float ti = br[k] * wi + bi[k] * wr;
        const float a1r = ar[k] + tr, a1i = ai[k] + ti;
        const float b1r = ar[k] - tr, b1i = ai[k] - ti;
        const float ur = dr[k] * wr - di[k] * wi;
        const float ui = dr[k] * wi + di[k] * wr;
        const float c1r = cr[k] + ur, c1i = ci[k] + ui;
        const float d1r = cr[k] - ur, d1i = ci[k] - ui;
        // The second stage: twiddle w2 for the first pair, j w2 (a quarter
        // turn on) for the second.
        const float w2r = cos_[k * stride2];
        const float w2i = sin_[k * stride2];
        const float pr = c1r * w2r - c1i * w2i;
        const float pi = c1r * w2i + c1i * w2r;
        const float qr = d1r * w2r - d1i * w2i;
        const float qi = d1r * w2i + d1i * w2r;
        ar[k] = a1r + pr;
        ai[k] = a1i + pi;
        cr[k] = a1r - pr;
        ci[k] = a1i - pi;
        br[k] = b1r - qi;
        bi[k] = b1i + qr;
        dr[k] = b1r + qi;
        di[k] = b1i - qr;
      }
    }
  }

  Fft<Frame> fft_;
  float window_[Frame] = {};
  float cos_[kHalf] = {};  // one turn in Frame steps, the first half of it
  float sin_[kHalf] = {};
  uint16_t reverse_[kHalf] = {};  // bit reversal of the half-size transform
  float input_[kRing] = {};
  float output_[kRing] = {};
  float re_[Frame] = {};  // bins 0..kHalf; above them forward_real's packed imaginary parts
  float im_[kBins] = {};
  float zr_[kHalf] = {};  // the half-size transform's work space
  float zi_[kHalf] = {};
  uint32_t position_ = 0;  // samples taken in; only its low bits are used
  uint32_t stagger_ = 0;
  uint32_t frame_ = 0;
  int swept_ = kRing;  // ring slots emptied by skip() since the last sample
};

}  // namespace kit
}  // namespace livemix
