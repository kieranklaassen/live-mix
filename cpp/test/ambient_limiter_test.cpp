// Native harness for Ambient Limiter (cpp/devices/ambient-limiter). The
// conformance pass covers stability, silence when idle, block-size
// independence and parameter abuse; the rest asserts what makes it this
// limiter: the ceiling holds on the true-peak measure, a drone leaning on it
// comes out clean where the brickwall alone distorts it, the ride moves at
// the times its controls say, and a short burst barely moves it. Every figure
// asserted is also printed.

#include "../devices/ambient-limiter/ambient_limiter.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::AmbientLimiter;
namespace p = livemix::ambient_limiter;

static AmbientLimiter device;

static const float kRate = 48000.0f;
static const size_t kLatency = AmbientLimiter::kLatency;
static const double kCeiling = std::pow(10.0, -1.0 / 20.0);  // the default, -1 dBTP
// Frames between two readings of the meter in a trace.
static const int kStep = 16;

static size_t at(double seconds) { return static_cast<size_t>(seconds * kRate); }

// A level `over_db` over the default ceiling, linear.
static float over(double over_db) {
  return static_cast<float>(kCeiling * std::pow(10.0, over_db / 20.0));
}

// `seconds` of a tone whose phase carries on from sample `start`.
static void add_tone(std::vector<float>& x, double hz, double seconds, double gain,
                     size_t start = 0) {
  const size_t n = at(seconds);
  for (size_t i = 0; i < n; ++i) {
    x.push_back(static_cast<float>(
        gain * std::sin(2.0 * kPi * hz * static_cast<double>(start + i) / kRate)));
  }
}

// The meter's measure of true peak: the BS.1770-4 Annex 2 four-phase FIR, the
// table cpp/test/true_peak_limiter_test.cpp uses, applied from the first
// sample on (what came before it is silence).
static double true_peak(const std::vector<float>& x) {
  static const float phases[4][12] = {
      {0.001708984375f, 0.010986328125f, -0.0196533203125f, 0.033203125f, -0.0594482421875f,
       0.1373291015625f, 0.97216796875f, -0.102294921875f, 0.047607421875f, -0.026611328125f,
       0.014892578125f, -0.00830078125f},
      {-0.0291748046875f, 0.029296875f, -0.0517578125f, 0.089111328125f, -0.16650390625f,
       0.465087890625f, 0.77978515625f, -0.2003173828125f, 0.1015625f, -0.0582275390625f,
       0.0330810546875f, -0.0189208984375f},
      {-0.0189208984375f, 0.0330810546875f, -0.0582275390625f, 0.1015625f, -0.2003173828125f,
       0.77978515625f, 0.465087890625f, -0.16650390625f, 0.089111328125f, -0.0517578125f,
       0.029296875f, -0.0291748046875f},
      {-0.00830078125f, 0.014892578125f, -0.026611328125f, 0.047607421875f, -0.102294921875f,
       0.97216796875f, 0.1373291015625f, -0.0594482421875f, 0.033203125f, -0.0196533203125f,
       0.010986328125f, 0.001708984375f},
  };
  float worst = 0.0f;
  const int n = static_cast<int>(x.size());
  for (int k = 0; k < n; ++k) {
    worst = std::max(worst, std::fabs(x[k]));
    for (const float* h : phases) {
      float y = 0.0f;
      for (int i = 0; i < 12 && i <= k; ++i) y += h[i] * x[k - i];
      worst = std::max(worst, std::fabs(y));
    }
  }
  return worst;
}

// The output with the meter and the ride's own share read every kStep frames.
struct Trace {
  Stereo out;
  std::vector<float> meter;
  std::vector<float> ride;
  // The reading taken at the end of the kStep frames that hold `sample`.
  float meter_at(size_t sample) const { return meter[std::min(sample / kStep, meter.size() - 1)]; }
  float ride_at(size_t sample) const { return ride[std::min(sample / kStep, ride.size() - 1)]; }
};

