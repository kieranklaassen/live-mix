// Native harness for Prism (cpp/devices/prism). The conformance pass covers
// stability, silence when idle, block-size independence and parameter abuse;
// the rest asserts what makes it a spectral delay: each band comes back at
// the time the curve gives it, and nothing but time is changed.

#include "../devices/prism/prism.h"
#include "support/test_kit.h"

#include <limits>

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

// The frequency the curve is read at for a sound at `hz`: the middle of its strip of 100 Hz (four bins where
// they are wider), and 60 Hz for everything under two strips.
static double strip_width(double rate) { return std::max(100.0, 4.0 * rate / 2048.0); }
static double strip_hz(double hz, double rate) {
  const double width = strip_width(rate);
  return hz < 2.0 * width ? 60.0 : (std::floor(hz / width) + 0.5) * width;
}

// The order of arrival of a frequency, 0 to 1 (not Scatter).
static double order_of(double hz, const Curve& curve, double rate = 48000.0) {
  double u = std::log2(strip_hz(hz, rate) / 60.0) / 7.0;
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
static double delay_ms(double hz, const Curve& curve, double rate = 48000.0) {
  const double delay = curve.time_ms * (1.0 - curve.fan * 0.875 * (1.0 - order_of(hz, curve, rate)));
  return std::max(24.0, delay);
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
  // The repeats at the default die in about 6 s, and the device sleeps once the furthest throw has landed.
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
    // Everything under 200 Hz is one colour, so the bands that lie whole under it are one: of 12 the lowest
    // three (60, 93 and 145 Hz).
    const int counts[3][2] = {{2, 2}, {5, 5}, {12, 10}};
    for (const auto& count : counts) {
      plain(device);
      device.set_param(p::kBands, static_cast<float>(count[0]));
      run(device, silence(0.05f, kRate));
      const int got = distinct(1, Prism::kBins - 1);
      if (got != count[1]) std::printf("%d bands: %d arrival times in the table\n", count[0], got);
      EXPECT(got == count[1], "Smear 0: as many arrival times as Bands, less those that lie whole under 200 Hz");
    }
    plain(device);
    device.set_param(p::kBands, 48.0f);
    run(device, silence(0.05f, kRate));
    const int all = distinct(1, Prism::kBins - 1);
    std::printf("48 bands: %d arrival times in the table\n", all);
    // Above 920 Hz a band of forty eight is wider than a strip and has its own time; under it, the strips have.
    EXPECT(all >= 27 && all <= 31, "48 bands: all that are a strip wide or more are there");
    // More bands are never fewer arrival times: no stretch of the knob's turn does nothing or goes back.
    int before = 0, falls = 0, same = 0;
    for (int bands = 2; bands <= 48; ++bands) {
      plain(device);
      device.set_param(p::kBands, static_cast<float>(bands));
      run(device, silence(0.05f, kRate));
      const int got = distinct(1, Prism::kBins - 1);
      if (got < before) ++falls;
      same = got == before ? same + 1 : 0;
      EXPECT(same < 4, "four steps of Bands in a row never leave the count of arrival times where it was");
      before = got;
    }
    std::printf("Bands 2 to 48: the count of arrival times falls %d times on the way up\n", falls);
    EXPECT(falls <= 2, "the count of arrival times rises with Bands");
    // The whole table against the curve written out above, at every bin, for three Smears and two Shapes: the
    // strips, the steps of Bands, what Smear leaves of them, and the floor of 24 ms.
    double worst = 0.0;
    for (float smear : {0.0f, 0.5f, 1.0f}) {
      for (int shape : {kRising, kValley}) {
        for (float time : {600.0f, 40.0f}) {
          Curve curve;
          curve.time_ms = time;
          curve.shape = shape;
          curve.smear = smear;
          curve.bands = shape == kRising ? 12 : 31;
          plain(device);
          set_curve(device, curve);
          run(device, silence(0.05f, kRate));
          for (int k = 1; k < Prism::kBins; ++k) {
            const double want = delay_ms(k * kRate / 2048.0, curve) * 0.001 * kRate;
            worst = std::max(worst, std::fabs(device.delay_samples(k) - want));
          }
        }
      }
    }
    std::printf("the table against the curve, every bin: worst %.3f samples\n", worst);
    EXPECT(worst < 0.5, "every bin's delay is the curve's at the middle of its strip");
    // Strips: with Smear full open every strip has a time of its own, later the higher it lies, and the bins
    // of one strip share it; nothing under 200 Hz is apart from anything else there.
    plain(device);
    device.set_param(p::kSmear, 1.0f);
    run(device, silence(0.05f, kRate));
    bool rising = true, shared = true;
    for (int k = 2; k <= 327; ++k) {
      const bool same_strip = std::floor(k * kRate / 204800.0) == std::floor((k - 1) * kRate / 204800.0) || k * kRate / 2048.0 < 200.0;
      if (same_strip) shared = shared && device.delay_samples(k) == device.delay_samples(k - 1);
      else rising = rising && device.delay_samples(k) > device.delay_samples(k - 1);
    }
    EXPECT(rising, "Smear 1: every strip has its own time, in order");
    EXPECT(shared, "Smear 1: the bins of a strip share one time, and everything under 200 Hz does");
    // No band comes sooner than 24 ms, whatever Time and Fan say.
    plain(device);
    device.set_param(p::kTime, 30.0f);
    run(device, silence(0.05f, kRate));
    float least = 1.0e9f, most = 0.0f;
    for (int k = 0; k < Prism::kBins; ++k) {
      least = std::min(least, device.delay_samples(k));
      most = std::max(most, device.delay_samples(k));
    }
    EXPECT_NEAR(least, 0.024 * kRate, 0.5, "the least delay is 24 ms, half a frame and a little");
    EXPECT_NEAR(most, 0.030 * kRate, 0.5, "Time at its least is 30 ms");
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
      // The ten bands a sound can lie in: the lowest, and the fourth (225 Hz) up. The two between lie under 200 Hz.
      std::vector<float> delays;
      for (int b : {0, 3, 4, 5, 6, 7, 8, 9, 10, 11}) {
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
    bool even = true, apart = true;
    for (size_t b = 0; b < sorted.size(); ++b) {
      // Time 880 ms: 110 ms for the first of twelve and 70 ms more for each after it.
      const float steps = (sorted[b] / 48.0f - 110.0f) / 70.0f;
      even = even && std::fabs(steps - std::floor(steps + 0.5f)) < 0.001f && steps > -0.5f && steps < 11.5f;
      if (b > 0) apart = apart && sorted[b] > sorted[b - 1] + 1.0f;
    }
    EXPECT(even, "Scatter: each band takes one of the twelve evenly spaced times");
    EXPECT(apart, "Scatter: and no two bands the same");
    bool in_order = true;
    for (size_t b = 1; b < one.size(); ++b) in_order = in_order && one[b] > one[b - 1];
    EXPECT(!in_order, "Scatter: and not in order of pitch");
    int moved = 0;
    for (size_t b = 0; b < one.size(); ++b) moved += one[b] != two[b] ? 1 : 0;
    std::printf("scatter: shuffle 2 gives %d of 10 bands another time than shuffle 1\n", moved);
    EXPECT(moved >= 6, "Scatter: another Shuffle moves most of the bands");
    // The sound follows the table: five bands' bursts, and the same render twice.
    double worst = 0.0;
    const int heard[5] = {3, 5, 7, 9, 10};
    const size_t slot[5] = {1, 3, 5, 7, 8};
    for (int i = 0; i < 5; ++i) {
      const double hz = 60.0 * std::pow(2.0, 7.0 * heard[i] / 11.0);
      plain(device);
      device.set_param(p::kTime, 880.0f);
      device.set_param(p::kShape, static_cast<float>(kScatter));
      worst = std::max(worst, std::fabs(measured_delay_ms(device, hz) - one[slot[i]] / 48.0));
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

  // Width lays the colours across the field in the order they come: Rising, the low band leans left and the
  // high band right. The side a band leans to keeps its own whole and is given what the other side loses, a
  // quarter turn on; under 120 Hz nothing moves; the power of the two sides together is what went in.
  {
    auto sides = [&](double hz, float width, int feed, double* left, double* right) {
      plain(device);
      device.set_param(p::kWidth, width);
      const size_t total = static_cast<size_t>(1.5 * kRate);
      const std::vector<float> in = burst(hz, 2400, 4800, total);
      const std::vector<float> none(total, 0.0f);
      std::vector<float> flipped = in;
      for (float& v : flipped) v = -v;
      // feed 0: both sides alike; 1: the left alone; 2: the right alone; 3: the right the left upside down.
      const Stereo out = run(device, feed == 2 ? none : in, feed == 1 ? none : (feed == 3 ? flipped : in));
      *left = rms(out.left);
      *right = rms(out.right);
    };
    // What the side a band leans away from keeps of its own sound.
    auto keeps = [](double order, double hz, double width) {
      const double depth = std::min(1.0, std::max(0.0, std::log2(hz / 120.0) / std::log2(300.0 / 120.0)));
      const double position = width * (2.0 * order - 1.0) * depth;
      const double angle = (std::fabs(position) + 1.0) * kPi / 4.0;
      return std::cos(angle) / std::sin(angle);
    };
    double centre_l, centre_r, l, r;
    sides(4947.0, 0.0f, 0, &centre_l, &centre_r);
    sides(4947.0, 1.0f, 0, &l, &r);
    double keep = keeps(10.0 / 11.0, 4947.0, 1.0);
    std::printf("width 1, 4947 Hz, both sides alike: left %.3f right %.3f of the centred level (%.3f, %.3f)\n", l / centre_l,
                r / centre_r, keep, std::sqrt(2.0 - keep * keep));
    EXPECT_NEAR(l / centre_l, keep, 0.01, "Width 1: the last colour is taken from the left");
    EXPECT_NEAR(r / centre_r, std::sqrt(2.0 - keep * keep), 0.01, "Width 1: and given to the right");
    EXPECT_NEAR(db(std::sqrt((l * l + r * r) / (2.0 * centre_l * centre_l))), 0.0, 0.05, "Width 1: the two sides together are as loud as before");
    sides(4947.0, 0.5f, 0, &l, &r);
    keep = keeps(10.0 / 11.0, 4947.0, 0.5);
    EXPECT_NEAR(l / centre_l, keep, 0.01, "Width 0.5: half as far");
    sides(545.0, 0.0f, 0, &centre_l, &centre_r);
    sides(545.0, 1.0f, 0, &l, &r);
    keep = keeps(5.0 / 11.0, 545.0, 1.0);
    EXPECT_NEAR(r / centre_r, keep, 0.01, "Width 1: an early colour leans left");
    EXPECT_NEAR(l / centre_l, std::sqrt(2.0 - keep * keep), 0.01, "Width 1: and the left is given what the right loses");
    sides(93.3, 0.0f, 0, &centre_l, &centre_r);
    sides(93.3, 1.0f, 0, &l, &r);
    EXPECT(std::fabs(l / centre_l - 1.0) < 0.001 && std::fabs(r / centre_r - 1.0) < 0.001,
           "Width 1: under 120 Hz nothing moves");

    // A sound on one side only is moved, not lost. The last colour, at Width 1 and at the default, fed to the
    // left alone (the side it leans away from): what is taken from the left arrives on the right.
    sides(4947.0, 0.0f, 0, &centre_l, &centre_r);
    for (float width : {1.0f, p::kParamDefault[p::kWidth]}) {
      keep = keeps(10.0 / 11.0, 4947.0, width);
      sides(4947.0, width, 1, &l, &r);
      std::printf("width %.1f, 4947 Hz on the left alone: left %+.1f dB, right %+.1f dB, both %+.2f dB of the sound\n", width,
                  db(l / centre_l), db(r / centre_l), db(std::sqrt(l * l + r * r) / centre_l));
      EXPECT_NEAR(l / centre_l, keep, 0.01, "a sound on the left alone: the left keeps its share");
      EXPECT_NEAR(r / centre_l, std::sqrt(1.0 - keep * keep), 0.01, "a sound on the left alone: the rest of it is on the right");
      EXPECT_NEAR(db(std::sqrt(l * l + r * r) / centre_l), 0.0, 0.05, "a sound on one side only is moved, not lost");
      // On the side it leans to it simply stays.
      sides(4947.0, width, 2, &l, &r);
      EXPECT_NEAR(r / centre_r, 1.0, 0.001, "a sound on the side its colour leans to stays there whole");
      EXPECT(l < 1.0e-6, "and nothing of it crosses");
      // The right the left upside down: each side as loud as with both sides alike.
      double in_l, in_r;
      sides(4947.0, width, 0, &in_l, &in_r);
      sides(4947.0, width, 3, &l, &r);
      EXPECT_NEAR(db(l / in_l), 0.0, 0.01, "an anti-phase input does not vanish (left)");
      EXPECT_NEAR(db(r / in_r), 0.0, 0.01, "an anti-phase input does not vanish (right)");
    }

    // Summed to mono, a colour panned hard is 3 dB down, not 6: the last colour at Width 1, both sides alike.
    {
      const size_t total = static_cast<size_t>(1.5 * kRate);
      const std::vector<float> in = burst(4947.0, 2400, 4800, total);
      double level[2];
      for (int wide = 0; wide < 2; ++wide) {
        plain(device);
        device.set_param(p::kWidth, wide ? 1.0f : 0.0f);
        const Stereo out = run(device, in);
        std::vector<float> mono(total);
        for (size_t i = 0; i < total; ++i) mono[i] = 0.5f * (out.left[i] + out.right[i]);
        level[wide] = rms(mono);
      }
      keep = keeps(10.0 / 11.0, 4947.0, 1.0);
      std::printf("width 1, 4947 Hz, the two sides summed: %+.2f dB of the centred sound\n", db(level[1] / level[0]));
      EXPECT_NEAR(db(level[1] / level[0]), 10.0 * std::log10((1.0 + keep) / 2.0), 0.1, "in mono a colour panned hard keeps half its power");
    }
  }

  // Level. A full-scale held chord for a minute comes back at no more than twice its amplitude and never grows,
  // at Feedback 1 with nothing to stop the repeats adding up in step (Drift 0, Tilt 0), at short and long Times,
  // and at each extreme of every control.
  {
    const float seconds = 60.0f;
    std::vector<float> chord(static_cast<size_t>(seconds * kRate));
    for (size_t i = 0; i < chord.size(); ++i) {
      const double t = static_cast<double>(i) / kRate;
      chord[i] = 0.25f * static_cast<float>(std::sin(2.0 * kPi * 110.0 * t) + std::sin(2.0 * kPi * 277.18 * t + 1.0) +
                                            std::sin(2.0 * kPi * 659.25 * t + 2.0) + std::sin(2.0 * kPi * 1975.5 * t + 3.0));
    }
    const double in_peak = peak(chord);
    double worst_peak = 0.0, worst_growth = 0.0;
    auto held = [&](const char* what) {
      const Stereo out = run(device, chord);
      const size_t second = static_cast<size_t>(kRate);
      // Growth is read from the level of two stretches of 25 s: with Drift on the peaks wander over 7 to 14 s
      // (1.3 to 1.7 times the input's over three minutes, at a level that stays within 1 dB), which is not growth.
      const double early = std::max(rms(out.left, 10 * second, 35 * second), rms(out.right, 10 * second, 35 * second));
      const double late = std::max(rms(out.left, 35 * second, 60 * second), rms(out.right, 35 * second, 60 * second));
      const double top = std::max(peak(out.left), peak(out.right));
      worst_peak = std::max(worst_peak, top / in_peak);
      worst_growth = std::max(worst_growth, late / early);
      if (!(finite(out.left) && finite(out.right)) || top > 2.1 * in_peak || late > 1.05 * early) {
        std::printf("FAIL: held chord, %s: peak %.2f times the input's, the level of seconds 35 to 60 is %.3f of seconds 10 to 35\n", what,
                    top / in_peak, late / early);
        ++failures();
      }
    };
    for (float time : {30.0f, 87.0f, 600.0f, 4000.0f}) {
      for (float mix : {1.0f, 0.5f}) {
        device.init(kRate);
        device.set_param(p::kFeedback, 1.0f);
        device.set_param(p::kTilt, 0.0f);
        device.set_param(p::kDrift, 0.0f);
        device.set_param(p::kFan, 0.0f);
        device.set_param(p::kTime, time);
        device.set_param(p::kMix, mix);
        held("Feedback 1, one echo time");
      }
    }
    for (int id = 0; id < p::kNumParams; ++id) {
      for (int end = 0; end < 2; ++end) {
        device.init(kRate);
        device.set_param(p::kFeedback, 1.0f);
        device.set_param(id, end == 0 ? p::kParamMin[id] : p::kParamMax[id]);
        char what[64];
        std::snprintf(what, sizeof what, "Feedback 1, param %d at its %s", id, end == 0 ? "minimum" : "maximum");
        held(what);
      }
    }
    std::printf("held full-scale chord, 60 s: peak at most %.2f times the input's (%.1f dB), the level of the later 25 s at most %.3f of the earlier\n",
                worst_peak, db(worst_peak), worst_growth);
    EXPECT(worst_peak <= 2.1, "a held full-scale chord never comes back at more than twice its amplitude");

    // Feedback 1 circles on: the chord for 5 s, then silence; a minute later it is as loud as it was. (When the
    // level hold's memory fell by 60 dB in 40 s, this was 75 dB down.)
    device.init(kRate);
    device.set_param(p::kFeedback, 1.0f);
    device.set_param(p::kTilt, 0.0f);
    device.set_param(p::kMix, 1.0f);
    chord.resize(static_cast<size_t>(5.0f * kRate));
    run(device, chord);
    const Stereo first = render(device, 10.0f, kRate);
    render(device, 50.0f, kRate);
    const Stereo last = render(device, 10.0f, kRate);
    std::printf("Feedback 1: the ten seconds after the chord %.1f dB, a minute later %.1f dB\n", db(rms(first.left)),
                db(rms(last.left)));
    EXPECT(rms(first.left) > 0.05, "Feedback 1: the sound goes on circling after the input stops");
    EXPECT_NEAR(db(rms(last.left) / rms(first.left)), 0.0, 1.0, "Feedback 1 and Tilt 0: a minute later it circles as loud as before");
    EXPECT(peak(last.left) < 2.0 * peak(chord), "and no louder than the chord was");
  }

  // The level hold never shortens a tail: the top of Feedback is not dead. One echo time of 4 s, a tone for 2 s,
  // then silence: from 20 s to 60 s after it the repeats fall by what Feedback says for ten passes (9.2 dB at
  // 0.9 and 4.5 dB at 0.95), not by 60 dB as when the hold's memory fell.
  {
    for (float feedback : {0.9f, 0.95f}) {
      plain(device);
      device.set_param(p::kFan, 0.0f);
      device.set_param(p::kTime, 4000.0f);
      device.set_param(p::kFeedback, feedback);
      run(device, sine(440.0f, 2.0f, kRate, 0.5f));
      render(device, 16.0f, kRate);
      const Stereo early = render(device, 4.0f, kRate);  // 16 to 20 s after: the fifth pass
      render(device, 36.0f, kRate);
      const Stereo late = render(device, 4.0f, kRate);   // 56 to 60 s after: the fifteenth
      const double fell = db(rms(late.left) / rms(early.left));
      std::printf("Feedback %.2f, Time 4 s: ten passes later the repeat is %.1f dB down (%.1f by Feedback alone)\n", feedback, -fell,
                  -200.0 * std::log10(feedback));
      EXPECT_NEAR(fell, 200.0 * std::log10(feedback), 0.5, "a long tail falls by Feedback a pass and no faster");
    }
  }

  // A held note and its own repeats do not add up. Feedback 0.9, wet alone, one echo time: a tone whose
  // repeats land in step with it (a whole number of cycles in the 480 ms) is no louder for them, and one whose
  // repeats land against it is 1 / 1.9 of itself; and with all the bands at their own times no pitch of
  // twenty comes back louder than it went in. (Before: +4.8 dB at 1 kHz, growing to 1 / (1 - Feedback).)
  {
    auto wet_level = [&](double hz, float fan) {
      plain(device);
      device.set_param(p::kFan, fan);
      device.set_param(p::kTime, 480.0f);  // 45 hops: 23040 samples
      device.set_param(p::kFeedback, 0.9f);
      const Stereo out = run(device, sine(static_cast<float>(hz), 20.0f, kRate, 0.25f));
      return db(tone_level(out.left, hz, kRate, 16 * 48000, 20 * 48000) / 0.25);
    };
    const double in_step = wet_level(1000.0, 0.0f);            // 480 cycles in 23040 samples
    const double against = wet_level(1000.0 + 25.0 / 24.0, 0.0f);  // 480 and a half
    std::printf("Feedback 0.9, a held tone: repeats in step %+.2f dB, repeats against it %+.2f dB of the tone\n", in_step, against);
    EXPECT_NEAR(in_step, 0.0, 0.3, "repeats in step with a held note do not make it louder");
    EXPECT_NEAR(against, -5.58, 0.4, "repeats against a held note leave 1 / (1 + Feedback) of it");
    double loudest = -99.0;
    for (int n = 0; n < 20; ++n) loudest = std::max(loudest, wet_level(110.0 * std::pow(2.0, n * 0.27), 1.0f));
    std::printf("Feedback 0.9, twenty held tones at the default curve: the loudest comes back at %+.2f dB\n", loudest);
    EXPECT(loudest < 0.3, "no held note comes back louder than it went in, at any pitch");
  }

  // Playing over a circling sound does not pump it. Feedback 1, Time 1.5 s, wet alone: a 220 Hz note goes in
  // for 4 s; from 8 s on loud short notes are played at other pitches, or nothing is. The circling note's
  // level with the playing against without, from 8 to 28 s. (Before, the hold's memory fell unless something
  // was played, so the playing held the note up: 23 dB apart at 25 s.)
  {
    const size_t total = static_cast<size_t>(28.0 * kRate);
    std::vector<float> pad(total, 0.0f);
    for (size_t i = 0; i < 4 * 48000; ++i) {
      const double fade = std::min(1.0, std::min(i, 4 * 48000 - i) / 2400.0);
      pad[i] = 0.2f * static_cast<float>(fade * std::sin(2.0 * kPi * 220.0 * static_cast<double>(i) / kRate));
    }
    std::vector<float> played = pad;
    for (int n = 0; n < 40; ++n) {
      const std::vector<float> note = burst(n % 2 ? 1318.5 : 987.8, static_cast<size_t>((8.0 + 0.5 * n) * kRate), 9600, total, 0.5f);
      for (size_t i = 0; i < total; ++i) played[i] += note[i];
    }
    Stereo out[2];
    for (int v = 0; v < 2; ++v) {
      plain(device);
      device.set_param(p::kTime, 1500.0f);
      device.set_param(p::kFeedback, 1.0f);
      out[v] = run(device, v ? played : pad);
    }
    double apart = 0.0;
    for (size_t at = 8 * 48000; at + 8192 <= total; at += 4096) {
      const double alone = tone_level(out[0].left, 220.0, kRate, at, at + 8192);
      const double with = tone_level(out[1].left, 220.0, kRate, at, at + 8192);
      apart = std::max(apart, std::fabs(db(with / alone)));
    }
    // Unplayed, three turns of its loop (51 hops at 220 Hz) at 8 s against the last three before 28 s, as the
    // mean power of short stretches: what circles comes round every 544 ms, so over a longer stretch it is not
    // one tone. Against its own echo a held note stands at half its level at the least, so the circling one
    // may be 6 dB under it.
    const size_t turns = 3 * 51 * 512;
    auto circling = [&](size_t from) {
      double power = 0.0;
      int count = 0;
      for (size_t at = from; at + 8192 <= from + turns; at += 4096, ++count) {
        const double level = tone_level(out[0].left, 220.0, kRate, at, at + 8192);
        power += level * level;
      }
      return std::sqrt(power / count);
    };
    const double early = circling(8 * 48000);
    const double late = circling(total - turns);
    std::printf("Feedback 1, a circling note: played over, its level moves by %.2f dB at most; unplayed it is at %+.1f dB of the note at 8 s and %+.2f dB of that twenty seconds on\n", apart, db(early / 0.2), db(late / early));
    EXPECT(apart < 2.5, "playing over a circling sound moves its level by little");
    EXPECT(db(early / 0.2) > -8.0, "what circles is the note, at no less than its level against its own echo");
    EXPECT(db(late / early) > -1.0, "and with nothing played it circles on");
  }

  // Moving a control while a note sounds does not click: Time (the one most likely moved), Fan, Bands, and the
  // two choices, Shape and (in Scatter) Shuffle. The same render with nothing moved steps by 0.0037 a sample (dry
  // and echo partly cancel there); a move may change the level, so the bar is the steepest a clean 220 Hz tone
  // can be at twice the input's level, which is as loud as the device gets: 2π × 220 / 48000 × 0.5 = 0.0144. A
  // gain that jumped would step by up to 0.25.
  {
    const std::vector<float> tone = sine(220.0f, 1.0f, kRate, 0.25f);
    // The step from the last sample before the move to the first after it counts too: a gain that jumps
    // does so there, between two renders.
    auto steepest = [](const Stereo& before, const Stereo& after) {
      std::vector<float> left(1, before.left.back()), right(1, before.right.back());
      left.insert(left.end(), after.left.begin(), after.left.end());
      right.insert(right.end(), after.right.begin(), after.right.end());
      return std::max(max_step(left), max_step(right));
    };
    device.init(kRate);
    const Stereo led = run(device, tone);
    const Stereo still = run(device, tone);
    const double unmoved = steepest(led, still);
    const double reference = 2.0 * kPi * 220.0 / kRate * 0.5;
    struct Move {
      int id;
      float to;
      const char* what;
    };
    const Move moves[] = {{p::kTime, 150.0f, "Time"},   {p::kTime, 2400.0f, "Time"},   {p::kFan, 0.2f, "Fan"},
                          {p::kBands, 3.0f, "Bands"},   {p::kShape, 1.0f, "Shape"},    {p::kShape, 4.0f, "Shape"},
                          {p::kSmear, 1.0f, "Smear"},   {p::kWidth, 0.0f, "Width"},    {p::kFeedback, 0.95f, "Feedback"},
                          {p::kMix, 1.0f, "Mix"},       {p::kDrift, 0.0f, "Drift"}};
    double worst = 0.0;
    for (const Move& move : moves) {
      device.init(kRate);
      const Stereo before = run(device, tone);
      device.set_param(move.id, move.to);
      const Stereo out = run(device, tone);
      const double step = steepest(before, out);
      worst = std::max(worst, step / reference);
      if (step > reference) {
        std::printf("FAIL: moving %s to %g while sounding: step %.4f against %.4f\n", move.what, move.to, step, reference);
        ++failures();
      }
    }
    device.init(kRate);
    device.set_param(p::kShape, static_cast<float>(kScatter));
    const Stereo undealt = run(device, tone);
    device.set_param(p::kShuffle, 9.0f);
    const Stereo dealt = run(device, tone);
    worst = std::max(worst, steepest(undealt, dealt) / reference);
    // A sweep of Time, a move every block, as a hand would turn it.
    device.init(kRate);
    run(device, tone);
    Stereo swept;
    swept.left.reserve(tone.size());
    swept.right.reserve(tone.size());
    for (size_t done = 0; done + kBlock <= tone.size(); done += kBlock) {
      device.set_param(p::kTime, 600.0f * std::pow(4.0f, static_cast<float>(done) / tone.size()));
      for (int i = 0; i < kBlock; ++i) device.in_left()[i] = device.in_right()[i] = tone[done + i];
      device.process(kBlock);
      for (int i = 0; i < kBlock; ++i) {
        swept.left.push_back(device.out_left()[i]);
        swept.right.push_back(device.out_right()[i]);
      }
    }
    worst = std::max(worst, std::max(max_step(swept.left), max_step(swept.right)) / reference);
    std::printf("controls moved while a note sounds: the largest step is %.4f (unmoved %.4f, bar %.4f)\n",
                worst * reference, unmoved, reference);
    EXPECT(unmoved < reference, "the unmoved render is under the bar");
    EXPECT(worst < 1.0, "no control clicks when moved, the choices and a sweep of Time included");
  }

  // Bad input: a NaN, an infinity and 1e30 go in as silence. The output stays finite and is, sample for sample,
  // what the same input with zeros in their place gives: nothing of them is kept.
  {
    rng_state() = 77;
    const std::vector<float> good = noise(2.0f, kRate, 0.5f);
    std::vector<float> zeroed = good, bad = good;
    for (size_t i : {20000u, 20001u, 20002u}) zeroed[i] = 0.0f;
    bad[20000] = std::nanf("");
    bad[20001] = std::numeric_limits<float>::infinity();
    bad[20002] = -1.0e30f;
    device.init(kRate);
    device.set_param(p::kFeedback, 0.9f);
    const Stereo want = run(device, zeroed);
    device.init(kRate);
    device.set_param(p::kFeedback, 0.9f);
    const Stereo got = run(device, bad);
    EXPECT(finite(got.left) && finite(got.right), "NaN, infinity and 1e30 in: finite out");
    EXPECT(worst_difference(want, got) == 0.0, "and nothing of them stays in the loop");
    EXPECT(rms(got.left, 60000, 96000) > 0.1, "and the device goes on sounding after them");
  }

  // Block sizes across a silence. The silence is stepped across the moment the device falls asleep (the last
  // echo lands 0.2 s after the sound and the hold is 0.1 s), and Drift runs on by the frame clock all the while.
  {
    double worst = 0.0;
    for (float gap = 0.0f; gap < 0.6f; gap += 0.013f) {
      rng_state() = 99;
      std::vector<float> phrase = noise(0.2f, kRate, 0.5f);
      const std::vector<float> quiet = silence(0.25f + gap, kRate);
      const std::vector<float> again = noise(0.3f, kRate, 0.5f);
      phrase.insert(phrase.end(), quiet.begin(), quiet.end());
      phrase.insert(phrase.end(), again.begin(), again.end());
      Stereo reference;
      for (int block : {128, 1, 2048, 37}) {
        device.init(kRate);
        device.set_param(p::kTime, 200.0f);
        device.set_param(p::kFeedback, 0.0f);
        device.set_param(p::kDrift, 1.0f);
        const Stereo out = run(device, phrase, block);
        if (block == 128) {
          reference = out;
        } else {
          worst = std::max(worst, worst_difference(out, reference));
        }
      }
    }
    std::printf("block sizes across a silence: worst difference %.3g\n", worst);
    EXPECT(worst < 1.0e-6, "the same at block sizes 1, 37, 128 and 2048 across a sleep");
  }

  // The device sleeps and wakes, and knobs moved while it sleeps are simply there when it wakes: after a phrase
  // and its tail, a device whose knobs are moved in its sleep gives what one that had them from the start gives.
  {
    rng_state() = 41;
    const std::vector<float> phrase = noise(0.3f, kRate, 0.5f);
    const std::vector<float> rest = silence(9.7f, kRate);
    auto moved = [&](Prism& d) {
      d.set_param(p::kTime, 150.0f);
      d.set_param(p::kShape, static_cast<float>(kFalling));
      d.set_param(p::kMix, 0.9f);
      d.set_param(p::kWidth, 0.0f);
    };
    device.init(kRate);
    run(device, phrase);
    const Stereo tail = run(device, rest);
    const size_t n = tail.size();
    EXPECT(peak(tail.left, 0, 48000) > 0.001, "the repeats ring on after the phrase");
    EXPECT(peak(tail.left, n - 24000, n) == 0.0 && peak(tail.right, n - 24000, n) == 0.0, "asleep after the tail: exact zeros");
    EXPECT(device.meter(3) == 0.0f, "asleep the meters read 0");
    moved(device);
    const Stereo woken = run(device, phrase);
    static Prism fresh;
    fresh.init(kRate);
    moved(fresh);
    run(fresh, silence(0.3f + 9.7f, kRate));
    const Stereo first = run(fresh, phrase);
    EXPECT(rms(woken.left) > 0.05, "wakes on new input");
    EXPECT(worst_difference(woken, first) == 0.0, "knobs moved asleep snap: the same as a device that had them all along");
  }

  // The meters: the level coming in to each octave of the curve's axis, as the amplitude of a sine. A tone of 0.5
  // at 700 Hz reads 0.5 in the fourth and nothing in the others; a burst reads once, as it comes in, and not
  // again when its repeat comes round (the display draws the repeats from the curve, and would count them twice);
  // and reading them changes nothing.
  {
    plain(device);
    run(device, sine(700.0f, 0.5f, kRate, 0.5f));
    EXPECT_NEAR(device.meter(3), 0.5, 0.01, "a tone of 0.5 in 480 to 960 Hz reads 0.5 there");
    double others = 0.0;
    for (int z = 0; z < Prism::kZones; ++z) {
      if (z != 3) others = std::max(others, static_cast<double>(device.meter(z)));
    }
    EXPECT(others < 0.01, "and nothing in the other octaves");
    EXPECT(device.meter(-1) == 0.0f && device.meter(Prism::kZones) == 0.0f, "an unknown meter reads 0");

    plain(device);
    Curve curve;
    curve.time_ms = 320.0;  // 30 hops
    curve.fan = 0.0;
    set_curve(device, curve);
    device.set_param(p::kFeedback, 0.5f);
    const size_t total = static_cast<size_t>(1.0 * kRate);
    const std::vector<float> in = burst(700.0, 0, 4800, total, 0.5f);
    double first = 0.0, between = 1.0, second = 0.0;
    for (size_t done = 0; done + kBlock <= total; done += kBlock) {
      for (int i = 0; i < kBlock; ++i) device.in_left()[i] = device.in_right()[i] = in[done + i];
      device.process(kBlock);
      const double level = device.meter(3);
      const double at = static_cast<double>(done) / kRate;
      if (at < 0.2) first = std::max(first, level);
      if (at > 0.27 && at < 0.3) between = std::min(between, level);
      if (at > 0.32 && at < 0.52) second = std::max(second, level);
    }
    std::printf("meter: a burst reads %.3f, %.4f between, %.4f when its repeat comes round\n", first, between, second);
    EXPECT(first > 0.3 && first < 0.5, "the burst reads as it enters");
    EXPECT(between < 0.1 * first, "the reading falls away after it");
    // The reading only goes on falling: 20 dB every 120 ms, with nothing new when the repeat is heard.
    EXPECT(second < between, "and the repeat that comes round is not read as sound coming in");

    rng_state() = 12;
    const std::vector<float> phrase = noise(0.5f, kRate, 0.3f);
    device.init(kRate);
    const Stereo unread = run(device, phrase);
    device.init(kRate);
    Stereo read;
    for (size_t done = 0; done + kBlock <= phrase.size(); done += kBlock) {
      for (int i = 0; i < kBlock; ++i) device.in_left()[i] = device.in_right()[i] = phrase[done + i];
      device.process(kBlock);
      for (int z = 0; z < Prism::kZones; ++z) (void)device.meter(z);
      for (int i = 0; i < kBlock; ++i) {
        read.left.push_back(device.out_left()[i]);
        read.right.push_back(device.out_right()[i]);
      }
    }
    EXPECT(worst_difference(unread, read) == 0.0, "reading the meters changes nothing");
  }

  // Part-way Mix: a held note is not lost. Dry and an echo of a held tone are a comb, so at part-way Mix some
  // pitches are down for as long as the echo stands against them; how far is the echo's level against the
  // dry's. At the default (Mix 0.3, and no held note's echo louder than the note) single held notes over the
  // piano's range, read in windows of 43 ms from 3 s on: the two sides together never under -8.5 dB, one side
  // never under -12.5 (the side a colour leans to has the other side's share of it as well), the mean within
  // 1.5 dB. With Drift at 0 the comb stands still and the same bounds hold by pitch. (Before: Mix 0.4, echo up to
  // 1.67 times the note: -25 dB for the two sides together and -32 to -49 dB for one, for up to 3 s.)
  {
    struct Dips {
      double both = 99.0, one = 99.0, high = -99.0, mean_low = 99.0, mean_high = -99.0;
    };
    auto held_notes = [&](float drift, float seconds, double step) {
      Dips dips;
      const double full = 0.25 / std::sqrt(2.0);
      for (double note = 21.0; note <= 108.0; note += step) {
        const double hz = 440.0 * std::pow(2.0, (note - 69.0) / 12.0);
        device.init(kRate);
        device.set_param(p::kDrift, drift);
        const Stereo out = run(device, sine(static_cast<float>(hz), seconds, kRate, 0.25f));
        double sum = 0.0;
        int count = 0;
        for (size_t at = 3 * 48000; at + 2048 <= out.size(); at += 1024) {
          const double l = rms(out.left, at, at + 2048), r = rms(out.right, at, at + 2048);
          const double both = std::sqrt((l * l + r * r) / 2.0);
          dips.both = std::min(dips.both, db(both / full));
          dips.one = std::min(dips.one, db(std::min(l, r) / full));
          dips.high = std::max(dips.high, db(std::max(l, r) / full));
          sum += both * both;
          ++count;
        }
        const double mean = db(std::sqrt(sum / count) / full);
        dips.mean_low = std::min(dips.mean_low, mean);
        dips.mean_high = std::max(dips.mean_high, mean);
      }
      return dips;
    };
    const Dips still = held_notes(0.0f, 6.0f, 1.0);
    std::printf("held notes at the default Mix, Drift 0: the two sides together never under %+.1f dB, one side %+.1f, never over %+.1f\n",
                still.both, still.one, still.high);
    EXPECT(still.both > -8.5 && still.one > -12.5 && still.high < 4.5, "Drift 0: no held note is lost in the comb, at any pitch");
    const Dips moving = held_notes(p::kParamDefault[p::kDrift], 24.0f, 3.0);
    std::printf("held notes at the default: the two sides together never under %+.1f dB, one side %+.1f, never over %+.1f; mean %+.1f to %+.1f dB\n",
                moving.both, moving.one, moving.high, moving.mean_low, moving.mean_high);
    EXPECT(moving.both > -8.5 && moving.one > -12.5 && moving.high < 4.5, "the default: no held note is lost while the comb wanders");
    EXPECT(moving.mean_low > -1.5 && moving.mean_high < 1.5, "the default: over time a held note keeps its level at every pitch");

    // A held chord: two triads, each note a fundamental and two overtones. Every partial's level in windows of
    // 85 ms, the two sides together, against the same partial in the dry.
    std::vector<float> chord(static_cast<size_t>(24.0f * kRate), 0.0f);
    const double roots[6] = {130.81, 164.81, 196.0, 261.63, 329.63, 392.0};
    for (size_t i = 0; i < chord.size(); ++i) {
      const double t = static_cast<double>(i) / kRate;
      double sum = 0.0;
      for (int n = 0; n < 6; ++n) {
        for (int h = 1; h <= 3; ++h) sum += std::sin(2.0 * kPi * roots[n] * h * t + n + h) / (h * h);
      }
      chord[i] = 0.05f * static_cast<float>(sum);
    }
    device.init(kRate);
    const Stereo out = run(device, chord);
    double lowest = 99.0;
    for (int n = 0; n < 6; ++n) {
      // The fundamentals: 31 Hz apart at the nearest, and a window of 85 ms tells them apart.
      for (size_t at = 3 * 48000; at + 8192 <= out.size(); at += 4096) {
        const double l = tone_level(out.left, roots[n], kRate, at, at + 8192), r = tone_level(out.right, roots[n], kRate, at, at + 8192);
        const double dry = tone_level(chord, roots[n], kRate, at, at + 8192);
        lowest = std::min(lowest, db(std::sqrt((l * l + r * r) / 2.0) / dry));
      }
    }
    std::printf("a held chord at the default: no note of six under %+.1f dB\n", lowest);
    EXPECT(lowest > -8.5, "the default: no note of a held chord is lost");
  }

  // Two notes too close to tell apart keep one time. A frame cannot part two partials nearer than four bins, so
  // on two delays one of them was lost (before the strips: 3 to 16 dB down for pairs 25 to 45 Hz apart under
  // 300 Hz). Low close pairs, wet alone, at the default curve and at 48 bands with Smear full open: each tone
  // comes back at its own level.
  {
    const double pairs[6][2] = {{55.0, 90.0}, {65.4, 110.4}, {82.4, 117.4}, {110.0, 155.0}, {130.8, 164.8}, {220.0, 255.0}};
    double worst = 0.0;
    for (int fine = 0; fine < 2; ++fine) {
      for (const auto& pair : pairs) {
        plain(device);
        device.set_param(p::kSmear, fine ? 1.0f : 0.25f);
        device.set_param(p::kBands, fine ? 48.0f : 12.0f);
        std::vector<float> in = sine(static_cast<float>(pair[0]), 5.0f, kRate, 0.25f);
        const std::vector<float> other = sine(static_cast<float>(pair[1]), 5.0f, kRate, 0.25f);
        for (size_t i = 0; i < in.size(); ++i) in[i] += other[i];
        const Stereo out = run(device, in);
        for (double hz : pair) worst = std::min(worst, db(tone_level(out.left, hz, kRate, 2 * 48000, 5 * 48000) / 0.25));
      }
    }
    std::printf("two held tones 25 to 45 Hz apart, six low pairs: the weaker comes back at %+.2f dB\n", worst);
    EXPECT(worst > -1.0, "two low notes too close for a frame to part come back whole, at one time");
    // A bass line: five low notes of eight harmonics each, 55 Hz apart at the nearest. Every harmonic's
    // energy in what comes back, against what went in.
    double lost = 0.0;
    for (double root : {55.0, 65.4, 82.4, 98.0, 110.0}) {
      plain(device);
      device.set_param(p::kSmear, 0.25f);
      const size_t total = static_cast<size_t>(3.0 * kRate);
      std::vector<float> in(total, 0.0f);
      for (size_t i = 0; i < 43200; ++i) {
        const double t = static_cast<double>(i) / kRate;
        const double shape = std::min(1.0, t / 0.005) * std::exp(-t / 0.6) * std::min(1.0, (43200 - i) / 480.0);
        double sum = 0.0, gain = 1.0;
        for (int h = 1; h <= 8; ++h, gain *= 0.7) sum += gain * std::sin(2.0 * kPi * root * h * t);
        in[4800 + i] = 0.2f * static_cast<float>(shape * sum);
      }
      const Stereo out = run(device, in);
      for (int h = 1; h <= 8; ++h) lost = std::min(lost, 10.0 * std::log10(power_at(out.left, root * h) / power_at(in, root * h)));
    }
    std::printf("a bass line, five notes of eight harmonics: the weakest harmonic comes back at %+.2f dB\n", lost);
    EXPECT(lost > -3.0, "every harmonic of a bass note comes back");
  }

  // Attacks: nothing of a drum comes out before the drum. A kick (a sweep from 180 to 50 Hz under a click)
  // through the shortest fan there is use for (Time 90 ms, 48 bands melted, Mix 0.5): the 20 ms before the
  // dry's attack against the first 5 ms of it. With the least delay at 6 ms the wet began before the dry,
  // 37 dB under it; at 24 ms, half a frame and a little, it is under -45 dB.
  {
    const size_t total = static_cast<size_t>(1.5 * kRate);
    const size_t at = 24000;
    std::vector<float> kick(total, 0.0f);
    double phase = 0.0;
    for (size_t i = 0; i < 9600; ++i) {
      const double t = static_cast<double>(i) / kRate;
      phase += 2.0 * kPi * (50.0 + 130.0 * std::exp(-t / 0.03)) / kRate;
      kick[at + i] = static_cast<float>(0.8 * std::sin(phase) * std::exp(-t / 0.08) + (i < 48 ? 0.3 * (1.0 - i / 48.0) : 0.0));
    }
    device.init(kRate);
    device.set_param(p::kTime, 90.0f);
    device.set_param(p::kBands, 48.0f);
    device.set_param(p::kSmear, 1.0f);
    device.set_param(p::kFeedback, 0.0f);
    device.set_param(p::kMix, 0.5f);
    const Stereo out = run(device, kick);
    const size_t dry_at = at + kLatency;
    const double before = rms(out.left, dry_at - 960, dry_at), after = rms(out.left, dry_at, dry_at + 240);
    std::printf("a kick through a 90 ms fan at Mix 0.5: the 20 ms before its attack are %.1f dB under the attack\n", -db(before / after));
    EXPECT(db(before / after) < -45.0, "the wet does not come out before the attack it is made from");
  }

  // A knob moves only sound that comes after it: what is on its way keeps its time. A short note, and 40 ms
  // after it (before its first band is due) Time, Fan, Shape, Bend, Bands, Smear, Shuffle and Drift are thrown
  // one at a time. With Width at 0 (Width is laid on as a sound lands) and no Feedback, what comes back is
  // what comes back with nothing moved, sample for sample.
  {
    const size_t total = static_cast<size_t>(1.2 * kRate);
    const size_t split = 3840 + kLatency;  // a whole number of blocks
    const std::vector<float> note = burst(440.0, 0, 1440, total);
    const std::vector<float> head(note.begin(), note.begin() + split), rest(note.begin() + split, note.end());
    device.init(kRate);
    device.set_param(p::kFeedback, 0.0f);
    device.set_param(p::kWidth, 0.0f);
    const Stereo unmoved = run(device, note);
    struct Throw {
      int id;
      float to;
    };
    const Throw throws[] = {{p::kTime, 30.0f}, {p::kTime, 4000.0f}, {p::kFan, 0.0f},    {p::kShape, 4.0f},   {p::kShape, 1.0f},
                            {p::kBend, -1.0f}, {p::kBend, 1.0f},    {p::kBands, 2.0f},  {p::kBands, 48.0f},  {p::kSmear, 1.0f},
                            {p::kShuffle, 9.0f}, {p::kDrift, 0.0f}, {p::kDrift, 1.0f}};
    double worst = 0.0;
    for (const Throw& thrown : throws) {
      device.init(kRate);
      device.set_param(p::kFeedback, 0.0f);
      device.set_param(p::kWidth, 0.0f);
      Stereo out = run(device, head);
      device.set_param(thrown.id, thrown.to);
      out = concat(out, run(device, rest));
      worst = std::max(worst, worst_difference(out, unmoved));
    }
    EXPECT(peak(unmoved.left, split, total) > 0.05, "the note comes back after the knob is thrown");
    EXPECT(worst == 0.0, "a knob thrown while a sound is on its way does not move or cut that sound");
  }

  // Other sample rates: the times are times, not frames. Time 4 s is the whole ring at 96 kHz and still comes
  // back at 4 s; the curve's places are in hertz.
  {
    for (float rate : {44100.0f, 96000.0f}) {
      auto delay_at = [&](double hz, float time, float fan) {
        device.init(rate);
        device.set_param(p::kFeedback, 0.0f);
        device.set_param(p::kWidth, 0.0f);
        device.set_param(p::kSmear, 0.0f);
        device.set_param(p::kDrift, 0.0f);
        device.set_param(p::kMix, 1.0f);
        device.set_param(p::kTime, time);
        device.set_param(p::kFan, fan);
        const size_t length = static_cast<size_t>(0.1f * rate);
        const size_t total = static_cast<size_t>((time * 0.001f + 0.6f) * rate);
        std::vector<float> in(total, 0.0f);
        for (size_t i = 0; i < length; ++i) {
          const double window = 0.5 - 0.5 * std::cos(2.0 * kPi * static_cast<double>(i) / static_cast<double>(length));
          in[2400 + i] = 0.5f * static_cast<float>(window * std::sin(2.0 * kPi * hz * static_cast<double>(i) / rate));
        }
        const Stereo out = run(device, in);
        return (centre(out.left, 0, total) - centre(in, 0, total) - kLatency) * 1000.0 / rate;
      };
      Curve curve;
      curve.time_ms = 800.0;
      EXPECT_NEAR(delay_at(1000.0, 4000.0f, 0.0f), 4000.0, 0.5, "Time 4 s comes back at 4 s at 44.1 and 96 kHz");
      EXPECT_NEAR(delay_at(545.0, 800.0f, 1.0f), delay_ms(545.0, curve, rate), 1.0, "the curve is the same curve at 44.1 and 96 kHz");
      EXPECT_NEAR(delay_at(3182.0, 800.0f, 1.0f), delay_ms(3182.0, curve, rate), 1.0, "the curve is the same curve at 44.1 and 96 kHz");
      // A strip is four bins where a bin is wider than 25 Hz: at 96 kHz everything under 375 Hz is the first
      // colour (100 ms here), at 44.1 kHz everything under 200 Hz, and 340 Hz is the fifth band of twelve.
      EXPECT_NEAR(delay_at(340.0, 800.0f, 1.0f), rate > 60000.0f ? 100.0 : 354.55, 1.5, "the strips follow the frame's reach at 96 kHz");
      EXPECT_NEAR(delay_ms(340.0, curve, rate), rate > 60000.0f ? 100.0 : 354.55, 0.1, "and the curve written out here says the same");
    }
  }

  // No part of a knob is dead: on a phrase (a chord struck twice and a noise burst), each control at its
  // minimum, its middle and its maximum gives three renders that differ, each from the others, by more than
  // -30 dB of the render. Tilt is tried with Feedback up and Shuffle in Scatter, where they act.
  {
    const size_t total = static_cast<size_t>(3.0 * kRate);
    std::vector<float> phrase(total, 0.0f);
    rng_state() = 21;
    for (size_t i = 0; i < 9600; ++i) phrase[60000 + i] = 0.2f * white();
    for (size_t at : {2400u, 36000u}) {
      for (double hz : {130.8, 196.0, 329.6, 784.0, 2093.0}) {
        for (size_t i = 0; i < 19200; ++i) {
          const double t = static_cast<double>(i) / kRate;
          phrase[at + i] += 0.12f * static_cast<float>(std::exp(-6.0 * t) * std::sin(2.0 * kPi * hz * t));
        }
      }
    }
    double least = 1.0e9;
    int least_id = -1;
    for (int id = 0; id < p::kNumParams; ++id) {
      Stereo renders[3];
      for (int at = 0; at < 3; ++at) {
        device.init(kRate);
        if (id == p::kTilt) device.set_param(p::kFeedback, 0.8f);
        if (id == p::kShuffle) device.set_param(p::kShape, static_cast<float>(kScatter));
        float value = p::kParamMin[id] + (p::kParamMax[id] - p::kParamMin[id]) * 0.5f * at;
        if (id == p::kTime) value = at == 0 ? 20.0f : (at == 1 ? 283.0f : 4000.0f);
        if (id == p::kShape || id == p::kBands || id == p::kShuffle) value = std::floor(value + 0.5f);
        device.set_param(id, value);
        renders[at] = run(device, phrase);
      }
      for (int a = 0; a < 3; ++a) {
        for (int b = a + 1; b < 3; ++b) {
          double difference = 0.0, size = 0.0;
          for (size_t i = 0; i < total; ++i) {
            const double dl = static_cast<double>(renders[a].left[i]) - renders[b].left[i];
            const double dr = static_cast<double>(renders[a].right[i]) - renders[b].right[i];
            difference += dl * dl + dr * dr;
            size += static_cast<double>(renders[a].left[i]) * renders[a].left[i] +
                    static_cast<double>(renders[a].right[i]) * renders[a].right[i];
          }
          const double apart = 10.0 * std::log10(difference / size);
          if (apart < least) {
            least = apart;
            least_id = id;
          }
          if (apart < -30.0) {
            std::printf("FAIL: param %d: settings %d and %d differ by only %.1f dB\n", id, a, b, apart);
            ++failures();
          }
        }
      }
    }
    std::printf("every control, three settings on a phrase: the two nearest renders differ by %.1f dB (param %d)\n", least, least_id);
  }

  // The presets, as device.json has them (copied: a preset lists what it changes from the defaults). Each one:
  // a full-scale held chord for 30 s comes back at no more than twice its amplitude and does not grow; held
  // tones across the keyboard keep their level over time; and no held tone is lost at any moment: in windows of
  // 43 ms the two sides together never fall under -8.5 dB of the dry (every preset that keeps the dry has Mix at
  // 0.3 or under for this; with Mix at 1 there is no dry to cancel, and the bound is 1 / (1 + Feedback)).
  {
    struct Setting {
      int id;
      float value;
    };
    struct Preset {
      const char* name;
      std::vector<Setting> settings;
    };
    const std::vector<Preset> presets = {
    {"Low to high", {}},
    {"High to low", {{p::kShape, 1.0f}, {p::kTime, 700.0f}, {p::kFeedback, 0.35f}, {p::kBands, 10.0f}}},
    {"Slow unfolding", {{p::kTime, 2400.0f}, {p::kBands, 24.0f}, {p::kSmear, 0.6f}, {p::kFeedback, 0.5f}}},
    {"One plain echo", {{p::kFan, 0.0f}, {p::kTime, 380.0f}, {p::kFeedback, 0.45f}, {p::kWidth, 0.3f}}},
    {"Short chirp", {{p::kTime, 90.0f}, {p::kBands, 48.0f}, {p::kSmear, 1.0f}, {p::kFeedback, 0.25f}, {p::kTilt, 0.0f}}},
    {"Scattered notes", {{p::kShape, 4.0f}, {p::kBands, 8.0f}, {p::kSmear, 0.0f}, {p::kTime, 1200.0f}, {p::kFeedback, 0.5f}, {p::kShuffle, 3.0f}}},
    {"Partial cloud", {{p::kShape, 4.0f}, {p::kBands, 48.0f}, {p::kSmear, 1.0f}, {p::kTime, 2000.0f}, {p::kFeedback, 0.7f}, {p::kShuffle, 7.0f}, {p::kWidth, 1.0f}}},
    {"Middle first", {{p::kShape, 3.0f}, {p::kTime, 800.0f}, {p::kFeedback, 0.35f}, {p::kSmear, 0.5f}}},
    {"Edges first", {{p::kShape, 2.0f}, {p::kTime, 900.0f}, {p::kBend, 0.4f}, {p::kFeedback, 0.3f}}},
    {"Faint trail", {{p::kTime, 300.0f}, {p::kFan, 0.6f}, {p::kFeedback, 0.2f}, {p::kMix, 0.15f}}},
    {"Long fan", {{p::kTime, 1500.0f}, {p::kBands, 16.0f}, {p::kFeedback, 0.92f}, {p::kTilt, -0.4f}}},
    {"Four colours", {{p::kBands, 4.0f}, {p::kSmear, 0.0f}, {p::kTime, 1000.0f}, {p::kFeedback, 0.45f}, {p::kTilt, 0.0f}}},
    {"Darkening", {{p::kTime, 500.0f}, {p::kFeedback, 0.75f}, {p::kTilt, -1.0f}, {p::kBands, 6.0f}}},
    {"Thinning out", {{p::kShape, 1.0f}, {p::kTime, 650.0f}, {p::kFeedback, 0.75f}, {p::kTilt, 0.8f}}},
    {"Short flutter", {{p::kTime, 30.0f}, {p::kBands, 9.0f}, {p::kSmear, 0.0f}, {p::kFeedback, 0.9f}, {p::kTilt, -0.3f}, {p::kDrift, 0.2f}}},
    {"Colours alone", {{p::kTime, 700.0f}, {p::kFeedback, 0.5f}, {p::kWidth, 0.8f}, {p::kMix, 1.0f}}},
    };
    EXPECT(presets.size() == 16, "sixteen presets");
    std::vector<float> chord(static_cast<size_t>(30.0f * kRate));
    for (size_t i = 0; i < chord.size(); ++i) {
      const double t = static_cast<double>(i) / kRate;
      chord[i] = 0.25f * static_cast<float>(std::sin(2.0 * kPi * 110.0 * t) + std::sin(2.0 * kPi * 277.18 * t + 1.0) +
                                            std::sin(2.0 * kPi * 659.25 * t + 2.0) + std::sin(2.0 * kPi * 1975.5 * t + 3.0));
    }
    const double chord_peak = peak(chord), chord_rms = rms(chord);
    const size_t second = static_cast<size_t>(kRate);
    double worst_peak = 0.0, lowest = 99.0, highest = -99.0, deepest = 99.0;
    for (const Preset& preset : presets) {
      device.init(kRate);
      for (const Setting& setting : preset.settings) device.set_param(setting.id, setting.value);
      const Stereo out = run(device, chord);
      const double top = std::max(peak(out.left), peak(out.right)) / chord_peak;
      const double early = std::max(rms(out.left, 5 * second, 17 * second), rms(out.right, 5 * second, 17 * second));
      const double late = std::max(rms(out.left, 17 * second, 30 * second), rms(out.right, 17 * second, 30 * second));
      const double chord_db = db(std::sqrt((rms(out.left, 5 * second, 30 * second) * rms(out.left, 5 * second, 30 * second) +
                                            rms(out.right, 5 * second, 30 * second) * rms(out.right, 5 * second, 30 * second)) / 2.0) / chord_rms);
      double low = 99.0, high = -99.0, dip = 99.0;
      for (double hz : {55.0, 82.4, 146.8, 261.6, 440.0, 784.0, 1396.9, 2637.0, 4186.0}) {
        device.init(kRate);
        for (const Setting& setting : preset.settings) device.set_param(setting.id, setting.value);
        const Stereo tone = run(device, sine(hz, 24.0f, kRate, 0.25f));
        const double full = 0.25 / std::sqrt(2.0);
        const double l = rms(tone.left, 4 * second, 24 * second), r = rms(tone.right, 4 * second, 24 * second);
        const double level = db(std::sqrt((l * l + r * r) / 2.0) / full);
        low = std::min(low, level);
        high = std::max(high, level);
        for (size_t at = 4 * second; at + 2048 <= tone.size(); at += 1024) {
          const double wl = rms(tone.left, at, at + 2048), wr = rms(tone.right, at, at + 2048);
          dip = std::min(dip, db(std::sqrt((wl * wl + wr * wr) / 2.0) / full));
        }
      }
      std::printf("preset %-16s held chord: peak %.2f times the input's, level %+.1f dB, later/earlier %.3f; held tones %+.1f to %+.1f dB, never under %+.1f\n",
                  preset.name, top, chord_db, late / early, low, high, dip);
      worst_peak = std::max(worst_peak, top);
      lowest = std::min(lowest, low);
      highest = std::max(highest, high);
      deepest = std::min(deepest, dip);
      // Two stretches of 12 s are one or two of Drift's cycles each, so their levels differ by a little: 1.15.
      if (top > 2.1 || late > 1.15 * early) {
        std::printf("FAIL: preset %s: a held chord peaks at %.2f times the input's or grows (%.3f)\n", preset.name, top, late / early);
        ++failures();
      }
    }
    std::printf("presets: held chord peaks at most %.2f times the input's; held tones %+.1f to %+.1f dB over 20 s\n", worst_peak,
                lowest, highest);
    EXPECT(lowest > -4.0 && highest < 4.0, "every preset: a held tone keeps its level over time at every pitch tried");
    EXPECT(deepest > -8.5, "every preset: no held tone is lost at any moment");
  }

  // Cost: the average, and the worst block (one with a frame in it), at the defaults and at the dearest setting:
  // every bin its own time, the longest Time (the whole ring in use), Feedback 1, on noise (a peak every few bins).
  {
    rng_state() = 0xBEEFu;
    const std::vector<float> input = noise(10.0f, kRate, 0.25f);
    for (int which = 0; which < 2; ++which) {
      const char* label = which == 0 ? "prism" : "prism (worst setting)";
      auto setup = [&] {
        device.init(kRate);
        if (which == 1) {
          device.set_param(p::kTime, 4000.0f);
          device.set_param(p::kBands, 48.0f);
          device.set_param(p::kSmear, 1.0f);
          device.set_param(p::kFeedback, 1.0f);
          device.set_param(p::kShape, static_cast<float>(kScatter));
          device.set_param(p::kWidth, 1.0f);
        }
      };
      setup();
      report_cost(label, 10.0f, kRate, [&] { run(device, input); });
      setup();
      std::vector<double> micros;
      for (size_t done = 0; done + 128 <= input.size(); done += 128) {
        for (int i = 0; i < 128; ++i) device.in_left()[i] = device.in_right()[i] = input[done + i];
        const auto start = std::chrono::steady_clock::now();
        device.process(128);
        micros.push_back(std::chrono::duration<double, std::micro>(std::chrono::steady_clock::now() - start).count());
      }
      std::sort(micros.begin(), micros.end());
      // Half the blocks hold a frame, so the 95th percentile is one of them without the scheduler's noise.
      const double p95 = micros[micros.size() * 95 / 100];
      double sum = 0.0;
      for (double m : micros) sum += m;
      std::printf("%s: mean block %.1f us (%.2f%%), worst block (95th percentile) %.1f us, %.2f%% of its 2667 us\n", label,
                  sum / micros.size(), 100.0 * sum / micros.size() / 2666.7, p95, 100.0 * p95 / 2666.7);
    }
  }

  return finish("prism");
}
