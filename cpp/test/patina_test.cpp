// Native harness for Patina (cpp/devices/patina). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest measures the contract the host relies on: zero is clean on every
// medium, the level is held, each amount does what it says on each medium,
// the noise follows its knob and stops, and nothing clicks.

#include "../devices/patina/patina.h"

#include "support/test_kit.h"

using namespace testkit;
using livemix::Patina;
namespace p = livemix::patina;

static Patina device;

static const float kRate = 48000.0f;
static const size_t kLatency = Patina::kLatency;
enum { kReel = 0, kCassette, kVinyl, kRadio, kSampler, kValve, kMedia };
static const char* kNames[kMedia] = {"Reel", "Cassette", "Vinyl", "Radio", "Sampler", "Valve"};
// A sine of -12 dBFS RMS.
static const float kReference = 0.3548f;
static const double kReferenceRms = 0.2509;

// A medium with nothing on it: the four amounts at zero. Each check turns on
// the one thing it measures.
static void clean(int medium, float rate = kRate) {
  device.init(rate);
  device.set_param(p::kMedium, static_cast<float>(medium));
  device.set_param(p::kDrive, 0.0f);
  device.set_param(p::kWobble, 0.0f);
  device.set_param(p::kWear, 0.0f);
  device.set_param(p::kNoise, 0.0f);
}

static char* label(const char* format, const char* name, double value = 0.0) {
  static char text[8][160];
  static int next = 0;
  char* out = text[next++ % 8];
  std::snprintf(out, 160, format, name, value);
  return out;
}

static double largest(const std::vector<float>& x) {
  double v = 0.0;
  for (float s : x) v = std::max(v, std::fabs(static_cast<double>(s)));
  return v;
}
static double median(std::vector<float> x) {
  std::sort(x.begin(), x.end());
  return x.empty() ? 0.0 : x[x.size() / 2];
}
static std::vector<float> centred(const std::vector<float>& x) {
  const double m = mean(x);
  std::vector<float> out(x.size());
  for (size_t i = 0; i < x.size(); ++i) out[i] = static_cast<float>(x[i] - m);
  return out;
}

// RMS of each `window` samples of [from, to).
static std::vector<float> levels(const std::vector<float>& x, size_t from, size_t to,
                                 size_t window = 480) {
  std::vector<float> out;
  for (size_t i = from; i + window <= std::min(to, x.size()); i += window) {
    out.push_back(static_cast<float>(rms(x, i, i + window)));
  }
  return out;
}

// The level of what is steady in a noise: the median of its 10 ms levels,
// which the ticks and bursts on top of it do not move.
static double steady(const std::vector<float>& x, size_t from, size_t to = SIZE_MAX) {
  return median(levels(x, from, to));
}

// Harmonics 2 to 10 of `hz` against the fundamental.
static double distortion(const std::vector<float>& x, double hz, size_t from, double rate = kRate) {
  double sum = 0.0;
  for (int k = 2; k <= 10 && hz * k < 0.45 * rate; ++k) {
    const double level = tone_level(x, hz * k, rate, from);
    sum += level * level;
  }
  return std::sqrt(sum) / tone_level(x, hz, rate, from);
}

// Everything in the signal that is not the tone at `hz`, against the tone.
static double residue(const std::vector<float>& x, double hz, size_t from) {
  const double tone = tone_level(x, hz, kRate, from);
  const double total = rms(x, from);
  return std::sqrt(std::max(total * total - 0.5 * tone * tone, 0.0)) / (tone * 0.7071);
}

// RMS of what lies between `low` and `high` Hz: a Hann-windowed transform of
// 8192 samples from `from`.
static double band_level(const std::vector<float>& x, double low, double high, size_t from) {
  const size_t n = 8192;
  double sum = 0.0;
  for (size_t k = static_cast<size_t>(low * n / kRate); k <= static_cast<size_t>(high * n / kRate);
       ++k) {
    double re = 0.0, im = 0.0;
    for (size_t i = 0; i < n; ++i) {
      const double window = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / n);
      const double phase = 2.0 * kPi * static_cast<double>(k * i % n) / n;
      re += window * x[from + i] * std::cos(phase);
      im -= window * x[from + i] * std::sin(phase);
    }
    sum += re * re + im * im;
  }
  return std::sqrt(2.0 * sum / (0.375 * n * n));
}

// Pitch deviation of a steady tone as a share of its frequency, one value
// per `group` cycles, from the rising zero crossings after `from`.
static std::vector<float> deviation(const std::vector<float>& x, double hz, size_t from, int group,
                                    double rate = kRate) {
  std::vector<double> crossings;
  for (size_t i = from + 1; i < x.size(); ++i) {
    if (x[i - 1] < 0.0f && x[i] >= 0.0f) {
      crossings.push_back(
          (static_cast<double>(i - 1) + (0.0 - x[i - 1]) / (static_cast<double>(x[i]) - x[i - 1])) /
          rate);
    }
  }
  std::vector<float> out;
  for (size_t i = static_cast<size_t>(group); i < crossings.size();
       i += static_cast<size_t>(group)) {
    const double measured = group / (crossings[i] - crossings[i - static_cast<size_t>(group)]);
    out.push_back(static_cast<float>(measured / hz - 1.0));
  }
  return out;
}

// Magnitude of an impulse response at `hz`.
static double response(const std::vector<float>& h, double hz, double rate = kRate) {
  double re = 0.0, im = 0.0;
  for (size_t i = 0; i < h.size(); ++i) {
    const double phase = 2.0 * kPi * hz * static_cast<double>(i) / rate;
    re += h[i] * std::cos(phase);
    im -= h[i] * std::sin(phase);
  }
  return std::sqrt(re * re + im * im);
}

// A small impulse through the device: small enough to be in the linear part.
static std::vector<float> impulse_response(float rate = kRate) {
  return run(device, impulse(0.5f, rate, 0.01f)).left;
}

// Where the response has fallen 3 dB under its level at 1 kHz, below and above.
static void band(const std::vector<float>& h, double* low, double* high, double rate = kRate) {
  const double reference = response(h, 1000.0, rate) * 0.70711;
  *low = 5.0;
  *high = 0.49 * rate;
  for (double hz = 1000.0; hz > 5.0; hz /= 1.02) {
    if (response(h, hz, rate) < reference) {
      *low = hz;
      break;
    }
  }
  for (double hz = 1000.0; hz < 0.49 * rate; hz *= 1.02) {
    if (response(h, hz, rate) < reference) {
      *high = hz;
      break;
    }
  }
}

// Two channels of noise that have nothing in common.
static void two_noises(float seconds, float gain, std::vector<float>* left,
                       std::vector<float>* right) {
  rng_state() = 0xC0FFEEu;
  *left = noise(seconds, kRate, gain);
  *right = noise(seconds, kRate, gain);
}

// --- what every medium shares -------------------------------------------------------------

// The conformance pass runs on the default medium. The rules that depend on
// the medium are checked again on each: block size, re-init, bounds, rates.
static void check_medium(int medium) {
  const char* name = kNames[medium];
  auto heavy = [&](float rate) {
    device.init(rate);
    device.set_param(p::kMedium, static_cast<float>(medium));
    device.set_param(p::kDrive, 0.8f);
    device.set_param(p::kWobble, 0.7f);
    device.set_param(p::kWear, 0.6f);
    device.set_param(p::kNoise, 0.8f);
    device.set_param(p::kTone, 0.4f);
  };
  heavy(kRate);
  rng_state() = 0x1234567u;
  const std::vector<float> input = noise(1.0f, kRate, 0.5f);
  const Stereo whole = run(device, input);
  heavy(kRate);
  const Stereo again = run(device, input);
  EXPECT(again.left == whole.left && again.right == whole.right,
         label("%s: two inits render the same bits", name));
  for (int block : {1, 2048, 37}) {
    heavy(kRate);
    const Stereo other = run(device, input, block);
    double worst = 0.0;
    for (size_t i = 0; i < input.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(other.left[i]) - whole.left[i]));
      worst = std::max(worst, std::fabs(static_cast<double>(other.right[i]) - whole.right[i]));
    }
    EXPECT(worst < 1.0e-4, label("%s: the same audio at any block size (worst %g)", name, worst));
  }
  for (float rate : {44100.0f, 96000.0f}) {
    heavy(rate);
    device.set_param(p::kDrive, 1.0f);
    device.set_param(p::kWobble, 1.0f);
    device.set_param(p::kWear, 1.0f);
    device.set_param(p::kNoise, 1.0f);
    const Stereo out = run(device, noise(1.0f, rate, 0.9f));
    EXPECT(finite(out.left) && finite(out.right) && peak(out.left) < 4.0 && peak(out.right) < 4.0,
           label("%s: everything at 1 with a loud input stays bounded at %.0f Hz", name, rate));
  }
}

