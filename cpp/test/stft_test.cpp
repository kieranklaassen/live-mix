// Native checks of kit::Stft (cpp/kit/stft.h), the streaming short-time
// Fourier block the spectral devices are built on, and of the phase helpers
// beside it: proved here once, so a device harness asserts what its device
// does to the spectrum and not that the frames add up. Compiled with the
// system C++ compiler by scripts/test-native.sh.

#include "../kit/stft.h"

#include <cstring>
#include <limits>

#include "support/test_kit.h"

using namespace livemix;
using namespace testkit;

namespace {

constexpr float kRate = 48000.0f;

// A device's Stft is a member of its one static object; here each test has
// its own, static because a 4096 frame is 176 KB.
template <int Frame, int Hop, int Tag = 0>
kit::Stft<Frame, Hop>& instance() {
  static kit::Stft<Frame, Hop> stft;
  return stft;
}

template <typename Stft>
std::vector<float> pass(Stft& stft, const std::vector<float>& in) {
  std::vector<float> out(in.size());
  for (size_t i = 0; i < in.size(); ++i) out[i] = stft.process(in[i], [](float*, float*) {});
  return out;
}

// The largest difference between out, `delay` samples late, and in.
double worst_difference(const std::vector<float>& in, const std::vector<float>& out, size_t delay) {
  double worst = 0.0;
  for (size_t i = 0; i + delay < out.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(out[i + delay]) - in[i]));
  }
  return worst;
}

// A callable that leaves no bin as it found it and depends on the frame's
// number: a gain that falls with the bin and a turn that changes per frame.
template <typename Stft>
void scramble(const Stft& stft, float* re, float* im) {
  kit::Rng rng;
  rng.seed(0x9E3779B9u ^ (stft.frame() * 2654435761u));
  for (int k = 0; k < Stft::kBins; ++k) {
    const float gain = 1.0f / (1.0f + 0.01f * static_cast<float>(k));
    const float turn = 0.2f * rng.bipolar();
    const float c = std::cos(turn), s = std::sin(turn);
    const float r = re[k] * c - im[k] * s;
    im[k] = gain * (re[k] * s + im[k] * c);
    re[k] = gain * r;
  }
}

// --- the phase helpers -------------------------------------------------------------------------

void test_phase_helpers() {
  double worst = 0.0;
  rng_state() = 0xA7A2u;
  for (int i = 0; i < 400000; ++i) {
    float x = 4.0f * white();
    float y = 4.0f * white();
    if (i % 5 == 0) x *= 1.0e-6f;  // close to the axes, and far from the origin and near it
    if (i % 7 == 0) y *= 1.0e-6f;
    if (i % 11 == 0) {
      x *= 1.0e12f;
      y *= 1.0e12f;
    }
    if (i % 13 == 0) {
      x *= 1.0e-12f;
      y *= 1.0e-12f;
    }
    worst =
        std::max(worst, std::fabs(kit::fast_atan2(y, x) - std::atan2(static_cast<double>(y), static_cast<double>(x))));
  }
  for (int i = 0; i < 3600; ++i) {
    const double angle = (i - 1800) * kPi / 1800.0;
    const float x = static_cast<float>(std::cos(angle)), y = static_cast<float>(std::sin(angle));
    worst =
        std::max(worst, std::fabs(kit::fast_atan2(y, x) - std::atan2(static_cast<double>(y), static_cast<double>(x))));
  }
  std::printf("  fast_atan2: worst error %.3g rad\n", worst);
  EXPECT(worst < 2.0e-5, "fast_atan2 is within 2e-5 rad of atan2 in every quadrant and on the axes");
  EXPECT(kit::fast_atan2(0.0f, 0.0f) == 0.0f, "fast_atan2(0, 0) is 0");
  EXPECT_NEAR(kit::fast_atan2(0.0f, -1.0f), kPi, 1.0e-6, "fast_atan2 gives π on the negative real axis");
  EXPECT_NEAR(kit::fast_atan2(-1.0f, 0.0f), -0.5 * kPi, 1.0e-6, "fast_atan2 gives -π/2 straight down");

  double off = 0.0;
  bool inside = true;
  for (int i = -40000; i <= 40000; ++i) {
    const float phase = 0.0037f * static_cast<float>(i);  // ±148 rad
    const float wrapped = kit::princarg(phase);
    inside = inside && wrapped >= -kit::kPi - 1.0e-5f && wrapped <= kit::kPi + 1.0e-5f;
    // The same angle: same sine and cosine (phase itself is good to 1e-5 out there).
    off = std::max(off, std::fabs(std::sin(static_cast<double>(wrapped)) - std::sin(static_cast<double>(phase))));
    off = std::max(off, std::fabs(std::cos(static_cast<double>(wrapped)) - std::cos(static_cast<double>(phase))));
  }
  EXPECT(inside, "princarg lands in [-π, π]");
  EXPECT(off < 5.0e-5, "princarg leaves the angle what it was");
  EXPECT(kit::princarg(0.5f) == 0.5f && kit::princarg(-3.0f) == -3.0f, "princarg leaves a principal value alone");
  EXPECT_NEAR(kit::princarg(3.0f * kit::kPi + 0.25f), -kit::kPi + 0.25f, 1.0e-5, "princarg takes whole turns off");

  // Inside a turn of zero, and out to 30 rad where the phase itself has
  // fewer digits left.
  double sine_error = 0.0, far_error = 0.0;
  for (int i = -3000000; i <= 3000000; ++i) {
    const float phase = 1.0e-5f * static_cast<float>(i);
    float re, im;
    kit::from_polar(1.0f, phase, &re, &im);
    const double off = std::max(std::fabs(re - std::cos(static_cast<double>(phase))),
                                std::fabs(im - std::sin(static_cast<double>(phase))));
    far_error = std::max(far_error, off);
    if (i >= -628318 && i <= 628318) sine_error = std::max(sine_error, off);
  }
  std::printf("  from_polar: worst error %.3g of the magnitude within a turn, %.3g out to 30 rad\n", sine_error,
              far_error);
  EXPECT(sine_error < 1.5e-6, "from_polar gives the cosine and sine of a phase within a turn to 1.5e-6");
  EXPECT(far_error < 5.0e-6, "from_polar takes a phase of many turns");
  {
    float re, im;
    kit::from_polar(2.0f, 0.0f, &re, &im);
    const bool east = std::fabs(re - 2.0f) < 1.0e-5f && im == 0.0f;
    kit::from_polar(2.0f, kit::kHalfPi, &re, &im);
    const bool north = std::fabs(im - 2.0f) < 1.0e-5f && std::fabs(re) < 1.0e-6f;
    kit::from_polar(2.0f, -kit::kHalfPi, &re, &im);
    const bool south = std::fabs(im + 2.0f) < 1.0e-5f && std::fabs(re) < 1.0e-6f;
    kit::from_polar(2.0f, kit::kPi, &re, &im);
    const bool west = std::fabs(re + 2.0f) < 1.0e-5f && std::fabs(im) < 1.0e-6f;
    kit::from_polar(2.0f, 7.0f * kit::kPi, &re, &im);
    const bool round = std::fabs(re + 2.0f) < 1.0e-4f && std::fabs(im) < 1.0e-4f;
    EXPECT(east && north && south && west && round, "from_polar is right on the axes and after whole turns");
  }

  double round_trip = 0.0, phase_error = 0.0;
  for (int i = 0; i < 20000; ++i) {
    const float re = 3.0f * white(), im = 3.0f * white();
    float magnitude, phase, back_re, back_im;
    kit::to_polar(re, im, &magnitude, &phase);
    kit::from_polar(magnitude, phase, &back_re, &back_im);
    const double size = std::hypot(static_cast<double>(re), static_cast<double>(im));
    round_trip =
        std::max(round_trip, std::hypot(static_cast<double>(back_re) - re, static_cast<double>(back_im) - im) / size);
    phase_error =
        std::max(phase_error, std::fabs(phase - std::atan2(static_cast<double>(im), static_cast<double>(re))));
  }
  std::printf("  to_polar and back: worst error %.3g of the magnitude\n", round_trip);
  EXPECT(round_trip < 3.0e-5, "a bin taken to magnitude and phase and back is the bin");
  EXPECT(phase_error < 2.0e-5, "to_polar's phase is the bin's angle");
}

