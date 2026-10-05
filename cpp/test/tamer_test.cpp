// Native harness for Tamer (cpp/devices/tamer). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it this device: a tone that stands out of a bed
// of sound is turned down by what Depth asks for and the bed is left alone,
// a plain signal, a lone note, the partials of one note and a phrase of clean
// notes pass untouched,
// nothing ever comes out louder than it went in, Sharpness sets how wide a
// thing counts as standing out, Time sets how fast, From and To fence it in,
// and Listen plays exactly what was taken away. Nobody hears this run, so
// every check prints what it measured next to what was asked.

#include "../devices/tamer/tamer.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Tamer;
namespace p = livemix::tamer;

static Tamer device;

static const float kRate = 48000.0f;
static const double kSixthOctave = std::pow(2.0, 1.0 / 6.0);
// The octaves a pink bed from 20 Hz to 20 kHz spreads its power over.
static const double kBedOctaves = std::log2(1000.0);

static size_t at(double seconds, double rate = kRate) {
  return static_cast<size_t>(seconds * rate);
}

static void measured(const char* what, double value, const char* unit, const char* target) {
  std::printf("  %-66s %9.3f %-3s (%s)\n", what, value, unit, target);
}

// Pink noise: the test kit's white noise through Paul Kellet's refined
// filter (six one-poles and a one-sample delay), scaled to `level` RMS. The
// first second warms the filter up and is thrown away.
static std::vector<float> pink(float seconds, float rate, double level, uint32_t seed) {
  rng_state() = seed;
  const size_t warm = at(1.0, rate);
  const size_t total = at(seconds, rate);
  std::vector<float> out(total);
  double b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (size_t i = 0; i < warm + total; ++i) {
    const double w = white();
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.96900 * b2 + w * 0.1538520;
    b3 = 0.86650 * b3 + w * 0.3104856;
    b4 = 0.55000 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.0168980;
    const double value = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362;
    b6 = w * 0.115926;
    if (i >= warm) out[i - warm] = static_cast<float>(value);
  }
  const double scale = level / rms(out);
  for (float& v : out) v = static_cast<float>(v * scale);
  return out;
}

static std::vector<float> white_noise(float seconds, float rate, double level, uint32_t seed) {
  rng_state() = seed;
  std::vector<float> out = noise(seconds, rate);
  const double scale = level / rms(out);
  for (float& v : out) v = static_cast<float>(v * scale);
  return out;
}

// The band from `lo` to `hi`: a sixteenth-order Butterworth high-pass and a
// sixteenth-order low-pass (96 dB per octave each side) as biquads in double
// precision.
static std::vector<float> band_pass(const std::vector<float>& x, double lo, double hi,
                                    double rate) {
  const int kOrder = 16;
  std::vector<double> y(x.begin(), x.end());
  for (int side = 0; side < 2; ++side) {
    const double w = 2.0 * kPi * (side == 0 ? lo : hi) / rate;
    for (int section = 0; section < kOrder / 2; ++section) {
      const double q = 1.0 / (2.0 * std::cos(kPi * (2 * section + 1) / (2.0 * kOrder)));
      const double alpha = std::sin(w) / (2.0 * q);
      const double cosw = std::cos(w);
      const double a0 = 1.0 + alpha;
      const double b1 = (side == 0 ? -(1.0 + cosw) : 1.0 - cosw) / a0;
      const double b0 = (side == 0 ? 1.0 + cosw : 1.0 - cosw) * 0.5 / a0;
      const double a1 = -2.0 * cosw / a0;
      const double a2 = (1.0 - alpha) / a0;
      double z1 = 0.0, z2 = 0.0;
      for (double& v : y) {
        const double out = b0 * v + z1;
        z1 = b1 * v - a1 * out + z2;
        z2 = b0 * v - a2 * out;
        v = out;
      }
    }
  }
  return std::vector<float>(y.begin(), y.end());
}

// RMS of `x` in the third-octave band centred on `centre`, over [from, to).
static double third_octave(const std::vector<float>& x, double centre, size_t from, size_t to,
                           double rate = kRate) {
  return rms(band_pass(x, centre / kSixthOctave, centre * kSixthOctave, rate), from, to);
}

// `x` with the steady sine at `hz` taken out: a least-squares sine fitted to
// each quarter second and subtracted. What is left is the sound around it.
static std::vector<float> without_tone(const std::vector<float>& x, double hz,
                                       double rate = kRate) {
  std::vector<float> out = x;
  const size_t piece = at(0.25, rate);
  for (size_t start = 0; start + piece <= x.size(); start += piece) {
    double c = 0.0, s = 0.0;
    for (size_t i = start; i < start + piece; ++i) {
      const double phase = 2.0 * kPi * hz * static_cast<double>(i) / rate;
      c += x[i] * std::cos(phase);
      s += x[i] * std::sin(phase);
    }
    c *= 2.0 / static_cast<double>(piece);
    s *= 2.0 / static_cast<double>(piece);
    for (size_t i = start; i < start + piece; ++i) {
      const double phase = 2.0 * kPi * hz * static_cast<double>(i) / rate;
      out[i] = static_cast<float>(x[i] - c * std::cos(phase) - s * std::sin(phase));
    }
  }
  return out;
}

// The amplitude of a sine that stands `excess_db` above a pink bed of
// `bed_rms`, for an ear that is `width` octaves wide: the tone's power over
// that width against the bed's power per octave.
static double tone_over_bed(double bed_rms, double excess_db, double width) {
  const double bed_per_octave = bed_rms * bed_rms / kBedOctaves;
  return std::sqrt(2.0 * bed_per_octave * width * std::pow(10.0, excess_db / 10.0));
}

static void add_tone(std::vector<float>* x, double hz, double amplitude, double rate = kRate,
                     size_t from = 0) {
  const size_t fade = at(0.005, rate);
  for (size_t i = from; i < x->size(); ++i) {
    const double in = from == 0 ? 1.0 : std::min(1.0, static_cast<double>(i - from) / fade);
    (*x)[i] += static_cast<float>(in * amplitude * std::sin(2.0 * kPi * hz * i / rate));
  }
}

