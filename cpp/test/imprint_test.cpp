// Native harness for Imprint (cpp/devices/imprint). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest asserts what makes it an imprint: what is captured is what
// is stamped, and the stamp does what each control says.

#include <cstdlib>
#include <limits>

#include "../devices/imprint/imprint.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Imprint;
namespace p = livemix::imprint;

static Imprint device;

static const float kRate = 48000.0f;
static const int kLatency = Imprint::kLatency;


// --- measuring ----------------------------------------------------------------------------

// In place, any power of two.
static void fft(std::vector<double>& re, std::vector<double>& im) {
  const int size_all = static_cast<int>(re.size());
  for (int i = 1, j = 0; i < size_all; ++i) {
    int bit = size_all >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      std::swap(re[i], re[j]);
      std::swap(im[i], im[j]);
    }
  }
  for (int size = 2; size <= size_all; size <<= 1) {
    const double angle = -2.0 * kPi / size;
    const double step_r = std::cos(angle), step_i = std::sin(angle);
    for (int s = 0; s < size_all; s += size) {
      double wr = 1.0, wi = 0.0;
      for (int k = 0; k < size / 2; ++k) {
        const int a = s + k, b = s + k + size / 2;
        const double xr = re[b] * wr - im[b] * wi, xi = re[b] * wi + im[b] * wr;
        re[b] = re[a] - xr;
        im[b] = im[a] - xi;
        re[a] += xr;
        im[a] += xi;
        const double next = wr * step_r - wi * step_i;
        wi = wr * step_i + wi * step_r;
        wr = next;
      }
    }
  }
}

// The mean power in every bin of `x` over [from, to): 8192-point Hann frames
// half a frame apart (Welch). Bin i lies at i × rate / 8192.
static const int kFft = 8192;
static std::vector<double> spectrum(const std::vector<float>& x, size_t from, size_t to) {
  to = std::min(to, x.size());
  std::vector<double> power(kFft / 2 + 1, 0.0);
  std::vector<double> re(kFft), im(kFft);
  int frames = 0;
  for (size_t start = from; start + kFft <= to; start += kFft / 2) {
    for (int n = 0; n < kFft; ++n) {
      re[n] = x[start + n] * (0.5 - 0.5 * std::cos(2.0 * kPi * n / kFft));
      im[n] = 0.0;
    }
    fft(re, im);
    for (int k = 0; k <= kFft / 2; ++k) power[k] += re[k] * re[k] + im[k] * im[k];
    ++frames;
  }
  for (double& value : power) value /= std::max(1, frames);
  return power;
}

// The level in dB of the band `width` octaves wide around `hz` (the mean
// power of its bins; only differences between bands mean anything).
static double band_db(const std::vector<double>& power, double hz, double rate, double width = 1.0 / 3.0) {
  const double bin_hz = rate / kFft;
  const int low = std::max(1, static_cast<int>(hz * std::pow(2.0, -0.5 * width) / bin_hz + 0.5));
  const int high = std::min(kFft / 2, std::max(low, static_cast<int>(hz * std::pow(2.0, 0.5 * width) / bin_hz + 0.5)));
  double sum = 0.0;
  for (int k = low; k <= high; ++k) sum += power[k];
  return 10.0 * std::log10(std::max(sum / (high - low + 1), 1.0e-30));
}

// Third-octave centres from 100 Hz to 10 kHz: where a shape is compared.
static std::vector<double> thirds() {
  std::vector<double> out;
  for (double hz = 100.0; hz < 10100.0; hz *= std::pow(2.0, 1.0 / 3.0)) out.push_back(hz);
  return out;
}

// A shape as third-octave levels with its mean taken off.
static std::vector<double> shape_of(const std::vector<float>& x, size_t from, double rate = kRate) {
  const std::vector<double> power = spectrum(x, from, x.size());
  std::vector<double> out;
  double mean = 0.0;
  for (double hz : thirds()) {
    out.push_back(band_db(power, hz, rate));
    mean += out.back();
  }
  mean /= static_cast<double>(out.size());
  for (double& value : out) value -= mean;
  return out;
}

static double worst_difference(const std::vector<double>& a, const std::vector<double>& b) {
  double worst = 0.0;
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) worst = std::max(worst, std::fabs(a[i] - b[i]));
  return worst;
}

// How loud `x` is over [from, to), in dB: its samples through the loudness
// weighting of ITU-R BS.1770 at 48 kHz (a 4 dB shelf above 1.7 kHz and a
// high-pass at 38 Hz; the standard's own coefficients), then the RMS. The
// device holds this, not the bare RMS: a colour that moves a sound's weight
// upward leaves it as loud and a little weaker.
static double loudness_db(const std::vector<float>& x, size_t from = 0, size_t to = SIZE_MAX) {
  to = std::min(to, x.size());
  const double b1[3] = {1.53512485958697, -2.69169618940638, 1.19839281085285};
  const double a1[2] = {-1.69065929318241, 0.73248077421585};
  const double b2[3] = {1.0, -2.0, 1.0};
  const double a2[2] = {-1.99004745483398, 0.99007225036621};
  double z1 = 0.0, z2 = 0.0, w1 = 0.0, w2 = 0.0, sum = 0.0;
  // The filters start a tenth of a second early, so that they have settled.
  const size_t start = from > 4800 ? from - 4800 : 0;
  for (size_t i = start; i < to; ++i) {
    const double in = x[i];
    const double shelved = b1[0] * in + z1;
    z1 = b1[1] * in - a1[0] * shelved + z2;
    z2 = b1[2] * in - a1[1] * shelved;
    const double out = b2[0] * shelved + w1;
    w1 = b2[1] * shelved - a2[0] * out + w2;
    w2 = b2[2] * shelved - a2[1] * out;
    if (i >= from) sum += out * out;
  }
  return to > from ? 10.0 * std::log10(std::max(sum / static_cast<double>(to - from), 1.0e-24)) : -240.0;
}

// --- sounds -------------------------------------------------------------------------------

// Pink noise: white through three one-pole sections (within half a dB of
// -3 dB per octave from 40 Hz to 16 kHz).
static std::vector<float> pink(float seconds, float rate, float gain) {
  std::vector<float> out(static_cast<size_t>(seconds * rate));
  double b0 = 0.0, b1 = 0.0, b2 = 0.0;
  for (float& v : out) {
    const double w = white();
    b0 = 0.99765 * b0 + w * 0.0990460;
    b1 = 0.96300 * b1 + w * 0.2965164;
    b2 = 0.57000 * b2 + w * 1.0526913;
    v = gain * static_cast<float>((b0 + b1 + b2 + w * 0.1848) * 0.25);
  }
  return out;
}