// --- identity, latency, the dry path -----------------------------------------------------------

template <int Frame, int Hop>
void check_identity() {
  using Stft = kit::Stft<Frame, Hop>;
  Stft& stft = instance<Frame, Hop>();
  char label[160];
  const size_t latency = static_cast<size_t>(Stft::kLatency);

  stft.init();
  rng_state() = 0x51F7u + static_cast<uint32_t>(Frame + Hop);
  const std::vector<float> hiss = noise(1.5f, kRate, 0.9f);
  const std::vector<float> hiss_out = pass(stft, hiss);
  const double hiss_error = worst_difference(hiss, hiss_out, latency);

  stft.init();
  const std::vector<float> tone = sine(997.0f, 1.5f, kRate, 0.8f);
  const std::vector<float> tone_out = pass(stft, tone);
  const double tone_error = worst_difference(tone, tone_out, latency);

  std::printf("  Stft<%d, %d>: latency %d, identity error %.3g on noise, %.3g on a sine\n", Frame, Hop, Stft::kLatency,
              hiss_error, tone_error);
  std::snprintf(label, sizeof label, "Stft<%d, %d>: noise comes out as it went in, within 1e-5", Frame, Hop);
  EXPECT(hiss_error < 1.0e-5, label);
  std::snprintf(label, sizeof label, "Stft<%d, %d>: a sine comes out as it went in, within 1e-5", Frame, Hop);
  EXPECT(tone_error < 1.0e-5, label);

  // The latency is that number and no other: one sample either way and the
  // noise no longer lines up at all.
  std::snprintf(label, sizeof label, "Stft<%d, %d>: the latency is exact", Frame, Hop);
  EXPECT(worst_difference(hiss, hiss_out, latency - 1) > 0.5 && worst_difference(hiss, hiss_out, latency + 1) > 0.5,
         label);
  std::snprintf(label, sizeof label, "Stft<%d, %d>: latency() is a frame and half a hop", Frame, Hop);
  EXPECT(stft.latency() == Frame + Hop / 2 && Stft::kLatency == stft.latency() && Stft::kMaxStagger == Hop / 2, label);
  std::snprintf(label, sizeof label, "Stft<%d, %d>: nothing comes out before the latency", Frame, Hop);
  EXPECT(peak(hiss_out, 0, latency) < 1.0e-5, label);

  // An impulse comes out as one sample, at the latency.
  stft.init();
  std::vector<float> click(static_cast<size_t>(3 * Frame), 0.0f);
  click[5] = 1.0f;
  const std::vector<float> click_out = pass(stft, click);
  size_t loudest = 0;
  double elsewhere = 0.0;
  for (size_t i = 0; i < click_out.size(); ++i) {
    if (std::fabs(click_out[i]) > std::fabs(click_out[loudest])) loudest = i;
    if (i != 5 + latency) elsewhere = std::max(elsewhere, std::fabs(static_cast<double>(click_out[i])));
  }
  std::snprintf(label, sizeof label, "Stft<%d, %d>: an impulse comes out %d samples later and nowhere else", Frame, Hop,
                Stft::kLatency);
  EXPECT(loudest == 5 + latency && std::fabs(click_out[loudest] - 1.0f) < 1.0e-5 && elsewhere < 1.0e-5, label);

  // Silence in is exact silence out, once the last frame that held sound
  // has played out: a latency and a frame after the last sample.
  stft.init();
  std::vector<float> stopped = hiss;
  stopped.resize(static_cast<size_t>(8 * Frame));
  const size_t last = static_cast<size_t>(4 * Frame + 77);
  for (size_t i = last + 1; i < stopped.size(); ++i) stopped[i] = 0.0f;
  const std::vector<float> stopped_out = pass(stft, stopped);
  std::snprintf(label, sizeof label, "Stft<%d, %d>: exact silence a latency and a frame after the input stops", Frame,
                Hop);
  EXPECT(peak(stopped_out, last + latency + static_cast<size_t>(Frame)) == 0.0 &&
             peak(stopped_out, last + latency - 8, last + latency + 1) > 1.0e-3,
         label);

  // dry() is the input of `latency` samples ago, the very floats, so a mix
  // of the two neither combs nor changes level.
  stft.init();
  bool same = true;
  double apart = 0.0;
  for (size_t i = 0; i < hiss.size(); ++i) {
    const float wet = stft.process(hiss[i], [](float*, float*) {});
    const float dry = stft.dry();
    same = same && dry == (i >= latency ? hiss[i - latency] : 0.0f);
    apart = std::max(apart, std::fabs(static_cast<double>(wet) - dry));
  }
  std::snprintf(label, sizeof label, "Stft<%d, %d>: dry() is the input of a latency ago, bit for bit", Frame, Hop);
  EXPECT(same, label);
  std::snprintf(label, sizeof label, "Stft<%d, %d>: dry and wet are in step (they differ by %.3g)", Frame, Hop, apart);
  EXPECT(apart < 1.0e-5, label);

  // Bins 0 and Frame/2 are real: whatever the callable leaves in their
  // imaginary parts changes nothing.
  stft.init();
  std::vector<float> careless(hiss.size());
  for (size_t i = 0; i < hiss.size(); ++i) {
    careless[i] = stft.process(hiss[i], [](float*, float* im) {
      im[0] = 1.0e6f;
      im[Stft::kBins - 1] = -1.0e6f;
    });
  }
  std::snprintf(label, sizeof label, "Stft<%d, %d>: the imaginary parts of the first and last bin are ignored", Frame,
                Hop);
  EXPECT(worst_difference(hiss_out, careless, 0) < 1.0e-6, label);
}

