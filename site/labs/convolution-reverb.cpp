// Convolution reverb: the loop convolved with the engine's room.
//
//   in ──┬──────────────────────────────────────► + ──► out
//        └──► convolved with the room's impulse ──► × send
//
// In the engine this technique is TypeScript and the browser: a room's impulse
// response is written by `spaceImpulseChannel` (src/core/tracks/space.ts) and
// a ConvolverNode convolves with it. So the impulse here is the engine's own:
// the page runs that function at this lab's controls and hands the result
// over as the lab's second signal (site/src/lab/room.ts). The controls that
// shape the room are declared here and read there.
//
// The convolution itself is the lesson's: the loop's spectrum times the
// impulse's, both from the kit's transform (cpp/kit/fft.h). The page holds it
// to the browser's own convolver on every render (site/src/lab/convolution.ts),
// and a check here holds the product of spectra to the sum done term by term.
//
// The loop goes round, so what is kept is the steady state: the tail of each
// pass rings on over the next. For a loop of L samples that is a circular
// convolution, which is the same as folding the impulse onto itself every L
// samples, convolving once, and folding the answer.
//
// lab-memory-mb: 112

#define LAB_AUX
#include "lab.h"

using namespace livemix;

namespace {

// The room's own controls: read by the page, which makes the impulse (room.ts).
lab::Control decay{"decay", "Decay", "s", 0.3f, 6.0f, 3.0f, lab::kLog};
lab::Control predelay{"predelay", "Pre-delay", "ms", 0.0f, 200.0f, 20.0f};
lab::Control swell{"swell", "Swell", "ms", 0.0f, 200.0f, 40.0f};
lab::Control bright{"bright", "Top end at the start", "Hz", 1000.0f, 16000.0f, 7000.0f, lab::kLog};
lab::Control dark{"dark", "Top end at the end", "Hz", 200.0f, 7000.0f, 900.0f, lab::kLog};
lab::Control grain{"grain", "Grain", "", 0.0f, 1.0f, 0.0f};
// The lesson's own.
lab::Control used{"used", "Impulse used", "ms", 10.0f, 6200.0f, 6200.0f, lab::kLog};
lab::Control send{"send", "Send", "dB", -30.0f, 6.0f, -9.0f};

lab::Tap impulse{"impulse", "The room's impulse", lab::kAudio, lab::kEngine, 2};
lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap wet{"wet", "Convolved with the room", lab::kAudio, lab::kLesson, 2};
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kLesson, 2};
lab::Tap decay_curve{"energy", "Energy still to come", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap picture{"picture", "The impulse's spectrum over time", lab::kFrames, lab::kLesson, 1, "dB"};
lab::Tap direct{"direct", "The sum, term by term", lab::kCurve, lab::kLesson, 1};
lab::Tap spectral{"spectral", "The product of spectra", lab::kCurve, lab::kLesson, 1};

lab::Check sums{"sums", "The product of spectra against the sum done term by term", "dB"};

// Two sizes of the kit's transform: a loop of up to 5.4 s fits the smaller.
kit::Fft<1 << 19> fft_small;
kit::Fft<1 << 20> fft_large;

// Both channels of y, each of `count` samples, take the circular convolution
// of that channel of x with that channel of h: zero-padded so the plain
// convolution fits, multiplied bin by bin, brought back, and folded onto the
// loop.
//
// Left and right ride through one transform together, as its real and
// imaginary parts. The transform of a real signal mirrors itself (bin N - k
// is the conjugate of bin k), so the two come apart again afterwards:
//
//   L[k] = (Z[k] + conj(Z[N-k])) / 2        R[k] = (Z[k] - conj(Z[N-k])) / 2j
//
// The products go back the same way, as L + jR, and one inverse returns the
// left answer in the real part and the right one in the imaginary part.
// Three transforms, where one channel at a time takes six.
template <int N>
void convolve(const kit::Fft<N>& fft, const float* const x[2], const float* const h[2], int count,
              float* const y[2]) {
  const int mark = lab::g_arena_used;
  float* xr = lab::take(N);
  float* xi = lab::take(N);
  float* hr = lab::take(N);
  float* hi = lab::take(N);
  if (xr && xi && hr && hi) {
    for (int n = 0; n < count; ++n) {
      xr[n] = x[0][n];
      xi[n] = x[1][n];
      hr[n] = h[0][n];
      hi[n] = h[1][n];
    }
    fft.forward(xr, xi);
    fft.forward(hr, hi);
    for (int k = 0; k <= N / 2; ++k) {
      const int m = (N - k) & (N - 1);
      // The left and right spectra of the loop and of the impulse, at bin k.
      const float xlr = 0.5f * (xr[k] + xr[m]), xli = 0.5f * (xi[k] - xi[m]);
      const float xrr = 0.5f * (xi[k] + xi[m]), xri = 0.5f * (xr[m] - xr[k]);
      const float hlr = 0.5f * (hr[k] + hr[m]), hli = 0.5f * (hi[k] - hi[m]);
      const float hrr = 0.5f * (hi[k] + hi[m]), hri = 0.5f * (hr[m] - hr[k]);
      // Convolution in time is this, in frequency: one multiplication a bin.
      const float lr = xlr * hlr - xli * hli, li = xlr * hli + xli * hlr;
      const float rr = xrr * hrr - xri * hri, ri = xrr * hri + xri * hrr;
      // Packed again as L + jR, at bin k and at its mirror.
      xr[k] = lr - ri;
      xi[k] = li + rr;
      xr[m] = lr + ri;
      xi[m] = rr - li;
    }
    fft.inverse(xr, xi);
    // The kit's inverse is unscaled.
    const float scale = 1.0f / static_cast<float>(N);
    for (int n = 0; n < count; ++n) {
      y[0][n] = xr[n] * scale;
      y[1][n] = xi[n] * scale;
    }
    for (int n = count; n < 2 * count - 1; ++n) {
      y[0][n - count] += xr[n] * scale;
      y[1][n - count] += xi[n] * scale;
    }
  }
  lab::g_arena_used = mark;
}

// A short stretch of the loop against a short stretch of the impulse, twice:
// by the sum as it is written, and by the product of spectra.
constexpr int kExcerpt = 2048;
constexpr int kExcerptOut = 2 * kExcerpt - 1;

void two_ways(const float* x, int frames, const float* h, int h_count) {
  if (!direct.open(kExcerptOut) || !spectral.open(kExcerptOut)) return;
  direct.x0 = spectral.x0 = 0.0f;
  direct.x1 = spectral.x1 = 1000.0f * (kExcerptOut - 1) / lab::kSampleRate;
  // From where the impulse first says something.
  int first = 0;
  while (first < h_count && h[first] == 0.0f) ++first;
  const int taps = h_count - first < kExcerpt ? h_count - first : kExcerpt;
  const int samples = frames < kExcerpt ? frames : kExcerpt;

  // y[n] = sum over k of h[k] x[n - k]
  for (int n = 0; n < kExcerptOut; ++n) {
    double sum = 0.0;
    for (int k = 0; k < taps; ++k) {
      const int at = n - k;
      if (at < 0) break;
      if (at < samples) sum += static_cast<double>(h[first + k]) * x[at];
    }
    direct.data[n] = static_cast<float>(sum);
  }

  static float xr[lab::kSpectrumSize], xi[lab::kSpectrumSize], hr[lab::kSpectrumSize], hi[lab::kSpectrumSize];
  for (int n = 0; n < lab::kSpectrumSize; ++n) {
    xr[n] = n < samples ? x[n] : 0.0f;
    hr[n] = n < taps ? h[first + n] : 0.0f;
    xi[n] = hi[n] = 0.0f;
  }
  lab::g_spectrum_fft.forward(xr, xi);
  lab::g_spectrum_fft.forward(hr, hi);
  for (int k = 0; k < lab::kSpectrumSize; ++k) {
    const float re = xr[k] * hr[k] - xi[k] * hi[k];
    const float im = xr[k] * hi[k] + xi[k] * hr[k];
    xr[k] = re;
    xi[k] = im;
  }
  lab::g_spectrum_fft.inverse(xr, xi);
  for (int n = 0; n < kExcerptOut; ++n) spectral.data[n] = xr[n] / static_cast<float>(lab::kSpectrumSize);
  sums.value = lab::difference_db(spectral.data, direct.data, kExcerptOut);
}

}  // namespace