// Contract 1: with the four amounts at zero the medium does nothing but delay.
static void check_clean(int medium) {
  const char* name = kNames[medium];
  for (float hz : {40.0f, 100.0f, 1000.0f, 5000.0f, 10000.0f, 16000.0f}) {
    clean(medium);
    const Stereo out = run(device, sine(hz, 1.0f, kRate, kReference));
    const double level = db(tone_level(out.left, hz, kRate, 24000) / kReference);
    char text[96];
    std::snprintf(text, sizeof text, "%s at zero: %.0f Hz passes within 0.5 dB (%+.2f)", name, hz,
                  level);
    EXPECT(std::fabs(level) < 0.5, text);
    if (hz == 1000.0f || hz == 100.0f) {
      const double thd = distortion(out.left, hz, 24000);
      EXPECT(thd < 0.005, label("%s at zero: a -12 dBFS sine has under 0.5 %% THD (%.3f %%)", name,
                                100.0 * thd));
      EXPECT(out.left == out.right, label("%s at zero: both channels alike", name));
    }
  }

  // The delay is the reported latency: an impulse lands on it, and a
  // band-limited signal nulls against its input moved by that many samples.
  clean(medium);
  const std::vector<float> h = run(device, impulse(0.1f, kRate, 0.01f)).left;
  size_t at = 0;
  for (size_t i = 0; i < h.size(); ++i) {
    if (std::fabs(h[i]) > std::fabs(h[at])) at = i;
  }
  EXPECT(at == kLatency, label("%s at zero: an impulse lands on the latency (at %.0f)", name,
                               static_cast<double>(at)));
  clean(medium);
  std::vector<float> in = sine(500.0f, 1.0f, kRate, 0.15f);
  const std::vector<float> second = sine(1370.0f, 1.0f, kRate, 0.1f);
  for (size_t i = 0; i < in.size(); ++i) in[i] += second[i];
  const Stereo out = run(device, in);
  double error = 0.0, power = 0.0;
  for (size_t i = 24000; i < in.size(); ++i) {
    const double difference = static_cast<double>(out.left[i]) - in[i - kLatency];
    error += difference * difference;
    power += static_cast<double>(in[i - kLatency]) * in[i - kLatency];
  }
  const double null = db(std::sqrt(error / power));
  // A sample either way would leave the 1370 Hz tone 15 dB down, no more.
  EXPECT(null < -30.0,
         label("%s at zero: the output is the input, 271 samples late (null %.1f dB)", name, null));
}

// --- Drive --------------------------------------------------------------------------------

struct Driven {
  double level_db;  // output RMS against the input's
  double thd;
  double second_db;  // against the fundamental
  double third_db;
};

static Driven drive_tone(int medium, float drive, float hz = 220.0f, float gain = kReference) {
  clean(medium);
  device.set_param(p::kDrive, drive);
  const Stereo out = run(device, sine(hz, 2.0f, kRate, gain));
  const double first = tone_level(out.left, hz, kRate, 48000);
  Driven d;
  d.level_db = db(rms(out.left, 48000) / (gain * 0.70711));
  d.thd = distortion(out.left, hz, 48000);
  d.second_db = db(tone_level(out.left, 2.0 * hz, kRate, 48000) / first);
  d.third_db = db(tone_level(out.left, 3.0 * hz, kRate, 48000) / first);
  return d;
}

static void check_drive() {
  // Contract 3: a steady -12 dBFS signal keeps its level at any Drive.
  for (int medium = 0; medium < kMedia; ++medium) {
    for (float drive : {0.0f, 0.25f, 0.5f, 0.75f, 1.0f}) {
      for (float hz : {220.0f, 440.0f}) {
        const double level = drive_tone(medium, drive, hz).level_db;
        char text[120];
        std::snprintf(text, sizeof text,
                      "%s: Drive %.2f holds a %.0f Hz tone within 1.5 dB (%+.2f)", kNames[medium],
                      drive, hz, level);
        EXPECT(std::fabs(level) < 1.5, text);
      }
    }
  }

  // Harmonics rise with Drive, continuously from nothing.
  double at_full[kMedia];
  for (int medium : {kReel, kCassette, kVinyl, kRadio, kValve}) {
    const char* name = kNames[medium];
    const double none = drive_tone(medium, 0.0f).thd;
    const double touch = drive_tone(medium, 0.03f).thd;
    const double some = drive_tone(medium, 0.3f).thd;
    const double more = drive_tone(medium, 0.6f).thd;
    at_full[medium] = drive_tone(medium, 1.0f).thd;
    EXPECT(touch < none + 0.0005,
           label("%s: a touch of Drive is no jump (%.3f %% THD)", name, 100.0 * touch));
    EXPECT(some > 1.5 * none && more > 2.0 * some && at_full[medium] > 1.5 * more,
           label("%s: distortion rises with Drive (%.1f %% at 1)", name, 100.0 * at_full[medium]));
  }
  EXPECT(at_full[kReel] > 0.15 && at_full[kReel] < 0.3,
         "Reel at Drive 1: tape pushed hard, 15 to 30 % THD");
  EXPECT(at_full[kValve] > 1.5 * at_full[kReel],
         "Valve at Drive 1 distorts well beyond Reel at Drive 1");
  EXPECT(at_full[kCassette] > at_full[kReel], "Cassette squashes harder than Reel");
  EXPECT(at_full[kVinyl] < 0.5 * at_full[kReel], "Vinyl is the gentle one");

  // Which harmonics. A curve with unlike sides makes even ones.
  const Driven reel = drive_tone(kReel, 1.0f);
  EXPECT(reel.third_db > -20.0 && reel.second_db < reel.third_db,
         "Reel: a strong third harmonic, and less second than third");
  const Driven vinyl = drive_tone(kVinyl, 1.0f);
  EXPECT(vinyl.second_db < -80.0, "Vinyl: a symmetrical curve, no even harmonics");
  for (float drive : {0.5f, 0.75f, 1.0f}) {
    const Driven valve = drive_tone(kValve, drive);
    char text[96];
    std::snprintf(text, sizeof text, "Valve at Drive %.2f: strong second and third harmonics",
                  drive);
    EXPECT(valve.second_db > -26.0 && valve.third_db > -26.0, text);
  }
  EXPECT(drive_tone(kRadio, 0.75f).second_db > -30.0 && drive_tone(kRadio, 1.0f).second_db > -30.0,
         "Radio: the detector makes even harmonics");

  // Tape: loud highs are dulled, quiet ones are not, and the lows keep their level.
  for (int medium : {kReel, kCassette}) {
    auto gain = [&](float hz, float level) {
      clean(medium);
      device.set_param(p::kDrive, 0.6f);
      const Stereo out = run(device, sine(hz, 0.5f, kRate, level));
      return tone_level(out.left, hz, kRate, 12000) / level;
    };
    const double low_loss = db(gain(200.0f, 0.5f) / gain(200.0f, 0.01f));
    const double high_loss = db(gain(8000.0f, 0.5f) / gain(8000.0f, 0.01f));
    EXPECT_NEAR(db(gain(8000.0f, 0.01f) / gain(200.0f, 0.01f)), 0.0, 1.0,
                label("%s, quiet: highs and lows pass alike", kNames[medium]));
    EXPECT(high_loss < low_loss - 4.0,
           label("%s, loud: 8 kHz loses at least 4 dB more than 200 Hz", kNames[medium]));
  }
  // Vinyl: the highs distort and the lows do not.
  EXPECT(drive_tone(kVinyl, 1.0f, 4000.0f).thd > 3.0 * drive_tone(kVinyl, 1.0f, 200.0f).thd,
         "Vinyl: a 4 kHz tone distorts three times as much as a 200 Hz one");

  // Quieter material comes up under Drive, and stays bounded.
  {
    clean(kValve);
    device.set_param(p::kDrive, 1.0f);
    const double quiet = rms(run(device, sine(220.0f, 1.0f, kRate, 0.01f)).left, 24000) / 0.00707;
    EXPECT(db(quiet) > 2.0 && db(quiet) < 26.0,
           "Valve at Drive 1: a quiet tone comes up, by under 26 dB");
    clean(kValve);
    device.set_param(p::kDrive, 1.0f);
    EXPECT(peak(run(device, sine(220.0f, 1.0f, kRate, 1.0f)).left) < 1.0,
           "Valve at Drive 1: a full-scale tone comes out under full scale");
  }

  // Sampler: Drive is the bit depth. The floor rises, the level stays, and
  // a quiet tail crumbles before it is cut off.
  {
    double floor[3];
    int which = 0;
    for (float drive : {0.0f, 0.5f, 1.0f}) {
      clean(kSampler);
      device.set_param(p::kDrive, drive);
      const Stereo out = run(device, sine(220.0f, 1.0f, kRate, kReference));
      // Everything from 600 Hz to 8 kHz, against the tone.
      floor[which++] = db(band_level(out.left, 600.0, 8000.0, 24000) / kReferenceRms);
    }
    EXPECT(floor[0] < -80.0, "Sampler at Drive 0: 18 bits, nothing to hear");
    EXPECT(floor[1] > floor[0] + 15.0 && floor[1] < -55.0, "Sampler at Drive 0.5: a 12 bit floor");
    EXPECT(floor[2] > -40.0 && floor[2] < -25.0,
           "Sampler at Drive 1: 6 bits, grit 25 to 40 dB down");

    clean(kSampler);
    device.set_param(p::kDrive, 1.0f);
    const Stereo tail = run(device, sine(220.0f, 1.0f, kRate, 0.003f));  // -50 dBFS
    EXPECT_NEAR(db(tone_level(tail.left, 220.0, kRate, 24000) / 0.003), 0.0, 3.0,
                "Sampler at 6 bits: a tone at -50 dBFS still passes at its level");
    EXPECT(residue(tail.left, 220.0, 24000) > 0.1,
           "and it has crumbled: over a tenth of it is grit");
    clean(kSampler);
    device.set_param(p::kDrive, 1.0f);
    const Stereo gone = run(device, sine(220.0f, 1.0f, kRate, 0.0001f));  // -80 dBFS
    EXPECT(peak(gone.left, 24000) == 0.0, "at -80 dBFS it is under the first step: silence");
  }
}

