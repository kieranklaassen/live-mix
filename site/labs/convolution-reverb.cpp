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
// Three samples set by hand show what the sum is made of: each lays down a
// copy of the impulse at its own time and of its own size, and the copies
// are added. One sample holds little energy, so its copy is far quieter than
// a loop: the impulse and its copies are turned up to be heard, all by one
// gain, which puts the impulse's largest sample at one half (the "lift"
// check says by how much).
//
// The build part (lab::Build in lab.h) puts the reverb together out of the
// loop's own samples, on taps of its own: one sample stamps the impulse; three
// do, and the stamps are added; a run of 240 samples does, one stamp at a
// time, which is the sum as it is written; then every sample at once, by the
// product of spectra; then the dry loop beside it. The step that is held to
// the engine is the fourth: one unit sample goes through the same product of
// spectra, and what comes out must be the impulse the engine wrote. The last
// step, the send, is the lesson's own. The first three steps are a few stamps
// out of many and far quieter than the whole, so each is turned up until its
// largest sample is one half (the "builtLift" check says by how much).
//
// The convolution is the costly part, and most moves of a control (the send,
// the three samples, the build step) leave the loop and the room as they
// were. So its answer is kept from one render to the next, with the loop and
// the impulse it was made from, and worked out again only when one of them
// has changed. What depends on the room alone (the unit sample's answer, the
// room's response) is worked out again only when the room has changed.
//
// lab-memory-mb: 144

#define LAB_AUX
#include "lab.h"

#include <cstring>

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
// Three samples set by hand: how large each is.
lab::Control one{"one", "Sample one", "", 0.0f, 1.0f, 1.0f};
lab::Control two{"two", "Sample two", "", 0.0f, 1.0f, 0.5f};
lab::Control three{"three", "Sample three", "", 0.0f, 1.0f, 0.75f};

lab::Tap impulse{"impulse", "The room's impulse", lab::kAudio, lab::kEngine, 2};
lab::Tap room{"room", "The impulse, turned up", lab::kAudio, lab::kEngine, 2};
lab::Tap hand{"hand", "Three samples", lab::kAudio, lab::kLesson, 1};
lab::Tap stamp_one{"stampOne", "Copy for sample one", lab::kAudio, lab::kLesson, 1};
lab::Tap stamp_two{"stampTwo", "Copy for sample two", lab::kAudio, lab::kLesson, 1};
lab::Tap stamp_three{"stampThree", "Copy for sample three", lab::kAudio, lab::kLesson, 1};
lab::Tap hand_sum{"handSum", "The three copies added", lab::kAudio, lab::kLesson, 2};
lab::Tap in_tap{"in", "Input", lab::kAudio, lab::kSource, 2};
lab::Tap wet{"wet", "Convolved with the room", lab::kAudio, lab::kLesson, 2};
lab::Tap out_tap{"out", "Output", lab::kAudio, lab::kLesson, 2};
lab::Tap decay_curve{"energy", "Energy still to come", lab::kCurve, lab::kLesson, 1, "dB"};
lab::Tap picture{"picture", "The impulse's spectrum over time", lab::kFrames, lab::kLesson, 1, "dB"};
lab::Tap response{"response", "What the room does to each frequency", lab::kSpectrum, lab::kLesson, 1, "dB"};
lab::Tap response_mean{"responseMean", "The same, averaged over a third of an octave", lab::kSpectrum, lab::kLesson, 1,
                       "dB"};
lab::Tap direct{"direct", "The sum, term by term", lab::kCurve, lab::kLesson, 1};
lab::Tap spectral{"spectral", "The product of spectra", lab::kCurve, lab::kLesson, 1};

lab::Check sums{"sums", "The product of spectra against the sum done term by term", "dB"};
lab::Check lift{"lift", "The impulse and its copies are turned up to be heard, by", "dB"};
lab::Check built_lift{"builtLift", "This step is turned up to be heard, by", "dB"};

lab::Tap built_in{"builtIn", "Samples stamped so far", lab::kAudio, lab::kSource, 2};
lab::Tap built{"built", "What is built so far", lab::kAudio, lab::kLesson, 2};

// The pieces of the build, in the order the steps add them.
enum Piece : int { kOneStamp = 0, kThreeStamps, kRun, kEverySample, kBesideDry };

lab::Build build{"One sample, one stamp|Three samples, three stamps|A run of samples|Every sample, by transform|"
                 "Beside the dry sound",
                 kEverySample, -120.0f,
                 "One unit sample through the build's product of spectra, against the engine's own impulse"};

