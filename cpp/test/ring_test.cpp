// Native harness for Ring (cpp/devices/ring). The conformance pass covers
// stability, silence when idle, block-size independence on steady noise and
// parameter abuse; the rest asserts what makes it a ring modulator tuned to a
// note: the sum and the difference with nothing of the input left, the
// carrier's pitch at every note and sample rate, Fine in cents, the second
// pair, the shapes' own harmonics and what is kept from folding, the drift's
// size and that it runs free, the filters on the ringing sound alone, the
// diode bridge's lean on loud notes, and what a knob, a silence or a bad
// sample does.

#include <functional>

#include "../devices/ring/ring.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Ring;
using livemix::ring::Diode;
using livemix::ring::Waves;
namespace p = livemix::ring;

static Ring device;
static Ring other;

static const float kRate = 48000.0f;

// Constants of ring.h, copied: the harness holds the device to them.
static const double kDriftCents = 50.0;
static const double kDriftHz = 0.11;
static const uint32_t kDriftSeed = 0x52494E47u;
static const int kControlPeriod = 16;
static const double kHoldSeconds = 0.3;
static const double kFirstGain = 0.8;
static const double kSecondGain = 0.6;
static const double kFifth = 1.49830708;

enum { kSine = 0, kTriangle, kSoftSquare, kDiode };
enum { kOff = 0, kFifthUp, kOctaveUp, kOctaveDown };

// The modulator alone: a steady carrier, the filters as far open as they go,
// both sides alike, wet only.
static void plain(Ring& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kDrift, 0.0f);
  d.set_param(p::kLowCut, 20.0f);
  d.set_param(p::kTone, 16000.0f);
  d.set_param(p::kWidth, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

// Free tuning at `hz`.
static void free_at(Ring& d, float hz) {
  d.set_param(p::kTune, 1.0f);
  d.set_param(p::kFrequency, hz);
}

static std::vector<float> steady(float seconds, float rate, float level) {
  return std::vector<float>(static_cast<size_t>(seconds * rate), level);
}

// Frequency from the rising zero crossings in [from, to), interpolated.
static double crossing_frequency(const std::vector<float>& x, size_t from, size_t to, double rate) {
  double first = -1.0, last = -1.0;
  int count = 0;
  for (size_t i = from + 1; i < to && i < x.size(); ++i) {
    if (x[i - 1] < 0.0f && x[i] >= 0.0f) {
      const double at = static_cast<double>(i - 1) + x[i - 1] / (static_cast<double>(x[i - 1]) - x[i]);
      if (first < 0.0) first = at;
      last = at;
      ++count;
    }
  }
  return count > 1 ? (count - 1) * rate / (last - first) : 0.0;
}

static double cents(double hz, double against) { return 1200.0 * std::log2(hz / against); }

// --- a spectrum ---------------------------------------------------------------------------

static const int kBins = 32768;
static livemix::kit::Fft<kBins> fft;
static float fft_re[kBins];
static float fft_im[kBins];

// The amplitude in every bin of kBins samples from `from`, under a
// four-term Blackman-Harris window (side lobes 92 dB down): a sine of
// amplitude A on a bin reads A there.
static std::vector<double> spectrum_of(const std::vector<float>& x, size_t from) {
  static bool ready = false;
  if (!ready) {
    fft.init();
    ready = true;
  }
  double window_sum = 0.0;
  for (int i = 0; i < kBins; ++i) {
    const double t = 2.0 * kPi * i / kBins;
    const double w = 0.35875 - 0.48829 * std::cos(t) + 0.14128 * std::cos(2.0 * t) - 0.01168 * std::cos(3.0 * t);
    fft_re[i] = static_cast<float>(w * x[from + i]);
    fft_im[i] = 0.0f;
    window_sum += w;
  }
  fft.forward(fft_re, fft_im);
  std::vector<double> out(kBins / 2);
  for (int k = 0; k < kBins / 2; ++k) {
    out[k] = 2.0 * std::sqrt(static_cast<double>(fft_re[k]) * fft_re[k] + static_cast<double>(fft_im[k]) * fft_im[k]) /
             window_sum;
  }
  return out;
}

// The largest reading within the window's main lobe of a bin.
static double at_bin(const std::vector<double>& s, int bin) {
  double best = 0.0;
  for (int k = std::max(0, bin - 4); k <= std::min(kBins / 2 - 1, bin + 4); ++k) best = std::max(best, s[k]);
  return best;
}

// The largest reading anywhere that is not within the main lobe of one of
// `expected` (bins; a negative one counts as its mirror).
static double strongest_other(const std::vector<double>& s, const std::vector<int>& expected) {
  std::vector<char> known(kBins / 2, 0);
  for (int bin : expected) {
    bin = std::abs(bin);
    if (bin >= kBins / 2) continue;
    for (int k = std::max(0, bin - 5); k <= std::min(kBins / 2 - 1, bin + 5); ++k) known[k] = 1;
  }
  double worst = 0.0;
  for (int k = 6; k < kBins / 2; ++k) {
    if (!known[k]) worst = std::max(worst, s[k]);
  }
  return worst;
}

static float bin_hz(int bin) { return static_cast<float>(bin) * kRate / kBins; }

// The Fourier sine coefficient of a shape's ideal cycle, scaled as the
// tables are: a root mean square of one over the harmonics the tables keep.
static double ideal_harmonic(int shape, int n) {
  const int points = 1 << 15;
  auto coefficient = [&](int k) {
    double sum = 0.0;
    for (int i = 0; i < points; ++i) {
      const double phase = static_cast<double>(i) / points;
      sum += Waves::ideal(shape, phase) * std::sin(2.0 * kPi * k * phase);
    }
    return 2.0 * sum / points;
  };
  static double scale[Waves::kNumShapes] = {0.0, 0.0, 0.0};
  if (scale[shape] == 0.0) {
    double power = 0.0;
    for (int k = 1; k <= Waves::kLimit[Waves::kCuts - 1]; k += 2) power += 0.5 * coefficient(k) * coefficient(k);
    scale[shape] = 1.0 / std::sqrt(power);
  }
  return std::fabs(coefficient(n)) * scale[shape];
}

// How much of what an event does is there at once: the two renders differ
// by the event alone, and the largest difference in its first 8 samples is
// taken against the largest over the next 20 ms. Worst of eight moments.
static double suddenness(const std::function<void(Ring&)>& setup, const std::function<void(Ring&)>& event,
                         const std::vector<float>& input) {
  double worst = 0.0;
  for (int moment = 0; moment < 8; ++moment) {
    const size_t lead = 9600 + 53 * moment;
    const std::vector<float> before(input.begin(), input.begin() + lead);
    const std::vector<float> after(input.begin() + lead, input.begin() + lead + 960);
    setup(device);
    run(device, before);
    event(device);
    const Stereo with = run(device, after);
    setup(other);
    run(other, before);
    const Stereo without = run(other, after);
    double early = 0.0, all = 0.0;
    for (size_t i = 0; i < 960; ++i) {
      const double d = std::max(std::fabs(static_cast<double>(with.left[i]) - without.left[i]),
                                std::fabs(static_cast<double>(with.right[i]) - without.right[i]));
      if (i < 8) early = std::max(early, d);
      all = std::max(all, d);
    }
    if (all > 1.0e-6) worst = std::max(worst, early / all);
  }
  return worst;
}

// --- the checks ---------------------------------------------------------------------------

// A sine at f through a carrier at c: c + f and c − f, each at 1/√2, and
// nothing at f.
static void test_sum_and_difference() {
  plain(device);
  device.set_param(p::kRoot, 9.0f);  // A4, 440 Hz
  device.set_param(p::kOctave, 4.0f);
  const Stereo out = run(device, sine(1000.0f, 1.5f, kRate, 0.5f));
  const size_t from = 24000, to = 72000;
  const double sum = tone_level(out.left, 1440.0, kRate, from, to);
  const double difference = tone_level(out.left, 560.0, kRate, from, to);
  const double input = tone_level(out.left, 1000.0, kRate, from, to);
  std::printf("1. 1000 Hz through A4: 1440 Hz %.4f, 560 Hz %.4f (each 0.3536 of 0.5), 1000 Hz %.1f dB under them, "
              "power %.3f dB against the input\n",
              sum, difference, -db(input / sum), db(rms(out.left, from, to) / (0.5 * std::sqrt(0.5))));
  EXPECT_NEAR(sum, 0.5 * std::sqrt(0.5), 0.004, "the sum tone is at c + f, 1/sqrt 2 of the input");
  EXPECT_NEAR(difference, 0.5 * std::sqrt(0.5), 0.004, "the difference tone is at c - f, 1/sqrt 2 of the input");
  EXPECT(db(input / sum) < -80.0, "nothing of the input's own frequency is left in the ringing sound");
  EXPECT_NEAR(db(rms(out.left, from, to) / (0.5 * std::sqrt(0.5))), 0.0, 0.1, "the ringing sound has the input's power");
  EXPECT(out.left == out.right, "Width 0: both sides are the same");

  // A carrier above the input: the difference is c − f all the same.
  device.set_param(p::kOctave, 6.0f);  // A6, 1760 Hz
  render(device, 0.5f, kRate);
  const Stereo above = run(device, sine(1000.0f, 1.5f, kRate, 0.5f));
  EXPECT_NEAR(tone_level(above.left, 2760.0, kRate, from, to), 0.5 * std::sqrt(0.5), 0.004, "A6: the sum is at 2760 Hz");
  EXPECT_NEAR(tone_level(above.left, 760.0, kRate, from, to), 0.5 * std::sqrt(0.5), 0.004, "A6: the difference is at 760 Hz");
}

// The carrier is the note, for every root and octave, at three sample
// rates. A steady input lets the carrier itself through.
static void test_carrier_is_the_note() {
  double worst = 0.0;
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    for (int octave = 0; octave <= 7; ++octave) {
      for (int root = 0; root < 12; ++root) {
        plain(device, rate);
        device.set_param(p::kRoot, static_cast<float>(root));
        device.set_param(p::kOctave, static_cast<float>(octave));
        // Low carriers need more cycles to be read to a hundredth of a cent.
        const float seconds = octave < 2 ? 3.0f : 1.0f;
        const Stereo out = run(device, steady(seconds, rate, 0.5f));
        const double expected = 440.0 * std::pow(2.0, (12.0 * (octave + 1) + root - 69.0) / 12.0);
        const double measured = crossing_frequency(out.left, static_cast<size_t>(0.4f * rate), out.size(), rate);
        worst = std::max(worst, std::fabs(cents(measured, expected)));
      }
    }
  }
  std::printf("2. the carrier at all 96 notes (C0 to B7) and three sample rates: within %.4f cents of the note\n", worst);
  EXPECT(worst < 0.05, "the carrier is at the note's frequency for every root and octave at 44.1, 48 and 96 kHz");
  EXPECT_NEAR(Ring::note_hz(9, 4), 440.0, 1.0e-3, "A4 is 440 Hz");
  EXPECT_NEAR(Ring::note_hz(0, 4), 261.6256, 1.0e-3, "C4 is middle C");
}