// --- Wobble -------------------------------------------------------------------------------

static void check_wobble() {
  const std::vector<float> in = sine(3000.0f, 20.0f, kRate, 0.25f);
  struct Bounds {
    int medium;
    double low, high;  // the largest deviation at Wobble 1 lies between
    double rate;       // where the slow part centres, Hz
  };
  // Reel ±0.6 % wow and ±0.15 % flutter, Cassette ±1.2 % and ±0.4 %, Vinyl ±0.5 %.
  for (const Bounds& b : {Bounds{kReel, 0.0045, 0.0076, 0.4}, Bounds{kCassette, 0.009, 0.0161, 0.8},
                          Bounds{kVinyl, 0.004, 0.0051, 0.556}}) {
    const char* name = kNames[b.medium];
    clean(b.medium);
    device.set_param(p::kWobble, 1.0f);
    const Stereo out = run(device, in);
    const std::vector<float> full = deviation(out.left, 3000.0, 4800, 30);
    EXPECT(largest(full) > b.low && largest(full) < b.high,
           label("%s: Wobble 1 moves the pitch by its stated amount (%.3f %%)", name,
                 100.0 * largest(full)));
    EXPECT_NEAR(dominant_frequency(centred(full), 100.0, 0.2, 4.0), b.rate, 0.04 * b.rate + 0.005,
                label("%s: the slow wobble centres on its rate", name));
    // Contract 5: one transport, so both channels move together.
    const std::vector<float> other = deviation(out.right, 3000.0, 4800, 30);
    EXPECT(other == full, label("%s: the pitch moves the same on both channels", name));

    clean(b.medium);
    device.set_param(p::kWobble, 0.5f);
    const std::vector<float> half = deviation(run(device, in).left, 3000.0, 4800, 30);
    EXPECT_NEAR(rms(half) / rms(full), 0.5, 0.03, label("%s: Wobble 0.5 is half of it", name));
    clean(b.medium);
    device.set_param(p::kWobble, 0.02f);
    const std::vector<float> touch = deviation(run(device, in).left, 3000.0, 4800, 30);
    EXPECT_NEAR(rms(touch) / rms(full), 0.02, 0.004,
                label("%s: a touch of Wobble is a touch", name));
    clean(b.medium);
    const std::vector<float> still =
        deviation(run(device, sine(3000.0f, 4.0f, kRate, 0.25f)).left, 3000.0, 4800, 30);
    EXPECT(largest(still) < 0.00002, label("%s: Wobble 0 is a steady pitch", name));
  }
  // Tape flutters; a record only turns.
  {
    clean(kCassette);
    device.set_param(p::kWobble, 1.0f);
    const std::vector<float> fast = deviation(run(device, in).left, 3000.0, 4800, 15);
    EXPECT_NEAR(dominant_frequency(centred(fast), 200.0, 4.0, 20.0), 11.0, 1.5,
                "Cassette: flutter sits near 11 Hz");
    clean(kReel);
    device.set_param(p::kWobble, 1.0f);
    const std::vector<float> reel = deviation(run(device, in).left, 3000.0, 4800, 15);
    EXPECT_NEAR(dominant_frequency(centred(reel), 200.0, 4.0, 20.0), 7.0, 1.0,
                "Reel: flutter sits near 7 Hz");
  }

  // Radio: fading. The level drifts down and comes back, the pitch stays.
  {
    double swing[3], deepest[3];
    int which = 0;
    for (float wobble : {0.0f, 0.5f, 1.0f}) {
      clean(kRadio);
      device.set_param(p::kWobble, wobble);
      const Stereo out = run(device, sine(220.0f, 30.0f, kRate, 0.25f));
      const std::vector<float> level = levels(out.left, 48000, out.size(), 2400);
      const double high = *std::max_element(level.begin(), level.end());
      const double low = *std::min_element(level.begin(), level.end());
      swing[which] = db(high / low);
      deepest[which] = db(low / (0.25 * 0.70711));
      if (wobble == 1.0f) {
        const std::vector<float> pitch = deviation(run(device, in).left, 3000.0, 4800, 30);
        EXPECT(largest(pitch) < 0.0005, "Radio: Wobble does not move the pitch");
      }
      ++which;
    }
    EXPECT(swing[0] < 0.05, "Radio at Wobble 0: a steady level");
    EXPECT(swing[1] > 2.0 && swing[2] > 1.6 * swing[1], "Radio: the fading deepens with Wobble");
    EXPECT(deepest[2] < -7.0 && deepest[2] > -13.0, "Radio at Wobble 1: fades of about 9 dB");

    // Selective fading: a shallow comb moves through the band, so two
    // tones do not fade together.
    auto balance = [&](float wobble) {
      clean(kRadio);
      device.set_param(p::kWobble, wobble);
      std::vector<float> two = sine(300.0f, 25.0f, kRate, 0.15f);
      const std::vector<float> upper = sine(1100.0f, 25.0f, kRate, 0.15f);
      for (size_t i = 0; i < two.size(); ++i) two[i] += upper[i];
      const Stereo out = run(device, two);
      double low = 1.0e9, high = -1.0e9;
      for (size_t i = 48000; i + 4800 <= out.size(); i += 4800) {
        const double ratio = db(tone_level(out.left, 1100.0, kRate, i, i + 4800) /
                                tone_level(out.left, 300.0, kRate, i, i + 4800));
        low = std::min(low, ratio);
        high = std::max(high, ratio);
      }
      return high - low;
    };
    EXPECT(balance(0.0f) < 0.05, "Radio at Wobble 0: two tones keep their balance");
    EXPECT(balance(1.0f) > 2.5 && balance(1.0f) < 9.0,
           "Radio at Wobble 1: the balance of two tones shifts by 2.5 to 9 dB, a shallow notch "
           "passing");
  }

  // Valve: sag. Around the level the make-up holds, loud gives way and
  // quiet comes up, slowly, and the pitch stays.
  {
    auto settled = [&](float wobble, float gain, double* start) {
      clean(kValve);
      device.set_param(p::kWobble, wobble);
      device.set_param(p::kDrive, 0.5f);
      const Stereo out = run(device, sine(220.0f, 4.0f, kRate, gain));
      if (start) *start = rms(out.left, kLatency, kLatency + 436);  // the first two cycles
      return rms(out.left, 144000, 192000);
    };
    double steady_start, sagging_start;
    const double loud_steady = settled(0.0f, 0.9f, &steady_start);
    const double loud_sagging = settled(1.0f, 0.9f, &sagging_start);
    EXPECT_NEAR(db(loud_steady / steady_start), 0.0, 0.3,
                "Valve at Wobble 0: a loud tone holds its level");
    EXPECT(db(loud_sagging / loud_steady) < -3.0 && db(loud_sagging / loud_steady) > -7.0,
           "Valve at Wobble 1: a loud tone settles 3 to 7 dB lower");
    EXPECT(db(loud_sagging / sagging_start) < -6.0, "and it starts whole, then gives way");
    EXPECT_NEAR(db(settled(1.0f, kReference, nullptr) / settled(0.0f, kReference, nullptr)), 0.0,
                0.5, "Valve at Wobble 1: a tone at -12 dBFS stays where it was");
    const double bloom = db(settled(1.0f, 0.02f, nullptr) / settled(0.0f, 0.02f, nullptr));
    EXPECT(bloom > 3.0 && bloom < 6.5, "Valve at Wobble 1: a quiet tone blooms by 3 to 6.5 dB");
    const double half = db(settled(0.5f, 0.9f, nullptr) / loud_steady);
    EXPECT(half < -1.0 && half > db(loud_sagging / loud_steady) + 1.0,
           "Valve: Wobble 0.5 sags less");
    clean(kValve);
    device.set_param(p::kWobble, 1.0f);
    const std::vector<float> pitch = deviation(run(device, in).left, 3000.0, 4800, 30);
    EXPECT(largest(pitch) < 0.0002, "Valve: Wobble does not move the pitch");
  }

  // Sampler: clock jitter. Fuzz around the tone, and the tone where it was.
  // At 6 kHz the hold's images of a 1 kHz tone are at 5 and 7 kHz, and what
  // lies from 1.5 to 4.5 kHz is the jitter's.
  {
    double fuzz[4];
    int which = 0;
    for (float wobble : {0.0f, 0.1f, 0.4f, 1.0f}) {
      clean(kSampler);
      device.set_param(p::kWear, 1.0f);
      device.set_param(p::kWobble, wobble);
      const Stereo out = run(device, sine(1000.0f, 2.0f, kRate, 0.25f));
      fuzz[which++] = db(band_level(out.left, 1500.0, 4500.0, 24000) / (0.25 * 0.70711));
      EXPECT_NEAR(dominant_frequency(out.left, kRate, 800.0, 1250.0, 24000, 48000), 1000.0, 1.0,
                  "Sampler: the pitch does not move with Wobble");
      EXPECT_NEAR(db(tone_level(out.left, 1000.0, kRate, 24000) / 0.25), -0.4, 0.5,
                  "Sampler: nor does the level");
    }
    EXPECT(fuzz[0] < -60.0, "Sampler at Wobble 0: a steady clock, nothing between the images");
    EXPECT(fuzz[1] > fuzz[0] + 20.0 && fuzz[1] < -25.0,
           "Sampler: a little jitter is a little fuzz");
    EXPECT(fuzz[2] > fuzz[1] + 4.0 && fuzz[3] > fuzz[2] + 3.0 && fuzz[3] > -22.0,
           "Sampler: the fuzz thickens with Wobble");
  }
}

