// Native harness for Imprint (cpp/devices/imprint). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest asserts what makes it an imprint: what is captured is what
// is stamped, and the stamp does what each control says.

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

// The frequency of the strongest 1/24 octave band between two frequencies.
static double peak_hz(const std::vector<double>& power, double from_hz, double to_hz, double rate) {
  double best = from_hz, best_db = -1.0e9;
  for (double hz = from_hz; hz <= to_hz; hz *= std::pow(2.0, 1.0 / 96.0)) {
    const double level = band_db(power, hz, rate, 1.0 / 24.0);
    if (level > best_db) {
      best_db = level;
      best = hz;
    }
  }
  return best;
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
  // tones, the two curves add up to nothing, tone by tone.
  {
    const std::vector<double> hz = tone_set(150.0, 9000.0);
    const std::vector<float> in = many_tones(hz, 3.5f, kRate, 0.2f);
    std::vector<double> curves[2];
    int which = 0;
    for (float amount : {1.0f, -1.0f}) {
      device.init(kRate);
      device.set_param(p::kCapture, 0.0f);
      device.set_param(p::kShape, 1.0f);
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
    EXPECT(worst < 0.3, "Amount -1 is the reciprocal of Amount 1");
  }

  // 5. Shift moves the stamp along the spectrum by the semitones it says:
  // the round vowel's first peak (300 Hz) is found again 12 up, 7 up and 12
  // down, each within a third of a semitone.
  {
    const std::vector<double> hz = tone_set(100.0, 4000.0);
    const std::vector<float> in = many_tones(hz, 3.5f, kRate, 0.2f);
    for (float shift : {0.0f, 12.0f, 7.0f, -12.0f}) {
      device.init(kRate);
      device.set_param(p::kCapture, 0.0f);
      device.set_param(p::kShape, 2.0f);
      device.set_param(p::kSmooth, 0.2f);
      device.set_param(p::kShift, shift);
      const std::vector<double> curve = curve_of(in, run(device, in).left, 72000, hz, kRate);
      const double claimed = 300.0 * std::pow(2.0, shift / 12.0);
      const double found = curve_peak(curve, hz, claimed / 1.5, claimed * 1.5);
      std::printf("shift %+.0f st: the 300 Hz peak is at %.1f Hz (%.1f claimed)\n", shift, found, claimed);
      EXPECT(std::fabs(12.0 * std::log2(found / claimed)) < 0.34, "Shift moves a peak by the semitones it says");
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
  // at every step, from over 10 dB to under 4.
  {
    const std::vector<double> hz = tone_set(150.0, 9000.0);
    const std::vector<float> in = many_tones(hz, 3.5f, kRate, 0.2f);
    double last = 1.0e9, first = 0.0;
    bool falling = true;
    for (float smooth : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) {
      device.init(kRate);
      device.set_param(p::kCapture, 0.0f);
      device.set_param(p::kShape, 4.0f);
      device.set_param(p::kSmooth, smooth);
      const std::vector<double> curve = curve_of(in, run(device, in).left, 72000, hz, kRate);
      const double range = *std::max_element(curve.begin(), curve.end()) - *std::min_element(curve.begin(), curve.end());
      std::printf("smooth %.2f: the tube's curve spans %.1f dB\n", smooth, range);
      falling = falling && range < last - 0.5;
      last = range;
      if (smooth == 0.0f) first = range;
    }
    EXPECT(falling, "every quarter of Smooth takes detail out of the stamp");
    EXPECT(first > 10.0 && last < 4.0, "Smooth runs from every bump to the broad colour only");
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
  // its level stays within 3 dB of the input's.
  {
    const std::vector<float> held = chord(60.0f, kRate, 1.0f, {110.0, 164.81, 277.18, 415.3});
    const double in_rms = rms(held);
    double worst_peak = 0.0, worst_growth = 0.0, low = 1.0e9, high = -1.0e9;
    auto measure = [&](int id, float value) {
      device.init(kRate);
      if (id >= 0) device.set_param(id, value);
      const Stereo out = run(device, held);
      const size_t n = out.size();
      worst_peak = std::max(worst_peak, peak(out.left));
      worst_growth = std::max(worst_growth, peak(out.left, n - 480000, n) / peak(out.left, 48000, 528000));
      const double level = db(rms(out.left, 96000, n) / in_rms);
      low = std::min(low, level);
      high = std::max(high, level);
      if (level < -3.0 || level > 3.0 || peak(out.left) > 2.0) {
        std::printf("  param %d at %g: level %+.2f dB, peak %.2f\n", id, value, level, peak(out.left));
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
    std::printf("level: a full-scale chord for a minute peaks at %.2f at worst, grows by %.3f, level %+.2f to %+.2f dB\n",
                worst_peak, worst_growth, low, high);
    EXPECT(worst_peak < 2.0, "a full-scale held chord never comes out 6 dB over full scale");
    EXPECT(worst_growth < 1.05, "and never grows");
    EXPECT(low > -3.0 && high < 3.0, "the level of a held chord stays within 3 dB of the input at every setting");
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

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("imprint", 10.0f, kRate, [&] { run(device, input); });

  return finish("imprint");
}
