// Native harness for Prism (cpp/devices/prism). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it a spectral delay: each band comes back at
// the time the curve gives it, and nothing but time is changed.

#include "../devices/prism/prism.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::Prism;
namespace p = livemix::prism;

static Prism device;

static const float kRate = 48000.0f;
static const int kLatency = Prism::kLatency;

// --- the curve, written out again from the header's comment ---------------------------------

enum Shape { kRising, kFalling, kPeak, kValley, kScatter };

struct Curve {
  double time_ms = 600.0;
  double fan = 1.0;
  int shape = kRising;
  double bend = 0.0;
  int bands = 12;
  double smear = 0.0;
};

// The order of arrival of a frequency, 0 to 1 (not Scatter).
static double order_of(double hz, const Curve& curve) {
  double u = std::log2(hz / 60.0) / 7.0;
  u = std::min(1.0, std::max(0.0, u));
  const double steps = curve.bands - 1;
  const double step = std::floor(u * steps + 0.5) / steps;
  const double at = step + curve.smear * (u - step);
  double base = at;
  if (curve.shape == kFalling) base = 1.0 - at;
  if (curve.shape == kPeak) base = 1.0 - std::fabs(2.0 * at - 1.0);
  if (curve.shape == kValley) base = std::fabs(2.0 * at - 1.0);
  return std::pow(base, std::pow(4.0, -curve.bend));
}

// The delay of a frequency in milliseconds.
static double delay_ms(double hz, const Curve& curve) {
  const double delay = curve.time_ms * (1.0 - curve.fan * 0.875 * (1.0 - order_of(hz, curve)));
  return std::max(6.0, delay);
}

static void set_curve(Prism& d, const Curve& curve) {
  d.set_param(p::kTime, static_cast<float>(curve.time_ms));
  d.set_param(p::kFan, static_cast<float>(curve.fan));
  d.set_param(p::kShape, static_cast<float>(curve.shape));
  d.set_param(p::kBend, static_cast<float>(curve.bend));
  d.set_param(p::kBands, static_cast<float>(curve.bands));
  d.set_param(p::kSmear, static_cast<float>(curve.smear));
}

// The wet path alone, with nothing but the delays: no repeats, no panning, no drift.
static void plain(Prism& d) {
  d.init(kRate);
  d.set_param(p::kFeedback, 0.0f);
  d.set_param(p::kTilt, 0.0f);
  d.set_param(p::kWidth, 0.0f);
  d.set_param(p::kSmear, 0.0f);
  d.set_param(p::kDrift, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

// --- signals and measurements ---------------------------------------------------------------

// A tone under a Hann envelope `length` samples long, starting at `at`.
static std::vector<float> burst(double hz, size_t at, size_t length, size_t total, float gain = 0.5f) {
  std::vector<float> out(total, 0.0f);
  for (size_t i = 0; i < length && at + i < total; ++i) {
    const double window = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(length));
    out[at + i] = gain * static_cast<float>(window * std::sin(2.0 * kPi * hz * static_cast<double>(i) / kRate));
  }
  return out;
}

// Where the energy of x lies in [from, to): its centre, in samples.
static double centre(const std::vector<float>& x, size_t from, size_t to) {
  to = std::min(to, x.size());
  double sum = 0.0, weighted = 0.0;
  for (size_t i = from; i < to; ++i) {
    const double e = static_cast<double>(x[i]) * x[i];
    sum += e;
    weighted += e * static_cast<double>(i);
  }
  return sum > 0.0 ? weighted / sum : -1.0;
}

// The power of x at one frequency over the whole of it, no window: for a
// sound that is all inside x, a delay changes the phase of this and not the
// size.
static double power_at(const std::vector<float>& x, double hz) {
  double re = 0.0, im = 0.0;
  const double step = 2.0 * kPi * hz / kRate;
  for (size_t i = 0; i < x.size(); ++i) {
    re += x[i] * std::cos(step * static_cast<double>(i));
    im -= x[i] * std::sin(step * static_cast<double>(i));
  }
  return re * re + im * im;
}

static double worst_difference(const Stereo& a, const Stereo& b) {
  double worst = 0.0;
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a.left[i]) - b.left[i]));
    worst = std::max(worst, std::fabs(static_cast<double>(a.right[i]) - b.right[i]));
  }
  return worst;
}