// --- Wear and Tone ------------------------------------------------------------------------

static void check_wear() {
  // The band narrows towards each medium's own edges.
  struct Edges {
    int medium;
    double low, high;
  };
  for (const Edges& e :
       {Edges{kReel, 40.0, 7000.0}, Edges{kCassette, 60.0, 4500.0}, Edges{kVinyl, 50.0, 9000.0},
        Edges{kRadio, 300.0, 3200.0}, Edges{kValve, 80.0, 6000.0}}) {
    const char* name = kNames[e.medium];
    double low[4], high[4];
    int which = 0;
    for (float wear : {0.0f, 0.05f, 0.5f, 1.0f}) {
      clean(e.medium);
      device.set_param(p::kWear, wear);
      band(impulse_response(), &low[which], &high[which]);
      ++which;
    }
    EXPECT_NEAR(low[3], e.low, 0.1 * e.low, label("%s at Wear 1: the low edge", name));
    EXPECT_NEAR(high[3], e.high, 0.08 * e.high, label("%s at Wear 1: the high edge", name));
    EXPECT(low[0] < 20.0 && high[0] > 20000.0, label("%s at Wear 0: the band is open", name));
    EXPECT(low[1] < 9.0 && high[1] > 0.85 * high[0],
           label("%s: a touch of Wear barely moves the edges", name));
    EXPECT(low[2] > low[1] && low[2] < low[3] && high[2] < high[1] && high[2] > high[3],
           label("%s: Wear 0.5 lies between", name));
  }
  // Radio's sides are steep: an octave outside the band is over 20 dB down.
  {
    clean(kRadio);
    device.set_param(p::kWear, 1.0f);
    const std::vector<float> h = impulse_response();
    EXPECT(db(response(h, 150.0) / response(h, 1000.0)) < -20.0 &&
               db(response(h, 6400.0) / response(h, 1000.0)) < -20.0,
           "Radio at Wear 1: four poles a side");
    clean(kReel);
    device.set_param(p::kWear, 1.0f);
    const std::vector<float> reel = impulse_response();
    EXPECT(db(response(reel, 14000.0) / response(reel, 1000.0)) > -20.0,
           "Reel's sides are two poles: an octave over its edge is under 20 dB down");
    // Reel: a small head bump near 70 Hz.
    EXPECT_NEAR(db(response(reel, 70.0) / response(reel, 400.0)), 2.3, 1.0,
                "Reel at Wear 1: a head bump of 2 to 3 dB at 70 Hz");
    // And the treble loss at level deepens.
    auto loss = [&](float wear) {
      double level[2];
      int which = 0;
      for (float gain : {0.01f, 0.5f}) {
        clean(kReel);
        device.set_param(p::kDrive, 0.6f);
        device.set_param(p::kWear, wear);
        const Stereo out = run(device, sine(5000.0f, 0.5f, kRate, gain));
        level[which++] = tone_level(out.left, 5000.0, kRate, 12000) / gain;
      }
      return db(level[1] / level[0]);
    };
    EXPECT(loss(1.0f) < loss(0.0f) - 1.5, "Reel: worn tape loses more treble at level");
  }

  // Cassette: dropouts, brief dips that take the treble further than the bass.
  {
    std::vector<float> in = sine(400.0f, 30.0f, kRate, 0.2f);
    const std::vector<float> high = sine(3000.0f, 30.0f, kRate, 0.2f);
    for (size_t i = 0; i < in.size(); ++i) in[i] += high[i];
    double deepest_low[3], deepest_high[3], dipped[3];
    int count[3];
    int which = 0;
    for (float wear : {0.0f, 0.5f, 1.0f}) {
      clean(kCassette);
      device.set_param(p::kWear, wear);
      const Stereo out = run(device, in);
      std::vector<float> low_level, high_level;
      for (size_t i = 48000; i + 480 <= out.size(); i += 480) {
        low_level.push_back(static_cast<float>(tone_level(out.left, 400.0, kRate, i, i + 480)));
        high_level.push_back(static_cast<float>(tone_level(out.left, 3000.0, kRate, i, i + 480)));
      }
      const double usual = median(low_level);
      deepest_low[which] = *std::min_element(low_level.begin(), low_level.end()) / usual;
      deepest_high[which] =
          *std::min_element(high_level.begin(), high_level.end()) / median(high_level);
      size_t under = 0;
      count[which] = 0;
      bool down = false;
      for (float level : low_level) {
        if (level < 0.9 * usual) ++under;
        if (!down && level < 0.85 * usual) {
          down = true;
          ++count[which];
        } else if (down && level > 0.95 * usual) {
          down = false;
        }
      }
      dipped[which] = static_cast<double>(under) / static_cast<double>(low_level.size());
      ++which;
    }
    EXPECT(count[0] == 0 && deepest_low[0] > 0.99, "Cassette at Wear 0: no dropouts");
    EXPECT(deepest_low[2] < 0.5,
           "Cassette at Wear 1: the deepest dropout takes over half the level");
    EXPECT(deepest_high[2] < 0.6 * deepest_low[2],
           "a dropout takes the treble further down than the bass");
    EXPECT(dipped[2] < 0.35, "dropouts are brief: most of the time the level is whole");
    EXPECT(count[2] >= 35 && count[2] <= 80, "Cassette at Wear 1: about two dropouts a second");
    EXPECT(count[1] >= 3 && count[1] < count[2] / 2, "Cassette at Wear 0.5: far fewer");
  }

  // Vinyl: the low end is pulled to the middle, the rest keeps its width.
  {
    auto side = [&](float wear, float hz) {
      clean(kVinyl);
      device.set_param(p::kWear, wear);
      const std::vector<float> left = sine(hz, 1.0f, kRate, 0.2f);
      std::vector<float> right(left.size());
      for (size_t i = 0; i < left.size(); ++i) right[i] = -left[i];
      const Stereo out = run(device, left, right);
      std::vector<float> difference(left.size());
      for (size_t i = 0; i < left.size(); ++i) difference[i] = 0.5f * (out.left[i] - out.right[i]);
      return tone_level(difference, hz, kRate, 24000) / 0.2;
    };
    EXPECT_NEAR(db(side(0.0f, 60.0f)), 0.0, 0.2, "Vinyl at Wear 0: stereo bass passes");
    EXPECT(db(side(1.0f, 60.0f) / side(1.0f, 1500.0f)) < -6.0,
           "Vinyl at Wear 1: what is out of phase at 60 Hz is 6 dB down against 1.5 kHz");
    EXPECT(side(0.5f, 60.0f) < side(0.0f, 60.0f) && side(0.5f, 60.0f) > side(1.0f, 60.0f),
           "Vinyl: Wear 0.5 lies between");
    EXPECT(db(side(1.0f, 1500.0f)) > -1.5, "Vinyl at Wear 1: the stereo above the bass stays");
  }

  // Radio: one speaker.
  {
    std::vector<float> left, right;
    double width[3];
    int which = 0;
    for (float wear : {0.0f, 0.5f, 1.0f}) {
      clean(kRadio);
      device.set_param(p::kWear, wear);
      two_noises(1.0f, 0.2f, &left, &right);
      const Stereo out = run(device, left, right);
      width[which++] = correlation(out.left, out.right, 24000);
    }
    EXPECT(width[0] < 0.05, "Radio at Wear 0: the stereo image is whole");
    EXPECT(width[1] > 0.5 && width[1] < 0.95, "Radio at Wear 0.5: narrower");
    EXPECT(width[2] > 0.999, "Radio at Wear 1: mono");
  }

  // Sampler: Wear is the sample rate, with no filter either side of the
  // hold. A 5 kHz tone sampled at 6 kHz comes back at 1 kHz.
  {
    double alias[3], tone[3];
    int which = 0;
    for (float wear : {0.0f, 0.5f, 1.0f}) {
      clean(kSampler);
      device.set_param(p::kWear, wear);
      const Stereo out = run(device, sine(5000.0f, 1.0f, kRate, 0.25f));
      alias[which] = db(tone_level(out.left, 1000.0, kRate, 24000) / 0.25);
      tone[which] = db(tone_level(out.left, 5000.0, kRate, 24000) / 0.25);
      ++which;
    }
    EXPECT(alias[0] < -80.0 && std::fabs(tone[0]) < 0.3,
           "Sampler at Wear 0: the full rate, no alias");
    EXPECT(alias[2] > -6.0,
           "Sampler at Wear 1: 5 kHz folds to 1 kHz, nearly as loud as it went in");
    // Halfway the rate is 17 kHz: the image of 5 kHz is at 12 kHz.
    clean(kSampler);
    device.set_param(p::kWear, 0.5f);
    const Stereo half = run(device, sine(5000.0f, 1.0f, kRate, 0.25f));
    const double image = dominant_frequency(half.left, kRate, 9000.0, 15000.0, 24000, 36000);
    EXPECT_NEAR(image, 16970.6 - 5000.0, 60.0,
                "Sampler at Wear 0.5: a 17 kHz clock, an image at 12 kHz");
    EXPECT(db(tone_level(half.left, image, kRate, 24000) / 0.25) > -20.0,
           "and nothing filters it out");
    // The band itself does not narrow.
    clean(kSampler);
    device.set_param(p::kWear, 1.0f);
    const Stereo low = run(device, sine(200.0f, 1.0f, kRate, 0.25f));
    EXPECT_NEAR(db(tone_level(low.left, 200.0, kRate, 24000) / 0.25), 0.0, 0.5,
                "Sampler at Wear 1: the low tones keep their level");
  }

  // Valve: the transformer. The low end saturates first.
  {
    auto thd = [&](float wear, float hz) {
      clean(kValve);
      device.set_param(p::kDrive, 0.4f);
      device.set_param(p::kWear, wear);
      return distortion(run(device, sine(hz, 2.0f, kRate, kReference)).left, hz, 48000);
    };
    EXPECT(thd(1.0f, 70.0f) > 2.0 * thd(0.0f, 70.0f),
           "Valve: Wear doubles the distortion of a 70 Hz tone");
    EXPECT(thd(1.0f, 70.0f) > 1.6 * thd(1.0f, 1000.0f),
           "Valve at Wear 1: 70 Hz distorts more than 1 kHz");
    EXPECT_NEAR(thd(1.0f, 1000.0f) / thd(0.0f, 1000.0f), 1.0, 0.3,
                "Valve: Wear leaves the distortion of 1 kHz alone");
  }
}

