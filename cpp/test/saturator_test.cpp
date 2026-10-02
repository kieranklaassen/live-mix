// Native harness for Saturator (cpp/devices/saturator). The conformance pass
// covers stability, silence when idle, block-size independence and parameter
// abuse; the rest asserts what makes it a saturator, including the quality
// bars of the kkfonie tests it was ported with (Tests/Effects/SaturatorTests.cpp).

#include <complex>

#include "../devices/saturator/saturator.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Saturator;
namespace p = livemix::saturator;
namespace shapers = tatami::dsp::shapers;

static Saturator device;

static const float kRate = 48000.0f;
static const int kLatency = Saturator::kLatency;

enum Curve : int { kSoft = 0, kHard, kTube, kTape, kFold };
enum Oversample : int { k1x = 0, k2x, k4x };

// A wet-only saturator with the DC blocker off, so levels are the curve's.
static void setup(float rate, int curve, float drive_db, int oversample = k4x, int adaa = 0) {
  device.init(rate);
  device.set_param(p::kCurve, static_cast<float>(curve));
  device.set_param(p::kDriveDb, drive_db);
  device.set_param(p::kOversample, static_cast<float>(oversample));
  device.set_param(p::kAdaa, static_cast<float>(adaa));
  device.set_param(p::kDcBlock, 0.0f);
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
    const std::complex<double> step(std::cos(angle), std::sin(angle));
    for (size_t i = 0; i < n; i += length) {
      std::complex<double> w(1.0, 0.0);
      for (size_t k = 0; k < length / 2; ++k) {
        const std::complex<double> u = a[i + k];
        const std::complex<double> v = a[i + k + length / 2] * w;
        a[i + k] = u + v;
        a[i + k + length / 2] = u - v;
        w *= step;
      }
    }
  }
}

// Hann-windowed magnitude spectrum in dBFS (0 dB = a full-scale sine) of
// 65536 samples of `x` from `offset`.
static std::vector<double> spectrum_db(const std::vector<float>& x, size_t offset) {
  const size_t n = 65536;
  std::vector<std::complex<double>> a(n);
  for (size_t i = 0; i < n; ++i) {
    const double window = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(n));
    a[i] = (offset + i < x.size() ? x[offset + i] : 0.0) * window;
  }
  fft(a);
  std::vector<double> out(n / 2);
  for (size_t i = 0; i < n / 2; ++i) out[i] = db(std::abs(a[i]) * 4.0 / static_cast<double>(n));
  return out;
}

// The loudest component in [from, to) Hz that is not within 40 Hz of a
// multiple of `fundamental`: what the curve aliased, since everything it
// should produce is a harmonic.
static double alias_db(const std::vector<float>& x, double fundamental, double from, double to,
                       double rate) {
  const std::vector<double> spectrum = spectrum_db(x, static_cast<size_t>(rate));
  const double bin = rate / 65536.0;
  double worst = -300.0;
  for (size_t i = static_cast<size_t>(from / bin); i < spectrum.size() && i * bin < to; ++i) {
    const double hz = i * bin;
    if (std::fabs(hz - std::round(hz / fundamental) * fundamental) < 40.0) continue;
    worst = std::max(worst, spectrum[i]);
  }
  return worst;
}

// Aliasing of a -6 dBFS sine after three seconds through the device as set up.
static double alias_of_tone(float hz, float rate, double to_hz = 20000.0) {
  Stereo out = run(device, sine(hz, 3.0f, rate, 0.5f));
  return alias_db(out.left, hz, 20.0, to_hz, rate);
}

// Amplitude of harmonic `k` of curve(amplitude·sin + bias) − curve(bias),
// from the Fourier integral of the ideal, continuous-time waveform: what an
// alias-free saturator must output.
static double ideal_harmonic(int curve, double amplitude, double bias, int k) {
  const int n = 1 << 16;
  const float offset = shapers::shape(shapers::curveFromIndex(curve), static_cast<float>(bias));
  double re = 0.0, im = 0.0;
  for (int i = 0; i < n; ++i) {
    const double theta = 2.0 * kPi * (i + 0.5) / n;
    const double y =
        shapers::shape(shapers::curveFromIndex(curve), static_cast<float>(amplitude * std::sin(theta) + bias)) -
        offset;
    re += y * std::cos(k * theta);
    im += y * std::sin(k * theta);
  }
  return (k == 0 ? 1.0 : 2.0) * std::sqrt(re * re + im * im) / n;
}

