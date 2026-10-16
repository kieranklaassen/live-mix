// The Fourier transform: the kit's own transform (cpp/kit/fft.h,
// kit::Fft<N>) run on one frame of the loop, with every step on the way to
// its bins and back kept as a tap, and beside it Spectral Blur
// (cpp/devices/spectral-blur), the device that runs the same transform on
// every frame of a sound, with everything it does to its bins switched off.
//
//   loop ──► frame (N samples) ──► × window ──► kit::Fft::forward ──► bins
//                                                                      │
//   out ◄── frames added up ◄── ÷ N ◄── kit::Fft::inverse ◄── first K bins kept
//
//   loop ──► Spectral Blur, nothing altered ──► the loop again, 2,304 samples late
//
// Computed by the kit: every bin (real and imaginary part, and the level and
// the angle worked out from them), the frame rebuilt from the bins kept, the
// loop rebuilt frame by frame, and the two spectra of the probe.
// Read from the running device: its output, and the bins of the one of its
// frames that begins nearest the lesson's frame (the "deviceBins" check holds
// them to the kit's plain transform of the same samples, "deviceWire" holds
// its output to its input).
// Written for the lesson: the window (the same raised cosine the engine's
// spectral devices write for themselves), the cosine and the running sums of
// the one-bin picture, and the probe sine. The lab also writes the transform's
// sum out by hand for one bin and reports how far it lands from the kit's bin
// (the "direct" check), measures the energy on both sides of the transform
// ("parseval"), the gain of forward then inverse ("unscaled", "roundTrip"),
// and the real-signal path against the complex one ("realSame").
//
// The build part (lab::Build in lab.h) puts the transform together the slow
// way, on one frame, a piece at a time: one probe sine, a bank of them, the
// window, the way back. It writes the "built" taps and leaves every other tap
// as it was. Two copies of it run on every render: one with the pieces of the
// step chosen, which the taps show, and one with every piece and every bin,
// whose frame is compared with the kit's forward and inverse transform of the
// same samples (the "builtDifference" check; "bank" holds its bins to the
// kit's). A frame is not a sound, so the tap "built" plays what the pieces so
// far make of the one frame over and over, which is how the transform itself
// takes a frame: as one turn of something that repeats for ever.

#include "lab.h"

#include "../../cpp/devices/spectral-blur/spectral_blur.h"

using namespace livemix;