struct Settings {
  float depth = 0.5f;
  float sharpness = 0.6f;
  float time = 60.0f;
  float from = 120.0f;
  float to = 16000.0f;
  float listen = 0.0f;
};

static void set(const Settings& s, float rate = kRate) {
  device.init(rate);
  device.set_param(p::kDepth, s.depth);
  device.set_param(p::kSharpness, s.sharpness);
  device.set_param(p::kTime, s.time);
  device.set_param(p::kFrom, s.from);
  device.set_param(p::kTo, s.to);
  device.set_param(p::kListen, s.listen);
}

// Run a stereo signal through the device, keeping the deepest cut it reported
// in each block.
static Stereo run_metered(const std::vector<float>& left, const std::vector<float>& right,
                          std::vector<float>* reduction) {
  Stereo out;
  out.left.resize(left.size());
  out.right.resize(left.size());
  size_t done = 0;
  while (done < left.size()) {
    const int frames = static_cast<int>(std::min(static_cast<size_t>(kBlock), left.size() - done));
    for (int i = 0; i < frames; ++i) {
      device.in_left()[i] = left[done + i];
      device.in_right()[i] = right[done + i];
    }
    device.process(frames);
    for (int i = 0; i < frames; ++i) {
      out.left[done + i] = device.out_left()[i];
      out.right[done + i] = device.out_right()[i];
    }
    if (reduction) reduction->push_back(device.meter(0));
    done += frames;
  }
  return out;
}

static double lowest(const std::vector<float>& x, size_t from = 0) {
  double low = 0.0;
  for (size_t i = from; i < x.size(); ++i) low = std::min(low, static_cast<double>(x[i]));
  return low;
}

static const double kThirds[] = {63,   80,   100,  125,  160,  200,  250,  315,  400,
                                 500,  630,  800,  1000, 1250, 1600, 2000, 2500, 3150,
                                 4000, 5000, 6300, 8000, 10000, 12500, 16000};

// The most any third-octave band of `out` rises above the same band of `in`,
// and the most one falls under it, in dB, over [from, to).
static void band_changes(const std::vector<float>& in, const std::vector<float>& out, size_t from,
                         size_t to, double rate, double* most_up, double* most_down,
                         double skip_lo = 0.0, double skip_hi = 0.0) {
  *most_up = -200.0;
  *most_down = 200.0;
  for (double centre : kThirds) {
    if (centre * kSixthOctave > 0.45 * rate) continue;
    if (centre > skip_lo && centre < skip_hi) continue;
    const double before = third_octave(in, centre, from, to, rate);
    const double after = third_octave(out, centre, from, to, rate);
    if (before < 1.0e-7) continue;
    const double change = db(after / before);
    *most_up = std::max(*most_up, change);
    *most_down = std::min(*most_down, change);
  }
}

// --- the checks ---------------------------------------------------------------------------

static void test_plain_signal_is_left_alone() {
  std::printf("A plain signal is left alone\n");
  struct Case {
    const char* name;
    std::vector<float> left, right;
  };
  const float seconds = 12.0f;
  Case cases[] = {
      {"pink noise, two channels", pink(seconds, kRate, 0.1, 11), pink(seconds, kRate, 0.1, 12)},
      {"pink noise, mono", pink(seconds, kRate, 0.1, 13), {}},
      {"white noise, two channels", white_noise(seconds, kRate, 0.1, 14),
       white_noise(seconds, kRate, 0.1, 15)},
  };
  for (Case& c : cases) {
    if (c.right.empty()) c.right = c.left;
    set(Settings{});
    std::vector<float> reduction;
    const Stereo out = run_metered(c.left, c.right, &reduction);
    const size_t from = at(2.0);
    double up, down;
    band_changes(c.left, out.left, from, c.left.size(), kRate, &up, &down);
    char label[160];
    std::snprintf(label, sizeof label, "%s: level, out against in", c.name);
    const double level = db(rms(out.left, from) / rms(c.left, from));
    measured(label, level, "dB", "within 0.1");
    EXPECT(std::fabs(level) < 0.1, label);
    std::snprintf(label, sizeof label, "%s: the third-octave band that falls most", c.name);
    measured(label, down, "dB", "above -0.3");
    EXPECT(down > -0.3, label);
    std::snprintf(label, sizeof label, "%s: the band that rises most", c.name);
    measured(label, up, "dB", "under 0.02");
    EXPECT(up < 0.02, label);
    double sum = 0.0;
    for (size_t i = at(2.0) / kBlock; i < reduction.size(); ++i) sum += reduction[i];
    std::snprintf(label, sizeof label, "%s: deepest cut, mean over time", c.name);
    measured(label, sum / (reduction.size() - at(2.0) / kBlock), "dB", "above -0.5");
    EXPECT(sum / (reduction.size() - at(2.0) / kBlock) > -0.5, label);
    std::snprintf(label, sizeof label, "%s: deepest cut, ever", c.name);
    measured(label, lowest(reduction, at(2.0) / kBlock), "dB", "above -2.5");
    EXPECT(lowest(reduction, at(2.0) / kBlock) > -2.5, label);
  }
}

// A pink bed with one sine standing `excess` dB out of it; how far the tone
// and the bed around it come down.
struct Pulled {
  double tone_db;       // the tone, out against in
  double bed_near_db;   // the bed half an octave either side of it (the worse)
  double bed_far_down;  // the bed's band that falls most, an octave or more away
  double bed_far_up;
  double meter_db;      // the deepest cut reported, at the end
  double shown_db;      // what the display's readings say is cut nearest the tone, at the end
  double shown_far_db;  // and the most they say is cut an octave or more away
};

// The cut the display's readings show at each of its 48 points, in dB (0 or
// below): readings 1 to 12, four points to a reading, six bits each, in half
// decibels, the lowest point in the lowest bits.
static std::vector<double> shown_cuts() {
  std::vector<double> cuts;
  for (int reading = 1; reading <= 12; ++reading) {
    int packed = static_cast<int>(device.meter(reading));
    for (int point = 0; point < 4; ++point, packed /= 64) cuts.push_back(-0.5 * (packed % 64));
  }
  return cuts;
}