void test_identity() {
  check_identity<1024, 256>();
  check_identity<2048, 512>();
  check_identity<4096, 1024>();
  // An eighth of a frame per hop.
  check_identity<1024, 128>();
  check_identity<2048, 256>();
  check_identity<4096, 512>();
  // What a manifest's "latencySamples" says for the three sizes.
  EXPECT((kit::Stft<1024, 256>::kLatency) == 1152 && (kit::Stft<2048, 512>::kLatency) == 2304 &&
             (kit::Stft<4096, 1024>::kLatency) == 4608,
         "the latencies are 1152, 2304 and 4608 samples at a quarter hop");
  EXPECT((kit::Stft<2048>::kHop) == 512 && (kit::Stft<2048>::kOverlap) == 4 && (kit::Stft<2048>::kBins) == 1025,
         "the hop is a quarter of the frame unless said otherwise, and the bins are half the frame and one");
}

// --- the spectrum: bins and true frequencies ---------------------------------------------------

template <int Frame, int Hop>
void check_spectrum(float rate) {
  using Stft = kit::Stft<Frame, Hop>;
  Stft& stft = instance<Frame, Hop>();
  char label[200];
  const int bins = Stft::kBins;

  // A sine on a bin's centre: kFullScale there, half in each neighbour,
  // nothing two bins away.
  {
    const int bin = Frame / 16 + 3;
    stft.init();
    const std::vector<float> tone = sine(Stft::bin_to_hz(static_cast<float>(bin), rate), 4.0f * Frame / rate, rate);
    std::vector<float> magnitude(static_cast<size_t>(bins), 0.0f);
    for (float x : tone) {
      stft.analyse(x, [&](const float* re, const float* im) {
        for (int k = 0; k < bins; ++k) magnitude[static_cast<size_t>(k)] = std::hypot(re[k], im[k]);
      });
    }
    const size_t at = static_cast<size_t>(bin);
    std::snprintf(label, sizeof label, "Stft<%d, %d>: a full-scale sine on a bin reads kFullScale there (%g of it)",
                  Frame, Hop, magnitude[at] / Stft::kFullScale);
    EXPECT(std::fabs(magnitude[at] / Stft::kFullScale - 1.0f) < 1.0e-4f, label);
    std::snprintf(label, sizeof label, "Stft<%d, %d>: and half that in each neighbour, nothing beyond", Frame, Hop);
    EXPECT(std::fabs(magnitude[at - 1] / Stft::kFullScale - 0.5f) < 1.0e-4f &&
               std::fabs(magnitude[at + 1] / Stft::kFullScale - 0.5f) < 1.0e-4f &&
               magnitude[at - 2] < 1.0e-4f * Stft::kFullScale && magnitude[at + 2] < 1.0e-4f * Stft::kFullScale,
           label);
  }

  // Sines anywhere: the peak is in the nearest bin, and the turn of that
  // bin's phase from one frame to the next gives the frequency back.
  // Below about eight bins a sine's mirror image (at minus its frequency)
  // leaks into its own bins and bends their phase a little: `low` is that
  // stretch, `worst` everything above it.
  double worst_hz = 0.0, worst_neighbour_hz = 0.0, worst_advance = 0.0, low_hz = 0.0, low_advance = 0.0;
  bool peaks_right = true;
  for (float hz : {110.0f, 261.63f, 440.0f, 997.0f, 1000.0f, 3520.31f, 7040.0f, 12345.6f, 19000.0f}) {
    stft.init();
    const std::vector<float> tone = sine(hz, 6.0f * Frame / rate, rate, 0.5f);
    std::vector<float> phase(static_cast<size_t>(bins), 0.0f), last(static_cast<size_t>(bins), 0.0f);
    int peak_bin = 0;
    for (float x : tone) {
      stft.analyse(x, [&](const float* re, const float* im) {
        float loudest = 0.0f;
        for (int k = 0; k < bins; ++k) {
          const size_t i = static_cast<size_t>(k);
          last[i] = phase[i];
          float magnitude;
          kit::to_polar(re[k], im[k], &magnitude, &phase[i]);
          if (magnitude > loudest) {
            loudest = magnitude;
            peak_bin = k;
          }
        }
      });
    }
    const int expected = Stft::nearest_bin(hz, rate);
    peaks_right = peaks_right && peak_bin == expected &&
                  std::fabs(Stft::hz_to_bin(hz, rate) - static_cast<float>(expected)) <= 0.5f;
    const size_t at = static_cast<size_t>(peak_bin);
    const double off = std::fabs(static_cast<double>(Stft::advance_to_hz(peak_bin, phase[at] - last[at], rate)) - hz);
    // And back: the advance for that frequency is the turn that was measured.
    const double turn =
        std::fabs(static_cast<double>(kit::princarg(phase[at] - last[at] - Stft::hz_to_advance(hz, rate))));
    if (peak_bin < 8) {
      low_hz = std::max(low_hz, off);
      low_advance = std::max(low_advance, turn);
      continue;
    }
    worst_hz = std::max(worst_hz, off);
    worst_advance = std::max(worst_advance, turn);
    // Its neighbours hold the same partial and say the same.
    for (int k : {peak_bin - 1, peak_bin + 1}) {
      const size_t i = static_cast<size_t>(k);
      worst_neighbour_hz = std::max(
          worst_neighbour_hz, std::fabs(static_cast<double>(Stft::advance_to_hz(k, phase[i] - last[i], rate)) - hz));
    }
  }
  std::printf(
      "  Stft<%d, %d> at %.0f Hz: true frequency off by %.4f Hz at worst in the peak bin, %.4f Hz beside it,"
      " %.4f Hz under bin 8\n",
      Frame, Hop, rate, worst_hz, worst_neighbour_hz, low_hz);
  std::snprintf(label, sizeof label, "Stft<%d, %d> at %.0f Hz: a sine's peak is in the bin nearest its frequency",
                Frame, Hop, rate);
  EXPECT(peaks_right, label);
  std::snprintf(label, sizeof label, "Stft<%d, %d> at %.0f Hz: advance_to_hz recovers a sine's frequency to 0.05 Hz",
                Frame, Hop, rate);
  EXPECT(worst_hz < 0.05, label);
  std::snprintf(label, sizeof label, "Stft<%d, %d> at %.0f Hz: and to a quarter of a hertz in the lowest bins", Frame,
                Hop, rate);
  EXPECT(low_hz < 0.25, label);
  std::snprintf(label, sizeof label, "Stft<%d, %d> at %.0f Hz: the bins beside the peak give the same frequency", Frame,
                Hop, rate);
  EXPECT(worst_neighbour_hz < 0.05, label);
  std::snprintf(label, sizeof label, "Stft<%d, %d> at %.0f Hz: hz_to_advance is the turn a sine makes per frame", Frame,
                Hop, rate);
  EXPECT(worst_advance < 1.0e-3 && low_advance < 1.0e-2, label);
}