namespace {

constexpr int kMaxSize = 4096;
constexpr int kProbeSize = 64;
constexpr int kDeviceFrame = SpectralBlur::kFrame;

kit::Fft<64> fft64;
kit::Fft<256> fft256;
kit::Fft<1024> fft1024;
kit::Fft<4096> fft4096;
kit::Fft<kDeviceFrame> device_fft;  // the kit's plain transform at the device's frame length
SpectralBlur blur;

lab::Control position{"position", "Frame starts at", "s", 0.0f, 4.0f, 0.1f};
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
lab::Tap device_level{"deviceLevel", "Bins of the device's own frame, level", lab::kSpectrum, lab::kDevice, 1, "dB"};
lab::Tap device_tap{"device", "Out of Spectral Blur, nothing altered", lab::kAudio, lab::kDevice, 2};
lab::Tap removed{"removed", "The loop, less its rebuild", lab::kAudio, lab::kLesson, 2};
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
lab::Check device_bins{"deviceBins", "The device's bins of its frame, against the kit's plain transform of the same samples",
                       "dB"};
lab::Check device_frame{"deviceFrame", "The device's frame begins this far from the lesson's", "samples"};
lab::Check device_wire{"deviceWire", "Out of the device, against what went in 2,304 samples before", "dB"};

float frame_[kMaxSize];
float window_[kMaxSize];
float windowed_[kMaxSize];
float re_[kMaxSize];  // the frame's bins, as the kit leaves them
float im_[kMaxSize];
float work_re_[kMaxSize];
float work_im_[kMaxSize];
float packed_[kMaxSize];

// Where the frame starts in the loop, in samples.
int frame_start() {
  const int loop = lab::frames();
  return loop > 0 ? static_cast<int>(position.value * lab::kSampleRate + 0.5f) % loop : 0;
}

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
  const int start = frame_start();

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
    const float left = out[0][i];
    const float right = out[same ? 0 : 1][i];
    in_tap.put(loop + i, lab::in_at(0, i), lab::in_at(1, i));
    removed.put(loop + i, lab::in_at(0, i) - left, lab::in_at(1, i) - right);
    out_tap.put(loop + i, left, right);
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

// --- the device: Spectral Blur with nothing altered -------------------------------------------

float device_re_[kDeviceFrame / 2 + 1];  // the bins of the device's frame nearest the lesson's
float device_im_[kDeviceFrame / 2 + 1];

// A place in the loop from a place that may lie before its start or after its end.
float loop_at(int channel, int i) {
  const int loop = lab::frames();
  return lab::in(channel)[((i % loop) + loop) % loop];
}

// Spectral Blur with everything it does to its bins switched off. What is
// left is the transform at work on a running sound: every 512 samples the
// device cuts a frame of 2,048, windows it, transforms it, transforms it back,
// windows it again and adds it to its output. `target` is where the lesson's
// frame starts, as a place in the pass that is kept.
void run_device(int target) {
  using namespace spectral_blur;
  constexpr int kBlock = 16;
  // What the device remembers with Blur at 0 is a frame and its latency. Of
  // the pass that is thrown away it is played twice that and more.
  constexpr int kWarm = 4 * kDeviceFrame;
  const int loop = lab::frames();

  blur.init(lab::kSampleRate);
  blur.set_param(kBlur, 0.0f);
  blur.set_param(kSmear, 0.0f);
  blur.set_param(kFreeze, 0.0f);
  blur.set_param(kTilt, 0.0f);
  blur.set_param(kLowCut, kParamMin[kLowCut]);
  blur.set_param(kHighCut, kParamMax[kHighCut]);
  blur.set_param(kShimmer, 0.0f);
  blur.set_param(kWidth, 0.0f);
  blur.set_param(kMix, 1.0f);

  // The device cuts a frame wherever its count of samples is a multiple of
  // 512. It is started where one of those frames will be the lesson's own.
  int first = loop > kWarm ? loop - kWarm : 0;
  first += (target - first) % SpectralBlur::kHop;

  int awake = 0;  // samples the device has run without resting
  int nearest = -1;
  int nearest_apart = 0;
  double apart = 0.0, whole = 0.0;
  for (int i = first; i < lab::total(); i += kBlock) {
    const int count = lab::total() - i < kBlock ? lab::total() - i : kBlock;
    const uint32_t before = blur.position_;
    for (int j = 0; j < count; ++j) {
      blur.in_left()[j] = lab::in_at(0, i + j);
      blur.in_right()[j] = lab::in_at(1, i + j);
    }
    blur.process(count);
    const bool ran = blur.position_ != before;
    // A frame of the left channel is transformed on the sample that finds the
    // count at a multiple of 512: it is the 2,048 samples before that one.
    if (ran && (before & (SpectralBlur::kHop - 1)) == 0 && awake >= kDeviceFrame) {
      const int begins = i - kDeviceFrame;
      int from = (begins - target) % loop;
      if (from < 0) from += loop;
      if (from > loop / 2) from -= loop;
      if (nearest < 0 || std::abs(from) < std::abs(nearest_apart)) {
        nearest = begins;
        nearest_apart = from;
        for (int k = 0; k <= kDeviceFrame / 2; ++k) {
          device_re_[k] = blur.channel_[0].last_re[k];
          device_im_[k] = blur.channel_[0].last_im[k];
        }
      }
    }
    awake = ran ? awake + count : 0;
    for (int j = 0; j < count; ++j) {
      const float left = blur.out_left()[j];
      device_tap.put(i + j, left, blur.out_right()[j]);
      if (i + j >= loop && i + j < 2 * loop) {
        const double went_in = loop_at(0, i + j - SpectralBlur::kLatency);
        apart += (left - went_in) * (left - went_in);
        whole += went_in * went_in;
      }
    }
  }
  device_wire.value = lab::ratio_db(apart, whole);

  // The bins of that frame as the device left them, and the kit's plain
  // transform of the same 2,048 samples under the device's own window.
  constexpr int kBins = kDeviceFrame / 2 + 1;
  if (!device_level.open(kBins)) return;
  device_level.x0 = 0.0f;
  device_level.x1 = 0.5f * lab::kSampleRate;
  if (nearest < 0) {
    for (int k = 0; k < kBins; ++k) device_level.set(k, lab::kFloorDb);
    device_bins.value = lab::kFloorDb;
    return;
  }
  static float re[kDeviceFrame], im[kDeviceFrame];
  for (int n = 0; n < kDeviceFrame; ++n) {
    re[n] = lab::in_at(0, nearest + n) * blur.window_[n];
    im[n] = 0.0f;
  }
  device_fft.forward(re, im);
  float worst = 0.0f, largest = 0.0f;
  for (int k = 0; k < kBins; ++k) {
    const float size_k = std::sqrt(device_re_[k] * device_re_[k] + device_im_[k] * device_im_[k]);
    if (size_k > largest) largest = size_k;
    worst = kit::max(worst, kit::max(std::fabs(re[k] - device_re_[k]), std::fabs(im[k] - device_im_[k])));
    // A full-scale sine on a bin reads 0 dB: a quarter of the frame's length under the window.
    device_level.set(k, lab::to_db(size_k / (0.25f * kDeviceFrame)));
  }
  device_bins.value = largest > 0.0f ? lab::to_db(worst / largest) : lab::kFloorDb;
  device_frame.value = static_cast<float>(nearest_apart);
}

// --- the build part: one frame, a piece at a time ----------------------------------------------

double turn_cos[kMaxSize];  // one turn of a cosine and of a sine in N steps
double turn_sin[kMaxSize];
int turn_size = 0;

void turn_in(int steps) {
  if (turn_size == steps) return;
  for (int n = 0; n < steps; ++n) {
    turn_cos[n] = std::cos(2.0 * lab::kPi * n / steps);
    turn_sin[n] = std::sin(2.0 * lab::kPi * n / steps);
  }
  turn_size = steps;
}

// The transform so far: one function a piece, and run() to take a frame
// through the pieces there are.
struct Built {
  // The pieces, in the order the steps add them.
  enum Piece : int { kProbe = 0, kBank, kWindow, kBack };