// Where the display's point `p` stands: 48 of them, even in pitch, 40 Hz to 20 kHz.
static double shown_hz(int p) { return 40.0 * std::pow(500.0, p / 47.0); }

static Pulled pull(const Settings& s, double hz, double excess_db, float rate = kRate,
                   uint32_t seed = 21) {
  const float seconds = 10.0f;
  std::vector<float> left = pink(seconds, rate, 0.05, seed);
  std::vector<float> right = pink(seconds, rate, 0.05, seed + 1);
  const double amplitude = tone_over_bed(0.05, excess_db, 1.0 / 12.0);
  add_tone(&left, hz, amplitude, rate);
  add_tone(&right, hz, amplitude, rate);
  set(s, rate);
  std::vector<float> reduction;
  const Stereo out = run_metered(left, right, &reduction);
  const size_t from = at(4.0, rate);
  const size_t to = left.size();
  Pulled result;
  result.tone_db =
      db(tone_level(out.left, hz, rate, from, to) / tone_level(left, hz, rate, from, to));
  const std::vector<float> bed_in = without_tone(left, hz, rate);
  const std::vector<float> bed_out = without_tone(out.left, hz, rate);
  result.bed_near_db = 0.0;
  for (double side : {-0.5, 0.5}) {
    const double centre = hz * std::pow(2.0, side);
    const double twelfth = std::pow(2.0, 1.0 / 24.0);
    const double lo = centre / twelfth;
    const double hi = centre * twelfth;
    const double before = rms(band_pass(bed_in, lo, hi, rate), from, to);
    const double after = rms(band_pass(bed_out, lo, hi, rate), from, to);
    result.bed_near_db = std::min(result.bed_near_db, db(after / before));
  }
  band_changes(bed_in, bed_out, from, to, rate, &result.bed_far_up, &result.bed_far_down, hz / 2.2,
               hz * 2.2);
  result.meter_db = reduction.back();
  const std::vector<double> shown = shown_cuts();
  int nearest = 0;
  result.shown_far_db = 0.0;
  for (int p = 0; p < 48; ++p) {
    const double away = std::fabs(std::log2(shown_hz(p) / hz));
    if (away < std::fabs(std::log2(shown_hz(nearest) / hz))) nearest = p;
    if (away >= 1.0) {
      result.shown_far_db = std::min(result.shown_far_db, shown[p]);
    }
  }
  result.shown_db = shown[nearest];
  return result;
}

static void test_a_tone_that_stands_out_is_pulled_down() {
  std::printf("A tone that stands out of a bed is pulled down, and the bed is not\n");
  Settings s;
  s.sharpness = 1.0f;
  char label[160];
  double last = 0.0;
  for (float depth : {0.25f, 0.5f, 0.75f, 1.0f}) {
    s.depth = depth;
    const Pulled got = pull(s, 1130.0, 15.0);
    // What was asked: Depth times what stands out over the margin.
    const double margin = 4.0 - 3.0 * depth;
    const double asked = -depth * (15.0 - margin);
    std::snprintf(label, sizeof label, "Depth %.2f, 1130 Hz 15 dB out: the tone (asked %.1f)", depth,
                  asked);
    measured(label, got.tone_db, "dB", "within 2.5 of what was asked");
    EXPECT_NEAR(got.tone_db, asked, 2.5, label);
    EXPECT(got.tone_db < last - 1.0, "more Depth pulls the tone further down");
    last = got.tone_db;
    std::snprintf(label, sizeof label, "Depth %.2f: the meter against the tone", depth);
    measured(label, got.meter_db - got.tone_db, "dB", "within 2");
    EXPECT_NEAR(got.meter_db, got.tone_db, 2.0, label);
    // The display's points are 0.19 of an octave apart and a cut at full
    // Sharpness is a sixth of one wide, so the nearest point reads less than
    // the tone gets: between none of it and all of it.
    std::snprintf(label, sizeof label, "Depth %.2f: the display's point nearest the tone", depth);
    measured(label, got.shown_db, "dB", "between the meter and 0");
    EXPECT(got.shown_db <= 0.0 && got.shown_db >= got.meter_db - 0.5, label);
    std::snprintf(label, sizeof label, "Depth %.2f: the display an octave or more away", depth);
    measured(label, got.shown_far_db, "dB", "above -1.5");
    EXPECT(got.shown_far_db > -1.5, label);
    std::snprintf(label, sizeof label, "Depth %.2f: the bed an octave or more away", depth);
    measured(label, got.bed_far_down, "dB", "above -0.3");
    EXPECT(got.bed_far_down > -0.3 && got.bed_far_up < 0.02, label);
    std::snprintf(label, sizeof label, "Depth %.2f: the bed half an octave away", depth);
    measured(label, got.bed_near_db, "dB", "above -1");
    EXPECT(got.bed_near_db > -1.0, label);
  }
  s.depth = 1.0f;
  for (double hz : {180.0, 420.0, 2600.0, 6100.0, 11000.0}) {
    const Pulled got = pull(s, hz, 15.0);
    std::snprintf(label, sizeof label, "Depth 1, %.0f Hz 15 dB out: the tone (asked -14)", hz);
    measured(label, got.tone_db, "dB", hz < 400.0 ? "under -6" : "within 3 of -14");
    if (hz < 400.0) {
      EXPECT(got.tone_db < -6.0, label);
    } else {
      EXPECT_NEAR(got.tone_db, -14.0, 3.0, label);
    }
    std::snprintf(label, sizeof label, "Depth 1, %.0f Hz: the bed an octave or more away", hz);
    measured(label, got.bed_far_down, "dB", hz < 400.0 ? "above -0.7" : "above -0.4");
    EXPECT(got.bed_far_down > (hz < 400.0 ? -0.7 : -0.4) && got.bed_far_up < 0.02, label);
  }
  for (float rate : {44100.0f, 96000.0f}) {
    const Pulled got = pull(s, 1130.0, 15.0, rate);
    std::snprintf(label, sizeof label, "Depth 1 at %.1f kHz, 1130 Hz 15 dB out: the tone", rate / 1000.0);
    measured(label, got.tone_db, "dB", "within 3 of -14");
    EXPECT_NEAR(got.tone_db, -14.0, 3.0, label);
  }
}