// Fine moves the carrier by cents, in Note and in Free tuning; Free takes
// the carrier from Frequency.
static void test_fine_and_free() {
  double worst = 0.0;
  for (float fine : {-100.0f, -37.0f, -3.0f, 0.0f, 3.0f, 50.0f, 100.0f}) {
    plain(device);
    device.set_param(p::kRoot, 9.0f);
    device.set_param(p::kFine, fine);
    const Stereo out = run(device, steady(1.5f, kRate, 0.5f));
    const double measured = crossing_frequency(out.left, 19200, out.size(), kRate);
    worst = std::max(worst, std::fabs(cents(measured, 440.0) - fine));
  }
  std::printf("3. Fine at -100, -37, -3, 0, 3, 50 and 100 cents on A4: the carrier is within %.4f cents of it\n", worst);
  EXPECT(worst < 0.05, "Fine moves the carrier by that many cents");

  // A slow carrier is read off the level of a tone it rings: the product of
  // what comes out and what went in, a millisecond at a time, is the carrier.
  double worst_free = 0.0;
  for (float hz : {0.5f, 6.0f, 77.7f, 1000.0f, 4000.0f}) {
    plain(device);
    free_at(device, hz);
    device.set_param(p::kRoot, 7.0f);  // ignored in Free
    device.set_param(p::kOctave, 2.0f);
    double measured = 0.0;
    if (hz < 100.0f) {
      const float seconds = hz < 1.0f ? 21.0f : 5.0f;
      const std::vector<float> tone = sine(1000.0f, seconds, kRate, 0.5f);
      const Stereo out = run(device, tone);
      std::vector<float> carrier;
      for (size_t at = 4800; at + 48 <= out.size(); at += 48) {
        double sum = 0.0;
        for (size_t i = at; i < at + 48; ++i) sum += static_cast<double>(out.left[i]) * tone[i];
        carrier.push_back(static_cast<float>(sum));
      }
      measured = crossing_frequency(carrier, 0, carrier.size(), 1000.0);
    } else {
      const Stereo out = run(device, steady(1.5f, kRate, 0.5f));
      measured = crossing_frequency(out.left, 19200, out.size(), kRate);
    }
    worst_free = std::max(worst_free, std::fabs(cents(measured, hz)));
  }
  plain(device);
  free_at(device, 1000.0f);
  device.set_param(p::kFine, 100.0f);
  const Stereo up = run(device, steady(1.5f, kRate, 0.5f));
  const double semitone = cents(crossing_frequency(up.left, 19200, up.size(), kRate), 1000.0);
  std::printf("   Free at 0.5, 6, 77.7, 1000 and 4000 Hz: within %.4f cents; Fine +100 on 1000 Hz reads %+.3f cents\n",
              worst_free, semitone);
  EXPECT(worst_free < 0.5, "Free: the carrier is at Frequency, whatever Root and Octave say");
  EXPECT_NEAR(semitone, 100.0, 0.05, "Free: Fine still moves the carrier");
}

// Second adds a second pair for every partial, at its interval, and the
// power stays the input's.
static void test_second() {
  const size_t from = 24000, to = 72000;
  const double ratios[4] = {1.0, kFifth, 2.0, 0.5};
  for (int second = kOff; second <= kOctaveDown; ++second) {
    plain(device);
    device.set_param(p::kRoot, 9.0f);
    device.set_param(p::kSecond, static_cast<float>(second));
    const Stereo out = run(device, sine(1500.0f, 1.5f, kRate, 0.5f));
    const double first = 0.5 * std::sqrt(0.5) * (second == kOff ? 1.0 : kFirstGain);
    EXPECT_NEAR(tone_level(out.left, 1940.0, kRate, from, to), first, 0.004, "Second: the first pair's sum");
    EXPECT_NEAR(tone_level(out.left, 1060.0, kRate, from, to), first, 0.004, "Second: the first pair's difference");
    EXPECT_NEAR(db(rms(out.left, from, to) / (0.5 * std::sqrt(0.5))), 0.0, 0.1, "Second: the power is the input's");
    if (second == kOff) continue;
    const double c2 = 440.0 * ratios[second];
    const double pair = 0.5 * std::sqrt(0.5) * kSecondGain;
    const double sum = tone_level(out.left, 1500.0 + c2, kRate, from, to);
    const double difference = tone_level(out.left, 1500.0 - c2, kRate, from, to);
    std::printf("%s Second %d: a pair at 1500 +- %.2f Hz, %.4f and %.4f (0.6 of a lone pair is %.4f)\n",
                second == kFifthUp ? "4." : "  ", second, c2, sum, difference, pair);
    EXPECT_NEAR(sum, pair, 0.004, "Second: the second pair's sum is at its interval");
    EXPECT_NEAR(difference, pair, 0.004, "Second: the second pair's difference is at its interval");
  }
  // The fifth is the equal-tempered one: seven semitones, a note of the key.
  EXPECT_NEAR(cents(kFifth, 1.0), 700.0, 0.01, "the fifth is seven equal semitones");
}