static void check_tone() {
  for (int medium : {kReel, kVinyl, kValve}) {
    const char* name = kNames[medium];
    double treble[3], edge[3];
    int which = 0;
    for (float tone : {0.0f, 0.5f, 1.0f}) {
      clean(medium);
      device.set_param(p::kWear, 0.6f);
      device.set_param(p::kTone, tone);
      const std::vector<float> h = impulse_response();
      treble[which] = db(response(h, 5000.0) / response(h, 300.0));
      // The edge is where the shelf's own level has dropped 3 dB.
      const double shelved = response(h, 3500.0) * 0.70711;
      edge[which] = 20000.0;
      for (double hz = 3500.0; hz < 23000.0; hz *= 1.01) {
        if (response(h, hz) < shelved) {
          edge[which] = hz;
          break;
        }
      }
      ++which;
    }
    EXPECT(treble[0] < treble[1] - 4.0 && treble[2] > treble[1] + 4.0,
           label("%s: Tone turns the treble down and up by over 4 dB", name));
    EXPECT(edge[0] < 0.75 * edge[1] && edge[2] > 1.3 * edge[1],
           label("%s: and moves the high edge with it", name));
  }
  // Sampler: below the middle Tone is the output filter, two poles.
  clean(kSampler);
  device.set_param(p::kTone, 0.0f);
  const std::vector<float> h = impulse_response();
  EXPECT(db(response(h, 6000.0) / response(h, 300.0)) < -24.0,
         "Sampler at Tone 0: the output filter is shut to under 2 kHz");
  clean(kSampler);
  device.set_param(p::kTone, 0.25f);
  const std::vector<float> half = impulse_response();
  EXPECT(db(response(half, 6000.0) / response(half, 300.0)) > -9.0 &&
             db(response(half, 12000.0) / response(half, 300.0)) < -12.0,
         "Sampler at Tone 0.25: it sits near 7 kHz");
}