void test_spectrum() {
  check_spectrum<1024, 256>(kRate);
  check_spectrum<2048, 512>(kRate);
  check_spectrum<4096, 1024>(kRate);
  check_spectrum<2048, 256>(kRate);
  check_spectrum<2048, 512>(44100.0f);
  check_spectrum<2048, 512>(96000.0f);

  using Stft = kit::Stft<2048, 512>;
  EXPECT_NEAR(Stft::bin_to_hz(1.0f, 48000.0f), 23.4375, 1.0e-4, "a bin of 2048 at 48 kHz is 23.4375 Hz wide");
  EXPECT_NEAR(Stft::bin_to_hz(1024.0f, 96000.0f), 48000.0, 1.0e-2, "the last bin is half the sample rate");
  EXPECT_NEAR(Stft::hz_to_bin(1000.0f, 48000.0f), 42.6667, 1.0e-3, "1 kHz lies between bins 42 and 43");
  EXPECT(Stft::nearest_bin(1000.0f, 48000.0f) == 43 && Stft::nearest_bin(1000.0f, 96000.0f) == 21,
         "the bin of a frequency follows the sample rate");
  EXPECT(Stft::nearest_bin(-50.0f, 48000.0f) == 0 && Stft::nearest_bin(1.0e9f, 48000.0f) == 1024 &&
             Stft::nearest_bin(std::nanf(""), 48000.0f) == 0,
         "nearest_bin stays inside the spectrum");
  // A whole bin turns by its own number of quarter turns per frame.
  EXPECT_NEAR(Stft::bin_to_advance(1.0f), 0.5 * kPi, 1.0e-6, "bin 1 turns a quarter turn per frame at a quarter hop");
  EXPECT_NEAR(Stft::bin_to_advance(4.0f), 0.0, 1.0e-6, "bin 4 turns a whole turn");
  EXPECT_NEAR(Stft::advance_to_bin(43, Stft::bin_to_advance(42.7f)), 42.7, 1.0e-4,
              "advance_to_bin undoes bin_to_advance near the bin");
}

// --- a gain per bin is a filter ----------------------------------------------------------------

