// Native harness for Analog Drive (cpp/devices/analog-drive). The conformance
// pass covers stability, silence when idle, block-size independence and
// parameter abuse; the rest asserts what makes it five circuits: each one's
// harmonic series, where in the spectrum it saturates, how clean the curve
// stays of aliasing, and that the loudness holds while Drive moves.

#include <complex>
#include <cstring>
#include <limits>

#include "../devices/analog-drive/analog_drive.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::AnalogDrive;
namespace p = livemix::analog_drive;
namespace dsp = livemix::analog_drive_dsp;

static AnalogDrive device;

static const float kRate = 48000.0f;
static const int kLatency = AnalogDrive::kLatency;

enum Circuit : int { kTape = 0, kConsole, kTransformer, kTriode, kPentode, kCircuits };
static const char* kNames[kCircuits] = {"Tape preamp", "Console", "Transformer", "Triode", "Pentode"};

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

// Hann-windowed magnitude spectrum in dBFS of 65536 samples from `offset`.
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

// Loudest component in [from, to) Hz not within 40 Hz of a harmonic.
static double alias_db(const std::vector<float>& x, double fundamental, double from, double to, double rate,
                       double* at = nullptr) {
  const std::vector<double> spectrum = spectrum_db(x, static_cast<size_t>(rate));
  const double bin = rate / 65536.0;
  double worst = -300.0;
  for (size_t i = static_cast<size_t>(from / bin); i < spectrum.size() && i * bin < to; ++i) {
    const double hz = i * bin;
    if (std::fabs(hz - std::round(hz / fundamental) * fundamental) < 40.0) continue;
    if (spectrum[i] > worst) {
      worst = spectrum[i];
      if (at) *at = hz;
    }
  }
  return worst;
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

// Pink noise (Paul Kellet's filter), scaled to `rms_level`.
static std::vector<float> pink(float seconds, float rate, float rms_level, uint32_t seed = 0xA5A5F00Du) {
  rng_state() = seed;
  std::vector<float> out(static_cast<size_t>(seconds * rate));
  double b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (float& v : out) {
    const double w = white();
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.96900 * b2 + w * 0.1538520;
    b3 = 0.86650 * b3 + w * 0.3104856;
    b4 = 0.55000 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.0168980;
    v = static_cast<float>(b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362);
    b6 = w * 0.115926;
  }
  const double level = rms(out);
  for (float& v : out) v = static_cast<float>(v * rms_level / level);
  return out;
}

static void setup(float rate, int circuit, float drive, int push = 0) {
  device.init(rate);
  device.set_param(p::kCircuit, static_cast<float>(circuit));
  device.set_param(p::kDrive, drive);
  device.set_param(p::kPush, static_cast<float>(push));
}

// Gain in dB the device gives a quiet tone (well inside the straight part of
// every curve at Drive 0).
static double small_signal_db(float hz, float rate = kRate, float amplitude = 0.005f) {
  Stereo out = run(device, sine(hz, 1.0f, rate, amplitude));
  const size_t n = out.size();
  return db(tone_level(out.left, hz, rate, n / 2, n) / amplitude);
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
  spec.name = "analog-drive";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  // The DC blocker's 7 Hz corner is the only thing that rings.
  spec.tail_seconds = 1.0f;
  // With Auto Gain on (the default) the driven signal stays near the level
  // it came in at. A player can still ask for a great deal of gain: Auto
  // Gain off (a full-scale input then leaves up to 2.7), Output +12 dB (4x)
  // and Tone and Thump on the edges of a squared wave (2x) came to 26
  // together. The safety stage at the end of the driven path (exactly linear
  // to 1.5, landing on 4; checked below) is what holds every setting under
  // this.
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // The curves themselves: unit slope at zero, monotonic, bounded, and the
  // two antiderivatives the anti-aliasing integrates with differentiate
  // back to the curve.
  {
    for (int c = 0; c < kCircuits; ++c) {
      const dsp::Curve& curve = dsp::circuit(c).curve;
      char label[128];
      double worst = 0.0, top = 0.0;
      bool rising = true;
      for (double v = -40.0; v <= 40.0; v += 0.0137) {
        const double h = 1.0e-4;
        worst = std::max(worst, std::fabs((curve.F1(v + h) - curve.F1(v - h)) / (2.0 * h) - curve.f(v)));
        worst = std::max(worst, std::fabs((curve.F2(v + h) - curve.F2(v - h)) / (2.0 * h) - curve.F1(v)));
        if (curve.f(v + 0.0137) < curve.f(v) - 1.0e-12) rising = false;
        top = std::max(top, std::fabs(curve.f(v)));
      }
      std::snprintf(label, sizeof label, "%s: F1 and F2 differentiate back to the curve (off by %.2g)", kNames[c],
                    worst);
      EXPECT(worst < 1.0e-6, label);
      std::snprintf(label, sizeof label, "%s: the curve never falls and stays under 1.5 (%.2f)", kNames[c], top);
      EXPECT(rising && top < 1.5, label);
      EXPECT_NEAR(curve.f(1.0e-4) / 1.0e-4, 1.0, 1.0e-3, "unit slope at zero");
      EXPECT(curve.f(0.0) == 0.0 && curve.F1(0.0) == 0.0 && curve.F2(0.0) == 0.0, "curve and integrals start at zero");
    }
  }

  // Distortion rises with Drive in every circuit, and Drive 0 is clean: a
  // 220 Hz tone at -12 dBFS comes out with under 1 % THD.
  {
    for (int c = 0; c < kCircuits; ++c) {
      double previous = -1.0, first = 0.0;
      bool monotonic = true;
      for (int k = 0; k <= 8; ++k) {
        setup(kRate, c, k / 8.0f);
        Stereo out = run(device, sine(220.0f, 1.5f, kRate, 0.25f));
        const double thd = thd_percent(out.left, 220.0, kRate, 24000, 72000);
        if (k == 0) first = thd;
        if (thd < previous) monotonic = false;
        previous = thd;
      }
      char label[128];
      std::printf("analog-drive %s: THD %.2f %% at Drive 0, %.1f %% at Drive 1 (220 Hz, -12 dBFS)\n", kNames[c], first,
                  previous);
      std::snprintf(label, sizeof label, "%s: THD rises with Drive", kNames[c]);
      EXPECT(monotonic, label);
      std::snprintf(label, sizeof label, "%s: under 1 %% THD at Drive 0 (%.2f)", kNames[c], first);
      EXPECT(first < 1.0, label);
      std::snprintf(label, sizeof label, "%s: over 20 %% THD at full Drive (%.1f)", kNames[c], previous);
      EXPECT(previous > 20.0, label);
    }
  }

  // Each circuit's harmonic series, on 220 Hz at -12 dBFS and Drive 0.25
  // (21 dB into the curve: the knob is tapered, see drive_taper):
  // the lopsided triode makes the second harmonic first, the console and
  // the pentode the third.
  {
    double second[kCircuits], third[kCircuits];
    for (int c = 0; c < kCircuits; ++c) {
      setup(kRate, c, 0.25f);
      Stereo out = run(device, sine(220.0f, 1.5f, kRate, 0.25f));
      const double fundamental = tone_level(out.left, 220.0, kRate, 24000, 72000);
      second[c] = db(tone_level(out.left, 440.0, kRate, 24000, 72000) / fundamental);
      third[c] = db(tone_level(out.left, 660.0, kRate, 24000, 72000) / fundamental);
      std::printf("analog-drive %s: 2nd %.1f dBc, 3rd %.1f dBc at Drive 0.25\n", kNames[c], second[c], third[c]);
    }
    EXPECT(second[kTriode] > third[kTriode] + 6.0, "Triode: the second harmonic leads the third by over 6 dB");
    EXPECT(second[kTriode] > -30.0, "Triode: a strong second harmonic");
    EXPECT(third[kConsole] > second[kConsole] + 6.0, "Console: the third harmonic leads the second");
    EXPECT(third[kPentode] > second[kPentode] + 6.0, "Pentode: the third harmonic leads the second");
    EXPECT(second[kTape] > -50.0 && second[kTape] < -25.0, "Tape preamp: a gentle second harmonic");
  }

  // Where in the spectrum each circuit gives way. The transformer saturates
  // on its lows: 60 Hz distorts several times more than 2 kHz at the same
  // level. The tape preamp gives up its highs as the level rises: a 9 kHz
  // tone loses more gain going from -40 to -6 dBFS than a 500 Hz tone does,
  // and noise through it comes back with a smaller share above 8 kHz.
  {
    double thd[2];
    const float tones[2] = {60.0f, 2000.0f};
    for (int i = 0; i < 2; ++i) {
      setup(kRate, kTransformer, 0.15f);
      Stereo out = run(device, sine(tones[i], 1.5f, kRate, 0.25f));
      thd[i] = thd_percent(out.left, tones[i], kRate, 24000, 72000);
    }
    std::printf("analog-drive Transformer at Drive 0.15: THD %.1f %% at 60 Hz, %.2f %% at 2 kHz\n", thd[0], thd[1]);
    EXPECT(thd[0] > 4.0 * thd[1], "Transformer: 60 Hz distorts over four times as much as 2 kHz");

    double loss[2];
    const float bands[2] = {500.0f, 9000.0f};
    for (int i = 0; i < 2; ++i) {
      double gain[2];
      const float levels[2] = {0.01f, 0.5f};
      for (int k = 0; k < 2; ++k) {
        setup(kRate, kTape, 0.2f);
        gain[k] = small_signal_db(bands[i], kRate, levels[k]);
      }
      loss[i] = gain[0] - gain[1];
    }
    std::printf("analog-drive Tape preamp at Drive 0.2, -40 to -6 dBFS: 500 Hz loses %.1f dB, 9 kHz loses %.1f dB\n",
                loss[0], loss[1]);
    EXPECT(loss[1] > loss[0] + 3.0, "Tape preamp: loud highs are held back at least 3 dB more than loud mids");

    // The same with noise instead of tones: the band above 8 kHz against
    // the band below 500 Hz, quiet and loud.
    double drop[2];
    for (int band = 0; band < 2; ++band) {
      double gain[2];
      const float levels[2] = {0.004f, 0.25f};
      for (int k = 0; k < 2; ++k) {
        rng_state() = 0x7A9Eu;
        std::vector<float> in = noise(2.0f, kRate, 1.0f);
        const double a = std::exp(-2.0 * kPi * (band == 0 ? 500.0 : 8000.0) / kRate);
        double low1 = 0.0, low2 = 0.0;
        for (float& v : in) {
          low1 = v + (low1 - v) * a;
          low2 = low1 + (low2 - low1) * a;
          v = static_cast<float>(band == 0 ? low2 : v - 2.0 * low1 + low2);
        }
        const double scale = levels[k] / rms(in);
        for (float& v : in) v = static_cast<float>(v * scale);
        setup(kRate, kTape, 0.2f);
        Stereo out = run(device, in);
        gain[k] = db(rms(out.left, 24000) / rms(in, 24000));
      }
      drop[band] = gain[0] - gain[1];
    }
    std::printf("analog-drive Tape preamp, noise from -48 to -12 dBFS RMS: the band under 500 Hz loses %.1f dB, "
                "the band over 8 kHz %.1f dB\n",
                drop[0], drop[1]);
    EXPECT(drop[1] > drop[0] + 2.0, "Tape preamp: energy above 8 kHz falls against the input as the level rises");
  }

  // Aliasing, the hard case: 5 kHz at -6 dBFS and 44.1 kHz with Drive full
  // up. Nothing that is not a harmonic stands above -70 dBFS anywhere up to
  // 20 kHz, in any circuit, with Push on as well (it squares the wave off
  // completely). The loudest stray is the fifth harmonic at 25 kHz folding
  // to 19.1 kHz through the transition band of the first halfband; below
  // 18 kHz nothing reaches -90 dBFS. (Full Drive is 42 dB into the curve.
  // At 36 dB, where the range ended before the knob was given its taper,
  // the worst below 18 kHz measured -105 dBFS; the last 6 dB cost 6 dB of
  // that, hence -95 here and not -100.)
  {
    double worst[2] = {-300.0, -300.0}, worst_low[2] = {-300.0, -300.0};
    for (int push = 0; push < 2; ++push) {
      for (int c = 0; c < kCircuits; ++c) {
        setup(44100.0f, c, 1.0f, push);
        Stereo out = run(device, sine(5000.0f, 3.0f, 44100.0f, 0.5f));
        worst_low[push] = std::max(worst_low[push], alias_db(out.left, 5000.0, 20.0, 18000.0, 44100.0));
        worst[push] = std::max(worst[push], alias_db(out.left, 5000.0, 20.0, 20000.0, 44100.0));
      }
    }
    std::printf("analog-drive aliasing (5 kHz, -6 dBFS, Drive 1, 44.1 kHz), worst circuit: %.1f dBFS to 20 kHz "
                "(%.1f to 18 kHz); Push on %.1f dBFS (%.1f to 18 kHz)\n",
                worst[0], worst_low[0], worst[1], worst_low[1]);
    EXPECT(worst[0] < -70.0, "aliasing stays under -70 dBFS at full Drive");
    EXPECT(worst_low[0] < -95.0, "and under -95 dBFS below 18 kHz");
    EXPECT(worst[1] < -70.0, "Push on: aliasing stays under -70 dBFS (the brief asks -60)");
    EXPECT(worst_low[1] < -90.0, "Push on: under -90 dBFS below 18 kHz");
  }

  // Auto Gain holds the loudness: pink noise at -18 dBFS RMS comes out
  // within 1 dB of that at every Drive, in every circuit, Push off or on.
  // (The table was measured with another noise; this is a different seed.)
  {
    const std::vector<float> in = pink(3.0f, kRate, 0.125893f, 0xC0FFEEu);
    const double in_db = db(rms(in, 48000));
    double low = 100.0, high = -100.0;
    for (int c = 0; c < kCircuits; ++c) {
      for (int push = 0; push < 2; ++push) {
        for (int k = 0; k <= 8; ++k) {
          setup(kRate, c, k / 8.0f + (k % 2 ? 0.017f : 0.0f), push);
          Stereo out = run(device, in);
          const double change = db(rms(out.left, 48000)) - in_db;
          low = std::min(low, change);
          high = std::max(high, change);
        }
      }
    }
    std::printf("analog-drive Auto Gain: pink noise at -18 dBFS leaves between %+.2f and %+.2f dB of where it came in\n",
                low, high);
    EXPECT(low > -1.0 && high < 1.0, "Auto Gain holds pink noise within 1 dB over the whole Drive range");

    // Off, Drive makes it louder, and Push is still level-matched.
    double off[2];
    for (int k = 0; k < 2; ++k) {
      setup(kRate, kTape, k == 0 ? 0.0f : 0.7f);
      device.set_param(p::kAutoGain, 0.0f);
      Stereo out = run(device, in);
      off[k] = db(rms(out.left, 48000)) - in_db;
    }
    setup(kRate, kTape, 0.3f);
    device.set_param(p::kAutoGain, 0.0f);
    Stereo plain = run(device, in);
    setup(kRate, kTape, 0.3f, 1);
    device.set_param(p::kAutoGain, 0.0f);
    Stereo pushed = run(device, in);
    const double push_change = db(rms(pushed.left, 48000) / rms(plain.left, 48000));
    std::printf("analog-drive Auto Gain off: %+.1f dB at Drive 0, %+.1f dB at Drive 0.7; Push changes it by %+.2f dB\n",
                off[0], off[1], push_change);
    EXPECT_NEAR(off[0], 0.0, 0.5, "Auto Gain off: Drive 0 is unity");
    EXPECT(off[1] > 6.0 && off[1] < 20.0, "Auto Gain off: Drive makes it louder");
    EXPECT_NEAR(push_change, 0.0, 1.0, "Push is level-compensated with Auto Gain off too");
  }

  // The tone-shaping controls, measured with a quiet tone at Drive 0 on the
  // console circuit, each against the same tone with the control at rest.
  {
    auto gain = [](float hz, int id, float value, int id2 = -1, float value2 = 0.0f) {
      setup(kRate, kConsole, 0.0f);
      const double rest = small_signal_db(hz);
      setup(kRate, kConsole, 0.0f);
      device.set_param(id, value);
      if (id2 >= 0) device.set_param(id2, value2);
      return small_signal_db(hz) - rest;
    };
    // Low Cut: second order, so two octaves under it is 24 dB down.
    const double cut_low = gain(50.0f, p::kLowCut, 200.0f);
    const double cut_corner = gain(200.0f, p::kLowCut, 200.0f);
    const double cut_pass = gain(2000.0f, p::kLowCut, 200.0f);
    std::printf("analog-drive Low Cut 200 Hz: %.1f dB at 50 Hz, %.1f dB at 200 Hz, %.2f dB at 2 kHz\n", cut_low,
                cut_corner, cut_pass);
    EXPECT_NEAR(cut_low, -24.1, 1.0, "Low Cut 200 Hz: 50 Hz is 24 dB down");
    EXPECT_NEAR(cut_corner, -3.0, 0.5, "Low Cut 200 Hz: -3 dB at the corner");
    EXPECT_NEAR(cut_pass, 0.0, 0.1, "Low Cut 200 Hz: 2 kHz untouched");
    // Thump: a 9 dB bell at 1.6 times the Low Cut.
    const double bump = gain(160.0f, p::kThump, 1.0f, p::kLowCut, 100.0f) - gain(160.0f, p::kLowCut, 100.0f);
    const double bump_far = gain(2000.0f, p::kThump, 1.0f, p::kLowCut, 100.0f);
    const double bump_floor = gain(60.0f, p::kThump, 1.0f);
    std::printf("analog-drive Thump 1: %+.1f dB at 160 Hz with Low Cut 100 Hz, %+.2f dB at 2 kHz; %+.1f dB at 60 Hz with "
                "Low Cut out\n",
                bump, bump_far, bump_floor);
    EXPECT_NEAR(bump, 9.0, 0.5, "Thump: 9 dB just above the Low Cut");
    EXPECT_NEAR(bump_far, 0.0, 0.3, "Thump: nothing at 2 kHz");
    EXPECT_NEAR(bump_floor, 9.0, 0.5, "Thump: sits at 60 Hz when the Low Cut is out");
    // Tone: a tilt about 800 Hz.
    const double tilt_low = gain(60.0f, p::kTone, 1.0f);
    const double tilt_pivot = gain(800.0f, p::kTone, 1.0f);
    const double tilt_high = gain(12000.0f, p::kTone, 1.0f);
    const double dark_high = gain(12000.0f, p::kTone, -1.0f);
    std::printf("analog-drive Tone +1: %+.1f dB at 60 Hz, %+.2f dB at 800 Hz, %+.1f dB at 12 kHz; Tone -1: %+.1f dB at "
                "12 kHz\n",
                tilt_low, tilt_pivot, tilt_high, dark_high);
    EXPECT(tilt_low < -5.0 && tilt_low > -6.1, "Tone up thins the lows by nearly 6 dB");
    EXPECT_NEAR(tilt_pivot, 0.0, 0.1, "Tone leaves 800 Hz where it was");
    EXPECT(tilt_high > 5.0 && tilt_high < 6.1, "Tone up lifts the highs by nearly 6 dB");
    EXPECT(dark_high < -5.0, "Tone down darkens");
    // High Cut: fourth order, 24 dB an octave.
    const double top_pass = gain(500.0f, p::kHighCut, 2000.0f);
    const double top_corner = gain(2000.0f, p::kHighCut, 2000.0f);
    const double top_cut = gain(8000.0f, p::kHighCut, 2000.0f);
    std::printf("analog-drive High Cut 2 kHz: %.2f dB at 500 Hz, %.1f dB at 2 kHz, %.1f dB at 8 kHz\n", top_pass,
                top_corner, top_cut);
    EXPECT_NEAR(top_pass, 0.0, 0.1, "High Cut 2 kHz: 500 Hz untouched");
    EXPECT_NEAR(top_corner, -3.0, 0.5, "High Cut 2 kHz: -3 dB at the corner");
    EXPECT(top_cut < -45.0, "High Cut 2 kHz: two octaves up is over 45 dB down");
  }

  // The Low Cut works before the circuit: with it up, the same loud bass
  // note makes far less distortion in the mids, because it no longer drives
  // the curve.
  {
    double grit[2];
    for (int k = 0; k < 2; ++k) {
      setup(kRate, kTape, 0.35f);
      if (k == 1) device.set_param(p::kLowCut, 400.0f);
      std::vector<float> in = sine(55.0f, 1.5f, kRate, 0.4f);
      const std::vector<float> high = sine(1000.0f, 1.5f, kRate, 0.05f);
      for (size_t i = 0; i < in.size(); ++i) in[i] += high[i];
      Stereo out = run(device, in);
      // Sidebands of 1 kHz at +-110 Hz: intermodulation with the bass.
      grit[k] = db((tone_level(out.left, 890.0, kRate, 24000, 72000) + tone_level(out.left, 1110.0, kRate, 24000, 72000)) /
                   tone_level(out.left, 1000.0, kRate, 24000, 72000));
    }
    std::printf("analog-drive bass intermodulation on a 1 kHz tone: %.1f dBc, with Low Cut at 400 Hz %.1f dBc\n", grit[0],
                grit[1]);
    EXPECT(grit[1] < grit[0] - 12.0, "Low Cut keeps the bass from driving the circuit");
  }

  // No DC, whatever the circuit does to the wave's symmetry: a low note at
  // every circuit, moderate and extreme.
  {
    double worst = 0.0;
    for (int c = 0; c < kCircuits; ++c) {
      for (int k = 0; k < 3; ++k) {
        setup(kRate, c, k == 0 ? 0.3f : 1.0f, k == 2 ? 1 : 0);
        if (k == 2) device.set_param(p::kAutoGain, 0.0f);
        Stereo out = run(device, sine(82.0f, 3.0f, kRate, 0.5f));
        worst = std::max(worst, std::fabs(mean(out.left, 96000, 144000)));
      }
    }
    std::printf("analog-drive DC, worst of every circuit at Drive 0.3, 1 and 1 with Push: %.1e\n", worst);
    EXPECT(worst < 1.0e-3, "no setting leaves DC on the output");
  }

  // Latency and Mix. The driven signal arrives 39 samples late in every
  // circuit, Mix 0 is the input delayed by exactly that and otherwise
  // untouched, and part way the clean and driven parts are aligned: a quiet
  // 5 kHz tone at Mix 0.5 does not lose level to a comb.
  {
    for (int c = 0; c < kCircuits; ++c) {
      setup(kRate, c, 0.0f);
      Stereo wet = run(device, impulse(0.05f, kRate, 0.1f));
      char label[96];
      std::snprintf(label, sizeof label, "%s: an impulse lands on sample %d (got %zu)", kNames[c], kLatency,
                    peak_index(wet.left));
      EXPECT(peak_index(wet.left) == static_cast<size_t>(kLatency), label);
    }
    setup(kRate, kPentode, 1.0f, 1);
    device.set_param(p::kMix, 0.0f);
    device.set_param(p::kOutput, 12.0f);
    rng_state() = 0x51DEu;
    const std::vector<float> in = noise(0.5f, kRate, 0.5f);
    Stereo out = run(device, in);
    double worst = 0.0;
    for (size_t i = kLatency; i < in.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - in[i - kLatency]));
    }
    EXPECT(worst == 0.0, "Mix 0 is the input, 39 samples late, bit for bit");

    setup(kRate, kTriode, 0.0f);
    const double full = small_signal_db(5000.0f);
    setup(kRate, kTriode, 0.0f);
    device.set_param(p::kMix, 0.5f);
    const double half = small_signal_db(5000.0f);
    std::printf("analog-drive 5 kHz at Drive 0: %+.2f dB driven, %+.2f dB at Mix 0.5\n", full, half);
    // Half the clean tone (0 dB) plus half the driven one, in phase.
    EXPECT_NEAR(half, db(0.5 + 0.5 * std::pow(10.0, full / 20.0)), 0.05, "Mix 0.5: clean and driven add in phase");
  }

  // Stereo: the two channels go through the same curve at the same working
  // point, so a mono source stays mono and a one-sided source stays on its
  // side. The triode's working point moves with the level of both channels,
  // and what that leaves on a silent side is under -100 dBFS.
  {
    setup(kRate, kTriode, 0.35f);
    const std::vector<float> in = pink(1.0f, kRate, 0.125893f, 0xB0B0u);
    Stereo mono = run(device, in);
    bool identical = true;
    for (size_t i = 0; i < mono.size(); ++i) identical = identical && mono.left[i] == mono.right[i];
    EXPECT(identical, "a mono source comes out identical on both sides");
    setup(kRate, kTape, 0.7f);
    Stereo sided = run(device, in, silence(1.0f, kRate));
    EXPECT(rms(sided.left) > 0.05 && peak(sided.right) == 0.0, "Tape preamp: a left-only source leaves the right silent");
    setup(kRate, kTriode, 0.35f);
    sided = run(device, in, silence(1.0f, kRate));
    std::printf("analog-drive Triode, left-only source: right peaks at %.1f dBFS\n", db(peak(sided.right)));
    EXPECT(peak(sided.right) < 1.0e-5, "Triode: a left-only source leaves under -100 dBFS on the right");
  }

  // A mono source is worked out once and copied; when the sides part, the
  // right takes over a copy of the left's state. Nothing may depend on which
  // side that happens to: the same programme with its sides swapped gives
  // the same audio with its sides swapped, bit for bit, including through a
  // Circuit change.
  {
    const std::vector<float> x = pink(1.0f, kRate, 0.125893f, 0x0DD5u);
    std::vector<float> y = pink(1.0f, kRate, 0.2f, 0xE7E5u);
    for (size_t i = 0; i < 14400; ++i) y[i] = x[i];   // the same for 0.3 s, then different
    Stereo out[2];
    for (int swapped = 0; swapped < 2; ++swapped) {
      setup(kRate, kTriode, 0.6f);
      device.set_param(p::kLowCut, 80.0f);
      device.set_param(p::kThump, 0.5f);
      device.set_param(p::kTone, 0.4f);
      device.set_param(p::kHighCut, 6000.0f);
      const std::vector<float> first_x(x.begin(), x.begin() + 24000), rest_x(x.begin() + 24000, x.end());
      const std::vector<float> first_y(y.begin(), y.begin() + 24000), rest_y(y.begin() + 24000, y.end());
      Stereo a = swapped ? run(device, first_y, first_x) : run(device, first_x, first_y);
      device.set_param(p::kCircuit, static_cast<float>(kPentode));
      Stereo b = swapped ? run(device, rest_y, rest_x) : run(device, rest_x, rest_y);
      out[swapped] = concat(a, b);
    }
    EXPECT(out[0].left == out[1].right && out[0].right == out[1].left,
           "a source that starts mono and parts gives the same audio whichever side moves");
    bool together = true;
    for (size_t i = 0; i < 14400; ++i) together = together && out[0].left[i] == out[0].right[i];
    EXPECT(together && rms(out[0].left, 0, 14400) > 0.01, "and both sides are identical while it is mono");
  }

  // Moving things while sounding. Drive swept end to end, a jump in Drive,
  // every change of Circuit and the Push switch: none makes a step larger
  // than the waveform itself has.
  {
    std::vector<float> in = sine(110.0f, 2.0f, kRate, 0.3f);
    const std::vector<float> high = sine(1000.0f, 2.0f, kRate, 0.08f);
    for (size_t i = 0; i < in.size(); ++i) in[i] += high[i];
    const std::vector<float> first(in.begin(), in.begin() + 48000), second(in.begin() + 48000, in.end());
    auto steady_step = [&](int circuit, float drive, int push) {
      setup(kRate, circuit, drive, push);
      Stereo out = run(device, first);
      return max_step(out.left, 24000);
    };
    double worst_ratio = 0.0;
    for (int c = 0; c < kCircuits; ++c) {
      for (float drive : {0.3f, 0.9f}) {
        const int to = (c + 2) % kCircuits;
        const double reference = std::max(steady_step(c, drive, 0), steady_step(to, drive, 0));
        setup(kRate, c, drive);
        run(device, first);
        device.set_param(p::kCircuit, static_cast<float>(to));
        Stereo during = run(device, second);
        worst_ratio = std::max(worst_ratio, max_step(during.left) / reference);
      }
    }
    std::printf("analog-drive Circuit switch: largest step %.2f times the steady waveform's\n", worst_ratio);
    EXPECT(worst_ratio < 1.25, "switching Circuit while sounding does not click");

    const double push_reference = std::max(steady_step(kTape, 0.5f, 0), steady_step(kTape, 0.5f, 1));
    setup(kRate, kTape, 0.5f);
    run(device, first);
    device.set_param(p::kPush, 1.0f);
    Stereo pushed = run(device, second);
    EXPECT(max_step(pushed.left) < 1.25 * push_reference, "switching Push while sounding does not click");

    const double jump_reference = std::max(steady_step(kTape, 0.0f, 0), steady_step(kTape, 1.0f, 0));
    setup(kRate, kTape, 0.0f);
    run(device, first);
    device.set_param(p::kDrive, 1.0f);
    Stereo jumped = run(device, second);
    std::printf("analog-drive Drive 0 to 1 at once: step %.4f (steady %.4f), peak %.2f of %.2f in\n",
                max_step(jumped.left), jump_reference, peak(jumped.left), peak(second));
    EXPECT(max_step(jumped.left) < 1.25 * jump_reference, "a jump in Drive does not click");
    EXPECT(peak(jumped.left) < 1.5 * peak(second), "a jump in Drive does not burst: the make-up moves with it");

    // A sweep in 64-sample steps, as a hand on the knob sends it.
    setup(kRate, kConsole, 0.0f);
    Stereo swept;
    double sweep_step = 0.0;
    for (int block = 0; block < 750; ++block) {
      device.set_param(p::kDrive, block / 749.0f);
      const std::vector<float> piece(in.begin() + block * 64, in.begin() + (block + 1) * 64);
      Stereo out = run(device, piece, 64);
      if (!swept.left.empty()) sweep_step = std::max(sweep_step, std::fabs(static_cast<double>(out.left[0]) - swept.left.back()));
      sweep_step = std::max(sweep_step, max_step(out.left));
      swept = out;
    }
    EXPECT(sweep_step < 1.25 * std::max(steady_step(kConsole, 0.0f, 0), steady_step(kConsole, 1.0f, 0)),
           "sweeping Drive does not zipper");
  }

  // Bounded. With Auto Gain on, a full-scale note with Push on never leaves
  // louder than it came in. The loudest the device can be made is Auto Gain
  // off with Thump, Tone and Output all up: that came to 26 before the
  // safety stage, and stays under max_peak (4) with it.
  {
    double held = 0.0, loudest = 0.0;
    for (int c = 0; c < kCircuits; ++c) {
      setup(kRate, c, 1.0f, 1);
      Stereo out = run(device, sine(41.0f, 2.0f, kRate, 1.0f));
      held = std::max(held, peak(out.left, 24000));
      for (float drive : {0.25f, 0.5f, 1.0f}) {
        for (int push = 0; push < 2; ++push) {
          setup(kRate, c, drive, push);
          device.set_param(p::kAutoGain, 0.0f);
          device.set_param(p::kThump, 1.0f);
          device.set_param(p::kTone, 1.0f);
          device.set_param(p::kOutput, 12.0f);
          rng_state() = 0xD1CEu;
          Stereo loud = run(device, noise(1.0f, kRate, 1.0f));
          EXPECT(finite(loud.left), "finite at the loudest setting");
          loudest = std::max(loudest, peak(loud.left));
        }
      }
    }
    std::printf("analog-drive full scale with Push, Auto Gain on: peak %.2f; loudest setting (Auto Gain off, Thump, Tone "
                "and Output up, full-scale noise): %.5f\n",
                held, loudest);
    EXPECT(held < 1.0, "Push on a full-scale note stays under full scale with Auto Gain on");
    EXPECT(loudest < spec.max_peak, "the loudest setting stays under the ceiling");
    EXPECT(loudest > 3.0, "and that setting is one the safety stage has to hold (it measured 26 without it)");
  }

  // The safety stage that does the holding: exactly its input up to 1.5 on
  // either side, to the bit; above that it keeps rising, never faster than
  // the input, leaves the straight part without a corner and never reaches
  // 4, whatever arrives.
  {
    bool exact = true;
    rng_state() = 0x5AFEu;
    for (int i = 0; i < 400000; ++i) {
      const float x = i < 200000 ? -1.5f + 3.0f * static_cast<float>(i) / 199999.0f : 1.5f * white();
      const float y = AnalogDrive::safety(x);
      exact = exact && std::memcmp(&x, &y, sizeof x) == 0;
    }
    const float edges[] = {1.5f, -1.5f, 0.0f, -0.0f, 1.0e-30f, 1.4999999f};
    for (float x : edges) {
      const float y = AnalogDrive::safety(x);
      exact = exact && std::memcmp(&x, &y, sizeof x) == 0;
    }
    EXPECT(exact, "safety stage: every value from -1.5 to 1.5 comes back bit for bit");
    bool rising = true, gentle = true, odd = true;
    float last = 1.5f;
    for (float x = 1.5f; x < 60.0f; x += 0.001f) {
      const float y = AnalogDrive::safety(x);
      rising = rising && y >= last && y < 4.0f;
      gentle = gentle && y <= x;
      odd = odd && AnalogDrive::safety(-x) == -y;
      last = y;
    }
    const float huge[] = {100.0f, 1.0e6f, 1.0e30f, std::numeric_limits<float>::infinity()};
    for (float x : huge) rising = rising && AnalogDrive::safety(x) < 4.0f && AnalogDrive::safety(-x) > -4.0f;
    EXPECT(rising, "safety stage: rises all the way and stays under 4 for any input, infinity included");
    EXPECT(gentle && odd, "safety stage: never above its input, and the same on both sides");
    // No corner at 1.5: a hundredth above it the curve is still within a
    // millionth of the straight line.
    EXPECT(1.51f - AnalogDrive::safety(1.51f) < 1.0e-6f, "safety stage: leaves the straight part smoothly");
    EXPECT(AnalogDrive::safety(1.0e30f) > 3.99f, "safety stage: lands on 4");

    // In the device: the same programme with Output raised until it peaks
    // at about 1.4 is the Output 0 render times that gain, sample for
    // sample.
    const std::vector<float> in = pink(1.0f, kRate, 0.1f, 0x5AFE2u);
    setup(kRate, kTriode, 0.5f);
    Stereo plain = run(device, in);
    const float raise = std::min(12.0f, static_cast<float>(db(1.4 / peak(plain.left))));
    setup(kRate, kTriode, 0.5f);
    device.set_param(p::kOutput, raise);
    Stereo raised = run(device, in);
    const float gain = livemix::kit::db_to_gain(raise);
    double off = 0.0;
    for (size_t i = 0; i < in.size(); ++i) {
      off = std::max(off, std::fabs(static_cast<double>(raised.left[i]) - static_cast<double>(plain.left[i]) * gain));
    }
    std::printf("analog-drive safety stage: Output %+.1f dB peaks at %.2f and is the Output 0 render times %.2f to "
                "within %.1e\n",
                raise, peak(raised.left), gain, off);
    EXPECT(peak(raised.left) > 1.2 && peak(raised.left) < 1.5, "that render peaks between 1.2 and 1.5");
    EXPECT(off < 1.0e-6, "under 1.5 the safety stage changes nothing");
  }

  // Levels at the default patch: a sustained tone and pink noise both come
  // out within 1 dB of where they went in.
  {
    device.init(kRate);
    Stereo tone = run(device, sine(220.0f, 1.0f, kRate, 0.25f));
    const double tone_change = db(rms(tone.left, 24000) / (0.25 / std::sqrt(2.0)));
    device.init(kRate);
    const std::vector<float> in = pink(3.0f, kRate, 0.125893f, 0xFACEu);
    Stereo out = run(device, in);
    const double noise_change = db(rms(out.left, 48000) / rms(in, 48000));
    std::printf("analog-drive defaults: a -12 dBFS tone leaves %+.2f dB, pink noise at -18 dBFS %+.2f dB\n", tone_change,
                noise_change);
    EXPECT_NEAR(tone_change, 0.0, 1.0, "defaults: a sustained tone keeps its level");
    EXPECT_NEAR(noise_change, 0.0, 1.0, "defaults: pink noise keeps its level");
  }

  // The same device at every sample rate: the distortion of a note and the
  // response to a quiet tone do not move with the rate.
  {
    double thd[3], bass[3], treble[3];
    const float rates[3] = {44100.0f, 48000.0f, 96000.0f};
    for (int r = 0; r < 3; ++r) {
      setup(rates[r], kTransformer, 0.2f);
      Stereo out = run(device, sine(220.0f, 1.5f, rates[r], 0.25f));
      const size_t n = out.size();
      thd[r] = thd_percent(out.left, 220.0, rates[r], n / 3, n);
      setup(rates[r], kTransformer, 0.0f);
      bass[r] = small_signal_db(100.0f, rates[r]);
      setup(rates[r], kTransformer, 0.0f);
      treble[r] = small_signal_db(8000.0f, rates[r]);
    }
    std::printf("analog-drive at 44.1 / 48 / 96 kHz: THD %.2f / %.2f / %.2f %%, 100 Hz %+.2f / %+.2f / %+.2f dB, 8 kHz "
                "%+.2f / %+.2f / %+.2f dB\n",
                thd[0], thd[1], thd[2], bass[0], bass[1], bass[2], treble[0], treble[1], treble[2]);
    EXPECT(std::fabs(thd[0] - thd[1]) < 0.05 * thd[1] && std::fabs(thd[2] - thd[1]) < 0.05 * thd[1],
           "the distortion is the same at 44.1, 48 and 96 kHz");
    EXPECT(std::fabs(bass[0] - bass[1]) < 0.1 && std::fabs(bass[2] - bass[1]) < 0.1, "100 Hz response does not move");
    EXPECT(std::fabs(treble[0] - treble[1]) < 0.2 && std::fabs(treble[2] - treble[1]) < 0.2,
           "8 kHz response does not move");
  }

  // The device sleeps: exact zero shortly after the input stops, and it
  // wakes with whatever was changed in the meantime already in place.
  {
    setup(kRate, kTriode, 0.8f, 1);
    run(device, sine(110.0f, 0.5f, kRate, 0.5f));
    render(device, 1.0f, kRate);
    Stereo rest = render(device, 0.25f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep within a second of the input stopping");
    device.set_param(p::kCircuit, static_cast<float>(kConsole));
    device.set_param(p::kPush, 0.0f);
    device.set_param(p::kDrive, 0.2f);
    Stereo woken = run(device, sine(220.0f, 0.5f, kRate, 0.25f));
    setup(kRate, kConsole, 0.2f);
    Stereo fresh = run(device, sine(220.0f, 0.5f, kRate, 0.25f));
    EXPECT(woken.left == fresh.left, "wakes straight into the new circuit, with no crossfade from the old one");
  }

  // Cost with everything in the path: the transformer (two kernels, four
  // filters around the curve), Low Cut, Thump, Tone and High Cut all in.
  setup(kRate, kTransformer, 0.6f);
  device.set_param(p::kLowCut, 80.0f);
  device.set_param(p::kThump, 0.5f);
  device.set_param(p::kTone, 0.3f);
  device.set_param(p::kHighCut, 8000.0f);
  // A stereo source, so both channels are worked out (a mono one costs half).
  const std::vector<float> load_left = pink(10.0f, kRate, 0.125893f, 0xBEEFu);
  const std::vector<float> load_right = pink(10.0f, kRate, 0.125893f, 0xF00Du);
  report_cost("analog-drive", 10.0f, kRate, [&] { run(device, load_left, load_right); });

  return finish("analog-drive");
}