// --- Noise --------------------------------------------------------------------------------

// The output with a tone far too quiet to hear keeping the device awake, so
// what is measured is the noise.
static Stereo noise_floor(float seconds = 6.0f) {
  return run(device, sine(100.0f, seconds, kRate, 1.0e-5f));
}

// Moments that stand well clear of the steady noise, a second apart at least 5 ms.
static int count_events(const std::vector<float>& x, size_t from, double over) {
  const double threshold = over * steady(x, from);
  int count = 0;
  size_t last = 0;
  for (size_t i = from; i < x.size(); ++i) {
    if (std::fabs(x[i]) > threshold) {
      if (count == 0 || i - last > 240) ++count;
      last = i;
    }
  }
  return count;
}

static void check_noise() {
  // Contract 4: the steady part follows the knob, -64 dBFS at 0.3 and -40 at
  // 1 give or take the medium, and nothing at 0.
  double full[kMedia];
  for (int medium = 0; medium < kMedia; ++medium) {
    const char* name = kNames[medium];
    double level[5];
    int which = 0;
    for (float knob : {0.0f, 0.03f, 0.3f, 0.6f, 1.0f}) {
      clean(medium);
      device.set_param(p::kNoise, knob);
      const Stereo out = noise_floor();
      level[which++] = db(steady(out.left, 48000));
      if (knob == 1.0f) {
        const double together = correlation(out.left, out.right, 48000);
        EXPECT(std::fabs(together) < 0.2,
               label("%s: each channel has its own noise (correlation %.2f)", name, together));
        EXPECT_NEAR(db(steady(out.right, 48000)), level[4], 1.5,
                    label("%s: as much noise on the right as on the left", name));
      }
    }
    full[medium] = level[4];
    EXPECT(level[0] < -99.0, label("%s: Noise 0 adds nothing", name));
    EXPECT_NEAR(level[4], -40.0, 3.5,
                label("%s: Noise 1 is about -40 dBFS (%.1f)", name, level[4]));
    EXPECT_NEAR(level[2], -64.0, 3.5,
                label("%s: Noise 0.3 is about -64 dBFS (%.1f)", name, level[2]));
    EXPECT_NEAR(level[4] - level[2], 24.0, 1.0, label("%s: 24 dB between Noise 0.3 and 1", name));
    EXPECT(
        level[1] < level[2] - 30.0 && level[3] > level[2] && level[3] < level[4],
        label("%s: the knob is usable all the way: no jump from zero, and it keeps rising", name));
  }
  EXPECT_NEAR(full[kCassette] - full[kReel], 6.0, 1.0, "Cassette hiss is 6 dB over Reel's");

  // What each noise is made of.
  {
    clean(kReel);
    device.set_param(p::kNoise, 1.0f);
    const Stereo reel = noise_floor();
    EXPECT(energy_above(reel.left, 3000.0, kRate, 48000) > 0.5, "Reel: hiss is mostly treble");
    clean(kCassette);
    device.set_param(p::kNoise, 1.0f);
    const Stereo cassette = noise_floor();
    const double reel_tilt = db(band_level(reel.left, 7000.0, 9000.0, 48000) /
                                band_level(reel.left, 300.0, 700.0, 48000));
    const double cassette_tilt = db(band_level(cassette.left, 7000.0, 9000.0, 48000) /
                                    band_level(cassette.left, 300.0, 700.0, 48000));
    EXPECT(cassette_tilt > reel_tilt + 6.0,
           "Cassette: brighter hiss than Reel, by over 6 dB of tilt");
    clean(kValve);
    device.set_param(p::kNoise, 1.0f);
    const Stereo valve = noise_floor();
    const double hum = tone_level(valve.left, 100.0, kRate, 48000);
    EXPECT(db(hum) > -46.0 && tone_level(valve.left, 200.0, kRate, 48000) > 0.3 * hum &&
               tone_level(valve.left, 300.0, kRate, 48000) > 0.15 * hum,
           "Valve: a 100 Hz hum with its harmonics, a buzz");
    EXPECT(energy_above(valve.left, 3000.0, kRate, 48000) > 0.01,
           "Valve: and a little hiss over it");
    clean(kRadio);
    device.set_param(p::kNoise, 1.0f);
    const Stereo radio = run(device, sine(100.0f, 20.0f, kRate, 1.0e-5f));
    EXPECT(tone_level(radio.left, 50.0, kRate, 48000) >
               4.0 * tone_level(radio.left, 70.0, kRate, 48000),
           "Radio: a faint mains hum at 50 Hz");
    const std::vector<float> bursts = levels(radio.left, 48000, radio.size());
    EXPECT(*std::max_element(bursts.begin(), bursts.end()) > 2.5 * median(bursts),
           "Radio: the static comes in bursts over a steady bed");
    EXPECT(db(peak(radio.left, 48000)) < -14.0, "Radio: its sparks stay under -14 dBFS");
    clean(kSampler);
    device.set_param(p::kNoise, 1.0f);
    const Stereo sampler = noise_floor();
    EXPECT(tone_level(sampler.left, 3200.0, kRate, 48000) >
               5.0 * tone_level(sampler.left, 2900.0, kRate, 48000),
           "Sampler: an idle tone stands out of the hash");
    // The hash is held on the converter clock: at a low rate it has steps.
    clean(kSampler);
    device.set_param(p::kNoise, 1.0f);
    device.set_param(p::kWear, 1.0f);
    const Stereo held = noise_floor();
    EXPECT(energy_above(held.left, 6000.0, kRate, 48000) <
               0.6 * energy_above(sampler.left, 6000.0, kRate, 48000),
           "Sampler at Wear 1: the hash is held at the low rate with the signal");
  }

  // Vinyl: crackle. More ticks the further the knob, the big ones rare and
  // near -20 dBFS at the top, mostly in the middle; a rumble under it.
  {
    int ticks[3];
    double top[3];
    int which = 0;
    Stereo last;
    for (float knob : {0.15f, 0.4f, 1.0f}) {
      clean(kVinyl);
      device.set_param(p::kNoise, knob);
      last = run(device, sine(100.0f, 21.0f, kRate, 1.0e-5f));
      ticks[which] = count_events(last.left, 48000, 5.0);
      top[which] = db(std::max(peak(last.left, 48000), peak(last.right, 48000)));
      ++which;
    }
    EXPECT(ticks[0] >= 3 && 2 * ticks[1] > 3 * ticks[0] && ticks[2] > 2 * ticks[1],
           "Vinyl: the crackle thickens with the knob");
    EXPECT(ticks[2] > 60 && ticks[2] < 260,
           "Vinyl at Noise 1: 3 to 13 ticks a second stand clear of the surface");
    EXPECT(top[2] > -24.0 && top[2] < -16.0,
           "Vinyl at Noise 1: the biggest ticks reach about -20 dBFS");
    EXPECT(top[1] < top[2] - 12.0, "and they come down with the knob");
    // A tick is in both channels, more or less: find the biggest and compare.
    size_t at = 48000;
    for (size_t i = 48000; i < last.size(); ++i) {
      if (std::fabs(last.left[i]) > std::fabs(last.left[at])) at = i;
    }
    const double other = peak(last.right, at - 48, at + 48) / std::fabs(last.left[at]);
    EXPECT(other > 0.3 && other < 1.5, "Vinyl: a tick sits near the middle, with some spread");
    EXPECT(tone_level(last.left, 2500.0, kRate, at - 240, at + 240) >
               3.0 * tone_level(last.left, 8000.0, kRate, at - 240, at + 240),
           "Vinyl: a tick rings in a band around 2.5 kHz");
    EXPECT(tone_level(last.left, 30.0, kRate, 48000) >
               3.0 * tone_level(last.left, 300.0, kRate, 48000),
           "Vinyl: a rumble near 30 Hz");
  }

  // Noise is not scaled by Drive; Output and Mix scale it with the signal.
  for (int medium : {kReel, kValve, kRadio}) {
    const char* name = kNames[medium];
    auto floor_at = [&](float drive, float output, float mix) {
      clean(medium);
      device.set_param(p::kNoise, 0.8f);
      device.set_param(p::kDrive, drive);
      device.set_param(p::kOutput, output);
      device.set_param(p::kMix, mix);
      return db(steady(noise_floor().left, 48000));
    };
    const double plain = floor_at(0.0f, 0.0f, 1.0f);
    EXPECT_NEAR(floor_at(1.0f, 0.0f, 1.0f), plain, 0.5,
                label("%s: Drive does not move the noise", name));
    EXPECT_NEAR(floor_at(0.0f, 6.0f, 1.0f), plain + 6.0, 0.5,
                label("%s: Output +6 dB lifts it 6 dB", name));
    EXPECT_NEAR(floor_at(0.0f, 0.0f, 0.5f), plain - 6.0, 0.5, label("%s: Mix 0.5 halves it", name));
  }

  // It carries on for three seconds after the signal, fades over half a
  // second, and then the device sleeps: exact zero.
  for (int medium = 0; medium < kMedia; ++medium) {
    const char* name = kNames[medium];
    clean(medium);
    device.set_param(p::kNoise, 1.0f);
    std::vector<float> in = sine(440.0f, 0.2f, kRate, 0.2f);
    in.resize(static_cast<size_t>(5.0f * kRate), 0.0f);
    const Stereo out = run(device, in);
    const size_t end = static_cast<size_t>(0.2f * kRate) + kLatency;
    const double during = steady(out.left, end + 24000, end + 72000);
    const double late = steady(out.left, end + 120000, end + 139200);  // 2.5 to 2.9 s
    const double fading = rms(out.left, end + 151200, end + 160800);   // 3.15 to 3.35 s
    EXPECT(db(during) > -45.0, label("%s: the noise carries on after the signal", name));
    EXPECT_NEAR(db(late / during), 0.0, 1.5, label("%s: and is still whole 2.5 s later", name));
    EXPECT(fading < 0.8 * during && fading > 0.05 * during,
           label("%s: at 3.25 s it is fading", name));
    EXPECT(peak(out.left, end + 192000, out.size()) == 0.0 &&
               peak(out.right, end + 192000, out.size()) == 0.0,
           label("%s: 4 s after the signal the output is exactly zero", name));
    clean(medium);
    device.set_param(p::kNoise, 1.0f);
    const Stereo idle = render(device, 1.0f, kRate);
    EXPECT(peak(idle.left) == 0.0 && peak(idle.right) == 0.0,
           label("%s: no input, no noise: an idle track is silent", name));
  }
}

