// Native harness for Micro Looper (cpp/devices/micro-looper). After the
// conformance pass it asserts what makes it a looper: Hold repeats what was
// just played with the period Length / speed and never fades, the clock and
// the speed move pitch and length together, the join does not click, and
// Auto renews the loop on new playing and lets it die away to sleep.

#include "../devices/micro-looper/micro_looper.h"

#include "support/test_kit.h"

using namespace testkit;
using livemix::MicroLooper;
namespace p = livemix::micro_looper;

static MicroLooper device;

static const float kRate = 48000.0f;

enum State { kListen = 0, kHold = 1, kAuto = 2 };
enum Speed { kRev2 = 0, kRev = 1, kRevHalf = 2, kHalf = 3, kNormal = 4, kDouble = 5 };

// Wet only, and nothing that blurs a measurement: no grains, no drift, no
// side signal, the tone filter wide open. Starts in Listen.
static void plain(MicroLooper& d, float length_seconds, float rate = kRate) {
  d.init(rate);
  d.set_param(p::kState, kListen);
  d.set_param(p::kLength, length_seconds);
  d.set_param(p::kSmear, 0.0f);
  d.set_param(p::kDrift, 0.0f);
  d.set_param(p::kSpread, 0.0f);
  d.set_param(p::kTone, 16000.0f);
  d.set_param(p::kMix, 1.0f);
}

// A phrase that is not periodic in itself: noise shaped by a decaying
// envelope over a steady tone, so a loop of it has one clear period.
static std::vector<float> phrase(float seconds, float hz, uint32_t seed, float rate = kRate) {
  rng_state() = seed;
  std::vector<float> out(static_cast<size_t>(seconds * rate));
  for (size_t i = 0; i < out.size(); ++i) {
    const double t = static_cast<double>(i) / rate;
    out[i] = static_cast<float>(0.25 * std::sin(2.0 * kPi * hz * t) +
                                0.2 * white() * std::exp(-3.0 * t / seconds));
  }
  return out;
}

// Normalised correlation of x[from, from + n) with y[at, at + n).
static double match(const std::vector<float>& x, size_t from, const std::vector<float>& y, size_t at,
                    size_t n) {
  double sxy = 0.0, sxx = 0.0, syy = 0.0;
  for (size_t i = 0; i < n && from + i < x.size() && at + i < y.size(); ++i) {
    sxy += static_cast<double>(x[from + i]) * y[at + i];
    sxx += static_cast<double>(x[from + i]) * x[from + i];
    syy += static_cast<double>(y[at + i]) * y[at + i];
  }
  return (sxx > 0.0 && syy > 0.0) ? sxy / std::sqrt(sxx * syy) : 0.0;
}

// The lag in [lo, hi] samples at which x best repeats itself, measured over
// `n` samples from `from`.
static size_t period_of(const std::vector<float>& x, size_t from, size_t n, size_t lo, size_t hi,
                        double* strength = nullptr) {
  size_t best = lo;
  double best_value = -2.0;
  for (size_t lag = lo; lag <= hi; ++lag) {
    const double value = match(x, from, x, from + lag, n);
    if (value > best_value) {
      best_value = value;
      best = lag;
    }
  }
  if (strength) *strength = best_value;
  return best;
}

// x through an eighth-order Butterworth high-pass: what is above `hz`.
static std::vector<float> high_passed(const std::vector<float>& x, double hz, double rate) {
  std::vector<float> out(x);
  for (double q : {0.5098, 0.6013, 0.9000, 2.5629}) {
    const double w = 2.0 * kPi * hz / rate;
    const double alpha = std::sin(w) / (2.0 * q);
    const double cosw = std::cos(w);
    const double a0 = 1.0 + alpha;
    const double b0 = (1.0 + cosw) * 0.5 / a0, b1 = -(1.0 + cosw) / a0, b2 = b0;
    const double a1 = -2.0 * cosw / a0, a2 = (1.0 - alpha) / a0;
    double z1 = 0.0, z2 = 0.0;
    for (float& v : out) {
      const double y = b0 * v + z1;
      z1 = b1 * v - a1 * y + z2;
      z2 = b2 * v - a2 * y;
      v = static_cast<float>(y);
    }
  }
  return out;
}

static double worst_difference(const std::vector<float>& a, const std::vector<float>& b, double gain) {
  double worst = 0.0;
  for (size_t i = 0; i < a.size() && i < b.size(); ++i) {
    worst = std::max(worst, std::fabs(static_cast<double>(a[i]) - gain * b[i]));
  }
  return worst;
}

