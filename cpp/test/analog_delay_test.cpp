// Native harness for Analog Delay (cpp/devices/analog-delay). The conformance
// pass covers stability, silence when idle, block-size independence and
// parameter abuse; the rest asserts what makes it a bucket-brigade delay.

#include "../devices/analog-delay/analog_delay.h"
#include "support/test_kit.h"

using namespace testkit;
using livemix::AnalogDelay;
namespace p = livemix::analog_delay;

static AnalogDelay device;

static const float kRate = 48000.0f;

// Wet only, one steady clean line: no modulation, no stereo, a new circuit.
static void clean(AnalogDelay& d, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kModDepth, 0.0f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kAge, 0.0f);
  d.set_param(p::kFeedback, 0.0f);
  d.set_param(p::kMix, 1.0f);
}

// A tone that lasts `on_seconds` with 5 ms raised-cosine edges, then silence.
static std::vector<float> burst(float hz, float on_seconds, float seconds, float rate, float gain) {
  std::vector<float> x = sine(hz, seconds, rate, gain);
  const size_t on = static_cast<size_t>(on_seconds * rate);
  const size_t edge = static_cast<size_t>(0.005f * rate);
  for (size_t i = 0; i < x.size(); ++i) {
    double g = 0.0;
    if (i < on) {
      g = 1.0;
      if (i < edge) g = 0.5 - 0.5 * std::cos(kPi * i / edge);
      if (i > on - edge) g = 0.5 - 0.5 * std::cos(kPi * (on - i) / edge);
    }
    x[i] *= static_cast<float>(g);
  }
  return x;
}

// A 30 ms rumble (noise through two 500 Hz low-passes): a probe every Tone
// and Time setting passes, for timing the echo.
static std::vector<float> thump(float seconds, float rate) {
  rng_state() = 0x777u;
  std::vector<float> x = noise(0.03f, rate, 0.2f);
  const double a = std::exp(-2.0 * kPi * 500.0 / rate);
  double s1 = 0.0, s2 = 0.0;
  for (float& v : x) {
    s1 = v + (s1 - v) * a;
    s2 = s1 + (s2 - s1) * a;
    v = static_cast<float>(s2);
  }
  x.resize(static_cast<size_t>(seconds * rate), 0.0f);
  return x;
}

// The lag in samples (to a fraction) at which `y` best matches the first `n`
// samples of `x`, searched in [lo, hi].
static double best_lag(const std::vector<float>& x, const std::vector<float>& y, int lo, int hi,
                       size_t n) {
  std::vector<double> score(static_cast<size_t>(hi - lo + 1));
  int best = lo;
  for (int lag = lo; lag <= hi; ++lag) {
    double sum = 0.0;
    for (size_t i = 0; i < n && i + lag < y.size(); ++i) sum += static_cast<double>(x[i]) * y[i + lag];
    score[lag - lo] = sum;
    if (sum > score[best - lo]) best = lag;
  }
  if (best == lo || best == hi) return best;
  const double a = score[best - lo - 1], b = score[best - lo], c = score[best - lo + 1];
  return best + 0.5 * (a - c) / (a - 2.0 * b + c);
}

static size_t at(double seconds, float rate = kRate) { return static_cast<size_t>(seconds * rate); }

// Share of the energy of x over [from, to) that lies above `hz`, split by a
// fourth-order Butterworth high-pass (steep enough to tell 2 kHz from 4 kHz).
static double share_above(const std::vector<float>& x, float hz, size_t from, size_t to) {
  livemix::kit::Biquad section[2];
  section[0].set_highpass(hz, 0.5411961f, kRate);
  section[1].set_highpass(hz, 1.3065630f, kRate);
  double high = 0.0, total = 0.0;
  for (size_t i = from; i < to && i < x.size(); ++i) {
    const float y = section[1].process(section[0].process(x[i]));
    high += static_cast<double>(y) * y;
    total += static_cast<double>(x[i]) * x[i];
  }
  return total > 0.0 ? high / total : 0.0;
}