// Two sizes of the kit's transform: a loop of up to 5.4 s fits the smaller.
kit::Fft<1 << 19> fft_small;
kit::Fft<1 << 20> fft_large;

// One sample stamps the impulse: it lays down a copy of the room's answer
// that starts at the sample's own place, `k`, and is as large as the sample
// is. `h` is the impulse folded onto the loop and `reach` how much of it is
// in use; `j` counts along it. A copy that runs past the loop's end comes
// round to its start, as the tail of one pass rings on over the next.
void stamp(float sample, int k, const float* h, int reach, int frames, float* y) {
  const int fits = reach < frames - k ? reach : frames - k;
  for (int j = 0; j < fits; ++j) y[k + j] += sample * h[j];
  for (int j = fits; j < reach; ++j) y[k + j - frames] += sample * h[j];
}

// Three samples, three stamps, and the stamps are added: `y` holds the sum.
void stamp_three_samples(const float* x, const int k[3], const float* h, int reach, int frames, float* y) {
  stamp(x[k[0]], k[0], h, reach, frames, y);
  stamp(x[k[1]], k[1], h, reach, frames, y);
  stamp(x[k[2]], k[2], h, reach, frames, y);
}

// A run of the loop, one stamp for each of its samples: the sum as it is
// written. Each sample costs one multiplication for every sample of the
// impulse in use, which is why the run is short.
constexpr int kRunSamples = 240;

void stamp_run(const float* x, int from, const float* h, int reach, int frames, float* y) {
  for (int r = 0; r < kRunSamples; ++r) {
    const int k = (from + r) % frames;
    stamp(x[k], k, h, reach, frames, y);
  }
}

// Left and right ride through one transform together, as its real and its
// imaginary part, with zeros after them so that the plain convolution fits.
template <int N>
void load(const float* const s[2], int count, float* re, float* im) {
  for (int n = 0; n < count; ++n) {
    re[n] = s[0][n];
    im[n] = s[1][n];
  }
  for (int n = count; n < N; ++n) re[n] = im[n] = 0.0f;
}

// Convolution in time is this, in frequency: one multiplication a bin. The
// sound's spectrum, in `xr` and `xi`, becomes the sound's times the room's.
//
// The transform of a real signal mirrors itself (bin N - b is the conjugate
// of bin b), so the left and the right spectrum come apart again from the one
// transform that carried both:
//
//   L[b] = (Z[b] + conj(Z[N-b])) / 2        R[b] = (Z[b] - conj(Z[N-b])) / 2i
//
// The products go back the same way, as L + iR, and one inverse returns the
// left answer in the real part and the right one in the imaginary part.
template <int N>
void multiply(float* xr, float* xi, const float* hr, const float* hi) {
  for (int b = 0; b <= N / 2; ++b) {
    const int m = (N - b) & (N - 1);
    // The left and right spectra of the sound and of the impulse, at bin b.
    const float xlr = 0.5f * (xr[b] + xr[m]), xli = 0.5f * (xi[b] - xi[m]);
    const float xrr = 0.5f * (xi[b] + xi[m]), xri = 0.5f * (xr[m] - xr[b]);
    const float hlr = 0.5f * (hr[b] + hr[m]), hli = 0.5f * (hi[b] - hi[m]);
    const float hrr = 0.5f * (hi[b] + hi[m]), hri = 0.5f * (hr[m] - hr[b]);
    // Two complex numbers multiplied: the sizes multiply and the angles add.
    const float lr = xlr * hlr - xli * hli, li = xlr * hli + xli * hlr;
    const float rr = xrr * hrr - xri * hri, ri = xrr * hri + xri * hrr;
    // Packed again as L + iR, at bin b and at its mirror.
    xr[b] = lr - ri;
    xi[b] = li + rr;
    xr[m] = lr + ri;
    xi[m] = rr - li;
  }
}

// Back from the transform: divided by N, which the kit's inverse leaves to
// its caller, and folded onto the loop. What ran past the loop's end is the
// tail that is still ringing when the loop comes round.
template <int N>
void fold(const float* re, const float* im, int count, float* const y[2]) {
  const float scale = 1.0f / static_cast<float>(N);
  for (int n = 0; n < count; ++n) {
    y[0][n] = re[n] * scale;
    y[1][n] = im[n] * scale;
  }
  for (int n = count; n < 2 * count - 1; ++n) {
    y[0][n - count] += re[n] * scale;
    y[1][n - count] += im[n] * scale;
  }
}