// A sum of harmonics at 1/n, the partials of one sawtooth note.
static std::vector<float> saw_note(double hz, float seconds, float rate, double level) {
  std::vector<float> out(at(seconds, rate), 0.0f);
  for (int n = 1; hz * n < 0.4 * rate; ++n) {
    for (size_t i = 0; i < out.size(); ++i) {
      out[i] += static_cast<float>(std::sin(2.0 * kPi * hz * n * i / rate) / n);
    }
  }
  const double scale = level / rms(out);
  for (float& v : out) v = static_cast<float>(v * scale);
  return out;
}

static bool same(const std::vector<float>& a, const std::vector<float>& b) { return a == b; }

static void test_the_sound_itself_is_not_a_peak() {
  std::printf("The sound itself is not a peak: a lone note and one note's partials pass\n");
  Settings s;
  s.depth = 1.0f;
  s.sharpness = 1.0f;
  char label[160];
  // A note that fades in over 20 ms, as any played note does: nothing is cut,
  // so the output is the input sample for sample.
  for (double hz : {55.0, 110.0, 440.0, 1000.0, 1700.0, 3000.0, 9000.0}) {
    std::vector<float> in = sine(static_cast<float>(hz), 4.0f, kRate, 0.25f);
    const size_t fade = at(0.02);
    for (size_t i = 0; i < fade; ++i) {
      in[i] *= static_cast<float>(0.5 - 0.5 * std::cos(kPi * static_cast<double>(i) / fade));
    }
    set(s);
    const Stereo out = run(device, in);
    std::snprintf(label, sizeof label, "a lone sine at %.0f Hz, Depth 1: the output is the input", hz);
    measured(label, db(rms(out.left) / rms(in)), "dB", "0, sample for sample");
    EXPECT(same(out.left, in) && same(out.right, in), label);
  }
  // Switched on at full level it starts with a click, which is every
  // frequency at once: for a moment there is a bed for the click's own
  // remains to stand out of. What is cut then is under a decibel, 60 dB
  // under the note, and once it is let go the output is the input again.
  for (double hz : {55.0, 110.0, 440.0, 1000.0, 1700.0, 3000.0, 9000.0}) {
    const std::vector<float> in = sine(static_cast<float>(hz), 5.0f, kRate, 0.25f);
    set(s);
    std::vector<float> reduction;
    const Stereo out = run_metered(in, in, &reduction);
    std::snprintf(label, sizeof label, "a sine switched on at %.0f Hz, Depth 1: deepest cut, ever", hz);
    measured(label, lowest(reduction), "dB", "above -1");
    EXPECT(lowest(reduction) > -1.0, label);
    const size_t from = at(3.0);
    const bool wire = std::equal(out.left.begin() + from, out.left.end(), in.begin() + from) &&
                      std::equal(out.right.begin() + from, out.right.end(), in.begin() + from);
    std::snprintf(label, sizeof label, "a sine switched on at %.0f Hz: a wire again 3 s on", hz);
    EXPECT(wire, label);
  }
  for (float sharpness : {0.2f, 0.6f, 1.0f}) {
    s.sharpness = sharpness;
    for (double hz : {55.0, 110.0, 220.0, 440.0}) {
      const std::vector<float> in = saw_note(hz, 4.0f, kRate, 0.2);
      set(s);
      std::vector<float> reduction;
      const Stereo out = run_metered(in, in, &reduction);
      double worst = 0.0;
      for (int n = 1; hz * n < 16000.0; ++n) {
        const double change = db(tone_level(out.left, hz * n, kRate, at(2.0), in.size()) /
                                 tone_level(in, hz * n, kRate, at(2.0), in.size()));
        worst = std::min(worst, change);
        EXPECT(change < 0.05, "no partial of a note rises");
      }
      std::snprintf(label, sizeof label,
                    "a sawtooth note at %.0f Hz, Depth 1, Sharpness %.1f: the partial that falls most",
                    hz, sharpness);
      measured(label, worst, "dB", "above -1");
      EXPECT(worst > -1.0, label);
    }
  }
  // A chord of four such notes is a bed of partials; nothing in it rings.
  s.sharpness = 0.6f;
  s.depth = 0.5f;
  std::vector<float> chord(at(6.0), 0.0f);
  for (double hz : {110.0, 164.81, 220.0, 277.18}) {
    const std::vector<float> note = saw_note(hz, 6.0f, kRate, 0.07);
    for (size_t i = 0; i < chord.size(); ++i) chord[i] += note[i];
  }
  set(s);
  std::vector<float> reduction;
  const Stereo out = run_metered(chord, chord, &reduction);
  const double level = db(rms(out.left, at(2.0)) / rms(chord, at(2.0)));
  measured("a chord of four sawtooth notes at the defaults: level, out against in", level, "dB",
           "above -1");
  EXPECT(level > -1.0 && level < 0.001, "a plain chord keeps its level");
  measured("a chord of four sawtooth notes at the defaults: deepest cut", lowest(reduction), "dB",
           "above -4");
  EXPECT(lowest(reduction) > -4.0, "a plain chord is hardly cut");
}

// A phrase of clean notes: each a fundamental and two partials that swell in
// over 4 ms and die away over seconds, a new one every 0.45 s over the ones
// still ringing. Every new note stands 10 to 20 dB over the older ones on
// both sides of it, as a ringing tone stands over a bed; what tells the two
// apart is that between notes there is nothing.
static std::vector<float> clean_phrase(float seconds, double level) {
  std::vector<float> out(at(seconds), 0.0f);
  const int notes[] = {57, 60, 64, 69, 72, 76, 67, 62, 59, 64, 71, 74};
  int n = 0;
  for (double start = 0.1; start < seconds - 1.0; start += 0.45, ++n) {
    const double hz = 440.0 * std::pow(2.0, (notes[n % 12] - 69) / 12.0);
    const size_t first = at(start);
    for (size_t i = first; i < out.size(); ++i) {
      const double t = static_cast<double>(i - first) / kRate;
      const double swell = std::min(1.0, t / 0.004);
      const double ring = std::exp(-t / 1.2);
      const double tone = std::sin(2.0 * kPi * hz * t) + 0.25 * std::sin(2.0 * kPi * 2.0 * hz * t) +
                          0.1 * std::sin(2.0 * kPi * 3.0 * hz * t);
      out[i] += static_cast<float>(level * swell * ring * tone);
    }
  }
  return out;
}