// The shapes: each harmonic of the carrier rings the input too, at the
// height its series gives, and no harmonic above a sixth of the sample rate
// is in the tables.
static void test_shapes() {
  const size_t from = 9600;
  // A steady input shows the carrier itself. 100 Hz: every harmonic the
  // tables keep is under the limit.
  for (int wave = kTriangle; wave <= kDiode; ++wave) {
    plain(device);
    free_at(device, bin_hz(68));  // 99.6 Hz, on a bin
    device.set_param(p::kWave, static_cast<float>(wave));
    // The bridge is held to its gate by a small signal.
    const float level = wave == kDiode ? 0.001f : 0.5f;
    const Stereo out = run(device, steady(1.0f, kRate, level));
    const std::vector<double> s = spectrum_of(out.left, from);
    double worst = 0.0;
    for (int n = 1; n <= 31; n += 2) {
      const double ideal = ideal_harmonic(wave - 1, n);
      if (ideal < 1.0e-3) continue;
      worst = std::max(worst, std::fabs(db(at_bin(s, 68 * n) / level / ideal)));
    }
    const double third = db(at_bin(s, 68 * 3) / at_bin(s, 68));
    std::printf("%s shape %d at 100 Hz: harmonics 1 to 31 within %.3f dB of the series; the third is %.1f dB under the first; "
                "power %.3f dB\n",
                wave == kTriangle ? "5." : "  ", wave, worst, third, db(rms(out.left, from, from + kBins) / level));
    EXPECT(worst < 0.1, "a shape's harmonics are those of its series");
    EXPECT_NEAR(db(rms(out.left, from, from + kBins) / level), 0.0, 0.05, "a shape has a root mean square of one");
  }
  plain(device);
  free_at(device, bin_hz(68));
  device.set_param(p::kWave, static_cast<float>(kTriangle));
  const std::vector<double> triangle = spectrum_of(run(device, steady(1.0f, kRate, 0.5f)).left, from);
  EXPECT_NEAR(at_bin(triangle, 68 * 3) / at_bin(triangle, 68), 1.0 / 9.0, 0.002, "Triangle: the third harmonic is a ninth");
  EXPECT_NEAR(at_bin(triangle, 68 * 5) / at_bin(triangle, 68), 1.0 / 25.0, 0.001, "Triangle: the fifth is a twenty-fifth");
  EXPECT(at_bin(triangle, 68 * 2) / at_bin(triangle, 68) < 1.0e-4, "Triangle: no even harmonics");

  // 1000 Hz at 48 kHz: 8 harmonics fit under 8 kHz. The fifth is whole, the
  // seventh is a quarter of the way in (between the cuts at 7 and 11), and
  // there is nothing above.
  for (int wave = kTriangle; wave <= kDiode; ++wave) {
    plain(device);
    free_at(device, 1000.0f);
    device.set_param(p::kWave, static_cast<float>(wave));
    const float level = wave == kDiode ? 0.001f : 0.5f;
    const Stereo out = run(device, steady(1.0f, kRate, level));
    const double first = tone_level(out.left, 1000.0, kRate, from, 48000) / level;
    const double fifth = tone_level(out.left, 5000.0, kRate, from, 48000) / level;
    const double seventh = tone_level(out.left, 7000.0, kRate, from, 48000) / level;
    double above = 0.0;
    for (int n = 9; n <= 23; n += 2) above = std::max(above, tone_level(out.left, 1000.0 * n, kRate, from, 48000) / level);
    if (wave == kSoftSquare) {
      std::printf("   Soft square at 1 kHz: fifth %.4f (series %.4f), seventh %.4f (a quarter of %.4f), the ninth and up %.1f dB "
                  "under the first\n",
                  fifth, ideal_harmonic(1, 5), seventh, ideal_harmonic(1, 7), -db(above / first));
    }
    EXPECT_NEAR(fifth, ideal_harmonic(wave - 1, 5), 0.01 * ideal_harmonic(wave - 1, 5) + 2.0e-4, "the highest harmonic that fits is whole");
    EXPECT_NEAR(seventh, 0.25 * ideal_harmonic(wave - 1, 7), 0.01 * ideal_harmonic(wave - 1, 7) + 2.0e-4,
                "the next harmonic comes in as the carrier falls");
    EXPECT(db(above / first) < -90.0, "no harmonic above a sixth of the sample rate");
  }
}

// Nothing folds: with the input under a third of the sample rate, every
// component of the ringing sound is a sum or a difference with a harmonic
// the tables keep.
static void test_no_folding() {
  const size_t from = 9600;
  double worst = -200.0;
  // Carrier bin, input bin: three carriers each with a low and a high input.
  const int cases[][2] = {{1349, 3413}, {1349, 10007}, {2729, 10007}, {151, 10007}, {151, 941}, {683, 10891}};
  for (int wave = kTriangle; wave <= kDiode; ++wave) {
    for (const auto& one : cases) {
      plain(device);
      free_at(device, bin_hz(one[0]));
      device.set_param(p::kWave, static_cast<float>(wave));
      // The bridge alone is tested loud further down.
      const float level = wave == kDiode ? 0.001f : 0.5f;
      const Stereo out = run(device, sine(bin_hz(one[1]), 1.0f, kRate, level));
      const std::vector<double> s = spectrum_of(out.left, from);
      std::vector<int> expected;
      for (int n = 1; n <= 127; n += 2) {
        expected.push_back(one[1] + n * one[0]);
        expected.push_back(one[1] - n * one[0]);
      }
      const double wet = rms(out.left, from, from + kBins) * std::sqrt(2.0);
      worst = std::max(worst, db(strongest_other(s, expected) / wet));
    }
  }
  // The second carrier an octave up is the highest there is: 8 kHz.
  for (int wave = kSine; wave <= kDiode; ++wave) {
    plain(device);
    free_at(device, bin_hz(2729));
    device.set_param(p::kWave, static_cast<float>(wave));
    device.set_param(p::kSecond, static_cast<float>(kOctaveUp));
    const float level = wave == kDiode ? 0.001f : 0.5f;
    const Stereo out = run(device, sine(bin_hz(10007), 1.0f, kRate, level));
    const std::vector<double> s = spectrum_of(out.left, from);
    const double wet = rms(out.left, from, from + kBins) * std::sqrt(2.0);
    worst = std::max(worst, db(strongest_other(s, {10007 + 2729, 10007 - 2729, 10007 + 5458, 10007 - 5458}) / wet));
  }
  std::printf("6. Triangle, Soft square and the Diode gate, carriers from 221 Hz to 8 kHz, input to 15.9 kHz: the strongest thing "
              "that is not a sum or a difference is %.1f dB under the ringing sound\n",
              worst);
  EXPECT(worst < -80.0, "band-limited shapes: nothing folds for input under a third of the sample rate");
}