  int pieces = kProbe;
  int size = kMaxSize;                 // N, the frame's length
  float frame[kMaxSize] = {};          // the frame the probes are given
  double found_cos[kMaxSize / 2 + 1];  // what each probe found: its sum against the cosine,
  double found_sin[kMaxSize / 2 + 1];  // and its sum against the sine
  double answers[kMaxSize] = {};       // the answers of the probes, added up

  void cut(int start) {
    for (int n = 0; n < size; ++n) frame[n] = lab::in_at(0, start + n);
  }

  // One probe sine: a cosine and a sine that turn k times in the frame, each
  // multiplied by the frame sample by sample, and the products added up.
  void probe(int k) {
    double with_cos = 0.0, with_sin = 0.0;
    for (int n = 0; n < size; ++n) {
      const int at = (k * n) & (size - 1);  // where the probe stands in its turn at sample n
      with_cos += frame[n] * turn_cos[at];
      with_sin += frame[n] * turn_sin[at];
    }
    found_cos[k] = with_cos;
    found_sin[k] = with_sin;
  }

  // What a probe found, as a wave: the same cosine and sine, each as tall as
  // its sum says, over N. A probe above bin 0 and below the last answers for
  // its mirror too, so it counts twice.
  void answer(int k) {
    const double share = (k == 0 || k == size / 2 ? 1.0 : 2.0) / size;
    for (int n = 0; n < size; ++n) {
      const int at = (k * n) & (size - 1);
      answers[n] += share * (found_cos[k] * turn_cos[at] + found_sin[k] * turn_sin[at]);
    }
  }