static void test_clean_notes_are_not_a_bed() {
  std::printf("Clean notes over other clean notes are left alone: there is no bed between them\n");
  const std::vector<float> phrase = clean_phrase(8.0f, 0.12);
  struct Case {
    const char* name;
    float depth, sharpness;
    double least_level, least_cut;
  };
  const Case cases[] = {{"the defaults", 0.5f, 0.6f, -0.05, -2.0},
                        {"Depth 1, Sharpness 1", 1.0f, 1.0f, -0.2, -6.0},
                        {"Depth 1, Sharpness 0.3", 1.0f, 0.3f, -0.2, -6.0}};
  char label[160];
  char target[40];
  for (const Case& c : cases) {
    Settings s;
    s.depth = c.depth;
    s.sharpness = c.sharpness;
    set(s);
    std::vector<float> reduction;
    const Stereo out = run_metered(phrase, phrase, &reduction);
    const double level = db(rms(out.left) / rms(phrase));
    std::snprintf(label, sizeof label, "a phrase of clean notes, %s: level, out against in", c.name);
    std::snprintf(target, sizeof target, "above %.2f", c.least_level);
    measured(label, level, "dB", target);
    EXPECT(level > c.least_level && level < 0.001, label);
    std::snprintf(label, sizeof label, "a phrase of clean notes, %s: deepest cut, ever", c.name);
    std::snprintf(target, sizeof target, "above %.0f", c.least_cut);
    measured(label, lowest(reduction), "dB", target);
    EXPECT(lowest(reduction) > c.least_cut, label);
  }
  // The same phrase with a bed under it, 30 dB down: now there is something
  // for a note to stand out of, and Depth takes the loudest of them down.
  // This is the one thing the device cannot tell from a ringing tone.
  std::vector<float> bedded = phrase;
  const std::vector<float> bed = pink(8.0f, kRate, rms(phrase) * std::pow(10.0, -30.0 / 20.0), 91);
  for (size_t i = 0; i < bedded.size(); ++i) bedded[i] += bed[i];
  Settings s;
  set(s);
  std::vector<float> reduction;
  const Stereo out = run_metered(bedded, bedded, &reduction);
  measured("the same phrase over a bed 30 dB down, the defaults: level, out against in",
           db(rms(out.left) / rms(bedded)), "dB", "");
  measured("the same phrase over a bed 30 dB down, the defaults: deepest cut, ever",
           lowest(reduction), "dB", "");
}

static void test_depth_zero_is_a_wire() {
  std::printf("Depth 0 is a wire\n");
  Settings s;
  s.depth = 0.0f;
  std::vector<float> left = pink(4.0f, kRate, 0.05, 31);
  add_tone(&left, 2000.0, 0.1);
  set(s);
  const Stereo out = run(device, left);
  measured("a bed with a loud tone, Depth 0: samples that differ", same(out.left, left) ? 0 : 1, "",
           "0");
  EXPECT(same(out.left, left), "Depth 0 passes the input, sample for sample");
}

static void test_sharpness() {
  std::printf("Sharpness sets how wide a thing counts as standing out\n");
  char label[160];
  // One tone 15 dB out: sharp picks it out, broad sees a hump too small to act on.
  Settings s;
  s.depth = 1.0f;
  double tone[3];
  double near[3];
  int n = 0;
  for (float sharpness : {0.0f, 0.5f, 1.0f}) {
    s.sharpness = sharpness;
    const Pulled got = pull(s, 1130.0, 15.0);
    tone[n] = got.tone_db;
    near[n] = got.bed_near_db;
    std::snprintf(label, sizeof label, "Sharpness %.1f, one tone 15 dB out: the tone", sharpness);
    measured(label, got.tone_db, "dB", n == 2 ? "under -11" : "less than at 1");
    std::snprintf(label, sizeof label, "Sharpness %.1f: the bed half an octave away", sharpness);
    measured(label, got.bed_near_db, "dB", "");
    if (n == 0) {
      // A broad cut is wider than the display's points are apart, so the
      // point nearest the tone shows what the tone gets.
      measured("Sharpness 0.0: the display's point nearest the tone, against the tone",
               got.shown_db - got.tone_db, "dB", "within 1");
      EXPECT_NEAR(got.shown_db, got.tone_db, 1.0, "the display shows a broad cut as deep as it is");
    }
    ++n;
  }
  EXPECT(tone[2] < -11.0, "at full Sharpness a single tone is pulled right down");
  EXPECT(tone[0] > tone[1] && tone[1] > tone[2], "less Sharpness leaves a single tone more alone");
  EXPECT(near[0] / std::min(tone[0], -0.01) > near[2] / tone[2],
         "less Sharpness takes more of the bed around the tone with it");

  // A broad hump: pink noise through a wide bell of +10 dB at 1 kHz. Broad
  // flattens it, sharp finds nothing narrow in it.
  std::vector<float> bed = pink(10.0f, kRate, 0.05, 41);
  std::vector<float> humped = bed;
  {
    const double w = 2.0 * kPi * 1000.0 / kRate;
    const double amp = std::pow(10.0, 10.0 / 40.0);
    const double alpha = std::sin(w) / (2.0 * 1.0);
    const double a0 = 1.0 + alpha / amp;
    const double b0 = (1.0 + alpha * amp) / a0, b1 = -2.0 * std::cos(w) / a0,
                 b2 = (1.0 - alpha * amp) / a0, a2 = (1.0 - alpha / amp) / a0;
    double z1 = 0.0, z2 = 0.0;
    for (float& v : humped) {
      const double y = b0 * v + z1;
      z1 = b1 * v - b1 * y + z2;
      z2 = b2 * v - a2 * y;
      v = static_cast<float>(y);
    }
  }
  double hump[2];
  n = 0;
  for (float sharpness : {0.0f, 1.0f}) {
    s.sharpness = sharpness;
    set(s);
    const Stereo out = run(device, humped);
    hump[n] = db(third_octave(out.left, 1000.0, at(4.0), humped.size()) /
                 third_octave(humped, 1000.0, at(4.0), humped.size()));
    std::snprintf(label, sizeof label, "Sharpness %.1f, a hump of 10 dB an octave wide: its top",
                  sharpness);
    measured(label, hump[n], "dB", n == 0 ? "under -5" : "above -3.5");
    ++n;
  }
  EXPECT(hump[0] < -5.0, "at no Sharpness a broad hump is flattened");
  EXPECT(hump[1] > -3.5, "at full Sharpness a broad hump is cut about half as much");
}

