// Native harness for Noise Floor (cpp/devices/noise-floor). The conformance
// pass covers stability, silence when idle, block-size independence and
// parameter abuse; the rest asserts what makes it a noise floor: the dry
// signal untouched, the level its control says, each bed's spectrum, Follow
// in both directions, the stereo image, the cross-fade between types and the
// hold after the last note.

#include <cstdlib>

#include "../devices/noise-floor/noise_floor.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::NoiseFloor;
namespace p = livemix::noise_floor;

static NoiseFloor device;

static const float kRate = 48000.0f;
static const int kTypes = NoiseFloor::kTypes;
static const char* const kTypeName[kTypes] = {"Tape hiss", "Vinyl", "Room", "Hum 50",
                                              "Hum 60",    "Static", "Air"};

// A device with nothing moving: one type at a known level, long hold.
static void still(NoiseFloor& d, int type, float level_db, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kType, static_cast<float>(type));
  d.set_param(p::kLevel, level_db);
  d.set_param(p::kMovement, 0.0f);
  d.set_param(p::kWidth, 1.0f);
  d.set_param(p::kHold, 60.0f);
}

// The noise alone: a click wakes the device, then `seconds` of its hold are
// rendered with no input. The first 0.2 s (the fade in) is dropped.
static Stereo noise_only(NoiseFloor& d, float seconds, float rate = kRate) {
  run(d, impulse(0.2f, rate, 0.001f));
  return render(d, seconds, rate);
}

// The same, at Width 1, as the noise of one side only.
static std::vector<float> bed(int type, float level_db, float seconds, float rate = kRate) {
  still(device, type, level_db, rate);
  return noise_only(device, seconds, rate).left;
}

static Stereo minus(const Stereo& out, const std::vector<float>& left, const std::vector<float>& right) {
  Stereo n = out;
  for (size_t i = 0; i < n.size(); ++i) {
    n.left[i] -= left[i];
    n.right[i] -= right[i];
  }
  return n;
}

// Mean power of `x` between `lo` and `hi` Hz, through fourth-order filters.
static double band_power(const std::vector<float>& x, double lo, double hi, double rate = kRate) {
  livemix::kit::Svf high[2], low[2];
  const float q[2] = {0.5412f, 1.3066f};  // Butterworth, fourth order
  for (int s = 0; s < 2; ++s) {
    high[s].set(static_cast<float>(lo), q[s], static_cast<float>(rate));
    low[s].set(static_cast<float>(hi), q[s], static_cast<float>(rate));
  }
  double sum = 0.0;
  for (float v : x) {
    float y = v;
    if (lo > 0.0) y = high[1].highpass(high[0].highpass(y));
    if (hi < 0.49 * rate) y = low[1].lowpass(low[0].lowpass(y));
    sum += static_cast<double>(y) * y;
  }
  return sum / static_cast<double>(x.size());
}

// Power per hertz in a band, in dB.
static double density_db(const std::vector<float>& x, double lo, double hi) {
  return 10.0 * std::log10(std::max(1.0e-30, band_power(x, lo, hi) / (hi - lo)));
}

// RMS of consecutive windows, in dB.
static std::vector<double> envelope_db(const std::vector<float>& x, float window_seconds, float rate = kRate) {
  const size_t window = static_cast<size_t>(window_seconds * rate);
  std::vector<double> out;
  for (size_t at = 0; at + window <= x.size(); at += window) out.push_back(db(rms(x, at, at + window)));
  return out;
}

static double pearson(const std::vector<double>& a, const std::vector<double>& b) {
  const size_t n = std::min(a.size(), b.size());
  double ma = 0.0, mb = 0.0;
  for (size_t i = 0; i < n; ++i) {
    ma += a[i];
    mb += b[i];
  }
  ma /= n;
  mb /= n;
  double sab = 0.0, saa = 0.0, sbb = 0.0;
  for (size_t i = 0; i < n; ++i) {
    sab += (a[i] - ma) * (b[i] - mb);
    saa += (a[i] - ma) * (a[i] - ma);
    sbb += (b[i] - mb) * (b[i] - mb);
  }
  return (saa > 0.0 && sbb > 0.0) ? sab / std::sqrt(saa * sbb) : 0.0;
}