// Every sample at once: the sum of all the stamps, by the product of spectra.
// `hr` and `hi` hold the room's spectrum; `xr` and `xi` are room to work in.
template <int N>
void by_transform(const kit::Fft<N>& fft, const float* const x[2], const float* hr, const float* hi, int count,
                  float* xr, float* xi, float* const y[2]) {
  load<N>(x, count, xr, xi);
  fft.forward(xr, xi);
  multiply<N>(xr, xi, hr, hi);
  fft.inverse(xr, xi);
  fold<N>(xr, xi, count, y);
}

// The send: the dry sound `x` as it was, and the reverb `y` beside it at the
// send's gain `g`. The dry sound is never turned down.
void beside_dry(const float* x, const float* y, float g, int frames, float* o) {
  for (int n = 0; n < frames; ++n) o[n] = x[n] + g * y[n];
}

// One unit sample's spectrum, both channels in one transform: worked out
// once for a size of transform, by the kit, and kept.
float unit_re[1 << 20];
float unit_im[1 << 20];
int unit_size = 0;

// The room's response is read at these frequencies, in even ratios.
constexpr int kResponsePoints = 241;
constexpr float kResponseLow = 20.0f;
constexpr float kResponseHigh = 20000.0f;

// What is kept between renders: the loop and the folded impulse of the last
// convolution and its answer; what the room alone decides (how far one unit
// sample through it landed from the impulse, and its response); and the run
// of stamps, once it has been asked for.
struct Kept {
  int frames = 0;
  float x[2][lab::kMaxFrames];
  float h[2][lab::kMaxFrames];
  float wet[2][lab::kMaxFrames];
  float difference = 0.0f;
  float response[kResponsePoints];
  float response_mean[kResponsePoints];
  bool run_made = false;
  float run[2][lab::kMaxFrames];
};
Kept kept;

bool same_as_kept(const float* const now[2], const float kept_one[2][lab::kMaxFrames], int frames) {
  if (kept.frames != frames) return false;
  const size_t bytes = static_cast<size_t>(frames) * sizeof(float);
  return std::memcmp(kept_one[0], now[0], bytes) == 0 && std::memcmp(kept_one[1], now[1], bytes) == 0;
}

// What the room does to each frequency, read off its spectrum: the left
// channel's power at the bin nearest each frequency, and the mean power of
// the bins a sixth of an octave either side of it.
template <int N>
void read_response(const float* hr, const float* hi) {
  const double bin = static_cast<double>(lab::kSampleRate) / N;
  const auto power = [&](int k) {
    const int m = N - k;
    const double re = 0.5 * (static_cast<double>(hr[k]) + hr[m]);
    const double im = 0.5 * (static_cast<double>(hi[k]) - hi[m]);
    return re * re + im * im;
  };
  const double sixth = std::pow(2.0, 1.0 / 6.0);
  for (int p = 0; p < kResponsePoints; ++p) {
    const double hz =
        kResponseLow * std::pow(static_cast<double>(kResponseHigh) / kResponseLow, p / (kResponsePoints - 1.0));
    const int at = static_cast<int>(hz / bin + 0.5);
    kept.response[p] = lab::power_to_db(static_cast<float>(power(at)));
    const int from = static_cast<int>(hz / sixth / bin + 0.5);
    const int to = static_cast<int>(hz * sixth / bin + 0.5);
    double sum = 0.0;
    for (int k = from; k <= to; ++k) sum += power(k);
    kept.response_mean[p] = lab::power_to_db(static_cast<float>(sum / (to - from + 1)));
  }
}

// One unit sample through the same product of spectra: its spectrum times
// the room's, and back. What comes out is set against the impulse itself, in
// dB: by the engine's own account of an impulse response they are the same.
template <int N>
float unit_sample_through(const kit::Fft<N>& fft, const float* const h[2], const float* hr, const float* hi,
                          int count, float* xr, float* xi) {
  if (unit_size != N) {
    for (int n = 0; n < N; ++n) unit_re[n] = unit_im[n] = 0.0f;
    unit_re[0] = unit_im[0] = 1.0f;
    fft.forward(unit_re, unit_im);
    unit_size = N;
  }
  float* const answer[2] = {lab::take(count), lab::take(count)};
  if (!answer[0] || !answer[1]) return 0.0f;
  std::memcpy(xr, unit_re, N * sizeof(float));
  std::memcpy(xi, unit_im, N * sizeof(float));
  multiply<N>(xr, xi, hr, hi);
  fft.inverse(xr, xi);
  fold<N>(xr, xi, count, answer);
  double diff = 0.0, ref = 0.0;
  for (int c = 0; c < 2; ++c) {
    for (int n = 0; n < count; ++n) {
      const double d = static_cast<double>(answer[c][n]) - h[c][n];
      diff += d * d;
      ref += static_cast<double>(h[c][n]) * h[c][n];
    }
  }
  return lab::ratio_db(diff, ref);
}

