// Native harness for Vintage Digital (cpp/devices/vintage-digital). The
// conformance pass covers stability, silence when idle, block-size
// independence and parameter abuse; the rest measures the converter: hold
// images, aliasing, quantisation noise, companding, jitter, the clip, and
// that nothing is in the output that the model does not predict.

#include <complex>
#include <cstdlib>

#include "../devices/vintage-digital/vintage_digital.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::VintageDigital;
namespace p = livemix::vintage_digital;

static VintageDigital device;

static const float kRate = 48000.0f;
static const size_t kLatency = VintageDigital::kLatency;
enum { kNone = 0, kSoft = 1, kSteep = 2 };
enum { kLinear = 0, kMuLaw = 1 };

// A converter with nothing wrong with it but its rate: sixteen bits, a steady
// clock, no drive, the input filter fully in and no output filter. Each check
// turns on the one thing it measures.
static void ideal(VintageDigital& d, float rate, float sample_rate = kRate) {
  d.init(sample_rate);
  d.set_param(p::kRate, rate);
  d.set_param(p::kBits, 16.0f);
  d.set_param(p::kCompanding, kLinear);
  d.set_param(p::kAliasing, 0.0f);
  d.set_param(p::kFilter, kNone);
  d.set_param(p::kJitter, 0.0f);
  d.set_param(p::kDrive, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

// What a zero-order hold at `rate` leaves of a component at `hz`.
static double hold(double hz, double rate) {
  const double x = kPi * hz / rate;
  return std::fabs(std::sin(x) / x);
}

// With VD_NOTES set, prints the measured figure behind each labelled check.
static void note(const char* label) {
  static const bool on = std::getenv("VD_NOTES") != nullptr;
  if (on) std::printf("note: %s\n", label);
}

static float db_to_gain_f(float decibels) { return std::pow(10.0f, decibels / 20.0f); }

static std::vector<float> difference(const std::vector<float>& a, const std::vector<float>& b) {
  std::vector<float> d(a.size());
  for (size_t i = 0; i < a.size(); ++i) d[i] = a[i] - b[i];
  return d;
}

// Signal-to-noise ratio in dB of a 997 Hz tone at `level` through `bits`,
// taking the same converter at 16 bits as the signal.
static double snr(float rate, float bits, int companding, float level, float drive = 0.0f) {
  const std::vector<float> in = sine(997.0f, 1.5f, kRate, level);
  ideal(device, rate);
  device.set_param(p::kDrive, drive);
  Stereo reference = run(device, in);
  ideal(device, rate);
  device.set_param(p::kDrive, drive);
  device.set_param(p::kBits, bits);
  device.set_param(p::kCompanding, static_cast<float>(companding));
  Stereo out = run(device, in);
  return db(rms(reference.left, 4800) / rms(difference(out.left, reference.left), 4800));
}

// What is left of x after the best-fitting sine at `hz` is taken out, as a
// ratio in dB of that sine's level to the rest.
static double tone_to_rest(const std::vector<float>& x, double hz, double sample_rate, size_t from) {
  double ss = 0, cc = 0, sc = 0, xs = 0, xc = 0;
  for (size_t i = from; i < x.size(); ++i) {
    const double phase = 2.0 * kPi * hz * static_cast<double>(i) / sample_rate;
    const double s = std::sin(phase), c = std::cos(phase);
    ss += s * s;
    cc += c * c;
    sc += s * c;
    xs += x[i] * s;
    xc += x[i] * c;
  }
  const double det = ss * cc - sc * sc;
  const double a = (xs * cc - xc * sc) / det, b = (xc * ss - xs * sc) / det;
  double rest = 0;
  for (size_t i = from; i < x.size(); ++i) {
    const double phase = 2.0 * kPi * hz * static_cast<double>(i) / sample_rate;
    const double r = x[i] - a * std::sin(phase) - b * std::cos(phase);
    rest += r * r;
  }
  rest = std::sqrt(rest / static_cast<double>(x.size() - from));
  return db(std::sqrt(0.5 * (a * a + b * b)) / std::max(rest, 1.0e-12));
}

static void fft(std::vector<std::complex<double>>& a) {
  const size_t n = a.size();
  for (size_t i = 1, j = 0; i < n; ++i) {
    size_t bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) std::swap(a[i], a[j]);
  }
  for (size_t length = 2; length <= n; length <<= 1) {
    const double angle = -2.0 * kPi / static_cast<double>(length);
    const std::complex<double> turn(std::cos(angle), std::sin(angle));
    for (size_t i = 0; i < n; i += length) {
      std::complex<double> w(1.0);
      for (size_t k = 0; k < length / 2; ++k) {
        const std::complex<double> u = a[i + k], v = a[i + k + length / 2] * w;
        a[i + k] = u + v;
        a[i + k + length / 2] = u - v;
        w *= turn;
      }
    }
  }
}

struct Line {
  double hz, level;
};

// The spectral lines of `n` samples of x from `from` that stand above
// `floor`: amplitude 1.0 for a full-scale sine. Blackman-Harris window, whose
// own skirts are 92 dB down, so a line here is a component and not leakage.
static std::vector<Line> lines(const std::vector<float>& x, size_t from, size_t n, double sample_rate,
                               double floor) {
  std::vector<std::complex<double>> a(n);
  double window_sum = 0.0;
  for (size_t i = 0; i < n; ++i) {
    const double t = 2.0 * kPi * static_cast<double>(i) / static_cast<double>(n);
    const double w =
        0.35875 - 0.48829 * std::cos(t) + 0.14128 * std::cos(2.0 * t) - 0.01168 * std::cos(3.0 * t);
    a[i] = w * x[from + i];
    window_sum += w;
  }
  fft(a);
  std::vector<double> magnitude(n / 2);
  for (size_t i = 0; i < n / 2; ++i) magnitude[i] = 2.0 * std::abs(a[i]) / window_sum;
  std::vector<Line> out;
  for (size_t i = 4; i + 4 < n / 2; ++i) {
    if (magnitude[i] < floor) continue;
    bool top = true;
    for (size_t k = i - 4; k <= i + 4; ++k) top = top && magnitude[k] <= magnitude[i];
    if (top) out.push_back({static_cast<double>(i) * sample_rate / static_cast<double>(n), magnitude[i]});
  }
  return out;
}

// The strongest line under `limit_hz` that a converter at `rate` fed a tone
// at `hz` cannot have made: everything it makes is at |k * rate ± hz|.
static double strongest_unpredicted(const std::vector<Line>& found, double hz, double rate,
                                    double limit_hz, double tolerance) {
  double worst = 0.0;
  for (const Line& line : found) {
    if (line.hz > limit_hz) continue;
    const double k = std::round((line.hz - hz) / rate), m = std::round((line.hz + hz) / rate);
    const bool predicted = std::fabs(k * rate + hz - line.hz) < tolerance ||
                           std::fabs(m * rate - hz - line.hz) < tolerance;
    if (!predicted) worst = std::max(worst, line.level);
  }
  return worst;
}

int main() {
  Conformance spec;
  spec.name = "vintage-digital";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 1.0f;
  // A steep filter after a stair of full-scale values overshoots: 2.0 was the
  // most found (a full-scale square wave, or noise, at any Rate).
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // Latency: Mix 0 is the input delayed by exactly the reported count.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    rng_state() = 0xC0FFEEu;
    const std::vector<float> in = noise(0.5f, kRate, 0.5f);
    Stereo out = run(device, in);
    bool exact = true;
    for (size_t i = kLatency; i < in.size(); ++i) exact = exact && out.left[i] == in[i - kLatency];
    EXPECT(exact, "Mix 0 is the input, delayed by the latency, to the bit");
    EXPECT(kLatency == 129, "the latency is the 129 samples the manifest reports");
  }

  // Transparent at the top: Rate all the way up, 16 bits, no drive, no
  // filter is the input (delayed) to within the 16-bit step, at every host rate.
  for (float sample_rate : {44100.0f, 48000.0f, 96000.0f}) {
    ideal(device, 48000.0f, sample_rate);
    rng_state() = 0xC0FFEEu;
    const std::vector<float> in = noise(0.5f, sample_rate, 0.5f);
    Stereo out = run(device, in);
    double worst = 0.0;
    for (size_t i = kLatency; i < in.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - in[i - kLatency]));
    }
    char label[120];
    std::snprintf(label, sizeof label, "transparent at the top settings at %.0f Hz (error %.1f dBFS)",
                  sample_rate, db(worst));
    EXPECT(db(worst) < -80.0, label);
    note(label);
  }

  // Images: a 1 kHz tone held at 8 kHz comes out with copies at 7 and 9 kHz
  // (and 15 and 17) at the levels a zero-order hold gives, sin(x)/x with
  // x = pi f / rate. The same in Hz at every host rate.
  for (float sample_rate : {48000.0f, 44100.0f, 96000.0f}) {
    ideal(device, 8000.0f, sample_rate);
    Stereo out = run(device, sine(1000.0f, 1.0f, sample_rate, 0.5f));
    const size_t from = static_cast<size_t>(0.1f * sample_rate);
    for (double hz : {1000.0, 7000.0, 9000.0, 15000.0, 17000.0}) {
      const double measured = db(tone_level(out.left, hz, sample_rate, from) / 0.5);
      char label[120];
      std::snprintf(label, sizeof label, "image at %.0f Hz follows the hold's envelope at %.0f Hz",
                    hz, sample_rate);
      EXPECT_NEAR(measured, db(hold(hz, 8000.0)), 2.0, label);
      note(label);
    }
  }

  // The Steep output filter takes the images out; Soft takes some.
  {
    double level[3][2];
    for (int filter = 0; filter < 3; ++filter) {
      ideal(device, 8000.0f);
      device.set_param(p::kFilter, static_cast<float>(filter));
      Stereo out = run(device, sine(1000.0f, 1.0f, kRate, 0.5f));
      const double tone = tone_level(out.left, 1000.0, kRate, 4800);
      level[filter][0] = db(tone_level(out.left, 7000.0, kRate, 4800) / tone);
      level[filter][1] = db(tone_level(out.left, 9000.0, kRate, 4800) / tone);
    }
    EXPECT(level[kSteep][0] < -50.0 && level[kSteep][1] < -50.0,
           "Steep: the images are more than 50 dB under the tone");
    EXPECT(level[kSoft][0] < level[kNone][0] - 5.0 && level[kSoft][0] > level[kNone][0] - 20.0,
           "Soft: the first image is 5 to 20 dB lower than with no filter");
    EXPECT(level[kSoft][1] < level[kSoft][0] - 3.0, "Soft: higher images are taken down further");
  }

  // Steep tracks Rate: the first image of a 1 kHz tone is gone at 4 kHz and at 20 kHz.
  for (float rate : {4000.0f, 20000.0f}) {
    ideal(device, rate);
    device.set_param(p::kFilter, kSteep);
    Stereo out = run(device, sine(1000.0f, 1.0f, kRate, 0.5f));
    const double tone = tone_level(out.left, 1000.0, kRate, 4800);
    const double image = tone_level(out.left, rate - 1000.0, kRate, 4800);
    EXPECT(tone > 0.4 && db(image / tone) < -50.0, "the Steep filter follows Rate");
  }

  // Aliasing: 5 kHz into an 8 kHz converter folds to 3 kHz. With the input
  // filter out it is there at the hold's level; with it in, it is gone; half
  // way the filter lets a quarter of it through.
  {
    double alias[3];
    const float settings[3] = {1.0f, 0.5f, 0.0f};
    for (int i = 0; i < 3; ++i) {
      ideal(device, 8000.0f);
      device.set_param(p::kAliasing, settings[i]);
      Stereo out = run(device, sine(5000.0f, 1.0f, kRate, 0.5f));
      alias[i] = db(tone_level(out.left, 3000.0, kRate, 4800) / 0.5);
    }
    EXPECT_NEAR(alias[0], db(hold(3000.0, 8000.0)), 2.0, "Aliasing 1: 5 kHz folds to 3 kHz at full level");
    EXPECT_NEAR(alias[1], alias[0] - 12.04, 2.0, "Aliasing 0.5 lets a quarter of it fold");
    EXPECT(alias[2] < -50.0, "Aliasing 0: the fold is more than 50 dB down");
  }

  // Bits, Linear: a full-scale tone has 6.02 dB of signal-to-noise per bit
  // plus 1.76, with the resampling on and with it off (Rate at the top).
  for (float rate : {16000.0f, 48000.0f}) {
    for (float bits : {6.0f, 8.0f, 12.0f}) {
      char label[120];
      std::snprintf(label, sizeof label, "%.0f bits at %.0f Hz: signal-to-noise of a full-scale tone",
                    bits, rate);
      EXPECT_NEAR(snr(rate, bits, kLinear, 1.0f), 6.02 * bits + 1.76, 3.0, label);
      note(label);
    }
  }

  // Companding: at 8 bits Mu-law keeps the signal-to-noise ratio nearly the
  // same from full scale to -40 dBFS, where Linear loses it dB for dB.
  {
    double lowest = 1.0e9, highest = -1.0e9;
    for (float level_db : {0.0f, -10.0f, -20.0f, -30.0f, -40.0f}) {
      const double ratio = snr(16000.0f, 8.0f, kMuLaw, db_to_gain_f(level_db));
      lowest = std::min(lowest, ratio);
      highest = std::max(highest, ratio);
    }
    EXPECT(highest - lowest < 8.0, "Mu-law: signal-to-noise within 8 dB from 0 to -40 dBFS");
    EXPECT(lowest > 30.0 && highest < 45.0, "Mu-law at 8 bits sits near 38 dB");
    const double linear_loud = snr(16000.0f, 8.0f, kLinear, 1.0f);
    const double linear_quiet = snr(16000.0f, 8.0f, kLinear, 0.01f);
    EXPECT_NEAR(linear_loud - linear_quiet, 40.0, 4.0, "Linear loses signal-to-noise dB for dB");
    EXPECT(snr(16000.0f, 8.0f, kMuLaw, 0.01f) > linear_quiet + 15.0,
           "Mu-law is the cleaner of the two on quiet material");
  }

  // Nothing but the model: with no output filter, every line in the
  // spectrum above -80 dB (against the input) and under 0.45 of the host rate
  // is the tone, one of its folds, or a hold image (k * rate ± tone). The
  // interpolation that reads the input between samples and the band-limited
  // step that draws the stair add nothing of their own. Rates that do not
  // divide the host rate, so a fold of the implementation would land apart.
  {
    struct Case {
      float sample_rate, rate, hz, aliasing;
    };
    const Case cases[] = {{48000.0f, 7000.0f, 1234.0f, 0.0f},  {48000.0f, 13000.0f, 997.0f, 1.0f},
                          {48000.0f, 8000.0f, 5000.0f, 1.0f},  {48000.0f, 31000.0f, 9000.0f, 1.0f},
                          {44100.0f, 11025.0f, 3000.0f, 1.0f}, {96000.0f, 22050.0f, 3000.0f, 1.0f}};
    const size_t n = 1 << 16;
    for (const Case& c : cases) {
      ideal(device, c.rate, c.sample_rate);
      device.set_param(p::kAliasing, c.aliasing);
      const std::vector<float> in =
          sine(c.hz, static_cast<float>(n + 9600) / c.sample_rate + 0.1f, c.sample_rate, 0.5f);
      Stereo out = run(device, in);
      const std::vector<Line> found = lines(out.left, 9600, n, c.sample_rate, 0.5e-5);
      const double stray = strongest_unpredicted(found, c.hz, c.rate, 0.45 * c.sample_rate,
                                                 4.0 * c.sample_rate / static_cast<double>(n));
      char label[160];
      std::snprintf(label, sizeof label,
                    "%.0f Hz at rate %.0f, host %.0f: nothing the model does not predict (%zu lines, "
                    "strongest stray %.1f dB)",
                    c.hz, c.rate, c.sample_rate, found.size(), db(stray / 0.5));
      EXPECT(found.size() >= 3 && db(stray / 0.5) < -80.0, label);
      note(label);
    }
  }

  // Jitter is a timing error, so the noise it makes grows with frequency: a
  // 6 kHz tone gets far more than a 300 Hz one, and a steady clock makes
  // none. Steep filters on both sides leave only the tone and that noise.
  {
    double ratio[2][2];
    const float tones[2] = {300.0f, 6000.0f};
    const float settings[2] = {0.0f, 1.0f};
    for (int j = 0; j < 2; ++j) {
      for (int t = 0; t < 2; ++t) {
        ideal(device, 16000.0f);
        device.set_param(p::kFilter, kSteep);
        device.set_param(p::kJitter, settings[j]);
        Stereo out = run(device, sine(tones[t], 1.5f, kRate, 0.5f));
        ratio[j][t] = tone_to_rest(out.left, tones[t], kRate, 4800);
      }
    }
    EXPECT(ratio[0][0] > 70.0 && ratio[0][1] > 70.0, "a steady clock adds no noise");
    EXPECT_NEAR(ratio[1][1], 10.5, 3.0, "Jitter 1: noise 10 dB under a 6 kHz tone (0.12 of a period, RMS)");
    EXPECT(ratio[1][0] > ratio[1][1] + 20.0, "jitter noise is over 20 dB lower under a 300 Hz tone");
    // The default amount is a little grain that can be heard, not a hiss:
    // at the default Rate it sits 30 to 45 dB under a 1 kHz tone (at the old
    // default of 0.1 it was 60 dB under the sound, which nobody would hear).
    ideal(device, p::kParamDefault[p::kRate]);
    device.set_param(p::kFilter, kSteep);
    device.set_param(p::kJitter, p::kParamDefault[p::kJitter]);
    Stereo out = run(device, sine(1000.0f, 1.5f, kRate, 0.5f));
    const double grain = tone_to_rest(out.left, 1000.0, kRate, 4800);
    char label[120];
    std::snprintf(label, sizeof label, "the default Jitter is a little grain: %.1f dB under a 1 kHz tone", grain);
    EXPECT(grain > 30.0 && grain < 45.0, label);
    note(label);
  }

  // Drive. The input stage is exactly linear up to full scale and flat just
  // above it; the make-up holds a -18 dBFS signal near where it came in.
  {
    for (float drive : {6.0f, 12.0f, 24.0f}) {
      ideal(device, 16000.0f);
      device.set_param(p::kDrive, drive);
      Stereo out = run(device, sine(440.0f, 1.0f, kRate, 0.125f));
      const double change = db(rms(out.left, 4800) / (0.125 * 0.70711));
      char label[120];
      std::snprintf(label, sizeof label, "Drive %.0f dB: a -18 dBFS tone stays within 4 dB (%+.2f dB)",
                    drive, change);
      EXPECT(change > -4.0 && change < 4.0, label);
      note(label);
    }
    // More drive uses more of the converter: at 8 bits a -30 dBFS tone gains
    // 12 dB of signal-to-noise from 12 dB of drive.
    const double plain = snr(16000.0f, 8.0f, kLinear, 0.0316f);
    const double driven = snr(16000.0f, 8.0f, kLinear, 0.0316f, 12.0f);
    EXPECT_NEAR(driven - plain, 12.0, 3.0, "12 dB of Drive buys 12 dB of signal-to-noise");
    // A full-scale tone driven 24 dB is clipped flat: it comes out at the
    // make-up times the input stage's ceiling, and no louder than it went in.
    ideal(device, 48000.0f);
    device.set_param(p::kDrive, 24.0f);
    Stereo square = run(device, sine(440.0f, 1.0f, kRate, 1.0f));
    EXPECT(peak(square.left, 4800) < 0.25 && peak(square.left, 4800) > 0.1,
           "a clipped full-scale tone is held under the level it came in at");
  }

  // The clip is anti-aliased. With the resampling off (Rate at the top) a
  // 1245 Hz tone driven 12 dB over full scale has harmonics at multiples of
  // 1245 Hz; everything else is fold-back from above Nyquist. The device's
  // is over 12 dB lower than a bare clip's of the same tone.
  {
    const size_t n = 1 << 16;
    const std::vector<float> in = sine(1245.0f, static_cast<float>(n + 9600) / kRate + 0.1f, kRate, 0.5f);
    ideal(device, 48000.0f);
    device.set_param(p::kDrive, 18.0f);
    Stereo out = run(device, in);
    std::vector<float> bare(in.size());
    for (size_t i = 0; i < in.size(); ++i) bare[i] = std::max(-1.0f, std::min(1.0f, in[i] * 7.9433f));
    // Fold-back against the fundamental, in dB.
    auto folded = [&](const std::vector<float>& x) {
      const std::vector<Line> found = lines(x, 9600, n, kRate, 1.0e-6);
      double fundamental = 1.0e-9, sum = 0.0;
      for (const Line& line : found) {
        const double harmonic = std::round(line.hz / 1245.0);
        if (std::fabs(harmonic * 1245.0 - line.hz) >= 4.0 * kRate / n) {
          sum += line.level * line.level;
        } else if (harmonic == 1.0) {
          fundamental = line.level;
        }
      }
      return db(std::sqrt(sum) / fundamental);
    };
    const double device_folded = folded(out.left), bare_folded = folded(bare);
    char label[120];
    std::snprintf(label, sizeof label, "clip fold-back %.1f dB under the fundamental (a bare clip: %.1f dB)",
                  -device_folded, -bare_folded);
    EXPECT(device_folded < -50.0 && device_folded < bare_folded - 12.0, label);
    note(label);
  }

  // No DC, whatever the quantiser: it is symmetric about zero.
  {
    device.init(kRate);
    device.set_param(p::kBits, 4.0f);
    device.set_param(p::kCompanding, kMuLaw);
    device.set_param(p::kDrive, 12.0f);
    Stereo out = run(device, sine(220.0f, 2.0f, kRate, 0.3f));
    EXPECT(std::fabs(mean(out.left, 4800)) < 1.0e-4 * rms(out.left, 4800) + 1.0e-5, "no DC at 4 bits, Mu-law, driven");
    device.init(kRate);
    device.set_param(p::kBits, 5.0f);
    Stereo crushed = run(device, sine(331.0f, 2.0f, kRate, 0.05f));
    EXPECT(std::fabs(mean(crushed.left, 4800)) < 1.0e-4, "no DC on a quiet tone at 5 bits");
  }

  // One clock, two converters: a mono input stays mono to the bit, jitter and
  // all, and a silent channel stays silent beside a busy one.
  {
    device.init(kRate);
    device.set_param(p::kJitter, 1.0f);
    device.set_param(p::kBits, 8.0f);
    rng_state() = 0xFACEu;
    const std::vector<float> in = noise(0.5f, kRate, 0.4f);
    Stereo out = run(device, in);
    EXPECT(out.left == out.right && rms(out.left) > 0.05, "mono in, mono out (correlation exactly 1)");
    device.init(kRate);
    Stereo one = run(device, in, silence(0.5f, kRate));
    EXPECT(peak(one.right) == 0.0 && rms(one.left) > 0.05, "the channels do not leak into each other");
  }

  // Rate is the knob that gets played. Dragged across its whole range and
  // back while a note sounds (40 steps a second, as a knob sends them), the
  // output never jumps further between samples than the stair of the steady
  // sound does at either end. The same for a jump, and for the switch in and
  // out of the top position.
  {
    const std::vector<float> tone = sine(220.0f, 1.0f, kRate, 0.25f);
    for (int filter = 0; filter < 3; ++filter) {
      device.init(kRate);
      device.set_param(p::kFilter, static_cast<float>(filter));
      device.set_param(p::kRate, 1000.0f);
      const double low = max_step(run(device, tone).left, 24000);
      double worst = 0.0;
      std::vector<float> chunk(1200);
      for (int direction = 0; direction < 2; ++direction) {
        for (int s = 0; s < 40; ++s) {
          const float t = static_cast<float>(s + 1) / 40.0f;
          device.set_param(p::kRate, 1000.0f * std::pow(48.0f, direction == 0 ? t : 1.0f - t));
          for (size_t i = 0; i < chunk.size(); ++i) chunk[i] = tone[static_cast<size_t>(s) * 1200 + i];
          worst = std::max(worst, max_step(run(device, chunk).left));
        }
      }
      char label[120];
      std::snprintf(label, sizeof label, "filter %d: a Rate sweep does not click (step %.3f, steady %.3f)",
                    filter, worst, low);
      // With no filter the stair at 1 kHz is itself the largest step there is
      // (up to 0.25 * 2 sin(pi 220 / 1000) = 0.32 for this tone).
      EXPECT(worst < (filter == kNone ? 0.33 : 1.5 * low + 0.002), label);
      note(label);
    }
    for (float target : {2000.0f, 48000.0f, 30000.0f}) {
      device.init(kRate);
      device.set_param(p::kRate, 9000.0f);
      const double before = max_step(run(device, tone).left, 24000);
      device.set_param(p::kRate, target);
      const double during = max_step(run(device, tone).left);
      EXPECT(during < 1.5 * before + 0.002, "a Rate jump glides without a click");
    }
  }

  // The switches cross-fade, and Bits, Drive and Mix ramp.
  {
    const std::vector<float> tone = sine(220.0f, 1.0f, kRate, 0.25f);
    struct Change {
      int id;
      float from, to;
      const char* name;
    };
    const Change changes[] = {{p::kFilter, kSoft, kSteep, "Filter Soft to Steep"},
                              {p::kFilter, kSteep, kNone, "Filter Steep to None"},
                              {p::kCompanding, kLinear, kMuLaw, "Companding"},
                              {p::kBits, 12.0f, 5.0f, "Bits"},
                              {p::kDrive, 0.0f, 24.0f, "Drive"},
                              {p::kAliasing, 0.0f, 1.0f, "Aliasing"},
                              {p::kJitter, 0.0f, 1.0f, "Jitter"},
                              {p::kMix, 1.0f, 0.0f, "Mix"}};
    for (const Change& change : changes) {
      device.init(kRate);
      device.set_param(p::kRate, 6000.0f);
      device.set_param(change.id, change.from);
      const double before = max_step(run(device, tone).left, 24000);
      device.set_param(change.id, change.to);
      const double during = max_step(run(device, tone).left);
      const double after = max_step(run(device, tone).left, 24000);
      char label[120];
      std::snprintf(label, sizeof label, "%s changes without a click (%.3f, steady %.3f and %.3f)",
                    change.name, during, before, after);
      EXPECT(during < 1.3 * std::max(before, after) + 0.002, label);
      note(label);
    }
  }

  // The converted signal is on time. Its filters and the hold make it late
  // by a few of its own sample periods; the sampler reads that much less far
  // back, so at low frequencies it arrives exactly with the dry signal
  // (within a tenth of a sample here) whatever the Rate, Filter and Aliasing.
  {
    for (float rate : {4000.0f, 16000.0f, 47000.0f}) {
      for (int filter = 0; filter < 3; ++filter) {
        for (float aliasing : {0.0f, 1.0f}) {
          ideal(device, rate);
          device.set_param(p::kFilter, static_cast<float>(filter));
          device.set_param(p::kAliasing, aliasing);
          const std::vector<float> in = sine(50.0f, 1.0f, kRate, 0.5f);
          Stereo out = run(device, in);
          double lag = tone_phase(in, 50.0, kRate, 9600, 38400) - tone_phase(out.left, 50.0, kRate, 9600, 38400);
          while (lag < -kPi) lag += 2.0 * kPi;
          while (lag > kPi) lag -= 2.0 * kPi;
          const double samples = lag / (2.0 * kPi * 50.0) * kRate;
          char label[140];
          std::snprintf(label, sizeof label,
                        "rate %.0f, filter %d, aliasing %.0f: low end arrives with the dry signal (%.3f samples)",
                        rate, filter, aliasing, samples - static_cast<double>(kLatency));
          EXPECT_NEAR(samples, static_cast<double>(kLatency), 0.1, label);
          note(label);
        }
      }
    }
    // So Mix half way is a blend and not a comb filter: tones under the
    // converter's band come out at the level they went in (before the
    // alignment the default patch lost 14 dB around 2.5 kHz).
    // Up to a quarter of the default Rate (as it was when the default was
    // 16 kHz). Nearer the input filter's edge, at 0.44 of Rate, the filter's
    // phase turns and a part-way Mix has a narrow dip (13 dB at 3.9 kHz for
    // Mix 0.5 at the default Rate): known, and not covered here.
    const float quarter = 0.25f * p::kParamDefault[p::kRate];
    for (float hz : {200.0f, 500.0f, 1000.0f, 0.5f * quarter, 0.75f * quarter, quarter}) {
      device.init(kRate);
      device.set_param(p::kMix, 0.5f);
      Stereo out = run(device, sine(hz, 0.5f, kRate, 0.25f));
      char label[120];
      std::snprintf(label, sizeof label, "Mix 0.5 at defaults keeps a %.0f Hz tone at its level (%+.2f dB)", hz,
                    db(tone_level(out.left, hz, kRate, 4800) / 0.25));
      EXPECT_NEAR(db(tone_level(out.left, hz, kRate, 4800) / 0.25), 0.0, 1.0, label);
      note(label);
    }
  }

  // Bad input does not stick. A sample that is not a number (or is infinite,
  // or absurdly large) used to lodge in the input filter and leave the
  // sampler holding its limit: a full-scale DC that never slept. Now the
  // output is finite throughout, the tone is back at its level and free of
  // DC a second later, and the device sleeps once the input stops.
  for (int filter = 0; filter < 3; ++filter) {
    const float bad[3][2] = {{std::nanf(""), std::nanf("")}, {INFINITY, -INFINITY}, {1.0e30f, -3.0e38f}};
    for (const float* pair : bad) {
      device.init(kRate);
      device.set_param(p::kFilter, static_cast<float>(filter));
      device.set_param(p::kDrive, 24.0f);
      std::vector<float> in = sine(330.0f, 2.0f, kRate, 0.03f);
      in[24000] = pair[0];
      in[24001] = pair[1];
      Stereo out = run(device, in);
      device.init(kRate);
      device.set_param(p::kFilter, static_cast<float>(filter));
      device.set_param(p::kDrive, 24.0f);
      in[24000] = in[24001] = 0.0f;
      Stereo clean = run(device, in);
      EXPECT(finite(out.left) && finite(out.right), "bad input: the output stays finite");
      EXPECT_NEAR(db(rms(out.left, 72000) / rms(clean.left, 72000)), 0.0, 0.1,
                  "bad input: the tone is back at its level a second later");
      EXPECT(std::fabs(mean(out.left, 72000)) < 1.0e-3, "bad input: no DC is left behind");
      render(device, 1.0f, kRate);
      device.init(kRate);
      device.set_param(p::kFilter, static_cast<float>(filter));
      in[24000] = pair[0];
      run(device, in);
      render(device, 1.0f, kRate);
      Stereo rest = render(device, 0.5f, kRate);
      EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "bad input: asleep after the tail");
    }
  }

  // Asleep when idle: exact zero soon after the input stops (the quantiser
  // has no step at zero, so nothing idles in the last bit), awake again on
  // the next sound.
  {
    device.init(kRate);
    run(device, noise(0.2f, kRate, 0.5f));
    render(device, 0.6f, kRate);
    Stereo rest = render(device, 0.5f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail");
    Stereo woken = run(device, sine(440.0f, 0.2f, kRate, 0.5f));
    EXPECT(rms(woken.left, 2400) > 0.2, "wakes on new input");
  }

  // Level: the default patch on a held chord (four notes, ten harmonics
  // each, peaking near -8 dBFS) is as loud as the chord went in.
  {
    std::vector<float> chord(static_cast<size_t>(2.0f * kRate), 0.0f);
    const double notes[4] = {146.83, 220.0, 277.18, 440.0};
    for (size_t i = 0; i < chord.size(); ++i) {
      double v = 0.0;
      for (int n = 0; n < 4; ++n) {
        for (int h = 1; h <= 10; ++h) {
          v += std::sin(2.0 * kPi * notes[n] * h * static_cast<double>(i) / kRate + n + 0.5 * h) /
               (h * std::sqrt(static_cast<double>(h)));
        }
      }
      chord[i] = static_cast<float>(0.085 * v);
    }
    device.init(kRate);
    Stereo out = run(device, chord);
    const double change = db(rms(out.left, 9600) / rms(chord, 9600));
    char label[120];
    std::snprintf(label, sizeof label, "default patch on a held chord: %+.2f dB against the dry level, peak %.2f (dry %.2f)",
                  change, peak(out.left), peak(chord));
    EXPECT(change > -1.0 && change < 1.0 && peak(out.left) < 1.2 * peak(chord), label);
    note(label);
  }

  // The default patch is heard at once. (At the first default, Rate 16 kHz,
  // it differed from the dry signal by -23 dB on struck notes and -43 dB on a
  // soft pad, with its images up at 15 kHz: nobody would have noticed it.)
  {
    // The glassy copy: a 330 Hz tone has its first image below 10 kHz and
    // within 45 dB of the tone.
    device.init(kRate);
    const double image_hz = p::kParamDefault[p::kRate] - 330.0;
    Stereo held = run(device, sine(330.0f, 1.0f, kRate, 0.25f));
    const double image = db(tone_level(held.left, image_hz, kRate, 4800) / tone_level(held.left, 330.0, kRate, 4800));
    char label[160];
    std::snprintf(label, sizeof label, "default patch: the image of a 330 Hz tone at %.0f Hz is %.1f dB under it",
                  image_hz, -image);
    EXPECT(image_hz < 10000.0 && image > -45.0 && image < -30.0, label);
    note(label);
    // The softened top: 1 kHz passes, 6 kHz is more than 20 dB down.
    device.init(kRate);
    Stereo low = run(device, sine(1000.0f, 0.5f, kRate, 0.25f));
    device.init(kRate);
    Stereo high = run(device, sine(6000.0f, 0.5f, kRate, 0.25f));
    EXPECT_NEAR(db(tone_level(low.left, 1000.0, kRate, 4800) / 0.25), 0.0, 0.7, "default patch: 1 kHz passes");
    EXPECT(db(tone_level(high.left, 6000.0, kRate, 4800) / 0.25) < -20.0, "default patch: 6 kHz is over 20 dB down");

    // Struck notes (four, decaying, twelve harmonics each): the default patch
    // differs from the dry phrase by more than -22 dB, and the two presets
    // that were once 25 dB apart, Twelve bit (the default) and Dusty sampler
    // (its values as in device.json), by more than -20 dB.
    const size_t n = static_cast<size_t>(2.5f * kRate);
    std::vector<float> phrase(n, 0.0f);
    const double notes[4] = {110.0, 261.63, 392.0, 659.26};
    for (int k = 0; k < 4; ++k) {
      const size_t start = static_cast<size_t>(k) * 19200;
      for (size_t i = start; i < n; ++i) {
        const double t = static_cast<double>(i - start) / kRate;
        double v = 0.0;
        for (int h = 1; h <= 12; ++h) {
          v += std::exp(-t * (1.0 + 0.25 * h)) * std::sin(2.0 * kPi * notes[k] * h * t + 0.37 * h * h) /
               std::pow(static_cast<double>(h), 1.35);
        }
        phrase[i] += static_cast<float>(0.2 * std::min(1.0, t / 0.002) * v);
      }
    }
    std::vector<float> dry(n, 0.0f);
    for (size_t i = kLatency; i < n; ++i) dry[i] = phrase[i - kLatency];
    device.init(kRate);
    Stereo twelve = run(device, phrase);
    device.init(kRate);
    device.set_param(p::kRate, 7500.0f);
    device.set_param(p::kBits, 10.0f);
    device.set_param(p::kAliasing, 0.5f);
    device.set_param(p::kFilter, kSteep);
    device.set_param(p::kJitter, 0.9f);
    device.set_param(p::kDrive, 9.0f);
    Stereo dusty = run(device, phrase);
    // The first default, for the record: Rate 16 kHz, Jitter 0.1.
    device.init(kRate);
    device.set_param(p::kRate, 16000.0f);
    device.set_param(p::kJitter, 0.1f);
    Stereo first = run(device, phrase);
    const double before = db(rms(difference(first.left, dry)) / rms(dry));
    const double heard = db(rms(difference(twelve.left, dry)) / rms(dry));
    const double apart = db(rms(difference(twelve.left, dusty.left)) / rms(dry));
    const double level = db(rms(twelve.left) / rms(dry));
    std::snprintf(label, sizeof label,
                  "default patch on struck notes: %.1f dB from dry (was %.1f), %.1f dB from Dusty sampler, level %+.2f dB",
                  heard, before, apart, level);
    EXPECT(heard > -22.0 && heard > before + 3.0 && apart > -20.0 && level > -1.0 && level < 1.0, label);
    note(label);
  }

  // Cost at the heaviest sensible setting: the clock ticking on nearly every
  // sample, steep filters on both sides, Mu-law, jitter.
  device.init(kRate);
  device.set_param(p::kRate, 47000.0f);
  device.set_param(p::kFilter, kSteep);
  device.set_param(p::kCompanding, kMuLaw);
  device.set_param(p::kJitter, 0.5f);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("vintage-digital", 10.0f, kRate, [&] { run(device, input); });

  return finish("vintage-digital");
}