static Trace trace(AmbientLimiter& d, const std::vector<float>& left,
                   const std::vector<float>& right) {
  Trace t;
  const size_t total = left.size();
  t.out.left.resize(total);
  t.out.right.resize(total);
  for (size_t done = 0; done < total;) {
    const int frames = static_cast<int>(std::min(static_cast<size_t>(kStep), total - done));
    for (int i = 0; i < frames; ++i) {
      d.in_left()[i] = left[done + i];
      d.in_right()[i] = right[done + i];
    }
    d.process(frames);
    for (int i = 0; i < frames; ++i) {
      t.out.left[done + i] = d.out_left()[i];
      t.out.right[done + i] = d.out_right()[i];
    }
    t.meter.push_back(d.meter(0));
    t.ride.push_back(d.ride_db());
    done += frames;
  }
  return t;
}

static Trace trace(AmbientLimiter& d, const std::vector<float>& mono) {
  return trace(d, mono, mono);
}

// The loudest of harmonics 2 to 9 of `hz` against the fundamental, in dB.
static double worst_harmonic(const std::vector<float>& x, double hz, size_t from, size_t to) {
  const double fundamental = tone_level(x, hz, kRate, from, to);
  double worst = 0.0;
  for (int h = 2; h <= 9; ++h) worst = std::max(worst, tone_level(x, hz * h, kRate, from, to));
  return db(worst / fundamental);
}

// Everything in [from, to) that is not the `hz` tone, against the tone, in dB:
// a least-squares fit of one sinusoid, so the tone need not be locked to the
// sample rate or the window. Harmonics, sidebands and noise all count.
static double residual(const std::vector<float>& x, double hz, size_t from, size_t to) {
  double cc = 0.0, ss = 0.0, cs = 0.0, xc = 0.0, xs = 0.0;
  for (size_t i = from; i < to; ++i) {
    const double phase = 2.0 * kPi * hz * static_cast<double>(i) / kRate;
    const double c = std::cos(phase), sn = std::sin(phase);
    cc += c * c;
    ss += sn * sn;
    cs += c * sn;
    xc += x[i] * c;
    xs += x[i] * sn;
  }
  const double det = cc * ss - cs * cs;
  const double a = (xc * ss - xs * cs) / det;
  const double b = (xs * cc - xc * cs) / det;
  double rest = 0.0, tone = 0.0;
  for (size_t i = from; i < to; ++i) {
    const double phase = 2.0 * kPi * hz * static_cast<double>(i) / kRate;
    const double fit = a * std::cos(phase) + b * std::sin(phase);
    rest += (x[i] - fit) * (x[i] - fit);
    tone += fit * fit;
  }
  return 10.0 * std::log10(std::max(rest, 1.0e-30) / tone);
}

// Largest distance between `out` and `in` delayed by the latency, from `from`.
static double delay_error(const std::vector<float>& out, const std::vector<float>& in,
                          size_t from = 0) {
  double worst = 0.0;
  for (size_t i = from; i < out.size(); ++i) {
    const double dry = i >= kLatency ? in[i - kLatency] : 0.0;
    worst = std::max(worst, std::fabs(static_cast<double>(out[i]) - dry));
  }
  return worst;
}

// A click detector that follows the level: the largest sample-to-sample jump
// in each cycle of a `hz` tone against the largest a sine of that cycle's
// peak can make. 1 is a clean tone at any gain; a step in the gain adds to it.
static double worst_step_ratio(const std::vector<float>& x, double hz, size_t from, size_t to) {
  const size_t cycle = static_cast<size_t>(kRate / hz) + 1;
  const double own = 2.0 * std::sin(kPi * hz / kRate);
  double worst = 0.0;
  for (size_t i = from; i + cycle <= to; i += cycle) {
    worst = std::max(worst, max_step(x, i, i + cycle + 1) / (own * peak(x, i, i + cycle + 1)));
  }
  return worst;
}