// A copy of kit::Drift as Ring drives it: the wander is advanced once every
// control period, by that many samples.
struct Wander {
  float phase[3];
  float increment[3];
  Wander() {
    livemix::kit::Rng rng;
    rng.seed(kDriftSeed);
    for (float& value : phase) value = rng.uniform();
    const float hz = static_cast<float>(kDriftHz);
    increment[0] = hz / kRate;
    increment[1] = hz * 0.6180340f / kRate;
    increment[2] = hz * 1.7320508f / kRate;
  }
  float next() {
    static const float weights[3] = {0.5f, 0.3f, 0.2f};
    float sum = 0.0f;
    for (int i = 0; i < 3; ++i) {
      sum += weights[i] * livemix::kit::SineTable::lookup(phase[i]);
      phase[i] += increment[i] * static_cast<float>(kControlPeriod);
      phase[i] -= std::floor(phase[i]);
    }
    return sum;
  }
};

// The carrier's pitch against A5 in windows of 50 ms, in cents.
static std::vector<double> pitch_track(const std::vector<float>& x, size_t from) {
  std::vector<double> track;
  const size_t window = 2400;
  for (size_t at = from; at + window <= x.size(); at += window) {
    track.push_back(cents(crossing_frequency(x, at, at + window, kRate), 880.0));
  }
  return track;
}

// Drift moves the carrier by up to ±50 cents at the top and by the square
// of the control below it, on the wander's own course, whatever is played.
static void test_drift() {
  const float seconds = 40.0f;
  const size_t from = 2400;
  // The course the wander takes, averaged over the same windows.
  std::vector<double> course;
  {
    Wander wander;
    const size_t ticks_per_window = 2400 / kControlPeriod;
    const size_t windows = static_cast<size_t>(seconds * kRate) / 2400;
    for (size_t w = 0; w < windows; ++w) {
      double sum = 0.0;
      for (size_t t = 0; t < ticks_per_window; ++t) sum += wander.next();
      if (w >= from / 2400) course.push_back(sum / ticks_per_window);
    }
  }
  double course_low = 1.0, course_high = -1.0;
  for (double value : course) {
    course_low = std::min(course_low, value);
    course_high = std::max(course_high, value);
  }

  for (float drift : {1.0f, 0.5f, 0.0f}) {
    plain(device);
    device.set_param(p::kRoot, 9.0f);
    device.set_param(p::kOctave, 5.0f);  // A5, 880 Hz: 44 cycles a window
    device.set_param(p::kDrift, drift);
    const Stereo out = run(device, steady(seconds, kRate, 0.5f));
    const std::vector<double> track = pitch_track(out.left, from);
    const double depth = kDriftCents * drift * drift;
    double worst = 0.0, low = 1.0e9, high = -1.0e9;
    for (size_t w = 0; w < track.size() && w < course.size(); ++w) {
      worst = std::max(worst, std::fabs(track[w] - depth * course[w]));
      low = std::min(low, track[w]);
      high = std::max(high, track[w]);
    }
    std::printf("%s Drift %.1f over 40 s: the carrier goes from %+.2f to %+.2f cents (the wander from %+.2f to %+.2f of %.1f), "
                "within %.3f cents of its course\n",
                drift == 1.0f ? "7." : "  ", drift, low, high, course_low, course_high, depth, worst);
    EXPECT(worst < 0.25, "Drift moves the carrier along the wander, by the square of the control times 50 cents");
    if (drift == 1.0f) {
      EXPECT(high > 35.0 && low < -35.0 && high <= 50.0 && low >= -50.0, "Drift 1 swings most of the way to 50 cents either side");
    }
    if (drift == 0.0f) EXPECT(high - low < 0.02, "Drift 0 is a steady carrier");
  }

  // It runs free: bursts with gaps in them leave the wander on the same
  // course, read where the bursts sound.
  plain(device);
  device.set_param(p::kRoot, 9.0f);
  device.set_param(p::kOctave, 5.0f);
  device.set_param(p::kDrift, 1.0f);
  std::vector<float> bursts = steady(seconds, kRate, 0.5f);
  for (size_t i = 0; i < bursts.size(); ++i) {
    if ((i / 2400) % 4 == 3) bursts[i] = 0.0f;  // 150 ms on, 50 ms off
  }
  const Stereo gated = run(device, bursts);
  double worst = 0.0;
  for (size_t w = 0; w < course.size(); ++w) {
    const size_t at = from + w * 2400;
    if ((at / 2400) % 4 != 1) continue;  // the middle window of each burst
    worst = std::max(worst, std::fabs(cents(crossing_frequency(gated.left, at, at + 2400, kRate), 880.0) -
                                      kDriftCents * course[w]));
  }
  std::printf("   bursts with gaps: the drift is within %.3f cents of the same course\n", worst);
  EXPECT(worst < 0.25, "the drift runs free: what is played does not move it");
}

// The carrier runs free too: its phase in every burst is the one a carrier
// that never stopped would have.
static void test_carrier_runs_free() {
  plain(device);
  free_at(device, 1000.0f);
  std::vector<float> bursts = steady(2.0f, kRate, 0.5f);
  for (size_t i = 0; i < bursts.size(); ++i) {
    if ((i / 2400) % 4 == 3) bursts[i] = 0.0f;
  }
  const Stereo out = run(device, bursts);
  const double start = tone_phase(out.left, 1000.0, kRate, 2400, 4800);
  double worst = 0.0;
  for (size_t burst = 1; burst < 10; ++burst) {
    const size_t at = burst * 9600 + 2400;
    double turn = tone_phase(out.left, 1000.0, kRate, at, at + 2400) - start;
    turn -= 2.0 * kPi * std::round(turn / (2.0 * kPi));
    worst = std::max(worst, std::fabs(turn));
  }
  std::printf("8. a 1 kHz carrier over ten bursts: its phase stays within %.4f rad of one that never stopped\n", worst);
  EXPECT(worst < 0.01, "the carrier's phase is never reset by the sound");

  // A silence longer than the hold stops the clock: the carrier is then
  // behind one that never stopped by the time it rested, and by no more.
  plain(device);
  free_at(device, 1000.5f);
  const size_t on = 7200, off = 24000;  // 150 ms of sound, 500 ms of silence
  std::vector<float> phrases;
  for (int k = 0; k < 6; ++k) {
    phrases.insert(phrases.end(), on, 0.5f);
    phrases.insert(phrases.end(), off, 0.0f);
  }
  const Stereo rested = run(device, phrases);
  const double begin = tone_phase(rested.left, 1000.5, kRate, 2400, 4800);
  const double rest_seconds = static_cast<double>(off) / kRate - kHoldSeconds;
  double worst_rested = 0.0;
  for (size_t k = 1; k < 6; ++k) {
    const size_t at = k * (on + off) + 2400;
    double turn = tone_phase(rested.left, 1000.5, kRate, at, at + 2400) - begin +
                  2.0 * kPi * 1000.5 * rest_seconds * static_cast<double>(k);
    turn -= 2.0 * kPi * std::round(turn / (2.0 * kPi));
    worst_rested = std::max(worst_rested, std::fabs(turn));
  }
  std::printf("   over five rests of 0.2 s each: within %.4f rad of a carrier that stood still for exactly those\n", worst_rested);
  EXPECT(worst_rested < 0.01, "a rest stops the carrier where it stands; it is not started again");
}