// How long after `from` the meter first passes `share` of the way from
// `start` to `end`, in seconds; -1 when it never does.
static double time_to(const std::vector<float>& reduction, size_t from_block, double start,
                      double end, double share) {
  const double goal = start + (end - start) * share;
  for (size_t i = from_block; i < reduction.size(); ++i) {
    const bool there = end < start ? reduction[i] <= goal : reduction[i] >= goal;
    if (there) return static_cast<double>(i - from_block) * kBlock / kRate;
  }
  return -1.0;
}

static void test_time() {
  std::printf("Time sets how fast a cut comes in, and it lets go four times slower\n");
  char label[160];
  Settings s;
  s.depth = 1.0f;
  s.sharpness = 1.0f;
  double came[3];
  double went[3];
  int n = 0;
  for (float time : {10.0f, 100.0f, 600.0f}) {
    s.time = time;
    // A bed for 3 s, the tone for 6 s, the bed alone again.
    const size_t on = at(3.0);
    const size_t off = at(9.0);
    std::vector<float> left = pink(16.0f, kRate, 0.05, 51);
    const double amplitude = tone_over_bed(0.05, 18.0, 1.0 / 12.0);
    const size_t fade = at(0.005);
    for (size_t i = on; i < off; ++i) {
      const double in = std::min(1.0, static_cast<double>(i - on) / fade);
      const double out = std::min(1.0, static_cast<double>(off - i) / fade);
      left[i] += static_cast<float>(in * out * amplitude * std::sin(2.0 * kPi * 4000.0 * i / kRate));
    }
    set(s);
    std::vector<float> reduction;
    run_metered(left, left, &reduction);
    const double full = reduction[off / kBlock - 1];
    came[n] = time_to(reduction, on / kBlock, 0.0, full, 0.632);
    went[n] = time_to(reduction, off / kBlock, full, 0.0, 0.632);
    std::snprintf(label, sizeof label, "Time %.0f ms, a tone at 4 kHz 18 dB out: the cut it settles at",
                  time);
    measured(label, full, "dB", "under -12");
    EXPECT(full < -12.0, label);
    std::snprintf(label, sizeof label, "Time %.0f ms: until 63 %% of the cut is in", time);
    measured(label, came[n] * 1000.0, "ms", "the ear's 21 ms and smoothing, then Time");
    std::snprintf(label, sizeof label, "Time %.0f ms: until 63 %% of it is let go", time);
    measured(label, went[n] * 1000.0, "ms", "four times Time, and the smoothing");
    ++n;
  }
  EXPECT(came[0] > 0.0 && came[0] < 0.09, "at 10 ms a cut at 4 kHz is in within 90 ms");
  EXPECT_NEAR(came[1], 0.15, 0.07, "at 100 ms a cut takes about 100 ms and the ear's delay");
  EXPECT_NEAR(came[2], 0.65, 0.2, "at 600 ms a cut takes about 600 ms");
  EXPECT(went[0] > 0.0 && went[0] < 0.2, "at 10 ms a cut is let go within 0.2 s");
  EXPECT_NEAR(went[1], 0.45, 0.15, "at 100 ms a cut is let go in about 0.4 s");
  EXPECT_NEAR(went[2], 2.45, 0.5, "at 600 ms a cut is let go in about 2.4 s");
}

static void test_range() {
  std::printf("From and To fence it in\n");
  Settings s;
  s.depth = 1.0f;
  s.sharpness = 1.0f;
  s.from = 2000.0f;
  Pulled got = pull(s, 1130.0, 15.0);
  measured("From 2 kHz, a tone at 1130 Hz 15 dB out: the tone", got.tone_db, "dB", "above -0.3");
  EXPECT(got.tone_db > -0.3, "a tone below From is left alone");
  s.from = 120.0f;
  s.to = 2000.0f;
  got = pull(s, 6100.0, 15.0);
  measured("To 2 kHz, a tone at 6100 Hz 15 dB out: the tone", got.tone_db, "dB", "above -0.3");
  EXPECT(got.tone_db > -0.3, "a tone above To is left alone");
  got = pull(s, 1130.0, 15.0);
  measured("To 2 kHz, a tone at 1130 Hz 15 dB out: the tone", got.tone_db, "dB", "under -11");
  EXPECT(got.tone_db < -11.0, "a tone between From and To is pulled down");
}

