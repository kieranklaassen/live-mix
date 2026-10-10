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

// The wet path alone, with nothing but the delays: no repeats, no panning.
static void plain(Prism& d) {
  d.init(kRate);
  d.set_param(p::kFeedback, 0.0f);
  d.set_param(p::kTilt, 0.0f);
  d.set_param(p::kWidth, 0.0f);
  d.set_param(p::kSmear, 0.0f);
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

  // PART 3

  return finish("prism");
}