// RMS of what is left of x over [from, to) once `harmonics` harmonics of
// `hz` are taken out (the window must hold a whole number of periods): the
// noise under a tone.
static double residual_rms(const std::vector<float>& x, double hz, size_t from, size_t to,
                           int harmonics) {
  std::vector<double> r(x.begin() + from, x.begin() + to);
  const double n = static_cast<double>(r.size());
  for (int h = 1; h <= harmonics; ++h) {
    double c = 0.0, s = 0.0;
    for (size_t i = 0; i < r.size(); ++i) {
      const double phase = 2.0 * kPi * hz * h * static_cast<double>(from + i) / kRate;
      c += r[i] * std::cos(phase);
      s += r[i] * std::sin(phase);
    }
    c *= 2.0 / n;
    s *= 2.0 / n;
    for (size_t i = 0; i < r.size(); ++i) {
      const double phase = 2.0 * kPi * hz * h * static_cast<double>(from + i) / kRate;
      r[i] -= c * std::cos(phase) + s * std::sin(phase);
    }
  }
  double sum = 0.0;
  for (double v : r) sum += v * v;
  return std::sqrt(sum / n);
}

int main() {
  Conformance spec;
  spec.name = "analog-delay";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 16.0f;
  spec.max_peak = 4.0f;
  check_effect(device, spec, kRate);

  // 1. The echo arrives at Time, at every sample rate and across the range,
  // whatever Tone does to the filters on the way.
  for (float rate : {44100.0f, 48000.0f, 96000.0f}) {
    double worst = 0.0;
    for (float ms : {20.0f, 95.0f, 380.0f, 1200.0f}) {
      for (float tone : {800.0f, 8000.0f}) {
        clean(device, rate);
        device.set_param(p::kTime, ms);
        device.set_param(p::kTone, tone);
        const std::vector<float> x = thump(ms * 0.0013f + 0.1f, rate);
        Stereo out = run(device, x);
        const double want = ms * 0.001 * rate;
        const double lag = best_lag(x, out.left, static_cast<int>(want * 0.9),
                                    static_cast<int>(want * 1.1) + 4, at(0.03, rate));
        worst = std::max(worst, std::fabs(lag - want) / want);
      }
    }
    std::printf("echo time error at %.0f Hz: worst %.3f %%\n", rate, 100.0 * worst);
    EXPECT(worst < 0.01, "the echo arrives at Time within 1 % from 20 ms to 1.2 s");
  }

  // 2. Each repeat is the one before times Feedback, and the first repeat of
  // a steady tone comes back at the level it went in.
  for (float feedback : {0.3f, 0.5f, 0.8f}) {
    clean(device);
    device.set_param(p::kTime, 300.0f);
    device.set_param(p::kFeedback, feedback);
    Stereo out = run(device, burst(500.0f, 0.15f, 1.6f, kRate, 0.25f));
    double level[4];
    for (int k = 0; k < 4; ++k) level[k] = rms(out.left, at(0.3 * (k + 1) + 0.03), at(0.3 * (k + 1) + 0.13));
    const double first = db(level[0] * std::sqrt(2.0) / 0.25);
    std::printf("feedback %.1f: first repeat %+.2f dB, ratios %.3f %.3f %.3f\n", feedback, first,
                level[1] / level[0], level[2] / level[1], level[3] / level[2]);
    EXPECT_NEAR(first, 0.0, 1.0, "the first repeat of a tone is at the level of the tone");
    for (int k = 1; k < 4; ++k) {
      EXPECT_NEAR(level[k] / level[k - 1], feedback, 0.06 * feedback, "each repeat is down by Feedback");
    }
  }

  // 3. Mix 0 is the dry signal, bit for bit.
  {
    device.init(kRate);
    device.set_param(p::kMix, 0.0f);
    rng_state() = 0x51u;
    const std::vector<float> x = noise(0.5f, kRate, 0.5f);
    Stereo out = run(device, x);
    EXPECT(out.left == x && out.right == x, "Mix 0 passes the input through unchanged");
  }

  // 4. The bandwidth falls as Time rises (the clock slows and the filters
  // follow it), and Tone moves the corner while the clock allows.
  {
    auto brightness = [&](float ms, float tone, float split = 4000.0f) {
      clean(device);
      device.set_param(p::kTime, ms);
      device.set_param(p::kTone, tone);
      rng_state() = 0xC0FFEEu;
      std::vector<float> x = noise(0.3f, kRate, 0.2f);
      x.resize(at(ms * 0.001 + 0.4), 0.0f);
      Stereo out = run(device, x);
      return share_above(out.left, split, at(ms * 0.001 + 0.05), at(ms * 0.001 + 0.3));
    };
    const double at_100 = brightness(100.0f, 8000.0f);
    const double at_600 = brightness(600.0f, 8000.0f);
    const double at_1200 = brightness(1200.0f, 8000.0f);
    const double dark = brightness(100.0f, 1000.0f);
    const double mid = brightness(100.0f, 3200.0f);
    std::printf("share of the first repeat above 4 kHz: %.4f at 100 ms, %.5f at 600 ms, %.2g at 1.2 s; "
                "Tone 1 kHz %.2g, 3.2 kHz %.5f, 8 kHz %.4f\n",
                at_100, at_600, at_1200, dark, mid, at_100);
    EXPECT(at_600 < 0.5 * at_100, "a 600 ms echo is darker than a 100 ms one");
    EXPECT(at_1200 < 0.1 * at_600, "a 1.2 s echo is darker again");
    EXPECT(dark < 0.1 * mid && mid < 0.5 * at_100, "Tone moves the corner of the echo");

    // Dark, not muffled: the clock leaves Tone its whole range at the default
    // Time, and the longest echoes still carry the band a pad or a piano is
    // heard by (to about 2.9 kHz at 900 ms and 2.2 kHz at 1.2 s).
    const double open_380 = brightness(380.0f, 8000.0f);
    const double shut_380 = brightness(380.0f, 3200.0f);
    const double long_900 = brightness(900.0f, 8000.0f, 2000.0f);
    const double long_1200 = brightness(1200.0f, 8000.0f, 1500.0f);
    std::printf("share above 4 kHz at 380 ms: %.4f at Tone 8 kHz, %.4f at 3.2 kHz; "
                "above 2 kHz at 900 ms %.3f, above 1.5 kHz at 1.2 s %.3f\n",
                open_380, shut_380, long_900, long_1200);
    EXPECT(open_380 > 10.0 * shut_380, "Tone is not held down by the clock at the default Time");
    EXPECT(long_900 > 0.15, "a 900 ms echo keeps its band up to 2 kHz and beyond");
    EXPECT(long_1200 > 0.15, "a 1.2 s echo keeps its band up to 1.5 kHz and beyond");
  }

  // 5. Pitch follows the clock. Halve Time under a 440 Hz tone: what is in
  // the line plays an octave up until the line has emptied (one new delay
  // time), then the echo is back at 440 Hz.
  {
    clean(device);
    device.set_param(p::kTime, 400.0f);
    run(device, sine(440.0f, 1.0f, kRate, 0.2f));
    device.set_param(p::kTime, 200.0f);
    Stereo out = run(device, sine(440.0f, 1.0f, kRate, 0.2f));
    const double during = dominant_frequency(out.left, kRate, 200.0, 1800.0, at(0.11), at(0.19));
    const double after = dominant_frequency(out.left, kRate, 200.0, 1800.0, at(0.45), at(0.9));
    std::printf("Time 400 -> 200 ms under 440 Hz: %.1f Hz while the line empties, %.1f Hz after\n",
                during, after);
    EXPECT_NEAR(during, 880.0, 8.8, "halving Time plays the line an octave up");
    EXPECT_NEAR(after, 440.0, 2.0, "and the pitch settles once the line has emptied");
    EXPECT(max_step(out.left) < 0.14, "a Time jump does not click");
  }

  // 6. The step sequence: base, Interval A, base, Interval B, one slot per
  // Step repeats. With Time 400 ms and Step 1 the clock steps up at 0.4 s and
  // 1.2 s and back at 0.8 s. A step up plays the line at the interval until
  // it has emptied (a shorter time, at the faster clock), then at pitch; the
  // step back plays what the fast clock wrote, down by the same interval.
  {
    auto track = [&](float a, float b, double from, double to) {
      clean(device);
      device.set_param(p::kTime, 400.0f);
      device.set_param(p::kIntervalA, a);
      device.set_param(p::kIntervalB, b);
      device.set_param(p::kStep, 0.0f);
      Stereo out = run(device, sine(440.0f, 1.7f, kRate, 0.2f));
      EXPECT(max_step(out.left) < 0.14, "a clock step does not click");
      return dominant_frequency(out.left, kRate, 150.0, 1800.0, at(from), at(to));
    };
    const double octave_up = track(6.0f, 0.0f, 1.22, 1.38);
    const double octave_settled = track(6.0f, 0.0f, 1.43, 1.58);
    const double octave_back = track(6.0f, 0.0f, 0.85, 1.15);
    const double fifth_up = track(5.0f, 0.0f, 1.22, 1.44);
    const double fifth_back = track(5.0f, 0.0f, 0.85, 1.15);
    const double fourth_down = track(3.0f, 0.0f, 1.25, 1.55);
    const double second_slot = track(6.0f, 5.0f, 1.22, 1.44);
    std::printf("steps under 440 Hz: octave up %.1f, settled %.1f, back %.1f; fifth up %.1f, back %.1f; "
                "fourth down %.1f; Interval B (fifth up) in its slot %.1f Hz\n",
                octave_up, octave_settled, octave_back, fifth_up, fifth_back, fourth_down, second_slot);
    EXPECT_NEAR(octave_up, 880.0, 8.8, "Octave up doubles the pitch of the line");
    EXPECT_NEAR(octave_settled, 440.0, 4.4, "the pitch settles once the line has emptied");
    EXPECT_NEAR(octave_back, 220.0, 2.2, "the step back plays an octave down");
    EXPECT_NEAR(fifth_up, 660.0, 6.6, "Fifth up plays the line at 3/2");
    EXPECT_NEAR(fifth_back, 293.33, 2.9, "and back at 2/3");
    EXPECT_NEAR(fourth_down, 330.0, 3.3, "Fourth down plays the line at 3/4");
    EXPECT_NEAR(second_slot, 660.0, 6.6, "Interval B takes the second step");
  }

  // 7. Glide slows the step: the pitch slides instead of jumping.
  {
    auto early = [&](float glide) {
      clean(device);
      device.set_param(p::kTime, 400.0f);
      device.set_param(p::kIntervalA, 6.0f);
      device.set_param(p::kStep, 0.0f);
      device.set_param(p::kGlide, glide);
      Stereo out = run(device, sine(440.0f, 1.0f, kRate, 0.2f));
      // The 40 ms after the first step up, at 0.4 s.
      return dominant_frequency(out.left, kRate, 300.0, 1800.0, at(0.41), at(0.45));
    };
    const double jump = early(0.0f);
    const double slide = early(1.0f);
    std::printf("40 ms after an octave step: %.1f Hz with Glide 0, %.1f Hz with Glide 1\n", jump, slide);
    EXPECT_NEAR(jump, 880.0, 18.0, "Glide 0 jumps straight to the interval");
    EXPECT(slide > 445.0 && slide < 560.0, "Glide 1 is still sliding up 40 ms later");
  }

  // 8. Mod Depth wobbles the clock by up to 3 %. The echo's pitch is the
  // clock now over the clock when it was written, so its vibrato is
  // 2 x deviation x sin(pi x rate x time): greatest when the delay is half a
  // cycle of the wobble, none when it is a whole cycle.
  {
    auto cents = [&](float ms, float hz, float depth) {
      clean(device);
      device.set_param(p::kTime, ms);
      device.set_param(p::kModRate, hz);
      device.set_param(p::kModDepth, depth);
      Stereo out = run(device, sine(1000.0f, 5.0f, kRate, 0.2f));
      // Frequency in 20 ms windows: half the spread between the highest and
      // the lowest, in cents.
      double lo = 1.0e9, hi = 0.0;
      for (double t = 1.0; t < 4.9; t += 0.01) {
        const double f = dominant_frequency(out.left, kRate, 850.0, 1180.0, at(t), at(t + 0.02));
        lo = std::min(lo, f);
        hi = std::max(hi, f);
      }
      return 600.0 * std::log2(hi / lo);
    };
    const double full = cents(200.0f, 2.5f, 1.0f);
    const double half = cents(200.0f, 2.5f, 0.5f);
    const double null = cents(400.0f, 2.5f, 1.0f);
    const double still = cents(200.0f, 2.5f, 0.0f);
    std::printf("vibrato at 2.5 Hz: +-%.1f cents at depth 1 (200 ms), +-%.1f at depth 0.5, +-%.1f at 400 ms, "
                "+-%.1f at depth 0\n",
                full, half, null, still);
    // 2 x 0.03 is +-101 cents; the slow drift that rides with it adds a few.
    EXPECT(full > 95.0 && full < 125.0, "Mod Depth 1 is about +-100 cents at half a cycle of delay");
    EXPECT(half > 22.0 && half < 32.0, "Mod Depth is a square law: half gives a quarter");
    EXPECT(null < 0.15 * full, "a delay of one whole cycle cancels the vibrato");
    EXPECT(still < 1.0, "Mod Depth 0 is a steady clock");
  }

  // 9. The compander makes the hiss breathe: it is there under a note and
  // gone in the gaps, and Age turns it up.
  {
    auto hiss = [&](float age, double* under, double* gap) {
      clean(device);
      device.set_param(p::kAge, age);
      Stereo out = run(device, burst(240.0f, 3.0f, 5.0f, kRate, 0.3f));
      *under = db(residual_rms(out.left, 240.0, at(2.0), at(3.0), 30));
      // The echo ends at 3.38 s; 0.4 s later the line is still running.
      *gap = db(rms(out.left, at(3.8), at(4.3)));
    };
    double new_under, new_gap, worn_under, worn_gap;
    hiss(0.0f, &new_under, &new_gap);
    hiss(1.0f, &worn_under, &worn_gap);
    std::printf("hiss under a -10 dBFS tone / in the gap after it: %.1f / %.1f dBFS new, %.1f / %.1f dBFS worn\n",
                new_under, new_gap, worn_under, worn_gap);
    EXPECT(worn_gap < worn_under - 15.0, "worn: the noise floor drops by more than 15 dB in silence");
    EXPECT(worn_under > new_under + 15.0, "Age turns the hiss up");
    EXPECT(worn_under < -45.0 && new_under < -70.0, "the hiss stays under the echo it rides on");

    // Clock bleed: worn and at a long Time the clock itself (8192 samples in
    // 1.2 s, about 6.8 kHz) is a faint whistle under the echo; new, or at a
    // short Time where the clock is far above hearing, there is none.
    auto bleed = [&](float age, float ms) {
      clean(device);
      device.set_param(p::kAge, age);
      device.set_param(p::kTime, ms);
      Stereo out = run(device, burst(240.0f, 4.0f, 4.2f, kRate, 0.1f));
      const double clock = 8192.5 / (ms * 0.001);
      const double hz = dominant_frequency(out.left, kRate, clock * 0.97, clock * 1.03, at(2.0), at(4.0));
      return db(tone_level(out.left, hz, kRate, at(2.0), at(4.0)));
    };
    const double worn_long = bleed(1.0f, 1200.0f);
    const double new_long = bleed(0.0f, 1200.0f);
    const double worn_short = bleed(1.0f, 300.0f);
    std::printf("clock tone under a -20 dBFS note: %.1f dBFS worn at 1.2 s, %.1f new, %.1f worn at 300 ms\n",
                worn_long, new_long, worn_short);
    EXPECT(worn_long > -70.0 && worn_long < -50.0, "a worn line whistles faintly at a long Time");
    EXPECT(new_long < worn_long - 30.0, "a new line does not");
    EXPECT(worn_short < worn_long - 20.0, "nor does a short Time");
  }

  // 10. The compander softens attacks: a tone that starts at full level comes
  // back with a rounded front (the line clips the burst the compressor lets
  // through before it has turned down, and the expander has yet to open),
  // then settles at the level it went in. Age slows the rectifiers, so a
  // worn circuit rounds the front more.
  {
    auto onset = [&](float age, double* front, double* body) {
      clean(device);
      device.set_param(p::kAge, age);
      device.set_param(p::kTime, 200.0f);
      Stereo out = run(device, sine(440.0f, 0.5f, kRate, 0.2f));
      *front = peak(out.left, at(0.2), at(0.2035)) / 0.2;
      *body = peak(out.left, at(0.33), at(0.4)) / 0.2;
    };
    double new_front, new_body, worn_front, worn_body;
    onset(0.0f, &new_front, &new_body);
    onset(1.0f, &worn_front, &worn_body);
    std::printf("an abrupt onset comes back at %.2f of its level in the first 3.5 ms (%.2f worn), "
                "%.2f after 130 ms (%.2f worn)\n",
                new_front, worn_front, new_body, worn_body);
    EXPECT(new_front < 0.7, "the front of the echo is softened");
    EXPECT(worn_front < 0.5 * new_front, "Age softens it further");
    EXPECT(new_body > 0.93 && new_body < 1.03, "the body of the echo is at the input level");
    EXPECT(worn_body > 0.8 && worn_body < 1.03, "worn, it is a little under (the line saturates sooner)");
  }

  // 11. Feedback past 1 runs away into the line's saturation: it sustains,
  // stays bounded and stays dark.
  {
    device.init(kRate);
    device.set_param(p::kFeedback, 1.1f);
    device.set_param(p::kTime, 120.0f);
    device.set_param(p::kMix, 1.0f);
    run(device, sine(330.0f, 0.5f, kRate, 0.5f));
    Stereo late = render(device, 20.0f, kRate);
    const size_t n = late.left.size();
    const double level = rms(late.left, n - 48000, n);
    const double top = std::max(peak(late.left), peak(late.right));
    const double bright = share_above(late.left, 5000.0f, n - 48000, n);
    std::printf("runaway at Feedback 1.1: rms %.1f dBFS, peak %.2f, %.4f of the energy above 5 kHz\n",
                db(level), top, bright);
    EXPECT(finite(late.left) && top < 1.5, "runaway feedback is bounded");
    EXPECT(level > 0.03, "runaway feedback sustains");
    EXPECT(bright < 0.02, "runaway feedback stays dark");
  }

  // 12. Sweeping Time while a note and its repeats sound bends them and
  // never clicks: the line is read stage by stage, not by a moving pointer.
  {
    device.init(kRate);
    device.set_param(p::kFeedback, 0.6f);
    device.set_param(p::kMix, 1.0f);
    const std::vector<float> tone = sine(220.0f, 3.0f, kRate, 0.25f);
    Stereo out;
    for (int k = 0; k < 300; ++k) {
      // 100 moves a second, up and down across the whole range.
      const double sweep = 0.5 - 0.5 * std::cos(2.0 * kPi * k / 150.0);
      device.set_param(p::kTime, static_cast<float>(20.0 * std::pow(60.0, sweep)));
      const std::vector<float> piece(tone.begin() + k * 480, tone.begin() + (k + 1) * 480);
      out = concat(out, run(device, piece));
    }
    const double step = std::max(max_step(out.left), max_step(out.right));
    std::printf("Time swept across its range under a 220 Hz tone: largest step %.4f, peak %.2f\n", step,
                peak(out.left));
    EXPECT(step < 0.12, "a Time sweep bends the repeats without a click");
  }

  // 13. Spread: at 0 the two lines are one (a mono echo of a mono source);
  // turned up they drift apart, and the mono sum of the output stays whole.
  {
    std::vector<float> chord = sine(220.0f, 4.0f, kRate, 0.1f);
    const std::vector<float> third = sine(277.18f, 4.0f, kRate, 0.1f);
    const std::vector<float> top = sine(1318.5f, 4.0f, kRate, 0.05f);
    for (size_t i = 0; i < chord.size(); ++i) chord[i] += third[i] + top[i];
    auto width = [&](float spread, float mix, double* mono_db) {
      device.init(kRate);
      device.set_param(p::kSpread, spread);
      device.set_param(p::kMix, mix);
      Stereo out = run(device, chord);
      std::vector<float> mono(out.size());
      for (size_t i = 0; i < mono.size(); ++i) mono[i] = 0.5f * (out.left[i] + out.right[i]);
      *mono_db = db(rms(mono, at(1.0), at(4.0)) / rms(out.left, at(1.0), at(4.0)));
      return correlation(out.left, out.right, at(1.0), at(4.0));
    };
    double mono_db;
    const double narrow = width(0.0f, 1.0f, &mono_db);
    const double wide = width(1.0f, 1.0f, &mono_db);
    const double as_loaded = width(p::kParamDefault[p::kSpread], p::kParamDefault[p::kMix], &mono_db);
    std::printf("left/right correlation on a mono chord: wet %.3f at Spread 0, %.3f at Spread 1; "
                "default patch %.3f, its mono sum %+.2f dB\n",
                narrow, wide, as_loaded, mono_db);
    EXPECT(narrow > 0.9999, "Spread 0 is a mono echo");
    EXPECT(wide < 0.7, "Spread 1 pulls the two lines apart");
    EXPECT(as_loaded > 0.3, "the default patch stays mostly in phase");
    EXPECT(mono_db > -3.0, "the default patch keeps its level in mono");
  }

  // 14. Sleep: after the tail the device does no work and returns exact
  // zeros, hiss and clock bleed included, and it wakes on new input.
  {
    device.init(kRate);
    device.set_param(p::kAge, 1.0f);
    device.set_param(p::kTime, 1200.0f);
    device.set_param(p::kIntervalA, 1.0f);
    run(device, noise(0.2f, kRate, 0.5f));
    render(device, 30.0f, kRate);
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "asleep after the tail, hiss included");
    Stereo woken = run(device, burst(300.0f, 0.5f, 3.0f, kRate, 0.5f));
    EXPECT(peak(woken.left, at(1.3), at(3.0)) > 0.01, "wakes on new input");
  }

  // 14a. The hiss cannot keep itself going round the loop. Worn, at the
  // longest Time and with Feedback high, the echoes of a phrase are gone in
  // under a minute and the device then sleeps (a hiss gate that the hiss
  // itself could hold open left -83 dBFS of noise for ever).
  {
    device.init(kRate);
    device.set_param(p::kAge, 1.0f);
    device.set_param(p::kTime, 1200.0f);
    device.set_param(p::kFeedback, 0.8f);
    device.set_param(p::kMix, 1.0f);
    run(device, burst(300.0f, 0.5f, 3.0f, kRate, 0.5f));
    Stereo tail = render(device, 70.0f, kRate);
    const double late = std::max(peak(tail.left, at(69.0)), peak(tail.right, at(69.0)));
    std::printf("worn, 1.2 s, Feedback 0.8: %.1f dBFS 30 s after a burst, peak %.1e in the 70th second\n",
                db(rms(tail.left, at(29.0), at(30.0))), late);
    EXPECT(late == 0.0, "the hiss dies with the echoes and the device sleeps");
  }

  // 14b. Knobs turned while the device sleeps are in place when the next
  // note arrives, exactly as if they had been set at load: no glide of the
  // clock left over to bend the front of the first echo.
  {
    const std::vector<float> note = burst(440.0f, 0.3f, 3.0f, kRate, 0.3f);
    auto settings = [&] {
      device.set_param(p::kTime, 900.0f);
      device.set_param(p::kTone, 1500.0f);
      device.set_param(p::kFeedback, 0.7f);
      device.set_param(p::kAge, 0.8f);
      device.set_param(p::kIntervalA, 6.0f);
      device.set_param(p::kGlide, 0.5f);
      device.set_param(p::kMix, 0.6f);
    };
    device.init(kRate);
    settings();
    Stereo at_load = run(device, note);
    device.init(kRate);
    render(device, 0.5f, kRate);
    settings();
    render(device, 0.5f, kRate);
    Stereo asleep = run(device, note);
    EXPECT(asleep.left == at_load.left && asleep.right == at_load.right,
           "parameters set while asleep sound as they do set at load");
  }

  // 14c. A sample that is not a number, or an infinite one, in the input
  // does not lodge in the filters or the line: the echoes that follow are
  // finite and at their usual level.
  for (float bad : {std::nanf(""), HUGE_VALF, -HUGE_VALF}) {
    device.init(kRate);
    device.set_param(p::kMix, 1.0f);
    device.set_param(p::kFeedback, 0.9f);
    std::vector<float> x = sine(330.0f, 1.0f, kRate, 0.3f);
    x[1000] = bad;
    x[1001] = bad;
    Stereo hit = run(device, x);
    Stereo after = run(device, sine(330.0f, 6.0f, kRate, 0.3f));
    EXPECT(finite(hit.left) && finite(hit.right) && finite(after.left) && finite(after.right),
           "a bad input sample does not stick");
    EXPECT(peak(after.left, at(4.0)) < 2.0 && rms(after.left, at(4.0)) > 0.1,
           "and the echoes carry on at their usual level");
  }

  // 15. The same audio whatever the block size, with the sequencer, the
  // hiss and the modulation all running.
  {
    rng_state() = 0xABCDu;
    const std::vector<float> x = noise(1.5f, kRate, 0.3f);
    Stereo reference;
    for (int block : {128, 1, 2048}) {
      device.init(kRate);
      device.set_param(p::kAge, 1.0f);
      device.set_param(p::kTime, 150.0f);
      device.set_param(p::kIntervalA, 5.0f);
      device.set_param(p::kIntervalB, 1.0f);
      device.set_param(p::kStep, 0.0f);
      device.set_param(p::kGlide, 0.4f);
      device.set_param(p::kModDepth, 0.8f);
      device.set_param(p::kSpread, 1.0f);
      Stereo out = run(device, x, block);
      if (block == 128) {
        reference = out;
      } else {
        EXPECT(out.left == reference.left && out.right == reference.right,
               "blocks of 1, 128 and 2048 frames give the same samples");
      }
    }
  }

  device.init(kRate);
  rng_state() = 0xBEEFu;
  std::vector<float> input = noise(10.0f, kRate, 0.25f);
  report_cost("analog-delay", 10.0f, kRate, [&] { run(device, input); });

  return finish("analog-delay");
}