// Noise with most of its power under 3 kHz, so what it rings to stays under
// the top of the filters.
static std::vector<float> soft_noise(float seconds, float level, uint32_t seed) {
  rng_state() = seed;
  std::vector<float> out = noise(seconds, kRate, 1.0f);
  double a = 0.0, b = 0.0;
  const double pole = std::exp(-2.0 * kPi * 1500.0 / kRate);
  for (float& v : out) {
    a = v + (a - v) * pole;
    b = a + (b - a) * pole;
    v = static_cast<float>(b);
  }
  const double scale = level / rms(out);
  for (float& v : out) v = static_cast<float>(v * scale);
  return out;
}

// The ringing sound is as loud as what went in, whatever the shape and with
// one carrier or two; at the defaults the output is within a dB of the input.
static void test_level() {
  const std::vector<float> input = soft_noise(4.0f, 0.2f, 0xA11CEu);
  const double in_level = rms(input, 9600);
  double worst = 0.0;
  for (int wave = kSine; wave <= kDiode; ++wave) {
    for (int second = kOff; second <= kOctaveDown; ++second) {
      plain(device);
      device.set_param(p::kOctave, 3.0f);
      device.set_param(p::kWave, static_cast<float>(wave));
      device.set_param(p::kSecond, static_cast<float>(second));
      // The bridge is as loud as the others for a quiet signal.
      const double quiet = wave == kDiode ? 0.01 : 1.0;
      std::vector<float> scaled = input;
      for (float& v : scaled) v = static_cast<float>(v * quiet);
      const Stereo out = run(device, scaled);
      worst = std::max(worst, std::fabs(db(rms(out.left, 9600) / (in_level * quiet))));
    }
  }
  device.init(kRate);
  const Stereo defaults = run(device, input);
  const double at_defaults = db(rms(defaults.left, 9600) / in_level);
  std::printf("9. noise through every shape, with and without a second carrier: the ringing sound is within %.2f dB of the input; "
              "at the defaults the output is %+.2f dB\n",
              worst, at_defaults);
  EXPECT(worst < 0.4, "the ringing sound has the power of the input for every shape and second carrier");
  EXPECT(std::fabs(at_defaults) < 1.0, "at the defaults the output is as loud as the input");
}

// Width: 0 is both sides alike, 1 is the two carriers a quarter cycle apart.
static void test_width() {
  const std::vector<float> input = soft_noise(3.0f, 0.2f, 0xB0B0u);
  double corr[2];
  for (int wide = 0; wide < 2; ++wide) {
    plain(device);
    device.set_param(p::kRoot, 9.0f);
    device.set_param(p::kWidth, static_cast<float>(wide));
    const Stereo out = run(device, input);
    corr[wide] = correlation(out.left, out.right, 9600);
    if (wide == 0) EXPECT(out.left == out.right, "Width 0: the two sides are the same samples");
  }
  // A tone: the right side's pair is the left's with the carrier a quarter
  // cycle on, so the mono sum is one pair, 3 dB over a side and not 6.
  plain(device);
  device.set_param(p::kRoot, 9.0f);
  device.set_param(p::kWidth, 1.0f);
  const Stereo tone = run(device, sine(1000.0f, 1.5f, kRate, 0.5f));
  std::vector<float> mono(tone.size());
  for (size_t i = 0; i < mono.size(); ++i) mono[i] = tone.left[i] + tone.right[i];
  const size_t from = 24000, to = 72000;
  const double side = tone_level(tone.left, 1440.0, kRate, from, to);
  const double other_side = tone_level(tone.right, 1440.0, kRate, from, to);
  const double summed = tone_level(mono, 1440.0, kRate, from, to);
  double turn = tone_phase(tone.right, 1440.0, kRate, from, to) - tone_phase(tone.left, 1440.0, kRate, from, to);
  turn -= 2.0 * kPi * std::round(turn / (2.0 * kPi));

  // A slow carrier moves the sound across: the two sides swell a quarter
  // cycle apart and their powers sum to a constant.
  plain(device);
  free_at(device, 2.0f);
  device.set_param(p::kWidth, 1.0f);
  const Stereo slow = run(device, sine(1000.0f, 3.0f, kRate, 0.5f));
  double low_sum = 1.0e9, high_sum = 0.0, low_left = 1.0e9, high_left = 0.0;
  for (size_t at = 24000; at + 480 <= slow.size(); at += 480) {
    const double l = rms(slow.left, at, at + 480), r = rms(slow.right, at, at + 480);
    low_sum = std::min(low_sum, l * l + r * r);
    high_sum = std::max(high_sum, l * l + r * r);
    low_left = std::min(low_left, l);
    high_left = std::max(high_left, l);
  }
  std::printf("10. Width 0: correlation %.4f; Width 1: %.4f on noise, the right pair %.4f rad on from the left, the mono sum %.3f dB "
              "over a side; at 2 Hz the left side swings %.1f dB while the two together move %.2f dB\n",
              corr[0], corr[1], turn, db(summed / side), db(high_left / low_left), 10.0 * std::log10(high_sum / low_sum));
  EXPECT(corr[0] > 0.9999, "Width 0: the sides are fully alike");
  EXPECT(std::fabs(corr[1]) < 0.05, "Width 1: the sides are in quadrature (no correlation)");
  EXPECT_NEAR(std::fabs(turn), kPi / 2.0, 0.01, "Width 1: the right carrier is a quarter cycle from the left");
  EXPECT_NEAR(other_side, side, 0.002, "Width 1: both sides are as loud");
  EXPECT_NEAR(db(summed / side), 3.01, 0.05, "Width 1: summed to mono the pair is still there, 3 dB over a side");
  EXPECT(db(high_left / low_left) > 20.0, "Width 1 at 2 Hz: each side swells and falls");
  EXPECT(10.0 * std::log10(high_sum / low_sum) < 0.3, "Width 1 at 2 Hz: the two sides together keep their power");
}

// What a second-order Butterworth filter by the bilinear transform leaves of
// a frequency (kit::Svf at Q 1/sqrt 2).
static double butterworth(double hz, double cut, bool high) {
  const double r = std::tan(kPi * hz / kRate) / std::tan(kPi * cut / kRate);
  return (high ? r * r : 1.0) / std::sqrt(1.0 + r * r * r * r);
}