// The delay a tone burst at `hz` comes back with, in milliseconds: from the
// centre of the burst to the centre of what comes out, less the latency.
static double measured_delay_ms(Prism& d, double hz, double seconds = 2.0) {
  const size_t length = 4800;  // 100 ms: about 10 Hz wide
  const size_t total = static_cast<size_t>(seconds * kRate);
  const std::vector<float> in = burst(hz, 2400, length, total);
  const Stereo out = run(d, in);
  const double came = centre(out.left, 0, total);
  return (came - centre(in, 0, total) - kLatency) * 1000.0 / kRate;
}

int main() {
  Conformance spec;
  spec.name = "prism";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  // The repeats at the default die in about 6 s; the history then takes 8.2 s to empty before the device sleeps.
  spec.tail_seconds = 24.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // Latency and the dry path: at Mix 0 the output is the input, a latency late, bit for bit.
  {
    rng_state() = 77;
    const std::vector<float> in = noise(1.0f, kRate, 0.5f);
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    const Stereo out = run(device, in);
    bool same = true;
    for (size_t i = 0; i + kLatency < in.size(); ++i) same = same && out.left[i + kLatency] == in[i];
    EXPECT(same, "Mix 0 is the input, 2304 samples late, bit for bit");
    EXPECT(out.left == out.right, "Mix 0: mono in, mono out");
  }

  // Fan 0 is a plain delay, the same for every band: noise comes back as itself, Time later. 100 ms is 9.375
  // hops, so this holds the shift under a hop to its sign and size as well.
  {
    plain(device);
    Curve curve;
    curve.time_ms = 100.0;
    curve.fan = 0.0;
    set_curve(device, curve);
    rng_state() = 31;
    std::vector<float> in = noise(1.0f, kRate, 0.25f);
    in.resize(static_cast<size_t>(1.5f * kRate), 0.0f);
    const Stereo out = run(device, in);
    const size_t late = kLatency + 4800;
    double error = 0.0, size = 0.0;
    for (size_t i = 0; i + late < in.size(); ++i) {
      const double d = static_cast<double>(out.left[i + late]) - in[i];
      error += d * d;
      size += static_cast<double>(in[i]) * in[i];
    }
    const double error_db = 10.0 * std::log10(error / size);
    std::printf("fan 0, time 100 ms: noise against itself 4800 samples later: error %.1f dB\n", error_db);
    EXPECT(error_db < -25.0, "Fan 0: a plain delay of Time across the whole band");
    EXPECT(out.left == out.right, "Width 0: mono in, mono out, bit for bit");
    for (double hz : {110.0, 440.0, 1760.0, 7040.0}) {
      plain(device);
      set_curve(device, curve);
      EXPECT_NEAR(measured_delay_ms(device, hz, 1.0), 100.0, 0.5, "Fan 0: every band comes back at Time");
    }
  }

  // Tone bursts at five frequencies come back at the delays the curve says, for each Shape and a Bend.
  {
    // The middles of bands 3, 5, 7, 9 and 10 of twelve. (Under 200 Hz a band of twelve is narrower than the two
    // or three bins a tone covers, so a tone there comes back shared between its neighbours' times.)
    const double tones[5] = {225.5, 545.0, 1317.0, 3182.0, 4947.0};
    const char* names[4] = {"Rising", "Falling", "Peak", "Valley"};
    double worst = 0.0;
    for (int shape = 0; shape < 4; ++shape) {
      for (double bend : {0.0, 0.6, -0.6}) {
        Curve curve;
        curve.time_ms = 800.0;
        curve.shape = shape;
        curve.bend = bend;
        curve.bands = 12;
        std::printf("%-8s bend %+.1f:", names[shape], bend);
        for (double hz : tones) {
          plain(device);
          set_curve(device, curve);
          const double got = measured_delay_ms(device, hz);
          const double want = delay_ms(hz, curve);
          std::printf("  %4.0f Hz %6.1f (%6.1f)", hz, got, want);
          worst = std::max(worst, std::fabs(got - want));
        }
        std::printf(" ms\n");
      }
    }
    std::printf("tone bursts against the curve: worst %.2f ms\n", worst);
    EXPECT(worst < 1.0, "tone bursts at five frequencies come back at the curve's delays, every Shape");

    // The ends of the curve: Rising at Time 800, the first colour at an eighth of it and the last at Time.
    Curve curve;
    curve.time_ms = 800.0;
    plain(device);
    set_curve(device, curve);
    EXPECT_NEAR(measured_delay_ms(device, 62.0), 100.0, 3.0, "Fan open: the first colour comes at an eighth of Time");
    plain(device);
    set_curve(device, curve);
    EXPECT_NEAR(measured_delay_ms(device, 9000.0), 800.0, 2.0, "the last colour comes at Time");
    curve.fan = 0.5;
    plain(device);
    set_curve(device, curve);
    EXPECT_NEAR(measured_delay_ms(device, 62.0), 450.0, 3.0, "Fan half open: the first colour at 9/16 of Time");
  }

  // A held tone comes back whole wherever it lies: a partial moves as one, so where two bands meet nothing
  // cancels. Every note of the piano and the quarter tones between, wet only, at the default curve and at a long
  // Scatter with Smear full open.
  {
    double worst = 0.0, highest = 0.0;
    for (int which = 0; which < 2; ++which) {
      for (double note = 21.0; note <= 108.0; note += 0.5) {
        const double hz = 440.0 * std::pow(2.0, (note - 69.0) / 12.0);
        plain(device);
        device.set_param(p::kSmear, which == 0 ? 0.25f : 1.0f);
        if (which == 1) {
          device.set_param(p::kTime, 2000.0f);
          device.set_param(p::kShape, static_cast<float>(kScatter));
        }
        const Stereo out = run(device, sine(hz, 3.2f, kRate, 0.5f));
        const double level = db(tone_level(out.left, hz, kRate, 2.7 * kRate, 3.2 * kRate) / 0.5);
        worst = std::min(worst, level);
        highest = std::max(highest, level);
      }
    }
    std::printf("held tones, A0 to C8 by quarter tones, wet only: %.2f to %+.2f dB\n", worst, highest);
    EXPECT(worst > -0.5 && highest < 0.5, "a held tone comes back at its own level at every pitch");
  }

  // The long-term spectrum is unchanged: it only moves energy in time. A second of noise, all of it inside the
  // render: the whole energy, and the energy in each octave, in and out.
  {
    rng_state() = 5;
    std::vector<float> in = noise(1.0f, kRate, 0.25f);
    in.resize(static_cast<size_t>(4.0f * kRate), 0.0f);
    double worst_octave = 0.0, worst_whole = 0.0;
    for (int shape : {kRising, kPeak, kScatter}) {
      Curve curve;
      curve.time_ms = 1200.0;
      curve.shape = shape;
      plain(device);
      set_curve(device, curve);
      const Stereo out = run(device, in);
      worst_whole = std::max(worst_whole, std::fabs(db(rms(out.left) / rms(in))));
      for (double low = 62.5; low < 16000.0; low *= 2.0) {
        double before = 0.0, after = 0.0;
        for (int i = 0; i < 40; ++i) {
          const double hz = low * std::pow(2.0, (i + 0.37) / 40.0);
          before += power_at(in, hz);
          after += power_at(out.left, hz);
        }
        worst_octave = std::max(worst_octave, std::fabs(10.0 * std::log10(after / before)));
      }
    }
    std::printf("noise in and out: whole energy within %.2f dB, each octave within %.2f dB\n", worst_whole, worst_octave);
    EXPECT(worst_whole < 0.2, "the wet path keeps the energy of what went in");
    EXPECT(worst_octave < 2.5, "and its spectrum, octave by octave");
  }

  // Feedback repeats each colour at its own time: a burst in a band comes back at its delay, then again every
  // delay (in whole hops), each time Feedback smaller. Two bands, two times.
  {
    Curve curve;
    curve.time_ms = 480.0;
    for (double hz : {545.0, 3182.0}) {
      plain(device);
      set_curve(device, curve);
      device.set_param(p::kFeedback, 0.6f);
      const size_t total = static_cast<size_t>(3.0 * kRate);
      const std::vector<float> in = burst(hz, 2400, 4800, total);
      const Stereo out = run(device, in);
      const double delay = delay_ms(hz, curve) * 0.001 * kRate;
      const double loop = std::floor(delay / 512.0 + 0.5) * 512.0;
      const double start = centre(in, 0, total) + kLatency;
      double last_level = 0.0;
      for (int pass = 0; pass < 4; ++pass) {
        const double due = start + delay + pass * loop;
        const size_t from = static_cast<size_t>(due - 0.45 * loop), to = static_cast<size_t>(due + 0.45 * loop);
        const double came = centre(out.left, from, to);
        const double level = rms(out.left, from, to);
        EXPECT_NEAR(came, due, 48.0, "each repeat of a band comes one more of its own delay later");
        if (pass > 0) EXPECT_NEAR(level / last_level, 0.6, 0.03, "each repeat is Feedback times the one before");
        last_level = level;
      }
      std::printf("feedback: %4.0f Hz repeats every %.1f ms\n", hz, loop * 1000.0 / kRate);
    }
  }

  // Tilt: what each pass loses. Two tones, one echo time for both (Fan 0): the second repeat against the first.
  {
    const size_t total = static_cast<size_t>(2.0 * kRate);
    std::vector<float> in = burst(200.0, 2400, 4800, total, 0.3f);
    const std::vector<float> high = burst(4000.0, 2400, 4800, total, 0.3f);
    for (size_t i = 0; i < total; ++i) in[i] += high[i];
    const size_t first = 2400 + kLatency + 14336, second = first + 14336;  // Time 300 ms is 28 hops
    auto pass_db = [&](float tilt, double hz) {
      plain(device);
      Curve curve;
      curve.time_ms = 300.0;
      curve.fan = 0.0;
      set_curve(device, curve);
      device.set_param(p::kFeedback, 0.8f);
      device.set_param(p::kTilt, tilt);
      const Stereo out = run(device, in);
      return db(tone_level(out.left, hz, kRate, second, second + 4800) / tone_level(out.left, hz, kRate, first, first + 4800));
    };
    EXPECT_NEAR(pass_db(0.0f, 200.0), -1.94, 0.2, "Tilt 0: a pass costs the lows Feedback and nothing more");
    EXPECT_NEAR(pass_db(0.0f, 4000.0), -1.94, 0.2, "Tilt 0: a pass costs the highs Feedback and nothing more");
    // Darker: 6 dB an octave over 250 Hz at -1, so 24 dB at 4 kHz; the lows keep their level.
    EXPECT_NEAR(pass_db(-1.0f, 4000.0), -1.94 - 24.0, 0.5, "Tilt -1: a pass takes 24 dB off 4 kHz");
    EXPECT_NEAR(pass_db(-1.0f, 200.0), -1.94, 0.2, "Tilt -1: and leaves 200 Hz alone");
    EXPECT_NEAR(pass_db(-0.5f, 4000.0), -1.94 - 12.0, 0.5, "Tilt -0.5: half as much");
    // Thinner: 6 dB an octave under 4 kHz at +1, so 25.9 dB at 200 Hz.
    EXPECT_NEAR(pass_db(1.0f, 200.0), -1.94 - 25.93, 0.5, "Tilt +1: a pass takes 26 dB off 200 Hz");
    EXPECT_NEAR(pass_db(1.0f, 4000.0), -1.94, 0.2, "Tilt +1: and leaves 4 kHz alone");
  }

  // Bands and Smear, read from the device's own table of delays (the bursts above hold that table to the sound).
  {
    auto distinct = [&](int low_bin, int high_bin) {
      std::vector<float> seen;
      for (int k = low_bin; k <= high_bin; ++k) seen.push_back(device.delay_samples(k));
      std::sort(seen.begin(), seen.end());
      return static_cast<int>(std::unique(seen.begin(), seen.end()) - seen.begin());
    };
    for (int bands : {2, 5, 12}) {
      plain(device);
      device.set_param(p::kBands, static_cast<float>(bands));
      run(device, silence(0.05f, kRate));
      EXPECT(distinct(1, Prism::kBins - 1) == bands, "Smear 0: as many arrival times as Bands");
    }
    // 48 bands over seven octaves are narrower than a bin at the bottom: from 400 Hz up every one is there.
    plain(device);
    device.set_param(p::kBands, 48.0f);
    run(device, silence(0.05f, kRate));
    const int all = distinct(1, Prism::kBins - 1);
    std::printf("48 bands: %d arrival times in the table\n", all);
    EXPECT(all >= 40 && all <= 48, "48 bands: nearly all of them hold a bin");
    // Smear 1: every bin from 60 Hz to 7680 Hz has a time of its own, later the higher it lies.
    plain(device);
    device.set_param(p::kSmear, 1.0f);
    run(device, silence(0.05f, kRate));
    bool rising = true;
    for (int k = 4; k <= 327; ++k) rising = rising && device.delay_samples(k) > device.delay_samples(k - 1);
    EXPECT(rising, "Smear 1: every bin has its own time, in order");
    // Half way the steps are half as high: the jump where two bands meet, against Smear 0.
    plain(device);
    run(device, silence(0.05f, kRate));
    const float step = device.delay_samples(112) - device.delay_samples(106);  // bands 8 and 9 meet at 2552 Hz, bin 108.9
    device.set_param(p::kSmear, 0.5f);
    run(device, silence(0.05f, kRate));
    const float jump = device.delay_samples(109) - device.delay_samples(108);
    EXPECT_NEAR(jump / step, 0.5, 0.04, "Smear 0.5: the step between two bands is half as high");
  }

  // Scatter: the bands get the evenly spaced times in a dealt order; a Shuffle number is one order for good,
  // and another number is another order.
  {
    auto table = [&](float shuffle) {
      plain(device);
      device.set_param(p::kTime, 880.0f);
      device.set_param(p::kShape, static_cast<float>(kScatter));
      device.set_param(p::kShuffle, shuffle);
      run(device, silence(0.05f, kRate));
      std::vector<float> delays;
      for (int b = 0; b < 12; ++b) {
        const double hz = 60.0 * std::pow(2.0, 7.0 * b / 11.0);
        delays.push_back(device.delay_samples(static_cast<int>(hz * 2048.0 / kRate + 0.5)));
      }
      return delays;
    };
    const std::vector<float> one = table(1.0f), again = table(1.0f), two = table(2.0f);
    EXPECT(one == again, "Scatter: the same Shuffle is the same order every time");
    EXPECT(one != two, "Scatter: another Shuffle is another order");
    std::vector<float> sorted = one;
    std::sort(sorted.begin(), sorted.end());
    bool even = true;
    for (int b = 0; b < 12; ++b) {
      // Time 880 ms: 110 ms for the first and 70 ms more for each after it.
      even = even && std::fabs(sorted[b] - (110.0f + 70.0f * b) * 48.0f) < 1.0f;
    }
    EXPECT(even, "Scatter: twelve bands take the twelve evenly spaced times");
    bool in_order = true;
    for (int b = 1; b < 12; ++b) in_order = in_order && one[b] > one[b - 1];
    EXPECT(!in_order, "Scatter: and not in order of pitch");
    int moved = 0;
    for (int b = 0; b < 12; ++b) moved += one[b] != two[b] ? 1 : 0;
    std::printf("scatter: shuffle 2 gives %d of 12 bands another time than shuffle 1\n", moved);
    // The sound follows the table: five bands' bursts, and the same render twice.
    double worst = 0.0;
    for (int b : {3, 5, 7, 9, 10}) {
      const double hz = 60.0 * std::pow(2.0, 7.0 * b / 11.0);
      plain(device);
      device.set_param(p::kTime, 880.0f);
      device.set_param(p::kShape, static_cast<float>(kScatter));
      worst = std::max(worst, std::fabs(measured_delay_ms(device, hz) - one[b] / 48.0));
    }
    EXPECT(worst < 1.0, "Scatter: tone bursts come back at the times dealt");
    rng_state() = 9;
    const std::vector<float> in = noise(0.5f, kRate, 0.3f);
    Stereo renders[3];
    for (int i = 0; i < 3; ++i) {
      device.init(kRate);
      device.set_param(p::kShape, static_cast<float>(kScatter));
      device.set_param(p::kShuffle, i < 2 ? 5.0f : 6.0f);
      renders[i] = run(device, in);
    }
    EXPECT(renders[0].left == renders[1].left && renders[0].right == renders[1].right,
           "Scatter: one Shuffle renders the same, bit for bit");
    EXPECT(worst_difference(renders[0], renders[2]) > 0.01, "Scatter: another Shuffle sounds different");
  }

  // PART 5

  return finish("prism");
}
