// Native harness for Reveal (cpp/devices/reveal). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it an upward compressor of the spectrum: what
// is quiet under something loud comes up by Amount of its deficit, never by
// more than Range, never from under Floor, over the time Rise says, with the
// overall level held and the dry path in step.

#include "../devices/reveal/reveal.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Reveal;
namespace p = livemix::reveal;

static Reveal device;

static const float kRate = 48000.0f;
static const size_t kLate = Reveal::kLatency;

// The constants the device's comment states, for the sums below.
static const double kAroundDbPerOctave = 3.0;

static std::vector<float> add(const std::vector<float>& a, const std::vector<float>& b) {
  std::vector<float> out(std::max(a.size(), b.size()), 0.0f);
  for (size_t i = 0; i < a.size(); ++i) out[i] += a[i];
  for (size_t i = 0; i < b.size(); ++i) out[i] += b[i];
  return out;
}

// What the device does to the tone at `hz`, in dB, over [from, to) of the
// input (the output read a latency later).
static double change_db(const std::vector<float>& in, const std::vector<float>& out, double hz, size_t from,
                        size_t to) {
  return db(tone_level(out, hz, kRate, from + kLate, to + kLate) / tone_level(in, hz, kRate, from, to));
}

struct Setting {
  int id;
  float value;
};

static void set_up(Reveal& d, std::initializer_list<Setting> settings, float rate = kRate) {
  d.init(rate);
  for (const Setting& s : settings) d.set_param(s.id, s.value);
}

// A loud sine and a quiet one `below_db` under it, `seconds` long.
static std::vector<float> two_tones(double loud_hz, double quiet_hz, double below_db, float seconds,
                                    float loud = 0.5f) {
  return add(sine(static_cast<float>(loud_hz), seconds, kRate, loud),
             sine(static_cast<float>(quiet_hz), seconds, kRate,
                  loud * static_cast<float>(std::pow(10.0, -below_db / 20.0))));
}

// The largest lift among the bands, read back out of the display's readings
// as the display reads them.
static double packed_lift(const Reveal& d, int band) {
  long packed = std::lround(d.meter(2 + band / Reveal::kBandsPerReading));
  for (int i = 0; i < band % Reveal::kBandsPerReading; ++i) packed /= Reveal::kSteps;
  return (packed % Reveal::kSteps) * Reveal::kLiftStepDb;
}
static double packed_level(const Reveal& d, int band) {
  long packed = std::lround(d.meter(2 + Reveal::kReadings + band / Reveal::kBandsPerReading));
  for (int i = 0; i < band % Reveal::kBandsPerReading; ++i) packed /= Reveal::kSteps;
  return Reveal::kLevelFootDb + (packed % Reveal::kSteps) * Reveal::kLevelStepDb;
}
static int band_of(const Reveal& d, double hz) {
  int best = 0;
  for (int b = 1; b < d.bands(); ++b) {
    if (std::fabs(std::log(d.band_hz(b) / hz)) < std::fabs(std::log(d.band_hz(best) / hz))) best = b;
  }
  return best;
}