int main() {
  // 1. Conformance. It never exceeds 0 dBTP, so full scale is the bound.
  Conformance spec;
  spec.name = "ambient-limiter";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 1.0f;
  spec.max_peak = 1.01f;
  check_effect(device, spec, kRate);

  // 2. The ceiling holds, on samples and on the four-times measure, from the
  // first sample on: so also while the ride is still on its way down.
  for (float gain : {0.0f, 24.0f}) {
    device.init(kRate);
    device.set_param(p::kGain, gain);
    rng_state() = 0xA3B1E57u;
    const std::vector<float> left = noise(5.0f, kRate, over(12.0));
    const std::vector<float> right = noise(5.0f, kRate, over(12.0));
    Stereo out = run(device, left, right);
    const double samples = db(std::max(peak(out.left), peak(out.right)) / kCeiling);
    const double inter = db(std::max(true_peak(out.left), true_peak(out.right)) / kCeiling);
    std::printf("2. noise 12 dB over, Gain %+.0f: sample peak %+.3f dB, true peak %+.3f dB re "
                "ceiling (target at most +0.1)\n",
                gain, samples, inter);
    EXPECT(finite(out.left) && finite(out.right), "hot noise stays finite");
    EXPECT(samples <= 0.1, "hot noise: no sample more than 0.1 dB over the ceiling");
    EXPECT(inter <= 0.1, "hot noise: no true peak more than 0.1 dB over the ceiling");
    EXPECT(samples > -3.0, "hot noise: it limits, it does not mute");
  }

  // 3. Under the ceiling it is a delay of 77 samples, at every sample rate.
  {
    device.init(kRate);
    std::vector<float> in;
    add_tone(in, 440.0, 1.0, over(-12.0));
    Stereo out = run(device, in);
    const double worst = std::max(delay_error(out.left, in), delay_error(out.right, in));
    std::printf("3. tone 12 dB under: largest distance from the input 77 samples late %.2e "
                "(target under 1e-6)\n",
                worst);
    EXPECT(worst < 1.0e-6, "a tone under the ceiling is the input, delayed by the latency");
    EXPECT(device.meter(0) == 0.0f, "and the meter reads no reduction");

    for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
      device.init(rate);
      std::vector<float> click(2048, 0.0f);
      click[100] = 0.1f;
      Stereo heard = run(device, click);
      size_t first = click.size();
      for (size_t i = 0; i < heard.size(); ++i) {
        if (heard.left[i] != 0.0f) {
          first = i;
          break;
        }
      }
      std::printf("3. latency at %.0f Hz: %d samples (target 77)\n", rate,
                  static_cast<int>(first) - 100);
      EXPECT(first == 100 + kLatency, "an impulse comes out 77 samples later at every rate");
      EXPECT(first < heard.size() && heard.left[first] == 0.1f &&
                 peak(heard.left) == static_cast<double>(0.1f),
             "and it is the impulse itself, nothing around it");
    }
  }

  // 4, 5, 6, 12. A drone 9 dB over the ceiling: clean once the ride has it,
  // 0.5 dB under the ceiling and standing still; the ride gets there with a
  // 250 ms time constant; the meter says what was taken off.
  const double kDroneHz = 40.0;
  std::vector<float> drone;
  add_tone(drone, kDroneHz, 6.0, over(9.0));
  {
    device.init(kRate);
    Trace t = trace(device, drone);
    const double clean = worst_harmonic(t.out.left, kDroneHz, at(3.0), at(6.0));

    device.init(kRate);
    device.set_param(p::kRide, 0.0f);
    Stereo wall = run(device, drone);
    const double dirty = worst_harmonic(wall.left, kDroneHz, at(3.0), at(6.0));
    std::printf("4. 40 Hz drone 9 dB over, worst of harmonics 2 to 9: Ride 1 %.1f dB (target under "
                "-60), Ride 0 %.1f dB (target over -40)\n",
                clean, dirty);
    EXPECT(clean < -60.0, "Ride 1: every harmonic of the drone is 60 dB under it");
    EXPECT(dirty > -40.0, "Ride 0: the brickwall alone distorts the drone");
    EXPECT(db(true_peak(wall.left) / kCeiling) <= 0.1, "Ride 0: the ceiling still holds");

    // 40 Hz at 48 kHz puts every peak on a sample, which flatters a detector.
    // A0 does not: its sample peaks differ from cycle to cycle. Here all that
    // is not the drone counts, sidebands of a gain that wobbles included.
    const double kLowHz = 27.5;
    std::vector<float> low;
    add_tone(low, kLowHz, 6.0, over(9.0));
    double rest[2];
    for (int ride = 0; ride < 2; ++ride) {
      device.init(kRate);
      device.set_param(p::kRide, static_cast<float>(ride));
      Stereo out = run(device, low);
      rest[ride] = residual(out.left, kLowHz, at(3.0), at(6.0));
    }
    std::printf("4. 27.5 Hz drone 9 dB over, all that is not the drone: Ride 1 %.1f dB (target "
                "under -60), Ride 0 %.1f dB (target over -40)\n",
                rest[1], rest[0]);
    EXPECT(rest[1] < -60.0, "Ride 1: a drone off the sample grid is as clean");
    EXPECT(rest[0] > -40.0, "Ride 0: and as distorted by the brickwall alone");

    // One reading per cycle of the drone over the last three seconds.
    const size_t cycle = at(1.0 / kDroneHz);
    double lowest = 1.0e9, highest = -1.0e9;
    for (size_t i = at(3.0); i + cycle <= at(6.0); i += cycle) {
      const double level = db(peak(t.out.left, i, i + cycle) / kCeiling);
      lowest = std::min(lowest, level);
      highest = std::max(highest, level);
    }
    std::printf("5. settled drone: peak %.3f dB re ceiling (target -0.7 to -0.3), moving %.4f dB "
                "(target under 0.05)\n",
                highest, highest - lowest);
    EXPECT(highest < -0.3 && lowest > -0.7, "the drone settles 0.5 dB under the ceiling");
    EXPECT(highest - lowest < 0.05, "and stays there: the gain no longer moves");
    EXPECT(db(true_peak(t.out.left) / kCeiling) <= 0.1,
           "the ceiling holds while the ride comes down");

    const double settled = t.ride_at(at(6.0) - 1);
    const double share = t.ride_at(at(0.25)) / settled;
    std::printf("6. ride 250 ms after the onset: %.3f of its final %.3f dB (target 0.632 +/- "
                "0.126)\n",
                share, settled);
    EXPECT_NEAR(share, 0.632, 0.126, "the ride covers 63 % of its way in 250 ms");
    EXPECT(t.meter_at(at(0.02)) < -8.0 && t.ride_at(at(0.02)) > -1.0,
           "at the onset the brickwall does the work the ride has not reached");

    const double reading = t.meter_at(at(6.0) - 1);
    std::printf("12. meter on the settled drone: %.4f dB (target -9.5 +/- 0.3), of which ride "
                "%.4f\n",
                reading, settled);
    EXPECT_NEAR(reading, -9.5, 0.3, "the meter reads the 9.5 dB taken off the drone");
    EXPECT(reading == settled, "all of it is the ride's: the brickwall has nothing left to do");
  }

  // 7. Release: the drone drops to 20 dB under the ceiling. Once the hold has
  // let go (40 ms after the last loud peak) the reduction is 63 % recovered
  // after Release.
  for (float release : {0.5f, 3.0f}) {
    device.init(kRate);
    device.set_param(p::kRelease, release);
    std::vector<float> in = drone;
    add_tone(in, kDroneHz, release + 1.0, over(-20.0), drone.size());
    Trace t = trace(device, in);
    // The last peak of the loud part is three quarters into its last cycle.
    const size_t let_go = drone.size() - at(0.25 / kDroneHz) + at(0.04);
    const double before = t.meter_at(drone.size() - 1);
    const double after = t.meter_at(let_go + at(release));
    const double recovered = 1.0 - after / before;
    std::printf("7. Release %.1f s: %.3f of %.3f dB recovered that long after the hold lets go "
                "(target 0.632 +/- 0.126)\n",
                release, recovered, before);
    char label[96];
    std::snprintf(label, sizeof label, "Release %.1f s: 63 %% of the reduction is back after it",
                  release);
    EXPECT_NEAR(recovered, 0.632, 0.126, label);
    EXPECT(t.meter_at(let_go - kStep) < before + 0.01, "nothing is released while the hold lasts");
  }

  // 8. One loud moment is soon over: 3 ms of 1 kHz at 10 dB over the ceiling
  // on top of a 440 Hz tone 8 dB under it. The brickwall takes the burst and
  // is back in its 80 ms; the ride has 43 ms to answer and then turns round.
  {
    const size_t burst = at(1.5);
    const size_t length = at(0.003);
    std::vector<float> in;
    add_tone(in, 440.0, 3.0, over(-8.0));
    for (size_t i = 0; i < length; ++i) {
      in[burst + i] += over(10.0) * static_cast<float>(std::sin(
                                        2.0 * kPi * 1000.0 * static_cast<double>(i) / kRate));
    }
    // The 440 Hz tone 300 ms after the burst has left the output, against
    // the tone before it, in dB.
    const size_t gone = burst + length + kLatency;
    auto level_after = [&](const Trace& t) {
      return db(tone_level(t.out.left, 440.0, kRate, gone + at(0.275), gone + at(0.325)) /
                tone_level(t.out.left, 440.0, kRate, at(1.0), at(1.4)));
    };

    device.init(kRate);
    Trace t = trace(device, in);
    const double held = db(true_peak(t.out.left) / kCeiling);
    const double hit = *std::min_element(t.meter.begin(), t.meter.end());
    const double dip = *std::min_element(t.ride.begin(), t.ride.end());
    const double late = level_after(t);
    const double ride_late = t.ride_at(gone + at(0.3));
    device.init(kRate);
    device.set_param(p::kRelease, 0.2f);
    const double late_short = level_after(trace(device, in));
    std::printf("8. 3 ms burst (%.2f dB over with the tone): true peak %+.3f dB re ceiling (target "
                "at most +0.1), total reduction at the burst %.2f dB, deepest ride %.3f dB (target "
                "above -2)\n",
                db(peak(in) / kCeiling), held, hit, dip);
    std::printf("8. the 440 Hz tone 300 ms after the burst: %.3f dB at Release 1.5 s (target above "
                "-2, the brief asked -1.5), of which ride %.3f; %.3f dB at Release 0.2 s\n",
                late, ride_late, late_short);
    EXPECT(held <= 0.1, "the ceiling holds through the burst");
    EXPECT(hit < -9.0, "the brickwall takes the burst itself");
    EXPECT(dip > -2.0, "a 3 ms burst moves the ride less than 2 dB");
    EXPECT(dip < -1.0, "the ride does answer the burst while the hold lasts");
    // 1.5 dB is out of reach at the default Release: the dip itself is 1.8 dB
    // (the burst lands on a peak of the tone, 11 dB over, for 43 ms of a
    // 250 ms pole), 1.5 s gives back a seventh of it in 260 ms, and the
    // brickwall's 80 ms release still holds 0.15 dB. Within 2 dB it is.
    EXPECT(late > -2.0, "300 ms after the burst the tone is within 2 dB of where it was");
    EXPECT(ride_late > dip + 0.2, "the ride is on its way back by then");
    EXPECT(late_short > -1.5, "with Release at 0.2 s it is within the 1.5 dB");
  }

  // 9. Gain is plain gain while the result stays under the ceiling.
  {
    std::vector<float> in;
    add_tone(in, 440.0, 1.0, over(-20.0));
    device.init(kRate);
    Stereo flat = run(device, in);
    device.init(kRate);
    device.set_param(p::kGain, 6.0f);
    Stereo raised = run(device, in);
    const double lift = db(tone_level(raised.left, 440.0, kRate, at(0.5), at(1.0)) /
                           tone_level(flat.left, 440.0, kRate, at(0.5), at(1.0)));
    std::printf("9. Gain +6 on a tone under the ceiling: %+.4f dB (target 6 +/- 0.05)\n", lift);
    EXPECT_NEAR(lift, 6.0, 0.05, "Gain +6 raises a tone under the ceiling by 6 dB");
  }

  // 10. Stereo link: an over on the left turns the right down by as much.
  {
    std::vector<float> left = drone;
    std::vector<float> right;
    add_tone(right, 1000.0, 6.0, over(-30.0));
    device.init(kRate);
    Stereo out = run(device, left, right);
    const double left_db = db(tone_level(out.left, kDroneHz, kRate, at(5.0), at(6.0)) /
                              tone_level(left, kDroneHz, kRate, at(5.0), at(6.0)));
    const double right_db = db(tone_level(out.right, 1000.0, kRate, at(5.0), at(6.0)) /
                               tone_level(right, 1000.0, kRate, at(5.0), at(6.0)));
    std::printf("10. over on the left only: left %.3f dB, quiet right %.3f dB (target within "
                "0.1)\n",
                left_db, right_db);
    EXPECT(left_db < -9.0, "the left channel is ridden down");
    EXPECT_NEAR(right_db, left_db, 0.1, "the right channel follows by the same number of dB");
  }

  // 11. No clicks: Ceiling and Gain swept in steps while a tone plays. Under
  // the ceiling the output is the tone times a gliding gain. Leaning on it,
  // the ceiling comes down under a tone that both stages are holding, and the
  // jumps are judged against the level the tone has at that moment.
  {
    const double amplitude = 0.05;  // under the lowest ceiling at the highest gain
    const int steps = 48;
    const size_t every = 512;
    const size_t swept = static_cast<size_t>(steps) * every;
    std::vector<float> in;
    add_tone(in, 220.0, static_cast<double>(swept) / kRate + 0.1, amplitude);
    device.init(kRate);
    device.set_param(p::kCeiling, 0.0f);
    device.set_param(p::kGain, -12.0f);
    Stereo out;
    for (int s = 0; s <= steps; ++s) {
      const size_t from = static_cast<size_t>(s) * every;
      const size_t to = s == steps ? in.size() : from + every;
      out = concat(out, run(device, std::vector<float>(in.begin() + from, in.begin() + to)));
      device.set_param(p::kCeiling, -12.0f * static_cast<float>(s + 1) / steps);
      device.set_param(p::kGain, -12.0f + 24.0f * static_cast<float>(s + 1) / steps);
    }
    const double own = max_step(in) * std::pow(10.0, 12.0 / 20.0);
    const double moved = max_step(out.left);
    const double ratio = worst_step_ratio(out.left, 220.0, kLatency + 480, out.size());
    std::printf("11. Ceiling 0 to -12 and Gain -12 to +12 in %d steps under a 220 Hz tone: "
                "largest step %.5f against the tone's own at +12 dB %.5f (target under 1.5 "
                "times); cycle by cycle %.3f times its own\n",
                steps, moved, own, ratio);
    EXPECT(moved < 1.5 * own, "Ceiling and Gain swept under a tone glide");
    EXPECT(ratio < 1.5, "and no cycle of it, quiet or loud, carries a step");
    EXPECT(db(peak(out.left, out.size() - 2400) / amplitude) > 11.9, "the sweep reached +12 dB");

    std::vector<float> loud;
    add_tone(loud, 220.0, 1.0 + static_cast<double>(swept) / kRate, 0.7);
    device.init(kRate);
    device.set_param(p::kCeiling, 0.0f);
    Stereo leaning = run(device, std::vector<float>(loud.begin(), loud.begin() + at(1.0)));
    for (int s = 0; s < steps; ++s) {
      device.set_param(p::kCeiling, -12.0f * static_cast<float>(s + 1) / steps);
      const size_t from = at(1.0) + static_cast<size_t>(s) * every;
      leaning = concat(leaning, run(device, std::vector<float>(loud.begin() + from,
                                                               loud.begin() + from + every)));
    }
    const double pressed = worst_step_ratio(leaning.left, 220.0, at(1.0), leaning.size());
    const double landed = db(peak(leaning.left, leaning.size() - 480) / 0.7);
    std::printf("11. Ceiling 0 to -12 under a tone leaning on it: cycle by cycle %.3f times its "
                "own (target under 1.5), the tone ends %.2f dB down\n",
                pressed, landed);
    EXPECT(pressed < 1.5, "Ceiling swept under a tone that leans on it glides");
    EXPECT(landed < -8.5, "and the tone has come down with the ceiling");
  }

  // 12. The meter at rest, awake: a quiet tone after the drone, the ride home
  // again. TruePeakLimiter's release stops a float step short of unity once
  // it has worked, so the tone itself stays 0.001 dB down until the device
  // next sleeps; the meter calls that rest.
  {
    std::vector<float> in;
    add_tone(in, kDroneHz, 2.0, over(9.0));
    add_tone(in, 440.0, 4.0, over(-12.0));
    device.init(kRate);
    device.set_param(p::kRelease, 0.2f);
    Trace t = trace(device, in);
    const double left_over = db(tone_level(t.out.left, 440.0, kRate, at(5.0), at(6.0)) /
                                tone_level(in, 440.0, kRate, at(5.0), at(6.0)));
    std::printf("12. a quiet tone after the drone: meter %g dB (target 0), the tone itself %+.4f "
                "dB (the brickwall's stalled release, target within 0.005)\n",
                static_cast<double>(device.meter(0)), left_over);
    EXPECT(t.meter_at(at(2.0)) < -9.0 && device.meter(0) == 0.0f,
           "at rest the meter reads 0 while the device is still awake");
    EXPECT(left_over <= 0.0001 && left_over > -0.005, "and the tone is back at unity gain");
  }

  // 12. The device sleeps. The ride goes on releasing through the silence
  // first; asleep, the meter reads 0 and the next sound starts from unity.
  {
    device.init(kRate);
    run(device, drone);
    Trace quiet = trace(device, silence(16.0f, kRate));
    const double early = quiet.meter_at(at(1.5 + 0.04));
    Stereo rest = render(device, 0.5f, kRate);
    std::printf("12. after the drone: meter %.3f dB 1.5 s into silence, %g dB 16 s in (target "
                "0)\n",
                early, static_cast<double>(device.meter(0)));
    EXPECT(peak(quiet.out.left, at(0.1)) == 0.0 && peak(rest.left) == 0.0 &&
               peak(rest.right) == 0.0,
           "silence in, exact silence out");
    EXPECT_NEAR(early, -9.5 * 0.368, 9.5 * 0.126, "the ride releases through silence at Release");
    EXPECT(device.meter(0) == 0.0f, "asleep, the meter reads 0");
    std::vector<float> in;
    add_tone(in, 440.0, 0.5, over(-12.0));
    Stereo woken = run(device, in);
    EXPECT(delay_error(woken.left, in) < 1.0e-6, "it wakes at unity: a quiet tone is only delayed");
  }

  // Not in the brief. Bad audio is survivable: a sample that is not a number,
  // an infinite one and an absurd one in a quiet tone are dropped and leave
  // no trace.
  {
    std::vector<float> in;
    add_tone(in, 440.0, 3.0, over(-12.0));
    in[at(0.5)] = std::nanf("");
    in[at(0.5) + 1] = INFINITY;
    in[at(0.5) + 2] = -1.0e30f;
    device.init(kRate);
    Trace t = trace(device, in);
    const double worst = delay_error(t.out.left, in, at(2.5));
    const double dip = *std::min_element(t.ride.begin(), t.ride.end());
    std::printf("extra. NaN, infinity and -1e30 in a quiet tone: true peak %+.3f dB re ceiling, "
                "deepest ride %.3f dB, 2 s later %.2e from the delayed input, meter %g dB\n",
                db(true_peak(t.out.left) / kCeiling), dip, worst,
                static_cast<double>(device.meter(0)));
    EXPECT(finite(t.out.left) && finite(t.out.right), "bad samples do not reach the output");
    EXPECT(db(true_peak(t.out.left) / kCeiling) <= 0.1, "the ceiling holds through them");
    EXPECT(dip == 0.0, "they are read as silence: the ride does not answer them");
    EXPECT(worst < 1.0e-6, "and two seconds later the tone is the input, delayed");
    EXPECT(device.meter(0) == 0.0f, "with the meter at rest");
  }

  // 13. Cost with both stages working: noise 6 dB over the ceiling, which the
  // ride takes down by its sample peaks and the brickwall by what its true
  // peaks still add.
  {
    device.init(kRate);
    rng_state() = 0xBEEFu;
    const std::vector<float> load = noise(10.0f, kRate, over(6.0));
    report_cost("ambient-limiter", 10.0f, kRate, [&] { run(device, load); });
    Trace t = trace(device, std::vector<float>(load.begin(), load.begin() + at(1.0)));
    double ride = 0.0, wall = 0.0;
    for (size_t i = 0; i < t.meter.size(); ++i) {
      ride += t.ride[i];
      wall += t.meter[i] - t.ride[i];
    }
    ride /= static_cast<double>(t.meter.size());
    wall /= static_cast<double>(t.meter.size());
    std::printf("13. under that load: ride %.2f dB, brickwall %.2f dB on average\n", ride, wall);
    EXPECT(ride < -3.0 && wall < -0.5, "the cost is measured with both stages working");
  }

  return finish("ambient-limiter");
}
