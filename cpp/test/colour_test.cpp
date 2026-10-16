// Native checks of cpp/kit/colour.h: the generator whose streams are
// independent, and the filter that colours white noise from white through
// pink to brown at one level and at any sample rate. Proved here once, so a
// device harness asserts what its device does with the noise and not the
// noise itself. Compiled with the system C++ compiler by
// scripts/test-native.sh.

#include "../kit/kit.h"
#include "../kit/colour.h"

#include "support/test_kit.h"

using namespace livemix;
using namespace testkit;

namespace {

const double kRates[3] = {44100.0, 48000.0, 96000.0};

// --- the generator -----------------------------------------------------------------------------

// The largest correlation of a with b over lags of -reach to reach samples.
double worst_correlation(const std::vector<float>& a, const std::vector<float>& b, int reach) {
  const size_t n = a.size() - 2 * static_cast<size_t>(reach);
  double saa = 0.0, sbb = 0.0;
  for (size_t i = 0; i < n; ++i) {
    saa += static_cast<double>(a[i + reach]) * a[i + reach];
    sbb += static_cast<double>(b[i + reach]) * b[i + reach];
  }
  double worst = 0.0;
  for (int lag = -reach; lag <= reach; ++lag) {
    double sab = 0.0;
    for (size_t i = 0; i < n; ++i) sab += static_cast<double>(a[i + reach]) * b[i + reach + lag];
    worst = std::max(worst, std::fabs(sab) / std::sqrt(saa * sbb));
  }
  return worst;
}

std::vector<float> stream(uint64_t seed, size_t frames) {
  kit::StreamRng rng;
  rng.seed(seed);
  std::vector<float> out(frames);
  for (float& value : out) value = rng.bipolar();
  return out;
}

void test_generator() {
  // The published seeding function, from its own first outputs for a state of 0.
  uint64_t state = 0;
  const uint64_t first = kit::splitmix64(&state), second = kit::splitmix64(&state), third = kit::splitmix64(&state);
  EXPECT(first == 0xE220A8397B1DCDAFull && second == 0x6E789E6AA1B965F4ull && third == 0x06C45D188009454Full,
         "splitmix64 gives its published first three outputs from 0");

  // One step of the generator worked by hand from the state (1, 2): the
  // output is the sum, 3; the state becomes rotl(1, 24) ^ 3 ^ (3 << 16) and
  // rotl(3, 37), whose sum is the next output.
  kit::StreamRng rng;
  rng.s0 = 1;
  rng.s1 = 2;
  const uint64_t one = rng.next_u64();
  EXPECT(one == 3 && rng.s0 == 0x1030003ull && rng.s1 == 0x6000000000ull && rng.next_u64() == 0x6001030003ull,
         "one step of xoroshiro128+ is the published one, with the constants 24, 16 and 37");

  // White: in [-1, 1), flat, with nothing of one sample in the next.
  rng.seed(42);
  const size_t frames = 2000000;
  std::vector<float> white(frames);
  double sum = 0.0, squares = 0.0, low = 1.0, high = -1.0;
  bool inside = true, unit = true;
  for (float& value : white) {
    const float u = rng.uniform();
    unit = unit && u >= 0.0f && u < 1.0f;
    value = rng.bipolar();
    inside = inside && value >= -1.0f && value < 1.0f;
    sum += value;
    squares += static_cast<double>(value) * value;
    low = std::min(low, static_cast<double>(value));
    high = std::max(high, static_cast<double>(value));
  }
  EXPECT(inside && unit, "bipolar() is in [-1, 1) and uniform() in [0, 1)");
  EXPECT(low < -0.9999 && high > 0.9999, "white noise reaches both ends of its range");
  EXPECT_NEAR(sum / frames, 0.0, 2.0e-3, "white noise has no offset");
  EXPECT_NEAR(std::sqrt(squares / frames), 0.57735, 1.0e-3, "its RMS is one over the root of three");
  white.resize(480000);
  // (Against itself 33 samples late, 32 either way: lags of 1 to 65.)
  std::vector<float> late(white.begin() + 33, white.end());
  late.resize(white.size(), 0.0f);
  EXPECT(worst_correlation(white, late, 32) < 0.01, "one sample says nothing of the 65 that follow it");

  // Two streams, ten seconds at 48 kHz: under 0.02 at every lag to 128
  // samples either way, for seeds that are neighbours.
  double worst = 0.0;
  const uint64_t pairs[4][2] = {{0, 1}, {1, 2}, {7, 8}, {0x1234, 0x1235}};
  for (const auto& pair : pairs) {
    worst = std::max(worst, worst_correlation(stream(pair[0], 480000), stream(pair[1], 480000), 128));
  }
  std::printf("  generator: two streams correlate by %.4f at worst over ten seconds, lags to 128\n", worst);
  EXPECT(worst < 0.02, "two streams correlate under 0.02 over ten seconds at every lag to 128 samples");

  // What that measure is for: two of the kit's 32-bit generators are one
  // sequence at two places. Seed the second with what the first holds 100
  // steps on and it is the first, 100 samples late.
  kit::Rng old_a, old_b;
  old_a.seed(0x51F7u);
  old_b.seed(0x51F7u);
  for (int i = 0; i < 100; ++i) old_b.next_u32();
  std::vector<float> a(100000), b(100000);
  for (size_t i = 0; i < a.size(); ++i) {
    a[i] = old_a.bipolar();
    b[i] = old_b.bipolar();
  }
  EXPECT(worst_correlation(a, b, 256) > 0.99, "(two kit::Rng streams are one sequence at two places, and the measure sees it)");

  // Neighbouring seeds are unlike from their first value on: the first
  // value of each of 4096 seeds in a row is itself white noise.
  std::vector<float> firsts(4096), firsts_late(4096, 0.0f);
  for (size_t seed = 0; seed < firsts.size(); ++seed) firsts[seed] = stream(seed, 1)[0];
  for (size_t i = 0; i + 9 < firsts.size(); ++i) firsts_late[i] = firsts[i + 9];
  EXPECT(std::fabs(rms(firsts) - 0.57735) < 0.03 && std::fabs(mean(firsts)) < 0.05 &&
             worst_correlation(firsts, firsts_late, 8) < 0.08,
         "the first value of each of 4096 seeds in a row is white noise: a seed is mixed before it is used");

  // A seed is the whole of a stream: the same seed, the same noise; any seed
  // will do, 0 too.
  EXPECT(stream(5, 1000) == stream(5, 1000) && stream(5, 1000) != stream(6, 1000), "a seed gives the same stream again");
  const std::vector<float> zero = stream(0, 1000);
  EXPECT(rms(zero) > 0.5 && rms(zero) < 0.65, "a seed of 0 is a stream like any other");
  kit::StreamRng fresh;
  double fresh_squares = 0.0;
  for (int i = 0; i < 1000; ++i) {
    const float value = fresh.bipolar();
    fresh_squares += static_cast<double>(value) * value;
  }
  EXPECT(fresh_squares > 250.0, "and one that was never seeded still makes noise");
}

// --- the colour filter: its response -----------------------------------------------------------

// A filter's impulse response, two seconds of it, in double.
std::vector<double> impulse_response(double rate, float colour) {
  static kit::ColourFilter filter;
  filter.init(static_cast<float>(rate));
  filter.set_colour(colour);
  std::vector<double> h(static_cast<size_t>(2.0 * rate));
  for (size_t i = 0; i < h.size(); ++i) h[i] = filter.process(i == 0 ? 1.0f : 0.0f);
  return h;
}

// The gain of that response at `hz`, in dB.
double gain_db(const std::vector<double>& h, double hz, double rate) {
  double re = 0.0, im = 0.0;
  // The turn of one sample, applied again and again (a double keeps it true
  // over the two seconds to 1e-10).
  const double step = 2.0 * kPi * hz / rate, turn_c = std::cos(step), turn_s = std::sin(step);
  double c = 1.0, s = 0.0;
  for (size_t i = 0; i < h.size(); ++i) {
    re += h[i] * c;
    im -= h[i] * s;
    const double next = c * turn_c - s * turn_s;
    s = s * turn_c + c * turn_s;
    c = next;
  }
  return 10.0 * std::log10(std::max(re * re + im * im, 1.0e-30));
}

// What white noise of RMS 1/√3 comes out as: the root of the sum of squares.
double rms_through(const std::vector<double>& h) {
  double squares = 0.0;
  for (double value : h) squares += value * value;
  return std::sqrt(squares / 3.0);
}

void test_slope() {
  // The slope from 100 Hz to 8 kHz, an octave at a time, a third of an
  // octave apart: 0, -3 and -6 dB an octave at Colour 0, 0.5 and 1, and in
  // proportion between.
  double worst = 0.0, worst_fit = 0.0;
  for (double rate : kRates) {
    for (float colour : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) {
      const std::vector<double> h = impulse_response(rate, colour);
      const double target = -6.0206 * colour;
      std::vector<double> at;
      for (int third = 0; 100.0 * std::pow(2.0, third / 3.0) <= 8000.01; ++third) {
        at.push_back(gain_db(h, 100.0 * std::pow(2.0, third / 3.0), rate));
      }
      double low = 1.0e9, high = -1.0e9;
      for (size_t i = 3; i < at.size(); ++i) {
        low = std::min(low, at[i] - at[i - 3]);
        high = std::max(high, at[i] - at[i - 3]);
      }
      const double fit = (at.back() - at.front()) / (static_cast<double>(at.size() - 1) / 3.0);
      worst = std::max(worst, std::max(std::fabs(low - target), std::fabs(high - target)));
      worst_fit = std::max(worst_fit, std::fabs(fit - target));
      if (colour == 0.0f || colour == 0.5f || colour == 1.0f) {
        std::printf("  slope at %.0f Hz, Colour %.1f: %+.3f dB an octave over the range, each octave %+.3f to %+.3f\n", rate,
                    colour, fit, low, high);
      }
    }
  }
  std::printf("  slope: the worst octave is %.3f dB from 6 dB times Colour\n", worst);
  EXPECT(worst < 0.2, "every octave from 100 Hz to 8 kHz falls by 6 dB times Colour within 0.2 dB, at three rates");
  EXPECT(worst_fit < 0.1, "and the slope over the whole range is right within 0.1 dB an octave");

  // The band: a high pass near 20 Hz and a low pass near 20 kHz, the same in
  // hertz at every rate. White is flat between them.
  for (double rate : kRates) {
    const std::vector<double> h = impulse_response(rate, 0.0f);
    const double mid = gain_db(h, 1000.0, rate);
    char label[160];
    std::snprintf(label, sizeof label,
                  "at %.0f Hz white is flat from 50 Hz to 10 kHz, 3 dB down at 20 Hz and gone at 2 Hz (%.2f, %.2f dB)", rate,
                  gain_db(h, 20.0, rate) - mid, gain_db(h, 2.0, rate) - mid);
    EXPECT(std::fabs(gain_db(h, 50.0, rate) - mid) < 0.2 && std::fabs(gain_db(h, 10000.0, rate) - mid) < 0.5 &&
               std::fabs(gain_db(h, 20.0, rate) - mid + 3.01) < 0.3 && gain_db(h, 2.0, rate) - mid < -35.0,
           label);
    std::snprintf(label, sizeof label, "at %.0f Hz white is 3 dB down at 20 kHz (%.2f dB)", rate,
                  gain_db(h, 20000.0, rate) - mid);
    EXPECT(std::fabs(gain_db(h, 20000.0, rate) - mid + 3.01) < 0.3, label);
  }
  // Brown has nothing at 0 Hz: the sum of its impulse response is its gain there.
  for (double rate : kRates) {
    const std::vector<double> h = impulse_response(rate, 1.0f);
    double sum = 0.0, at_40 = gain_db(h, 40.0, rate);
    for (double value : h) sum += value;
    char label[120];
    std::snprintf(label, sizeof label, "at %.0f Hz brown passes nothing at 0 Hz (%.1f dB under its level at 40 Hz)", rate,
                  20.0 * std::log10(std::max(std::fabs(sum), 1.0e-12)) - at_40);
    EXPECT(20.0 * std::log10(std::max(std::fabs(sum), 1.0e-12)) - at_40 < -60.0, label);
  }
}

// --- the colour filter: its level --------------------------------------------------------------

// `seconds` of coloured noise from stream `seed`.
std::vector<float> coloured(double rate, float colour, uint64_t seed, double seconds) {
  static kit::ColourFilter filter;
  kit::StreamRng rng;
  rng.seed(seed);
  filter.init(static_cast<float>(rate));
  filter.set_colour(colour);
  std::vector<float> out(static_cast<size_t>(seconds * rate));
  for (float& value : out) value = filter.process(rng.bipolar());
  return out;
}

void test_level() {
  // Worked out: white of RMS 1/√3 through the filter's own impulse response,
  // at Colours on the table's points and between them, at rates from 22.05
  // to 192 kHz.
  double low = 1.0e9, high = -1.0e9;
  for (double rate : {22050.0, 44100.0, 48000.0, 88200.0, 96000.0, 192000.0}) {
    for (int step = 0; step <= 40; ++step) {
      const double level = db(rms_through(impulse_response(rate, static_cast<float>(step) / 40.0f)));
      low = std::min(low, level);
      high = std::max(high, level);
    }
  }
  const double aim = db(kit::kColourRms);
  std::printf("  level: worked out, the RMS is %.3f to %.3f dBFS over Colour and six rates (the aim is %.3f)\n", low, high, aim);
  EXPECT(low > aim - 0.1 && high < aim + 0.1, "worked out, the RMS is kColourRms within 0.1 dB at every Colour and rate");

  // Measured: ten seconds of noise.
  double least = 1.0e9, most = -1.0e9, crest = 0.0;
  for (double rate : kRates) {
    for (float colour : {0.0f, 0.25f, 0.37f, 0.5f, 0.75f, 1.0f}) {
      const std::vector<float> noise = coloured(rate, colour, 11, 10.0);
      const double level = db(rms(noise));
      least = std::min(least, level);
      most = std::max(most, level);
      crest = std::max(crest, db(peak(noise)) - level);
      if (colour == 0.0f || colour == 0.5f || colour == 1.0f) {
        std::printf("  level at %.0f Hz, Colour %.1f: RMS %.2f dBFS, peak %.2f dBFS\n", rate, colour, level, db(peak(noise)));
      }
    }
  }
  EXPECT(most - least < 1.0, "measured over ten seconds, the RMS is the same within 1 dB across Colour and three rates");
  EXPECT(least > aim - 0.6 && most < aim + 0.6, "and within 0.6 dB of kColourRms");
  std::printf("  level: the largest peak is %.1f dB over the RMS\n", crest);
  EXPECT(crest < 15.0, "its peaks stay under 15 dB over its RMS in ten seconds");

  // The level in each hertz does not fall with the rate: the density at
  // 100 Hz, 1 kHz and 8 kHz, worked out, is the same at three rates.
  double spread = 0.0;
  for (float colour : {0.0f, 0.5f, 1.0f}) {
    for (double hz : {100.0, 1000.0, 8000.0}) {
      double lowest = 1.0e9, highest = -1.0e9;
      for (double rate : kRates) {
        const double density = gain_db(impulse_response(rate, colour), hz, rate) - 10.0 * std::log10(rate);
        lowest = std::min(lowest, density);
        highest = std::max(highest, density);
      }
      spread = std::max(spread, highest - lowest);
    }
  }
  std::printf("  level: the level in each hertz differs by %.2f dB at most between 44.1, 48 and 96 kHz\n", spread);
  EXPECT(spread < 0.5, "the level in each hertz is the same within 0.5 dB at three rates");

  // white_gain is what does that for white noise a device filters itself:
  // a band at 1 kHz reads the same at three rates with it, 3 dB less at
  // 96 kHz than at 48 without.
  double with[3], bare[3];
  for (int r = 0; r < 3; ++r) {
    const float rate = static_cast<float>(kRates[r]);
    kit::StreamRng rng;
    rng.seed(3);
    kit::Svf band;
    band.set(1000.0f, 4.0f, rate);
    double squares = 0.0;
    const size_t frames = static_cast<size_t>(10.0 * rate);
    for (size_t i = 0; i < frames; ++i) {
      const float value = band.bandpass(rng.bipolar());
      squares += static_cast<double>(value) * value;
    }
    bare[r] = db(std::sqrt(squares / static_cast<double>(frames)));
    with[r] = bare[r] + db(kit::white_gain(rate));
  }
  EXPECT(kit::white_gain(48000.0f) == 1.0f && std::fabs(kit::white_gain(96000.0f) - 1.41421356f) < 1.0e-6f,
         "white_gain is the root of the rate over 48 kHz");
  EXPECT(std::fabs(with[0] - with[1]) < 0.3 && std::fabs(with[2] - with[1]) < 0.3,
         "white noise times white_gain reads the same in a band at three rates");
  EXPECT_NEAR(bare[2] - bare[1], -3.01, 0.3, "(and without it the band is 3 dB quieter at 96 kHz)");
}

// --- the colour filter: measured on noise ------------------------------------------------------

// The power in each octave from 88 Hz up (seven of them, centred on 125 Hz
// to 8 kHz), over the octave's width in hertz, in dB: frames of 8192 under a
// Hann window, laid half over one another.
std::vector<double> octave_density(const std::vector<float>& x, double rate) {
  constexpr int kFrame = 8192;
  static kit::Fft<kFrame> fft;
  static float re[kFrame], im[kFrame];
  fft.init();
  std::vector<double> power(kFrame / 2, 0.0);
  for (size_t start = 0; start + kFrame <= x.size(); start += kFrame / 2) {
    for (int n = 0; n < kFrame; ++n) {
      re[n] = x[start + static_cast<size_t>(n)] * static_cast<float>(0.5 - 0.5 * std::cos(2.0 * kPi * n / kFrame));
      im[n] = 0.0f;
    }
    fft.forward(re, im);
    for (int k = 0; k < kFrame / 2; ++k) power[static_cast<size_t>(k)] += static_cast<double>(re[k]) * re[k] + static_cast<double>(im[k]) * im[k];
  }
  std::vector<double> out;
  for (int octave = 0; octave < 7; ++octave) {
    const double from = 88.4 * std::pow(2.0, octave), to = 2.0 * from;
    double sum = 0.0;
    int bins = 0;
    for (int k = static_cast<int>(std::ceil(from * kFrame / rate)); k < to * kFrame / rate; ++k) {
      sum += power[static_cast<size_t>(k)];
      ++bins;
    }
    out.push_back(10.0 * std::log10(sum / bins));
  }
  return out;
}

void test_noise() {
  // The whole chain, generator and filter, read as a listener's meter would:
  // the slope of the best line through seven octaves.
  double worst = 0.0;
  for (double rate : kRates) {
    for (float colour : {0.0f, 0.5f, 1.0f}) {
      const std::vector<double> density = octave_density(coloured(rate, colour, 23, 10.0), rate);
      double sx = 0.0, sy = 0.0, sxx = 0.0, sxy = 0.0;
      for (size_t i = 0; i < density.size(); ++i) {
        sx += static_cast<double>(i);
        sy += density[i];
        sxx += static_cast<double>(i * i);
        sxy += static_cast<double>(i) * density[i];
      }
      const double n = static_cast<double>(density.size());
      const double slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
      std::printf("  noise at %.0f Hz, Colour %.1f: %+.2f dB an octave, measured on ten seconds\n", rate, colour, slope);
      worst = std::max(worst, std::fabs(slope + 6.0206 * colour));
    }
  }
  EXPECT(worst < 0.5, "measured on noise, Colour 0, 0.5 and 1 read 0, -3 and -6 dB an octave within 0.5 dB at three rates");

  // Brown has no offset: the mean of eight seconds, against an RMS of 0.2.
  double offset = 0.0;
  for (uint64_t seed : {1, 2, 3, 4, 5, 6}) offset = std::max(offset, std::fabs(mean(coloured(48000.0, 1.0f, seed, 8.0))));
  for (double rate : kRates) offset = std::max(offset, std::fabs(mean(coloured(rate, 1.0f, 9, 8.0))));
  std::printf("  noise: the mean of eight seconds of brown is %.5f at worst\n", offset);
  EXPECT(offset < 0.002, "brown noise has no offset: the mean of eight seconds is under 0.002");

  // Two channels from two streams are unlike at every Colour.
  for (float colour : {0.0f, 0.5f, 1.0f}) {
    const double alike = worst_correlation(coloured(48000.0, colour, 1, 10.0), coloured(48000.0, colour, 2, 10.0), 0);
    char label[120];
    std::snprintf(label, sizeof label, "two streams at Colour %.1f correlate by %.3f over ten seconds", colour, alike);
    EXPECT(alike < (colour == 1.0f ? 0.15 : 0.05), label);
  }
}

// --- the colour filter: its state --------------------------------------------------------------

void test_state() {
  static kit::ColourFilter filter;
  const std::vector<float> white = stream(77, 48000);
  auto run = [&](std::vector<float>* out) {
    out->clear();
    for (float value : white) out->push_back(filter.process(value));
  };
  std::vector<float> first, second, third;
  filter.init(48000.0f);
  filter.set_colour(0.8f);
  run(&first);
  filter.reset();
  run(&second);
  filter.init(48000.0f);
  filter.set_colour(0.8f);
  run(&third);
  EXPECT(first == second && rms(first) > 0.1, "reset() leaves no state: the same noise in gives the same floats out");
  EXPECT(first == third, "and a second init is the first");
  EXPECT(filter.colour() == 0.8f, "colour() says what was set");
  EXPECT(!filter.at_rest(), "after noise the filter is not at rest");
  filter.reset();
  EXPECT(filter.at_rest(), "after reset() it is");

  // init leaves the filter at white, and Colour is held to 0..1.
  filter.init(48000.0f);
  EXPECT(filter.colour() == 0.0f, "init leaves the Colour at 0");
  const std::vector<double> at_white = impulse_response(48000.0, 0.0f), at_brown = impulse_response(48000.0, 1.0f);
  EXPECT(impulse_response(48000.0, -3.0f) == at_white && impulse_response(48000.0, std::nanf("")) == at_white &&
             impulse_response(48000.0, 9.0f) == at_brown,
         "a Colour outside 0 to 1 is held to it, and nonsense is white");

  // Silence in: exact silence out within a second, and nothing left inside,
  // so the next sound is filtered as from new (a state left to decay would
  // sit at denormal size, which WASM computes slowly). Twelve stops at
  // different moments, since what is left when the input stops decides how
  // a filter comes to rest.
  for (float colour : {0.0f, 0.5f, 1.0f}) {
    filter.init(48000.0f);
    filter.set_colour(colour);
    std::vector<float> fresh;
    for (int i = 0; i < 4800; ++i) fresh.push_back(filter.process(i == 0 ? 1.0f : 0.0f));
    int longest_silent = 0, longest_rest = 0;
    bool busy = true, as_new = true;
    for (size_t trial = 0; trial < 12; ++trial) {
      filter.reset();
      for (size_t i = 0; i + 37 * trial < white.size(); ++i) filter.process(white[i]);
      busy = busy && !filter.at_rest();
      int silent_from = -1, rest_from = -1;
      for (int i = 0; i < 2 * 48000; ++i) {
        const float out = filter.process(0.0f);
        if (out != 0.0f) silent_from = -1;
        else if (silent_from < 0) silent_from = i;
        if (rest_from < 0 && filter.at_rest()) rest_from = i;
      }
      longest_silent = std::max(longest_silent, silent_from < 0 ? 1 << 30 : silent_from);
      longest_rest = std::max(longest_rest, rest_from < 0 || !filter.at_rest() ? 1 << 30 : rest_from);
      for (size_t i = 0; i < 4800; ++i) as_new = as_new && filter.process(i == 0 ? 1.0f : 0.0f) == fresh[i];
    }
    char label[200];
    std::snprintf(label, sizeof label, "Colour %.1f: exact silence %.2f s after the noise stops, and the next sound as from new",
                  colour, longest_silent / 48000.0);
    EXPECT(longest_silent < 48000 && as_new, label);
    std::snprintf(label, sizeof label, "Colour %.1f: every state is flushed to exactly zero within a second (%.2f s), long before it could be a denormal",
                  colour, longest_rest / 48000.0);
    EXPECT(busy && longest_rest < 48000, label);
    std::printf("  state: Colour %.1f is exact silence %.2f s after its input stops, at rest after %.2f s\n", colour,
                longest_silent / 48000.0, longest_rest / 48000.0);
  }

  // Moving Colour while it runs is safe at any moment: the poles do not
  // move, so the state means the same thing before and after.
  filter.init(48000.0f);
  bool finite = true;
  double largest = 0.0;
  for (size_t i = 0; i < white.size(); ++i) {
    if (i % 32 == 0) filter.set_colour(static_cast<float>(i) / static_cast<float>(white.size()));
    const float value = filter.process(white[i]);
    finite = finite && std::isfinite(value);
    largest = std::max(largest, std::fabs(static_cast<double>(value)));
  }
  EXPECT(finite && largest < 1.5, "Colour swept from white to brown while it runs stays finite and in range");

  // Rates a host may hand over, and nonsense.
  for (float rate : {8000.0f, 22050.0f, 192000.0f, 0.0f, -1.0f, std::nanf("")}) {
    filter.init(rate);
    filter.set_colour(0.5f);
    bool sound = true;
    double squares = 0.0;
    for (float value : white) {
      const float out = filter.process(value);
      sound = sound && std::isfinite(out);
      squares += static_cast<double>(out) * out;
    }
    char label[120];
    std::snprintf(label, sizeof label, "a sample rate of %g gives finite noise near the level (%.2f dBFS)", rate,
                  db(std::sqrt(squares / static_cast<double>(white.size()))));
    EXPECT(sound && std::fabs(db(std::sqrt(squares / static_cast<double>(white.size()))) - db(kit::kColourRms)) < 1.5, label);
  }
}

// --- cost --------------------------------------------------------------------------------------

void test_cost() {
  static kit::ColourFilter filter;
  kit::StreamRng rng;
  rng.seed(1);
  filter.init(48000.0f);
  filter.set_colour(0.5f);
  const float seconds = 20.0f;
  float sum = 0.0f;
  report_cost("kit::StreamRng and kit::ColourFilter, two channels", seconds, 48000.0f, [&] {
    const int frames = static_cast<int>(seconds * 48000.0f);
    for (int i = 0; i < frames; ++i) {
      sum += filter.process(rng.bipolar());
      sum += filter.process(rng.bipolar());
    }
  });
  filter.init(48000.0f);
  const auto start = std::chrono::steady_clock::now();
  for (int i = 0; i < 1000; ++i) filter.set_colour(static_cast<float>(i) * 0.001f);
  const double set_micros = std::chrono::duration<double, std::micro>(std::chrono::steady_clock::now() - start).count();
  const auto init_start = std::chrono::steady_clock::now();
  for (int i = 0; i < 20; ++i) filter.init(48000.0f);
  const double init_micros =
      std::chrono::duration<double, std::micro>(std::chrono::steady_clock::now() - init_start).count();
  std::printf("kit::ColourFilter: set_colour %.3f us, init %.1f us (native)\n", set_micros / 1000.0, init_micros / 20.0);
  EXPECT(std::isfinite(sum), "the timed render is finite");
}

}  // namespace

int main() {
  test_generator();
  test_slope();
  test_level();
  test_noise();
  test_state();
  test_cost();
  if (failures() == 0) {
    std::printf("colour tests: all passed\n");
    return 0;
  }
  std::printf("colour tests: %d FAILED\n", failures());
  return 1;
}