// The level of a steady sine at `hz` after the callable has scaled bin k by
// gains[k], as a ratio to its level before.
template <int Frame, int Hop>
double through_gains(const std::vector<float>& gains, float hz) {
  using Stft = kit::Stft<Frame, Hop>;
  Stft& stft = instance<Frame, Hop>();
  stft.init();
  const std::vector<float> tone = sine(hz, 12.0f * Frame / kRate, kRate, 0.5f);
  std::vector<float> out(tone.size());
  for (size_t i = 0; i < tone.size(); ++i) {
    out[i] = stft.process(tone[i], [&](float* re, float* im) {
      for (int k = 0; k < Stft::kBins; ++k) {
        re[k] *= gains[static_cast<size_t>(k)];
        im[k] *= gains[static_cast<size_t>(k)];
      }
    });
  }
  // Eight frames of steady state, a whole number of bin periods long.
  const size_t from = static_cast<size_t>(4 * Frame);
  return tone_level(out, hz, kRate, from, from + static_cast<size_t>(8 * Frame)) / 0.5;
}

template <int Frame, int Hop>
void check_filter() {
  using Stft = kit::Stft<Frame, Hop>;
  char label[200];
  const size_t bins = static_cast<size_t>(Stft::kBins);

  // A slope of 3 dB per octave down from 100 Hz: smooth across bins, so the
  // filter is the gains.
  std::vector<float> tilt(bins);
  for (size_t k = 0; k < bins; ++k) {
    const float hz = Stft::bin_to_hz(static_cast<float>(k), kRate);
    tilt[k] = hz <= 100.0f ? 1.0f : std::sqrt(100.0f / hz);
  }
  double worst_db = 0.0;
  for (float hz : {400.0f, 1000.0f, 2500.0f, 6000.0f, 14000.0f}) {
    const double expected = std::sqrt(100.0 / hz);
    worst_db = std::max(worst_db, std::fabs(db(through_gains<Frame, Hop>(tilt, hz)) - db(expected)));
  }
  std::snprintf(label, sizeof label, "Stft<%d, %d>: a slope of gains per bin comes out as that slope (%.3f dB off)",
                Frame, Hop, worst_db);
  EXPECT(worst_db < 0.05, label);

  // A wall at 2 kHz: what is below passes whole, what is above is gone.
  std::vector<float> wall(bins);
  const int edge = Stft::nearest_bin(2000.0f, kRate);
  for (size_t k = 0; k < bins; ++k) wall[k] = static_cast<int>(k) <= edge ? 1.0f : 0.0f;
  const double below = through_gains<Frame, Hop>(wall, 1500.0f);
  const double above = through_gains<Frame, Hop>(wall, 2600.0f);
  std::snprintf(label, sizeof label,
                "Stft<%d, %d>: a wall of gains passes below it (%.4f dB) and stops above (%.0f dB)", Frame, Hop,
                db(below), db(above));
  EXPECT(std::fabs(db(below)) < 0.01 && db(above) < -80.0, label);

  // Any gains at all, on a bin's centre: 2/3 of that bin's and 1/6 of each
  // neighbour's, which is the window.
  std::vector<float> rough(bins);
  kit::Rng rng;
  rng.seed(0xF117E2u);
  for (size_t k = 0; k < bins; ++k) rough[k] = rng.uniform();
  double worst = 0.0;
  for (int bin : {Frame / 64 + 1, Frame / 16, Frame / 8 + 5, Frame / 4 + 2}) {
    const size_t k = static_cast<size_t>(bin);
    const double expected = (2.0 / 3.0) * rough[k] + (1.0 / 6.0) * (rough[k - 1] + rough[k + 1]);
    worst = std::max(
        worst, std::fabs(through_gains<Frame, Hop>(rough, Stft::bin_to_hz(static_cast<float>(bin), kRate)) - expected));
  }
  std::snprintf(label, sizeof label,
                "Stft<%d, %d>: on a bin's centre the gain is 2/3 of the bin's and 1/6 of each neighbour's (%.2g off)",
                Frame, Hop, worst);
  EXPECT(worst < 1.0e-3, label);

  // So one bin set to zero is a dip of 9.5 dB.
  std::vector<float> notch(bins, 1.0f);
  notch[static_cast<size_t>(Frame / 16)] = 0.0f;
  const double dip = db(through_gains<Frame, Hop>(notch, Stft::bin_to_hz(static_cast<float>(Frame / 16), kRate)));
  std::snprintf(label, sizeof label, "Stft<%d, %d>: one bin set to zero takes a sine on it down by 9.5 dB (%.2f)",
                Frame, Hop, dip);
  EXPECT(std::fabs(dip + 9.54) < 0.05, label);
}

void test_filter() {
  check_filter<1024, 256>();
  check_filter<2048, 512>();
  check_filter<4096, 1024>();
  check_filter<2048, 256>();
}

// --- init and clear ----------------------------------------------------------------------------