// --- moving things while sounding ---------------------------------------------------------

static void check_clicks() {
  // The largest step during each change is no more than the settings before
  // or after it make on their own.
  const std::vector<float> tone = sine(220.0f, 0.4f, kRate, 0.5f);  // whole cycles: runs join up
  device.init(kRate);
  device.set_param(p::kNoise, 0.0f);
  device.set_param(p::kWobble, 0.5f);
  run(device, tone);
  double settled = max_step(run(device, tone).left);
  auto change = [&](int id, float value, const char* what) {
    device.set_param(id, value);
    const Stereo moving = run(device, tone);
    const double during = std::max(max_step(moving.left), max_step(moving.right));
    const double after = max_step(run(device, tone).left);
    char text[120];
    std::snprintf(text, sizeof text, "%s does not click (step %.4f against %.4f)", what, during,
                  std::max(settled, after));
    EXPECT(during < 1.25 * std::max(settled, after) + 0.002, text);
    settled = after;
  };
  // Contract 6: every medium to every other, with the amounts well up.
  device.set_param(p::kDrive, 0.6f);
  device.set_param(p::kWear, 0.6f);
  run(device, tone);
  settled = max_step(run(device, tone).left);
  for (int from = 0; from < kMedia; ++from) {
    for (int to = 0; to < kMedia; ++to) {
      if (from == to) continue;
      change(p::kMedium, static_cast<float>(from), kNames[from]);
      char text[64];
      std::snprintf(text, sizeof text, "%s to %s", kNames[from], kNames[to]);
      change(p::kMedium, static_cast<float>(to), text);
    }
  }
  // A change in the middle of a change: 10 ms into the fade out, and again
  // 10 ms into the fade back in. One tone, cut where the changes fall.
  {
    const std::vector<float> through(tone.begin(), tone.end());
    auto piece = [&](size_t from, size_t to) {
      return std::vector<float>(through.begin() + static_cast<long>(from),
                                through.begin() + static_cast<long>(to));
    };
    device.set_param(p::kMedium, static_cast<float>(kValve));
    Stereo out = run(device, piece(0, 480));
    device.set_param(p::kMedium, static_cast<float>(kCassette));
    out = concat(out, run(device, piece(480, 2400)));
    device.set_param(p::kMedium, static_cast<float>(kRadio));
    out = concat(out, run(device, piece(2400, through.size())));
    const double during = std::max(max_step(out.left), max_step(out.right));
    const double after = max_step(run(device, tone).left);
    EXPECT(during < 1.25 * std::max(settled, after) + 0.002,
           "Changing medium mid-change does not click");
    settled = after;

    // And changing its mind: away for 10 ms, then back to where it was.
    device.set_param(p::kMedium, static_cast<float>(kVinyl));
    out = run(device, piece(0, 480));
    device.set_param(p::kMedium, static_cast<float>(kRadio));
    out = concat(out, run(device, piece(480, through.size())));
    EXPECT(std::max(max_step(out.left), max_step(out.right)) < 1.25 * settled + 0.002,
           "Going back to the medium it was leaving does not click");
  }
  change(p::kMedium, static_cast<float>(kReel), "Back to Reel");

  // Contract 2: each amount is smooth while moved, on each medium.
  for (int medium = 0; medium < kMedia; ++medium) {
    char text[6][64];
    change(p::kMedium, static_cast<float>(medium), kNames[medium]);
    std::snprintf(text[0], 64, "%s: Drive up", kNames[medium]);
    change(p::kDrive, 1.0f, text[0]);
    std::snprintf(text[1], 64, "%s: Wobble up", kNames[medium]);
    change(p::kWobble, 1.0f, text[1]);
    std::snprintf(text[2], 64, "%s: Wear down", kNames[medium]);
    change(p::kWear, 0.0f, text[2]);
    std::snprintf(text[3], 64, "%s: Drive down", kNames[medium]);
    change(p::kDrive, 0.1f, text[3]);
    std::snprintf(text[4], 64, "%s: Wobble off", kNames[medium]);
    change(p::kWobble, 0.0f, text[4]);
    std::snprintf(text[5], 64, "%s: Wear up", kNames[medium]);
    change(p::kWear, 0.6f, text[5]);
    change(p::kDrive, 0.6f, "Drive back");
    change(p::kWobble, 0.5f, "Wobble back");
  }
  change(p::kTone, 0.0f, "Tone down");
  change(p::kTone, 1.0f, "Tone up");
  change(p::kOutput, -6.0f, "Output down");
  change(p::kMix, 0.5f, "Mix to half");
  change(p::kNoise, 0.5f, "Noise up");
  change(p::kMix, 1.0f, "Mix to full");

  // A wobble depth change does not zipper: no energy appears at the control
  // rate (3 kHz) or its neighbours while the depth moves.
  {
    clean(kCassette);
    run(device, sine(220.0f, 0.5f, kRate, 0.5f));
    device.set_param(p::kWobble, 1.0f);
    const Stereo out = run(device, sine(220.0f, 0.5f, kRate, 0.5f));
    EXPECT(db(tone_level(out.left, 3000.0, kRate) / tone_level(out.left, 220.0, kRate)) < -70.0,
           "Cassette: Wobble thrown to 1 leaves nothing at the control rate");
  }
}

// --- Output, Mix, the sample rate, sleep --------------------------------------------------