// Tone and Low Cut work on the ringing sound alone.
static void test_filters() {
  const size_t from = 24000, to = 72000;
  const double pair = 0.5 * std::sqrt(0.5);
  plain(device);
  device.set_param(p::kRoot, 9.0f);
  device.set_param(p::kTone, 1000.0f);
  const Stereo dark = run(device, sine(3000.0f, 1.5f, kRate, 0.5f));
  const double sum = tone_level(dark.left, 3440.0, kRate, from, to) / pair;
  const double difference = tone_level(dark.left, 2560.0, kRate, from, to) / pair;
  std::printf("11. Tone 1 kHz: the pair of 3 kHz through A4 is at %.2f and %.2f dB (a second-order low pass: %.2f and %.2f)\n",
              db(sum), db(difference), db(butterworth(3440.0, 1000.0, false)), db(butterworth(2560.0, 1000.0, false)));
  EXPECT_NEAR(db(sum), db(butterworth(3440.0, 1000.0, false)), 0.1, "Tone: the sum tone is cut as a second-order low pass cuts it");
  EXPECT_NEAR(db(difference), db(butterworth(2560.0, 1000.0, false)), 0.1, "Tone: the difference tone likewise");

  plain(device);
  device.set_param(p::kRoot, 9.0f);
  device.set_param(p::kLowCut, 600.0f);
  const Stereo thin = run(device, sine(500.0f, 1.5f, kRate, 0.5f));
  const double low = tone_level(thin.left, 60.0, kRate, from, to) / pair;
  const double high = tone_level(thin.left, 940.0, kRate, from, to) / pair;
  std::printf("    Low Cut 600 Hz: the pair of 500 Hz through A4 is at %.2f dB (60 Hz) and %.2f dB (940 Hz) (a second-order high "
              "pass: %.2f and %.2f)\n",
              db(low), db(high), db(butterworth(60.0, 600.0, true)), db(butterworth(940.0, 600.0, true)));
  EXPECT_NEAR(db(low), db(butterworth(60.0, 600.0, true)), 0.15, "Low Cut: the difference tone is cut as a second-order high pass cuts it");
  EXPECT_NEAR(db(high), db(butterworth(940.0, 600.0, true)), 0.1, "Low Cut: the sum tone likewise");

  // The dry sound goes round both.
  plain(device);
  device.set_param(p::kRoot, 9.0f);
  device.set_param(p::kTone, 300.0f);
  device.set_param(p::kLowCut, 2000.0f);
  device.set_param(p::kMix, 0.5f);
  const Stereo half = run(device, sine(3000.0f, 1.5f, kRate, 0.5f));
  EXPECT_NEAR(tone_level(half.left, 3000.0, kRate, from, to), 0.5 * std::cos(kPi / 4.0), 0.002,
              "the dry sound is not filtered, and Mix one half is equal power");

  // A note at the carrier's own pitch: the difference tone is at 0 Hz, and
  // even the lowest Low Cut leaves no offset.
  plain(device);
  device.set_param(p::kRoot, 9.0f);
  const Stereo unison = run(device, sine(440.0f, 2.0f, kRate, 0.5f));
  const double offset = mean(unison.left, 48000, 96000);
  // What the product alone would leave: cos of the phase between the two.
  std::printf("    A4 through A4: an offset of %.6f is left (the octave above is at %.4f)\n", offset,
              tone_level(unison.left, 880.0, kRate, 48000, 96000));
  EXPECT(std::fabs(offset) < 1.0e-4, "a note at the carrier's pitch leaves no offset");
  EXPECT_NEAR(tone_level(unison.left, 880.0, kRate, 48000, 96000), pair, 0.004, "and its sum tone is the octave");
}

// The bridge: nothing but the gate for a quiet signal, and for a loud one
// the level gives, odd harmonics of the signal come through, and the folding
// stays under a bound. No carrier ever comes out by itself.
static void test_diode() {
  const size_t from = 9600;
  const int carrier = 179, input = 683;  // 262 Hz and 1000 Hz, on bins
  double level_at[2], third_at[2];
  const float levels[2] = {0.01f, 0.9f};
  for (int loud = 0; loud < 2; ++loud) {
    plain(device);
    free_at(device, bin_hz(carrier));
    device.set_param(p::kWave, static_cast<float>(kDiode));
    const Stereo out = run(device, sine(bin_hz(input), 1.0f, kRate, levels[loud]));
    const std::vector<double> s = spectrum_of(out.left, from);
    level_at[loud] = db(rms(out.left, from, from + kBins) / (levels[loud] * std::sqrt(0.5)));
    third_at[loud] = db(at_bin(s, 3 * input - carrier) / at_bin(s, input - carrier));
  }
  std::printf("12. Diode, 1 kHz through 262 Hz: at -40 dBFS the level is %+.2f dB and the signal's third harmonic's pair %.1f dB under "
              "the first; at -1 dBFS %+.2f dB and %.1f dB\n",
              level_at[0], third_at[0], level_at[1], third_at[1]);
  EXPECT(std::fabs(level_at[0]) < 0.1 && third_at[0] < -80.0, "Diode: a quiet signal meets the gate alone");
  EXPECT(level_at[1] < -1.5 && level_at[1] > -6.0, "Diode: a loud signal is held back a few dB");
  EXPECT(third_at[1] > -40.0 && third_at[1] < -15.0, "Diode: a loud signal's odd harmonics ring too");

  // What still folds, loud: everything that is not m·f ± n·c for odd m and n.
  double worst[2] = {-200.0, -200.0};
  const int carriers[] = {89, 179, 271, 359, 541, 797, 1021, 2053, 2729};
  const int inputs[] = {683, 3413, 8191};
  const float loudness[2] = {0.3f, 0.9f};
  for (int loud = 0; loud < 2; ++loud) {
    for (int c : carriers) {
      for (int f : inputs) {
        plain(device);
        free_at(device, bin_hz(c));
        device.set_param(p::kWave, static_cast<float>(kDiode));
        const Stereo out = run(device, sine(bin_hz(f), 1.0f, kRate, loudness[loud]));
        const std::vector<double> s = spectrum_of(out.left, from);
        std::vector<int> expected;
        for (int m = 1; m <= 15; m += 2) {
          for (int n = 1; n <= 127; n += 2) {
            expected.push_back(m * f + n * c);
            expected.push_back(m * f - n * c);
          }
        }
        double strongest = 0.0;
        for (double v : s) strongest = std::max(strongest, v);
        worst[loud] = std::max(worst[loud], db(strongest_other(s, expected) / strongest));
      }
    }
  }
  std::printf("    Diode, carriers 130 Hz to 4 kHz, a sine at 1, 5 and 12 kHz: what folds is %.1f dB under the strongest partial at "
              "-10 dBFS and %.1f dB at -1 dBFS\n",
              worst[0], worst[1]);
  EXPECT(worst[0] < -65.0, "Diode at -10 dBFS: what folds is 65 dB down");
  EXPECT(worst[1] < -55.0, "Diode at full scale: what folds is 55 dB down");

  // Above 1.6 kHz the bridge is its gate alone: loud is quiet, scaled.
  plain(device);
  free_at(device, 2000.0f);
  device.set_param(p::kWave, static_cast<float>(kDiode));
  const Stereo big = run(device, sine(700.0f, 0.5f, kRate, 0.9f));
  plain(device);
  free_at(device, 2000.0f);
  device.set_param(p::kWave, static_cast<float>(kDiode));
  const Stereo small = run(device, sine(700.0f, 0.5f, kRate, 0.009f));
  double apart = 0.0;
  for (size_t i = 0; i < big.size(); ++i) apart = std::max(apart, std::fabs(big.left[i] - 100.0 * small.left[i]));
  EXPECT(apart < 1.0e-4, "Diode: with the carrier above 1.6 kHz the bridge is linear in the signal");

  // No carrier without a signal: a silent side stays silent to the bit.
  plain(device);
  device.set_param(p::kWave, static_cast<float>(kDiode));
  device.set_param(p::kSecond, static_cast<float>(kFifthUp));
  device.set_param(p::kWidth, 1.0f);
  const Stereo one_side = run(device, sine(700.0f, 0.5f, kRate, 0.9f), silence(0.5f, kRate));
  EXPECT(peak(one_side.right) == 0.0 && rms(one_side.left) > 0.1, "no carrier comes out of a side with no signal");
}

// Mix 0 is the input, sample for sample, whatever else is set.
static void test_mix() {
  device.init(kRate);
  device.set_param(p::kMix, 0.0f);
  device.set_param(p::kWave, static_cast<float>(kDiode));
  device.set_param(p::kSecond, static_cast<float>(kOctaveDown));
  device.set_param(p::kDrift, 1.0f);
  device.set_param(p::kWidth, 1.0f);
  rng_state() = 0x51DEu;
  const std::vector<float> left = noise(1.0f, kRate, 0.7f);
  const std::vector<float> right = sine(311.0f, 1.0f, kRate, 0.9f);
  const Stereo out = run(device, left, right);
  std::printf("13. Mix 0: the output is the input, sample for sample: %s\n",
              out.left == left && out.right == right ? "yes" : "NO");
  EXPECT(out.left == left && out.right == right, "Mix 0 is the input, sample for sample");
  // Moved there while sounding it gets there and stays.
  device.set_param(p::kMix, 1.0f);
  run(device, left, right);
  device.set_param(p::kMix, 0.0f);
  run(device, left, right);
  const Stereo back = run(device, left, right);
  EXPECT(back.left == left && back.right == right, "Mix moved back to 0 while sounding is the input again");
}