template <int Frame, int Hop>
void check_reinit() {
  using Stft = kit::Stft<Frame, Hop>;
  Stft& stft = instance<Frame, Hop>();
  char label[160];
  rng_state() = 0x1217u;
  const std::vector<float> in = noise(1.0f, kRate, 0.7f);
  auto render = [&] {
    std::vector<float> out(in.size());
    for (size_t i = 0; i < in.size(); ++i) {
      out[i] = stft.process(in[i], [&](float* re, float* im) { scramble(stft, re, im); });
    }
    return out;
  };
  stft.init();
  const std::vector<float> first = render();
  stft.init();
  const std::vector<float> second = render();
  stft.clear();
  const std::vector<float> third = render();
  std::snprintf(label, sizeof label, "Stft<%d, %d>: a second init gives the same output, bit for bit", Frame, Hop);
  EXPECT(first == second && rms(first) > 0.01, label);
  std::snprintf(label, sizeof label, "Stft<%d, %d>: so does clear()", Frame, Hop);
  EXPECT(first == third, label);

  // clear() in mid flight leaves nothing behind.
  for (size_t i = 0; i < static_cast<size_t>(Frame); ++i) stft.process(in[i], [](float*, float*) {});
  stft.clear();
  double left = 0.0;
  for (int i = 0; i < 3 * Frame; ++i) {
    left = std::max(left, std::fabs(static_cast<double>(stft.process(0.0f, [](float*, float*) {}))));
    left = std::max(left, std::fabs(static_cast<double>(stft.dry())));
  }
  std::snprintf(label, sizeof label, "Stft<%d, %d>: after clear() nothing of what was in flight comes out", Frame, Hop);
  EXPECT(left == 0.0, label);
}

void test_reinit() {
  check_reinit<1024, 256>();
  check_reinit<2048, 512>();
  check_reinit<4096, 1024>();
}

// --- the stagger -------------------------------------------------------------------------------

struct Trace {
  std::vector<float> out;
  std::vector<size_t> at;        // the sample each frame was handed over on
  std::vector<uint32_t> number;  // frame() there
  std::vector<float> spectrum;   // every frame's bins as they were handed over
};

template <int Frame, int Hop>
Trace trace(int stagger, const std::vector<float>& in) {
  using Stft = kit::Stft<Frame, Hop>;
  Stft& stft = instance<Frame, Hop>();
  stft.init(stagger);
  Trace result;
  result.out.resize(in.size());
  for (size_t i = 0; i < in.size(); ++i) {
    result.out[i] = stft.process(in[i], [&](float* re, float* im) {
      result.at.push_back(i);
      result.number.push_back(stft.frame());
      result.spectrum.insert(result.spectrum.end(), re, re + Stft::kBins);
      result.spectrum.insert(result.spectrum.end(), im, im + Stft::kBins);
      scramble(stft, re, im);
    });
  }
  return result;
}

template <int Frame, int Hop>
void check_stagger() {
  using Stft = kit::Stft<Frame, Hop>;
  char label[200];
  rng_state() = 0x57A6u;
  const std::vector<float> in = noise(1.0f, kRate, 0.7f);
  const Trace straight = trace<Frame, Hop>(0, in);
  const Trace late = trace<Frame, Hop>(Stft::kMaxStagger, in);
  const Trace between = trace<Frame, Hop>(Hop / 8 + 3, in);

  bool every_hop = straight.at.size() > 8 && straight.at[0] == 0;
  for (size_t f = 1; f < straight.at.size(); ++f) every_hop = every_hop && straight.at[f] == straight.at[f - 1] + Hop;
  std::snprintf(label, sizeof label, "Stft<%d, %d>: a frame is handed over every hop, from the first sample", Frame,
                Hop);
  EXPECT(every_hop, label);

  bool moved = late.at.size() == straight.at.size() || late.at.size() + 1 == straight.at.size();
  for (size_t f = 0; f < late.at.size() && f < straight.at.size(); ++f) {
    moved = moved && late.at[f] == straight.at[f] + static_cast<size_t>(Stft::kMaxStagger);
  }
  bool moved_between = true;
  for (size_t f = 0; f < between.at.size() && f < straight.at.size(); ++f) {
    moved_between = moved_between && between.at[f] == straight.at[f] + static_cast<size_t>(Hop / 8 + 3);
  }
  std::snprintf(label, sizeof label, "Stft<%d, %d>: the stagger moves the work by that many samples", Frame, Hop);
  EXPECT(moved && moved_between, label);

  // The frames themselves are the same stretch of input, so the same floats,
  // under the same numbers.
  const size_t shared = late.spectrum.size();
  std::snprintf(label, sizeof label, "Stft<%d, %d>: a staggered channel sees the very same frames", Frame, Hop);
  EXPECT(shared > 0 && shared <= straight.spectrum.size() &&
             std::memcmp(late.spectrum.data(), straight.spectrum.data(), shared * sizeof(float)) == 0,
         label);
  bool numbered = true;
  for (size_t f = 0; f < late.number.size(); ++f) {
    numbered = numbered && late.number[f] == f && straight.number[f] == f && between.number[f] == f;
  }
  std::snprintf(label, sizeof label, "Stft<%d, %d>: frame() numbers them alike whatever the stagger", Frame, Hop);
  EXPECT(numbered, label);

  std::snprintf(label, sizeof label, "Stft<%d, %d>: the stagger does not move the output, not by a bit", Frame, Hop);
  EXPECT(late.out == straight.out && between.out == straight.out && rms(straight.out) > 0.01, label);

  // What it is for: with one channel at 0 and the other at kMaxStagger, no
  // 128-sample block holds a frame of each.
  if (Hop >= 256) {
    bool apart = true;
    for (size_t f = 0; f < late.at.size(); ++f) {
      for (size_t g = (f > 0 ? f - 1 : 0); g < straight.at.size() && g <= f + 1; ++g) {
        apart = apart && late.at[f] / 128 != straight.at[g] / 128;
      }
    }
    std::snprintf(label, sizeof label, "Stft<%d, %d>: two channels half a hop apart never transform in one block",
                  Frame, Hop);
    EXPECT(apart, label);
  }

  Stft& stft = instance<Frame, Hop>();
  stft.init(1000000);
  const bool high = stft.stagger() == Stft::kMaxStagger;
  stft.init(-7);
  std::snprintf(label, sizeof label, "Stft<%d, %d>: a stagger out of range is brought into it", Frame, Hop);
  EXPECT(high && stft.stagger() == 0, label);
}