static void check_rest() {
  // Mix is a linear crossfade against the dry signal, delayed to match.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    rng_state() = 0xC0FFEEu;
    const std::vector<float> in = noise(0.5f, kRate, 0.5f);
    const Stereo out = run(device, in);
    double worst = 0.0;
    for (size_t i = kLatency; i < in.size(); ++i) {
      worst = std::max(worst, std::fabs(static_cast<double>(out.left[i]) - in[i - kLatency]));
    }
    EXPECT(worst == 0.0, "Mix 0 is the input, delayed by the latency");
    EXPECT(peak(out.left, 0, kLatency) == 0.0, "nothing before the latency");

    // With nothing on the medium the two are the same signal: any Mix is unity.
    clean(kReel);
    device.set_param(p::kMix, 0.5f);
    const double half = rms(run(device, sine(440.0f, 0.5f, kRate, 0.25f)).left, 12000);
    EXPECT_NEAR(db(half / (0.25 * 0.70711)), 0.0, 0.05,
                "Mix 0.5 of a clean medium is unity: linear, not equal power");
    clean(kReel);
    const double plain = rms(run(device, sine(440.0f, 0.5f, kRate, 0.1f)).left, 12000);
    clean(kReel);
    device.set_param(p::kOutput, 6.0f);
    const double up = rms(run(device, sine(440.0f, 0.5f, kRate, 0.1f)).left, 12000);
    EXPECT_NEAR(db(up / plain), 6.0, 0.05, "Output +6 dB is 6 dB");
    clean(kReel);
    device.set_param(p::kOutput, -12.0f);
    device.set_param(p::kMix, 0.0f);
    const double dry = rms(run(device, sine(440.0f, 0.5f, kRate, 0.1f)).left, 12000);
    EXPECT_NEAR(db(dry / plain), 0.0, 0.05, "Output does not touch the dry signal");
    device.init(kRate);
    const double stock = rms(run(device, sine(440.0f, 2.0f, kRate, kReference)).left, 48000);
    EXPECT_NEAR(db(stock / kReferenceRms), 0.0, 1.5,
                "the default patch keeps a tone within 1.5 dB");
  }

  // Contract 7: the character is the same at any sample rate. Clean at
  // zero, the same latency, the same edges, the same wobble, the same noise.
  for (float rate : {44100.0f, 96000.0f}) {
    char text[120];
    for (int medium = 0; medium < kMedia; ++medium) {
      for (float hz : {100.0f, 1000.0f, 10000.0f, 16000.0f}) {
        clean(medium, rate);
        const Stereo out = run(device, sine(hz, 0.5f, rate, kReference));
        const double level = db(tone_level(out.left, hz, rate, out.size() / 2) / kReference);
        std::snprintf(text, sizeof text, "%s at zero, %.0f Hz: %.0f Hz within 0.5 dB (%+.2f)",
                      kNames[medium], rate, hz, level);
        EXPECT(std::fabs(level) < 0.5, text);
      }
      clean(medium, rate);
      const std::vector<float> h = run(device, impulse(0.1f, rate, 0.01f)).left;
      size_t at = 0;
      for (size_t i = 0; i < h.size(); ++i) {
        if (std::fabs(h[i]) > std::fabs(h[at])) at = i;
      }
      std::snprintf(text, sizeof text, "%s at %.0f Hz: the same latency in samples", kNames[medium],
                    rate);
      // At 96 kHz the open high cut (40 kHz) is under half the rate, and
      // like any minimum-phase filter it leans half a sample late.
      EXPECT(at == kLatency || (rate > 50000.0f && at == kLatency + 1), text);
    }
    clean(kCassette, rate);
    device.set_param(p::kWear, 1.0f);
    double low, high;
    band(impulse_response(rate), &low, &high, rate);
    std::snprintf(text, sizeof text, "Cassette at Wear 1, %.0f Hz: still 60 Hz to 4.5 kHz", rate);
    EXPECT(std::fabs(low - 60.0) < 6.0 && std::fabs(high - 4500.0) < 360.0, text);

    clean(kCassette, rate);
    device.set_param(p::kWobble, 1.0f);
    const std::vector<float> pitch =
        deviation(run(device, sine(3000.0f, 30.0f, rate, 0.25f)).left, 3000.0, 4800, 30, rate);
    std::snprintf(text, sizeof text,
                  "Cassette at Wobble 1, %.0f Hz: the same pitch deviation (%.3f %%)", rate,
                  100.0 * largest(pitch));
    EXPECT(largest(pitch) > 0.009 && largest(pitch) < 0.0161, text);
    EXPECT_NEAR(dominant_frequency(centred(pitch), 100.0, 0.2, 4.0), 0.8, 0.04,
                "and the same rate");

    // Noise: as dense in the band that is heard (under 10 kHz) at any rate.
    for (int medium : {kReel, kVinyl, kRadio, kValve}) {
      clean(medium, rate);
      device.set_param(p::kNoise, 1.0f);
      const Stereo out = run(device, sine(100.0f, 4.0f, rate, 1.0e-5f));
      const size_t from = static_cast<size_t>(rate);
      const double total = rms(out.left, from);
      const double low_part = total * std::sqrt(1.0 - energy_above(out.left, 10000.0, rate, from));
      clean(medium);
      device.set_param(p::kNoise, 1.0f);
      const Stereo usual = run(device, sine(100.0f, 4.0f, kRate, 1.0e-5f));
      const double usual_low =
          rms(usual.left, 48000) * std::sqrt(1.0 - energy_above(usual.left, 10000.0, kRate, 48000));
      std::snprintf(text, sizeof text,
                    "%s at %.0f Hz: the noise under 10 kHz is within 2 dB (%+.2f)", kNames[medium],
                    rate, db(low_part / usual_low));
      EXPECT(std::fabs(db(low_part / usual_low)) < 2.0, text);
    }
    // The sampler's low rate is 6 kHz whatever the host's.
    clean(kSampler, rate);
    device.set_param(p::kWear, 1.0f);
    const Stereo folded = run(device, sine(5000.0f, 1.0f, rate, 0.25f));
    std::snprintf(text, sizeof text, "Sampler at Wear 1, %.0f Hz: 5 kHz still folds to 1 kHz",
                  rate);
    EXPECT(db(tone_level(folded.left, 1000.0, rate, folded.size() / 2) / 0.25) > -6.0, text);
  }

  // The device sleeps and wakes, and a medium chosen in its sleep is there
  // from the first sample.
  {
    device.init(kRate);
    run(device, sine(440.0f, 0.5f, kRate, 0.5f));
    render(device, 4.5f, kRate);
    const Stereo rest = render(device, 0.5f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the noise has faded");
    device.set_param(p::kMedium, static_cast<float>(kRadio));
    device.set_param(p::kWear, 1.0f);
    device.set_param(p::kNoise, 0.0f);
    const Stereo woken = run(device, sine(60.0f, 0.5f, kRate, 0.5f));
    EXPECT(peak(woken.left, kLatency) < 0.05,
           "woken as a radio: 60 Hz does not pass, even at first");
    const Stereo heard = run(device, sine(1000.0f, 0.5f, kRate, 0.5f));
    EXPECT(peak(heard.left, kLatency) > 0.2, "and 1 kHz does");
  }
}

int main() {
  Conformance spec;
  spec.name = "patina";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 4.5f;  // three seconds of noise, its fade, and the filters
  spec.max_peak = 6.0f;      // Output adds up to 12 dB
  check_effect(device, spec, kRate);

  for (int medium = 0; medium < kMedia; ++medium) {
    check_medium(medium);
    check_clean(medium);
  }
  check_drive();
  check_wobble();
  check_wear();
  check_tone();
  check_noise();
  check_clicks();
  check_rest();

  // The dearest setting: Radio, with its four-pole sides, its comb and its
  // static, everything well up, on noise.
  device.init(kRate);
  device.set_param(p::kMedium, static_cast<float>(kRadio));
  device.set_param(p::kDrive, 0.8f);
  device.set_param(p::kWobble, 1.0f);
  device.set_param(p::kWear, 0.7f);
  device.set_param(p::kNoise, 1.0f);
  device.set_param(p::kTone, 0.4f);
  rng_state() = 0xBEEFu;
  const std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("patina", 10.0f, kRate, [&] { run(device, input); });

  return finish("patina");
}