// Nothing arrives at once: every choice and the knobs most likely to be
// moved while sounding, each against the same passage without the move.
static void test_clicks() {
  std::vector<float> input = sine(220.0f, 1.0f, kRate, 0.3f);
  const std::vector<float> upper = sine(331.0f, 1.0f, kRate, 0.2f);
  for (size_t i = 0; i < input.size(); ++i) input[i] += upper[i];
  struct Move {
    const char* name;
    int param;
    float from, to;
    bool free;
  };
  const Move moves[] = {
      {"Wave Sine to Triangle", p::kWave, 0, 1, false},     {"Wave Triangle to Soft square", p::kWave, 1, 2, false},
      {"Wave Soft square to Diode", p::kWave, 2, 3, false}, {"Wave Diode to Sine", p::kWave, 3, 0, false},
      {"Second Off to Fifth", p::kSecond, 0, 1, false},     {"Second Fifth to Octave", p::kSecond, 1, 2, false},
      {"Second Octave to Octave below", p::kSecond, 2, 3, false},
      {"Second Octave below to Off", p::kSecond, 3, 0, false},
      {"Tune Note to Free", p::kTune, 0, 1, false},         {"Tune Free to Note", p::kTune, 1, 0, false},
      {"Root C to G", p::kRoot, 0, 7, false},               {"Octave 4 to 7", p::kOctave, 4, 7, false},
      {"Octave 4 to 0", p::kOctave, 4, 0, false},           {"Fine -100 to 100", p::kFine, -100, 100, false},
      {"Frequency 6 to 4000", p::kFrequency, 6, 4000, true},
      {"Drift 0 to 1", p::kDrift, 0, 1, false},             {"Low Cut 20 to 2000", p::kLowCut, 20, 2000, false},
      {"Tone 16000 to 300", p::kTone, 16000, 300, false},   {"Width 0 to 1", p::kWidth, 0, 1, false},
      {"Mix 0 to 1", p::kMix, 0, 1, false},                 {"Mix 1 to 0", p::kMix, 1, 0, false},
  };
  double worst = 0.0;
  const char* worst_name = "";
  for (const Move& move : moves) {
    const double sudden = suddenness(
        [&](Ring& d) {
          d.init(kRate);
          d.set_param(p::kMix, 1.0f);
          if (move.free) d.set_param(p::kTune, 1.0f);
          d.set_param(move.param, move.from);
        },
        [&](Ring& d) { d.set_param(move.param, move.to); }, input);
    if (sudden > worst) {
      worst = sudden;
      worst_name = move.name;
    }
    char label[120];
    std::snprintf(label, sizeof label, "%s arrives gradually (%.3f of it in 8 samples)", move.name, sudden);
    EXPECT(sudden < 0.15, label);
  }
  std::printf("14. 21 moves while sounding (every choice, the pitch, the filters, Width, Mix): at most %.3f of a change is there "
              "after 8 samples (%s)\n",
              worst, worst_name);

  // And under a pure tone a sweep of the pitch never steps more than the
  // steepest thing it makes: the sum tone at its highest.
  plain(device);
  Stereo swept;
  const std::vector<float> tone = sine(110.0f, 2.0f, kRate, 0.25f);
  const size_t chunk = 4800;
  for (size_t at = 0; at < tone.size(); at += chunk) {
    device.set_param(p::kOctave, (at / chunk) % 2 ? 6.0f : 2.0f);
    swept = concat(swept, run(device, std::vector<float>(tone.begin() + at, tone.begin() + at + chunk)));
  }
  const double steepest = 0.25 * std::sqrt(2.0) * 2.0 * kPi * (1046.5 + 110.0) / kRate;
  EXPECT(max_step(swept.left) < steepest * 1.1, "Octave jumps glide: no step steeper than the sum tone's own slope");
}

// A phrase that starts part of the way into a block, a silence, the phrase
// again: the same samples at every block size, with the silence stepped
// across the hold, and a knob moved in it.
static void test_silence_and_block_size() {
  const std::vector<float> note = sine(196.0f, 0.3f, kRate, 0.4f);
  int runs = 0;
  bool same = true, slept = true;
  for (double gap : {0.26, 0.27, 0.28, 0.29, 0.30, 0.31, 0.32, 0.33, 0.34, 0.36, 1.0}) {
    std::vector<float> in(1031, 0.0f);
    in.insert(in.end(), note.begin(), note.end());
    const size_t silence_from = in.size();
    in.insert(in.end(), static_cast<size_t>(gap * kRate), 0.0f);
    const size_t move_at = in.size() - 240;  // 5 ms before the phrase returns
    in.insert(in.end(), note.begin(), note.end());
    in.insert(in.end(), 4800, 0.0f);
    Stereo reference;
    for (int block : {128, 1, 100, 2048, 0}) {
      device.init(kRate);
      device.set_param(p::kWave, static_cast<float>(kDiode));
      device.set_param(p::kSecond, static_cast<float>(kFifthUp));
      device.set_param(p::kDrift, 1.0f);
      device.set_param(p::kWidth, 1.0f);
      Stereo out;
      out.left.resize(in.size());
      out.right.resize(in.size());
      const int ragged[] = {1, 7, 64, 128, 33, 512, 2048, 5};
      size_t done = 0;
      int which = 0;
      bool moved = false;
      while (done < in.size()) {
        size_t frames = block > 0 ? static_cast<size_t>(block) : static_cast<size_t>(ragged[which++ % 8]);
        frames = std::min(frames, in.size() - done);
        // The knobs move at the same sample in every render.
        if (!moved && done < move_at) frames = std::min(frames, move_at - done);
        if (!moved && done == move_at) {
          device.set_param(p::kMix, 0.9f);
          device.set_param(p::kOctave, 5.0f);
          device.set_param(p::kTone, 2000.0f);
          device.set_param(p::kWave, static_cast<float>(kSoftSquare));
          moved = true;
        }
        for (size_t i = 0; i < frames; ++i) {
          device.in_left()[i] = in[done + i];
          device.in_right()[i] = in[done + i];
        }
        device.process(static_cast<int>(frames));
        for (size_t i = 0; i < frames; ++i) {
          out.left[done + i] = device.out_left()[i];
          out.right[done + i] = device.out_right()[i];
        }
        done += frames;
      }
      ++runs;
      if (block == 128) {
        reference = out;
        const size_t rest_from = silence_from + static_cast<size_t>(kHoldSeconds * kRate);
        if (rest_from < move_at) slept = slept && peak(out.left, rest_from, move_at + 240) == 0.0;
      } else {
        same = same && out.left == reference.left && out.right == reference.right;
      }
    }
  }
  std::printf("15. a phrase, a silence of 0.26 to 1 s with four knobs moved in it, the phrase again, at blocks of 1, 100, 128, 2048 "
              "and ragged: %d renders, %s\n",
              runs, same ? "the same samples" : "NOT the same samples");
  EXPECT(same, "a phrase after a silence gives the same samples at every block size");
  EXPECT(slept, "the output is exact zero from the end of the hold");
}

