// Lesson 2, the Fourier transform: the kit's own transform (cpp/kit/fft.h,
// kit::Fft<N>) run on one frame of the loop, with every step on the way to
// its bins and back kept as a tap.
//
//   loop ──► frame (N samples) ──► × window ──► kit::Fft::forward ──► bins
//                                                                      │
//   out ◄── frames added up ◄── ÷ N ◄── kit::Fft::inverse ◄── first K bins kept
//
// Computed by the kit: every bin (real and imaginary part, and the level and
// the angle worked out from them), the frame rebuilt from the bins kept, the
// loop rebuilt frame by frame, and the two spectra of the probe.
// Written for the lesson: the window (the same raised cosine the engine's
// spectral devices write for themselves), the cosine and the running sums of
// the one-bin picture, and the probe sine. The lab also writes the transform's
// sum out by hand for one bin and reports how far it lands from the kit's bin
// (the "direct" check), measures the energy on both sides of the transform
// ("parseval"), the gain of forward then inverse ("unscaled", "roundTrip"),
// and the real-signal path against the complex one ("realSame").

#include "lab.h"

using namespace livemix;

namespace {

constexpr int kMaxSize = 4096;
constexpr int kProbeSize = 64;

kit::Fft<64> fft64;
kit::Fft<256> fft256;
kit::Fft<1024> fft1024;
kit::Fft<4096> fft4096;

lab::Control position{"position", "Frame starts at", "s", 0.0f, 4.0f, 0.98f};
lab::Control size{"size", "Frame length", "", 0.0f, 3.0f, 3.0f, lab::kLinear, "64|256|1024|4096"};
lab::Control window{"window", "Window", "", 0.0f, 1.0f, 1.0f, lab::kLinear, "None|Hann"};
lab::Control compare{"compare", "Compare with", "Hz", 20.0f, 5000.0f, 110.0f, lab::kLog};
lab::Control probe{"probe", "Probe frequency", "bins", 6.0f, 10.0f, 8.0f};
lab::Control keep{"keep", "Bins kept", "", 1.0f, 2049.0f, 48.0f, lab::kLog};

lab::Tap in_tap{"in", "The loop", lab::kAudio, lab::kSource, 2};
lab::Tap frame_tap{"frame", "The frame", lab::kCurve, lab::kSource, 1};
lab::Tap window_tap{"window", "The window", lab::kCurve, lab::kLesson, 1};
lab::Tap windowed_tap{"windowed", "Frame times window", lab::kCurve, lab::kLesson, 1};
lab::Tap cosine_tap{"cosine", "A cosine at the frequency compared, at the frame's height", lab::kCurve, lab::kLesson, 1};
lab::Tap product_tap{"product", "Frame times cosine", lab::kCurve, lab::kLesson, 1};
lab::Tap run_cos{"runCos", "Sum so far against the cosine", lab::kCurve, lab::kLesson, 1};
lab::Tap run_sin{"runSin", "Sum so far against the sine", lab::kCurve, lab::kLesson, 1};
lab::Tap real_tap{"real", "Bins, real part", lab::kCurve, lab::kKit, 1};
lab::Tap imag_tap{"imag", "Bins, imaginary part", lab::kCurve, lab::kKit, 1};
lab::Tap magnitude{"magnitude", "Bins, level", lab::kSpectrum, lab::kKit, 1, "dB"};
lab::Tap phase{"phase", "Bins, angle", lab::kCurve, lab::kKit, 1, "rad"};
lab::Tap rebuilt{"rebuilt", "Frame rebuilt from the bins kept", lab::kCurve, lab::kKit, 1};
lab::Tap residual{"residual", "What the bins left out held", lab::kCurve, lab::kLesson, 1};
lab::Tap out_tap{"out", "The loop rebuilt from the bins kept", lab::kAudio, lab::kKit, 2};
lab::Tap probe_twice{"probeTwice", "The probe's frame, twice over", lab::kCurve, lab::kLesson, 1};
lab::Tap probe_twice_hann{"probeTwiceHann", "The same, windowed", lab::kCurve, lab::kLesson, 1};
lab::Tap leak_plain{"leakPlain", "Probe's bins, no window", lab::kCurve, lab::kKit, 1, "dB"};
lab::Tap leak_hann{"leakHann", "Probe's bins, Hann window", lab::kCurve, lab::kKit, 1, "dB"};

lab::Check match{"match", "How much of the frequency compared the frame holds", "dB"};
lab::Check direct{"direct", "The sum written out for the nearest bin, against the kit's bin", "dB"};
lab::Check parseval{"parseval", "Energy of the bins over N against energy of the frame, apart by", ""};
lab::Check unscaled{"unscaled", "The gain of forward then inverse, divided by N", ""};
lab::Check round_trip{"roundTrip", "Forward, inverse, divided by N, against the frame", "dB"};
lab::Check rebuild_null{"rebuildNull", "The frame rebuilt from the bins kept, against the frame", "dB"};
lab::Check real_same{"realSame", "The real-signal transform against the complex one", "dB"};

float frame_[kMaxSize];
float window_[kMaxSize];
float windowed_[kMaxSize];
float re_[kMaxSize];  // the frame's bins, as the kit leaves them
float im_[kMaxSize];
float work_re_[kMaxSize];
float work_im_[kMaxSize];
float packed_[kMaxSize];

// What the window does to the level of a sine: a full-scale sine exactly on
// a bin leaves half the sum of the window there (N / 2 with no window).
double window_sum(const float* w, int n) {
  double sum = 0.0;
  for (int i = 0; i < n; ++i) sum += w[i];
  return sum;
}

template <int N>
void keep_first(float* re, float* im, int kept) {
  for (int k = kept; k <= N / 2; ++k) {
    re[k] = 0.0f;
    im[k] = 0.0f;
    re[N - k] = 0.0f;
    im[N - k] = 0.0f;
  }
}

template <int N>
void analyse(const kit::Fft<N>& fft) {
  const int loop = lab::frames();
  const bool hann = window.on();
  const int kept = kit::clamp_int(static_cast<int>(keep.value + 0.5f), 1, N / 2 + 1);
  const int start = static_cast<int>(position.value * lab::kSampleRate + 0.5f) % loop;

  // The frame, the window, and their product.
  for (int n = 0; n < N; ++n) {
    frame_[n] = lab::in_at(0, start + n);
    window_[n] = hann ? static_cast<float>(0.5 - 0.5 * std::cos(2.0 * lab::kPi * n / N)) : 1.0f;
    windowed_[n] = frame_[n] * window_[n];
  }
  const double full = 0.5 * window_sum(window_, N);
  const float last_ms = 1000.0f * static_cast<float>(N - 1) / lab::kSampleRate;
  lab::Tap* over_frame[] = {&frame_tap,   &window_tap, &windowed_tap, &cosine_tap, &product_tap,
                            &run_cos,     &run_sin,    &rebuilt,      &residual};
  for (lab::Tap* tap : over_frame) {
    if (!tap->open(N)) return;
    tap->x0 = 0.0f;
    tap->x1 = last_ms;
  }
  for (int n = 0; n < N; ++n) {
    frame_tap.set(n, frame_[n]);
    window_tap.set(n, window_[n]);
    windowed_tap.set(n, windowed_[n]);
  }

  // One frequency, by hand: the frame against a cosine and against a sine.
  {
    const double w = 2.0 * lab::kPi * compare.value / lab::kSampleRate;
    // The cosine is drawn as tall as the frame, so the two can be seen together.
    const float tallest = lab::peak(windowed_, N);
    const float height = tallest > 0.0f ? tallest : 1.0f;
    double sum_cos = 0.0, sum_sin = 0.0;
    for (int n = 0; n < N; ++n) {
      const double c = std::cos(w * n);
      const double s = std::sin(w * n);
      sum_cos += windowed_[n] * c;
      sum_sin += windowed_[n] * s;
      cosine_tap.set(n, height * static_cast<float>(c));
      product_tap.set(n, static_cast<float>(windowed_[n] * c));
      run_cos.set(n, static_cast<float>(sum_cos / full));
      run_sin.set(n, static_cast<float>(sum_sin / full));
    }
    match.value = lab::to_db(static_cast<float>(std::sqrt(sum_cos * sum_cos + sum_sin * sum_sin) / full));
  }

  // The kit's transform of the frame.
  for (int n = 0; n < N; ++n) {
    re_[n] = windowed_[n];
    im_[n] = 0.0f;
  }
  fft.forward(re_, im_);

  const int bins = N / 2 + 1;
  lab::Tap* over_bins[] = {&real_tap, &imag_tap, &magnitude, &phase};
  for (lab::Tap* tap : over_bins) {
    if (!tap->open(bins)) return;
    tap->x0 = 0.0f;
    tap->x1 = 0.5f * lab::kSampleRate;
  }
  float largest = 0.0f;
  for (int k = 0; k < bins; ++k) {
    const float size_k = std::sqrt(re_[k] * re_[k] + im_[k] * im_[k]);
    if (size_k > largest) largest = size_k;
  }
  for (int k = 0; k < bins; ++k) {
    const float size_k = std::sqrt(re_[k] * re_[k] + im_[k] * im_[k]);
    real_tap.set(k, re_[k]);
    imag_tap.set(k, im_[k]);
    magnitude.set(k, lab::to_db(static_cast<float>(size_k / full)));
    // A bin 60 dB under the largest has no angle worth drawing.
    phase.set(k, size_k > 1.0e-3f * largest && size_k > 0.0f ? std::atan2(im_[k], re_[k]) : 0.0f);
  }

  // The energy on both sides (Parseval): the bins' squares add up to N times the samples'.
  {
    double in_time = 0.0, in_bins = 0.0;
    for (int n = 0; n < N; ++n) {
      in_time += static_cast<double>(windowed_[n]) * windowed_[n];
      in_bins += static_cast<double>(re_[n]) * re_[n] + static_cast<double>(im_[n]) * im_[n];
    }
    in_bins /= N;
    parseval.value = in_time > 0.0 ? static_cast<float>(std::fabs(in_bins - in_time) / in_time) : 0.0f;
  }

  // The sum written out for the bin nearest the frequency compared.
  {
    const int k = kit::clamp_int(static_cast<int>(compare.value * N / lab::kSampleRate + 0.5f), 0, N / 2);
    double sum_re = 0.0, sum_im = 0.0;
    for (int n = 0; n < N; ++n) {
      const double angle = 2.0 * lab::kPi * k * n / N;
      sum_re += windowed_[n] * std::cos(angle);
      sum_im -= windowed_[n] * std::sin(angle);
    }
    const double apart = std::sqrt((sum_re - re_[k]) * (sum_re - re_[k]) + (sum_im - im_[k]) * (sum_im - im_[k]));
    direct.value = largest > 0.0f ? lab::to_db(static_cast<float>(apart / largest)) : lab::kFloorDb;
  }

  // The real-signal path (forward_real), which the engine's devices use, against forward().
  {
    fft.forward_real([](int n) { return windowed_[n]; }, packed_);
    float worst = 0.0f;
    for (int k = 0; k <= N / 2; ++k) {
      const float packed_im = (k == 0 || k == N / 2) ? 0.0f : packed_[N - k];
      const float a = std::fabs(packed_[k] - re_[k]);
      const float b = std::fabs(packed_im - im_[k]);
      if (a > worst) worst = a;
      if (b > worst) worst = b;
    }
    real_same.value = largest > 0.0f ? lab::to_db(worst / largest) : lab::kFloorDb;
  }

  // Forward then inverse, nothing divided: the frame comes back N times as large.
  for (int n = 0; n < N; ++n) {
    work_re_[n] = re_[n];
    work_im_[n] = im_[n];
  }
  fft.inverse(work_re_, work_im_);
  {
    const float level = lab::rms(windowed_, N);
    unscaled.value = level > 0.0f ? lab::rms(work_re_, N) / (level * N) : 1.0f;
    for (int n = 0; n < N; ++n) work_re_[n] /= N;
    round_trip.value = lab::difference_db(work_re_, windowed_, N);
  }

  // The frame from its first `kept` bins.
  for (int n = 0; n < N; ++n) {
    work_re_[n] = re_[n];
    work_im_[n] = im_[n];
  }
  keep_first<N>(work_re_, work_im_, kept);
  fft.inverse(work_re_, work_im_);
  for (int n = 0; n < N; ++n) {
    work_re_[n] /= N;
    rebuilt.set(n, work_re_[n]);
    residual.set(n, windowed_[n] - work_re_[n]);
  }
  rebuild_null.value = lab::difference_db(work_re_, windowed_, N);

  // The whole loop the same way, frame after frame. With the Hann window the
  // frames overlap by half, where two windows add up to exactly one; with no
  // window they lie end to end.
  const int span = loop + lab::kFadeFrames;
  const int hop = hann ? N / 2 : N;
  float* out[2] = {lab::take(span), lab::take(span)};
  if (!out[0] || !out[1]) return;
  bool same = true;
  for (int i = 0; i < loop && same; ++i) same = lab::in_at(0, i) == lab::in_at(1, i);
  for (int c = 0; c < (same ? 1 : 2); ++c) {
    for (int at = hann ? -hop : 0; at < span; at += hop) {
      for (int n = 0; n < N; ++n) {
        work_re_[n] = lab::in_at(c, at + n + loop) * window_[n];
        work_im_[n] = 0.0f;
      }
      fft.forward(work_re_, work_im_);
      keep_first<N>(work_re_, work_im_, kept);
      fft.inverse(work_re_, work_im_);
      for (int n = 0; n < N; ++n) {
        const int i = at + n;
        if (i >= 0 && i < span) out[c][i] += work_re_[n] / N;
      }
    }
  }
  for (int i = 0; i < span; ++i) {
    in_tap.put(loop + i, lab::in_at(0, i), lab::in_at(1, i));
    out_tap.put(loop + i, out[0][i], out[same ? 0 : 1][i]);
  }
}

// A sine of the lesson's own in a frame of 64, at a frequency given in bins:
// what the kit's transform makes of it bare and under the Hann window.
void run_probe() {
  constexpr int N = kProbeSize;
  static float x[N], w[N], re[N], im[N];
  if (!probe_twice.open(2 * N) || !probe_twice_hann.open(2 * N)) return;
  if (!leak_plain.open(N / 2 + 1) || !leak_hann.open(N / 2 + 1)) return;
  probe_twice.x0 = probe_twice_hann.x0 = 0.0f;
  probe_twice.x1 = probe_twice_hann.x1 = static_cast<float>(2 * N - 1);
  leak_plain.x0 = leak_hann.x0 = 0.0f;
  leak_plain.x1 = leak_hann.x1 = static_cast<float>(N / 2);
  for (int n = 0; n < N; ++n) {
    x[n] = static_cast<float>(std::sin(2.0 * lab::kPi * probe.value * n / N));
    w[n] = static_cast<float>(0.5 - 0.5 * std::cos(2.0 * lab::kPi * n / N));
  }
  for (int n = 0; n < 2 * N; ++n) {
    probe_twice.set(n, x[n % N]);
    probe_twice_hann.set(n, x[n % N] * w[n % N]);
  }
  for (int pass = 0; pass < 2; ++pass) {
    for (int n = 0; n < N; ++n) {
      re[n] = pass == 0 ? x[n] : x[n] * w[n];
      im[n] = 0.0f;
    }
    fft64.forward(re, im);
    // A sine on a bin reads 0 dB either way: N / 2 bare, N / 4 under the window.
    const float full = pass == 0 ? 0.5f * N : 0.25f * N;
    lab::Tap& tap = pass == 0 ? leak_plain : leak_hann;
    for (int k = 0; k <= N / 2; ++k) tap.set(k, lab::to_db(std::sqrt(re[k] * re[k] + im[k] * im[k]) / full));
  }
}

}  // namespace

void lab_setup() {
  fft64.init();
  fft256.init();
  fft1024.init();
  fft4096.init();
}

void lab_render(int frames) {
  (void)frames;
  switch (size.choice()) {
    case 0:
      analyse(fft64);
      break;
    case 1:
      analyse(fft256);
      break;
    case 2:
      analyse(fft1024);
      break;
    default:
      analyse(fft4096);
      break;
  }
  run_probe();
}