  // A bank of probes: one for every bin, from no turns in the frame to half a turn a sample.
  void bank() {
    for (int k = 0; k <= size / 2; ++k) probe(k);
  }

  // The window: the frame fades in from nothing and out to nothing before
  // any probe sees it. It is one turn of the slowest probe's cosine, stood on end.
  void window() {
    for (int n = 0; n < size; ++n) frame[n] *= static_cast<float>(0.5 - 0.5 * turn_cos[n]);
  }

  // The way back: the answers of the first `kept` probes, added up.
  void back(int kept) {
    for (int n = 0; n < size; ++n) answers[n] = 0.0;
    for (int k = 0; k < kept; ++k) answer(k);
  }

  // Until there is a way back, the one probe's answer stands alone.
  void alone(int k) {
    for (int n = 0; n < size; ++n) answers[n] = 0.0;
    answer(k);
  }

  // The frame that starts at `start` through the pieces built so far. `k` is
  // the bin the one probe stands at, `kept` how many probes the way back adds.
  void run(int start, int k, int kept) {
    cut(start);
    if (pieces >= kWindow) window();
    if (pieces >= kBank) bank();
    if (pieces < kBank) probe(k);
    if (pieces >= kBack) back(kept);
    if (pieces < kBack) alone(k);
  }