// Gain at `hz` of the one-pole low-pass y += a (x − y), a = 1 − exp(−2π·cutoff/rate).
static double one_pole_gain(double cutoff, double hz, double rate) {
  const double a = 1.0 - std::exp(-2.0 * kPi * cutoff / rate);
  const double w = 2.0 * kPi * hz / rate;
  return a / std::sqrt(1.0 - 2.0 * (1.0 - a) * std::cos(w) + (1.0 - a) * (1.0 - a));
}

static double thd_percent(const std::vector<float>& x, double hz, double rate, size_t from, size_t to) {
  const double fundamental = tone_level(x, hz, rate, from, to);
  double harmonics = 0.0;
  for (int h = 2; h <= 10; ++h) {
    const double level = tone_level(x, hz * h, rate, from, to);
    harmonics += level * level;
  }
  return fundamental > 0.0 ? 100.0 * std::sqrt(harmonics) / fundamental : 0.0;
}

static size_t peak_index(const std::vector<float>& x) {
  size_t best = 0;
  for (size_t i = 0; i < x.size(); ++i) {
    if (std::fabs(x[i]) > std::fabs(x[best])) best = i;
  }
  return best;
}

int main() {
  Conformance spec;
  spec.name = "saturator";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  // The DC blocker's 10 Hz corner is the only thing that rings: 0.3 s to the floor.
  spec.tail_seconds = 0.5f;
  // The curves stop at ±1. What follows is gain the player asked for: Output
  // +24 dB (16x) and Tone +12 dB (4x on the edges of a clipped wave). The
  // worst combination, checked below, measures about 115.
  spec.max_peak = 160.0f;
  check_effect(device, spec, kRate);

  // That ceiling at its worst: a hard-clipped full-scale noise, both gains up.
  {
    device.init(kRate);
    device.set_param(p::kCurve, kHard);
    device.set_param(p::kDriveDb, 36.0f);
    device.set_param(p::kToneDb, 12.0f);
    device.set_param(p::kOutputDb, 24.0f);
    rng_state() = 0xD1CEu;
    Stereo loud = run(device, noise(2.0f, kRate, 0.9f));
    EXPECT(finite(loud.left) && peak(loud.left) < spec.max_peak, "the loudest setting stays under the ceiling");
    device.set_param(p::kToneDb, 0.0f);
    device.set_param(p::kOutputDb, 0.0f);
    loud = run(device, noise(1.0f, kRate, 0.9f));
    // Band-limiting a clipped wave overshoots its ±1 (1.66 here); nothing else adds level.
    EXPECT(peak(loud.left, 4800) < 2.0, "with Tone and Output flat the output stays near the curve's ±1");
  }

  // The curves themselves (kkfonie: "Waveshaper curves are bounded, odd where
  // expected and transparent near zero"), and the cheaper tanh against the
  // library's.
  {
    bool bounded = true, transparent = true;
    for (int c = 0; c < shapers::kNumCurves; ++c) {
      const shapers::Curve curve = shapers::curveFromIndex(c);
      if (std::fabs(shapers::shape(curve, 0.0f)) > 1.0e-6f) transparent = false;
      if (std::fabs(shapers::shape(curve, 1.0e-3f) / 1.0e-3f - 1.0f) > 1.0e-2f) transparent = false;
      for (float x = -12.0f; x <= 12.0f; x += 0.0625f) {
        if (std::fabs(shapers::shape(curve, x)) > 1.0f + 1.0e-6f) bounded = false;
      }
    }
    EXPECT(bounded, "every curve stays within ±1");
    EXPECT(transparent, "every curve passes through the origin with unit slope");
    EXPECT(std::fabs(shapers::Tube::shape(-2.0f) + shapers::Tube::shape(2.0f)) > 0.05f, "Tube is asymmetric");
    EXPECT_NEAR(shapers::Fold::shape(2.0f), 0.0, 1.0e-6, "Fold returns to zero at 2");
    EXPECT_NEAR(shapers::Fold::shape(1.0f), 1.0, 1.0e-6, "Fold peaks at 1");
    double derivative_error = 0.0;
    for (float x = -4.0f; x <= 4.0f; x += 0.5f) {
      const double h = 1.0e-4;
      derivative_error = std::max(
          derivative_error, std::fabs((shapers::Soft::antiderivative(x + h) - shapers::Soft::antiderivative(x - h)) /
                                          (2.0 * h) -
                                      shapers::Soft::shape(x)));
      derivative_error = std::max(
          derivative_error, std::fabs((shapers::Hard::antiderivative(x + h) - shapers::Hard::antiderivative(x - h)) /
                                          (2.0 * h) -
                                      shapers::Hard::shape(x)));
    }
    EXPECT(derivative_error < 1.0e-3, "the ADAA antiderivatives differentiate back to their curves");
    double tanh_error = 0.0;
    bool odd = true;
    for (double x = -20.0; x <= 20.0; x += 0.00037) {
      const float xf = static_cast<float>(x);
      tanh_error = std::max(tanh_error, std::fabs(shapers::tanhExp(xf) - std::tanh(static_cast<double>(xf))));
      if (shapers::tanhExp(-xf) != -shapers::tanhExp(xf)) odd = false;
    }
    EXPECT(tanh_error < 2.0e-7, "tanhExp is tanh to within 2e-7");
    EXPECT(odd, "tanhExp is exactly odd");
  }

  // Harmonic signature of each curve: a 500 Hz sine driven to 2x the curve's
  // knee comes out with the harmonics the curve's Fourier series predicts.
  // Symmetric curves give odd harmonics only; Tube's lopsided knee adds even
  // ones; Fold sends more into the third harmonic than it leaves in the first.
  {
    const double amplitude = 0.5 * std::pow(10.0, 12.0 / 20.0);
    const size_t from = 48000, to = 96000;
    for (int curve = 0; curve < shapers::kNumCurves; ++curve) {
      setup(kRate, curve, 12.0f);
      Stereo out = run(device, sine(500.0f, 2.0f, kRate, 0.5f));
      char label[96];
      double worst = 0.0, even = 0.0;
      for (int h = 1; h <= 7; ++h) {
        const double measured = tone_level(out.left, 500.0 * h, kRate, from, to);
        double ideal = ideal_harmonic(curve, amplitude, 0.0, h);
        // Tape's high cut (11.1 kHz at +12 dB) is part of that curve's sound.
        if (curve == kTape) ideal *= one_pole_gain(16000.0 * std::pow(6000.0 / 16000.0, 12.0 / 36.0), 500.0 * h, kRate);
        if (ideal > 1.0e-3) worst = std::max(worst, std::fabs(db(measured) - db(ideal)));
        if (h % 2 == 0) even = std::max(even, measured);
      }
      std::snprintf(label, sizeof label, "curve %d: harmonics 1 to 7 match its Fourier series (off by %.2f dB)",
                    curve, worst);
      EXPECT(worst < 0.2, label);
      if (curve == kTube) {
        EXPECT(db(even) > -30.0, "Tube: even harmonics are part of the sound");
      } else {
        std::snprintf(label, sizeof label, "curve %d: symmetric, so no even harmonics (%.0f dBFS)", curve,
                      db(even));
        EXPECT(db(even) < -100.0, label);
      }
      if (curve == kFold) {
        EXPECT(tone_level(out.left, 1500.0, kRate, from, to) > tone_level(out.left, 500.0, kRate, from, to),
               "Fold: the third harmonic overtakes the fundamental");
      }
    }
  }

  // Bias moves the operating point: a symmetric curve grows even harmonics,
  // again the ones its Fourier series predicts.
  {
    const double amplitude = 0.5 * std::pow(10.0, 12.0 / 20.0);
    setup(kRate, kSoft, 12.0f);
    device.set_param(p::kBias, 0.4f);
    Stereo out = run(device, sine(500.0f, 2.0f, kRate, 0.5f));
    const double second = tone_level(out.left, 1000.0, kRate, 48000, 96000);
    EXPECT(db(second) > -30.0, "Bias adds a second harmonic to the Soft curve");
    EXPECT_NEAR(db(second), db(ideal_harmonic(kSoft, amplitude, 0.4, 2)), 0.2,
                "Bias: the second harmonic is the one the offset curve predicts");
  }

  // Aliasing (kkfonie: "4x oversampling puts 1 kHz full-drive aliasing below
  // -80 dBFS, 1x leaves it above -40"). At 48 kHz a 1 kHz tone's aliases land
  // on its harmonics, so the tone is 1.1 kHz. Soft curve, +36 dB.
  {
    setup(kRate, kSoft, 36.0f, k1x);
    Stereo naive = run(device, sine(1100.0f, 3.0f, kRate, 0.5f));
    const double alias_1x = alias_db(naive.left, 1100.0, 20.0, 20000.0, kRate);
    setup(kRate, kSoft, 36.0f, k2x);
    const double alias_2x = alias_of_tone(1100.0f, kRate);
    setup(kRate, kSoft, 36.0f, k4x);
    Stereo clean = run(device, sine(1100.0f, 3.0f, kRate, 0.5f));
    const double alias_4x = alias_db(clean.left, 1100.0, 20.0, 20000.0, kRate);
    setup(kRate, kSoft, 36.0f, k4x, 1);
    const double alias_4x_adaa = alias_of_tone(1100.0f, kRate);
    std::printf("saturator aliasing (1.1 kHz, -6 dBFS, Soft, +36 dB, 48 kHz): 1x %.1f, 2x %.1f, 4x %.1f, 4x + ADAA %.1f dBFS\n",
                alias_1x, alias_2x, alias_4x, alias_4x_adaa);
    EXPECT(alias_1x > -40.0, "1x leaves the aliasing in (the lo-fi setting)");
    EXPECT(alias_2x < alias_1x - 15.0 && alias_2x > alias_4x, "2x sits between 1x and 4x");
    EXPECT(alias_4x < -80.0, "4x puts full-drive aliasing below -80 dBFS");
    EXPECT(alias_4x_adaa < -80.0 && alias_4x_adaa < alias_4x, "ADAA on top of 4x lowers it again");

    // One folded harmonic by name: the 27th (29.7 kHz) lands on 18.3 kHz. A
    // naive shaper returns all of it; 4x filters it out before decimating.
    const size_t from = 48000, to = 3 * 48000;
    const double folded_1x = tone_level(naive.left, 18300.0, kRate, from, to);
    const double folded_4x = tone_level(clean.left, 18300.0, kRate, from, to);
    const double harmonic = ideal_harmonic(kSoft, 0.5 * std::pow(10.0, 36.0 / 20.0), 0.0, 27);
    std::printf("saturator 27th harmonic folded to 18.3 kHz: ideal %.1f dBFS, 1x %.1f dBFS, 4x %.1f dBFS\n",
                db(harmonic), db(folded_1x), db(folded_4x));
    EXPECT_NEAR(db(folded_1x), db(harmonic), 0.5, "1x: the 27th harmonic folds back to 18.3 kHz at full strength");
    EXPECT(db(folded_4x) < db(folded_1x) - 50.0, "4x: that folded harmonic is at least 50 dB lower");
  }

  // kkfonie's own condition, 1 kHz at 44.1 kHz. The halfband's transition
  // band (0.42 to 0.58 of the rate) folds onto 18.5 to 22 kHz there, so the
  // bar is held up to 18 kHz; the worst component above that is at 19.1 kHz.
  {
    setup(44100.0f, kSoft, 36.0f, k4x);
    Stereo out = run(device, sine(1000.0f, 3.0f, 44100.0f, 0.5f));
    const double audible = alias_db(out.left, 1000.0, 20.0, 18000.0, 44100.0);
    const double top = alias_db(out.left, 1000.0, 18000.0, 20000.0, 44100.0);
    std::printf("saturator aliasing (1 kHz, Soft, +36 dB, 4x, 44.1 kHz): %.1f dBFS up to 18 kHz, %.1f dBFS from 18 to 20 kHz\n",
                audible, top);
    EXPECT(audible < -80.0, "44.1 kHz: 4x aliasing below -80 dBFS up to 18 kHz");
    EXPECT(top < -70.0, "44.1 kHz: what folds from the transition band stays below -70 dBFS");
  }

  // kkfonie: "ADAA reduces aliasing of the hard clip too".
  {
    setup(kRate, kHard, 24.0f, k4x);
    const double plain = alias_of_tone(1100.0f, kRate);
    setup(kRate, kHard, 24.0f, k4x, 1);
    const double adaa = alias_of_tone(1100.0f, kRate);
    std::printf("saturator aliasing (Hard, +24 dB, 4x): %.1f dBFS, with ADAA %.1f dBFS\n", plain, adaa);
    EXPECT(adaa < plain - 6.0, "ADAA takes at least 6 dB off the hard clip's aliasing");
  }

  // kkfonie: "THD rises monotonically with drive".
  {
    double previous = -1.0;
    bool monotonic = true;
    for (float drive = 0.0f; drive <= 36.0f; drive += 6.0f) {
      setup(kRate, kSoft, drive);
      Stereo out = run(device, sine(1000.0f, 2.0f, kRate, 0.25f));
      const double thd = thd_percent(out.left, 1000.0, kRate, 48000, 96000);
      if (thd < previous - 0.01) monotonic = false;
      previous = thd;
    }
    EXPECT(monotonic, "THD rises with Drive");
    EXPECT(previous > 20.0, "full Drive is over 20 % THD");
  }

  // DC (kkfonie: "DC blocker removes the offset a full bias produces"). The
  // curve's offset at the bias is never output; what an asymmetric operating
  // point adds with signal is the mean of the offset curve, which DC Block
  // removes.
  {
    const double gain = std::pow(10.0, 12.0 / 20.0);
    const double expected = ideal_harmonic(kSoft, 0.5 * gain, 1.0, 0);
    double means[2];
    for (int blocker = 0; blocker < 2; ++blocker) {
      setup(kRate, kSoft, 12.0f);
      device.set_param(p::kBias, 1.0f);
      device.set_param(p::kDcBlock, static_cast<float>(blocker));
      Stereo out = run(device, sine(100.0f, 3.0f, kRate, 0.5f));
      means[blocker] = mean(out.left, 2 * 48000, 3 * 48000);
    }
    std::printf("saturator DC at full bias: %.1f dBFS unblocked, %.1f dBFS blocked\n", db(std::fabs(means[0])),
                db(std::fabs(means[1])));
    EXPECT(std::fabs(means[0]) > 0.1, "an asymmetric operating point rectifies the signal");
    EXPECT_NEAR(std::fabs(means[0]), expected, 0.005, "unblocked DC is the mean of the offset curve");
    EXPECT(std::fabs(means[1]) < 1.0e-3, "DC Block takes it below -60 dBFS");

    // Without signal there is nothing to rectify: every curve at full bias,
    // DC Block off, gives exact silence for silence.
    bool silent = true;
    for (int curve = 0; curve < shapers::kNumCurves; ++curve) {
      for (int adaa = 0; adaa < 2; ++adaa) {
        setup(kRate, curve, 24.0f, k4x, adaa);
        device.set_param(p::kBias, 1.0f);
        device.set_param(p::kOutputDb, 24.0f);
        run(device, sine(200.0f, 0.2f, kRate, 0.5f));
        render(device, 1.0f, kRate);
        Stereo rest = render(device, 0.25f, kRate);
        if (peak(rest.left) != 0.0 || peak(rest.right) != 0.0) silent = false;
      }
    }
    EXPECT(silent, "a bias puts no DC on the output when nothing is playing");
  }

  // DC Block works under the curve's ceiling. A plain blocker after the curve
  // tilts the flat top of a squared-off low note, and each edge then starts
  // from further away: a clipped 41 Hz left 3.7 dB over full scale. With the
  // blocker following what leaves under the ceiling, the wet signal stays at
  // the curve's own +-1; all that is left is what band-limiting a squared
  // wave adds, which is small this low.
  {
    double worst = 0.0;
    for (int curve = kSoft; curve <= kTape; ++curve) {
      for (int os = k1x; os <= k4x; ++os) {
        setup(kRate, curve, 24.0f, os);
        device.set_param(p::kDcBlock, 1.0f);
        Stereo out = run(device, sine(41.0f, 2.0f, kRate, 0.9f));
        const double top = peak(out.left, 24000);
        worst = std::max(worst, top);
        char label[96];
        std::snprintf(label, sizeof label, "curve %d at %dx: a clipped low note stays at the ceiling (%.2f dBFS)",
                      curve, 1 << os, db(top));
        EXPECT(top < (os == k1x ? 1.0 + 1.0e-6 : 1.01), label);
        EXPECT(std::fabs(mean(out.left, 48000, 96000)) < 1.0e-3, "and stays centred");
      }
    }
    std::printf("saturator, clipped 41 Hz with DC Block on: %.2f dBFS at most\n", db(worst));

    // An asymmetric operating point driven into the ceiling: the blocker
    // still centres what leaves, and what leaves is still under the ceiling.
    setup(kRate, kTube, 24.0f);
    device.set_param(p::kBias, 0.5f);
    device.set_param(p::kDcBlock, 1.0f);
    Stereo biased = run(device, sine(100.0f, 3.0f, kRate, 0.5f));
    std::printf("saturator, Tube with Bias 0.5 at +24 dB, DC Block on: peak %.2f dBFS, DC %.1f dBFS\n",
                db(peak(biased.left, 96000)), db(std::fabs(mean(biased.left, 96000, 144000))));
    EXPECT(peak(biased.left, 96000) < 1.01, "a biased curve under DC Block stays at the ceiling");
    EXPECT(std::fabs(mean(biased.left, 96000, 144000)) < 2.0e-3, "and has no DC left");

    // DC Block off: a biased curve keeps the range its bias gave it, full
    // scale less curve(bias), and nothing is cut off it.
    setup(kRate, kHard, 24.0f, k1x);
    device.set_param(p::kBias, 0.5f);
    Stereo shifted = run(device, sine(100.0f, 1.0f, kRate, 0.5f));
    double low = 0.0, high = 0.0;
    for (size_t i = 24000; i < shifted.size(); ++i) {
      low = std::min(low, static_cast<double>(shifted.left[i]));
      high = std::max(high, static_cast<double>(shifted.left[i]));
    }
    EXPECT_NEAR(high, 0.5, 1.0e-4, "DC Block off, Bias 0.5, Hard: the top is 1 - bias");
    EXPECT_NEAR(low, -1.5, 1.0e-4, "and the bottom -1 - bias");
  }

  // Latency (kkfonie: "reports its latency exactly and keeps the dry path
  // aligned"): every Oversampling setting delays by the same 39 samples.
  {
    for (int os = k1x; os <= k4x; ++os) {
      char label[96];
      setup(kRate, kHard, 0.0f, os);
      Stereo wet = run(device, impulse(0.05f, kRate, 0.5f));
      std::snprintf(label, sizeof label, "oversampling %d: the wet impulse lands on sample %d (got %zu)", os,
                    kLatency, peak_index(wet.left));
      EXPECT(peak_index(wet.left) == static_cast<size_t>(kLatency), label);

      // A quiet 5 kHz tone at Mix 0.5: dry and wet arrive together, so the sum
      // is the input 39 samples late. One sample of misalignment would cost
      // a third of the amplitude.
      setup(kRate, kSoft, 0.0f, os);
      device.set_param(p::kMix, 0.5f);
      std::vector<float> tone = sine(5000.0f, 0.2f, kRate, 0.05f);
      Stereo mixed = run(device, tone);
      double error = 0.0;
      for (size_t i = 2048; i < tone.size(); ++i) {
        error = std::max(error, std::fabs(static_cast<double>(mixed.left[i]) - tone[i - kLatency]));
      }
      std::snprintf(label, sizeof label, "oversampling %d: dry and wet are aligned (error %.2g)", os, error);
      EXPECT(error < 0.05 * 0.04, label);
    }
  }

  // Mix 0 is the input, delayed by the latency and otherwise untouched.
  {
    setup(kRate, kSoft, 36.0f);
    device.set_param(p::kMix, 0.0f);
    std::vector<float> tone = sine(220.0f, 0.25f, kRate, 0.25f);
    Stereo out = run(device, tone);
    double worst = 0.0;
    for (size_t i = kLatency; i < tone.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - tone[i - kLatency]));
    }
    EXPECT(worst < 1.0e-6, "Mix 0 passes the input through");
  }

  // Levels. Drive 0 is unity for a quiet signal on every curve and at every
  // oversampling setting; however hard it is driven the wet signal stays at
  // the curve's ceiling (there is no gain to make up); the default patch
  // lifts a -12 dBFS tone by under 6 dB and leaves a full-scale one where it
  // was.
  {
    bool unity = true, bounded = true;
    for (int curve = 0; curve < shapers::kNumCurves; ++curve) {
      for (int os = k1x; os <= k4x; ++os) {
        setup(kRate, curve, 0.0f, os);
        Stereo quiet = run(device, sine(220.0f, 0.5f, kRate, 0.02f));
        if (std::fabs(db(rms(quiet.left, 12000, 24000)) - db(0.02 / std::sqrt(2.0))) > 0.1) unity = false;
      }
      setup(kRate, curve, 36.0f);
      Stereo loud = run(device, sine(100.0f, 0.5f, kRate, 1.0f));
      if (peak(loud.left) > 1.2) bounded = false;
    }
    EXPECT(unity, "Drive 0 is unity gain within 0.1 dB for a quiet tone");
    EXPECT(bounded, "full Drive stays at the curve's ceiling");
    device.init(kRate);
    Stereo soft = run(device, sine(220.0f, 0.5f, kRate, 0.25f));
    const double lift = db(rms(soft.left, 12000, 24000)) - db(0.25 / std::sqrt(2.0));
    device.init(kRate);
    Stereo full = run(device, sine(220.0f, 0.5f, kRate, 1.0f));
    EXPECT(lift > 3.0 && lift < 6.0, "defaults: a -12 dBFS tone comes out 3 to 6 dB louder");
    EXPECT(peak(full.left) < 1.05, "defaults: a full-scale tone does not get louder");
  }

  // Tone tilts around 1 kHz: with +6 dB the highs come up and the lows go
  // down by nearly that, and 1 kHz stays put.
  {
    double gain_db[3];
    const float tones[3] = {60.0f, 1000.0f, 15000.0f};
    for (int i = 0; i < 3; ++i) {
      setup(kRate, kHard, 0.0f);
      device.set_param(p::kToneDb, 6.0f);
      Stereo out = run(device, sine(tones[i], 0.5f, kRate, 0.1f));
      gain_db[i] = db(tone_level(out.left, tones[i], kRate, 12000, 24000) / 0.1);
    }
    EXPECT_NEAR(gain_db[1], 0.0, 0.1, "Tone leaves 1 kHz where it was");
    EXPECT(gain_db[0] < -5.5 && gain_db[0] > -6.1, "Tone +6 dB lowers 60 Hz by nearly 6 dB");
    EXPECT(gain_db[2] > 5.5 && gain_db[2] < 6.1, "Tone +6 dB lifts 15 kHz by nearly 6 dB");
  }

  // Tape loses treble as it is driven: the high cut falls from 16 kHz at
  // Drive 0 to 6 kHz at +36 dB. Measured with a signal small enough to stay
  // on the straight part of the curve; Soft has no such filter.
  {
    auto treble_db = [](int curve, float drive_db) {
      const float amplitude = 0.02f / std::pow(10.0f, drive_db / 20.0f);
      setup(kRate, curve, drive_db);
      Stereo low = run(device, sine(500.0f, 0.5f, kRate, amplitude));
      setup(kRate, curve, drive_db);
      Stereo high = run(device, sine(6000.0f, 0.5f, kRate, amplitude));
      return db(tone_level(high.left, 6000.0, kRate, 12000, 24000) /
                tone_level(low.left, 500.0, kRate, 12000, 24000));
    };
    const double open = treble_db(kTape, 0.0f);
    const double closed = treble_db(kTape, 36.0f);
    EXPECT(open > -1.0, "Tape at Drive 0: 6 kHz passes (high cut at 16 kHz)");
    EXPECT(closed < -2.3 && closed > -3.7, "Tape at full Drive: 6 kHz is the -3 dB point");
    EXPECT(std::fabs(treble_db(kSoft, 36.0f)) < 0.1, "Soft has no high cut");
  }

  // Nothing clicks. A 60 Hz tone is slow enough that any step much larger
  // than its own steepest slope after saturation is a discontinuity, and each
  // change is made at a crest, where the curves differ most (switching Soft
  // to Fold there without a crossfade would be a step of 0.24).
  {
    const size_t crest = 200 + 800 * 30;  // a quarter period past 30 cycles
    std::vector<float> tone = sine(60.0f, 12.0f, kRate, 0.25f);
    size_t position = 0;
    auto play = [&](size_t frames) {
      std::vector<float> chunk(tone.begin() + position, tone.begin() + position + frames);
      position += frames;
      return run(device, chunk).left;
    };
    auto append = [](std::vector<float>& all, const std::vector<float>& more) {
      all.insert(all.end(), more.begin(), more.end());
    };
    char label[128];

    // Drive.
    setup(kRate, kSoft, 24.0f);
    const double driven = max_step(play(crest), 4800);
    position = 0;
    setup(kRate, kSoft, 0.0f);
    std::vector<float> sweep = play(crest);
    device.set_param(p::kDriveDb, 24.0f);
    append(sweep, play(crest));
    std::snprintf(label, sizeof label, "a Drive change ramps without a click (step %.4f, tone %.4f)",
                  max_step(sweep), driven);
    EXPECT(max_step(sweep) < 1.1 * driven, label);

    // Curve, oversampling and ADAA crossfade.
    position = 0;
    setup(kRate, kSoft, 12.0f);
    std::vector<float> switched = play(crest);
    const double steady = max_step(switched, 4800);
    const int steps[][2] = {
        {p::kCurve, kFold}, {p::kCurve, kHard},    {p::kAdaa, 1},      {p::kOversample, k1x},
        {p::kCurve, kTape}, {p::kOversample, k2x}, {p::kCurve, kTube}, {p::kOversample, k4x},
    };
    for (const auto& step : steps) {
      device.set_param(step[0], static_cast<float>(step[1]));
      append(switched, play(800 * 30));
    }
    std::snprintf(label, sizeof label,
                  "switching curve, oversampling and ADAA crossfades (step %.4f, tone %.4f)",
                  max_step(switched), steady);
    EXPECT(max_step(switched) < 1.25 * steady, label);

    // Bias, Tone, Output and Mix.
    position = 0;
    setup(kRate, kTube, 12.0f);
    device.set_param(p::kDcBlock, 1.0f);
    std::vector<float> moved = play(crest);
    device.set_param(p::kBias, 0.8f);
    device.set_param(p::kToneDb, 9.0f);
    device.set_param(p::kOutputDb, -6.0f);
    device.set_param(p::kMix, 0.5f);
    append(moved, play(crest));
    std::snprintf(label, sizeof label, "Bias, Tone, Output and Mix ramp without a click (step %.4f, tone %.4f)",
                  max_step(moved), steady);
    EXPECT(max_step(moved) < 2.0 * steady, label);
  }

  // The device sleeps, and waking it with a bias set does not thump: the
  // first quiet note after silence comes out quiet.
  {
    device.init(kRate);
    device.set_param(p::kCurve, kTube);
    device.set_param(p::kDriveDb, 12.0f);
    device.set_param(p::kBias, 0.6f);
    Stereo first = run(device, sine(1000.0f, 0.25f, kRate, 0.001f));
    EXPECT(peak(first.left) < 0.01, "the first note with a bias set starts without a thump");
    run(device, noise(0.2f, kRate, 0.5f));
    render(device, 1.0f, kRate);
    Stereo rest = render(device, 0.5f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail");
    // What changed while it slept applies at once, not as a glide into the note.
    device.set_param(p::kOutputDb, -24.0f);
    device.set_param(p::kCurve, kHard);
    device.set_param(p::kBias, 0.0f);
    Stereo woken = run(device, sine(1000.0f, 0.25f, kRate, 0.5f));
    EXPECT(peak(woken.left) > 0.03, "wakes on new input");
    EXPECT(peak(woken.left) < 0.07, "parameters set while asleep are in force from the first sample");
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("saturator", 10.0f, kRate, [&] { run(device, input); });

  return finish("saturator");
}