// The loop through the room, into what is kept. The room's spectrum is
// worked out first; when the room has changed, so is what the room alone
// decides.
template <int N>
void through_room(const kit::Fft<N>& fft, const float* const x[2], const float* const h[2], int count,
                  bool room_changed) {
  const int mark = lab::g_arena_used;
  float* xr = lab::take(N);
  float* xi = lab::take(N);
  float* hr = lab::take(N);
  float* hi = lab::take(N);
  if (xr && xi && hr && hi) {
    load<N>(h, count, hr, hi);
    fft.forward(hr, hi);
    if (room_changed) {
      kept.difference = unit_sample_through<N>(fft, h, hr, hi, count, xr, xi);
      read_response<N>(hr, hi);
    }
    float* const y[2] = {kept.wet[0], kept.wet[1]};
    by_transform<N>(fft, x, hr, hi, count, xr, xi, y);
  }
  lab::g_arena_used = mark;
}

// The loudest sample of a stretch of the loop, by the two channels' sizes together.
int loudest(const float* const x[2], int from, int to) {
  int at = from;
  float top = -1.0f;
  for (int n = from; n < to; ++n) {
    const float size = std::fabs(x[0][n]) + std::fabs(x[1][n]);
    if (size > top) {
      top = size;
      at = n;
    }
  }
  return at;
}