int main() {
  Conformance spec;
  spec.name = "reveal";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 4.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // --- The bands -----------------------------------------------------------------------
  {
    device.init(kRate);
    std::printf("bands at 48 kHz: %d, from %.1f Hz to %.1f Hz\n", device.bands(), device.band_hz(0),
                device.band_hz(device.bands() - 1));
    EXPECT(device.bands() == 85, "85 bands at 48 kHz");
    EXPECT_NEAR(device.band_hz(0), 46.875, 0.01, "the first band is the bin at 46.9 Hz");
    bool rising = true;
    for (int b = 1; b < device.bands(); ++b) rising = rising && device.band_hz(b) > device.band_hz(b - 1);
    EXPECT(rising, "band centres rise");
    for (float rate : {22050.0f, 32000.0f, 44100.0f, 88200.0f, 96000.0f, 192000.0f}) {
      device.init(rate);
      EXPECT(device.bands() >= 40 && device.bands() <= Reveal::kMaxBands, "the bands fit at every sample rate");
      EXPECT(device.band_hz(device.bands() - 1) <= 20000.0f, "and stop at 20 kHz");
    }
  }

  // --- A loud sine and a quiet one 40 dB under it, four octaves away ---------------------
  // The deficit is 40 dB less 3 dB an octave: 28 dB. Amount 0.5 lifts the
  // quiet one by 14 dB and leaves the loud one where it is.
  {
    const std::vector<float> in = two_tones(220.0, 3520.0, 40.0, 6.0f);
    const size_t from = 4 * 48000, to = 5 * 48000;
    for (float amount : {0.25f, 0.5f, 1.0f}) {
      set_up(device, {{p::kAmount, amount}, {p::kRange, 30.0f}, {p::kDetail, 1.0f}, {p::kRise, 100.0f}});
      const Stereo out = run(device, in);
      const double quiet = change_db(in, out.left, 3520.0, from, to);
      const double loud = change_db(in, out.left, 220.0, from, to);
      const double expected = amount * (40.0 - 4.0 * kAroundDbPerOctave);
      std::printf("amount %.2f: quiet %+.2f dB (expected %+.2f), loud %+.2f dB, lift meter %.2f, hold %.3f dB\n",
                  amount, quiet, expected, loud, device.meter(0), device.meter(1));
      EXPECT_NEAR(quiet, expected, 0.6, "the quiet sine is lifted by Amount of its deficit");
      EXPECT(std::fabs(loud) < 0.5, "the loud sine stays within 0.5 dB");
      EXPECT_NEAR(device.meter(0), expected, 0.5, "the lift meter reads the lift");
      const int band = band_of(device, 3520.0);
      EXPECT_NEAR(packed_lift(device, band), device.lift_db(band), 0.26, "the display's reading is the band's lift");
      EXPECT_NEAR(packed_level(device, band_of(device, 220.0)), db(0.5), 2.6, "and its level the band's level");
    }
  }

  // --- One sine alone, at any pitch: there is nothing under it to lift -------------------
  // What its window spills into the bins around it is not a quiet sound.
  {
    double most = 0.0, worst = 0.0;
    for (int n = 0; n < 60; ++n) {
      const double hz = 55.0 * std::pow(2.0, n / 7.3);  // 55 Hz to 14.9 kHz, on no grid
      const std::vector<float> in = sine(static_cast<float>(hz), 1.5f, kRate, 0.9f);
      set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, -96.0f}, {p::kDetail, 1.0f},
                      {p::kRise, 20.0f}});
      const Stereo out = run(device, in);
      most = std::max(most, static_cast<double>(device.meter(0)));
      worst = std::max(worst, std::fabs(change_db(in, out.left, hz, 36000, 60000)));
    }
    std::printf("one sine alone, 60 pitches, everything up: most lift %.2f dB, worst change %.3f dB\n", most, worst);
    EXPECT(most == 0.0, "one sine alone is lifted nowhere, at any pitch");
    EXPECT(worst < 0.05, "and comes out as it went in");
  }

  // --- The lift never exceeds Range ------------------------------------------------------
  {
    const std::vector<float> in = two_tones(220.0, 3520.0, 60.0, 4.0f);
    for (float range : {0.0f, 6.0f, 12.0f, 30.0f}) {
      set_up(device, {{p::kAmount, 1.0f}, {p::kRange, range}, {p::kFloor, -96.0f}, {p::kDetail, 1.0f},
                      {p::kRise, 100.0f}});
      const Stereo out = run(device, in);
      const double quiet = change_db(in, out.left, 3520.0, 2 * 48000, 3 * 48000);
      std::printf("range %4.1f dB: a sine 60 dB down is lifted %+.2f dB, meter %.2f\n", range, quiet, device.meter(0));
      EXPECT(quiet < range + 0.1 && device.meter(0) <= range + 1.0e-4, "the lift never exceeds Range");
      EXPECT(quiet > range - 0.5, "and reaches it when the deficit is large");
    }
  }

  // --- Under Floor nothing is lifted -----------------------------------------------------
  {
    // The quiet sine stands at -66 dBFS: over a floor of -80, under one of -55.
    const std::vector<float> in = two_tones(220.0, 3520.0, 60.0, 4.0f);
    double lifted[2];
    int n = 0;
    for (float floor : {-80.0f, -55.0f}) {
      set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, floor}, {p::kDetail, 1.0f},
                      {p::kRise, 100.0f}});
      const Stereo out = run(device, in);
      lifted[n++] = change_db(in, out.left, 3520.0, 2 * 48000, 3 * 48000);
    }
    std::printf("a sine at -66 dBFS: lifted %+.2f dB over a floor of -80, %+.2f dB under one of -55\n", lifted[0],
                lifted[1]);
    EXPECT(lifted[0] > 20.0, "over Floor it is lifted");
    EXPECT(std::fabs(lifted[1]) < 0.05, "under Floor it is left where it is");

    // The fade over the 6 dB above Floor: half way up it, half the lift.
    set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 12.0f}, {p::kFloor, -69.0f}, {p::kDetail, 1.0f},
                    {p::kRise, 100.0f}});
    const Stereo knee = run(device, in);
    const double half = change_db(in, knee.left, 3520.0, 2 * 48000, 3 * 48000);
    std::printf("3 dB over Floor: lifted %+.2f dB of 12\n", half);
    EXPECT_NEAR(half, 6.0, 1.0, "3 dB over Floor it gets half the lift");

    // Noise at -90 dBFS stays there, at every setting that could raise it.
    rng_state() = 4242;
    const std::vector<float> hiss = noise(3.0f, kRate, 5.4772e-5f);  // uniform: rms is 0.577 of the peak
    set_up(device, {{p::kAmount, 1.0f}, {p::kRange, 30.0f}, {p::kFloor, -96.0f}, {p::kDetail, 1.0f},
                    {p::kRise, 20.0f}});
    const Stereo out = run(device, hiss);
    const double in_db = db(rms(hiss, 48000, 96000));
    const double out_db = db(rms(out.left, 48000 + kLate, 96000 + kLate));
    std::printf("noise at %.1f dBFS comes out at %.1f dBFS, lift meter %.2f\n", in_db, out_db, device.meter(0));
    EXPECT(std::fabs(in_db + 90.0) < 0.2, "the noise is at -90 dBFS");
    EXPECT(std::fabs(out_db - in_db) < 0.05 && device.meter(0) == 0.0, "noise at -90 dBFS stays there");

    // Silence stays silent, to the last bit.
    device.init(kRate);
    const Stereo quiet = render(device, 1.0f, kRate);
    EXPECT(peak(quiet.left) == 0.0 && peak(quiet.right) == 0.0, "silence in, silence out");
  }

  return finish("reveal");
}