// A bell of `db` at `hz` (RBJ peaking filter), in place.
static void bell(std::vector<float>& x, double hz, double db, double q, double rate) {
  const double a = std::pow(10.0, db / 40.0);
  const double w = 2.0 * kPi * hz / rate;
  const double alpha = std::sin(w) / (2.0 * q);
  const double b0 = 1.0 + alpha * a, b1 = -2.0 * std::cos(w), b2 = 1.0 - alpha * a;
  const double a0 = 1.0 + alpha / a, a1 = b1, a2 = 1.0 - alpha / a;
  double x1 = 0.0, x2 = 0.0, y1 = 0.0, y2 = 0.0;
  for (float& v : x) {
    const double y = (b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1;
    x1 = v;
    y2 = y1;
    y1 = y;
    v = static_cast<float>(y);
  }
}

// A held chord of sawtooth-like tones (twelve partials each, 1/n), peak `gain`.
static std::vector<float> chord(float seconds, float rate, float gain, std::initializer_list<double> notes) {
  std::vector<float> out(static_cast<size_t>(seconds * rate), 0.0f);
  for (double hz : notes) {
    for (int n = 1; n <= 12 && hz * n < 0.45 * rate; ++n) {
      for (size_t i = 0; i < out.size(); ++i) {
        out[i] += static_cast<float>(std::sin(2.0 * kPi * hz * n * static_cast<double>(i) / rate + 0.7 * n) / n);
      }
    }
  }
  const double top = peak(out);
  for (float& v : out) v = static_cast<float>(v * gain / top);
  return out;
}

// Many steady sines at once, to read a curve off exactly: from `from_hz`
// to `to_hz`, 1/24 octave apart and never closer than 4.5 Hz.
static std::vector<double> tone_set(double from_hz, double to_hz) {
  std::vector<double> out;
  for (double hz = from_hz; hz <= to_hz; hz *= std::max(std::pow(2.0, 1.0 / 24.0), 1.0 + 4.5 / hz)) out.push_back(hz);
  return out;
}

static std::vector<float> many_tones(const std::vector<double>& hz, float seconds, float rate, float gain) {
  std::vector<float> out(static_cast<size_t>(seconds * rate), 0.0f);
  uint32_t seed = 12345u;
  for (double f : hz) {
    seed = seed * 1664525u + 1013904223u;
    const double phase = 2.0 * kPi * (seed >> 8) / 16777216.0;
    for (size_t i = 0; i < out.size(); ++i) {
      out[i] += static_cast<float>(std::sin(2.0 * kPi * f * static_cast<double>(i) / rate + phase));
    }
  }
  const double level = rms(out);
  for (float& v : out) v = static_cast<float>(v * gain / level);
  return out;
}

// The strength of each tone in `x` from sample `from` on, in dB: one long
// Hann frame (0.73 Hz a bin), the power of the five bins around the tone.
static std::vector<double> tone_levels(const std::vector<float>& x, size_t from, const std::vector<double>& hz,
                                       double rate) {
  const int size = rate > 60000.0 ? 131072 : 65536;
  std::vector<double> re(size, 0.0), im(size, 0.0);
  for (int n = 0; n < size && from + n < x.size(); ++n) {
    re[n] = x[from + n] * (0.5 - 0.5 * std::cos(2.0 * kPi * n / size));
  }
  fft(re, im);
  std::vector<double> out;
  for (double f : hz) {
    const int bin = static_cast<int>(f * size / rate + 0.5);
    double sum = 0.0;
    for (int k = bin - 2; k <= bin + 2; ++k) sum += re[k] * re[k] + im[k] * im[k];
    out.push_back(10.0 * std::log10(std::max(sum, 1.0e-30)));
  }
  return out;
}

// What the device does to each tone, in dB, the mean taken off: the curve.
static std::vector<double> curve_of(const std::vector<float>& in, const std::vector<float>& out, size_t from,
                                    const std::vector<double>& hz, double rate) {
  const std::vector<double> before = tone_levels(in, from - kLatency, hz, rate);
  std::vector<double> after = tone_levels(out, from, hz, rate);
  double mean = 0.0;
  for (size_t i = 0; i < after.size(); ++i) {
    after[i] -= before[i];
    mean += after[i];
  }
  for (double& value : after) value -= mean / static_cast<double>(after.size());
  return after;
}

// The tone the curve is highest at between two frequencies.
static double curve_peak(const std::vector<double>& curve, const std::vector<double>& hz, double low, double high) {
  double best = 0.0, best_db = -1.0e9;
  for (size_t i = 0; i < hz.size(); ++i) {
    if (hz[i] >= low && hz[i] <= high && curve[i] > best_db) {
      best_db = curve[i];
      best = hz[i];
    }
  }
  return best;
}

// A played phrase: eight plucked notes with twelve partials each, a new one
// every 0.6 s, each dying away over about a second; peak `gain`.
static std::vector<float> phrase(float rate, float gain) {
  const double notes[8] = {146.83, 220.0, 293.66, 369.99, 440.0, 329.63, 246.94, 196.0};
  std::vector<float> out(static_cast<size_t>(5.4f * rate), 0.0f);
  for (int n = 0; n < 8; ++n) {
    const size_t start = static_cast<size_t>(0.6 * n * rate);
    for (int h = 1; h <= 12; ++h) {
      for (size_t i = start; i < out.size(); ++i) {
        const double t = static_cast<double>(i - start) / rate;
        out[i] += static_cast<float>(std::sin(2.0 * kPi * notes[n] * h * t) * std::exp(-t * (2.5 + 0.4 * h)) /
                                     std::pow(h, 1.2));
      }
    }
  }
  const double top = peak(out);
  for (float& v : out) v = static_cast<float>(v * gain / top);
  return out;
}

// Struck notes: as phrase(), but each note begins with its partials at
// their crests and a few milliseconds of hammer noise (a strike, not a swell),
// and each enters while those before it still sound; peak `gain`. Note n
// begins at 0.6 × n seconds.
static const int kStruckNotes = 6;
static std::vector<float> struck_phrase(float rate, float gain) {
  const double notes[kStruckNotes] = {146.83, 293.66, 220.0, 440.0, 196.0, 369.99};
  std::vector<float> out(static_cast<size_t>(0.6f * kStruckNotes * rate + rate), 0.0f);
  rng_state() = 4242;
  for (int n = 0; n < kStruckNotes; ++n) {
    const size_t start = static_cast<size_t>(0.6 * n * rate);
    for (int h = 1; h <= 12; ++h) {
      for (size_t i = start; i < out.size(); ++i) {
        const double t = static_cast<double>(i - start) / rate;
        out[i] += static_cast<float>(std::cos(2.0 * kPi * notes[n] * h * t) * std::exp(-t * (2.5 + 0.4 * h)) /
                                     std::pow(h, 1.2));
      }
    }
    for (size_t i = start; i < start + static_cast<size_t>(0.02f * rate); ++i) {
      const double t = static_cast<double>(i - start) / rate;
      out[i] += static_cast<float>(1.5 * white() * std::exp(-t / 0.003));
    }
  }
  const double top = peak(out);
  for (float& v : out) v = static_cast<float>(v * gain / top);
  return out;
}

static std::vector<float> join(std::vector<float> a, const std::vector<float>& b) {
  a.insert(a.end(), b.begin(), b.end());
  return a;
}

// The captured colour at display point `point` as meter() carries it, in dB.
static int captured_point(const Imprint& d, int point) {
  long packed = std::lround(d.meter(point / Imprint::kPerReading));
  for (int j = 0; j < point % Imprint::kPerReading; ++j) packed /= Imprint::kLevels;
  return static_cast<int>(packed % Imprint::kLevels) - Imprint::kLevels / 2;
}

int main() {
  Conformance spec;
  spec.name = "imprint";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 1.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // 1. The latency. Mix 0 is the input 2304 samples late, bit for bit, at the
  // default (which listens and stamps) and with a built-in shape; and a mono
  // sound stays mono, bit for bit, whatever is on.
  {
    rng_state() = 77;
    const std::vector<float> in = pink(2.0f, kRate, 0.5f);
    for (float shape : {0.0f, 1.0f}) {
      device.init(kRate);
      device.set_param(p::kShape, shape);
      device.set_param(p::kMix, 0.0f);
      const Stereo out = run(device, in);
      bool same = true;
      for (size_t i = 0; i + kLatency < in.size(); ++i) same = same && out.left[i + kLatency] == in[i];
      EXPECT(same, "mix 0 is the input, a latency late, bit for bit");
    }
    device.init(kRate);
    device.set_param(p::kReplace, 0.7f);
    device.set_param(p::kShift, 5.0f);
    const Stereo out = run(device, in);
    EXPECT(out.left == out.right, "mono in, mono out, bit for bit");
    EXPECT(rms(out.left, 48000, 96000) > 0.01, "and the default lets the sound through");
  }

  // 2. Amount 0 is the input (a latency late) whatever the shape and Replace.
  {
    rng_state() = 78;
    const std::vector<float> in = pink(1.5f, kRate, 0.5f);
    double worst = 0.0;
    for (float shape : {0.0f, 2.0f, 5.0f}) {
      device.init(kRate);
      device.set_param(p::kShape, shape);
      device.set_param(p::kAmount, 0.0f);
      device.set_param(p::kReplace, 1.0f);
      const Stereo out = run(device, in);
      for (size_t i = 0; i + kLatency < in.size(); ++i) {
        worst = std::max(worst, std::fabs(static_cast<double>(out.left[i + kLatency]) - in[i]));
      }
    }
    std::printf("amount 0: worst difference from the input %.3g\n", worst);
    EXPECT(worst < 1.0e-5, "Amount 0 is the input");
  }

  // 3. What is captured is what is stamped. Pink noise through a known filter
  // (bells of +12 dB at 500 Hz and -9 dB at 2 kHz and +8 dB at 5 kHz) is
  // captured; then white noise goes in. With Replace at 1 what comes out has
  // the captured sound's own shape, tilt and all; with Replace at 0 the white
  // noise takes its colour (the shape less its straight line).
  {
    rng_state() = 79;
    std::vector<float> source = pink(8.0f, kRate, 0.3f);
    bell(source, 500.0, 12.0, 2.0, kRate);
    bell(source, 2000.0, -9.0, 2.0, kRate);
    bell(source, 5000.0, 8.0, 2.0, kRate);
    const std::vector<double> wanted = shape_of(source, 48000);
    rng_state() = 80;
    const std::vector<float> plain = noise(6.0f, kRate, 0.3f);
    std::vector<double> replaced, pressed;
    for (float replace : {1.0f, 0.0f}) {
      device.init(kRate);
      device.set_param(p::kShape, 0.0f);
      device.set_param(p::kLearn, 20.0f);
      device.set_param(p::kSmooth, 0.0f);
      device.set_param(p::kReplace, replace);
      run(device, source);
      device.set_param(p::kCapture, 0.0f);
      const Stereo out = run(device, plain);
      (replace > 0.5f ? replaced : pressed) = shape_of(out.left, 96000);
    }
    const double error = worst_difference(replaced, wanted);
    std::printf("capture then Replace 1: worst third-octave error %.2f dB\n", error);
    EXPECT(error < 1.5, "white noise comes out with the captured sound's shape within 1.5 dB (Replace 1)");
    // The colour is what stands out of the shape's tilt and broad dome: the
    // filter's peaks and its dip, less whatever of them is two octaves broad.
    // So the stamp follows the shape less its best straight line (they go up
    // and down together), is strongest where the +12 dB bell is and weakest
    // where the -9 dB one is, and those two stand more than 9 dB apart.
    std::vector<double> colour = wanted;
    {
      const double n = static_cast<double>(colour.size());
      double sx = 0.0, sy = 0.0, sxx = 0.0, sxy = 0.0;
      for (size_t i = 0; i < colour.size(); ++i) {
        sx += i;
        sy += colour[i];
        sxx += static_cast<double>(i) * i;
        sxy += i * colour[i];
      }
      const double slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
      for (size_t i = 0; i < colour.size(); ++i) colour[i] -= slope * (i - sx / n) + sy / n;
    }
    double together = 0.0, pp = 0.0, cc = 0.0;
    for (size_t i = 0; i < colour.size(); ++i) {
      together += pressed[i] * colour[i];
      pp += pressed[i] * pressed[i];
      cc += colour[i] * colour[i];
    }
    together /= std::sqrt(pp * cc);
    const std::vector<double> t = thirds();
    const size_t top = static_cast<size_t>(std::max_element(pressed.begin(), pressed.end()) - pressed.begin());
    const size_t bottom = static_cast<size_t>(std::min_element(pressed.begin(), pressed.end()) - pressed.begin());
    std::printf("capture then Replace 0: the stamp follows the filter's colour by %.3f, strongest at %.0f Hz, weakest at "
                "%.0f Hz, %.1f dB apart\n",
                together, t[top], t[bottom], pressed[top] - pressed[bottom]);
    EXPECT(together > 0.9, "white noise takes the captured colour (Replace 0)");
    EXPECT(std::fabs(std::log2(t[top] / 500.0)) < 0.2, "the stamp is strongest where the filter's +12 dB bell is");
    EXPECT(std::fabs(std::log2(t[bottom] / 2000.0)) < 0.2, "and weakest where its -9 dB bell is");
    EXPECT(pressed[top] - pressed[bottom] > 9.0, "the two stand more than 9 dB apart");
  }

  // 4. Amount below zero turns the shape inside out: read off many steady
  // tones, the two curves add up to nothing, tone by tone, within half a dB
  // (what is left is the frame: a gain per bin is a filter three bins wide,
  // and it averages gains, not decibels).
  {
    const std::vector<double> hz = tone_set(150.0, 9000.0);
    const std::vector<float> in = many_tones(hz, 3.5f, kRate, 0.2f);
    std::vector<double> curves[2];
    int which = 0;
    for (float amount : {1.0f, -1.0f}) {
      device.init(kRate);
      device.set_param(p::kCapture, 0.0f);
      device.set_param(p::kShape, 1.0f);
      device.set_param(p::kReplace, 0.0f);
      device.set_param(p::kAmount, amount);
      curves[which++] = curve_of(in, run(device, in).left, 72000, hz, kRate);
    }
    double worst = 0.0, range = 0.0;
    for (size_t i = 0; i < hz.size(); ++i) {
      worst = std::max(worst, std::fabs(curves[0][i] + curves[1][i]));
      range = std::max(range, std::fabs(curves[0][i]));
    }
    std::printf("invert: the stamp reaches %.1f dB; the two curves add up to %.3f dB at worst\n", range, worst);
    EXPECT(range > 5.0, "the open vowel stamps more than 5 dB of shape");
    EXPECT(worst < 0.5, "Amount -1 is the reciprocal of Amount 1 within half a dB");
  }

  // 5. Shift moves the stamp along the spectrum by the semitones it says:
  // the round vowel's first peak (300 Hz) is found again 12 up, 7 up and 12
  // down, each within a third of a semitone (or a quarter of a bin, 5.9 Hz,
  // where that is more: the frame cannot say better at 150 Hz).
  {
    const std::vector<double> hz = tone_set(100.0, 4000.0);
    const std::vector<float> in = many_tones(hz, 3.5f, kRate, 0.2f);
    for (float shift : {0.0f, 12.0f, 7.0f, -12.0f}) {
      device.init(kRate);
      device.set_param(p::kCapture, 0.0f);
      device.set_param(p::kShape, 2.0f);
      device.set_param(p::kReplace, 0.0f);
      device.set_param(p::kSmooth, 0.2f);
      device.set_param(p::kShift, shift);
      const std::vector<double> curve = curve_of(in, run(device, in).left, 72000, hz, kRate);
      const double claimed = 300.0 * std::pow(2.0, shift / 12.0);
      const double found = curve_peak(curve, hz, claimed / 1.5, claimed * 1.5);
      std::printf("shift %+.0f st: the 300 Hz peak is at %.1f Hz (%.1f claimed)\n", shift, found, claimed);
      const double allowed = std::max(claimed * (std::pow(2.0, 0.34 / 12.0) - 1.0), 0.25 * kRate / 2048.0);
      EXPECT(std::fabs(found - claimed) < allowed, "Shift moves a peak by the semitones it says");
    }
  }

  // 6. Replace. Three sounds as unlike as white, pink and red noise come out
  // of Replace 1 with one shape (the stamp's own), where at Replace 0 they
  // stay as far apart as they went in.
  {
    rng_state() = 82;
    std::vector<float> sounds[3] = {noise(6.0f, kRate, 0.2f), pink(6.0f, kRate, 0.3f), pink(6.0f, kRate, 0.3f)};
    {
      double low = 0.0;  // red: pink through one more pole at 300 Hz
      const double a = std::exp(-2.0 * kPi * 300.0 / kRate);
      for (float& v : sounds[2]) {
        low = v + (low - v) * a;
        v = static_cast<float>(4.0 * low);
      }
    }
    double spread[2] = {0.0, 0.0};
    int which = 0;
    for (float replace : {0.0f, 1.0f}) {
      std::vector<double> shapes[3];
      for (int n = 0; n < 3; ++n) {
        device.init(kRate);
        device.set_param(p::kCapture, 0.0f);
        device.set_param(p::kShape, 1.0f);
        device.set_param(p::kReplace, replace);
        shapes[n] = shape_of(run(device, sounds[n]).left, 96000);
      }
      spread[which++] = std::max(worst_difference(shapes[0], shapes[1]), worst_difference(shapes[0], shapes[2]));
    }
    std::printf("replace: three noises differ by %.1f dB at Replace 0 and by %.2f dB at Replace 1\n", spread[0],
                spread[1]);
    EXPECT(spread[0] > 15.0, "at Replace 0 the sounds keep their own colours");
    EXPECT(spread[1] < 1.5, "at Replace 1 they come out with the same shape within 1.5 dB");
  }

  // 7. Each built-in shape has the peaks it claims, at three sample rates:
  // with Smooth at 0 the curve's highest tone near each bell is within 4 %
  // of the bell's frequency (a bin and a half for the low ones).
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    const std::vector<double> hz = tone_set(70.0, 9000.0);
    const std::vector<float> in = many_tones(hz, 4.5f, rate, 0.2f);
    double worst = 0.0;
    for (int shape = 0; shape < Imprint::kBuiltIn; ++shape) {
      device.init(rate);
      device.set_param(p::kCapture, 0.0f);
      device.set_param(p::kShape, static_cast<float>(shape + 1));
      device.set_param(p::kReplace, 0.0f);
      device.set_param(p::kSmooth, 0.0f);
      const size_t from = static_cast<size_t>(rate > 60000.0f ? 1.6f * rate : 1.5f * rate);
      const std::vector<double> curve = curve_of(in, run(device, in).left, from, hz, rate);
      for (const Imprint::Bell& bell_ : Imprint::kBuiltInShapes[shape].bells) {
        if (bell_.db == 0.0f) break;
        const double reach = std::pow(2.0, 1.2 * bell_.width);
        const double found = curve_peak(curve, hz, bell_.hz / reach, bell_.hz * reach);
        const double off = std::fabs(found - bell_.hz);
        const double allowed = std::max(0.04 * bell_.hz, 1.5 * rate / 2048.0);
        if (off > allowed) std::printf("  shape %d at %.0f Hz: peak found at %.1f Hz\n", shape + 1, bell_.hz, found);
        worst = std::max(worst, off / allowed);
      }
    }
    std::printf("built-in peaks at %.0f Hz: worst miss %.2f of what is allowed\n", rate, worst);
    EXPECT(worst <= 1.0, "every built-in shape has the peaks it claims");
  }

  // 8. Smooth: from every bump to the broad colour only. The hollow tube's
  // six narrow peaks are read off at five settings; the curve's range falls
  // at every step, from over 10 dB to under four tenths of that.
  {
    const std::vector<double> hz = tone_set(150.0, 9000.0);
    const std::vector<float> in = many_tones(hz, 3.5f, kRate, 0.2f);
    double last = 1.0e9, first = 0.0;
    bool falling = true;
    for (float smooth : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) {
      device.init(kRate);
      device.set_param(p::kCapture, 0.0f);
      device.set_param(p::kShape, 4.0f);
      device.set_param(p::kReplace, 0.0f);
      device.set_param(p::kSmooth, smooth);
      const std::vector<double> curve = curve_of(in, run(device, in).left, 72000, hz, kRate);
      const double range = *std::max_element(curve.begin(), curve.end()) - *std::min_element(curve.begin(), curve.end());
      std::printf("smooth %.2f: the tube's curve spans %.1f dB\n", smooth, range);
      falling = falling && range < last - 0.5;
      last = range;
      if (smooth == 0.0f) first = range;
    }
    EXPECT(falling, "every quarter of Smooth takes detail out of the stamp");
    EXPECT(first > 10.0 && last < 0.4 * first, "Smooth runs from every bump to the broad colour only");
  }

  // 9. The capture. meter() carries the captured colour at 55 points (point
  // n at 40 Hz × 2^(n/6)); a sound with a +15 dB bell at 1 kHz is learned, and
  // then: it reads there, Capture Off holds it against a different sound, it
  // survives a sleep to the last digit, the stamp after the sleep is the stamp
  // before it, and init() forgets it.
  {
    rng_state() = 83;
    std::vector<float> source = pink(4.0f, kRate, 0.3f);
    bell(source, 1000.0, 15.0, 3.0, kRate);
    std::vector<float> other = pink(3.0f, kRate, 0.3f);
    bell(other, 250.0, 15.0, 3.0, kRate);
    const std::vector<float> plain = noise(4.0f, kRate, 0.3f);
    const int at_1k = 28, at_250 = 16;  // 40 Hz × 2^(28/6) = 1016 Hz, 2^(16/6) = 254 Hz
    auto readings = [&]() {
      std::vector<float> out;
      for (int i = 0; i < Imprint::kReadings + 1; ++i) out.push_back(device.meter(i));
      return out;
    };

    device.init(kRate);
    device.set_param(p::kShape, 0.0f);
    device.set_param(p::kLearn, 20.0f);
    device.set_param(p::kSmooth, 0.3f);
    EXPECT(device.meter(Imprint::kReadings) == 0.0f, "nothing is heard before the first sound");
    run(device, source);
    const int learned = captured_point(device, at_1k) - captured_point(device, at_250);
    std::printf("capture: the 1 kHz bell reads %d dB over 250 Hz; heard %.2f of Learn\n", learned,
                device.meter(Imprint::kReadings));
    EXPECT(learned >= 7, "the captured colour has the bell that was played into it");
    EXPECT_NEAR(device.meter(Imprint::kReadings), 0.2, 0.01, "4 s of a 20 s Learn is a fifth heard");

    device.set_param(p::kCapture, 0.0f);
    const std::vector<float> held = readings();
    const std::vector<double> before = shape_of(run(device, plain).left, 96000);
    run(device, other);
    EXPECT(readings() == held, "Capture Off holds the colour against whatever is played");

    const Stereo quiet = render(device, 3.0f, kRate);
    EXPECT(peak(quiet.left, 96000) == 0.0 && peak(quiet.right, 96000) == 0.0, "asleep in the silence");
    EXPECT(readings() == held, "the capture survives the sleep");
    const std::vector<double> after = shape_of(run(device, plain).left, 96000);
    const double drift = worst_difference(before, after);
    std::printf("capture: the stamp after a sleep differs from the stamp before by %.3f dB\n", drift);
    EXPECT(drift < 0.1, "and stamps the same shape after it");

    // Capture switched on again starts afresh with the first sound it hears.
    device.set_param(p::kCapture, 1.0f);
    EXPECT(readings() == held, "switched on again, the old colour stays until something is heard");
    run(device, other);
    const int relearned = captured_point(device, at_250) - captured_point(device, at_1k);
    std::printf("capture: learned again, 250 Hz reads %d dB over 1 kHz\n", relearned);
    EXPECT(relearned >= 7, "a new capture forgets the old one and learns the new sound");

    device.init(kRate);
    bool flat = true;
    for (int n = 0; n < Imprint::kDisplayPoints; ++n) flat = flat && captured_point(device, n) == 0;
    EXPECT(flat, "init() forgets the capture");
  }

  // 10. Learn. Two sounds in a row, 3.5 s with a bell at 250 Hz and then
  // 0.5 s with one at 1 kHz: a short Learn holds the last instant (the 1 kHz
  // bell), a long one the average of all it heard (the 250 Hz bell wins).
  {
    rng_state() = 84;
    std::vector<float> first = pink(3.5f, kRate, 0.3f);
    bell(first, 250.0, 15.0, 3.0, kRate);
    std::vector<float> second = pink(0.5f, kRate, 0.3f);
    bell(second, 1000.0, 15.0, 3.0, kRate);
    const std::vector<float> both = join(first, second);
    int lean[3];
    int which = 0;
    for (float learn : {0.1f, 1.0f, 20.0f}) {
      device.init(kRate);
      device.set_param(p::kLearn, learn);
      device.set_param(p::kSmooth, 0.3f);
      run(device, both);
      lean[which++] = captured_point(device, 28) - captured_point(device, 16);
    }
    std::printf("learn 0.1, 1, 20 s: 1 kHz over 250 Hz reads %+d, %+d, %+d dB\n", lean[0], lean[1], lean[2]);
    EXPECT(lean[0] >= 7, "a short Learn is the colour of the last instant");
    EXPECT(lean[2] <= -2, "a long Learn is the average of everything heard");
    EXPECT(lean[0] > lean[1] && lean[1] > lean[2], "and Learn runs between them");
  }

  // 11. Level. A full-scale chord held for a minute, at the defaults and with
  // every control at each end (and every shape): what comes out never peaks
  // 6 dB over what went in, is no stronger at the end than at the start, and
  // is as loud as what went in within 1 dB (loudness_db; the bare RMS, which
  // the hold does not aim at, within 4 dB).
  {
    const std::vector<float> held = chord(60.0f, kRate, 1.0f, {110.0, 164.81, 277.18, 415.3});
    const double in_rms = rms(held);
    const double in_loud = loudness_db(held, 96000 - kLatency, held.size() - kLatency);
    double worst_peak = 0.0, worst_growth = 0.0, low = 1.0e9, high = -1.0e9, low_rms = 1.0e9, high_rms = -1.0e9;
    auto measure = [&](int id, float value) {
      device.init(kRate);
      if (id >= 0) device.set_param(id, value);
      const Stereo out = run(device, held);
      const size_t n = out.size();
      worst_peak = std::max(worst_peak, peak(out.left));
      worst_growth = std::max(worst_growth, peak(out.left, n - 480000, n) / peak(out.left, 48000, 528000));
      const double bare = db(rms(out.left, 96000, n) / in_rms);
      const double level = loudness_db(out.left, 96000, n) - in_loud;
      low = std::min(low, level);
      high = std::max(high, level);
      low_rms = std::min(low_rms, bare);
      high_rms = std::max(high_rms, bare);
      if (level < -1.0 || level > 1.0 || peak(out.left) > 2.0) {
        std::printf("  param %d at %g: loudness %+.2f dB, RMS %+.2f dB, peak %.2f\n", id, value, level, bare, peak(out.left));
      }
    };
    measure(-1, 0.0f);
    for (int id = 0; id < p::kNumParams; ++id) {
      if (id == p::kMix) continue;
      measure(id, p::kParamMin[id]);
      measure(id, p::kParamMax[id]);
    }
    for (int shape = 1; shape <= Imprint::kBuiltIn; ++shape) measure(p::kShape, static_cast<float>(shape));
    // The hardest stamp there is: a built-in shape at full Amount, shifted, replacing.
    device.init(kRate);
    device.set_param(p::kShape, 5.0f);
    device.set_param(p::kAmount, 2.0f);
    device.set_param(p::kReplace, 1.0f);
    device.set_param(p::kSmooth, 0.0f);
    const Stereo hard = run(device, held);
    worst_peak = std::max(worst_peak, peak(hard.left));
    std::printf("level: a full-scale chord for a minute peaks at %.2f at worst, grows by %.3f, loudness %+.2f to %+.2f dB, "
                "RMS %+.2f to %+.2f dB\n",
                worst_peak, worst_growth, low, high, low_rms, high_rms);
    EXPECT(worst_peak < 2.0, "a full-scale held chord never comes out 6 dB over full scale");
    EXPECT(worst_growth < 1.05, "and never grows");
    EXPECT(low > -1.0 && high < 1.0, "a held chord stays as loud as it went in within 1 dB at every setting");
    EXPECT(low_rms > -4.0 && high_rms < 4.0, "and its RMS within 4 dB");
  }

  // 12. Part-way Mix. Held tones over the piano's range through the default
  // and through a built-in shape at Mix 0.5: the dry and the stamped sound are
  // in step and in phase, so no tone is lost. The worst is under 3 dB.
  {
    double worst = 0.0;
    for (float shape : {0.0f, 1.0f, 5.0f}) {
      for (double note = 27.5; note < 4200.0; note *= std::pow(2.0, 5.0 / 12.0)) {
        device.init(kRate);
        device.set_param(p::kShape, shape);
        device.set_param(p::kMix, 0.5f);
        const std::vector<float> tone = sine(static_cast<float>(note), 1.5f, kRate, 0.5f);
        const Stereo out = run(device, tone);
        const double level = db(tone_level(out.left, note, kRate, 36000, 72000) / 0.5);
        worst = std::min(worst, level);
      }
    }
    std::printf("mix 0.5: the weakest held tone is %.2f dB under its input\n", worst);
    EXPECT(worst > -3.0, "no held tone is lost at Mix 0.5");
  }

  // 13. The two channels. Opposite signs in: the same strength out as mono in
  // (nothing is summed), still opposite. And a sound on one side only stays
  // there.
  {
    rng_state() = 85;
    const std::vector<float> in = pink(3.0f, kRate, 0.3f);
    std::vector<float> flipped = in;
    for (float& v : flipped) v = -v;
    device.init(kRate);
    const Stereo mono = run(device, in);
    device.init(kRate);
    const Stereo anti = run(device, in, flipped);
    double worst = 0.0;
    for (size_t i = 0; i < in.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(anti.left[i]) + anti.right[i]));
      worst = std::max(worst, std::fabs(static_cast<double>(anti.left[i]) - mono.left[i]));
    }
    EXPECT(worst < 1.0e-6, "an anti-phase sound comes out as strong as a mono one, still anti-phase");
    device.init(kRate);
    const Stereo one_side = run(device, in, silence(3.0f, kRate));
    EXPECT(rms(one_side.left, 48000) > 0.05 && peak(one_side.right) == 0.0, "a sound on the left stays on the left");
  }

  // 14. The default, put on a sounding channel: a phrase and a held chord both
  // come out changed in colour (2 dB or more somewhere), as loud as they
  // went in within 3 dB, from the first tenth of a second on.
  {
    const std::vector<float> played = phrase(kRate, 0.5f);
    const std::vector<float> pad = chord(6.0f, kRate, 0.5f, {130.81, 196.0, 311.13, 392.0});
    for (const std::vector<float>* sound : {&played, &pad}) {
      device.init(kRate);
      const Stereo out = run(device, *sound);
      std::vector<float> late(out.left.begin() + kLatency, out.left.end());
      const double change = worst_difference(shape_of(late, 24000), shape_of(*sound, 24000));
      const double level = db(rms(late) / rms(*sound, 0, late.size()));
      const double at_once = db(rms(late, 0, 4800) / rms(*sound, 0, 4800));
      std::printf("default on a %s: colour moved by %.1f dB, level %+.2f dB, first 100 ms %+.2f dB\n",
                  sound == &played ? "phrase" : "held chord", change, level, at_once);
      EXPECT(change > 2.0, "the default changes the colour of what is played");
      EXPECT(std::fabs(level) < 3.0, "and leaves it as loud as it was");
      EXPECT(std::fabs(at_once) < 3.0, "from the first tenth of a second");
    }
  }

  // 14b. The sixteen presets (their values copied from device.json, every
  // control in the manifest's order). A full-scale chord held for a minute
  // through each: never 6 dB over full scale, never growing, as loud as it
  // went in within 1 dB. And held tones over the piano's range at Mix 0.5:
  // none is lost.
  struct Preset {
    const char* name;
    float values[p::kNumParams];
  };
  static const Preset presets[] = {
      {"Open vowel", {1.0f, 1.0f, 1.0f, 0.0f, 0.25f, 0.5f, 2.0f, 1.0f}},
      {"Round vowel", {1.0f, 2.0f, 1.2f, 0.0f, 0.25f, 0.5f, 2.0f, 1.0f}},
      {"Thin vowel", {1.0f, 3.0f, 1.5f, 0.0f, 0.25f, 0.5f, 2.0f, 1.0f}},
      {"Hollow tube", {1.0f, 4.0f, 1.2f, 0.0f, 0.25f, 0.3f, 2.0f, 1.0f}},
      {"Bright bell", {1.0f, 5.0f, 1.5f, 0.0f, 0.25f, 0.15f, 2.0f, 1.0f}},
      {"Dark box", {1.0f, 6.0f, 1.0f, 0.0f, 0.6f, 0.5f, 2.0f, 1.0f}},
      {"Deeper colour", {1.0f, 0.0f, 1.0f, 0.0f, 0.0f, 0.5f, 2.0f, 1.0f}},
      {"Evened out", {1.0f, 0.0f, -1.0f, 0.0f, 0.0f, 0.6f, 3.0f, 1.0f}},
      {"Small body", {1.0f, 1.0f, 1.3f, 12.0f, 0.35f, 0.5f, 2.0f, 1.0f}},
      {"Large body", {1.0f, 2.0f, 1.3f, -9.0f, 0.25f, 0.5f, 2.0f, 1.0f}},
      {"Inside out", {1.0f, 1.0f, -2.0f, 0.0f, 0.0f, 0.5f, 2.0f, 1.0f}},
      {"All vowel", {1.0f, 3.0f, 1.0f, 0.0f, 1.0f, 0.5f, 2.0f, 1.0f}},
      {"Thin glass", {1.0f, 5.0f, 2.0f, 7.0f, 0.25f, 0.0f, 2.0f, 1.0f}},
      {"Faint vowel", {1.0f, 2.0f, 0.8f, 0.0f, 0.0f, 0.5f, 2.0f, 0.7f}},
      {"Distant pipe", {1.0f, 4.0f, 1.0f, -5.0f, 0.7f, 0.4f, 2.0f, 1.0f}},
      {"Remembered notes", {1.0f, 0.0f, 1.5f, 0.0f, 0.0f, 0.0f, 8.0f, 1.0f}},
  };
  {
    const std::vector<float> held = chord(60.0f, kRate, 1.0f, {110.0, 164.81, 277.18, 415.3});
    const double in_loud = loudness_db(held, 96000 - kLatency, held.size() - kLatency);
    double worst_peak = 0.0, worst_growth = 0.0, low = 1.0e9, high = -1.0e9, worst_tone = 0.0;
    for (const Preset& preset : presets) {
      device.init(kRate);
      for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, preset.values[id]);
      const Stereo out = run(device, held);
      const size_t n = out.size();
      const double level = loudness_db(out.left, 96000, n) - in_loud;
      const double growth = peak(out.left, n - 480000, n) / peak(out.left, 48000, 528000);
      worst_peak = std::max(worst_peak, peak(out.left));
      worst_growth = std::max(worst_growth, growth);
      low = std::min(low, level);
      high = std::max(high, level);
      double tone_worst = 0.0;
      for (double note = 27.5; note < 4200.0; note *= std::pow(2.0, 7.0 / 12.0)) {
        device.init(kRate);
        for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, preset.values[id]);
        device.set_param(p::kMix, 0.5f);
        const std::vector<float> tone = sine(static_cast<float>(note), 1.5f, kRate, 0.5f);
        const Stereo toned = run(device, tone);
        tone_worst = std::min(tone_worst, db(tone_level(toned.left, note, kRate, 36000, 72000) / 0.5));
      }
      worst_tone = std::min(worst_tone, tone_worst);
      if (level < -1.0 || level > 1.0 || peak(out.left) > 2.0 || tone_worst < -3.0) {
        std::printf("  %s: loudness %+.2f dB, peak %.2f, weakest tone %.2f dB\n", preset.name, level, peak(out.left), tone_worst);
      }
    }
    std::printf("presets: a full-scale chord peaks at %.2f at worst, grows by %.3f, loudness %+.2f to %+.2f dB; the weakest "
                "held tone at Mix 0.5 is %.2f dB\n",
                worst_peak, worst_growth, low, high, worst_tone);
    EXPECT(worst_peak < 2.0, "no preset puts a full-scale chord 6 dB over full scale");
    EXPECT(worst_growth < 1.05, "no preset grows");
    EXPECT(low > -1.0 && high < 1.0, "every preset leaves a chord as loud as it went in within 1 dB");
    EXPECT(worst_tone > -3.0, "no preset loses a held tone at Mix 0.5");
  }

  // 15. No clicks. Three steady tones run through; halfway a control is
  // moved as a bare step (the two choices each way, Amount from one end to
  // the other, Shift by two octaves, Replace and Smooth across their range).
  // The largest step between two samples stays within a quarter of what the
  // same sound makes with nothing moved.
  {
    std::vector<float> tones = sine(196.0f, 2.0f, kRate, 0.2f);
    const std::vector<float> second = sine(587.33f, 2.0f, kRate, 0.2f);
    const std::vector<float> third = sine(1318.5f, 2.0f, kRate, 0.2f);
    for (size_t i = 0; i < tones.size(); ++i) tones[i] += second[i] + third[i];
    struct Move {
      int id;
      float from, to;
      const char* name;
    };
    const Move moves[] = {
        {p::kShape, 1.0f, 5.0f, "Shape"},    {p::kShape, 4.0f, 0.0f, "Shape to Captured"},
        {p::kCapture, 1.0f, 0.0f, "Capture off"}, {p::kCapture, 0.0f, 1.0f, "Capture on"},
        {p::kAmount, 2.0f, -2.0f, "Amount"}, {p::kShift, -12.0f, 12.0f, "Shift"},
        {p::kReplace, 0.0f, 1.0f, "Replace"}, {p::kSmooth, 0.0f, 1.0f, "Smooth"},
        {p::kLearn, 20.0f, 0.1f, "Learn"},   {p::kMix, 1.0f, 0.3f, "Mix"},
    };
    double worst = 0.0;
    for (const Move& move : moves) {
      device.init(kRate);
      device.set_param(move.id, move.to);
      const double still = std::max(max_step(run(device, tones).left, 48000), max_step(tones));
      device.init(kRate);
      device.set_param(move.id, move.from);
      std::vector<float> first_half(tones.begin(), tones.begin() + 48000);
      std::vector<float> second_half(tones.begin() + 48000, tones.end());
      run(device, first_half);
      device.set_param(move.id, move.to);
      const double moved = max_step(run(device, second_half).left);
      if (moved > 1.25 * still) std::printf("  %s: step %.4f against %.4f\n", move.name, moved, still);
      worst = std::max(worst, moved / still);
    }
    std::printf("clicks: the largest step after a control is moved is %.2f of the steady sound's\n", worst);
    EXPECT(worst < 1.25, "no control clicks when it is moved as a bare step");
  }

  // 16. Bad input. A NaN, an infinity and 1e30 in the middle of a sound: what
  // comes out stays finite, and three seconds later it is the sound it would
  // have been.
  {
    rng_state() = 86;
    const std::vector<float> good = pink(5.0f, kRate, 0.3f);
    std::vector<float> bad = good;
    bad[40000] = std::nanf("");
    bad[40001] = std::numeric_limits<float>::infinity();
    bad[40002] = -1.0e30f;
    for (float shape : {1.0f, 0.0f}) {
      device.init(kRate);
      device.set_param(p::kShape, shape);
      device.set_param(p::kReplace, 0.5f);
      const Stereo clean_out = run(device, good);
      device.init(kRate);
      device.set_param(p::kShape, shape);
      device.set_param(p::kReplace, 0.5f);
      const Stereo bad_out = run(device, bad);
      double off = 0.0;
      for (size_t i = 4 * 48000; i < good.size(); ++i) {
        off = std::max(off, std::fabs(static_cast<double>(bad_out.left[i]) - clean_out.left[i]));
      }
      std::printf("bad input (shape %.0f): three seconds on, %.2g from the sound it would have been\n", shape, off);
      EXPECT(finite(bad_out.left) && finite(bad_out.right), "NaN, infinity and 1e30 in: finite out");
      EXPECT(off < 2.0e-3, "and the device is itself again once good input returns");
      EXPECT(rms(bad_out.left, 4 * 48000) > 0.05, "not stuck");
    }
  }

  // 17. Block sizes across a sleep. A sound, a silence, a sound again, the
  // silence stepped across the moment the device falls asleep (0.19 s after
  // the sound: the tail and the hold): the same samples at block sizes 1, 37,
  // 128 and 2048, with everything that listens at work (Capture on, the
  // captured shape, Replace half up).
  {
    double worst = 0.0;
    for (float gap = 0.12f; gap < 0.34f; gap += 0.013f) {
      rng_state() = 99;
      std::vector<float> sound = pink(0.4f, kRate, 0.4f);
      const std::vector<float> again = pink(0.4f, kRate, 0.4f);
      sound = join(join(sound, silence(gap, kRate)), again);
      Stereo reference;
      for (int block : {128, 1, 2048, 37}) {
        device.init(kRate);
        device.set_param(p::kShape, 0.0f);
        device.set_param(p::kReplace, 0.5f);
        device.set_param(p::kLearn, 0.3f);
        const Stereo render_ = run(device, sound, block);
        if (block == 128) {
          reference = render_;
          continue;
        }
        for (size_t i = 0; i < render_.size(); ++i) {
          worst = std::max(worst, std::fabs(static_cast<double>(render_.left[i]) - reference.left[i]));
          worst = std::max(worst, std::fabs(static_cast<double>(render_.right[i]) - reference.right[i]));
        }
      }
    }
    std::printf("block sizes across a sleep: worst difference %.3g\n", worst);
    EXPECT(worst < 1.0e-6, "the same at block sizes 1, 37, 128 and 2048 across a sleep");
  }

  // 18. A knob moved while the device sleeps snaps: Mix turned from 0.2 to 1
  // in the silence gives, from the first sample after it, what a device that
  // stood at 1 all along gives.
  {
    rng_state() = 100;
    const std::vector<float> before = pink(0.5f, kRate, 0.4f);
    const std::vector<float> after = pink(0.5f, kRate, 0.4f);
    device.init(kRate);
    run(device, before);
    render(device, 1.0f, kRate);
    const Stereo stood = run(device, after);
    device.init(kRate);
    device.set_param(p::kMix, 0.2f);
    run(device, before);
    const Stereo quiet = render(device, 1.0f, kRate);
    device.set_param(p::kMix, 1.0f);
    const Stereo moved = run(device, after);
    double off = 0.0;
    for (size_t i = 0; i < after.size(); ++i) off = std::max(off, std::fabs(static_cast<double>(moved.left[i]) - stood.left[i]));
    EXPECT(peak(quiet.left, 24000) == 0.0, "asleep within half a second of the sound");
    EXPECT(off < 1.0e-7, "a knob moved in the sleep snaps on waking");
  }

  // 19. Rest. Every control moved to each end while a sound runs, and then
  // silence: a second later the output is exact zeros, whichever it was.
  {
    rng_state() = 101;
    const std::vector<float> sound = pink(0.6f, kRate, 0.4f);
    bool rests = true;
    for (int id = 0; id < p::kNumParams; ++id) {
      for (float value : {p::kParamMin[id], p::kParamMax[id]}) {
        device.init(kRate);
        device.set_param(p::kShape, 0.0f);
        run(device, sound);
        device.set_param(id, value);
        run(device, sound);
        render(device, 1.0f, kRate);
        const Stereo rest = render(device, 0.5f, kRate);
        rests = rests && peak(rest.left) == 0.0 && peak(rest.right) == 0.0;
      }
    }
    EXPECT(rests, "the device comes to rest after every control move");
  }

  // 20. No dead part of a knob, on a played phrase (plucked notes, not a
  // test tone). Each control is set to four places across its range; between
  // every two neighbours what comes out differs by more than 5 % of itself
  // (-26 dB). Learn and Smooth are heard with the captured shape too, on a
  // phrase that changes colour halfway (a bell up at 1.5 kHz, one down at
  // 300 Hz); the rest with the default shape.
  {
    const std::vector<float> played = join(phrase(kRate, 0.5f), phrase(kRate, 0.5f));
    std::vector<float> turned = phrase(kRate, 0.5f);
    bell(turned, 1500.0, 15.0, 2.0, kRate);
    bell(turned, 300.0, -12.0, 2.0, kRate);
    for (float& v : turned) v *= 0.5f / static_cast<float>(peak(turned));
    const std::vector<float> turning = join(phrase(kRate, 0.5f), turned);
    struct Sweep {
      int id;
      float at[4];
      const char* name;
      bool captured;
    };
    const Sweep sweeps[] = {
        {p::kAmount, {-2.0f, -0.67f, 0.67f, 2.0f}, "Amount", false},
        {p::kShift, {-24.0f, -8.0f, 8.0f, 24.0f}, "Shift", false},
        {p::kReplace, {0.0f, 0.33f, 0.67f, 1.0f}, "Replace", false},
        {p::kSmooth, {0.0f, 0.33f, 0.67f, 1.0f}, "Smooth", false},
        {p::kSmooth, {0.0f, 0.33f, 0.67f, 1.0f}, "Smooth (captured)", true},
        {p::kLearn, {0.1f, 0.6f, 3.5f, 20.0f}, "Learn (captured)", true},
        {p::kMix, {0.0f, 0.33f, 0.67f, 1.0f}, "Mix", false},
    };
    double least = 0.0;
    for (const Sweep& sweep : sweeps) {
      Stereo last;
      for (int n = 0; n < 4; ++n) {
        device.init(kRate);
        if (sweep.captured) device.set_param(p::kShape, 0.0f);
        device.set_param(sweep.id, sweep.at[n]);
        const Stereo out = run(device, sweep.captured ? turning : played);
        if (n > 0) {
          std::vector<float> apart(out.size());
          for (size_t i = 0; i < apart.size(); ++i) apart[i] = out.left[i] - last.left[i];
          const size_t from = sweep.captured ? 8 * 48000 : 96000;  // well into the second colour
          const double differs = db(rms(apart, from) / rms(out.left, from));
          if (differs < -26.0) std::printf("  %s between %g and %g: %.1f dB\n", sweep.name, sweep.at[n - 1], sweep.at[n], differs);
          if (n == 1 || differs < least) least = differs;
        }
        last = out;
      }
      std::printf("range of %s: neighbouring settings differ by %.1f dB of the sound at least\n", sweep.name, least);
      EXPECT(least > -26.0, "every part of every knob does something to a played phrase");
    }
    // The seven shapes, each against every other.
    std::vector<std::vector<double>> shapes;
    for (int shape = 0; shape <= Imprint::kBuiltIn; ++shape) {
      device.init(kRate);
      device.set_param(p::kShape, static_cast<float>(shape));
      const Stereo out = run(device, played);
      shapes.push_back(shape_of(out.left, 96000));
    }
    double nearest = 1.0e9;
    for (size_t i = 0; i < shapes.size(); ++i) {
      for (size_t j = i + 1; j < shapes.size(); ++j) nearest = std::min(nearest, worst_difference(shapes[i], shapes[j]));
    }
    std::printf("shapes: the two nearest differ by %.1f dB in some third octave\n", nearest);
    EXPECT(nearest > 3.0, "the seven shapes are seven colours on a played phrase");
  }

  // --- The second check ---------------------------------------------------------------------
  //
  // Steady notes with eight partials each, one after another with no gap:
  // `count` of them, a new one every `every` seconds, the pitches far apart
  // (on and off the bells of the built-in shapes); peak `gain`.
  auto steady_notes = [](float every, int count, float gain) {
    const double pitches[] = {146.83, 739.99, 220.0, 1108.7, 329.63, 185.0, 880.0, 277.18, 587.33, 110.0};
    std::vector<float> out(static_cast<size_t>((every * count + 0.1f) * kRate), 0.0f);
    for (int note = 0; note < count; ++note) {
      const size_t start = static_cast<size_t>(every * note * kRate);
      const size_t length = static_cast<size_t>(every * kRate);
      for (size_t i = 0; i < length && start + i < out.size(); ++i) {
        const double t = static_cast<double>(i) / kRate;
        const double fade = std::min(1.0, std::min(t / 0.03, (every - t) / 0.03));
        double sample = 0.0;
        for (int n = 1; n <= 8; ++n) sample += std::sin(2.0 * kPi * pitches[note % 10] * n * t + 0.9 * n) / std::pow(n, 1.5);
        out[start + i] += static_cast<float>(fade * sample);
      }
    }
    const double top = peak(out);
    for (float& v : out) v = static_cast<float>(v * gain / top);
    return out;
  };
  auto load = [](const Preset& preset) {
    device.init(kRate);
    for (int id = 0; id < p::kNumParams; ++id) device.set_param(id, preset.values[id]);
  };

  // 22. No pumping. The level hold works from the frame in hand, and a frame
  // that is a new sound takes its gain there at once, so a note is as loud as
  // it came from its first frame on, whatever was played before it. (a) At
  // the defaults a note on a bell of the open vowel, then one off it, held:
  // in twentieths of a second from 50 ms after it began, the second note is
  // never more than 3 dB from its input, and from a second on within 1 dB of
  // it and of itself. (The first version weighed the curve against the last
  // 0.6 s and trimmed over another 0.6 s: the second note began 11 dB down
  // and swelled for a second and a half.) (b) Steady notes that change every
  // half second through every preset: no twentieth of a second is more than
  // 6 dB from its input in RMS (it was 25). (c) The other side of the same
  // coin: a held chord whose partials beat (three sawtooth voices to a note,
  // 7 cents apart) through every preset. A hold that follows each frame, or
  // that catches up whenever it is 3 dB out, turns everything off a bell up
  // and down with the beat of what is on it (by 8 dB under the round vowel);
  // the gain in use stays within 4 dB over the five and a half seconds.
  {
    std::vector<float> two = steady_notes(2.0f, 2, 0.5f);  // 146.83 Hz, then 739.99 Hz: swap them
    std::vector<float> swapped(two.size(), 0.0f);
    const size_t half = static_cast<size_t>(2.0f * kRate);
    for (size_t i = 0; i < half; ++i) {
      swapped[i] = two[half + i];
      swapped[half + i] = two[i];
    }
    device.init(kRate);
    const Stereo out = run(device, swapped);
    double low = 1.0e9, high = -1.0e9, settled_low = 1.0e9, settled_high = -1.0e9;
    for (size_t at = half + 2400; at + 2400 <= half + 72000; at += 2400) {
      const double level = db(rms(out.left, at + kLatency, at + kLatency + 2400) / rms(swapped, at, at + 2400));
      low = std::min(low, level);
      high = std::max(high, level);
      if (at >= half + 48000) {
        settled_low = std::min(settled_low, level);
        settled_high = std::max(settled_high, level);
      }
    }
    std::printf("a note held after another (defaults): %+.2f to %+.2f dB of its input from 50 ms on, %+.2f to %+.2f dB from "
                "a second on\n", low, high, settled_low, settled_high);
    EXPECT(low > -3.0 && high < 3.0, "a held note is as loud as it came from its start, whatever came before");
    EXPECT(settled_low > -1.0 && settled_high < 1.0, "and a second on it neither swells nor dips");

    const std::vector<float> run_of_notes = steady_notes(0.5f, 12, 0.5f);
    double worst_low = 0.0, worst_high = 0.0;
    for (const Preset& preset : presets) {
      load(preset);
      const Stereo played = run(device, run_of_notes);
      for (size_t at = 48000; at + 2400 <= 6 * 48000; at += 2400) {
        const double level =
            db(rms(played.left, at + kLatency, at + kLatency + 2400) / rms(run_of_notes, at, at + 2400));
        if (level < -6.0 || level > 6.0) std::printf("  %s at %.2f s: %+.1f dB\n", preset.name, at / kRate, level);
        worst_low = std::min(worst_low, level);
        worst_high = std::max(worst_high, level);
      }
    }
    std::printf("notes that change every half second, all presets: %+.2f to %+.2f dB of the input in any 50 ms\n",
                worst_low, worst_high);
    EXPECT(worst_low > -6.0 && worst_high < 6.0, "each of a run of notes comes out as strong as it went in");

    std::initializer_list<double> voices = {130.81 * 0.99596, 130.81, 130.81 * 1.00405, 196.0 * 0.99596, 196.0, 196.0 * 1.00405,
                                            311.13 * 0.99596, 311.13, 311.13 * 1.00405, 392.0 * 0.99596, 392.0, 392.0 * 1.00405};
    const std::vector<float> beating = chord(8.0f, kRate, 0.5f, voices);
    double most = 0.0;
    const char* where = "";
    for (const Preset& preset : presets) {
      load(preset);
      double hold_low = 1.0e9, hold_high = -1.0e9;
      for (size_t done = 0; done + Imprint::Stft::kHop <= beating.size(); done += Imprint::Stft::kHop) {
        run(device, std::vector<float>(beating.begin() + done, beating.begin() + done + Imprint::Stft::kHop));
        if (done < 96000 || done >= 360000) continue;
        hold_low = std::min(hold_low, static_cast<double>(device.meter(Imprint::kHoldReading)));
        hold_high = std::max(hold_high, static_cast<double>(device.meter(Imprint::kHoldReading)));
      }
      if (hold_high - hold_low > most) {
        most = hold_high - hold_low;
        where = preset.name;
      }
    }
    std::printf("a held chord that beats, all presets: the hold's gain moves by %.2f dB at most (%s)\n", most, where);
    EXPECT(most < 4.0, "the hold does not follow the beating of a chorused chord");

    // (d) A strike over a held sound. Its first frame is mostly the sound
    // before it, so it does not count as new; but where the curve lifts what
    // that sound lacks the strike is most of what leaves, and the gain the
    // frame needs falls by 5 to 14 dB in one hop. The hold used to rest there,
    // up to its 6 dB of slack over what the frame needed (a phrase fed at
    // -1 dBFS left at +2.0 dBFS). Struck notes through every preset, a hop at
    // a time, twice: as played, and with Replace moved by a hair before every
    // hop, which takes the gain to what each frame needs, so that the reading
    // of that run is the needed gain and its sound is every frame at its own
    // gain. (1) Where the needed gain lies more than 4.5 dB under the frame
    // before's and under the gain in use, the gain in use is the needed gain
    // (it rested over it at 26 of 40 such frames, by up to 5.9 dB). (2) A
    // strike with such a frame leaves within 1 dB of what it does with every
    // frame at its own gain (it left up to 4.9 dB over), and any strike within
    // 2.5 dB (4.8): where the needed gain falls by less than the hold asks
    // of a strike, or over two hops, the gain still rests within its slack.
    const std::vector<float> struck = struck_phrase(kRate, 0.8913f);
    const size_t hop = Imprint::Stft::kHop;
    const size_t span = static_cast<size_t>(0.03f * kRate);
    int sharp_frames = 0, rested = 0, sharp_strikes = 0, sharp_over = 0, other_over = 0;
    const int all_strikes = (kStruckNotes - 1) * static_cast<int>(sizeof presets / sizeof presets[0]);
    double most_rest = 0.0, most_sharp = 0.0, most_other = 0.0;
    for (const Preset& preset : presets) {
      std::vector<float> played, exact_out;
      std::vector<double> in_use, needed;
      for (int pass = 0; pass < 2; ++pass) {
        load(preset);
        std::vector<float>& into = pass == 0 ? played : exact_out;
        std::vector<double>& reading = pass == 0 ? in_use : needed;
        for (size_t done = 0; done + hop <= struck.size(); done += hop) {
          if (pass == 1) {
            const float hair = (done / hop) % 2 == 0 ? 1.0e-4f : -1.0e-4f;
            device.set_param(p::kReplace, preset.values[p::kReplace] + (preset.values[p::kReplace] > 0.5f ? -hair : hair));
          }
          const Stereo out = run(device, std::vector<float>(struck.begin() + done, struck.begin() + done + hop));
          into.insert(into.end(), out.left.begin(), out.left.end());
          reading.push_back(device.meter(Imprint::kHoldReading));
        }
      }
      std::vector<bool> sharp(kStruckNotes, false);
      for (size_t f = 1; f < needed.size(); ++f) {
        if (needed[f] > needed[f - 1] - 4.5 || needed[f] > in_use[f - 1]) continue;
        ++sharp_frames;
        const double rest = in_use[f] - needed[f];
        if (rest > 0.05) ++rested;
        most_rest = std::max(most_rest, rest);
        for (int n = 1; n < kStruckNotes; ++n) {
          if (std::fabs(static_cast<double>(f) - 0.6 * n * kRate / static_cast<double>(hop)) <= 3.0) sharp[n] = true;
        }
      }
      for (int n = 1; n < kStruckNotes; ++n) {
        const size_t from = static_cast<size_t>(0.6 * n * kRate) + kLatency - hop;
        const double over = peak(played, from, from + hop + span) / peak(exact_out, from, from + hop + span);
        if (sharp[n]) {
          ++sharp_strikes;
          most_sharp = std::max(most_sharp, over);
          if (over > 1.122) ++sharp_over;
        } else {
          most_other = std::max(most_other, over);
          if (over > 1.122) ++other_over;
        }
      }
    }
    std::printf("struck notes, all presets: at %d frames the needed gain fell by more than 4.5 dB in a hop, under the gain in "
                "use; the gain in use rested over it at %d of them, by %.2f dB at most\n",
                sharp_frames, rested, most_rest);
    std::printf("  the %d strikes with such a frame leave %+.2f dB at most over themselves with every frame at its own gain, "
                "%d by more than 1 dB; of the %d others %d do, %+.2f dB at most\n",
                sharp_strikes, db(most_sharp), sharp_over, all_strikes - sharp_strikes, other_over, db(most_other));
    EXPECT(sharp_frames >= 10 && sharp_strikes >= 10, "the struck notes do make the needed gain fall");
    EXPECT(rested == 0, "a frame that needs far less gain than the one before gets no more than it needs");
    EXPECT(most_sharp < 1.122, "a strike over a held sound leaves as it does with every frame at its own gain, within 1 dB");
    EXPECT(most_other < 1.3335, "and no strike leaves more than 2.5 dB over that");
  }

  // 23. Peaks. With the level held, a colour that evens a buzzing sound's
  // partials out raises its peaks (the first version let them 11.9 dB over
  // the input's). The peak hold keeps what comes out within 6 dB of the
  // loudest input sample: a played phrase, a run of notes and one low
  // sawtooth, through every preset and with Amount at both ends on every
  // shape, Replace at 0 and at 1.
  {
    std::vector<float> saw(static_cast<size_t>(3.0f * kRate), 0.0f);
    for (size_t i = 0; i < saw.size(); ++i) {
      double sample = 0.0;
      for (int n = 1; n <= 30; ++n) sample += std::sin(2.0 * kPi * 110.0 * n * static_cast<double>(i) / kRate + 0.9 * n) / n;
      saw[i] = static_cast<float>(0.3 * sample);
    }
    const std::vector<float> sounds[] = {phrase(kRate, 0.5f), steady_notes(0.5f, 8, 0.5f), saw};
    std::vector<Preset> settings(presets, presets + 16);
    for (int shape = 0; shape <= Imprint::kBuiltIn; ++shape) {
      for (float amount : {-2.0f, 2.0f}) {
        for (float replace : {0.0f, 1.0f}) {
          settings.push_back({"an end of Amount", {1.0f, static_cast<float>(shape), amount, 0.0f, replace, 0.5f, 2.0f, 1.0f}});
        }
      }
    }
    double worst = 0.0;
    for (const Preset& setting : settings) {
      for (const std::vector<float>& sound : sounds) {
        load(setting);
        const Stereo out = run(device, sound);
        const double over = std::max(peak(out.left), peak(out.right)) / peak(sound);
        if (over > 2.0) {
          std::printf("  %s (shape %.0f, Amount %+.0f, Replace %.0f): peak %+.1f dB over the input's\n", setting.name,
                      setting.values[1], setting.values[2], setting.values[4], db(over));
        }
        worst = std::max(worst, over);
      }
    }
    std::printf("peaks: at most %+.2f dB over the input's own, 16 presets and 28 ends, three sounds\n", db(worst));
    EXPECT(worst <= 2.0001, "what comes out never peaks more than 6 dB over the loudest input sample");
  }

  // 24. An empty capture. A capture is not saved with a piece, so a piece
  // saved with Shape at Captured and Capture off loads with nothing captured.
  // The first version then passed the sound unchanged, every knob dead, until
  // the player captured something. Now the open vowel stands in: the same
  // samples as Shape at Open vowel, and the reading "heard" says 0 so that
  // the display can say so. Capture switched on, the capture takes over.
  {
    const std::vector<float> pad = chord(4.0f, kRate, 0.5f, {130.81, 196.0, 311.13, 392.0});
    device.init(kRate);
    device.set_param(p::kCapture, 0.0f);
    device.set_param(p::kShape, 0.0f);
    const Stereo empty = run(device, pad);
    const float heard = device.meter(Imprint::kHeardReading);
    device.init(kRate);
    device.set_param(p::kCapture, 0.0f);
    device.set_param(p::kShape, 1.0f);
    const Stereo vowel = run(device, pad);
    std::vector<float> late(empty.left.begin() + kLatency, empty.left.end());
    const double change = worst_difference(shape_of(late, 48000), shape_of(pad, 48000));
    std::printf("an empty capture: the colour moves by %.1f dB (the open vowel stands in), heard %.2f\n", change, heard);
    EXPECT(change > 4.0, "Captured with nothing captured still presses a colour on the sound");
    EXPECT(empty.left == vowel.left && empty.right == vowel.right, "and it is the open vowel, sample for sample");
    EXPECT(heard == 0.0f, "the reading says that nothing has been captured");
    // Switched on, it learns the pad and presses that on instead.
    device.init(kRate);
    device.set_param(p::kCapture, 0.0f);
    device.set_param(p::kShape, 0.0f);
    run(device, pad);
    device.set_param(p::kCapture, 1.0f);
    const Stereo learned = run(device, pad);
    double apart = 0.0;
    for (size_t i = 96000; i < pad.size(); ++i) apart = std::max(apart, std::fabs(static_cast<double>(learned.left[i]) - vowel.left[i]));
    EXPECT(device.meter(Imprint::kHeardReading) == 1.0f && apart > 0.01, "Capture switched on, what it learns takes the stand-in's place");
  }

  // 25. Samples past full scale are not sound and teach nothing. kit::Stft
  // drops what is not a number or is at ±64 and beyond, but a burst at ±60
  // passes: in the first version 64 such samples outweighed everything
  // Capture had learned (the captured colour still read up to 10 dB wrong
  // eight seconds later, and with Learn at 20 s for minutes). Now the colour
  // captured with the burst is the colour captured without it: a frame over
  // full scale teaches nothing, nor does one that only touches the burst
  // with its edge (a square at 8 times full scale left the colour 6 to 8 dB
  // off while only the frames' power was looked at).
  {
    const std::vector<float> pad = chord(10.0f, kRate, 0.25f, {130.81, 196.0, 311.13, 392.0});
    int worst = 0;
    for (float learn : {2.0f, 20.0f}) {
      for (int length : {64, 4800, -4800}) {
        std::vector<float> burst = pad;
        const float size = length > 0 ? 60.0f : 8.0f;
        for (int i = 0; i < std::abs(length); ++i) burst[96000 + i] = (i / 37) % 2 ? size : -size;
        int colour[2][Imprint::kDisplayPoints];
        for (int pass = 0; pass < 2; ++pass) {
          device.init(kRate);
          device.set_param(p::kShape, 0.0f);
          device.set_param(p::kLearn, learn);
          const Stereo out = run(device, pass ? burst : pad);
          EXPECT(finite(out.left) && finite(out.right), "a burst past full scale: finite out");
          for (int point = 0; point < Imprint::kDisplayPoints; ++point) colour[pass][point] = captured_point(device, point);
        }
        for (int point = 0; point < Imprint::kDisplayPoints; ++point) {
          worst = std::max(worst, std::abs(colour[1][point] - colour[0][point]));
        }
      }
    }
    std::printf("a burst at 60 and at 8 times full scale while capturing: the captured colour is %d dB off at worst\n", worst);
    EXPECT(worst <= 1, "samples past full scale do not get into what is captured");
  }

  // 26. What the display is told. (a) The hold reading is the gain the level
  // hold gave: of six steady tones, three on bells of the open vowel, the one
  // far below every bell (150 Hz, where the curve is 0 dB) comes out changed
  // by just that. (b) With Replace at 0 nothing is added; with Replace at 1
  // and white noise in, what Replace is reported to add and the hold together
  // are what was done to the noise in every third octave the bells do not
  // reach (built_in_db says where they are), within 1.5 dB. (The bells
  // themselves, through the frame's bins, are held to the display's own
  // curve in src/react/__tests__/displays.imprint.test.ts.)
  {
    const std::vector<double> hz = {150.0, 300.0, 730.0, 1090.0, 2440.0, 5000.0};
    const std::vector<float> tones = many_tones(hz, 4.0f, kRate, 0.2f);
    device.init(kRate);
    device.set_param(p::kReplace, 0.0f);
    const Stereo out = run(device, tones);
    const std::vector<double> before = tone_levels(tones, 48000, hz, kRate);
    const std::vector<double> after = tone_levels(out.left, 48000 + kLatency, hz, kRate);
    const double lowest = after[0] - before[0];
    const double hold = device.meter(Imprint::kHoldReading);
    std::printf("readings: the hold says %+.2f dB, a 150 Hz tone under no bell came out %+.2f dB\n", hold, lowest);
    EXPECT(hold < -1.0, "the hold turns down what the bells turn up");
    EXPECT_NEAR(lowest, hold, 0.3, "the hold reading is the gain a tone under no bell meets");
    bool none = true;
    for (int r = 0; r < Imprint::kReadings; ++r) {
      long packed = std::lround(device.meter(Imprint::kAddedReading + r));
      for (int j = 0; j < Imprint::kPerReading; ++j, packed /= Imprint::kLevels) none = none && packed % Imprint::kLevels == Imprint::kLevels / 2;
    }
    EXPECT(none, "with Replace at 0 nothing is reported as added");

    rng_state() = 91;
    const std::vector<float> white_noise = noise(6.0f, kRate, 0.25f);
    device.init(kRate);
    device.set_param(p::kReplace, 1.0f);
    // The sound's own shape moves with the noise from frame to frame, and
    // what Replace adds with it: the readings are taken every hop from the
    // third second on and averaged, as the spectra are.
    Stereo flat;
    std::vector<double> added_mean(Imprint::kDisplayPoints, 0.0);
    double hold_mean = 0.0;
    int taken = 0;
    for (size_t done = 0; done + Imprint::Stft::kHop <= white_noise.size(); done += Imprint::Stft::kHop) {
      const std::vector<float> hop(white_noise.begin() + done, white_noise.begin() + done + Imprint::Stft::kHop);
      flat = concat(flat, run(device, hop));
      if (done < 96000) continue;
      for (int place = 0; place < Imprint::kDisplayPoints; ++place) {
        long packed = std::lround(device.meter(Imprint::kAddedReading + place / Imprint::kPerReading));
        for (int j = 0; j < place % Imprint::kPerReading; ++j) packed /= Imprint::kLevels;
        added_mean[place] += static_cast<double>(packed % Imprint::kLevels - Imprint::kLevels / 2);
      }
      hold_mean += device.meter(Imprint::kHoldReading);
      ++taken;
    }
    for (double& value : added_mean) value /= taken;
    hold_mean /= taken;
    const std::vector<double> in_power = spectrum(white_noise, 96000, flat.left.size() - kLatency);
    const std::vector<double> out_power = spectrum(flat.left, 96000 + kLatency, flat.left.size());
    // What Replace is reported to add at one of the 55 places, in dB.
    auto added = [&](int place) { return added_mean[std::min(place, Imprint::kDisplayPoints - 1)]; };
    double worst = 0.0;
    int compared = 0;
    for (double centre : thirds()) {
      // The curve as reported, over the third octave: the mean of its grid points as powers.
      double sum = 0.0;
      int count = 0;
      for (int g = 0; g < Imprint::kPoints; ++g) {
        const double at = Imprint::kLowHz * std::pow(2.0, static_cast<double>(g) / Imprint::kPerOctave);
        if (at < centre * std::pow(2.0, -1.0 / 6.0) || at >= centre * std::pow(2.0, 1.0 / 6.0)) continue;
        const int place = g / Imprint::kDisplayStep;
        const double part = static_cast<double>(g % Imprint::kDisplayStep) / Imprint::kDisplayStep;
        const double db_here = added(place) + part * (added(place + 1) - added(place));
        sum += std::pow(10.0, std::min(30.0, std::max(-30.0, db_here)) / 10.0);
        ++count;
      }
      // Not where a bell reaches within a third of an octave (Smooth spreads it by a fifth).
      for (int g = 0; g < Imprint::kPoints; ++g) {
        const double at = Imprint::kLowHz * std::pow(2.0, static_cast<double>(g) / Imprint::kPerOctave);
        const bool near = at > centre * std::pow(2.0, -0.5) && at < centre * std::pow(2.0, 0.5);
        if (near && Imprint::built_in_db(0, static_cast<float>(g) / Imprint::kPerOctave) > 0.05f) count = 0;
      }
      if (count <= 0) continue;
      ++compared;
      const double said = 10.0 * std::log10(sum / count) + hold_mean;
      const double done = band_db(out_power, centre, kRate) - band_db(in_power, centre, kRate);
      if (std::getenv("IMPRINT_VERBOSE")) std::printf("  %7.0f Hz: said %+.2f dB, done %+.2f dB\n", centre, said, done);
      worst = std::max(worst, std::fabs(done - said));
    }
    const double tilt = added(38) - added(8);  // the places nearest 3.2 kHz and 100 Hz
    std::printf("readings: Replace 1 on white noise, what is reported is what was done within %.2f dB in %d third octaves; "
                "it adds %+.0f dB from 100 Hz to 3.2 kHz\n", worst, compared, tilt);
    EXPECT(compared >= 8 && worst < 1.5, "what Replace adds and the hold, as reported, are what is done to the sound");
    EXPECT(tilt < -8.0, "Replace on white noise adds the open vowel's downward slope");
  }

  // Cost: the average at the defaults and at the most there is to do (Capture
  // on, the captured shape, Replace, the widest Smooth: every frame learns,
  // splits and composes), and the worst block, which is one with a frame in
  // it. Stretches of 256 blocks are timed and the fastest kept, because the
  // machine is shared.
  rng_state() = 0xBEEFu;
  const std::vector<float> input = noise(10.0f, kRate, 0.25f);
  for (int worst_case = 0; worst_case < 2; ++worst_case) {
    device.init(kRate);
    if (worst_case) {
      device.set_param(p::kShape, 0.0f);
      device.set_param(p::kReplace, 1.0f);
      device.set_param(p::kSmooth, 1.0f);
    }
    std::vector<double> micros;
    double best = 1.0e30, stretch = 0.0;
    int in_stretch = 0;
    for (size_t done = 0; done + 128 <= input.size(); done += 128) {
      for (int i = 0; i < 128; ++i) device.in_left()[i] = device.in_right()[i] = input[done + i];
      const auto start = std::chrono::steady_clock::now();
      device.process(128);
      const double took = std::chrono::duration<double, std::micro>(std::chrono::steady_clock::now() - start).count();
      micros.push_back(took);
      stretch += took;
      if (++in_stretch == 256) {
        best = std::min(best, stretch / 256.0);
        stretch = 0.0;
        in_stretch = 0;
      }
    }
    std::sort(micros.begin(), micros.end());
    // A quarter of the blocks hold the left frame, so the 90th percentile is one of them.
    const double heavy = micros[micros.size() * 90 / 100];
    std::printf("imprint %s: %.1f us per 128-frame stereo block, %.2f%% of real time at 48 kHz (native); worst block "
                "%.1f us, %.2f%% of its 2667 us\n",
                worst_case ? "at its worst" : "at defaults", best, 100.0 * best / 2666.7, heavy, 100.0 * heavy / 2666.7);
  }
  device.init(kRate);
  report_cost("imprint", 10.0f, kRate, [&] { run(device, input); });

  return finish("imprint");
}