static void test_listen() {
  std::printf("Listen plays exactly what was taken away\n");
  Settings s;
  s.depth = 1.0f;
  s.sharpness = 1.0f;
  std::vector<float> left = pink(8.0f, kRate, 0.05, 61);
  std::vector<float> right = pink(8.0f, kRate, 0.05, 62);
  const double amplitude = tone_over_bed(0.05, 15.0, 1.0 / 12.0);
  add_tone(&left, 1130.0, amplitude);
  add_tone(&right, 1130.0, amplitude);
  set(s);
  const Stereo kept = run(device, left, right);
  s.listen = 1.0f;
  set(s);
  const Stereo taken = run(device, left, right);
  double worst = 0.0;
  for (size_t i = 0; i < left.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(kept.left[i]) + taken.left[i] - left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(kept.right[i]) + taken.right[i] - right[i]));
  }
  measured("what is kept plus what is taken, against the input: largest gap", worst * 1.0e6,
           "e-6", "under 1");
  EXPECT(worst < 1.0e-6, "what is kept and what is taken add up to the input");
  const double tone = tone_level(taken.left, 1130.0, kRate, at(4.0), left.size());
  const double all = rms(taken.left, at(4.0));
  measured("what is taken: the share of it that is the tone", 100.0 * tone * tone / (2.0 * all * all),
           "%", "over 60");
  EXPECT(tone * tone / (2.0 * all * all) > 0.6, "what is taken is mostly the tone");
  measured("what is taken: its level against the input", db(all / rms(left, at(4.0))), "dB",
           "under 0");
  EXPECT(all < rms(left, at(4.0)), "what is taken is quieter than the input");
  // Switched while sounding it crosses over without a step.
  s.listen = 0.0f;
  set(s);
  const std::vector<float> low = sine(110.0f, 1.0f, kRate, 0.5f);
  run(device, low);
  device.set_param(p::kListen, 1.0f);
  const Stereo crossing = run(device, low);
  measured("Listen switched on over a 110 Hz sine: largest step", max_step(crossing.left), "",
           "under 0.012");
  EXPECT(max_step(crossing.left) < 0.012, "Listen crosses over without a click");
}

// Many tones a third apart on a bed, a comb of them, a dense chord: whatever
// the device does to these, no band may come out louder.
static void test_it_never_adds_level() {
  std::printf("Nothing comes out louder than it went in\n");
  struct Case {
    const char* name;
    std::vector<float> left, right;
    Settings s;
  };
  std::vector<Case> cases;
  {
    Case c;
    c.name = "seven tones on a bed, Depth 1, Sharpness 1";
    c.left = pink(8.0f, kRate, 0.05, 71);
    c.right = pink(8.0f, kRate, 0.05, 72);
    for (double hz : {210.0, 395.0, 880.0, 1900.0, 3300.0, 6100.0, 9800.0}) {
      add_tone(&c.left, hz, tone_over_bed(0.05, 18.0, 1.0 / 12.0));
      add_tone(&c.right, hz, tone_over_bed(0.05, 18.0, 1.0 / 12.0));
    }
    c.s.depth = 1.0f;
    c.s.sharpness = 1.0f;
    c.s.time = 10.0f;
    cases.push_back(c);
    c.name = "the same, Sharpness 0.3";
    c.s.sharpness = 0.3f;
    cases.push_back(c);
  }
  {
    Case c;
    c.name = "white noise in bursts, Depth 1, Time 10 ms";
    c.left = white_noise(8.0f, kRate, 0.2, 73);
    for (size_t i = 0; i < c.left.size(); ++i) {
      if ((i / at(0.11)) % 2 == 1) c.left[i] *= 0.05f;
    }
    c.right = c.left;
    c.s.depth = 1.0f;
    c.s.time = 10.0f;
    cases.push_back(c);
  }
  {
    Case c;
    c.name = "a chord of sawtooth notes with a tone, defaults";
    c.left.assign(at(8.0), 0.0f);
    for (double hz : {98.0, 146.83, 196.0, 246.94, 293.66}) {
      const std::vector<float> note = saw_note(hz, 8.0f, kRate, 0.06);
      for (size_t i = 0; i < c.left.size(); ++i) c.left[i] += note[i];
    }
    add_tone(&c.left, 2470.0, 0.05);
    c.right = c.left;
    cases.push_back(c);
  }
  char label[200];
  for (Case& c : cases) {
    set(c.s);
    const Stereo out = run(device, c.left, c.right);
    double up, down;
    band_changes(c.left, out.left, at(1.0), c.left.size(), kRate, &up, &down);
    std::snprintf(label, sizeof label, "%s: the third-octave band that rises most", c.name);
    measured(label, up, "dB", "under 0.05");
    EXPECT(up < 0.05, label);
    std::snprintf(label, sizeof label, "%s: the band that falls most", c.name);
    measured(label, down, "dB", "");
    const double level = db(rms(out.left) / rms(c.left));
    std::snprintf(label, sizeof label, "%s: level, out against in", c.name);
    measured(label, level, "dB", "0 or under");
    EXPECT(level < 0.001, label);
    const double top = db(std::max(peak(out.left), peak(out.right)) /
                          std::max(peak(c.left), peak(c.right)));
    std::snprintf(label, sizeof label, "%s: peak, out against in", c.name);
    measured(label, top, "dB", "under 1 (phase moves, level does not)");
    EXPECT(top < 1.0, label);
  }
}

static void test_two_tones_do_not_hide_each_other() {
  std::printf("Two tones a third apart do not hide each other\n");
  Settings s;
  s.depth = 1.0f;
  s.sharpness = 1.0f;
  std::vector<float> left = pink(10.0f, kRate, 0.05, 81);
  for (double hz : {2000.0, 2520.0}) add_tone(&left, hz, tone_over_bed(0.05, 15.0, 1.0 / 12.0));
  set(s);
  const Stereo out = run(device, left);
  for (double hz : {2000.0, 2520.0}) {
    const double change = db(tone_level(out.left, hz, kRate, at(4.0), left.size()) /
                             tone_level(left, hz, kRate, at(4.0), left.size()));
    char label[160];
    std::snprintf(label, sizeof label, "two tones 15 dB out: the one at %.0f Hz", hz);
    measured(label, change, "dB", "under -10");
    EXPECT(change < -10.0, label);
  }
}

static void test_the_image_does_not_move() {
  std::printf("Both channels get the same cuts\n");
  Settings s;
  s.depth = 1.0f;
  s.sharpness = 1.0f;
  std::vector<float> left = pink(6.0f, kRate, 0.05, 91);
  add_tone(&left, 1130.0, tone_over_bed(0.05, 18.0, 1.0 / 12.0));
  std::vector<float> right(left.size());
  for (size_t i = 0; i < left.size(); ++i) right[i] = 0.25f * left[i];
  set(s);
  const Stereo out = run(device, left, right);
  double worst = 0.0;
  for (size_t i = 0; i < left.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(out.right[i]) - 0.25 * out.left[i]));
  }
  measured("right a quarter of left going in: largest gap from that coming out", worst * 1.0e6, "e-6",
           "under 1");
  EXPECT(worst < 1.0e-6, "the two channels are cut alike");
  EXPECT(db(tone_level(out.left, 1130.0, kRate, at(3.0), left.size()) /
            tone_level(left, 1130.0, kRate, at(3.0), left.size())) < -10.0,
         "and the tone is cut");
}