// A knob moved in the rest has arrived when the sound returns: the phrase
// after it is the one a device set that way from the start plays.
static void test_knobs_in_the_rest() {
  const std::vector<float> burst = sine(330.0f, 0.5f, kRate, 0.4f);
  const std::vector<float> phrase = sine(196.0f, 0.5f, kRate, 0.4f);
  struct Move {
    const char* name;
    int param;
    float to;
  };
  const Move moves[] = {{"Mix", p::kMix, 1.0f},        {"Width", p::kWidth, 1.0f},     {"Tone", p::kTone, 400.0f},
                        {"Low Cut", p::kLowCut, 1500.0f}, {"Wave", p::kWave, 3.0f}};
  bool all = true;
  for (const Move& move : moves) {
    // Moved while it rests, after a block of an odd size has put it off the
    // beat of its control clock.
    device.init(kRate);
    run(device, burst);
    for (int i = 0; i < 13; ++i) device.in_left()[i] = device.in_right()[i] = 0.3f;
    device.process(13);
    render(device, 1.0f, kRate);
    device.set_param(move.param, move.to);
    const Stereo moved = run(device, phrase);
    // There from the start.
    other.init(kRate);
    other.set_param(move.param, move.to);
    run(other, burst);
    for (int i = 0; i < 13; ++i) other.in_left()[i] = other.in_right()[i] = 0.3f;
    other.process(13);
    render(other, 1.0f, kRate);
    const Stereo set = run(other, phrase);
    const bool same = moved.left == set.left && moved.right == set.right;
    all = all && same;
    char label[120];
    std::snprintf(label, sizeof label, "%s moved in the rest has arrived when the sound returns", move.name);
    EXPECT(same, label);
  }
  // The pitch: the carrier is at the new note from its first cycle. (A
  // 20 ms glide from C4 would average far under C6 over the first 10 ms.)
  plain(device);
  run(device, burst);
  render(device, 1.0f, kRate);
  device.set_param(p::kOctave, 6.0f);
  const Stereo jumped = run(device, steady(0.1f, kRate, 0.5f));
  const double first = cents(crossing_frequency(jumped.left, 0, 480, kRate), 1046.502);
  plain(device);
  device.set_param(p::kOctave, 6.0f);
  run(device, burst);
  device.set_param(p::kOctave, 4.0f);
  run(device, burst);
  device.set_param(p::kOctave, 6.0f);
  const Stereo glided = run(device, steady(0.1f, kRate, 0.5f));
  const double gliding = cents(crossing_frequency(glided.left, 0, 480, kRate), 1046.502);
  std::printf("16. knobs moved in the rest: Mix, Width, Tone, Low Cut and Wave give %s as a device set that way from the start; "
              "Octave 4 to 6 reads %+.2f cents from C6 in its first 10 ms (moved while sounding: %+.0f cents)\n",
              all ? "the same samples" : "OTHER samples", first, gliding);
  EXPECT(std::fabs(first) < 2.0, "the pitch moved in the rest is there from the first cycle");
  EXPECT(gliding < -100.0, "and the same move while sounding is a glide");
}

// A NaN, an infinity or an absurd sample is taken as silence: the output is
// what the same input with a zero there gives, to the bit.
static void test_bad_input() {
  std::vector<float> clean = sine(330.0f, 1.0f, kRate, 0.5f);
  clean[1000] = 0.0f;
  clean[2000] = 0.0f;
  clean[3000] = 0.0f;
  clean[3001] = 0.0f;
  std::vector<float> bad = clean;
  bad[1000] = std::nanf("");
  bad[2000] = 1.0e30f;
  bad[3000] = -HUGE_VALF;
  bad[3001] = HUGE_VALF;
  device.init(kRate);
  device.set_param(p::kWave, static_cast<float>(kDiode));
  const Stereo out = run(device, bad);
  const Stereo tail = render(device, 1.0f, kRate);
  const Stereo next = run(device, clean);
  other.init(kRate);
  other.set_param(p::kWave, static_cast<float>(kDiode));
  const Stereo out_clean = run(other, clean);
  render(other, 1.0f, kRate);
  const Stereo next_clean = run(other, clean);
  const bool same = out.left == out_clean.left && out.right == out_clean.right && next.left == next_clean.left;
  std::printf("17. a NaN, 1e30 and both infinities in the input: the output is finite, peaks at %.2f, and is %s as with zeros in "
              "their place; exact silence 0.3 s after\n",
              std::max(peak(out.left), peak(out.right)), same ? "the same samples" : "NOT the same");
  EXPECT(finite(out.left) && finite(out.right) && finite(tail.left), "a bad input sample: the output stays finite");
  EXPECT(same, "a bad input sample is taken as silence and leaves nothing behind");
  EXPECT(peak(tail.left, 14400) == 0.0 && peak(tail.right, 14400) == 0.0, "a bad input sample: it still rests afterwards");
  // Bad on one side only, at Mix 0: the good side is still the input.
  device.init(kRate);
  device.set_param(p::kMix, 0.0f);
  const Stereo dry = run(device, clean, bad);
  EXPECT(dry.left == clean && finite(dry.right), "Mix 0 with a bad sample on the other side");
}

// It rests 0.3 s after the input stops, to the sample, wakes on the first
// sample that sounds, and its reading is the carrier.
static void test_rest_and_meter() {
  device.init(kRate);
  device.set_param(p::kRoot, 9.0f);
  EXPECT_NEAR(device.meter(0), 440.0, 0.001, "at rest the reading is the note");
  rng_state() = 0xFEEDu;
  run(device, noise(0.5f, kRate, 0.5f));
  const double running = device.meter(0);
  const Stereo tail = render(device, 1.0f, kRate);
  const size_t hold = static_cast<size_t>(kHoldSeconds * kRate);
  size_t last = 0;
  for (size_t i = 0; i < tail.size(); ++i) {
    if (tail.left[i] != 0.0f || tail.right[i] != 0.0f) last = i;
  }
  const Stereo woken = run(device, sine(330.0f, 0.5f, kRate, 0.5f));
  std::printf("18. after a burst the last sample that is not zero is %zu samples into the silence (the hold is %zu); while it ran "
              "the reading was %.2f Hz (%+.1f cents from A4)\n",
              last, hold, running, cents(running, 440.0));
  EXPECT(last < hold, "exact zero from the sample that ends the hold");
  EXPECT(peak(tail.left, 0, 2400) > 1.0e-5, "the filters ring out before it");
  EXPECT(woken.left[1] != 0.0f && rms(woken.left) > 0.1, "wakes on the first sample that sounds");
  EXPECT(std::fabs(cents(running, 440.0)) <= kDriftCents * 0.25 * 0.25 + 0.01 && running != 440.0,
         "running, the reading is the carrier with its drift");
  EXPECT_NEAR(device.meter(1), 0.0, 0.0, "an unknown reading is zero");
}

int main() {
  Conformance spec;
  spec.name = "ring";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 1.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  test_sum_and_difference();
  test_carrier_is_the_note();
  test_fine_and_free();
  test_second();
  test_shapes();
  test_no_folding();
  test_drift();
  test_carrier_runs_free();
  test_level();
  test_width();
  test_filters();
  test_diode();
  test_mix();
  test_clicks();
  test_silence_and_block_size();
  test_knobs_in_the_rest();
  test_bad_input();
  test_rest_and_meter();

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("ring", 10.0f, kRate, [&] { run(device, input); });
  // The dearest setting: the bridge with its lean, two carriers low enough
  // to read two tables each, the two sides apart.
  device.init(kRate);
  device.set_param(p::kWave, static_cast<float>(kDiode));
  device.set_param(p::kSecond, static_cast<float>(kFifthUp));
  device.set_param(p::kOctave, 2.0f);
  device.set_param(p::kDrift, 1.0f);
  device.set_param(p::kWidth, 1.0f);
  device.set_param(p::kMix, 1.0f);
  report_cost("ring at its dearest (Diode, Second, C2)", 10.0f, kRate, [&] { run(device, input); });
  return finish("ring");
}