void test_stagger() {
  check_stagger<1024, 256>();
  check_stagger<2048, 512>();
  check_stagger<4096, 1024>();
  check_stagger<1024, 128>();
}

// --- analysis only -----------------------------------------------------------------------------

void test_analysis_only() {
  using Stft = kit::Stft<2048, 512>;
  Stft& whole = instance<2048, 512>();
  Stft& half = instance<2048, 512, 1>();
  whole.init(100);
  half.init(100);
  rng_state() = 0xA1A5u;
  const std::vector<float> in = noise(0.5f, kRate, 0.7f);
  std::vector<float> seen_whole, seen_half;
  std::vector<uint32_t> numbers_whole, numbers_half;
  for (float x : in) {
    whole.process(x, [&](float* re, float* im) {
      seen_whole.insert(seen_whole.end(), re, re + Stft::kBins);
      seen_whole.insert(seen_whole.end(), im, im + Stft::kBins);
      numbers_whole.push_back(whole.frame());
    });
    half.analyse(x, [&](const float* re, const float* im) {
      seen_half.insert(seen_half.end(), re, re + Stft::kBins);
      seen_half.insert(seen_half.end(), im, im + Stft::kBins);
      numbers_half.push_back(half.frame());
    });
  }
  // (Two instantiations of the transform: the same floats wherever the
  // compiler does not fuse a multiply and an add in one and not the other.)
  double apart = 0.0;
  for (size_t i = 0; i < seen_half.size() && i < seen_whole.size(); ++i) {
    apart = std::max(apart, std::fabs(static_cast<double>(seen_half[i]) - seen_whole[i]));
  }
  EXPECT(!seen_half.empty() && seen_half.size() == seen_whole.size() && apart < 1.0e-6 * Stft::kFullScale &&
             numbers_half == numbers_whole,
         "analyse() hands over the frames process() does, on the same samples");
}

// --- sleep -------------------------------------------------------------------------------------

template <int Frame, int Hop>
void check_sleep() {
  using Stft = kit::Stft<Frame, Hop>;
  Stft& stft = instance<Frame, Hop>();
  char label[200];
  rng_state() = 0x51EEu;
  const std::vector<float> before = noise(0.3f, kRate, 0.7f);
  const std::vector<float> after = noise(0.3f, kRate, 0.7f);
  // One closure for every sample of every render, so that all of them are
  // the same code.
  auto step = [&](float x) { return stft.process(x, [&](float* re, float* im) { scramble(stft, re, im); }); };
  auto feed = [&](const std::vector<float>& in, std::vector<float>* out) {
    for (float x : in) out->push_back(step(x));
  };
  auto rest = [&](int samples, std::vector<float>* out) {
    for (int i = 0; i < samples; ++i) out->push_back(step(0.0f));
  };
  // Enough silence for every frame in flight to have played out.
  const int drain = 2 * Frame + Hop;

  // Awake all through a silence, against asleep for most of it: skip() for
  // the samples slept through, at whatever length and in whatever pieces.
  bool same = true;
  for (int slept : {1, 77, Hop, Frame + 131, 5 * Frame + 3, 1000003}) {
    std::vector<float> awake, asleep;
    stft.init();
    feed(before, &awake);
    rest(drain + slept, &awake);
    feed(after, &awake);

    stft.init();
    feed(before, &asleep);
    rest(drain, &asleep);
    int left = slept;
    for (int piece : {128, 1, 2048, 33}) {
      const int now = piece < left ? piece : left;
      stft.skip(now);
      left -= now;
    }
    stft.skip(left);
    stft.skip(0);
    stft.skip(-5);
    asleep.insert(asleep.end(), static_cast<size_t>(slept), 0.0f);
    feed(after, &asleep);
    same = same && awake == asleep;
  }
  std::snprintf(label, sizeof label,
                "Stft<%d, %d>: skip() over a silence leaves the frames where staying awake would, bit for bit", Frame,
                Hop);
  EXPECT(same, label);

  // Without skip() the clock stands still while asleep and the frames after
  // the silence fall elsewhere: the difference skip() is there to remove.
  {
    std::vector<float> awake, stopped;
    stft.init();
    feed(before, &awake);
    rest(drain + 77, &awake);
    feed(after, &awake);
    stft.init();
    feed(before, &stopped);
    rest(drain, &stopped);
    stopped.insert(stopped.end(), 77, 0.0f);
    feed(after, &stopped);
    std::snprintf(label, sizeof label, "Stft<%d, %d>: (and without skip() they do not)", Frame, Hop);
    EXPECT(awake != stopped, label);
  }

  // Skipped past in mid flight, nothing of the old sound comes back.
  stft.init();
  std::vector<float> scrap;
  feed(before, &scrap);
  stft.skip(2 * Frame);
  double left_over = 0.0;
  for (int i = 0; i < 4 * Frame; ++i) {
    left_over = std::max(left_over, std::fabs(static_cast<double>(stft.process(0.0f, [](float*, float*) {}))));
    left_over = std::max(left_over, std::fabs(static_cast<double>(stft.dry())));
  }
  std::snprintf(label, sizeof label, "Stft<%d, %d>: a skip of two frames or more leaves nothing of the old sound",
                Frame, Hop);
  EXPECT(left_over == 0.0, label);
}

void test_sleep() {
  check_sleep<1024, 256>();
  check_sleep<2048, 512>();
  check_sleep<4096, 1024>();
}

// --- input that is not sound -------------------------------------------------------------------

