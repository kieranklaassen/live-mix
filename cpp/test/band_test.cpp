// Native checks of cpp/kit/band.h: the three-way split whose parts add up to
// flat level. Proved here once, so a device harness asserts what its device
// does to the middle band and not that the split is sound. Compiled with the
// system C++ compiler by scripts/test-native.sh.

#include "../kit/kit.h"
#include "../kit/band.h"

#include <complex>

#include "support/test_kit.h"

using namespace livemix;
using namespace testkit;

namespace {

const double kRates[3] = {44100.0, 48000.0, 96000.0};

// The impulse responses of the three parts, one second of each.
struct Responses {
  std::vector<double> low, band, high, sum;
};

kit::ThreeBand& split() {
  static kit::ThreeBand instance;
  return instance;
}

Responses responses(float low_hz, float high_hz, double rate) {
  kit::ThreeBand& bands = split();
  bands.set(low_hz, high_hz, static_cast<float>(rate));
  bands.reset();
  Responses out;
  const size_t frames = static_cast<size_t>(rate);
  for (size_t i = 0; i < frames; ++i) {
    const kit::Bands parts = bands.process(i == 0 ? 1.0f : 0.0f);
    out.low.push_back(parts.low);
    out.band.push_back(parts.band);
    out.high.push_back(parts.high);
    out.sum.push_back(parts.low + parts.band + parts.high);
  }
  return out;
}

// The response at `hz`: gain and phase as one complex number.
std::complex<double> at(const std::vector<double>& h, double hz, double rate) {
  const double step = 2.0 * kPi * hz / rate, turn_c = std::cos(step), turn_s = std::sin(step);
  double re = 0.0, im = 0.0, c = 1.0, s = 0.0;
  for (size_t i = 0; i < h.size(); ++i) {
    re += h[i] * c;
    im -= h[i] * s;
    const double next = c * turn_c - s * turn_s;
    s = s * turn_c + c * turn_s;
    c = next;
  }
  return {re, im};
}

double gain_db(const std::vector<double>& h, double hz, double rate) { return db(std::abs(at(h, hz, rate))); }

// The angle between two parts at `hz`, in degrees, in -180..180.
double degrees_apart(const std::vector<double>& a, const std::vector<double>& b, double hz, double rate) {
  return std::arg(at(a, hz, rate) * std::conj(at(b, hz, rate))) * 180.0 / kPi;
}

// --- the parts add up to flat level ------------------------------------------------------------

void test_flat_sum() {
  const float edges[6][2] = {{150.0f, 1000.0f}, {60.0f, 400.0f},   {400.0f, 4000.0f},
                             {60.0f, 2000.0f},  {400.0f, 400.0f},  {250.0f, 600.0f}};
  double worst = 0.0, least_turn = 1.0e9, worst_energy = 0.0;
  for (double rate : kRates) {
    for (const auto& edge : edges) {
      const Responses r = responses(edge[0], edge[1], rate);
      // Flat in level, and not the input: the sum turns in phase (through
      // half a turn near each crossover), and an all-pass keeps the energy
      // of an impulse while spreading it out.
      double turn = 0.0;
      for (int i = 0; i <= 60; ++i) {
        const double hz = 20.0 * std::pow(1000.0, i / 60.0);
        worst = std::max(worst, std::fabs(gain_db(r.sum, hz, rate)));
        turn = std::max(turn, std::fabs(std::arg(at(r.sum, hz, rate))) * 180.0 / kPi);
      }
      double energy = 0.0;
      for (double value : r.sum) energy += value * value;
      worst_energy = std::max(worst_energy, std::fabs(energy - 1.0));
      least_turn = std::min(least_turn, turn);
    }
  }
  std::printf("  sum: low + band + high is within %.4f dB of flat from 20 Hz to 20 kHz, six settings, three rates\n", worst);
  EXPECT(worst < 0.1, "the three parts sum to flat within 0.1 dB from 20 Hz to 20 kHz at three rates");
  EXPECT(worst_energy < 1.0e-3, "the sum keeps the energy of an impulse: it is an all-pass");
  EXPECT(least_turn > 150.0, "and it is not the input: somewhere in the band the sum is nearly half a turn round");
}

// --- each part is where it should be -----------------------------------------------------------

void test_parts() {
  for (double rate : kRates) {
    char label[200];
    // A band of 150 Hz to 1 kHz: its centre is 387 Hz.
    const Responses r = responses(150.0f, 1000.0f, rate);
    const double centre = std::sqrt(150.0 * 1000.0);
    std::snprintf(label, sizeof label,
                  "at %.0f Hz a tone at the band's centre is %.2f dB in the band, %.1f dB in the low part, %.1f dB in the high",
                  rate, gain_db(r.band, centre, rate), gain_db(r.low, centre, rate), gain_db(r.high, centre, rate));
    EXPECT(std::fabs(gain_db(r.band, centre, rate)) < 0.5 && gain_db(r.low, centre, rate) < -30.0 &&
               gain_db(r.high, centre, rate) < -30.0,
           label);
    std::snprintf(label, sizeof label, "at %.0f Hz the low part alone has a tone a decade under the band (%.3f dB)", rate,
                  gain_db(r.low, 15.0, rate));
    EXPECT(std::fabs(gain_db(r.low, 15.0, rate)) < 0.01 && gain_db(r.band, 15.0, rate) < -60.0 &&
               gain_db(r.high, 15.0, rate) < -60.0,
           label);
    std::snprintf(label, sizeof label, "at %.0f Hz the high part alone has a tone a decade over the band (%.3f dB)", rate,
                  gain_db(r.high, 10000.0, rate));
    EXPECT(std::fabs(gain_db(r.high, 10000.0, rate)) < 0.01 && gain_db(r.band, 10000.0, rate) < -60.0 &&
               gain_db(r.low, 10000.0, rate) < -60.0,
           label);
    // The slopes are fourth order: 24 dB an octave, read two and three octaves out.
    EXPECT_NEAR(gain_db(r.low, 1200.0, rate) - gain_db(r.low, 600.0, rate), -24.0, 1.0,
                "the low part falls by 24 dB an octave above its crossover");
    // (Read between the crossovers, where the lower one adds 1 dB of its own.)
    EXPECT_NEAR(gain_db(r.high, 250.0, rate) - gain_db(r.high, 500.0, rate), -24.6, 1.0,
                "the high part falls by 24 dB an octave below its crossover");

    // At each crossover the two parts that meet are 6 dB down and in phase.
    // (The band's level at one crossover carries what the other takes from
    // it there, 0.004 dB for these two.)
    const double low_db = gain_db(r.low, 150.0, rate), band_low_db = gain_db(r.band, 150.0, rate);
    const double band_high_db = gain_db(r.band, 1000.0, rate), high_db = gain_db(r.high, 1000.0, rate);
    const double low_angle = degrees_apart(r.low, r.band, 150.0, rate);
    const double high_angle = degrees_apart(r.band, r.high, 1000.0, rate);
    std::printf("  parts at %.0f Hz: at 150 Hz low %.3f dB, band %.3f dB, %.3f degrees apart; at 1 kHz band %.3f dB, high %.3f dB, %.3f degrees apart\n",
                rate, low_db, band_low_db, low_angle, band_high_db, high_db, high_angle);
    EXPECT(std::fabs(low_db + 6.02) < 0.05 && std::fabs(band_low_db + 6.02) < 0.05,
           "at the lower crossover the low part and the band are each 6 dB down");
    EXPECT(std::fabs(band_high_db + 6.02) < 0.05 && std::fabs(high_db + 6.02) < 0.05,
           "at the upper crossover the band and the high part are each 6 dB down");
    EXPECT(std::fabs(low_angle) < 1.0 && std::fabs(high_angle) < 1.0, "and at each crossover the two are in phase");
    // In phase everywhere, not only there: so the parts never cancel in the sum.
    double worst_angle = 0.0;
    for (double hz : {40.0, 100.0, 300.0, 600.0}) {
      worst_angle = std::max(worst_angle, std::fabs(degrees_apart(r.low, r.band, hz, rate)));
    }
    for (double hz : {300.0, 600.0, 2000.0, 5000.0}) {
      worst_angle = std::max(worst_angle, std::fabs(degrees_apart(r.band, r.high, hz, rate)));
    }
    EXPECT(worst_angle < 1.0, "neighbouring parts stay in phase either side of their crossover");
  }
}

// --- the edges ---------------------------------------------------------------------------------

void test_edges() {
  kit::ThreeBand& bands = split();
  bands.set(150.0f, 1000.0f, 48000.0f);
  EXPECT(bands.low_hz() == 150.0f && bands.high_hz() == 1000.0f, "edges in range are taken as given");

  // The upper edge is held half an octave over the lower.
  bands.set(400.0f, 400.0f, 48000.0f);
  EXPECT(bands.low_hz() == 400.0f && std::fabs(bands.high_hz() - 400.0f * kit::ThreeBand::kMargin) < 1.0e-3f,
         "an upper edge on the lower one is held half an octave over it");
  bands.set(2000.0f, 300.0f, 48000.0f);
  EXPECT(bands.low_hz() == 2000.0f && bands.high_hz() > 2800.0f, "and so is one under it");
  // At that least width the band still holds its centre within 8 dB.
  const Responses narrow = responses(400.0f, 400.0f, 48000.0);
  EXPECT(gain_db(narrow.band, 400.0 * std::sqrt(std::sqrt(2.0)), 48000.0) > -8.0,
         "at its least width the band still passes its centre within 8 dB");

  // Both sit under 0.45 of the rate, whatever is asked, at any rate.
  bool under = true, ordered = true, finite = true;
  for (float rate : {8000.0f, 22050.0f, 44100.0f, 48000.0f, 96000.0f, 192000.0f}) {
    for (float low : {-5.0f, 0.0f, 10.0f, 400.0f, 15000.0f, 30000.0f, 1.0e9f}) {
      for (float high : {-5.0f, 0.0f, 400.0f, 4000.0f, 30000.0f, 1.0e9f}) {
        bands.set(low, high, rate);
        under = under && bands.high_hz() <= 0.45f * rate * 1.0001f && bands.low_hz() >= kit::ThreeBand::kLeastHz;
        ordered = ordered && bands.high_hz() >= bands.low_hz() * kit::ThreeBand::kMargin * 0.9999f;
        bands.reset();
        for (int i = 0; i < 2000; ++i) {
          const kit::Bands parts = bands.process(i % 7 == 0 ? 1.0f : -0.3f);
          finite = finite && std::isfinite(parts.low) && std::isfinite(parts.band) && std::isfinite(parts.high) &&
                   std::fabs(parts.low + parts.band + parts.high) < 8.0f;
        }
      }
    }
  }
  EXPECT(under, "both edges sit under 0.45 of the sample rate, and the lower at 20 Hz or over");
  EXPECT(ordered, "the upper edge is always half an octave or more over the lower");
  EXPECT(finite, "whatever is asked, the parts are finite and bounded");
  const float nan = std::nanf("");
  bands.set(nan, nan, 48000.0f);
  const bool nan_edges = std::isfinite(bands.low_hz()) && std::isfinite(bands.high_hz()) && bands.high_hz() > bands.low_hz();
  bands.set(150.0f, 1000.0f, nan);
  bands.reset();
  const kit::Bands parts = bands.process(1.0f);
  EXPECT(nan_edges && std::isfinite(parts.low + parts.band + parts.high) && std::isfinite(bands.high_hz()),
         "edges or a rate that are not numbers give a split that still works");
}

// --- its state ---------------------------------------------------------------------------------

void test_state() {
  kit::ThreeBand& bands = split();
  rng_state() = 0xBA2Du;
  const std::vector<float> hiss = noise(1.0f, 48000.0f, 0.5f);
  auto run = [&](std::vector<float>* out) {
    out->clear();
    for (float value : hiss) {
      const kit::Bands parts = bands.process(value);
      out->push_back(parts.low);
      out->push_back(parts.band);
      out->push_back(parts.high);
    }
  };
  std::vector<float> first, second, third;
  bands.set(150.0f, 1000.0f, 48000.0f);
  bands.reset();
  run(&first);
  bands.reset();
  run(&second);
  EXPECT(first == second && rms(first) > 0.01, "reset() leaves no state: the same sound in gives the same floats out");
  // set() does not clear: the same edges set again in mid flight change nothing.
  bands.reset();
  third.clear();
  for (size_t i = 0; i < hiss.size(); ++i) {
    if (i % 32 == 0) bands.set(150.0f, 1000.0f, 48000.0f);
    const kit::Bands parts = bands.process(hiss[i]);
    third.push_back(parts.low);
    third.push_back(parts.band);
    third.push_back(parts.high);
  }
  EXPECT(first == third, "set() with the same edges changes nothing and clears nothing");

  // Silence in. The parts are under 1e-9 within half a second (the idle
  // gate's floor is 1e-7), no value on the way down is a denormal, and in
  // the end everything inside is exactly zero. The last stretch is the kit's
  // Svf: at 60 Hz one of its two states can hold 1e-13 for three seconds
  // after the other has been flushed.
  const Responses fresh = responses(60.0f, 400.0f, 48000.0);
  double longest = 0.0, loudest_late = 0.0;
  bool normal = true, as_new = true;
  for (int trial = 0; trial < 12; ++trial) {
    bands.set(60.0f, 400.0f, 48000.0f);
    bands.reset();
    for (size_t i = 0; i + 37 * static_cast<size_t>(trial) < hiss.size(); ++i) bands.process(hiss[i]);
    int silent_from = -1;
    for (int i = 0; i < 8 * 48000; ++i) {
      const kit::Bands parts = bands.process(0.0f);
      for (float value : {parts.low, parts.band, parts.high}) {
        const double size = std::fabs(static_cast<double>(value));
        normal = normal && (size == 0.0 || size > 1.0e-30);
        if (i >= 24000) loudest_late = std::max(loudest_late, size);
      }
      if (parts.low != 0.0f || parts.band != 0.0f || parts.high != 0.0f) silent_from = -1;
      else if (silent_from < 0) silent_from = i;
    }
    longest = std::max(longest, silent_from < 0 ? 1.0e9 : silent_from / 48000.0);
    for (size_t i = 0; i < 4800; ++i) {
      const kit::Bands parts = bands.process(i == 0 ? 1.0f : 0.0f);
      as_new = as_new && parts.low == fresh.low[i] && parts.band == fresh.band[i] && parts.high == fresh.high[i];
    }
  }
  std::printf("  state: after its input stops the parts are under %.2g from half a second on and exact silence within %.2f s\n",
              loudest_late, longest);
  EXPECT(loudest_late < 1.0e-9, "half a second into a silence the parts are under 1e-9");
  EXPECT(normal, "no value on the way down is a denormal");
  EXPECT(longest < 8.0 && as_new, "and in the end everything inside is exactly zero: the next sound is split as from new");

  // The edges moved while a sound passes (a device smooths Low and High and
  // sets them as they go): the sum keeps its level and nothing jumps.
  for (double rate : kRates) {
    const std::vector<float> tone = sine(300.0f, 2.0f, static_cast<float>(rate), 0.5f);
    std::vector<float> sum(tone.size());
    bands.set(60.0f, 400.0f, static_cast<float>(rate));
    bands.reset();
    for (size_t i = 0; i < tone.size(); ++i) {
      const double along = static_cast<double>(i) / static_cast<double>(tone.size());
      bands.set(static_cast<float>(60.0 * std::pow(400.0 / 60.0, along)), static_cast<float>(400.0 * std::pow(10.0, along)),
                static_cast<float>(rate));
      const kit::Bands parts = bands.process(tone[i]);
      sum[i] = parts.low + parts.band + parts.high;
    }
    double low = 1.0e9, high = -1.0e9;
    const size_t window = static_cast<size_t>(rate / 20.0);
    for (size_t from = window; from + window <= sum.size(); from += window) {
      const double level = db(rms(sum, from, from + window)) - db(0.5 / std::sqrt(2.0));
      low = std::min(low, level);
      high = std::max(high, level);
    }
    char label[160];
    std::snprintf(label, sizeof label, "at %.0f Hz, edges swept across a 300 Hz tone: the sum stays within %.3f to %.3f dB",
                  rate, low, high);
    EXPECT(low > -0.5 && high < 0.5 && max_step(sum) < 1.5 * 0.5 * 2.0 * kPi * 300.0 / rate, label);
  }
}

// --- cost --------------------------------------------------------------------------------------

void test_cost() {
  static kit::ThreeBand pair[2];
  rng_state() = 0xC057u;
  const float seconds = 20.0f;
  const std::vector<float> hiss = noise(seconds, 48000.0f, 0.25f);
  for (kit::ThreeBand& bands : pair) {
    bands.set(150.0f, 1000.0f, 48000.0f);
    bands.reset();
  }
  float sum = 0.0f;
  report_cost("kit::ThreeBand, two channels", seconds, 48000.0f, [&] {
    for (float value : hiss) {
      const kit::Bands left = pair[0].process(value), right = pair[1].process(-value);
      sum += left.band + right.band;
    }
  });
  const auto start = std::chrono::steady_clock::now();
  for (int i = 0; i < 10000; ++i) pair[0].set(150.0f + 0.01f * static_cast<float>(i), 1000.0f, 48000.0f);
  const double micros = std::chrono::duration<double, std::micro>(std::chrono::steady_clock::now() - start).count();
  std::printf("kit::ThreeBand: set %.3f us (native)\n", micros / 10000.0);
  EXPECT(std::isfinite(sum), "the timed render is finite");
}

}  // namespace

int main() {
  test_flat_sum();
  test_parts();
  test_edges();
  test_state();
  test_cost();
  if (failures() == 0) {
    std::printf("band tests: all passed\n");
    return 0;
  }
  std::printf("band tests: %d FAILED\n", failures());
  return 1;
}