  void start(int pieces_, int size_) {
    pieces = pieces_;
    size = size_;
  }
};

lab::Build build{"One probe sine|A bank of probes|The window|The way back", Built::kBack, -120.0f,
                 "The frame through the bank and back with every bin, against the kit's forward and inverse transform"};

lab::Tap built{"built", "What the probes found, played round and round", lab::kAudio, lab::kLesson, 1};
lab::Tap built_frame{"builtFrame", "The frame the probes are given", lab::kCurve, lab::kLesson, 1};
lab::Tap built_probe{"builtProbe", "The probe's cosine, at the frame's height", lab::kCurve, lab::kLesson, 1};
lab::Tap built_product{"builtProduct", "Frame times the probe's cosine", lab::kCurve, lab::kLesson, 1};
lab::Tap built_bins{"builtBins", "What each probe found, as a level", lab::kSpectrum, lab::kLesson, 1, "dB"};
lab::Tap built_answer{"builtAnswer", "The probes' answers, added up", lab::kCurve, lab::kLesson, 1};

lab::Check bank_same{"bank", "The bank's bins, against the kit's bins of the same frame", "dB"};

Built shown;  // at the step the reader chose: what the built taps hold
Built held;   // with every piece and every bin: what is compared with the kit

template <int N>
void construct(const kit::Fft<N>& fft) {
  const int loop = lab::frames();
  const int start = frame_start();
  const int k = kit::clamp_int(static_cast<int>(compare.value * N / lab::kSampleRate + 0.5f), 0, N / 2);
  const int kept = kit::clamp_int(static_cast<int>(keep.value + 0.5f), 1, N / 2 + 1);
  turn_in(N);

  // Every piece and every bin, against the kit: its bins, and the frame it returns.
  held.start(Built::kBack, N);
  held.run(start, k, N / 2 + 1);
  for (int n = 0; n < N; ++n) {
    work_re_[n] = held.frame[n];
    work_im_[n] = 0.0f;
  }
  fft.forward(work_re_, work_im_);
  {
    double worst = 0.0, largest = 0.0;
    for (int j = 0; j <= N / 2; ++j) {
      // The kit's sine turns the other way: its imaginary part is minus the sum against the sine.
      const double re_apart = held.found_cos[j] - work_re_[j];
      const double im_apart = -held.found_sin[j] - work_im_[j];
      worst = kit::max(worst, std::sqrt(re_apart * re_apart + im_apart * im_apart));
      largest = kit::max(largest, std::sqrt(static_cast<double>(work_re_[j]) * work_re_[j] +
                                            static_cast<double>(work_im_[j]) * work_im_[j]));
    }
    bank_same.value = largest > 0.0 ? lab::to_db(static_cast<float>(worst / largest)) : lab::kFloorDb;
  }
  fft.inverse(work_re_, work_im_);
  {
    double differs = 0.0, whole = 0.0;
    for (int n = 0; n < N; ++n) {
      const double returned = static_cast<double>(work_re_[n]) / N;
      differs += (held.answers[n] - returned) * (held.answers[n] - returned);
      whole += returned * returned;
    }
    build.difference.value = lab::ratio_db(differs, whole);
  }

  // The step the reader chose.
  const bool whole_build = build.at() >= Built::kBack;
  Built& front = whole_build ? held : shown;
  if (whole_build) {
    held.back(kept);
  } else {
    shown.start(build.at(), N);
    shown.run(start, k, kept);
  }

  const float last_ms = 1000.0f * static_cast<float>(N - 1) / lab::kSampleRate;
  lab::Tap* over_frame[] = {&built_frame, &built_probe, &built_product, &built_answer};
  for (lab::Tap* tap : over_frame) {
    if (!tap->open(N)) return;
    tap->x0 = 0.0f;
    tap->x1 = last_ms;
  }
  const float tallest = lab::peak(front.frame, N);
  const float height = tallest > 0.0f ? tallest : 1.0f;
  for (int n = 0; n < N; ++n) {
    const double c = turn_cos[(k * n) & (N - 1)];
    built_frame.set(n, front.frame[n]);
    built_probe.set(n, height * static_cast<float>(c));
    built_product.set(n, static_cast<float>(front.frame[n] * c));
    built_answer.set(n, static_cast<float>(front.answers[n]));
  }

  // The level each probe found, where a full-scale sine on a bin reads 0 dB:
  // half the frame's length with no window, a quarter of it under the window.
  if (!built_bins.open(N / 2 + 1)) return;
  built_bins.x0 = 0.0f;
  built_bins.x1 = 0.5f * lab::kSampleRate;
  const double full = (front.pieces >= Built::kWindow ? 0.25 : 0.5) * N;
  for (int j = 0; j <= N / 2; ++j) {
    const bool asked = front.pieces >= Built::kBank || j == k;
    const double size_j = asked ? std::sqrt(front.found_cos[j] * front.found_cos[j] + front.found_sin[j] * front.found_sin[j]) : 0.0;
    built_bins.set(j, lab::to_db(static_cast<float>(size_j / full)));
  }

  // The frame is not a sound until it is played, so it is played round and
  // round, in step with where it was cut from.
  const int offset = N - start % N;
  for (int i = 0; i < loop + lab::kFadeFrames; ++i) {
    built.put(loop + i, static_cast<float>(front.answers[(i + offset) & (N - 1)]));
  }
}

template <int N>
void run(const kit::Fft<N>& fft) {
  analyse(fft);
  construct(fft);
}

}  // namespace

void lab_setup() {
  fft64.init();
  fft256.init();
  fft1024.init();
  fft4096.init();
  device_fft.init();
}

void lab_render(int frames) {
  switch (size.choice()) {
    case 0:
      run(fft64);
      break;
    case 1:
      run(fft256);
      break;
    case 2:
      run(fft1024);
      break;
    default:
      run(fft4096);
      break;
  }
  run_probe();
  run_device(frames + frame_start());
}