void lab_setup() {
  fft_small.init();
  fft_large.init();
}

void lab_render(int frames) {
  const int length = lab::aux_frames();
  if (!impulse.open(frames) || !in_tap.open(frames) || !wet.open(frames) || !out_tap.open(frames)) return;

  // The part of the impulse in use, folded onto the loop.
  const int cut_at = static_cast<int>(used.value * 0.001f * lab::kSampleRate);
  const int heard = cut_at < length ? cut_at : length;
  for (int c = 0; c < 2; ++c) {
    const float* h = lab::aux(c);
    float* folded = impulse.channel(c);
    for (int n = 0; n < heard; ++n) folded[n % frames] += h[n];
  }

  const float* const x[2] = {lab::in(0), lab::in(1)};
  const float* const h[2] = {impulse.channel(0), impulse.channel(1)};
  float* const y[2] = {wet.channel(0), wet.channel(1)};
  if (2 * frames - 1 <= fft_small.kSize) {
    convolve(fft_small, x, h, frames, y);
  } else {
    convolve(fft_large, x, h, frames, y);
  }

  const float gain = kit::db_to_gain(send.value);
  for (int c = 0; c < 2; ++c) {
    float* dry = in_tap.channel(c);
    float* sum = out_tap.channel(c);
    for (int n = 0; n < frames; ++n) {
      dry[n] = x[c][n];
      sum[n] = x[c][n] + gain * y[c][n];
    }
  }

  if (length > 0) {
    lab::energy_decay_tap(decay_curve, lab::aux(0), length);
    lab::spectrogram_tap(picture, lab::aux(0), length, 200, false);
  }
  two_ways(lab::in(0), frames, lab::aux(0), length);
}