// What `x` holds from 8 kHz up against all of it, in dB.
static double share_above(const std::vector<float>& x, double /*hz*/, size_t from, size_t to) {
  return db(std::max(rms(band_pass(x, 8000.0, 20000.0, kRate), from, to), 1.0e-12) /
            rms(x, from, to));
}

static void test_no_clicks() {
  std::printf("Moving a control while it works does not click\n");
  // A bed with everything under 3 kHz (pink noise through a steep band
  // pass) and one tone that stands 18 dB out of it. A click would put
  // energy far above both.
  std::vector<float> in = band_pass(pink(6.0f, kRate, 0.05, 101), 40.0, 3000.0, kRate);
  add_tone(&in, 1050.0, tone_over_bed(0.05, 18.0, 1.0 / 12.0));
  Settings s;
  s.depth = 1.0f;
  s.sharpness = 0.7f;
  set(s);
  std::vector<float> reduction;
  const Stereo still = run_metered(in, in, &reduction);
  measured("the still reference: deepest cut", lowest(reduction), "dB", "under -6 (it is working)");
  EXPECT(lowest(reduction) < -6.0, "the reference signal is being cut");
  const double quiet = share_above(still.left, 8000.0, at(2.0), in.size());
  measured("the still reference: energy above 8 kHz", quiet, "dB", "");

  struct Move {
    const char* name;
    int id;
    float a, b;
  };
  const Move moves[] = {
      {"Depth between 0 and 1", p::kDepth, 0.0f, 1.0f},
      {"Sharpness between 0 and 1", p::kSharpness, 0.0f, 1.0f},
      {"Time between 10 ms and 1 s", p::kTime, 10.0f, 1000.0f},
      {"From between 80 Hz and 2 kHz", p::kFrom, 80.0f, 2000.0f},
      {"To between 1 kHz and 20 kHz", p::kTo, 1000.0f, 20000.0f},
      {"Listen on and off", p::kListen, 0.0f, 1.0f},
  };
  char label[160];
  for (const Move& move : moves) {
    set(s);
    Stereo out;
    out.left.resize(in.size());
    size_t done = 0;
    int block = 0;
    while (done < in.size()) {
      const int frames = static_cast<int>(std::min(static_cast<size_t>(kBlock), in.size() - done));
      // Every 70 ms from the second second on, to the other end.
      if (done >= at(2.0) && block % 26 == 0) {
        device.set_param(move.id, (block / 26) % 2 == 0 ? move.a : move.b);
      }
      for (int i = 0; i < frames; ++i) {
        device.in_left()[i] = in[done + i];
        device.in_right()[i] = in[done + i];
      }
      device.process(frames);
      for (int i = 0; i < frames; ++i) out.left[done + i] = device.out_left()[i];
      done += frames;
      ++block;
    }
    const double moved = share_above(out.left, 8000.0, at(2.0), in.size());
    std::snprintf(label, sizeof label, "%s every 70 ms: energy above 8 kHz", move.name);
    measured(label, moved, "dB", "under -60 of the whole");
    EXPECT(moved < -60.0, label);
  }
}

static void test_cost() {
  // A busy signal: 38 tones, five to the octave from 95 Hz, each coming and
  // going at its own rate over a quiet bed, with Time long enough that a cut
  // is still held when its tone is back. Counted in a debug build, this
  // keeps about 22 filters at work at once (25 at most) with 35 of the 48
  // cuts held; of the signals tried, the most at work at once was 28.
  const float seconds = 12.0f;
  const size_t total = at(seconds);
  std::vector<float> busy = white_noise(seconds, kRate, 0.01f, 5);
  for (int n = 0;; ++n) {
    const double hz = 95.0 * std::pow(2.0, n / 5.0);
    if (hz > 18000.0) break;
    const double wobble = 0.3 + 0.37 * (n % 7);
    for (size_t i = 0; i < total; ++i) {
      const double t = static_cast<double>(i) / kRate;
      const double level = 1.0 - 0.9 * (0.5 + 0.5 * std::sin(2.0 * kPi * wobble * t + n));
      busy[i] += static_cast<float>(0.002 * level * std::sin(2.0 * kPi * hz * t + 1.7 * n));
    }
  }
  Settings s;
  s.depth = 1.0f;
  s.sharpness = 1.0f;
  s.time = 300.0f;
  s.from = 80.0f;
  s.to = 20000.0f;
  set(s);
  run(device, busy, busy);
  int cut = 0;
  for (double shown : shown_cuts()) cut += shown < 0.0 ? 1 : 0;
  measured("a busy signal: display points (of 48) showing a cut at the end", cut, "", "20 or more");
  EXPECT(cut >= 20, "the busy signal keeps cuts at work all over");
  set(s);
  report_cost("tamer, a busy signal (about 22 cuts at work)", seconds, kRate,
              [&] { run(device, busy, busy); });
  set(Settings{});
  const std::vector<float> plain_left = pink(seconds, kRate, 0.1, 113);
  const std::vector<float> plain_right = pink(seconds, kRate, 0.1, 114);
  report_cost("tamer, a plain bed at the defaults", seconds, kRate,
              [&] { run(device, plain_left, plain_right); });
}

int main() {
  Conformance spec;
  spec.name = "tamer";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 1.0f;
  spec.max_peak = 2.5f;
  check_effect(device, spec, kRate);

  test_plain_signal_is_left_alone();
  test_a_tone_that_stands_out_is_pulled_down();
  test_the_sound_itself_is_not_a_peak();
  test_clean_notes_are_not_a_bed();
  test_depth_zero_is_a_wire();
  test_sharpness();
  test_time();
  test_range();
  test_listen();
  test_it_never_adds_level();
  test_two_tones_do_not_hide_each_other();
  test_the_image_does_not_move();
  test_no_clicks();
  test_cost();

  return finish("tamer");
}