int main() {
  Conformance spec;
  spec.name = "micro-looper";
  spec.num_params = p::kNumParams;
  spec.mins = p::kParamMin;
  spec.maxs = p::kParamMax;
  spec.defaults = p::kParamDefault;
  spec.tail_seconds = 95.0f;
  spec.max_peak = 2.5f;
  check_effect(device, spec, kRate);

  // How long the default patch (Auto, Fade 0.85, a 2 s loop) really rings:
  // 43 passes to -60 dB, then it is let go. Keeps tail_seconds honest.
  {
    device.init(kRate);
    rng_state() = 0x1234567u;
    run(device, noise(1.0f, kRate, 0.5f));
    Stereo tail = render(device, 120.0f, kRate);
    size_t last = 0;
    for (size_t i = 0; i < tail.size(); ++i) {
      if (tail.left[i] != 0.0f || tail.right[i] != 0.0f) last = i;
    }
    const double seconds = static_cast<double>(last) / kRate;
    std::printf("micro-looper: default patch silent %.1f s after the input stops\n", seconds);
    EXPECT(seconds > 60.0 && seconds < 95.0, "the default tail is finite and ends within tail_seconds");
  }

  // Listen is the dry path alone, and Mix 0 is the input bit for bit in
  // every state, with a loop playing or not.
  {
    std::vector<float> input = phrase(3.0f, 330.0f, 0xA11CEu);
    device.init(kRate);
    device.set_param(p::kState, kListen);
    Stereo listen = run(device, input);
    const double dry_gain = std::cos(0.25 * kPi);
    std::printf("micro-looper: Listen differs from the dry path by %.3g\n",
                worst_difference(listen.left, input, dry_gain));
    EXPECT(worst_difference(listen.left, input, dry_gain) < 1.0e-6, "Listen passes only the dry signal");
    for (int state : {kListen, kHold, kAuto}) {
      device.init(kRate);
      device.set_param(p::kState, static_cast<float>(state));
      device.set_param(p::kLength, 0.5f);
      device.set_param(p::kMix, 0.0f);
      Stereo out = run(device, input);
      EXPECT(out.left == input && out.right == input, "Mix 0 is the input, bit for bit, in every state");
    }
  }

  // Hold: what was just played becomes a loop with the period Length, at the
  // level it was played, and it is still there half a minute later.
  {
    const float length = 0.75f;
    std::vector<float> input = phrase(2.0f, 220.0f, 0xBEE5u);
    plain(device, length);
    run(device, input);
    device.set_param(p::kState, kHold);
    Stereo held = render(device, 32.0f, kRate);
    const size_t n = static_cast<size_t>(length * kRate);
    double strength = 0.0;
    const size_t period = period_of(held.left, 4800, 6000, n - 600, n + 600, &strength);
    std::printf("micro-looper: Hold period %zu samples (Length is %zu), self-match %.4f\n", period, n,
                strength);
    EXPECT(period == n && strength > 0.999, "Hold repeats with the period Length");
    // The loop is the last Length seconds of the input, sample for sample.
    const double same = match(held.left, 2400, input, input.size() - n + 2400, n / 2);
    std::printf("micro-looper: Hold against what was played: correlation %.5f\n", same);
    EXPECT(same > 0.9999, "the loop is the last Length seconds that were played");
    const double early = rms(held.left, 0, 4 * n);
    const double late = rms(held.left, 40 * n, 42 * n);
    std::printf("micro-looper: Hold level after 30 s: %+.3f dB\n", db(late / early));
    EXPECT(std::fabs(db(late / early)) < 0.1, "a held loop never fades");
    EXPECT(std::fabs(db(early / rms(input, input.size() - n, input.size()))) < 0.5,
           "a held loop plays at the level it was played");
  }

  // Speed: Half is an octave down and twice as long, Double an octave up and
  // half as long, Reverse is the capture backwards.
  {
    const float length = 0.5f;
    const size_t n = static_cast<size_t>(length * kRate);
    std::vector<float> input = phrase(1.5f, 440.0f, 0xD0C5u);
    struct Case {
      int speed;
      double ratio;
    };
    for (const Case& c : {Case{kHalf, 0.5}, Case{kNormal, 1.0}, Case{kDouble, 2.0}, Case{kRev, 1.0}}) {
      plain(device, length);
      device.set_param(p::kSpeed, static_cast<float>(c.speed));
      run(device, input);
      device.set_param(p::kState, kHold);
      Stereo held = render(device, 6.0f, kRate);
      const size_t expected = static_cast<size_t>(n / c.ratio);
      const size_t period = period_of(held.left, 48000, 6000, expected - 400, expected + 400);
      const double hz = dominant_frequency(held.left, kRate, 440.0 * c.ratio * 0.9,
                                           440.0 * c.ratio * 1.1, 48000, 5 * 48000);
      std::printf("micro-looper: speed %d: period %zu (expected %zu), tone %.2f Hz\n", c.speed, period,
                  expected, hz);
      EXPECT(std::llabs(static_cast<long long>(period) - static_cast<long long>(expected)) <= 1,
             "the loop's period is Length over the speed");
      EXPECT_NEAR(hz, 440.0 * c.ratio, 0.5, "the loop's pitch follows the speed");
      if (c.speed == kRev) {
        // One pass of the held loop, reversed, against the capture.
        std::vector<float> backwards(held.left.begin() + 4 * n, held.left.begin() + 6 * n);
        std::reverse(backwards.begin(), backwards.end());
        double best = 0.0;
        for (size_t lag = 0; lag < n; lag += 1) {
          best = std::max(best, match(backwards, lag, input, input.size() - n + 2400, n / 2));
        }
        std::printf("micro-looper: Reverse against the reversed capture: correlation %.4f\n", best);
        EXPECT(best > 0.99, "Reverse plays the capture backwards");
      }
    }
  }

  // Clock: a loop captured at Full and then clocked at 1/2 is an octave down,
  // twice as long, and has nothing left in the top octave.
  {
    const float length = 0.5f;
    const size_t n = static_cast<size_t>(length * kRate);
    rng_state() = 0xC10Cu;
    std::vector<float> input = noise(1.0f, kRate, 0.2f);
    for (size_t i = 0; i < input.size(); ++i) {
      input[i] += 0.2f * static_cast<float>(std::sin(2.0 * kPi * 1000.0 * static_cast<double>(i) / kRate));
    }
    plain(device, length);
    run(device, input);
    device.set_param(p::kState, kHold);
    Stereo full = render(device, 4.0f, kRate);
    device.set_param(p::kClock, 3.0f);
    render(device, 0.5f, kRate);
    Stereo slow = render(device, 6.0f, kRate);
    const size_t full_period = period_of(full.left, 48000, 6000, n - 400, n + 400);
    const size_t slow_period = period_of(slow.left, 48000, 6000, 2 * n - 400, 2 * n + 400);
    const double full_hz = dominant_frequency(full.left, kRate, 900.0, 1100.0, 48000, 4 * 48000);
    const double slow_hz = dominant_frequency(slow.left, kRate, 450.0, 550.0, 48000, 6 * 48000);
    const double full_top = rms(high_passed(full.left, 12000.0, kRate), 48000);
    const double slow_top = rms(high_passed(slow.left, 12000.0, kRate), 48000);
    std::printf("micro-looper: clock 1/2: period %zu -> %zu, tone %.2f -> %.2f Hz, above 12 kHz %.1f -> %.1f dB\n",
                full_period, slow_period, full_hz, slow_hz, db(full_top), db(slow_top));
    EXPECT(full_period == n && slow_period == 2 * n, "clock 1/2 doubles the loop's period");
    EXPECT_NEAR(full_hz, 1000.0, 0.5, "at full clock the loop is at pitch");
    EXPECT_NEAR(slow_hz, 500.0, 0.5, "clock 1/2 halves the loop's pitch");
    EXPECT(db(full_top) - db(slow_top) > 30.0, "clock 1/2 takes at least 30 dB off the top octave");
  }

  // Recorded and played at a low clock the pitch is unchanged, the top is
  // gone, and what folds back from above the clock's Nyquist stays low.
  {
    plain(device, 1.0f);
    device.set_param(p::kClock, 6.0f);  // 1/4: 12 kHz, band-limited near 4.3 kHz
    std::vector<float> low = sine(1000.0f, 1.5f, kRate, 0.25f);
    run(device, low);
    device.set_param(p::kState, kHold);
    Stereo held = render(device, 3.0f, kRate);
    const double level = tone_level(held.left, 1000.0, kRate, 48000, 3 * 48000);
    std::printf("micro-looper: 1 kHz through clock 1/4: %.2f dB of its level\n", db(level / 0.25));
    EXPECT(std::fabs(db(level / 0.25)) < 1.0, "a low clock passes what is inside its band at pitch and level");

    // 8 kHz is above the 6 kHz Nyquist of clock 1/4: it would fold to 4 kHz.
    plain(device, 1.0f);
    device.set_param(p::kClock, 6.0f);
    run(device, sine(8000.0f, 1.5f, kRate, 0.25f));
    device.set_param(p::kState, kHold);
    Stereo folded = render(device, 3.0f, kRate);
    const double alias = rms(folded.left, 48000, 3 * 48000) / (0.25 * std::sqrt(0.5));
    std::printf("micro-looper: 8 kHz through clock 1/4 comes back at %.1f dB\n", db(alias));
    EXPECT(db(alias) < -30.0, "what a low clock folds back is at least 30 dB down");
  }

  // The loop point: a held sine whose ends do not line up joins without a
  // click (a hard splice here would jump by up to the sine's full swing).
  {
    const float length = 0.3f, hz = 233.0f, gain = 0.5f;
    plain(device, length);
    run(device, sine(hz, 1.0f, kRate, gain));
    device.set_param(p::kState, kHold);
    Stereo held = render(device, 4.0f, kRate);
    const double natural = gain * 2.0 * kPi * hz / kRate;
    const double worst = max_step(held.left, 4800);
    std::printf("micro-looper: loop point: largest step %.4f (the sine's own is %.4f)\n", worst, natural);
    EXPECT(worst < 1.5 * natural, "the loop point is cross-faded, not spliced");
    EXPECT(rms(held.left, 48000, 4 * 48000) > 0.3, "and the loop is still there");
  }

  // Smear: a loop that jumps from loud to quiet at its join. The plain loop
  // keeps that edge; grains from around the playhead blur it.
  {
    const float length = 1.0f;
    const size_t n = static_cast<size_t>(length * kRate);
    rng_state() = 0x5EA4u;
    std::vector<float> input = noise(1.0f, kRate, 0.03f);
    for (size_t i = n / 2; i < n; ++i) input[i] *= 15.0f;
    double variance[2] = {0.0, 0.0};
    for (int smeared = 0; smeared < 2; ++smeared) {
      plain(device, length);
      device.set_param(p::kSmear, smeared ? 1.0f : 0.0f);
      run(device, input);
      device.set_param(p::kState, kHold);
      Stereo held = render(device, 9.0f, kRate);
      // RMS in 10 ms windows across +-150 ms of the join, over six passes.
      double sum = 0.0, sum_squares = 0.0;
      int count = 0;
      for (int pass = 2; pass < 8; ++pass) {
        for (int w = -15; w < 15; ++w) {
          const size_t from = pass * n + w * 480;
          const double level = rms(held.left, from, from + 480);
          sum += level;
          sum_squares += level * level;
          ++count;
        }
      }
      variance[smeared] = sum_squares / count - (sum / count) * (sum / count);
    }
    std::printf("micro-looper: envelope variance across the join: plain %.5f, Smear 1 %.5f\n",
                variance[0], variance[1]);
    EXPECT(variance[1] < 0.65 * variance[0], "Smear blurs the level step at the join");
  }

  // Auto: each new phrase replaces the loop, every pass is quieter by Fade,
  // and once it has died the device sleeps.
  {
    const float length = 1.0f, fade = 0.5f;
    const size_t n = static_cast<size_t>(length * kRate);
    plain(device, length);
    device.set_param(p::kState, kAuto);
    device.set_param(p::kFade, fade);
    std::vector<float> input = sine(300.0f, 0.6f, kRate, 0.4f);
    input.resize(4 * n, 0.0f);
    std::vector<float> second = sine(700.0f, 0.6f, kRate, 0.4f);
    input.insert(input.end(), second.begin(), second.end());
    input.resize(20 * n, 0.0f);
    Stereo out = run(device, input);
    // First phrase: looping from 1 s. Passes 1, 2 and 3 of it.
    const double a1 = tone_level(out.left, 300.0, kRate, 1 * n, 2 * n - 4800);
    const double a2 = tone_level(out.left, 300.0, kRate, 2 * n, 3 * n - 4800);
    const double a3 = tone_level(out.left, 300.0, kRate, 3 * n, 4 * n - 4800);
    std::printf("micro-looper: Auto passes of the first phrase: %.4f %.4f %.4f (ratio %.3f, Fade %.2f)\n",
                a1, a2, a3, a3 / a2, fade);
    EXPECT(a1 > 0.1, "Auto loops the phrase one Length after it began");
    EXPECT_NEAR(a3 / a2, fade, 0.02, "each pass is quieter by Fade");
    // Second phrase from 4 s: looping from 5 s, and the first one is gone.
    const double old_tone = tone_level(out.left, 300.0, kRate, 5 * n + 4800, 6 * n - 4800);
    const double new_tone = tone_level(out.left, 700.0, kRate, 5 * n + 4800, 6 * n - 4800);
    std::printf("micro-looper: Auto after the second phrase: 700 Hz %.4f, 300 Hz %.6f\n", new_tone,
                old_tone);
    EXPECT(new_tone > 0.1 && old_tone < 0.01 * new_tone, "a new phrase takes the loop's place");
    // Fade 0.5 reaches -60 dB after ten passes; then it lets go and sleeps.
    size_t last = 0;
    for (size_t i = 0; i < out.size(); ++i) {
      if (out.left[i] != 0.0f || out.right[i] != 0.0f) last = i;
    }
    const double seconds = static_cast<double>(last) / kRate;
    std::printf("micro-looper: Auto with Fade 0.5: asleep %.2f s in (second loop from 5 s)\n", seconds);
    EXPECT(seconds > 14.0 && seconds < 18.0, "the loop dies away at the rate Fade sets");
    Stereo rest = render(device, 1.0f, kRate);
    EXPECT(peak(rest.left) == 0.0 && peak(rest.right) == 0.0, "and the device is asleep: exact zeros");
  }

  // Hold on an empty memory waits for the first phrase, then keeps it; a
  // held loop keeps the device awake however long nothing comes in.
  {
    const float length = 0.5f;
    const size_t n = static_cast<size_t>(length * kRate);
    plain(device, length);
    device.set_param(p::kState, kHold);
    Stereo before = render(device, 1.0f, kRate);
    EXPECT(peak(before.left) == 0.0, "Hold with nothing played is silent (and asleep)");
    std::vector<float> input = sine(440.0f, 0.3f, kRate, 0.4f);
    input.resize(2 * n, 0.0f);
    Stereo during = run(device, input);
    Stereo after = render(device, 60.0f, kRate);
    const double first = tone_level(during.left, 440.0, kRate, n, n + 12000);
    const double late = tone_level(after.left, 440.0, kRate, 118 * n, 118 * n + 12000);
    std::printf("micro-looper: Hold from empty: first pass %.4f, a minute later %.4f\n", first, late);
    EXPECT(first > 0.2, "Hold from empty takes the next phrase");
    EXPECT_NEAR(late, first, 0.002, "and holds it: awake and at level a minute later");
  }

  // Handling it while it sounds: Speed (through a stop into reverse), Clock,
  // Length and State all move a held sine without a click.
  {
    const float hz = 220.0f, gain = 0.5f;
    const double natural = gain * 2.0 * kPi * hz / kRate;
    plain(device, 1.0f);
    run(device, sine(hz, 2.0f, kRate, gain));
    device.set_param(p::kState, kHold);
    render(device, 0.5f, kRate);
    double worst_speed = 0.0;
    for (int speed : {kHalf, kRev, kDouble, kRev2, kNormal}) {
      device.set_param(p::kSpeed, static_cast<float>(speed));
      Stereo out = render(device, 0.7f, kRate);
      worst_speed = std::max(worst_speed, max_step(out.left));
    }
    double worst_clock = 0.0;
    for (int clock : {3, 7, 1, 0}) {
      device.set_param(p::kClock, static_cast<float>(clock));
      Stereo out = render(device, 0.7f, kRate);
      worst_clock = std::max(worst_clock, max_step(out.left));
    }
    double worst_length = 0.0;
    for (float length : {0.2f, 0.11f, 1.7f, 0.5f}) {
      device.set_param(p::kLength, length);
      Stereo out = render(device, 0.7f, kRate);
      worst_length = std::max(worst_length, max_step(out.left));
    }
    double worst_state = 0.0;
    for (int state : {kListen, kHold, kAuto, kListen}) {
      device.set_param(p::kState, static_cast<float>(state));
      Stereo out = run(device, sine(hz, 0.7f, kRate, gain * 0.5f));
      worst_state = std::max(worst_state, max_step(out.left));
    }
    std::printf("micro-looper: largest step moving Speed %.4f, Clock %.4f, Length %.4f, State %.4f (the sine's own %.4f)\n",
                worst_speed, worst_clock, worst_length, worst_state, natural);
    // Double speed doubles the sine's own step; a crossfade of two phases adds 41 %.
    EXPECT(worst_speed < 2.0 * 1.45 * natural, "a Speed change glides like tape, without a click");
    EXPECT(worst_clock < 1.45 * natural, "a Clock change glides without a click");
    EXPECT(worst_length < 1.45 * natural, "a Length change cross-fades without a click");
    EXPECT(worst_state < 1.45 * natural, "a State change fades without a click");
  }

  // BEHAVIOUR CHECKS GO HERE

  return finish("micro-looper");
}