// Events per second: runs of samples above `times` the RMS, at least 2 ms apart.
static double events_per_second(const std::vector<float>& x, double times, float rate = kRate) {
  const double threshold = times * rms(x);
  const size_t gap = static_cast<size_t>(0.002f * rate);
  size_t count = 0, last = 0;
  bool any = false;
  for (size_t i = 0; i < x.size(); ++i) {
    if (std::fabs(x[i]) > threshold) {
      if (!any || i - last > gap) ++count;
      last = i;
      any = true;
    }
  }
  return static_cast<double>(count) * rate / static_cast<double>(x.size());
}

int main() {
  Conformance spec;
  spec.name = "noise-floor";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 7.5f;  // the default Hold of 6 s, the half-second fade, and a margin
  spec.max_peak = 2.0f;      // full-scale input plus noise that is clipped at 1
  check_effect(device, spec, kRate);

  // Set VERBOSE=1 to print what each check measured.
  const bool verbose = std::getenv("VERBOSE") != nullptr;
  char label[200];

  // 1. The dry signal is untouched. With Follow 0 the noise does not depend
  // on the input (Air has no modulation noise), so doubling the input changes
  // the output by exactly the input; and what is added is not correlated
  // with what was played, for every type.
  {
    rng_state() = 0xA11CEu;
    std::vector<float> x = noise(2.0f, kRate, 0.2f);
    std::vector<float> twice = x;
    for (float& v : twice) v *= 2.0f;
    still(device, NoiseFloor::kAir, -30.0f);
    Stereo one = run(device, x);
    still(device, NoiseFloor::kAir, -30.0f);
    Stereo two = run(device, twice);
    double worst = 0.0;
    for (size_t i = 0; i < x.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(two.left[i]) - one.left[i] - x[i]));
    }
    EXPECT(worst < 2.0e-7, "the dry path has a gain of exactly one and the noise ignores the input");
    double worst_corr = 0.0, worst_level = 0.0;
    for (int t = 0; t < kTypes; ++t) {
      still(device, t, -30.0f);
      std::vector<float> tone = sine(330.0f, 6.0f, kRate, 0.2f);
      Stereo n = minus(run(device, tone), tone, tone);
      const double c = correlation(n.left, tone, 24000);
      worst_corr = std::max(worst_corr, std::fabs(c));
      // Tape hiss gains its modulation noise under a signal; the rest must not move.
      if (t != NoiseFloor::kTape) worst_level = std::max(worst_level, std::fabs(db(rms(n.left, 24000)) + 30.0));
      std::snprintf(label, sizeof label, "%s: what is added is not correlated with the input (%.4f)",
                    kTypeName[t], c);
      EXPECT(std::fabs(c) < 0.03, label);
    }
    EXPECT(worst_level < 1.5, "under a steady tone the noise is at Level, as in silence");
    if (verbose) {
      std::printf("dry: doubling error %.2e, worst |corr| with input %.4f, level error under a tone %.2f dB\n",
                  worst, worst_corr, worst_level);
    }
  }

  // 2. Level reads the noise's RMS in dBFS, dB for dB, for every type (Tone 0,
  // nothing moving), and the same at 44.1 and 96 kHz.
  for (int t = 0; t < kTypes; ++t) {
    double got[3];
    const float levels[3] = {-60.0f, -42.0f, -24.0f};
    for (int k = 0; k < 3; ++k) {
      got[k] = db(rms(bed(t, levels[k], 30.0f)));
      std::snprintf(label, sizeof label, "%s: noise RMS at Level %.0f dB", kTypeName[t], levels[k]);
      EXPECT_NEAR(got[k], levels[k], 1.5, label);
    }
    const double low_rate = db(rms(bed(t, -42.0f, 30.0f, 44100.0f)));
    const double high_rate = db(rms(bed(t, -42.0f, 30.0f, 96000.0f)));
    std::snprintf(label, sizeof label, "%s: the same level at 44.1 kHz", kTypeName[t]);
    EXPECT_NEAR(low_rate, -42.0, 1.5, label);
    std::snprintf(label, sizeof label, "%s: the same level at 96 kHz", kTypeName[t]);
    EXPECT_NEAR(high_rate, -42.0, 1.5, label);
    if (verbose) {
      std::printf("level %-9s  -60: %.2f  -42: %.2f  -24: %.2f   44.1 kHz: %.2f   96 kHz: %.2f\n", kTypeName[t],
                  got[0], got[1], got[2], low_rate, high_rate);
    }
  }

  // 3. Each bed's spectrum is what it claims.
  {
    // Tape hiss rises to about 8 kHz and is level above it.
    std::vector<float> hiss = bed(NoiseFloor::kTape, -30.0f, 20.0f);
    const double rise = density_db(hiss, 6000.0, 9000.0) - density_db(hiss, 500.0, 1000.0);
    const double flat = density_db(hiss, 11000.0, 14000.0) - density_db(hiss, 8000.0, 11000.0);
    EXPECT(rise > 10.0, "tape hiss rises by more than 10 dB from 700 Hz to 7.5 kHz");
    EXPECT(std::fabs(flat) < 3.0, "tape hiss is level from 8 to 14 kHz");

    // Room: most of the energy is below 300 Hz.
    std::vector<float> room = bed(NoiseFloor::kRoom, -30.0f, 30.0f);
    const double room_low = band_power(room, 0.0, 300.0) / band_power(room, 0.0, 24000.0);
    EXPECT(room_low > 0.7, "room: most of the energy is below 300 Hz");

    // Air: most of the energy is above 4 kHz.
    std::vector<float> air = bed(NoiseFloor::kAir, -30.0f, 20.0f);
    const double air_high = band_power(air, 4000.0, 24000.0) / band_power(air, 0.0, 24000.0);
    EXPECT(air_high > 0.8, "air: most of the energy is above 4 kHz");

    // Hum: a line at the mains frequency within 0.1 Hz, its harmonics, and
    // nothing between them. With Movement at full it still holds the pitch.
    double hum_hz[2], hum_drift_hz[2], hum_second[2], hum_between[2];
    for (int k = 0; k < 2; ++k) {
      const double mains = k == 0 ? 50.0 : 60.0;
      std::vector<float> hum = bed(NoiseFloor::kHum50 + k, -30.0f, 20.0f);
      hum_hz[k] = dominant_frequency(hum, kRate, 30.0, 80.0);
      const double first = tone_level(hum, mains, kRate);
      hum_second[k] = db(tone_level(hum, 2.0 * mains, kRate) / first);
      const double third = db(tone_level(hum, 3.0 * mains, kRate) / first);
      hum_between[k] = db(tone_level(hum, 1.5 * mains, kRate) / first);
      std::snprintf(label, sizeof label, "Hum %.0f: the fundamental is at %.0f Hz (%.3f)", mains, mains, hum_hz[k]);
      EXPECT_NEAR(hum_hz[k], mains, 0.1, label);
      EXPECT(hum_second[k] > -12.0 && third > -18.0, "hum: second and third harmonics are there");
      EXPECT(hum_between[k] < -40.0, "hum: nothing between the lines");
      still(device, NoiseFloor::kHum50 + k, -30.0f);
      device.set_param(p::kMovement, 1.0f);
      hum_drift_hz[k] = dominant_frequency(noise_only(device, 20.0f).left, kRate, 30.0, 80.0);
      EXPECT_NEAR(hum_drift_hz[k], mains, 0.1, "hum: Movement drifts the mains by less than 0.1 Hz");
      // Tone at the top is mostly buzz: energy moves above 400 Hz.
      still(device, NoiseFloor::kHum50 + k, -30.0f);
      device.set_param(p::kTone, 1.0f);
      std::vector<float> buzz = noise_only(device, 10.0f).left;
      EXPECT(band_power(buzz, 400.0, 4000.0) > 4.0 * band_power(hum, 400.0, 4000.0),
             "hum: Tone brings up the buzz");
      EXPECT_NEAR(db(rms(buzz)), -30.0, 0.5, "hum: Tone keeps the level");
    }

    // Vinyl and static are made of events: a crest factor far above the
    // steady beds, and ticks at a countable rate.
    std::vector<float> vinyl = bed(NoiseFloor::kVinyl, -42.0f, 40.0f);
    std::vector<float> crackle = bed(NoiseFloor::kStatic, -42.0f, 40.0f);
    const double steady_crest = std::max(db(peak(hiss) / rms(hiss)), db(peak(air) / rms(air)));
    const double vinyl_crest = db(peak(vinyl) / rms(vinyl));
    const double static_crest = db(peak(crackle) / rms(crackle));
    const double vinyl_ticks = events_per_second(vinyl, 5.0);
    const double static_ticks = events_per_second(crackle, 5.0);
    EXPECT(steady_crest < 14.0, "hiss and air are steady (crest under 14 dB)");
    EXPECT(vinyl_crest > steady_crest + 6.0, "vinyl: crest factor well above the steady beds");
    EXPECT(static_crest > steady_crest + 6.0, "static: crest factor well above the steady beds");
    EXPECT(vinyl_ticks > 1.0 && vinyl_ticks < 30.0, "vinyl: a few ticks a second stand out of the hiss");
    EXPECT(static_ticks > 1.0 && static_ticks < 60.0, "static: crackles stand out of the hiss");
    EXPECT(events_per_second(hiss, 5.0) < 0.2, "tape hiss has no ticks");
    if (verbose) {
      std::printf("spectra: tape rise %.1f dB, 8-14 kHz %.1f dB; room below 300 Hz %.0f%%; air above 4 kHz %.0f%%\n",
                  rise, flat, 100.0 * room_low, 100.0 * air_high);
      std::printf("hum: %.3f / %.3f Hz, with Movement 1 %.3f / %.3f Hz, 2nd harmonic %.1f / %.1f dB, between lines %.1f / %.1f dB\n",
                  hum_hz[0], hum_hz[1], hum_drift_hz[0], hum_drift_hz[1], hum_second[0], hum_second[1],
                  hum_between[0], hum_between[1]);
      std::printf("events: crest steady %.1f, vinyl %.1f, static %.1f dB; ticks over 5x RMS vinyl %.1f/s, static %.1f/s\n",
                  steady_crest, vinyl_crest, static_crest, vinyl_ticks, static_ticks);
    }
  }

  // 4. Follow. Six notes of one second at -12 dBFS with gaps of a second and
  // a half; the noise is what is left when the input is taken away, and its
  // envelope is compared with the input's in windows of 50 ms.
  {
    std::vector<float> phrase;
    for (int n = 0; n < 6; ++n) {
      std::vector<float> note = sine(220.0f, 1.0f, kRate, 0.25f);
      phrase.insert(phrase.end(), note.begin(), note.end());
      phrase.resize(phrase.size() + static_cast<size_t>(1.5f * kRate), 0.0f);
    }
    const size_t cycle = static_cast<size_t>(2.5f * kRate);
    auto under = [&](const std::vector<float>& n) {  // the last half second of each note
      double sum = 0.0;
      for (int k = 1; k < 6; ++k) sum += rms(n, k * cycle + 24000, k * cycle + 48000);
      return db(sum / 5.0);
    };
    auto between = [&](const std::vector<float>& n) {  // the last half second of each gap
      double sum = 0.0;
      for (int k = 1; k < 6; ++k) sum += rms(n, k * cycle + 96000, k * cycle + 120000);
      return db(sum / 5.0);
    };
    auto linear = [](std::vector<double> e) {
      for (double& v : e) v = std::pow(10.0, v / 20.0);
      return e;
    };
    const std::vector<double> input_env = linear(envelope_db(phrase, 0.05f));
    double on[3], off[3], corr[3];
    const float follows[3] = {1.0f, 0.0f, -1.0f};
    for (int k = 0; k < 3; ++k) {
      still(device, NoiseFloor::kAir, -30.0f);
      device.set_param(p::kFollow, follows[k]);
      device.set_param(p::kResponse, 0.1f);
      std::vector<float> n = minus(run(device, phrase), phrase, phrase).left;
      on[k] = under(n);
      off[k] = between(n);
      corr[k] = pearson(linear(envelope_db(n, 0.05f)), input_env);
    }
    EXPECT(corr[0] > 0.8, "Follow +1: the noise's envelope follows the input's");
    EXPECT_NEAR(on[0], -30.0, 1.5, "Follow +1: under a note at -12 dBFS the noise is at Level");
    EXPECT(off[0] < on[0] - 30.0, "Follow +1: at least 30 dB lower in silence");
    EXPECT(std::fabs(on[1] - off[1]) < 0.5 && std::fabs(corr[1]) < 0.2, "Follow 0: the noise is constant");
    EXPECT(corr[2] < -0.8, "Follow -1: the noise's envelope mirrors the input's");
    EXPECT_NEAR(off[2], -30.0, 1.0, "Follow -1: in the gaps the noise comes back up to Level");
    EXPECT(off[2] > on[2] + 10.0, "Follow -1: at least 10 dB higher in the gaps than under a note");

    // Response: after a note stops, the noise that rode on it falls to 1/e
    // (8.7 dB down) in about the Response time.
    double fall[2];
    const float responses[2] = {0.1f, 1.0f};
    for (int k = 0; k < 2; ++k) {
      still(device, NoiseFloor::kAir, -30.0f);
      device.set_param(p::kFollow, 1.0f);
      device.set_param(p::kResponse, responses[k]);
      std::vector<float> note = sine(220.0f, 3.0f, kRate, 0.125f);
      note.resize(note.size() + static_cast<size_t>(3.0f * kRate), 0.0f);
      std::vector<float> n = minus(run(device, note), note, note).left;
      const float window = 0.02f * responses[k];
      const std::vector<double> env = envelope_db(n, window);
      const size_t stop = static_cast<size_t>(3.0f / window);
      double steady = 0.0;
      for (size_t i = stop - 50; i < stop; ++i) steady += env[i] / 50.0;
      size_t at = stop;
      while (at < env.size() && env[at] > steady - 8.686) ++at;
      fall[k] = static_cast<double>(at - stop) * window;
      std::snprintf(label, sizeof label, "Response %.1f s: the noise falls to 1/e in %.3f s", responses[k], fall[k]);
      EXPECT(fall[k] > 0.7 * responses[k] && fall[k] < 1.5 * responses[k], label);
    }
    if (verbose) {
      std::printf("follow +1: under %.1f dB, gaps %.1f dB, envelope corr %.2f | 0: %.1f / %.1f dB, corr %.2f | -1: under %.1f dB, gaps %.1f dB, corr %.2f\n",
                  on[0], off[0], corr[0], on[1], off[1], corr[1], on[2], off[2], corr[2]);
      std::printf("response: set 0.1 s fell in %.3f s, set 1.0 s fell in %.3f s\n", fall[0], fall[1]);
    }
  }

  // 5. The image. At Width 1 the sides are unrelated for every type, at
  // Width 0 they are the same signal, and the level does not change between.
  {
    double worst_wide = 0.0, worst_level = 0.0;
    for (int t = 0; t < kTypes; ++t) {
      still(device, t, -30.0f);
      Stereo wide = noise_only(device, 20.0f);
      still(device, t, -30.0f);
      device.set_param(p::kWidth, 0.0f);
      Stereo mono = noise_only(device, 20.0f);
      const double c = correlation(wide.left, wide.right);
      worst_wide = std::max(worst_wide, std::fabs(c));
      worst_level = std::max(worst_level, std::fabs(db(rms(mono.left) / rms(wide.left))));
      std::snprintf(label, sizeof label, "%s: left and right are unrelated at Width 1 (%.3f)", kTypeName[t], c);
      EXPECT(std::fabs(c) < 0.2, label);
      std::snprintf(label, sizeof label, "%s: mono at Width 0", kTypeName[t]);
      EXPECT(mono.left == mono.right, label);
      std::snprintf(label, sizeof label, "%s: Width does not change the level", kTypeName[t]);
      EXPECT(std::fabs(db(rms(mono.left) / rms(wide.left))) < 1.0, label);
    }
    device.init(kRate);
    device.set_param(p::kMovement, 0.0f);
    device.set_param(p::kHold, 60.0f);
    Stereo usual = noise_only(device, 20.0f);
    const double usual_corr = correlation(usual.left, usual.right);
    EXPECT(usual_corr > 0.25 && usual_corr < 0.47, "the default Width of 0.8 leaves a correlation near 0.36");
    if (verbose) {
      std::printf("width: worst |corr| at Width 1 %.3f, level change to Width 0 at most %.2f dB, default corr %.2f\n",
                  worst_wide, worst_level, usual_corr);
    }
  }

  // BEHAVIOUR 6

  still(device, NoiseFloor::kStatic, -30.0f);
  device.set_param(p::kMovement, 1.0f);
  device.set_param(p::kFollow, -0.5f);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("noise-floor", 10.0f, kRate, [&] { run(device, input); });

  return finish("noise-floor");
}