// The gain that puts a sound's largest sample at one half, and 1 for silence.
float lift_of(const float* const y[2], int frames) {
  const float left = lab::peak(y[0], frames);
  const float right = lab::peak(y[1], frames);
  const float top = left > right ? left : right;
  return top > 0.0f ? 0.5f / top : 1.0f;
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

  // y[n] = sum over j of h[j] x[n - j]: every sample of the impulse is one
  // echo of the sound, j samples late and h[j] times as large.
  for (int n = 0; n < kExcerptOut; ++n) {
    double sum = 0.0;
    for (int j = 0; j < taps; ++j) {
      const int k = n - j;
      if (k < 0) break;
      if (k < samples) sum += static_cast<double>(h[first + j]) * x[k];
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
  for (int b = 0; b < lab::kSpectrumSize; ++b) {
    const float re = xr[b] * hr[b] - xi[b] * hi[b];
    const float im = xr[b] * hi[b] + xi[b] * hr[b];
    xr[b] = re;
    xi[b] = im;
  }
  lab::g_spectrum_fft.inverse(xr, xi);
  for (int n = 0; n < kExcerptOut; ++n) spectral.data[n] = xr[n] / static_cast<float>(lab::kSpectrumSize);
  sums.value = lab::difference_db(spectral.data, direct.data, kExcerptOut);
}

// Three samples set by hand, early in the loop and three fortieths of it
// apart (0.3 s of a loop of 4 s), and what each lays down: a copy of the
// impulse at its own time and of its own size. The copies are of the impulse
// as it is turned up to be heard.
void by_hand(int frames, int reach) {
  if (!hand.open(frames) || !stamp_one.open(frames) || !stamp_two.open(frames) || !stamp_three.open(frames) ||
      !hand_sum.open(frames)) {
    return;
  }
  const int k[3] = {frames / 40, 4 * (frames / 40), 7 * (frames / 40)};
  const float size[3] = {one.value, two.value, three.value};
  lab::Tap* copies[3] = {&stamp_one, &stamp_two, &stamp_three};
  for (int s = 0; s < 3; ++s) {
    hand.data[k[s]] = size[s];
    stamp(size[s], k[s], room.channel(0), reach, frames, copies[s]->data);
    for (int c = 0; c < 2; ++c) stamp(size[s], k[s], room.channel(c), reach, frames, hand_sum.channel(c));
  }
}

// The build: the reverb so far, out of the loop's own samples.
void build_path(const float* const x[2], const float* const h[2], int reach, int frames, float gain) {
  if (!built_in.open(frames) || !built.open(frames)) return;
  const int step = build.at();
  // The loudest sample in each of the loop's last three quarters. The first
  // quarter is left out, so that the first stamp does not stand on the edge
  // of the picture.
  const int quarter = frames / 4;
  const int k[3] = {loudest(x, quarter, 2 * quarter), loudest(x, 2 * quarter, 3 * quarter),
                    loudest(x, 3 * quarter, frames)};

  for (int c = 0; c < 2; ++c) {
    float* stamped = built_in.channel(c);
    float* y = built.channel(c);
    if (step == kOneStamp) {
      stamped[k[0]] = x[c][k[0]];
      stamp(x[c][k[0]], k[0], h[c], reach, frames, y);
    } else if (step == kThreeStamps) {
      for (int s = 0; s < 3; ++s) stamped[k[s]] = x[c][k[s]];
      stamp_three_samples(x[c], k, h[c], reach, frames, y);
    } else if (step == kRun) {
      for (int r = 0; r < kRunSamples; ++r) stamped[(k[0] + r) % frames] = x[c][(k[0] + r) % frames];
      if (!kept.run_made) stamp_run(x[c], k[0], h[c], reach, frames, kept.run[c]);
      for (int n = 0; n < frames; ++n) y[n] = kept.run[c][n];
    } else {
      // Every sample: the product of spectra has done the whole sum already.
      for (int n = 0; n < frames; ++n) stamped[n] = x[c][n];
      if (step == kEverySample) {
        for (int n = 0; n < frames; ++n) y[n] = kept.wet[c][n];
      } else {
        beside_dry(x[c], kept.wet[c], gain, frames, y);
      }
    }
  }
  if (step == kRun) kept.run_made = true;

  // A few stamps out of many are far quieter than the whole: turned up to be heard.
  if (step < kEverySample) {
    float* const y[2] = {built.channel(0), built.channel(1)};
    const float up = lift_of(y, frames);
    for (int c = 0; c < 2; ++c) {
      for (int n = 0; n < frames; ++n) y[c][n] *= up;
    }
    built_lift.value = lab::to_db(up);
  }
}

}  // namespace

void lab_setup() {
  fft_small.init();
  fft_large.init();
}

void lab_render(int frames) {
  const int length = lab::aux_frames();
  if (!impulse.open(frames) || !room.open(frames) || !in_tap.open(frames) || !wet.open(frames) ||
      !out_tap.open(frames)) {
    return;
  }

  // The part of the impulse in use, folded onto the loop.
  const int cut_at = static_cast<int>(used.value * 0.001f * lab::kSampleRate);
  const int heard = cut_at < length ? cut_at : length;
  const int reach = heard < frames ? heard : frames;
  for (int c = 0; c < 2; ++c) {
    const float* h = lab::aux(c);
    float* folded = impulse.channel(c);
    for (int n = 0; n < heard; ++n) folded[n % frames] += h[n];
  }

  const float* const x[2] = {lab::in(0), lab::in(1)};
  const float* const h[2] = {impulse.channel(0), impulse.channel(1)};
  const bool room_changed = !same_as_kept(h, kept.h, frames);
  if (room_changed || !same_as_kept(x, kept.x, frames)) {
    if (2 * frames - 1 <= fft_small.kSize) {
      through_room(fft_small, x, h, frames, room_changed);
    } else {
      through_room(fft_large, x, h, frames, room_changed);
    }
    kept.frames = frames;
    const size_t bytes = static_cast<size_t>(frames) * sizeof(float);
    for (int c = 0; c < 2; ++c) {
      std::memcpy(kept.x[c], x[c], bytes);
      std::memcpy(kept.h[c], h[c], bytes);
      std::memset(kept.run[c], 0, bytes);
    }
    kept.run_made = false;
  }
  build.difference.value = kept.difference;

  const float gain = kit::db_to_gain(send.value);
  const float up = lift_of(h, frames);
  lift.value = lab::to_db(up);
  for (int c = 0; c < 2; ++c) {
    float* dry = in_tap.channel(c);
    float* answer = wet.channel(c);
    float* sum = out_tap.channel(c);
    float* loud = room.channel(c);
    for (int n = 0; n < frames; ++n) {
      dry[n] = x[c][n];
      answer[n] = kept.wet[c][n];
      loud[n] = up * h[c][n];
    }
    beside_dry(x[c], kept.wet[c], gain, frames, sum);
  }

  by_hand(frames, reach);
  if (length > 0) {
    lab::energy_decay_tap(decay_curve, lab::aux(0), length);
    lab::spectrogram_tap(picture, lab::aux(0), length, 200, false);
  }
  if (response.open(kResponsePoints) && response_mean.open(kResponsePoints)) {
    response.x0 = response_mean.x0 = kResponseLow;
    response.x1 = response_mean.x1 = kResponseHigh;
    response.scale = response_mean.scale = lab::kLog;
    for (int p = 0; p < kResponsePoints; ++p) {
      response.data[p] = kept.response[p];
      response_mean.data[p] = kept.response_mean[p];
    }
  }
  two_ways(lab::in(0), frames, lab::aux(0), length);
  build_path(x, h, reach, frames, gain);
}