void test_bad_input() {
  using Stft = kit::Stft<2048, 512>;
  Stft& stft = instance<2048, 512>();
  stft.init();
  rng_state() = 0xBADu;
  std::vector<float> in = noise(1.0f, kRate, 0.5f);
  const std::vector<float> good = in;
  const float inf = std::numeric_limits<float>::infinity();
  const float poison[] = {std::nanf(""), inf, -inf, 1.0e30f, -1.0e30f, 64.0f, -1.0e-30f, 1.0e-20f};
  const size_t first = 9000;
  for (size_t i = 0; i < sizeof poison / sizeof poison[0]; ++i) in[first + 37 * i] = poison[i];
  bool all_finite = true, spectrum_finite = true, dry_zero = true;
  std::vector<float> out(in.size());
  for (size_t i = 0; i < in.size(); ++i) {
    out[i] = stft.process(in[i], [&](float* re, float* im) {
      for (int k = 0; k < Stft::kBins; ++k)
        spectrum_finite = spectrum_finite && std::isfinite(re[k]) && std::isfinite(im[k]);
    });
    all_finite = all_finite && std::isfinite(out[i]) && std::isfinite(stft.dry());
    const size_t source = i - static_cast<size_t>(Stft::kLatency);
    if (i >= static_cast<size_t>(Stft::kLatency) && in[source] != good[source])
      dry_zero = dry_zero && stft.dry() == 0.0f;
  }
  EXPECT(spectrum_finite, "NaN, infinite and runaway samples never reach the spectrum");
  EXPECT(all_finite, "nor the output, nor the dry path");
  EXPECT(dry_zero, "they go in as zero, and so does what is too small to be sound");
  // Each took one sample's place; everything else is untouched.
  double worst = 0.0;
  for (size_t i = 0; i + Stft::kLatency < out.size(); ++i) {
    const double expected = in[i] == good[i] ? good[i] : 0.0;
    worst = std::max(worst, std::fabs(static_cast<double>(out[i + Stft::kLatency]) - expected));
  }
  EXPECT(worst < 1.0e-5, "and the sound around them comes out as it went in");
}

// --- cost --------------------------------------------------------------------------------------

template <int Frame, int Hop>
void report_stft_cost() {
  using Stft = kit::Stft<Frame, Hop>;
  Stft& stft = instance<Frame, Hop>();
  const float seconds = 10.0f;
  rng_state() = 0xC057u;
  const std::vector<float> in = noise(seconds, kRate, 0.25f);
  const size_t blocks = in.size() / 128;
  char name[64];
  std::snprintf(name, sizeof name, "kit::Stft<%d, %d>", Frame, Hop);

  // As report_cost times a device: one channel, a callable that changes
  // nothing. Timed in stretches of 256 blocks (a whole number of frames at
  // every size) and the fastest kept, so that a busy machine does not count.
  float sum = 0.0f;
  const size_t stretch = 256;
  auto timed = [&](bool resynthesise) {
    stft.init();
    double fastest = 1.0e30;
    for (size_t first = 0; first + stretch <= blocks; first += stretch) {
      const auto start = std::chrono::steady_clock::now();
      for (size_t b = first; b < first + stretch; ++b) {
        const float* block = in.data() + b * 128;
        if (resynthesise) {
          for (int i = 0; i < 128; ++i) sum += stft.process(block[i], [](float*, float*) {});
        } else {
          for (int i = 0; i < 128; ++i) stft.analyse(block[i], [&](const float* re, const float*) { sum += re[1]; });
        }
      }
      const auto elapsed = std::chrono::steady_clock::now() - start;
      fastest = std::min(fastest, std::chrono::duration<double, std::micro>(elapsed).count());
    }
    return fastest / static_cast<double>(stretch);
  };
  double whole = 1.0e30, analysis = 1.0e30;
  for (int repeat = 0; repeat < 3; ++repeat) {
    whole = std::min(whole, timed(true));
    analysis = std::min(analysis, timed(false));
  }
  const double block_micros = 128.0 / kRate * 1.0e6;
  std::printf("%s cost: %.2f us per 128-frame block of one channel, %.3f%% of real time at %.0f kHz (native)\n", name,
              whole, 100.0 * whole / block_micros, kRate / 1000.0);
  std::printf(
      "%s analysis only: %.2f us per 128-frame block of one channel, %.3f%% of real time at %.0f kHz (native)\n", name,
      analysis, 100.0 * analysis / block_micros, kRate / 1000.0);

  // One frame: the blocks that hold one against those that hold none (the
  // median of each, which the scheduler does not reach).
  stft.init();
  std::vector<double> with, without;
  for (size_t b = 0; b < blocks; ++b) {
    const float* block = in.data() + b * 128;
    const auto start = std::chrono::steady_clock::now();
    for (int i = 0; i < 128; ++i) sum += stft.process(block[i], [](float*, float*) {});
    const double micros = std::chrono::duration<double, std::micro>(std::chrono::steady_clock::now() - start).count();
    ((b * 128) % Hop == 0 ? with : without).push_back(micros);
  }
  std::sort(with.begin(), with.end());
  if (!without.empty()) {
    std::sort(without.begin(), without.end());
    const double frame = with[with.size() / 2] - without[without.size() / 2];
    std::printf("%s frame: %.1f us for the two transforms and the overlap-add, %.2f%% of the block they fall in\n",
                name, frame, 100.0 * frame / block_micros);
  }
  EXPECT(std::isfinite(sum), "the timed renders are finite");
}

void test_cost() {
  report_stft_cost<1024, 256>();
  report_stft_cost<2048, 512>();
  report_stft_cost<4096, 1024>();
  report_stft_cost<2048, 256>();
}

}  // namespace

int main() {
  test_phase_helpers();
  test_identity();
  test_spectrum();
  test_filter();
  test_reinit();
  test_stagger();
  test_analysis_only();
  test_sleep();
  test_bad_input();
  test_cost();
  if (failures() == 0) {
    std::printf("stft tests: all passed\n");
    return 0;
  }
  std::printf("stft tests: %d FAILED\n", failures());
  return 1;
}
